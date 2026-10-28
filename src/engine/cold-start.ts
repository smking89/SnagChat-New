import { clamp01, cosine, mean } from "./math.ts";
import type { Candidate, Viewer } from "./types.ts";

/** Interactions before a viewer's taste is trusted on its own. */
export const VIEWER_ACTIVITY_PRIOR = 8;
/** Recorded interactions before a post's heat is trusted. */
export const POST_SAMPLE_PRIOR = 12;

/** A new viewer is assumed to like a broad gaming feed, not one category. */
export const TASTE_PRIOR = [0.45, 0.4, 0.35, 0.45, 0.5, 0.4];

/** Thin engagement is unknown, not cold. */
const HEAT_PRIOR = 0.3;

export function shrinkTaste(
  raw: number[],
  activityIndex: number,
): { taste: number[]; confidence: number; cold: boolean } {
  const confidence = clamp01(activityIndex / VIEWER_ACTIVITY_PRIOR);
  if (confidence >= 1) return { taste: raw.slice(), confidence: 1, cold: false };
  const taste = raw.map(
    (value, index) => confidence * value + (1 - confidence) * (TASTE_PRIOR[index] ?? 0.4),
  );
  return { taste, confidence, cold: true };
}

export function prepareViewer(viewer: Viewer): Viewer {
  const activity = viewer.activityIndex ?? 0;
  const shrunk = shrinkTaste(viewer.taste, activity);
  return {
    ...viewer,
    taste: shrunk.taste,
    activityIndex: activity,
    confidence: shrunk.confidence,
    coldStart: shrunk.cold,
  };
}

export function viewerActivity(raw: Viewer, candidates: Candidate[]): number {
  const interacted = candidates.filter(
    (candidate) =>
      raw.seen?.includes(candidate.id) ||
      candidate.creatorId === raw.id,
  ).length;
  return (raw.activityIndex ?? 0) + interacted;
}

export function heatOf(candidate: Candidate): number {
  const { likes, comments, saves, shares } = candidate.engagement;
  const weighted = likes + 2 * comments + 2.5 * saves + 3 * shares;
  return clamp01(Math.log1p(weighted) / Math.log1p(2500));
}

export function prepareCandidate(candidate: Candidate): Candidate {
  const samples = candidate.sampleCount ?? candidate.engagement.likes;
  const trust = clamp01(samples / POST_SAMPLE_PRIOR);
  const heat = trust * heatOf(candidate) + (1 - trust) * HEAT_PRIOR;
  return {
    ...candidate,
    sampleCount: samples,
    heat,
    coldStart: trust < 1,
  };
}

/**
 * Average taste for a viewer from the posts they already acted on. Used by the
 * corpus builder; kept here because it is the same shrinkage contract.
 */
export function tasteFrom(candidates: Candidate[], weight = 1): number[] {
  if (!candidates.length) return TASTE_PRIOR.slice();
  const vectors = candidates.map((candidate) => candidate.taste.map((value) => value * weight));
  return mean(vectors);
}

export function affinity(a: Viewer, b: Viewer): number {
  return clamp01(cosine(a.taste, b.taste));
}
