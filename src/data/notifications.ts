export type NotificationKind = "like" | "comment" | "follow" | "invite" | "share" | "mention";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  /** Player who did the thing. */
  actorId: string;
  at: number;
  read: boolean;
  /** Post the notification points at, when there is one. */
  snagId?: string;
  /** Squad a notification points at. */
  squadId?: string;
  /** Comment or message body, shown as a quote. */
  body?: string;
};

const now = Date.now();
const minute = 60 * 1000;
const hour = 60 * minute;

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n-1",
    kind: "like",
    actorId: "masonr",
    snagId: "snag-01",
    at: now - 6 * minute,
    read: false,
  },
  {
    id: "n-2",
    kind: "comment",
    actorId: "jax",
    snagId: "snag-11",
    at: now - 22 * minute,
    read: false,
    body: "Stealing half of these binds, thanks.",
  },
  {
    id: "n-3",
    kind: "follow",
    actorId: "kirav",
    at: now - 54 * minute,
    read: false,
  },
  {
    id: "n-4",
    kind: "share",
    actorId: "luma",
    snagId: "snag-13",
    at: now - 3 * hour,
    read: true,
  },
  {
    id: "n-5",
    kind: "invite",
    actorId: "nyx",
    squadId: "static-kings",
    at: now - 5 * hour,
    read: true,
  },
  {
    id: "n-6",
    kind: "mention",
    actorId: "wren",
    snagId: "snag-14",
    at: now - 26 * hour,
    read: true,
    body: "shot this one with @you in the lobby",
  },
];

/** Headline for a notification, given the display names it needs. */
export function notificationHeadline(
  notification: AppNotification,
  actorName: string,
  target: { snagTitle?: string; squadName?: string } = {},
): string {
  const who = actorName;

  switch (notification.kind) {
    case "like":
      return `${who} liked your snag`;
    case "comment":
      return `${who} commented on ${target.snagTitle ? `"${target.snagTitle}"` : "your snag"}`;
    case "follow":
      return `${who} started following you`;
    case "share":
      return `${who} shared ${target.snagTitle ? `"${target.snagTitle}"` : "your snag"} with a squad`;
    case "invite":
      return `${who} invited you to ${target.squadName ?? "a squad"}`;
    case "mention":
      return `${who} mentioned you in a comment`;
  }
}

export function notificationIcon(kind: NotificationKind) {
  switch (kind) {
    case "like":
      return "heart" as const;
    case "comment":
      return "message" as const;
    case "follow":
      return "user" as const;
    case "share":
      return "share" as const;
    case "invite":
      return "users" as const;
    case "mention":
      return "message" as const;
  }
}
