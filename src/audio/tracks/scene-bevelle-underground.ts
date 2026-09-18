/**
 * "Iron Undertow" — the Bevelle Underground.
 *
 * ORIGINAL COMPOSITION. G minor, 100 bpm: cold machina ambience over a pedal
 * that never moves, with a harp allowed four notes a phrase and nothing else
 * that could be called warm. The one emotion is the machine under the
 * cathedral — and the cue's whole argument is that the machine got there
 * first.
 *
 * THEMES (docs/audio/THEMES.md, cue map row 13). Two visitors, one each:
 *
 *   - `SONGSTRESS_DARK` on the synth bass — the pop hook's identity leap with
 *     both ends flattened, here as a machine figure that repeats until it
 *     stops meaning anything. In G minor it is Bb - Eb - D.
 *   - `HYMN_POISONED`, ONCE, on the pedal organ, low and unaccompanied:
 *     Seymour's chromatic passing notes pushed between the prayer's steps
 *     until it no longer scans. Everything else stops for it, and two bars of
 *     silence follow it. It is never mentioned again in this cue or any other.
 *
 * Form (4/4, 100 bpm, 44 bars, 106 s):
 *   bars  1- 8  pulse     beats   0- 32  the bed spins up
 *   bars  9-16  figure    beats  32- 64  the dark cell on synth bass  <- loop
 *   bars 17-24  prayer    beats  64- 96  organ alone, then silence
 *   bars 25-32  machine   beats  96-128  the bed again, harp over it
 *   bars 33-40  figure    beats 128-160  the cell, doubled and harder
 *   bars 41-44  out       beats 160-176  everything drops but the pulse
 * Loop 32 -> 176.
 */

import { concatNotes, toMidi, type Note, type Track } from '../score.ts';
import { cell } from './motifs.ts';
import { HYMN_POISONED, SONGSTRESS_DARK, augment } from './themes.ts';
import { arpStackLine, groove, humanise, legato, ramp } from './ffx2-common.ts';

const PULSE = 0;
const FIGURE = 32;
const PRAYER = 64;
const MACHINE = 96;
const FIGURE2 = 128;
const OUT = 160;
const LENGTH = 176;

/**
 * The bed. Root motion is by step and third and it always comes back to G:
 * a machine idling, not a progression going anywhere. Two bars per root.
 */
const BED_ROOTS = ['G3', 'Eb3', 'C4', 'G3'];

// --- the machine -----------------------------------------------------------

/** Sixteenth ticks, one velocity, dropping out for the prayer. */
function ticks(start: number, beats: number, velocity: number): Note[] {
  const notes: Note[] = [];
  const pitches = ['G4', 'Bb4', 'D5', 'Bb4'];
  for (let i = 0; i < beats * 2; i++) {
    notes.push([start + i * 0.5, 0.22, pitches[i % pitches.length]!, velocity]);
  }
  return notes;
}

const tickNotes = concatNotes(
  ticks(PULSE + 8, 24, 0.3),
  ticks(FIGURE, 32, 0.36),
  ticks(MACHINE, 32, 0.38),
  ticks(FIGURE2, 32, 0.4),
  ticks(OUT, 16, 0.3),
);

/**
 * The dark cell as a machine figure: stated on the bass every two bars,
 * augmented so it fills them, and never varied — a phrase that has stopped
 * being a phrase.
 */
function figure(start: number, bars: number, velocity: number): Note[] {
  const out: Note[] = [];
  for (let bar = 0; bar < bars; bar += 2) {
    out.push(...cell(augment(SONGSTRESS_DARK, 2), start + bar * 4, 'G1', velocity));
  }
  return out;
}

const bassNotes = concatNotes(
  // The pedal itself: one note, under everything, for a hundred seconds.
  [
    [PULSE, 32, 'G1', 0.44],
    [FIGURE, 32, 'G1', 0.5],
    [MACHINE, 32, 'G1', 0.5],
    [FIGURE2, 32, 'G1', 0.54],
    [OUT, 16, 'G1', 0.42],
  ] as Note[],
  figure(FIGURE, 8, 0.66),
  figure(FIGURE2, 8, 0.78),
);

const metalNotes = concatNotes(
  groove('X.......x.......', { start: PULSE + 16, bars: 4, pitch: 'G3', velocity: 0.4, seed: 141, drift: 0 }),
  groove('X.......x...g...', { start: FIGURE, bars: 8, pitch: 'G3', velocity: 0.46, seed: 142, drift: 0 }),
  groove('X.......x...g...', { start: MACHINE, bars: 8, pitch: 'G3', velocity: 0.48, seed: 143, drift: 0 }),
  groove('X...g...x...g.g.', { start: FIGURE2, bars: 8, pitch: 'G3', velocity: 0.52, seed: 144, drift: 0 }),
  groove('X...............', { start: OUT, bars: 4, pitch: 'G3', velocity: 0.38, seed: 145, drift: 0 }),
);

const kickNotes = concatNotes(
  groove('X.......X.......', { start: PULSE, bars: 8, pitch: 'C2', velocity: 0.46, seed: 146, drift: 0 }),
  groove('X.......X.......', { start: FIGURE, bars: 8, pitch: 'C2', velocity: 0.54, seed: 147, drift: 0 }),
  groove('X.......X.......', { start: MACHINE, bars: 8, pitch: 'C2', velocity: 0.56, seed: 148, drift: 0 }),
  groove('X...x...X...x...', { start: FIGURE2, bars: 8, pitch: 'C2', velocity: 0.6, seed: 149, drift: 0 }),
  groove('X.......X.......', { start: OUT, bars: 4, pitch: 'C2', velocity: 0.46, seed: 150, drift: 0 }),
);

// --- the cathedral ---------------------------------------------------------

/**
 * The prayer, poisoned, once. Pedal organ, low, alone: the pulse, the bass
 * figure, the ticks and the drums are all written out of these eight bars, and
 * the last two of them are silence.
 */
const organNotes = concatNotes(
  humanise(legato(cell(augment(HYMN_POISONED, 2), PRAYER + 2, 'G2', 0.5), 0.1), 0.02, 151),
  // A sixteen-foot drone under it, and nothing else. The last eight beats of
  // the section are silence, and the silence is the point.
  [[PRAYER, 24, 'G1', 0.3]] as Note[],
);

/**
 * A cold bowed drone: open fifths, literally. No third, no seventh — nothing
 * that would tell you whether the place is major or minor, and nothing that
 * can sit a semitone from the bass figure walking underneath it.
 */
function fifths(root: string, at: number, dur: number, velocity: number): Note[] {
  const base = toMidi(root);
  return [
    [at, dur, base, velocity],
    [at + 0.05, dur - 0.05, base + 7, velocity * 0.92],
    [at + 0.1, dur - 0.1, base + 12, velocity * 0.84],
  ];
}

/** One open fifth per two bars, following the bed's roots. */
function drone(roots: string[], start: number, barBeats: number, dur: number, velocity: number): Note[] {
  return concatNotes(...roots.map((root, i) => fifths(root, start + i * barBeats, dur, velocity)));
}

const padNotes = humanise(
  concatNotes(
    fifths('G3', PULSE, 30, 0.3),
    drone(BED_ROOTS, FIGURE, 8, 7.6, 0.34),
    drone(BED_ROOTS, MACHINE, 8, 7.6, 0.36),
    drone(BED_ROOTS, FIGURE2, 8, 7.6, 0.4),
    fifths('G3', OUT, 14, 0.3),
  ),
  0.03,
  153,
);

/** Harp: four notes a phrase, and only after the prayer has been heard. */
const harpNotes = humanise(
  concatNotes(
    arpStackLine(['Gm', '', 'Ebmaj7', '', 'Cm7', '', 'Gm', ''], {
      start: MACHINE,
      pattern: [0, 1, 2, 3],
      step: 1,
      dur: 2.6,
      center: 72,
      keepRoot: true,
      velocity: 0.3,
      accent: 1.16,
      seed: 161,
    }),
    arpStackLine(['Gm', '', '', '', 'Ebmaj7', '', '', ''], {
      start: FIGURE2,
      pattern: [0, 1, 2, 3],
      step: 1,
      dur: 2.6,
      center: 72,
      keepRoot: true,
      velocity: 0.26,
      accent: 1.16,
      seed: 162,
    }),
  ),
  0.04,
  154,
);

/** Low strings: one bowed entry, at the moment the machine comes back. */
const lowStrings = humanise(
  [
    [MACHINE, 8, 'G2', 0.36],
    [MACHINE + 8, 8, 'Eb2', 0.34],
    [FIGURE2, 16, 'G2', 0.4],
    // Not D2: the bass figure's own Eb2 passes right over it, and a semitone
    // held against it down here is mud rather than tension.
    [FIGURE2 + 16, 12, 'G2', 0.36],
  ] as Note[],
  0.03,
  155,
);

export const sceneBevelleUndergroundTrack: Track = {
  name: 'scene-bevelle-underground',
  bpm: 100,
  timeSig: [4, 4],
  loop: { start: FIGURE, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.84, damp: 0.24, width: 0.94, preDelay: 0.03 },
    delay: { timeBeats: 0.75, feedback: 0.26, damp: 2200 },
  },
  channels: [
    { name: 'ticks', instrument: 'arp-pluck', volume: 0.32, pan: 0.28, notes: tickNotes, fx: { reverb: 0.2, delay: 0.22 } },
    { name: 'synth bass', instrument: 'synth-bass', volume: 0.74, pan: 0, notes: ramp(bassNotes, 0.96, 1.06, FIGURE, LENGTH - FIGURE), fx: { reverb: 0.08 } },
    { name: 'organ', instrument: 'organ', volume: 0.6, pan: -0.06, notes: organNotes, fx: { reverb: 0.55 } },
    { name: 'pad', instrument: 'pad', volume: 0.46, pan: 0.08, notes: padNotes, fx: { reverb: 0.5 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.44, pan: 0.18, notes: lowStrings, fx: { reverb: 0.4 } },
    { name: 'harp', instrument: 'harp', volume: 0.44, pan: -0.3, notes: harpNotes, fx: { reverb: 0.46, delay: 0.18 } },
    { name: 'hammer', instrument: 'metal-hit', volume: 0.42, pan: 0.24, notes: metalNotes, fx: { reverb: 0.3 } },
    { name: 'kick', instrument: 'kick-808', volume: 0.6, pan: 0, notes: kickNotes, fx: { reverb: 0.1 } },
  ],
};

export default sceneBevelleUndergroundTrack;
