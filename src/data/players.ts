export type Player = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  game: string;
  followers: number;
  following: number;
  avatar?: string;
  banner?: string;
  /** Stored MP4 profile art: the still above is its first frame. */
  avatarClip?: string;
  bannerClip?: string;
  /** Presence dot next to the avatar. */
  online?: boolean;
  /** Blue check next to the name. */
  verified?: boolean;
  /** Private accounts only show their snags to followers. */
  private?: boolean;
};

/**
 * There is one account — yours. Followers, following and presence start empty
 * and are only filled by things that actually happen, so nothing here is
 * invented.
 */
const PLAYER_SEED: Player[] = [
  {
    id: "you",
    name: "You",
    handle: "you",
    bio: "",
    game: "",
    followers: 0,
    following: 0,
  },
];

export const PLAYERS: Player[] = PLAYER_SEED;

export const ME = PLAYERS[0];

export function findPlayer(idOrHandle: string): Player | undefined {
  const key = idOrHandle.trim().toLowerCase();
  return PLAYERS.find(
    (player) => player.id === key || player.handle.toLowerCase() === key || player.name.toLowerCase() === key,
  );
}

/**
 * Username lookup for inviting to a squad. Matches on @handle or display name,
 * exact and prefix matches first so typing a full handle lands at the top.
 */
export function searchPlayers(query: string): Player[] {
  const needle = query.trim().toLowerCase().replace(/^@/, "");
  if (!needle) return [];

  const score = (player: Player) => {
    const handle = player.handle.toLowerCase();
    const name = player.name.toLowerCase();
    if (handle === needle) return 0;
    if (name === needle) return 1;
    if (handle.startsWith(needle)) return 2;
    if (name.startsWith(needle)) return 3;
    if (handle.includes(needle)) return 4;
    if (name.includes(needle)) return 5;
    return -1;
  };

  return PLAYERS.map((player) => ({ player, rank: score(player) }))
    .filter((entry) => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.player.name.localeCompare(b.player.name))
    .map((entry) => entry.player);
}

export function findPlayerId(idOrHandle: string): string {
  return findPlayer(idOrHandle)?.id ?? idOrHandle.toLowerCase();
}

export function formatCount(value: number): string {
  if (value >= 1000) {
    const rounded = value / 1000;
    return `${rounded >= 10 ? Math.round(rounded) : rounded.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}
