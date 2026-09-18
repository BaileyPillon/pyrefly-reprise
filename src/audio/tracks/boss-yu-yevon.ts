/**
 * "No End" — Yu Yevon, the true final battle.
 *
 * ORIGINAL COMPOSITION. Every other boss in this game is a person who wants
 * something. This one is a rite that has outlived everybody who believed in
 * it, so the cue is not a fight at all: it is HYMN — "Still Water" — sung once,
 * at half speed, and then refused a cadence.
 *
 * Per `docs/audio/THEMES.md` §HYMN, transformation *boss-yu-yevon*:
 *   - the full sixteen bars at `augment(…, 2)` — 32 bars at 40 bpm, one
 *     statement of roughly three minutes;
 *   - choir only, over a SINGLE low drone that never changes chord. The
 *     harmony of this cue is the four voices and nothing else;
 *   - bars 12-16 are stripped of their harmony: from the climax on, the drone
 *     stops and the voices sing unaccompanied;
 *   - the closing `Am | Em` amen is replaced by an `Am` held and never
 *     resolved — the soprano's F#4 leans on the iv and is never allowed to
 *     fall to the tonic;
 *   - a second choir enters a fifth above, eight beats late, for the last
 *     statement, and the hymn ends as bare organum on an open fifth.
 * No drums, no timpani, no cymbals, no brass, no attack anywhere.
 *
 * The organum voice is transposed DIATONICALLY up a fifth inside E Aeolian,
 * not chromatically: a chromatic fifth would put a C#5 against the final
 * chord's C natural, and E Aeolian's own fifth above the 2 is a diminished
 * one. Taking the diatonic fifth keeps the score's rule that no leading tone
 * and no borrowed tone ever enters this theme, and lands the last note on C5 —
 * which the held Am6 underneath already contains.
 *
 * Two craft notes, because they are most of what stops this reading as a
 * sampler:
 *   - At 40 bpm and double augmentation, a single hymn note lasts up to nine
 *     seconds. A choir sample held that long is dead. `swell()` splits every
 *     long note into two or three tied attacks that grow into each other
 *     (THEMES.md §Dynamics sanctions this for strings and choir only), so a
 *     held note breathes instead of sitting still.
 *   - HYMN bar 4's beat-4 rest is written in all four voices, and at this
 *     augmentation it is three full seconds of silence with the drone alone.
 *     That is the cue. Do not fill it.
 *
 * Form (4/4, 40 bpm, 140 beats, 210 s):
 *   beats   0-  4  drone alone, one low E                        <- loop start at 4
 *   beats   4- 36  HYMN bars 1-4    A         the head, and the breath
 *   beats  36- 68  HYMN bars 5-8    A'        the amen, first time
 *   beats  68- 92  HYMN bars 9-11   B         the climb; bar 11 is the climax
 *   beats  92-124  HYMN bars 12-15            UNACCOMPANIED from here
 *   beats 108-140  organum: soprano a diatonic fifth up, 8 beats late
 *   beats 124-132  HYMN bar 16                Am held; no amen, no resolution
 *   beats 132-140  the organum alone          bare, and it ends on the fifth
 * Loop 4 -> 140: the unresolved Am decays into the drone it started from, so
 * the prayer begins again without ever having finished. He has no end.
 */

import {
  concatNotes,
  shiftNotes,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import {
  augment,
  HYMN_ALTO,
  HYMN_BASS,
  HYMN_HEAD,
  HYMN_SOPRANO,
  HYMN_TENOR,
  lean,
  shapeByBar,
} from './themes.ts';
import { cell } from './motifs.ts';

/** HYMN is written in 4/4; doubling every value makes one hymn bar eight beats. */
const HYMN_BAR = 4;
const SLOW = 2;
const BAR = HYMN_BAR * SLOW; // 8 beats per sung bar

/** Beat the hymn's first bar lands on. Before it, the drone is alone. */
const HYMN_AT = 4;

/** Absolute beat of hymn bar `n` (1-indexed, as the bible numbers them). */
const bar = (n: number): number => HYMN_AT + (n - 1) * BAR;

/** Bar 11 is the climax; bar 12 is where the floor goes, and never comes back. */
const STRIP = bar(12); // 92
const LAST = bar(13); // 100 — the A" return, the hymn's last statement
const ORGANUM_AT = LAST + 8; // 108 — "a fifth above, eight beats late"
const LENGTH = 140; // 210 s at 40 bpm

/**
 * The dynamic arch, per hymn bar. HYMN takes no rubato — a congregation does
 * not rubato — so every drop of expression in this cue has to come from here.
 * Bar 9 steps back before the climb, bar 11 is the peak and is still only 0.78
 * because nothing in this cue is ever loud, and the A" return walks away.
 */
const HYMN_DYNAMICS = [
  0.42, 0.48, 0.52, 0.46,
  0.50, 0.56, 0.60, 0.52,
  0.54, 0.64, 0.78, 0.62,
  0.50, 0.46, 0.42, 0.38,
];

/**
 * A held note a sampler cannot swell, faked as two or three tied attacks that
 * grow into each other — THEMES.md §Dynamics, strings and choir only, never
 * piano. Without this every long note in the cue is a flat block of sample.
 */
function swell(notes: Note[], maxBeats = 4, overlap = 0.3): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    const base = n[3] ?? 0.8;
    if (n[1] <= maxBeats) {
      out.push(n);
      continue;
    }
    const parts = Math.min(3, Math.ceil(n[1] / maxBeats));
    const seg = n[1] / parts;
    for (let i = 0; i < parts; i++) {
      const grow = parts > 1 ? (0.24 * i) / (parts - 1) : 0.24;
      out.push([
        n[0] + i * seg,
        seg + (i < parts - 1 ? overlap : 0),
        n[2],
        Math.min(1, base * (0.76 + grow)),
      ]);
    }
  }
  return out;
}

/** One SATB voice: parsed, stretched to half speed, shaped by the arch, placed. */
function voice(src: string, velocityScale = 1): Note[] {
  const straight = tracker(src, { checkBars: HYMN_BAR, gate: 1.0 });
  const shaped = shapeByBar(straight, HYMN_DYNAMICS, HYMN_BAR);
  const scaled = velocityScale === 1
    ? shaped
    : shaped.map((n): Note => [n[0], n[1], n[2], Math.min(1, (n[3] ?? 0.8) * velocityScale)]);
  return shiftNotes(augment(scaled, SLOW), HYMN_AT);
}

// ------------------------------------------------------------------ soprano

/**
 * The tune. Two changes to the written hymn, both required by the bible:
 * the sigh at bar 8 leans (the F# is LOUDER than the E it falls to — the
 * appoggiatura rule), and bar 16's sigh never happens at all.
 */
function sopranoLine(): Note[] {
  const sung = voice(HYMN_SOPRANO);
  // Bar 8's amen: F#4 at beat bar(8), resolving to E4 four beats later.
  const leaned = lean(sung, [[bar(8), bar(8) + 4]]);
  // Bar 16 is rewritten below, so drop whatever the written hymn had there.
  const upToBar15 = leaned.filter((n) => n[0] < bar(16));
  // THE REFUSAL: the 2 held over the iv for the whole bar, and no tonic after
  // it. The written amen would have fallen F#4 -> E4 here; it does not.
  const held: Note[] = [[bar(16), 8, 'F#4', 0.46]];
  return concatNotes(swell(upToBar15), swell(held, 4, 0.3));
}

function altoLine(): Note[] {
  const sung = voice(HYMN_ALTO, 0.86).filter((n) => n[0] < bar(16));
  // Am, not Am -> Em: the third of the unresolved chord, held.
  return concatNotes(swell(sung), swell([[bar(16), 8, 'C4', 0.4]], 4, 0.3));
}

function tenorLine(): Note[] {
  const sung = voice(HYMN_TENOR, 0.84).filter((n) => n[0] < bar(16));
  return concatNotes(swell(sung), swell([[bar(16), 8, 'A3', 0.4]], 4, 0.3));
}

function bassLine(): Note[] {
  const sung = voice(HYMN_BASS, 0.88).filter((n) => n[0] < bar(16));
  // The bass stays on A2 as well: the chord is iv, and it stays iv.
  return concatNotes(swell(sung), swell([[bar(16), 8, 'A2', 0.44]], 4, 0.3));
}

// ------------------------------------------------------------------ organum

/**
 * HYMN's soprano, bars 13-16, a DIATONIC fifth up inside E Aeolian:
 *   E4 D4 E4 G4 | A4 G4 | B4 G4 | F#4 E4
 *   B4 A4 B4 D5 | E5 D5 | F#5 D5 | C5  B4
 * The last two notes matter. C5 is the diatonic fifth above the soprano's F#4
 * and is already a tone of the Am6 the choir is holding, so the two voices end
 * consonant; and the line closes on B — the FIFTH of the key, never the tonic.
 * An open fifth, no third, no cadence, one voice left singing.
 */
const ORGANUM = `
  B4:1 A4:1 B4:1 D5:1 | E5:2 D5:2 |
  F#5:2 D5:2          | C5:2 B4:2 |
`;

function organumLine(): Note[] {
  const line = tracker(ORGANUM, { checkBars: HYMN_BAR, gate: 1.0 });
  const shaped = shapeByBar(line, [0.34, 0.38, 0.36, 0.3], HYMN_BAR);
  return swell(shiftNotes(augment(shaped, SLOW), ORGANUM_AT));
}

// -------------------------------------------------------------------- drone

/**
 * "A single low drone." One pitch, E, for eleven bars, and then it is gone.
 * It does not follow the harmony because there is no harmony to follow: the
 * voices are the harmony, and this is the floor they stand on.
 */
function droneLine(octaveNote: string, velocity: number): Note[] {
  const notes: Note[] = [];
  for (let at = 0; at < STRIP; at += BAR) {
    notes.push([at, Math.min(BAR, STRIP - at) + 0.4, octaveNote, velocity]);
  }
  // The last statement of the drone fades rather than stopping dead, so the
  // voices are left alone by subtraction and not by an edit.
  const out = swell(notes, 4, 0.5);
  const lastTwo = out.slice(-2);
  for (const n of lastTwo) n[3] = (n[3] ?? 0.4) * 0.6;
  return out;
}

// ------------------------------------------------------------------- celesta

/**
 * A music box running down. It states HYMN_HEAD three times, three octaves
 * above the choir, each one quieter and each one further apart, and then it
 * stops before the climax and never comes back. Nothing else in the cue has an
 * attack; this is the only thing a listener can hear being struck.
 */
function celestaLine(): Note[] {
  return concatNotes(
    cell(augment(HYMN_HEAD, SLOW), bar(1), 'E6', 0.34),
    cell(augment(HYMN_HEAD, SLOW), bar(5), 'E6', 0.24),
    cell(augment(HYMN_HEAD, SLOW), bar(9), 'E6', 0.15),
  );
}

export const yuYevonTrack: Track = {
  name: 'boss-yu-yevon',
  bpm: 40,
  timeSig: [4, 4],
  loop: { start: HYMN_AT, end: LENGTH },
  length: LENGTH,
  tailSec: 9,
  fx: {
    reverb: { room: 0.94, damp: 0.2, width: 1, preDelay: 0.05 },
    delay: { timeBeats: 2, feedback: 0.22, damp: 2000 },
  },
  channels: [
    { name: 'choir soprano', instrument: 'choir', volume: 0.82, pan: -0.18, notes: sopranoLine(), fx: { reverb: 0.55 } },
    { name: 'choir alto', instrument: 'choir', volume: 0.6, pan: 0.08, notes: altoLine(), fx: { reverb: 0.55 } },
    // Tenor and bass were written for `choir-ooh`, the darker closed-vowel
    // choir. It has a sampled preset but no synthesised voice, and naming it
    // would throw on the runtime's fallback path — the path that exists so the
    // game never goes silent. They sit on `choir`, panned wide and pulled back,
    // and the SATB separation comes from register and seating instead.
    { name: 'choir tenor', instrument: 'choir', volume: 0.58, pan: -0.3, notes: tenorLine(), fx: { reverb: 0.58 } },
    { name: 'choir bass', instrument: 'choir', volume: 0.6, pan: 0.3, notes: bassLine(), fx: { reverb: 0.58 } },
    { name: 'choir organum', instrument: 'choir', volume: 0.5, pan: 0.42, notes: organumLine(), fx: { reverb: 0.68, delay: 0.18 } },
    { name: 'drone strings', instrument: 'strings-low', volume: 0.5, pan: -0.05, notes: droneLine('E1', 0.4), fx: { reverb: 0.42 } },
    { name: 'drone organ', instrument: 'organ', volume: 0.3, pan: 0.05, notes: droneLine('E2', 0.34), fx: { reverb: 0.5 } },
    { name: 'music box', instrument: 'celesta', volume: 0.36, pan: -0.38, notes: celestaLine(), fx: { reverb: 0.6, delay: 0.2 } },
  ],
};

export default yuYevonTrack;
