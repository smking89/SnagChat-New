import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEED_SNAGS, SEED_SQUADS } from "./seed-corpus.ts";
import { kindOf, minutesAgo, rankFeed, type RankFeedInput } from "./snagchat.ts";

const hiddenSquads = new Set(
  SEED_SQUADS.filter(
    (squad) =>
      squad.visibility === "private" && !squad.members.some((member) => member.playerId === "you"),
  ).map((squad) => squad.id),
);
const VISIBLE = SEED_SNAGS.filter((snag) => !snag.squadId || !hiddenSquads.has(snag.squadId));

const BASE: RankFeedInput = {
  allSnags: SEED_SNAGS,
  visibleSnags: VISIBLE,
  query: "",
  follows: [],
  squads: SEED_SQUADS,
  likes: [],
  saves: [],
  comments: {},
  shares: [],
  me: { name: "You", handle: "you" },
};

describe("SnagChat corpus adapter", () => {
  it("parses the relative post clock", () => {
    assert.equal(minutesAgo("now"), 0);
    assert.equal(minutesAgo("12m"), 12);
    assert.equal(minutesAgo("3h"), 180);
    assert.equal(minutesAgo("2d"), 2880);
    assert.equal(minutesAgo("junk", 42), 42);
  });

  it("maps categories and sponsor labels onto engine kinds", () => {
    assert.equal(kindOf(SEED_SNAGS.find((snag) => snag.id === "snag-01")!), "clip");
    assert.equal(kindOf(SEED_SNAGS.find((snag) => snag.id === "snag-11")!), "loadout");
    assert.equal(kindOf(SEED_SNAGS.find((snag) => snag.id === "snag-skin-01")!), "skin");
    assert.equal(kindOf(SEED_SNAGS.find((snag) => snag.id === "snag-03")!), "screenshot");
    assert.equal(kindOf(SEED_SNAGS.find((snag) => snag.id === "snag-02")!), "gallery");
    assert.equal(kindOf(SEED_SNAGS.find((snag) => snag.id === "snag-10")!), "sponsored");
  });

  it("returns every visible post exactly once and is deterministic", () => {
    const first = rankFeed(BASE).ordered.map((snag) => snag.id);
    const second = rankFeed(BASE).ordered.map((snag) => snag.id);
    assert.deepEqual(first, second);
    assert.equal(first.length, VISIBLE.length);
    assert.equal(new Set(first).size, VISIBLE.length);
  });

  it("keeps every labeled ad but seats only one in the fourth slot", () => {
    const { ordered, result } = rankFeed(BASE);
    assert.ok(ordered[3]?.sponsoredBy, "fourth card should be the labeled ad");
    assert.equal(
      ordered.filter((snag) => snag.sponsoredBy).length,
      VISIBLE.filter((snag) => snag.sponsoredBy).length,
    );
    assert.equal(result.feed.filter((item) => item.placed === "native-slot").length, 1);
  });

  it("lifts a creator the viewer follows", () => {
    const plain = rankFeed(BASE).ordered.findIndex((snag) => snag.id === "snag-01");
    const followed = rankFeed({ ...BASE, follows: ["masonr"] }).ordered.findIndex(
      (snag) => snag.id === "snag-01",
    );
    assert.ok(followed >= 0 && plain >= 0);
    assert.ok(followed <= plain, `followed ${followed}, plain ${plain}`);
  });

  it("uses saves and likes as taste signals", () => {
    const plain = rankFeed(BASE).ordered;
    const skinned = rankFeed({
      ...BASE,
      likes: ["snag-skin-01", "snag-skin-02", "snag-skin-03"],
      saves: ["snag-skin-01", "snag-skin-02"],
    }).ordered;
    const rankOf = (rows: typeof plain, id: string) => rows.findIndex((snag) => snag.id === id);
    assert.ok(
      rankOf(skinned, "snag-skin-04") <= rankOf(plain, "snag-skin-04"),
      `skin interest should not push the unliked skin down (${rankOf(skinned, "snag-skin-04")} vs ${rankOf(plain, "snag-skin-04")})`,
    );
  });

  it("never loses a prefix-search match the app filter accepted", () => {
    const visible = SEED_SNAGS.filter((snag) =>
      [snag.title, snag.game, snag.creator, snag.category].some((value) =>
        value.toLowerCase().includes("mason"),
      ),
    );
    const { ordered } = rankFeed({ ...BASE, visibleSnags: visible, query: "mason" });
    assert.deepEqual(
      ordered.map((snag) => snag.id).sort(),
      visible.map((snag) => snag.id).sort(),
    );
  });

  it("does not resurrect a private gallery it was handed by mistake", () => {
    const privateSnag = SEED_SNAGS.find((snag) => snag.id === "snag-kings-01")!;
    const { ordered } = rankFeed({
      ...BASE,
      visibleSnags: [privateSnag],
      squads: [],
    });
    assert.equal(ordered.some((snag) => snag.id === privateSnag.id), false);
  });
});
