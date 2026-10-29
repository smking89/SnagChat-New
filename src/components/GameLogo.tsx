import { gameLogo } from "../data/games";

/**
 * Publisher logo for a game, sized to fit inside a box rather than stretched to
 * a height. Wordmarks have very different shapes — "CALL OF DUTY" is a wide
 * strip while "SKYRIM" is tall — and fitting both limits keeps them the same
 * visual weight next to each other.
 *
 * The artwork sits straight on the page: no plate behind it, no shadow and no
 * outline, so a logo keeps its own edges and colours wherever it is used.
 */
export function GameLogo({
  game,
  height = 26,
  width,
  className,
}: {
  game: string;
  /** Tallest the artwork may be. */
  height?: number;
  /** Widest the artwork may be. Defaults to the space it is in. */
  width?: number;
  className?: string;
}) {
  const src = gameLogo(game);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      title={game}
      style={{ maxHeight: height, maxWidth: width ?? "100%" }}
      className={`h-auto w-auto max-w-full object-contain ${className ?? ""}`}
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
  /** Only affects the name fallback, which needs contrast on the artwork. */
  tone?: "onDark" | "onLight";
  className?: string;
}) {
  if (gameLogo(game)) {
    return (
      <span className={`flex min-w-0 items-center ${className ?? ""}`}>
        <GameLogo game={game} height={height} width={width} />
        <span className="sr-only">{game}</span>
      </span>
    );
  }

  return (
    <span
      className={`min-w-0 truncate text-[11px] font-extrabold uppercase leading-none tracking-[0.09em] ${
        tone === "onDark" ? "text-white" : "text-ink"
      } ${className ?? ""}`}
    >
      {game}
    </span>
  );
}
