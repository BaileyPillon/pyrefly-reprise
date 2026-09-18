/**
 * "The Dream That Has To End" — the FFX ending, and the only place the score's
 * central theme is ever allowed to finish.
 *
 * ORIGINAL COMPOSITION. B Aeolian, 4/4, 58 bpm, closing in B MAJOR.
 *
 * THEMES (docs/audio/THEMES.md §2 and the cue map, row 16)
 *   FAREWELL, complete, twice. First bars 1-8 on solo piano with nothing else
 *   in the room — the same phrase the title cue has been leaving unfinished
 *   since the player pressed start. Then all sixteen bars on
 *   FAREWELL_CHORDS_RELEASED: three chords changed, not one melody note
 *   altered, and the lament becomes a benediction. That reserve is spent here
 *   and nowhere else in the game.
 *   Violas double the tune an octave below FROM BAR 9 ONWARD, so the sound
 *   physically widens exactly where the melody climbs.
 *   HYMN_HEAD in augmentation on the horns under the second statement, and
 *   HYMN bars 13-16 as the coda, with one Picardy third in the last bar —
 *   the prayer's own amen, in the major, held over a timpani roll.
 *
 * THE ONE EMOTION: permission to stop.
 *
 * Performance rules applied: FAREWELL_DYNAMICS is not decoration and is
 * applied bar by bar — bar 9 steps BACK to 0.66 so bar 11 has somewhere to
 * come from, and bar 11's downbeat at 0.94 is the loudest note in the cue.
 * Every one of the four FAREWELL_FALL appoggiaturas leans: the held note is
 * louder than the note it falls to. The written breaths at the ends of bars
 * 4, 8 and 12 are lengthened 8% with `agogic()` and the rests inside bars 4,
 * 8 and 13 are left empty. The last chord rings for eight seconds over
 * nothing else at all.
 *
 * Form (28 bars, 112 beats, 115.9 s):
 *   bars  1- 8  statement 1  beats  0- 32  solo piano, FAREWELL bars 1-8, alone
 *   bars  9-24  statement 2  beats 32- 96  full strings on the released harmony  <- loop start
 *   bars 25-28  coda         beats 96-112  HYMN bars 13-16, choir, Picardy third
 */

import {
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  motif,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  FAREWELL_CHORDS,
  FAREWELL_CHORDS_RELEASED,
  FAREWELL_DYNAMICS,
  FAREWELL_RH,
  HYMN_ALTO,
  HYMN_BASS,
  HYMN_HEAD,
  HYMN_SOPRANO,
  HYMN_TENOR,
  agogic,
  augment,
  lean,
  shapeByBar,
} from './themes.ts';

const BAR = 4;
const S1 = 0;
const S2 = 32;
const CODA = 96;
const LENGTH = 112;

/** The hymn lives in E Aeolian; the ending lives a fifth above it. */
const UP = 7;

/** HYMN bars 13-16, moved to B — and the last chord borrowed into the major. */
const CODA_HALF = ['Bm', 'Bm', 'Em', 'D', 'G', 'D', 'Em', 'B'];

/**
 * The melody, shaped. Order matters: the per-bar dynamic table first, then the
 * appoggiaturas on top of it, then the written rubato last so the breaths land
 * on the note lengths the dynamics already chose.
 */
function farewell(start: number, fromBar: number, toBar: number, trim = 1): Note[] {
  const from = (fromBar - 1) * BAR;
  const to = toBar * BAR;
  // gate stays at 1 so the phrase ends land on whole beats and `agogic()` can
  // find them; the legato comes from the voice's release tail, not from here.
  const shaped = shapeByBar(
    tracker(FAREWELL_RH, { gate: 1, checkBars: BAR }),
    FAREWELL_DYNAMICS.map((v) => Math.min(1, v * trim)),
    BAR,
  );
  const leaned = lean(shaped, [[4, 7], [20, 23], [36, 39], [52, 55], [60, 62]]);
  const breathed = agogic(leaned, [15, 31, 48, 64], 0.08);
  return breathed
    .filter((n) => n[0] >= from - 1e-6 && n[0] < to - 1e-6)
    .map((n): Note => [n[0] - from + start, n[1], n[2], n[3]]);
}

// ---------------------------------------------------------------------------
// Statement 1 — one piano, one room, nothing else
// ---------------------------------------------------------------------------

function pianoStatement(): Note[] {
  // Lifted from 0.85: the first render put the solo statement 24 dB under
  // the tutti, which is a concert-hall range and a bad idea in a game where
  // the player sets one volume. 17 dB still reads as 'one piano, alone'.
  return farewell(S1, 1, 8, 1);
}

/**
 * The left hand: rolling broken chords, never a repeated-note ostinato (that
 * texture belongs to somebody else's famous piece, and the resemblance guard
 * says so). The last note of each bar is shortened to clear the pedal.
 */
function pianoLeft(start: number, chords: string[], velocity: number, step = 0.5): Note[] {
  const notes = arpLine(chords, {
    start, barBeats: BAR, pattern: [0, 2, 3, 4, 5, 4, 3, 2], step, dur: step * 0.92,
    octave: 2, center: 52, velocity,
  });
  return notes.map((n): Note => {
    const inBar = (n[0] - start) % BAR;
    return inBar > BAR - step - 1e-6 ? [n[0], step * 0.4, n[2], (n[3] ?? velocity) * 0.8] : n;
  });
}

/** Downbeat octaves, the one place the left hand is allowed below C2. */
function pianoBass(start: number, chords: string[], velocity: number): Note[] {
  return chordRoots(chords, 1).flatMap((midi, bar): Note[] => [
    [start + bar * BAR, 3.4, midi, velocity],
    [start + bar * BAR, 3.4, midi + 12, velocity * 0.8],
  ]);
}

// ---------------------------------------------------------------------------
// Statement 2 — the benediction
// ---------------------------------------------------------------------------

function stringsTune(): Note[] {
  return farewell(S2, 1, 16);
}

/** Violas, an octave below the tune, and only from bar 9. That is where it widens. */
function violaDouble(): Note[] {
  return farewell(S2, 9, 16, 0.86).map((n): Note => [n[0], n[1], (n[2] as number) - 12, n[3]]);
}

/** Horns take HYMN_HEAD at double length under the strings: the prayer, remembered. */
function hornHead(): Note[] {
  const head = augment(HYMN_HEAD, 2);
  return concatNotes(
    motif(head, [S2 + 16], ['B3']).map((n): Note => [n[0], n[1] * 0.99, n[2], 0.42]),
    motif(head, [S2 + 48], ['B3']).map((n): Note => [n[0], n[1] * 0.99, n[2], 0.5]),
  );
}

function stringBed(): Note[] {
  return concatNotes(
    chordLine(FAREWELL_CHORDS_RELEASED.slice(0, 16), {
      start: S2, barBeats: 2, octave: 3, center: 62, velocity: 0.34, dur: 1.9, roll: 0.04,
    }),
    chordLine(FAREWELL_CHORDS_RELEASED.slice(16), {
      start: S2 + 32, barBeats: 2, octave: 3, center: 64, velocity: 0.46, dur: 1.9, roll: 0.04,
    }),
    // The last half bar is B major, and it is left to ring: `tailSec` keeps the
    // hall open for nine seconds after the strings stop bowing.
    chordLine(CODA_HALF, {
      start: CODA, barBeats: 2, octave: 3, center: 64, velocity: 0.52, dur: 1.9, roll: 0.05,
    }),
  );
}

function cellosLine(): Note[] {
  return concatNotes(
    chordRoots(FAREWELL_CHORDS, 2).map((midi, bar): Note => [
      S2 + bar * BAR, 3.7, midi, bar < 8 ? 0.34 : 0.46,
    ]),
    chordRoots(CODA_HALF.filter((_, i) => i % 2 === 0), 2).map((midi, bar): Note => [
      CODA + bar * BAR, 3.7, midi, 0.44,
    ]),
  );
}

/** Harp: one rolled chord a bar through the climb, and nothing before it. */
function harpLine(): Note[] {
  return concatNotes(
    chordLine(FAREWELL_CHORDS.slice(8, 12), {
      start: S2 + 32, octave: 4, center: 74, velocity: 0.34, dur: 3.6, roll: 0.09,
    }),
    chordLine(CODA_HALF.filter((_, i) => i % 2 === 0), {
      start: CODA, octave: 4, center: 74, velocity: 0.28, dur: 3.6, roll: 0.12,
    }),
  );
}

/** A roll into bar 11 — the arrival — and another under the Picardy third. */
function timpaniLine(): Note[] {
  const notes: Note[] = [];
  for (let s = 0; s < 8; s++) notes.push([S2 + 36 + s * 0.5, 0.46, 'B1', 0.22 + s * 0.055]);
  notes.push([S2 + 40, 3, 'B1', 0.66]);
  notes.push([S2 + 56, 2, 'G1', 0.3]);
  for (let s = 0; s < 8; s++) notes.push([CODA + 8 + s * 0.5, 0.46, 'B1', 0.2 + s * 0.045]);
  notes.push([CODA + 12, 3.6, 'B1', 0.58]);
  return notes;
}

// ---------------------------------------------------------------------------
// The coda — HYMN bars 13-16, and one borrowed third
// ---------------------------------------------------------------------------

function hymnVoice(src: string, level: number, top: boolean): Note[] {
  const from = 12 * BAR;
  return tracker(src, { transpose: UP, gate: 0.99, checkBars: BAR })
    .filter((n) => n[0] >= from - 1e-6)
    .map((n): Note => {
      const bar = Math.floor((n[0] - from) / BAR);
      const arch = [level, level + 0.04, level + 0.02, level - 0.06];
      // The last bar is the amen: the leaning note louder than its resolution.
      const isAmen = n[0] >= from + 12;
      const v = isAmen ? (n[0] < from + 14 ? level + 0.06 : level - 0.04) : arch[bar]!;
      // THE PICARDY THIRD. The last chord is B - D - F#, and the third is in
      // the tenor: raise that one note a semitone and the prayer ends in the
      // major. One chord, one voice, one semitone, once in the whole score.
      const pitch = top && n[0] >= from + 14 ? (n[2] as number) + 1 : n[2];
      return [n[0] - from + CODA, n[1], pitch, v];
    });
}

function choirUpper(): Note[] {
  return concatNotes(hymnVoice(HYMN_SOPRANO, 0.56, false), hymnVoice(HYMN_ALTO, 0.48, false));
}

function choirLower(): Note[] {
  return concatNotes(hymnVoice(HYMN_TENOR, 0.44, true), hymnVoice(HYMN_BASS, 0.46, false));
}

function bellLine(): Note[] {
  return [[CODA, 6, 'B3', 0.4]];
}

function cymbalSwell(): Note[] {
  return [[CODA - 2, 2.5, 'C5', 0.3]];
}

export const endingTrack: Track = {
  name: 'ending-ffx',
  bpm: 58,
  timeSig: [4, 4],
  loop: { start: S2, end: LENGTH },
  length: LENGTH,
  tailSec: 9,
  fx: {
    reverb: { room: 0.9, damp: 0.24, width: 1, preDelay: 0.042 },
    delay: { timeBeats: 0.75, feedback: 0.24, damp: 2400 },
  },
  channels: [
    {
      name: 'piano melody',
      instrument: 'piano',
      volume: 1.45,
      pan: -0.04,
      notes: pianoStatement(),
      fx: { reverb: 0.3 },
    },
    {
      name: 'piano left hand',
      instrument: 'piano',
      volume: 0.78,
      pan: 0.12,
      notes: concatNotes(
        pianoLeft(S1, FAREWELL_CHORDS.slice(0, 8), 0.42),
        pianoLeft(S2, FAREWELL_CHORDS.slice(0, 8), 0.24, 0.5),
        pianoLeft(S2 + 32, FAREWELL_CHORDS.slice(8, 16), 0.26, 0.5),
      ),
      fx: { reverb: 0.3 },
    },
    {
      name: 'piano bass',
      instrument: 'piano',
      volume: 0.72,
      pan: -0.02,
      notes: pianoBass(S1, FAREWELL_CHORDS.slice(0, 8), 0.44),
      fx: { reverb: 0.22 },
    },
    { name: 'strings tune', instrument: 'strings', volume: 0.84, pan: 0.08, notes: stringsTune(), fx: { reverb: 0.4, delay: 0.1 } },
    { name: 'violas', instrument: 'strings-low', volume: 0.6, pan: 0.2, notes: violaDouble(), fx: { reverb: 0.36 } },
    { name: 'string bed', instrument: 'strings', volume: 0.47, pan: -0.16, notes: stringBed(), fx: { reverb: 0.5 } },
    { name: 'cellos', instrument: 'strings-low', volume: 0.56, pan: -0.08, notes: cellosLine(), fx: { reverb: 0.35 } },
    { name: 'horns', instrument: 'brass', volume: 0.46, pan: -0.28, notes: hornHead(), fx: { reverb: 0.4 } },
    { name: 'harp', instrument: 'harp', volume: 0.5, pan: -0.34, notes: harpLine(), fx: { reverb: 0.36, delay: 0.16 } },
    { name: 'choir upper', instrument: 'choir', volume: 0.72, pan: 0.06, notes: choirUpper(), fx: { reverb: 0.6 } },
    { name: 'choir lower', instrument: 'choir', volume: 0.54, pan: -0.12, notes: choirLower(), fx: { reverb: 0.62 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.54, pan: 0.04, notes: timpaniLine(), fx: { reverb: 0.38 } },
    { name: 'bell', instrument: 'bell', volume: 0.4, pan: 0.32, notes: bellLine(), fx: { reverb: 0.6, delay: 0.3 } },
    { name: 'cymbal', instrument: 'crash', volume: 0.3, pan: 0.12, notes: cymbalSwell(), fx: { reverb: 0.45 } },
  ],
};

export default endingTrack;
