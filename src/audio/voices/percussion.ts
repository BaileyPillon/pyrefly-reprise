/** Drums and tuned percussion. Pitch comes from the note where it makes sense. */

import { makeStereo } from '../dsp/buffer.ts';
import { fastSin, wrapPhase } from '../dsp/oscillators.ts';
import { expFall, percEnv } from '../dsp/envelope.ts';
import { biquad } from '../dsp/filter.ts';
import { saturate } from '../dsp/shaper.ts';
import { clamp, ctxNoise, toStereo } from './common.ts';
import type { Voice, VoiceCtx } from './common.ts';

function oneShot(ctx: VoiceCtx, seconds: number): Float32Array {
  return new Float32Array(Math.max(2, Math.ceil(seconds * ctx.sampleRate)));
}

/**
 * Body of a drum: a sine whose pitch falls from `fromHz` to `toHz` with time
 * constant `pitchTime`, amplitude decaying over `decay`.
 */
function drumBody(
  ctx: VoiceCtx,
  out: Float32Array,
  fromHz: number,
  toHz: number,
  pitchTime: number,
  decay: number,
  gain: number,
  shape = 1,
): void {
  const sr = ctx.sampleRate;
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const f = toHz + (fromHz - toHz) * Math.exp(-t / pitchTime);
    phase = wrapPhase(phase + f / sr);
    const env = Math.pow(expFall(Math.min(1, t / decay), 5), shape);
    out[i] = out[i]! + fastSin(phase) * env * gain;
  }
}

/** Tight kick drum: fast pitch drop plus a click. */
export const kick: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const buf = oneShot(ctx, 0.5);
  drumBody(ctx, buf, 132, 46, 0.028, 0.34, 0.95 * v, 1.1);
  const noise = ctxNoise(ctx);
  const click = biquad('bandpass', ctx.sampleRate, 2400, 1.2);
  const clickLen = Math.round(0.008 * ctx.sampleRate);
  for (let i = 0; i < clickLen; i++) {
    buf[i] = buf[i]! + click.process(noise()) * (1 - i / clickLen) * 0.35 * v;
  }
  for (let i = 0; i < buf.length; i++) buf[i] = saturate(buf[i]!, 1.4);
  return toStereo(buf, 0);
};

/** Taiko: deep, woody, a little skin noise, tuned by the note. */
export const taiko: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const buf = oneShot(ctx, 0.9);
  const base = clamp(ctx.freq > 0 ? ctx.freq : 82, 45, 160);
  drumBody(ctx, buf, base * 1.8, base * 0.72, 0.05, 0.55, 0.75 * v, 1);
  drumBody(ctx, buf, base * 2.9, base * 1.5, 0.03, 0.2, 0.2 * v, 1.4);
  const noise = ctxNoise(ctx);
  const skin = biquad('bandpass', ctx.sampleRate, 420, 0.9);
  const skinLen = Math.round(0.09 * ctx.sampleRate);
  for (let i = 0; i < skinLen; i++) {
    const e = 1 - i / skinLen;
    buf[i] = buf[i]! + skin.process(noise()) * e * e * 0.5 * v;
  }
  for (let i = 0; i < buf.length; i++) buf[i] = saturate(buf[i]!, 1.3);
  return toStereo(buf, 0);
};

/** Concert timpani: tuned, inharmonic-ish, long roll-friendly decay. */
export const timpani: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const decay = clamp(2.4 * (110 / clamp(ctx.freq, 45, 200)), 1.2, 3.4);
  const buf = oneShot(ctx, decay + 0.2);
  const base = clamp(ctx.freq > 0 ? ctx.freq : 73, 45, 200);
  drumBody(ctx, buf, base * 1.35, base, 0.06, decay, 0.6 * v, 1);
  drumBody(ctx, buf, base * 1.5, base * 1.5, 0.05, decay * 0.5, 0.2 * v, 1.2);
  drumBody(ctx, buf, base * 2.0, base * 2.0, 0.05, decay * 0.3, 0.12 * v, 1.4);
  const noise = ctxNoise(ctx);
  const mallet = biquad('bandpass', ctx.sampleRate, 900, 1.1);
  const malletLen = Math.round(0.03 * ctx.sampleRate);
  for (let i = 0; i < malletLen; i++) {
    const e = 1 - i / malletLen;
    buf[i] = buf[i]! + mallet.process(noise()) * e * e * 0.3 * v;
  }
  return toStereo(buf, 0);
};

/** Snare: band-passed noise over two tuned shells. */
export const snare: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const buf = oneShot(ctx, 0.34);
  drumBody(ctx, buf, 330, 180, 0.03, 0.12, 0.3 * v, 1);
  drumBody(ctx, buf, 190, 150, 0.04, 0.16, 0.24 * v, 1);
  const noise = ctxNoise(ctx);
  const body = biquad('bandpass', ctx.sampleRate, 1750, 0.6);
  const top = biquad('highpass', ctx.sampleRate, 3200, 0.7);
  const env = percEnv(ctx.sampleRate, 0.2, 1.2);
  for (let i = 0; i < buf.length; i++) {
    const n = noise();
    const e = i < env.length ? env[i]! : 0;
    buf[i] = buf[i]! + (body.process(n) * 0.75 + top.process(n) * 0.5) * e * 0.85 * v;
  }
  for (let i = 0; i < buf.length; i++) buf[i] = saturate(buf[i]!, 1.2);
  return toStereo(buf, -0.06);
};

/** Hi-hat. Note duration decides closed vs open. */
export const hat: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const open = clamp(ctx.dur, 0.03, 0.5);
  const decay = clamp(open * 0.8, 0.035, 0.36);
  const buf = oneShot(ctx, decay + 0.05);
  const noise = ctxNoise(ctx);
  const hp = biquad('highpass', ctx.sampleRate, 7200, 0.8);
  const peak = biquad('peak', ctx.sampleRate, 9500, 1.2, 5);
  const env = percEnv(ctx.sampleRate, decay, 1.6);
  for (let i = 0; i < buf.length; i++) {
    const e = i < env.length ? env[i]! : 0;
    buf[i] = peak.process(hp.process(noise())) * e * 0.3 * v;
  }
  return toStereo(buf, 0.18);
};

/** Shaker / tambourine-ish tick. */
export const shaker: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const buf = oneShot(ctx, 0.16);
  const noise = ctxNoise(ctx);
  const bp = biquad('bandpass', ctx.sampleRate, 6200, 0.5);
  const n = buf.length;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    // Soft attack then fast decay: a grain of sand hitting the shell.
    const e = Math.min(1, x * 12) * expFall(x, 4.5);
    buf[i] = bp.process(noise()) * e * 0.34 * v;
  }
  return toStereo(buf, -0.22);
};

/** Crash / suspended cymbal swell used at section boundaries. */
export const crash: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const decay = clamp(ctx.dur + 1.1, 0.8, 2.6);
  const out = makeStereo(Math.max(2, Math.ceil((decay + 0.2) * ctx.sampleRate)));
  const noiseL = ctxNoise(ctx, 1);
  const noiseR = ctxNoise(ctx, 2);
  const bandsL = [biquad('highpass', ctx.sampleRate, 4200, 0.7), biquad('peak', ctx.sampleRate, 7600, 1.4, 6)];
  const bandsR = [biquad('highpass', ctx.sampleRate, 4000, 0.7), biquad('peak', ctx.sampleRate, 8200, 1.4, 6)];
  const n = out.left.length;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const e = Math.min(1, x * 60) * expFall(x, 3.2);
    let l = noiseL();
    let r = noiseR();
    for (const f of bandsL) l = f.process(l);
    for (const f of bandsR) r = f.process(r);
    out.left[i] = l * e * 0.28 * v;
    out.right[i] = r * e * 0.28 * v;
  }
  return out;
};

/** Floor/rack tom, tuned by the note. */
export const tom: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const buf = oneShot(ctx, 0.6);
  const base = clamp(ctx.freq > 0 ? ctx.freq : 110, 60, 320);
  drumBody(ctx, buf, base * 1.6, base, 0.05, 0.4, 0.75 * v, 1);
  const noise = ctxNoise(ctx);
  const skin = biquad('bandpass', ctx.sampleRate, 600, 1.0);
  const skinLen = Math.round(0.02 * ctx.sampleRate);
  for (let i = 0; i < skinLen; i++) {
    buf[i] = buf[i]! + skin.process(noise()) * (1 - i / skinLen) * 0.25 * v;
  }
  return toStereo(buf, 0.1);
};
