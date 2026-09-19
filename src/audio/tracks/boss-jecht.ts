/**
 * "Blitz for Two" — Jecht, Braska's Final Aeon.
 *
 * ORIGINAL COMPOSITION. D minor, 144 bpm. A son squaring up to his father,
 * and the cue's whole design is that neither of them stops talking.
 *
 * Per `docs/audio/THEMES.md`, this cue carries two themes at once:
 *
 *   **FATHER** — the riff. Four bars, register D2-D3, entirely off the beat,
 *   and its bar-1 pitch skeleton is `1 - b7 - 1 - b3`, which is `HYMN_HEAD`
 *   with every note shoved sideways. Straighten it and the swagger turns back
 *   into the prayer; `scene-gagazet` does exactly that on one horn and says
 *   nothing about it. Bars 1 and 3 share an identical rhythm at different
 *   pitches — that repetition is what makes a swagger a hook rather than a
 *   noodle, so it is not varied. Bar 2 has air in it. Bar 4 is the only bar
 *   with no rest and lands the octave late, on its own downbeat.
 *
 *   **FAREWELL** — bars 9-12 only, transposed +3 into D minor: the climb, the
 *   octave it cannot hold, and the b6 sounded over the tonic while
 *   `bVI - bVII - i` closes underneath. It arrives at half-time in the bridge,
 *   and in the climax the two themes are superimposed *literally*, FATHER
 *   entering **two beats late** so its syncopations land against the lament's
 *   downbeats instead of with them. That collision needs no fudging: FATHER's
 *   bars 3-4 are `Bb5 - C5 - D5`, which is FAREWELL's own bars 10-11 in the
 *   same metric position. The two themes were built on one frame.
 *   Do not smooth it out. It is supposed to sound like an argument.
 *
 * THE ONE RENDERER CONSTRAINT, VERBATIM: the and-of-beat is LOUDER than the
 * downbeat — 0.95 against 0.80, via `offbeat()` below. Syncopation quieter
 * than the beat it displaces is not syncopation, it is a mistake, and no
 * humaniser, compressor or normaliser may level it out.
 *
 * Resemblance guard, re-read, and it cost a rewrite. Three features identify
 * the source cue, and none of them are its pitches:
 *   - **no repeated-note chug.** The riff never restrikes the same pitch on
 *     consecutive subdivisions. An earlier draft of this cue was built on
 *     palm-muted sixteenths hammering one note — exactly the banned figure —
 *     and the rhythm guitars now play FATHER itself instead.
 *   - **no shouted or chanted male vocal.** The only voices here are a
 *     wordless choir, and only in the climax, and only on the lament.
 *   - **no descending chromatic tag** closing a phrase. The turnaround is
 *     `bVI - bVII`, the score's own fingerprint, not a chromatic walk-down.
 * The blue b5 stays rationed to exactly two grace notes per statement, one
 * climbing and one falling: a riff that plays its blue note constantly has no
 * blue note.
 *
 * Form (4/4, 64 bars, 256 beats, 106.7 s):
 *   beats   0- 16  intro    kit and bass; the guitar teases bar 1 and stops
 *   beats  16- 48  A        FATHER twice, in full                     <- loop start
 *   beats  48- 80  A2       the same riff, louder, brass on the off-beats
 *   beats  80-112  solo     single-line lead; the rhythm guitars thin out
 *   beats 112-144  bridge   HALF-TIME. FAREWELL bars 9-12, strings and brass
 *                           in unison with a clean guitar an octave below,
 *                           over Bb5 - C5 - D5 as a rock riff
 *   beats 144-176  climax   BOTH AT ONCE. Lament above in strings and choir at
 *                           half-time; FATHER below at full speed, 2 beats late
 *   beats 176-208  solo 2   the lead returns busier, one bend at the top
 *   beats 208-240  final    the riff, whole band
 *   beats 240-256  turn     bVI - bVII, and back into the riff
 * Loop 16 -> 256.
 */

import {
  accel,
  barStarts,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  rit,
  scaleVelocity,
  shiftNotes,
  tempoMap,
  toMidi,
  tracker,
  transposeNotes,
  type Note,
  type Track,
} from '../score.ts';
import {
  agogic,
  FAREWELL_DYNAMICS,
  FAREWELL_RH,
  FATHER,
  FATHER_CHORDS,
  lean,
  shapeByBar,
} from './themes.ts';

const BAR = 4;

const INTRO = 0;
const A = 16;
const A2 = 48;
const SOLO = 80;
const BRIDGE = 112;
const CLIMAX = 144;
const SOLO2 = 176;
const FINAL = 208;
const TURN = 240;
const LENGTH = 256;

/** FATHER is sixteen beats; a section holds two statements. */
const RIFF_BEATS = 16;

// --------------------------------------------------------------- the riff

/**
 * The and-of-beat is LOUDER than the downbeat. This is the single most
 * important number in the cue and the loudest tell of a machine when it is
 * inverted, so it is applied last and nothing after it touches velocity.
 */
function offbeat(notes: Note[], scale = 1): Note[] {
  return notes.map((n): Note => {
    const onBeat = Math.abs(n[0] - Math.round(n[0])) < 1e-6;
    const base = onBeat ? 0.8 : 0.95;
    // Grace notes (the rationed blue b5) sit under the note they lean into.
    const grace = n[1] <= 0.26 ? 0.82 : 1;
    return [n[0], n[1], n[2], Math.min(1, base * grace * scale)];
  });
}


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

/** Two statements of FATHER from `start`, at `root`. */
function riff(start: number, root: string, scale = 1, statements = 2): Note[] {
  return offbeat(motif(FATHER, barStarts(start, statements, RIFF_BEATS), [root]), scale);
}

/** The harmony the riff carries with it: D5 | D5 | Bb5 C5 | D5, half-bar grain. */
function riffChords(statements = 2): string[] {
  const out: string[] = [];
  for (let i = 0; i < statements; i++) out.push(...FATHER_CHORDS);
  return out;
}

function powerChords(start: number, statements: number, velocity: number, octave = 2): Note[] {
  const chords = riffChords(statements);
  const notes: Note[] = [];
  chords.forEach((symbol, i) => {
    const at = start + i * 2;
    for (const midi of chordMidis(symbol, { octave })) {
      // Ring on the half-bar, and let the riff carry the movement.
      notes.push([at, 1.7, midi, velocity * 0.85]);
    }
  });
  return notes;
}

/** L plays the riff; R plays it an octave up, a hair late and a hair softer.
 *  Two takes of one part, which is what double-tracking actually is. */
function guitarL(): Note[] {
  return concatNotes(
    // the tease: bar 1 only, then silence
    offbeat(motif(FATHER.slice(0, 4), [INTRO + 12], ['D2']), 0.8),
    riff(A, 'D2', 0.9),
    riff(A2, 'D2', 1.0),
    // under the solo the rhythm guitar holds the frame instead of the riff
    powerChords(SOLO, 2, 0.38),
    riff(CLIMAX + 2, 'D2', 1.08),
    powerChords(SOLO2, 2, 0.5),
    riff(FINAL, 'D2', 1.02),
  );
}

function guitarR(): Note[] {
  const core = concatNotes(
    transposeNotes(riff(A, 'D2', 0.9), 12),
    transposeNotes(riff(A2, 'D2', 1.0), 12),
    powerChords(SOLO, 2, 0.34, 3),
    transposeNotes(riff(CLIMAX + 2, 'D2', 1.08), 12),
    powerChords(SOLO2, 2, 0.44, 3),
    transposeNotes(riff(FINAL, 'D2', 1.02), 12),
  );
  return shiftNotes(scaleVelocity(core, 0.9), 0.014);
}

/**
 * The bridge's power chords: FAREWELL's own bars 10-11 played as a rock riff.
 * Bar 8 is `A5` and not `A` — a power chord has no third, so the pull into the
 * climax's D minor happens without a leading tone ever asserting itself, which
 * is FAREWELL's own rule about withholding it at the moment of maximum pull.
 */
const BRIDGE_CHORDS = ['F5', 'F5', 'Bb5', 'C5', 'D5', 'D5', 'Bb5', 'A5'];
/** The same eight bars as triads, for the string bed under the lament. */
const BRIDGE_TRIADS = ['F', 'F', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A5'];

/**
 * The bridge's guitars do almost nothing: one ring a bar, quiet, so the room
 * empties out under the lament. The fury is still in the chair — it is just
 * not talking. A bridge that is as loud as the riff around it is not a bridge,
 * and the first draft of this cue made exactly that mistake: the half-time
 * section measured one decibel below the full band, which is a wall of sound
 * with a tune on top rather than a change of scene.
 */
function bridgeGuitar(): Note[] {
  const notes: Note[] = [];
  BRIDGE_CHORDS.forEach((symbol, bar) => {
    const at = BRIDGE + bar * BAR;
    // Nothing at all for four bars. The guitars come back with the arrival,
    // and lean in again for the last two so the climax has a run-up.
    if (bar < 4) return;
    const velocity = bar >= 6 ? 0.44 : 0.32;
    for (const midi of chordMidis(symbol, { octave: 2 })) {
      notes.push([at, 3.8, midi, velocity]);
    }
  });
  return notes;
}

/** The turn: bVI - bVII, the score's fingerprint, and never a chromatic tag. */
const TURN_CHORDS = ['Bb5', 'Bb5', 'C5', 'C5'];

function turnGuitar(): Note[] {
  const notes: Note[] = [];
  TURN_CHORDS.forEach((symbol, bar) => {
    const at = TURN + bar * BAR;
    for (const midi of chordMidis(symbol, { octave: 2 })) {
      notes.push([at, 1.8, midi, 0.9]);
      notes.push([at + 2.5, 1.4, midi, 0.95]);
    }
  });
  return notes;
}

// ------------------------------------------------------------- the lament

/**
 * A falling run performed as a run of appoggiaturas: the first note keeps its
 * written weight and every note after it steps `drop` further down, so a
 * stepwise descent actually descends.
 *
 * THEMES.md's number is 0.08 a pair and `lean()` spends it half up, half down —
 * which is right in the middle of a phrase. It is wrong in two places here.
 * Bar 11's leaning note is already at the theme's written peak of 0.94, "the
 * loudest note in the score outside the boss fights", and pushing it past that
 * to make room would be overruling the one table THEMES.md says is half the
 * theme; so the gap is made underneath it instead. And bar 12 is a THREE-note
 * fall — two pairs sharing their middle note — which `lean()` cannot express at
 * all, because that note is a resolution and a leaning note at the same time.
 */
function fallingRun(notes: Note[], beats: number[], drop = 0.08): Note[] {
  const rank = new Map(beats.map((b, i) => [b, i]));
  return notes.map((n): Note => {
    const step = rank.get(n[0]);
    if (step === undefined) return n;
    return [n[0], n[1], n[2], Math.max(0.05, (n[3] ?? 0.8) - step * drop)];
  });
}

/**
 * FAREWELL's own rubato, written into the note values — THEMES.md §Rubato,
 * with its numbers, on the window's beats.
 *
 *   the climb, bars 9-10   "shorten each note by 4%, so the climb arrives
 *                          slightly early and eager". Read as an anticipation:
 *                          each attack comes 4% of its own length early and is
 *                          held to the same release, so the line leans forward
 *                          without any of it drifting off the bar the riff is
 *                          counting. The phrase's first note does not move.
 *   the climax, bar 11     "lengthen the first note by 12%" — `agogic()`, the
 *                          bible's own helper, on the beat the octave releases.
 *
 * It is written into the notes and NOT into a tempo map on purpose. A tempo map
 * would bend the pulse, and the pulse here belongs to FATHER: the whole design
 * of this section is two people talking over each other, and a lament that can
 * make the band follow it is not being talked over. The ceiling is 25% and the
 * largest thing here is 12%.
 */
function breatheLament(window: Note[]): Note[] {
  const pulled = agogic(window, [CLIMB_RELEASE], 0.12);
  return pulled.map((n): Note => {
    if (n[0] <= 0 || n[0] >= CLIMAX_BAR) return n;
    const early = Math.min(0.04 * n[1], 0.25);
    return [n[0] - early, n[1] + early, n[2], n[3]];
  });
}

/** Window beat the climb's octave releases on — bar 11, second note. */
const CLIMB_RELEASE = 17;
/** Window beat FAREWELL's bar 11 begins on, at half-time. */
const CLIMAX_BAR = 16;

/**
 * FAREWELL bars 9-12, +3 into D minor, every value doubled so it plays at
 * half-time against the riff. `FAREWELL_DYNAMICS` is applied before the
 * augmentation, because half of this theme lives in that table: bar 9 steps
 * back to 0.66 so bar 11 has somewhere to come from, and bar 11's downbeat at
 * 0.94 is the loudest note in the score outside a boss fight — which this is.
 *
 * On top of the table, every appoggiatura in the window leans, because the
 * table is written one value a BAR and a fall inside a bar therefore comes out
 * flat. In window beats, with FAREWELL's own degrees:
 *
 *   bar 10   8 -> 14   `FAREWELL_FALL`: hold three beats, step down one. The
 *                      theme's signature rhythm and its canonical appoggiatura.
 *   bar 11   16 -> 17  `8 -> b7`, the only quickening in the theme. The octave
 *                      dips to the b7 and comes straight back, so the dip is
 *                      the quiet one.
 *   bar 11   20 -> 24  the b6 — THE ACHE — sounded over the tonic chord and
 *                      falling into bar 12 across the barline.
 *   bar 12   24 -> 28 -> 30   `5 - 4 - b3`, the descent out of the climax,
 *                      falling in weight as well as in pitch.
 */
function lament(start: number, velocityScale = 1, rubato = false): Note[] {
  const whole = tracker(FAREWELL_RH, { checkBars: 4, gate: 1.0 });
  const shaped = shapeByBar(whole, FAREWELL_DYNAMICS, 4);
  const window = shaped
    .filter((n) => n[0] >= 32 && n[0] < 48)
    .map((n): Note => [(n[0] - 32) * 2, n[1] * 2, toMidi(n[2]) + 3, (n[3] ?? 0.7) * velocityScale]);
  // Bar 10 at half-time: the held Bb4 starts at beat 8 and falls to A4 at 14.
  const leaned = lean(window, [[8, 14]]);
  const dipped = fallingRun(leaned, [CLIMAX_BAR, CLIMB_RELEASE]);
  const settled = fallingRun(dipped, [24, 28, 30]);
  return shiftNotes(rubato ? breatheLament(settled) : settled, start);
}

/**
 * The half-time bridge maps FAREWELL's bars 9-12 onto eight bars of this cue:
 * bars 1-2 are the theme's bar 9, bars 3-4 its bar 10, bars 5-6 its bar 11 —
 * the arrival — and bars 7-8 its bar 12. So the orchestra is rationed to that
 * map. Strings enter alone on the climb; brass and the clean guitar an octave
 * below join only at `BRIDGE_WIDEN`, which is the theme's own climax, and the
 * sound physically opens exactly where the tune peaks. That is the bible's
 * rule for the whole score, and it is also why the bridge can be quiet: it
 * does not need to arrive loud, it needs somewhere to go.
 */
const BRIDGE_WIDEN = BRIDGE + 16;

function bridgeLament(): Note[] {
  return lament(BRIDGE, 0.9);
}

/** The part of the bridge's lament that the tutti is allowed to double. */
function bridgeLamentWide(): Note[] {
  return bridgeLament().filter((n) => n[0] >= BRIDGE_WIDEN);
}

/**
 * The climax, and the one statement of the lament that is allowed to breathe.
 * FATHER is underneath it at full speed, two beats late, on a pulse that does
 * not move; FAREWELL pushes into its climb and pulls at its top. That is the
 * argument, and it only reads as an argument if one of the two is bending.
 */
function climaxLament(): Note[] {
  return lament(CLIMAX, 1, true);
}

// ---------------------------------------------------------------- the solos

/** A two-bar idea in D aeolian / minor pentatonic, sequenced, extended and
 *  answered, with two grace-note bends as seasoning and nothing chromatic at
 *  the phrase ends. */
const SOLO_LEAD = `
  D4:0.75 F4:0.75 G4:0.5 A4:1 G4:0.5 F4:0.5 | A4:1 C5:1 Bb4:0.75 A4:0.25 G4:0.25 F4:0.25 G4:0.25 A4:0.25 |
  F4:0.75 G4:0.75 A4:0.5 C5:1 Bb4:0.5 A4:0.5 | Db4:0.25@0.7 D4:0.75 F4:1 G4:0.5 F4:0.25 D4:0.25 C4:0.25 D4:0.75 |
  D4:0.5 F4:0.5 G4:0.5 Bb4:1 A4:0.5 G4:0.5 F4:0.5 | A4:1 G4:0.5 F4:0.5 D4:1 -:0.5 F4:0.25 G4:0.25 |
  A4:0.75 Bb4:0.75 C5:0.5 D5:1 C5:0.5 Bb4:0.5 | B4:0.25@0.7 C5:0.75 A4:1 G4:0.5 F4:1.5 |
`;

/** Busier, climbing to one held bend on the solo's highest pitch, then settling
 *  an octave down to hand cleanly into the final riff. */
const SOLO2_LEAD = `
  D4:0.5 F4:0.5 A4:0.5 D5:0.5 C5:0.5 A4:0.5 F4:0.5 G4:0.5 | A4:0.5 Bb4:0.5 D5:0.5 F5:0.25 D5:0.25 C5:0.5 Bb4:0.5 A4:0.5 G4:0.5 |
  G4:0.5 A4:0.5 C5:0.5 E5:0.5 D5:0.5 C5:0.5 A4:0.5 G4:0.5 | F4:0.25 G4:0.25 A4:0.25 C5:0.25 D5:1 C5:0.5 A4:0.5 F4:1 |
  G4:0.5 Bb4:0.5 D5:0.5 F5:0.25 D5:0.25 C5:0.5 Bb4:0.5 G4:1 | A4:0.5 C5:0.5 E5:0.5 D5:0.5 C5:0.5 A4:0.5 E4:0.5 A4:0.5 |
  Bb4:0.25 C5:0.25 D5:0.25 F5:0.25 Gb5:0.25@0.75 G5:1.75 E5:0.5 D5:0.25 C5:0.25 | C5:0.75 A4:0.75 F4:1 D4:1.5 |
`;

/**
 * A player's right hand is not a volume slider. The two solos are written at
 * one base velocity and then breathed across their two-bar ideas, so each
 * phrase rises into its answer and falls out of it — without that, 114 notes
 * of lead guitar arrive at exactly one dynamic and the whole solo reads as a
 * sequencer.
 */
function guitarLead(): Note[] {
  return concatNotes(
    breathe(tracker(SOLO_LEAD, { start: SOLO, velocity: 0.85, checkBars: BAR, gate: 0.98 }), 8, 0.14),
    breathe(tracker(SOLO2_LEAD, { start: SOLO2, velocity: 0.92, checkBars: BAR, gate: 0.98 }), 8, 0.14),
  );
}

const SOLO_CHORDS = ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'Dm', 'Bb', 'C'];
const SOLO2_CHORDS = ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'Bb', 'C'];

// ----------------------------------------------------------------- the bass

/**
 * The bass plays FATHER too — the skeleton of it, with the grace notes left
 * to the guitars so the bottom stays legible. Same accent rule.
 */
const FATHER_SKELETON: Note[] = FATHER.filter((n) => n[1] > 0.26);

function bassRiff(start: number, statements = 2, scale = 1): Note[] {
  return offbeat(motif(FATHER_SKELETON, barStarts(start, statements, RIFF_BEATS), ['D1']), scale);
}

function bassPulse(chords: string[], start: number, velocity: number): Note[] {
  return chordRoots(chords, 1).map((midi, bar): Note => [start + bar * BAR, 3.5, midi, velocity]);
}

function bassLine(): Note[] {
  return concatNotes(
    bassRiff(INTRO, 1, 0.72),
    bassRiff(A, 2, 0.9),
    bassRiff(A2, 2, 1.0),
    bassPulse(SOLO_CHORDS, SOLO, 0.58),
    bassPulse(BRIDGE_CHORDS.slice(4), BRIDGE_WIDEN, 0.32),
    bassRiff(CLIMAX + 2, 2, 1.08),
    bassPulse(SOLO2_CHORDS, SOLO2, 0.64),
    bassRiff(FINAL, 2, 1.02),
    bassPulse(['Bb', 'Bb', 'C', 'C'], TURN, 0.85),
  );
}

// ------------------------------------------------------------------ the kit

const KICK = 'X..x..X...X.X..x';
const SNARE = '....X..g....X...';
const SNARE_FILL = '....X..g..X.XXXX';
const HAT = 'x.X.x.X.x.X.x.X.';

/**
 * How hard the band is playing, by section. This table is the cue's shape, and
 * it is the difference between eight sections and one long section: the riff
 * grows A -> A2 -> climax -> final, the solos sit back, and the bridge is a
 * different room. Nothing downstream may flatten it.
 */
function drive(beat: number): number {
  if (beat >= BRIDGE && beat < CLIMAX) return 0.32;
  if (beat >= SOLO && beat < BRIDGE) return 0.62;
  if (beat >= SOLO2 && beat < FINAL) return 0.68;
  if (beat < A) return 0.6;
  if (beat < A2) return 0.82;
  if (beat < SOLO) return 0.92;
  if (beat >= CLIMAX && beat < SOLO2) return 1;
  return 0.96;
}

function kickLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < LENGTH / BAR; bar++) {
    const at = bar * BAR;
    const level = drive(at);
    if (at >= BRIDGE && at < CLIMAX) {
      // Nothing for four bars, then two soft strokes a bar. The silence is the
      // point: the one place in the cue where the clock stops.
      if (at < BRIDGE_WIDEN) continue;
      notes.push(...drumLine('X.......x.......', { start: at, pitch: 'C1', velocity: 0.42 }));
      continue;
    }
    notes.push(...drumLine(KICK, { start: at, pitch: 'C1', velocity: level }));
  }
  return notes;
}

function snareLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < LENGTH / BAR; bar++) {
    const at = bar * BAR;
    if (at >= BRIDGE && at < CLIMAX - BAR) continue;
    if (at === CLIMAX - BAR) {
      for (let s = 0; s < 8; s++) notes.push([at + s * 0.5, 0.5, 'D2', 0.42 + (s / 8) * 0.55]);
      continue;
    }
    const fill = bar % 8 === 7;
    notes.push(
      ...drumLine(fill ? SNARE_FILL : SNARE, { start: at, pitch: 'D2', velocity: drive(at) * 0.92 }),
    );
  }
  return notes;
}

function hatLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < LENGTH / BAR; bar++) {
    const at = bar * BAR;
    // No hats at all in the bridge: it is the one place the clock stops.
    if (at >= BRIDGE && at < CLIMAX) continue;
    notes.push(...drumLine(HAT, { start: at, pitch: 'F#3', velocity: drive(at) * 0.5 }));
  }
  return notes;
}

function crashLine(): Note[] {
  return [A, A2, SOLO, BRIDGE, CLIMAX, SOLO2, FINAL, TURN].map(
    (beat): Note => [beat, 1.5, 'C5', beat === CLIMAX ? 0.75 : 0.66],
  );
}

function tomLine(): Note[] {
  const pitches = ['A3', 'A3', 'F3', 'F3', 'D3', 'C3'];
  return concatNotes(
    ...[A2, CLIMAX, FINAL].map((landOn) =>
      pitches.map((pitch, i): Note => [landOn - 1.5 + i * 0.25, 0.24, pitch, 0.8 - i * 0.01]),
    ),
  );
}

// --------------------------------------------------------- brass and strings

function brassStabs(): Note[] {
  const notes: Note[] = [];
  const runs: Array<[number, number, number[], number]> = [
    [A, 2, [1.5, 2.5], 0.66],
    [A2, 2, [0, 1.5, 2.5, 3.5], 0.82],
    [FINAL, 2, [0, 1.5, 2.5, 3.5], 0.88],
  ];
  for (const [start, statements, offsets, velocity] of runs) {
    riffChords(statements).forEach((symbol, i) => {
      const at = start + i * 2;
      for (const offset of offsets) {
        const beat = at + offset;
        if (beat >= start + statements * RIFF_BEATS) continue;
        for (const midi of chordMidis(symbol, { octave: 4, center: 71 })) {
          notes.push([beat, 0.25, midi, velocity * (Math.abs(beat - Math.round(beat)) < 1e-6 ? 0.85 : 1)]);
        }
      }
    });
  }
  // Breathed across the riff's own four bars. The off-beat accent is written
  // into `velocity` above and survives, because the arch is far smaller than
  // the 0.15 gap between the downbeat and the "and".
  return breathe(notes, RIFF_BEATS, 0.07);
}

/** The bridge: the lament in unison on brass, and nothing else from them —
 *  and not until the theme's own climax. */
function brassLine(): Note[] {
  return concatNotes(
    scaleVelocity(bridgeLamentWide(), 0.85),
    scaleVelocity(climaxLament(), 0.95),
  );
}

/** Strings take the lament as written, and widen at the climax by doubling an
 *  octave below from bar 11 onward — the sound physically opens where the tune
 *  peaks, which is the bible's rule for the whole score. */
function stringsLine(): Note[] {
  const climax = climaxLament();
  const fromBar11 = climax.filter((n) => n[0] >= CLIMAX + 16);
  return concatNotes(
    bridgeLament(),
    chordLine(BRIDGE_TRIADS, {
      start: BRIDGE,
      octave: 3,
      center: 64,
      velocity: 0.22,
      dur: 3.8,
      roll: 0.05,
    }),
    climax,
    transposeNotes(scaleVelocity(fromBar11, 0.8), -12),
  );
}

/** Wordless, and only here: the choir doubles the lament in the climax. */
function choirLine(): Note[] {
  return scaleVelocity(climaxLament(), 0.75);
}

/** A clean guitar an octave below the bridge's melody, as the bible asks —
 *  from the arrival onward, so it is part of the widening and not of the entry. */
function cleanGuitar(): Note[] {
  return transposeNotes(scaleVelocity(bridgeLamentWide(), 0.8), -12);
}

export const jechtTrack: Track = {
  name: 'boss-jecht',
  bpm: 144,
  /**
   * The pulse bends in exactly one place, and it is the one place the drums
   * are not in the room.
   *
   * Beats 112-128 are the top of the half-time bridge: no kick, no snare, no
   * hats, no riff, no bass. Strings and the lament, and nothing else — "the one
   * place in the cue where the clock stops", which up to now was a figure of
   * speech about note values while the clock carried on at 144. It slows to
   * 126 across those twelve beats and is pulled back to 144 by `BRIDGE_WIDEN`,
   * where the kick, the guitars and the brass come back with the theme's own
   * arrival. The band takes the tempo back; that is what a band does coming out
   * of a breakdown, and it is why the return lands.
   *
   * Everywhere else the pulse is 144 — including `loop.start` and `loop.end`,
   * so the wrap cannot lurch — because everywhere else FATHER is playing, and
   * FATHER does not follow anybody.
   */
  tempo: tempoMap(
    rit(BRIDGE, BRIDGE + 12, 126, 'the clock slows'),
    accel(BRIDGE + 12, BRIDGE_WIDEN, 144, 'the band takes it back'),
  ),
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.56, damp: 0.46, width: 0.86, preDelay: 0.008 },
    delay: { timeBeats: 0.5, feedback: 0.22, damp: 2800 },
  },
  channels: [
    { name: 'guitar L', instrument: 'guitar-dist', volume: 0.72, pan: -0.35, notes: concatNotes(guitarL(), bridgeGuitar(), turnGuitar()), fx: { reverb: 0.08 } },
    { name: 'guitar R', instrument: 'guitar-dist', volume: 0.64, pan: 0.35, notes: guitarR(), fx: { reverb: 0.08 } },
    { name: 'guitar lead', instrument: 'guitar-dist', volume: 0.8, pan: -0.08, notes: guitarLead(), fx: { reverb: 0.16, delay: 0.14 } },
        // `guitar-lead` and `guitar-clean` have sampled presets but no synthesised
    // voices, so both parts play through `guitar-dist`: the lead is the same
    // amp pushed by velocity, and the "clean-ish" octave doubling is the same
    // amp rolled back. See docs/audio/requests-ffx-bosses.md.
    { name: 'guitar clean', instrument: 'guitar-dist', volume: 0.42, pan: 0.24, notes: cleanGuitar(), fx: { reverb: 0.18 } },
    { name: 'bass', instrument: 'bass', volume: 0.9, pan: 0, notes: bassLine(), fx: { reverb: 0.05 } },
    {
      name: 'sub',
      instrument: 'bass-sub',
      volume: 0.4,
      pan: 0,
      // Only under the climax. In the bridge it just refills the room the
      // arrangement is trying to empty.
      // A swell across the climax rather than a flat floor under it: the
      // argument gets heavier as it goes on.
      notes: chordRoots(riffChords(2), 1).map(
        (midi, i): Note => [CLIMAX + i * 2, 1.8, midi, 0.4 + (i / 15) * 0.22],
      ),
    },
    { name: 'kick', instrument: 'kick', volume: 0.95, pan: 0, notes: kickLine() },
    { name: 'snare', instrument: 'snare', volume: 0.82, pan: -0.05, notes: snareLine(), fx: { reverb: 0.14 } },
    { name: 'hats', instrument: 'hat', volume: 0.36, pan: 0.2, notes: hatLine() },
    { name: 'toms', instrument: 'tom', volume: 0.58, pan: -0.15, notes: tomLine(), fx: { reverb: 0.18 } },
    { name: 'crash', instrument: 'crash', volume: 0.46, pan: 0.1, notes: crashLine(), fx: { reverb: 0.28 } },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.54, pan: -0.28, notes: brassStabs(), fx: { reverb: 0.16 } },
    { name: 'brass', instrument: 'brass', volume: 0.76, pan: -0.16, notes: brassLine(), fx: { reverb: 0.32, delay: 0.1 } },
    { name: 'strings', instrument: 'strings', volume: 0.6, pan: 0.2, notes: stringsLine(), fx: { reverb: 0.4 } },
    { name: 'choir', instrument: 'choir', volume: 0.5, pan: 0.1, notes: choirLine(), fx: { reverb: 0.5 } },
  ],
};

export default jechtTrack;
