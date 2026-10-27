import { useRef, useState, type FormEvent } from "react";
import type { ReportMode } from "./ReportSheet";
import { formatCount, type Player } from "../data/players";
import type { Snag } from "../data/snags";
import { formatRelative } from "../data/threads";
import { Avatar } from "./Avatar";
import { CountUp } from "./CountUp";
import { GameChip } from "./GameLogo";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";

export type CommentView = {
  id: string;
  author: Player;
  at: number;
  text: string;
};

type SnagScreenProps = {
  snag: Snag;
  author: Player;
  liked: boolean;
  likeCount: number;
  saved: boolean;
  saveCount: number;
  shareCount: number;
  comments: CommentView[];
  currentAvatar?: string;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  /** "ad" is only offered on sponsored posts. */
  onReport: (mode: ReportMode) => void;
  reported?: boolean;
  onOpenProfile: () => void;
  onAddComment: (text: string) => void;
  onClose: () => void;
};

export function SnagScreen({
  snag,
  author,
  liked,
  likeCount,
  saved,
  saveCount,
  shareCount,
  comments,
  currentAvatar,
  onToggleLike,
  onToggleSave,
  onShare,
  onReport,
  reported = false,
  onOpenProfile,
  onAddComment,
  onClose,
}: SnagScreenProps) {
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft("");
  };

  const focusComposer = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => inputRef.current?.focus(), 240);
  };

  return (
    <Screen labelledBy="snag-title" onClose={onClose}>
      <ScreenHeader
        title={snag.game}
        onBack={onClose}
        action={
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={onShare}
              aria-label="Share snag"
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <Icon name="share" size={19} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More actions"
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <Icon name="more" size={18} />
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_18px_48px_rgba(23,25,29,0.18)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport("post");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface"
                  >
                    <Icon name="flag" size={16} />
                    {reported ? "Reported — report again" : "Report post"}
                  </button>

                  {snag.sponsoredBy ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onReport("ad");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface"
                    >
                      <Icon name="flag" size={16} />
                      Report ad
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px]">
          <img
            src={snag.image}
            alt=""
            style={{ aspectRatio: snag.aspect }}
            className="w-full bg-surface object-cover"
            draggable={false}
          />

          <div className="px-4 pb-8 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenProfile}
                disabled={Boolean(snag.sponsoredBy)}
                className="flex min-w-0 items-center gap-2.5 text-left disabled:cursor-default"
                aria-label={`Open ${author.name}'s profile`}
              >
                <Avatar name={author.name} size={38} tone="soft" src={author.avatar} online={author.online} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[13.5px] font-bold tracking-[-0.01em]">
                    <span className="truncate">{author.name}</span>
                    {author.verified ? (
                      <Icon name="verified" size={13} className="shrink-0 text-[#1d9bf0]" />
                    ) : null}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    @{author.handle} · {snag.postedAt}
                  </span>
                </span>
              </button>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {snag.sponsoredBy ? (
                  <span className="rounded-md bg-brand px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white">
                    Ad
                  </span>
                ) : null}
                <GameChip game={snag.game} />
                <span className="rounded-md bg-surface px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#4d535c]">
                  {snag.category}
                </span>
              </span>
            </div>

            <h1
              id="snag-title"
              className="mt-4 font-display text-[20px] font-extrabold leading-[1.15] tracking-[-0.035em]"
            >
              {snag.title}
            </h1>

            {snag.sponsoredBy ? (
              <p className="mt-2 text-[11.5px] font-semibold text-muted">
                Sponsored by {snag.sponsoredBy} · paid placement
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleLike}
                aria-pressed={liked}
                className={`flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-bold transition-colors ${
                  liked
                    ? "bg-brand text-white hover:bg-brand-deep"
                    : "border border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                }`}
              >
                <Icon name="heart" size={21} strokeWidth={2.3} filled={liked} />
                <CountUp value={likeCount} format={formatCount} />
                <span className="sr-only">{liked ? "Liked" : "Like"}</span>
              </button>

              <button
                type="button"
                onClick={focusComposer}
                className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-bold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="message" size={21} />
                <CountUp value={comments.length} />
                <span className="sr-only">comments</span>
              </button>

              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={saved}
                className={`flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-bold transition-colors ${
                  saved ? "bg-ink text-white" : "border border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                }`}
              >
                <Icon name="bookmark" size={21} strokeWidth={2.2} filled={saved} />
                <CountUp value={saveCount} format={formatCount} />
                <span className="sr-only">{saved ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={onShare}
                className="ml-auto flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-bold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="share" size={21} />
                <CountUp value={shareCount} format={formatCount} />
                <span className="sr-only">shares</span>
              </button>
            </div>

            <div ref={commentsRef} className="mt-6 scroll-mt-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                  Comments <span className="text-faint">(<CountUp value={comments.length} />)</span>
                </h2>
                <button
                  type="button"
                  onClick={focusComposer}
                  className="text-[11px] font-semibold text-brand"
                >
                  Add yours
                </button>
              </div>

              {comments.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex gap-2.5">
                      <Avatar name={comment.author.name} size={30} tone="soft" src={comment.author.avatar} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] leading-tight">
                          <span className="inline-flex items-center gap-1 font-bold">
                            {comment.author.name}
                            {comment.author.verified ? (
                              <Icon name="verified" size={11} className="shrink-0 text-[#1d9bf0]" />
                            ) : null}
                          </span>
                          <span className="text-faint">
                            {" "}
                            @{comment.author.handle} · {formatRelative(comment.at)}
                          </span>
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-[#3d424a]">{comment.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center">
                  <p className="text-[12.5px] font-semibold">No comments yet</p>
                  <p className="mx-auto mt-1 max-w-[30ch] text-[11.5px] leading-relaxed text-muted">
                    Be the first to say something about this snag.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-white px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
        <form onSubmit={submit} className="mx-auto flex max-w-[720px] items-center gap-2">
          <Avatar name="You" size={30} tone="brand" src={currentAvatar} />
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a comment"
            aria-label="Add a comment"
            maxLength={240}
            className="h-10 flex-1 rounded-full bg-surface px-4 text-[13px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-10 shrink-0 rounded-full bg-brand px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c6e6]"
          >
            Post
          </button>
        </form>
      </div>
    </Screen>
  );
}
