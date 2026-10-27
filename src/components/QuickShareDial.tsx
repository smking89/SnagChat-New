import { useEffect, useMemo, useRef, useState } from "react";
import type { Snag } from "../data/snags";
import { DIAL_SLOT, dialLayout, type DialTarget } from "../lib/dial";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { haptic } from "./Toast";

/** How much of a slot's own width counts as its magnetic grab radius. */
const MAGNET = 0.62;
/** Air around a slot's rim that still counts as a grab. */
const MAGNET_PAD = 14;
/** Room left past the outer slots before a release reads as "let go". */
const ESCAPE_PAD = 30;
/** The neutral harbour, small enough never to hide a slot, big enough to read. */
const HARBOUR_MIN = 52;
const HARBOUR_MAX = 108;
const SEND_MS = 180;

type Props = {
  snag: Snag;
  targets: DialTarget[];
  /** Where the finger went down, in viewport coordinates. */
  origin: { x: number; y: number };
  /** Empty for every target in the dial, plus the "snag to all" anchor. */
  onSend: (targets: DialTarget[], all: boolean) => void;
  onCancel: () => void;
};

type Slot = { target: DialTarget | null; all: boolean };

/**
 * Hold-to-share. The dial blooms out of the thumb on the biggest ring the
 * screen allows — the layout keeps every slot clear of the finger — the nearest
 * slot grabs the finger inside its magnetic radius, and releasing over one
 * delivers the snag. Releasing in the middle, or past the ring, cancels.
 */
export function QuickShareDial({ snag, targets, origin, onSend, onCancel }: Props) {
  const [pointer, setPointer] = useState(origin);
  const [active, setActive] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const pointerRef = useRef(pointer);
  const activeRef = useRef<number | null>(null);
  const sendingRef = useRef(false);

  const slots = useMemo<Slot[]>(() => {
    if (targets.length <= 1) return targets.map((target) => ({ target, all: false }));
    // The purple anchor rides at the top and blasts the snag to everything.
    return [{ target: null, all: true }, ...targets.map((target) => ({ target, all: false }))];
  }, [targets]);

  const viewport = useMemo(() => {
    if (typeof window === "undefined") return { width: 390, height: 780 };
    return { width: window.innerWidth, height: window.innerHeight };
  }, []);

  const places = useMemo(
    () => dialLayout(slots.length, origin, viewport, { slot: DIAL_SLOT }),
    [slots.length, origin, viewport],
  );

  /** Where the dial ends, and the harbour the thumb releases in to cancel. */
  const geometry = useMemo(() => {
    if (places.length === 0) {
      return { harbour: HARBOUR_MIN, escape: ESCAPE_PAD + DIAL_SLOT / 2 };
    }
    const inner = Math.min(...places.map((place) => place.radius));
    const outer = Math.max(...places.map((place) => place.radius));
    const widest = Math.max(...places.map((place) => place.size));
    return {
      harbour: Math.max(HARBOUR_MIN, Math.min(HARBOUR_MAX, inner - widest / 2 - 14)),
      escape: outer + widest / 2 + ESCAPE_PAD,
    };
  }, [places]);

  const distanceFromOrigin = Math.hypot(pointer.x - origin.x, pointer.y - origin.y);
  const inDeadZone = distanceFromOrigin <= geometry.harbour;
  const escaped = distanceFromOrigin > geometry.escape;
  const grabbed = active !== null && !inDeadZone && !escaped ? slots[active] : null;

  // Tracking lives on the window so the drag keeps working outside the overlay.
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (sendingRef.current) return;
      const next = { x: event.clientX, y: event.clientY };
      pointerRef.current = next;
      setPointer(next);

      const far = Math.hypot(next.x - origin.x, next.y - origin.y);
      if (far <= geometry.harbour || far > geometry.escape) {
        if (activeRef.current !== null) {
          activeRef.current = null;
          setActive(null);
        }
        return;
      }

      // Each slot grabs within its own drawn size, so a big slot is easy to hit.
      let bestIndex: number | null = null;
      let bestGap = Infinity;
      places.forEach((place, index) => {
        const grab = place.size * MAGNET + MAGNET_PAD;
        const gap = Math.hypot(next.x - place.x, next.y - place.y);
        if (gap < grab && gap < bestGap) {
          bestGap = gap;
          bestIndex = index;
        }
      });

      const chosen = bestIndex as number | null;
      if (chosen !== activeRef.current) {
        if (chosen !== null) haptic(12);
        activeRef.current = chosen;
        setActive(chosen);
      }
    };

    const release = () => {
      if (sendingRef.current) return;
      const index = activeRef.current;
      const far = Math.hypot(pointerRef.current.x - origin.x, pointerRef.current.y - origin.y);

      if (index === null || far > geometry.escape || far <= geometry.harbour) {
        onCancel();
        return;
      }

      const slot = slots[index];
      sendingRef.current = true;
      setSending(true);
      haptic([18, 40, 18]);

      // Let the burst land before the feed comes back.
      window.setTimeout(() => {
        if (slot.all) {
          const picked = slots.filter((item) => item.target).map((item) => item.target as DialTarget);
          onSend(picked, true);
          return;
        }
        onSend(slot.target ? [slot.target] : [], false);
      }, SEND_MS);
    };

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", key);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", key);
    };
  }, [geometry.escape, geometry.harbour, origin, places, slots, onCancel, onSend]);

  const lineTo = (() => {
    if (grabbed && active !== null) {
      const place = places[active];
      return { x: place.x, y: place.y };
    }
    return pointer;
  })();

  return (
    <div className="fixed inset-0 z-[70] select-none" role="dialog" aria-label={`Share ${snag.title}`}>
      <div className="dial-scrim absolute inset-0 bg-black/40" />

      <div className="pointer-events-none absolute inset-x-0 top-[max(14px,env(safe-area-inset-top))] flex justify-center px-4">
        <div className="max-w-[82%] rounded-2xl bg-black/55 px-3.5 py-2.5 text-center backdrop-blur-md">
          <p className="truncate text-[12.5px] font-bold text-white">{snag.title}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
            {grabbed
              ? grabbed.all
                ? "Snag to all"
                : grabbed.target?.name
              : inDeadZone
                ? "Release to cancel"
                : escaped
                  ? "Far from the dial — release to cancel"
                  : "Slide to a squad"}
          </p>
        </div>
      </div>

      {/* The targeting beam runs from the thumb to whatever it has grabbed. */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="dial-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9400d3" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#9400d3" stopOpacity="0" />
          </linearGradient>
        </defs>
        {grabbed && active !== null ? (
          <line
            x1={origin.x}
            y1={origin.y}
            x2={lineTo.x}
            y2={lineTo.y}
            stroke="url(#dial-beam)"
            strokeWidth={grabbed.all ? 4 : 2.5}
            strokeLinecap="round"
          />
        ) : null}
      </svg>

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${
          escaped ? "opacity-50" : "opacity-100"
        }`}
      >
        {slots.map((slot, index) => {
          const place = places[index];
          if (!place) return null;
          const isActive = active === index && !inDeadZone && !escaped;
          const label = slot.all ? "Snag to all" : (slot.target?.name ?? "");
          const fill = slot.all ? "bg-brand text-white" : "bg-white";
          // The anchor reads as the headline action, so it is drawn a touch wider.
          const size = slot.all ? place.size + 6 : place.size;
          // Labels face away from the thumb, so the hand never hides a name.
          const labelBelow = place.y < origin.y;

          return (
            <div
              key={slot.all ? "all" : (slot.target?.key ?? index)}
              className="dial-slot absolute"
              style={{
                left: place.x,
                top: place.y,
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                ["--dial-delay" as string]: `${index * 20}ms`,
              }}
            >
              <div
                className={`relative grid h-full w-full place-items-center rounded-full ${fill} transition-transform duration-[60ms] ${
                  isActive ? "scale-[1.12] ring-[5px] ring-brand" : ""
                } ${sending && isActive ? "dial-send" : ""}`}
                style={{ boxShadow: "0 12px 30px rgba(0,0,0,0.28)" }}
              >
                {slot.all ? (
                  <Icon name="send" size={Math.round(size * 0.34)} strokeWidth={2.2} />
                ) : slot.target ? (
                  <Avatar
                    name={slot.target.name}
                    size={Math.max(34, size - 14)}
                    tone={slot.target.kind === "squad" ? "brand" : "soft"}
                    src={slot.target.avatar}
                  />
                ) : null}

                {sending && isActive ? (
                  <>
                    <span aria-hidden="true" className="dial-shockwave absolute inset-0 rounded-full border-2 border-white" />
                    <span className="absolute inset-0 grid place-items-center rounded-full bg-brand text-white">
                      <Icon name="check" size={Math.round(size * 0.3)} strokeWidth={2.8} />
                    </span>
                    {[0, 60, 120, 180, 240, 300].map((angle) => (
                      <span
                        key={angle}
                        aria-hidden="true"
                        className="dial-particle absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#c46bff]"
                        style={{
                          ["--dx" as string]: `${Math.cos((angle * Math.PI) / 180) * 34}px`,
                          ["--dy" as string]: `${Math.sin((angle * Math.PI) / 180) * 34}px`,
                        }}
                      />
                    ))}
                  </>
                ) : null}
              </div>

              <span
                className={`absolute left-1/2 w-[136px] -translate-x-1/2 text-center text-[12px] font-bold leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] transition-colors ${
                  labelBelow ? "top-full mt-2.5" : "bottom-full mb-2.5"
                } ${isActive ? "text-white" : "text-white/75"}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* The neutral harbour: releasing here cancels, and it says so. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute grid place-items-center rounded-full border-2 border-dashed border-white/45"
        style={{
          left: origin.x - geometry.harbour,
          top: origin.y - geometry.harbour,
          width: geometry.harbour * 2,
          height: geometry.harbour * 2,
        }}
      >
        <span
          className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] transition-colors ${
            inDeadZone ? "bg-black/70 text-white" : "bg-black/35 text-white/70"
          }`}
        >
          Cancel
        </span>
      </div>
    </div>
  );
}
