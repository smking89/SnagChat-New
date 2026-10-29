import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { GAME_PICKS, OTHER_GAME } from "../data/games";
import { type SnagCategory, type SnagDraft } from "../data/snags";
import { CLIP_HINTS, CLIP_LIMITS, formatBytes } from "../lib/clipLimits";
import { saveClip } from "../lib/clipStore";
import { fileToClip, fileToCover, UPLOAD_HINTS, type CoverUpload } from "../lib/imageUpload";
import { tagOverflow } from "../lib/tags";
import { GamePicker } from "./GamePicker";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { TagComposer } from "./TagComposer";

const COMPOSE_CATEGORIES: SnagCategory[] = ["Clips", "Loadouts", "Skins", "Builds", "Squad Galleries"];

/** An MP4 waiting to be posted, plus the poster frame that stands in for it. */
type ClipDraft = {
  /** Key in the clip store. Missing when this browser cannot hold the file. */
  id?: string;
  name: string;
  poster: string;
  aspect: string;
  duration: string;
  seconds: number;
  width: number;
  height: number;
  bytes: number;
  previewUrl: string;
};

type ComposeSheetProps = {
  squad?: { id: string; name: string };
  onClose: () => void;
  onPost: (draft: SnagDraft) => void;
};

export function ComposeSheet({ squad, onClose, onPost }: ComposeSheetProps) {
  const [title, setTitle] = useState("");
  const [game, setGame] = useState<string>(GAME_PICKS[0]);
  const [customGame, setCustomGame] = useState("");
  const [category, setCategory] = useState<SnagCategory>(squad ? "Squad Galleries" : "Clips");
  const [upload, setUpload] = useState<(CoverUpload & { name: string }) | null>(null);
  const [useUpload, setUseUpload] = useState(false);
  const [clip, setClip] = useState<ClipDraft | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);

  const usingUpload = !clip && useUpload && upload !== null;
  /**
   * A post needs artwork of your own — the poster frame of a clip you picked or
   * an image you uploaded. There are no stock covers to fall back on.
   */
  const cover = clip
    ? { image: clip.poster, aspect: clip.aspect }
    : usingUpload && upload
      ? upload
      : null;
  const postingGame = game === OTHER_GAME ? customGame.trim() : game;
  const overTags = tagOverflow(title);
  const canPost = title.trim().length > 0 && postingGame.length > 0 && overTags === 0 && cover !== null;

  // The picked file's blob URL only needs to live as long as this sheet is open.
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const clearClip = () => {
    if (!clip) return;
    URL.revokeObjectURL(clip.previewUrl);
    previewUrl.current = null;
    setClip(null);
  };

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCoverError(null);
    setCoverBusy(true);

    try {
      if (file.type.startsWith("video/")) {
        const result = await fileToClip(file);
        const id = await saveClip(file);
        clearClip();
        previewUrl.current = result.previewUrl;
        setClip({
          id,
          name: file.name,
          poster: result.image,
          aspect: result.aspect,
          duration: result.duration,
          seconds: result.seconds,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          previewUrl: result.previewUrl,
        });
        setUpload(null);
        setUseUpload(false);
        if (!squad) setCategory("Clips");
      } else {
        const result = await fileToCover(file);
        clearClip();
        setUpload({ ...result, name: file.name });
        setUseUpload(true);
      }
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "That file could not be uploaded.");
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canPost || !cover) return;
    onPost({
      title: title.trim(),
      game: postingGame,
      category: squad ? "Squad Galleries" : category,
      image: cover.image,
      aspect: cover.aspect,
      duration: clip?.duration,
      clipId: clip?.id,
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
              : "Drop a clip, loadout or base build into your feed."}
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
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
            Clips: {CLIP_HINTS.clip} {CLIP_HINTS.poster}
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {clip ? (
              <span
                aria-label={`Cover frame from ${clip.name}`}
                className="relative aspect-square overflow-hidden rounded-xl ring-2 ring-ink ring-offset-2"
              >
                <img src={clip.poster} alt="" className="h-full w-full object-cover" draggable={false} />
                <span className="absolute inset-0 grid place-items-center bg-ink/25">
                  <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8.4 5.2 18.6 12 8.4 18.8z" />
                    </svg>
                  </span>
                </span>
                <span className="absolute bottom-1 left-1 rounded bg-ink/85 px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white">
                  MP4
                </span>
              </span>
            ) : upload ? (
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
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
            className="sr-only"
            onChange={handleCoverFile}
          />

          {coverBusy ? (
            <p className="mt-2 text-[10.5px] font-medium text-muted">Reading your file…</p>
          ) : null}

          {coverError ? (
            <p role="alert" className="mt-2 text-[11px] font-medium text-[#b3261e]">
              {coverError}
            </p>
          ) : null}

          {clip ? (
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-surface p-2.5">
              <video
                src={clip.previewUrl}
                poster={clip.poster}
                controls
                playsInline
                preload="metadata"
                className="h-20 w-32 shrink-0 rounded-lg bg-ink object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10.5px] text-muted">
                  {clip.name} · {clip.width} × {clip.height} px · {clip.duration} · {formatBytes(clip.bytes)}
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                  Cover frame taken at {CLIP_LIMITS.posterSeconds}s. Between {CLIP_LIMITS.minSeconds}s and{" "}
                  {CLIP_LIMITS.maxSeconds}s, up to {formatBytes(CLIP_LIMITS.maxBytes)}.
                </p>
              </div>
              <button
                type="button"
                onClick={clearClip}
                className="shrink-0 self-start text-[10.5px] font-semibold text-[#4d535c] transition-colors hover:text-ink"
              >
                Remove
              </button>
            </div>
          ) : upload ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-surface px-2.5 py-2">
              <p className="min-w-0 truncate text-[10.5px] text-muted">
                {upload.name} · {upload.width} × {upload.height} px
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
              {coverBusy ? "Reading your file" : "Upload a cover or MP4 clip"}
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
          placeholder="Give the snag a name, and add #tags"
          className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10"
        />

        <TagComposer text={title} onChange={setTitle} game={postingGame} />

        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Game</p>
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
          Posts carry the game's own logo. Pick "Other" for anything not listed.
        </p>
        <div className="mt-2">
          <GamePicker
            value={game}
            onChange={setGame}
            custom={customGame}
            onCustomChange={setCustomGame}
          />
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
          Posted snags stay in this browser — no account needed.
        </p>
      </form>
    </Sheet>
  );
}
