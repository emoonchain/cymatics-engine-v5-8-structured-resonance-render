#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  hashStringToSeed,
  createRandomClassicMode,
  renderClassicSvg,
  pickClassicGradient,
    createRandomScientificMode,
  renderScientificChladniSvg,
  computeScientificNodeDensityBps,
  computeScientificLineThicknessBps,
  scientificRarityTier,
} from "./classic-core.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "output_classic_collection", "classic-collection");
const IMAGE_DIR = path.join(OUT_DIR, "images");
const META_DIR = path.join(OUT_DIR, "metadata");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(argv) {
  const args = {
    count: 1000,
    start: 1,
    seed: "classic-cymatica",
    imageBase: "ipfs://CLASSIC_IMAGE_CID",
    width: 1024,
    height: 1024,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--count" || arg === "-c") {
      args.count = Number(next);
      i += 1;
    } else if (arg === "--start") {
      args.start = Number(next);
      i += 1;
    } else if (arg === "--seed" || arg === "-s") {
      args.seed = String(next);
      i += 1;
    } else if (arg === "--image-base") {
      args.imageBase = String(next);
      i += 1;
    } else if (arg === "--width") {
      args.width = Number(next);
      i += 1;
    } else if (arg === "--height") {
      args.height = Number(next);
      i += 1;
    }
  }

  return args;
}

function ensureOutput() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });
}

const options = parseArgs(process.argv.slice(2));
ensureOutput();

const summary = {
  total: options.count,
  frequencies: {},
  backgrounds: {},
  families: {},
};

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const rarityNames = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

function pickRarityTier(seed, mode, nodeDensityBps) {
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

for (let i = 0; i < options.count; i += 1) {
  const tokenId = options.start + i;
  const seed = hashStringToSeed(`${options.seed}:${tokenId}`);
  // const mode = createRandomClassicMode(seed, tokenId);
const mode = createRandomScientificMode(seed, tokenId);
  const gradient = pickClassicGradient(seed);
//   const nodeDensityBps = computeNodeDensityBps(mode);
// const lineThicknessBps = computeLineThicknessBps(mode);
// const rarityTier = pickRarityTier(seed, mode, nodeDensityBps);
const rarityName = rarityNames[rarityTier] || "Common";

const svg = renderClassicSvg({
  mode,
  seed,
  width: options.width,
  height: options.height,
  showLabel: true,
  label: `CHLADNI NODE · ${mode.frequency} Hz · ${mode.family} · Mode ${mode.n}×${mode.m} · ${gradient.name}`,
  variant: tokenId % 4,
  grainMultiplier: 1.15,

});

const svg = renderScientificChladniSvg({
  mode,
  seed,
  width: options.width,
  height: options.height,
  showLabel: true,
  resolution: 460,
});

  fs.writeFileSync(path.join(IMAGE_DIR, `${tokenId}.svg`), svg);

const metadata = {
  name: `Classic NODE #${tokenId}`,
  description:
    "Classic cymatics NFT with randomized readable frequency mapping from 20 Hz to 2222 Hz and unique gradient background.",
  image: `${options.imageBase}/${tokenId}.svg`,

  tokenId,
  frequency: mode.frequency,
  modeN: mode.n,
  modeM: mode.m,
  patternName: mode.patternName,
  family: mode.family,
  backgroundGradient: gradient.name,

  // Important for on-chain mining traits
  nodeDensity: Number((nodeDensityBps / 10_000).toFixed(4)),
  nodeDensityBps,
  lineThickness: Number(mode.lineThickness.toFixed(2)),
  lineThicknessBps,
  rarityTier,
  rarityName,

  // Optional physics/render traits
  radialMix: Number(mode.radialMix.toFixed(4)),
  threshold: Number(mode.threshold.toFixed(4)),

  attributes: [
    { trait_type: "Frequency", value: `${mode.frequency} Hz` },
    { trait_type: "Mode", value: `${mode.n} x ${mode.m}` },
    { trait_type: "Mode N", value: mode.n },
    { trait_type: "Mode M", value: mode.m },
    { trait_type: "Pattern", value: mode.patternName },
    { trait_type: "Family", value: mode.family },
    { trait_type: "Background Gradient", value: gradient.name },

    // Important for extractor
    { trait_type: "Node Density", value: Number((nodeDensityBps / 10_000).toFixed(4)) },
    { trait_type: "Line Thickness", value: Number(mode.lineThickness.toFixed(2)) },
    { trait_type: "Rarity Tier", value: rarityName },

    // Extra collector traits
    { trait_type: "Node Density BPS", value: nodeDensityBps },
    { trait_type: "Line Thickness BPS", value: lineThicknessBps },
    { trait_type: "Visual Style", value: "Classic Plate Gradient" },
  ],
};

  writeJson(path.join(META_DIR, `${tokenId}.json`), metadata);

  summary.frequencies[mode.frequency] = (summary.frequencies[mode.frequency] || 0) + 1;
  summary.backgrounds[gradient.name] = (summary.backgrounds[gradient.name] || 0) + 1;
  summary.families[mode.family] = (summary.families[mode.family] || 0) + 1;
}

writeJson(path.join(OUT_DIR, "summary.json"), summary);

console.log(`Generated classic collection: ${options.count} items`);
console.log(`Images:   ${path.relative(ROOT, IMAGE_DIR)}`);
console.log(`Metadata: ${path.relative(ROOT, META_DIR)}`);