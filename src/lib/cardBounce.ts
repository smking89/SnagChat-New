import { useEffect, useRef } from "react";

const BOUNCE_CLASS = "is-bouncing";
const ENTER_CLASS = "is-entering";
const ENTER_RATIO = 0.3;
const REARM_RATIO = 0.05;

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Starts one animation on the element and clears the class when it finishes so
 * it can play again next time. `blockedBy` keeps the spring and the scroll-in
 * pop from fighting over the transform.
 */
function play(element: HTMLElement, className: string, blockedBy: string) {
  if (element.classList.contains(className) || element.classList.contains(blockedBy)) return;

  element.classList.add(className);

  const done = (event: AnimationEvent) => {
    if (event.target !== element) return;
    element.classList.remove(className);
    element.removeEventListener("animationend", done);
  };

  element.addEventListener("animationend", done);
}

/**
 * Springs a feed card: the class lands whenever a pointer enters or presses the
 * card, and an IntersectionObserver replays the pop as cards scroll back into
 * view.
 */
export function useCardBounce() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    const spring = () => play(element, BOUNCE_CLASS, ENTER_CLASS);

    element.addEventListener("pointerenter", spring);
    element.addEventListener("pointerdown", spring);

    return () => {
      element.removeEventListener("pointerenter", spring);
      element.removeEventListener("pointerdown", spring);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return;

    let inView = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= ENTER_RATIO) {
            if (!inView) play(element, ENTER_CLASS, BOUNCE_CLASS);
            inView = true;
          } else if (entry.intersectionRatio <= REARM_RATIO) {
            inView = false;
          }
        }
      },
      { threshold: [0, REARM_RATIO, ENTER_RATIO, 1] },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return ref;
}
