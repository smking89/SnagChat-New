import { platformLabel } from "../data/platforms";
import { regionLabel } from "../data/regions";
import { PROVIDER_LABELS, findAccount } from "../lib/auth";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** `YYYY-MM-DD` → `20 May 2001`. */
export function formatBirthday(value?: string): string | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const month = MONTH_NAMES[Number(match[2]) - 1];
  if (!month) return null;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

type AccountDetailsProps = {
  accountEmail?: string;
  isDemoSession: boolean;
  interests: string[];
  onSignOut?: () => void;
};

/**
 * Private account facts — email, birthday, gender, phone — shown only inside
 * your own profile editor. None of it is rendered on a public profile.
 */
export function AccountDetails({ accountEmail, isDemoSession, interests, onSignOut }: AccountDetailsProps) {
  const account = findAccount(accountEmail);
  const birthday = formatBirthday(account?.birthday);
  const region = regionLabel(account?.region);
  const plays = platformLabel(account?.platforms ?? []);

  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Account</p>
      <p className="mt-1 truncate text-[11.5px] text-muted">
        {isDemoSession ? "Demo session — nothing is saved to an account." : (accountEmail ?? "")}
      </p>
      {account?.provider ? (
        <p className="mt-1 text-[11px] text-muted">
          Signed in with {PROVIDER_LABELS[account.provider]} (preview stand-in)
        </p>
      ) : null}
      {birthday ? <p className="mt-1 text-[11px] text-muted">Birthday: {birthday} · private</p> : null}
      {region ? <p className="mt-1 text-[11px] text-muted">Region: {region}</p> : null}
      {plays ? <p className="mt-1 text-[11px] text-muted">Plays on: {plays}</p> : null}
      {account?.gender ? <p className="mt-1 text-[11px] text-muted">Gender: {account.gender} · private</p> : null}
      {account?.phone ? (
        <p className="mt-1 text-[11px] text-muted">
          Phone: {account.phone.country} {account.phone.number} · unverified
        </p>
      ) : null}
      {interests.length > 0 ? (
        <p className="mt-1 text-[11px] text-muted">
          Interests: {interests.join(", ")} · shown on your profile
        </p>
      ) : null}
      {onSignOut ? (
        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 h-9 rounded-full border border-line px-3 text-[11px] font-semibold text-[#b3261e] transition-colors hover:border-[#f0c9c5]"
        >
          Sign out
        </button>
      ) : null}
    </div>
  );
}
