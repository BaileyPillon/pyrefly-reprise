/**
 * Per-character weapons.
 *
 * Each one is the same three-part gesture — movement, contact, ring — tuned to
 * the character: Tidus is quick and bright, Auron is slow and low, Wakka is
 * leather and air with no metal in it at all, Rikku is three small events where
 * everyone else has one.
 */

import {
  bodyHit,
  breath,
  cloth,
  glassHigh,
  MAGIC,
  pizz,
  scatter,
  steelRing,
  SUB,
  subImpact,
  UI,
  whoosh,
} from './materials.ts';
import type { SfxDesign } from './design.ts';

export const weaponSfx: Record<string, SfxDesign> = {
  'slash-light': {
    about: 'Tidus: a quick single-handed cut — light cloth, fast air, a bright edge on the 5.',
    category: 'weapon',
    length: 0.62,
    layers: [
      cloth({ at: 0, dur: 0.06, gain: 0.16 }),
      whoosh({ at: 0.03, dur: 0.15, from: 1100, to: 3800, pan: -0.5, panTo: 0.4, gain: 0.32 }),
      steelRing({ at: 0.1, freq: 1480, dur: 0.36, gain: 0.24, pan: 0.2 }),
      glassHigh(UI.move, { at: 0.1, dur: 0.05, vel: 0.3, gain: 0.14, pan: 0.2 }),
    ],
  },

  'slash-heavy': {
    about: "Auron's katana: a slow heavy cleave, a low body, and steel that keeps ringing after it lands.",
    category: 'weapon',
    length: 1.1,
    layers: [
      cloth({ at: 0, dur: 0.14, gain: 0.26 }),
      whoosh({ at: 0.05, dur: 0.28, from: 380, to: 1700, pan: 0.5, panTo: -0.4, gain: 0.42 }),
      bodyHit({ at: 0.24, vel: 0.85, gain: 0.5 }),
      subImpact({ at: 0.24, freq: SUB.move, dur: 0.5, gain: 0.45 }),
      steelRing({ at: 0.245, freq: 988, dur: 0.75, gain: 0.3, pan: -0.15 }),
    ],
  },

  pierce: {
    about: "Kimahri's spear: a narrow whoosh that stays in one place, then a hard tip and a thin ring.",
    category: 'weapon',
    length: 0.8,
    layers: [
      cloth({ at: 0, dur: 0.07, gain: 0.14 }),
      {
        kind: 'air',
        at: 0.03,
        dur: 0.16,
        freq: 1600,
        freqTo: 3200,
        q: 3.2,
        attack: 0.02,
        curve: 3,
        gain: 0.26,
        pan: -0.1,
      },
      bodyHit({ at: 0.16, pitch: 'D2', vel: 0.7, gain: 0.4, speed: 1.2 }),
      subImpact({ at: 0.16, freq: SUB.home, dur: 0.24, gain: 0.34 }),
      steelRing({ at: 0.162, freq: 2349, dur: 0.4, gain: 0.18, pan: 0.15 }),
    ],
  },

  'ball-hit': {
    about: "Wakka's blitzball: leather and air, a rubbery thump with no metal anywhere in it.",
    category: 'weapon',
    length: 0.8,
    layers: [
      cloth({ at: 0, dur: 0.08, gain: 0.18 }),
      whoosh({ at: 0.02, dur: 0.2, from: 500, to: 1500, pan: -0.45, panTo: 0.45, gain: 0.3 }),
      bodyHit({ at: 0.18, pitch: 'F#2', vel: 0.7, gain: 0.45, speed: 1.05 }),
      subImpact({ at: 0.18, freq: 95, dur: 0.3, gain: 0.34, curve: 4 }),
      {
        kind: 'tone',
        at: 0.182,
        dur: 0.18,
        freq: 260,
        toFreq: 170,
        wave: 'tri',
        attack: 0.004,
        curve: 5,
        gain: 0.16,
        lowpass: 2200,
      },
    ],
  },

  claw: {
    about: "Rikku's claw: three quick scratches across the field, each smaller than the last.",
    category: 'weapon',
    length: 0.7,
    layers: [
      ...[0, 0.08, 0.16].map((at, i) => ({
        kind: 'air' as const,
        at,
        dur: 0.1,
        freq: 2200 + i * 500,
        freqTo: 900,
        q: 2.4,
        attack: 0.006,
        curve: 5,
        gain: 0.26 - i * 0.05,
        pan: -0.35 + i * 0.35,
        highpass: 700,
        seed: 300 + i,
      })),
      steelRing({ at: 0.17, freq: 1976, dur: 0.3, gain: 0.14, pan: 0.3 }),
      subImpact({ at: 0.16, freq: 110, dur: 0.16, gain: 0.18, curve: 5 }),
    ],
  },

  'dagger-flurry': {
    about: 'A flurry of small blades: four bright cuts in 300 ms, panned apart, one ring to close it.',
    category: 'weapon',
    length: 0.9,
    layers: [
      ...[0, 0.075, 0.15, 0.225].map((at, i) => ({
        kind: 'air' as const,
        at,
        dur: 0.09,
        freq: 1800 + i * 420,
        freqTo: 3600,
        q: 2.2,
        attack: 0.005,
        curve: 5,
        gain: 0.22,
        pan: i % 2 === 0 ? -0.4 : 0.4,
        highpass: 600,
        seed: 88 + i,
      })),
      ...[0, 0.075, 0.15, 0.225].map((at, i) => glassHigh(i % 2 === 0 ? UI.move : UI.tense, {
        at: at + 0.012,
        dur: 0.04,
        vel: 0.3,
        gain: 0.12,
        pan: i % 2 === 0 ? -0.3 : 0.3,
      })),
      steelRing({ at: 0.24, freq: 1568, dur: 0.45, gain: 0.2 }),
    ],
  },

  gunshot: {
    about: "Yuna's pistol: a short dry crack with a low thump under it, gone in a quarter second.",
    category: 'weapon',
    length: 0.75,
    top: 11_000,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.055,
        freq: 2600,
        freqTo: 700,
        q: 0.8,
        attack: 0.0012,
        curve: 9,
        gain: 0.5,
        seed: 2020,
      },
      bodyHit({ at: 0.002, pitch: 'B1', vel: 0.7, gain: 0.4, speed: 1.4 }),
      subImpact({ at: 0.002, freq: 84, dur: 0.22, gain: 0.34, curve: 5 }),
      {
        kind: 'air',
        at: 0.05,
        dur: 0.4,
        freq: 900,
        freqTo: 300,
        q: 0.6,
        attack: 0.02,
        curve: 2.4,
        gain: 0.1,
        pan: 0.2,
      },
    ],
  },

  'gun-burst': {
    about: 'Five rounds: the same crack five times, each a shade quieter, the room answering after.',
    category: 'weapon',
    length: 1.3,
    top: 11_000,
    layers: [
      ...[0, 0.1, 0.2, 0.3, 0.4].flatMap((at, i) => [
        {
          kind: 'air' as const,
          at,
          dur: 0.05,
          freq: 2600,
          freqTo: 700,
          q: 0.8,
          attack: 0.0012,
          curve: 9,
          gain: 0.4 - i * 0.03,
          pan: (i % 2 === 0 ? -1 : 1) * 0.18,
          seed: 2020 + i,
        },
        bodyHit({ at: at + 0.002, pitch: 'B1', vel: 0.6, gain: 0.3, speed: 1.4 }),
      ]),
      subImpact({ at: 0.002, freq: 84, dur: 0.5, gain: 0.3, curve: 3 }),
      {
        kind: 'air',
        at: 0.45,
        dur: 0.6,
        freq: 800,
        freqTo: 260,
        q: 0.6,
        attack: 0.03,
        curve: 2.2,
        gain: 0.1,
        pan: 0.25,
      },
    ],
  },

  whiff: {
    about: 'A swing that hits nothing: cloth and air, and then the discomfort of no impact at all.',
    category: 'weapon',
    length: 0.6,
    layers: [
      cloth({ at: 0, dur: 0.09, gain: 0.2 }),
      whoosh({ at: 0.03, dur: 0.26, from: 700, to: 2400, pan: -0.5, panTo: 0.5, gain: 0.34 }),
      breath({ at: 0.2, dur: 0.25, gain: 0.05 }),
    ],
  },

  guard: {
    about: 'A block: steel meeting steel, bright and short, with the shield ringing on after.',
    category: 'impact',
    length: 0.9,
    layers: [
      cloth({ at: 0, dur: 0.05, gain: 0.12 }),
      bodyHit({ at: 0.03, pitch: 'D2', vel: 0.6, gain: 0.34, speed: 1.3 }),
      steelRing({ at: 0.03, freq: 1568, dur: 0.7, index: 2, gain: 0.34, pan: 0.15 }),
      glassHigh(UI.tense, { at: 0.032, dur: 0.1, vel: 0.4, gain: 0.2, pan: -0.2 }),
      subImpact({ at: 0.03, freq: 92, dur: 0.24, gain: 0.26, curve: 5 }),
    ],
  },

  counter: {
    about: 'A parry and the answer: a pizzicato tick, then a blade already on its way back.',
    category: 'weapon',
    length: 1,
    layers: [
      pizz(MAGIC.move, { at: 0, vel: 0.7, gain: 0.4, pan: -0.25 }),
      steelRing({ at: 0.01, freq: 1976, dur: 0.3, gain: 0.2, pan: -0.2 }),
      cloth({ at: 0.14, dur: 0.06, gain: 0.16 }),
      whoosh({ at: 0.17, dur: 0.16, from: 1000, to: 3200, pan: 0.4, panTo: -0.35, gain: 0.3 }),
      bodyHit({ at: 0.3, vel: 0.75, gain: 0.44 }),
      subImpact({ at: 0.3, freq: SUB.home, dur: 0.34, gain: 0.4 }),
      ...scatter(3, { at: 0.3, span: 0.06, freq: 3000, dur: 0.03, gain: 0.07, seed: 61 }),
    ],
  },
};
