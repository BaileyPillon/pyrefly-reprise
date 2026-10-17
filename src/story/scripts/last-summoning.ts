/**
 * The hidden Last Summoning (FFX only; hidden chapter 28; **our own words**: no line of the game is reproduced [AGENTS.md rule 8]). A variant of Dream's End in which Yu Yevon takes Yuna's aeons one at a time in the
 * order she chooses, so the scenes are **order-agnostic**: each aeon has one beat for arriving and one for falling, said whenever it comes, and nothing says which came first or last.
 *
 * Voices and tone from `research/writing-bible.md`: section 3 E4 ("a funeral with a health bar: do not write tension, write cost; every word belongs to Yuna losing things she loves"), Yuna (section 1.3: complete,
 * unhurried, formal-plain, never "I can't", honorifics for elders, "Yes." as acceptance), Auron (1.4: imperatives and fragments, two to seven words, never an apology), Tidus (1.1), Lulu (1.6), Rikku (1.8); **Yu Yevon
 * never speaks** (1.13): the party describes it, and the only unattributed line is a system line.
 *
 * Shape (the Dream's End grammar of `./braskas-final-aeon.ts`): `pre` is the scene before the first offering (eleven lines and a chant), `mid` is one arrival and one fall for each of the eight aeons (the three Sisters
 * grieve one line each as they fall, in whatever order they go) and Yu Yevon's arrival, `post` is the quiet after. Every mid-battle `say` carries an `auto` (a beat that waits on a Confirm burns the presenter's 30 s
 * budget and is abandoned mid-scene: `src/story/registry.ts` tests it) and every trigger keeps `id === script`. `victoryQuips` is empty: each fall is a bereavement (`writing-bible.md` section 5.4).
 *
 * Like the Experiment's and Sinspawn Gui's, this chapter is NOT in `../registry.ts`; `tests/unit/chapters/last-summoning-chapter.test.ts` audits the lint, the attribution and the line counts.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, fx, music, narrate, results, say, setPose, sfx, shake, wait } from '../dsl.ts';

export const lastSummoningScripts: ChapterScripts = {
  pre: [
    // --- Dream's End after the last of the three: the chanting starts, and Yuna says what she will do ---------------
    music('scene-dreams-end', 1400),
    camera('idle', 0),
    fade('clear', 1200),
    shake(3, 1000),
    sfx('yu-yevon-chant'), // someone praying, too fast, forever
    wait(1800),
    say('rikku', "It's started again. That noise.", { fallback: [{ who: 'tidus' }] }), // 1
    say('auron', 'Yu Yevon. It wants what you called.'), // 2
    say('yuna', 'My aeons.'), // 3
    say('auron', 'Every one. In turn.'), // 4
    beat(1300),
    say('lulu', 'It will take them whether you choose or not.', { fallback: [{ who: 'tidus' }] }), // 5
    say('yuna', "Then I'll choose.", { emotion: 'determined' }), // 6
    say('yuna', 'I will not leave them to be grabbed.'), // 7
    say('tidus', "Yuna, you don't have to hand them over."), // 8
    say('yuna', "I'm not handing them over."), // 9
    beat(1500),
    say('yuna', 'I am saying goodbye.'), // 10
    say('auron', 'Then do it properly.'), // 11
    music('boss-yu-yevon', 900),
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After Yu Yevon: nothing left to call, and the party does not pretend otherwise ---------------------------
    music(null, 1400),
    camera('victory', 900),
    wait(2400),
    results(),
    music('ending-ffx', 1800),
    camera('idle', 900),
    say('rikku', 'It stopped. Is it... did it stop?', { fallback: [{ who: 'tidus' }] }),
    say('auron', 'It stopped.'),
    beat(1500),
    say('yuna', 'They are all gone.'),
    say('tidus', 'But you said goodbye. To every one.'),
    say('yuna', 'Yes.'),
    beat(1800),
    narrate('She did not call another. Nobody asked her to.'),
    fade('black', 1600),
    wait(1400),
  ],

  victoryQuips: {},

  mid: [
    { id: 'valefor-enters', when: { type: 'hp-below', who: 'possessed-valefor', fraction: 1 }, once: true, script: 'valefor-enters' },
    { id: 'valefor-falls', when: { type: 'ko', who: 'possessed-valefor' }, once: true, script: 'valefor-falls' },
    { id: 'ifrit-enters', when: { type: 'hp-below', who: 'possessed-ifrit', fraction: 1 }, once: true, script: 'ifrit-enters' },
    { id: 'ifrit-falls', when: { type: 'ko', who: 'possessed-ifrit' }, once: true, script: 'ifrit-falls' },
    { id: 'ixion-enters', when: { type: 'hp-below', who: 'possessed-ixion', fraction: 1 }, once: true, script: 'ixion-enters' },
    { id: 'ixion-falls', when: { type: 'ko', who: 'possessed-ixion' }, once: true, script: 'ixion-falls' },
    { id: 'shiva-enters', when: { type: 'hp-below', who: 'possessed-shiva', fraction: 1 }, once: true, script: 'shiva-enters' },
    { id: 'shiva-falls', when: { type: 'ko', who: 'possessed-shiva' }, once: true, script: 'shiva-falls' },
    { id: 'bahamut-enters', when: { type: 'hp-below', who: 'possessed-bahamut', fraction: 1 }, once: true, script: 'bahamut-enters' },
    { id: 'bahamut-falls', when: { type: 'ko', who: 'possessed-bahamut' }, once: true, script: 'bahamut-falls' },
    { id: 'anima-enters', when: { type: 'hp-below', who: 'possessed-anima', fraction: 1 }, once: true, script: 'anima-enters' },
    { id: 'anima-falls', when: { type: 'ko', who: 'possessed-anima' }, once: true, script: 'anima-falls' },
    { id: 'yojimbo-enters', when: { type: 'hp-below', who: 'possessed-yojimbo', fraction: 1 }, once: true, script: 'yojimbo-enters' },
    { id: 'yojimbo-falls', when: { type: 'ko', who: 'possessed-yojimbo' }, once: true, script: 'yojimbo-falls' },
    { id: 'sisters-enter', when: { type: 'hp-below', who: 'possessed-cindy', fraction: 1 }, once: true, script: 'sisters-enter' },
    { id: 'cindy-falls', when: { type: 'ko', who: 'possessed-cindy' }, once: true, script: 'cindy-falls' },
    { id: 'sandy-falls', when: { type: 'ko', who: 'possessed-sandy' }, once: true, script: 'sandy-falls' },
    { id: 'mindy-falls', when: { type: 'ko', who: 'possessed-mindy' }, once: true, script: 'mindy-falls' },
    { id: 'yu-yevon-arrives', when: { type: 'hp-below', who: 'yu-yevon', fraction: 1 }, once: true, script: 'yu-yevon-arrives' },
  ],

  midScripts: {
    // --- One arrival and one fall for each aeon: short, auto-advancing, Yuna's voice first ------------------------
    'valefor-enters': [say('yuna', 'Valefor.', { auto: 1000 }), say('yuna', 'You were the first to come for me.', { auto: 1400 })],
    'valefor-falls': [say('yuna', 'Go home, Valefor.', { auto: 1300 }), beat(1200)],

    'ifrit-enters': [say('yuna', 'Ifrit.', { auto: 900 }), say('yuna', 'I am sorry for the fire it makes you wear.', { auto: 1500 })],
    'ifrit-falls': [beat(1200), say('auron', 'Do not look away.', { auto: 1100 })],

    'ixion-enters': [say('yuna', 'Ixion.', { auto: 900 }), say('yuna', 'You never needed asking twice.', { auto: 1400 })],
    'ixion-falls': [say('yuna', 'Thank you.', { auto: 1100 }), beat(1300)],

    'shiva-enters': [say('yuna', 'Shiva.', { auto: 900 }), beat(1100), say('yuna', 'You always came quietly.', { auto: 1300 })],
    'shiva-falls': [setPose('kimahri', 'ready'), wait(1500), setPose('kimahri', 'idle')],

    'bahamut-enters': [say('yuna', 'Bahamut.', { auto: 900 }), beat(1200), say('yuna', 'Look after the boy who sleeps in you.', { auto: 1500 })],
    'bahamut-falls': [camera('idle', 600), beat(1700)],

    'anima-enters': [say('yuna', 'Anima.', { auto: 900 }), say('yuna', 'You have nothing to atone for.', { auto: 1400 })],
    'anima-falls': [say('yuna', 'Rest.', { auto: 1000 }), beat(1500)],

    'yojimbo-enters': [say('yuna', 'Yojimbo.', { auto: 900 }), say('auron', 'Paid in advance. By no one left.', { auto: 1400 })],
    'yojimbo-falls': [say('yuna', 'You were never meant to stay.', { auto: 1400 }), beat(1100)],

    'sisters-enter': [say('yuna', 'Cindy. Sandy. Mindy.', { auto: 1300 }), beat(1100), say('yuna', 'Please do not let go of each other.', { auto: 1500 })],
    'cindy-falls': [say('yuna', 'Cindy.', { auto: 900 })],
    'sandy-falls': [say('yuna', 'Sandy.', { auto: 900 })],
    'mindy-falls': [say('yuna', 'Mindy.', { auto: 900 }), beat(1200)],

    // The last of the aeons is gone; what stands in the light is the thing that took them.
    'yu-yevon-arrives': [
      camera('action', 800),
      fx('yu-yevon-reveal', 'yu-yevon'),
      say('rikku', 'That is all it is?', { auto: 1000, fallback: [{ who: 'tidus' }] }),
      say('auron', 'It had no need to be more.', { auto: 1200 }),
      say('yuna', 'There is nothing left for it to take.', { auto: 1400 }),
      camera('idle', 600),
    ],
  },
};

export default lastSummoningScripts;
