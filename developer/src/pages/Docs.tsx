import { CodeBlock } from "../components/CodeBlock";
import { Footer } from "../components/Footer";
import { Icon } from "../components/Icon";
import { TopBar } from "../components/TopBar";
import { InlineCode, cn } from "../components/ui";
import { DOCS, type DocSection } from "../data/docs";
import { DOCS_NAV } from "../data/docs-nav";
import { Link, useRouter } from "../lib/router";

const ORDER = DOCS_NAV.flatMap((group) => group.items).filter((item) =>
  Object.keys(DOCS).some((slug) => item.to === `/docs/${slug}`),
);

export function DocsPage({ slug, onSearch }: { slug: string; onSearch: () => void }) {
  const { path } = useRouter();
  const doc = DOCS[slug];
  const index = ORDER.findIndex((item) => item.to === path);
  const previous = index > 0 ? ORDER[index - 1] : undefined;
  const next = index >= 0 && index < ORDER.length - 1 ? ORDER[index + 1] : undefined;

  if (!doc) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar onSearch={onSearch} />
        <div className="shell py-24 text-center">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">404</p>
          <h1 className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.04em]">
            That page is not in the docs.
          </h1>
          <Link to="/docs/quickstart" className="mt-4 inline-flex text-[12.5px] font-semibold text-brand">
            Start with the quickstart
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar onSearch={onSearch} />

      <div className="shell">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 border-b border-line py-2.5 text-[10.5px] text-faint"
        >
          <Link to="/" className="hover:text-ink">
            Developers
          </Link>
          <Icon name="chevronRight" size={11} />
          <Link to="/docs/quickstart" className="hover:text-ink">
            Docs
          </Link>
          <Icon name="chevronRight" size={11} />
          <span className="text-ink-soft">{doc.title}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <Icon name="clock" size={11} />
            Updated {doc.updated}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-8 pb-16 pt-7 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto pr-2">
              {DOCS_NAV.map((group) => (
                <div key={group.title} className="mb-4">
                  <p className="px-2 pb-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-faint">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = item.to === path;
                      return (
                        <li key={`${group.title}-${item.label}`}>
                          <Link
                            to={item.to}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "block rounded-md px-2 py-1.5 text-[11.5px] transition-colors",
                              active
                                ? "bg-surface font-semibold text-ink"
                                : "text-muted hover:bg-surface/70 hover:text-ink",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <article className="min-w-0 max-w-[760px]">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-brand">
              {doc.eyebrow}
            </p>
            <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em]">
              {doc.title}
            </h1>
            <p className="mt-3 max-w-[68ch] text-[13px] leading-relaxed text-ink-soft">{doc.intro}</p>

            <div className="mt-7 space-y-7">
              {doc.sections.map((section) => (
                <Section key={section.h} section={section} />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              {previous ? (
                <Link
                  to={previous.to}
                  className="group inline-flex flex-col text-[11px] text-faint hover:text-ink"
                >
                  <span className="flex items-center gap-1">
                    <Icon name="arrowRight" size={11} className="rotate-180" />
                    Previous
                  </span>
                  <span className="mt-0.5 text-[12.5px] font-semibold text-ink-soft group-hover:text-brand">
                    {previous.label}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  to={next.to}
                  className="group inline-flex flex-col items-end text-[11px] text-faint hover:text-ink"
                >
                  <span className="flex items-center gap-1">
                    Next
                    <Icon name="arrowRight" size={11} />
                  </span>
                  <span className="mt-0.5 text-[12.5px] font-semibold text-ink-soft group-hover:text-brand">
                    {next.label}
                  </span>
                </Link>
              ) : (
                <span />
              )}
            </div>

            <p className="mt-8 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[11.5px] leading-relaxed text-muted">
              Something wrong or missing? The console keeps a request id on every call — send it with
              a note to <span className="font-medium text-ink-soft">developers@snagchat.io</span> and
              the page gets fixed.
            </p>
          </article>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ section }: { section: DocSection }) {
  return (
    <section id={section.h.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
      <h2 className="font-display text-[16px] font-extrabold tracking-[-0.025em]">{section.h}</h2>
      {section.p ? (
        <p className="mt-2 max-w-[68ch] text-[12.5px] leading-relaxed text-muted">{section.p}</p>
      ) : null}

      {section.list ? (
        <ul className="mt-2.5 space-y-1.5">
          {section.list.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft">
              <Icon name="check" size={13} className="mt-[3px] shrink-0 text-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.table ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
                {section.table.head.map((cell) => (
                  <th key={cell} className="px-3 py-2 font-extrabold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {section.table.rows.map((row) => (
                <tr key={row.join("|")} className="text-[11.5px]">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${cell}-${cellIndex}`}
                      className={cn(
                        "px-3 py-2 align-top",
                        cellIndex === 0 ? "font-mono text-[10.5px] text-ink-soft" : "text-muted",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {section.code ? (
        <div className="mt-3">
          <CodeBlock code={section.code} filename={section.filename} />
        </div>
      ) : null}
    </section>
  );
}

/** The changelog lives outside the docs tree but reuses the same shell. */
export function ChangelogPage({ onSearch }: { onSearch: () => void }) {
  const entries = [
    {
      date: "27 Oct 2026",
      tag: "Added",
      title: "Catalogue aliases",
      body: "GET /v1/games resolves console names now, so a post tagged rustconsole lands on the same title as rust.",
    },
    {
      date: "21 Oct 2026",
      tag: "Changed",
      title: "Clip cap enforced at upload",
      body: "Clips over 60 seconds are refused with 422 clips.duration_too_long instead of being trimmed silently.",
    },
    {
      date: "14 Oct 2026",
      tag: "Added",
      title: "Webhook replay",
      body: "Any delivery in the retention window can be replayed from the console. Replays carry a manual flag.",
    },
    {
      date: "02 Oct 2026",
      tag: "Fixed",
      title: "Idempotency on snag creation",
      body: "Two retries of the same Idempotency-Key now return the first response instead of a duplicate post.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <TopBar onSearch={onSearch} />
      <div className="shell max-w-[820px] py-12">
        <p className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-brand">Changelog</p>
        <h1 className="mt-2 font-display text-[32px] font-extrabold leading-[1.04] tracking-[-0.04em]">
          What changed, and when.
        </h1>
        <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-muted">
          Every breaking change is announced here at least two weeks before it ships. Subscribe by
          RSS, or watch this page in the console.
        </p>

        <ol className="mt-8 border-l border-line pl-5">
          {entries.map((entry) => (
            <li key={entry.title} className="relative pb-7">
              <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-brand" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-faint">{entry.date}</span>
                <span className="rounded-full border border-brand/15 bg-brand-soft px-2 py-[2px] text-[9.5px] font-bold uppercase tracking-[0.08em] text-brand-deep">
                  {entry.tag}
                </span>
              </div>
              <h2 className="mt-1 font-display text-[16px] font-extrabold tracking-[-0.025em]">
                {entry.title}
              </h2>
              <p className="mt-1 max-w-[62ch] text-[12px] leading-relaxed text-muted">{entry.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-2 text-[11px] text-muted">
          Older entries live in <InlineCode>/changelog/2025</InlineCode> — ask support if you need one.
        </p>
      </div>
      <Footer />
    </div>
  );
}
