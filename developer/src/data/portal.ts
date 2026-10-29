export type AppRow = {
  id: string;
  name: string;
  description: string;
  environments: Array<"test" | "live">;
  requests: string;
  errors: string;
  tone: "purple" | "ink";
};

export const APPS: AppRow[] = [
  {
    id: "night-shift-ingest",
    name: "Night Shift Ingest",
    description: "Clip pipeline · nightshift.gg",
    environments: ["test", "live"],
    requests: "1,284",
    errors: "0.4%",
    tone: "purple",
  },
  {
    id: "static-kings-studio",
    name: "Static Kings Studio",
    description: "Clip pipeline · static kings",
    environments: ["test"],
    requests: "0",
    errors: "—",
    tone: "ink",
  },
];

/**
 * Demo key material for the mock console. A real secret is only ever shown once
 * by the API and never ships in a bundle, so these are generated here instead of
 * being written out as key-shaped literals.
 */
function demoKey(kind: "test" | "live", seed: number): string {
  const alphabet = "4f2a91c7d8e0b3a6f5c29c31ba7e6d10";
  let body = "";
  for (let index = 0; index < 24; index += 1) {
    body += alphabet[(seed * 7 + index * 5) % alphabet.length];
  }
  return `sk_${kind}_${body}`;
}

export type KeyRow = {
  id: string;
  label: string;
  secret: string;
  scopes: string[];
  lastUsed: string;
  expires: string;
  env: "test" | "live";
  hidden?: boolean;
};

export const KEYS: KeyRow[] = [
  {
    id: "key_capture",
    label: "Capture pipeline",
    secret: demoKey("test", 1),
    scopes: ["snags:write", "clips:write"],
    lastUsed: "12m ago",
    expires: "Never",
    env: "test",
  },
  {
    id: "key_ci",
    label: "CI · nightly",
    secret: demoKey("test", 2),
    scopes: ["snags:read", "clips:read"],
    lastUsed: "2h ago",
    expires: "In 30 days",
    env: "test",
  },
  {
    id: "key_local",
    label: "Local dev",
    secret: demoKey("test", 3),
    scopes: ["snags:read"],
    lastUsed: "Never",
    expires: "Never",
    env: "test",
  },
  {
    id: "key_live",
    label: "Production ingest",
    secret: demoKey("live", 4),
    scopes: ["snags:write", "clips:write", "webhooks:manage"],
    lastUsed: "4h ago",
    expires: "Never",
    env: "live",
    hidden: true,
  },
];

export const ALL_SCOPES = [
  "snags:read",
  "snags:write",
  "clips:read",
  "clips:write",
  "squads:read",
  "webhooks:manage",
] as const;

export type EndpointRow = {
  id: string;
  label: string;
  url: string;
  events: number;
  success: string;
  state: "active" | "failing";
  secret: string;
  consecutive: number;
};

export const ENDPOINTS: EndpointRow[] = [
  {
    id: "ep_prod",
    label: "prod-capture",
    url: "https://nightshift.gg/hooks/snagchat",
    events: 8,
    success: "98.7%",
    state: "active",
    secret: "whsec_7d1c4f9a2b6e",
    consecutive: 0,
  },
  {
    id: "ep_staging",
    label: "staging",
    url: "https://staging.nightshift.gg/hooks",
    events: 3,
    success: "61.2%",
    state: "failing",
    secret: "whsec_2a8e0c5b1d73",
    consecutive: 6,
  },
];

export type Delivery = {
  id: string;
  at: string;
  event: string;
  endpoint: string;
  status: number;
  duration: string;
  attempts: number;
  manual?: boolean;
};

export const DELIVERIES: Delivery[] = [
  { id: "dlv_44a1c9", at: "14:02:11", event: "snag.created", endpoint: "prod-capture", status: 200, duration: "412ms", attempts: 1 },
  { id: "dlv_44a1b2", at: "14:01:58", event: "snag.created", endpoint: "prod-capture", status: 502, duration: "1.8s", attempts: 3 },
  { id: "dlv_44a0f7", at: "13:59:02", event: "snag.gated", endpoint: "staging", status: 200, duration: "388ms", attempts: 1 },
  { id: "dlv_449f31", at: "13:55:20", event: "snag.engaged", endpoint: "prod-capture", status: 200, duration: "96ms", attempts: 1 },
  { id: "dlv_449e08", at: "13:54:03", event: "snag.gated", endpoint: "staging", status: 500, duration: "2.4s", attempts: 4 },
  { id: "dlv_449c44", at: "13:51:37", event: "snag.created", endpoint: "prod-capture", status: 200, duration: "388ms", attempts: 1 },
  { id: "dlv_449b19", at: "13:48:12", event: "snag.created", endpoint: "staging", status: 200, duration: "401ms", attempts: 1 },
  { id: "dlv_449a02", at: "13:44:51", event: "squad.joined", endpoint: "prod-capture", status: 200, duration: "377ms", attempts: 1 },
];

export const WEBHOOK_PAYLOAD = `{
  "id": "evt_9c2f1a",
  "type": "snag.created",
  "created": 1798408931,
  "data": {
    "snag": {
      "id": "sng_8f21c",
      "title": "Solo wipe at 2am",
      "game": "Rust",
      "creator": "masonr",
      "gate": "allowed",
      "poster": "https://cdn.snagchat.io/p/sng_8f21c.webp"
    }
  }
}`;

export const WEBHOOK_HEADERS = `POST /hooks/snagchat HTTP/1.1
Host: nightshift.gg
SnagChat-Signature: t=1798408931,v1=8f2c0a91d7e4b356
SnagChat-Event: snag.created
SnagChat-Delivery: dlv_44a1c9
Content-Type: application/json
User-Agent: SnagChat-Webhooks/1.0`;

export const WEBHOOK_RESPONSE = `HTTP/1.1 200 OK
Content-Type: application/json
X-Request-Id: req_7f31c8a2

{ "ok": true }`;

export type LogRow = {
  at: string;
  method: string;
  route: string;
  status: number;
  ms: string;
  requestId: string;
};

export const LOGS: LogRow[] = [
  { at: "14:02:11", method: "POST", route: "/v1/snags", status: 201, ms: "128ms", requestId: "req_7f31c8a2" },
  { at: "14:01:58", method: "POST", route: "/v1/clips", status: 201, ms: "892ms", requestId: "req_7f31b104" },
  { at: "13:59:44", method: "GET", route: "/v1/snags/sng_8f21c", status: 200, ms: "41ms", requestId: "req_7f319d77" },
  { at: "13:57:02", method: "POST", route: "/v1/snags", status: 422, ms: "63ms", requestId: "req_7f3102ae" },
  { at: "13:54:31", method: "POST", route: "/v1/snags", status: 429, ms: "4ms", requestId: "req_7f30c119" },
  { at: "13:51:20", method: "GET", route: "/v1/squads", status: 200, ms: "88ms", requestId: "req_7f2f8b31" },
  { at: "13:48:09", method: "DELETE", route: "/v1/snags/sng_8e0bb", status: 204, ms: "72ms", requestId: "req_7f2ef002" },
  { at: "13:44:51", method: "POST", route: "/v1/clips", status: 413, ms: "19ms", requestId: "req_7f2e1a86" },
];

export const RECENT_ERRORS = [
  {
    code: "422 clips.duration_too_long",
    message: "Clip is 1:14 — the cap is 60s.",
    snag: "sng_8f21c",
    at: "2m ago",
  },
  {
    code: "403 scope_missing",
    message: "This key is missing snags:write.",
    snag: "sk_test_••••3f",
    at: "18m ago",
  },
  {
    code: "429 rate_limited",
    message: "120 requests/min on the test tier.",
    snag: "req_7f30c119",
    at: "1h ago",
  },
];

export type Endpoint = {
  slug: string;
  group: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  summary: string;
  description: string;
  scopes: string;
  rate: string;
  params: Array<{ name: string; type: string; required?: boolean; note: string }>;
  request: { curl: string; typescript: string; python: string };
  response: string;
  responseNote: string;
  errors: Array<{ status: string; code: string; note: string }>;
  notices: string[];
};

export const ENDPOINT_GROUPS = ["Snags", "Clips", "Squads", "Webhooks"];

export const ENDPOINTS_API: Endpoint[] = [
  {
    slug: "create-snag",
    group: "Snags",
    method: "POST",
    path: "/v1/snags",
    summary: "Create a snag",
    description:
      "Publishes a clip or still into the feed, a squad gallery, or both. The post enters the visibility gate before it is ranked, so read gate in the response before assuming distribution.",
    scopes: "snags:write",
    rate: "120 / min · test tier",
    params: [
      {
        name: "clip_url",
        type: "string",
        required: true,
        note: "A public MP4 URL, or the id returned by POST /v1/clips. 60s, 1080p, 50 MB.",
      },
      { name: "title", type: "string", required: true, note: "3–80 characters. Shows on the card and the snag view." },
      {
        name: "game",
        type: "string",
        required: true,
        note: "A catalogued title. Aliases resolve too — query GET /v1/games to check.",
      },
      {
        name: "category",
        type: "enum",
        required: true,
        note: "clips · loadouts · skins · builds · squad",
      },
      {
        name: "tags",
        type: "string[]",
        note: "Up to four. Hashtags and mentions share the same budget.",
      },
      { name: "squad_id", type: "string", note: "Post into a squad gallery instead of the feed." },
      { name: "visibility", type: "enum", note: "public (default) or squad." },
    ],
    request: {
      curl: `curl -X POST https://api.snagchat.io/v1/snags \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -H "Idempotency-Key: 4f2a-9c31" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clip_url": "https://cdn.nightshift.gg/run.mp4",
    "title": "Solo wipe at 2am",
    "game": "Rust",
    "category": "clips",
    "tags": ["#rust"]
  }'`,
      typescript: `import { SnagChat } from "@snagchat/sdk";

const snagchat = new SnagChat(process.env.SNAGCHAT_KEY);

const snag = await snagchat.snags.create({
  clipUrl: "https://cdn.nightshift.gg/run.mp4",
  title: "Solo wipe at 2am",
  game: "Rust",
  category: "clips",
  tags: ["#rust"],
});`,
      python: `from snagchat import SnagChat

client = SnagChat(os.environ["SNAGCHAT_KEY"])

snag = client.snags.create(
    clip_url="https://cdn.nightshift.gg/run.mp4",
    title="Solo wipe at 2am",
    game="Rust",
    category="clips",
    tags=["#rust"],
)`,
    },
    response: `{
  "id": "sng_8f21c",
  "created": "2026-10-28T14:02:11Z",
  "title": "Solo wipe at 2am",
  "game": { "id": "game_rust", "name": "Rust" },
  "creator": "masonr",
  "gate": "allowed",
  "poster": "https://cdn.snagchat.io/p/sng_8f21c.webp",
  "url": "https://snagchat.io/?snag=sng_8f21c"
}`,
    responseNote: "201 Created. Every response carries a SnagChat-Request-Id header.",
    errors: [
      { status: "401", code: "key_invalid", note: "The key was revoked or belongs to the other environment." },
      { status: "403", code: "scope_missing", note: "The key does not carry snags:write." },
      { status: "422", code: "clips.duration_too_long", note: "Uploads over 60s are trimmed; URLs over 60s are refused." },
      { status: "422", code: "tags.limit_exceeded", note: "More than four hashtags and mentions combined." },
      { status: "429", code: "rate_limited", note: "Retry after the seconds in Retry-After." },
    ],
    notices: [
      "Clips are re-encoded server-side before publishing. The poster frame is taken at 0.5s.",
      "A post can be gated (held for review) even when a studio is verified. The gate is returned, not hidden.",
    ],
  },
  {
    slug: "get-snag",
    group: "Snags",
    method: "GET",
    path: "/v1/snags/:id",
    summary: "Retrieve a snag",
    description:
      "Returns one snag with its gate state, engagement counters and the poster frame. Private squad posts are only readable with a token that belongs to a member.",
    scopes: "snags:read",
    rate: "600 / min · test tier",
    params: [{ name: "id", type: "string", required: true, note: "The snag id, for example sng_8f21c." }],
    request: {
      curl: `curl https://api.snagchat.io/v1/snags/sng_8f21c \\
  -H "Authorization: Bearer $SNAGCHAT_KEY"`,
      typescript: `const snag = await snagchat.snags.retrieve("sng_8f21c");`,
      python: `snag = client.snags.retrieve("sng_8f21c")`,
    },
    response: `{
  "id": "sng_8f21c",
  "title": "Solo wipe at 2am",
  "game": { "id": "game_rust", "name": "Rust" },
  "creator": "masonr",
  "gate": "allowed",
  "stats": { "likes": 412, "comments": 38, "saves": 91 },
  "poster": "https://cdn.snagchat.io/p/sng_8f21c.webp"
}`,
    responseNote: "200 OK. Counters are near-real-time, batched every 30 seconds.",
    errors: [
      { status: "403", code: "snag_private", note: "The post belongs to a private squad the key cannot read." },
      { status: "404", code: "snag_not_found", note: "No post with that id, or it was deleted." },
    ],
    notices: ["Use the gate field to tell allowed, interstitial and dropped apart."],
  },
  {
    slug: "delete-snag",
    group: "Snags",
    method: "DELETE",
    path: "/v1/snags/:id",
    summary: "Delete a snag",
    description:
      "Removes a post the app created. Sponsored posts and posts already in review cannot be deleted until the review closes.",
    scopes: "snags:write",
    rate: "60 / min · test tier",
    params: [{ name: "id", type: "string", required: true, note: "The snag id to remove." }],
    request: {
      curl: `curl -X DELETE https://api.snagchat.io/v1/snags/sng_8f21c \\
  -H "Authorization: Bearer $SNAGCHAT_KEY"`,
      typescript: `await snagchat.snags.delete("sng_8f21c");`,
      python: `client.snags.delete("sng_8f21c")`,
    },
    response: `// 204 No Content`,
    responseNote: "204 with an empty body. Deletion is immediate for the feed.",
    errors: [
      { status: "404", code: "snag_not_found", note: "Already deleted, or never existed." },
      { status: "409", code: "snag_locked", note: "The post is in a moderation review and cannot be removed yet." },
    ],
    notices: ["Deleting a post does not refund the clip's storage for 24 hours."],
  },
  {
    slug: "upload-clip",
    group: "Clips",
    method: "POST",
    path: "/v1/clips",
    summary: "Upload a clip",
    description:
      "Uploads an MP4 as multipart form data and returns an id you can pass as clip_url. The server enforces the same policy the app shows in the composer.",
    scopes: "clips:write",
    rate: "30 / min · test tier",
    params: [
      { name: "file", type: "binary", required: true, note: "MP4 (H.264 + AAC). 60s, 1080p max, 50 MB." },
      { name: "poster_at", type: "number", note: "Seconds to grab the poster from. Defaults to 0.5." },
    ],
    request: {
      curl: `curl -X POST https://api.snagchat.io/v1/clips \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -F "file=@run.mp4" \\
  -F "poster_at=0.5"`,
      typescript: `const clip = await snagchat.clips.upload({
  file: createReadStream("run.mp4"),
  posterAt: 0.5,
});`,
      python: `clip = client.clips.upload(
    file=open("run.mp4", "rb"),
    poster_at=0.5,
)`,
    },
    response: `{
  "id": "clip_41a7",
  "url": "https://cdn.snagchat.io/c/clip_41a7.mp4",
  "poster": "https://cdn.snagchat.io/c/clip_41a7.webp",
  "duration": 41.2,
  "height": 1080
}`,
    responseNote: "201 Created. Reuse the id across posts; storage is deduplicated per org.",
    errors: [
      { status: "413", code: "clip_too_large", note: "Over 50 MB after encode." },
      { status: "415", code: "unsupported_media", note: "Not an MP4, or no readable moov box." },
      { status: "422", code: "clip_too_long", note: "Longer than 60 seconds." },
    ],
    notices: [
      "Clips are rebuilt from decoded frames — embedded metadata does not survive.",
      "A poster is always generated, so a post still renders if the clip fails to load.",
    ],
  },
  {
    slug: "list-squads",
    group: "Squads",
    method: "GET",
    path: "/v1/squads",
    summary: "List squads",
    description:
      "Lists the squads the key's owner belongs to, public and private, with member counts and gallery visibility. Use the id to post into a gallery.",
    scopes: "squads:read",
    rate: "300 / min · test tier",
    params: [
      { name: "limit", type: "number", note: "1–100. Defaults to 20." },
      { name: "cursor", type: "string", note: "The next_cursor from the previous page." },
    ],
    request: {
      curl: `curl "https://api.snagchat.io/v1/squads?limit=20" \\
  -H "Authorization: Bearer $SNAGCHAT_KEY"`,
      typescript: `const squads = await snagchat.squads.list({ limit: 20 });`,
      python: `squads = client.squads.list(limit=20)`,
    },
    response: `{
  "data": [
    {
      "id": "sqd_nightshift",
      "name": "Night Shift",
      "visibility": "private",
      "members": 14,
      "role": "owner"
    }
  ],
  "next_cursor": null
}`,
    responseNote: "200 OK. Private galleries are listed for members only.",
    errors: [{ status: "401", code: "key_invalid", note: "The key is missing or revoked." }],
    notices: ["Squad gallery posts are excluded from the public feed by the ranking gate."],
  },
  {
    slug: "replay-delivery",
    group: "Webhooks",
    method: "POST",
    path: "/v1/webhooks/deliveries/:id/replay",
    summary: "Replay a delivery",
    description:
      "Queues a fresh attempt of an existing delivery with the original payload and a new signature. Replays are idempotent per delivery id for 10 minutes.",
    scopes: "webhooks:manage",
    rate: "60 / min · test tier",
    params: [{ name: "id", type: "string", required: true, note: "The delivery id, for example dlv_44a1c9." }],
    request: {
      curl: `curl -X POST \\
  https://api.snagchat.io/v1/webhooks/deliveries/dlv_44a1c9/replay \\
  -H "Authorization: Bearer $SNAGCHAT_KEY"`,
      typescript: `await snagchat.webhooks.replay("dlv_44a1c9");`,
      python: `client.webhooks.replay("dlv_44a1c9")`,
    },
    response: `{
  "delivery_id": "dlv_44a1c9",
  "replay_of": "dlv_44a1c9",
  "queued": "2026-10-28T14:04:02Z"
}`,
    responseNote: "202 Accepted. The original delivery keeps its own status.",
    errors: [
      { status: "404", code: "delivery_not_found", note: "The delivery is older than 7 days." },
      { status: "409", code: "delivery_in_flight", note: "Wait for the current attempt to finish." },
    ],
    notices: ["Signature timestamps are regenerated; verify them the same way as a live event."],
  },
];

export const QUICKSTART_CURL = `curl -X POST https://api.snagchat.io/v1/snags \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clip_url": "https://cdn.nightshift.gg/run.mp4",
    "title": "Solo wipe at 2am",
    "game": "Rust",
    "category": "clips"
  }'`;

export const LANDING_REQUEST = `POST /v1/snags                        201 Created
Authorization: Bearer sk_test_••••3f
Content-Type: application/json

{
  "clip_url": "https://cdn.nightshift.gg/run.mp4",
  "title": "Solo wipe at 2am",
  "game": "Rust",
  "category": "clips",
  "tags": ["#rust", "@masonr"]
}`;

export const LANDING_RESPONSE = `{ "id": "sng_8f21c", "gate": "allowed" }`;

export const LIMITS: Array<{ label: string; value: string }> = [
  { label: "Clip length", value: "60s hard cap" },
  { label: "Clip quality", value: "1080p max · 720p recommended" },
  { label: "Upload size", value: "50 MB per clip" },
  { label: "Catalogue", value: "13 titles · aliases resolve" },
  { label: "Webhook retries", value: "6 attempts, then replay" },
  { label: "Rate limit", value: "120/min test · tiered live" },
  { label: "Regions", value: "US · EU · AU · SEA" },
  { label: "Log retention", value: "7 days · webhooks replayable" },
];
