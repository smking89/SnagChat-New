import { useEffect, useRef, useState, type FormEvent } from "react";
import { findPlayer, type Player } from "../data/players";
import { formatRelative, formatTime, threadPreview, type Thread, type ThreadMessage } from "../data/threads";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";

type InboxScreenProps = {
  threads: Thread[];
  unreadTotal: number;
  suggestions: Player[];
  onClose: () => void;
  onOpenThread: (playerId: string) => void;
};

export function InboxScreen({ threads, unreadTotal, suggestions, onClose, onOpenThread }: InboxScreenProps) {
  const rows = [...threads]
    .map((thread) => ({ thread, player: findPlayer(thread.playerId) }))
    .filter((row): row is { thread: Thread; player: Player } => Boolean(row.player))
    .sort((a, b) => b.thread.updatedAt - a.thread.updatedAt);

  return (
    <Screen labelledBy="inbox-title" onClose={onClose}>
      <ScreenHeader
        title="Messages"
        titleId="inbox-title"
        onBack={onClose}
        action={
          unreadTotal > 0 ? (
            <span className="mr-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">
              {unreadTotal} new
            </span>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto">
        {rows.length > 0 ? (
          <ul className="divide-y divide-line">
            {rows.map(({ thread, player }) => (
              <li key={thread.playerId}>
                <button
                  type="button"
                  onClick={() => onOpenThread(thread.playerId)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface"
                >
                  <Avatar name={player.name} size={48} tone="soft" src={player.avatar} online={player.online} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1 truncate text-[13.5px] font-bold tracking-[-0.01em]">
                        <span className="truncate">{player.name}</span>
                        {player.verified ? (
                          <Icon name="verified" size={13} className="shrink-0 text-[#1d9bf0]" />
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-faint">
                        {formatRelative(thread.updatedAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[11.5px] ${
                          thread.unread > 0 ? "font-semibold text-ink" : "text-muted"
                        }`}
                      >
                        {threadPreview(thread)}
                      </span>
                      {thread.unread > 0 ? (
                        <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                          {thread.unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="font-display text-[15px] font-extrabold tracking-[-0.02em]">No conversations yet</p>
            <p className="mx-auto mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-muted">
              Message a player from their profile, or start a chat below.
            </p>
          </div>
        )}

        {suggestions.length > 0 ? (
          <div className="border-t border-line px-4 py-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Start a chat</p>
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
              {suggestions.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => onOpenThread(player.id)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                >
                  <Avatar name={player.name} size={48} tone="soft" src={player.avatar} online={player.online} />
                  <span className="w-full truncate text-center text-[10px] font-semibold text-[#4d535c]">
                    @{player.handle}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}

type ThreadScreenProps = {
  player: Player;
  messages: ThreadMessage[];
  onClose: () => void;
  onOpenProfile: () => void;
  onSend: (text: string) => void;
};

function MessageBubble({ message, player }: { message: ThreadMessage; player: Player }) {
  const mine = message.from === "me";

  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {mine ? null : <Avatar name={player.name} size={24} tone="soft" src={player.avatar} className="mb-1" />}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
          mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface text-ink"
        }`}
      >
        {message.snag ? (
          <>
            <img
              src={message.snag.image}
              alt=""
              className="mb-2 h-32 w-52 rounded-xl object-cover"
              draggable={false}
            />
            <p className={`text-[12px] font-bold leading-tight ${mine ? "text-white" : "text-ink"}`}>
              {message.snag.title}
            </p>
          </>
        ) : null}
        {message.text ? <p className="mt-1 text-[13px] leading-relaxed">{message.text}</p> : null}
        {message.snag ? (
          <p
            className={`mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
              mine ? "text-white/70" : "text-faint"
            }`}
          >
            {message.snag.game}
          </p>
        ) : null}
        <p className={`mt-1 text-[9px] ${mine ? "text-white/60" : "text-faint"}`}>{formatTime(message.at)}</p>
      </div>
    </div>
  );
}

export function ThreadScreen({ player, messages, onClose, onOpenProfile, onSend }: ThreadScreenProps) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <Screen labelledBy="thread-title" onClose={onClose}>
      <ScreenHeader
        title={
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex min-w-0 items-center gap-2.5 text-left"
            aria-label={`Open ${player.name}'s profile`}
          >
            <Avatar name={player.name} size={32} tone="soft" src={player.avatar} online={player.online} />
            <span className="min-w-0">
              <span
                id="thread-title"
                className="flex items-center gap-1 font-display text-[14px] font-extrabold leading-tight tracking-[-0.02em]"
              >
                <span className="truncate">{player.name}</span>
                {player.verified ? (
                  <Icon name="verified" size={12} className="shrink-0 text-[#1d9bf0]" />
                ) : null}
              </span>
              <span className="block truncate text-[10px] font-medium text-muted">@{player.handle}</span>
            </span>
          </button>
        }
        onBack={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-[560px] flex-col gap-2.5">
          {messages.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-display text-[15px] font-extrabold tracking-[-0.02em]">Say hello to {player.name}</p>
              <p className="mx-auto mt-1.5 max-w-[30ch] text-[12px] leading-relaxed text-muted">
                No messages yet. Share a snag or send the first message.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} player={player} />
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-white px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
        <form onSubmit={submit} className="mx-auto flex max-w-[560px] items-center gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`Message @${player.handle}`}
            aria-label={`Message @${player.handle}`}
            className="h-11 flex-1 rounded-full bg-surface px-4 text-[13px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c6e6]"
          >
            <Icon name="send" size={17} strokeWidth={2} />
          </button>
        </form>
      </div>
    </Screen>
  );
}
