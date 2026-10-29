import { Link } from "../lib/router";

const COLUMNS: Array<{
  title: string;
  links: Array<{ label: string; to: string; external?: boolean }>;
}> = [
  {
    title: "Platform",
    links: [
      { label: "API reference", to: "/docs/api/create-snag" },
      { label: "Webhooks", to: "/console/apps/night-shift-ingest/webhooks" },
      { label: "Changelog", to: "/changelog" },
      { label: "Status", to: "/status" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "For studios", to: "/docs/quickstart" },
      { label: "Game catalogue", to: "/console/catalogue" },
      { label: "Embeds", to: "/console/embeds" },
      { label: "Guidelines", to: "/docs/guidelines" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "SnagChat", to: "https://snagchat.io", external: true },
      { label: "Advertise", to: "https://advertise.snagchat.io", external: true },
      { label: "Terms", to: "/legal/terms" },
      { label: "Privacy", to: "/legal/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="shell py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src="/brand/snagchat-wordmark.png" alt="SnagChat" className="h-8 w-auto shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
                Developers
              </span>
            </Link>
            <p className="mt-3 max-w-[34ch] text-[12.5px] leading-relaxed text-muted">
              The API and the catalogue behind the feed. Built in the open, priced in public.
            </p>
            <Link
              to="/status"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[10.5px] font-semibold text-muted transition-colors hover:border-line-strong"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              All systems normal
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-faint">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.to}
                        className="inline-flex items-center gap-1 text-[12.5px] text-ink-soft transition-colors hover:text-brand"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-[12.5px] text-ink-soft transition-colors hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11px] text-faint">
          <p>© 2026 SnagChat. All rights reserved.</p>
          <p className="font-mono">developer.snagchat.io · api.snagchat.io</p>
        </div>
      </div>
    </footer>
  );
}
