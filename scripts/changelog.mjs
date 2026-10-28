#!/usr/bin/env node
/**
 * Appends a push to CHANGELOG.md.
 *
 * The changelog workflow hands this script the before and after commits of a
 * push, and every non-merge commit subject between them becomes a bullet under a
 * dated section, newest section first. Running it locally follows HEAD:
 *
 *   node scripts/changelog.mjs                 # HEAD~1..HEAD
 *   node scripts/changelog.mjs --from <sha> --to <sha> --date 2026-10-27
 *
 * Commits that carry "[skip changelog]" and the bot's own changelog commits are
 * ignored, so the workflow can safely commit the result back to main without
 * triggering itself forever.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const changelogPath = resolve(root, "CHANGELOG.md");

const args = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
};

const toRef = argument("to", "HEAD");
const date = argument("date", new Date().toISOString().slice(0, 10));
let from = argument("from", `${toRef}~1`);

const git = (...command) =>
  execFileSync("git", command, { cwd: root, encoding: "utf8" }).trim();

const isCommit = (ref) => {
  if (!ref || /^0+$/.test(ref)) return false;
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

// A brand-new branch reports an all-zero "before", and a force push may point at
// a commit this clone never saw; both fall back to the pushed commit's parent.
if (!isCommit(from)) from = `${toRef}~1`;

if (!isCommit(from)) {
  console.log("No parent commit to diff against — nothing to add.");
  process.exit(0);
}

// Resolve the pushed ref once so the section header carries a real short sha
// even when the script is run locally as `node scripts/changelog.mjs`.
const to = git("rev-parse", "--short=7", toRef);

const skip = (subject) =>
  subject.includes("[skip changelog]") ||
  subject.toLowerCase().startsWith("update changelog") ||
  subject.toLowerCase().startsWith("initial cloud project");

const subjects = git("log", "--no-merges", "--pretty=format:%s", `${from}..${toRef}`)
  .split("\n")
  .map((subject) => subject.trim())
  .filter((subject) => subject && !skip(subject));

if (subjects.length === 0) {
  console.log("No changelog entries for this push.");
  process.exit(0);
}

const short = to;
const block = [
  `## [${date}] — ${short}`,
  "",
  ...subjects.map((subject) => `- ${subject}`),
].join("\n");

const text = readFileSync(changelogPath, "utf8");

// Re-running a push must not add the same section twice.
if (text.includes(`— ${short}`)) {
  console.log(`Push ${short} is already in CHANGELOG.md.`);
  process.exit(0);
}

const unreleased = text.indexOf("## [Unreleased]");

if (unreleased === -1) {
  writeFileSync(changelogPath, `${text.trimEnd()}\n\n${block}\n`);
  console.log(`Added ${subjects.length} entr${subjects.length === 1 ? "y" : "ies"} to CHANGELOG.md.`);
  process.exit(0);
}

// Keep Unreleased at the top and insert the new dated section above the previous
// one, so the file always reads newest first.
const nextSection = text.indexOf("## [", unreleased + "## [Unreleased]".length);
const insertAt = nextSection === -1 ? text.length : nextSection;
const before = text.slice(0, insertAt).trimEnd();
const after = text.slice(insertAt).trimStart();

writeFileSync(changelogPath, `${before}\n\n${block}\n\n${after}\n`);
console.log(`Added ${subjects.length} entr${subjects.length === 1 ? "y" : "ies"} to CHANGELOG.md.`);
