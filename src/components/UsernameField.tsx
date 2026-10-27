import type { UsernameCheck } from "../lib/auth";

type UsernameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  check: UsernameCheck;
};

/**
 * Username input with live availability: green tick when free, red cross when
 * it is taken or not allowed.
 */
export function UsernameField({ value, onChange, check }: UsernameFieldProps) {
  const available = check.state === "available";
  const showStatus = value.trim().length > 0;

  return (
    <>
      <label
        htmlFor="reg-username"
        className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/85"
      >
        Username
      </label>
      <div className="mt-2 flex h-14 items-center gap-1 rounded-[14px] bg-white px-4 focus-within:ring-4 focus-within:ring-white/35">
        <span className="text-[16px] text-[#b6aebf]">@</span>
        <input
          id="reg-username"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="yourname"
          maxLength={20}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="username-status"
          className="h-full w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-[#b6aebf]"
        />
        {showStatus ? (
          <span
            aria-hidden="true"
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${
              available ? "bg-[#1f9d55]" : "bg-[#d64545]"
            }`}
          >
            {available ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="m5 12.5 4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </span>
        ) : null}
      </div>
      <p
        id="username-status"
        aria-live="polite"
        className={`mt-2 flex items-center gap-1.5 text-[12px] font-semibold ${
          available ? "text-[#9df5b1]" : showStatus ? "text-[#ffc2bd]" : "text-white/70"
        }`}
      >
        {showStatus ? check.message : "3+ characters. Letters, numbers, dots and underscores."}
      </p>
    </>
  );
}
