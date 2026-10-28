import { findEffect, findFrame, type FrameUse, type FrameTarget } from "../data/frames";

/**
 * The two class names every animated frame needs: the effect itself, and
 * whether it loops or waits for a hover/replay.
 */
export function effectClasses(use: FrameUse | undefined): string {
  if (!use) return "";
  const effect = findEffect(use.effect);
  if (effect.id === "none") return "";
  return `fx-${effect.id} ${effect.mode === "once" ? "fx-once" : "fx-loop"}`;
}

type FrameLayerProps = {
  use?: FrameUse;
  target: FrameTarget;
  className?: string;
  /** Stretches the artwork to its box instead of preserving the viewBox. */
  fill?: boolean;
};

/**
 * One static SVG frame, layered over whatever it is framing. It never takes a
 * pointer, so the photo, banner and card underneath stay interactive.
 */
export function FrameLayer({ use, target, className = "", fill = true }: FrameLayerProps) {
  const frame = findFrame(use?.frameId);
  if (!use || !frame || frame.target !== target) return null;

  return (
    <img
      src={frame.art}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`frame-art pointer-events-none absolute inset-0 z-10 h-full w-full select-none ${effectClasses(
        use,
      )} ${className}`}
      style={fill ? { objectFit: "fill" } : { objectFit: "contain" }}
    />
  );
}

/**
 * A nameplate for chat headers and inbox rows. With no frame it renders as
 * ordinary text; with one, the artwork stretches behind the name.
 */
export function Nameplate({
  text,
  use,
  className = "",
  textClassName = "",
}: {
  text: string;
  use?: FrameUse;
  className?: string;
  textClassName?: string;
}) {
  const frame = findFrame(use?.frameId);

  if (!use || !frame || frame.target !== "nameplate") {
    return (
      <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
        <span className={`truncate ${textClassName}`}>{text}</span>
      </span>
    );
  }

  return (
    <span
      className={`frame-host relative inline-flex min-w-0 items-center justify-center px-3.5 py-1 ${className}`}
    >
      <FrameLayer use={use} target="nameplate" className="!z-0" />
      <span className={`relative z-10 flex min-w-0 items-center gap-1 ${textClassName}`}>
        <span className="truncate">{text}</span>
      </span>
    </span>
  );
}
