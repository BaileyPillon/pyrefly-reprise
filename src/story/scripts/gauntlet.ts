/**
 * The hidden Gauntlet chapter (FFX; the Monster Arena of the Calm Lands: the Cactuar King, Don Tonberry, Jormungand, Earth Eater, the Greater Sphere, Catastrophe, Th'uban, Neslug and the Ultima Buster): the scene before the
 * first fight, eight seams between the acts and the scene after the last. **Game case: FFX only** [AGENTS.md rule 14]. The Monster Arena and its creations are FFX's; FFX-2 has the Fiend Arena, a different system.
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (the Gippal GP15, Spectral Keeper SK11 and Dark Aeons DA13 precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `gauntlet`. The
 * beats are the research's (`research/re-ffx-monster-arena-creations.md`: what each creation does, in the order the arena lines them up) and nothing more: the arena's owner is never named and **the creations speak no
 * word** (the files give them none). **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md`: Tidus asking what he does not know (1.1), Yuna complete and
 * unhurried (1.3), Auron laconic and dry (1.4), Wakka warm and plain with his "ya" (1.5), Lulu dry (1.6).
 *
 * ## Wiring
 *
 * - `pre` is nine lines, in the arena; `post` six. Eight **seams** (a mid-battle script that plays at an act's fall, hands off, about 10 seconds each: the creation goes with the light, two short lines, a white-out, the
 *   next stall, the cut to the next act). There are no callouts: the guide card and the move advisor say what each creation answers, and a line in the middle of a Karma or a needle would only talk over it. This chapter is
 *   NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/gauntlet-story.test.ts` audits the lint, the sizes, the voices and the trigger-to-script agreement.
 * - Each seam fires on the `ko` of the creation that just fell (`GAUNTLET_SEAMS`). The Cactuar King may also leave (its Run Away ends the act as a retry, no seam); the Ultima Buster's fall is the end: the post scene.
 * - Music: the Dome's bed under `pre` and `post`; the fights' cues are the formations'.
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import type { ChapterScripts, SpeakerFallback, SpeakerId, StoryScript } from '../dsl.ts';
import { backdrop, battleStart, beat, camera, fade, flash, fx, hideActor, music, narrate, results, say, shake, wait } from '../dsl.ts';

/** The foes' ids (mirrored from `src/data/ffx/gauntlet-ids.ts`: the story layer does not reach into the data layer). */
const FOE = { cactuarKing: 'cactuar-king', donTonberry: 'don-tonberry', jormungand: 'jormungand', earthEater: 'earth-eater', greaterSphere: 'greater-sphere', catastrophe: 'catastrophe', thuban: 'thuban', neslug: 'neslug', ultimaBuster: 'ultima-buster' } as const;

/** The seams' ids, one per fall but the last (the engine's `script-trigger` name is the id). */
export const GAUNTLET_SEAMS = {
  cactuarKing: 'cactuar-king-falls',
  donTonberry: 'don-tonberry-falls',
  jormungand: 'jormungand-falls',
  earthEater: 'earth-eater-falls',
  greaterSphere: 'greater-sphere-falls',
  catastrophe: 'catastrophe-falls',
  thuban: 'thuban-falls',
  neslug: 'neslug-falls',
} as const;

/** The arena's plate (mirrored from `src/data/ffx/gauntlet-ids.ts#GAUNTLET_PLATE`, a stand-in). */
const ARENA = 'zanarkand-dome';

/** A seam: the fallen creation goes with the light, two short lines, a white-out, the next stall. Hands off: every line carries its own `auto`. */
function seam(foe: string, one: [SpeakerId, string], two: [SpeakerId, string], next: string): StoryScript {
  const fallback: SpeakerFallback[] = [{ who: 'tidus' }, { who: 'yuna' }, { who: 'auron' }];
  return [
    music(null, 900),
    camera('idle', 700),
    fx('pyreflies-rising', foe),
    hideActor(foe, 700), // the creation goes with the light
    wait(900),
    say(one[0], one[1], { auto: 2000, fallback }),
    say(two[0], two[1], { auto: 2000, fallback }),
    fade('white', 2400),
    narrate(next, 2400),
    flash(1000, '#ffffff'),
    wait(600),
  ];
}

export const gauntletScripts: ChapterScripts = {
  pre: [
    // --- The arena ---------------------------------------------------------------------
    backdrop(ARENA, 0),
    music('scene-zanarkand-dome', 1200),
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    narrate('The Monster Arena, in the Calm Lands. Nine creations wait, and every gate is open.', 3200), // 1
    say('yuna', 'The owner says they are ready whenever we are.'), // 2
    say('tidus', 'All of them? One after the other?'), // 3
    say('lulu', 'We are made whole between each. That is the only kindness.'), // 4
    say('auron', 'Smallest first. The worst last.'), // 5
    say('wakka', "Nine, ya? That's a long afternoon."), // 6
    beat(1200),
    say('tidus', "Then let's not waste the morning."), // 7
    say('yuna', 'One at a time. Together.'), // 8
    say('auron', 'Begin.'), // 9
    shake(6, 600),
    battleStart(),
  ],

  post: [
    music(null, 900),
    backdrop(ARENA, 0),
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('yuna', 'That was the last of them.'), // 1
    say('tidus', 'Nine. I could sleep for a week.'), // 2
    say('auron', 'Sleep, then.'), // 3
    beat(1400),
    say('wakka', 'They kept them in order, ya. Smallest first.'), // 4
    say('lulu', 'And the largest last. A tidy cruelty.'), // 5
    say('yuna', 'Come. The sun is still up.'), // 6
    results(),
  ],

  victoryQuips: {},

  mid: [
    { id: GAUNTLET_SEAMS.cactuarKing, when: { type: 'ko', who: FOE.cactuarKing }, once: true, script: GAUNTLET_SEAMS.cactuarKing },
    { id: GAUNTLET_SEAMS.donTonberry, when: { type: 'ko', who: FOE.donTonberry }, once: true, script: GAUNTLET_SEAMS.donTonberry },
    { id: GAUNTLET_SEAMS.jormungand, when: { type: 'ko', who: FOE.jormungand }, once: true, script: GAUNTLET_SEAMS.jormungand },
    { id: GAUNTLET_SEAMS.earthEater, when: { type: 'ko', who: FOE.earthEater }, once: true, script: GAUNTLET_SEAMS.earthEater },
    { id: GAUNTLET_SEAMS.greaterSphere, when: { type: 'ko', who: FOE.greaterSphere }, once: true, script: GAUNTLET_SEAMS.greaterSphere },
    { id: GAUNTLET_SEAMS.catastrophe, when: { type: 'ko', who: FOE.catastrophe }, once: true, script: GAUNTLET_SEAMS.catastrophe },
    { id: GAUNTLET_SEAMS.thuban, when: { type: 'ko', who: FOE.thuban }, once: true, script: GAUNTLET_SEAMS.thuban },
    { id: GAUNTLET_SEAMS.neslug, when: { type: 'ko', who: FOE.neslug }, once: true, script: GAUNTLET_SEAMS.neslug },
  ] satisfies MidBattleTrigger[],

  midScripts: {
    [GAUNTLET_SEAMS.cactuarKing]: seam(FOE.cactuarKing, ['wakka', 'It pricked back at every touch, ya.'], ['auron', 'Small bodies bite hard.'], 'The second stall. Something small and patient, with a lantern.'),
    [GAUNTLET_SEAMS.donTonberry]: seam(FOE.donTonberry, ['tidus', 'He just walked up to me. Slowly. I hit him anyway.'], ['lulu', 'Karma weighs what you have done. You have done a great deal.'], 'The third stall. Something long and cold, coiled in the dark.'),
    [GAUNTLET_SEAMS.jormungand]: seam(FOE.jormungand, ['tidus', 'It looked at me and I could not move my feet.'], ['auron', 'Stone forgives nothing.'], 'The fourth stall. The floor begins to tremble.'),
    [GAUNTLET_SEAMS.earthEater]: seam(FOE.earthEater, ['wakka', 'It threw the fire right back at us, ya!'], ['yuna', 'It cast the Flare at itself, and its Reflect did the rest.'], 'The fifth stall. A round thing that hums, and keeps changing colour.'),
    [GAUNTLET_SEAMS.greaterSphere]: seam(FOE.greaterSphere, ['tidus', 'Plain blows only made it angry.'], ['lulu', 'One element opens it. The others only feed it.'], 'The sixth stall. Something vast, wrapped in thorns, asleep.'),
    [GAUNTLET_SEAMS.catastrophe]: seam(FOE.catastrophe, ['lulu', 'It grew thorns and teeth. It never got to use them.'], ['auron', 'Strike before it changes.'], 'The seventh stall. A robed giant crowned in rainbow light.'),
    [GAUNTLET_SEAMS.thuban]: seam(FOE.thuban, ['tidus', 'It meant to end one of us every fourth turn.'], ['wakka', 'It never got that far, ya.'], 'The eighth stall. Something soft and slow, sealed in a shell.'),
    [GAUNTLET_SEAMS.neslug]: seam(FOE.neslug, ['tidus', 'My sword did nothing. Nothing at all!'], ['lulu', 'The shell turns steel aside. Magic does not care.'], 'The last stall. A great machine, with a head and two arms of its own.'),
  },
};

export default gauntletScripts;
