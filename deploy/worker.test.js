import test from "node:test";
import assert from "node:assert/strict";
import { can, allowedUserActions, hashPassword, verifyPassword } from "./worker.js";

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
