import { useRef, type ReactNode } from "react";
import { useOverlay } from "../lib/overlay";

type SheetProps = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ labelledBy, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(panelRef, onClose);

  return (
    <div
      className="sheet-scrim fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onPointerDown={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
        className="sheet-panel relative max-h-[93vh] w-full max-w-[520px] overflow-y-auto rounded-t-[26px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_60px_rgba(23,25,29,0.22)] outline-none sm:rounded-[26px] sm:p-6 sm:shadow-[0_24px_80px_rgba(23,25,29,0.24)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
