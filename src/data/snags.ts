export type SnagCategory = "Clips" | "Loadouts" | "Skins" | "Builds" | "Squad Galleries";

export type Snag = {
  id: string;
  title: string;
  game: string;
  category: SnagCategory;
  creator: string;
  creatorId?: string;
  squadId?: string;
  postedAt: string;
  image: string;
  /** CSS aspect-ratio value, e.g. "3 / 4.2" */
  aspect: string;
  duration?: string;
  /** Key for an uploaded MP4 in the clip store. `image` holds its poster frame. */
  clipId?: string;
  /** Set on sponsored posts. Only these show the report-ad action. */
  sponsoredBy?: string;
};

export type SnagDraft = {
  title: string;
  game: string;
  category: SnagCategory;
  image: string;
  aspect: string;
  duration?: string;
  clipId?: string;
  squadId?: string;
};

export const CATEGORIES = ["For You", "Clips", "Loadouts", "Skins", "Builds", "Squad Galleries"] as const;

export type FeedFilter = (typeof CATEGORIES)[number];

export type SwipeDirection = "left" | "right";

/**
 * The tab a swipe lands on: left goes forward through the rail, right goes back,
 * and the ends of the rail return null so the gesture stops instead of wrapping.
 */
export function nextCategory(current: FeedFilter, direction: SwipeDirection): FeedFilter | null {
  const index = CATEGORIES.indexOf(current);
  const next = direction === "left" ? index + 1 : index - 1;
  if (next < 0 || next >= CATEGORIES.length) return null;
  return CATEGORIES[next];
}
