# SnagChat

Mobile-first masonry feed for snagging gaming clips, loadouts and screenshots, built to the purple brand system.

Live preview: https://site-13a90e61c67847c5a03636095253a08d.freebuff.page

Redeploy with `npm run build` and then deploy `deploy-manifest.json` (static assets from `dist`, worker entry in `deploy/worker.js`).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # typecheck + production build
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4. Fonts (Inter, Plus Jakarta Sans) are self-hosted in `public/fonts`.

## What's here

- **Feed** — full-bleed masonry, 2 columns on mobile, 3 on desktop, 12px gap, 16px card radius.
- **Filters** — sticky category rail (For You, Clips, Loadouts, Screenshots, Squad Galleries) with black-and-white selected state. On phones and tablets a swipe across the feed moves one tab left or right and the grid slides in from that side; the gesture is off above 1023px, stops at the ends of the rail, and swipes that start on the rail's own scroller are left to it (`useSwipe` in `src/lib/swipe.ts`, `nextCategory` in `src/data/snags.ts`).
- **Touch handling** — cards and controls opt out of the browser's double-tap zoom (`touch-action: manipulation`), so a double tap likes the post instead of zooming the page, and the page clips horizontal overflow (`overflow-x: clip`) so scaled cards and the feed's slide can never pan the layout sideways. Pinch zoom still works.
- **Search** — header search filters snags by title, game, creator or category, and a tapped hashtag drops you on the feed searching that tag.
- **Snag view** — tap a card to open the snag: author, game logo, category, and like / comment / save / share counts.
- **Game logos** — every post carries the game's own artwork from `src/data/games.ts`. The composer offers Rust, Minecraft, ARK: Survival Ascended, DayZ, Call of Duty, Palworld and Conan Exiles, plus **Other** for a free-text title; posts without a catalogued logo fall back to the name so nothing looks blank. Each logo is bundled in `public/games/<slug>.png`, cropped to the artwork's own edges, so it fills the height it is given (22px on a feed card, 20px in the snag view, 18px in the picker) instead of hiding inside transparent padding. Nothing sits behind them: the logos are white artwork, so on light surfaces they are darkened with a `brightness()` filter rather than put on a black plate, and on a post they sit on the card's own scrim with a drop shadow. Swap in licensed artwork in those files before shipping commercially.
- **Hashtags and mentions** — post text is parsed by `src/lib/tags.ts`, so `#hashtags` and `@mentions` render as tappable purple text on cards, in the snag view and in comments (`src/components/RichText.tsx`): a hashtag opens the feed filtered to that tag, a mention opens that player's profile. A post may carry **four** tags in total — hashtags and mentions share the same budget — and the composer counts them (`2 / 4`), suggests the selected game's own hashtag, a few popular ones and players you can mention, and blocks posting while the text is over the limit. Tags are only read when they start a word, so an email address stays plain text.
- **Likes and saves** — a heart and a bookmark on every card, plus the same pair in the snag view; both counts update and persist (`snagchat:likes`, `snagchat:saves`).
- **Comments** — per-snag comment thread with seeded comments and an inline composer.
- **Share count** — the snag view shows how many times a post went out, and it ticks up when a share actually lands: sending to a squad or a player, the system share sheet, or a copied link (`snagchat:shared`).
- **Double tap to like** — tapping a card twice inside 300 ms likes it and pops a heart burst; a single tap still opens the post, and a long press still quick-shares. The single tap waits 330 ms (longer than the double-tap window, so the post can never open a beat before the like), and tapping an already-liked post keeps it liked.
- **Notifications** — the bell in the header carries an unread count and opens the notifications list in `src/components/NotificationsScreen.tsx`: likes, comments, follows, squad invites, shares and mentions, newest first, with unread rows tinted and dotted. Tapping one opens the post, profile or squad it points at, marks it read, and `Mark all read` clears the badge. Stored in `snagchat:notifications` from the seeds in `src/data/notifications.ts`.
- **Ads and reports** — a snag can carry `sponsoredBy` (two seeded ads: PadTek Gaming and NorthLoop PC). Sponsored posts show an **Ad** badge, name the sponsor instead of a creator byline (no profile link, since it is not a player) and add **Report ad** to the overflow menu; every post has **Report post**. The two sheets in `src/components/ReportSheet.tsx` have their own reason lists — ad reasons cover misleading, repetitive and offensive ads, post reasons cover spam, harassment, hate, nudity, violence, cheating, copyright — plus optional detail, and the report is kept in `snagchat:reports`.
- **Direct messages** — the inbox lists each player's photo, name and `@handle` with an unread count and a delivery label for your last message (**Sending / Sent / Read**, single or double tick). The chat header shows photo, name, handle and presence, and your own bubbles carry the same tick under each message. Message art and the inbox avatars are the same player photos used everywhere else.
- **Message timer** — the clock in a chat header switches a thread between **Keep messages**, **Disappear after 24 hours** and **Disappear once viewed** (`ThreadMode` in `src/data/threads.ts`). In 24-hour mode every bubble shows a live countdown and drops out a day after it was sent; in view-once mode an incoming message arrives behind a **Tap to view once** veil and is removed a few seconds after it is opened, while your own view-once messages vanish once they are read. The mode banner sits above the thread and the empty state explains where the messages went.
- **Profile photo and banner** — tapping the photo or the banner on your own profile opens the file picker when it is empty (a `+` badge marks the photo) and saves the cropped result straight away; when art is set, the same tap opens it full screen (`src/components/ImageViewer.tsx`). Other players' art opens the viewer too, and the editor's previews are tappable. Stills are cropped to 320 × 320 / 1200 × 380; animated GIFs up to 1.5 MB are kept as they are (`fileToProfileImage` in `src/lib/imageUpload.ts`).
- **Share** — share action in the snag view, or long-press (right-click) a card for a prefilled quick share. Send to a squad or to a player, which drops the snag into a DM thread. The same sheet has **Share a link** and **Copy link**: links look like `?snag=<id>` and reopen the feed with that post already open.
- **Profile links** — the share icon in a profile header copies or shares `?player=<handle>`, which opens that profile directly.
- **Motion** — progress and engagement numbers count up from their previous value with an eased curve (`src/components/CountUp.tsx`): profile stats (snags / followers / following) and the like, comment, save and share counts on cards and in the snag view all roll to their new number instead of snapping. Every icon does a rubber-band squash on hover and on press (`src/lib/iconRubber.ts` + `@keyframes icon-rubber` in `src/index.css`), and feed cards spring (`src/lib/cardBounce.ts` + `@keyframes card-bounce` / `card-pop`) — a hover or press squash, plus a pop as they scroll back into view. All of it respects `prefers-reduced-motion`, and the animations are one-off (no looping motion).
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
- **Create** — purple create action posts a snag to the top of the feed, with preset covers or your own upload. Still images are scaled to 1200 px and re-encoded; GIFs are kept intact and animate in the feed. Recommended cover size 1080 × 1350 px (4:5), JPG/PNG/WebP up to 6 MB or GIF up to 1.5 MB.
- **Upload sizes** — the composer and the profile editor both state the recommended dimensions (cover 1080 × 1350, avatar 320 × 320, banner 1200 × 380) next to the upload control.

## Clip uploads

This build accepts still images and GIFs only; there is no video pipeline yet. The limits below are the intended policy for when clips land, and they are chosen to fit the current storage model (`localStorage`, roughly 5 MB per origin) and a thumbnail-first feed:

| Setting | Limit | Why |
| --- | --- | --- |
| Length | 60 s, hard cap | Long clips are where the storage and encode cost lives; 60 s covers a fight, a build tour or a loadout rundown. |
| Resolution | 1080p max, 720p recommended | Re-encode to a single 1080p ceiling and a 720p variant; anything above that is downscaled, never rejected. |
| Frame rate | 60 fps max, keep the source rate below it | Prevents 120/240 fps captures from tripling the bitrate for no visible gain in the feed. |
| Bitrate / size | ~6 Mbps target, 50 MB per clip after encode | Keeps one post inside a realistic upload window on mobile data. |
| Codec | H.264 + AAC in MP4, plus a WebM/VP9 fallback | Plays everywhere without a per-device transcode. |
| Poster frame | 1 frame extracted at 0.5 s, stored as WebP | The feed renders the poster; the video only loads when opened. |
| Rejection | Over-length clips are trimmed, not refused; oversized or unreadable files are refused with the reason | Players get a post instead of an error wherever a fix is possible. |

The limits belong in one place — a `src/lib/clipLimits.ts` beside `src/lib/imageUpload.ts` — and the composer should state them next to the upload control the way image sizes are stated today. A real deployment moves the encode server-side and raises the caps; the client only needs to pre-check length, resolution and size before uploading.

## Accounts

The app opens on a purple sign-in screen: logo, email and password, a `Forgot password?` notice, `Try a demo account`, **Steam / Xbox / Discord** buttons, and an eight-step registration. The sign-in and register button is solid white with black text.

Registration (`src/components/AuthScreen.tsx`) walks: account (name, email, password) → username with live availability → birthday → region → **PC / Console / Both** → at least four interests → optional phone → optional gender. Social buttons use the official brand marks (Simple Icons SVG in `public/brand/social`) drawn as CSS masks, so each logo takes the app's own white/active colour instead of a foreign brand block. The username field shows a **green tick with "@name is available"** or a **red cross** for taken, too short or invalid names; seeded player handles are reserved. Birthday must make the account at least 13.

Platform choice (`src/data/platforms.ts`) is multi-select: PC and Console toggle independently, and **Both** selects them together — at least one is required and the account panel shows "Plays on: PC + Console".

Region options (`src/data/regions.ts`): US (US East and US West infrastructure), EU (centralized European hubs), AU (Oceania coverage) and SEA (Singapore-centred Asia-Pacific hubs). The choice is required at sign-up and shown in the account panel.

Provider buttons are a **preview stand-in**: there is no OAuth in this build, so they record the provider locally and finish setup in the welcome flow. Accounts are created client-side in `src/lib/auth.ts` and kept in `localStorage` with a per-account salt and a SHA-256 hash — not server-enforced security. Username, birthday, interests, phone and gender are stored on the account record; birthday, gender and phone are shown only in your own profile editor (Profile → Edit → Account), never on a public profile. Sign out from that same section.

## Onboarding

Email registration collects the profile details itself, so it lands straight on the feed with your interests on your profile. Everyone else — demo account or Steam/Xbox/Discord — gets the three-step welcome flow (`src/components/WelcomeFlow.tsx`): what SnagChat is, display name, handle and optional photo, then a starting feed filter. Skipping or finishing writes `snagchat:onboarded`, so it appears once per browser. Clear that key to see it again.

## State

Likes, comments, saves, follows, profile edits, posted snags, reports, notifications and DM threads persist in `localStorage` (`snagchat:*`), so they survive reloads on the same browser. There is no backend: nothing syncs between devices and no message is delivered anywhere.

Message delivery is simulated client-side: a message you send walks itself through `sending → sent → read` on timers in `src/App.tsx` (`advanceMessageStatus`) because there is no second device to read it. In a view-once thread that same simulated read is what removes the message. A real build replaces those timers with delivery receipts from the server.

Account settings (`private`, `followPermission`, `invitePermission`) live on the profile record. The download export is built in `src/App.tsx` (`downloadData`) and written by `src/lib/export.ts`; it includes the account record minus `hash` and `salt`, the profile, posted snags, likes, comments, follows, squads, invites and DM threads. Deleting calls `deleteAccount` in `src/lib/auth.ts` and clears local storage.

Shared links carry the deep link in the query string (`src/lib/share.ts` reads it and `?snag=` / `?player=` are stripped after use). Because posts live in that browser's storage, a link to a post you created opens that post for you, while anyone else lands on the feed — real cross-device links need the post stored on a server.

## Assets

- Feed imagery: `public/snags/*.jpg`
- Brand artwork: `public/brand/snagchat-wordmark.png`, `snagchat-icon.png`, and the favicon PNGs in the same folder. The fist icon is the logo below 1280px (phones and tablets); the wordmark is used on desktop widths — header, footer and sign-in screen all follow that rule
- Nav and search glyphs: `public/brand/icons/{home,compass,dm,user,search}.png`, drawn as CSS masks so the active tab tints purple via `currentColor`
- Data: `src/data/snags.ts`, `src/data/players.ts`, `src/data/threads.ts`, `src/data/engagement.ts`, `src/data/games.ts`
- Game artwork: `public/games/*.png` — one cropped publisher logo per catalogued title, bundled rather than loaded from a store CDN
