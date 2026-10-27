import type { LegalDoc } from "../data/legal";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type LegalSheetProps = {
  doc: LegalDoc;
  onClose: () => void;
};

export function LegalSheet({ doc, onClose }: LegalSheetProps) {
  return (
    <Sheet labelledBy="legal-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">SnagChat legal</p>
          <h2
            id="legal-title"
            className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            {doc.title}
          </h2>
          <p className="mt-1 text-[10.5px] font-medium text-faint">Last updated {doc.updated}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c] transition-colors hover:bg-line"
        >
          <Icon name="close" size={17} />
        </button>
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed text-[#4d535c]">{doc.intro}</p>

      <div className="mt-4 space-y-4">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
              {section.heading}
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 h-11 w-full rounded-xl bg-ink text-[13px] font-semibold text-white transition-colors hover:bg-[#22252a]"
      >
        Close
      </button>
    </Sheet>
  );
}
