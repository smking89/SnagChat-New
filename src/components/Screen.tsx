import { useRef, type ReactNode } from "react";
import { useOverlay } from "../lib/overlay";

type ScreenProps = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Full-screen surface for profiles and messages. Sits below sheets so a snag
 * can still be shared over an open profile.
 */
export function Screen({ labelledBy, onClose, children }: ScreenProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(panelRef, onClose);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      className="screen-panel fixed inset-0 z-40 flex flex-col overflow-hidden bg-white outline-none"
    >
      {children}
    </div>
  );
}

export function ScreenHeader({
  title,
  titleId,
  onBack,
  action,
}: {
  title: ReactNode;
  titleId?: string;
  onBack: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white/95 px-3 backdrop-blur-xl">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14.5 5.5 8 12l6.5 6.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <h2
        id={titleId}
        className="min-w-0 flex-1 truncate font-display text-[15px] font-extrabold tracking-[-0.02em]"
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
