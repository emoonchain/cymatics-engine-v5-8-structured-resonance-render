import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CymaticsEngine } from "../cymatics/CymaticsEngine";
import { getColorway, type SpecialColorMode } from "../cymatics/colorways";
import { getAnimatedFrequency, type AnimationRuntimeSettings } from "../cymatics/animationPresets";
import type { CymaticsPreset } from "../cymatics/presets";

type CymaticsCanvasProps = {
  seed: number;
  frequency: number;
  preset: CymaticsPreset;
  particleCount?: number;
  animation?: AnimationRuntimeSettings;
  onMetadata?: (metadata: ReturnType<CymaticsEngine["getMetadata"]>) => void;
  onRuntimeFrequencyChange?: (frequency: number) => void;
};

const PLATE_SIZE = 4.45;
const PARTICLE_RENDER_SCALE = 1.96;
const CAMERA_EXTRA_DISTANCE = 0.55;

function sampleGradientColor(stops: string[], t: number) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  const segments = stops.length - 1;
  const scaled = clamped * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - index;

  const colorA = new THREE.Color(stops[index]);
  const colorB = new THREE.Color(stops[index + 1]);

  return colorA.lerp(colorB, localT);
}

function writeColor(
  target: Float32Array,
  offset: number,
  stops: string[],
  specialMode: SpecialColorMode,
  energy: number,
  x: number,
  y: number,
  time: number,
  paletteShiftEnabled: boolean
) {
  let color: THREE.Color;

  if (specialMode === "Prism Bloom") {
    const hue =
      (0.58 + Math.atan2(y, x) / (Math.PI * 2) + energy * 0.3 + time * 0.02) % 1;

    color = new THREE.Color().setHSL(hue, 0.9, 0.62);
    color.lerp(new THREE.Color("#ffffff"), Math.max(0, energy - 0.86) * 0.9);
  } else if (specialMode === "Aurora Field") {
    const t = 0.5 + 0.5 * Math.sin(x * 2.6 + y * 3.2 + energy * 4.0 + time * 0.2);
    color = sampleGradientColor(stops, t);
    color.offsetHSL(0.03 * Math.sin(time * 0.5 + x), 0.02, 0.03);
  } else if (specialMode === "Chromatic Resonance") {
    const t = THREE.MathUtils.clamp(
      energy * 0.68 + (0.5 + 0.5 * Math.sin(x * 7.1 + y * 9.7 + time * 0.45)) * 0.32,
      0,
      1
    );

    color = sampleGradientColor(stops, t);
  } else {
    const noise = 0.5 + 0.5 * Math.sin(x * 7.13 + y * 9.71 + energy * 8.0 + time * 0.42);
    const polar = Math.atan2(y, x) / (Math.PI * 2) + 0.5;
    const t = THREE.MathUtils.clamp(energy * 0.54 + noise * 0.22 + polar * 0.24, 0, 1);

    color = sampleGradientColor(stops, t);
  }

  if (paletteShiftEnabled) {
    color.offsetHSL(0.012 * Math.sin(time * 0.22 + x * 0.5), 0.018, 0.015);
  }

  const sparkle = Math.max(0, energy - 0.88) / 0.12;
  color.lerp(new THREE.Color("#ffffff"), sparkle * 0.46);

  target[offset] = color.r;
  target[offset + 1] = color.g;
  target[offset + 2] = color.b;
}

function getExternalPlayhead(): number | null {
  const globalRef = globalThis as typeof globalThis & Record<string, unknown>;
  const value = globalRef.__CYMATICS_EXPORT_PLAYHEAD__;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function CameraBreathingRig({
  baseZ,
  enabled,
}: {
  baseZ: number;
  enabled: boolean;
}) {
  const { camera } = useThree();

  useFrame((state) => {
    const externalPlayhead = getExternalPlayhead();
    const t = externalPlayhead ?? state.clock.getElapsedTime();

    camera.position.z = baseZ + (enabled ? Math.sin(t * 0.72) * 0.18 : 0);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function CymaticsParticles({
  seed,
  frequency,
  preset,
  particleCount = 45_000,
  animation,
  onMetadata,
  onRuntimeFrequencyChange,
}: CymaticsCanvasProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const lastMetaAt = useRef(0);
  const runtimeFrequencyTimer = useRef(0);
  const animationStartedAt = useRef(performance.now());

  const engine = useMemo(() => new CymaticsEngine(seed, particleCount), [seed, particleCount]);

  const colorway = useMemo(() => getColorway(seed, preset.id), [seed, preset.id]);
  const specialMode = colorway.mode;
  const paletteStops = colorway.stops;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3));
    return geo;
  }, [particleCount]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: preset.particleSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [preset.particleSize]);

  useEffect(() => {
    animationStartedAt.current = performance.now();
  }, [
    animation?.enabled,
    animation?.playing,
    animation?.fromFrequency,
    animation?.toFrequency,
    animation?.durationSec,
    animation?.loopType,
    animation?.easing,
  ]);

  useFrame((state, delta) => {
    engine.setSimulationProfile(preset.physics, preset.id);

    const externalPlayhead = getExternalPlayhead();
    let activeFrequency = frequency;

    if (animation?.enabled) {
      if (externalPlayhead !== null) {
        activeFrequency = getAnimatedFrequency(externalPlayhead, animation);
      } else if (animation.playing) {
        const elapsedSec = (performance.now() - animationStartedAt.current) / 1000;
        activeFrequency = getAnimatedFrequency(elapsedSec, animation);
      } else {
        activeFrequency = animation.fromFrequency;
      }
    }

    engine.setFrequency(activeFrequency);
    engine.update(externalPlayhead !== null ? 1 / Math.max(animation?.fps ?? 30, 1) : delta);

    const points = pointsRef.current;
    if (!points) return;

    const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;

    const positionArray = positionAttr.array as Float32Array;
    const colorArray = colorAttr.array as Float32Array;
    const positions = engine.getParticlePositions();
    const energies = engine.getParticleEnergies();
    const now = externalPlayhead ?? state.clock.getElapsedTime();

    const particlePulseEnabled = animation?.enabled ? animation.particlePulse : false;
    const paletteShiftEnabled = animation?.enabled ? animation.paletteShift : false;

    for (let i = 0; i < particleCount; i++) {
      const offset = i * 3;
      const x = positions[offset] * PARTICLE_RENDER_SCALE;
      const y = positions[offset + 1] * PARTICLE_RENDER_SCALE;
      const energy = energies[i];

      const freqPulse = particlePulseEnabled
        ? 0.65 + 0.35 * Math.sin(now * 2.0 + activeFrequency * 0.001)
        : 1;

      const shimmer = Math.sin(now + x * 4.0 + y * 3.0) * 0.025 * freqPulse;

      positionArray[offset] = x;
      positionArray[offset + 1] = y;
      positionArray[offset + 2] = energy * 0.115 + shimmer * energy;

      writeColor(
        colorArray,
        offset,
        paletteStops,
        specialMode,
        energy,
        x,
        y,
        now,
        paletteShiftEnabled
      );
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    lastMetaAt.current += delta;
    runtimeFrequencyTimer.current += delta;

    if (runtimeFrequencyTimer.current > 0.12) {
      runtimeFrequencyTimer.current = 0;
      onRuntimeFrequencyChange?.(activeFrequency);
    }

    if (lastMetaAt.current > 0.6) {
      lastMetaAt.current = 0;
      onMetadata?.(engine.getMetadata());
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function PlateFrame() {
  return (
    <group>
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[PLATE_SIZE, PLATE_SIZE]} />
        <meshBasicMaterial color="#020205" transparent opacity={0.98} />
      </mesh>

      <lineSegments position={[0, 0, 0.01]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(PLATE_SIZE, PLATE_SIZE)]} />
        <lineBasicMaterial color="#fb923c" transparent opacity={0.42} />
      </lineSegments>
    </group>
  );
}

export function CymaticsCanvas(props: CymaticsCanvasProps) {
  const baseCameraZ = props.preset.cameraZoom + CAMERA_EXTRA_DISTANCE;
  const cameraBreathing = Boolean(props.animation?.enabled && props.animation.cameraBreathing);

  return (
    <Canvas
      camera={{ position: [0, 0, baseCameraZ], fov: 43 }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#020205"]} />
      <CameraBreathingRig baseZ={baseCameraZ} enabled={cameraBreathing} />
      <PlateFrame />
      <CymaticsParticles {...props} />
    </Canvas>
  );
}
