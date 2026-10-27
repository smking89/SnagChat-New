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
