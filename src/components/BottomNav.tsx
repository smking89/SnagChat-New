import { SHOP_ENABLED } from "../lib/features";
import type { NavTab } from "../types";
import { Icon } from "./Icon";

type BottomNavProps = {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onCreate: () => void;
  unreadCount: number;
};

type NavIcon = "home" | "compass" | "dm" | "user" | "shop";

const ITEMS: { tab: NavTab; label: string; icon: NavIcon }[] = [
  { tab: "home", label: "Home", icon: "home" },
  { tab: "discover", label: "Discover", icon: "compass" },
  { tab: "shop", label: "Shop", icon: "shop" },
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
  icon: NavIcon;
  isActive: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[10.5px] font-semibold transition-colors ${
        isActive ? "text-brand" : "text-ink hover:text-brand"
      }`}
    >
      <span className="relative grid h-8 w-10 place-items-center">
        <Icon name={icon} size={24} strokeWidth={isActive ? 2.1 : 1.8} />
        {badge > 0 ? (
          <span className="absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  );
}

export function BottomNav({ activeTab, onNavigate, onCreate, unreadCount }: BottomNavProps) {
  // The storefront is parked, so its tab comes out and the create button stays
  // centred between the tabs that are left.
  const items = ITEMS.filter((item) => SHOP_ENABLED || item.tab !== "shop");
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  const renderItem = (item: (typeof items)[number]) => (
    <NavItem
      key={item.tab}
      {...item}
      isActive={activeTab === item.tab}
      badge={item.tab === "messages" ? unreadCount : 0}
      onClick={() => onNavigate(item.tab)}
    />
  );

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="mx-auto grid max-w-[560px] items-center px-2 pt-2"
        style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
      >
        {left.map(renderItem)}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCreate}
            aria-label="Create a snag"
            className="-mt-5 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-brand text-white shadow-[0_6px_16px_rgba(23,25,29,0.22)] transition-colors hover:bg-brand-deep active:scale-[0.97]"
          >
            <Icon name="plus" size={28} strokeWidth={2.2} />
          </button>
        </div>

        {right.map(renderItem)}
      </div>
    </nav>
  );
}
