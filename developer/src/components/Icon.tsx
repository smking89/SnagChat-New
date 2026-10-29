import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "activity"
  | "alert"
  | "arrowRight"
  | "arrowUpRight"
  | "book"
  | "box"
  | "chart"
  | "check"
  | "chevronDown"
  | "chevronRight"
  | "clock"
  | "close"
  | "code"
  | "command"
  | "copy"
  | "download"
  | "external"
  | "eye"
  | "filter"
  | "gamepad"
  | "globe"
  | "grid"
  | "key"
  | "layers"
  | "lock"
  | "more"
  | "palette"
  | "play"
  | "plus"
  | "refresh"
  | "search"
  | "settings"
  | "shield"
  | "spark"
  | "terminal"
  | "trash"
  | "users"
  | "webhook"
  | "zap";

const PATHS: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  alert: (
    <>
      <path d="M12 4.2 21 20H3z" />
      <path d="M12 10v4.2M12 17.2h.01" />
    </>
  ),
  arrowRight: <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />,
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  book: (
    <>
      <path d="M5 5.4A2.4 2.4 0 0 1 7.4 3H19v16.4H7.4A2.4 2.4 0 0 0 5 21.8z" />
      <path d="M5 19.4h14" />
    </>
  ),
  box: (
    <>
      <path d="M12 3.2 20 7.6v8.8L12 20.8 4 16.4V7.6z" />
      <path d="M4.4 7.8 12 12l7.6-4.2M12 12v8.6" />
    </>
  ),
  chart: <path d="M4 20v-5.5M9.3 20V5M14.7 20v-8M20 20v-3.5" />,
  check: <path d="M4.8 12.6 9 16.8 19.2 6.6" />,
  chevronDown: <path d="M6.5 9.5 12 15l5.5-5.5" />,
  chevronRight: <path d="M9.5 6.5 15 12l-5.5 5.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.9" />
    </>
  ),
  close: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  code: <path d="M8.4 8 4.4 12l4 4M15.6 8l4 4-4 4M13.4 5.6l-2.8 12.8" />,
  command: (
    <path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H9m0-2.5V9m0-2.5h6M9 9v6m0 0H6.5A2.5 2.5 0 1 0 9 17.5V15m6-6a2.5 2.5 0 1 1 2.5 2.5H15m0-2.5V9m0 6v2.5a2.5 2.5 0 1 0 2.5-2.5H15m0 0H9" />
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
      <path d="M15 6.6V4.9A1.4 1.4 0 0 0 13.6 3.5H5.4A1.4 1.4 0 0 0 4 4.9v8.2a1.4 1.4 0 0 0 1.4 1.4h1.7" />
    </>
  ),
  download: <path d="M12 3.6v11.2M7.2 10.6 12 15.4l4.8-4.8M4.6 20.2h14.8" />,
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8.6 8.6" />
      <path d="M18 14v5.2a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1V7.4a1 1 0 0 1 1-1H10" />
    </>
  ),
  eye: (
    <>
      <path d="M2.4 12S6 6.2 12 6.2 21.6 12 21.6 12 18 17.8 12 17.8S2.4 12 2.4 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  filter: <path d="M4 6.4h16M7 12h10M10 17.6h4" />,
  gamepad: (
    <>
      <rect x="2.4" y="7.2" width="19.2" height="10.4" rx="4" />
      <path d="M7.2 10v4M5.2 12h4" />
      <circle cx="16.4" cy="11.2" r="1" />
      <circle cx="18.2" cy="13.6" r="1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2M12 3.4c2.8 3.4 2.8 13.8 0 17.2M12 3.4c-2.8 3.4-2.8 13.8 0 17.2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.4" y="4" width="6.6" height="6.6" rx="1.4" />
      <rect x="4" y="13.4" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.4" />
    </>
  ),
  key: (
    <>
      <circle cx="8.2" cy="15.8" r="3.6" />
      <path d="M10.8 13.2 19 5M16.4 7.6l2 2M14.2 9.8l1.6 1.6" />
    </>
  ),
  layers: <path d="M12 3.4 20.4 8 12 12.6 3.6 8zM3.6 12.6 12 17.2l8.4-4.6M3.6 16.8 12 21.4l8.4-4.6" />,
  lock: (
    <>
      <rect x="4.6" y="10.6" width="14.8" height="10" rx="2" />
      <path d="M8.2 10.6V8a3.8 3.8 0 0 1 7.6 0v2.6" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
  palette: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9c0 2.2-1.9 2.9-3.5 2.9h-1.2a2 2 0 0 0-1.5 3.3A1.9 1.9 0 0 1 12 21z" />
      <circle cx="7.8" cy="11" r="1" />
      <circle cx="9.6" cy="7.2" r="1" />
      <circle cx="14" cy="6.6" r="1" />
    </>
  ),
  play: <path d="M9 6.6 18 12l-9 5.4z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: <path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8M20.4 4.2v4.4H16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.8" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7.2h7M15.2 7.2H20M4 16.8h4.4M12.8 16.8H20" />
      <circle cx="13.2" cy="7.2" r="2" />
      <circle cx="10.6" cy="16.8" r="2" />
    </>
  ),
  shield: <path d="M12 3.2 19 6v6.1c0 4-2.9 7.1-7 8.7-4.1-1.6-7-4.7-7-8.7V6z M8.8 11.8l2.2 2.2 4.2-4.4" />,
  spark: <path d="M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4-5.4-1.9 5.4-1.9zM18.6 16.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />,
  terminal: (
    <>
      <rect x="3" y="4.4" width="18" height="15.2" rx="2.2" />
      <path d="M7.2 9.4 10.4 12l-3.2 2.6M12.4 15h4.4" />
    </>
  ),
  trash: <path d="M4.2 7h15.6M9.4 7V4.8h5.2V7M6.4 7l.9 13.2h9.4L17.6 7M10.2 11v5.6M13.8 11v5.6" />,
  users: (
    <>
      <circle cx="9.2" cy="8" r="3.3" />
      <path d="M3.6 20a5.6 5.6 0 0 1 11.2 0M16 5.4a3 3 0 0 1 0 5.7M17.2 14.6a5 5 0 0 1 3.2 4.6" />
    </>
  ),
  webhook: (
    <>
      <circle cx="6.2" cy="17.6" r="2.3" />
      <circle cx="17.8" cy="17.6" r="2.3" />
      <circle cx="12" cy="6.4" r="2.3" />
      <path d="M8.2 16.4 10.7 12M15.8 16.4 13.3 12M12 8.7v1.9" />
    </>
  ),
  zap: <path d="M13.4 2.8 5.6 13.6h5.2l-1.2 7.6 8-11.2h-5.4z" />,
};

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
