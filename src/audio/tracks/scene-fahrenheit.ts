/**
 * "Within the Hour" — the deck of the Fahrenheit, on the approach to Bevelle.
 *
 * ORIGINAL COMPOSITION. D minor (Aeolian), 4/4, 104 bpm. Chapter VIII's scene
 * cue: it plays under the pre-battle beats (research/ffx-evrae-airship.md
 * §12.4 — home is gone, Yuna is being married inside the hour, Cid turns the
 * ship, Bevelle comes up over the cloud line) and hands over to
 * `boss-evrae` when the wyrm climbs to meet them.
 * GAME CASE (AGENTS.md rule 14): FFX only — see `fahrenheit.ts`.
 *
 * THE BRIEF (the preflight's `scene-fahrenheit`, docs/plans/chapter-evrae-review.md
 * §6): the airship deck — wind, engines, urgency without combat. So there is
 * no kit and no bass guitar: the engine is a piano turning over in open fifths
 * and a low taiko heartbeat, the wind is a high string fourth, and the urgency
 * is harmonic and melodic, never a drum groove. No choir and nothing sacred
 * (the chapter keeps Bevelle's holiness for irony, research §12.6).
 *
 * THEMES (docs/audio/THEMES.md, cue map row 23)
 *   FAREWELL_RISE at double length on the violins, then FAREWELL_FALL — Yuna,
 *   who is not on this deck (beat 3: "nobody can heal"). The ship figure
 *   (`fahrenheit.ts`) on flute in B, a fourth up from where the battle will
 *   play it: the fight is foreshadowed before anyone has seen the wyrm. The
 *   peak closes on the score's AMEN (2 over the iv6, falling home) — plagal,
 *   no dominant.
 *
 * THE ONE EMOTION: no time, and no way back.
 *
 * Form (32 bars, 128 beats, 73.8 s; loop 16 -> 128):
 *   bars  1- 4  wind     beats   0- 16  a high fifth, a clang, the piano turns over
 *   bars  5-12  A        beats  16- 48  FAREWELL_RISE and _FALL on violins    <- loop start
 *   bars 13-20  B        beats  48- 80  the ship figure on flute, the engine quickens
 *   bars 21-28  C        beats  80-112  Bevelle over the cloud line: the peak, the AMEN
 *   bars 29-32  D        beats 112-128  back to wind and engine, leaning bVI - bVII home
 */

import { concatNotes, drumLine, tracker, type Note, type Track } from '../score.ts';
import { barArch, breathe, rootIn, sectionMacro, shipFigure } from './fahrenheit.ts';
import { FAREWELL_FALL, FAREWELL_RISE, augment, lean } from './themes.ts';
import { cell } from './motifs.ts';

const BAR = 4;
const A = 16;
const B = 48;
const C = 80;
const D = 112;
const LENGTH = 128;

/** One chord per bar. Aeolian throughout; bVI - bVII - i at every seam. */
const BARS = [
  'Dm', 'Dm', 'Bb', 'C',
  'Dm', 'Bb', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'Dm',
  'Dm', 'Bb', 'Gm', 'Am', 'Dm', 'Bb', 'Gm', 'C',
  'Bbmaj7', 'C', 'Dm', 'Am', 'Bbmaj7', 'C', 'Gm', 'Dm',
  'Dm', 'Bb', 'Bb', 'C',
];
const chordAt = (beat: number): string => BARS[Math.floor(beat / BAR)]!;

function level(beat: number): number {
  if (beat < A) return 0.6;
  if (beat < B) return 0.72;
  if (beat < C) return 0.82;
  if (beat < D) return 0.96;
  return 0.62;
}
const macro = (notes: Note[]): Note[] => sectionMacro(notes, level);

/**
 * The engine: the piano turning over in open fifths and ninths, eighths. Every
 * added tone is diatonic to D Aeolian — the A minor bar takes its octave, not
 * its ninth, because B natural is the raised sixth FFX-2 owns.
 */
const ENGINE_TONES: Record<string, string[]> = {
  Dm: ['D4', 'A4', 'E5', 'D5'],
  Bb: ['Bb3', 'F4', 'C5', 'Bb4'],
  Bbmaj7: ['Bb3', 'F4', 'C5', 'A4'],
  Gm: ['G3', 'D4', 'A4', 'Bb4'],
  Am: ['A3', 'E4', 'A4', 'C5'],
  C: ['C4', 'G4', 'D5', 'E5'],
};

function pianoEngine(): Note[] {
  const order = [0, 1, 2, 1, 3, 2, 1, 2];
  const notes: Note[] = [];
  for (let at = 8; at < LENGTH; at += 0.5) {
    const s = Math.round((at % BAR) * 2);
    const tones = ENGINE_TONES[chordAt(at)]!;
    const v = (s === 0 ? 0.62 : s === 4 ? 0.56 : 0.46) + (s % 2 === 1 ? -0.04 : 0);
    notes.push([at, 0.9, tones[order[s]!]!, at < A ? v * 0.8 : v]);
  }
  return breathe(notes, 32, 0.1);
}

/** The left hand: the root in octaves, once a bar, above C2. */
function pianoLow(): Note[] {
  const notes: Note[] = [];
  for (let at = A; at < LENGTH; at += BAR) {
    const root = rootIn(chordAt(at), 2);
    const v = at >= C && at < D ? 0.6 : 0.5;
    notes.push([at, 3.6, root, v + 0.04], [at, 3.6, root + 12, v]);
  }
  return notes;
}

// --- The tune ------------------------------------------------------------

/** A: FAREWELL_RISE at double length, FAREWELL_FALL, then an answer that climbs. */
function strings(): Note[] {
  const rise = cell(augment(FAREWELL_RISE, 2), A, 'D4');
  const fall = cell(FAREWELL_FALL, A + 8, 'D4');
  const rest = tracker('E4:1 D4:2 -:1 | F4:1 A4:1 D5:2 | D5:3 C5:1 | C5:1 D5:1 E5:2 | F5:3 -:1 |', {
    start: A + 12, gate: 1, checkBars: BAR,
  });
  const a = barArch(concatNotes(rise, fall, rest), A, [0.52, 0.58, 0.64, 0.58, 0.6, 0.68, 0.72, 0.66]);
  const b = barArch(
    concatNotes(
      tracker('Bb4:3 A4:1 | C5:2 E5:2 |', { start: B + 8, gate: 1, checkBars: BAR }),
      tracker('D5:3 C5:1 | G4:2 E5:2 |', { start: B + 24, gate: 1, checkBars: BAR }),
    ),
    B,
    [0, 0, 0.6, 0.64, 0, 0, 0.66, 0.7],
  );
  const c = barArch(
    tracker(
      'D5:3 C5:1 | E5:3 D5:1 | F5:3 E5:1 | A5:2 G5:1 E5:1 | F5:2 D5:2 | E5:1 G5:1 C6:2 | G5:1 F5:1 E5:2 | D5:3 -:1 |',
      { start: C, gate: 1, checkBars: BAR },
    ),
    C,
    [0.7, 0.74, 0.78, 0.82, 0.8, 0.86, 0.9, 0.74],
  );
  return concatNotes(
    lean(a, [[A + 8, A + 11], [A + 12, A + 13], [A + 20, A + 23]]),
    lean(b, [[B + 8, B + 11], [B + 24, B + 27]]),
    lean(c, [[C, C + 3], [C + 4, C + 7], [C + 8, C + 11], [C + 12, C + 14], [C + 26, C + 28]]),
  );
}

/** B: the ship figure, a fourth above where the battle will state it. */
function flute(): Note[] {
  const figure = (at: number): Note[] => tracker(shipFigure('D5'), { start: at, gate: 0.9, checkBars: BAR });
  return concatNotes(
    barArch(figure(B), B, [0.5, 0.56]),
    barArch(figure(B + 16), B + 16, [0.58, 0.64]),
  );
}

/** Horns: open fifths that swell under B, then the peak an octave below the violins. */
function horns(): Note[] {
  const notes: Note[] = [];
  for (let at = B; at < C + 16; at += BAR) {
    const root = rootIn(chordAt(at), 3) - (rootIn(chordAt(at), 3) > 55 ? 12 : 0);
    const v = at < C ? 0.44 + ((at - B) / 32) * 0.16 : 0.64;
    notes.push([at, 2.2, root, v * 0.86], [at + 2, 2.3, root, v], [at, 4.1, root + 7, v * 0.8]);
  }
  const peak = barArch(
    tracker('F4:2 D4:2 | E4:1 G4:1 C5:2 | G4:1 F4:1 E4:2 | D4:3 -:1 |', { start: C + 16, gate: 1, checkBars: BAR }),
    C + 16,
    [0.66, 0.72, 0.76, 0.62],
  );
  return concatNotes(notes, lean(peak, [[C + 26, C + 28]]));
}

// --- Wind and engine -----------------------------------------------------

/** The wind: a high open fourth, bowed so softly it is more air than pitch. */
function wind(): Note[] {
  const notes: Note[] = [];
  for (const [from, to] of [[0, A], [D, LENGTH]] as Array<[number, number]>) {
    for (let at = from; at < to; at += 8) {
      notes.push([at, 4.6, 'A5', 0.26], [at + 3.6, 4.6, 'A5', 0.34], [at, 8.2, 'D6', 0.22]);
    }
  }
  return notes;
}

/** Strings-short: the engine quickening under B and C, open fifths in eighths. */
function engineStrings(): Note[] {
  const notes: Note[] = [];
  for (let at = B; at < D; at += 0.5) {
    const i = Math.round(at * 2);
    const root = rootIn(chordAt(at), 4);
    const v = (i % 2 === 1 ? 0.62 : 0.52) * (at < C ? 0.8 + ((at - B) / 32) * 0.2 : 1);
    notes.push([at, 0.38, root + [0, 7, 12, 7][i % 4]!, v]);
  }
  return breathe(notes, 16, 0.08);
}

/** D2 and A2 under everything; under the peak the low strings follow the roots. */
function drone(): Note[] {
  const notes: Note[] = [];
  for (let at = 0; at < LENGTH; ) {
    const peak = at >= C && at < D;
    const len = peak ? BAR : 8; // under the peak the bows follow the roots, bar by bar
    const lo = peak ? rootIn(chordAt(at), 2) : 38;
    notes.push([at, len * 0.55, lo, 0.46], [at + len * 0.45, len * 0.55, lo, 0.54], [at, len + 0.1, lo + 7, 0.4]);
    at += len;
  }
  return breathe(notes, 32, 0.12);
}

const sub = (): Note[] =>
  breathe(Array.from({ length: LENGTH / BAR }, (_, bar): Note => [bar * BAR, 3.8, rootIn(BARS[bar]!, 1), 0.44]), 24, 0.14);

function taiko(): Note[] {
  return concatNotes(
    drumLine('X.......', { start: 8, step: 0.5, pitch: 'D2', velocity: 0.42, times: 2 }),
    drumLine('X.......x.......', { start: A, step: 0.5, pitch: 'D2', velocity: 0.46, accentVelocity: 0.56, times: 4 }),
    drumLine('X.....x.X.......', { start: B, step: 0.5, pitch: 'D2', velocity: 0.5, accentVelocity: 0.62, times: 4 }),
    drumLine('X.....x.X...x...', { start: C, step: 0.5, pitch: 'D2', velocity: 0.56, accentVelocity: 0.7, times: 4 }),
    drumLine('X.......', { start: D, step: 0.5, pitch: 'D2', velocity: 0.44, times: 4 }),
  );
}

/** Somewhere below the deck, metal answering metal — once every two bars. */
function clangs(): Note[] {
  const notes: Note[] = [];
  for (let at = 0; at < LENGTH; at += 8) {
    notes.push([at + 0.5, 0.8, 'A2', at >= C && at < D ? 0.44 : 0.34], [at + 5.5, 0.6, 'D3', 0.26]);
  }
  return notes;
}

function timpani(): Note[] {
  return [
    [C, 1.6, 'Bb2', 0.62],
    [C + 8, 1.4, 'D3', 0.56],
    [C + 16, 1.6, 'Bb2', 0.66],
    ...Array.from({ length: 12 }, (_, s): Note => [C + 24 + s * 0.25, 0.3, 'G2', 0.4 + s * 0.035]),
    [C + 28, 1.8, 'D3', 0.7],
  ];
}

/** Two long cymbal swells: the cloud line at C, and the air before the loop. */
const swells: Note[] = [
  [8, 4, 'C5', 0.26],
  [C, 2.4, 'C5', 0.5],
  [LENGTH - 4, 4, 'C5', 0.3],
];

export const sceneFahrenheitTrack: Track = {
  name: 'scene-fahrenheit',
  bpm: 104,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.72, damp: 0.4, width: 0.98, preDelay: 0.018 },
    delay: { timeBeats: 0.75, feedback: 0.24, damp: 2800 },
  },
  channels: [
    { name: 'piano engine', instrument: 'piano', volume: 0.56, pan: 0.08, notes: macro(pianoEngine()), fx: { reverb: 0.3, delay: 0.06 } },
    { name: 'piano low', instrument: 'piano', volume: 0.5, pan: -0.06, notes: macro(pianoLow()), fx: { reverb: 0.3 } },
    { name: 'violins', instrument: 'strings', volume: 0.78, pan: 0.12, notes: macro(strings()), fx: { reverb: 0.34 } },
    { name: 'flute', instrument: 'flute', volume: 0.52, pan: -0.08, notes: macro(flute()), fx: { reverb: 0.34, delay: 0.14 } },
    { name: 'horns', instrument: 'brass', volume: 0.6, pan: -0.16, notes: macro(horns()), fx: { reverb: 0.3 } },
    { name: 'wind', instrument: 'strings', volume: 0.36, pan: 0, notes: macro(wind()), fx: { reverb: 0.5 } },
    { name: 'engine strings', instrument: 'strings-short', volume: 0.42, pan: 0.28, notes: macro(engineStrings()), fx: { reverb: 0.24 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.5, pan: -0.04, notes: macro(drone()), fx: { reverb: 0.4 } },
    { name: 'sub', instrument: 'bass-sub', volume: 0.36, pan: 0, notes: macro(sub()) },
    { name: 'taiko', instrument: 'taiko', volume: 0.5, pan: -0.18, notes: macro(taiko()), fx: { reverb: 0.3 } },
    { name: 'engine clangs', instrument: 'metal-hit', volume: 0.26, pan: 0.34, notes: macro(clangs()), fx: { reverb: 0.4 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.56, pan: 0.08, notes: macro(timpani()), fx: { reverb: 0.34 } },
    { name: 'cymbal', instrument: 'crash', volume: 0.3, pan: 0.1, notes: macro(swells), fx: { reverb: 0.5 } },
  ],
};

export default sceneFahrenheitTrack;
