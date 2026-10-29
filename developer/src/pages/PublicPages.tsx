import { useState } from "react";
import { Footer } from "../components/Footer";
import { Icon } from "../components/Icon";
import { TopBar } from "../components/TopBar";
import { Button, Pill, buttonClass, cn } from "../components/ui";
import { usePortal } from "../lib/portal";
import { Link, useRouter } from "../lib/router";

const COMPONENTS = [
  { name: "API", uptime: "99.98%", state: "ok" },
  { name: "Webhooks", uptime: "99.94%", state: "ok" },
  { name: "Console", uptime: "100%", state: "ok" },
  { name: "Embeds", uptime: "100%", state: "ok" },
];

const INCIDENTS = [
  {
    date: "Oct 21, 2026",
    title: "Webhook deliveries delayed",
    body: "A queue backlog delayed deliveries by up to 9 minutes for 40 minutes. Events were replayed automatically once the queue drained; nothing was lost.",
    state: "Resolved",
  },
  {
    date: "Oct 8, 2026",
    title: "Clip ingest degraded",
    body: "Poster frames took longer than usual while an encoding worker pool was replaced. Uploads were accepted throughout.",
    state: "Resolved",
  },
];

const BARS = [
  "ok", "ok", "ok", "ok", "warn", "ok", "ok", "ok", "ok", "ok",
  "ok", "ok", "ok", "down", "ok", "ok", "ok", "ok", "ok", "ok",
  "ok", "ok", "warn", "ok", "ok", "ok", "ok", "ok", "ok", "ok",
] as const;

export function StatusPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();

  return (
    <div className="min-h-screen bg-white">
      <TopBar onSearch={onSearch} />

      <div className="shell max-w-[880px] py-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-brand">Status</p>
            <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em]">
              All systems normal.
            </h1>
            <p className="mt-2 text-[12px] text-muted">
              Measured from three regions, not from a single box. Updated every 60 seconds.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => toast("Subscribed", "We email only when something breaks")}>
            <Icon name="check" size={13} />
            Subscribe to updates
          </Button>
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-line">
          <div className="flex items-center gap-2.5 border-b border-line bg-success-soft/60 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-success" />
            <p className="text-[12px] font-semibold text-success">Operational · 30-day uptime 99.97%</p>
            <span className="ml-auto font-mono text-[10px] text-success/80">checked 14:06 UTC</span>
          </div>
          <ul className="divide-y divide-line">
            {COMPONENTS.map((component) => (
              <li key={component.name} className="flex items-center gap-3 px-4 py-3">
                <span className="w-[118px] shrink-0 text-[12px] font-medium">{component.name}</span>
                <span className="flex flex-1 items-center gap-[2px]" aria-hidden="true">
                  {BARS.map((tone, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-5 flex-1 rounded-[2px]",
                        tone === "ok"
                          ? "bg-success/70"
                          : tone === "warn"
                            ? "bg-warn/70"
                            : "bg-danger/70",
                      )}
                    />
                  ))}
                </span>
                <span className="num w-14 shrink-0 text-right font-mono text-[10.5px] text-muted">
                  {component.uptime}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-2 text-[10px] text-faint">
            Each bar is one day. Hover is not part of this preview; the incident below explains the red
            bar on Oct 14.
          </p>
        </section>

        <h2 className="mt-9 font-display text-[18px] font-extrabold tracking-[-0.03em]">Past incidents</h2>
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {INCIDENTS.map((incident) => (
            <li key={incident.title} className="py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10.5px] text-faint">{incident.date}</span>
                <Pill tone="success">{incident.state}</Pill>
              </div>
              <p className="mt-1 text-[12.5px] font-semibold">{incident.title}</p>
              <p className="mt-1 max-w-[70ch] text-[11.5px] leading-relaxed text-muted">{incident.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3">
          <Icon name="external" size={14} className="text-brand" />
          <p className="text-[11.5px] text-muted">
            Incident notifications are emailed to every Admin on the app. Keys do not need to be
            rotated after an incident unless we say so.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const LEGAL: Record<
  string,
  { title: string; intro: string; sections: Array<{ h: string; body: string }> }
> = {
  terms: {
    title: "Developer Terms",
    intro:
      "These terms cover the developer portal: the console, the API, webhooks and embeds. This build is a preview and runs on local mock data.",
    sections: [
      {
        h: "Your account and apps",
        body: "You need a verified email to create an application. You are responsible for everything posted with your keys, including anything a third-party tool does with a key you issued.",
      },
      {
        h: "Keys and secrets",
        body: "Keep secrets out of client bundles and repositories. A leaked live key must be rotated immediately; the console keeps a 24-hour overlap so rotation costs you no downtime.",
      },
      {
        h: "Content",
        body: "You keep ownership of the clips and artwork you upload. By publishing, you allow SnagChat to show that content to the audience your visibility settings allow, and to reviewers while a report is checked.",
      },
      {
        h: "Plans and overage",
        body: "The free plan includes 1,000 requests a month and one app. Scale raises the limits and adds audit export; overage is billed monthly at the published rate and never applied retroactively.",
      },
      {
        h: "Suspension",
        body: "We may disable a key or return an app to review if it breaks the guidelines. Deliberate abuse, cheating tools and stolen accounts end the agreement.",
      },
      {
        h: "Changes",
        body: "Breaking API changes are announced in the changelog at least two weeks before they ship. Continuing to use the API after that date means you accept the change.",
      },
    ],
  },
  privacy: {
    title: "Developer Privacy",
    intro:
      "What the developer portal stores, where it goes and how to get rid of it. In this preview, everything lives in your browser tab and nothing is uploaded.",
    sections: [
      {
        h: "What we store",
        body: "Organisation and member details, app names, key labels and hashes, webhook endpoint URLs and delivery bodies for the retention window, and request metadata for seven days.",
      },
      {
        h: "What we never store",
        body: "A key secret after it is shown once. Player passwords. The contents of clips your app only reads. Card details, which stay with the payment processor.",
      },
      {
        h: "Retention",
        body: "Request metadata is kept seven days, delivery bodies the same, audit entries one year. You can lower the log window in Settings; you cannot raise it beyond your plan.",
      },
      {
        h: "Export and deletion",
        body: "Settings can export your organisation as an archive and delete it. Deletion revokes every key and endpoint, and cannot be undone.",
      },
      {
        h: "Processors",
        body: "Payments run through Stripe. Email runs through a transactional provider. Neither receives clip content. A current list is available on request.",
      },
      {
        h: "Contact",
        body: "Privacy questions go to privacy@snagchat.io. We answer within five working days.",
      },
    ],
  },
};

export function LegalPage({ doc }: { doc: "terms" | "privacy" }) {
  const page = LEGAL[doc] ?? LEGAL.terms!;
  const other = doc === "terms" ? "/legal/privacy" : "/legal/terms";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="shell flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/brand/snagchat-wordmark.png" alt="SnagChat" className="h-9 w-auto" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
              Developers
            </span>
          </Link>
          <Link to={other} className="text-[11.5px] font-semibold text-brand hover:text-brand-deep">
            {doc === "terms" ? "Privacy" : "Terms"}
          </Link>
        </div>
      </header>

      <div className="shell max-w-[760px] py-12">
        <h1 className="font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em]">
          {page.title}
        </h1>
        <p className="mt-2 text-[11px] text-faint">Last updated 27 October 2026</p>
        <p className="mt-4 max-w-[68ch] text-[12.5px] leading-relaxed text-ink-soft">{page.intro}</p>

        <div className="mt-8 space-y-6">
          {page.sections.map((section) => (
            <section key={section.h}>
              <h2 className="font-display text-[15px] font-extrabold tracking-[-0.02em]">{section.h}</h2>
              <p className="mt-1.5 max-w-[68ch] text-[12px] leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11.5px]">
          <Link to="/docs/guidelines" className="font-semibold text-brand hover:text-brand-deep">
            Read the developer guidelines
          </Link>
          <Link to="/" className="text-muted hover:text-ink">
            Back to the portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SignInPage() {
  const { navigate } = useRouter();
  const { toast } = usePortal();
  const [email, setEmail] = useState("koba@nightshift.gg");
  const [password, setPassword] = useState("nightshift");

  const submit = () => {
    if (!email.includes("@")) {
      toast("Enter a valid email", "The one you signed up with.", "danger");
      return;
    }
    toast("Signed in", "Night Shift Studio · Owner");
    navigate("/console");
  };

  return (
    <div className="grid min-h-screen bg-brand-tint lg:grid-cols-[minmax(0,1fr)_520px]">
      <div className="hidden flex-col justify-between border-r border-line bg-white p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/brand/snagchat-wordmark.png" alt="SnagChat" className="h-10 w-auto" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
            Developers
          </span>
        </Link>
        <div className="max-w-[420px]">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-brand">
            Console
          </p>
          <h1 className="mt-2 font-display text-[32px] font-extrabold leading-[1.02] tracking-[-0.04em]">
            Your keys, your deliveries, your catalogue.
          </h1>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            Sign in to reveal a test key, replay a delivery or claim a title. Live keys always ask for
            a fresh sign-in, so a shared laptop cannot leak production traffic.
          </p>
        </div>
        <p className="text-[10.5px] text-faint">developer.snagchat.io · api.snagchat.io</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src="/brand/snagchat-wordmark.png" alt="SnagChat" className="h-9 w-auto" />
          </Link>
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.03em]">Sign in</h2>
          <p className="mt-1 text-[11.5px] text-muted">Use the email on your organisation.</p>

          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-[12.5px] outline-none transition-colors focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
                className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-[12.5px] outline-none transition-colors focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <button type="button" onClick={submit} className={buttonClass("primary", "md", "h-10 w-full")}>
              Sign in
            </button>
            <button
              type="button"
              onClick={() => toast("Magic link sent", email)}
              className={buttonClass("secondary", "md", "h-10 w-full")}
            >
              Email me a sign-in link
            </button>
          </div>

          <p className="mt-4 rounded-lg border border-line bg-white px-3 py-2.5 text-[10.5px] leading-relaxed text-muted">
            Preview build: any password works and nothing leaves this tab. Sign in to see the console
            signed in as <span className="font-medium text-ink-soft">koba@nightshift.gg</span>.
          </p>

          <p className="mt-5 text-[11px] text-muted">
            New here?{" "}
            <Link to="/docs/quickstart" className="font-semibold text-brand hover:text-brand-deep">
              Start with the quickstart
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
