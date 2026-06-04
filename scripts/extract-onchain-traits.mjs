#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT_DIR = "reso/metadata";
const DEFAULT_OUTPUT_FILE = "reso/output/onchain-traits.json";

function parseArgs(argv) {
  const options = {
    inputDir: DEFAULT_INPUT_DIR,
    outputFile: DEFAULT_OUTPUT_FILE,
    tokenOffset: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--input" || arg === "-i") {
      options.inputDir = next;
      i += 1;
    } else if (arg === "--output" || arg === "-o") {
      options.outputFile = next;
      i += 1;
    } else if (arg === "--token-offset") {
      options.tokenOffset = Number(next);
      i += 1;
    }
  }

  return options;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read JSON: ${filePath}\n${error.message}`);
  }
}

function getAttributes(metadata) {
  if (Array.isArray(metadata.attributes)) return metadata.attributes;
  if (Array.isArray(metadata.traits)) return metadata.traits;
  return [];
}

function getAttr(metadata, names, fallback = undefined) {
  const attrs = getAttributes(metadata);
  const wanted = names.map((name) => String(name).toLowerCase());

  const found = attrs.find((attr) => {
    const traitType = String(attr?.trait_type ?? attr?.traitType ?? "").toLowerCase();
    return wanted.includes(traitType);
  });

  return found?.value ?? fallback;
}

function parseFrequency(value) {
  const raw = String(value ?? "0");
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function parseMode(metadata) {
  const modeNDirect = getAttr(metadata, ["Mode N", "modeN"], metadata.modeN);
  const modeMDirect = getAttr(metadata, ["Mode M", "modeM"], metadata.modeM);

  if (modeNDirect !== undefined && modeMDirect !== undefined) {
    return {
      modeN: Number(modeNDirect),
      modeM: Number(modeMDirect),
    };
  }

  const modeRaw = String(
    getAttr(metadata, ["Mode"], metadata.mode ?? metadata.modeLabel ?? "0x0")
  );

  const match = modeRaw.match(/(\d+)\s*[x×]\s*(\d+)/i);

  if (!match) {
    return {
      modeN: 0,
      modeM: 0,
    };
  }

  return {
    modeN: Number(match[1]),
    modeM: Number(match[2]),
  };
}

function parseBps(value, options = {}) {
  const { decimalMultiplier = 10_000, directMultiplier = 1 } = options;

  if (value === undefined || value === null || value === "") return 0;

  const raw = String(value).replace(/[^\d.]/g, "");
  const num = Number(raw);

  if (!Number.isFinite(num)) return 0;

  // Kalau metadata berisi 0.092, jadikan 920 bps.
  if (num > 0 && num < 1) {
    return Math.round(num * decimalMultiplier);
  }

  // Kalau metadata berisi 1.02 line thickness, jadikan 102 jika multiplier 100.
  return Math.round(num * directMultiplier);
}

function rarityToNumber(value) {
  const rarity = String(value ?? "Common").toLowerCase();

  if (rarity.includes("mythic")) return 5;
  if (rarity.includes("legendary")) return 4;
  if (rarity.includes("epic")) return 3;
  if (rarity.includes("rare")) return 2;
  if (rarity.includes("uncommon")) return 1;

  return 0; // Common
}

function sortJsonFiles(files) {
  return files.sort((a, b) => {
    const aNum = Number.parseInt(path.basename(a, ".json"), 10);
    const bNum = Number.parseInt(path.basename(b, ".json"), 10);

    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return aNum - bNum;
    }

    return a.localeCompare(b);
  });
}

function tokenIdFromFile(fileName, tokenOffset) {
  const base = path.basename(fileName, ".json");
  const direct = Number.parseInt(base, 10);

  if (Number.isFinite(direct)) {
    return direct + tokenOffset;
  }

  const match = base.match(/\d+/);
  return match ? Number(match[0]) + tokenOffset : 0;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  const inputDir = path.resolve(process.cwd(), options.inputDir);
  const outputFile = path.resolve(process.cwd(), options.outputFile);

  if (!fs.existsSync(inputDir)) {
    console.error(`Metadata folder not found: ${inputDir}`);
    process.exit(1);
  }

  const files = sortJsonFiles(
    fs
      .readdirSync(inputDir)
      .filter((file) => file.toLowerCase().endsWith(".json"))
  );

  if (files.length === 0) {
    console.error(`No metadata .json files found in: ${inputDir}`);
    process.exit(1);
  }

  const tokenIds = [];
  const traits = [];
  const skipped = [];

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const metadata = readJson(filePath);

    const tokenId =
      Number(metadata.tokenId ?? metadata.token_id ?? 0) ||
      tokenIdFromFile(file, options.tokenOffset);

    const frequency = parseFrequency(
      getAttr(metadata, ["Frequency"], metadata.frequency)
    );

    const { modeN, modeM } = parseMode(metadata);

    const nodeDensityBps = parseBps(
      getAttr(
        metadata,
        ["Node Density", "NodeDensity", "nodeDensityBps"],
        metadata.nodeDensityBps ?? metadata.nodeDensity
      ),
      {
        decimalMultiplier: 10_000,
        directMultiplier: 1,
      }
    );

    const lineThicknessBps = parseBps(
      getAttr(
        metadata,
        ["Line Thickness", "LineThickness", "lineThicknessBps"],
        metadata.lineThicknessBps ?? metadata.lineThickness
      ),
      {
        decimalMultiplier: 10_000,
        directMultiplier: 100,
      }
    );

    const rarityTier = rarityToNumber(
      getAttr(
        metadata,
        ["Rarity Tier", "Rarity", "rarityTier"],
        metadata.rarityTier ?? metadata.rarity
      )
    );

    const isValid =
      tokenId > 0 &&
      frequency > 0 &&
      modeN > 0 &&
      modeM > 0;

    if (!isValid) {
      skipped.push({
        file,
        reason: "missing tokenId/frequency/modeN/modeM",
        tokenId,
        frequency,
        modeN,
        modeM,
      });
      continue;
    }

    tokenIds.push(tokenId);

    traits.push({
      frequency,
      modeN,
      modeM,
      nodeDensityBps,
      lineThicknessBps,
      rarityTier,
      initialized: true,
    });
  }

  ensureParentDir(outputFile);

  fs.writeFileSync(
    outputFile,
    `${JSON.stringify({ tokenIds, traits }, null, 2)}\n`,
    "utf8"
  );

  console.log(`Extracted ${tokenIds.length} on-chain traits.`);
  console.log(`Input : ${path.relative(process.cwd(), inputDir)}`);
  console.log(`Output: ${path.relative(process.cwd(), outputFile)}`);

  if (skipped.length > 0) {
    const skippedPath = outputFile.replace(/\.json$/i, ".skipped.json");

    fs.writeFileSync(
      skippedPath,
      `${JSON.stringify(skipped, null, 2)}\n`,
      "utf8"
    );

    console.warn(`Skipped ${skipped.length} invalid metadata files.`);
    console.warn(`Skipped report: ${path.relative(process.cwd(), skippedPath)}`);
  }
}

main();