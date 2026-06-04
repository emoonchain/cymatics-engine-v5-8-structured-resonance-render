#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function readArgs(argv) {
  const args = {
    metadataDir: "reso/metadata",
    imageCid: "",
    imageExt: "svg",
    imagePrefix: "",
    imageBase: "",
    animationCid: "",
    animationExt: "mp4",
    animationPrefix: "",
    animationBase: "",
    externalUrlBase: "",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--metadata-dir") args.metadataDir = next, i++;
    else if (arg === "--image-cid") args.imageCid = next, i++;
    else if (arg === "--image-ext") args.imageExt = next.replace(/^\./, ""), i++;
    else if (arg === "--image-prefix") args.imagePrefix = next, i++;
    else if (arg === "--image-base") args.imageBase = normalizeIpfsBase(next), i++;
    else if (arg === "--animation-cid") args.animationCid = next, i++;
    else if (arg === "--animation-ext") args.animationExt = next.replace(/^\./, ""), i++;
    else if (arg === "--animation-prefix") args.animationPrefix = next, i++;
    else if (arg === "--animation-base") args.animationBase = normalizeIpfsBase(next), i++;
    else if (arg === "--external-url-base") args.externalUrlBase = next.replace(/\/$/, ""), i++;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") printHelpAndExit();
    else {
      console.error(`Unknown argument: ${arg}`);
      printHelpAndExit(1);
    }
  }

  if (!args.imageBase && args.imageCid) args.imageBase = normalizeIpfsBase(`ipfs://${args.imageCid}`);
  if (!args.animationBase && args.animationCid) args.animationBase = normalizeIpfsBase(`ipfs://${args.animationCid}`);

  if (!args.imageBase && !args.animationBase && !args.externalUrlBase) {
    console.error("Missing update target. Provide --image-cid, --image-base, --animation-cid, --animation-base, or --external-url-base.");
    printHelpAndExit(1);
  }

  return args;
}

function normalizeIpfsBase(value) {
  if (!value) return "";
  const cleaned = value.trim().replace(/\/$/, "");
  if (cleaned.startsWith("ipfs://")) return cleaned;
  return `ipfs://${cleaned}`;
}

function printHelpAndExit(code = 0) {
  console.log(`
Update generated NFT metadata after uploading images/animations to Filebase/IPFS.

Usage:
  npm run metadata:update-cid -- --image-cid <IMAGE_FOLDER_CID>

Common examples:
  npm run metadata:update-cid -- --image-cid bafy... --image-ext svg
  npm run metadata:update-cid -- --image-cid bafy... --image-ext png
  npm run metadata:update-cid -- --image-base ipfs://bafy.../images --image-ext png
  npm run metadata:update-cid -- --image-cid bafy... --animation-cid bafy... --animation-ext mp4

Options:
  --metadata-dir <dir>        Metadata folder. Default: output/metadata
  --image-cid <cid>           Filebase/IPFS CID for the uploaded image folder
  --image-base <ipfs://...>   Full image base URI. Overrides --image-cid
  --image-ext <ext>           Image extension. Default: svg
  --image-prefix <prefix>     Prefix before token id. Example: token-
  --animation-cid <cid>       Filebase/IPFS CID for uploaded animation folder
  --animation-base <uri>      Full animation base URI. Overrides --animation-cid
  --animation-ext <ext>       Animation extension. Default: mp4
  --animation-prefix <prefix> Prefix before token id for animation files
  --external-url-base <url>   Optional external_url base
  --dry-run                   Preview changes without writing files
`);
  process.exit(code);
}

function tokenIdFromFile(filename) {
  return path.basename(filename, ".json");
}

function buildUri(base, prefix, tokenId, ext) {
  return `${base}/${prefix}${tokenId}.${ext}`;
}

const args = readArgs(process.argv.slice(2));
const metadataDir = path.resolve(process.cwd(), args.metadataDir);

if (!fs.existsSync(metadataDir)) {
  console.error(`Metadata folder not found: ${metadataDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(metadataDir)
  .filter((file) => file.endsWith(".json"))
  .filter((file) => file !== "collection-summary.json")
  .sort((a, b) => Number(tokenIdFromFile(a)) - Number(tokenIdFromFile(b)));

if (files.length === 0) {
  console.error(`No metadata .json files found in: ${metadataDir}`);
  process.exit(1);
}

let updated = 0;
const preview = [];

for (const file of files) {
  const tokenId = tokenIdFromFile(file);
  const fullPath = path.join(metadataDir, file);
  const metadata = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  if (args.imageBase) {
    metadata.image = buildUri(args.imageBase, args.imagePrefix, tokenId, args.imageExt);
  }

  if (args.animationBase) {
    metadata.animation_url = buildUri(args.animationBase, args.animationPrefix, tokenId, args.animationExt);
  }

  if (args.externalUrlBase) {
    metadata.external_url = `${args.externalUrlBase}/${tokenId}`;
  }

  if (preview.length < 3) {
    preview.push({ tokenId, image: metadata.image, animation_url: metadata.animation_url, external_url: metadata.external_url });
  }

  if (!args.dryRun) {
    fs.writeFileSync(fullPath, `${JSON.stringify(metadata, null, 2)}\n`);
  }

  updated++;
}

const summaryPath = path.resolve(process.cwd(), "output/collection-summary.json");
if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  summary.updatedAt = new Date().toISOString();
  if (args.imageBase) summary.imageBase = args.imageBase;
  if (args.animationBase) summary.animationBase = args.animationBase;
  if (args.externalUrlBase) summary.externalUrlBase = args.externalUrlBase;
  if (!args.dryRun) fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
}

console.log(args.dryRun ? "Dry run complete. No files changed." : "Metadata CID update complete.");
console.log(`Metadata folder: ${metadataDir}`);
console.log(`Files processed: ${updated}`);
console.log("Preview:");
console.log(JSON.stringify(preview, null, 2));

if (!args.dryRun) {
  console.log("\nNext step:");
  console.log("1. Upload the updated output/metadata folder to Filebase.");
  console.log("2. Use that metadata folder CID as your NFT contract baseURI.");
  console.log("   Example baseURI: ipfs://<METADATA_FOLDER_CID>/");
}
