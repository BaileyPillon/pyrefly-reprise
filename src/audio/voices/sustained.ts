/** Bowed / blown / sung voices: pad, strings, choir, brass, bass. */

import { makeStereo, type Stereo } from '../dsp/buffer.ts';
import { waveAt, wrapPhase, type WaveName } from '../dsp/oscillators.ts';
import { adsrAt, type AdsrParams } from '../dsp/envelope.ts';
import { Svf, biquad } from '../dsp/filter.ts';
import { Lfo } from '../dsp/lfo.ts';
import { panGains, saturate } from '../dsp/shaper.ts';
import { clamp, ctxNoise, semitoneRatio, voiceLength } from './common.ts';
import type { Voice, VoiceCtx } from './common.ts';

export interface EnsembleOptions {
  /** How many detuned oscillators. */
  count: number;
  /** Total detune spread in cents (± half of this). */
  detune: number;
  wave: WaveName;
  /** Pulse width when wave is 'pulse'. */
  width?: number;
  /** PWM depth (0..0.4) and rate in Hz. */
  pwm?: number;
  pwmRate?: number;
  /** Sine one octave below, mixed in at this gain. */
  sub?: number;
  env: AdsrParams;
  /** Filter cutoff in Hz at note-on and after `filterTime` seconds. */
  cutoffFrom: number;
  cutoffTo: number;
  filterTime?: number;
  resonance?: number;
  /** Cutoff follows pitch by this factor (1 = fully tracking). */
  keyTrack?: number;
  vibratoRate?: number;
  /** Vibrato depth in semitones. */
  vibratoDepth?: number;
  vibratoDelay?: number;
  /** Stereo spread of the detuned oscillators, 0..1. */
  spread?: number;
  /** Breath/bow noise mixed into the signal before the filter. */
  noise?: number;
  /** tanh drive applied after the filter. */
  drive?: number;
  gain: number;
  /** Extra seconds rendered past the release (for the filter to settle). */
  tail?: number;
}

/**
 * Detuned oscillator bank → per-channel state-variable low-pass with an
 * envelope-swept cutoff → amp envelope. This one function is the backbone of
 * every sustained instrument in the game.
 */
export function renderEnsemble(ctx: VoiceCtx, o: EnsembleOptions): Stereo {
  const { sampleRate } = ctx;
  const total = voiceLength(ctx, (o.env.release ?? 0.2) + (o.tail ?? 0.05));
  const out = makeStereo(total);
  const count = Math.max(1, o.count);
  const phases = new Float32Array(count);
  const ratios = new Float32Array(count);
  const gainsL = new Float32Array(count);
  const gainsR = new Float32Array(count);
  const spread = o.spread ?? 0.6;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5;
    ratios[i] = Math.pow(2, (t * o.detune) / 1200);
    phases[i] = wrapPhase(i * 0.3719 + 0.11);
    const g = panGains(t * 2 * spread);
    gainsL[i] = g.left;
    gainsR[i] = g.right;
  }
  const normalise = 1 / Math.sqrt(count);
  const vib = new Lfo({
    rate: o.vibratoRate ?? 5.2,
    depth: o.vibratoDepth ?? 0,
    fadeIn: o.vibratoDelay ?? 0.25,
    phase: 0.25,
  });
  const pwmLfo = new Lfo({ rate: o.pwmRate ?? 0.7, depth: o.pwm ?? 0, phase: 0.1 });
  const filterL = new Svf(sampleRate, o.cutoffFrom, o.resonance ?? 0.8);
  const filterR = new Svf(sampleRate, o.cutoffFrom, o.resonance ?? 0.8);
  const noiseGen = ctxNoise(ctx);
  const noiseAmt = o.noise ?? 0;
  const keyTrack = o.keyTrack ?? 0;
  const pitchFactor = keyTrack > 0 ? Math.pow(ctx.freq / 261.63, keyTrack) : 1;
  const filterSamples = Math.max(1, Math.round((o.filterTime ?? 0.3) * sampleRate));
  const drive = o.drive ?? 0;
  const subGain = o.sub ?? 0;
  let subPhase = 0;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    if ((i & 31) === 0) {
      const x = Math.min(1, i / filterSamples);
      const shaped = 1 - (1 - x) * (1 - x);
      const cutoff = (o.cutoffFrom + (o.cutoffTo - o.cutoffFrom) * shaped) * pitchFactor;
      filterL.setCutoff(cutoff, o.resonance ?? 0.8);
      filterR.setCutoff(cutoff, o.resonance ?? 0.8);
    }
    const bend = semitoneRatio(vib.next(sampleRate));
    const width = clamp((o.width ?? 0.5) + pwmLfo.next(sampleRate), 0.08, 0.92);
    let l = 0;
    let r = 0;
    for (let v = 0; v < count; v++) {
      const f = ctx.freq * ratios[v]! * bend;
      const dt = f / sampleRate;
      const s = waveAt(o.wave, phases[v]!, dt, width);
      phases[v] = wrapPhase(phases[v]! + dt);
      l += s * gainsL[v]!;
      r += s * gainsR[v]!;
    }
    l *= normalise;
    r *= normalise;
    if (subGain > 0) {
      const sf = (ctx.freq * 0.5 * bend) / sampleRate;
      const s = Math.sin(subPhase * Math.PI * 2) * subGain;
      subPhase = wrapPhase(subPhase + sf);
      l += s;
      r += s;
    }
    if (noiseAmt > 0) {
      const nz = noiseGen() * noiseAmt;
      l += nz;
      r += nz;
    }
    let ol = filterL.process(l);
    let or = filterR.process(r);
    if (drive > 0) {
      ol = saturate(ol, drive);
      or = saturate(or, drive);
    }
    const env = adsrAt(o.env, t, ctx.dur) * o.gain;
    out.left[i] = ol * env;
    out.right[i] = or * env;
  }
  return out;
}

function velGain(ctx: VoiceCtx, base: number, sensitivity = 0.75): number {
  return base * (1 - sensitivity + sensitivity * clamp(ctx.velocity, 0.05, 1));
}

/** Warm synth pad: six detuned saws under a slow filter opening. */
export const pad: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 6,
    detune: 26,
    wave: 'saw',
    env: { attack: 0.5, decay: 1.2, sustain: 0.78, release: 1.4, attackCurve: 1.6 },
    cutoffFrom: 320,
    cutoffTo: 1900,
    filterTime: 1.6,
    resonance: 0.9,
    keyTrack: 0.35,
    vibratoRate: 3.4,
    vibratoDepth: 0.04,
    vibratoDelay: 0.9,
    spread: 0.85,
    sub: 0.22,
    gain: velGain(ctx, 0.2, 0.55),
    tail: 0.3,
  });
};

/** String ensemble: slow bow attack, gentle vibrato, dark-ish top. */
export const strings: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 7,
    detune: 17,
    wave: 'saw',
    env: { attack: 0.22, decay: 0.9, sustain: 0.85, release: 0.55, attackCurve: 1.8 },
    cutoffFrom: 900,
    cutoffTo: 3000,
    filterTime: 0.9,
    resonance: 0.7,
    keyTrack: 0.5,
    vibratoRate: 5.1,
    vibratoDepth: 0.08,
    vibratoDelay: 0.45,
    spread: 0.75,
    noise: 0.008,
    gain: velGain(ctx, 0.19),
  });
};

/** Cellos and basses: same bow, lower register, rounder. */
export const stringsLow: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 5,
    detune: 13,
    wave: 'saw',
    env: { attack: 0.16, decay: 0.8, sustain: 0.88, release: 0.6, attackCurve: 1.6 },
    cutoffFrom: 420,
    cutoffTo: 1250,
    filterTime: 0.7,
    resonance: 0.75,
    keyTrack: 0.4,
    vibratoRate: 4.4,
    vibratoDepth: 0.06,
    vibratoDelay: 0.5,
    spread: 0.5,
    noise: 0.006,
    gain: velGain(ctx, 0.23),
  });
};

/** Short, hard string ostinato articulation (spiccato-ish) for battle riffs. */
export const stringsShort: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 4,
    detune: 14,
    wave: 'saw',
    env: { attack: 0.012, decay: 0.16, sustain: 0.25, release: 0.13, attackCurve: 1 },
    cutoffFrom: 1600,
    cutoffTo: 3400,
    filterTime: 0.05,
    resonance: 0.85,
    keyTrack: 0.45,
    spread: 0.6,
    gain: velGain(ctx, 0.2),
  });
};

const FORMANTS = [
  { freq: 620, q: 7, gain: 1 },
  { freq: 1120, q: 9, gain: 0.55 },
  { freq: 2680, q: 11, gain: 0.3 },
];

/** Choir "ah": triangle stack pushed through three formant peaks plus breath. */
export const choir: Voice = (ctx) => {
  const base = renderEnsemble(ctx, {
    count: 5,
    detune: 22,
    wave: 'tri',
    env: { attack: 0.42, decay: 1.0, sustain: 0.82, release: 0.9, attackCurve: 1.7 },
    cutoffFrom: 2200,
    cutoffTo: 3400,
    filterTime: 1.2,
    resonance: 0.7,
    vibratoRate: 4.7,
    vibratoDepth: 0.1,
    vibratoDelay: 0.6,
    spread: 0.9,
    noise: 0.02,
    gain: velGain(ctx, 0.5, 0.6),
  });
  const out = makeStereo(base.left.length);
  for (const f of FORMANTS) {
    const fl = biquad('bandpass', ctx.sampleRate, f.freq, f.q);
    const fr = biquad('bandpass', ctx.sampleRate, f.freq, f.q);
    for (let i = 0; i < base.left.length; i++) {
      out.left[i] = out.left[i]! + fl.process(base.left[i]!) * f.gain;
      out.right[i] = out.right[i]! + fr.process(base.right[i]!) * f.gain;
    }
  }
  // Keep a little of the raw stack so low notes still have a body.
  for (let i = 0; i < base.left.length; i++) {
    out.left[i] = out.left[i]! * 0.75 + base.left[i]! * 0.3;
    out.right[i] = out.right[i]! * 0.75 + base.right[i]! * 0.3;
  }
  return out;
};

/** Brass section: filter sweep on the attack, saturated, a touch of vibrato. */
export const brass: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 4,
    detune: 11,
    wave: 'saw',
    env: { attack: 0.055, decay: 0.35, sustain: 0.8, release: 0.22, attackCurve: 1.3 },
    cutoffFrom: 600,
    cutoffTo: 3600,
    filterTime: 0.14,
    resonance: 1.1,
    keyTrack: 0.6,
    vibratoRate: 5.6,
    vibratoDepth: 0.06,
    vibratoDelay: 0.35,
    spread: 0.5,
    drive: 1.6,
    gain: velGain(ctx, 0.24),
  });
};

/** Short brass stab for battle accents. */
export const brassStab: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 4,
    detune: 13,
    wave: 'saw',
    env: { attack: 0.018, decay: 0.2, sustain: 0.35, release: 0.16, attackCurve: 1 },
    cutoffFrom: 900,
    cutoffTo: 4200,
    filterTime: 0.06,
    resonance: 1.2,
    keyTrack: 0.6,
    spread: 0.45,
    drive: 2.2,
    gain: velGain(ctx, 0.26),
  });
};

/** Round electric-ish bass with a sub sine underneath. */
export const bass: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 2,
    detune: 8,
    wave: 'saw',
    env: { attack: 0.006, decay: 0.28, sustain: 0.6, release: 0.1, attackCurve: 1 },
    cutoffFrom: 1500,
    cutoffTo: 520,
    filterTime: 0.22,
    resonance: 1.0,
    keyTrack: 0.3,
    spread: 0.12,
    sub: 0.45,
    drive: 1.4,
    gain: velGain(ctx, 0.3, 0.5),
  });
};

/** Pure low sine sub for the boss theme's floor. */
export const subBass: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 1,
    detune: 0,
    wave: 'sine',
    env: { attack: 0.03, decay: 0.5, sustain: 0.8, release: 0.35, attackCurve: 1 },
    cutoffFrom: 260,
    cutoffTo: 200,
    filterTime: 0.4,
    resonance: 0.6,
    spread: 0,
    gain: velGain(ctx, 0.42, 0.4),
  });
};

/** Hollow PWM lead used for machina-flavoured cues. */
export const pwmLead: Voice = (ctx) => {
  return renderEnsemble(ctx, {
    count: 2,
    detune: 9,
    wave: 'pulse',
    width: 0.4,
    pwm: 0.18,
    pwmRate: 0.55,
    env: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 0.2, attackCurve: 1 },
    cutoffFrom: 1200,
    cutoffTo: 2600,
    filterTime: 0.25,
    resonance: 1.3,
    keyTrack: 0.5,
    spread: 0.35,
    drive: 1.2,
    gain: velGain(ctx, 0.2),
  });
};
