import { gameLogo } from "../data/games";

/**
 * Publisher logos are white artwork, so how they read depends on what is behind
 * them. "onDark" leaves the art alone; "onLight" darkens it with a filter, which
 * keeps it legible on white surfaces without putting a black plate behind it.
 */
export type GameArtTone = "onDark" | "onLight";

/**
 * Publisher logo for a game, cropped to its own edges so it fills the height it
 * is given. Renders nothing for titles outside the catalogue, so callers can
 * decide on a text fallback.
 */
export function GameLogo({
  game,
  height = 20,
  tone = "onDark",
  className,
}: {
  game: string;
  height?: number;
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
      style={{ height, filter: tone === "onLight" ? "brightness(0.15)" : undefined }}
      className={`w-auto max-w-full object-contain ${
        tone === "onDark" ? "drop-shadow-[0_1px_3px_rgba(8,10,14,0.6)]" : ""
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
  height = 22,
  tone = "onDark",
  className,
}: {
  game: string;
  height?: number;
  tone?: GameArtTone;
  className?: string;
}) {
  if (gameLogo(game)) {
    return (
      <span className={`flex min-w-0 items-center ${className ?? ""}`}>
        <GameLogo game={game} height={height} tone={tone} />
        <span className="sr-only">{game}</span>
      </span>
    );
  }

  return (
    <span
      className={`min-w-0 truncate text-[11px] font-extrabold uppercase leading-none tracking-[0.09em] ${
        tone === "onDark"
          ? "text-white drop-shadow-[0_1px_3px_rgba(8,10,14,0.6)]"
          : "text-ink"
      } ${className ?? ""}`}
    >
      {game}
    </span>
  );
}
