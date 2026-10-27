export type RegionId = "us" | "eu" | "au" | "sea";

export type Region = {
  id: RegionId;
  label: string;
  area: string;
  /** Where the game servers for this region actually sit. */
  description: string;
};

export const REGIONS: Region[] = [
  {
    id: "us",
    label: "US",
    area: "United States",
    description: "Primarily split into US East and US West infrastructure.",
  },
  {
    id: "eu",
    label: "EU",
    area: "Europe",
    description: "Centralized data hubs serving the European region.",
  },
  {
    id: "au",
    label: "AU",
    area: "Australia",
    description: "Dedicated coverage for Oceania.",
  },
  {
    id: "sea",
    label: "SEA",
    area: "Southeast Asia",
    description: "Centered around hubs like Singapore to serve Asia-Pacific players.",
  },
];

export function findRegion(id?: string): Region | undefined {
  if (!id) return undefined;
  return REGIONS.find((region) => region.id === id);
}

/** e.g. `EU · Europe` for the account panel. */
export function regionLabel(id?: string): string | null {
  const region = findRegion(id);
  return region ? `${region.label} · ${region.area}` : null;
}
