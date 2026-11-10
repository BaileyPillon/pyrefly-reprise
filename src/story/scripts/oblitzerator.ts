/**
 * The hidden Oblitzerator chapter (FFX; the Number 4 Dock at Luca): the scene before the fight, six short banners in it and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (preflight OB5's sibling, the Keeper's SK11 and the Spherimorph's SP6 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word
 * `blitz`. The beats are the research's, and only those: the party stands on the dock with Yuna taken, a blitzball machine ahead and a dock crane to the right; Tidus points the crane out on his first turn; the crane answers
 * Thunder twice and wakes on the third; Use crane before that does nothing and says so (`research/re-ffx-oblitzerator-crane.md` 2 and 4.5). The game's own lines are battle dialogue the files hold and the note paraphrases
 * (the crane "seems to respond", "we can use this crane", "it's probably out of power", "use that Thunder spell on it"): **every line here is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. The machine
 * and the crane speak no word. Voices from `research/writing-bible.md`: Tidus asking what he does not know (1.1), Lulu dry and complete (1.6), Kimahri's three-to-eight words, third person, concrete nouns (1.7).
 *
 * `pre` is nine lines (one narration and eight spoken), `post` five. The six **banners** are mid-battle callouts the AI raises (`battle/ffx/ai/oblitzerator.ts` and `luca-crane.ts`, the `script-trigger` names of
 * `data/ffx/oblitzerator-ids.ts` `OBLITZERATOR_CALLOUTS`; a test pins the pair): Tidus's first turn, the crane's two answers, its waking, Use crane before it wakes, and the machine lifted. This chapter is NOT in
 * `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/oblitzerator-story.test.ts` audits the lint, the line counts and the trigger-to-script agreement.
 */

import type { ChapterScripts, SpeakerFallback, SpeakerId, StoryScript } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, narrate, results, say, wait } from '../dsl.ts';

/** The callouts' names (mirrored from `src/data/ffx/oblitzerator-ids.ts`: the story layer does not reach into the data layer). */
export const OBLITZERATOR_STORY_CALLOUTS = {
  point: 'oblitzerator-point',
  responds1: 'oblitzerator-responds-1',
  responds2: 'oblitzerator-responds-2',
  powered: 'oblitzerator-powered',
  noPower: 'oblitzerator-no-power',
  lifted: 'oblitzerator-lifted',
} as const;

const FALLBACK: SpeakerFallback[] = [{ who: 'tidus' }, { who: 'lulu' }, { who: 'kimahri' }];

/** A banner: one line. */
const callout = (who: SpeakerId, text: string): StoryScript => [say(who, text, { auto: 2400, fallback: FALLBACK })];

export const oblitzeratorScripts: ChapterScripts = {
  pre: [
    // --- The dock -----------------------------------------------------------------------------
    music('scene-gagazet', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    narrate('The Number 4 Dock, Luca. Yuna is gone, and a blitzball machine stands where the boats come in.', 3400), // 1
    say('tidus', 'That is a blitzball machine. Why is it aiming at us?'), // 2
    say('lulu', 'It does not need a reason. It needs a target.'), // 3
    say('kimahri', 'Crane. Cables run to it.'), // 4
    say('tidus', 'The crane? What about the crane?'), // 5
    say('kimahri', 'Crane has no power.'), // 6
    beat(900),
    say('lulu', 'Then find out what it will take. We cannot out-throw that machine.'), // 7
    say('tidus', 'Right. Yuna is out there. We are not standing here all day.'), // 8
    say('lulu', 'Then do not stand. Move.'), // 9
    music('battle-ffx', 900), // a stand-in cue (preflight OB9; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After the machine ----------------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    say('tidus', 'That is one way to stop a blitzball machine.'), // 1
    say('lulu', 'The crane did the work. You only had to ask it.'), // 2
    beat(1200),
    say('kimahri', 'Kimahri follows. Yuna is that way.'), // 3
    say('tidus', 'Then let us go. And somebody turn that crane off.'), // 4
    say('lulu', 'Nobody touches it. It has done enough.'), // 5
  ],

  victoryQuips: {},

  // The banners are raised by the AI (`script-trigger` events), not by a trigger on a state change, so `mid` is empty.
  mid: [],

  midScripts: {
    [OBLITZERATOR_STORY_CALLOUTS.point]: callout('tidus', 'Hey, that crane runs right to the machine. Can we use it?'),
    [OBLITZERATOR_STORY_CALLOUTS.responds1]: callout('tidus', 'Did the crane just twitch?'),
    [OBLITZERATOR_STORY_CALLOUTS.responds2]: callout('lulu', 'It answers Thunder. Again.'),
    [OBLITZERATOR_STORY_CALLOUTS.powered]: callout('lulu', 'It has power now. Tidus, it is yours to use.'),
    [OBLITZERATOR_STORY_CALLOUTS.noPower]: callout('lulu', 'It is still dark. Try Thunder on it first.'),
    [OBLITZERATOR_STORY_CALLOUTS.lifted]: callout('tidus', 'It is lifting it! Hit it while it hangs!'),
  },
};

export default oblitzeratorScripts;
