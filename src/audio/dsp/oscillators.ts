/**
 * Oscillator primitives. Phase is always normalised to 0..1 and `dt` is the
 * per-sample phase increment (freq / sampleRate) used for PolyBLEP band
 * limiting: pass it for saw/square/pulse and the hard edges stop aliasing into
 * nasty inharmonic hash at high pitches.
 */

export const TAU = Math.PI * 2;

export function wrapPhase(phase: number): number {
  const p = phase - Math.floor(phase);
  return p < 0 ? p + 1 : p;
}

export function sineAt(phase: number): number {
  return Math.sin(phase * TAU);
}

export function triangleAt(phase: number): number {
  const t = wrapPhase(phase);
  return t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
}

/** One-sided polynomial band-limited step correction. */
function polyBlep(t: number, dt: number): number {
  if (dt <= 0) return 0;
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

export function sawAt(phase: number, dt = 0): number {
  const t = wrapPhase(phase);
  return 2 * t - 1 - polyBlep(t, dt);
}

export function squareAt(phase: number, dt = 0): number {
  const t = wrapPhase(phase);
  let v = t < 0.5 ? 1 : -1;
  v += polyBlep(t, dt);
  v -= polyBlep(wrapPhase(t + 0.5), dt);
  return v;
}

/** Pulse with variable width; sweep `width` with an LFO for classic PWM. */
export function pulseAt(phase: number, width: number, dt = 0): number {
  const w = Math.min(0.95, Math.max(0.05, width));
  const t = wrapPhase(phase);
  let v = t < w ? 1 : -1;
  v += polyBlep(t, dt);
  v -= polyBlep(wrapPhase(t - w), dt);
  return v;
}

export type WaveName = 'sine' | 'tri' | 'saw' | 'square' | 'pulse';

export function waveAt(wave: WaveName, phase: number, dt = 0, width = 0.5): number {
  switch (wave) {
    case 'sine':
      return sineAt(phase);
    case 'tri':
      return triangleAt(phase);
    case 'saw':
      return sawAt(phase, dt);
    case 'square':
      return squareAt(phase, dt);
    case 'pulse':
      return pulseAt(phase, width, dt);
    default:
      return 0;
  }
}

const SINE_TABLE_SIZE = 4096;
const SINE_TABLE = new Float32Array(SINE_TABLE_SIZE + 1);
for (let i = 0; i <= SINE_TABLE_SIZE; i++) {
  SINE_TABLE[i] = Math.sin((i / SINE_TABLE_SIZE) * TAU);
}

/**
 * Table-lookup sine with linear interpolation (~-80 dB error). Additive voices
 * stack a dozen partials per sample, and this keeps an offline render of a
 * 90 second piano piece down to a second or so instead of a minute.
 */
export function fastSin(phase: number): number {
  const t = wrapPhase(phase) * SINE_TABLE_SIZE;
  const i = t | 0;
  const frac = t - i;
  const a = SINE_TABLE[i]!;
  return a + (SINE_TABLE[i + 1]! - a) * frac;
}

/** Phase accumulator. `next()` returns the current phase then advances it. */
export class Osc {
  phase: number;

  constructor(phase = 0) {
    this.phase = wrapPhase(phase);
  }

  next(freq: number, sampleRate: number): number {
    const current = this.phase;
    this.phase = wrapPhase(this.phase + freq / sampleRate);
    return current;
  }
}

/** xorshift32 white noise in -1..1. Seeded, so renders are reproducible. */
export function makeNoise(seed: number): () => number {
  let state = (seed | 0) === 0 ? 0x9e3779b9 : seed | 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state |= 0;
    return state / 0x80000000;
  };
}

/** Cheap pink-ish noise (Paul Kellet's economy filter) for shakers and wind. */
export function makePinkNoise(seed: number): () => number {
  const white = makeNoise(seed);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  return () => {
    const w = white();
    b0 = 0.99765 * b0 + w * 0.099;
    b1 = 0.963 * b1 + w * 0.2965;
    b2 = 0.57 * b2 + w * 1.0526;
    return (b0 + b1 + b2 + w * 0.1848) * 0.35;
  };
}

/** Deterministic 32-bit string hash, used to seed per-note noise. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}
