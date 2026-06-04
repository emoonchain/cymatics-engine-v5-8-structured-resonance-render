#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    inputDir: "output_classic_collection/classic-collection/metadata",
    outputFile: "output_classic_collection/classic-collection/metadata-import.csv",
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

function csvEscape(value) {
  if (value === undefined || value === null) return "";

  const str = String(value);

  if (/[",\n\r]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

function normalizeTraitName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getAttributeValue(attributes, names) {
  if (!Array.isArray(attributes)) return "";

  const wanted = names.map((name) => name.toLowerCase());

  const found = attributes.find((attr) => {
    const traitType = String(attr?.trait_type || "").toLowerCase();
    return wanted.includes(traitType);
  });

  return found?.value ?? "";
}

function attributesToTraitMap(attributes) {
  const map = {};

  if (!Array.isArray(attributes)) {
    return map;
  }

  for (const attr of attributes) {
    if (!attr || attr.trait_type === undefined) continue;

    const traitName = normalizeTraitName(attr.trait_type);
    if (!traitName) continue;

    // rarityTier punya kolom khusus, jadi jangan dibuat trait:Rarity Tier
    if (traitName.toLowerCase() === "rarity tier") continue;

    map[traitName] = attr.value ?? "";
  }

  return map;
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

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  const inputDir = path.resolve(process.cwd(), options.inputDir);
  const outputFile = path.resolve(process.cwd(), options.outputFile);

  if (!fs.existsSync(inputDir)) {
    console.error(`Input metadata folder not found: ${inputDir}`);
    process.exit(1);
  }

  const files = sortJsonFiles(
    fs
      .readdirSync(inputDir)
      .filter((file) => file.toLowerCase().endsWith(".json"))
  );

  if (files.length === 0) {
    console.error(`No .json metadata files found in: ${inputDir}`);
    process.exit(1);
  }

  const rows = [];
  const traitNames = new Set();

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const metadata = readJson(filePath);
    const attributes = metadata.attributes ?? metadata.traits ?? [];

    const traitMap = attributesToTraitMap(attributes);

    for (const traitName of Object.keys(traitMap)) {
      traitNames.add(traitName);
    }

    const rarityTier =
      metadata.rarityTier ??
      metadata.rarity ??
      getAttributeValue(attributes, ["Rarity Tier", "Rarity"]) ??
      "";

    rows.push({
      tokenId: Number.parseInt(path.basename(file, ".json"), 10),
      name: metadata.name ?? "",
      description: metadata.description ?? "",
      image: metadata.image ?? "",
      animation_url: metadata.animation_url ?? metadata.animationUrl ?? "",
      external_url: metadata.external_url ?? metadata.externalUrl ?? "",
      rarityTier,
      traits: traitMap,
    });
  }

  const sortedTraitNames = [...traitNames].sort((a, b) => a.localeCompare(b));

  const headers = [
    "name",
    "description",
    "image",
    "animation_url",
    "external_url",
    "rarityTier",
    ...sortedTraitNames.map((traitName) => `trait:${traitName}`),
  ];

  const lines = [];
  lines.push(headers.map(csvEscape).join(","));

  for (const row of rows) {
    const values = [
      row.name,
      row.description,
      row.image,
      row.animation_url,
      row.external_url,
      row.rarityTier,
      ...sortedTraitNames.map((traitName) => row.traits[traitName] ?? ""),
    ];

    lines.push(values.map(csvEscape).join(","));
  }

  ensureParentDir(outputFile);
  fs.writeFileSync(outputFile, `${lines.join("\n")}\n`, "utf8");

  console.log(`Converted ${rows.length} metadata JSON files to CSV.`);
  console.log(`Input : ${path.relative(process.cwd(), inputDir)}`);
  console.log(`Output: ${path.relative(process.cwd(), outputFile)}`);
  console.log(`Traits: ${sortedTraitNames.length}`);
}

main();