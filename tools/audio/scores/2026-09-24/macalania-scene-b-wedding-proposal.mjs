/**
 * SKETCH B for Chapter VII's scene cue (`scene-macalania-temple`, working key)
 * — "The Wedding Proposal". Seymour's courtly menace in the antechamber.
 * About 60 s, C# minor, 3/4, 96 bpm.
 *
 * ORIGINAL COMPOSITION (AGENTS.md rule 8). The minuet tune and the violin's
 * offer are written below note by note. The only borrowed material is this
 * project's own SEYMOUR cell ("Noble Rot", THEMES.md §3), its minor-third
 * sequence and its unresolved G#7, all imported from
 * `src/audio/tracks/themes.ts`. It quotes no retail cue: not "Seymour's
 * Theme", not the game's wedding music, not any Uematsu tune. No organ, no
 * choir (THEMES.md §3 resemblance guard). `SEYMOUR_UNMOORED` is not used.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Seymour in the Macalania
 * Temple antechamber, pre-Flux: courteous, not messianic (the script header of
 * `src/story/scripts/seymour-anima-macalania.ts`; research §9.6). His
 * chromaticism and his one dominant are allowed; nobody else's are.
 *
 * HOW IT DIFFERS FROM THE BATTLE CUE. "The Courtesy" (`boss-seymour-macalania`)
 * is a 4/4 pavane on harpsichord with the cell on oboe at 126 bpm. This is a
 * 3/4 minuet on a string quartet with no harpsichord and no oboe; the cell is
 * on clarinet, and it is in 4/4 while the dance is in 3/4, so his phrase never
 * lines up with the bar. His time is not the dance's time.
 *
 * Form (3/4, 96 bpm, 32 bars, 96 beats, 60.0 s plus the tail):
 *   bars  1- 8  beats  0-24  the minuet, string quartet; the cadence is deceptive (G#7 - Amaj7)
 *   bars  9-16  beats 24-48  the minuet again, an octave up; SEYMOUR on clarinet across the barlines,
 *                            up the minor thirds; the #iv dim7 gets into the cadence
 *   bars 17-24  beats 48-72  the proposal: the dance stops, Amaj7, the violin's offer,
 *                            then Gdim7 under it and a leading tone that is held, not resolved
 *   bars 25-32  beats 72-96  the dance returns in pizzicato only; the cell's bow once more;
 *                            it ends on G#7 with his last note hanging over it
 */

import { chordLine, motif, toMidi } from '../../../../src/audio/score.ts';
import { SEYMOUR, SEYMOUR_SEQUENCE } from '../../../../src/audio/tracks/themes.ts';
import { shape, arch } from '../2026-09-21/sketch-kit.mjs';

const DANCE = 0;
const AGAIN = 24;
const OFFER = 48;
const AFTER = 72;
const LENGTH = 96;
const BAR = 3;

// --------------------------------------------------------------- the minuet

/** Eight bars of 3/4, C# minor with the raised leading tone. [beat, dur, pitch]. */
const MINUET = [
  [0, 1, 'G#4'], [1, 1, 'C#5'], [2, 0.5, 'B4'], [2.5, 0.5, 'A4'],
  [3, 2, 'G#4'], [5, 1, 'F#4'],
  [6, 1, 'E4'], [7, 1, 'A4'], [8, 0.5, 'G#4'], [8.5, 0.5, 'F#4'],
  [9, 2, 'E4'], [11, 1, 'D#4'],
  [12, 1, 'E4'], [13, 1, 'G#4'], [14, 1, 'C#5'],
  [15, 1.5, 'E5'], [16.5, 0.5, 'D#5'], [17, 1, 'C#5'],
  [18, 1, 'B#4'], [19, 1, 'C#5'], [20, 0.5, 'D#5'], [20.5, 0.5, 'B#4'],
  [21, 3, 'C#5'],
];
/** Courtly: a lift on beat 1, lighter on 2 and 3. `up` transposes in semitones. */
function minuet(start, up = 0) {
  return MINUET.map(([at, dur, p]) => {
    const beat = at % 3;
    const v = beat === 0 ? 0.66 : beat < 2 ? 0.52 : 0.5;
    return [start + at, dur * 0.94, toMidi(p) + up, v];
  });
}

/** The first eight bars: courteous, and the cadence is deceptive. */
const HARMONY_1 = ['C#m', 'C#m', 'A', 'E', 'C#m', 'F#m', 'G#7', 'Amaj7'];
/** The repeat: his #iv dim7 has got into the cadence. */
const HARMONY_2 = ['C#m', 'C#m', 'A', 'E', 'C#m', 'F#m', 'Gdim7', 'G#7'];

/** Quartet accompaniment: the bass on 1 (pizzicato), the chord on 2 and 3 (bowed, short). */
function oomPahPah(symbols, start, velocity = 0.42) {
  const upper = symbols.flatMap((sym, bar) => [
    ...chordLine([sym], { start: start + bar * BAR + 1, octave: 3, center: 60, dur: 0.7, velocity }),
    ...chordLine([sym], { start: start + bar * BAR + 2, octave: 3, center: 60, dur: 0.7, velocity: velocity * 0.9 }),
  ]);
  return upper;
}
function bassOnOne(symbols, start, velocity = 0.56) {
  const ROOTS = { 'C#m': 'C#2', A: 'A1', E: 'E2', 'F#m': 'F#2', 'G#7': 'G#1', Amaj7: 'A1', Gdim7: 'G1' };
  return symbols.map((sym, bar) => [start + bar * BAR, 0.9, ROOTS[sym], velocity]);
}

/** The repeat goes up an octave, out of the clarinet's way. */
const violin = [
  ...arch(minuet(DANCE), DANCE, DANCE + 24, 0.56, 0.72),
  ...arch(minuet(AGAIN, 12), AGAIN, AGAIN + 24, 0.46, 0.6),
];
const quartet = [
  ...oomPahPah(HARMONY_1, DANCE),
  ...oomPahPah(HARMONY_2, AGAIN, 0.4),
];
const pizz = [
  ...bassOnOne(HARMONY_1, DANCE),
  ...bassOnOne(HARMONY_2, AGAIN, 0.52),
];

// -------------------------------------------------------------- his entrance

/**
 * SEYMOUR on clarinet, in his own 4/4 (8 beats) laid over the 3/4 dance: it
 * enters on beat 2 of bar 9 and climbs the minor thirds C# - E - G, three
 * statements, each one landing somewhere different in the bar.
 * THEMES.md §3's velocity shape: the bow up to the b6 is thrown away.
 */
const COURTEOUS = [0.72, 0.5, 0.7, 0.76, 0.66, 0.6];
const cell = shape(
  motif(SEYMOUR, [AGAIN + 1, AGAIN + 9, AGAIN + 17], SEYMOUR_SEQUENCE.slice(0, 3).map((p) => p.replace('3', '4'))),
  COURTEOUS,
);

// --------------------------------------------------------------- the offer

/** The dance stops. Amaj7 (bVI, shimmering), then his Gdim7, then his G#7. */
const offerChords = [
  ...chordLine(['Amaj7'], { start: OFFER, octave: 3, center: 62, dur: 12, velocity: 0.4 }),
  ...chordLine(['Gdim7'], { start: OFFER + 12, octave: 3, center: 62, dur: 6, velocity: 0.44 }),
  ...chordLine(['G#7'], { start: OFFER + 18, octave: 3, center: 62, dur: 6, velocity: 0.4 }),
];
const offerBass = [
  [OFFER, 12, 'A1', 0.4],
  [OFFER + 12, 6, 'G1', 0.46],
  [OFFER + 18, 6, 'G#1', 0.42],
];
/**
 * The violin's offer: it sounds almost sincere. Up to G#5 and A5 over the
 * Amaj7, down onto A#4 over the dim7, and the last note is B#4, the leading
 * tone, held over G#7 and not resolved.
 */
const OFFER_LINE = [
  [0, 2, 'E5'], [2, 1, 'C#5'],
  [3, 3, 'G#5'],
  [6, 1.5, 'A5'], [7.5, 0.5, 'G#5'], [8, 1, 'E5'],
  [9, 3, 'C#5'],
  [12, 2, 'E5'], [14, 1, 'C#5'],
  [15, 3, 'A#4'],
  [18, 6, 'B#4'],
];
const offer = arch(OFFER_LINE.map(([at, d, p]) => [OFFER + at, d, p, 0.62]), OFFER, OFFER + 24, 0.5, 0.72);
/** One bell, far away, as he asks: the tonic, struck once. */
const bell = [[OFFER + 3, 6, 'C#5', 0.34]];
/** The celesta doubles the offer's high point, two octaves up — a ring, not a melody. */
const celesta = [
  [OFFER + 3, 2, 'G#6', 0.3],
  [OFFER + 6, 2, 'A6', 0.28],
];

// --------------------------------------------------------------- after

/** The dance comes back as pizzicato only: the minuet's first four bars, thin. */
const pizzDance = [
  ...MINUET.filter(([at]) => at < 12).map(([at, d, p]) => [AFTER + at, 0.6, p, (at % 3 === 0 ? 0.5 : 0.4)]),
  ...bassOnOne(['C#m', 'C#m', 'A', 'F#m'], AFTER, 0.46),
];
/** The quartet only on beat 1, the last eight bars, fading: C#m C#m A F#m | Gdim7 Gdim7 G#7 G#7. */
const HARMONY_3 = ['C#m', 'C#m', 'A', 'F#m', 'Gdim7', 'Gdim7', 'G#7', 'G#7'];
const lastChords = HARMONY_3.flatMap((sym, bar) =>
  chordLine([sym], {
    start: AFTER + bar * BAR,
    octave: 3,
    center: 58,
    dur: bar === 7 ? 6 : 2.6,
    velocity: 0.4 - bar * 0.015,
  }),
);
const lastBass = [
  ...bassOnOne(['Gdim7', 'Gdim7', 'G#7'], AFTER + 12, 0.44),
  [AFTER + 21, 6, 'G#1', 0.4],
];
/**
 * The cell's bow once more, on clarinet at pitch (C#4 - A4 - G#4), and then
 * the cell's last note, E4, held over the final G#7 as the b13 THEMES.md
 * describes. The decline in between is left out: he does not finish the thought.
 */
const bow = shape(motif(SEYMOUR.slice(0, 3), [AFTER + 13], ['C#4']), [0.62, 0.44, 0.6]);
const hang = [[AFTER + 21, 6, 'E4', 0.5]];

export default {
  name: 'sketch-macalania-scene-b',
  bpm: 96,
  timeSig: [3, 4],
  loop: { start: DANCE, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  gain: 1,
  fx: {
    reverb: { room: 0.86, damp: 0.34, width: 0.92, preDelay: 0.024 },
  },
  channels: [
    { name: 'violin (the minuet, the offer)', instrument: 'violin-solo', volume: 0.7, pan: -0.14, notes: [...violin, ...offer], fx: { reverb: 0.36 }, perform: { timingJitterMs: 10 } },
    { name: 'string quartet (the dance)', instrument: 'string-quartet', volume: 0.54, pan: 0.06, notes: [...quartet, ...lastChords], fx: { reverb: 0.34 } },
    { name: 'pizzicato (the bass on 1)', instrument: 'pizzicato', volume: 0.56, pan: -0.06, notes: [...pizz, ...pizzDance, ...lastBass], fx: { reverb: 0.26 } },
    { name: 'clarinet (Seymour)', instrument: 'clarinet', volume: 0.64, pan: 0.16, notes: [...cell, ...bow, ...hang], fx: { reverb: 0.34 }, perform: { timingJitterMs: 8 } },
    { name: 'strings (the offer)', instrument: 'strings', volume: 0.46, pan: 0.02, notes: offerChords, fx: { reverb: 0.44 } },
    { name: 'low strings (the offer)', instrument: 'strings-low', volume: 0.46, pan: -0.1, notes: offerBass, fx: { reverb: 0.38 } },
    { name: 'bell (far away)', instrument: 'chimes', volume: 0.32, pan: 0.24, notes: bell, fx: { reverb: 0.6 } },
    { name: 'celesta (a ring)', instrument: 'celesta', volume: 0.34, pan: 0.28, notes: celesta, fx: { reverb: 0.5 } },
  ],
};
