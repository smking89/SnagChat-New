import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareCandidate, prepareViewer, shrinkTaste } from "./cold-start.ts";
import { CANDIDATES, VIEWERS } from "./fixtures.ts";
import { runPulse } from "./pipeline.ts";
import type { PulseInput } from "./types.ts";
import { DEFAULT_WEIGHTS } from "./types.ts";

function base(partial: Partial<PulseInput> = {}): PulseInput {
  return {
    viewer: VIEWERS[0]!,
    candidates: CANDIDATES,
    query: "",
    limit: 12,
    corpus: { viewers: VIEWERS, candidates: CANDIDATES },
    ...partial,
  };
}

function ids(viewerId: string, query = ""): string[] {
  const viewer = VIEWERS.find((person) => person.id === viewerId) ?? VIEWERS[0]!;
  const result = runPulse(base({ viewer, query }));
  return result.feed.map((item) => item.candidate.id);
}

describe("SnagChat feed ranker", () => {
  it("is deterministic", () => {
    const a = runPulse(base());
    const b = runPulse(base());
    assert.deepEqual(
      a.feed.map((item) => item.candidate.id),
      b.feed.map((item) => item.candidate.id),
    );
    assert.deepEqual(
      a.trace.map((stage) => stage.id),
      ["graph", "affinity", "heat", "search", "sponsor", "merge", "light", "heavy", "gate", "slots"],
    );
  });

  it("puts a followed creator's matching post at the top for Mara", () => {
    const top = ids("mara").slice(0, 3);
    assert.ok(top.includes("c-rust-clip"), `expected the Rust clip in ${top.join(", ")}`);
    assert.ok(top.includes("c-rust-loadout"), `expected the Rust loadout in ${top.join(", ")}`);
  });

  it("reads differently for a clip-only viewer", () => {
    const mara = ids("mara");
    const vivi = ids("vivi");
    const viviRank = vivi.indexOf("c-apex-clip");
    const maraRank = mara.indexOf("c-apex-clip");
    assert.ok(viviRank >= 0 && viviRank < 3, `Vivi top ${vivi.slice(0, 3).join(", ")}`);
    assert.ok(maraRank === -1 || viviRank < maraRank, `apex ranks mara ${maraRank}, vivi ${viviRank}`);
  });

  it("keeps the visibility gate separate from the score", () => {
    const result = runPulse(base());
    assert.equal(result.feed.some((item) => item.candidate.id === "c-hold"), false);
    assert.equal(result.feed.some((item) => item.candidate.id === "c-drop"), false);
    assert.ok(result.held.some((item) => item.candidate.id === "c-hold"));
    assert.ok(result.dropped.some((item) => item.candidate.id === "c-drop"));
    assert.ok(result.held[0]!.counterfactualRank <= 12);
  });

  it("treats a query as a filter", () => {
    const result = runPulse(base({ query: "frost dragon" }));
    assert.deepEqual(
      result.feed.map((item) => item.candidate.id),
      ["c-search"],
    );
  });

  it("reserves the fourth slot for one labeled sponsor", () => {
    const result = runPulse(base());
    assert.equal(result.feed[3]?.candidate.id, "c-ad");
    assert.equal(result.feed[3]?.placed, "native-slot");
    const organic = result.feed.filter((item) => item.placed !== "native-slot");
    for (let i = 1; i < organic.length; i++) {
      assert.ok(
        organic[i - 1]!.clickScore >= organic[i]!.clickScore - 1e-9,
        `organic order broke at ${i}`,
      );
    }
  });

  it("does not place a sponsor when sponsor intent is switched off", () => {
    const weights = { ...DEFAULT_WEIGHTS, engage_sponsor: 0 };
    const result = runPulse(base({ weights }));
    assert.equal(result.feed.some((item) => item.placed === "native-slot"), false);
  });

  it("lets a staff drop remove a post without rescoring the rest", () => {
    const open = runPulse(base());
    const closed = runPulse(base({ overrides: { "c-rust-clip": "drop" } }));
    assert.equal(closed.feed.some((item) => item.candidate.id === "c-rust-clip"), false);
    const before = open.scored.find((item) => item.candidate.id === "c-rust-loadout")!;
    const after = closed.scored.find((item) => item.candidate.id === "c-rust-loadout")!;
    assert.equal(before.heavyScore, after.heavyScore);
  });

  it("shrinks thin telemetry toward the prior", () => {
    const extreme = shrinkTaste([1, 0, 0, 0, 0, 0], 0);
    assert.equal(extreme.cold, true);
    assert.ok(extreme.taste[0]! < 0.5);

    const trusted = shrinkTaste([1, 0, 0, 0, 0, 0], 40);
    assert.equal(trusted.cold, false);
    assert.equal(trusted.taste[0], 1);

    const newt = prepareViewer(VIEWERS.find((person) => person.id === "newt")!);
    assert.equal(newt.coldStart, true);
    assert.ok((newt.confidence ?? 1) < 1);

    const coldPost = prepareCandidate(CANDIDATES.find((candidate) => candidate.id === "c-cold")!);
    assert.equal(coldPost.coldStart, true);
    assert.ok((coldPost.heat ?? 1) <= 0.3);
  });

  it("explains why a post made the feed", () => {
    const result = runPulse(base());
    for (const item of result.feed) {
      assert.ok(item.why.length > 20, `empty explanation for ${item.candidate.id}`);
      assert.ok(item.visibility === "allow");
      assert.ok(item.rank > 0);
    }
  });
});
