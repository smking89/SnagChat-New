import { findFrame, type FrameEffectId, type FrameTarget, type FrameUse } from "../data/frames";
import { Avatar } from "./Avatar";
import { FrameLayer, Nameplate } from "./FrameArt";
import { Icon } from "./Icon";

const SAMPLE_ART: Record<FrameTarget, string> = {
  avatar: "/snags/squad-room.jpg",
  banner: "/snags/ridge-light.jpg",
  nameplate: "/snags/controller.jpg",
  snag: "/snags/summit.jpg",
};

const SAMPLE_FACE = "/snags/squad-room.jpg";

/**
 * A live sample on the surface the frame is actually sold for: a profile photo,
 * a profile banner, a chat header nameplate, or a whole feed card. It uses the
 * same renderers as the app, so the preview is the real thing rather than a
 * square stand-in. `compact` is for catalogue tiles; the full size is for the
 * shop's preview panel.
 */
export function FramePreview({
  frameId,
  effect,
  sample,
  avatarSize,
  className = "",
  playing = false,
  compact = false,
}: {
  frameId: string;
  effect: FrameEffectId;
  sample?: string;
  /** Overrides the avatar diameter on the avatar surface. */
  avatarSize?: number;
  className?: string;
  /** Runs one-shot effects on mount; remount with a key to replay them. */
  playing?: boolean;
  compact?: boolean;
}) {
  const frame = findFrame(frameId);
  if (!frame) return null;

  const use: FrameUse = { frameId, effect };
  const art = sample ?? SAMPLE_ART[frame.target];
  const host = `frame-host ${playing ? "is-playing" : ""} ${className}`;

  if (frame.target === "avatar") {
    const size = avatarSize ?? (compact ? 46 : 80);
    return (
      <div className={`${host} flex w-full min-w-0 items-center gap-3`}>
        <Avatar name="MasonR" size={size} tone="soft" src={art} frame={use} online />
        <div className="min-w-0">
          <p
            className={`flex min-w-0 items-center gap-1 font-display font-extrabold tracking-[-0.03em] ${
              compact ? "text-[12px]" : "text-[17px]"
            }`}
          >
            <span className="truncate">MasonR</span>
            <Icon name="verified" size={compact ? 11 : 14} className="shrink-0 text-[#1d9bf0]" />
          </p>
          <p className={`mt-0.5 truncate text-muted ${compact ? "text-[10px]" : "text-[11.5px]"}`}>
            @masonr · DayZ
          </p>
          {!compact ? (
            <p className="mt-1.5 text-[10.5px] text-faint">Profile photo</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (frame.target === "banner") {
    return (
      <div className={`${host} w-full`}>
        <div
          className={`relative w-full overflow-hidden rounded-xl bg-brand-tint ${
            compact ? "h-[62px]" : "h-[116px]"
          }`}
        >
          <img
            src={art}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
          <FrameLayer use={use} target="banner" />
        </div>
        <div
          className={`flex items-end gap-2 px-2 sm:px-3 ${
            compact ? "-mt-[15px]" : "-mt-7"
          }`}
        >
          <Avatar
            name="MasonR"
            size={compact ? 30 : 54}
            tone="soft"
            src={SAMPLE_FACE}
            className="ring-2 ring-white"
          />
          <div className="min-w-0 pb-0.5">
            <p
              className={`truncate font-display font-extrabold tracking-[-0.03em] ${
                compact ? "text-[11px]" : "text-[15px]"
              }`}
            >
              MasonR
            </p>
            <p className={`truncate text-muted ${compact ? "text-[9px]" : "text-[10.5px]"}`}>
              @masonr
            </p>
          </div>
        </div>
        {!compact ? (
          <p className="mt-2 px-3 text-[10.5px] text-faint">Profile banner · 128px tall</p>
        ) : null}
      </div>
    );
  }

  if (frame.target === "nameplate") {
    return (
      <div className={`${host} w-full overflow-hidden rounded-xl border border-line bg-white`}>
        <div className={`flex items-center gap-2 px-2.5 ${compact ? "py-1.5" : "py-2.5"}`}>
          <Icon name="back" size={compact ? 12 : 15} className="shrink-0 text-muted" />
          <Avatar
            name="MasonR"
            size={compact ? 24 : 32}
            tone="soft"
            src={SAMPLE_FACE}
            online
          />
          <Nameplate
            text="MasonR"
            use={use}
            verified
            textClassName={
              compact ? "text-[11px] font-bold text-ink" : "text-[14px] font-extrabold text-ink"
            }
          />
          <span className="ml-auto flex shrink-0 items-center gap-2 text-faint">
            <Icon name="message" size={compact ? 12 : 15} />
            <Icon name="more" size={compact ? 12 : 15} />
          </span>
        </div>
        <div
          className={`flex items-end gap-2 border-t border-line/70 px-3 ${
            compact ? "py-2" : "py-3"
          }`}
        >
          <Avatar name="MasonR" size={compact ? 17 : 22} tone="soft" src={SAMPLE_FACE} />
          <span
            className={`max-w-[85%] rounded-2xl rounded-bl-md bg-surface px-2.5 py-1.5 text-[#4d535c] ${
              compact ? "text-[9.5px]" : "text-[11px]"
            }`}
          >
            run it back
          </span>
        </div>
        {!compact ? (
          <p className="border-t border-line/70 bg-[#fbfbfc] px-3 py-1.5 text-[10px] text-faint">
            Chat header nameplate
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${host} mx-auto w-full ${compact ? "max-w-[156px]" : "max-w-[300px]"}`}>
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(23,25,29,0.1)] ring-1 ring-line">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          <img
            src={art}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        <div className={`bg-white ${compact ? "px-2 pb-2 pt-1.5" : "px-3 pb-3 pt-2.5"}`}>
          <div className="flex items-center gap-1.5">
            <Avatar name="MasonR" size={compact ? 14 : 20} tone="soft" src={SAMPLE_FACE} />
            <span
              className={`min-w-0 truncate font-semibold text-ink ${
                compact ? "text-[8.5px]" : "text-[10.5px]"
              }`}
            >
              @masonr
            </span>
            <span className={`ml-auto shrink-0 text-faint ${compact ? "text-[8px]" : "text-[9.5px]"}`}>
              2h
            </span>
          </div>
          <p
            className={`min-w-0 font-bold leading-[1.3] tracking-[-0.01em] text-ink ${
              compact ? "mt-1 line-clamp-2 text-[9px]" : "mt-1.5 line-clamp-2 text-[12px]"
            }`}
          >
            Ridge outpost, third wipe running
          </p>
        </div>
        {/* The card frame runs around the entire card, meta strip included. */}
        <FrameLayer use={use} target="snag" />
      </div>
      {!compact ? (
        <p className="mt-2 text-center text-[10px] text-faint">Frame wraps the whole card</p>
      ) : null}
    </div>
  );
}
