/**
 * The shared admin shell: one layout for all three roles, with the nav scoped
 * by role. Sections marked `soon` show the intended information architecture
 * and are not yet clickable — only role landings exist in this slice.
 */
import type { ReactNode } from "react";
import type { Metrics, Role, Staff } from "../api";

export type PageId = "platform" | "operations" | "queue";

interface NavItem {
  label: string;
  page?: PageId;
  soon?: boolean;
  badge?: "open" | "escalated" | "slaBreached";
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

export const LANDING_FOR: Record<Role, PageId> = {
  superadmin: "platform",
  admin: "operations",
  moderator: "queue",
};

const REPORT_QUEUE_ITEM: NavItem = { label: "Reports queue", soon: true, badge: "open" };

export const NAV: Record<Role, NavSection[]> = {
  superadmin: [
    {
      heading: "Dashboards",
      items: [
        { label: "Platform pulse", page: "platform" },
        { label: "Growth & retention", soon: true },
      ],
    },
    {
      heading: "Trust & Safety",
      items: [REPORT_QUEUE_ITEM, { label: "Appeals", soon: true }, { label: "Policy & reasons", soon: true }],
    },
    {
      heading: "People",
      items: [
        { label: "Players", soon: true },
        { label: "Verifications", soon: true },
        { label: "Staff & roles", soon: true },
      ],
    },
    {
      heading: "Commerce",
      items: [
        { label: "Marketplace & payouts", soon: true },
        { label: "Advertising", soon: true },
      ],
    },
    {
      heading: "Platform",
      items: [
        { label: "Audit log", soon: true },
        { label: "Feature flags & limits", soon: true },
      ],
    },
  ],
  admin: [
    {
      heading: "Dashboards",
      items: [
        { label: "Operations", page: "operations" },
        { label: "Content & feed", soon: true },
      ],
    },
    {
      heading: "Community",
      items: [
        { label: "Players", soon: true },
        { label: "Squads", soon: true },
        { label: "Verifications", soon: true },
      ],
    },
    {
      heading: "Creators",
      items: [
        { label: "Applications", soon: true },
        { label: "Community drops", soon: true },
        { label: "Payouts (read only)", soon: true },
      ],
    },
    {
      heading: "Advertising",
      items: [
        { label: "Campaign pipeline", soon: true },
        { label: "Creatives", soon: true },
      ],
    },
    {
      heading: "Trust & Safety",
      items: [
        { label: "Escalations", soon: true, badge: "escalated" },
        { label: "Reports (read only)", soon: true },
      ],
    },
  ],
  moderator: [
    {
      heading: "Queue",
      items: [
        { label: "My queue", page: "queue", badge: "open" },
        { label: "Escalated", soon: true, badge: "escalated" },
        { label: "Ad review", soon: true },
        { label: "Appeals", soon: true },
      ],
    },
    {
      heading: "Reference",
      items: [{ label: "Handbook", soon: true }, { label: "My decisions", soon: true }],
    },
  ],
};

const PAGE_TITLES: Record<PageId, { heading: string; title: string }> = {
  platform: { heading: "Dashboards", title: "Platform pulse" },
  operations: { heading: "Dashboards", title: "Operations" },
  queue: { heading: "Queue", title: "My queue" },
};

interface ShellProps {
  staff: Staff;
  metrics: Metrics | null;
  page: PageId;
  collapsed: boolean;
  navOpen: boolean;
  onToggleCollapse: () => void;
  onToggleNav: () => void;
  onNavigate: (page: PageId) => void;
  onSignOut: () => void;
  onRefresh: () => void;
  children: ReactNode;
}

export function Shell({
  staff,
  metrics,
  page,
  collapsed,
  navOpen,
  onToggleCollapse,
  onToggleNav,
  onNavigate,
  onSignOut,
  onRefresh,
  children,
}: ShellProps) {
  const sections = NAV[staff.role];
  const current = PAGE_TITLES[page];
  const badgeValue = (item: NavItem) =>
    item.badge && metrics ? metrics.queues[item.badge] : undefined;

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-line bg-card transition-[width,transform] duration-200 md:static ${
          collapsed ? "w-[72px]" : "w-[264px]"
        } ${navOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className={`flex h-16 items-center gap-3 border-b border-line ${collapsed ? "justify-center px-0" : "px-5"}`}>
          <img src="/brand/snagchat-icon.png" alt="" className="size-8 rounded-lg" />
          {collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate font-display text-[14px] leading-tight font-bold">SnagChat</p>
              <p className="text-[11px] tracking-[0.08em] text-faint uppercase">Staff admin</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sections">
          {sections.map((section) => (
            <div key={section.heading} className="mb-5">
              {collapsed ? (
                <div className="mx-2 mb-2 h-px bg-line" />
              ) : (
                <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = item.page === page;
                  const badge = badgeValue(item);
                  const label = collapsed ? (
                    <span className="truncate" title={item.label}>
                      {item.label}
                    </span>
                  ) : null;
                  return (
                    <li key={item.label}>
                      {item.page ? (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate(item.page as PageId);
                            onToggleNav();
                          }}
                          aria-current={active ? "page" : undefined}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                            active
                              ? "bg-brand-tint text-brand"
                              : "text-[#4d535c] hover:bg-[#f6f7f8] hover:text-ink"
                          } ${collapsed ? "justify-center" : ""}`}
                        >
                          {label ?? (
                            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                              <span className="truncate">{item.label}</span>
                              {badge ? <Badge count={badge} /> : null}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-faint ${
                            collapsed ? "justify-center" : ""
                          }`}
                          title={`${item.label} — planned`}
                        >
                          <span className="truncate">{item.label}</span>
                          {collapsed ? null : <SoonChip />}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full items-center justify-center rounded-lg border border-line py-2 text-[12px] font-medium text-muted transition-colors hover:bg-surface md:flex"
          >
            {collapsed ? "→" : "Collapse"}
          </button>
        </div>
      </aside>

      {navOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onToggleNav}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-line bg-card/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={onToggleNav}
            className="rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-muted md:hidden"
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] tracking-[0.08em] text-faint uppercase">{current.heading}</p>
            <h1 className="truncate font-display text-[16px] font-semibold">{current.title}</h1>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="hidden rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface sm:block"
          >
            Refresh
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] leading-tight font-medium">{staff.name}</p>
              <p className="text-[11px] tracking-[0.06em] text-faint uppercase">{staff.role}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">
              {staff.name.slice(0, 1).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="tnum shrink-0 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SoonChip() {
  return (
    <span className="shrink-0 rounded-full bg-[#f1f2f4] px-1.5 py-0.5 text-[10px] font-semibold text-[#8b9099]">
      Soon
    </span>
  );
}
