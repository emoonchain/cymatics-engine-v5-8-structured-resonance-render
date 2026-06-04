#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  CLASSIC_MIN_FREQUENCY,
  CLASSIC_MAX_FREQUENCY,
  hashStringToSeed,
  createRandomClassicMode,
  renderClassicSvg,
  pickClassicGradient,
  computeNodeDensityBps,
  computeLineThicknessBps,
  pickRarityTier,
  rarityNames,
  writeJson,
} from "./classic-core_v2.mjs";

const ROOT = process.cwd();

const DEFAULT_OUT_DIR = path.join(
  ROOT,
  "output_classic_collection",
  "classic-collection"
);

function parseArgs(argv) {
  const args = {
    count: 1000,
    start: 1,
    seed: "resonance-genesis-v2",
    outDir: DEFAULT_OUT_DIR,
    imageBase: "ipfs://CLASSIC_IMAGE_CID",
    animationBase: "",
    imageExt: "svg",
    animationExt: "mp4",
    width: 1024,
    height: 1024,
    includeAnimationUrl: false,
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
    } else if (arg === "--out-dir") {
      args.outDir = path.resolve(ROOT, next);
      i += 1;
    } else if (arg === "--image-base") {
      args.imageBase = normalizeBaseUri(next);
      i += 1;
    } else if (arg === "--animation-base") {
      args.animationBase = normalizeBaseUri(next);
      args.includeAnimationUrl = true;
      i += 1;
    } else if (arg === "--image-ext") {
      args.imageExt = String(next).replace(/^\./, "");
      i += 1;
    } else if (arg === "--animation-ext") {
      args.animationExt = String(next).replace(/^\./, "");
      i += 1;
    } else if (arg === "--width") {
      args.width = Number(next);
      i += 1;
    } else if (arg === "--height") {
      args.height = Number(next);
      i += 1;
    } else if (arg === "--include-animation-url") {
      args.includeAnimationUrl = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  if (!Number.isFinite(args.count) || args.count <= 0) {
    throw new Error("--count must be greater than 0");
  }

  if (!Number.isFinite(args.start) || args.start <= 0) {
    throw new Error("--start must be greater than 0");
  }

  if (!Number.isFinite(args.width) || args.width <= 0) {
    throw new Error("--width must be greater than 0");
  }

  if (!Number.isFinite(args.height) || args.height <= 0) {
    throw new Error("--height must be greater than 0");
  }

  args.imageBase = normalizeBaseUri(args.imageBase);

  if (args.animationBase) {
    args.animationBase = normalizeBaseUri(args.animationBase);
  }

  return args;
}

function printHelp() {
  console.log(`
Generate Resonance Genesis classic Chladni NFT collection.

Usage:
  node scripts/generate-classic-collection.mjs --count 1000

Options:
  --count <n>              Total NFT items. Default: 1000
  --start <n>              Starting token ID. Default: 1
  --seed <text>            Collection seed text
  --out-dir <dir>          Output directory
  --image-base <uri>       Image base URI, e.g. ipfs://CID
  --image-ext <ext>        Image extension. Default: svg
  --animation-base <uri>   Animation base URI, e.g. ipfs://CID
  --animation-ext <ext>    Animation extension. Default: mp4
  --include-animation-url  Include animation_url field
  --width <px>             SVG width. Default: 1024
  --height <px>            SVG height. Default: 1024

Examples:
  node scripts/generate-classic-collection.mjs --count 1000

  node scripts/generate-classic-collection.mjs \\
    --count 1000 \\
    --image-base ipfs://bafyIMAGECID \\
    --image-ext svg

  node scripts/generate-classic-collection.mjs \\
    --count 1000 \\
    --image-base ipfs://bafyIMAGECID \\
    --animation-base ipfs://bafyANIMATIONCID
`);
}

function normalizeBaseUri(value) {
  if (!value) return "";
  const trimmed = String(value).trim().replace(/\/$/, "");

  if (
    trimmed.startsWith("ipfs://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  return `ipfs://${trimmed}`;
}

function ensureOutput(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });

  fs.mkdirSync(path.join(outDir, "images"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "metadata"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "traits"), { recursive: true });
}

function buildAssetUri(base, tokenId, ext) {
  if (!base) return "";
  return `${base}/${tokenId}.${ext}`;
}

function rarityLabel(rarityTier) {
  return rarityNames[rarityTier] || "Common";
}

function formatFrequencyBand(frequency) {
  if (frequency < 100) return "Sub Resonance";
  if (frequency < 180) return "Low Harmonic";
  if (frequency < 320) return "Lower Mid Field";
  if (frequency < 520) return "Mid Resonance";
  if (frequency < 720) return "Upper Harmonic";
  if (frequency < 880) return "High Signal";
  return "Dense Signal";
}

function symmetryType(modeN, modeM) {
  const diff = Math.abs(modeN - modeM);

  if (diff === 0) return "Perfect Mirror";
  if (diff === 1) return "Near Mirror";
  if (diff <= 3) return "Bridge Symmetry";
  return "Drift Symmetry";
}

function nodeArchitecture(modeN, modeM, frequency) {
  const complexity = modeN * modeM;

  if (frequency < 120) return "Low Ring";
  if (complexity <= 16) return "Open Node";
  if (complexity <= 30) return "Branch Node";
  if (complexity <= 48) return "Mesh Node";
  if (complexity <= 64) return "Lattice Node";
  return "Dense Node";
}

function waveDistortion(mode, seed) {
  const valueSeed = hashStringToSeed(
    `${seed}:${mode.frequency}:${mode.n}:${mode.m}:distortion`
  );

  const roll = valueSeed % 100;

  if (roll < 18) return "Low Drift";
  if (roll < 48) return "Soft Phase";
  if (roll < 78) return "Harmonic Bend";
  if (roll < 94) return "Signal Warp";
  return "Prism Distortion";
}

function harmonicLayerCount(mode) {
  const complexity = mode.n + mode.m + Math.round(mode.radialMix * 10);

  if (complexity <= 8) return 2;
  if (complexity <= 12) return 3;
  if (complexity <= 16) return 4;
  if (complexity <= 20) return 5;
  return 6;
}

function computeHashratePreview({
  frequency,
  modeN,
  modeM,
  nodeDensityBps,
  lineThicknessBps,
  rarityTier,
}) {
  const frequencyWeight = Math.floor(Math.sqrt(frequency)) * 100;
  const modeComplexity = modeN * modeM + Math.abs(modeN - modeM) * 3;
  const nodeWeight = nodeDensityBps * 3;
  const lineWeight = lineThicknessBps * 2;

  let symmetryBonus = 0;
  const diff = Math.abs(modeN - modeM);

  if (diff <= 1) symmetryBonus = 500;
  else if (diff <= 3) symmetryBonus = 250;

  const rarityMultipliers = [100, 115, 135, 165, 210, 280];
  const rarityMultiplier = rarityMultipliers[rarityTier] || 100;

  const baseHashrate =
    frequencyWeight +
    modeComplexity * 40 +
    nodeWeight +
    lineWeight +
    symmetryBonus;

  return Math.floor((baseHashrate * rarityMultiplier) / 100);
}

function makeMetadata({
  tokenId,
  mode,
  gradient,
  seed,
  imageUri,
  animationUri,
}) {
  const nodeDensityBps = computeNodeDensityBps(mode);
  const lineThicknessBps = computeLineThicknessBps(mode);
  const rarityTier = pickRarityTier(seed, mode, nodeDensityBps);
  const rarityName = rarityLabel(rarityTier);

  const frequencyBand = formatFrequencyBand(mode.frequency);
  const symmetry = symmetryType(mode.n, mode.m);
  const architecture = nodeArchitecture(mode.n, mode.m, mode.frequency);
  const distortion = waveDistortion(mode, seed);
  const harmonicLayers = harmonicLayerCount(mode);

  const hashratePreview = computeHashratePreview({
    frequency: mode.frequency,
    modeN: mode.n,
    modeM: mode.m,
    nodeDensityBps,
    lineThicknessBps,
    rarityTier,
  });

  const metadata = {
    name: `Chladni Node #${tokenId}`,
    description:
      "A frequency-born Chladni Node from the Resonance Genesis collection. Generated from cymatics-inspired resonance math, nodal sand fields, mode geometry, and deterministic on-chain mining traits.",
    image: imageUri,

    tokenId,
    frequency: mode.frequency,
    modeN: mode.n,
    modeM: mode.m,
    patternName: mode.patternName,
    family: mode.family,
    backgroundGradient: gradient.name,

    nodeDensity: Number((nodeDensityBps / 10_000).toFixed(4)),
    nodeDensityBps,
    lineThickness: Number((lineThicknessBps / 100).toFixed(2)),
    lineThicknessBps,
    rarityTier,
    rarityName,

    frequencyBand,
    symmetryType: symmetry,
    nodeArchitecture: architecture,
    waveDistortion: distortion,
    harmonicLayerCount: harmonicLayers,

    radialMix: Number(mode.radialMix.toFixed(4)),
    threshold: Number(mode.threshold.toFixed(4)),
    hashratePreview,

    renderer: "classic-chladni-physics-v2",

    attributes: [
      { trait_type: "Frequency", value: `${mode.frequency} Hz` },
      { trait_type: "Frequency Band", value: frequencyBand },

      { trait_type: "Mode", value: `${mode.n} x ${mode.m}` },
      { trait_type: "Mode N", value: mode.n },
      { trait_type: "Mode M", value: mode.m },

      { trait_type: "Pattern", value: mode.patternName },
      { trait_type: "Family", value: mode.family },
      { trait_type: "Background Gradient", value: gradient.name },

      { trait_type: "Node Density", value: Number((nodeDensityBps / 10_000).toFixed(4)) },
      { trait_type: "Node Density BPS", value: nodeDensityBps },

      { trait_type: "Line Thickness", value: Number((lineThicknessBps / 100).toFixed(2)) },
      { trait_type: "Line Thickness BPS", value: lineThicknessBps },

      { trait_type: "Rarity Tier", value: rarityName },
      { trait_type: "Rarity Index", value: rarityTier },

      { trait_type: "Symmetry Type", value: symmetry },
      { trait_type: "Node Architecture", value: architecture },
      { trait_type: "Wave Distortion", value: distortion },
      { trait_type: "Harmonic Layer Count", value: harmonicLayers },

      { trait_type: "Radial Mix", value: Number(mode.radialMix.toFixed(4)) },
      { trait_type: "Threshold", value: Number(mode.threshold.toFixed(4)) },

      { trait_type: "Hashrate Preview", value: hashratePreview },
      { trait_type: "Visual Style", value: "Classic Chladni Physics" },
    ],
  };

  if (animationUri) {
    metadata.animation_url = animationUri;
  }

  return {
    metadata,
    onchainTrait: {
      tokenId,
      frequency: mode.frequency,
      modeN: mode.n,
      modeM: mode.m,
      nodeDensityBps,
      lineThicknessBps,
      rarityTier,
      initialized: true,
    },
    summaryTraits: {
      rarityName,
      frequencyBand,
      symmetry,
      architecture,
      distortion,
      harmonicLayers,
      hashratePreview,
    },
  };
}

function incrementCounter(object, key) {
  object[key] = (object[key] || 0) + 1;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  const outDir = path.resolve(ROOT, options.outDir);
  const imageDir = path.join(outDir, "images");
  const metadataDir = path.join(outDir, "metadata");
  const traitsDir = path.join(outDir, "traits");

  ensureOutput(outDir);

  const summary = {
    name: "Resonance Genesis",
    collection: "Chladni Node",
    renderer: "classic-chladni-physics-v2",
    total: options.count,
    startTokenId: options.start,
    endTokenId: options.start + options.count - 1,
    frequencyRange: {
      min: CLASSIC_MIN_FREQUENCY,
      max: CLASSIC_MAX_FREQUENCY,
    },
    generatedAt: new Date().toISOString(),
    seed: options.seed,
    imageBase: options.imageBase,
    animationBase: options.animationBase || null,
    frequencies: {},
    backgrounds: {},
    families: {},
    rarityTiers: {},
    frequencyBands: {},
    symmetryTypes: {},
    nodeArchitectures: {},
    waveDistortions: {},
    harmonicLayerCounts: {},
    minHashratePreview: null,
    maxHashratePreview: null,
  };

  const onchainTraits = {
    tokenIds: [],
    traits: [],
  };

  const csvRows = [
    [
      "tokenId",
      "name",
      "frequency",
      "modeN",
      "modeM",
      "nodeDensityBps",
      "lineThicknessBps",
      "rarityTier",
      "rarityName",
      "family",
      "patternName",
      "backgroundGradient",
      "frequencyBand",
      "symmetryType",
      "nodeArchitecture",
      "waveDistortion",
      "harmonicLayerCount",
      "hashratePreview",
      "image",
      "animation_url",
    ],
  ];

  console.log("Generating Resonance Genesis classic collection v2...");
  console.log(`Count: ${options.count}`);
  console.log(`Output: ${path.relative(ROOT, outDir)}`);
  console.log(`Frequency range: ${CLASSIC_MIN_FREQUENCY}-${CLASSIC_MAX_FREQUENCY} Hz`);

  for (let i = 0; i < options.count; i += 1) {
    const tokenId = options.start + i;
    const seed = hashStringToSeed(`${options.seed}:${tokenId}`);

    const mode = createRandomClassicMode(seed, tokenId);
    const gradient = pickClassicGradient(
      seed ^ hashStringToSeed(`${mode.frequency}:${mode.n}:${mode.m}:gradient`)
    );

    const imageUri = buildAssetUri(options.imageBase, tokenId, options.imageExt);
    const animationUri =
      options.includeAnimationUrl && options.animationBase
        ? buildAssetUri(options.animationBase, tokenId, options.animationExt)
        : "";

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

    fs.writeFileSync(path.join(imageDir, `${tokenId}.svg`), svg, "utf8");

    const { metadata, onchainTrait, summaryTraits } = makeMetadata({
      tokenId,
      mode,
      gradient,
      seed,
      imageUri,
      animationUri,
    });

    writeJson(path.join(metadataDir, `${tokenId}.json`), metadata);

    onchainTraits.tokenIds.push(tokenId);

    onchainTraits.traits.push({
      frequency: onchainTrait.frequency,
      modeN: onchainTrait.modeN,
      modeM: onchainTrait.modeM,
      nodeDensityBps: onchainTrait.nodeDensityBps,
      lineThicknessBps: onchainTrait.lineThicknessBps,
      rarityTier: onchainTrait.rarityTier,
      initialized: onchainTrait.initialized,
    });

    incrementCounter(summary.frequencies, String(mode.frequency));
    incrementCounter(summary.backgrounds, gradient.name);
    incrementCounter(summary.families, mode.family);
    incrementCounter(summary.rarityTiers, summaryTraits.rarityName);
    incrementCounter(summary.frequencyBands, summaryTraits.frequencyBand);
    incrementCounter(summary.symmetryTypes, summaryTraits.symmetry);
    incrementCounter(summary.nodeArchitectures, summaryTraits.architecture);
    incrementCounter(summary.waveDistortions, summaryTraits.distortion);
    incrementCounter(summary.harmonicLayerCounts, String(summaryTraits.harmonicLayers));

    if (
      summary.minHashratePreview === null ||
      summaryTraits.hashratePreview < summary.minHashratePreview
    ) {
      summary.minHashratePreview = summaryTraits.hashratePreview;
    }

    if (
      summary.maxHashratePreview === null ||
      summaryTraits.hashratePreview > summary.maxHashratePreview
    ) {
      summary.maxHashratePreview = summaryTraits.hashratePreview;
    }

    csvRows.push([
      tokenId,
      metadata.name,
      mode.frequency,
      mode.n,
      mode.m,
      onchainTrait.nodeDensityBps,
      onchainTrait.lineThicknessBps,
      onchainTrait.rarityTier,
      summaryTraits.rarityName,
      mode.family,
      mode.patternName,
      gradient.name,
      summaryTraits.frequencyBand,
      summaryTraits.symmetry,
      summaryTraits.architecture,
      summaryTraits.distortion,
      summaryTraits.harmonicLayers,
      summaryTraits.hashratePreview,
      metadata.image,
      metadata.animation_url || "",
    ]);

    if ((i + 1) % 100 === 0 || i + 1 === options.count) {
      console.log(`Generated ${i + 1}/${options.count}`);
    }
  }

  writeJson(path.join(outDir, "summary.json"), summary);
  writeJson(path.join(traitsDir, "onchain-traits.json"), onchainTraits);
  writeJson(path.join(outDir, "onchain-traits.json"), onchainTraits);

  const csv = csvRows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          if (/[",\n\r]/.test(text)) {
            return `"${text.replaceAll('"', '""')}"`;
          }
          return text;
        })
        .join(",")
    )
    .join("\n");

  fs.writeFileSync(path.join(outDir, "traits.csv"), `${csv}\n`, "utf8");

  console.log("");
  console.log("Generated classic collection v2.");
  console.log(`Images:      ${path.relative(ROOT, imageDir)}`);
  console.log(`Metadata:    ${path.relative(ROOT, metadataDir)}`);
  console.log(`On-chain:    ${path.relative(ROOT, path.join(outDir, "onchain-traits.json"))}`);
  console.log(`Traits CSV:  ${path.relative(ROOT, path.join(outDir, "traits.csv"))}`);
  console.log("");
  console.log("Rarity distribution:");
  console.log(JSON.stringify(summary.rarityTiers, null, 2));
}

main();