import { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "../../components/CodeBlock";
import { Footer } from "../../components/Footer";
import { Icon } from "../../components/Icon";
import { TopBar } from "../../components/TopBar";
import { Button, MethodChip, Pill, buttonClass, cn } from "../../components/ui";
import { DOCS_NAV } from "../../data/docs-nav";
import { ENDPOINTS_API, ENDPOINT_GROUPS } from "../../data/portal";
import { usePortal } from "../../lib/portal";
import { SEARCH_SHORTCUT } from "../../lib/platform";
import { Link, useRouter } from "../../lib/router";

export function ApiReference({ onSearch }: { onSearch: () => void }) {
  const { path, navigate } = useRouter();
  const { toast } = usePortal();
  const slug = path.split("/").filter(Boolean).pop() ?? "create-snag";
  const endpoint = useMemo(
    () => ENDPOINTS_API.find((item) => item.slug === slug) ?? ENDPOINTS_API[0]!,
    [slug],
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ body: string; status: string; id: string } | null>(null);

  useEffect(() => {
    setResult(null);
  }, [endpoint.slug]);

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setResult({
        body: endpoint.response,
        status:
          endpoint.slug === "replay-delivery"
            ? "202"
            : endpoint.method === "POST"
              ? "201"
              : endpoint.method === "DELETE"
                ? "204"
                : "200",
        id: `req_${Math.random().toString(36).slice(2, 10)}`,
      });
    }, 700);
  };

  const index = ENDPOINTS_API.findIndex((item) => item.slug === endpoint.slug);
  const previous = ENDPOINTS_API[index - 1];
  const next = ENDPOINTS_API[index + 1];

  return (
    <div className="min-h-screen bg-white">
      <TopBar onSearch={onSearch} />

      <div className="shell">
        <div className="flex flex-wrap items-center gap-2 border-b border-line py-2.5 text-[10.5px] text-faint">
          <Link to="/" className="hover:text-ink">
            Developers
          </Link>
          <Icon name="chevronRight" size={11} />
          <span>Docs</span>
          <Icon name="chevronRight" size={11} />
          <span className="text-ink-soft">API reference</span>
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <Icon name="clock" size={11} />
            Updated 27 Oct 2026
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 pb-16 pt-7 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-[80px] max-h-[calc(100vh-96px)] overflow-y-auto pr-2">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5">
                <Icon name="search" size={13} className="text-faint" />
                <span className="text-[11px] text-faint">Search docs</span>
                <span className="ml-auto rounded border border-line px-1 font-sans text-[9px] font-semibold text-muted">
                  {SEARCH_SHORTCUT}
                </span>
              </div>
              {DOCS_NAV.map((group) => (
                <div key={group.title} className="mt-5">
                  <p className="px-2 pb-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-faint">
                    {group.title}
                  </p>
                  <ul>
                    {group.items.map((item) => {
                      const active = item.to === path;
                      return (
                        <li key={`${group.title}-${item.label}`}>
                          <Link
                            to={item.to}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex h-7 w-full items-center rounded-md px-2 text-left text-[11.5px] transition-colors",
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

          <main className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="eyebrow">Reference</p>
                  <Pill tone="brand">v1</Pill>
                </div>
                <h1 className="mt-1.5 font-display text-[30px] font-extrabold leading-none tracking-[-0.04em]">
                  API reference
                </h1>
                <p className="mt-2 max-w-[64ch] text-[12.5px] leading-relaxed text-muted">
                  REST over HTTPS. JSON in, JSON out, one key per environment. Every response
                  carries a request id — quote it when something goes wrong.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/status" className={buttonClass("secondary", "sm", "h-8")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Status
                </Link>
                <Link to="/changelog" className={buttonClass("secondary", "sm", "h-8")}>
                  Changelog
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[276px_minmax(0,1fr)]">
              <div className="min-w-0">
                <div className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 xl:mx-0 xl:block xl:space-y-4 xl:overflow-visible xl:px-0">
                  {ENDPOINT_GROUPS.map((group) => (
                    <div key={group} className="shrink-0 xl:shrink">
                      <p className="mb-1.5 hidden text-[9px] font-extrabold uppercase tracking-[0.14em] text-faint xl:block">
                        {group}
                      </p>
                      <ul className="flex gap-1.5 xl:block xl:space-y-0.5">
                        {ENDPOINTS_API.filter((item) => item.group === group).map((item) => (
                          <li key={item.slug}>
                            <button
                              type="button"
                              onClick={() => navigate(`/docs/api/${item.slug}`)}
                              aria-current={endpoint.slug === item.slug ? "page" : undefined}
                              title={`${item.method} ${item.path}`}
                              className={cn(
                                "flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1.5 text-left transition-colors xl:w-full xl:items-start xl:border-0 xl:px-2 xl:py-1.5",
                                endpoint.slug === item.slug
                                  ? "border-brand/25 bg-brand-soft/70 text-ink xl:bg-surface"
                                  : "border-line text-muted hover:bg-surface/70 hover:text-ink",
                              )}
                            >
                              <MethodChip method={item.method} />
                              <span className="min-w-0 truncate font-mono text-[10.5px] leading-[1.5]">
                                <span className="xl:hidden">{item.summary}</span>
                                <span className="hidden xl:inline">
                                  {item.path.replace("/v1", "")}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <article className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <MethodChip method={endpoint.method} />
                  <h2 className="font-mono text-[16px] font-semibold tracking-[-0.01em]">
                    {endpoint.path}
                  </h2>
                  <button
                    type="button"
                    aria-label="Copy endpoint"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `https://api.snagchat.io${endpoint.path}`,
                      );
                      toast("Endpoint copied");
                    }}
                    className="text-faint transition-colors hover:text-brand"
                  >
                    <Icon name="copy" size={13} />
                  </button>
                </div>

                <h3 className="mt-3 font-display text-[21px] font-extrabold tracking-[-0.03em]">
                  {endpoint.summary}
                </h3>
                <p className="mt-1.5 max-w-[68ch] text-[12.5px] leading-relaxed text-muted">
                  {endpoint.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-line py-2 text-[10.5px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon name="lock" size={11} className="text-brand" />
                    <span className="font-mono text-[10px]">{endpoint.scopes}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="activity" size={11} className="text-brand" />
                    {endpoint.rate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="shield" size={11} className="text-brand" />
                    Signed requests
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {endpoint.notices.map((notice) => (
                    <p
                      key={notice}
                      className="flex items-start gap-2 rounded-lg bg-brand-tint px-2.5 py-2 text-[11px] leading-relaxed text-ink-soft"
                    >
                      <Icon name="spark" size={12} className="mt-[2px] shrink-0 text-brand" />
                      {notice}
                    </p>
                  ))}
                </div>

                <section className="mt-7">
                  <h3 className="text-[13px] font-semibold">
                    {endpoint.method === "GET" || endpoint.method === "DELETE"
                      ? "Parameters"
                      : "Body parameters"}
                  </h3>
                  <div className="scroll-thin mt-2 overflow-x-auto rounded-xl border border-line">
                    <table className="w-full min-w-[540px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-surface/60 text-[9px] uppercase tracking-[0.12em] text-faint">
                          <th className="px-3 py-2 font-bold">Name</th>
                          <th className="px-3 py-2 font-bold">Type</th>
                          <th className="px-3 py-2 font-bold">Required</th>
                          <th className="px-3 py-2 font-bold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {endpoint.params.map((param) => (
                          <tr key={param.name} className="align-top">
                            <td className="px-3 py-2.5 font-mono text-[11px] text-ink">{param.name}</td>
                            <td className="px-3 py-2.5 font-mono text-[10.5px] text-muted">{param.type}</td>
                            <td className="px-3 py-2.5">
                              {param.required ? (
                                <Pill tone="brand">required</Pill>
                              ) : (
                                <span className="text-[10.5px] text-faint">optional</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                              {param.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mt-7">
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="text-[13px] font-semibold">Request</h3>
                    <Link
                      to="/docs/quickstart"
                      className="text-[10.5px] font-semibold text-muted hover:text-ink"
                    >
                      Install the SDK
                    </Link>
                  </div>
                  <div className="mt-2">
                    <CodeBlock
                      tabs={[
                        { label: "cURL", code: endpoint.request.curl },
                        { label: "TypeScript", code: endpoint.request.typescript },
                        { label: "Python", code: endpoint.request.python },
                      ]}
                    />
                  </div>
                </section>

                <section className="mt-7">
                  <h3 className="text-[13px] font-semibold">Response</h3>
                  <div className="mt-2">
                    <CodeBlock code={endpoint.response} filename={endpoint.responseNote.split(".")[0] ?? "200"} />
                  </div>
                  <p className="mt-1.5 text-[10.5px] text-faint">{endpoint.responseNote}</p>
                </section>

                <section className="mt-7">
                  <h3 className="text-[13px] font-semibold">Errors</h3>
                  <div className="mt-2 overflow-hidden rounded-xl border border-line">
                    {endpoint.errors.map((error) => (
                      <div
                        key={error.code}
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 last:border-b-0"
                      >
                        <span className="num w-8 shrink-0 font-mono text-[10.5px] font-semibold text-danger">
                          {error.status}
                        </span>
                        <Link
                          to="/docs/errors"
                          className="shrink-0 font-mono text-[10.5px] font-semibold text-ink-soft underline decoration-line underline-offset-2 hover:decoration-ink"
                        >
                          {error.code}
                        </Link>
                        <span className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted">
                          {error.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-7 overflow-hidden rounded-xl border border-line">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon name="terminal" size={13} className="text-brand" />
                      <span className="text-[11.5px] font-semibold">Try it</span>
                      <Pill tone="test">Sandbox</Pill>
                      <span className="font-mono text-[10px] text-faint">sk_test_••••3f</span>
                    </div>
                    <span className="flex items-center gap-2">
                      {result ? (
                        <>
                          <Pill tone="success">{result.status}</Pill>
                          <span className="font-mono text-[10px] text-faint">{result.id}</span>
                        </>
                      ) : null}
                      <Button variant="primary" size="sm" onClick={run} disabled={running}>
                        <Icon name="play" size={12} />
                        {running ? "Sending…" : "Run request"}
                      </Button>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="border-b border-line p-3 md:border-b-0 md:border-r">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
                        Request
                      </p>
                      <pre className="scroll-thin mt-1.5 max-h-[300px] overflow-auto rounded-lg bg-surface px-2.5 py-2 font-mono text-[10px] leading-[1.7] text-ink-soft">
                        {endpoint.request.curl}
                      </pre>
                    </div>
                    <div className="p-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
                        Response
                      </p>
                      {result ? (
                        <pre className="scroll-thin mt-1.5 max-h-[300px] overflow-auto rounded-lg bg-code px-2.5 py-2 font-mono text-[10px] leading-[1.7] text-white/75">
                          {result.body}
                        </pre>
                      ) : (
                        <div className="mt-1.5 flex h-[calc(100%-22px)] min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-2 px-4 text-center">
                          <Icon name="terminal" size={16} className="text-faint" />
                          <p className="mt-2 text-[11px] font-semibold text-ink-soft">
                            Nothing sent yet
                          </p>
                          <p className="mt-0.5 max-w-[32ch] text-[10.5px] leading-relaxed text-muted">
                            Run the request against this app's sandbox. Nothing is published to the
                            live feed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
                    <p className="text-[10px] text-faint">
                      Sandbox responses are shaped like live ones, without side effects.
                    </p>
                    <Link
                      to="/console/apps/night-shift-ingest/keys"
                      className="text-[10px] font-semibold text-brand hover:text-brand-deep"
                    >
                      Use your own key
                    </Link>
                  </div>
                </section>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <div className="flex flex-wrap gap-2">
                    {previous ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/docs/api/${previous.slug}`)}
                        className={buttonClass("secondary", "sm", "h-8")}
                      >
                        <Icon name="arrowRight" size={12} className="rotate-180" />
                        {previous.summary}
                      </button>
                    ) : null}
                    {next ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/docs/api/${next.slug}`)}
                        className={buttonClass("secondary", "sm", "h-8")}
                      >
                        {next.summary}
                        <Icon name="arrowRight" size={12} />
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-faint">Was this useful?</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast("Thanks — noted", "Feedback is not stored in this preview.")}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast("Thanks — we will look at it", "Feedback is not stored in this preview.")}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
