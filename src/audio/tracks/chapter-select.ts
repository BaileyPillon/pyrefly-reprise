/**
 * "Threshold, Unhurried" — chapter-select menu theme.
 *
 * ORIGINAL COMPOSITION. The material is the score's own FAREWELL theme, in its
 * waltz form, imported from `themes.ts` and never retyped.
 *
 * THE CUE MAP (docs/audio/THEMES.md §The cue map, row 2):
 *   `HYMN_HEAD` alone, four notes, solo flute, then silence; then
 *   `FAREWELL_WALTZ` bars 1-8, B minor, 3/4, 84 bpm, and it loops there.
 *   The one emotion: *unhurried choosing; nothing here can hurt you yet.*
 *
 * **Bars 1-8 only, and that is a rule, not an omission.** The anti-fatigue rule
 * says the two cues a player hears most never get the theme's heart: bars 9-12
 * — the climb and the ache — appear in four cues in the whole game and none of
 * them is a menu. What keeps four minutes of this bearable is therefore
 * orchestration, not new tunes: the same sixteen phrases arrive four times and
 * are a different room each time.
 *
 * Form (3/4, 84 bpm, 102 beats ≈ 73 s):
 *   beats   0-6    flute alone: `HYMN_HEAD` in B minor, then two beats of air
 *   beats   6-30   P1  piano alone — bass on 1, chord on 2 and 3   <- loop start
 *   beats  30-54   P2  harp takes the waltz; the quartet doubles the tune
 *   beats  54-78   P3  THE INVERSION: the tune drops to the cellos and the
 *                      chords are voiced above it; a distant voice, four bars
 *   beats  78-102  P4  back to one piano, quieter than P1, harp echo
 * Loop 6 → 102: the flute happens once and the waltz turns forever.
 */

import {
  arpLine,
  chordMidis,
  concatNotes,
  midiFromName,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { FAREWELL_CHORDS, FAREWELL_DYNAMICS, FAREWELL_RISE, FAREWELL_WALTZ, HYMN_HEAD } from './themes.ts';
import { cell } from './motifs.ts';
import { bars, clip, micro, perform, swell } from './menus-perform.ts';

/**
 * Which sampled voice each part names. Every one exists in the synthesised
 * registry too, so the runtime fallback still makes sound if an MP3 ever fails
 * to decode; the commented names are what this cue wants once request #1 in
 * docs/audio/requests-menus-clair-obscur.md lands.
 */
const VOICE = {
  piano: 'piano', // want: 'piano-felt'
  flute: 'flute', // want: 'flute-alone'
  quartet: 'strings', // want: 'string-quartet'
  cello: 'strings-low',
  harp: 'harp', // want: 'harp-close'
  voice: 'choir', // want: 'soprano-distant'
  celesta: 'celesta',
} as const;

const BAR = 3;
const PASS = 24;
const P1 = 6;
const P2 = P1 + PASS;
const P3 = P2 + PASS;
const P4 = P3 + PASS;
const LENGTH = P4 + PASS;

/** FAREWELL bars 1-8, one chord per bar: Bm Em A Gmaj7 Bm D Em Bm. */
const CHORDS = FAREWELL_CHORDS.slice(0, 8);

/**
 * Bar 7 is two chords: `Em | F#m` — the iv, then the MODAL MINOR v where a
 * dominant is expected. Withholding the leading tone there is why the phrase
 * sounds resigned rather than dramatic, so the waltz's third beat has to change
 * chord with it.
 */
const LATE: Record<number, string> = { 6: 'F#m' };

/**
 * Colour for the third pass only: added 6ths and 9ths instead of sevenths, and
 * a `7sus4` in place of the modal minor v — a hanging dominant with its third
 * suspended away, which is the Clair Obscur register's own gesture and still
 * contains no leading tone. Not one melody note moves.
 */
const CHORDS_COLOUR = ['Bmadd9', 'Em7', 'A', 'Gmaj7', 'Bmadd9', 'D', 'Em6', 'Bm'];
const LATE_COLOUR: Record<number, string> = { 6: 'F#7sus4' };

const DYN = FAREWELL_DYNAMICS.slice(0, 8);
const scale = (table: number[], by: number): number[] => table.map((v) => v * by);

/**
 * The tune. `FAREWELL_WALTZ` is the theme re-barred into 3/4 — it survives the
 * meter change because its cells are three- and four-note groups — and
 * `octaves` puts it wherever the pass needs it.
 */
function melody(at: number, table: number[], octaves: number, salt: number): Note[] {
  const whole = tracker(FAREWELL_WALTZ, {
    checkBars: BAR,
    transpose: 12 * octaves,
    velocity: 0.7,
  });
  return perform(bars(whole, 0, PASS, at), {
    table,
    barBeats: BAR,
    // Bars 2 and 6, the signature rhythm at two of its four heights: hold, step
    // down. The held note is the appoggiatura and it is the louder of the pair.
    leans: [
      [at + 3, at + 5],
      [at + 15, at + 17],
    ],
    softLeans: [
      [at + 7, at + 8],
      [at + 19, at + 20],
    ],
    // Bars 4 and 8 rest on their third beat. The rest is the phrase mark.
    breaths: [at + 11, at + 23],
    pull: 0.08,
    salt,
  });
}

interface WaltzOptions {
  chords?: string[];
  late?: Record<number, string>;
  /** Root octave for the beat-1 bass. Omit for the inverted pass. */
  bassOctave?: number | null;
  /** Where the beats 2 and 3 chord sits. */
  octave: number;
  center: number;
  bassVelocity?: number;
  chordVelocity?: number;
  salt?: number;
}

/**
 * Oom-pah-pah: bass root on beat 1, chord on 2 and 3.
 *
 * The one detail that stops this being a metronome is that beat 2 is a shade
 * stronger than beat 3 — a waltz leans forward into its second beat and lets
 * the third one go. Written as velocity because the renderer has one tempo.
 */
function waltz(at: number, options: WaltzOptions): Note[] {
  const chords = options.chords ?? CHORDS;
  const late = options.late ?? LATE;
  const bassVelocity = options.bassVelocity ?? 0.5;
  const chordVelocity = options.chordVelocity ?? 0.42;
  const notes: Note[] = [];
  chords.forEach((symbol, bar) => {
    const barStart = at + bar * BAR;
    if (options.bassOctave !== null && options.bassOctave !== undefined) {
      const [root] = chordMidis(symbol, { octave: options.bassOctave });
      notes.push([barStart, 0.92, root!, bassVelocity]);
      notes.push([barStart, 0.92, root! + 12, bassVelocity * 0.8]);
    }
    for (const beat of [1, 2]) {
      const useSymbol = beat === 2 ? (late[bar] ?? symbol) : symbol;
      const tones = chordMidis(useSymbol, { octave: options.octave, center: options.center });
      const velocity = beat === 1 ? chordVelocity : chordVelocity * 0.84;
      for (const [i, midi] of tones.entries()) {
        notes.push([barStart + beat + i * 0.012, 0.86, midi, velocity]);
      }
    }
  });
  // Two things stop this being a metronome with chords on it. The arch: the
  // accompaniment leans and falls back with the tune instead of sitting at one
  // level for eight bars, which is the constant-velocity channel THEMES.md
  // forbids. And the breath: bars 4 and 8 rest on beat 3 in the melody, so the
  // waltz lifts there too and the phrase mark is audible in every part.
  const shaped = swell(notes, DYN, BAR, at);
  return micro(
    clip(shaped, [
      [at + 11, at + 12],
      [at + 23, at + 24],
    ]),
    0.03,
    options.salt ?? 41,
  );
}

/** Harp arpeggiating the same waltz — one bar, one sweep up and back. */
function harpWaltz(at: number, chords: string[], velocity: number, salt: number): Note[] {
  const figure = arpLine(chords, {
    start: at,
    barBeats: BAR,
    pattern: [0, 2, 3, 4, 3, 2],
    step: 0.5,
    dur: 0.72,
    octave: 3,
    center: 69,
    velocity,
    accent: 1.2,
  });
  return micro(
    clip(swell(figure, DYN, BAR, at), [
      [at + 11, at + 12],
      [at + 23, at + 24],
    ]),
    0.03,
    salt,
  );
}

/** The prayer's head, four notes on one flute, then two beats of nothing. */
function fluteCameo(): Note[] {
  return perform(cell(HYMN_HEAD, 0, 'B4', 0.5), {
    breaths: [4],
    pull: 0.12,
    jitter: 0.02,
    salt: 3,
  });
}

/**
 * P3's distant voice: four bars of long tones over the inverted texture, then
 * it stops for the rest of the cue. Each note is a colour tone of its chord —
 * the b3 over Bm, the 5th over Em7, the 3rd over A, the 3rd over Gmaj7 — so it
 * floats without ever being the tune. It never sings the theme and never sings
 * the head; the resemblance guards forbid both, and this is better anyway.
 */
const DISTANT = `
  D5:3 | B4:3 | C#5:3 | B4:2 -:1 |
`;

function distantVoice(): Note[] {
  return perform(tracker(DISTANT, { start: P3, checkBars: BAR, velocity: 0.5 }), {
    slope: 0.02,
    jitter: 0.02,
    salt: 23,
    breaths: [P3 + 11],
    pull: 0.1,
  });
}

/**
 * The last two bars of P4, on celesta: `FAREWELL_RISE`, the theme's own first
 * four notes, alone. It lands on the loop point, so the phrase the cue ends on
 * is the phrase it begins with, one instrument thinner.
 */
function celestaTag(): Note[] {
  return perform(cell(FAREWELL_RISE, LENGTH - 5, 'B4', 0.34), {
    jitter: 0.02,
    salt: 43,
    breaths: [LENGTH - 1],
    pull: 0.1,
  });
}

/** A low open fifth under P3, where the bass has moved out of the way. */
function pedal(): Note[] {
  return [
    [P3, 12, midiFromName('B2'), 0.3],
    [P3, 12, midiFromName('F#3'), 0.24],
    [P3 + 12, 12, midiFromName('B2'), 0.28],
    [P3 + 12, 12, midiFromName('F#3'), 0.22],
  ];
}

export const chapterSelectTrack: Track = {
  name: 'chapter-select',
  bpm: 84,
  timeSig: [3, 4],
  loop: { start: P1, end: LENGTH },
  length: LENGTH,
  tailSec: 5,
  fx: {
    reverb: { room: 0.88, damp: 0.28, width: 0.95, preDelay: 0.03 },
    delay: { timeBeats: 0.75, feedback: 0.24, damp: 2500 },
  },
  channels: [
    {
      name: 'flute cameo',
      instrument: VOICE.flute,
      volume: 0.6,
      pan: -0.12,
      notes: fluteCameo(),
      fx: { reverb: 0.52, delay: 0.16 },
    },
    {
      name: 'piano melody',
      instrument: VOICE.piano,
      volume: 0.92,
      pan: -0.05,
      notes: concatNotes(
        melody(P1, scale(DYN, 0.86), 1, 2),
        melody(P2, scale(DYN, 0.8), 1, 4),
        melody(P4, scale(DYN, 0.72), 1, 6),
      ),
      fx: { reverb: 0.32 },
    },
    {
      name: 'piano waltz',
      instrument: VOICE.piano,
      volume: 0.52,
      pan: 0.12,
      notes: concatNotes(
        waltz(P1, { octave: 3, center: 59, bassOctave: 2, salt: 41 }),
        // P3 inverts the texture: no bass at all, and the chord voiced ABOVE
        // the melody, which has gone down to the cellos.
        waltz(P3, {
          chords: CHORDS_COLOUR,
          late: LATE_COLOUR,
          octave: 4,
          center: 78,
          bassOctave: null,
          chordVelocity: 0.3,
          salt: 47,
        }),
        waltz(P4, { octave: 3, center: 59, bassOctave: 2, bassVelocity: 0.4, chordVelocity: 0.33, salt: 53 }),
      ),
      fx: { reverb: 0.34 },
    },
    {
      name: 'harp waltz',
      instrument: VOICE.harp,
      volume: 0.46,
      pan: -0.28,
      notes: concatNotes(
        harpWaltz(P2, CHORDS, 0.3, 59),
        harpWaltz(P3, CHORDS_COLOUR, 0.24, 61),
        harpWaltz(P4, CHORDS, 0.18, 67),
      ),
      fx: { reverb: 0.44, delay: 0.18 },
    },
    {
      name: 'quartet',
      instrument: VOICE.quartet,
      volume: 0.54,
      pan: 0.04,
      // P2 doubles the tune an octave below the piano — two players agreeing,
      // which is what makes the second pass feel like more without being louder.
      notes: melody(P2, scale(DYN, 0.62), 0, 8),
      fx: { reverb: 0.42 },
    },
    {
      name: 'cellos',
      instrument: VOICE.cello,
      volume: 0.6,
      pan: 0.2,
      // P3: the melody itself, at written pitch, under everything else.
      notes: concatNotes(melody(P3, scale(DYN, 0.66), 0, 10), pedal()),
      fx: { reverb: 0.4 },
    },
    {
      name: 'distant voice',
      instrument: VOICE.voice,
      volume: 0.22,
      pan: 0.16,
      notes: distantVoice(),
      fx: { reverb: 0.6 },
    },
    {
      name: 'celesta',
      instrument: VOICE.celesta,
      volume: 0.34,
      pan: 0.3,
      notes: celestaTag(),
      fx: { reverb: 0.5, delay: 0.28 },
    },
  ],
};

export default chapterSelectTrack;
