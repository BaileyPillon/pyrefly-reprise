/**
 * "The Summoner's Sorrow" — Lady Ginnem's Yojimbo, the Cavern of the Stolen Fayth.
 *
 * ORIGINAL COMPOSITION. C Aeolian, 4/4, 132 bpm (the line moves at 66).
 * Chapter IX. Nothing here is transcribed, quoted or paraphrased from any
 * existing work (AGENTS.md rule 8). In the game this fight plays Lulu's own
 * theme; this cue neither quotes nor imitates it. Its line is the sketch's own,
 * written below note by note: a rising fifth that leans on the flat sixth and
 * falls back.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Lady Ginnem's Yojimbo in the
 * Cavern of the Stolen Fayth is an FFX encounter (research/ffx-yojimbo.md §1.2,
 * §6.4; docs/plans/chapter-yojimbo-review.md §1). The mode is Aeolian, never
 * Dorian (THEMES.md reserves the raised sixth for FFX-2); there is no dominant
 * chord and no leading tone anywhere; the close is the score's own plagal
 * `AMEN`, imported, never retyped.
 *
 * WHERE IT COMES FROM. Bailey picked options-round O-6 sketch A, "The
 * Summoner's Sorrow", on 2026-09-24 ("All your recommendations";
 * `tools/audio/scores/2026-09-24/yojimbo-a-summoners-sorrow.mjs`,
 * `docs/audio/sketches/2026-09-24/yojimbo-a-summoners-sorrow.mp3`). This is that
 * sketch grown into the chapter's shipped battle cue, the way
 * `boss-seymour-macalania` was grown from its sketch. Every section the sketch
 * has is kept note for note (grief, the pulse joining, the strain, the crack,
 * control and the amen); the loop grows from 58 s to 87 s by two new sections
 * between the pulse and the strain.
 *
 * THE BRIEF (plan §6.2 O-6): Lulu's grief under control, a slow minor line that
 * a battle pulse joins, and one crack of feeling. Anti-brief: no quotation or
 * imitation of the original melody.
 *
 * WHAT THIS PASS ADDED (a guess, flagged on the audition page for Bailey's ear):
 *   - "the duty" (bars 17-24): the line moved two steps up the mode (C Aeolian
 *     degree for degree, so it stays in the key), on one horn, with a quiet
 *     violin descant and a new cello answer. Lulu takes up her last duty.
 *   - "the line in octaves" (bars 25-32): violin and cello together on the
 *     line, horns holding the harmony, the pulse a notch harder, so the strain
 *     has something to climb out of.
 *
 * Form (48 bars, 192 beats, 87.3 s plus the tail; loop 32 -> 192):
 *   bars  1- 8  beats   0- 32  grief, held: solo cello over felt piano, no pulse   [sketch]
 *   bars  9-16  beats  32- 64  the pulse joins: violin sings, cello answers        [sketch] <- loop
 *   bars 17-24  beats  64- 96  the duty: the line up the mode on a horn            [new]
 *   bars 25-32  beats  96-128  the line in octaves, violin and cello, horns        [new]
 *   bars 33-38  beats 128-152  composure strains: the line climbs, horns           [sketch]
 *   bars 39-40  beats 152-160  THE CRACK: one chord on the flat sixth, then only the piano [sketch]
 *   bars 41-48  beats 160-192  control again, closing iv - i on the amen           [sketch]
 */

import { arpLine, chordLine, chordRoots, concatNotes, motif, toMidi, tracker, type Note, type Track } from '../score.ts';
import { AMEN, agogic, lean } from './themes.ts';

const GRIEF = 0;
const PULSE = 32;
const DUTY = 64;
const OCTAVES = 96;
const STRAIN = 128;
const CRACK = 152;
const CONTROL = 160;
const LENGTH = 192;

// --------------------------------------------------------------------- helpers

/** A bell-shaped swell over a span (the sketch kit's `arch`, typed). */
function arch(notes: Note[], from: number, to: number, low: number, peak: number): Note[] {
  const span = Math.max(1e-6, to - from);
  return notes.map((n): Note => {
    const t = Math.min(1, Math.max(0, (n[0] - from) / span));
    const v = (low + (peak - low) * Math.sin(Math.PI * t)) * (n[3] ?? 0.8) * 1.25;
    return [n[0], n[1], n[2], Math.min(1, Math.max(0.05, v))];
  });
}

/** Move a list of (lean, resolve) beat pairs to a new section. */
const at = (pairs: Array<[number, number]>, start: number): Array<[number, number]> =>
  pairs.map(([a, b]): [number, number] => [a + start, b + start]);

// --------------------------------------------------------------------- harmony

/** One chord per bar. No V, no V7: iv, bVI, bVII, bIII and a minor v carry everything. */
const CHORDS_GRIEF = ['Cm', 'Abmaj7', 'Bb', 'Cm', 'Eb', 'Fm', 'Abmaj7', 'Cm'];
const CHORDS_PULSE = ['Cm', 'Abmaj7', 'Bb', 'Cm', 'Eb', 'Fm', 'Abmaj7', 'Cm'];
/** New: the duty's harmony, following its line up the mode; bVII hands to the strain. */
const CHORDS_DUTY = ['Eb', 'Cm', 'Fm', 'Cm', 'Gm', 'Eb', 'Abmaj7', 'Bb'];
const CHORDS_STRAIN = ['Cm', 'Gm', 'Fm', 'Bb', 'Eb', 'Bb'];
const CHORDS_CONTROL = ['Cm', 'Abmaj7', 'Bb', 'Cm', 'Eb', 'Fm', 'Fm', 'Cm'];

// ----------------------------------------------------------------------- lines

/**
 * THE LINE (the sketch's). Two four-bar phrases: a rising fifth that leans on
 * the flat sixth and settles, then the same shape a third higher that stops on
 * the fifth instead of coming home.
 */
export const YOJIMBO_LINE = `
  C3:2 G3:2 | Ab3:3 G3:1 | Eb3:2 F3:1 D3:1 | C3:4 |
  Eb3:2 Bb3:2 | C4:3 Bb3:1 | Ab3:2 G3:1 F3:1 | G3:4 |
`;

/** The appoggiaturas: the flat sixth over the fifth in bar 2, C over Bb in bar 6. */
const LEANS: Array<[number, number]> = [
  [4, 7],
  [20, 23],
];

const grief = lean(
  agogic(arch(tracker(YOJIMBO_LINE, { start: GRIEF, velocity: 0.62, gate: 1.0, checkBars: 4 }), GRIEF, GRIEF + 32, 0.5, 0.74), [16, 32], 0.08),
  LEANS,
);

/** The violin takes the same line an octave up once the pulse is under it. */
const sung = lean(
  agogic(arch(tracker(YOJIMBO_LINE, { start: PULSE, velocity: 0.66, gate: 1.0, transpose: 12, checkBars: 4 }), PULSE, PULSE + 32, 0.56, 0.8), [PULSE + 16, PULSE + 32], 0.08),
  at(LEANS, PULSE),
);

/** The cello answers underneath in half notes: thirds and roots, never the tune. */
const ANSWER = `
  Eb3:4 | C3:2 Eb3:2 | D3:4 | Eb3:2 G2:2 |
  G2:4 | Ab2:2 C3:2 | Eb3:2 C3:2 | Bb2:2 G2:2 |
`;
const answer = arch(tracker(ANSWER, { start: PULSE, velocity: 0.5, gate: 1.0, checkBars: 4 }), PULSE, PULSE + 32, 0.46, 0.64);

/**
 * NEW — the duty. THE LINE moved two steps up C Aeolian, degree for degree
 * (C->Eb, D->F, Eb->G, F->Ab, G->Bb, Ab->C, Bb->D), so its shape survives and
 * no note leaves the mode. On one horn: resolve, not grief. The leans stay on
 * the same beats.
 */
export const DUTY_LINE = `
  Eb3:2 Bb3:2 | C4:3 Bb3:1 | G3:2 Ab3:1 F3:1 | Eb3:4 |
  G3:2 D4:2 | Eb4:3 D4:1 | C4:2 Bb3:1 Ab3:1 | Bb3:4 |
`;
const duty = lean(
  agogic(arch(tracker(DUTY_LINE, { start: DUTY, velocity: 0.64, gate: 1.0, checkBars: 4 }), DUTY, DUTY + 32, 0.54, 0.76), [DUTY + 16, DUTY + 32], 0.06),
  at(LEANS, DUTY),
);

/** NEW — a quiet violin descant over the duty: one chord tone per bar, held. */
const DESCANT = `Bb4:4 | C5:4 | C5:4 | Eb5:4 | D5:4 | Eb5:4 | C5:4 | D5:4 |`;
const descant = arch(tracker(DESCANT, { start: DUTY, velocity: 0.46, gate: 1.0, checkBars: 4 }), DUTY, DUTY + 32, 0.4, 0.56);

/** NEW — the cello's answer under the duty: roots and thirds, low. */
const ANSWER_DUTY = `
  Eb2:2 G2:2 | C3:2 Eb3:2 | F2:2 Ab2:2 | C3:2 G2:2 |
  G2:2 Bb2:2 | Eb3:2 Bb2:2 | Ab2:2 C3:2 | Bb2:2 D3:2 |
`;
const answerDuty = arch(tracker(ANSWER_DUTY, { start: DUTY, velocity: 0.5, gate: 1.0, checkBars: 4 }), DUTY, DUTY + 32, 0.46, 0.62);

/** NEW — the line in octaves: violin above, cello below, a notch harder than the pulse. */
const octavesHigh = lean(
  agogic(arch(tracker(YOJIMBO_LINE, { start: OCTAVES, velocity: 0.7, gate: 1.0, transpose: 12, checkBars: 4 }), OCTAVES, OCTAVES + 32, 0.6, 0.82), [OCTAVES + 16, OCTAVES + 32], 0.06),
  at(LEANS, OCTAVES),
);
const octavesLow = lean(
  agogic(arch(tracker(YOJIMBO_LINE, { start: OCTAVES, velocity: 0.64, gate: 1.0, checkBars: 4 }), OCTAVES, OCTAVES + 32, 0.54, 0.74), [OCTAVES + 16, OCTAVES + 32], 0.06),
  at(LEANS, OCTAVES),
);

/**
 * Composure strains (the sketch's): the line climbs a step at a time, each
 * two-bar cell a third higher than the last, and lands on the leading edge of
 * the crack.
 */
const STRAIN_LINE = `
  Eb4:2 D4:1 C4:1 | Bb3:2 C4:2 | F4:2 Eb4:1 D4:1 | C4:2 D4:2 | G4:3 F4:1 | Eb4:2 D4:2 |
`;
const strain = arch(tracker(STRAIN_LINE, { start: STRAIN, velocity: 0.74, gate: 1.0, transpose: 12, checkBars: 4 }), STRAIN, CRACK, 0.66, 0.9);

/**
 * THE CRACK (the sketch's). The flat sixth, held high on the violin for six
 * beats: two tied attacks at 0.74 and 0.86 with a 0.15-beat overlap, because the
 * renderer cannot swell a held note (THEMES.md, "Dynamics"). Then nothing.
 */
const crackVoice: Note[] = [
  [CRACK, 3.15, 'Ab5', 0.74],
  [CRACK + 3, 3, 'Ab5', 0.86],
];

/** Control again (the sketch's): the cello's first phrase, quieter, then the amen. */
const CONTROL_LINE = `
  C3:2 G3:2 | Ab3:3 G3:1 | Eb3:2 F3:1 D3:1 | C3:4 |
  Eb3:2 Bb3:2 | C4:3 Bb3:1 |
`;
const control = lean(
  arch(tracker(CONTROL_LINE, { start: CONTROL, velocity: 0.56, gate: 1.0, checkBars: 4 }), CONTROL, CONTROL + 24, 0.48, 0.68),
  at(LEANS, CONTROL),
);

/**
 * The amen (THEMES.md): scale degree 2 held over the iv, falling to the tonic.
 * Stamped from the shared cell at twice its written length. The 2 is louder
 * than its resolution.
 */
const amen: Note[] = motif(
  AMEN.map((n): Note => [n[0] * 2, n[1] * 2, n[2]]),
  [CONTROL + 24],
  ['C4'],
).map((n, i): Note => [n[0], i === 0 ? n[1] + 0.15 : n[1] + 4, n[2], i === 0 ? 0.66 : 0.52]);

// --------------------------------------------------------------------- texture

/** Felt piano: a slow broken chord per bar, all through. */
const piano = concatNotes(
  arpLine(CHORDS_GRIEF, { start: GRIEF, pattern: [0, 2, 4, 2], step: 1, dur: 1.9, octave: 3, velocity: 0.42, accent: 1.1 }),
  arpLine(CHORDS_PULSE, { start: PULSE, pattern: [0, 2, 4, 5], step: 1, dur: 1.4, octave: 3, velocity: 0.36, accent: 1.1 }),
  arpLine(CHORDS_DUTY, { start: DUTY, pattern: [0, 2, 4, 5], step: 1, dur: 1.4, octave: 3, velocity: 0.36, accent: 1.1 }),
  arpLine(CHORDS_PULSE, { start: OCTAVES, pattern: [0, 2, 4, 5], step: 1, dur: 1.3, octave: 3, velocity: 0.37, accent: 1.1 }),
  arpLine(CHORDS_STRAIN, { start: STRAIN, pattern: [0, 2, 4, 5], step: 1, dur: 1.2, octave: 3, velocity: 0.38, accent: 1.12 }),
  // After the crack, the piano is alone for two beats: one note, the tonic.
  [[CRACK + 6, 2, 'C4', 0.34]],
  arpLine(CHORDS_CONTROL.slice(0, 7), { start: CONTROL, pattern: [0, 2, 4, 2], step: 1, dur: 1.9, octave: 3, velocity: 0.36, accent: 1.1 }),
  // The last chord, left ringing.
  chordLine(['Cm'], { start: LENGTH - 4, dur: 6, octave: 3, velocity: 0.4, roll: 0.12 }),
);

/**
 * A low string pad under the grief and the control: a floor, not a part. The
 * sketch held it flat at 0.32 and 0.30; here it breathes a little across each
 * section (about 0.30 to 0.36), because THEMES.md "Dynamics" forbids a flat line.
 */
const pad = concatNotes(
  arch(chordLine(CHORDS_GRIEF, { start: GRIEF, octave: 3, center: 55, velocity: 0.32 }), GRIEF, GRIEF + 32, 0.75, 0.9),
  arch(chordLine(CHORDS_CONTROL, { start: CONTROL, octave: 3, center: 55, velocity: 0.3 }), CONTROL, CONTROL + 32, 0.75, 0.86),
);

/**
 * The battle pulse: bowed eighths on each bar's root, the first of each bar and
 * the and-of-2 accented. It joins at bar 9, stops dead at the crack, and comes
 * back a notch quieter for the control, thinning to quarters in the last two bars.
 */
function pulseBars(chords: string[], start: number, velocity: number): Note[] {
  const roots = chordRoots(chords, 2);
  const notes: Note[] = [];
  roots.forEach((root, bar) => {
    for (let e = 0; e < 8; e++) {
      const accent = e === 0 ? 0.08 : e === 3 ? 0.12 : 0;
      notes.push([start + bar * 4 + e * 0.5, 0.46, root, Math.min(1, velocity + accent)]);
    }
  });
  return notes;
}
const pulse = concatNotes(
  pulseBars(CHORDS_PULSE, PULSE, 0.44),
  pulseBars(CHORDS_DUTY, DUTY, 0.46),
  pulseBars(CHORDS_PULSE, OCTAVES, 0.49),
  pulseBars(CHORDS_STRAIN, STRAIN, 0.52),
  pulseBars(CHORDS_CONTROL.slice(0, 6), CONTROL, 0.38),
  [0, 1, 2, 3, 4, 5, 6].map((q): Note => [CONTROL + 24 + q, 0.8, toMidi(q < 4 ? 'F2' : 'C2'), 0.34 - q * 0.02]),
);

/**
 * Taiko: the boss accent (THEMES.md), 0.80 on the downbeat and 0.95 on the
 * and-of-2, less `soft`. Joins with the pulse, fuller section by section into
 * the strain, silent from the crack to the end but for one stroke under the amen.
 */
function taikoBars(bars: number, start: number, soft = 0): Note[] {
  const notes: Note[] = [];
  for (let b = 0; b < bars; b++) {
    const bar = start + b * 4;
    notes.push([bar, 1, 'C2', 0.8 - soft]);
    notes.push([bar + 1.5, 1, 'C2', 0.95 - soft]);
    if (b % 2 === 1) notes.push([bar + 3, 0.5, 'C2', 0.6 - soft]);
  }
  return notes;
}
const taiko = concatNotes(
  taikoBars(8, PULSE, 0.22),
  taikoBars(8, DUTY, 0.18),
  taikoBars(8, OCTAVES, 0.13),
  taikoBars(6, STRAIN, 0.08),
  [[CONTROL + 24, 2, 'C2', 0.4]],
);

/** Timpani: the root at the head of each section, and a roll into the crack. */
const timpani: Note[] = [
  [PULSE, 2, 'C2', 0.56],
  [DUTY, 2, 'Eb2', 0.5],
  [OCTAVES, 2, 'C2', 0.58],
  [STRAIN, 2, 'C2', 0.62],
  ...Array.from({ length: 16 }, (_, i): Note => [CRACK - 4 + i * 0.25, 0.3, 'Ab1', 0.36 + i * 0.03]),
  [CRACK, 3, 'Ab1', 0.78],
];

/** Horns: the duty's line (new), the octaves' harmony (new), the strain and the crack (the sketch's). */
const hornChords = concatNotes(
  chordLine(CHORDS_PULSE, { start: OCTAVES, octave: 3, center: 58, velocity: 0.36, dur: 3.8 }),
  chordLine(CHORDS_STRAIN, { start: STRAIN, octave: 3, center: 60, velocity: 0.46, dur: 3.8 }),
  chordLine(['Abmaj7'], { start: CRACK, octave: 3, center: 62, velocity: 0.78, dur: 5.5 }),
);

/** The full string section on the crack only: one chord, fortissimo, then cut. */
const tutti = chordLine(['Abmaj7'], { start: CRACK, octave: 3, center: 64, bassOctaves: 1, velocity: 0.74, dur: 5.6 });

/** A cymbal swell into the crack, and nothing after it. */
const swell: Note[] = [[CRACK - 4, 4, 'C3', 0.62]];

export const bossYojimboTrack: Track = {
  name: 'boss-yojimbo',
  bpm: 132,
  timeSig: [4, 4],
  loop: { start: PULSE, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.9, damp: 0.3, width: 0.95, preDelay: 0.025 },
  },
  channels: [
    { name: 'cello (the line: grief, octaves)', instrument: 'cello-solo', volume: 0.84, pan: -0.12, notes: concatNotes(grief, octavesLow), fx: { reverb: 0.34 }, perform: { timingJitterMs: 14 } },
    { name: 'violin (the line, sung; the crack)', instrument: 'violin-solo', volume: 0.8, pan: 0.1, notes: concatNotes(sung, descant, octavesHigh, strain, crackVoice), fx: { reverb: 0.36 }, perform: { timingJitterMs: 13 } },
    { name: 'cello (answer, control, amen)', instrument: 'cello-solo', volume: 0.74, pan: -0.2, notes: concatNotes(answer, answerDuty, control, amen), fx: { reverb: 0.32 }, perform: { timingJitterMs: 15 } },
    { name: 'horn (the duty)', instrument: 'horn', volume: 0.6, pan: 0.16, notes: duty, fx: { reverb: 0.36 }, perform: { timingJitterMs: 12 } },
    { name: 'felt piano', instrument: 'piano-felt', volume: 0.62, pan: 0.05, notes: piano, fx: { reverb: 0.3 } },
    { name: 'string pad', instrument: 'strings', volume: 0.46, pan: 0, notes: pad, fx: { reverb: 0.4 }, perform: { timingJitterMs: 16 } },
    { name: 'bowed pulse', instrument: 'strings-short', volume: 0.66, pan: -0.1, notes: pulse, fx: { reverb: 0.2 }, perform: { timingJitterMs: 10 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.58, pan: 0.04, notes: taiko, fx: { reverb: 0.26 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.56, pan: 0.06, notes: timpani, fx: { reverb: 0.3 } },
    { name: 'horns (harmony, the crack)', instrument: 'horn', volume: 0.56, pan: 0.18, notes: hornChords, fx: { reverb: 0.38 }, perform: { timingJitterMs: 12 } },
    { name: 'strings (the crack)', instrument: 'strings', volume: 0.7, pan: 0.02, notes: tutti, fx: { reverb: 0.42 }, perform: { timingJitterMs: 14 } },
    { name: 'cymbal swell', instrument: 'cymbal-swell', volume: 0.4, pan: 0.12, notes: swell, fx: { reverb: 0.4 } },
  ],
};

export default bossYojimboTrack;
