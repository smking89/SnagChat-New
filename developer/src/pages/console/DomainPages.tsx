import { useMemo, useState } from "react";
import { CodeBlock } from "../../components/CodeBlock";
import { Icon } from "../../components/Icon";
import { FauxToggle, PageHead } from "../../components/console-page";
import { Button, InlineCode, Panel, PanelHead, Pill, cn } from "../../components/ui";
import { usePortal } from "../../lib/portal";
import { Link } from "../../lib/router";
import { ConsoleLayout, EnvNotice } from "./ConsoleLayout";

type GameTile = {
  name: string;
  file: string;
  hashtag: string;
  status: "claimed" | "review" | "open";
  aliases: string[];
};

const GAMES: GameTile[] = [
  { name: "Rust", file: "rust", hashtag: "#rust", status: "claimed", aliases: ["rust", "rustconsole"] },
  { name: "Counter-Strike 2", file: "cs2", hashtag: "#cs2", status: "open", aliases: ["cs2", "counterstrike"] },
  { name: "Valorant", file: "valorant", hashtag: "#valorant", status: "open", aliases: ["valorant", "val"] },
  { name: "DayZ", file: "dayz", hashtag: "#dayz", status: "review", aliases: ["dayz", "dayzsa"] },
  { name: "ARK: Survival Ascended", file: "ark", hashtag: "#ark", status: "open", aliases: ["ark", "arksa"] },
  { name: "Palworld", file: "palworld", hashtag: "#palworld", status: "open", aliases: ["palworld"] },
  { name: "Valheim", file: "valheim", hashtag: "#valheim", status: "open", aliases: ["valheim"] },
  { name: "Satisfactory", file: "satisfactory", hashtag: "#satisfactory", status: "open", aliases: ["satisfactory"] },
  { name: "SCUM", file: "scum", hashtag: "#scum", status: "open", aliases: ["scum"] },
  { name: "7 Days to Die", file: "seven-days", hashtag: "#7dtd", status: "open", aliases: ["7dtd", "sevendaystodie"] },
  { name: "Unturned", file: "unturned", hashtag: "#unturned", status: "open", aliases: ["unturned"] },
  { name: "Enshrouded", file: "enshrouded", hashtag: "#enshrouded", status: "open", aliases: ["enshrouded"] },
  { name: "Minecraft", file: "minecraft", hashtag: "#minecraft", status: "open", aliases: ["minecraft", "mc"] },
];

const STATUS_COPY: Record<GameTile["status"], { label: string; tone: "success" | "warn" | "neutral" }> = {
  claimed: { label: "Claimed", tone: "success" },
  review: { label: "In review", tone: "warn" },
  open: { label: "Unclaimed", tone: "neutral" },
};

export function CataloguePage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [games, setGames] = useState(GAMES);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(GAMES[0]!);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return games;
    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(needle) ||
        game.hashtag.includes(needle) ||
        game.aliases.some((alias) => alias.includes(needle)),
    );
  }, [games, query]);

  const claim = (game: GameTile) => {
    setGames((current) =>
      current.map((item) => (item.name === game.name ? { ...item, status: "review" } : item)),
    );
    setSelected({ ...game, status: "review" });
    toast("Claim submitted", `${game.name} · review usually takes two working days`);
  };

  return (
    <ConsoleLayout active="catalogue" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Domain"
        title="Game catalogue"
        description="One title per row, one owner per title. Claim the game you represent, add the aliases players actually type, and the API resolves all of them to the same id."
      >
        <Link to="/docs/reference/games" className="text-[11.5px] font-semibold text-brand hover:text-brand-deep">
          Catalogue reference
        </Link>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_318px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Search the catalogue</span>
              <Icon
                name="search"
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a title or alias"
                className="h-9 w-full rounded-lg border border-line bg-white pl-8 pr-2.5 text-[12px] outline-none transition-colors placeholder:text-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <Pill tone="neutral">{visible.length} titles</Pill>
            <Pill tone="success" dot>
              1 claimed
            </Pill>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((game) => {
              const status = STATUS_COPY[game.status];
              return (
                <button
                  key={game.name}
                  type="button"
                  onClick={() => setSelected(game)}
                  aria-pressed={selected.name === game.name}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border bg-white p-3 text-left transition-colors",
                    selected.name === game.name
                      ? "border-brand/40 ring-2 ring-brand/10"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <img
                    src={`/games/${game.file}.png`}
                    alt=""
                    className="h-9 w-9 rounded-lg ring-1 ring-black/5"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[11.5px] font-semibold leading-tight">
                      {game.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[9.5px] text-faint">{game.hashtag}</span>
                  </span>
                  <Pill tone={status.tone}>{status.label}</Pill>
                </button>
              );
            })}
          </div>
        </div>

        <Panel className="overflow-hidden self-start">
          <PanelHead title="Title" hint={`game_${selected.file}`} />
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <img
                src={`/games/${selected.file}.png`}
                alt=""
                className="h-12 w-12 rounded-xl ring-1 ring-black/5"
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{selected.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-faint">{selected.hashtag}</p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-line text-[11.5px]">
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-muted">Owner</dt>
                <dd className="font-medium">
                  {selected.status === "claimed" ? "Night Shift Studio" : "Unclaimed"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-muted">Aliases</dt>
                <dd className="flex flex-wrap justify-end gap-1">
                  {selected.aliases.map((alias) => (
                    <span key={alias} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[9.5px]">
                      {alias}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-muted">Artwork</dt>
                <dd className="text-ink-soft">512 × 512 · light + dark</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Pill tone={STATUS_COPY[selected.status].tone}>
                    {STATUS_COPY[selected.status].label}
                  </Pill>
                </dd>
              </div>
            </dl>

            {selected.status === "open" ? (
              <Button
                variant="primary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => claim(selected)}
              >
                Claim {selected.name}
              </Button>
            ) : (
              <p className="mt-3 rounded-lg bg-surface px-2.5 py-2 text-[10.5px] leading-relaxed text-muted">
                {selected.status === "claimed"
                  ? "You own this title. Studio keys can post with the verified badge."
                  : "Claim is with the catalogue team. You will be emailed when it is decided."}
              </p>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-faint">
              Claims are checked against the studio's public domain, so keep the support email on the
              same domain.
            </p>
          </div>
        </Panel>
      </div>
    </ConsoleLayout>
  );
}

const TRACE = [
  {
    step: "Retrieval",
    detail: "3 sources · 128 candidates",
    rows: [
      ["Following graph", "42%", "You follow @masonr"],
      ["Squad gallery", "31%", "Current squad · Rust"],
      ["Co-engagement", "27%", "Shared 6 clips this week"],
    ],
  },
  {
    step: "Light rank",
    detail: "Cheap pass before the expensive one",
    rows: [
      ["Recency", "0.41", "Posted 12 minutes ago"],
      ["Affinity", "0.33", "You watched 4 of 6"],
      ["Engagement velocity", "0.19", "Likes per minute"],
      ["Diversity", "0.07", "No repeat from the last 6"],
    ],
  },
  {
    step: "Heavy rank",
    detail: "Action prices, not a black box",
    rows: [
      ["Watch", "1.00", "Base"],
      ["Like", "0.62", "Costs more than a watch"],
      ["Share", "0.84", "Highest intent"],
      ["Skip", "−1.20", "Punishes the post"],
    ],
  },
  {
    step: "Gate",
    detail: "Checked before ranking, returned in the response",
    rows: [
      ["Decision", "allowed", "No held hashtags"],
      ["Sponsor slot", "none", "No campaign in this slot"],
      ["Diversity penalty", "0.00", "Rust is under the cap"],
    ],
  },
];

export function InspectorPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [snag, setSnag] = useState("sng_8f21c");
  const [run, setRun] = useState(0);

  return (
    <ConsoleLayout active="inspector" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Domain"
        title="Feed inspector"
        description="Why a post ranked where it did, in the order the engine decided it. Read-only, and the same trace the API returns to you on request."
      >
        <Pill tone="neutral">Read-only</Pill>
      </PageHead>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Snag id</span>
          <input
            value={snag}
            onChange={(event) => setSnag(event.target.value)}
            className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 font-mono text-[11.5px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
          />
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setRun((value) => value + 1);
            toast("Trace updated", `${snag} · inspected just now`);
          }}
        >
          <Icon name="activity" size={13} />
          Inspect
        </Button>
        <p className="pb-1.5 text-[10.5px] text-faint">
          Traces are kept for 7 days{run > 0 ? " · refreshed just now" : ""}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {TRACE.map((block, index) => (
            <Panel key={block.step} className="overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft font-mono text-[9.5px] font-bold text-brand-deep">
                  {index + 1}
                </span>
                <h3 className="text-[12.5px] font-semibold">{block.step}</h3>
                <p className="text-[10.5px] text-faint">{block.detail}</p>
              </div>
              <ul className="divide-y divide-line">
                {block.rows.map(([label, value, note]) => (
                  <li key={label} className="flex items-baseline gap-3 px-4 py-2 text-[11.5px]">
                    <span className="w-[140px] shrink-0 text-muted">{label}</span>
                    <span className="w-[74px] shrink-0 font-mono text-[10.5px] text-ink">{value}</span>
                    <span className="min-w-0 flex-1 truncate text-[10.5px] text-faint">{note}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Verdict" hint="sng_8f21c" />
            <div className="px-4 py-3">
              <div className="rounded-lg bg-[linear-gradient(120deg,#9400d3,#5b21b6)] p-[1px]">
                <div className="rounded-[7px] bg-white px-3 py-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint">Ranked</p>
                  <p className="mt-0.5 font-display text-[20px] font-extrabold leading-none">#3</p>
                  <p className="mt-1 text-[10.5px] text-muted">in For You · Rust</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Allowed by the gate, so it entered ranking. It lost two slots to fresher posts from the
                same squad and gained one back on share intent.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="What the engine sees" />
            <ul className="space-y-2 px-4 py-3 text-[11px] text-muted">
              <li className="flex justify-between gap-3">
                <span>Author</span>
                <span className="font-mono text-[10.5px] text-ink-soft">@masonr</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Game</span>
                <span className="text-ink-soft">Rust</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Region</span>
                <span className="text-ink-soft">EU</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Gate</span>
                <span className="text-ink-soft">allowed</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Visibility</span>
                <span className="text-ink-soft">public</span>
              </li>
            </ul>
            <p className="border-t border-line px-4 py-3 text-[10.5px] leading-relaxed text-faint">
              Traces never include other players' identities beyond a handle you already follow.
            </p>
          </Panel>
        </div>
      </div>
    </ConsoleLayout>
  );
}

export function EmbedsPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [width, setWidth] = useState(420);
  const [autoplay, setAutoplay] = useState(false);
  const [snippet, setSnippet] = useState(
    `<iframe
  src="https://embed.snagchat.io/sng_8f21c?theme=dark"
  width="420"
  height="520"
  loading="lazy"
  allow="clipboard-write"
  style="border:0;border-radius:12px"
></iframe>`,
  );

  const build = () => {
    setSnippet(
      `<iframe
  src="https://embed.snagchat.io/sng_8f21c?theme=${theme}&autoplay=${autoplay ? 1 : 0}"
  width="${width}"
  height="${Math.round(width * 1.24)}"
  loading="lazy"
  allow="clipboard-write"
  style="border:0;border-radius:12px"
></iframe>`,
    );
    toast("Embed updated", `${width}px · ${theme}${autoplay ? " · autoplay" : ""}`);
  };

  return (
    <ConsoleLayout active="embeds" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Domain"
        title="Embed builder"
        description="Put one snag on a patch note, a wiki or a tournament page. Gating and credit travel with it, so a held post cannot be embedded."
      >
        <Button variant="secondary" size="sm" onClick={build}>
          <Icon name="refresh" size={13} />
          Apply
        </Button>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel>
          <PanelHead title="Configuration" hint="sng_8f21c" />
          <div className="space-y-4 px-4 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Theme</p>
              <div className="mt-1.5 flex gap-1.5">
                {(["light", "dark"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    aria-pressed={theme === option}
                    className={cn(
                      "h-8 flex-1 rounded-lg border text-[11.5px] font-semibold capitalize transition-colors",
                      theme === option
                        ? "border-brand/30 bg-brand-soft/60 text-ink"
                        : "border-line text-muted hover:border-line-strong",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                Width (px)
              </span>
              <input
                type="number"
                min={280}
                max={720}
                step={20}
                value={width}
                onChange={(event) => setWidth(Math.min(720, Math.max(280, Number(event.target.value) || 280)))}
                className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 font-mono text-[11.5px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-ink-soft">Autoplay muted</span>
              <FauxToggle on={autoplay} label="Autoplay" onChange={setAutoplay} />
            </label>

            <p className="rounded-lg bg-surface px-2.5 py-2 text-[10.5px] leading-relaxed text-muted">
              Height is computed at 124% of width so the caption never clips. Autoplay is muted and
              paused when off-screen.
            </p>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Preview" hint="Rendered at the configured size" />
            <div className="flex justify-center bg-surface-2 px-4 py-6">
              <div
                className={cn(
                  "w-full overflow-hidden rounded-xl border",
                  theme === "dark" ? "border-code-line bg-code" : "border-line bg-white",
                )}
                style={{ maxWidth: width }}
              >
                <div className="relative">
                  <img src="/snags/neon-district.jpg" alt="" className="aspect-[4/5] w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-ink/25">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink">
                      <Icon name="play" size={16} />
                    </span>
                  </span>
                  <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-[3px] text-[9px] font-bold text-white">
                    Rust
                  </span>
                </div>
                <div className={cn("flex items-center gap-2 px-3 py-2.5", theme === "dark" && "text-white/80")}>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">
                    M
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold">Solo wipe at 2am</span>
                    <span className={cn("block text-[9.5px]", theme === "dark" ? "text-white/45" : "text-muted")}>
                      @masonr · 12m
                    </span>
                  </span>
                  <span className={cn("text-[9.5px]", theme === "dark" ? "text-white/35" : "text-faint")}>
                    snagchat.io
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          <CodeBlock code={snippet} filename="embed.html" />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(snippet);
                  toast("Snippet copied", "Paste it into your page");
                } catch {
                  toast("Could not copy", "Your browser blocked clipboard access.");
                }
              }}
            >
              <Icon name="copy" size={13} />
              Copy snippet
            </Button>
            <p className="text-[10.5px] text-muted">
              Gated snags return <InlineCode>403</InlineCode> to the frame, never a blank card.
            </p>
          </div>
        </div>
      </div>
    </ConsoleLayout>
  );
}
