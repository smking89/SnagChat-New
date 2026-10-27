import { PLAYERS } from "../data/players";
import { isValidPlatforms } from "../data/platforms";
import { findRegion } from "../data/regions";

export type AuthProvider = "steam" | "xbox" | "discord";

export type Account = {
  email: string;
  name: string;
  salt: string;
  hash: string;
  createdAt: number;
  /** Username chosen at sign-up. Kept here so availability can be checked. */
  handle?: string;
  birthday?: string;
  region?: string;
  platforms?: string[];
  interests?: string[];
  phone?: { country: string; number: string };
  gender?: string;
  provider?: AuthProvider;
};

export type Session = {
  email: string;
  name: string;
  demo: boolean;
  provider?: AuthProvider;
};

const ACCOUNTS_KEY = "snagchat:accounts";

export const PASSWORD_MIN_LENGTH = 8;
export const DEMO_EMAIL = "demo@snagchat.app";

export const PROVIDER_LABELS: Record<AuthProvider, string> = {
  steam: "Steam",
  xbox: "Xbox",
  discord: "Discord",
};

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const input = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return toHex(new Uint8Array(digest));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

const RESERVED_USERNAMES = new Set(PLAYERS.map((player) => player.handle.toLowerCase()));

export const MIN_AGE = 13;

export type UsernameState = "idle" | "available" | "taken" | "short" | "invalid";
export type UsernameCheck = { state: UsernameState; message: string };

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * Live availability for a username. `ignore` lets a player keep their current
 * handle while editing their profile.
 */
export function checkUsername(value: string, ignore?: string): UsernameCheck {
  const username = normalizeUsername(value);
  const own = ignore ? normalizeUsername(ignore) : "";
  if (!username) return { state: "idle", message: "" };
  if (username.length < 3) return { state: "short", message: "Use at least 3 characters." };
  if (username.length > 20) return { state: "invalid", message: "Keep it to 20 characters or fewer." };
  if (!/^[a-z0-9._]+$/.test(username)) {
    return { state: "invalid", message: "Letters, numbers, dots and underscores only." };
  }
  if (username === own) return { state: "available", message: "That is your current username." };
  if (RESERVED_USERNAMES.has(username) || readAccounts().some((account) => account.handle === username)) {
    return { state: "taken", message: `@${username} is taken.` };
  }
  return { state: "available", message: `@${username} is available.` };
}

/** Age in whole years from a `YYYY-MM-DD` value, or null when unparseable. */
export function ageFromBirthday(birthday: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  if (date.getTime() > Date.now()) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < day)) age -= 1;
  return age;
}

export function deleteAccount(email: string): void {
  const normalized = normalizeEmail(email);
  writeAccounts(readAccounts().filter((account) => account.email !== normalized));
}

export function updateAccount(email: string, patch: Partial<Account>): void {
  const accounts = readAccounts();
  const normalized = normalizeEmail(email);
  const next = accounts.map((account) =>
    account.email === normalized ? { ...account, ...patch } : account,
  );
  writeAccounts(next);
}

export function findAccount(email?: string): Account | undefined {
  if (!email) return undefined;
  const normalized = normalizeEmail(email);
  return readAccounts().find((account) => account.email === normalized);
}

/**
 * Stepping in with a platform account. There is no OAuth in this preview, so the
 * provider is recorded locally and the visitor finishes setup in onboarding.
 */
export function providerSession(provider: AuthProvider): Session {
  const accounts = readAccounts();
  const existing = accounts.find((account) => account.provider === provider);
  if (existing) {
    return { email: existing.email, name: existing.name, demo: false, provider };
  }

  const account: Account = {
    email: `${provider}@players.snagchat.preview`,
    name: `${PROVIDER_LABELS[provider]} player`,
    salt: randomSalt(),
    hash: "",
    createdAt: Date.now(),
    provider,
  };

  writeAccounts([...accounts, account]);
  return { email: account.email, name: account.name, demo: false, provider };
}

export function handleForEmail(email: string, fallback = "player"): string {
  const local = normalizeEmail(email).split("@")[0] ?? "";
  const cleaned = local.replace(/[^a-z0-9._-]/g, "").slice(0, 20);
  return cleaned || fallback;
}

export function readAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: Account[]) {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Storage is best-effort; the session still works for this visit.
  }
}

export type RegisterDetails = {
  name: string;
  email: string;
  password: string;
  handle: string;
  birthday: string;
  region: string;
  platforms: string[];
  interests: string[];
  phone?: { country: string; number: string };
  gender?: string;
};

export const MIN_INTERESTS = 4;

export async function createAccount(details: RegisterDetails): Promise<AuthResult> {
  const normalized = normalizeEmail(details.email);
  const username = normalizeUsername(details.handle);

  if (!details.name.trim()) return { ok: false, error: "Add a display name." };
  if (!isValidEmail(normalized)) return { ok: false, error: "That email address does not look right." };
  if (details.password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.` };
  }

  const availability = checkUsername(username);
  if (availability.state !== "available") {
    return { ok: false, error: availability.message || "Pick a username." };
  }

  const age = ageFromBirthday(details.birthday);
  if (age === null) return { ok: false, error: "Add your birthday." };
  if (age < MIN_AGE) return { ok: false, error: `You need to be at least ${MIN_AGE} to join.` };

  if (!findRegion(details.region)) {
    return { ok: false, error: "Pick your region." };
  }

  if (!isValidPlatforms(details.platforms)) {
    return { ok: false, error: "Pick PC, console or both." };
  }

  if (details.interests.length < MIN_INTERESTS) {
    return { ok: false, error: `Pick at least ${MIN_INTERESTS} interests.` };
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalized)) {
    return { ok: false, error: "That email already has an account. Sign in instead." };
  }

  const salt = randomSalt();
  const account: Account = {
    email: normalized,
    name: details.name.trim(),
    salt,
    hash: await hashPassword(details.password, salt),
    createdAt: Date.now(),
    handle: username,
    birthday: details.birthday,
    region: details.region,
    platforms: details.platforms,
    interests: details.interests,
    phone: details.phone,
    gender: details.gender,
  };

  writeAccounts([...accounts, account]);

  return { ok: true, session: { email: account.email, name: account.name, demo: false } };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);

  if (!isValidEmail(normalized)) return { ok: false, error: "Enter the email you signed up with." };
  if (!password) return { ok: false, error: "Enter your password." };

  const account = readAccounts().find((item) => item.email === normalized);
  if (!account) return { ok: false, error: "No account for that email on this device. Create one below." };

  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) return { ok: false, error: "That password does not match this account." };

  return { ok: true, session: { email: account.email, name: account.name, demo: false } };
}

export function demoSession(): Session {
  return { email: DEMO_EMAIL, name: "You", demo: true };
}
