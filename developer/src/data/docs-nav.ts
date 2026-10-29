export type DocsNavItem = { label: string; to: string };
export type DocsNavGroup = { title: string; items: DocsNavItem[] };

export const DOCS_NAV: DocsNavGroup[] = [
  {
    title: "Start",
    items: [
      { label: "Quickstart", to: "/docs/quickstart" },
      { label: "Authentication", to: "/docs/authentication" },
      { label: "Errors", to: "/docs/errors" },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "Ingest a clip", to: "/docs/guides/ingest-a-clip" },
      { label: "Post to a squad", to: "/docs/guides/post-to-a-squad" },
      { label: "Receive webhooks", to: "/docs/guides/receive-webhooks" },
      { label: "Rotate a key", to: "/docs/guides/rotate-a-key" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "API reference", to: "/docs/api/create-snag" },
      { label: "Clips", to: "/docs/api/upload-clip" },
      { label: "Squads", to: "/docs/api/list-squads" },
      { label: "Games", to: "/docs/reference/games" },
    ],
  },
  {
    title: "Policies",
    items: [
      { label: "Guidelines", to: "/docs/guidelines" },
      { label: "Rate limits", to: "/docs/rate-limits" },
      { label: "Changelog", to: "/changelog" },
    ],
  },
];
