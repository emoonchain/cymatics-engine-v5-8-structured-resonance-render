export type AnimationEasing = "linear" | "easeInOutSine" | "easeInOutCubic";
export type AnimationLoopType = "ping-pong" | "restart";

export type AnimationPreset = {
  id: string;
  name: string;
  fromFrequency: number;
  toFrequency: number;
  durationSec: number;
  fps: number;
  easing: AnimationEasing;
  loopType: AnimationLoopType;
  cameraBreathing: boolean;
  paletteShift: boolean;
  particlePulse: boolean;
  description: string;
};

export type AnimationRuntimeSettings = AnimationPreset & {
  enabled: boolean;
  playing: boolean;
  exportFormat: "webm" | "mp4" | "gif";
};

export const animationPresets: AnimationPreset[] = [
  {
    id: "cinematic-fall",
    name: "Cinematic Fall",
    fromFrequency: 963,
    toFrequency: 160,
    durationSec: 8,
    fps: 30,
    easing: "easeInOutSine",
    loopType: "ping-pong",
    cameraBreathing: true,
    paletteShift: true,
    particlePulse: true,
    description: "Dense high-harmonic field melts down into a softer low-frequency bloom."
  },
  {
    id: "ascension-rise",
    name: "Ascension Rise",
    fromFrequency: 160,
    toFrequency: 963,
    durationSec: 8,
    fps: 30,
    easing: "easeInOutCubic",
    loopType: "ping-pong",
    cameraBreathing: true,
    paletteShift: true,
    particlePulse: true,
    description: "Meditative low-frequency plate climbs into a dramatic complex harmonic grid."
  },
  {
    id: "sacred-breath",
    name: "Sacred Breath",
    fromFrequency: 432,
    toFrequency: 744,
    durationSec: 6,
    fps: 30,
    easing: "easeInOutSine",
    loopType: "ping-pong",
    cameraBreathing: true,
    paletteShift: false,
    particlePulse: true,
    description: "Subtle breathing loop with small harmonic morph, good for elegant animated NFTs."
  },
  {
    id: "resonance-orbit",
    name: "Resonance Orbit",
    fromFrequency: 260,
    toFrequency: 1080,
    durationSec: 10,
    fps: 30,
    easing: "easeInOutSine",
    loopType: "restart",
    cameraBreathing: true,
    paletteShift: true,
    particlePulse: true,
    description: "A long-form cinematic sweep through the middle harmonic band."
  }
];

export const defaultAnimationPreset = animationPresets[0];

export function getAnimationPreset(id: string): AnimationPreset {
  return animationPresets.find((preset) => preset.id === id) ?? defaultAnimationPreset;
}

export function createRuntimeAnimationSettings(
  preset: AnimationPreset = defaultAnimationPreset
): AnimationRuntimeSettings {
  return {
    ...preset,
    enabled: false,
    playing: true,
    exportFormat: "webm",
  };
}

export function easeAnimationProgress(t: number, easing: AnimationEasing): number {
  const clamped = Math.max(0, Math.min(1, t));

  switch (easing) {
    case "easeInOutSine":
      return -(Math.cos(Math.PI * clamped) - 1) / 2;
    case "easeInOutCubic":
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    default:
      return clamped;
  }
}

export function getLoopPhase(elapsedSec: number, durationSec: number, loopType: AnimationLoopType): number {
  const safeDuration = Math.max(durationSec, 0.001);
  const raw = (elapsedSec % safeDuration) / safeDuration;

  if (loopType === "restart") return raw;
  return raw < 0.5 ? raw * 2 : 2 - raw * 2;
}

export function getAnimatedFrequency(
  elapsedSec: number,
  settings: Pick<AnimationRuntimeSettings, "fromFrequency" | "toFrequency" | "durationSec" | "easing" | "loopType">
): number {
  const phase = getLoopPhase(elapsedSec, settings.durationSec, settings.loopType);
  const eased = easeAnimationProgress(phase, settings.easing);

  return settings.fromFrequency + (settings.toFrequency - settings.fromFrequency) * eased;
}
