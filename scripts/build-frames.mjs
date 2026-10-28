/**
 * Generates the static frame artwork in public/frames.
 *
 * Every frame is a plain SVG file so the shop can treat it as an image: no
 * runtime drawing, no scripts, and nothing to execute when it renders. The
 * centre of each frame is transparent, so it layers over a photo or clip.
 *
 * Run with `node scripts/build-frames.mjs`. The output is committed, so the
 * app never depends on this script at build time.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "frames");
mkdirSync(OUT, { recursive: true });

const AV = "0 0 240 240";

/*
 * preserveAspectRatio="none" is deliberate. The artwork is laid over boxes
 * whose aspect changes with the surface (a wide banner, a 4:5 feed card, a
 * nameplate that grows with the name), so the frame must stretch to that box
 * instead of letterboxing itself into a centred strip.
 */
const svg = (viewBox, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="none" fill="none">${defs}${body}</svg>\n`;

const glow = (id = "glow", blur = 4) => `
  <filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="${blur}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

const linear = (id, a, b) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
  </linearGradient>`;

/** A ring designed to sit just outside a circular 124%-wide avatar overlay. */
const ring = (id, width = 6, extra = "") =>
  `<circle cx="120" cy="120" r="104" stroke="url(#${id})" stroke-width="${width}"${extra}/>`;

const files = {};

// ---------------------------------------------------------------- avatars ---

files["avatar-halo-violet.svg"] = svg(
  AV,
  `${linear("g", "#e9d5ff", "#7c3aed")}${glow("glow", 5)}`,
  `<circle cx="120" cy="120" r="104" stroke="#a855f7" stroke-opacity="0.16" stroke-width="20"/>
   ${ring("g", 8, ' filter="url(#glow)"')}
   <circle cx="120" cy="120" r="94" stroke="#f5d0fe" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="2 11" stroke-linecap="round"/>
   <circle cx="176" cy="56" r="7" fill="#f5d0fe"/>
   <circle cx="176" cy="56" r="13" stroke="#f0abfc" stroke-opacity="0.35" stroke-width="2"/>`,
);

files["avatar-circuit-cyan.svg"] = svg(
  AV,
  `${linear("g", "#67e8f9", "#0891b2")}${glow("glow", 4)}`,
  `${ring("g", 5, ' filter="url(#glow)"')}
   <circle cx="120" cy="120" r="96" stroke="#22d3ee" stroke-opacity="0.35" stroke-width="2"/>
   ${Array.from({ length: 8 }, (_, index) => {
     const angle = (index * Math.PI) / 4 + Math.PI / 8;
     const x1 = 120 + Math.cos(angle) * 100;
     const y1 = 120 + Math.sin(angle) * 100;
     const x2 = 120 + Math.cos(angle) * 118;
     const y2 = 120 + Math.sin(angle) * 118;
     return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#67e8f9" stroke-width="5" stroke-linecap="round"/>
     <circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3" fill="#a5f3fc"/>`;
   }).join("")}`,
);

files["avatar-ember-ring.svg"] = svg(
  AV,
  `${linear("g", "#fbbf24", "#b91c1c")}${glow("glow", 5)}`,
  `<circle cx="120" cy="120" r="104" stroke="#f97316" stroke-opacity="0.14" stroke-width="22"/>
   ${ring("g", 7, ' filter="url(#glow)"')}
   <path d="M120 4c10 14 4 20 12 30 6-8 6-16 6-16 10 12 16 24 8 38-5 8-16 12-26 8 2-10-6-14-8-22-2 10-10 14-10 24 0 16 12 26 26 26s26-10 26-26c0-22-20-34-34-62z" fill="url(#g)" fill-opacity="0.9"/>
   <circle cx="66" cy="70" r="3" fill="#fdba74"/>
   <circle cx="184" cy="150" r="2.5" fill="#fca5a5"/>`,
);

files["avatar-frost-crown.svg"] = svg(
  AV,
  `${linear("g", "#e0f2fe", "#38bdf8")}${glow("glow", 4)}`,
  `${ring("g", 5, ' filter="url(#glow)"')}
   <path d="M120 2l11 24-11 16-11-16z" fill="#bae6fd"/>
   <path d="M84 14l8 22-12 10-8-18z" fill="#bae6fd" fill-opacity="0.78"/>
   <path d="M156 14l12 14-8 18-12-10z" fill="#bae6fd" fill-opacity="0.78"/>
   <circle cx="120" cy="120" r="94" stroke="#e0f2fe" stroke-opacity="0.5" stroke-width="1.5" stroke-dasharray="1 9"/>
   <circle cx="44" cy="88" r="2.5" fill="#e0f2fe"/>
   <circle cx="196" cy="168" r="2" fill="#e0f2fe"/>`,
);

files["avatar-gold-laurel.svg"] = svg(
  AV,
  `${linear("g", "#fef3c7", "#b45309")}${glow("glow", 3)}`,
  `${ring("g", 5, ' filter="url(#glow)"')}
   <circle cx="120" cy="120" r="112" stroke="#fcd34d" stroke-opacity="0.4" stroke-width="1.5"/>
   ${[
     [60, 172, -38],
     [48, 150, -54],
     [44, 124, -72],
     [172, 174, 38],
     [186, 152, 54],
     [190, 126, 72],
   ]
     .map(
       ([cx, cy, rot]) =>
         `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="5.5" transform="rotate(${rot} ${cx} ${cy})" fill="url(#g)"/>`,
     )
     .join("")}
   <path d="M120 12l3.6 8.4 9 0.8-6.9 6 2 8.9-7.7-4.5-7.7 4.5 2-8.9-6.9-6 9-0.8z" fill="#fcd34d"/>`,
);

files["avatar-glitch-shift.svg"] = svg(
  AV,
  `${linear("g", "#67e8f9", "#f0abfc")}${glow("glow", 3)}`,
  `<circle cx="120" cy="120" r="104" stroke="#f0abfc" stroke-width="6" stroke-opacity="0.55" stroke-dasharray="34 12 6 12" transform="rotate(8 120 120)"/>
   <circle cx="120" cy="120" r="104" stroke="#22d3ee" stroke-width="6" stroke-opacity="0.6" stroke-dasharray="20 14 42 10" transform="rotate(-7 120 120)"/>
   ${ring("g", 3, ' filter="url(#glow)"')}
   <rect x="170" y="40" width="22" height="5" fill="#f0abfc"/>
   <rect x="52" y="182" width="14" height="4" fill="#22d3ee"/>
   <rect x="196" y="188" width="9" height="9" fill="#f0abfc" fill-opacity="0.6"/>`,
);

// ---------------------------------------------------------------- banners ---
const BN = "0 0 1200 320";
const bannerBase = (id) =>
  `<rect x="4" y="4" width="1192" height="312" rx="20" stroke="url(#${id})" stroke-width="6"/>`;

files["banner-neon-grid.svg"] = svg(
  BN,
  `${linear("g", "#c084fc", "#22d3ee")}${glow("glow", 5)}`,
  `${bannerBase("g")}
   <rect x="14" y="14" width="1172" height="292" rx="14" stroke="#22d3ee" stroke-opacity="0.22" stroke-width="1.5"/>
   <g stroke="#22d3ee" stroke-opacity="0.2" stroke-width="1.2">
     ${Array.from({ length: 9 }, (_, i) => `<path d="M${120 + i * 120} 220L${120 + i * 120} 312"/>`).join("")}
     ${Array.from({ length: 4 }, (_, i) => `<path d="M0 ${240 + i * 24}H1200"/>`).join("")}
   </g>
   <circle cx="1130" cy="58" r="34" stroke="#c084fc" stroke-opacity="0.4" stroke-width="2"/>
   <circle cx="1130" cy="58" r="6" fill="#67e8f9"/>`,
);

files["banner-ember-drift.svg"] = svg(
  BN,
  `${linear("g", "#fbbf24", "#dc2626")}${glow("glow", 6)}`,
  `${bannerBase("g")}
   ${[
     [130, 300, 4],
     [310, 288, 2.5],
     [520, 306, 3.5],
     [760, 292, 2],
     [980, 304, 4],
     [1120, 286, 2.5],
   ]
     .map(
       ([cx, cy, r]) =>
         `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fdba74"/>`,
     )
     .join("")}
   <path d="M40 300c60-18 90 10 150-8s90 8 150-10" stroke="#fb923c" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/>
   <path d="M900 26c40 16 70-6 110 6" stroke="#fbbf24" stroke-opacity="0.3" stroke-width="3" stroke-linecap="round"/>`,
);

files["banner-galaxy.svg"] = svg(
  BN,
  `${linear("g", "#818cf8", "#c026d3")}${glow("glow", 6)}`,
  `${bannerBase("g")}
   <circle cx="90" cy="286" r="120" fill="#4c1d95" fill-opacity="0.35"/>
   <circle cx="1130" cy="30" r="120" fill="#701a75" fill-opacity="0.32"/>
   ${Array.from({ length: 28 }, (_, index) => {
     const x = (index * 137) % 1160 + 20;
     const y = (index * 71) % 280 + 20;
     const r = index % 5 === 0 ? 2.2 : 1.3;
     return `<circle cx="${x}" cy="${y}" r="${r}" fill="#e0e7ff" fill-opacity="${index % 3 === 0 ? 0.9 : 0.55}"/>`;
   }).join("")}
   <path d="M120 90l46 26 38-16 30 34" stroke="#c7d2fe" stroke-opacity="0.35" stroke-width="1.2" stroke-dasharray="3 6"/>`,
);

files["banner-scanlines.svg"] = svg(
  BN,
  `${linear("g", "#22d3ee", "#0e7490")}`,
  `${bannerBase("g")}
   <g stroke="#22d3ee" stroke-opacity="0.3" stroke-width="1.5">
     ${Array.from({ length: 9 }, (_, i) => `<path d="M${40 + i * 34} 20V70"/><path d="M${40 + i * 34} 250V300"/>`).join("")}
   </g>
   <path d="M600 14v18M600 288v18" stroke="#67e8f9" stroke-width="2"/>
   <rect x="575" y="4" width="50" height="6" rx="3" fill="#22d3ee"/>`,
);

// ------------------------------------------------------------- nameplates ---
const NP = "0 0 300 64";
const plateBase = (id, extra = "") =>
  `<rect x="4" y="4" width="292" height="56" rx="28" stroke="url(#${id})" stroke-width="4"${extra}/>`;

files["plate-violet.svg"] = svg(
  NP,
  `${linear("g", "#e9d5ff", "#7e22ce")}${glow("glow", 3)}`,
  `${plateBase("g", ' filter="url(#glow)"')}
   <path d="M24 32l6 6 6-6-6-6z" fill="#e9d5ff"/>
   <path d="M264 32l6 6 6-6-6-6z" fill="#e9d5ff"/>
   <path d="M70 4h160" stroke="#f5d0fe" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>`,
);

files["plate-gold.svg"] = svg(
  NP,
  `${linear("g", "#fef3c7", "#b45309")}`,
  `${plateBase("g", "")}
   <rect x="10" y="10" width="280" height="44" rx="22" stroke="#fcd34d" stroke-opacity="0.55" stroke-width="1.5"/>
   <path d="M141 0h18l4 8h-26z" fill="#fcd34d"/>`,
);

files["plate-holo.svg"] = svg(
  NP,
  `${linear("g", "#67e8f9", "#f0abfc")}${glow("glow", 3)}`,
  `<rect x="4" y="4" width="292" height="56" rx="28" stroke="#67e8f9" stroke-opacity="0.35" stroke-width="4"/>
   <rect x="8" y="8" width="284" height="48" rx="24" stroke="url(#g)" stroke-width="3" stroke-dasharray="26 10 4 10" filter="url(#glow)"/>
   <circle cx="24" cy="32" r="3" fill="#a5f3fc"/><circle cx="276" cy="32" r="3" fill="#f0abfc"/>`,
);

// ------------------------------------------------------------------ snags ---
const SN = "0 0 400 500";

files["snag-neon-edge.svg"] = svg(
  SN,
  `${linear("g", "#c084fc", "#22d3ee")}${glow("glow", 5)}`,
  `<rect x="2" y="2" width="396" height="496" rx="20" stroke="#a855f7" stroke-opacity="0.22" stroke-width="8"/>
   <rect x="4" y="4" width="392" height="492" rx="18" stroke="url(#g)" stroke-width="3" filter="url(#glow)"/>
   <rect x="12" y="12" width="376" height="476" rx="12" stroke="#e9d5ff" stroke-opacity="0.3" stroke-width="1"/>`,
);

files["snag-corner-brackets.svg"] = svg(
  SN,
  `${linear("g", "#ffffff", "#a855f7")}${glow("glow", 4)}`,
  `<g stroke="url(#g)" stroke-width="6" stroke-linecap="round" filter="url(#glow)">
     <path d="M16 58V30a14 14 0 0 1 14-14h28"/>
     <path d="M342 16h28a14 14 0 0 1 14 14v28"/>
     <path d="M384 442v28a14 14 0 0 1-14 14h-28"/>
     <path d="M58 484H30a14 14 0 0 1-14-14v-28"/>
   </g>
   <path d="M200 10l6 8-6 8-6-8z" fill="#e9d5ff"/>`,
);

files["snag-tape.svg"] = svg(
  SN,
  `${linear("tape", "#fde68a", "#f59e0b")}`,
  `<g transform="rotate(-3 120 10)">
     <rect x="36" y="-6" width="168" height="26" fill="url(#tape)" fill-opacity="0.9"/>
     <path d="M46 -6l10 26M70 -6l10 26M94 -6l10 26M118 -6l10 26M142 -6l10 26M166 -6l10 26M190 -6l10 26" stroke="#78350f" stroke-opacity="0.22" stroke-width="2"/>
   </g>
   <g transform="rotate(2 280 490)">
     <rect x="198" y="488" width="168" height="16" fill="#17191d" fill-opacity="0.72"/>
     <path d="M208 488l6 16M232 488l6 16M256 488l6 16M280 488l6 16M304 488l6 16M328 488l6 16M352 488l6 16" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
   </g>`,
);

files["snag-arcade.svg"] = svg(
  SN,
  `${linear("g", "#c084fc", "#22d3ee")}${glow("glow", 4)}`,
  `<rect x="3" y="3" width="394" height="494" rx="12" stroke="#7c3aed" stroke-width="5"/>
   <rect x="12" y="12" width="376" height="476" rx="6" stroke="#67e8f9" stroke-width="1.5" stroke-dasharray="8 8"/>
   ${[
     [3, 3],
     [383, 3],
     [3, 483],
     [383, 483],
   ]
     .map(
       ([x, y]) =>
         `<g fill="url(#g)"><rect x="${x}" y="${y}" width="10" height="10"/><rect x="${x + 12}" y="${y}" width="5" height="5" opacity="0.6"/></g>`,
     )
     .join("")}
   <path d="M200 3v12M200 485v12" stroke="#67e8f9" stroke-width="2"/>`,
);

files["snag-gold-gallery.svg"] = svg(
  SN,
  `${linear("g", "#fef3c7", "#b45309")}${glow("glow", 4)}`,
  `<rect x="2.5" y="2.5" width="395" height="495" rx="10" stroke="url(#g)" stroke-width="5"/>
   <rect x="10" y="10" width="380" height="480" rx="6" stroke="#fcd34d" stroke-opacity="0.55" stroke-width="1.2"/>
   <path d="M200 2l8 10-8 10-8-10z" fill="#fcd34d"/>
   <path d="M10 34V16h18M372 10h18v18M390 466v18h-18M28 490H10v-18" stroke="#fcd34d" stroke-opacity="0.65" stroke-width="2"/>`,
);

let written = 0;
for (const [name, contents] of Object.entries(files)) {
  writeFileSync(join(OUT, name), contents, "utf8");
  written += 1;
}

console.log(`wrote ${written} frame files to public/frames`);
