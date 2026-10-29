import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../components/Icon";
import { Button, Panel, PanelHead, Pill, cn } from "../../components/ui";
import type { KeyRow } from "../../data/portal";
import { usePortal } from "../../lib/portal";

function maskSecret(secret: string) {
  return `${secret.slice(0, 11)}${"•".repeat(6)}${secret.slice(-4)}`;
}

export function KeysPanel({
  keys,
  env,
  onCopy,
  onCreate,
  onRotate,
  onRevoke,
  onRevealLive,
}: {
  keys: KeyRow[];
  env: "test" | "live";
  onCopy: (value: string) => void;
  onCreate: () => void;
  onRotate: (key: KeyRow) => void;
  onRevoke: (key: KeyRow) => void;
  onRevealLive: () => void;
}) {
  const { toast } = usePortal();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5">
        <Icon
          name={env === "test" ? "lock" : "shield"}
          size={14}
          className="mt-0.5 shrink-0 text-brand"
        />
        <p className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-muted">
          {env === "test" ? (
            <>
              Test keys are prefixed <span className="font-mono text-[11px]">sk_test_</span> and
              only ever see sandbox data. A test key can never publish to the live feed.
            </>
          ) : (
            <>
              Live keys stay masked until you re-authenticate. Creating one requires a step-up
              sign-in, so a pasted snippet cannot ship to production by accident.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() =>
            toast("Key safety", "Rotate with a 24-hour overlap, never in place; revoke instantly.")
          }
          className="text-[11px] font-semibold text-brand hover:text-brand-deep"
        >
          Key safety
        </button>
      </div>

      <Panel>
        <PanelHead
          title="Keys"
          hint={`${keys.length} of 10 · ${env === "test" ? "sandbox" : "live"} credentials`}
          action={
            <span className="hidden text-[10.5px] text-faint sm:inline">
              Last used is shown in your timezone
            </span>
          }
        />

        {keys.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface text-muted">
              <Icon name="key" size={18} />
            </span>
            <p className="mt-3 text-[12.5px] font-semibold">No {env} keys yet</p>
            <p className="mx-auto mt-1 max-w-[36ch] text-[11.5px] text-muted">
              Create one to make your first request. It is shown once, then only its last four
              characters.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={onCreate}>
              Create a key
            </Button>
          </div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[9px] font-bold uppercase tracking-[0.12em] text-faint">
                  <th className="px-4 py-2 font-bold">Name</th>
                  <th className="px-4 py-2 font-bold">Key</th>
                  <th className="hidden px-4 py-2 font-bold lg:table-cell">Scopes</th>
                  <th className="px-4 py-2 font-bold">Last used</th>
                  <th className="hidden px-4 py-2 font-bold md:table-cell">Expires</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {keys.map((key) => (
                  <tr key={key.id} className="group transition-colors hover:bg-surface/50">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12px] font-semibold">{key.label}</span>
                        {key.hidden ? <Pill tone="warn">Hidden</Pill> : null}
                      </div>
                      <p className="mt-0.5 text-[9.5px] text-faint">
                        Created Oct 24, 2026 · {key.env === "test" ? "sandbox" : "production"}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      {key.hidden ? (
                        <button
                          type="button"
                          onClick={onRevealLive}
                          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted transition-colors hover:text-brand"
                        >
                          <Icon name="lock" size={11} />
                          sk_live_••••••••••
                        </button>
                      ) : (
                        <span className="font-mono text-[10.5px] text-muted">
                          {maskSecret(key.secret)}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.slice(0, 2).map((scope) => (
                          <span
                            key={scope}
                            className="rounded bg-surface px-1.5 py-[2px] font-mono text-[9.5px] text-ink-soft"
                          >
                            {scope}
                          </span>
                        ))}
                        {key.scopes.length > 2 ? (
                          <span className="rounded bg-surface px-1.5 py-[2px] font-mono text-[9.5px] text-faint">
                            +{key.scopes.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="num px-4 py-2.5 text-[10.5px] text-muted">{key.lastUsed}</td>
                    <td className="num hidden px-4 py-2.5 text-[10.5px] text-muted md:table-cell">
                      {key.expires}
                    </td>
                    <td className="px-2 py-2.5">
                      <RowMenu
                        hidden={Boolean(key.hidden)}
                        onCopy={() => onCopy(key.secret)}
                        onReveal={onRevealLive}
                        onRotate={() => onRotate(key)}
                        onRevoke={() => onRevoke(key)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <p className="text-[10.5px] text-faint">
            Keys are hashed at rest. The full value is shown once, at creation.
          </p>
          <button
            type="button"
            onClick={() =>
              toast(
                "Rotation keeps both keys valid",
                "Deploy the new key, then revoke the old one inside 24 hours.",
              )
            }
            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-muted hover:text-ink"
          >
            How rotation works
            <Icon name="arrowUpRight" size={11} />
          </button>
        </div>
      </Panel>
    </div>
  );
}

function RowMenu({
  hidden,
  onCopy,
  onReveal,
  onRotate,
  onRevoke,
}: {
  hidden: boolean;
  onCopy: () => void;
  onReveal: () => void;
  onRotate: () => void;
  onRevoke: () => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPos(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) {
      setPos(null);
      return;
    }
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - 176, window.innerWidth - 184)),
    });
  };

  const item =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11.5px] transition-colors";

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-label="Key actions"
        aria-expanded={Boolean(pos)}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-surface hover:text-ink",
          pos && "bg-surface text-ink",
        )}
      >
        <Icon name="more" size={15} />
      </button>

      {pos
        ? createPortal(
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setPos(null)} />
              <div
                role="menu"
                style={{ top: pos.top, left: pos.left }}
                className="animate-panel fixed z-[61] w-[176px] rounded-xl border border-line bg-white p-1 shadow-lift"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPos(null);
                    if (hidden) onReveal();
                    else onCopy();
                  }}
                  className={cn(item, "text-ink-soft hover:bg-surface")}
                >
                  <Icon name={hidden ? "lock" : "copy"} size={13} className="text-faint" />
                  {hidden ? "Reveal key" : "Copy key"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPos(null);
                    onRotate();
                  }}
                  className={cn(item, "text-ink-soft hover:bg-surface")}
                >
                  <Icon name="refresh" size={13} className="text-faint" />
                  Rotate
                </button>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPos(null);
                    onRevoke();
                  }}
                  className={cn(item, "text-danger hover:bg-danger-soft")}
                >
                  <Icon name="trash" size={13} />
                  Revoke
                </button>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
