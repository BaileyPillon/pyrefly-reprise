/**
 * Sound design as data.
 *
 * Bailey's verdict on the old bank was that it was "too arcade-y". It was: every
 * effect was an oscillator with an envelope on it, written inline, and the ear
 * hears a synthesiser the moment a menu tick is a filtered pulse wave.
 *
 * So an effect stopped being code and became a **layered design**: a list of
 * materials struck at times, in one key, with tails that bloom. The same design
 * renders two ways:
 *
 *   offline (`tools/audio/render.mjs`)  every `note` layer is a real recorded
 *                                       instrument from the sample libraries,
 *                                       mixed into the sprite the game ships;
 *   in the browser                      the same layers, played by the
 *                                       synthesised voices in `../voices` —
 *                                       the safety net for the milliseconds
 *                                       before the sprite has decoded, and for
 *                                       any browser that refuses it.
 *
 * Same arrangement either way. Only the timbre differs, which is exactly the
 * axis the pre-render exists to improve.
 *
 * The rules in `docs/audio/THEMES.md` § "Sound-effect rules" are enforced here
 * rather than trusted to each author:
 *
 *   - nothing shorter than 30 ms, and every cue fades out rather than stopping;
 *   - a minimum attack per category, so no UI sound starts on a cliff;
 *   - a low-pass ceiling per category, because the fizz above 10 kHz is half of
 *     what "arcade-y" means;
 *   - no square, saw or pulse wave exists in this module's vocabulary at all.
 *     A `tone` layer is a sine or a triangle. That is the whole list.
 */

import { makeStereo, mixStereoInto, peakOfStereo, scaleStereo, fadeIn, fadeOut } from '../dsp/buffer.ts';
import type { Stereo } from '../dsp/buffer.ts';
import { biquad } from '../dsp/filter.ts';
import { hashSeed } from '../dsp/oscillators.ts';
import { panGains } from '../dsp/shaper.ts';
import { getInstrument, hasInstrument } from '../instruments.ts';
import { pitchToFreq, type Pitch } from '../score.ts';
import { fmTone, noiseBurst, tone } from './kit.ts';

// ---------------------------------------------------------------- categories

/**
 * What a cue is for. Decides its loudness, how much top it keeps, and how
 * softly it is allowed to start — a cursor tick and a summon cannot share one
 * set of numbers.
 */
export type SfxCategory =
  /** Menu ticks and chimes: quiet, soft-edged, heard a hundred times an hour. */
  | 'ui'
  /** Steel, fists, thuds. Weight below 90 Hz and movement before the transient. */
  | 'impact'
  /** Swings and shots: air first, material second. */
  | 'weapon'
  /** Magic: choir, glass and air, with a tail that blooms into the hall. */
  | 'spell'
  /** Stings, fanfares, arrivals — the loud end, used sparingly. */
  | 'flourish'
  /** Wind, rooms, distant voices. Long, soft, never in front. */
  | 'ambience';

interface CategoryRule {
  /** Peak the finished cue is normalised to in the runtime bank. */
  peak: number;
  /** One-pole-pair low-pass over the finished mix, in Hz. */
  top: number;
  /** Minimum fade-in, seconds. */
  attack: number;
  /** Fade-out applied to the tail, seconds. */
  release: number;
  /** Target integrated loudness for the offline render, LUFS. */
  lufs: number;
}

export const CATEGORY_RULES: Record<SfxCategory, CategoryRule> = {
  ui: { peak: 0.5, top: 11_000, attack: 0.006, release: 0.03, lufs: -24 },
  impact: { peak: 0.9, top: 12_000, attack: 0.001, release: 0.04, lufs: -16 },
  weapon: { peak: 0.82, top: 13_000, attack: 0.002, release: 0.04, lufs: -18 },
  spell: { peak: 0.85, top: 12_000, attack: 0.004, release: 0.06, lufs: -15 },
  flourish: { peak: 0.92, top: 13_000, attack: 0.003, release: 0.08, lufs: -14 },
  ambience: { peak: 0.6, top: 10_000, attack: 0.02, release: 0.12, lufs: -22 },
};

// -------------------------------------------------------------------- layers

interface LayerBase {
  /** Seconds from the start of the cue. */
  at?: number;
  gain?: number;
  /** -1 left .. 1 right. */
  pan?: number;
}

/**
 * A note on a real instrument: the whole point of the redesign. Offline this is
 * a recorded harp, tam-tam, choir or celesta; at runtime it is the synthesised
 * voice of the same name (see {@link RUNTIME_STAND_INS}).
 */
export interface NoteLayer extends LayerBase {
  kind: 'note';
  /** Instrument name — a sampled preset offline, a synth voice at runtime. */
  instrument: string;
  /** One pitch, or a chord. */
  pitch: Pitch | Pitch[];
  /** Seconds the note is held (its tail rings on past this). */
  dur: number;
  /** 0..1. */
  vel?: number;
  /** Spread a chord into an arpeggio, seconds between notes. */
  roll?: number;
  /** Extra fade-in on the rendered note — the soft-attack rule. */
  attack?: number;
  /** Fade-out across the last N seconds of the note. */
  fade?: number;
  /** Play it backwards: the reverse swell under a charge or a siphon. */
  reverse?: boolean;
  /** Resample: 0.5 drops an octave and doubles the length (a pitched-down tam-tam). */
  speed?: number;
  lowpass?: number;
  highpass?: number;
  /** Deterministic variation between two uses of the same note in one cue. */
  seed?: number;
}

/** Filtered noise: cloth, breath, air, a bow scrape, a distant hiss. */
export interface AirLayer extends LayerBase {
  kind: 'air';
  dur: number;
  /** Band-pass centre. */
  freq: number;
  freqTo?: number;
  q?: number;
  attack?: number;
  /** Exponential steepness of the decay; 1 is nearly flat, 6 is a snap. */
  curve?: number;
  /** Fraction of the duration held at full before the decay. */
  hold?: number;
  highpass?: number;
  seed?: number;
  /** Play the burst backwards: air rushing in rather than away. */
  reverse?: boolean;
  /** Sweep the pan across the cue, for a swing that passes the listener. */
  panTo?: number;
}

/** Sine weight below 90 Hz. Every impact has one; nothing else may. */
export interface SubLayer extends LayerBase {
  kind: 'sub';
  dur: number;
  freq: number;
  toFreq?: number;
  attack?: number;
  curve?: number;
  hold?: number;
}

/** A pure sine or triangle. No other waveform exists in this vocabulary. */
export interface ToneLayer extends LayerBase {
  kind: 'tone';
  dur: number;
  freq: number;
  toFreq?: number;
  wave?: 'sine' | 'tri';
  attack?: number;
  curve?: number;
  hold?: number;
  vibrato?: number;
  vibratoRate?: number;
  lowpass?: number;
}

/**
 * A struck metal partial: the ring inside a bell, the edge of a blade, the
 * shimmer over a shattering crystal. Two-operator FM at a low index — high
 * indices are how FM becomes a 1987 arcade cabinet, so the renderer clamps it.
 */
export interface RingLayer extends LayerBase {
  kind: 'ring';
  freq: number;
  dur: number;
  /** Modulator:carrier. Inharmonic ratios read as metal, integers as a bell. */
  ratio?: number;
  index?: number;
  indexTo?: number;
  attack?: number;
  curve?: number;
  lowpass?: number;
}

export type DesignLayer = NoteLayer | AirLayer | SubLayer | ToneLayer | RingLayer;

/** The maximum FM index this module will render. Above it, FM buzzes. */
const MAX_FM_INDEX = 3.2;

// -------------------------------------------------------------------- design

export interface SfxDesign {
  /** One line for the debug list — what it is, and what it is made of. */
  about: string;
  category: SfxCategory;
  /** Total length in seconds, tail included. Hard limit 3.9 s. */
  length: number;
  layers: DesignLayer[];
  /** Override the category's low-pass ceiling (cymbals and breath want more). */
  top?: number;
  /** Override the category's normalisation peak. */
  peak?: number;
  /** Override the category's minimum fade-in. */
  attack?: number;
}

// --------------------------------------------------------------- note voices

/**
 * What a sampled instrument becomes when the browser has to render the design
 * itself. The sampled bank has 66 instruments; the synthesised one has 40, so
 * the fallback names the nearest relative rather than falling silent.
 *
 * These are honestly worse — a synthesised "tam-tam" is a cymbal swell with the
 * top rolled off — which is the point of shipping the sampled render.
 */
export const RUNTIME_STAND_INS: Record<string, string> = {
  glockenspiel: 'celesta',
  vibraphone: 'mallet',
  chimes: 'bell',
  triangle: 'celesta',
  harpsichord: 'pluck',
  'choir-ooh': 'choir',
  soprano: 'choir',
  'space-voice': 'pad',
  'tam-tam': 'crash',
  'cymbal-swell': 'crash',
  'bass-drum': 'taiko',
  'drum-kit': 'snare',
  'orchestra-hit': 'brass-stab',
  'strings-trem': 'strings',
  pizzicato: 'pluck',
  'violin-solo': 'strings',
  'cello-solo': 'strings-low',
  oboe: 'flute',
  clarinet: 'flute',
  bassoon: 'bass',
  horn: 'brass',
  trumpet: 'brass',
  trombone: 'brass',
  'guitar-clean': 'guitar-dist',
  'guitar-lead': 'guitar-dist',
  'guitar-nylon': 'harp',
  'guitar-steel': 'harp',
  'bass-pick': 'bass',
  'bass-upright': 'bass',
  'organ-rock': 'organ',
  'organ-drawbar': 'organ',
  'pad-synth': 'pad',
  'synth-brass': 'brass',
};

/** Renders one note of one instrument. The only thing the two paths differ in. */
export type NoteRenderer = (
  sampleRate: number,
  instrument: string,
  pitch: Pitch,
  dur: number,
  velocity: number,
  seed: number,
) => Stereo;

/** The browser's renderer: synthesised voices, with stand-ins for what it lacks. */
export const synthNoteRenderer: NoteRenderer = (sampleRate, instrument, pitch, dur, velocity, seed) => {
  const name = hasInstrument(instrument) ? instrument : (RUNTIME_STAND_INS[instrument] ?? 'bell');
  return getInstrument(name)({ sampleRate, freq: pitchToFreq(pitch), dur, velocity, seed });
};

// ------------------------------------------------------------------ helpers

function applyBiquad(buf: Stereo, kind: 'lowpass' | 'highpass', sampleRate: number, hz: number, q = 0.7): void {
  const l = biquad(kind, sampleRate, Math.min(hz, sampleRate * 0.45), q);
  const r = biquad(kind, sampleRate, Math.min(hz, sampleRate * 0.45), q);
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] = l.process(buf.left[i]!);
    buf.right[i] = r.process(buf.right[i]!);
  }
}

function reverseStereo(buf: Stereo): void {
  buf.left.reverse();
  buf.right.reverse();
}

/** Linear resample. Only ever used for octave-ish shifts of an already-dark hit. */
function resample(buf: Stereo, speed: number): Stereo {
  if (speed === 1) return buf;
  const n = Math.max(2, Math.round(buf.left.length / speed));
  const out = makeStereo(n);
  for (let i = 0; i < n; i++) {
    const pos = i * speed;
    const a = Math.floor(pos);
    const b = Math.min(buf.left.length - 1, a + 1);
    const f = pos - a;
    out.left[i] = buf.left[a]! * (1 - f) + buf.left[b]! * f;
    out.right[i] = buf.right[a]! * (1 - f) + buf.right[b]! * f;
  }
  return out;
}

function chordOf(pitch: Pitch | Pitch[]): Pitch[] {
  return Array.isArray(pitch) ? pitch : [pitch];
}

function addStereo(dst: Stereo, src: Stereo, atSec: number, sampleRate: number, gain: number, pan: number): void {
  const g = panGains(pan);
  mixStereoInto(dst, src, Math.round(atSec * sampleRate), gain * g.left * 1.41, gain * g.right * 1.41);
}

/**
 * A pan sweep, for a blade that passes the listener. Rendering the layer twice
 * would double the noise seed; instead the finished buffer is re-panned sample
 * by sample, which keeps one physical sound moving across one room.
 */
function sweepPan(buf: Stereo, from: number, to: number): void {
  const n = buf.left.length;
  for (let i = 0; i < n; i++) {
    const mono = (buf.left[i]! + buf.right[i]!) * 0.5;
    const g = panGains(from + (to - from) * (i / n));
    buf.left[i] = mono * g.left * 1.41;
    buf.right[i] = mono * g.right * 1.41;
  }
}

// ------------------------------------------------------------------ renderer

interface PlacedBuffer {
  buf: Stereo;
  at: number;
  gain: number;
}

function renderNoteLayer(layer: NoteLayer, sampleRate: number, note: NoteRenderer): PlacedBuffer[] {
  const pitches = chordOf(layer.pitch);
  const roll = layer.roll ?? 0;
  const out: PlacedBuffer[] = [];
  pitches.forEach((pitch, i) => {
    const seed = hashSeed(`${layer.instrument}:${String(pitch)}:${layer.seed ?? 0}:${i}`);
    let buf = note(sampleRate, layer.instrument, pitch, layer.dur, layer.vel ?? 0.7, seed);
    if (layer.speed !== undefined) buf = resample(buf, layer.speed);
    if (layer.lowpass) applyBiquad(buf, 'lowpass', sampleRate, layer.lowpass);
    if (layer.highpass) applyBiquad(buf, 'highpass', sampleRate, layer.highpass);
    if (layer.reverse) {
      // Fade the (now trailing) original attack so a reversed swell does not
      // end on the click it used to start with.
      fadeOut(buf.left, Math.round(0.02 * sampleRate));
      fadeOut(buf.right, Math.round(0.02 * sampleRate));
      reverseStereo(buf);
    }
    const attack = Math.round((layer.attack ?? 0) * sampleRate);
    if (attack > 1) {
      fadeIn(buf.left, attack);
      fadeIn(buf.right, attack);
    }
    const fade = Math.round((layer.fade ?? 0) * sampleRate);
    if (fade > 1) {
      fadeOut(buf.left, Math.min(fade, buf.left.length));
      fadeOut(buf.right, Math.min(fade, buf.right.length));
    }
    // A rolled chord is one gesture: each note a little softer than the last,
    // the way a harpist's hand loses weight across a gliss.
    out.push({
      buf,
      at: (layer.at ?? 0) + roll * i,
      gain: (layer.gain ?? 1) * (roll > 0 ? Math.pow(0.93, i) : 1),
    });
  });
  return out;
}

/**
 * Render one design to a finished stereo buffer.
 *
 * `note` is what makes a layer sound like an instrument: pass the sampled
 * renderer offline, leave it out in the browser.
 */
export function renderDesign(design: SfxDesign, sampleRate: number, note: NoteRenderer = synthNoteRenderer): Stereo {
  const rule = CATEGORY_RULES[design.category];
  const length = Math.min(design.length, 3.9);
  const out = makeStereo(Math.max(2, Math.ceil(length * sampleRate)));

  for (const layer of design.layers) {
    const at = layer.at ?? 0;
    const gain = layer.gain ?? 1;
    const pan = layer.pan ?? 0;
    switch (layer.kind) {
      case 'note': {
        for (const placed of renderNoteLayer(layer, sampleRate, note)) {
          addStereo(out, placed.buf, placed.at, sampleRate, placed.gain, pan);
        }
        break;
      }
      case 'air': {
        const buf = noiseBurst(sampleRate, {
          dur: layer.dur,
          freq: layer.freq,
          freqTo: layer.freqTo,
          q: layer.q ?? 1,
          gain: 0.5,
          attack: layer.attack ?? 0.008,
          curve: layer.curve ?? 3,
          hold: layer.hold,
          highpass: layer.highpass,
          seed: layer.seed,
        });
        if (layer.reverse) reverseStereo(buf);
        if (layer.panTo !== undefined) sweepPan(buf, pan, layer.panTo);
        addStereo(out, buf, at, sampleRate, gain, layer.panTo === undefined ? pan : 0);
        break;
      }
      case 'sub': {
        const buf = tone(sampleRate, {
          freq: layer.freq,
          toFreq: layer.toFreq,
          dur: layer.dur,
          wave: 'sine',
          gain: 0.6,
          attack: layer.attack ?? 0.006,
          curve: layer.curve ?? 3,
          hold: layer.hold,
        });
        addStereo(out, buf, at, sampleRate, gain, pan);
        break;
      }
      case 'tone': {
        const buf = tone(sampleRate, {
          freq: layer.freq,
          toFreq: layer.toFreq,
          dur: layer.dur,
          wave: layer.wave ?? 'sine',
          gain: 0.5,
          attack: layer.attack ?? 0.008,
          curve: layer.curve ?? 3,
          hold: layer.hold,
          vibrato: layer.vibrato,
          vibratoRate: layer.vibratoRate,
        });
        if (layer.lowpass) applyBiquad(buf, 'lowpass', sampleRate, layer.lowpass);
        addStereo(out, buf, at, sampleRate, gain, pan);
        break;
      }
      case 'ring': {
        const buf = fmTone(sampleRate, {
          freq: layer.freq,
          ratio: layer.ratio ?? 2,
          index: Math.min(MAX_FM_INDEX, layer.index ?? 1.2),
          indexTo: Math.min(MAX_FM_INDEX, layer.indexTo ?? 0.2),
          dur: layer.dur,
          gain: 0.5,
          attack: layer.attack ?? 0.004,
          curve: layer.curve ?? 4,
        });
        applyBiquad(buf, 'lowpass', sampleRate, layer.lowpass ?? 9000);
        addStereo(out, buf, at, sampleRate, gain, pan);
        break;
      }
    }
  }

  // One ceiling over the whole cue. Instrument bodies stop radiating up there
  // and the hall absorbs the rest; a stack of oscillators does neither, which
  // is most of what the ear calls "cheap".
  applyBiquad(out, 'lowpass', sampleRate, design.top ?? rule.top, 0.55);

  const attack = Math.max(design.attack ?? rule.attack, 0);
  fadeIn(out.left, Math.round(attack * sampleRate));
  fadeIn(out.right, Math.round(attack * sampleRate));
  const release = Math.round(rule.release * sampleRate);
  fadeOut(out.left, Math.min(release, out.left.length));
  fadeOut(out.right, Math.min(release, out.right.length));

  const peak = peakOfStereo(out);
  if (peak > 0) scaleStereo(out, (design.peak ?? rule.peak) / peak);
  return out;
}

/** The renderer's own sanity checks, run by the unit tests rather than inline. */
export function designProblems(name: string, design: SfxDesign): string[] {
  const bad: string[] = [];
  if (design.length < 0.03) bad.push(`${name}: ${design.length}s is shorter than the 30 ms floor`);
  if (design.length > 3.9) bad.push(`${name}: ${design.length}s is over the 3.9 s ceiling`);
  if (design.layers.length === 0) bad.push(`${name}: no layers`);
  if (design.about.length < 9) bad.push(`${name}: about text too short`);
  for (const layer of design.layers) {
    const at = layer.at ?? 0;
    if (at < 0) bad.push(`${name}: a layer starts at ${at}s`);
    if (at > design.length) bad.push(`${name}: a layer starts at ${at}s, past the cue's ${design.length}s`);
    if (layer.kind === 'ring' && (layer.index ?? 0) > MAX_FM_INDEX) {
      bad.push(`${name}: ring index ${layer.index} would buzz (max ${MAX_FM_INDEX})`);
    }
    if (layer.kind === 'sub' && layer.freq > 120) {
      bad.push(`${name}: a sub layer at ${layer.freq} Hz is not a sub`);
    }
  }
  return bad;
}
