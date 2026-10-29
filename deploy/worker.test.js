import test from "node:test";
import assert from "node:assert/strict";
import { can, allowedUserActions, hashPassword, verifyPassword, csrfRejected } from "./worker.js";

test("capability matrix matches the contract in docs/admin-api.md", () => {
  assert.equal(can("superadmin", "staff.write"), true);
  assert.equal(can("superadmin", "anything.else"), true, "superadmin matches the wildcard");

  assert.equal(can("admin", "reports.restore"), true);
  assert.equal(can("admin", "escalations.read"), true);
  assert.equal(can("admin", "staff.read"), false);
  assert.equal(can("admin", "staff.write"), false);

  assert.equal(can("moderator", "reports.decide"), true);
  assert.equal(can("moderator", "users.action"), true);
  assert.equal(can("moderator", "reports.restore"), false);
  assert.equal(can("moderator", "staff.read"), false);
  assert.equal(can("moderator", "*"), false);

  assert.equal(can("viewer", "metrics.read"), false, "unknown roles hold no capabilities");
  assert.equal(can(undefined, "metrics.read"), false);
});

test("user actions are role scoped, moderator is advisory only", () => {
  assert.deepEqual(allowedUserActions("moderator"), ["warn", "timeout"]);
  assert.deepEqual(allowedUserActions("admin"), ["warn", "timeout", "suspend", "verify"]);
  assert.equal(allowedUserActions("superadmin").includes("ban"), true);
  assert.equal(allowedUserActions("superadmin").includes("delete"), true);
  assert.deepEqual(allowedUserActions("viewer"), []);
});

test("passwords round trip through PBKDF2 and reject wrong input", async () => {
  const stored = await hashPassword("SnagChat!Mod1");
  assert.match(stored, /^pbkdf2\$120000\$/);
  assert.equal(await verifyPassword("SnagChat!Mod1", stored), true);
  assert.equal(await verifyPassword("SnagChat!Mod2", stored), false);
  assert.equal(await verifyPassword("", stored), false);
  assert.equal(await verifyPassword("SnagChat!Mod1", "not-a-hash"), false);
  assert.equal(await verifyPassword("SnagChat!Mod1", "pbkdf2$100$c2FsdA==$aGFzaA=="), false, "weak iteration counts are refused");
});

test("csrf accepts the dev proxy origin only while the api stays local", () => {
  const post = (origin, apiOrigin) => {
    const target = `${apiOrigin}/api/v1/auth/login`;
    return csrfRejected(
      new Request(target, { method: "POST", headers: { origin } }),
      new URL(target),
    );
  };

  // Vite serves the page on :3001 while the api answers on :8787.
  assert.equal(post("http://127.0.0.1:3001", "http://127.0.0.1:8787"), false, "dev proxy origin accepted");
  assert.equal(post("http://localhost:3001", "http://127.0.0.1:8787"), false, "localhost proxy origin accepted");
  assert.equal(post("https://admin.snagchat.io", "https://admin.snagchat.io"), false, "same origin accepted");

  assert.equal(post("https://evil.example", "http://127.0.0.1:8787"), true, "foreign origin rejected locally");
  assert.equal(post("http://127.0.0.1:3001", "https://admin.snagchat.io"), true, "loopback origin rejected once deployed");
  assert.equal(post("null", "http://127.0.0.1:8787"), true, "Origin: null rejected");

  const read = new Request("http://127.0.0.1:8787/api/v1/reports", {
    method: "GET",
    headers: { origin: "https://evil.example" },
  });
  assert.equal(csrfRejected(read, new URL(read.url)), false, "reads are not origin checked");

  const bare = new Request("http://127.0.0.1:8787/api/v1/auth/login", { method: "POST" });
  assert.equal(csrfRejected(bare, new URL(bare.url)), true, "missing origin and marker rejected");
});
