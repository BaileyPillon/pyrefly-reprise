/**
 * Sampled electronic voices — the FFX-2 and machina register.
 *
 * These stay synthetic on purpose: Vegnagun and the Bevelle underground are
 * supposed to sound like machinery, and a sampled orchestra playing their
 * parts would be wrong. What changes versus the runtime oscillators is that
 * these are recorded analogue and digital synths with real filter movement
 * and real drum machines, sitting in the same hall as everything else rather
 * than in a vacuum.
 */

import type { PresetGroup } from './types.ts';

export const electronicPresets: PresetGroup = {
  supersaw: {
    name: 'supersaw',
    about: 'Two detuned saw stacks spread wide — the FFX-2 chorus pad.',
    seat: 'synth-wide',
    layers: [
      { lib: 'fluidr3', bank: 0, program: 81, pan: -0.4, tuneCents: -7 },
      { lib: 'fluidr3', bank: 0, program: 90, pan: 0.4, tuneCents: 6, gain: 0.8 },
    ],
    attackSec: 0.02,
    releaseSec: 0.45,
    tailSec: 0.9,
    velocityCurve: 1.3,
    gain: 0.6,
  },

  'synth-bass': {
    name: 'synth-bass',
    about: 'Resonant mono synth bass — the ostinato that never lets go.',
    seat: 'band-bass',
    layers: [{ lib: 'fluidr3', bank: 0, program: 39 }],
    releaseSec: 0.12,
    tailSec: 0.4,
    velocityCurve: 1.3,
    gain: 0.85,
  },

  'arp-pluck': {
    name: 'arp-pluck',
    about: 'Bright saw pluck with a fast decay, for sixteenth-note arps.',
    seat: 'synth-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 81 }],
    attackSec: 0.002,
    releaseSec: 0.1,
    tailSec: 0.35,
    velocityCurve: 1.4,
    gain: 0.65,
  },

  'kick-808': {
    name: 'kick-808',
    about: 'TR-808 kick; the score’s pitch tunes the boom.',
    seat: 'band-kit',
    layers: [{ lib: 'fluidr3', bank: 128, program: 25 }],
    drum: { key: 36, pitchRef: 36, pitchFollow: 0.6 },
    releaseSec: 0.4,
    tailSec: 0.9,
    velocityCurve: 1.4,
  },

  clap: {
    name: 'clap',
    about: 'TR-808 hand clap.',
    seat: 'band-kit',
    layers: [{ lib: 'fluidr3', bank: 128, program: 25 }],
    drum: { key: 39 },
    releaseSec: 0.2,
    tailSec: 0.5,
    timingJitterMs: 4,
    gain: 0.85,
  },

  'snare-909': {
    name: 'snare-909',
    about: 'Electronic snare — tight body, bright noise.',
    seat: 'band-kit',
    layers: [{ lib: 'fluidr3', bank: 128, program: 24 }],
    drum: { key: 40 },
    releaseSec: 0.22,
    tailSec: 0.55,
    timingJitterMs: 4,
    velocityCurve: 1.5,
  },

  'metal-hit': {
    name: 'metal-hit',
    about: 'Tam-tam as an industrial clang; the score bends it.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 68, pitchRef: 68, pitchFollow: 0.8 },
    releaseSec: 1.4,
    tailSec: 2.6,
    velocityCurve: 1.5,
    gain: 0.8,
  },

  // --- extras an arranger can switch a channel to -------------------------

  'pad-synth': {
    name: 'pad-synth',
    about: 'A true synth warm pad, for when the string bed is too human.',
    seat: 'synth-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 89 }],
    attackSec: 0.3,
    releaseSec: 0.9,
    tailSec: 1.6,
    gain: 0.65,
  },

  'synth-brass': {
    name: 'synth-brass',
    about: 'Synth brass stabs — the FFX-2 victory fanfare colour.',
    seat: 'synth-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 62 }],
    attackSec: 0.012,
    releaseSec: 0.25,
    tailSec: 0.6,
    velocityCurve: 1.5,
    gain: 0.7,
  },

  'orchestra-hit': {
    name: 'orchestra-hit',
    about: 'The one-shot orchestral stab, for an overdrive landing.',
    seat: 'strings-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 55 }],
    releaseSec: 0.5,
    tailSec: 1.2,
    velocityCurve: 1.5,
  },

  'space-voice': {
    name: 'space-voice',
    about: 'Synthetic breathy voice pad — the Farplane, not quite human.',
    seat: 'synth-wide',
    layers: [{ lib: 'fluidr3', bank: 0, program: 91 }],
    attackSec: 0.35,
    releaseSec: 1.2,
    tailSec: 2.0,
    gain: 0.6,
  },
};
