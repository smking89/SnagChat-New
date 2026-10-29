import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Metrics, type Staff } from "./api";
import { ErrorState, Skeleton } from "./components/Cards";
import { LANDING_FOR, Shell, type PageId } from "./components/Shell";
import { Operations } from "./screens/Operations";
import { PlatformPulse } from "./screens/PlatformPulse";
import { Queue } from "./screens/Queue";
import { SignIn } from "./screens/SignIn";

export function App() {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [booting, setBooting] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [page, setPage] = useState<PageId>("platform");
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((found) => {
        if (cancelled) return;
        setStaff(found);
        setPage(LANDING_FOR[found.role]);
      })
      .catch(() => {
        /* signed out — the sign-in screen is the correct state */
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMetrics = useCallback(() => {
    if (!staff) return;
    setMetricsError(null);
    api
      .metrics()
      .then((next) => setMetrics(next))
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          setStaff(null);
          setMetrics(null);
          return;
        }
        setMetricsError(caught instanceof Error ? caught.message : "Could not load metrics");
      });
  }, [staff]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const signOut = () => {
    api
      .logout()
      .catch(() => undefined)
      .finally(() => {
        setStaff(null);
        setMetrics(null);
        setMetricsError(null);
      });
  };

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <img src="/brand/snagchat-icon.png" alt="" className="size-12 rounded-xl" />
          <p className="text-[13px] text-muted">Loading staff workspace…</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <SignIn
        onSignedIn={(found) => {
          setStaff(found);
          setPage(LANDING_FOR[found.role]);
        }}
      />
    );
  }

  return (
    <Shell
      staff={staff}
      metrics={metrics}
      page={page}
      collapsed={collapsed}
      navOpen={navOpen}
      onToggleCollapse={() => setCollapsed((value) => !value)}
      onToggleNav={() => setNavOpen((value) => !value)}
      onNavigate={setPage}
      onSignOut={signOut}
      onRefresh={loadMetrics}
    >
      {metricsError ? (
        <ErrorState message={metricsError} onRetry={loadMetrics} />
      ) : !metrics ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-line bg-card p-5">
              <Skeleton rows={3} />
            </div>
          ))}
        </div>
      ) : page === "platform" ? (
        <PlatformPulse metrics={metrics} />
      ) : page === "operations" ? (
        <Operations metrics={metrics} />
      ) : (
        <Queue metrics={metrics} staff={staff} />
      )}
    </Shell>
  );
}
