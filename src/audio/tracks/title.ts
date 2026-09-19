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
import { rit, accel, tempoMap } from '../tempo.ts';
import { cell } from './motifs.ts';
import {
  bars,
  clearPedal,
  clip,
  descent,
  micro,
  perform,
  swell,
  tiedSwell,
  type Appoggiatura,
} from './menus-perform.ts';

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
    at,
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
    // a breath, not a pause. THEMES.md's 8%. The *pulse* also slows across
    // that rest now (see the tempo map), and the two do different jobs: this
    // one leans the melody over the barline, that one takes the whole room
    // with it.
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

/**
 * The four notes at the top of the game: the prayer, on one flute, alone.
 *
 * No agogic pull, and the tempo map does not start until beat 8: THEMES.md
 * gives HYMN **zero** rubato wherever it appears — *"a congregation does not
 * rubato"* — and four notes of it are still it. The space after the fourth
 * note is a written rest, which is the right place for space.
 */
function fluteCameo(): Note[] {
  const head = cell(HYMN_HEAD, 0, 'A4', 0.52);
  return perform(head, { jitter: 0.02, salt: 3 });
}

/**
 * The flute answers the middle section with `FAREWELL_RISE` — four notes that
 * are both the title's oldest cell and the incipit of the theme the piano has
 * been playing for a minute. Nobody has to notice.
 */
function fluteAnswer(): Note[] {
  return perform(cell(FAREWELL_RISE, MIDDLE + 8, 'A4', 0.46), {
    breaths: [MIDDLE + 12],
    // Was 0.14. The pulse itself now slows from 55 to 50 across exactly these
    // four beats, so the line no longer has to fake the gesture on its own.
    pull: 0.07,
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

/**
 * The whole line is one falling chain — `C5 - B4 - A4 - G4 - E4` — so it is
 * written as one.
 *
 * It used to declare a single pair, B4 onto A4, and let `contour` take care of
 * the rest: *"chaining a second declared lean onto A4 would make it both a
 * leaning note and a resolution — `lean()` treats it as the first, and the
 * margin on the pair above collapses to almost nothing."* That was a true
 * statement about `lean()` and the wrong conclusion. What `contour` gives a
 * falling step is -0.021 against the jitter's +/-0.02, so two of the four links
 * came out of the render backwards — C5 quieter than the B4 under it, A4
 * quieter than the G4. A voice at the back of the hall that gets *louder* as it
 * descends is not distant, it is a fader being pushed.
 *
 * `descent()` lays all five on one falling line and keeps their mean, so she
 * fades as she falls and the level is the one the reprise was balanced at.
 */
const DISTANT_FALL = [
  A2_START + 16,
  A2_START + 20,
  A2_START + 24,
  A2_START + 26,
  A2_START + 28,
];

function distantVoice(): Note[] {
  const line = tracker(DISTANT, { start: A2_START + 16, checkBars: BAR, velocity: 0.5 });
  const played = perform(line, {
    slope: 0.02,
    jitter: 0.02,
    salt: 23,
    breaths: [A2_START + 31],
    pull: 0.06,
  });
  // Last, so that nothing above can invert it.
  return descent(played, DISTANT_FALL, 0.04);
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

/**
 * The pulse.
 *
 * FAREWELL is *"58 bpm with real rubato"*, and until tempo maps existed the
 * rubato had to be written into the note values — which moves a note but
 * leaves the left hand, the bass and the string bed sitting on a grid
 * underneath it. That is the sound of a mock-up: one line breathing and the
 * room refusing to. This cue is not a waltz, so it gets no inner-bar lilt;
 * what it gets is the three gestures THEMES.md actually names for this theme,
 * at the sizes it names.
 *
 *   beat 23, 39, 71  **the breath at a phrase end.** Bars 4 and 8 rest on
 *                    their last beat, in every part. Slowing the pulse across
 *                    a rest widens a silence instead of stretching a note,
 *                    and nobody can hear a silence wobble.
 *   beat 40          **poco meno.** The planing 7ths have no functional
 *                    motion at all, so the only thing that can make them
 *                    arrive is the pulse stepping back — 55 against 58.
 *   beat 48-52       **rit. to 50** under the flute's four-note answer, then
 *                    an accelerando back through beat 56 into the reprise.
 *   beat 56          **A′ is broader**, 56 rather than 58: five players
 *                    instead of one, and the room is bigger.
 *   beat 83-87       **rit. to 46** — 18% across the last two notes, which is
 *                    the bible's figure for a ritardando you can hear — and
 *                    then the final rest at 42, a real linger.
 *   beat 88          **a tempo**, back to 58. That mark is load-bearing: the
 *                    loop restarts at beat 8, where the tempo is 58, so the
 *                    wrap lands on the pulse it left. Without it the cue
 *                    would come round at 42 and lurch, every time, forever.
 *
 * Beats 0-8 carry no mark. That is `HYMN_HEAD` on the flute, and the hymn gets
 * zero rubato in every cue in this score.
 */
const TITLE_TEMPO = tempoMap(
  { beat: A_START, bpm: 'base', label: 'A — solo piano' },
  { beat: A_START + 15, bpm: 50, label: 'breath (bar 4)' },
  { beat: A_START + 16, bpm: 'base', label: 'a tempo' },
  { beat: A_START + 31, bpm: 49, label: 'breath (bar 8)' },
  { beat: MIDDLE, bpm: 55, label: 'poco meno — the planing 7ths' },
  rit(MIDDLE + 8, MIDDLE + 12, 50, 'rit. under the flute answer'),
  accel(MIDDLE + 12, A2_START, 56, "a tempo — A', broader"),
  { beat: A2_START + 15, bpm: 48, label: 'breath (bar 4)' },
  { beat: A2_START + 16, bpm: 56, label: 'a tempo' },
  rit(A2_START + 27, A2_START + 31, 46, 'rit. — the close that will not close'),
  { beat: A2_START + 31, bpm: 42, label: 'lingering' },
  { beat: LENGTH, bpm: 'base', label: 'a tempo (the loop turns over)' },
);

export const titleTrack: Track = {
  name: 'title',
  bpm: 58,
  tempo: TITLE_TEMPO,
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
      // The shared `piano` preset is a concert grand at 3 ms, which is tighter
      // than a hand can be. THEMES.md puts solo piano at 6-9 and `piano-felt`
      // in voices/presets/menus-clair-obscur.ts — the voice this cue is
      // written for — says 7. One desk, not every cue that names a piano.
      perform: { timingJitterMs: 7 },
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
      perform: { timingJitterMs: 7 },
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
      perform: { timingJitterMs: 7 },
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
      // A quartet behind a reprise, not twenty desks: 22 ms is the spread of a
      // section and it is the wrong sound for this room. 12 is what
      // `string-quartet` carries, and why.
      perform: { timingJitterMs: 12 },
      notes: stringBed(),
      fx: { reverb: 0.44 },
    },
    {
      name: 'cello',
      instrument: VOICE.cello,
      volume: 0.44,
      pan: -0.24,
      // One player on a counter-line. THEMES.md's solo-strings band is 8-12,
      // against the section preset's 24.
      perform: { timingJitterMs: 9 },
      notes: celloLine(),
      fx: { reverb: 0.4 },
    },
    {
      name: 'distant voice',
      instrument: VOICE.voice,
      // ONE voice at the far end of the hall, under the reprise and never on
      // top of it. Two of the three things that put her there reach the
      // shipped MP3: her level, and her timing. The `choir` preset is a
      // section on risers and scatters its entries by 34 ms, and a 34 ms
      // scatter is exactly what makes several voices read as a block laid over
      // the texture; 10 ms is one singer, which is what `soprano-distant`
      // asks for and inside THEMES.md's 8-12 solo band. The third is the
      // reverb send, and in the sampled render the seat wins it — `choir`
      // sits at depth 0.88 and sends 0.65 whatever a channel says — so 0.78
      // here is for the synthesised fallback, the only path that reads it.
      volume: 0.18,
      pan: 0.14,
      perform: { timingJitterMs: 10 },
      notes: distantVoice(),
      fx: { reverb: 0.78, delay: 0.14 },
    },
  ],
};

/**
 * Every appoggiatura in this cue, as data.
 *
 * THEMES.md: *"the leaning note is LOUDER than its resolution … This is the
 * single most important number in this file."* `perform()` runs `lean()` last
 * so that nothing downstream can invert one, but "the code is careful" is not
 * evidence — so the pairs are exported, and an audit reads the built track and
 * checks each against the velocities the renderer will play.
 *
 * Bars 2 and 6 are the theme's signature rhythm — hold three beats, step down
 * one — at two of its four heights; bars 3 and 7 are the inner sighs. Both
 * statements of the phrase are listed because A and A′ are two different
 * channels' worth of notes, and the reprise is the one that used to come out
 * with no arch at all.
 */
const MELODY_PAIRS: Array<[offset: number, to: number, where: string]> = [
  [4, 7, 'bar 2 — the signature fall'],
  [20, 23, 'bar 6 — the same fall, a tone up'],
  [10, 11, 'bar 3 — the inner sigh'],
  [26, 27, 'bar 7 — the inner sigh'],
];

export const APPOGGIATURAS: Appoggiatura[] = [
  ...(
    [
      [A_START, 'A'],
      [A2_START, "A'"],
    ] as Array<[number, string]>
  ).flatMap(([at, statement]) =>
    MELODY_PAIRS.map(([from, to, where]) => ({
      channel: 'piano melody',
      lean: at + from,
      resolve: at + to,
      where: `${statement} ${where}`,
    })),
  ),
  // The distant voice's four links, as a chain: C5 B4 A4 G4 E4, each one a
  // colour note of its chord, each one quieter than the one before it.
  ...DISTANT_FALL.slice(0, -1).map((beat, i) => ({
    channel: 'distant voice',
    lean: beat,
    resolve: DISTANT_FALL[i + 1]!,
    where: [
      "A' soprano — the b3 of Am onto the maj7 of C",
      "A' soprano — the maj7 of C onto the 5th of Dm",
      "A' soprano — the 5th of Dm onto its b3",
      "A' soprano — down to the 5th of Am, and gone",
    ][i]!,
  })),
];

export default titleTrack;
