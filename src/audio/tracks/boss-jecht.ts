/**
 * "Blitz for Two" — Jecht (Braska's Final Aeon) boss theme.
 *
 * ORIGINAL COMPOSITION. A son finally squaring up to his father: hard rock
 * first, orchestra second. D minor, drop-D-flavoured power chords, 144 bpm.
 * Double-tracked distorted guitar — two channels panned +-0.35, genuinely
 * different content (R drops the off-grid ghost chugs, swaps every root+5th
 * ring for root+octave and back, and sits ~5ms behind L), not just a
 * velocity trick. A real single-line solo (D aeolian/pentatonic, developed
 * across its 8 bars) throws in the occasional grace-note bend. The bridge
 * drops to half-time and lets the brass sing `PYREFLY_RISE_MAJOR` — the old
 * man's pride showing through the fury — before the riff crashes back in.
 *
 * Form (4/4, 64 bars, 106.7 s):
 *   bars  1- 4  intro    beats   0- 16  kit + bass alone, guitar teases the riff
 *   bars  5-12  A        beats  16- 48  riff in full, brass-stab accents      <- loop start
 *   bars 13-20  A2       beats  48- 80  riff variation, grows over A, tom fill
 *   bars 21-28  solo     beats  80-112  guitar-lead solo; rhythm guitars thin to quiet chugs
 *   bars 29-36  bridge   beats 112-144  half-time; brass sings the motif over its own chords
 *   bars 37-44  climax   beats 144-176  the riff crashes back, hardest hit of the piece
 *   bars 45-52  solo 2   beats 176-208  solo reprise, busier, one bend climax, then builds
 *   bars 53-60  final    beats 208-240  riff reprise, full band
 *   bars 61-64  turn     beats 240-256  four-bar turnaround back into the loop
 * Loop runs 16 -> 256; the turnaround's dominant chord resolves into the D minor riff.
 */

import {
  barStarts,
  chordLine,
  chordMidis,
  chordRoots,
  concatNotes,
  drumLine,
  motif,
  scaleVelocity,
  shiftNotes,
  tracker,
  type Note,
  type Track,
} from '../score.ts';
import { augment, cell, PYREFLY_RISE_MAJOR } from './motifs.ts';

const BAR = 4;

const INTRO_CHORDS = ['Dm', 'Dm', 'Dm', 'Dm'];
const A_CHORDS = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C'];
const A2_CHORDS = ['Dm', 'C', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A'];
const SOLO_CHORDS = ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'Dm', 'Bb', 'C'];
// Reharmonised under the bridge motif: D-Em-Bm-G-A-Bm-G-A keeps every held brass
// pitch a chord tone or a smooth 6th/9th/7th color, and ends on A (V) so the
// C# leading tone pulls straight into the Dm crash at the climax.
const BRIDGE_CHORDS = ['D', 'Em', 'Bm', 'G', 'A', 'Bm', 'G', 'A'];
const CLIMAX_CHORDS = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Bb', 'C', 'Dm'];
const SOLO2_CHORDS = ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'A', 'Bb', 'C'];
const FINAL_CHORDS = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C'];
const TURN_CHORDS = ['Bb', 'C', 'Bb', 'A'];
const ALL_CHORDS = [
  ...INTRO_CHORDS,
  ...A_CHORDS,
  ...A2_CHORDS,
  ...SOLO_CHORDS,
  ...BRIDGE_CHORDS,
  ...CLIMAX_CHORDS,
  ...SOLO2_CHORDS,
  ...FINAL_CHORDS,
  ...TURN_CHORDS,
];
const BARS = ALL_CHORDS.length; // 64
const LENGTH = BARS * BAR; // 256 beats = 106.7s @144bpm

const INTRO = 0;
const A = 16;
const A2 = 48;
const SOLO = 80;
const BRIDGE = 112;
const CLIMAX = 144;
const SOLO2 = 176;
const FINAL = 208;
const TURN = 240;

/** Riff cell, semitone offsets from the bar's root: chugs (<0.12s = palm mute at 144bpm)
 * punctuated by ringing root+5th and root+octave power chords. */
const RIFF_A: Note[] = [
  [0, 0.2, 0, 0.9], [0.25, 0.2, 0, 0.82], [0.5, 0.2, 0, 0.9],
  [1, 0.9, 0, 0.95], [1, 0.9, 7, 0.95],
  [2, 0.2, 0, 0.88], [2.25, 0.2, 0, 0.8], [2.5, 0.2, 0, 0.88], [2.75, 0.2, 0, 0.82],
  [3, 0.9, 0, 0.95], [3, 0.9, 12, 0.9],
];

/** A2 variation: an extra chug and an earlier, shorter chord for syncopation. */
const RIFF_A2: Note[] = [
  [0, 0.2, 0, 0.9], [0.25, 0.2, 0, 0.82], [0.5, 0.2, 0, 0.9], [0.75, 0.2, 0, 0.84],
  [1, 0.7, 0, 0.95], [1, 0.7, 7, 0.95], [1.75, 0.2, 0, 0.85],
  [2, 0.2, 0, 0.88], [2.25, 0.2, 0, 0.8], [2.5, 0.2, 0, 0.88],
  [3, 0.5, 0, 0.95], [3, 0.5, 7, 0.95], [3.5, 0.5, 0, 0.98], [3.5, 0.5, 12, 0.95],
];

/** Climax variation: mostly ringing chords, the hardest hit of the piece. */
const RIFF_CLIMAX: Note[] = [
  [0, 0.9, 0, 1], [0, 0.9, 7, 1],
  [1, 0.2, 0, 0.85], [1.25, 0.2, 0, 0.8],
  [1.5, 0.9, 0, 1], [1.5, 0.9, 7, 1],
  [2.5, 0.2, 0, 0.85], [2.75, 0.2, 0, 0.8],
  [3, 0.9, 0, 1], [3, 0.9, 12, 0.95],
];

/** Sparse muted chugs for the intro tease — no chords yet. */
const RIFF_INTRO: Note[] = [
  [0, 0.2, 0, 0.7], [0.5, 0.2, 0, 0.65], [1, 0.2, 0, 0.7],
  [2, 0.2, 0, 0.7], [2.5, 0.2, 0, 0.65], [3, 0.2, 0, 0.7], [3.5, 0.2, 0, 0.75],
];

/** Turnaround riff: chugs building into a chord that rings into the loop point. */
const RIFF_TURN: Note[] = [
  [0, 0.2, 0, 0.85], [0.5, 0.2, 0, 0.8], [1, 0.2, 0, 0.85],
  [1.5, 0.9, 0, 0.9], [1.5, 0.9, 7, 0.9],
  [2.5, 0.2, 0, 0.85], [3, 0.9, 0, 0.95], [3, 0.9, 7, 0.95],
];

/** A long, quiet root+5th swell held under the bridge — "the fury" simmering under the pride. */
const RIFF_SWELL: Note[] = [[0, 7.8, 0, 0.4], [0, 7.8, 7, 0.35]];

/** Quiet palm-muted quarter chugs so the lead sits on top during the first solo. */
const RIFF_CHUG_QUIET: Note[] = [[0, 0.18, 0, 0.42], [1, 0.18, 0, 0.38], [2, 0.18, 0, 0.42], [3, 0.18, 0, 0.38]];

/** Busier muted chugs for the second solo — still well under the lead, but building. */
const RIFF_CHUG_BUILD: Note[] = [
  [0, 0.18, 0, 0.55], [0.5, 0.18, 0, 0.45], [1, 0.18, 0, 0.55],
  [2, 0.18, 0, 0.55], [2.5, 0.18, 0, 0.45], [3, 0.18, 0, 0.55],
];

/** R's variant of a rhythm pattern: drop the off-grid 16th "ghost" chugs (the ones sitting
 * on a quarter-beat, not the beat or half-beat), and swap every root+5th/root+octave ring
 * for its opposite, so the double-track differs in substance, not just level. */
function rPattern(pattern: Note[]): Note[] {
  return pattern
    .filter((n) => {
      const frac = n[0] - Math.floor(n[0]);
      const isGhostChug = n[1] < 0.3 && (Math.abs(frac - 0.25) < 1e-6 || Math.abs(frac - 0.75) < 1e-6);
      return !isGhostChug;
    })
    .map((n): Note => {
      if (n[2] === 7) return [n[0], n[1], 12, n[3]];
      if (n[2] === 12) return [n[0], n[1], 7, n[3]];
      return n;
    });
}

const RIFF_A_R = rPattern(RIFF_A);
const RIFF_A2_R = rPattern(RIFF_A2);
const RIFF_CLIMAX_R = rPattern(RIFF_CLIMAX);
const RIFF_TURN_R = rPattern(RIFF_TURN);
const RIFF_SWELL_R = rPattern(RIFF_SWELL);

function riffNotes(pattern: Note[], chords: string[], start: number): Note[] {
  return motif(pattern, barStarts(start, chords.length, BAR), chordRoots(chords, 3));
}

function guitarCoreL(): Note[] {
  return concatNotes(
    riffNotes(RIFF_INTRO, INTRO_CHORDS, INTRO),
    riffNotes(RIFF_A, A_CHORDS, A),
    scaleVelocity(riffNotes(RIFF_A2, A2_CHORDS, A2), 1.05),
    riffNotes(RIFF_CHUG_QUIET, SOLO_CHORDS, SOLO),
    motif(RIFF_SWELL, [BRIDGE], [chordRoots(BRIDGE_CHORDS, 3)[0]!]),
    motif(RIFF_SWELL, [BRIDGE + 16], [chordRoots(BRIDGE_CHORDS, 3)[4]!]),
    riffNotes(RIFF_CLIMAX, CLIMAX_CHORDS, CLIMAX),
    riffNotes(RIFF_CHUG_BUILD, SOLO2_CHORDS, SOLO2),
    riffNotes(RIFF_A, FINAL_CHORDS, FINAL),
    riffNotes(RIFF_TURN, TURN_CHORDS, TURN),
  );
}

function guitarCoreR(): Note[] {
  const core = concatNotes(
    riffNotes(RIFF_INTRO, INTRO_CHORDS, INTRO),
    riffNotes(RIFF_A_R, A_CHORDS, A),
    scaleVelocity(riffNotes(RIFF_A2_R, A2_CHORDS, A2), 1.05),
    riffNotes(RIFF_CHUG_QUIET, SOLO_CHORDS, SOLO),
    motif(RIFF_SWELL_R, [BRIDGE], [chordRoots(BRIDGE_CHORDS, 3)[0]!]),
    motif(RIFF_SWELL_R, [BRIDGE + 16], [chordRoots(BRIDGE_CHORDS, 3)[4]!]),
    riffNotes(RIFF_CLIMAX_R, CLIMAX_CHORDS, CLIMAX),
    riffNotes(RIFF_CHUG_BUILD, SOLO2_CHORDS, SOLO2),
    riffNotes(RIFF_A_R, FINAL_CHORDS, FINAL),
    riffNotes(RIFF_TURN_R, TURN_CHORDS, TURN),
  );
  return shiftNotes(scaleVelocity(core, 0.93), 0.012);
}

/** The solo proper: a 2-bar idea in D aeolian/minor pentatonic (D F G A Bb C), sequenced up,
 * extended with a wider reach, and answered, with two grace-note bends as seasoning. */
const SOLO_LEAD = `
  D4:0.75 F4:0.75 G4:0.5 A4:1 G4:0.5 F4:0.5 | A4:1 C5:1 Bb4:0.75 A4:0.25 G4:0.25 F4:0.25 G4:0.25 A4:0.25 |
  F4:0.75 G4:0.75 A4:0.5 C5:1 Bb4:0.5 A4:0.5 | Db4:0.25@0.7 D4:0.75 F4:1 G4:0.5 F4:0.25 D4:0.25 C4:0.25 D4:0.75 |
  D4:0.5 F4:0.5 G4:0.5 Bb4:1 A4:0.5 G4:0.5 F4:0.5 | A4:1 G4:0.5 F4:0.5 D4:1 -:0.5 F4:0.25 G4:0.25 |
  A4:0.75 Bb4:0.75 C5:0.5 D5:1 C5:0.5 Bb4:0.5 | B4:0.25@0.7 C5:0.75 A4:1 G4:0.5 F4:1.5 |
`;

/** Solo 2: the idea returns busier (continuous 8ths, a couple of 16th runs into the downbeat),
 * climbs toward one held bend-grace note on the highest pitch of the whole solo, then settles
 * a full octave down to hand off cleanly into the final riff. */
const SOLO2_LEAD = `
  D4:0.5 F4:0.5 A4:0.5 D5:0.5 C5:0.5 A4:0.5 F4:0.5 G4:0.5 | A4:0.5 Bb4:0.5 D5:0.5 F5:0.25 D5:0.25 C5:0.5 Bb4:0.5 A4:0.5 G4:0.5 |
  G4:0.5 A4:0.5 C5:0.5 E5:0.5 D5:0.5 C5:0.5 A4:0.5 G4:0.5 | F4:0.25 G4:0.25 A4:0.25 C5:0.25 D5:1 C5:0.5 A4:0.5 F4:1 |
  G4:0.5 Bb4:0.5 D5:0.5 F5:0.25 D5:0.25 C5:0.5 Bb4:0.5 G4:1 | A4:0.5 C#5:0.5 E5:0.5 D5:0.5 C#5:0.5 A4:0.5 E4:0.5 A4:0.5 |
  Bb4:0.25 C5:0.25 D5:0.25 F5:0.25 Gb5:0.25@0.75 G5:1.75 E5:0.5 D5:0.25 C5:0.25 | C5:0.75 A4:0.75 F4:1 D4:1.5 |
`;

function guitarLead(): Note[] {
  return concatNotes(
    tracker(SOLO_LEAD, { start: SOLO, velocity: 0.85, checkBars: BAR }),
    tracker(SOLO2_LEAD, { start: SOLO2, velocity: 0.92, checkBars: BAR }),
  );
}

const BASS_MOTIF: Note[] = [
  [0, 0.4, 0, 0.95], [1, 0.9, 0, 0.9], [2, 0.4, 0, 0.92], [2.5, 0.4, 0, 0.85], [3, 0.9, 0, 0.95],
];

function bassRiff(chords: string[], start: number): Note[] {
  return motif(BASS_MOTIF, barStarts(start, chords.length, BAR), chordRoots(chords, 1));
}

function bassPulse(chords: string[], start: number, velocity: number): Note[] {
  return chordRoots(chords, 1).map((midi, bar): Note => [start + bar * BAR, 3.6, midi, velocity]);
}

function bassLine(): Note[] {
  return concatNotes(
    bassRiff(INTRO_CHORDS, INTRO),
    bassRiff(A_CHORDS, A),
    scaleVelocity(bassRiff(A2_CHORDS, A2), 1.05),
    bassPulse(SOLO_CHORDS, SOLO, 0.6),
    bassPulse(BRIDGE_CHORDS, BRIDGE, 0.48),
    bassRiff(CLIMAX_CHORDS, CLIMAX),
    bassPulse(SOLO2_CHORDS, SOLO2, 0.66),
    bassRiff(FINAL_CHORDS, FINAL),
    bassRiff(TURN_CHORDS, TURN),
  );
}

const KICK = 'X.x.X.x.X...X.x.';
const SNARE = '....X.......X...';
const SNARE_FILL = '....X..g..X.XXXX';
const HAT = 'x.X.x.X.x.X.x.X.';

function kit(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    if (at >= BRIDGE && at < CLIMAX) {
      notes.push(...drumLine('X.......x.......', { start: at, pitch: 'C1', velocity: 0.7 }));
      continue;
    }
    if (at >= SOLO && at < BRIDGE) {
      notes.push(...drumLine(KICK, { start: at, pitch: 'C1', velocity: 0.78 }));
      continue;
    }
    const grow = at >= A2 && at < SOLO ? 0.05 : 0;
    notes.push(...drumLine(KICK, { start: at, pitch: 'C1', velocity: Math.min(1, 0.92 + grow) }));
  }
  return notes;
}

function snareLine(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    if (at >= BRIDGE && at < CLIMAX) continue;
    if (at >= CLIMAX - BAR && at < CLIMAX) {
      for (let s = 0; s < 8; s++) notes.push([at + s * 0.5, 0.5, 'D2', 0.4 + (s / 8) * 0.55]);
      continue;
    }
    if (at >= SOLO && at < BRIDGE) {
      notes.push(...drumLine(SNARE, { start: at, pitch: 'D2', velocity: 0.68 }));
      continue;
    }
    const grow = at >= A2 && at < SOLO ? 0.04 : 0;
    const fill = bar % 8 === 7;
    notes.push(...drumLine(fill ? SNARE_FILL : SNARE, { start: at, pitch: 'D2', velocity: Math.min(1, 0.85 + grow) }));
  }
  return notes;
}

function hats(): Note[] {
  const notes: Note[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    const at = bar * BAR;
    const bridgeQuiet = at >= BRIDGE && at < CLIMAX;
    const soloQuiet = at >= SOLO && at < BRIDGE;
    const grow = at >= A2 && at < SOLO ? 0.03 : 0;
    const velocity = bridgeQuiet ? 0.28 : soloQuiet ? 0.36 : Math.min(1, 0.48 + grow);
    notes.push(...drumLine(HAT, { start: at, pitch: 'F#3', velocity }));
  }
  return notes;
}

function crashes(): Note[] {
  return [A, A2, CLIMAX, SOLO2, FINAL, TURN].map((beat): Note => [beat, 1.5, 'C5', 0.68]);
}

function toms(): Note[] {
  const fill = 'A3:0.25 A3:0.25 F3:0.25 F3:0.25 D3:0.25 D3:0.25 C3:0.5';
  return concatNotes(
    tracker(fill, { start: A2 + 30, velocity: 0.8 }),
    tracker(fill, { start: CLIMAX + 30, velocity: 0.85 }),
    tracker(fill, { start: FINAL + 30, velocity: 0.8 }),
  );
}

/** Off-beat brass punctuation — the classic battle-brass accent, kept high (~B4 centre)
 * so it clears the guitar's D3-D4 register. A2's last bar tapers to one soft stab so the
 * section breathes into the solo instead of cutting off flat. */
function stabs(chords: string[], start: number, offsets: number[], velocity: number): Note[] {
  const notes: Note[] = [];
  chords.forEach((symbol, bar) => {
    const tones = chordMidis(symbol, { octave: 4, center: 71 });
    for (const offset of offsets) {
      for (const midi of tones) notes.push([start + bar * BAR + offset, 0.25, midi, velocity]);
    }
  });
  return notes;
}

function brassStabs(): Note[] {
  return concatNotes(
    stabs(A_CHORDS, A, [1.5, 2.5], 0.78),
    stabs(A2_CHORDS.slice(0, 7), A2, [0, 1.5, 2.5, 3.5], 0.86),
    stabs(A2_CHORDS.slice(7), A2 + 7 * BAR, [1.5], 0.55),
    stabs(CLIMAX_CHORDS, CLIMAX, [0, 1, 2, 3], 0.92),
    stabs(FINAL_CHORDS, FINAL, [0, 1.5, 2.5, 3.5], 0.86),
  );
}

/** `PYREFLY_RISE_MAJOR` sung twice, augmented for the half-time feel, checked against
 * BRIDGE_CHORDS: statement 1's A3-D4-E4-F#4 lands on D-root, D-root, Em-root, Em/Bm 5th;
 * statement 2's A3-D4-E4-F#4 is a G 9th, G 5th, A 5th, A's smooth 13th into Bm's 5th. The
 * tail spells the G bar as a Gmaj9 upper structure (5-7-9), then the A bar as A major itself
 * so the held C# walks straight into the D minor crash. */
function bridgeBrass(): Note[] {
  return concatNotes(
    cell(augment(PYREFLY_RISE_MAJOR, 2), BRIDGE, 'D4', 0.7),
    cell(augment(PYREFLY_RISE_MAJOR, 2), BRIDGE + 12, 'D4', 0.82),
    tracker('D4+F#4+A4:4 E4+A4+C#5:4', { start: BRIDGE + 24, velocity: 0.78 }),
  );
}

function bridgeStrings(): Note[] {
  return chordLine(BRIDGE_CHORDS, { start: BRIDGE, octave: 3, center: 64, velocity: 0.5, dur: 3.85, roll: 0.05 });
}

export const jechtTrack: Track = {
  name: 'boss-jecht',
  bpm: 144,
  timeSig: [4, 4],
  loop: { start: A, end: LENGTH },
  length: LENGTH,
  tailSec: 2.5,
  fx: {
    reverb: { room: 0.55, damp: 0.48, width: 0.85, preDelay: 0.008 },
    delay: { timeBeats: 0.5, feedback: 0.22, damp: 2800 },
  },
  channels: [
    { name: 'guitar L', instrument: 'guitar-dist', volume: 0.72, pan: -0.35, notes: guitarCoreL(), fx: { reverb: 0.08 } },
    { name: 'guitar R', instrument: 'guitar-dist', volume: 0.68, pan: 0.35, notes: guitarCoreR(), fx: { reverb: 0.08 } },
    {
      name: 'guitar lead',
      instrument: 'guitar-dist',
      volume: 0.8,
      pan: -0.08,
      notes: guitarLead(),
      fx: { reverb: 0.16, delay: 0.14 },
    },
    { name: 'bass', instrument: 'bass', volume: 0.9, pan: 0, notes: bassLine(), fx: { reverb: 0.05 } },
    // 'sub' now sounds only under the bridge and climax — elsewhere it just doubled the bass
    // riff an octave down and muddied the mix.
    {
      name: 'sub',
      instrument: 'bass-sub',
      volume: 0.42,
      pan: 0,
      notes: concatNotes(
        chordRoots(BRIDGE_CHORDS, 1).map((midi, bar): Note => [BRIDGE + bar * BAR, 3.7, midi, 0.46]),
        chordRoots(CLIMAX_CHORDS, 1).map((midi, bar): Note => [CLIMAX + bar * BAR, 3.7, midi, 0.5]),
      ),
    },
    { name: 'kick', instrument: 'kick', volume: 0.95, pan: 0, notes: kit() },
    { name: 'snare', instrument: 'snare', volume: 0.82, pan: -0.05, notes: snareLine(), fx: { reverb: 0.14 } },
    { name: 'hats', instrument: 'hat', volume: 0.38, pan: 0.2, notes: hats() },
    { name: 'crash', instrument: 'crash', volume: 0.46, pan: 0.1, notes: crashes(), fx: { reverb: 0.28 } },
    { name: 'toms', instrument: 'tom', volume: 0.6, pan: -0.15, notes: toms(), fx: { reverb: 0.18 } },
    { name: 'brass stabs', instrument: 'brass-stab', volume: 0.55, pan: -0.28, notes: brassStabs(), fx: { reverb: 0.16 } },
    { name: 'brass', instrument: 'brass', volume: 0.78, pan: -0.15, notes: bridgeBrass(), fx: { reverb: 0.32, delay: 0.1 } },
    { name: 'strings', instrument: 'strings', volume: 0.55, pan: 0.2, notes: bridgeStrings(), fx: { reverb: 0.4 } },
  ],
};

export default jechtTrack;
