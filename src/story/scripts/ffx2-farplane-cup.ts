/**
 * The Farplane Cup (the Fiend Arena's three duels: Auron, Tidus and Seymour): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15 and Fallen Maesters FM6 precedent).** The chapter is hidden behind a typed word, so nothing here is on the board; the words are the release driver's, written
 * under Bailey's blanket yes of 2026-11-06, and every line is ours. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: the three-beat banter, Rikku sets up, Yuna reacts,
 * Paine kills it; one thought a line; sincerity rationed to ONE short exchange, which the jokes then restore).
 *
 * The beats are the research's, and thin on purpose: the cup's own structure (rounds, rewards, who it recruits) is not in the files (`research/re-ffx2-farplane-cup.md` §5), so the chapter tells three duels and no tournament,
 * and says so ("no rounds, no prizes posted"). The three duelists are named by the arena's own table except the second (the table masks his name, pick DU3), whom the story names only after the fight.
 *
 * 1. **pre**: the arena, three names on the door, the first duelist.
 * 2. **two seams** (a seam is a mid-battle script that plays at a link's fall: the first and the second duelist): the arena mends the girls (no Save Sphere card plays between the duels, so the line says why the girls are whole
 *    again), the next fighter. Each plays with the player's hands off: 12.8 s after Auron and 11.0 s after the second duelist (`scriptDurationMs`; `farplane-cup-story.test.ts` pins both under 16 s).
 * 3. **mid-battle callouts** (three, each a short interrupt): Auron's first Shooting Star, the second duelist's first Blitz Ace, Seymour's first Meteor.
 * 4. **post**: the last duelist falls; the hidden name is read out; one short sincere exchange; the joke restored.
 *
 * **Every line is ours**: no line of the game's dialogue is quoted here. **Speakers.** The girls speak with their approved FFX-2 portraits; the narration is a stage direction in the box with no name plate (`'none'`).
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the FFX-2 chapters' bed; each fight is the formation's cue (`data/ffx2/enemies/farplane-cup.ts`, `boss-trema`, a flagged stand-in).
 * Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, flash, music, results, say, shake, wait } from '../dsl.ts';
import { CUP_SEAM_1, CUP_SEAM_2, X2_CUP_AURON_ID, X2_CUP_SEYMOUR_ID, X2_CUP_TIDUS_ID } from '../../data/farplane-cup-ids.ts';
import { CUP_ABILITY } from '../../data/ffx2/enemies/farplane-cup-abilities.ts';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  say('none', 'The Fiend Arena. No rounds, no prizes posted, only three names on a door and a floor that has seen worse.'), // ours: the place; the cup's structure is not in the files, so the story does not invent one
  say('rikku-x2', 'Three fights, and a refill in between. Lovely.'), // ours: Rikku sets up
  say('yuna-x2', 'It is not a holiday, Rikku.'), // ours: Yuna reacts
  say('paine', 'The first one carries a sword.'), // ours: Paine kills it
  shake(6, 400),
  say('none', 'A swordsman in a red coat steps onto the sand and does not hurry.'), // ours: Auron (named on the boss strip)
  say('none', 'He has walked a long way to be here, and he is in no mood to stop.'), // ours
  say('rikku-x2', 'He looks like he has never lost a staring contest.'), // ours
  say('paine', 'Then do not look at him. Look at his sword.'), // ours: the slow, heavy rhythm of his turns, as a hunch
  beat(600),
  say('yuna-x2', 'Together, and stay on your feet.'), // ours
  battleStart(),
];

// --------------------------------------------------------------------------- seams

/** The seam from duel 1 to duel 2: Auron's fall. Authored as a hands-off beat; every `say` carries its own `auto`. 12.8 s of script time (`scriptDurationMs`). */
const SEAM_1: StoryScript = [
  say('none', 'The swordsman lowers his blade, nods once, and walks back into the dark.', { auto: 1700 }), // ours: he falls
  flash(200, '#d8c8ff'),
  say('none', 'The arena mends the girls, and nothing else.', { auto: 1400 }), // ours: the girls are whole again (no Save Sphere card plays here)
  say('rikku-x2', 'Free refills! Is the next one smaller?', { auto: 1300 }), // ours: Rikku sets up
  say('paine', 'Faster.', { auto: 800 }), // ours: Paine kills it (the second duelist's AGI is the highest of the block)
  say('none', 'Someone steps into the light with a name the arena has hidden.', { auto: 2100 }), // ours: the masked name (pick DU3)
];

/** The seam from duel 2 to duel 3: the second duelist's fall. 11.0 s of script time. The name stays hidden until the post scene. */
const SEAM_2: StoryScript = [
  say('none', 'He grins, takes one step back, and is gone like a thought.', { auto: 1600 }), // ours: he falls
  flash(200, '#d8c8ff'),
  say('none', 'The arena mends the girls once more.', { auto: 1200 }), // ours
  say('yuna-x2', 'I knew that step.', { auto: 1100 }), // ours: Yuna, a hint and no more
  say('paine', 'Later.', { auto: 700 }), // ours
  say('none', 'A maester in layered robes crosses the sand, perfectly calm.', { auto: 2000 }), // ours: Seymour
];

// --------------------------------------------------------------------------- mid

/** Auron's first Shooting Star. */
const FIRST_SHOOTING_STAR = 'first-shooting-star';
/** The second duelist's first Blitz Ace. */
const FIRST_BLITZ_ACE = 'first-blitz-ace';
/** Seymour's first Meteor. */
const FIRST_METEOR = 'first-meteor';

const MID: MidBattleTrigger[] = [
  { id: FIRST_SHOOTING_STAR, when: { type: 'ability-used', who: X2_CUP_AURON_ID, ability: CUP_ABILITY.shootingStar }, once: true, script: FIRST_SHOOTING_STAR },
  { id: CUP_SEAM_1, when: { type: 'ko', who: X2_CUP_AURON_ID }, once: true, script: CUP_SEAM_1 },
  { id: FIRST_BLITZ_ACE, when: { type: 'ability-used', who: X2_CUP_TIDUS_ID, ability: CUP_ABILITY.blitzAce }, once: true, script: FIRST_BLITZ_ACE },
  { id: CUP_SEAM_2, when: { type: 'ko', who: X2_CUP_TIDUS_ID }, once: true, script: CUP_SEAM_2 },
  { id: FIRST_METEOR, when: { type: 'ability-used', who: X2_CUP_SEYMOUR_ID, ability: CUP_ABILITY.meteor }, once: true, script: FIRST_METEOR },
];

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does

  music(null, 800),
  say('none', 'The maester bows, almost kindly, and fades from the sand.', { auto: 1700 }), // ours: Seymour falls
  say('none', 'On the board by the door, the hidden name finally prints: Tidus.', { auto: 2200 }), // ours: the reveal of the masked name (pick DU3)
  say('yuna-x2', 'He fought like someone I used to know.', { auto: 2000 }), // ours: the one sincere beat begins (writing bible §2.2: at most four lines)
  say('paine', 'He fought like someone who was told to.', { auto: 1800 }), // ours
  say('yuna-x2', 'Then he was told well.', { auto: 1400 }), // ours
  beat(700),
  say('rikku-x2', 'And the third one just left. Rude! No tip, no bow, nothing.', { auto: 2000 }), // ours: the joke returns
  say('none', 'Three names on a door, and the door is still open.', { auto: 1800 }), // ours: the cup's other fighters are not built (DU7)
  wait(900),
];

// ------------------------------------------------------------------- mid scripts

const MID_SCRIPTS: Record<string, StoryScript> = {
  [CUP_SEAM_1]: SEAM_1,
  [CUP_SEAM_2]: SEAM_2,

  // Auron's first Shooting Star: a girl is removed from the fight. Rikku sets up, Paine says what to do.
  [FIRST_SHOOTING_STAR]: [
    say('rikku-x2', 'Where did she go?!', { auto: 1200 }),
    say('paine', 'Out of the fight. Keep everyone close.', { auto: 1500 }),
  ],
  // The second duelist's first Blitz Ace: nine blows on one girl.
  [FIRST_BLITZ_ACE]: [
    say('yuna-x2', 'Nine blows, all on one of us!', { auto: 1400 }),
    say('paine', 'Heal the one he picks. He is fast.', { auto: 1700 }),
  ],
  // Seymour's first Meteor: twelve falling stars over the party.
  [FIRST_METEOR]: [
    say('rikku-x2', 'Meteors! Where are they going?', { auto: 1200 }),
    say('paine', 'Everywhere. Stay up.', { auto: 900 }),
  ],
};

/** The chapter's story layer: the arena and the swordsman, two seams, three callouts, and the close. */
export const ffx2FarplaneCupScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};
