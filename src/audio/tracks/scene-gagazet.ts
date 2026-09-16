/**
 * "Where the Horns Fell Silent" — Mt. Gagazet scene theme.
 *
 * ORIGINAL COMPOSITION. 72 bpm, B minor (aeolian) coloured by a raised 6th
 * (G#) borrowed from B dorian — the "IV major" (E) chord that carries it is
 * the one splash of warmth in an otherwise cold, open-fifth harmony. Flute
 * breathes the lead over a choir drone built from bare fifths (no third —
 * the mountain doesn't resolve, it just endures); a clan horn call in open
 * 4ths/5ths answers the flute's phrases; taiko rumbles like distant thunder
 * in the peaks; shaker hisses like blown snow.
 *
 * Form (4/4, 28 bars, ~93.3 s):
 *   bars  1- 4  intro    beats   0- 16   wind alone: shaker, a held low
 *                                        strings-low hum, one soft taiko hit
 *   bars  5-12  climb    beats  16- 48   flute enters in 2-bar phrases,      <- loop start
 *                                        answered by the horn call in the
 *                                        2 bars between each phrase
 *   bars 13-20  peak     beats  48- 80   everything present at once: flute
 *                                        soars, horn punctuates, taiko
 *                                        cracks, the flute recalls
 *                                        PYREFLY_RISE once as a hushed memory
 *   bars 21-28  thinning beats  80-112   flute fragments and falls silent,
 *                                        horn echoes once more, drone and
 *                                        wind fade back toward the climb
 * The loop runs 16 -> 112: the intro plays once, then climb/peak/thinning
 * cycle, ending on the tonic bass just as the climb's own opening bar does.
 */

import {
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { cell, PYREFLY_RISE } from './motifs.ts';

const BAR = 4;

const INTRO_CHORDS = ['Bm', 'Bm', 'G', 'A'];
const A_CHORDS = ['Bm', 'A', 'D', 'E', 'Bm', 'G', 'F#m', 'E'];
const B_CHORDS = ['D', 'A', 'E', 'Bm', 'G', 'D', 'E', 'Bm'];
const A2_CHORDS = ['Bm', 'A', 'Bm', 'E', 'Bm', 'A', 'Bm', 'Bm'];

const A_START = 16;
const B_START = 48;
const A2_START = 80;
const LENGTH = 112;

/** Root + fifth only — "B" -> "B5", used for the choir's open-fifth drone. */
function fifths(chords: string[]): string[] {
  return chords.map((c) => `${c.match(/^[A-Ga-g][#b]*/)![0]}5`);
}

// ---------------------------------------------------------------- flute lead

/** Climb, phrase 1 (bars 5-6, Bm/A) — the flute's first question. */
const FLUTE_A1 = '-:1 F#4:1 B4:1 D5:1 | E5:2 D5:1 C#5:1';
/** Climb, phrase 2 (bars 9-10, Bm/G) — answered, it asks again, lower. */
const FLUTE_A2 = 'D5:2 B4:1 A4:1 | G4:1 B4:1 D5:2';

/** Peak, opening rise (bars 13-14, D/A) — the climb's payoff. */
const FLUTE_B1 = 'A4:1 D5:1 F#5:1 A5:1 | B5:2 A5:1 F#5:1';
/** After the PYREFLY_RISE quote settles, one beat of hush before bar 17. */
const FLUTE_B_FILL = '-:1 D5:1 B4:1';
/** Peak, bars 17-20 (G/D/E/Bm) — the highest point of the piece, then landing. */
const FLUTE_B2 = 'G5:1 B5:1 D6:2 | A5:1.5 F#5:0.5 D5:2 | G#5:1 F#5:1 E5:2 | B4:2 D5:2';

/** Thinning, bars 21-24 — fragments, the raised 6th glinting once more. */
const FLUTE_THIN1 = 'F#4:2 -:1 B4:1 | -:2 D5:2 | B4:3 -:1 | -:1 G#4:1 F#4:2';
/** Thinning, bars 27-28 — a last breath on the tonic, held into the loop. */
const FLUTE_THIN2 = 'F#4:4 | B4:4';

function fluteLine(): Note[] {
  return concatNotes(
    // The climb's flute stays hushed (0.46–0.48) so the peak's 0.72–0.74 is a real arrival.
    tracker(FLUTE_A1, { start: A_START, velocity: 0.48, checkBars: BAR }),
    tracker(FLUTE_A2, { start: 32, velocity: 0.46, checkBars: BAR }),
    tracker(FLUTE_B1, { start: B_START, velocity: 0.74, checkBars: BAR }),
    cell(PYREFLY_RISE, B_START + 8, 'B4', 0.62),
    tracker(FLUTE_B_FILL, { start: B_START + 13, velocity: 0.5 }),
    tracker(FLUTE_B2, { start: B_START + 16, velocity: 0.72, checkBars: BAR }),
    tracker(FLUTE_THIN1, { start: A2_START, velocity: 0.5, checkBars: BAR }),
    tracker(FLUTE_THIN2, { start: A2_START + 24, velocity: 0.32, checkBars: BAR }),
  );
}

// -------------------------------------------------------------- clan horn call

/** Answers flute phrase 1: open 5th+octave on D, then open 4th+5th on E. */
const HORN_1 = 'D4:1 A4:1 D5:2 | E4:1 A4:1 B4:2';
/** Answers flute phrase 2: open 5th+octave on F#m, wide open 5ths on E. */
const HORN_2 = 'F#4:1 C#5:1 F#5:2 | B3:1 E4:1 B4:2';
/** Announces the peak, under the flute's opening rise: D then A, both open 5ths. */
const HORN_PEAK = 'D4:1.5 A4:0.5 D5:2 | A3:1.5 E4:0.5 A4:2';
/** A second punctuation as the flute reaches its highest phrase. */
const HORN_MID = 'G4:1 D5:1 G5:2';
/** The horn's own peak, answering the flute's landing. */
const HORN_FINISH = 'E4:1.5 B4:0.5 E5:2 | B3:2 F#4:2';
/** One last distant echo as everything thins out. */
const HORN_ECHO = 'F#4:2 B4:2';

function hornCall(): Note[] {
  return concatNotes(
    tracker(HORN_1, { start: 24, velocity: 0.5, checkBars: BAR }),
    tracker(HORN_2, { start: 40, velocity: 0.55, checkBars: BAR }),
    tracker(HORN_PEAK, { start: B_START, velocity: 0.68, checkBars: BAR }),
    tracker(HORN_MID, { start: B_START + 16, velocity: 0.6 }),
    tracker(HORN_FINISH, { start: B_START + 24, velocity: 0.72, checkBars: BAR }),
    tracker(HORN_ECHO, { start: A2_START, velocity: 0.28 }),
  );
}

// ------------------------------------------------------------------ choir bed

function choirDrone(): Note[] {
  return concatNotes(
    chordLine(fifths(INTRO_CHORDS), { start: 0, octave: 3, center: 59, velocity: 0.24, dur: 3.8, roll: 0.18 }),
    chordLine(fifths(A_CHORDS), { start: A_START, octave: 3, center: 59, velocity: 0.34, dur: 3.85, roll: 0.1 }),
    chordLine(fifths(B_CHORDS), { start: B_START, octave: 3, center: 62, velocity: 0.58, dur: 3.85, roll: 0.08 }),
    chordLine(fifths(A2_CHORDS), { start: A2_START, octave: 3, center: 59, velocity: 0.3, dur: 3.85, roll: 0.18 }),
  );
}

// ------------------------------------------------------------------- harp bed

function harpBed(): Note[] {
  return concatNotes(
    arpLine(INTRO_CHORDS, { start: 0, pattern: [0, 2, 1, 2], step: 1, dur: 0.9, octave: 4, center: 74, velocity: 0.2 }),
    arpLine(A_CHORDS, {
      start: A_START,
      pattern: [0, 1, 2, 3, 2, 1],
      step: 0.5,
      dur: 0.55,
      octave: 4,
      center: 76,
      velocity: 0.3,
    }),
    arpLine(B_CHORDS, {
      start: B_START,
      pattern: [0, 1, 2, 3, 4, 3, 2, 1],
      step: 0.5,
      dur: 0.42,
      octave: 4,
      center: 78,
      velocity: 0.4,
    }),
    arpLine(A2_CHORDS, { start: A2_START, pattern: [0, 2, 1], step: 1, dur: 0.85, octave: 4, center: 74, velocity: 0.22 }),
  );
}

// -------------------------------------------------------------- strings-low

/** Sustained roots; linearly fades between two velocities across a chord list. */
function fadeRoots(chords: string[], start: number, velFrom: number, velTo: number, dur = 3.85): Note[] {
  const roots = chordRoots(chords, 2);
  return roots.map((midi, bar): Note => {
    const t = chords.length > 1 ? bar / (chords.length - 1) : 0;
    return [start + bar * BAR, dur, midi, velFrom + (velTo - velFrom) * t];
  });
}

function stringsLow(): Note[] {
  return concatNotes(
    [[0, 15.5, 'B2', 0.2] as Note],
    fadeRoots(A_CHORDS, A_START, 0.36, 0.42),
    fadeRoots(B_CHORDS, B_START, 0.48, 0.58),
    fadeRoots(A2_CHORDS, A2_START, 0.34, 0.18),
  );
}

// -------------------------------------------------------- taiko: distant thunder

function thunderRoll(chords: string[], hitBars: number[], start: number, vel: number, big: boolean): Note[] {
  const roots = chordRoots(chords, 1);
  const notes: Note[] = [];
  for (const idx of hitBars) {
    const at = start + idx * BAR;
    const root = roots[idx]!;
    notes.push([at, 1.6, root, vel]);
    notes.push([at + 1.5, 0.9, root, vel * 0.55]);
    if (big) notes.push([at + 2.5, 0.9, root + 7, vel * 0.62]);
  }
  return notes;
}

function taikoThunder(): Note[] {
  return concatNotes(
    [[0, 1.5, 'B1', 0.3] as Note, [8, 1.2, 'G1', 0.24] as Note],
    // The climb keeps its thunder distant (two soft rolls) so the peak's full storm lands.
    thunderRoll(A_CHORDS, [0, 4], A_START, 0.26, false),
    thunderRoll(B_CHORDS, [0, 1, 2, 3, 4, 5, 6, 7], B_START, 0.62, true),
    thunderRoll(A2_CHORDS, [0, 4], A2_START, 0.22, false),
  );
}

// -------------------------------------------------------------- shaker: wind

function shakerWind(): Note[] {
  return concatNotes(
    drumLine('x...x...x...x...', { start: 0, pitch: 'C3', velocity: 0.14, times: 4 }),
    drumLine('x.x.x.x.x.x.x.x.', { start: A_START, pitch: 'C3', velocity: 0.2, times: 8 }),
    drumLine('xxx.xxx.xxx.xxx.', { start: B_START, pitch: 'C3', velocity: 0.28, times: 8 }),
    drumLine('x...x...x...x...', { start: A2_START, pitch: 'C3', velocity: 0.16, times: 8 }),
  );
}

export const gagazetTrack: Track = {
  name: 'scene-gagazet',
  bpm: 72,
  timeSig: [4, 4],
  loop: { start: A_START, end: LENGTH },
  length: LENGTH,
  tailSec: 4,
  fx: {
    reverb: { room: 0.88, damp: 0.32, width: 0.98, preDelay: 0.035 },
    delay: { timeBeats: 1, feedback: 0.28, damp: 2400 },
  },
  channels: [
    { name: 'flute lead', instrument: 'flute', volume: 0.9, pan: -0.05, notes: fluteLine(), fx: { reverb: 0.35, delay: 0.15 } },
    { name: 'horn call', instrument: 'brass', volume: 0.7, pan: -0.18, notes: hornCall(), fx: { reverb: 0.32, delay: 0.1 } },
    { name: 'choir drone', instrument: 'choir', volume: 0.62, pan: 0.1, notes: choirDrone(), fx: { reverb: 0.55 } },
    { name: 'harp', instrument: 'harp', volume: 0.4, pan: -0.28, notes: harpBed(), fx: { reverb: 0.3, delay: 0.22 } },
    { name: 'strings-low', instrument: 'strings-low', volume: 0.55, pan: 0, notes: stringsLow(), fx: { reverb: 0.32 } },
    { name: 'taiko thunder', instrument: 'taiko', volume: 0.62, pan: 0.15, notes: taikoThunder(), fx: { reverb: 0.35 } },
    { name: 'shaker wind', instrument: 'shaker', volume: 0.3, pan: 0.32, notes: shakerWind(), fx: { reverb: 0.18 } },
  ],
};

export default gagazetTrack;
