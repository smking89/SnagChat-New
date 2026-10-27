export type ThreadMessage = {
  id: string;
  from: "me" | "them";
  at: number;
  text?: string;
  snag?: { image: string; title: string; game: string };
};

export type Thread = {
  playerId: string;
  messages: ThreadMessage[];
  unread: number;
  updatedAt: number;
};

const now = Date.now();
const minute = 60 * 1000;

export const SEED_THREADS: Record<string, Thread> = {
  jax: {
    playerId: "jax",
    unread: 2,
    updatedAt: now - 48 * minute,
    messages: [
      { id: "seed-jax-1", from: "them", at: now - 52 * minute, text: "that coastline clip is unreal" },
      { id: "seed-jax-2", from: "them", at: now - 48 * minute, text: "how long did the run take?" },
    ],
  },
  luma: {
    playerId: "luma",
    unread: 0,
    updatedAt: now - 118 * minute,
    messages: [
      {
        id: "seed-luma-1",
        from: "them",
        at: now - 124 * minute,
        text: "squad room shots are up on my profile",
      },
      { id: "seed-luma-2", from: "me", at: now - 118 * minute, text: "pulling the purple ones for the gallery" },
    ],
  },
  mira: {
    playerId: "mira",
    unread: 1,
    updatedAt: now - 5 * 60 * minute,
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
