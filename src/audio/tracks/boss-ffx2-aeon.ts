/**
 * "Static Coronation" — the corrupted dragon-king aeon battle.
 *
 * ORIGINAL COMPOSITION. Pop-rock-electronic, brighter production than an FFX
 * boss but with real menace: Bb minor, 160 bpm. Supersaw stabs carry a riff
 * recast from FFX-2's bright hook (its 3rd and 6th lowered into minor), a
 * synth-bass pumps octaves under it, drums alternate four-on-the-floor with a
 * breakbeat, guitar-dist chugs, and a lifted chorus turns the same hook
 * hopeful in the relative major. The riff is chord-aware — over the V (F) it
 * outlines F-A-C instead of the tonic hook, so nothing sits a minor 2nd above
 * the chord underneath.
 *
 * Form (4/4, 68 bars, 102 s):
 *   bars  1- 4  intro    beats   0- 16   count-in kick + bass groove alone
 *   bars  5-16  A        beats  16- 64   riff, four-on-the-floor           <- loop start
 *   bars 17-28  B        beats  64-112   breakbeat, riff call/response
 *   bars 29-40  chorus   beats 112-160   relative major (Db), hook turns hopeful
 *   bars 41-52  bridge   beats 160-208   breakbeat, riff sequences up and builds
 *   bars 53-64  A2       beats 208-256   riff reprise, octave-doubled, hardest hit
 *   bars 65-68  turn     beats 256-272   turnaround into the loop
 * The loop runs 16 -> 272. Dynamic peaks: A2 and the chorus.
 */

import {
  arpLine,
  barStarts,
  chordLine,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  transposeNotes,
  type Note,
  type Pitch,
  type Track,
} from '../score.ts';
import { SPHERE_HOOK, withVelocity } from './motifs.ts';

const BAR = 4;

/** Linear ramp across `steps` values from `from` to `to` (inclusive) — the bridge's smooth build. */
function ramp(steps: number, from: number, to: number): number[] {
  if (steps <= 1) return [to];
  return Array.from({ length: steps }, (_, i) => from + (to - from) * (i / (steps - 1)));
}

const INTRO_CHORDS = ['Bbm', 'Bbm', 'Gb', 'F'];
const A_CHORDS = ['Bbm', 'Gb', 'F', 'Ebm', 'Bbm', 'Gb', 'Db', 'F', 'Bbm', 'Gb', 'F', 'F'];
const B_CHORDS = ['Bbm', 'Ab', 'Gb', 'F', 'Ebm', 'Db', 'Gb', 'F', 'Bbm', 'Ab', 'Gb', 'F'];
const CHORUS_CHORDS = ['Db', 'Ab', 'Bbm', 'Gb', 'Db', 'Ab', 'Ebm', 'Ab', 'Db', 'Gb', 'Ab', 'Db'];
const BRIDGE_CHORDS = ['Ebm', 'Db', 'Ab', 'F', 'Ebm', 'Db', 'Ab', 'F', 'Ebm', 'Db', 'F', 'F'];
const A2_CHORDS = A_CHORDS;
const TURN_CHORDS = ['Db', 'Ab', 'F', 'F'];

const INTRO = 0;
const A = 16;
const B = 64;
const CHORUS = 112;
const BRIDGE = 160;
const A2 = 208;
const TURN = 256;
const LENGTH = 272;

/** Recast SPHERE_HOOK in minor: lower the 3rd (offset 4) and 6th (offset 9) a semitone. */
function toMinor(pattern: Note[]): Note[] {
  return pattern.map((n) => [n[0], n[1], n[2] === 4 ? 3 : n[2] === 9 ? 8 : n[2], n[3]] as Note);
}

const HOOK_MINOR = toMinor(SPHERE_HOOK);

/**
 * Over the V (F major), the tonic hook's Bb/Db/Gb each sit a semitone above
 * F's A/C/F. Swap in a shape that outlines F-A-C on the hook's own rhythm,
 * with the chromatic colour kept only as a sub-0.25-beat passing tone.
 */
const F_VARIANT: Note[] = [
  [0, 0.75, 0],
  [0.75, 0.75, 4],
  [1.5, 0.25, 1],
  [1.75, 0.25, 7],
  [2, 1, 4],
  [3, 1, 7],
];

/** Over Ab, only the hook's Db (offset 3) sits a semitone above Ab's C — shift it up to D. */
const AB_VARIANT: Note[] = HOOK_MINOR.map((n) => (n[2] === 3 ? ([n[0], n[1], 4, n[3]] as Note) : n));

function riffPatternFor(chordSymbol: string): { pattern: Note[]; root: Pitch } {
  if (chordSymbol === 'F') return { pattern: F_VARIANT, root: 'F3' };
  if (chordSymbol === 'Ab') return { pattern: AB_VARIANT, root: 'Bb3' };
  return { pattern: HOOK_MINOR, root: 'Bb3' };
}

/** A: the chord-aware hook, once a bar, answered an octave up every 4th bar. */
function riffA(chords: string[], start: number, velocity: number): Note[] {
  const notes: Note[] = [];
  const starts = barStarts(start, chords.length, BAR);
  chords.forEach((chord, i) => {
    const { pattern, root } = riffPatternFor(chord);
    const base = i % 4 === 3 ? transposeNotes(pattern, 12) : pattern;
    notes.push(...withVelocity(motif(base, [starts[i]!], [root]), velocity));
  });
  return notes;
}

/** B: call and response — the hook calls on even bars, a chord-tone counter-line answers the odd ones. */
function riffCallResponse(chords: string[], start: number): Note[] {
  const notes: Note[] = [];
  const starts = barStarts(start, chords.length, BAR);
  chords.forEach((chord, i) => {
    if (i % 2 !== 0) return;
    const { pattern, root } = riffPatternFor(chord);
    notes.push(...withVelocity(motif(pattern, [starts[i]!], [root]), 0.88));
  });
  const responseChords = chords.map((c, i) => (i % 2 === 1 ? c : ''));
  notes.push(
    ...arpLine(responseChords, { start, pattern: [2, 1, 0], step: 0.75, dur: 0.65, octave: 3, center: 63, velocity: 0.66, accent: 1.1 }),
  );
  return notes;
}

/** Bridge: the same chord-aware hook, ramping smoothly bar by bar and octave-doubling in the back half, building into A2. */
function riffBridge(chords: string[], start: number): Note[] {
  const notes: Note[] = [];
  const starts = barStarts(start, chords.length, BAR);
  const velocities = ramp(chords.length, 0.82, 1);
  chords.forEach((chord, i) => {
    const { pattern, root } = riffPatternFor(chord);
    const velocity = velocities[i]!;
    notes.push(...withVelocity(motif(pattern, [starts[i]!], [root]), velocity));
    if (i >= chords.length / 2) {
      notes.push(...withVelocity(motif(transposeNotes(pattern, 12), [starts[i]!], [root]), Math.max(0, velocity - 0.12)));
    }
  });
  return notes;
}

/** A2: the hook hits harder — octave-doubled every bar, the loudest statement of the riff (trimmed a notch so it doesn't swallow the rest of the loop). */
function riffA2(chords: string[], start: number): Note[] {
  const notes: Note[] = [];
  const starts = barStarts(start, chords.length, BAR);
  chords.forEach((chord, i) => {
    const { pattern, root } = riffPatternFor(chord);
    const base = i % 4 === 3 ? transposeNotes(pattern, 12) : pattern;
    notes.push(...withVelocity(motif(base, [starts[i]!], [root]), 0.92));
    notes.push(...withVelocity(motif(transposeNotes(base, 12), [starts[i]!], [root]), 0.72));
  });
  return notes;
}

/** The chorus: the hook unaltered (still bright and major) every other bar over Db — a co-peak with A2. */
function chorusHookLine(): Note[] {
  const notes: Note[] = [];
  const starts = barStarts(CHORUS, CHORUS_CHORDS.length, BAR);
  for (let i = 0; i < CHORUS_CHORDS.length; i += 2) {
    notes.push(...motif(SPHERE_HOOK, [starts[i]!], ['Db4']).map((n) => [n[0], n[1], n[2], 0.9] as Note));
  }
  return notes;
}

const OCTAVE_PUMP: Note[] = [
  [0, 0.4, 0, 0.85],
  [0.5, 0.4, 12, 0.68],
  [1, 0.4, 0, 0.82],
  [1.5, 0.4, 12, 0.66],
  [2, 0.4, 0, 0.85],
  [2.5, 0.4, 12, 0.68],
  [3, 0.4, 0, 0.82],
  [3.5, 0.4, 12, 0.66],
];

/** Octave-pumping bass, scaled per section (and ramped bar-by-bar through the bridge) so A2 pumps the hardest. */
function bassLine(): Note[] {
  const notes: Note[] = [];
  for (const { chords, start, scale } of [
    { chords: INTRO_CHORDS, start: INTRO, scale: 0.82 },
    { chords: A_CHORDS, start: A, scale: 1 },
    { chords: B_CHORDS, start: B, scale: 1.2 },
    { chords: CHORUS_CHORDS, start: CHORUS, scale: 1 },
    { chords: A2_CHORDS, start: A2, scale: 1.18 },
    { chords: TURN_CHORDS, start: TURN, scale: 1 },
  ]) {
    const pumped = motif(OCTAVE_PUMP, barStarts(start, chords.length, BAR), chordRoots(chords, 1));
    notes.push(...pumped.map((n) => [n[0], n[1], n[2], Math.min(1, (n[3] ?? 0.8) * scale)] as Note));
  }
  // Bridge: the bass ramps smoothly bar by bar right alongside the riff, kit and guitars.
  const bridgeScales = ramp(BRIDGE_CHORDS.length, 1.05, 1.35);
  const bridgeRoots = chordRoots(BRIDGE_CHORDS, 1);
  BRIDGE_CHORDS.forEach((_, bar) => {
    const pumped = motif(OCTAVE_PUMP, [BRIDGE + bar * BAR], [bridgeRoots[bar]!]);
    const scale = bridgeScales[bar]!;
    notes.push(...pumped.map((n) => [n[0], n[1], n[2], Math.min(1, (n[3] ?? 0.8) * scale)] as Note));
  });
  return notes;
}

const FLOOR_KICK = 'X...X...X...X...';
const FLOOR_CLAP = '....X.......X...';
const BREAK_KICK_MED = 'X...X...X.x.X...';
const BREAK_KICK_BUSY = 'X...X...X.x.X.x.';
const BREAK_SNARE_MED = '....X..gX.X.....';
const BREAK_SNARE_BUSY = '....X..gX.X.X.g.';
const HAT_16 = 'x.x.x.x.x.x.x.x.';
const HAT_MED = 'x.xxx.x.x.xxx.x.';
const HAT_BUSY = 'xxxxxxxxxxxxxxxx';
const B_CLAP_ACCENT = '........g.......';

/**
 * One bar per entry of `velocities`, each at its own start beat, with the pattern itself
 * stepping through three density tiers (sparse -> medium -> busy) across the section — the
 * bridge's build is more than louder, it is literally busier bar by bar, which reads clearly
 * in RMS where a velocity bump alone gets compressed away by both the instrument's own
 * velocity curve and the master normaliser.
 */
function rampedDrumBars(patterns: [string, string, string], start: number, velocities: number[], pitch = 'C1'): Note[] {
  const notes: Note[] = [];
  const n = velocities.length;
  velocities.forEach((velocity, bar) => {
    const tier = Math.min(2, Math.floor((bar / n) * 3));
    notes.push(...drumLine(patterns[tier]!, { start: start + bar * BAR, pitch, velocity, times: 1 }));
  });
  return notes;
}

function kickLine(): Note[] {
  return concatNotes(
    drumLine(FLOOR_KICK, { start: INTRO, pitch: 'C1', velocity: 0.7, times: 4 }),
    drumLine(FLOOR_KICK, { start: A, pitch: 'C1', velocity: 0.92, times: A_CHORDS.length }),
    // B: the busier breakbeat variant (more hits, not just louder ones) — real drum weight.
    drumLine(BREAK_KICK_BUSY, { start: B, pitch: 'C1', velocity: 0.95, times: B_CHORDS.length }),
    drumLine(FLOOR_KICK, { start: CHORUS, pitch: 'C1', velocity: 0.9, times: CHORUS_CHORDS.length }),
    rampedDrumBars([BREAK_KICK_MED, BREAK_KICK_BUSY, BREAK_KICK_BUSY], BRIDGE, ramp(BRIDGE_CHORDS.length, 0.92, 1)),
    drumLine(FLOOR_KICK, { start: A2, pitch: 'C1', velocity: 0.92, times: A2_CHORDS.length }),
    drumLine(FLOOR_KICK, { start: TURN, pitch: 'C1', velocity: 0.9, times: TURN_CHORDS.length }),
    // A2 only: an extra long-decay boom under the downbeat — trimmed a notch so it no longer
    // dominates the master normaliser and crushes every other section's level.
    drumLine('o.......', { start: A2, step: 0.5, pitch: 'C1', velocity: 0.78, times: A2_CHORDS.length }),
  );
}

function clapLine(): Note[] {
  return concatNotes(
    drumLine(FLOOR_CLAP, { start: A, pitch: 'C3', velocity: 0.78, times: A_CHORDS.length }),
    // B: a soft ghost accent alongside the snare — a little more weight without losing the breakbeat feel.
    drumLine(B_CLAP_ACCENT, { start: B, pitch: 'C3', velocity: 0.55, times: B_CHORDS.length }),
    drumLine(FLOOR_CLAP, { start: CHORUS, pitch: 'C3', velocity: 0.84, times: CHORUS_CHORDS.length }),
    drumLine(FLOOR_CLAP, { start: A2, pitch: 'C3', velocity: 0.86, times: A2_CHORDS.length }),
    drumLine(FLOOR_CLAP, { start: TURN, pitch: 'C3', velocity: 0.8, times: TURN_CHORDS.length }),
  );
}

function snareLine(): Note[] {
  return concatNotes(
    drumLine(BREAK_SNARE_BUSY, { start: B, pitch: 'D3', velocity: 0.94, times: B_CHORDS.length }),
    rampedDrumBars([BREAK_SNARE_MED, BREAK_SNARE_BUSY, BREAK_SNARE_BUSY], BRIDGE, ramp(BRIDGE_CHORDS.length, 0.88, 1), 'D3'),
  );
}

function hatLine(): Note[] {
  return concatNotes(
    drumLine(HAT_16, { start: A, pitch: 'F#3', velocity: 0.4, times: A_CHORDS.length }),
    drumLine(HAT_BUSY, { start: B, pitch: 'F#3', velocity: 0.5, times: B_CHORDS.length }),
    drumLine(HAT_16, { start: CHORUS, pitch: 'F#3', velocity: 0.56, times: CHORUS_CHORDS.length }),
    rampedDrumBars([HAT_MED, HAT_BUSY, HAT_BUSY], BRIDGE, ramp(BRIDGE_CHORDS.length, 0.44, 0.64), 'F#3'),
    drumLine(HAT_16, { start: A2, pitch: 'F#3', velocity: 0.52, times: A2_CHORDS.length }),
    drumLine(HAT_16, { start: TURN, pitch: 'F#3', velocity: 0.42, times: TURN_CHORDS.length }),
  );
}

/** Palm-muted eighth chugs following the chord roots — notes shorter than 0.12s mute themselves. */
function guitarChugs(chords: string[], start: number, velocity: number | number[] = 0.72): Note[] {
  const notes: Note[] = [];
  const roots = chordRoots(chords, 2);
  chords.forEach((_, bar) => {
    const root = roots[bar]!;
    const v = Array.isArray(velocity) ? velocity[bar]! : velocity;
    notes.push(...drumLine('x.x.x.x.x.x.x.x.', { start: start + bar * BAR, step: 0.25, pitch: root, velocity: v }));
  });
  return notes;
}

function guitarLine(): Note[] {
  return concatNotes(
    guitarChugs(A_CHORDS, A, 0.72),
    guitarChugs(B_CHORDS, B, 0.9),
    // Chorus: long sustained power chords instead of chugs — brighter, still edged, a co-peak with A2.
    chordLine(CHORUS_CHORDS, { start: CHORUS, octave: 3, center: 60, velocity: 0.8, dur: 3.6 }),
    guitarChugs(BRIDGE_CHORDS, BRIDGE, ramp(BRIDGE_CHORDS.length, 0.74, 1)),
    // A2: a wall of sustained power chords instead of muted chugs — trimmed a notch from the first pass.
    chordLine(A2_CHORDS, { start: A2, octave: 2, center: 55, velocity: 0.72, dur: 3.85 }),
  );
}

/** Second guitar: delayed ~0.012 beat, a sparser root+5th pattern instead of an identical double. `scale` boosts (or trims) both. */
function guitarChugs2(chords: string[], start: number, scale: number | number[] = 1): Note[] {
  const notes: Note[] = [];
  const roots = chordRoots(chords, 2);
  const pattern = 'x.x...x.x.x...x.'.split('');
  chords.forEach((_, bar) => {
    const root = roots[bar]!;
    const fifth = root + 7;
    const s = Array.isArray(scale) ? scale[bar]! : scale;
    pattern.forEach((ch, i) => {
      if (ch !== 'x') return;
      const at = start + bar * BAR + i * 0.25 + 0.012;
      const strong = i === 0 || i === 8;
      notes.push([at, 0.25, root, Math.min(1, (strong ? 0.78 : 0.58) * s)]);
      if (strong) notes.push([at, 0.25, fifth, Math.min(1, 0.55 * s)]);
    });
  });
  return notes;
}

function guitarLine2(): Note[] {
  return concatNotes(
    guitarChugs2(A_CHORDS, A),
    guitarChugs2(B_CHORDS, B, 1.3),
    chordLine(CHORUS_CHORDS, { start: CHORUS + 0.012, octave: 2, center: 55, velocity: 0.66, dur: 3.5, roll: 0.06 }),
    guitarChugs2(BRIDGE_CHORDS, BRIDGE, ramp(BRIDGE_CHORDS.length, 1, 1.35)),
    // A2 was a hard "fuller" boost (1.12x + a 0.7 fifth) — trimmed a notch so it no longer dominates.
    guitarChugs2(A2_CHORDS, A2, 1.02),
  );
}

/** Choir hits marking the big structural downbeats — aeon grandeur, not a continuous bed. */
function choirHits(): Note[] {
  return concatNotes(
    chordLine([B_CHORDS[0]!], { start: B, octave: 4, center: 67, velocity: 0.75, dur: 2 }),
    chordLine([CHORUS_CHORDS[0]!], { start: CHORUS, octave: 4, center: 67, velocity: 0.95, dur: 3.5 }),
    chordLine([CHORUS_CHORDS[4]!], { start: CHORUS + 16, octave: 4, center: 67, velocity: 0.88, dur: 3.5 }),
    chordLine([CHORUS_CHORDS[8]!], { start: CHORUS + 32, octave: 4, center: 67, velocity: 0.9, dur: 3.5 }),
    chordLine([BRIDGE_CHORDS[8]!], { start: BRIDGE + 32, octave: 4, center: 67, velocity: 0.85, dur: 2 }),
    chordLine([A2_CHORDS[0]!], { start: A2, octave: 4, center: 67, velocity: 0.95, dur: 3.8 }),
    chordLine([A2_CHORDS[4]!], { start: A2 + 16, octave: 4, center: 67, velocity: 0.85, dur: 3.8 }),
    chordLine([A2_CHORDS[8]!], { start: A2 + 32, octave: 4, center: 67, velocity: 0.9, dur: 3.8 }),
  );
}

function bellAccents(): Note[] {
  return [
    [A, 3, 'Bb4', 0.6],
    [CHORUS, 4, 'Db5', 0.65],
    [CHORUS + 32, 4, 'F5', 0.6],
    [BRIDGE + 40, 2, 'Ab4', 0.6],
    [A2, 3, 'Bb4', 0.72],
    [A2 + 32, 3, 'Bb5', 0.65],
    [TURN, 2, 'F5', 0.6],
  ];
}

export const bossFfx2AeonTrack: Track = {
  name: 'boss-ffx2-aeon',
  bpm: 160,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.55, damp: 0.42, width: 0.9, preDelay: 0.01 },
    delay: { timeBeats: 0.375, feedback: 0.24, damp: 3200 },
  },
  channels: [
    {
      name: 'riff stabs',
      instrument: 'supersaw',
      volume: 0.75,
      pan: -0.1,
      notes: concatNotes(
        riffA(A_CHORDS, A, 0.85),
        riffCallResponse(B_CHORDS, B),
        riffBridge(BRIDGE_CHORDS, BRIDGE),
        riffA2(A2_CHORDS, A2),
      ),
      fx: { reverb: 0.15, delay: 0.12 },
    },
    {
      name: 'chorus hook',
      instrument: 'supersaw',
      volume: 0.58,
      pan: 0.15,
      notes: chorusHookLine(),
      fx: { reverb: 0.25, delay: 0.15 },
    },
    { name: 'synth-bass', instrument: 'synth-bass', volume: 0.9, pan: 0, notes: bassLine(), fx: { reverb: 0.04 } },
    { name: 'kick', instrument: 'kick-808', volume: 0.9, pan: 0, notes: kickLine() },
    { name: 'clap', instrument: 'clap', volume: 0.72, pan: 0.05, notes: clapLine(), fx: { reverb: 0.1 } },
    { name: 'snare', instrument: 'snare-909', volume: 0.72, pan: -0.05, notes: snareLine(), fx: { reverb: 0.12 } },
    { name: 'hats', instrument: 'hat', volume: 0.42, pan: 0.22, notes: hatLine() },
    { name: 'guitar', instrument: 'guitar-dist', volume: 0.7, pan: 0.28, notes: guitarLine(), fx: { reverb: 0.15 } },
    { name: 'guitar-2', instrument: 'guitar-dist', volume: 0.62, pan: -0.32, notes: guitarLine2(), fx: { reverb: 0.15 } },
    { name: 'choir hits', instrument: 'choir', volume: 0.6, pan: 0, notes: choirHits(), fx: { reverb: 0.45 } },
    { name: 'bell', instrument: 'bell', volume: 0.45, pan: 0.3, notes: bellAccents(), fx: { reverb: 0.4, delay: 0.2 } },
  ],
};

export default bossFfx2AeonTrack;
