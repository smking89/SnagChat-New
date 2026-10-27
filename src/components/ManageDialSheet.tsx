import { useState } from "react";
import { DIAL_SLOTS, type DialConfig, type DialPlan, type DialTarget } from "../lib/dial";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type ManageDialSheetProps = {
  /** Everyone the dial can hold: your squads and your recent chats. */
  roster: DialTarget[];
  config: DialConfig;
  plan: DialPlan;
  onSetSlots: (slots: string[]) => void;
  onToggleSmart: (on: boolean) => void;
  onLock: (key: string) => void;
  /** Opens the dial over this sheet so the flick can be rehearsed. */
  onStartTest: (origin: { x: number; y: number }) => void;
  onInviteSquad: () => void;
  onQuickAdd: () => void;
  onClose: () => void;
};

const RING = 210;

/**
 * Manage radial dial. The top half is the dial itself, the bottom half is the
 * roster: tap a slot to pick it up, tap another to swap them, and tap a roster
 * row to drop it into the first open slot. Smart fill tops up whatever is left.
 */
export function ManageDialSheet({
  roster,
  config,
  plan,
  onSetSlots,
  onToggleSmart,
  onLock,
  onStartTest,
  onInviteSquad,
  onQuickAdd,
  onClose,
}: ManageDialSheetProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  // Find a player by name or @username, so any of them can take one of the four.
  const needle = query.trim().toLowerCase().replace(/^@/, "");
  const matches = needle
    ? roster.filter(
        (target) =>
          target.name.toLowerCase().includes(needle) ||
          (target.handle ?? "").toLowerCase().includes(needle),
      )
    : roster;

  const slots = Array.from({ length: DIAL_SLOTS }, (_, index) => plan.slots[index] ?? null);
  const shot = slots.find(Boolean);

  const setSlot = (index: number, key: string) => {
    const next = [...config.slots];
    next[index] = key;
    // A key can only live in one slot, so clear it out of any other one.
    if (key) {
      next.forEach((entry, at) => {
        if (at !== index && entry === key) next[at] = "";
      });
    }
    onSetSlots(next);
  };

  const swap = (index: number) => {
    if (picked === null) {
      setPicked(index);
      return;
    }
    if (picked === index) {
      setPicked(null);
      return;
    }
    const next = [...config.slots];
    const held = next[picked];
    next[picked] = next[index];
    next[index] = held;
    onSetSlots(next);
    setPicked(null);
  };

  const fillFirstOpen = (key: string) => {
    const open = config.slots.findIndex((entry) => !entry);
    if (open < 0) return;
    setSlot(open, key);
  };

  const empty = config.smart && plan.auto.length === 0 && plan.suggestions.length === 0;

  return (
    <Sheet labelledBy="dial-title" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Quick share</p>
          <h2
            id="dial-title"
            className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
          >
            Manage radial dial.
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Hold a card in the feed to bloom this ring. Pick up to four people, in whatever order you like.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 shrink-0 rounded-full bg-ink px-3.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#22252a]"
        >
          Done
        </button>
      </div>

      {/* The live preview doubles as the test rig for the flick itself. */}
      <div className="relative mx-auto mt-4" style={{ width: RING, height: RING }}>
        {slots.map((target, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / DIAL_SLOTS;
          const radius = RING / 2 - 34;
          const auto = plan.auto.includes(target?.key ?? "");
          const isPicked = picked === index;

          return (
            <button
              key={index}
              type="button"
              aria-label={
                target ? `Slot ${index + 1}: ${target.name}. Tap to swap or clear.` : `Slot ${index + 1}: open`
              }
              aria-pressed={isPicked}
              onClick={() => (target ? swap(index) : setPicked(index))}
              className={`absolute grid h-[58px] w-[58px] place-items-center rounded-full transition-transform ${
                isPicked ? "scale-110 ring-2 ring-brand" : ""
              } ${target ? "" : "border border-dashed border-brand/45"}`}
              style={{
                left: RING / 2 + Math.cos(angle) * radius - 29,
                top: RING / 2 + Math.sin(angle) * radius - 29,
              }}
            >
              {target ? (
                <span className={`relative h-full w-full rounded-full ${auto ? "smart-slot" : ""}`}>
                  <span className="absolute inset-0 grid place-items-center rounded-full bg-white">
                    <Avatar
                      name={target.name}
                      size={46}
                      tone={target.kind === "squad" ? "brand" : "soft"}
                      src={target.avatar}
                    />
                  </span>
                  {auto ? (
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                      <Icon name="plus" size={11} strokeWidth={3} />
                    </span>
                  ) : null}
                  <span
                    role="presentation"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSlot(index, "");
                    }}
                    className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-white"
                  >
                    <Icon name="close" size={10} strokeWidth={3} />
                  </span>
                </span>
              ) : (
                <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-brand">
                  Slot {index + 1}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onPointerDown={(event) => onStartTest({ x: event.clientX, y: event.clientY })}
          className="absolute left-1/2 top-1/2 grid h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-brand bg-brand-tint text-center text-[9px] font-bold uppercase leading-tight tracking-[0.06em] text-brand-deep transition-colors hover:bg-brand-soft"
        >
          Hold &amp; drag here to test
        </button>
      </div>

      <p className="mt-3 text-center text-[10.5px] leading-relaxed text-muted">
        {shot ? `${shot.name} sits in the top slot.` : "Every slot is open."} Tap a filled slot then another to swap
        them; tap the × to empty one.
      </p>

      {/* Smart fill: the engine tops up the open slots from live activity. */}
      <div className="mt-4 rounded-2xl bg-brand/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <Icon name="settings" size={13} strokeWidth={2.2} className="text-brand" />
              Smart suggestions
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              Automatically fill empty dial slots from your active sessions.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.smart}
            aria-label="Smart suggestions"
            onClick={() => onToggleSmart(!config.smart)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              config.smart ? "bg-brand" : "bg-[#d8dce1]"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                config.smart ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {empty ? (
          <div className="mt-3 rounded-xl bg-white/70 px-3 py-6 text-center">
            <span className="smart-breath mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <Icon name="compass" size={20} />
            </span>
            <p className="mt-3 font-display text-[14px] font-extrabold tracking-[-0.02em]">Waiting for liftoff</p>
            <p className="mx-auto mt-1 max-w-[34ch] text-[11px] leading-relaxed text-muted">
              Play a match, join a lobby or message your team to see this dial adapt in real time.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={onInviteSquad}
                className="h-9 rounded-full bg-brand px-3.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                + Invite squad
              </button>
              <button
                type="button"
                onClick={onQuickAdd}
                className="h-9 rounded-full border border-line bg-white px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                Quick-add top games
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
              Suggested slots
            </p>
            {config.smart ? (
              plan.suggestions.length > 0 ? (
                <ul className="mt-2 grid gap-1.5">
                  {plan.suggestions.slice(0, 3).map((suggestion) => {
                    const target = roster.find((entry) => entry.key === suggestion.key);
                    if (!target) return null;
                    const open = config.slots.some((entry) => !entry);
                    return (
                      <li
                        key={suggestion.key}
                        className="flex items-center gap-2.5 rounded-xl bg-white/80 px-2.5 py-2"
                      >
                        <Avatar
                          name={target.name}
                          size={30}
                          tone={target.kind === "squad" ? "brand" : "soft"}
                          src={target.avatar}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold text-ink">{target.name}</span>
                          <span className="mt-0.5 block truncate text-[10.5px] text-muted">{suggestion.reason}</span>
                        </span>
                        <button
                          type="button"
                          disabled={!open}
                          onClick={() => onLock(suggestion.key)}
                          className="h-8 shrink-0 rounded-full border border-line px-3 text-[11px] font-semibold text-[#4d535c] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {open ? "Lock slot" : "Full"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Nothing left to suggest — your four slots are covered.
                </p>
              )
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Turn smart suggestions on to let the dial fill itself from your sessions.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
            Who fills the dial
          </p>
          <button
            type="button"
            onClick={onQuickAdd}
            className="text-[11px] font-semibold text-brand"
          >
            Quick-add games
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Tap a player to put them in the next open slot — four picks in all.
        </p>

        <label className="mt-2 flex h-10 items-center gap-2 rounded-full border border-line px-3 focus-within:border-brand">
          <Icon name="search" size={15} className="text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a player by name or @username"
            aria-label="Find a player for the dial"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] font-semibold text-ink outline-none placeholder:text-faint"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear the player search"
              className="shrink-0 text-faint transition-colors hover:text-ink"
            >
              <Icon name="close" size={13} strokeWidth={2.6} />
            </button>
          ) : null}
        </label>

        {roster.length > 0 ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {matches.length === 0 ? (
              <p className="col-span-2 text-[11px] leading-relaxed text-muted">
                No player by that name yet — check the @username, or invite them to a squad.
              </p>
            ) : null}
            {matches.map((target) => {
              const slotted = config.slots.includes(target.key);
              return (
                <button
                  key={target.key}
                  type="button"
                  aria-pressed={slotted}
                  onClick={() => fillFirstOpen(target.key)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                    slotted ? "border-brand bg-brand-tint opacity-60" : "border-line hover:border-[#d8dce1]"
                  }`}
                >
                  <Avatar
                    name={target.name}
                    size={26}
                    tone={target.kind === "squad" ? "brand" : "soft"}
                    src={target.avatar}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink">{target.name}</span>
                  {slotted ? (
                    <Icon name="check" size={12} strokeWidth={3} className="shrink-0 text-brand" />
                  ) : (
                    <Icon name="plus" size={12} strokeWidth={2.6} className="shrink-0 text-faint" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            No squads or chats to place yet — invite a squad or start a chat and they turn up here.
          </p>
        )}
      </div>
    </Sheet>
  );
}
