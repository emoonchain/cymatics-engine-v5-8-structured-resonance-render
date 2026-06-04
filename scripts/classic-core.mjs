import fs from "node:fs";
import path from "node:path";

export const classicFrequencyModes = [
  {
    id: "classic-20",
    frequency: 20,
    n: 1,
    m: 2,
    patternName: "Deep Bass Bloom",
    family: "Low Ring",
    radialMix: 0.28,
    threshold: 0.118,
    lineThickness: 1.42,
  },
  {
    id: "classic-47",
    frequency: 47,
    n: 2,
    m: 2,
    patternName: "Sub Ring Pulse",
    family: "Ring Cross",
    radialMix: 0.26,
    threshold: 0.116,
    lineThickness: 1.38,
  },
  {
    id: "classic-88",
    frequency: 88,
    n: 2,
    m: 3,
    patternName: "Low Cross Bloom",
    family: "Cross Bloom",
    radialMix: 0.24,
    threshold: 0.112,
    lineThickness: 1.34,
  },
  {
    id: "classic-132",
    frequency: 132,
    n: 3,
    m: 3,
    patternName: "Mirror Flower",
    family: "Radial Bloom",
    radialMix: 0.22,
    threshold: 0.11,
    lineThickness: 1.3,
  },
  {
    id: "classic-177",
    frequency: 177,
    n: 3,
    m: 4,
    patternName: "Twin Core Bloom",
    family: "Orbital Wells",
    radialMix: 0.2,
    threshold: 0.108,
    lineThickness: 1.26,
  },
  {
    id: "classic-231",
    frequency: 231,
    n: 4,
    m: 4,
    patternName: "Square Petal Core",
    family: "Petal Grid",
    radialMix: 0.19,
    threshold: 0.106,
    lineThickness: 1.24,
  },
  {
    id: "classic-286",
    frequency: 286,
    n: 4,
    m: 5,
    patternName: "Branch Petal Lines",
    family: "Branch Web",
    radialMix: 0.17,
    threshold: 0.104,
    lineThickness: 1.2,
  },
  {
    id: "classic-345",
    frequency: 345,
    n: 4,
    m: 6,
    patternName: "Central Ring Cross",
    family: "Ring Cross",
    radialMix: 0.22,
    threshold: 0.102,
    lineThickness: 1.18,
  },
  {
    id: "classic-421",
    frequency: 421,
    n: 5,
    m: 5,
    patternName: "Soft Mandala Grid",
    family: "Mirror Mesh",
    radialMix: 0.18,
    threshold: 0.1,
    lineThickness: 1.14,
  },
  {
    id: "classic-528",
    frequency: 528,
    n: 5,
    m: 6,
    patternName: "Golden Loop Cells",
    family: "Loop Lattice",
    radialMix: 0.16,
    threshold: 0.098,
    lineThickness: 1.12,
  },
  {
    id: "classic-639",
    frequency: 639,
    n: 5,
    m: 7,
    patternName: "Orbital Mesh Bloom",
    family: "Orbital Mesh",
    radialMix: 0.15,
    threshold: 0.096,
    lineThickness: 1.08,
  },
  {
    id: "classic-741",
    frequency: 741,
    n: 6,
    m: 6,
    patternName: "Sacred Mirror Net",
    family: "Mirror Mesh",
    radialMix: 0.14,
    threshold: 0.094,
    lineThickness: 1.06,
  },
  {
    id: "classic-852",
    frequency: 852,
    n: 6,
    m: 7,
    patternName: "Diamond Bridge Mesh",
    family: "Bridge Mesh",
    radialMix: 0.12,
    threshold: 0.092,
    lineThickness: 1.04,
  },
  {
    id: "classic-963",
    frequency: 963,
    n: 6,
    m: 8,
    patternName: "High Petal Lattice",
    family: "Petal Grid",
    radialMix: 0.11,
    threshold: 0.09,
    lineThickness: 1.02,
  },
  {
    id: "classic-1088",
    frequency: 1088,
    n: 7,
    m: 7,
    patternName: "Symmetric Crown",
    family: "Circle Lattice",
    radialMix: 0.13,
    threshold: 0.09,
    lineThickness: 1.0,
  },
  {
    id: "classic-1234",
    frequency: 1234,
    n: 7,
    m: 8,
    patternName: "Wave Labyrinth",
    family: "Wave Labyrinth",
    radialMix: 0.1,
    threshold: 0.088,
    lineThickness: 0.98,
  },
  {
    id: "classic-1444",
    frequency: 1444,
    n: 7,
    m: 9,
    patternName: "Orbital Ring Mesh",
    family: "Orbital Mesh",
    radialMix: 0.12,
    threshold: 0.087,
    lineThickness: 0.96,
  },
  {
    id: "classic-1666",
    frequency: 1666,
    n: 8,
    m: 8,
    patternName: "Circle Resonance Net",
    family: "Circle Lattice",
    radialMix: 0.11,
    threshold: 0.086,
    lineThickness: 0.95,
  },
  {
    id: "classic-1906",
    frequency: 1906,
    n: 8,
    m: 9,
    patternName: "Dense Diamond Field",
    family: "Diamond Grid",
    radialMix: 0.09,
    threshold: 0.084,
    lineThickness: 0.94,
  },
  {
    id: "classic-2222",
    frequency: 2222,
    n: 8,
    m: 10,
    patternName: "Readable Dense Net",
    family: "Dense Net",
    radialMix: 0.08,
    threshold: 0.082,
    lineThickness: 0.92,
  },
];

export function hashStringToSeed(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


export const classicBackgroundGradients = [
  { name: "Solar Ember", stops: ["#140b05", "#3b1206", "#8b2c0e", "#f59e0b"] },
  { name: "Aurora Jade", stops: ["#02110d", "#083d36", "#0f766e", "#5eead4"] },
  { name: "Violet Nocturne", stops: ["#0a0614", "#2e1065", "#6d28d9", "#c4b5fd"] },
  { name: "Crimson Haze", stops: ["#120407", "#3f0d17", "#9f1239", "#fda4af"] },
  { name: "Ocean Signal", stops: ["#020617", "#0c4a6e", "#0369a1", "#7dd3fc"] },
  { name: "Gold Lotus", stops: ["#140f02", "#4d3a05", "#ca8a04", "#fde68a"] },
  { name: "Emerald Bloom", stops: ["#03110a", "#14532d", "#22c55e", "#bbf7d0"] },
  { name: "Plasma Orchid", stops: ["#11030d", "#581c87", "#c026d3", "#f5d0fe"] },
  { name: "Frozen Pulse", stops: ["#020617", "#1e3a8a", "#3b82f6", "#dbeafe"] },
  { name: "Rose Flame", stops: ["#150307", "#7f1d1d", "#ef4444", "#fecaca"] },
  { name: "Amber Night", stops: ["#100802", "#78350f", "#f59e0b", "#ffedd5"] },
  { name: "Cyan Voltage", stops: ["#041014", "#155e75", "#06b6d4", "#cffafe"] },
  { name: "Lilac Echo", stops: ["#09070f", "#4c1d95", "#8b5cf6", "#ede9fe"] },
  { name: "Mint Prism", stops: ["#03100c", "#166534", "#10b981", "#d1fae5"] },
  { name: "Ruby Halo", stops: ["#140305", "#881337", "#e11d48", "#fbcfe8"] },
  { name: "Sunset Relay", stops: ["#160602", "#9a3412", "#f97316", "#fed7aa"] },
  { name: "Indigo Mesh", stops: ["#060714", "#312e81", "#6366f1", "#c7d2fe"] },
  { name: "Opal Current", stops: ["#081112", "#0f766e", "#22d3ee", "#ecfeff"] },
  { name: "Neon Meadow", stops: ["#071006", "#365314", "#84cc16", "#ecfccb"] },
  { name: "Coral Bloom", stops: ["#120606", "#9f1239", "#fb7185", "#ffe4e6"] },
];

export function pickClassicGradient(seed) {
  const index = Math.abs(seed) % classicBackgroundGradients.length;
  return classicBackgroundGradients[index];
}

export function pickClassicMode(seed, index = 0) {
  return classicFrequencyModes[Math.abs((seed + index * 2654435761) >>> 0) % classicFrequencyModes.length];
}

export function classicField(x, y, mode, variant = 0) {
  const px = (x + 1) * Math.PI * 0.5;
  const py = (y + 1) * Math.PI * 0.5;
  const phase = variant * 0.08;

  const primary =
    Math.cos(mode.n * px + phase) * Math.cos(mode.m * py) -
    Math.cos(mode.m * px) * Math.cos(mode.n * py - phase);

  const r = Math.hypot(x, y);
  const theta = Math.atan2(y, x);

  const radial =
    Math.sin((mode.n + mode.m) * r * 2.2 + phase) *
    Math.cos(theta * Math.max(2, Math.min(mode.n, mode.m)));

  return primary * (1 - mode.radialMix) + radial * mode.radialMix;
}

export function frequencyToClassicMode(frequency) {
  const f = clamp(Math.round(frequency), 20, 2222);
  const t = (f - 20) / (2222 - 20);

  // jaga supaya pola tetap readable
  const n = clamp(Math.round(1 + t * 7), 1, 8);
  const m = clamp(Math.round(2 + t * 8), 2, 10);

  const families = [
    "Low Ring",
    "Ring Cross",
    "Cross Bloom",
    "Radial Bloom",
    "Orbital Wells",
    "Petal Grid",
    "Branch Web",
    "Loop Lattice",
    "Mirror Mesh",
    "Orbital Mesh",
    "Bridge Mesh",
    "Circle Lattice",
    "Wave Labyrinth",
    "Diamond Grid",
    "Dense Net",
  ];

  const names = [
    "Deep Bass Bloom",
    "Sub Ring Pulse",
    "Low Cross Bloom",
    "Mirror Flower",
    "Twin Core Bloom",
    "Square Petal Core",
    "Branch Petal Lines",
    "Central Ring Cross",
    "Soft Mandala Grid",
    "Golden Loop Cells",
    "Orbital Mesh Bloom",
    "Sacred Mirror Net",
    "Diamond Bridge Mesh",
    "High Petal Lattice",
    "Symmetric Crown",
    "Wave Labyrinth",
    "Orbital Ring Mesh",
    "Circle Resonance Net",
    "Dense Diamond Field",
    "Readable Dense Net",
  ];

  const family = families[Math.floor(t * families.length) % families.length];
  const patternName = names[Math.floor(t * names.length) % names.length];

  return {
    id: `classic-${f}`,
    frequency: f,
    n,
    m,
    patternName,
    family,
    radialMix: 0.08 + (1 - t) * 0.18,
    threshold: 0.118 - t * 0.036,
    lineThickness: 1.42 - t * 0.50,
  };
}

export function createRandomClassicMode(seed, index = 0) {
  const rng = mulberry32((seed + index * 2654435761) >>> 0);
  const frequency = Math.round(20 + rng() * (2222 - 20));
  const base = frequencyToClassicMode(frequency);

  // sedikit variasi, tapi jangan bikin chaos
  return {
    ...base,
    n: clamp(base.n + Math.round((rng() - 0.5) * 1.5), 1, 8),
    m: clamp(base.m + Math.round((rng() - 0.5) * 1.5), 2, 10),
    radialMix: clamp(base.radialMix + (rng() - 0.5) * 0.03, 0.05, 0.28),
    threshold: clamp(base.threshold + (rng() - 0.5) * 0.008, 0.078, 0.118),
    lineThickness: clamp(base.lineThickness + (rng() - 0.5) * 0.06, 0.90, 1.45),
  };
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const int = Number.parseInt(normalized, 16);

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);

  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

function createSandStopsFromGradient(gradient) {
  return [
    mixHex(gradient.stops[0], "#ffffff", 0.78),
    mixHex(gradient.stops[1], "#ffffff", 0.72),
    mixHex(gradient.stops[2], "#ffffff", 0.66),
    mixHex(gradient.stops[3], "#ffffff", 0.82),
  ];
}

export function renderClassicSvg({
  mode,
  seed = 0,
  width = 1024,
  height = 1024,
  showLabel = true,
  label = `${mode.frequency} Hz`,
  warmCorners = true,
  variant = 0,
  grainMultiplier = 1,
}) {
  const rng = mulberry32(seed ^ mode.frequency);
  const gradient = pickClassicGradient(seed ^ mode.frequency);

  const margin = Math.round(width * 0.12);
  const plate = width - margin * 2;
  const resolution = 220;
  const cell = plate / (resolution - 1);
  const threshold = mode.threshold;
  const lineIntensity = mode.lineThickness;
  const particles = [];

  const sandStops = createSandStopsFromGradient(gradient);

  for (let iy = 0; iy < resolution; iy += 1) {
    for (let ix = 0; ix < resolution; ix += 1) {
      const x = (ix / (resolution - 1)) * 2 - 1;
      const y = (iy / (resolution - 1)) * 2 - 1;
      const field = classicField(x, y, mode, variant);
      const abs = Math.abs(field);

      if (abs < threshold) {
        const energy = 1 - clamp(abs / threshold, 0, 1);
        const grains = Math.max(2, Math.round((1.6 + energy * 4.8) * grainMultiplier));

        for (let g = 0; g < grains; g += 1) {
          const px = margin + ix * cell + (rng() - 0.5) * cell * 2.1 * lineIntensity;
          const py = margin + iy * cell + (rng() - 0.5) * cell * 2.1 * lineIntensity;
          const radius = 0.72 + energy * 1.85 + rng() * 0.72;
          const opacity = 0.50 + energy * 0.46 + rng() * 0.04;
          const idx = Math.min(
            sandStops.length - 1,
            Math.floor((0.28 + energy * 0.72) * sandStops.length)
          );
          const color = sandStops[idx];

          particles.push(
            `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${radius.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`
          );
        }
      }
    }
  }

  const particleMarkup = particles.join("\\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="85%">
      <stop offset="0%" stop-color="${gradient.stops[3]}"/>
      <stop offset="35%" stop-color="${gradient.stops[2]}"/>
      <stop offset="70%" stop-color="${gradient.stops[1]}"/>
      <stop offset="100%" stop-color="${gradient.stops[0]}"/>
    </radialGradient>

    <radialGradient id="plateTint" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${gradient.stops[2]}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${margin}" y="${margin}" width="${plate}" height="${plate}" fill="#020202" stroke="${gradient.stops[2]}" stroke-opacity="0.45" stroke-width="2"/>
  <rect x="${margin}" y="${margin}" width="${plate}" height="${plate}" fill="url(#plateTint)"/>

  <g filter="url(#softGlow)">
    ${particleMarkup}
  </g>

  ${
  showLabel
? `   <g opacity="0.96">     <rect
      x="${margin}"
      y="${height - margin * 1.08}"
      width="${plate}"
      height="82"
      rx="14"
      fill="#031319"
      opacity="0.58"
    />     <text
      x="${width / 2}"
      y="${height - margin * 0.77}"
      fill="${gradient.stops[3]}"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="20"
      font-weight="800"
      letter-spacing="2.2"
      text-anchor="middle"
      opacity="0.98"     >CHLADNI NODE · ${mode.frequency} Hz</text>     <text
      x="${width / 2}"
      y="${height - margin * 0.58}"
      fill="#cbd5e1"
      font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      font-size="18"
      font-weight="600"
      letter-spacing="1.3"
      text-anchor="middle"
      opacity="0.82"     >${mode.family} · Mode ${mode.n}×${mode.m} · ${gradient.name}</text>   </g>`
: ""

}
</svg>`;
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}