import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../../components/Icon";
import { TopBar } from "../../components/TopBar";
import { cn } from "../../components/ui";
import { usePortal } from "../../lib/portal";
import { Link } from "../../lib/router";

type Item = {
  id: string;
  label: string;
  icon: IconName;
  to: string;
};

const APP = "/console/apps/night-shift-ingest";

const GROUPS: Array<{ label?: string; items: Item[] }> = [
  { items: [{ id: "overview", label: "Overview", icon: "grid", to: "/console" }] },
  {
    label: "Build",
    items: [
      { id: "applications", label: "Applications", icon: "box", to: "/console/applications" },
      { id: "keys", label: "Keys", icon: "key", to: `${APP}/keys` },
      { id: "oauth", label: "OAuth", icon: "lock", to: `${APP}/oauth` },
      { id: "webhooks", label: "Webhooks", icon: "webhook", to: `${APP}/webhooks` },
      { id: "sandbox", label: "Sandbox", icon: "terminal", to: "/console/sandbox" },
    ],
  },
  {
    label: "Domain",
    items: [
      { id: "catalogue", label: "Catalogue", icon: "gamepad", to: "/console/catalogue" },
      { id: "inspector", label: "Inspector", icon: "activity", to: "/console/inspector" },
      { id: "embeds", label: "Embeds", icon: "code", to: "/console/embeds" },
    ],
  },
  {
    label: "Observe",
    items: [
      { id: "logs", label: "Logs", icon: "terminal", to: `${APP}/logs` },
      { id: "usage", label: "Usage", icon: "chart", to: "/console/usage" },
      { id: "alerts", label: "Alerts", icon: "alert", to: "/console/alerts" },
    ],
  },
  {
    label: "Organisation",
    items: [
      { id: "team", label: "Team", icon: "users", to: "/console/team" },
      { id: "audit", label: "Audit log", icon: "shield", to: "/console/audit" },
      { id: "billing", label: "Billing", icon: "layers", to: "/console/billing" },
      { id: "settings", label: "Settings", icon: "settings", to: "/console/settings" },
    ],
  },
];

const MOBILE_ITEMS = [
  { id: "overview", label: "Overview", to: "/console" },
  { id: "keys", label: "Keys", to: "/console/apps/night-shift-ingest/keys" },
  { id: "webhooks", label: "Webhooks", to: "/console/apps/night-shift-ingest/webhooks" },
  { id: "logs", label: "Logs", to: "/console/apps/night-shift-ingest/logs" },
];

export function ConsoleLayout({
  active,
  onSearch,
  children,
}: {
  active: string;
  onSearch: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-2">
      <TopBar variant="console" onSearch={onSearch} />
      <div className="shell flex">
        <aside className="hidden w-[228px] shrink-0 border-r border-line lg:block">
          <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col">
            <div className="px-1 pb-1 pt-4">
              <Link
                to="/console/settings"
                aria-label="Organisation settings"
                className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-white px-2 py-1.5 text-left transition-colors hover:border-line-strong"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-[linear-gradient(135deg,#9400d3,#5b21b6)] text-[10px] font-extrabold text-white">
                  NS
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-semibold leading-tight">
                    Night Shift Studio
                  </span>
                  <span className="block truncate text-[9.5px] text-faint">Scale · 2 apps</span>
                </span>
                <Icon name="settings" size={12} className="shrink-0 text-faint" />
              </Link>
            </div>

            <nav className="scroll-thin flex-1 overflow-y-auto pb-4 pt-2" aria-label="Console">
              {GROUPS.map((group, index) => (
                <div key={group.label ?? `group-${index}`} className={index === 0 ? "" : "mt-3"}>
                  {group.label ? (
                    <p className="px-2.5 pb-1 pt-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-faint">
                      {group.label}
                    </p>
                  ) : null}
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={item.to}
                          aria-current={active === item.id ? "page" : undefined}
                          className={cn(
                            "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[12px] transition-colors",
                            active === item.id
                              ? "bg-surface font-semibold text-ink"
                              : "text-muted hover:bg-surface hover:text-ink",
                          )}
                        >
                          {active === item.id ? (
                            <span className="absolute -left-px top-2 h-4 w-[2px] rounded-full bg-brand" />
                          ) : null}
                          <Icon
                            name={item.icon}
                            size={15}
                            className={active === item.id ? "text-brand" : "text-faint"}
                          />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <EnvSwitcher />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-16 lg:pl-7">
          <div className="scroll-thin -mx-5 flex gap-1 overflow-x-auto border-b border-line px-5 py-2 sm:-mx-8 sm:px-8 lg:hidden">
            {MOBILE_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
                  active === item.id
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function EnvSwitcher() {
  const { env, setEnv, toast } = usePortal();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (next: "test" | "live") => {
    setEnv(next);
    setOpen(false);
    toast(
      next === "test" ? "Test mode" : "Live mode",
      next === "test"
        ? "Requests now hit sandbox data."
        : "Live keys require re-authentication before they are revealed.",
    );
  };

  return (
    <div ref={wrap} className="relative shrink-0 border-t border-line px-1 py-3">
      <p className="px-1.5 pb-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-faint">
        Environment
      </p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left transition-colors",
          env === "test" ? "border-warn/30" : "border-brand/25",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            env === "test" ? "bg-warn" : "bg-brand",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold leading-tight">
            {env === "test" ? "Test mode" : "Live mode"}
          </span>
          <span className="block truncate font-mono text-[9px] text-faint">api.snagchat.io</span>
        </span>
        <Icon name="chevronDown" size={12} className="shrink-0 text-faint" />
      </button>

      {open ? (
        <div className="animate-panel absolute bottom-[calc(100%-4px)] left-1 right-1 z-30 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-lift">
          {(["test", "live"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface"
            >
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  option === "test" ? "bg-warn" : "bg-brand",
                )}
              />
              <span>
                <span className="block text-[11.5px] font-semibold">
                  {option === "test" ? "Test" : "Live"}
                </span>
                <span className="block text-[10px] leading-snug text-muted">
                  {option === "test" ? "Sandbox data, sk_test_ keys" : "Real posts, re-auth required"}
                </span>
              </span>
              {env === option ? <Icon name="check" size={12} className="ml-auto mt-1 text-brand" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function EnvNotice() {
  const { env, setEnv, toast } = usePortal();
  if (env === "live") return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-warn/20 bg-warn-soft/60 px-3.5 py-2.5">
      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
      <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-warn">
        <span className="font-semibold">Test mode.</span> Requests hit sandbox data. Live keys need
        re-authentication before they can be revealed.
      </p>
      <button
        type="button"
        onClick={() => {
          setEnv("live");
          toast("Live mode", "Live keys require re-authentication.");
        }}
        className="text-[11px] font-semibold text-warn underline decoration-warn/30 underline-offset-2 hover:decoration-warn"
      >
        Switch to live
      </button>
    </div>
  );
}
