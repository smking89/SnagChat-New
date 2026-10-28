import { useState } from "react";
import { Icon } from "./Icon";
import { Nameplate } from "./FrameArt";
import { Screen, ScreenHeader } from "./Screen";

export type AdvertiseScreenProps = {
  onClose: () => void;
  onToast: (text: string, detail?: string) => void;
};

type Placement = "feed" | "story" | "nameplate";
type Cta = (typeof CTAS)[number];

const CTAS = ["Shop now", "Play now", "Learn more", "Join squad"] as const;

const PLACEMENTS: { id: Placement; label: string; cpm: number; blurb: string }[] = [
  { id: "feed", label: "Feed card", cpm: 8, blurb: "A 4:5 card in the For You feed, always labelled Ad." },
  { id: "story", label: "Story", cpm: 12, blurb: "Full-height between the clips people tap through." },
  { id: "nameplate", label: "Nameplate takeover", cpm: 6, blurb: "Your brand frame around a name in squad chat." },
];

const ARTWORK = [
  { src: "/snags/rig.jpg", label: "Rig" },
  { src: "/snags/neon-district.jpg", label: "Neon" },
  { src: "/snags/summit.jpg", label: "Summit" },
  { src: "/snags/squad-room.jpg", label: "Squad" },
];

const GAMES = [
  "Call of Duty",
  "Rust",
  "Apex Legends",
  "DayZ",
  "Elden Ring",
  "Cyberpunk 2077",
  "Rocket League",
];

const CPM: Record<Placement, number> = {
  feed: PLACEMENTS[0]!.cpm,
  story: PLACEMENTS[1]!.cpm,
  nameplate: PLACEMENTS[2]!.cpm,
};

const REACH_SHARE = 0.62;

function estimate(budget: number, placement: Placement) {
  const cpm = CPM[placement];
  const impressions = Math.round((budget / cpm) * 1000);
  const reach = Math.round(impressions * REACH_SHARE);
  const frequency = reach > 0 ? impressions / reach : 0;
  return { impressions, reach, frequency, cpm };
}

function number(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function dollars(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FIELD =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand";

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">{children}</p>
  );
}

export function AdvertiseScreen({ onClose, onToast }: AdvertiseScreenProps) {
  const [brand, setBrand] = useState("PadTek Gaming");
  const [headline, setHeadline] = useState("Controller still warm. So is the queue.");
  const [subline, setSubline] = useState("New pro sticks, built for the 2am run.");
  const [cta, setCta] = useState<Cta>("Shop now");
  const [game, setGame] = useState(GAMES[0]!);
  const [art, setArt] = useState(ARTWORK[0]!.src);
  const [placement, setPlacement] = useState<Placement>("feed");
  const [budget, setBudget] = useState(2500);
  const [duration, setDuration] = useState(14);
  const [start, setStart] = useState(today);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{
    ref: string;
    placement: Placement;
    days: number;
    budget: number;
    impressions: number;
    reach: number;
    frequency: number;
    cpm: number;
  } | null>(null);

  const flight = estimate(budget, placement);
  const placementLabel = PLACEMENTS.find((entry) => entry.id === placement)?.label ?? "Feed card";

  const submit = () => {
    if (!brand.trim() || !headline.trim()) {
      setError("A brand name and a headline are required before review.");
      onToast("Campaign needs a brand and headline", "Both fields are required.");
      return;
    }

    setError("");
    const ref = `SNG-${4200 + Math.floor(Math.random() * 5700)}`;
    setSubmitted({
      ref,
      placement,
      days: duration,
      budget,
      ...flight,
    });
    onToast("Campaign submitted", `Ref ${ref} — in review at advertise.snagchat.io`);
  };

  const reset = () => {
    setSubmitted(null);
    setError("");
    setBudget(2500);
    setDuration(14);
    setPlacement("feed");
    setStart(today());
  };

  return (
    <Screen labelledBy="advertise-title" onClose={onClose}>
      <ScreenHeader
        title="Advertise on SnagChat"
        titleId="advertise-title"
        onBack={onClose}
        action={
          <span className="mr-1 hidden rounded-full border border-line px-2.5 py-1 text-[10px] font-bold tracking-[0.02em] text-muted sm:inline">
            advertise.snagchat.io
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1140px] px-4 py-6 sm:px-6 lg:py-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>SnagChat Media</Eyebrow>
              <h1 className="mt-2 max-w-[22ch] font-display text-[28px] font-extrabold leading-[0.98] tracking-[-0.04em] sm:text-[38px]">
                Put your game in front of the queue.
              </h1>
              <p className="mt-2 max-w-[56ch] text-[12.5px] leading-relaxed text-muted sm:text-[13.5px]">
                Buy space in the feed, between stories, or around a name in chat. Every placement is
                labelled, previewed before it ships, and measured.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10.5px] font-semibold text-[#4d535c]">
                Self-serve
              </span>
              <span className="rounded-full bg-brand-soft px-3 py-1.5 text-[10.5px] font-semibold text-brand">
                1-day review
              </span>
            </div>
          </div>

          {submitted ? (
            <div className="mt-7 rounded-2xl border border-line bg-white p-5 sm:p-7">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon name="check" size={23} strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">
                    In review
                  </p>
                  <h2 className="mt-1 font-display text-[21px] font-extrabold tracking-[-0.03em]">
                    Campaign submitted
                  </h2>
                  <p className="mt-1 text-[12px] text-muted">
                    Ref <span className="font-semibold text-ink">{submitted.ref}</span> ·{" "}
                    {placementLabel} · starts {start}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
                {[
                  ["Budget", dollars(submitted.budget)],
                  ["Est. impressions", number(submitted.impressions)],
                  ["Est. reach", number(submitted.reach)],
                  ["Flight", `${submitted.days} days`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-surface px-3 py-2.5">
                    <dt className="text-[9px] font-bold uppercase tracking-[0.13em] text-faint">
                      {label}
                    </dt>
                    <dd className="mt-1 font-display text-[15px] font-extrabold tracking-[-0.02em]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 rounded-xl border border-dashed border-line bg-brand-tint px-4 py-3 text-[11.5px] leading-relaxed text-[#4d535c]">
                <span className="font-semibold text-ink">Demo build.</span> Nothing was sent to an ad
                server and no card was charged. A live campaign would go to{" "}
                <span className="font-semibold">advertise.snagchat.io</span> for creative review, then
                be billed at the end of the flight.
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={reset}
                  className="h-10 rounded-full bg-brand px-5 text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  Build another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 rounded-full border border-line px-5 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                >
                  Back to SnagChat
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="min-w-0 space-y-5">
                {/* ------------------------------------------------- previews */}
                <section className="rounded-2xl border border-line bg-white p-4 sm:p-5" aria-labelledby="preview-h">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <Eyebrow>Live preview</Eyebrow>
                      <h2 id="preview-h" className="mt-1 font-display text-[17px] font-extrabold tracking-[-0.03em]">
                        All three placements
                      </h2>
                    </div>
                    <p className="text-[10.5px] text-faint">Updates as you type</p>
                  </div>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,215px)_minmax(0,150px)_minmax(0,1fr)] xl:items-start">
                    {/* Feed */}
                    <div>
                      <p className="mb-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-faint">
                        Feed card · 4:5
                      </p>
                      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                        <div className="relative aspect-[4/5]">
                          <img src={art} alt="" className="h-full w-full object-cover" draggable={false} />
                          <span className="absolute left-2.5 top-2.5 rounded-lg bg-brand/90 px-2 py-1 text-[9px] font-extrabold uppercase leading-none tracking-[0.1em] text-white backdrop-blur-sm">
                            Ad
                          </span>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080a0e]/92 via-[#080a0e]/45 to-transparent p-3 pt-12">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/85">
                              <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[8px] font-extrabold text-ink">
                                {brand.trim().charAt(0).toUpperCase() || "A"}
                              </span>
                              <span className="truncate">{brand.trim() || "Brand"}</span>
                            </div>
                            <p className="mt-1.5 line-clamp-3 font-display text-[13.5px] font-extrabold leading-[1.18] tracking-[-0.02em] text-white">
                              {headline.trim() || "Your headline appears here"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/70">
                              {subline.trim() || "A short supporting line."}
                            </p>
                            <span className="mt-2 inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[9.5px] font-bold text-ink">
                              {cta}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-[11.5px] font-bold">{game}</p>
                            <p className="text-[9.5px] text-faint">Sponsored · in feed</p>
                          </div>
                          <span className="rounded-full bg-brand-soft px-2 py-1 text-[8.5px] font-bold uppercase tracking-[0.08em] text-brand">
                            Ad
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Story */}
                    <div>
                      <p className="mb-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-faint">
                        Story · 9:16
                      </p>
                      <div className="mx-auto w-full max-w-[172px] rounded-[26px] border-[5px] border-ink bg-ink p-[3px]">
                        <div className="relative aspect-[9/16] overflow-hidden rounded-[19px]">
                          <img src={art} alt="" className="h-full w-full object-cover" draggable={false} />
                          <div className="absolute inset-x-0 top-0 flex gap-1 p-2">
                            <span className="h-0.5 flex-1 rounded-full bg-white/85" />
                            <span className="h-0.5 flex-1 rounded-full bg-white/30" />
                            <span className="h-0.5 flex-1 rounded-full bg-white/30" />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080a0e]/92 via-[#080a0e]/35 to-transparent p-2.5 pt-10">
                            <p className="line-clamp-2 text-[10.5px] font-bold leading-tight text-white">
                              {headline.trim() || "Your headline"}
                            </p>
                            <span className="mt-1.5 inline-flex h-5 items-center rounded-full bg-white px-2 text-[8.5px] font-bold text-ink">
                              {cta}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nameplate */}
                    <div className="sm:col-span-2 xl:col-span-1">
                      <p className="mb-2 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-faint">
                        Nameplate takeover
                      </p>
                      <div className="rounded-2xl bg-surface p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-extrabold text-white">
                            {brand.trim().charAt(0).toUpperCase() || "A"}
                          </span>
                          <div className="min-w-0">
                            <Nameplate
                              text={brand.trim() || "Brand"}
                              use={{ frameId: "plate-gold", effect: "pulse" }}
                              textClassName="text-[11.5px] font-bold text-ink"
                            />
                            <p className="mt-1 line-clamp-1 text-[10px] text-muted">
                              {headline.trim() || "Your headline"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2.5 rounded-xl bg-white px-2.5 py-2 ring-1 ring-line">
                          <p className="line-clamp-2 text-[10.5px] leading-snug text-[#4d535c]">
                            {subline.trim() || "A short supporting line."}
                          </p>
                          <span className="mt-1.5 inline-flex h-5 items-center rounded-full bg-brand px-2 text-[8.5px] font-bold text-white">
                            {cta}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-faint">
                        {PLACEMENTS.find((entry) => entry.id === "nameplate")?.blurb}
                      </p>
                    </div>
                  </div>
                </section>

                {/* ------------------------------------------------- creative */}
                <section className="rounded-2xl border border-line bg-white p-4 sm:p-5" aria-labelledby="creative-h">
                  <Eyebrow>Creative</Eyebrow>
                  <h2 id="creative-h" className="mt-1 font-display text-[17px] font-extrabold tracking-[-0.03em]">
                    What the feed sees
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ad-brand" className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">
                        Brand name
                      </label>
                      <input
                        id="ad-brand"
                        value={brand}
                        maxLength={28}
                        onChange={(event) => setBrand(event.target.value)}
                        placeholder="PadTek Gaming"
                        className={`${FIELD} mt-1`}
                      />
                    </div>
                    <div>
                      <label htmlFor="ad-game" className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">
                        Game
                      </label>
                      <select
                        id="ad-game"
                        value={game}
                        onChange={(event) => setGame(event.target.value)}
                        className={`${FIELD} mt-1`}
                      >
                        {GAMES.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <label htmlFor="ad-headline" className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">
                          Headline
                        </label>
                        <span className="text-[10px] tabular-nums text-faint">{headline.length}/60</span>
                      </div>
                      <input
                        id="ad-headline"
                        value={headline}
                        maxLength={60}
                        onChange={(event) => setHeadline(event.target.value)}
                        placeholder="Controller still warm. So is the queue."
                        className={`${FIELD} mt-1`}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <label htmlFor="ad-subline" className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">
                          Supporting line
                        </label>
                        <span className="text-[10px] tabular-nums text-faint">{subline.length}/80</span>
                      </div>
                      <input
                        id="ad-subline"
                        value={subline}
                        maxLength={80}
                        onChange={(event) => setSubline(event.target.value)}
                        placeholder="New pro sticks, built for the 2am run."
                        className={`${FIELD} mt-1`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">Call to action</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CTAS.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => setCta(entry)}
                          aria-pressed={cta === entry}
                          className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition-colors ${
                            cta === entry
                              ? "border-brand bg-brand text-white"
                              : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                          }`}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">Artwork</p>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {ARTWORK.map((entry) => (
                        <button
                          key={entry.src}
                          type="button"
                          onClick={() => setArt(entry.src)}
                          aria-pressed={art === entry.src}
                          aria-label={`Use ${entry.label} artwork`}
                          className={`relative overflow-hidden rounded-xl ring-2 transition-all ${
                            art === entry.src ? "ring-brand" : "ring-transparent hover:ring-line"
                          }`}
                        >
                          <img src={entry.src} alt="" className="h-14 w-full object-cover" draggable={false} />
                          <span className="absolute inset-x-0 bottom-0 bg-[#080a0e]/55 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.06em] text-white">
                            {entry.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* -------------------------------------------------- campaign */}
              <aside className="space-y-4 lg:sticky lg:top-4">
                <section className="rounded-2xl border border-line bg-white p-4 sm:p-5" aria-labelledby="campaign-h">
                  <Eyebrow>Campaign</Eyebrow>
                  <h2 id="campaign-h" className="mt-1 font-display text-[17px] font-extrabold tracking-[-0.03em]">
                    Build the flight
                  </h2>

                  <fieldset className="mt-4">
                    <legend className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">
                      Placement
                    </legend>
                    <div className="mt-2 grid gap-1.5">
                      {PLACEMENTS.map((entry) => (
                        <label
                          key={entry.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 transition-colors ${
                            placement === entry.id
                              ? "border-brand bg-brand-tint"
                              : "border-line hover:border-[#d8dce1]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="placement"
                            value={entry.id}
                            checked={placement === entry.id}
                            onChange={() => setPlacement(entry.id)}
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#9400d3]"
                          />
                          <span className="min-w-0">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-[12px] font-semibold text-ink">{entry.label}</span>
                              <span className="text-[10px] font-semibold text-faint">
                                ${entry.cpm} CPM
                              </span>
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-snug text-muted">
                              {entry.blurb}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <label
                        htmlFor="ad-budget"
                        className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]"
                      >
                        Budget
                      </label>
                      <span className="font-display text-[15px] font-extrabold tracking-[-0.02em]">
                        {dollars(budget)}
                      </span>
                    </div>
                    <input
                      id="ad-budget"
                      type="range"
                      min={250}
                      max={25000}
                      step={250}
                      value={budget}
                      onChange={(event) => setBudget(Number(event.target.value))}
                      aria-describedby="ad-budget-hint"
                      style={{ accentColor: "#9400d3" }}
                      className="mt-2 h-2 w-full cursor-pointer"
                    />
                    <div id="ad-budget-hint" className="mt-1 flex justify-between text-[9.5px] text-faint">
                      <span>$250</span>
                      <span>$25,000</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">Duration</p>
                      <div className="mt-2 flex gap-1">
                        {[7, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setDuration(days)}
                            aria-pressed={duration === days}
                            className={`h-8 flex-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                              duration === days
                                ? "border-brand bg-brand text-white"
                                : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                            }`}
                          >
                            {days}d
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="ad-start" className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4d535c]">
                        Start
                      </label>
                      <input
                        id="ad-start"
                        type="date"
                        value={start}
                        onChange={(event) => setStart(event.target.value)}
                        className={`${FIELD} mt-2 h-8 px-2 text-[11.5px]`}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
                    {[
                      ["Impressions", number(flight.impressions)],
                      ["Reach", number(flight.reach)],
                      ["Frequency", `${flight.frequency.toFixed(1)}×`],
                      ["CPM", `$${flight.cpm}`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-surface px-2.5 py-2">
                        <dt className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-faint">
                          {label}
                        </dt>
                        <dd className="mt-0.5 font-display text-[13.5px] font-extrabold tracking-[-0.02em]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {error ? (
                    <p role="alert" className="mt-3 text-[11px] font-medium text-[#b3261e]">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={submit}
                    className="mt-4 h-11 w-full rounded-full bg-brand text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    Submit for review
                  </button>
                  <p className="mt-2 text-center text-[9.5px] leading-relaxed text-faint">
                    Estimates only. Billed at the end of the flight. Ads are always labelled.
                  </p>
                </section>

                <div className="rounded-2xl border border-dashed border-line px-4 py-3 text-[10.5px] leading-relaxed text-muted">
                  Questions? <span className="font-semibold text-ink">ads@snagchat.io</span> · creative
                  review usually takes one business day.
                </div>
              </aside>
            </div>
          )}

          <p className="mt-7 border-t border-line pt-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
            SnagChat Media · advertise.snagchat.io
          </p>
        </div>
      </div>
    </Screen>
  );
}
