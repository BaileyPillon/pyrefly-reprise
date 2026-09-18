/**
 * "Tide, Remembered" — title theme.
 *
 * ORIGINAL COMPOSITION. Nothing here quotes any existing work. The material is
 * the score's own FAREWELL theme from `themes.ts`, imported, never retyped.
 *
 * THE CUE MAP (docs/audio/THEMES.md §The cue map, row 1):
 *   FAREWELL bars 1-8 only, solo piano, in A MINOR — a tone below the theme's
 *   real key — and the phrase never finishes. `HYMN_HEAD` on flute at the very
 *   top. The one emotion: *a story that is already over, being told anyway.*
 *
 * So the title screen is the score's central theme, unfinished and in the wrong
 * key, and the player will not find out until the ending. Two things carry
 * that: the tune stops at bar 8 and never gets its climb (bars 9-12 are spent
 * in four cues in the whole game, and this is not one of them), and A′ closes
 * over `Fmaj7` instead of `Am`, so the last bar of the loop is the one chord
 * that cannot be an ending.
 *
 * Form (4/4, 58 bpm, 88 beats ≈ 91 s):
 *   beats   0-4    flute alone: `HYMN_HEAD` in A minor, four notes
 *   beats   4-6    silence, then one low rolled fifth from the piano
 *   beats   8-40   A    FAREWELL bars 1-8, solo piano            <- loop start
 *   beats  40-56   planing 7ths over an A pedal; the flute answers
 *                  with `FAREWELL_RISE` — the theme's own first four notes
 *   beats  56-88   A′   the same eight bars, strings, cello, distant voice
 * Loop 8 → 88: the flute cameo happens once and the story circles forever.
 */

import {
  arpLine,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  midiFromName,
  nameFromMidi,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  FAREWELL_CHORDS_HALF,
  FAREWELL_DYNAMICS,
  FAREWELL_RH,
  FAREWELL_RISE,
  HYMN_HEAD,
} from './themes.ts';
import { cell } from './motifs.ts';
import { bars, clearPedal, clip, micro, perform, swell, tiedSwell } from './menus-perform.ts';

/**
 * Which sampled voice each part actually names.
 *
 * Every name here exists in BOTH registries — the sampled presets and the
 * synthesised `INSTRUMENTS` — because the synthesised path is the runtime
 * safety net and `getInstrument()` throws on a name it does not know. The
 * commented names are the voices this cue actually wants (see
 * `voices/presets/menus-clair-obscur.ts`); switching over is this map, once
 * request #1 in docs/audio/requests-menus-clair-obscur.md lands.
 */
const VOICE = {
  piano: 'piano', // want: 'piano-felt'
  flute: 'flute', // want: 'flute-alone'
  strings: 'strings', // want: 'string-quartet'
  cello: 'strings-low',
  harp: 'harp', // want: 'harp-close'
  voice: 'choir', // want: 'soprano-distant'
} as const;

const BAR = 4;
const A_START = 8;
const MIDDLE = 40;
const A2_START = 56;
const LENGTH = 88;

/** B minor down to A minor. The theme only reaches its own key in `ending-ffx`. */
const HOME = -2;

/** Transpose a chord symbol, quality and slash bass intact. */
function shift(symbol: string, semitones: number): string {
  return symbol
    .split('/')
    .map((part) => {
      const match = /^([A-G][#b]?)(.*)$/.exec(part);
      if (!match) throw new Error(`Bad chord symbol "${symbol}"`);
      const root = nameFromMidi(midiFromName(`${match[1]!}4`) + semitones).replace(/-?\d+$/, '');
      return `${root}${match[2] ?? ''}`;
    })
    .join('/');
}

/** FAREWELL bars 1-8, half-bar changes, in A minor. */
const HALF_CHORDS = FAREWELL_CHORDS_HALF.slice(0, 16).map((c) => shift(c, HOME));
/** The same eight bars, one symbol per bar: Am Dm G Fmaj7 Am C Dm Am. */
const BAR_CHORDS = HALF_CHORDS.filter((_, i) => i % 2 === 0);

/**
 * A′ refuses to close. Bar 8's second half moves to the bVI with its major 7th,
 * so the tune's home note lands as somebody else's third and the loop turns
 * over unresolved. Three characters of difference; it is the whole cue.
 */
const HALF_CHORDS_OPEN = HALF_CHORDS.map((c, i) => (i === 15 ? shift('Gmaj7', HOME) : c));

/** Per-bar dynamics for bars 1-8, from the theme's own table. */
const DYN = FAREWELL_DYNAMICS.slice(0, 8);
const scale = (table: number[], by: number): number[] => table.map((v) => v * by);

/**
 * The tune. `+12` on top of the transposition: at written pitch the theme sits
 * inside the left hand's own register, and a melody competing with its own
 * accompaniment is the fastest way to sound like a mock-up.
 */
function melody(at: number, table: number[], salt: number): Note[] {
  const whole = tracker(FAREWELL_RH, { checkBars: BAR, transpose: HOME + 12, velocity: 0.7 });
  return perform(bars(whole, 0, 32, at), {
    table,
    barBeats: BAR,
    // Bars 2 and 6: hold three beats, step down one. The held note leans and
    // must be the louder of the pair — THEMES.md's most important number.
    leans: [
      [at + 4, at + 7],
      [at + 20, at + 23],
    ],
    // The two smaller sighs inside bars 3 and 7, which lean the same way.
    softLeans: [
      [at + 10, at + 11],
      [at + 26, at + 27],
    ],
    // Bars 4 and 8 end early and rest. Lengthen the last note into the rest —
    // a breath, not a pause.
    breaths: [at + 15, at + 31],
    pull: 0.08,
    salt,
  });
}

/**
 * Left hand: six broken-chord notes per half bar, triplet-spaced, pedalled and
 * cleared on every barline. Never a repeated-note ostinato — that texture
 * belongs to somebody else's famous piece (THEMES.md §FAREWELL resemblance).
 */
function leftHand(at: number, chords: string[], velocity: number, salt: number): Note[] {
  const figure = arpLine(chords, {
    start: at,
    barBeats: 2,
    pattern: [0, 2, 3, 4, 3, 2],
    step: 1 / 3,
    dur: 0.62,
    octave: 2,
    velocity,
    accent: 1.22,
  });
  // The same arch as the tune, applied as a multiplier so the figure keeps its
  // own downbeat accent, and the two phrase-ends lift with the melody.
  const shaped = swell(figure, DYN, BAR, at);
  const breathing = clip(shaped, [
    [at + 15, at + 16],
    [at + 31, at + 32],
  ]);
  return micro(clearPedal(breathing, BAR, 1 / 3, at), 0.03, salt);
}

/** Root on the downbeat, doubled an octave down only at the two phrase heads. */
function bassLine(at: number, table: number[]): Note[] {
  const roots = chordRoots(BAR_CHORDS, 2);
  const notes: Note[] = [];
  roots.forEach((midi, bar) => {
    const velocity = (table[bar] ?? 0.6) * 0.72;
    notes.push([at + bar * BAR, 3.5, midi, velocity]);
    if (bar === 0 || bar === 4) notes.push([at + bar * BAR, 3.5, midi - 12, velocity * 0.85]);
  });
  return micro(notes, 0.02, 7);
}

/** The four notes at the top of the game: the prayer, on one flute, alone. */
function fluteCameo(): Note[] {
  const head = cell(HYMN_HEAD, 0, 'A4', 0.52);
  return perform(head, { breaths: [4], pull: 0.12, jitter: 0.02, salt: 3 });
}

/**
 * The flute answers the middle section with `FAREWELL_RISE` — four notes that
 * are both the title's oldest cell and the incipit of the theme the piano has
 * been playing for a minute. Nobody has to notice.
 */
function fluteAnswer(): Note[] {
  return perform(cell(FAREWELL_RISE, MIDDLE + 8, 'A4', 0.46), {
    breaths: [MIDDLE + 12],
    pull: 0.14,
    jitter: 0.02,
    salt: 5,
  });
}

/**
 * The middle: four seventh chords planed down by step over an A pedal, with no
 * functional motion at all. Impressionist colour, and the only place in the cue
 * where the harmony is not the theme's.
 */
const MIDDLE_CHORDS = ['Fmaj7', 'Em7', 'Dm9', 'Cmaj7'];

/** The middle steps back as it falls, and lifts on the last bar into A′. */
const MIDDLE_DYN = [0.72, 0.66, 0.58, 0.64];

function middleKeys(): Note[] {
  const voiced = chordLine(MIDDLE_CHORDS, {
    start: MIDDLE,
    barBeats: BAR,
    octave: 3,
    center: 64,
    dur: 3.7,
    velocity: 0.4,
    roll: 0.07,
  });
  const pedal: Note[] = [
    [MIDDLE, 8, midiFromName('A1'), 0.34],
    [MIDDLE + 8, 8, midiFromName('A1'), 0.3],
  ];
  return micro(concatNotes(swell(voiced, MIDDLE_DYN, BAR, MIDDLE), pedal), 0.025, 11);
}

function middleHarp(): Note[] {
  const figure = arpLine(MIDDLE_CHORDS, {
    start: MIDDLE,
    barBeats: BAR,
    pattern: [0, 1, 2, 3, 4, 3, 2, 1],
    step: 0.5,
    dur: 1.1,
    octave: 3,
    center: 72,
    velocity: 0.26,
    accent: 1.15,
  });
  return micro(swell(figure, MIDDLE_DYN, BAR, MIDDLE), 0.03, 13);
}

/** The curtain: one low fifth, rolled, two beats before the theme starts. */
function curtain(): Note[] {
  const tones = chordMidis('Am', { octave: 2, bassOctaves: 1 }).filter((m) => m < 62);
  return tones.map((midi, i): Note => [6 + i * 0.09, 2.4 - i * 0.09, midi, 0.3 - i * 0.02]);
}

/** A′: the string bed, entering under the reprise and never above it. */
function stringBed(): Note[] {
  const chords = chordLine(HALF_CHORDS_OPEN, {
    start: A2_START,
    barBeats: 2,
    octave: 3,
    center: 62,
    // 2.08 rather than 2: the 0.08-beat overlap is ~80 ms at 58 bpm, which is
    // the string-legato number in THEMES.md. Bowed notes have to touch.
    dur: 2.08,
    velocity: 0.42,
    roll: 0.05,
  });
  const shaped = swell(chords, DYN, BAR, A2_START);
  // The section lifts its bows where the tune breathes. A string bed that
  // plays through the phrase mark is the difference between an orchestra and
  // an organ, and it is the first thing that makes a reprise sound like a pad.
  const breathing = clip(shaped, [
    [A2_START + 15, A2_START + 16],
    [A2_START + 31, A2_START + 32],
  ]);
  // Bars 5-8 grow: each chord becomes two tied attacks, the second louder, so
  // the reprise swells inside itself where the renderer cannot.
  const held = breathing.filter((n) => n[0] < A2_START + 16);
  const growing = tiedSwell(breathing.filter((n) => n[0] >= A2_START + 16));
  return micro(concatNotes(held, growing), 0.03, 17);
}

/**
 * Cello counter-line under A′ — original, stepwise, and moving when the tune
 * holds. Written against the bar chords: Am Dm G Fmaj7 Am C Dm|Em Am.
 */
const CELLO = `
  A2:3 C3:1 | D3:4       | G2:3 B2:1 | C3:2 A2:2 |
  A2:4      | C3:3 E3:1  | D3:2 E3:2 | A2:4      |
`;

function celloLine(): Note[] {
  // Enters at bar 3, two bars after the strings and two before the voice.
  // Staggering the entries is what makes a reprise *arrive* instead of being
  // switched on: at bar 1 there are two players in the room and by bar 5 there
  // are five, and nobody ever played a crescendo.
  const line = tracker(CELLO, { start: A2_START, checkBars: BAR, velocity: 0.44 }).filter(
    (n) => n[0] >= A2_START + 8,
  );
  return perform(line, {
    slope: 0.035,
    jitter: 0.03,
    salt: 19,
    breaths: [A2_START + 16, A2_START + 32],
    pull: 0.06,
  });
}

/**
 * The distant voice, bars 5-8 of A′ only: a wordless stepwise descent under the
 * tune — C5 B4 A4 G4 E4, each one a colour note of its chord (the b3 over Am,
 * the major 7th over C, the 5th then the b3, the 5th). It never sings the tune
 * and it never sings the head: both are forbidden by the theme's resemblance
 * guard, and both would be worse music anyway.
 */
const DISTANT = `
  C5:4 | B4:4 | A4:2 G4:2 | E4:3 -:1 |
`;

function distantVoice(): Note[] {
  const line = tracker(DISTANT, { start: A2_START + 16, checkBars: BAR, velocity: 0.5 });
  return perform(line, { slope: 0.02, jitter: 0.02, salt: 23, breaths: [A2_START + 31], pull: 0.1 });
}

function harpA2(): Note[] {
  const figure = arpLine(BAR_CHORDS, {
    start: A2_START,
    barBeats: BAR,
    pattern: [0, 1, 2, 3, 4, 3],
    step: 0.5,
    dur: 1.4,
    octave: 3,
    center: 71,
    velocity: 0.22,
    accent: 1.2,
  });
  return micro(
    clip(
      swell(figure, DYN, BAR, A2_START).filter((n) => n[0] >= A2_START + 4),
      [
        [A2_START + 15, A2_START + 16],
        [A2_START + 31, A2_START + 32],
      ],
    ),
    0.025,
    29,
  );
}

export const titleTrack: Track = {
  name: 'title',
  bpm: 58,
  timeSig: [4, 4],
  loop: { start: A_START, end: LENGTH },
  length: LENGTH,
  tailSec: 6,
  fx: {
    // One hall, long and soft-topped. The damping is what keeps a big room from
    // sounding like a plate on a piano.
    reverb: { room: 0.9, damp: 0.26, width: 0.95, preDelay: 0.035 },
    delay: { timeBeats: 0.75, feedback: 0.26, damp: 2400 },
  },
  channels: [
    {
      name: 'flute cameo',
      instrument: VOICE.flute,
      volume: 0.62,
      pan: -0.12,
      notes: concatNotes(fluteCameo(), fluteAnswer()),
      fx: { reverb: 0.5, delay: 0.18 },
    },
    {
      name: 'piano melody',
      instrument: VOICE.piano,
      volume: 1,
      pan: -0.05,
      notes: concatNotes(
        melody(A_START, scale(DYN, 0.88), 2),
        melody(A2_START, scale(DYN, 1.0), 4),
      ),
      fx: { reverb: 0.3 },
    },
    {
      name: 'piano left hand',
      instrument: VOICE.piano,
      volume: 0.52,
      pan: 0.1,
      notes: concatNotes(
        curtain(),
        leftHand(A_START, HALF_CHORDS, 0.3, 31),
        middleKeys(),
        leftHand(A2_START, HALF_CHORDS_OPEN, 0.34, 37),
      ),
      fx: { reverb: 0.3 },
    },
    {
      name: 'piano bass',
      instrument: VOICE.piano,
      volume: 0.46,
      pan: -0.02,
      notes: concatNotes(bassLine(A_START, scale(DYN, 0.9)), bassLine(A2_START, DYN)),
      fx: { reverb: 0.22 },
    },
    {
      name: 'harp',
      instrument: VOICE.harp,
      volume: 0.4,
      pan: -0.3,
      notes: concatNotes(middleHarp(), harpA2()),
      fx: { reverb: 0.46, delay: 0.2 },
    },
    {
      name: 'strings',
      instrument: VOICE.strings,
      volume: 0.5,
      pan: 0.06,
      notes: stringBed(),
      fx: { reverb: 0.44 },
    },
    {
      name: 'cello',
      instrument: VOICE.cello,
      volume: 0.44,
      pan: -0.24,
      notes: celloLine(),
      fx: { reverb: 0.4 },
    },
    {
      name: 'distant voice',
      instrument: VOICE.voice,
      volume: 0.22,
      pan: 0.14,
      notes: distantVoice(),
      fx: { reverb: 0.6 },
    },
  ],
};

export default titleTrack;
