/**
 * The contract every instrument implements, plus the small helpers the voices
 * share. A voice renders ONE note into a fresh stereo buffer that already
 * includes its own release tail; the sequencer just mixes it in at an offset.
 */

import { makeStereo, type Stereo } from '../dsp/buffer.ts';
import { makeNoise, hashSeed } from '../dsp/oscillators.ts';
import { applyAttackRamp } from '../dsp/envelope.ts';
import { panGains } from '../dsp/shaper.ts';

export interface VoiceCtx {
  sampleRate: number;
  /** Fundamental in Hz. */
  freq: number;
  /** How long the note is held, in seconds (the tail is added on top). */
  dur: number;
  /** 0..1 — drives loudness AND brightness, like a real key velocity. */
  velocity: number;
  /** Deterministic per-note seed for any noise the voice uses. */
  seed: number;
}

export type Voice = (ctx: VoiceCtx) => Stereo;

export function ctxNoise(ctx: VoiceCtx, salt = 0): () => number {
  return makeNoise(hashSeed(`${ctx.seed}:${salt}:${Math.round(ctx.freq * 100)}`));
}

export function centsRatio(cents: number): number {
  return Math.pow(2, cents / 1200);
}

export function semitoneRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Copy a mono render into a panned stereo pair. */
export function toStereo(mono: Float32Array, pan = 0): Stereo {
  const g = panGains(pan);
  const out = makeStereo(mono.length);
  for (let i = 0; i < mono.length; i++) {
    out.left[i] = mono[i]! * g.left;
    out.right[i] = mono[i]! * g.right;
  }
  return out;
}

/** Build a stereo pair from two independent mono renders (detuned voices). */
export function pairToStereo(left: Float32Array, right: Float32Array, gain = 1): Stereo {
  const n = Math.max(left.length, right.length);
  const out = makeStereo(n);
  for (let i = 0; i < left.length; i++) out.left[i] = left[i]! * gain;
  for (let i = 0; i < right.length; i++) out.right[i] = right[i]! * gain;
  return out;
}

/** Number of samples for a note held `dur` seconds with a `tail` second tail. */
export function voiceLength(ctx: VoiceCtx, tail: number): number {
  return Math.max(2, Math.ceil((Math.max(0, ctx.dur) + tail) * ctx.sampleRate));
}

/**
 * Plucked string (Karplus-Strong) with a fractional delay line so the tuning
 * stays true up high. `damping` 0..1 darkens each pass, `decay` scales how long
 * the string rings.
 */
export function karplusStrong(
  ctx: VoiceCtx,
  options: { damping?: number; decay?: number; dampOnRelease?: boolean; tail?: number } = {},
): Float32Array {
  const { sampleRate, freq } = ctx;
  const damping = clamp(options.damping ?? 0.4, 0, 0.95);
  const decay = options.decay ?? 1;
  const total = voiceLength(ctx, options.tail ?? 1.2);
  const delay = Math.max(2, sampleRate / Math.max(20, freq) - 0.5);
  const size = Math.ceil(delay) + 2;
  const line = new Float32Array(size);
  const noise = ctxNoise(ctx);
  // Excite with a short velocity-shaped noise burst, low-passed for soft plucks.
  const exciteLen = Math.min(size, Math.ceil(delay));
  let smooth = 0;
  const bright = clamp(0.25 + ctx.velocity * 0.7, 0.2, 0.95);
  for (let i = 0; i < exciteLen; i++) {
    smooth += (noise() - smooth) * bright;
    line[i] = smooth * (1 - i / exciteLen);
  }
  const feedback = Math.pow(0.5, 1 / (freq * Math.max(0.05, decay * 2.2)));
  const out = new Float32Array(total);
  let readPos = 0;
  let writePos = 0;
  let last = 0;
  const intDelay = Math.floor(delay);
  const frac = delay - intDelay;
  for (let i = 0; i < total; i++) {
    readPos = writePos - intDelay;
    while (readPos < 0) readPos += size;
    const a = line[readPos % size]!;
    const b = line[(readPos + 1) % size]!;
    const sample = a + (b - a) * frac;
    const filtered = sample * (1 - damping) + last * damping;
    last = filtered;
    line[writePos] = filtered * feedback;
    writePos = (writePos + 1) % size;
    out[i] = sample;
  }
  applyAttackRamp(out, sampleRate, 0.0015);
  // Optional key-release damping once the note is let go (a harp keeps ringing,
  // a muted guitar-ish pluck does not).
  if (options.dampOnRelease ?? true) {
    const holdSamples = Math.ceil(ctx.dur * sampleRate);
    const releaseSamples = Math.max(1, Math.round(0.14 * sampleRate));
    for (let i = holdSamples; i < total; i++) {
      const x = (i - holdSamples) / releaseSamples;
      out[i] = x >= 1 ? 0 : out[i]! * (1 - x) * (1 - x);
    }
  }
  return out;
}
