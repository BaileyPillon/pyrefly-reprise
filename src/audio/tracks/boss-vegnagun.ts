/**
 * "Iron Verdict" — Vegnagun boss theme.
 *
 * ORIGINAL COMPOSITION. F minor, 168 bpm, industrial machine-rock: a
 * synth-bass 16th ostinato that never stops, metal-hit clangs woven into the
 * groove as tuned percussion, layered kick + kick-808 hits, guitar-dist
 * chugs, a pwm-lead "alarm" siren, and a giant drawbar organ drone standing
 * in for the machine's own pipe organ. Every 4-bar phrase in the groove
 * sections, bar 3 shortens to 7/8 (3.5 beats) and bar 4 stretches to 4.5, so
 * the loop lurches like something enormous missing a step; `timeSig` stays
 * [4,4] and every phrase still totals 16 beats, so loop points land on
 * multiples of 4.
 *
 * Form (168 bpm, 4/4, 288 beats = 102.9 s):
 *   intro    beats   0- 16   organ swells in, bass pulse -> ostinato, teaser clangs
 *   A        beats  16- 80   full groove + lurch, alarm siren enters          <- loop start
 *   B        beats  80-112   regular bars, guitar chugs harder, snare rolls into A2
 *   A2       beats 112-176   groove + lurch returns, alarm doubles an octave up
 *   break    beats 176-208   system overload: drums & bass cut, organ + metal + rising siren
 *   assault  beats 208-272   full lurch groove at fortissimo, siren in unison octaves
 *   turn     beats 272-288   snare roll over a dominant chord, back into the loop
 * Loop 16 -> 288.
 */

import {
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  scaleVelocity,
  type Note,
  type Track,
} from '../score.ts';

const BPM = 168;
const LURCH = [4, 4, 3.5, 4.5];

const INTRO = 0;
const A = 16;
const B = 80;
const A2 = 112;
const BREAK = 176;
const ASSAULT = 208;
const TURN = 272;
const LENGTH = 288;

interface Bar {
  start: number;
  dur: number;
  chord: string;
}

function regularBars(start: number, chords: string[]): Bar[] {
  return chords.map((chord, i) => ({ start: start + i * 4, dur: 4, chord }));
}

function lurchPhrase(start: number, chords: string[]): Bar[] {
  const bars: Bar[] = [];
  let t = start;
  for (let i = 0; i < 4; i++) {
    bars.push({ start: t, dur: LURCH[i]!, chord: chords[i]! });
    t += LURCH[i]!;
  }
  return bars;
}

function lurchSection(start: number, phrases: string[][]): Bar[] {
  const bars: Bar[] = [];
  let t = start;
  for (const chords of phrases) {
    bars.push(...lurchPhrase(t, chords));
    t += 16;
  }
  return bars;
}

const rootOf = (chord: string, octave: number): number => chordRoots([chord], octave)[0]!;

const INTRO_CHORDS = ['Fm', 'Fm', 'Fm', 'Fm'];
const A_PHRASES = [['Fm', 'Fm', 'Db', 'Cm'], ['Fm', 'Fm', 'Db', 'Cm'], ['Fm', 'Ab', 'Db', 'Cm'], ['Fm', 'Ab', 'Db', 'Cm']];
const B_CHORDS = ['Bbm', 'Ab', 'Db', 'Cm', 'Bbm', 'Ab', 'Eb', 'Cm'];
const A2_PHRASES = [['Fm', 'Fm', 'Db', 'Cm'], ['Fm', 'Fm', 'Db', 'Cm'], ['Fm', 'Ab', 'Eb', 'Cm'], ['Fm', 'Ab', 'Eb', 'Cm']];
const BREAK_CHORDS = ['Fm', 'Fm', 'Fm', 'Fm', 'Fm', 'Fm', 'Db', 'Cm'];
const ASSAULT_PHRASES = [['Fm', 'Fm', 'Db', 'Cm'], ['Fm', 'Ab', 'Bbm', 'Cm'], ['Fm', 'Fm', 'Db', 'Cm'], ['Fm', 'Ab', 'Db', 'Cm']];
const TURN_CHORDS = ['Cm', 'Cm', 'C', 'C7'];

const introBars = regularBars(INTRO, INTRO_CHORDS);
const aBars = lurchSection(A, A_PHRASES);
const bBars = regularBars(B, B_CHORDS);
const a2Bars = lurchSection(A2, A2_PHRASES);
const breakBars = regularBars(BREAK, BREAK_CHORDS);
const assaultBars = lurchSection(ASSAULT, ASSAULT_PHRASES);
const turnBars = regularBars(TURN, TURN_CHORDS);

/** Truncate a step-pattern to fit a short bar, or wrap back to its own start to fill a long one. */
function patternFor(base: string, steps: number): string {
  if (steps <= base.length) return base.slice(0, steps);
  return base + base.slice(0, steps - base.length);
}

// ---- synth-bass: the ostinato that never stops -----------------------------

const BASS_CELL = [0, 0, 12, 0, 0, 7, 12, 0, 0, 0, 12, 7, 0, 0, 12, 7];

function bassOstinato(bars: Bar[], velScale = 1): Note[] {
  const notes: Note[] = [];
  for (const bar of bars) {
    const root = rootOf(bar.chord, 1);
    const steps = Math.round(bar.dur / 0.25);
    for (let s = 0; s < steps; s++) {
      const idx = s % BASS_CELL.length;
      const vel = (idx % 4 === 0 ? 0.92 : 0.66) * velScale;
      notes.push([bar.start + s * 0.25, 0.2, root + BASS_CELL[idx]!, Math.min(1, vel)]);
    }
  }
  return notes;
}

function bassPulse(bars: Bar[]): Note[] {
  const notes: Note[] = [];
  for (const bar of bars) {
    const root = rootOf(bar.chord, 1);
    for (let b = 0; b < Math.round(bar.dur); b++) notes.push([bar.start + b, 0.6, root, 0.55]);
  }
  return notes;
}

// ---- kick, kick-808, hat, snare-909 ----------------------------------------

const KICK16 = 'X...X..x..X.x...';
const HAT16 = 'x.x.x.x.X.x.x.x.';

function snareRoll(start: number, dur: number): Note[] {
  const step = 0.25;
  const steps = Math.max(1, Math.round(dur / step));
  const notes: Note[] = [];
  for (let s = 0; s < steps; s++) {
    const t = steps > 1 ? s / (steps - 1) : 1;
    notes.push([start + s * step, step * 0.9, 'D2', 0.32 + t * 0.63]);
  }
  return notes;
}

// `noKick`/`noSnare` drop those drums entirely — used for B's hushed opening bars.
interface GrooveOptions {
  roll?: boolean;
  kickVel?: number;
  hatVel?: number;
  snareVel?: number;
  noKick?: boolean;
  noSnare?: boolean;
}

function groovePercussion(bars: Bar[], opts: GrooveOptions = {}): { kick: Note[]; hat: Note[]; snare: Note[] } {
  const kick: Note[] = [];
  const hat: Note[] = [];
  const snare: Note[] = [];
  const last = bars.length - 1;
  bars.forEach((bar, i) => {
    const steps = Math.round(bar.dur / 0.25);
    if (!opts.noKick) kick.push(...drumLine(patternFor(KICK16, steps), { start: bar.start, pitch: 'C2', velocity: opts.kickVel ?? 0.9 }));
    hat.push(...drumLine(patternFor(HAT16, steps), { start: bar.start, pitch: 'F#3', velocity: opts.hatVel ?? 0.42 }));
    if (opts.noSnare) return;
    if (opts.roll && i === last) {
      snare.push(...snareRoll(bar.start, bar.dur));
    } else {
      const sv = opts.snareVel ?? 0.75;
      for (const off of [1, 3]) if (off < bar.dur) snare.push([bar.start + off, 0.22, 'D2', sv]);
      if (bar.dur > 4) snare.push([bar.start + 4.1, 0.2, 'D2', sv * 0.7]);
    }
  });
  return { kick, hat, snare };
}

function kick808PerBar(bars: Bar[], dur: number, vel: number): Note[] {
  return bars.map((bar): Note => [bar.start, dur, 'F1', vel]);
}

// ---- metal-hit: pitched clangs as part of the groove -----------------------

function metalHits(bars: Bar[], vel = 0.75): Note[] {
  const notes: Note[] = [];
  for (const bar of bars) {
    const root = rootOf(bar.chord, 3);
    for (const off of [0.5, 2.5]) if (off < bar.dur) notes.push([bar.start + off, 0.3, root, vel]);
    if (bar.dur > 4) notes.push([bar.start + 4.0, 0.3, root, vel * 0.85]);
  }
  return notes;
}

function breakdownMetal(bars: Bar[]): Note[] {
  const notes: Note[] = [];
  const half = Math.ceil(bars.length / 2);
  bars.forEach((bar, i) => {
    const root = rootOf(bar.chord, 3);
    if (i < half) {
      // System overload, phase 1: distant, sparse clangs — every other bar only.
      if (i % 2 === 1) {
        const t = i / Math.max(1, half - 1);
        notes.push([bar.start, 0.5, root, 0.28 + t * 0.14]);
      }
      return;
    }
    const t = (i - half) / Math.max(1, bars.length - half - 1);
    const vel = Math.min(1, 0.5 + t * 0.5);
    notes.push([bar.start, 0.6, root, vel]);
    notes.push([bar.start + 2, 0.4, root + 7, vel * 0.8]);
  });
  return notes;
}

// ---- guitar-dist: palm-muted gallop, downbeats ring open -------------------

const GUITAR16 = 'X.xxx.xxx.xxx.xx';

// `side` makes the double-track real: R lags ~4.6ms, sits quieter, drops every
// other ghost chug for air, and rings the 5th under the downbeat where L is single-note.
function guitarChug(bars: Bar[], vel = 0.75, side: 'L' | 'R' = 'L'): Note[] {
  const notes: Note[] = [];
  const delay = side === 'R' ? 0.012 : 0;
  const trim = side === 'R' ? 0.93 : 1;
  let ghost = 0;
  for (const bar of bars) {
    const root = rootOf(bar.chord, 2);
    const steps = Math.round(bar.dur / 0.25);
    const pattern = patternFor(GUITAR16, steps);
    for (let s = 0; s < steps; s++) {
      const ch = pattern[s];
      if (ch === '.') continue;
      const open = s === 0;
      if (!open) {
        ghost++;
        if (side === 'R' && ghost % 2 === 0) continue;
      }
      const v = Math.min(1, (open ? vel * 1.15 : vel * (ch === 'X' ? 1 : 0.82)) * trim);
      const t = bar.start + s * 0.25 + delay;
      notes.push([t, open ? 0.5 : 0.2, root, v]);
      if (open && side === 'R') notes.push([t, 0.5, root + 7, Math.min(1, v * 0.85)]);
    }
  }
  return notes;
}

// ---- pwm-lead: the alarm siren ---------------------------------------------

/** Relative to the bar's root; a leaping two-beat siren blip, dominant 7th flavoured. */
const ALARM_CELL: Note[] = [
  [0, 0.5, 7, 0.9],
  [0.5, 0.5, 10, 0.85],
  [1, 0.25, 12, 0.95],
  [1.25, 0.25, 10, 0.8],
  [1.5, 0.5, 7, 0.85],
];

function alarmMotif(bars: Bar[], octaveShift = 0, velScale = 1): Note[] {
  const starts = bars.map((b) => b.start);
  const roots = bars.map((b) => rootOf(b.chord, 3) + octaveShift);
  return scaleVelocity(motif(ALARM_CELL, starts, roots), velScale);
}

function risingAlarm(bars: Bar[]): Note[] {
  return bars.map((bar, i): Note => {
    const root = rootOf(bar.chord, 4) + 12 * Math.floor(i / 4) + 2 * Math.floor(i / 2);
    return [bar.start, bar.dur * 0.85, root, Math.min(1, 0.25 + i * 0.1)];
  });
}

// ---- organ: the machine's own pipe organ -----------------------------------

function organBed(bars: Bar[], velocity: number, octave: number, center: number): Note[] {
  const notes: Note[] = [];
  for (const bar of bars) {
    for (const m of chordMidis(bar.chord, { octave, center })) notes.push([bar.start, Math.max(0.1, bar.dur - 0.08), m, velocity]);
  }
  return notes;
}

/** The breakdown's organ: a hollow root+fifth pedal for the first half, full chords building into the second. */
function organBreak(bars: Bar[]): Note[] {
  const notes: Note[] = [];
  const half = Math.ceil(bars.length / 2);
  bars.forEach((bar, i) => {
    const dur = Math.max(0.1, bar.dur - 0.08);
    if (i < half) {
      const root = rootOf(bar.chord, 2);
      notes.push([bar.start, dur, root, 0.4]);
      notes.push([bar.start, dur, root + 7, 0.34]);
      return;
    }
    const t = (i - half) / Math.max(1, bars.length - half - 1);
    const vel = 0.5 + t * 0.22;
    for (const m of chordMidis(bar.chord, { octave: 2, center: 48 })) notes.push([bar.start, dur, m, vel]);
  });
  return notes;
}

// ---- assembly ---------------------------------------------------------------

// B splits: first 4 bars hush to bass+metal+hats only, back 4 bring the rest in with the roll.
const bBarsQuiet = bBars.slice(0, 4);
const bBarsBack = bBars.slice(4);

const bassSections: [Bar[], number][] = [[aBars, 1], [bBars, 1.05], [a2Bars, 1.1], [assaultBars, 1.22], [turnBars, 1.15]];
const bassNotes = concatNotes(
  bassPulse(introBars.slice(0, 2)),
  bassOstinato(introBars.slice(2), 0.78),
  ...bassSections.map(([bars, vel]) => bassOstinato(bars, vel)),
);

const introDrums = { kick: [[8, 0.5, 'C2', 0.5], [12, 0.5, 'C2', 0.6], [14, 0.3, 'C2', 0.7]] as Note[] };
const aG = groovePercussion(aBars, { roll: true, kickVel: 0.9, snareVel: 0.76 });
const bQuietG = groovePercussion(bBarsQuiet, { noKick: true, noSnare: true, hatVel: 0.28 });
const bBackG = groovePercussion(bBarsBack, { roll: true, kickVel: 0.92, hatVel: 0.48, snareVel: 0.8 });
const a2G = groovePercussion(a2Bars, { roll: true, kickVel: 0.94, hatVel: 0.5, snareVel: 0.84 });
const assaultG = groovePercussion(assaultBars, { roll: true, kickVel: 1, hatVel: 0.55, snareVel: 0.92 });
const turnG = groovePercussion(turnBars, { roll: true, kickVel: 0.95, hatVel: 0.5, snareVel: 0.86 });

const kickNotes = concatNotes(introDrums.kick, aG.kick, bBackG.kick, a2G.kick, assaultG.kick, turnG.kick);
const hatNotes = concatNotes(aG.hat, bQuietG.hat, bBackG.hat, a2G.hat, assaultG.hat, turnG.hat);
const snareNotes = concatNotes(
  aG.snare,
  bBackG.snare,
  a2G.snare,
  snareRoll(breakBars[breakBars.length - 1]!.start, breakBars[breakBars.length - 1]!.dur),
  assaultG.snare,
  turnG.snare,
);

const kick808Notes = concatNotes(
  kick808PerBar(aBars, 1.2, 0.85),
  kick808PerBar(bBarsBack, 1.2, 0.88),
  kick808PerBar(a2Bars, 1.3, 0.9),
  kick808PerBar(assaultBars, 1.6, 1),
  kick808PerBar(turnBars, 0.9, 0.92),
);

const metalNotes = concatNotes(
  [[12, 0.4, rootOf('Fm', 3), 0.5], [14, 0.4, rootOf('Fm', 3) + 7, 0.6]] as Note[],
  metalHits(aBars, 0.72),
  metalHits(bBars, 0.78),
  metalHits(a2Bars, 0.82),
  breakdownMetal(breakBars),
  metalHits(assaultBars, 0.95),
  metalHits(turnBars, 0.85),
);

const guitarSections: [Bar[], number][] = [[aBars, 0.7], [bBarsBack, 0.8], [a2Bars, 0.85], [assaultBars, 1]];
const guitarL = concatNotes(...guitarSections.map(([bars, vel]) => guitarChug(bars, vel, 'L')));
const guitarR = concatNotes(...guitarSections.map(([bars, vel]) => guitarChug(bars, vel, 'R')));

const alarmNotes = concatNotes(
  alarmMotif(aBars, 0, 0.85),
  alarmMotif(a2Bars, 12, 0.95),
  risingAlarm(breakBars),
  concatNotes(alarmMotif(assaultBars, 0, 1), alarmMotif(assaultBars, 12, 0.9)),
  alarmMotif(turnBars, 0, 0.88),
);

const organNotes = concatNotes(
  organBed(introBars, 0.4, 2, 55),
  organBed(aBars, 0.5, 3, 64),
  organBed(bBarsBack, 0.55, 3, 64),
  organBed(a2Bars, 0.58, 3, 64),
  organBreak(breakBars),
  organBed(assaultBars, 0.73, 3, 66),
  organBed(turnBars, 0.6, 2, 50),
);

const crashHits: Note[] = [[A, 1.5, 'C5', 0.6], [B, 1.5, 'C5', 0.58], [A2, 1.5, 'C5', 0.64], [BREAK, 1.5, 'C5', 0.5], [ASSAULT, 1.5, 'C5', 0.8]];

export const vegnagunTrack: Track = {
  name: 'boss-vegnagun',
  bpm: BPM,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 3.5,
  fx: {
    reverb: { room: 0.5, damp: 0.42, width: 0.9, preDelay: 0.012 },
    delay: { timeBeats: 0.375, feedback: 0.24, damp: 3000 },
  },
  channels: [
    { name: 'synth-bass ostinato', instrument: 'synth-bass', volume: 0.95, pan: 0, notes: bassNotes, fx: { reverb: 0.05 } },
    { name: 'kick', instrument: 'kick', volume: 0.95, pan: 0, notes: kickNotes },
    { name: 'kick-808', instrument: 'kick-808', volume: 0.85, pan: 0, notes: kick808Notes },
    { name: 'hat', instrument: 'hat', volume: 0.4, pan: 0.22, notes: hatNotes },
    { name: 'snare-909', instrument: 'snare-909', volume: 0.8, pan: -0.05, notes: snareNotes, fx: { reverb: 0.14 } },
    { name: 'crash', instrument: 'crash', volume: 0.42, pan: 0.1, notes: crashHits, fx: { reverb: 0.28 } },
    { name: 'metal-hit', instrument: 'metal-hit', volume: 0.7, pan: -0.15, notes: metalNotes, fx: { reverb: 0.18, delay: 0.1 } },
    { name: 'guitar L', instrument: 'guitar-dist', volume: 0.55, pan: -0.35, notes: guitarL, fx: { reverb: 0.1 } },
    { name: 'guitar R', instrument: 'guitar-dist', volume: 0.52, pan: 0.35, notes: guitarR, fx: { reverb: 0.11 } },
    { name: 'alarm siren', instrument: 'pwm-lead', volume: 0.62, pan: 0.08, notes: alarmNotes, fx: { reverb: 0.22, delay: 0.16 } },
    { name: 'organ', instrument: 'organ', volume: 0.8, pan: 0, notes: organNotes, fx: { reverb: 0.3 } },
  ],
};

export default vegnagunTrack;
