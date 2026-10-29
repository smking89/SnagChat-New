import { useState } from "react";
import type { SquadVisibility } from "../data/squads";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type CreateSquadSheetProps = {
  onCreate: (values: { name: string; visibility: SquadVisibility }) => void;
  onClose: () => void;
};

const VISIBILITY_OPTIONS: { value: SquadVisibility; label: string; hint: string }[] = [
  {
    value: "public",
    label: "Public gallery",
    hint: "Its posts show up in the feed for everyone.",
  },
  {
    value: "private",
    label: "Private gallery",
    hint: "Only members see what the squad posts.",
  },
];

export function CreateSquadSheet({ onCreate, onClose }: CreateSquadSheetProps) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<SquadVisibility>("public");
  const trimmed = name.trim();

  return (
    <Sheet labelledBy="create-squad-title" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed) return;
          onCreate({ name: trimmed, visibility });
        }}
      >
        <h2
          id="create-squad-title"
          className="font-display text-[21px] font-extrabold leading-tight tracking-[-0.04em]"
        >
          Create a squad
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          You own it. Invite the people you queue with once it exists.
        </p>

        <label
          htmlFor="create-squad-name"
          className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
        >
          Squad name
        </label>
        <input
          id="create-squad-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={32}
          autoFocus
          autoComplete="off"
          placeholder="Night shift"
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13.5px] font-semibold text-ink outline-none transition-colors placeholder:font-normal placeholder:text-faint focus:border-brand"
        />
        <p className="mt-1 text-right text-[10px] text-faint">{name.length}/32</p>

        <fieldset className="mt-3">
          <legend className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
            Gallery
          </legend>
          <div className="mt-1.5 space-y-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const active = visibility === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                    active ? "border-brand bg-brand-soft/40" : "border-line hover:border-[#d8dce1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="create-squad-visibility"
                    value={option.value}
                    checked={active}
                    onChange={() => setVisibility(option.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                      active ? "border-brand bg-brand" : "border-[#c9ced5]"
                    }`}
                  >
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-bold">
                      {option.value === "private" ? (
                        <Icon name="lock" size={11} strokeWidth={2.2} />
                      ) : null}
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                      {option.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={!trimmed}
            className="h-11 flex-1 rounded-xl bg-ink text-[13px] font-semibold text-white transition-colors hover:bg-[#22252a] disabled:cursor-not-allowed disabled:bg-[#c9ced5]"
          >
            Create squad
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-line px-4 text-[13px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
          >
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  );
}
