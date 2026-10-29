import { useState } from "react";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Overlay";
import {
  Button,
  Panel,
  PanelHead,
  Pill,
  Sparkline,
  Stat,
  buttonClass,
  cn,
} from "../../components/ui";
import { APPS, RECENT_ERRORS, type AppRow } from "../../data/portal";
import { usePortal } from "../../lib/portal";
import { Link } from "../../lib/router";
import { ConsoleLayout, EnvNotice } from "./ConsoleLayout";

const REQUEST_SPARK = [12, 18, 15, 22, 19, 27, 24, 31, 28, 36, 33, 41, 38, 46, 44, 52];
const ERROR_SPARK = [4, 3, 5, 4, 3, 4, 2, 3, 2, 3, 2, 2, 1, 2, 1, 2];

const CHECKLIST = [
  { id: "app", label: "Create an application", detail: "Night Shift Ingest · test + live", state: "done" },
  { id: "snag", label: "Post a test snag", detail: "sng_8f21c · gate returned as allowed", state: "done" },
  {
    id: "webhook",
    label: "Add a webhook endpoint",
    detail: "Send a test event, then replay one failure",
    state: "current",
    to: "/console/apps/night-shift-ingest/webhooks",
  },
  {
    id: "rotate",
    label: "Rotate a key before launch",
    detail: "24-hour overlap, no downtime",
    state: "todo",
    to: "/console/apps/night-shift-ingest/keys",
  },
] as const;

export function Dashboard({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [apps, setApps] = useState<AppRow[]>(APPS);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("Studio / publisher");

  const create = () => {
    const clean = name.trim();
    if (clean.length < 3) return;
    setApps((current) => [
      ...current,
      {
        id: `app-${Date.now()}`,
        name: clean,
        description: `${audience.split(" ")[0]} app · test environment`,
        environments: ["test"],
        requests: "0",
        errors: "—",
        tone: "ink",
      },
    ]);
    setCreating(false);
    setName("");
    toast("Application created", `${clean} has a test environment and one key.`, "success");
  };

  return (
    <ConsoleLayout active="overview" onSearch={onSearch}>
      <EnvNotice />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Console</p>
          <h1 className="mt-1.5 font-display text-[27px] font-extrabold leading-none tracking-[-0.04em]">
            Overview
          </h1>
          <p className="mt-1.5 text-[12px] text-muted">
            Night Shift Studio · {apps.length} apps · 1 live environment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/docs/api/create-snag"
            className={buttonClass("secondary", "sm", "h-8 px-2.5")}
          >
            <Icon name="book" size={13} />
            Docs
          </Link>
          <Button variant="primary" size="sm" className="h-8 px-3" onClick={() => setCreating(true)}>
            <Icon name="plus" size={13} />
            New app
          </Button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_308px]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5">
              <div>
                <h2 className="text-[13px] font-semibold">Getting started</h2>
                <p className="mt-0.5 text-[11px] text-muted">Four steps to a post someone can see.</p>
              </div>
              <Pill tone="brand">2 of 4</Pill>
            </div>

            <div className="mt-3 px-4">
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface">
                <div className="h-full w-1/2 rounded-full bg-brand" />
              </div>
            </div>

            <ul className="mt-3 divide-y divide-line">
              {CHECKLIST.map((step) => {
                const done = step.state === "done";
                const current = step.state === "current";
                const body = (
                  <div className="flex items-start gap-3 px-4 py-2.5">
                    <span
                      className={cn(
                        "mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border",
                        done
                          ? "border-success bg-success text-white"
                          : current
                            ? "border-brand bg-white text-brand"
                            : "border-line bg-white text-faint",
                      )}
                    >
                      {done ? (
                        <Icon name="check" size={10} strokeWidth={2.6} />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[12px] font-semibold",
                          done && "text-muted",
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="block text-[11px] text-muted">{step.detail}</span>
                    </span>
                    {"to" in step && step.to ? (
                      <Icon name="arrowRight" size={13} className="mt-1 shrink-0 text-brand" />
                    ) : done ? (
                      <Icon name="check" size={13} className="mt-1 shrink-0 text-success/70" />
                    ) : null}
                  </div>
                );

                return (
                  <li key={step.id}>
                    {"to" in step && step.to ? (
                      <Link to={step.to} className="block transition-colors hover:bg-surface/60">
                        {body}
                      </Link>
                    ) : (
                      <div>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat
              label="Requests"
              value="1,284"
              delta={{ value: "+12.4%" }}
              hint="Last 24 hours"
              spark={REQUEST_SPARK}
            />
            <Stat label="Error rate" value="0.4%" delta={{ value: "−0.1" }} hint="7 of 1,284" />
            <Stat label="Webhook success" value="98.7%" delta={{ value: "+0.3" }} hint="2 endpoints" />
            <Stat label="Keys" value="4 / 10" hint="3 test · 1 live" />
          </div>

          <Panel>
            <PanelHead
              title="Applications"
              hint={`${apps.length} apps in Night Shift Studio`}
              action={
                <Link
                  to="/console/apps/night-shift-ingest/keys"
                  className="text-[11px] font-semibold text-muted hover:text-ink"
                >
                  Manage
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {apps.map((app) => {
                const content = (
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold text-white",
                        app.tone === "purple"
                          ? "bg-[linear-gradient(135deg,#9400d3,#5b21b6)]"
                          : "bg-ink",
                      )}
                    >
                      {app.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[12px] font-semibold">{app.name}</span>
                        {app.environments.map((environment) => (
                          <Pill key={environment} tone={environment === "live" ? "live" : "test"}>
                            {environment === "live" ? "Live" : "Test"}
                          </Pill>
                        ))}
                      </div>
                      <p className="truncate text-[10.5px] text-muted">{app.description}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="num text-[11.5px] font-semibold">{app.requests}</p>
                      <p className="text-[9.5px] text-faint">24h requests</p>
                    </div>
                    <div className="hidden w-[52px] text-right md:block">
                      <p className="num text-[11.5px] font-semibold">{app.errors}</p>
                      <p className="text-[9.5px] text-faint">errors</p>
                    </div>
                    <Icon name="chevronRight" size={14} className="shrink-0 text-faint" />
                  </div>
                );

                return (
                  <li key={app.id}>
                    {app.id === "night-shift-ingest" ? (
                      <Link
                        to="/console/apps/night-shift-ingest/keys"
                        className="block transition-colors hover:bg-surface/60"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          toast("That app is a shell in this preview", "Only Night Shift Ingest is wired up.")
                        }
                        className="block w-full text-left transition-colors hover:bg-surface/60"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <PanelHead
              title="Recent errors"
              hint="Grouped by code, newest first"
              action={
                <Link
                  to="/console/apps/night-shift-ingest/logs"
                  className="text-[11px] font-semibold text-muted hover:text-ink"
                >
                  Open logs
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {RECENT_ERRORS.map((error) => (
                <li key={error.code}>
                  <Link
                    to="/console/apps/night-shift-ingest/logs"
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 transition-colors hover:bg-surface/60"
                  >
                    <span className="font-mono text-[10.5px] font-semibold text-danger">
                      {error.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted">
                      {error.message}
                    </span>
                    <span className="font-mono text-[10px] text-faint">{error.snag}</span>
                    <span className="num w-[52px] text-right text-[10px] text-faint">{error.at}</span>
                    <Icon name="chevronRight" size={13} className="text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel>
            <PanelHead title="Request health" hint="Last 24 hours" action={<Pill tone="success" dot>Healthy</Pill>} />
            <div className="px-4 pt-4">
              <div className="flex items-end justify-between gap-2">
                <p className="num font-display text-[26px] font-extrabold leading-none tracking-[-0.03em]">
                  1,284
                </p>
                <span className="mb-0.5 rounded-full bg-success-soft px-1.5 py-[2px] text-[10px] font-bold text-success">
                  +12.4%
                </span>
              </div>
              <p className="mt-1 text-[10.5px] text-faint">requests · 13.4 / min average</p>
              <div className="mt-3">
                <Sparkline points={REQUEST_SPARK} className="h-14" />
              </div>
            </div>
            <div className="mt-2 space-y-2 border-t border-line px-4 py-3">
              {[
                { label: "2xx", value: "1,279", pct: 99.6, tone: "bg-success" },
                { label: "4xx", value: "4", pct: 18, tone: "bg-warn" },
                { label: "5xx", value: "1", pct: 6, tone: "bg-danger" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="w-6 font-mono text-[9.5px] text-faint">{row.label}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface">
                    <span
                      className={cn("block h-full rounded-full", row.tone)}
                      style={{ width: `${row.pct}%` }}
                    />
                  </span>
                  <span className="num w-10 text-right text-[10px] font-semibold text-ink-soft">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Error trend" hint="Last 16 hours" action={<Pill tone="neutral">0.4%</Pill>} />
            <div className="px-4 py-3">
              <Sparkline points={ERROR_SPARK} className="h-10 opacity-80" />
              <p className="mt-1 text-[10.5px] text-muted">
                One <span className="font-mono">5xx</span> at 14:01 — retried and delivered.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHead
              title="Changelog"
              hint="What changed in v1"
              action={<Icon name="arrowUpRight" size={13} className="text-faint" />}
            />
            <ul className="divide-y divide-line">
              {[
                ["Oct 24", "POST /v1/snags returns poster_frame"],
                ["Oct 18", "Webhook replays are idempotent for 10 minutes"],
                ["Oct 09", "Clip uploads accept 10-bit HEVC"],
              ].map(([date, text]) => (
                <li key={text} className="flex gap-2.5 px-4 py-2.5">
                  <span className="w-9 shrink-0 font-mono text-[9.5px] text-faint">{date}</span>
                  <span className="text-[11px] leading-snug text-ink-soft">{text}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="rounded-xl border border-line bg-brand-tint p-4">
            <div className="flex items-center gap-1.5">
              <Icon name="shield" size={14} className="text-brand" />
              <h3 className="text-[12px] font-semibold">Quote a request id</h3>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Every error row copies the id support needs. No screenshots, no guessing.
            </p>
            <a
              href="mailto:developers@snagchat.io?subject=Developer%20support"
              className={buttonClass("secondary", "sm", "mt-3 w-full")}
            >
              Contact support
            </a>
          </div>
        </aside>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        eyebrow="New application"
        title="Create an application"
        description="A test environment and one scoped key are created with it. Live keys come after review."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={name.trim().length < 3}
              onClick={create}
            >
              Create app
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="app-name" className="text-[11px] font-semibold text-ink-soft">
              Application name
            </label>
            <input
              id="app-name"
              value={name}
              maxLength={48}
              onChange={(event) => setName(event.target.value)}
              placeholder="Night Shift Ingest"
              className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12.5px] outline-none transition-colors placeholder:text-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
            <p className="mt-1 text-[10.5px] text-faint">
              Shown on the consent screen and in every webhook.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-ink-soft">Who is building?</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["Studio / publisher", "Creator", "Tool or bot"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAudience(option)}
                  aria-pressed={audience === option}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    audience === option
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-white text-muted hover:border-line-strong",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="app-uri" className="text-[11px] font-semibold text-ink-soft">
              Redirect URI <span className="font-normal text-faint">· optional</span>
            </label>
            <input
              id="app-uri"
              placeholder="https://nightshift.gg/auth/callback"
              className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 font-mono text-[11.5px] outline-none transition-colors placeholder:text-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <div className="rounded-lg bg-surface px-3 py-2.5">
            <p className="text-[10.5px] leading-relaxed text-muted">
              You can change scopes later. Creating an app does not publish anything, and a test key
              never touches live data.
            </p>
          </div>
        </div>
      </Modal>
    </ConsoleLayout>
  );
}
