import { useEffect, useRef } from "react";

export type SwipeDirection = "left" | "right";

type SwipeOptions = {
  /** Shorter than this counts as a tap, not a swipe. */
  minDistance?: number;
  /** How much more horizontal than vertical the gesture has to be. */
  dominance?: number;
  maxDuration?: number;
  /** Widest viewport the gesture is live on, so desktop keeps its pointer. */
  maxWidth?: number;
};

/**
 * Horizontal swipe detection for touch screens. The listeners are passive, so
 * the page still scrolls normally and the gesture is only classified on
 * release — nothing is hijacked mid-drag.
 */
export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  enabled: boolean,
  options: SwipeOptions = {},
) {
  const { minDistance = 64, dominance = 1.5, maxDuration = 700, maxWidth = 1023 } = options;
  const handler = useRef(onSwipe);
  handler.current = onSwipe;
  const target = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = target.current;
    if (!element || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startedAt = 0;
    let tracking = false;

    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }

      // Horizontally scrollable strips (the filter rail) own their own gestures.
      const touched = event.target as Element | null;
      if (touched?.closest?.("[data-swipe-ignore]")) {
        tracking = false;
        return;
      }

      if (window.innerWidth > maxWidth) {
        tracking = false;
        return;
      }

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startedAt = Date.now();
      tracking = true;
    };

    const end = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      if (!touch) return;
      if (Date.now() - startedAt > maxDuration) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < minDistance) return;
      if (Math.abs(dx) < Math.abs(dy) * dominance) return;

      handler.current(dx < 0 ? "left" : "right");
    };

    const cancel = () => {
      tracking = false;
    };

    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchend", end, { passive: true });
    element.addEventListener("touchcancel", cancel, { passive: true });

    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", cancel);
    };
  }, [enabled, minDistance, dominance, maxDuration, maxWidth]);

  return target;
}
