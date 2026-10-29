/** Hand-rolled SVG chart primitives: no chart dependency in this repo. */
import type { SeriesPoint } from "../api";

/** Purple ramp, reused by every chart so a category keeps its colour. */
export const RAMP = ["#9400d3", "#b04ae0", "#cf8bef", "#e5bff7", "#f2e3fb"];

interface AreaChartProps {
  points: SeriesPoint[];
  valueKey?: "value" | "posts";
  height?: number;
}

/** 30-day trend with a soft brand gradient underneath. */
export function AreaChart({ points, valueKey = "value", height = 180 }: AreaChartProps) {
  if (!points.length) return <EmptyChart label="No activity recorded yet" />;
  const values = points.map((point) => point[valueKey] ?? point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const width = 300;
  const plotHeight = 100;
  const x = (index: number) => (index / Math.max(1, points.length - 1)) * width;
  const y = (value: number) => plotHeight - ((value - min) / span) * (plotHeight - 8) - 4;

  const line = values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(value).toFixed(2)}`).join(" ");
  const area = `${line} L${width},${plotHeight} L0,${plotHeight} Z`;
  const gradientId = `area-${valueKey}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${plotHeight}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        role="img"
        aria-label={`Trend from ${values[0]} to ${values[values.length - 1]}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9400d3" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#9400d3" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#9400d3" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-faint">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

interface DonutProps {
  segments: { label: string; value: number }[];
  size?: number;
}

/** Report-reason split: five slices maximum, everything else folds into Other. */
export function Donut({ segments, size = 148 }: DonutProps) {
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const visible = sorted.slice(0, 5);
  const rest = sorted.slice(5).reduce((sum, segment) => sum + segment.value, 0);
  const slices = rest > 0 ? [...visible, { label: "Other", value: rest }] : visible;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) return <EmptyChart label="Nothing to break down yet" />;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label="Breakdown by report reason">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f2f4" strokeWidth="16" />
        {slices.map((slice, index) => {
          const fraction = slice.value / total;
          const dash = fraction * circumference;
          const element = (
            <circle
              key={slice.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={RAMP[index % RAMP.length]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += dash;
          return element;
        })}
        <text x="70" y="66" textAnchor="middle" className="fill-ink" style={{ font: "700 22px var(--font-display)" }}>
          {total}
        </text>
        <text x="70" y="86" textAnchor="middle" className="fill-faint" style={{ font: "500 11px var(--font-sans)" }}>
          total
        </text>
      </svg>
      <ul className="min-w-[180px] flex-1 space-y-2">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: RAMP[index % RAMP.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted">{slice.label}</span>
            <span className="tnum font-medium">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface BarListProps {
  points: SeriesPoint[];
  valueKey?: "value" | "posts";
}

/** Horizontal bars for category / region / status comparisons. */
export function BarList({ points, valueKey = "value" }: BarListProps) {
  if (!points.length) return <EmptyChart label="Nothing recorded yet" />;
  const values = points.map((point) => point[valueKey] ?? point.value);
  const max = Math.max(...values, 1);
  return (
    <ul className="space-y-3">
      {points.map((point, index) => {
        const value = point[valueKey] ?? point.value;
        return (
          <li key={point.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-[13px] text-muted" title={point.label}>
              {point.label}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f1f2f4]">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(4, (value / max) * 100)}%`,
                  background: RAMP[index % RAMP.length],
                }}
              />
            </span>
            <span className="tnum w-14 text-right text-[13px] font-medium">{value.toLocaleString("en-US")}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Small inline trend used inside KPI cards. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 28 - ((value - min) / span) * 24 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" style={{ width: 72, height: 24 }} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="#b04ae0"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-line text-[13px] text-faint">
      {label}
    </div>
  );
}
