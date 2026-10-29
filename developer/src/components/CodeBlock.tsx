import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "./ui";

type CodeTab = { label: string; code: string };

export function CodeBlock({
  code,
  tabs,
  filename,
  className,
  copyable = true,
  tone = "dark",
}: {
  code?: string;
  tabs?: CodeTab[];
  filename?: string;
  className?: string;
  copyable?: boolean;
  tone?: "dark" | "plain";
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const list = tabs ?? (code ? [{ label: "Code", code }] : []);
  const current = list[Math.min(active, list.length - 1)]?.code ?? "";
  const showTabs = Boolean(tabs && tabs.length > 1);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (tone === "plain") {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-line bg-surface-2", className)}>
        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
            {filename ?? "Payload"}
          </span>
          {copyable ? (
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10.5px] font-semibold text-muted transition-colors hover:text-ink"
            >
              <Icon name={copied ? "check" : "copy"} size={12} />
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
        </div>
        <pre className="scroll-thin overflow-x-auto px-3 py-2.5 font-mono text-[12px] leading-[1.7] text-ink-soft">
          {current}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-code-line bg-code text-[#e7e9ee]",
        className,
      )}
    >
      <div className="flex items-stretch justify-between gap-2 border-b border-white/8 bg-[#121418] pr-2">
        <div className="flex min-w-0 items-stretch overflow-x-auto">
          {showTabs ? (
            list.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative shrink-0 px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors",
                  index === active ? "text-white" : "text-white/40 hover:text-white/70",
                )}
              >
                {tab.label}
                {index === active ? (
                  <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-brand" />
                ) : null}
              </button>
            ))
          ) : (
            <span className="px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/40">
              {filename ?? "Code"}
            </span>
          )}
        </div>
        {copyable ? (
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
            className="my-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-semibold text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name={copied ? "check" : "copy"} size={13} />
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
        ) : null}
      </div>
      <pre className="scroll-thin overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-[1.8]">
        {current}
      </pre>
    </div>
  );
}
