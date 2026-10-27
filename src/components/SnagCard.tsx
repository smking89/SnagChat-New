import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { formatCount } from "../data/players";
import type { Snag } from "../data/snags";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

type SnagCardProps = {
  snag: Snag;
  creatorAvatar?: string;
  creatorVerified?: boolean;
  liked: boolean;
  likeCount: number;
  onOpen: (snag: Snag) => void;
  onQuickShare: (snag: Snag) => void;
  onOpenProfile: (creator: string) => void;
  onToggleLike: (snag: Snag) => void;
};

const LONG_PRESS_MS = 480;

export function SnagCard({
  snag,
  creatorAvatar,
  creatorVerified = false,
  liked,
  likeCount,
  onOpen,
  onQuickShare,
  onOpenProfile,
  onToggleLike,
}: SnagCardProps) {
  const timer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    longPressed.current = false;
    clearTimer();
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      onQuickShare(snag);
    }, LONG_PRESS_MS);
  };

  const handleClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    onOpen(snag);
  };

  return (
    <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-surface shadow-[0_1px_2px_rgba(23,25,29,0.1)] transition-shadow duration-300 hover:shadow-[0_10px_26px_rgba(23,25,29,0.14)]">
      <img
        src={snag.image}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{ aspectRatio: snag.aspect }}
        className="block w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
      />

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={clearTimer}
        onPointerCancel={clearTimer}
        onPointerLeave={clearTimer}
        onClick={handleClick}
        onContextMenu={(event) => {
          event.preventDefault();
          clearTimer();
          onQuickShare(snag);
        }}
        aria-label={`${snag.title}. ${snag.game}, snagged by ${snag.creator}. Open snag.`}
        className="absolute inset-0 z-0 select-none rounded-2xl [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-[#080a0e]/95 via-[#080a0e]/40 to-transparent"
      />

      <span className="pointer-events-none absolute left-2.5 right-16 top-2.5 z-10 flex flex-wrap items-center gap-1.5">
        <span className="max-w-full truncate rounded-md border border-white/25 bg-white/15 px-1.5 py-1 text-[9px] font-extrabold uppercase leading-none tracking-[0.09em] text-white backdrop-blur-md">
          {snag.game}
        </span>
        {snag.duration ? (
          <span className="rounded-md bg-[#080a0e]/55 px-1.5 py-1 text-[9px] font-bold leading-none tracking-[0.04em] text-white backdrop-blur-md">
            {snag.duration}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        onClick={() => onToggleLike(snag)}
        aria-pressed={liked}
        aria-label={`${liked ? "Unlike" : "Like"} ${snag.title}`}
        className={`absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-bold leading-none backdrop-blur-md transition-colors ${
          liked
            ? "bg-brand text-white"
            : "border border-white/20 bg-[#080a0e]/55 text-white hover:bg-[#080a0e]/75"
        }`}
      >
        <Icon name="heart" size={11} strokeWidth={2.6} filled={liked} />
        {formatCount(likeCount)}
      </button>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
        <p className="text-[12.5px] font-bold leading-[1.22] tracking-[-0.01em] text-white sm:text-[13.5px]">
          <span className="line-clamp-2">{snag.title}</span>
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenProfile(snag.creatorId ?? snag.creator)}
            aria-label={`Open ${snag.creator}'s profile`}
            className="pointer-events-auto flex min-w-0 items-center gap-1.5 rounded-full text-[10px] font-medium text-white/85 transition-colors hover:text-white"
          >
            <Avatar name={snag.creator} size={18} tone="glass" src={creatorAvatar} />
            <span className="truncate">@{snag.creator}</span>
            {creatorVerified ? (
              <Icon name="verified" size={11} className="shrink-0 text-[#4da3ff]" />
            ) : null}
          </button>
          <span className="shrink-0 text-[10px] font-bold text-[#eab8fb]">{snag.postedAt}</span>
        </div>
      </div>
    </div>
  );
}
