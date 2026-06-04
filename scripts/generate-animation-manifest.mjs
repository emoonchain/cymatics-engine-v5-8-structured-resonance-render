#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const metadataDir = path.resolve(process.cwd(), "output/metadata");
const outputDir = path.resolve(process.cwd(), "output");
const outputPath = path.join(outputDir, "animation-manifest.json");

function getAttribute(item, name) {
  return item.attributes?.find((entry) => entry.trait_type === name)?.value;
}

function chooseAnimationPreset(item) {
  const rarity = String(item.rarityTier ?? getAttribute(item, "Rarity Tier") ?? "Common");
  const presetId = String(item.presetId ?? getAttribute(item, "Preset") ?? "genesis-pulse");
  const frequency = Number(item.frequency ?? 0);

  if (rarity === "Mythic" || rarity === "Legendary") {
    return {
      enabled: true,
      presetId: "cinematic-fall",
      fromFrequency: Math.max(20, frequency || 10639),
      toFrequency: Math.max(20, Math.round((frequency || 10639) * 0.18)),
      durationSec: 8,
      fps: 30,
      easing: "easeInOutSine",
      loopType: "ping-pong",
      cameraBreathing: true,
      paletteShift: true,
      particlePulse: true,
    };
  }

  if (rarity === "Epic" || presetId === "fractured-harmonic" || presetId === "void-resonance") {
    return {
      enabled: true,
      presetId: "ascension-rise",
      fromFrequency: Math.max(20, Math.round((frequency || 1906) * 0.42)),
      toFrequency: Math.max(20, frequency || 10639),
      durationSec: 8,
      fps: 30,
      easing: "easeInOutCubic",
      loopType: "ping-pong",
      cameraBreathing: true,
      paletteShift: true,
      particlePulse: true,
    };
  }

  if (rarity === "Rare" || presetId === "sacred-mesh" || presetId === "bass-bloom") {
    return {
      enabled: true,
      presetId: "sacred-breath",
      fromFrequency: Math.max(20, Math.round((frequency || 5284) * 0.85)),
      toFrequency: Math.max(20, Math.round((frequency || 6437) * 1.08)),
      durationSec: 6,
      fps: 30,
      easing: "easeInOutSine",
      loopType: "ping-pong",
      cameraBreathing: true,
      paletteShift: false,
      particlePulse: true,
    };
  }

  return {
    enabled: false,
    presetId: "static-only",
    fromFrequency: frequency || 5284,
    toFrequency: frequency || 5284,
    durationSec: 0,
    fps: 0,
    easing: "linear",
    loopType: "restart",
    cameraBreathing: false,
    paletteShift: false,
    particlePulse: false,
  };
}

if (!fs.existsSync(metadataDir)) {
  console.error("Missing output/metadata. Generate the collection first.");
  process.exit(1);
}

const files = fs
  .readdirSync(metadataDir)
  .filter((file) => file.endsWith(".json"))
  .sort((a, b) => Number.parseInt(a) - Number.parseInt(b));

const manifest = files.map((file) => {
  const item = JSON.parse(fs.readFileSync(path.join(metadataDir, file), "utf8"));
  const tokenId = Number.parseInt(path.basename(file, ".json"), 10);

  return {
    tokenId,
    seed: item.seed ?? item.properties?.seed_number ?? null,
    name: item.name ?? `Cymatica #${tokenId}`,
    presetId: String(item.presetId ?? getAttribute(item, "Preset") ?? "genesis-pulse"),
    rarityTier: String(item.rarityTier ?? getAttribute(item, "Rarity Tier") ?? "Common"),
    frequency: Number(item.frequency ?? 5284),
    animation: chooseAnimationPreset(item),
  };
});

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}
`);

console.log(`Saved animation manifest: ${outputPath}`);
console.log(`Items: ${manifest.length}`);
console.log("Preview:");
console.log(JSON.stringify(manifest.slice(0, 3), null, 2));
