import { useEffect, useRef, useState } from "react";

/** The action a swipe on a card will run when the finger lifts. */
export type CardSwipeHint = "like" | "save" | null;

export type CardSwipeHandlers = {
  onLike: () => void;
  onSave: () => void;
};

/** How far the card can slide, and how much of the drag it takes. */
const MAX_OFFSET = 68;
const DAMPING = 0.55;
/** Raw travel needed before the swipe counts as an action rather than a nudge. */
const TRIGGER = 48;
/** Movement that decides whether the gesture is horizontal (card) or vertical (scroll). */
const AXIS_LOCK = 10;
const MAX_DURATION = 700;

/**
 * Swipe actions on a feed card: drag right to like, left to save. The card
 * follows the finger while the drag is live, and springs back on release.
 *
 * A mostly vertical drag is handed straight back to the page so scrolling still
 * works, and the card carries `data-swipe-ignore` so the tab-swipe gesture on
 * the feed leaves card drags alone.
 */
export function useCardSwipe({ onLike, onSave }: CardSwipeHandlers, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ onLike, onSave });
  latest.current = { onLike, onSave };
  const [hint, setHint] = useState<CardSwipeHint>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startedAt = 0;
    let travelled = 0;
    let axis: "none" | "x" | "y" = "none";
    let active = false;
    let current: CardSwipeHint = null;

    const paint = (value: CardSwipeHint) => {
      if (current === value) return;
      current = value;
      setHint(value);
    };

    const move = (offset: number) => {
      element.style.transition = "none";
      element.style.transform = offset ? `translateX(${offset}px)` : "";
    };

    const settle = () => {
      element.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
      element.style.transform = "";
      window.setTimeout(() => {
        element.style.transition = "";
      }, 260);
    };

    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        active = false;
        return;
      }

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startedAt = Date.now();
      travelled = 0;
      axis = "none";
      active = true;
    };

    const onMove = (event: TouchEvent) => {
      if (!active) return;

      const touch = event.touches[0];
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (axis === "none") {
        if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
        axis = Math.abs(dx) > Math.abs(dy) * 1.3 ? "x" : "y";
        if (axis === "y") {
          // A vertical drag belongs to the feed's scroll, not to the card.
          active = false;
          return;
        }
      }

      travelled = dx;
      move(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx * DAMPING)));
      paint(dx > 0 ? "like" : dx < 0 ? "save" : null);
    };

    const finish = (fire: boolean) => {
      if (!active) return;
      active = false;

      const distance = travelled;
      const direction = current;
      const held = Date.now() - startedAt;
      const wasHorizontal = axis === "x";

      settle();
      paint(null);
      travelled = 0;

      if (!fire || !wasHorizontal || held > MAX_DURATION) return;
      if (distance >= TRIGGER && direction === "like") latest.current.onLike();
      else if (distance <= -TRIGGER && direction === "save") latest.current.onSave();
    };

    const end = () => finish(true);
    const cancel = () => finish(false);

    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: true });
    element.addEventListener("touchend", end, { passive: true });
    element.addEventListener("touchcancel", cancel, { passive: true });

    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", onMove);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", cancel);
    };
  }, [enabled]);

  return { ref, hint };
}
