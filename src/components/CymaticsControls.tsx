import {
  animationPresets,
  getAnimationPreset,
  type AnimationRuntimeSettings,
} from "../cymatics/animationPresets";
import { hashStringToSeed } from "../cymatics/math";
import type { CymaticsMetadata } from "../cymatics/metadata";
import { cymaticsPresets, type CymaticsPreset } from "../cymatics/presets";

type Props = {
  seedText: string;
  frequency: number;
  baseFrequency: number;
  presetId: string;
  metadata: CymaticsMetadata | null;
  animation: AnimationRuntimeSettings;
  onSeedChange: (text: string, seed: number) => void;
  onFrequencyChange: (frequency: number) => void;
  onPresetChange: (preset: CymaticsPreset) => void;
  onAnimationChange: (patch: Partial<AnimationRuntimeSettings> & { presetId?: string }) => void;
};

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function captureArtwork(metadata: CymaticsMetadata | null) {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  const link = document.createElement("a");
  const id = metadata?.seed ?? Date.now();
  const frequency = metadata?.frequency ?? "live";

  link.href = canvas.toDataURL("image/png");
  link.download = `cymatica-${id}-${frequency}hz.png`;
  link.click();
}

async function recordAnimationWebM(
  metadata: CymaticsMetadata | null,
  animation: AnimationRuntimeSettings
) {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    alert("Canvas not found.");
    return;
  }

  if (!animation.enabled) {
    alert("Enable animation first, then press Record WebM Loop.");
    return;
  }

  if (typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
    alert("Your browser does not support canvas recording via MediaRecorder.");
    return;
  }

  const stream = canvas.captureStream(animation.fps);
  const chunks: BlobPart[] = [];
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.start();

  await new Promise((resolve) => window.setTimeout(resolve, animation.durationSec * 1000));

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });

  stream.getTracks().forEach((track) => track.stop());

  const blob = new Blob(chunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const id = metadata?.seed ?? Date.now();

  link.href = url;
  link.download = `cymatica-${id}-${animation.id}.webm`;
  link.click();
  URL.revokeObjectURL(url);

  alert(
    "WebM loop exported. Optional next step: run npm run animation:encode -- --input <file.webm> --mp4 <file.mp4> --gif <file.gif>"
  );
}

function exportMetadata(metadata: CymaticsMetadata | null, animation: AnimationRuntimeSettings) {
  if (!metadata) return;

  const attributes = [...metadata.attributes];

  if (animation.enabled) {
    attributes.push(
      { trait_type: "Animation Enabled", value: "Yes" },
      { trait_type: "Animation Mode", value: "Frequency Morph" },
      { trait_type: "Animation Preset", value: animation.name },
      { trait_type: "Frequency Start", value: `${Math.round(animation.fromFrequency)} Hz` },
      { trait_type: "Frequency End", value: `${Math.round(animation.toFrequency)} Hz` },
      { trait_type: "Duration", value: `${animation.durationSec}s` },
      { trait_type: "Loop Type", value: animation.loopType },
      { trait_type: "Camera Motion", value: animation.cameraBreathing ? "Breathing" : "Static" },
      { trait_type: "Palette Shift", value: animation.paletteShift ? "Enabled" : "Disabled" }
    );
  }

  const nftMetadata = {
    name: metadata.name,
    description: metadata.description,
    image: `ipfs://IMAGE_CID/${metadata.seed}.png`,
    animation_url: animation.enabled ? `ipfs://ANIMATION_CID/${metadata.seed}.mp4` : undefined,
    external_url: "https://your-domain.xyz/cymatica",
    attributes,
    cymatics: {
      seed: metadata.seed,
      frequency: metadata.frequency,
      mode: [metadata.modeN, metadata.modeM],
      resonanceStrength: metadata.resonanceStrength,
      nodeDensity: metadata.nodeDensity,
      symmetryScore: metadata.symmetryScore,
      complexityScore: metadata.complexityScore,
      animation: animation.enabled
        ? {
            presetId: animation.id,
            presetName: animation.name,
            fromFrequency: animation.fromFrequency,
            toFrequency: animation.toFrequency,
            durationSec: animation.durationSec,
            fps: animation.fps,
            easing: animation.easing,
            loopType: animation.loopType,
            cameraBreathing: animation.cameraBreathing,
            paletteShift: animation.paletteShift,
            particlePulse: animation.particlePulse,
          }
        : null,
    },
  };

  downloadTextFile(
    `cymatica-${metadata.seed}.json`,
    JSON.stringify(nftMetadata, null, 2),
    "application/json"
  );
}

function exportAnimationConfig(metadata: CymaticsMetadata | null, animation: AnimationRuntimeSettings) {
  const config = {
    token: metadata?.seed ?? null,
    animation: {
      enabled: animation.enabled,
      presetId: animation.id,
      presetName: animation.name,
      fromFrequency: animation.fromFrequency,
      toFrequency: animation.toFrequency,
      durationSec: animation.durationSec,
      fps: animation.fps,
      easing: animation.easing,
      loopType: animation.loopType,
      cameraBreathing: animation.cameraBreathing,
      paletteShift: animation.paletteShift,
      particlePulse: animation.particlePulse,
      exportFormat: animation.exportFormat,
    },
  };

  const id = metadata?.seed ?? "preview";
  downloadTextFile(
    `cymatica-${id}-animation-config.json`,
    JSON.stringify(config, null, 2),
    "application/json"
  );
}

export function CymaticsControls({
  seedText,
  frequency,
  baseFrequency,
  presetId,
  metadata,
  animation,
  onSeedChange,
  onFrequencyChange,
  onPresetChange,
  onAnimationChange,
}: Props) {
  return (
    <aside className="panel">
      <div className="eyebrow">Cymatics Engine</div>
      <h1>Resonance Plate Core</h1>
      <p className="subtitle">
        Deterministic Chladni particle field untuk generative NFT. Sekarang sudah support
        preview frequency morph loop. Detail mode keeps patterns readable instead of turning into particle noise.
      </p>

      <label>
        Seed
        <input
          value={seedText}
          onChange={(event) => onSeedChange(event.target.value, hashStringToSeed(event.target.value || "cymatics"))}
          placeholder="cymatica-genesis"
        />
      </label>

      <label>
        Resonance Preset
        <select
          value={presetId}
          onChange={(event) => {
            const preset = cymaticsPresets.find((item) => item.id === event.target.value);
            if (preset) onPresetChange(preset);
          }}
        >
          {cymaticsPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </label>

      <div className="preset-grid">
        {cymaticsPresets.map((preset) => (
          <button
            key={preset.id}
            className={preset.id === presetId ? "preset-card active" : "preset-card"}
            onClick={() => onPresetChange(preset)}
          >
            <strong>{preset.name}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      <label>
        Detail Frequency: <strong>{Math.round(baseFrequency)} Hz</strong>
        <input
          type="range"
          min={80}
          max={1200}
          step={1}
          value={baseFrequency}
          disabled={animation.enabled}
          onChange={(event) => onFrequencyChange(Number(event.target.value))}
        />
      </label>

      <div className="status-row">
        <div className="status-pill">
          Live Frequency <span>{Math.round(frequency)} Hz</span>
        </div>
        <div className={animation.enabled ? "status-pill active" : "status-pill"}>
          Animation <span>{animation.enabled ? (animation.playing ? "Playing" : "Paused") : "Off"}</span>
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <strong>Animated NFT Loop</strong>
          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={animation.enabled}
              onChange={(event) => onAnimationChange({ enabled: event.target.checked })}
            />
            <span>Enable</span>
          </label>
        </div>

        <label>
          Animation Preset
          <select
            value={animation.id}
            onChange={(event) => {
              const next = getAnimationPreset(event.target.value);
              onAnimationChange({ presetId: next.id, ...next });
            }}
          >
            {animationPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        <p className="tiny-note">{getAnimationPreset(animation.id).description}</p>

        <div className="inline-grid">
          <label>
            Start Hz
            <input
              type="number"
              min={80}
              max={1200}
              value={Math.round(animation.fromFrequency)}
              onChange={(event) => onAnimationChange({ fromFrequency: Number(event.target.value) })}
            />
          </label>
          <label>
            End Hz
            <input
              type="number"
              min={80}
              max={1200}
              value={Math.round(animation.toFrequency)}
              onChange={(event) => onAnimationChange({ toFrequency: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="inline-grid">
          <label>
            Duration (sec)
            <input
              type="number"
              min={2}
              max={20}
              step={0.5}
              value={animation.durationSec}
              onChange={(event) => onAnimationChange({ durationSec: Number(event.target.value) })}
            />
          </label>
          <label>
            FPS
            <input
              type="number"
              min={12}
              max={60}
              step={1}
              value={animation.fps}
              onChange={(event) => onAnimationChange({ fps: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="inline-grid">
          <label>
            Easing
            <select
              value={animation.easing}
              onChange={(event) =>
                onAnimationChange({
                  easing: event.target.value as AnimationRuntimeSettings["easing"],
                })
              }
            >
              <option value="linear">linear</option>
              <option value="easeInOutSine">easeInOutSine</option>
              <option value="easeInOutCubic">easeInOutCubic</option>
            </select>
          </label>

          <label>
            Loop Type
            <select
              value={animation.loopType}
              onChange={(event) =>
                onAnimationChange({
                  loopType: event.target.value as AnimationRuntimeSettings["loopType"],
                })
              }
            >
              <option value="ping-pong">ping-pong</option>
              <option value="restart">restart</option>
            </select>
          </label>
        </div>

        <div className="checkbox-grid">
          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={animation.playing}
              onChange={(event) => onAnimationChange({ playing: event.target.checked })}
            />
            <span>Play Loop</span>
          </label>

          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={animation.cameraBreathing}
              onChange={(event) => onAnimationChange({ cameraBreathing: event.target.checked })}
            />
            <span>Camera Breathing</span>
          </label>

          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={animation.paletteShift}
              onChange={(event) => onAnimationChange({ paletteShift: event.target.checked })}
            />
            <span>Palette Shift</span>
          </label>

          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={animation.particlePulse}
              onChange={(event) => onAnimationChange({ particlePulse: event.target.checked })}
            />
            <span>Particle Pulse</span>
          </label>
        </div>

        <div className="action-row three-up">
          <button className="secondary-action" onClick={() => onAnimationChange({ playing: !animation.playing })}>
            {animation.playing ? "Pause Loop" : "Play Loop"}
          </button>
          <button
            className="secondary-action"
            disabled={!animation.enabled}
            onClick={() => recordAnimationWebM(metadata, animation)}
          >
            Record WebM Loop
          </button>
          <button className="secondary-action" onClick={() => exportAnimationConfig(metadata, animation)}>
            Export Anim JSON
          </button>
        </div>

        <p className="tiny-note">
          Browser export merekam <span className="mono">.webm</span> langsung dari canvas.
          Setelah itu bisa convert ke <span className="mono">.mp4</span> atau <span className="mono">.gif</span> pakai script encode.
        </p>
      </div>

      <div className="action-row">
        <button className="primary-action" onClick={() => captureArtwork(metadata)}>
          Capture PNG
        </button>
        <button className="secondary-action" onClick={() => exportMetadata(metadata, animation)} disabled={!metadata}>
          Export JSON
        </button>
      </div>

      {metadata && (
        <div className="metadata-card">
          <h2>{metadata.name}</h2>
          <div className="rarity">{metadata.rarityTier}</div>
          <dl>
            <div><dt>Type</dt><dd>{metadata.resonanceType}</dd></div>
            <div><dt>Band</dt><dd>{metadata.frequencyBand}</dd></div>
            <div><dt>Mode</dt><dd>{metadata.modeN} × {metadata.modeM}</dd></div>
            <div><dt>Symmetry</dt><dd>{metadata.symmetryScore}</dd></div>
            <div><dt>Complexity</dt><dd>{metadata.complexityScore}</dd></div>
            <div><dt>Density</dt><dd>{metadata.nodeDensity}</dd></div>
            <div><dt>Energy</dt><dd>{metadata.energyClass}</dd></div>
            <div><dt>Palette</dt><dd>{metadata.palette}</dd></div>
            <div><dt>Material</dt><dd>{metadata.plateMaterial}</dd></div>
            {animation.enabled && (
              <>
                <div><dt>Anim Preset</dt><dd>{animation.name}</dd></div>
                <div><dt>Anim Route</dt><dd>{Math.round(animation.fromFrequency)} → {Math.round(animation.toFrequency)} Hz</dd></div>
                <div><dt>Loop</dt><dd>{animation.loopType}</dd></div>
              </>
            )}
          </dl>
        </div>
      )}
    </aside>
  );
}
