import { useState, type FormEvent } from "react";
import { GAMES, type Snag } from "../data/snags";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type EditSnagSheetProps = {
  snag: Snag;
  onClose: () => void;
  onSave: (values: { title: string; game: string }) => void;
};

export function EditSnagSheet({ snag, onClose, onSave }: EditSnagSheetProps) {
  const [title, setTitle] = useState(snag.title);
  const [game, setGame] = useState(snag.game);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onSave({ title: nextTitle, game });
  };

  return (
    <Sheet labelledBy="edit-snag-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Edit post</p>
          <h2
            id="edit-snag-title"
            className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            Update your snag.
          </h2>
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

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-2.5">
        <img src={snag.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" draggable={false} />
        <p className="min-w-0 flex-1 truncate text-[12px] text-muted">
          Posted to {snag.squadId ? "the squad gallery" : "your feed"} · @{snag.creator}
        </p>
      </div>

      <form onSubmit={save} className="mt-4">
        <label
          htmlFor="edit-snag-name"
          className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
        >
          Title
        </label>
        <input
          id="edit-snag-name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={70}
          className="mt-2 h-12 w-full rounded-xl border border-line px-3 text-[13px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />

        <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Game</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GAMES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={game === item}
              onClick={() => setGame(item)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                game === item
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          className="mt-6 h-12 w-full rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c6e6]"
        >
          Save changes
        </button>
      </form>
    </Sheet>
  );
}
