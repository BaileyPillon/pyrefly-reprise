/**
 * Valefor at Besaid (FFX-2 Chapter 3, the mission "Protect Besaid Temple!"): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-13 (chat, relayed by the driver): "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed
 * ahead while I sleep". The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills
 * it; one thought a line; sincerity rationed to one short exchange, which the jokes then restore).
 *
 * The beats are the research's (`research/ffx2-fallen-aeons.md` §0.3 and §7.1: Shuyin possesses the fayth and sends their aeons against the temples; this one is Valefor, in the Chamber of the
 * Fayth at Besaid Temple; the mission is compulsory; Yuna meets her own aeon with dismay), in our own words:
 *
 * 1. **pre**: the chamber, the pyreflies that will not settle, Valefor rising wrapped in them, Yuna's dismay, Paine's answer, the go-call.
 * 2. **mid-battle callouts** (two, each a short interrupt): the first Energy Ray (it reaches the whole party) and the first Energy Blast (the big one), Rikku's and Paine's voices, naming the
 *    answer without naming the button.
 * 3. **post**: the pyreflies lift, Valefor settles back into the fayth, and the girls' reaction, with one short sincere exchange and the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here (no transcript is in the repo and none is needed). Nothing is claimed that the research does not say: the local plot of
 * Besaid (Wakka and Beclem) is not staged, because the research names it and nothing more.
 *
 * **Speakers.** The girls speak with their approved FFX-2 portraits (`yuna-x2`, `rikku-x2`, `paine`); the narration is a stage direction in the box with no name plate (`'none'`), as Chapters XVI
 * and the Experiment do for their unnamed voices.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed (the game's own Besaid theme has no cue of ours); the fight is the
 * formation's cue, `boss-ffx2-fallen-aeons` (`data/ffx2/enemies/valefor.ts`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { VALEFOR_ENERGY_BLAST_ID, VALEFOR_ENERGY_RAY_ID } from '../../data/ffx2/enemies/valefor-abilities.ts';
import { VALEFOR_ID } from '../../data/ffx2/enemies/valefor.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Besaid Temple, the Chamber of the Fayth. The stone is warm, and the pyreflies will not settle.'), // ours: the place and the trouble
  say('rikku-x2', 'Okay, why is the air glowing? The air should not glow.'), // ours: Rikku sets up
  say('yuna-x2', 'Um... that is the fayth. Something is pulling at it.'), // ours: Yuna reacts
  say('paine', 'Something with wings.'), // ours: Paine kills it
  shake(8, 400),
  flash(220, '#cfeaff'),
  say('none', 'Valefor rises from the fayth, wrapped in pyreflies that are not hers.'), // ours: the possessed aeon (research §0.3)
  say('yuna-x2', 'Valefor? It is me. Please, stop.'), // ours: Yuna's dismay (research §1.1)
  say('none', 'The aeon turns its head. Nothing in its eyes knows her.'), // ours
  say('rikku-x2', 'Okay, that is definitely not our Valefor.'), // ours: Rikku says what Yuna cannot yet
  say('paine', 'Then we take her back.'), // ours: Paine's flat promise
  beat(700),
  say('yuna-x2', 'Hmm! Right. Nobody gets past us today.'), // ours: the go-call (the mission, protect the temple)
  battleStart(),
];

// --------------------------------------------------------------------------- mid

/** The first Energy Ray: it reaches the whole party. */
const FIRST_RAY = 'first-energy-ray';
/** The first Energy Blast: her Overdrive. */
const FIRST_BLAST = 'first-energy-blast';

const MID: MidBattleTrigger[] = [
  {
    id: FIRST_RAY,
    when: { type: 'ability-used', who: VALEFOR_ID, ability: VALEFOR_ENERGY_RAY_ID },
    once: true,
    script: FIRST_RAY,
  },
  {
    id: FIRST_BLAST,
    when: { type: 'ability-used', who: VALEFOR_ID, ability: VALEFOR_ENERGY_BLAST_ID },
    once: true,
    script: FIRST_BLAST,
  },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The pyreflies lift from Valefor like smoke from a snuffed lamp.', { auto: 1900 }), // ours: the possession ends
  say('yuna-x2', 'Valefor... are you all right?', { auto: 1400 }), // ours: the one sincere beat (writing bible §2.2: at most four lines)
  say('none', 'The aeon bows once, and settles back into the fayth.', { auto: 1900 }), // ours
  say('yuna-x2', 'Somebody did this on purpose.', { auto: 1400 }), // ours: she names it, no more than the research says
  say('paine', 'Then we find them.', { auto: 1200 }), // ours: Paine closes the beat
  beat(700),
  say('rikku-x2', 'Mission complete! And the temple is still standing. Mostly.', { auto: 2000 }), // ours: the joke returns
  say('paine', 'Mostly.', { auto: 900 }), // ours: Paine kills it
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The first Energy Ray: it hit all of us. Rikku sets up, Paine names the answer without naming the button.
  [FIRST_RAY]: [
    say('rikku-x2', 'Ow! That one hit all of us!', { auto: 1400 }),
    say('paine', 'Heal. Then hit back.', { auto: 1200 }),
  ],
  // The first Energy Blast: the big one. Yuna reacts, Paine tells her what to do about it next time.
  [FIRST_BLAST]: [
    say('yuna-x2', 'That was the big one!', { auto: 1300 }),
    say('paine', 'Next time, be ready.', { auto: 1200 }),
  ],
};

/** The chapter's story layer: the glowing chamber, the possessed aeon, two callouts, and the close. */
export const ffx2ValeforBesaidScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
