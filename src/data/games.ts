export type Game = {
  /** Stored on a snag and used as the display name. */
  name: string;
  /** Official logo. Steam titles load it from the publisher's own store CDN. */
  logo?: string;
  /** Other names players use for the same title, so older posts still resolve. */
  aliases?: string[];
};

const steamLogo = (appId: number) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/logo.png`;

/**
 * The game catalogue. Logos belong to their publishers and are loaded from the
 * publisher's store CDN rather than bundled with the app, so swap in licensed
 * artwork here before shipping the posts commercially.
 */
export const GAMES: Game[] = [
  { name: "Rust", logo: steamLogo(252490), aliases: ["rust pc", "rust console"] },
  { name: "Minecraft", logo: "/games/minecraft.png", aliases: ["minecraft java", "minecraft bedrock"] },
  { name: "ARK: Survival Ascended", logo: steamLogo(2399830), aliases: ["ark", "ark ascended", "ark survival", "ark survival evolved"] },
  { name: "DayZ", logo: steamLogo(221100) },
  { name: "Call of Duty", logo: steamLogo(1938090), aliases: ["cod", "warzone", "call of duty warzone"] },
  { name: "Palworld", logo: steamLogo(1623730) },
  { name: "Conan Exiles", logo: steamLogo(440900), aliases: ["conan"] },
  { name: "Cyberpunk 2077", logo: steamLogo(1091500), aliases: ["cyberpunk"] },
  { name: "Apex Legends", logo: steamLogo(1172470), aliases: ["apex"] },
  { name: "Elden Ring", logo: steamLogo(1245620) },
  { name: "Rocket League", logo: steamLogo(252950) },
  { name: "Street Fighter 6", logo: steamLogo(1364780), aliases: ["sf6", "street fighter"] },
  { name: "Skyrim", logo: steamLogo(489830), aliases: ["elder scrolls", "the elder scrolls v skyrim"] },
  { name: "Squad", logo: steamLogo(393380) },
  { name: "Battlefield", logo: steamLogo(1517290), aliases: ["battlefield 2042", "bf2042"] },
];

/** The catch-all for any title that is not in the list. */
export const OTHER_GAME = "Other";

/** Shortlist offered when posting: the survival-shooter staples, then Other. */
export const GAME_PICKS = [
  "Rust",
  "Minecraft",
  "ARK: Survival Ascended",
  "DayZ",
  "Call of Duty",
  "Palworld",
  "Conan Exiles",
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
