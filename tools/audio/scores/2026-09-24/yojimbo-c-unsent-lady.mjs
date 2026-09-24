/**
 * SKETCH C for the Yojimbo battle cue — "The Unsent Lady".
 * Lady Ginnem's ghostliness first. About 60 s, Eb Aeolian, 4/4, 112 bpm.
 *
 * ORIGINAL COMPOSITION. Nothing here is transcribed from any existing work. In
 * the game this fight plays Lulu's own theme; this sketch neither quotes nor
 * imitates it (AGENTS.md rule 8). Its soprano line is written below note by
 * note; the only borrowed material is this repo's own: `SENDING` (the
 * boss hymn's turn, "FFX's dread") and `PYREFLY_RISE` (the title's rising
 * question), both imported from `src/audio/tracks/motifs.ts` via themes.ts,
 * never retyped. Ginnem is unsent, so the sending and the pyreflies are hers.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Lady Ginnem's Yojimbo is an FFX
 * encounter (research/ffx-yojimbo.md §1.2). Aeolian, never Dorian: `SENDING`
 * is stamped only on the tonic and the fourth, because on the fifth its
 * whole step would land on the raised sixth THEMES.md reserves for FFX-2. No
 * dominant chord. Quartal planing is THEMES.md's colour for "unmoored" scenes.
 *
 * Form (4/4, 112 bpm, 28 bars, 112 beats, 60.0 s plus the tail):
 *   bars  1- 8  beats   0- 32  the veil: a distant soprano, harp planing in
 *                              fourths, celesta pyreflies, no pulse at all
 *   bars  9-16  beats  32- 64  the fight arrives under her: a pizzicato
 *                              heartbeat, soft timpani, choir; she sings SENDING
 *   bars 17-24  beats  64- 96  the fight: bowed eighths, taiko, horns carry
 *                              SENDING at half speed; the soprano floats above
 *   bars 25-28  beats  96-112  she goes back into the veil: planing falls, the
 *                              title's rising question, and no cadence, on the iv
 */

import { chordLine, chordRoots, motif, toMidi, tracker } from '../../../../src/audio/score.ts';
import { PYREFLY_RISE, augment } from '../../../../src/audio/tracks/themes.ts';
import { SENDING } from '../../../../src/audio/tracks/motifs.ts';
import { arch } from '../2026-09-21/sketch-kit.mjs';

const VEIL = 0;
const APPROACH = 32;
const FIGHT = 64;
const FADE = 96;
const LENGTH = 112;

/** Eb natural minor, as semitones above Eb. */
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const TONIC = toMidi('Eb4');

/** A diatonic scale degree (any integer) to MIDI, around Eb4. */
function deg(d) {
  const octave = Math.floor(d / 7);
  const step = ((d % 7) + 7) % 7;
  return TONIC + octave * 12 + AEOLIAN[step];
}

/**
 * A quartal stack on degree d: d, d+3, d+6 (diatonic fourths), plus the
 * bottom an octave up. Moving the whole stack by step is planing.
 */
function stack(d) {
  return [deg(d), deg(d + 3), deg(d + 6), deg(d + 7)];
}

/** Planing harp: each bar's stack rolled upward in eighths, then let ring. */
function planing(degrees, start, velocity, octave = 0) {
  const notes = [];
  degrees.forEach((d, bar) => {
    const tones = stack(d).map((m) => m + octave * 12);
    const at = start + bar * 4;
    tones.forEach((m, i) => notes.push([at + i * 0.5, 3.2 - i * 0.5, m, velocity + (i === 0 ? 0.06 : 0) - i * 0.02]));
    tones.slice(1, 3).reverse().forEach((m, i) => notes.push([at + 2.5 + i * 0.5, 1.2, m + 12, velocity - 0.12]));
  });
  return notes;
}

// -------------------------------------------------------------------- lines

/**
 * Her line, bars 1-8. It starts on the fifth, leaps a sixth to the minor third
 * above, and walks down one note at a time to the tonic, where it stops and
 * waits. Distant soprano, wordless.
 */
const VEIL_LINE = `
  Bb4:4 | Gb5:3 F5:1 | Eb5:2 Db5:2 | Bb4:4 |
  Cb5:3 Bb4:1 | Ab4:2 Gb4:1 F4:1 | Eb4:4 | ~:4 |
`;
const veilLine = arch(tracker(VEIL_LINE, { start: VEIL, velocity: 0.62, gate: 1.02, checkBars: 4 }), VEIL, VEIL + 32, 0.5, 0.74);

/**
 * Bars 9-16: she sings SENDING on the tonic, then on the fourth (the only two
 * degrees where the cell stays Aeolian), then four bars of her own.
 */
const sending = [
  ...motif(SENDING, [APPROACH], ['Eb5']),
  ...motif(SENDING, [APPROACH + 8], ['Ab4']),
];
const APPROACH_TAIL = `Gb5:2 F5:2 | Db5:4 | Eb5:3 Db5:1 | Bb4:4 |`;
const approachLine = arch(
  [...sending.map((n) => [n[0], n[1], n[2], 0.66]), ...tracker(APPROACH_TAIL, { start: APPROACH + 16, velocity: 0.66, gate: 1.02, checkBars: 4 })],
  APPROACH,
  FIGHT,
  0.56,
  0.78,
);

/** Bars 17-24: long notes above the fight, a descant, never the tune. */
const DESCANT = `Bb5:4 | ~:4 | Ab5:4 | Gb5:4 | Eb5:4 | ~:4 | Db5:4 | Eb5:4 |`;
const descant = arch(tracker(DESCANT, { start: FIGHT, velocity: 0.62, gate: 1.02, checkBars: 4 }), FIGHT, FADE, 0.52, 0.72);

/**
 * Bars 25-28: the title's rising question, once, and the minor third held over
 * the iv with nothing after it. She is still unsent.
 */
const question = motif(PYREFLY_RISE, [FADE + 4], ['Eb5']).map((n, i, all) => [
  n[0],
  i === all.length - 1 ? 9 : n[1] * 1.02,
  n[2],
  0.5 + i * 0.04,
]);

/** Horns: SENDING at half speed, on the tonic then the fourth, bars 17-24. */
const hornSending = [
  ...motif(augment(SENDING, 2), [FIGHT], ['Eb3']),
  ...motif(augment(SENDING, 2), [FIGHT + 16], ['Ab3']),
].map((n) => [n[0], n[1], n[2], 0.7]);
const hornLine = arch(hornSending, FIGHT, FADE, 0.62, 0.86);

// ------------------------------------------------------------------ harmony

const CHORDS_APPROACH = ['Ebm', 'Ebm', 'Abm', 'Abm', 'Gbmaj7', 'Db', 'Ebm', 'Bbm'];
const CHORDS_FIGHT = ['Ebm', 'Ebm', 'Db', 'Ebm', 'Abm', 'Abm', 'Gb', 'Abm'];

/** Planing degrees, one stack per bar. The veil drifts; the fade sinks. */
const PLANE_VEIL = [0, 1, 2, 1, 0, -1, -2, 0];
const PLANE_FIGHT = [0, 0, -1, 0, 3, 3, 2, 3];
const PLANE_FADE = [2, 1, 0, -1];

const harp = [
  ...planing(PLANE_VEIL, VEIL, 0.46),
  ...planing(PLANE_FADE, FADE, 0.4),
];

/** The celesta takes the planing up an octave under the fight, quietly. */
const celestaPlane = planing(PLANE_FIGHT, FIGHT, 0.3, 1);

/** Pyreflies: PYREFLY_RISE twinkling high on even bars of the veil, and once more at the end.
 * Stamped only on Eb and Ab: on Bb its whole step would land on the raised sixth. */
const motes = motif(PYREFLY_RISE, [VEIL + 4, VEIL + 12, VEIL + 20, VEIL + 28, FADE + 8], ['Eb6', 'Ab6', 'Eb6', 'Ab5', 'Eb6']).map(
  (n, i) => [n[0], n[1] * 0.6, n[2], 0.34 + (i % 4) * 0.03],
);

/** A thin high tremolo through the veil and the fade: the air of the cavern. */
const air = [
  [VEIL, 32, 'Eb5', 0.22],
  [VEIL, 32, 'Bb5', 0.2],
  [FADE, 16, 'Eb5', 0.2],
  [FADE, 16, 'Ab5', 0.18],
];

/** Choir: soft chords under the approach, fuller under the fight, one held iv to close. */
const choir = [
  ...chordLine(CHORDS_APPROACH, { start: APPROACH, octave: 3, center: 58, velocity: 0.3 }),
  ...chordLine(CHORDS_FIGHT, { start: FIGHT, octave: 3, center: 60, velocity: 0.42 }),
  ...chordLine(['Abm'], { start: FADE + 8, octave: 3, center: 58, velocity: 0.3, dur: 10 }),
];

/** The heartbeat under the approach: pizzicato, da-DUM twice a bar. */
const heart = chordRoots(CHORDS_APPROACH, 2).flatMap((root, bar) => {
  const at = APPROACH + bar * 4;
  return [
    [at, 0.4, root, 0.46],
    [at + 0.75, 0.5, root, 0.62],
    [at + 2, 0.4, root, 0.42],
    [at + 2.75, 0.5, root, 0.58],
  ];
});

/** The fight: bowed eighths on each root, the and-of-2 accented. */
const pulse = chordRoots(CHORDS_FIGHT, 2).flatMap((root, bar) =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((e) => [FIGHT + bar * 4 + e * 0.5, 0.46, root, e === 3 ? 0.62 : e === 0 ? 0.56 : 0.44]),
);

/** Taiko only in the fight: 0.80 on 1, 0.95 on the and-of-2; one last stroke at the fade. */
const taiko = [
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((bar) => [
    [FIGHT + bar * 4, 1, 'C2', 0.8],
    [FIGHT + bar * 4 + 1.5, 1, 'C2', 0.95],
  ]),
  [FADE, 2, 'C2', 0.6],
];

/** Timpani: soft at the head of each approach phrase, then a roll into the fight. */
const timpani = [
  [APPROACH, 2, 'Eb2', 0.42],
  [APPROACH + 16, 2, 'Eb2', 0.46],
  ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((t, i) => [FIGHT - 2 + t, 0.3, 'Bb1', 0.36 + i * 0.04]),
  [FIGHT, 2, 'Eb2', 0.66],
  [FIGHT + 16, 2, 'Ab1', 0.62],
];

export default {
  name: 'sketch-yojimbo-c',
  bpm: 112,
  timeSig: [4, 4],
  loop: { start: APPROACH, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  gain: 1,
  fx: {
    reverb: { room: 0.95, damp: 0.22, width: 1, preDelay: 0.035 },
  },
  channels: [
    { name: 'soprano (Ginnem)', instrument: 'soprano-distant', volume: 0.84, pan: 0.08, notes: [...veilLine, ...approachLine, ...descant, ...question], fx: { reverb: 0.5 }, perform: { timingJitterMs: 14 } },
    { name: 'harp (planing)', instrument: 'harp', volume: 0.56, pan: -0.24, notes: harp, fx: { reverb: 0.46 } },
    { name: 'celesta (pyreflies)', instrument: 'celesta', volume: 0.46, pan: 0.3, notes: [...motes, ...celestaPlane], fx: { reverb: 0.55 } },
    { name: 'air (tremolo)', instrument: 'strings-trem', volume: 0.34, pan: 0, notes: air, fx: { reverb: 0.5 } },
    { name: 'choir', instrument: 'choir-ooh', volume: 0.46, pan: -0.04, notes: choir, fx: { reverb: 0.48 }, perform: { timingJitterMs: 16 } },
    { name: 'pizzicato heartbeat', instrument: 'pizzicato', volume: 0.6, pan: -0.18, notes: heart, fx: { reverb: 0.26 } },
    { name: 'bowed pulse', instrument: 'strings-short', volume: 0.62, pan: -0.1, notes: pulse, fx: { reverb: 0.22 }, perform: { timingJitterMs: 10 } },
    { name: 'horns (SENDING)', instrument: 'horn', volume: 0.66, pan: 0.18, notes: hornLine, fx: { reverb: 0.36 }, perform: { timingJitterMs: 12 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.56, pan: 0.02, notes: taiko, fx: { reverb: 0.28 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.52, pan: 0.06, notes: timpani, fx: { reverb: 0.3 } },
  ],
};
