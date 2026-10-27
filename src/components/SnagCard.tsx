import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
/** Two taps inside this window count as a double tap. */
const DOUBLE_TAP_MS = 260;
/**
 * How long a single tap waits to see whether a second one arrives. Kept longer
 * than the double-tap window so the snag can never open a beat before the like.
 */
const TAP_DELAY_MS = 290;
const BURST_MS = 720;

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
  const tapTimer = useRef<number | null>(null);
  const lastTap = useRef(0);
  const burstTimer = useRef<number | null>(null);
  const [burst, setBurst] = useState(false);
  const cardRef = useCardBounce();

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const clearTapTimer = () => {
    if (tapTimer.current !== null) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
  };

  useEffect(
    () => () => {
      clearTimer();
      clearTapTimer();
      if (burstTimer.current !== null) window.clearTimeout(burstTimer.current);
    },
    [],
  );

  const showBurst = () => {
    setBurst(true);
    if (burstTimer.current !== null) window.clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => setBurst(false), BURST_MS);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    longPressed.current = false;
    clearTimer();
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      clearTapTimer();
      onQuickShare(snag);
    }, LONG_PRESS_MS);
  };

  /**
   * A single tap opens the snag; a second tap inside the double-tap window
   * cancels that and likes the post instead, the way a feed double tap works.
   */
  const handleClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }

    const now = Date.now();

    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      clearTapTimer();
      showBurst();
      if (!liked) onToggleLike(snag);
      return;
    }

    lastTap.current = now;
    clearTapTimer();
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      onOpen(snag);
    }, TAP_DELAY_MS);
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
        aria-label={
          snag.sponsoredBy
            ? `${snag.title}. Ad for ${snag.sponsoredBy}, in ${snag.game}. Open post.`
            : `${snag.title}. ${snag.game}, snagged by ${snag.creator}. Open snag. Double tap to like.`
        }
        className="absolute inset-0 z-0 select-none rounded-2xl [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-[#080a0e]/95 via-[#080a0e]/40 to-transparent"
      />

      {burst ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <span className="heart-burst grid place-items-center text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
            <Icon name="heart" size={96} strokeWidth={1.5} filled />
          </span>
        </span>
      ) : null}

      {snag.sponsoredBy ? (
        <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-lg bg-brand px-2 py-1.5 text-[10.5px] font-extrabold uppercase leading-none tracking-[0.1em] text-white">
          Ad
        </span>
      ) : null}

      <div className="absolute right-2.5 top-2.5 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => onToggleLike(snag)}
          aria-pressed={liked}
          aria-label={`${liked ? "Unlike" : "Like"} ${snag.title}`}
          className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-bold leading-none backdrop-blur-md transition-colors ${
            liked
              ? "bg-brand text-white"
              : "border border-white/25 bg-[#080a0e]/60 text-white hover:bg-[#080a0e]/80"
          }`}
        >
          <Icon name="heart" size={20} strokeWidth={2.3} filled={liked} />
          <CountUp value={likeCount} format={formatCount} />
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(snag)}
          aria-pressed={saved}
          aria-label={`${saved ? "Remove from saved" : "Save"} ${snag.title}`}
          className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-bold leading-none backdrop-blur-md transition-colors ${
            saved
              ? "bg-white text-ink"
              : "border border-white/25 bg-[#080a0e]/60 text-white hover:bg-[#080a0e]/80"
          }`}
        >
          <Icon name="bookmark" size={19} strokeWidth={2.1} filled={saved} />
          <CountUp value={saveCount} format={formatCount} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
        <span className="mb-2 flex flex-wrap items-center gap-1.5">
          <GameChip game={snag.game} />
          {snag.duration ? (
            <span className="rounded-lg bg-[#080a0e]/60 px-2 py-1.5 text-[10.5px] font-bold leading-none tracking-[0.04em] text-white backdrop-blur-md">
              {snag.duration}
            </span>
          ) : null}
        </span>
        <p className="text-[12.5px] font-bold leading-[1.22] tracking-[-0.01em] text-white sm:text-[13.5px]">
          <span className="line-clamp-2">{snag.title}</span>
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          {snag.sponsoredBy ? (
            <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-white/85">
              <span className="truncate">Sponsored by {snag.sponsoredBy}</span>
            </span>
          ) : (
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
          )}
          <span className="shrink-0 text-[10px] font-bold text-[#eab8fb]">{snag.postedAt}</span>
        </div>
      </div>
    </div>
  );
}
