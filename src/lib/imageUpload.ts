import {
  CLIP_LIMITS,
  CLIP_POSTER_FALLBACK,
  checkClipFile,
  checkClipProbe,
  formatBytes,
  formatClipLength,
} from "./clipLimits";
import { assertMp4Container, sanitizeImageFile } from "./fileSandbox";

type Target = { width: number; height: number };

const COVER_MAX_BYTES = 6 * 1024 * 1024;
const COVER_MAX_DIMENSION = 1200;

export const AVATAR_SIZE = { width: 320, height: 320 };
export const BANNER_SIZE = { width: 1200, height: 380 };

/** The recommended upload sizes shown in the composer and profile editor. */
export const UPLOAD_HINTS = {
  cover: "Recommended 1080 × 1350 px (4:5). JPG, PNG or WebP up to 6 MB, or an MP4 clip. Images are rebuilt pixel by pixel before saving, and a GIF becomes a still.",
  avatar: "Recommended 320 × 320 px, square. JPG, PNG, WebP or MP4. Rebuilt pixel by pixel before saving; GIFs become a still.",
  banner: "Recommended 1200 × 380 px, wide. JPG, PNG, WebP or MP4. Rebuilt pixel by pixel before saving; GIFs become a still.",
  clipProfile: `Profile MP4s follow the same clip limits: up to ${formatBytes(
    CLIP_LIMITS.maxBytes,
  )}, from ${CLIP_LIMITS.minSeconds}s to ${CLIP_LIMITS.maxSeconds}s. They loop, and their first frame becomes the still cover.`,
} as const;

async function loadDrawable(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path for formats the browser can decode but not bitmap.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That image could not be read."));
      image.src = url;
    });
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function releaseDrawable(source: ImageBitmap | HTMLImageElement) {
  if ("close" in source && typeof source.close === "function") source.close();
}

function aspectFor(width: number, height: number): string {
  const ratio = width / height;
  if (ratio < 0.66) return "2 / 3";
  if (ratio > 1.6) return "8 / 5";
  return `${width} / ${height}`;
}

export type CoverUpload = {
  image: string;
  aspect: string;
  width: number;
  height: number;
};

/**
 * Cover art for a snag. The file goes through the upload sandbox first, so only
 * rebuilt pixels are ever scaled and stored; a GIF arrives here as a still.
 */
export async function fileToCover(file: File): Promise<CoverUpload> {
  if (file.size > COVER_MAX_BYTES) {
    throw new Error("That image is larger than 6 MB. Try a smaller file.");
  }

  const clean = await sanitizeImageFile(file);
  const source = await loadDrawable(clean.file);
  const width = source.width;
  const height = source.height;

  if (!width || !height) {
    releaseDrawable(source);
    throw new Error("That image could not be read.");
  }

  const scale = Math.min(1, COVER_MAX_DIMENSION / Math.max(width, height));
  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    releaseDrawable(source);
    throw new Error("This browser cannot process images.");
  }

  context.drawImage(source, 0, 0, outWidth, outHeight);
  releaseDrawable(source);

  return {
    image: canvas.toDataURL("image/webp", 0.85),
    aspect: aspectFor(outWidth, outHeight),
    width: outWidth,
    height: outHeight,
  };
}

/**
 * Profile photo or banner. Stills and GIFs take the same path: the sandbox
 * rebuilds the pixels, then the result is cropped to the target ratio.
 */
export async function fileToProfileImage(file: File, target: Target): Promise<string> {
  return await fileToDataUrl(file, target);
}

export async function fileToDataUrl(file: File, target: Target): Promise<string> {
  const clean = await sanitizeImageFile(file);
  const source = await loadDrawable(clean.file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("That image could not be read.");
  }

  const targetRatio = target.width / target.height;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceWidth / sourceHeight > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
  } else {
    cropHeight = sourceWidth / targetRatio;
  }

  const offsetX = (sourceWidth - cropWidth) / 2;
  const offsetY = (sourceHeight - cropHeight) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot process images.");
  }

  context.drawImage(source, offsetX, offsetY, cropWidth, cropHeight, 0, 0, target.width, target.height);

  if ("close" in source && typeof source.close === "function") {
    source.close();
  }

  return canvas.toDataURL("image/jpeg", 0.82);
}

export type ClipUpload = {
  /** Poster frame as a data URL, so the post still renders without the clip. */
  image: string;
  aspect: string;
  width: number;
  height: number;
  /** Rounded length in seconds. */
  seconds: number;
  /** "1:07" for the badge on the card. */
  duration: string;
  bytes: number;
  /** Blob URL for the picked file, played while the composer is open. */
  previewUrl: string;
};

/** Reads the clip's header so its length and resolution can be checked. */
function loadVideo(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const timer = window.setTimeout(() => fail(), 12000);

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      window.clearTimeout(timer);
    };

    function fail() {
      if (settled) return;
      settled = true;
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error("That clip could not be read. Try another MP4."));
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ video, url });
    };
    video.onerror = () => fail();
    video.src = url;
  });
}

/**
 * Grabs one frame so the post (or the profile art) has a cover before the video
 * itself loads. With a target it centre-crops the frame the way still images
 * are cropped, so an MP4 photo lines up with a JPG one.
 */
async function grabPoster(video: HTMLVideoElement, target?: Target): Promise<string> {
  const width = video.videoWidth;
  const height = video.videoHeight;

  const at = Math.min(CLIP_LIMITS.posterSeconds, Math.max(0, video.duration / 2));
  if (at > 0 && Number.isFinite(at)) {
    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("seeked", done);
        resolve();
      };
      video.addEventListener("seeked", done);
      try {
        video.currentTime = at;
      } catch {
        done();
      }
      // A codec that never reports the seek still gets a frame at the start.
      window.setTimeout(done, 2000);
    });
  }

  const canvas = document.createElement("canvas");
  const context = () => {
    const found = canvas.getContext("2d");
    if (!found) throw new Error("This browser cannot process clips.");
    return found;
  };

  if (target) {
    canvas.width = target.width;
    canvas.height = target.height;

    const ratio = target.width / target.height;
    let cropWidth = width;
    let cropHeight = height;
    if (width / height > ratio) cropWidth = height * ratio;
    else cropHeight = width / ratio;

    context().drawImage(
      video,
      (width - cropWidth) / 2,
      (height - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      target.width,
      target.height,
    );
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  const scale = Math.min(1, 720 / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  context().drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * An uploaded clip. The length and resolution come off the file itself, so the
 * composer can hold the upload to the clip policy before anything is posted.
 */
export async function fileToClip(file: File): Promise<ClipUpload> {
  const fileCheck = checkClipFile({ name: file.name, type: file.type, bytes: file.size });
  if (!fileCheck.ok) throw new Error(fileCheck.reason);
  await assertMp4Container(file);

  const { video, url } = await loadVideo(file);
  const probe = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
  const verdict = checkClipProbe(probe);

  if (!verdict.ok) {
    URL.revokeObjectURL(url);
    throw new Error(verdict.reason);
  }

  let image: string;
  try {
    image = await grabPoster(video);
  } catch {
    image = CLIP_POSTER_FALLBACK;
  }

  // The decoder has done its job; the clip itself is stored separately.
  video.removeAttribute("src");
  video.load();

  return {
    image,
    aspect: aspectFor(probe.width, probe.height),
    width: probe.width,
    height: probe.height,
    seconds: Math.max(1, Math.round(probe.duration)),
    duration: formatClipLength(probe.duration),
    bytes: file.size,
    previewUrl: url,
  };
}

export type ProfileClipUpload = {
  /** Cropped first frame, kept as the still cover for the profile art. */
  poster: string;
  /** Blob URL for the picked file, played while the editor is open. */
  previewUrl: string;
  seconds: number;
};

/**
 * An MP4 profile photo or banner. It is held to the same clip policy as a post
 * and its first frame is cropped to the size stills are cropped to.
 */
export async function fileToProfileClip(file: File, target: Target): Promise<ProfileClipUpload> {
  const fileCheck = checkClipFile({ name: file.name, type: file.type, bytes: file.size });
  if (!fileCheck.ok) throw new Error(fileCheck.reason);
  await assertMp4Container(file);

  const { video, url } = await loadVideo(file);
  const probe = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
  const verdict = checkClipProbe(probe);

  if (!verdict.ok) {
    URL.revokeObjectURL(url);
    throw new Error(verdict.reason);
  }

  let poster: string;
  try {
    poster = await grabPoster(video, target);
  } catch {
    poster = CLIP_POSTER_FALLBACK;
  }

  video.removeAttribute("src");
  video.load();

  return { poster, previewUrl: url, seconds: Math.max(1, Math.round(probe.duration)) };
}
