type Target = { width: number; height: number };

const MAX_BYTES = 12 * 1024 * 1024;
const COVER_MAX_BYTES = 6 * 1024 * 1024;
const GIF_MAX_BYTES = 1.5 * 1024 * 1024;
const COVER_MAX_DIMENSION = 1200;

export const AVATAR_SIZE = { width: 320, height: 320 };
export const BANNER_SIZE = { width: 1200, height: 380 };

/** The recommended upload sizes shown in the composer and profile editor. */
export const UPLOAD_HINTS = {
  cover: "Recommended 1080 × 1350 px (4:5). JPG, PNG or WebP up to 6 MB, or a GIF up to 1.5 MB.",
  avatar: "Recommended 320 × 320 px, square. JPG, PNG or WebP, or a GIF up to 1.5 MB.",
  banner: "Recommended 1200 × 380 px, wide. JPG, PNG or WebP, or a GIF up to 1.5 MB.",
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

/**
 * Crops an uploaded image to the target aspect ratio and returns a compressed
 * data URL small enough to keep in localStorage.
 */
async function fileToRawDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("That file could not be read."));
    };
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
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
  isGif: boolean;
};

/**
 * Cover art for a snag. Still images are scaled down and re-encoded, while GIFs
 * are stored as-is so they keep animating in the feed.
 */
export async function fileToCover(file: File): Promise<CoverUpload> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image or GIF file.");
  }

  const isGif = file.type === "image/gif";

  if (isGif) {
    if (file.size > GIF_MAX_BYTES) {
      throw new Error("GIFs need to be 1.5 MB or smaller. Try a shorter clip or a smaller file.");
    }

    const source = await loadDrawable(file);
    const width = source.width;
    const height = source.height;
    releaseDrawable(source);

    if (!width || !height) {
      throw new Error("That GIF could not be read.");
    }

    return {
      image: await fileToRawDataUrl(file),
      aspect: aspectFor(width, height),
      width,
      height,
      isGif: true,
    };
  }

  if (file.size > COVER_MAX_BYTES) {
    throw new Error("That image is larger than 6 MB. Try a smaller file.");
  }

  const source = await loadDrawable(file);
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
    isGif: false,
  };
}

/**
 * Profile photo or banner. GIFs are kept as they are so they stay animated, and
 * stills are cropped to the target ratio the way covers are.
 */
export async function fileToProfileImage(file: File, target: Target): Promise<string> {
  if (file.type === "image/gif") {
    if (file.size > GIF_MAX_BYTES) {
      throw new Error("GIFs need to be 1.5 MB or smaller. Try a shorter or smaller loop.");
    }
    return await fileToRawDataUrl(file);
  }

  return await fileToDataUrl(file, target);
}

export async function fileToDataUrl(file: File, target: Target): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPG, PNG or WebP).");
  }
  if (file.type === "image/gif") {
    throw new Error("GIFs are handled by fileToProfileImage — use that for profile art.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is larger than 12 MB.");
  }

  const source = await loadDrawable(file);
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
