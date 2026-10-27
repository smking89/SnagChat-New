import { useEffect, useState } from "react";

/**
 * An uploaded MP4 is far too big for localStorage, so clips are kept in
 * IndexedDB as blobs and handed back as object URLs. Where IndexedDB is not
 * available (some private windows, `file://` origins) the clip still plays for
 * the session and the post keeps its poster frame after a reload.
 */
const DB_NAME = "snagchat-clips";
const STORE = "clips";
const DB_VERSION = 1;

const sessionClips = new Map<string, Blob>();
const objectUrls = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("clip database unavailable"));
  });
}

/** Saves a picked clip and returns the key a post stores. */
export async function saveClip(blob: Blob): Promise<string> {
  const id = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionClips.set(id, blob);

  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(blob, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("clip write failed"));
    });
    database.close();
  } catch {
    // Session-only: the poster covers the post after a reload.
  }

  return id;
}

async function readClip(id: string): Promise<Blob | null> {
  try {
    const database = await openDatabase();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(id);
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("clip read failed"));
    });
    database.close();
    return blob;
  } catch {
    return null;
  }
}

/** Playable URL for a stored clip, or null while it is still being read. */
export async function clipUrl(id: string): Promise<string | null> {
  const cached = objectUrls.get(id);
  if (cached) return cached;

  const blob = sessionClips.get(id) ?? (await readClip(id));
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrls.set(id, url);
  return url;
}

export async function deleteClip(id: string): Promise<void> {
  sessionClips.delete(id);

  const url = objectUrls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(id);
  }

  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("clip delete failed"));
    });
    database.close();
  } catch {
    // Nothing to clean up when the clip only ever lived in this session.
  }
}

/** Resolves the clip behind a post, so cards can upgrade from poster to video. */
export function useClipUrl(clipId?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!clipId) {
      setUrl(null);
      return;
    }

    let live = true;
    clipUrl(clipId)
      .then((next) => {
        if (live) setUrl(next);
      })
      .catch(() => {
        if (live) setUrl(null);
      });

    return () => {
      live = false;
    };
  }, [clipId]);

  return url;
}
