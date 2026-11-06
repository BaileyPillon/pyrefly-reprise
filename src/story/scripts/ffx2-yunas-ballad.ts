/**
 * Yuna's Ballad (the possessed Rikku, then the possessed Paine, in the Den of Woe): the story layer of our hidden chapter. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **A DRAFT for Bailey to read before it ships (the Gippal GP15 precedent; the writing is the release driver's, under his blanket yes of 2026-11-06).** The chapter is hidden behind a typed word, so nothing here is on
 * the board, and every line is ours: no line of the game's dialogue is quoted or reworked. The writing follows the writing bible's FFX-2 voice (`research/writing-bible.md` §1.14 to §1.16 and §2.2: sincerity rationed to
 * ONE short exchange, the jokes restored after), and the Den's own tone ("the most mournful FFX-2 chapter we have", `./ffx2-den-of-woe.ts`): the possessed girls are **silent** (as the shades are, GP13 a) and Yuna carries the lines.
 *
 * The beats are the sources' (`research/ffx2-gippal-den-of-woe.md` §2 and §8, `[verified: 3 sources]` for the solo duels and `[wiki, single source]` for the name "Yuna's Ballad"; the scan texts, paraphrased: each girl
 * is held by Shuyin's despair and takes Yuna for a guard with a gun at her head): Yuna alone against Rikku, then Paine; the two are freed and rejoin her; the three shades of the Den are still to come.
 *
 * 1. **pre**: the sealed cave, two figures who do not see her, Yuna's two lines; then the battle.
 * 2. **one seam** (a mid-battle script that plays at a link's fall: Rikku's), hands off, 15 seconds at the worst (`scriptDurationMs` reads 14.95 s: the typewriter time plus the `auto` holds, which alone sum to 8.8 s, plus a flash): Rikku is released, the pyreflies move on to Paine.
 * 3. **two mid-battle callouts** (each a short interrupt): Rikku's first Grenade and Paine's first Attack.
 * 4. **post**: the tally first, then Paine's one sincere exchange, the joke returning, and the Den still ahead (the three shades are the Den of Woe's own chapter).
 *
 * **Speakers.** Yuna, and Rikku and Paine once they are themselves again, with their approved FFX-2 portraits; the narration is a stage direction in the box with no name plate (`'none'`).
 * **Music** (rule 13: nothing new, existing cues): the field bed is `scene-bevelle-underground`, the Den's, and each duel is the formation's cue (`data/ffx2/enemies/yunas-ballad.ts`, `boss-den-of-woe`). Bailey's call by ear.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, flash, music, narrate, results, say, wait } from '../dsl.ts';
import { BALLAD_SEAM_RIKKU, X2_POSSESSED_PAINE_ID, X2_POSSESSED_RIKKU_ID } from '../../data/yunas-ballad-ids.ts';
import { POSSESSED_PAINE_ATTACK_ID, POSSESSED_RIKKU_GRENADE_ID } from '../../data/ffx2/enemies/yunas-ballad-abilities.ts';

/** The callouts' ids (each is its script's name). */
export const BALLAD_FIRST_GRENADE = 'first-grenade';
export const BALLAD_FIRST_BLADE = 'first-blade';

// --------------------------------------------------------------------------- pre

const PRE: StoryScript = [
  music('scene-bevelle-underground', 1400),
  camera('reveal', 0),
  narrate('The sealed cave under the ravine. The pyreflies here are thick, and they are not at peace.'), // ours: the Den (sourced: a pyrefly-filled cave)
  narrate('Rikku and Paine wait between the lights. They do not see Yuna. They see someone with a gun.'), // ours: the scans, paraphrased
  fade('clear', 1100),
  camera('idle', 900),
  beat(700),
  say('yuna-x2', 'Rikku. Paine. It is me.'), // ours
  say('yuna-x2', 'I will not run, and I will not give up on you.'), // ours: Yuna's resolve (the "Ballad")
  battleStart(),
];

// --------------------------------------------------------------------------- the seam

/** The seam from the first duel to the second: Rikku's fall. Hands off; every `say` carries its own `auto`. About 10 seconds. */
const SEAM_RIKKU: StoryScript = [
  say('none', 'Rikku drops her pack and goes still. The pyreflies leave her like breath.', { auto: 2100 }), // ours: she falls
  flash(200, '#9fd8ff'),
  say('yuna-x2', 'Rikku? Rikku, stay with me.', { auto: 1500 }), // ours
  say('none', 'The lights do not stop. They only move on, to the one behind her.', { auto: 2000 }), // ours: five fights without a break
  say('none', 'Paine lifts her sword. She is still looking at someone else.', { auto: 1900 }), // ours
  say('yuna-x2', 'One more. Hold on, Paine.', { auto: 1300 }), // ours
];

// --------------------------------------------------------------------------- mid

const MID: MidBattleTrigger[] = [
  { id: BALLAD_FIRST_GRENADE, when: { type: 'ability-used', who: X2_POSSESSED_RIKKU_ID, ability: POSSESSED_RIKKU_GRENADE_ID }, once: true, script: BALLAD_FIRST_GRENADE },
  { id: BALLAD_SEAM_RIKKU, when: { type: 'ko', who: X2_POSSESSED_RIKKU_ID }, once: true, script: BALLAD_SEAM_RIKKU },
  { id: BALLAD_FIRST_BLADE, when: { type: 'ability-used', who: X2_POSSESSED_PAINE_ID, ability: POSSESSED_PAINE_ATTACK_ID }, once: true, script: BALLAD_FIRST_BLADE },
];

const MID_SCRIPTS: Record<string, StoryScript> = {
  [BALLAD_SEAM_RIKKU]: SEAM_RIKKU,
  // Rikku's first Grenade: she throws what she carries, at someone who is not here.
  [BALLAD_FIRST_GRENADE]: [say('yuna-x2', 'Grenades. She is throwing at someone else.', { auto: 1700 })],
  // Paine's first Attack: a slow blade, and a guard that holds.
  [BALLAD_FIRST_BLADE]: [say('yuna-x2', 'A slow blade, and a guard that holds.', { auto: 1700 })],
};

// --------------------------------------------------------------------------- post

const POST: StoryScript = [
  results(), // the tally first, as every chapter does
  // `showResults()` starts the victory fanfare on its own and it replaces the bed this scene opened with: the field bed is put back as the scene resumes past the tally (the Den's FOC45-01 note).
  music('scene-bevelle-underground', 900),
  say('none', 'Paine\'s sword falls from her hand. The light goes out of her eyes.', { auto: 2000 }), // ours: she falls
  say('paine', '...What did I do?', { auto: 1500 }), // ours: the one sincere beat begins (writing bible §2.2: at most three lines in a row)
  say('yuna-x2', 'Nothing you meant. It is over.', { auto: 1600 }), // ours
  say('paine', 'Then why is it not quiet?', { auto: 1600 }), // ours
  beat(700),
  say('rikku-x2', 'Ow. Why does my everything hurt?', { auto: 1700 }), // ours: the joke returns
  say('none', 'Deeper in the cave, three more lights are waking.', { auto: 2000 }), // ours: the three shades are the Den of Woe's own chapter
  wait(900),
];

/** The chapter's story layer: the cave, one seam, two callouts, and the close. */
export const ffx2YunasBalladScripts: ChapterScripts = {
  pre: PRE,
  post: POST,
  victoryQuips: {},
  mid: MID,
  midScripts: MID_SCRIPTS,
};

export default ffx2YunasBalladScripts;
