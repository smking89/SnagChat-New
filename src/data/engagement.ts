export type Comment = {
  id: string;
  authorId: string;
  at: number;
  text: string;
};

const now = Date.now();
const minute = 60 * 1000;

export const SEED_LIKES: Record<string, number> = {
  "snag-01": 1284,
  "snag-02": 642,
  "snag-03": 913,
  "snag-04": 388,
  "snag-05": 267,
  "snag-06": 741,
  "snag-07": 512,
  "snag-08": 1490,
  "snag-09": 205,
  "snag-10": 176,
  "snag-11": 934,
  "snag-12": 421,
  "snag-13": 1180,
  "snag-14": 655,
  "snag-15": 289,
};

/** Posts kept for later, roughly a third of the like count. */
export const SEED_SAVES: Record<string, number> = {
  "snag-01": 412,
  "snag-02": 188,
  "snag-03": 274,
  "snag-04": 96,
  "snag-05": 74,
  "snag-06": 236,
  "snag-07": 151,
  "snag-08": 508,
  "snag-09": 61,
  "snag-10": 129,
  "snag-11": 447,
  "snag-12": 113,
  "snag-13": 386,
  "snag-14": 197,
  "snag-15": 88,
};

/** Times a post was sent on: to a squad, a player, or through the share sheet. */
export const SEED_SHARES: Record<string, number> = {
  "snag-01": 231,
  "snag-02": 84,
  "snag-03": 146,
  "snag-04": 52,
  "snag-05": 38,
  "snag-06": 118,
  "snag-07": 67,
  "snag-08": 302,
  "snag-09": 29,
  "snag-10": 44,
  "snag-11": 208,
  "snag-12": 71,
  "snag-13": 164,
  "snag-14": 92,
  "snag-15": 35,
};

export const SEED_COMMENTS: Record<string, Comment[]> = {
  "snag-01": [
    {
      id: "c-01-1",
      authorId: "luma",
      at: now - 8 * minute,
      text: "The reflection off the wet street is doing a lot of the work here.",
    },
    {
      id: "c-01-2",
      authorId: "jax",
      at: now - 5 * minute,
      text: "What settings are you running for the neon bloom?",
    },
  ],
  "snag-02": [
    {
      id: "c-02-1",
      authorId: "vexx",
      at: now - 24 * minute,
      text: "Purple hour is undefeated.",
    },
  ],
  "snag-04": [
    {
      id: "c-04-1",
      authorId: "otis",
      at: now - 40 * minute,
      text: "Couch co-op energy. This is the way.",
    },
    {
      id: "c-04-2",
      authorId: "kit",
      at: now - 36 * minute,
      text: "Which cabinet is that? The sticks look clean.",
    },
  ],
  "snag-08": [
    {
      id: "c-08-1",
      authorId: "mira",
      at: now - 3 * 60 * minute,
      text: "Fog timing was perfect. Did you wait a full cycle for this?",
    },
    {
      id: "c-08-2",
      authorId: "aster",
      at: now - 2.4 * 60 * minute,
      text: "This is the one. No notes.",
    },
  ],
  "snag-14": [
    {
      id: "c-14-1",
      authorId: "wren",
      at: now - 20 * 60 * minute,
      text: "No HUD gang. The sky does the work.",
    },
    {
      id: "c-14-2",
      authorId: "kirav",
      at: now - 18 * 60 * minute,
      text: "How long was the exposure on this?",
    },
  ],
};
