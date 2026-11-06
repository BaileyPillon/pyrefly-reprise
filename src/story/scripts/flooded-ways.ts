/**
 * The hidden Flooded Ways chapter (FFX; Evrae Altana in the flooded tunnels of the Via Purifico, then Geosgaeno in the Baaj Temple): the scene before the first fight, one seam between the two places, three short
 * callouts and the scene after the last. **Game case: FFX only** [AGENTS.md rule 14]. Both fights are FFX's, and the party is the three who can swim.
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (pick GV1 of `docs/plans/ch-geosgaeno-review.md`; the Gippal GP15, Spectral Keeper SK11 and Dark Aeons DA13 precedent): nothing here ships to a listed chapter, and the chapter itself is
 * hidden behind the typed word `geosgaeno`. The beats are the research's and the guides' (`research/re-ffx-geosgaeno-evrae-altana.md` 2 and 4: where each is found, what it does, what the water does to a Petrify); the two
 * monsters speak no word. **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Tidus asking what he does not know (1.1), Wakka warm and plain with his
 * "ya" (1.5), Rikku fast and self-correcting (1.8).
 *
 * ## Wiring
 *
 * - `pre` is eight lines, over the Via Purifico's plate; `post` six. One **seam** (a mid-battle script that plays at Evrae Altana's fall, whichever area it falls in, and hands off: two short lines, a white-out, the next place) and
 *   three **callouts** (a foe's first Stone Gaze, its Swallow, a lock opened; one line each, naming the answer without naming the button). This chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the
 *   listed chapters); `tests/unit/chapters/flooded-ways-story.test.ts` audits the lint, the sizes, the voices and the trigger-to-script agreement.
 * - Music: the chapter's scenes are silent beds (`music(null)`); the fights' cue is the formations' (`battle-ffx`, a stand-in).
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, SpeakerFallback, SpeakerId, StoryScript } from '../dsl.ts';
import { backdrop, battleStart, beat, camera, fade, flash, fx, hideActor, music, narrate, results, say, shake, wait } from '../dsl.ts';

/** The foes' ids (mirrored from `src/data/ffx/flooded-ways-ids.ts`: the story layer does not reach into the data layer). */
const FOE = { evrae: 'evrae-altana', lock2: 'gate-lock-2', geosgaeno: 'geosgaeno' } as const;

/** The seams' and callouts' ids (the engine's `script-trigger` name is the id). */
export const FLOODED_SEAMS = { evrae: 'evrae-falls' } as const;
export const FLOODED_CALLOUTS = { gaze: 'altana-gaze', lock: 'lock-opened', swallow: 'geosgaeno-swallows' } as const;

const FALLBACK: SpeakerFallback[] = [{ who: 'tidus' }, { who: 'wakka' }, { who: 'rikku' }];
const PLATE = 'via-purifico';

/** A seam: the fallen foe goes with the light, two short lines, a white-out, the next place. Hands off: every line carries its own `auto`. */
function seam(foe: string, one: [SpeakerId, string], two: [SpeakerId, string], next: string): StoryScript {
  return [
    music(null, 900),
    camera('idle', 700),
    fx('pyreflies-rising', foe),
    hideActor(foe, 700), // the foe goes with the light
    wait(900),
    say(one[0], one[1], { auto: 2000, fallback: FALLBACK }),
    say(two[0], two[1], { auto: 2000, fallback: FALLBACK }),
    fade('white', 2400),
    narrate(next, 2400),
    flash(1000, '#ffffff'),
    wait(600),
  ];
}

/** A callout: one line, the answer named without the button. */
const callout = (who: SpeakerId, text: string): StoryScript => [say(who, text, { auto: 2200, fallback: FALLBACK })];

export const floodedWaysScripts: ChapterScripts = {
  pre: [
    backdrop(PLATE, 0),
    music(null, 900),
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    narrate('Under Bevelle, the flooded tunnels of the Via Purifico. Only three of them can swim.', 3200), // 1
    say('tidus', 'Water to the ceiling. Where does this even lead?'), // 2
    say('rikku', 'Okay okay okay: we find the gate locks, we open them, we keep swimming!'), // 3
    say('wakka', 'You make it sound easy, ya.'), // 4
    say('rikku', 'Eep! Something is moving down there. Something big. And, um, dead.'), // 5
    say('tidus', 'Dead things I can hit.'), // 6
    say('wakka', "Don't let it look at you, brudda. Stone and water do not mix, ya."), // 7
    beat(1200),
    say('rikku', 'It breaks. Whoever it catches just breaks. So nobody gets caught!'), // 8
    shake(6, 600),
    battleStart(),
  ],

  post: [
    music(null, 900),
    backdrop(PLATE, 0),
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('tidus', 'Two down. Neither one was fair.'), // 1
    say('wakka', "Fair's for blitzball, ya."), // 2
    beat(1400),
    say('rikku', 'Tidus, you went all quiet in there. Were you scared? Be honest!'), // 3
    say('tidus', 'A bit. It had me for a whole turn and I still do not know how I got out.'), // 4
    say('wakka', 'You hit it from the inside, brudda. That is how.'), // 5
    say('rikku', 'Okay okay okay: next time we bring a bigger plan!'), // 6
    results(),
  ],

  victoryQuips: {},

  mid: [
    { id: FLOODED_CALLOUTS.gaze, when: { type: 'ability-used', who: FOE.evrae, ability: 'evrae-altana-stone-gaze' }, once: true, script: FLOODED_CALLOUTS.gaze },
    { id: FLOODED_CALLOUTS.lock, when: { type: 'ko', who: FOE.lock2 }, once: true, script: FLOODED_CALLOUTS.lock },
    { id: FLOODED_SEAMS.evrae, when: { type: 'ko', who: FOE.evrae }, once: true, script: FLOODED_SEAMS.evrae },
    { id: FLOODED_CALLOUTS.swallow, when: { type: 'ability-used', who: FOE.geosgaeno, ability: 'geosgaeno-swallow' }, once: true, script: FLOODED_CALLOUTS.swallow },
  ] satisfies MidBattleTrigger[],

  midScripts: {
    [FLOODED_SEAMS.evrae]: seam(FOE.evrae, ['tidus', 'It was already dead. It just would not lie down.'], ['wakka', 'Next stop is a temple under the sea, ya.'], 'The Baaj Temple, deep under the water.'),
    [FLOODED_CALLOUTS.gaze]: callout('wakka', 'Its eyes, brudda! Whoever it looks at turns to stone!'),
    [FLOODED_CALLOUTS.lock]: callout('rikku', 'A gate gives! Open the other and the water carries us on!'),
    [FLOODED_CALLOUTS.swallow]: callout('rikku', 'It swallowed one of us! Strike it from the inside, or brace for the spit!'),
  },
};

export default floodedWaysScripts;
