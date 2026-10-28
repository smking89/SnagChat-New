import { cosine, mean, tokenize } from "./math.ts";
import { KIND_LABEL, type Candidate, type ClusterModel, type Viewer } from "./types.ts";

const AXIS = [
  "Clip-first",
  "Loadout lab",
  "Skin hunters",
  "Screenshot roamers",
  "Squad-first",
  "Discovery-led",
];

function farthest(viewers: Viewer[], centroids: number[][]): number[] {
  let best = viewers[0]!.taste.slice();
  let bestDistance = -1;
  for (const viewer of viewers) {
    let nearest = Infinity;
    for (const centroid of centroids) nearest = Math.min(nearest, 1 - cosine(viewer.taste, centroid));
    if (nearest > bestDistance) {
      bestDistance = nearest;
      best = viewer.taste.slice();
    }
  }
  return best;
}

/**
 * K-means over multi-category taste. A viewer is rarely only "a clip person";
 * the centroid is how the feed finds a loadout post for someone who mostly
 * watches clips but saves every skin they see.
 */
export function buildClusters(viewers: Viewer[]): ClusterModel[] {
  if (viewers.length === 0) return [];
  const k = Math.min(5, viewers.length);
  let centroids = viewers.slice(0, k).map((viewer) => viewer.taste.slice());
  let assign = new Array<number>(viewers.length).fill(0);

  for (let iter = 0; iter < 10; iter++) {
    assign = viewers.map((viewer) => {
      let bestIndex = 0;
      let best = -Infinity;
      centroids.forEach((centroid, index) => {
        const score = cosine(viewer.taste, centroid);
        if (score > best) {
          best = score;
          bestIndex = index;
        }
      });
      return bestIndex;
    });
    centroids = centroids.map((_, index) => {
      const members = viewers.filter((_, i) => assign[i] === index);
      if (!members.length) {
        return farthest(
          viewers,
          centroids.filter((_, i) => i !== index),
        );
      }
      return mean(members.map((member) => member.taste));
    });
  }

  const used = new Set<string>();
  return centroids.map((centroid, index) => {
    const memberIds = viewers.filter((_, i) => assign[i] === index).map((viewer) => viewer.id);
    let name: string;
    if (memberIds.length <= 1) {
      name = "Thin graph";
    } else {
      const order = centroid.map((value, axis) => ({ axis, value })).sort((a, b) => b.value - a.value);
      name = AXIS[order[0]!.axis] ?? "Mixed feed";
      if (used.has(name)) {
        const alt = AXIS[order[1]!.axis];
        name = alt && !used.has(alt) ? alt : `${name} ${index + 1}`;
      }
    }
    used.add(name);
    return { id: `c${index}`, name, centroid, memberIds };
  });
}

/**
 * Edges SnagChat actually has: follows, shared squads, and shared games. There
 * is no message-edge here on purpose — a DM is private and should not leak into
 * feed ranking.
 */
export function buildEdges(viewers: Viewer[]): Map<string, Map<string, number>> {
  const pairs = new Map<string, number>();
  const bump = (a: string, b: string, weight: number) => {
    if (a === b || weight <= 0) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    pairs.set(key, (pairs.get(key) ?? 0) + weight);
  };

  for (const viewer of viewers) {
    for (const followed of viewer.follows) {
      if (viewer.id < followed) bump(viewer.id, followed, 1);
      else bump(followed, viewer.id, 1);
    }
  }
  for (let i = 0; i < viewers.length; i++) {
    for (let j = i + 1; j < viewers.length; j++) {
      const a = viewers[i]!;
      const b = viewers[j]!;
      const sharedSquads = a.squads.filter((id) => b.squads.includes(id)).length;
      if (sharedSquads) bump(a.id, b.id, 0.7 * Math.min(sharedSquads, 2));
      const sharedGames = a.games.filter((id) => b.games.includes(id)).length;
      if (sharedGames) bump(a.id, b.id, 0.2 * Math.min(sharedGames, 2));
    }
  }

  const edges = new Map<string, Map<string, number>>();
  for (const viewer of viewers) edges.set(viewer.id, new Map());
  for (const [key, weight] of pairs) {
    const [a, b] = key.split("|");
    if (!a || !b) continue;
    if (!edges.has(a)) edges.set(a, new Map());
    if (!edges.has(b)) edges.set(b, new Map());
    edges.get(a)!.set(b, weight);
    edges.get(b)!.set(a, weight);
  }
  return edges;
}

export interface Bm25Doc {
  id: string;
  tf: Map<string, number>;
  len: number;
}

export interface Bm25Index {
  docs: Bm25Doc[];
  df: Map<string, number>;
  avgdl: number;
  n: number;
}

export function candidateText(candidate: Candidate): string {
  return [
    candidate.title,
    candidate.game,
    candidate.category,
    KIND_LABEL[candidate.kind],
    candidate.creatorName,
    candidate.tags.join(" "),
    candidate.sponsor?.brand ?? "",
  ].join(" ");
}

export function buildBm25(candidates: Candidate[]): Bm25Index {
  const docs: Bm25Doc[] = candidates.map((candidate) => {
    const tokens = tokenize(candidateText(candidate));
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    return { id: candidate.id, tf, len: tokens.length || 1 };
  });
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of doc.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const avgdl = docs.length === 0 ? 1 : docs.reduce((sum, doc) => sum + doc.len, 0) / docs.length;
  return { docs, df, avgdl, n: docs.length };
}

export function clusterNameFor(clusters: ClusterModel[], viewerId: string): string {
  return clusters.find((cluster) => cluster.memberIds.includes(viewerId))?.name ?? "Unclustered";
}
