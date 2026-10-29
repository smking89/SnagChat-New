import type { Metrics } from "../api";
import { AttentionList, Panel, QueueStrip, StatCard } from "../components/Cards";
import { AreaChart, BarList, Donut } from "../components/Charts";

/** Admin landing: content supply, community health and the escalation inbox. */
export function Operations({ metrics }: { metrics: Metrics }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.kpi.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <QueueStrip queues={metrics.queues} />

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Posting activity" meta="Posts per day, last 30 days" className="xl:col-span-2">
          <AreaChart points={metrics.series.activity ?? []} valueKey="posts" />
        </Panel>
        <Panel title="Needs attention">
          <AttentionList items={metrics.attention} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Posts by category">
          <BarList points={metrics.series.byCategory ?? []} />
        </Panel>
        <Panel title="Reports by reason">
          <Donut segments={metrics.series.byReason ?? []} />
        </Panel>
        <Panel title="Escalation hand-off" meta="How escalations reach you">
          <ul className="space-y-3 text-[13px] text-muted">
            <li className="flex items-start gap-3">
              <span className="tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[11px] font-bold text-brand">
                1
              </span>
              <span>A moderator escalates a report with a note instead of deciding it.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[11px] font-bold text-brand">
                2
              </span>
              <span>It lands in your Escalations queue with the SLA clock intact.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-tint text-[11px] font-bold text-brand">
                3
              </span>
              <span>You restore, remove or hand it to a superadmin — every step is audited.</span>
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
