import { useState } from "react";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

export type ReportMode = "post" | "ad";

const POST_REASONS = [
  "Spam or a scam",
  "Harassment or bullying",
  "Hate speech",
  "Nudity or sexual content",
  "Violence or gore",
  "Cheating, hacks or exploits",
  "Copyright or stolen work",
  "Something else",
];

const AD_REASONS = [
  "Misleading or a scam",
  "Repeats the same ad",
  "Offensive content",
  "Illegal or restricted product",
  "Not interested in this",
  "Something else",
];

type ReportSheetProps = {
  mode: ReportMode;
  /** Post title, so the copy can name what is being reported. */
  title: string;
  spar?: string;
  alreadyReported?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

/**
 * Report flow for a post, and the separate ad flow that only sponsored posts
 * can reach.
 */
export function ReportSheet({
  mode,
  title,
  spar,
  alreadyReported = false,
  onClose,
  onSubmit,
}: ReportSheetProps) {
  const reasons = mode === "ad" ? AD_REASONS : POST_REASONS;
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);

  const heading = mode === "ad" ? "Report this ad" : "Report this post";

  if (done) {
    return (
      <Sheet labelledBy="report-title" onClose={onClose}>
        <div role="status" className="py-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
            <Icon name="check" size={26} strokeWidth={2.3} />
          </span>
          <h2 id="report-title" className="mt-4 font-display text-[22px] font-extrabold tracking-[-0.04em]">
            Thanks — reported.
          </h2>
          <p className="mx-auto mt-2 max-w-[38ch] text-[12.5px] leading-relaxed text-muted">
            {mode === "ad"
              ? "We use ad reports to pull bad ads and to show you fewer like them."
              : "Your report is logged against this post for review."}{" "}
            Nobody is told who reported it.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-11 w-full rounded-xl bg-ink text-[13px] font-semibold text-white transition-colors hover:bg-[#22252a]"
          >
            Done
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet labelledBy="report-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            {mode === "ad" ? "Report ad" : "Report post"}
          </p>
          <h2
            id="report-title"
            className="mt-1.5 font-display text-[23px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            {heading}
          </h2>
          <p className="mt-1.5 truncate text-[12px] text-muted">
            {spar ? `${spar} · ` : ""}
            {title}
          </p>
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

      {alreadyReported ? (
        <p className="mt-4 rounded-xl bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand-deep">
          You already reported this {mode === "ad" ? "ad" : "post"}. Sending another report replaces it.
        </p>
      ) : null}

      <fieldset className="mt-5">
        <legend className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
          What's wrong with it?
        </legend>
        <div className="mt-2.5 flex flex-col">
          {reasons.map((item) => {
            const selected = reason === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setReason(item)}
                className={`flex items-center gap-3 border-b border-line py-3 text-left text-[13px] transition-colors last:border-b-0 ${
                  selected ? "font-semibold text-ink" : "text-[#4d535c]"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                    selected ? "border-brand bg-brand text-white" : "border-[#d8dce1]"
                  }`}
                >
                  {selected ? <Icon name="check" size={12} strokeWidth={2.8} /> : null}
                </span>
                {item}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label
        htmlFor="report-detail"
        className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
      >
        Anything else? (optional)
      </label>
      <textarea
        id="report-detail"
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        maxLength={400}
        rows={3}
        placeholder="Add context for the reviewer"
        className="mt-2 w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10"
      />

      <button
        type="button"
        disabled={!reason}
        onClick={() => {
          if (!reason) return;
          onSubmit(reason);
          setDone(true);
        }}
        className="mt-5 h-12 w-full rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c6e6]"
      >
        {mode === "ad" ? "Submit ad report" : "Submit report"}
      </button>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-faint">
        Reports are stored in this browser for the demo; a live build sends them to moderation.
      </p>
    </Sheet>
  );
}
