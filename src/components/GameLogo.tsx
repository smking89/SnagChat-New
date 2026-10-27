import { findGame, gameLogo } from "../data/games";

/**
 * Publisher logo for a game. Renders nothing for titles outside the catalogue,
 * so callers can decide on a text fallback.
 */
export function GameLogo({
  game,
  height = 14,
  className,
}: {
  game: string;
  height?: number;
  className?: string;
}) {
  const src = gameLogo(game);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      title={game}
      style={{ height }}
      className={`w-auto max-w-full object-contain ${className ?? ""}`}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

/**
 * Game badge for posts. Shows the real logo where the title is catalogued and
 * falls back to the name so "Other" posts still say what game they are.
 */
export function GameChip({ game, className }: { game: string; className?: string }) {
  const known = Boolean(findGame(game));

  return (
    <span
      className={`flex max-w-full items-center rounded-lg border border-white/25 bg-[#080a0e]/60 px-2 py-1.5 backdrop-blur-md ${
        className ?? ""
      }`}
    >
      {known ? (
        <GameLogo game={game} height={15} className="max-w-[96px]" />
      ) : (
        <span className="truncate text-[9.5px] font-extrabold uppercase leading-none tracking-[0.09em] text-white">
          {game}
        </span>
      )}
      <span className="sr-only">{game}</span>
    </span>
  );
}
