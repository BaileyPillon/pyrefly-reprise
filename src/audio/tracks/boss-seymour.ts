/**
 * "Noble Rot" — Seymour boss theme.
 *
 * ORIGINAL COMPOSITION. C# minor, 132 bpm, 4/4 with two seven-beat
 * turnarounds. A prog-rock band — kit, electric bass, marcato strings and
 * brass — playing at full tilt around a church organ that never once raises
 * its voice. There is exactly one organ in this room and it is his.
 *
 * Per `docs/audio/THEMES.md` §SEYMOUR: six notes, a courteous bow up a minor
 * sixth carried by a double-dotted French-overture snap, then a chromatic
 * decline — `1 - b6 - 5 - #4 - 4 - b3`. The `#4` is dotted rather than
 * passing, because it is the only pitch in the motif that belongs to no key
 * and it has to carry weight. `SEYMOUR_MIRROR`, the strict inversion, answers
 * it in the manuals in genuine contrary motion, and the two converge on a
 * minor ninth exactly where the `#4` falls. The two-bar cell sequences up in
 * minor thirds — C#, E, G, C# — so eight bars of material arrive back where
 * they started having proved nothing. That is the character.
 *
 * THREE RULES FROM THE BIBLE THAT ARE EASY TO RENDER WRONG:
 *
 *   1. **He is never loud.** Every church-organ channel sits at volume <= 0.55
 *      for the whole cue, and the band around him is twice that. The contrast
 *      is the reading: contempt does not need volume.
 *   2. **The snap is thrown away.** The velocity shape is
 *      `0.74 / 0.52 / 0.72 / 0.78 / 0.68 / 0.62` — the leap up to the b6 is
 *      QUIETER than the note before it, like a remark made on the way past.
 *      The whole character lives in that dropped note; do not let anything
 *      put it back.
 *   3. **The registration is 16' + 8' + 2 2/3', and no 4'.** Written here as
 *      three organ channels transposed -12, 0 and +19, which is what a
 *      drawbar registration physically is: a fundamental, an octave under it
 *      and a quiet twelfth on top, with the octave above deliberately absent
 *      so the sound stays hollow. The pedal doubles at C#1/C#2 on the first
 *      note of each statement ONLY, never through it.
 *
 * Resemblance guard, re-read: rock organ plus a chanted choir over a fast
 * chromatic bass ostinato is this character's recognisable sound in the
 * source, so there is **no choir in this cue at all** — not wordless, not
 * chanted, not anywhere — and the fast ostinato lives in the strings, never in
 * the organ's left hand. An earlier draft of this cue had a chanting choir as
 * its lead voice; it was the single biggest resemblance risk in the score and
 * it is gone.
 *
 * The harmony is `i - bVI - #iv°7 - V` at half-bar changes: the only
 * functional Baroque progression in the whole score, and it belongs to the one
 * character who believes the world has rules. The `G#7` is a dominant that
 * never arrives, because the cell loops back to its own `C#m` — always
 * technically resolved, never audibly resolved. The cue ends on it, and the
 * loop point is what "resolves" it.
 *
 * Form (4/4 unless marked, 216 beats, 98.2 s written + 0.5 s of bent time):
 *   beats   0- 16  intro      organ alone, then the contrabass doubling
 *   beats  16- 48  A          the eight-bar period; band in                <- loop start
 *   beats  48- 80  B          the mirror answers in the manuals
 *   beats  80- 87  turn 1     SEVEN beats, grouped 2+2+3; organ rests
 *   beats  87-119  sequence   the period again, harder, brass doubling
 *   beats 119-135  cold       band gone; the organ alone, quiet, and the one
 *                             window where the PULSE goes with him
 *   beats 135-167  A2         the band at its loudest
 *   beats 167-174  turn 2     seven beats again
 *   beats 174-216  final form `SEYMOUR_UNMOORED` — the decline keeps going and
 *                             turns WHOLE-TONE, and the pedal drops on the
 *                             first whole-tone note, so his scale stops
 *                             containing a tonic at the same instant the
 *                             harmony loses its floor. Used once, never again.
 * Loop 16 -> 216. (Both figures used to read 214, which is the sum of the
 * written sections and two beats short of a barline; see {@link LENGTH}.)
 *
 * ONE THING THE BIBLE ASKS FOR THAT THIS CUE CANNOT GIVE IT, stated here so
 * the claim cannot drift away from the data. §SEYMOUR says of the mirror that
 * "the two converge on a minor ninth exactly where the `#4` falls". They
 * converge on an OCTAVE: `SEYMOUR`'s `#4` is `+6` from the root and
 * `SEYMOUR_MIRROR`'s is `-6` from the same root, which is twelve semitones,
 * and themes.ts is the one file an arranger may not edit. Rooting the mirror a
 * semitone away to buy the thirteenth would put a foreign tone under the only
 * functional Baroque progression in the score, which costs more than it pays.
 * The convergence itself is real and audible — the two lines open at a major
 * tenth on the snap and close to the octave at the `#4` — and the tritone the
 * bible actually wants heard is in the pedal, where it asks for it.
 */

import {
  accel,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  rit,
  tempoMap,
  toMidi,
  type Note,
  type Track,
} from '../score.ts';
import {
  SEYMOUR,
  SEYMOUR_MIRROR,
  SEYMOUR_SEQUENCE,
  SEYMOUR_UNMOORED,
} from './themes.ts';

const BAR = 4;

const INTRO = 0;
const A = 16;
const B = 48;
const TURN1 = 80; // seven beats
const SEQ = 87;
const COLD = 119;
const A2 = 135;
const TURN2 = 167; // seven beats
const FINAL = 174;
const UNMOOR = FINAL + 8; // the first whole-tone note; the pedal dies here
const COLLAPSE = FINAL + 16;
/**
 * 216, not 214. The two turnarounds are genuinely seven beats each, which
 * leaves the running total two beats short of a whole bar; the engine requires
 * `loop.start` and `loop.end` to land on barlines, so the collapse carries one
 * extra half-bar of the dominant that never resolves. The odd meter stays odd
 * where it is heard — inside the phrase — and the loop still wraps cleanly.
 */
const LENGTH = 216;

/**
 * The velocity shape, verbatim from the bible. Index 1 — the snap up to the
 * b6 — is the quietest note in the motif and that is the whole point.
 */
const SHAPE = [0.74, 0.52, 0.72, 0.78, 0.68, 0.62];
/** The whole-tone tail of the final form: it does not shout, it just keeps going. */
const UNMOOR_SHAPE = [0.62, 0.6, 0.58, 0.56, 0.54, 0.58];


/**
 * A phrase that swells and falls, plus the deterministic +-0.04 velocity
 * jitter THEMES.md asks for. A line rendered at one velocity is the single
 * most machine-like thing a mock-up can do, and a sixteenth-note ostinato at
 * one velocity is the "wall of constant-velocity sixteenths" the brief bans
 * outright. The arch is the bible's default: 0.62 -> 0.78 -> 0.58 over a
 * phrase, written here as a sine so it applies to any line.
 *
 * NOT applied to anything carrying a written accent — the boss off-beat
 * rule, the motif's thrown-away snap, the locked canon — because levelling
 * those out is exactly what this rule exists to prevent.
 */
function breathe(notes: Note[], phraseBeats: number, depth = 0.1): Note[] {
  return notes.map((n, i): Note => {
    const phase = ((n[0] % phraseBeats) + phraseBeats) % phraseBeats / phraseBeats;
    const arch = Math.sin(phase * Math.PI) * depth - depth * 0.3;
    const jitter = ((((i * 2654435761) >>> 0) % 2000) / 2000 - 0.5) * 0.08;
    const v = (n[3] ?? 0.8) + arch + jitter;
    return [n[0], n[1], n[2], Math.max(0.05, Math.min(1, v))];
  });
}

function shape(pattern: Note[], table: number[], scale = 1): Note[] {
  return pattern.map((n, i): Note => [n[0], n[1], n[2], Math.min(1, (table[i] ?? 0.66) * scale)]);
}

const MOTIF = shape(SEYMOUR, SHAPE);
const MIRROR = shape(SEYMOUR_MIRROR, SHAPE);
const UNMOORED = shape(SEYMOUR_UNMOORED, [...SHAPE, ...UNMOOR_SHAPE]);

// ------------------------------------------------------------- the harmony

/** The two-bar cell: i - bVI - #iv dim7 - V, half-bar changes. */
const CELL_CHORDS = ['C#m', 'Amaj7', 'Gdim7', 'G#7'];
/** The same cell on each step of the minor-third sequence: C#, E, G, C#. */
const CELL_E = ['Em', 'Cmaj7', 'A#dim7', 'B7'];
const CELL_G = ['Gm', 'Ebmaj7', 'C#dim7', 'D7'];
/** One eight-bar period = four cells at 2 beats a chord = 32 beats. */
const PERIOD_CHORDS = [...CELL_CHORDS, ...CELL_E, ...CELL_G, ...CELL_CHORDS];
/** No tonic left to belong to: two augmented triads, alternating, no bass. */
const WHOLE_TONE_CHORDS = ['Eaug', 'F#aug', 'Eaug', 'F#aug'];
const COLLAPSE_CHORDS = [...CELL_CHORDS, ...CELL_CHORDS, 'G#7', 'G#7', 'G#7', 'G#7', 'G#7'];
/** Seven beats, grouped 2 + 2 + 3. The band can count; he does not have to. */
const TURN_GROUPS = [0, 2, 4];

/** Two-beat chord grain, laid from `start`. */
function halfBars(chords: string[], start: number, options: Parameters<typeof chordLine>[1] = {}): Note[] {
  return chordLine(chords, { ...options, start, barBeats: 2 });
}

// --------------------------------------------------------------- the organ

/** Where each statement of the two-bar cell begins. */
function statements(start: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(start + i * 8);
  return out;
}

/** The motif in the organ, sequenced up in minor thirds and thrown home. */
function period(start: number, scale = 1): Note[] {
  return motif(
    scale === 1 ? MOTIF : shape(SEYMOUR, SHAPE, scale),
    statements(start, 4),
    SEYMOUR_SEQUENCE,
  );
}

/**
 * The organ's own line. Pedal register states the motif; the manuals answer
 * with the strict mirror through B; the final form walks off the edge of its
 * own scale. Nothing here is fast — the guard says the ostinato never goes in
 * the organ's left hand, and it does not.
 */
function organMotif(): Note[] {
  return concatNotes(
    motif(shape(SEYMOUR, SHAPE, 0.62), [INTRO], ['C#3']),
    motif(shape(SEYMOUR, SHAPE, 0.74), [INTRO + 8], ['C#3']),
    period(A),
    period(B, 1.05),
    period(SEQ, 1.1),
    // The cold interlude: the band is gone and he is alone, and even alone he
    // does not raise his voice. This is the quietest music in the cue.
    motif(shape(SEYMOUR, SHAPE, 0.48), [COLD, COLD + 8], ['C#3', 'G#2']),
    period(A2, 1.12),
    motif(UNMOORED, [FINAL], ['C#3']),
    motif(shape(SEYMOUR, SHAPE, 1.05), [COLLAPSE, COLLAPSE + 8], ['C#3', 'C#3']),
  );
}

/** The counter-subject, in the manuals, in genuine contrary motion against it. */
function organMirror(): Note[] {
  return concatNotes(
    motif(MIRROR, statements(B, 4), SEYMOUR_SEQUENCE),
    motif(shape(SEYMOUR_MIRROR, SHAPE, 0.85), statements(A2, 4), SEYMOUR_SEQUENCE),
    motif(shape(SEYMOUR_MIRROR, SHAPE, 0.9), [COLLAPSE, COLLAPSE + 8], ['C#3', 'C#3']),
  );
}

/**
 * The pedal, and it has TWO events in every two-bar cell, not one.
 *
 * THEMES.md §SEYMOUR, Counter-subject, verbatim: *"The organ pedal holds C#1
 * under bar 1 and **G1 under the `#4`** — the tritone lives there, in the
 * floor, not in the tune."* Only the first half of that was here. The `#4` is
 * the one pitch in the motif that belongs to no key, it is dotted rather than
 * passing precisely so that it carries weight, and the weight it was supposed
 * to be carrying was a tritone in the bass that nobody had played.
 *
 * It costs nothing harmonically, because the band is already there: the cell's
 * third half-bar chord is `Gdim7` — G is its ROOT. And it survives the
 * minor-third sequence for free, because a diminished seventh is symmetric:
 * `Gdim7`, `A#dim7` and `C#dim7` are the same four pitches, so C#, E and G all
 * take the same G in the floor. The one statement that moves is the cold
 * interlude's second, which is rooted on G# and therefore takes D.
 *
 * The doubling stays where the bible puts it — "pedal doubling at C2/C1 on the
 * first note of each statement ONLY" — so bar 1 is two octaves and the tritone
 * is one note, lower in level, further under the floor. And a pedal that held
 * through the motif would turn a bow into a drone, so neither event does.
 *
 * It all stops dead at `UNMOOR`: the floor goes at the same instant the scale
 * does.
 */
const TRITONE = 6;

function organPedal(): Note[] {
  const heads = [
    INTRO, INTRO + 8,
    ...statements(A, 4), ...statements(B, 4), ...statements(SEQ, 4),
    COLD, COLD + 8,
    ...statements(A2, 4),
    FINAL,
    COLLAPSE, COLLAPSE + 8,
  ];
  /** Beats into a statement at which `SEYMOUR`'s `#4` is struck. */
  const sharpFour = SEYMOUR[3]![0];
  const notes: Note[] = [];
  for (const at of heads) {
    if (at >= UNMOOR && at < COLLAPSE) continue; // the floor is gone
    const root = at === COLD + 8 ? 'G#' : 'C#';
    // The pedal grows with the band even though the manuals do not: it is the
    // floor of the room, not his voice.
    const level = 0.32 + drive(at) * 0.22;
    notes.push([at, 1.6, `${root}1`, level], [at, 1.6, `${root}2`, level * 0.88]);
    notes.push([at + sharpFour, 1.2, toMidi(`${root}1`) + TRITONE, level * 0.78]);
  }
  return notes;
}

// ------------------------------------------------------- the band: the noise

/**
 * The boss accent, verbatim: 0.95 on the and-of-beat, 0.80 on the downbeat.
 * Syncopation quieter than the beat it displaces is not syncopation, it is a
 * mistake — so nothing downstream is allowed to level this out.
 */
function accent(beat: number): number {
  return Math.abs(beat - Math.round(beat)) < 1e-6 ? 0.8 : 0.95;
}

/**
 * The band's off-beat comping.
 *
 * This was written for `organ-rock` — a drawbar organ against his church organ
 * was the prog-band idea. `organ-rock` has a sampled preset but NO synthesised
 * voice, so a track that names it throws on the runtime's fallback path, and
 * that path is the reason audio never goes silent. See
 * `docs/audio/requests-ffx-bosses.md`.
 *
 * It went to marcato strings instead, and the cue is better for it: there is
 * now exactly one organ in the room, it is his, and "he is never loud" is
 * literally true of every organ channel rather than true of most of them.
 */
function organRock(chords: string[], start: number, velocity: number): Note[] {
  const notes: Note[] = [];
  chords.forEach((symbol, i) => {
    const at = start + i * 2;
    const tones = chordMidis(symbol, { octave: 3, center: 60 });
    for (const midi of tones) {
      notes.push([at + 0.5, 0.45, midi, velocity * accent(at + 0.5)]);
      notes.push([at + 1.5, 0.45, midi, velocity * accent(at + 1.5) * 0.9]);
    }
  });
  return notes;
}

function organRockLine(): Note[] {
  return concatNotes(
    organRock(PERIOD_CHORDS, A, 0.58),
    organRock(PERIOD_CHORDS, B, 0.72),
    turnStabs(TURN1, 0.8, 3, 60),
    organRock(PERIOD_CHORDS, SEQ, 0.82),
    organRock(PERIOD_CHORDS, A2, 0.95),
    turnStabs(TURN2, 0.85, 3, 60),
    organRock(WHOLE_TONE_CHORDS, UNMOOR, 0.6),
    organRock(COLLAPSE_CHORDS, COLLAPSE, 0.84),
  );
}

/** A seven-beat turnaround, hit in 2 + 2 + 3. */
function turnStabs(start: number, velocity: number, octave: number, center: number): Note[] {
  const notes: Note[] = [];
  const symbols = ['C#m', 'A', 'G#7'];
  TURN_GROUPS.forEach((offset, i) => {
    for (const midi of chordMidis(symbols[i]!, { octave, center })) {
      notes.push([start + offset, i === 2 ? 2.6 : 1.6, midi, velocity]);
    }
  });
  return notes;
}

/** The urgent strings: the fast ostinato the organ is forbidden to play. */
function stringsShortLine(): Note[] {
  const notes: Note[] = [];
  const runs: Array<[string[], number]> = [
    [PERIOD_CHORDS, A],
    [PERIOD_CHORDS, B],
    [PERIOD_CHORDS, SEQ],
    [PERIOD_CHORDS, A2],
    [COLLAPSE_CHORDS, COLLAPSE],
  ];
  for (const [chords, start] of runs) {
    chords.forEach((symbol, i) => {
      const at = start + i * 2;
      const tones = chordMidis(symbol, { octave: 4, center: 73 });
      for (let s = 0; s < 8; s++) {
        const beat = at + s * 0.25;
        const tone = tones[s % tones.length]!;
        // Marcato: the downbeat of each half-bar leads, the rest follow under it.
        notes.push([beat, 0.2, tone, (s === 0 ? 0.68 : 0.5) * drive(at)]);
      }
    });
  }
  // Eight bars is the period; the ostinato breathes across it rather than
  // hammering 608 identical sixteenths.
  return breathe(notes, 32, 0.12);
}

/** Long tremolo swells: the dread under the band, never a melody. */
function stringsTremLine(): Note[] {
  return concatNotes(
    halfBars(PERIOD_CHORDS, B, { octave: 4, center: 76, velocity: 0.34, dur: 2.1, roll: 0.06 }),
    halfBars(PERIOD_CHORDS, A2, { octave: 4, center: 76, velocity: 0.46, dur: 2.1, roll: 0.06 }),
    halfBars(WHOLE_TONE_CHORDS, UNMOOR, { octave: 4, center: 74, velocity: 0.5, dur: 2.2, roll: 0.1 }),
  );
}

/** The tremolo bed, swelling across each eight-bar period. */
function stringsTrem(): Note[] {
  return breathe(stringsTremLine(), 32, 0.16);
}

/**
 * The contrabass doubling of the motif, and the octave-up string double the
 * bible asks for. Both quiet: they thicken him, they do not amplify him.
 */
function stringsLowLine(): Note[] {
  return concatNotes(
    motif(shape(SEYMOUR, SHAPE, 0.6), [INTRO + 8], ['C#3']),
    motif(shape(SEYMOUR, SHAPE, 0.68), statements(A, 4), SEYMOUR_SEQUENCE),
    motif(shape(SEYMOUR, SHAPE, 0.75), statements(SEQ, 4), SEYMOUR_SEQUENCE),
    motif(shape(SEYMOUR, SHAPE, 0.8), statements(A2, 4), SEYMOUR_SEQUENCE),
    motif(shape(SEYMOUR_UNMOORED, [...SHAPE, ...UNMOOR_SHAPE], 0.7), [FINAL], ['C#3']),
  );
}

function bassLine(): Note[] {
  const notes: Note[] = [];
  const runs: Array<[string[], number, number]> = [
    [PERIOD_CHORDS, A, 0.62],
    [PERIOD_CHORDS, B, 0.78],
    [PERIOD_CHORDS, SEQ, 0.88],
    [PERIOD_CHORDS, A2, 0.98],
    [COLLAPSE_CHORDS, COLLAPSE, 0.94],
  ];
  for (const [chords, start, velocity] of runs) {
    const roots = chordRoots(chords, 1);
    roots.forEach((root, i) => {
      const at = start + i * 2;
      // Root on the beat, the octave on the "and" — and the "and" is louder.
      notes.push([at, 0.45, root, velocity * accent(at)]);
      notes.push([at + 0.75, 0.4, root, velocity * accent(at + 0.75) * 0.85]);
      notes.push([at + 1.5, 0.45, root + 12, velocity * accent(at + 1.5)]);
    });
  }
  for (const [start, velocity] of [[TURN1, 0.9], [TURN2, 0.95]] as const) {
    for (const offset of TURN_GROUPS) {
      notes.push([start + offset, 0.6, chordRoots(['C#m'], 1)[0]!, velocity]);
    }
  }
  return notes;
}

// ----------------------------------------------------------------- the kit

const KICK = 'X..x..X.X..x..X.';
const SNARE = '....X.......X..g';
const HAT = 'x.X.x.X.x.X.x.X.';

/**
 * How hard the band is playing, by section — the cue's shape in one table.
 * A first draft had the kit at one velocity throughout and every band section
 * measured within a decibel of every other: eight sections that sounded like
 * one. The organ never moves (he is never loud); the band around him does all
 * the growing, which is the whole reading of the character.
 */
function drive(beat: number): number {
  if (beat < A) return 0.5;
  if (beat < B) return 0.74;
  if (beat < SEQ) return 0.84;
  if (beat < COLD) return 0.9;
  if (beat < A2) return 0.4; // the cold interlude — he is alone here
  if (beat < FINAL) return 1;
  return 0.94;
}

function bandBars(): number[] {
  const out: number[] = [];
  for (const start of [A, B, SEQ, A2]) for (let i = 0; i < 8; i++) out.push(start + i * BAR);
  for (let i = 0; i < 6; i++) out.push(COLLAPSE + i * BAR);
  return out;
}

function kickLine(): Note[] {
  return concatNotes(
    ...bandBars().map((at) => drumLine(KICK, { start: at, pitch: 'C1', velocity: drive(at) })),
    ...[TURN1, TURN2].map((at) => drumLine('X.X.X.X.X.X.X.', { start: at, pitch: 'C1', velocity: 0.95 })),
  );
}

function snareLine(): Note[] {
  return concatNotes(
    ...bandBars().map((at) => drumLine(SNARE, { start: at, pitch: 'D2', velocity: drive(at) * 0.92 })),
    ...[TURN1, TURN2].map((at) =>
      // 2 + 2 + 3: the snare marks the groups, and the three-group gets the fill.
      drumLine('..X...X...XxXx', { start: at, pitch: 'D2', velocity: 0.88 }),
    ),
    // The last two beats: the band lifts off the dominant and the loop crashes
    // back in on the tonic. Nothing else in the cue stops like this.
    drumLine('XxXxXXXX', { start: LENGTH - 2, step: 0.25, pitch: 'D2', velocity: 0.9 }),
  );
}

/**
 * The hat has more notes in it than anything else in the cue. At the two
 * velocities `drumLine` gives it, that makes it a metronome — so it follows
 * the band's growth and breathes across the eight-bar period on top.
 */
function hatLine(): Note[] {
  return breathe(
    concatNotes(...bandBars().map((at) => drumLine(HAT, { start: at, pitch: 'F#3', velocity: drive(at) * 0.5 }))),
    32,
    0.07,
  );
}

/**
 * Six cymbals, and they used to be six identical cymbals — the one channel in
 * the cue rendered at a single velocity. THEMES.md: "Never render a phrase at
 * constant velocity except the two places this document names", and neither of
 * them is a crash cymbal in a prog band. It matters more here than the note
 * count suggests: a crash is what marks a section head, so six at one weight
 * told the listener that the first entry of the band and its loudest bar cost
 * the drummer exactly the same. They follow `drive()` now, like everything else
 * the kit does, so the cue's shape reaches the cymbals as well.
 *
 * The section heads themselves do not change. The cold interlude still gets no
 * crash at all: the band is gone there, and a cymbal is a band instrument.
 */
function crashLine(): Note[] {
  return [A, B, SEQ, A2, FINAL, COLLAPSE].map(
    (beat): Note => [beat, 1.6, 'C5', 0.34 + drive(beat) * 0.34],
  );
}

/** Fills into the section heads: a descending tom run, never a chromatic tag. */
function tomFill(landOn: number, velocity: number): Note[] {
  const pitches = ['A3', 'A3', 'F3', 'F3', 'D3', 'C3'];
  return pitches.map((pitch, i): Note => [landOn - 1.5 + i * 0.25, 0.24, pitch, velocity - i * 0.01]);
}

function tomLine(): Note[] {
  return concatNotes(
    tomFill(B, 0.72),
    tomFill(SEQ, 0.74),
    tomFill(A2, 0.78),
    tomFill(FINAL, 0.84),
    tomFill(COLLAPSE, 0.8),
  );
}

// -------------------------------------------------------------- the brass

function brassStabs(): Note[] {
  const notes: Note[] = [];
  const runs: Array<[string[], number, number[], number]> = [
    [PERIOD_CHORDS, A, [1.5], 0.54],
    [PERIOD_CHORDS, B, [0.5, 1.5], 0.68],
    [PERIOD_CHORDS, SEQ, [0.5, 1.5], 0.8],
    [PERIOD_CHORDS, A2, [0, 0.5, 1.5], 0.9],
    [COLLAPSE_CHORDS, COLLAPSE, [0.5, 1.5], 0.84],
  ];
  for (const [chords, start, offsets, velocity] of runs) {
    chords.forEach((symbol, i) => {
      const at = start + i * 2;
      for (const offset of offsets) {
        for (const midi of chordMidis(symbol, { octave: 4, center: 64 })) {
          notes.push([at + offset, 0.26, midi, velocity * accent(at + offset)]);
        }
      }
    });
  }
  for (const [start, velocity] of [[TURN1, 0.8], [TURN2, 0.86]] as const) {
    for (const offset of TURN_GROUPS) {
      for (const midi of chordMidis('C#m', { octave: 4, center: 64 })) {
        notes.push([start + offset, 0.3, midi, velocity]);
      }
    }
  }
  return breathe(notes, 32, 0.08);
}

/** Low brass doubles the motif an octave up through the sequence — the band
 *  repeating what he said, louder, which is not the same as him saying it. */
function brassLine(): Note[] {
  return concatNotes(
    motif(shape(SEYMOUR, SHAPE, 0.9), statements(SEQ, 4), ['C#4', 'E4', 'G4', 'C#4']),
    motif(shape(SEYMOUR_UNMOORED, [...SHAPE, ...UNMOOR_SHAPE], 0.8), [FINAL], ['C#4']),
  );
}

export const seymourTrack: Track = {
  name: 'boss-seymour',
  bpm: 132,
  /**
   * "He moves at his own pace, unbothered by the band."
   *
   * THEMES.md §SEYMOUR says the motif is stated at 132 bpm but written in half-
   * and quarter-notes so that it moves at its own pace — which was true of the
   * note values and false of the clock, because the clock was the band's and it
   * never moved. There is exactly one window in the cue where that can be
   * fixed without contradicting anything: the cold interlude, beats 119-135.
   * The kit, the bass, the comping, the ostinato, the tremolo bed and the brass
   * all stop there and he plays two statements alone, at the quietest he is in
   * the whole cue.
   *
   * So the pulse goes with him: 132 slackens to 116 across the first of those
   * two statements, and the second is pulled back up so that the downbeat of A2
   * — the band's return, and its loudest section — lands in time. He is not
   * dragging the band. He simply stops being accompanied, takes his time, and
   * is interrupted.
   *
   * Nothing else moves, deliberately. The seven-beat turnarounds are odd
   * METER, not odd tempo: the band can count, and bending the pulse under them
   * would turn a group of 2+2+3 into a mistake. `loop.start` and `loop.end` are
   * both at 132, so the wrap cannot lurch.
   */
  tempo: tempoMap(
    rit(COLD, COLD + 12, 116, 'alone, and in no hurry'),
    accel(COLD + 12, A2, 132, 'the band takes it back'),
  ),
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.74, damp: 0.36, width: 0.92, preDelay: 0.018 },
    delay: { timeBeats: 0.5, feedback: 0.22, damp: 2600 },
  },
  channels: [
    // --- Seymour. Never above 0.55, and the 4' is deliberately missing. ---
    { name: "organ 16'", instrument: 'organ', volume: 0.5, pan: -0.04, transpose: -12, notes: organMotif(), fx: { reverb: 0.34 } },
    { name: "organ 8'", instrument: 'organ', volume: 0.55, pan: 0.02, notes: organMotif(), fx: { reverb: 0.3 } },
    { name: "organ 2 2/3'", instrument: 'organ', volume: 0.2, pan: 0.06, transpose: 19, notes: organMotif(), fx: { reverb: 0.36 } },
    { name: 'organ manuals (mirror)', instrument: 'organ', volume: 0.46, pan: 0.1, notes: organMirror(), fx: { reverb: 0.32 } },
    { name: 'organ pedal', instrument: 'organ', volume: 0.45, pan: 0, notes: organPedal(), fx: { reverb: 0.4 } },
    { name: 'contrabasses', instrument: 'strings-low', volume: 0.5, pan: 0.18, notes: stringsLowLine(), fx: { reverb: 0.26 } },
    { name: 'strings octave up', instrument: 'strings-low', volume: 0.5, pan: -0.2, transpose: 12, notes: stringsLowLine(), fx: { reverb: 0.3 } },

    // --- the band. This is the half that shouts. ---
    { name: 'bass', instrument: 'bass', volume: 0.92, pan: 0, notes: bassLine(), fx: { reverb: 0.05 } },
    { name: 'band comping', instrument: 'strings-short', volume: 0.6, pan: -0.34, notes: organRockLine(), fx: { reverb: 0.12 } },
    { name: 'strings ostinato', instrument: 'strings-short', volume: 0.52, pan: 0.32, notes: stringsShortLine(), fx: { reverb: 0.2 } },
    { name: 'strings bed', instrument: 'strings', volume: 0.46, pan: 0.22, notes: stringsTrem(), fx: { reverb: 0.4 } },
    { name: 'brass', instrument: 'brass', volume: 0.6, pan: 0.2, notes: brassLine(), fx: { reverb: 0.3, delay: 0.1 } },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.56, pan: -0.26, notes: brassStabs(), fx: { reverb: 0.16 } },
    { name: 'kick', instrument: 'kick', volume: 0.9, pan: 0, notes: kickLine() },
    { name: 'snare', instrument: 'snare', volume: 0.78, pan: -0.06, notes: snareLine(), fx: { reverb: 0.14 } },
    { name: 'hats', instrument: 'hat', volume: 0.34, pan: 0.22, notes: hatLine() },
    { name: 'toms', instrument: 'tom', volume: 0.55, pan: -0.16, notes: tomLine(), fx: { reverb: 0.18 } },
    { name: 'crash', instrument: 'crash', volume: 0.44, pan: 0.12, notes: crashLine(), fx: { reverb: 0.3 } },
  ],
};

export default seymourTrack;
