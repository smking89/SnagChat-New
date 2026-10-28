import type { ReactNode } from "react";
import type { FrameUse } from "../data/frames";
import type { Player } from "../data/players";
import type { StoryGroupView, StoryItem } from "../data/stories";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

type StoriesRailProps = {
  myAuthor: Player;
  myItems: StoryItem[];
  myAvatarFrame?: FrameUse;
  groups: StoryGroupView[];
  /** Story item ids that have been watched. */
  seen: string[];
  onOpen: (authorId: string) => void;
  onAdd: () => void;
};

function Ring({ unseen, children }: { unseen: boolean; children: ReactNode }) {
  return (
    <span
      className={`story-ring block rounded-full p-[2.5px] ${
        unseen ? "story-ring-unseen" : "story-ring-seen"
      }`}
    >
      <span className="block rounded-full bg-white p-[2px]">{children}</span>
    </span>
  );
}

function RailLabel({ children, strong }: { children: ReactNode; strong: boolean }) {
  return (
    <span
      className={`mt-1.5 block w-full truncate text-center text-[10px] ${
        strong ? "font-bold text-ink" : "font-semibold text-[#4d535c]"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * The 24-hour rail above the feed. Your own story is always first and carries
 * the add control; everyone else's ring fills in purple until every story in
 * their run has been watched.
 */
export function StoriesRail({
  myAuthor,
  myItems,
  myAvatarFrame,
  groups,
  seen,
  onOpen,
  onAdd,
}: StoriesRailProps) {
  const myUnseen = myItems.some((item) => !seen.includes(item.id));

  return (
    <section aria-label="Stories" className="mt-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-brand">
          Stories · 24h
        </p>
        <p className="hidden text-[10px] text-faint sm:block">Tap a ring to watch</p>
      </div>

      <div className="-m-2 flex items-start gap-3 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative w-[72px] shrink-0">
          <button
            type="button"
            onClick={() => (myItems.length > 0 ? onOpen(myAuthor.id) : onAdd())}
            aria-label={
              myItems.length > 0
                ? "Watch your story"
                : "Add your first story"
            }
            className="flex w-full flex-col items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Ring unseen={myItems.length > 0 && myUnseen}>
              <Avatar
                name={myAuthor.name}
                size={56}
                tone="brand"
                src={myAuthor.avatar}
                frame={myAvatarFrame}
              />
            </Ring>
            <RailLabel strong={myItems.length > 0 && myUnseen}>Your story</RailLabel>
          </button>

          <button
            type="button"
            onClick={onAdd}
            aria-label="Add to your story"
            className="absolute right-0 top-[41px] grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white bg-brand text-white shadow-sm transition-colors hover:bg-brand-deep"
          >
            <Icon name="plus" size={11} strokeWidth={2.6} />
          </button>
        </div>

        {groups.map((group) => {
          const unseen = group.items.some((item) => !seen.includes(item.id));
          return (
            <button
              key={group.authorId}
              type="button"
              onClick={() => onOpen(group.authorId)}
              aria-label={`Watch ${group.author.name}'s story${unseen ? ", unseen" : ""}`}
              className="flex w-[72px] shrink-0 flex-col items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="relative">
                <Ring unseen={unseen}>
                  <Avatar
                    name={group.author.name}
                    size={56}
                    tone="soft"
                    src={group.author.avatar}
                    frame={group.avatarFrame}
                  />
                </Ring>
                {unseen ? (
                  <span className="absolute right-0 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
                ) : null}
              </span>
              <RailLabel strong={unseen}>{group.author.name}</RailLabel>
            </button>
          );
        })}
      </div>
    </section>
  );
}
