/**
 * Menu, cursor and results effects.
 *
 * These are the sounds a player hears a hundred times an hour, so they are the
 * quietest, softest-edged things in the game: struck glass and small bells in
 * the interface octave of B minor, never a blip. The denial sound in
 * particular is two soft bells a whole tone apart rather than a buzz — see
 * `docs/audio/THEMES.md` § "Sound-effect rules", rule 1.
 */

import { breath, glass, glassHigh, harpRoll, shimmer, UI, bell, MAGIC, CHORDS, choirBloom } from './materials.ts';
import type { SfxDesign } from './design.ts';

export const uiSfx: Record<string, SfxDesign> = {
  'cursor-move': {
    about: 'Struck glass on the 5th, alone: 8 ms in, 45 ms of body, 300 ms of hall.',
    category: 'ui',
    length: 0.34,
    layers: [glass(UI.move, { dur: 0.045, vel: 0.5, gain: 0.7 })],
  },

  confirm: {
    about: 'Glass and a bell partial rising a third, D to F#: two attacks, the second softer.',
    category: 'ui',
    length: 0.55,
    layers: [
      glass(UI.neutral, { dur: 0.05, vel: 0.55 }),
      glass(UI.move, { at: 0.05, dur: 0.09, vel: 0.45, gain: 0.55 }),
      bell(MAGIC.move, { at: 0.05, dur: 0.3, vel: 0.35, gain: 0.22 }),
    ],
  },

  cancel: {
    about: 'The confirm reversed and shorter: F# falling to D, damped early.',
    category: 'ui',
    length: 0.42,
    layers: [
      glass(UI.move, { dur: 0.045, vel: 0.5 }),
      glass(UI.neutral, { at: 0.045, dur: 0.07, vel: 0.4, gain: 0.5 }),
    ],
  },

  error: {
    about: 'Denial: two soft bells a whole tone apart, the b6 leaning on the 5, damped in 200 ms.',
    category: 'ui',
    length: 0.5,
    layers: [
      // Damped hard and rolled off at 6 kHz: a refusal should sound like a hand
      // laid on the bell, not a struck one left to ring.
      bell(UI.tense, { dur: 0.16, vel: 0.5, gain: 0.5, pan: -0.15, lowpass: 6000 }),
      bell(UI.move, { at: 0.012, dur: 0.16, vel: 0.42, gain: 0.42, pan: 0.18, lowpass: 6000 }),
      // A breath under them, so the two bells read as one gesture refusing.
      breath({ at: 0, dur: 0.22, gain: 0.05 }),
    ],
  },

  'menu-open': {
    about: 'Harp harmonics over B D F# G, rolled upward in 120 ms, breath underneath.',
    category: 'ui',
    length: 0.7,
    layers: [
      harpRoll([MAGIC.home, MAGIC.neutral, MAGIC.move, MAGIC.tense], { roll: 0.035, dur: 0.3, vel: 0.5 }),
      breath({ dur: 0.28, gain: 0.08 }),
    ],
  },

  'menu-close': {
    about: 'The same harp harmonics rolled back down, and the breath drawn in.',
    category: 'ui',
    length: 0.6,
    layers: [
      harpRoll([MAGIC.tense, MAGIC.move, MAGIC.neutral, MAGIC.home], { roll: 0.03, dur: 0.22, vel: 0.42 }),
      breath({ dur: 0.25, gain: 0.07, reverse: true }),
    ],
  },

  'coin-tick': {
    about: 'Results counter: one glockenspiel mote on the tonic, tiny and unhurried.',
    category: 'ui',
    length: 0.22,
    layers: [glassHigh(UI.high, { dur: 0.05, vel: 0.4, gain: 0.5 })],
  },

  'status-applied': {
    about: 'A status lands: glass on the 2 — the ache — blooming into a vibraphone held note.',
    category: 'ui',
    length: 0.9,
    layers: [
      glass(UI.ache, { dur: 0.05, vel: 0.5, pan: -0.2 }),
      {
        kind: 'note',
        instrument: 'vibraphone',
        pitch: [MAGIC.ache, MAGIC.move],
        dur: 0.5,
        vel: 0.45,
        attack: 0.02,
        at: 0.03,
        gain: 0.4,
        pan: 0.22,
      },
    ],
  },

  'overdrive-full': {
    about: 'The gauge fills: motes of light rising into a bell on the tonic inside a choir bloom.',
    category: 'flourish',
    length: 2.2,
    layers: [
      ...shimmer({ at: 0, dur: 0.9, spread: 0.5, gain: 0.32 }),
      bell(MAGIC.high, { at: 0.42, dur: 1.1, vel: 0.7, gain: 0.55 }),
      bell(MAGIC.move, { at: 0.47, dur: 1.1, vel: 0.5, gain: 0.3, pan: -0.25 }),
      choirBloom(CHORDS.tonic, { at: 0.3, dur: 1.2, vel: 0.5, gain: 0.32 }),
    ],
  },
};
