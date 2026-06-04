#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export const SCI_MIN_FREQUENCY = 20;
export const SCI_MAX_FREQUENCY = 999;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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


export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/**
 * Scientific mode catalog.
 * Ini bukan random visual preset.
 * Ini daftar eigenmode plate/cymatics yang dipakai sebagai basis pola.
 *
 * k di sini adalah pseudo wave number untuk ordering visual.
 * Frequency nanti dipakai untuk memilih mode terdekat dari katalog ini.
 */
// export const scientificChladniModes = [
//   { id: "k01", k: 10.78, n: 2, m: 3, family: "Fundamental Cross" },
//   { id: "k02", k: 13.63, n: 2, m: 4, family: "Central Ring" },
//   { id: "k03", k: 16.15, n: 3, m: 4, family: "Ring Square" },
//   { id: "k04", k: 18.42, n: 3, m: 5, family: "Diamond Cell" },
//   { id: "k05", k: 19.23, n: 4, m: 5, family: "Double Node" },

//   { id: "k06", k: 21.10, n: 4, m: 6, family: "Petal Cross" },
//   { id: "k07", k: 23.83, n: 5, m: 6, family: "Mirror Grid" },
//   { id: "k08", k: 25.53, n: 5, m: 7, family: "Loop Lattice" },
//   { id: "k09", k: 26.29, n: 6, m: 7, family: "Orbital Cells" },
//   { id: "k10", k: 27.30, n: 6, m: 8, family: "Circle Mesh" },

//   { id: "k11", k: 29.68, n: 7, m: 8, family: "Square Bloom" },
//   { id: "k12", k: 31.73, n: 7, m: 9, family: "Dense Cross" },
//   { id: "k13", k: 32.98, n: 8, m: 9, family: "Nested Grid" },
//   { id: "k14", k: 34.76, n: 8, m: 10, family: "Symmetry Well" },
//   { id: "k15", k: 36.07, n: 9, m: 10, family: "Node Square" },

//   { id: "k16", k: 37.17, n: 9, m: 11, family: "Dense Ring" },
//   { id: "k17", k: 37.96, n: 10, m: 11, family: "Star Mesh" },
//   { id: "k18", k: 38.99, n: 10, m: 12, family: "Cross Net" },
//   { id: "k19", k: 39.99, n: 11, m: 12, family: "Orbital Net" },
//   { id: "k20", k: 41.20, n: 11, m: 13, family: "Dense Lattice" },

//   { id: "k21", k: 43.08, n: 12, m: 13, family: "High Mesh" },
//   { id: "k22", k: 44.20, n: 12, m: 14, family: "Mirror Resonance" },
//   { id: "k23", k: 44.88, n: 13, m: 14, family: "Fine Web" },
//   { id: "k24", k: 45.52, n: 11, m: 14, family: "Signal Lattice" },
//   { id: "k25", k: 46.82, n: 10, m: 14, family: "Nested Resonance" },
// ];

export const scientificChladniModes = generateScientificModeCatalog(140);
export function generateScientificModeCatalog(count = 140) {
  const modes = [];

  for (let n = 1; n <= 18; n += 1) {
    for (let m = n + 1; m <= 22; m += 1) {
      if (n === m) continue;

      const diff = Math.abs(n - m);
      const complexity = n * m;

      // Filter supaya tidak terlalu chaos
      if (diff > 7) continue;
      if (complexity < 6) continue;
      if (complexity > 260) continue;

      const k = Number(Math.sqrt(n * n + m * m).toFixed(3));

      modes.push({
        id: `k-${String(n).padStart(2, "0")}-${String(m).padStart(2, "0")}`,
        k,
        n,
        m,
        family: familyFromScientificPair(n, m),
      });
    }
  }

  return modes
    .sort((a, b) => a.k - b.k)
    .slice(0, count);
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
export function normalizeChladniModePair(n, m) {
  let safeN = Math.max(1, Math.round(n));
  let safeM = Math.max(2, Math.round(m));

  if (safeN === safeM) {
    safeM = safeM + 1;
  }

  if (safeM > 14) {
    safeM = 14;
  }

  if (safeN === safeM) {
    safeN = Math.max(1, safeN - 1);
  }

  return {
    n: safeN,
    m: safeM,
  };
}

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

  // Detune kecil dari frequency, bukan random brutal.
  // Ini bikin 918 dan 999 tidak terasa copy-paste.
  const detune = ((f % 37) / 37) * 0.18;

  return {
    id: `scientific-${f}-${base.id}`,
    frequency: f,
    waveNumberK: Number((base.k + detune).toFixed(2)),
    n: safePair.n,
    m: safePair.m,
    family: base.family,
    patternName: `K${index + 1} ${base.family}`,
    radialMix: 0,
    threshold: 0.024,
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

/**
 * Pure Chladni plate equation.
 * No radialWave.
 * No shimmer.
 * No animation phase.
 *
 * Domain:
 * x,y normalized from -1..1
 */
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

  // smooth white line, bukan random particle cloud
  return closeness * closeness * (3 - 2 * closeness);
}

function svgEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Render scientific-looking Chladni figure:
 * - black plate
 * - white glowing nodal lines
 * - deterministic
 * - snapshot tidak menter
 */
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
} = {}) {
  if (!mode) throw new Error("renderScientificChladniSvg requires mode");

  const margin = Math.round(width * 0.075);
  const plate = width - margin * 2;
  const cell = plate / resolution;

const epsilon = clamp(0.032 - mode.waveNumberK * 0.00022, 0.014, 0.03);
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

      const r = lineWidth + intensity * 1.75;
      const opacity = clamp(0.12 + intensity * 0.96, 0.05, 1);

      dots.push(
        `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(
          2
        )}" fill="#ffffff" opacity="${opacity.toFixed(3)}"/>`
      );
    }
  }

  const dotMarkup = dots.join("\n");
const maxDots = resolution * resolution * 0.22;

if (dots.length > maxDots) {
  console.warn(
    `Warning: too many nodal points for ${mode.frequency} Hz, mode ${mode.n}x${mode.m}. Check mode degeneracy or epsilon.`
  );
}
  const title = label || `CHLADNI NODE · ${mode.frequency} Hz`;

  const labelMarkup = showLabel
    ? `
  <g>
    <rect
      x="${margin}"
      y="${height - margin * 0.95}"
      width="${plate}"
      height="62"
      rx="14"
      fill="#050505"
      opacity="0.82"
      stroke="#ffffff"
      stroke-opacity="0.12"
    />
    <text
      x="${width / 2}"
      y="${height - margin * 0.62}"
      fill="#f8fafc"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="18"
      font-weight="900"
      letter-spacing="2"
      text-anchor="middle"
    >${svgEscape(title)}</text>
    <text
      x="${width / 2}"
      y="${height - margin * 0.37}"
      fill="#94a3b8"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="12"
      font-weight="700"
      letter-spacing="1.2"
      text-anchor="middle"
    >K=${mode.waveNumberK} · Mode ${mode.n}×${mode.m} · ${svgEscape(
        mode.family
      )}</text>
  </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="72%">
      <stop offset="0%" stop-color="#161616"/>
      <stop offset="55%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>

    <filter id="lineGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="${glow ? 3.2 : 0}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="#000000"/>
  <rect x="${margin}" y="${margin}" width="${plate}" height="${plate}" fill="url(#bg)" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>

  <g filter="url(#lineGlow)">
    ${dotMarkup}
  </g>

  ${labelMarkup}
</svg>`;
}


export function computeScientificNodeDensityBps(mode) {
  const complexity = mode.n * mode.m;
  return Math.round(clamp(300 + complexity * 22 + mode.waveNumberK * 18, 300, 2800));
}

export function computeScientificLineThicknessBps(mode) {
  return Math.round(clamp(130 - mode.waveNumberK * 1.1, 70, 140));
}

export function scientificRarityTier(seed, mode) {
  const roll = hashStringToSeed(`${seed}:${mode.id}:rarity`) % 10_000;

  if (roll < 500) return 5;
  if (roll < 1300) return 4;
  if (roll < 3000) return 3;
  if (roll < 5500) return 2;
  if (roll < 8000) return 1;
  return 0;
}