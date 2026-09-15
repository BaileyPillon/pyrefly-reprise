/** Struck and plucked voices: piano, harp, pluck, bell, celesta. */

import { fastSin, wrapPhase } from '../dsp/oscillators.ts';
import { biquad } from '../dsp/filter.ts';
import { applyAttackRamp } from '../dsp/envelope.ts';
import { clamp, ctxNoise, karplusStrong, pairToStereo, toStereo, voiceLength } from './common.ts';
import type { Voice, VoiceCtx } from './common.ts';
import { centsRatio } from './common.ts';

interface StruckOptions {
  /** Number of harmonic partials. */
  partials: number;
  /** Amplitude of partial k (1-based). */
  amp: (k: number) => number;
  /** Frequency multiplier of partial k (1-based) — non-integer = inharmonic. */
  ratio: (k: number) => number;
  /** -60 dB time of partial k, in seconds. */
  decay: (k: number) => number;
  /** Cents of detune applied to the whole stack. */
  detune: number;
  totalSamples: number;
  /** Seconds of fade once the key is released. */
  release: number;
}

/**
 * Additive struck-string / bar model. Every partial gets its own exponential
 * decay, which is the whole trick behind a convincing piano or bell: the highs
 * die away first and leave a sweetening fundamental.
 */
function struck(ctx: VoiceCtx, o: StruckOptions): Float32Array {
  const { sampleRate, freq } = ctx;
  const n = o.totalSamples;
  const out = new Float32Array(n);
  const nyquist = sampleRate * 0.46;
  const phase: number[] = [];
  const inc: number[] = [];
  const amp: number[] = [];
  const mul: number[] = [];
  const base = freq * centsRatio(o.detune);
  for (let k = 1; k <= o.partials; k++) {
    const f = base * o.ratio(k);
    if (f >= nyquist) break;
    phase.push(wrapPhase(k * 0.117));
    inc.push(f / sampleRate);
    amp.push(o.amp(k));
    mul.push(Math.pow(0.001, 1 / Math.max(1, o.decay(k) * sampleRate)));
  }
  const count = phase.length;
  const holdSamples = Math.ceil(ctx.dur * sampleRate);
  const releaseSamples = Math.max(1, Math.round(o.release * sampleRate));
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let p = 0; p < count; p++) {
      sum += amp[p]! * fastSin(phase[p]!);
      phase[p] = phase[p]! + inc[p]!;
      amp[p] = amp[p]! * mul[p]!;
    }
    if (i > holdSamples) {
      const x = (i - holdSamples) / releaseSamples;
      sum *= x >= 1 ? 0 : (1 - x) * (1 - x);
    }
    out[i] = sum;
  }
  // A struck string is near-instant but not a step: without this ramp the sum
  // of fifteen partials starts mid-cycle and every note begins with a click.
  applyAttackRamp(out, sampleRate, 0.0025);
  return out;
}

/** Concert-grand-ish: inharmonic partial stack, hammer noise, two detuned halves. */
export const piano: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.05, 1);
  const decayTime = clamp(11 * Math.pow(220 / ctx.freq, 0.5), 1.1, 13);
  const audible = Math.min(decayTime * 1.05, ctx.dur + 2.6);
  const total = Math.max(2, Math.ceil(audible * ctx.sampleRate));
  const bright = 0.9 + v * 1.4;
  const shared = {
    partials: 15,
    amp: (k: number) => (1 / Math.pow(k, 1.25)) * Math.exp(-(k - 1) / bright / 2.4),
    ratio: (k: number) => k * Math.sqrt(1 + 0.00032 * k * k),
    decay: (k: number) => decayTime / (1 + 0.5 * (k - 1)),
    totalSamples: total,
    release: 0.28,
  };
  const left = struck(ctx, { ...shared, detune: -2.6 });
  const right = struck(ctx, { ...shared, detune: 2.6 });
  // Hammer thump: a few milliseconds of band-passed noise glued to the attack.
  const noise = ctxNoise(ctx);
  const thump = biquad('bandpass', ctx.sampleRate, clamp(ctx.freq * 3.2, 220, 3200), 0.8);
  const thumpLen = Math.min(total, Math.round(0.014 * ctx.sampleRate));
  for (let i = 0; i < thumpLen; i++) {
    const env = (1 - i / thumpLen) * (1 - i / thumpLen);
    const s = thump.process(noise()) * env * 0.5 * v;
    left[i] = left[i]! + s;
    right[i] = right[i]! + s;
  }
  return pairToStereo(left, right, 0.2 * (0.35 + v * 0.75));
};

/** Harp: Karplus-Strong that keeps ringing after the note is released. */
export const harp: Voice = (ctx) => {
  const mono = karplusStrong(ctx, {
    damping: 0.32,
    decay: 1.5,
    dampOnRelease: false,
    tail: clamp(3.4 * (330 / Math.max(80, ctx.freq)), 0.9, 3.4),
  });
  return toStereo(mono, 0.12 * Math.sin(ctx.freq * 0.017));
};

/** Tighter, brighter pluck for accents and menu texture. */
export const pluck: Voice = (ctx) => {
  const mono = karplusStrong(ctx, { damping: 0.2, decay: 0.75, dampOnRelease: true, tail: 0.5 });
  const filter = biquad('highpass', ctx.sampleRate, 140, 0.7);
  filter.processBuffer(mono);
  return toStereo(mono, 0);
};

const BELL_RATIOS = [0.56, 0.92, 1, 1.42, 1.83, 2.41, 2.98, 3.76, 4.55];

/** Tubular-bell-ish inharmonic stack; long, shimmering decay. */
export const bell: Voice = (ctx) => {
  const decayTime = clamp(6.5 * Math.pow(440 / ctx.freq, 0.35), 1.4, 8);
  const total = Math.max(2, Math.ceil(Math.min(decayTime, ctx.dur + 4) * ctx.sampleRate));
  const mono = struck(ctx, {
    partials: BELL_RATIOS.length,
    amp: (k) => 0.9 / Math.pow(k, 0.85),
    ratio: (k) => BELL_RATIOS[k - 1] ?? k,
    decay: (k) => decayTime / (1 + 0.55 * (k - 1)),
    detune: 0,
    totalSamples: total,
    release: 1.5,
  });
  const out = toStereo(mono, 0);
  const g = 0.16 * (0.4 + ctx.velocity * 0.7);
  for (let i = 0; i < mono.length; i++) {
    out.left[i] = out.left[i]! * g;
    out.right[i] = out.right[i]! * g;
  }
  return out;
};

/** Celesta: bell timbre an octave brighter, short and glassy. */
export const celesta: Voice = (ctx) => {
  const decayTime = clamp(2.6 * Math.pow(440 / ctx.freq, 0.3), 0.5, 3);
  const total = Math.max(2, Math.ceil(Math.min(decayTime, ctx.dur + 2.2) * ctx.sampleRate));
  const shared = {
    partials: 8,
    amp: (k: number) => (k === 1 ? 1 : 0.55 / Math.pow(k, 1.1)),
    ratio: (k: number) => [1, 2, 3.01, 4.02, 5.4, 6.8, 8.1, 9.6][k - 1] ?? k,
    decay: (k: number) => decayTime / (1 + 0.7 * (k - 1)),
    totalSamples: total,
    release: 0.6,
  };
  const left = struck(ctx, { ...shared, detune: -1.5 });
  const right = struck(ctx, { ...shared, detune: 1.5 });
  return pairToStereo(left, right, 0.16 * (0.4 + ctx.velocity * 0.7));
};

/** Soft mallet/marimba-ish tone used by a couple of SFX and the results tick. */
export const mallet: Voice = (ctx) => {
  const total = voiceLength(ctx, 0.5);
  const mono = struck(ctx, {
    partials: 5,
    amp: (k) => [1, 0.35, 0.18, 0.09, 0.05][k - 1] ?? 0,
    ratio: (k) => [1, 3.9, 9.2, 15.1, 21.4][k - 1] ?? k,
    decay: () => clamp(0.55 * (440 / ctx.freq), 0.12, 1.2),
    detune: 0,
    totalSamples: total,
    release: 0.12,
  });
  return toStereo(mono, 0);
};
