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

export const SEED_NOTIFICATIONS: AppNotification[] = [];


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
