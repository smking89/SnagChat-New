import { useRef, useState, type FormEvent } from "react";
import { formatCount, type Player } from "../data/players";
import type { Snag } from "../data/snags";
import { formatRelative } from "../data/threads";
import { Avatar } from "./Avatar";
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
  comments: CommentView[];
  currentAvatar?: string;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenProfile: () => void;
  onAddComment: (text: string) => void;
  onClose: () => void;
};

export function SnagScreen({
  snag,
  author,
  liked,
  likeCount,
  comments,
  currentAvatar,
  onToggleLike,
  onShare,
  onOpenProfile,
  onAddComment,
  onClose,
}: SnagScreenProps) {
  const [draft, setDraft] = useState("");
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
          <button
            type="button"
            onClick={onShare}
            aria-label="Share snag"
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
          >
            <Icon name="share" size={19} />
          </button>
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
                className="flex min-w-0 items-center gap-2.5 text-left"
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
              <span className="ml-auto shrink-0 rounded-md bg-surface px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#4d535c]">
                {snag.category}
              </span>
            </div>

            <h1
              id="snag-title"
              className="mt-4 font-display text-[20px] font-extrabold leading-[1.15] tracking-[-0.035em]"
            >
              {snag.title}
            </h1>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleLike}
                aria-pressed={liked}
                className={`flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold transition-colors ${
                  liked
                    ? "bg-brand text-white hover:bg-brand-deep"
                    : "border border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                }`}
              >
                <Icon name="heart" size={16} strokeWidth={2.2} filled={liked} />
                {formatCount(likeCount)}
                <span className="sr-only">{liked ? "Liked" : "Like"}</span>
              </button>

              <button
                type="button"
                onClick={focusComposer}
                className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="message" size={16} />
                {comments.length}
                <span className="sr-only">comments</span>
              </button>

              <button
                type="button"
                onClick={onShare}
                className="ml-auto flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="share" size={16} />
                Share
              </button>
            </div>

            <div ref={commentsRef} className="mt-6 scroll-mt-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                  Comments <span className="text-faint">({comments.length})</span>
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
