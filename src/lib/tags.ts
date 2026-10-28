/**
 * Hashtags and mentions inside a post's text. A post may carry a small number
 * of them — the limit is shared between both kinds, so "#rust #clip @luma" uses
 * three of the four.
 */
export const MAX_TAGS = 4;

/** Tag bodies: letters, digits and underscores. */
const TAG_RE = /([#@])([A-Za-z0-9_]{1,30})/g;

/** A tag only starts a word: "email@host" and "snag.chat#1" stay plain text. */
const BOUNDARY = /[\s(["'“”‘’.,;:!?/\\|·–—-]/;

export type TagSegment =
  | { type: "text"; text: string }
  | { type: "hashtag"; value: string; raw: string }
  | { type: "mention"; handle: string; raw: string };

/** Splits text into plain runs plus the hashtags and mentions inside it. */
export function parseTags(text: string): TagSegment[] {
  const segments: TagSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(TAG_RE)) {
    const start = match.index ?? 0;
    if (start > 0 && !BOUNDARY.test(text[start - 1])) continue;

    if (start > cursor) segments.push({ type: "text", text: text.slice(cursor, start) });

    const [raw, sigil, body] = match;
    segments.push(
      sigil === "#"
        ? { type: "hashtag", value: body, raw }
        : { type: "mention", handle: body.toLowerCase(), raw },
    );
    cursor = start + raw.length;
  }

  if (cursor < text.length) segments.push({ type: "text", text: text.slice(cursor) });
  return segments;
}

/** How many hashtags and mentions the text carries. */
export function countTags(text: string): number {
  return parseTags(text).filter((segment) => segment.type !== "text").length;
}

/** How many tags past the limit the text is, or 0 when it fits. */
export function tagOverflow(text: string): number {
  return Math.max(0, countTags(text) - MAX_TAGS);
}

/**
 * Adds a tag to a draft, skipping it when the post already carries it, is
 * already full, or the extra characters would run past the length cap.
 */
export function insertTag(text: string, tag: string, maxLength = 70): string {
  const trimmed = text.trimEnd();

  const already = parseTags(trimmed).some(
    (segment) => segment.type !== "text" && segment.raw.toLowerCase() === tag.toLowerCase(),
  );
  if (already || countTags(trimmed) >= MAX_TAGS) return text;

  const next = trimmed ? `${trimmed} ${tag}` : tag;
  return next.length <= maxLength ? next : text;
}

/** Hashtags offered alongside a game, so a poster rarely has to type one. */
export const SUGGESTED_HASHTAGS = ["clip", "loadout", "skin", "base", "squad", "gg"];

/** True when the draft already carries this exact tag. */
export function hasTag(text: string, tag: string): boolean {
  return parseTags(text).some(
    (segment) => segment.type !== "text" && segment.raw.toLowerCase() === tag.toLowerCase(),
  );
}

/** Drops a tag from a draft and tidies up the gap it leaves behind. */
export function removeTag(text: string, tag: string): string {
  const start = text.toLowerCase().indexOf(tag.toLowerCase());
  if (start < 0) return text;

  const next = `${text.slice(0, start)}${text.slice(start + tag.length)}`;
  return next.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trimEnd();
}

/** Adds the tag when it is missing, drops it when it is already there. */
export function toggleTag(text: string, tag: string, maxLength = 70): string {
  return hasTag(text, tag) ? removeTag(text, tag) : insertTag(text, tag, maxLength);
}

/** Cleans whatever someone typed into a hashtag: "my clip" → "#myclip". */
export function toHashtag(input: string): string | null {
  const body = input.replace(/^#+/, "").replace(/[^A-Za-z0-9_]/g, "");
  return body.length >= 2 ? `#${body}` : null;
}

export type TagQuery = { kind: "hashtag" | "mention"; query: string };

/**
 * The half-typed #tag or @mention the draft currently ends on, which is what
 * the autofill list offers to finish. Typing the marker on its own offers
 * everything ("@" lists players, "#" lists tags).
 */
export function trailingQuery(text: string): TagQuery | null {
  const match = /(?:^|\s)([#@])([A-Za-z0-9_]*)$/.exec(text);
  if (!match) return null;
  return { kind: match[1] === "#" ? "hashtag" : "mention", query: match[2] };
}

/** Finishes the half-typed tag at the end of the draft with a chosen one. */
export function completeTag(text: string, tag: string, maxLength = 70): string {
  const match = /(?:^|\s)([#@])([A-Za-z0-9_]*)$/.exec(text);
  if (!match) return insertTag(text, tag, maxLength);

  const clean = tag.trim();
  if (!clean) return text;
  if (!hasTag(text, clean) && countTags(text) >= MAX_TAGS) return text;

  const head = text.slice(0, match.index);
  const next = head ? `${head} ${clean}` : clean;
  return next.length <= maxLength ? next : text;
}
