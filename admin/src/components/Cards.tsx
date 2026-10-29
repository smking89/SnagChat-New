/** Shared card primitives for the three role landings. */
import type { ReactNode } from "react";
import type { AttentionItem, Kpi, Queues } from "../api";
import { compact, percent, toneClasses, type Tone } from "../format";
import { Sparkline } from "./Charts";

export function Panel({
  title,
  meta,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-card ${className}`}>
      <header className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4">
        <h2 className="font-display text-[15px] font-semibold">{title}</h2>
        {meta ? <span className="text-[12px] text-faint">{meta}</span> : null}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatCard({ kpi }: { kpi: Kpi }) {
  const up = kpi.delta > 0;
  const flat = kpi.delta === 0;
  return (
    <article className="rounded-xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">{kpi.label}</p>
        {kpi.spark.length > 1 ? <Sparkline values={kpi.spark} /> : null}
      </div>
      <p className="tnum mt-3 font-display text-[28px] leading-none font-bold">{compact(kpi.value)}</p>
      <div className="mt-3 h-5">
        {flat ? null : (
          <span className="text-[12px] text-muted">
            <Chip tone={up ? "success" : "danger"}>{percent(kpi.delta)}</Chip>{" "}
            <span className="ml-1">vs previous period</span>
          </span>
        )}
      </div>
    </article>
  );
}

const KIND_DOT: Record<AttentionItem["kind"], string> = {
  report: "#9400d3",
  verification: "#2563eb",
  campaign: "#d97706",
  creator: "#16a34a",
  payout: "#dc2626",
};

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const pending = items.filter((item) => item.count > 0);
  if (!pending.length) {
    return <p className="py-2 text-[13px] text-muted">Nothing needs attention right now.</p>;
  }
  return (
    <ul>
      {pending.map((item) => (
        <li key={item.label} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
          <span className="size-2 shrink-0 rounded-full" style={{ background: KIND_DOT[item.kind] }} />
          <span className="min-w-0 flex-1 truncate text-[13px]">{item.label}</span>
          <span className="tnum text-[13px] font-semibold">{item.count}</span>
          <span className="text-faint" aria-hidden="true">
            →
          </span>
        </li>
      ))}
    </ul>
  );
}

export function QueueStrip({ queues }: { queues: Queues }) {
  const tiles: { label: string; value: number; tone: Tone }[] = [
    { label: "Open", value: queues.open, tone: "neutral" },
    { label: "In progress", value: queues.claimed, tone: "info" },
    { label: "Escalated", value: queues.escalated, tone: "warning" },
    { label: "Past SLA", value: queues.slaBreached, tone: "danger" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg border border-line bg-card p-4">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">{tile.label}</p>
          <p className="tnum mt-1.5 font-display text-[22px] font-bold">{tile.value}</p>
          <div className="mt-1">
            <span
              className="inline-block h-1 w-8 rounded-full"
              style={{
                background:
                  tile.tone === "danger"
                    ? "#dc2626"
                    : tile.tone === "warning"
                      ? "#d97706"
                      : tile.tone === "info"
                        ? "#2563eb"
                        : "#d5d8dd",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-9 animate-pulse rounded-md bg-[#f1f2f4]" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-[#fdeceb] p-6">
      <p className="text-[13px] font-semibold text-danger">Could not load this view</p>
      <p className="mt-1 text-[13px] text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-danger/30 bg-card px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-white"
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card px-6 py-10 text-center">
      <p className="font-display text-[15px] font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">{hint}</p>
    </div>
  );
}
