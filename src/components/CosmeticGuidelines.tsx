import {
  COSMETIC_ACCEPTANCE,
  COSMETIC_GUIDELINES,
  COSMETIC_STATES,
  type CosmeticGuideline,
} from "../data/cosmetics";
import { Icon } from "./Icon";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-2 border-t border-line/70 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-faint">{label}</dt>
      <dd className="text-[11px] leading-relaxed text-[#4d535c]">{value}</dd>
    </div>
  );
}

function GuidelineCard({ guideline, open }: { guideline: CosmeticGuideline; open: boolean }) {
  return (
    <details
      open={open}
      className="group rounded-2xl border border-line bg-white open:shadow-[0_12px_34px_rgba(23,25,29,0.07)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="shop" size={16} strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand">
            {guideline.eyebrow}
          </span>
          <span className="mt-0.5 block truncate font-display text-[14px] font-extrabold tracking-[-0.02em]">
            {guideline.title}
          </span>
        </span>
        <Icon
          name="back"
          size={14}
          className="shrink-0 text-faint transition-transform group-open:-rotate-90"
        />
      </summary>

      <div className="px-4 pb-4">
        <p className="text-[11.5px] leading-relaxed text-muted">{guideline.blurb}</p>

        <dl className="mt-3 rounded-xl bg-surface px-3 py-2.5">
          <SpecRow label="Canvas" value={guideline.canvas} />
          <SpecRow label="Safe area" value={guideline.safeArea} />
          <SpecRow label="Formats" value={guideline.formats} />
          <SpecRow label="Size" value={guideline.fileSize} />
          <SpecRow label="Motion" value={guideline.duration} />
        </dl>

        <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
          Rules
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {guideline.rules.map((rule) => (
            <li key={rule} className="flex gap-2 text-[11px] leading-relaxed text-[#3d424a]">
              <span aria-hidden="true" className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-brand" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/**
 * The creator-facing rulebook. It is shown in the shop so a player can read the
 * rules before applying for Creator access, and Creator Studio links here from
 * the product builder.
 */
export function CosmeticGuidelines({ onOpenCreator }: { onOpenCreator?: () => void }) {
  return (
    <div className="mx-auto max-w-[1000px]">
      <section className="overflow-hidden rounded-3xl bg-[#17191d] px-5 py-5 text-white sm:px-7 sm:py-7">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-[#d8b4fe]">
          SnagChat cosmetic standard
        </p>
        <h1 className="mt-2 max-w-[24ch] font-display text-[25px] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[33px]">
          Expressive when experienced.{" "}
          <span className="text-[#d8b4fe]">Invisible when it interferes.</span>
        </h1>
        <p className="mt-2.5 max-w-[68ch] text-[12px] leading-relaxed text-white/65 sm:text-[13px]">
          Every cosmetic enhances a profile, post or chat without hiding the content underneath. Read the
          canvas, safe area and file limits for your category before you upload. A cosmetic that covers text,
          leaves its border or keeps moving is rejected.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Content first", "Idle is static", "One play per interaction", "Finite motion", "Clipped to its surface"].map(
            (principle) => (
              <span
                key={principle}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/75"
              >
                {principle}
              </span>
            ),
          )}
        </div>
        {onOpenCreator ? (
          <button
            type="button"
            onClick={onOpenCreator}
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[11.5px] font-bold text-ink transition-colors hover:bg-white/90"
          >
            <Icon name="plus" size={14} strokeWidth={2.2} />
            Apply to become a creator
          </button>
        ) : null}
      </section>

      <section aria-labelledby="category-rules" className="mt-7">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">Category rules</p>
        <h2
          id="category-rules"
          className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.035em]"
        >
          Every surface, one standard.
        </h2>
        <p className="mt-1.5 max-w-[70ch] text-[11.5px] leading-relaxed text-muted">
          Open a category for its canvas, safe area, formats and hard limits. Sizes are measured on the source
          file before compression.
        </p>

        <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
          {COSMETIC_GUIDELINES.map((guideline, index) => (
            <GuidelineCard key={guideline.id} guideline={guideline} open={index === 0} />
          ))}
        </div>
      </section>

      <section aria-labelledby="state-standard" className="mt-8">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Behaviour & rendering
        </p>
        <h2 id="state-standard" className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.035em]">
          The five states of an effect.
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {COSMETIC_STATES.map((state, index) => (
            <div key={state.id} className="rounded-2xl border border-line bg-white p-3">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-faint">
                0{index + 1}
              </span>
              <p className="mt-1 text-[12px] font-bold text-ink">{state.label}</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{state.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="acceptance" className="mt-8">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Release checklist
        </p>
        <h2 id="acceptance" className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.035em]">
          A cosmetic ships only when all of these are true.
        </h2>
        <ul className="mt-3 grid gap-1.5 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
          {COSMETIC_ACCEPTANCE.map((item) => (
            <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-[#3d424a]">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon name="check" size={9} strokeWidth={3.2} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-5 rounded-2xl border border-line bg-[#fbfbfc] px-4 py-3 text-[10.5px] leading-relaxed text-muted">
        GIFs, stickers and memes in SnagChat come from KLIPY. The picker must keep the “Search KLIPY”
        placeholder and the “Powered by KLIPY” credit; those are part of the API terms, not optional polish.
        Creator-made borders, fonts and effects are separate products and are reviewed against this page.
      </p>
    </div>
  );
}
