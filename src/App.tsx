import { useEffect, useMemo, useRef, useState } from "react";
import { AdvertiseScreen } from "./components/AdvertiseScreen";
import { AuthScreen } from "./components/AuthScreen";
import { BottomNav } from "./components/BottomNav";
import { ComposeSheet } from "./components/ComposeSheet";
import { EditSnagSheet } from "./components/EditSnagSheet";
import { FilterRail } from "./components/FilterRail";
import { LegalSheet } from "./components/LegalSheet";
import { ManageDialSheet } from "./components/ManageDialSheet";
import { InboxScreen, ThreadScreen } from "./components/MessagesScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { QuickShareDial } from "./components/QuickShareDial";
import { ReportSheet, type ReportMode } from "./components/ReportSheet";
import { ShareSheet } from "./components/ShareSheet";
import { ShopScreen } from "./components/ShopScreen";
import { SnagCard } from "./components/SnagCard";
import { SnagScreen, type CommentView } from "./components/SnagScreen";
import { SquadScreen } from "./components/SquadScreen";
import { SquadsScreen } from "./components/SquadsScreen";
import { StoriesRail } from "./components/StoriesRail";
import { StoryComposerSheet, type StoryDraft } from "./components/StoryComposerSheet";
import { StoryViewer } from "./components/StoryViewer";
import { Toast, type ToastMessage } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { TopGamesSheet } from "./components/TopGamesSheet";
import { WelcomeFlow } from "./components/WelcomeFlow";
import { SEED_COMMENTS, SEED_LIKES, SEED_SAVES, SEED_SHARES, type Comment } from "./data/engagement";
import {
  feeFor,
  loadoutFor,
  registerCustomFrames,
  type CreatorApplication,
  type Frame,
  type FrameLoadout,
  type FrameOrder,
  type FrameTarget,
  type FrameUse,
  type StripeAccount,
} from "./data/frames";
import { COPYRIGHT_YEAR, LEGAL_DOCS, findLegalDoc } from "./data/legal";
import { SEED_NOTIFICATIONS, type AppNotification } from "./data/notifications";
import { findPlayer, findPlayerId, ME, PLAYERS, type Player } from "./data/players";
import {
  CATEGORIES,
  nextCategory,
  SEED_SNAGS,
  type FeedFilter,
  type Snag,
  type SnagDraft,
} from "./data/snags";
import {
  canSeeGallery,
  SEED_INVITES,
  SEED_SQUADS,
  type Squad,
  type SquadInvite,
  type SquadMember,
  type SquadVisibility,
} from "./data/squads";
import {
  addStoryItem,
  freshStories,
  groupStories,
  hasSharedSnag,
  SEED_STORIES,
  type StoryGroupView,
  type StoryItem,
} from "./data/stories";
import {
  liveMessages,
  SEED_THREADS,
  type Thread,
  type ThreadMessage,
  type ThreadMode,
} from "./data/threads";
import { rankFeed } from "./engine/snagchat.ts";
import { deleteAccount, findAccount, handleForEmail, updateAccount, type Session } from "./lib/auth";
import {
  DIAL_DEFAULTS,
  deliveryLine,
  dialKey,
  normalizeDialConfig,
  planDial,
  type DialConfig,
  type DialFacts,
  type DialTarget,
} from "./lib/dial";
import { downloadJson } from "./lib/export";
import type { FollowPermission, InvitePermission } from "./lib/settings";
import { readShareTarget, type ShareTarget } from "./lib/share";
import { useSwipe } from "./lib/swipe";
import { usePersistentState } from "./lib/storage";
import type { NavTab } from "./types";

type ScreenState =
  | { kind: "profile"; playerId: string }
  | { kind: "notifications" }
  | { kind: "messages" }
  | { kind: "thread"; playerId: string }
  | { kind: "snag"; snagId: string }
  | { kind: "squads" }
  | { kind: "shop" }
  | { kind: "advertise" }
  | { kind: "squad"; squadId: string };

type ProfileFields = {
  name: string;
  handle: string;
  bio: string;
  avatar?: string;
  banner?: string;
  /** Keys for uploaded MP4 profile art held in the clip store. */
  avatarClip?: string;
  bannerClip?: string;
  interests?: string[];
  private?: boolean;
  verified?: boolean;
  followPermission?: FollowPermission;
  invitePermission?: InvitePermission;
};
type ShareState = { snag: Snag; quick: boolean };
/** An open quick-share dial, with where the finger went down. */
type DialState = { snag: Snag; at: { x: number; y: number }; test: boolean };

const ME_ID = "you";

export default function App() {
  const [mySnags, setMySnags] = usePersistentState<Snag[]>("snagchat:snags", []);
  const [removedSnags, setRemovedSnags] = usePersistentState<string[]>("snagchat:removed", []);
  const [follows, setFollows] = usePersistentState<string[]>("snagchat:follows", []);
  const [me, setMe] = usePersistentState<ProfileFields>("snagchat:me", {
    name: ME.name,
    handle: ME.handle,
    bio: ME.bio,
  });
  const [threads, setThreads] = usePersistentState<Record<string, Thread>>("snagchat:threads", SEED_THREADS);
  const [likes, setLikes] = usePersistentState<string[]>("snagchat:likes", []);
  const [saves, setSaves] = usePersistentState<string[]>("snagchat:saves", []);
  const [sharedSnags, setSharedSnags] = usePersistentState<string[]>("snagchat:shared", []);
  const [userComments, setUserComments] = usePersistentState<Record<string, Comment[]>>("snagchat:comments", {});
  const [squads, setSquads] = usePersistentState<Squad[]>("snagchat:squads", SEED_SQUADS);
  const [invites, setInvites] = usePersistentState<SquadInvite[]>("snagchat:squad-invites", SEED_INVITES);
  const [session, setSession] = usePersistentState<Session | null>("snagchat:session", null);
  const [onboarded, setOnboarded] = usePersistentState<boolean>("snagchat:onboarded", false);
  const [notifications, setNotifications] = usePersistentState<AppNotification[]>(
    "snagchat:notifications",
    SEED_NOTIFICATIONS,
  );
  const [reports, setReports] = usePersistentState<Record<string, { mode: ReportMode; reason: string; at: number }>>(
    "snagchat:reports",
    {},
  );
  const [report, setReport] = useState<{ snag: Snag; mode: ReportMode } | null>(null);

  // The shop: what you own, what you wear, what creators sell, and the seller's
  // Stripe account. All local to this browser — there is no server in the demo.
  const [ownedFrames, setOwnedFrames] = usePersistentState<string[]>("snagchat:frame-owned", []);
  const [frameLoadout, setFrameLoadout] = usePersistentState<FrameLoadout>("snagchat:frame-loadout", {});
  const [frameCreator, setFrameCreator] = usePersistentState<CreatorApplication>("snagchat:creator", {
    status: "none",
  });
  const [creatorProducts, setCreatorProducts] = usePersistentState<Frame[]>("snagchat:frame-products", []);
  const [stripeAccount, setStripeAccount] = usePersistentState<StripeAccount | null>("snagchat:stripe", null);
  const [frameOrders, setFrameOrders] = usePersistentState<FrameOrder[]>("snagchat:frame-orders", []);

  // Every avatar, card and nameplate resolves frames through findFrame, so the
  // published products are registered before anything renders.
  registerCustomFrames(creatorProducts);

  const [filter, setFilter] = useState<FeedFilter>("For You");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [share, setShare] = useState<ShareState | null>(null);
  const [dial, setDial] = useState<DialState | null>(null);
  const [dialConfigRaw, setDialConfigRaw] = usePersistentState<DialConfig>("snagchat:dial", DIAL_DEFAULTS);
  const [manageDial, setManageDial] = useState(false);
  const [topGames, setTopGames] = useState(false);
  const [customTags, setCustomTags] = usePersistentState<string[]>("snagchat:tags", []);
  /** Snags flicked into a squad gallery from the feed. */
  const [squadShares, setSquadShares] = usePersistentState<Snag[]>("snagchat:squad-shares", []);
  /** Your 24-hour stories, plus which items you have watched. */
  const [myStories, setMyStories] = usePersistentState<StoryItem[]>("snagchat:stories", []);
  const [seenStories, setSeenStories] = usePersistentState<string[]>("snagchat:story-seen", []);
  const [storyComposer, setStoryComposer] = useState(false);
  const [storyView, setStoryView] = useState<{ authorId: string; itemIndex: number } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeSquadId, setComposeSquadId] = useState<string | null>(null);
  const [editingSnag, setEditingSnag] = useState<Snag | null>(null);
  /** Which way the feed slides when the tab changes. */
  const [feedMotion, setFeedMotion] = useState<"left" | "right">("right");
  const [stack, setStack] = useState<ScreenState[]>([]);
  const [legalDocId, setLegalDocId] = useState<string | null>(null);

  const feedRef = useRef<HTMLElement>(null);
  const handledLink = useRef(false);
  const [deepLink] = useState<ShareTarget>(() =>
    typeof window === "undefined" ? null : readShareTarget(window.location.search),
  );

  const handleAuthenticated = (
    next: Session,
    options: { isNew: boolean; onboarded?: boolean; profile?: { handle: string; interests: string[] } },
  ) => {
    setSession(next);

    if (options.isNew) {
      setMe((current) => ({
        ...current,
        name: next.name,
        handle: options.profile?.handle || handleForEmail(next.email, current.handle),
        interests: options.profile?.interests ?? current.interests,
      }));
    }

    if (options.onboarded) setOnboarded(true);
  };

  const signOut = () => {
    setSession(null);
    setStack([]);
    setActiveTab("home");
    setQuery("");
    setSearchOpen(false);
  };

  const snags = useMemo(
    () => [...mySnags, ...squadShares, ...SEED_SNAGS].filter((snag) => !removedSnags.includes(snag.id)),
    [mySnags, squadShares, removedSnags],
  );

  const dialConfig = useMemo(() => normalizeDialConfig(dialConfigRaw), [dialConfigRaw]);

  /** Galleries of private squads you are not in stay out of the feed. */
  const hiddenGalleries = useMemo(
    () =>
      new Set(
        squads
          .filter(
            (squad) =>
              squad.visibility === "private" && !squad.members.some((member) => member.playerId === ME_ID),
          )
          .map((squad) => squad.id),
      ),
    [squads],
  );

  const visibleSnags = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snags.filter((snag) => {
      if (snag.squadId && hiddenGalleries.has(snag.squadId)) return false;
      if (filter !== "For You" && snag.category !== filter) return false;
      if (!needle) return true;
      return [snag.title, snag.game, snag.creator, snag.category].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [snags, filter, query, hiddenGalleries]);

  /**
   * Ranking reads interactions through a ref so liking or saving a card does
   * not reshuffle the grid under the reader's thumb. The next filter, query or
   * follow change picks the new signals up.
   */
  const interactionsRef = useRef({ likes, saves, comments: userComments, shares: sharedSnags });
  interactionsRef.current = { likes, saves, comments: userComments, shares: sharedSnags };

  const rankedSnags = useMemo(() => {
    if (visibleSnags.length < 2) return visibleSnags;
    const interactions = interactionsRef.current;
    return rankFeed({
      allSnags: snags,
      visibleSnags,
      query,
      follows,
      squads,
      likes: interactions.likes,
      saves: interactions.saves,
      comments: interactions.comments,
      shares: interactions.shares,
      me: { name: me.name, handle: me.handle },
    }).ordered;
  }, [visibleSnags, snags, query, follows, squads, me.name, me.handle]);

  const mePlayer: Player = useMemo(
    () => ({ ...ME, ...me, following: ME.following + follows.length }),
    [me, follows.length],
  );

  const resolvePlayer = (id: string): Player => {
    if (id === ME_ID) return mePlayer;
    const found = findPlayer(id);
    if (found) return found;
    return { id, name: id, handle: id, bio: "Player on SnagChat.", game: "SnagChat", followers: 0, following: 0 };
  };

  /** Your story first, then everyone else's live story runs. */
  const storyGroups: StoryGroupView[] = (() => {
    const grouped = groupStories(freshStories([...myStories, ...SEED_STORIES]));
    return [
      ...grouped.filter((group) => group.authorId === ME_ID),
      ...grouped.filter((group) => group.authorId !== ME_ID),
    ].map((group) => ({
      ...group,
      author: resolvePlayer(group.authorId),
      avatarFrame: loadoutFor(group.authorId, frameLoadout).avatar,
    }));
  })();
  const myStoryItems = storyGroups.find((group) => group.authorId === ME_ID)?.items ?? [];
  const otherStoryGroups = storyGroups.filter((group) => group.authorId !== ME_ID);

  const threadList = useMemo(() => Object.values(threads), [threads]);
  const unreadTotal = threadList.reduce((total, thread) => total + thread.unread, 0);
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const suggestions = PLAYERS.filter((player) => player.id !== ME_ID && !threads[player.id]).slice(0, 8);
  /** Your own posts, which are the only ones the editor can write back to. */
  const mySnagIds = useMemo(() => new Set(mySnags.map((item) => item.id)), [mySnags]);

  const squadPostCounts = useMemo(() => {
    return squads.reduce<Record<string, number>>((counts, squad) => {
      counts[squad.id] = snags.filter((snag) => snag.squadId === squad.id).length;
      return counts;
    }, {});
  }, [squads, snags]);

  const scrollToFeed = () => {
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFeed = () => {
    setFilter("For You");
    setQuery("");
  };

  const pushScreen = (screen: ScreenState) => setStack((current) => [...current, screen]);

  const popScreen = () => {
    const next = stack.slice(0, -1);
    setStack(next);
    if (next.length === 0) {
      setActiveTab((tab) =>
        tab === "messages" || tab === "profile" || tab === "squads" || tab === "shop" ? "home" : tab,
      );
    }
  };

  /** Moves one tab along, the way a swipe does, and slides the feed that way. */
  const shiftFilter = (direction: "left" | "right") => {
    const next = nextCategory(filter, direction);
    if (!next) return;

    setFeedMotion(direction === "left" ? "right" : "left");
    setFilter(next);
  };

  const selectFilter = (next: FeedFilter) => {
    setFeedMotion(CATEGORIES.indexOf(next) > CATEGORIES.indexOf(filter) ? "right" : "left");
    setFilter(next);
  };

  const feedSwipe = useSwipe(shiftFilter, activeTab === "home" && stack.length === 0);

  const openProfile = (playerIdOrHandle: string) => {
    pushScreen({ kind: "profile", playerId: findPlayerId(playerIdOrHandle) });
  };

  /** Tapping a #hashtag anywhere drops you on the feed, searching that tag. */
  const searchTag = (value: string) => {
    setStack([]);
    setActiveTab("home");
    setSearchOpen(true);
    setFilter("For You");
    setQuery(`#${value}`);
    requestAnimationFrame(scrollToFeed);
  };

  /** Shared links land on the post or profile they point at, once. */
  useEffect(() => {
    if (!session || !deepLink || handledLink.current) return;
    handledLink.current = true;

    const url = new URL(window.location.href);
    url.searchParams.delete("snag");
    url.searchParams.delete("player");
    window.history.replaceState({}, "", url);

    if (deepLink.kind === "snag") {
      if (snags.some((snag) => snag.id === deepLink.id)) {
        setActiveTab("home");
        setStack([{ kind: "snag", snagId: deepLink.id }]);
      }
      return;
    }

    setActiveTab("home");
    setStack([{ kind: "profile", playerId: findPlayerId(deepLink.handle) }]);
  }, [session, deepLink, snags]);

  const openThread = (playerId: string) => {
    setThreads((current) => {
      const base = current[playerId] ?? { playerId, messages: [], unread: 0, updatedAt: Date.now() };
      return { ...current, [playerId]: { ...base, unread: 0 } };
    });
    setStack((current) => {
      const top = current[current.length - 1];
      if (top?.kind === "thread" && top.playerId === playerId) return current;
      return [...current, { kind: "thread", playerId }];
    });
  };

  /**
   * There is no server in this build, so a sent message walks itself through
   * sending → sent → read to show the indicators working. A view-once message
   * is dropped right after it is read, which is the point of that mode.
   */
  const advanceMessageStatus = (playerId: string, messageId: string) => {
    const setStatus = (status: ThreadMessage["status"]) =>
      setThreads((current) => {
        const thread = current[playerId];
        if (!thread) return current;
        return {
          ...current,
          [playerId]: {
            ...thread,
            messages: thread.messages.map((message) =>
              message.id === messageId ? { ...message, status } : message,
            ),
          },
        };
      });

    window.setTimeout(() => setStatus("sent"), 450);
    window.setTimeout(() => {
      setStatus("read");
      // View-once: once they have seen it, it is gone for good.
      window.setTimeout(() => {
        setThreads((current) => {
          const thread = current[playerId];
          if (!thread || thread.mode !== "once") return current;
          return {
            ...current,
            [playerId]: {
              ...thread,
              messages: thread.messages.filter((message) => message.id !== messageId),
            },
          };
        });
      }, 1400);
    }, 1800);
  };

  const sendMessage = (playerId: string, text: string) => {
    const now = Date.now();
    const messageId = `msg-${now}-${Math.random().toString(36).slice(2, 6)}`;

    setThreads((current) => {
      const base = current[playerId] ?? { playerId, messages: [], unread: 0, updatedAt: now };
      const message: ThreadMessage = {
        id: messageId,
        from: "me",
        at: now,
        text,
      };
      return {
        ...current,
        [playerId]: { ...base, messages: [...base.messages, message], updatedAt: now, unread: 0 },
      };
    });

    advanceMessageStatus(playerId, messageId);
  };

  const setThreadMode = (playerId: string, mode: ThreadMode) => {
    setThreads((current) => {
      const base = current[playerId] ?? { playerId, messages: [], unread: 0, updatedAt: Date.now() };
      const messages =
        mode === "once"
          ? // Anything already viewed cannot come back in a view-once chat.
            base.messages.filter((message) => message.from === "me" && message.status !== "read")
          : base.messages;
      return { ...current, [playerId]: { ...base, mode, messages } };
    });
  };

  const expireMessage = (playerId: string, messageId: string) => {
    setThreads((current) => {
      const thread = current[playerId];
      if (!thread) return current;
      return {
        ...current,
        [playerId]: {
          ...thread,
          messages: thread.messages.filter((message) => message.id !== messageId),
        },
      };
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const openNotification = (notification: AppNotification) => {
    markNotificationRead(notification.id);

    if (notification.kind === "follow") {
      pushScreen({ kind: "profile", playerId: notification.actorId });
      return;
    }

    if (notification.kind === "invite") {
      pushScreen({ kind: "squads" });
      return;
    }

    if (notification.snagId && snags.some((snag) => snag.id === notification.snagId)) {
      pushScreen({ kind: "snag", snagId: notification.snagId });
    }
  };

  const sendSnagToPlayer = (playerId: string, message: string, snag: Snag) => {
    const now = Date.now();
    const messageId = `msg-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const payload: ThreadMessage = {
      id: messageId,
      from: "me",
      at: now,
      text: message.trim() || undefined,
      snag: { image: snag.image, title: snag.title, game: snag.game },
    };

    setThreads((current) => {
      const base = current[playerId] ?? { playerId, messages: [], unread: 0, updatedAt: now };
      return {
        ...current,
        [playerId]: { ...base, messages: [...base.messages, payload], updatedAt: now, unread: 0 },
      };
    });

    advanceMessageStatus(playerId, messageId);
    setShare(null);
    pushScreen({ kind: "thread", playerId });
  };

  const toggleFollow = (playerId: string) => {
    if (playerId === ME_ID) return;
    setFollows((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    );
  };

  const toggleLike = (snagId: string) => {
    setLikes((current) =>
      current.includes(snagId) ? current.filter((id) => id !== snagId) : [...current, snagId],
    );
  };

  const toggleSave = (snagId: string) => {
    setSaves((current) =>
      current.includes(snagId) ? current.filter((id) => id !== snagId) : [...current, snagId],
    );
  };

  const markShared = (snagId: string) => {
    setSharedSnags((current) => (current.includes(snagId) ? current : [...current, snagId]));
  };

  const showToast = (text: string, detail?: string, spark = false) =>
    setToast({ id: Date.now(), text, detail, spark });

  /**
   * A delete or an edit can be taken back for a few seconds, so a slip is never
   * final. The toast holds longer than usual because it has a button to reach
   * for.
   */
  const framesFor = (playerId: string): FrameLoadout => loadoutFor(playerId, frameLoadout);

  const markStoriesSeen = (itemIds: string[]) => {
    setSeenStories((current) => {
      const next = new Set(current);
      itemIds.forEach((id) => next.add(id));
      return next.size === current.length ? current : Array.from(next);
    });
  };

  const openStories = (authorId: string) => {
    const group = storyGroups.find((entry) => entry.authorId === authorId);
    if (!group || group.items.length === 0) {
      if (authorId === ME_ID) setStoryComposer(true);
      return;
    }
    const firstUnseen = group.items.findIndex((item) => !seenStories.includes(item.id));
    setStoryView({ authorId, itemIndex: firstUnseen >= 0 ? firstUnseen : 0 });
  };

  const addStory = (draft: StoryDraft) => {
    const item: StoryItem = {
      id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: ME_ID,
      image: draft.image,
      caption: draft.caption,
      game: draft.game,
      at: Date.now(),
      snagId: draft.snagId,
      via: draft.via,
    };
    setMyStories((current) => addStoryItem(current, item));
    setStoryComposer(false);
    showToast("Added to your story", "It stays up for 24 hours.");
  };

  const addSnagToStory = (snag: Snag) => {
    const creator = resolvePlayer(snag.creatorId ?? findPlayerId(snag.creator));
    addStory({
      image: snag.image,
      caption: snag.title,
      game: snag.game,
      snagId: snag.id,
      via: creator.id === ME_ID ? undefined : creator.handle,
    });
  };

  const buyFrame = (frame: Frame) => {
    const feeCents = feeFor(frame.priceCents);
    setOwnedFrames((current) => (current.includes(frame.id) ? current : [...current, frame.id]));
    setFrameOrders((current) => [
      {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        frameId: frame.id,
        priceCents: frame.priceCents,
        feeCents,
        sellerNetCents: frame.priceCents - feeCents,
        seller: frame.creator,
        at: Date.now(),
      },
      ...current,
    ]);
    showToast(`${frame.name} added`, "Demo checkout — no card was charged.");
  };

  const applyFrame = (target: FrameTarget, use: FrameUse | null) => {
    setFrameLoadout((current) => {
      const next = { ...current };
      if (use) next[target] = use;
      else delete next[target];
      return next;
    });
  };

  /** Demo build: there is no review desk, so verification is granted at once. */
  const requestVerification = () => {
    setMe((current) => ({ ...current, verified: true }));
    showToast("Account verified", "Demo build: verification is approved instantly.");
  };

  const submitCreatorApplication = (application: CreatorApplication) => {
    setFrameCreator({ ...application, status: "approved" });
    showToast(
      "Creator application approved",
      application.storeName ? `${application.storeName} is open for business.` : undefined,
    );
  };

  const publishProduct = (product: Frame) => {
    setCreatorProducts((current) => [product, ...current]);
    showToast(`${product.name} is live`, "Listed in the shop with your creator name.");
  };

  const connectStripe = (account: StripeAccount) => {
    setStripeAccount(account);
    showToast("Stripe connected", "Payouts are enabled for your store (demo account).");
  };

  const disconnectStripe = () => {
    setStripeAccount(null);
    showToast("Stripe disconnected", "Your frames stay listed; payouts are paused.");
  };

  const showUndoToast = (text: string, detail: string, undo: () => void) =>
    setToast({
      id: Date.now(),
      text,
      detail,
      holdMs: 6000,
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          setToast(null);
        },
      },
    });

  /** Everyone the dial can hold: your squads first, then the players you message. */
  const dialRoster = useMemo<DialTarget[]>(() => {
    const mySquads = squads.filter((squad) => squad.members.some((member) => member.playerId === ME_ID));
    const contacts = Object.values(threads)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((thread) => findPlayer(thread.playerId))
      .filter((player): player is Player => Boolean(player));

    return [
      ...mySquads.map((squad) => ({
        key: dialKey("squad", squad.id),
        kind: "squad" as const,
        refId: squad.id,
        name: squad.name,
        members: squad.members.length,
      })),
      ...contacts.map((player) => ({
        key: dialKey("player", player.id),
        kind: "player" as const,
        refId: player.id,
        name: player.name,
        handle: player.handle,
        avatar: player.avatar,
        verified: player.verified,
      })),
    ];
  }, [squads, threads]);

  /** What the engine reads to decide which contacts deserve a slot. */
  const dialFacts = useMemo<DialFacts>(() => {
    const lastSeen: Record<string, number> = {};
    const unread: Record<string, number> = {};

    for (const thread of Object.values(threads)) {
      lastSeen[thread.playerId] = thread.updatedAt;
      unread[thread.playerId] = thread.unread;
    }

    const squadPosts: Record<string, number> = {};
    const squadMembers: Record<string, number> = {};

    for (const squad of squads) {
      squadPosts[squad.id] = snags.filter((snag) => snag.squadId === squad.id).length;
      squadMembers[squad.id] = squad.members.length;
      // A squad is only as active as its liveliest chat.
      const activity = squad.members.reduce(
        (latest, member) => Math.max(latest, lastSeen[member.playerId] ?? 0),
        0,
      );
      if (activity) lastSeen[squad.id] = activity;
    }

    return { lastSeen, unread, squadPosts, squadMembers };
  }, [threads, squads, snags]);

  const dialPlan = useMemo(() => planDial(dialConfig, dialRoster, dialFacts), [dialConfig, dialRoster, dialFacts]);

  /** The rings a held card will actually show. */
  const dialTargets = useMemo(
    () => dialPlan.slots.filter((target): target is DialTarget => Boolean(target)),
    [dialPlan],
  );

  const openDial = (snag: Snag, at: { x: number; y: number }, test = false) => setDial({ snag, at, test });

  const patchDialConfig = (patch: (config: DialConfig) => DialConfig) =>
    setDialConfigRaw((current) => patch(normalizeDialConfig(current)));

  /**
   * Flicks a snag into every chosen chat. A player gets the snag as a message;
   * a squad gets its own copy in the gallery, so the feed keeps one original.
   */
  const deliverSnag = (targets: DialTarget[], all: boolean) => {
    const open = dial;
    setDial(null);
    if (!open || targets.length === 0) return;

    if (open.test) {
      showToast("Test flick complete", "Nothing was posted — that was a rehearsal.");
      return;
    }

    const at = Date.now();

    for (const target of targets) {
      if (target.kind === "player") {
        const messageId = `msg-${at}-${Math.random().toString(36).slice(2, 6)}`;
        setThreads((current) => {
          const base = current[target.refId] ?? {
            playerId: target.refId,
            messages: [],
            unread: 0,
            updatedAt: at,
          };
          const payload: ThreadMessage = {
            id: messageId,
            from: "me",
            at,
            snag: { image: open.snag.image, title: open.snag.title, game: open.snag.game },
          };
          return {
            ...current,
            [target.refId]: { ...base, messages: [...base.messages, payload], updatedAt: at, unread: 0 },
          };
        });
        advanceMessageStatus(target.refId, messageId);
        continue;
      }

      const copyId = `share-${open.snag.id}-${target.refId}`;
      setSquadShares((current) =>
        current.some((snag) => snag.id === copyId)
          ? current
          : [
              {
                ...open.snag,
                id: copyId,
                squadId: target.refId,
                category: "Squad Galleries",
                postedAt: "now",
              },
              ...current,
            ],
      );
    }

    markShared(open.snag.id);
    showToast(all ? "Snag sent to all" : "Snag sent", deliveryLine(targets));
  };

  const likeCountFor = (snagId: string) => (SEED_LIKES[snagId] ?? 0) + (likes.includes(snagId) ? 1 : 0);
  const saveCountFor = (snagId: string) => (SEED_SAVES[snagId] ?? 0) + (saves.includes(snagId) ? 1 : 0);
  const shareCountFor = (snagId: string) => (SEED_SHARES[snagId] ?? 0) + (sharedSnags.includes(snagId) ? 1 : 0);

  const commentsFor = (snagId: string): CommentView[] =>
    [...(SEED_COMMENTS[snagId] ?? []), ...(userComments[snagId] ?? [])]
      .sort((a, b) => a.at - b.at)
      .map((comment) => ({
        id: comment.id,
        author: resolvePlayer(comment.authorId),
        at: comment.at,
        text: comment.text,
      }));

  const addComment = (snagId: string, text: string) => {
    const comment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: ME_ID,
      at: Date.now(),
      text,
    };
    setUserComments((current) => ({ ...current, [snagId]: [...(current[snagId] ?? []), comment] }));
  };

  const openSnag = (snag: Snag) => pushScreen({ kind: "snag", snagId: snag.id });

  const updateSquadMembers = (squadId: string, update: (members: SquadMember[]) => SquadMember[]) => {
    setSquads((current) =>
      current.map((squad) =>
        squad.id === squadId ? { ...squad, members: update(squad.members) } : squad,
      ),
    );
  };

  /** Invites are pending: the player joins the roster only when they accept. */
  const inviteToSquad = (squadId: string, playerId: string) => {
    const squad = squads.find((item) => item.id === squadId);
    if (!squad || squad.members.some((member) => member.playerId === playerId)) return;

    setInvites((current) =>
      current.some((invite) => invite.squadId === squadId && invite.playerId === playerId)
        ? current
        : [
            ...current,
            {
              id: `invite-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              squadId,
              playerId,
              invitedBy: ME_ID,
              at: Date.now(),
            },
          ],
    );
  };

  const cancelInvite = (inviteId: string) => {
    setInvites((current) => current.filter((invite) => invite.id !== inviteId));
  };

  const acceptInvite = (inviteId: string) => {
    const invite = invites.find((item) => item.id === inviteId);
    if (!invite) return;

    updateSquadMembers(invite.squadId, (members) =>
      members.some((member) => member.playerId === invite.playerId)
        ? members
        : [...members, { playerId: invite.playerId, role: "member" }],
    );
    setInvites((current) => current.filter((item) => item.id !== inviteId));
  };

  const declineInvite = (inviteId: string) => {
    setInvites((current) => current.filter((invite) => invite.id !== inviteId));
  };

  const transferSquad = (squadId: string, playerId: string) => {
    setSquads((current) =>
      current.map((squad) =>
        squad.id === squadId
          ? {
              ...squad,
              members: squad.members.map((member) =>
                member.playerId === playerId
                  ? { ...member, role: "owner" }
                  : member.role === "owner"
                    ? { ...member, role: "member" }
                    : member,
              ),
            }
          : squad,
      ),
    );
  };

  const removeFromSquad = (squadId: string, playerId: string) => {
    updateSquadMembers(squadId, (members) =>
      members.filter((member) => member.playerId !== playerId || member.role === "owner"),
    );
  };

  const deletePost = (snag: Snag) => {
    const wasMine = mySnags.some((item) => item.id === snag.id);
    const at = mySnags.findIndex((item) => item.id === snag.id);

    setRemovedSnags((current) => (current.includes(snag.id) ? current : [...current, snag.id]));
    if (wasMine) setMySnags((current) => current.filter((item) => item.id !== snag.id));

    // Undo un-hides it and puts it back in its old place in your own posts.
    showUndoToast("Snag deleted", snag.title, () => {
      setRemovedSnags((current) => current.filter((id) => id !== snag.id));
      if (!wasMine) return;
      setMySnags((current) => {
        if (current.some((item) => item.id === snag.id)) return current;
        const next = [...current];
        next.splice(at < 0 ? 0 : Math.min(at, next.length), 0, snag);
        return next;
      });
    });
  };

  const deleteSquad = (squad: Squad) => {
    const index = squads.findIndex((item) => item.id === squad.id);
    const galleryIds = snags.filter((snag) => snag.squadId === squad.id).map((snag) => snag.id);
    // Only the posts this delete hides can come back; anything already gone stays gone.
    const hiddenByDelete = galleryIds.filter((id) => !removedSnags.includes(id));
    // Your own gallery posts keep their place on the profile grid for the undo.
    const myGallerySnags = mySnags
      .map((snag, position) => ({ snag, position }))
      .filter(({ snag }) => snag.squadId === squad.id);
    const squadInvites = invites.filter((invite) => invite.squadId === squad.id);

    setRemovedSnags((current) => Array.from(new Set([...current, ...galleryIds])));
    setMySnags((current) => current.filter((snag) => snag.squadId !== squad.id));
    setSquads((current) => current.filter((item) => item.id !== squad.id));
    setInvites((current) => current.filter((invite) => invite.squadId !== squad.id));
    popScreen();

    // A squad is a lot to lose to a stray confirm, so it can be taken back.
    showUndoToast("Squad deleted", squad.name, () => {
      setSquads((current) => {
        if (current.some((item) => item.id === squad.id)) return current;
        const next = [...current];
        next.splice(index < 0 ? next.length : Math.min(index, next.length), 0, squad);
        return next;
      });
      setRemovedSnags((current) => current.filter((id) => !hiddenByDelete.includes(id)));
      setMySnags((current) => {
        if (myGallerySnags.length === 0) return current;
        const next = current.filter((snag) => !myGallerySnags.some(({ snag: gone }) => gone.id === snag.id));
        for (const { snag, position } of myGallerySnags) {
          next.splice(Math.min(position, next.length), 0, snag);
        }
        return next;
      });
      if (squadInvites.length > 0) {
        setInvites((current) => [
          ...current,
          ...squadInvites.filter(
            (invite) => !current.some((item) => item.id === invite.id),
          ),
        ]);
      }
    });
  };

  const downloadData = () => {
    if (!session) return;
    const account = findAccount(session.email);
    const safeAccount = account
      ? Object.fromEntries(
          Object.entries(account).filter(([key]) => key !== "hash" && key !== "salt"),
        )
      : null;

    const slug = (me.handle || session.name || "player").toLowerCase().replace(/[^a-z0-9._-]/g, "-");

    downloadJson(`snagchat-${slug}-data.json`, {
      exportedAt: new Date().toISOString(),
      account: safeAccount,
      profile: me,
      settings: {
        private: Boolean(me.private),
        followPermission: me.followPermission ?? "everyone",
        invitePermission: me.invitePermission ?? "everyone",
      },
      snags: mySnags,
      likedSnagIds: likes,
      savedSnagIds: saves,
      sharedSnagIds: sharedSnags,
      comments: userComments,
      following: follows,
      squads,
      invites,
      threads: Object.values(threads),
    });
  };

  const deleteMyAccount = () => {
    if (session && !session.demo) deleteAccount(session.email);
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("snagchat:"))
        .forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storage may be blocked; the reload below still returns to sign-in.
    }
    window.location.reload();
  };

  const setSquadVisibility = (squadId: string, visibility: SquadVisibility) => {
    setSquads((current) =>
      current.map((squad) => (squad.id === squadId ? { ...squad, visibility } : squad)),
    );
  };

  const saveProfile = (values: ProfileFields) => {
    // Keep the whole previous profile so an edit can be taken back in one tap.
    const before = { ...me };
    const beforeAccount = session ? findAccount(session.email) : undefined;

    setMe((current) => ({ ...current, ...values }));

    // Keep your own posts in sync when the username changes.
    if (values.handle && values.handle !== me.handle) {
      setMySnags((current) =>
        current.map((snag) =>
          snag.creatorId === ME_ID ? { ...snag, creator: values.handle } : snag,
        ),
      );
    }

    showUndoToast("Profile updated", values.handle !== before.handle ? `@${values.handle}` : "Your changes are live", () => {
      setMe(before);
      setMySnags((current) =>
        current.map((snag) =>
          snag.creatorId === ME_ID ? { ...snag, creator: before.handle } : snag,
        ),
      );
      // The handle and region live on the account record as well as the profile.
      if (session && beforeAccount) {
        updateAccount(session.email, {
          handle: beforeAccount.handle,
          region: beforeAccount.region,
        });
      }
    });
  };

  const saveSnagEdit = (values: { title: string; game: string }) => {
    if (!editingSnag) return;

    // The edit sheet hands back the whole title, hashtags included, so the old
    // title and game are all the undo needs to put the snag back as it was.
    const before = { title: editingSnag.title, game: editingSnag.game };
    const snagId = editingSnag.id;

    setMySnags((current) =>
      current.map((snag) => (snag.id === snagId ? { ...snag, ...values } : snag)),
    );
    setEditingSnag(null);
    showUndoToast("Snag updated", values.title, () =>
      setMySnags((current) =>
        current.map((snag) => (snag.id === snagId ? { ...snag, ...before } : snag)),
      ),
    );
  };

  const navigate = (tab: NavTab) => {
    setActiveTab(tab);

    if (tab === "profile") {
      setStack([{ kind: "profile", playerId: ME_ID }]);
      return;
    }

    if (tab === "messages") {
      setQuery("");
      setSearchOpen(false);
      setStack([{ kind: "messages" }]);
      return;
    }

    if (tab === "squads") {
      setQuery("");
      setSearchOpen(false);
      setStack([{ kind: "squads" }]);
      return;
    }

    if (tab === "shop") {
      setQuery("");
      setSearchOpen(false);
      setStack([{ kind: "shop" }]);
      return;
    }

    setQuery("");
    setSearchOpen(false);

    if (tab === "home") {
      setFilter("For You");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFilter("For You");
    scrollToFeed();
  };

  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery("");
      return !open;
    });
  };

  const startCompose = (squadId: string | null = null) => {
    setComposeSquadId(squadId);
    setComposing(true);
  };

  const closeCompose = () => {
    setComposing(false);
    setComposeSquadId(null);
  };

  const postSnag = (draft: SnagDraft) => {
    const created: Snag = {
      ...draft,
      id: `snag-${Date.now()}`,
      creator: me.handle,
      creatorId: ME_ID,
      postedAt: "now",
    };

    setMySnags((current) => [created, ...current]);
    const fromSquad = Boolean(draft.squadId);
    closeCompose();

    if (fromSquad) return;

    setFilter("For You");
    setQuery("");
    setActiveTab("home");
    requestAnimationFrame(scrollToFeed);
  };

  const heading = query.trim()
    ? `Results for “${query.trim()}”`
    : filter === "For You"
      ? "Made for your feed"
      : filter;

  const composeSquad = composeSquadId ? squads.find((squad) => squad.id === composeSquadId) : undefined;

  if (!session) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  if (!onboarded) {
    return (
      <WelcomeFlow
        defaultName={me.name || session.name}
        defaultHandle={me.handle || handleForEmail(session.email)}
        defaultAvatar={me.avatar}
        onFinish={(values) => {
          setMe((current) => ({
            ...current,
            name: values.name,
            handle: values.handle,
            avatar: values.avatar ?? current.avatar,
          }));
          setFilter(values.filter);
          setActiveTab("home");
          setOnboarded(true);
        }}
        onSkip={() => setOnboarded(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-0">
      <a
        href="#feed"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-[12px] focus:font-semibold focus:text-white"
      >
        Skip to feed
      </a>

      <TopBar
        activeTab={activeTab}
        onNavigate={navigate}
        onCreate={() => startCompose(null)}
        searchOpen={searchOpen}
        onToggleSearch={toggleSearch}
        query={query}
        onQueryChange={setQuery}
        unreadCount={unreadTotal}
        notificationCount={unreadNotifications}
        onOpenNotifications={() => pushScreen({ kind: "notifications" })}
        demoSession={session.demo}
        onSignIn={signOut}
      />

      <main ref={feedSwipe}>
        <section className="mx-auto max-w-[1320px] px-4 pt-8 sm:px-6 sm:pt-12">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-brand">Snag feed</p>
          </div>
          <h1 className="mt-4 max-w-[15ch] font-display text-[36px] font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-[60px] lg:text-[66px]">
            Your next <span className="text-brand">favorite</span> play.
          </h1>
          <p className="mt-4 max-w-[58ch] text-[13px] leading-relaxed text-muted sm:text-[15px] lg:text-[16px]">
            Clips, loadouts and base builds from the players you actually run with. Snag one and send it straight
            to your squad.
          </p>
        </section>

        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <StoriesRail
            myAuthor={mePlayer}
            myItems={myStoryItems}
            myAvatarFrame={framesFor(ME_ID).avatar}
            groups={otherStoryGroups}
            seen={seenStories}
            onOpen={openStories}
            onAdd={() => setStoryComposer(true)}
          />

          <FilterRail active={filter} onChange={selectFilter} />

          <section id="feed" ref={feedRef} aria-label="Snag feed" className="scroll-mt-[62px] pt-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate font-display text-[16.5px] font-extrabold tracking-[-0.03em] sm:text-[19px]">
                  {heading}
                </h2>
                <p className="mt-1 text-[11px] text-muted">
                  {visibleSnags.length} {visibleSnags.length === 1 ? "snag" : "snags"} · tap to open, hold to
                  quick-share
                  <span className="lg:hidden"> · swipe a card to like or save</span>
                </p>
              </div>
              {filter !== "For You" || query ? (
                <button
                  type="button"
                  onClick={resetFeed}
                  className="shrink-0 pb-0.5 text-[11.5px] font-semibold text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {visibleSnags.length > 0 ? (
              <div key={filter} className={`feed-swipe feed-swipe-${feedMotion}`}>
                <div className="feed-brick">
                  {rankedSnags.map((snag) => {
                    const creator = resolvePlayer(snag.creatorId ?? findPlayerId(snag.creator));
                    const creatorLoadout = framesFor(creator.id);
                    return (
                  <div key={snag.id} className="feed-brick-cell">
                  <SnagCard
                    snag={snag}
                    creatorAvatar={creator.avatar}
                    creatorVerified={creator.verified}
                    creatorFrame={creatorLoadout.avatar}
                    frame={creatorLoadout.snag}
                    liked={likes.includes(snag.id)}
                    likeCount={likeCountFor(snag.id)}
                    saved={saves.includes(snag.id)}
                    saveCount={saveCountFor(snag.id)}
                    onOpen={openSnag}
                    onQuickShare={(item, at) => openDial(item, at)}
                    onOpenProfile={openProfile}
                    onToggleLike={(item) => toggleLike(item.id)}
                    onToggleSave={(item) => toggleSave(item.id)}
                    onHashtag={searchTag}
                    onMention={openProfile}
                    isMine={snag.creatorId === ME_ID}
                    onEdit={mySnagIds.has(snag.id) ? (item) => setEditingSnag(item) : undefined}
                    onDelete={(item) => deletePost(item)}
                  />
                  </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#e2e5e9] px-5 py-14 text-center">
                <p className="font-display text-[15px] font-extrabold tracking-[-0.02em]">No snags here yet</p>
                <p className="mx-auto mt-1.5 max-w-[36ch] text-[12px] leading-relaxed text-muted">
                  Try another category, or clear the search to bring the whole feed back.
                </p>
                <button
                  type="button"
                  onClick={resetFeed}
                  className="mt-4 h-9 rounded-full bg-ink px-4 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#22252a]"
                >
                  Reset feed
                </button>
              </div>
            )}

            {visibleSnags.length > 0 ? (
              <p className="pb-2 pt-3 text-center text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#b6bbc3]">
                You are all caught up
              </p>
            ) : null}
          </section>

          <footer className="mt-8 border-t border-line px-2 py-9">
            <div className="mx-auto grid max-w-[720px] grid-cols-2 gap-x-6 gap-y-7 text-left sm:grid-cols-[1.2fr_1fr_1fr]">
              <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
                <img
                  src="/brand/snagchat-wordmark.png"
                  alt="SnagChat"
                  width={445}
                  height={201}
                  className="h-9 w-auto self-start"
                />
                <p className="text-[12px] font-semibold text-muted">Capture the moment.</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-faint">Build &amp; grow</p>
                <a
                  href="https://developer.snagchat.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-left text-[12px] font-semibold text-ink hover:text-brand"
                >
                  Developer Portal
                </a>
                <button
                  type="button"
                  onClick={() => pushScreen({ kind: "shop" })}
                  className="text-left text-[12px] font-semibold text-ink hover:text-brand"
                >
                  Shop
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-faint">Resources</p>
                {LEGAL_DOCS.filter((doc) => doc.id === "guidelines").map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setLegalDocId(doc.id)}
                    className="text-left text-[12px] font-semibold text-ink hover:text-brand"
                  >
                    Guidelines
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pushScreen({ kind: "advertise" })}
                  className="text-left text-[12px] font-semibold text-ink hover:text-brand"
                >
                  Advertise with us
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-faint">Legal</p>
                {LEGAL_DOCS.filter((doc) => doc.id !== "guidelines").map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setLegalDocId(doc.id)}
                    className="text-left text-[12px] font-semibold text-ink hover:text-brand"
                  >
                    {doc.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-auto mt-8 max-w-[720px] border-t border-line pt-5 text-center">
              <p className="text-[11px] text-faint">© {COPYRIGHT_YEAR} SnagChat.io All rights reserved.</p>
            </div>
          </footer>
        </div>
      </main>

      <BottomNav
        activeTab={activeTab}
        onNavigate={navigate}
        onCreate={() => startCompose(null)}
        unreadCount={unreadTotal}
      />

      {legalDocId && findLegalDoc(legalDocId) ? (
        <LegalSheet doc={findLegalDoc(legalDocId)!} onClose={() => setLegalDocId(null)} />
      ) : null}

      {share ? (          <ShareSheet
          snag={share.snag}
          squads={squads}
          quick={share.quick}
          onClose={() => setShare(null)}
          onShared={() => markShared(share.snag.id)}
          onSendToPlayer={sendSnagToPlayer}
          onOpenAuthor={() => {
            const authorId = share.snag.creatorId ?? share.snag.creator;
            setShare(null);
            openProfile(authorId);
          }}
        />
      ) : null}

      {dial ? (
        <QuickShareDial
          snag={dial.snag}
          targets={dialTargets}
          origin={dial.at}
          onSend={deliverSnag}
          onCancel={() => setDial(null)}
        />
      ) : null}

      {manageDial ? (
        <ManageDialSheet
          roster={dialRoster}
          config={dialConfig}
          plan={dialPlan}
          onSetSlots={(slots) => patchDialConfig((config) => ({ ...config, slots }))}
          onToggleSmart={(smart) => patchDialConfig((config) => ({ ...config, smart }))}
          onLock={(key) =>
            patchDialConfig((config) => {
              const slots = [...config.slots];
              const open = slots.findIndex((entry) => !entry);
              if (open >= 0) slots[open] = key;
              return { ...config, slots, locked: Array.from(new Set([...config.locked, key])) };
            })
          }
          onStartTest={(origin) => {
            const preview = visibleSnags[0] ?? snags[0];
            if (preview) openDial(preview, origin, true);
          }}
          onInviteSquad={() => {
            setManageDial(false);
            navigate("squads");
          }}
          onQuickAdd={() => setTopGames(true)}
          onClose={() => setManageDial(false)}
        />
      ) : null}

      {topGames ? (
        <TopGamesSheet
          selected={me.interests ?? []}
          customTags={customTags}
          squads={squads.map((squad) => squad.name)}
          onChange={(games) => setMe((current) => ({ ...current, interests: games }))}
          onCreateTag={(tag) => {
            if (tag) setCustomTags((current) => (current.includes(tag) ? current : [tag, ...current]));
            showToast(`#${tag} attached as a unique tag!`, "It is offered wherever you add tags.", true);
          }}
          onClose={() => setTopGames(false)}
        />
      ) : null}

      {storyComposer ? (
        <StoryComposerSheet
          mySnags={mySnags}
          game={mePlayer.game}
          onAdd={addStory}
          onCreate={() => {
            setStoryComposer(false);
            startCompose(null);
          }}
          onClose={() => setStoryComposer(false)}
        />
      ) : null}

      {storyView ? (
        <StoryViewer
          key={`${storyView.authorId}-${storyView.itemIndex}`}
          groups={storyGroups}
          startAuthorId={storyView.authorId}
          meId={ME_ID}
          startItem={storyView.itemIndex}
          onSeen={markStoriesSeen}
          onOpenSnag={(snagId) => {
            const target = snags.find((snag) => snag.id === snagId);
            if (!target) return;
            setStoryView(null);
            openSnag(target);
          }}
          onClose={() => setStoryView(null)}
        />
      ) : null}

      {toast ? <Toast toast={toast} onDismiss={() => setToast(null)} /> : null}

      {report ? (
        <ReportSheet
          mode={report.mode}
          title={report.snag.title}
          spar={report.snag.sponsoredBy}
          alreadyReported={Boolean(reports[report.snag.id])}
          onClose={() => setReport(null)}
          onSubmit={(reason) =>
            setReports((current) => ({
              ...current,
              [report.snag.id]: { mode: report.mode, reason, at: Date.now() },
            }))
          }
        />
      ) : null}

      {composing ? (
        <ComposeSheet
          squad={composeSquad ? { id: composeSquad.id, name: composeSquad.name } : undefined}
          onClose={closeCompose}
          onPost={postSnag}
        />
      ) : null}

      {editingSnag ? (
        <EditSnagSheet snag={editingSnag} onClose={() => setEditingSnag(null)} onSave={saveSnagEdit} />
      ) : null}

      {stack.map((screen, index) => {
        const key = `${screen.kind}-${index}`;

        if (screen.kind === "messages") {
          return (
            <InboxScreen
              key={key}
              threads={threadList}
              unreadTotal={unreadTotal}
              suggestions={suggestions}
              onClose={popScreen}
              onOpenThread={openThread}
              frameFor={(playerId) => framesFor(playerId).avatar}
              nameplateFor={(playerId) => framesFor(playerId).nameplate}
            />
          );
        }

        if (screen.kind === "snag") {
          const snag = snags.find((item) => item.id === screen.snagId);
          if (!snag) return null;
          const author = resolvePlayer(snag.creatorId ?? findPlayerId(snag.creator));

          return (
            <SnagScreen
              key={key}
              snag={snag}
              author={author}
              liked={likes.includes(snag.id)}
              likeCount={likeCountFor(snag.id)}
              saved={saves.includes(snag.id)}
              saveCount={saveCountFor(snag.id)}
              shareCount={shareCountFor(snag.id)}
              comments={commentsFor(snag.id)}
              currentAvatar={mePlayer.avatar}
              frame={framesFor(author.id).snag}
              authorFrame={framesFor(author.id).avatar}
              onToggleLike={() => toggleLike(snag.id)}
              onToggleSave={() => toggleSave(snag.id)}
              onShare={() => setShare({ snag, quick: false })}
              onReport={(mode) => setReport({ snag, mode })}
              reported={Boolean(reports[snag.id])}
              onOpenProfile={() => pushScreen({ kind: "profile", playerId: author.id })}
              onAddComment={(text) => addComment(snag.id, text)}
              onAddToStory={snag.sponsoredBy ? undefined : () => addSnagToStory(snag)}
              inStory={hasSharedSnag(myStories, snag.id)}
              onHashtag={searchTag}
              onMention={openProfile}
              isMine={author.id === ME_ID}
              onEdit={() => {
                popScreen();
                setEditingSnag(snag);
              }}
              onDelete={() => {
                deletePost(snag);
                popScreen();
              }}
              onClose={popScreen}
            />
          );
        }

        if (screen.kind === "thread") {
          const thread = threads[screen.playerId];
          return (
            <ThreadScreen
              key={key}
              player={resolvePlayer(screen.playerId)}
              messages={thread ? liveMessages(thread) : []}
              mode={thread?.mode ?? "keep"}
              myAvatar={mePlayer.avatar}
              playerFrame={framesFor(screen.playerId).avatar}
              playerNameplate={framesFor(screen.playerId).nameplate}
              myFrame={framesFor(ME_ID).avatar}
              onClose={popScreen}
              onOpenProfile={() => pushScreen({ kind: "profile", playerId: screen.playerId })}
              onSend={(text) => sendMessage(screen.playerId, text)}
              onSetMode={(mode) => setThreadMode(screen.playerId, mode)}
              onExpire={(messageId) => expireMessage(screen.playerId, messageId)}
            />
          );
        }

        if (screen.kind === "notifications") {
          return (
            <NotificationsScreen
              key={key}
              notifications={notifications}
              unreadTotal={unreadNotifications}
              resolveActor={(actorId) => {
                const player = findPlayer(actorId);
                return player ? { name: player.name, avatar: player.avatar, verified: player.verified } : undefined;
              }}
              titleForSnag={(snagId) => snags.find((snag) => snag.id === snagId)?.title}
              titleForSquad={(squadId) => squads.find((squad) => squad.id === squadId)?.name}
              onOpen={openNotification}
              onMarkAllRead={() =>
                setNotifications((current) => current.map((item) => ({ ...item, read: true })))
              }
              onClose={popScreen}
            />
          );
        }

        if (screen.kind === "squads") {
          return (
            <SquadsScreen
              key={key}
              squads={squads}
              invites={invites}
              currentUserId={ME_ID}
              postCounts={squadPostCounts}
              onClose={popScreen}
              onOpenSquad={(squadId) => pushScreen({ kind: "squad", squadId })}
              onAcceptInvite={acceptInvite}
              onDeclineInvite={declineInvite}
            />
          );
        }

        if (screen.kind === "squad") {
          const squad = squads.find((item) => item.id === screen.squadId);
          if (!squad) return null;

          return (
            <SquadScreen
              key={key}
              squad={squad}
              currentUserId={ME_ID}
              posts={canSeeGallery(squad, ME_ID) ? snags.filter((snag) => snag.squadId === squad.id) : []}
              candidates={PLAYERS.filter(
                (player) => !squad.members.some((member) => member.playerId === player.id),
              )}
              invites={invites}
              onClose={popScreen}
              onPost={() => startCompose(squad.id)}
              onInvite={(playerId) => inviteToSquad(squad.id, playerId)}
              onCancelInvite={cancelInvite}
              onRemoveMember={(playerId) => removeFromSquad(squad.id, playerId)}
              onTransferOwnership={(playerId) => transferSquad(squad.id, playerId)}
              onDeletePost={deletePost}
              onEditPost={(snag) => setEditingSnag(snag)}
              onOpenSnag={openSnag}
              onOpenPlayer={openProfile}
              onDeleteSquad={() => deleteSquad(squad)}
              onSetVisibility={(visibility) => setSquadVisibility(squad.id, visibility)}
            />
          );
        }

        if (screen.kind === "shop") {
          return (
            <ShopScreen
              key={key}
              onClose={popScreen}
              owned={ownedFrames}
              loadout={frameLoadout}
              products={creatorProducts}
              verified={Boolean(me.verified)}
              creator={frameCreator}
              stripe={stripeAccount}
              orders={frameOrders}
              onBuy={buyFrame}
              onApply={applyFrame}
              onRequestVerification={requestVerification}
              onSubmitCreator={submitCreatorApplication}
              onPublishProduct={publishProduct}
              onConnectStripe={connectStripe}
              onDisconnectStripe={disconnectStripe}
              onToast={showToast}
            />
          );
        }

        if (screen.kind === "advertise") {
          return <AdvertiseScreen key={key} onClose={popScreen} onToast={showToast} />;
        }

        const player = resolvePlayer(screen.playerId);
        const isMe = screen.playerId === ME_ID;
        const isFollowing = follows.includes(screen.playerId);
        const playerSnags = snags.filter((snag) => {
          const creatorId = snag.creatorId ?? findPlayerId(snag.creator);
          return creatorId === player.id;
        });

        return (
          <ProfileScreen
            key={key}
            player={{
              ...player,
              followers: isMe ? player.followers : player.followers + (isFollowing ? 1 : 0),
            }}
            snags={playerSnags}
            interests={isMe ? (me.interests ?? []) : []}
            isMe={isMe}
            isFollowing={isFollowing}
            onToggleFollow={() => toggleFollow(screen.playerId)}
            onMessage={() => openThread(screen.playerId)}
            onCreate={() => {
              popScreen();
              startCompose(null);
            }}
            onClose={popScreen}
            onOpenSnag={openSnag}
            onEditSnag={(snag) => setEditingSnag(snag)}
            onDeleteSnag={(snag) => deletePost(snag)}
            onSaveProfile={saveProfile}
            accountEmail={session.email}
            isDemoSession={session.demo}
            onSignOut={signOut}
            followPermission={me.followPermission}
            invitePermission={me.invitePermission}
            onChangeSettings={(patch) => setMe((current) => ({ ...current, ...patch }))}
            onManageDial={() => setManageDial(true)}
            onDownloadData={downloadData}
            onDeleteAccount={deleteMyAccount}
            frames={framesFor(player.id)}
            onOpenShop={() => pushScreen({ kind: "shop" })}
          />
        );
      })}
    </div>
  );
}
