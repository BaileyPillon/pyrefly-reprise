/**
 * The Fiend Arena Superbosses (Almighty Shinra, then the Major Numerus: the two top fights of the Fiend Arena): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15, Fallen Maesters FM6 and Farplane Cup precedent).** The chapter is hidden behind a typed word, so nothing here is on the board; the words are the stage's
 * (a Sonnet sub-agent of the Echoes of Spira driver), written under Bailey's delegation of 2026-11-06 and 2026-10-31, and every line is ours. The writing follows the writing bible's FFX-2 voice
 * (`research/writing-bible.md` section 1.14 to 1.16 and 2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore),
 * in the arena's announcer tone (a stage direction in the box with no name plate).
 *
 * The beats are the research's, and thin on purpose: how the arena launches these fights, its cups' rounds and the prizes are not in the files (`research/re-ffx2-fiend-arena-superbosses.md` sections 1 and 8, U1), so the
 * chapter tells two fights and no cup, and says so ("no cup tonight, no prizes"). The foes are named by the arena's own table: the boss strip carries "Almighty Shinra" and "Major Numerus", and the narration says only what
 * they are (a boy grown to the size of the arena; four heads on one frame).
 *
 * 1. **pre**: the arena, the doors that are not on any board, the boy at full size.
 * 2. **one seam** (a seam is a mid-battle script that plays at a link's fall): the arena mends the girls (no Save Sphere card plays between the acts, so the line says why the girls are whole again), the four heads. It
 *    plays with the player's hands off: 13.6 s (`scriptDurationMs`; `fiend-superbosses-story.test.ts` pins it under 16 s).
 * 3. **mid-battle callouts** (three, each a short interrupt): Shinra's first Clione, his first Final Impact, the first Fulmen Command.
 * 4. **post**: the last head falls; one short sincere exchange; the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits; the narration is a stage direction in the box with no name plate (`'none'`).
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed; each fight is the formation's cue (`data/ffx2/enemies/fiend-superbosses.ts`, `boss-trema`, a
 * flagged stand-in, LG9). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { FS_ABILITY, FS_SEAM_1, X2_ALMIGHTY_SHINRA_ID, X2_NUMERUS_TRIA_ID } from '../../data/fiend-superbosses-ids.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'The top of the Fiend Arena. No cup tonight and no prizes posted: two names on a door that is on no board.'), // ours: the place; the cups, the rounds and the prizes are not in the files, so the story does not invent them
  say('rikku-x2', 'Only two names? We must be very good!'), // ours: Rikku sets up
  say('yuna-x2', 'Or very late. Look at the sand, Rikku.'), // ours: Yuna reacts
  say('paine', 'It has been raked for something large.'), // ours: Paine kills it
  shake(6, 400),
  say('none', 'A boy walks out of the dark, grown to the size of the arena, and he does not hurry.'), // ours: Almighty Shinra (named on the boss strip)
  say('none', 'He is counting. He has always been counting.'), // ours: the loop of six beats, as a hunch
  say('rikku-x2', 'Is that... Shinra? He got so BIG!'), // ours
  say('paine', 'He still counts everything.'), // ours: the six-beat loop
  beat(600),
  say('yuna-x2', 'Together, and keep your feet under you.'), // ours
  battleStart(),
];

// --------------------------------------------------------------------------- seam

/** The seam from act 1 to act 2: Almighty Shinra's fall. Authored as a hands-off beat; every `say` carries its own `auto`. 13.6 s of script time (`scriptDurationMs`). */
const SEAM_1: StoryScript = [
  say('none', 'The boy folds up, grins, and is gone like a sum put away.', { auto: 1800 }), // ours: he falls
  flash(200, '#d8c8ff'),
  say('none', 'The arena mends the girls, and nothing else.', { auto: 1400 }), // ours: the girls are whole again (no Save Sphere card plays here)
  say('rikku-x2', 'Two fights and a refill. Is the next one smaller?', { auto: 2300 }), // ours: Rikku sets up
  say('paine', 'No.', { auto: 700 }), // ours: Paine kills it
  say('none', 'Four heads rise from the sand, and each is already singing.', { auto: 2200 }), // ours: the Major Numerus (four heads, four songs)
];

// --------------------------------------------------------------------------- mid

/** Shinra's first Clione. */
const FIRST_CLIONE = 'first-clione';
/** Shinra's first Final Impact. */
const FIRST_FINAL_IMPACT = 'first-final-impact';
/** The first Fulmen Command (Tria's). */
const FIRST_COMMAND = 'first-command';

const MID: MidBattleTrigger[] = [
  { id: FIRST_CLIONE, when: { type: 'ability-used', who: X2_ALMIGHTY_SHINRA_ID, ability: FS_ABILITY.clione }, once: true, script: FIRST_CLIONE },
  { id: FIRST_FINAL_IMPACT, when: { type: 'ability-used', who: X2_ALMIGHTY_SHINRA_ID, ability: FS_ABILITY.finalImpact }, once: true, script: FIRST_FINAL_IMPACT },
  { id: FS_SEAM_1, when: { type: 'ko', who: X2_ALMIGHTY_SHINRA_ID }, once: true, script: FS_SEAM_1 },
  { id: FIRST_COMMAND, when: { type: 'ability-used', who: X2_NUMERUS_TRIA_ID, ability: FS_ABILITY.fulmenCommand }, once: true, script: FIRST_COMMAND },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The last head goes quiet. The sand is just sand again.', { auto: 1900 }), // ours: the Major Numerus falls
  say('none', 'Nothing on the door changes. Nobody posts a prize, and the arena does not say well done.', { auto: 2500 }), // ours: no cup, no prizes (U1)
  say('yuna-x2', 'We did not need a prize to know that.', { auto: 1800 }), // ours: the one sincere beat begins (writing bible 2.2: at most four lines)
  say('paine', 'We needed the Commands not to land.', { auto: 1700 }), // ours
  say('yuna-x2', 'Then we were lucky. Twice.', { auto: 1400 }), // ours
  beat(700),
  say('rikku-x2', 'Luck! I will take luck over a prize any day. Almost any day.', { auto: 2300 }), // ours: the joke returns
  say('none', 'Two names on a door, and the door is still open.', { auto: 1800 }), // ours
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [FS_SEAM_1]: SEAM_1,

  // Shinra's first Clione: ten blows at once on random girls. Rikku sets up, Paine says what to do.
  [FIRST_CLIONE]: [
    say('rikku-x2', 'That is ten blows at once!', { auto: 1200 }),
    say('paine', 'Stand up through it. He repeats.', { auto: 1500 }),
  ],
  // Shinra's first Final Impact: an eighth of everyone's life and magic, fourteen times.
  [FIRST_FINAL_IMPACT]: [
    say('yuna-x2', 'It took a slice off all of us!', { auto: 1300 }),
    say('paine', 'An eighth, fourteen times. Heal.', { auto: 1500 }),
  ],
  // The first Fulmen Command: it charges before it lands, and the girls cannot change what it does.
  [FIRST_COMMAND]: [
    say('rikku-x2', 'Something big is charging!', { auto: 1200 }),
    say('paine', 'Protect and Shell do nothing to it.', { auto: 1700 }),
  ],
};

/** The chapter's story layer: the arena and the boy at full size, one seam, three callouts, and the close. */
export const ffx2FiendSuperbossesScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
