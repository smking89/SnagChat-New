import { useEffect, useRef, useState } from "react";
import type { StoryGroupView } from "../data/stories";
import { formatRelative } from "../data/threads";
import { useOverlay } from "../lib/overlay";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

/** Matches the story-progress animation in index.css. */
const STORY_DURATION_MS = 6000;

type StoryViewerProps = {
  groups: StoryGroupView[];
  startAuthorId: string;
  /** The signed-in player, so their own run reads as "Your story". */
  meId?: string;
  /** Item to open first, usually the first unwatched one. */
  startItem?: number;
  onSeen: (itemIds: string[]) => void;
  onOpenSnag?: (snagId: string) => void;
  onClose: () => void;
};

export function StoryViewer({
  groups,
  startAuthorId,
  meId,
  startItem = 0,
  onSeen,
  onOpenSnag,
  onClose,
}: StoryViewerProps) {
  const startGroup = Math.max(
    0,
    groups.findIndex((group) => group.authorId === startAuthorId),
  );
  const [groupIndex, setGroupIndex] = useState(startGroup);
  const [itemIndex, setItemIndex] = useState(
    Math.min(startItem, Math.max(0, (groups[startGroup]?.items.length ?? 1) - 1)),
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const marked = useRef<Set<string>>(new Set());
  useOverlay(panelRef, onClose);

  const group = groups[groupIndex];
  const item = group?.items[itemIndex];

  const next = () => {
    if (!group) return onClose();
    if (itemIndex + 1 < group.items.length) {
      setItemIndex(itemIndex + 1);
      return;
    }
    if (groupIndex + 1 < groups.length) {
      setGroupIndex(groupIndex + 1);
      setItemIndex(0);
      return;
    }
    onClose();
  };

  const previous = () => {
    if (!group) return onClose();
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
      return;
    }
    if (groupIndex > 0) {
      const previousGroup = groups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setItemIndex(Math.max(0, (previousGroup?.items.length ?? 1) - 1));
    }
  };

  // A story advances on its own, the way a tapped-through story should.
  useEffect(() => {
    if (!item) return;
    const timer = window.setTimeout(next, STORY_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [groupIndex, itemIndex]);

  // Watching an item clears its ring; the ref keeps the parent setter from
  // being called twice for the same item while the viewer re-renders.
  useEffect(() => {
    if (!item || marked.current.has(item.id)) return;
    marked.current.add(item.id);
    onSeen([item.id]);
  }, [item, onSeen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [groupIndex, itemIndex, groups.length]);

  if (!group || !item) return null;

  const author = group.author;
  const storyLabel = author.id === meId ? "Your story" : `${author.name}'s story`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#05060a]/95 backdrop-blur-sm sm:p-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={storyLabel}
        tabIndex={-1}
        className="relative h-[100dvh] w-full overflow-hidden bg-ink outline-none sm:h-[min(88vh,820px)] sm:max-w-[430px] sm:rounded-[30px] sm:shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
      >
        <img
          src={item.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#05060a]/70 via-transparent to-[#05060a]/85"
        />

        {/* The two halves are the next/previous targets; controls sit above them. */}
        <button
          type="button"
          onClick={previous}
          aria-label="Previous story"
          className="absolute inset-y-0 left-0 z-10 w-[36%]"
        />
        <button
          type="button"
          onClick={next}
          aria-label="Next story"
          className="absolute inset-y-0 right-0 z-10 w-[64%]"
        />

        <div className="absolute inset-x-3 top-2.5 z-30 flex gap-1" aria-hidden="true">
          {group.items.map((entry, index) => {
            const done = index < itemIndex;
            const active = index === itemIndex;
            return (
              <span
                key={entry.id}
                className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
              >
                {done ? <span className="absolute inset-0 bg-white" /> : null}
                {active ? (
                  <span
                    key={`${groupIndex}-${itemIndex}`}
                    className="story-progress absolute inset-y-0 left-0 bg-white"
                  />
                ) : null}
              </span>
            );
          })}
        </div>

        <div className="absolute inset-x-3 top-5 z-30 flex items-center gap-2.5">
          <Avatar
            name={author.name}
            size={34}
            tone="soft"
            src={author.avatar}
            frame={group.avatarFrame}
            online={author.online}
          />
          <div className="min-w-0 flex-1">
            <p className="flex min-w-0 items-center gap-1 text-[12.5px] font-bold text-white">
              <span className="truncate">{author.name}</span>
              <span className="shrink-0 text-[10px] font-medium text-white/55">@{author.handle}</span>
              {author.verified ? (
                <Icon name="verified" size={12} className="shrink-0 text-[#4cc2ff]" />
              ) : null}
            </p>
            <p className="truncate text-[10px] text-white/65">
              {formatRelative(item.at)} · {item.game}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close story"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#05060a]/90 via-[#05060a]/45 to-transparent px-4 pb-5 pt-16">
          {item.caption ? (
            <p className="max-w-[34ch] font-display text-[16px] font-extrabold leading-[1.2] tracking-[-0.02em] text-white">
              {item.caption}
            </p>
          ) : null}
          {item.via ? (
            <p className="mt-1.5 text-[10.5px] font-semibold text-white/65">
              via @{item.via}
            </p>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            {item.snagId && onOpenSnag ? (
              <button
                type="button"
                onClick={() => onOpenSnag(item.snagId!)}
                className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[10.5px] font-bold text-ink transition-colors hover:bg-white/90"
              >
                <Icon name="eye" size={13} />
                View post
              </button>
            ) : null}
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {itemIndex + 1} / {group.items.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
