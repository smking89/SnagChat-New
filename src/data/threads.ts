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

export const SEED_THREADS: Record<string, Thread> = {};


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
