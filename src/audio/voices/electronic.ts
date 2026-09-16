/**
 * Electronic voices: pop-electronic synths and a small drum-machine kit for
 * FFX-2-style dance tracks. The tonal synths reuse `renderEnsemble` (the same
 * detuned-oscillator-bank-into-a-swept-filter backbone as pad/strings/brass);
 * the drums build straight from oscillators and noise like `percussion.ts`.
 */

import { makeStereo } from '../dsp/buffer.ts';
import { fastSin, wrapPhase } from '../dsp/oscillators.ts';
import { expFall } from '../dsp/envelope.ts';
import { biquad } from '../dsp/filter.ts';
import { saturate } from '../dsp/shaper.ts';
import { clamp, ctxNoise, toStereo } from './common.ts';
import type { Voice, VoiceCtx } from './common.ts';
import { renderEnsemble } from './sustained.ts';

/** Velocity curve shared by the synths below: `sensitivity` 0 = velocity does nothing, 1 = fully velocity-scaled. */
function velGain(ctx: VoiceCtx, base: number, sensitivity = 0.75): number {
  return base * (1 - sensitivity + sensitivity * clamp(ctx.velocity, 0.05, 1));
}

/**
 * Seven-saw unison stack with wide stereo spread; velocity opens the filter.
 * Bright enough for a pop lead, and with a longer held note it settles into a
 * pad — the same voice covers both jobs.
 */
export const supersaw: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.05, 1);
  return renderEnsemble(ctx, {
    count: 7,
    detune: 38,
    wave: 'saw',
    env: { attack: 0.012, decay: 0.4, sustain: 0.82, release: 0.28, attackCurve: 1 },
    cutoffFrom: 650 + v * 350,
    cutoffTo: 1800 + v * 5200,
    filterTime: 0.09,
    resonance: 0.9,
    keyTrack: 0.35,
    vibratoRate: 5.5,
    vibratoDepth: 0.015,
    vibratoDelay: 0.6,
    spread: 0.95,
    drive: 1.1,
    gain: velGain(ctx, 0.22, 0.6),
  });
};

/**
 * Mono saw+square bass through a resonant low-pass with a fast filter-envelope
 * pluck (the filter snaps from bright down to dull in under 80ms). Sits well
 * in C1-C3. Built from two centred `renderEnsemble` calls summed together
 * because the ensemble renderer only takes one waveform at a time.
 */
export const synthBass: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.05, 1);
  const shared = {
    count: 1,
    detune: 0,
    env: { attack: 0.003, decay: 0.16, sustain: 0.55, release: 0.09, attackCurve: 1 },
    cutoffFrom: 2200 + v * 1200,
    cutoffTo: 260 + v * 260,
    filterTime: 0.075,
    resonance: 1.6,
    keyTrack: 0.25,
    spread: 0,
    drive: 1.7,
  };
  const saw = renderEnsemble(ctx, { ...shared, wave: 'saw' as const, gain: velGain(ctx, 0.26, 0.5) });
  const square = renderEnsemble(ctx, { ...shared, wave: 'square' as const, gain: velGain(ctx, 0.16, 0.5) });
  const n = Math.max(saw.left.length, square.left.length);
  const out = makeStereo(n);
  for (let i = 0; i < n; i++) {
    out.left[i] = (saw.left[i] ?? 0) + (square.left[i] ?? 0);
    out.right[i] = (saw.right[i] ?? 0) + (square.right[i] ?? 0);
  }
  return out;
};

/** Bright short saw pluck with a very fast filter decay, for trance/pop 16th-note arpeggios. */
export const arpPluck: Voice = (ctx) => {
  const v = clamp(ctx.velocity, 0.05, 1);
  return renderEnsemble(ctx, {
    count: 3,
    detune: 14,
    wave: 'saw',
    env: { attack: 0.004, decay: 0.1, sustain: 0.05, release: 0.05, attackCurve: 1 },
    cutoffFrom: 5200 + v * 1500,
    cutoffTo: 500,
    filterTime: 0.045,
    resonance: 1.6,
    keyTrack: 0.4,
    spread: 0.5,
    drive: 1.3,
    gain: velGain(ctx, 0.24, 0.7),
    tail: 0.05,
  });
};

/**
 * 808-style sub kick: the pitch drops fast from a few octaves up into a long
 * pitched boom, plus a click transient. Note duration extends the decay, so a
 * track can dial in a short thump or a room-filling boom from the tracker.
 */
export const kick808: Voice = (ctx) => {
  const { sampleRate, freq } = ctx;
  const v = clamp(ctx.velocity, 0.1, 1);
  const decay = clamp(ctx.dur + 0.15, 0.2, 2.2);
  const total = Math.max(2, Math.ceil((decay + 0.15) * sampleRate));
  const buf = new Float32Array(total);
  const base = clamp(freq > 0 ? freq : 55, 28, 90);
  let phase = 0;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const f = base + base * 5.5 * Math.exp(-t / 0.025);
    phase = wrapPhase(phase + f / sampleRate);
    const env = expFall(Math.min(1, t / decay), 4.2);
    buf[i] = fastSin(phase) * env * v;
  }
  const noise = ctxNoise(ctx);
  const click = biquad('bandpass', sampleRate, 2600, 1.1);
  const clickLen = Math.round(0.006 * sampleRate);
  for (let i = 0; i < clickLen; i++) {
    buf[i] = buf[i]! + click.process(noise()) * (1 - i / clickLen) * 0.4 * v;
  }
  for (let i = 0; i < total; i++) buf[i] = saturate(buf[i]!, 1.3);
  return toStereo(buf, 0);
};

/** Three flammed noise bursts plus a short band-passed tail. */
export const clap: Voice = (ctx) => {
  const { sampleRate } = ctx;
  const v = clamp(ctx.velocity, 0.1, 1);
  const total = Math.max(2, Math.ceil(0.32 * sampleRate));
  const buf = new Float32Array(total);
  const noise = ctxNoise(ctx);
  const burst = biquad('bandpass', sampleRate, 1400, 1.1);
  const flamOffsets = [0, 0.011, 0.023];
  const burstLen = Math.round(0.012 * sampleRate);
  for (const offset of flamOffsets) {
    const start = Math.round(offset * sampleRate);
    for (let i = 0; i < burstLen && start + i < total; i++) {
      const e = 1 - i / burstLen;
      buf[start + i] = buf[start + i]! + burst.process(noise()) * e * e * 0.6 * v;
    }
  }
  const tailStart = Math.round(flamOffsets[flamOffsets.length - 1]! * sampleRate) + burstLen;
  const tailLen = Math.max(1, total - tailStart);
  const tail = biquad('bandpass', sampleRate, 1700, 0.8);
  for (let i = 0; i < tailLen; i++) {
    const x = i / tailLen;
    const e = expFall(x, 3.2);
    buf[tailStart + i] = buf[tailStart + i]! + tail.process(noise()) * e * 0.3 * v;
  }
  for (let i = 0; i < total; i++) buf[i] = saturate(buf[i]!, 1.1);
  return toStereo(buf, 0.05);
};

/** Tight electronic snare: a short tuned sine body under bright, EQ'd noise. */
export const snare909: Voice = (ctx) => {
  const { sampleRate } = ctx;
  const v = clamp(ctx.velocity, 0.1, 1);
  const total = Math.max(2, Math.ceil(0.22 * sampleRate));
  const buf = new Float32Array(total);
  let phase = 0;
  const bodyFreq = 220;
  const bodyDecay = 0.045;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    phase = wrapPhase(phase + bodyFreq / sampleRate);
    const e = expFall(Math.min(1, t / bodyDecay), 6);
    buf[i] = fastSin(phase) * e * 0.5 * v;
  }
  const noise = ctxNoise(ctx);
  const hp = biquad('highpass', sampleRate, 1600, 0.7);
  const peak = biquad('peak', sampleRate, 6500, 1.0, 4);
  const noiseDecay = 0.16;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const e = expFall(Math.min(1, t / noiseDecay), 4.5);
    buf[i] = buf[i]! + peak.process(hp.process(noise())) * e * 0.62 * v;
  }
  for (let i = 0; i < total; i++) buf[i] = saturate(buf[i]!, 1.25);
  return toStereo(buf, 0.02);
};
