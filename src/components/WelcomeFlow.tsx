import { useState, type ChangeEvent } from "react";
import { CATEGORIES, type FeedFilter } from "../data/snags";
import { AVATAR_SIZE, fileToDataUrl, UPLOAD_HINTS } from "../lib/imageUpload";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export type WelcomeValues = {
  name: string;
  handle: string;
  avatar?: string;
  filter: FeedFilter;
};

type WelcomeFlowProps = {
  defaultName: string;
  defaultHandle: string;
  defaultAvatar?: string;
  onFinish: (values: WelcomeValues) => void;
  onSkip: () => void;
};

const FILTER_BLURB: Record<FeedFilter, string> = {
  "For You": "Everything, ranked for you",
  Clips: "Gameplay moments worth a rewatch",
  Loadouts: "Builds, guns and gear",
  Skins: "Character, weapon and vehicle skins",
  Builds: "Bases and photo mode",
  "Squad Galleries": "Posts that live inside a squad",
};

const HIGHLIGHTS = [
  {
    icon: "share" as const,
    title: "Snag anything",
    body: "Clips, loadouts and base builds. Hold a card to send it straight to a squad.",
  },
  {
    icon: "users" as const,
    title: "Squads with galleries",
    body: "Every squad owns its gallery — an owner, members, and posts only they see.",
  },
  {
    icon: "user" as const,
    title: "Players worth following",
    body: "Follow the people you queue with, message them, and share their profile.",
  },
];

/**
 * The moves a new player needs on day one, grouped the way the app is. Every
 * line here describes something the build actually does, so nobody is told to
 * look for a button that is not there.
 */
type HowToItem = { icon: Parameters<typeof Icon>[0]["name"]; title: string; body: string };

const HOW_TO: { section: string; items: HowToItem[] }[] = [
  {
    section: "In the feed",
    items: [
      {
        icon: "share",
        title: "Hold a card to quick-share",
        body: "Press and hold any post and a ring of your squads and chats blooms around your thumb. Slide onto one and let go — it lands in that gallery or DM.",
      },
      {
        icon: "heart",
        title: "Tap to open, double tap to like",
        body: "One tap opens the post with its comments and shares. Two quick taps on the artwork like it without leaving the feed.",
      },
      {
        icon: "bookmark",
        title: "Swipe a card, swipe the feed",
        body: "Swipe right to like and left to save for later. On a phone, swipe the feed itself to move between tabs.",
      },
    ],
  },
  {
    section: "Posting and squads",
    items: [
      {
        icon: "plus",
        title: "Post with the +",
        body: "The purple + takes a clip, loadout, base build or skin. MP4 clips up to 50 MB, plus up to four #tags and @mentions on one post.",
      },
      {
        icon: "users",
        title: "Squads own their gallery",
        body: "Owners invite and remove members and can hand the squad over; only an owner can delete it. Everyone in a squad can post to its gallery.",
      },
    ],
  },
  {
    section: "People and your profile",
    items: [
      {
        icon: "message",
        title: "Message any player",
        body: "The message icon on a profile opens a private chat. Any thread can be set to vanish after 24 hours, or as soon as it has been viewed once.",
      },
      {
        icon: "settings",
        title: "Make it yours",
        body: "Profile settings hold your privacy, who can follow or invite you, downloading your data, and the radial dial you just learned.",
      },
    ],
  },
];

export function WelcomeFlow({ defaultName, defaultHandle, defaultAvatar, onFinish, onSkip }: WelcomeFlowProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [handle, setHandle] = useState(defaultHandle.replace(/^@+/, ""));
  const [avatar, setAvatar] = useState<string | undefined>(defaultAvatar);
  const [filter, setFilter] = useState<FeedFilter>("For You");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanHandle = handle.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9._-]/g, "");

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      setAvatar(await fileToDataUrl(file, AVATAR_SIZE));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "That image could not be used.");
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadAvatar(event.target.files?.[0]);
    event.target.value = "";
  };

  const goToDetails = () => {
    setError(null);
    setStep(1);
  };

  const finishDetails = () => {
    if (!name.trim()) {
      setError("Add a display name — it is what squads see.");
      return;
    }
    if (cleanHandle.length < 2) {
      setError("Pick a handle of at least 2 characters.");
      return;
    }
    setError(null);
    setStep(3);
  };

  const finish = () => {
    onFinish({
      name: name.trim(),
      handle: cleanHandle,
      avatar,
      filter,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === step ? "w-7 bg-brand" : index < step ? "w-4 bg-brand/40" : "w-4 bg-line"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-[11.5px] font-semibold text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Skip
          </button>
        </div>

        {step === 0 ? (
          <section aria-labelledby="welcome-title" className="flex flex-1 flex-col pt-8">
            <img
              src="/brand/snagchat-icon.png"
              alt="SnagChat"
              className="h-20 w-auto self-center"
              draggable={false}
            />
            <p className="mt-7 text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-brand">
              Welcome to SnagChat
            </p>
            <h1
              id="welcome-title"
              className="mt-3 font-display text-[34px] font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-[40px]"
            >
              Snag it. Share it. <span className="text-brand">Run it</span> with your squad.
            </h1>
            <p className="mt-3 max-w-[42ch] text-[13.5px] leading-relaxed text-muted">
              One feed for the clips, loadouts and base builds you actually play with — and a squad gallery for the
              people you queue with.
            </p>

            <ul className="mt-7 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={item.icon} size={18} strokeWidth={2} inline />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold tracking-[-0.01em]">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={goToDetails}
                className="h-[52px] w-full rounded-[14px] bg-brand text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Show me how it works
              </button>
              <p className="mt-3 text-center text-[10.5px] leading-relaxed text-faint">
                Three quick steps — you can change all of it later in your profile.
              </p>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section aria-labelledby="welcome-how-title" className="flex flex-1 flex-col pt-8">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-brand">Step 2 of 4</p>
            <h1
              id="welcome-how-title"
              className="mt-3 font-display text-[32px] font-extrabold leading-[0.96] tracking-[-0.05em]"
            >
              How SnagChat works.
            </h1>
            <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-muted">
              A handful of gestures cover almost everything. Here is the whole platform, in the order you will use
              it.
            </p>

            <div className="mt-5 space-y-5">
              {HOW_TO.map((group) => (
                <div key={group.section}>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]">
                    {group.section}
                  </p>
                  <ul className="mt-2 space-y-3">
                    {group.items.map((item) => (
                      <li key={item.title} className="flex gap-3">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                          <Icon name={item.icon} size={16} strokeWidth={2} inline />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold tracking-[-0.01em]">{item.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{item.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-auto flex gap-2 pt-8">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="h-12 rounded-[14px] border border-line px-4 text-[13px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 flex-1 rounded-[14px] bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Set up your profile
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section aria-labelledby="welcome-profile-title" className="flex flex-1 flex-col pt-8">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-brand">Step 3 of 4</p>
            <h1
              id="welcome-profile-title"
              className="mt-3 font-display text-[32px] font-extrabold leading-[0.96] tracking-[-0.05em]"
            >
              Make it yours.
            </h1>
            <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-muted">
              This is what your squad sees on posts, in chats and on your profile.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <Avatar name={name || "You"} size={76} tone="brand" src={avatar} className="font-display" />
              <div>
                <label
                  htmlFor="welcome-avatar"
                  className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line px-3.5 text-[11.5px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
                >
                  {busy ? "Processing…" : avatar ? "Change photo" : "Upload photo"}
                </label>
                <input
                  id="welcome-avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={onFileChange}
                />
                <p className="mt-1.5 max-w-[24ch] text-[10px] leading-relaxed text-faint">
                  {UPLOAD_HINTS.avatar}
                </p>
              </div>
            </div>

            <label
              htmlFor="welcome-name"
              className="mt-6 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
            >
              Display name
            </label>
            <input
              id="welcome-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="How your squad sees you"
              maxLength={32}
              className="mt-1.5 h-12 w-full rounded-xl border border-line px-3.5 text-[14px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
            />

            <label
              htmlFor="welcome-handle"
              className="mt-4 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4d535c]"
            >
              Handle
            </label>
            <div className="mt-1.5 flex h-12 items-center gap-1 rounded-xl border border-line px-3.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
              <span className="text-[14px] text-faint">@</span>
              <input
                id="welcome-handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="yourhandle"
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-full w-full bg-transparent text-[14px] outline-none"
              />
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">
              {cleanHandle.length >= 2
                ? `You will show up as @${cleanHandle}.`
                : "Letters, numbers, dots, dashes and underscores."}
            </p>

            {error ? (
              <p role="alert" className="mt-3 rounded-xl bg-[#fdeceb] px-3 py-2 text-[11.5px] font-medium text-[#b3261e]">
                {error}
              </p>
            ) : null}

            <div className="mt-auto flex gap-2 pt-8">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="h-12 rounded-[14px] border border-line px-4 text-[13px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finishDetails}
                className="h-12 flex-1 rounded-[14px] bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="welcome-feed-title" className="flex flex-1 flex-col pt-8">
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-brand">Step 4 of 4</p>
            <h1
              id="welcome-feed-title"
              className="mt-3 font-display text-[32px] font-extrabold leading-[0.96] tracking-[-0.05em]"
            >
              Where should the feed start?
            </h1>
            <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-muted">
              Pick a starting filter. The whole feed is always one tap away in the filter rail.
            </p>

            <div className="mt-5 grid gap-2" role="radiogroup" aria-label="Feed filter">
              {CATEGORIES.map((option) => {
                const selected = filter === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFilter(option)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                      selected ? "border-brand bg-brand-soft/60" : "border-line hover:border-[#d8dce1]"
                    }`}
                  >
                    <span>
                      <span className="block text-[13px] font-bold tracking-[-0.01em]">{option}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{FILTER_BLURB[option]}</span>
                    </span>
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        selected ? "border-brand bg-brand text-white" : "border-line text-transparent"
                      }`}
                    >
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex gap-2 pt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 rounded-[14px] border border-line px-4 text-[13px] font-semibold text-[#4d535c] transition-colors hover:border-[#d8dce1]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                className="h-12 flex-1 rounded-[14px] bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Start exploring
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
