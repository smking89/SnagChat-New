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
- **Filters** — sticky category rail (For You, Clips, Loadouts, Screenshots, Squad Galleries) with black-and-white selected state.
- **Search** — header search filters snags by title, game, creator or category.
- **Snag view** — tap a card to open the snag: author, game, category, like count, comments and share.
- **Likes** — heart on every card and in the snag view; counts update and persist.
- **Comments** — per-snag comment thread with seeded comments and an inline composer.
- **Share** — share action in the snag view, or long-press (right-click) a card for a prefilled quick share. Send to a squad or to a player, which drops the snag into a DM thread. The same sheet has **Share a link** and **Copy link**: links look like `?snag=<id>` and reopen the feed with that post already open.
- **Profile links** — the share icon in a profile header copies or shares `?player=<handle>`, which opens that profile directly.
- **Motion** — profile stats (snags / followers / following) count up from their previous value with an eased curve (`src/components/CountUp.tsx`); every icon does a rubber-band squash on hover and on press (`src/lib/iconRubber.ts` + `@keyframes icon-rubber` in `src/index.css`); and feed cards spring (`src/lib/cardBounce.ts` + `@keyframes card-bounce` / `card-pop`) — a hover or press squash, plus a pop as they scroll back into view. All of it respects `prefers-reduced-motion`, and the animations are one-off (no looping motion).
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

## Accounts

The app opens on a purple sign-in screen: logo, email and password, a `Forgot password?` notice, `Try a demo account`, **Steam / Xbox / Discord** buttons, and an eight-step registration. The sign-in and register button is solid white with black text.

Registration (`src/components/AuthScreen.tsx`) walks: account (name, email, password) → username with live availability → birthday → region → **PC / Console / Both** → at least four interests → optional phone → optional gender. Social buttons use the official brand marks (Simple Icons SVG in `public/brand/social`) drawn as CSS masks, so each logo takes the app's own white/active colour instead of a foreign brand block. The username field shows a **green tick with "@name is available"** or a **red cross** for taken, too short or invalid names; seeded player handles are reserved. Birthday must make the account at least 13.

Platform choice (`src/data/platforms.ts`) is multi-select: PC and Console toggle independently, and **Both** selects them together — at least one is required and the account panel shows "Plays on: PC + Console".

Region options (`src/data/regions.ts`): US (US East and US West infrastructure), EU (centralized European hubs), AU (Oceania coverage) and SEA (Singapore-centred Asia-Pacific hubs). The choice is required at sign-up and shown in the account panel.

Provider buttons are a **preview stand-in**: there is no OAuth in this build, so they record the provider locally and finish setup in the welcome flow. Accounts are created client-side in `src/lib/auth.ts` and kept in `localStorage` with a per-account salt and a SHA-256 hash — not server-enforced security. Username, birthday, interests, phone and gender are stored on the account record; birthday, gender and phone are shown only in your own profile editor (Profile → Edit → Account), never on a public profile. Sign out from that same section.

## Onboarding

Email registration collects the profile details itself, so it lands straight on the feed with your interests on your profile. Everyone else — demo account or Steam/Xbox/Discord — gets the three-step welcome flow (`src/components/WelcomeFlow.tsx`): what SnagChat is, display name, handle and optional photo, then a starting feed filter. Skipping or finishing writes `snagchat:onboarded`, so it appears once per browser. Clear that key to see it again.

## State

Likes, comments, follows, profile edits, posted snags and DM threads persist in `localStorage` (`snagchat:*`), so they survive reloads on the same browser. There is no backend: nothing syncs between devices and no message is delivered anywhere.

Account settings (`private`, `followPermission`, `invitePermission`) live on the profile record. The download export is built in `src/App.tsx` (`downloadData`) and written by `src/lib/export.ts`; it includes the account record minus `hash` and `salt`, the profile, posted snags, likes, comments, follows, squads, invites and DM threads. Deleting calls `deleteAccount` in `src/lib/auth.ts` and clears local storage.

Shared links carry the deep link in the query string (`src/lib/share.ts` reads it and `?snag=` / `?player=` are stripped after use). Because posts live in that browser's storage, a link to a post you created opens that post for you, while anyone else lands on the feed — real cross-device links need the post stored on a server.

## Assets

- Feed imagery: `public/snags/*.jpg`
- Brand artwork: `public/brand/snagchat-wordmark.png`, `snagchat-icon.png`, and the favicon PNGs in the same folder. The fist icon is the logo below 1280px (phones and tablets); the wordmark is used on desktop widths — header, footer and sign-in screen all follow that rule
- Nav and search glyphs: `public/brand/icons/{home,compass,dm,user,search}.png`, drawn as CSS masks so the active tab tints purple via `currentColor`
- Data: `src/data/snags.ts`, `src/data/players.ts`, `src/data/threads.ts`, `src/data/engagement.ts`
