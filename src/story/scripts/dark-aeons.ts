/**
 * The hidden Dark Aeons chapter (FFX; Dark Valefor on the road to Besaid, Dark Ifrit by the ruins of Home, Dark Ixion twice on the Thunder Plains, Dark Shiva on the road to Macalania, Dark Anima at the foot of Gagazet, Dark
 * Bahamut in the Beyond): the scene before the first fight, six seams between the stops, seven short callouts and the scene after the last. **Game case: FFX only** [AGENTS.md rule 14]. The Dark Aeons are FFX's
 * (International and HD releases).
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (pick DA13 of `docs/plans/ch-dark-aeons-review.md`; the Gippal GP15 and Spectral Keeper SK11 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the
 * typed word `darkaeon`. The beats are the research's and the guides' (`research/re-ffx-dark-aeons-six.md` 2.4 and 9: where each is found, what it does; Yevon's acolytes call the Dark Aeons up, as they did the Dark Magus
 * Sisters and Dark Yojimbo in Chapter XXVII); **the acolytes are never named and the Dark Aeons speak no word** (the files give them none). **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8].
 * Voices from `research/writing-bible.md`: Tidus asking what he does not know (1.1), Yuna complete and unhurried (1.3), Auron laconic and dry (1.4), Wakka warm and plain with his "ya" (1.5), Lulu dry (1.6).
 *
 * ## Wiring
 *
 * - `pre` is nine lines, over the airship's deck; `post` six, in the Beyond. Six **seams** (a mid-battle script that plays at a link's fall, hands off, about 10 seconds each: the foe goes with the light, two short lines, a
 *   white-out, the next place, the cut to the next plate) and seven **callouts** (a foe's first full Overdrive, one line each, naming the answer without naming the button). This chapter is NOT in `../registry.ts` (its tests
 *   pin that the registry's keys are the listed chapters); `tests/unit/chapters/dark-aeons-story.test.ts` audits the lint, the sizes, the voices and the trigger-to-script agreement.
 * - Each seam fires on the `ko` of the foe that just fell (`DARK_SEAMS`); Dark Ixion's two fights are two ids, so each has its own seam. The last foe's fall is the end: the post scene.
 * - Music: the mountain's bed under `pre` and `post`; the fights' cues are the formations'.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, SpeakerFallback, SpeakerId, StoryScript } from '../dsl.ts';
import { backdrop, battleStart, beat, camera, fade, flash, fx, hideActor, music, narrate, results, say, shake, wait } from '../dsl.ts';

/** The foes' ids (mirrored from `src/data/ffx/dark-aeons-six-ids.ts`: the story layer does not reach into the data layer). */
const FOE = { valefor: 'dark-valefor', ifrit: 'dark-ifrit', ixion1: 'dark-ixion', ixion2: 'dark-ixion-2', shiva: 'dark-shiva', anima: 'dark-anima', bahamut: 'dark-bahamut' } as const;

/** The seams' ids, one per fall but the last (the engine's `script-trigger` name is the id). */
export const DARK_SEAMS = {
  valefor: 'valefor-falls',
  ifrit: 'ifrit-falls',
  ixion1: 'ixion-falls',
  ixion2: 'ixion-again-falls',
  shiva: 'shiva-falls',
  anima: 'anima-falls',
} as const;

/** The callouts' ids, one per foe: its gauge reaching 100 the first time. */
export const DARK_CALLOUTS = {
  valefor: 'valefor-ready',
  ifrit: 'ifrit-ready',
  ixion1: 'ixion-ready',
  ixion2: 'ixion-again-ready',
  shiva: 'shiva-ready',
  anima: 'anima-ready',
  bahamut: 'bahamut-ready',
} as const;

/** The plates the cutscenes name (mirrored from `src/data/ffx/dark-aeons-six-ids.ts#DARK_SIX_PLATES`). */
const DECK = 'evrae-airship-deck';
const DOME = 'zanarkand-dome';

/** A seam: the fallen foe goes with the light, two short lines, a white-out, the next place. Hands off: every line carries its own `auto`. */
function seam(foe: string, one: [SpeakerId, string], two: [SpeakerId, string], next: string): StoryScript {
  const fallback: SpeakerFallback[] = [{ who: 'tidus' }, { who: 'yuna' }, { who: 'auron' }];
  return [
    music(null, 900),
    camera('idle', 700),
    fx('pyreflies-rising', foe),
    hideActor(foe, 700), // the foe goes with the light
    wait(900),
    say(one[0], one[1], { auto: 2000, fallback }),
    say(two[0], two[1], { auto: 2000, fallback }),
    fade('white', 2400),
    narrate(next, 2400),
    flash(1000, '#ffffff'),
    wait(600),
  ];
}

/** A callout: one line, the answer named without the button. */
const callout = (who: SpeakerId, text: string): StoryScript => [say(who, text, { auto: 2200, fallback: [{ who: 'tidus' }, { who: 'yuna' }, { who: 'auron' }] })];

export const darkAeonsScripts: ChapterScripts = {
  pre: [
    // --- The airship ------------------------------------------------------------------
    backdrop(DECK, 0),
    music('scene-gagazet', 1200),
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    narrate('The airship, high over Spira. Below, six places the pilgrimage touched have gone dark at once.', 3200), // 1
    say('yuna', 'Someone is calling them. All of them, all at once.'), // 2
    say('auron', 'Calling. Forcing.'), // 3
    say('tidus', 'The same shapes as yours, Yuna. Wrong colours.'), // 4
    say('lulu', 'Yevon has kept its acolytes. They need no temple for this.'), // 5
    say('wakka', 'Six of them, ya? One for every road we walked.'), // 6
    beat(1200),
    say('yuna', 'Then we walk them again, and send each one home.'), // 7
    say('auron', 'Start where it started. Besaid.'), // 8
    say('tidus', 'Alright. An old friend, then. A bad one.'), // 9
    shake(6, 600),
    battleStart(),
  ],

  post: [
    music(null, 900),
    backdrop(DOME, 0), // the last was fought in the Beyond, and so is this
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('yuna', 'That was the last of the six.'), // 1
    say('tidus', "Six roads, six goodbyes. We're getting good at them."), // 2
    say('auron', 'Do not get good at them.'), // 3
    beat(1400),
    say('wakka', "They'll keep coming if somebody keeps calling, ya."), // 4
    say('yuna', 'Then I will keep answering.'), // 5
    say('lulu', 'Rest first. Then answer.'), // 6
    results(),
  ],

  victoryQuips: {},

  mid: [
    { id: DARK_CALLOUTS.valefor, when: { type: 'overdrive', who: FOE.valefor }, once: true, script: DARK_CALLOUTS.valefor },
    { id: DARK_SEAMS.valefor, when: { type: 'ko', who: FOE.valefor }, once: true, script: DARK_SEAMS.valefor },
    { id: DARK_CALLOUTS.ifrit, when: { type: 'overdrive', who: FOE.ifrit }, once: true, script: DARK_CALLOUTS.ifrit },
    { id: DARK_SEAMS.ifrit, when: { type: 'ko', who: FOE.ifrit }, once: true, script: DARK_SEAMS.ifrit },
    { id: DARK_CALLOUTS.ixion1, when: { type: 'overdrive', who: FOE.ixion1 }, once: true, script: DARK_CALLOUTS.ixion1 },
    { id: DARK_SEAMS.ixion1, when: { type: 'ko', who: FOE.ixion1 }, once: true, script: DARK_SEAMS.ixion1 },
    { id: DARK_CALLOUTS.ixion2, when: { type: 'overdrive', who: FOE.ixion2 }, once: true, script: DARK_CALLOUTS.ixion2 },
    { id: DARK_SEAMS.ixion2, when: { type: 'ko', who: FOE.ixion2 }, once: true, script: DARK_SEAMS.ixion2 },
    { id: DARK_CALLOUTS.shiva, when: { type: 'overdrive', who: FOE.shiva }, once: true, script: DARK_CALLOUTS.shiva },
    { id: DARK_SEAMS.shiva, when: { type: 'ko', who: FOE.shiva }, once: true, script: DARK_SEAMS.shiva },
    { id: DARK_CALLOUTS.anima, when: { type: 'overdrive', who: FOE.anima }, once: true, script: DARK_CALLOUTS.anima },
    { id: DARK_SEAMS.anima, when: { type: 'ko', who: FOE.anima }, once: true, script: DARK_SEAMS.anima },
    { id: DARK_CALLOUTS.bahamut, when: { type: 'overdrive', who: FOE.bahamut }, once: true, script: DARK_CALLOUTS.bahamut },
  ] satisfies MidBattleTrigger[],

  midScripts: {
    [DARK_SEAMS.valefor]: seam(FOE.valefor, ['auron', 'One.'], ['yuna', 'The next is in the desert, where Home stood.'], 'The Sanubia desert, by the ruins of Home.'),
    [DARK_SEAMS.ifrit]: seam(FOE.ifrit, ['tidus', 'He hit me back every single time.'], ['auron', 'Then you learned.'], 'The Thunder Plains. The lightning has not stopped.'),
    [DARK_SEAMS.ixion1]: seam(FOE.ixion1, ['wakka', "That's not all of him, ya."], ['lulu', 'No. The storm has a second strike.'], 'The same plains, one flash later.'),
    [DARK_SEAMS.ixion2]: seam(FOE.ixion2, ['yuna', 'He is going home at last.'], ['auron', 'Slowly.'], 'The road to the Macalania temple, white and quiet.'),
    [DARK_SEAMS.shiva]: seam(FOE.shiva, ['tidus', 'She moved before I did. Every time.'], ['lulu', 'She was always cold, and always first.'], 'The foot of Mt. Gagazet.'),
    [DARK_SEAMS.anima]: seam(FOE.anima, ['yuna', 'She was chained, even then.'], ['auron', 'One more.'], 'The Beyond, under the dome of Zanarkand.'),
    [DARK_CALLOUTS.valefor]: callout('auron', 'Her fury is full. Send someone ahead of you.'),
    [DARK_CALLOUTS.ifrit]: callout('lulu', 'Fewer, heavier blows. Each one wakes him.'),
    [DARK_CALLOUTS.ixion1]: callout('auron', 'Thunder is coming. Do not stand in it.'),
    [DARK_CALLOUTS.ixion2]: callout('wakka', 'He is winding up, ya! Call an aeon!'),
    [DARK_CALLOUTS.shiva]: callout('lulu', 'Her cold is gathering. All of us, at once.'),
    [DARK_CALLOUTS.anima]: callout('auron', 'No spell will touch her. Steel, and a shield.'),
    [DARK_CALLOUTS.bahamut]: callout('yuna', 'His flare is ready. Everyone, stay behind the aeon!'),
  },
};

export default darkAeonsScripts;
