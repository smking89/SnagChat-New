# SnagChat Admin API

Contract for the staff API served by the Cloudflare Worker in `deploy/worker.js`.
Everything lives under `/api/v1`, is JSON, and is same-origin only. The consumer
app is untouched: the worker answers `/api/*` and hands every other path to
`env.ASSETS.fetch(request)`.

Local development: `npm run dev:api` starts Wrangler on `http://127.0.0.1:8787`
with a local D1 database (binding `DB`, schema `deploy/schema.sql`, data
`deploy/seed.sql`). The Vite dev server proxies `/api` there.

## Conventions

| | |
|---|---|
| Base | `/api/v1` |
| Success | `200` with the resource JSON, `201` on create |
| Error | `{ "error": { "code": string, "message": string } }` |
| Auth | `HttpOnly; SameSite=Strict` cookie `snagchat_staff` holding an opaque token; the sessions table stores its SHA-256 |
| CSRF | Every non-GET must send an `Origin` header matching the request origin, or `X-Requested-With: XMLHttpRequest` |
| Idempotency | `POST /auth/logout` and decisions already applied return `200`, never `500` |

Error codes: `unauthorized` (401), `forbidden` (403), `not_found` (404),
`validation` (422), `conflict` (409), `rate_limited` (429), `internal` (500).

## Roles

`superadmin` > `admin` > `moderator`. Capabilities, not URL prefixes, decide
access — the worker checks `caps.includes(...)` per route:

| Capability | moderator | admin | superadmin |
|---|---|---|---|
| `metrics.read` | queue scope | ops scope | platform scope |
| `reports.read` / `reports.decide` | yes (own queue) | yes | yes |
| `reports.restore` | — | yes | yes |
| `users.read` | yes | yes | yes |
| `users.action` | warn, timeout | + suspend, verify | + ban, delete |
| `escalations.read` | — | yes | yes |
| `staff.read` / `staff.write` | — | — | yes |
| `audit.read` | own actions | own actions | all |

A route listing several capabilities requires **any** of them unless noted.
Superadmin additionally matches the wildcard `*`.

## Authentication

```http
POST /api/v1/auth/login          { "email": "...", "password": "..." }
200 { "staff": { "id", "name", "email", "role" } }      + Set-Cookie
401 unauthorized                                       (unknown email OR bad password)

GET  /api/v1/auth/me
200 { "staff": { "id", "name", "email", "role", "lastLoginAt" } }
401 unauthorized

POST /api/v1/auth/logout
200 { "ok": true }                                     + cleared cookie
```

Passwords are PBKDF2-SHA256 (120k iterations, per-staff random salt) via
WebCrypto. Login answers identically for unknown email and wrong password, and
suspends sessions for `status = "suspended"` staff.

## Metrics

```http
GET /api/v1/metrics/overview
200 {
  "role": "superadmin" | "admin" | "moderator",
  "scope": "platform" | "ops" | "queue",
  "generatedAt": 1730000000,
  "kpi": [
    { "id": "dau", "label": "Daily active players", "value": 41234,
      "delta": 0.042, "spark": [ ...14 values... ] }
  ],
  "attention": [
    { "kind": "report" | "verification" | "campaign" | "creator" | "payout",
      "label": "Reports past SLA", "count": 3, "href": "#reports" }
  ],
  "series": {
    "activity":  [ { "label": "Oct 1", "value": 3120 } x30 ],
    "byCategory":[ { "label": "Clips", "value": 812 } x5 ],
    "byReason":  [ { "label": "Spam or a scam", "value": 12 } ],
    "byRegion":  [ { "label": "US East", "value": 14220 } x4 ]
  },
  "queues": { "open": 12, "claimed": 3, "escalated": 2, "slaBreached": 1 },
  "revenue": { ...superadmin only... },
  "staff":   [ ...superadmin only, staff roster summary... ]
}
```

The shape is stable across roles; blocks a role may not see are **omitted**, so
the client renders what exists rather than hiding it. Moderator KPIs describe
their own queue; admin KPIs describe content, creators and campaigns;
superadmin KPIs describe the platform including revenue.

## Reports

```http
GET /api/v1/reports?status=open|claimed|escalated|resolved|all
                    &reason=<reason>&queue=mine|team
                    &limit=25&cursor=<id>
200 { "items": [ Report ], "nextCursor": "rep_..." | null, "total": 41 }

Report: {
  "id", "mode": "post" | "ad", "reason", "detail", "status",
  "severity": "low" | "medium" | "high" | "critical",
  "createdAt", "updatedAt", "slaDueAt", "slaBreached": bool,
  "assignedTo": { "id", "name" } | null,
  "reporter": { "id", "handle" } | null,
  "reporterCount": 1,
  "content": {
    "id", "title", "game", "category", "mediaKind": "image" | "clip",
    "coverUrl", "state": "allow" | "interstitial" | "drop",
    "author": { "id", "handle", "name", "verified", "status", "strikes" },
    "stats": { "likes", "comments", "saves", "shares" }
  }
}

GET /api/v1/reports/:id        → { "report": Report, "history": [AuditEvent] }
POST /api/v1/reports/:id/claim { "claim": true | false }
200 { "report": Report }        409 conflict when another moderator holds it

POST /api/v1/reports/:id/decision
    { "decision": "allow" | "label" | "remove" | "dismiss" | "escalate"
                   | "restore",
      "note": "optional, required for escalate and restore" }
200 { "report": Report, "undoToken": "aud_..." }
403 forbidden when the role lacks the capability (e.g. `restore` for moderator)
422 validation when `note` is missing on escalate/restore
```

Every decision writes an `audit_log` row and returns its id as `undoToken`;
`POST /api/v1/audit/:id/undo` (capability `reports.decide`, actor must own it,
within 5s of creation) reverses the report's state and marks the row undone.

## Players

```http
GET  /api/v1/users?query=<handle|name>&status=active|timed_out|suspended|banned
200 { "items": [ Player ], "nextCursor": null, "total": 8 }

Player: { "id", "handle", "name", "avatarUrl", "verified", "private",
          "region", "platform", "status", "strikes",
          "posts", "followers", "joinedAt", "lastSeenAt" }

GET  /api/v1/users/:id
200 { "player": Player, "recentPosts": [ ... ], "reportsAgainst": n,
      "reportsBy": n }

POST /api/v1/users/:id/actions
    { "action": "warn" | "timeout" | "suspend" | "verify" | "ban" | "delete",
      "durationHours": 24,          // required for timeout and suspend
      "reason": "required" }
200 { "player": Player, "undoToken": "aud_..." }
403 forbidden for actions outside the role's capability row above
422 validation when reason (or durationHours) is missing
```

## Staff (superadmin only)

```http
GET   /api/v1/staff
200 { "items": [ { "id", "name", "email", "role", "status",
                   "createdAt", "lastLoginAt" } ] }

POST  /api/v1/staff   { "name", "email", "role", "password" }
201 { "staff": Staff }            409 conflict on a duplicate email
                                    or a second active superadmin demoting the last one

PATCH /api/v1/staff/:id  { "role"?, "status"? }
200 { "staff": Staff }            422 when the last active superadmin is changed

DELETE /api/v1/staff/:id
200 { "ok": true }                409 when it is the last active superadmin
```

## Audit

```http
GET /api/v1/audit?actor=<staffId>&action=<action>&target=<id>&scope=mine|all
                  &limit=50&cursor=<id>
200 { "items": [ AuditEvent ], "nextCursor": null }

AuditEvent: { "id", "actor": { "id", "name", "role" }, "action", "targetType",
              "targetId", "before", "after", "note", "undone": bool,
              "createdAt" }
```

`scope` defaults to `mine` for moderators and admins and to `all` for
superadmins; a non-superadmin asking for `all` gets `403 forbidden`.

## Out of scope (deliberate, for now)

- Rate limiting and lockout policy (needs an edge KV or D1 counter — noted, not built)
- Moderator→admin escalation routing between two humans (escalate only changes state)
- Stripe, ad-server and campaign delivery data (seeded stubs live in `metrics`)
