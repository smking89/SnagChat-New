import { Icon } from "../../components/Icon";
import { Button, Panel, PanelHead, Pill } from "../../components/ui";
import { usePortal } from "../../lib/portal";

export function OverviewPanel({ env }: { env: "test" | "live" }) {
  const { toast } = usePortal();

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied`, value);
    } catch {
      toast("Could not copy", "Your browser blocked clipboard access.");
    }
  };

  const baseUrl = env === "test" ? "https://api.snagchat.io" : "https://api.snagchat.io";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHead title="Application" hint="Identity, ownership and environments" />
        <dl className="divide-y divide-line">
          {[
            ["Application id", "app_7c2f91", true],
            ["Created", "Oct 24, 2026", false],
            ["Owner", "koba@nightshift.gg", false],
          ].map(([label, value, mono]) => (
            <div key={String(label)} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <dt className="text-[11px] text-muted">{label}</dt>
              <dd className="flex items-center gap-1.5">
                <span
                  className={
                    mono ? "font-mono text-[10.5px] text-ink-soft" : "text-[11.5px] text-ink-soft"
                  }
                >
                  {value}
                </span>
                <button
                  type="button"
                  aria-label={`Copy ${label}`}
                  onClick={() => copy(String(value), String(label))}
                  className="text-faint transition-colors hover:text-brand"
                >
                  <Icon name="copy" size={11} />
                </button>
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <dt className="text-[11px] text-muted">Environments</dt>
            <dd className="flex gap-1.5">
              <Pill tone="test" dot>
                Test
              </Pill>
              <Pill tone="live" dot>
                Live
              </Pill>
            </dd>
          </div>
        </dl>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-faint">Base URL</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-surface px-2 py-1 font-mono text-[10.5px] text-ink-soft">
              {baseUrl}
            </code>
            <Pill tone={env === "live" ? "live" : "test"}>{env}</Pill>
            <button
              type="button"
              onClick={() => copy(baseUrl, "Base URL")}
              className="text-[10px] font-semibold text-muted hover:text-ink"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
            Redirect URI
          </p>
          <p className="mt-1 font-mono text-[10.5px] text-ink-soft">
            https://nightshift.gg/auth/callback
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHead
          title="Scopes"
          hint="What this app is allowed to do"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast("Scope changes need review", "Open a ticket with the scopes you need.")}
            >
              Request scope
            </Button>
          }
        />
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {["snags:write", "clips:write", "snags:read", "webhooks:manage"].map((scope) => (
            <span
              key={scope}
              className="rounded-full border border-brand/15 bg-brand-soft px-2 py-[3px] font-mono text-[10px] font-semibold text-brand-deep"
            >
              {scope}
            </span>
          ))}
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
            Consent screen
          </p>
          <div className="mt-2 rounded-xl border border-line bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[linear-gradient(135deg,#9400d3,#5b21b6)] text-[9px] font-extrabold text-white">
                NS
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold">Night Shift Ingest</p>
                <p className="text-[9.5px] text-faint">wants to access your SnagChat account</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {[
                ["Post snags on your behalf", "snags:write"],
                ["Upload clips to your studio", "clips:write"],
              ].map(([label, scope]) => (
                <li key={scope} className="flex items-start gap-1.5">
                  <Icon name="check" size={11} className="mt-1 shrink-0 text-brand" />
                  <span className="text-[10.5px] leading-snug text-ink-soft">
                    {label}{" "}
                    <span className="font-mono text-[9.5px] text-faint">· {scope}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => toast("This is a preview of the consent screen")}
                className="h-7 rounded-md bg-ink px-2.5 text-[10.5px] font-semibold text-white"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => toast("This is a preview of the consent screen")}
                className="h-7 rounded-md border border-line bg-white px-2.5 text-[10.5px] font-semibold text-ink-soft"
              >
                Cancel
              </button>
            </div>
          </div>
          <p className="mt-2 text-[9.5px] leading-relaxed text-faint">
            Exactly what a player sees. Scopes are in plain language before the raw name.
          </p>
        </div>
      </Panel>
    </div>
  );
}
