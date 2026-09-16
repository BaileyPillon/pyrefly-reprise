/**
 * "Band" voices: an FM electric piano, a drawbar organ, a distorted guitar, a
 * breath flute and an industrial FM anvil hit. These lean on raw oscillators
 * and FM rather than the shared `renderEnsemble` bank, the same way `keys.ts`
 * hand-rolls its additive struck-string model.
 */

import { makeStereo } from '../dsp/buffer.ts';
import { fastSin, sawAt, pulseAt, wrapPhase } from '../dsp/oscillators.ts';
import { adsrAt, expFall, applyAttackRamp } from '../dsp/envelope.ts';
import type { AdsrParams } from '../dsp/envelope.ts';
import { biquad, DcBlocker } from '../dsp/filter.ts';
import { Lfo } from '../dsp/lfo.ts';
import { clamp, centsRatio, ctxNoise, pairToStereo, semitoneRatio, toStereo, voiceLength } from './common.ts';
import type { Voice, VoiceCtx } from './common.ts';

/**
 * FM electric piano: a bright tine/bell operator whose modulation index decays
 * quickly so the attack mellows into a rounder tone, plus a gentle
 * out-of-phase stereo tremolo (the classic chorused-Rhodes wobble).
 */
export const epiano: Voice = (ctx) => {
  const { sampleRate, freq } = ctx;
  const v = clamp(ctx.velocity, 0.05, 1);
  const env: AdsrParams = { attack: 0.004, decay: 1.6, sustain: 0.22, release: 0.5, attackCurve: 1 };
  const total = voiceLength(ctx, env.release + 0.1);
  const out = makeStereo(total);
  const modRatio = 14; // classic tine ratio: bright, fast-decaying sidebands
  const brightBase = 1.4 + v * 2.2;
  let carrierPhase = 0;
  let modPhase = 0.15;
  const tremL = new Lfo({ rate: 4.4, depth: 0.07, phase: 0, fadeIn: 0.15 });
  const tremR = new Lfo({ rate: 4.4, depth: 0.07, phase: 0.5, fadeIn: 0.15 });
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const brightness = brightBase * expFall(Math.min(1, t / 0.35), 4) + 0.15;
    const mod = fastSin(modPhase) * brightness;
    modPhase = wrapPhase(modPhase + (freq * modRatio) / sampleRate);
    carrierPhase = wrapPhase(carrierPhase + (freq / sampleRate) * (1 + mod * 0.05));
    const amp = adsrAt(env, t, ctx.dur);
    const s = fastSin(carrierPhase) * amp * 0.32 * (0.4 + v * 0.7);
    out.left[i] = s * (1 + tremL.next(sampleRate));
    out.right[i] = s * (1 + tremR.next(sampleRate));
  }
  return out;
};

const DRAWBAR_RATIOS = [0.5, 1, 2, 3, 4]; // 16' 8' 4' 2 2/3' 2'
const DRAWBAR_GAINS = [0.9, 1.0, 0.5, 0.28, 0.22];
const DRAWBAR_TOTAL = DRAWBAR_GAINS.reduce((a, b) => a + b, 0);

/**
 * Drawbar additive organ (16'/8'/4'/2 2/3'/2') with a key click on the attack
 * and a slow rotary-ish tremolo/pan swirl. Weighted toward the low drawbars so
 * it stays heavy and cathedral-like in the low registers a boss hymn wants.
 */
export const organ: Voice = (ctx) => {
  const { sampleRate, freq } = ctx;
  const v = clamp(ctx.velocity, 0.1, 1);
  const nyquist = sampleRate * 0.45;
  const gains = DRAWBAR_RATIOS.map((ratio, i) => (freq * ratio < nyquist ? DRAWBAR_GAINS[i]! : 0));
  const env: AdsrParams = { attack: 0.012, decay: 0.05, sustain: 1, release: 0.55, attackCurve: 1 };
  const total = voiceLength(ctx, env.release + 0.15);
  const out = makeStereo(total);
  const phases = DRAWBAR_RATIOS.map((_, i) => i * 0.211);
  const trem = new Lfo({ rate: 1.05, depth: 0.16, phase: 0, fadeIn: 0.3 });
  const sway = new Lfo({ rate: 1.05, depth: 0.5, phase: 0.25 });
  const noise = ctxNoise(ctx);
  const click = biquad('bandpass', sampleRate, 1800, 1.4);
  const clickLen = Math.round(0.006 * sampleRate);
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    let s = 0;
    for (let p = 0; p < DRAWBAR_RATIOS.length; p++) {
      const f = freq * DRAWBAR_RATIOS[p]!;
      phases[p] = wrapPhase(phases[p]! + f / sampleRate);
      s += fastSin(phases[p]!) * gains[p]!;
    }
    s /= DRAWBAR_TOTAL;
    if (i < clickLen) s += click.process(noise()) * (1 - i / clickLen) * 0.18 * v;
    const amp = adsrAt(env, t, ctx.dur) * (1 + trem.next(sampleRate)) * (0.45 + v * 0.35);
    const w = sway.next(sampleRate);
    out.left[i] = s * amp * (0.5 - w * 0.18);
    out.right[i] = s * amp * (0.5 + w * 0.18);
  }
  return out;
};

/**
 * Overdriven rock guitar: two detuned saw/pulse layers plus a pick-noise
 * transient, run through hard asymmetric clipping (a small DC bias inside the
 * `tanh` curve, then a `DcBlocker` to strip the bias back out) and a cabinet
 * low-pass around 4.6 kHz. Short notes (< ~0.12s) read as palm mutes; long
 * ones sustain under a slow, feedback-ish amplitude swell.
 */
export const guitarDist: Voice = (ctx) => {
  const { sampleRate, freq } = ctx;
  const v = clamp(ctx.velocity, 0.1, 1);
  const muted = ctx.dur < 0.12;
  const env: AdsrParams = muted
    ? { attack: 0.002, decay: 0.045, sustain: 0.03, release: 0.05, attackCurve: 1 }
    : { attack: 0.005, decay: 0.4, sustain: 0.7, release: 0.32, attackCurve: 1 };
  const total = voiceLength(ctx, env.release + 0.08);
  const mono = new Float32Array(total);
  const detune1 = centsRatio(-7);
  const detune2 = centsRatio(7);
  const drive = 2.2 + v * 2.4;
  const bias = 0.22;
  const biasShift = Math.tanh(bias * drive);
  const cabinet = biquad('lowpass', sampleRate, 4600, 0.9);
  const dc = new DcBlocker();
  const noise = ctxNoise(ctx);
  const pick = biquad('highpass', sampleRate, 1800, 0.8);
  const pickLen = Math.round(0.01 * sampleRate);
  const swell = new Lfo({ rate: 0.6, depth: 0.15, phase: 0.2, fadeIn: 0.3 });
  let phase1 = 0;
  let phase2 = 0.5;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const dt1 = (freq * detune1) / sampleRate;
    const dt2 = (freq * detune2) / sampleRate;
    let s = (sawAt(phase1, dt1) + pulseAt(phase2, 0.4, dt2)) * 0.5;
    phase1 = wrapPhase(phase1 + dt1);
    phase2 = wrapPhase(phase2 + dt2);
    if (i < pickLen) s += pick.process(noise()) * (1 - i / pickLen) * 0.6;
    const shaped = Math.tanh((s + bias) * drive) - biasShift;
    const filtered = cabinet.process(dc.process(shaped));
    const swellAmt = muted ? 1 : 1 + swell.next(sampleRate) * Math.min(1, t / 1.2);
    mono[i] = filtered * adsrAt(env, t, ctx.dur) * swellAmt;
  }
  const g = 0.22 * (0.4 + v * 0.7);
  for (let i = 0; i < total; i++) mono[i] = mono[i]! * g;
  return toStereo(mono, 0);
};

/**
 * Breathy sine flute with a little 2nd/3rd harmonic on top, continuous
 * band-passed breath noise under the tone, and vibrato that fades in after
 * the note has been held a while. For the cold-mountain and afterlife scenes.
 */
export const flute: Voice = (ctx) => {
  const { sampleRate, freq } = ctx;
  const v = clamp(ctx.velocity, 0.05, 1);
  const env: AdsrParams = { attack: 0.09, decay: 0.25, sustain: 0.88, release: 0.22, attackCurve: 1.4 };
  const total = voiceLength(ctx, env.release + 0.3);
  const out = makeStereo(total);
  const vib = new Lfo({ rate: 5.0, depth: 0.18, fadeIn: 0.45, phase: 0.2 });
  const noiseL = ctxNoise(ctx, 1);
  const noiseR = ctxNoise(ctx, 2);
  const breathL = biquad('bandpass', sampleRate, clamp(freq * 2.4, 900, 4200), 0.7);
  const breathR = biquad('bandpass', sampleRate, clamp(freq * 2.5, 900, 4200), 0.7);
  let p1 = 0;
  let p2 = 0.1;
  let p3 = 0.2;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const bend = semitoneRatio(vib.next(sampleRate));
    const dt = (freq * bend) / sampleRate;
    p1 = wrapPhase(p1 + dt);
    p2 = wrapPhase(p2 + dt * 2);
    p3 = wrapPhase(p3 + dt * 3);
    const tone = fastSin(p1) + 0.16 * fastSin(p2) + 0.08 * fastSin(p3);
    const amp = adsrAt(env, t, ctx.dur);
    const body = tone * 0.5 * amp;
    const nl = breathL.process(noiseL());
    const nr = breathR.process(noiseR());
    const loud = 0.55 + v * 0.6;
    out.left[i] = (body + nl * 0.18 * amp) * loud;
    out.right[i] = (body + nr * 0.18 * amp) * loud;
  }
  return out;
};

/** One inharmonic FM operator for `metalHit`; the two channels use different detune/ratio so they clang slightly differently. */
function metalOperator(
  ctx: VoiceCtx,
  decay: number,
  detuneCents: number,
  modRatio: number,
  modDepth: number,
): Float32Array {
  const { sampleRate, freq } = ctx;
  const total = Math.max(2, Math.ceil((decay + 0.05) * sampleRate));
  const out = new Float32Array(total);
  const f = freq * centsRatio(detuneCents);
  let carrier = 0;
  let modulator = 0.15;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const env = expFall(Math.min(1, t / decay), 3.4);
    const modEnv = expFall(Math.min(1, t / Math.max(0.02, decay * 0.35)), 5);
    const m = fastSin(modulator) * modDepth * modEnv;
    modulator = wrapPhase(modulator + (f * modRatio) / sampleRate);
    carrier = wrapPhase(carrier + (f / sampleRate) * (1 + m));
    out[i] = fastSin(carrier) * env;
  }
  applyAttackRamp(out, sampleRate, 0.001);
  return out;
}

/**
 * Industrial anvil hit: inharmonic FM clang (non-integer modulator ratio, so
 * the partials never line up into a harmonic series) with pitch following the
 * note, plus a bright impact-noise transient. For a relentless machine boss.
 */
export const metalHit: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.1, 1);
  const decay = clamp(ctx.dur + 0.8, 0.5, 2.4);
  const left = metalOperator(ctx, decay, -9, 3.43, 3.2 + v * 2.4);
  const right = metalOperator(ctx, decay, 9, 2.76, 3.0 + v * 2.2);
  const noise = ctxNoise(ctx);
  const clangFilter = biquad('bandpass', ctx.sampleRate, 4200, 0.9);
  const clangLen = Math.min(left.length, Math.round(0.01 * ctx.sampleRate));
  for (let i = 0; i < clangLen; i++) {
    const n = clangFilter.process(noise()) * (1 - i / clangLen) * 0.5 * v;
    left[i] = left[i]! + n;
    right[i] = right[i]! + n;
  }
  return pairToStereo(left, right, 0.22 * (0.4 + v * 0.7));
};
