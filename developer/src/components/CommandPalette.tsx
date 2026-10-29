import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ENDPOINTS_API } from "../data/portal";
import { useRouter } from "../lib/router";
import { Icon } from "./Icon";
import { Kbd, MethodChip, cn } from "./ui";

type Item = { label: string; hint: string; to: string; method?: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const timer = window.setTimeout(() => input.current?.focus(), 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages: Item[] = [
      { label: "Overview", hint: "Console", to: "/console" },
      { label: "Applications", hint: "Console", to: "/console/applications" },
      { label: "App keys", hint: "Night Shift Ingest", to: "/console/apps/night-shift-ingest/keys" },
      { label: "OAuth clients", hint: "Night Shift Ingest", to: "/console/apps/night-shift-ingest/oauth" },
      { label: "Webhook deliveries", hint: "Night Shift Ingest", to: "/console/apps/night-shift-ingest/webhooks" },
      { label: "Request logs", hint: "Night Shift Ingest", to: "/console/apps/night-shift-ingest/logs" },
      { label: "Sandbox", hint: "Fixtures and test data", to: "/console/sandbox" },
      { label: "Game catalogue", hint: "Claim a title", to: "/console/catalogue" },
      { label: "Feed inspector", hint: "Ranking trace", to: "/console/inspector" },
      { label: "Embeds", hint: "Embed builder", to: "/console/embeds" },
      { label: "Usage", hint: "Limits and overage", to: "/console/usage" },
      { label: "Alerts", hint: "Rules and incidents", to: "/console/alerts" },
      { label: "Team", hint: "Members and roles", to: "/console/team" },
      { label: "Audit log", hint: "Organisation", to: "/console/audit" },
      { label: "Billing", hint: "Plan and invoices", to: "/console/billing" },
      { label: "Settings", hint: "Organisation", to: "/console/settings" },
      { label: "Quickstart", hint: "Docs", to: "/docs/quickstart" },
      { label: "API reference", hint: "REST v1", to: "/docs/api/create-snag" },
      { label: "Status", hint: "Uptime and incidents", to: "/status" },
      { label: "Changelog", hint: "What changed", to: "/changelog" },
      { label: "Developer landing", hint: "Marketing", to: "/" },
    ];
    const endpoints: Item[] = ENDPOINTS_API.map((endpoint) => ({
      label: endpoint.path,
      hint: endpoint.summary,
      to: `/docs/api/${endpoint.slug}`,
      method: endpoint.method,
    }));
    const match = (item: Item) =>
      `${item.label} ${item.hint}`.toLowerCase().includes(q) || q === "";
    return [
      { title: "Pages", items: pages.filter(match) },
      { title: "Endpoints", items: endpoints.filter(match) },
    ].filter((group) => group.items.length > 0);
  }, [query]);

  const flat = groups.flatMap((group) => group.items);

  if (!open) return null;

  const choose = (item: Item) => {
    onClose();
    navigate(item.to);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 sm:p-6">
      <div className="animate-fade absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the portal"
        className="animate-panel relative mt-[6vh] w-full max-w-[600px] overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Icon name="search" size={16} className="shrink-0 text-faint" />
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, flat.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const item = flat[active];
                if (item) choose(item);
              }
            }}
            placeholder="Search docs, endpoints and your apps"
            aria-label="Search docs, endpoints and your apps"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            className="h-12 w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={onClose}
            className="hidden items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:flex"
          >
            Esc
          </button>
        </div>

        <div id="command-results" className="scroll-thin max-h-[54vh] overflow-y-auto p-2">
          {groups.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12.5px] text-muted">
              No matches. Try “webhook” or “snags”.
            </p>
          ) : null}
          {groups.map((group) => (
            <div key={group.title} className="mb-1.5">
              <p className="px-2.5 pb-1 pt-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-faint">
                {group.title}
              </p>
              {group.items.map((item) => {
                const index = flat.indexOf(item);
                return (
                  <button
                    key={`${group.title}-${item.to}`}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      index === active ? "bg-surface" : "hover:bg-surface",
                    )}
                  >
                    {item.method ? (
                      <MethodChip method={item.method} />
                    ) : (
                      <span className="grid h-[18px] w-[42px] place-items-center rounded-[5px] bg-brand-soft text-brand">
                        <Icon name="arrowRight" size={12} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold">{item.label}</span>
                      <span className="block truncate text-[11px] text-muted">{item.hint}</span>
                    </span>
                    <Icon name="arrowRight" size={13} className="text-faint" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2 text-[10.5px] text-faint">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            to move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            to open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
