import { GAME_PICKS, OTHER_GAME, gameLogo } from "../data/games";
import { GameLogo } from "./GameLogo";
import { Icon } from "./Icon";

type GamePickerProps = {
  /** Catalogue name, or OTHER_GAME when the player is naming their own title. */
  value: string;
  onChange: (value: string) => void;
  /** Free-text name, used while OTHER_GAME is selected. */
  custom: string;
  onCustomChange: (value: string) => void;
};

/**
 * Game chooser: the artwork and its name, with no pill or plate around either.
 * Picking a title darkens its name and ticks it, so the logo itself is never
 * sitting inside a badge.
 */
export function GamePicker({ value, onChange, custom, onCustomChange }: GamePickerProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
        {GAME_PICKS.map((name) => {
          const selected = name === value;
          const known = Boolean(gameLogo(name));

          return (
            <button
              key={name}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(name)}
              className={`flex items-center gap-2.5 py-2 text-left transition-colors ${
                selected ? "text-ink" : "text-[#4d535c] hover:text-ink"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center">
                {known ? (
                  <GameLogo game={name} height={28} width={28} />
                ) : (
                  <Icon name="plus" size={17} strokeWidth={2.4} className="text-[#4d535c]" />
                )}
              </span>
              <span
                className={`min-w-0 flex-1 text-[12px] leading-snug ${
                  selected ? "font-bold" : "font-semibold"
                }`}
              >
                {name}
              </span>
              {selected ? (
                <Icon name="check" size={14} strokeWidth={3} className="shrink-0 text-brand" />
              ) : null}
            </button>
          );
        })}
      </div>

      {value === OTHER_GAME ? (
        <div className="mt-3">
          <label
            htmlFor="other-game"
            className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
          >
            Game name
          </label>
          <input
            id="other-game"
            value={custom}
            onChange={(event) => onCustomChange(event.target.value)}
            maxLength={40}
            placeholder="e.g. Escape from Tarkov"
            className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
            Titles we don't have artwork for post with their name only.
          </p>
        </div>
      ) : null}
    </div>
  );
}
