/**
 * SnagChat worker: the staff API plus the static consumer app.
 *
 * Everything under /api/v1 is served from D1 (binding `DB`); every other path
 * falls through to the uploaded assets, so the deployed site keeps working
 * exactly as it does today. Contract: docs/admin-api.md.
 *
 * Local development: `npm run dev:api` (Wrangler, local D1), schema and seed
 * in deploy/schema.sql and deploy/seed.sql.
 */

const API_PREFIX = "/api/v1";
const COOKIE_NAME = "snagchat_staff";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const PBKDF2_ITERATIONS = 120000;
const UNDO_WINDOW_SECONDS = 5;

const ROLE_CAPABILITIES = {
  superadmin: ["*"],
  admin: [
    "metrics.read",
    "reports.read",
    "reports.decide",
    "reports.restore",
    "users.read",
    "users.action",
    "escalations.read",
    "audit.read",
  ],
  moderator: ["metrics.read", "reports.read", "reports.decide", "users.read", "users.action", "audit.read"],
};

const USER_ACTIONS = {
  moderator: ["warn", "timeout"],
  admin: ["warn", "timeout", "suspend", "verify"],
  superadmin: ["warn", "timeout", "suspend", "verify", "ban", "delete"],
};

const DECISION_NOTE_REQUIRED = new Set(["escalate", "restore"]);

/** Capabilities are additive: superadmin matches everything through `*`. */
export function can(role, capability) {
  const caps = ROLE_CAPABILITIES[role];
  return Array.isArray(caps) && (caps.includes("*") || caps.includes(capability));
}

/** The user actions a role may take, in the order the UI offers them. */
export function allowedUserActions(role) {
  return USER_ACTIONS[role] ?? [];
}

/* ------------------------------------------------------------------ HTTP */

function json(data, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function fail(status, code, message) {
  return json({ error: { code, message } }, { status });
}

function readBody(request) {
  return request
    .json()
    .catch(() => null);
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function parseCookies(header) {
  const out = {};
  for (const part of (header ?? "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0) out[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return out;
}

/** Constant-time string comparison (length is not secret here). */
function safeEqual(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations },
    key,
    256,
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

/** Stored as `pbkdf2$<iterations>$<salt>$<hash>`, both base64. */
export async function hashPassword(password, salt = crypto.randomUUID()) {
  const derived = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${btoa(salt)}$${derived}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;
  const salt = atob(parts[2]);
  const expected = parts[3];
  const actual = await pbkdf2(password, salt, iterations);
  return safeEqual(actual, expected);
}

/** Runs the same work as a failed lookup so timing does not leak the email. */
const DUMMY_HASH_CACHE = { value: null };
async function dummyVerify(password) {
  if (!DUMMY_HASH_CACHE.value) DUMMY_HASH_CACHE.value = await hashPassword("not-a-real-password");
  await verifyPassword(password, DUMMY_HASH_CACHE.value);
  return false;
}

/* ------------------------------------------------------------------ auth */

async function staffFromRequest(request, env) {
  const token = parseCookies(request.headers.get("cookie"))[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id, s.name, s.email, s.role, s.status, s.last_login_at
       FROM sessions x JOIN staff s ON s.id = x.staff_id
      WHERE x.token_hash = ? AND x.expires_at > ?`,
  )
    .bind(tokenHash, nowSeconds())
    .first();
  if (!row || row.status !== "active") return null;
  return row;
}

function publicStaff(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    lastLoginAt: row.last_login_at ?? null,
  };
}

function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

async function handleLogin(request, env, body) {
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) return fail(422, "validation", "Email and password are required");

  const row = await env.DB.prepare("SELECT * FROM staff WHERE email = ?").bind(email).first();
  const ok = row ? await verifyPassword(password, row.password_hash) : await dummyVerify(password);
  if (!row || !ok) return fail(401, "unauthorized", "Email or password is incorrect");
  if (row.status !== "active") return fail(403, "forbidden", "This staff account is suspended");

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const stamp = nowSeconds();
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, staff_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  )
    .bind(await sha256Hex(token), row.id, stamp, stamp + SESSION_TTL_SECONDS)
    .run();
  await env.DB.prepare("UPDATE staff SET last_login_at = ? WHERE id = ?").bind(stamp, row.id).run();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(stamp).run();

  return json(
    { staff: publicStaff({ ...row, last_login_at: stamp }) },
    { headers: { "set-cookie": sessionCookie(token, request) } },
  );
}

async function handleLogout(request, env) {
  const token = parseCookies(request.headers.get("cookie"))[COOKIE_NAME];
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
      },
    },
  );
}

async function handleMe(_request, env, _url, _body, staff) {
  return json({ staff: publicStaff(staff) });
}

/* --------------------------------------------------------------- metrics */

function isoDayLabel(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

async function all(env, sql, ...binds) {
  const statement = env.DB.prepare(sql);
  return (binds.length ? statement.bind(...binds) : statement).all();
}

async function scalar(env, sql, ...binds) {
  const row = await all(env, sql, ...binds);
  const first = row.results?.[0];
  return first ? Object.values(first)[0] : 0;
}

async function activitySeries(env, days) {
  const rows = await all(
    env,
    "SELECT day, posts, dau, new_players FROM activity_daily ORDER BY day DESC LIMIT ?",
    days,
  );
  return rows.results
    .slice()
    .reverse()
    .map((row) => ({
      label: isoDayLabel(row.day),
      posts: row.posts,
      value: row.dau,
      newPlayers: row.new_players,
    }));
}

async function reportSeries(env, days) {
  const since = nowSeconds() - days * 86400;
  const rows = await all(
    env,
    "SELECT created_at / 86400 AS d, COUNT(*) AS n FROM reports WHERE created_at >= ? GROUP BY d",
    since,
  );
  const counts = new Map(rows.results.map((row) => [Number(row.d), Number(row.n)]));
  const out = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = Math.floor(nowSeconds() / 86400) - offset;
    out.push({ label: isoDayLabel(day * 86400), value: counts.get(day) ?? 0 });
  }
  return out;
}

function groupToSeries(rows, labelKey = "label") {
  return rows.map((row) => ({
    label: String(row[labelKey] ?? "Unknown"),
    value: Number(row.n ?? 0),
  }));
}

async function queueCounts(env) {
  const [open, claimed, escalated, breached] = await Promise.all([
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status = 'open'"),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status = 'claimed'"),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status = 'escalated'"),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status IN ('open','claimed','escalated') AND sla_due_at < ?",
      nowSeconds()),
  ]);
  return {
    open: Number(open),
    claimed: Number(claimed),
    escalated: Number(escalated),
    slaBreached: Number(breached),
  };
}

function delta(current, previous) {
  const base = Number(previous);
  if (!base) return 0;
  return Number(((Number(current) - base) / base).toFixed(4));
}

async function platformMetrics(env) {
  const activity = await activitySeries(env, 30);
  const latest = activity[activity.length - 1];
  const weekAgo = activity[activity.length - 8];
  const twoWeeksAgo = activity[activity.length - 15];

  const [
    openReports,
    pastSla,
    verificationRequests,
    creatorPending,
    campaignsInReview,
    restrictedPayouts,
    gmv,
    fees,
    restrictedGmv,
    byCategory,
    byReason,
    byRegion,
    queues,
    roster,
  ] = await Promise.all([
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status IN ('open','claimed','escalated')"),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status IN ('open','claimed','escalated') AND sla_due_at < ?", nowSeconds()),
    scalar(env, "SELECT COUNT(*) FROM players WHERE verification_requested = 1"),
    scalar(env, "SELECT COUNT(*) FROM creator_applications WHERE status = 'pending'"),
    scalar(env, "SELECT COUNT(*) FROM campaigns WHERE status = 'in_review'"),
    scalar(env, "SELECT COUNT(*) FROM creator_applications WHERE stripe_state = 'restricted'"),
    scalar(env, "SELECT COALESCE(SUM(amount_cents), 0) FROM sales WHERE created_at > ?", nowSeconds() - 30 * 86400),
    scalar(env, "SELECT COALESCE(SUM(fee_cents), 0) FROM sales WHERE created_at > ?", nowSeconds() - 30 * 86400),
    scalar(
      env,
      `SELECT COALESCE(SUM(s.amount_cents - s.fee_cents), 0) FROM sales s
         JOIN creator_applications c ON c.id = s.creator_id
        WHERE s.created_at > ? AND c.stripe_state <> 'active'`,
      nowSeconds() - 30 * 86400,
    ),
    all(env, "SELECT category AS label, COUNT(*) AS n FROM content GROUP BY category ORDER BY n DESC"),
    all(env, "SELECT reason AS label, COUNT(*) AS n FROM reports GROUP BY reason ORDER BY n DESC"),
    all(env, "SELECT region AS label, COUNT(*) AS n FROM players GROUP BY region ORDER BY n DESC"),
    queueCounts(env),
    all(
      env,
      `SELECT s.id, s.name, s.email, s.role, s.status, s.last_login_at,
              (SELECT COUNT(*) FROM reports r WHERE r.assigned_to = s.id AND r.status IN ('claimed','escalated')) AS assigned
         FROM staff s ORDER BY s.role, s.name`,
    ),
  ]);

  return {
    role: "superadmin",
    scope: "platform",
    generatedAt: nowSeconds(),
    kpi: [
      { id: "dau", label: "Daily active players", value: latest?.value ?? 0, delta: delta(latest?.value, weekAgo?.value), spark: activity.slice(-14).map((point) => point.value) },
      { id: "signups", label: "New players (7d)", value: activity.slice(-7).reduce((sum, point) => sum + point.newPlayers, 0), delta: delta(
        activity.slice(-7).reduce((sum, point) => sum + point.newPlayers, 0),
        activity.slice(-14, -7).reduce((sum, point) => sum + point.newPlayers, 0),
      ), spark: activity.slice(-14).map((point) => point.newPlayers) },
      { id: "posts", label: "Posts today", value: latest?.posts ?? 0, delta: delta(latest?.posts, weekAgo?.posts), spark: activity.slice(-14).map((point) => point.posts) },
      { id: "reports", label: "Open reports", value: Number(openReports), delta: 0, spark: (await reportSeries(env, 14)).map((point) => point.value) },
    ],
    attention: [
      { kind: "report", label: "Reports past SLA", count: Number(pastSla), href: "#reports" },
      { kind: "verification", label: "Verification requests", count: Number(verificationRequests), href: "#players" },
      { kind: "creator", label: "Creator applications pending", count: Number(creatorPending), href: "#creators" },
      { kind: "campaign", label: "Campaigns in review", count: Number(campaignsInReview), href: "#advertising" },
      { kind: "payout", label: "Payouts action required", count: Number(restrictedPayouts), href: "#payouts" },
    ],
    series: {
      activity,
      byCategory: groupToSeries(byCategory.results ?? []),
      byReason: groupToSeries(byReason.results ?? []),
      byRegion: groupToSeries(byRegion.results ?? []),
    },
    queues,
    revenue: {
      platformFeeRate: 0.025,
      gmvCents: Number(gmv),
      feeCents: Number(fees),
      pendingPayoutCents: Number(restrictedGmv),
    },
    staff: (roster.results ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      lastLoginAt: row.last_login_at,
      assignedOpen: Number(row.assigned),
    })),
    lastDay: {
      posts: latest?.posts ?? 0,
      dau: latest?.value ?? 0,
      newPlayers: latest?.newPlayers ?? 0,
      previousDau: twoWeeksAgo?.value ?? 0,
    },
  };
}

async function opsMetrics(env) {
  const activity = await activitySeries(env, 30);
  const latest = activity[activity.length - 1];
  const sevenDays = activity.slice(-7);
  const previousSeven = activity.slice(-14, -7);

  const [
    postsSeven,
    previousPostsSeven,
    newPlayersSeven,
    escalated,
    verificationRequests,
    creatorPending,
    campaignsInReview,
    byCategory,
    byReason,
    queues,
  ] = await Promise.all([
    scalar(env, "SELECT COALESCE(SUM(posts), 0) FROM activity_daily WHERE day > ?", nowSeconds() - 7 * 86400),
    scalar(env, "SELECT COALESCE(SUM(posts), 0) FROM activity_daily WHERE day > ? AND day <= ?", nowSeconds() - 14 * 86400, nowSeconds() - 7 * 86400),
    scalar(env, "SELECT COALESCE(SUM(new_players), 0) FROM activity_daily WHERE day > ?", nowSeconds() - 7 * 86400),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status = 'escalated'"),
    scalar(env, "SELECT COUNT(*) FROM players WHERE verification_requested = 1"),
    scalar(env, "SELECT COUNT(*) FROM creator_applications WHERE status = 'pending'"),
    scalar(env, "SELECT COUNT(*) FROM campaigns WHERE status = 'in_review'"),
    all(env, "SELECT category AS label, COUNT(*) AS n FROM content GROUP BY category ORDER BY n DESC"),
    all(env, "SELECT reason AS label, COUNT(*) AS n FROM reports GROUP BY reason ORDER BY n DESC"),
    queueCounts(env),
  ]);

  return {
    role: "admin",
    scope: "ops",
    generatedAt: nowSeconds(),
    kpi: [
      { id: "posts7d", label: "Posts (7d)", value: Number(postsSeven), delta: delta(postsSeven, previousPostsSeven), spark: sevenDays.map((point) => point.posts) },
      { id: "players", label: "New players (7d)", value: Number(newPlayersSeven), delta: delta(
        newPlayersSeven,
        previousSeven.reduce((sum, point) => sum + point.newPlayers, 0),
      ), spark: sevenDays.map((point) => point.newPlayers) },
      { id: "escalated", label: "Escalated to you", value: Number(escalated), delta: 0, spark: (await reportSeries(env, 14)).map((point) => point.value) },
      { id: "review", label: "Campaigns in review", value: Number(campaignsInReview), delta: 0, spark: [] },
    ],
    attention: [
      { kind: "creator", label: "Creator applications pending", count: Number(creatorPending), href: "#creators" },
      { kind: "campaign", label: "Campaigns in review", count: Number(campaignsInReview), href: "#advertising" },
      { kind: "verification", label: "Verification requests", count: Number(verificationRequests), href: "#players" },
      { kind: "report", label: "Escalated reports", count: Number(escalated), href: "#escalations" },
    ],
    series: {
      activity,
      byCategory: groupToSeries(byCategory.results ?? []),
      byReason: groupToSeries(byReason.results ?? []),
    },
    queues,
    lastDay: { posts: latest?.posts ?? 0, dau: latest?.value ?? 0, newPlayers: latest?.newPlayers ?? 0 },
  };
}

async function queueMetrics(env, staff) {
  const [
    mine,
    unassigned,
    breached,
    resolvedToday,
    byReason,
    byStatus,
    byCategory,
    queues,
  ] = await Promise.all([
    scalar(env, "SELECT COUNT(*) FROM reports WHERE assigned_to = ? AND status IN ('claimed','escalated')", staff.id),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE assigned_to IS NULL AND status IN ('open','escalated')"),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE status IN ('open','claimed','escalated') AND sla_due_at < ?", nowSeconds()),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE resolved_by = ? AND resolved_at > ?", staff.id, startOfToday()),
    all(
      env,
      `SELECT r.reason AS label, COUNT(*) AS n FROM reports r
        WHERE r.status IN ('open','claimed','escalated') GROUP BY r.reason ORDER BY n DESC`,
    ),
    all(env, "SELECT status AS label, COUNT(*) AS n FROM reports GROUP BY status ORDER BY n DESC"),
    all(
      env,
      `SELECT c.category AS label, COUNT(*) AS n FROM reports r JOIN content c ON c.id = r.content_id
        WHERE r.status IN ('open','claimed','escalated') GROUP BY c.category ORDER BY n DESC`,
    ),
    queueCounts(env),
  ]);

  return {
    role: "moderator",
    scope: "queue",
    generatedAt: nowSeconds(),
    kpi: [
      { id: "mine", label: "Assigned to you", value: Number(mine), delta: 0, spark: (await reportSeries(env, 14)).map((point) => point.value) },
      { id: "unassigned", label: "Unassigned", value: Number(unassigned), delta: 0, spark: [] },
      { id: "breached", label: "Past SLA", value: Number(breached), delta: 0, spark: [] },
      { id: "resolved", label: "Resolved by you today", value: Number(resolvedToday), delta: 0, spark: [] },
    ],
    attention: [
      { kind: "report", label: "Reports past SLA", count: Number(breached), href: "#queue" },
      { kind: "report", label: "Unassigned reports", count: Number(unassigned), href: "#queue" },
    ],
    series: {
      byReason: groupToSeries(byReason.results ?? []),
      byStatus: groupToSeries(byStatus.results ?? []),
      byCategory: groupToSeries(byCategory.results ?? []),
      reportsPerDay: await reportSeries(env, 14),
    },
    queues,
  };
}

function startOfToday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

async function handleMetrics(_request, env, _url, _body, staff) {
  if (staff.role === "superadmin") return json(await platformMetrics(env));
  if (staff.role === "admin") return json(await opsMetrics(env));
  return json(await queueMetrics(env, staff));
}

/* ---------------------------------------------------------------- reports */

function mapReport(row) {
  return {
    id: row.id,
    mode: row.mode,
    reason: row.reason,
    detail: row.detail ?? "",
    status: row.status,
    severity: row.severity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slaDueAt: row.sla_due_at,
    slaBreached: row.sla_due_at < nowSeconds() && row.status !== "resolved",
    resolution: row.resolution ?? null,
    resolutionNote: row.resolution_note ?? null,
    assignedTo: row.assigned_to ? { id: row.assigned_to, name: row.assigned_name ?? null } : null,
    reporter: row.reporter_id ? { id: row.reporter_id, handle: row.reporter_handle ?? null } : null,
    reporterCount: Number(row.reporter_count ?? 1),
    content: {
      id: row.content_id,
      title: row.title,
      game: row.game,
      category: row.category,
      mediaKind: row.media_kind,
      coverUrl: row.cover_url,
      state: row.state,
      author: {
        id: row.author_id,
        handle: row.author_handle,
        name: row.author_name,
        verified: Boolean(row.author_verified),
        status: row.author_status,
        strikes: Number(row.author_strikes ?? 0),
      },
      stats: {
        likes: Number(row.likes ?? 0),
        comments: Number(row.comments ?? 0),
        saves: Number(row.saves ?? 0),
        shares: Number(row.shares ?? 0),
      },
    },
  };
}

const REPORT_SELECT = `
  SELECT r.*,
         c.title, c.game, c.category, c.media_kind, c.cover_url, c.state,
         c.likes, c.comments, c.saves, c.shares,
         p.id AS author_id, p.handle AS author_handle, p.name AS author_name,
         p.verified AS author_verified, p.status AS author_status, p.strikes AS author_strikes,
         s.name AS assigned_name,
         rp.handle AS reporter_handle,
         (SELECT COUNT(*) FROM reports r2 WHERE r2.content_id = r.content_id) AS reporter_count
    FROM reports r
    JOIN content c ON c.id = r.content_id
    JOIN players p ON p.id = c.author_id
    LEFT JOIN staff s ON s.id = r.assigned_to
    LEFT JOIN players rp ON rp.id = r.reporter_id`;

function encodeCursor(row) {
  return `${row.created_at}:${row.id}`;
}

async function handleReportList(request, env, url) {
  const status = url.searchParams.get("status") ?? "open";
  const reason = url.searchParams.get("reason");
  const queue = url.searchParams.get("queue") ?? "team";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) ?? 25, 1), 100);
  const cursor = url.searchParams.get("cursor");
  const staff = request.staff;

  // Filters are kept as {clause, binds} pairs so the page query and the count
  // query can be composed independently without shifting bind positions.
  const filters = [];
  if (status !== "all") filters.push({ clause: "r.status = ?", binds: [status] });
  if (reason) filters.push({ clause: "r.reason = ?", binds: [reason] });
  if (queue === "mine") filters.push({ clause: "r.assigned_to = ?", binds: [staff.id] });
  if (cursor && cursor.includes(":")) {
    const [createdAt, id] = cursor.split(":");
    filters.push({
      clause: "(r.created_at < ? OR (r.created_at = ? AND r.id < ?))",
      binds: [Number(createdAt), Number(createdAt), id],
    });
  }

  const where = filters.length ? `WHERE ${filters.map((filter) => filter.clause).join(" AND ")}` : "";
  const binds = filters.flatMap((filter) => filter.binds);
  const rows = await all(
    env,
    `${REPORT_SELECT} ${where} ORDER BY r.created_at DESC, r.id DESC LIMIT ?`,
    ...binds,
    limit + 1,
  );
  const totalFilters = filters.filter((filter) => !filter.clause.startsWith("(r.created_at"));
  const total = await scalar(
    env,
    `SELECT COUNT(*) FROM reports r ${
      totalFilters.length ? `WHERE ${totalFilters.map((filter) => filter.clause).join(" AND ")}` : ""
    }`,
    ...totalFilters.flatMap((filter) => filter.binds),
  );
  const last = rows.results?.[limit - 1];
  const nextCursor = rows.results?.length > limit && last ? encodeCursor(last) : null;
  return json({ items: (rows.results ?? []).slice(0, limit).map(mapReport), nextCursor, total: Number(total) });
}

async function handleReportGet(_request, env, _url, _body, _staff, id) {
  const row = await all(env, `${REPORT_SELECT} WHERE r.id = ?`, id);
  const report = row.results?.[0];
  if (!report) return fail(404, "not_found", "No report with that id");
  const history = await all(
    env,
    "SELECT * FROM audit_log WHERE target_type = 'report' AND target_id = ? ORDER BY created_at DESC LIMIT 25",
    id,
  );
  return json({
    report: mapReport(report),
    history: (history.results ?? []).map(mapAudit),
  });
}

async function handleClaim(request, env, _url, body, staff, id) {
  const claim = body?.claim !== false;
  const current = await env.DB.prepare("SELECT assigned_to, status FROM reports WHERE id = ?").bind(id).first();
  if (!current) return fail(404, "not_found", "No report with that id");

  if (claim) {
    if (current.assigned_to && current.assigned_to !== staff.id) {
      return fail(409, "conflict", "Another moderator is already working on this report");
    }
    if (current.status === "resolved") return fail(409, "conflict", "This report is already resolved");
    await env.DB.prepare(
      "UPDATE reports SET assigned_to = ?, status = 'claimed', updated_at = ? WHERE id = ?",
    ).bind(staff.id, nowSeconds(), id).run();
  } else {
    await env.DB.prepare(
      "UPDATE reports SET assigned_to = NULL, status = 'open', updated_at = ? WHERE id = ? AND assigned_to = ?",
    ).bind(nowSeconds(), id, staff.id).run();
  }
  return handleReportGet(request, env, { }, null, staff, id);
}

const DECISION_EFFECTS = {
  allow: { status: "resolved", state: "allow" },
  label: { status: "resolved", state: "interstitial" },
  remove: { status: "resolved", state: "drop" },
  dismiss: { status: "resolved", state: null },
  escalate: { status: "escalated", state: null },
  restore: { status: "resolved", state: "allow" },
};

async function handleDecision(request, env, _url, body, staff, id) {
  const decision = String(body?.decision ?? "");
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const effect = DECISION_EFFECTS[decision];
  if (!effect) return fail(422, "validation", "Unknown decision");
  if (decision === "restore" && !can(staff.role, "reports.restore")) {
    return fail(403, "forbidden", "Only an admin or superadmin can restore content");
  }
  if (DECISION_NOTE_REQUIRED.has(decision) && !note) {
    return fail(422, "validation", "A note is required for this decision");
  }

  const existing = await all(env, `${REPORT_SELECT} WHERE r.id = ?`, id);
  const row = existing.results?.[0];
  if (!row) return fail(404, "not_found", "No report with that id");
  if (row.status === "resolved") return fail(409, "conflict", "This report is already resolved");

  const stamp = nowSeconds();
  const before = { status: row.status, state: row.state };
  const after = { status: effect.status, state: effect.state ?? row.state, resolution: decision };

  await env.DB.prepare(
    `UPDATE reports
        SET status = ?, resolution = ?, resolution_note = ?, resolved_by = ?, resolved_at = ?,
            assigned_to = COALESCE(assigned_to, ?), updated_at = ?
      WHERE id = ?`,
  )
    .bind(
      effect.status,
      effect.status === "resolved" ? decision : null,
      note || null,
      effect.status === "resolved" ? staff.id : null,
      effect.status === "resolved" ? stamp : null,
      staff.id,
      stamp,
      id,
    )
    .run();

  if (effect.state && effect.state !== row.state) {
    await env.DB.prepare("UPDATE content SET state = ? WHERE id = ?").bind(effect.state, row.content_id).run();
  }

  const auditId = await writeAudit(env, {
    actorId: staff.id,
    actorRole: staff.role,
    action: `report.decision.${decision}`,
    targetType: "report",
    targetId: id,
    before,
    after,
    note,
  });

  const updated = await all(env, `${REPORT_SELECT} WHERE r.id = ?`, id);
  return json({ report: mapReport(updated.results[0]), undoToken: `aud_${auditId}` });
}

/* ----------------------------------------------------------------- users */

function mapPlayer(row) {
  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    avatarUrl: row.avatar_url ?? null,
    verified: Boolean(row.verified),
    private: Boolean(row.private_account),
    verificationRequested: Boolean(row.verification_requested),
    region: row.region,
    platform: row.platform,
    status: row.status,
    statusUntil: row.status_until ?? null,
    strikes: Number(row.strikes ?? 0),
    posts: Number(row.posts ?? 0),
    followers: Number(row.followers ?? 0),
    joinedAt: row.joined_at,
    lastSeenAt: row.last_seen_at ?? null,
  };
}

async function handleUserList(_request, env, url) {
  const query = (url.searchParams.get("query") ?? "").trim();
  const status = url.searchParams.get("status");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) ?? 25, 1), 100);
  const where = [];
  const binds = [];
  if (query) {
    where.push("(handle LIKE ? OR name LIKE ?)");
    binds.push(`%${query}%`, `%${query}%`);
  }
  if (status) {
    where.push("status = ?");
    binds.push(status);
  }
  const rows = await all(
    env,
    `SELECT * FROM players ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY followers DESC LIMIT ?`,
    ...binds,
    limit,
  );
  const total = await scalar(
    env,
    `SELECT COUNT(*) FROM players ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`,
    ...binds,
  );
  return json({ items: (rows.results ?? []).map(mapPlayer), nextCursor: null, total: Number(total) });
}

async function handleUserGet(_request, env, _url, _body, _staff, id) {
  const row = await env.DB.prepare("SELECT * FROM players WHERE id = ?").bind(id).first();
  if (!row) return fail(404, "not_found", "No player with that id");
  const [posts, against, by] = await Promise.all([
    all(
      env,
      "SELECT id, title, game, category, state, created_at FROM content WHERE author_id = ? ORDER BY created_at DESC LIMIT 6",
      id,
    ),
    scalar(
      env,
      `SELECT COUNT(*) FROM reports r JOIN content c ON c.id = r.content_id WHERE c.author_id = ?`,
      id,
    ),
    scalar(env, "SELECT COUNT(*) FROM reports WHERE reporter_id = ?", id),
  ]);
  return json({
    player: mapPlayer(row),
    recentPosts: (posts.results ?? []).map((post) => ({
      id: post.id,
      title: post.title,
      game: post.game,
      category: post.category,
      state: post.state,
      createdAt: post.created_at,
    })),
    reportsAgainst: Number(against),
    reportsBy: Number(by),
  });
}

const ACTION_EFFECTS = {
  warn: (player, body) => ({ strikes: Number(player.strikes) + 1, status: player.status, status_until: player.status_until, verified: player.verified }),
  timeout: (player, body) => ({
    strikes: Number(player.strikes),
    status: "timed_out",
    status_until: nowSeconds() + Number(body?.durationHours) * 3600,
    verified: player.verified,
  }),
  suspend: (player, body) => ({
    strikes: Number(player.strikes),
    status: "suspended",
    status_until: nowSeconds() + Number(body?.durationHours) * 3600,
    verified: player.verified,
  }),
  verify: (player) => ({
    strikes: Number(player.strikes),
    status: player.status,
    status_until: player.status_until,
    verified: 1,
  }),
  ban: (player) => ({
    strikes: Number(player.strikes),
    status: "banned",
    status_until: null,
    verified: player.verified,
  }),
  delete: (player) => ({ strikes: Number(player.strikes), status: "banned", status_until: null, verified: 0 }),
};

async function handleUserAction(request, env, _url, body, staff, id) {
  const action = String(body?.action ?? "");
  if (!allowedUserActions(staff.role).includes(action)) {
    return fail(403, "forbidden", `Role "${staff.role}" cannot apply "${action}"`);
  }
  const note = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!note) return fail(422, "validation", "A reason is required");
  if ((action === "timeout" || action === "suspend") && !Number(body?.durationHours)) {
    return fail(422, "validation", "durationHours is required for this action");
  }

  const player = await env.DB.prepare("SELECT * FROM players WHERE id = ?").bind(id).first();
  if (!player) return fail(404, "not_found", "No player with that id");

  const before = { status: player.status, status_until: player.status_until, verified: player.verified, strikes: player.strikes };
  const after = ACTION_EFFECTS[action](player, body);

  if (action === "delete") {
    await env.DB.prepare("DELETE FROM content WHERE author_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM players WHERE id = ?").bind(id).run();
  } else {
    await env.DB.prepare(
      "UPDATE players SET status = ?, status_until = ?, verified = ?, strikes = ? WHERE id = ?",
    )
      .bind(after.status, after.status_until ?? null, after.verified, after.strikes, id)
      .run();
    if (action === "verify") {
      await env.DB.prepare("UPDATE players SET verification_requested = 0 WHERE id = ?").bind(id).run();
    }
  }

  const auditId = await writeAudit(env, {
    actorId: staff.id,
    actorRole: staff.role,
    action: `user.action.${action}`,
    targetType: "player",
    targetId: id,
    before,
    after,
    note,
  });

  const updated = await env.DB.prepare("SELECT * FROM players WHERE id = ?").bind(id).first();
  return json({
    player: updated ? mapPlayer(updated) : { ...mapPlayer(player), status: after.status },
    undoToken: `aud_${auditId}`,
  });
}

/* ----------------------------------------------------------------- staff */

function mapStaff(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
    assignedOpen: row.assigned === undefined ? undefined : Number(row.assigned),
  };
}

async function handleStaffList(_request, env) {
  const rows = await all(
    env,
    `SELECT s.*, (SELECT COUNT(*) FROM reports r WHERE r.assigned_to = s.id AND r.status IN ('claimed','escalated')) AS assigned
       FROM staff s ORDER BY
       CASE s.role WHEN 'superadmin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, s.name`,
  );
  return json({ items: (rows.results ?? []).map(mapStaff) });
}

async function handleStaffCreate(request, env, _url, body, staff) {
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = String(body?.role ?? "");
  const password = String(body?.password ?? "");
  if (!name || !email || !password) return fail(422, "validation", "Name, email and password are required");
  if (!ROLE_CAPABILITIES[role]) return fail(422, "validation", "Unknown role");
  if (password.length < 10) return fail(422, "validation", "Password must be at least 10 characters");

  const existing = await env.DB.prepare("SELECT id FROM staff WHERE email = ?").bind(email).first();
  if (existing) return fail(409, "conflict", "That email already belongs to a staff account");

  const id = `stf_${crypto.randomUUID().slice(0, 8)}`;
  const stamp = nowSeconds();
  await env.DB.prepare(
    "INSERT INTO staff (id, name, email, role, status, password_hash, created_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
  ).bind(id, name, email, role, await hashPassword(password), stamp).run();

  await writeAudit(env, {
    actorId: staff.id,
    actorRole: staff.role,
    action: "staff.create",
    targetType: "staff",
    targetId: id,
    before: null,
    after: { name, email, role, status: "active" },
    note: "",
  });

  const created = await env.DB.prepare("SELECT * FROM staff WHERE id = ?").bind(id).first();
  return json({ staff: mapStaff(created) }, { status: 201 });
}

async function activeSuperadminCount(env, exceptId = null) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM staff WHERE role = 'superadmin' AND status = 'active'${exceptId ? " AND id <> ?" : ""}`,
  );
  const result = exceptId ? await row.bind(exceptId).first() : await row.first();
  return Number(result?.n ?? 0);
}

async function handleStaffPatch(request, env, _url, body, staff, id) {
  const target = await env.DB.prepare("SELECT * FROM staff WHERE id = ?").bind(id).first();
  if (!target) return fail(404, "not_found", "No staff account with that id");

  const nextRole = body?.role !== undefined ? String(body.role) : target.role;
  const nextStatus = body?.status !== undefined ? String(body.status) : target.status;
  if (!ROLE_CAPABILITIES[nextRole]) return fail(422, "validation", "Unknown role");
  if (!["active", "suspended"].includes(nextStatus)) return fail(422, "validation", "Unknown status");

  const losingSuperadmin =
    target.role === "superadmin" && target.status === "active" && (nextRole !== "superadmin" || nextStatus !== "active");
  if (losingSuperadmin && (await activeSuperadminCount(env, id)) === 0) {
    return fail(422, "validation", "The last active superadmin cannot be demoted or suspended");
  }

  const before = { role: target.role, status: target.status };
  await env.DB.prepare("UPDATE staff SET role = ?, status = ? WHERE id = ?").bind(nextRole, nextStatus, id).run();
  if (nextStatus !== "active") {
    await env.DB.prepare("DELETE FROM sessions WHERE staff_id = ?").bind(id).run();
  }
  await writeAudit(env, {
    actorId: staff.id,
    actorRole: staff.role,
    action: "staff.update",
    targetType: "staff",
    targetId: id,
    before,
    after: { role: nextRole, status: nextStatus },
    note: "",
  });
  const updated = await env.DB.prepare("SELECT * FROM staff WHERE id = ?").bind(id).first();
  return json({ staff: mapStaff(updated) });
}

async function handleStaffDelete(request, env, _url, _body, staff, id) {
  const target = await env.DB.prepare("SELECT * FROM staff WHERE id = ?").bind(id).first();
  if (!target) return fail(404, "not_found", "No staff account with that id");
  if (id === staff.id) return fail(409, "conflict", "You cannot delete your own account");
  if (
    target.role === "superadmin" &&
    target.status === "active" &&
    (await activeSuperadminCount(env, id)) === 0
  ) {
    return fail(409, "conflict", "The last active superadmin cannot be deleted");
  }
  await env.DB.prepare("DELETE FROM sessions WHERE staff_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM staff WHERE id = ?").bind(id).run();
  await writeAudit(env, {
    actorId: staff.id,
    actorRole: staff.role,
    action: "staff.delete",
    targetType: "staff",
    targetId: id,
    before: { name: target.name, email: target.email, role: target.role },
    after: null,
    note: "",
  });
  return json({ ok: true });
}

/* ----------------------------------------------------------------- audit */

function mapAudit(row) {
  const parse = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };
  return {
    id: `aud_${row.id}`,
    actor: { id: row.actor_id, name: row.actor_name ?? null, role: row.actor_role },
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    before: parse(row.before),
    after: parse(row.after),
    note: row.note ?? "",
    undone: Boolean(row.undone),
    createdAt: row.created_at,
  };
}

async function writeAudit(env, { actorId, actorRole, action, targetType, targetId, before, after, note }) {
  const result = await env.DB.prepare(
    `INSERT INTO audit_log (actor_id, actor_role, action, target_type, target_id, before, after, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      note || null,
      nowSeconds(),
    )
    .run();
  return result.meta?.last_row_id ?? 0;
}

async function handleAuditList(request, env, url, _body, staff) {
  const scope = url.searchParams.get("scope") ?? (staff.role === "superadmin" ? "all" : "mine");
  if (scope === "all" && !can(staff.role, "*")) {
    return fail(403, "forbidden", "Only a superadmin can read every staff action");
  }
  const actor = url.searchParams.get("actor");
  const action = url.searchParams.get("action");
  const target = url.searchParams.get("target");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) ?? 50, 1), 200);

  const where = [];
  const binds = [];
  if (scope === "mine") {
    where.push("a.actor_id = ?");
    binds.push(staff.id);
  }
  if (actor) {
    where.push("a.actor_id = ?");
    binds.push(actor);
  }
  if (action) {
    where.push("a.action LIKE ?");
    binds.push(`${action}%`);
  }
  if (target) {
    where.push("a.target_id = ?");
    binds.push(target);
  }
  const rows = await all(
    env,
    `SELECT a.*, s.name AS actor_name FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
    ...binds,
    limit,
  );
  return json({ items: (rows.results ?? []).map(mapAudit), nextCursor: null });
}

async function handleAuditUndo(request, env, _url, _body, staff, rawId) {
  const id = Number(String(rawId).replace(/^aud_/, ""));
  if (!Number.isFinite(id)) return fail(422, "validation", "Malformed audit id");
  const row = await env.DB.prepare("SELECT * FROM audit_log WHERE id = ?").bind(id).first();
  if (!row) return fail(404, "not_found", "No audit event with that id");
  if (row.actor_id !== staff.id) return fail(403, "forbidden", "You can only undo your own actions");
  if (row.undone) return fail(409, "conflict", "That action has already been undone");
  if (nowSeconds() - row.created_at > UNDO_WINDOW_SECONDS) {
    return fail(409, "conflict", "The undo window has closed");
  }

  const before = row.before ? JSON.parse(row.before) : null;
  if (!before) return fail(409, "conflict", "That action cannot be undone");

  if (row.target_type === "report") {
    await env.DB.prepare("UPDATE reports SET status = ?, resolution = NULL, resolved_by = NULL, resolved_at = NULL, updated_at = ? WHERE id = ?")
      .bind(before.status, nowSeconds(), row.target_id)
      .run();
    if (before.state !== undefined && before.state !== null) {
      await env.DB.prepare(
        `UPDATE content SET state = ? WHERE id = (SELECT content_id FROM reports WHERE id = ?)`,
      ).bind(before.state, row.target_id).run();
    }
  } else if (row.target_type === "player") {
    await env.DB.prepare(
      "UPDATE players SET status = ?, status_until = ?, verified = ?, strikes = ? WHERE id = ?",
    )
      .bind(before.status, before.status_until ?? null, before.verified, before.strikes, row.target_id)
      .run();
  } else {
    return fail(409, "conflict", "That action cannot be undone");
  }

  await env.DB.prepare("UPDATE audit_log SET undone = 1 WHERE id = ?").bind(id).run();
  const updated = await env.DB.prepare("SELECT a.*, s.name AS actor_name FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id WHERE a.id = ?")
    .bind(id)
    .first();
  return json({ audit: mapAudit(updated) });
}

/* ---------------------------------------------------------------- routing */

const ROUTES = [
  ["POST", /^\/api\/v1\/auth\/login$/, null, (request, env, _url, body) => handleLogin(request, env, body)],
  ["POST", /^\/api\/v1\/auth\/logout$/, null, (request, env, url, body) => handleLogout(request, env, url, body)],
  ["GET", /^\/api\/v1\/auth\/me$/, "auth", handleMe],
  ["GET", /^\/api\/v1\/metrics\/overview$/, "metrics.read", handleMetrics],
  ["GET", /^\/api\/v1\/reports$/, "reports.read", (request, env, url, body) => handleReportList(request, env, url)],
  ["GET", /^\/api\/v1\/reports\/([^/]+)$/, "reports.read", handleReportGet],
  ["POST", /^\/api\/v1\/reports\/([^/]+)\/claim$/, "reports.decide", handleClaim],
  ["POST", /^\/api\/v1\/reports\/([^/]+)\/decision$/, "reports.decide", handleDecision],
  ["GET", /^\/api\/v1\/users$/, "users.read", (request, env, url, body) => handleUserList(request, env, url)],
  ["GET", /^\/api\/v1\/users\/([^/]+)$/, "users.read", handleUserGet],
  ["POST", /^\/api\/v1\/users\/([^/]+)\/actions$/, "users.action", handleUserAction],
  ["GET", /^\/api\/v1\/staff$/, "staff.read", (request, env) => handleStaffList(request, env)],
  ["POST", /^\/api\/v1\/staff$/, "staff.write", handleStaffCreate],
  ["PATCH", /^\/api\/v1\/staff\/([^/]+)$/, "staff.write", handleStaffPatch],
  ["DELETE", /^\/api\/v1\/staff\/([^/]+)$/, "staff.write", handleStaffDelete],
  ["GET", /^\/api\/v1\/audit$/, "audit.read", handleAuditList],
  ["POST", /^\/api\/v1\/audit\/([^/]+)\/undo$/, "reports.decide", handleAuditUndo],
];

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Origin must match, or the client must identify itself as same-origin script. */
function csrfRejected(request, url) {
  if (!MUTATING.has(request.method)) return false;
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return true;
  if (!origin && request.headers.get("x-requested-with") !== "XMLHttpRequest") return true;
  return false;
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  for (const [method, pattern, capability, handler] of ROUTES) {
    if (method !== request.method) continue;
    const match = path.match(pattern);
    if (!match) continue;

    // capability === null  → public (login, logout)
    // capability === "auth" → any signed-in staff member
    if (csrfRejected(request, url)) {
      return fail(403, "forbidden", "Cross-site request rejected");
    }
    const isPublic = capability === null;
    let staff = null;
    if (!isPublic) {
      staff = await staffFromRequest(request, env);
      if (!staff) return fail(401, "unauthorized", "Sign in to continue");
      if (capability !== "auth" && !can(staff.role, capability)) {
        return fail(403, "forbidden", `Your role (${staff.role}) cannot access this resource`);
      }
    }

    const body = MUTATING.has(request.method) ? await readBody(request) : null;
    if (MUTATING.has(request.method) && body === null) {
      return fail(422, "validation", "A JSON body is required");
    }
    request.staff = staff;
    const result = await handler(request, env, url, body, staff, ...(match.slice(1)));
    return result instanceof Response ? result : json(result);
  }

  if (path.startsWith(API_PREFIX)) return fail(404, "not_found", "No such endpoint");
  return null;
}

export default {
  async fetch(request, env) {
    const api = await handleApi(request, env).catch((error) => {
      console.error("admin api error", error);
      return fail(500, "internal", "Something went wrong handling that request");
    });
    if (api) return api;
    return env.ASSETS.fetch(request);
  },
};
