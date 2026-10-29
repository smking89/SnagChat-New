import { findPlayer } from "../data/players";
import { isSquadMember, roleInSquad, type Squad, type SquadInvite } from "../data/squads";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";

type SquadsScreenProps = {
  squads: Squad[];
  invites: SquadInvite[];
  currentUserId: string;
  postCounts: Record<string, number>;
  onClose: () => void;
  onCreateSquad: () => void;
  onOpenSquad: (squadId: string) => void;
  onAcceptInvite: (inviteId: string) => void;
  onDeclineInvite: (inviteId: string) => void;
};

export function SquadsScreen({
  squads,
  invites,
  currentUserId,
  postCounts,
  onClose,
  onCreateSquad,
  onOpenSquad,
  onAcceptInvite,
  onDeclineInvite,
}: SquadsScreenProps) {
  const myInvites = invites
    .filter((invite) => invite.playerId === currentUserId)
    .map((invite) => ({ invite, squad: squads.find((item) => item.id === invite.squadId) }))
    .filter(
      (entry): entry is { invite: SquadInvite; squad: Squad } =>
        Boolean(entry.squad) && !isSquadMember(entry.squad as Squad, currentUserId),
    );

  return (
    <Screen labelledBy="squads-title" onClose={onClose}>
      <ScreenHeader
        title="Squads"
        titleId="squads-title"
        onBack={onClose}
        action={
          <button
            type="button"
            onClick={onCreateSquad}
            aria-label="Create squad"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
          >
            <Icon name="plus" size={19} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-4 py-4">
          <p className="max-w-[46ch] text-[11.5px] leading-relaxed text-muted">
            Owners transfer the squad, manage members and delete it. Members post to the gallery, invite players
            and manage their own posts. Invites stay pending until the player accepts.
          </p>

          {myInvites.length > 0 ? (
            <section className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                  Invites for you
                </h2>
                <span className="text-[10px] font-medium text-faint">
                  {myInvites.length} pending
                </span>
              </div>

              <ul className="mt-2 space-y-2">
                {myInvites.map(({ invite, squad }) => {
                  const inviter = findPlayer(invite.invitedBy);

                  return (
                    <li key={invite.id} className="rounded-2xl border border-line p-3">
                      <div className="flex items-center gap-3">
                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface">
                          {squad.banner ? (
                            <img
                              src={squad.banner}
                              alt=""
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold leading-tight">
                            {inviter ? `${inviter.name} invited you` : "You have an invite"}
                          </p>
                          <p className="truncate text-[10.5px] text-muted">
                            {squad.name} · {squad.members.length}{" "}
                            {squad.members.length === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onAcceptInvite(invite.id)}
                          className="h-9 flex-1 rounded-full bg-brand text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineInvite(invite.id)}
                          className="h-9 rounded-full border border-line px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {squads.length > 0 ? (
            <>
              {myInvites.length > 0 ? (
                <h2 className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                  Your squads
                </h2>
              ) : null}

              <ul className={`space-y-2 ${myInvites.length > 0 ? "mt-2" : "mt-4"}`}>
                {squads.map((squad) => {
                  const role = roleInSquad(squad, currentUserId);
                  const ownerId = squad.members.find((member) => member.role === "owner")?.playerId;
                  const owner = ownerId ? findPlayer(ownerId) : undefined;
                  const posts = postCounts[squad.id] ?? 0;
                  const pending = invites.filter(
                    (invite) => invite.squadId === squad.id && invite.playerId === currentUserId,
                  ).length;

                  return (
                    <li key={squad.id}>
                      <button
                        type="button"
                        onClick={() => onOpenSquad(squad.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line p-2.5 text-left transition-colors hover:border-[#d8dce1]"
                      >
                        <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                          {squad.banner ? (
                            <img
                              src={squad.banner}
                              alt=""
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : null}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[14px] font-bold tracking-[-0.01em]">
                              {squad.name}
                            </span>
                            {role ? (
                              <span className="rounded-full bg-ink px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-white">
                                {role}
                              </span>
                            ) : pending > 0 ? (
                              <span className="rounded-full border border-line px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#4d535c]">
                                invited
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted">
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em] ${
                                squad.visibility === "public"
                                  ? "bg-surface text-[#4d535c]"
                                  : "bg-ink text-white"
                              }`}
                            >
                              {squad.visibility === "private" ? (
                                <Icon name="lock" size={9} strokeWidth={2.2} />
                              ) : null}
                              {squad.visibility}
                            </span>
                            <span className="truncate">
                            {squad.members.length} {squad.members.length === 1 ? "member" : "members"}
                            {owner ? ` · @${owner.handle}` : ""} · {posts} {posts === 1 ? "post" : "posts"}
                            </span>
                          </span>
                        </span>

                        <span className="rotate-180 text-faint">
                          <Icon name="back" size={18} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-10 text-center">
              <p className="text-[12.5px] font-semibold">No squads yet</p>
              <p className="mx-auto mt-1 max-w-[32ch] text-[11.5px] leading-relaxed text-muted">
                Start one for the people you queue with, then invite them from the squad screen.
              </p>
              <button
                type="button"
                onClick={onCreateSquad}
                className="mt-4 h-10 rounded-full bg-ink px-5 text-[12px] font-semibold text-white transition-colors hover:bg-[#22252a]"
              >
                Create squad
              </button>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
