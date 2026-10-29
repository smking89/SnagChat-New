import { useState } from "react";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Overlay";
import { Button, Pill, cn } from "../../components/ui";
import { ALL_SCOPES, DELIVERIES, KEYS, LOGS, type Delivery, type KeyRow } from "../../data/portal";
import { usePortal } from "../../lib/portal";
import { Link } from "../../lib/router";
import { ConsoleLayout, EnvNotice } from "./ConsoleLayout";
import { KeysPanel } from "./KeysPanel";
import { AppOAuthPanel, AppSettingsPanel, AppUsagePanel } from "./AppExtraPanels";
import { LogsPanel } from "./LogsPanel";
import { OverviewPanel } from "./OverviewPanel";
import { WebhooksPanel } from "./WebhooksPanel";

export type AppTab = "overview" | "keys" | "webhooks" | "logs" | "oauth" | "usage" | "settings";

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "keys", label: "Keys" },
  { id: "webhooks", label: "Webhooks" },
  { id: "logs", label: "Logs" },
  { id: "oauth", label: "OAuth" },
  { id: "usage", label: "Usage" },
  { id: "settings", label: "Settings" },
];

/**
 * The seeded deliveries carry fixed times, so a new row takes the newest one
 * plus a minute instead of the machine clock — the table stays in one timeline.
 */
function bumpClock(at: string | undefined): string {
  const [hour, minute, second] = (at ?? "14:02:11").split(":").map(Number);
  const base = new Date();
  base.setHours(hour ?? 14, minute ?? 2, second ?? 11, 0);
  base.setSeconds(base.getSeconds() + 60);
  return base.toTimeString().slice(0, 8);
}

function makeSecret(env: "test" | "live") {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sk_${env}_${hex}`;
}

type ModalState =
  | { kind: "new" }
  | { kind: "reveal"; key: KeyRow; overlap: boolean }
  | { kind: "revoke"; key: KeyRow }
  | null;

export function AppPage({ tab, onSearch }: { tab: AppTab; onSearch: () => void }) {
  const { env, toast } = usePortal();
  const [keys, setKeys] = useState<KeyRow[]>(KEYS);
  const [deliveries, setDeliveries] = useState<Delivery[]>(DELIVERIES);
  const [modal, setModal] = useState<ModalState>(null);
  const [newLabel, setNewLabel] = useState("Capture pipeline");
  const [newScopes, setNewScopes] = useState<string[]>(["snags:write", "clips:write"]);

  const visibleKeys = keys.filter((key) => key.env === env);

  const openNew = () => {
    if (env === "live") {
      toast("Re-authenticate to create a live key", "Live credentials need a fresh sign-in.");
      return;
    }
    setNewLabel("New key");
    setNewScopes(["snags:write"]);
    setModal({ kind: "new" });
  };

  const createKey = () => {
    const label = newLabel.trim() || "Untitled key";
    const key: KeyRow = {
      id: `key_${Date.now()}`,
      label,
      secret: makeSecret("test"),
      scopes: newScopes.length > 0 ? newScopes : ["snags:read"],
      lastUsed: "Never",
      expires: "Never",
      env: "test",
    };
    setKeys((current) => [...current, key]);
    setModal({ kind: "reveal", key, overlap: false });
  };

  const rotate = (key: KeyRow) => {
    if (key.env === "live") {
      toast("Re-authenticate to rotate a live key", "Live keys are masked until you sign in again.");
      return;
    }
    const replacement: KeyRow = {
      ...key,
      id: `key_${Date.now()}`,
      label: `${key.label} (rotated)`,
      secret: makeSecret("test"),
      lastUsed: "Never",
    };
    setKeys((current) => [...current, replacement]);
    setModal({ kind: "reveal", key: replacement, overlap: true });
  };

  const revoke = (key: KeyRow) => {
    setKeys((current) => current.filter((item) => item.id !== key.id));
    setModal(null);
    toast("Key revoked", `${key.label} stops working immediately.`, "danger");
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied`, "Paste it somewhere safe — it is not shown again.");
    } catch {
      toast("Could not copy", "Your browser blocked clipboard access.");
    }
  };

  const sendTestEvent = () => {
    const delivery: Delivery = {
      id: `dlv_${Math.random().toString(36).slice(2, 8)}`,
      at: bumpClock(deliveries[0]?.at),
      event: "snag.created",
      endpoint: "prod-capture",
      status: 200,
      duration: "408ms",
      attempts: 1,
      manual: true,
    };
    setDeliveries((current) => [delivery, ...current]);
    toast("Test event delivered", "snag.created · 200 in 408ms", "success");
  };

  const revealKey = modal?.kind === "reveal" ? modal.key : null;

  return (
    <ConsoleLayout active={tab} onSearch={onSearch}>
      <EnvNotice />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] text-faint">
            Applications / <span className="text-ink-soft">Night Shift Ingest</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(135deg,#9400d3,#5b21b6)] text-[10px] font-extrabold text-white">
              NS
            </span>
            <h1 className="font-display text-[23px] font-extrabold leading-none tracking-[-0.035em]">
              Night Shift Ingest
            </h1>
            <Pill tone={env === "live" ? "live" : "test"} dot>
              {env === "live" ? "Live" : "Test"}
            </Pill>
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted">
            Clip pipeline · nightshift.gg ·{" "}
            <span className="font-mono text-[10.5px]">app_7c2f91</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/docs/api/create-snag"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[11.5px] font-semibold text-ink-soft transition-colors hover:border-line-strong"
          >
            <Icon name="book" size={13} />
            Docs
          </Link>

          {tab === "keys" ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const first = visibleKeys[0];
                  if (first) rotate(first);
                }}
              >
                <Icon name="refresh" size={13} />
                Rotate
              </Button>
              <Button variant="primary" size="sm" onClick={openNew}>
                <Icon name="plus" size={13} />
                New key
              </Button>
            </>
          ) : null}

          {tab === "webhooks" ? (
            <Button variant="primary" size="sm" onClick={sendTestEvent}>
              <Icon name="zap" size={13} />
              Send test event
            </Button>
          ) : null}

          {tab === "logs" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const blob = new Blob(
                  [
                    "at,method,route,status,ms,request_id\n" +
                      LOGS.map(
                        (row) =>
                          `${row.at},${row.method},${row.route},${row.status},${row.ms},${row.requestId}`,
                      ).join("\n"),
                  ],
                  { type: "text/csv" },
                );
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "night-shift-requests.csv";
                link.click();
                URL.revokeObjectURL(url);
                toast("Log exported", "7 days of request metadata");
              }}
            >
              <Icon name="download" size={13} />
              Export
            </Button>
          ) : null}

          {tab === "overview" ? (
            <Link
              to="/console/apps/night-shift-ingest/settings"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[11.5px] font-semibold text-ink-soft transition-colors hover:border-line-strong"
            >
              <Icon name="settings" size={13} />
              Edit app
            </Link>
          ) : null}
        </div>
      </div>

      <div className="scroll-thin mt-4 flex items-center gap-0 overflow-x-auto border-b border-line">
        {TABS.map((item) => (
          <Link
            key={item.id}
            to={`/console/apps/night-shift-ingest/${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-[12px] font-medium transition-colors",
              tab === item.id ? "font-semibold text-ink" : "text-muted hover:text-ink",
            )}
          >
            {item.label}
            {tab === item.id ? (
              <span className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-t bg-brand" />
            ) : null}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {tab === "keys" ? (
          <KeysPanel
            keys={visibleKeys}
            env={env}
            onCopy={(value) => copy(value, "Key")}
            onCreate={openNew}
            onRotate={rotate}
            onRevoke={(key) => setModal({ kind: "revoke", key })}
            onRevealLive={() =>
              toast("Re-authenticate to reveal a live key", "Live credentials stay masked by design.")
            }
          />
        ) : null}
        {tab === "webhooks" ? (
          <WebhooksPanel
            deliveries={deliveries}
            onReplay={(delivery) => {
              setDeliveries((current) => [
                {
                  ...delivery,
                  id: `dlv_${Math.random().toString(36).slice(2, 8)}`,
                  at: bumpClock(current[0]?.at),
                  status: 200,
                  duration: "402ms",
                  attempts: 1,
                  manual: true,
                },
                ...current,
              ]);
              toast("Replay queued", `${delivery.event} · a fresh signature was issued.`, "success");
            }}
            onSendTest={sendTestEvent}
            onCopy={copy}
          />
        ) : null}
        {tab === "logs" ? <LogsPanel /> : null}
        {tab === "overview" ? <OverviewPanel env={env} /> : null}
        {tab === "oauth" ? <AppOAuthPanel /> : null}
        {tab === "usage" ? <AppUsagePanel env={env} /> : null}
        {tab === "settings" ? <AppSettingsPanel /> : null}
      </div>

      <Modal
        open={modal?.kind === "new"}
        onClose={() => setModal(null)}
        eyebrow="Credential"
        title="Create a test key"
        description="Pick a label and the narrowest scopes that will do the job. You will see the key once."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={createKey}>
              Create key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="key-label" className="text-[11px] font-semibold text-ink-soft">
              Label
            </label>
            <input
              id="key-label"
              value={newLabel}
              maxLength={40}
              onChange={(event) => setNewLabel(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12.5px] outline-none transition-colors focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            />
            <p className="mt-1 text-[10.5px] text-faint">
              Name it after the thing that uses it, so revoking later is obvious.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-ink-soft">Scopes</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_SCOPES.map((scope) => {
                const on = newScopes.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setNewScopes((current) =>
                        on ? current.filter((item) => item !== scope) : [...current, scope],
                      )
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold transition-colors",
                      on
                        ? "border-brand bg-brand-soft text-brand-deep"
                        : "border-line bg-white text-muted hover:border-line-strong",
                    )}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
              Environment
            </p>
            <p className="mt-1 text-[11.5px] text-ink-soft">
              Test · <span className="font-mono text-[11px]">api.snagchat.io</span> · sandbox data
              only
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal?.kind === "reveal"}
        onClose={() => setModal(null)}
        eyebrow="Shown once"
        title={modal?.kind === "reveal" && modal.overlap ? "New key, both valid" : "Your key is ready"}
        description={
          modal?.kind === "reveal" && modal.overlap
            ? "The replacement works immediately. Revoke the old key once your deploy is out — both stay valid for 24 hours."
            : "Copy it now. We store a hash, so this is the only time the full key is visible."
        }
        width={560}
        footer={
          <Button variant="primary" size="sm" onClick={() => setModal(null)}>
            I stored it
          </Button>
        }
      >
        {revealKey ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                  {revealKey.label}
                </span>
                <Pill tone={revealKey.env === "live" ? "live" : "test"}>{revealKey.env}</Pill>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="scroll-thin min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-white px-2.5 py-2 font-mono text-[11.5px] text-ink ring-1 ring-line">
                  {revealKey.secret}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copy(revealKey.secret, "Key")}
                >
                  <Icon name="copy" size={13} />
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {revealKey.scopes.map((scope) => (
                <span
                  key={scope}
                  className="rounded-full bg-brand-soft px-2 py-[3px] font-mono text-[10px] font-semibold text-brand-deep"
                >
                  {scope}
                </span>
              ))}
            </div>

            {modal?.kind === "reveal" && modal.overlap ? (
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted">
                  <span>Both keys valid</span>
                  <span>24h overlap</span>
                </div>
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-surface">
                  <span className="h-full w-1/2 bg-brand" />
                  <span className="h-full w-1/2 bg-brand/25" />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-faint">
                  <span>now</span>
                  <span>+24h</span>
                </div>
              </div>
            ) : null}

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
              <Icon name="shield" size={13} className="mt-0.5 shrink-0 text-brand" />
              Store it in your secret manager. If it leaks, revoke it here — the replacement takes
              effect immediately.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal?.kind === "revoke"}
        onClose={() => setModal(null)}
        eyebrow="Destructive"
        title="Revoke this key?"
        description="Any request using it will start failing with 401. There is no undo, but you can create a new key straight away."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
              Keep key
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (modal?.kind === "revoke") revoke(modal.key);
              }}
            >
              Revoke key
            </Button>
          </>
        }
      >
        {modal?.kind === "revoke" ? (
          <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
            <p className="text-[12px] font-semibold">{modal.key.label}</p>
            <p className="mt-0.5 font-mono text-[10.5px] text-faint">
              {modal.key.secret.slice(0, 12)}…{modal.key.secret.slice(-4)}
            </p>
          </div>
        ) : null}
      </Modal>
    </ConsoleLayout>
  );
}
