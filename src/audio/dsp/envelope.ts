/**
 * ADSR envelopes.
 *
 * The envelope is defined as a pure function of time so it can be unit-tested
 * without running a voice: `adsrAt(params, t, holdSec)` is the authority and
 * `renderAdsr` just samples it. Attack is shaped by `attackCurve` (1 = linear,
 * >1 = slow start); decay and release use an exponential curve that lands
 * exactly on its target instead of trailing off asymptotically.
 */

export interface AdsrParams {
  /** Seconds from 0 to full. */
  attack: number;
  /** Seconds from full down to `sustain`. */
  decay: number;
  /** Level held while the note is on, 0..1. */
  sustain: number;
  /** Seconds from the level at note-off down to 0. */
  release: number;
  /** Attack shaping exponent (default 1 = linear). */
  attackCurve?: number;
  /** Steepness of the decay/release exponentials (default 4). */
  curve?: number;
}

export function adsr(
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  extra?: Partial<AdsrParams>,
): AdsrParams {
  return { attack, decay, sustain, release, ...extra };
}

/** Normalised exponential fall from 1 to 0 over x in 0..1, exact at both ends. */
export function expFall(x: number, k: number): number {
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  const e = Math.exp(-k);
  return (Math.exp(-k * x) - e) / (1 - e);
}

/** Envelope level at time `t` for a note held for `holdSec` seconds. */
export function adsrAt(p: AdsrParams, t: number, holdSec: number): number {
  if (t <= 0) return 0;
  const k = p.curve ?? 4;
  const ac = p.attackCurve ?? 1;
  const hold = Math.max(0, holdSec);
  if (t < hold) return stageLevel(p, t, ac, k);
  const level = stageLevel(p, hold, ac, k);
  const rel = p.release;
  if (rel <= 0) return 0;
  const x = (t - hold) / rel;
  return x >= 1 ? 0 : level * expFall(x, k);
}

function stageLevel(p: AdsrParams, t: number, attackCurve: number, k: number): number {
  if (p.attack > 0 && t < p.attack) {
    return Math.pow(t / p.attack, attackCurve);
  }
  const d = t - p.attack;
  if (p.decay > 0 && d < p.decay) {
    return p.sustain + (1 - p.sustain) * expFall(d / p.decay, k);
  }
  return p.sustain;
}

/** Total audible length of a note in seconds, including the release tail. */
export function adsrLength(p: AdsrParams, holdSec: number): number {
  return Math.max(0, holdSec) + Math.max(0, p.release);
}

/** Sample the envelope into a buffer covering hold + release. */
export function renderAdsr(p: AdsrParams, sampleRate: number, holdSec: number): Float32Array {
  const n = Math.max(1, Math.ceil(adsrLength(p, holdSec) * sampleRate));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = adsrAt(p, i / sampleRate, holdSec);
  return out;
}

/**
 * Percussive one-shot envelope: instant attack, single exponential decay.
 * `shape` > 1 makes the decay snappier at the front.
 */
export function percEnv(sampleRate: number, decaySec: number, shape = 1): Float32Array {
  const n = Math.max(1, Math.ceil(decaySec * sampleRate));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / n;
    out[i] = Math.pow(expFall(x, 5), shape);
  }
  return out;
}

/** A short raised-cosine ramp, used to de-click the head of a one-shot. */
export function applyAttackRamp(buf: Float32Array, sampleRate: number, seconds: number): void {
  const n = Math.min(buf.length, Math.max(1, Math.round(seconds * sampleRate)));
  for (let i = 0; i < n; i++) {
    buf[i]! *= 0.5 - 0.5 * Math.cos((Math.PI * i) / n);
  }
}
