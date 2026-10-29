import { useState } from "react";
import {
  FOLLOW_PERMISSIONS,
  INVITE_PERMISSIONS,
  type FollowPermission,
  type InvitePermission,
} from "../lib/settings";
import { ConfirmSheet } from "./ConfirmSheet";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type SettingsSheetProps = {
  isPrivate: boolean;
  followPermission: FollowPermission;
  invitePermission: InvitePermission;
  isDemoSession: boolean;
  onSetPrivate: (value: boolean) => void;
  onSetFollowPermission: (value: FollowPermission) => void;
  onSetInvitePermission: (value: InvitePermission) => void;
  /** Opens the radial quick-share dial manager. */
  onManageDial: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onClose: () => void;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">{children}</p>
  );
}

export function SettingsSheet({
  isPrivate,
  followPermission,
  invitePermission,
  isDemoSession,
  onSetPrivate,
  onSetFollowPermission,
  onSetInvitePermission,
  onManageDial,
  onDownload,
  onDelete,
  onClose,
}: SettingsSheetProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (confirmDelete) {
    return (
      <ConfirmSheet
        title="Delete your account?"
        body={
          isDemoSession
            ? "This clears the demo session and everything saved in this browser, then returns you to the sign-in screen."
            : "This removes the account from this browser along with your profile, posts, likes, comments, squads and messages. It cannot be undone. Download your data first if you want a copy."
        }
        confirmLabel="Delete account"
        onConfirm={onDelete}
        onClose={() => setConfirmDelete(false)}
      />
    );
  }

  return (
    <Sheet labelledBy="settings-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Account</p>
          <h2
            id="settings-title"
            className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            Settings.
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c] transition-colors hover:bg-line"
        >
          <Icon name="close" size={17} />
        </button>
      </div>

      <div className="mt-5">
        <SectionLabel>Profile visibility</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Profile visibility">
          {([false, true] as const).map((value) => {
            const selected = isPrivate === value;
            return (
              <button
                key={String(value)}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSetPrivate(value)}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-full border text-[12px] font-semibold transition-colors ${
                  selected ? "border-ink bg-ink text-white" : "border-line text-[#4d535c] hover:border-[#d8dce1]"
                }`}
              >
                {value ? <Icon name="lock" size={12} strokeWidth={2.2} /> : null}
                {value ? "Private" : "Public"}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
          {isPrivate
            ? "Only your followers see your snags. Everyone else gets a lock and a follow button."
            : "Anyone can open your profile, see your snags and follow you."}
        </p>
      </div>

      <div className="mt-5">
        <SectionLabel>Who can follow you</SectionLabel>
        <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label="Who can follow you">
          {FOLLOW_PERMISSIONS.map((option) => {
            const selected = followPermission === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSetFollowPermission(option.value)}
                className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected ? "border-ink bg-surface" : "border-line hover:border-[#d8dce1]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">{option.label}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{option.hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    selected ? "border-ink bg-ink text-white" : "border-line text-transparent"
                  }`}
                >
                  <Icon name="check" size={9} strokeWidth={3.4} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <SectionLabel>Who can send you invites</SectionLabel>
        <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label="Who can send you invites">
          {INVITE_PERMISSIONS.map((option) => {
            const selected = invitePermission === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSetInvitePermission(option.value)}
                className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected ? "border-ink bg-surface" : "border-line hover:border-[#d8dce1]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">{option.label}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{option.hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    selected ? "border-ink bg-ink text-white" : "border-line text-transparent"
                  }`}
                >
                  <Icon name="check" size={9} strokeWidth={3.4} />
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
          Saved with your account. These limits are applied by the server once this preview has one; today they
          are kept in this browser.
        </p>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <SectionLabel>Quick share</SectionLabel>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
          Choose the squads and players that bloom around your thumb when you hold a card in the feed, and let
          smart suggestions top up whatever is left.
        </p>
        <button
          type="button"
          onClick={onManageDial}
          className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line px-4 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-brand hover:text-brand"
        >
          <Icon name="send" size={14} strokeWidth={2.1} />
          Manage radial dial
        </button>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <SectionLabel>Your data</SectionLabel>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
          Download everything tied to this account: profile, posts, likes, comments, follows, squads, invites and
          direct messages as JSON. Passwords and salts are never included.
        </p>
        <button
          type="button"
          onClick={onDownload}
          className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line px-4 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
        >
          <Icon name="download" size={14} strokeWidth={2.1} />
          Download my data
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-[#f3d7d3] bg-[#fdf5f4] p-3">
        <SectionLabel>Delete account</SectionLabel>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[#8a3a33]">
          Removes this account and everything stored in this browser, then returns you to the sign-in screen.
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-2 h-10 rounded-xl bg-[#b3261e] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#95201a]"
        >
          Delete my account
        </button>
      </div>
    </Sheet>
  );
}
