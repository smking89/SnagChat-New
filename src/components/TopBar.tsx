import { useEffect, useRef, type Ref } from "react";
import type { NavTab } from "../types";
import { Icon } from "./Icon";

const NAV_LINKS: { tab: NavTab; label: string }[] = [
  { tab: "home", label: "Home" },
  { tab: "discover", label: "Discover" },
  { tab: "shop", label: "Shop" },
  { tab: "messages", label: "Messages" },
  { tab: "squads", label: "Squads" },
  { tab: "profile", label: "Profile" },
];

type TopBarProps = {
  rootRef?: Ref<HTMLElement>;
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onCreate: () => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  unreadCount: number;
  notificationCount: number;
  onOpenNotifications: () => void;
  /** A demo session can turn into a real account from anywhere in the app. */
  demoSession?: boolean;
  onSignIn?: () => void;
};

export function TopBar({
  rootRef,
  activeTab,
  onNavigate,
  onCreate,
  searchOpen,
  onToggleSearch,
  query,
  onQueryChange,
  unreadCount,
  notificationCount,
  onOpenNotifications,
  demoSession = false,
  onSignIn,
}: TopBarProps) {
  const headerRef = useRef<HTMLElement | null>(null);

  // The sticky tab rail sits directly under this header, whose height changes
  // when search opens. Publish the real height so the two never overlap.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const sync = () =>
      document.documentElement.style.setProperty(
        "--topbar-h",
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--topbar-h");
    };
  }, []);

  const setHeaderRef = (node: HTMLElement | null) => {
    headerRef.current = node;
    if (typeof rootRef === "function") rootRef(node);
    else if (rootRef) (rootRef as { current: HTMLElement | null }).current = node;
  };

  return (
    // Sticky from lg up so the desktop navigation never scrolls away; the tab
    // rail below parks itself under the header at that size.
    <header
      ref={setHeaderRef}
      className="relative z-40 border-b border-line/80 bg-white/92 backdrop-blur-xl lg:sticky lg:top-0"
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex shrink-0 items-center rounded-xl text-left"
          aria-label="SnagChat home"
        >
          <img
            src="/brand/snagchat-icon.png"
            alt="SnagChat"
            width={512}
            height={512}
            className="h-10 w-auto xl:hidden"
          />
          <img
            src="/brand/snagchat-wordmark.png"
            alt="SnagChat"
            width={445}
            height={201}
            className="hidden h-11 w-auto xl:block"
          />
        </button>

        <nav aria-label="Primary" className="ml-5 hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(({ tab, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onNavigate(tab)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-colors ${
                  isActive ? "text-brand" : "text-ink hover:text-brand"
                }`}
              >
                {label}
                {tab === "messages" && unreadCount > 0 ? (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSearch}
            aria-expanded={searchOpen}
            aria-label={searchOpen ? "Close search" : "Search snags"}
            className={`grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition-colors ${
              searchOpen ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name={searchOpen ? "close" : "search"} size={22} />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={
              notificationCount > 0
                ? `Notifications, ${notificationCount} unread`
                : "Notifications"
            }
            className={`relative grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition-colors ${
              notificationCount > 0 ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name="bell" size={22} />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white">
                {notificationCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onNavigate("shop")}
            aria-label="Shop"
            className={`grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition-colors lg:hidden ${
              activeTab === "shop" ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name="shop" size={22} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("squads")}
            aria-label="Squads"
            className={`grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition-colors ${
              activeTab === "squads" ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name="users" size={22} />
          </button>

          {demoSession && onSignIn ? (
            <button
              type="button"
              onClick={onSignIn}
              className="h-10 shrink-0 rounded-full border border-brand px-3 text-[11.5px] font-semibold text-brand transition-colors hover:bg-brand-soft"
            >
              Log in
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCreate}
            className="hidden h-10 items-center gap-1.5 rounded-full bg-brand pl-3 pr-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-deep lg:inline-flex"
          >
            <Icon name="plus" size={16} strokeWidth={2.1} />
            Create
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-line/80 bg-white">
          <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 rounded-xl bg-surface px-3 focus-within:ring-2 focus-within:ring-brand/30">
              <Icon name="search" size={17} className="shrink-0 text-faint" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search snags, games, creators"
                aria-label="Search snags"
                className="h-11 w-full appearance-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  aria-label="Clear search"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e6e8eb] text-[#4d535c]"
                >
                  <Icon name="close" size={12} strokeWidth={2.4} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
