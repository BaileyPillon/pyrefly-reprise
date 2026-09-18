/**
 * Sampled band instruments: organ, guitars, electric piano.
 *
 * The distorted guitar is the one preset that does real signal processing.
 * A SoundFont's "Distortion Guitar" is a clean-ish sample with some grit
 * baked in; played straight it sounds like a keyboard patch, because it has
 * no amp behind it. The `amp` block puts one there — tanh saturation, then a
 * speaker cabinet that dies above 5 kHz and a high-pass that clears the mud
 * underneath. That is most of the distance between "GM guitar" and "guitar".
 */

import type { PresetGroup } from './types.ts';

export const bandPresets: PresetGroup = {
  epiano: {
    name: 'epiano',
    about: 'Rhodes electric piano — the FFX-2 pop-jazz verse.',
    seat: 'band-centre',
    layers: [{ lib: 'fluidr3', bank: 0, program: 4 }],
    releaseSec: 0.7,
    tailSec: 1.2,
    timingJitterMs: 6,
    velocityCurve: 1.3,
  },

  organ: {
    name: 'organ',
    about: 'Church organ at the back of the hall — the sacred and the demonic mass.',
    seat: 'organ',
    layers: [{ lib: 'fluidr3', bank: 0, program: 19 }],
    attackSec: 0.02,
    releaseSec: 0.35,
    tailSec: 1.0,
    velocityCurve: 1.2,
    gain: 0.72,
  },

  'organ-rock': {
    name: 'organ-rock',
    about: 'Rock organ with the drawbars out — prog-band energy, not liturgy.',
    seat: 'band-left',
    layers: [{ lib: 'fluidr3', bank: 0, program: 18 }],
    attackSec: 0.005,
    releaseSec: 0.18,
    tailSec: 0.6,
    gain: 0.8,
  },

  'organ-drawbar': {
    name: 'organ-drawbar',
    about: 'Clean drawbar organ; a bed that does not swamp a vocal line.',
    seat: 'band-left',
    layers: [{ lib: 'fluidr3', bank: 0, program: 16 }],
    attackSec: 0.008,
    releaseSec: 0.2,
    tailSec: 0.6,
    gain: 0.75,
  },

  'guitar-dist': {
    name: 'guitar-dist',
    about: 'Overdriven guitar through an amp and a 4x12 — Jecht’s riff.',
    seat: 'band-left',
    layers: [
      { lib: 'fluidr3', bank: 0, program: 30, pan: -0.35, tuneCents: -4 },
      { lib: 'fluidr3', bank: 0, program: 30, pan: 0.35, tuneCents: 5 },
    ],
    amp: { drive: 4.5, cabinetHz: 5200, bodyHz: 95, mix: 1 },
    releaseSec: 0.18,
    tailSec: 0.55,
    timingJitterMs: 7,
    velocityCurve: 1.25,
    gain: 0.6,
  },

  'guitar-lead': {
    name: 'guitar-lead',
    about: 'Single-tracked overdrive for a solo line; less gain, more note.',
    seat: 'band-right',
    layers: [{ lib: 'fluidr3', bank: 0, program: 29 }],
    amp: { drive: 3.2, cabinetHz: 5800, bodyHz: 110, mix: 0.9 },
    releaseSec: 0.3,
    tailSec: 0.8,
    timingJitterMs: 6,
    velocityCurve: 1.3,
    gain: 0.65,
  },

  'guitar-clean': {
    name: 'guitar-clean',
    about: 'Clean electric guitar, lightly driven — arpeggios under a verse.',
    seat: 'band-right',
    layers: [{ lib: 'fluidr3', bank: 0, program: 27 }],
    amp: { drive: 1.4, cabinetHz: 7000, bodyHz: 85, mix: 0.6 },
    releaseSec: 0.4,
    tailSec: 0.9,
    timingJitterMs: 6,
  },

  'guitar-nylon': {
    name: 'guitar-nylon',
    about: 'Nylon-string acoustic; the quiet cousin of the harp.',
    seat: 'band-centre',
    layers: [{ lib: 'fluidr3', bank: 0, program: 24 }],
    releaseSec: 0.6,
    tailSec: 1.1,
    timingJitterMs: 7,
  },

  'guitar-steel': {
    name: 'guitar-steel',
    about: 'Steel-string acoustic for strummed beds.',
    seat: 'band-centre',
    layers: [{ lib: 'fluidr3', bank: 0, program: 25 }],
    releaseSec: 0.55,
    tailSec: 1.0,
    timingJitterMs: 7,
  },

  'bass-pick': {
    name: 'bass-pick',
    about: 'Picked electric bass — harder attack for a driving FFX-2 groove.',
    seat: 'band-bass',
    layers: [{ lib: 'fluidr3', bank: 0, program: 34 }],
    releaseSec: 0.16,
    tailSec: 0.45,
    timingJitterMs: 5,
    velocityCurve: 1.35,
  },

  'bass-upright': {
    name: 'bass-upright',
    about: 'Upright bass; the jazz-trio register for a results theme.',
    seat: 'band-bass',
    layers: [{ lib: 'fluidr3', bank: 0, program: 32 }],
    releaseSec: 0.22,
    tailSec: 0.55,
    timingJitterMs: 8,
  },
};
