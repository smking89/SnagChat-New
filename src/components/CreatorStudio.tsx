import { useState, type FormEvent, type ReactNode } from "react";
import {
  DEFAULT_EFFECT,
  FRAME_EFFECTS,
  FRAMES,
  TARGETS,
  feeFor,
  formatMoney,
  formatPrice,
  type CreatorApplication,
  type Frame,
  type FrameEffectId,
  type FrameOrder,
  type FrameTarget,
  type StripeAccount,
} from "../data/frames";
import { FramePreview } from "./FramePreview";
import { Icon } from "./Icon";

export type CreatorStudioProps = {
  verified: boolean;
  creator: CreatorApplication;
  stripe: StripeAccount | null;
  products: Frame[];
  orders: FrameOrder[];
  onRequestVerification: () => void;
  onSubmitCreator: (application: CreatorApplication) => void;
  onPublishProduct: (product: Frame) => void;
  onConnectStripe: (account: StripeAccount) => void;
  onDisconnectStripe: () => void;
  onToast: (text: string, detail?: string) => void;
  onOpenGuidelines?: () => void;
};

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Netherlands",
  "Brazil",
  "Japan",
];

const TARGET_LABEL: Record<FrameTarget, string> = {
  avatar: "Avatar borders",
  banner: "Banner borders",
  nameplate: "Message nameplates",
  snag: "Post borders",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "product";

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-brand">{children}</p>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold text-[#4d535c]">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-[12.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/40 focus:ring-2 focus:ring-brand/15";

const primaryButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-[12px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-[#d9c2e6]";

const quietButton =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]";

export function CreatorStudio({
  verified,
  creator,
  stripe,
  products,
  orders,
  onRequestVerification,
  onSubmitCreator,
  onPublishProduct,
  onConnectStripe,
  onDisconnectStripe,
  onToast,
  onOpenGuidelines,
}: CreatorStudioProps) {
  // --- verification gate ---------------------------------------------------
  if (!verified) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-8">
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
            <Icon name="lock" size={22} />
          </span>
          <h3 className="mt-4 font-display text-[18px] font-extrabold tracking-[-0.03em]">
            Creator access is verified-only
          </h3>
          <p className="mx-auto mt-2 max-w-[42ch] text-[12.5px] leading-relaxed text-muted">
            SnagChat Creator products — borders and nameplates sold in the shop — are reserved for
            verified players and businesses. Verification is how buyers know who they are buying
            from.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={onRequestVerification} className={primaryButton}>
              <Icon name="verified" size={15} />
              Request verification
            </button>
            {onOpenGuidelines ? (
              <button type="button" onClick={onOpenGuidelines} className={quietButton}>
                Read the guidelines
              </button>
            ) : null}
          </div>
          <p className="mx-auto mt-3 max-w-[40ch] text-[10.5px] leading-relaxed text-faint">
            Demo build: verification is approved instantly. Production reviews your account, posts
            and business details before granting creator access.
          </p>
        </div>
      </div>
    );
  }

  // --- application ---------------------------------------------------------
  if (creator.status === "none") {
    return (
      <ApplicationForm
        creator={creator}
        verified={verified}
        onSubmit={onSubmitCreator}
        onToast={onToast}
        onOpenGuidelines={onOpenGuidelines}
      />
    );
  }

  const myProducts = products.filter((product) => product.creatorId === "you");
  const myProductIds = new Set(myProducts.map((product) => product.id));
  const sales = orders
    .filter((order) => myProductIds.has(order.frameId))
    .sort((a, b) => b.at - a.at);
  const gross = sales.reduce((total, order) => total + order.priceCents, 0);
  const fees = sales.reduce((total, order) => total + order.feeCents, 0);
  const net = sales.reduce((total, order) => total + order.sellerNetCents, 0);

  return (
    <div className="mx-auto max-w-[900px] space-y-6 px-4 py-6">
      <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-tint to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>SnagChat Creator</Eyebrow>
            <h3 className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.035em]">
              {creator.storeName ?? "Your store"}
            </h3>
            <p className="mt-1 text-[11.5px] text-muted">
              {myProducts.length} {myProducts.length === 1 ? "product" : "products"} live ·{" "}
              {sales.length} {sales.length === 1 ? "sale" : "sales"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-brand ring-1 ring-brand/15">
            <Icon name="verified" size={11} />
            Approved
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Gross", value: formatMoney(gross) },
            { label: "SnagChat fee", value: formatMoney(fees) },
            { label: "Your net", value: formatMoney(net) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-line">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-faint">
                {stat.label}
              </p>
              <p className="mt-1 font-display text-[16px] font-extrabold tracking-[-0.02em]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ProductBuilder
        storeName={creator.storeName ?? "Your store"}
        onPublish={onPublishProduct}
        onToast={onToast}
      />

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Eyebrow>Your shelf</Eyebrow>
            <h4 className="mt-1 font-display text-[16px] font-extrabold tracking-[-0.03em]">
              Published products
            </h4>
          </div>
        </div>

        {myProducts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#e2e5e9] px-4 py-8 text-center text-[12px] text-muted">
            Nothing published yet. Build a border above and it lands in the shop under your store
            name.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {myProducts.map((product) => {
              const fee = feeFor(product.priceCents);
              return (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
                    <img
                      src={product.art}
                      alt=""
                      className="h-9 w-9 object-contain"
                      draggable={false}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold">{product.name}</span>
                    <span className="block truncate text-[10.5px] text-muted">
                      {TARGET_LABEL[product.target]} · {formatPrice(product.priceCents)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11.5px] font-bold text-ink">
                      {formatMoney(product.priceCents - fee)} net
                    </span>
                    <span className="block text-[9.5px] text-faint">
                      {formatMoney(fee)} fee
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SellerDashboard
        stripe={stripe}
        sales={sales}
        products={myProducts}
        gross={gross}
        fees={fees}
        net={net}
        onConnectStripe={onConnectStripe}
        onDisconnectStripe={onDisconnectStripe}
        onToast={onToast}
      />
    </div>
  );
}

// ------------------------------------------------------------- application --

function ApplicationForm({
  creator,
  verified,
  onSubmit,
  onToast,
  onOpenGuidelines,
}: {
  creator: CreatorApplication;
  verified: boolean;
  onSubmit: (application: CreatorApplication) => void;
  onToast: (text: string, detail?: string) => void;
  onOpenGuidelines?: () => void;
}) {
  const [storeName, setStoreName] = useState(creator.storeName ?? "");
  const [target, setTarget] = useState<FrameTarget>(creator.target ?? "avatar");
  const [portfolio, setPortfolio] = useState(creator.portfolio ?? "");
  const [country, setCountry] = useState(creator.country ?? COUNTRIES[0]!);
  const [error, setError] = useState<string | null>(null);

  const valid = storeName.trim().length >= 3;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setError("Give your store a name of at least 3 characters.");
      return;
    }
    setError(null);
    onSubmit({
      status: "approved",
      storeName: storeName.trim(),
      target,
      portfolio: portfolio.trim() || undefined,
      country,
      submittedAt: Date.now(),
    });
    onToast("You are a SnagChat Creator", `${storeName.trim()} can publish products now.`);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6">
      <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
            <Icon name="verified" size={17} />
          </span>
          <div>
            <Eyebrow>Verified account</Eyebrow>
            <h3 className="font-display text-[17px] font-extrabold tracking-[-0.03em]">
              Apply to become a creator
            </h3>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Creators design static borders and nameplates and sell them in the SnagChat Shop. Every
          sale pays you the list price minus SnagChat&apos;s 2.5% marketplace fee — no listing fee,
          no monthly fee.
        </p>
        {onOpenGuidelines ? (
          <button type="button" onClick={onOpenGuidelines} className={`${quietButton} mt-3`}>
            Read the cosmetic guidelines first
          </button>
        ) : null}

        <div className="mt-5 space-y-4">
          <Field id="creator-store" label="Store name" hint="Shown on every product in the shop.">
            <input
              id="creator-store"
              value={storeName}
              maxLength={40}
              onChange={(event) => {
                setStoreName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Static Kings Studio"
              className={inputClass}
              aria-invalid={Boolean(error)}
            />
          </Field>

          <div>
            <p className="text-[11px] font-bold text-[#4d535c]">What will you make?</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TARGETS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTarget(option.id)}
                  aria-pressed={target === option.id}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    target === option.id
                      ? "border-brand bg-brand text-white"
                      : "border-line text-[#4d535c] hover:border-[#d8dce1]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Field
            id="creator-portfolio"
            label="Portfolio or shop link"
            hint="Optional. A link to your art makes review faster."
          >
            <input
              id="creator-portfolio"
              value={portfolio}
              onChange={(event) => setPortfolio(event.target.value)}
              placeholder="https://"
              inputMode="url"
              className={inputClass}
            />
          </Field>

          <Field id="creator-country" label="Payout country">
            <select
              id="creator-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={inputClass}
            >
              {COUNTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-[11.5px] font-semibold text-[#b3261e]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!valid || !verified} className={primaryButton}>
            Submit application
          </button>
          <span className="text-[10.5px] leading-relaxed text-faint">
            Demo build: applications are approved instantly. Production reviews store details and
            artwork before publishing.
          </span>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------- product builder --

function ProductBuilder({
  storeName,
  onPublish,
  onToast,
}: {
  storeName: string;
  onPublish: (product: Frame) => void;
  onToast: (text: string, detail?: string) => void;
}) {
  const [target, setTarget] = useState<FrameTarget>("avatar");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState("4.99");
  const [effect, setEffect] = useState<FrameEffectId>(DEFAULT_EFFECT.avatar);
  const [replay, setReplay] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const templates = FRAMES.filter((frame) => frame.target === target);
  const template = templates.find((frame) => frame.id === templateId) ?? templates[0];

  const priceValue = Number.parseFloat(price);
  const priceValid = Number.isFinite(priceValue) && priceValue >= 0.99 && priceValue <= 99;
  const canPublish = Boolean(template) && name.trim().length >= 3 && priceValid;

  const changeTarget = (next: FrameTarget) => {
    setTarget(next);
    setTemplateId(null);
    setEffect(DEFAULT_EFFECT[next]);
    setError(null);
  };

  const publish = (event: FormEvent) => {
    event.preventDefault();
    if (!template) return;
    if (name.trim().length < 3) {
      setError("Product names need at least 3 characters.");
      return;
    }
    if (!priceValid) {
      setError("Set a price between $0.99 and $99.00.");
      return;
    }

    const priceCents = Math.round(priceValue * 100);
    const product: Frame = {
      id: `creator-${slugify(name)}-${Date.now().toString(36)}`,
      name: name.trim(),
      art: template.art,
      target,
      priceCents,
      creator: storeName,
      creatorId: "you",
      tagline: tagline.trim() || template.tagline,
      swatch: template.swatch,
      official: false,
    };

    onPublish(product);
    onToast("Product published", `${product.name} is live at ${formatPrice(priceCents)}.`);
    setName("");
    setTagline("");
    setPrice("4.99");
    setError(null);
    setReplay((value) => value + 1);
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <Eyebrow>Create</Eyebrow>
      <h4 className="mt-1 font-display text-[16px] font-extrabold tracking-[-0.03em]">
        Build a shop product
      </h4>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Borders are static artwork. Pick a template, price it, and buyers can pair it with any
        effect in the shop.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-line bg-surface/60 p-3">
          <div className="grid min-h-[170px] place-items-center">
            {template ? (
              <div className="w-full">
                <FramePreview
                  key={replay}
                  frameId={template.id}
                  effect={effect}
                  playing={replay > 0}
                  avatarSize={92}
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
          <button type="button" onClick={() => setReplay((value) => value + 1)} className={`${quietButton} mt-2 w-full`}>
            Play effect
          </button>
          {template ? (
            <p className="mt-2 truncate text-center text-[10px] font-semibold text-faint">
              Template: {template.name}
            </p>
          ) : null}
        </div>

        <form onSubmit={publish} className="space-y-3">
          <div>
            <p className="text-[11px] font-bold text-[#4d535c]">Product type</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TARGETS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => changeTarget(option.id)}
                  aria-pressed={target === option.id}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    target === option.id
                      ? "border-ink bg-ink text-white"
                      : "border-line text-[#4d535c] hover:border-[#d8dce1]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#4d535c]">Artwork template</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {templates.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTemplateId(option.id)}
                  aria-pressed={template?.id === option.id}
                  aria-label={`Use ${option.name} artwork`}
                  className={`h-9 w-9 overflow-hidden rounded-lg border transition-colors ${
                    template?.id === option.id
                      ? "border-brand ring-2 ring-brand/25"
                      : "border-line hover:border-[#d8dce1]"
                  }`}
                >
                  <img src={option.art} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="product-name" label="Product name">
              <input
                id="product-name"
                value={name}
                maxLength={40}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ember Halo v2"
                className={inputClass}
              />
            </Field>
            <Field id="product-price" label="Price (USD)">
              <input
                id="product-price"
                value={price}
                inputMode="decimal"
                onChange={(event) => {
                  setPrice(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="4.99"
                className={inputClass}
              />
            </Field>
          </div>

          <Field id="product-tagline" label="Tagline" hint="One line shown under the product name.">
            <input
              id="product-tagline"
              value={tagline}
              maxLength={90}
              onChange={(event) => setTagline(event.target.value)}
              placeholder="A slow burn for late queues"
              className={inputClass}
            />
          </Field>

          <div>
            <p className="text-[11px] font-bold text-[#4d535c]">Default effect</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FRAME_EFFECTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setEffect(option.id)}
                  aria-pressed={effect === option.id}
                  title={option.hint}
                  className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${
                    effect === option.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-[#4d535c] hover:border-[#d8dce1]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">Buyer pays</span>
              <span className="font-bold">
                {priceValid ? formatPrice(Math.round(priceValue * 100)) : "—"}
              </span>
            </div>
            {priceValid ? (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-muted">You receive after the 2.5% fee</span>
                <span className="font-bold">
                  {formatMoney(Math.round(priceValue * 100) - feeFor(Math.round(priceValue * 100)))}
                </span>
              </div>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-[11.5px] font-semibold text-[#b3261e]">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={!canPublish} className={primaryButton}>
            <Icon name="plus" size={15} strokeWidth={2.2} />
            Publish product
          </button>
        </form>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ payouts ---------

function SellerDashboard({
  stripe,
  sales,
  products,
  gross,
  fees,
  net,
  onConnectStripe,
  onDisconnectStripe,
  onToast,
}: {
  stripe: StripeAccount | null;
  sales: FrameOrder[];
  products: Frame[];
  gross: number;
  fees: number;
  net: number;
  onConnectStripe: (account: StripeAccount) => void;
  onDisconnectStripe: () => void;
  onToast: (text: string, detail?: string) => void;
}) {
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [country, setCountry] = useState(COUNTRIES[0]!);
  const [businessType, setBusinessType] = useState<"individual" | "company">("individual");
  const [bank, setBank] = useState("");
  const [calculator, setCalculator] = useState("4.99");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const bankOk = /^\d{4}$/.test(bank);
  const calcCents = Math.round((Number.parseFloat(calculator) || 0) * 100);
  const calcFee = feeFor(calcCents);
  const nameFor = (frameId: string) =>
    products.find((product) => product.id === frameId)?.name ?? "Border";

  const openOnboarding = () => {
    setStep(1);
    setBank("");
    setConfirmDisconnect(false);
    setOnboarding(true);
  };

  const finish = () => {
    onConnectStripe({
      id: `acct_demo_${Math.random().toString(36).slice(2, 10)}`,
      country,
      businessType,
      bankLast4: bank,
      chargesEnabled: true,
      payoutsEnabled: true,
      connectedAt: Date.now(),
    });
    setOnboarding(false);
    onToast("Stripe connected", "Payouts are enabled for this demo account.");
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Seller dashboard</Eyebrow>
          <h4 className="mt-1 font-display text-[16px] font-extrabold tracking-[-0.03em]">
            Payouts &amp; fees
          </h4>
        </div>
        {stripe ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-[#067647] ring-1 ring-[#abefc6]">
            <Icon name="check" size={11} strokeWidth={2.6} />
            Stripe connected
          </span>
        ) : null}
      </div>

      {stripe ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line p-3.5 sm:grid-cols-4">
            {[
              { term: "Account", value: stripe.id },
              { term: "Country", value: stripe.country },
              {
                term: "Business",
                value: stripe.businessType === "individual" ? "Individual" : "Company",
              },
              { term: "Bank", value: `•••• ${stripe.bankLast4}` },
            ].map((row) => (
              <div key={row.term}>
                <dt className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-faint">
                  {row.term}
                </dt>
                <dd className="mt-1 truncate text-[11.5px] font-semibold">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-[#4d535c]">
              Charges {stripe.chargesEnabled ? "enabled" : "paused"}
            </span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-[#4d535c]">
              Payouts {stripe.payoutsEnabled ? "enabled" : "paused"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!confirmDisconnect) {
                  setConfirmDisconnect(true);
                  return;
                }
                setConfirmDisconnect(false);
                onDisconnectStripe();
                onToast("Stripe disconnected", "New sales will hold until you reconnect.");
              }}
              className="ml-auto inline-flex h-8 items-center rounded-full border border-line px-3 text-[10.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
            >
              {confirmDisconnect ? "Tap to confirm" : "Disconnect"}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e5e9] p-4">
          <p className="text-[12px] leading-relaxed text-[#4d535c]">
            Payouts run through Stripe Connect. Connect an account to receive sales and payouts
            directly — SnagChat keeps a 2.5% marketplace fee, paid by the seller, and never holds
            your balance.
          </p>
          <button type="button" onClick={openOnboarding} className={`${primaryButton} mt-3`}>
            Connect Stripe
          </button>
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
            Demo build: onboarding is simulated and no Stripe account is created. Production uses
            Stripe Connect Express with a server-issued onboarding link.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
            What a sale pays you
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-muted">$</span>
            <input
              value={calculator}
              onChange={(event) => setCalculator(event.target.value)}
              inputMode="decimal"
              aria-label="Sale price to calculate fees"
              className={`${inputClass} h-9 max-w-[110px]`}
            />
            <span className="text-[11px] text-faint">list price</span>
          </div>
          <div className="mt-3 space-y-1.5 rounded-xl bg-surface px-3 py-2.5 text-[11.5px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">SnagChat fee (2.5%)</span>
              <span className="font-semibold">{formatMoney(calcFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Seller receives</span>
              <span className="font-bold text-ink">{formatMoney(calcCents - calcFee)}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
            Recent sales
          </p>
          {sales.length === 0 ? (
            <p className="mt-2 rounded-xl bg-surface px-3 py-6 text-center text-[11.5px] leading-relaxed text-muted">
              No sales yet. Your first sale nets {formatPrice(Math.round(499 * 0.975))} on a{" "}
              {formatPrice(499)} border — 97.5% of the list price.
            </p>
          ) : (
            <>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {sales.slice(0, 5).map((sale) => (
                  <li key={sale.id} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {nameFor(sale.frameId)}
                    </span>
                    <span className="shrink-0 text-faint">
                      {new Date(sale.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="shrink-0 font-bold">{formatMoney(sale.sellerNetCents)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10.5px] text-faint">
                Gross {formatMoney(gross)} · fees {formatMoney(fees)} · net {formatMoney(net)}
              </p>
            </>
          )}
        </div>
      </div>

      {onboarding ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close Stripe onboarding"
            onClick={() => setOnboarding(false)}
            className="sheet-scrim absolute inset-0 bg-[#080a0e]/55"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stripe-onboarding-title"
            className="sheet-panel relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-[440px] sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Stripe Connect · step {step} of 3</Eyebrow>
                <h3
                  id="stripe-onboarding-title"
                  className="mt-1 font-display text-[17px] font-extrabold tracking-[-0.03em]"
                >
                  {step === 1 ? "Business details" : step === 2 ? "Payout account" : "Review"}
                </h3>
              </div>
              <span className="rounded-full bg-surface px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-muted">
                Demo
              </span>
            </div>

            {step === 1 ? (
              <div className="mt-4 space-y-4">
                <Field id="stripe-country" label="Country">
                  <select
                    id="stripe-country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className={inputClass}
                  >
                    {COUNTRIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <p className="text-[11px] font-bold text-[#4d535c]">Business type</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(["individual", "company"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setBusinessType(option)}
                        aria-pressed={businessType === option}
                        className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          businessType === option
                            ? "border-brand bg-brand-soft/60"
                            : "border-line hover:border-[#d8dce1]"
                        }`}
                      >
                        <span className="block text-[12px] font-bold capitalize">{option}</span>
                        <span className="block text-[10px] text-muted">
                          {option === "individual" ? "Sole trader" : "Registered business"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-4 space-y-4">
                <Field
                  id="stripe-bank"
                  label="Bank account, last 4 digits"
                  hint="Stripe stores the full number; this demo keeps four digits only."
                >
                  <input
                    id="stripe-bank"
                    value={bank}
                    onChange={(event) => setBank(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4242"
                    className={inputClass}
                    aria-invalid={bank.length > 0 && !bankOk}
                  />
                </Field>
                <p className="rounded-xl bg-surface px-3 py-2.5 text-[10.5px] leading-relaxed text-muted">
                  Payouts land in this account on a rolling basis. SnagChat never sees or stores the
                  full number — Stripe does.
                </p>
              </div>
            ) : null}

            {step === 3 ? (
              <dl className="mt-4 space-y-2 rounded-xl border border-line p-3.5 text-[11.5px]">
                {[
                  ["Country", country],
                  ["Business", businessType === "individual" ? "Individual" : "Company"],
                  ["Bank", `•••• ${bank || "----"}`],
                  ["Marketplace fee", "2.5% (seller pays)"],
                ].map(([term, value]) => (
                  <div key={term} className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{term}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-5 flex items-center gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3)}
                  className={quietButton}
                >
                  Back
                </button>
              ) : (
                <button type="button" onClick={() => setOnboarding(false)} className={quietButton}>
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 2 && !bankOk}
                  onClick={() => setStep((current) => (current + 1) as 1 | 2 | 3)}
                  className={`${primaryButton} ml-auto`}
                >
                  Continue
                </button>
              ) : (
                <button type="button" onClick={finish} className={`${primaryButton} ml-auto`}>
                  <Icon name="check" size={15} strokeWidth={2.4} />
                  Connect Stripe
                </button>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-faint">
              Demo build: no real Stripe account is created and no payout is sent.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
