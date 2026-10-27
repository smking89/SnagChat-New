import type { ReactNode } from "react";

type IconName =
  | "home"
  | "compass"
  | "plus"
  | "users"
  | "user"
  | "search"
  | "close"
  | "send"
  | "check"
  | "message"
  | "back"
  | "edit"
  | "heart"
  | "share"
  | "bookmark"
  | "bell"
  | "more"
  | "timer"
  | "flag"
  | "checks"
  | "eye"
  | "dm"
  | "verified"
  | "lock"
  | "settings"
  | "download";

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
};

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 10.6 12 4l8 6.6" />
      <path d="M6.2 9.6V20h11.6V9.6" />
      <path d="M10.1 20v-5.4h3.8V20" />
    </>
  ),
  dm: (
    <>
      <path d="M20.3 11.7c0 4.1-3.7 7.4-8.3 7.4-1 0-2-.2-2.9-.5L4.6 20l1.2-3.8c-1.1-1.3-1.8-2.9-1.8-4.5 0-4.1 3.7-7.4 8.3-7.4s8 3.3 8 7.4z" />
    </>
  ),
  compass: (
    <>
      <circle cx="11.5" cy="11.5" r="7.4" />
      <path d="m14.9 8.1-1.7 4.6-4.6 1.7 1.7-4.6z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.6v12.8" />
      <path d="M5.6 12h12.8" />
    </>
  ),
  users: (
    <>
      <circle cx="9.4" cy="8.6" r="3.2" />
      <path d="M3.6 19.4c.6-3.1 2.6-4.7 5.8-4.7s5.2 1.6 5.8 4.7" />
      <path d="M16.2 5.9a3.2 3.2 0 0 1 0 6" />
      <path d="M17.6 14.9c2 .6 3.2 2.1 3.5 4.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.4" r="3.5" />
      <path d="M4.9 20.4c.6-4 3-6 7.1-6s6.5 2 7.1 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.6" />
      <path d="m16.1 16.1 4.1 4.1" />
    </>
  ),
  close: (
    <>
      <path d="m6.8 6.8 10.4 10.4" />
      <path d="M17.2 6.8 6.8 17.2" />
    </>
  ),
  send: (
    <>
      <path d="M4.8 12h13.4" />
      <path d="m13 6.6 5.2 5.4-5.2 5.4" />
    </>
  ),
  check: <path d="m5.2 12.4 4.4 4.4 9.2-9.4" />,
  message: (
    <>
      <path d="M20.3 11.7c0 4.1-3.7 7.4-8.3 7.4-1 0-2-.2-2.9-.5L4.6 20l1.2-3.8c-1.1-1.3-1.8-2.9-1.8-4.5 0-4.1 3.7-7.4 8.3-7.4s8 3.3 8 7.4z" />
      <path d="M9.2 12h.01M12.3 12h.01M15.4 12h.01" strokeWidth="2.4" />
    </>
  ),
  back: (
    <>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </>
  ),
  edit: (
    <>
      <path d="M4.5 19.5h4l10-10a2.6 2.6 0 0 0-3.7-3.7l-10 10z" />
      <path d="m13.8 6.9 3.5 3.5" />
    </>
  ),
  heart: (
    <path d="M12.1 20.3S4.5 15.8 4.5 10.4A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7.5 3.3c0 5.4-7.4 9.9-7.4 9.9z" />
  ),
  settings: (
    <>
      <path d="M4 7.2h16" />
      <path d="M4 12h16" />
      <path d="M4 16.8h16" />
      <circle cx="9.4" cy="7.2" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="16.8" r="2.1" fill="currentColor" stroke="none" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.2v10.4" />
      <path d="m7.8 10.6 4.2 4.2 4.2-4.2" />
      <path d="M5 18.6h14" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.6" width="14" height="9.4" rx="2.3" />
      <path d="M8.5 10.6V8a3.5 3.5 0 0 1 7 0v2.6" />
    </>
  ),
  verified: (
    <>
      <path
        d="M12 1.9l2.2 1.7 2.7-.3 1.1 2.6 2.5 1.2-.7 2.6 1.5 2.3-2 1.9-.3 2.7-2.7.6-1.6 2.2-2.5-1-2.5 1-1.6-2.2-2.7-.6-.3-2.7-2-1.9L4.1 9.7 3.4 7.1l2.5-1.2 1.1-2.6 2.7.3z"
        fill="currentColor"
        stroke="none"
      />
      <path d="m8.5 12.1 2.4 2.4 4.7-4.9" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  bookmark: (
    <path d="M6.6 3.4h10.8a1.5 1.5 0 0 1 1.5 1.5v15.7l-6.9-4.2-6.9 4.2V4.9a1.5 1.5 0 0 1 1.5-1.5z" />
  ),
  bell: (
    <>
      <path d="M12 3.4A5.6 5.6 0 0 0 6.4 9v3.4L4.9 16h14.2l-1.5-3.6V9A5.6 5.6 0 0 0 12 3.4z" />
      <path d="M10 19.3a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5.4" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.6" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="12.9" r="7.5" />
      <path d="M12 9.2v3.9l2.8 1.7" />
      <path d="M9.5 3.4h5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 20.6V4.4" />
      <path d="M6 5.2h11.6l-2 3.5 2 3.5H6" />
    </>
  ),
  checks: (
    <>
      <path d="m3.4 12.6 3.5 3.5 6.2-7" />
      <path d="m11.6 15.4 1 1 6.2-7" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6.6 6.2 12 6.2 21.2 12 21.2 12 17.4 17.8 12 17.8 2.8 12 2.8 12z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  share: (
    <>
      <path d="M12 15.2V4.2" />
      <path d="m7.6 8.6 4.4-4.4 4.4 4.4" />
      <path d="M5 14.2v4.4A1.6 1.6 0 0 0 6.6 20.2h10.8a1.6 1.6 0 0 0 1.6-1.6v-4.4" />
    </>
  ),
};

/**
 * Nav and search glyphs use the supplied PNG artwork. They are drawn as CSS
 * masks so the active state can tint them purple with currentColor.
 */
const MASK_ICONS: Partial<Record<IconName, string>> = {
  user: "/brand/icons/user.png",
  search: "/brand/icons/search.png",
  compass: "/brand/icons/compass.png",
  home: "/brand/icons/home.png",
  dm: "/brand/icons/dm.png",
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className, filled = false }: IconProps) {
  const maskSrc = MASK_ICONS[name];

  if (maskSrc) {
    return (
      <span
        aria-hidden="true"
        className={`icon-rubber ${className ?? ""}`}
        style={{
          display: "inline-block",
          flex: "none",
          width: size,
          height: size,
          backgroundColor: "currentColor",
          WebkitMaskImage: `url("${maskSrc}")`,
          maskImage: `url("${maskSrc}")`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`icon-rubber ${className ?? ""}`}
    >
      {PATHS[name]}
    </svg>
  );
}
