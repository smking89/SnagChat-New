import { useState } from "react";
import { findPlayer, findPlayerId, searchPlayers, type Player } from "../data/players";
import { invitesForSquad, roleInSquad, type Squad, type SquadInvite, type SquadVisibility } from "../data/squads";
import type { Snag } from "../data/snags";
import { Avatar } from "./Avatar";
import { ConfirmSheet } from "./ConfirmSheet";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";
import { Sheet } from "./Sheet";

type SquadScreenProps = {
  squad: Squad;
  currentUserId: string;
  posts: Snag[];
  candidates: Player[];
  invites: SquadInvite[];
  onClose: () => void;
  onPost: () => void;
  onInvite: (playerId: string) => void;
  onCancelInvite: (inviteId: string) => void;
  onRemoveMember: (playerId: string) => void;
  onTransferOwnership: (playerId: string) => void;
  onDeletePost: (snag: Snag) => void;
  onEditPost: (snag: Snag) => void;
  onOpenSnag: (snag: Snag) => void;
  onOpenPlayer: (playerId: string) => void;
  onDeleteSquad: () => void;
  onSetVisibility: (visibility: SquadVisibility) => void;
};

export function SquadScreen({
  squad,
  currentUserId,
  posts,
  candidates,
  invites,
  onClose,
  onPost,
  onInvite,
  onCancelInvite,
  onRemoveMember,
  onTransferOwnership,
  onDeletePost,
  onEditPost,
  onOpenSnag,
  onOpenPlayer,
  onDeleteSquad,
  onSetVisibility,
}: SquadScreenProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Player | null>(null);
  const [pendingPost, setPendingPost] = useState<Snag | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const role = roleInSquad(squad, currentUserId);
  const isOwner = role === "owner";
  const isMember = role !== null;

  const members = [...squad.members].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
  const ownerId = squad.members.find((member) => member.role === "owner")?.playerId;
  const owner = ownerId ? findPlayer(ownerId) : undefined;

  const squadInvites = invitesForSquad(invites, squad.id);
  const invitedIds = squadInvites.map((invite) => invite.playerId);
  const inviteCandidates = candidates.filter(
    (player) => player.id !== currentUserId && !invitedIds.includes(player.id),
  );

  const lookupResults = inviteQuery.trim() ? searchPlayers(inviteQuery) : inviteCandidates;
  const visibleResults = lookupResults.filter((player) => !invitedIds.includes(player.id));

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteQuery("");
  };

  return (
    <Screen labelledBy="squad-name" onClose={onClose}>
      <ScreenHeader
        title={squad.name}
        onBack={onClose}
        action={
          isMember ? (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="mr-1 flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
            >
              <Icon name="plus" size={14} strokeWidth={2.2} />
              Invite
            </button>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="relative h-32 overflow-hidden bg-brand-tint">
          {squad.banner ? (
            <img src={squad.banner} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <img
              src="/brand/snagchat-icon.png"
              alt=""
              className="absolute -right-3 -top-4 h-40 w-auto opacity-[0.07]"
            />
          )}
        </div>

        <div className="relative -mt-10 px-4 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-end justify-between gap-3">
              <Avatar
                name={squad.name}
                size={76}
                tone="soft"
                className="font-display ring-4 ring-white"
              />
              <div className="flex items-center gap-2 pb-1">
                {isMember ? (
                  <button
                    type="button"
                    onClick={onPost}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    <Icon name="plus" size={15} strokeWidth={2.2} />
                    Post
                  </button>
                ) : null}
              </div>
            </div>

            <h1
              id="squad-name"
              className="mt-3 font-display text-[24px] font-extrabold leading-none tracking-[-0.045em]"
            >
              {squad.name}
            </h1>
            <p className="mt-1.5 text-[11.5px] text-muted">
              {squad.members.length} members
              {owner ? ` · owned by @${owner.handle}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] ${
                  squad.visibility === "public" ? "bg-surface text-[#4d535c]" : "bg-ink text-white"
                }`}
              >
                {squad.visibility === "private" ? <Icon name="lock" size={10} strokeWidth={2.2} /> : null}
                {squad.visibility === "public" ? "Public gallery" : "Private gallery"}
              </span>
              <span className="rounded-full bg-surface px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#4d535c]">
                {isOwner ? "You own this squad" : isMember ? "You are a member" : "Read only"}
              </span>
              <span className="text-[10.5px] text-faint">
                {isOwner
                  ? "Manage members, posts and the squad."
                  : isMember
                    ? "Post, invite and manage your own posts."
                    : "Join a squad to post and invite."}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                Members
              </h2>
              <span className="text-[10px] font-medium text-faint">{squad.members.length} in roster</span>
            </div>

            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line px-3">
              {members.map((member) => {
                const player = findPlayer(member.playerId);
                if (!player) return null;
                const canRemove = isOwner && member.role !== "owner" && member.playerId !== currentUserId;

                return (
                  <li key={member.playerId} className="flex items-center gap-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenPlayer(member.playerId)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      aria-label={`Open ${player.name}'s profile`}
                    >
                      <Avatar name={player.name} size={36} tone="soft" src={player.avatar} />
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-bold">
                          {player.name}
                          {member.playerId === currentUserId ? " (you)" : ""}
                        </span>
                        <span className="block truncate text-[10.5px] text-muted">@{player.handle}</span>
                      </span>
                    </button>

                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] ${
                          member.role === "owner" ? "bg-ink text-white" : "bg-surface text-[#4d535c]"
                        }`}
                      >
                        {member.role}
                      </span>
                      {canRemove ? (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member.playerId)}
                          className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                          aria-label={`Remove ${player.name} from ${squad.name}`}
                        >
                          Remove
                        </button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>

            {squadInvites.length > 0 ? (
              <>
                <div className="mt-4 flex items-center justify-between">
                  <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                    Invited
                  </h2>
                  <span className="text-[10px] font-medium text-faint">
                    {squadInvites.length} pending
                  </span>
                </div>

                <ul className="mt-2 divide-y divide-line rounded-2xl border border-dashed border-[#e2e5e9] px-3">
                  {squadInvites.map((invite) => {
                    const player = findPlayer(invite.playerId);
                    const inviter = findPlayer(invite.invitedBy);
                    if (!player) return null;
                    const canCancel = isOwner || invite.invitedBy === currentUserId;

                    return (
                      <li key={invite.id} className="flex items-center gap-3 py-2.5">
                        <Avatar name={player.name} size={36} tone="soft" src={player.avatar} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-bold">{player.name}</span>
                          <span className="block truncate text-[10.5px] text-muted">
                            @{player.handle}
                            {inviter ? ` · invited by @${inviter.handle}` : ""}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full border border-line px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#4d535c]">
                            Pending
                          </span>
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => onCancelInvite(invite.id)}
                              className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                              aria-label={`Cancel invite for ${player.name}`}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}

            <div className="mt-7 flex items-center justify-between">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                Squad gallery
              </h2>
              <span className="text-[10px] font-medium text-faint">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            </div>

            {posts.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
                {posts.map((post) => {
                  const isAuthor = (post.creatorId ?? findPlayerId(post.creator)) === currentUserId;
                  const canDelete = isOwner || isAuthor;
                  const canEdit = isAuthor;

                  return (
                    <div
                      key={post.id}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-surface"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenSnag(post)}
                        aria-label={`Open ${post.title}`}
                        className="absolute inset-0"
                      >
                        <img
                          src={post.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </button>

                      <span className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-[#080a0e]/90 to-transparent px-2 pb-1.5 pt-6 text-left text-[9px] font-bold leading-tight text-white">
                        {post.title}
                      </span>

                      {canEdit || canDelete ? (
                        <div className="absolute right-1.5 top-1.5 flex gap-1">
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => onEditPost(post)}
                              aria-label={`Edit ${post.title}`}
                              className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-white"
                            >
                              <Icon name="edit" size={13} />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setPendingPost(post)}
                              aria-label={`Delete ${post.title}`}
                              className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#b3261e] shadow-sm transition-colors hover:bg-white"
                            >
                              <Icon name="close" size={13} strokeWidth={2.4} />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center">
                <p className="text-[12.5px] font-semibold">Nothing in the gallery yet</p>
                <p className="mx-auto mt-1 max-w-[30ch] text-[11.5px] leading-relaxed text-muted">
                  {isMember
                    ? "Post a clip, loadout or screenshot for the squad."
                    : squad.visibility === "private"
                      ? "This gallery is private — only members can see its posts."
                      : "Only members can add posts to this gallery."}
                </p>
                {isMember ? (
                  <button
                    type="button"
                    onClick={onPost}
                    className="mt-3 h-9 rounded-full bg-brand px-4 text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    Post to gallery
                  </button>
                ) : null}
              </div>
            )}

            {isOwner ? (
              <div className="mt-8 rounded-2xl border border-line p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                  Owner controls
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Only you can transfer the squad, remove members or delete it. Deleting removes the squad and
                  every post in its gallery. Public galleries show their posts in the feed; private ones stay
                  inside the squad.
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Gallery visibility">
                  {(["public", "private"] as SquadVisibility[]).map((option) => {
                    const selected = squad.visibility === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSetVisibility(option)}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-full border text-[11px] font-semibold capitalize transition-colors ${
                          selected
                            ? "border-ink bg-ink text-white"
                            : "border-line text-[#4d535c] hover:border-[#d8dce1]"
                        }`}
                      >
                        {option === "private" ? (
                          <Icon name="lock" size={11} strokeWidth={2.2} />
                        ) : null}
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferOpen(true)}
                    className="h-9 rounded-full border border-line px-3 text-[11px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                  >
                    Transfer ownership
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="h-9 rounded-full border border-line px-3 text-[11px] font-semibold text-[#b3261e] transition-colors hover:border-[#f0c9c5]"
                  >
                    Delete squad
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {inviteOpen ? (
        <Sheet labelledBy="invite-title" onClose={closeInvite}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Invite</p>
              <h2
                id="invite-title"
                className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
              >
                Add to {squad.name}.
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Look a player up by username. They join the roster once they accept.
              </p>
            </div>
            <button
              type="button"
              onClick={closeInvite}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c] transition-colors hover:bg-line"
            >
              <Icon name="close" size={17} />
            </button>
          </div>

          <label
            htmlFor="invite-lookup"
            className="mt-4 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
          >
            Username
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
              <Icon name="search" size={15} />
            </span>
            <input
              id="invite-lookup"
              value={inviteQuery}
              onChange={(event) => setInviteQuery(event.target.value)}
              placeholder="@handle or player name"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-[13px] text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>

          <div className="mt-3 max-h-[44vh] space-y-1 overflow-y-auto">
            {visibleResults.length > 0 ? (
              visibleResults.map((player) => (
                <div key={player.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                  <Avatar name={player.name} size={36} tone="soft" src={player.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{player.name}</p>
                    <p className="truncate text-[10.5px] text-muted">@{player.handle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInvite(player.id)}
                    className="h-8 shrink-0 rounded-full bg-brand px-3 text-[11px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    Invite
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-surface px-3 py-6 text-center text-[11.5px] leading-relaxed text-muted">
                {inviteQuery.trim()
                  ? `No player found for “${inviteQuery.trim()}”. Check the spelling or the @handle.`
                  : "Everyone you can invite is already a member or has a pending invite."}
              </p>
            )}
          </div>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-faint">
            Invites stay pending until the player accepts, or you cancel them.
          </p>
        </Sheet>
      ) : null}

      {transferOpen ? (
        <Sheet labelledBy="transfer-title" onClose={() => setTransferOpen(false)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Owner</p>
              <h2
                id="transfer-title"
                className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
              >
                Hand over {squad.name}.
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                The new owner runs the roster and gallery. You become a member and keep posting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTransferOpen(false)}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c] transition-colors hover:bg-line"
            >
              <Icon name="close" size={17} />
            </button>
          </div>

          <div className="mt-4 space-y-1">
            {squad.members.filter((member) => member.playerId !== currentUserId).length > 0 ? (
              squad.members
                .filter((member) => member.playerId !== currentUserId)
                .map((member) => {
                  const player = findPlayer(member.playerId);
                  if (!player) return null;

                  return (
                    <div key={member.playerId} className="flex items-center gap-3 rounded-xl px-1 py-2">
                      <Avatar name={player.name} size={36} tone="soft" src={player.avatar} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold">{player.name}</p>
                        <p className="truncate text-[10.5px] text-muted">@{player.handle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTransferTarget(player)}
                        className="h-8 shrink-0 rounded-full border border-line px-3 text-[11px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                      >
                        Make owner
                      </button>
                    </div>
                  );
                })
            ) : (
              <p className="rounded-xl bg-surface px-3 py-6 text-center text-[11.5px] leading-relaxed text-muted">
                There is nobody else in the roster yet. Invite a player first, then hand over the squad.
              </p>
            )}
          </div>
        </Sheet>
      ) : null}

      {transferTarget ? (
        <ConfirmSheet
          title={`Make @${transferTarget.handle} the owner?`}
          body={`${transferTarget.name} takes over ${squad.name} — inviting players, removing members and managing the gallery. You stay in the squad as a member.`}
          confirmLabel="Transfer squad"
          onConfirm={() => {
            onTransferOwnership(transferTarget.id);
            setTransferTarget(null);
            setTransferOpen(false);
          }}
          onClose={() => setTransferTarget(null)}
        />
      ) : null}

      {pendingPost ? (
        <ConfirmSheet
          title="Delete this post?"
          body={`"${pendingPost.title}" will disappear from the ${squad.name} gallery for everyone in this preview.`}
          confirmLabel="Delete post"
          onConfirm={() => {
            onDeletePost(pendingPost);
            setPendingPost(null);
          }}
          onClose={() => setPendingPost(null)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmSheet
          title={`Delete ${squad.name}?`}
          body="This removes the squad, its roster and every post in its gallery for everyone, and clears any pending invites. Only the owner can do this, and it cannot be undone."
          confirmLabel="Delete squad"
          tone="danger"
          onConfirm={() => {
            setConfirmDelete(false);
            onDeleteSquad();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      ) : null}
    </Screen>
  );
}
