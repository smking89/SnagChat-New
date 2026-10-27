import { useState, type ChangeEvent, type FormEvent } from "react";
import { formatCount, type Player } from "../data/players";
import type { Snag } from "../data/snags";
import { REGIONS } from "../data/regions";
import { checkUsername, findAccount, updateAccount } from "../lib/auth";
import { AVATAR_SIZE, BANNER_SIZE, fileToDataUrl, UPLOAD_HINTS } from "../lib/imageUpload";
import type { FollowPermission, InvitePermission } from "../lib/settings";
import { AccountDetails } from "./AccountDetails";
import { CountUp } from "./CountUp";
import { profileShareUrl, shareLink, type ShareOutcome } from "../lib/share";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";
import { SettingsSheet } from "./SettingsSheet";

type ProfileDraft = {
  name: string;
  handle: string;
  bio: string;
  avatar?: string;
  banner?: string;
};

type ProfileScreenProps = {
  player: Player;
  snags: Snag[];
  interests?: string[];
  isMe: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onCreate: () => void;
  onClose: () => void;
  onOpenSnag: (snag: Snag) => void;
  onSaveProfile: (values: ProfileDraft) => void;
  accountEmail?: string;
  isDemoSession?: boolean;
  onSignOut?: () => void;
  followPermission?: FollowPermission;
  invitePermission?: InvitePermission;
  onChangeSettings?: (patch: {
    private?: boolean;
    followPermission?: FollowPermission;
    invitePermission?: InvitePermission;
  }) => void;
  onDownloadData?: () => void;
  onDeleteAccount?: () => void;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-[16px] font-extrabold leading-none tracking-[-0.02em]">
        <CountUp value={value} format={formatCount} />
      </p>
      <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-faint">{label}</p>
    </div>
  );
}

export function ProfileScreen({
  player,
  snags,
  interests = [],
  isMe,
  isFollowing,
  onToggleFollow,
  onMessage,
  onCreate,
  onClose,
  onOpenSnag,
  onSaveProfile,
  accountEmail,
  isDemoSession = false,
  onSignOut,
  followPermission = "everyone",
  invitePermission = "everyone",
  onChangeSettings,
  onDownloadData,
  onDeleteAccount,
}: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState<"avatar" | "banner" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareOutcome | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({
    name: player.name,
    handle: player.handle,
    bio: player.bio,
    avatar: player.avatar,
    banner: player.banner,
  });
  const [regionDraft, setRegionDraft] = useState(findAccount(accountEmail)?.region ?? "");
  const [handleError, setHandleError] = useState<string | null>(null);

  const shareProfile = async () => {
    setShareStatus(
      await shareLink({
        title: `${player.name} (@${player.handle}) on SnagChat`,
        text: `Follow @${player.handle} and see their snags on SnagChat`,
        url: profileShareUrl(player.handle),
      }),
    );
  };

  const startEditing = () => {
    setDraft({
      name: player.name,
      handle: player.handle,
      bio: player.bio,
      avatar: player.avatar,
      banner: player.banner,
    });
    setRegionDraft(findAccount(accountEmail)?.region ?? "");
    setHandleError(null);
    setUploadError(null);
    setEditing(true);
  };

  const handleCheck = checkUsername(draft.handle, player.handle);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const name = draft.name.trim() || player.name;
    const handle =
      draft.handle.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase() || player.handle;

    const availability = checkUsername(handle, player.handle);
    if (availability.state !== "available") {
      setHandleError(availability.message || "Pick an available username.");
      return;
    }

    setHandleError(null);
    onSaveProfile({
      name,
      handle,
      bio: draft.bio.trim(),
      avatar: draft.avatar,
      banner: draft.banner,
    });

    if (accountEmail) {
      updateAccount(accountEmail, { handle, ...(regionDraft ? { region: regionDraft } : {}) });
    }

    setEditing(false);
  };

  const handleFile = async (kind: "avatar" | "banner", file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setBusy(kind);
    try {
      const dataUrl = await fileToDataUrl(file, kind === "avatar" ? AVATAR_SIZE : BANNER_SIZE);
      setDraft((current) => ({ ...current, [kind]: dataUrl }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "That image could not be uploaded.");
    } finally {
      setBusy(null);
    }
  };

  const onFileChange = (kind: "avatar" | "banner") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void handleFile(kind, file);
    event.target.value = "";
  };

  const avatarSrc = editing ? draft.avatar : player.avatar;
  const bannerSrc = editing ? draft.banner : player.banner;

  return (
    <Screen labelledBy="profile-name" onClose={onClose}>
      <ScreenHeader
        title={isMe ? "Your profile" : `@${player.handle}`}
        onBack={onClose}
        action={
          editing ? null : (
            <div className="flex items-center gap-2">
              {isMe && onChangeSettings ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Account settings"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                >
                  <Icon name="settings" size={15} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={shareProfile}
                aria-label={isMe ? "Share your profile" : `Share @${player.handle}'s profile`}
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                <Icon name="share" size={14} strokeWidth={2} />
              </button>
              {isMe ? (
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                >
                  <Icon name="edit" size={14} />
                  Edit
                </button>
              ) : null}
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="relative h-32 overflow-hidden bg-brand-tint">
          {bannerSrc ? (
            <img src={bannerSrc} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <>
              <img
                src="/brand/snagchat-icon.png"
                alt=""
                className="absolute -right-3 -top-4 h-40 w-auto opacity-[0.07]"
              />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-white" />
            </>
          )}
        </div>

        <div className="relative -mt-11 px-4 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-end justify-between gap-3">
              <Avatar
                name={player.name}
                size={84}
                tone={isMe ? "brand" : "soft"}
                src={avatarSrc}
                online={player.online}
                className="font-display ring-4 ring-white"
              />
              <div className="flex items-center gap-2 pb-1">
                {isMe ? (
                  <button
                    type="button"
                    onClick={onCreate}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    <Icon name="plus" size={15} strokeWidth={2.2} />
                    Create
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onToggleFollow}
                      aria-pressed={isFollowing}
                      className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold transition-colors ${
                        isFollowing
                          ? "border border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                          : "bg-brand text-white hover:bg-brand-deep"
                      }`}
                    >
                      <Icon name={isFollowing ? "check" : "plus"} size={15} strokeWidth={2.2} />
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button
                      type="button"
                      onClick={onMessage}
                      aria-label={`Message ${player.name}`}
                      className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                    >
                      <Icon name="message" size={16} />
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>

            <h1
              id="profile-name"
              className="mt-3 flex items-center gap-1.5 font-display text-[24px] font-extrabold leading-none tracking-[-0.045em]"
            >
              <span className="truncate">{player.name}</span>
              {player.verified ? (
                <span title="Verified player" className="shrink-0 text-[#1d9bf0]">
                  <Icon name="verified" size={18} />
                </span>
              ) : null}
            </h1>
            <p className="mt-1.5 text-[12px] font-medium text-muted">@{player.handle}</p>

            {player.private && !editing ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white">
                <Icon name="lock" size={10} strokeWidth={2.2} />
                Private account
              </span>
            ) : null}

            {!editing ? (
              <>
                <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-[#4d535c]">{player.bio}</p>
                <span className="mt-3 inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#4d535c]">
                  {player.game}
                </span>

                {interests.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-line px-2.5 py-1 text-[10.5px] font-semibold text-[#4d535c]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="mt-4 flex items-center gap-7 border-y border-line py-3">
              <Stat value={snags.length} label="Snags" />
              <Stat value={player.followers} label="Followers" />
              <Stat value={player.following} label="Following" />
            </div>

            {!editing ? (
              <p aria-live="polite" className="mt-2 min-h-[15px] text-[11px] font-medium text-brand">
                {shareStatus === "copied"
                  ? "Profile link copied — paste it anywhere."
                  : shareStatus === "shared"
                    ? "Shared."
                    : shareStatus === "failed"
                      ? "This browser blocked the clipboard, so the link could not be copied."
                      : ""}
              </p>
            ) : null}

            {isMe && editing ? (
              <form onSubmit={save} className="mt-4 rounded-2xl border border-line p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                    Profile photo
                  </p>
                  {draft.avatar ? (
                    <button
                      type="button"
                      onClick={() => setDraft((current) => ({ ...current, avatar: undefined }))}
                      className="text-[10.5px] font-semibold text-muted transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-faint">{UPLOAD_HINTS.avatar}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar name={draft.name || player.name} size={52} tone="soft" src={draft.avatar} />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                  >
                    {busy === "avatar" ? "Processing" : "Upload photo"}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={onFileChange("avatar")}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Banner</p>
                  {draft.banner ? (
                    <button
                      type="button"
                      onClick={() => setDraft((current) => ({ ...current, banner: undefined }))}
                      className="text-[10.5px] font-semibold text-muted transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-faint">{UPLOAD_HINTS.banner}</p>
                <div className="mt-2 h-20 w-full overflow-hidden rounded-xl border border-line bg-surface">
                  {draft.banner ? (
                    <img src={draft.banner} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <div className="grid h-full place-items-center text-[10.5px] text-faint">No banner yet</div>
                  )}
                </div>
                <div className="mt-2">
                  <label
                    htmlFor="banner-upload"
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                  >
                    {busy === "banner" ? "Processing" : "Upload banner"}
                  </label>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={onFileChange("banner")}
                  />
                </div>

                {uploadError ? (
                  <p role="alert" className="mt-2 text-[11px] font-medium text-[#b3261e]">
                    {uploadError}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] leading-relaxed text-faint">
                  Uploads are cropped to the sizes above and saved in this browser only. GIFs are not supported
                  for profile images.
                </p>

                <div className="mt-4 border-t border-line pt-3">
                  <label
                    htmlFor="edit-name"
                    className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
                  >
                    Display name
                  </label>
                  <input
                    id="edit-name"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    maxLength={32}
                    className="mt-1.5 h-11 w-full rounded-xl border border-line px-3 text-[13px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />

                  <label
                    htmlFor="edit-handle"
                    className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
                  >
                    Handle
                  </label>
                  <div className="mt-1.5 flex h-11 items-center gap-1 rounded-xl border border-line px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                    <span className="text-[13px] text-faint">@</span>
                    <input
                      id="edit-handle"
                      value={draft.handle}
                      onChange={(event) => {
                        setHandleError(null);
                        setDraft((current) => ({ ...current, handle: event.target.value }));
                      }}
                      maxLength={20}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-describedby="edit-handle-status"
                      className="h-full w-full bg-transparent text-[13px] outline-none"
                    />
                  </div>
                  <p
                    id="edit-handle-status"
                    aria-live="polite"
                    className={`mt-1 text-[10.5px] font-semibold ${
                      handleCheck.state === "available" ? "text-[#1a7f37]" : "text-[#b3261e]"
                    }`}
                  >
                    {handleError ?? handleCheck.message}
                  </p>

                  <label
                    htmlFor="edit-bio"
                    className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
                  >
                    Bio
                  </label>
                  <textarea
                    id="edit-bio"
                    rows={3}
                    value={draft.bio}
                    onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                    maxLength={140}
                    className="mt-1.5 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />

                  <p className="mt-3 text-[10px] leading-relaxed text-faint">
                    Visibility, follow and invite permissions live in Settings, next to your profile header.
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={busy !== null}
                      className="h-10 flex-1 rounded-xl bg-brand text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c6e6]"
                    >
                      Save profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="h-10 rounded-xl border border-line px-4 text-[12.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-4 border-t border-line pt-3">
                    <label
                      htmlFor="edit-region"
                      className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
                    >
                      Region
                    </label>
                    <select
                      id="edit-region"
                      value={regionDraft}
                      onChange={(event) => setRegionDraft(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                    >
                      <option value="">Not set</option>
                      {REGIONS.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.label} · {region.area}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] leading-relaxed text-faint">
                      Sets the servers you are matched with. Changing it updates your account straight away.
                    </p>
                  </div>

                  <AccountDetails
                    accountEmail={accountEmail}
                    isDemoSession={isDemoSession}
                    interests={interests}
                    onSignOut={onSignOut}
                  />
                </div>
              </form>
            ) : null}

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                {isMe ? "Your snags" : `${player.name}'s snags`}
              </h2>
              <span className="text-[10px] font-medium text-faint">{snags.length} posted</span>
            </div>

            {player.private && !isMe && !isFollowing ? (
              <div className="mt-2 rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ink text-white">
                  <Icon name="lock" size={17} strokeWidth={2.1} />
                </span>
                <p className="mt-2.5 text-[12.5px] font-semibold">This account is private</p>
                <p className="mx-auto mt-1 max-w-[32ch] text-[11.5px] leading-relaxed text-muted">
                  Follow @{player.handle} to see their snags.
                </p>
                <button
                  type="button"
                  onClick={onToggleFollow}
                  className="mt-3 h-9 rounded-full bg-brand px-4 text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  Follow
                </button>
              </div>
            ) : snags.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
                {snags.map((snag) => (
                  <button
                    key={snag.id}
                    type="button"
                    onClick={() => onOpenSnag(snag)}
                    aria-label={`Open ${snag.title}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-surface"
                  >
                    <img
                      src={snag.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      draggable={false}
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080a0e]/90 to-transparent px-2 pb-1.5 pt-6 text-left text-[9.5px] font-bold leading-tight text-white">
                      <span className="line-clamp-2">{snag.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center">
                <p className="text-[12.5px] font-semibold">No snags yet</p>
                <p className="mx-auto mt-1 max-w-[32ch] text-[11.5px] leading-relaxed text-muted">
                  {isMe
                    ? "Post a clip, loadout or screenshot and it lands here."
                    : `${player.name} has not posted a snag yet.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {settingsOpen && isMe ? (
        <SettingsSheet
          isPrivate={Boolean(player.private)}
          followPermission={followPermission}
          invitePermission={invitePermission}
          isDemoSession={isDemoSession}
          onSetPrivate={(value) => onChangeSettings?.({ private: value })}
          onSetFollowPermission={(value) => onChangeSettings?.({ followPermission: value })}
          onSetInvitePermission={(value) => onChangeSettings?.({ invitePermission: value })}
          onDownload={() => {
            onDownloadData?.();
            setSettingsOpen(false);
          }}
          onDelete={() => onDeleteAccount?.()}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </Screen>
  );
}
