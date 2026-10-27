import { useMemo, useState } from "react";
import { GAMES, gameCategory } from "../data/games";
import { GameLogo } from "./GameLogo";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type TopGamesSheetProps = {
  /** Catalogue titles already picked. */
  selected: string[];
  /** Hashtags the player has invented, offered as community tags. */
  customTags: string[];
  /** Squad names, listed as community matches while searching. */
  squads: string[];
  onChange: (next: string[]) => void;
  onCreateTag: (tag: string) => void;
  onClose: () => void;
};

/** Strips a typed query down to a hashtag body: "Ru!" → "ru". */
function tagFrom(query: string): string {
  return query.trim().replace(/^#+/, "").replace(/[^A-Za-z0-9_]/g, "");
}

/**
 * Quick-add top games. Picking titles primes the feed filters and the
 * suggestions dial; a query that matches nothing can still be turned into a
 * custom hashtag, so a dead end never blocks the player.
 */
export function TopGamesSheet({
  selected,
  customTags,
  squads,
  onChange,
  onCreateTag,
  onClose,
}: TopGamesSheetProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const tag = tagFrom(query);

  const results = useMemo(() => GAMES.filter((game) => game.name.toLowerCase().includes(needle)), [needle]);
  const tagResults = useMemo(() => {
    if (!needle) return customTags.slice(0, 6);
    return Array.from(
      new Set([...customTags, ...GAMES.map((game) => game.name.split(":")[0].toLowerCase().replace(/[^a-z0-9]/g, ""))]),
    )
      .filter((entry) => entry.includes(tag))
      .slice(0, 6);
  }, [customTags, needle, tag]);
  const squadResults = useMemo(
    () => (needle ? squads.filter((name) => name.toLowerCase().includes(needle)).slice(0, 4) : []),
    [squads, needle],
  );

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((entry) => entry !== name) : [...selected, name]);
  };

  const showAll = !needle;
  const nothing = needle.length > 0 && results.length === 0 && tagResults.length === 0 && squadResults.length === 0;

  return (
    <Sheet labelledBy="top-games-title" onClose={onClose}>
      <div className="mx-auto h-1 w-9 rounded-full bg-line" />

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h2
            id="top-games-title"
            className="font-display text-[22px] font-extrabold leading-[1.08] tracking-[-0.045em]"
          >
            Select your top games
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Pick games to prime your dial and surface active feeds.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c] transition-colors hover:bg-line"
        >
          <Icon name="close" size={17} />
        </button>
      </div>

      <label htmlFor="game-search" className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-line px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <Icon name="search" size={15} className="shrink-0 text-faint" />
        <input
          id="game-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search all games…"
          className="h-full w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c]"
          >
            <Icon name="close" size={12} strokeWidth={2.4} />
          </button>
        ) : null}
      </label>

      <div className="mt-4 max-h-[46vh] overflow-y-auto">
        {nothing ? (
          <div className="rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface text-[#4d535c]">
              <Icon name="search" size={20} />
            </span>
            <p className="mt-3 font-display text-[15px] font-extrabold tracking-[-0.02em]">No matches found</p>
            <p className="mx-auto mt-1 max-w-[34ch] text-[11.5px] leading-relaxed text-muted">
              We couldn't find any games or squads matching "{query.trim()}".
            </p>
            {tag ? (
              <button
                type="button"
                onClick={() => onCreateTag(tag)}
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                <Icon name="plus" size={13} strokeWidth={2.6} />
                Create custom tag #{tag}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                {showAll ? "Popular right now" : `Global games (${results.length})`}
              </p>
            ) : null}
            <div className="mt-2 grid gap-1.5">
              {results.map((game) => {
                const picked = selected.includes(game.name);
                return (
                  <button
                    key={game.name}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => toggle(game.name)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:bg-brand/10 ${
                      picked ? "border-brand bg-brand-tint" : "border-line hover:border-[#d8dce1]"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink">
                      <GameLogo game={game.name} height={22} width={32} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-ink">{game.name}</span>
                      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.08em] text-faint">
                        {gameCategory(game.name)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        picked ? "border-brand bg-brand text-white" : "border-[#d8dce1] text-transparent"
                      }`}
                    >
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>

            {tagResults.length > 0 || squadResults.length > 0 ? (
              <>
                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                  Community tags & clans
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tagResults.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => onCreateTag(entry)}
                      className="rounded-full border border-line px-2.5 py-1.5 text-[11px] font-semibold text-[#4d535c] transition-colors hover:border-brand hover:text-brand"
                    >
                      #{entry}
                    </button>
                  ))}
                  {squadResults.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-line px-2.5 py-1.5 text-[11px] font-semibold text-[#4d535c]"
                    >
                      {name} <span className="text-faint">squad</span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            {!showAll && tag ? (
              <div className="mt-4 rounded-2xl border border-line bg-surface p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Custom entry</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  "{query.trim()}" isn't listed? Add it as a tag you can post with.
                </p>
                <button
                  type="button"
                  onClick={() => onCreateTag(tag)}
                  className="mt-2 h-9 rounded-full border border-line bg-white px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-brand hover:text-brand"
                >
                  + Create custom tag #{tag}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <button
        type="button"
        disabled={selected.length === 0}
        onClick={() => onChange(selected)}
        className="mt-4 h-12 w-full rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#e4dbe9] disabled:text-[#a99bb2]"
      >
        Add selected games ({selected.length})
      </button>
    </Sheet>
  );
}
