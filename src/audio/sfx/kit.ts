/**
 * Builders for the SFX bank.
 *
 * Every effect is a function of sample rate returning a short stereo buffer, so
 * the bank can be synthesised once at startup (a few milliseconds each) and
 * handed to Web Audio as AudioBuffers — no files to download, no licensing risk.
 */

import { makeStereo, mixStereoInto, peakOfStereo, scaleStereo } from '../dsp/buffer.ts';
import type { Stereo } from '../dsp/buffer.ts';
import { fastSin, makeNoise, hashSeed, waveAt, wrapPhase } from '../dsp/oscillators.ts';
import type { WaveName } from '../dsp/oscillators.ts';
import { expFall } from '../dsp/envelope.ts';
import { Svf, biquad } from '../dsp/filter.ts';
import { crunch, panGains, saturate } from '../dsp/shaper.ts';
import { getInstrument } from '../instruments.ts';
import { pitchToFreq, type Pitch } from '../score.ts';

export interface SfxDef {
  /** Short description for the debug list. */
  about: string;
  render: (sampleRate: number) => Stereo;
}

export function blank(sampleRate: number, seconds: number): Stereo {
  return makeStereo(Math.max(2, Math.ceil(seconds * sampleRate)));
}

/** Mix `src` into `dst` at `atSec`, panned and scaled. */
export function addAt(dst: Stereo, src: Stereo, atSec: number, sampleRate: number, gain = 1, pan = 0): void {
  const g = panGains(pan);
  mixStereoInto(dst, src, Math.round(atSec * sampleRate), gain * g.left * 1.41, gain * g.right * 1.41);
}

/** Normalise a finished effect so the bank is roughly level-matched. */
export function trim(buf: Stereo, target = 0.8): Stereo {
  const peak = peakOfStereo(buf);
  if (peak > 0) scaleStereo(buf, target / peak);
  return buf;
}

export interface ToneOptions {
  freq: number;
  /** Glide to this frequency across the effect. */
  toFreq?: number;
  /** 1 = linear glide in log space, >1 = fast at first. */
  glide?: number;
  wave?: WaveName;
  width?: number;
  dur: number;
  attack?: number;
  /** Exponential steepness of the decay, default 4. */
  curve?: number;
  /** Hold at full level for this fraction of the duration before decaying. */
  hold?: number;
  gain?: number;
  pan?: number;
  cutoff?: number;
  cutoffTo?: number;
  resonance?: number;
  vibrato?: number;
  vibratoRate?: number;
  drive?: number;
}

/** A single shaped oscillator: the workhorse for UI beeps, zaps and whooshes. */
export function tone(sampleRate: number, o: ToneOptions): Stereo {
  const n = Math.max(2, Math.ceil(o.dur * sampleRate));
  const out = makeStereo(n);
  const g = panGains(o.pan ?? 0);
  const gain = o.gain ?? 0.5;
  const attack = Math.max(1, Math.round((o.attack ?? 0.004) * sampleRate));
  const hold = Math.round((o.hold ?? 0) * n);
  const filter = o.cutoff ? new Svf(sampleRate, o.cutoff, o.resonance ?? 1) : null;
  let phase = 0;
  let vibPhase = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const glide = Math.pow(x, o.glide ?? 1);
    let f = o.toFreq ? o.freq * Math.pow(o.toFreq / o.freq, glide) : o.freq;
    if (o.vibrato) {
      vibPhase = wrapPhase(vibPhase + (o.vibratoRate ?? 6) / sampleRate);
      f *= 1 + fastSin(vibPhase) * o.vibrato;
    }
    const dt = f / sampleRate;
    let s = waveAt(o.wave ?? 'sine', phase, dt, o.width ?? 0.5);
    phase = wrapPhase(phase + dt);
    if (filter) {
      if ((i & 15) === 0 && o.cutoffTo) {
        filter.setCutoff(o.cutoff! * Math.pow(o.cutoffTo / o.cutoff!, glide), o.resonance ?? 1);
      }
      s = filter.process(s);
    }
    if (o.drive) s = saturate(s, o.drive);
    const decayX = i < hold ? 0 : (i - hold) / Math.max(1, n - hold);
    const env = Math.min(1, i / attack) * expFall(decayX, o.curve ?? 4);
    out.left[i] = s * env * gain * g.left;
    out.right[i] = s * env * gain * g.right;
  }
  return out;
}

export interface NoiseOptions {
  dur: number;
  /** Band-pass centre. */
  freq: number;
  freqTo?: number;
  q?: number;
  gain?: number;
  pan?: number;
  attack?: number;
  curve?: number;
  hold?: number;
  seed?: number;
  /** Add a high-pass at this frequency before the band-pass. */
  highpass?: number;
  drive?: number;
}

/** Band-passed noise burst: impacts, wind, steam, footsteps, cymbals. */
export function noiseBurst(sampleRate: number, o: NoiseOptions): Stereo {
  const n = Math.max(2, Math.ceil(o.dur * sampleRate));
  const out = makeStereo(n);
  const g = panGains(o.pan ?? 0);
  const gain = o.gain ?? 0.5;
  const seed = o.seed ?? hashSeed(`${o.freq}:${o.dur}`);
  const nl = makeNoise(seed);
  const nr = makeNoise(seed ^ 0x5bf03635);
  const hpL = o.highpass ? biquad('highpass', sampleRate, o.highpass, 0.7) : null;
  const hpR = o.highpass ? biquad('highpass', sampleRate, o.highpass, 0.7) : null;
  const svfL = new Svf(sampleRate, o.freq, o.q ?? 1);
  const svfR = new Svf(sampleRate, o.freq, o.q ?? 1);
  const attack = Math.max(1, Math.round((o.attack ?? 0.002) * sampleRate));
  const hold = Math.round((o.hold ?? 0) * n);
  for (let i = 0; i < n; i++) {
    const x = i / n;
    if ((i & 15) === 0 && o.freqTo) {
      const f = o.freq * Math.pow(o.freqTo / o.freq, x);
      svfL.setCutoff(f, o.q ?? 1);
      svfR.setCutoff(f, o.q ?? 1);
    }
    let l = nl();
    let r = nr();
    if (hpL && hpR) {
      l = hpL.process(l);
      r = hpR.process(r);
    }
    svfL.process(l);
    svfR.process(r);
    l = svfL.bp;
    r = svfR.bp;
    if (o.drive) {
      l = crunch(l, o.drive);
      r = crunch(r, o.drive);
    }
    const decayX = i < hold ? 0 : (i - hold) / Math.max(1, n - hold);
    const env = Math.min(1, i / attack) * expFall(decayX, o.curve ?? 4);
    out.left[i] = l * env * gain * g.left;
    out.right[i] = r * env * gain * g.right;
  }
  return out;
}

export interface FmOptions {
  freq: number;
  ratio?: number;
  index?: number;
  /** Modulation index at the end of the effect. */
  indexTo?: number;
  dur: number;
  gain?: number;
  pan?: number;
  attack?: number;
  curve?: number;
  crunchAmount?: number;
  toFreq?: number;
}

/** Two-operator FM: bells, zaps, roars, machina whines. */
export function fmTone(sampleRate: number, o: FmOptions): Stereo {
  const n = Math.max(2, Math.ceil(o.dur * sampleRate));
  const out = makeStereo(n);
  const g = panGains(o.pan ?? 0);
  const gain = o.gain ?? 0.5;
  const ratio = o.ratio ?? 2;
  const attack = Math.max(1, Math.round((o.attack ?? 0.003) * sampleRate));
  let carrier = 0;
  let modulator = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const f = o.toFreq ? o.freq * Math.pow(o.toFreq / o.freq, x) : o.freq;
    const index = (o.index ?? 2) + ((o.indexTo ?? o.index ?? 2) - (o.index ?? 2)) * x;
    modulator = wrapPhase(modulator + (f * ratio) / sampleRate);
    const mod = fastSin(modulator) * index;
    carrier = wrapPhase(carrier + (f / sampleRate) * (1 + mod * 0.25));
    let s = fastSin(carrier);
    if (o.crunchAmount) s = crunch(s, o.crunchAmount);
    const env = Math.min(1, i / attack) * expFall(x, o.curve ?? 4);
    out.left[i] = s * env * gain * g.left;
    out.right[i] = s * env * gain * g.right;
  }
  return out;
}

/** Borrow a musical instrument for an effect (fanfares, harp glisses, bells). */
export function voiceNote(
  sampleRate: number,
  instrument: string,
  pitch: Pitch,
  dur: number,
  velocity = 0.8,
): Stereo {
  return getInstrument(instrument)({
    sampleRate,
    freq: pitchToFreq(pitch),
    dur,
    velocity,
    seed: hashSeed(`${instrument}:${String(pitch)}:${dur}`),
  });
}
