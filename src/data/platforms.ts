export type PlatformId = "pc" | "console";

export type Platform = {
  id: PlatformId;
  label: string;
  hint: string;
};

export const PLATFORMS: Platform[] = [
  { id: "pc", label: "PC", hint: "Steam, Epic, Battle.net" },
  { id: "console", label: "Console", hint: "Xbox, PlayStation, Switch" },
];

/** `["pc", "console"]` → `PC + Console`. */
export function platformLabel(ids: string[]): string | null {
  const pc = ids.includes("pc");
  const console = ids.includes("console");
  if (pc && console) return "PC + Console";
  if (pc) return "PC";
  if (console) return "Console";
  return null;
}

export function isValidPlatforms(ids: string[]): boolean {
  return Array.isArray(ids) && ids.length > 0 && ids.every((id) => id === "pc" || id === "console");
}
