/**
 * White magic, statuses, items and the aeon's exit.
 *
 * The status cues are the clearest demonstration of the pitch set doing real
 * work: a buff lands on the tonic and a debuff lands on the b6, always, so a
 * player learns in ten minutes which way a sound they have never heard before
 * is going to go. Nothing here is allowed to be unpleasant — a debuff is
 * *sad*, not harsh.
 */

import {
  bell,
  breath,
  CHORDS,
  choirBloom,
  cloth,
  cymbalSwell,
  drone,
  glass,
  glassHigh,
  harpRoll,
  LOW,
  lowStrings,
  MAGIC,
  pizz,
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
  whoosh,
} from './materials.ts';
import type { DesignLayer, SfxDesign } from './design.ts';

export const supportSfx: Record<string, SfxDesign> = {
  'cure-2': {
    about: 'Cura: the healing bloom with a fuller chord under it and the harp taking a longer run.',
    category: 'spell',
    length: 2.4,
    layers: [
      choirBloom([MAGIC.tense, MAGIC.home], { at: 0, dur: 0.5, vel: 0.5, gain: 0.3, attack: 0.1 }),
      choirBloom(CHORDS.tonic, { at: 0.35, dur: 1.4, vel: 0.6, gain: 0.36, attack: 0.14 }),
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral], {
        at: 0.12,
        roll: 0.055,
        dur: 0.7,
        vel: 0.55,
        gain: 0.42,
      }),
      ...shimmer({ at: 0.35, dur: 1.4, spread: 0.7, gain: 0.26 }),
      bell(UI.home, { at: 0.4, dur: 0.8, vel: 0.45, gain: 0.24, pan: 0.2 }),
    ],
  },

  'cure-3': {
    about: 'Curaga: light comes down on the whole party — full choir, a harp sweep, bells, and warmth underneath.',
    category: 'flourish',
    length: 3.4,
    layers: [
      choirBloom([MAGIC.tense, MAGIC.home], { at: 0, dur: 0.6, vel: 0.5, gain: 0.28, attack: 0.12 }),
      choirBloom(CHORDS.open, { at: 0.45, dur: 2, vel: 0.65, gain: 0.4, attack: 0.16 }),
      sopranoLine(UI.home, { at: 0.8, dur: 1.4, vel: 0.5, gain: 0.26, pan: -0.15 }),
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral, UI.move, UI.high], {
        at: 0.15,
        roll: 0.05,
        dur: 0.9,
        vel: 0.6,
        gain: 0.44,
      }),
      toll(MAGIC.home, { at: 0.5, dur: 1.6, vel: 0.55, gain: 0.3 }),
      ...shimmer({ at: 0.6, dur: 1.8, spread: 1, gain: 0.24 }),
      cymbalSwell({ at: 0.3, dur: 1.4, vel: 0.4, gain: 0.12 }),
    ],
  },

  regen: {
    about: 'Regen: the same mote of light three times over, slower each time, promising to come back.',
    category: 'spell',
    length: 2.4,
    layers: [
      ...[0, 0.6, 1.25].flatMap((at, i): DesignLayer[] => [
        glassHigh(i === 0 ? MAGIC.move : i === 1 ? UI.home : UI.neutral, {
          at,
          dur: 0.12,
          vel: 0.42 - i * 0.04,
          gain: 0.32,
          pan: i % 2 === 0 ? -0.25 : 0.28,
        }),
        choirBloom([MAGIC.home, MAGIC.move], { at, dur: 0.5, vel: 0.4 - i * 0.04, gain: 0.2, attack: 0.16 }),
      ]),
      breath({ at: 0, dur: 1.8, gain: 0.05 }),
    ],
  },

  life: {
    about: 'Life: a warm choir swell lifting from the b6 to the tonic, and one bell as they stand up.',
    category: 'spell',
    length: 2.8,
    layers: [
      choirBloom([MAGIC.tense], { at: 0, dur: 0.7, vel: 0.5, gain: 0.3, attack: 0.25 }),
      choirBloom(CHORDS.tonic, { at: 0.6, dur: 1.5, vel: 0.6, gain: 0.36, attack: 0.18 }),
      toll(MAGIC.home, { at: 0.65, dur: 1.4, vel: 0.6, gain: 0.36 }),
      harpRoll([MAGIC.neutral, MAGIC.move, UI.home], { at: 0.5, roll: 0.06, dur: 0.6, vel: 0.5, gain: 0.32 }),
      ...shimmer({ at: 0.7, dur: 1.4, spread: 0.7, gain: 0.2 }),
    ],
  },

  'full-life': {
    about: 'Full-Life: the same rising, opened out to the full chord with a peal of three bells over it.',
    category: 'flourish',
    length: 3.4,
    layers: [
      choirBloom([MAGIC.tense, MAGIC.ache], { at: 0, dur: 0.8, vel: 0.5, gain: 0.3, attack: 0.3 }),
      choirBloom(CHORDS.open, { at: 0.7, dur: 2, vel: 0.68, gain: 0.4, attack: 0.16 }),
      toll(MAGIC.home, { at: 0.72, dur: 1.6, vel: 0.7, gain: 0.38 }),
      toll(MAGIC.move, { at: 0.95, dur: 1.5, vel: 0.55, gain: 0.28, pan: -0.28 }),
      toll(UI.home, { at: 1.2, dur: 1.3, vel: 0.5, gain: 0.24, pan: 0.3 }),
      sopranoLine(UI.home, { at: 1, dur: 1.5, vel: 0.55, gain: 0.28 }),
      ...shimmer({ at: 0.9, dur: 1.8, spread: 1, gain: 0.22 }),
    ],
  },

  esuna: {
    about: 'Esuna: a glass sweep upward as the ailment lets go, and a breath after it.',
    category: 'spell',
    length: 1.6,
    layers: [
      harpRoll([MAGIC.ache, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral], {
        roll: 0.04,
        dur: 0.5,
        vel: 0.5,
        gain: 0.4,
      }),
      ...shimmer({ at: 0.15, dur: 0.9, spread: 0.5, gain: 0.24 }),
      choirBloom([MAGIC.home], { at: 0.2, dur: 0.8, vel: 0.4, gain: 0.2 }),
      breath({ at: 0.1, dur: 0.6, gain: 0.06 }),
    ],
  },

  dispel: {
    about: 'Dispel: a glass dome cracked once and let go — bright, then nothing left to ring.',
    category: 'spell',
    length: 1.2,
    layers: [
      glass(UI.tense, { dur: 0.05, vel: 0.6, gain: 0.55 }),
      ...scatter(7, { at: 0.02, span: 0.25, freq: 3800, freqSpread: 0.7, dur: 0.035, gain: 0.09, seed: 1357 }),
      {
        kind: 'note',
        instrument: 'vibraphone',
        pitch: [MAGIC.tense, MAGIC.neutral],
        dur: 0.3,
        vel: 0.45,
        attack: 0.01,
        fade: 0.25,
        at: 0.02,
        gain: 0.3,
        pan: 0.2,
      },
      breath({ at: 0.05, dur: 0.4, gain: 0.05, reverse: true }),
    ],
  },

  protect: {
    about: 'Protect: a low bell and a held chord closing around the target like a shield taking weight.',
    category: 'spell',
    length: 2,
    layers: [
      toll(LOW.home, { at: 0, dur: 0.9, vel: 0.55, gain: 0.34 }),
      lowStrings(CHORDS.tonicLow, { at: 0.05, dur: 1.1, vel: 0.5, gain: 0.3 }),
      subImpact({ at: 0, freq: SUB.home, dur: 0.5, gain: 0.28, curve: 3.5 }),
      glass(UI.home, { at: 0.06, dur: 0.05, vel: 0.4, gain: 0.26, pan: 0.2 }),
    ],
  },

  shell: {
    about: 'Shell: the same gesture made of air and glass instead of weight — a dome, not a wall.',
    category: 'spell',
    length: 2,
    layers: [
      glass(UI.move, { at: 0, dur: 0.05, vel: 0.5, gain: 0.4 }),
      choirBloom([MAGIC.move, MAGIC.high], { at: 0.03, dur: 1.1, vel: 0.45, gain: 0.28, attack: 0.2 }),
      ...shimmer({ at: 0.1, dur: 1, spread: 0.6, gain: 0.2 }),
      {
        kind: 'air',
        at: 0.02,
        dur: 0.9,
        freq: 2600,
        freqTo: 5200,
        q: 0.8,
        attack: 0.2,
        curve: 1.6,
        gain: 0.12,
        highpass: 1200,
      },
    ],
  },

  reflect: {
    about: 'Reflect: two glass notes a fifth apart, the second a mirror of the first, ringing together.',
    category: 'spell',
    length: 1.6,
    layers: [
      glass(UI.home, { at: 0, dur: 0.05, vel: 0.55, gain: 0.45, pan: -0.28 }),
      glass(UI.move, { at: 0.04, dur: 0.06, vel: 0.5, gain: 0.42, pan: 0.3 }),
      bell(MAGIC.home, { at: 0.04, dur: 0.7, vel: 0.45, gain: 0.28 }),
      ...shimmer({ at: 0.1, dur: 0.8, spread: 0.4, gain: 0.18 }),
    ],
  },

  'reflect-bounce': {
    about: 'A spell comes back off the mirror: the same glass reversed, thrown across the field.',
    category: 'spell',
    length: 1.4,
    layers: [
      {
        kind: 'note',
        instrument: 'glockenspiel',
        pitch: [UI.move, UI.home],
        dur: 0.35,
        vel: 0.5,
        reverse: true,
        at: 0,
        gain: 0.34,
        pan: -0.35,
      },
      glass(UI.tense, { at: 0.36, dur: 0.05, vel: 0.55, gain: 0.44, pan: 0.35 }),
      whoosh({ at: 0.1, dur: 0.4, from: 1400, to: 3600, pan: -0.5, panTo: 0.5, gain: 0.22 }),
      bell(MAGIC.move, { at: 0.38, dur: 0.6, vel: 0.4, gain: 0.24, pan: 0.3 }),
    ],
  },

  haste: {
    about: 'Haste: glass ticks accelerating up the triad until they blur into one shimmer.',
    category: 'spell',
    length: 1.6,
    layers: [
      ...[0, 0.24, 0.42, 0.55, 0.65, 0.72, 0.77, 0.81].map((at, i) => glassHigh(
        [MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral, UI.move, UI.high, 'D7'][i] ?? UI.high,
        { at, dur: 0.05, vel: 0.35 + i * 0.02, gain: 0.26, pan: i % 2 === 0 ? -0.2 : 0.22 },
      )),
      ...shimmer({ at: 0.75, dur: 0.7, spread: 0.3, gain: 0.22 }),
      breath({ at: 0.2, dur: 0.7, gain: 0.05 }),
    ],
  },

  slow: {
    about: 'Slow: the same ticks decelerating and sagging — the tape losing speed rather than a pitch bend.',
    category: 'spell',
    length: 2,
    layers: [
      ...[0, 0.12, 0.28, 0.5, 0.78, 1.12].map((at, i) => glassHigh(
        [UI.high, UI.move, UI.neutral, UI.home, MAGIC.move, MAGIC.neutral][i] ?? MAGIC.home,
        { at, dur: 0.07, vel: 0.42 - i * 0.03, gain: 0.28, pan: i % 2 === 0 ? 0.22 : -0.2 },
      )),
      drone([LOW.home, LOW.ache], { at: 0.3, dur: 1.1, vel: 0.4, gain: 0.2 }),
      breath({ at: 0.4, dur: 0.9, gain: 0.05 }),
    ],
  },

  stop: {
    about: 'Stop: a tick that is cut off mid-ring, and a frozen shimmer standing where it was.',
    category: 'spell',
    length: 1.8,
    layers: [
      glass(UI.move, { at: 0, dur: 0.03, vel: 0.55, gain: 0.5 }),
      {
        kind: 'note',
        instrument: 'vibraphone',
        pitch: MAGIC.move,
        dur: 0.08,
        vel: 0.5,
        attack: 0.008,
        fade: 0.04,
        at: 0,
        gain: 0.3,
      },
      choirBloom([MAGIC.move, MAGIC.high], { at: 0.14, dur: 1.1, vel: 0.35, gain: 0.22, attack: 0.3 }),
      ...shimmer({ at: 0.2, dur: 1, spread: 0.2, gain: 0.16 }),
    ],
  },

  sleep: {
    about: 'Sleep: three drowsy notes falling a step at a time, the last one barely arriving.',
    category: 'spell',
    length: 2.4,
    layers: [
      {
        kind: 'note',
        instrument: 'celesta',
        pitch: MAGIC.move,
        dur: 0.4,
        vel: 0.45,
        attack: 0.02,
        at: 0,
        gain: 0.38,
        pan: -0.2,
      },
      {
        kind: 'note',
        instrument: 'celesta',
        pitch: MAGIC.neutral,
        dur: 0.5,
        vel: 0.38,
        attack: 0.025,
        at: 0.45,
        gain: 0.32,
        pan: 0.1,
      },
      {
        kind: 'note',
        instrument: 'celesta',
        pitch: MAGIC.home,
        dur: 0.8,
        vel: 0.3,
        attack: 0.03,
        fade: 0.4,
        at: 0.95,
        gain: 0.28,
        pan: 0.2,
      },
      choirBloom([LOW.home, LOW.move], { at: 0.5, dur: 1.2, vel: 0.35, gain: 0.18, attack: 0.35 }),
      breath({ at: 0.9, dur: 0.8, gain: 0.05 }),
    ],
  },

  silence: {
    about: 'Silence: everything is pulled inward and the room is shut — a reversed swell into no tail at all.',
    category: 'spell',
    length: 1.4,
    layers: [
      suction({ at: 0, dur: 0.8, low: 500, high: 3400, gain: 0.26 }),
      {
        kind: 'note',
        instrument: 'choir',
        pitch: [MAGIC.tense, MAGIC.ache],
        dur: 0.7,
        vel: 0.45,
        reverse: true,
        at: 0.05,
        gain: 0.28,
      },
      glass(UI.ache, { at: 0.82, dur: 0.03, vel: 0.4, gain: 0.26 }),
    ],
  },

  blind: {
    about: 'Blind: a dark smoky pass across the eyes, low and soft, with the light going out of the top.',
    category: 'spell',
    length: 1.6,
    top: 6000,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.8,
        freq: 1800,
        freqTo: 320,
        q: 0.7,
        attack: 0.05,
        curve: 2,
        gain: 0.3,
        pan: -0.35,
        panTo: 0.35,
      },
      drone([LOW.home, LOW.tense], { at: 0.05, dur: 1, vel: 0.45, gain: 0.24 }),
      subImpact({ at: 0.05, freq: 70, dur: 0.5, gain: 0.24, curve: 2.6 }),
    ],
  },

  poison: {
    about: 'Poison: a sickly held note wobbling a quarter-tone under the 2, with slow bubbles in it.',
    category: 'spell',
    length: 1.8,
    top: 6500,
    layers: [
      {
        kind: 'tone',
        at: 0,
        dur: 1.2,
        freq: 277,
        toFreq: 262,
        wave: 'tri',
        attack: 0.12,
        curve: 1.6,
        gain: 0.26,
        vibrato: 0.03,
        vibratoRate: 5,
        lowpass: 1800,
      },
      ...scatter(10, { at: 0.1, span: 1.1, freq: 600, freqSpread: 1, dur: 0.06, gain: 0.08, seed: 2323 }),
      drone([LOW.ache, LOW.tense], { at: 0.05, dur: 1.1, vel: 0.4, gain: 0.2 }),
    ],
  },

  berserk: {
    about: 'Berserk: low brass and strings surge up together and refuse to resolve.',
    category: 'spell',
    length: 2,
    top: 8000,
    layers: [
      {
        kind: 'note',
        instrument: 'trombone',
        pitch: ['B1', 'F#2'],
        dur: 0.9,
        vel: 0.85,
        attack: 0.06,
        at: 0,
        gain: 0.4,
        pan: -0.2,
      },
      lowStrings(['B1', 'D2'], { at: 0.05, dur: 1.1, vel: 0.7, gain: 0.34, tremolo: true }),
      timpani('B1', { at: 0, dur: 0.7, vel: 0.85, gain: 0.3 }),
      subImpact({ at: 0, freq: SUB.home, dur: 0.8, gain: 0.34, curve: 2.4 }),
      {
        kind: 'air',
        at: 0.05,
        dur: 0.7,
        freq: 300,
        freqTo: 900,
        q: 1.2,
        attack: 0.1,
        curve: 1.8,
        gain: 0.16,
      },
    ],
  },

  confuse: {
    about: 'Confuse: one glass figure spiralling through the pitch set, never landing where it should.',
    category: 'spell',
    length: 2.2,
    layers: [
      ...[MAGIC.move, MAGIC.ache, UI.home, MAGIC.tense, UI.neutral, MAGIC.home].map((pitch, i) => ({
        kind: 'note' as const,
        instrument: 'vibraphone',
        pitch,
        dur: 0.3,
        vel: 0.45,
        attack: 0.015,
        at: i * 0.22,
        gain: 0.3,
        pan: Math.sin(i * 1.7) * 0.4,
      })),
      {
        kind: 'tone',
        at: 0.1,
        dur: 1.3,
        freq: 330,
        toFreq: 294,
        wave: 'sine',
        attack: 0.2,
        curve: 1.4,
        gain: 0.14,
        vibrato: 0.05,
        vibratoRate: 3.2,
        lowpass: 2400,
      },
    ],
  },

  curse: {
    about: 'Curse: the b6 and the 2 struck together low and left to grind — the one deliberate dissonance.',
    category: 'spell',
    length: 2.4,
    top: 7500,
    layers: [
      toll(LOW.tense, { at: 0, dur: 1.2, vel: 0.6, gain: 0.34, pan: -0.2 }),
      toll(LOW.ache, { at: 0.04, dur: 1.2, vel: 0.5, gain: 0.28, pan: 0.22 }),
      choirBloom([LOW.tense, LOW.ache], { at: 0.05, dur: 1.4, vel: 0.5, gain: 0.26, voice: 'choir', attack: 0.15 }),
      tamTam({ at: 0.05, dur: 1.6, vel: 0.5, gain: 0.2, speed: 0.9 }),
      subImpact({ at: 0.02, freq: SUB.deep, dur: 1, gain: 0.3, curve: 1.8 }),
    ],
  },

  scan: {
    about: 'Scan: a thin sweep with three small readings taken along it, clinical and quiet.',
    category: 'ui',
    length: 1.4,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.7,
        freq: 1600,
        freqTo: 5200,
        q: 2.4,
        attack: 0.04,
        curve: 1.6,
        gain: 0.16,
        highpass: 800,
      },
      ...[0.1, 0.34, 0.58].map((at, i) => glassHigh([MAGIC.move, UI.home, UI.move][i] ?? UI.home, {
        at,
        dur: 0.04,
        vel: 0.35,
        gain: 0.3,
        pan: -0.25 + i * 0.25,
      })),
      bell(UI.neutral, { at: 0.62, dur: 0.4, vel: 0.3, gain: 0.2, pan: 0.2 }),
    ],
  },

  'steal-success': {
    about: 'Steal: a quick grab of cloth and a bright little jingle getting away with it.',
    category: 'flourish',
    length: 1.2,
    peak: 0.75,
    layers: [
      cloth({ at: 0, dur: 0.07, gain: 0.2 }),
      whoosh({ at: 0.02, dur: 0.14, from: 1200, to: 2800, pan: 0.3, panTo: -0.3, gain: 0.2 }),
      harpRoll([MAGIC.move, UI.home, UI.neutral, UI.move], { at: 0.14, roll: 0.035, dur: 0.35, vel: 0.55, gain: 0.4 }),
      glassHigh(UI.high, { at: 0.26, dur: 0.06, vel: 0.5, gain: 0.3, pan: 0.2 }),
    ],
  },

  'steal-fail': {
    about: 'Nothing in the hand: the same grab, then a dull pizzicato thud where the jingle should be.',
    category: 'ui',
    length: 0.8,
    layers: [
      cloth({ at: 0, dur: 0.07, gain: 0.2 }),
      whoosh({ at: 0.02, dur: 0.14, from: 1200, to: 2400, pan: 0.3, panTo: -0.2, gain: 0.18 }),
      pizz(LOW.home, { at: 0.16, vel: 0.5, gain: 0.34 }),
      {
        kind: 'sub',
        at: 0.16,
        dur: 0.16,
        freq: 98,
        toFreq: 72,
        curve: 4.5,
        gain: 0.22,
      },
    ],
  },

  'item-use': {
    about: 'An item: a cork, a small glass bottle, and one mote of light leaving it.',
    category: 'ui',
    length: 0.9,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.045,
        freq: 900,
        freqTo: 2200,
        q: 2.6,
        attack: 0.003,
        curve: 6,
        gain: 0.22,
      },
      pizz(MAGIC.neutral, { at: 0.005, vel: 0.5, gain: 0.22, pan: -0.15 }),
      glassHigh(UI.neutral, { at: 0.09, dur: 0.06, vel: 0.4, gain: 0.3, pan: 0.2 }),
      ...shimmer({ at: 0.1, dur: 0.5, spread: 0.25, gain: 0.16 }),
    ],
  },

  'phoenix-down': {
    about: 'Phoenix Down: a feather turning over in the air, then warmth arriving underneath it.',
    category: 'spell',
    length: 2.4,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.4,
        freq: 2400,
        freqTo: 1000,
        q: 1.2,
        attack: 0.06,
        curve: 2,
        gain: 0.16,
        pan: -0.3,
        panTo: 0.25,
      },
      choirBloom([MAGIC.tense, MAGIC.home], { at: 0.3, dur: 1.3, vel: 0.55, gain: 0.34, attack: 0.16 }),
      toll(MAGIC.home, { at: 0.36, dur: 1.2, vel: 0.55, gain: 0.3 }),
      harpRoll([MAGIC.neutral, MAGIC.move, UI.home, UI.neutral], { at: 0.32, roll: 0.05, dur: 0.6, vel: 0.5, gain: 0.34 }),
      ...shimmer({ at: 0.5, dur: 1.2, spread: 0.6, gain: 0.2 }),
    ],
  },

  elixir: {
    about: 'Elixir: everything a cure does, unhurried, with the bells allowed to ring all the way out.',
    category: 'flourish',
    length: 3.2,
    layers: [
      {
        kind: 'air',
        at: 0,
        dur: 0.05,
        freq: 1000,
        freqTo: 2400,
        q: 2.6,
        attack: 0.004,
        curve: 6,
        gain: 0.2,
      },
      choirBloom(CHORDS.tonic, { at: 0.15, dur: 1.8, vel: 0.6, gain: 0.36, attack: 0.18 }),
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home, UI.neutral, UI.move], {
        at: 0.2,
        roll: 0.06,
        dur: 0.9,
        vel: 0.55,
        gain: 0.42,
      }),
      toll(MAGIC.home, { at: 0.3, dur: 1.8, vel: 0.6, gain: 0.32 }),
      toll(MAGIC.move, { at: 0.75, dur: 1.5, vel: 0.45, gain: 0.24, pan: -0.25 }),
      ...shimmer({ at: 0.5, dur: 1.8, spread: 0.9, gain: 0.22 }),
      sopranoLine(MAGIC.high, { at: 0.9, dur: 1.4, vel: 0.45, gain: 0.22, pan: 0.15 }),
    ],
  },

  'mp-restore': {
    about: 'MP comes back: a cool blue shimmer filling from the bottom of the triad upward.',
    category: 'spell',
    length: 1.8,
    layers: [
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, UI.home], { roll: 0.06, dur: 0.6, vel: 0.5, gain: 0.36 }),
      choirBloom([MAGIC.move, MAGIC.high], { at: 0.2, dur: 1.1, vel: 0.42, gain: 0.24, attack: 0.2 }),
      ...shimmer({ at: 0.3, dur: 1, spread: 0.6, gain: 0.22 }),
      bell(UI.move, { at: 0.35, dur: 0.6, vel: 0.35, gain: 0.2, pan: 0.2 }),
    ],
  },

  'buff-generic': {
    about: 'Something good lands: two glass notes rising to the tonic over a warm chord. Always upward.',
    category: 'spell',
    length: 1.4,
    layers: [
      glass(UI.neutral, { at: 0, dur: 0.04, vel: 0.5, gain: 0.42, pan: -0.18 }),
      glass(UI.home, { at: 0.06, dur: 0.06, vel: 0.5, gain: 0.44, pan: 0.18 }),
      choirBloom(CHORDS.tonic, { at: 0.05, dur: 0.9, vel: 0.45, gain: 0.26, attack: 0.12 }),
      ...shimmer({ at: 0.12, dur: 0.7, spread: 0.35, gain: 0.16 }),
    ],
  },

  'debuff-generic': {
    about: 'Something bad lands: two glass notes falling to the b6 over low strings. Always downward, never harsh.',
    category: 'spell',
    length: 1.6,
    layers: [
      glass(UI.ache, { at: 0, dur: 0.04, vel: 0.45, gain: 0.4, pan: 0.18 }),
      glass(MAGIC.tense, { at: 0.07, dur: 0.08, vel: 0.45, gain: 0.42, pan: -0.18 }),
      lowStrings([LOW.tense, LOW.home], { at: 0.06, dur: 1, vel: 0.5, gain: 0.28 }),
      subImpact({ at: 0.06, freq: 74, dur: 0.4, gain: 0.2, curve: 3 }),
    ],
  },

  'summon-depart': {
    about: 'The aeon leaves: the arrival played backwards — weight lifting, light going up and away.',
    category: 'flourish',
    length: 3,
    layers: [
      tamTam({ at: 0, dur: 1.2, vel: 0.6, gain: 0.26 }),
      {
        kind: 'note',
        instrument: 'choir-ooh',
        pitch: CHORDS.tonic,
        dur: 1.2,
        vel: 0.6,
        reverse: true,
        at: 0.1,
        gain: 0.34,
      },
      {
        kind: 'air',
        at: 0.2,
        dur: 1.4,
        freq: 600,
        freqTo: 4200,
        q: 0.8,
        attack: 0.2,
        curve: 1.4,
        gain: 0.2,
      },
      ...[MAGIC.move, UI.home, UI.neutral, UI.move, UI.high].map((pitch, i) => glassHigh(pitch, {
        at: 1.1 + i * 0.18,
        dur: 0.12,
        vel: 0.4 - i * 0.04,
        gain: 0.28 - i * 0.03,
        pan: i % 2 === 0 ? -0.3 : 0.32,
      })),
      breath({ at: 1, dur: 1.2, gain: 0.06 }),
    ],
  },

  'aeon-overdrive': {
    about: "An aeon's Overdrive: a long charge under a tremolo climb, then the choir arriving with the whole orchestra.",
    category: 'flourish',
    length: 3.8,
    layers: [
      suction({ at: 0, dur: 1.4, low: 300, high: 4000, gain: 0.24 }),
      lowStrings(['B1', 'F#2'], { at: 0.1, dur: 1.4, vel: 0.65, gain: 0.3, tremolo: true }),
      cymbalSwell({ at: 0.6, dur: 1.2, vel: 0.6, gain: 0.18 }),
      subImpact({ at: 1.6, freq: SUB.deep, dur: 1.6, gain: 0.6, curve: 1.7 }),
      timpani('B1', { at: 1.6, dur: 1.2, vel: 0.95, gain: 0.34 }),
      tamTam({ at: 1.62, dur: 2, vel: 0.85, gain: 0.3 }),
      choirBloom(CHORDS.open, { at: 1.65, dur: 2, vel: 0.7, gain: 0.4, attack: 0.12 }),
      toll(MAGIC.home, { at: 1.68, dur: 1.8, vel: 0.65, gain: 0.3 }),
      sopranoLine(UI.home, { at: 2.1, dur: 1.5, vel: 0.55, gain: 0.26, pan: -0.12 }),
    ],
  },
};
