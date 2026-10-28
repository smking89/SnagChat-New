import { prepareCandidate, prepareViewer } from "./cold-start.ts";
import { clamp01, cosine, sigmoid, softmax } from "./math.ts";
import { buildBm25, buildClusters, buildEdges, candidateText, type Bm25Index } from "./model.ts";
import type {
  ActionId,
  Candidate,
  Compliance,
  PulseInput,
  PulseResult,
  ScoredItem,
  SourceHit,
  TraceRow,
  TraceStage,
} from "./types.ts";
import { ACTIONS, APPLICABLE, DEFAULT_WEIGHTS } from "./types.ts";

/**
 * SnagChat feed ranker.
 *
 * Retrieval runs four independent proposals over the posts the viewer is
 * allowed to see:
 *   - the follow / squad / shared-game graph (people you actually queue with)
 *   - taste clusters (a loadout post can reach a clip watcher)
 *   - live heat (fresh saves and shares, not raw likes)
 *   - search, when the operator typed something
 *
 * The light rank is a cheap linear blend and truncates. The heavy rank prices
 * every action a post can earn, then sums expected value. Visibility is a
 * separate gate, applied after scoring, so moderation can never be bought by a
 * high score. One labeled sponsor may take the fourth slot; it never outranks
 * organic posts and never appears as native content.
 */

interface Features {
  graph: number;
  affinity: number;
  game: number;
  fresh: number;
  social: number;
  verified: number;
  heat: number;
  query: number;
  community: number;
  sponsor: number;
}

const COEF: Record<ActionId, { bias: number; terms: Partial<Record<keyof Features, number>> }> = {
  watch_clip: {
    bias: -1.55,
    terms: { affinity: 1.2, game: 1.05, heat: 0.65, fresh: 0.5, graph: 0.45, community: 0.4 },
  },
  like_post: {
    bias: -1.25,
    terms: { affinity: 1.15, heat: 0.75, game: 0.55, graph: 0.4, social: 0.35, verified: 0.2 },
  },
  save_post: {
    bias: -1.9,
    terms: { affinity: 1.5, game: 0.85, graph: 0.55, social: 0.4, fresh: 0.25, community: 0.5 },
  },
  comment_post: {
    bias: -2.25,
    terms: { social: 0.9, graph: 0.7, affinity: 0.7, heat: 0.5, game: 0.35, verified: 0.2 },
  },
  share_post: {
    bias: -2.05,
    terms: { heat: 0.85, social: 0.8, affinity: 0.65, graph: 0.55, game: 0.3 },
  },
  follow_creator: {
    bias: -1.85,
    terms: { graph: 0.95, affinity: 1.0, social: 0.6, community: 0.55, verified: 0.25 },
  },
  join_squad: {
    bias: -2.1,
    terms: { social: 1.15, graph: 0.9, community: 0.8, affinity: 0.45, game: 0.35 },
  },
  engage_sponsor: {
    bias: -1.75,
    terms: { sponsor: 1.65, game: 0.5, affinity: 0.35, heat: 0.2 },
  },
};

const TERM_LABEL: Record<keyof Features, string> = {
  graph: "In-network proximity",
  affinity: "Taste affinity",
  game: "Game fit",
  fresh: "Freshness",
  social: "Follow / squad link",
  verified: "Verified creator",
  heat: "Live engagement",
  query: "Search match",
  community: "Community match",
  sponsor: "Sponsor fit",
};

const LIGHT_K = 24;
const GRAPH_K = 12;
const AFFINITY_K = 12;
const HEAT_K = 10;
const SEARCH_K = 8;
const SPONSOR_K = 4;
const SPONSOR_SLOT = 3; // zero-based: the fourth card

const DOMINANT = new Map<ActionId, string>(
  ACTIONS.map((action) => [action.id, action.label]),
);

export function personalizedPageRank(
  source: string,
  viewers: { id: string }[],
  edges: Map<string, Map<string, number>>,
): Record<string, number> {
  const nodes = viewers.map((viewer) => viewer.id);
  const alpha = 0.22;
  const rank: Record<string, number> = {};
  for (const node of nodes) rank[node] = node === source ? 1 : 0;

  const transitions = new Map<string, { to: string; p: number }[]>();
  for (const node of nodes) {
    const neighbours = edges.get(node);
    let sum = 0;
    if (neighbours) for (const weight of neighbours.values()) sum += weight;
    const list: { to: string; p: number }[] = [];
    if (neighbours && sum > 0) for (const [to, weight] of neighbours) list.push({ to, p: weight / sum });
    transitions.set(node, list);
  }

  for (let iter = 0; iter < 16; iter++) {
    const next: Record<string, number> = {};
    for (const node of nodes) next[node] = node === source ? alpha : 0;
    for (const node of nodes) {
      const mass = rank[node] ?? 0;
      if (mass === 0) continue;
      const list = transitions.get(node) ?? [];
      if (!list.length) {
        next[source] = (next[source] ?? 0) + (1 - alpha) * mass;
        continue;
      }
      for (const edge of list) next[edge.to] = (next[edge.to] ?? 0) + (1 - alpha) * mass * edge.p;
    }
    for (const node of nodes) rank[node] = next[node] ?? 0;
  }
  return rank;
}

function gameFit(viewerGames: string[], game: string): number {
  if (!game) return 0.2;
  const direct = viewerGames.findIndex((title) => title.toLowerCase() === game.toLowerCase());
  if (direct === 0) return 1;
  if (direct > 0) return 0.75;
  return 0.12;
}

function bm25Query(query: string, index: Bm25Index): Map<string, number> {
  const scores = new Map<string, number>();
  const terms = query.trim()
    ? Array.from(new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1)))
    : [];
  if (!terms.length) return scores;
  const k1 = 1.2;
  const b = 0.75;
  for (const doc of index.docs) {
    let score = 0;
    for (const term of terms) {
      const tf = doc.tf.get(term) ?? 0;
      if (!tf) continue;
      const df = index.df.get(term) ?? 0;
      const idf = Math.log((index.n - df + 0.5) / (df + 0.5) + 1);
      const denominator = tf + k1 * (1 - b + b * (doc.len / index.avgdl));
      score += idf * ((tf * (k1 + 1)) / denominator);
    }
    if (score > 0) scores.set(doc.id, score);
  }
  return scores;
}

function complianceOf(candidate: Candidate, overrides: Record<string, Compliance>): Compliance {
  return overrides[candidate.id] ?? candidate.compliance;
}

function top<T extends { score: number }>(rows: T[], k: number): T[] {
  return rows
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

interface Acc {
  candidate: Candidate;
  sources: SourceHit[];
}

function addSource(pool: Map<string, Acc>, byId: Map<string, Candidate>, id: string, hit: SourceHit) {
  const candidate = byId.get(id);
  if (!candidate) return;
  const current = pool.get(id) ?? { candidate, sources: [] };
  current.sources.push(hit);
  pool.set(id, current);
}

function takeSource(
  pool: Map<string, Acc>,
  byId: Map<string, Candidate>,
  ranked: { id: string; score: number }[],
  k: number,
  sourceId: string,
  label: string,
): { id: string; score: number }[] {
  const rows = top(
    ranked.filter((row) => row.score > 0),
    k,
  );
  const max = rows[0]?.score || 1;
  for (const row of rows) {
    addSource(pool, byId, row.id, { id: sourceId, label, score: row.score / max });
  }
  return rows;
}

function similarity(a: Candidate, b: Candidate): number {
  let score = 0;
  if (a.kind === b.kind) score += 0.35;
  if (a.game && a.game === b.game) score += 0.45;
  if (a.creatorId === b.creatorId) score += 0.35;
  if (a.squadId && a.squadId === b.squadId) score += 0.2;
  if (a.sponsor && b.sponsor) score += 0.3;
  return Math.min(1, score);
}

function actionProb(action: ActionId, features: Features): {
  p: number;
  parts: { label: string; weight: number }[];
} {
  const spec = COEF[action];
  const parts: { label: string; weight: number }[] = [];
  let z = spec.bias;
  for (const [key, coef] of Object.entries(spec.terms)) {
    const feature = key as keyof Features;
    const value = features[feature] ?? 0;
    const weight = (coef ?? 0) * value;
    z += weight;
    if (Math.abs(weight) > 0.02) parts.push({ label: TERM_LABEL[feature], weight });
  }
  parts.sort((a, b) => b.weight - a.weight);
  return { p: sigmoid(z), parts };
}

function emptyProbs(): Record<ActionId, number> {
  return {
    watch_clip: 0,
    like_post: 0,
    save_post: 0,
    comment_post: 0,
    share_post: 0,
    follow_creator: 0,
    join_squad: 0,
    engage_sponsor: 0,
  };
}

function whyText(item: {
  sources: SourceHit[];
  probs: Record<ActionId, number>;
  contributions: { label: string; weight: number }[];
  weights: Record<ActionId, number>;
  placed: ScoredItem["placed"];
  query: number;
  candidate: Candidate;
}): string {
  const source = item.sources.slice().sort((a, b) => b.score - a.score)[0];
  let best: ActionId = "like_post";
  let bestEv = -1;
  for (const action of APPLICABLE[item.candidate.kind]) {
    const ev = item.weights[action] * item.probs[action];
    if (ev > bestEv) {
      bestEv = ev;
      best = action;
    }
  }
  const label = DOMINANT.get(best) ?? best;
  const bits = [
    source ? `Retrieved by ${source.label.toLowerCase()}` : "Retrieved from the feed catalog",
    `${label} leads the intent estimate at ${item.probs[best].toFixed(2)}`,
  ];
  if (item.contributions.length) {
    bits.push(`strongest signal: ${item.contributions[0]!.label.toLowerCase()}`);
  }
  if (item.query > 0.2) bits.push("the search query is applied after intent");
  if (item.placed === "native-slot") {
    bits.push("placed in the labeled sponsor slot so it cannot pass as organic");
  }
  return `${bits.join(". ")}.`;
}

export function runPulse(input: PulseInput): PulseResult {
  const dismissed = new Set(input.dismissed ?? []);
  const candidates = input.candidates
    .filter((candidate) => !dismissed.has(candidate.id))
    .map(prepareCandidate);
  const viewers = (input.corpus?.viewers ?? [input.viewer]).map(prepareViewer);
  if (!viewers.some((viewer) => viewer.id === input.viewer.id)) viewers.push(prepareViewer(input.viewer));
  const viewer = viewers.find((person) => person.id === input.viewer.id) ?? prepareViewer(input.viewer);
  const weights: Record<ActionId, number> = { ...DEFAULT_WEIGHTS, ...input.weights };
  const query = (input.query ?? "").trim();
  const limit = input.limit ?? 24;

  const index = buildBm25(candidates);
  const clusterModels = buildClusters(viewers);
  const edgeMap = buildEdges(viewers);
  const bm = bm25Query(query, index);
  let bmMax = 0;
  for (const value of bm.values()) bmMax = Math.max(bmMax, value);

  const sims = clusterModels.map((cluster) => cosine(viewer.taste, cluster.centroid));
  const membershipW = softmax(sims, 0.12);
  const membership = clusterModels.map((cluster, i) => ({
    id: cluster.id,
    name: cluster.name,
    weight: membershipW[i] ?? 0,
  }));
  const home = membership.slice().sort((a, b) => b.weight - a.weight)[0];

  const ppr = personalizedPageRank(viewer.id, viewers, edgeMap);
  let maxPpr = 1e-6;
  for (const person of viewers) {
    if (person.id !== viewer.id) maxPpr = Math.max(maxPpr, ppr[person.id] ?? 0);
  }

  const followed = new Set(viewer.follows);
  const viewerSquads = new Set(viewer.squads);

  const featuresFor = (candidate: Candidate, queryMatch: number): Features => {
    const graph = clamp01((ppr[candidate.creatorId] ?? 0) / maxPpr);
    const affinity = clamp01(cosine(viewer.taste, candidate.taste));
    const contentAffinity = softmax(
      clusterModels.map((cluster) => cosine(candidate.taste, cluster.centroid)),
      0.12,
    );
    const community = clamp01(
      membershipW.reduce((sum, value, i) => sum + value * (contentAffinity[i] ?? 0), 0),
    );
    let social = followed.has(candidate.creatorId) ? 0.6 : 0;
    if (candidate.squadId && viewerSquads.has(candidate.squadId)) social = Math.min(1, social + 0.55);
    const sponsor = candidate.sponsor
      ? clamp01(
          (candidate.sponsor.games.length
            ? Math.max(...candidate.sponsor.games.map((game) => gameFit(viewer.games, game)))
            : 0.5) *
            0.6 +
            (candidate.sponsor.categories.length
              ? candidate.sponsor.categories.includes(candidate.kind)
                ? 0.4
                : 0.15
              : 0.4),
        )
      : 0;
    return {
      graph,
      affinity,
      game: gameFit(viewer.games, candidate.game),
      fresh: clamp01(Math.exp(-candidate.freshMin / 480)),
      social: clamp01(social),
      verified: candidate.creatorVerified ? 1 : 0,
      heat: clamp01(candidate.heat ?? 0),
      query: queryMatch,
      community,
      sponsor,
    };
  };

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const pool = new Map<string, Acc>();
  const trace: TraceStage[] = [];

  const graphRanked = candidates.map((candidate) => {
    const features = featuresFor(candidate, 0);
    return {
      id: candidate.id,
      title: candidate.title,
      score: features.graph * (0.55 + 0.45 * features.game),
    };
  });
  const graphKept = takeSource(pool, byId, graphRanked, GRAPH_K, "graph", "In-network walk");
  trace.push(
    stage(
      "graph",
      "In-network walk",
      "Restart walk over follows, shared squads and shared games. Surfaces what the viewer is already close to.",
      graphRanked,
      graphKept,
    ),
  );

  const affinityRanked = candidates.map((candidate) => {
    const features = featuresFor(candidate, 0);
    return { id: candidate.id, title: candidate.title, score: features.community };
  });
  const affinityKept = takeSource(
    pool,
    byId,
    affinityRanked,
    AFFINITY_K,
    "affinity",
    "Taste community",
  );
  trace.push(
    stage(
      "affinity",
      "Taste communities",
      "Viewers grouped by multi-category taste. This is how a loadout post reaches someone who mostly watches clips.",
      affinityRanked,
      affinityKept,
    ),
  );

  const heatRanked = candidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    score: (candidate.heat ?? 0) * Math.exp(-candidate.freshMin / 720),
  }));
  const heatKept = takeSource(pool, byId, heatRanked, HEAT_K, "heat", "Live heat");
  trace.push(
    stage(
      "heat",
      "Live heat",
      "Time-decayed saves, comments and shares. High heat is a nomination, never an eligibility rule.",
      heatRanked,
      heatKept,
    ),
  );

  const searchRanked = candidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    score: bmMax > 0 ? (bm.get(candidate.id) ?? 0) / bmMax : 0,
  }));
  const searchKept = query ? takeSource(pool, byId, searchRanked, SEARCH_K, "search", "Search") : [];
  trace.push({
    id: "search",
    title: "Search",
    purpose: query
      ? "BM25 over titles, games, creators and tags. The query reorders the visible set; it cannot resurrect a filtered post."
      : "Idle until the viewer types a query.",
    entered: query ? searchRanked.filter((row) => row.score > 0).length : 0,
    kept: searchKept.length,
    rows: query ? rowsOf(searchRanked, new Set(searchKept.map((row) => row.id))) : [],
  });

  const sponsorRanked = candidates
    .filter((candidate) => candidate.sponsor)
    .map((candidate) => {
      const features = featuresFor(candidate, 0);
      return {
        id: candidate.id,
        title: candidate.title,
        score: (0.4 + 0.6 * features.game) * (0.5 + 0.5 * features.heat),
      };
    });
  const sponsorKept = takeSource(pool, byId, sponsorRanked, SPONSOR_K, "sponsor", "Sponsor ingress");
  trace.push(
    stage(
      "sponsor",
      "Sponsor ingress",
      "Campaigns enter as their own source so a labeled ad is never buried behind the organic cutoff.",
      sponsorRanked,
      sponsorKept,
    ),
  );

  trace.push({
    id: "merge",
    title: "Merge",
    purpose: "Union of the retrieval sources. A post can be nominated by more than one.",
    entered: pool.size,
    kept: pool.size,
    rows: [...pool.values()].map((acc) => ({
      id: acc.candidate.id,
      title: acc.candidate.title,
      score: Math.max(...acc.sources.map((source) => source.score)),
      kept: true,
      note: acc.sources.map((source) => source.label).join(" · "),
    })),
  });

  const lightRows: {
    acc: Acc;
    score: number;
    queryMatch: number;
    features: Features;
  }[] = [];

  for (const acc of pool.values()) {
    const queryMatch = bmMax > 0 ? (bm.get(acc.candidate.id) ?? 0) / bmMax : 0;
    // A query is a filter, not a nudge: a post with no term overlap does not
    // get to outrank a match on heat. The app's own substring filter still
    // covers prefix searches the tokeniser cannot see.
    if (query && queryMatch === 0) continue;
    const features = featuresFor(acc.candidate, queryMatch);
    const best = Math.max(...acc.sources.map((source) => source.score));
    const score =
      0.44 * best +
      0.2 * features.affinity +
      0.16 * features.game +
      0.1 * features.fresh +
      0.06 * features.verified +
      0.04 * features.heat;
    lightRows.push({ acc, score, queryMatch, features });
  }
  lightRows.sort((a, b) => b.score - a.score);
  const lightPass = new Set(lightRows.slice(0, LIGHT_K).map((row) => row.acc.candidate.id));
  trace.push({
    id: "light",
    title: "Light rank",
    purpose: "Cheap linear score: source strength, affinity, game fit, freshness, verification and heat. Truncates before the expensive pass.",
    entered: lightRows.length,
    kept: lightPass.size,
    rows: lightRows.map((row) => ({
      id: row.acc.candidate.id,
      title: row.acc.candidate.title,
      score: row.score,
      kept: lightPass.has(row.acc.candidate.id),
      note: lightPass.has(row.acc.candidate.id) ? "kept" : "truncated",
    })),
  });

  const scored: ScoredItem[] = [];
  for (const row of lightRows) {
    if (!lightPass.has(row.acc.candidate.id)) continue;
    const applicable = new Set(APPLICABLE[row.acc.candidate.kind]);
    const probs = emptyProbs();
    let heavy = 0;
    let contributions: { label: string; weight: number }[] = [];
    let bestEv = -1;
    for (const action of ACTIONS) {
      if (!applicable.has(action.id)) continue;
      const { p, parts } = actionProb(action.id, row.features);
      probs[action.id] = p;
      const ev = weights[action.id] * p;
      heavy += ev;
      if (ev > bestEv) {
        bestEv = ev;
        contributions = parts.slice(0, 4);
      }
    }

    const queryFactor = query ? 0.5 + 1.5 * row.queryMatch : 1;
    const clickScore = heavy * queryFactor;
    const visibility = complianceOf(row.acc.candidate, input.overrides ?? {});

    const item: ScoredItem = {
      candidate: row.acc.candidate,
      sources: row.acc.sources,
      lightScore: row.score,
      probs,
      heavyScore: heavy,
      clickScore,
      visibility,
      visibilityReason:
        visibility === "allow"
          ? row.acc.candidate.complianceNote
          : input.overrides?.[row.acc.candidate.id]
            ? `Staff override: ${visibility}.`
            : row.acc.candidate.complianceNote,
      contributions,
      why: "",
      queryMatch: row.queryMatch,
      counterfactualRank: 0,
      placed: "organic",
      rank: 0,
    };
    item.why = whyText({
      sources: item.sources,
      probs,
      contributions,
      weights,
      placed: "organic",
      query: row.queryMatch,
      candidate: item.candidate,
    });
    scored.push(item);
  }

  scored.sort((a, b) => b.clickScore - a.clickScore);
  scored.forEach((item, index) => {
    item.counterfactualRank = index + 1;
  });

  trace.push({
    id: "heavy",
    title: "Heavy rank",
    purpose: "Expected value across watch, like, save, comment, share, follow, join squad and sponsor. No single blended relevance is used.",
    entered: scored.length,
    kept: scored.length,
    rows: scored.map((item) => ({
      id: item.candidate.id,
      title: item.candidate.title,
      score: item.heavyScore,
      kept: true,
      note: dominantNote(item, weights),
    })),
  });

  const allow = scored.filter((item) => item.visibility === "allow");
  const held = scored
    .filter((item) => item.visibility === "interstitial")
    .sort((a, b) => a.counterfactualRank - b.counterfactualRank);
  const dropped = scored
    .filter((item) => item.visibility === "drop")
    .sort((a, b) => a.counterfactualRank - b.counterfactualRank);

  trace.push({
    id: "gate",
    title: "Visibility gate",
    purpose: "Applied after scoring. Reports and staff decisions allow, hold or drop a post; a high score cannot buy eligibility.",
    entered: scored.length,
    kept: allow.length,
    rows: scored.map((item) => ({
      id: item.candidate.id,
      title: item.candidate.title,
      score: item.heavyScore,
      kept: item.visibility === "allow",
      note: item.visibility,
    })),
  });

  const feed = diversityOrder(allow, limit);
  applySponsorSlot(feed, allow, weights, limit);
  feed.forEach((item, index) => {
    item.rank = index + 1;
    if (item.placed === "native-slot") {
      item.why = whyText({
        sources: item.sources,
        probs: item.probs,
        contributions: item.contributions,
        weights,
        placed: "native-slot",
        query: item.queryMatch,
        candidate: item.candidate,
      });
    }
  });

  trace.push({
    id: "slots",
    title: "Sponsor slot",
    purpose: "At most one labeled campaign sits in slot four. It keeps its sponsor label and never inherits an organic disguise.",
    entered: feed.length,
    kept: feed.length,
    rows: feed.map((item) => ({
      id: item.candidate.id,
      title: item.candidate.title,
      score: item.clickScore,
      kept: true,
      note: item.placed === "native-slot" ? "native slot" : "organic",
    })),
  });

  const cold = viewer.coldStart ?? false;
  return {
    viewerId: viewer.id,
    clusterName: home?.name ?? "Unclustered",
    membership: membership.sort((a, b) => b.weight - a.weight),
    clusters: clusterModels,
    coldStart: {
      active: cold,
      confidence: viewer.confidence ?? 1,
      note: cold
        ? "Thin interaction history. Taste is shrunk toward the broad-feed prior until more likes, saves and follows land."
        : "Interaction history is past the cold-start prior.",
    },
    feed,
    held,
    dropped,
    scored,
    trace,
    retrieved: pool.size,
  };
}

function dominantNote(item: ScoredItem, weights: Record<ActionId, number>): string {
  let best = "";
  let bestEv = -1;
  for (const action of APPLICABLE[item.candidate.kind]) {
    const ev = weights[action] * item.probs[action];
    if (ev > bestEv) {
      bestEv = ev;
      best = DOMINANT.get(action) ?? action;
    }
  }
  return best;
}

function stage(
  id: string,
  title: string,
  purpose: string,
  ranked: { id: string; score: number; title: string }[],
  kept: { id: string }[],
): TraceStage {
  const ids = new Set(kept.map((row) => row.id));
  const sorted = ranked.slice().sort((a, b) => b.score - a.score);
  return {
    id,
    title,
    purpose,
    entered: sorted.filter((row) => row.score > 0).length,
    kept: kept.length,
    rows: rowsOf(sorted, ids),
  };
}

function rowsOf(
  sorted: { id: string; score: number; title: string }[],
  ids: Set<string>,
): TraceRow[] {
  return sorted.slice(0, 16).map((row) => ({
    id: row.id,
    title: row.title,
    score: row.score,
    kept: ids.has(row.id),
    note: ids.has(row.id) ? "nominated" : "below cutoff",
  }));
}

/**
 * Greedy diversity pass. Pure click order would fill the first screen with five
 * clips from the same creator; the penalty makes the feed read like a feed.
 */
function diversityOrder(allow: ScoredItem[], limit: number): ScoredItem[] {
  const pool = allow.slice();
  if (!pool.length) return [];
  const max = Math.max(...pool.map((item) => item.clickScore), 1e-6);
  const min = Math.min(...pool.map((item) => item.clickScore), 0);
  const span = Math.max(max - min, 1e-6);
  const normalise = (item: ScoredItem) => (item.clickScore - min) / span;
  const selected: ScoredItem[] = [];
  const lambda = 0.72;

  while (selected.length < limit && pool.length) {
    let bestIndex = 0;
    let best = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i]!;
      let nearest = 0;
      for (const chosen of selected) nearest = Math.max(nearest, similarity(candidate.candidate, chosen.candidate));
      const value = lambda * normalise(candidate) - (1 - lambda) * nearest;
      if (value > best) {
        best = value;
        bestIndex = i;
      }
    }
    const [picked] = pool.splice(bestIndex, 1);
    if (picked) selected.push(picked);
  }
  // Diversity chooses which posts make the cut; presentation still opens with
  // the strongest organic relevance.
  return selected.sort((a, b) => b.clickScore - a.clickScore);
}

/**
 * One campaign can take the fourth slot. It is removed from wherever the rank
 * placed it and inserted at slot four; the label is presentation, not ranking.
 */
function applySponsorSlot(
  feed: ScoredItem[],
  allow: ScoredItem[],
  weights: Record<ActionId, number>,
  limit: number,
) {
  if (weights.engage_sponsor <= 0.05) return;
  const campaigns = allow.filter(
    (item) => item.candidate.kind === "sponsored" && item.probs.engage_sponsor >= 0.05,
  );
  if (!campaigns.length || !feed.length) return;
  campaigns.sort((a, b) => b.heavyScore - a.heavyScore);
  const chosen = campaigns[0]!;
  const existing = feed.findIndex((item) => item.candidate.id === chosen.candidate.id);

  if (existing >= 0) {
    feed.splice(existing, 1);
  } else if (feed.length >= limit) {
    return;
  }

  chosen.placed = "native-slot";
  feed.splice(Math.min(SPONSOR_SLOT, feed.length), 0, chosen);
}

/** Human-readable candidate text, exposed for the corpus builder and tests. */
export function describeCandidate(candidate: Candidate): string {
  return candidateText(candidate);
}
