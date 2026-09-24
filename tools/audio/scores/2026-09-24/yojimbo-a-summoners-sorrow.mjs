/**
 * SKETCH A for the Yojimbo battle cue — "The Summoner's Sorrow".
 * Lulu's grief first. About 60 s, C Aeolian, 4/4, 132 bpm (the line moves at 66).
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work. In
 * the game this fight plays Lulu's own theme; this sketch neither quotes nor
 * imitates it (AGENTS.md rule 8). Its line is written below, note by note, and
 * shares no phrase with any retail melody: it opens on a rising fifth, leans on
 * the flat sixth and falls back, which is this file's own gesture.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Lady Ginnem's Yojimbo in the
 * Cavern of the Stolen Fayth is an FFX encounter (research/ffx-yojimbo.md §1.2,
 * docs/plans/chapter-yojimbo-review.md §1). The mode is Aeolian, never Dorian
 * (THEMES.md reserves the raised sixth for FFX-2), there is no dominant chord
 * anywhere (THEMES.md rations them to four in the whole score) and the close is
 * the score's own plagal `AMEN`, imported, never retyped.
 *
 * THE BRIEF (chapter-yojimbo-review.md §6.2 O-6): Lulu's grief under control, a
 * slow minor line that a battle pulse joins, and one crack of feeling. This
 * sketch takes the brief literally and in that order.
 *
 * Form (4/4, 132 bpm, 32 bars, 128 beats, 58.2 s plus the tail):
 *   bars  1- 8  beats   0- 32  grief, held: solo cello over felt piano, no pulse
 *   bars  9-16  beats  32- 64  the pulse joins: the line passes to solo violin,
 *                              bowed eighths and taiko underneath, cello answers
 *   bars 17-22  beats  64- 88  composure strains: the line climbs in steps, horns
 *   bars 23-24  beats  88- 96  THE CRACK: one full chord on the flat sixth, the
 *                              violin held high, then everything stops but the piano
 *   bars 25-32  beats  96-128  control again: the cello's first phrase, quieter,
 *                              closing iv - i on the amen
 */

import { arpLine, chordLine, chordRoots, motif, toMidi, tracker } from '../../../../src/audio/score.ts';
import { AMEN, agogic, lean } from '../../../../src/audio/tracks/themes.ts';
import { arch, louder } from '../2026-09-21/sketch-kit.mjs';

const GRIEF = 0;
const PULSE = 32;
const STRAIN = 64;
const CRACK = 88;
const CONTROL = 96;
const LENGTH = 128;

// ------------------------------------------------------------------ harmony

/** One chord per bar. No V, no V7: iv, bVI, bVII and bIII carry everything. */
const CHORDS_GRIEF = ['Cm', 'Abmaj7', 'Bb', 'Cm', 'Eb', 'Fm', 'Abmaj7', 'Cm'];
const CHORDS_PULSE = ['Cm', 'Abmaj7', 'Bb', 'Cm', 'Eb', 'Fm', 'Abmaj7', 'Cm'];
const CHORDS_STRAIN = ['Cm', 'Gm', 'Fm', 'Bb', 'Eb', 'Bb'];
const CHORDS_CONTROL = ['Cm', 'Abmaj7', 'Bb', 'Cm', 'Eb', 'Fm', 'Fm', 'Cm'];

// -------------------------------------------------------------------- lines

/**
 * The line. Two four-bar phrases: a rising fifth that leans on the flat sixth
 * and settles, then the same shape a third higher that stops on the fifth
 * instead of coming home. Half notes and whole notes at 132 bpm: it breathes at 66.
 */
const LINE = `
  C3:2 G3:2 | Ab3:3 G3:1 | Eb3:2 F3:1 D3:1 | C3:4 |
  Eb3:2 Bb3:2 | C4:3 Bb3:1 | Ab3:2 G3:1 F3:1 | G3:4 |
`;

/** The appoggiaturas: Ab over G in bar 2 and C over Bb in bar 6 lean louder. */
const LEANS = [
  [4, 7],
  [20, 23],
];

const grief = lean(
  agogic(arch(tracker(LINE, { start: GRIEF, velocity: 0.62, gate: 1.0, checkBars: 4 }), GRIEF, GRIEF + 32, 0.5, 0.74), [16, 32], 0.08),
  LEANS,
);

/** The violin takes the same line an octave up once the pulse is under it. */
const sung = lean(
  agogic(arch(tracker(LINE, { start: PULSE, velocity: 0.66, gate: 1.0, transpose: 12, checkBars: 4 }), PULSE, PULSE + 32, 0.56, 0.8), [PULSE + 16, PULSE + 32], 0.08),
  LEANS.map(([a, b]) => [a + PULSE, b + PULSE]),
);

/** The cello answers underneath in half notes: thirds and roots, never the tune. */
const ANSWER = `
  Eb3:4 | C3:2 Eb3:2 | D3:4 | Eb3:2 G2:2 |
  G2:4 | Ab2:2 C3:2 | Eb3:2 C3:2 | Bb2:2 G2:2 |
`;
const answer = arch(tracker(ANSWER, { start: PULSE, velocity: 0.5, gate: 1.0, checkBars: 4 }), PULSE, PULSE + 32, 0.46, 0.64);

/**
 * Composure strains: the line climbs a step at a time, each two-bar cell a
 * third higher than the last, and lands on the leading edge of the crack.
 */
const STRAIN_LINE = `
  Eb4:2 D4:1 C4:1 | Bb3:2 C4:2 | F4:2 Eb4:1 D4:1 | C4:2 D4:2 | G4:3 F4:1 | Eb4:2 D4:2 |
`;
const strain = arch(tracker(STRAIN_LINE, { start: STRAIN, velocity: 0.74, gate: 1.0, transpose: 12, checkBars: 4 }), STRAIN, CRACK, 0.66, 0.9);

/**
 * THE CRACK. The flat sixth, held high on the violin for six beats. The
 * renderer cannot swell a held note, so it is two tied attacks at 0.74 and
 * 0.86 with a 0.15-beat overlap (THEMES.md, "Dynamics"). Then nothing.
 */
const crackVoice = [
  [CRACK, 3.15, 'Ab5', 0.74],
  [CRACK + 3, 3, 'Ab5', 0.86],
];

/** Control again: the cello's first phrase, quieter, then the amen. */
const CONTROL_LINE = `
  C3:2 G3:2 | Ab3:3 G3:1 | Eb3:2 F3:1 D3:1 | C3:4 |
  Eb3:2 Bb3:2 | C4:3 Bb3:1 |
`;
const control = lean(
  arch(tracker(CONTROL_LINE, { start: CONTROL, velocity: 0.56, gate: 1.0, checkBars: 4 }), CONTROL, CONTROL + 24, 0.48, 0.68),
  [
    [CONTROL + 4, CONTROL + 7],
    [CONTROL + 20, CONTROL + 23],
  ],
);

/**
 * The amen (THEMES.md): scale degree 2 held over the iv, falling to the tonic.
 * Stamped from the shared cell, twice as long as written, on the last two bars
 * but one. The 2 is louder than its resolution.
 */
const amen = motif(AMEN.map((n) => [n[0] * 2, n[1] * 2, n[2]]), [CONTROL + 24], ['C4']).map((n, i) => [
  n[0],
  i === 0 ? n[1] + 0.15 : n[1] + 4,
  n[2],
  i === 0 ? 0.66 : 0.52,
]);

// ------------------------------------------------------------------ texture

/** Felt piano: a slow broken chord per bar in quarter notes, rolled, all through. */
const pianoGrief = arpLine(CHORDS_GRIEF, { start: GRIEF, pattern: [0, 2, 4, 2], step: 1, dur: 1.9, octave: 3, velocity: 0.42, accent: 1.1 });
const pianoPulse = arpLine(CHORDS_PULSE, { start: PULSE, pattern: [0, 2, 4, 5], step: 1, dur: 1.4, octave: 3, velocity: 0.36, accent: 1.1 });
const pianoStrain = arpLine(CHORDS_STRAIN, { start: STRAIN, pattern: [0, 2, 4, 5], step: 1, dur: 1.2, octave: 3, velocity: 0.38, accent: 1.12 });
const pianoControl = arpLine(CHORDS_CONTROL.slice(0, 7), { start: CONTROL, pattern: [0, 2, 4, 2], step: 1, dur: 1.9, octave: 3, velocity: 0.36, accent: 1.1 });
/** After the crack, the piano is alone for two beats: one note, the tonic. */
const pianoAlone = [[CRACK + 6, 2, 'C4', 0.34]];
/** The last chord, left ringing. */
const pianoLast = chordLine(['Cm'], { start: LENGTH - 4, dur: 6, octave: 3, velocity: 0.4, roll: 0.12 });

/** A low string pad under the grief and the control: a floor, not a part. */
const pad = [
  ...chordLine(CHORDS_GRIEF, { start: GRIEF, octave: 3, center: 55, velocity: 0.32 }),
  ...chordLine(CHORDS_CONTROL, { start: CONTROL, octave: 3, center: 55, velocity: 0.3 }),
];

/**
 * The battle pulse: bowed eighths on each bar's root, the first of each bar and
 * the and-of-2 accented. It joins at bar 9, stops dead at the crack, and comes
 * back a notch quieter for the control, thinning to quarters in the last two bars.
 */
function pulseBars(chords, start, velocity) {
  const roots = chordRoots(chords, 2);
  const notes = [];
  roots.forEach((root, bar) => {
    for (let e = 0; e < 8; e++) {
      const at = start + bar * 4 + e * 0.5;
      const accent = e === 0 ? 0.08 : e === 3 ? 0.12 : 0;
      notes.push([at, 0.46, root, Math.min(1, velocity + accent)]);
    }
  });
  return notes;
}
const pulse = [
  ...pulseBars(CHORDS_PULSE, PULSE, 0.44),
  ...pulseBars(CHORDS_STRAIN, STRAIN, 0.52),
  ...pulseBars(CHORDS_CONTROL.slice(0, 6), CONTROL, 0.38),
  ...[0, 1, 2, 3, 4, 5, 6].map((q) => [CONTROL + 24 + q, 0.8, toMidi(q < 4 ? 'F2' : 'C2'), 0.34 - q * 0.02]),
];

/**
 * Taiko: the boss accent (THEMES.md): 0.80 on the downbeat, 0.95 on the and-of-2.
 * Joins with the pulse, fuller in the strain, silent from the crack to the end
 * except one soft stroke under the amen.
 */
function taikoBars(bars, start, soft = 0) {
  const notes = [];
  for (let b = 0; b < bars; b++) {
    const at = start + b * 4;
    notes.push([at, 1, 'C2', 0.8 - soft]);
    notes.push([at + 1.5, 1, 'C2', 0.95 - soft]);
    if (b % 2 === 1) notes.push([at + 3, 0.5, 'C2', 0.6 - soft]);
  }
  return notes;
}
const taiko = [...taikoBars(8, PULSE, 0.22), ...taikoBars(6, STRAIN, 0.08), [CONTROL + 24, 2, 'C2', 0.4]];

/** Timpani: the root at the head of each section, and a roll into the crack. */
const timpani = [
  [PULSE, 2, 'C2', 0.56],
  [STRAIN, 2, 'C2', 0.62],
  ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75].map((t, i) => [CRACK - 4 + t, 0.3, 'Ab1', 0.36 + i * 0.03]),
  [CRACK, 3, 'Ab1', 0.78],
];

/** Horns hold the strain's harmony in open voicings, and the crack's chord. */
const horns = [
  ...chordLine(CHORDS_STRAIN, { start: STRAIN, octave: 3, center: 60, velocity: 0.46, dur: 3.8 }),
  ...chordLine(['Abmaj7'], { start: CRACK, octave: 3, center: 62, velocity: 0.78, dur: 5.5 }),
];

/** The full string section on the crack only: one chord, fortissimo, then cut. */
const tutti = chordLine(['Abmaj7'], { start: CRACK, octave: 3, center: 64, bassOctaves: 1, velocity: 0.74, dur: 5.6 });

/** A cymbal swell into the crack, and nothing after it. */
const swell = [[CRACK - 4, 4, 'C3', 0.62]];

export default {
  name: 'sketch-yojimbo-a',
  bpm: 132,
  timeSig: [4, 4],
  loop: { start: PULSE, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  gain: 1,
  fx: {
    reverb: { room: 0.9, damp: 0.3, width: 0.95, preDelay: 0.025 },
  },
  channels: [
    { name: 'cello (grief)', instrument: 'cello-solo', volume: 0.84, pan: -0.12, notes: grief, fx: { reverb: 0.34 }, perform: { timingJitterMs: 14 } },
    { name: 'violin (the line, sung)', instrument: 'violin-solo', volume: 0.8, pan: 0.1, notes: [...sung, ...strain, ...crackVoice], fx: { reverb: 0.36 }, perform: { timingJitterMs: 13 } },
    { name: 'cello (answer, control)', instrument: 'cello-solo', volume: 0.74, pan: -0.2, notes: [...answer, ...control, ...amen], fx: { reverb: 0.32 }, perform: { timingJitterMs: 15 } },
    { name: 'felt piano', instrument: 'piano-felt', volume: 0.62, pan: 0.05, notes: [...pianoGrief, ...pianoPulse, ...pianoStrain, ...pianoAlone, ...pianoControl, ...pianoLast], fx: { reverb: 0.3 } },
    { name: 'string pad', instrument: 'strings', volume: 0.46, pan: 0, notes: pad, fx: { reverb: 0.4 }, perform: { timingJitterMs: 16 } },
    { name: 'bowed pulse', instrument: 'strings-short', volume: 0.66, pan: -0.1, notes: pulse, fx: { reverb: 0.2 }, perform: { timingJitterMs: 10 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.58, pan: 0.04, notes: taiko, fx: { reverb: 0.26 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.56, pan: 0.06, notes: timpani, fx: { reverb: 0.3 } },
    { name: 'horns', instrument: 'horn', volume: 0.56, pan: 0.18, notes: horns, fx: { reverb: 0.38 }, perform: { timingJitterMs: 12 } },
    { name: 'strings (the crack)', instrument: 'strings', volume: 0.7, pan: 0.02, notes: louder(tutti, 0), fx: { reverb: 0.42 }, perform: { timingJitterMs: 14 } },
    { name: 'cymbal swell', instrument: 'cymbal-swell', volume: 0.4, pan: 0.12, notes: swell, fx: { reverb: 0.4 } },
  ],
};
