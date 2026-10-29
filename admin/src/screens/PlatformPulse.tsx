import type { Metrics, StaffRow } from "../api";
import { AttentionList, Chip, Panel, QueueStrip, StatCard } from "../components/Cards";
import { AreaChart, BarList, Donut } from "../components/Charts";
import { dateTime, money, relative } from "../format";

/** Superadmin landing: platform pulse, money and the staff roster. */
export function PlatformPulse({ metrics }: { metrics: Metrics }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.kpi.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <QueueStrip queues={metrics.queues} />

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Active players" meta="Last 30 days, daily rollup" className="xl:col-span-2">
          <AreaChart points={metrics.series.activity ?? []} />
        </Panel>
        <Panel title="Needs attention" meta="Deep links land next slice">
          <AttentionList items={metrics.attention} />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Reports by reason">
          <Donut segments={metrics.series.byReason ?? []} />
        </Panel>
        <Panel title="Posts by category">
          <BarList points={metrics.series.byCategory ?? []} />
        </Panel>
        <Panel title="Players by region">
          <BarList points={metrics.series.byRegion ?? []} />
        </Panel>
      </div>

      {metrics.revenue ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyTile label="GMV (30d)" value={money(metrics.revenue.gmvCents)} />
          <MoneyTile label="Platform fee (2.5%)" value={money(metrics.revenue.feeCents)} tone="success" />
          <MoneyTile
            label="Payouts action required"
            value={money(metrics.revenue.pendingPayoutCents)}
            tone="warning"
          />
          <MoneyTile label="Fee rate" value={`${(metrics.revenue.platformFeeRate * 100).toFixed(1)}%`} />
        </div>
      ) : null}

      {metrics.staff ? <StaffRoster rows={metrics.staff} /> : null}
    </div>
  );
}

function MoneyTile({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <article className="rounded-xl border border-line bg-card p-5">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">{label}</p>
      <p
        className={`tnum mt-2 font-display text-[24px] font-bold ${
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-ink"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function StaffRoster({ rows }: { rows: StaffRow[] }) {
  return (
    <Panel title="Staff roster" meta={`${rows.length} accounts`} bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] tracking-[0.08em] text-faint uppercase">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-3 py-3 font-semibold">Role</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 text-right font-semibold">Open assignments</th>
              <th className="px-5 py-3 text-right font-semibold">Last sign-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-brand-tint/60">
                <td className="px-5 py-3">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-[12px] text-muted">{row.email}</p>
                </td>
                <td className="px-3 py-3">
                  <Chip tone={row.role === "superadmin" ? "info" : row.role === "admin" ? "neutral" : "neutral"}>
                    {row.role}
                  </Chip>
                </td>
                <td className="px-3 py-3">
                  <Chip tone={row.status === "active" ? "success" : "danger"}>{row.status}</Chip>
                </td>
                <td className="tnum px-3 py-3 text-right">{row.assignedOpen ?? 0}</td>
                <td className="px-5 py-3 text-right text-muted" title={row.lastLoginAt ? dateTime(row.lastLoginAt) : ""}>
                  {row.lastLoginAt ? relative(row.lastLoginAt) : "never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
