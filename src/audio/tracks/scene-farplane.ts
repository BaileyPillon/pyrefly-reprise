/**
 * "Where the Pyreflies Rest" — the Farplane.
 *
 * ORIGINAL COMPOSITION. E, 92 bpm, and deliberately modeless: the whole cue is
 * built on stacked fourths, which have no third in them, so it is never quite
 * major and never quite minor. Ethereal strings, a harp that never hurries and
 * a wordless voice a long way off. The one emotion is rest without forgetting.
 *
 * THE DECLARED KEY, AND WHY IT IS WRONG. The cue map's row 14 says **E
 * major**. This cue is in **E Aeolian, with one borrowed major third in the
 * answer section** — and so is any cue that obeys row 14, because the row
 * contradicts itself. Its own themes column asks for two things:
 *
 *   - HYMN, harmonised. HYMN is E Aeolian and THEMES.md §1 says of it, in
 *     bold, that the 7th is "never sharpened, in any transformation, for any
 *     reason". E major's 7th is D#. There is no arrangement of the prayer in
 *     E major that does not break its own resemblance guard.
 *   - `FAREWELL_RISE`, whose fourth degree is the MINOR third, G natural —
 *     that being the entire point of putting it beside `SONGSTRESS_RISE`,
 *     which has the major one. "Minor then major" is the row's own gloss.
 *
 * So the music cannot be moved to the declared key without destroying the
 * material the same row requires, and the declaration is what is in error.
 * Measured over the score: 99.5% of this cue's weighted pitch content lies
 * inside E Aeolian, the exception being the 0.5% of G# that is FFX-2's answer
 * arriving, which is exactly the one borrowed note the cue exists to stage.
 * **Three files still say "E major" and none of them is the arranger's:**
 * `docs/audio/THEMES.md` cue map row 14, `CUE_MAP` in
 * `tools/audio/themes-audit.mjs`, and `TRACK_BLURBS` in `./index.ts`. They
 * should read `E Aeolian (one borrowed major 3rd)`.
 *
 * WHAT DID CHANGE HERE. The audit was right that something was wrong, just
 * not about which end. A key estimate over the old score came back **A
 * major**, with E only the third candidate: six two-voice stacks of fourths
 * in a row put more weight on the 4 and the b7 than on the tonic, so nothing
 * told the ear where home was. The floor is an open fifth now and the harp's
 * figure comes home to its own root; E is the tonic by a clear margin
 * (E minor r=0.76, E major 0.71, A major 0.67) and the fourths above it are
 * as modeless as they ever were.
 *
 * NO TEMPO MAP, DELIBERATELY. Rubato is the one expressive device this cue is
 * not allowed: THEMES.md's rubato table gives HYMN — which is the whole
 * TOGETHER section — a flat **zero**, because a congregation does not rubato.
 * Everything else here is a drone.
 *
 * THEMES (docs/audio/THEMES.md, cue map row 14).
 *
 *   - HYMN, harmonised in QUARTAL STACKS and distant. `HYMN_SOPRANO`'s first
 *     eight bars are sung by the choir over voicings of fourths — which is
 *     also what lets the prayer's Aeolian G natural sit inside an E-major
 *     scene without either of them being wrong.
 *   - `FAREWELL_RISE` ANSWERED BY `SONGSTRESS_RISE`. The two games open on the
 *     same four scale degrees, one with a minor third and one with a major
 *     one. Here they are put side by side, the flute asking and the voices
 *     answering, and then in the fourth section they are played together. The
 *     cue says nothing about it and neither should anyone else.
 *
 * Form (4/4, 92 bpm, 40 bars, 104 s):
 *   bars  1- 8  bed       beats   0- 32  fourths, harp, nothing happening
 *   bars  9-16  call      beats  32- 64  FAREWELL_RISE, flute, alone   <- loop
 *   bars 17-24  answer    beats  64- 96  SONGSTRESS_RISE, voices
 *   bars 25-32  together  beats  96-128  the hymn, harmonised in fourths
 *   bars 33-40  bed       beats 128-160  back to the fourths, and rest
 * Loop 32 -> 160.
 */

import { concatNotes, toMidi, tracker, type Note, type Track } from '../score.ts';
import { cell } from './motifs.ts';
import { FAREWELL_RISE, HYMN_SOPRANO, SONGSTRESS_RISE } from './themes.ts';
import { doubled, humanise, legato, phrase } from './ffx2-common.ts';

const BED_A = 0;
const CALL = 32;
const ANSWER = 64;
const TOGETHER = 96;
const BED_B = 128;
const LENGTH = 160;

/**
 * A stack of fourths on a root. Three or four of them is the whole harmonic
 * vocabulary of this cue: no thirds, so no mode, so nothing to resolve.
 */
function quartal(root: string, voices = 3): number[] {
  const base = toMidi(root);
  return Array.from({ length: voices }, (_, i) => base + i * 5);
}

/** Planing: the same shape moved bodily by step, with no functional logic. */
interface Slab {
  at: number;
  dur: number;
  root: string;
  vel: number;
  voices?: number;
}

function slabs(list: Slab[], seed: number, octave = 0): Note[] {
  const notes: Note[] = [];
  for (const s of list) {
    quartal(s.root, s.voices ?? 3).forEach((midi, v) => {
      // Entries are staggered a little: a section does not arrive together.
      notes.push([s.at + v * 0.05, s.dur - v * 0.05, midi + octave, s.vel * (1 - v * 0.06)]);
    });
  }
  return humanise(notes, 0.03, seed);
}

/**
 * Which roots a section may stack fourths on, and why the list is short.
 *
 * A stack of fourths is only modeless if every note in it belongs to the mode.
 * In E Aeolian — the prayer's mode, and the mode of FFX's minor-third
 * farewell — the usable roots are E (E-A-D), A (A-D-G), D (D-G-C), B (B-E-A)
 * and F# (F#-B-E). In E major — where FFX-2's rise puts a G# — only B and F#
 * survive. So the ANSWER section stands on B and F# and nothing else, and the
 * G natural and the G# never sound at the same time anywhere in the cue. They
 * take turns, and neither is ever wrong.
 */
const BED_SLABS: Slab[] = [
  { at: 0, dur: 7.6, root: 'E3', vel: 0.4 },
  { at: 8, dur: 7.6, root: 'A3', vel: 0.36 },
  { at: 16, dur: 7.6, root: 'E3', vel: 0.38 },
  { at: 24, dur: 7.6, root: 'B2', vel: 0.34, voices: 4 },
];

const CALL_SLABS: Slab[] = [
  { at: 0, dur: 7.6, root: 'E3', vel: 0.36 },
  { at: 8, dur: 7.6, root: 'A3', vel: 0.34 },
  // Three voices only: a fourth stack on D reaches F natural on its fourth
  // voice, and this cue's mode has an F#.
  { at: 16, dur: 7.6, root: 'D3', vel: 0.36 },
  { at: 24, dur: 7.6, root: 'E3', vel: 0.34 },
];

/** B and F# only: the two stacks E minor and E major agree on. */
const ANSWER_SLABS: Slab[] = [
  { at: 0, dur: 7.6, root: 'B2', vel: 0.36, voices: 4 },
  { at: 8, dur: 7.6, root: 'F#3', vel: 0.34 },
  { at: 16, dur: 7.6, root: 'B2', vel: 0.36 },
  { at: 24, dur: 7.6, root: 'F#3', vel: 0.32 },
];

/** Under the hymn: E, A, D, E — the prayer's own Em, G, Am, Em, in fourths. */
const HYMN_SLABS: Slab[] = [
  { at: 0, dur: 7.6, root: 'E3', vel: 0.36 },
  { at: 8, dur: 7.6, root: 'D3', vel: 0.34 },
  { at: 16, dur: 7.6, root: 'A3', vel: 0.36 },
  { at: 24, dur: 7.6, root: 'E3', vel: 0.34, voices: 4 },
];

function shift(list: Slab[], by: number): Slab[] {
  return list.map((s) => ({ ...s, at: s.at + by }));
}

const stringsNotes = concatNotes(
  slabs(BED_SLABS, 161),
  slabs(shift(CALL_SLABS, CALL), 162),
  slabs(shift(ANSWER_SLABS, ANSWER), 163),
  slabs(shift(HYMN_SLABS, TOGETHER), 164),
  slabs(shift(BED_SLABS, BED_B), 165),
);

/**
 * The floor of the hall — and the one thing in this cue that is not a fourth.
 *
 * A two-voice "stack" of fourths is a root and the note a fourth above it,
 * and six of them in a row on E, A and B put more weight on the 4 and the b7
 * than on the tonic: a key estimate run over the whole cue came back **A
 * major**, with E only third. That is not a bookkeeping complaint. It means a
 * listener has no reason to hear E as home, and a cue whose one emotion is
 * *rest without forgetting* has to have somewhere to rest.
 *
 * So the bottom two voices are an OPEN FIFTH — tonic and dominant, the oldest
 * drone pair there is, and the one interval that names a tonic without naming
 * a mode. Everything above it is still quartal and still modeless; it now has
 * a floor to be modeless over. THEMES.md sanctions it twice: "pedal points
 * under everything slow", and HYMN bar 1 is "the head over an open fifth".
 */
function openFifth(root: string, at: number, dur: number, vel: number, seed: number): Note[] {
  const base = toMidi(root);
  return humanise(
    [
      [at, dur, base, vel],
      // The fifth is bowed a breath after the root, as a section does.
      [at + 0.06, dur - 0.06, base + 7, vel * 0.92],
    ] as Note[],
    0.03,
    seed,
  );
}

const lowStrings = concatNotes(
  openFifth('E2', BED_A, 15.6, 0.34, 166),
  // The one move away from home, and it is to the fifth, not to the fourth.
  openFifth('B1', BED_A + 16, 15.6, 0.32, 167),
  openFifth('E2', CALL, 31.6, 0.3, 168),
  // The answer's stacks are B and F#; the floor agrees with them.
  openFifth('B1', ANSWER, 31.6, 0.32, 169),
  // The prayer gets a tonic pedal under it and nothing else moves.
  openFifth('E2', TOGETHER, 31.6, 0.34, 170),
  openFifth('E2', BED_B, 31.6, 0.28, 171),
);

// --- the call and the answer ----------------------------------------------

/**
 * Four notes, and the fourth is the one that means something: both rises end
 * on their third — minor for FFX, major for FFX-2 — and that note is held and
 * arrived at, so it is the LOUDEST of the four. A four-note cell rendered at
 * one velocity is a sampler playing four notes; this is somebody asking a
 * question.
 */
const RISE_SHAPE = [0.84, 0.92, 0.98, 1.08];

function rise(pattern: Note[], at: number, tonic: string, velocity: number, seed: number): Note[] {
  const shaped = cell(pattern, at, tonic, velocity).map(
    (n, i) => [n[0], n[1], n[2], velocity * (RISE_SHAPE[i] ?? 1)] as Note,
  );
  return humanise(legato(shaped, 0.1), 0.02, seed);
}

/**
 * The flute asks with FFX's four notes — B, E, F#, and the MINOR third, G.
 * Over stacked fourths there is no major third anywhere to contradict it.
 */
const fluteNotes = concatNotes(
  rise(FAREWELL_RISE, CALL + 4, 'E5', 0.5, 171),
  rise(FAREWELL_RISE, CALL + 20, 'E5', 0.46, 172),
  // One exchange inside the answer section: the question, then the voices.
  rise(FAREWELL_RISE, ANSWER + 12, 'E5', 0.44, 173),
);

/**
 * The voices answer with FFX-2's — the same four degrees, and the third is
 * major. The two versions never sound together; they take turns, and the cue
 * says nothing about it.
 */
const choirNotes = concatNotes(
  rise(SONGSTRESS_RISE, ANSWER + 4, 'E5', 0.42, 175),
  rise(SONGSTRESS_RISE, ANSWER + 18, 'E5', 0.4, 176),
  rise(SONGSTRESS_RISE, ANSWER + 26, 'E4', 0.38, 177),
  // The prayer itself, bars 1-4, sung a long way off over the fourths.
  humanise(
    phrase(
      legato(
        tracker(HYMN_SOPRANO, { start: TOGETHER, checkBars: 4, velocity: 0.34, scale: 2 }).filter(
          (n) => n[0] < TOGETHER + 32,
        ),
        0.12,
      ),
      TOGETHER,
      32,
      0.12,
    ),
    0.03,
    180,
  ),
);

/** And the hymn's next four bars, in the last section, an octave down. */
const choirLow = humanise(
  phrase(
    legato(
      doubled(
        tracker(HYMN_SOPRANO, { start: BED_B - 32, checkBars: 4, velocity: 0.3, scale: 2 }).filter(
          (n) => n[0] >= BED_B && n[0] < BED_B + 32,
        ),
        -12,
        1,
      ),
      0.12,
    ),
    BED_B,
    32,
    0.1,
  ),
  0.03,
  181,
);

// --- light -----------------------------------------------------------------

/**
 * Harp: fourths, arpeggiated, never faster than a heartbeat. Stacks, not
 * triads — a harp playing E major triads would put a G# into a section built
 * to have no third at all.
 */
function quartalArp(start: number, root: string, step: number, velocity: number, span = 4): Note[] {
  // Three voices, never four: the fourth voice of a stack on D is an F
  // natural, and this cue's mode has an F#.
  const stack = quartal(root, 3);
  // Root, fourth, seventh, and home to the root. The obvious shape puts the
  // fourth in twice, which over eighty notes is most of why the cue used to
  // read as sitting on its own subdominant; coming home on the root costs
  // nothing and makes each figure a gesture rather than a wander.
  const shape = [0, 1, 2, 0, 2, 1];
  return shape.slice(0, span).map(
    (index, i): Note => [start + i * step, step * 2.6, stack[index]!, velocity * (i === 0 ? 1.14 : 1)],
  );
}

const harpNotes = humanise(
  concatNotes(
    ...[
      { start: BED_A, list: BED_SLABS },
      { start: CALL, list: CALL_SLABS },
      { start: ANSWER, list: ANSWER_SLABS },
      { start: TOGETHER, list: HYMN_SLABS },
      { start: BED_B, list: BED_SLABS },
    ].flatMap(({ start, list }, i) =>
      list.map((slab, bar) =>
        // The harp takes the section's own stack an octave up, so it can never
        // put a note a semitone from the bed holding underneath it.
        quartalArp(start + bar * 8 + (bar % 2 === 0 ? 0 : 2), slab.root.replace(/\d/, (d) => String(Number(d) + 1)), 1, 0.28 + i * 0.01),
      ),
    ),
  ),
  0.04,
  182,
);

/** Celesta: motes of light. Seven of them in a hundred seconds. */
const celestaNotes: Note[] = [
  [CALL + 2, 3, 'B5', 0.34],
  [CALL + 18, 3, 'E6', 0.3],
  [ANSWER + 2, 3, 'F#6', 0.32],
  [ANSWER + 22, 3, 'B5', 0.28],
  [TOGETHER, 4, 'E6', 0.34],
  [TOGETHER + 16, 4, 'A5', 0.3],
  [BED_B + 24, 6, 'E6', 0.26],
];

/** One bell, at the top of the loop. */
const bellNotes: Note[] = [
  [CALL, 8, 'E4', 0.3],
  [TOGETHER, 8, 'E3', 0.28],
];

export const sceneFarplaneTrack: Track = {
  name: 'scene-farplane',
  bpm: 92,
  timeSig: [4, 4],
  loop: { start: CALL, end: LENGTH },
  length: LENGTH,
  tailSec: 6,
  fx: {
    reverb: { room: 0.9, damp: 0.2, width: 0.96, preDelay: 0.035 },
    delay: { timeBeats: 1.5, feedback: 0.24, damp: 2000 },
  },
  channels: [
    { name: 'strings', instrument: 'strings', volume: 0.6, pan: -0.1, notes: stringsNotes, fx: { reverb: 0.48 } },
    { name: 'low strings', instrument: 'strings-low', volume: 0.5, pan: 0.16, notes: lowStrings, fx: { reverb: 0.46 } },
    { name: 'pad', instrument: 'pad', volume: 0.4, pan: 0.05, notes: slabs(shift(ANSWER_SLABS, ANSWER), 183, -12), fx: { reverb: 0.55 } },
    { name: 'voices', instrument: 'choir', volume: 0.54, pan: -0.06, notes: choirNotes, fx: { reverb: 0.6, delay: 0.16 } },
    { name: 'voices low', instrument: 'choir', volume: 0.4, pan: 0.1, notes: choirLow, fx: { reverb: 0.6 } },
    { name: 'flute', instrument: 'flute', volume: 0.56, pan: 0.14, notes: fluteNotes, fx: { reverb: 0.5, delay: 0.2 } },
    { name: 'harp', instrument: 'harp', volume: 0.5, pan: -0.3, notes: harpNotes, fx: { reverb: 0.5, delay: 0.14 } },
    { name: 'celesta', instrument: 'celesta', volume: 0.38, pan: 0.3, notes: celestaNotes, fx: { reverb: 0.55, delay: 0.22 } },
    { name: 'bell', instrument: 'bell', volume: 0.26, pan: -0.2, notes: bellNotes, fx: { reverb: 0.6 } },
  ],
};

export default sceneFarplaneTrack;
