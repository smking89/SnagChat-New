/**
 * The SnagChat Shop catalogue: static frame artwork, the effects a player can
 * pair with a frame, and the marketplace maths (SnagChat takes 2.5%, paid by
 * the seller).
 */

export type FrameTarget = "avatar" | "banner" | "nameplate" | "snag";

export type FrameEffectId =
  | "none"
  | "rubberband"
  | "bounce"
  | "wiggle"
  | "pulse"
  | "shake"
  | "flash"
  | "swing"
  | "jello"
  | "parallax"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "fade-in"
  | "fade-out"
  | "zoom-in"
  | "zoom-out"
  | "flip"
  | "roll-in"
  | "roll-out"
  | "tada"
  | "pop"
  | "stagger";

export type FrameEffect = {
  id: FrameEffectId;
  label: string;
  group: "Still" | "Motion" | "Attention" | "Entrance" | "Exit" | "Advanced";
  /** Loops run forever; once effects play on hover and can be replayed. */
  mode: "loop" | "once";
  hint: string;
};

export const FRAME_EFFECTS: FrameEffect[] = [
  { id: "none", label: "Still", group: "Still", mode: "loop", hint: "The frame stays put." },
  { id: "pulse", label: "Pulse", group: "Motion", mode: "loop", hint: "A slow breath in and out." },
  { id: "bounce", label: "Bounce", group: "Motion", mode: "loop", hint: "A light vertical hop." },
  { id: "rubberband", label: "Rubberband", group: "Motion", mode: "loop", hint: "Stretches wide, snaps tall." },
  { id: "wiggle", label: "Wiggle", group: "Attention", mode: "loop", hint: "A small side-to-side rock." },
  { id: "shake", label: "Shake", group: "Attention", mode: "loop", hint: "Quick horizontal ticks." },
  { id: "flash", label: "Flash", group: "Attention", mode: "loop", hint: "Blinks for attention." },
  { id: "swing", label: "Swing", group: "Attention", mode: "loop", hint: "Tilts from the top edge." },
  { id: "jello", label: "Jello", group: "Attention", mode: "loop", hint: "A gelatin wobble." },
  { id: "parallax", label: "Parallax drift", group: "Advanced", mode: "loop", hint: "Drifts against the image beneath." },
  { id: "stagger", label: "Stagger", group: "Advanced", mode: "loop", hint: "Steps around the edge in beats." },
  { id: "slide-left", label: "Slide left", group: "Entrance", mode: "once", hint: "Slides in from the right." },
  { id: "slide-right", label: "Slide right", group: "Entrance", mode: "once", hint: "Slides in from the left." },
  { id: "slide-up", label: "Slide up", group: "Entrance", mode: "once", hint: "Rises into place from below." },
  { id: "slide-down", label: "Slide down", group: "Entrance", mode: "once", hint: "Drops into place from above." },
  { id: "fade-in", label: "Fade in", group: "Entrance", mode: "once", hint: "Fades up from transparent." },
  { id: "zoom-in", label: "Zoom in", group: "Entrance", mode: "once", hint: "Scales up from nothing." },
  { id: "flip", label: "Flip", group: "Entrance", mode: "once", hint: "Rotates in on the X axis." },
  { id: "roll-in", label: "Roll in", group: "Entrance", mode: "once", hint: "Spins in while sliding." },
  { id: "pop", label: "Pop", group: "Entrance", mode: "once", hint: "A sharp scale-up and snap back." },
  { id: "tada", label: "Tada", group: "Attention", mode: "once", hint: "A celebratory growth and shake." },
  { id: "fade-out", label: "Fade out", group: "Exit", mode: "once", hint: "Fades away on hover." },
  { id: "zoom-out", label: "Zoom out", group: "Exit", mode: "once", hint: "Shrinks away on hover." },
  { id: "roll-out", label: "Roll out", group: "Exit", mode: "once", hint: "Spins out while sliding." },
];

export type Frame = {
  id: string;
  name: string;
  art: string;
  target: FrameTarget;
  priceCents: number;
  /** Display name of the seller. SnagChat itself sells the official line. */
  creator: string;
  creatorId?: string;
  tagline: string;
  /** Swatch used by chips and chips only; the art itself is the SVG. */
  swatch: string;
  official?: boolean;
  /** Included with every account, so nobody starts with an empty studio. */
  included?: boolean;
};

export type FrameUse = { frameId: string; effect: FrameEffectId };
export type FrameLoadout = Partial<Record<FrameTarget, FrameUse>>;

export type CreatorApplication = {
  status: "none" | "pending" | "approved";
  storeName?: string;
  target?: FrameTarget;
  portfolio?: string;
  country?: string;
  submittedAt?: number;
};

export type StripeAccount = {
  id: string;
  country: string;
  businessType: "individual" | "company";
  bankLast4: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  connectedAt: number;
};

export type FrameOrder = {
  id: string;
  frameId: string;
  priceCents: number;
  feeCents: number;
  sellerNetCents: number;
  seller: string;
  at: number;
};

/** SnagChat's marketplace fee. The seller pays it; buyers pay the list price. */
export const PLATFORM_FEE_RATE = 0.025;

export function feeFor(priceCents: number): number {
  return Math.round(priceCents * PLATFORM_FEE_RATE);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Included";
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

export function formatMoney(cents: number): string {
  return `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export const FRAMES: Frame[] = [
  // Avatars
  {
    id: "halo-violet",
    name: "Violet Halo",
    art: "/frames/avatar-halo-violet.svg",
    target: "avatar",
    priceCents: 0,
    creator: "SnagChat",
    tagline: "The starter halo. Soft light, bright core.",
    swatch: "#a855f7",
    official: true,
    included: true,
  },
  {
    id: "circuit-cyan",
    name: "Circuit Trace",
    art: "/frames/avatar-circuit-cyan.svg",
    target: "avatar",
    priceCents: 499,
    creator: "SnagChat",
    tagline: "Eight contact pins and a live cyan trace.",
    swatch: "#22d3ee",
    official: true,
  },
  {
    id: "ember-ring",
    name: "Ember Ring",
    art: "/frames/avatar-ember-ring.svg",
    target: "avatar",
    priceCents: 599,
    creator: "Nyx",
    creatorId: "nyx",
    tagline: "Late-queue heat for the night shift.",
    swatch: "#f97316",
  },
  {
    id: "frost-crown",
    name: "Frost Crown",
    art: "/frames/avatar-frost-crown.svg",
    target: "avatar",
    priceCents: 699,
    creator: "SnagChat",
    tagline: "Crystal points and a cold inner ring.",
    swatch: "#7dd3fc",
    official: true,
  },
  {
    id: "gold-laurel",
    name: "Gold Laurel",
    art: "/frames/avatar-gold-laurel.svg",
    target: "avatar",
    priceCents: 999,
    creator: "Luma",
    creatorId: "luma",
    tagline: "A victor's wreath, drawn in one line.",
    swatch: "#fbbf24",
  },
  {
    id: "glitch-shift",
    name: "Glitch Shift",
    art: "/frames/avatar-glitch-shift.svg",
    target: "avatar",
    priceCents: 449,
    creator: "SnagChat",
    tagline: "Two offset rings that never quite agree.",
    swatch: "#f0abfc",
    official: true,
  },

  // Banners
  {
    id: "banner-scanlines",
    name: "Scanline Border",
    art: "/frames/banner-scanlines.svg",
    target: "banner",
    priceCents: 499,
    creator: "SnagChat",
    tagline: "A CRT edge for a profile built in the dark.",
    swatch: "#0891b2",
    official: true,
  },
  {
    id: "banner-neon-grid",
    name: "Neon Grid",
    art: "/frames/banner-neon-grid.svg",
    target: "banner",
    priceCents: 599,
    creator: "SnagChat",
    tagline: "Night-city rails and one violet moon.",
    swatch: "#c084fc",
    official: true,
  },
  {
    id: "banner-ember-drift",
    name: "Ember Drift",
    art: "/frames/banner-ember-drift.svg",
    target: "banner",
    priceCents: 649,
    creator: "Nyx",
    creatorId: "nyx",
    tagline: "Sparks along the bottom, heat at the corners.",
    swatch: "#f97316",
  },
  {
    id: "banner-galaxy",
    name: "Galaxy Field",
    art: "/frames/banner-galaxy.svg",
    target: "banner",
    priceCents: 799,
    creator: "SnagChat",
    tagline: "Two nebulae, a constellation and a lot of stars.",
    swatch: "#818cf8",
    official: true,
  },

  // Nameplates
  {
    id: "plate-violet",
    name: "Violet Plate",
    art: "/frames/plate-violet.svg",
    target: "nameplate",
    priceCents: 0,
    creator: "SnagChat",
    tagline: "A clean halo for your name in chats.",
    swatch: "#a855f7",
    official: true,
    included: true,
  },
  {
    id: "plate-gold",
    name: "Gold Trim",
    art: "/frames/plate-gold.svg",
    target: "nameplate",
    priceCents: 299,
    creator: "SnagChat",
    tagline: "Double gold rule with a crown notch.",
    swatch: "#fbbf24",
    official: true,
  },
  {
    id: "plate-holo",
    name: "Holo Tag",
    art: "/frames/plate-holo.svg",
    target: "nameplate",
    priceCents: 349,
    creator: "MasonR",
    creatorId: "masonr",
    tagline: "Dashed spectrum edge, terminal green dots.",
    swatch: "#22d3ee",
  },

  // Snag frames
  {
    id: "snag-tape",
    name: "Taped Print",
    art: "/frames/snag-tape.svg",
    target: "snag",
    priceCents: 399,
    creator: "SnagChat",
    tagline: "Two strips of tape and a graphite label.",
    swatch: "#f59e0b",
    official: true,
  },
  {
    id: "snag-neon-edge",
    name: "Neon Edge",
    art: "/frames/snag-neon-edge.svg",
    target: "snag",
    priceCents: 549,
    creator: "SnagChat",
    tagline: "A violet-to-cyan glow that hugs the artwork.",
    swatch: "#c084fc",
    official: true,
  },
  {
    id: "snag-corner-brackets",
    name: "Corner Brackets",
    art: "/frames/snag-corner-brackets.svg",
    target: "snag",
    priceCents: 499,
    creator: "MasonR",
    creatorId: "masonr",
    tagline: "Four white brackets, nothing in the middle.",
    swatch: "#e9d5ff",
  },
  {
    id: "snag-arcade",
    name: "Arcade Cab",
    art: "/frames/snag-arcade.svg",
    target: "snag",
    priceCents: 599,
    creator: "vexx",
    creatorId: "vexx",
    tagline: "Pixel corners and an inner credit line.",
    swatch: "#7c3aed",
  },
  {
    id: "snag-gold-gallery",
    name: "Gold Gallery",
    art: "/frames/snag-gold-gallery.svg",
    target: "snag",
    priceCents: 749,
    creator: "Luma",
    creatorId: "luma",
    tagline: "Museum treatment for a clean base build.",
    swatch: "#fcd34d",
  },
];

export const FRAME_MAP: Record<string, Frame> = Object.fromEntries(
  FRAMES.map((frame) => [frame.id, frame]),
);

export const TARGETS: { id: FrameTarget; label: string; plural: string; sample: string }[] = [
  { id: "avatar", label: "Avatar", plural: "Avatar frames", sample: "/snags/squad-room.jpg" },
  { id: "banner", label: "Banner", plural: "Banner frames", sample: "/snags/ridge-light.jpg" },
  { id: "nameplate", label: "Nameplate", plural: "Message nameplates", sample: "/snags/controller.jpg" },
  { id: "snag", label: "Card", plural: "Card frames", sample: "/snags/summit.jpg" },
];

/**
 * Creator products published in this session. The shop registers them here so
 * every renderer (avatars, feed cards, nameplates) resolves the same artwork
 * without threading the product list through each component.
 */
let customFrames: Frame[] = [];

export function registerCustomFrames(frames: Frame[]): void {
  customFrames = frames;
}

export function allFrames(): Frame[] {
  return [...FRAMES, ...customFrames];
}

export function findFrame(id: string | undefined): Frame | undefined {
  if (!id) return undefined;
  return FRAME_MAP[id] ?? customFrames.find((frame) => frame.id === id);
}

export function framesForTarget(target: FrameTarget, extra: Frame[] = []): Frame[] {
  return [...FRAMES, ...extra].filter((frame) => frame.target === target);
}

export function findEffect(id: FrameEffectId | undefined): FrameEffect {
  return FRAME_EFFECTS.find((effect) => effect.id === id) ?? FRAME_EFFECTS[0]!;
}

/** What the shop applies when a player picks a frame without choosing an effect. */
export const DEFAULT_EFFECT: Record<FrameTarget, FrameEffectId> = {
  avatar: "pulse",
  banner: "fade-in",
  nameplate: "pulse",
  snag: "fade-in",
};

export const INCLUDED_FRAMES = FRAMES.filter((frame) => frame.included).map((frame) => frame.id);

/**
 * Frames other players already wear. It keeps the feed and inbox from looking
 * like the shop only exists for you.
 */
export const SEED_LOADOUTS: Record<string, FrameLoadout> = {
  nyx: {
    avatar: { frameId: "ember-ring", effect: "pulse" },
    banner: { frameId: "banner-ember-drift", effect: "fade-in" },
    nameplate: { frameId: "plate-gold", effect: "wiggle" },
  },
  luma: {
    avatar: { frameId: "gold-laurel", effect: "swing" },
    nameplate: { frameId: "plate-gold", effect: "pulse" },
  },
  masonr: {
    avatar: { frameId: "circuit-cyan", effect: "pulse" },
    banner: { frameId: "banner-neon-grid", effect: "parallax" },
    nameplate: { frameId: "plate-holo", effect: "wiggle" },
    snag: { frameId: "snag-corner-brackets", effect: "fade-in" },
  },
  vexx: {
    snag: { frameId: "snag-arcade", effect: "pop" },
  },
};

export function loadoutFor(playerId: string, mine: FrameLoadout): FrameLoadout {
  if (playerId === "you") return mine;
  return SEED_LOADOUTS[playerId] ?? {};
}
