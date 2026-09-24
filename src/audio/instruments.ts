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
import {
  arpPluck,
  clap,
  kick808,
  snare909,
  supersaw,
  synthBass,
} from './voices/electronic.ts';
import { epiano, flute, guitarDist, metalHit, organ } from './voices/band.ts';
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
  // Electronic / pop
  supersaw,
  'synth-bass': synthBass,
  'arp-pluck': arpPluck,
  // Band
  epiano,
  organ,
  'guitar-dist': guitarDist,
  flute,
  // Electronic drum kit
  'kick-808': kick808,
  clap,
  'snare-909': snare909,
  'metal-hit': metalHit,
  // Runtime stand-ins for sampled-only voices a shipped cue names. The offline
  // render plays the real sampled preset of the same name; these only answer
  // when the browser falls back to synthesis (MusicLoader: a missing or
  // undecodable MP3), so the cue synthesises instead of throwing. Each points
  // at the voice `sfx/design.ts` RUNTIME_STAND_INS already uses for the same
  // name, so no sound effect's fallback changes. Added 2026-09-24 for Chapter
  // VII's `boss-seymour-macalania` (request #1 in
  // docs/audio/requests-menus-clair-obscur.md). Both games: shared plumbing.
  harpsichord: pluck,
  oboe: flute,
  clarinet: flute,
  'string-quartet': strings,
  // Added 2026-09-24 for Chapter IX's `boss-yojimbo` (FFX only as a cue; both
  // games as plumbing), again the voice RUNTIME_STAND_INS already uses for
  // each name; `piano-felt` is not in that list and falls back to the piano.
  'cello-solo': stringsLow,
  'violin-solo': strings,
  'piano-felt': piano,
  horn: brass,
  'cymbal-swell': crash,
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
  supersaw: 'Seven-saw unison stack with stereo spread; velocity opens the filter.',
  'synth-bass': 'Mono saw+square through a resonant filter with a fast pluck envelope.',
  'arp-pluck': 'Bright saw pluck with a very fast filter decay, for 16th-note arps.',
  epiano: 'FM tine electric piano; bright attack mellows, gentle stereo tremolo.',
  organ: 'Drawbar additive organ (16/8/4/2 2-3/2) with key click and slow rotary tremolo.',
  'guitar-dist': 'Overdriven two-layer rock guitar; short notes read as palm mutes.',
  flute: 'Breathy sine flute with light harmonics, breath noise and delayed vibrato.',
  'kick-808': 'Long pitched sub boom with a click; note duration sets the decay.',
  clap: 'Three flammed noise bursts plus a short band-passed tail.',
  'snare-909': 'Tight electronic snare: tuned sine body under bright noise.',
  'metal-hit': 'Industrial inharmonic FM anvil hit; pitch follows the note.',
  harpsichord: 'Runtime stand-in: the pluck voice (the sampled harpsichord plays offline).',
  oboe: 'Runtime stand-in: the flute voice (the sampled oboe plays offline).',
  clarinet: 'Runtime stand-in: the flute voice (the sampled clarinet plays offline).',
  'string-quartet': 'Runtime stand-in: the string ensemble (the sampled quartet plays offline).',
  'cello-solo': 'Runtime stand-in: the low string ensemble (the sampled solo cello plays offline).',
  'violin-solo': 'Runtime stand-in: the string ensemble (the sampled solo violin plays offline).',
  'piano-felt': 'Runtime stand-in: the piano voice (the sampled felt piano plays offline).',
  horn: 'Runtime stand-in: the brass section (the sampled horn plays offline).',
  'cymbal-swell': 'Runtime stand-in: the crash swell (the sampled suspended cymbal plays offline).',
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
