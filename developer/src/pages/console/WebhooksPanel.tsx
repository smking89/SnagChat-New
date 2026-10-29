import { useState } from "react";
import { CodeBlock } from "../../components/CodeBlock";
import { Icon } from "../../components/Icon";
import { Drawer } from "../../components/Overlay";
import { Button, Panel, PanelHead, Pill, cn } from "../../components/ui";
import {
  ENDPOINTS,
  WEBHOOK_HEADERS,
  WEBHOOK_PAYLOAD,
  WEBHOOK_RESPONSE,
  type Delivery,
} from "../../data/portal";

type Filter = "all" | "failed";
type DrawerTab = "payload" | "headers" | "response";

export function WebhooksPanel({
  deliveries,
  onReplay,
  onSendTest,
  onCopy,
}: {
  deliveries: Delivery[];
  onReplay: (delivery: Delivery) => void;
  onSendTest: () => void;
  onCopy: (value: string, label: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("payload");
  const [revealed, setRevealed] = useState<string | null>(null);

  const failed = deliveries.filter((delivery) => delivery.status >= 400);
  const rows = filter === "failed" ? failed : deliveries;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ENDPOINTS.map((endpoint) => (
          <Panel key={endpoint.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      endpoint.state === "failing" ? "bg-danger" : "bg-success",
                    )}
                  />
                  <h3 className="text-[12px] font-semibold">{endpoint.label}</h3>
                  <Pill tone={endpoint.state === "failing" ? "danger" : "success"}>
                    {endpoint.state === "failing" ? "Failing" : "Active"}
                  </Pill>
                </div>
                <p className="mt-1 truncate font-mono text-[10.5px] text-muted">{endpoint.url}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={onSendTest}>
                <Icon name="zap" size={12} />
                Send test
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">Events</p>
                <p className="num mt-0.5 text-[12px] font-semibold">{endpoint.events}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">Success</p>
                <p className="num mt-0.5 text-[12px] font-semibold">{endpoint.success}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">Secret</p>
                {revealed === endpoint.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      onCopy(endpoint.secret, "Signing secret");
                      setRevealed(null);
                    }}
                    className="mt-0.5 truncate font-mono text-[10px] text-brand hover:underline"
                    title="Copy secret"
                  >
                    {endpoint.secret}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed(endpoint.id)}
                    className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-muted hover:text-ink"
                  >
                    whsec_••••
                    <Icon name="eye" size={11} />
                  </button>
                )}
              </div>
            </div>

            {endpoint.state === "failing" ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger-soft px-2.5 py-1.5">
                <Icon name="alert" size={12} className="mt-[1px] shrink-0 text-danger" />
                <p className="text-[10.5px] leading-snug text-danger">
                  {endpoint.consecutive} consecutive failures · auto-disables at 20. Last response
                  was a 500 after 2.4s.
                </p>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHead
          title="Deliveries"
          hint="Signed with whsec_7d1c4f9a2b6e · kept for 7 days"
          action={
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg border border-line p-0.5">
                {(
                  [
                    ["all", `All ${deliveries.length}`],
                    ["failed", `Failed ${failed.length}`],
                  ] as Array<[Filter, string]>
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    aria-pressed={filter === id}
                    className={cn(
                      "rounded-[5px] px-2 py-1 text-[10.5px] font-semibold transition-colors",
                      filter === id ? "bg-ink text-white" : "text-muted hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={onSendTest}>
                Send test
              </Button>
            </div>
          }
        />

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface text-muted">
              <Icon name="webhook" size={18} />
            </span>
            <p className="mt-3 text-[12.5px] font-semibold">Nothing failed</p>
            <p className="mt-1 text-[11.5px] text-muted">
              Every delivery in the last 24 hours returned 2xx.
            </p>
          </div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[660px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
                  <th className="px-4 py-2 font-bold">Time</th>
                  <th className="px-4 py-2 font-bold">Event</th>
                  <th className="px-4 py-2 font-bold">Endpoint</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                  <th className="px-4 py-2 font-bold">Duration</th>
                  <th className="px-4 py-2 font-bold">Attempts</th>
                  <th className="w-6 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((delivery) => (
                  <tr
                    key={delivery.id}
                    onClick={() => {
                      setSelected(delivery);
                      setDrawerTab("payload");
                    }}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-surface/60",
                      delivery.status >= 400 && "bg-danger-soft/25",
                    )}
                  >
                    <td className="num px-4 py-2 font-mono text-[10.5px] text-muted">{delivery.at}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10.5px] text-ink-soft">{delivery.event}</span>
                        {delivery.manual ? <Pill tone="neutral">Manual</Pill> : null}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[10.5px] text-muted">{delivery.endpoint}</td>
                    <td className="px-4 py-2">
                      <Pill tone={delivery.status >= 400 ? "danger" : "success"}>
                        {delivery.status}
                      </Pill>
                    </td>
                    <td className="num px-4 py-2 font-mono text-[10.5px] text-muted">
                      {delivery.duration}
                    </td>
                    <td className="num px-4 py-2 text-[10.5px] text-muted">{delivery.attempts}</td>
                    <td className="px-2 py-2">
                      <Icon name="chevronRight" size={13} className="text-faint" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `POST ${selected.id}` : ""}
        subtitle={selected ? `${selected.event} → ${selected.endpoint} · attempt ${selected.attempts}` : ""}
        badge={
          selected ? (
            <Pill tone={selected.status >= 400 ? "danger" : "success"}>{selected.status}</Pill>
          ) : null
        }
        footer={
          selected ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onReplay(selected);
                }}
              >
                <Icon name="refresh" size={13} />
                Replay delivery
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onCopy(
                    `curl -X POST https://nightshift.gg/hooks/snagchat \\\n  -H "SnagChat-Event: ${selected.event}" \\\n  -d '${WEBHOOK_PAYLOAD.replace(/\n\s*/g, "")}'`,
                    "Request",
                  )
                }
              >
                <Icon name="terminal" size={13} />
                Copy as cURL
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                ["Event", selected.event],
                ["Delivery", selected.id],
                ["Duration", selected.duration],
                ["Signature", "Verified · t=1798408931"],
                ["Endpoint", selected.endpoint],
                ["Attempts", `${selected.attempts} of 6`],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-faint">{label}</p>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-ink-soft">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex rounded-lg border border-line p-0.5">
              {(
                [
                  ["payload", "Payload"],
                  ["headers", "Headers"],
                  ["response", "Response"],
                ] as Array<[DrawerTab, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDrawerTab(id)}
                  aria-pressed={drawerTab === id}
                  className={cn(
                    "flex-1 rounded-[5px] px-2 py-1 text-[10.5px] font-semibold transition-colors",
                    drawerTab === id ? "bg-surface text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <CodeBlock
              code={
                drawerTab === "payload"
                  ? WEBHOOK_PAYLOAD
                  : drawerTab === "headers"
                    ? WEBHOOK_HEADERS
                    : WEBHOOK_RESPONSE
              }
              filename={drawerTab}
            />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Timeline</p>
              <ol className="mt-2 space-y-3">
                {[
                  { label: "Received", detail: `14:01:58.204 · ${selected.event}`, tone: "neutral" },
                  { label: "Signed", detail: "SnagChat-Signature v1 issued", tone: "neutral" },
                  selected.status >= 400
                    ? {
                        label: `Delivery failed (${selected.status})`,
                        detail: `Responded in ${selected.duration}`,
                        tone: "danger",
                      }
                    : {
                        label: "Delivered",
                        detail: `200 in ${selected.duration}`,
                        tone: "success",
                      },
                  ...(selected.attempts > 1
                    ? [
                        {
                          label: `Retry ${selected.attempts - 1}`,
                          detail: "Exponential backoff · next attempt in 30s",
                          tone: "warn",
                        },
                      ]
                    : []),
                ].map((step, index) => (
                  <li key={`${step.label}-${index}`} className="relative flex gap-2.5">
                    <span
                      className={cn(
                        "mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full",
                        step.tone === "danger"
                          ? "bg-danger"
                          : step.tone === "warn"
                            ? "bg-warn"
                            : step.tone === "success"
                              ? "bg-success"
                              : "bg-line-strong",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-semibold leading-tight">{step.label}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-surface px-2.5 py-2 text-[10.5px] leading-relaxed text-muted">
              <Icon name="shield" size={12} className="mt-[1px] shrink-0 text-brand" />
              Verify every request: compare the v1 signature against the raw body with your endpoint
              secret before trusting it.
            </p>

            <button
              type="button"
              onClick={() => onReplay(selected)}
              className="text-[10.5px] font-semibold text-brand hover:text-brand-deep"
            >
              Replay with a new signature
            </button>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
