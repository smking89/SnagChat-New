import { useState } from "react";
import { Icon } from "../../components/Icon";
import { Meter } from "../../components/console-page";
import { Button, Panel, PanelHead, Pill, Stat, cn } from "../../components/ui";
import { usePortal } from "../../lib/portal";
import { Link } from "../../lib/router";

export function AppOAuthPanel() {
  const { toast } = usePortal();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHead
          title="Client"
          hint="One client per app; scopes are checked again on every call"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast("Client secret rotated", "The old secret stops working immediately")}
            >
              <Icon name="refresh" size={13} />
              Rotate secret
            </Button>
          }
        />
        <dl className="divide-y divide-line text-[11.5px]">
          {[
            ["Client id", "nsi_9f2c71a4"],
            ["Redirect URI", "https://nightshift.gg/oauth/callback"],
            ["Scopes", "snags:read · squads:read"],
            ["Consent screen", "Shown to the player, never editable by the app"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <dt className="text-muted">{label}</dt>
              <dd className="max-w-[60%] truncate font-mono text-[10.5px] text-ink-soft">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-line px-4 py-3">
          <p className="text-[10.5px] leading-relaxed text-muted">
            A player grants these scopes once. Revoking access on snagchat.io takes effect on the next
            request, not when a token expires.
          </p>
          <Link
            to="/console/oauth"
            className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand hover:text-brand-deep"
          >
            Manage all clients
            <Icon name="arrowRight" size={12} />
          </Link>
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Consent preview" hint="What the player sees" />
        <div className="bg-surface-2 px-4 py-5">
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-[linear-gradient(135deg,#9400d3,#5b21b6)] text-[9px] font-extrabold text-white">
                NS
              </span>
              <span className="text-[11.5px] font-semibold">Night Shift Ingest</span>
              <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.12em] text-faint">
                wants access
              </span>
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-[11px] text-ink-soft">
              <li className="flex items-center gap-1.5">
                <Icon name="check" size={12} className="text-brand" />
                Read your public snags
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="check" size={12} className="text-brand" />
                See squads you belong to
              </li>
            </ul>
            <div className="mt-3 flex gap-1.5">
              <span className="inline-flex h-7 flex-1 items-center justify-center rounded-md bg-ink text-[10.5px] font-semibold text-white">
                Allow
              </span>
              <span className="inline-flex h-7 flex-1 items-center justify-center rounded-md border border-line text-[10.5px] font-semibold text-muted">
                Cancel
              </span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function AppUsagePanel({ env }: { env: "test" | "live" }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat label="Requests / 30d" value={env === "live" ? "1.28M" : "42.8k"} hint="App share of the plan" />
        <Stat label="p95 latency" value="184ms" hint="POST /v1/snags" />
        <Stat label="Errors" value="0.4%" hint="Mostly 422 gate rejections" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHead title="This app against the plan" hint="Org-wide limits in Usage" />
          <div className="space-y-4 px-4 py-4">
            <Meter label="Requests" value={42800} limit={2000000} />
            <Meter label="Webhook deliveries" value={8102} limit={50000} />
            <Meter label="Clip storage (GB)" value={72} limit={250} tone="success" />
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Top routes" hint="Last 30 days" />
          <ul className="divide-y divide-line text-[11.5px]">
            {[
              ["POST", "/v1/snags", "31,402"],
              ["POST", "/v1/clips", "8,912"],
              ["GET", "/v1/snags/:id", "2,401"],
            ].map(([method, route, count]) => (
              <li key={route} className="flex items-center gap-2 px-4 py-2.5">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold",
                    method === "POST" ? "bg-brand-soft text-brand-deep" : "bg-success-soft text-success",
                  )}
                >
                  {method}
                </span>
                <span className="font-mono text-[10.5px] text-ink-soft">{route}</span>
                <span className="ml-auto font-mono text-[10.5px] text-muted">{count}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2.5 text-[10.5px] text-muted">
            Errors are dominated by gate rejections, which are expected and not billed separately.
          </p>
        </Panel>
      </div>
    </div>
  );
}

export function AppSettingsPanel() {
  const { toast } = usePortal();
  const [name, setName] = useState("Night Shift Ingest");
  const [domain, setDomain] = useState("nightshift.gg");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel>
        <PanelHead title="Identity" hint="Shown on consent screens and the catalogue" />
        <div className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Domain</span>
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 font-mono text-[11px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
              What this app does
            </span>
            <textarea
              defaultValue="Takes finished campaign captures, uploads the clip and posts the snag."
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-2.5 py-2 text-[12px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
          </label>
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast("App saved", `${name} · ${domain}`)}
          >
            Save changes
          </Button>
          <p className="text-[10.5px] text-faint">Changes are logged in the audit trail.</p>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <PanelHead title="Review" />
          <div className="space-y-2 px-4 py-3 text-[11.5px]">
            <p className="flex items-center justify-between gap-3">
              <span className="text-muted">Feed posting</span>
              <Pill tone="success" dot>
                Approved
              </Pill>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-muted">Live keys</span>
              <Pill tone="live">1 active</Pill>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-muted">Scopes</span>
              <span className="font-mono text-[10px] text-ink-soft">3 of 6</span>
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Danger zone" />
          <div className="px-4 py-3">
            <p className="text-[10.5px] leading-relaxed text-muted">
              Deleting the app revokes its keys and endpoints. Request history stays in the org audit
              log for a year.
            </p>
            <Button
              variant="danger"
              size="sm"
              className="mt-2.5 w-full"
              onClick={() => toast("Deletion is disabled in this preview", "Nothing was removed")}
            >
              <Icon name="trash" size={13} />
              Delete app
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
