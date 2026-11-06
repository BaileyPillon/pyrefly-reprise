/**
 * The hidden Sanctuary Keeper chapter (FFX; Mt. Gagazet, the summit): the scene before the fight and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (preflight, the Keeper's SK11 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `beast`. The beats are the research's, and
 * only those: the beast heals itself, sweeps with its tail when it is struck enough, breathes hard, and keeps the last road up the mountain (`research/re-ffx-sanctuary-keeper.md`); the game's own scripts give it no line and no
 * cutscene text is read from the files, so **the Keeper speaks no word**. **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Auron laconic and dry
 * (section 1.4), Lulu dry (1.6), Wakka warm and plain with his "ya" (1.5), Tidus asking what he does not know (1.1), Yuna complete and unhurried (1.3), Kimahri in the third person, three to eight words, **once** (1.7).
 *
 * `pre` is eleven lines, `post` six; no mid-battle scripts and no victory quips. The lines teach the fight in the party's voice without a tutorial: *do not trade blows, take its mending from it* (Reflect, Poison), *shield
 * before the breath* (Shell), *the tail takes your haste* (Hastega again).
 *
 * Like the Keeper's and Penance's, this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/sanctuary-keeper-story.test.ts` audits the lint and the line counts.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, say, wait } from '../dsl.ts';

export const sanctuaryKeeperScripts: ChapterScripts = {
  pre: [
    // --- The summit -------------------------------------------------------------------------
    music('scene-gagazet', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    say('tidus', 'Is that the last thing on this mountain?'), // 1
    say('auron', 'It keeps the road to the ruins. It will not step aside.'), // 2
    say('wakka', "It's lookin' at us, ya. Like it's been waitin'."), // 3
    say('lulu', 'Do not trade blows with it. It mends faster than we wound.'), // 4
    say('auron', 'Then take the mending from it.'), // 5
    beat(1200),
    say('yuna', 'A Reflect on it, and the light it casts on itself comes to us.'), // 6
    say('tidus', 'And keep it poisoned. What about the breath?'), // 7
    say('lulu', 'Shell, before it breathes. Not after.'), // 8
    say('auron', 'When it lashes its tail, it takes your haste with it.'), // 9
    beat(1400),
    say('kimahri', 'Kimahri watches the tail.'), // 10
    say('auron', 'Then fight.'), // 11
    music('boss-seymour', 900), // a stand-in cue (preflight SK9; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After the Keeper --------------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    say('tidus', 'It is not getting up, is it.'), // 1
    say('auron', 'No. The road is open.'), // 2
    say('lulu', 'The wind has changed. Can you feel it?'), // 3
    say('yuna', 'The ruins are just beyond. We are close.'), // 4
    beat(1600),
    say('wakka', "Ya. Let's go, then, before I think about it."), // 5
    say('auron', 'Keep walking.'), // 6
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default sanctuaryKeeperScripts;
