import fs from "node:fs";
import path from "node:path";

const metadataDir = path.resolve("output/metadata");

function getAttribute(item, name) {
  const attr = item.attributes?.find((entry) => entry.trait_type === name);
  return attr?.value;
}

function inc(target, key) {
  const safeKey = key === undefined || key === null || key === "" ? "Unknown" : String(key);
  target[safeKey] = (target[safeKey] ?? 0) + 1;
}

if (!fs.existsSync(metadataDir)) {
  console.error("Missing output/metadata. Generate collection first.");
  process.exit(1);
}

const files = fs
  .readdirSync(metadataDir)
  .filter((file) => file.endsWith(".json"))
  .sort((a, b) => Number.parseInt(a) - Number.parseInt(b));

const colorways = {};
const colorVariants = {};
const mutations = {};
const rarities = {};
const presets = {};
const patternFamilies = {};
const waveDistortions = {};
const symmetryTypes = {};
const nodeArchitectures = {};
const harmonicLayerCounts = {};

for (const file of files) {
  const item = JSON.parse(fs.readFileSync(path.join(metadataDir, file), "utf8"));

  inc(presets, item.presetId ?? item.properties?.preset_id ?? getAttribute(item, "Preset") ?? getAttribute(item, "Resonance Preset"));
  inc(colorways, item.colorway ?? item.palette ?? getAttribute(item, "Colorway") ?? getAttribute(item, "Palette"));
  inc(colorVariants, item.colorVariant ?? item.properties?.color_variant ?? getAttribute(item, "Color Variant"));
  inc(mutations, item.colorMutation ?? item.properties?.color_mutation ?? getAttribute(item, "Color Mutation"));
  inc(rarities, item.rarityTier ?? getAttribute(item, "Rarity Tier") ?? getAttribute(item, "Rarity"));
  inc(patternFamilies, item.patternFamily ?? item.properties?.pattern_family ?? getAttribute(item, "Pattern Family"));
  inc(waveDistortions, item.waveDistortion ?? item.properties?.wave_distortion ?? getAttribute(item, "Wave Distortion"));
  inc(symmetryTypes, item.symmetryType ?? item.properties?.symmetry_type ?? getAttribute(item, "Symmetry Type"));
  inc(nodeArchitectures, item.nodeArchitecture ?? item.properties?.node_architecture ?? getAttribute(item, "Node Architecture"));
  inc(harmonicLayerCounts, item.harmonicLayerCount ?? item.properties?.harmonic_layer_count ?? getAttribute(item, "Harmonic Layer Count"));
}

const summary = {
  total: files.length,
  presets,
  colorways,
  colorVariants,
  colorMutations: mutations,
  patternFamilies,
  waveDistortions,
  symmetryTypes,
  nodeArchitectures,
  harmonicLayerCounts,
  rarityTiers: rarities,
};

fs.writeFileSync("output/colorway-summary.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log("\nSaved output/colorway-summary.json");
