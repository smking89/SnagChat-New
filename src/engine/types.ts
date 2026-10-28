/**
 * SnagChat ranking engine — contracts.
 *
 * The feed is not ranked by one blended "relevance" number. Retrieval proposes
 * candidates from several independent sources, a cheap light rank truncates,
 * and a heavy rank prices the actions a post can actually earn on SnagChat:
 * watch a clip, like, save, comment, share, follow the creator, join a squad,
 * or engage a sponsor.
 */

export type SnagKind = "clip" | "loadout" | "skin" | "screenshot" | "gallery" | "sponsored";

export type ActionId =
  | "watch_clip"
  | "like_post"
  | "save_post"
  | "comment_post"
  | "share_post"
  | "follow_creator"
  | "join_squad"
  | "engage_sponsor";

export type Compliance = "allow" | "interstitial" | "drop";

export interface ActionDef {
  id: ActionId;
  label: string;
  short: string;
}

export const ACTIONS: ActionDef[] = [
  { id: "watch_clip", label: "Watch clip", short: "Watch" },
  { id: "like_post", label: "Like", short: "Like" },
  { id: "save_post", label: "Save", short: "Save" },
  { id: "comment_post", label: "Comment", short: "Comment" },
  { id: "share_post", label: "Share", short: "Share" },
  { id: "follow_creator", label: "Follow", short: "Follow" },
  { id: "join_squad", label: "Join squad", short: "Squad" },
  { id: "engage_sponsor", label: "Sponsor", short: "Sponsor" },
];

/**
 * Weights say what SnagChat wants from a session. Saving and following are
 * worth more than a like because they cost the player something; watching a
 * clip is the core loop; sponsor engagement is deliberately the smallest
 * organic weight so an ad cannot win the feed on intent alone.
 */
export const DEFAULT_WEIGHTS: Record<ActionId, number> = {
  watch_clip: 1.2,
  like_post: 0.35,
  save_post: 1.15,
  comment_post: 0.7,
  share_post: 0.9,
  follow_creator: 1.1,
  join_squad: 1.0,
  engage_sponsor: 0.3,
};

export const APPLICABLE: Record<SnagKind, ActionId[]> = {
  clip: ["watch_clip", "like_post", "save_post", "comment_post", "share_post", "follow_creator"],
  loadout: ["save_post", "like_post", "comment_post", "share_post", "follow_creator"],
  skin: ["save_post", "like_post", "share_post", "follow_creator"],
  screenshot: ["like_post", "save_post", "share_post", "follow_creator"],
  gallery: ["join_squad", "like_post", "comment_post", "follow_creator"],
  sponsored: ["engage_sponsor"],
};

export const KIND_LABEL: Record<SnagKind, string> = {
  clip: "Clip",
  loadout: "Loadout",
  skin: "Skin",
  screenshot: "Build",
  gallery: "Squad gallery",
  sponsored: "Sponsored",
};

/** The six axes the taste vector is measured on. */
export const TASTE_AXES = ["Clips", "Loadouts", "Skins", "Builds", "Squad play", "Discovery"] as const;
export const TASTE_DIM = TASTE_AXES.length;

/** The category each kind leans on, before tags and games nudge it. */
export const KIND_TASTE: Record<SnagKind, number[]> = {
  clip: [1.0, 0.1, 0.15, 0.3, 0.3, 0.55],
  loadout: [0.2, 1.0, 0.35, 0.15, 0.25, 0.35],
  skin: [0.25, 0.35, 1.0, 0.2, 0.3, 0.4],
  screenshot: [0.35, 0.1, 0.15, 1.0, 0.15, 0.5],
  gallery: [0.4, 0.2, 0.2, 0.25, 1.0, 0.45],
  sponsored: [0.35, 0.35, 0.35, 0.3, 0.25, 0.3],
};

export interface Viewer {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  /** Multi-game taste. Six axes in TASTE_AXES order. */
  taste: number[];
  /** Player ids this viewer follows. */
  follows: string[];
  /** Squad ids this viewer belongs to. */
  squads: string[];
  /** Game titles the viewer actually posts about or plays. */
  games: string[];
  /** Interactions in the last 30 days. Below the prior, taste is shrunk. */
  activityIndex?: number;
  /** Candidate ids already liked, saved or commented on. */
  seen?: string[];
  coldStart?: boolean;
  confidence?: number;
}

export interface SponsorTarget {
  brand: string;
  games: string[];
  /** Categories the campaign can sit beside. Empty means any. */
  categories: SnagKind[];
}

export interface Candidate {
  id: string;
  kind: SnagKind;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorVerified: boolean;
  game: string;
  category: string;
  squadId?: string;
  tags: string[];
  /** Six-axis taste vector for this post. */
  taste: number[];
  /** Minutes since it was posted. */
  freshMin: number;
  engagement: { likes: number; comments: number; saves: number; shares: number };
  /** Recorded interactions behind heat. Below the prior, heat is shrunk. */
  sampleCount?: number;
  compliance: Compliance;
  complianceNote: string;
  sponsor?: SponsorTarget;
  coldStart?: boolean;
  /** Shrunk heat, filled in by the cold-start pass. */
  heat?: number;
}

export interface SourceHit {
  id: string;
  label: string;
  score: number;
}

export interface Contribution {
  label: string;
  weight: number;
}

export interface ScoredItem {
  candidate: Candidate;
  sources: SourceHit[];
  lightScore: number;
  probs: Record<ActionId, number>;
  heavyScore: number;
  /** Organic relevance. The only key for click order. */
  clickScore: number;
  visibility: Compliance;
  visibilityReason: string;
  contributions: Contribution[];
  why: string;
  queryMatch: number;
  /** Rank if the visibility gate were ignored. */
  counterfactualRank: number;
  placed: "organic" | "native-slot";
  /** Presentation order. 0 when held or dropped. */
  rank: number;
}

export interface TraceRow {
  id: string;
  title: string;
  score: number;
  kept: boolean;
  note: string;
}

export interface TraceStage {
  id: string;
  title: string;
  purpose: string;
  entered: number;
  kept: number;
  rows: TraceRow[];
}

export interface ClusterModel {
  id: string;
  name: string;
  centroid: number[];
  memberIds: string[];
}

export interface PulseInput {
  viewer: Viewer;
  candidates: Candidate[];
  query?: string;
  weights?: Partial<Record<ActionId, number>>;
  /** Candidate id → staff visibility decision. */
  overrides?: Record<string, Compliance>;
  dismissed?: string[];
  /** 0 is replaced by a stable anchor clock so first paint is deterministic. */
  nowMs?: number;
  limit?: number;
  /** Player and candidate pool used for clusters and the social graph. */
  corpus?: { viewers: Viewer[]; candidates: Candidate[] };
}

export interface PulseResult {
  viewerId: string;
  clusterName: string;
  membership: { id: string; name: string; weight: number }[];
  clusters: ClusterModel[];
  coldStart: { active: boolean; confidence: number; note: string };
  feed: ScoredItem[];
  held: ScoredItem[];
  dropped: ScoredItem[];
  scored: ScoredItem[];
  trace: TraceStage[];
  retrieved: number;
}
