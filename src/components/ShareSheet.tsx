import { useState } from "react";
import { findPlayer, PLAYERS } from "../data/players";
import type { Squad } from "../data/squads";
import type { Snag } from "../data/snags";
import { copyShareLink, postShareUrl, shareLink, type ShareOutcome } from "../lib/share";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type Recipient = { kind: "squad"; id: string } | { kind: "player"; id: string };

type ShareSheetProps = {
  snag: Snag;
  squads: Squad[];
  quick: boolean;
  onClose: () => void;
  onSendToPlayer: (playerId: string, message: string, snag: Snag) => void;
  onOpenAuthor: () => void;
  /** Fired once a share actually lands, so the post's share count can move. */
  onShared: () => void;
};

const SEND_TO_PLAYERS = PLAYERS.filter((player) => player.id !== "you").slice(0, 8);

export function ShareSheet({
  snag,
  squads,
  quick,
  onClose,
  onSendToPlayer,
  onOpenAuthor,
  onShared,
}: ShareSheetProps) {
  const [recipient, setRecipient] = useState<Recipient>(
    squads.length > 0
      ? { kind: "squad", id: squads[0].id }
      : { kind: "player", id: SEND_TO_PLAYERS[0].id },
  );
  const [message, setMessage] = useState(quick ? `Check out this snag: ${snag.title}` : "");
  const [sent, setSent] = useState(false);
  const [linkStatus, setLinkStatus] = useState<ShareOutcome | null>(null);

  const link = postShareUrl(snag.id);

  const shareThisLink = async () => {
    const outcome = await shareLink({
      title: `${snag.title} on SnagChat`,
      text: `${snag.title} — @${snag.creator} on SnagChat`,
      url: link,
    });
    setLinkStatus(outcome);
    if (outcome === "shared" || outcome === "copied") onShared();
  };

  const copyThisLink = async () => {
    const outcome = await copyShareLink(link);
    setLinkStatus(outcome);
    if (outcome === "shared" || outcome === "copied") onShared();
  };

  const squad = recipient.kind === "squad" ? squads.find((item) => item.id === recipient.id) : undefined;
  const player = recipient.kind === "player" ? findPlayer(recipient.id) : undefined;
  const targetName = squad ? squad.name : `@${player?.handle ?? "player"}`;

  const handleSend = () => {
    onShared();
    if (recipient.kind === "player" && player) {
      onSendToPlayer(player.id, message, snag);
      return;
    }
    setSent(true);
  };

  return (
    <Sheet labelledBy="share-title" onClose={onClose}>
      {sent && squad ? (
        <div role="status" aria-live="polite" className="py-3 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
            <Icon name="check" size={26} strokeWidth={2.2} />
          </span>
          <h2
            id="share-title"
            className="mt-4 font-display text-[23px] font-extrabold leading-tight tracking-[-0.045em]"
          >
            Snagged to {squad.name}.
          </h2>
          <p className="mx-auto mt-2 max-w-[36ch] text-[12.5px] leading-relaxed text-muted">
            {squad.members.length} squad members got this in their chat. This preview keeps everything on the device.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-11 w-full rounded-xl bg-ink text-[13px] font-semibold text-white transition-colors hover:bg-[#22252a]"
          >
            Back to the feed
          </button>
          <p className="mt-3 text-[10px] leading-relaxed text-faint">
            Connect your squad messaging endpoint to deliver this for real.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
                {quick ? "Quick share" : "Snag to squad"}
              </p>
              <h2
                id="share-title"
                className="mt-1.5 font-display text-[24px] font-extrabold leading-[1.05] tracking-[-0.05em]"
              >
                Send it to your squad.
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Send it to a squad chat or straight to one player.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-[#4d535c] transition-colors hover:bg-line"
            >
              <Icon name="close" size={17} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line p-2.5">
            <img src={snag.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" draggable={false} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[13px] font-bold tracking-[-0.01em]">{snag.title}</p>
              <button
                type="button"
                onClick={onOpenAuthor}
                className="mt-1 flex max-w-full items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink"
                aria-label={`Open @${snag.creator}'s profile`}
              >
                <span className="truncate">
                  {snag.game} · @{snag.creator}
                </span>
                <span className="shrink-0 font-semibold text-brand">View</span>
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-surface p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Share a link</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Anyone who opens it lands on this snag.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={shareThisLink}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink text-[12px] font-semibold text-white transition-colors hover:bg-[#22252a]"
              >
                <Icon name="share" size={17} strokeWidth={2} />
                Share
              </button>
              <button
                type="button"
                onClick={copyThisLink}
                className="h-10 rounded-xl border border-line bg-white px-3.5 text-[12px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                Copy link
              </button>
            </div>
            <p aria-live="polite" className="mt-1.5 min-h-[14px] text-[10.5px] font-medium text-brand">
              {linkStatus === "copied"
                ? "Link copied — paste it anywhere."
                : linkStatus === "shared"
                  ? "Shared."
                  : linkStatus === "failed"
                    ? "This browser blocked the clipboard — long-press the link below."
                    : ""}
            </p>
            <p className="break-all text-[10px] leading-relaxed text-faint">{link}</p>
          </div>

          {squads.length > 0 ? (
            <>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Squads</p>
              <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                {squads.map((item) => {
                  const isSelected = recipient.kind === "squad" && recipient.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setRecipient({ kind: "squad", id: item.id })}
                      className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[11.5px] font-semibold transition-colors ${
                        isSelected
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                      }`}
                    >
                      <Avatar name={item.name} size={22} tone={isSelected ? "glass" : "soft"} />
                      {item.name}
                      <span className={`text-[10px] font-medium ${isSelected ? "text-white/60" : "text-faint"}`}>
                        {item.members.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">Players</p>
          <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            {SEND_TO_PLAYERS.map((item) => {
              const isSelected = recipient.kind === "player" && recipient.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setRecipient({ kind: "player", id: item.id })}
                  className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[11.5px] font-semibold transition-colors ${
                    isSelected
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-[#4d535c] hover:border-[#d8dce1]"
                  }`}
                >
                  <Avatar
                    name={item.name}
                    size={22}
                    tone={isSelected ? "glass" : "soft"}
                    src={item.avatar}
                  />
                  @{item.handle}
                </button>
              );
            })}
          </div>

          <label
            htmlFor="squad-message"
            className="mt-4 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
          >
            Message
          </label>
          <textarea
            id="squad-message"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Say why this one is worth a look"
            className="mt-2 w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-brand/10"
          />

          <button
            type="button"
            onClick={handleSend}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Send to {targetName}
            <Icon name="send" size={16} strokeWidth={2} />
          </button>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-faint">
            Hold any card in the feed for a quick share.
          </p>
        </>
      )}
    </Sheet>
  );
}
