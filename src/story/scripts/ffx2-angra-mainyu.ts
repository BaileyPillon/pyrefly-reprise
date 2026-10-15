/**
 * Angra Mainyu (FFX-2 Chapter 5, the mission "Showdown in the Sands"): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey adopted the chapter on 2026-10-07 (D-536) and on 2026-10-14 wrote, relayed by the driver: "Please work on finishing the unimplemented chapters STAT". The writing follows the writing bible's FFX-2 voice
 * (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to one short exchange, which the jokes then restore).
 *
 * The beats are the research's (`research/ffx2-angra-mainyu.md` §1: a fiend the Cactuars sealed away long ago, woken by the Al Bhed's digging; the Ten Gatekeepers ward it off the Cactuars' home, so it attacks the
 * Al Bhed excavation camp instead; the Gullwings must stop it; the body comes with two arms, Zarich and Tawrich), in our own words:
 *
 * 1. **pre**: the camp, the shadow on the sand, Rikku's stake in it, the two arms breaking out before the body, the go-call.
 * 2. **mid-battle callouts** (three, each a short interrupt): the first Perdition's Flame (ten hits), the first Full-Life (the body brings an arm back, which costs it a turn), the first Glimmer of Despair
 *    (Zarich saps MP and stats). Rikku's and Paine's voices, naming the answer without naming the button.
 * 3. **post**: the body goes down into the sand and the arms with it; Rikku asks after the camp; one short sincere exchange and the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here (no transcript is in the repo and none is needed). Nothing is claimed that the research does not say: Marnela and the Cactuar Nation scenes
 * around the mission are not staged, because the research names them and nothing more.
 *
 * **Speakers.** The girls speak with their approved FFX-2 portraits (`yuna-x2`, `rikku-x2`, `paine`); the narration is a stage direction in the box with no name plate (`'none'`), as Chapters XVI, the Experiment and
 * Valefor at Besaid do for their unnamed voices.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed (the game's own Bikanel theme has no cue of ours); the fight is the formation's cue,
 * `boss-ffx2-fallen-aeons` (`data/ffx2/enemies/angra-mainyu.ts`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { X2_ANGRA_MAINYU_ID, X2_ZARICH_ID } from '../../data/angra-mainyu-ids.ts';
import { ANGRA_FULL_LIFE_ID, ANGRA_PERDITIONS_FLAME_ID, ZARICH_GLIMMER_ID } from '../../data/ffx2/enemies/angra-mainyu-abilities.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Bikanel Desert, the Al Bhed dig. A long shadow is crossing the sand, and it is not going around the camp.'), // ours: the place and the trouble (research §1)
  say('rikku-x2', 'That is our dig! Somebody tell it to take the long way!'), // ours: Rikku sets up
  say('yuna-x2', 'The gatekeepers turned it away from the Cactuars. It just picked somewhere else to be angry.'), // ours: Yuna reacts (the gatekeepers ward it off; it attacks the camp)
  say('paine', 'Then it picked us.'), // ours: Paine kills it
  shake(8, 400),
  flash(220, '#f2d9a8'),
  say('none', 'Two huge arms break out of the sand before the rest of it does.'), // ours: the arms come first (the body has two, Zarich and Tawrich)
  say('rikku-x2', 'Okay. That is a lot of arm.'), // ours
  say('none', 'The body follows, shedding sand like a cloak.'), // ours
  say('yuna-x2', 'Something sealed this away. The digging let it out.'), // ours: the fiend the Cactuars buried, woken by the dig (research §1)
  say('paine', 'Then we put it back.'), // ours: Paine's flat promise
  beat(700),
  say('rikku-x2', 'For the record, I am very mad about my camp.'), // ours: the go-call
  battleStart(),
];

// --------------------------------------------------------------------------- mid

/** The first Perdition's Flame: ten hits on random girls. */
const FIRST_FLAME = 'first-perditions-flame';
/** The first Full-Life: the body brings a fallen arm back. */
const FIRST_REVIVE = 'first-full-life';
/** The first Glimmer of Despair: Zarich saps the party's MP and stats. */
const FIRST_GLIMMER = 'first-glimmer-of-despair';

const MID: MidBattleTrigger[] = [
  {
    id: FIRST_FLAME,
    when: { type: 'ability-used', who: X2_ANGRA_MAINYU_ID, ability: ANGRA_PERDITIONS_FLAME_ID },
    once: true,
    script: FIRST_FLAME,
  },
  {
    id: FIRST_REVIVE,
    when: { type: 'ability-used', who: X2_ANGRA_MAINYU_ID, ability: ANGRA_FULL_LIFE_ID },
    once: true,
    script: FIRST_REVIVE,
  },
  {
    id: FIRST_GLIMMER,
    when: { type: 'ability-used', who: X2_ZARICH_ID, ability: ZARICH_GLIMMER_ID },
    once: true,
    script: FIRST_GLIMMER,
  },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The great body folds into the dunes, and the arms follow it down.', { auto: 1900 }), // ours: the end (the arms leave with the body)
  say('rikku-x2', 'The camp! Is the camp okay?', { auto: 1400 }), // ours: the one sincere beat (writing bible §2.2: at most four lines)
  say('yuna-x2', 'Still standing.', { auto: 1200 }), // ours
  say('none', 'The sand settles. Nothing moves under it.', { auto: 1700 }), // ours
  say('paine', 'Check again in a thousand years.', { auto: 1500 }), // ours: Paine closes the beat
  beat(700),
  say('rikku-x2', 'Great. I will bring snacks.', { auto: 1700 }), // ours: the joke returns
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The first Perdition's Flame: ten hits on whoever it picks. Rikku sets up, Paine names the answer without naming the button.
  [FIRST_FLAME]: [
    say('rikku-x2', 'Ten hits! It picks whoever it likes!', { auto: 1500 }),
    say('paine', 'Keep everyone high. It comes back.', { auto: 1400 }),
  ],
  // The first Full-Life: the body spends a turn putting an arm back. Yuna reacts, Paine says what it costs.
  [FIRST_REVIVE]: [
    say('yuna-x2', 'It put the arm back!', { auto: 1200 }),
    say('paine', 'That cost it a turn.', { auto: 1200 }),
  ],
  // The first Glimmer of Despair: Zarich saps MP and stats. Rikku sets up, Yuna names it.
  [FIRST_GLIMMER]: [
    say('rikku-x2', 'My MP! And everything else!', { auto: 1300 }),
    say('yuna-x2', 'That is Zarich.', { auto: 1100 }),
  ],
};

/** The chapter's story layer: the camp and the shadow, three callouts, and the close. */
export const ffx2AngraMainyuScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
