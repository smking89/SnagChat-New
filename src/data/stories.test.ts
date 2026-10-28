import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SEED_STORIES,
  STORY_TTL_MS,
  addStoryItem,
  freshStories,
  groupStories,
  hasSharedSnag,
  type StoryItem,
} from "./stories.ts";

const NOW = 1_700_000_000_000;

const story = (overrides: Partial<StoryItem> & Pick<StoryItem, "id" | "authorId" | "at">): StoryItem => ({
  image: "/snags/summit.jpg",
  caption: "Test story",
  game: "DayZ",
  ...overrides,
});

describe("story lifetime", () => {
  it("keeps stories inside the 24-hour window, oldest first", () => {
    const items = [
      story({ id: "new", authorId: "nyx", at: NOW - 5 * 60_000 }),
      story({ id: "old", authorId: "nyx", at: NOW - STORY_TTL_MS - 1 }),
      story({ id: "mid", authorId: "nyx", at: NOW - 3 * 60 * 60_000 }),
      story({ id: "edge", authorId: "nyx", at: NOW - STORY_TTL_MS + 1 }),
    ];

    assert.deepEqual(
      freshStories(items, NOW).map((item) => item.id),
      ["edge", "mid", "new"],
    );
  });

  it("ships a seed set with unique ids", () => {
    const ids = SEED_STORIES.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(SEED_STORIES.length >= 4);
  });
});

describe("story groups", () => {
  it("groups by author and keeps each author's run in order", () => {
    const groups = groupStories([
      story({ id: "b2", authorId: "luma", at: NOW - 10 }),
      story({ id: "a1", authorId: "nyx", at: NOW - 30 }),
      story({ id: "b1", authorId: "luma", at: NOW - 20 }),
    ]);

    assert.deepEqual(groups.map((group) => group.authorId), ["luma", "nyx"]);
    assert.deepEqual(groups[0]!.items.map((item) => item.id), ["b1", "b2"]);
  });

  it("replaces a second share of the same snag", () => {
    const first = story({ id: "one", authorId: "you", at: NOW - 20, snagId: "snag-03" });
    const second = story({ id: "two", authorId: "you", at: NOW, snagId: "snag-03" });

    const next = addStoryItem([first], second);
    assert.deepEqual(next.map((item) => item.id), ["two"]);
    assert.equal(hasSharedSnag(next, "snag-03"), true);
    assert.equal(hasSharedSnag(next, "snag-04"), false);
  });
});
