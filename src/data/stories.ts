import type { FrameUse } from "./frames";
import type { Player } from "./players";

/**
 * A story is a still that lives for 24 hours. Players can share one of their
 * own snags to it, pass on someone else's post with credit, or upload a photo
 * from the story composer.
 */
export type StoryItem = {
  id: string;
  authorId: string;
  image: string;
  caption: string;
  game: string;
  /** Epoch milliseconds when it was posted. */
  at: number;
  /** The snag this was shared from, if any. */
  snagId?: string;
  /** Original creator's handle when the story shares someone else's snag. */
  via?: string;
};

export type StoryGroup = {
  authorId: string;
  items: StoryItem[];
};

/** A group resolved for rendering, with the player and their avatar frame. */
export type StoryGroupView = StoryGroup & {
  author: Player;
  avatarFrame?: FrameUse;
};

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

const minutesAgo = (minutes: number) => Date.now() - minutes * 60_000;

/**
 * Stories from other players, so the rail is alive on a fresh account. They
 * use the same artwork as the feed: a story is a post, not a separate medium.
 */
export const SEED_STORIES: StoryItem[] = [
  {
    id: "story-luma-1",
    authorId: "luma",
    image: "/snags/squad-room.jpg",
    caption: "Squad room, purple hour",
    game: "Call of Duty",
    at: minutesAgo(18),
  },
  {
    id: "story-luma-2",
    authorId: "luma",
    image: "/snags/late-queue.jpg",
    caption: "Late queue, lights off",
    game: "Apex Legends",
    at: minutesAgo(14),
  },
  {
    id: "story-nyx-1",
    authorId: "nyx",
    image: "/snags/summit.jpg",
    caption: "Ridge reset before the wipe",
    game: "DayZ",
    at: minutesAgo(42),
  },
  {
    id: "story-kirav-1",
    authorId: "kirav",
    image: "/snags/ridge-light.jpg",
    caption: "Last light on the outpost",
    game: "DayZ",
    at: minutesAgo(96),
  },
  {
    id: "story-masonr-1",
    authorId: "masonr",
    image: "/snags/neon-district.jpg",
    caption: "Night run, no HUD",
    game: "Cyberpunk 2077",
    at: minutesAgo(160),
  },
];

/** Stories still inside the 24-hour window, oldest first. */
export function freshStories(items: StoryItem[], now = Date.now()): StoryItem[] {
  return items
    .filter((item) => now - item.at < STORY_TTL_MS)
    .sort((a, b) => a.at - b.at);
}

/**
 * Groups items by author in the order their first story appears, with each
 * author's own stories oldest-first so the viewer plays them in sequence.
 */
export function groupStories(items: StoryItem[]): StoryGroup[] {
  const groups = new Map<string, StoryItem[]>();

  for (const item of items) {
    const list = groups.get(item.authorId);
    if (list) list.push(item);
    else groups.set(item.authorId, [item]);
  }

  return Array.from(groups, ([authorId, own]) => ({
    authorId,
    items: own.slice().sort((a, b) => a.at - b.at),
  }));
}

/**
 * Adds a story, replacing an older share of the same snag so the same post
 * cannot stack up in your story more than once.
 */
export function addStoryItem(items: StoryItem[], item: StoryItem): StoryItem[] {
  if (!item.snagId) return [item, ...items];
  return [item, ...items.filter((existing) => existing.snagId !== item.snagId)];
}

export function hasSharedSnag(items: StoryItem[], snagId: string): boolean {
  return items.some((item) => item.snagId === snagId);
}
