#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

const inputImage =
  process.argv[2] || "output_classic_collection/classic-collection/png/1.png";

const outputImage =
  process.argv[3] || "output_classic_collection/classic-collection/og/resonance-genesis-og.png";

const inputPath = path.resolve(ROOT, inputImage);
const outputPath = path.resolve(ROOT, outputImage);

if (!fs.existsSync(inputPath)) {
  console.error(`Input image not found: ${inputPath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const width = 1200;
const height = 630;

const resizedBuffer = await sharp(inputPath)
  .resize(520, 520, {
    fit: "cover",
  })
  .png()
  .toBuffer();

const svgOverlay = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#2b1b08"/>
      <stop offset="52%" stop-color="#080604"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#facc15" stop-opacity="0"/>
      <stop offset="50%" stop-color="#facc15" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#facc15" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="930" cy="315" r="250" fill="#facc15" opacity="0.08"/>
  <line x1="80" y1="510" x2="1120" y2="510" stroke="url(#line)" stroke-width="2"/>

  <text x="80" y="150" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="900">
    Resonance Genesis
  </text>

  <text x="80" y="215" fill="#d6b45c" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">
    Chladni Node Miner Artifacts
  </text>

  <text x="80" y="292" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="28">
    Frequency → Pattern → Hashrate
  </text>

  <text x="80" y="340" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="28">
    Stake the pattern. Mine RE native power.
  </text>

  <rect x="80" y="395" width="340" height="58" rx="29" fill="#d6b45c" opacity="0.95"/>
  <text x="250" y="433" text-anchor="middle" fill="#050505" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900">
    1,000 WL SLOTS OPEN
  </text>
</svg>
`;

await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: "#000000",
  },
})
  .composite([
    {
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0,
    },
    {
      input: resizedBuffer,
      top: 55,
      left: 620,
    },
  ])
  .png()
  .toFile(outputPath);

console.log(`OG image created: ${path.relative(ROOT, outputPath)}`);