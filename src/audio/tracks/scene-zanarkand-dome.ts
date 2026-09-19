/**
 * "Where the Tide Stopped" — the ruined dome at dusk.
 *
 * ORIGINAL COMPOSITION. B Aeolian, 4/4, 48 bpm. A nocturne: solo piano with
 * the melody an octave up over rolling broken chords, a harmonised hymn in
 * the middle of it, and a wordless voice alone at the climb.
 *
 * THEMES (docs/audio/THEMES.md §1, §2 and the cue map, row 11)
 *   FAREWELL as a nocturne — melody transposed +12, left hand in broken
 *   chords that roll rather than repeat (the resemblance guard forbids a
 *   repeated-note ostinato here, because that texture belongs to somebody
 *   else's famous piece). Bars 1-8, then the hymn, then bars 9-12 with the
 *   voice alone and THE PIANO ENTIRELY SILENT under her, then bars 13-16.
 *   HYMN bars 1-8, harmonised in strings, in E Aeolian — the subdominant of
 *   this cue's key, so the prayer arrives a fifth below the nocturne without
 *   a modulation. This is the ONLY time in the whole score the hymn is warm.
 *   Celesta doubles bar 11's peak an octave up and is allowed to ring.
 *
 * THE ONE EMOTION: warmth remembered, which is worse than cold.
 *
 * Performance rules applied: the piano is pedalled (gate 0.98 plus a reverb
 * send held through the bar) and the left hand clears on the bar line; the
 * appoggiaturas lean; the rests written into bars 4, 8 and 13 are left empty;
 * the left hand thickens from triplets to sixteenths at the repeat so the
 * texture moves without the dynamics having to.
 *
 * Tempo: the bible gives the nocturne 48 bpm and the hymn 56, and a track used
 * to have exactly one. It has a map now, so the hymn is played at the tempo it
 * was written at (request 2 in docs/audio/requests-ffx-general.md, and
 * THEMES.md's own renderer request 1, both closed) and the nocturne around it
 * bends the way a nocturne does. See `TEMPO` below.
 *
 * Form (26 bars, 104 beats, 126.2 s through the map):
 *   bars  1- 2  intro    beats   0-  8  piano alone, two bare fifths
 *   bars  3-10  nocturne beats   8- 40  FAREWELL bars 1-8, melody +12   <- loop start
 *   bars 11-18  hymn     beats  40- 72  HYMN bars 1-8, strings, warm
 *   bars 19-22  climb    beats  72- 88  FAREWELL bars 9-12, voice alone, no piano
 *   bars 23-26  close    beats  88-104  FAREWELL bars 13-16, piano and strings
 */

import {
  aTempo,
  accel,
  arpLine,
  chordLine,
  chordRoots,
  concatNotes,
  rit,
  tempoMap,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  FAREWELL_CHORDS,
  FAREWELL_DYNAMICS,
  FAREWELL_RH,
  HYMN_ALTO,
  HYMN_BASS,
  HYMN_CHORDS,
  HYMN_SOPRANO,
  HYMN_TENOR,
  agogic,
  lean,
  shapeByBar,
} from './themes.ts';

const BAR = 4;
const NOCTURNE = 8;
const HYMN = 40;
const CLIMB = 72;
const CLOSE = 88;
const LENGTH = 104;

/** The nocturne is quiet everywhere: the whole cue sits under the theme's own table. */
const HUSH = 0.72;

function farewell(start: number, fromBar: number, toBar: number, trim: number, up = 12): Note[] {
  const from = (fromBar - 1) * BAR;
  const to = toBar * BAR;
  const shaped = shapeByBar(
    tracker(FAREWELL_RH, { gate: 1, transpose: up, checkBars: BAR }),
    FAREWELL_DYNAMICS.map((v) => Math.min(1, v * trim)),
    BAR,
  );
  // Every appoggiatura the theme states, including bar 12's `[44, 46]` — the
  // F#4 held over the bVI as the cue walks out of the climax. That pair was
  // missing, so the wordless voice, whose four bars are exactly 9-12, sang it
  // at 0.546 against 0.546: the one gesture she has, rendered flat.
  const leaned = lean(shaped, [[4, 7], [20, 23], [36, 39], [44, 46], [52, 55], [60, 62]]);
  const breathed = agogic(leaned, [15, 31, 48, 64], 0.08);
  return breathed
    .filter((n) => n[0] >= from - 1e-6 && n[0] < to - 1e-6)
    .map((n): Note => [n[0] - from + start, n[1] * 0.98, n[2], n[3]]);
}

// ---------------------------------------------------------------------------
// Piano
// ---------------------------------------------------------------------------

/** Two bare fifths and a lot of room. Nothing has happened yet. */
const INTRO_PIANO = `
  -:1 B2+F#3:3 | -:1 E3+B3:2 -:1 |
`;

/**
 * The left hand rolls: root, fifth, octave, tenth and back. The last note of
 * each bar is cut to four tenths of its step, which is how a pedal clears on
 * a bar line when the renderer has no pedal events (request 4).
 */
function leftHand(start: number, chords: string[], step: number, velocity: number): Note[] {
  const notes = arpLine(chords, {
    start, barBeats: BAR, pattern: [0, 2, 3, 4, 5, 4, 3, 2], step, dur: step * 0.95,
    octave: 2, center: 50, velocity, accent: 1.1,
  });
  return notes.map((n): Note => {
    const inBar = (n[0] - start) % BAR;
    return inBar > BAR - step - 1e-6 ? [n[0], step * 0.4, n[2], (n[3] ?? velocity) * 0.75] : n;
  });
}

function pianoMelody(): Note[] {
  return concatNotes(
    tracker(INTRO_PIANO, { start: 0, velocity: 0.34, gate: 0.98, checkBars: BAR }),
    farewell(NOCTURNE, 1, 8, HUSH),
    // The climb belongs to the voice. The piano does not play under her at all.
    farewell(CLOSE, 13, 16, HUSH - 0.06),
  );
}

function pianoLeft(): Note[] {
  return concatNotes(
    leftHand(NOCTURNE, FAREWELL_CHORDS.slice(0, 4), 0.3333, 0.3),
    leftHand(NOCTURNE + 16, FAREWELL_CHORDS.slice(4, 8), 0.25, 0.32),
    leftHand(CLOSE, FAREWELL_CHORDS.slice(12, 16), 0.3333, 0.26),
  );
}

function pianoBass(): Note[] {
  return concatNotes(
    chordRoots(FAREWELL_CHORDS.slice(0, 8), 1).map((midi, bar): Note => [
      NOCTURNE + bar * BAR, 3.6, midi, bar % 2 === 0 ? 0.3 : 0.24,
    ]),
    chordRoots(FAREWELL_CHORDS.slice(12, 16), 1).map((midi, bar): Note => [
      CLOSE + bar * BAR, 3.6, midi, 0.22,
    ]),
  );
}

// ---------------------------------------------------------------------------
// The hymn, harmonised — the one time it is ever warm
// ---------------------------------------------------------------------------

function hymnVoice(src: string, arch: number[]): Note[] {
  return tracker(src, { gate: 0.99, checkBars: BAR })
    .filter((n) => n[0] < 8 * BAR - 1e-6)
    .map((n): Note => {
      const bar = Math.floor(n[0] / BAR);
      return [n[0] + HYMN, n[1], n[2], arch[Math.min(bar, arch.length - 1)]!];
    });
}

/**
 * THE AMEN, and the one appoggiatura the hymn states in the eight bars this
 * cue plays: bar 8, the 2 held over the iv6 and falling home — cue beats 68
 * and 70. A per-bar arch hands both notes one level, so the prayer's own
 * cadence was landing at 0.42 against 0.42: dead flat, in the one cue where
 * THEMES.md lets the hymn be warm.
 *
 * Upper voices only. The bible voices this cadence so the 2 is the top note of
 * the chord and the loudest note of the pair; the bass's A2 to E2 underneath
 * is root motion, not a leaning note, and levelling it would just make the
 * cadence louder instead of making it ache.
 */
const HYMN_AMEN: Array<[number, number]> = [[HYMN + 28, HYMN + 30]];
const LEAN = 0.04;

function leanPairs(notes: Note[], pairs: Array<[number, number]>): Note[] {
  const up = new Set(pairs.map((pair) => pair[0]));
  const down = new Set(pairs.map((pair) => pair[1]));
  return notes.map((n): Note => {
    const v = n[3] ?? 0.8;
    if (up.has(n[0])) return [n[0], n[1], n[2], Math.min(1, v + LEAN)];
    if (down.has(n[0])) return [n[0], n[1], n[2], Math.max(0.05, v - LEAN)];
    return n;
  });
}

const HYMN_ARCH = [0.4, 0.46, 0.5, 0.42, 0.44, 0.5, 0.54, 0.42];

function stringsUpper(): Note[] {
  return concatNotes(
    leanPairs(hymnVoice(HYMN_SOPRANO, HYMN_ARCH), HYMN_AMEN),
    leanPairs(hymnVoice(HYMN_ALTO, HYMN_ARCH.map((v) => v - 0.06)), HYMN_AMEN),
    // and the last four bars of the nocturne, under the piano
    farewell(CLOSE, 13, 16, HUSH - 0.2, 0).map((n): Note => [n[0], n[1], n[2], n[3]]),
  );
}

function stringsLower(): Note[] {
  return concatNotes(
    hymnVoice(HYMN_TENOR, HYMN_ARCH.map((v) => v - 0.08)),
    hymnVoice(HYMN_BASS, HYMN_ARCH.map((v) => v - 0.04)),
    chordRoots(FAREWELL_CHORDS.slice(12, 16), 2).map((midi, bar): Note => [
      CLOSE + bar * BAR, 3.8, midi, 0.3,
    ]),
  );
}

// ---------------------------------------------------------------------------
// The voice, alone
// ---------------------------------------------------------------------------

/**
 * FAREWELL bars 9-12, wordless, with nothing underneath but a held low string
 * and the pad. She never gets the head — the resemblance guard reserves that
 * — and she stops when the climb does.
 */
function voiceLine(): Note[] {
  return farewell(CLIMB, 9, 12, 0.78).map((n): Note => [n[0], n[1], n[2], n[3]]);
}

/**
 * The celesta doubles the peak of bar 11 — the B the melody touches twice and
 * cannot hold — an octave above it, and is left to ring for eight beats. It
 * plays four notes in the whole cue.
 */
function celestaLine(): Note[] {
  return [
    [HYMN + 20, 6, 'E6', 0.2],
    [CLIMB + 8, 8, 'B6', 0.34],
    [CLIMB + 9, 7, 'F#6', 0.24],
    [CLOSE + 12, 6, 'B5', 0.2],
  ];
}

/** One rolled chord a bar through the climb: the harp is here for light, not notes. */
function harpLine(): Note[] {
  return concatNotes(
    chordLine(FAREWELL_CHORDS.slice(8, 12), {
      start: CLIMB, octave: 4, center: 74, velocity: 0.3, dur: 3.7, roll: 0.1,
    }),
    chordLine(HYMN_CHORDS.slice(5, 7), {
      start: HYMN + 20, octave: 4, center: 74, velocity: 0.24, dur: 3.7, roll: 0.14,
    }),
  );
}

/**
 * Nothing in this score holds one velocity for thirty seconds. The pad is the
 * quietest thing in the cue and the longest — three sections, one level each,
 * seventy-six notes — which makes it the most machine-like channel here and
 * the cheapest to fix: a slow swell and a deterministic per-note wobble, both
 * far too small to hear as a device.
 */
function breathe(notes: Note[], periodBeats: number, depth: number, wobble = 0): Note[] {
  return notes.map((n, i): Note => {
    const swell = 1 + depth * Math.sin((2 * Math.PI * n[0]) / periodBeats);
    const jitter = wobble === 0 ? 1 : 1 + wobble * Math.sin(i * 2.399963);
    return [n[0], n[1], n[2], Math.max(0.02, Math.min(1, (n[3] ?? 0.8) * swell * jitter))];
  });
}

function padLine(): Note[] {
  return concatNotes(
    chordLine(FAREWELL_CHORDS.slice(0, 8), { start: NOCTURNE, octave: 3, center: 62, velocity: 0.12, dur: 3.85, roll: 0.06 }),
    chordLine(HYMN_CHORDS.slice(0, 8), { start: HYMN, octave: 3, center: 62, velocity: 0.16, dur: 3.85, roll: 0.06 }),
    chordLine(FAREWELL_CHORDS.slice(8, 16), { start: CLIMB, octave: 3, center: 62, velocity: 0.22, dur: 3.85, roll: 0.06 }),
  );
}

/** Low strings hold under the voice — the only thing she has to stand on. */
function lowHold(): Note[] {
  return concatNotes(
    chordRoots(FAREWELL_CHORDS.slice(8, 12), 2).map((midi, bar): Note => [
      CLIMB + bar * BAR, 3.8, midi, 0.3 + bar * 0.04,
    ]),
    chordRoots(HYMN_CHORDS.slice(0, 8), 2).map((midi, bar): Note => [
      HYMN + bar * BAR, 3.8, midi, 0.26,
    ]),
  );
}

function bellLine(): Note[] {
  return [
    [0, 5, 'B2', 0.42],
    [HYMN, 5, 'E3', 0.36],
    [CLOSE, 5.5, 'B2', 0.34],
  ];
}

/**
 * THE TEMPO MAP — a nocturne's rubato, and the hymn's own tempo back.
 *
 * Two jobs. The first is the compromise this file has carried since it was
 * written: THEMES.md gives the nocturne 48 bpm and the hymn inside it 56, and
 * with one `bpm` per track the prayer was played slower than it was written.
 * `[40, 56]` and `aTempo(72)` give it back; the strings now sing the hymn at
 * the tempo the bible set, and the piano returns to 48 under the climb.
 *
 * The second is that a nocturne is the piece of music least tolerant of a
 * grid. Each gesture below is one THEMES.md names, with its number:
 *
 *   breaths      the phrase ends at FAREWELL bars 4 and 8 (cue beats 23 and
 *                39) ease back over the last three beats, 48 -> 43/42, and
 *                the next phrase begins in tempo.
 *   the hymn     bars 11-18, one steady 56. A congregation does not rubato,
 *                so there is not a single mark inside those eight bars.
 *   the climb    FAREWELL bars 9-10 under the voice alone: 48 -> 52 across
 *                beats 72-78, so she arrives early and eager.
 *   the arrival  bar 11, the note she cannot hold: the pulse drops to 44 on
 *                its downbeat and the accompaniment widens with her.
 *   the close    bars 13-16 come home a step slower at 46, and the last ache
 *                — the C#4 over the Em6 falling to B3 — gets the ritardando,
 *                46 -> 40 across beats 100-102.
 *
 * There is no fermata anywhere in this cue, and that is deliberate: the left
 * hand is still rolling through the final ritardando (its last note is at beat
 * 103.67), and a hold stops time for everything, so it would have torn a
 * silence into the middle of the figure. The rit. slows the arpeggio with the
 * melody instead, which is what a pianist's hands do anyway.
 *
 * `aTempo(104)` restores 48 on `loop.end`, which is the tempo at `loop.start`
 * (beat 8), so the wrap does not lurch.
 */
/**
 * HUMANISATION, to the bible's own table (THEMES.md §Humanisation: solo piano
 * 6-9 ms, section strings and choir 14-18).
 *
 * The presets sit outside it — `piano` 3 ms, `strings` 22, `strings-low` 24,
 * `choir` 34, `pad` 30 — and a nocturne is the least forgiving music there is
 * about a piano that lands on the grid. The presets are shared with every
 * other cue and are not this arranger's to move, so the channels say how they
 * want to be played (PIPELINE.md, "Per-channel performance overrides"): 7 ms
 * for the hands, about 16 for everything that plays in sections.
 */
const PIANO_HANDS = { timingJitterMs: 7 } as const;
const SECTION = { humanise: 0.73 } as const;
const SECTION_LOW = { humanise: 0.67 } as const;
const CHOIR = { humanise: 0.47 } as const;
const PAD = { humanise: 0.53 } as const;

const TEMPO = tempoMap(
  rit(21, 24, 43, 'breath — bar 4'),
  aTempo(24),
  rit(37, 40, 42, 'breath — bar 8'),
  [40, 56], // THE HYMN, at the tempo THEMES.md wrote it at
  aTempo(72), // the nocturne again, and the voice alone
  accel(72, 78, 52, 'eager into the climb'),
  [80, 44], // THE ARRIVAL — broaden onto bar 11
  aTempo(84),
  [88, 46], // home a step slower
  rit(100, 102, 40, 'rit. — the last ache'),
  aTempo(104), // the pulse the loop restarts on
);

export const zanarkandDomeTrack: Track = {
  name: 'scene-zanarkand-dome',
  bpm: 48,
  tempo: TEMPO,
  timeSig: [4, 4],
  loop: { start: NOCTURNE, end: LENGTH },
  length: LENGTH,
  tailSec: 7,
  fx: {
    reverb: { room: 0.93, damp: 0.22, width: 1, preDelay: 0.05 },
    delay: { timeBeats: 1.5, feedback: 0.24, damp: 2200 },
  },
  channels: [
    { name: 'piano', instrument: 'piano', volume: 1.28, pan: -0.04, perform: PIANO_HANDS, notes: pianoMelody(), fx: { reverb: 0.3 } },
    { name: 'piano left hand', instrument: 'piano', volume: 0.74, pan: 0.12, perform: PIANO_HANDS, notes: pianoLeft(), fx: { reverb: 0.3 } },
    { name: 'piano bass', instrument: 'piano', volume: 0.6, pan: 0, perform: PIANO_HANDS, notes: pianoBass(), fx: { reverb: 0.24 } },
    { name: 'strings upper', instrument: 'strings', volume: 0.6, pan: 0.1, perform: SECTION, notes: stringsUpper(), fx: { reverb: 0.45 } },
    { name: 'strings lower', instrument: 'strings-low', volume: 0.52, pan: -0.14, perform: SECTION_LOW, notes: stringsLower(), fx: { reverb: 0.4 } },
    { name: 'voice', instrument: 'choir', volume: 0.66, pan: 0.06, perform: CHOIR, notes: voiceLine(), fx: { reverb: 0.65, delay: 0.18 } },
    { name: 'low hold', instrument: 'strings-low', volume: 0.44, pan: 0.18, perform: SECTION_LOW, notes: lowHold(), fx: { reverb: 0.4 } },
    { name: 'celesta', instrument: 'celesta', volume: 0.44, pan: 0.24, notes: celestaLine(), fx: { reverb: 0.55, delay: 0.3 } },
    { name: 'harp', instrument: 'harp', volume: 0.46, pan: -0.3, notes: breathe(harpLine(), 16, 0.14, 0.05), fx: { reverb: 0.45, delay: 0.25 } },
    { name: 'pad', instrument: 'pad', volume: 0.42, pan: 0.04, perform: PAD, notes: breathe(padLine(), 24, 0.18, 0.06), fx: { reverb: 0.5 } },
    { name: 'bell', instrument: 'bell', volume: 0.38, pan: 0.32, notes: bellLine(), fx: { reverb: 0.65, delay: 0.35 } },
  ],
};

export default zanarkandDomeTrack;
