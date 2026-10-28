# SnagChat

Mobile-first masonry feed for snagging gaming clips, loadouts and base builds, built to the purple brand system.

Live preview: https://site-13a90e61c67847c5a03636095253a08d.freebuff.page

Redeploy with `npm run build` and then deploy `deploy-manifest.json` (static assets from `dist`, worker entry in `deploy/worker.js`).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # typecheck + production build
npm test         # engine + marketplace tests (node:test, no extra runner)
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4. Fonts (Inter, Plus Jakarta Sans) are self-hosted in `public/fonts`.

## Changelog

[`CHANGELOG.md`](CHANGELOG.md) records every feature, change and fix in Keep a Changelog form. Pushing to `main` runs `.github/workflows/changelog.yml`, which appends the pushed commits under a dated section; the bot's follow-up commit carries `[skip changelog]`, so it cannot trigger itself. Write an entry by hand when a commit needs more detail than its subject. Locally, `npm run changelog` appends the last commit, or pass a range:

```bash
node scripts/changelog.mjs --from <sha> --to <sha>
```

`.github/workflows/ci.yml` runs the engine tests, typechecks and builds every push and pull request on Node 22.

## What's here

- **Feed** — a brick bond in a 1320px centred shell: 2 columns on phones, 3 from 768px and 4 from 1280px, 12px gap, 16px card radius. Every card uses the same 4:5 media frame and a fixed 86px meta strip, so all cards are the same size, and alternate columns drop by half a card (`.feed-brick` in `src/index.css`) so the rows read as staggered bricks instead of a table. A post's original aspect is only used in the snag view, where nothing is cropped. Your own posts keep Edit and Delete as glass buttons on the artwork instead of adding a row under it. The header goes sticky from 1024px so the full nav, search, notifications, squads and Create stay on screen while the feed scrolls.
- **Filters** — the tab rail (For You, Clips, Loadouts, **Skins**, Builds, Squad Galleries) is pinned, so the categories never scroll away. On phones and tablets the header above it scrolls off and the rail takes the top edge; from 1024px the header is sticky too and the rail parks directly under it. Selected state is black-and-white. On phones and tablets a swipe across the feed still moves one tab left or right and the grid slides in from that side — off above 1023px, stops at the ends of the rail, drags starting on the rail's own scroller are left to it, and drags starting on a card belong to that card (`useSwipe` in `src/lib/swipe.ts`, `nextCategory` in `src/data/snags.ts`).
- **Touch handling** — cards and controls opt out of the browser's double-tap zoom (`touch-action: manipulation`), so a double tap likes the post instead of zooming the page, and the page clips horizontal overflow (`overflow-x: clip`) so scaled cards and the feed's slide can never pan the layout sideways. Pinch zoom still works.
- **Search** — header search filters snags by title, game, creator or category, and a tapped hashtag drops you on the feed searching that tag.
- **Card swipe actions** — drag a card right to like it and left to save it (`src/lib/cardSwipe.ts`). The card follows the finger, a Like or Save pill slides in to show what the release will do, and it springs back afterwards; a mostly vertical drag is handed straight back to the page so scrolling still works, and anything under 48px counts as a tap. Cards carry `data-swipe-ignore`, so the tab swipe can never fire at the same moment.
- **Skins** — the **Skins** tab is where players post character, weapon and vehicle skins. Five seeded posts fill it, the composer offers Skins next to Clips, Loadouts, Builds and Squad Galleries, and the welcome flow describes it like the rest.
- **Builds** — the **Builds** tab (formerly Screenshots) is where players post base builds and photo-mode shots. The seeded builds, the composer category, the welcome-flow interests and the engine's taste axis all use the same label.
- **Stories** — the rail above the feed carries a 24-hour story from you and from other players. Your ring is always first and exposes the add control; tapping a ring opens a full-screen viewer with tap-through halves, arrow-key control, a per-item progress bar and automatic advance, and tapping **View post** jumps to the snag a story was shared from. **Add to your story** sits in every snag view (sponsored posts excepted): it reuses the post's image and credits the original creator when you share someone else's snag. The composer next to your ring takes an uploaded photo through the same image sandbox as a cover, or one of your own posts, with an optional caption. Your stories persist in `snagchat:stories`; watched item ids persist in `snagchat:story-seen`, and anything older than 24 hours drops out of `freshStories` in [`src/data/stories.ts`](src/data/stories.ts).
- **Game logos** — every post carries the game's own artwork from `src/data/games.ts`. The composer offers Rust, Minecraft, ARK: Survival Ascended, DayZ, Call of Duty, Palworld and Conan Exiles, plus **Other** for a free-text title; posts without a catalogued logo fall back to the name so nothing looks blank. Each logo is bundled in `public/games/<slug>.png`, cropped to the artwork's own edges, so it fills the height it is given (22px on a feed card, 20px in the snag view, 18px in the picker) instead of hiding inside transparent padding. Nothing sits behind them: the logos are white artwork, so on light surfaces they are darkened with a `brightness()` filter rather than put on a black plate, and on a post they sit on the card's own scrim with a drop shadow. Swap in licensed artwork in those files before shipping commercially.
- **Hashtags and mentions** — post text is parsed by `src/lib/tags.ts`, so `#hashtags` and `@mentions` render as tappable purple text on cards, in the snag view and in comments (`src/components/RichText.tsx`): a hashtag opens the feed filtered to that tag, a mention opens that player's profile. A post may carry **four** tags in total — hashtags and mentions share the same budget — and the composer counts them (`2 / 4`), suggests the selected game's own hashtag, a few popular ones and players you can mention, and blocks posting while the text is over the limit. Tags are only read when they start a word, so an email address stays plain text.
- **Likes and saves** — a heart and a bookmark on every card, plus the same pair in the snag view; both counts update and persist (`snagchat:likes`, `snagchat:saves`).
- **Comments** — per-snag comment thread with seeded comments and an inline composer.
- **Share count** — the snag view shows how many times a post went out, and it ticks up when a share actually lands: sending to a squad or a player, the system share sheet, or a copied link (`snagchat:shared`).
- **Double tap to like** — tapping a card twice inside 300 ms likes it and pops a heart burst; a single tap still opens the post, and a long press still quick-shares. The single tap waits 330 ms (longer than the double-tap window, so the post can never open a beat before the like), and tapping an already-liked post keeps it liked.
- **Notifications** — the bell in the header carries an unread count and opens the notifications list in `src/components/NotificationsScreen.tsx`: likes, comments, follows, squad invites, shares and mentions, newest first, with unread rows tinted and dotted. Tapping one opens the post, profile or squad it points at, marks it read, and `Mark all read` clears the badge. Stored in `snagchat:notifications` from the seeds in `src/data/notifications.ts`.
- **Ads and reports** — a snag can carry `sponsoredBy` (two seeded ads: PadTek Gaming and NorthLoop PC). Sponsored posts show an **Ad** badge, name the sponsor instead of a creator byline (no profile link, since it is not a player) and add **Report ad** to the overflow menu; every post has **Report post**. The two sheets in `src/components/ReportSheet.tsx` have their own reason lists — ad reasons cover misleading, repetitive and offensive ads, post reasons cover spam, harassment, hate, nudity, violence, cheating, copyright — plus optional detail, and the report is kept in `snagchat:reports`.
- **SnagChat Shop** — a **Shop** tab in the desktop nav and the mobile bottom bar. It carries 18 static frames across four surfaces (avatar, banner, message nameplate, snag), with live samples, a preview sheet, owned/applied states and a demo checkout that shows the seller's 2.5% marketplace fee before you pay. Two frames are included so nobody starts with an empty studio. Purchased frames and the applied loadout persist in `snagchat:frame-owned` and `snagchat:frame-loadout`.
- **Frames and effects** — frames are static SVG artwork layered over the thing they frame; the motion comes from an effect you choose separately. 24 effects ship: still, pulse, bounce, rubberband, wiggle, shake, flash, swing, jello, parallax drift and stagger loop, while slide left/right/up/down, fade in/out, zoom in/out, flip, roll in/out, tada, pop and stagger play once (on hover, or from a preview's Replay button). The chosen frame renders on your profile photo, banner, profile name, chat nameplates and the snags you post. See [`src/data/frames.ts`](src/data/frames.ts) and [`src/components/FrameArt.tsx`](src/components/FrameArt.tsx).
- **Message nameplates** — the chat header and inbox rows wrap the player's name in their purchased nameplate frame, and message avatars wear their avatar frame. The green presence dot still sits in front of both.
- **Creator studio** — the shop's **Creator** tab is a seller dashboard. Verified accounts can apply to become a SnagChat Creator, build a frame product from the included artwork templates with a live preview, and publish it straight into the shop's **Community drops**. The application and store details persist in `snagchat:creator` and `snagchat:frame-products`.
- **Payouts and fees** — the creator tab also holds Stripe Connect onboarding (three steps: country, individual or company, bank last four), the connected account state, a fee calculator and a sales table. SnagChat keeps **2.5%**, paid by the seller: a $4.99 frame returns $4.87 to the creator and $0.12 to SnagChat. This build simulates onboarding locally and labels itself as a demo; production needs Stripe Connect Express with a server-issued account link and webhooks.
- **Advertising portal** — **Advertise with us** in the footer opens the media portal at the `advertise.snagchat.io` label. It previews the same creative as a 4:5 feed card, a 9:16 story and a nameplate takeover, estimates impressions, reach and frequency from the placement CPM, and takes budget and flight dates before a demo submission.
- **Direct messages** — the inbox lists each player's photo, name and `@handle` with an unread count and a delivery label for your last message (**Sending / Sent / Read**, single or double tick). The chat header shows photo, name, handle and presence, and your own bubbles carry the same tick under each message. Message art and the inbox avatars are the same player photos used everywhere else.
- **Message timer** — the clock in a chat header switches a thread between **Keep messages**, **Disappear after 24 hours** and **Disappear once viewed** (`ThreadMode` in `src/data/threads.ts`). In 24-hour mode every bubble shows a live countdown and drops out a day after it was sent; in view-once mode an incoming message arrives behind a **Tap to view once** veil and is removed a few seconds after it is opened, while your own view-once messages vanish once they are read. The mode banner sits above the thread and the empty state explains where the messages went.
- **Profile photo and banner** — tapping the photo or the banner on your own profile opens the file picker when it is empty (a `+` badge marks the photo) and saves the cropped result straight away; when art is set, the same tap opens it full screen (`src/components/ImageViewer.tsx`). Other players' art opens the viewer too, and the editor's previews are tappable. Stills are cropped to 320 × 320 / 1200 × 380, and GIFs up to 1.5 MB are accepted but saved as a rebuilt still, because every upload is re-encoded from its decoded pixels (`fileToProfileImage` in `src/lib/imageUpload.ts`).
- **Share** — share action in the snag view, or long-press (right-click) a card for a prefilled quick share. Send to a squad or to a player, which drops the snag into a DM thread. The same sheet has **Share a link** and **Copy link**: links look like `?snag=<id>` and reopen the feed with that post already open.
- **Profile links** — the share icon in a profile header copies or shares `?player=<handle>`, which opens that profile directly.
- **Motion** — progress and engagement numbers count up from their previous value with an eased curve (`src/components/CountUp.tsx`): profile stats (snags / followers / following) and the like, comment, save and share counts on cards and in the snag view all roll to their new number instead of snapping. Every icon does a rubber-band squash on hover and on press (`src/lib/iconRubber.ts` + `@keyframes icon-rubber` in `src/index.css`), and feed cards spring (`src/lib/cardBounce.ts` + `@keyframes card-bounce` / `card-pop`) — a hover or press squash, plus a pop as they scroll back into view. All of it respects `prefers-reduced-motion`, and the animations are one-off (no looping motion).
- **Footer** — besides the legal links, the feed footer links **Advertise with us**, the **Developer portal** at `developer.snagchat.io` (an external link; the portal itself is not part of this build) and the **Frame shop**. A line under the copyright names `snagchat.io`, `developer.snagchat.io` and `advertise.snagchat.io`. The advertising portal and frame shop are in-app screens, so they work on the preview origin without those DNS records.
- **Legal** — the feed footer and the sign-in screen carry "© SnagChat. All rights reserved." plus **Terms / Privacy / Cookies / Guidelines** links that open a legal sheet. Copy lives in `src/data/legal.ts` and is written for a browser-only preview, so it says plainly that data stays on your device.
- **Presence and verification** — players carry an online flag and a verified flag in `src/data/players.ts`. Online shows a green dot on the avatar (profile header, snag view, DM inbox, chat header, suggestions); verified shows a blue check next to the name in the same places and on feed cards.
- **Settings** — the gear in your own profile header opens the account settings sheet: profile visibility (Public / Private), **who can follow you** (Everyone / People you follow / No one), **who can send you invites** (same options), **Download my data** (JSON export), and **Delete account** behind a confirmation that wipes the account and every `snagchat:*` key before returning to sign-in.
- **Private and public accounts** — Settings → Profile visibility switches between **Public** (anyone sees your snags) and **Private** (only followers see the grid; everyone else gets a lock panel with a Follow button). The profile header shows a Private account badge. Two seeded players (`nyx`, `wren`) are private so the locked state is visible.
- **Username and region changes** — the profile editor checks the new username live (green when free, red when taken) and refuses to save a taken one; Region sits in the Account block and saves straight to the account record. Renaming also rewrites the byline on your own posts.
- **Profiles** — tap any creator to open their profile: bio, game, snag count, followers/following, follow/unfollow and message actions, plus their snag grid. Your own profile supports editing name, handle and bio, and uploading a profile photo and banner (cropped client-side to 320×320 and 1200×380, stored locally).
- **Public and private galleries** — every squad has a `visibility` of `public` or `private`. Public galleries post into the feed; private ones stay inside the squad, with their posts filtered out of the feed for non-members and the gallery body hidden. Owners switch it under Owner controls; the squad page and the squad list both show a lock badge. `Night Shift` (yours) and `Static Kings` are private, the rest public.
- **Squads** — header squads icon opens the squad list and each squad's page. Every squad has an owner; owners can invite, remove members, transfer ownership, delete any gallery post and delete the squad. Members can post to the squad gallery, invite players, and edit or delete their own posts. Non-members see a read-only view.
- **Invites** — invites are pending until accepted: the invite sheet looks players up by @username or name, the squad page lists pending invites with a Cancel action, and the squad list shows an "Invites for you" card with Accept and Decline.
- **Ownership transfer** — owners pick a member under "Transfer ownership"; that member becomes owner and the previous owner drops to member.
- **Direct messages** — Messages tab in the bottom nav (desktop nav link) with an unread badge, inbox with conversation previews and unread counts, "start a chat" suggestions, and threaded conversations with text and snag attachments. Squads live on the header icon next to search.
- **Create** — purple create action posts a snag to the top of the feed, with preset covers or your own upload. Still images are scaled to 1200 px and re-encoded from their decoded pixels; a GIF is rebuilt as a still for the same reason. Recommended cover size 1080 × 1350 px (4:5), JPG/PNG/WebP up to 6 MB or GIF up to 1.5 MB.
- **Upload sizes** — the composer and the profile editor both state the recommended dimensions (cover 1080 × 1350, avatar 320 × 320, banner 1200 × 380) next to the upload control.

## Clip uploads

Stills and GIFs go through the upload sandbox below, and **MP4 clips** can be uploaded from the same control, held to the policy below (`src/lib/clipLimits.ts`). A file is checked for format and size before the browser reads it, then for length and resolution once its header is read, and the composer refuses it with the exact reason rather than posting something unexpected:

| Setting | Limit | Why |
| --- | --- | --- |
| Length | 60 s, hard cap | Long clips are where the storage and encode cost lives; 60 s covers a fight, a build tour or a loadout rundown. |
| Resolution | 1080p max, 720p recommended | Re-encode to a single 1080p ceiling and a 720p variant; anything above that is downscaled, never rejected. |
| Frame rate | 60 fps max, keep the source rate below it | Prevents 120/240 fps captures from tripling the bitrate for no visible gain in the feed. |
| Bitrate / size | ~6 Mbps target, 50 MB per clip after encode | Keeps one post inside a realistic upload window on mobile data. |
| Codec | H.264 + AAC in MP4, plus a WebM/VP9 fallback | Plays everywhere without a per-device transcode. |
| Poster frame | 1 frame extracted at 0.5 s, stored as WebP | The feed renders the poster; the video only loads when opened. |
| Rejection | Over-length clips are trimmed, not refused; oversized or unreadable files are refused with the reason | Players get a post instead of an error wherever a fix is possible. |

The numbers live in one place, `src/lib/clipLimits.ts` beside `src/lib/imageUpload.ts`, and the composer states the minimum, the maximum and the size cap next to the upload control. A clip is stored as a blob in IndexedDB (`src/lib/clipStore.ts`) because a video never fits in `localStorage`, and every post keeps a poster frame grabbed at 0.5s as its cover, so the post still reads correctly if the clip itself is missing. A real deployment moves the encode server-side and raises the caps; the client only needs to pre-check length, resolution and size before uploading.

## Upload safety

Every image is dismantled and rebuilt before it is stored. `sanitizeImageFile` in `src/lib/fileSandbox.ts` hands the file to `src/workers/imageSandbox.worker.ts`, so decoding never blocks the feed:

1. The browser decodes the file from a Blob into a bitmap — nothing in it is executed.
2. The bitmap is drawn onto a blank canvas and read back as raw RGBA pixels.
3. A new file is encoded from those pixels alone (WebP for covers, cropped WebP for profile art).

The original container, its metadata and any bytes appended after the image data are never copied, so a polyglot file or a payload hidden in an EXIF block does not survive the round trip. The format is read from the bytes rather than the extension, anything that is not a real PNG, JPEG, WebP or GIF is refused, SVG is refused outright because it can carry script, and the check runs on every image path in the app, not just the composer.

MP4s cannot be rebuilt in the browser without shipping a decoder and encoder, so `assertMp4Container` validates the ISO-BMFF structure instead — a real `ftyp` box, box sizes that fit inside the file, and a `moov` box — and the clip is only ever read through a `<video>` element. A production deployment should still re-encode clips server-side (for example with ffmpeg) before publishing; that is the only way to guarantee a clip's bytes have been rebuilt.

## Feed ranking

`src/engine` is SnagChat's own ranker. It follows the same shape as the KOBA Pulse engine — retrieval, a light rank, a multi-intent heavy rank, a separate visibility gate, a labeled sponsor slot and an inspectable trace — but every signal is one SnagChat actually has: posts, follows, squads, games and interactions.

`runPulse` in `pipeline.ts` runs these stages:

1. **Retrieval** proposes posts from four independent sources: an in-network restart walk over follows, shared squads and shared games; taste clusters fitted on six-axis vectors (Clips, Loadouts, Skins, Builds, Squad play, Discovery); live heat from time-decayed saves, comments and shares; and BM25 search. Campaigns enter through their own sponsor source so a labeled ad is never buried by the organic cutoff.
2. **Light rank** blends source strength (0.44), taste affinity (0.2), game fit (0.16), freshness (0.1), creator verification (0.06) and heat (0.04), then truncates to 24.
3. **Heavy rank** prices every action the post can earn — watch clip, like, save, comment, share, follow creator, join squad, engage sponsor — with a logistic per action, multiplies by the action weights and sums expected value. Each item carries `why`, the dominant action and its strongest signals. No single blended relevance score is used.
4. **Visibility gate** is applied after scoring. A post can be allowed, held for review (`interstitial`) or dropped, from its own state or a staff override; a high score cannot change the decision.
5. **Diversity and sponsor slot** pick the presentation order with a greedy MMR penalty on same kind/game/creator/squad, then move at most one campaign into slot four. The ad keeps its sponsor label and never inherits organic placement.

**Cold start** (`cold-start.ts`): a viewer under 8 interactions has their taste shrunk toward a broad-feed prior, scaled by confidence; a post under 12 recorded interactions has its heat shrunk toward 0.3 and is flagged `coldStart`. Both decisions are surfaced on the result rather than silently applied.

**Search** is BM25 over title, game, category, creator, tags and sponsor brand. A query is a filter: posts with no term overlap do not outrank matches on heat. The app's own substring filter runs first, so a prefix like `mason` still finds `MasonR`; `snagchat.ts` re-appends those matches after the engine's token cut while never resurrecting a gated post.

**Corpus** (`snagchat.ts`): taste comes from your own posts and from what you save, share, like and comment on; the graph comes from follows and squad membership; private galleries you are not in are dropped by the gate; sponsored posts keep their brand and category. `App.tsx` reads interactions through a ref so a like does not reshuffle the grid mid-scroll — filtering, searching, following or changing squads re-ranks.

`npm test` runs the engine suite with Node's built-in runner (`node --experimental-strip-types --test`), 18 assertions covering determinism, viewer-specific ordering, the query filter, cold-start shrinkage, the gate, sponsor placement, prefix-search preservation and private-gallery exclusion. A second suite in `src/data/frames.test.ts` covers the marketplace fee, catalogue integrity and loadout resolution; together they run 26 assertions.

## Frames, effects and the shop

Every frame is a real static image: `scripts/build-frames.mjs` generates the 18 SVGs in `public/frames` (six avatars, four banners, three nameplates, five card frames), each with a transparent middle so it can layer over a photo or clip. Card frames are drawn only along the outer edge, because they wrap the **whole** card — media, author row and title — rather than sitting inside the image. Run `node scripts/build-frames.mjs` after editing the artwork; the output is committed, so the app never depends on the script at build time. Every SVG uses `preserveAspectRatio="none"` on purpose — a banner is much wider than its 1200×320 source and a nameplate grows with the name, so the frame stretches to the box instead of letterboxing itself into a centred strip.

`FrameLayer` in `src/components/FrameArt.tsx` places that image with `pointer-events-none` above the content, and `Avatar` draws an avatar frame 24% wider than the photo so the ring sits on the edge rather than over the face. The green presence dot is `z-30`, above both the photo and the frame (`z-10`). `FramePreview` renders the exact same components the profile, feed and chat use — a profile photo in an author row, a real banner header with the avatar overlapping it, a chat header nameplate, or a complete feed card — which is why a shop preview is a true preview. The shop uses one inline preview panel beside the catalogue instead of opening a separate preview screen.

Effects live as `fx-*` classes in `src/index.css`. Loop effects run for as long as the frame is on screen; one-shot effects are triggered by `.frame-host:hover` or by an `.is-playing` preview wrapper, so an exit effect shows itself when you ask for it and never leaves the frame missing. `prefers-reduced-motion` turns all of them off. Applying a frame writes `{ frameId, effect }` into `snagchat:frame-loadout`, keyed by surface, and every renderer resolves the wearer's loadout through `loadoutFor`.

Prices are in cents and every sale is split in one place, `feeFor`/`PLATFORM_FEE_RATE` in `src/data/frames.ts`. The checkout, the shop preview panel, the creator dashboard and the tests all read that same constant.

## Creator marketplace and payouts

A creator product is a normal `Frame` with `creatorId: "you"` and `official: false`. Publishing calls `onPublishProduct`, which adds it to `snagchat:frame-products`; `registerCustomFrames` makes those products resolvable by `findFrame`, so avatars, cards and nameplates can render a product immediately even though its artwork is one of the bundled templates. Community products appear under **Community drops** and credit the creator name from the application.

Verification is the gate: the Creator tab shows a locked card until the account is verified, then the application (store name, category, portfolio, payout country). This demo build approves verification and the application immediately and says so on screen; production would review both. The Stripe panel is onboarding only — it records country, business type and bank last four, then shows the connected account, charges/payouts state and a fee calculator. A live build replaces it with Stripe Connect Express: create the connected account server-side, redirect to a Stripe-hosted account link, and only trust `charges_enabled` from the webhook. The 2.5% application fee belongs on the payment intent or checkout session, not in the client.

## Advertising

`src/components/AdvertiseScreen.tsx` is the media portal behind the footer's **Advertise with us**. The creative form drives three real previews at once (feed card, story, nameplate takeover), and the campaign builder prices the flight with per-placement CPMs of $8 feed, $12 story and $6 nameplate. Estimates are impressions = budget ÷ CPM × 1000, reach = 62% of impressions, frequency = impressions ÷ reach. Submitting is a labelled demo: it validates the creative, shows a campaign reference in review and sends nothing to an ad server.

## Accounts

The app opens on a purple sign-in screen: logo, email and password, a `Forgot password?` notice, `Try a demo account`, **Steam / Xbox / Discord** buttons, and an eight-step registration. The sign-in and register buttons are solid white with black text, and the provider tiles match them — white with black labels and marks.

Registration (`src/components/AuthScreen.tsx`) walks: account (name, email, password) → username with live availability → birthday → region → **PC / Console / Both** → at least four interests → optional phone → optional gender. Social buttons use the official brand marks (Simple Icons SVG in `public/brand/social`) drawn as CSS masks, so each logo takes the app's own black colour instead of a foreign brand block. The username field shows a **green tick with "@name is available"** or a **red cross** for taken, too short or invalid names; seeded player handles are reserved. Birthday must make the account at least 13.

Platform choice (`src/data/platforms.ts`) is multi-select: PC and Console toggle independently, and **Both** selects them together — at least one is required and the account panel shows "Plays on: PC + Console".

Region options (`src/data/regions.ts`): US (US East and US West infrastructure), EU (centralized European hubs), AU (Oceania coverage) and SEA (Singapore-centred Asia-Pacific hubs). The choice is required at sign-up and shown in the account panel.

Provider buttons are a **preview stand-in**: there is no OAuth in this build, so they record the provider locally and finish setup in the welcome flow. Accounts are created client-side in `src/lib/auth.ts` and kept in `localStorage` with a per-account salt and a SHA-256 hash — not server-enforced security. Username, birthday, interests, phone and gender are stored on the account record; birthday, gender and phone are shown only in your own profile editor (Profile → Edit → Account), never on a public profile. Sign out from that same section.

## Onboarding

Email registration collects the profile details itself, so it lands straight on the feed with your interests on your profile. Everyone else — demo account or Steam/Xbox/Discord — gets the four-step welcome flow (`src/components/WelcomeFlow.tsx`): what SnagChat is, **how it works**, display name, handle and optional photo, then a starting feed filter. The walkthrough step is the manual for the build: the `HOW_TO` table in that file spells out hold-to-quick-share, tap versus double tap, both swipes, the + composer with its clip limits, squad galleries and ownership, messaging with the 24-hour and view-once modes, and profile settings. Each line maps to a real interaction, so keep them in step if a gesture changes. Skipping or finishing writes `snagchat:onboarded`, so it appears once per browser. Clear that key to see it again.

## State

The GUI hides scrollbars everywhere (`scrollbar-width: none` plus a zero-width WebKit scrollbar) while leaving every scroll container scrollable, so the card edges stay flush with the shell. Demo sessions get a **Log in** button in the header plus **Log in or create an account** in Profile → Settings, and every account has **Log out** there as well as in the profile editor's Account section.

Likes, comments, saves, follows, profile edits, posted snags, reports, notifications and DM threads persist in `localStorage` (`snagchat:*`), so they survive reloads on the same browser. Uploaded clips are the exception: they are far too big for `localStorage`, so they live in IndexedDB (`snagchat-clips`) and are read back as object URLs, with the post's poster frame covering anything that cannot be read (private windows, `file://` origins). There is no backend: nothing syncs between devices and no message is delivered anywhere.

Message delivery is simulated client-side: a message you send walks itself through `sending → sent → read` on timers in `src/App.tsx` (`advanceMessageStatus`) because there is no second device to read it. In a view-once thread that same simulated read is what removes the message. A real build replaces those timers with delivery receipts from the server.

Account settings (`private`, `followPermission`, `invitePermission`) live on the profile record. The download export is built in `src/App.tsx` (`downloadData`) and written by `src/lib/export.ts`; it includes the account record minus `hash` and `salt`, the profile, posted snags, likes, comments, follows, squads, invites and DM threads. Deleting calls `deleteAccount` in `src/lib/auth.ts` and clears local storage.

Shared links carry the deep link in the query string (`src/lib/share.ts` reads it and `?snag=` / `?player=` are stripped after use). Because posts live in that browser's storage, a link to a post you created opens that post for you, while anyone else lands on the feed — real cross-device links need the post stored on a server.

## Android APK

The app also ships as an Android APK. `android/` is a thin WebView wrapper around the same build: it serves the built files out of the APK's assets from `https://appassets.androidplatform.net/` (`MainActivity.java` with `WebViewAssetLoader`) instead of `file://`, so `localStorage` and the IndexedDB clip store behave exactly as they do on the web, and muted clips are allowed to autoplay.

```bash
bash android/build-apk.sh   # web build -> APK assets -> snagchat.apk
```

The script needs JDK 17, an Android SDK with platform 34 and build-tools 34.0.0, and Gradle 8.7 — point `JAVA_HOME`, `ANDROID_HOME` and `GRADLE` at them, or let it fall back to the `.toolchain/` copy. The APK it produces is a debug build signed with the debug keystore, so it installs by sideloading; a Play release needs its own signing key.

## Assets

- Frame artwork: `public/frames/*.svg` (generated by `scripts/build-frames.mjs`) with the catalogue in `src/data/frames.ts`
- Feed imagery: `public/snags/*.jpg`
- Brand artwork: `public/brand/snagchat-wordmark.png`, `snagchat-icon.png`, and the favicon PNGs in the same folder. The fist icon is the logo below 1280px (phones and tablets); the wordmark is used on desktop widths — header, footer and sign-in screen all follow that rule
- Nav and search glyphs: `public/brand/icons/{home,compass,dm,user,search}.png`, drawn as CSS masks so the active tab tints purple via `currentColor`
- Data: `src/data/snags.ts`, `src/data/players.ts`, `src/data/threads.ts`, `src/data/engagement.ts`, `src/data/games.ts`
- Game artwork: `public/games/*.png` — one cropped publisher logo per catalogued title, bundled rather than loaded from a store CDN
