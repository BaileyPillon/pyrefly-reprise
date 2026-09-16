/**
 * "Where the Tide Stopped" — Zanarkand Dome scene theme.
 *
 * ORIGINAL COMPOSITION. The pilgrimage's end: a ruined dome at dusk, pyreflies
 * drifting through empty arches. E minor, 58 bpm, built mostly from space and
 * silence. The piano states its material in wide dyads and octaves rather
 * than flowing arpeggios — deliberately unlike the title theme's A minor
 * arpeggio ballad — under a slow pad, a distant bell and celesta pyrefly
 * flickers, with low strings entering only once the dome has sat in silence
 * a while.
 *
 * Built around PYREFLY_SIGH, restated as a fixed melodic anchor (always the
 * same pitches) over harmony that keeps moving underneath it — a memory that
 * doesn't change even as the ground beneath it does. PYREFLY_RISE is stated
 * once, opening the B section full of hope, and is never answered by the
 * sigh that would resolve it: the question is left standing in the air.
 *
 * Form (4/4, 24 bars, 99.3 s):
 *   bars  1-4    intro   beats  0- 16   solo piano dyads, one bell toll
 *   bars  5-12   A       beats 16- 48   PYREFLY_SIGH anchor, pad enters   <- loop start
 *   bars 13-20   B       beats 48- 80   celesta flickers, strings-low enters,
 *                                       PYREFLY_RISE stated, left unresolved
 *   bars 21-24   A'      beats 80- 96   recap thins out, settles toward Em
 * Loop 16 -> 96; the closing B-minor dyad leans back into A's opening Em.
 */

import { chordLine, chordRoots, concatNotes, tracker, transposeNotes, type Note, type Track } from '../score.ts';
import { cell, PYREFLY_RISE, PYREFLY_SIGH } from './motifs.ts';

const BAR = 4;
const INTRO_CHORDS = ['Em', 'Em', 'C', 'Bm'];
const A_CHORDS = ['Em', 'C', 'G', 'Bm', 'Am', 'Em', 'C', 'Bm'];
/** B opens on Am, not C: the rising cell's B3/E4/F#4/G4 are all chord tones or colours of Am9(13). */
const B_CHORDS = ['Am', 'G', 'D', 'Bm', 'Am', 'C', 'G', 'Bm'];
const A2_CHORDS = ['Em', 'Am', 'C', 'Bm'];
const ALL_CHORDS = [...INTRO_CHORDS, ...A_CHORDS, ...B_CHORDS, ...A2_CHORDS];
const BARS = ALL_CHORDS.length; // 24
const LENGTH = BARS * BAR; // 96 beats = 99.3 s at 58 bpm

const A = 16;
const B = 48;
const A2 = 80;

/** Solo piano, intro: two bars of drift, a held dyad, and quiet. Nothing resolves yet. */
const INTRO_PIANO = `
  -:2 E3+E4:2         | -:1 G3+B3:2 -:1     |
  -:2 C4+E4:2         | -:1 B3+D4:2 -:1     |
`;

/** The wide, thin dyads that answer/breathe between PYREFLY_SIGH statements. */
function breath(startBeat: number, notesStr: string, velocity: number): Note[] {
  return tracker(`${notesStr}:4`, { start: startBeat, velocity, checkBars: BAR });
}

function pianoLine(): Note[] {
  return concatNotes(
    tracker(INTRO_PIANO, { start: 0, velocity: 0.42, checkBars: BAR }),
    // A — the sigh returns every other bar, doubled in octaves for weight.
    cell(PYREFLY_SIGH, A, 'E4', 0.54),
    transposeNotes(cell(PYREFLY_SIGH, A, 'E4', 0.34), -12),
    breath(A + 4, 'E3+C4', 0.38),
    cell(PYREFLY_SIGH, A + 8, 'E4', 0.68),
    breath(A + 12, 'B3+F#4', 0.4),
    cell(PYREFLY_SIGH, A + 16, 'E4', 0.72),
    transposeNotes(cell(PYREFLY_SIGH, A + 16, 'E4', 0.4), 12),
    breath(A + 20, 'E3+B3', 0.4),
    cell(PYREFLY_SIGH, A + 24, 'E4', 0.72),
    tracker('B3+F#4:3 -:1', { start: A + 28, velocity: 0.44, checkBars: BAR }),
    // B — the rise opens the section and is left hanging; the piano recedes for the
    // celesta and strings. Two faint echoes, then silence for the rest of the section.
    cell(PYREFLY_RISE, B, 'E4', 0.62),
    tracker('B3+F#4:4', { start: B + 12, velocity: 0.34 }),
    tracker('G3+D4:4', { start: B + 24, velocity: 0.28 }),
    // A' — the sigh comes back once more, quieter, then the dyads thin to almost nothing.
    cell(PYREFLY_SIGH, A2, 'E4', 0.38),
    tracker('A3+E4:4', { start: A2 + 4, velocity: 0.24 }),
    transposeNotes(cell(PYREFLY_SIGH, A2 + 8, 'E4', 0.3), -12),
    tracker('B3+F#4:3 -:1', { start: A2 + 12, velocity: 0.22, checkBars: BAR }),
  );
}

/** Three distant tolls — never more than one per section, always fading before it can insist. */
function bellLine(): Note[] {
  return [
    [0, 4, 'E3', 0.5],
    [8, 4, 'B2', 0.4],
    [B, 4.5, 'B2', 0.42],
    [A2, 4.5, 'E3', 0.44],
  ];
}

/** The pad is the one thing that never drops out inside the loop — soft entrance, a swell
 * through B, then it recedes to leave the dome quiet again for the loop to turn over. */
function padLine(): Note[] {
  return concatNotes(
    chordLine(A_CHORDS, { start: A, octave: 3, center: 64, velocity: 0.13, dur: 3.85, roll: 0.06 }),
    chordLine(B_CHORDS, { start: B, octave: 3, center: 64, velocity: 0.58, dur: 3.85, roll: 0.06 }),
    chordLine(A2_CHORDS, { start: A2, octave: 3, center: 64, velocity: 0.11, dur: 3.85, roll: 0.06 }),
  );
}

/** Pyreflies: short, irregular flickers, never on a tidy grid. Mostly in B, a couple left
 * over into A' as the light dies down. */
function celestaLine(): Note[] {
  const flick = (startBeat: number, notesStr: string, velocity: number): Note[] =>
    tracker(notesStr, { start: startBeat, velocity });
  return concatNotes(
    flick(B + 1.5, 'B5:0.4 G5:0.4 E5:0.6', 0.4),
    flick(B + 6, 'E5:0.4 A5:0.3 D6:0.5', 0.44),
    flick(B + 10.5, 'F#5:0.3 B5:0.4', 0.36),
    flick(B + 15, 'G5:0.5 D5:0.4 B4:0.6', 0.42),
    flick(B + 19.5, 'A5:0.3 E5:0.5', 0.34),
    flick(B + 24.5, 'B5:0.4 F#5:0.4 D5:0.6', 0.38),
    flick(B + 29, 'F#5:0.3 D6:0.4', 0.3),
    flick(A2 + 2.5, 'E5:0.4 B4:0.6', 0.26),
    flick(A2 + 9, 'F#5:0.4 D5:0.6', 0.2),
  );
}

/** Low strings enter only in B — a swell that builds weight under the celesta, then eases
 * back down through A' so the loop seam returns to something close to the hush it began in. */
function lowStrings(): Note[] {
  const chords = [...B_CHORDS, ...A2_CHORDS];
  const roots = chordRoots(chords, 2);
  const notes: Note[] = [];
  roots.forEach((midi, i) => {
    const beat = B + i * BAR;
    const inB = i < B_CHORDS.length;
    const velocity = inB
      ? 0.26 + (i / B_CHORDS.length) * 0.4
      : 0.24 - ((i - B_CHORDS.length) / A2_CHORDS.length) * 0.16;
    notes.push([beat, 3.75, midi, velocity]);
  });
  return notes;
}

export const zanarkandDomeTrack: Track = {
  name: 'scene-zanarkand-dome',
  bpm: 58,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.92, damp: 0.24, width: 1, preDelay: 0.05 },
    delay: { timeBeats: 1.5, feedback: 0.26, damp: 2200 },
  },
  channels: [
    {
      name: 'piano',
      instrument: 'piano',
      volume: 0.95,
      pan: -0.05,
      notes: pianoLine(),
      fx: { reverb: 0.4 },
    },
    {
      name: 'pad',
      instrument: 'pad',
      volume: 0.55,
      pan: 0.05,
      notes: padLine(),
      fx: { reverb: 0.5 },
    },
    {
      name: 'bell',
      instrument: 'bell',
      volume: 0.4,
      pan: 0.3,
      notes: bellLine(),
      fx: { reverb: 0.65, delay: 0.35 },
    },
    {
      name: 'celesta',
      instrument: 'celesta',
      volume: 0.4,
      pan: 0.22,
      notes: celestaLine(),
      fx: { reverb: 0.55, delay: 0.3 },
    },
    {
      name: 'strings-low',
      instrument: 'strings-low',
      volume: 0.6,
      pan: -0.15,
      notes: lowStrings(),
      fx: { reverb: 0.4 },
    },
  ],
};

export default zanarkandDomeTrack;
