import { GAME_PICKS, OTHER_GAME, gameLogo } from "../data/games";
import { Icon } from "./Icon";

type GamePickerProps = {
  /** Catalogue name, or OTHER_GAME when the player is naming their own title. */
  value: string;
  onChange: (value: string) => void;
  /** Free-text name, used while OTHER_GAME is selected. */
  custom: string;
  onCustomChange: (value: string) => void;
};

/** Game chooser with real logos, plus a free-text "Other" escape hatch. */
export function GamePicker({ value, onChange, custom, onCustomChange }: GamePickerProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {GAME_PICKS.map((name) => {
          const selected = name === value;
          const logo = name === OTHER_GAME ? undefined : gameLogo(name);

          return (
            <button
              key={name}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(name)}
              className={`flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-[11px] font-semibold transition-colors ${
                selected
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
              }`}
            >
              <span className="grid h-6 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-[#0d0f14]">
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    className="max-h-[15px] w-auto max-w-[38px] object-contain"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <Icon name="plus" size={13} strokeWidth={2.4} className="text-white" />
                )}
              </span>
              {name}
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
