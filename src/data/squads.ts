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

export const SEED_SQUADS: Squad[] = [];

export const SEED_INVITES: SquadInvite[] = [];
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
