import {
  getEnergyClass,
  getFrequencyBand,
  getRarityTier,
  getResonanceType,
  materials,
} from "./traits";
import { getColorway, upgradeRarityByColorMode } from "./colorways";

export type CymaticsMetadata = {
  name: string;
  description: string;
  seed: number;
  frequency: number;
  modeN: number;
  modeM: number;
  frequencyBand: string;
  resonanceType: string;
  symmetryScore: number;
  symmetryType: string;
  nodeDensity: number;
  nodeArchitecture: string;
  complexityScore: number;
  resonanceStrength: number;
  energyClass: string;
  palette: string;
  colorway: string;
  colorVariant: string;
  colorMutation: string;
  waveDistortion: string;
  harmonicLayerCount: number;
  presetId: string;
  plateMaterial: string;
  waveFamily: string;
  rarityTier: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
};

type MetadataInput = {
  seed: number;
  frequency: number;
  n: number;
  m: number;
  nodeDensity: number;
  symmetryScore: number;
  complexityScore: number;
  resonanceStrength: number;
  presetId: string;
};

function getWaveDistortion(seed: number, presetId: string, n: number, m: number): string {
  const diff = Math.abs(Math.round(n) - Math.round(m));
  const hash = (seed ^ (presetId.length * 2654435761)) >>> 0;
  const roll = hash % 5;

  if (presetId === "fractured-harmonic") {
    return ["Angular Warp", "Fracture Shear", "Chaotic Twist", "Glitch Drift", "Interference Bend"][roll];
  }

  if (presetId === "sacred-mesh") {
    return ["Minimal Warp", "Mirror Tension", "Temple Stretch", "Soft Twist", "Axial Drift"][roll];
  }

  if (presetId === "bass-bloom") {
    return ["Soft Drift", "Petal Warp", "Radial Drift", "Bloom Stretch", "Low Wave Curl"][roll];
  }

  if (diff <= 2) return ["Minimal Warp", "Soft Twist", "Mirror Drift", "Low Tension", "Axial Stretch"][roll];
  if (diff <= 8) return ["Balanced Warp", "Harmonic Bend", "Soft Shear", "Angular Drift", "Wave Tilt"][roll];
  return ["Sheared Flux", "Twisted Grid", "Interference Warp", "Phase Drift", "Skewed Resonance"][roll];
}

function getSymmetryType(symmetryScore: number, n: number, m: number, presetId: string): string {
  const diff = Math.abs(Math.round(n) - Math.round(m));

  if (presetId === "sacred-mesh" && symmetryScore > 84) return "Mandala Symmetry";
  if (presetId === "bass-bloom" && diff <= 4) return "Radial Symmetry";
  if (symmetryScore > 90 && diff <= 2) return "Mirror Symmetry";
  if (symmetryScore > 82 && diff <= 6) return "Near-Bilateral";
  if (symmetryScore > 70) return "Axial Symmetry";
  if (presetId === "fractured-harmonic") return "Broken Symmetry";
  return "Asymmetric";
}

function getNodeArchitecture(nodeDensity: number, complexityScore: number, presetId: string): string {
  if (presetId === "sacred-mesh") return nodeDensity > 0.1 ? "Temple Mesh" : "Mandala Lattice";
  if (presetId === "bass-bloom") return nodeDensity > 0.08 ? "Orbital Bloom" : "Petal Cluster";
  if (presetId === "fractured-harmonic") return complexityScore > 78 ? "Fracture Web" : "Scar Lattice";
  if (presetId === "void-resonance") return nodeDensity > 0.09 ? "Void Grid" : "Ghost Net";
  if (presetId === "solar-lattice") return complexityScore > 76 ? "Radiant Lattice" : "Solar Grid";
  return nodeDensity > 0.09 ? "Dense Crossmesh" : "Resonant Grid";
}

function getHarmonicLayerCount(seed: number, presetId: string, complexityScore: number): number {
  let base = 3;
  if (presetId === "fractured-harmonic") base = 5;
  else if (presetId === "sacred-mesh") base = 4;
  else if (presetId === "void-resonance") base = 4;
  else if (presetId === "solar-lattice") base = 4;

  if (complexityScore > 82) base += 1;
  if (((seed >>> 3) + presetId.length) % 7 === 0) base += 1;

  return Math.max(3, Math.min(6, base));
}

export function createMetadata(input: MetadataInput): CymaticsMetadata {
  const colorway = getColorway(input.seed, input.presetId);
  const plateMaterial = materials[input.seed % materials.length];
  const resonanceType = getResonanceType(input.n, input.m, input.nodeDensity);
  const energyClass = getEnergyClass(input.resonanceStrength);

  const baseRarityTier = getRarityTier(
    input.complexityScore,
    input.symmetryScore,
    input.nodeDensity
  );

  const rarityTier = upgradeRarityByColorMode(baseRarityTier, colorway.mode);
  const roundedFrequency = Math.round(input.frequency);
  const symmetryType = getSymmetryType(input.symmetryScore, input.n, input.m, input.presetId);
  const nodeArchitecture = getNodeArchitecture(input.nodeDensity, input.complexityScore, input.presetId);
  const waveDistortion = getWaveDistortion(input.seed, input.presetId, input.n, input.m);
  const harmonicLayerCount = getHarmonicLayerCount(input.seed, input.presetId, input.complexityScore);

  const metadata: CymaticsMetadata = {
    name: `Cymatica #${input.seed}`,
    description:
      "A deterministic Chladni resonance pattern generated from a simulated vibrating square plate.",
    seed: input.seed,
    frequency: roundedFrequency,
    modeN: Math.round(input.n),
    modeM: Math.round(input.m),
    frequencyBand: getFrequencyBand(input.frequency),
    resonanceType,
    symmetryScore: Math.round(input.symmetryScore),
    symmetryType,
    nodeDensity: Number(input.nodeDensity.toFixed(3)),
    nodeArchitecture,
    complexityScore: Math.round(input.complexityScore),
    resonanceStrength: Number(input.resonanceStrength.toFixed(3)),
    energyClass,
    palette: colorway.name,
    colorway: colorway.name,
    colorVariant: colorway.variant,
    colorMutation: colorway.mode,
    waveDistortion,
    harmonicLayerCount,
    presetId: input.presetId,
    plateMaterial,
    waveFamily: "Chladni Harmonic",
    rarityTier,
    attributes: [],
  };

  metadata.attributes = [
    { trait_type: "Frequency", value: `${roundedFrequency} Hz` },
    { trait_type: "Mode N", value: metadata.modeN },
    { trait_type: "Mode M", value: metadata.modeM },
    { trait_type: "Frequency Band", value: metadata.frequencyBand },
    { trait_type: "Resonance Type", value: metadata.resonanceType },
    { trait_type: "Preset", value: metadata.presetId },
    { trait_type: "Colorway", value: metadata.colorway },
    { trait_type: "Color Variant", value: metadata.colorVariant },
    { trait_type: "Color Mutation", value: metadata.colorMutation },
    { trait_type: "Wave Distortion", value: metadata.waveDistortion },
    { trait_type: "Symmetry Type", value: metadata.symmetryType },
    { trait_type: "Node Architecture", value: metadata.nodeArchitecture },
    { trait_type: "Harmonic Layer Count", value: metadata.harmonicLayerCount },
    { trait_type: "Symmetry Score", value: metadata.symmetryScore },
    { trait_type: "Node Density", value: metadata.nodeDensity },
    { trait_type: "Complexity Score", value: metadata.complexityScore },
    { trait_type: "Resonance Strength", value: metadata.resonanceStrength },
    { trait_type: "Energy Class", value: metadata.energyClass },
    { trait_type: "Plate Material", value: metadata.plateMaterial },
    { trait_type: "Wave Family", value: metadata.waveFamily },
    { trait_type: "Rarity Tier", value: metadata.rarityTier },
  ];

  return metadata;
}

