export type Vec2 = {
  dx: number;
  dy: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothDamp(current: number, target: number, delta: number, speed = 9): number {
  const t = 1 - Math.exp(-speed * delta);
  return lerp(current, target, t);
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function frequencyToModes(freq: number): { n: number; m: number } {
  const safeFreq = clamp(freq, 20, 20000);
  return {
    n: Math.max(1, Math.floor(Math.sqrt(safeFreq) / 2)),
    m: Math.max(1, Math.floor(Math.log(safeFreq) * 2)),
  };
}

export function modalStandingWave(x: number, y: number, time: number, n: number, m: number, frequency: number): number {
  const sx = Math.sin((n * Math.PI * (x + 1)) / 2);
  const sy = Math.sin((m * Math.PI * (y + 1)) / 2);
  const temporal = Math.cos(frequency * 0.01 * time);
  return sx * sy * temporal;
}

export function chladniField(x: number, y: number, n: number, m: number): number {
  return Math.cos(n * x) * Math.cos(m * y) - Math.cos(m * x) * Math.cos(n * y);
}

export function harmonicInterference(x: number, y: number, time: number, n: number, m: number): number {
  return 0.5 * Math.sin((n + m) * x + time) * Math.cos(Math.abs(n - m + 1) * y - time);
}
