export type MessageStatus = "sending" | "sent" | "read";

/** keep = normal thread, 24h = messages expire a day after sending, once = view once. */
export type ThreadMode = "keep" | "24h" | "once";

export type ThreadMessage = {
  id: string;
  from: "me" | "them";
  at: number;
  text?: string;
  snag?: { image: string; title: string; game: string };
  /** Delivery state for your own messages. */
  status?: MessageStatus;
};

export type Thread = {
  playerId: string;
  messages: ThreadMessage[];
  unread: number;
  updatedAt: number;
  mode?: ThreadMode;
};

export const THREAD_MODES: ThreadMode[] = ["keep", "24h", "once"];

export const THREAD_MODE_LABELS: Record<ThreadMode, string> = {
  keep: "Keep messages",
  "24h": "Disappear after 24 hours",
  once: "Disappear once viewed",
};

export const THREAD_MODE_SUMMARY: Record<ThreadMode, string> = {
  keep: "Messages stay in this chat.",
  "24h": "Every message vanishes 24 hours after it was sent.",
  once: "Messages vanish as soon as they have been viewed once.",
};

/** How long a message lives in the 24-hour mode. */
export const VANISH_MS = 24 * 60 * 60 * 1000;

/**
 * Messages that are still around. The 24-hour mode is measured from when each
 * message was sent, so switching the mode on can expire older messages at once.
 */
export function liveMessages(thread: Thread, at = Date.now()): ThreadMessage[] {
  if (thread.mode !== "24h") return thread.messages;
  return thread.messages.filter((message) => at - message.at < VANISH_MS);
}

/** Time left on a 24-hour message, as a short label. */
export function vanishLabel(message: ThreadMessage, at = Date.now()): string | null {
  const left = message.at + VANISH_MS - at;
  if (left <= 0) return null;
  const hours = Math.floor(left / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.max(1, Math.round(left / (60 * 1000)));
  return `${minutes}m left`;
}

const now = Date.now();
const minute = 60 * 1000;

export const SEED_THREADS: Record<string, Thread> = {
  jax: {
    playerId: "jax",
    unread: 2,
    updatedAt: now - 48 * minute,
    mode: "keep",
    messages: [
      { id: "seed-jax-1", from: "them", at: now - 52 * minute, text: "that coastline clip is unreal" },
      { id: "seed-jax-2", from: "them", at: now - 48 * minute, text: "how long did the run take?" },
    ],
  },
  luma: {
    playerId: "luma",
    unread: 0,
    updatedAt: now - 118 * minute,
    mode: "keep",
    messages: [
      {
        id: "seed-luma-1",
        from: "them",
        at: now - 124 * minute,
        text: "squad room shots are up on my profile",
      },
      {
        id: "seed-luma-2",
        from: "me",
        at: now - 118 * minute,
        text: "pulling the purple ones for the gallery",
        status: "read",
      },
    ],
  },
  otis: {
    playerId: "otis",
    unread: 0,
    updatedAt: now - 40 * minute,
    mode: "24h",
    messages: [
      { id: "seed-otis-1", from: "them", at: now - 46 * minute, text: "couch co-op tonight?" },
      {
        id: "seed-otis-2",
        from: "me",
        at: now - 40 * minute,
        text: "in, 9pm",
        status: "sent",
      },
    ],
  },
  kit: {
    playerId: "kit",
    unread: 1,
    updatedAt: now - 12 * minute,
    mode: "once",
    messages: [
      { id: "seed-kit-1", from: "them", at: now - 12 * minute, text: "send me the summit coordinates before I forget" },
    ],
  },
  mira: {
    playerId: "mira",
    unread: 1,
    updatedAt: now - 5 * 60 * minute,
    mode: "keep",
    messages: [
      { id: "seed-mira-1", from: "them", at: now - 5 * 60 * minute, text: "castle fog at 5h is the best one yet" },
    ],
  },
};

export function lastMessage(thread: Thread): ThreadMessage | undefined {
  return thread.messages[thread.messages.length - 1];
}

export function threadPreview(thread: Thread): string {
  const message = lastMessage(thread);
  if (!message) return "No messages yet";
  const body = message.snag ? `Shared a snag: ${message.snag.title}` : (message.text ?? "Sent a snag");
  return message.from === "me" ? `You: ${body}` : body;
}

/** Short delivery label for the last message you sent in a thread. */
export function statusLabel(status: MessageStatus | undefined): string {
  if (status === "read") return "Read";
  if (status === "sent") return "Sent";
  return "Sending";
}

export function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(at: number): string {
  const diff = Date.now() - at;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
