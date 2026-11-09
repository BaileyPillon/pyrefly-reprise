/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the mission "Pest Control"): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06), "yes on all these too" and 2026-11-07 "ok keep going we have full usage here". The writing follows the writing bible's
 * FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed to one short exchange, which the jokes then restore).
 *
 * The beats are the research's (`research/ffx2-fallen-aeons.md` §0.3 and §7.1: Shuyin possesses the fayth and sends their aeons against the temples; this one is Ifrit, in the Chamber of the Fayth at Kilika Temple; the mission is
 * compulsory; the Samurai dressphere is found in the temple on the way to him), in our own words:
 *
 * 1. **pre**: the chamber, the pyreflies swarming like pests (the mission's name is the joke), Ifrit rising wrapped in them, Yuna's dismay, Paine's answer, the go-call.
 * 2. **mid-battle callouts** (two, each a short interrupt): the first Meteor Strike (it goes for whoever stands farthest back) and the first Hellfire (all three), Rikku's and Paine's voices, naming the answer without naming the button.
 * 3. **post**: the pyreflies lift, Ifrit settles back into the fayth, and the girls' reaction, with one short sincere exchange and the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here (no transcript is in the repo and none is needed). Nothing is claimed that the research does not say: Kilika's local plot is not staged, because the research
 * names it and nothing more.
 *
 * **Speakers.** The girls speak with their approved FFX-2 portraits (`yuna-x2`, `rikku-x2`, `paine`); the narration is a stage direction in the box with no name plate (`'none'`), as Valefor's chapter does for its unnamed voices.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed; the fight is the formation's cue, `boss-ffx2-fallen-aeons` (`data/ffx2/enemies/ifrit.ts`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID } from '../../data/ffx2/enemies/ifrit-abilities.ts';
import { IFRIT_ID } from '../../data/ffx2/enemies/ifrit.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Kilika Temple, the Chamber of the Fayth. The pyreflies are thick as flies on a summer pond.'), // ours: the place, and the mission's name as a joke
  say('rikku-x2', 'Pest control, they said. Nobody said the pests would be glowing.'), // ours: Rikku sets up
  say('yuna-x2', 'These are not pests. They are somebody’s memories.'), // ours: Yuna reacts
  say('paine', 'Something is feeding them.'), // ours: Paine kills it
  shake(8, 400),
  flash(220, '#ffd2a8'),
  say('none', 'Ifrit rises from the fayth, wrapped in pyreflies that are not his.'), // ours: the possessed aeon (research §0.3)
  say('yuna-x2', 'Ifrit... It is us. Please, listen.'), // ours: Yuna's dismay
  say('none', 'The aeon turns. The fire in his eyes is not his own.'), // ours
  say('rikku-x2', 'Okay, that is a very angry campfire.'), // ours: Rikku says what Yuna cannot yet
  say('paine', 'Then we put it out.'), // ours: Paine's flat promise
  beat(700),
  say('yuna-x2', 'Hmm! Right. Nobody burns this temple down today.'), // ours: the go-call (the mission, keep the temple)
  battleStart(),
];

// --------------------------------------------------------------------------- mid

/** The first Meteor Strike: it goes for whoever stands farthest back. */
const FIRST_METEOR = 'first-meteor-strike';
/** The first Hellfire: his Overdrive. */
const FIRST_HELLFIRE = 'first-hellfire';

const MID: MidBattleTrigger[] = [
  {
    id: FIRST_METEOR,
    when: { type: 'ability-used', who: IFRIT_ID, ability: IFRIT_METEOR_STRIKE_ID },
    once: true,
    script: FIRST_METEOR,
  },
  {
    id: FIRST_HELLFIRE,
    when: { type: 'ability-used', who: IFRIT_ID, ability: IFRIT_HELLFIRE_ID },
    once: true,
    script: FIRST_HELLFIRE,
  },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The pyreflies lift from Ifrit like sparks from a dying fire.', { auto: 1900 }), // ours: the possession ends
  say('yuna-x2', 'Ifrit... are you all right?', { auto: 1400 }), // ours: the one sincere beat (writing bible §2.2: at most four lines)
  say('none', 'The aeon bows his head once, and settles back into the fayth.', { auto: 1900 }), // ours
  say('yuna-x2', 'Someone is waking the fayth on purpose.', { auto: 1400 }), // ours: she names it, no more than the research says
  say('paine', 'Then we find them.', { auto: 1200 }), // ours: Paine closes the beat
  beat(700),
  say('rikku-x2', 'Pest control, done! Do we get a certificate?', { auto: 2000 }), // ours: the joke returns
  say('paine', 'No.', { auto: 900 }), // ours: Paine kills it
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The first Meteor Strike: it went for the one standing back. Rikku sets up, Paine names the answer without naming the button.
  [FIRST_METEOR]: [
    say('rikku-x2', 'He picked the one at the back! Why is it always the back?', { auto: 1500 }),
    say('paine', 'Keep her healed.', { auto: 1100 }),
  ],
  // The first Hellfire: the big one on all three. Yuna reacts, Paine tells her what to do about it next time.
  [FIRST_HELLFIRE]: [
    say('yuna-x2', 'That was all of us at once!', { auto: 1300 }),
    say('paine', 'Next time, shell up first.', { auto: 1200 }),
  ],
};

/** The chapter's story layer: the swarming chamber, the possessed aeon, two callouts, and the close. */
export const ffx2IfritKilikaScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
