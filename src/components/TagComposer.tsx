import { useState } from "react";
import { gameHashtag } from "../data/games";
import { ME, PLAYERS } from "../data/players";
import {
  MAX_TAGS,
  SUGGESTED_HASHTAGS,
  completeTag,
  countTags,
  hasTag,
  parseTags,
  removeTag,
  tagOverflow,
  toHashtag,
  toggleTag,
  trailingQuery,
} from "../lib/tags";
import { Icon } from "./Icon";

type TagComposerProps = {
  /** The post text the tags are added to. */
  text: string;
  onChange: (next: string) => void;
  /** Selected game, so its own hashtag is offered first. */
  game: string;
  maxLength?: number;
};

/** Hashtags that get offered while someone is typing a "#". */
const POPULAR_HASHTAGS = ["clip", "loadout", "skin", "screenshot", "squad", "gg", "pvp", "base", "edit"];

/**
 * Tag row for writing a post: tap a chip to add it, tap it again to take it
 * away, type your own hashtag, and type "@" to autofill a player's handle.
 * Hashtags and mentions share the same budget.
 */
export function TagComposer({ text, onChange, game, maxLength = 70 }: TagComposerProps) {
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const segments = parseTags(text);
  const used = countTags(text);
  const over = tagOverflow(text);
  const full = used >= MAX_TAGS;
  const gameTag = gameHashtag(game);
  const query = trailingQuery(text);

  const hashtagChips = Array.from(new Set([gameTag, ...SUGGESTED_HASHTAGS, "skin"].filter(Boolean))).slice(0, 6);
  const mentionChips = PLAYERS.filter((player) => player.id !== ME.id).slice(0, 4);

  // What the half-typed tag at the end of the draft could become.
  const needle = query?.query.toLowerCase() ?? "";
  const suggestions =
    query?.kind === "mention"
      ? PLAYERS.filter(
          (player) =>
            player.id !== ME.id &&
            (player.handle.toLowerCase().startsWith(needle) || player.name.toLowerCase().includes(needle)),
        )
          .slice(0, 6)
          .map((player) => ({ key: player.id, label: `@${player.handle}`, hint: player.name }))
      : query?.kind === "hashtag"
        ? Array.from(
            new Set([gameTag, ...POPULAR_HASHTAGS].filter((tag): tag is string => Boolean(tag))),
          )
            .filter((tag) => tag.startsWith(needle))
            .slice(0, 8)
            .map((tag) => ({ key: tag, label: `#${tag}`, hint: "hashtag" }))
        : [];

  const addCustom = () => {
    const tag = toHashtag(custom);
    if (!tag) {
      setCustomError("Tags need at least two letters or numbers.");
      return;
    }
    if (hasTag(text, tag)) {
      setCustomError(`${tag} is already on this post.`);
      return;
    }
    if (full) {
      setCustomError(`A post carries ${MAX_TAGS} tags. Take one off first.`);
      return;
    }

    const next = completeTag(text, tag, maxLength);
    if (next === text) {
      setCustomError("This post is full to the brim — take a tag off first.");
      return;
    }

    onChange(next);
    setCustom("");
    setCustomError(null);
  };

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Tags</p>
        <p
          className={`text-[10.5px] font-bold ${
            over ? "text-[#b3261e]" : full ? "text-brand" : "text-faint"
          }`}
        >
          {used} / {MAX_TAGS}
        </p>
      </div>

      <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
        Tap a tag to add it, tap it again to take it off. Type <span className="font-semibold">@</span> to
        autofill a player and <span className="font-semibold">#</span> anywhere to tag the post. Up to{" "}
        {MAX_TAGS} hashtags and mentions together.
      </p>

      {suggestions.length > 0 ? (
        <div className="mt-2 rounded-xl border border-brand/30 bg-brand-tint p-2">
          <p className="px-1 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-brand">
            {query?.kind === "mention" ? "Finish the mention" : "Finish the hashtag"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.key}
                type="button"
                onClick={() => onChange(completeTag(text, suggestion.label, maxLength))}
                className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {suggestion.label}
                <span className="text-[10px] font-medium text-faint">{suggestion.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* What the post carries right now: tap one to take it off.
       * Chips below add, these remove, so both directions are one tap. */}
      {segments.some((segment) => segment.type !== "text") ? (
        <div className="mt-2 rounded-xl border border-line bg-surface p-2">
          <p className="px-1 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
            On this post — tap to remove
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {segments
              .filter((segment) => segment.type !== "text")
              .map((segment, index) => (
                <button
                  key={`${segment.raw}-${index}`}
                  type="button"
                  aria-label={`Remove ${segment.raw}`}
                  title={`Tap to remove ${segment.raw}`}
                  onClick={() => onChange(removeTag(text, segment.raw))}
                  className="flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  {segment.raw}
                  <Icon name="close" size={11} strokeWidth={2.8} />
                </button>
              ))}
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {hashtagChips.map((tag) => {
          const chip = `#${tag}`;
          const added = segments.some(
            (segment) => segment.type !== "text" && segment.raw.toLowerCase() === chip.toLowerCase(),
          );

          return (
            <TagChip
              key={chip}
              label={chip}
              added={added}
              disabled={full && !added}
              onClick={() => onChange(toggleTag(text, chip, maxLength))}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {mentionChips.map((player) => {
          const chip = `@${player.handle}`;
          const added = segments.some(
            (segment) => segment.type !== "text" && segment.raw.toLowerCase() === chip.toLowerCase(),
          );

          return (
            <TagChip
              key={player.id}
              label={chip}
              hint={player.name}
              added={added}
              disabled={full && !added}
              onClick={() => onChange(toggleTag(text, chip, maxLength))}
            />
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <label
          htmlFor="custom-tag"
          className="flex h-9 flex-1 items-center gap-1 rounded-full border border-line px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"
        >
          <span aria-hidden="true" className="text-[12px] font-bold text-faint">
            #
          </span>
          <input
            id="custom-tag"
            value={custom}
            onChange={(event) => {
              setCustomError(null);
              setCustom(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              // Enter adds the tag instead of posting the snag.
              event.preventDefault();
              addCustom();
            }}
            placeholder="your own tag"
            maxLength={24}
            className="h-full w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
          />
        </label>
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim() || full}
          className="h-9 shrink-0 rounded-full border border-line px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add tag
        </button>
        <button
          type="button"
          onClick={() => {
            if (full) return;
            const trimmed = text.trimEnd();
            const next = trimmed ? `${trimmed} @` : "@";
            if (next.length <= maxLength) onChange(next);
          }}
          disabled={full}
          title="Find a player to mention"
          className="h-9 shrink-0 rounded-full border border-line px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          @ Mention
        </button>
      </div>

      {customError ? (
        <p role="alert" className="mt-1.5 text-[10.5px] font-medium text-[#b3261e]">
          {customError}
        </p>
      ) : null}

      {over > 0 ? (
        <p role="alert" className="mt-2 text-[11px] font-medium text-[#b3261e]">
          That is {over} tag{over === 1 ? "" : "s"} over the limit. Remove {over === 1 ? "one" : `${over}`} to
          post.
        </p>
      ) : null}
    </div>
  );
}

function TagChip({
  label,
  hint,
  added,
  disabled,
  onClick,
}: {
  label: string;
  hint?: string;
  added: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={added}
      aria-label={added ? `Remove ${label}` : `Add ${label}`}
      title={added ? `Tap to remove ${label}` : `Tap to add ${label}`}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        added
          ? "border-brand bg-brand text-white"
          : disabled
            ? "cursor-not-allowed border-line bg-surface text-faint"
            : "border-line bg-white text-[#4d535c] hover:border-brand hover:text-brand"
      }`}
    >
      {label}
      {hint ? <span className={`ml-1 text-[10px] font-medium ${added ? "text-white/75" : "text-faint"}`}>{hint}</span> : null}
    </button>
  );
}
