/**
 * The 'sfx' instrument family: generic, score-playable sound-effect voices.
 * The SFX bank in `src/audio/sfx/` uses the same primitives directly, but these
 * are here so a cutscene or a track can drop a blip/sweep/zap into note data.
 */

import { makeStereo } from '../dsp/buffer.ts';
import { fastSin, waveAt, wrapPhase } from '../dsp/oscillators.ts';
import { expFall } from '../dsp/envelope.ts';
import { Svf, biquad } from '../dsp/filter.ts';
import { crunch } from '../dsp/shaper.ts';
import { clamp, ctxNoise, toStereo, voiceLength } from './common.ts';
import type { Voice } from './common.ts';

/** Short square blip — cursor ticks, counters, UI beeps. */
export const sfxBlip: Voice = (ctx) => {
  const len = Math.max(2, Math.ceil(clamp(ctx.dur, 0.02, 0.4) * ctx.sampleRate));
  const buf = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const x = i / len;
    const f = ctx.freq * (1 + 0.04 * (1 - x));
    const dt = f / ctx.sampleRate;
    buf[i] = waveAt('pulse', phase, dt, 0.32) * expFall(x, 4) * 0.3 * ctx.velocity;
    phase = wrapPhase(phase + dt);
  }
  return toStereo(buf, 0);
};

/** Pitch sweep through a resonant filter — whooshes, charges, transitions. */
export const sfxSweep: Voice = (ctx) => {
  const len = voiceLength(ctx, 0.12);
  const buf = new Float32Array(len);
  const filter = new Svf(ctx.sampleRate, 400, 2.2);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const x = i / len;
    const f = ctx.freq * Math.pow(4, x);
    const dt = f / ctx.sampleRate;
    if ((i & 31) === 0) filter.setCutoff(f * 3 + 300, 2.2);
    const s = waveAt('saw', phase, dt);
    phase = wrapPhase(phase + dt);
    const env = Math.min(1, x * 18) * (1 - x * x);
    buf[i] = filter.process(s) * env * 0.3 * ctx.velocity;
  }
  return toStereo(buf, 0);
};

/** Filtered noise burst — impacts, wind, steam, footfalls. */
export const sfxNoise: Voice = (ctx) => {
  const len = voiceLength(ctx, 0.08);
  const out = makeStereo(len);
  const nl = ctxNoise(ctx, 1);
  const nr = ctxNoise(ctx, 2);
  const fl = biquad('bandpass', ctx.sampleRate, clamp(ctx.freq, 80, 12000), 0.5);
  const fr = biquad('bandpass', ctx.sampleRate, clamp(ctx.freq * 1.06, 80, 12000), 0.5);
  for (let i = 0; i < len; i++) {
    const x = i / len;
    const env = Math.min(1, x * 40) * expFall(x, 4);
    out.left[i] = fl.process(nl()) * env * 0.35 * ctx.velocity;
    out.right[i] = fr.process(nr()) * env * 0.35 * ctx.velocity;
  }
  return out;
};

/** FM zap — thunder cracks, machina arcs, error buzz. */
export const sfxZap: Voice = (ctx) => {
  const len = voiceLength(ctx, 0.1);
  const buf = new Float32Array(len);
  let carrier = 0;
  let modulator = 0;
  const modRatio = 3.17;
  for (let i = 0; i < len; i++) {
    const x = i / len;
    const env = expFall(x, 3.5);
    const m = fastSin(modulator) * (4.5 * env + 0.4);
    modulator = wrapPhase(modulator + (ctx.freq * modRatio) / ctx.sampleRate);
    carrier = wrapPhase(carrier + (ctx.freq / ctx.sampleRate) * (1 + m * 0.35));
    buf[i] = crunch(fastSin(carrier) * env, 0.35) * 0.3 * ctx.velocity;
  }
  return toStereo(buf, 0);
};

/** Airy, detuned high shimmer — pyreflies, healing sparkle, magic motes. */
export const sfxShimmer: Voice = (ctx) => {
  const len = voiceLength(ctx, 0.4);
  const out = makeStereo(len);
  const partials = [1, 1.51, 2.02, 2.99, 4.13];
  const phases = partials.map((_, i) => i * 0.21);
  const rand = ctxNoise(ctx);
  const wobble = partials.map(() => 1 + rand() * 0.004);
  for (let i = 0; i < len; i++) {
    const x = i / len;
    const env = Math.min(1, x * 8) * expFall(x, 3);
    let l = 0;
    let r = 0;
    for (let p = 0; p < partials.length; p++) {
      const f = ctx.freq * partials[p]! * wobble[p]!;
      phases[p] = wrapPhase(phases[p]! + f / ctx.sampleRate);
      const s = fastSin(phases[p]!) / (p + 1.6);
      const pan = p % 2 === 0 ? 0.75 : 0.35;
      l += s * pan;
      r += s * (1.1 - pan);
    }
    out.left[i] = l * env * 0.22 * ctx.velocity;
    out.right[i] = r * env * 0.22 * ctx.velocity;
  }
  return out;
};
