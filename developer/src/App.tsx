import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { buttonClass } from "./components/ui";
import { PortalProvider } from "./lib/portal";
import { Link, RouterProvider, useRouter } from "./lib/router";
import { ChangelogPage, DocsPage } from "./pages/Docs";
import { Landing } from "./pages/Landing";
import { LegalPage, SignInPage, StatusPage } from "./pages/PublicPages";
import { ApiReference } from "./pages/docs/ApiReference";
import { AppPage, type AppTab } from "./pages/console/AppPage";
import { ApplicationsPage, AlertsPage, OAuthPage, SandboxPage, UsagePage } from "./pages/console/BuildPages";
import { Dashboard } from "./pages/console/Dashboard";
import { CataloguePage, EmbedsPage, InspectorPage } from "./pages/console/DomainPages";
import { AuditPage, BillingPage, SettingsPage, TeamPage } from "./pages/console/OrgPages";

const APP_TABS: AppTab[] = ["overview", "keys", "webhooks", "logs", "oauth", "usage", "settings"];

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "SnagChat Developers — build inside the feed"],
  [/^\/console$/, "Overview — SnagChat Developers"],
  [/^\/console\/applications$/, "Applications — SnagChat Developers"],
  [/^\/console\/oauth$/, "OAuth clients — SnagChat Developers"],
  [/^\/console\/sandbox$/, "Sandbox — SnagChat Developers"],
  [/^\/console\/catalogue$/, "Game catalogue — SnagChat Developers"],
  [/^\/console\/inspector$/, "Feed inspector — SnagChat Developers"],
  [/^\/console\/embeds$/, "Embeds — SnagChat Developers"],
  [/^\/console\/usage$/, "Usage — SnagChat Developers"],
  [/^\/console\/alerts$/, "Alerts — SnagChat Developers"],
  [/^\/console\/team$/, "Team — SnagChat Developers"],
  [/^\/console\/audit$/, "Audit log — SnagChat Developers"],
  [/^\/console\/billing$/, "Billing — SnagChat Developers"],
  [/^\/console\/settings$/, "Settings — SnagChat Developers"],
  [/^\/console\/apps\/[^/]+\/keys$/, "Keys — Night Shift Ingest"],
  [/^\/console\/apps\/[^/]+\/webhooks$/, "Webhooks — Night Shift Ingest"],
  [/^\/console\/apps\/[^/]+\/logs$/, "Request logs — Night Shift Ingest"],
  [/^\/console\/apps\/[^/]+\/oauth$/, "OAuth — Night Shift Ingest"],
  [/^\/console\/apps\/[^/]+\/usage$/, "Usage — Night Shift Ingest"],
  [/^\/console\/apps\/[^/]+\/settings$/, "Settings — Night Shift Ingest"],
  [/^\/console\/apps\/[^/]+\/overview$/, "Night Shift Ingest — SnagChat Developers"],
  [/^\/docs\/api/, "API reference — SnagChat Developers"],
  [/^\/docs/, "Docs — SnagChat Developers"],
  [/^\/status$/, "Status — SnagChat Developers"],
  [/^\/changelog$/, "Changelog — SnagChat Developers"],
  [/^\/legal\/terms$/, "Developer Terms — SnagChat"],
  [/^\/legal\/privacy$/, "Developer Privacy — SnagChat"],
  [/^\/signin$/, "Sign in — SnagChat Developers"],
];

/**
 * The portal is a desktop tool: the console rail, the delivery drawer and the two-pane
 * reference all assume a wide screen. Below this width we say so instead of pretending
 * the layout works, and let a curious visitor scroll sideways anyway.
 */
const DESKTOP_MIN_WIDTH = 1100;

export default function App() {
  return (
    <DesktopOnly>
      <RouterProvider>
        <PortalProvider>
          <Shell />
        </PortalProvider>
      </RouterProvider>
    </DesktopOnly>
  );
}

function DesktopOnly({ children }: { children: ReactNode }) {
  const [fits, setFits] = useState(
    () => typeof window === "undefined" || window.innerWidth >= DESKTOP_MIN_WIDTH,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onResize = () => setFits(window.innerWidth >= DESKTOP_MIN_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (fits || dismissed) return <div className="app-frame">{children}</div>;

  return (
    <div className="grid min-h-screen place-items-center bg-brand-tint px-6 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-7 shadow-[0_24px_60px_-32px_rgba(23,25,29,0.3)]">
        <img src="/brand/snagchat-wordmark.png" alt="SnagChat" className="h-7 w-auto" />
        <p className="mt-6 text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Desktop only
        </p>
        <h1 className="mt-2 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.04em]">
          The developer portal is a desktop tool.
        </h1>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          The console rail, the delivery drawer and the two-pane reference are built for a screen
          at least {DESKTOP_MIN_WIDTH}px wide. Open this on a desktop to create a key, replay a
          delivery or copy a snippet.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <a href="https://snagchat.io" className={buttonClass("primary", "md", "h-9")}>
            Back to SnagChat
          </a>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className={buttonClass("secondary", "md", "h-9")}
          >
            View it anyway
          </button>
        </div>
        <p className="mt-3 text-[11px] text-faint">Viewing anyway scrolls sideways — panels stay desktop-sized.</p>
      </div>
    </div>
  );
}

function Shell() {
  const { path } = useRouter();
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(path));
    document.title = match?.[1] ?? "SnagChat Developers";
  }, [path]);

  const openSearch = () => setSearch(true);

  const appMatch = path.match(/^\/console\/apps\/[^/]+\/([^/]+)$/);
  const tab = appMatch?.[1] as AppTab | undefined;
  const isAppTab = Boolean(tab && APP_TABS.includes(tab));
  const docSlug =
    path.startsWith("/docs/") && !path.startsWith("/docs/api")
      ? path.slice("/docs/".length)
      : null;

  const consolePages: Record<string, ReactNode> = {
    "/console/applications": <ApplicationsPage onSearch={openSearch} />,
    "/console/oauth": <OAuthPage onSearch={openSearch} />,
    "/console/sandbox": <SandboxPage onSearch={openSearch} />,
    "/console/catalogue": <CataloguePage onSearch={openSearch} />,
    "/console/inspector": <InspectorPage onSearch={openSearch} />,
    "/console/embeds": <EmbedsPage onSearch={openSearch} />,
    "/console/usage": <UsagePage onSearch={openSearch} />,
    "/console/alerts": <AlertsPage onSearch={openSearch} />,
    "/console/team": <TeamPage onSearch={openSearch} />,
    "/console/audit": <AuditPage onSearch={openSearch} />,
    "/console/billing": <BillingPage onSearch={openSearch} />,
    "/console/settings": <SettingsPage onSearch={openSearch} />,
  };

  const known =
    path === "/" ||
    path === "/console" ||
    Boolean(consolePages[path]) ||
    isAppTab ||
    path.startsWith("/docs/") ||
    path === "/status" ||
    path === "/changelog" ||
    path === "/legal/terms" ||
    path === "/legal/privacy" ||
    path === "/signin";

  return (
    <>
      {path === "/" ? <Landing onSearch={openSearch} /> : null}
      {path === "/console" ? <Dashboard onSearch={openSearch} /> : null}
      {consolePages[path] ?? null}
      {isAppTab && tab ? <AppPage tab={tab} onSearch={openSearch} /> : null}
      {path.startsWith("/docs/api") ? <ApiReference onSearch={openSearch} /> : null}
      {docSlug ? <DocsPage slug={docSlug} onSearch={openSearch} /> : null}
      {path === "/status" ? <StatusPage onSearch={openSearch} /> : null}
      {path === "/changelog" ? <ChangelogPage onSearch={openSearch} /> : null}
      {path === "/legal/terms" ? <LegalPage doc="terms" /> : null}
      {path === "/legal/privacy" ? <LegalPage doc="privacy" /> : null}
      {path === "/signin" ? <SignInPage /> : null}
      {!known ? <NotFound /> : null}
      <CommandPalette open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-2 px-6 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white text-brand">
        <img src="/brand/snagchat-icon.png" alt="" className="h-6 w-auto" />
      </span>
      <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">404</p>
      <h1 className="mt-1.5 font-display text-[26px] font-extrabold tracking-[-0.04em]">
        That page is not in the portal.
      </h1>
      <p className="mt-2 max-w-[42ch] text-[12.5px] leading-relaxed text-muted">
        Check the console rail or the docs nav — every destination in the portal is a real page in
        this build.
      </p>
      <div className="mt-5 flex gap-2">
        <Link to="/console" className={buttonClass("primary", "sm", "h-8")}>
          Open the console
        </Link>
        <Link to="/docs/api/create-snag" className={buttonClass("secondary", "sm", "h-8")}>
          Read the reference
        </Link>
      </div>
    </div>
  );
}
