/**
 * "Bright After the Storm" — the victory fanfare and the results loop.
 *
 * ORIGINAL COMPOSITION. C major, 4/4, 120 bpm. Four bars of brass, then eight
 * bars of rest played four times over, each time in a different light.
 *
 * THEMES (docs/audio/THEMES.md §6 and the cue map, row 15)
 *   VICTORY_FANFARE, one shot, built to be unlike the famous one on purpose:
 *   it opens on its LONGEST note instead of three short ones, it FALLS and
 *   then arches by step instead of rising through an arpeggio, and it closes
 *   PLAGAL — F to C, the melody sighing 4 to 3, which is the score's AMEN in
 *   the major. Winning is meant to read as relief, not as a trophy.
 *   VICTORY_LOOP, the relaxed eight bars after it. No dominant anywhere: a
 *   results screen should feel like rest, not like arrival.
 *   FAREWELL's incipit in the major (PYREFLY_RISE_MAJOR) on solo flute across
 *   bars 7-8 of the loop, twice in the cue and unremarked. Nobody will
 *   consciously notice; everybody will feel that the victory belongs to the
 *   same story as the goodbye.
 *
 * THE ONE EMOTION: relief, not triumph.
 *
 * Performance rules applied: the fanfare's closing F4 leans on the E4 it
 * falls to and is LOUDER than it; the loop's four passes are an arch of their
 * own (0.62 / 0.70 / 0.80 / 0.56) so the last pass hands the loop back to the
 * first without a step; nothing here is at constant velocity and nothing here
 * is loud.
 *
 * Form (36 bars, 144 beats, 72.1 s through the map):
 *   bar   1- 4  fanfare  beats   0- 16  brass, horns, timpani, one cymbal
 *   bars  5-12  pass 1   beats  16- 48  pizzicato tune, piano under it       <- loop start
 *   bars 13-20  pass 2   beats  48- 80  piano takes the tune, harp, flute tag
 *   bars 21-28  pass 3   beats  80-112  strings an octave up, horns, light kit
 *   bars 29-36  pass 4   beats 112-144  back to pizzicato and air; flute tag closes
 */

import {
  aTempo,
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  rit,
  tempoMap,
  toMidi,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  PYREFLY_RISE_MAJOR,
  VICTORY_FANFARE,
  VICTORY_FANFARE_CHORDS,
  VICTORY_LOOP,
  VICTORY_LOOP_CHORDS,
} from './themes.ts';

const BAR = 4;
const R1 = 16;
const R2 = 48;
const R3 = 80;
const R4 = 112;
const LENGTH = 144;
const PASSES = [R1, R2, R3, R4];

// ---------------------------------------------------------------------------
// The fanfare
// ---------------------------------------------------------------------------

/**
 * Four bars and not a beat more. The last two notes are the amen: F4 over the
 * IV falling to E4 over the tonic, and the F4 — the leaning note — is the
 * louder of the pair. Machines always invert that, and inverting it is the
 * loudest tell of a synthetic performance.
 */
function fanfare(velocity: number, transpose = 0): Note[] {
  const arch = [0.84, 0.88, 0.92, 0.86];
  return tracker(VICTORY_FANFARE, { transpose, gate: 0.98, checkBars: BAR }).map((n): Note => {
    const bar = Math.floor(n[0] / BAR);
    let v = (arch[Math.min(bar, 3)] ?? 0.85) * velocity;
    if (n[0] === 12) v += 0.06; // the leaning F4
    if (n[0] === 14) v -= 0.06; // its resolution
    return [n[0], n[1], n[2], Math.min(1, v)];
  });
}

/**
 * The fanfare's strings, phrased.
 *
 * They used to be twenty-four notes at 0.52 — every one of them, for the whole
 * fanfare — which is the one thing THEMES.md bans outright: "Never render a
 * phrase at constant velocity, except the two places this document names",
 * and neither of those is here. Nothing about the notes changes; the fanfare
 * stays ORIGINAL in rhythm and contour because this function never touches
 * either. What changes is how they are played:
 *
 *   the arch     the brass above them moves 0.84 / 0.88 / 0.92 / 0.86 across
 *                the four bars, so the strings follow it at their own level
 *                and the two read as one gesture instead of a tune over a pad.
 *   the amen     bar 4 is the plagal cadence, F to C, and the melody's F4
 *                leans on the E4 it falls to. The CHORD does the same: 0.56
 *                under the leaning note, 0.46 under its resolution. A cadence
 *                whose harmony crescendos into the tonic is a trophy; this cue
 *                is supposed to be relief.
 *   the tilt     +/-0.03 across each chord by pitch, so the top voice carries
 *                and even a single struck chord is not four identical notes.
 *
 * The mean lands on 0.51, within a hair of the 0.52 it replaces, so the
 * balance of the mix is unchanged and only the shape is new.
 */
const FANFARE_HALF_BARS = [0.44, 0.47, 0.5, 0.53, 0.57, 0.55, 0.56, 0.46];

function fanfareHarmony(): Note[] {
  const notes = chordLine(VICTORY_FANFARE_CHORDS, {
    barBeats: 2, octave: 3, center: 60, velocity: 0.52, dur: 1.9, roll: 0.05,
  });
  // `roll` nudges each member of a chord a little later, so a note is grouped
  // by the half bar it was written in rather than by its exact start.
  const halfOf = (n: Note): number =>
    Math.min(FANFARE_HALF_BARS.length - 1, Math.floor(n[0] / 2 + 1e-6));
  const members = new Map<number, number[]>();
  for (const n of notes) {
    const half = halfOf(n);
    if (!members.has(half)) members.set(half, []);
    members.get(half)!.push(toMidi(n[2]));
  }
  return notes.map((n): Note => {
    const half = halfOf(n);
    const chord = members.get(half)!;
    const low = Math.min(...chord);
    const span = Math.max(...chord) - low;
    const tilt = span === 0 ? 0 : 0.03 * ((2 * (toMidi(n[2]) - low)) / span - 1);
    return [n[0], n[1], n[2], Math.min(1, FANFARE_HALF_BARS[half]! + tilt)];
  });
}

function fanfareTimpani(): Note[] {
  return concatNotes(
    [[0, 2.6, 'C2', 0.6] as Note],
    [[4, 1.6, 'F2', 0.44] as Note],
    [[8, 1.6, 'A2', 0.4] as Note],
    drumLine('x.x.X...', { start: 12, step: 0.5, pitch: 'F2', velocity: 0.34, accentVelocity: 0.5 }),
    [[14, 2.4, 'C2', 0.46] as Note],
  );
}

// ---------------------------------------------------------------------------
// The results loop
// ---------------------------------------------------------------------------


/**
 * Nothing in this score holds one velocity for thirty seconds. A drone, a
 * shaker or a held pad written at a fixed level is the most machine-like
 * thing a mock-up can do, and it is also the easiest thing to fix: a slow
 * sine and a deterministic per-note wobble, both small enough that nobody
 * hears the device and everybody hears that the sound is alive.
 */
function breathe(notes: Note[], periodBeats: number, depth: number, wobble = 0): Note[] {
  return notes.map((n, i): Note => {
    const swell = 1 + depth * Math.sin((2 * Math.PI * n[0]) / periodBeats);
    const jitter = wobble === 0 ? 1 : 1 + wobble * Math.sin(i * 2.399963);
    return [n[0], n[1], n[2], Math.max(0.02, Math.min(1, (n[3] ?? 0.8) * swell * jitter))];
  });
}

/** Each pass has its own level; together they are one long arch back into the loop. */
const PASS_LEVEL = [0.62, 0.7, 0.8, 0.56];

/** A gentle per-bar shape inside a pass, so no eight bars are ever flat. */
const BAR_SHAPE = [1, 1.04, 0.98, 1.06, 1, 1.05, 0.96, 0.92];

function loopTune(pass: number, transpose = 0, trim = 1): Note[] {
  const start = PASSES[pass]!;
  return tracker(VICTORY_LOOP, { start, transpose, gate: 0.99, checkBars: BAR }).map((n): Note => {
    const bar = Math.floor((n[0] - start) / BAR);
    return [n[0], n[1], n[2], Math.min(1, PASS_LEVEL[pass]! * (BAR_SHAPE[bar] ?? 1) * trim)];
  });
}

/** The tag: FAREWELL's four degrees in the major, one octave above the tune. */
function fluteTag(): Note[] {
  return concatNotes(
    ...[R2, R4].map((start, i) =>
      motif(PYREFLY_RISE_MAJOR, [start + 24], ['C5']).map(
        (n): Note => [n[0], n[1] * 0.99, n[2], (i === 0 ? 0.44 : 0.38) + (n[0] > start + 26 ? 0.04 : 0)],
      ),
    ),
  );
}

function pizzTune(): Note[] {
  return concatNotes(loopTune(0), loopTune(3, 0, 0.95));
}

function pianoTune(): Note[] {
  return loopTune(1);
}

function stringTune(): Note[] {
  return loopTune(2, 12, 0.9);
}

/** Piano comps in every pass but the one where it has the tune. */
function pianoComp(): Note[] {
  return concatNotes(
    arpLine(VICTORY_LOOP_CHORDS, {
      start: R1, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.46, octave: 3, center: 60, velocity: 0.34,
    }),
    arpLine(VICTORY_LOOP_CHORDS, {
      start: R3, pattern: [0, 2, 1, 2], step: 0.5, dur: 0.46, octave: 3, center: 62, velocity: 0.42,
    }),
    arpLine(VICTORY_LOOP_CHORDS, {
      start: R4, pattern: [0, 1, 2, 1], step: 1, dur: 0.9, octave: 3, center: 60, velocity: 0.26,
    }),
  );
}

/** Harp: a rolled chord a bar, never a run. It is here for the shimmer, not the notes. */
function harpBed(): Note[] {
  return concatNotes(
    // A rolled chord struck at exactly one level, eight bars running, is a
    // sampler playing a chord rather than a harpist playing a phrase: the
    // eight bars of each pass breathe once, gently.
    breathe(chordLine(VICTORY_LOOP_CHORDS, {
      start: R2, octave: 4, center: 72, velocity: 0.3, dur: 3.6, roll: 0.12,
    }), 16, 0.16, 0.05),
    breathe(chordLine(VICTORY_LOOP_CHORDS, {
      start: R4, octave: 4, center: 72, velocity: 0.22, dur: 3.6, roll: 0.16,
    }), 16, 0.16, 0.05),
  );
}

function stringBed(): Note[] {
  return concatNotes(
    chordLine(VICTORY_LOOP_CHORDS, { start: R2, octave: 3, center: 64, velocity: 0.24, dur: 3.8 }),
    chordLine(VICTORY_LOOP_CHORDS, { start: R3, octave: 3, center: 64, velocity: 0.36, dur: 3.8 }),
    chordLine(VICTORY_LOOP_CHORDS, { start: R4, octave: 3, center: 64, velocity: 0.18, dur: 3.8 }),
  );
}

/** Horns hold long notes under the third pass and nothing else. Warmth, not brass. */
function hornPad(): Note[] {
  return chordLine(VICTORY_LOOP_CHORDS.filter((_, i) => i % 2 === 0), {
    start: R3, barBeats: 8, octave: 3, center: 55, velocity: 0.34, dur: 7.6, roll: 0.1,
  });
}

/** Cellos walk the roots, one or two a bar. The bass of a results screen should stroll. */
function cellos(): Note[] {
  const notes: Note[] = [];
  for (const [start, level] of [[R1, 0.34], [R2, 0.4], [R3, 0.5], [R4, 0.3]] as Array<[number, number]>) {
    chordRoots(VICTORY_LOOP_CHORDS, 2).forEach((midi, bar) => {
      const at = start + bar * BAR;
      notes.push([at, 2.6, midi, level]);
      if (bar % 2 === 1) notes.push([at + 3, 0.9, midi + 7, level * 0.7]);
    });
  }
  return notes;
}

function shakerLine(): Note[] {
  return concatNotes(
    ...PASSES.map((start, i) =>
      drumLine('x..x..x.x..x..x.', {
        start, step: 0.25, pitch: 'C3', velocity: [0.16, 0.2, 0.26, 0.14][i]!, times: 8,
      }),
    ),
  );
}

/**
 * The only kit in the cue, and only in the fullest pass: kick on 1 and 3, hats
 * on eighths.
 *
 * Sixteen strokes at 0.42 was the last constant-velocity channel in the cue,
 * and a bass drum is the worst place to leave one: it is the one instrument a
 * listener can count, so an identical stroke every two beats reads as a click
 * track even at this volume. The bar is a real bar now — the downbeat carries
 * and the third beat answers it a little softer — with the same slow swell
 * every other bed in the cue breathes with.
 */
function lightKit(): Note[] {
  const strokes = drumLine('x.......x.......', {
    start: R3, step: 0.25, pitch: 'C1', velocity: 0.42, times: 8,
  }).map((n): Note => [n[0], n[1], n[2], (n[0] - R3) % 4 < 1e-6 ? 0.45 : 0.37]);
  return breathe(strokes, 16, 0.1, 0.05);
}

function hats(): Note[] {
  return drumLine('x.x.x.x.x.x.x.x.', { start: R3, step: 0.25, pitch: 'F#3', velocity: 0.24, times: 8 });
}

function cymbal(): Note[] {
  return [
    [0, 3, 'C5', 0.5],
    [R3, 2, 'C5', 0.34],
  ];
}

/**
 * One gesture, and it is the whole reading of the cue.
 *
 * THEMES.md: the fanfare "closes PLAGAL — F to C ... so the release reads as
 * relief rather than triumph", and the one emotion is "relief, not triumph".
 * A fanfare that holds 120 bpm straight through its own amen and hands
 * straight over to a groove has not relaxed; it has stopped. So the last bar
 * broadens — 120 to 104 across beats 12-16, 13%, inside THEMES.md's ceiling —
 * and the results loop then starts dead in tempo.
 *
 * `aTempo(16)` is also what keeps the loop honest: beat 16 is `loop.start` and
 * there is no mark after it, so the tempo at `loop.end` (144) is the tempo the
 * loop restarts on and the wrap cannot lurch.
 */
const TEMPO = tempoMap(
  rit(12, 16, 104, 'rit. — the plagal amen'),
  aTempo(16),
);

/**
 * HUMANISATION, to the bible's own table (THEMES.md §Humanisation: section
 * strings and choir 14-18 ms, solo piano 6-9, rock kit 4-6).
 *
 * The presets this cue plays sit outside that: `piano` is 3 ms, `strings` 22
 * and `strings-low` 24. They are shared with every other cue and are not this
 * arranger's to move, so the channels say how they want to be played instead
 * — PIPELINE.md, "Per-channel performance overrides". Each figure lands
 * mid-band: 7 ms for the piano, 16.1 for the sections.
 */
const PIANO_HANDS = { timingJitterMs: 7 } as const;
const SECTION = { humanise: 0.73 } as const;
const SECTION_LOW = { humanise: 0.67 } as const;

export const victoryTrack: Track = {
  name: 'victory-ffx',
  bpm: 120,
  tempo: TEMPO,
  timeSig: [4, 4],
  loop: { start: R1, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.56, damp: 0.4, width: 0.9, preDelay: 0.014 },
    delay: { timeBeats: 0.5, feedback: 0.18, damp: 3000 },
  },
  channels: [
    { name: 'fanfare brass', instrument: 'brass', volume: 0.95, pan: -0.08, notes: fanfare(1), fx: { reverb: 0.28 } },
    {
      name: 'fanfare trumpets',
      instrument: 'brass-stab',
      volume: 0.5,
      pan: 0.12,
      notes: fanfare(0.8, 12).filter((n) => n[0] % 4 === 0),
      fx: { reverb: 0.2 },
    },
    { name: 'fanfare strings', instrument: 'strings', volume: 0.5, pan: 0.1, perform: SECTION, notes: fanfareHarmony(), fx: { reverb: 0.3 } },
    { name: 'fanfare timpani', instrument: 'timpani', volume: 0.66, pan: 0, notes: fanfareTimpani(), fx: { reverb: 0.3 } },
    { name: 'cymbal', instrument: 'crash', volume: 0.42, pan: 0.1, notes: cymbal(), fx: { reverb: 0.35 } },
    { name: 'pizz tune', instrument: 'pluck', volume: 0.9, pan: 0.08, notes: pizzTune(), fx: { reverb: 0.26 } },
    { name: 'piano tune', instrument: 'piano', volume: 0.85, pan: -0.06, perform: PIANO_HANDS, notes: pianoTune(), fx: { reverb: 0.3 } },
    { name: 'strings tune', instrument: 'strings', volume: 0.66, pan: 0.14, perform: SECTION, notes: stringTune(), fx: { reverb: 0.32, delay: 0.08 } },
    { name: 'flute tag', instrument: 'flute', volume: 0.6, pan: -0.1, notes: fluteTag(), fx: { reverb: 0.34, delay: 0.16 } },
    { name: 'piano comp', instrument: 'piano', volume: 0.55, pan: -0.14, perform: PIANO_HANDS, notes: pianoComp(), fx: { reverb: 0.26 } },
    { name: 'harp', instrument: 'harp', volume: 0.5, pan: -0.3, notes: harpBed(), fx: { reverb: 0.34, delay: 0.18 } },
    { name: 'string bed', instrument: 'strings', volume: 0.42, pan: 0.2, perform: SECTION, notes: breathe(stringBed(), 24, 0.16), fx: { reverb: 0.38 } },
    { name: 'horns', instrument: 'brass', volume: 0.4, pan: -0.26, notes: breathe(hornPad(), 32, 0.15), fx: { reverb: 0.36 } },
    { name: 'cellos', instrument: 'strings-low', volume: 0.55, pan: 0.16, perform: SECTION_LOW, notes: cellos(), fx: { reverb: 0.3 } },
    { name: 'shaker', instrument: 'shaker', volume: 0.3, pan: 0.28, notes: breathe(shakerLine(), 16, 0.26, 0.14), fx: { reverb: 0.18 } },
    { name: 'kick', instrument: 'kick', volume: 0.5, pan: 0, notes: lightKit() },
    { name: 'hats', instrument: 'hat', volume: 0.3, pan: 0.22, notes: breathe(hats(), 8, 0.2, 0.1) },
  ],
};

export default victoryTrack;
