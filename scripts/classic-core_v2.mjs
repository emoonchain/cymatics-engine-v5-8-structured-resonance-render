#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export const CLASSIC_MIN_FREQUENCY = 20;
export const CLASSIC_MAX_FREQUENCY = 999;

export const rarityNames = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

export const classicGradients = [
  {
    name: "Amber Dune",
    stops: ["#140d06", "#2a1808", "#6f4512", "#f6c56f"],
    sand: "#f7d48f",
    accent: "#f6c56f",
  },
  {
    name: "Solar Ember",
    stops: ["#170907", "#38100d", "#8b2e0f", "#ffb14a"],
    sand: "#ffd49a",
    accent: "#ffb14a",
  },
  {
    name: "Violet Prism",
    stops: ["#100816", "#28103c", "#6c25a8", "#d69aff"],
    sand: "#edd8ff",
    accent: "#d69aff",
  },
  {
    name: "Cyan Relic",
    stops: ["#071117", "#0f2632", "#1b6c8e", "#8ce7ff"],
    sand: "#d2f7ff",
    accent: "#8ce7ff",
  },
  {
    name: "Emerald Field",
    stops: ["#06110e", "#0e2f26", "#178e67", "#9df7d0"],
    sand: "#d7fff0",
    accent: "#9df7d0",
  },
  {
    name: "Rose Signal",
    stops: ["#15080c", "#3d1022", "#9c2764", "#ff9bcf"],
    sand: "#ffe0ef",
    accent: "#ff9bcf",
  },
  {
    name: "Blue Ash",
    stops: ["#09101a", "#18283f", "#416ea9", "#bfd6ff"],
    sand: "#e2ebff",
    accent: "#bfd6ff",
  },
  {
    name: "Obsidian Gold",
    stops: ["#050505", "#151313", "#403324", "#f1d097"],
    sand: "#f5dfb8",
    accent: "#f1d097",
  },
  {
    name: "Crimson Veil",
    stops: ["#120607", "#310d12", "#8f2733", "#ff9d96"],
    sand: "#ffd3c8",
    accent: "#ff9d96",
  },
  {
    name: "Lilac Echo",
    stops: ["#0b0914", "#24173a", "#6850af", "#d6c6ff"],
    sand: "#efe9ff",
    accent: "#d6c6ff",
  },
  {
    name: "Teal Ruin",
    stops: ["#051113", "#0f2a2f", "#1f7580", "#9ce9e4"],
    sand: "#d8fffa",
    accent: "#9ce9e4",
  },
  {
    name: "Desert Bloom",
    stops: ["#170d0a", "#3d2418", "#975b2f", "#f6d19a"],
    sand: "#fae3bf",
    accent: "#f6d19a",
  },
  {
    name: "Aurora Mint",
    stops: ["#071111", "#133434", "#22a380", "#b3ffe4"],
    sand: "#defff3",
    accent: "#b3ffe4",
  },
  {
    name: "Electric Wine",
    stops: ["#11070f", "#2a1030", "#7d2b93", "#ffa5f8"],
    sand: "#ffe3ff",
    accent: "#ffa5f8",
  },
  {
    name: "Pearl Sand",
    stops: ["#0d0d0f", "#262228", "#716160", "#f2e0d0"],
    sand: "#fbf2eb",
    accent: "#f2e0d0",
  },
  {
    name: "Signal Honey",
    stops: ["#120d06", "#39240f", "#8a5718", "#ffd36a"],
    sand: "#ffe6a8",
    accent: "#ffd36a",
  },
  {
    name: "Cerulean Archive",
    stops: ["#061018", "#11283c", "#286daa", "#9ad8ff"],
    sand: "#daf2ff",
    accent: "#9ad8ff",
  },
  {
    name: "Prism Bloom",
    stops: ["#0d0811", "#2e0f30", "#91408f", "#ffc0ff"],
    sand: "#ffe7ff",
    accent: "#ffc0ff",
  },
  {
    name: "Void Ember",
    stops: ["#050505", "#1a1310", "#5d3324", "#e79a78"],
    sand: "#f6d3c3",
    accent: "#e79a78",
  },
  {
    name: "Sacred Mesh",
    stops: ["#05100e", "#123127", "#2e8b73", "#c7fff0"],
    sand: "#e4fff7",
    accent: "#c7fff0",
  },
];

export const classicFrequencyModes = generateClassicFrequencyModes({
  count: 120,
  minFrequency: CLASSIC_MIN_FREQUENCY,
  maxFrequency: CLASSIC_MAX_FREQUENCY,
  seedText: "resonance-genesis-classic-bank-v2",
});

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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

export function hashStringToSeed(input = "") {
  let h = 2166136261 >>> 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function integerSqrt(value) {
  return Math.floor(Math.sqrt(Math.max(0, value)));
}

export function pickClassicGradient(seed = 0) {
  const index = Math.abs(seed >>> 0) % classicGradients.length;
  return classicGradients[index];
}

export function computeNodeDensityBps(mode) {
  const complexity = mode.n * mode.m;
  const radialComponent = mode.radialMix * 2200;
  const thresholdComponent = (0.13 - mode.threshold) * 9000;
  const complexityComponent = complexity * 18;

  return Math.round(
    clamp(
      radialComponent + thresholdComponent + complexityComponent,
      250,
      2500
    )
  );
}

export function computeLineThicknessBps(mode) {
  return Math.round(clamp(mode.lineThickness * 100, 60, 200));
}

export function pickRarityTier(seed, mode, nodeDensityBps) {
  const rollSeed = hashStringToSeed(
    `${seed}:${mode.frequency}:${mode.n}:${mode.m}:${nodeDensityBps}:rarity`
  );

  const roll = rollSeed % 10_000;

  // Distribution:
  // Mythic 5%, Legendary 8%, Epic 17%, Rare 25%, Uncommon 25%, Common 20%
  if (roll < 500) return 5;       // Mythic
  if (roll < 1300) return 4;      // Legendary
  if (roll < 3000) return 3;      // Epic
  if (roll < 5500) return 2;      // Rare
  if (roll < 8000) return 1;      // Uncommon
  return 0;                       // Common
}

export function familyFromMode(n, m, frequency) {
  const diff = Math.abs(n - m);

  if (frequency < 100) return "Low Ring";
  if (frequency < 180) return diff <= 1 ? "Bass Cross" : "Sub Bloom";
  if (frequency < 280) return diff <= 1 ? "Radial Bloom" : "Ring Cross";
  if (frequency < 400) return diff <= 2 ? "Petal Grid" : "Orbital Wells";
  if (frequency < 520) return diff <= 2 ? "Loop Lattice" : "Branch Web";
  if (frequency < 680) return diff <= 1 ? "Mirror Mesh" : "Bridge Mesh";
  if (frequency < 820) return diff <= 2 ? "Circle Lattice" : "Orbital Mesh";
  if (frequency < 920) return "Diamond Grid";
  return "Dense Net";
}

export function patternNameFromMode(frequency, n, m, family) {
  const diff = Math.abs(n - m);

  let prefix = "Harmonic";
  if (frequency < 120) prefix = "Deep";
  else if (frequency < 240) prefix = "Central";
  else if (frequency < 420) prefix = "Resonant";
  else if (frequency < 620) prefix = "Orbital";
  else if (frequency < 820) prefix = "Signal";
  else prefix = "Dense";

  let structure = "Field";
  if (diff <= 1) structure = "Mirror";
  else if (diff <= 2) structure = "Bridge";
  else if (diff <= 3) structure = "Lattice";
  else structure = "Drift";

  return `${prefix} ${structure} ${family}`;
}

export function modeFromFrequencyBand(frequency) {
  if (frequency < 80) return { n: 1, m: 2 };
  if (frequency < 140) return { n: 2, m: 3 };
  if (frequency < 220) return { n: 3, m: 4 };
  if (frequency < 320) return { n: 4, m: 5 };
  if (frequency < 440) return { n: 4, m: 6 };
  if (frequency < 560) return { n: 5, m: 6 };
  if (frequency < 700) return { n: 5, m: 7 };
  if (frequency < 820) return { n: 6, m: 7 };
  if (frequency < 920) return { n: 6, m: 8 };
  return { n: 7, m: 8 };
}

export function frequencyToClassicMode(frequency, options = {}) {
  const { seed = 0, index = 0 } = options;

  const f = clamp(
    Math.round(frequency),
    CLASSIC_MIN_FREQUENCY,
    CLASSIC_MAX_FREQUENCY
  );

  const t =
    (f - CLASSIC_MIN_FREQUENCY) /
    (CLASSIC_MAX_FREQUENCY - CLASSIC_MIN_FREQUENCY);

  const base = modeFromFrequencyBand(f);

  // frequency dekat tetap mirip: pakai band seed, bukan token seed penuh
  const bandSize = 25;
  const band = Math.floor((f - CLASSIC_MIN_FREQUENCY) / bandSize);
  const bandSeed = hashStringToSeed(`classic-band-v2:${band}`);
  const rng = mulberry32((bandSeed ^ seed ^ index) >>> 0);

  let n = clamp(base.n + Math.round((rng() - 0.5) * 1), 1, 8);
  let m = clamp(base.m + Math.round((rng() - 0.5) * 1), 2, 10);

  if (m < n) {
    const temp = n;
    n = m;
    m = temp;
  }

  if (n === m && rng() > 0.55) {
    m = clamp(m + 1, 2, 10);
  }

  const family = familyFromMode(n, m, f);
  const patternName = patternNameFromMode(f, n, m, family);

  const radialMix = clamp(
    0.28 - t * 0.19 + (rng() - 0.5) * 0.018,
    0.055,
    0.30
  );

  const threshold = clamp(
    0.122 - t * 0.043 + (rng() - 0.5) * 0.006,
    0.074,
    0.125
  );

  const lineThickness = clamp(
    1.46 - t * 0.56 + (rng() - 0.5) * 0.05,
    0.82,
    1.52
  );

  return {
    id: `classic-${f}`,
    frequency: f,
    n,
    m,
    patternName,
    family,
    radialMix,
    threshold,
    lineThickness,
  };
}

export function createRandomClassicMode(seed, index = 0) {
  const rng = mulberry32((seed + index * 2654435761) >>> 0);

  const frequency = Math.round(
    CLASSIC_MIN_FREQUENCY +
      rng() * (CLASSIC_MAX_FREQUENCY - CLASSIC_MIN_FREQUENCY)
  );

  return frequencyToClassicMode(frequency, {
    seed: (seed ^ hashStringToSeed(`mode:${index}:${frequency}`)) >>> 0,
    index,
  });
}

export function generateClassicFrequencyModes({
  count = 120,
  minFrequency = CLASSIC_MIN_FREQUENCY,
  maxFrequency = CLASSIC_MAX_FREQUENCY,
  seedText = "classic-frequency-bank-v2",
} = {}) {
  const seed = hashStringToSeed(seedText);
  const rng = mulberry32(seed);
  const used = new Set();
  const modes = [];

  while (modes.length < count) {
    const frequency = Math.round(
      minFrequency + rng() * (maxFrequency - minFrequency)
    );

    if (used.has(frequency)) continue;
    used.add(frequency);

    const mode = frequencyToClassicMode(frequency, {
      seed: hashStringToSeed(`${seedText}:${frequency}:${modes.length}`),
      index: modes.length,
    });

    modes.push(mode);
  }

  return modes.sort((a, b) => a.frequency - b.frequency);
}

export function chladniField(x, y, n, m) {
  return (
    Math.cos(n * x) * Math.cos(m * y) -
    Math.cos(m * x) * Math.cos(n * y)
  );
}

export function waveModeField(x, y, n, m, phase = 0, amplitude = 1) {
  return (
    amplitude *
    Math.sin(n * Math.PI * x) *
    Math.sin(m * Math.PI * y) *
    Math.cos(phase)
  );
}

export function sampleChladniSand({
  width = 1024,
  height = 1024,
  n,
  m,
  epsilon = 0.028,
  step = 2,
  seed = 1,
  grainMultiplier = 1,
  radialMix = 0.1,
  variant = 0,
}) {
  const rng = mulberry32(seed >>> 0);
  const points = [];

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.5;

  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      const nx = px / (width - 1);
      const ny = py / (height - 1);

      const x = nx * Math.PI;
      const y = ny * Math.PI;

      const base = chladniField(x, y, n, m);

      const dx = px - cx;
      const dy = py - cy;
      const radius = Math.sqrt(dx * dx + dy * dy) / maxRadius;
      const angle = Math.atan2(dy, dx);

      const radialWave =
        Math.sin((n + m) * radius * Math.PI * (1.15 + radialMix)) *
        Math.cos(angle * (Math.max(2, Math.abs(n - m) + 2)));

      const waveBlend = lerp(base, radialWave, radialMix * 0.38);

      const shimmer = waveModeField(
        nx,
        ny,
        n,
        m,
        variant * 0.45 + radius * 1.5,
        0.22
      );

      const field = waveBlend + shimmer * 0.12;
      const closeness = 1 - Math.min(1, Math.abs(field) / epsilon);

      if (closeness <= 0) continue;

      const probability = clamp(
        closeness * (0.55 + grainMultiplier * 0.28),
        0,
        0.97
      );

      if (rng() < probability) {
        points.push({
          x: px + (rng() - 0.5) * step * 0.9,
          y: py + (rng() - 0.5) * step * 0.9,
          strength: closeness,
          radius: 0.35 + closeness * 1.1 * grainMultiplier,
        });
      }
    }
  }

  return points;
}

function formatSandPoints(points, color, opacityBase = 0.32) {
  return points
    .map((point) => {
      const opacity = clamp(opacityBase + point.strength * 0.72, 0.08, 0.98);
      return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(
        2
      )}" r="${point.radius.toFixed(2)}" fill="${color}" opacity="${opacity.toFixed(
        3
      )}" />`;
    })
    .join("\n");
}

function buildMuseumLabel({
  width,
  height,
  margin,
  plate,
  mode,
  gradient,
}) {
  return `
  <g opacity="0.98">
    <rect
      x="${margin}"
      y="${height - margin * 1.22}"
      width="${plate}"
      height="82"
      rx="16"
      fill="#031319"
      opacity="0.58"
    />
    <line
      x1="${margin + 22}"
      y1="${height - margin * 0.98}"
      x2="${margin + 180}"
      y2="${height - margin * 0.98}"
      stroke="${gradient.stops[3]}"
      stroke-width="1.5"
      opacity="0.88"
    />
    <line
      x1="${width - margin - 180}"
      y1="${height - margin * 0.98}"
      x2="${width - margin - 22}"
      y2="${height - margin * 0.98}"
      stroke="${gradient.stops[3]}"
      stroke-width="1.5"
      opacity="0.88"
    />

    <g>
      <rect
        x="${margin + 18}"
        y="${height - margin * 1.12}"
        width="118"
        height="28"
        rx="14"
        fill="${gradient.stops[3]}"
        opacity="0.95"
      />
      <text
        x="${margin + 77}"
        y="${height - margin * 0.93}"
        fill="#071015"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="12"
        font-weight="900"
        letter-spacing="1.8"
        text-anchor="middle"
      >${mode.frequency} HZ</text>
    </g>

    <g>
      <text
        x="${width / 2}"
        y="${height - margin * 0.83}"
        fill="${gradient.stops[3]}"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="17"
        font-weight="800"
        letter-spacing="2.2"
        text-anchor="middle"
        opacity="0.98"
      >CHLADNI NODE FIELD STUDY</text>

      <text
        x="${width / 2}"
        y="${height - margin * 0.59}"
        fill="#cbd5e1"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="12"
        font-weight="600"
        letter-spacing="1.1"
        text-anchor="middle"
        opacity="0.84"
      >${mode.family} · Mode ${mode.n}×${mode.m} · ${gradient.name}</text>
    </g>

    <g>
      <rect
        x="${width - margin - 166}"
        y="${height - margin * 1.12}"
        width="148"
        height="28"
        rx="14"
        fill="url(#traitBadge)"
        opacity="0.95"
      />
      <text
        x="${width - margin - 92}"
        y="${height - margin * 0.93}"
        fill="#071015"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="11.5"
        font-weight="900"
        letter-spacing="1.5"
        text-anchor="middle"
      >${mode.patternName}</text>
    </g>
  </g>`;
}

export function renderClassicSvg({
  mode,
  seed = 1,
  width = 1024,
  height = 1024,
  label = "",
  showLabel = true,
  warmCorners = true,
  variant = 0,
  grainMultiplier = 1,
} = {}) {
  if (!mode) {
    throw new Error("renderClassicSvg requires a mode object");
  }

  const gradient = pickClassicGradient(
    seed ^ hashStringToSeed(`${mode.frequency}:${mode.n}:${mode.m}`)
  );

  const margin = Math.round(width * 0.055);
  const plate = width - margin * 2;
  const innerHeight = height - margin * 2;
  const radius = Math.round(width * 0.045);

  const t =
    (mode.frequency - CLASSIC_MIN_FREQUENCY) /
    (CLASSIC_MAX_FREQUENCY - CLASSIC_MIN_FREQUENCY);

  const epsilon = clamp(
    mode.threshold * 0.34 + (1 - t) * 0.004,
    0.018,
    0.05
  );

  const step = mode.frequency < 240 ? 3 : mode.frequency < 700 ? 2.6 : 2.2;

  const points = sampleChladniSand({
    width: plate,
    height: plate,
    n: mode.n,
    m: mode.m,
    epsilon,
    step,
    seed: seed ^ hashStringToSeed(`${mode.id}:sand:${variant}`),
    grainMultiplier,
    radialMix: mode.radialMix,
    variant,
  });

  const sandSvg = formatSandPoints(points, gradient.sand, 0.24);

  const overlayRings = Array.from({ length: 3 }, (_, i) => {
    const r = plate * (0.18 + i * 0.13);
    return `<circle cx="${plate / 2}" cy="${plate / 2}" r="${r.toFixed(
      2
    )}" fill="none" stroke="${gradient.accent}" stroke-width="1" opacity="${(
      0.07 -
      i * 0.015
    ).toFixed(3)}" />`;
  }).join("\n");

  const cornerGlow = warmCorners
    ? `
    <radialGradient id="cornerWarm" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${gradient.stops[3]}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${gradient.stops[3]}" stop-opacity="0"/>
    </radialGradient>`
    : "";

  const labelSvg = showLabel
    ? buildMuseumLabel({
        width,
        height,
        margin,
        plate,
        mode,
        gradient,
      })
    : "";

  const safeLabel = label || `${mode.frequency} Hz`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradient.stops[0]}"/>
      <stop offset="32%" stop-color="${gradient.stops[1]}"/>
      <stop offset="72%" stop-color="${gradient.stops[2]}"/>
      <stop offset="100%" stop-color="${gradient.stops[3]}"/>
    </linearGradient>

    <radialGradient id="plateGlow" cx="50%" cy="48%" r="58%">
      <stop offset="0%" stop-color="${gradient.stops[3]}" stop-opacity="0.22"/>
      <stop offset="42%" stop-color="${gradient.stops[2]}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="traitBadge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${gradient.stops[3]}"/>
      <stop offset="100%" stop-color="${gradient.stops[2]}"/>
    </linearGradient>

    ${cornerGlow}

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="grainSoft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="0.15" />
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGradient)"/>

  <g opacity="0.18">
    <circle cx="${width * 0.18}" cy="${height * 0.14}" r="${
    width * 0.22
  }" fill="url(#plateGlow)"/>
    <circle cx="${width * 0.84}" cy="${height * 0.18}" r="${
    width * 0.18
  }" fill="url(#plateGlow)"/>
    <circle cx="${width * 0.78}" cy="${height * 0.78}" r="${
    width * 0.26
  }" fill="url(#plateGlow)"/>
  </g>

  ${
    warmCorners
      ? `
  <g opacity="0.18">
    <circle cx="0" cy="0" r="${width * 0.22}" fill="url(#cornerWarm)"/>
    <circle cx="${width}" cy="0" r="${width * 0.22}" fill="url(#cornerWarm)"/>
    <circle cx="0" cy="${height}" r="${width * 0.22}" fill="url(#cornerWarm)"/>
    <circle cx="${width}" cy="${height}" r="${width * 0.22}" fill="url(#cornerWarm)"/>
  </g>`
      : ""
  }

  <g transform="translate(${margin},${margin})">
    <rect
      width="${plate}"
      height="${plate}"
      rx="${radius}"
      fill="rgba(5,10,12,0.24)"
      stroke="rgba(255,255,255,0.08)"
      stroke-width="1.5"
    />

    <rect
      x="10"
      y="10"
      width="${plate - 20}"
      height="${plate - 20}"
      rx="${Math.max(12, radius - 10)}"
      fill="rgba(4,10,14,0.16)"
      stroke="${gradient.accent}"
      stroke-opacity="0.14"
      stroke-width="1"
    />

    <g transform="translate(0,0)">
      ${overlayRings}
    </g>

    <g filter="url(#grainSoft)">
      ${sandSvg}
    </g>

    <g opacity="0.24">
      <text
        x="${plate / 2}"
        y="${plate / 2}"
        fill="${gradient.accent}"
        font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        font-size="${Math.round(width * 0.034)}"
        font-weight="800"
        text-anchor="middle"
        letter-spacing="3.2"
        opacity="0.11"
      >${safeLabel}</text>
    </g>
  </g>

  ${labelSvg}
</svg>`;
}