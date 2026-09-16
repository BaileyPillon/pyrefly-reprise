/**
 * "Bright After the Storm" — victory fanfare + results jingle.
 *
 * ORIGINAL COMPOSITION. A one-shot brass fanfare (bars 1-3, 6 s) followed by
 * a bright C-major results loop at 120 bpm: pluck carries the tune, piano
 * comps and answers, strings-short pulses underneath, a light kit keeps
 * time. The fanfare's rise is a broken-chord climb through the octave, not
 * the familiar repeated-note pickup into a held note — deliberately a
 * different shape and a different rhythm.
 *
 * Form (4/4):
 *   bar   1     fanfare  beats  0- 4   brass climbs C4->C6
 *   bar   2     fanfare  beats  4- 8   full chord hit, brass-stab punch, timpani roll, crash
 *   bar   3     fanfare  beats  8-12   fading brass tag, turns into the loop
 *   bars  4-11  chorus 1 beats 12- 44  the hook over hats, an eighth-note strings pulse and a soft kick   <- loop start
 *   bars 12-19  chorus 2 beats 44- 76  two pickups added to the hook, piano comps, kick+snare join, bass enters
 *   bars 20-27  chorus 3 beats 76-108  fullest: one phrase leaps an octave, piano trades comping for a counter-melody, crash accent
 *   bars 28-35  chorus 4 beats108-140  the hook stripped to long notes and open bars, closes on G
 * The loop runs 12 -> 140; chorus 4 always ends on G, resolving straight back
 * into chorus 1's C at the top.
 */

import { arpLine, chordRoots, concatNotes, drumLine, tracker, type Note, type Track } from '../score.ts';

const BAR = 4;
const FANFARE_END = 12;
const LOOP_CHORDS = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'];
const R1 = FANFARE_END;
const R2 = R1 + 8 * BAR;
const R3 = R2 + 8 * BAR;
const R4 = R3 + 8 * BAR;
const LENGTH = R4 + 8 * BAR;

/** The rising fanfare figure: a broken-chord climb, then a full hit, then a fading tag. */
const FANFARE_BRASS = `
  C4:0.5 E4:0.5 G4:0.5 C5:0.5 E5:0.5 G5:0.5 A5:0.5 C6:0.5 |
  C4+E4+G4+C5+E5+G5+C6:4@1                                |
  G5:0.5@0.8 -:0.5 E5:0.5@0.65 -:0.5 C5:0.5@0.5 -:0.5 G4:0.5@0.4 -:0.5 |
`;

/** The hook: an 8-bar tune played once per chorus, breathing 2+2+4 with a peak in bar 6. */
const MELODY = `
  E5:0.5 G5:0.5 C6:1 B5:0.5 G5:0.5 E5:1  | D5:0.5 G5:0.5 B5:1 A5:0.5 G5:0.5 D5:1 |
  C5:0.5 E5:0.5 A5:1 G5:0.5 E5:0.5 -:1   | A4:0.5 C5:0.5 F5:1 E5:0.5 C5:0.5 -:1  |
  E5:0.5 G5:0.5 C6:0.5 D6:0.5 C6:1 G5:1  | B5:0.5 D6:1 B5:0.5 G5:1 D5:1          |
  A5:0.5 F5:0.5 C5:1 A4:0.5 F4:0.5 -:1   | G4:1 -:1 D5:0.5 G5:0.5 -:1            |
`;

/** Chorus 2: the same hook, but bars 2-3 and 6-7 get a pickup — the arrival note leans in early. */
const MELODY_2 = `
  E5:0.5 G5:0.5 C6:1 B5:0.5 G5:0.5 E5:1 |
  D5:0.5 G5:0.5 B5:1 A5:0.5 G5:0.5 -:0.5 C5:1 E5:0.5 A5:1 G5:0.5 E5:0.5 -:1 |
  A4:0.5 C5:0.5 F5:1 E5:0.5 C5:0.5 -:1 |
  E5:0.5 G5:0.5 C6:0.5 D6:0.5 C6:1 G5:1 |
  B5:0.5 D6:1 B5:0.5 G5:1 -:0.5 A5:1 F5:0.5 C5:1 A4:0.5 F4:0.5 -:1 |
  G4:1 -:1 D5:0.5 G5:0.5 -:1 |
`;

/** Chorus 3, the peak: bar 3's high point leaps an octave, and bars 7-8 get a brighter cadence. */
const MELODY_3 = `
  E5:0.5 G5:0.5 C6:1 B5:0.5 G5:0.5 E5:1  | D5:0.5 G5:0.5 B5:1 A5:0.5 G5:0.5 D5:1 |
  C5:0.5 E5:0.5 A6:1 G5:0.5 E5:0.5 -:1   | A4:0.5 C5:0.5 F5:1 E5:0.5 C5:0.5 -:1  |
  E5:0.5 G5:0.5 C6:0.5 D6:0.5 C6:1 G5:1  | B5:0.5 D6:1 B5:0.5 G5:1 D5:1          |
  C6:0.5 A5:0.5 F5:1 C6:0.5 A5:0.5 -:1   | D6:1.5 B5:0.5 G5:1 D6:1               |
`;

/** Chorus 4: the hook stripped to long notes and open bars — still lands on G at the close. */
const MELODY_4 = `
  E5:2 C5:2 | D5:2 -:2 | -:4 | -:4 |
  E5:2 G5:2 | -:4 | A4:2 F4:2 | G4:1 -:0.5 D5:0.5 G5:1 -:1 |
`;

/** Chorus 3's piano: a real countermelody with its own passing tones, not another arpeggio. */
const PIANO_COUNTER = `
  G3:0.5 C4:0.5 E4:1 D4:1 C4:1 | D4:0.5 G4:0.5 B4:1 A4:1 G4:1 |
  E4:0.5 A4:0.5 C5:1 B4:1 A4:1 | C4:0.5 F4:0.5 A4:1 G4:1 F4:1 |
  E4:1 G4:1 C5:1 B4:1          | D4:1 G4:1 B4:1 A4:1          |
  C4:1 F4:1 A4:1 G4:1          | B3:1 D4:1 G4:1 F#4:1         |
`;

function fanfareBrass(): Note[] {
  return tracker(FANFARE_BRASS, { start: 0, velocity: 0.85, checkBars: BAR });
}

function fanfareStab(): Note[] {
  return tracker('C4+E4+G4+C5:0.4@1', { start: 4 });
}

function fanfareTimpani(): Note[] {
  return concatNotes(
    [[0, 1, 'C2', 0.35]] as Note[],
    drumLine('XXXXXXXX', { start: 4, step: 0.5, pitch: 'C2', velocity: 0.85, accentVelocity: 0.95 }),
    [[8, 2, 'C2', 0.3]] as Note[],
  );
}

function crashHits(): Note[] {
  return [
    [4, 3, 'C5', 0.9],
    [R3, 2, 'C5', 0.68],
  ];
}

function pluckMelody(): Note[] {
  return concatNotes(
    tracker(MELODY, { start: R1, velocity: 0.8, checkBars: BAR }),
    tracker(MELODY_2, { start: R2, velocity: 0.8, checkBars: BAR }),
    tracker(MELODY_3, { start: R3, velocity: 0.92, checkBars: BAR }),
    tracker(MELODY_4, { start: R4, velocity: 0.68, checkBars: BAR }),
  );
}

/** Piano is tacet in chorus 1, comps simply in 2, trades comping for a counter-melody at the chorus 3 peak, then recedes. */
function pianoLine(): Note[] {
  return concatNotes(
    arpLine(LOOP_CHORDS, { start: R2, barBeats: BAR, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.46, octave: 3, center: 60, velocity: 0.42 }),
    tracker(PIANO_COUNTER, { start: R3, velocity: 0.7, checkBars: BAR }),
    arpLine(LOOP_CHORDS, { start: R4, barBeats: BAR, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.46, octave: 3, center: 60, velocity: 0.32 }),
  );
}

function stringsPulse(): Note[] {
  return concatNotes(
    arpLine(LOOP_CHORDS, { start: R1, barBeats: BAR, pattern: [0, 1, 2, 1], step: 0.5, dur: 0.26, octave: 4, center: 72, velocity: 0.42 }),
    arpLine(LOOP_CHORDS, { start: R2, barBeats: BAR, pattern: [0, 1, 2, 1], step: 1, dur: 0.32, octave: 4, center: 72, velocity: 0.4 }),
    arpLine(LOOP_CHORDS, { start: R3, barBeats: BAR, pattern: [0, 1, 2, 3, 2, 1, 2, 1], step: 0.25, dur: 0.2, octave: 4, center: 74, velocity: 0.56, accent: 1.3 }),
    arpLine(LOOP_CHORDS, { start: R4, barBeats: BAR, pattern: [0, 1, 2, 1], step: 1, dur: 0.32, octave: 4, center: 72, velocity: 0.37 }),
  );
}

/** A light bass only under choruses 2-3, so choruses 1 and 4 stay airy at the loop seam; chorus 3 sits a touch heavier. */
function bassLine(): Note[] {
  const notes: Note[] = [];
  for (const [start, hi, lo] of [
    [R2, 0.55, 0.45],
    [R3, 0.65, 0.56],
  ] as [number, number, number][]) {
    chordRoots(LOOP_CHORDS, 2).forEach((midi, bar) => {
      notes.push([start + bar * BAR, 3.6, midi, bar % 2 === 0 ? hi : lo]);
    });
  }
  return notes;
}

function hats(): Note[] {
  return concatNotes(
    drumLine('x.x.x.x.x.x.x.x.', { start: R1, step: 0.25, pitch: 'F#3', velocity: 0.34, times: 8 }),
    drumLine('x.x.x.x.x.x.x.x.', { start: R2, step: 0.25, pitch: 'F#3', velocity: 0.34, times: 8 }),
    drumLine('xxxxxxxxxxxxxxxx', { start: R3, step: 0.25, pitch: 'F#3', velocity: 0.46, times: 8 }),
    drumLine('x.x.x.x.x.x.x.x.', { start: R4, step: 0.25, pitch: 'F#3', velocity: 0.34, times: 8 }),
  );
}

/** A soft ghost kick grounds chorus 1 on beats 1 and 3 (no kick was there before); the backbeat proper joins in 2-3. */
function kickLine(): Note[] {
  return concatNotes(
    drumLine('X.......X.......', { start: R1, step: 0.25, pitch: 'C1', velocity: 0.34, times: 8 }),
    drumLine('X...X...X...X...', { start: R2, step: 0.25, pitch: 'C1', velocity: 0.68, times: 8 }),
    drumLine('X...X...X...X...', { start: R3, step: 0.25, pitch: 'C1', velocity: 0.88, times: 8 }),
  );
}

function snareLine(): Note[] {
  return concatNotes(
    drumLine('........g.......', { start: R1, step: 0.25, pitch: 'D2', velocity: 0.55, times: 8 }),
    drumLine('....X.......X...', { start: R2, step: 0.25, pitch: 'D2', velocity: 0.74, times: 8 }),
    drumLine('....X.......X...', { start: R3, step: 0.25, pitch: 'D2', velocity: 0.92, times: 8 }),
    drumLine('........g.......', { start: R4, step: 0.25, pitch: 'D2', velocity: 0.45, times: 8 }),
  );
}

export const victoryTrack: Track = {
  name: 'victory-ffx',
  bpm: 120,
  timeSig: [4, 4],
  loop: { start: R1, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.5, damp: 0.4, width: 0.85, preDelay: 0.01 },
    delay: { timeBeats: 0.5, feedback: 0.2, damp: 3000 },
  },
  channels: [
    { name: 'fanfare brass', instrument: 'brass', volume: 1, pan: -0.05, notes: fanfareBrass(), fx: { reverb: 0.25 } },
    { name: 'fanfare stab', instrument: 'brass-stab', volume: 0.9, pan: 0.1, notes: fanfareStab(), fx: { reverb: 0.15 } },
    { name: 'fanfare timpani', instrument: 'timpani', volume: 0.85, pan: 0, notes: fanfareTimpani(), fx: { reverb: 0.25 } },
    { name: 'crash', instrument: 'crash', volume: 0.6, pan: 0.1, notes: crashHits(), fx: { reverb: 0.3 } },
    { name: 'pluck melody', instrument: 'pluck', volume: 1, pan: 0.08, notes: pluckMelody(), fx: { reverb: 0.25, delay: 0.12 } },
    { name: 'piano comp', instrument: 'piano', volume: 0.6, pan: -0.12, notes: pianoLine(), fx: { reverb: 0.25 } },
    { name: 'strings pulse', instrument: 'strings-short', volume: 0.45, pan: 0.2, notes: stringsPulse(), fx: { reverb: 0.2 } },
    { name: 'bass', instrument: 'bass', volume: 0.55, pan: 0, notes: bassLine(), fx: { reverb: 0.05 } },
    { name: 'hat', instrument: 'hat', volume: 0.4, pan: 0.15, notes: hats() },
    { name: 'kick', instrument: 'kick', volume: 0.85, pan: 0, notes: kickLine() },
    { name: 'snare', instrument: 'snare', volume: 0.7, pan: -0.05, notes: snareLine(), fx: { reverb: 0.1 } },
  ],
};

export default victoryTrack;
