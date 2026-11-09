/**
 * The hidden Shinryu chapter (FFX; the Monster Arena's deep-water dragon): the scene before the fight, one callout at the first Eraser and the scene after it. **Game case: FFX only** [AGENTS.md rule 14]. Shinryu is a creature of
 * the FFX Monster Arena, and the party is the three who can swim.
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (preflight section 7, the Flooded Ways' GV1 and the Keeper's SK11 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `shinryu`.
 * The beats are the research's and the guides': the three swimmers dive with the best weapons they have (Jegged: only Tidus, Wakka and Rikku can fight underwater), the dragon answers every blow it feels
 * (`research/re-ffx-shinryu.md` 2) and one turn in three turns a swimmer to stone, which the water breaks (RE 0). The monster speaks no word. **Every line is ours** and quotes nothing of the game's script
 * [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Tidus asking what he does not know (1.1), Wakka warm and plain with his "ya" (1.5), Rikku fast and self-correcting (1.8).
 *
 * ## Wiring
 *
 * `pre` is seven lines over the stage's plate, `post` five, plus one **callout** (the first Eraser: one line, naming the answer without naming the button). This chapter is NOT in `../registry.ts` (its tests pin that the
 * registry's keys are the listed chapters); `tests/unit/chapters/shinryu-story.test.ts` audits the lint, the sizes, the voices and the trigger-to-script agreement. Music: the scenes are silent beds; the fight's cue is the
 * formation's (`boss-challenge`, a stand-in: rule 13).
 *
 * **The post scene is count-free on purpose (review of 2026-11-08, MAJOR 2).** About one win in three has a swimmer the Eraser shattered, and a static scene cannot know: the post scene plays on its own `CutsceneScreen` with its own
 * runner, so a chapter flag the callout sets (`setFlag`) is not there to read (`BattleScreenCutscenes.ts` resets only its own runner), and no battle outcome reaches the screen. The lines are therefore true for one, two or three
 * swimmers; `shinryu-story.test.ts` pins that they name no count. The alternative, a flag-branched scene, needs the flow to hand the battle's roster to the post screen (a shared-plumbing change for one chapter: not built).
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, SpeakerFallback, StoryScript } from '../dsl.ts';
import { backdrop, battleStart, beat, camera, fade, music, narrate, results, say, shake, wait } from '../dsl.ts';

/** The foe's id and the Eraser row (mirrored from `src/data/ffx/shinryu-ids.ts`: the story layer does not reach into the data layer). */
const FOE = { shinryu: 'shinryu', eraser: 'shinryu-eraser' } as const;

/** The callout's id (the engine's `script-trigger` name is the id). */
export const SHINRYU_CALLOUTS = { eraser: 'shinryu-eraser' } as const;

const FALLBACK: SpeakerFallback[] = [{ who: 'tidus' }, { who: 'wakka' }, { who: 'rikku' }];
/** The plate the scenes sit on: the submerged Via Purifico (a stand-in for the game's sea stage). */
const PLATE = 'via-purifico-flooded-3';

/** A callout: one line, the answer named without the button. */
const callout = (who: 'tidus' | 'wakka' | 'rikku', text: string): StoryScript => [say(who, text, { auto: 2200, fallback: FALLBACK })];

export const shinryuScripts: ChapterScripts = {
  pre: [
    backdrop(PLATE, 0),
    music(null, 900),
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    narrate('Far below the surface, the arena keeps its oldest dragon. Only three of them can swim.', 3200), // 1
    say('tidus', 'That is the biggest thing I have ever seen, and I have seen Sin.'), // 2
    say('wakka', "Easy, brudda. Hit it hard and hit it first, ya. That's the whole plan."), // 3
    say('rikku', 'Okay okay okay: the whole plan is also very short. Good!'), // 4
    say('wakka', 'It strikes back at whatever hurts it. Keep your heads up, brudda.'), // 5
    say('rikku', 'Okay okay okay: if it points at you, you turn to stone. The water breaks stone!'), // 6
    beat(1200),
    say('tidus', 'Then we are quick about it. All of us.'), // 7
    shake(6, 600),
    camera('action', 700),
    battleStart(),
  ],

  post: [
    music(null, 900),
    backdrop(PLATE, 0),
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('tidus', 'It is gone. The water has gone quiet.'), // 1
    say('wakka', 'You swung true, brudda. Anyone the water broke, we carry up, ya.'), // 2
    beat(1400),
    say('rikku', 'Okay okay okay: is everybody still here? Count off!'), // 3
    say('tidus', 'However many answer, we all go up together.'), // 4
    say('wakka', 'Up we go, ya.'), // 5
    results(),
  ],

  victoryQuips: {},

  mid: [
    { id: SHINRYU_CALLOUTS.eraser, when: { type: 'ability-used', who: FOE.shinryu, ability: FOE.eraser }, once: true, script: SHINRYU_CALLOUTS.eraser },
  ] satisfies MidBattleTrigger[],

  midScripts: {
    [SHINRYU_CALLOUTS.eraser]: callout('wakka', 'It points! Whoever it picks, the water breaks! Finish it, quick, ya!'),
  },
};

export default shinryuScripts;
