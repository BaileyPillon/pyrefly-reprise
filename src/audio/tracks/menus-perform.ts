/**
 * Performance helpers for the menu cues — `title`, `chapter-select`, `pause`.
 *
 * NOT a core file and not a track: this is shared workings for one arranger's
 * three cues (group `menus-clair-obscur`), kept in one place rather than
 * pasted three times. `themes.ts` owns the notes; this owns the way they are
 * played, and only the parts of that which are the same in all three cues.
 *
 * Everything here exists because of one line in docs/audio/THEMES.md:
 *
 *   > Never render a phrase at constant velocity.
 *
 * A per-bar dynamics table gets a phrase most of the way there, but it leaves
 * every note inside a bar at exactly the same level, which no player has ever
 * done. `perform()` layers the four things that are actually happening when
 * somebody plays a line: the shape of the phrase, the small lift a rising
 * interval gets, a hand that is not a grid, and — last, so nothing can undo
 * it — the appoggiatura rule.
 */

import type { Note, TempoMark } from '../score.ts';
import { toMidi } from '../score.ts';
import { agogic, lean } from './themes.ts';

/**
 * One marked leaning note and the note it falls to, in beats of the built
 * track.
 *
 * Each of the three cues exports its own table of these as `APPOGGIATURAS`, so
 * the claim "every appoggiatura in this cue leans" is checkable against the
 * notes the renderer will actually play rather than against a comment. THEMES.md
 * calls the inverted version "the single loudest tell of a synthetic
 * performance", and a rule nobody can check is a rule that drifts.
 */
export interface Appoggiatura {
  /** `Channel.name` the pair lives on. */
  channel: string;
  /** Beat of the leaning note — the one that must be LOUDER. */
  lean: number;
  /** Beat of its resolution — lower, and a step or third below in pitch. */
  resolve: number;
  /** Where in the music this is, for the audit's output. */
  where: string;
}

/** Deterministic pseudo-noise in -1..1 from a note's own beat and pitch. */
function wobble(beat: number, midi: number, salt: number): number {
  const x = Math.sin(beat * 12.9898 + midi * 78.233 + salt * 43.758) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * The small lift a line gets on the way up and gives back on the way down.
 *
 * Not a rule anybody writes in a score; it is just what hands and breath do,
 * and its absence is part of why a mock-up sounds typed. Kept deliberately
 * small (±0.03) so it colours the written arch instead of fighting it.
 */
export function contour(notes: Note[], amount = 0.03): Note[] {
  const order = [...notes].sort((a, b) => a[0] - b[0]);
  const lift = new Map<Note, number>();
  let previous: number | null = null;
  for (const note of order) {
    const midi = toMidi(note[2]);
    if (previous !== null) {
      if (midi > previous) lift.set(note, amount);
      else if (midi < previous) lift.set(note, -amount * 0.7);
    }
    previous = midi;
  }
  return notes.map((n) => {
    const delta = lift.get(n) ?? 0;
    return [n[0], n[1], n[2], clampVelocity((n[3] ?? 0.8) + delta)] as Note;
  });
}

/**
 * Deterministic velocity jitter, ±`amount` (THEMES.md: never more than 0.04,
 * "beyond that the arch stops reading"). Deterministic because a cue has to
 * render identically on every machine — the renderer's own timing jitter works
 * the same way.
 */
export function micro(notes: Note[], amount = 0.025, salt = 1): Note[] {
  return notes.map((n) => {
    const v = (n[3] ?? 0.8) + wobble(n[0], toMidi(n[2]), salt) * amount;
    return [n[0], n[1], n[2], clampVelocity(v)] as Note;
  });
}

function clampVelocity(v: number): number {
  return Math.max(0.05, Math.min(1, v));
}

/**
 * Apply a per-bar velocity table to a phrase that does not start at beat 0.
 *
 * `shapeByBar` in `themes.ts` indexes the table by `floor(beat / barBeats)` —
 * the *absolute* beat, which is right for a theme sitting at the top of a
 * track and silently wrong for a phrase placed anywhere else. Every statement
 * in these three cues is placed: `title`'s reprise starts at beat 56 and
 * `chapter-select`'s fourth pass at beat 78, so the whole eight-bar arch was
 * reading off the end of an eight-entry table and clamping to its last value.
 * The written crescendo was being thrown away and the phrase came out level.
 *
 * Same semantics as `shapeByBar` otherwise — it *sets* the velocity, because a
 * melody's dynamic is the table and nothing else. (`swell` below multiplies
 * instead, which is what an accompaniment with its own accents wants.)
 */
export function shapeBars(notes: Note[], table: number[], barBeats: number, at = 0): Note[] {
  return notes.map((n) => {
    const bar = Math.floor((n[0] - at) / barBeats + 1e-6);
    const target = table[Math.max(0, Math.min(bar, table.length - 1))];
    return [n[0], n[1], n[2], target ?? n[3]] as Note;
  });
}

export interface PerformOptions {
  /** Per-bar velocity table, applied first — the written arch. */
  table?: number[];
  /** Beats per bar for the table. 4 for the 4/4 cues, 3 for the waltz. */
  barBeats?: number;
  /**
   * Beat the phrase starts on, so `table` is indexed from its own bar 1.
   * Required whenever a table is given for a phrase that is not at beat 0;
   * `perform` throws rather than quietly flattening the arch.
   */
  at?: number;
  /** `[leaningBeat, resolvingBeat]` pairs — the appoggiatura rule. */
  leans?: Array<[number, number]>;
  /** How much louder the leaning note is. THEMES.md says 0.08 and means it. */
  lift?: number;
  /** Smaller leans for the inner sighs a phrase has besides its named ones. */
  softLeans?: Array<[number, number]>;
  /** Phrase-end beats (where a note *ends*) that get an agogic breath. */
  breaths?: number[];
  /** Breath size: 0.08 is a breath, 0.18 is an audible ritardando. */
  pull?: number;
  /** Velocity jitter amount, and a salt so two channels do not jitter alike. */
  jitter?: number;
  salt?: number;
  /** Contour amount; pass 0 for music that must not swell (the hymn's canon). */
  slope?: number;
}

/**
 * Turn written notes into a played phrase.
 *
 * Order matters and is the whole point: the table is the composer's plan, the
 * contour and the jitter are the performer, and `lean()` runs LAST so that
 * neither of them can end up making an appoggiatura quieter than the note it
 * falls to. THEMES.md calls that inversion "the single loudest tell of a
 * synthetic performance", so nothing downstream of it is allowed to happen.
 */
export function perform(notes: Note[], options: PerformOptions = {}): Note[] {
  let out = notes;
  if (options.table) {
    const barBeats = options.barBeats ?? 4;
    const at = options.at ?? 0;
    if (options.at === undefined && out.length > 0) {
      const first = Math.min(...out.map((n) => n[0]));
      if (first >= barBeats) {
        throw new Error(
          `perform(): a table was given for a phrase starting at beat ${first} with no "at" — ` +
            'the arch would be read off the wrong end of the table and the phrase would come out level',
        );
      }
    }
    out = shapeBars(out, options.table, barBeats, at);
  }
  if (options.slope !== 0) out = contour(out, options.slope ?? 0.03);
  if (options.jitter !== 0) out = micro(out, options.jitter ?? 0.025, options.salt ?? 1);
  if (options.breaths?.length) out = agogic(out, options.breaths, options.pull ?? 0.08);
  if (options.softLeans?.length) out = lean(out, options.softLeans, 0.05);
  if (options.leans?.length) out = lean(out, options.leans, options.lift ?? 0.08);
  return out;
}

/**
 * A stepwise descent, played as one decrescendo.
 *
 * `lean()` takes *pairs*, and a pair is all it can take: its two sets are
 * "louder" and "quieter", so a note that is the resolution of one fall and the
 * leaning note of the next lands in both, and whichever set is tested first
 * wins. Three of the lines in these cues are not a pair — they are a chain. The
 * hymn's A′ walks `A4 - G4 - F#4` across the bar 6/7 line; the title reprise's
 * distant voice walks `C5 - B4 - A4 - G4 - E4` through four of them. Declaring
 * the pairs one at a time left the middle notes arbitrary, and
 * `tools/audio/themes-audit.mjs` — which looks for the *shape* the bible
 * describes rather than for what an arranger remembered to declare — caught one
 * of them coming out backwards.
 *
 * So a chain is written as a chain. The velocities are laid on a straight line
 * falling by `step` per note, centred on the mean of what the phrase already
 * had, so every consecutive pair leans by exactly `step` and **the level the
 * per-bar table gave the phrase is unchanged** — this shapes a descent, it does
 * not turn one down.
 *
 * Runs after `perform()`, deliberately: nothing downstream may invert it.
 */
export function descent(notes: Note[], beats: number[], step = 0.05): Note[] {
  if (beats.length < 2) throw new Error('descent(): a chain needs at least two notes');
  if (!(step > 0)) throw new Error(`descent(): step must be > 0 (got ${step})`);
  const chain: Note[] = [];
  for (const beat of beats) {
    let best: Note | undefined;
    let bestGap = Infinity;
    for (const n of notes) {
      const gap = Math.abs(n[0] - beat);
      if (gap < bestGap && gap < 0.26) {
        best = n;
        bestGap = gap;
      }
    }
    if (!best) throw new Error(`descent(): no note near beat ${beat} — the chain does not exist`);
    chain.push(best);
  }
  const mean = chain.reduce((a, n) => a + (n[3] ?? 0.8), 0) / chain.length;
  const middle = (chain.length - 1) / 2;
  const target = new Map<Note, number>();
  chain.forEach((n, i) => target.set(n, clampVelocity(mean + (middle - i) * step)));
  for (let i = 1; i < chain.length; i++) {
    const above = target.get(chain[i - 1]!)!;
    const below = target.get(chain[i]!)!;
    if (!(above > below)) {
      throw new Error(
        `descent(): the chain at beat ${chain[i]![0]} does not fall (${above} then ${below}) — ` +
          'the velocities clamped into each other, so lower the step or the phrase',
      );
    }
  }
  return notes.map((n) => {
    const v = target.get(n);
    return v === undefined ? n : ([n[0], n[1], n[2], v] as Note);
  });
}

/**
 * Shape an accompaniment by the bar without flattening what is inside it.
 *
 * `shapeBars` (and `perform`'s `table`) *sets* every note in a bar to one
 * velocity, which is right for a melody and wrong for a broken-chord figure
 * that has its own downbeat accent. This multiplies by the bar's level
 * instead, so the arch happens over the bar and the figure keeps its shape.
 */
export function swell(notes: Note[], table: number[], barBeats: number, at = 0): Note[] {
  const mean = table.reduce((a, b) => a + b, 0) / table.length;
  return notes.map((n) => {
    const bar = Math.floor((n[0] - at) / barBeats + 1e-6);
    const level = table[Math.max(0, Math.min(bar, table.length - 1))] ?? mean;
    return [n[0], n[1], n[2], clampVelocity((n[3] ?? 0.8) * (level / mean))] as Note;
  });
}

/**
 * Carve a written rest into an accompaniment.
 *
 * THEMES.md: *"Breaths are written as rests … Do not fill them."* A melody gets
 * its rests for free because they are in the tracker string; an accompaniment
 * built by `chordLine` or `arpLine` will happily play straight through the
 * phrase mark unless somebody takes the notes out. Anything starting inside a
 * window goes; anything sustaining into one is cut short at its edge.
 */
export function clip(notes: Note[], windows: Array<[number, number]>): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    let dur = n[1];
    let drop = false;
    for (const [from, to] of windows) {
      if (n[0] >= from - 1e-6 && n[0] < to - 1e-6) drop = true;
      else if (n[0] < from && n[0] + dur > from) dur = Math.max(0.2, from - n[0]);
    }
    if (!drop) out.push([n[0], dur, n[2], n[3]] as Note);
  }
  return out;
}

/**
 * The hairpin the renderer cannot play.
 *
 * A held string or choir note is dead straight — there is no per-note envelope
 * (THEMES.md §Renderer requests, item 2). The documented workaround is to split
 * it into two tied attacks, the second louder, overlapping by 0.15 beats so the
 * bow change is covered by the first note's release. Strings and choir only:
 * on a piano the restrike is audible and ruins the illusion instead of making
 * it.
 */
export function tiedSwell(notes: Note[], from = 0.55, to = 0.72, overlap = 0.15): Note[] {
  const out: Note[] = [];
  for (const n of notes) {
    const v = n[3] ?? 0.8;
    if (n[1] < 1.2) {
      out.push(n);
      continue;
    }
    const half = n[1] / 2;
    out.push([n[0], half + overlap, n[2], clampVelocity(v * from * 1.35)] as Note);
    out.push([n[0] + half, n[1] - half, n[2], clampVelocity(v * to * 1.35)] as Note);
  }
  return out;
}

/** The notes of a theme that fall inside `[fromBeat, toBeat)`, moved to `at`. */
export function bars(notes: Note[], fromBeat: number, toBeat: number, at: number): Note[] {
  return notes
    .filter((n) => n[0] >= fromBeat - 1e-6 && n[0] < toBeat - 1e-6)
    .map((n) => [n[0] - fromBeat + at, n[1], n[2], n[3]] as Note);
}

/**
 * Clear the piano pedal on the barline.
 *
 * THEMES.md: a pedalled left hand is `gate 0.98` plus reverb held through the
 * bar, "and the left hand cleared on the barline (shorten the last arp note of
 * the bar to 0.4 of its step)". Without this the harmony of bar 2 arrives on
 * top of bar 1 still ringing, which is the difference between a pedalled piano
 * and a smeared one.
 */
export interface LiltOptions {
  /** Downbeat of the first bar the lilt covers. */
  from: number;
  /** Beat it stops on. A mark is written here handing the pulse back. */
  to: number;
  /** Beats in a bar — 3 for the waltz. */
  barBeats: number;
  /** The tempo the bar as a whole keeps, whatever happens inside it. */
  bpm: number;
  /** Fraction beat 1 hurries by, so beat 2 arrives early. 0.09 is a real lilt. */
  lift?: number;
  /** Fraction beat 2 relaxes by, so beat 3 is given its time back. */
  settle?: number;
  /** `[beat, bpm]` — phrase ends that take a breath at that slower pulse. */
  breaths?: Array<[beat: number, bpm: number]>;
  /** Printed in the render report against the block's first mark. */
  label?: string;
}

/**
 * The waltz lilt, as a tempo map.
 *
 * A waltz is not three equal beats. The second beat is *anticipated* — the
 * players lean forward into it — and the third is let go, and the bar still
 * ends when the bar was always going to end. THEMES.md describes exactly this
 * and then says: *"Written as velocity because the renderer has one tempo."*
 * The renderer no longer has one tempo, so it is written as tempo, which is
 * what it always was: the accompaniment bends with the tune instead of the
 * tune drifting away from a grid.
 *
 * Beat 1 runs at `bpm * (1 + lift)` and beat 2 at `bpm * (1 - settle)`; the
 * tempo for the rest of the bar is **derived** so that the bar lasts exactly
 * `barBeats * 60 / bpm` seconds. That is the property that makes this safe to
 * repeat thirty-two times under a loop: every downbeat still lands where the
 * written grid says, so nothing accumulates and the loop body is the length
 * the cue map says it is.
 *
 * `breaths` replaces the tempo of the mark on a given beat — used on the beat
 * a phrase rests, where slowing the pulse widens the silence rather than
 * stretching a note. The block closes with a mark at `to` carrying the
 * downbeat tempo back, so a loop whose start is also a downbeat wraps onto the
 * same pulse it left and does not lurch.
 */
export function waltzLilt(options: LiltOptions): TempoMark[] {
  const { from, to, barBeats, bpm } = options;
  const lift = options.lift ?? 0.09;
  const settle = options.settle ?? 0.07;
  if (barBeats < 3) throw new Error('waltzLilt(): a lilt needs at least three beats in the bar');
  if ((to - from) % barBeats !== 0) {
    throw new Error(`waltzLilt(): ${from}..${to} is not a whole number of ${barBeats}-beat bars`);
  }
  const barSec = (barBeats * 60) / bpm;
  const firstSec = 60 / (bpm * (1 + lift));
  const secondSec = 60 / (bpm * (1 - settle));
  const restSec = barSec - firstSec - secondSec;
  if (restSec <= 0) {
    throw new Error(`waltzLilt(): lift ${lift} and settle ${settle} use up the whole bar`);
  }
  const downbeatBpm = bpm * (1 + lift);
  const restBpm = ((barBeats - 2) * 60) / restSec;

  const breaths = new Map(options.breaths ?? []);
  const marks: TempoMark[] = [];
  const push = (beat: number, fallback: number, label?: string): void => {
    const breath = breaths.get(beat);
    const bpmHere = breath ?? fallback;
    const tag = breath !== undefined ? 'breath' : label;
    marks.push({ beat, bpm: bpmHere, ...(tag === undefined ? {} : { label: tag }) });
  };

  let first = true;
  for (let bar = from; bar < to; bar += barBeats) {
    push(bar, downbeatBpm, first ? (options.label ?? 'lilt') : undefined);
    push(bar + 1, bpm * (1 - settle));
    // One mark covers every remaining beat of the bar: the segment it opens
    // runs to the next downbeat, which for 3/4 is exactly beat three.
    push(bar + 2, restBpm);
    first = false;
  }
  marks.push({ beat: to, bpm: downbeatBpm, label: 'a tempo' });
  return marks;
}

export function clearPedal(notes: Note[], barBeats: number, step: number, at = 0): Note[] {
  return notes.map((n) => {
    const offset = (n[0] - at + step) % barBeats;
    const last = Math.min(offset, barBeats - offset) < 1e-6;
    return last ? ([n[0], step * 0.4, n[2], n[3]] as Note) : n;
  });
}
