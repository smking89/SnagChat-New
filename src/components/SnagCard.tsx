import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { formatCount } from "../data/players";
import type { Snag } from "../data/snags";
import { useCardBounce } from "../lib/cardBounce";
import { Avatar } from "./Avatar";
import { CountUp } from "./CountUp";
import { GameChip } from "./GameLogo";
import { Icon } from "./Icon";

type SnagCardProps = {
  snag: Snag;
  creatorAvatar?: string;
  creatorVerified?: boolean;
  liked: boolean;
  likeCount: number;
  saved: boolean;
  saveCount: number;
  onOpen: (snag: Snag) => void;
  onQuickShare: (snag: Snag) => void;
  onOpenProfile: (creator: string) => void;
  onToggleLike: (snag: Snag) => void;
  onToggleSave: (snag: Snag) => void;
};

const LONG_PRESS_MS = 480;

export function SnagCard({
  snag,
  creatorAvatar,
  creatorVerified = false,
  liked,
  likeCount,
  saved,
  saveCount,
  onOpen,
  onQuickShare,
  onOpenProfile,
  onToggleLike,
  onToggleSave,
}: SnagCardProps) {
  const timer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const cardRef = useCardBounce();

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
    <div
      ref={cardRef}
      className="snag-card group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-surface shadow-[0_1px_2px_rgba(23,25,29,0.1)] transition-shadow duration-300 hover:shadow-[0_10px_26px_rgba(23,25,29,0.14)]"
    >
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

      <span className="pointer-events-none absolute left-2.5 right-[72px] top-2.5 z-10 flex flex-wrap items-center gap-1.5">
        <GameChip game={snag.game} />
        {snag.duration ? (
          <span className="rounded-lg bg-[#080a0e]/60 px-2 py-1.5 text-[9.5px] font-bold leading-none tracking-[0.04em] text-white backdrop-blur-md">
            {snag.duration}
          </span>
        ) : null}
      </span>

      <div className="absolute right-2.5 top-2.5 z-20 flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => onToggleLike(snag)}
          aria-pressed={liked}
          aria-label={`${liked ? "Unlike" : "Like"} ${snag.title}`}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] font-bold leading-none backdrop-blur-md transition-colors ${
            liked
              ? "bg-brand text-white"
              : "border border-white/25 bg-[#080a0e]/60 text-white hover:bg-[#080a0e]/80"
          }`}
        >
          <Icon name="heart" size={15} strokeWidth={2.4} filled={liked} />
          <CountUp value={likeCount} format={formatCount} />
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(snag)}
          aria-pressed={saved}
          aria-label={`${saved ? "Remove from saved" : "Save"} ${snag.title}`}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] font-bold leading-none backdrop-blur-md transition-colors ${
            saved
              ? "bg-white text-ink"
              : "border border-white/25 bg-[#080a0e]/60 text-white hover:bg-[#080a0e]/80"
          }`}
        >
          <Icon name="bookmark" size={15} strokeWidth={2.2} filled={saved} />
          <CountUp value={saveCount} format={formatCount} />
        </button>
      </div>

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
