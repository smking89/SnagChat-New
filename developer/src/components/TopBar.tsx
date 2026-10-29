import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../lib/router";
import { Icon, type IconName } from "./Icon";
import { Pill, Kbd, cn } from "./ui";
import { SEARCH_SHORTCUT } from "../lib/platform";

const PRODUCTS: Array<{ label: string; hint: string; to: string; icon: IconName }> = [
  { label: "REST API", hint: "v1 · snags, clips, squads", to: "/docs/api/create-snag", icon: "code" },
  { label: "Webhooks", hint: "Signed events + replay", to: "/console/apps/night-shift-ingest/webhooks", icon: "webhook" },
  { label: "Game catalogue", hint: "Claim a title", to: "/console/catalogue", icon: "gamepad" },
  { label: "Embeds", hint: "A snag, anywhere", to: "/console/embeds", icon: "box" },
];

export function TopBar({
  variant = "public",
  onSearch,
}: {
  variant?: "public" | "console";
  onSearch: () => void;
}) {
  const [products, setProducts] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { path } = useRouter();

  useEffect(() => {
    if (!products) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setProducts(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [products]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="shell flex h-[68px] items-center gap-2">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md"
          aria-label="SnagChat Developers home"
        >
          <img
            src="/brand/snagchat-wordmark.png"
            alt="SnagChat"
            className="h-11 w-auto shrink-0"
          />
          <span className="h-5 w-px bg-line-strong" aria-hidden="true" />
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-muted">
            Developers
          </span>
        </Link>

        {variant === "public" ? (
          <nav className="ml-5 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setProducts((open) => !open)}
                aria-expanded={products}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface",
                  products && "bg-surface",
                )}
              >
                Products
                <Icon name="chevronDown" size={13} />
              </button>
              {products ? (
                <div className="animate-panel absolute left-0 top-[calc(100%+6px)] w-[262px] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-lift">
                  {PRODUCTS.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setProducts(false)}
                      className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-surface"
                    >
                      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-md bg-brand-soft text-brand">
                        <Icon name={item.icon} size={13} />
                      </span>
                      <span>
                        <span className="block text-[12px] font-semibold">{item.label}</span>
                        <span className="block text-[11px] text-muted">{item.hint}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link
              to="/docs/quickstart"
              className={cn(
                "inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface",
                path.startsWith("/docs") && "text-ink",
              )}
            >
              Docs
            </Link>
            <Link
              to="/console"
              className={cn(
                "inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface",
                path.startsWith("/console") && "text-ink",
              )}
            >
              Console
            </Link>
            <Link
              to="/status"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface",
                path === "/status" && "text-ink",
              )}
            >
              Status
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
            </Link>
          </nav>
        ) : (
          <nav className="ml-5 hidden items-center gap-0.5 lg:flex" aria-label="Console">
            <Link
              to="/docs/quickstart"
              className="inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-surface"
            >
              Docs
            </Link>
            <Link
              to="/console"
              className="inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-surface"
            >
              Console
            </Link>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSearch}
            className="hidden h-8 items-center gap-2 rounded-lg border border-line bg-white pl-2.5 pr-2 text-[12px] text-faint transition-colors hover:border-line-strong hover:text-muted md:flex"
          >
            <Icon name="search" size={14} />
            <span className="mr-6">Search</span>
            <Kbd>{SEARCH_SHORTCUT}</Kbd>
          </button>
          <button
            type="button"
            onClick={onSearch}
            aria-label="Search the portal"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface md:hidden"
          >
            <Icon name="search" size={16} />
          </button>

          <Link
            to="/status"
            className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[10.5px] font-semibold text-muted transition-colors hover:border-line-strong xl:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            All systems normal
          </Link>

          {variant === "public" ? (
            <>
              <Link
                to="/signin"
                className="hidden h-8 items-center rounded-md px-2.5 text-[12.5px] font-semibold text-ink-soft hover:bg-surface sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/signin"
                className="inline-flex h-8 items-center rounded-lg border border-ink bg-ink px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#2b3038]"
              >
                Get a test key
                <Icon name="arrowRight" size={13} />
              </Link>
            </>
          ) : (
            <>
              <Pill tone="neutral" className="hidden lg:inline-flex">
                Night Shift Studio
              </Pill>
              <Link
                to="/console/settings"
                aria-label="Account and organisation settings"
                className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-deep ring-1 ring-brand/20 transition-colors hover:bg-brand-soft/70"
              >
                KS
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
