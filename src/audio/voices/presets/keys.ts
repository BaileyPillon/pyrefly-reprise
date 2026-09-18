/**
 * Sampled keys and plucked instruments.
 *
 * The piano matters more than anything else here: FFX leads with it, and the
 * Clair Obscur register for the menus is essentially solo piano in a hall.
 * Salamander is a 16-velocity-layer stereo Steinway, so it gets the dynamics
 * right on its own — hence `velocityTilt: false`, which stops us darkening
 * something that was already recorded dark.
 */

import type { PresetGroup } from './types.ts';

export const keysPresets: PresetGroup = {
  piano: {
    name: 'piano',
    about: 'Salamander concert grand, 16 velocity layers, long damper tail.',
    seat: 'piano',
    layers: [{ lib: 'salamander', bank: 0, program: 0 }],
    velocityTilt: false,
    velocityCurve: 1.25,
    releaseSec: 1.1,
    tailSec: 1.6,
    timingJitterMs: 3,
    gain: 0.92,
  },

  harp: {
    name: 'harp',
    about: 'Sonatina concert harp; rings on well past the written note.',
    seat: 'harp',
    layers: [{ lib: 'sonatina', name: 'Concert Harp' }],
    releaseSec: 1.6,
    tailSec: 2.0,
    velocityCurve: 1.3,
    timingJitterMs: 4,
  },

  pluck: {
    name: 'pluck',
    about: 'Violin pizzicato for tight accents.',
    seat: 'violin-1',
    layers: [{ lib: 'sonatina', name: '1st Violins Pizz' }],
    releaseSec: 0.3,
    tailSec: 0.7,
    timingJitterMs: 6,
  },

  bell: {
    name: 'bell',
    about: 'Tubular bells; a long inharmonic shimmer for section heads.',
    seat: 'percussion',
    layers: [{ lib: 'fluidr3', bank: 0, program: 14 }],
    releaseSec: 2.4,
    tailSec: 3.0,
    gain: 0.8,
  },

  celesta: {
    name: 'celesta',
    about: 'Celesta — the glassy sparkle line, music-box register.',
    seat: 'celesta',
    layers: [{ lib: 'fluidr3', bank: 0, program: 8 }],
    releaseSec: 0.9,
    tailSec: 1.4,
    timingJitterMs: 4,
    gain: 0.95,
  },

  mallet: {
    name: 'mallet',
    about: 'Marimba, used by the results ticks and light ostinati.',
    seat: 'percussion',
    layers: [{ lib: 'fluidr3', bank: 0, program: 12 }],
    releaseSec: 0.5,
    tailSec: 0.9,
    timingJitterMs: 5,
  },

  // --- extras an arranger can switch a channel to -------------------------

  glockenspiel: {
    name: 'glockenspiel',
    about: 'Orchestral glockenspiel; brighter and shorter than celesta.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'Glockenspiel' }],
    releaseSec: 1.2,
    tailSec: 1.8,
  },

  vibraphone: {
    name: 'vibraphone',
    about: 'Vibraphone with its own tremolo — jazz-register sparkle for FFX-2.',
    seat: 'percussion',
    layers: [{ lib: 'fluidr3', bank: 0, program: 11 }],
    releaseSec: 1.4,
    tailSec: 2.0,
  },

  chimes: {
    name: 'chimes',
    about: 'Sonatina chimes; heavier and more sacred than tubular bells.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'Chimes' }],
    releaseSec: 2.8,
    tailSec: 3.5,
    gain: 0.8,
  },

  harpsichord: {
    name: 'harpsichord',
    about: 'Harpsichord, for a brittle antique colour under a waltz.',
    seat: 'celesta',
    layers: [{ lib: 'fluidr3', bank: 0, program: 6 }],
    releaseSec: 0.35,
    tailSec: 0.8,
    timingJitterMs: 5,
  },
};
