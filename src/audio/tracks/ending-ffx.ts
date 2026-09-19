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
 * On top of that table every bar now carries a HAIRPIN (see `hairpin()`),
 * because a bar handed one velocity is a fader move and not a player.
 * Every appoggiatura leans: the held note is louder than the note it falls
 * to, at all SIX places the theme states one — bars 2, 6, 10, 12, 14 and the
 * amen in bar 16. Bar 12 was the one that was missing, and it was flat in
 * three voices at once. The written breaths at the ends of bars 4, 8 and 12
 * are lengthened 8% with `agogic()` and the rests inside bars 4, 8 and 13 are
 * left empty. The last chord rings for eight seconds over nothing else.
 *
 * AND THE PULSE BENDS. `tempo` is the map THEMES.md called "the single
 * biggest quality item left": breaths at the phrase ends, a push into the
 * climb and a broadening onto the climax, a fermata before the prayer, and a
 * real ritardando onto the last cadence in the game. See `TEMPO` below.
 *
 * Form (28 bars, 112 beats, 122.7 s through the map):
 *   bars  1- 8  statement 1  beats  0- 32  solo piano, FAREWELL bars 1-8, alone
 *   bars  9-24  statement 2  beats 32- 96  full strings on the released harmony  <- loop start
 *   bars 25-28  coda         beats 96-112  HYMN bars 13-16, choir, Picardy third
 */

import {
  aTempo,
  arpLine,
  accel,
  chordLine,
  chordRoots,
  concatNotes,
  fermata,
  motif,
  rit,
  tempoMap,
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
 * EVERY appoggiatura in FAREWELL, as (leaning beat, resolving beat) inside the
 * theme's own sixteen bars.
 *
 * The first four are `FAREWELL_FALL` at its four heights — bars 2, 6, 10 and
 * 14 — and the last is the amen in bar 16. **Bar 12 (`[44, 46]`) is the one
 * that was missing**, and it is the most exposed of the six: F#4 held two
 * beats over the bVI and stepping down to E4 as the cue walks out of the
 * climax. It was rendering at 0.70 against 0.70 — dead flat — in the strings,
 * in the violas doubling them, and (in `scene-zanarkand-dome`) in the solo
 * voice, because `shapeByBar` hands a whole bar one level and `lean()` was
 * never told about that pair. THEMES.md: "Machines always get this backwards,
 * and getting it backwards is the single loudest tell of a synthetic
 * performance."
 */
const LEAN_PAIRS: Array<[number, number]> = [
  [4, 7],    // bar  2   E4  -> D4
  [20, 23],  // bar  6   F#4 -> E4
  [36, 39],  // bar 10   G4  -> F#4
  [44, 46],  // bar 12   F#4 -> E4   the descent out of the climax
  [52, 55],  // bar 14   D4  -> C#4  the lowest of the four, home below the start
  [60, 62],  // bar 16   C#4 -> B3   THE AMEN
];

/** How far the contour may move a note off its bar's level. */
const CONTOUR = 0.05;
/** How far into the next bar's level a bar leans by its last beat. */
const LEAD = 0.25;

/**
 * Hairpins, inside the bar.
 *
 * `shapeByBar` hands a whole bar one velocity, which is a fader move and not a
 * player: four notes at 0.70 is exactly the "constant velocity" THEMES.md
 * bans, one bar at a time. Two small deterministic nudges fix it, and nothing
 * else is needed:
 *
 *   CONTOUR  a line that climbs gets louder and one that falls gets quieter,
 *            scaled across FAREWELL's own range (F#3-B4), +/-0.05 at the
 *            extremes. The oldest rule in phrasing, and the one that makes a
 *            shape audible at all.
 *   LEAD     notes tilt towards the NEXT bar's level as the bar runs out, a
 *            quarter of the way by the last beat, so the bar lines stop being
 *            steps and the four-bar arch reads as one gesture.
 *
 * It runs BEFORE `lean()` on purpose. The contour term happens to push a
 * leaning note up and its resolution down — they are a step apart, higher
 * first — so it reinforces the appoggiatura rather than fighting it, and
 * `lean()`'s +/-0.08 still lands on top as the loudest thing in the bar.
 */
function hairpin(notes: Note[], table: number[], barBeats = BAR): Note[] {
  const pitches = notes.map((n) => n[2] as number);
  const low = Math.min(...pitches);
  const span = Math.max(1, Math.max(...pitches) - low);
  return notes.map((n): Note => {
    const bar = Math.floor(n[0] / barBeats);
    const here = table[Math.min(bar, table.length - 1)] ?? n[3] ?? 0.7;
    const next = table[Math.min(bar + 1, table.length - 1)] ?? here;
    const through = (n[0] % barBeats) / barBeats;
    const contour = CONTOUR * ((2 * ((n[2] as number) - low)) / span - 1);
    const v = (n[3] ?? here) + (next - here) * LEAD * through + contour;
    return [n[0], n[1], n[2], Math.max(0.05, Math.min(1, v))];
  });
}

/**
 * The accompaniment follows the tune's own arch.
 *
 * `FAREWELL_DYNAMICS` shapes the melody, and the bed under it was written at
 * one level per section: 128 notes of string bed at three levels, twenty cello
 * notes at three, the harp at two. That is a fader, not a section — the tune
 * swells into bar 11 and the orchestra behind it does not move, which is the
 * exact opposite of what makes an orchestral climax feel like one.
 *
 * So every sustaining channel is scaled by where its bar sits in the theme's
 * own table, at `depth` of the melody's swing: bar 11 lifts the bed about 19%
 * and the reprise lets it fall about 16%. The written balance is untouched at
 * the table's mean, so nothing is re-mixed — only shaped.
 */
function follow(notes: Note[], start: number, table: number[], depth = 0.5): Note[] {
  const mean = table.reduce((a, b) => a + b, 0) / table.length;
  return notes.map((n): Note => {
    const bar = Math.floor((n[0] - start + 1e-6) / BAR);
    const level = table[Math.min(Math.max(bar, 0), table.length - 1)]!;
    const k = 1 + depth * (level / mean - 1);
    return [n[0], n[1], n[2], Math.max(0.05, Math.min(1, (n[3] ?? 0.4) * k))];
  });
}

/**
 * The melody, shaped. Order matters: the per-bar dynamic table first, then the
 * hairpin inside each bar, then the appoggiaturas on top of both, then the
 * written rubato last so the breaths land on the note lengths the dynamics
 * already chose.
 */
function farewell(start: number, fromBar: number, toBar: number, trim = 1): Note[] {
  const from = (fromBar - 1) * BAR;
  const to = toBar * BAR;
  const table = FAREWELL_DYNAMICS.map((v) => Math.min(1, v * trim));
  // gate stays at 1 so the phrase ends land on whole beats and `agogic()` can
  // find them; the legato comes from the voice's release tail, not from here.
  const shaped = shapeByBar(tracker(FAREWELL_RH, { gate: 1, checkBars: BAR }), table, BAR);
  const leaned = lean(hairpin(shaped, table), LEAN_PAIRS);
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
  const notes = chordRoots(chords, 1).flatMap((midi, bar): Note[] => [
    [start + bar * BAR, 3.4, midi, velocity],
    [start + bar * BAR, 3.4, midi + 12, velocity * 0.8],
  ]);
  // Sixteen notes at two levels is a pianist's left hand played by a machine.
  return follow(notes, start, FAREWELL_DYNAMICS, 0.4);
}

// ---------------------------------------------------------------------------
// Statement 2 — the benediction
// ---------------------------------------------------------------------------

function stringsTune(): Note[] {
  return farewell(S2, 1, 16);
}

/**
 * Violas, an octave below the tune, and only from bar 9. That is where it
 * widens.
 *
 * The second argument of `farewell()` is where the SECTION lands, not where
 * the statement began: bar 9 of statement 2 is at `S2 + 32`, not at `S2`.
 * With `S2` the `- from` inside `farewell()` cancelled the shift exactly, so
 * the violas played FAREWELL bars 9-16 (D3 E3 F#3 G3 ...) underneath the
 * strings' bars 1-8 for the whole first half of the statement — the wrong
 * tune, in the wrong harmony, and then silence from bar 9 onward, which is
 * the one place the bible requires the doubling: "The melody is doubled at
 * the octave below by violas ONLY from the climax onward, so the climax is
 * where the sound physically widens."
 */
function violaDouble(): Note[] {
  return farewell(S2 + 32, 9, 16, 0.86).map((n): Note => [n[0], n[1], (n[2] as number) - 12, n[3]]);
}

/**
 * Horns take HYMN_HEAD at double length under the strings: the prayer,
 * remembered.
 *
 * The head is `1 - b7 - 1 - b3` — a lower neighbour that falls and then LIFTS,
 * and the lift is the whole point of it. Four notes at one velocity is a
 * phrase held flat, which the bible bans outright, so each statement carries
 * the shape the four notes describe: away on the neighbour, back on the
 * return, and the b3 on top.
 */
const HEAD_SHAPE = [1, 0.92, 0.97, 1.08];

function hornHead(): Note[] {
  const head = augment(HYMN_HEAD, 2);
  const shaped = (beat: number, level: number): Note[] =>
    motif(head, [beat], ['B3']).map(
      (n, k): Note => [n[0], n[1] * 0.99, n[2], Math.min(1, level * (HEAD_SHAPE[k] ?? 1))],
    );
  return concatNotes(shaped(S2 + 16, 0.42), shaped(S2 + 48, 0.5));
}

function stringBed(): Note[] {
  return concatNotes(
    follow(
      concatNotes(
        chordLine(FAREWELL_CHORDS_RELEASED.slice(0, 16), {
          start: S2, barBeats: 2, octave: 3, center: 62, velocity: 0.34, dur: 1.9, roll: 0.04,
        }),
        chordLine(FAREWELL_CHORDS_RELEASED.slice(16), {
          start: S2 + 32, barBeats: 2, octave: 3, center: 64, velocity: 0.46, dur: 1.9, roll: 0.04,
        }),
      ),
      S2,
      FAREWELL_DYNAMICS,
    ),
    // The last half bar is B major, and it is left to ring: `tailSec` keeps the
    // hall open for nine seconds after the strings stop bowing. The coda is the
    // prayer and keeps its own level — HYMN takes no rubato and no swell.
    chordLine(CODA_HALF, {
      start: CODA, barBeats: 2, octave: 3, center: 64, velocity: 0.52, dur: 1.9, roll: 0.05,
    }),
  );
}

function cellosLine(): Note[] {
  return concatNotes(
    follow(
      chordRoots(FAREWELL_CHORDS, 2).map((midi, bar): Note => [
        S2 + bar * BAR, 3.7, midi, bar < 8 ? 0.34 : 0.46,
      ]),
      S2,
      FAREWELL_DYNAMICS,
      0.4,
    ),
    chordRoots(CODA_HALF.filter((_, i) => i % 2 === 0), 2).map((midi, bar): Note => [
      CODA + bar * BAR, 3.7, midi, 0.44,
    ]),
  );
}

/** Harp: one rolled chord a bar through the climb, and nothing before it. */
function harpLine(): Note[] {
  return concatNotes(
    // Bars 9-12 — the climb, the arrival and the walk out of it. The table has
    // the biggest swing in the theme across exactly these four bars, so the
    // harp is the one place `follow()` is plainly audible.
    follow(
      chordLine(FAREWELL_CHORDS.slice(8, 12), {
        start: S2 + 32, octave: 4, center: 74, velocity: 0.34, dur: 3.6, roll: 0.09,
      }),
      S2,
      FAREWELL_DYNAMICS,
    ),
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

/**
 * THE TEMPO MAP — the thing THEMES.md calls "the single biggest quality item
 * left", spent on the cue the bible says to make beautiful if only one is.
 *
 * `agogic()` can move a note inside the grid. It cannot move the grid, so
 * until now the accompaniment marched at 58 under a melody trying to breathe.
 * Every mark below is one of the gestures THEMES.md names, with its number:
 *
 *   breaths      the phrase ends — FAREWELL bars 4, 8, 12 and 16 — ease back
 *                over the last three beats and the next phrase starts in
 *                tempo. 58 -> 50/52 is 10-14%, inside the 25% ceiling.
 *   the climb    bars 9-10 "shorten each note ... so the climb arrives
 *                slightly early and eager": 58 -> 63 across beats 64-71.
 *   the arrival  bar 11 "lengthen the first note by 12%": the pulse drops to
 *                54 on the downbeat the melody peaks on, and the accompaniment
 *                finally widens with it instead of running on underneath.
 *   the reprise  bars 13-16 come home "a step slower" — 54, written.
 *   the fermata  1.5 s after beat 95.75, the last chord of the benediction
 *                held before the prayer answers it. It is the breath the whole
 *                cue has been walking towards — and 95.75 rather than the
 *                downbeat of the bar it belongs to, because a hold stops time
 *                for everything, and beat 94 still has the left hand's last
 *                three arpeggio notes and the string chord's own 0.08-beat
 *                roll after it. A fermata there would have opened a 1.5 s hole
 *                inside a running figure and split one rolled chord into two
 *                events either side of a silence. At 95.75 the bar has
 *                finished speaking, everything struck at 94 is still sounding
 *                and is held through the pause, and nothing is struck between
 *                the mark and the coda.
 *   the coda     HYMN takes ZERO rubato (a congregation does not rubato), so
 *                bars 25-28 sit at one broad 52 — a tempo, not a bend...
 *   the cadence  ...until the last two notes, which THEMES.md names outright:
 *                "Ritardando you can hear (FAREWELL bar 16, ending-ffx coda)
 *                — 18% across the last two notes". 52 -> 42 is 19%.
 *
 * The final `aTempo(112)` is not audible: nothing is struck after beat 110.
 * It is there because beat 112 is `loop.end`, and a loop whose tempo at the
 * wrap is not the tempo at `loop.start` lurches every time it comes round —
 * the loop-seam problem one level up. PIPELINE.md: "finish the rit. before
 * loop.end or a tempo back onto it."
 */
const TEMPO = tempoMap(
  // Statement 1 — one piano, alone, and a pianist alone breathes.
  rit(13, 16, 50, 'breath — bar 4'),
  aTempo(16),
  rit(29, 32, 48, 'breath — bar 8'),
  aTempo(32), // the orchestra enters in tempo, and this beat is loop.start
  // Statement 2 — the benediction.
  rit(45, 48, 52, 'breath — bar 12'),
  aTempo(48),
  rit(61, 64, 52, 'breath — bar 16'),
  aTempo(64),
  accel(64, 71, 63, 'eager into the climb'),
  [72, 54], // THE ARRIVAL — broaden onto bar 11
  aTempo(76),
  [80, 54], // the reprise, home a step slower
  rit(92, 95.5, 44, 'rit. into the amen'),
  fermata(95.75, 1.5, 'breath before the prayer'),
  // The coda — HYMN, and it does not bend until the very last cadence.
  [96, 52],
  rit(108, 110, 42, 'rit. — the last cadence in the game'),
  aTempo(112), // the pulse the loop restarts on; nothing is struck here
);

/**
 * HUMANISATION, to the bible's own table.
 *
 * THEMES.md §Humanisation: section strings and choir are 14-18 ms out, a solo
 * piano 6-9. The voice presets this cue plays do not sit there — `piano` is
 * 3 ms (very nearly a grid, and this cue opens with two minutes of exposed
 * solo piano), `strings` 22, `strings-low` 24 and `choir` 34, which is double
 * the ceiling on music whose chords change once a bar at 58 bpm.
 *
 * Those presets are shared with every other cue in the game and are not this
 * arranger's to move, so each channel says how it wants to be played instead
 * — which is exactly what `perform` is for (PIPELINE.md, "Per-channel
 * performance overrides"). Every figure below lands mid-band:
 *
 *   piano       3 ms -> 7            replaced outright
 *   strings    22 ms -> 16.1         humanise 0.73
 *   strings-low 24 ms -> 16.1        humanise 0.67
 *   choir      34 ms -> 16.0         humanise 0.47
 */
const PIANO_HANDS = { timingJitterMs: 7 } as const;
const SECTION = { humanise: 0.73 } as const;
const SECTION_LOW = { humanise: 0.67 } as const;
const CHOIR = { humanise: 0.47 } as const;

export const endingTrack: Track = {
  name: 'ending-ffx',
  bpm: 58,
  tempo: TEMPO,
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
      perform: PIANO_HANDS,
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
      perform: PIANO_HANDS,
      fx: { reverb: 0.3 },
    },
    {
      name: 'piano bass',
      instrument: 'piano',
      volume: 0.72,
      pan: -0.02,
      perform: PIANO_HANDS,
      notes: pianoBass(S1, FAREWELL_CHORDS.slice(0, 8), 0.44),
      fx: { reverb: 0.22 },
    },
    { name: 'strings tune', instrument: 'strings', volume: 0.84, pan: 0.08, perform: SECTION, notes: stringsTune(), fx: { reverb: 0.4, delay: 0.1 } },
    { name: 'violas', instrument: 'strings-low', volume: 0.6, pan: 0.2, perform: SECTION_LOW, notes: violaDouble(), fx: { reverb: 0.36 } },
    { name: 'string bed', instrument: 'strings', volume: 0.47, pan: -0.16, perform: SECTION, notes: stringBed(), fx: { reverb: 0.5 } },
    { name: 'cellos', instrument: 'strings-low', volume: 0.56, pan: -0.08, perform: SECTION_LOW, notes: cellosLine(), fx: { reverb: 0.35 } },
    { name: 'horns', instrument: 'brass', volume: 0.46, pan: -0.28, notes: hornHead(), fx: { reverb: 0.4 } },
    { name: 'harp', instrument: 'harp', volume: 0.5, pan: -0.34, notes: harpLine(), fx: { reverb: 0.36, delay: 0.16 } },
    { name: 'choir upper', instrument: 'choir', volume: 0.72, pan: 0.06, perform: CHOIR, notes: choirUpper(), fx: { reverb: 0.6 } },
    { name: 'choir lower', instrument: 'choir', volume: 0.54, pan: -0.12, perform: CHOIR, notes: choirLower(), fx: { reverb: 0.62 } },
    { name: 'timpani', instrument: 'timpani', volume: 0.54, pan: 0.04, notes: timpaniLine(), fx: { reverb: 0.38 } },
    { name: 'bell', instrument: 'bell', volume: 0.4, pan: 0.32, notes: bellLine(), fx: { reverb: 0.6, delay: 0.3 } },
    { name: 'cymbal', instrument: 'crash', volume: 0.3, pan: 0.12, notes: cymbalSwell(), fx: { reverb: 0.45 } },
  ],
};

export default endingTrack;
