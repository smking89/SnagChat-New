import { useState, type ChangeEvent } from "react";
import type { Snag } from "../data/snags";
import { fileToCover } from "../lib/imageUpload";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

export type StoryDraft = {
  image: string;
  caption: string;
  game: string;
  snagId?: string;
  /** Original creator when you share someone else's post. */
  via?: string;
};

type StoryComposerSheetProps = {
  mySnags: Snag[];
  /** Your default game, used for an uploaded photo. */
  game: string;
  onAdd: (draft: StoryDraft) => void;
  onCreate: () => void;
  onClose: () => void;
};

type Upload = { image: string; name: string };

/**
 * The add half of stories. A photo can be uploaded through the same sandbox as
 * a snag cover, or one of your posts can be shared straight to the story.
 */
export function StoryComposerSheet({
  mySnags,
  game,
  onAdd,
  onCreate,
  onClose,
}: StoryComposerSheetProps) {
  const [upload, setUpload] = useState<Upload | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      const cover = await fileToCover(file);
      setUpload({ image: cover.image, name: file.name });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That photo could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const addUpload = () => {
    if (!upload) return;
    onAdd({ image: upload.image, caption: caption.trim(), game });
  };

  const shareSnag = (snag: Snag) => {
    onAdd({ image: snag.image, caption: snag.title, game: snag.game, snagId: snag.id });
  };

  return (
    <Sheet labelledBy="story-composer-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Your story
          </p>
          <h2
            id="story-composer-title"
            className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            Add to your story.
          </h2>
          <p className="mt-1.5 max-w-[40ch] text-[12px] leading-relaxed text-muted">
            A photo or one of your snags. It stays up for 24 hours, then clears itself.
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

      {upload ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
          <div className="relative mx-auto aspect-[9/16] w-[138px] overflow-hidden rounded-2xl bg-ink sm:mx-0 sm:w-full">
            <img src={upload.image} alt="" className="h-full w-full object-cover" draggable={false} />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-[9px] font-semibold text-white/80">
              {upload.name}
            </span>
          </div>
          <div className="min-w-0">
            <label
              htmlFor="story-caption"
              className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
            >
              Caption
            </label>
            <input
              id="story-caption"
              value={caption}
              maxLength={90}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Say something about this run…"
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
              {caption.length} / 90 · Visible to the people who can see your profile.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={addUpload}
                className="h-10 flex-1 rounded-full bg-brand text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Add to story
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpload(null);
                  setCaption("");
                }}
                className="h-10 rounded-full border border-line px-3.5 text-[11px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#d8dce1] bg-[#fbfbfc] p-4">
          <label
            htmlFor="story-upload"
            className="flex cursor-pointer items-center gap-3 rounded-xl text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand ring-1 ring-line">
              <Icon name={busy ? "timer" : "plus"} size={18} strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-bold text-ink">
                {busy ? "Processing photo…" : "Upload a photo"}
              </span>
              <span className="block text-[10.5px] leading-relaxed text-muted">
                JPG, PNG or WebP up to 6 MB. The sandbox rebuilds the pixels before saving.
              </span>
            </span>
          </label>
          <input
            id="story-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={pickFile}
          />
          {error ? (
            <p role="alert" className="mt-2 text-[11px] font-medium text-[#b3261e]">
              {error}
            </p>
          ) : null}
        </div>
      )}

      <section className="mt-6" aria-labelledby="story-from-snags">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            id="story-from-snags"
            className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
          >
            Or share one of your snags
          </h3>
          <span className="text-[10px] text-faint">{mySnags.length} to choose from</span>
        </div>

        {mySnags.length > 0 ? (
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {mySnags.slice(0, 8).map((snag) => (
              <button
                key={snag.id}
                type="button"
                onClick={() => shareSnag(snag)}
                aria-label={`Share ${snag.title} to your story`}
                className="group relative overflow-hidden rounded-xl bg-surface text-left transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <img
                  src={snag.image}
                  alt=""
                  className="aspect-[4/5] h-full w-full object-cover"
                  draggable={false}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-6 text-[8.5px] font-semibold leading-tight text-white">
                  {snag.category}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2.5 rounded-xl border border-line bg-white px-4 py-6 text-center">
            <p className="text-[12px] font-semibold text-ink">No snags to share yet</p>
            <p className="mx-auto mt-1 max-w-[34ch] text-[11px] leading-relaxed text-muted">
              Post a clip, loadout or base build first, or add a photo above.
            </p>
            <button
              type="button"
              onClick={onCreate}
              className="mt-3 h-9 rounded-full bg-ink px-4 text-[11px] font-semibold text-white transition-colors hover:bg-[#22252a]"
            >
              Create a snag
            </button>
          </div>
        )}
      </section>

      <p className="mt-5 text-[10px] leading-relaxed text-faint">
        Stories are stills in this build. Video stories would follow the same 50 MB clip limits as
        a post.
      </p>
    </Sheet>
  );
}
