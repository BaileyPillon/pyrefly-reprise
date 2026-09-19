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
import { bars, descent, micro, perform, swell, type Appoggiatura } from './menus-perform.ts';

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

/**
 * The one stepwise descent in the phrase: bar 6's `4 b3` walking on across the
 * barline into bar 7's `2` — `A4 - G4 - F#4`, over `Am | C` then `D`.
 *
 * It is a chain, not a pair, and that is why it was wrong. The G4 is the
 * resolution of the fall inside bar 6 *and* the leaning note of the fall into
 * bar 7, and `lean()` can only put a note in one of those two roles. Declared
 * as a pair, the G4 came out at 0.50 against an F#4 at 0.59 — backwards, which
 * `tools/audio/themes-audit.mjs` reports as *"the single loudest tell of a
 * synthetic performance"*, and rightly: this is the bible's own shape, a note
 * held two beats giving way to a shorter one a step below.
 *
 * `descent()` lays all three on one falling line and keeps their mean, so the
 * arch the table wrote is untouched and bar 7 now *starts* from under the note
 * before it — which is also what its written climb `2 b3 4` wants, since it has
 * to rise from somewhere to reach the 4.
 */
const DESCENT = [START + 20, START + 22, START + 24];

/** Soprano: HYMN bars 1-8, one voice, wordless, no rubato. */
function soprano(): Note[] {
  const whole = tracker(HYMN_SOPRANO, { checkBars: BAR, velocity: 0.55 });
  const played = perform(bars(whole, 0, 32, START), {
    table: DYN,
    barBeats: BAR,
    // The phrase starts at beat 4, so the table has to be indexed from there.
    // Without this the eight-bar arch was read off bar 1 of an eight-entry
    // table and the last bar clamped — the hymn's own small swell, thrown
    // away, in the cue the bible says is mostly air and therefore has the
    // least else in it to carry the line.
    at: START,
    // Bar 8 is THE SIGH — the 2 over the iv6 falling to the tonic, the score's
    // one shared cadence. The leaning F#4 is louder than the E4 it falls to.
    leans: [[START + 28, START + 30]],
    // Bar 3's fall — the 4 over the iv giving way to the b3, the same step the
    // sigh is — at the smaller weight reserved for a phrase's inner sighs. Its
    // resolution is a THREE-beat note, so it is a pair and not a chain: nothing
    // leans on from it, and `lean()` is the right tool.
    softLeans: [[START + 10, START + 12]],
    // No breaths: the rests are written into the hymn and agogic timing is
    // explicitly forbidden here.
    slope: 0.025,
    jitter: 0.02,
    salt: 71,
  });
  // Last, so that nothing above can invert it.
  return descent(played, DESCENT, 0.05);
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

/**
 * NO TEMPO MAP, AND THAT IS THE DECISION.
 *
 * `title` and `chapter-select` both gained one in this pass, and the obvious
 * thing to do was to give all three cues the same treatment. THEMES.md forbids
 * it, twice, in the two places that govern this cue:
 *
 *   > 4/4, `checkBars: 4`, **52 bpm**. Broad and congregational — this is sung
 *   > by a crowd, not a soloist, so *no rubato* (it is the only lyrical theme
 *   > with none).
 *
 *   > | HYMN, and the Yunalesca canon | **zero.** A congregation does not
 *   > rubato, and the rite does not breathe |
 *
 * A tempo map is rubato with the pulse included, so it is more of the thing
 * the bible says this theme gets none of, not less. It is also the wrong
 * *idea*: what makes eight bars of a hymn loop under a menu without wearing
 * out is that it does not want anything, and a pulse that leans and recovers
 * is a pulse that wants something. The breath in this cue is bar 4 beat 4,
 * where all the parts rest at once, and it is written as a rest because that
 * is how the bible says to write a breath.
 *
 * So the rubato work for this cue went into the two things it *is* allowed:
 * the written arch, which was being thrown away (see `at` in `soprano()`), and
 * the appoggiatura at bar 8. If a future pass wants the pause screen to bend,
 * that is a change to THEMES.md first and to this file second.
 */
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
      // ONE voice, at the far end of the biggest room in the game — not a
      // choir standing in front of it. Three things decide that and only two
      // of them reach the shipped MP3.
      //
      // Her timing is the first and it is the one that was actually wrong.
      // The `choir` preset is a section on risers: it scatters entries by
      // 34 ms, because twenty singers are never together, and a 34 ms scatter
      // is precisely what makes a voice read as a *block* laid over a cue
      // rather than as a person standing somewhere. THEMES.md's solo band is
      // 8-12 and `soprano-distant` asks for 10. There is nothing else in this
      // cue to hide behind, so it is audible here before anywhere else.
      //
      // Her level is the second: 0.5 against a drone at 0.25 and a harp at
      // 0.3 keeps her the tune without putting her in front of the room.
      //
      // The reverb send is the third, and in the sampled render the *seat*
      // wins it — `choir` sits at depth 0.88 and sends 0.65 whatever this
      // channel says. So 0.8 is for the synthesised fallback, which is the
      // only path that reads a channel send, and which has to sound like the
      // same cue.
      name: 'soprano',
      instrument: VOICE.soprano,
      volume: 0.5,
      pan: -0.06,
      perform: { timingJitterMs: 10 },
      notes: soprano(),
      fx: { reverb: 0.8 },
    },
    {
      // The hymn's own tenor part, sung. 30 ms is the `pad` preset's section
      // spread; one voice under one voice wants the same 14 the bible gives a
      // choir, and no more.
      name: 'tenor drone',
      instrument: VOICE.drone,
      volume: 0.25,
      pan: 0.08,
      perform: { timingJitterMs: 14 },
      notes: drone(),
      fx: { reverb: 0.6 },
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

/**
 * Every appoggiatura in this cue, as data — and in a cue with one melodic
 * line and forty seconds of air, all three of them are in it.
 *
 * Bar 8 is THE SIGH: scale degree 2 held over the `iv6` and falling to the
 * tonic, the plagal amen that closes the hymn twice and the whole score's
 * punctuation. If any one leaning note in this game has to be louder than what
 * it falls to, it is this F#4. The others are the same falling step — the 4
 * over the iv giving way to the b3 — inside bars 3-4, and then the two links of
 * the `A4 - G4 - F#4` chain that walks bar 6 into bar 7 (see `DESCENT`). The
 * second of those is the pair the shape audit failed on before this pass.
 */
export const APPOGGIATURAS: Appoggiatura[] = [
  { channel: 'soprano', lean: START + 28, resolve: START + 30, where: 'bar 8 — THE SIGH (the amen)' },
  { channel: 'soprano', lean: START + 10, resolve: START + 12, where: 'bars 3-4 — the 4 onto the b3' },
  { channel: 'soprano', lean: START + 20, resolve: START + 22, where: 'bar 6 — the 4 onto the b3' },
  {
    channel: 'soprano',
    lean: START + 22,
    resolve: START + 24,
    where: 'bars 6-7 — the b3 across the barline onto the 2',
  },
];

export default pauseTrack;
