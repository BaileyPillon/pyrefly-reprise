/**
 * THE SIX THEMES — the score's leitmotif material, in one place.
 *
 * ORIGINAL MATERIAL. Every cell, line and progression below was written for
 * this repo. Nothing here is transcribed, quoted or paraphrased from Final
 * Fantasy, Clair Obscur or any other copyrighted work; the resemblance to those
 * scores is meant to live in *instrumentation, mode, meter and texture* only.
 * See `docs/audio/THEMES.md` §Resemblance for the specific shapes each theme is
 * required to avoid.
 *
 * This file is DATA, not a track. Arrangers import from here; nobody edits an
 * existing track or `motifs.ts` to get at it. Three kinds of export:
 *
 *   *_CELL / named Note[]   semitone offsets from a tonic — stamp with
 *                           `cell(FAREWELL_RISE, beat, 'B3')` or `motif()`.
 *   *_RH, *_SOPRANO, …      tracker strings at concert pitch, ready for
 *                           `tracker(s, { checkBars: 4 })`. Transpose per cue.
 *   *_CHORDS                chord symbols for `chordLine` / `arpLine` /
 *                           `chordRoots`. Every quality here already exists in
 *                           `QUALITIES` (harmony.ts) — no new quality needed.
 *
 * THE ONE PROGRESSION THAT BINDS THE SCORE: bVI - bVII - i, approached by
 * stepwise ascent, landing the melody's highest note on the i. It is HYMN bars
 * 10-11 (C - D - Em), FAREWELL bars 10-11 (G - A - Bm) and FATHER bars 3-4
 * (Bb5 - C5 - D5) — the same frame in the same metric position, which is why
 * the son's lament and the father's riff can be superimposed in the Final Aeon
 * fight without a single note being bent to make them fit.
 */

import type { Note } from '../score.ts';
import { augment, PYREFLY_RISE, PYREFLY_RISE_MAJOR } from './motifs.ts';

// ---------------------------------------------------------------------------
// Shared cadence
// ---------------------------------------------------------------------------

/**
 * THE AMEN — scale degree 2 held over the iv chord, falling to the tonic.
 * 4 beats. The score's one shared cadence: HYMN bars 8 and 16 (F#4 over Am6 to
 * E4), FAREWELL bar 16 (C#4 over Em6 to B3). Plagal, never authentic. Voice it
 * so the 2 is the top note of the chord and the loudest note of the pair.
 */
export const AMEN: Note[] = [
  [0, 2, 2],
  [2, 2, 0],
];

/**
 * The Phrygian amen — the same cadence with Seymour's b2 in place of the 2.
 * Used ONLY where a villain has got inside the prayer (boss-yunalesca,
 * scene-bevelle-underground). Two notes is the whole transformation.
 */
export const AMEN_PHRYGIAN: Note[] = [
  [0, 2, 1],
  [2, 2, 0],
];

// ---------------------------------------------------------------------------
// 1. HYMN — "Still Water". E Aeolian, 4/4, 52 bpm, 16 bars, a cappella SATB.
// ---------------------------------------------------------------------------

/**
 * The head: 1 - b7 - 1 - b3. A falling lower neighbour that then lifts.
 * 4 beats. HYMN bars 1, 5 (varied) and 13. Four notes is enough to name the
 * world — chapter-select quotes only this, on solo flute, then stops.
 */
export const HYMN_HEAD: Note[] = [
  [0, 1, 0],
  [1, 1, -2],
  [2, 1, 0],
  [3, 1, 3],
];

/** The low rising fourth, 1 up to 4 (bar 3). Answered an octave and a fifth up at the climax. */
export const HYMN_FOURTH: Note[] = [
  [0, 2, 0],
  [2, 2, 5],
];

/**
 * The answer: the same rising fourth, up where it costs something. 5 - 4 - 5 |
 * 8 - b7, i.e. B4 - A4 - B4 | E5 - D5 in E minor. 8 beats, HYMN bars 10-11.
 * The E5 is the highest note of the hymn and it arrives over the bVI, from the
 * flat side, never from the tonic.
 */
export const HYMN_ANSWER: Note[] = [
  [0, 2, 7],
  [2, 1, 5],
  [3, 1, 7],
  [4, 3, 12],
  [7, 1, 10],
];

/** The sigh, 2 falling to 1 — HYMN bars 8 and 16. Identical to {@link AMEN}. */
export const HYMN_SIGH: Note[] = AMEN;

/** Soprano, concert pitch, E minor. 16 bars of 4/4. `tracker(HYMN_SOPRANO, { checkBars: 4 })`. */
export const HYMN_SOPRANO = `
  E4:1 D4:1 E4:1 G4:1   | G4:2 E4:2          |
  E4:2 A4:2             | G4:3 -:1           |
  E4:1 D4:1 E4:1 B4:1   | A4:2 G4:2          |
  F#4:1 G4:1 A4:2       | F#4:2 E4:2         |
  G4:2 A4:2             | B4:2 A4:1 B4:1     |
  E5:3 D5:1             | B4:2 A4:2          |
  E4:1 D4:1 E4:1 G4:1   | A4:2 G4:2          |
  B4:2 G4:2             | F#4:2 E4:2         |
`;

/**
 * Alto. Sits a third below the soprano for fifteen bars and opens to a FOURTH
 * below at bar 11, so the sound physically widens exactly where the tune peaks.
 */
export const HYMN_ALTO = `
  B3:4                  | D4:2 B3:2          |
  C4:4                  | B3:3 -:1           |
  B3:4                  | C4:2 E4:2          |
  D4:4                  | C4:2 B3:2          |
  E4:4                  | D4:2 F#4:2         |
  B4:4                  | G4:2 E4:2          |
  B3:4                  | E4:2 D4:2          |
  E4:2 D4:2             | C4:2 B3:2          |
`;

/** Tenor — the voice that holds the drone feeling. Fifths and common tones. */
export const HYMN_TENOR = `
  E3:4                  | B3:2 G3:2          |
  A3:4                  | E3:3 -:1           |
  G3:4                  | E3:2 G3:2          |
  A3:4                  | A3:2 G3:2          |
  C4:4                  | G3:2 A3:2          |
  E4:4                  | D4:2 C4:2          |
  E3:4                  | C4:2 B3:2          |
  G3:2 B3:2             | A3:2 G3:2          |
`;

/** Bass — roots only, E2 to D3, one or two notes a bar. */
export const HYMN_BASS = `
  E2:4                  | G2:4               |
  A2:4                  | E2:3 -:1           |
  E2:4                  | A2:2 C3:2          |
  D3:4                  | A2:2 E2:2          |
  C3:4                  | G2:2 D3:2          |
  C3:4                  | G2:2 A2:2          |
  E2:4                  | A2:2 G2:2          |
  C3:2 G2:2             | A2:2 E2:2          |
`;

/**
 * Five chords in sixteen bars, and not one of them is a dominant. That absence
 * is what makes it a rite rather than a song. Half-bar motion is in
 * {@link HYMN_CHORDS_HALF}; this array is one symbol per bar for `chordRoots`.
 */
export const HYMN_CHORDS = [
  'Em', 'G', 'Am', 'Em',
  'Em', 'Am', 'D', 'Am',
  'C', 'G', 'Cmaj7', 'G',
  'Em', 'Am', 'C', 'Am',
];

/** The same sixteen bars at half-bar resolution — `chordLine(HYMN_CHORDS_HALF, { barBeats: 2 })`. */
export const HYMN_CHORDS_HALF = [
  'Em', 'Em', 'G', 'G', 'Am', 'Am', 'Em', 'Em',
  'Em', 'Em', 'Am', 'C', 'D', 'D', 'Am', 'Em',
  'C', 'C', 'G', 'D', 'Cmaj7', 'Cmaj7', 'G', 'Am',
  'Em', 'Em', 'Am', 'G', 'C', 'G', 'Am', 'Em',
];

/**
 * Invented, non-lexical syllables — open vowels only, one per struck note, ties
 * carry the vowel. The renderer only needs the vowel for the formant filter.
 * RULE: no four-syllable group may recur more than twice in the cue, and none
 * may scan as a name. Nothing here is a word in any language.
 */
export const HYMN_SYLLABLES = [
  'nae-o-ve-a', 'ru-mae', 'o-lae', 'aaah',
  'nae-o-ve-sa', 'lu-ren', 'ae-o-mi', 'so-lae',
  'ren-ae', 'mi-o-lu', 'AAAH-o', 'lu-ae',
  'nae-o-ve-a', 'ru-men', 'o-sae', 'so-lae',
];

// ---------------------------------------------------------------------------
// 2. FAREWELL — "The Dream That Has To End". B Aeolian, 4/4, 58 bpm, 16 bars.
//    The emotional heart of the score, and the one theme that visits every
//    register: hymn-adjacent, waltz, nocturne, lament, benediction.
// ---------------------------------------------------------------------------

/**
 * The incipit: 5(below) - 1 - 2 - b3. F#3 B3 C#4 D4 in B minor. 4 beats.
 *
 * This is deliberately the SAME four scale degrees as the shipped
 * {@link PYREFLY_RISE} from the title cue — FAREWELL is that cell's full form,
 * which retroactively makes "Tide, Remembered" the first statement of the
 * score's central theme, at no cost. Keep both names: tracks that belong to the
 * title's world import PYREFLY_RISE, tracks that belong to the farewell import
 * this.
 */
export const FAREWELL_RISE: Note[] = [
  [0, 1, -5],
  [1, 1, 0],
  [2, 1, 2],
  [3, 1, 3],
];

/**
 * THE SIGNATURE RHYTHM: hold three beats, step down one. 4 beats.
 * Stated at four different pitch levels — FAREWELL bars 2, 6, 10 and 14 — and
 * that repetition at four heights is what makes the tune hummable after one
 * hearing. Written here at level 1 (4 falling to b3).
 *
 * Every occurrence is an appoggiatura. The HELD note is the leaning one and it
 * must be LOUDER than the note it falls to (+0.08 velocity). Machines always
 * get this backwards, and getting it backwards is the loudest single tell of a
 * synthetic performance.
 */
export const FAREWELL_FALL: Note[] = [
  [0, 3, 5],
  [3, 1, 3],
];

/**
 * The climb and the climax, bars 9-11. 12 beats.
 * Stepwise from b3 to the octave, then the only quickening in the whole theme
 * (two eighths), then the b6 sounded over the tonic chord while bVI-bVII-i
 * resolves underneath: the harmony closes and the melody refuses to, in the
 * same instant. That refusal is the theme.
 */
export const FAREWELL_CLIMB: Note[] = [
  [0, 1, 3],
  [1, 1, 5],
  [2, 2, 7],
  [4, 3, 8],
  [7, 1, 7],
  [8, 0.5, 12],
  [8.5, 0.5, 10],
  [9, 1, 12],
  [10, 2, 8],
];

/** The last ache, bar 16: the 2 over the iv6, falling home. Identical to {@link AMEN}. */
export const FAREWELL_AMEN: Note[] = AMEN;

/** Right hand / melody, concert pitch, B minor, 4/4. `tracker(FAREWELL_RH, { checkBars: 4, gate: 0.98 })`. */
export const FAREWELL_RH = `
  F#3:1 B3:1 C#4:1 D4:1 | E4:3 D4:1          |
  C#4:2 D4:1 B3:1       | B3:3 -:1           |
  F#3:1 B3:1 D4:1 E4:1  | F#4:3 E4:1         |
  D4:2 E4:1 C#4:1       | B3:3 -:1           |
  D4:1 E4:1 F#4:2       | G4:3 F#4:1         |
  B4:0.5 A4:0.5 B4:1 G4:2 | F#4:2 E4:1 D4:1  |
  -:1 F#3:1 B3:1 C#4:1  | D4:3 C#4:1         |
  B3:2 D4:2             | C#4:2 B3:2         |
`;

/**
 * The waltz — the Clair Obscur register, for menus, chapter select and pause.
 * 3/4, 84 bpm, same pitches re-barred; the theme survives the meter change
 * because its cells are three- and four-note groups.
 * `tracker(FAREWELL_WALTZ, { checkBars: 3 })`.
 */
export const FAREWELL_WALTZ = `
  F#3:0.5 B3:0.5 C#4:1 D4:1 | E4:2 D4:1      |
  C#4:1 D4:1 B3:1       | B3:2 -:1           |
  F#3:0.5 B3:0.5 D4:1 E4:1 | F#4:2 E4:1      |
  D4:1 E4:1 C#4:1       | B3:2 -:1           |
  D4:1 E4:1 F#4:1       | G4:2 F#4:1         |
  B4:0.5 A4:0.5 B4:1 G4:1 | F#4:1 E4:1 D4:1  |
  -:1 F#3:0.5 B3:0.5 C#4:1 | D4:2 C#4:1      |
  B3:1 D4:2             | C#4:1 B3:2         |
`;

/** One chord per bar. Bass motion is by step and third; there is no circle of fifths. */
export const FAREWELL_CHORDS = [
  'Bm', 'Em', 'A', 'Gmaj7',
  'Bm', 'D', 'Em', 'Bm',
  'D', 'G', 'Bm', 'Gmaj7',
  'Bm', 'Em', 'Gmaj7', 'Em6',
];

/** Half-bar resolution — `chordLine(FAREWELL_CHORDS_HALF, { barBeats: 2 })`. Bars 10 and 12 matter. */
export const FAREWELL_CHORDS_HALF = [
  'Bm', 'Bm', 'Em', 'Em', 'A', 'A', 'Gmaj7', 'Gmaj7',
  'Bm', 'Bm', 'D', 'D', 'Em', 'F#m', 'Bm', 'Bm',
  'D', 'D', 'G', 'A', 'Bm', 'Bm', 'Gmaj7', 'F#7sus4',
  'Bm', 'Bm', 'Em', 'A', 'Gmaj7', 'Em7', 'Em6', 'Bm',
];

/**
 * THE RE-HARMONISATION RESERVE. Three chord changes, not one melody note
 * altered, and the lament becomes a benediction. Reserved for `ending-ffx`'s
 * second statement and nowhere else — spend it once or it is worth nothing.
 *   bar  7  F#m       -> F#7   (the withheld leading tone finally asserts)
 *   bar 12  F#7sus4   -> F#7   (the suspension resolves)
 *   bar 16  Em6 | Bm  -> Em6 | B (major — the score's only Picardy third
 *                                 besides the last bar of ending-ffx)
 */
export const FAREWELL_CHORDS_RELEASED = [
  'Bm', 'Bm', 'Em', 'Em', 'A', 'A', 'Gmaj7', 'Gmaj7',
  'Bm', 'Bm', 'D', 'D', 'Em', 'F#7', 'Bm', 'Bm',
  'D', 'D', 'G', 'A', 'Bm', 'Bm', 'Gmaj7', 'F#7',
  'Bm', 'Bm', 'Em', 'A', 'Gmaj7', 'Em7', 'Em6', 'B',
];

/**
 * Per-bar velocity for FAREWELL's melody. DO NOT render the theme flat: half of
 * what this theme is lives in this table. Bar 9 deliberately steps BACK before
 * the climb so bar 11 has somewhere to come from; bar 11's first note is the
 * loudest note in the score outside the boss fights; the reprise fades.
 * Index 0 = bar 1. Apply on top with {@link FAREWELL_FALL}'s appoggiatura rule.
 */
export const FAREWELL_DYNAMICS = [
  0.62, 0.66, 0.70, 0.72,
  0.70, 0.72, 0.70, 0.66,
  0.66, 0.78, 0.94, 0.70,
  0.60, 0.58, 0.52, 0.44,
];

// ---------------------------------------------------------------------------
// 3. SEYMOUR — "Noble Rot". C# minor, chromatic, 2 bars / 8 beats / 6 notes.
//    Organ and low strings. He is never loud; the band shouts, he does not.
// ---------------------------------------------------------------------------

/**
 * A bow, then a decline. 1, up a minor SIXTH to b6, then the chromatic fall
 * 5 - #4 - 4 - b3: the courtesy and the insincerity in one line, carried by a
 * double-dotted French-overture snap. 8 beats, 6 notes, register C#3-A3.
 * The #4 is dotted — it carries more weight than a passing note, because it is
 * the only pitch in the motif that belongs to no key.
 */
export const SEYMOUR: Note[] = [
  [0, 1.75, 0],
  [1.75, 0.25, 8],
  [2, 2, 7],
  [4, 1.5, 6],
  [5.5, 1, 5],
  [6.5, 1.5, 3],
];

/**
 * The strict mirror — every interval inverted. This is the counter-subject, in
 * genuine contrary motion: as the motif bows up and declines, this descends and
 * climbs back, and the two converge on a minor ninth exactly where the #4 falls.
 * Manuals answer the pedal with it.
 */
export const SEYMOUR_MIRROR: Note[] = [
  [0, 1.75, 0],
  [1.75, 0.25, -8],
  [2, 2, -7],
  [4, 1.5, -6],
  [5.5, 1, -5],
  [6.5, 1.5, -3],
];

/**
 * FINAL FORM ONLY. The chromatic decline keeps going and turns whole-tone, so
 * his scale stops containing a tonic at the same moment the harmony loses its
 * floor (drop the pedal here). 16 beats. Use once, at the last section of
 * `boss-seymour`, and never again.
 */
export const SEYMOUR_UNMOORED: Note[] = [
  [0, 1.75, 0],
  [1.75, 0.25, 8],
  [2, 2, 7],
  [4, 1.5, 6],
  [5.5, 1, 5],
  [6.5, 1.5, 3],
  [8, 1, 3],
  [9, 1, 5],
  [10, 1, 7],
  [11, 1, 9],
  [12, 1, 11],
  [13, 3, 13],
];

/** Melody line at concert pitch, C# minor. `tracker(SEYMOUR_LINE, { checkBars: 4, gate: 0.96 })`. */
export const SEYMOUR_LINE = `
  C#3:1.75 A3:0.25 G#3:2 | G3:1.5 F#3:1 E3:1.5 |
`;

/** The counter-subject at concert pitch — contrary motion against SEYMOUR_LINE. */
export const SEYMOUR_COUNTER = `
  C#3:1.75 F2:0.25 F#2:2 | G2:1.5 G#2:1 A#2:1.5 |
`;

/**
 * Half-bar changes: i - bVI - #iv dim7 - V. The #iv dim7 belongs to no key and
 * resolves wherever it likes; the G#7 is a dominant that is never allowed to
 * arrive, because the cell loops back to its own C#m and so is always
 * technically resolved and never audibly resolved. The motif's last note (E)
 * hangs over that G#7 as a b13 and is not written into the chord.
 *
 * This is the ONLY functional Baroque progression in the score, and it belongs
 * to the only character who believes the world has rules.
 * `chordLine(SEYMOUR_CHORDS, { barBeats: 2 })`.
 */
export const SEYMOUR_CHORDS = ['C#m', 'Amaj7', 'Gdim7', 'G#7'];

/**
 * The eight-bar period: the two-bar cell sequenced up in minor thirds and then
 * thrown back home, having proved nothing. Stamp with
 * `motif(SEYMOUR, [0, 8, 16, 24], SEYMOUR_SEQUENCE)`.
 */
export const SEYMOUR_SEQUENCE = ['C#3', 'E3', 'G3', 'C#3'];

/**
 * THE POISONING. Once in the whole score (scene-bevelle-underground), Seymour's
 * chromatic passing notes are pushed between the prayer's steps until it no
 * longer scans: HYMN_HEAD's 1 - b7 - 1 - b3 becomes 1 - 7 - b7 - 1 - b2 - 2 - b3.
 * Semitone offsets from the hymn's tonic. 7 beats. Low clarinet or pedal organ,
 * quiet, unaccompanied, and then never mentioned again.
 */
export const HYMN_POISONED: Note[] = [
  [0, 1, 0],
  [1, 0.5, -1],
  [1.5, 0.5, -2],
  [2, 1, 0],
  [3, 0.5, 1],
  [3.5, 0.5, 2],
  [4, 3, 3],
];

// ---------------------------------------------------------------------------
// 4. FATHER — the riff. D minor, 4/4, 144 bpm, 4 bars, register D2-D3.
//    Rough, proud, and standing on FAREWELL's own ground without knowing it.
// ---------------------------------------------------------------------------

/**
 * Four bars, and the pitch skeleton of bar 1 is HYMN_HEAD — 1, b7, 1, b3 —
 * with every note shoved onto the OFF beat. Push them back onto the beat
 * (the `scene-gagazet` version) and the swagger turns back into the prayer.
 * That is the joke the whole score is built on and nobody has to notice it.
 *
 * Bars 1 and 3 share an identical rhythm at different pitches: that repetition
 * is what makes a swagger a hook rather than a noodle. Bar 4 is the only bar
 * with no rest in it and lands the octave on its downbeat.
 * The blue b5 is rationed to exactly two grace notes per statement — one
 * climbing (bar 2), one falling (bar 4). Never more.
 */
export const FATHER: Note[] = [
  // bar 1 — the skeleton, entirely off the beat
  [0.5, 1, 0],
  [1.5, 1, -2],
  [2.5, 1, 0],
  [3.5, 0.5, 3],
  // bar 2 — the answer, with air in it and the climbing b5
  [4.5, 0.25, 6],
  [4.75, 0.75, 7],
  [5.75, 0.75, 5],
  [6.5, 0.5, 3],
  [7.5, 0.5, 0],
  // bar 3 — bar 1's rhythm, a third higher
  [8.5, 1, 3],
  [9.5, 1, 2],
  [10.5, 1, 3],
  [11.5, 0.5, 7],
  // bar 4 — no rests; the octave on the downbeat, then the falling b5
  [12, 1.5, 12],
  [13.5, 0.5, 10],
  [14, 0.75, 7],
  [14.75, 0.25, 6],
  [15, 0.5, 5],
  [15.5, 0.5, 3],
];

/** Concert pitch, D minor. `tracker(FATHER_RIFF, { checkBars: 4 })`. */
export const FATHER_RIFF = `
  -:0.5 D2:1 C2:1 D2:1 F2:0.5                          |
  -:0.5 Ab2:0.25 A2:0.75 -:0.25 G2:0.75 F2:0.5 -:0.5 D2:0.5 |
  -:0.5 F2:1 E2:1 F2:1 A2:0.5                          |
  D3:1.5 C3:0.5 A2:0.75 Ab2:0.25 G2:0.5 F2:0.5         |
`;

/**
 * The riff straightened: every note pushed back onto the beat, which is exactly
 * {@link HYMN_HEAD}. `scene-gagazet` plays this on one unaccompanied horn and
 * lets it sit. 4 beats.
 */
export const FATHER_STRAIGHTENED: Note[] = HYMN_HEAD;

/**
 * Power chords. Bars 3-4 are bVI - bVII - i in the same key and the same metric
 * position as FAREWELL bars 10-11, which is why the Final Aeon superimposition
 * needs no fudging. `chordLine(FATHER_CHORDS, { barBeats: 2 })` — eight half
 * bars, two per bar.
 */
export const FATHER_CHORDS = ['D5', 'D5', 'D5', 'D5', 'Bb5', 'C5', 'D5', 'D5'];

/**
 * Eight bars from four, with no new material: stamp {@link FATHER} over these
 * roots with `motif()` and the same notes recolour on every chord — the blue b5
 * becomes a #11 over the bVI and a third over the bVII. That is the whole
 * development section.
 */
export const FATHER_STAMP = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C'];

// ---------------------------------------------------------------------------
// 5. SONGSTRESS — FFX-2's hook. Db major, 4/4, 132 bpm, 8 bars + 8-bar bridge.
//    One interval carries the whole family, and flattening two notes of it
//    turns the pop song into the tragedy.
// ---------------------------------------------------------------------------

/**
 * THE IDENTITY: the leap 3 up to 6, a perfect fourth, then home to the 5.
 * F4 - Bb4 - Ab4 in Db major. 4 beats, SONGSTRESS bar 3.
 * Bb4 is the hook's ceiling and nothing in the hook goes above it.
 */
export const SONGSTRESS_HOOK: Note[] = [
  [0, 1, 4],
  [1, 2, 9],
  [3, 1, 7],
];

/**
 * SHUYIN and VEGNAGUN. The same perfect fourth, both ends flattened: b3 up to
 * b6. Two accidentals, the opposite world. The tonic does not move — Shuyin is
 * the PARALLEL minor of the Songstress's key, not a move to the mediant,
 * because the darkening has to be unmistakable.
 */
export const SONGSTRESS_DARK: Note[] = [
  [0, 1, 3],
  [1, 2, 8],
  [3, 1, 7],
];

/**
 * The hook's opening rise: 5(below) - 1 - 2 - 3. Which is the shipped
 * {@link PYREFLY_RISE_MAJOR}, and therefore FAREWELL's incipit with a major
 * third. FFX's farewell and FFX-2's pop hook open on the same four scale
 * degrees, one minor and one major, at wildly different tempi and rhythms.
 * Nobody will consciously notice. Everybody will feel that the two games belong
 * to one score.
 */
export const SONGSTRESS_RISE: Note[] = [
  [0, 0.5, -5],
  [0.5, 0.5, 0],
  [1, 0.5, 2],
  [1.5, 1.5, 4],
];

/** Hook melody, concert pitch, Db major. `tracker(SONGSTRESS_LEAD, { checkBars: 4 })`. */
export const SONGSTRESS_LEAD = `
  Ab3:0.5 Db4:0.5 Eb4:0.5 F4:1.5 -:1 | Eb4:0.5 F4:0.5 Ab4:1 F4:1.5 -:0.5 |
  F4:1 Bb4:2 Ab4:1                   | F4:1.5 Eb4:0.5 Db4:2              |
  Ab3:0.5 Db4:0.5 F4:0.5 Ab4:1.5 -:1 | Bb4:1 Ab4:0.5 F4:0.5 Ab4:2        |
  Bb4:1.5 Gb4:0.5 Eb4:2              | Eb4:1 Db4:3                       |
`;

/**
 * The jazz-fusion bridge. Its peak, Gb5, sits a sixth ABOVE the hook's ceiling,
 * so the bridge genuinely goes somewhere the hook could not.
 * `tracker(SONGSTRESS_BRIDGE, { checkBars: 4 })`.
 */
export const SONGSTRESS_BRIDGE = `
  Gb4:0.5 Ab4:0.5 Bb4:1 Db5:2 | Bb4:1 Ab4:1 Gb4:2   |
  F4:1 Ab4:1 Db5:2            | Eb5:1 Db5:1 Bb4:2   |
  Ab4:0.5 Bb4:0.5 Db5:1 Eb5:2 | F5:1 Eb5:1 Db5:2    |
  Gb5:3 F5:1                  | Eb5:1 Db5:1 Bb4:2   |
`;

/**
 * Hook harmony. Bar 7 is the bright visitor: bVII MAJOR (Cb), dropped in for
 * exactly one bar at the climax and walked back as if nothing had happened.
 * All three melody notes of that bar land on it — Bb = its major 7th, Gb = its
 * 5th, Eb = its 3rd — so the brightest bar in the score costs nothing.
 */
export const SONGSTRESS_CHORDS = [
  'Dbmaj7', 'Bbm7', 'Gbmaj7', 'Ab7sus4',
  'Dbmaj7', 'Bbm7', 'Cb', 'Db6',
];

/** Bridge harmony — functional ii-V motion, which only FFX-2 is allowed. */
export const SONGSTRESS_BRIDGE_CHORDS = [
  'Ebm9', 'Ab9', 'Dbmaj7', 'Gbmaj7',
  'Fm7', 'Bbm7', 'Ebm9', 'Ab7sus4',
];

/**
 * SHUYIN. Same tonic, parallel minor, half speed. The bar that was joy —
 * SONGSTRESS bar 7's borrowed bVII major — is merely diatonic here, just the
 * mode doing its job, and that is the cruellest thing the transformation does.
 * Concert pitch C# minor, matching the shipped `boss-shuyin` cue.
 */
export const SHUYIN_CHORDS = [
  'C#m', 'A', 'F#m', 'B',
  'C#m', 'A', 'B', 'C#m',
];

// ---------------------------------------------------------------------------
// 6. BATTLE — the regular FFX fight, and the results music.
//    E minor, 4/4, 150 bpm (the shipped `battle-ffx` key and tempo).
// ---------------------------------------------------------------------------

/**
 * The battle hook: eight bars, a four-bar question that climbs to the octave
 * over bVI-bVII-i, and a four-bar answer that is the ONE place in the FFX
 * material where a real dominant resolves (B7 to Em, bar 8). Save it; it only
 * works because nothing else in the score does it.
 * `tracker(BATTLE_HOOK, { checkBars: 4 })`.
 */
export const BATTLE_HOOK = `
  E4:0.5 G4:0.5 B4:1 A4:0.5 G4:0.5 E4:1 | D4:0.5 E4:0.5 G4:2 -:1        |
  C5:0.5 B4:0.5 A4:1 G4:0.5 A4:0.5 B4:1 | E5:2 D5:1 B4:1                |
  E4:0.5 G4:0.5 B4:1 A4:0.5 G4:0.5 E4:1 | D4:0.5 E4:0.5 G4:1.5 F#4:0.5 E4:1 |
  A4:0.5 C5:0.5 B4:1 A4:1 F#4:1         | D#5:1 E5:3                    |
`;

/** Half-bar changes under the hook — `chordLine(BATTLE_CHORDS, { barBeats: 2 })`. */
export const BATTLE_CHORDS = [
  'Em', 'Em', 'Em', 'Em', 'C', 'D', 'Em', 'Em',
  'Em', 'Em', 'Em', 'Em', 'Am', 'B7', 'B7', 'Em',
];

/**
 * THE VICTORY FANFARE — original, and built to be unlike the famous one on
 * purpose. That fanfare opens with three fast repeated notes on one pitch and
 * rises through an arpeggio; this one opens with its LONGEST note, falls, and
 * arches by step. No repeated-note upbeat, no rising arpeggio, and it closes
 * PLAGAL — F to C, with the melody sighing 4 to 3 — so the release reads as
 * relief rather than triumph. That falling 4-3 over the IV is {@link AMEN} in
 * the major: the victory belongs to the same story as the prayer.
 * C major, 120 bpm, 4 bars. `tracker(VICTORY_FANFARE, { checkBars: 4 })`.
 */
export const VICTORY_FANFARE = `
  G4:3 E4:1 | F4:2 G4:2 | A4:1 G4:1 E4:2 | F4:2 E4:2 |
`;

/** Fanfare harmony — one plagal cadence and no dominant anywhere. */
export const VICTORY_FANFARE_CHORDS = ['C', 'C', 'F', 'F', 'Am', 'Am', 'F', 'C'];

/**
 * The relaxed results loop that follows the fanfare. Eight bars, warm, low
 * stakes, pluck and piano. Bars 7-8 are the tag: FAREWELL's incipit in the
 * major on a solo flute. Nobody will consciously notice; everybody will feel
 * that the victory belongs to this story.
 * C major, 120 bpm. `tracker(VICTORY_LOOP, { checkBars: 4 })`.
 */
export const VICTORY_LOOP = `
  E4:2 G4:2             | B4:1 G4:1 E4:2     |
  A4:2 F4:2             | G4:1 E4:1 C4:2     |
  E4:2 A4:2             | F4:1 A4:1 D4:2     |
  G3:1 C4:1 D4:1 E4:1   | E4:4               |
`;

/** Results-loop harmony. No dominant: a results screen should feel like rest, not arrival. */
export const VICTORY_LOOP_CHORDS = ['C', 'Em', 'F', 'C', 'Am', 'Dm', 'F', 'C'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Written rubato, until the renderer grows a tempo map (see
 * docs/audio/THEMES.md §Renderer requests, item 1). Lengthens the last note of
 * a phrase by `pull` and steals the time back from the note that follows, so
 * the bar line still lands where the accompaniment expects it.
 *
 * `beats` are phrase-end beats within `notes`; 0.08 is a breath, 0.18 is a
 * ritardando you can hear. Never exceed 0.25 — past that it reads as a glitch.
 */
export function agogic(notes: Note[], beats: number[], pull = 0.1): Note[] {
  const marks = new Set(beats);
  return notes.map((n) => {
    const end = n[0] + n[1];
    if (marks.has(end)) return [n[0], n[1] * (1 + pull), n[2], n[3]] as Note;
    if (marks.has(n[0])) return [n[0] + (n[1] * pull) / 2, n[1] * (1 - pull), n[2], n[3]] as Note;
    return n;
  });
}

/**
 * The appoggiatura rule as code: the leaning note is LOUDER than its
 * resolution. Give it every pair of (leaning beat, resolving beat) in a line
 * and it raises the first by `lift` and lowers the second to match.
 */
export function lean(notes: Note[], pairs: Array<[number, number]>, lift = 0.08): Note[] {
  const up = new Set(pairs.map((p) => p[0]));
  const down = new Set(pairs.map((p) => p[1]));
  return notes.map((n) => {
    const v = n[3] ?? 0.8;
    if (up.has(n[0])) return [n[0], n[1], n[2], Math.min(1, v + lift)] as Note;
    if (down.has(n[0])) return [n[0], n[1], n[2], Math.max(0.05, v - lift)] as Note;
    return n;
  });
}

/**
 * Apply {@link FAREWELL_DYNAMICS} (or any per-bar table) to a parsed line.
 * `barBeats` is 4 for the 4/4 versions and 3 for the waltz.
 */
export function shapeByBar(notes: Note[], table: number[], barBeats = 4): Note[] {
  return notes.map((n) => {
    const bar = Math.floor(n[0] / barBeats);
    const target = table[Math.min(bar, table.length - 1)];
    return [n[0], n[1], n[2], target ?? n[3]] as Note;
  });
}

/** Re-exported so an arranger needs one import, not three. */
export { augment, PYREFLY_RISE, PYREFLY_RISE_MAJOR };
export type { Note };
