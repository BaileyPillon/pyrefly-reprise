/**
 * The instrument registry.
 *
 * A track's channel names one of these strings; `render.ts` looks the voice up
 * here. Every voice is a pure function of (freq, duration, velocity, seed), so
 * the renderer can cache identical notes and still be bit-deterministic.
 */

import { bell, celesta, harp, mallet, piano, pluck } from './voices/keys.ts';
import {
  bass,
  brass,
  brassStab,
  choir,
  pad,
  pwmLead,
  strings,
  stringsLow,
  stringsShort,
  subBass,
} from './voices/sustained.ts';
import { crash, hat, kick, shaker, snare, taiko, timpani, tom } from './voices/percussion.ts';
import { sfxBlip, sfxNoise, sfxShimmer, sfxSweep, sfxZap } from './voices/sfxfamily.ts';
import type { Voice, VoiceCtx } from './voices/common.ts';

export type { Voice, VoiceCtx };

/** Every instrument the sequencer can name, with a one-line description. */
export const INSTRUMENTS: Record<string, Voice> = {
  // Keys and plucked
  piano,
  harp,
  pluck,
  bell,
  celesta,
  mallet,
  // Sustained
  pad,
  strings,
  'strings-low': stringsLow,
  'strings-short': stringsShort,
  choir,
  brass,
  'brass-stab': brassStab,
  bass,
  'bass-sub': subBass,
  'pwm-lead': pwmLead,
  // Percussion
  kick,
  taiko,
  timpani,
  snare,
  hat,
  shaker,
  crash,
  tom,
  // SFX family
  'sfx-blip': sfxBlip,
  'sfx-sweep': sfxSweep,
  'sfx-noise': sfxNoise,
  'sfx-zap': sfxZap,
  'sfx-shimmer': sfxShimmer,
};

export const INSTRUMENT_NOTES: Record<string, string> = {
  piano: 'Inharmonic partial stack with hammer noise and two detuned halves.',
  harp: 'Karplus-Strong pluck that rings on after release.',
  pluck: 'Tight damped pluck for accents.',
  bell: 'Tubular-bell inharmonic stack, long shimmer.',
  celesta: 'Glassy short bell, good for sparkle lines.',
  mallet: 'Marimba-ish mallet, used by results ticks.',
  pad: 'Six detuned saws under a slow filter opening.',
  strings: 'Seven-saw ensemble, slow bow attack, vibrato.',
  'strings-low': 'Cello/bass register of the same ensemble.',
  'strings-short': 'Spiccato articulation for ostinati.',
  choir: 'Triangle stack through three formant peaks plus breath.',
  brass: 'Saw section with an attack filter sweep and saturation.',
  'brass-stab': 'Short, hard brass accent.',
  bass: 'Saw + sub sine electric-ish bass.',
  'bass-sub': 'Pure low sine floor.',
  'pwm-lead': 'Hollow pulse-width-modulated lead (machina flavour).',
  kick: 'Tight kick with pitch drop and click.',
  taiko: 'Deep tuned taiko with skin noise.',
  timpani: 'Tuned timpani with long decay.',
  snare: 'Noise + two shells.',
  hat: 'Hi-hat; note duration sets closed vs open.',
  shaker: 'Soft-attack noise tick.',
  crash: 'Cymbal swell for section boundaries.',
  tom: 'Tuned tom.',
  'sfx-blip': 'Short pulse blip for UI.',
  'sfx-sweep': 'Rising filtered saw sweep.',
  'sfx-noise': 'Band-passed noise burst.',
  'sfx-zap': 'FM zap / crackle.',
  'sfx-shimmer': 'Detuned high partial shimmer.',
};

export function instrumentNames(): string[] {
  return Object.keys(INSTRUMENTS).sort();
}

export function hasInstrument(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(INSTRUMENTS, name);
}

export function getInstrument(name: string): Voice {
  const voice = INSTRUMENTS[name];
  if (!voice) {
    throw new Error(`Unknown instrument "${name}". Known: ${instrumentNames().join(', ')}`);
  }
  return voice;
}
