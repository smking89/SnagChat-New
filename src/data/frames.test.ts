import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FRAMES,
  FRAME_EFFECTS,
  INCLUDED_FRAMES,
  PLATFORM_FEE_RATE,
  feeFor,
  findFrame,
  formatPrice,
  loadoutFor,
  registerCustomFrames,
} from "./frames.ts";

describe("marketplace fee", () => {
  it("takes 2.5% from the seller, not the buyer", () => {
    assert.equal(PLATFORM_FEE_RATE, 0.025);
    assert.equal(feeFor(499), 12);
    assert.equal(499 - feeFor(499), 487);
    assert.equal(feeFor(999), 25);
    assert.equal(feeFor(0), 0);
  });

  it("rounds to the nearest cent", () => {
    assert.equal(feeFor(1000), 25);
    assert.equal(feeFor(40), 1);
    assert.equal(feeFor(19), 0);
  });

  it("formats included frames without a price", () => {
    assert.equal(formatPrice(0), "Included");
    assert.equal(formatPrice(499), "$4.99");
    assert.equal(formatPrice(999), "$9.99");
  });
});

describe("catalogue", () => {
  it("has one artwork file per frame and unique ids", () => {
    const ids = new Set(FRAMES.map((frame) => frame.id));
    assert.equal(ids.size, FRAMES.length);
    for (const frame of FRAMES) {
      assert.match(frame.art, /^\/frames\/[a-z0-9-]+\.svg$/);
      assert.ok(frame.priceCents >= 0);
    }
  });

  it("starts every account with an avatar and a nameplate", () => {
    assert.deepEqual(
      INCLUDED_FRAMES.slice().sort(),
      ["halo-violet", "plate-violet"],
    );
    for (const id of INCLUDED_FRAMES) {
      assert.equal(findFrame(id)?.priceCents, 0);
    }
  });

  it("keeps effect ids stable and unique", () => {
    const ids = FRAME_EFFECTS.map((effect) => effect.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.includes("rubberband"));
    assert.ok(ids.includes("slide-left"));
    assert.ok(ids.includes("fade-out"));
    assert.ok(FRAME_EFFECTS.some((effect) => effect.mode === "once"));
  });
});

describe("loadouts", () => {
  it("only treats the current player's loadout as own", () => {
    const mine = { avatar: { frameId: "ember-ring", effect: "pulse" as const } };
    assert.equal(loadoutFor("you", mine), mine);
    assert.deepEqual(loadoutFor("nobody", mine), {});
    assert.equal(loadoutFor("nyx", mine).avatar?.frameId, "ember-ring");
  });

  it("resolves creator products once they are registered", () => {
    const product = {
      id: "creator-test-drop",
      name: "Test drop",
      art: "/frames/avatar-halo-violet.svg",
      target: "avatar" as const,
      priceCents: 250,
      creator: "Test store",
      creatorId: "you",
      tagline: "Only in the test.",
      swatch: "#000000",
    };
    assert.equal(findFrame(product.id), undefined);
    registerCustomFrames([product]);
    assert.equal(findFrame(product.id)?.name, "Test drop");
    registerCustomFrames([]);
  });
});
