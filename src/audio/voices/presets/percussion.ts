/**
 * Sampled percussion.
 *
 * Drum patches are keyed by the GM percussion note, not by the pitch a score
 * wrote, so each of these carries a `drum` map saying which note to fire.
 * A fixed hit (hi-hat, crash) ignores the score's pitch entirely; a tuned
 * drum (taiko, tom) sets `pitchRef` so the score's pitches still bend it.
 *
 * Almost everything comes from Sonatina's orchestral percussion rather than a
 * GM kit: real piatti, a real tam-tam and a real concert bass drum are the
 * difference between "boss fight" and "drum machine".
 */

import type { PresetGroup } from './types.ts';

export const percussionPresets: PresetGroup = {
  kick: {
    name: 'kick',
    about: 'Concert bass drum, struck hard — the orchestral kick.',
    seat: 'percussion-low',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 37 },
    releaseSec: 0.5,
    tailSec: 1.0,
    timingJitterMs: 6,
    velocityCurve: 1.5,
  },

  taiko: {
    name: 'taiko',
    about: 'Concert bass drum pitched down into taiko territory; the score tunes it.',
    seat: 'percussion-low',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    // C2 plays the sample untransposed; lower notes drop it further.
    drum: { key: 37, pitchRef: 36, pitchFollow: 0.7 },
    releaseSec: 0.8,
    tailSec: 1.6,
    timingJitterMs: 8,
    velocityCurve: 1.55,
    gain: 1.05,
    caveat: 'A pitched-down orchestral bass drum, not a recorded taiko — close, but rounder.',
  },

  timpani: {
    name: 'timpani',
    about: 'Tuned timpani; genuinely pitched, so write real notes for it.',
    seat: 'timpani',
    layers: [{ lib: 'sonatina', name: 'Timpani' }],
    releaseSec: 1.2,
    tailSec: 2.2,
    timingJitterMs: 9,
    velocityCurve: 1.6,
  },

  snare: {
    name: 'snare',
    about: 'Orchestral snare — long notes become a roll.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 38, longKey: 39, longSec: 0.45 },
    releaseSec: 0.3,
    tailSec: 0.7,
    timingJitterMs: 7,
    velocityCurve: 1.55,
  },

  hat: {
    name: 'hat',
    about: 'Hi-hat; a note longer than a 16th opens it, as before.',
    seat: 'band-kit',
    layers: [{ lib: 'fluidr3', bank: 128, program: 0 }],
    drum: { key: 42, longKey: 46, longSec: 0.16 },
    releaseSec: 0.12,
    tailSec: 0.45,
    timingJitterMs: 5,
    velocityCurve: 1.5,
    gain: 0.8,
  },

  shaker: {
    name: 'shaker',
    about: 'Orchestral shaker — the soft tick that keeps a scene moving.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 65 },
    releaseSec: 0.15,
    tailSec: 0.4,
    timingJitterMs: 6,
    gain: 0.7,
  },

  crash: {
    name: 'crash',
    about: 'Piatti crash; a long note becomes a suspended-cymbal swell instead.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 45, longKey: 42, longSec: 0.7 },
    releaseSec: 1.6,
    tailSec: 3.0,
    timingJitterMs: 8,
    velocityCurve: 1.5,
    gain: 0.75,
  },

  tom: {
    name: 'tom',
    about: 'Tuned tom; the score bends it across the kit range.',
    seat: 'band-kit',
    layers: [{ lib: 'fluidr3', bank: 128, program: 0 }],
    drum: { key: 45, pitchRef: 45, pitchFollow: 0.85 },
    releaseSec: 0.35,
    tailSec: 0.8,
    timingJitterMs: 6,
  },

  // --- extras an arranger can switch a channel to -------------------------

  'tam-tam': {
    name: 'tam-tam',
    about: 'Tam-tam. One stroke, and the hall answers for four seconds.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 68 },
    releaseSec: 3.2,
    tailSec: 4.5,
    velocityCurve: 1.6,
    gain: 0.85,
  },

  'bass-drum': {
    name: 'bass-drum',
    about: 'Concert bass drum struck softly — the distant thunder, not the hit.',
    seat: 'percussion-low',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 36 },
    releaseSec: 0.9,
    tailSec: 1.8,
    gain: 0.9,
  },

  'cymbal-swell': {
    name: 'cymbal-swell',
    about: 'Suspended-cymbal roll that grows into a section head.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 41 },
    attackSec: 0.4,
    releaseSec: 1.2,
    tailSec: 2.5,
    gain: 0.7,
  },

  triangle: {
    name: 'triangle',
    about: 'Triangle — one bright point above a quiet texture.',
    seat: 'percussion',
    layers: [{ lib: 'sonatina', name: 'All Percussion' }],
    drum: { key: 57 },
    releaseSec: 1.0,
    tailSec: 1.8,
    gain: 0.6,
  },

  'drum-kit': {
    name: 'drum-kit',
    about: 'A full acoustic kit mapped GM-style: write real drum-map pitches.',
    seat: 'band-kit',
    layers: [{ lib: 'fluidr3', bank: 128, program: 16 }],
    releaseSec: 0.25,
    tailSec: 0.7,
    timingJitterMs: 5,
    velocityCurve: 1.5,
  },
};
