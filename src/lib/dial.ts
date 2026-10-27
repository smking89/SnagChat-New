import type { Snag } from "../data/snags";

/**
 * The radial dial: the short list of squads and players a snag gets flicked to
 * when a feed card is held down. The player picks up to four people by hand in
 * Settings, and while smart fill is on the engine tops up whatever is left with
 * the contacts their recent activity points at.
 */

export const DIAL_SLOTS = 4;

export type DialTargetKind = "squad" | "player";

export type DialTarget = {
  /** "squad:night-shift" — what a slot stores. */
  key: string;
  kind: DialTargetKind;
  refId: string;
  name: string;
  handle?: string;
  avatar?: string;
  verified?: boolean;
  /** Squad size, shown on the roster row and the picker. */
  members?: number;
};

export type DialConfig = {
  /** One entry per slot; "" is an open slot. */
  slots: string[];
  /** Let the engine fill the open slots from live activity. */
  smart: boolean;
  /** Keys the player pinned themselves, which smart fill never replaces. */
  locked: string[];
};

export const DIAL_DEFAULTS: DialConfig = {
  slots: Array.from({ length: DIAL_SLOTS }, () => ""),
  smart: true,
  locked: [],
};

export function dialKey(kind: DialTargetKind, refId: string): string {
  return `${kind}:${refId}`;
}

export function parseDialKey(key: string): { kind: DialTargetKind; refId: string } | null {
  const at = key.indexOf(":");
  if (at < 0) return null;
  const kind = key.slice(0, at);
  const refId = key.slice(at + 1);
  if ((kind !== "squad" && kind !== "player") || !refId) return null;
  return { kind, refId };
}

/** Repairs anything a stored config is missing, so an old save still loads. */
export function normalizeDialConfig(value: unknown): DialConfig {
  const source = (value ?? {}) as Partial<DialConfig>;
  const slots = Array.from({ length: DIAL_SLOTS }, (_, index) => {
    const entry = Array.isArray(source.slots) ? source.slots[index] : undefined;
    return typeof entry === "string" ? entry : "";
  });

  return {
    slots,
    smart: source.smart !== false,
    locked: Array.isArray(source.locked) ? source.locked.filter((key) => typeof key === "string") : [],
  };
}

/** What the engine knows about how the player has been playing tonight. */
export type DialFacts = {
  /** Player id → timestamp of their last message, so recency can rank them. */
  lastSeen: Record<string, number>;
  /** Player id → unread messages. */
  unread: Record<string, number>;
  /** Squad id → posts you have put in that gallery. */
  squadPosts: Record<string, number>;
  /** Squad id → members. */
  squadMembers: Record<string, number>;
};

export type DialSuggestion = { key: string; reason: string };

function minutesSince(at: number, now: number): string {
  const minutes = Math.max(1, Math.round((now - at) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Ranks the roster the way the activity points: a squad you post in and a
 * player you messaged minutes ago outrank a quiet one, and every suggestion
 * carries the reason it was chosen so the list is never a mystery.
 */
export function rankSuggestions(
  targets: DialTarget[],
  facts: DialFacts,
  now = Date.now(),
): DialSuggestion[] {
  return targets
    .map((target) => {
      if (target.kind === "player") {
        const last = facts.lastSeen[target.refId];
        const unread = facts.unread[target.refId] ?? 0;
        if (last && now - last < 6 * 60 * 60 * 1000) {
          return {
            key: target.key,
            score: 100 - (now - last) / 60000,
            reason: `Sent a message ${minutesSince(last, now)} ago`,
          };
        }
        if (unread > 0) {
          return { key: target.key, score: 60 + unread, reason: `${unread} unread in your chat` };
        }
        return { key: target.key, score: 10, reason: "In your recent chats" };
      }

      const posts = facts.squadPosts[target.refId] ?? 0;
      const members = facts.squadMembers[target.refId] ?? target.members ?? 0;
      const fromMe = facts.lastSeen[target.refId];
      if (fromMe && now - fromMe < 6 * 60 * 60 * 1000) {
        return {
          key: target.key,
          score: 95 - (now - fromMe) / 60000,
          reason: `High activity in ${target.name} ${minutesSince(fromMe, now)} ago`,
        };
      }
      if (posts > 0) {
        return { key: target.key, score: 70 + posts, reason: `${posts} of your snags in this gallery` };
      }
      return { key: target.key, score: 20 + members, reason: `${members} members active` };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ key, reason }) => ({ key, reason }));
}

export type DialPlan = {
  /** The slots in order, with the target that lands in each, if any. */
  slots: (DialTarget | null)[];
  /** Keys the engine filled rather than the player. */
  auto: string[];
  /** Ranked suggestions that are not in the dial yet. */
  suggestions: DialSuggestion[];
};

/**
 * Resolves the dial the player will actually see: their pinned slots first, in
 * their own order, then engine picks for whatever is left when smart fill is on.
 */
export function planDial(
  config: DialConfig,
  targets: DialTarget[],
  facts: DialFacts,
  now = Date.now(),
): DialPlan {
  const byKey = new Map(targets.map((target) => [target.key, target]));
  const pinned = config.slots.map((key) => byKey.get(key) ?? null);
  const used = new Set(config.slots.filter(Boolean));
  const ranked = rankSuggestions(targets, facts, now);
  const auto: string[] = [];
  const slots = pinned.map((target) => target);

  if (config.smart) {
    for (let index = 0; index < slots.length; index += 1) {
      if (slots[index]) continue;
      const pick = ranked.find((entry) => !used.has(entry.key));
      if (!pick) break;
      used.add(pick.key);
      auto.push(pick.key);
      slots[index] = byKey.get(pick.key) ?? null;
    }
  }

  return {
    slots,
    auto,
    suggestions: ranked.filter((entry) => !used.has(entry.key)),
  };
}

export type DialSlotPlacement = {
  /** Centre of the slot, in viewport coordinates. */
  x: number;
  y: number;
  /** Distance from the press. */
  radius: number;
  angle: number;
  /** The diameter to draw this slot at, so its neighbours never collide. */
  size: number;
};

/** The diameter a slot is drawn at whenever the screen has room for it. */
export const DIAL_SLOT = 82;
/** Legibility floor and comfort ceiling for a slot. */
const SLOT_MIN = 56;
const SLOT_MAX = 92;
/** The floor a slot drops to only when a crowded dial would otherwise collide. */
const CROWDED_FLOOR = 44;
/** Clear air kept between neighbouring slots. */
const SLOT_GAP = 12;
/**
 * Nothing is ever placed inside this radius of the press. A thumb is wide
 * enough to cover a slot, and a slot the player cannot see is a slot they
 * cannot aim at.
 */
const FINGER_CLEAR = 104;
/** The dial stops growing here, however much room a large screen offers. */
const MAX_RADIUS = 226;
/**
 * How wide a halo opens. It is always a half circle at most, so the dial fans
 * away from the finger and no slot is ever level with, or behind, the thumb.
 */
const MIN_SPAN = (Math.PI * 3) / 5;
const MAX_SPAN = Math.PI;
/** Air kept between the ring and the edge of the screen. */
const SCREEN_MARGIN = 10;
/** A full ring needs this much room on every side before it is worth drawing. */
const RING_ROOM = FINGER_CLEAR + SLOT_MIN / 2 + SCREEN_MARGIN;

type DialLayoutOptions = { slot?: number };

type DialRooms = { left: number; right: number; up: number; down: number };

/** How far a ray from the press travels before it reaches an edge of the screen. */
function ray(room: DialRooms, angle: number): number {
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const across = Math.abs(x) < 1e-4 ? Infinity : (x > 0 ? room.right : room.left) / Math.abs(x);
  const down = Math.abs(y) < 1e-4 ? Infinity : (y > 0 ? room.down : room.up) / Math.abs(y);
  return Math.min(across, down);
}

/**
 * Places the slots around the thumb. The dial is drawn on the widest ring the
 * screen allows, so every slot is as large as it can be, and nothing ever lands
 * under the finger: a press with room all round gets a full ring, while a press
 * near an edge blooms a halo that opens along its roomiest direction — never
 * inside the thumb, and never with a slot stacked inside another ring. Slots are
 * spaced by their own size, so neighbours never collide.
 */
export function dialLayout(
  count: number,
  origin: { x: number; y: number },
  viewport: { width: number; height: number },
  options: DialLayoutOptions = {},
): DialSlotPlacement[] {
  if (count <= 0) return [];

  const nominal = Math.min(SLOT_MAX, Math.max(SLOT_MIN, options.slot ?? DIAL_SLOT));
  const room: DialRooms = {
    left: origin.x,
    right: viewport.width - origin.x,
    up: origin.y,
    down: viewport.height - origin.y,
  };
  const roomSide = Math.min(room.left, room.right);

  // A ring needs a clear circle around the thumb; otherwise the dial fans out
  // along whichever direction has the room, so the hand never covers a slot.
  const fullRing = count > 2 && Math.min(roomSide, room.up, room.down) >= RING_ROOM;
  const base = Math.atan2(room.down - room.up, room.right - room.left);

  const edge = nominal / 2 + SCREEN_MARGIN;
  /** How far a slot centre may sit along a direction and still stay on screen. */
  const reach = (angle: number) => Math.max(SLOT_MIN, ray(room, angle) - edge);
  /** The width a halo opens to keep its neighbours apart at this radius. */
  const spanFor = (ringRadius: number) => {
    const apart = 2 * Math.asin(Math.min(1, (nominal + SLOT_GAP) / (2 * ringRadius)));
    return Math.min(MAX_SPAN, Math.max(MIN_SPAN, apart * Math.max(0, count - 1)));
  };

  let radius: number;
  let span = 0;
  if (fullRing) {
    // A ring reaches equally in every direction, so the tightest side decides.
    radius = Math.max(SLOT_MIN, Math.min(MAX_RADIUS, Math.min(roomSide, room.up, room.down) - edge));
    span = Math.PI * 2;
  } else {
    // The halo is measured twice: once from the press, then again from where its
    // own outer slots would land, so nothing ends up hanging off the screen.
    radius = Math.min(MAX_RADIUS, reach(base));
    if (count > 1) {
      span = spanFor(radius);
      radius = Math.min(radius, reach(base - span / 2), reach(base + span / 2));
      span = spanFor(radius);
    }
  }

  const step = count > 1 ? (fullRing ? (Math.PI * 2) / count : span / (count - 1)) : 0;
  const start = fullRing ? -Math.PI / 2 : base - span / 2;

  // A slot is drawn as large as its neighbours allow, dropping to the emergency
  // floor only when a crowded dial would otherwise make the slots collide.
  const spaced = count > 1 ? 2 * Math.sin(Math.min(step, Math.PI) / 2) * radius - SLOT_GAP : nominal;
  const size = Math.max(spaced >= SLOT_MIN ? SLOT_MIN : CROWDED_FLOOR, Math.min(nominal, spaced));

  return Array.from({ length: count }, (_, index) => {
    const angle = count > 1 ? start + index * step : base;
    return {
      x: origin.x + Math.cos(angle) * radius,
      y: origin.y + Math.sin(angle) * radius,
      radius,
      angle,
      size,
    };
  });
}

/** Short line under the toast, naming where a snag landed. */
export function deliveryLine(targets: DialTarget[]): string {
  const squads = targets.filter((target) => target.kind === "squad");
  const players = targets.filter((target) => target.kind === "player");

  if (targets.length > 1 && squads.length === targets.length) {
    return `Sent to ${squads[0].name} and ${squads.length - 1} other ${squads.length - 1 === 1 ? "squad" : "squads"}`;
  }
  if (targets.length > 1) return `Sent to ${targets.length} chats`;
  if (squads.length === 1) return `Sent straight to ${squads[0].name}`;
  return `Sent to @${players[0]?.handle ?? "player"}`;
}

/** One-line summary for a snag being flicked, used in the dial header. */
export function dialHeadline(snag: Snag): string {
  return snag.title.length > 44 ? `${snag.title.slice(0, 43).trimEnd()}…` : snag.title;
}
