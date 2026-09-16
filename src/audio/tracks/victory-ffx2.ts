/**
 * "Sphere Shine" — FFX-2 victory fanfare + results-screen groove.
 *
 * ORIGINAL COMPOSITION. Eb major, 128 bpm, pop-electronic — sassy and bright,
 * a world away from `victory-ffx`'s orchestral brass. A one-shot synth-brass
 * fanfare states the score's SPHERE_HOOK cell (supersaw lead doubled an
 * octave down by brass-stab) and lands on a big chord hit with clap + crash;
 * the fanfare's rhythm is the hook's own syncopated leap-to-the-5th shape —
 * never the famous repeated-note triplet pickup into a held note. The results
 * loop then runs a synth-bass pump, kick-808/clap/hat groove, off-beat epiano
 * stabs, a 16th-note arp-pluck, and a pwm-lead/flute topline that keeps
 * riffing on the hook against a moving chord bed.
 *
 * Form (4/4):
 *   bar   1     fanfare  beats  0- 4   supersaw + brass-stab state SPHERE_HOOK on Eb
 *   bar   2     fanfare  beats  4- 8   the hook answered a 4th up, on Ab
 *   bar   3     fanfare  beats  8-12   big Eb chord hit — clap + crash + arp-pluck sparkle
 *   bars  4-11  groove A beats 12- 44  bass pump + kit lock in, pwm-lead teases the hook   <- loop start
 *   bars 12-19  groove B beats 44- 76  reharm (iii7, ii), flute answers, arp-pluck fills in
 *   bars 20-27  groove C beats 76-108  fullest: pwm-lead+flute double, glow pad returns
 * The loop runs 12 -> 108; the last bar sits on Bb(sus4), pulling straight back
 * into groove A's Eb at the top.
 */

import {
  arpLine,
  barStarts,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  parseChord,
  type Note,
  type Track,
} from '../score.ts';
import { cell, SPHERE_HOOK } from './motifs.ts';

const BAR = 4;
const FANFARE_BARS = 3;
const LOOP_START = FANFARE_BARS * BAR; // 12
const LOOP_BARS = 24;
const LENGTH = LOOP_START + LOOP_BARS * BAR; // 108

const P1 = ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Cm7', 'Ab', 'Bb'];
const P2 = ['Eb', 'Gm7', 'Ab', 'Bb', 'Cm', 'Fm', 'Ab', 'Bb'];
const P3 = ['Eb', 'Cm', 'Fm', 'Bb', 'Eb', 'Cm7', 'Ab', 'Bbsus4'];
const LOOP_CHORDS = [...P1, ...P2, ...P3];

const PHASE_B = LOOP_START + 8 * BAR; // 44
const PHASE_C = LOOP_START + 16 * BAR; // 76

/** Syncopated pump: root, root, octave pickup, fifth, root, root, octave pickup, fifth-held. */
const BASS_MOTIF: Note[] = [
  [0, 0.5, 0, 0.95],
  [0.5, 0.25, 0, 0.7],
  [0.75, 0.25, 12, 0.82],
  [1, 0.5, 7, 0.88],
  [1.5, 0.5, 0, 0.75],
  [2, 0.5, 0, 0.95],
  [2.5, 0.25, 0, 0.7],
  [2.75, 0.25, 12, 0.82],
  [3, 1, 7, 0.85],
];

/** A short "breathe" answer for the hook's off bars: a fifth, then the octave, then space. */
const BREATH: Note[] = [
  [0, 1.5, 7, 0.5],
  [1.5, 0.75, 12, 0.42],
];

/** SPHERE_HOOK recast for a minor root: the 3rd and 6th flatten (offset 4->3, 9->8) so the
 * hook's own "3rd" never fights the chord's minor 3rd a semitone away. */
const SPHERE_HOOK_MINOR: Note[] = SPHERE_HOOK.map((n) => {
  const pitch = n[2] === 4 ? 3 : n[2] === 9 ? 8 : n[2];
  return [n[0], n[1], pitch, n[3]] as Note;
});

function isMinorChord(symbol: string): boolean {
  return parseChord(symbol).intervals[1] === 3;
}

const KICK_P1 = 'X...x..xX...x...';
const KICK_P2 = 'X...x.xxX...x.x.';
const KICK_P3 = 'X..xx..xX..xx.x.';
const CLAP_PATTERN = '....X.......X...';
const HATS_P1 = 'x.x.x.x.';
const HATS_P2 = 'x.xxx.xx';
const HATS_P3 = 'x.XxxxXx';

function fanfareLead(): Note[] {
  return concatNotes(cell(SPHERE_HOOK, 0, 'Eb5', 0.95), cell(SPHERE_HOOK, 4, 'Ab5', 0.98));
}

function fanfareStab(): Note[] {
  return concatNotes(cell(SPHERE_HOOK, 0, 'Eb4', 0.85), cell(SPHERE_HOOK, 4, 'Ab4', 0.88));
}

/** Chord stabs under the melody, one per hook onset, on both bars 1-2 — the fanfare needs
 * its own harmonic punch, not just the single-line hook, to outweigh the results loop. */
function fanfareChordStabs(octave: number, center: number, velocity: number): Note[] {
  const hits: Note[] = [];
  const targets: [number, string][] = [
    [0, 'Eb'],
    [4, 'Ab'],
  ];
  for (const [beat, tonic] of targets) {
    for (const n of SPHERE_HOOK) {
      for (const midi of chordMidis(tonic, { octave, center })) {
        hits.push([beat + n[0], Math.min(n[1], 0.32), midi, velocity]);
      }
    }
  }
  return hits;
}

function fanfareHit(): Note[] {
  const notes: Note[] = [];
  for (const midi of chordMidis('Eb9', { octave: 4, center: 75 })) notes.push([8, 3.8, midi, 1]);
  // A high shimmer double an octave up widens the chord without relying on more raw velocity.
  for (const midi of chordMidis('Eb9', { octave: 5, center: 87 })) notes.push([8, 3.6, midi, 0.85]);
  return notes;
}

function fanfareStabHit(): Note[] {
  const notes: Note[] = [];
  for (const midi of chordMidis('Eb', { octave: 3, center: 63 })) notes.push([8, 0.4, midi, 1]);
  return notes;
}

/** A one-shot sub layer under the bar-3 hit so it lands as the loudest moment in the file. */
function fanfareHitBass(): Note[] {
  return [[8, 3.6, 'Eb1', 0.95]] as Note[];
}

function fanfareSparkle(): Note[] {
  return arpLine(['Eb'], {
    start: 8,
    barBeats: 4,
    pattern: [6, 4, 2, 0, 2, 4, 6, 8],
    step: 0.5,
    dur: 0.42,
    octave: 4,
    center: 84,
    velocity: 0.5,
  });
}

function fanfareKick(): Note[] {
  // Runs the four-on-the-floor through all three fanfare bars — including bar 3 — so the
  // chord hit is carried by the same continuous pulse a groove bar has, not a single stab.
  return concatNotes(
    drumLine('X...X...X...X...', { start: 0, step: 0.5, pitch: 'C1', velocity: 0.95, times: 3 }),
    [[8, 0.6, 'C1', 1]] as Note[],
  );
}

function fanfareClap(): Note[] {
  return concatNotes(
    drumLine('.x.x', { start: 0, step: 1, pitch: 'C4', velocity: 0.82, times: 3 }),
    [[8, 0.32, 'C4', 0.95]] as Note[],
  );
}

function fanfareHats(): Note[] {
  // Bar 3 needs the same rhythmic density a groove bar has, or its one big chord
  // reads as a quieter average even with the highest instantaneous peak.
  return drumLine('X.x.X.x.X.x.X.x.', { start: 8, step: 0.25, pitch: 'F#3', velocity: 0.78, accentVelocity: 0.9 });
}

function loopBass(): Note[] {
  return motif(BASS_MOTIF, barStarts(LOOP_START, LOOP_BARS, BAR), chordRoots(LOOP_CHORDS, 1));
}

function loopKick(): Note[] {
  return concatNotes(
    drumLine(KICK_P1, { start: LOOP_START, step: 0.25, pitch: 'C1', velocity: 0.9, times: 8 }),
    drumLine(KICK_P2, { start: PHASE_B, step: 0.25, pitch: 'C1', velocity: 0.78, times: 8 }),
    drumLine(KICK_P3, { start: PHASE_C, step: 0.25, pitch: 'C1', velocity: 1, times: 8 }),
  );
}

function loopClap(): Note[] {
  return drumLine(CLAP_PATTERN, { start: LOOP_START, step: 0.25, pitch: 'C4', velocity: 0.85, times: LOOP_BARS });
}

function loopHats(): Note[] {
  return concatNotes(
    drumLine(HATS_P1, { start: LOOP_START, step: 0.5, pitch: 'F#3', velocity: 0.34, times: 8 }),
    drumLine(HATS_P2, { start: PHASE_B, step: 0.5, pitch: 'F#3', velocity: 0.26, times: 8 }),
    drumLine(HATS_P3, { start: PHASE_C, step: 0.5, pitch: 'F#3', velocity: 0.62, times: 8 }),
  );
}

function loopCrash(): Note[] {
  return [
    [PHASE_B, 1.2, 'C5', 0.3],
    [PHASE_C, 1.2, 'C5', 0.68],
  ];
}

/** Escalates phase by phase so the bed itself carries C's extra weight, not just the topline. */
function loopEpiano(): Note[] {
  const doubled = (chords: string[]) => chords.flatMap((c) => [c, c]);
  const opts = (start: number, velocity: number) => ({
    start,
    barBeats: 2,
    dur: 1.7,
    octave: 4,
    center: 72,
    velocity,
    roll: 0.02,
  });
  return concatNotes(
    chordLine(doubled(P1), opts(LOOP_START, 0.48)),
    chordLine(doubled(P2), opts(PHASE_B, 0.42)),
    chordLine(doubled(P3), opts(PHASE_C, 0.85)),
  );
}

function loopArp(): Note[] {
  const opts = (start: number, velocity: number, accent: number) => ({
    start,
    barBeats: BAR,
    pattern: [0, 2, 1, 2, 3, 2, 1, 2],
    step: 0.25,
    dur: 0.2,
    octave: 5,
    center: 79,
    velocity,
    accent,
  });
  return concatNotes(
    arpLine(P1, opts(LOOP_START, 0.36, 1.1)),
    arpLine(P2, opts(PHASE_B, 0.3, 1.1)),
    arpLine(P3, opts(PHASE_C, 0.68, 1.05)),
  );
}

/**
 * Riffs on SPHERE_HOOK against each phase's bar roots; the off-bars just breathe.
 * A hook bar sitting on a minor chord gets SPHERE_HOOK_MINOR instead, so the hook's
 * own 3rd/6th always agree with the chord under it.
 */
function toplineHook(chords: string[], phaseStart: number, octave: number, velocity: number): Note[] {
  const roots = chordRoots(chords, octave);
  const bars = barStarts(phaseStart, 8, BAR);
  const notes: Note[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i % 2 === 0) {
      const pattern = isMinorChord(chords[i]!) ? SPHERE_HOOK_MINOR : SPHERE_HOOK;
      notes.push(...motif(pattern, [bars[i]!], [roots[i]!]));
    } else {
      notes.push(...motif(BREATH, [bars[i]!], [roots[i]!]));
    }
  }
  return notes.map((n) => [n[0], n[1], n[2], velocity] as Note);
}

function pwmLeadLine(): Note[] {
  // Phase C carries the loop's peak — but the extra weight comes from the sustained bed
  // (epiano/arp/glow pad) so this transient topline doesn't get chewed up by the limiter.
  return concatNotes(toplineHook(P1, LOOP_START, 5, 0.58), toplineHook(P3, PHASE_C, 5, 0.8));
}

function fluteLine(): Note[] {
  // Eased back so phase B no longer outweighs phase C's fuller, more sustained stack.
  return toplineHook(P2, PHASE_B, 4, 0.1);
}

function fluteEcho(): Note[] {
  // A doubling in the third phase, an octave above the pwm-lead, thickening the climax.
  return toplineHook(P3, PHASE_C, 6, 0.48);
}

function glowPad(): Note[] {
  return chordLine(P3, { start: PHASE_C, octave: 4, center: 72, velocity: 0.85, dur: 3.9, roll: 0.02 });
}

export const victoryFfx2Track: Track = {
  name: 'victory-ffx2',
  bpm: 128,
  timeSig: [4, 4],
  loop: { start: LOOP_START, end: LENGTH },
  length: LENGTH,
  tailSec: 3,
  fx: {
    reverb: { room: 0.35, damp: 0.42, width: 0.85, preDelay: 0.01 },
    delay: { timeBeats: 0.375, feedback: 0.22, damp: 3200 },
  },
  channels: [
    { name: 'fanfare hook', instrument: 'supersaw', volume: 0.85, pan: -0.05, notes: fanfareLead(), fx: { reverb: 0.2 } },
    { name: 'fanfare stab', instrument: 'brass-stab', volume: 0.75, pan: 0.1, notes: fanfareStab(), fx: { reverb: 0.15 } },
    {
      name: 'fanfare chord stabs (saw)',
      instrument: 'supersaw',
      volume: 0.6,
      pan: 0.15,
      notes: fanfareChordStabs(4, 72, 0.75),
      fx: { reverb: 0.2 },
    },
    {
      name: 'fanfare chord stabs (brass)',
      instrument: 'brass-stab',
      volume: 0.65,
      pan: -0.2,
      notes: fanfareChordStabs(3, 63, 0.8),
      fx: { reverb: 0.15 },
    },
    { name: 'fanfare hit pad', instrument: 'supersaw', volume: 0.85, pan: -0.05, notes: fanfareHit(), fx: { reverb: 0.25 } },
    { name: 'fanfare hit stab', instrument: 'brass-stab', volume: 0.8, pan: 0.1, notes: fanfareStabHit(), fx: { reverb: 0.15 } },
    { name: 'fanfare hit bass', instrument: 'synth-bass', volume: 0.9, pan: 0, notes: fanfareHitBass() },
    { name: 'fanfare sparkle', instrument: 'arp-pluck', volume: 0.45, pan: 0.25, notes: fanfareSparkle(), fx: { reverb: 0.25, delay: 0.2 } },
    { name: 'fanfare hats', instrument: 'hat', volume: 0.45, pan: 0.2, notes: fanfareHats() },
    { name: 'fanfare kick', instrument: 'kick-808', volume: 1, pan: 0, notes: fanfareKick() },
    { name: 'fanfare clap', instrument: 'clap', volume: 0.9, pan: 0, notes: fanfareClap(), fx: { reverb: 0.1 } },
    { name: 'fanfare crash', instrument: 'crash', volume: 0.6, pan: 0.1, notes: [[8, 1.5, 'C5', 0.85]] as Note[], fx: { reverb: 0.3 } },
    { name: 'bass', instrument: 'synth-bass', volume: 0.9, pan: 0, notes: loopBass() },
    { name: 'kick', instrument: 'kick-808', volume: 0.92, pan: 0, notes: loopKick() },
    { name: 'clap', instrument: 'clap', volume: 0.75, pan: 0, notes: loopClap(), fx: { reverb: 0.08 } },
    { name: 'hats', instrument: 'hat', volume: 0.42, pan: 0.2, notes: loopHats() },
    { name: 'crash', instrument: 'crash', volume: 0.4, pan: 0.1, notes: loopCrash(), fx: { reverb: 0.28 } },
    { name: 'epiano', instrument: 'epiano', volume: 0.62, pan: -0.15, notes: loopEpiano(), fx: { reverb: 0.15, delay: 0.1 } },
    { name: 'arp-pluck', instrument: 'arp-pluck', volume: 0.5, pan: 0.3, notes: loopArp(), fx: { reverb: 0.2, delay: 0.22 } },
    { name: 'pwm topline', instrument: 'pwm-lead', volume: 0.55, pan: -0.1, notes: pwmLeadLine(), fx: { reverb: 0.25, delay: 0.18 } },
    { name: 'flute topline', instrument: 'flute', volume: 0.5, pan: 0.15, notes: fluteLine(), fx: { reverb: 0.3 } },
    { name: 'flute echo', instrument: 'flute', volume: 0.3, pan: 0.35, notes: fluteEcho(), fx: { reverb: 0.35, delay: 0.25 } },
    { name: 'glow pad', instrument: 'supersaw', volume: 0.32, pan: 0, notes: glowPad(), fx: { reverb: 0.3 } },
  ],
};

export default victoryFfx2Track;
