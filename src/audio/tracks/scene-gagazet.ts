/**
 * "Where the Horns Fell Silent" — Mt. Gagazet.
 *
 * ORIGINAL COMPOSITION. B Aeolian, 4/4, 72 bpm. Wind, one horn, a low choir
 * of open fifths with no third in it anywhere, and thirty seconds in which
 * nothing happens on purpose.
 *
 * THEMES (docs/audio/THEMES.md cue map, row 10)
 *   FATHER_STRAIGHTENED — which IS HYMN_HEAD — on one unaccompanied horn, at
 *   the very top, four notes and then nothing. The father's riff is the
 *   prayer with every note shoved off the beat; push them back and it turns
 *   into the prayer again. The cue does exactly that and says nothing about
 *   it.
 *   FAREWELL_RISE on the cellos, once, alone, and then THIRTY SECONDS OF ONE
 *   DRONE before anything else is allowed to happen. Silence is the
 *   instrument here; the arrangement's job is to stay out of its way.
 *
 * THE ONE EMOTION: the mountain does not care.
 *
 * Harmonic note: this cue used to borrow a raised 6th for warmth. It does not
 * any more — the raised 6th is reserved for the FFX-2 material (THEMES.md
 * §Harmonic language), and Spira is Aeolian. The warmth here comes from bVI
 * and bVII, and from nothing else.
 *
 * Form (31 bars, 124 beats, 103.3 s):
 *   bar   1     horn     beats   0-  4  four notes, alone
 *   bar   2     silence  beats   4-  8  nothing at all
 *   bar   3     cello    beats   8- 12  FAREWELL_RISE, alone
 *   bars  4-12  drone    beats  12- 48  one pitch, thirty seconds, wind over it
 *   bars 13-20  A        beats  48- 80  low choir in fifths, horn calls    <- loop start
 *   bars 21-28  B        beats  80-112  the horn answered at the fifth; thunder
 *   bars 29-31  outro    beats 112-124  back to the drone and the wind
 */

import {
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { FAREWELL_RISE, FATHER_STRAIGHTENED } from './themes.ts';

const BAR = 4;
const DRONE = 12;
const A = 48;
const B = 80;
const OUTRO = 112;
const LENGTH = 124;

const A_CHORDS = ['Bm', 'Bm', 'G', 'A', 'Bm', 'D', 'Em', 'A'];
const B_CHORDS = ['G', 'A', 'Bm', 'D', 'G', 'A', 'Em', 'Bm'];
const OUTRO_CHORDS = ['Em', 'Bm', 'Bm'];


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

/** Root and fifth only. The mountain does not resolve; it endures. */
function fifths(chords: string[]): string[] {
  return chords.map((c) => `${/^[A-Ga-g][#b]*/.exec(c)![0]}5`);
}

// ---------------------------------------------------------------------------
// Four notes, then nothing
// ---------------------------------------------------------------------------

/**
 * The riff, straightened, on one horn. Velocities fall across the four notes
 * — a player running out of breath on a cold mountain, not a sampler firing
 * four identical triggers.
 */
function hornHead(): Note[] {
  const levels = [0.54, 0.46, 0.5, 0.58];
  return concatNotes(
    motif(FATHER_STRAIGHTENED, [0], ['B3']).map((n, i): Note => [n[0], n[1] * 1.4, n[2], levels[i]!]),
    // and once more at the top of B, an octave down, so the loop remembers it
    motif(FATHER_STRAIGHTENED, [B], ['B2']).map((n, i): Note => [n[0], n[1] * 1.6, n[2], levels[i]! - 0.08]),
  );
}

/** FAREWELL's first four degrees, on the cellos, once. The only melody in the cue. */
function celloRise(): Note[] {
  const levels = [0.4, 0.46, 0.5, 0.44];
  return motif(FAREWELL_RISE, [8], ['B2']).map((n, i): Note => [n[0], n[1] * 1.5, n[2], levels[i]!]);
}

// ---------------------------------------------------------------------------
// The drone — thirty seconds of one pitch
// ---------------------------------------------------------------------------

function droneLine(): Note[] {
  return concatNotes(
    // Two overlapping bows so the drone breathes without ever restriking.
    [[DRONE, 20, 'B1', 0.3] as Note],
    [[DRONE + 18, 18, 'B1', 0.26] as Note],
    [[DRONE + 8, 28, 'B2', 0.22] as Note],
    chordRoots([...A_CHORDS, ...B_CHORDS], 1).map((midi, bar): Note => {
      const at = A + bar * BAR;
      return [at, 3.85, midi, at < B ? 0.3 : 0.38];
    }),
    chordRoots(OUTRO_CHORDS, 1).map((midi, bar): Note => [OUTRO + bar * BAR, 3.85, midi, 0.26]),
  );
}

// ---------------------------------------------------------------------------
// The mountain
// ---------------------------------------------------------------------------

/** A low choir on open fifths. No third is sung anywhere in this cue. */
function choirFifths(): Note[] {
  return concatNotes(
    chordLine(fifths(A_CHORDS), { start: A, octave: 2, center: 50, velocity: 0.3, dur: 3.85, roll: 0.14 }),
    chordLine(fifths(B_CHORDS), { start: B, octave: 2, center: 52, velocity: 0.44, dur: 3.85, roll: 0.1 }),
    chordLine(fifths(OUTRO_CHORDS), { start: OUTRO, octave: 2, center: 50, velocity: 0.24, dur: 3.85, roll: 0.18 }),
    // one thin upper line, entering only for the second half
    chordLine(fifths(B_CHORDS.slice(4)), { start: B + 16, octave: 3, center: 62, velocity: 0.28, dur: 3.8, roll: 0.2 }),
  );
}

/** Horn calls in bare fourths and fifths, two bars apart, never hurried. */
const CALL_1 = 'B3:1.5 F#4:0.5 B4:2 | -:4';
const CALL_2 = 'A3:1.5 E4:0.5 A4:2  | -:4';
const CALL_3 = 'D4:1.5 A4:0.5 D5:2  | -:2 G4:2';
const CALL_4 = 'E4:1.5 B4:0.5 E5:2  | B3:2 F#4:2';
const CALL_ECHO = 'F#4:2 B4:2';

function hornCalls(): Note[] {
  return concatNotes(
    tracker(CALL_1, { start: A + 8, velocity: 0.44, gate: 0.98, checkBars: BAR }),
    tracker(CALL_2, { start: A + 24, velocity: 0.4, gate: 0.98, checkBars: BAR }),
    tracker(CALL_3, { start: B + 8, velocity: 0.56, gate: 0.98, checkBars: BAR }),
    tracker(CALL_4, { start: B + 24, velocity: 0.62, gate: 0.98, checkBars: BAR }),
    tracker(CALL_ECHO, { start: OUTRO, velocity: 0.26, gate: 0.98 }),
  );
}

/** Distant thunder in the peaks: a roll, its echo, and a fifth above it when it is close. */
function thunder(chords: string[], bars: number[], start: number, level: number, big: boolean): Note[] {
  const roots = chordRoots(chords, 1);
  const notes: Note[] = [];
  for (const bar of bars) {
    const at = start + bar * BAR;
    const root = roots[bar]!;
    notes.push([at, 1.7, root, level]);
    notes.push([at + 1.6, 0.9, root, level * 0.5]);
    if (big) notes.push([at + 2.6, 0.9, root + 7, level * 0.6]);
  }
  return notes;
}

function taikoLine(): Note[] {
  return concatNotes(
    [[DRONE + 12, 1.6, 'B1', 0.2] as Note],
    thunder(A_CHORDS, [0, 4], A, 0.24, false),
    thunder(B_CHORDS, [0, 2, 4, 5, 6], B, 0.5, true),
    thunder(OUTRO_CHORDS, [0], OUTRO, 0.2, false),
  );
}

/** Wind. It is the one thing that never stops, and it never gets loud either. */
function wind(): Note[] {
  return concatNotes(
    drumLine('x...............', { start: 0, pitch: 'C3', velocity: 0.1, times: 3 }),
    drumLine('x.......x.......', { start: DRONE, pitch: 'C3', velocity: 0.12, times: 9 }),
    drumLine('x...x...x...x...', { start: A, pitch: 'C3', velocity: 0.17, times: 8 }),
    drumLine('x.x.x.x.x.x.x.x.', { start: B, pitch: 'C3', velocity: 0.24, times: 8 }),
    drumLine('x...x...x...x...', { start: OUTRO, pitch: 'C3', velocity: 0.14, times: 3 }),
  );
}

/** Two harp gestures in the whole cue. Both are the same four notes of the rise. */
function harpLine(): Note[] {
  return concatNotes(
    motif(FAREWELL_RISE, [B + 4], ['B4']).map((n): Note => [n[0], n[1] * 2, n[2], 0.26]),
    motif(FAREWELL_RISE, [OUTRO + 4], ['B3']).map((n): Note => [n[0], n[1] * 2, n[2], 0.18]),
  );
}

function bellLine(): Note[] {
  return [
    [DRONE, 5, 'B2', 0.34],
    [B, 5, 'F#3', 0.32],
  ];
}

function lowStrings(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 2, center: 47, velocity: 0.28, dur: 3.85 }),
    chordLine(B_CHORDS, { start: B, octave: 2, center: 49, velocity: 0.42, dur: 3.85 }),
    chordLine(OUTRO_CHORDS, { start: OUTRO, octave: 2, center: 47, velocity: 0.22, dur: 3.85 }),
  );
}

export const gagazetTrack: Track = {
  name: 'scene-gagazet',
  bpm: 72,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 6,
  fx: {
    reverb: { room: 0.9, damp: 0.3, width: 1, preDelay: 0.04 },
    delay: { timeBeats: 1, feedback: 0.3, damp: 2400 },
  },
  channels: [
    { name: 'horn', instrument: 'brass', volume: 0.62, pan: -0.2, notes: concatNotes(hornHead(), hornCalls()), fx: { reverb: 0.4, delay: 0.16 } },
    { name: 'cello rise', instrument: 'strings-low', volume: 0.7, pan: 0.1, notes: celloRise(), fx: { reverb: 0.38 } },
    { name: 'drone', instrument: 'strings-low', volume: 0.66, pan: 0, notes: breathe(droneLine(), 26, 0.14), fx: { reverb: 0.34 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.5, pan: -0.12, notes: breathe(lowStrings(), 24, 0.14), fx: { reverb: 0.34 } },
    { name: 'choir', instrument: 'choir', volume: 0.66, pan: 0.12, notes: breathe(choirFifths(), 32, 0.16), fx: { reverb: 0.6 } },
    { name: 'harp', instrument: 'harp', volume: 0.42, pan: -0.3, notes: harpLine(), fx: { reverb: 0.4, delay: 0.24 } },
    { name: 'taiko', instrument: 'taiko', volume: 0.6, pan: 0.16, notes: taikoLine(), fx: { reverb: 0.36 } },
    { name: 'bell', instrument: 'bell', volume: 0.36, pan: 0.32, notes: bellLine(), fx: { reverb: 0.6, delay: 0.3 } },
    { name: 'wind', instrument: 'shaker', volume: 0.3, pan: 0.3, notes: breathe(wind(), 21, 0.3, 0.16), fx: { reverb: 0.2 } },
  ],
};

export default gagazetTrack;
