/**
 * Typed client for the staff API (contract: docs/admin-api.md).
 * Same-origin only: the Vite dev server proxies /api to Wrangler, and in
 * production the Worker answers it directly.
 */

export type Role = "superadmin" | "admin" | "moderator";

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastLoginAt: number | null;
}

export interface StaffRow extends Staff {
  status: "active" | "suspended";
  createdAt: number;
  assignedOpen?: number;
}

export interface Kpi {
  id: string;
  label: string;
  value: number;
  delta: number;
  spark: number[];
}

export interface AttentionItem {
  kind: "report" | "verification" | "campaign" | "creator" | "payout";
  label: string;
  count: number;
  href: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
  posts?: number;
  newPlayers?: number;
}

export interface Queues {
  open: number;
  claimed: number;
  escalated: number;
  slaBreached: number;
}

export interface Revenue {
  platformFeeRate: number;
  gmvCents: number;
  feeCents: number;
  pendingPayoutCents: number;
}

export interface Metrics {
  role: Role;
  scope: "platform" | "ops" | "queue";
  generatedAt: number;
  kpi: Kpi[];
  attention: AttentionItem[];
  series: Record<string, SeriesPoint[]>;
  queues: Queues;
  revenue?: Revenue;
  staff?: StaffRow[];
  lastDay?: { posts: number; dau: number; newPlayers: number };
}

export type ReportStatus = "open" | "claimed" | "escalated" | "resolved";
export type Severity = "low" | "medium" | "high" | "critical";

export interface Report {
  id: string;
  mode: "post" | "ad";
  reason: string;
  detail: string;
  status: ReportStatus;
  severity: Severity;
  createdAt: number;
  updatedAt: number;
  slaDueAt: number;
  slaBreached: boolean;
  resolution: string | null;
  resolutionNote: string | null;
  assignedTo: { id: string; name: string | null } | null;
  reporter: { id: string; handle: string | null } | null;
  reporterCount: number;
  content: {
    id: string;
    title: string;
    game: string;
    category: string;
    mediaKind: "image" | "clip";
    coverUrl: string | null;
    state: "allow" | "interstitial" | "drop";
    author: {
      id: string;
      handle: string;
      name: string;
      verified: boolean;
      status: string;
      strikes: number;
    };
    stats: { likes: number; comments: number; saves: number; shares: number };
  };
}

export interface ReportList {
  items: Report[];
  nextCursor: string | null;
  total: number;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      "content-type": "application/json",
      "x-requested-with": "XMLHttpRequest",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "internal",
      payload?.error?.message ?? "The request could not be completed",
    );
  }
  return payload as T;
}

export const api = {
  me: () => request<{ staff: Staff }>("/auth/me").then((data) => data.staff),

  login: (email: string, password: string) =>
    request<{ staff: Staff }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => data.staff),

  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST", body: "{}" }),

  metrics: () => request<Metrics>("/metrics/overview"),

  reports: (params: { status?: string; queue?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.queue) query.set("queue", params.queue);
    if (params.limit) query.set("limit", String(params.limit));
    return request<ReportList>(`/reports?${query.toString()}`);
  },

  claim: (id: string, claim: boolean) =>
    request<{ report: Report }>(`/reports/${id}/claim`, {
      method: "POST",
      body: JSON.stringify({ claim }),
    }).then((data) => data.report),
};
