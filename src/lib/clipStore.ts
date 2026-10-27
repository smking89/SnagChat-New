import { useEffect, useState } from "react";

/**
 * Uploaded MP4s are far too big for localStorage, so they live in IndexedDB
 * under a small key. Profiles and posts only store that key, which keeps the
 * persisted state small while the clip itself still survives a reload.
 */
const DB_NAME = "snagchat-media";
const STORE = "clips";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  return dbPromise;
}

/** Stores a clip and resolves with the key to remember it by. */
export async function saveClip(file: Blob): Promise<string | undefined> {
  const db = await openDb();
  if (!db) return undefined;

  const key = `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return await new Promise<string | undefined>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, key);
    tx.oncomplete = () => resolve(key);
    tx.onerror = () => resolve(undefined);
    tx.onabort = () => resolve(undefined);
  });
}

export async function readClip(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  if (!db) return undefined;

  return await new Promise<Blob | undefined>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
    request.onerror = () => resolve(undefined);
  });
}

const urlCache = new Map<string, string>();

/**
 * Resolves a stored clip key to a blob URL for playback. Cached per key so a
 * feed of cards does not create a new object URL on every render.
 */
export function useClipUrl(key?: string): string | null {
  const [url, setUrl] = useState<string | null>(() => (key ? urlCache.get(key) ?? null : null));

  useEffect(() => {
    if (!key) {
      setUrl(null);
      return;
    }

    const cached = urlCache.get(key);
    if (cached) {
      setUrl(cached);
      return;
    }

    let active = true;

    void readClip(key).then((blob) => {
      if (!blob || !active) return;
      const objectUrl = URL.createObjectURL(blob);
      urlCache.set(key, objectUrl);
      setUrl(objectUrl);
    });

    return () => {
      active = false;
    };
  }, [key]);

  return url;
}
