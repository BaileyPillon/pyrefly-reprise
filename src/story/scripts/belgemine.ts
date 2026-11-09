/**
 * The hidden Belgemine's Challenge chapter (FFX; the Remiem Temple): the scene before the first duel and the scene after the last. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (the Keeper's SK11 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `sidequest`. The beats are the research's, and only those:
 * Belgemine calls her aeons one by one, Yuna answers each with one of hers, the aeon an enemy holds cannot be called, and every aeon has a habit worth learning (`research/re-ffx-belgemine-aeon-duels.md` section 3). The game's own
 * scripts give the duels one scene line each and no cutscene text is read from the files, so **Belgemine's words are reported, never spoken in a box**: `SpeakerId` (`../dsl.ts`) has no Belgemine and a new speaker is a portrait and a
 * name plate the chapter does not ask for, so she is heard through Tidus's retrospective narration (writing bible 1.2: past tense, short). **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8].
 * Voices from `research/writing-bible.md`: Yuna complete and unhurried (1.3), Auron laconic and dry (1.4), Wakka warm and plain with his "ya" (1.5), Lulu dry (1.6). **Kimahri is not in the scene** (a duel has Yuna alone).
 *
 * `pre` is nine lines, `post` six; no mid-battle scripts and no victory quips (the next place is the road, writing bible 5.4). The lines teach the chapter without a tutorial: *you cannot call the aeon she holds*, *each of hers has a
 * habit*, *shield before the great blows*. The "send her" ending of the game is a closing line and not a mechanic (BD10).
 *
 * Like the Keeper's and Penance's, this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/belgemine-story.test.ts` audits the lint and the line counts.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, narrate, results, say, wait } from '../dsl.ts';

export const belgemineScripts: ChapterScripts = {
  pre: [
    // --- The court of the temple -------------------------------------------------------------
    music('scene-macalania-temple', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    narrate('Belgemine was waiting in the court at Remiem, as she had waited at every road the pilgrimage crossed.'), // 1
    say('lulu', 'She followed us all this way. Why keep this place for last?'), // 2
    narrate('She told Yuna to call her aeons, and that she would call hers, one at a time, until one of them was done.'), // 3
    say('yuna', 'Then I will answer each of them. One at a time.'), // 4
    say('wakka', "Ya, she calls and you call back. That's all there is to it."), // 5
    say('auron', 'Not quite. You cannot call the aeon she holds. It will not come.'), // 6
    beat(1200),
    say('lulu', 'Watch each of hers. Every one has a habit.'), // 7
    say('yuna', 'The first is Valefor. Let us begin.'), // 8
    say('auron', 'Shield before the great blows.'), // 9
    music('boss-isaaru', 900), // a stand-in cue (BD8; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After the last duel -----------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    narrate('The last of her aeons bowed to the light, and the temple was quiet. Belgemine laughed, the way she always had.'), // 1
    say('lulu', 'That was all eight.'), // 2
    say('yuna', 'She wanted to be seen at her best. And she was.'), // 3
    beat(1600),
    narrate('She asked to be sent, then. Yuna did not make her ask twice.'), // 4
    say('auron', 'Let her rest.'), // 5
    say('wakka', "Ya. We'll remember her."), // 6
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default belgemineScripts;
