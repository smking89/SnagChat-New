export type SquadRole = "owner" | "member";

export type SquadMember = {
  playerId: string;
  role: SquadRole;
};

export type SquadVisibility = "public" | "private";

export type Squad = {
  id: string;
  name: string;
  banner?: string;
  /** Public galleries show their posts in the feed; private ones only to members. */
  visibility: SquadVisibility;
  members: SquadMember[];
};

/** An invite stays pending until the invited player accepts or declines it. */
export type SquadInvite = {
  id: string;
  squadId: string;
  playerId: string;
  invitedBy: string;
  at: number;
};

const BASE_SQUADS: Squad[] = [
  {
    id: "night-shift",
    name: "Night Shift",
    banner: "/snags/squad-room.jpg",
    visibility: "private",
    members: [
      { playerId: "you", role: "owner" },
      { playerId: "luma", role: "member" },
      { playerId: "jax", role: "member" },
      { playerId: "mira", role: "member" },
      { playerId: "nyx", role: "member" },
      { playerId: "otis", role: "member" },
    ],
  },
  {
    id: "rust-rats",
    name: "Rust Rats",
    banner: "/snags/rig.jpg",
    visibility: "public",
    members: [
      { playerId: "noxx", role: "owner" },
      { playerId: "you", role: "member" },
      { playerId: "sable", role: "member" },
      { playerId: "vexx", role: "member" },
    ],
  },
  {
    id: "drift-crew",
    name: "Drift Crew",
    banner: "/snags/arcade-run.jpg",
    visibility: "public",
    members: [
      { playerId: "rook", role: "owner" },
      { playerId: "drew", role: "member" },
      { playerId: "aster", role: "member" },
      { playerId: "kit", role: "member" },
      { playerId: "wren", role: "member" },
      { playerId: "kirav", role: "member" },
      { playerId: "masonr", role: "member" },
      { playerId: "luma", role: "member" },
    ],
  },
];

export const SEED_SQUADS: Squad[] = [
  ...BASE_SQUADS,
  {
    id: "static-kings",
    name: "Static Kings",
    banner: "/snags/ridge-light.jpg",
    visibility: "private",
    members: [
      { playerId: "nyx", role: "owner" },
      { playerId: "sable", role: "member" },
      { playerId: "wren", role: "member" },
    ],
  },
];

export const SEED_INVITES: SquadInvite[] = [
  {
    id: "invite-drift-you",
    squadId: "drift-crew",
    playerId: "you",
    invitedBy: "rook",
    at: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: "invite-night-kit",
    squadId: "night-shift",
    playerId: "kit",
    invitedBy: "you",
    at: Date.now() - 1000 * 60 * 60 * 5,
  },
];

export function invitesForSquad(invites: SquadInvite[], squadId: string): SquadInvite[] {
  return invites.filter((invite) => invite.squadId === squadId);
}

export function invitesForPlayer(invites: SquadInvite[], playerId: string): SquadInvite[] {
  return invites.filter((invite) => invite.playerId === playerId);
}

export function roleInSquad(squad: Squad, playerId: string): SquadRole | null {
  return squad.members.find((member) => member.playerId === playerId)?.role ?? null;
}

export function ownerOfSquad(squad: Squad): string | undefined {
  return squad.members.find((member) => member.role === "owner")?.playerId;
}

export function isSquadMember(squad: Squad, playerId: string): boolean {
  return roleInSquad(squad, playerId) !== null;
}

/** Public galleries are visible to everyone; private ones only to members. */
export function canSeeGallery(squad: Squad, playerId: string): boolean {
  return squad.visibility === "public" || isSquadMember(squad, playerId);
}
