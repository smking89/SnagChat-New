import { formatBytes } from "./clipLimits";

/**
 * Upload sandbox.
 *
 * A user file is never trusted and never travels to storage as it arrived.
 * Images are checked by their actual bytes (not the extension or the MIME the
 * browser guessed), decoded in a worker, reduced to raw RGBA, written into a
 * blank canvas and encoded again. The output is a different file made of the
 * same pixels: metadata, extra chunks, comments, embedded archives and anything
 * appended after the image data are gone.
 *
 * MP4s cannot be re-encoded in the browser, so they are held to a strict
 * container walk instead: a real `ftyp` signature, a sane box chain that ends
 * exactly at the file end, and no unexpected top-level blocks. A production
 * build must transcode accepted clips server-side; see the README.
 */
export const SANDBOX = {
  maxBytes: 12 * 1024 * 1024,
  /** 40 MP is plenty for a feed post and keeps the worker's memory bounded. */
  maxPixels: 40_000_000,
  /** Anything larger is scaled down before the pixel pass. */
  maxEdge: 4096,
  outputType: "image/webp",
  quality: 0.9,
  timeoutMs: 30_000,
} as const;

export const SANDBOX_NOTE =
  "Every image is decoded and rebuilt pixel by pixel before it is saved, so metadata and anything appended to the file cannot survive. GIFs are rebuilt as a still.";

type ImageKind = "png" | "jpeg" | "webp" | "gif" | "svg" | null;

type RebuildOptions = {
  maxEdge: number;
  maxPixels: number;
  outputType: string;
  quality: number;
};

export type SandboxedImage = {
  /** A fresh file built from the rebuilt pixels. */
  file: File;
  width: number;
  height: number;
  originalType: string;
  originalBytes: number;
  /** An animated GIF arrives as a still because only decoded pixels survive. */
  convertedFromGif: boolean;
};

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let text = "";
  for (let index = offset; index < offset + length; index += 1) {
    const code = bytes[index] ?? 0;
    if (code === 0) break;
    text += String.fromCharCode(code);
  }
  return text;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

/** Reads the file's real format from its bytes; the extension means nothing. */
function sniffImage(bytes: Uint8Array): ImageKind {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && bytes[5] === 0x61) {
    // GIF87a / GIF89a
    if (bytes[4] === 0x37 || bytes[4] === 0x39) return "gif";
  }
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }

  const head = new TextDecoder().decode(bytes).trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
  return null;
}

export function extensionFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "webp";
}

type WorkerReply =
  | { id: number; ok: true; blob: Blob; width: number; height: number }
  | { id: number; ok: false; error: string };

let sandboxWorker: Worker | null = null;
let requestId = 0;

/**
 * Runs the pixel pass in a worker so decoding and the RGBA copy never block the
 * UI. A worker that cannot start falls back to the same routine on this thread;
 * a file that fails to decode is rejected either way.
 */
function rebuildInWorker(
  file: File,
  options: RebuildOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const worker = (sandboxWorker ??= new Worker(new URL("../workers/imageSandbox.worker.ts", import.meta.url), {
    type: "module",
  }));
  const id = (requestId += 1);

  return new Promise((resolve, reject) => {
    let timer = 0;

    const cleanup = () => {
      window.clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };

    const onMessage = (event: MessageEvent<WorkerReply>) => {
      if (event.data?.id !== id) return;
      cleanup();
      if (event.data.ok) {
        resolve({ blob: event.data.blob, width: event.data.width, height: event.data.height });
      } else {
        reject(new Error(event.data.error));
      }
    };

    const onError = () => {
      cleanup();
      worker.terminate();
      if (sandboxWorker === worker) sandboxWorker = null;
      reject(new Error("The upload sandbox could not start."));
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("The upload sandbox timed out while rebuilding that image."));
    }, SANDBOX.timeoutMs);

    worker.postMessage({ id, file, ...options });
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The rebuilt image came out empty."))),
      type,
      quality,
    );
  });
}

async function rebuildOnMainThread(
  file: File,
  options: RebuildOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, options.maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  if (width * height > options.maxPixels) {
    bitmap.close();
    throw new Error("That image has more pixels than the sandbox accepts. Scale it down and try again.");
  }

  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw new Error("This browser cannot process images.");
  sourceContext.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const pixels = sourceContext.getImageData(0, 0, width, height);

  const rebuilt = document.createElement("canvas");
  rebuilt.width = width;
  rebuilt.height = height;
  const rebuiltContext = rebuilt.getContext("2d");
  if (!rebuiltContext) throw new Error("This browser cannot process images.");
  rebuiltContext.putImageData(new ImageData(new Uint8ClampedArray(pixels.data), width, height), 0, 0);

  return { blob: await toBlob(rebuilt, options.outputType, options.quality), width, height };
}

async function rebuild(
  file: File,
  options: RebuildOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    try {
      return await rebuildInWorker(file, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      // Only a worker that never started is worth retrying here; a refused or
      // undecodable image would fail the same way on this thread.
      if (!message.includes("could not start")) throw error;
    }
  }
  return rebuildOnMainThread(file, options);
}

/**
 * Rebuilds an image from its pixels and returns a fresh file. The only thing
 * that crosses from the original is the decoded image itself.
 */
export async function sanitizeImageFile(file: File): Promise<SandboxedImage> {
  if (!file.size) throw new Error("That file is empty — nothing to upload.");
  if (file.size > SANDBOX.maxBytes) {
    throw new Error(`That image is ${formatBytes(file.size)} — the sandbox limit is ${formatBytes(SANDBOX.maxBytes)}.`);
  }

  const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const kind = sniffImage(head);

  if (kind === "svg") {
    throw new Error("SVG files can carry scripts, so SnagChat does not accept them. Export a PNG or WebP instead.");
  }
  if (!kind) {
    throw new Error("That file is not a real PNG, JPEG, WebP or GIF. Export it again and try once more.");
  }

  const rebuilt = await rebuild(file, {
    maxEdge: SANDBOX.maxEdge,
    maxPixels: SANDBOX.maxPixels,
    outputType: SANDBOX.outputType,
    quality: SANDBOX.quality,
  });

  const outputType = rebuilt.blob.type || SANDBOX.outputType;
  const name = `snagchat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(outputType)}`;
  const clean = new File([rebuilt.blob], name, { type: outputType, lastModified: Date.now() });

  return {
    file: clean,
    width: rebuilt.width,
    height: rebuilt.height,
    originalType: file.type || `image/${kind}`,
    originalBytes: file.size,
    convertedFromGif: kind === "gif",
  };
}

/** Top-level ISO BMFF boxes that a normal MP4 can carry. */
const MP4_BOXES = new Set([
  "ftyp",
  "moov",
  "mdat",
  "free",
  "skip",
  "wide",
  "uuid",
  "pdin",
  "meta",
  "moof",
  "mfra",
  "styp",
  "sidx",
  "ssix",
  "prft",
  "emsg",
  "meco",
  "mere",
  "bloc",
  "cprt",
  "iods",
  "udta",
]);

const MP4_BRANDS = new Set([
  "isom",
  "iso2",
  "iso3",
  "iso4",
  "iso5",
  "iso6",
  "iso8",
  "iso9",
  "mp41",
  "mp42",
  "avc1",
  "dash",
  "M4V ",
  "M4VH",
  "M4VP",
  "mmp4",
  "msdh",
  "msix",
  "qt  ",
]);

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0)) >>>
    0
  );
}

/**
 * Walks an MP4's top-level boxes without decoding any media. A real `ftyp`
 * header, sane sizes, a known box list and no bytes after the last box are
 * required; appended payloads and disguised files are refused.
 */
export async function assertMp4Container(file: File): Promise<void> {
  if (!file.size || file.size < 16) throw new Error("That clip is empty or truncated.");

  const first = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (readAscii(first, 4, 4) !== "ftyp") {
    throw new Error("That file is not a real MP4 — its MP4 signature is missing. Re-export it and try again.");
  }

  const brand = readAscii(first, 8, 4);
  if (!MP4_BRANDS.has(brand)) {
    throw new Error(`Unsupported MP4 brand "${brand.trim()}". Export an H.264 MP4 and try again.`);
  }

  let offset = 0;
  let boxes = 0;

  while (offset < file.size) {
    if (offset + 8 > file.size) {
      throw new Error("That MP4 ends in a partial box, so it was refused.");
    }

    const header = new Uint8Array(await file.slice(offset, Math.min(file.size, offset + 16)).arrayBuffer());
    let size = readUint32(header, 0);
    const type = readAscii(header, 4, 4);
    let headerBytes = 8;

    if (size === 1) {
      if (header.length < 16) throw new Error("That MP4 has a broken box header.");
      const high = readUint32(header, 8);
      const low = readUint32(header, 12);
      size = high * 2 ** 32 + low;
      headerBytes = 16;
    } else if (size === 0) {
      size = file.size - offset;
    }

    if (!type || size < headerBytes || offset + size > file.size) {
      throw new Error("That MP4 has a broken box structure, so it was refused.");
    }

    if (!MP4_BOXES.has(type)) {
      throw new Error(`That MP4 carries an unexpected "${type}" block, so it was refused.`);
    }

    offset += size;
    boxes += 1;
    if (boxes > 2000) throw new Error("That MP4 is too fragmented to check, so it was refused.");
  }

  if (offset !== file.size) {
    throw new Error("That MP4 has trailing data after its last box, so it was refused.");
  }
}
