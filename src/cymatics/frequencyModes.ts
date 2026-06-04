export type DetailFrequencyMode = { min: number; max: number; n: number; m: number; label: string };
export const DETAIL_MIN_FREQUENCY = 80;
export const DETAIL_MAX_FREQUENCY = 1200;
export const detailFrequencyModes: DetailFrequencyMode[] = [
  { min: 80, max: 150, n: 2, m: 3, label: "Low Ring" },
  { min: 151, max: 240, n: 3, m: 4, label: "Cross Bloom" },
  { min: 241, max: 340, n: 4, m: 5, label: "Soft Flower" },
  { min: 341, max: 460, n: 4, m: 6, label: "Loop Cells" },
  { min: 461, max: 620, n: 5, m: 6, label: "Petal Grid" },
  { min: 621, max: 780, n: 5, m: 7, label: "Orbital Mesh" },
  { min: 781, max: 960, n: 6, m: 8, label: "Diamond Mesh" },
  { min: 961, max: 1200, n: 7, m: 9, label: "Dense Lattice" },
];
export function clampDetailFrequency(frequency: number): number {
  if (!Number.isFinite(frequency)) return 528;
  return Math.max(DETAIL_MIN_FREQUENCY, Math.min(DETAIL_MAX_FREQUENCY, frequency));
}
export function frequencyToDetailMode(frequency: number): { n: number; m: number; label: string } {
  const clamped = clampDetailFrequency(frequency);
  const selected = detailFrequencyModes.find((mode) => clamped >= mode.min && clamped <= mode.max) ?? detailFrequencyModes[detailFrequencyModes.length - 1];
  return { n: selected.n, m: selected.m, label: selected.label };
}
export function seedModeOffset(seed: number, frequency: number): { dn: number; dm: number } {
  const h = (seed ^ Math.round(frequency * 2654435761)) >>> 0;
  const dn = h % 3 === 0 ? 1 : h % 5 === 0 ? -1 : 0;
  const dm = h % 4 === 0 ? 1 : h % 7 === 0 ? -1 : 0;
  return { dn, dm };
}
export function frequencyToReadableModes(frequency: number, seed = 0): { n: number; m: number; label: string } {
  const base = frequencyToDetailMode(frequency);
  const offset = seedModeOffset(seed, frequency);
  return { n: Math.max(2, Math.min(8, base.n + offset.dn)), m: Math.max(3, Math.min(10, base.m + offset.dm)), label: base.label };
}
