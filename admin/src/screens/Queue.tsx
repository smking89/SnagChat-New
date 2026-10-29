import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Metrics, type Report, type ReportList, type Staff } from "../api";
import { AttentionList, Chip, EmptyState, ErrorState, Panel, QueueStrip, Skeleton, StatCard } from "../components/Cards";
import { Donut, BarList } from "../components/Charts";
import { relative, severityTone, slaText, statusTone, toneClasses } from "../format";

/**
 * Moderator landing: the queue itself, not a dashboard about the queue.
 * KPIs describe this moderator's workload; the table is the work.
 */
export function Queue({ metrics, staff }: { metrics: Metrics; staff: Staff }) {
  const [list, setList] = useState<ReportList | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPhase("loading");
    try {
      const data = await api.reports({ status: "all", limit: 15 });
      setList(data);
      setPhase("ready");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the queue");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleClaim = async (report: Report) => {
    const mine = report.assignedTo?.id === staff.id;
    setBusyId(report.id);
    setError(null);
    try {
      await api.claim(report.id, !mine);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update the claim");
      setPhase("ready");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.kpi.map((kpi) => (
          <StatCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <QueueStrip queues={metrics.queues} />

      {error && phase === "ready" ? (
        <p role="alert" className="rounded-lg bg-[#fdeceb] px-4 py-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Reports"
          meta={list ? `${list.total} total · showing ${list.items.length}` : "loading"}
          className="xl:col-span-2"
          bodyClassName="p-0"
        >
          {phase === "loading" ? (
            <div className="p-5">
              <Skeleton rows={6} />
            </div>
          ) : phase === "error" ? (
            <div className="p-5">
              <ErrorState message={error ?? "Could not load the queue"} onRetry={() => void load()} />
            </div>
          ) : list && list.items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Queue clear"
                hint="No open reports right now. New reports arrive here the moment a player files one."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-[0.08em] text-faint uppercase">
                    <th className="px-5 py-3 font-semibold">Severity</th>
                    <th className="px-3 py-3 font-semibold">Report</th>
                    <th className="px-3 py-3 font-semibold">Content</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">SLA</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(list?.items ?? []).map((report) => {
                    const mine = report.assignedTo?.id === staff.id;
                    const sla = slaText(report.slaDueAt, report.status === "resolved");
                    return (
                      <tr key={report.id} className="transition-colors hover:bg-brand-tint/60">
                        <td className="px-5 py-3 align-top">
                          <Chip tone={severityTone[report.severity]}>{report.severity}</Chip>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="font-medium">
                            {report.reason}
                            {report.mode === "ad" ? (
                              <span className="ml-2 rounded bg-[#f1f2f4] px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                                AD
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[12px] text-muted">
                            {report.reporterCount} report{report.reporterCount === 1 ? "" : "s"} ·{" "}
                            {relative(report.createdAt)}
                            {report.detail ? ` · ${report.detail}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="max-w-[240px] truncate font-medium" title={report.content.title}>
                            {report.content.title}
                          </p>
                          <p className="text-[12px] text-muted">
                            @{report.content.author.handle} · {report.content.game} ·{" "}
                            {report.content.state === "allow"
                              ? "visible"
                              : report.content.state === "interstitial"
                                ? "labeled"
                                : "hidden"}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Chip tone={statusTone[report.status]}>{report.status}</Chip>
                          {report.assignedTo ? (
                            <p className="mt-1 text-[12px] text-muted">{mine ? "you" : report.assignedTo.name}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span
                            className={`text-[12px] font-semibold ${
                              sla.tone === "danger"
                                ? "text-danger"
                                : sla.tone === "warning"
                                  ? "text-warning"
                                  : "text-muted"
                            }`}
                          >
                            {sla.label}
                          </span>
                          <p className="text-[12px] text-faint">{relative(report.updatedAt)}</p>
                        </td>
                        <td className="px-5 py-3 text-right align-top">
                          {report.status === "resolved" ? (
                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${toneClasses.success}`}>
                              {report.resolution}
                            </span>
                          ) : report.assignedTo && !mine ? (
                            <span className="text-[12px] text-faint" title={report.assignedTo.name ?? ""}>
                              held
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === report.id}
                              onClick={() => void toggleClaim(report)}
                              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-60 ${
                                mine
                                  ? "border border-line text-muted hover:bg-surface"
                                  : "bg-brand text-white hover:bg-brand-deep"
                              }`}
                            >
                              {busyId === report.id ? "…" : mine ? "Release" : "Claim"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Needs attention">
            <AttentionList items={metrics.attention} />
          </Panel>
          <Panel title="Open reports by reason">
            <Donut segments={metrics.series.byReason ?? []} />
          </Panel>
          <Panel title="By status">
            <BarList points={metrics.series.byStatus ?? []} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
