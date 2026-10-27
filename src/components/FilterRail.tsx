import { CATEGORIES, type FeedFilter } from "../data/snags";

type FilterRailProps = {
  active: FeedFilter;
  top: number;
  onChange: (filter: FeedFilter) => void;
};

export function FilterRail({ active, top, onChange }: FilterRailProps) {
  return (
    <div
      className="sticky z-30 -mx-4 border-b border-line/80 bg-white/92 px-4 backdrop-blur-xl sm:mx-0 sm:px-0"
      style={{ top }}
    >
      <div
        role="group"
        aria-label="Filter snags"
        data-swipe-ignore="true"
        className="no-scrollbar flex items-center gap-2 overflow-x-auto overscroll-x-contain py-3"
      >
        {CATEGORIES.map((category) => {
          const isActive = category === active;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(category)}
              className={`shrink-0 rounded-full border px-3.5 py-[7px] text-[11.5px] font-semibold transition-colors ${
                isActive
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-[#646a74] hover:border-[#d8dce1] hover:text-ink"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
