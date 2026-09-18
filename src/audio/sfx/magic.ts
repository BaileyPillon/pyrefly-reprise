/**
 * The base spell effects, and the two biggest gestures in the game: a summon
 * arriving, and pyreflies leaving.
 *
 * Every spell here is built the same way: choir or bowed material for the body,
 * glass or bells for the front edge, air for the movement, and a tail that
 * blooms rather than stops. The elements differ in register and attack, not in
 * kind — fire is low and rough, ice is high and brittle, holy is wide and open.
 */

import {
  bell,
  breath,
  CHORDS,
  choirBloom,
  cymbalSwell,
  glassHigh,
  harpRoll,
  lowStrings,
  MAGIC,
  scatter,
  shimmer,
  sopranoLine,
  subImpact,
  SUB,
  suction,
  tamTam,
  timpani,
  toll,
  UI,
} from './materials.ts';
import type { SfxDesign } from './design.ts';

export const magicSfx: Record<string, SfxDesign> = {
  'magic-charge': {
    about: 'Gathering a spell: air pulled inward, the choir opening on the 2, glass motes collecting.',
    category: 'spell',
    length: 1.5,
    layers: [
      suction({ at: 0, dur: 0.9, low: 400, high: 3600, gain: 0.2 }),
      choirBloom([MAGIC.ache, MAGIC.move], { at: 0.1, dur: 0.8, vel: 0.45, gain: 0.3, attack: 0.3 }),
      ...shimmer({ at: 0.35, dur: 0.7, spread: 0.45, gain: 0.22 }),
      breath({ at: 0, dur: 0.8, gain: 0.07 }),
    ],
  },

  fire: {
    about: 'Fire: a low roar of air with crackle riding on it, and the choir darkening underneath.',
    category: 'spell',
    length: 1.6,
    top: 9500,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.85,
        freq: 320,
        freqTo: 1100,
        q: 0.5,
        attack: 0.03,
        curve: 2.2,
        hold: 0.1,
        gain: 0.42,
      },
      subImpact({ at: 0, freq: 88, dur: 0.45, gain: 0.4 }),
      choirBloom(['B2', 'D3'], { at: 0.02, dur: 0.7, vel: 0.55, gain: 0.26, voice: 'choir', attack: 0.05 }),
      ...scatter(11, { at: 0.05, span: 0.7, freq: 2400, freqSpread: 0.9, dur: 0.04, gain: 0.1, seed: 9101 }),
      tamTam({ at: 0.05, dur: 0.9, vel: 0.4, gain: 0.14 }),
    ],
  },

  ice: {
    about: 'Ice: glass shards over a freezing shimmer, brittle at the top and hollow underneath.',
    category: 'spell',
    length: 1.7,
    layers: [
      ...[UI.high, UI.move, MAGIC.high, UI.neutral, MAGIC.move].map((pitch, i) => glassHigh(pitch, {
        at: 0.02 + i * 0.045,
        dur: 0.1,
        vel: 0.55 - i * 0.05,
        gain: 0.3,
        pan: i % 2 === 0 ? -0.3 : 0.32,
      })),
      {
        kind: 'air',
        at: 0,
        dur: 0.55,
        freq: 6200,
        freqTo: 2400,
        q: 1.1,
        attack: 0.015,
        curve: 2.6,
        gain: 0.18,
        highpass: 1200,
      },
      choirBloom([MAGIC.move, MAGIC.high], { at: 0.12, dur: 0.9, vel: 0.4, gain: 0.24 }),
      subImpact({ at: 0.1, freq: 64, dur: 0.3, gain: 0.26 }),
    ],
  },

  thunder: {
    about: 'Thunder: a hard crack, a short metallic arc, and the room rolling away underneath it.',
    category: 'spell',
    length: 1.9,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.09,
        freq: 4200,
        freqTo: 900,
        q: 0.5,
        attack: 0.0015,
        curve: 8,
        gain: 0.55,
        seed: 1212,
      },
      { kind: 'ring', at: 0.004, freq: 880, ratio: 3.41, index: 2.4, indexTo: 0.2, dur: 0.3, curve: 5, gain: 0.22, pan: 0.15 },
      {
        kind: 'air',
        at: 0.03,
        dur: 1.3,
        freq: 240,
        freqTo: 80,
        q: 0.45,
        attack: 0.03,
        curve: 2,
        gain: 0.32,
        pan: -0.1,
        seed: 777,
      },
      subImpact({ at: 0.02, freq: SUB.home, dur: 0.9, gain: 0.5, curve: 2.4 }),
      timpani('B1', { at: 0.02, dur: 0.6, vel: 0.8, gain: 0.3 }),
    ],
  },

  water: {
    about: 'Water: a surge swelling in and falling back, with droplets scattering across the field.',
    category: 'spell',
    length: 1.8,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.9,
        freq: 700,
        freqTo: 2200,
        q: 0.6,
        attack: 0.12,
        curve: 1.6,
        hold: 0.15,
        gain: 0.34,
      },
      {
        kind: 'air',
        at: 0.5,
        dur: 0.8,
        freq: 1800,
        freqTo: 400,
        q: 0.7,
        attack: 0.04,
        curve: 2.2,
        gain: 0.24,
        pan: 0.2,
      },
      ...scatter(9, { at: 0.25, span: 0.7, freq: 3200, freqSpread: 0.7, dur: 0.05, gain: 0.09, seed: 5150 }),
      choirBloom([MAGIC.home, MAGIC.move], { at: 0.1, dur: 0.9, vel: 0.42, gain: 0.24 }),
      subImpact({ at: 0.45, freq: 72, dur: 0.4, gain: 0.3 }),
    ],
  },

  holy: {
    about: 'Holy: a bell struck inside an open choir chord, with the hall left to answer it.',
    category: 'spell',
    length: 2.6,
    layers: [
      toll(MAGIC.home, { at: 0, dur: 1.2, vel: 0.7, gain: 0.5 }),
      choirBloom(CHORDS.tonic, { at: 0.02, dur: 1.5, vel: 0.6, gain: 0.4, attack: 0.12 }),
      sopranoLine(MAGIC.move, { at: 0.35, dur: 1.2, vel: 0.5, gain: 0.3, pan: -0.15 }),
      ...shimmer({ at: 0.2, dur: 1.2, spread: 0.6, gain: 0.2 }),
      cymbalSwell({ at: 0.1, dur: 1.4, vel: 0.4, gain: 0.14 }),
    ],
  },

  cure: {
    about: 'Cure: the choir blooms from the b6 up to the tonic while celesta motes rise through it.',
    category: 'spell',
    length: 2,
    layers: [
      choirBloom([MAGIC.tense], { at: 0, dur: 0.4, vel: 0.5, gain: 0.3, attack: 0.1 }),
      choirBloom([MAGIC.home, MAGIC.move], { at: 0.3, dur: 1.1, vel: 0.55, gain: 0.34, attack: 0.14 }),
      harpRoll([MAGIC.neutral, MAGIC.move, UI.home, UI.neutral], { at: 0.12, roll: 0.055, dur: 0.6, vel: 0.5, gain: 0.4 }),
      ...shimmer({ at: 0.3, dur: 1.1, spread: 0.5, gain: 0.26 }),
    ],
  },

  summon: {
    about: 'An aeon arrives: air drawn in, the floor giving way, and the full choir opening over a bell.',
    category: 'flourish',
    length: 3.6,
    layers: [
      suction({ at: 0, dur: 1, low: 300, high: 2800, gain: 0.22 }),
      lowStrings(['B1', 'F#2'], { at: 0.2, dur: 1, vel: 0.6, gain: 0.3, tremolo: true }),
      subImpact({ at: 1, freq: SUB.deep, dur: 1.1, gain: 0.6, curve: 2 }),
      timpani('B1', { at: 1, dur: 0.8, vel: 0.9, gain: 0.4 }),
      tamTam({ at: 1, dur: 2, vel: 0.8, gain: 0.34 }),
      toll(MAGIC.home, { at: 1.05, dur: 1.6, vel: 0.75, gain: 0.45 }),
      choirBloom(CHORDS.open, { at: 1.1, dur: 1.8, vel: 0.65, gain: 0.4, attack: 0.18 }),
      ...shimmer({ at: 1.3, dur: 1.4, spread: 0.7, gain: 0.22 }),
    ],
  },

  pyrefly: {
    about: 'Pyreflies drifting up: weightless glass motes and breath, and nothing underneath them at all.',
    category: 'ambience',
    length: 2.2,
    layers: [
      ...[MAGIC.move, UI.home, UI.neutral, UI.move, UI.high].map((pitch, i) => glassHigh(pitch, {
        at: 0.05 + i * 0.17,
        dur: 0.14,
        vel: 0.42 - i * 0.04,
        gain: 0.34 - i * 0.03,
        pan: i % 2 === 0 ? -0.35 : 0.38,
      })),
      breath({ at: 0, dur: 1.6, gain: 0.07 }),
      bell(UI.home, { at: 0.6, dur: 0.9, vel: 0.28, gain: 0.16, pan: 0.2 }),
    ],
  },
};
