/**
 * Sampled strings, brass, winds and voices.
 *
 * Two things here do most of the work of sounding like players rather than a
 * sampler. First, a section is stacked from more than one patch, slightly
 * detuned: `strings` is 1st violins + 2nd violins + violas, a few cents
 * apart, which is what gives an ensemble its beating. Second, every one of
 * them carries `timingJitterMs` — real desks are never exactly together, and
 * without that the whole section attacks on one sample and reads as a synth.
 *
 * The bowed instruments also take a slow `attackSec` and a long `releaseSec`.
 * The release is the important one: it is what makes overlapping notes in the
 * sequencer come out as legato instead of as separate events.
 */

import type { PresetGroup } from './types.ts';

export const sustainedPresets: PresetGroup = {
  strings: {
    name: 'strings',
    about: 'Violin/viola section sustain, three desks detuned — the main string bed.',
    seat: 'strings-wide',
    layers: [
      { lib: 'sonatina', name: '1st Violins Sustain', pan: -0.4, tuneCents: -3 },
      { lib: 'sonatina', name: '2nd Violins Sustain', pan: -0.12, tuneCents: 4, gain: 0.85 },
      { lib: 'sonatina', name: 'Viola Section Sustai', pan: 0.3, gain: 0.7 },
    ],
    attackSec: 0.09,
    releaseSec: 0.85,
    tailSec: 1.3,
    timingJitterMs: 22,
    velocityCurve: 1.5,
    gain: 0.72,
  },

  'strings-low': {
    name: 'strings-low',
    about: 'Cello and double-bass sections — the weight under the bed.',
    seat: 'cello',
    layers: [
      { lib: 'sonatina', name: 'Cello Section Sustai', pan: -0.1, tuneCents: -2 },
      { lib: 'sonatina', name: 'Basses Sustain', pan: 0.15, gain: 0.8, tuneCents: 3 },
    ],
    attackSec: 0.1,
    releaseSec: 0.9,
    tailSec: 1.4,
    timingJitterMs: 24,
    velocityCurve: 1.45,
    gain: 0.78,
  },

  'strings-short': {
    name: 'strings-short',
    about: 'Marcato ostinato: pizzicato under a hard-attacked, short-gated section.',
    seat: 'strings-wide',
    layers: [
      { lib: 'sonatina', name: '1st Violins Pizz', pan: -0.35 },
      { lib: 'sonatina', name: '1st Violins Sustain', pan: -0.2, gain: 0.55 },
      { lib: 'sonatina', name: 'Viola Section Sustai', pan: 0.3, gain: 0.4 },
    ],
    attackSec: 0.004,
    releaseSec: 0.14,
    tailSec: 0.55,
    timingJitterMs: 14,
    velocityCurve: 1.6,
    gain: 0.85,
    caveat:
      'No free library we ship has a true spiccato. This is pizzicato plus a hard-gated ' +
      'sustain, which reads as marcato: right articulation, slightly wrong bow noise.',
  },

  'strings-trem': {
    name: 'strings-trem',
    about: 'Tremolo strings — dread beds, the bar before a boss lands.',
    seat: 'strings-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 44 }],
    attackSec: 0.06,
    releaseSec: 0.7,
    tailSec: 1.2,
    timingJitterMs: 18,
    gain: 0.8,
  },

  pizzicato: {
    name: 'pizzicato',
    about: 'Full pizzicato section, violins through basses.',
    seat: 'strings-wide',
    layers: [
      { lib: 'sonatina', name: '1st Violins Pizz', pan: -0.4 },
      { lib: 'sonatina', name: 'Cello Section Pizz', pan: 0.4, gain: 0.8 },
    ],
    releaseSec: 0.28,
    tailSec: 0.7,
    timingJitterMs: 12,
  },

  'violin-solo': {
    name: 'violin-solo',
    about: 'Solo violin — one player, for a line the section would crush.',
    seat: 'soloist',
    layers: [{ lib: 'sonatina', name: 'Violin Solo' }],
    attackSec: 0.07,
    releaseSec: 0.8,
    tailSec: 1.3,
    timingJitterMs: 8,
    velocityCurve: 1.5,
  },

  'cello-solo': {
    name: 'cello-solo',
    about: 'Solo cello; the tragic register for Shuyin and the endings.',
    seat: 'soloist',
    layers: [{ lib: 'sonatina', name: 'Cello Solo' }],
    attackSec: 0.08,
    releaseSec: 0.95,
    tailSec: 1.5,
    timingJitterMs: 9,
    velocityCurve: 1.5,
  },

  pad: {
    name: 'pad',
    about: 'Soft string bed with distant choir — the hall breathing under a scene.',
    seat: 'strings-wide',
    layers: [
      { lib: 'sonatina', name: 'Viola Section Sustai', gain: 0.9, tuneCents: -4 },
      { lib: 'sonatina', name: 'Cello Section Sustai', gain: 0.6, tuneCents: 3 },
      { lib: 'sonatina', name: 'Mixed Choir', gain: 0.3 },
    ],
    attackSec: 0.35,
    releaseSec: 1.5,
    tailSec: 2.2,
    timingJitterMs: 30,
    velocityCurve: 1.3,
    gain: 0.62,
  },

  choir: {
    name: 'choir',
    about: 'Wordless mixed choir on risers — the sacred and the demonic both.',
    seat: 'choir',
    layers: [{ lib: 'sonatina', name: 'Mixed Choir' }],
    attackSec: 0.14,
    releaseSec: 1.3,
    tailSec: 2.0,
    timingJitterMs: 34,
    velocityCurve: 1.4,
    gain: 0.85,
  },

  'choir-ooh': {
    name: 'choir-ooh',
    about: 'Darker closed-vowel choir; sits under a melody without competing.',
    seat: 'choir',
    layers: [{ lib: 'fluidr3', bank: 0, program: 53 }],
    attackSec: 0.18,
    releaseSec: 1.2,
    tailSec: 1.9,
    timingJitterMs: 30,
    gain: 0.8,
  },

  soprano: {
    name: 'soprano',
    about: 'Distant wordless soprano line, high and alone.',
    seat: 'soloist',
    layers: [{ lib: 'sonatina', name: 'Mixed Choir', transpose: 0 }],
    attackSec: 0.2,
    releaseSec: 1.4,
    tailSec: 2.1,
    timingJitterMs: 12,
    gain: 0.7,
    pan: -0.1,
    caveat:
      'Derived from the mixed-choir samples, not a solo-soprano recording — no free ' +
      'library we ship has one. Convincing high and quiet; thin if written low or loud.',
  },

  brass: {
    name: 'brass',
    about: 'Horn section under trombones — the weight in a boss tutti.',
    seat: 'horn',
    layers: [
      { lib: 'sonatina', name: 'Horn Section', pan: -0.2 },
      { lib: 'sonatina', name: 'Trombone Section', pan: 0.25, gain: 0.6 },
    ],
    attackSec: 0.045,
    releaseSec: 0.5,
    tailSec: 1.0,
    timingJitterMs: 16,
    velocityCurve: 1.55,
    gain: 0.72,
  },

  'brass-stab': {
    name: 'brass-stab',
    about: 'Trumpets and trombones, hard and short — the accent on the downbeat.',
    seat: 'trumpet',
    layers: [
      { lib: 'sonatina', name: 'Trumpet Section', pan: -0.15 },
      { lib: 'sonatina', name: 'Trombone Section', pan: 0.3, gain: 0.75 },
    ],
    attackSec: 0.006,
    releaseSec: 0.22,
    tailSec: 0.7,
    timingJitterMs: 10,
    velocityCurve: 1.7,
    gain: 0.8,
  },

  horn: {
    name: 'horn',
    about: 'French horn section alone — the clan call, noble and far off.',
    seat: 'horn',
    layers: [{ lib: 'sonatina', name: 'Horn Section' }],
    attackSec: 0.055,
    releaseSec: 0.6,
    tailSec: 1.1,
    timingJitterMs: 14,
  },

  trumpet: {
    name: 'trumpet',
    about: 'Trumpet section; fanfares and the FFX-2 pop-brass hits.',
    seat: 'trumpet',
    layers: [{ lib: 'sonatina', name: 'Trumpet Section' }],
    attackSec: 0.02,
    releaseSec: 0.35,
    tailSec: 0.8,
    timingJitterMs: 11,
  },

  trombone: {
    name: 'trombone',
    about: 'Trombone section and bass trombone — the floor of the brass.',
    seat: 'trombone',
    layers: [
      { lib: 'sonatina', name: 'Trombone Section' },
      { lib: 'sonatina', name: 'Bass Trombone Solo', gain: 0.5 },
    ],
    attackSec: 0.035,
    releaseSec: 0.45,
    tailSec: 0.9,
    timingJitterMs: 13,
  },

  flute: {
    name: 'flute',
    about: 'Solo flute over a section — breathy, the line above a choir.',
    seat: 'flute',
    layers: [
      { lib: 'sonatina', name: 'Flute Solo' },
      { lib: 'sonatina', name: 'Flute Section', gain: 0.35 },
    ],
    attackSec: 0.05,
    releaseSec: 0.45,
    tailSec: 0.9,
    timingJitterMs: 9,
    velocityCurve: 1.45,
  },

  oboe: {
    name: 'oboe',
    about: 'Solo oboe — the reedy, plaintive line.',
    seat: 'oboe',
    layers: [{ lib: 'sonatina', name: 'Oboe Solo' }],
    attackSec: 0.045,
    releaseSec: 0.4,
    tailSec: 0.85,
    timingJitterMs: 9,
  },

  clarinet: {
    name: 'clarinet',
    about: 'Solo clarinet; hollow and warm in its low register.',
    seat: 'clarinet',
    layers: [{ lib: 'sonatina', name: 'Clarinet Solo' }],
    attackSec: 0.05,
    releaseSec: 0.42,
    tailSec: 0.85,
    timingJitterMs: 9,
  },

  bassoon: {
    name: 'bassoon',
    about: 'Bassoon — the woodwind bass, dry and a little comic or a little grim.',
    seat: 'bassoon',
    layers: [{ lib: 'sonatina', name: 'Bassoon Solo' }],
    attackSec: 0.05,
    releaseSec: 0.45,
    tailSec: 0.9,
    timingJitterMs: 10,
  },

  bass: {
    name: 'bass',
    about: 'Fingered electric bass — the FFX-2 band register.',
    seat: 'band-bass',
    layers: [{ lib: 'fluidr3', bank: 0, program: 33 }],
    releaseSec: 0.18,
    tailSec: 0.5,
    timingJitterMs: 5,
    velocityCurve: 1.35,
  },

  'bass-sub': {
    name: 'bass-sub',
    about: 'Sub-bass floor under a tutti; felt more than heard.',
    seat: 'band-bass',
    layers: [{ lib: 'fluidr3', bank: 0, program: 38 }],
    releaseSec: 0.25,
    tailSec: 0.6,
    gain: 0.85,
  },

  'pwm-lead': {
    name: 'pwm-lead',
    about: 'Hollow square lead — the machina voice.',
    seat: 'synth-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 80 }],
    attackSec: 0.01,
    releaseSec: 0.2,
    tailSec: 0.5,
    velocityCurve: 1.3,
    gain: 0.75,
  },
};
