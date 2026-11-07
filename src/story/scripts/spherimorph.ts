/**
 * The hidden Spherimorph chapter (FFX; the spring in the Macalania Woods): the scene before the fight, two short banners in it and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (preflight SP6, the Keepers' SK11 and the Dark Aeons' DA13 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word
 * `spherimorph`. The beats are the research's, and only those: the guardian takes hurt from one element and drinks the rest, a plain blow is answered with a spell that shows which, the right element changes it
 * (`research/re-ffx-spherimorph.md` 4; the springs of the Woods are pyrefly-lit, `research/ffx-vs-ffx2-presentation.md` section 8); the game gives it no line and no cutscene text is read from the files, so
 * **Spherimorph speaks no word**. **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Tidus asking what he does not know (1.1), Yuna complete and
 * unhurried (1.3), Auron laconic and dry (1.4), Wakka warm and plain with his "ya" (1.5), Lulu dry (1.6).
 *
 * `pre` is eleven lines (one narration and ten spoken), `post` six. The two **banners** are mid-battle callouts the AI raises (`battle/ffx/ai/spherimorph.ts`, the `script-trigger` names of
 * `data/ffx/spherimorph-ids.ts` `SPHERIMORPH_CALLOUTS`; a test pins the pair): the first the first time an elemental spell is taken in with Lulu in the front line, the second the next time. They are the game's
 * one opening line and two banners in our words (SP6); the pre scene's Lulu line is the game's opening line. This chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters);
 * `tests/unit/chapters/spherimorph-story.test.ts` audits the lint, the line counts and the trigger-to-script agreement.
 */

import type { ChapterScripts, SpeakerFallback, SpeakerId, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, narrate, results, say, wait } from '../dsl.ts';

/** The callouts' names (mirrored from `src/data/ffx/spherimorph-ids.ts`: the story layer does not reach into the data layer). */
export const SPHERIMORPH_STORY_CALLOUTS = { first: 'spherimorph-hint-first', second: 'spherimorph-hint-second' } as const;

const FALLBACK: SpeakerFallback[] = [{ who: 'tidus' }, { who: 'yuna' }, { who: 'lulu' }];

/** A banner: one line, the answer named without the button. */
const callout = (who: SpeakerId, text: string): StoryScript => [say(who, text, { auto: 2400, fallback: FALLBACK })];

export const spherimorphScripts: ChapterScripts = {
  pre: [
    // --- The spring -------------------------------------------------------------------------
    music('scene-macalania-temple', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    narrate('The spring in the Macalania Woods. The road to the temple runs straight through it.', 3200), // 1
    say('tidus', 'It is not moving. Is it going to let us pass?'), // 2
    say('yuna', 'It watches over the spring. Be gentle with the water, if you can.'), // 3
    say('wakka', "Gentle with a big floating ball, ya? I'll do my best."), // 4
    say('lulu', 'It takes hurt from one element only, and it drinks the rest.'), // 5
    say('tidus', 'Which one?'), // 6
    beat(900),
    say('lulu', 'That is for you to find out. Strike it plain, and see what answers.'), // 7
    say('auron', 'Then do not waste the spells.'), // 8
    say('yuna', 'We will stand behind you, Tidus.'), // 9
    say('tidus', 'Great. So I am the test.'), // 10
    say('auron', 'Go.'), // 11
    music('boss-challenge', 900), // a stand-in cue (preflight SP9; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After the guardian -------------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    say('tidus', 'It is quiet. The spring, I mean.'), // 1
    say('yuna', 'The pyreflies are drifting back to the water.'), // 2
    say('lulu', 'One element at a time, and it never stayed the same twice.'), // 3
    beat(1400),
    say('wakka', 'I swear it changed its mind every time I blinked, ya.'), // 4
    say('auron', 'The temple is still ahead.'), // 5
    say('yuna', 'Then let us go on.'), // 6
  ],

  victoryQuips: {},

  // The banners are raised by the AI (`script-trigger` events), not by a trigger on a state change, so `mid` is empty.
  mid: [],

  midScripts: {
    [SPHERIMORPH_STORY_CALLOUTS.first]: callout('lulu', 'It drank that, and healed. Read what answers: the element it fears is the opposite of the spell that came back.'),
    [SPHERIMORPH_STORY_CALLOUTS.second]: callout('yuna', 'And when we strike it true, it changes. Hit it, then ask it again.'),
  },
};

export default spherimorphScripts;
