import { useState, type ChangeEvent, type FormEvent } from "react";
import { COVER_PRESETS, type SnagCategory, type SnagDraft } from "../data/snags";
import { fileToCover, UPLOAD_HINTS, type CoverUpload } from "../lib/imageUpload";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

const COMPOSE_GAMES = ["Rust PC", "DayZ", "Squad", "Apex", "Warzone", "Elden Ring"];
const COMPOSE_CATEGORIES: SnagCategory[] = ["Clips", "Loadouts", "Screenshots", "Squad Galleries"];

type ComposeSheetProps = {
  squad?: { id: string; name: string };
  onClose: () => void;
  onPost: (draft: SnagDraft) => void;
};

export function ComposeSheet({ squad, onClose, onPost }: ComposeSheetProps) {
  const [title, setTitle] = useState("");
  const [game, setGame] = useState(COMPOSE_GAMES[0]);
  const [category, setCategory] = useState<SnagCategory>(squad ? "Squad Galleries" : "Clips");
  const [coverId, setCoverId] = useState(COVER_PRESETS[0].id);
  const [upload, setUpload] = useState<(CoverUpload & { name: string }) | null>(null);
  const [useUpload, setUseUpload] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const preset = COVER_PRESETS.find((item) => item.id === coverId) ?? COVER_PRESETS[0];
  const usingUpload = useUpload && upload !== null;
  const cover = usingUpload && upload ? upload : preset;
  const canPost = title.trim().length > 0;

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCoverError(null);
    setCoverBusy(true);
    try {
      const result = await fileToCover(file);
      setUpload({ ...result, name: file.name });
      setUseUpload(true);
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "That image could not be uploaded.");
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canPost) return;
    onPost({
      title: title.trim(),
      game,
      category: squad ? "Squad Galleries" : category,
      image: cover.image,
      aspect: cover.aspect,
      duration: category === "Clips" && !usingUpload ? "0:22" : undefined,
      squadId: squad?.id,
    });
  };

  return (
    <Sheet labelledBy="compose-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            {squad ? "Squad gallery" : "New snag"}
          </p>
          <h2
            id="compose-title"
            className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            {squad ? `Post to ${squad.name}.` : "Post a snag."}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            {squad
              ? "Only squad members see this in the gallery."
              : "Drop a clip, loadout or screenshot into your feed."}
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

      <form onSubmit={handleSubmit}>
        <fieldset className="mt-5">
          <legend className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Cover</legend>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">{UPLOAD_HINTS.cover}</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {COVER_PRESETS.map((item) => {
              const isSelected = !usingUpload && item.id === coverId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCoverId(item.id);
                    setUseUpload(false);
                  }}
                  aria-pressed={isSelected}
                  aria-label={item.label}
                  className={`relative aspect-square overflow-hidden rounded-xl transition-shadow ${
                    isSelected ? "ring-2 ring-ink ring-offset-2" : "hover:opacity-90"
                  }`}
                >
                  <img src={item.image} alt="" className="h-full w-full object-cover" draggable={false} />
                  {isSelected ? (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-ink">
                      <Icon name="check" size={12} strokeWidth={2.6} />
                    </span>
                  ) : null}
                </button>
              );
            })}

            {upload ? (
              <button
                type="button"
                onClick={() => setUseUpload(true)}
                aria-pressed={usingUpload}
                aria-label={upload.name}
                className={`relative aspect-square overflow-hidden rounded-xl transition-shadow ${
                  usingUpload ? "ring-2 ring-ink ring-offset-2" : "hover:opacity-90"
                }`}
              >
                <img src={upload.image} alt="" className="h-full w-full object-cover" draggable={false} />
                {upload.isGif ? (
                  <span className="absolute bottom-1 left-1 rounded bg-ink/85 px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white">
                    GIF
                  </span>
                ) : null}
                {usingUpload ? (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-ink">
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </span>
                ) : null}
              </button>
            ) : (
              <label
                htmlFor="cover-upload"
                className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-[#d8dce1] text-center text-[#4d535c] transition-colors hover:border-brand hover:text-brand"
              >
                <span>
                  <Icon name="plus" size={16} strokeWidth={2.2} className="mx-auto" />
                  <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.08em]">Upload</span>
                </span>
              </label>
            )}
          </div>

          <input
            id="cover-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleCoverFile}
          />

          {coverBusy ? (
            <p className="mt-2 text-[10.5px] font-medium text-muted">Processing image…</p>
          ) : null}

          {coverError ? (
            <p role="alert" className="mt-2 text-[11px] font-medium text-[#b3261e]">
              {coverError}
            </p>
          ) : null}

          {upload ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-surface px-2.5 py-2">
              <p className="min-w-0 truncate text-[10.5px] text-muted">
                {upload.name} · {upload.width} × {upload.height} px{upload.isGif ? " · GIF" : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setUpload(null);
                  setUseUpload(false);
                }}
                className="shrink-0 text-[10.5px] font-semibold text-[#4d535c] transition-colors hover:text-ink"
              >
                Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor="cover-upload"
              className="mt-2 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
            >
              <Icon name="plus" size={14} strokeWidth={2.2} />
              {coverBusy ? "Processing" : "Upload your own"}
            </label>
          )}
        </fieldset>

        <label
          htmlFor="snag-title"
          className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
        >
          Title
        </label>
        <input
          id="snag-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={70}
          placeholder="Give the snag a name"
          className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10"
        />

        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Game</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMPOSE_GAMES.map((item) => (
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

        {squad ? (
          <p className="mt-5 rounded-xl bg-surface px-3 py-2.5 text-[11px] leading-relaxed text-muted">
            Posts here land in <span className="font-semibold text-ink">{squad.name}</span> and in the Squad
            Galleries feed. You can edit or delete what you post.
          </p>
        ) : (
          <>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Category</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMPOSE_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    category === item
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!canPost}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c6e6]"
        >
          <Icon name="plus" size={17} strokeWidth={2.2} />
          {squad ? "Post to gallery" : "Post snag"}
        </button>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-faint">
          Posted snags live in this session only — no account needed.
        </p>
      </form>
    </Sheet>
  );
}
