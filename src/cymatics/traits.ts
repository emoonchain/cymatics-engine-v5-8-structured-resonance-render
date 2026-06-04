export type RarityTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type EnergyClass = "Low" | "Stable" | "Bright" | "Peak";

export function getFrequencyBand(freq: number): string {
  if (freq < 60) return "Sub Bass";
  if (freq < 250) return "Bass";
  if (freq < 500) return "Low Mid";
  if (freq < 2000) return "Mid";
  if (freq < 6000) return "High Mid";
  if (freq < 12000) return "Presence";
  return "Ultrasonic";
}

export function getResonanceType(n: number, m: number, nodeDensity: number): string {
  const diff = Math.abs(n - m);
  if (nodeDensity > 0.82) return "Dense Resonance Grid";
  if (diff <= 1 && n + m > 20) return "Sacred Mesh";
  if (diff <= 2) return "Flower Resonance";
  if ((n + m) % 4 === 0) return "Orbital Rings";
  if (n % 2 === 0 && m % 2 === 0) return "Lattice Grid";
  return "Fractured Harmonic";
}

export function getEnergyClass(strength: number): EnergyClass {
  if (strength > 0.82) return "Peak";
  if (strength > 0.62) return "Bright";
  if (strength > 0.38) return "Stable";
  return "Low";
}

export function getRarityTier(complexity: number, symmetry: number, nodeDensity: number): RarityTier {
  const score = complexity * 0.45 + symmetry * 0.3 + nodeDensity * 100 * 0.25;
  if (score > 88) return "Legendary";
  if (score > 76) return "Epic";
  if (score > 60) return "Rare";
  if (score > 42) return "Uncommon";
  return "Common";
}

export const palettes = [
  "White Sand",
  "Ember Gold",
  "Solar Red",
  "Blue Plasma",
  "Void Chrome",
  "Radioactive Green",
  "Aurora Dust",
  "Molten Pearl"
] as const;

export const materials = [
  "Iron",
  "Bronze",
  "Silver",
  "Titanium",
  "Obsidian",
  "Aether Glass",
  "Resonant Ceramic"
] as const;
