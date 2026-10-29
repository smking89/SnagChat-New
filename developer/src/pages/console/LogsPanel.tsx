import { useState } from "react";
import { Icon } from "../../components/Icon";
import { MethodChip, Panel, PanelHead, Pill, cn } from "../../components/ui";
import { LOGS } from "../../data/portal";
import { usePortal } from "../../lib/portal";

type Filter = "all" | "errors";

export function LogsPanel() {
  const { toast } = usePortal();
  const [filter, setFilter] = useState<Filter>("all");
  const errors = LOGS.filter((row) => row.status >= 400);
  const rows = filter === "errors" ? errors : LOGS;

  const copyId = async (requestId: string) => {
    try {
      await navigator.clipboard.writeText(requestId);
      toast("Request id copied", requestId);
    } catch {
      toast("Could not copy", "Your browser blocked clipboard access.");
    }
  };

  return (
    <Panel>
      <PanelHead
        title="Requests"
        hint={`Last 24 hours · ${filter === "errors" ? errors.length : LOGS.length} shown`}
        action={
          <div className="flex rounded-lg border border-line p-0.5">
            {(
              [
                ["all", "All"],
                ["errors", `Errors ${errors.length}`],
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
        }
      />

      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
              <th className="px-4 py-2 font-bold">Time</th>
              <th className="px-4 py-2 font-bold">Method</th>
              <th className="px-4 py-2 font-bold">Route</th>
              <th className="px-4 py-2 font-bold">Status</th>
              <th className="px-4 py-2 font-bold">Duration</th>
              <th className="px-4 py-2 font-bold">Request id</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.requestId} className="transition-colors hover:bg-surface/50">
                <td className="num px-4 py-2 font-mono text-[10.5px] text-muted">{row.at}</td>
                <td className="px-4 py-2">
                  <MethodChip method={row.method} />
                </td>
                <td className="px-4 py-2 font-mono text-[10.5px] text-ink-soft">{row.route}</td>
                <td className="px-4 py-2">
                  <Pill
                    tone={
                      row.status < 300 ? "success" : row.status < 400 ? "warn" : "danger"
                    }
                  >
                    {row.status}
                  </Pill>
                </td>
                <td className="num px-4 py-2 font-mono text-[10.5px] text-muted">{row.ms}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => copyId(row.requestId)}
                    className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted transition-colors hover:text-brand"
                    title="Copy request id"
                  >
                    {row.requestId}
                    <Icon
                      name="copy"
                      size={11}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <p className="text-[10.5px] text-faint">
          Logs are kept for 7 days. Every error row carries the id support asks for.
        </p>
        <p className="font-mono text-[10px] text-faint">api.snagchat.io · v1</p>
      </div>
    </Panel>
  );
}
