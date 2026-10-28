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

const PLAYER_SEED: Player[] = [
  {
    id: "you",
    name: "You",
    handle: "you",
    bio: "Building the feed. Rust main, occasional DayZ wanderer.",
    game: "Rust",
    followers: 248,
    following: 112,
  },
  {
    id: "masonr",
    name: "MasonR",
    handle: "masonr",
    bio: "Night-city clips and questionable decisions. Neon district resident.",
    game: "Cyberpunk 2077",
    followers: 12400,
    following: 268,
  },
  {
    id: "luma",
    name: "Luma",
    handle: "luma",
    bio: "Squad captain. Purple hour enthusiast. I shoot the room, not the lobby.",
    game: "Call of Duty",
    followers: 8600,
    following: 412,
  },
  {
    id: "kirav",
    name: "KiraV",
    handle: "kirav",
    bio: "DayZ bases in the fog. Will trade loot for a good ridge line.",
    game: "DayZ",
    followers: 5400,
    following: 190,
  },
  {
    id: "vexx",
    name: "vexx",
    handle: "vexx",
    bio: "Arcade rat. Fight sticks only. No pad, no excuses.",
    game: "Street Fighter 6",
    followers: 3100,
    following: 96,
  },
  {
    id: "drew",
    name: "Drew",
    handle: "drew",
    bio: "Long roads, empty servers, 300 clicks to the next town.",
    game: "DayZ",
    followers: 980,
    following: 142,
  },
  {
    id: "nyx",
    name: "Nyx",
    handle: "nyx",
    bio: "Late queues and louder comms. Apex until the sun comes up.",
    game: "Apex Legends",
    followers: 2210,
    following: 310,
  },
  {
    id: "aster",
    name: "Aster",
    handle: "aster",
    bio: "Lakes, fog, no HUD. Base builds only.",
    game: "DayZ",
    followers: 4450,
    following: 205,
  },
  {
    id: "mira",
    name: "Mira",
    handle: "mira",
    bio: "Elden Ring lore posts and castle shots. The fog is the point.",
    game: "Elden Ring",
    followers: 6900,
    following: 158,
  },
  {
    id: "rook",
    name: "Rook",
    handle: "rook",
    bio: "400m up, looking down. Coastlines are my favourite loadout.",
    game: "Battlefield",
    followers: 1320,
    following: 88,
  },
  {
    id: "jax",
    name: "Jax",
    handle: "jax",
    bio: "Controller always warm. Warzone loadouts and long sessions.",
    game: "Call of Duty",
    followers: 2050,
    following: 176,
  },
  {
    id: "noxx",
    name: "noxx",
    handle: "noxx",
    bio: "Keybinds, rigs, no fluff. Ask me about my sens.",
    game: "Rust",
    followers: 3780,
    following: 121,
  },
  {
    id: "otis",
    name: "Otis",
    handle: "otis",
    bio: "Couch co-op with the crew. Two controllers, one screen.",
    game: "Rocket League",
    followers: 640,
    following: 210,
  },
  {
    id: "sable",
    name: "Sable",
    handle: "sable",
    bio: "Rig builder. Twin 4080s and a lot of cable ties.",
    game: "Rust",
    followers: 8900,
    following: 64,
  },
  {
    id: "wren",
    name: "Wren",
    handle: "wren",
    bio: "No HUD, just stars. Night builds in the north.",
    game: "DayZ",
    followers: 1150,
    following: 133,
  },
  {
    id: "kit",
    name: "Kit",
    handle: "kit",
    bio: "Summits at first light. Skyrim on max draw distance.",
    game: "Skyrim",
    followers: 730,
    following: 54,
  },
];

const VERIFIED_PLAYERS = new Set(["masonr", "luma", "kirav", "vexx", "rook", "aster"]);
const ONLINE_PLAYERS = new Set(["you", "luma", "nyx", "rook", "kit"]);
const PRIVATE_PLAYERS = new Set(["nyx", "wren"]);

export const PLAYERS: Player[] = PLAYER_SEED.map((player) => ({
  ...player,
  online: ONLINE_PLAYERS.has(player.id),
  verified: VERIFIED_PLAYERS.has(player.id),
  private: PRIVATE_PLAYERS.has(player.id),
}));

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
