export type SpecialColorMode =
  | "Standard"
  | "Chromatic Resonance"
  | "Aurora Field"
  | "Prism Bloom";

export type ColorwayResult = {
  mode: SpecialColorMode;
  name: string;
  variant: string;
  stops: string[];
};

type GradientColorway = {
  name: string;
  stops: string[];
};

function hashPresetSeed(seed: number, presetId: string): number {
  let h = seed >>> 0;

  for (let i = 0; i < presetId.length; i++) {
    h ^= presetId.charCodeAt(i);
    h = Math.imul(h, 16777619);
    h >>>= 0;
  }

  return h >>> 0;
}

function pickBySeed<T>(items: T[], seed: number, salt = 0): T {
  const index = Math.abs((seed + salt * 2654435761) >>> 0) % items.length;
  return items[index];
}

export function getSpecialColorMode(seed: number, presetId: string): SpecialColorMode {
  const h = hashPresetSeed(seed, presetId);
  const roll = (h % 10000) / 10000;

  if (roll < 0.0075) return "Prism Bloom";
  if (roll < 0.023) return "Aurora Field";
  if (roll < 0.052) return "Chromatic Resonance";

  return "Standard";
}

const gradientLibrary: GradientColorway[] = [
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

const presetColorIndices: Record<string, number[]> = {
  "genesis-pulse": [0, 9, 3, 6, 1, 2, 5, 7, 8, 4],
  "solar-lattice": [0, 6, 9, 3, 2, 8, 1, 4, 5, 7],
  "fractured-harmonic": [8, 2, 3, 4, 6, 7, 1, 0, 9, 5],
  "sacred-mesh": [1, 5, 4, 7, 8, 2, 0, 9, 3, 6],
  "bass-bloom": [7, 4, 1, 5, 8, 2, 0, 9, 6, 3],
  "void-resonance": [6, 8, 7, 3, 4, 2, 9, 1, 0, 5],
};

function getPresetColorwayOptions(presetId: string): GradientColorway[] {
  const order = presetColorIndices[presetId] ?? presetColorIndices["genesis-pulse"];
  return order.map((index) => gradientLibrary[index]);
}

export function getColorway(seed: number, presetId: string): ColorwayResult {
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

  return {
    mode,
    name: chosen.name,
    variant: chosen.name,
    stops: chosen.stops,
  };
}

export function getPresetPaletteStops(presetId: string, mode: SpecialColorMode, seed = 0): string[] {
  return getColorway(seed, presetId).stops;
}

export function getColorwayName(presetId: string, mode: SpecialColorMode, seed = 0): string {
  return getColorway(seed, presetId).name;
}

export function getColorwayVariant(seed: number, presetId: string): string {
  return getColorway(seed, presetId).variant;
}

export function upgradeRarityByColorMode(rarity: string, mode: SpecialColorMode): string {
  const order = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

  let index = order.indexOf(rarity);
  if (index < 0) index = 0;

  if (mode === "Chromatic Resonance") index = Math.max(index, 2);
  if (mode === "Aurora Field") index = Math.max(index, 3);
  if (mode === "Prism Bloom") index = Math.max(index, 4);

  return order[index];
}
