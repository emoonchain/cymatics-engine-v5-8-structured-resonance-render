import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { CymaticsCanvas } from "./components/CymaticsCanvas";
import { CymaticsControls } from "./components/CymaticsControls";
import {
  createRuntimeAnimationSettings,
  defaultAnimationPreset,
  getAnimationPreset,
  type AnimationRuntimeSettings,
} from "./cymatics/animationPresets";
import type { CymaticsMetadata } from "./cymatics/metadata";
import { hashStringToSeed } from "./cymatics/math";
import { cymaticsPresets, type CymaticsPreset } from "./cymatics/presets";
import "./style.css";

type BootConfig = {
  seedText: string;
  seed: number;
  preset: CymaticsPreset;
  frequency: number;
  animation: AnimationRuntimeSettings;
};

function clampFrequency(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(20_000, Math.max(20, value));
}

function parseBooleanParam(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function readBootConfig(): BootConfig {
  const params = new URLSearchParams(window.location.search);
  const defaultPreset = cymaticsPresets[0];
  const preset = cymaticsPresets.find((item) => item.id === params.get("preset")) ?? defaultPreset;
  const seedText = params.get("seedText") ?? "cymatica-genesis-001";
  const seedParam = Number(params.get("seed"));
  const seed = Number.isFinite(seedParam) ? seedParam : hashStringToSeed(seedText);
  const frequency = clampFrequency(Number(params.get("frequency")), preset.frequency);

  const animationPreset = getAnimationPreset(params.get("animationPreset") ?? defaultAnimationPreset.id);
  const animation = createRuntimeAnimationSettings(animationPreset);

  animation.enabled = parseBooleanParam(params.get("animationEnabled"), animation.enabled);
  animation.playing = parseBooleanParam(params.get("animationPlaying"), animation.playing);
  animation.fromFrequency = clampFrequency(Number(params.get("fromFrequency")), animation.fromFrequency);
  animation.toFrequency = clampFrequency(Number(params.get("toFrequency")), animation.toFrequency);
  animation.durationSec = Math.max(2, Number(params.get("durationSec")) || animation.durationSec);
  animation.fps = Math.max(12, Math.min(60, Number(params.get("fps")) || animation.fps));
  animation.easing = (params.get("easing") as AnimationRuntimeSettings["easing"]) ?? animation.easing;
  animation.loopType = (params.get("loopType") as AnimationRuntimeSettings["loopType"]) ?? animation.loopType;
  animation.cameraBreathing = parseBooleanParam(params.get("cameraBreathing"), animation.cameraBreathing);
  animation.paletteShift = parseBooleanParam(params.get("paletteShift"), animation.paletteShift);
  animation.particlePulse = parseBooleanParam(params.get("particlePulse"), animation.particlePulse);
  animation.exportFormat = (params.get("exportFormat") as AnimationRuntimeSettings["exportFormat"]) ?? animation.exportFormat;

  return { seedText, seed, preset, frequency, animation };
}

function App() {
  const boot = useMemo(readBootConfig, []);
  const [seedText, setSeedText] = useState(boot.seedText);
  const [seed, setSeed] = useState(boot.seed);
  const [preset, setPreset] = useState<CymaticsPreset>(boot.preset);
  const [frequency, setFrequency] = useState(boot.frequency);
  const [runtimeFrequency, setRuntimeFrequency] = useState(boot.frequency);
  const [metadata, setMetadata] = useState<CymaticsMetadata | null>(null);
  const [animation, setAnimation] = useState<AnimationRuntimeSettings>(boot.animation);

  useEffect(() => {
    const globalRef = globalThis as typeof globalThis & Record<string, unknown>;
    globalRef.__CYMATICS_RENDER_READY__ = true;
    globalRef.__CYMATICS_CURRENT_METADATA__ = metadata;
  }, [metadata]);

  return (
    <main>
      <section className="stage">
        <CymaticsCanvas
          seed={seed}
          frequency={frequency}
          preset={preset}
          particleCount={45_000}
          animation={animation}
          onMetadata={setMetadata}
          onRuntimeFrequencyChange={setRuntimeFrequency}
        />
      </section>
      <CymaticsControls
        seedText={seedText}
        frequency={runtimeFrequency}
        baseFrequency={frequency}
        presetId={preset.id}
        metadata={metadata}
        animation={animation}
        onSeedChange={(text, nextSeed) => {
          setSeedText(text);
          setSeed(nextSeed);
        }}
        onPresetChange={(nextPreset) => {
          setPreset(nextPreset);
          setFrequency(nextPreset.frequency);
          setRuntimeFrequency(nextPreset.frequency);
        }}
        onFrequencyChange={(nextFrequency) => {
          setFrequency(nextFrequency);
          if (!animation.enabled) setRuntimeFrequency(nextFrequency);
        }}
        onAnimationChange={(patch) => {
          setAnimation((previous) => {
            if (patch.presetId) {
              const nextPreset = getAnimationPreset(String(patch.presetId));
              return { ...previous, ...nextPreset, ...patch };
            }
            return { ...previous, ...patch };
          });
        }}
      />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
