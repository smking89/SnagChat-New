export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export type ShareTarget = { kind: "snag"; id: string } | { kind: "player"; handle: string } | null;

function origin(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
}

/** A link that reopens the feed with this snag already open. */
export function postShareUrl(snagId: string): string {
  return `${origin()}?snag=${encodeURIComponent(snagId)}`;
}

/** A link that reopens the feed with this player's profile already open. */
export function profileShareUrl(handle: string): string {
  return `${origin()}?player=${encodeURIComponent(handle.replace(/^@+/, ""))}`;
}

/** Reads a shared link's query string back into the screen it points at. */
export function readShareTarget(search: string): ShareTarget {
  const params = new URLSearchParams(search);
  const snagId = params.get("snag");
  if (snagId) return { kind: "snag", id: snagId };
  const handle = params.get("player")?.replace(/^@+/, "");
  if (handle) return { kind: "player", handle };
  return null;
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path when the clipboard is blocked.
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Opens the system share sheet where the browser has one (phones), otherwise
 * copies the link so the share always ends with something usable.
 */
export async function shareLink(payload: { title: string; text: string; url: string }): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Anything else (unsupported payload, blocked by policy) falls back to copy.
    }
  }

  return (await copyText(payload.url)) ? "copied" : "failed";
}

export async function copyShareLink(url: string): Promise<ShareOutcome> {
  return (await copyText(url)) ? "copied" : "failed";
}
