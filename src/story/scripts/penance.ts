/**
 * The hidden Penance chapter (FFX; the Fahrenheit's deck): the scene before the fight and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (preflight, the Keeper's SK11 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `judgment`. The beats are the research's, and
 * only those: Penance is a colossus with two hands that grow back (`research/re-ffx-penance.md`); the game's own scripts give it no line and no cutscene text is read from the files, so **Penance speaks no word**.
 * **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Auron laconic and dry (section 1.4), Lulu dry (1.6), Wakka warm and plain with his "ya" (1.5),
 * Tidus asking what he does not know (1.1), Yuna complete and unhurried (1.3), Kimahri in the third person, three to eight words, **once** (1.7).
 *
 * `pre` is eleven lines, `post` six; no mid-battle scripts and no victory quips. The lines teach the fight in the party's voice without a tutorial: *a hand that falls comes back*, *never let both stand at once*, *cure
 * what it breaks before it strikes again*.
 *
 * Like the Keeper's, this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/penance-story.test.ts` audits the lint and the line counts.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, say, wait } from '../dsl.ts';

export const penanceScripts: ChapterScripts = {
  pre: [
    // --- The deck ---------------------------------------------------------------------------
    music('scene-fahrenheit', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    say('tidus', 'Okay. That is bigger than anything we have fought.'), // 1
    say('wakka', "It's got hands, ya? Two of 'em, floatin' on their own."), // 2
    say('lulu', 'They are part of it. They are only slower to die.'), // 3
    say('auron', 'Cut a hand down and it grows back.'), // 4
    say('auron', 'Let both stand when it turns, and it ends us.'), // 5
    beat(1200),
    say('yuna', 'Then one hand always stays down.'), // 6
    say('tidus', 'One hand down. Got it. And the big one?'), // 7
    say('auron', 'It breaks what it touches. Mend the breaking.'), // 8
    say('rikku', 'Mend, hit the hands, do not die. Easy!'), // 9
    beat(1400),
    say('kimahri', 'Kimahri holds the deck.'), // 10
    say('auron', 'Then fight.'), // 11
    music('boss-challenge', 900), // a stand-in cue (preflight P8; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After Penance -----------------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    say('tidus', 'It stopped. The hands, too.'), // 1
    say('auron', 'It held its post as long as it was asked.'), // 2
    say('lulu', 'And now it is only stone.'), // 3
    say('yuna', 'Thank you. You can rest.'), // 4
    beat(1600),
    say('wakka', "Ya. We did good, all of us."), // 5
    say('auron', 'Keep walking.'), // 6
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default penanceScripts;
