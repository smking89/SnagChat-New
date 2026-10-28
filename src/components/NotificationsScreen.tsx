import { notificationHeadline, notificationIcon, type AppNotification } from "../data/notifications";
import { formatRelative } from "../data/threads";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";

type NotificationsScreenProps = {
  notifications: AppNotification[];
  unreadTotal: number;
  /** Display name and avatar for the player behind a notification. */
  resolveActor: (actorId: string) => { name: string; avatar?: string; verified?: boolean } | undefined;
  titleForSnag: (snagId: string) => string | undefined;
  titleForSquad: (squadId: string) => string | undefined;
  onOpen: (notification: AppNotification) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
};

export function NotificationsScreen({
  notifications,
  unreadTotal,
  resolveActor,
  titleForSnag,
  titleForSquad,
  onOpen,
  onMarkAllRead,
  onClose,
}: NotificationsScreenProps) {
  const rows = [...notifications].sort((a, b) => b.at - a.at);

  return (
    <Screen labelledBy="notifications-title" onClose={onClose}>
      <ScreenHeader
        title="Notifications"
        titleId="notifications-title"
        onBack={onClose}
        action={
          unreadTotal > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="mr-1 text-[11.5px] font-semibold text-brand transition-colors hover:text-brand-deep"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto">
        {rows.length > 0 ? (
          <ul className="divide-y divide-line">
            {rows.map((notification) => {
              const actor = resolveActor(notification.actorId);
              const headline = notificationHeadline(notification, actor?.name ?? "A player", {
                snagTitle: notification.snagId ? titleForSnag(notification.snagId) : undefined,
                squadName: notification.squadId ? titleForSquad(notification.squadId) : undefined,
              });

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(notification)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface ${
                      notification.read ? "" : "bg-brand-tint"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={actor?.name ?? "Player"} size={42} tone="soft" src={actor?.avatar} />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-white bg-white text-brand shadow-[0_1px_3px_rgba(23,25,29,0.18)]">
                        <Icon name={notificationIcon(notification.kind)} size={12} strokeWidth={2.2} />
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span
                          className={`min-w-0 flex-1 text-[12.5px] leading-snug ${
                            notification.read ? "text-[#3d424a]" : "font-semibold text-ink"
                          }`}
                        >
                          {headline}
                        </span>
                        {notification.read ? null : (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                        )}
                      </span>

                      {notification.body ? (
                        <span className="mt-1 block truncate text-[11.5px] text-muted">“{notification.body}”</span>
                      ) : null}

                      <span className="mt-1 block text-[10px] font-medium text-faint">
                        {formatRelative(notification.at)} ago
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-14 text-center">
            <p className="font-display text-[15px] font-extrabold tracking-[-0.02em]">Nothing new</p>
            <p className="mx-auto mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-muted">
              Likes, comments, follows, squad invites and shares land here.
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}
