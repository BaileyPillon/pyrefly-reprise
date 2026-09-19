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
 * Three craft notes, because they are most of what stops this reading as a
 * sampler:
 *   - At 40 bpm and double augmentation, a single hymn note lasts up to nine
 *     seconds. A choir sample held that long is dead. `swell()` splits every
 *     long note into two or three tied attacks that grow into each other
 *     (THEMES.md §Dynamics sanctions this for strings and choir only), so a
 *     held note breathes instead of sitting still. A note that *leans* is the
 *     one exception and it tapers instead — see `LEANING` below.
 *   - HYMN bar 4's beat-4 rest is written in all four voices, and at this
 *     augmentation it is three full seconds of silence with the drone alone.
 *     That is the cue. Do not fill it.
 *   - THE APPOGGIATURA RULE, which is THEMES.md's "single most important
 *     number in this file": every stepwise fall in the tune leans, and the
 *     leaning note is LOUDER than the note it falls to. HYMN's dynamics are
 *     written one value per bar, so without `LEANING` below every one of those
 *     falls comes out flat — and the climax came out *backwards*, because a
 *     six-beat E5 split by `swell()` was struck at 76% of its target while the
 *     D5 it falls to arrived at 100%. The highest note in the prayer was the
 *     quieter of the pair. That is the loudest single tell of a machine.
 *
 * THE PULSE. This cue has a tempo map and it contains no tempo change at all,
 * which is deliberate: THEMES.md §Rubato ends "HYMN, and the Yunalesca canon —
 * zero. A congregation does not rubato", and §HYMN says the same in prose, so
 * the pulse is 40 bpm from the first beat to the last. What the map carries is
 * two FERMATAS — time stopped, not bent — in the only two places the written
 * score itself stops: bar 4's rest in all four voices, and the unresolved `Am`
 * of bar 16. A congregation does not rubato. It does breathe, and it does hold
 * the last chord.
 *
 * Form (4/4, 40 bpm, 140 beats, 210 s written + 5.6 s of held time):
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
  fermata,
  shiftNotes,
  tempoMap,
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
 * THE APPOGGIATURA PAIRS, in cue beats: every stepwise fall in HYMN's soprano,
 * as [the leaning note, the note it resolves to].
 *
 * THEMES.md §Dynamics: "The appoggiatura rule: the leaning note is LOUDER than
 * its resolution, +0.08. Use `lean()`. This is the single most important number
 * in this file." And for Bailey, in the listening guide: "Are the sad notes
 * loud? In this music the note that aches is meant to be louder than the note
 * it falls to. If the aching note is the quiet one, we got it backwards."
 *
 * Hymn bar, degrees, and what each one is:
 *   bar  6   4 -> b3   the first sigh of the A' phrase
 *   bar  8   2 -> 1    THE AMEN. The F#4 is a 6th against Am — the ache itself
 *   bar 11   8 -> b7   THE CLIMAX, the highest note in the prayer
 *   bar 12   5 -> 4    the descent out of the climax
 *   bar 14   4 -> b3   the sigh again, on the way home
 *
 * Bars 2 and 15 fall by a THIRD rather than by a step: that is arpeggiation,
 * not a leaning note, and it is left alone.
 * Bar 16's sigh does not happen at all — see {@link sopranoLine}.
 *
 * Two more stepwise falls exist in the tune and are NOT in this list, because
 * `lean()` cannot express either of them — see {@link CONTOUR}.
 */
const LEANING: Array<[number, number]> = [
  [bar(6), bar(6) + 4],
  [bar(8), bar(8) + 4],
  [bar(11), bar(11) + 6],
  [bar(12), bar(12) + 4],
  [bar(14), bar(14) + 4],
];

/** The beats a leaning note is struck on — what {@link swell} must not level. */
const LEANING_BEATS: ReadonlySet<number> = new Set(LEANING.map((p) => p[0]));

/**
 * THE TWO FALLS `lean()` CANNOT REACH, written out by hand as velocities.
 *
 * `tools/audio/themes-audit.mjs` reads the score rather than the audio and
 * finds every held stepwise fall in the tune, not just the ones an arranger
 * remembered to declare. It found two more here, and both were real:
 *
 *   bar 6 -> bar 7   `b3 -> 2` ACROSS THE BARLINE, G4 to F#4. The G4 is the
 *                    resolution of bar 6's sigh AND the leaning note of the
 *                    next fall, and `lean()` gives a note one role or the
 *                    other, never both: `up` is tested before `down`, so
 *                    adding the pair would have cancelled the sigh above it
 *                    and left bar 6 flat. Measured: 0.48 leaning on 0.60 —
 *                    backwards, and over a bar change, which is the most
 *                    exposed place in the phrase to get it wrong.
 *   bar 10           `5 4 5`, B4 - A4 - B4. This was called a neighbour and
 *                    excused on the grounds that it turns back upward. It does
 *                    turn back upward, and a lower neighbour is still lighter
 *                    than the notes either side of it; what it was instead was
 *                    three notes at 0.640, dead flat, in the bar that carries
 *                    THE FINGERPRINT into the climax.
 *
 * So both are written as explicit levels, applied after {@link lean} so
 * nothing can level them back out. Bars 6-7 become one symmetrical arch —
 * `0.64 0.56 | 0.48 0.56 0.64` — falling to the F#4 that is the floor of the
 * phrase and climbing back out of it through the rising figure `2 b3 4` into
 * the amen. Bar 9 leans forward into the climb instead of sitting still, and
 * bar 10 dips on its neighbour and returns ABOVE where it left, which is how
 * a climb arrives somewhere: 0.68 -> 0.58 -> 0.72, and then bar 11 at 0.86.
 */
const CONTOUR: ReadonlyMap<number, number> = new Map([
  // bars 6-7: the arch down to the floor of the phrase and back up out of it
  [bar(6) + 0, 0.64], // A4  the sigh leans
  [bar(6) + 4, 0.56], // G4  its resolution, and the next leaning note
  [bar(7) + 0, 0.48], // F#4 the floor
  [bar(7) + 2, 0.56], // G4
  [bar(7) + 4, 0.64], // A4  and up into the amen
  // bars 9-10: the climb, which has to sound like one
  [bar(9) + 0, 0.5], // G4
  [bar(9) + 4, 0.58], // A4
  [bar(10) + 0, 0.68], // B4
  [bar(10) + 4, 0.58], // A4  the neighbour, lighter than both its B4s
  [bar(10) + 6, 0.72], // B4  back above where it left
]);

/** The written levels, over whatever the per-bar arch and `lean()` produced. */
function contour(notes: Note[]): Note[] {
  return notes.map((n): Note => {
    const written = CONTOUR.get(n[0]);
    return written === undefined ? n : [n[0], n[1], n[2], written];
  });
}

/**
 * A held note a sampler cannot swell, faked as two or three tied attacks that
 * grow into each other — THEMES.md §Dynamics, strings and choir only, never
 * piano. Without this every long note in the cue is a flat block of sample.
 *
 * `leaning` names the beats carrying an appoggiatura, and those go the other
 * way: struck at their full weight and then tapering, because a leaning note
 * leans and releases into its resolution. Growing into it would put the accent
 * on the wrong note of the pair, which is what the climax used to do — the E5
 * was struck at 0.76 of its target and the D5 under it arrived at 1.0. The
 * taper is deliberately shallower than the swell (12% against 24%) so that
 * every attack of the leaning note, not only its first, stays above the note
 * it falls to.
 */
function swell(
  notes: Note[],
  maxBeats = 4,
  overlap = 0.3,
  leaning: ReadonlySet<number> = new Set(),
): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    const base = n[3] ?? 0.8;
    if (n[1] <= maxBeats) {
      out.push(n);
      continue;
    }
    const parts = Math.min(3, Math.ceil(n[1] / maxBeats));
    const seg = n[1] / parts;
    const leans = leaning.has(n[0]);
    for (let i = 0; i < parts; i++) {
      const through = parts > 1 ? i / (parts - 1) : 1;
      const level = leans ? 1 - 0.12 * through : 0.76 + 0.24 * through;
      out.push([
        n[0] + i * seg,
        seg + (i < parts - 1 ? overlap : 0),
        n[2],
        Math.min(1, base * level),
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
 * The tune. Three changes to the written hymn, all required by the bible:
 * every stepwise fall leans (the held note is LOUDER than the note it falls
 * to — {@link LEANING}), the two falls `lean()` cannot reach are written out
 * by hand ({@link CONTOUR}), and bar 16's sigh never happens at all.
 */
function sopranoLine(): Note[] {
  const sung = voice(HYMN_SOPRANO);
  // HYMN's dynamics are one value a bar, so a fall inside a bar comes out flat
  // unless it is leaned. Five pairs, from the first sigh to the last.
  const leaned = contour(lean(sung, LEANING));
  // Bar 16 is rewritten below, so drop whatever the written hymn had there.
  const upToBar15 = leaned.filter((n) => n[0] < bar(16));
  // THE REFUSAL: the 2 held over the iv for the whole bar, and no tonic after
  // it. The written amen would have fallen F#4 -> E4 here; it does not. It is
  // a leaning note with nothing to lean on, so it keeps the ordinary swell:
  // the alto, tenor and bass hold the same chord and grow with it, and a
  // soprano tapering under three voices that are opening out would bury the
  // one note the whole ending is about.
  const held: Note[] = [[bar(16), 8, 'F#4', 0.46]];
  return concatNotes(swell(upToBar15, 4, 0.3, LEANING_BEATS), swell(held, 4, 0.3));
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

/** Beat HYMN bar 4's rest begins on — the breath, written in all four voices. */
const BREATH = bar(4) + 6; // 34

export const yuYevonTrack: Track = {
  name: 'boss-yu-yevon',
  bpm: 40,
  /**
   * Two fermatas and NOT ONE TEMPO CHANGE.
   *
   * THEMES.md §Rubato: "HYMN, and the Yunalesca canon — zero. A congregation
   * does not rubato." So the pulse never bends: `bpmAt()` is 40 at the first
   * beat, at `loop.start`, at `loop.end` and at every beat in between, and the
   * wrap cannot lurch because there is nothing to lurch between.
   *
   * What a congregation *does* do is stop. Time is held twice, and both times
   * on a place the written score already stops:
   *
   *   beat  34  THE BREATH. HYMN bar 4 rests on beat 4 in all four voices;
   *             doubled and at 40 bpm that is three seconds of the drone
   *             alone, and it is the cue. Two and a half more seconds of it.
   *   beat 124  NO CADENCE. The choir lands on the `Am` that is never resolved
   *             and the organum's F#5 lands an octave above the soprano's F#4.
   *             Everything struck on that beat is held through the pause. It
   *             is the last chord of a prayer that does not have a last chord.
   *
   * Both sit inside the loop (4 -> 140), so they are heard on every pass.
   */
  tempo: tempoMap(
    fermata(BREATH, 2.4, 'the breath'),
    fermata(bar(16), 3.2, 'no cadence'),
  ),
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
