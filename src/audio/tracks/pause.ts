/**
 * "Still Water" — the pause screen.
 *
 * ORIGINAL COMPOSITION. The material is the score's own HYMN from `themes.ts`,
 * imported and not retyped.
 *
 * THE CUE MAP (docs/audio/THEMES.md §The cue map, row 3):
 *   HYMN bars 1-8, solo soprano over a tenor drone at 0.25. No alto, no bass,
 *   no percussion. E Aeolian, 46 bpm. The one emotion: *the game holding its
 *   breath.*
 *
 * This is the shortest cue in the game and the one with the least in it, on
 * purpose. THEMES.md: *"`pause` is mostly air. Resist the urge to score it."*
 * So there are two voices and a harp that touches two notes in forty seconds,
 * the breath in bar 4 is a real rest in both parts, and nothing swells to fill
 * any of it.
 *
 * Two rules from the bible are load-bearing here:
 *   - **No rubato.** HYMN is the only lyrical theme with none: a congregation
 *     does not rubato. Every note lands where it is written.
 *   - **No leading tone, ever.** E Aeolian, five chords, no dominant — which is
 *     why eight bars of it can loop under a menu without ever sounding like it
 *     wants to go somewhere.
 *
 * Form (4/4, 46 bpm, 36 beats ≈ 47 s):
 *   beats  0-4    the drone alone, arriving from nothing
 *   beats  4-36   HYMN bars 1-8                              <- loop start
 * Loop 4 → 36: the phrase ends on the tonic at bar 8 and begins on it at bar 1,
 * so the wrap is the same step the listener already heard, and the one bar of
 * drone before the loop point is what gives the seam crossfade a run-up.
 */

import { concatNotes, midiFromName, tracker, type Note, type Track } from '../score.ts';
import { HYMN_SOPRANO, HYMN_TENOR } from './themes.ts';
import { bars, micro, perform, swell } from './menus-perform.ts';

/**
 * Which sampled voice each part names. Both exist in the synthesised registry
 * as well, so the pause screen still makes sound if its MP3 fails to decode.
 * `soprano-distant` is what the soprano line wants — see request #1 in
 * docs/audio/requests-menus-clair-obscur.md.
 */
const VOICE = {
  soprano: 'choir', // want: 'soprano-distant'
  drone: 'pad',
  harp: 'harp', // want: 'harp-close'
} as const;

const BAR = 4;
const START = 4;
const LENGTH = 36;

/**
 * The hymn is a crowd, so it does not swell like a soloist — but nothing in
 * this score is allowed to be flat either. This is a small arch over eight
 * bars, peaking where the tune does (bar 7's rise to the 4th) and stepping
 * back for the two closes.
 */
const DYN = [0.5, 0.56, 0.58, 0.5, 0.52, 0.58, 0.6, 0.52];

/** Soprano: HYMN bars 1-8, one voice, wordless, no rubato. */
function soprano(): Note[] {
  const whole = tracker(HYMN_SOPRANO, { checkBars: BAR, velocity: 0.55 });
  return perform(bars(whole, 0, 32, START), {
    table: DYN,
    barBeats: BAR,
    // Bar 8 is THE SIGH — the 2 over the iv6 falling to the tonic, the score's
    // one shared cadence. The leaning F#4 is louder than the E4 it falls to.
    leans: [[START + 28, START + 30]],
    // Bar 3's rising fourth is answered an octave and a fifth up at the hymn's
    // climax, which this cue never reaches; the answer is the arrival it gets.
    softLeans: [[START + 10, START + 12]],
    // No breaths: the rests are written into the hymn and agogic timing is
    // explicitly forbidden here.
    slope: 0.025,
    jitter: 0.02,
    salt: 71,
  });
}

/**
 * The tenor, at a quarter the soprano's weight.
 *
 * Written as the hymn's own tenor part rather than one held pitch: it moves
 * four times in eight bars, always by step or common tone, so it reads as a
 * drone that happens to breathe rather than as a second tune. It rests on beat
 * 4 of bar 4 with everybody else — that silence is the only event in the cue.
 */
function drone(): Note[] {
  const whole = tracker(HYMN_TENOR, { checkBars: BAR, velocity: 0.42, gate: 1.02 });
  // The same arch as the soprano, at a fraction of the depth: a drone that
  // follows the singer instead of sitting on one level for eight bars.
  const line = swell(bars(whole, 0, 32, START), DYN, BAR, START);
  const entry: Note[] = [[0, 4.1, midiFromName('E3'), 0.3]];
  return micro(concatNotes(entry, line), 0.02, 73);
}

/**
 * Two harp notes in the whole cue: an open fifth at each phrase head, quiet
 * enough to be felt rather than heard. Not accompaniment — punctuation.
 */
function harp(): Note[] {
  const fifth = (at: number, velocity: number): Note[] => [
    [at, 3.5, midiFromName('E3'), velocity],
    [at + 0.06, 3.5, midiFromName('B3'), velocity * 0.9],
  ];
  return concatNotes(fifth(START, 0.24), fifth(START + 16, 0.2));
}

export const pauseTrack: Track = {
  name: 'pause',
  bpm: 46,
  timeSig: [4, 4],
  loop: { start: START, end: LENGTH },
  length: LENGTH,
  // The last bar is a plagal close and the bible says to let it run.
  tailSec: 7,
  fx: {
    // The biggest, softest room in the game — and the highest pre-delay, which
    // is what puts the singer at the far end of it.
    reverb: { room: 0.94, damp: 0.2, width: 0.95, preDelay: 0.05 },
  },
  channels: [
    {
      name: 'soprano',
      instrument: VOICE.soprano,
      volume: 0.62,
      pan: -0.06,
      notes: soprano(),
      fx: { reverb: 0.62 },
    },
    {
      name: 'tenor drone',
      instrument: VOICE.drone,
      volume: 0.25,
      pan: 0.08,
      notes: drone(),
      fx: { reverb: 0.55 },
    },
    {
      name: 'harp',
      instrument: VOICE.harp,
      volume: 0.3,
      pan: -0.24,
      notes: harp(),
      fx: { reverb: 0.5 },
    },
  ],
};

export default pauseTrack;
