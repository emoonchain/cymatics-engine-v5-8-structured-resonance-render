#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  classicFrequencyModes,
  renderClassicSvg,
  hashStringToSeed,
} from "./classic-core_v2.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "output_classic", "classic");
const IMAGE_DIR = path.join(OUT_DIR, "images");
const META_DIR = path.join(OUT_DIR, "metadata");
const GALLERY_PATH = path.join(OUT_DIR, "gallery.svg");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function ensureOutput() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });
}

function stripSvgWrapper(svg) {
  return svg
    .replace(/<\?xml[^>]*>/g, "")
    .replace(/<svg[^>]*>/g, "")
    .replace(/<\/svg>/g, "")
    .trim();
}

function buildGallerySvg(items) {
  const cols = 4;
  const rows = Math.ceil(items.length / cols);
  const cellW = 360;
  const cellH = 430;
  const outerPad = 28;
  const width = cols * cellW + outerPad * 2;
  const height = rows * cellH + outerPad * 2;

  const tiles = items
    .map((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = outerPad + col * cellW;
      const y = outerPad + row * cellH;

      const inner = stripSvgWrapper(
        renderClassicSvg({
          mode: item.mode,
          seed: item.seed,
          width: 500,
          height: 500,
          showLabel: false,
          warmCorners: true,
          variant: item.variant,
          grainMultiplier: 1.15,
        })
      );

      return `
      <g transform="translate(${x}, ${y})">
        <rect width="300" height="300" rx="18" fill="#05070a"/>
        ${inner}

        <rect
          x="0"
          y="318"
          width="300"
          height="70"
          rx="14"
          fill="#05070a"
          opacity="0.92"
        />

        <text
          x="150"
          y="345"
          fill="#f8fafc"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          font-size="18"
          font-weight="800"
          letter-spacing="1.6"
          text-anchor="middle"
        >CHLADNI SAND · ${item.mode.frequency} Hz</text>

        <text
          x="150"
          y="371"
          fill="#94a3b8"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          font-size="11"
          font-weight="600"
          letter-spacing="0.9"
          text-anchor="middle"
        >${item.mode.family} · Mode ${item.mode.n}×${item.mode.m}</text>
      </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="galleryBg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="55%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#galleryBg)"/>

  <text
    x="${width / 2}"
    y="44"
    fill="#f8fafc"
    font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    font-size="24"
    font-weight="900"
    letter-spacing="3"
    text-anchor="middle"
  >CHLADNI SAND · CLASSIC RESONANCE GALLERY</text>

  <text
    x="${width / 2}"
    y="74"
    fill="#94a3b8"
    font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    font-size="12"
    font-weight="600"
    letter-spacing="1.6"
    text-anchor="middle"
  >FREQUENCY STUDIES · NODE FIELD · SAND RESONANCE</text>

  <g transform="translate(0, 70)">
    ${tiles}
  </g>
</svg>`;
}
function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const rarityNames = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

function pickRarityTier(seed, mode, nodeDensityBps) {
  const rollSeed = hashStringToSeed(
    `${seed}:${mode.frequency}:${mode.n}:${mode.m}:${nodeDensityBps}:rarity`
  );

  const roll = rollSeed % 5_000;

  // Distribution:
  // Mythic 5%, Legendary 8%, Epic 17%, Rare 25%, Uncommon 25%, Common 20%
  if (roll < 500) return 5;       // Mythic
  if (roll < 1300) return 4;      // Legendary
  if (roll < 3000) return 3;      // Epic
  if (roll < 5500) return 2;      // Rare
  if (roll < 8000) return 1;      // Uncommon
  return 0;                       // Common
}

function computeNodeDensityBps(mode) {
  const modeComplexity = mode.n * mode.m;
  const radialComponent = mode.radialMix * 2200;
  const thresholdComponent = (0.13 - mode.threshold) * 9000;
  const complexityComponent = modeComplexity * 18;

  return Math.round(
    clampNumber(
      radialComponent + thresholdComponent + complexityComponent,
      250,
      2500
    )
  );
}

function computeLineThicknessBps(mode) {
  return Math.round(clampNumber(mode.lineThickness * 100, 60, 200));
}

ensureOutput();

const items = classicFrequencyModes.map((mode, index) => {
  const seed = hashStringToSeed(`${mode.id}:${mode.frequency}`);
  const variant = index % 4;
  const nodeDensityBps = computeNodeDensityBps(mode);
  const lineThicknessBps = computeLineThicknessBps(mode);
  const rarityTier = pickRarityTier(seed, mode, nodeDensityBps);
  const rarityName = rarityNames[rarityTier] || "Common";
  const svg = renderClassicSvg({
    mode,
    seed,
    label: `CHLADNI SAND · ${mode.frequency} Hz`,
    showLabel: true,
    variant,
    grainMultiplier: 1.22,
  });

  const imagePath = path.join(IMAGE_DIR, `${mode.frequency}.svg`);
  fs.writeFileSync(imagePath, svg);

  const metadata = {
    name: `Chladni Sand ${mode.frequency} Hz`,
    description:
      "Classic Chladni sand resonance study generated from frequency, mode, nodal density, and gradient plate field.",
    image: `./images/${mode.frequency}.svg`,

    frequency: mode.frequency,
    modeN: mode.n,
    modeM: mode.m,
    patternName: mode.patternName,
    family: mode.family,

    nodeDensity: Number((nodeDensityBps / 10_000).toFixed(4)),
    nodeDensityBps,
    lineThickness: Number(mode.lineThickness.toFixed(2)),
    lineThicknessBps,
    rarityTier,
    rarityName,

    radialMix: Number(mode.radialMix.toFixed(4)),
    threshold: Number(mode.threshold.toFixed(4)),

    renderer: "classic-chladni-sand-gallery",

    attributes: [
      { trait_type: "Frequency", value: `${mode.frequency} Hz` },
      { trait_type: "Mode", value: `${mode.n}×${mode.m}` },
      { trait_type: "Mode N", value: mode.n },
      { trait_type: "Mode M", value: mode.m },
      { trait_type: "Pattern", value: mode.patternName },
      { trait_type: "Family", value: mode.family },

      { trait_type: "Node Density", value: Number((nodeDensityBps / 10_000).toFixed(4)) },
      { trait_type: "Node Density BPS", value: nodeDensityBps },
      { trait_type: "Line Thickness", value: Number(mode.lineThickness.toFixed(2)) },
      { trait_type: "Line Thickness BPS", value: lineThicknessBps },
      { trait_type: "Rarity Tier", value: rarityName },

      { trait_type: "Radial Mix", value: Number(mode.radialMix.toFixed(3)) },
      { trait_type: "Threshold", value: Number(mode.threshold.toFixed(3)) },
      { trait_type: "Visual Style", value: "Chladni Sand" },
    ],
  };

  writeJson(path.join(META_DIR, `${mode.frequency}.json`), metadata);

  return {
    mode,
    seed,
    variant,
  };
});

fs.writeFileSync(GALLERY_PATH, buildGallerySvg(items));

writeJson(path.join(OUT_DIR, "classic-summary.json"), {
  total: items.length,
  frequencies: classicFrequencyModes.map((mode) => mode.frequency),
  output: {
    images: path.relative(ROOT, IMAGE_DIR),
    metadata: path.relative(ROOT, META_DIR),
    gallery: path.relative(ROOT, GALLERY_PATH),
  },
});

console.log(`Generated ${items.length} classic Chladni studies.`);
console.log(`Images:   ${path.relative(ROOT, IMAGE_DIR)}`);
console.log(`Metadata: ${path.relative(ROOT, META_DIR)}`);
console.log(`Gallery:  ${path.relative(ROOT, GALLERY_PATH)}`);