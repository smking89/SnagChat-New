import { useEffect, useRef, useState, type FormEvent } from "react";
import { findPlayer, type Player } from "../data/players";
import {
  formatRelative,
  formatTime,
  liveMessages,
  statusLabel,
  threadPreview,
  vanishLabel,
  THREAD_MODE_LABELS,
  THREAD_MODE_SUMMARY,
  THREAD_MODES,
  type Thread,
  type ThreadMessage,
  type ThreadMode,
} from "../data/threads";
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

/** Small label for how a thread's messages behave. */
function ModeBadge({ mode }: { mode: ThreadMode }) {
  if (mode === "keep") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-brand-deep">
      <Icon name="timer" size={11} strokeWidth={2.2} />
      {mode === "24h" ? "24h" : "View once"}
    </span>
  );
}

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
              {unreadTotal} unread
            </span>
          ) : (
            <span className="mr-1 text-[10.5px] font-semibold text-faint">All read</span>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        {rows.length > 0 ? (
          <ul className="divide-y divide-line">
            {rows.map(({ thread, player }) => {
              const last = liveMessages(thread).slice(-1)[0];
              const mineLast = last?.from === "me";
              const mode = thread.mode ?? "keep";

              return (
                <li key={thread.playerId}>
                  <button
                    type="button"
                    onClick={() => onOpenThread(thread.playerId)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface"
                  >
                    <Avatar name={player.name} size={48} tone="soft" src={player.avatar} online={player.online} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-[13.5px] font-bold tracking-[-0.01em]">
                          <span className="truncate">{player.name}</span>
                          {player.verified ? (
                            <Icon name="verified" size={13} className="shrink-0 text-[#1d9bf0]" />
                          ) : null}
                          <span className="shrink-0 text-[11px] font-medium text-muted">@{player.handle}</span>
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
                      <span className="mt-1 flex items-center gap-2">
                        {mode !== "keep" ? <ModeBadge mode={mode} /> : null}
                        {mineLast && thread.unread === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-faint">
                            <Icon
                              name={last?.status === "read" ? "checks" : "check"}
                              size={11}
                              strokeWidth={2.3}
                              className={last?.status === "read" ? "text-brand" : undefined}
                            />
                            {statusLabel(last?.status)}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
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
  mode: ThreadMode;
  myAvatar?: string;
  onClose: () => void;
  onOpenProfile: () => void;
  onSend: (text: string) => void;
  onSetMode: (mode: ThreadMode) => void;
  /** Drops a message that expired, or was viewed in a view-once chat. */
  onExpire: (messageId: string) => void;
};

/** How long a view-once message stays on screen after being opened. */
const VIEW_ONCE_MS = 5000;

function MessageBubble({
  message,
  player,
  myAvatar,
  mode,
  revealed,
  onReveal,
  now,
}: {
  message: ThreadMessage;
  player: Player;
  myAvatar?: string;
  mode: ThreadMode;
  revealed: boolean;
  onReveal: () => void;
  now: number;
}) {
  const mine = message.from === "me";
  const hidden = mode === "once" && !mine && !revealed;
  const vanish = mode === "24h" ? vanishLabel(message, now) : null;

  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {mine ? (
        <Avatar name="You" size={24} tone="brand" src={myAvatar} className="mb-1" />
      ) : (
        <Avatar name={player.name} size={24} tone="soft" src={player.avatar} className="mb-1" />
      )}

      {hidden ? (
        <button
          type="button"
          onClick={onReveal}
          className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-dashed border-brand/50 bg-brand-tint px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-deep"
        >
          <Icon name="eye" size={16} strokeWidth={2.2} />
          Tap to view once
        </button>
      ) : (
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

          <span
            className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${
              mine ? "text-white/70" : "text-faint"
            }`}
          >
            {vanish ? (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Icon name="timer" size={10} strokeWidth={2.4} />
                {vanish}
              </span>
            ) : null}
            {formatTime(message.at)}
            {mine ? (
              <span className="inline-flex items-center gap-0.5 font-bold">
                <Icon
                  name={message.status === "read" ? "checks" : "check"}
                  size={11}
                  strokeWidth={2.4}
                  className={message.status === "read" ? "text-white" : "text-white/70"}
                />
                {statusLabel(message.status)}
              </span>
            ) : null}
          </span>
        </div>
      )}
    </div>
  );
}

export function ThreadScreen({
  player,
  messages,
  mode,
  myAvatar,
  onClose,
  onOpenProfile,
  onSend,
  onSetMode,
  onExpire,
}: ThreadScreenProps) {
  const [text, setText] = useState("");
  const [modeOpen, setModeOpen] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  // Keeps the 24-hour countdowns honest without re-rendering constantly.
  useEffect(() => {
    if (mode !== "24h") return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [mode]);

  const reveal = (message: ThreadMessage) => {
    setRevealed((current) => [...current, message.id]);
    window.setTimeout(() => onExpire(message.id), VIEW_ONCE_MS);
  };

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
              <span className="block truncate text-[10px] font-medium text-muted">
                @{player.handle} · {player.online ? "online" : "offline"}
              </span>
            </span>
          </button>
        }
        onBack={onClose}
        action={
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setModeOpen((open) => !open)}
              aria-expanded={modeOpen}
              aria-haspopup="menu"
              aria-label="Message timer"
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-surface ${
                mode === "keep" ? "text-ink" : "text-brand"
              }`}
            >
              <Icon name="timer" size={18} />
            </button>

            {modeOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setModeOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_18px_48px_rgba(23,25,29,0.18)]"
                >
                  <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                    Message timer
                  </p>
                  {THREAD_MODES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="menuitemradio"
                      aria-checked={mode === option}
                      onClick={() => {
                        onSetMode(option);
                        setModeOpen(false);
                      }}
                      className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface ${
                        mode === option ? "bg-brand-tint" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          mode === option ? "border-brand bg-brand text-white" : "border-[#d8dce1]"
                        }`}
                      >
                        {mode === option ? <Icon name="check" size={10} strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink">{THREAD_MODE_LABELS[option]}</span>
                        <span className="mt-0.5 block text-[10.5px] leading-snug text-muted">
                          {THREAD_MODE_SUMMARY[option]}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        }
      />

      {mode !== "keep" ? (
        <p className="flex items-center justify-center gap-2 border-b border-line bg-brand-tint px-4 py-2 text-[10.5px] font-semibold text-brand-deep">
          <Icon name="timer" size={13} strokeWidth={2.3} />
          {mode === "24h"
            ? "Messages here vanish 24 hours after they were sent."
            : "Messages here vanish as soon as they are viewed once."}
        </p>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-[560px] flex-col gap-2.5">
          {messages.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-display text-[15px] font-extrabold tracking-[-0.02em]">
                {mode === "keep" ? `Say hello to ${player.name}` : "Nothing here — and that's the point"}
              </p>
              <p className="mx-auto mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-muted">
                {mode === "keep"
                  ? "No messages yet. Share a snag or send the first message."
                  : mode === "24h"
                    ? "Only messages from the last 24 hours are kept in this chat."
                    : "Everything in this chat disappears once it has been viewed."}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                player={player}
                myAvatar={myAvatar}
                mode={mode}
                revealed={revealed.includes(message.id)}
                onReveal={() => reveal(message)}
                now={now}
              />
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
