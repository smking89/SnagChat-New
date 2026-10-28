import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { FrameUse } from "../data/frames";
import { formatCount } from "../data/players";
import type { Snag } from "../data/snags";
import { useCardBounce } from "../lib/cardBounce";
import { useCardSwipe } from "../lib/cardSwipe";
import { useClipUrl } from "../lib/clipStore";
import { Avatar } from "./Avatar";
import { CountUp } from "./CountUp";
import { FrameLayer } from "./FrameArt";
import { Icon } from "./Icon";
import { RichText } from "./RichText";

type SnagCardProps = {
  snag: Snag;
  creatorAvatar?: string;
  creatorVerified?: boolean;
  liked: boolean;
  likeCount: number;
  saved: boolean;
  saveCount: number;
  onOpen: (snag: Snag) => void;
  /** Where the hold started, so the quick-share dial can bloom from the thumb. */
  onQuickShare: (snag: Snag, at: { x: number; y: number }) => void;
  onOpenProfile: (creator: string) => void;
  onToggleLike: (snag: Snag) => void;
  onToggleSave: (snag: Snag) => void;
  /** Tapping a #hashtag in the title searches the feed for it. */
  onHashtag?: (value: string) => void;
  /** Tapping an @mention opens that player. */
  onMention?: (handle: string) => void;
  /** True when you posted this snag, which reveals the edit and delete actions. */
  isMine?: boolean;
  onEdit?: (snag: Snag) => void;
  onDelete?: (snag: Snag) => void;
  /** The creator's purchased snag frame, if they own one. */
  frame?: FrameUse;
  /** The creator's avatar frame, worn by the author row. */
  creatorFrame?: FrameUse;
};

/** How long "tap again" stays armed before the delete button resets itself. */
const CONFIRM_MS = 3200;

const LONG_PRESS_MS = 480;
/** Two taps inside this window count as a double tap. */
const DOUBLE_TAP_MS = 260;
/**
 * How long a single tap waits to see whether a second one arrives. Kept longer
 * than the double-tap window so the snag can never open a beat before the like.
 */
const TAP_DELAY_MS = 290;
const BURST_MS = 720;

/**
 * A feed card. The media keeps the whole frame to itself — title, author and
 * counters live in the white strip underneath, so nothing is ever drawn over
 * the artwork and the only things floating on it are two small glass buttons.
 */
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
  onHashtag,
  onMention,
  isMine = false,
  onEdit,
  onDelete,
  frame,
  creatorFrame,
}: SnagCardProps) {
  const timer = useRef<number | null>(null);
  /** Set while another gesture (a long press or a swipe) has taken the tap. */
  const consumed = useRef(false);
  const tapTimer = useRef<number | null>(null);
  const lastTap = useRef(0);
  const burstTimer = useRef<number | null>(null);
  const [burst, setBurst] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cardRef = useCardBounce();
  const clip = useClipUrl(snag.clipId);

  const { ref: swipeRef, hint } = useCardSwipe({
    onLike: () => {
      consumed.current = true;
      if (!liked) onToggleLike(snag);
    },
    onSave: () => {
      consumed.current = true;
      if (!saved) onToggleSave(snag);
    },
  });

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

  // The delete button arms itself again if the second tap never comes.
  useEffect(() => {
    if (!confirmDelete) return;
    const timer = window.setTimeout(() => setConfirmDelete(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [confirmDelete]);

  const showBurst = () => {
    setBurst(true);
    if (burstTimer.current !== null) window.clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => setBurst(false), BURST_MS);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    consumed.current = false;
    clearTimer();
    const at = { x: event.clientX, y: event.clientY };
    timer.current = window.setTimeout(() => {
      consumed.current = true;
      clearTapTimer();
      onQuickShare(snag, at);
    }, LONG_PRESS_MS);
  };

  /**
   * A single tap opens the snag; a second tap inside the double-tap window
   * cancels that and likes the post instead, the way a feed double tap works.
   */
  const handleClick = () => {
    if (consumed.current) {
      consumed.current = false;
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
      data-swipe-ignore="true"
      className="snag-card group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(23,25,29,0.1)] ring-1 ring-line transition-shadow duration-300 hover:shadow-[0_10px_26px_rgba(23,25,29,0.14)]"
    >
      {/* The swipe moves this wrapper, so the card's own spring stays untouched. */}
      <div ref={swipeRef} className="relative">
        {/*
         * Every card keeps the same 4:5 frame, so the masonry columns line up
         * instead of ending in a ragged edge. The source aspect is ignored here
         * on purpose: object-cover crops the artwork rather than resizing the
         * card, and the full frame is still shown in the snag view.
         */}
        <div data-media="true" className="frame-host relative aspect-[4/5] overflow-hidden">
          {clip ? (
            <video
              src={clip}
              poster={snag.image}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              className="block h-full w-full bg-ink object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
            />
          ) : (
            <img
              src={snag.image}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
            />
          )}

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
              onQuickShare(snag, { x: event.clientX, y: event.clientY });
            }}
            aria-label={
              snag.sponsoredBy
                ? `${snag.title}. Ad for ${snag.sponsoredBy}, in ${snag.game}. Open post.`
                : `${snag.title}. ${snag.game}, snagged by ${snag.creator}. Open snag. Double tap or swipe right to like, swipe left to save, hold to quick-share.`
            }
            className="absolute inset-0 z-0 select-none [-webkit-touch-callout:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          />

          {burst ? (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-50 grid place-items-center">
              <span className="heart-burst grid place-items-center text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
                <Icon name="heart" size={96} strokeWidth={1.5} filled />
              </span>
            </span>
          ) : null}

          {snag.sponsoredBy ? (
            <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-lg bg-brand/90 px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-[0.1em] text-white backdrop-blur-sm">
              Ad
            </span>
          ) : null}

          {/* Glass outlines, not dark blocks: the artwork stays the subject. */}
          <div className="absolute right-2.5 top-2.5 z-30 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleLike(snag)}
              aria-pressed={liked}
              aria-label={`${liked ? "Unlike" : "Like"} ${snag.title}`}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12.5px] font-bold leading-none backdrop-blur-md transition-colors ${
                liked
                  ? "border-brand bg-brand/85 text-white"
                  : "border-white/45 bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <Icon name="heart" size={21} strokeWidth={2.3} filled={liked} />
              <CountUp value={likeCount} format={formatCount} />
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(snag)}
              aria-pressed={saved}
              aria-label={`${saved ? "Remove from saved" : "Save"} ${snag.title}`}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12.5px] font-bold leading-none backdrop-blur-md transition-colors ${
                saved
                  ? "border-white bg-white text-ink"
                  : "border-white/45 bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <Icon name="bookmark" size={20} strokeWidth={2.1} filled={saved} />
              <CountUp value={saveCount} format={formatCount} />
            </button>
          </div>

          {snag.duration ? (
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-md bg-[#080a0e]/60 px-1.5 py-1 text-[10px] font-bold leading-none tracking-[0.04em] text-white backdrop-blur-sm">
              {snag.duration}
            </span>
          ) : null}

          {/* Your own controls sit on the artwork so every card keeps one height. */}
          {isMine && (onEdit || onDelete) ? (
            <div className="absolute bottom-2.5 left-2.5 z-30 flex items-center gap-1.5">
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(snag)}
                  aria-label={`Edit ${snag.title}`}
                  className="flex h-7 items-center gap-1 rounded-full border border-white/35 bg-[#080a0e]/55 px-2.5 text-[11px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-[#080a0e]/75"
                >
                  <Icon name="edit" size={13} />
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                      return;
                    }
                    setConfirmDelete(false);
                    onDelete(snag);
                  }}
                  aria-label={`Delete ${snag.title}`}
                  className={`flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur-md transition-colors ${
                    confirmDelete
                      ? "border-[#ffb4ae] bg-[#b3261e]/85 text-white"
                      : "border-white/35 bg-[#080a0e]/55 text-white hover:bg-[#080a0e]/75"
                  }`}
                >
                  <Icon name="trash" size={13} />
                  {confirmDelete ? "Tap again" : "Delete"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/*
         * Fixed-height meta block: one 22px author row and two clamped title
         * lines. Together with the 4:5 media this makes every card identical.
         */}
        <div data-meta="true" className="flex h-[86px] flex-col px-3 pb-3 pt-2.5">
          <div className="flex h-[22px] items-center justify-between gap-2">
            {snag.sponsoredBy ? (
              <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] font-semibold text-muted">
                <span className="truncate">Sponsored by {snag.sponsoredBy}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenProfile(snag.creatorId ?? snag.creator)}
                aria-label={`Open ${snag.creator}'s profile`}
                className="flex min-w-0 items-center gap-1.5 rounded-full text-[11px] font-semibold text-ink transition-colors hover:text-brand"
              >
                <Avatar name={snag.creator} size={22} tone="soft" src={creatorAvatar} frame={creatorFrame} />
                <span className="truncate">@{snag.creator}</span>
                {creatorVerified ? <Icon name="verified" size={12} className="shrink-0 text-[#1d9bf0]" /> : null}
              </button>
            )}
            <span className="shrink-0 text-[10.5px] font-semibold text-faint">{snag.postedAt}</span>
          </div>

          <p className="mt-1.5 min-h-[34px] text-[13px] font-bold leading-[1.3] tracking-[-0.01em] text-ink">
            <RichText text={snag.title} className="line-clamp-2" onHashtag={onHashtag} onMention={onMention} />
          </p>
        </div>
      </div>

      {/*
       * Card frames wrap the whole card — artwork, author row and title — not
       * just the media. The overlay never catches a click, so every control
       * underneath still works.
       */}
      {frame ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          <FrameLayer use={frame} target="snag" />
        </span>
      ) : null}

      {/* What a swipe is about to do, shown while the card is dragged. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-3 top-1/4 z-[60] flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-brand px-3 py-2 text-white shadow-[0_10px_24px_rgba(23,25,29,0.3)] transition-opacity duration-150 ${
          hint === "like" ? "opacity-100" : "opacity-0"
        }`}
      >
        <Icon name="heart" size={20} strokeWidth={2.3} filled />
        <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">Like</span>
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 top-1/4 z-[60] flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-ink px-3 py-2 text-white shadow-[0_10px_24px_rgba(23,25,29,0.3)] transition-opacity duration-150 ${
          hint === "save" ? "opacity-100" : "opacity-0"
        }`}
      >
        <Icon name="bookmark" size={19} strokeWidth={2.2} filled />
        <span className="text-[9px] font-extrabold uppercase tracking-[0.1em]">Save</span>
      </span>
    </div>
  );
}
