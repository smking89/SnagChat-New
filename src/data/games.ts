export type Game = {
  /** Stored on a snag and used as the display name. */
  name: string;
  /**
   * Official logo, bundled locally and cropped to the artwork's own edges so it
   * can sit straight on a post without a backing plate. Logos belong to their
   * publishers — swap in licensed artwork here before shipping commercially.
   */
  logo?: string;
  /** Other names players use for the same title, so older posts still resolve. */
  aliases?: string[];
};

/** The game catalogue. Files live in public/games/<slug>.png. */
export const GAMES: Game[] = [
  { name: "Rust", logo: "/games/rust.png", aliases: ["rust pc", "rust console"] },
  {
    name: "Counter-Strike 2",
    logo: "/games/cs2.png",
    aliases: ["cs2", "csgo", "cs:go", "counter strike", "counter-strike"],
  },
  { name: "VALORANT", logo: "/games/valorant.png", aliases: ["val"] },
  { name: "Minecraft", logo: "/games/minecraft.png", aliases: ["minecraft java", "minecraft bedrock"] },
  {
    name: "ARK: Survival Ascended",
    logo: "/games/ark.png",
    aliases: ["ark", "ark ascended", "ark survival", "ark survival evolved"],
  },
  { name: "DayZ", logo: "/games/dayz.png" },
  { name: "7 Days to Die", logo: "/games/seven-days.png", aliases: ["7 days", "7dtd", "seven days to die"] },
  { name: "SCUM", logo: "/games/scum.png" },
  { name: "Valheim", logo: "/games/valheim.png" },
  { name: "Satisfactory", logo: "/games/satisfactory.png" },
  { name: "Unturned", logo: "/games/unturned.png" },
  { name: "Enshrouded", logo: "/games/enshrouded.png" },
  { name: "Call of Duty", logo: "/games/call-of-duty.png", aliases: ["cod", "warzone", "call of duty warzone"] },
  { name: "Palworld", logo: "/games/palworld.png" },
  { name: "Conan Exiles", logo: "/games/conan-exiles.png", aliases: ["conan"] },
  { name: "Cyberpunk 2077", logo: "/games/cyberpunk-2077.png", aliases: ["cyberpunk"] },
  { name: "Apex Legends", logo: "/games/apex-legends.png", aliases: ["apex"] },
  { name: "Elden Ring", logo: "/games/elden-ring.png" },
  { name: "Rocket League", logo: "/games/rocket-league.png" },
  { name: "Street Fighter 6", logo: "/games/street-fighter-6.png", aliases: ["sf6", "street fighter"] },
  { name: "Skyrim", logo: "/games/skyrim.png", aliases: ["elder scrolls", "the elder scrolls v skyrim"] },
  { name: "Squad", logo: "/games/squad.png" },
  { name: "Battlefield", logo: "/games/battlefield.png", aliases: ["battlefield 2042", "bf2042"] },
];

/** The catch-all for any title that is not in the list. */
export const OTHER_GAME = "Other";

/** Shortlist offered when posting: the survival-shooter staples, then Other. */
export const GAME_PICKS = [
  "Rust",
  "Counter-Strike 2",
  "VALORANT",
  "Minecraft",
  "ARK: Survival Ascended",
  "DayZ",
  "7 Days to Die",
  "SCUM",
  "Valheim",
  "Satisfactory",
  "Unturned",
  "Enshrouded",
  "Palworld",
  OTHER_GAME,
];

const BY_NAME = new Map<string, Game>();
for (const game of GAMES) {
  BY_NAME.set(game.name.toLowerCase(), game);
  for (const alias of game.aliases ?? []) BY_NAME.set(alias, game);
}

export function findGame(name: string): Game | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}

export function gameLogo(name: string): string | undefined {
  return findGame(name)?.logo;
}

/** True when the name is one of the catalogued titles, not free text. */
export function isCatalogGame(name: string): boolean {
  return GAMES.some((game) => game.name === name);
}

/**
 * Short genre label shown next to a game in the pickers, the quick-add sheet
 * and search rows, so a list of titles scans by what kind of game it is.
 */
export const GAME_CATEGORIES: Record<string, string> = {
  Rust: "Survival",
  "Counter-Strike 2": "Shooter",
  VALORANT: "Shooter",
  Minecraft: "Sandbox",
  "ARK: Survival Ascended": "Survival",
  DayZ: "Survival",
  "7 Days to Die": "Survival",
  SCUM: "Survival",
  Valheim: "Survival",
  Satisfactory: "Factory",
  Unturned: "Survival",
  Enshrouded: "Survival",
  "Call of Duty": "Shooter",
  Palworld: "Adventure",
  "Conan Exiles": "Survival",
  "Cyberpunk 2077": "RPG",
  "Apex Legends": "Shooter",
  "Elden Ring": "RPG",
  "Rocket League": "Sports",
  "Street Fighter 6": "Fighting",
  Skyrim: "RPG",
  Squad: "Shooter",
  Battlefield: "Shooter",
};

export function gameCategory(name: string): string {
  return GAME_CATEGORIES[findGame(name)?.name ?? name.trim()] ?? "Game";
}

/**
 * The hashtag a post about this game should carry: the studio's own short name
 * where there is one ("ARK: Survival Ascended" → "#ark"), a slug otherwise.
 */
export function gameHashtag(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  const game = findGame(trimmed);
  const source = game ? game.name.split(":")[0] : trimmed;
  const slug = source.toLowerCase().replace(/[^a-z0-9]/g, "");
  return slug.length >= 2 ? slug : undefined;
}
