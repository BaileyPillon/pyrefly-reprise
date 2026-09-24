/**
 * SKETCH B for the Seymour Natus battle cue (Chapter X) — "The Highbridge Flight".
 * The party is running and he is behind them. About 60 s, C# minor, 4/4, 152 bpm.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). The only borrowed material is this
 * project's own SEYMOUR cell ("Noble Rot", `src/audio/tracks/themes.ts`,
 * imported). The flight line, the chase figure and the voicings are written
 * below. It does not quote or imitate any retail cue — explicitly not "Run!!"
 * (the anti-brief in docs/plans/chapter-natus-review.md O-6) and not the game's
 * Seymour battle music. No organ at all, no choir, no drum kit: an orchestra
 * running.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** The Highbridge of Bevelle
 * (docs/plans/chapter-natus-review.md). `SEYMOUR_UNMOORED` is not used
 * (THEMES.md reserves it for `boss-seymour`).
 *
 * THE IDEA. The chase figure under everything is Seymour's own decline
 * (5 #4 4 b3 and b6 5 #4 4) cut into eighth notes: he is the ground the party
 * runs on. The party's line above is diatonic C# Aeolian and climbs; his is
 * chromatic and falls. Where he closes in, the figure moves by his minor-third
 * sequence (C# E G C#) and the cell itself enters at half speed in the
 * trombones. Where the party gains ground, the figure turns into their own
 * diatonic arpeggio.
 *
 * Form (4/4, 152 bpm, 38 bars, 152 beats, 60.0 s plus the tail):
 *   bars  1- 4  beats   0- 16  the chase figure alone, drums on 1 and the and-of-2
 *   bars  5-12  beats  16- 48  the flight: horns, i bVI bVII i
 *   bars 13-20  beats  48- 80  he closes in: the figure sequenced C# E G C#, the cell in trombones
 *   bars 21-28  beats  80-112  distance: violins and trumpets take the line, the figure goes diatonic
 *   bars 29-36  beats 112-144  both at once: the line on top, the cell at half speed underneath
 *   bars 37-38  beats 144-152  one cut, the figure alone again (it loops back to bar 5)
 */

import { chordLine, chordRoots, motif, tracker } from '../../../../src/audio/score.ts';
import { augment, SEYMOUR, SEYMOUR_SEQUENCE } from '../../../../src/audio/tracks/themes.ts';
import { shape } from '../2026-09-21/sketch-kit.mjs';

const CHASE = 0;
const FLIGHT = 16;
const CLOSING = 48;
const DISTANCE = 80;
const BOTH = 112;
const CUT = 144;
const LENGTH = 152;

// ------------------------------------------------------------ the chase

/**
 * One bar of the figure, semitones above the bar's root: 5 #4 4 b3, then
 * b6 5 #4 4. Two chromatic falls, eighth notes, accents on 1 and 3.
 */
const FIGURE = [7, 6, 5, 3, 8, 7, 6, 5];
const FIGURE_VEL = [0.78, 0.5, 0.56, 0.52, 0.72, 0.5, 0.56, 0.5];
function chase(start, bars, root, lift = 0) {
  const notes = [];
  for (let b = 0; b < bars; b++) {
    FIGURE.forEach((offset, e) => {
      notes.push([start + b * 4 + e * 0.5, 0.42, root + offset, Math.min(1, FIGURE_VEL[e] + lift)]);
    });
  }
  return notes;
}
const C_SHARP = 49; // C#3
const E = 52;
const G = 55;

/** The party's own figure in the distance section: diatonic arpeggio on their chords. */
const PARTY_ARP = [0, 7, 12, 7, 15, 12, 7, 12];
function partyFigure(start, chords) {
  return chords.flatMap((symbol, bar) => {
    const root = chordRoots([symbol], 3)[0];
    const third = symbol.endsWith('m') ? 3 : 4;
    return PARTY_ARP.map((off, e) => {
      const pitch = root + (off === 15 ? 12 + third : off);
      return [start + bar * 4 + e * 0.5, 0.42, pitch, e % 4 === 0 ? 0.7 : 0.5];
    });
  });
}

const PARTY_CHORDS = ['C#m', 'A', 'B', 'C#m', 'C#m', 'E', 'A', 'C#m'];

const figure = [
  ...chase(CHASE, 4, C_SHARP),
  ...chase(FLIGHT, 8, C_SHARP, 0.02),
  ...chase(CLOSING, 2, C_SHARP, 0.06),
  ...chase(CLOSING + 8, 2, E, 0.08),
  ...chase(CLOSING + 16, 2, G, 0.1),
  ...chase(CLOSING + 24, 2, C_SHARP, 0.12),
  ...partyFigure(DISTANCE, PARTY_CHORDS),
  ...chase(BOTH, 8, C_SHARP, 0.1),
  ...chase(CUT + 4, 1, C_SHARP, -0.1),
];

// ------------------------------------------------------------ the flight

/**
 * The party's line. C# Aeolian, no raised seventh, no chromatic step. It
 * climbs a sixth over eight bars and lands on the fifth, not the tonic, so the
 * loop keeps running.
 */
const FLIGHT_LINE = `
  C#4:1.5 E4:0.5 G#4:2 | F#4:1 G#4:1 B4:2 | A4:1.5 G#4:0.5 F#4:1 E4:1 | G#4:4 |
  C#4:1.5 E4:0.5 G#4:2 | B4:1 C#5:1 E5:2 | D#5:1.5 C#5:0.5 B4:1 C#5:1 | G#4:4 |
`;
function flightLine(start, transpose = 0, velocity = 0.72) {
  return tracker(FLIGHT_LINE, { start, transpose, velocity, gate: 0.94, checkBars: 4 });
}
/** Lift the long notes and the climb (bars 6 and 7) a little: the line breathes. */
function breathe(notes, from) {
  return notes.map((n) => {
    const bar = Math.floor((n[0] - from) / 4);
    const v = n[3] + (bar === 5 || bar === 6 ? 0.08 : 0) + (n[1] >= 2 ? 0.04 : 0) - (bar === 3 || bar === 7 ? 0.04 : 0);
    return [n[0], n[1], n[2], Math.min(1, v)];
  });
}
const hornFlight = breathe(flightLine(FLIGHT), FLIGHT);
const violinDistance = breathe(flightLine(DISTANCE, 12, 0.66), DISTANCE);
const trumpetDistance = breathe(flightLine(DISTANCE, 0, 0.6), DISTANCE);
const hornBoth = breathe(flightLine(BOTH, 0, 0.8), BOTH);
const violinBoth = breathe(flightLine(BOTH, 12, 0.7), BOTH);

// ------------------------------------------------------------ him

/** THEMES.md §3's velocity shape, a little harder: he is gaining. */
const PURSUIT = [0.78, 0.58, 0.76, 0.82, 0.72, 0.66];
/** The cell at pitch in trombones, sequenced with the figure (C# E G C#). */
const pursuit = shape(motif(SEYMOUR, [CLOSING, CLOSING + 8, CLOSING + 16, CLOSING + 24], SEYMOUR_SEQUENCE), PURSUIT);
/** At half speed under the flight in the last section: 16 beats a statement, twice. */
const halfSpeed = shape(motif(augment(SEYMOUR, 2), [BOTH, BOTH + 16], ['C#2', 'C#2']), [0.8, 0.62, 0.8, 0.86, 0.76, 0.7]);

// ------------------------------------------------------------ harmony

/** Low strings on the roots, quarter notes, the whole way; his chords while he closes in. */
const CLOSING_CHORDS = ['C#m', 'Amaj7', 'Em', 'Cmaj7', 'Gm', 'Ebmaj7', 'C#m', 'Amaj7'];
function roots(chords, start, octave = 2, v1 = 0.62, v = 0.48) {
  return chordRoots(chords, octave).flatMap((root, bar) =>
    [0, 1, 2, 3].map((q) => [start + bar * 4 + q, 0.9, root, q === 0 ? v1 : v]),
  );
}
const lowStrings = [
  ...roots(['C#m', 'C#m', 'C#m', 'C#m'], CHASE, 2, 0.56, 0.42),
  ...roots(PARTY_CHORDS, FLIGHT),
  ...roots(CLOSING_CHORDS, CLOSING, 2, 0.66, 0.52),
  ...roots(PARTY_CHORDS, DISTANCE),
  ...roots(PARTY_CHORDS, BOTH, 2, 0.68, 0.54),
];

/** Sustained strings: the party's chords held, one a bar, under the flight. */
const pads = [
  ...chordLine(PARTY_CHORDS, { start: FLIGHT, octave: 3, velocity: 0.42 }),
  ...chordLine(CLOSING_CHORDS, { start: CLOSING, octave: 3, velocity: 0.44 }),
  ...chordLine(PARTY_CHORDS, { start: DISTANCE, octave: 3, velocity: 0.46 }),
  ...chordLine(PARTY_CHORDS, { start: BOTH, octave: 3, velocity: 0.5 }),
];

/** Brass cuts on the and-of-4 where he closes in: every other bar. */
const stabs = CLOSING_CHORDS.flatMap((symbol, bar) =>
  bar % 2 === 1
    ? chordLine([symbol], { start: CLOSING + bar * 4 + 3.5, octave: 3, dur: 0.4, velocity: 0.74 + bar * 0.02 })
    : [],
);
/** The cut: everything on one beat. */
const cut = chordLine(['C#m'], { start: CUT, octave: 3, bassOctaves: 1, dur: 1.2, velocity: 1 });

/** A high tremolo while he closes in: the wire tightens a semitone every two bars. */
const wire = [
  [CLOSING, 8, 'G#5', 0.28],
  [CLOSING + 8, 8, 'A5', 0.3],
  [CLOSING + 16, 8, 'A#5', 0.32],
  [CLOSING + 24, 8, 'B5', 0.34],
];

// ------------------------------------------------------------ drums

/** Taiko on 1 and the and-of-2; from the closing section, 1, and-of-2, 4. */
function drums(start, bars, pattern) {
  const notes = [];
  for (let b = 0; b < bars; b++) {
    for (const [offset, v] of pattern) notes.push([start + b * 4 + offset, 1, 'C2', v + (b % 2) * 0.03]);
  }
  return notes;
}
const taiko = [
  ...drums(CHASE, 4, [[0, 0.66], [1.5, 0.54]]),
  ...drums(FLIGHT, 8, [[0, 0.7], [1.5, 0.58]]),
  ...drums(CLOSING, 8, [[0, 0.78], [1.5, 0.66], [3, 0.6]]),
  ...drums(DISTANCE, 8, [[0, 0.66], [2, 0.5]]),
  ...drums(BOTH, 8, [[0, 0.84], [1.5, 0.72], [3, 0.66], [3.5, 0.56]]),
  [CUT, 2, 'C2', 1],
];
const timpani = [
  ...[FLIGHT, CLOSING, CLOSING + 8, CLOSING + 16, CLOSING + 24, DISTANCE, BOTH, BOTH + 16].map((at, i) => [
    at,
    2,
    ['C#2', 'C#2', 'E2', 'G2', 'C#2', 'C#2', 'C#2', 'C#2'][i],
    0.56 + i * 0.03,
  ]),
  ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((t, i) => [CUT - 4 + t, 0.3, 'G#2', 0.4 + i * 0.03]),
  [CUT, 3, 'C#2', 1],
];
const cymbal = [
  [FLIGHT - 2, 2, 'C4', 0.5],
  [BOTH - 2, 2, 'C4', 0.6],
  [CUT, 4, 'C4', 0.66],
];

export default {
  name: 'sketch-natus-b',
  bpm: 152,
  timeSig: [4, 4],
  loop: { start: FLIGHT, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  gain: 1,
  fx: {
    reverb: { room: 0.86, damp: 0.36, width: 0.92, preDelay: 0.024 },
  },
  channels: [
    { name: 'the chase figure', instrument: 'strings-short', volume: 0.62, pan: -0.24, notes: figure, fx: { reverb: 0.2 }, perform: { timingJitterMs: 7 } },
    { name: 'horns (the flight)', instrument: 'horn', volume: 0.74, pan: 0.18, notes: [...hornFlight, ...hornBoth], fx: { reverb: 0.34 }, perform: { timingJitterMs: 10 } },
    { name: 'violins (distance)', instrument: 'strings', volume: 0.62, pan: -0.1, notes: [...violinDistance, ...violinBoth], fx: { reverb: 0.3 }, perform: { timingJitterMs: 9 } },
    { name: 'trumpets (distance)', instrument: 'trumpet', volume: 0.5, pan: 0.22, notes: trumpetDistance, fx: { reverb: 0.3 } },
    { name: 'trombones (him)', instrument: 'trombone', volume: 0.72, pan: -0.06, notes: [...pursuit, ...halfSpeed], fx: { reverb: 0.3 }, perform: { timingJitterMs: 10 } },
    { name: 'low strings (roots)', instrument: 'strings-low', volume: 0.52, pan: -0.16, notes: lowStrings, fx: { reverb: 0.22 }, perform: { timingJitterMs: 8 } },
    { name: 'string pads', instrument: 'strings', volume: 0.34, pan: 0.1, notes: pads, fx: { reverb: 0.4 } },
    { name: 'tremolo wire', instrument: 'strings-trem', volume: 0.34, pan: 0.12, notes: wire, fx: { reverb: 0.4 } },
    { name: 'brass cuts', instrument: 'brass-stab', volume: 0.56, pan: 0.06, notes: [...stabs, ...cut], fx: { reverb: 0.3 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.6, pan: 0, notes: taiko, fx: { reverb: 0.26 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.54, pan: 0.05, notes: timpani, fx: { reverb: 0.3 } },
    { name: 'cymbal swells', instrument: 'cymbal-swell', volume: 0.42, pan: 0.1, notes: cymbal, fx: { reverb: 0.4 } },
  ],
};
