import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { FrameLoadout } from "../data/frames";
import { formatCount, type Player } from "../data/players";
import type { Snag } from "../data/snags";
import { REGIONS } from "../data/regions";
import { checkUsername, findAccount, updateAccount } from "../lib/auth";
import { saveClip, useClipUrl } from "../lib/clipStore";
import {
  AVATAR_SIZE,
  BANNER_SIZE,
  fileToProfileClip,
  fileToProfileImage,
  UPLOAD_HINTS,
} from "../lib/imageUpload";
import type { FollowPermission, InvitePermission } from "../lib/settings";
import { AccountDetails } from "./AccountDetails";
import { CountUp } from "./CountUp";
import { profileShareUrl, shareLink, type ShareOutcome } from "../lib/share";
import { Avatar } from "./Avatar";
import { ConfirmSheet } from "./ConfirmSheet";
import { FrameLayer, Nameplate } from "./FrameArt";
import { Icon } from "./Icon";
import { ImageViewer } from "./ImageViewer";
import { Screen, ScreenHeader } from "./Screen";
import { SettingsSheet } from "./SettingsSheet";

type ProfileDraft = {
  name: string;
  handle: string;
  bio: string;
  avatar?: string;
  banner?: string;
  /** Clip keys for MP4 profile art, whose first frame is the still above. */
  avatarClip?: string;
  bannerClip?: string;
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
  /** Your own posts: the grid on your profile offers these, nobody else's does. */
  onEditSnag?: (snag: Snag) => void;
  onDeleteSnag?: (snag: Snag) => void;
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
  /** Opens the radial quick-share dial manager from inside Settings. */
  onManageDial?: () => void;
  onDownloadData?: () => void;
  onDeleteAccount?: () => void;
  /** Frames this profile wears: avatar, banner and message nameplate. */
  frames?: FrameLoadout;
  /** Opens the shop's frame studio for your own profile. */
  onOpenShop?: () => void;
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
  onEditSnag,
  onDeleteSnag,
  onSaveProfile,
  accountEmail,
  isDemoSession = false,
  onSignOut,
  followPermission = "everyone",
  invitePermission = "everyone",
  onChangeSettings,
  onManageDial,
  onDownloadData,
  onDeleteAccount,
  frames,
  onOpenShop,
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
    avatarClip: player.avatarClip,
    bannerClip: player.bannerClip,
  });
  const [regionDraft, setRegionDraft] = useState(findAccount(accountEmail)?.region ?? "");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ src: string; label: string } | null>(null);
  /** A snag awaiting confirmation before it is deleted from the grid. */
  const [pendingSnag, setPendingSnag] = useState<Snag | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

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
      avatarClip: player.avatarClip,
      bannerClip: player.bannerClip,
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
      avatarClip: draft.avatarClip,
      bannerClip: draft.bannerClip,
    });

    if (accountEmail) {
      updateAccount(accountEmail, { handle, ...(regionDraft ? { region: regionDraft } : {}) });
    }

    setEditing(false);
  };

  /**
   * Crops the file to the right ratio. Inside the editor the result lands on the
   * draft; from the profile itself it saves straight away, so tapping an empty
   * photo or banner is enough to set one.
   */
  const processFile = async (kind: "avatar" | "banner", file: File | undefined, persist: boolean) => {
    if (!file) return;
    setUploadError(null);
    setBusy(kind);

    const target = kind === "avatar" ? AVATAR_SIZE : BANNER_SIZE;

    try {
      // An MP4 profile photo plays on a loop; stills and GIFs crop as before.
      const clip = file.type.startsWith("video/") ? await fileToProfileClip(file, target) : null;
      const dataUrl = clip ? clip.poster : await fileToProfileImage(file, target);
      const clipId = clip ? await saveClip(file) : undefined;

      setDraft((current) => ({
        ...current,
        [kind]: dataUrl,
        [kind === "avatar" ? "avatarClip" : "bannerClip"]: clipId,
      }));

      if (persist) {
        onSaveProfile({
          name: player.name,
          handle: player.handle,
          bio: player.bio,
          avatar: kind === "avatar" ? dataUrl : player.avatar,
          banner: kind === "banner" ? dataUrl : player.banner,
          avatarClip: kind === "avatar" ? clipId : player.avatarClip,
          bannerClip: kind === "banner" ? clipId : player.bannerClip,
        });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "That file could not be uploaded.");
    } finally {
      setBusy(null);
    }
  };

  const onFileChange = (kind: "avatar" | "banner") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void processFile(kind, file, false);
    event.target.value = "";
  };

  const onProfileFile = (kind: "avatar" | "banner") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void processFile(kind, file, true);
    event.target.value = "";
  };

  const openArt = (kind: "avatar" | "banner") => {
    // A clip is already playing in place; the still viewer would freeze it.
    if (kind === "avatar" ? avatarClipUrl : bannerClipUrl) return;

    if (kind === "avatar") {
      if (avatarSrc) setViewing({ src: avatarSrc, label: `${isMe ? "Your" : `${player.name}'s`} profile photo` });
      else avatarInput.current?.click();
      return;
    }

    if (bannerSrc) setViewing({ src: bannerSrc, label: `${isMe ? "Your" : `${player.name}'s`} banner` });
    else bannerInput.current?.click();
  };

  const avatarSrc = editing ? draft.avatar : player.avatar;
  const bannerSrc = editing ? draft.banner : player.banner;
  const avatarClipUrl = useClipUrl(editing ? draft.avatarClip : player.avatarClip);
  const bannerClipUrl = useClipUrl(editing ? draft.bannerClip : player.bannerClip);
  const draftAvatarClipUrl = useClipUrl(draft.avatarClip);
  const draftBannerClipUrl = useClipUrl(draft.bannerClip);

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
              {isMe && onOpenShop ? (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                >
                  <Icon name="shop" size={14} />
                  Frames
                </button>
              ) : null}
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
        <div className="frame-host relative h-32 overflow-hidden bg-brand-tint">
          {bannerClipUrl ? (
            <video
              src={bannerClipUrl}
              poster={bannerSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : bannerSrc ? (
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

          <FrameLayer use={frames?.banner} target="banner" />

          {isMe || bannerSrc ? (
            <button
              type="button"
              onClick={() => openArt("banner")}
              aria-label={bannerSrc ? "View banner" : "Add a banner"}
              className="absolute inset-0 z-20 flex items-end justify-end p-2"
            >
              <span className="rounded-full bg-[#080a0e]/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                {busy === "banner" ? "Processing…" : bannerSrc ? "Tap to view" : "Add a banner"}
              </span>
            </button>
          ) : null}
        </div>

        <div className="relative z-10 -mt-11 px-4 sm:px-6">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-end justify-between gap-3">
              <button
                type="button"
                onClick={() => openArt("avatar")}
                aria-label={avatarSrc ? "View profile photo" : "Add a profile photo"}
                className="relative rounded-full transition-transform hover:scale-[1.02]"
              >
                <Avatar
                  name={player.name}
                  size={84}
                  tone={isMe ? "brand" : "soft"}
                  src={avatarSrc}
                  videoSrc={avatarClipUrl ?? undefined}
                  /* The add-photo badge owns this corner while there is no photo,
                     so the presence dot would sit underneath it. */
                  online={player.online && !(isMe && !avatarSrc)}
                  frame={frames?.avatar}
                  className="font-display ring-4 ring-white"
                />
                {isMe && !avatarSrc ? (
                  <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-ink text-white">
                    <Icon name="plus" size={14} strokeWidth={2.4} />
                  </span>
                ) : null}
              </button>

              {isMe ? (
                <>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
                    className="sr-only"
                    onChange={onProfileFile("avatar")}
                  />
                  <input
                    ref={bannerInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
                    className="sr-only"
                    onChange={onProfileFile("banner")}
                  />
                </>
              ) : null}
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
              className="mt-3 flex min-w-0 items-center gap-1.5 font-display text-[24px] font-extrabold leading-none tracking-[-0.045em]"
            >
              <Nameplate
                text={player.name}
                use={frames?.nameplate}
                verified={player.verified}
                className="min-w-0"
                textClassName="truncate"
              />
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
                      onClick={() =>
                        setDraft((current) => ({ ...current, avatar: undefined, avatarClip: undefined }))
                      }
                      className="text-[10.5px] font-semibold text-muted transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-faint">{UPLOAD_HINTS.avatar}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-faint">{UPLOAD_HINTS.clipProfile}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => draft.avatar && setViewing({ src: draft.avatar, label: "Profile photo" })}
                    className="rounded-full"
                    aria-label={draft.avatar ? "View profile photo" : "No profile photo yet"}
                  >
                    <Avatar
                      name={draft.name || player.name}
                      size={52}
                      tone="soft"
                      src={draft.avatar}
                      videoSrc={draftAvatarClipUrl ?? undefined}
                    />
                  </button>
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line px-3 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                  >
                    {busy === "avatar" ? "Processing" : "Upload photo"}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
                    className="sr-only"
                    onChange={onFileChange("avatar")}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Banner</p>
                  {draft.banner ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({ ...current, banner: undefined, bannerClip: undefined }))
                      }
                      className="text-[10.5px] font-semibold text-muted transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-faint">{UPLOAD_HINTS.banner}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-faint">{UPLOAD_HINTS.clipProfile}</p>
                <button
                  type="button"
                  onClick={() => draft.banner && setViewing({ src: draft.banner, label: "Banner" })}
                  className="mt-2 block h-20 w-full overflow-hidden rounded-xl border border-line bg-surface"
                  aria-label={draft.banner ? "View banner" : "No banner yet"}
                >
                  {draftBannerClipUrl ? (
                    <video
                      src={draftBannerClipUrl}
                      poster={draft.banner}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : draft.banner ? (
                    <img src={draft.banner} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <span className="grid h-full place-items-center text-[10.5px] text-faint">No banner yet</span>
                  )}
                </button>
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
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4"
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
                  Uploads are saved in this browser only. Stills are cropped to the sizes above, animated GIFs
                  are kept as they are up to 1.5 MB, and MP4s play on a loop with their first frame as the still
                  cover.
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
                  <div key={snag.id} className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
                    {/* The tile opens the snag; the controls sit on top of it. */}
                    <button
                      type="button"
                      onClick={() => onOpenSnag(snag)}
                      aria-label={`Open ${snag.title}`}
                      className="absolute inset-0"
                    >
                      <img
                        src={snag.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        draggable={false}
                      />
                    </button>

                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080a0e]/90 to-transparent px-2 pb-1.5 pt-6 text-left text-[9.5px] font-bold leading-tight text-white">
                      <span className="line-clamp-2">{snag.title}</span>
                    </span>

                    {/* Your own posts, managed the way the squad gallery does it. */}
                    {isMe && (onEditSnag || onDeleteSnag) ? (
                      <div className="absolute right-1.5 top-1.5 flex gap-1">
                        {onEditSnag ? (
                          <button
                            type="button"
                            onClick={() => onEditSnag(snag)}
                            aria-label={`Edit ${snag.title}`}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-white"
                          >
                            <Icon name="edit" size={13} />
                          </button>
                        ) : null}
                        {onDeleteSnag ? (
                          <button
                            type="button"
                            onClick={() => setPendingSnag(snag)}
                            aria-label={`Delete ${snag.title}`}
                            className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#b3261e] shadow-sm transition-colors hover:bg-white"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center">
                <p className="text-[12.5px] font-semibold">No snags yet</p>
                <p className="mx-auto mt-1 max-w-[32ch] text-[11.5px] leading-relaxed text-muted">
                  {isMe
                    ? "Post a clip, loadout or base build and it lands here."
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
          onManageDial={() => {
            setSettingsOpen(false);
            onManageDial?.();
          }}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}

      {pendingSnag ? (
        <ConfirmSheet
          title="Delete this snag?"
          body={`"${pendingSnag.title}" comes off your profile and out of the feed.`}
          confirmLabel="Delete snag"
          onConfirm={() => {
            onDeleteSnag?.(pendingSnag);
            setPendingSnag(null);
          }}
          onClose={() => setPendingSnag(null)}
        />
      ) : null}

      {viewing ? (
        <ImageViewer src={viewing.src} label={viewing.label} onClose={() => setViewing(null)} />
      ) : null}
    </Screen>
  );
}
