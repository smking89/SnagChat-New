export type SnagCategory = "Clips" | "Loadouts" | "Skins" | "Screenshots" | "Squad Galleries";

export type Snag = {
  id: string;
  title: string;
  game: string;
  category: SnagCategory;
  creator: string;
  creatorId?: string;
  squadId?: string;
  postedAt: string;
  image: string;
  /** CSS aspect-ratio value, e.g. "3 / 4.2" */
  aspect: string;
  duration?: string;
  /** Key for an uploaded MP4 in the clip store. `image` holds its poster frame. */
  clipId?: string;
  /** Set on sponsored posts. Only these show the report-ad action. */
  sponsoredBy?: string;
};

export type SnagDraft = {
  title: string;
  game: string;
  category: SnagCategory;
  image: string;
  aspect: string;
  duration?: string;
  clipId?: string;
  squadId?: string;
};

export const CATEGORIES = ["For You", "Clips", "Loadouts", "Skins", "Screenshots", "Squad Galleries"] as const;

export type FeedFilter = (typeof CATEGORIES)[number];

export type SwipeDirection = "left" | "right";

/**
 * The tab a swipe lands on: left goes forward through the rail, right goes back,
 * and the ends of the rail return null so the gesture stops instead of wrapping.
 */
export function nextCategory(current: FeedFilter, direction: SwipeDirection): FeedFilter | null {
  const index = CATEGORIES.indexOf(current);
  const next = direction === "left" ? index + 1 : index - 1;
  if (next < 0 || next >= CATEGORIES.length) return null;
  return CATEGORIES[next];
}

export const COVER_PRESETS: { id: string; label: string; image: string; aspect: string }[] = [
  { id: "neon", label: "Neon district", image: "/snags/neon-district.jpg", aspect: "3 / 4" },
  { id: "arcade", label: "Arcade run", image: "/snags/arcade-run.jpg", aspect: "1 / 1" },
  { id: "summit", label: "Summit", image: "/snags/summit.jpg", aspect: "4 / 3.2" },
  { id: "rig", label: "Rig check", image: "/snags/rig.jpg", aspect: "4 / 3.2" },
];

export const SEED_SNAGS: Snag[] = [
  {
    id: "snag-01",
    title: "Night run through the neon district #cyberpunk #clip",
    game: "Cyberpunk 2077",
    category: "Clips",
    creator: "MasonR",
    postedAt: "12m",
    image: "/snags/neon-district.jpg",
    aspect: "3 / 3.9",
    duration: "0:24",
  },
  {
    id: "snag-02",
    title: "Squad room, purple hour",
    game: "Call of Duty",
    category: "Squad Galleries",
    creator: "Luma",
    postedAt: "28m",
    image: "/snags/squad-room.jpg",
    aspect: "4 / 3.3",
    squadId: "night-shift",
  },
  {
    id: "snag-kings-01",
    title: "Ridge reset, no comms",
    game: "DayZ",
    category: "Squad Galleries",
    creator: "Nyx",
    creatorId: "nyx",
    postedAt: "3h",
    image: "/snags/summit.jpg",
    aspect: "4 / 3.4",
    squadId: "static-kings",
  },
  {
    id: "snag-03",
    title: "Last light on the ridge #dayz @kirav",
    game: "DayZ",
    category: "Screenshots",
    creator: "KiraV",
    postedAt: "41m",
    image: "/snags/ridge-light.jpg",
    aspect: "3 / 3.5",
  },
  {
    id: "snag-04",
    title: "Arcade run with the crew",
    game: "Street Fighter 6",
    category: "Clips",
    creator: "vexx",
    postedAt: "1h",
    image: "/snags/arcade-run.jpg",
    aspect: "1 / 1",
    duration: "1:12",
  },
  {
    id: "snag-05",
    title: "Empty road, 300 clicks to go #dayz #screenshot",
    game: "DayZ",
    category: "Screenshots",
    creator: "Drew",
    postedAt: "2h",
    image: "/snags/desert-road.jpg",
    aspect: "3 / 4.5",
  },
  {
    id: "snag-06",
    title: "Late queue, lights off",
    game: "Apex Legends",
    category: "Squad Galleries",
    creator: "Nyx",
    postedAt: "3h",
    image: "/snags/late-queue.jpg",
    aspect: "4 / 3.2",
    squadId: "night-shift",
  },
  {
    id: "snag-07",
    title: "Fog sitting on the lake",
    game: "DayZ",
    category: "Screenshots",
    creator: "Aster",
    postedAt: "4h",
    image: "/snags/lake-fog.jpg",
    aspect: "4 / 3.5",
  },
  {
    id: "snag-08",
    title: "Castle in the fog",
    game: "Elden Ring",
    category: "Screenshots",
    creator: "Mira",
    postedAt: "5h",
    image: "/snags/castle-fog.jpg",
    aspect: "3 / 4.6",
  },
  {
    id: "snag-09",
    title: "Coastline from 400m",
    game: "Battlefield",
    category: "Clips",
    creator: "Rook",
    postedAt: "6h",
    image: "/snags/coastline.jpg",
    aspect: "3 / 4.2",
    duration: "0:38",
  },
  {
    id: "snag-10",
    title: "Controller still warm",
    game: "Call of Duty",
    category: "Loadouts",
    creator: "PadTek",
    postedAt: "8h",
    image: "/snags/controller.jpg",
    aspect: "4 / 3.2",
    sponsoredBy: "PadTek Gaming",
  },
  {
    id: "snag-11",
    title: "Keybinds I actually use",
    game: "Rust",
    category: "Loadouts",
    creator: "noxx",
    postedAt: "9h",
    image: "/snags/keyboard.jpg",
    aspect: "4 / 3",
    squadId: "rust-rats",
  },
  {
    id: "snag-12",
    title: "Couch co-op at 2am #squad @otis",
    game: "Rocket League",
    category: "Squad Galleries",
    creator: "Otis",
    postedAt: "11h",
    image: "/snags/couch-coop.jpg",
    aspect: "4 / 3.2",
    squadId: "night-shift",
  },
  {
    id: "snag-13",
    title: "Rig check: twin 4080s #rust #loadout",
    game: "Rust",
    category: "Loadouts",
    creator: "NorthLoop",
    postedAt: "1d",
    image: "/snags/rig.jpg",
    aspect: "1 / 1",
    sponsoredBy: "NorthLoop PC",
  },
  {
    id: "snag-14",
    title: "No HUD, just stars",
    game: "DayZ",
    category: "Screenshots",
    creator: "Wren",
    postedAt: "1d",
    image: "/snags/stars.jpg",
    aspect: "4 / 3.4",
  },
  {
    id: "snag-15",
    title: "Summit at first light",
    game: "Skyrim",
    category: "Screenshots",
    creator: "Kit",
    postedAt: "2d",
    image: "/snags/summit.jpg",
    aspect: "1 / 1",
    squadId: "drift-crew",
  },
  {
    id: "snag-skin-01",
    title: "Frostbite wrap on the AK #skin #rust",
    game: "Rust",
    category: "Skins",
    creator: "Sable",
    postedAt: "5h",
    image: "/snags/keyboard.jpg",
    aspect: "4 / 3",
  },
  {
    id: "snag-skin-02",
    title: "Wraith skin, purple hour #skin #cod",
    game: "Call of Duty",
    category: "Skins",
    creator: "Nyx",
    creatorId: "nyx",
    postedAt: "7h",
    image: "/snags/controller.jpg",
    aspect: "4 / 3.2",
  },
  {
    id: "snag-skin-03",
    title: "Ghillie set after the wipe #skin #dayz",
    game: "DayZ",
    category: "Skins",
    creator: "Wren",
    postedAt: "10h",
    image: "/snags/castle-fog.jpg",
    aspect: "3 / 4.6",
  },
  {
    id: "snag-skin-04",
    title: "Frost dragon mount at dusk #skin",
    game: "Palworld",
    category: "Skins",
    creator: "Mira",
    postedAt: "1d",
    image: "/snags/summit.jpg",
    aspect: "1 / 1",
  },
  {
    id: "snag-skin-05",
    title: "Neon chassis, fully kitted #skin #loadout",
    game: "Cyberpunk 2077",
    category: "Skins",
    creator: "MasonR",
    postedAt: "2d",
    image: "/snags/rig.jpg",
    aspect: "1 / 1",
    sponsoredBy: "NorthLoop PC",
  },
];

