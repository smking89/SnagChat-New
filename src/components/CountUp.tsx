import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  value: number;
  /** How each frame's number is rendered (e.g. compact "12.4k"). */
  format?: (value: number) => string;
  duration?: number;
};

/**
 * Counts a number up to `value` whenever it changes, easing out so the last
 * digits settle rather than snapping. Respects reduced-motion preferences.
 */
export function CountUp({ value, format = (input) => String(input), duration = 820 }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    if (typeof window === "undefined") {
      setDisplay(value);
      return;
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced || from === value) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{format(display)}</>;
}
