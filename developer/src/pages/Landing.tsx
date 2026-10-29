import { useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { Footer } from "../components/Footer";
import { Icon, type IconName } from "../components/Icon";
import { TopBar } from "../components/TopBar";
import { Eyebrow, InlineCode, buttonClass } from "../components/ui";
import { LANDING_REQUEST, LIMITS, QUICKSTART_CURL } from "../data/portal";
import { usePortal } from "../lib/portal";
import { Link } from "../lib/router";

const PATHS: Array<{
  audience: string;
  title: string;
  body: string;
  icon: IconName;
  bullets: string[];
  cta: string;
  to: string;
}> = [
  {
    audience: "For studios",
    title: "Ship your title, then ship the clips.",
    body: "Claim your game, upload artwork that survives every surface, and post from your capture pipeline with the feed preview in front of you.",
    icon: "gamepad",
    bullets: ["Verified title + aliases", "Logo checks on light and dark", "Official channel tokens"],
    cta: "Start with studios",
    to: "/console",
  },
  {
    audience: "For builders",
    title: "Read the feed, post to squads, react to events.",
    body: "Scoped keys, player OAuth, signed webhooks with replay, and a request log you can quote in a support ticket.",
    icon: "terminal",
    bullets: ["REST + signed webhooks", "Test and live kept apart", "Replay any delivery"],
    cta: "Start with builders",
    to: "/docs/api/create-snag",
  },
];

const SHOWCASE: Array<{
  title: string;
  body: string;
  icon: IconName;
  visual: "card" | "webhook" | "embed";
}> = [
  {
    title: "Clip ingest",
    body: "Sixty-second uploads straight from a capture pipeline, with the poster frame handled for you.",
    icon: "play",
    visual: "card",
  },
  {
    title: "Squad bots",
    body: "Read a gallery, post highlights, and keep a tournament bracket moving without a second app.",
    icon: "webhook",
    visual: "webhook",
  },
  {
    title: "Embeds",
    body: "Drop a snag into a patch note, a wiki or a tournament page. Gating and credit travel with it.",
    icon: "box",
    visual: "embed",
  },
];

/** The catalogue the API resolves `game` against — real tiles, not wordmarks. */
const GAMES = [
  { name: "Rust", file: "rust" },
  { name: "Counter-Strike 2", file: "cs2" },
  { name: "Valorant", file: "valorant" },
  { name: "DayZ", file: "dayz" },
  { name: "ARK: Survival Ascended", file: "ark" },
  { name: "Palworld", file: "palworld" },
  { name: "Valheim", file: "valheim" },
  { name: "Satisfactory", file: "satisfactory" },
  { name: "SCUM", file: "scum" },
  { name: "7 Days to Die", file: "seven-days" },
  { name: "Unturned", file: "unturned" },
  { name: "Enshrouded", file: "enshrouded" },
  { name: "Minecraft", file: "minecraft" },
];

const STEPS = [
  {
    title: "Create an app",
    body: "Name it, pick a path, get a test environment in seconds.",
  },
  {
    title: "Copy the test key",
    body: "Shown once, scoped to what you asked for, never touching live data.",
  },
  {
    title: "Post a clip",
    body: "One request. The response carries the post id and its gate state.",
  },
  {
    title: "Listen for events",
    body: "Add an endpoint, send a test event, replay anything that fails.",
  },
];

export function Landing({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar onSearch={onSearch} />
      <main>
        <Hero />
        <Paths />
        <CatalogueBelt />
        <Showcase />
        <Quickstart />
        <Limits />
        <ClosingBand />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  const { toast } = usePortal();
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      toast("201 Created", "req_7f31c8a2 · 128ms · sng_8f21c", "success");
    }, 650);
  };

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="dotgrid pointer-events-none absolute inset-x-0 top-0 h-[280px] opacity-40"
        style={{ maskImage: "linear-gradient(to bottom, black, transparent)" }}
        aria-hidden="true"
      />
      <div className="shell relative grid grid-cols-1 gap-12 pb-16 pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="animate-rise">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-brand" />
            <Eyebrow>Developer platform</Eyebrow>
          </div>
          <h1 className="mt-4 max-w-[15ch] font-display text-[40px] font-extrabold leading-[0.97] tracking-[-0.045em] sm:text-[54px] lg:text-[60px]">
            Put your game, your art or your bot inside SnagChat
            <span className="text-brand">.</span>
          </h1>
          <p className="mt-5 max-w-[50ch] text-[14.5px] leading-relaxed text-muted sm:text-[15.5px]">
            One API, one game catalogue, every surface of the feed. Post clips from your pipeline,
            read the timeline, and listen for the moments that matter.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Link to="/console" className={buttonClass("primary", "md", "h-10 px-4 text-[13px]")}>
              Get a test key
              <Icon name="arrowRight" size={15} />
            </Link>
            <Link to="/docs/api/create-snag" className={buttonClass("secondary", "md", "h-10 px-4 text-[13px]")}>
              <Icon name="book" size={15} />
              Read the API
            </Link>
          </div>
          <p className="mt-3 text-[11.5px] text-faint">
            No card. No sales call. Test keys are instant and never touch live data.
          </p>

          <dl className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[11.5px]">
            {[
              ["60s", "clip cap"],
              ["13", "titles claimable"],
              ["4", "regions"],
              ["1", "catalogue"],
            ].map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dt className="font-display text-[14px] font-extrabold tracking-[-0.02em]">{value}</dt>
                <dd className="text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-rise [animation-delay:80ms]">
          <div className="absolute -inset-8 -z-10 rounded-[36px] brand-glow" aria-hidden="true" />
          <div className="overflow-hidden rounded-2xl border border-code-line bg-code shadow-lift">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-2 font-mono text-[11.5px]">
                <span className="text-white/35">POST</span>
                <span className="text-white/90">/v1/snags</span>
              </div>
              <span className="rounded-full bg-[#1f8a4c]/20 px-2 py-[3px] font-mono text-[10px] font-semibold text-[#74e0a4]">
                201 Created
              </span>
            </div>
            <pre className="scroll-thin overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.85] text-white/70">
              {LANDING_REQUEST}
            </pre>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5">
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                sandbox · 128ms
              </span>
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                <Icon name="play" size={11} />
                {running ? "Sending…" : "Run this"}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="font-mono text-[10.5px] text-faint">api.snagchat.io · v1</span>
            <span className="flex items-center gap-1.5 text-[10.5px] text-muted">
              <Icon name="shield" size={14} className="text-brand" />
              Signed requests, scoped keys
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Paths() {
  return (
    <section className="shell py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Eyebrow>Pick a path</Eyebrow>
          <h2 className="mt-2 max-w-[18ch] font-display text-[28px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[34px]">
            Two ways in, one platform.
          </h2>
        </div>
        <p className="max-w-[44ch] text-[12.5px] leading-relaxed text-muted">
          Start where you are. Every path ends in the same console, the same logs and the same
          review rules — no second account, no separate contract.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {PATHS.map((path) => (
          <Link
            key={path.audience}
            to={path.to}
            className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_36px_-24px_rgba(148,0,211,0.45)]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon name={path.icon} size={17} />
            </span>
            <p className="mt-4 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-faint">
              {path.audience}
            </p>
            <h3 className="mt-1.5 font-display text-[18px] font-extrabold leading-[1.15] tracking-[-0.03em]">
              {path.title}
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{path.body}</p>
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
              {path.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-1.5 text-[11.5px] text-ink-soft">
                  <Icon name="check" size={13} className="mt-[1px] shrink-0 text-brand" />
                  {bullet}
                </li>
              ))}
            </ul>
            <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[12px] font-semibold text-ink transition-colors group-hover:text-brand">
              {path.cta}
              <Icon
                name="arrowRight"
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CatalogueBelt() {
  return (
    <section className="border-y border-line bg-white">
      <div className="shell flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-faint">
          The catalogue
        </p>
        <ul className="flex flex-wrap items-center gap-2">
          {GAMES.map((game) => (
            <li key={game.file}>
              <img
                src={`/games/${game.file}.png`}
                alt={game.name}
                title={game.name}
                loading="lazy"
                className="h-8 w-8 rounded-[9px] shadow-[0_1px_2px_rgba(23,25,29,0.16)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5"
              />
            </li>
          ))}
        </ul>
        <p className="ml-auto hidden text-[11.5px] text-muted lg:block">
          {GAMES.length} titles, claimable · aliases resolve
        </p>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="border-y border-line bg-surface-2 py-14 lg:py-20">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>What you can build</Eyebrow>
            <h2 className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.04em] sm:text-[34px]">
              Built for the feed, not the dashboard.
            </h2>
          </div>
          <Link
            to="/docs/api/create-snag"
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink hover:text-brand"
          >
            Explore the reference
            <Icon name="arrowUpRight" size={14} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SHOWCASE.map((item) => (
            <article
              key={item.title}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-white"
            >
              <div className="relative flex h-[176px] items-center justify-center overflow-hidden bg-surface px-4">
                <Visual kind={item.visual} />
              </div>
              <div className="flex flex-1 flex-col border-t border-line p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <h3 className="text-[13.5px] font-semibold">{item.title}</h3>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Visual({ kind }: { kind: "card" | "webhook" | "embed" }) {
  if (kind === "card") {
    return (
      <div className="flex items-end gap-2">
        <div className="w-[104px] -rotate-3 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
          <img src="/snags/summit.jpg" alt="" className="aspect-[4/5] w-full object-cover" />
          <div className="flex items-center gap-1 px-1.5 py-1">
            <img src="/games/valheim.png" alt="" className="h-3.5 w-3.5 rounded-[3px]" />
            <span className="truncate text-[8px] font-semibold text-ink-soft">Summit run</span>
          </div>
        </div>
        <div className="w-[112px] overflow-hidden rounded-lg border border-line bg-white shadow-md">
          <img src="/snags/rig.jpg" alt="" className="aspect-[4/5] w-full object-cover" />
          <div className="flex items-center gap-1 px-1.5 py-1">
            <img src="/games/rust.png" alt="" className="h-3.5 w-3.5 rounded-[3px]" />
            <span className="truncate text-[8px] font-semibold text-ink-soft">2am wipe</span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "webhook") {
    return (
      <div className="w-full max-w-[200px] overflow-hidden rounded-lg border border-code-line bg-code">
        <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-1.5">
          <span className="font-mono text-[8.5px] text-white/40">webhook</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
        </div>
        <div className="space-y-1 px-2.5 py-2 font-mono text-[8.5px]">
          {[
            ["snag.created", "200", "412ms"],
            ["snag.engaged", "200", "96ms"],
            ["snag.gated", "200", "388ms"],
          ].map(([event, status, ms]) => (
            <div key={event} className="flex items-center justify-between gap-2">
              <span className="text-white/70">{event}</span>
              <span className="flex items-center gap-1.5 text-white/35">
                <span className="text-[#74e0a4]">{status}</span>
                {ms}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[210px] overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="relative">
        <img src="/snags/neon-district.jpg" alt="" className="aspect-[16/9] w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-ink/20">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink">
            <Icon name="play" size={12} />
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="text-[8px] font-semibold text-ink-soft">Watch on SnagChat</span>
        <span className="font-mono text-[7.5px] text-faint">snagchat.io</span>
      </div>
    </div>
  );
}

function Quickstart() {
  return (
    <section className="shell py-14 lg:py-20">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        <div>
          <Eyebrow>Quickstart</Eyebrow>
          <h2 className="mt-2 max-w-[16ch] font-display text-[28px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[34px]">
            From nothing to a post in four steps.
          </h2>
          <p className="mt-3 max-w-[46ch] text-[12.5px] leading-relaxed text-muted">
            The console keeps this checklist on your overview until every step is done. Nothing is
            hidden behind a sales call.
          </p>

          <ol className="mt-7 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-white font-mono text-[10.5px] font-bold text-ink-soft">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            to="/console"
            className="mt-6 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:text-brand-deep"
          >
            Open the console
            <Icon name="arrowRight" size={13} />
          </Link>
        </div>

        <div>
          <CodeBlock code={QUICKSTART_CURL} filename="terminal" />
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <Icon name="terminal" size={14} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-[11.5px] leading-relaxed text-muted">
              A test key is <InlineCode>sk_test_</InlineCode> and only ever sees sandbox data. Live
              keys need a re-authentication, so a pasted snippet can never ship to production by
              accident.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Limits() {
  return (
    <section className="border-y border-line bg-surface-2 py-14 lg:py-20">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>The numbers</Eyebrow>
            <h2 className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.04em] sm:text-[34px]">
              Limits before you sign up.
            </h2>
          </div>
          <p className="max-w-[40ch] text-[12px] leading-relaxed text-muted">
            Enforced by the API, not just written down. If a limit changes, the changelog says so
            first.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1].map((column) => (
            <dl key={column} className="overflow-hidden rounded-xl border border-line bg-white">
              {LIMITS.slice(column * 4, column * 4 + 4).map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line px-4 py-2.5 last:border-b-0"
                >
                  <dt className="text-[11.5px] text-muted">{item.label}</dt>
                  <dd className="num text-right font-mono text-[11px] font-medium text-ink-soft">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingBand() {
  return (
    <section className="shell py-14 lg:py-20">
      <div className="relative overflow-hidden rounded-2xl border border-brand/15 bg-brand-tint px-6 py-10 sm:px-10">
        <div
          className="dotgrid pointer-events-none absolute inset-0 opacity-50"
          style={{ maskImage: "linear-gradient(110deg, black, transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-px w-6 bg-brand" />
              <Eyebrow>Ready when you are</Eyebrow>
            </div>
            <h2 className="mt-3 max-w-[18ch] font-display text-[30px] font-extrabold leading-[1] tracking-[-0.04em] sm:text-[38px]">
              Ship something the feed remembers.
            </h2>
            <p className="mt-2.5 max-w-[48ch] text-[12.5px] leading-relaxed text-muted">
              Spin up an app, post a clip, receive the event. The whole loop is under five minutes
              on a test key.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/console" className={buttonClass("primary", "md", "h-10 px-4 text-[13px]")}>
              Create a test app
              <Icon name="arrowRight" size={14} />
            </Link>
            <Link
              to="/docs/api/create-snag"
              className={buttonClass("secondary", "md", "h-10 px-4 text-[13px]")}
            >
              Read the reference
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
