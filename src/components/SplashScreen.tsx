import { useEffect, useState } from "react";

/** The fist artwork measures 268 × 351, so the rubber band keeps that shape. */
const LOGO_W = 220;
const LOGO_H = 288;
const HOLD_MS = 1500;
const FADE_MS = 420;

/**
 * Launch splash: the purple brand with the fist logo rubber-banding in place,
 * then it fades out of the way. A reduced-motion preference stops the stretch
 * in CSS.
 */
export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const hold = window.setTimeout(() => setFading(true), HOLD_MS);
    const remove = window.setTimeout(() => setGone(true), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(remove);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center bg-brand transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <span
        aria-hidden="true"
        className="splash-logo"
        style={{ width: LOGO_W, height: LOGO_H }}
      />

      <p className="mt-6 font-display text-[15px] font-extrabold uppercase tracking-[0.34em] text-white">
        SnagChat
      </p>
      <p className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.3em] text-white/70">Play it. Share it.</p>
    </div>
  );
}
