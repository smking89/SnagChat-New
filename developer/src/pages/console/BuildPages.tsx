import { useState } from "react";
import { Icon } from "../../components/Icon";
import { PageHead, FauxToggle, Meter } from "../../components/console-page";
import {
  Button,
  MethodChip,
  Panel,
  PanelHead,
  Pill,
  Stat,
  cn,
} from "../../components/ui";
import { APPS, type AppRow } from "../../data/portal";
import { usePortal } from "../../lib/portal";
import { Link } from "../../lib/router";
import { ConsoleLayout, EnvNotice } from "./ConsoleLayout";

const FIELD =
  "h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/15";

export function ApplicationsPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [apps, setApps] = useState<AppRow[]>(APPS);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const create = () => {
    const clean = name.trim();
    if (clean.length < 3) {
      toast("Give the app a name", "Three characters or more.", "danger");
      return;
    }
    setApps((current) => [
      ...current,
      {
        id: `app-${Date.now()}`,
        name: clean,
        description: "New app · test environment",
        environments: ["test"],
        requests: "0",
        errors: "—",
        tone: "ink",
      },
    ]);
    setName("");
    setAdding(false);
    toast("Application created", `${clean} · test environment ready`);
  };

  return (
    <ConsoleLayout active="applications" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Build"
        title="Applications"
        description="Each app gets its own keys, webhook endpoints and request log. Test and live stay apart, so a sandbox key can never touch a live post."
      >
        <Button variant="primary" size="sm" onClick={() => setAdding((open) => !open)}>
          <Icon name="plus" size={13} />
          New application
        </Button>
      </PageHead>

      {adding ? (
        <Panel className="mt-4 p-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint" htmlFor="app-name">
            Application name
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              id="app-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") create();
              }}
              placeholder="Static Kings Ingest"
              className={cn(FIELD, "max-w-[320px] flex-1")}
            />
            <Button variant="primary" size="sm" onClick={create}>
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            New apps start in test mode with no keys. Add a key when you are ready to send a request.
          </p>
        </Panel>
      ) : null}

      <Panel className="mt-4 overflow-hidden">
        <PanelHead title="2 applications" hint="Night Shift Studio · Scale plan" />
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
              <th className="px-4 py-2 font-extrabold">Application</th>
              <th className="px-4 py-2 font-extrabold">Environments</th>
              <th className="px-4 py-2 text-right font-extrabold">Requests / 30d</th>
              <th className="px-4 py-2 text-right font-extrabold">Errors</th>
              <th className="w-10 px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {apps.map((app) => (
              <tr key={app.id} className="group text-[12px] hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-md text-[9px] font-extrabold text-white",
                        app.tone === "purple"
                          ? "bg-[linear-gradient(135deg,#9400d3,#5b21b6)]"
                          : "bg-ink",
                      )}
                    >
                      {app.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold leading-tight">{app.name}</span>
                      <span className="block truncate text-[10.5px] text-faint">{app.description}</span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex gap-1.5">
                    {app.environments.map((environment) => (
                      <Pill key={environment} tone={environment === "live" ? "live" : "test"}>
                        {environment}
                      </Pill>
                    ))}
                  </span>
                </td>
                <td className="num px-4 py-3 text-right font-mono text-[11px] text-ink-soft">
                  {app.requests}
                </td>
                <td className="num px-4 py-3 text-right font-mono text-[11px] text-ink-soft">
                  {app.errors}
                </td>
                <td className="px-4 py-3 text-right">
                  {app.id === "night-shift-ingest" ? (
                    <Link
                      to={`/console/apps/${app.id}/overview`}
                      aria-label={`Open ${app.name}`}
                      className="text-faint transition-colors hover:text-brand"
                    >
                      <Icon name="chevronRight" size={14} />
                    </Link>
                  ) : (
                    <span
                      title="No keys yet — add one to open this app"
                      className="inline-flex text-line-strong"
                    >
                      <Icon name="chevronRight" size={14} />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-4 py-3">
        <Icon name="shield" size={14} className="text-brand" />
        <p className="text-[11.5px] text-muted">
          Every app is reviewed before it can post to the public feed. Test traffic never enters review.
        </p>
        <Link to="/docs/guides/post-to-a-squad" className="ml-auto text-[11.5px] font-semibold text-brand hover:text-brand-deep">
          Read the review rules
        </Link>
      </div>
    </ConsoleLayout>
  );
}

type Client = {
  id: string;
  name: string;
  clientId: string;
  redirect: string;
  scopes: string[];
  status: "live" | "test";
};

const CLIENTS: Client[] = [
  {
    id: "oauth_nsi",
    name: "Night Shift Ingest",
    clientId: "nsi_9f2c71a4",
    redirect: "https://nightshift.gg/oauth/callback",
    scopes: ["snags:read", "squads:read"],
    status: "live",
  },
  {
    id: "oauth_sks",
    name: "Static Kings Studio",
    clientId: "sks_4a81c0de",
    redirect: "http://localhost:3000/callback",
    scopes: ["clips:write"],
    status: "test",
  },
];

export function OAuthPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [redirect, setRedirect] = useState("https://");
  const [preview, setPreview] = useState<Client>(CLIENTS[0]!);

  const add = () => {
    if (name.trim().length < 3 || !redirect.includes("://")) {
      toast("Check the fields", "A name and a full redirect URI are required.", "danger");
      return;
    }
    const client: Client = {
      id: `oauth_${Date.now()}`,
      name: name.trim(),
      clientId: `cli_${Math.random().toString(36).slice(2, 10)}`,
      redirect: redirect.trim(),
      scopes: ["snags:read"],
      status: "test",
    };
    setClients((current) => [...current, client]);
    setPreview(client);
    setAdding(false);
    setName("");
    toast("OAuth client created", `${client.name} · test client`);
  };

  return (
    <ConsoleLayout active="oauth" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Build"
        title="OAuth clients"
        description="Let players sign in to your tool and grant exactly the scopes you ask for. The consent screen below is what they see — preview it before you ship it."
      >
        <Button variant="primary" size="sm" onClick={() => setAdding((open) => !open)}>
          <Icon name="plus" size={13} />
          New client
        </Button>
      </PageHead>

      {adding ? (
        <Panel className="mt-4 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                Client name
              </span>
              <input value={name} onChange={(event) => setName(event.target.value)} className={cn(FIELD, "mt-1.5")} placeholder="Static Kings Overlay" />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                Redirect URI
              </span>
              <input value={redirect} onChange={(event) => setRedirect(event.target.value)} className={cn(FIELD, "mt-1.5 font-mono text-[11px]")} />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" onClick={add}>
              Create client
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </Panel>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <PanelHead title="Clients" hint="One client per surface — web, overlay or bot" />
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
                <th className="px-4 py-2 font-extrabold">Client</th>
                <th className="px-4 py-2 font-extrabold">Scopes</th>
                <th className="px-4 py-2 font-extrabold">Mode</th>
                <th className="w-24 px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {clients.map((client) => (
                <tr key={client.id} className="text-[12px] hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold leading-tight">{client.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-faint">{client.clientId}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{client.redirect}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {client.scopes.map((scope) => (
                        <Pill key={scope} tone="brand">
                          {scope}
                        </Pill>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={client.status === "live" ? "live" : "test"} dot>
                      {client.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setPreview(client)}>
                      Preview
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHead title="Consent screen" hint={`${preview.name} · ${preview.scopes.length} scopes`} />
          <div className="bg-surface-2 px-4 py-5">
            <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[linear-gradient(135deg,#9400d3,#5b21b6)] text-[9px] font-extrabold text-white">
                  {preview.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[11.5px] font-semibold">{preview.name}</span>
                <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.12em] text-faint">
                  wants access
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {preview.scopes.map((scope) => (
                  <li key={scope} className="flex items-start gap-1.5 text-[11px] text-ink-soft">
                    <Icon name="check" size={12} className="mt-[2px] shrink-0 text-brand" />
                    {scope.replace(":read", " — read").replace(":write", " — post and edit").replace(":manage", " — manage")}
                    <span className="ml-auto font-mono text-[9.5px] text-faint">{scope}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-1.5">
                <span className="inline-flex h-7 flex-1 items-center justify-center rounded-md bg-ink text-[10.5px] font-semibold text-white">
                  Allow
                </span>
                <span className="inline-flex h-7 flex-1 items-center justify-center rounded-md border border-line text-[10.5px] font-semibold text-muted">
                  Cancel
                </span>
              </div>
              <p className="mt-2 text-center text-[9.5px] text-faint">
                You can revoke this at snagchat.io/settings
              </p>
            </div>
          </div>
          <p className="border-t border-line px-4 py-3 text-[10.5px] leading-relaxed text-muted">
            The player picks the account, never the scopes. Asking for more than you use is the fastest
            way to lose a consent screen.
          </p>
        </Panel>
      </div>
    </ConsoleLayout>
  );
}

const FIXTURES = [
  { id: "sng_8f21c", title: "Solo wipe at 2am", game: "Rust", gate: "allowed" },
  { id: "sng_8e0bb", title: "Summit run, no edits", game: "Valheim", gate: "allowed" },
  { id: "sng_8d4a1", title: "Rig tour", game: "Satisfactory", gate: "review" },
  { id: "sng_8c902", title: "Squad clutch", game: "Counter-Strike 2", gate: "blocked" },
];

export function SandboxPage({ onSearch }: { onSearch: () => void }) {
  const { env, toast } = usePortal();
  const [fixtures, setFixtures] = useState(FIXTURES);
  const [gate, setGate] = useState<"allowed" | "review" | "blocked">("allowed");

  const seed = () => {
    const next = [
      ...fixtures,
      {
        id: `sng_${Math.random().toString(36).slice(2, 7)}`,
        title: "Fresh capture",
        game: "DayZ",
        gate,
      },
    ];
    setFixtures(next);
    toast("Fixture created", `${next[next.length - 1]?.id} · gate ${gate}`);
  };

  return (
    <ConsoleLayout active="sandbox" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Build"
        title="Sandbox"
        description="A disposable copy of the feed for your test keys. Snags you create here never appear to players and never reach a real webhook subscriber."
      >
        <Button variant="secondary" size="sm" onClick={() => setFixtures(FIXTURES)}>
          <Icon name="refresh" size={13} />
          Reset
        </Button>
        <Button variant="primary" size="sm" onClick={seed}>
          <Icon name="plus" size={13} />
          New fixture
        </Button>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Stat label="Fixtures" value={String(fixtures.length)} hint="Reset nightly at 04:00 UTC" />
        <Stat label="Sandbox traffic" value="0 / 10k" hint="Requests this hour" />
        <Stat label="Environment" value={env === "test" ? "Test" : "Live"} hint="Switch in the rail" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="overflow-hidden">
          <PanelHead
            title="Fixtures"
            hint="Deterministic ids so a test can assert on them"
            action={
              <span className="font-mono text-[10px] text-faint">api.snagchat.io · sandbox</span>
            }
          />
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
                <th className="px-4 py-2 font-extrabold">Snag</th>
                <th className="px-4 py-2 font-extrabold">Title</th>
                <th className="px-4 py-2 font-extrabold">Game</th>
                <th className="px-4 py-2 font-extrabold">Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {fixtures.map((fixture) => (
                <tr key={fixture.id} className="text-[12px]">
                  <td className="px-4 py-2.5 font-mono text-[10.5px] text-ink-soft">{fixture.id}</td>
                  <td className="px-4 py-2.5">{fixture.title}</td>
                  <td className="px-4 py-2.5 text-muted">{fixture.game}</td>
                  <td className="px-4 py-2.5">
                    <Pill
                      tone={
                        fixture.gate === "allowed"
                          ? "success"
                          : fixture.gate === "review"
                            ? "warn"
                            : "danger"
                      }
                    >
                      {fixture.gate}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Create a fixture" hint="Pick the gate you want to test" />
            <div className="space-y-2 px-4 py-3">
              {(["allowed", "review", "blocked"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGate(option)}
                  aria-pressed={gate === option}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11.5px] transition-colors",
                    gate === option
                      ? "border-brand/30 bg-brand-soft/60 text-ink"
                      : "border-line text-muted hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      option === "allowed"
                        ? "bg-success"
                        : option === "review"
                          ? "bg-warn"
                          : "bg-danger",
                    )}
                  />
                  {option === "allowed"
                    ? "Allowed — posts to the feed"
                    : option === "review"
                      ? "Review — held for a moderator"
                      : "Blocked — rejected with a reason"}
                </button>
              ))}
              <Button variant="primary" size="sm" className="w-full" onClick={seed}>
                Create fixture
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Guardrails" />
            <ul className="space-y-2 px-4 py-3 text-[11px] text-muted">
              {[
                "Test keys are prefixed sk_test_ and cannot read live data.",
                "Sandbox webhooks are signed with a separate secret.",
                "Fixtures are wiped every night; do not store them as fixtures in your tests.",
                "Rate limit mirrors production: 120 req/min.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-1.5">
                  <Icon name="check" size={12} className="mt-[2px] shrink-0 text-brand" />
                  {line}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </ConsoleLayout>
  );
}

const ENDPOINT_USAGE = [
  { method: "POST", route: "/v1/snags", requests: "642,918", p95: "184ms", errors: "0.31%" },
  { method: "POST", route: "/v1/clips", requests: "388,204", p95: "892ms", errors: "0.44%" },
  { method: "GET", route: "/v1/snags/:id", requests: "201,772", p95: "41ms", errors: "0.02%" },
  { method: "GET", route: "/v1/squads", requests: "44,102", p95: "88ms", errors: "0.01%" },
  { method: "DELETE", route: "/v1/snags/:id", requests: "8,431", p95: "72ms", errors: "1.20%" },
];

export function UsagePage({ onSearch }: { onSearch: () => void }) {
  return (
    <ConsoleLayout active="usage" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Observe"
        title="Usage"
        description="What you have spent against the Scale plan this month. Limits are enforced by the API, and the changelog always announces a change before it bites."
      >
        <Pill tone="neutral">Nov 1 – Nov 30</Pill>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Requests" value="1.28M" delta={{ value: "+12.4%" }} hint="Of 2M included" />
        <Stat label="Webhook deliveries" value="38,102" delta={{ value: "+4.1%" }} hint="Of 50k included" />
        <Stat label="Clip storage" value="184 GB" hint="Of 250 GB · 60s cap" />
        <Stat label="Squad posts" value="1,204" hint="Across 3 squads" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Panel>
          <PanelHead title="Limits" hint="Resets Dec 1" />
          <div className="space-y-4 px-4 py-4">
            <Meter label="API requests" value={1284000} limit={2000000} tone="warn" note="65% of plan" />
            <Meter label="Webhook deliveries" value={38102} limit={50000} />
            <Meter label="Clip storage (GB)" value={184} limit={250} />
            <Meter label="Squad posts" value={1204} limit={2000} tone="success" />
          </div>
          <p className="border-t border-line px-4 py-3 text-[10.5px] leading-relaxed text-muted">
            Overage is billed at $0.40 per 1,000 requests. We email at 80% and never hard-stop a live app
            without a week's notice.
          </p>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHead title="By endpoint" hint="Last 30 days" />
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
                <th className="px-4 py-2 font-extrabold">Endpoint</th>
                <th className="px-4 py-2 text-right font-extrabold">Requests</th>
                <th className="px-4 py-2 text-right font-extrabold">p95</th>
                <th className="px-4 py-2 text-right font-extrabold">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ENDPOINT_USAGE.map((row) => (
                <tr key={row.route} className="text-[12px]">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <MethodChip method={row.method} />
                      <span className="font-mono text-[10.5px] text-ink-soft">{row.route}</span>
                    </span>
                  </td>
                  <td className="num px-4 py-2.5 text-right font-mono text-[11px]">{row.requests}</td>
                  <td className="num px-4 py-2.5 text-right font-mono text-[11px] text-muted">{row.p95}</td>
                  <td className="num px-4 py-2.5 text-right font-mono text-[11px] text-muted">{row.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </ConsoleLayout>
  );
}

type Rule = {
  id: string;
  label: string;
  detail: string;
  channel: string;
  on: boolean;
  severity: "warn" | "danger";
};

const RULES: Rule[] = [
  { id: "errors", label: "Error rate above 2%", detail: "Any rolling 5-minute window", channel: "#night-shift-alerts", on: true, severity: "danger" },
  { id: "webhooks", label: "5 consecutive webhook failures", detail: "Endpoint auto-disables at 20", channel: "Email + #alerts", on: true, severity: "warn" },
  { id: "usage", label: "Usage at 80% of plan", detail: "Requests, storage or review slots", channel: "Email", on: true, severity: "warn" },
  { id: "keys", label: "Key unused for 90 days", detail: "Suggests a stuck pipeline", channel: "Email", on: false, severity: "warn" },
];

const ALERT_FEED = [
  { at: "13:58", rule: "5 consecutive webhook failures", target: "staging", state: "open" },
  { at: "11:02", rule: "Error rate above 2%", target: "POST /v1/clips", state: "resolved" },
  { at: "Oct 26", rule: "Usage at 80% of plan", target: "Requests", state: "resolved" },
];

export function AlertsPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [rules, setRules] = useState(RULES);

  return (
    <ConsoleLayout active="alerts" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Observe"
        title="Alerts"
        description="Rules run against live traffic only. Each one names the thing that broke, not just that something did."
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast("Test alert sent", "Delivered to #night-shift-alerts")}
        >
          <Icon name="zap" size={13} />
          Send test alert
        </Button>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <PanelHead title="Rules" hint="4 rules · 2 channels" />
          <ul className="divide-y divide-line">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-start gap-3 px-4 py-3">
                <FauxToggle
                  on={rule.on}
                  label={rule.label}
                  onChange={(next) => {
                    setRules((current) =>
                      current.map((item) => (item.id === rule.id ? { ...item, on: next } : item)),
                    );
                    toast(next ? "Rule enabled" : "Rule paused", rule.label);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[12px] font-semibold">
                    {rule.label}
                    <Pill tone={rule.severity === "danger" ? "danger" : "warn"}>{rule.severity}</Pill>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {rule.detail} · to {rule.channel}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast("Rule editor is inline in this preview", rule.label)}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHead title="Recent" hint="Last 7 days" />
          <ul className="divide-y divide-line">
            {ALERT_FEED.map((alert) => (
              <li key={`${alert.at}-${alert.rule}`} className="px-4 py-3">
                <p className="flex items-center gap-2 text-[11.5px] font-semibold">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      alert.state === "open" ? "bg-danger" : "bg-success",
                    )}
                  />
                  {alert.rule}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  {alert.target} · {alert.at}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </ConsoleLayout>
  );
}
