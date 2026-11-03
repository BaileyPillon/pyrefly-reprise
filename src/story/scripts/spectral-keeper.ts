/**
 * The hidden Spectral Keeper chapter (FFX; Zanarkand Dome, the door before Yunalesca): the scene before the fight and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (preflight SK11; the Gippal GP15 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `keeper`. The beats are the research's, and only
 * those: the party reaches the Keeper after the Chamber of the Fayth, "immediately following the Spectral Keeper" is the build point of Chapter II (`src/data/ffx/builds/zanarkand.ts`), and the Keeper stands at the bottom of the
 * Cloister lift (`research/ffx-yunalesca.md` section 1, `[single source]`, now agreed by `research/re-ffx-spectral-keeper.md`); the game's own scripts give the Keeper no line and no cutscene text is read from the files
 * (`research/re-ffx-spectral-keeper.md` section 9), so **the Keeper speaks no word**. **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Auron laconic and
 * dry (section 1.4), Lulu dry (1.6), Wakka warm and plain with his "ya" (1.5), Tidus asking what he does not know (1.1), Yuna complete and unhurried (1.3), Kimahri in the third person, three to eight words, **once** (1.7).
 *
 * `pre` is eleven lines, `post` six; no mid-battle scripts and no victory quips (the fight is a gate, and the next room is Yunalesca's). The lines teach the fight in the party's voice without a tutorial: *do not stand where it is
 * looking*, *the marks on the floor are not decoration* (the sweep zone and the mines).
 *
 * Like the Experiment's and Sinspawn Gui's, this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/spectral-keeper-story.test.ts` audits the lint and the
 * line counts.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, say, wait } from '../dsl.ts';

export const spectralKeeperScripts: ChapterScripts = {
  pre: [
    // --- The foot of the lift ------------------------------------------------------------
    music('scene-zanarkand-dome', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    say('lulu', 'The lift ends here. Nothing below it is on any map.'), // 1
    say('wakka', "Somethin' is breathin' down there, ya?"), // 2
    say('tidus', "Big, whatever it is. And it knows we're here."), // 3
    say('auron', 'Something was set here to keep a door.'), // 4
    say('auron', 'It does not tire. It does not forget.'), // 5
    beat(1200),
    say('yuna', 'Then we do not stand where it is looking.'), // 6
    say('lulu', 'And we watch the floor. Those marks are not decoration.'), // 7
    say('tidus', 'So we keep moving. I can do that.'), // 8
    say('rikku', 'Moving. Okay. Moving is my whole thing!'), // 9
    beat(1400),
    say('kimahri', 'Kimahri stands behind the marks.'), // 10
    say('auron', 'Then fight.'), // 11
    music('boss-challenge', 900), // a stand-in cue: Yunalesca's (preflight SK10; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After the Keeper ----------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    say('tidus', 'It just stopped. Like it was waiting to be told.'), // 1
    say('auron', 'It was only ever a door.'), // 2
    say('lulu', 'And we have opened it.'), // 3
    say('yuna', 'Then there is one room left.'), // 4
    beat(1600),
    say('wakka', "Ya. Let's not keep her waitin'."), // 5
    say('auron', 'Keep walking.'), // 6
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default spectralKeeperScripts;
