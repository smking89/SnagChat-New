/** Small numeric helpers shared by the ranker. Standard operations only. */

export function dot(a: number[], b: number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i]! * b[i]!;
  return sum;
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

export function cosine(a: number[], b: number[]): number {
  const length = norm(a) * norm(b);
  if (length < 1e-9) return 0;
  return dot(a, b) / length;
}

export function sigmoid(z: number): number {
  const x = Math.max(-12, Math.min(12, z));
  return 1 / (1 + Math.exp(-x));
}

export function softmax(values: number[], temperature: number): number[] {
  const t = Math.max(temperature, 1e-4);
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp((value - max) / t));
  const total = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((value) => value / total);
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function mean(rows: number[][]): number[] {
  const dim = rows[0]?.length ?? 0;
  const acc = new Array<number>(dim).fill(0);
  for (const row of rows) {
    for (let i = 0; i < dim; i++) acc[i] += row[i] ?? 0;
  }
  return acc.map((value) => value / Math.max(1, rows.length));
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "your",
  "you",
  "are",
  "was",
  "just",
]);
