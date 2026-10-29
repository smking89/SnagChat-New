export type Comment = {
  id: string;
  authorId: string;
  at: number;
  text: string;
};

/**
 * Engagement starts at zero on every post. There is no seeded like, save,
 * share or comment anywhere in the app.
 */
export const SEED_LIKES: Record<string, number> = {};
export const SEED_SAVES: Record<string, number> = {};
export const SEED_SHARES: Record<string, number> = {};
export const SEED_COMMENTS: Record<string, Comment[]> = {};
