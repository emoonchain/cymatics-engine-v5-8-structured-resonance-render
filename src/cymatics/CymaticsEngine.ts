import {
  chladniField,
  clamp,
  frequencyToModes,
  harmonicInterference,
  modalStandingWave,
  mulberry32,
  smoothDamp,
} from "./math";
import { createMetadata, type CymaticsMetadata } from "./metadata";
import { clampDetailFrequency, frequencyToReadableModes } from "./frequencyModes";

export type CymaticsParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  resonance: number;
};

export type CymaticsParams = {
  frequency: number;
  n: number;
  m: number;
  targetN: number;
  targetM: number;
  chladniWeight: number;
  standingWaveWeight: number;
  harmonicWeight: number;
  attractionStrength: number;
  damping: number;
  vibrationStrength: number;
  seed: number;
  presetId: string;
};

export class CymaticsEngine {
  public readonly particles: CymaticsParticle[];
  public readonly positions: Float32Array;
  public readonly energies: Float32Array;
  public params: CymaticsParams;
  public time = 0;

  constructor(seed: number, particleCount = 100_000) {
    this.params = this.createParams(seed);
    this.particles = this.createParticles(seed, particleCount);
    this.positions = new Float32Array(particleCount * 3);
    this.energies = new Float32Array(particleCount);
    this.syncBuffers();
  }

  setSimulationProfile(
    profile: Partial<
      Pick<
        CymaticsParams,
        | "chladniWeight"
        | "standingWaveWeight"
        | "harmonicWeight"
        | "attractionStrength"
        | "damping"
        | "vibrationStrength"
      >
    >,
    presetId?: string
  ): void {
    this.params = {
      ...this.params,
      ...profile,
      presetId: presetId ?? this.params.presetId,
    };
  }

  setFrequency(freq: number): void {
    const clampedFreq = clampDetailFrequency(freq);
    const modes = frequencyToReadableModes(clampedFreq, this.params.seed);

    this.params.frequency = clampedFreq;
    this.params.targetN = modes.n;
    this.params.targetM = modes.m;
  }

  update(delta: number): void {
    const safeDelta = Math.min(delta, 1 / 30);
    this.time += safeDelta;

    this.params.n = smoothDamp(this.params.n, this.params.targetN, safeDelta, 10);
    this.params.m = smoothDamp(this.params.m, this.params.targetM, safeDelta, 10);

    for (let i = 0; i < this.particles.length; i++) {
      this.updateParticle(this.particles[i], safeDelta);
    }

    this.syncBuffers();
  }

  getParticlePositions(): Float32Array {
    return this.positions;
  }

  getParticleEnergies(): Float32Array {
    return this.energies;
  }

  getEnergyField(resolution = 256): Float32Array {
    const map = new Float32Array(resolution * resolution);

    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const x = (ix / (resolution - 1)) * 2 - 1;
        const y = (iy / (resolution - 1)) * 2 - 1;
        const f = this.field(x, y);
        map[iy * resolution + ix] = 1 - clamp(Math.abs(f), 0, 1);
      }
    }

    return map;
  }

  getNodeMap(resolution = 256): Float32Array {
    const map = new Float32Array(resolution * resolution);

    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const x = (ix / (resolution - 1)) * 2 - 1;
        const y = (iy / (resolution - 1)) * 2 - 1;
        map[iy * resolution + ix] = Math.abs(this.field(x, y));
      }
    }

    return map;
  }

  getMetadata(): CymaticsMetadata {
    const analysis = this.analyzePattern(96);

    return createMetadata({
      seed: this.params.seed,
      frequency: this.params.frequency,
      n: this.params.n,
      m: this.params.m,
      nodeDensity: analysis.nodeDensity,
      symmetryScore: analysis.symmetryScore,
      complexityScore: analysis.complexityScore,
      resonanceStrength: analysis.resonanceStrength,
      presetId: this.params.presetId,
    });
  }

  analyzePattern(resolution = 96): {
    nodeDensity: number;
    symmetryScore: number;
    complexityScore: number;
    resonanceStrength: number;
  } {
    let nodes = 0;
    let energySum = 0;
    let symmetryError = 0;
    let samples = 0;
    const threshold = 0.06;

    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const x = (ix / (resolution - 1)) * 2 - 1;
        const y = (iy / (resolution - 1)) * 2 - 1;
        const f = this.field(x, y);
        const mirrored = this.field(-x, -y);
        const absF = Math.abs(f);

        if (absF < threshold) nodes++;
        energySum += 1 - clamp(absF, 0, 1);
        symmetryError += Math.abs(f - mirrored);
        samples++;
      }
    }

    const nodeDensity = nodes / samples;
    const resonanceStrength = clamp(energySum / samples, 0, 1);
    const symmetryScore = clamp(100 - (symmetryError / samples) * 35, 0, 100);
    const complexityScore = clamp((this.params.n + this.params.m) * 2.2 + nodeDensity * 100, 0, 100);

    return {
      nodeDensity,
      symmetryScore,
      complexityScore,
      resonanceStrength,
    };
  }

  private updateParticle(p: CymaticsParticle, delta: number): void {
    const f = this.field(p.x, p.y);
    const grad = this.gradient(p.x, p.y);
    const attraction = Math.min(1 / (Math.abs(f) + 0.001), 20);
    const force = this.params.attractionStrength * attraction;

    const vibration =
      Math.sin(this.time * this.params.frequency * 0.006 + p.x * this.params.n * 6) *
      Math.cos(this.time * this.params.frequency * 0.005 + p.y * this.params.m * 6);

    const tangentX = -grad.dy;
    const tangentY = grad.dx;
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    const pulse = 0.62 + 0.38 * Math.sin(this.time * 2.4);

    p.vx -= grad.dx * force * delta;
    p.vy -= grad.dy * force * delta;

    p.vx += (tangentX / tangentLength) * vibration * this.params.vibrationStrength * pulse * delta;
    p.vy += (tangentY / tangentLength) * vibration * this.params.vibrationStrength * pulse * delta;

    p.vx *= this.params.damping;
    p.vy *= this.params.damping;

    p.x += p.vx * delta;
    p.y += p.vy * delta;

    if (p.x < -1 || p.x > 1) p.vx *= -0.65;
    if (p.y < -1 || p.y > 1) p.vy *= -0.65;

    p.x = clamp(p.x, -1, 1);
    p.y = clamp(p.y, -1, 1);

    p.energy = 1 - clamp(Math.abs(f), 0, 1);
    p.resonance = attraction / 20;
  }

  private field(x: number, y: number): number {
    const { n, m, frequency, chladniWeight, standingWaveWeight, harmonicWeight } = this.params;
    const chladni = chladniField(x, y, n, m);
    const standing = modalStandingWave(x, y, this.time, n, m, frequency);
    const harmonic = harmonicInterference(x, y, this.time, n, m);

    return chladniWeight * chladni + standingWaveWeight * standing + harmonicWeight * harmonic;
  }

  private gradient(x: number, y: number): { dx: number; dy: number } {
    const eps = 0.0015;

    return {
      dx: (this.field(x + eps, y) - this.field(x - eps, y)) / (2 * eps),
      dy: (this.field(x, y + eps) - this.field(x, y - eps)) / (2 * eps),
    };
  }

  private syncBuffers(): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const offset = i * 3;
      this.positions[offset] = p.x;
      this.positions[offset + 1] = p.y;
      this.positions[offset + 2] = p.energy * 0.08;
      this.energies[i] = p.energy;
    }
  }

  private createParticles(seed: number, count: number): CymaticsParticle[] {
    const rng = mulberry32(seed);
    const particles: CymaticsParticle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * 0.98;
      particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        energy: 0,
        resonance: 0,
      });
    }

    return particles;
  }

  private createParams(seed: number): CymaticsParams {
    const rng = mulberry32(seed);
    const frequency = 140 + rng() * 920;
    const modes = frequencyToModes(frequency);

    return {
      frequency,
      n: modes.n,
      m: modes.m,
      targetN: modes.n,
      targetM: modes.m,
      chladniWeight: 0.855,
      standingWaveWeight: 0.12,
      harmonicWeight: 0.025,
      attractionStrength: 0.028,
      damping: 0.993,
      vibrationStrength: 0.012,
      seed,
      presetId: "genesis-pulse",
    };
  }
}
