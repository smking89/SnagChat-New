/**
 * Image sandbox, worker side.
 *
 * The file never reaches storage in its original form: it is decoded, drawn to
 * an offscreen canvas, lifted out as raw RGBA pixels and written into a brand
 * new canvas before being encoded again. Comments, EXIF, ICC profiles, extra
 * PNG chunks, embedded files and anything appended after the image data are
 * left behind because only the pixels cross the boundary.
 */
type SandboxRequest = {
  id: number;
  file: File;
  maxEdge: number;
  maxPixels: number;
  outputType: string;
  quality: number;
};

type SandboxReply =
  | { id: number; ok: true; blob: Blob; width: number; height: number }
  | { id: number; ok: false; error: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SandboxRequest>) => void) | null;
  postMessage: (reply: SandboxReply) => void;
};

scope.onmessage = async (event) => {
  const { id, file, maxEdge, maxPixels, outputType, quality } = event.data;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (width * height > maxPixels) {
      bitmap.close();
      throw new Error("That image has more pixels than the sandbox accepts. Scale it down and try again.");
    }

    // Dismantle: decode into pixels, nothing else.
    const source = new OffscreenCanvas(width, height);
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) throw new Error("This browser cannot process images.");
    sourceContext.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const pixels = sourceContext.getImageData(0, 0, width, height);

    // Rebuild: a blank canvas gets those pixels and writes a fresh file.
    const rebuilt = new OffscreenCanvas(width, height);
    const rebuiltContext = rebuilt.getContext("2d");
    if (!rebuiltContext) throw new Error("This browser cannot process images.");
    const copy = new Uint8ClampedArray(pixels.data);
    rebuiltContext.putImageData(new ImageData(copy, width, height), 0, 0);
    const blob = await rebuilt.convertToBlob({ type: outputType, quality });

    if (!blob.size) throw new Error("The rebuilt image came out empty.");
    scope.postMessage({ id, ok: true, blob, width, height });
  } catch (error) {
    scope.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : "That image could not be rebuilt.",
    });
  }
};
