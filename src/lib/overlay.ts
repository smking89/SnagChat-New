import { useEffect, useRef, type RefObject } from "react";

const STACK: symbol[] = [];
const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

let lockedCount = 0;
let previousOverflow = "";

function lockScroll() {
  if (lockedCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockedCount += 1;
}

function unlockScroll() {
  lockedCount = Math.max(0, lockedCount - 1);
  if (lockedCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
}

/**
 * Shared behaviour for sheets and full-screen screens: only the topmost overlay
 * reacts to Escape/Tab, the body stays locked until the last one closes, and
 * focus returns to the trigger when the stack empties.
 */
export function useOverlay(panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const idRef = useRef(Symbol("overlay"));

  useEffect(() => {
    const id = idRef.current;
    const panel = panelRef.current;
    const trigger = document.activeElement as HTMLElement | null;

    STACK.push(id);
    lockScroll();
    panel?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (STACK[STACK.length - 1] !== id) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = STACK.indexOf(id);
      if (index !== -1) STACK.splice(index, 1);
      unlockScroll();
      if (STACK.length === 0) trigger?.focus?.({ preventScroll: true });
    };
  }, [panelRef]);
}
