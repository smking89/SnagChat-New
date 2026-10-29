import type { ReactNode } from "react";
import { cn } from "./ui";

/** Shared header for every console page outside the app detail screen. */
export function PageHead({
  section,
  title,
  description,
  children,
}: {
  section: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10.5px] text-faint">{section}</p>
        <h1 className="mt-1.5 font-display text-[23px] font-extrabold leading-none tracking-[-0.035em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[72ch] text-[11.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Meter({
  label,
  value,
  limit,
  note,
  tone = "brand",
}: {
  label: string;
  value: number;
  limit: number;
  note?: string;
  tone?: "brand" | "warn" | "danger" | "success";
}) {
  const pct = Math.min(100, Math.round((value / limit) * 100));
  const fill =
    tone === "danger"
      ? "bg-danger"
      : tone === "warn"
        ? "bg-warn"
        : tone === "success"
          ? "bg-success"
          : "bg-brand";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11.5px] font-medium text-ink-soft">{label}</p>
        <p className="num font-mono text-[10.5px] text-muted">
          {value.toLocaleString("en-US")} / {limit.toLocaleString("en-US")}
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
        <span
          className={cn("block h-full rounded-full", fill)}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="mt-1 text-[10.5px] text-faint">
        {pct}% used{note ? ` · ${note}` : ""}
      </p>
    </div>
  );
}

export function FauxToggle({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
        on ? "border-brand/30 bg-brand" : "border-line-strong bg-surface",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}
