import type { NavTab } from "../types";
import { Icon } from "./Icon";

type BottomNavProps = {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onCreate: () => void;
  unreadCount: number;
};

const ITEMS: { tab: NavTab; label: string; icon: "home" | "compass" | "dm" | "user" }[] = [
  { tab: "home", label: "Home", icon: "home" },
  { tab: "discover", label: "Discover", icon: "compass" },
  { tab: "messages", label: "Messages", icon: "dm" },
  { tab: "profile", label: "Profile", icon: "user" },
];

function NavItem({
  label,
  icon,
  isActive,
  badge = 0,
  onClick,
}: {
  label: string;
  icon: "home" | "compass" | "dm" | "user";
  isActive: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold transition-colors ${
        isActive ? "text-brand" : "text-ink hover:text-brand"
      }`}
    >
      <span className="relative grid h-7 w-9 place-items-center">
        <Icon name={icon} size={19} strokeWidth={isActive ? 2.1 : 1.8} />
        {badge > 0 ? (
          <span className="absolute -right-0.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-brand px-1 text-[8px] font-bold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  );
}

export function BottomNav({ activeTab, onNavigate, onCreate, unreadCount }: BottomNavProps) {
  const [home, discover, messages, profile] = ITEMS;

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-[520px] grid-cols-5 items-center px-2 pt-2">
        <NavItem {...home} isActive={activeTab === home.tab} onClick={() => onNavigate(home.tab)} />
        <NavItem {...discover} isActive={activeTab === discover.tab} onClick={() => onNavigate(discover.tab)} />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCreate}
            aria-label="Create a snag"
            className="-mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-[0_6px_16px_rgba(23,25,29,0.22)] transition-colors hover:bg-brand-deep active:scale-[0.97]"
          >
            <Icon name="plus" size={24} strokeWidth={2.2} />
          </button>
        </div>

        <NavItem
          {...messages}
          isActive={activeTab === messages.tab}
          badge={unreadCount}
          onClick={() => onNavigate(messages.tab)}
        />
        <NavItem {...profile} isActive={activeTab === profile.tab} onClick={() => onNavigate(profile.tab)} />
      </div>
    </nav>
  );
}
