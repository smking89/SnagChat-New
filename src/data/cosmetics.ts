/**
 * The rules every SnagChat cosmetic is judged against. The shop renders these
 * in the Guidelines tab, and Creator Studio points new sellers at the same
 * source, so the published rules cannot drift from the submission form.
 */

export type CosmeticCategoryId =
  | "avatar-frame"
  | "banner-frame"
  | "snag-frame"
  | "nameplate"
  | "username-font"
  | "effect"
  | "sticker-pack"
  | "gif"
  | "meme";

export type CosmeticGuideline = {
  id: CosmeticCategoryId;
  title: string;
  eyebrow: string;
  blurb: string;
  canvas: string;
  safeArea: string;
  formats: string;
  fileSize: string;
  duration: string;
  rules: string[];
};

/** Canvas, size and delivery rules for every category in the shop. */
export const COSMETIC_GUIDELINES: CosmeticGuideline[] = [
  {
    id: "avatar-frame",
    title: "Avatar borders",
    eyebrow: "Profile photo",
    blurb:
      "A ring or badge that sits around a circular profile photo. It must read at 22px in a feed card and at 96px on a profile.",
    canvas: "512 × 512 px, centred circle",
    safeArea: "Keep the inner 440px clear; keep all artwork inside a 24px outer margin.",
    formats: "SVG or transparent PNG / WebP. One border, no background plate.",
    fileSize: "8–400 KB. SVG should stay under 120 KB.",
    duration: "Static artwork. Motion comes from an effect, never a looping video.",
    rules: [
      "Do not draw over the centre of the face; the photo must remain recognisable.",
      "The ring must still read when the avatar is 22px, so avoid hairlines under 3px at 512px.",
      "No text, logos or watermarks inside the avatar border.",
      "Do not use pure white behind the artwork; transparency is required.",
      "The border is clipped to the avatar circle, so nothing may depend on artwork outside it.",
    ],
  },
  {
    id: "banner-frame",
    title: "Profile banner borders",
    eyebrow: "Banner",
    blurb:
      "A wide border for the 1200 × 380 header on a profile. It should border the banner, not compete with the avatar that overlaps its bottom-left.",
    canvas: "1200 × 380 px",
    safeArea: "24px outer edge; leave the bottom-left 200 × 160px quiet for the avatar.",
    formats: "SVG or transparent PNG / WebP.",
    fileSize: "12–800 KB. SVG should stay under 200 KB.",
    duration: "Static artwork. Use an effect for movement.",
    rules: [
      "Keep the middle 70% transparent so the banner art remains visible.",
      "Do not place important detail where the profile avatar overlaps the banner.",
      "The artwork stretches to the banner box; test it at 320px and 1320px wide.",
      "No animated GIF or video banner borders — the banner itself may already be a clip.",
      "Do not add a background tint; the player's banner supplies the colour.",
    ],
  },
  {
    id: "snag-frame",
    title: "Post borders",
    eyebrow: "Feed card",
    blurb:
      "A border around the whole post — media, author row and title — not just the image. It is the largest cosmetic, so it must stay quiet.",
    canvas: "1200 × 1600 px source, stretched to the card",
    safeArea: "32px edge safe area; keep the author row, title and action pills clear.",
    formats: "SVG or transparent PNG / WebP.",
    fileSize: "24 KB–1 MB. SVG should stay under 250 KB.",
    duration: "Static artwork. Post borders do not animate in the feed.",
    rules: [
      "Do not cover the 86px meta strip with opaque art; text must stay readable.",
      "Do not obscure the like, save, edit, delete or ad controls.",
      "Corners must match the card's 16px radius or be deliberately inscribed inside it.",
      "The border is clipped to the card, so no artwork can spill into the next column.",
      "Use open space in the middle; a heavy fill is rejected.",
    ],
  },
  {
    id: "nameplate",
    title: "Message nameplates",
    eyebrow: "Chat + inbox",
    blurb:
      "A plaque behind a player's display name in a chat header or inbox row. It must never hide the name or the blue check.",
    canvas: "600 × 128 px, horizontally stretchable",
    safeArea: "24px left and right; 16px top and bottom.",
    formats: "SVG or transparent PNG / WebP.",
    fileSize: "8–300 KB. SVG should stay under 100 KB.",
    duration: "Static artwork. It gets one entrance when a chat opens.",
    rules: [
      "The centre must stay transparent enough for dark text.",
      "Do not draw over the display name; decoration belongs at the edges.",
      "Design for a name that grows from 4 to 22 characters.",
      "No text baked into the plate and no crown or badge that could be mistaken for verification.",
      "Test against both the inbox row and the chat header.",
    ],
  },
  {
    id: "username-font",
    title: "Username fonts",
    eyebrow: "Display type",
    blurb:
      "A display face for a player's name in chats and on their profile. It is a type licence, not an image.",
    canvas: "TTF, OTF or WOFF2",
    safeArea: "Keep the cap height and baseline consistent with Inter; test at 12px, 24px and 66px.",
    formats: "TTF, OTF or WOFF2 with Latin-1 and Latin Extended-A coverage.",
    fileSize: "8–80 KB per weight. Ship two weights maximum.",
    duration: "No animation. Effects belong to the border, not the letters.",
    rules: [
      "Every letter, number, @, # and _ must be present and distinguishable.",
      "No font that replaces letters with symbols or makes the handle unreadable.",
      "Ship the licence with the upload; do not upload a font you cannot redistribute.",
      "Provide a static fallback stack: the chosen face, then Inter, then sans-serif.",
      "Do not use a font to impersonate SnagChat, a platform or a verification badge.",
    ],
  },
  {
    id: "effect",
    title: "Effects",
    eyebrow: "Motion",
    blurb:
      "Motion attached to a border. Effects are an accent on an interaction, never a permanent screensaver.",
    canvas: "CSS transform and opacity only",
    safeArea: "The effect must stay inside the border's clipped host; nothing can spill into the GUI.",
    formats: "CSS keyframes registered in `src/index.css` and described in `src/data/frames.ts`.",
    fileSize: "No asset download. Keep the whole effect definition under 4 KB.",
    duration: "0.6–2.5 seconds, one play per interaction, at most two iterations.",
    rules: [
      "No infinite loops, no autoplay while scrolling and no hover-only state that hides the border.",
      "Do not animate layout properties (width, height, margin, top, left).",
      "No more than three brightness flashes per second and no rapid strobing.",
      "The idle state must be the static border; the effect returns to it after playing.",
      "Respect `prefers-reduced-motion` and cancel when the owning screen closes.",
      "Do not move text, buttons or handles; decoration only.",
    ],
  },
  {
    id: "sticker-pack",
    title: "Sticker packs",
    eyebrow: "Chat + comments",
    blurb:
      "A set of transparent reaction images someone can drop into a message or comment. The pack is the product; individual stickers are the pieces.",
    canvas: "512 × 512 px per sticker",
    safeArea: "24px transparent margin on every side.",
    formats: "Animated WebP, APNG or GIF; static WebP or PNG for non-animated pieces.",
    fileSize: "32 KB–1 MB per sticker; 1–40 stickers per pack.",
    duration: "1–8 seconds per loop, 24fps maximum.",
    rules: [
      "Transparent background only; no white or black plate.",
      "The silhouette must read at 96px in a message bubble.",
      "No flashing, strobe or more than three brightness changes per second.",
      "Do not put a URL, QR code or unlicensed character in a sticker.",
      "Provide a name, a 2–4 word description and a mature-content flag.",
      "Sticker packs must work as a set: same line weight, palette and resolution.",
    ],
  },
  {
    id: "gif",
    title: "GIFs and clips",
    eyebrow: "Klipy library",
    blurb:
      "Searchable GIFs, stickers and memes from KLIPY, shared into chats, comments and stories.",
    canvas: "480 × 480 px source minimum; square and 4:5 crops preferred",
    safeArea: "Keep faces and captions away from the outer 8% so bubble corners never crop them.",
    formats: "GIF or MP4 served by KLIPY; the app displays the returned preview and full file.",
    fileSize: "Up to 5 MB per item in the picker; preview under 800 KB.",
    duration: "1–10 seconds, 24fps maximum.",
    rules: [
      "Search must use the KLIPY attribution: the field reads “Search KLIPY” and the picker shows “Powered by KLIPY”.",
      "Never hotlink a KLIPY file outside the picker; use the URLs the API returns.",
      "Respect the content filter and mature flags returned by the API.",
      "A shared GIF keeps its KLIPY credit on the message card.",
      "Do not download and re-upload KLIPY content as your own cosmetic.",
    ],
  },
  {
    id: "meme",
    title: "Memes",
    eyebrow: "Klipy library",
    blurb:
      "The caption-led branch of the KLIPY library. Memes are image-first and must remain legible when they are scaled into a chat bubble.",
    canvas: "1080 × 1080 px or 1080 × 1350 px",
    safeArea: "64px caption safe area; keep the joke inside the central 80%.",
    formats: "PNG, WebP or animated WebP served by KLIPY.",
    fileSize: "Up to 5 MB per item; preview under 800 KB.",
    duration: "Static or 1–10 seconds, 24fps maximum.",
    rules: [
      "Caption text must stay at least 24px at 1080px wide so it survives a 200px bubble.",
      "No cropped punchlines, no tiny watermarks and no more than two caption blocks.",
      "Do not use a meme as a border, sticker or badge.",
      "Keep the KLIPY attribution on the shared card and in the picker.",
    ],
  },
];

export type CosmeticState = {
  id: string;
  label: string;
  description: string;
};

/** The five states every animated cosmetic has to support. */
export const COSMETIC_STATES: CosmeticState[] = [
  {
    id: "idle",
    label: "Idle",
    description:
      "The static border is always visible. No continuous motion, no replay on scroll and no layout shift.",
  },
  {
    id: "enter",
    label: "Enter",
    description:
      "Opening a profile, post, chat or shop selection plays the effect once for 2 seconds or less.",
  },
  {
    id: "active",
    label: "Active",
    description:
      "The effect stays inside its clipped host, below text and controls, and never intercepts a tap.",
  },
  {
    id: "exit",
    label: "Exit",
    description:
      "The effect fades back to the static border in 200–400ms; no particles or layers are left behind.",
  },
  {
    id: "interrupted",
    label: "Interrupted",
    description:
      "Closing the screen, changing the selection or enabling reduced motion cancels the effect immediately.",
  },
];

export const COSMETIC_ACCEPTANCE = [
  "Idle state is static and readable at the smallest size the cosmetic appears.",
  "The effect plays once per interaction, never loops, and returns to idle.",
  "Replay restarts cleanly without stacking duplicate animations.",
  "The artwork is clipped to its surface and never covers text or controls.",
  "Reduced-motion users see the static border; no required information is motion-only.",
  "The preview in the shop is the same renderer used on the live surface.",
  "Selection never purchases or applies an item by itself.",
  "Assets stay inside the category's size and duration limits above.",
];
