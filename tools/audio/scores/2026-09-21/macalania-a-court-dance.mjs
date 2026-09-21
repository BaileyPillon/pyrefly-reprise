/**
 * SKETCH A for the Macalania battle cue — "The Courtesy".
 * A court dance that curdles. 45 s, C# minor, 4/4, 126 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** The cue belongs to the
 * `seymour-anima-macalania` chapter, which is FFX chapters 1-3 material
 * (`docs/plans/chapter-macalania-review.md` §1). There is no FFX-2 counterpart
 * and nothing in this sketch is shared plumbing, so the absence test is
 * trivial: no FFX-2 chapter names it, because nothing names it at all — it is
 * not registered in `src/audio/tracks/index.ts`.
 *
 * THE BRIEF it is answering (`chapter-macalania-review.md` §6.3): a cue of the
 * fight's *own*, 120-132 bpm, orchestral and ceremonial, minor with insincere
 * liturgical cadences, a **stated theme** ("Seymour has an argument; the music
 * should have a sentence"), rising once at the summon and returning to
 * composure. Anti-brief: no synth-industrial textures, no gated percussion, no
 * relentless pedal ostinato — those belong to the Flux chapter. The two
 * Seymour cues must be distinguishable inside two seconds, and this one is the
 * same motif *earlier and politer*.
 *
 * THE MATERIAL is `SEYMOUR` ("Noble Rot", THEMES.md §3), imported, never
 * retyped: the courteous bow up a minor sixth and the chromatic decline, with
 * its published velocity shape (the snap up to the b6 is *quieter* than the
 * note before it — the whole character lives in that thrown-away note). The
 * eight-bar period is `motif(SEYMOUR, …, SEYMOUR_SEQUENCE)` an octave above
 * the shipped `boss-seymour` register, on an oboe rather than pedal organ:
 * that octave and that reed are the two-second difference.
 *
 * WHAT CURDLES: bars 13-18. The decline refuses to stop at the b3 and walks
 * down chromatically for three bars while the roots do the same underneath, the
 * harpsichord drops out entirely, and SEYMOUR_MIRROR answers in the cellos. The
 * dance never breaks; it simply stops arriving anywhere. Then bar 19 resumes
 * the dance exactly as it was, which is the point.
 *
 * Form (4/4, 126 bpm, 24 bars, 96 beats, 45.7 s):
 *   bars  1- 4  beats  0-16  harpsichord and pizzicato alone: the dance
 *   bars  5-12  beats 16-48  the theme, the eight-bar period, oboe
 *   bars 13-18  beats 48-72  the curdle: chromatic decline, no harpsichord
 *   bars 19-22  beats 72-88  composure: the theme quiet in the quartet
 *   bars 23-24  beats 88-96  the dance alone again, with one wrong note held
 *
 * Resemblance guard (THEMES.md §3): no chanted choir of any kind — there is no
 * choir on this sketch at all — and the chromatic ostinato never goes into an
 * organ left hand at speed. There is no organ here either.
 */

import {
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  motif,
  tracker,
  transposeNotes,
} from '../../../../src/audio/score.ts';
import { SEYMOUR, SEYMOUR_MIRROR, SEYMOUR_SEQUENCE } from '../../../../src/audio/tracks/themes.ts';
import { arch, between, shape } from './sketch-kit.mjs';

const INTRO = 0;
const THEME = 16;
const CURDLE = 48;
const COMPOSURE = 72;
const CODA = 88;
const LENGTH = 96;

/**
 * Half-bar changes throughout, which is `SEYMOUR_CHORDS`' own rate.
 * Bars 5-12 sequence that cell up in minor thirds (C# - E - G - C#), so the
 * harmony transposes with the motif instead of sitting still under it.
 * Bars 13-18 are the curdle: the roots walk down by semitone and every other
 * chord is a diminished seventh, which belongs to no key and resolves wherever
 * it likes.
 */
const CHORDS = [
  // bars 1-4 — the dance
  'C#m', 'C#m', 'Amaj7', 'Amaj7', 'C#m', 'C#m', 'G#7', 'G#7',
  // bars 5-6 — the cell at home
  'C#m', 'Amaj7', 'Gdim7', 'G#7',
  // bars 7-8 — up a minor third
  'Em', 'Cmaj7', 'A#dim7', 'B7',
  // bars 9-10 — and another
  'Gm', 'Ebmaj7', 'C#dim7', 'D7',
  // bars 11-12 — thrown home, having proved nothing
  'C#m', 'Amaj7', 'Gdim7', 'G#7',
  // bars 13-18 — the curdle: semitone descent, a diminished seventh every other chord
  'C#m', 'Bbdim7', 'Amaj7', 'Adim7', 'G#7', 'Gdim7',
  'F#m', 'Fdim7', 'Em', 'Ddim7', 'C#m', 'G#7',
  // bars 19-22 — composure
  'C#m', 'Amaj7', 'Gdim7', 'G#7', 'C#m', 'Amaj7', 'Gdim7', 'G#7',
  // bars 23-24 — the dance alone
  'C#m', 'C#m', 'Amaj7', 'C#m',
];

// --- the dance -------------------------------------------------------------

/**
 * A pavane figure: four notes to the half-bar, root - third - fifth - third.
 * Brittle and antique by instrument (harpsichord), courteous by rhythm, and it
 * never once syncopates. It is the sound of good manners.
 */
const danceAll = arpLine(CHORDS, {
  pattern: [0, 1, 2, 1],
  step: 0.5,
  dur: 0.46,
  octave: 4,
  center: 68,
  barBeats: 2,
});
const dance = concatNotes(
  arch(between(danceAll, INTRO, CURDLE), INTRO, CURDLE, 0.5, 0.72),
  arch(between(danceAll, COMPOSURE, LENGTH), COMPOSURE, LENGTH, 0.44, 0.62),
);

/** Pizzicato on the second and fourth beats — the bow of the dance. */
const pizzAll = chordLine(CHORDS, { octave: 3, center: 55, dur: 0.4, barBeats: 2 })
  .filter((n) => n[0] % 2 === 0)
  .map((n) => [n[0] + 1, 0.4, n[2], 0.5]);
const pizz = concatNotes(between(pizzAll, INTRO, CURDLE), between(pizzAll, COMPOSURE, CODA));

// --- the theme -------------------------------------------------------------

/**
 * `SEYMOUR`'s published velocity shape, verbatim from THEMES.md §3:
 * the snap up to the b6 is quieter than the note before it.
 */
const BOW = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];

/** The eight-bar period, an octave above the shipped cue's register. */
const period = shape(
  transposeNotes(motif(SEYMOUR, [THEME, THEME + 8, THEME + 16, THEME + 24], SEYMOUR_SEQUENCE), 12),
  BOW,
);

/** Composure: the same sentence twice more, quiet, in the quartet. */
const reprise = shape(
  transposeNotes(motif(SEYMOUR, [COMPOSURE, COMPOSURE + 8], ['C#3', 'C#3']), 12),
  BOW.map((v) => v - 0.14),
);

// --- the curdle ------------------------------------------------------------

/**
 * The decline will not stop. Written, not stamped: `SEYMOUR_UNMOORED` is
 * reserved for the Flux cue's final form and is not spent here.
 */
const decline = tracker(
  `E4:2 D#4 D4 C#4 | C4 B3 A#3 A3 | G#3 G3 F#3:4 |`,
  { start: CURDLE, gate: 0.99, velocity: 0.62, checkBars: 4 },
);

/** The mirror answers in contrary motion, low and unhurried. */
const mirror = shape(
  motif(SEYMOUR_MIRROR, [CURDLE, CURDLE + 8, CURDLE + 16], ['C#3', 'C3', 'B2']),
  BOW.map((v) => v - 0.1),
);

/** The one wrong note: the #4 held under the final tonic, and not written into it. */
const wrongNote = [[CODA + 2, 6, 'G3', 0.34]];

// --- the floor -------------------------------------------------------------

const roots = chordRoots(CHORDS, 2).map((m, i) => [i * 2, 1.85, m, i % 2 === 0 ? 0.6 : 0.46]);

/** One soft timpani stroke at each section head. Ceremonial, never martial. */
const drum = [
  [THEME, 2, 'C#2', 0.48],
  [CURDLE, 3, 'C#2', 0.54],
  [COMPOSURE, 2, 'C#2', 0.42],
  [CODA, 3, 'C#2', 0.3],
];

export default {
  name: 'sketch-macalania-a',
  bpm: 126,
  timeSig: [4, 4],
  loop: { start: 0, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  gain: 1,
  fx: {
    reverb: { room: 0.84, damp: 0.32, width: 0.95, preDelay: 0.022 },
    delay: { timeBeats: 0.75, feedback: 0.18, damp: 2400 },
  },
  channels: [
    {
      name: 'harpsichord (the dance)',
      instrument: 'harpsichord',
      volume: 0.72,
      pan: -0.2,
      notes: dance,
      fx: { reverb: 0.26 },
      perform: { timingJitterMs: 7 },
    },
    {
      name: 'pizzicato',
      instrument: 'pluck',
      volume: 0.5,
      pan: 0.15,
      notes: pizz,
      fx: { reverb: 0.2 },
    },
    {
      name: 'oboe (the theme)',
      instrument: 'oboe',
      volume: 0.95,
      pan: -0.1,
      notes: period,
      fx: { reverb: 0.3 },
      perform: { timingJitterMs: 10 },
    },
    {
      name: 'strings (the curdle)',
      instrument: 'strings',
      volume: 0.72,
      pan: 0,
      notes: arch(decline, CURDLE, CURDLE + 24, 0.5, 0.74),
      fx: { reverb: 0.34 },
      perform: { timingJitterMs: 16 },
    },
    {
      name: 'quartet (composure)',
      instrument: 'string-quartet',
      volume: 0.66,
      pan: 0.1,
      notes: reprise,
      fx: { reverb: 0.3 },
      perform: { timingJitterMs: 14 },
    },
    {
      name: 'cellos (the mirror)',
      instrument: 'strings-low',
      volume: 0.6,
      pan: -0.25,
      notes: mirror,
      fx: { reverb: 0.3 },
      perform: { timingJitterMs: 15 },
    },
    {
      name: 'clarinet (the wrong note)',
      instrument: 'clarinet',
      volume: 0.55,
      pan: 0.2,
      notes: wrongNote,
      fx: { reverb: 0.36 },
    },
    {
      name: 'basses',
      instrument: 'strings-low',
      volume: 0.5,
      pan: -0.1,
      transpose: -12,
      notes: roots,
      fx: { reverb: 0.22 },
      perform: { timingJitterMs: 15 },
    },
    {
      name: 'timpani',
      instrument: 'timpani',
      volume: 0.45,
      pan: 0.05,
      notes: drum,
      fx: { reverb: 0.3 },
    },
  ],
};
