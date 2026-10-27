import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "./Icon";

/**
 * The pill that slides down under the status bar to confirm something landed.
 * It clears itself after a couple of seconds, and a tap or an upward flick
 * sweeps it away early. A toast may also carry one action, like undoing a
 * delete, in which case it stays up long enough to reach.
 */
export type ToastMessage = {
  id: number;
  /** Bold first line, e.g. "#xrtz75 attached as unique tag!" */
  text: string;
  detail?: string;
  spark?: boolean;
  /** One optional action, e.g. "Undo" after a snag is deleted. */
  action?: { label: string; onClick: () => void };
  /** How long the pill stays before it clears itself. */
  holdMs?: number;
};

const HOLD_MS = 2200;
const OUT_MS = 300;

export function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const hold = toast.holdMs ?? HOLD_MS;

  useEffect(() => {
    setLeaving(false);
    const timer = window.setTimeout(() => setLeaving(true), hold);
    const remove = window.setTimeout(onDismiss, hold + OUT_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(remove);
    };
    // A new toast replaces the old one and restarts the countdown.
  }, [toast.id, onDismiss, hold]);

  /** Acting on a toast must not also count as tapping it away. */
  const act = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toast.action?.onClick();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top))]">
      <div
        role="status"
        aria-live="polite"
        onClick={onDismiss}
        onPointerDown={(event) => {
          dragging.current = true;
          startY.current = event.clientY;
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          if (startY.current - event.clientY > 18) {
            dragging.current = false;
            onDismiss();
          }
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        className={`pointer-events-auto flex w-full max-w-[420px] cursor-pointer items-center gap-2.5 rounded-3xl border-t border-white/10 bg-[#121212] px-3.5 py-3 text-left shadow-[0_12px_24px_rgba(0,0,0,0.35)] ${
          leaving ? "toast-leaving" : "toast-pill"
        }`}
      >
        {toast.spark ? (
          <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/20 text-brand">
            <Icon name="settings" size={13} strokeWidth={2.2} className="text-[#c46bff]" />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-bold text-white">{toast.text}</span>
          {toast.detail ? (
            <span className="mt-0.5 block truncate text-[11px] text-white/60">{toast.detail}</span>
          ) : null}
        </span>
        {toast.action ? (
          <button
            type="button"
            onClick={act}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-ink transition-colors hover:bg-white/90"
          >
            {toast.action.label}
          </button>
        ) : (
          <Icon name="close" size={13} strokeWidth={2.4} className="shrink-0 text-white/45" />
        )}
      </div>
    </div>
  );
}

/** Fires the phone's haptics where the platform has any, and stays quiet where it has none. */
export function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Haptics are a nicety; a browser that refuses them is not an error.
  }
}
