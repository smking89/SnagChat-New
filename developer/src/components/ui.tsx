import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "brand" | "danger";
type Size = "sm" | "md";

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra?: string) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
  const sizes: Record<Size, string> = {
    sm: "h-8 px-2.5 text-[12px]",
    md: "h-9 px-3.5 text-[12.5px]",
  };
  const variants: Record<Variant, string> = {
    primary: "border border-ink bg-ink text-white hover:border-[#2b3038] hover:bg-[#2b3038]",
    secondary: "border border-line bg-white text-ink-soft hover:border-line-strong hover:bg-surface",
    ghost: "text-ink-soft hover:bg-surface",
    brand: "border border-brand bg-brand text-white hover:border-brand-deep hover:bg-brand-deep",
    danger: "border border-danger/20 bg-danger-soft text-danger hover:bg-danger/10",
  };
  return cn(base, sizes[size], variants[variant], extra);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type PillTone = "neutral" | "brand" | "success" | "warn" | "danger" | "test" | "live";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "border-line bg-white text-muted",
  brand: "border-brand/15 bg-brand-soft text-brand-deep",
  success: "border-success/15 bg-success-soft text-success",
  warn: "border-warn/20 bg-warn-soft text-warn",
  danger: "border-danger/15 bg-danger-soft text-danger",
  test: "border-warn/25 bg-warn-soft text-warn",
  live: "border-brand/20 bg-brand-soft text-brand-deep",
};

export function Pill({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10.5px] font-semibold leading-none",
        PILL_TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={cn("rounded-xl border border-line bg-white", className)}>{children}</Tag>;
}

export function PanelHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div>
        <h3 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h3>
        {hint ? <p className="mt-0.5 text-[11.5px] text-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

const METHOD_TONES: Record<string, string> = {
  GET: "bg-success-soft text-success",
  POST: "bg-brand-soft text-brand-deep",
  DELETE: "bg-danger-soft text-danger",
  PATCH: "bg-warn-soft text-warn",
};

export function MethodChip({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[42px] shrink-0 items-center justify-center rounded-[5px] font-mono text-[10px] font-bold tracking-[0.02em]",
        METHOD_TONES[method] ?? "bg-surface text-ink-soft",
      )}
    >
      {method}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1 py-[1px] font-sans text-[10px] font-semibold text-muted">
      {children}
    </kbd>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11.5px] text-ink-soft">
      {children}
    </code>
  );
}

export function StatusDot({ tone = "success" }: { tone?: "success" | "danger" | "warn" }) {
  const color = tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-warn" : "bg-success";
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color)} />;
}

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(max - min, 1);
  const step = 100 / (points.length - 1);
  const coords = points.map((value, index) => {
    const x = index * step;
    const y = 30 - ((value - min) / span) * 26;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,32 ${line} 100,32`;

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-10 w-full", className)}
    >
      <polygon points={area} fill="rgba(148,0,211,0.08)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Stat({
  label,
  value,
  delta,
  hint,
  spark,
}: {
  label: string;
  value: string;
  delta?: { value: string; good?: boolean };
  hint?: string;
  spark?: number[];
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="num font-display text-[22px] font-extrabold leading-none tracking-[-0.03em]">
          {value}
        </p>
        {delta ? (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center rounded-full px-1.5 py-[2px] text-[10px] font-bold",
              delta.good === false ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      {spark ? <Sparkline points={spark} className="mt-2 h-7" /> : null}
      {hint ? <p className="mt-1 text-[10.5px] text-faint">{hint}</p> : null}
    </div>
  );
}
