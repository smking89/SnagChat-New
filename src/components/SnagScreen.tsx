import { useRef, useState, type FormEvent } from "react";
import type { ReportMode } from "./ReportSheet";
import { useClipUrl } from "../lib/clipStore";
import type { FrameUse } from "../data/frames";
import { formatCount, type Player } from "../data/players";
import type { Snag } from "../data/snags";
import { formatRelative } from "../data/threads";
import { Avatar } from "./Avatar";
import { CountUp } from "./CountUp";
import { FrameLayer } from "./FrameArt";
import { GameTag } from "./GameLogo";
import { Icon } from "./Icon";
import { RichText } from "./RichText";
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
  /** Owner actions — only your own posts get them. */
  isMine?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Tapping a #hashtag searches the feed for it. */
  onHashtag?: (value: string) => void;
  /** Tapping an @mention opens that player. */
  onMention?: (handle: string) => void;
  /** The creator's snag frame and avatar frame, when they own them. */
  frame?: FrameUse;
  authorFrame?: FrameUse;
  /** Adds this post to your 24-hour story. */
  onAddToStory?: () => void;
  /** True once this snag is already one of your story items. */
  inStory?: boolean;
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
  isMine = false,
  onEdit,
  onDelete,
  onHashtag,
  onMention,
  frame,
  authorFrame,
  onAddToStory,
  inStory = false,
  onClose,
}: SnagScreenProps) {
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  /** Deleting asks twice, so a stray tap cannot remove a post. */
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const clip = useClipUrl(snag.clipId);

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
              <Icon name="share" size={22} />
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setMenuOpen((open) => !open);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More actions"
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <Icon name="more" size={20} />
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => {
                    setConfirmDelete(false);
                    setMenuOpen(false);
                  }}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_18px_48px_rgba(23,25,29,0.18)]"
                >
                  {isMine && onEdit ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface"
                    >
                      <Icon name="edit" size={16} />
                      Edit post
                    </button>
                  ) : null}

                  {isMine && onDelete ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (!confirmDelete) {
                          setConfirmDelete(true);
                          return;
                        }
                        setConfirmDelete(false);
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-[#b3261e] transition-colors hover:bg-[#fdf2f1]"
                    >
                      <Icon name="trash" size={16} />
                      {confirmDelete ? "Tap again to delete" : "Delete post"}
                    </button>
                  ) : null}

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
          <div className="frame-host relative overflow-hidden bg-ink">
            {clip ? (
              <video
                src={clip}
                poster={snag.image}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                style={{ aspectRatio: snag.aspect }}
                className="w-full bg-ink object-cover"
              />
            ) : (
              <img
                src={snag.image}
                alt=""
                style={{ aspectRatio: snag.aspect }}
                className="w-full bg-surface object-cover"
                draggable={false}
              />
            )}
            <FrameLayer use={frame} target="snag" />
          </div>

          <div className="px-4 pb-8 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenProfile}
                disabled={Boolean(snag.sponsoredBy)}
                className="flex min-w-0 items-center gap-2.5 text-left disabled:cursor-default"
                aria-label={`Open ${author.name}'s profile`}
              >
                <Avatar
                  name={author.name}
                  size={38}
                  tone="soft"
                  src={author.avatar}
                  online={author.online}
                  frame={authorFrame}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold tracking-[-0.01em]">
                    {author.name}
                  </span>
                  <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted">
                    <span className="truncate">@{author.handle}</span>
                    {author.verified ? (
                      <Icon name="verified" size={12} className="shrink-0 text-[#1d9bf0]" />
                    ) : null}
                    <span className="shrink-0">· {snag.postedAt}</span>
                  </span>
                </span>
              </button>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {snag.sponsoredBy ? (
                  <span className="rounded-md bg-brand px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white">
                    Ad
                  </span>
                ) : null}
                <GameTag game={snag.game} height={26} tone="onLight" className="max-w-[104px]" />
                <span className="rounded-md bg-surface px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#4d535c]">
                  {snag.category}
                </span>
              </span>
            </div>

            <h1
              id="snag-title"
              className="mt-4 font-display text-[20px] font-extrabold leading-[1.15] tracking-[-0.035em]"
            >
              <RichText text={snag.title} onHashtag={onHashtag} onMention={onMention} />
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
                <Icon name="heart" size={23} strokeWidth={2.3} filled={liked} />
                <CountUp value={likeCount} format={formatCount} />
                <span className="sr-only">{liked ? "Liked" : "Like"}</span>
              </button>

              <button
                type="button"
                onClick={focusComposer}
                className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-bold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="message" size={23} />
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
                <Icon name="bookmark" size={23} strokeWidth={2.2} filled={saved} />
                <CountUp value={saveCount} format={formatCount} />
                <span className="sr-only">{saved ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={onShare}
                className="ml-auto flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-bold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="share" size={23} />
                <CountUp value={shareCount} format={formatCount} />
                <span className="sr-only">shares</span>
              </button>
            </div>

            {onAddToStory ? (
              <button
                type="button"
                onClick={onAddToStory}
                disabled={inStory}
                aria-pressed={inStory}
                className={`mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-semibold transition-colors ${
                  inStory
                    ? "cursor-default border-brand/30 bg-brand-soft text-brand"
                    : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1] hover:text-ink"
                }`}
              >
                <Icon name={inStory ? "check" : "story"} size={14} strokeWidth={2.2} />
                {inStory ? "In your story" : "Add to your story"}
              </button>
            ) : null}

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
                          <span className="font-bold">{comment.author.name}</span>
                          <span className="inline-flex items-center gap-1 text-faint">
                            {" "}@
                            {comment.author.handle}
                            {comment.author.verified ? (
                              <Icon name="verified" size={11} className="shrink-0 text-[#1d9bf0]" />
                            ) : null}
                            <span>· {formatRelative(comment.at)}</span>
                          </span>
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-[#3d424a]">
                          <RichText text={comment.text} onHashtag={onHashtag} onMention={onMention} />
                        </p>
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
