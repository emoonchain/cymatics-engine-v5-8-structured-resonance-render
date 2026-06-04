#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export const SCI_MIN_FREQUENCY = 20;
export const SCI_MAX_FREQUENCY = 999;

export const scientificRarityNames = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function hashStringToSeed(input = "") {
  let h = 2166136261 >>> 0;
  const text = String(input);

  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

export function mulberry32(seed) {
  let t = seed >>> 0;

  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export const scientificRarityPalettes = {
  0: {
    id: "common-natural-sand",
    name: "Natural Sand",
    background: "#050505",
    plateFill: "#0b0907",
    plateGlow: "#18120b",
    linePrimary: "#d8c7a3",
    lineSecondary: "#efe1c2",
    textPrimary: "#d8c7a3",
    textSecondary: "#b8ad98",
    stroke: "#5f5340",
    glowStrength: 1.4,
  },
  1: {
    id: "uncommon-warm-sand",
    name: "Warm Sand",
    background: "#050505",
    plateFill: "#0e0905",
    plateGlow: "#221508",
    linePrimary: "#e6bd73",
    lineSecondary: "#ffe0a3",
    textPrimary: "#e6bd73",
    textSecondary: "#f0dbc0",
    stroke: "#8a6730",
    glowStrength: 2.1,
  },
  2: {
    id: "rare-cyan-flux",
    name: "Cyan Flux",
    background: "#03070a",
    plateFill: "#071118",
    plateGlow: "#0d2330",
    linePrimary: "#86e8ff",
    lineSecondary: "#c7f7ff",
    textPrimary: "#86e8ff",
    textSecondary: "#ddfbff",
    stroke: "#2f7187",
    glowStrength: 2.8,
  },
  3: {
    id: "epic-violet-resonance",
    name: "Violet Resonance",
    background: "#07050b",
    plateFill: "#110a1a",
    plateGlow: "#28103a",
    linePrimary: "#d9a8ff",
    lineSecondary: "#f0daff",
    textPrimary: "#d9a8ff",
    textSecondary: "#f7edff",
    stroke: "#74429d",
    glowStrength: 3.1,
  },
  4: {
    id: "legendary-gold-signal",
    name: "Gold Signal",
    background: "#050403",
    plateFill: "#100b04",
    plateGlow: "#3a2207",
    linePrimary: "#ffd36a",
    lineSecondary: "#fff0b8",
    textPrimary: "#ffd36a",
    textSecondary: "#fff2c9",
    stroke: "#b48122",
    glowStrength: 3.6,
  },
  5: {
    id: "mythic-prism-core",
    name: "Prism Core",
    background: "#050309",
    plateFill: "#100819",
    plateGlow: "#35145a",
    linePrimary: "#ffb7f7",
    lineSecondary: "#ffffff",
    textPrimary: "#ffb7f7",
    textSecondary: "#f5e8ff",
    stroke: "#c084fc",
    glowStrength: 4.2,
  },
};

export function pickScientificPaletteByRarity(rarityTier = 0) {
  return scientificRarityPalettes[rarityTier] || scientificRarityPalettes[0];
}
export function svgEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* -------------------------------------------------------------------------- */
/*                                   COLORS                                   */
/* -------------------------------------------------------------------------- */

export const scientificColorways = [
  {
    id: "amber-sand",
    name: "Amber Sand",
    background: "#050505",
    plateFill: "#0d0906",
    plateGlow: "#2a1708",
    linePrimary: "#f6d089",
    lineSecondary: "#ffe2ad",
    textPrimary: "#f6d089",
    textSecondary: "#f4e7cd",
    stroke: "#7c5a2a",
  },
  {
    id: "cyan-flux",
    name: "Cyan Flux",
    background: "#03070a",
    plateFill: "#071118",
    plateGlow: "#0d2330",
    linePrimary: "#86e8ff",
    lineSecondary: "#c7f7ff",
    textPrimary: "#86e8ff",
    textSecondary: "#ddfbff",
    stroke: "#2f7187",
  },
  {
    id: "violet-resonance",
    name: "Violet Resonance",
    background: "#07050b",
    plateFill: "#110a1a",
    plateGlow: "#28103a",
    linePrimary: "#d9a8ff",
    lineSecondary: "#f0daff",
    textPrimary: "#d9a8ff",
    textSecondary: "#f7edff",
    stroke: "#74429d",
  },
];

export function pickScientificColorway(seed = 0, mode = null) {
  const modeKey = mode
    ? `${mode.frequency}:${mode.n}:${mode.m}:${mode.waveNumberK}`
    : "scientific-default";

  const paletteSeed = hashStringToSeed(`${seed}:${modeKey}:palette`);
  const index = Math.abs(paletteSeed) % scientificColorways.length;
  return scientificColorways[index];
}

/* -------------------------------------------------------------------------- */
/*                                  MODE LOGIC                                */
/* -------------------------------------------------------------------------- */

export function normalizeChladniModePair(n, m) {
  let safeN = Math.max(1, Math.round(n));
  let safeM = Math.max(2, Math.round(m));

  if (safeN === safeM) {
    safeM += 1;
  }

  if (safeM > 22) {
    safeM = 22;
  }

  if (safeN === safeM) {
    safeN = Math.max(1, safeN - 1);
  }

  if (safeM <= safeN) {
    safeM = Math.min(22, safeN + 1);
  }

  return {
    n: safeN,
    m: safeM,
  };
}

export function familyFromScientificPair(n, m) {
  const diff = Math.abs(n - m);
  const complexity = n * m;

  if (n <= 2) return "Fundamental Cross";
  if (diff === 1 && complexity < 40) return "Mirror Cell";
  if (diff === 1) return "Mirror Mesh";
  if (diff === 2) return "Bridge Lattice";
  if (diff <= 3 && complexity < 80) return "Orbital Cells";
  if (diff <= 3) return "Dense Cross";
  if (complexity > 170) return "Fine Web";
  if (complexity > 120) return "Signal Lattice";
  if (complexity > 80) return "Nested Grid";
  return "Ring Square";
}

export function patternNameFromScientificPair(n, m, family) {
  const diff = Math.abs(n - m);
  const complexity = n * m;

  let prefix = "Resonant";
  if (complexity < 20) prefix = "Fundamental";
  else if (complexity < 50) prefix = "Central";
  else if (complexity < 90) prefix = "Structured";
  else if (complexity < 140) prefix = "Harmonic";
  else prefix = "Dense";

  let structure = "Field";
  if (diff === 1) structure = "Mirror";
  else if (diff === 2) structure = "Bridge";
  else if (diff <= 4) structure = "Lattice";
  else structure = "Drift";

  return `${prefix} ${structure} ${family}`;
}

export function generateScientificModeCatalog(count = 140) {
  const modes = [];

  for (let n = 1; n <= 18; n += 1) {
    for (let m = n + 1; m <= 22; m += 1) {
      if (n === m) continue;

      const diff = Math.abs(n - m);
      const complexity = n * m;

      if (diff > 7) continue;
      if (complexity < 6) continue;
      if (complexity > 260) continue;

      const safe = normalizeChladniModePair(n, m);
      const k = Number(Math.sqrt(safe.n * safe.n + safe.m * safe.m).toFixed(3));
      const family = familyFromScientificPair(safe.n, safe.m);
      const patternName = patternNameFromScientificPair(safe.n, safe.m, family);

      modes.push({
        id: `k-${String(safe.n).padStart(2, "0")}-${String(safe.m).padStart(2, "0")}`,
        k,
        n: safe.n,
        m: safe.m,
        family,
        patternName,
      });
    }
  }

  return modes
    .sort((a, b) => a.k - b.k || a.n - b.n || a.m - b.m)
    .slice(0, count);
}

export const scientificChladniModes = generateScientificModeCatalog(140);

export function scientificModeFromFrequency(frequency, seed = 0) {
  const f = clamp(Math.round(frequency), SCI_MIN_FREQUENCY, SCI_MAX_FREQUENCY);
  const t = (f - SCI_MIN_FREQUENCY) / (SCI_MAX_FREQUENCY - SCI_MIN_FREQUENCY);

  const rawIndex = t * (scientificChladniModes.length - 1);
  const index = clamp(
    Math.round(rawIndex),
    0,
    scientificChladniModes.length - 1
  );

  const base = scientificChladniModes[index];
  const safePair = normalizeChladniModePair(base.n, base.m);

  // detune kecil supaya frequency yang berdekatan tidak copy-paste total
  const detuneA = ((f % 37) / 37) * 0.18;
  const detuneB = ((seed % 17) / 17) * 0.04;

  return {
    id: `scientific-${f}-${base.id}`,
    frequency: f,
    waveNumberK: Number((base.k + detuneA + detuneB).toFixed(3)),
    n: safePair.n,
    m: safePair.m,
    family: base.family,
    patternName: base.patternName,
    radialMix: 0,
    threshold: 0.022,
    lineThickness: 1.0,
  };
}

export function createRandomScientificMode(seed, index = 0) {
  const rng = mulberry32((seed + index * 2654435761) >>> 0);

  const frequency = Math.round(
    SCI_MIN_FREQUENCY + rng() * (SCI_MAX_FREQUENCY - SCI_MIN_FREQUENCY)
  );

  return scientificModeFromFrequency(frequency, seed);
}

/* -------------------------------------------------------------------------- */
/*                               FIELD + RENDER                               */
/* -------------------------------------------------------------------------- */

export function pureChladniField(x, y, n, m) {
  const px = x * Math.PI;
  const py = y * Math.PI;

  return (
    Math.cos(n * px) * Math.cos(m * py) -
    Math.cos(m * px) * Math.cos(n * py)
  );
}

export function scientificLineIntensity(value, epsilon) {
  const distance = Math.abs(value);

  if (distance > epsilon) return 0;

  const closeness = 1 - distance / epsilon;
  return closeness * closeness * (3 - 2 * closeness);
}

export function renderScientificChladniSvg({
  mode,
  seed = 1,
  width = 1024,
  height = 1024,
  showLabel = true,
  label = "",
  resolution = 460,
  lineWidth = 1.15,
  glow = true,
  palette = null,
} = {}) {
  if (!mode) {
    throw new Error("renderScientificChladniSvg requires mode");
    
  }
  const activePalette = palette || pickScientificPaletteByRarity(0);
  const activePalette = palette || pickScientificColorway(seed, mode);

  const margin = Math.round(width * 0.075);
  const plate = width - margin * 2;
  const cell = plate / resolution;

  const epsilon = clamp(0.022 - mode.waveNumberK * 0.00012, 0.010, 0.022);

  const dots = [];

  for (let iy = 0; iy < resolution; iy += 1) {
    for (let ix = 0; ix < resolution; ix += 1) {
      const nx = ix / (resolution - 1);
      const ny = iy / (resolution - 1);

      const x = nx * 2 - 1;
      const y = ny * 2 - 1;

      const field = pureChladniField(x, y, mode.n, mode.m);
      const intensity = scientificLineIntensity(field, epsilon);

      if (intensity <= 0) continue;

      const px = margin + ix * cell;
      const py = margin + iy * cell;

      const r = lineWidth + intensity * 1.55;
      const opacity = clamp(0.10 + intensity * 0.95, 0.05, 1.0);

      const fillColor =
        intensity > 0.66
          ? activePalette.lineSecondary
          : activePalette.linePrimary;

      dots.push(
        `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(
          2
        )}" fill="${fillColor}" opacity="${opacity.toFixed(3)}"/>`
      );
    }
  }

  const title = label || `CHLADNI NODE · ${mode.frequency} Hz`;
  const dotMarkup = dots.join("\n");

  const labelMarkup = showLabel
    ? `
  <g opacity="0.98">
    <rect
      x="${margin}"
      y="${height - margin * 0.96}"
      width="${plate}"
      height="70"
      rx="14"
      fill="${activePalette.plateFill}"
      opacity="0.90"
      stroke="${activePalette.stroke}"
      stroke-opacity="0.40"
    />
    <text
      x="${width / 2}"
      y="${height - margin * 0.62}"
      fill="${activePalette.textPrimary}"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="18"
      font-weight="900"
      letter-spacing="2"
      text-anchor="middle"
    >${svgEscape(title)}</text>
    <text
      x="${width / 2}"
      y="${height - margin * 0.36}"
      fill="${activePalette.textSecondary}"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="12"
      font-weight="700"
      letter-spacing="1.2"
      text-anchor="middle"
    >K=${mode.waveNumberK} · Mode ${mode.n}×${mode.m} · ${svgEscape(
        mode.family
      )} · ${svgEscape(activePalette.name)}</text>
  </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="72%">
      <stop offset="0%" stop-color="${activePalette.plateGlow}"/>
      <stop offset="52%" stop-color="${activePalette.plateFill}"/>
      <stop offset="100%" stop-color="${activePalette.background}"/>
    </radialGradient>

    <filter id="lineGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="${glow ? 3.1 : 0}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="${activePalette.background}"/>
  <rect
    x="${margin}"
    y="${margin}"
    width="${plate}"
    height="${plate}"
    fill="url(#bg)"
    stroke="${activePalette.stroke}"
    stroke-opacity="0.56"
    stroke-width="2"
  />

  <g filter="url(#lineGlow)">
    ${dotMarkup}
  </g>

  ${labelMarkup}
</svg>`;
}

/* -------------------------------------------------------------------------- */
/*                                   TRAITS                                   */
/* -------------------------------------------------------------------------- */

export function computeScientificNodeDensityBps(mode) {
  const complexity = mode.n * mode.m;
  return Math.round(
    clamp(300 + complexity * 22 + mode.waveNumberK * 18, 300, 2800)
  );
}

export function computeScientificLineThicknessBps(mode) {
  return Math.round(clamp(130 - mode.waveNumberK * 1.1, 70, 140));
}

export function scientificRarityTier(seed, mode) {
  const roll = hashStringToSeed(`${seed}:${mode.id}:rarity`) % 10_000;

  // Distribution:
  // Mythic 8%, Legendary 10%, Epic 20%, Rare 25%, Uncommon 25%, Common 12%
  if (roll < 800) return 5;   // Mythic
  if (roll < 1800) return 4;  // Legendary
  if (roll < 3800) return 3;  // Epic
  if (roll < 6300) return 2;  // Rare
  if (roll < 8800) return 1;  // Uncommon
  return 0;                   // Common
}