/**
 * The Fahrenheit's material — shared by the two Chapter VIII cues,
 * `scene-fahrenheit` ("Within the Hour") and `boss-evrae` ("Open Sky, Closed
 * Gate").
 *
 * ORIGINAL MATERIAL. Nothing here is transcribed, quoted or paraphrased from
 * Final Fantasy, Clair Obscur or any other copyrighted work (AGENTS.md rule 8,
 * docs/audio/THEMES.md "The rule that outranks everything else"). The research
 * brief names three retail tracks for this slot (research/ffx-evrae-airship.md
 * §12.6) and says, in bold, do not transcribe, sample or arrange any of them;
 * none of them was consulted for pitches or rhythms.
 *
 * GAME CASE (AGENTS.md rule 14): **FFX only.** Evrae on the deck of the
 * Fahrenheit is an FFX encounter; research §0.4 fences the airship mechanic in
 * ("no X-2 counterpart"). The mode is **Aeolian**, never Dorian — THEMES.md
 * reserves the raised sixth for the FFX-2 material, so a Dorian airship would
 * sound like the wrong game — and no dominant chord appears anywhere
 * (THEMES.md rations them to four in the whole score).
 *
 * THE SHIP FIGURE. Two bars, built on the score's own shared incipit:
 * `FAREWELL_RISE` (5 below - 1 - 2 - b3), imported from `themes.ts` and
 * compressed to eighths with the b3 held. The goodbye theme's first four notes,
 * driven at speed, are the sound of a crew flying to reach Yuna inside the
 * hour; the wyrm is only the doorman (research §12.5). After the rise the
 * figure leaps to the 5th, steps down, and in its second bar falls home with a
 * rest on each side — "a short two-bar figure that can survive being
 * interrupted" (§12.6), because the range flips and the Inhale telegraph will
 * cut it off.
 *
 * THE RANGE MIX. §12.6 asks for two states of the battle cue — a closed-in
 * NEAR variant (dry, loud, percussion forward) and a pulled-back FAR variant
 * (thinner, wider reverb, the melody at distance) — cross-faded on the range
 * flip. The notes are identical in both and in the cue the game plays today;
 * only the balance and the room move. {@link rangeVariant} builds either state
 * from the cue itself, so the three can never drift apart, and
 * {@link rangeSendScale} tells the offline renderer how much further into the
 * hall each group sits. The game cannot yet switch between them (that needs a
 * presenter hook on the range flip); the audition page plays them back to back
 * with the cross-fade so the idea can be judged by ear first (§12.6
 * "Audition requirement").
 */

import { nameFromMidi, parseChord, toMidi, type Channel, type Note, type Pitch, type Track } from '../score.ts';
import { FAREWELL_RISE } from './themes.ts';

// ---------------------------------------------------------------------------
// The figure
// ---------------------------------------------------------------------------

/**
 * `FAREWELL_RISE` on `tonic`, as tracker tokens: three eighths and a held
 * quarter. Built from the theme data, never retyped, so the interval sequence
 * is the bible's by construction.
 */
export function riseHead(tonic: Pitch): string {
  const root = toMidi(tonic);
  return FAREWELL_RISE.map(([, , offset], i) => {
    const step = i === FAREWELL_RISE.length - 1 ? 1 : 0.5;
    return `${nameFromMidi(root + toMidi(offset))}:${step}`;
  }).join(' ');
}

/**
 * The pursuit phrase, A minor, 8 bars at 4/4 — the battle cue's tune. Bars 1-2
 * are the ship figure. Bars 3-4 answer it falling; bars 5-6 restate it and
 * reach a step higher; bars 7-8 climb stepwise over bVI - bVII and land the
 * phrase's highest note on the i (the score's fingerprint, THEMES.md "Why
 * these six"). Every two-bar unit has at least a beat of rest in it.
 *
 * Harmony rule checked note by note against {@link PURSUIT_HALF}: every note
 * of half a beat or more is a chord tone, a 9th, or a semitone BELOW a chord
 * tone (the maj7 colour), never a semitone above one.
 */
export const PURSUIT_PHRASE = `
  ${riseHead('A4')} -:0.5 E5:0.5 D5:0.5 | C5:0.5 -:0.5 B4:0.5 G4:0.5 A4:1 -:1 |
  D5:0.5 B4:0.5 A4:0.5 G4:1 -:0.5 B4:1   | B4:0.5 -:0.5 A4:0.5 E4:0.5 G4:1 -:1 |
  ${riseHead('A4')} -:0.5 E5:0.5 F5:0.5 | E5:0.5 -:0.5 D5:0.5 C5:0.5 D5:1 -:1 |
  A4:1 C5:1 B4:1 D5:1                    | E5:3 -:1                           |
`;

/** Half-bar harmony under {@link PURSUIT_PHRASE}. i - bVI - bVII - v, then the fingerprint. */
export const PURSUIT_HALF = [
  'Am', 'Am', 'F', 'F', 'G', 'G', 'Em', 'Em',
  'Am', 'F', 'Dm', 'Dm', 'F', 'G', 'Am', 'Am',
];

/** The ship figure alone (bars 1-2 of the phrase), for the scene cue's foreshadowing. */
export function shipFigure(tonic: Pitch): string {
  const t = toMidi(tonic);
  const n = (offset: number): string => nameFromMidi(t + offset);
  return (
    `${riseHead(tonic)} -:0.5 ${n(7)}:0.5 ${n(5)}:0.5 | ` +
    `${n(3)}:0.5 -:0.5 ${n(2)}:0.5 ${n(-2)}:0.5 ${n(0)}:1 -:1 |`
  );
}

// ---------------------------------------------------------------------------
// Voicings — open, with air in the middle
// ---------------------------------------------------------------------------

/**
 * Five-note spread voicings for the piano's arpeggios: root and fifth low,
 * the colour tone in the middle, no doubled third. Every added note is
 * diatonic to A Aeolian (so the Em voicing takes no 9th: F# would be the
 * FFX-2 raised sixth). §12.6: "use fourths and fifths, leave air in the
 * middle of the mix."
 */
export const OPEN_VOICING: Record<string, string[]> = {
  Am: ['A3', 'E4', 'B4', 'C5', 'E5'],
  F: ['F3', 'C4', 'G4', 'A4', 'C5'],
  Fmaj7: ['F3', 'C4', 'G4', 'A4', 'E5'],
  G: ['G3', 'D4', 'A4', 'B4', 'D5'],
  Em: ['E3', 'B3', 'G4', 'B4', 'E5'],
  Dm: ['D3', 'A3', 'E4', 'F4', 'A4'],
  C: ['C4', 'G4', 'D5', 'E5', 'G5'],
};

/** Root of a chord symbol as MIDI in `octave` (A2 = 45 for octave 2). */
export function rootIn(symbol: string, octave: number): number {
  return (octave + 1) * 12 + parseChord(symbol).root;
}

// ---------------------------------------------------------------------------
// Performance helpers (THEMES.md "Performance rules")
// ---------------------------------------------------------------------------

/**
 * Boss-fight accent rule as code: the and-of-beat is LOUDER than the
 * downbeat — 0.95 against 0.80 — and no humaniser may level it.
 */
export function offbeatAccent(offsetInBeat: number): number {
  const frac = ((offsetInBeat % 1) + 1) % 1;
  if (frac < 1e-6) return 0.8;
  if (Math.abs(frac - 0.5) < 1e-6) return 0.95;
  return 0.86;
}

/**
 * Nothing holds one velocity for thirty seconds: a slow swell and a
 * deterministic wobble, small enough that nobody hears the device.
 */
export function breathe(notes: Note[], periodBeats: number, depth: number, wobble = 0.04): Note[] {
  return notes.map((n, i): Note => {
    const swell = 1 + depth * Math.sin((2 * Math.PI * n[0]) / periodBeats);
    const jitter = 1 + wobble * Math.sin(i * 2.399963);
    return [n[0], n[1], n[2], Math.max(0.03, Math.min(1, (n[3] ?? 0.8) * swell * jitter))];
  });
}

/** Multiply every velocity by the level of the section it starts in. */
export function sectionMacro(notes: Note[], level: (beat: number) => number): Note[] {
  return notes.map((n): Note => [n[0], n[1], n[2], Math.max(0.03, Math.min(1, (n[3] ?? 0.8) * level(n[0])))]);
}

/** A per-bar arch over a line: bar i of the section takes `arch[i]`. */
export function barArch(notes: Note[], start: number, arch: number[], barBeats = 4): Note[] {
  return notes.map((n): Note => {
    const bar = Math.floor((n[0] - start) / barBeats);
    return [n[0], n[1], n[2], arch[Math.min(Math.max(bar, 0), arch.length - 1)] ?? n[3] ?? 0.8];
  });
}

// ---------------------------------------------------------------------------
// The range mix (research §12.6 "Arc: two states, not one")
// ---------------------------------------------------------------------------

export type Range = 'near' | 'far';

/** How each channel group moves between the two states. */
export type RangeGroup = 'percussion' | 'drive' | 'lead' | 'air';

/**
 * `gain` scales the channel's volume; `send` scales how far into the hall the
 * offline renderer seats it; `delay` is the echo send a lead gets at range.
 * NEAR: dry, loud, percussion forward. FAR: the kit thins to almost nothing,
 * the drive halves, the tune sits back in the room with an echo on it, and
 * the drone and the piano's open fifths — the air — come forward.
 */
export const RANGE_MIX: Record<Range, Record<RangeGroup, { gain: number; send: number; delay: number }>> = {
  near: {
    percussion: { gain: 1.35, send: 0.55, delay: 0 },
    drive: { gain: 1.15, send: 0.65, delay: 0 },
    lead: { gain: 1.05, send: 0.75, delay: 0 },
    air: { gain: 0.6, send: 0.9, delay: 0 },
  },
  far: {
    percussion: { gain: 0.22, send: 1.7, delay: 0 },
    drive: { gain: 0.4, send: 1.5, delay: 0 },
    lead: { gain: 0.72, send: 1.9, delay: 0.22 },
    air: { gain: 1.35, send: 1.4, delay: 0.1 },
  },
};

/** Which group a `boss-evrae` channel belongs to, by channel name. */
export const RANGE_GROUP: Record<string, RangeGroup> = {
  kick: 'percussion',
  snare: 'percussion',
  hats: 'percussion',
  toms: 'percussion',
  crash: 'percussion',
  taiko: 'percussion',
  'engine clangs': 'percussion',
  timpani: 'percussion',
  'bass drive': 'drive',
  'string ostinato': 'drive',
  'low stabs': 'drive',
  'strings lead': 'lead',
  horns: 'lead',
  'piano lead': 'lead',
  sub: 'drive',
  'altitude drone': 'air',
  'piano air': 'air',
  flute: 'air',
};

function groupOf(channel: Channel): RangeGroup {
  return RANGE_GROUP[channel.name ?? ''] ?? 'lead';
}

/** The hall-send multiplier for one channel in one state (offline renderer only). */
export function rangeSendScale(channel: Channel, range: Range): number {
  return RANGE_MIX[range][groupOf(channel)].send;
}

/**
 * The same cue, balanced for one range state. Notes, tempo and loop points are
 * untouched, so the NEAR and FAR renders line up to the sample and a
 * cross-fade between them never moves the music, only the room.
 */
export function rangeVariant(track: Track, range: Range): Track {
  return {
    ...track,
    name: `${track.name}-${range}`,
    channels: track.channels.map((channel): Channel => {
      const mix = RANGE_MIX[range][groupOf(channel)];
      const delay = Math.max(channel.fx?.delay ?? 0, mix.delay);
      return {
        ...channel,
        volume: (channel.volume ?? 1) * mix.gain,
        fx: { ...channel.fx, delay },
      };
    }),
  };
}
