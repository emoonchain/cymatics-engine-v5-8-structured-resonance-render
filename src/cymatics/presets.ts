export type CymaticsPreset = {
  id: string;
  name: string;
  description: string;
  frequency: number;
  particleSize: number;
  cameraZoom: number;
  palette: "ember" | "plasma" | "void" | "solar" | "aether" | "ice";
  physics: {
    chladniWeight: number;
    standingWaveWeight: number;
    harmonicWeight: number;
    attractionStrength: number;
    damping: number;
    vibrationStrength: number;
  };
};

export const cymaticsPresets: CymaticsPreset[] = [
  {
    id: "genesis-pulse",
    name: "Genesis Pulse",
    description: "Balanced node formation with warm living motion.",
    frequency: 528,
    particleSize: 0.04,
    cameraZoom: 6.5,
    palette: "ember",
    physics: {
      chladniWeight: 0.86,
      standingWaveWeight: 0.10,
      harmonicWeight: 0.04,
      attractionStrength: 0.030,
      damping: 0.994,
      vibrationStrength: 0.010,
    },
  },
  {
    id: "solar-lattice",
    name: "Solar Lattice",
    description: "Readable geometric lattices with bright high-energy peaks.",
    frequency: 963,
    particleSize: 0.035,
    cameraZoom: 6.8,
    palette: "solar",
    physics: {
      chladniWeight: 0.87,
      standingWaveWeight: 0.09,
      harmonicWeight: 0.04,
      attractionStrength: 0.031,
      damping: 0.994,
      vibrationStrength: 0.009,
    },
  },
  {
    id: "fractured-harmonic",
    name: "Fractured Harmonic",
    description: "Controlled interference with scarred but still readable bands.",
    frequency: 744,
    particleSize: 0.038,
    cameraZoom: 6.6,
    palette: "plasma",
    physics: {
      chladniWeight: 0.84,
      standingWaveWeight: 0.10,
      harmonicWeight: 0.06,
      attractionStrength: 0.028,
      damping: 0.993,
      vibrationStrength: 0.011,
    },
  },
  {
    id: "sacred-mesh",
    name: "Sacred Mesh",
    description: "Symmetric dense mesh for rare-looking structured resonance pieces.",
    frequency: 888,
    particleSize: 0.031,
    cameraZoom: 7.0,
    palette: "aether",
    physics: {
      chladniWeight: 0.89,
      standingWaveWeight: 0.08,
      harmonicWeight: 0.03,
      attractionStrength: 0.032,
      damping: 0.995,
      vibrationStrength: 0.008,
    },
  },
  {
    id: "bass-bloom",
    name: "Bass Bloom",
    description: "Low-frequency bloom with thicker arcs and softer breathing motion.",
    frequency: 160,
    particleSize: 0.054,
    cameraZoom: 6.2,
    palette: "ice",
    physics: {
      chladniWeight: 0.82,
      standingWaveWeight: 0.13,
      harmonicWeight: 0.05,
      attractionStrength: 0.034,
      damping: 0.996,
      vibrationStrength: 0.007,
    },
  },
  {
    id: "void-resonance",
    name: "Void Resonance",
    description: "Dark structured field with subtle ember and opal sparks.",
    frequency: 432,
    particleSize: 0.029,
    cameraZoom: 7.2,
    palette: "void",
    physics: {
      chladniWeight: 0.86,
      standingWaveWeight: 0.10,
      harmonicWeight: 0.04,
      attractionStrength: 0.029,
      damping: 0.994,
      vibrationStrength: 0.009,
    },
  },
];

export function getPresetById(id: string): CymaticsPreset {
  return cymaticsPresets.find((preset) => preset.id === id) ?? cymaticsPresets[0];
}
