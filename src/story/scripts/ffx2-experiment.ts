/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-10: "I'll add in those 2 chapter recommendations"; "i want those chapters added in over night while im sleep". The driver's reading,
 * recorded as his delegation: the chapter ships hidden behind a typed word, and the writing follows the writing bible's FFX-2 voice
 * (`research/writing-bible.md` §1.14-1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts, Paine kills it; one thought a line; sincerity rationed
 * to a short beat that the jokes then restore).
 *
 * **What is sourced and what is ours.** The beats are the public sources' (`research/ffx2-experiment.md`, `[verified: wiki + Jegged]`): the Al Bhed in Djose
 * Temple show the girls a "superweapon" they built, a prototype made to take on Vegnagun out of spare parts dug up in the desert, and dare them to fight it; how
 * strong it is depends on the parts it was given; after it falls the Al Bhed repair it. **Every line is ours**: no line of the game's dialogue is quoted here
 * (no transcript is in the repo and none is needed), each is marked `ours` with the beat it carries.
 *
 * **The levels are chosen before the scene.** The prep tab fixes the Experiment's parts before the pre scene plays, and a script is a fixed list, so these
 * lines speak of "the parts" in general and never of a level; they read right for a Level 1 fight and for a Level 5 one.
 *
 * **Speakers.** The girls speak with their approved FFX-2 portraits. The Al Bhed technician has no portrait and no speaker id of his own (the id list is a
 * contract file), so his lines are stage directions in the box with no name plate (`'none'`), as Chapter XVI's Abyss does for its unnamed voices.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed (the game's own Machine Faction theme
 * has no cue of ours); the fight is the chapter record's. Bailey's call by ear.
 */

import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Inside the temple the Al Bhed have a surprise for them.'), // ours: the Machine Faction's Djose, the "superweapon" scene
  say('none', '"We built it ourselves," a technician says. "Parts from the desert."'), // ours: built from spare parts dug up in Bikanel
  say('rikku-x2', 'Is it a statue? Please tell me it is a statue.'), // ours: Rikku sets up
  say('yuna-x2', "Um... it's looking at us."), // ours: Yuna reacts
  say('paine', 'Then it is not a statue.'), // ours: Paine kills it
  say('none', '"It was made to take on Vegnagun," the technician says.'), // ours: the prototype's purpose (wiki scan text, in our words)
  say('none', '"It is only as strong as the parts we gave it."'), // ours: its power depends on its parts, and the girls chose them
  say('rikku-x2', 'So it is as strong as we say. Ta-daaa! Mission!'), // ours: Rikku turns the choice into a joke
  beat(900),
  say('paine', 'Do not enjoy this.'), // ours: Paine's veto
  say('yuna-x2', "Okay. Let's do it before I think about it too hard."), // ours (house sample line, writing bible §1.14); Yuna's go-call
  shake(8, 400),
  say('none', 'The walker lowers its head.'), // ours: it wakes
  battleStart(),
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The walker kneels, and smoke drifts up out of its joints.'), // ours: it goes down
  say('rikku-x2', 'Is it done? It looks done. Dr. P, is it done?'), // ours: Rikku sets up
  say('paine', 'It is down.'), // ours: Paine's flat answer
  say('yuna-x2', 'Please do not poke it, Rikku.'), // ours: Yuna reacts
  flash(180, '#fff1b8'),
  say('none', 'The technician runs in with a manual and a very large wrench.'), // ours: the Al Bhed repair it
  say('none', '"Perfect," he says. "Now we know what it can take."'), // ours: they rebuild it for the next test
  beat(900),
  say('yuna-x2', 'It was built to stop something much bigger.'), // ours: the sincere beat, kept short
  say('paine', 'Then it had better be ready.'), // ours
  beat(1100),
  say('rikku-x2', "Right. Everybody, back to the airship! I'm hungry."), // ours: the banter returns
  wait(900),
];

/** The chapter's story layer: the Machine Faction's dare, the fight, and the repair. No mid-battle beats yet (the AI emits no trigger). */
export const ffx2ExperimentScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: [],
  midScripts: {},
};
