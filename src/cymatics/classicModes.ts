export type ClassicFrequencyMode = {
  id: string;
  frequency: number;
  n: number;
  m: number;
  patternName: string;
  family: string;
  radialMix: number;
  threshold: number;
  lineThickness: number;
};

export const classicFrequencyModes: ClassicFrequencyMode[] = [
  { id: "classic-345", frequency: 345, n: 2, m: 3, patternName: "Central Ring Cross", family: "Ring Cross", radialMix: 0.22, threshold: 0.102, lineThickness: 1.28 },
  { id: "classic-1033", frequency: 1033, n: 3, m: 5, patternName: "Corner Wells", family: "Orbital Wells", radialMix: 0.18, threshold: 0.098, lineThickness: 1.18 },
  { id: "classic-1820", frequency: 1820, n: 4, m: 5, patternName: "Branch Lines", family: "Branch Web", radialMix: 0.08, threshold: 0.094, lineThickness: 1.1 },
  { id: "classic-2041", frequency: 2041, n: 4, m: 6, patternName: "Loop Cells", family: "Loop Lattice", radialMix: 0.13, threshold: 0.096, lineThickness: 1.14 },
  { id: "classic-3240", frequency: 3240, n: 5, m: 7, patternName: "Flower Grid", family: "Petal Grid", radialMix: 0.14, threshold: 0.094, lineThickness: 1.08 },
  { id: "classic-3835", frequency: 3835, n: 6, m: 7, patternName: "Bridge Mesh", family: "Bridge Mesh", radialMix: 0.06, threshold: 0.088, lineThickness: 1.04 },
  { id: "classic-3975", frequency: 3975, n: 6, m: 8, patternName: "Symmetric Mesh", family: "Mirror Mesh", radialMix: 0.05, threshold: 0.087, lineThickness: 1.02 },
  { id: "classic-4444", frequency: 4444, n: 7, m: 8, patternName: "Wave Labyrinth", family: "Wave Labyrinth", radialMix: 0.05, threshold: 0.084, lineThickness: 1.0 },
  { id: "classic-4840", frequency: 4840, n: 7, m: 9, patternName: "Diamond Lattice", family: "Diamond Grid", radialMix: 0.04, threshold: 0.083, lineThickness: 0.98 },
  { id: "classic-5201", frequency: 5201, n: 8, m: 9, patternName: "Orbital Ring Mesh", family: "Orbital Mesh", radialMix: 0.12, threshold: 0.082, lineThickness: 0.97 },
  { id: "classic-5284", frequency: 5284, n: 8, m: 10, patternName: "Circle Lattice", family: "Circle Lattice", radialMix: 0.16, threshold: 0.081, lineThickness: 0.96 },
  { id: "classic-5907", frequency: 5907, n: 9, m: 10, patternName: "Dense Resonance Net", family: "Dense Net", radialMix: 0.06, threshold: 0.078, lineThickness: 0.94 },
];

export const classicSandPalette = {
  background: "#000000",
  plate: "#030303",
  sand: ["#fff8ef", "#f4e8cf", "#e5d0ad", "#fffef8"],
  ember: ["#4a140f", "#7c2415", "#b23a1e"],
  label: "#ffffff",
};
