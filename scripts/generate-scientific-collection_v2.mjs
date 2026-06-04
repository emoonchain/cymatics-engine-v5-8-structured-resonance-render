#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  SCI_MIN_FREQUENCY,
  SCI_MAX_FREQUENCY,
  scientificRarityNames,
  scientificColorways,
  hashStringToSeed,
  createRandomScientificMode,
  renderScientificChladniSvg,
  computeScientificNodeDensityBps,
  computeScientificLineThicknessBps,
  scientificRarityTier,
  writeJson,
  pickScientificColorway,
} from "./chladni-scientific-core_v2.mjs";

const ROOT = process.cwd();
const DEFAULT_OUT_DIR = path.join(
  ROOT,
  "output_scientific_collection_v2",
  "chladni-nodes"
);

function parseArgs(argv) {
  const args = {
    count: 1000,
    start: 1,
    seed: "resonance-genesis-scientific-v3",
    outDir: DEFAULT_OUT_DIR,
    imageBase: "ipfs://SCIENTIFIC_IMAGE_CID",
    imageExt: "svg",
    animationBase: "",
    animationExt: "mp4",
    includeAnimationUrl: false,
    width: 1024,
    height: 1024,
    resolution: 420,
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
    } else if (arg === "--image-ext") {
      args.imageExt = String(next).replace(/^\./, "");
      i += 1;
    } else if (arg === "--animation-base") {
      args.animationBase = normalizeBaseUri(next);
      args.includeAnimationUrl = true;
      i += 1;
    } else if (arg === "--animation-ext") {
      args.animationExt = String(next).replace(/^\./, "");
      i += 1;
    } else if (arg === "--include-animation-url") {
      args.includeAnimationUrl = true;
    } else if (arg === "--width") {
      args.width = Number(next);
      i += 1;
    } else if (arg === "--height") {
      args.height = Number(next);
      i += 1;
    } else if (arg === "--resolution") {
      args.resolution = Number(next);
      i += 1;
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

  return args;
}

function printHelp() {
  console.log(`
Generate scientific Chladni Node NFT collection v3.

Usage:
  node scripts/generate-scientific-collection.mjs --count 1000

Options:
  --count <n>              Total items. Default: 1000
  --start <n>              Starting token ID. Default: 1
  --seed <text>            Collection seed
  --out-dir <dir>          Output directory
  --image-base <uri>       Image base URI, example ipfs://CID
  --image-ext <ext>        Image extension. Default: svg
  --animation-base <uri>   Animation base URI, example ipfs://CID
  --animation-ext <ext>    Animation extension. Default: mp4
  --include-animation-url  Include animation_url field
  --width <px>             SVG width. Default: 1024
  --height <px>            SVG height. Default: 1024
  --resolution <n>         Scientific render resolution. Default: 420
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

function incrementCounter(object, key) {
  object[key] = (object[key] || 0) + 1;
}

function frequencyBand(frequency) {
  if (frequency < 100) return "Sub Resonance";
  if (frequency < 180) return "Low Harmonic";
  if (frequency < 320) return "Lower Mid Field";
  if (frequency < 520) return "Mid Resonance";
  if (frequency < 720) return "Upper Harmonic";
  if (frequency < 880) return "High Signal";
  return "Dense Signal";
}

function symmetryType(n, m) {
  const diff = Math.abs(n - m);

  if (diff === 1) return "Near Mirror";
  if (diff === 2) return "Bridge Symmetry";
  if (diff <= 4) return "Lattice Symmetry";
  return "Drift Symmetry";
}

function nodeArchitecture(n, m, frequency) {
  const complexity = n * m;

  if (frequency < 100) return "Low Ring Node";
  if (complexity <= 20) return "Open Node";
  if (complexity <= 42) return "Bridge Node";
  if (complexity <= 72) return "Mesh Node";
  if (complexity <= 110) return "Lattice Node";
  return "Dense Node";
}

function waveDistortion(mode) {
  const k = mode.waveNumberK;

  if (k < 16) return "Low Drift";
  if (k < 24) return "Soft Phase";
  if (k < 32) return "Harmonic Bend";
  if (k < 40) return "Signal Warp";
  return "Fine Resonance";
}

function harmonicLayerCount(mode) {
  const complexity = mode.n + mode.m;

  if (complexity <= 7) return 2;
  if (complexity <= 11) return 3;
  if (complexity <= 15) return 4;
  if (complexity <= 20) return 5;
  return 6;
}

function computeHashratePreview({
  frequency,
  waveNumberK,
  modeN,
  modeM,
  nodeDensityBps,
  lineThicknessBps,
  rarityTier,
}) {
  const frequencyWeight = Math.floor(Math.sqrt(frequency)) * 100;
  const waveWeight = Math.round(waveNumberK * 120);
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
    waveWeight +
    modeComplexity * 40 +
    nodeWeight +
    lineWeight +
    symmetryBonus;

  return Math.floor((baseHashrate * rarityMultiplier) / 100);
}

function makeMetadata({
  tokenId,
  mode,
  seed,
  imageUri,
  animationUri,
  palette,
}) {
  const nodeDensityBps = computeScientificNodeDensityBps(mode);
  const lineThicknessBps = computeScientificLineThicknessBps(mode);
  const rarityTier = scientificRarityTier(seed, mode);
  const rarityName = scientificRarityNames[rarityTier] || "Common";

  const band = frequencyBand(mode.frequency);
  const symmetry = symmetryType(mode.n, mode.m);
  const architecture = nodeArchitecture(mode.n, mode.m, mode.frequency);
  const distortion = waveDistortion(mode);
  const harmonicLayers = harmonicLayerCount(mode);

  const hashratePreview = computeHashratePreview({
    frequency: mode.frequency,
    waveNumberK: mode.waveNumberK,
    modeN: mode.n,
    modeM: mode.m,
    nodeDensityBps,
    lineThicknessBps,
    rarityTier,
  });

  const metadata = {
    name: `Chladni Node #${tokenId}`,
    description:
      "A scientific Chladni Node from the Resonance Genesis collection. Generated from deterministic plate resonance math, nodal line detection, palette-driven scientific rendering, and on-chain mining traits.",
    image: imageUri,

    tokenId,
    frequency: mode.frequency,
    waveNumberK: mode.waveNumberK,
    modeN: mode.n,
    modeM: mode.m,
    patternName: mode.patternName,
    family: mode.family,

    colorway: palette.name,
    colorwayId: palette.id,

    nodeDensity: Number((nodeDensityBps / 10_000).toFixed(4)),
    nodeDensityBps,
    lineThickness: Number((lineThicknessBps / 100).toFixed(2)),
    lineThicknessBps,
    rarityTier,
    rarityName,

    frequencyBand: band,
    symmetryType: symmetry,
    nodeArchitecture: architecture,
    waveDistortion: distortion,
    harmonicLayerCount: harmonicLayers,

    hashratePreview,
    renderer: "scientific-chladni-node-v3",

    attributes: [
      { trait_type: "Frequency", value: `${mode.frequency} Hz` },
      { trait_type: "Wave Number K", value: mode.waveNumberK },
      { trait_type: "Frequency Band", value: band },

      { trait_type: "Mode", value: `${mode.n} x ${mode.m}` },
      { trait_type: "Mode N", value: mode.n },
      { trait_type: "Mode M", value: mode.m },

      { trait_type: "Pattern", value: mode.patternName },
      { trait_type: "Family", value: mode.family },
      { trait_type: "Colorway", value: palette.name },

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

      { trait_type: "Hashrate Preview", value: hashratePreview },
      { trait_type: "Visual Style", value: "Scientific Chladni Color" },
    ],
  };

  if (animationUri) {
    metadata.animation_url = animationUri;
  }

  return {
    metadata,
    onchainTrait: {
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
      band,
      symmetry,
      architecture,
      distortion,
      harmonicLayers,
      hashratePreview,
      colorway: palette.name,
    },
  };
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
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
    renderer: "scientific-chladni-node-v3",
    total: options.count,
    startTokenId: options.start,
    endTokenId: options.start + options.count - 1,
    frequencyRange: {
      min: SCI_MIN_FREQUENCY,
      max: SCI_MAX_FREQUENCY,
    },
    generatedAt: new Date().toISOString(),
    seed: options.seed,
    imageBase: options.imageBase,
    animationBase: options.animationBase || null,
    availableColorways: scientificColorways.map((item) => item.name),

    frequencies: {},
    waveNumbers: {},
    families: {},
    colorways: {},
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
      "waveNumberK",
      "modeN",
      "modeM",
      "colorway",
      "nodeDensityBps",
      "lineThicknessBps",
      "rarityTier",
      "rarityName",
      "family",
      "patternName",
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

  console.log("Generating Resonance Genesis scientific Chladni collection v3...");
  console.log(`Count: ${options.count}`);
  console.log(`Output: ${path.relative(ROOT, outDir)}`);

  for (let i = 0; i < options.count; i += 1) {
    const tokenId = options.start + i;
    const seed = hashStringToSeed(`${options.seed}:${tokenId}`);

    const mode = createRandomScientificMode(seed, tokenId);
    const palette = pickScientificColorway(seed, mode);

    const imageUri = buildAssetUri(options.imageBase, tokenId, options.imageExt);
    const animationUri =
      options.includeAnimationUrl && options.animationBase
        ? buildAssetUri(options.animationBase, tokenId, options.animationExt)
        : "";

    const svg = renderScientificChladniSvg({
      mode,
      seed,
      width: options.width,
      height: options.height,
      showLabel: true,
      resolution: options.resolution,
      label: `CHLADNI NODE · ${mode.frequency} Hz`,
      palette,
    });

    fs.writeFileSync(path.join(imageDir, `${tokenId}.svg`), svg, "utf8");

    const { metadata, onchainTrait, summaryTraits } = makeMetadata({
      tokenId,
      mode,
      seed,
      imageUri,
      animationUri,
      palette,
    });

    writeJson(path.join(metadataDir, `${tokenId}.json`), metadata);

    onchainTraits.tokenIds.push(tokenId);
    onchainTraits.traits.push(onchainTrait);

    incrementCounter(summary.frequencies, String(mode.frequency));
    incrementCounter(summary.waveNumbers, String(mode.waveNumberK));
    incrementCounter(summary.families, mode.family);
    incrementCounter(summary.colorways, summaryTraits.colorway);
    incrementCounter(summary.rarityTiers, summaryTraits.rarityName);
    incrementCounter(summary.frequencyBands, summaryTraits.band);
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
      mode.waveNumberK,
      mode.n,
      mode.m,
      palette.name,
      onchainTrait.nodeDensityBps,
      onchainTrait.lineThicknessBps,
      onchainTrait.rarityTier,
      summaryTraits.rarityName,
      mode.family,
      mode.patternName,
      summaryTraits.band,
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
  writeJson(path.join(outDir, "onchain-traits.json"), onchainTraits);
  writeJson(path.join(traitsDir, "onchain-traits.json"), onchainTraits);

  const csv = csvRows.map((row) => row.map(csvEscape).join(",")).join("\n");
  fs.writeFileSync(path.join(outDir, "traits.csv"), `${csv}\n`, "utf8");

  console.log("");
  console.log("Scientific collection v3 generated.");
  console.log(`Images:      ${path.relative(ROOT, imageDir)}`);
  console.log(`Metadata:    ${path.relative(ROOT, metadataDir)}`);
  console.log(`On-chain:    ${path.relative(ROOT, path.join(outDir, "onchain-traits.json"))}`);
  console.log(`Traits CSV:  ${path.relative(ROOT, path.join(outDir, "traits.csv"))}`);
  console.log("");
  console.log("Colorway distribution:");
  console.log(JSON.stringify(summary.colorways, null, 2));
  console.log("");
  console.log("Rarity distribution:");
  console.log(JSON.stringify(summary.rarityTiers, null, 2));
}

main();