import type { Ref } from "react";
import type { NavTab } from "../types";
import { Icon } from "./Icon";

const NAV_LINKS: { tab: NavTab; label: string }[] = [
  { tab: "home", label: "Home" },
  { tab: "discover", label: "Discover" },
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
}: TopBarProps) {
  return (
    <header ref={rootRef} className="sticky top-0 z-40 border-b border-line/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-3 px-4 sm:px-6">
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
            className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition-colors ${
              searchOpen ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name={searchOpen ? "close" : "search"} size={18} />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={
              notificationCount > 0
                ? `Notifications, ${notificationCount} unread`
                : "Notifications"
            }
            className={`relative grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition-colors ${
              notificationCount > 0 ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name="bell" size={18} />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white">
                {notificationCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onNavigate("squads")}
            aria-label="Squads"
            className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition-colors ${
              activeTab === "squads" ? "text-brand" : "text-ink hover:border-[#d8dce1] hover:text-brand"
            }`}
          >
            <Icon name="users" size={18} />
          </button>

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
          <div className="mx-auto max-w-[1080px] px-4 py-3 sm:px-6">
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
