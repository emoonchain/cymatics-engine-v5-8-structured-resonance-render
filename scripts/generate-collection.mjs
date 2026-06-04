import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "output");
const IMAGE_DIR = path.join(OUTPUT_DIR, "images");
const METADATA_DIR = path.join(OUTPUT_DIR, "metadata");

const presets = [
  {
    id: "genesis-pulse",
    name: "Genesis Pulse",
    frequencyMin: 140,
    frequencyMax: 620,
    description: "Balanced node formation with warm living motion.",
    families: ["Cross Bloom", "Orbital Flower", "Soft Lattice", "Radial Pulse"],
  },
  {
    id: "solar-lattice",
    name: "Solar Lattice",
    frequencyMin: 520,
    frequencyMax: 1200,
    description: "High-frequency geometric grids with orange-red peaks.",
    families: ["Solar Grid", "Diamond Mesh", "High Harmonic Grid", "Radiant Net"],
  },
  {
    id: "fractured-harmonic",
    name: "Fractured Harmonic",
    frequencyMin: 260,
    frequencyMax: 980,
    description: "Chaotic harmonic interference with sharp resonance scars.",
    families: ["Fracture Web", "Glitch Harmonic", "Asymmetric Scar", "Interference Storm"],
  },
  {
    id: "sacred-mesh",
    name: "Sacred Mesh",
    frequencyMin: 620,
    frequencyMax: 1200,
    description: "Symmetric dense mesh for rare-looking generative pieces.",
    families: ["Sacred Mesh", "Mandala Grid", "Temple Net", "Mirror Bloom"],
  },
  {
    id: "bass-bloom",
    name: "Bass Bloom",
    frequencyMin: 80,
    frequencyMax: 260,
    description: "Low-frequency floral nodes with slower breathing motion.",
    families: ["Bass Bloom", "Low Ring", "Petal Wave", "Slow Flower"],
  },
  {
    id: "void-resonance",
    name: "Void Resonance",
    frequencyMin: 220,
    frequencyMax: 840,
    description: "Dark chrome field with subtle red resonance sparks.",
    families: ["Void Grid", "Noir Signal", "Chrome Scar", "Dark Lattice"],
  },
];

const materials = [
  { value: "Iron Plate", weight: 30 },
  { value: "Bronze Plate", weight: 22 },
  { value: "Silver Plate", weight: 18 },
  { value: "Titanium Plate", weight: 13 },
  { value: "Obsidian Plate", weight: 9 },
  { value: "Resonant Ceramic", weight: 6 },
  { value: "Aether Glass", weight: 2 },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    count: 100,
    start: 1,
    seed: "cymatica-genesis",
    imageBase: "ipfs://IMAGE_CID",
    namePrefix: "Cymatica",
    width: 1600,
    height: 1600,
    resolution: 210,
  };

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    const next = args[i + 1];

    if (current === "--count" || current === "-c") out.count = Number(next);
    if (current === "--start") out.start = Number(next);
    if (current === "--seed" || current === "-s") out.seed = String(next);
    if (current === "--image-base") out.imageBase = String(next);
    if (current === "--name-prefix") out.namePrefix = String(next);
    if (current === "--width") out.width = Number(next);
    if (current === "--height") out.height = Number(next);
    if (current === "--resolution") out.resolution = Number(next);
  }

  if (!Number.isFinite(out.count) || out.count < 1) {
    throw new Error("Invalid --count. Use a positive number, for example --count 100.");
  }

  return out;
}

function hashStringToSeed(input) {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chooseWeighted(rng, items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }

  return items.at(-1).value;
}

function hashPresetSeed(seed, presetId) {
  let h = seed >>> 0;

  for (let i = 0; i < presetId.length; i += 1) {
    h ^= presetId.charCodeAt(i);
    h = Math.imul(h, 16777619);
    h >>>= 0;
  }

  return h >>> 0;
}

function pickBySeed(items, seed, salt = 0) {
  return items[Math.abs((seed + salt * 2654435761) >>> 0) % items.length];
}

function getSpecialColorMode(seed, presetId) {
  const roll = (hashPresetSeed(seed, presetId) % 10000) / 10000;

  if (roll < 0.006) return "Prism Bloom";
  if (roll < 0.02) return "Aurora Field";
  if (roll < 0.05) return "Chromatic Resonance";

  return "Standard";
}

const gradientLibrary = [
  { name: "Solaris Bloom", stops: ["#fff8da", "#fde68a", "#facc15", "#fb923c", "#f97316", "#fb7185", "#fff7ed"] },
  { name: "Aurora Forge", stops: ["#ecfccb", "#86efac", "#34d399", "#22d3ee", "#60a5fa", "#a78bfa", "#f8fafc"] },
  { name: "Prism Tide", stops: ["#fdf2f8", "#f472b6", "#c084fc", "#6366f1", "#22d3ee", "#34d399", "#fefce8"] },
  { name: "Ember Orchid", stops: ["#fff1f2", "#fb7185", "#f97316", "#facc15", "#f472b6", "#c026d3", "#ffffff"] },
  { name: "Neon Glacier", stops: ["#ecfeff", "#67e8f9", "#38bdf8", "#818cf8", "#a78bfa", "#e9d5ff", "#f8fafc"] },
  { name: "Emerald Voltage", stops: ["#f7fee7", "#a3e635", "#4ade80", "#14b8a6", "#22d3ee", "#f0fdfa", "#ffffff"] },
  { name: "Crimson Halo", stops: ["#fef2f2", "#fca5a5", "#ef4444", "#be123c", "#f59e0b", "#fde68a", "#fff7ed"] },
  { name: "Ocean Signal", stops: ["#dbeafe", "#60a5fa", "#2563eb", "#0891b2", "#14b8a6", "#c4b5fd", "#ffffff"] },
  { name: "Violet Flux", stops: ["#faf5ff", "#e879f9", "#a855f7", "#7c3aed", "#38bdf8", "#22d3ee", "#f8fafc"] },
  { name: "Gold Lotus", stops: ["#fff7d6", "#fde68a", "#fbbf24", "#f59e0b", "#f472b6", "#f8fafc", "#ffffff"] },
];

const presetColorIndices = {
  "genesis-pulse": [0, 9, 3, 6, 1, 2, 5, 7, 8, 4],
  "solar-lattice": [0, 6, 9, 3, 2, 8, 1, 4, 5, 7],
  "fractured-harmonic": [8, 2, 3, 4, 6, 7, 1, 0, 9, 5],
  "sacred-mesh": [1, 5, 4, 7, 8, 2, 0, 9, 3, 6],
  "bass-bloom": [7, 4, 1, 5, 8, 2, 0, 9, 6, 3],
  "void-resonance": [6, 8, 7, 3, 4, 2, 9, 1, 0, 5],
};

function getPresetColorwayOptions(presetId) {
  const order = presetColorIndices[presetId] ?? presetColorIndices["genesis-pulse"];
  return order.map((index) => gradientLibrary[index]);
}

function getColorway(seed, presetId) {
  const mode = getSpecialColorMode(seed, presetId);
  const h = hashPresetSeed(seed, `${presetId}:variant`);

  if (mode === "Prism Bloom") {
    return {
      mode,
      name: "Prism Bloom",
      variant: "Mythic Spectrum",
      stops: ["#ff335f", "#ff7a18", "#ffd43b", "#9ef01a", "#37e67d", "#2dd4ff", "#6366f1", "#8b5cf6", "#d946ef", "#ffffff"],
    };
  }

  if (mode === "Aurora Field") {
    const variants = [
      { variant: "Green Aurora", stops: ["#d9f99d", "#86efac", "#34d399", "#22d3ee", "#60a5fa", "#a78bfa", "#ffffff"] },
      { variant: "Polar Veil", stops: ["#ecfeff", "#67e8f9", "#22d3ee", "#38bdf8", "#818cf8", "#c4b5fd", "#f8fafc"] },
      { variant: "Violet Aurora", stops: ["#f5f3ff", "#c4b5fd", "#a78bfa", "#22d3ee", "#4ade80", "#fefce8", "#ffffff"] },
      { variant: "Dawn Aurora", stops: ["#ffe4e6", "#fda4af", "#fb7185", "#f59e0b", "#fde68a", "#f8fafc", "#ffffff"] },
    ];
    const chosen = pickBySeed(variants, h);
    return { mode, name: "Aurora Field", variant: chosen.variant, stops: chosen.stops };
  }

  if (mode === "Chromatic Resonance") {
    const variants = [
      { variant: "Chromatic Soft", stops: ["#ffedd5", "#fb7185", "#c084fc", "#6366f1", "#22d3ee", "#a3e635", "#ffffff"] },
      { variant: "Chromatic Neon", stops: ["#f0abfc", "#fb7185", "#facc15", "#22d3ee", "#84cc16", "#f8fafc", "#ffffff"] },
      { variant: "Chromatic Ice", stops: ["#e0f2fe", "#60a5fa", "#818cf8", "#c084fc", "#f472b6", "#f8fafc", "#ffffff"] },
      { variant: "Chromatic Ember", stops: ["#fff7ed", "#fdba74", "#f97316", "#ef4444", "#d946ef", "#38bdf8", "#ffffff"] },
    ];
    const chosen = pickBySeed(variants, h);
    return { mode, name: "Chromatic Resonance", variant: chosen.variant, stops: chosen.stops };
  }

  const options = getPresetColorwayOptions(presetId);
  const chosen = pickBySeed(options, h);

  return { mode, name: chosen.name, variant: chosen.name, stops: chosen.stops };
}

function upgradeRarityByColorMode(rarity, mode) {
  const order = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];
  let index = order.indexOf(rarity);

  if (index < 0) index = 0;
  if (mode === "Chromatic Resonance") index = Math.max(index, 2);
  if (mode === "Aurora Field") index = Math.max(index, 3);
  if (mode === "Prism Bloom") index = Math.max(index, 4);

  return order[index];
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleColor(stops, t) {
  const clamped = clamp(t, 0, 1);
  const segments = stops.length - 1;
  const scaled = clamped * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - index;
  const a = hexToRgb(stops[index]);
  const b = hexToRgb(stops[index + 1]);

  const r = Math.round(lerp(a.r, b.r, localT));
  const g = Math.round(lerp(a.g, b.g, localT));
  const blue = Math.round(lerp(a.b, b.b, localT));

  return `rgb(${r},${g},${blue})`;
}

function clampDetailFrequency(frequency) {
  if (!Number.isFinite(frequency)) return 528;
  return Math.max(80, Math.min(1200, frequency));
}

function frequencyToReadableModes(freq, rng, presetId) {
  const f = clampDetailFrequency(freq);
  const table = [
    { min: 80, max: 150, n: 2, m: 3, label: "Low Ring" },
    { min: 151, max: 240, n: 3, m: 4, label: "Cross Bloom" },
    { min: 241, max: 340, n: 4, m: 5, label: "Soft Flower" },
    { min: 341, max: 460, n: 4, m: 6, label: "Loop Cells" },
    { min: 461, max: 620, n: 5, m: 6, label: "Petal Grid" },
    { min: 621, max: 780, n: 5, m: 7, label: "Orbital Mesh" },
    { min: 781, max: 960, n: 6, m: 8, label: "Diamond Mesh" },
    { min: 961, max: 1200, n: 7, m: 9, label: "Dense Lattice" },
  ];
  const selected = table.find((mode) => f >= mode.min && f <= mode.max) ?? table.at(-1);
  let n = selected.n;
  let m = selected.m;
  if (presetId === "sacred-mesh" && rng() < 0.35) m = n + 1;
  if (presetId === "fractured-harmonic" && rng() < 0.5) m += 2;
  if (rng() < 0.22) n += rng() < 0.5 ? -1 : 1;
  if (rng() < 0.22) m += rng() < 0.5 ? -1 : 1;
  return { n: clamp(n, 2, 8), m: clamp(m, 3, 10), label: selected.label };
}

function frequencyToModes(freq, rng = Math.random, presetId = "genesis-pulse") {
  return frequencyToReadableModes(freq, rng, presetId);
}

function chladniField(x, y, n, m) {
  return Math.cos(n * x) * Math.cos(m * y) - Math.cos(m * x) * Math.cos(n * y);
}

function standingWave(x, y, n, m) {
  return Math.sin((n * Math.PI * (x + 1)) / 2) * Math.sin((m * Math.PI * (y + 1)) / 2);
}

function rotatePoint(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
  };
}

function resonanceField(x, y, n, m, params) {
  const rotated = rotatePoint(x, y, params.rotation);
  const rx = rotated.x * params.stretchX;
  const ry = rotated.y * params.stretchY;

  const primary = chladniField(rx, ry, n, m);
  const secondary = chladniField(rx * params.secondaryScale, ry * params.secondaryScale, params.n2, params.m2);
  const standing = standingWave(x, y, n, m);
  const radial = Math.sin(Math.hypot(x, y) * params.radialMode + params.phase) * params.radialWeight;
  const diagonal = Math.cos((x + y) * params.diagonalMode + params.phase) * params.diagonalWeight;
  const harmonic =
    0.5 *
    Math.sin((n + m) * rx + params.phase) *
    Math.cos(Math.abs(n - m + 1) * ry - params.phase);

  if (params.familyGroup === "radial") {
    return primary * 0.48 + secondary * 0.18 + standing * 0.14 + radial * 0.32 + harmonic * 0.08;
  }

  if (params.familyGroup === "fractured") {
    return primary * 0.42 + secondary * 0.34 + standing * 0.08 + diagonal * 0.22 + harmonic * 0.18;
  }

  if (params.familyGroup === "mesh") {
    return primary * 0.66 + secondary * 0.20 + standing * 0.08 + diagonal * 0.12 + harmonic * 0.04;
  }

  if (params.familyGroup === "rings") {
    return primary * 0.40 + secondary * 0.12 + standing * 0.18 + radial * 0.42 + harmonic * 0.06;
  }

  return primary * 0.58 + secondary * 0.18 + standing * 0.14 + harmonic * 0.12;
}

function makePatternParams(rng, n, m, preset, patternFamily) {
  const group =
    patternFamily.includes("Fracture") ||
    patternFamily.includes("Glitch") ||
    patternFamily.includes("Storm") ||
    patternFamily.includes("Scar")
      ? "fractured"
      : patternFamily.includes("Ring") ||
          patternFamily.includes("Bloom") ||
          patternFamily.includes("Flower") ||
          patternFamily.includes("Pulse")
        ? "rings"
        : patternFamily.includes("Mesh") ||
            patternFamily.includes("Grid") ||
            patternFamily.includes("Net") ||
            patternFamily.includes("Lattice")
          ? "mesh"
          : "balanced";

  return {
    familyGroup: group,
    rotation: rng() * Math.PI,
    stretchX: 0.82 + rng() * 0.36,
    stretchY: 0.82 + rng() * 0.36,
    secondaryScale: 0.72 + rng() * 0.72,
    n2: clamp(n + Math.floor((rng() - 0.5) * 18), 1, 70),
    m2: clamp(m + Math.floor((rng() - 0.5) * 18), 1, 70),
    phase: rng() * Math.PI * 2,
    radialMode: 5 + Math.floor(rng() * 42),
    radialWeight: 0.12 + rng() * 0.42,
    diagonalMode: 3 + Math.floor(rng() * 34),
    diagonalWeight: 0.04 + rng() * 0.30,
  };
}

function scoreComplexity(n, m, nodeDensity, patternParams) {
  const secondary = (patternParams.n2 + patternParams.m2) * 0.45;
  const warp = (patternParams.radialWeight + patternParams.diagonalWeight) * 20;

  return clamp(Math.round((n + m) * 1.8 + secondary + nodeDensity * 55 + warp), 1, 100);
}

function scoreSymmetry(n, m, patternParams) {
  const diff = Math.abs(n - m);
  const shared = gcd(Math.round(n), Math.round(m));
  const warpPenalty =
    Math.abs(1 - patternParams.stretchX) * 16 +
    Math.abs(1 - patternParams.stretchY) * 16 +
    patternParams.diagonalWeight * 18;

  return clamp(Math.round(100 - diff * 1.8 + shared * 4 - warpPenalty), 1, 100);
}

function gcd(a, b) {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }

  return Math.abs(a);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRarity(complexity, symmetry, nodeDensity, freq) {
  const score = complexity * 0.46 + symmetry * 0.28 + nodeDensity * 28 + (freq / 20000) * 18;

  if (score >= 108) return "Mythic";
  if (score >= 94) return "Legendary";
  if (score >= 82) return "Epic";
  if (score >= 68) return "Rare";
  if (score >= 52) return "Uncommon";

  return "Common";
}

function getResonanceType(freq, complexity, symmetry, patternFamily) {
  if (patternFamily) return patternFamily;
  if (freq < 250) return "Bass Bloom";
  if (symmetry > 88 && complexity > 74) return "Sacred Mesh";
  if (complexity > 84) return "Dense Lattice";
  if (freq > 10000) return "High Harmonic Grid";
  if (symmetry > 78) return "Orbital Flower";

  return "Genesis Pulse";
}

function getEnergyClass(freq, nodeDensity) {
  const score = freq / 20000 + nodeDensity;

  if (score > 1.38) return "Peak Resonance";
  if (score > 1.02) return "High Energy";
  if (score > 0.72) return "Medium Energy";

  return "Low Energy";
}


function getWaveDistortion(patternParams, patternFamily) {
  const skew = Math.abs(1 - patternParams.stretchX) + Math.abs(1 - patternParams.stretchY);
  const diagonal = patternParams.diagonalWeight;
  const radial = patternParams.radialWeight;

  if (patternFamily.includes("Fracture") || patternFamily.includes("Glitch") || patternFamily.includes("Scar")) {
    if (skew + diagonal > 0.55) return "Chaotic Twist";
    if (skew > 0.28) return "Fracture Shear";
    return "Angular Warp";
  }

  if (patternFamily.includes("Bloom") || patternFamily.includes("Flower") || patternFamily.includes("Ring") || patternFamily.includes("Pulse")) {
    if (radial > 0.34) return "Radial Drift";
    if (skew > 0.22) return "Bloom Stretch";
    return "Soft Drift";
  }

  if (patternFamily.includes("Mesh") || patternFamily.includes("Grid") || patternFamily.includes("Lattice") || patternFamily.includes("Net")) {
    if (skew < 0.12) return "Minimal Warp";
    if (diagonal > 0.18) return "Mirror Tension";
    return "Balanced Warp";
  }

  if (skew > 0.35) return "Interference Warp";
  return "Wave Tilt";
}

function getSymmetryType(symmetry, n, m, patternFamily) {
  const diff = Math.abs(n - m);

  if ((patternFamily.includes("Mandala") || patternFamily.includes("Temple")) && symmetry > 82) return "Mandala Symmetry";
  if ((patternFamily.includes("Bloom") || patternFamily.includes("Flower") || patternFamily.includes("Ring")) && diff <= 5) return "Radial Symmetry";
  if (symmetry > 90 && diff <= 2) return "Mirror Symmetry";
  if (symmetry > 82 && diff <= 6) return "Near-Bilateral";
  if (symmetry > 70) return "Axial Symmetry";
  if (patternFamily.includes("Fracture") || patternFamily.includes("Glitch")) return "Broken Symmetry";
  return "Asymmetric";
}

function getNodeArchitecture(nodeDensity, complexity, patternFamily) {
  if (patternFamily.includes("Mesh") || patternFamily.includes("Grid") || patternFamily.includes("Lattice")) {
    return nodeDensity > 0.1 ? "Dense Lattice" : "Structured Grid";
  }

  if (patternFamily.includes("Bloom") || patternFamily.includes("Flower") || patternFamily.includes("Ring")) {
    return nodeDensity > 0.08 ? "Orbital Bloom" : "Petal Cluster";
  }

  if (patternFamily.includes("Fracture") || patternFamily.includes("Glitch") || patternFamily.includes("Scar")) {
    return complexity > 78 ? "Fracture Web" : "Scar Lattice";
  }

  if (patternFamily.includes("Void") || patternFamily.includes("Noir") || patternFamily.includes("Chrome")) {
    return nodeDensity > 0.09 ? "Void Grid" : "Ghost Net";
  }

  return nodeDensity > 0.09 ? "Crossmesh Field" : "Resonant Grid";
}

function getHarmonicLayerCount(patternParams, presetId, complexity) {
  let count = 3; // primary + standing + harmonic baseline

  if (patternParams.secondaryScale > 0.01) count += 1;
  if (patternParams.radialWeight > 0.18) count += 1;
  if (patternParams.diagonalWeight > 0.14) count += 1;
  if (presetId === "fractured-harmonic" && complexity > 72) count += 1;

  return Math.max(3, Math.min(6, count));
}

function createArtwork({
  tokenId,
  seedNumber,
  seedText,
  preset,
  frequency,
  n,
  m,
  colorMutation,
  colorway,
  patternParams,
  paletteStops,
  width,
  height,
  resolution,
}) {
  const rng = mulberry32(hashStringToSeed(`${seedText}:art:${tokenId}`));
  const margin = Math.round(width * 0.105);
  const plateSize = width - margin * 2;
  const cell = plateSize / (resolution - 1);

  const dustPoints = [];
  const bandPoints = [];
  const hotspotPoints = [];
  const haloPoints = [];

  let nodeHits = 0;
  const thresholdBase = 0.084 + rng() * 0.022;

  for (let iy = 0; iy < resolution; iy += 1) {
    for (let ix = 0; ix < resolution; ix += 1) {
      const x = (ix / (resolution - 1)) * 2 - 1;
      const y = (iy / (resolution - 1)) * 2 - 1;
      const field = resonanceField(x, y, n, m, patternParams);
      const abs = Math.abs(field);
      const threshold = thresholdBase + rng() * 0.012;

      if (abs < threshold) {
        nodeHits += 1;

        const bandStrength = 1 - clamp(abs / threshold, 0, 1);
        const r = Math.hypot(x, y);
        const theta = Math.atan2(y, x);
        const radial = 0.5 + 0.5 * Math.sin(r * (n + m) * 2.4 + patternParams.phase);
        const orbital = 0.5 + 0.5 * Math.cos(theta * Math.max(2, Math.min(n, m)) + patternParams.phase);
        const hotspotStrength = Math.pow(clamp(radial * 0.58 + orbital * 0.42, 0, 1), 2.35) * bandStrength;
        const dustStrength = 0.22 + bandStrength * 0.24;

        const baseX = margin + ix * cell;
        const baseY = margin + iy * cell;

        const bandCount = Math.max(1, Math.round(1 + bandStrength * 3.1));
        const dustCount = Math.round(rng() * 2 + dustStrength * 2.2);
        const hotspotCount = hotspotStrength > 0.42 ? Math.round(1 + hotspotStrength * 4) : 0;

        for (let d = 0; d < dustCount; d += 1) {
          const px = baseX + (rng() - 0.5) * cell * 3.0;
          const py = baseY + (rng() - 0.5) * cell * 3.0;
          const colorT = clamp(0.08 + bandStrength * 0.26 + rng() * 0.18, 0, 0.55);
          const color = sampleColor(paletteStops, colorT);
          const radius = 0.55 + rng() * 0.65;
          const opacity = 0.18 + dustStrength * 0.20 + rng() * 0.05;
          dustPoints.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${radius.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);
        }

        for (let b = 0; b < bandCount; b += 1) {
          const px = baseX + (rng() - 0.5) * cell * 2.0;
          const py = baseY + (rng() - 0.5) * cell * 2.0;
          const polarT = theta / (Math.PI * 2) + 0.5;
          let colorT = clamp(0.22 + bandStrength * 0.48 + polarT * 0.20, 0, 0.92);

          if (colorMutation === "Prism Bloom") {
            colorT = (polarT + hotspotStrength * 0.38) % 1;
          }

          const color = sampleColor(paletteStops, colorT);
          const radius = 1.05 + bandStrength * 1.95 + rng() * 0.75;
          const opacity = 0.40 + bandStrength * 0.34;
          bandPoints.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${radius.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);
        }

        for (let h = 0; h < hotspotCount; h += 1) {
          const px = baseX + (rng() - 0.5) * cell * 1.55;
          const py = baseY + (rng() - 0.5) * cell * 1.55;
          const colorT = clamp(0.72 + hotspotStrength * 0.28, 0.65, 1);
          const color = sampleColor(paletteStops, colorT);
          const radius = 1.55 + hotspotStrength * 3.25 + rng() * 0.95;
          const opacity = 0.56 + hotspotStrength * 0.34;
          hotspotPoints.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${radius.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);

          if (h === 0 && hotspotStrength > 0.54) {
            const haloRadius = radius * (1.9 + rng() * 0.3);
            haloPoints.push(`<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${haloRadius.toFixed(2)}" fill="${color}" opacity="${(0.06 + hotspotStrength * 0.08).toFixed(2)}"/>`);
          }
        }
      }
    }
  }

  const glow = paletteStops[Math.min(2, paletteStops.length - 1)];
  const bgGlow = paletteStops[Math.min(1, paletteStops.length - 1)];
  const nodeDensity = nodeHits / (resolution * resolution);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="48%" r="78%">
      <stop offset="0%" stop-color="#08080c"/>
      <stop offset="58%" stop-color="#020205"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <radialGradient id="plateTint" cx="50%" cy="50%" r="66%">
      <stop offset="0%" stop-color="${bgGlow}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="dustGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="0.7" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="bandGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.55" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="hotGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.25" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${margin}" y="${margin}" width="${plateSize}" height="${plateSize}" fill="#020205" stroke="${glow}" stroke-opacity="0.42" stroke-width="2"/>
  <rect x="${margin}" y="${margin}" width="${plateSize}" height="${plateSize}" fill="url(#plateTint)"/>
   <g filter="url(#hotGlow)">
    ${haloPoints.join("\\n    ")}
  </g>
  <g filter="url(#dustGlow)">
    ${dustPoints.join("\\n    ")}
  </g>
  <g filter="url(#bandGlow)">
    ${bandPoints.join("\\n    ")}
  </g>
  <g filter="url(#hotGlow)">
    ${hotspotPoints.join("\\n    ")}
  </g>
  <text x="${margin}" y="${height - margin * 0.42}" fill="#94a3b8" font-family="monospace" font-size="24" opacity="0.55">${preset.name} · ${colorway.name} · ${Math.round(frequency)}Hz · ${n}x${m}</text>
</svg>`;

  return { svg, nodeDensity };
}

function createToken({ tokenId, options }) {
  const tokenSeedText = `${options.seed}:${tokenId}`;
  const seedNumber = hashStringToSeed(tokenSeedText);
  const rng = mulberry32(seedNumber);
  const preset = presets[Math.floor(rng() * presets.length)];
  const frequencyRoll = Math.pow(rng(), 0.72);
  const frequency = Math.round(preset.frequencyMin + frequencyRoll * (preset.frequencyMax - preset.frequencyMin));
  const modeInfo = frequencyToModes(frequency, rng, preset.id);
  const { n, m } = modeInfo;
  const material = chooseWeighted(rng, materials);
  const colorway = getColorway(seedNumber, preset.id);
  const patternFamily = pickBySeed(preset.families, seedNumber, 3);
  const patternParams = makePatternParams(rng, n, m, preset, patternFamily);

  const { svg, nodeDensity } = createArtwork({
    tokenId,
    seedNumber,
    seedText: tokenSeedText,
    preset,
    frequency,
    n,
    m,
    colorMutation: colorway.mode,
    colorway,
    patternParams,
    paletteStops: colorway.stops,
    width: options.width,
    height: options.height,
    resolution: options.resolution,
  });

  const complexity = scoreComplexity(n, m, nodeDensity, patternParams);
  const symmetry = scoreSymmetry(n, m, patternParams);
  const baseRarity = getRarity(complexity, symmetry, nodeDensity, frequency);
  const rarity = upgradeRarityByColorMode(baseRarity, colorway.mode);
  const resonanceType = getResonanceType(frequency, complexity, symmetry, patternFamily);
  const energyClass = getEnergyClass(frequency, nodeDensity);
  const waveDistortion = getWaveDistortion(patternParams, patternFamily);
  const symmetryType = getSymmetryType(symmetry, n, m, patternFamily);
  const nodeArchitecture = getNodeArchitecture(nodeDensity, complexity, patternFamily);
  const harmonicLayerCount = getHarmonicLayerCount(patternParams, preset.id, complexity);

  const metadata = {
    name: `${options.namePrefix} #${tokenId}`,
    description:
      "A deterministic generative cymatics artwork simulated from a digital Chladni resonance plate.",
    image: `${options.imageBase}/${tokenId}.svg`,
    external_url: "https://example.com",
    seed: seedNumber,
    frequency,
    modeN: n,
    modeM: m,
    secondaryModeN: patternParams.n2,
    secondaryModeM: patternParams.m2,
    presetId: preset.id,
    presetName: preset.name,
    palette: colorway.name,
    colorway: colorway.name,
    colorVariant: colorway.variant,
    colorMutation: colorway.mode,
    patternFamily,
    waveDistortion,
    symmetryType,
    nodeArchitecture,
    harmonicLayerCount,
    plateMaterial: material,
    resonanceType,
    energyClass,
    rarityTier: rarity,
    complexityScore: complexity,
    symmetryScore: symmetry,
    nodeDensity: Number(nodeDensity.toFixed(4)),
    waveFamily: "Chladni Harmonic",
    attributes: [
      { trait_type: "Frequency", value: `${frequency} Hz` },
      { trait_type: "Mode N", value: n },
      { trait_type: "Mode M", value: m },
      { trait_type: "Mode", value: `${n} x ${m}` },
      { trait_type: "Secondary Mode", value: `${patternParams.n2} x ${patternParams.m2}` },
      { trait_type: "Preset", value: preset.id },
      { trait_type: "Resonance Preset", value: preset.name },
      { trait_type: "Pattern Family", value: patternFamily },
      { trait_type: "Visual Mode", value: modeInfo.label },
      { trait_type: "Colorway", value: colorway.name },
      { trait_type: "Color Variant", value: colorway.variant },
      { trait_type: "Color Mutation", value: colorway.mode },
      { trait_type: "Wave Distortion", value: waveDistortion },
      { trait_type: "Symmetry Type", value: symmetryType },
      { trait_type: "Node Architecture", value: nodeArchitecture },
      { trait_type: "Harmonic Layer Count", value: harmonicLayerCount },
      { trait_type: "Resonance Type", value: resonanceType },
      { trait_type: "Wave Family", value: "Chladni Harmonic" },
      { trait_type: "Plate Material", value: material },
      { trait_type: "Energy Class", value: energyClass },
      { trait_type: "Rarity Tier", value: rarity },
      { trait_type: "Complexity Score", value: complexity, display_type: "number" },
      { trait_type: "Symmetry Score", value: symmetry, display_type: "number" },
      { trait_type: "Node Density", value: Number(nodeDensity.toFixed(4)), display_type: "number" },
    ],
    properties: {
      seed: tokenSeedText,
      seed_number: seedNumber,
      generator: "Cymatics Engine Batch Generator v5.8",
      preset_id: preset.id,
      color_mutation: colorway.mode,
      color_variant: colorway.variant,
      pattern_family: patternFamily,
      wave_distortion: waveDistortion,
      symmetry_type: symmetryType,
      node_architecture: nodeArchitecture,
      harmonic_layer_count: harmonicLayerCount,
      renderer: "structured-resonance-svg-v5.8",
    },
  };

  return {
    svg,
    metadata,
    rarity,
    presetId: preset.id,
    presetName: preset.name,
    colorway: colorway.name,
    colorVariant: colorway.variant,
    colorMutation: colorway.mode,
    patternFamily,
  };
}

function ensureCleanOutput() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

function main() {
  const options = parseArgs();
  ensureCleanOutput();

  const summary = {
    generated_at: new Date().toISOString(),
    count: options.count,
    start: options.start,
    seed: options.seed,
    image_base: options.imageBase,
    rarity: {},
    presets: {},
    presetIds: {},
    colorways: {},
    colorVariants: {},
    colorMutations: {},
    patternFamilies: {},
    waveDistortions: {},
    symmetryTypes: {},
    nodeArchitectures: {},
    harmonicLayerCounts: {},
  };

  console.log(`Generating ${options.count} Cymatics items...`);

  for (let index = 0; index < options.count; index += 1) {
    const tokenId = options.start + index;
    const token = createToken({ tokenId, options });

    fs.writeFileSync(path.join(IMAGE_DIR, `${tokenId}.svg`), token.svg);
    fs.writeFileSync(
      path.join(METADATA_DIR, `${tokenId}.json`),
      JSON.stringify(token.metadata, null, 2)
    );

    summary.rarity[token.rarity] = (summary.rarity[token.rarity] || 0) + 1;
    summary.presets[token.presetName] = (summary.presets[token.presetName] || 0) + 1;
    summary.presetIds[token.presetId] = (summary.presetIds[token.presetId] || 0) + 1;
    summary.colorways[token.colorway] = (summary.colorways[token.colorway] || 0) + 1;
    summary.colorVariants[token.colorVariant] = (summary.colorVariants[token.colorVariant] || 0) + 1;
    summary.colorMutations[token.colorMutation] =
      (summary.colorMutations[token.colorMutation] || 0) + 1;
    summary.patternFamilies[token.patternFamily] =
      (summary.patternFamilies[token.patternFamily] || 0) + 1;
    summary.waveDistortions[token.metadata.waveDistortion] =
      (summary.waveDistortions[token.metadata.waveDistortion] || 0) + 1;
    summary.symmetryTypes[token.metadata.symmetryType] =
      (summary.symmetryTypes[token.metadata.symmetryType] || 0) + 1;
    summary.nodeArchitectures[token.metadata.nodeArchitecture] =
      (summary.nodeArchitectures[token.metadata.nodeArchitecture] || 0) + 1;
    summary.harmonicLayerCounts[String(token.metadata.harmonicLayerCount)] =
      (summary.harmonicLayerCounts[String(token.metadata.harmonicLayerCount)] || 0) + 1;

    if ((index + 1) % 25 === 0 || index + 1 === options.count) {
      console.log(`  ${index + 1}/${options.count} generated`);
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "collection-summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log("Done.");
  console.log(`Images:   ${path.relative(ROOT, IMAGE_DIR)}`);
  console.log(`Metadata: ${path.relative(ROOT, METADATA_DIR)}`);
  console.log(
    `Summary:  ${path.relative(ROOT, path.join(OUTPUT_DIR, "collection-summary.json"))}`
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
