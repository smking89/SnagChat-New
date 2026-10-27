import { gameLogo } from "../data/games";

/**
 * Publisher logos are white-ish artwork, so how they read depends on what is
 * behind them. "onDark" leaves the art alone and adds a soft shadow; "onLight"
 * draws a dark outline around it, which keeps the logo in its own colours and
 * legible on white instead of flattening it to a silhouette.
 */
export type GameArtTone = "onDark" | "onLight";

const HALO =
  "drop-shadow(0 0 1px rgba(10,12,16,0.95)) drop-shadow(0 0 1px rgba(10,12,16,0.9)) drop-shadow(0 1px 1px rgba(10,12,16,0.7))";

/**
 * Publisher logo for a game, sized to fit inside a box rather than stretched to
 * a height. Wordmarks have very different shapes — "CALL OF DUTY" is a wide
 * strip while "SKYRIM" is tall — and fitting both limits keeps them the same
 * visual weight next to each other.
 */
export function GameLogo({
  game,
  height = 26,
  width,
  tone = "onDark",
  className,
}: {
  game: string;
  /** Tallest the artwork may be. */
  height?: number;
  /** Widest the artwork may be. Defaults to the space it is in. */
  width?: number;
  tone?: GameArtTone;
  className?: string;
}) {
  const src = gameLogo(game);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      title={game}
      style={{ maxHeight: height, maxWidth: width ?? "100%", filter: tone === "onLight" ? HALO : undefined }}
      className={`h-auto w-auto max-w-full object-contain ${
        tone === "onDark" ? "drop-shadow-[0_1px_3px_rgba(8,10,14,0.65)]" : ""
      } ${className ?? ""}`}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

/**
 * Game badge for posts: the real logo where the title is catalogued, and the
 * name itself for "Other" posts so they still say what game they are. Either
 * way it sits straight on the artwork — no plate behind it.
 */
export function GameTag({
  game,
  height = 30,
  width = 128,
  tone = "onDark",
  className,
}: {
  game: string;
  height?: number;
  width?: number;
  tone?: GameArtTone;
  className?: string;
}) {
  if (gameLogo(game)) {
    return (
      <span className={`flex min-w-0 items-center ${className ?? ""}`}>
        <GameLogo game={game} height={height} width={width} tone={tone} />
        <span className="sr-only">{game}</span>
      </span>
    );
  }

  return (
    <span
      className={`min-w-0 truncate text-[11px] font-extrabold uppercase leading-none tracking-[0.09em] ${
        tone === "onDark" ? "text-white drop-shadow-[0_1px_3px_rgba(8,10,14,0.6)]" : "text-ink"
      } ${className ?? ""}`}
    >
      {game}
    </span>
  );
}
