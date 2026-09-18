/**
 * Battle flow and minigames: the turn order, the Overdrive interfaces, the
 * FFX-2 chain counter and dressphere changes.
 *
 * Half of these fire several times a second, which makes them the strictest
 * cues in the game: soft attacks, small dynamic range, no top end, and never
 * the same pitch twice in a row when the caller repeats one. A tick a player
 * hears forty times in a minigame is the one that has to be beautiful.
 */

import {
  bell,
  breath,
  CHORDS,
  choirBloom,
  cloth,
  cymbalSwell,
  glass,
  glassHigh,
  harpRoll,
  MAGIC,
  pizz,
  scatter,
  shimmer,
  sopranoLine,
  subImpact,
  SUB,
  suction,
  timpani,
  toll,
  UI,
  whoosh,
} from './materials.ts';
import type { SfxDesign } from './design.ts';

export const flowSfx: Record<string, SfxDesign> = {
  'ctb-tick': {
    about: 'The turn list advances: the quietest sound in the game, one glass mote on the 5.',
    category: 'ui',
    length: 0.18,
    peak: 0.3,
    layers: [glassHigh(UI.move, { dur: 0.035, vel: 0.3, gain: 0.5 })],
  },

  'ctb-shift': {
    about: 'The order changes: two soft motes stepping down, neutral then home.',
    category: 'ui',
    length: 0.34,
    peak: 0.38,
    layers: [
      glassHigh(UI.neutral, { at: 0, dur: 0.04, vel: 0.35, gain: 0.5, pan: -0.2 }),
      glassHigh(UI.home, { at: 0.06, dur: 0.05, vel: 0.3, gain: 0.42, pan: 0.2 }),
    ],
  },

  'turn-ready': {
    about: 'Your move: a small bell on the tonic with a harp note under it — an invitation, not an alarm.',
    category: 'ui',
    length: 0.8,
    layers: [
      bell(UI.home, { dur: 0.35, vel: 0.5, gain: 0.45 }),
      harpRoll([MAGIC.move, MAGIC.high], { at: 0.02, roll: 0.04, dur: 0.3, vel: 0.4, gain: 0.3, pan: -0.2 }),
    ],
  },

  'menu-page': {
    about: 'A tab turns: glass on the 2, with a breath of paper movement behind it.',
    category: 'ui',
    length: 0.4,
    layers: [
      glass(UI.ache, { dur: 0.045, vel: 0.45, gain: 0.6 }),
      cloth({ at: 0, dur: 0.07, gain: 0.08 }),
    ],
  },

  'battle-start': {
    about: 'The encounter closes in: glass shatters upward, air sweeps past, and the strings land on the b6.',
    category: 'flourish',
    length: 1.8,
    layers: [
      ...scatter(9, { at: 0, span: 0.25, freq: 4200, freqSpread: 0.7, dur: 0.04, gain: 0.1, seed: 2211 }),
      ...[MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral].map((pitch, i) => glassHigh(pitch, {
        at: i * 0.035,
        dur: 0.09,
        vel: 0.5,
        gain: 0.26,
        pan: i % 2 === 0 ? -0.35 : 0.35,
      })),
      whoosh({ at: 0.05, dur: 0.5, from: 600, to: 3600, pan: -0.6, panTo: 0.6, gain: 0.3 }),
      {
        kind: 'note',
        instrument: 'strings-short',
        pitch: CHORDS.flatSix,
        dur: 0.3,
        vel: 0.8,
        attack: 0.012,
        at: 0.5,
        gain: 0.4,
        pan: 0.15,
      },
      timpani('B1', { at: 0.5, dur: 0.6, vel: 0.8, gain: 0.34 }),
      subImpact({ at: 0.5, freq: SUB.home, dur: 0.7, gain: 0.44 }),
    ],
  },

  escape: {
    about: 'Running: cloth, a falling whoosh away from the listener, and footfalls getting smaller.',
    category: 'weapon',
    length: 1.1,
    layers: [
      cloth({ at: 0, dur: 0.1, gain: 0.2 }),
      {
        kind: 'air',
        at: 0.02,
        dur: 0.55,
        freq: 2600,
        freqTo: 500,
        q: 0.9,
        attack: 0.02,
        curve: 2.4,
        gain: 0.3,
        pan: 0,
        panTo: 0.55,
      },
      ...[0.06, 0.2, 0.34, 0.46].map((at, i) => ({
        kind: 'sub' as const,
        at,
        dur: 0.12,
        freq: 80 - i * 4,
        toFreq: 56,
        curve: 5,
        gain: 0.22 - i * 0.045,
      })),
      breath({ at: 0.1, dur: 0.5, gain: 0.05 }),
    ],
  },

  'od-cursor-tick': {
    about: 'Swordplay cursor: a dry glass tick built to be retriggered ten times a second without fatigue.',
    category: 'ui',
    length: 0.14,
    peak: 0.4,
    layers: [glassHigh(UI.move, { dur: 0.03, vel: 0.35, gain: 0.5 })],
  },

  'od-timer-tick': {
    about: 'The countdown: the same tick with the 2 under it, so it reads as a question running out.',
    category: 'ui',
    length: 0.2,
    peak: 0.45,
    layers: [
      glassHigh(UI.ache, { dur: 0.035, vel: 0.4, gain: 0.5 }),
      pizz(MAGIC.ache, { at: 0, vel: 0.35, gain: 0.16, pan: 0.2 }),
    ],
  },

  'od-hit-zone': {
    about: 'Dead centre: glass rising a fourth into a bell — the sound of getting it exactly right.',
    category: 'ui',
    length: 0.7,
    peak: 0.7,
    layers: [
      glass(UI.neutral, { dur: 0.04, vel: 0.6, gain: 0.6 }),
      glass(UI.high, { at: 0.04, dur: 0.07, vel: 0.55, gain: 0.5 }),
      bell(MAGIC.high, { at: 0.04, dur: 0.4, vel: 0.5, gain: 0.3, pan: 0.15 }),
    ],
  },

  'od-miss': {
    about: 'Missed the window: a damped low glass note that does not ring — disappointment, not punishment.',
    category: 'ui',
    length: 0.4,
    layers: [
      {
        kind: 'note',
        instrument: 'vibraphone',
        pitch: MAGIC.tense,
        dur: 0.12,
        vel: 0.4,
        attack: 0.01,
        fade: 0.1,
        at: 0,
        gain: 0.45,
      },
      cloth({ at: 0, dur: 0.06, gain: 0.07 }),
    ],
  },

  'od-input': {
    about: 'A Bushido button press: pizzicato with a mote of glass on top, tight and rhythmic.',
    category: 'ui',
    length: 0.3,
    layers: [
      pizz(MAGIC.move, { at: 0, vel: 0.6, gain: 0.45 }),
      glassHigh(UI.move, { at: 0.004, dur: 0.03, vel: 0.35, gain: 0.25, pan: 0.15 }),
    ],
  },

  'od-sequence-complete': {
    about: 'The sequence lands: a harp run up the tonic triad into a bell and a breath of choir.',
    category: 'flourish',
    length: 1.6,
    layers: [
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral], { roll: 0.05, dur: 0.5, vel: 0.6, gain: 0.45 }),
      bell(UI.home, { at: 0.26, dur: 0.8, vel: 0.6, gain: 0.4 }),
      choirBloom(CHORDS.tonic, { at: 0.2, dur: 0.9, vel: 0.45, gain: 0.26 }),
      ...shimmer({ at: 0.3, dur: 0.8, spread: 0.4, gain: 0.2 }),
    ],
  },

  'od-reel-spin': {
    about: 'Reels spinning: a light wooden clatter, deliberately dry so a fast retrigger does not smear.',
    category: 'ui',
    length: 0.32,
    layers: [
      ...scatter(6, { at: 0, span: 0.2, freq: 1900, freqSpread: 0.5, dur: 0.025, gain: 0.14, seed: 3535, width: 0.5 }),
      pizz(MAGIC.neutral, { at: 0.02, vel: 0.4, gain: 0.22, pan: -0.15 }),
    ],
  },

  'od-reel-stop': {
    about: 'A reel lands: one wooden clunk with a small body and no ring at all.',
    category: 'impact',
    length: 0.45,
    peak: 0.6,
    layers: [
      pizz(MAGIC.home, { at: 0, vel: 0.7, gain: 0.4 }),
      {
        kind: 'sub',
        at: 0,
        dur: 0.14,
        freq: 110,
        toFreq: 70,
        curve: 5,
        gain: 0.3,
      },
      {
        kind: 'air',
        at: 0,
        dur: 0.05,
        freq: 900,
        freqTo: 400,
        q: 1.2,
        attack: 0.003,
        curve: 6,
        gain: 0.12,
      },
    ],
  },

  'od-fury-rotation': {
    about: "Lulu's rotation counter: a glass tick with a rising breath, so speed reads as lift.",
    category: 'ui',
    length: 0.26,
    layers: [
      glassHigh(UI.home, { dur: 0.03, vel: 0.4, gain: 0.5 }),
      {
        kind: 'air',
        at: 0,
        dur: 0.16,
        freq: 1800,
        freqTo: 3400,
        q: 1.4,
        attack: 0.01,
        curve: 3,
        gain: 0.1,
        highpass: 900,
      },
    ],
  },

  'od-mix-select': {
    about: 'Rikku picks an ingredient: a small glass bottle note on the 2, close and dry.',
    category: 'ui',
    length: 0.35,
    layers: [
      glass(UI.ache, { dur: 0.04, vel: 0.5, gain: 0.55, pan: -0.12 }),
      glassHigh(MAGIC.high, { at: 0.03, dur: 0.05, vel: 0.3, gain: 0.22, pan: 0.18 }),
    ],
  },

  'od-success': {
    about: 'The minigame went well: a short harp lift into the tonic, warm and over quickly.',
    category: 'flourish',
    length: 1.2,
    peak: 0.8,
    layers: [
      harpRoll([MAGIC.move, UI.home, UI.neutral], { roll: 0.045, dur: 0.4, vel: 0.55, gain: 0.42 }),
      bell(UI.home, { at: 0.1, dur: 0.6, vel: 0.5, gain: 0.3, pan: 0.15 }),
      choirBloom([MAGIC.home, MAGIC.move], { at: 0.08, dur: 0.7, vel: 0.4, gain: 0.2 }),
    ],
  },

  'od-fail': {
    about: 'The minigame went badly: the b6 leaning on the 5 in low glass, damped, no second strike.',
    category: 'ui',
    length: 0.8,
    layers: [
      {
        kind: 'note',
        instrument: 'vibraphone',
        pitch: [MAGIC.tense, MAGIC.move],
        dur: 0.3,
        vel: 0.45,
        attack: 0.012,
        fade: 0.2,
        at: 0,
        gain: 0.45,
      },
      breath({ at: 0, dur: 0.4, gain: 0.05 }),
    ],
  },

  'chain-hit': {
    about: 'FFX-2 chain hit: one bright glass note the caller steps upward per link in the chain.',
    category: 'ui',
    length: 0.3,
    peak: 0.55,
    layers: [
      glassHigh(UI.move, { dur: 0.04, vel: 0.5, gain: 0.55 }),
      pizz(MAGIC.move, { at: 0, vel: 0.4, gain: 0.18, pan: 0.15 }),
    ],
  },

  'chain-break': {
    about: 'The chain ends: the glass falls to the 2 and a breath closes over it.',
    category: 'ui',
    length: 0.6,
    layers: [
      glass(UI.move, { dur: 0.04, vel: 0.45, gain: 0.5 }),
      glass(UI.ache, { at: 0.05, dur: 0.06, vel: 0.35, gain: 0.4 }),
      breath({ at: 0.05, dur: 0.3, gain: 0.05, reverse: true }),
    ],
  },

  spherechange: {
    about: 'A dressphere change: light spins up, glass scatters outward, and the tonic chord blooms.',
    category: 'flourish',
    length: 2.2,
    layers: [
      suction({ at: 0, dur: 0.6, low: 700, high: 4200, gain: 0.2 }),
      whoosh({ at: 0.1, dur: 0.45, from: 900, to: 3200, pan: -0.55, panTo: 0.55, gain: 0.26 }),
      ...scatter(10, { at: 0.35, span: 0.4, freq: 4000, freqSpread: 0.6, dur: 0.035, gain: 0.08, seed: 1901 }),
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral, UI.move], {
        at: 0.5,
        roll: 0.045,
        dur: 0.5,
        vel: 0.6,
        gain: 0.42,
      }),
      choirBloom(CHORDS.tonic, { at: 0.55, dur: 1.1, vel: 0.55, gain: 0.32, attack: 0.08 }),
      bell(UI.home, { at: 0.6, dur: 0.9, vel: 0.6, gain: 0.34 }),
      cymbalSwell({ at: 0.2, dur: 0.9, vel: 0.45, gain: 0.14 }),
    ],
  },

  'garment-grid-gate': {
    about: 'A gate bonus: two glass notes a fourth apart and a soprano breath over the top.',
    category: 'ui',
    length: 1.1,
    peak: 0.65,
    layers: [
      glass(UI.neutral, { dur: 0.04, vel: 0.5, gain: 0.5, pan: -0.15 }),
      glass(UI.tense, { at: 0.07, dur: 0.06, vel: 0.45, gain: 0.45, pan: 0.18 }),
      sopranoLine(MAGIC.high, { at: 0.08, dur: 0.5, vel: 0.4, gain: 0.22 }),
      toll(MAGIC.home, { at: 0.06, dur: 0.6, vel: 0.35, gain: 0.18 }),
    ],
  },
};
