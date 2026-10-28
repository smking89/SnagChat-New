import type { Comment } from "../data/engagement.ts";
import { PLAYERS } from "../data/players.ts";
import type { Snag } from "../data/snags.ts";
import type { Squad } from "../data/squads.ts";
import type { Candidate, PulseResult, SnagKind, Viewer } from "./types.ts";
import { KIND_TASTE } from "./types.ts";
import { TASTE_PRIOR } from "./cold-start.ts";
import { runPulse } from "./pipeline.ts";

const VIEWER_ID = "you";
const BASE_TASTE = TASTE_PRIOR;

/** "12m", "3h", "2d" and "now" into minutes. */
export function minutesAgo(postedAt: string, fallback = 60): number {
  const value = postedAt.trim().toLowerCase();
  if (value === "now" || value === "just now") return 0;
  const match = /^(\d+(?:\.\d+)?)\s*(m|h|d|w)$/.exec(value);
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return fallback;
  const unit = match[2];
  if (unit === "m") return amount;
  if (unit === "h") return amount * 60;
  if (unit === "d") return amount * 24 * 60;
  return amount * 7 * 24 * 60;
}

export function kindOf(snag: Snag): SnagKind {
  if (snag.sponsoredBy) return "sponsored";
  if (snag.category === "Clips") return "clip";
  if (snag.category === "Loadouts") return "loadout";
  if (snag.category === "Skins") return "skin";
  if (snag.category === "Builds") return "screenshot";
  return "gallery";
}

function baseKind(snag: Snag): SnagKind {
  const kind = kindOf(snag);
  return kind === "sponsored" ? (snag.category === "Clips" ? "clip" : "loadout") : kind;
}

function hashtagsOf(title: string): string[] {
  return Array.from(title.matchAll(/#([a-z0-9_]+)/gi)).map((match) => match[1]!.toLowerCase());
}

function creatorOf(snag: Snag) {
  return (
    PLAYERS.find(
      (player) =>
        player.id === snag.creatorId ||
        player.name.toLowerCase() === snag.creator.toLowerCase() ||
        player.handle.toLowerCase() === snag.creator.toLowerCase(),
    ) ?? undefined
  );
}

export function candidateOf(snag: Snag, viewerSquads: Set<string>): Candidate {
  const kind = kindOf(snag);
  const creator = creatorOf(snag);
  const squadVisible = !snag.squadId || viewerSquads.has(snag.squadId);
  const tastes = KIND_TASTE[kind === "sponsored" ? baseKind(snag) : kind];

  return {
    id: snag.id,
    kind,
    title: snag.title,
    creatorId: creator?.id ?? snag.creatorId ?? snag.creator.toLowerCase().replace(/\s+/g, ""),
    creatorName: creator?.name ?? snag.creator,
    creatorVerified: !!creator?.verified,
    game: snag.game,
    category: snag.category,
    squadId: snag.squadId,
    tags: hashtagsOf(snag.title),
    taste: tastes.slice(),
    freshMin: minutesAgo(snag.postedAt),
    engagement: { likes: 0, comments: 0, saves: 0, shares: 0 },
    compliance: squadVisible ? "allow" : "drop",
    complianceNote: squadVisible
      ? "Visible to this viewer."
      : "Private squad gallery — not visible to non-members.",
    sponsor: snag.sponsoredBy
      ? { brand: snag.sponsoredBy, games: [snag.game], categories: [baseKind(snag)] }
      : undefined,
  };
}

function tasteFromSnags(snags: Snag[]): number[] | null {
  if (!snags.length) return null;
  const dim = BASE_TASTE.length;
  const sums = new Array<number>(dim).fill(0);
  for (const snag of snags) {
    const kind = kindOf(snag);
    const vector = KIND_TASTE[kind === "sponsored" ? "sponsored" : kind];
    for (let i = 0; i < dim; i++) sums[i] += vector[i] ?? 0;
  }
  return sums.map((value) => value / snags.length);
}

function blend(rows: { taste: number[] | null; weight: number }[]): number[] {
  const dim = BASE_TASTE.length;
  const sums = new Array<number>(dim).fill(0);
  let total = 0;
  for (const row of rows) {
    if (!row.taste) continue;
    total += row.weight;
    for (let i = 0; i < dim; i++) sums[i] += (row.taste[i] ?? 0) * row.weight;
  }
  if (total === 0) return BASE_TASTE.slice();
  return sums.map((value) => value / total);
}

function squadIdsFor(playerId: string, squads: Squad[]): string[] {
  return squads.filter((squad) => squad.members.some((member) => member.playerId === playerId)).map((squad) => squad.id);
}

export interface RankFeedInput {
  allSnags: Snag[];
  visibleSnags: Snag[];
  query: string;
  follows: string[];
  squads: Squad[];
  likes: string[];
  saves: string[];
  comments: Record<string, Comment[]>;
  shares: string[];
  me: { name: string; handle: string };
}

export interface RankedFeed {
  ordered: Snag[];
  result: PulseResult;
}

/**
 * Builds the engine corpus from the live app state, ranks only the posts that
 * already passed the feed's own filters, and returns presentation order.
 *
 * The viewer's taste comes from what they actually did: their own posts count
 * most, then saves, shares, likes and comments. A brand-new account has no
 * signals, so the cold-start pass shrinks it toward the broad-feed prior.
 */
export function rankFeed(input: RankFeedInput): RankedFeed {
  const squadIds = squadIdsFor(VIEWER_ID, input.squads);
  const viewerSquads = new Set(squadIds);
  const byId = new Map(input.allSnags.map((snag) => [snag.id, snag]));
  const ownPosts = input.allSnags.filter((snag) => (snag.creatorId ?? "").toLowerCase() === VIEWER_ID || snag.creator.toLowerCase() === "you");

  const likedSnags = input.likes.map((id) => byId.get(id)).filter((snag): snag is Snag => !!snag);
  const savedSnags = input.saves.map((id) => byId.get(id)).filter((snag): snag is Snag => !!snag);
  const sharedSnags = input.shares.map((id) => byId.get(id)).filter((snag): snag is Snag => !!snag);
  const commentedIds = new Set(
    Object.entries(input.comments)
      .filter(([, rows]) => rows.some((comment) => comment.authorId === VIEWER_ID))
      .map(([id]) => id),
  );
  const commentedSnags = [...commentedIds].map((id) => byId.get(id)).filter((snag): snag is Snag => !!snag);

  const viewerTaste = blend([
    { taste: tasteFromSnags(ownPosts), weight: 1.4 * ownPosts.length },
    { taste: tasteFromSnags(savedSnags), weight: 0.8 * savedSnags.length },
    { taste: tasteFromSnags(sharedSnags), weight: 0.55 * sharedSnags.length },
    { taste: tasteFromSnags(likedSnags), weight: 0.5 * likedSnags.length },
    { taste: tasteFromSnags(commentedSnags), weight: 0.4 * commentedSnags.length },
  ]);

  const viewerGames = Array.from(
    new Set([
      PLAYERS[0]?.game ?? "Rust",
      ...ownPosts.map((snag) => snag.game),
      ...likedSnags.slice(0, 6).map((snag) => snag.game),
    ]),
  );

  const viewer: Viewer = {
    id: VIEWER_ID,
    name: input.me.name || "You",
    handle: input.me.handle || "you",
    verified: false,
    taste: viewerTaste,
    follows: input.follows,
    squads: squadIds,
    games: viewerGames,
    activityIndex:
      ownPosts.length * 2 +
      likedSnags.length +
      savedSnags.length * 1.5 +
      sharedSnags.length * 2 +
      commentedSnags.length,
    seen: [...likedSnags, ...savedSnags, ...sharedSnags, ...commentedSnags].map((snag) => snag.id),
  };

  const corpusPlayers: Viewer[] = PLAYERS.map((player) => {
    const posts = input.allSnags.filter((snag) => {
      const creator = creatorOf(snag);
      return creator?.id === player.id || snag.creatorId === player.id || snag.creator.toLowerCase() === player.handle.toLowerCase();
    });
    const taste = tasteFromSnags(posts) ?? BASE_TASTE.slice();
    return {
      id: player.id,
      name: player.name,
      handle: player.handle,
      verified: !!player.verified,
      taste,
      follows: [],
      squads: squadIdsFor(player.id, input.squads),
      games: Array.from(new Set([player.game, ...posts.map((snag) => snag.game)])),
      activityIndex: posts.length * 3 + 4,
    };
  });

  const candidates = input.visibleSnags.map((snag) => candidateOf(snag, viewerSquads));
  const candidatePool = input.allSnags.map((snag) => candidateOf(snag, viewerSquads));

  const result = runPulse({
    viewer,
    candidates,
    query: input.query,
    limit: Math.max(candidates.length, 1),
    corpus: { viewers: [...corpusPlayers, viewer], candidates: candidatePool },
  });

  const ordered = result.feed
    .map((item) => input.visibleSnags.find((snag) => snag.id === item.candidate.id))
    .filter((snag): snag is Snag => !!snag);

  // A query drops posts with no term overlap, which is correct in the engine but
  // would hide a prefix match the app's substring filter already accepted (for
  // example "mason" against "MasonR"). Append those, but never resurrect a post
  // the visibility gate held or dropped.
  const gated = new Set([...result.held, ...result.dropped].map((item) => item.candidate.id));
  const seen = new Set(ordered.map((snag) => snag.id));
  for (const snag of input.visibleSnags) {
    if (seen.has(snag.id) || gated.has(snag.id)) continue;
    ordered.push(snag);
  }

  return { ordered, result };
}
