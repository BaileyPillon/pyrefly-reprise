/**
 * "The Unsent Hymn" — the dread that arrives before the boss does.
 *
 * ORIGINAL COMPOSITION. D minor (the hymn's E Aeolian moved down a tone),
 * 4/4, 90 bpm. Choir over one low pedal, timpani, brass swells, one bell.
 *
 * THEMES (docs/audio/THEMES.md cue map, row 5)
 *   HYMN — "Still Water", the congregation's prayer, sung here by something
 *   that is not a congregation: bars 1-8 quiet over the pedal, bars 9-16 with
 *   the brass underneath it, then HYMN_HEAD alone as a canon at the octave,
 *   four notes chasing themselves over a floor that never moves. The prayer's
 *   own plagal AMEN closes the cue, exactly as it closes the hymn.
 *   SEYMOUR — "Noble Rot" as a two-bar counter-line in the contrabasses at
 *   half volume, three times. He is in the room before you meet him, and the
 *   cue never acknowledges him.
 *
 * THE ONE EMOTION: something is watching, and it is patient.
 *
 * Performance rules applied: the hymn takes NO rubato — a congregation does
 * not rubato, and this cue therefore has no tempo map and wants none — but it
 * is never flat either, so every entry carries a written four-bar arch; the
 * breath in bar 4 (all four voices rest on beat 4) is left empty; Seymour's
 * snap up to the b6 is QUIETER than the note before it (0.52 against 0.74),
 * which is the whole character, so nothing may level it. The three places the
 * hymn states an appoggiatura — the bar 11 climax and the two amens — lean
 * (see `LEAN_PAIRS`), and the canon's four-note head has its own small arch,
 * because "a four-bar arch" gives one bar one level and a bar with two notes
 * in it therefore had no shape at all.
 *
 * Form (32 bars, 128 beats, 85.3 s):
 *   bars  1- 4  intro   beats   0- 16  pedal, one toll, a cymbal breathing in
 *   bars  5-12  A       beats  16- 48  HYMN bars 1-8, choir over the pedal  <- loop start
 *   bars 13-20  A'      beats  48- 80  HYMN bars 9-16: the climax, brass, timpani
 *   bars 21-28  canon   beats  80-112  HYMN_HEAD augmented, at the octave, over the drone
 *   bars 29-32  A''     beats 112-128  the head once more, then the amen, then nothing
 */

import {
  chordLine,
  chordRoots,
  concatNotes,
  motif,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  AMEN,
  HYMN_ALTO,
  HYMN_BASS,
  HYMN_HEAD,
  HYMN_SOPRANO,
  HYMN_TENOR,
  SEYMOUR,
  augment,
} from './themes.ts';

const BAR = 4;
const A = 16;
const A2 = 48;
const CANON = 80;
const OUTRO = 112;
const LENGTH = 128;

/** The hymn is in E Aeolian; this cue is a tone below it. */
const DOWN = -2;

/**
 * HYMN's harmony, moved to D minor. Five chords, no dominant anywhere — that
 * absence is what makes it a rite rather than a song, and it is the reason
 * this cue can sit under a boss without ever promising a resolution.
 */
const HYMN_1_8 = ['Dm', 'Dm', 'F', 'F', 'Gm', 'Gm', 'Dm', 'Dm', 'Dm', 'Dm', 'Gm', 'Bb', 'C', 'C', 'Gm', 'Dm'];
const HYMN_9_16 = ['Bb', 'Bb', 'F', 'C', 'Bbmaj7', 'Bbmaj7', 'F', 'Gm', 'Dm', 'Dm', 'Gm', 'F', 'Bb', 'F', 'Gm', 'Dm'];
const INTRO_BARS = ['Dm', 'Dm', 'Dm', 'Dm'];
const CANON_BARS = ['Dm', 'Dm', 'Gm', 'Dm', 'Bb', 'Bb', 'Gm', 'Dm'];
const OUTRO_BARS = ['Dm', 'F', 'Gm', 'Dm'];

/** One symbol per bar for the whole cue — the pedal, the drone and the timpani read this. */
const ALL_BARS = [
  ...INTRO_BARS,
  ...HYMN_1_8.filter((_, i) => i % 2 === 0),
  ...HYMN_9_16.filter((_, i) => i % 2 === 0),
  ...CANON_BARS,
  ...OUTRO_BARS,
];

// ---------------------------------------------------------------------------
// The prayer
// ---------------------------------------------------------------------------

/**
 * Lift bars `fromBar`-`toBar` out of a sixteen-bar hymn voice and restate them
 * at `start`, in this cue's key. The hymn is never retyped and never edited;
 * the bible's data is the only source for these pitches.
 */
function hymnVoice(src: string, fromBar: number, toBar: number, start: number, arch: number[]): Note[] {
  const from = (fromBar - 1) * BAR;
  const to = toBar * BAR;
  return tracker(src, { transpose: DOWN, gate: 0.99, checkBars: BAR })
    .filter((n) => n[0] >= from - 1e-6 && n[0] < to - 1e-6)
    .map((n): Note => {
      const bar = Math.floor((n[0] - from) / BAR);
      return [n[0] - from + start, n[1], n[2], arch[Math.min(bar, arch.length - 1)]!];
    });
}

/**
 * THE APPOGGIATURA RULE, at the three places this cue's hymn states one, as
 * (leaning beat, resolving beat) in the cue's own beats.
 *
 * A four-bar arch hands a whole bar one level, so a bar holding two notes came
 * out dead flat — and two of these three bars are the hymn's own cadence.
 *
 *   beat  44 / 46   HYMN bar 8, THE AMEN: the 2 over the iv falling home
 *   beat  56 / 59   HYMN bar 11, THE CLIMAX: the highest note in the prayer,
 *                   held three beats over the Cmaj7 and stepping down. It was
 *                   0.82 against 0.82 — the loudest note in the cue, and no
 *                   lean on it at all.
 *   beat  76 / 78   HYMN bar 16, the amen again, "identical to bar 8"
 *
 * Half of THEMES.md's 0.08 goes up and half goes down, so the pair opens to
 * the full 0.08 without the climax getting louder than the arch intended.
 * Upper voices only: the bible puts the ache in the top voice ("Voice it so
 * the 2 is the top note of the chord and the loudest note of the pair"), and
 * the bass's bar-8 motion is a falling fourth — a root, not a leaning note.
 */
const LEAN_PAIRS: Array<[number, number]> = [[44, 46], [56, 59], [76, 78]];
const LEAN = 0.04;

function leanPairs(notes: Note[], pairs: Array<[number, number]>): Note[] {
  const up = new Set(pairs.map((p) => p[0]));
  const down = new Set(pairs.map((p) => p[1]));
  return notes.map((n): Note => {
    const v = n[3] ?? 0.8;
    if (up.has(n[0])) return [n[0], n[1], n[2], Math.min(1, v + LEAN)];
    if (down.has(n[0])) return [n[0], n[1], n[2], Math.max(0.05, v - LEAN)];
    return n;
  });
}

/** A' is the half of the hymn with the climax in it, so it is the loud half. */
const ARCH_A = [0.5, 0.56, 0.6, 0.52, 0.54, 0.6, 0.64, 0.5];
const ARCH_A2 = [0.6, 0.68, 0.82, 0.66, 0.62, 0.6, 0.56, 0.48];
const ARCH_LOW = ARCH_A.map((v) => v - 0.08);
const ARCH_LOW_2 = ARCH_A2.map((v) => v - 0.1);

function upperVoices(): Note[] {
  return concatNotes(
    leanPairs(hymnVoice(HYMN_SOPRANO, 1, 8, A, ARCH_A), LEAN_PAIRS),
    leanPairs(hymnVoice(HYMN_ALTO, 1, 8, A, ARCH_A.map((v) => v - 0.06)), LEAN_PAIRS),
    leanPairs(hymnVoice(HYMN_SOPRANO, 9, 16, A2, ARCH_A2), LEAN_PAIRS),
    leanPairs(hymnVoice(HYMN_ALTO, 9, 16, A2, ARCH_A2.map((v) => v - 0.06)), LEAN_PAIRS),
    // A'' — the head returns unchanged. That return is what makes it a hymn.
    hymnVoice(HYMN_SOPRANO, 1, 2, OUTRO, [0.44, 0.4]),
    hymnVoice(HYMN_ALTO, 1, 2, OUTRO, [0.38, 0.34]),
    // and the amen it has closed on twice already: the 2 over the iv, falling
    // home. The leaning note is the louder of the two — it always is.
    motif(augment(AMEN, 2), [OUTRO + 8], ['D4']).map(
      (n): Note => [n[0], n[1], n[2], n[0] < OUTRO + 12 ? 0.48 : 0.4],
    ),
  );
}

function lowerVoices(): Note[] {
  return concatNotes(
    hymnVoice(HYMN_TENOR, 1, 8, A, ARCH_LOW),
    hymnVoice(HYMN_BASS, 1, 8, A, ARCH_LOW),
    hymnVoice(HYMN_TENOR, 9, 16, A2, ARCH_LOW_2),
    hymnVoice(HYMN_BASS, 9, 16, A2, ARCH_LOW_2),
    hymnVoice(HYMN_TENOR, 1, 2, OUTRO, [0.34, 0.3]),
    hymnVoice(HYMN_BASS, 1, 2, OUTRO, [0.34, 0.3]),
    motif(augment(AMEN, 2), [OUTRO + 8], ['D3']).map(
      (n): Note => [n[0], n[1], n[2], n[0] < OUTRO + 12 ? 0.36 : 0.3],
    ),
  );
}

/**
 * The canon. HYMN_HEAD at double length — eight beats for four notes — with a
 * second voice an octave above, four beats behind. The entries never line up
 * into a chord; they line up into a machine that happens to be made of a
 * prayer.
 */
/**
 * The head is `1 - b7 - 1 - b3`: a lower neighbour that falls and then LIFTS,
 * and the lift is the point of it. Every entry used to be four notes at one
 * velocity — a phrase held flat, which THEMES.md bans — so each entry now
 * carries the shape the four notes describe: away on the neighbour, back on
 * the return, and the b3 on top. This is not the Yunalesca canon; that is the
 * one the bible locks at 0.62, and it is in another cue.
 */
const HEAD_SHAPE = [1, 0.92, 0.97, 1.08];

function canonVoices(octave: 0 | 12): Note[] {
  const head = augment(HYMN_HEAD, 2);
  const offset = octave === 0 ? 0 : 4;
  const tonic = octave === 0 ? 'D3' : 'D4';
  const levels = octave === 0 ? [0.5, 0.56, 0.6] : [0.42, 0.46, 0.5];
  return concatNotes(
    ...[0, 8, 16].map((bar, i) =>
      motif(head, [CANON + bar + offset], [tonic]).map(
        (n, k): Note => [n[0], n[1] * 0.99, n[2], Math.min(1, levels[i]! * (HEAD_SHAPE[k] ?? 1))],
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Seymour, uninvited
// ---------------------------------------------------------------------------

/**
 * His velocity shape, verbatim from the bible: the courteous snap up to the
 * b6 is thrown away — quieter than the note before it. The whole character is
 * in that dropped note, so nothing downstream is allowed to put it back.
 */
const SEYMOUR_SHAPE = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];

function seymourCounter(): Note[] {
  const shaped = SEYMOUR.map((n, i): Note => [n[0], n[1], n[2], SEYMOUR_SHAPE[i]!]);
  return concatNotes(
    ...[A + 16, CANON + 8, CANON + 24].map((beat) => motif(shaped, [beat], ['D2'])),
  );
}

// ---------------------------------------------------------------------------
// The floor
// ---------------------------------------------------------------------------


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

/** A heartbeat on the root: heavy on 1, leaning on 3, never hurried. */
const PEDAL: Note[] = [
  [0, 1.4, 0, 0.72],
  [1.5, 0.8, 0, 0.44],
  [2, 1.4, 0, 0.6],
  [3.5, 0.4, 0, 0.4],
];

const PEDAL_DOUBLE: Note[] = [
  [0, 0.9, 0, 0.78],
  [1, 0.45, 0, 0.42],
  [1.5, 0.45, 0, 0.5],
  [2, 0.9, 0, 0.68],
  [3, 0.45, 0, 0.44],
  [3.5, 0.45, 7, 0.52],
];

function pedalLine(): Note[] {
  const roots = chordRoots(ALL_BARS, 2);
  const notes: Note[] = [];
  ALL_BARS.forEach((_, bar) => {
    const at = bar * BAR;
    const pattern = at >= A2 && at < CANON ? PEDAL_DOUBLE : PEDAL;
    const trim = at < A ? 0.72 : at >= OUTRO ? 0.6 : 1;
    notes.push(
      ...motif(pattern, [at], [roots[bar]!]).map((n): Note => [n[0], n[1], n[2], (n[3] ?? 0.6) * trim]),
    );
  });
  return notes;
}

function timpaniLine(): Note[] {
  const roots = chordRoots(ALL_BARS, 2);
  const notes: Note[] = [];
  ALL_BARS.forEach((_, bar) => {
    const at = bar * BAR;
    const root = roots[bar]!;
    if (at < A) {
      notes.push([at, 2, root, bar === 0 ? 0.52 : 0.34]);
      return;
    }
    if (at >= A2 && at < CANON) {
      // Under the climax the timpani breathes rather than strikes — but only
      // in the second bar of each pair, so eight bars do not come out as eight
      // identical crescendos. The swell grows across the section, not inside
      // the bar.
      const pair = ((at - A2) / BAR) % 2;
      if (pair === 0) {
        notes.push([at, 2.2, root, 0.3]);
        notes.push([at + 3, 0.9, root, 0.24]);
        return;
      }
      const climb = (at - A2) / (CANON - A2);
      for (let s = 0; s < 8; s++) notes.push([at + s * 0.5, 0.46, root, 0.24 + climb * 0.2 + (s / 8) * 0.3]);
      return;
    }
    if (at >= OUTRO) {
      notes.push([at, 2.5, root, 0.32]);
      return;
    }
    notes.push([at, 1.5, root, at >= CANON ? 0.6 : 0.5]);
    if (at >= CANON) notes.push([at + 2.5, 1, root, 0.4]);
  });
  return notes;
}

function tolls(): Note[] {
  return [
    [0, 4, 'D3', 0.62],
    [A, 4, 'D3', 0.48],
    [A2, 4, 'Bb2', 0.5],
    [CANON, 4, 'D3', 0.56],
    [OUTRO + 8, 5, 'D3', 0.44],
  ];
}

/** Long notes make the crash a suspended-cymbal swell rather than a hit. */
function cymbalSwells(): Note[] {
  return [
    [12, 3.5, 'C5', 0.3],
    [A2 - 2, 2.5, 'C5', 0.36],
    [CANON - 2, 2.5, 'C5', 0.42],
    [OUTRO - 2, 2.5, 'C5', 0.3],
  ];
}

function stringBed(): Note[] {
  return concatNotes(
    chordLine(HYMN_1_8, { start: A, barBeats: 2, octave: 3, center: 62, velocity: 0.26, dur: 1.95 }),
    chordLine(HYMN_9_16, { start: A2, barBeats: 2, octave: 3, center: 64, velocity: 0.4, dur: 1.95 }),
    chordLine(CANON_BARS, { start: CANON, octave: 3, center: 62, velocity: 0.3, dur: 3.9 }),
    chordLine(OUTRO_BARS, { start: OUTRO, octave: 3, center: 62, velocity: 0.22, dur: 3.9 }),
  );
}

/** Brass arrives only for the hymn's climax, and swells rather than plays. */
function brassSwells(): Note[] {
  return concatNotes(
    chordLine(HYMN_9_16.filter((_, i) => i % 2 === 0), {
      start: A2, octave: 3, center: 55, velocity: 0.44, dur: 3.7, roll: 0.09,
    }),
    tracker('D3:2 F3:2 | G3:4 | A3:2 F3:2 | D3:4', { start: OUTRO, velocity: 0.3, gate: 0.98, checkBars: BAR }),
  );
}

function droneLine(): Note[] {
  return ALL_BARS.map((symbol, bar): Note => {
    const at = bar * BAR;
    const level = at < A ? 0.42 : at >= A2 && at < CANON ? 0.56 : at >= OUTRO ? 0.38 : 0.48;
    return [at, 3.9, chordRoots([symbol], 1)[0]!, level];
  });
}

/**
 * HUMANISATION, to the bible's own table (THEMES.md §Humanisation: section
 * strings and choir are 14-18 ms out).
 *
 * The presets are further out than that — `choir` 34 ms, `strings-low` 24,
 * `strings` 22 — and at 90 bpm a 34 ms spread smears the attack of a chord
 * the whole cue is built on holding still. The presets belong to every cue in
 * the game, so the channels ask to be played tighter instead (PIPELINE.md,
 * "Per-channel performance overrides"), landing mid-band at about 16 ms.
 *
 * This is NOT the Yunalesca canon. That rite is the one locked at <= 3 ms and
 * velocity 0.62, and it is in another cue; this choir still breathes, it just
 * breathes inside the table.
 */
const CHOIR = { humanise: 0.47 } as const;
const SECTION = { humanise: 0.73 } as const;
const SECTION_LOW = { humanise: 0.67 } as const;

export const bossTrack: Track = {
  name: 'boss-dread',
  bpm: 90,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 6,
  fx: {
    reverb: { room: 0.93, damp: 0.2, width: 1, preDelay: 0.05 },
    delay: { timeBeats: 1.5, feedback: 0.3, damp: 2200 },
  },
  channels: [
    {
      name: 'choir upper',
      instrument: 'choir',
      volume: 0.82,
      pan: -0.08,
      perform: CHOIR,
      notes: concatNotes(upperVoices(), canonVoices(12)),
      fx: { reverb: 0.55 },
    },
    {
      name: 'choir lower',
      instrument: 'choir',
      volume: 0.6,
      pan: 0.2,
      perform: CHOIR,
      notes: concatNotes(lowerVoices(), canonVoices(0)),
      fx: { reverb: 0.6 },
    },
    { name: 'pedal', instrument: 'strings-low', volume: 0.72, pan: 0, perform: SECTION_LOW, notes: pedalLine(), fx: { reverb: 0.3 } },
    {
      name: 'seymour counter',
      instrument: 'strings-low',
      volume: 0.34,
      pan: -0.22,
      perform: SECTION_LOW,
      notes: seymourCounter(),
      fx: { reverb: 0.28 },
    },
    { name: 'string bed', instrument: 'strings', volume: 0.4, pan: 0.12, perform: SECTION, notes: breathe(stringBed(), 32, 0.14), fx: { reverb: 0.45 } },
    { name: 'brass swells', instrument: 'brass', volume: 0.52, pan: -0.25, notes: breathe(brassSwells(), 32, 0.12), fx: { reverb: 0.4 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.7, pan: 0.1, notes: timpaniLine(), fx: { reverb: 0.32 } },
    { name: 'bell', instrument: 'bell', volume: 0.46, pan: 0.35, notes: tolls(), fx: { reverb: 0.6, delay: 0.28 } },
    { name: 'cymbal', instrument: 'crash', volume: 0.3, pan: 0.15, notes: cymbalSwells(), fx: { reverb: 0.45 } },
    { name: 'drone', instrument: 'bass-sub', volume: 0.52, pan: 0, notes: breathe(droneLine(), 24, 0.16) },
  ],
};

export default bossTrack;
