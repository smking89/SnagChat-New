import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_EFFECT,
  FRAME_EFFECTS,
  FRAMES,
  INCLUDED_FRAMES,
  PLATFORM_FEE_RATE,
  TARGETS,
  feeFor,
  findEffect,
  findFrame,
  formatMoney,
  formatPrice,
  type CreatorApplication,
  type Frame,
  type FrameEffectId,
  type FrameLoadout,
  type FrameOrder,
  type FrameTarget,
  type FrameUse,
  type StripeAccount,
} from "../data/frames";
import { CosmeticGuidelines } from "./CosmeticGuidelines";
import { CreatorStudio } from "./CreatorStudio";
import { FramePreview } from "./FramePreview";
import { Icon } from "./Icon";
import { Screen, ScreenHeader } from "./Screen";

type ShopTab = "shop" | "studio" | "creator" | "guide";

type ShopScreenProps = {
  onClose: () => void;
  owned: string[];
  loadout: FrameLoadout;
  products: Frame[];
  verified: boolean;
  creator: CreatorApplication;
  stripe: StripeAccount | null;
  orders: FrameOrder[];
  onBuy: (frame: Frame) => void;
  onApply: (target: FrameTarget, use: FrameUse | null) => void;
  onRequestVerification: () => void;
  onSubmitCreator: (application: CreatorApplication) => void;
  onPublishProduct: (product: Frame) => void;
  onConnectStripe: (account: StripeAccount) => void;
  onDisconnectStripe: () => void;
  onToast: (text: string, detail?: string) => void;
};

const HERO_FRAMES = FRAMES.slice(0, 4);

const TARGET_LABEL: Record<FrameTarget, string> = {
  avatar: "avatar",
  banner: "banner",
  nameplate: "nameplate",
  snag: "card",
};

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">{children}</p>
  );
}

function EffectPicker({
  value,
  onChange,
}: {
  value: FrameEffectId;
  onChange: (effect: FrameEffectId) => void;
}) {
  const selected = findEffect(value);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
          Effect
        </p>
        <p className="text-[10.5px] text-faint">{selected.hint}</p>
      </div>
      <div className="mt-2 grid max-h-[186px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-3">
        {FRAME_EFFECTS.map((effect) => {
          const active = effect.id === value;
          return (
            <button
              key={effect.id}
              type="button"
              onClick={() => onChange(effect.id)}
              aria-pressed={active}
              className={`flex min-w-0 items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-left text-[10.5px] font-semibold transition-colors ${
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
              }`}
            >
              <span className="truncate">{effect.label}</span>
              <span
                className={`shrink-0 text-[8px] font-bold uppercase tracking-[0.08em] ${
                  active ? "text-brand/70" : "text-faint"
                }`}
              >
                {effect.mode === "once" ? "tap" : "loop"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FrameTile({
  frame,
  owned,
  applied,
  selected,
  onSelect,
}: {
  frame: Frame;
  owned: boolean;
  applied: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const stageHeight =
    frame.target === "snag"
      ? "h-[254px]"
      : frame.target === "banner"
        ? "h-[146px]"
        : frame.target === "nameplate"
          ? "h-[128px]"
          : "h-[112px]";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Preview ${frame.name} on the real ${TARGET_LABEL[frame.target]} surface`}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-white text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
        selected
          ? "border-brand shadow-[0_8px_24px_rgba(124,58,237,0.14)] ring-2 ring-brand/20"
          : "border-line hover:border-[#d8dce1]"
      }`}
    >
      <span className="absolute left-2 top-2 z-20 flex flex-col items-start gap-1">
        {selected ? (
          <span className="rounded-full bg-brand px-2 py-1 text-[8.5px] font-extrabold uppercase tracking-[0.1em] text-white">
            Previewing
          </span>
        ) : null}
        {owned ? (
          <span className="rounded-full bg-white/92 px-2 py-1 text-[8.5px] font-extrabold uppercase tracking-[0.1em] text-ink shadow-sm">
            {applied ? "Applied" : "Owned"}
          </span>
        ) : null}
      </span>

      <span className={`grid w-full place-items-center overflow-hidden bg-surface px-3 ${stageHeight}`}>
        <FramePreview
          frameId={frame.id}
          effect={DEFAULT_EFFECT[frame.target]}
          compact
        />
      </span>

      <span className="block border-t border-line px-3 py-2.5">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate font-display text-[12.5px] font-extrabold tracking-[-0.02em] text-ink">
              {frame.name}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-muted">
              {frame.official ? "SnagChat studio" : `by ${frame.creator}`}
            </span>
          </span>
          <span className="shrink-0 text-[11px] font-bold text-ink">
            {owned ? "Owned" : formatPrice(frame.priceCents)}
          </span>
        </span>
      </span>
    </button>
  );
}

export function ShopScreen({
  onClose,
  owned,
  loadout,
  products,
  verified,
  creator,
  stripe,
  orders,
  onBuy,
  onApply,
  onRequestVerification,
  onSubmitCreator,
  onPublishProduct,
  onConnectStripe,
  onDisconnectStripe,
  onToast,
}: ShopScreenProps) {
  const [tab, setTab] = useState<ShopTab>("shop");
  const [filter, setFilter] = useState<FrameTarget | "all">("all");
  const [previewKey, setPreviewKey] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const panelRef = useRef<HTMLElement | null>(null);

  const catalog = useMemo(() => [...FRAMES, ...products], [products]);
  const ownedIds = useMemo(() => new Set([...INCLUDED_FRAMES, ...owned]), [owned]);

  const firstFrame = catalog[0]!;
  // Opening the shop lands on your current avatar frame, so the first thing
  // you see is your own loadout rather than the top of the catalogue.
  const initialFrame = catalog.find((frame) => frame.id === loadout.avatar?.frameId) ?? firstFrame;
  const [selectedId, setSelectedId] = useState(initialFrame.id);
  const [effect, setEffect] = useState<FrameEffectId>(
    loadout.avatar?.effect ?? DEFAULT_EFFECT[initialFrame.target],
  );

  const selected = catalog.find((frame) => frame.id === selectedId) ?? firstFrame;
  const visible = filter === "all" ? catalog : catalog.filter((frame) => frame.target === filter);
  const official = visible.filter((frame) => frame.official);
  const community = visible.filter((frame) => !frame.official);

  const selectedOwned = ownedIds.has(selected.id);
  const worn = loadout[selected.target];
  const selectedApplied = worn?.frameId === selected.id && worn.effect === effect;

  /**
   * Tapping a tile updates the one preview panel in place. On a phone the
   * catalogue sits below that panel, so bring it back into view rather than
   * opening a second screen.
   */
  const selectFrame = (frame: Frame) => {
    setSelectedId(frame.id);
    const current = loadout[frame.target];
    setEffect(current?.frameId === frame.id ? current.effect : DEFAULT_EFFECT[frame.target]);
    setPreviewKey((key) => key + 1);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };

  // The preview always shows a frame from the surface the player filtered to.
  useEffect(() => {
    if (filter === "all") return;
    const current = catalog.find((frame) => frame.id === selectedId);
    if (current?.target === filter) return;
    const next = catalog.find((frame) => frame.target === filter);
    if (!next) return;
    setSelectedId(next.id);
    setEffect(DEFAULT_EFFECT[filter]);
    setPreviewKey((key) => key + 1);
  }, [filter, catalog, selectedId]);

  const [studioTarget, setStudioTarget] = useState<FrameTarget>("avatar");
  const [draft, setDraft] = useState<FrameUse>(() => ({
    frameId: loadout.avatar?.frameId ?? "halo-violet",
    effect: loadout.avatar?.effect ?? DEFAULT_EFFECT.avatar,
  }));
  const [studioKey, setStudioKey] = useState(0);

  const ownedForTarget = catalog.filter(
    (frame) => frame.target === studioTarget && ownedIds.has(frame.id),
  );
  const draftFrame = findFrame(draft.frameId);
  const applied = loadout[studioTarget];
  const isApplied =
    applied?.frameId === draft.frameId && applied?.effect === draft.effect && Boolean(draft.frameId);

  const pickTarget = (target: FrameTarget) => {
    setStudioTarget(target);
    const current = loadout[target];
    const available = catalog.filter((frame) => frame.target === target && ownedIds.has(frame.id));
    setDraft({
      frameId: current?.frameId ?? available[0]?.id ?? "",
      effect: current?.effect ?? DEFAULT_EFFECT[target],
    });
    setStudioKey((key) => key + 1);
  };

  const applySelected = () => {
    onApply(selected.target, { frameId: selected.id, effect });
    onToast(
      `${selected.name} applied`,
      `${findEffect(effect).label} · ${TARGET_LABEL[selected.target]}`,
    );
  };

  return (
    <Screen labelledBy="shop-title" onClose={onClose}>
      <ScreenHeader
        title="SnagChat Shop"
        titleId="shop-title"
        onBack={onClose}
        action={
          <span className="hidden shrink-0 rounded-full bg-surface px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#4d535c] sm:inline-flex">
            {(PLATFORM_FEE_RATE * 100).toFixed(1)}% seller fee
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto bg-[#fbfbfc]">
        <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6">
          <section className="overflow-hidden rounded-3xl border border-line bg-white px-5 py-5 text-ink sm:px-7 sm:py-6">
            <Eyebrow>Shop · effects · marketplace</Eyebrow>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="max-w-[22ch] font-display text-[24px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[31px]">
                  Shop items that <span className="text-brand">do something.</span>
                </h1>
                <p className="mt-2 max-w-[56ch] text-[12px] leading-relaxed text-muted sm:text-[12.5px]">
                  Static artwork, animated by an effect you choose. Wear it on your photo, banner,
                  nameplate or a whole post card. Creators keep 97.5% of every sale.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10.5px] font-semibold text-[#4d535c]">
                <span className="rounded-full bg-surface px-3 py-1.5">{ownedIds.size} owned</span>
                <span className="rounded-full bg-surface px-3 py-1.5">
                  {products.length} creator drops
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-gradient-to-r from-brand-tint to-white p-3 sm:gap-5 sm:p-4">
              <div className="grid h-[118px] w-[118px] shrink-0 place-items-center overflow-hidden rounded-xl bg-surface sm:h-[150px] sm:w-[150px]">
                <FramePreview
                  frameId={HERO_FRAMES[heroIndex % HERO_FRAMES.length]!.id}
                  effect={DEFAULT_EFFECT[HERO_FRAMES[heroIndex % HERO_FRAMES.length]!.target]}
                  compact
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-brand">
                  Featured
                </p>
                <h2 className="mt-1 truncate font-display text-[17px] font-extrabold tracking-[-0.03em] text-ink sm:text-[20px]">
                  {HERO_FRAMES[heroIndex % HERO_FRAMES.length]!.name}
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {TARGET_LABEL[HERO_FRAMES[heroIndex % HERO_FRAMES.length]!.target]} frame ·{" "}
                  {formatPrice(HERO_FRAMES[heroIndex % HERO_FRAMES.length]!.priceCents)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      selectFrame(HERO_FRAMES[heroIndex % HERO_FRAMES.length]!);
                      setTab("shop");
                    }}
                    className="h-8 rounded-full bg-brand px-4 text-[11px] font-semibold text-white transition-colors hover:bg-brand-deep"
                  >
                    View
                  </button>
                  <div className="flex items-center gap-1" aria-label="Featured frames">
                    {HERO_FRAMES.map((frame, index) => (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        aria-label={`Show ${frame.name}`}
                        aria-pressed={index === heroIndex % HERO_FRAMES.length}
                        className={`h-1.5 rounded-full transition-all ${
                          index === heroIndex % HERO_FRAMES.length ? "w-4 bg-brand" : "w-1.5 bg-line"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHeroIndex((index) => (index + 1) % HERO_FRAMES.length)}
                aria-label="Next featured frame"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-surface"
              >
                <span className="inline-block rotate-180">
                  <Icon name="back" size={16} />
                </span>
              </button>
            </div>
          </section>

          <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
            {(
              [
                { id: "shop", label: "Shop", count: catalog.length },
                { id: "studio", label: "Owned", count: ownedIds.size },
                { id: "creator", label: "Creator", count: products.length },
                { id: "guide", label: "Guidelines", count: 0 },
              ] as const
            ).map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                aria-pressed={tab === entry.id}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[11.5px] font-semibold transition-colors ${
                  tab === entry.id
                    ? "bg-ink text-white"
                    : "text-[#4d535c] hover:bg-surface hover:text-ink"
                }`}
              >
                {entry.label}
                {entry.id === "guide" ? null : (
                  <span
                    className={`text-[9.5px] font-bold ${
                      tab === entry.id ? "text-white/60" : "text-faint"
                    }`}
                  >
                    {entry.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "shop" ? (
            <div className="mt-4 rounded-3xl border border-line bg-white p-3 sm:p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    filter === "all"
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                  }`}
                >
                  All items
                </button>
                {TARGETS.map((target) => {
                  const active = filter === target.id;
                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setFilter(target.id)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                      }`}
                    >
                      {target.plural}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_384px] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
                <aside
                  ref={panelRef}
                  className="order-1 scroll-mt-4 lg:order-2 lg:sticky lg:top-4"
                  aria-label="Live frame preview"
                >
                  <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-2 border-b border-line px-3.5 py-2.5">
                      <div className="min-w-0">
                        <Eyebrow>Live preview</Eyebrow>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-[#4d535c]">
                          What it looks like on your {TARGET_LABEL[selected.target]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewKey((key) => key + 1)}
                        className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[10.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                      >
                        Replay
                      </button>
                    </div>

                    <div
                      key={`${selected.id}-${effect}-${previewKey}`}
                      className="is-playing bg-surface px-4 py-5 sm:px-5"
                    >
                      <FramePreview frameId={selected.id} effect={effect} playing />
                    </div>

                    <div className="px-4 pb-4 pt-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-display text-[18px] font-extrabold tracking-[-0.03em] text-ink">
                            {selected.name}
                          </h2>
                          <p className="mt-0.5 truncate text-[10.5px] text-muted">
                            {selected.official ? "SnagChat studio" : `by ${selected.creator}`} ·{" "}
                            {TARGET_LABEL[selected.target]} frame
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10.5px] font-bold text-ink">
                          {selectedOwned ? "Owned" : formatPrice(selected.priceCents)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                        {selected.tagline}
                      </p>

                      <div className="mt-3">
                        <EffectPicker
                          value={effect}
                          onChange={(next) => {
                            setEffect(next);
                            setPreviewKey((key) => key + 1);
                          }}
                        />
                      </div>

                      <div className="mt-3 flex gap-2">
                        {selectedOwned ? (
                          <button
                            type="button"
                            disabled={selectedApplied}
                            onClick={applySelected}
                            className="h-10 flex-1 rounded-full bg-brand text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-default disabled:bg-[#e9e2f2] disabled:text-[#8a759c]"
                          >
                            {selectedApplied ? "Applied" : `Apply · ${findEffect(effect).label}`}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onBuy(selected);
                              setPreviewKey((key) => key + 1);
                            }}
                            className="h-10 flex-1 rounded-full bg-brand text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
                          >
                            Buy for {formatPrice(selected.priceCents)}
                          </button>
                        )}
                        {worn ? (
                          <button
                            type="button"
                            onClick={() => {
                              onApply(selected.target, null);
                              onToast(
                                "Frame removed",
                                `Your ${TARGET_LABEL[selected.target]} is back to plain.`,
                              );
                            }}
                            className="h-10 rounded-full border border-line px-3.5 text-[10.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <p className="mt-2 text-[9.5px] leading-relaxed text-faint">
                        {selected.priceCents > 0
                          ? `Seller receives ${formatMoney(
                              selected.priceCents - feeFor(selected.priceCents),
                            )} · SnagChat fee ${formatMoney(feeFor(selected.priceCents))}`
                          : "Included with every account."}{" "}
                        Demo checkout — no card is charged.
                      </p>
                    </div>
                  </div>
                </aside>

                <div className="order-2 min-w-0 lg:order-1">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <Eyebrow>Official line</Eyebrow>
                      <h2 className="mt-1 font-display text-[17px] font-extrabold tracking-[-0.03em]">
                        {filter === "all" ? "Every surface" : TARGETS.find((t) => t.id === filter)?.plural}
                      </h2>
                    </div>
                    <p className="text-[10.5px] text-faint">Tap a frame to preview it</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {official.map((frame) => (
                      <FrameTile
                        key={frame.id}
                        frame={frame}
                        owned={ownedIds.has(frame.id)}
                        applied={loadout[frame.target]?.frameId === frame.id}
                        selected={selected.id === frame.id}
                        onSelect={() => selectFrame(frame)}
                      />
                    ))}
                  </div>

                  {community.length > 0 ? (
                    <section className="mt-8">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <Eyebrow>From SnagChat Creators</Eyebrow>
                          <h2 className="mt-1 font-display text-[17px] font-extrabold tracking-[-0.03em]">
                            Community drops
                          </h2>
                        </div>
                        <p className="text-[10.5px] text-faint">Creator gets 97.5%</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {community.map((frame) => (
                          <FrameTile
                            key={frame.id}
                            frame={frame}
                            owned={ownedIds.has(frame.id)}
                            applied={loadout[frame.target]?.frameId === frame.id}
                            selected={selected.id === frame.id}
                            onSelect={() => selectFrame(frame)}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <p className="mt-8 rounded-xl border border-line bg-white px-4 py-3 text-[11px] leading-relaxed text-muted">
                    Every frame is a static image. The movement comes from the effect you attach, so
                    the artwork itself never changes. Card frames wrap the entire post — artwork,
                    author and title — not just the picture. SnagChat takes 2.5% of each sale; the
                    seller pays it and keeps the rest.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "studio" ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <div className="lg:sticky lg:top-4 lg:self-start">
                <div className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="flex flex-wrap items-center gap-1 border-b border-line px-2.5 py-2">
                    {TARGETS.map((target) => {
                      const active = studioTarget === target.id;
                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => pickTarget(target.id)}
                          aria-pressed={active}
                          className={`rounded-full px-2.5 py-1.5 text-[10.5px] font-semibold transition-colors ${
                            active ? "bg-brand-soft text-brand" : "text-[#4d535c] hover:bg-surface"
                          }`}
                        >
                          {target.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setStudioKey((key) => key + 1)}
                      className="ml-auto rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold text-[#4d535c]"
                    >
                      Replay
                    </button>
                  </div>

                  <div
                    key={`${studioTarget}-${studioKey}`}
                    className="is-playing grid min-h-[238px] place-items-center bg-[#f4f0f8] px-4 py-5"
                  >
                    {draftFrame ? (
                      <FramePreview frameId={draftFrame.id} effect={draft.effect} playing />
                    ) : (
                      <div className="w-full max-w-[260px] rounded-xl border border-dashed border-[#d9cfe4] bg-white/60 px-4 py-9 text-center">
                        <Icon name="shop" size={22} className="mx-auto text-brand" />
                        <p className="mt-2 text-[11.5px] font-semibold text-[#4d535c]">
                          No {TARGET_LABEL[studioTarget]} frame owned yet
                        </p>
                        <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                          Pick one up in the shop and it will show up on the real surface here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-3.5 pb-3.5 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11px] text-muted">
                        {draftFrame
                          ? `${draftFrame.name} · ${findEffect(draft.effect).label}`
                          : "Pick a frame below"}
                      </p>
                      {isApplied ? (
                        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-brand">
                          Applied
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={!draft.frameId || isApplied}
                        onClick={() => {
                          if (!draft.frameId) return;
                          onApply(studioTarget, draft);
                          onToast(
                            `${draftFrame?.name ?? "Frame"} applied`,
                            `${findEffect(draft.effect).label} · ${TARGET_LABEL[studioTarget]}`,
                          );
                        }}
                        className="h-10 flex-1 rounded-full bg-brand text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#e6e8eb] disabled:text-[#9aa0a9]"
                      >
                        {isApplied ? "Applied" : "Apply frame"}
                      </button>
                      <button
                        type="button"
                        disabled={!applied}
                        onClick={() => {
                          onApply(studioTarget, null);
                          onToast(
                            "Frame removed",
                            `Your ${TARGET_LABEL[studioTarget]} is back to plain.`,
                          );
                        }}
                        className="h-10 rounded-full border border-line px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1] disabled:cursor-not-allowed disabled:text-[#c4c8ce]"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-faint">
                      Avatar and banner frames show on your profile. Nameplates show in chats, and
                      card frames wrap the whole post.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-line bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                      Your {TARGET_LABEL[studioTarget]} frames
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("shop");
                        setFilter(studioTarget);
                      }}
                      className="text-[10.5px] font-semibold text-brand"
                    >
                      Browse shop
                    </button>
                  </div>
                  {ownedForTarget.length === 0 ? (
                    <p className="mt-2 rounded-xl border border-dashed border-line px-3 py-6 text-center text-[11.5px] text-muted">
                      Nothing owned for this spot yet.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {ownedForTarget.map((frame) => {
                        const active = frame.id === draft.frameId;
                        return (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => {
                              setDraft((current) => ({ ...current, frameId: frame.id }));
                              setStudioKey((key) => key + 1);
                            }}
                            aria-pressed={active}
                            className={`overflow-hidden rounded-xl border p-2 text-left transition-colors ${
                              active
                                ? "border-brand bg-brand-tint ring-1 ring-brand/30"
                                : "border-line hover:border-[#d8dce1]"
                            }`}
                          >
                            <span
                              className={`grid place-items-center overflow-hidden rounded-lg bg-[#f6f3f9] ${
                                studioTarget === "snag"
                                  ? "h-[252px]"
                                  : studioTarget === "banner"
                                    ? "h-[150px]"
                                    : studioTarget === "nameplate"
                                      ? "h-[132px]"
                                      : "h-[120px]"
                              }`}
                            >
                              <FramePreview frameId={frame.id} effect="none" compact />
                            </span>
                            <span className="mt-1.5 block truncate text-[10.5px] font-semibold text-ink">
                              {frame.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-line bg-white p-3">
                  <EffectPicker
                    value={draft.effect}
                    onChange={(next) => {
                      setDraft((current) => ({ ...current, effect: next }));
                      setStudioKey((key) => key + 1);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "guide" ? (
            <div className="mt-4">
              <CosmeticGuidelines onOpenCreator={() => setTab("creator")} />
            </div>
          ) : null}

          {tab === "creator" ? (
            <div className="mt-4">
              <CreatorStudio
                verified={verified}
                creator={creator}
                stripe={stripe}
                products={products}
                orders={orders}
                onRequestVerification={onRequestVerification}
                onSubmitCreator={onSubmitCreator}
                onPublishProduct={onPublishProduct}
                onConnectStripe={onConnectStripe}
                onDisconnectStripe={onDisconnectStripe}
                onToast={onToast}
                onOpenGuidelines={() => setTab("guide")}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
