import { useState, type FormEvent } from "react";
import { COPYRIGHT_YEAR, LEGAL_DOCS, findLegalDoc } from "../data/legal";
import { PLATFORMS, type PlatformId } from "../data/platforms";
import { REGIONS } from "../data/regions";
import { LegalSheet } from "./LegalSheet";
import { UsernameField } from "./UsernameField";
import {
  MIN_AGE,
  MIN_INTERESTS,
  PASSWORD_MIN_LENGTH,
  PROVIDER_LABELS,
  ageFromBirthday,
  checkUsername,
  createAccount,
  demoSession,
  isValidEmail,
  providerSession,
  signIn,
  type AuthProvider,
  type Session,
} from "../lib/auth";

export type AuthProfile = { handle: string; interests: string[] };

type AuthScreenProps = {
  onAuthenticated: (
    session: Session,
    options: { isNew: boolean; onboarded?: boolean; profile?: AuthProfile },
  ) => void;
};

type Mode = "signin" | "register";

const FIELD_CLASS =
  "mt-2 h-14 w-full rounded-[14px] bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-[#b6aebf] focus:ring-4 focus:ring-white/35";
const LABEL_CLASS = "block text-[11px] font-bold uppercase tracking-[0.16em] text-white/85";
const SELECT_CLASS =
  "mt-2 h-14 w-full appearance-none rounded-[14px] bg-white px-3.5 text-[15px] text-ink outline-none focus:ring-4 focus:ring-white/35";

const PROVIDERS: AuthProvider[] = ["steam", "xbox", "discord"];
const PROVIDER_ICONS: Record<AuthProvider, string> = {
  steam: "/brand/social/steam.svg",
  xbox: "/brand/social/xbox.svg",
  discord: "/brand/social/discord.svg",
};

const MONTHS = [
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

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 101 }, (_, index) => CURRENT_YEAR - index);

const INTEREST_OPTIONS = [
  "Rust",
  "DayZ",
  "Squad",
  "Apex Legends",
  "Call of Duty",
  "Palworld",
  "ARK: Survival Ascended",
  "Conan Exiles",
  "Elden Ring",
  "Rocket League",
  "Cyberpunk 2077",
  "Street Fighter 6",
  "Battlefield",
  "Minecraft",
  "Valorant",
  "Clips",
  "Loadouts",
  "Builds",
  "Squad Galleries",
];

const COUNTRIES = [
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+61", label: "AU +61" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+34", label: "ES +34" },
  { code: "+91", label: "IN +91" },
  { code: "+81", label: "JP +81" },
  { code: "+55", label: "BR +55" },
  { code: "+27", label: "ZA +27" },
];

const GENDERS = ["Female", "Male", "Non-binary"];

const STEP_COPY: { title: string; blurb: string }[] = [
  {
    title: "Create your account",
    blurb: "Email and password, held by SnagChat itself — no social login required.",
  },
  {
    title: "Pick your username",
    blurb: "Squads find you by this. Availability updates as you type.",
  },
  {
    title: "When's your birthday?",
    blurb: `SnagChat is for ${MIN_AGE} and over. Your birthday stays private and never shows on your profile.`,
  },
  {
    title: "Where do you play from?",
    blurb: "Pick the region closest to you so squads and matches sit on the nearest servers.",
  },
  {
    title: "How do you play?",
    blurb: "Choose PC, console, or both — you can change it later in your account.",
  },
  {
    title: "What are you into?",
    blurb: `Pick at least ${MIN_INTERESTS} so the feed starts close to your taste.`,
  },
  { title: "What's your phone number?", blurb: "Optional. Your number won't show on your profile." },
  { title: "What's your gender?", blurb: "Optional. It helps tune recommendations and stays off your profile." },
];

function FieldLabel({ htmlFor, children, className = "" }: { htmlFor: string; children: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`${LABEL_CLASS} ${className}`}>
      {children}
    </label>
  );
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [legalDocId, setLegalDocId] = useState<string | null>(null);

  // Sign in
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [region, setRegion] = useState("");
  const [platforms, setPlatforms] = useState<PlatformId[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [country, setCountry] = useState("+1");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");

  const usernameCheck = checkUsername(handle);
  const handleIsAvailable = usernameCheck.state === "available";

  const birthdayIso =
    month !== "" && day !== "" && year !== ""
      ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : "";
  const birthdayAge = birthdayIso ? ageFromBirthday(birthdayIso) : null;
  const birthdayLabel = birthdayIso ? `${MONTHS[(month as number) - 1]} ${day}, ${year}` : "";

  const signInReady = signInEmail.trim().length > 0 && signInPassword.length > 0;
  const phoneDigits = phone.replace(/\D/g, "");

  const canContinue =
    step === 0
      ? name.trim().length > 0 && isValidEmail(email) && password.length >= PASSWORD_MIN_LENGTH
      : step === 1
        ? handleIsAvailable
        : step === 2
          ? birthdayAge !== null && birthdayAge >= MIN_AGE
          : step === 3
            ? region !== ""
            : step === 4
              ? platforms.length > 0
              : step === 5
                ? interests.length >= MIN_INTERESTS
                : step === 6
                  ? phoneDigits.length >= 6
                  : true;

  const reset = () => {
    setError(null);
    setNotice(null);
  };

  const switchMode = (next: Mode) => {
    reset();
    setMode(next);
    setStep(0);
    setPassword("");
  };

  const submitSignIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!signInReady || busy) return;

    reset();
    setBusy(true);
    try {
      const result = await signIn(signInEmail, signInPassword);
      if (result.ok) onAuthenticated(result.session, { isNew: false });
      else setError(result.error);
    } catch {
      setError("Signing in needs a secure connection in this browser.");
    } finally {
      setBusy(false);
    }
  };

  const completeRegistration = async () => {
    if (busy) return;
    reset();
    setBusy(true);

    try {
      const result = await createAccount({
        name,
        email,
        password,
        handle,
        birthday: birthdayIso,
        region,
        platforms,
        interests,
        phone: phoneDigits ? { country, number: phoneDigits } : undefined,
        gender: gender || undefined,
      });

      if (result.ok) {
        onAuthenticated(result.session, {
          isNew: true,
          onboarded: true,
          profile: { handle: handle.replace(/^@+/, "").toLowerCase(), interests },
        });
      } else {
        setError(result.error);
        setStep(0);
      }
    } catch {
      setError("Creating an account needs a secure connection in this browser.");
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    reset();
    if (!canContinue) {
      if (step === 0) setError("Check your name, email and an 8+ character password.");
      if (step === 1) setError(usernameCheck.message || "Pick an available username.");
      if (step === 2) {
        setError(
          birthdayAge === null
            ? "Pick a month, day and year."
            : `You need to be at least ${MIN_AGE} to join SnagChat.`,
        );
      }
      if (step === 3) setError("Choose a region.");
      if (step === 4) setError("Pick PC, console or both.");
      if (step === 5) {
        setError(
          `Pick ${MIN_INTERESTS - interests.length} more interest${MIN_INTERESTS - interests.length === 1 ? "" : "s"}.`,
        );
      }
      if (step === 6) setError("Enter a phone number with at least 6 digits, or skip.");
      return;
    }

    if (step === 7) {
      void completeRegistration();
      return;
    }

    setStep(step + 1);
  };

  const back = () => {
    reset();
    if (step === 0) {
      switchMode("signin");
      return;
    }
    setStep(step - 1);
  };

  const togglePlatform = (platform: PlatformId) => {
    reset();
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
  };

  const toggleBothPlatforms = () => {
    reset();
    setPlatforms((current) => (current.length === 2 ? [] : ["pc", "console"]));
  };

  const toggleInterest = (interest: string) => {
    reset();
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  const startDemo = () => onAuthenticated(demoSession(), { isNew: false });

  const startProvider = (provider: AuthProvider) => {
    onAuthenticated(providerSession(provider), { isNew: false });
  };

  const explainReset = () => {
    setError(null);
    setNotice(
      "Password resets need a server. In this preview the account lives in this browser — sign in, create a new account, or use a demo account.",
    );
  };

  const registerView = mode === "register";

  return (
    <div className="min-h-screen bg-[#8a00f0] text-white">
      <main className="mx-auto flex w-full max-w-[440px] flex-col px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-9 sm:pt-14">
        <img
          src="/brand/snagchat-icon.png"
          alt="SnagChat"
          className="mx-auto h-20 w-auto xl:hidden"
          draggable={false}
        />
        <img
          src="/brand/snagchat-wordmark.png"
          alt="SnagChat"
          className="mx-auto hidden h-auto w-[240px] max-w-full xl:block"
          draggable={false}
        />

        {registerView ? (
          <>
            <div className="mt-8 flex items-center justify-center gap-1.5" aria-hidden="true">
              {STEP_COPY.map((_, index) => (
                <span
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === step ? "bg-white" : index < step ? "bg-white/60" : "bg-white/25"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              Step {step + 1} of {STEP_COPY.length}
            </p>
            <h1
              id="auth-step-title"
              className="mt-2 text-center font-display text-[27px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[30px]"
            >
              {STEP_COPY[step].title}
            </h1>
            <p className="mx-auto mt-2 max-w-[36ch] text-center text-[13px] leading-relaxed text-white/85">
              {STEP_COPY[step].blurb}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-10 text-center font-display text-[30px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[34px]">
              Sign in
            </h1>
            <p className="mx-auto mt-3 max-w-[34ch] text-center text-[14px] leading-relaxed text-white/90">
              Email and password, held by SnagChat itself — no social login, no third party.
            </p>
          </>
        )}

        {!registerView ? (
          <form onSubmit={submitSignIn} noValidate className="mt-8">
            <FieldLabel htmlFor="auth-email">Email</FieldLabel>
            <input
              id="auth-email"
              type="email"
              value={signInEmail}
              onChange={(event) => setSignInEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              className={FIELD_CLASS}
            />

            <div className="mt-5 flex items-baseline justify-between gap-3">
              <FieldLabel htmlFor="auth-password" className="!mt-0">
                Password
              </FieldLabel>
              <button
                type="button"
                onClick={explainReset}
                className="text-[12px] font-medium text-white underline decoration-white/60 underline-offset-2 transition-colors hover:decoration-white"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="auth-password"
              type="password"
              value={signInPassword}
              onChange={(event) => setSignInPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className={FIELD_CLASS}
            />

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed"
              >
                {error}
              </p>
            ) : null}

            {notice ? (
              <p
                role="status"
                className="mt-4 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/90"
              >
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!signInReady || busy}
              className="mt-5 h-14 w-full rounded-[14px] bg-white text-[15px] font-bold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white disabled:text-black"
            >
              {busy ? "Checking…" : "Sign in"}
            </button>

            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
              Or step in with
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => startProvider(provider)}
                  aria-label={`Continue with ${PROVIDER_LABELS[provider]}`}
                  className="flex h-[62px] flex-col items-center justify-center gap-1.5 rounded-[14px] bg-white text-[11.5px] font-bold text-black shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors hover:bg-white/90 active:scale-[0.98]"
                >
                  <span
                    aria-hidden="true"
                    className="h-[22px] w-[22px] bg-current"
                    style={{
                      WebkitMaskImage: `url("${PROVIDER_ICONS[provider]}")`,
                      maskImage: `url("${PROVIDER_ICONS[provider]}")`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                  {PROVIDER_LABELS[provider]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-white/60">
              Platform sign-in is a preview stand-in here: nothing is sent to Steam, Xbox or Discord. You finish
              setup in the welcome steps.
            </p>

            <div className="mt-7 border-t border-white/40" />

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">Or look around first</p>
            <button
              type="button"
              onClick={startDemo}
              className="mt-2.5 h-14 w-full rounded-[14px] border border-white/60 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Try a demo account
            </button>

            <div className="mt-6 text-center text-[12.5px] text-white/90">
              New here?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-semibold underline decoration-white/60 underline-offset-2 hover:decoration-white"
              >
                Create an account
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-7">
            {step === 0 ? (
              <>
                <FieldLabel htmlFor="reg-name">Display name</FieldLabel>
                <input
                  id="reg-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="How your squad sees you"
                  maxLength={32}
                  autoComplete="nickname"
                  className={FIELD_CLASS}
                />

                <FieldLabel htmlFor="reg-email" className="mt-5">
                  Email
                </FieldLabel>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  className={FIELD_CLASS}
                />

                <FieldLabel htmlFor="reg-password" className="mt-5">
                  Password
                </FieldLabel>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
                  autoComplete="new-password"
                  className={FIELD_CLASS}
                />
              </>
            ) : null}

            {step === 1 ? (
              <>
                <UsernameField value={handle} onChange={setHandle} check={usernameCheck} />
                <p className="mt-3 text-[11.5px] leading-relaxed text-white/70">
                  This is the @name people use to find you, invite you to a squad and share your profile.
                </p>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
                  <div>
                    <FieldLabel htmlFor="birth-month">Month</FieldLabel>
                    <select
                      id="birth-month"
                      value={month}
                      onChange={(event) => setMonth(event.target.value ? Number(event.target.value) : "")}
                      className={SELECT_CLASS}
                    >
                      <option value="">Month</option>
                      {MONTHS.map((label, index) => (
                        <option key={label} value={index + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="birth-day">Day</FieldLabel>
                    <select
                      id="birth-day"
                      value={day}
                      onChange={(event) => setDay(event.target.value ? Number(event.target.value) : "")}
                      className={SELECT_CLASS}
                    >
                      <option value="">Day</option>
                      {DAYS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="birth-year">Year</FieldLabel>
                    <select
                      id="birth-year"
                      value={year}
                      onChange={(event) => setYear(event.target.value ? Number(event.target.value) : "")}
                      className={SELECT_CLASS}
                    >
                      <option value="">Year</option>
                      {YEARS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Your birthday</p>
                <p className="mt-1 font-display text-[30px] font-extrabold leading-none tracking-[-0.03em]">
                  {birthdayLabel || "—"}
                </p>
                {birthdayAge !== null ? (
                  <p
                    className={`mt-2 text-[12px] font-semibold ${
                      birthdayAge >= MIN_AGE ? "text-[#9df5b1]" : "text-[#ffc2bd]"
                    }`}
                  >
                    {birthdayAge >= MIN_AGE
                      ? `That makes you ${birthdayAge}.`
                      : `You need to be at least ${MIN_AGE}.`}
                  </p>
                ) : null}

                <p className="mt-4 text-[11.5px] leading-relaxed text-white/70">
                  Use your own age, even if this is a business account. We keep this on your account only — it never
                  shows on your profile and is not shared with anyone.
                </p>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="mt-1 grid gap-2" role="radiogroup" aria-label="Region">
                  {REGIONS.map((option) => {
                    const selected = region === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          reset();
                          setRegion(option.id);
                        }}
                        className={`flex items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                          selected
                            ? "border-white bg-white text-[#7a00ae]"
                            : "border-white/50 text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold tracking-[-0.01em]">
                            {option.label} · {option.area}
                          </span>
                          <span
                            className={`mt-0.5 block text-[11.5px] leading-relaxed ${
                              selected ? "text-[#7a00ae]/85" : "text-white/70"
                            }`}
                          >
                            {option.description}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            selected
                              ? "border-[#7a00ae] bg-[#7a00ae] text-white"
                              : "border-white/50 text-transparent"
                          }`}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path
                              d="m5 12.5 4.5 4.5L19 7"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-[11.5px] leading-relaxed text-white/70">
                  Your region is saved with your account so squads and matchmaking start on the nearest servers.
                </p>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <div className="mt-1 grid gap-2">
                  {PLATFORMS.map((platform) => {
                    const selected = platforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => togglePlatform(platform.id)}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                          selected
                            ? "border-white bg-white text-[#7a00ae]"
                            : "border-white/50 text-white hover:bg-white/10"
                        }`}
                      >
                        <span>
                          <span className="block text-[13px] font-bold tracking-[-0.01em]">{platform.label}</span>
                          <span
                            className={`mt-0.5 block text-[11.5px] ${
                              selected ? "text-[#7a00ae]/85" : "text-white/70"
                            }`}
                          >
                            {platform.hint}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                            selected
                              ? "border-[#7a00ae] bg-[#7a00ae] text-white"
                              : "border-white/50 text-transparent"
                          }`}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path
                              d="m5 12.5 4.5 4.5L19 7"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    aria-pressed={platforms.length === 2}
                    onClick={toggleBothPlatforms}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                      platforms.length === 2
                        ? "border-white bg-white text-[#7a00ae]"
                        : "border-white/50 text-white hover:bg-white/10"
                    }`}
                  >
                    <span>
                      <span className="block text-[13px] font-bold tracking-[-0.01em]">Both</span>
                      <span
                        className={`mt-0.5 block text-[11.5px] ${
                          platforms.length === 2 ? "text-[#7a00ae]/85" : "text-white/70"
                        }`}
                      >
                        One account across PC and console
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        platforms.length === 2
                          ? "border-[#7a00ae] bg-[#7a00ae] text-white"
                          : "border-white/50 text-transparent"
                      }`}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path
                          d="m5 12.5 4.5 4.5L19 7"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
                <p className="mt-4 text-[11.5px] leading-relaxed text-white/70">
                  Pick more than one if you play both — “Both” selects PC and console together.
                </p>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className={LABEL_CLASS}>Interests</p>
                  <p
                    className={`text-[11.5px] font-bold ${
                      interests.length >= MIN_INTERESTS ? "text-[#9df5b1]" : "text-white/80"
                    }`}
                  >
                    {Math.min(interests.length, MIN_INTERESTS)} of {MIN_INTERESTS} picked
                  </p>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Interests">
                  {INTEREST_OPTIONS.map((interest) => {
                    const selected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleInterest(interest)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors ${
                          selected
                            ? "border-white bg-white text-[#7a00ae]"
                            : "border-white/50 text-white hover:bg-white/10"
                        }`}
                      >
                        {selected ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="m5 12.5 4.5 4.5L19 7"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-[11.5px] leading-relaxed text-white/70">
                  These shape your starting feed. You can change them any time by picking a different filter.
                </p>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <div className="grid grid-cols-[112px_1fr] gap-2">
                  <div>
                    <FieldLabel htmlFor="phone-country">Country</FieldLabel>
                    <select
                      id="phone-country"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className={SELECT_CLASS}
                    >
                      {COUNTRIES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="phone-number">Phone number</FieldLabel>
                    <input
                      id="phone-number"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Enter number"
                      inputMode="tel"
                      autoComplete="tel"
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                <p className="mt-4 text-[11.5px] leading-relaxed text-white/75">
                  Your number won't show on your profile. In this preview it is stored on this device only — no SMS
                  is sent and nothing is verified, because verification needs a server.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setPhone("");
                    setStep(7);
                  }}
                  className="mt-3 h-11 w-full rounded-xl border border-white/50 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Skip
                </button>
              </>
            ) : null}

            {step === 7 ? (
              <>
                <div className="mt-1 grid gap-2" role="radiogroup" aria-label="Gender">
                  {GENDERS.map((option) => {
                    const selected = gender === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setGender(option)}
                        className={`h-12 rounded-[14px] border text-[13.5px] font-semibold transition-colors ${
                          selected
                            ? "border-white bg-white text-[#7a00ae]"
                            : "border-white/50 text-white hover:bg-white/10"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={gender.startsWith("Other:")}
                    onClick={() => setGender("Other:")}
                    className={`h-12 rounded-[14px] border text-[13.5px] font-semibold transition-colors ${
                      gender.startsWith("Other:")
                        ? "border-white bg-white text-[#7a00ae]"
                        : "border-white/50 text-white hover:bg-white/10"
                    }`}
                  >
                    Specify another
                  </button>
                </div>

                {gender.startsWith("Other:") ? (
                  <input
                    value={gender.replace(/^Other:\s*/, "")}
                    onChange={(event) => setGender(`Other: ${event.target.value}`)}
                    placeholder="How you'd describe it"
                    maxLength={32}
                    aria-label="Your gender"
                    className={FIELD_CLASS}
                  />
                ) : null}

                <p className="mt-4 text-[11.5px] leading-relaxed text-white/75">
                  Optional, and never shown on your profile. Pick one above, or skip and add it later.
                </p>
              </>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={back}
                disabled={busy}
                className="h-14 rounded-[14px] border border-white/55 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={next}
                disabled={busy || (!canContinue && step !== 7)}
                className="h-14 flex-1 rounded-[14px] bg-white text-[15px] font-bold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white disabled:text-black"
              >
                {busy
                  ? "Creating…"
                  : step === 7
                    ? "Create account"
                    : step === 6
                      ? "Save and continue"
                      : "Continue"}
              </button>
            </div>

            <div className="mt-6 text-center text-[12.5px] text-white/90">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="font-semibold underline decoration-white/60 underline-offset-2 hover:decoration-white"
              >
                Sign in
              </button>
            </div>
          </div>
        )}

        <p className="mt-7 text-center text-[11px] leading-relaxed text-white/70">
          Demo accounts keep nothing. Created accounts, hashed passwords and the answers above stay in this browser —
          there is no server behind this preview yet.
        </p>

        <div className="mt-6 border-t border-white/25 pt-4">
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL_DOCS.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setLegalDocId(doc.id)}
                className="text-[11px] font-semibold text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white"
              >
                {doc.short}
              </button>
            ))}
          </nav>
          <p className="mt-2 text-center text-[10.5px] text-white/70">
            © {COPYRIGHT_YEAR} SnagChat. All rights reserved.
          </p>
        </div>
      </main>

      {legalDocId && findLegalDoc(legalDocId) ? (
        <LegalSheet doc={findLegalDoc(legalDocId)!} onClose={() => setLegalDocId(null)} />
      ) : null}
    </div>
  );
}
