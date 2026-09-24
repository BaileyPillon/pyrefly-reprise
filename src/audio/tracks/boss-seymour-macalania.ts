/**
 * "The Courtesy" — Seymour and the Guado Guardians, Macalania Temple.
 *
 * ORIGINAL COMPOSITION. C# minor, 4/4, 126 bpm. Chapter VII. Nothing here is
 * transcribed, quoted or paraphrased from any existing work (AGENTS.md rule 8).
 * GAME CASE (AGENTS.md rule 14): **FFX only.** The cue belongs to
 * `seymour-anima-macalania`, an FFX encounter with an FFX party
 * (research/ffx-seymour-anima-macalania.md); no FFX-2 chapter names it.
 *
 * WHERE IT COMES FROM. Bailey picked mood sketch A, "The Courtesy", on
 * 2026-09-24 (`tools/audio/scores/2026-09-21/macalania-a-court-dance.mjs`,
 * `docs/audio/sketches/2026-09-21/macalania-a-court-dance.mp3`). This is that
 * sketch grown into a shipped cue: the same dance, the same reed on the theme,
 * the same curdle, the same wrong note — extended from 45 s to the brief's
 * short loop and given the one rise the brief asks for.
 *
 * THE BRIEF (research §9.8; docs/plans/chapter-macalania-review.md §6.3): a
 * short loop, ~2:00, unhurried (120-132 bpm), orchestral and ceremonial, minor
 * with insincere liturgical cadences, a **stated theme** ("Seymour has an
 * argument; the music should have a sentence"), rising once at the summon and
 * returning to composure. Courteous menace: polite, and wrong. Anti-brief: no
 * synth, no gated percussion, no relentless pedal ostinato (the Flux chapter's
 * `boss-seymour` owns those), no heroic brass. The two Seymour cues must part
 * inside two seconds: this one is the same motif earlier and politer — an
 * octave up, on an oboe, over a harpsichord, never an organ.
 *
 * THE MATERIAL is `SEYMOUR` (THEMES.md §3), imported, never retyped, with its
 * published velocity shape (the snap up to the b6 is quieter than the note
 * before it). `SEYMOUR_UNMOORED` is reserved for the Flux cue and not spent.
 *
 * NEVER AN OSTINATO. The dance rests on the last half-bar of every four-bar
 * phrase (a bow: one held chord), thins to half-bars under the strings, and is
 * silent through the curdle and the rise. The slither is a written line.
 *
 * Form (64 bars, 256 beats, 121.9 s; loop 16 -> 256):
 *   bars  1- 4  intro      harpsichord and pizzicato alone: the dance
 *   bars  5-12  A          the theme's eight-bar period on the oboe  <- loop start
 *   bars 13-20  A'         violins take it; the mirror in the cellos
 *   bars 21-28  B          the explanation: the bow on harpsichord, the oboe finishes it
 *   bars 29-36  curdle     the decline that refuses to stop, violins then clarinet
 *   bars 37-40  interlude  the dance again, as if nothing had happened
 *   bars 41-52  the rise   the summon: tutti, a fourth step up the sequence, a bell,
 *                          then a plagal amen that resolves to the wrong chord
 *   bars 53-60  composure  the sentence, quiet, in the quartet and then the oboe
 *   bars 61-64  turn       the dance alone, with one wrong note held
 */

import {
  arpLine,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  motif,
  tracker,
  transposeNotes,
  type Note,
  type Track,
} from '../score.ts';
import { SEYMOUR, SEYMOUR_MIRROR, SEYMOUR_SEQUENCE } from './themes.ts';

const BAR = 4;
const HALF = 2;
const A = 16;
const A2 = 48;
const B = 80;
const CURDLE = 112;
const INTERLUDE = 144;
const RISE = 160;
const CLIMAX = 192;
const AMEN = 200;
const COMPOSURE = 208;
const TURN = 240;
const LENGTH = 256;

// --- harmony: half-bar changes throughout, SEYMOUR_CHORDS' own rate --------

const DANCE_CHORDS = ['C#m', 'C#m', 'Amaj7', 'Amaj7', 'C#m', 'C#m', 'G#7', 'G#7'];
/** i - bVI - #iv dim7 - V, the cell's own progression, at a given step. */
const CELL_HOME = ['C#m', 'Amaj7', 'Gdim7', 'G#7'];
const CELL_E = ['Em', 'Cmaj7', 'A#dim7', 'B7'];
const CELL_G = ['Gm', 'D#maj7', 'C#dim7', 'D7'];
const CELL_BB = ['A#m', 'F#maj7', 'Edim7', 'F7'];
const CELL_FS = ['F#m', 'Dmaj7', 'Cdim7', 'C#7'];
const PERIOD = [...CELL_HOME, ...CELL_E, ...CELL_G, ...CELL_HOME];

const CHORDS: string[] = [
  ...DANCE_CHORDS, // intro
  ...PERIOD, // A
  ...PERIOD, // A'
  ...CELL_FS, ...CELL_HOME, ...CELL_FS, ...CELL_HOME, // B
  // the curdle: roots walk down by semitone, a diminished seventh every other chord
  'C#m', 'A#dim7', 'Amaj7', 'Adim7', 'G#7', 'Gdim7', 'F#m', 'Fdim7',
  'Em', 'Ddim7', 'C#m', 'G#7', 'Amaj7', 'Gdim7', 'G#7', 'G#7',
  ...DANCE_CHORDS, // interlude
  // the rise: the sequence takes a fourth step instead of going home...
  ...CELL_HOME, ...CELL_E, ...CELL_G, ...CELL_BB,
  ...CELL_HOME, // ...is thrown home, fortissimo, having proved nothing...
  'F#m', 'F#m', 'Amaj7', 'Amaj7', // ...and the amen: iv to the wrong chord, bVI
  ...CELL_HOME, ...CELL_HOME, ...CELL_HOME, ...CELL_HOME, // composure
  ...DANCE_CHORDS, // turn
];

const chordAt = (beat: number): string => CHORDS[Math.floor(beat / HALF)]!;
const inside = (n: Note, from: number, to: number): boolean => n[0] >= from - 1e-9 && n[0] < to - 1e-9;
const between = (notes: Note[], from: number, to: number): Note[] => notes.filter((n) => inside(n, from, to));

/** Stamp a repeating velocity shape onto a line (THEMES.md "Dynamics"). */
const shape = (notes: Note[], velocities: number[]): Note[] =>
  notes.map((n, i): Note => [n[0], n[1], n[2], velocities[i % velocities.length]]);

/** A bell-shaped swell over a span: `low` at the edges, `peak` in the middle. */
function arch(notes: Note[], from: number, to: number, low: number, peak: number): Note[] {
  return notes.map((n): Note => {
    const t = Math.min(1, Math.max(0, (n[0] - from) / (to - from)));
    const v = (low + (peak - low) * Math.sin(Math.PI * t)) * (n[3] ?? 0.8) * 1.25;
    return [n[0], n[1], n[2], Math.min(1, Math.max(0.05, v))];
  });
}

/** `SEYMOUR`'s published velocity shape: the snap up to the b6 is thrown away. */
const BOW = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];
const quieter = (by: number): number[] => BOW.map((v) => v - by);

// --- the dance ---------------------------------------------------------------

/**
 * A pavane figure on harpsichord, four notes to the half-bar. On the last
 * half-bar of every four-bar phrase it stops and bows: one held chord. `thin`
 * keeps only the first half of each bar, so it steps back under a tune.
 */
function dance(from: number, to: number, low: number, peak: number, pattern = [0, 1, 2, 1], thin = false): Note[] {
  const all = arpLine(CHORDS, { pattern, step: 0.5, dur: 0.46, octave: 4, center: 68, barBeats: HALF });
  const figure = between(all, from, to).filter((n) => n[0] % 16 < 14 && (!thin || n[0] % BAR < HALF));
  const bows: Note[] = [];
  for (let at = from + 14; at < to; at += 16) {
    for (const m of chordMidis(chordAt(at), { octave: 4, center: 66 })) bows.push([at, 1.8, m, 0.5]);
  }
  return arch(concatNotes(figure, bows), from, to, low, peak);
}

/** Pizzicato on beats two and four — the bow of the dance, never the downbeat. */
function pizz(from: number, to: number, v: number): Note[] {
  return chordLine(CHORDS, { octave: 3, center: 55, dur: 0.4, barBeats: HALF })
    .map((n): Note => [n[0] + 1, 0.4, n[2], v + (n[0] % BAR === 0 ? 0.04 : -0.03)])
    .filter((n) => inside(n, from, to));
}

// --- the theme -----------------------------------------------------------------

const starts = (at: number, count: number): number[] => Array.from({ length: count }, (_, i) => at + i * 8);

/** The eight-bar period, an octave above `boss-seymour`'s register. */
const period = (at: number, by = 0, roots = SEYMOUR_SEQUENCE): Note[] =>
  shape(transposeNotes(motif(SEYMOUR, starts(at, roots.length), roots), 12), quieter(by));

/** The mirror, in genuine contrary motion under the period. */
const mirror = (at: number, roots: string[], by = 0.1): Note[] =>
  shape(motif(SEYMOUR_MIRROR, starts(at, roots.length), roots), quieter(by));

/** B: the bow (the cell's first three notes) and its decline (the last three). */
const BOW_HEAD = SEYMOUR.slice(0, 3);
const DECLINE_TAIL = SEYMOUR.slice(3);

/** The harpsichord bows; the oboe finishes the sentence for it. */
function explanation(): { harpsichord: Note[]; oboe: Note[]; clarinet: Note[] } {
  const bowAt = [B, B + 16];
  const harpsichord = shape(transposeNotes(motif(BOW_HEAD, bowAt, ['F#3', 'F#3']), 12), [0.66, 0.48, 0.64]);
  const oboe = concatNotes(
    shape(transposeNotes(motif(DECLINE_TAIL, bowAt, ['F#3', 'F#3']), 12), [0.7, 0.64, 0.58]),
    period(B + 24, 0.06, ['C#3']),
  );
  // Between the two bows, the clarinet answers in the mirror, low and unhurried.
  const clarinet = shape(transposeNotes(motif(SEYMOUR_MIRROR, [B + 8], ['C#3']), 12), quieter(0.14));
  return { harpsichord, oboe, clarinet };
}

// --- the curdle ------------------------------------------------------------------

/**
 * The decline will not stop. Violins fall by semitone in half notes for six
 * bars; when they run out of breath the clarinet carries on without them, and
 * the line never lands on the tonic: it stops on D, a note the chord under it
 * does not own, and the dance simply resumes over it.
 */
const SLITHER_STRINGS = `
  E5:2 D#5 | D5 C#5 | C5 B4 | A#4 A4 | G#4 G4 | F#4 F4 |
`;
const SLITHER_CLARINET = `E4:2 D#4 | D4:4 |`;

// --- the rise --------------------------------------------------------------------

/** Four steps up in minor thirds — a fourth step the period never takes — then home. */
const RISE_ROOTS = ['C#3', 'E3', 'G3', 'A#3', 'C#3'];

/** Low brass holding the harmony, bar by bar. Sustained, never a call. */
function brass(): Note[] {
  const out: Note[] = [];
  for (let at = RISE; at < COMPOSURE; at += HALF) {
    const v = at < CLIMAX ? 0.4 + ((at - RISE) / (CLIMAX - RISE)) * 0.16 : at < AMEN ? 0.6 : 0.5;
    const dur = at >= AMEN ? (at % BAR === 0 ? 3.9 : 0) : 1.95;
    if (dur === 0) continue;
    for (const m of chordMidis(chordAt(at), { octave: 3, center: 52 })) out.push([at, dur, m, v]);
  }
  return out;
}

/** The amen in the strings: iv, then the chord it should not have gone to. */
const amen = (): Note[] =>
  concatNotes(
    chordMidis('F#m', { octave: 4, center: 64 }).map((m): Note => [AMEN, 3.9, m, 0.7]),
    chordMidis('Amaj7', { octave: 4, center: 64 }).map((m): Note => [AMEN + 4, 3.9, m, 0.6]),
  );

/** A temple bell at each step of the rise. Struck once each, never rung. */
const bell = (): Note[] =>
  RISE_ROOTS.map((root, i): Note => [RISE + i * 8, 6, transposeNotes([[0, 1, root]], 24)[0]![2], 0.34 + i * 0.04]);

function timpani(): Note[] {
  const roll = Array.from({ length: 16 }, (_, s): Note => [CLIMAX - 4 + s * 0.25, 0.3, 'G#2', 0.28 + s * 0.028]);
  const strokes: Note[] = [
    [A, 2, 'C#2', 0.48],
    [B, 2, 'F#2', 0.4],
    [CURDLE, 3, 'C#2', 0.54],
    [RISE, 2, 'C#2', 0.5],
    [RISE + 16, 2, 'G2', 0.52],
    [CLIMAX, 3, 'C#2', 0.72],
    [AMEN, 3, 'F#2', 0.58],
    [COMPOSURE, 2, 'C#2', 0.38],
    [TURN, 3, 'C#2', 0.3],
  ];
  return concatNotes(strokes, roll);
}

// --- the floor -------------------------------------------------------------------

/** How hard the floor leans, by section: it swells only for the rise. */
function floorLevel(beat: number): number {
  if (beat >= RISE && beat < COMPOSURE) return 1.14 + (beat >= CLIMAX ? 0.08 : 0);
  if (beat >= CURDLE && beat < INTERLUDE) return 0.9;
  if (beat >= COMPOSURE || (beat >= INTERLUDE && beat < RISE)) return 0.84;
  return beat >= A2 ? 1 : 0.94;
}

/** One root per half-bar, the downbeat heavier; out for the intro and the turn. */
const basses = (): Note[] =>
  chordRoots(CHORDS, 2)
    .map((m, i): Note => [i * HALF, 1.85, m, (i % 2 === 0 ? 0.58 : 0.44) * floorLevel(i * HALF)])
    .filter((n) => n[0] >= A && n[0] < TURN);

// --- assembly --------------------------------------------------------------------

const X = explanation();

const harpsichordNotes = concatNotes(
  dance(0, A, 0.5, 0.7),
  dance(A, A2, 0.46, 0.64, [0, 2, 1, 2]),
  dance(A2, B, 0.4, 0.54, [0, 1, 2, 1], true),
  X.harpsichord,
  dance(INTERLUDE, RISE, 0.44, 0.6),
  dance(COMPOSURE, TURN, 0.36, 0.5),
  dance(TURN, LENGTH, 0.44, 0.62),
);

const pizzNotes = concatNotes(
  pizz(0, CURDLE, 0.5),
  pizz(INTERLUDE, RISE, 0.46),
  pizz(COMPOSURE, LENGTH, 0.42),
);

const oboeNotes = concatNotes(
  period(A, 0.08),
  X.oboe,
  shape(transposeNotes(motif(SEYMOUR, starts(RISE, 4), RISE_ROOTS.slice(0, 4)), 12), BOW.map((v) => v + 0.04)),
  period(COMPOSURE + 16, 0.16, ['C#3', 'C#3']),
);

const violinNotes = concatNotes(
  period(A2, 0.02),
  arch(tracker(SLITHER_STRINGS, { start: CURDLE, gate: 0.99, velocity: 0.62, checkBars: BAR }), CURDLE, CURDLE + 24, 0.5, 0.74),
  shape(transposeNotes(motif(SEYMOUR, starts(RISE, 5), RISE_ROOTS), 12), BOW.map((v) => v + 0.08)),
  shape(transposeNotes(motif(SEYMOUR, [CLIMAX], ['C#3']), 24), BOW.map((v) => v + 0.06)),
  amen(),
);

const clarinetNotes = concatNotes(
  X.clarinet,
  tracker(SLITHER_CLARINET, { start: CURDLE + 24, gate: 1, velocity: 0.56, checkBars: BAR }).map(
    (n, i): Note => [n[0], n[1], n[2], [0.6, 0.54, 0.46][i] ?? 0.5],
  ),
  // The one wrong note: the #4 held under the final tonic, not written into it.
  [[TURN + 2, 6, 'G3', 0.34]],
);

const celloNotes = concatNotes(
  mirror(A2, SEYMOUR_SEQUENCE, 0.12),
  mirror(CURDLE, ['C#3', 'C3', 'B2']),
  mirror(RISE, RISE_ROOTS, 0.02),
);

export const bossSeymourMacalaniaTrack: Track = {
  name: 'boss-seymour-macalania',
  bpm: 126,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.84, damp: 0.32, width: 0.95, preDelay: 0.022 },
    delay: { timeBeats: 0.75, feedback: 0.18, damp: 2400 },
  },
  channels: [
    { name: 'harpsichord (the dance)', instrument: 'harpsichord', volume: 0.72, pan: -0.2, notes: harpsichordNotes, fx: { reverb: 0.26 }, perform: { timingJitterMs: 7 } },
    { name: 'pizzicato', instrument: 'pluck', volume: 0.5, pan: 0.15, notes: pizzNotes, fx: { reverb: 0.2 } },
    { name: 'oboe (the theme)', instrument: 'oboe', volume: 0.86, pan: -0.1, notes: oboeNotes, fx: { reverb: 0.3 }, perform: { timingJitterMs: 10 } },
    { name: 'violins (the answer, the slither, the rise)', instrument: 'strings', volume: 0.74, pan: 0.05, notes: violinNotes, fx: { reverb: 0.32 }, perform: { timingJitterMs: 16 } },
    { name: 'quartet (composure)', instrument: 'string-quartet', volume: 0.66, pan: 0.1, notes: period(COMPOSURE, 0.14, ['C#3', 'C#3']), fx: { reverb: 0.3 }, perform: { timingJitterMs: 14 } },
    { name: 'cellos (the mirror)', instrument: 'strings-low', volume: 0.6, pan: -0.25, notes: celloNotes, fx: { reverb: 0.3 }, perform: { timingJitterMs: 15 } },
    { name: 'clarinet (the answer, the wrong note)', instrument: 'clarinet', volume: 0.58, pan: 0.2, notes: clarinetNotes, fx: { reverb: 0.36 } },
    { name: 'low brass (the rise)', instrument: 'brass', volume: 0.56, pan: -0.15, notes: brass(), fx: { reverb: 0.3 } },
    { name: 'temple bell', instrument: 'bell', volume: 0.4, pan: 0.25, notes: bell(), fx: { reverb: 0.42 } },
    { name: 'basses', instrument: 'strings-low', volume: 0.5, pan: -0.1, transpose: -12, notes: basses(), fx: { reverb: 0.22 }, perform: { timingJitterMs: 15 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.45, pan: 0.05, notes: timpani(), fx: { reverb: 0.3 } },
  ],
};

export default bossSeymourMacalaniaTrack;
