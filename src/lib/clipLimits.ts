/**
 * Clip policy for uploaded MP4s. The composer states these numbers next to the
 * upload control, and every uploaded file is checked against them before it is
 * accepted, so the feed never carries a clip the player did not expect.
 */
export const CLIP_LIMITS = {
  /** Shorter than this and there is nothing to watch. */
  minSeconds: 2,
  /** Length cap. Trim rather than refuse where the browser can. */
  maxSeconds: 60,
  /** One post's clip budget, chosen to stay inside a mobile upload window. */
  maxBytes: 50 * 1024 * 1024,
  /** Anything taller is scaled down by the player rather than rejected. */
  maxHeight: 1080,
  /** Blind uploads below this are almost always a mistake. */
  minHeight: 240,
  formats: ["video/mp4"],
  /** The frame used as the post's cover. */
  posterSeconds: 0.5,
} as const;

export const CLIP_HINTS = {
  clip: `MP4, ${formatBytes(CLIP_LIMITS.maxBytes)} max. At least ${CLIP_LIMITS.minSeconds}s and no longer than ${CLIP_LIMITS.maxSeconds}s — 1080p max, 720p recommended.`,
  poster: `The cover frame is taken at ${CLIP_LIMITS.posterSeconds}s so the post still shows without the video.`,
} as const;

/** Stand-in cover for a clip whose frame could not be captured. */
export const CLIP_POSTER_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#17191d"/><path d="M6.4 3 10.6 4.5 6.4 6z" fill="#ffffff"/></svg>',
  );

export type ClipFile = { name?: string; type: string; bytes: number };
export type ClipProbe = { duration: number; width: number; height: number };
export type ClipVerdict = { ok: true; note?: string } | { ok: false; reason: string };

/** "1:07" for the badge on a card. */
export function formatClipLength(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Format and size, checked before the browser reads the file. */
export function checkClipFile(file: ClipFile): ClipVerdict {
  if (!file.type.startsWith("video/")) {
    return { ok: false, reason: "That is not a video file. Pick an MP4 clip or a still image." };
  }

  if (!(CLIP_LIMITS.formats as readonly string[]).includes(file.type.toLowerCase())) {
    return { ok: false, reason: "Clips need to be MP4. Convert it and try again." };
  }

  if (!file.bytes) {
    return { ok: false, reason: "That file is empty — nothing to upload." };
  }

  if (file.bytes > CLIP_LIMITS.maxBytes) {
    return {
      ok: false,
      reason: `That clip is ${formatBytes(file.bytes)} — the limit is ${formatBytes(CLIP_LIMITS.maxBytes)}. Trim it and try again.`,
    };
  }

  return { ok: true };
}

/** Length and resolution, checked once the browser has read the clip's header. */
export function checkClipProbe(probe: ClipProbe): ClipVerdict {
  if (!Number.isFinite(probe.duration) || probe.duration <= 0) {
    return { ok: false, reason: "We could not read that clip's length. Try another MP4." };
  }

  if (probe.duration < CLIP_LIMITS.minSeconds) {
    return { ok: false, reason: `Clips need to be at least ${CLIP_LIMITS.minSeconds} seconds.` };
  }

  if (probe.duration > CLIP_LIMITS.maxSeconds) {
    return {
      ok: false,
      reason: `Clips are capped at ${CLIP_LIMITS.maxSeconds} seconds — that one is ${formatClipLength(probe.duration)}. Trim it and try again.`,
    };
  }

  if (!probe.width || !probe.height) {
    return { ok: false, reason: "We could not read that clip's resolution. Try another MP4." };
  }

  if (probe.height < CLIP_LIMITS.minHeight) {
    return { ok: false, reason: `That clip is only ${probe.height}p tall. Upload at least ${CLIP_LIMITS.minHeight}p.` };
  }

  if (probe.height > CLIP_LIMITS.maxHeight) {
    return { ok: true, note: `Taller than ${CLIP_LIMITS.maxHeight}p — the player scales it down.` };
  }

  return { ok: true };
}

export function validateClip(file: ClipFile, probe: ClipProbe): ClipVerdict {
  const fileCheck = checkClipFile(file);
  return fileCheck.ok ? checkClipProbe(probe) : fileCheck;
}
