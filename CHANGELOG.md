# Changelog

All notable changes to SnagChat are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every push to `main` appends its commits to the newest section automatically
(`.github/workflows/changelog.yml`), so entries can be written by hand as well as
generated.

## [Unreleased]

### Added

- Squads can be created in the app: name the squad, choose a public or private gallery, and you land on it as the owner with an empty roster ready for invites.
- Counter-Strike 2, VALORANT, 7 Days to Die, SCUM, Valheim, Satisfactory, Unturned and Enshrouded are in the game catalogue, so they appear in the compose and edit pickers, the top-games sheet and the welcome interests.
- Deleting a squad can be undone from the confirmation toast: the squad, its gallery posts, your own posts on your profile grid and any pending invites all come back.
- Saving profile changes — name, handle, bio, photo, banner and region — can be undone in one tap, including the username rewrite on your own posts and the account record.
- `CHANGELOG.md` with the history below, plus a workflow that appends each push to `main` and a CI workflow that typechecks and builds every push and pull request.
- Upload sandbox: every image is decoded in a worker, the original file is discarded, and a new file is written from the decoded pixels (`src/lib/fileSandbox.ts`, `src/workers/imageSandbox.worker.ts`). Appended payloads, metadata and fake extensions never reach storage.
- MP4 uploads are checked for a real ISO-BMFF container (`ftyp`, size fields, `moov`) before they are accepted, so a renamed archive or script is refused with a clear reason.
- Feed ranking engine in `src/engine`: in-network retrieval over follows and squads, taste clusters, BM25 search, a light rank, a multi-intent heavy rank, cold-start shrinkage, a separate visibility gate, a labeled fourth-slot sponsor and an inspectable trace.
- `npm test` runs 18 engine assertions on Node's built-in runner, and CI runs them on Node 22 before the production build.
- SnagChat Shop with a Shop tab in the desktop nav and mobile bottom bar: 18 static frames across avatar, banner, message nameplate and card surfaces, two included starter frames, an inline live preview panel and a demo checkout that shows the 2.5% seller fee.
- 24 frame effects, split into looping (pulse, bounce, rubberband, wiggle, shake, flash, swing, jello, parallax, stagger) and one-shot (slide in four directions, fade in/out, zoom in/out, flip, roll in/out, tada, pop). The effect is chosen separately from the frame and can be previewed before applying.
- Frames render on profile photos, banners, profile nameplates, chat nameplates, inbox rows and the posts you upload, with the green presence dot in front of the artwork. Card frames wrap the whole post card rather than only the image.
- Shop previews show the real surface: an author-row avatar, a profile banner header, a chat nameplate and a complete feed card, driven by the same renderers as the live app.
- The Screenshots category is now **Builds**, for players posting their base builds; the seeded builds, composer, welcome flow, discovery interests and ranking labels follow the rename.
- Creator studio with a verified-only application, a product builder that publishes a frame into the shop's Community drops, and a seller dashboard with Stripe Connect onboarding (demo), connected-account state, a fee calculator and a sales table.
- Advertising portal behind the footer's **Advertise with us**, with live feed-card, story and nameplate-takeover previews, per-placement CPM estimates and a campaign flight builder.
- Footer links for Advertise with us, the developer portal and the frame shop, plus the snagchat.io / developer.snagchat.io / advertise.snagchat.io domain line.
- `src/data/frames.test.ts` covers the marketplace fee, catalogue integrity and loadouts, taking `npm test` to 26 assertions.

### Changed

- The squads empty state reads **No squads yet** and offers a Create squad button, with a matching create action in the squads header once the first one exists.
- The app ships no placeholder content: the seeded players, posts, threads, squads, invites, notifications, likes/saves/shares/comments and pre-worn frames are all gone. The feed, inbox, notifications and squads open on empty states, a new account starts at 0 followers with an empty bio, and the seeded collections use fresh storage keys so a browser that cached the old demo starts clean.
- Posting starts from your own artwork: the four stock cover templates are out of the composer, and Post snag stays disabled until you upload an image or pick a clip (the made-up `0:22` clip length went with them).
- The ranking tests keep their fixed corpus in `src/engine/seed-corpus.ts`, which only the test suite imports.
- The header is pinned at every width, not just from `lg`, so the search, notifications and squads actions keep their exact spot while the feed scrolls; the category rail parks directly under it using the published `--topbar-h`.
- The storefront is parked behind `SHOP_ENABLED` in `src/lib/features.ts`: the Shop tab, the footer's Frame shop link, the profile's frame-studio button and the shop screen itself are all off for every account, demo ones included, so the seller tools and Stripe payouts cannot be reached.
- Game logos are bare artwork — no pill or plate around them and no shadow, glow or outline — in the composer picker, the top-games sheet and post headers. Picking a title bolds its name and ticks it instead of filling a capsule.
- Unturned uses the SteamGridDB icon, converted from the `.ico` to the 256px PNG the catalogue expects.
- Game artwork is the published square app icon for every title that has one (Rust, CS2, VALORANT, Minecraft, ARK, DayZ, 7 Days to Die, SCUM, Valheim, Satisfactory, Unturned, Enshrouded, Palworld), replacing the old white wordmarks; titles without one keep their existing logo.
- `npm test` also runs `src/data/*.test.ts`, so the fee and catalogue tests run with the engine suite in CI.
- The auth screen's primary actions are white with black text, and the Steam, Xbox and Discord tiles are white with black labels and marks instead of purple.
- GIFs are accepted but saved as a rebuilt still frame instead of an animated file, because the sandbox writes fresh pixels rather than copying the original container.
- Feed cards share one 4:5 media frame and an 86px meta strip instead of using each image's own aspect, so every card is the same height and the masonry columns stay even. The uncropped aspect is still used in the snag view, and Edit/Delete for your own posts moved onto the artwork.
- `For You`, category tabs and search results are now ordered by that engine instead of seed order; the labeled sponsor sits in the fourth slot, and interaction signals are picked up on the next filter, query or follow change rather than reshuffling the grid under a thumb.
- Desktop layout uses the width it is given: the shell and header grow to 1320px, the feed adds a fourth masonry column from 1280px, the masthead scales up, and the header becomes sticky from 1024px with the filter rail parked under it.
- The shop is one inline catalogue-and-preview page: selecting a frame updates the real-surface preview beside it (above it on phones), with the effect picker and buy/apply actions in the same panel. The old preview sheet is gone.
- Card frame artwork is redrawn along the outer edge only, so wrapping the whole card never covers the author row or title.

### Fixed

- Banner frames no longer letterbox into a centred strip: the generated SVGs stretch to their frame box (`preserveAspectRatio="none"`), so a frame hugs a wide banner or a nameplate that grows with the name.
- The welcome highlights draw their icons inline, so "Players worth following" keeps its icon even when the brand PNG cannot be fetched.
- The app declares `color-scheme: only light`, so Chrome and Android WebView forced dark mode no longer invert the white auth buttons and darken the welcome screen.
- The green online dot paints on top of ringed, coloured and video avatars, and the add-photo badge no longer covers it — that badge owns the corner only while your own profile has no photo, so the dot is hidden in that one state.

## [1.0.0] — 2026-10-27

### Added

- Masonry feed of gaming snags with Clips, Loadouts, Skins, Screenshots and Squad Galleries filters, a pinned tab rail and swipe-between-tabs on phones and tablets.
- Accounts with email registration, a demo account and Steam/Xbox/Discord preview providers; sign-in, password reset and account deletion all stay on the device.
- Snag view with likes, comments, saves, shares, reports and sponsored posts, plus deep links for posts (`?snag=`) and profiles (`?player=`).
- Composer for stills, GIFs and MP4 clips with cover presets, upload limits, hashtags and mentions (four tags per post), and game logos from a bundled catalogue.
- Profiles with editable name, handle, bio, region, private/public visibility, 320×320 photo and 1200×380 banner, including MP4 profile art that plays on a loop.
- Squads with owners and members, public and private galleries, invites that need accepting, ownership transfer and member management.
- Direct messages with delivery ticks, photo and handle headers, and threads that keep messages, expire them after 24 hours or remove them once viewed.
- Notifications, an installable PWA manifest, an Android WebView build (`snagchat.apk`) and local persistence for every interaction.

### Changed

- Brand artwork moved to the bare fist favicon and the purple brand system; cards and icons got motion, larger hit targets and readable action sizes.
- Game artwork is bundled cropped to its own edges, so logos fill their box without a plate behind them.

### Fixed

- Touch targets opt out of double-tap zoom and the page clips horizontal overflow, so the feed no longer pans sideways or zooms instead of liking.
- Game logos stay legible on light surfaces through a brightness filter rather than a black plate.

## [0.1.0] — 2026-10-27

### Added

- Initial cloud project and the first build of the SnagChat preview.
