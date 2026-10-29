export type DocTable = { head: string[]; rows: string[][] };

export type DocSection = {
  h: string;
  p?: string;
  list?: string[];
  code?: string;
  filename?: string;
  table?: DocTable;
};

export type DocPage = {
  title: string;
  eyebrow: string;
  intro: string;
  updated: string;
  sections: DocSection[];
};

export const DOCS: Record<string, DocPage> = {
  quickstart: {
    title: "Quickstart",
    eyebrow: "Start",
    intro:
      "Create an app, copy a test key, post a snag. The whole loop is four requests and takes under five minutes on a sandbox key.",
    updated: "27 October 2026",
    sections: [
      {
        h: "1. Create an application",
        p: "Open the console, choose New application, and name it after the thing that produces the clips. Every app gets a test environment immediately and a live one after review.",
        list: [
          "Test keys are prefixed sk_test_ and only ever see sandbox data.",
          "Live keys need a fresh re-authentication before they are revealed.",
          "An app can hold several keys, so a CI job and a capture box never share a secret.",
        ],
      },
      {
        h: "2. Copy the test key",
        p: "The secret is shown once, at creation. Store it in an environment variable — never in a repository, a client bundle or a screenshot.",
        code: "export SNAGCHAT_KEY=sk_test_...",
        filename: "terminal",
      },
      {
        h: "3. Upload a clip",
        p: "Clips are capped at 60 seconds, 50 MB and 1080p. The poster frame is taken at 0.5s unless you pass one.",
        code: `curl -X POST https://api.snagchat.io/v1/clips \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -F "file=@run.mp4" \\
  -F "game=rust"`,
        filename: "terminal",
      },
      {
        h: "4. Post the snag",
        p: "One request publishes the post. The response carries the snag id, its gate state and the ranking trace you can inspect later.",
        code: `curl -X POST https://api.snagchat.io/v1/snags \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clip_url": "https://cdn.nightshift.gg/run.mp4",
    "title": "Solo wipe at 2am",
    "game": "rust",
    "category": "clips",
    "tags": ["#rust", "@masonr"]
  }'`,
        filename: "terminal",
      },
      {
        h: "5. Listen for the event",
        p: "Add an endpoint in Webhooks, send a test event, then replay a failed delivery to prove the handler is idempotent. Deliveries are signed with whsec_ secrets and retried with backoff.",
      },
      {
        h: "What to do next",
        list: [
          "Read Authentication before you ship a live key.",
          "Read Rate limits so your pipeline backs off instead of retrying in a loop.",
          "Read Guidelines: the gate runs before ranking, and it is not negotiable.",
        ],
      },
    ],
  },

  authentication: {
    title: "Authentication",
    eyebrow: "Start",
    intro:
      "Two ways in: a secret key for servers you own, and player OAuth for anything that acts on behalf of a player.",
    updated: "27 October 2026",
    sections: [
      {
        h: "Secret keys",
        p: "Send the key as a bearer token. Keys are scoped, so a read-only ingest key cannot post, and an app key cannot manage another app's webhooks.",
        code: `curl https://api.snagchat.io/v1/snags/sng_8f21c \\
  -H "Authorization: Bearer $SNAGCHAT_KEY"`,
        filename: "terminal",
      },
      {
        h: "Scopes",
        table: {
          head: ["Scope", "Allows", "Typical holder"],
          rows: [
            ["snags:read", "Read public and squad snags", "Overlays, dashboards"],
            ["snags:write", "Publish and delete your own posts", "Capture pipeline"],
            ["clips:read", "Read clip metadata and poster frames", "Editor integrations"],
            ["clips:write", "Upload and re-encode clips", "Capture pipeline"],
            ["squads:read", "List squads you belong to", "Bots, tournament tools"],
            ["webhooks:manage", "Create endpoints and replay deliveries", "Platform team"],
          ],
        },
      },
      {
        h: "Player OAuth",
        p: "For anything that acts as a player, use the authorization-code flow. The player sees a consent screen with your app name and the exact scopes you asked for. Ask for less than you use, not more.",
        list: [
          "Register the client and its redirect URI in the console first.",
          "Exchange the code server-side; the client secret never reaches the browser.",
          "Tokens are scoped per player: a squad gallery is only readable if that player is in the squad.",
        ],
      },
      {
        h: "Keep live keys out of reach",
        p: "Live keys require re-authentication before they can be revealed or rotated. A pasted snippet can therefore never ship to production by accident, and a compromised laptop does not hand over production traffic.",
      },
      {
        h: "Rotating a key",
        p: "Rotate with a 24-hour overlap: create the replacement, deploy it, then revoke the old one. The console shows the overlap window until the old key is revoked.",
      },
    ],
  },

  errors: {
    title: "Errors",
    eyebrow: "Start",
    intro:
      "One error shape everywhere, with a request id you can quote in a support ticket. Nothing is reported as a 200 with an error inside.",
    updated: "27 October 2026",
    sections: [
      {
        h: "Shape",
        code: `{
  "error": {
    "code": "clips.duration_too_long",
    "message": "Clip is 1:14 - the cap is 60s.",
    "status": 422,
    "request_id": "req_7f31c8a2"
  }
}`,
        filename: "422 response",
      },
      {
        h: "Catalogue",
        table: {
          head: ["Status", "Code", "Meaning", "Retry"],
          rows: [
            ["400", "request.malformed", "Body is not valid JSON or a required field is missing.", "No"],
            ["401", "auth.invalid_key", "Key is revoked, malformed or for the wrong environment.", "No"],
            ["403", "scope_missing", "The key lacks the scope this route needs.", "No"],
            ["403", "snag.gated", "A moderator held the post; it cannot be embedded.", "No"],
            ["404", "snag.not_found", "Id does not exist, or is not visible to this key.", "No"],
            ["413", "clips.too_large", "Clip is over 50 MB.", "No"],
            ["422", "clips.duration_too_long", "Clip is over 60 seconds.", "No"],
            ["429", "rate_limited", "Tier limit hit. Honour Retry-After.", "Yes"],
            ["500", "internal", "Our fault. Safe to retry with backoff.", "Yes"],
            ["502", "upstream_timeout", "A dependency timed out.", "Yes"],
          ],
        },
      },
      {
        h: "Retrying",
        p: "Retry only 429 and 5xx. Use exponential backoff with jitter, cap at five attempts, and make the request idempotent with an Idempotency-Key header when you create a snag.",
        code: `await fetch(url, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.SNAGCHAT_KEY}\`,
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify(payload),
});`,
        filename: "retry-safe create",
      },
      {
        h: "Request ids",
        p: "Every response carries X-Request-Id, and the same id appears in your request log. Include it when you contact support; we can find the exact call without asking you to reproduce it.",
      },
    ],
  },

  "guides/ingest-a-clip": {
    title: "Ingest a clip",
    eyebrow: "Guide",
    intro:
      "Take a finished capture, upload it, poll until the poster frame exists, then post it. This is the path a capture pipeline should follow.",
    updated: "27 October 2026",
    sections: [
      {
        h: "1. Upload",
        p: "Send the file as multipart. Encoding starts immediately; the response returns a clip id and a state of processing.",
        code: `curl -X POST https://api.snagchat.io/v1/clips \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -F "file=@run.mp4" -F "game=rust"`,
        filename: "terminal",
      },
      {
        h: "2. Wait for the poster",
        p: "Poll GET /v1/clips/:id until state is ready. Do not busy-loop: three seconds apart, ten attempts, then treat it as a failure and keep the clip id.",
      },
      {
        h: "3. Post",
        p: "Use the returned clip_url. The snag inherits the clip's duration and game unless you override them.",
      },
      {
        h: "Limits",
        table: {
          head: ["Limit", "Value"],
          rows: [
            ["Duration", "60 seconds"],
            ["File size", "50 MB"],
            ["Resolution", "1080p maximum, 720p recommended"],
            ["Formats", "MP4 (H.264), WebM"],
            ["Poster frame", "0.5s default"],
          ],
        },
      },
      {
        h: "If it fails",
        list: [
          "422 clips.duration_too_long — trim before upload; we do not transcode longer clips.",
          "413 clips.too_large — compress to under 50 MB, 8 Mbps is plenty for 1080p60.",
          "500 — retry with the same Idempotency-Key; you will not create a duplicate post.",
        ],
      },
    ],
  },

  "guides/post-to-a-squad": {
    title: "Post to a squad",
    eyebrow: "Guide",
    intro:
      "Squad posts skip the public feed. They are visible to members only, and the squad owner can remove them without a support ticket.",
    updated: "27 October 2026",
    sections: [
      {
        h: "The request",
        code: `curl -X POST https://api.snagchat.io/v1/snags \\
  -H "Authorization: Bearer $SNAGCHAT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clip_url": "https://cdn.nightshift.gg/run.mp4",
    "title": "Bracket final, game 3",
    "game": "cs2",
    "category": "clips",
    "visibility": "squad",
    "squad_id": "sqd_2f91"
  }'`,
        filename: "terminal",
      },
      {
        h: "Who can see it",
        list: [
          "squad — members of that squad only. The default for tournament tools.",
          "public — the For You feed, subject to the gate.",
          "Keys can only post to squads the app has been granted; there is no way to guess a squad id.",
        ],
      },
      {
        h: "Moderation still applies",
        p: "The gate runs on squad posts too. A held post returns gate: review, and the squad sees a placeholder rather than the media. Owners can remove a post; the deletion is recorded in the audit log.",
      },
    ],
  },

  "guides/receive-webhooks": {
    title: "Receive webhooks",
    eyebrow: "Guide",
    intro:
      "A signed POST, retried with backoff, replayable from the console. Verify the signature before you parse the body.",
    updated: "27 October 2026",
    sections: [
      {
        h: "Verify the signature",
        p: "Compute an HMAC-SHA256 over the timestamp and raw body, then compare in constant time. Reject anything older than five minutes.",
        code: `import { createHmac, timingSafeEqual } from "node:crypto";

const [tsPart, sigPart] = header.split(",");
const timestamp = tsPart.split("=")[1];
const signature = sigPart.split("=")[1];

const expected = createHmac("sha256", process.env.WHSEC)
  .update(\`\${timestamp}.\${rawBody}\`)
  .digest("hex");

const ok = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));`,
        filename: "verify.ts",
      },
      {
        h: "Handle it once",
        p: "Deliveries can repeat — a retry after a timeout looks identical to the first attempt. Store the SnagChat-Delivery header and skip anything you have already processed.",
      },
      {
        h: "Retries and auto-disable",
        table: {
          head: ["Attempt", "Delay"],
          rows: [
            ["1", "immediate"],
            ["2", "30 seconds"],
            ["3", "5 minutes"],
            ["4", "30 minutes"],
            ["5", "2 hours"],
          ],
        },
      },
      {
        h: "When an endpoint is down",
        p: "After 20 consecutive failures the endpoint is auto-disabled and the owner is emailed. Deliveries stop but stay replayable for the retention window, so a fix does not lose the events.",
      },
    ],
  },

  "guides/rotate-a-key": {
    title: "Rotate a key",
    eyebrow: "Guide",
    intro:
      "Rotate without downtime: create the replacement, deploy it, confirm traffic moved, then revoke the old secret.",
    updated: "27 October 2026",
    sections: [
      {
        h: "1. Create the replacement",
        p: "In the console, choose Rotate on the key. The new secret is shown once and starts working immediately.",
      },
      {
        h: "2. Deploy it",
        p: "Update the environment variable on every worker, not just the first one. If you run several regions, deploy them one at a time and watch the request log.",
      },
      {
        h: "3. Confirm traffic moved",
        p: "The key list shows last used per key. The old key should read as stale before you revoke it.",
      },
      {
        h: "4. Revoke",
        p: "Revocation is immediate and cannot be undone. Anything still holding the old secret starts failing with 401 auth.invalid_key.",
        code: `curl -X DELETE https://api.snagchat.io/v1/keys/key_capture \\
  -H "Authorization: Bearer $SNAGCHAT_KEY"`,
        filename: "terminal",
      },
      {
        h: "Why the overlap exists",
        p: "A live key cannot be revealed without re-authentication, so rotation is the normal way to recover from a leak. The 24-hour overlap is the window where both secrets work.",
      },
    ],
  },

  "reference/games": {
    title: "Games",
    eyebrow: "Reference",
    intro:
      "The catalogue is the single source of truth for the game field. One title per row, resolvable by id, name or alias.",
    updated: "27 October 2026",
    sections: [
      {
        h: "Resolving a title",
        p: "Send the canonical id when you have it. Names and aliases resolve too, but they can change, so store the id.",
        code: `GET /v1/games?q=rust
GET /v1/games/game_rust

{ "id": "game_rust", "name": "Rust", "hashtag": "#rust",
  "aliases": ["rust", "rustconsole"] }`,
        filename: "resolve",
      },
      {
        h: "Claiming a title",
        p: "A studio can claim the game it represents. Claims are checked against the studio's public domain and reviewed by a human; the verified badge is only available to the claimant.",
        list: [
          "Claimed titles get the verified badge and studio posting tokens.",
          "Unclaimed titles still work — the post is simply attributed to the community.",
          "Aliases are added by the catalogue team, so a new console name does not break existing posts.",
        ],
      },
      {
        h: "In this preview",
        p: "The catalogue covers 13 titles in the console, from Rust to Minecraft. The tiles you see there are the same artwork the feed uses.",
      },
    ],
  },

  guidelines: {
    title: "Guidelines",
    eyebrow: "Policies",
    intro:
      "What the gate checks before ranking, and what gets an app removed. Written down so a rejection is never a surprise.",
    updated: "27 October 2026",
    sections: [
      {
        h: "Clips and snags",
        list: [
          "You must hold the rights to the footage you upload.",
          "No harassment, slurs, or content that targets a player by handle.",
          "Cheats, exploits and stolen accounts are removed and the key is disabled.",
          "Squad posts follow the same rules; the squad owner can remove them faster than we can.",
        ],
      },
      {
        h: "Apps",
        list: [
          "One app per surface. Sharing a key between unrelated services is a removal risk, not just a security one.",
          "Test keys must never be used against production data.",
          "An app that posts on a player's behalf needs player OAuth, not a shared secret.",
        ],
      },
      {
        h: "What happens on a breach",
        p: "First breach: the post is held and you get the reason in the response. Repeat breaches: the key is disabled and the app returns to review. Deliberate abuse ends the agreement.",
      },
    ],
  },

  "rate-limits": {
    title: "Rate limits",
    eyebrow: "Policies",
    intro:
      "Limits are enforced per key, per minute, and reported in the response headers so a client can slow down before it is refused.",
    updated: "27 October 2026",
    sections: [
      {
        h: "Tiers",
        table: {
          head: ["Tier", "Requests / min", "Burst", "Notes"],
          rows: [
            ["Free", "60", "90", "Sandbox only"],
            ["Scale", "120", "180", "Included in the plan"],
            ["Scale + ingest", "600", "900", "For capture pipelines"],
            ["Enterprise", "Negotiated", "—", "Contact us"],
          ],
        },
      },
      {
        h: "Headers",
        code: `RateLimit-Limit: 120
RateLimit-Remaining: 87
RateLimit-Reset: 34
Retry-After: 12`,
        filename: "response headers",
      },
      {
        h: "When you are refused",
        p: "429 rate_limited includes Retry-After in seconds. Back off by at least that long, add jitter, and do not retry more than five times. Sustained abuse above the burst is treated as a broken client, not a busy one.",
      },
      {
        h: "Raising a limit",
        p: "Ask in the console under Usage. We look at p95 latency and error rate before raising anything, because a higher limit on a retry loop just moves the queue.",
      },
    ],
  },
};
