/**
 * Tourist Trap (the optional FFX-2 mission in the Cavern of the Stolen Fayth): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-13/14: "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." The chapter ships hidden behind
 * a typed word. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` section 1.14 to 1.16 and 2.2: Rikku sets up, Yuna reacts, Paine kills it; one thought
 * a line; sincerity rationed to ONE short exchange, which the jokes then restore).
 *
 * The beats are the public sources' (`research/ffx-yojimbo.md` section 8.2: fiends pour out of the former Chamber of the Fayth, the trapped tourists, Yuna enters the chamber and
 * fights Yojimbo, possessed by Shuyin's despair; he raises his right hand before Zanmato), in our own words:
 *
 * 1. **pre**: the tourists and the cave, the quiet chamber, the swordsman and the small stone dog, the despair that has found an aeon to wear.
 * 2. **mid-battle callouts** (two, each a short interrupt): the first Kozuka (the Poison and the lost MP) and the first Zanmato (everyone at one HP), in Rikku's and Paine's voices,
 *    naming the answer without naming the button.
 * 3. **post**: Yuna's one sincere exchange with the aeon (who is released, not killed: the research describes no exit, so this is our reading), then the jokes return.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here (no transcript is in the repo and none is needed). Yojimbo and Daigoro do not speak; they have no speaker id
 * (the id list is a contract file), so their moments are narration in the box with no name plate (`'none'`), as the Experiment's technician is.
 *
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed (the cave's own theme, "Labyrinth", has no cue of ours); the fight
 * is the formation's cue (`data/ffx2/enemies/tourist-trap.ts`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, sfx, shake, wait } from '../dsl.ts';
import { YOJIMBO_ACTIONS } from '../../data/ffx2/enemies/tourist-trap-abilities.ts';

/** Yojimbo's combatant id (`data/ffx2/enemies/tourist-trap.ts` `X2_YOJIMBO_ID`; written out here so the story layer imports no enemy module). */
const YOJIMBO = 'x2-yojimbo';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'Fiends keep pouring out of the Cavern of the Stolen Fayth, and a handful of tourists are stuck inside.'), // ours: the mission's setup
  say('rikku-x2', 'Tourists. In a cave full of fiends. On purpose?'), // ours: Rikku sets up
  say('yuna-x2', 'Um... the brochure did say "scenic."'), // ours: Yuna reacts
  say('paine', 'The brochure lied.'), // ours: Paine kills it
  say('none', 'The last tourist limps out. The Gullwings go on, down to the chamber where a fayth once stood.'), // ours: the rescue done, the descent
  say('none', 'It is quiet there. A swordsman waits in the old pool of light, a small stone dog at his side.'), // ours: the chamber, Yojimbo and Daigoro
  say('yuna-x2', 'Yojimbo...?'), // ours: Yuna knows him
  flash(220, '#8fa6ff'),
  say('none', 'He does not answer. Shuyin\'s despair has found an aeon to wear.'), // ours: the possession [wiki: possessed by Shuyin's despair]
  say('rikku-x2', 'Is the dog okay? Please say the dog is okay.'), // ours: Rikku asks about Daigoro
  say('paine', 'Watch the sword.'), // ours: Paine
  beat(700),
  say('yuna-x2', 'Hmm! We get him free. Then we go home.'), // ours: Yuna's decision tic
  shake(8, 400),
  say('none', 'Yojimbo draws.'), // ours: it begins
  battleStart(),
];

// --------------------------------------------------------------------------- mid

const MID: MidBattleTrigger[] = [
  {
    id: 'first-kozuka',
    when: { type: 'ability-used', who: YOJIMBO, ability: YOJIMBO_ACTIONS.kozuka },
    once: true,
    script: 'first-kozuka',
  },
  {
    id: 'first-zanmato',
    when: { type: 'ability-used', who: YOJIMBO, ability: YOJIMBO_ACTIONS.zanmato },
    once: true,
    script: 'first-zanmato',
  },
];

const MID_SCRIPTS: Record<string, StoryScript> = {
  // The first Kozuka: the lost MP and the Poison. Rikku reacts, Paine names the answer without naming the button.
  'first-kozuka': [
    say('rikku-x2', 'He took my MP! And I feel funny!', { auto: 1400 }),
    say('paine', 'Poison. Cure it.', { auto: 1100 }),
  ],

  // The first Zanmato: everyone at one HP. Rikku says it, Paine says what comes first.
  'first-zanmato': [
    say('rikku-x2', 'Everybody is on one HP! One!', { auto: 1400 }),
    say('paine', 'Heal first. Hit second.', { auto: 1300 }),
  ],
};

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'Yojimbo sinks to one knee. The sorrow lets go of him like smoke.', { auto: 2000 }), // ours: the despair leaves
  say('none', 'The little dog presses against his side.', { auto: 1500 }), // ours: Daigoro
  say('yuna-x2', 'Thank you. You can rest now.', { auto: 1600 }), // ours: the chapter's one sincere beat begins (writing bible 2.2: at most four lines)
  say('none', 'He bows to her once. Then he and the dog fade into the light.', { auto: 2200 }), // ours: the exit (the research describes none)
  sfx('confirm'),
  beat(900),
  say('rikku-x2', 'Okay, but who pays for the tourists\' tickets?', { auto: 1700 }), // ours: the jokes return
  say('paine', 'Not us.', { auto: 900 }), // ours: Paine kills it
  say('none', 'Outside, the tourists cheer. One of them asks if there is a second tour.', { auto: 2200 }), // ours: the trap closes on the joke
  say('paine', 'No.', { auto: 700 }), // ours: the one-word veto (writing bible 1.16)
  wait(900),
];

/** The chapter's story layer: the tourists and the chamber, the despair, the two callouts, and the release. */
export const ffx2TouristTrapScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
