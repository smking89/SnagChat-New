/** Display helpers shared by the three role landings. */

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function compact(value: number): string {
  if (Math.abs(value) < 1000) return String(value);
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}k`;
}

export function fullNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function percent(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

export function relative(epoch: number, reference = nowSeconds()): string {
  const seconds = Math.max(0, reference - epoch);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function dateTime(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/** How long a report has left (or been over) its SLA window. */
export function slaText(
  dueAt: number,
  resolved: boolean,
  reference = nowSeconds(),
): { label: string; tone: Tone } {
  if (resolved) return { label: "Met", tone: "success" };
  const deltaSeconds = dueAt - reference;
  const absMinutes = Math.floor(Math.abs(deltaSeconds) / 60);
  const human =
    absMinutes < 60
      ? `${absMinutes}m`
      : absMinutes < 1440
        ? `${Math.floor(absMinutes / 60)}h ${absMinutes % 60}m`
        : `${Math.floor(absMinutes / 1440)}d`;
  if (deltaSeconds < 0) return { label: `Breached ${human} ago`, tone: "danger" };
  if (deltaSeconds < 3600) return { label: `${human} left`, tone: "warning" };
  return { label: `${human} left`, tone: "neutral" };
}

export const severityTone: Record<string, Tone> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

export const statusTone: Record<string, Tone> = {
  open: "neutral",
  claimed: "info",
  escalated: "warning",
  resolved: "success",
};

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-[#f1f2f4] text-[#5c626b] ring-[#e3e5e9]",
  success: "bg-[#e9f7ef] text-success ring-[#c9ecd7]",
  warning: "bg-[#fdf2e3] text-warning ring-[#f7e2c2]",
  danger: "bg-[#fdeceb] text-danger ring-[#f7d4d1]",
  info: "bg-[#eaf1fd] text-info ring-[#cfe0fa]",
};
