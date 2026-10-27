import { Sheet } from "./Sheet";

type ConfirmSheetProps = {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmSheet({ title, body, confirmLabel, onConfirm, onClose }: ConfirmSheetProps) {
  return (
    <Sheet labelledBy="confirm-title" onClose={onClose}>
      <h2
        id="confirm-title"
        className="font-display text-[21px] font-extrabold leading-tight tracking-[-0.04em]"
      >
        {title}
      </h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{body}</p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="h-11 flex-1 rounded-xl bg-ink text-[13px] font-semibold text-white transition-colors hover:bg-[#22252a]"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-line px-4 text-[13px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
