/**
 * "The Weight of a Thousand Years" — Shuyin.
 *
 * ORIGINAL COMPOSITION. Piano and strings over restrained percussion, C# minor,
 * 154 bpm, with the B section written out at half speed (77) so the memory
 * underneath the grief moves at half the tempo of the grief itself.
 *
 * THEMES (docs/audio/THEMES.md §5, cue map row 19). This is the Songstress's
 * hook in the PARALLEL minor — the tonic does not move. `minorise()` maps the
 * three pitch classes that change (F->E, Bb->A, C->B) across
 * `SONGSTRESS_LEAD`, so every note Shuyin sings is provably her line, one
 * accidental darker. Two consequences the cue is built on:
 *
 *   - The identity leap, bar 3, is now E - A - G#: b3 up to b6, home to the 5,
 *     which is `SONGSTRESS_DARK` exactly. The pop hook's fingerprint and the
 *     tragedy's are the same interval.
 *   - Bar 7 was the brightest bar in the score: one borrowed bVII major
 *     dropped into a major key. In the minor it is just the mode doing its
 *     job. `SHUYIN_CHORDS` keeps the same B major there and it costs nothing
 *     now. The joy did not go dark; it went ordinary, which is worse.
 *
 * Rubato is written into the note values (`agogic`), because the renderer has
 * one tempo per track: a breath of 8% at each phrase end, and 18% of
 * ritardando across the last two notes of the coda.
 *
 * Form (4/4, 154 bpm, 64 bars, 100 s):
 *   bars  1- 8  intro  beats   0- 32  solo piano, the first four bars, alone
 *   bars  9-24  A      beats  32- 96  the theme twice, strings from bar 13  <- loop
 *   bars 25-40  B      beats  96-160  half-time: strings and harp, no kit
 *   bars 41-56  A'     beats 160-224  strings take the tune, piano answers
 *   bars 57-64  coda   beats 224-256  back to one piano, and a held sixth
 * Loop 32 -> 256.
 */

import {
  chordRoots,
  concatNotes,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { agogic, lean, shapeByBar, SHUYIN_CHORDS, SONGSTRESS_LEAD } from './themes.ts';
import {
  arpStackLine,
  atVolume,
  doubled,
  groove,
  humanise,
  legato,
  minorise,
  nudge,
  padLine,
  ramp,
} from './ffx2-common.ts';

const BAR = 4;
const INTRO = 0;
const A = 32;
const B = 96;
const A2 = 160;
const CODA = 224;
const LENGTH = 256;

/**
 * `SHUYIN_CHORDS` with one substitution: bar 4's plain B becomes `B7sus4`.
 * The theme holds an E through that bar — a 4-3 suspension that resolves down
 * to D# on the last half beat — and sounding the chord's own D# underneath it
 * turns a suspension into a semitone cluster. The Songstress's own bar 4 is an
 * `Ab7sus4`, so this is the hook's own harmony, not a new idea.
 */
const CHORDS = SHUYIN_CHORDS.map((c, i) => (i === 3 ? 'B7sus4' : c));

/** One bar per entry; the eight chords cover a section in two passes. */
const A_CHORDS = [...CHORDS, ...CHORDS];
const INTRO_CHORDS = CHORDS.slice(0, 4).concat(CHORDS.slice(0, 4));
/** The half-time B: the same eight chords, each held two bars. */
const B_CHORDS = CHORDS;
const CODA_CHORDS = ['C#m', 'A', 'F#m', 'B7sus4', 'C#m', 'A', 'B7sus4', 'C#m'];

/**
 * Per-bar dynamics for the theme. Bar 7 — the bar that used to be joy — is the
 * loudest, and bar 8 falls further than it started: the phrase gives up.
 */
const THEME_DYNAMICS = [0.52, 0.56, 0.64, 0.58, 0.54, 0.62, 0.72, 0.48];

/**
 * One statement of Shuyin's theme: her line, minorised, breathing at the
 * phrase ends, with both appoggiaturas leaning louder than the notes they
 * fall to (bar 4's E over B, bar 8's D# over C#).
 */
function theme(start: number, scale: number, level: number): Note[] {
  // No `gate` here: the written note ends have to stay exact so `agogic` can
  // find the phrase endings. `legato` puts the overlap back afterwards.
  const raw = tracker(SONGSTRESS_LEAD, { start, checkBars: BAR * scale, scale });
  const dark = minorise(raw);
  const shaped = shapeByBar(
    dark.map((n) => [n[0] - start, n[1], n[2], n[3]] as Note),
    THEME_DYNAMICS,
    BAR * scale,
  ).map((n) => [n[0] + start, n[1], n[2], n[3]] as Note);
  const leaned = lean(shaped, [
    [start + 12 * scale, start + 13.5 * scale],
    [start + 28 * scale, start + 29 * scale],
  ]);
  // The phrase ends: bar 2's last note stops at 7.5, bar 4's at 16, bar 8's at
  // 32. Each is lengthened 8% and the time stolen from the attack that follows.
  const breathed = agogic(leaned, [start + 7.5 * scale, start + 16 * scale, start + 32 * scale], 0.08);
  return humanise(atVolume(legato(breathed, 0.07 * scale), level), 0.03, 6);
}

// --- piano -----------------------------------------------------------------

/**
 * Left hand: rolling broken chords, pedalled (long gate, a reverb send held
 * through the bar), never a repeated-note ostinato. It stays above C2 except
 * where the octave doubles a downbeat.
 */
function leftHand(chords: string[], start: number, barBeats: number, velocity: number): Note[] {
  // Centre 48 and a pattern that never reaches past the stack's own octave:
  // the left hand stays below whoever has the tune, which is what stops the
  // accompaniment sounding a semitone under the melody's suspensions.
  const rolled = arpStackLine(chords, {
    start,
    barBeats,
    pattern: [0, 1, 2, 3, 2, 1],
    step: barBeats / 8,
    dur: barBeats / 6,
    center: 52,
    keepRoot: true,
    maxTones: 3,
    velocity,
    accent: 1.14,
    seed: Math.round(start),
  });
  const roots = chordRoots(chords, 2).map(
    (midi, bar): Note => [start + bar * barBeats, barBeats * 0.9, midi, velocity * 1.05],
  );
  return humanise(concatNotes(rolled, roots), 0.035, 12);
}

const pianoNotes = concatNotes(
  // Intro: the first four bars of the theme, alone, twice — the second time
  // with the left hand under it.
  theme(INTRO, 1, 0.9).filter((n) => n[0] < INTRO + 16),
  theme(INTRO + 16, 1, 0.94).filter((n) => n[0] < INTRO + 32),
  leftHand(INTRO_CHORDS.slice(4), INTRO + 16, BAR, 0.34),
  // A: the piano owns the tune.
  theme(A, 1, 1),
  theme(A + 32, 1, 1.04),
  leftHand(A_CHORDS, A, BAR, 0.4),
  // B: the piano drops to accompaniment under the strings.
  leftHand(B_CHORDS, B, BAR * 2, 0.34),
  // A': the strings have the tune; the piano answers in the gaps, high.
  humanise(
    legato(
      tracker(
        `
          -:2 G#5:1 E5:1        | -:2 C#5:2           |
          -:4                   | -:2 F#5:1 D#5:1     |
          -:2 G#5:1 A5:1        | -:2 B4:2            |
          -:4                   | -:1 D#5:1 C#5:2     |
        `,
        { start: A2, checkBars: BAR, velocity: 0.5 },
      ),
      0.06,
    ),
    0.03,
    15,
  ),
  leftHand(A_CHORDS, A2, BAR, 0.42),
  // Coda: one piano again, the theme's last two bars, slowing.
  humanise(
    legato(
      agogic(
        lean(
          tracker(
            `
              G#4:1 A4:1 G#4:2  | E4:2 C#4:2          |
              D#4:1 C#4:3       | -:4                 |
              G#3:1 C#4:1 E4:2  | D#4:2 C#4:2         |
              D#4:2 C#4:2       | C#4:4               |
            `,
            { start: CODA, checkBars: BAR, velocity: 0.44 },
          ),
          [
            [CODA + 8, CODA + 9],
            [CODA + 20, CODA + 22],
            [CODA + 24, CODA + 26],
          ],
        ),
        [CODA + 12, CODA + 24, CODA + 32],
        0.18,
      ),
      0.08,
    ),
    0.03,
    16,
  ),
  leftHand(CODA_CHORDS, CODA, BAR, 0.3),
);

// --- strings ---------------------------------------------------------------

/** The half-time statement: the theme at half speed, and the cue's centre. */
const stringsLead = concatNotes(
  theme(B, 2, 0.86),
  // A': the section takes the tune back at speed, doubled an octave below by
  // the violas only from the climb onward — the sound widens at the climax.
  theme(A2, 1, 0.92),
  doubled(theme(A2, 1, 0.92).filter((n) => n[0] >= A2 + 16), -12, 0.7),
  theme(A2 + 32, 1, 0.96),
  doubled(theme(A2 + 32, 1, 0.96).filter((n) => n[0] >= A2 + 48), -12, 0.72),
);

/** A held bed: thirds and fifths, entering half way through A and never busy. */
const stringsBed = humanise(
  concatNotes(
    padLine(A_CHORDS.slice(8), { start: A + 32, center: 57, velocity: 0.34, dur: 3.9, seed: 40 }),
    padLine(B_CHORDS, { start: B, barBeats: 8, center: 57, velocity: 0.4, dur: 7.6, seed: 41 }),
    padLine(A_CHORDS, { start: A2, center: 57, velocity: 0.42, dur: 3.9, seed: 42 }),
    padLine(CODA_CHORDS, { start: CODA, center: 55, velocity: 0.3, dur: 3.9, seed: 43 }),
  ),
  0.03,
  18,
);

/** Cellos and basses: roots and the occasional step, bowed long. */
const lowStrings = humanise(
  concatNotes(
    chordRoots(A_CHORDS.slice(8), 2).map((m, i): Note => [A + 32 + i * BAR, 3.8, m, 0.42]),
    chordRoots(B_CHORDS, 2).map((m, i): Note => [B + i * BAR * 2, 7.6, m, 0.46]),
    chordRoots(A_CHORDS, 2).map((m, i): Note => [A2 + i * BAR, 3.8, m, 0.5]),
    chordRoots(CODA_CHORDS, 2).map((m, i): Note => [CODA + i * BAR, 3.8, m, 0.36]),
  ),
  0.03,
  20,
);

// --- colour ----------------------------------------------------------------

/** Harp: broken chords under the half-time B, and nothing anywhere else. */
const harpNotes = humanise(
  arpStackLine(B_CHORDS, {
    start: B,
    barBeats: 8,
    pattern: [0, 1, 2, 3, 4, 3, 2, 1],
    step: 0.5,
    dur: 1.2,
    center: 68,
    maxTones: 3,
    velocity: 0.34,
    accent: 1.2,
    seed: 44,
  }),
  0.04,
  22,
);

/** One bell, at the coda, and one at the loop's turn. */
const bellNotes: Note[] = [
  [B, 6, 'C#5', 0.4],
  [CODA, 6, 'C#4', 0.36],
];

// --- restrained percussion -------------------------------------------------

const kickNotes = concatNotes(
  groove('X.......x.......', { start: A + 32, bars: 8, pitch: 'C2', velocity: 0.42, seed: 61 }),
  groove('X.......x...x...', { start: A2, bars: 16, pitch: 'C2', velocity: 0.5, seed: 62 }),
);

const snareNotes = concatNotes(
  groove('....g.......g..g', { start: A + 32, bars: 8, pitch: 'D2', velocity: 0.3, ghost: 0.18, seed: 63 }),
  groove('....X..g....X..g', { start: A2, bars: 15, pitch: 'D2', velocity: 0.44, ghost: 0.2, seed: 64 }),
  // A roll into A', the one moment the kit is heard as an event.
  Array.from({ length: 8 }, (_, i): Note => [A2 - 2 + i * 0.25, 0.22, 'D2', 0.26 + i * 0.05]),
);

const shakerNotes = concatNotes(
  groove('x.g.x.g.x.g.x.g.', { start: A2, bars: 16, pitch: 'F#2', velocity: 0.22, ghost: 0.12, seed: 65 }),
);

const timpaniNotes = humanise(
  [
    [A - 1, 1, 'C#2', 0.4],
    [B - 1, 1, 'G#1', 0.44],
    [A2 - 4, 4, 'C#2', 0.5],
    [CODA - 1, 1, 'C#2', 0.36],
  ] as Note[],
  0.04,
  66,
);

export const shuyinTrack: Track = {
  name: 'boss-shuyin',
  bpm: 154,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.74, damp: 0.3, width: 0.94, preDelay: 0.024 },
    delay: { timeBeats: 0.75, feedback: 0.18, damp: 2400 },
  },
  channels: [
    { name: 'piano', instrument: 'piano', volume: 0.92, pan: -0.04, notes: pianoNotes, fx: { reverb: 0.3 } },
    { name: 'strings', instrument: 'strings', volume: 0.72, pan: -0.12, notes: ramp(stringsLead, 0.96, 1.04, B, LENGTH - B), fx: { reverb: 0.36 } },
    { name: 'string bed', instrument: 'pad', volume: 0.5, pan: 0.1, notes: stringsBed, fx: { reverb: 0.44 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.6, pan: 0.16, notes: lowStrings, fx: { reverb: 0.34 } },
    { name: 'harp', instrument: 'harp', volume: 0.5, pan: -0.26, notes: harpNotes, fx: { reverb: 0.4 } },
    { name: 'bell', instrument: 'bell', volume: 0.3, pan: 0.24, notes: bellNotes, fx: { reverb: 0.5 } },
    { name: 'kick', instrument: 'kick', volume: 0.48, pan: 0, notes: kickNotes, fx: { reverb: 0.12 } },
    { name: 'snare', instrument: 'snare', volume: 0.42, pan: -0.08, notes: nudge(snareNotes, 0.006), fx: { reverb: 0.18 } },
    { name: 'shaker', instrument: 'shaker', volume: 0.26, pan: 0.26, notes: shakerNotes, fx: { reverb: 0.12 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.54, pan: 0.06, notes: timpaniNotes, fx: { reverb: 0.36 } },
  ],
};

export default shuyinTrack;
