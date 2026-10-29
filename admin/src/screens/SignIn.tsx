import { useState, type FormEvent } from "react";
import { api, ApiError, type Staff } from "../api";

const DEMO_ACCOUNTS = [
  { label: "Superadmin", email: "root@snagchat.io", password: "SnagChat!Super1" },
  { label: "Admin", email: "ops@snagchat.io", password: "SnagChat!Admin1" },
  { label: "Moderator", email: "mod@snagchat.io", password: "SnagChat!Mod1" },
];

export function SignIn({ onSignedIn }: { onSignedIn: (staff: Staff) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const staff = await api.login(email, password);
      onSignedIn(staff);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign in failed");
      setBusy(false);
    }
  };

  const fill = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <img src="/brand/snagchat-icon.png" alt="" className="size-14 rounded-2xl" />
          <h1 className="mt-4 font-display text-[22px] font-bold">SnagChat Staff Admin</h1>
          <p className="mt-1 text-[13px] text-white/75">Sign in with a staff account to continue.</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-card p-6 shadow-2xl">
          <label className="block text-[12px] font-semibold text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1.5 mb-4 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />

          <label className="block text-[12px] font-semibold text-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-brand"
          />

          {error ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#fdeceb] px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-brand py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">Demo accounts</p>
            <div className="mt-2 grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fill(account)}
                  className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-[13px] transition-colors hover:border-brand hover:bg-brand-tint"
                >
                  <span className="font-medium">{account.label}</span>
                  <span className="text-muted">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <p className="mt-4 text-center text-[12px] text-white/70">
          Local seed credentials only — production sign-in belongs behind SSO.
        </p>
      </div>
    </div>
  );
}
