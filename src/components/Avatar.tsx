import type { FrameUse } from "../data/frames";
import { FrameLayer } from "./FrameArt";

type AvatarTone = "glass" | "soft" | "ink" | "brand";

const TONES: Record<AvatarTone, string> = {
  glass: "bg-white/20 text-white ring-1 ring-inset ring-white/35 backdrop-blur-sm",
  soft: "bg-brand-soft text-brand",
  ink: "bg-ink text-white",
  brand: "bg-brand text-white",
};

type AvatarProps = {
  name: string;
  size?: number;
  tone?: AvatarTone;
  className?: string;
  src?: string;
  /** An MP4 profile photo: plays on a loop in place of the still. */
  videoSrc?: string;
  /** Shows a green presence dot on the avatar. */
  online?: boolean;
  /** A purchased avatar frame and the effect it should play. */
  frame?: FrameUse;
};

export function Avatar({
  name,
  size = 22,
  tone = "soft",
  className = "",
  src,
  videoSrc,
  online = false,
  frame,
}: AvatarProps) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";

  const frameStyle = `shrink-0 rounded-full object-cover ${tone === "glass" ? "ring-1 ring-white/40" : ""} ${className}`;

  const face = videoSrc ? (
    <video
      src={videoSrc}
      poster={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      draggable={false}
      style={{ width: size, height: size }}
      className={frameStyle}
    />
  ) : src ? (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ width: size, height: size }}
      className={frameStyle}
    />
  ) : (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
      className={`grid shrink-0 place-items-center rounded-full font-bold leading-none ${TONES[tone]} ${className}`}
    >
      {letter}
    </span>
  );

  const dot = Math.max(8, Math.round(size * 0.3));

  return (
    <span
      className="frame-host relative isolate inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {face}

      {/* The frame is drawn 24% wider than the photo so the ring sits on the
          edge rather than over the face. It never catches a click. */}
      {frame ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[124%] w-[124%] -translate-x-1/2 -translate-y-1/2"
        >
          <FrameLayer use={frame} target="avatar" />
        </span>
      ) : null}

      {online ? (
        <span
          aria-hidden="true"
          title="Online"
          style={{ width: dot, height: dot }}
          className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-30 rounded-full border-2 border-white bg-[#22c55e] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        />
      ) : null}
    </span>
  );
}
