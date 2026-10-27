import { gameHashtag } from "../data/games";
import { ME, PLAYERS } from "../data/players";
import { MAX_TAGS, SUGGESTED_HASHTAGS, countTags, insertTag, parseTags, tagOverflow } from "../lib/tags";

type TagComposerProps = {
  /** The post text the tags are added to. */
  text: string;
  onChange: (next: string) => void;
  /** Selected game, so its own hashtag is offered first. */
  game: string;
  maxLength?: number;
};

/**
 * Tag row for writing a post: one tap adds the game's hashtag, a popular one, or
 * an @mention, and the counter keeps the poster inside the limit. Hashtags and
 * mentions share the same budget.
 */
export function TagComposer({ text, onChange, game, maxLength = 70 }: TagComposerProps) {
  const segments = parseTags(text);
  const used = countTags(text);
  const over = tagOverflow(text);
  const gameTag = gameHashtag(game);

  const hashtags = Array.from(new Set([gameTag, ...SUGGESTED_HASHTAGS].filter(Boolean))).slice(0, 5);
  const mentions = PLAYERS.filter((player) => player.id !== ME.id)
    .slice(0, 4)
    .map((player) => player.handle);

  const chips = [...hashtags.map((tag) => `#${tag}`), ...mentions.map((handle) => `@${handle}`)];

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Tags</p>
        <p
          className={`text-[10.5px] font-bold ${
            over ? "text-[#b3261e]" : used === MAX_TAGS ? "text-brand" : "text-faint"
          }`}
        >
          {used} / {MAX_TAGS}
        </p>
      </div>

      <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
        Tap to add. A hashtag opens that tag's feed and an @mention opens a profile. Up to {MAX_TAGS} a post —
        you can type them straight into the title too.
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const added = segments.some(
            (segment) => segment.type !== "text" && segment.raw.toLowerCase() === chip.toLowerCase(),
          );
          const full = used >= MAX_TAGS && !added;

          return (
            <button
              key={chip}
              type="button"
              aria-pressed={added}
              disabled={full}
              onClick={() => onChange(insertTag(text, chip, maxLength))}
              className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                added
                  ? "border-brand bg-brand-soft text-brand"
                  : full
                    ? "cursor-not-allowed border-line bg-surface text-faint"
                    : "border-line bg-white text-[#4d535c] hover:border-brand hover:text-brand"
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {over > 0 ? (
        <p role="alert" className="mt-2 text-[11px] font-medium text-[#b3261e]">
          That is {over} tag{over === 1 ? "" : "s"} over the limit. Remove {over === 1 ? "one" : `${over}`} to
          post.
        </p>
      ) : null}
    </div>
  );
}
