import { useEffect } from "react";
import { Icon } from "./Icon";

type ImageViewerProps = {
  src: string;
  label: string;
  /** Optional line under the image, e.g. who it belongs to. */
  caption?: string;
  onClose: () => void;
};

/** Full-screen view of a profile photo, banner or snag. */
export function ImageViewer({ src, label, caption, onClose }: ImageViewerProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-[#080a0e]/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} preview`}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
        <p className="min-w-0 truncate text-[12.5px] font-semibold text-white">{label}</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close preview"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        >
          <Icon name="close" size={18} strokeWidth={2.2} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 place-items-center">
        <img
          src={src}
          alt={label}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          draggable={false}
        />
      </div>

      {caption ? <p className="shrink-0 pt-3 text-center text-[11.5px] text-white/70">{caption}</p> : null}
    </div>
  );
}
