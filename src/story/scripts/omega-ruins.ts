/**
 * The hidden Omega Ruins chapter (FFX; Ultima Weapon, Omega Weapon, Nemesis): the scene before the first fight, the two seams between the fights and the scene after the last. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **THIS IS A DRAFT FOR BAILEY TO READ** (the Sanctuary Keeper's and the Keeper's precedent): nothing here ships to a listed chapter, and the chapter itself is hidden behind the typed word `weapon`. The beats are the research's,
 * and only those: three guardians in a row, the first two old machines that keep a fixed round and a hidden count, the last a creation built to end every battle it joins (`research/re-ffx-omega-ultima-nemesis.md`); the game's
 * own scripts give them no line and no cutscene text is read from the files, so **the Weapons and Nemesis speak no word**. **Every line is ours** and quotes nothing of the game's script [AGENTS.md rule 8]. Voices from
 * `research/writing-bible.md`: Tidus asking what he does not know (1.1), Yuna complete and unhurried (1.3), Lulu dry (1.6); the front line is Tidus, Yuna and Lulu, and the seams fall back to whoever of the three stands.
 *
 * `pre` is seven lines, each seam three, `post` six. The lines teach the fights in the party's voice without a tutorial and without a number: *an aeon in front of you changes the round* (both Weapons), *the gathering ends in a
 * burst* (Omega Weapon's count), *its worst hour comes on a count nobody sees* and *stand twice* (Nemesis, Auto-Life), *a flourish is answered in kind* (the Ultima Nemesis casts at an Overdrive, taught as a hint, never a number).
 *
 * Like the Keepers', this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/omega-ruins-story.test.ts` audits the lint and the line counts.
 *
 * ## Wiring
 *
 * - The seams fire on **`all-ko`** of the fight's one body (`ULTIMA_FALLS`, `OMEGA_FALLS`): when it is down the next link of the chain loads. Their ids are mirrored by `src/data/ffx/omega-ruins-ids.ts`'s combatant ids.
 * - Music: the chapter's scene cue under `pre` and `post`; the fights' cues are the formations' (`boss-challenge`, then `boss-yu-yevon`; flagged stand-ins, rule 13).
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, flash, fx, hideActor, music, results, say, shake, wait } from '../dsl.ts';

/** The seams' ids: the script refs the `mid` triggers name. */
export const ULTIMA_FALLS = 'ultima-falls';
export const OMEGA_FALLS = 'omega-falls';

const ULTIMA = 'ultima-weapon';
const OMEGA = 'omega-weapon';

export const omegaRuinsScripts: ChapterScripts = {
  pre: [
    // --- The ruins ---------------------------------------------------------------------------
    music('scene-zanarkand-dome', 1200),
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    say('tidus', 'Whoa. This place is huge. And so old.'), // 1
    say('lulu', 'The oldest war in Spira left its machines here, waiting.'), // 2
    say('yuna', 'Something is awake. I can feel it listening.'), // 3
    shake(5, 600),
    say('tidus', 'So it knows we are here.'), // 4
    say('lulu', 'It keeps a fixed round. An aeon in front of you changes it.'), // 5
    say('yuna', 'Then we take them one at a time.'), // 6
    say('tidus', 'Ready when you are.'), // 7
    music('boss-challenge', 900), // a stand-in cue (flagged; rule 13: Bailey's ear decides)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    // --- After the last of them --------------------------------------------------------------
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
    say('tidus', 'It is not getting up. Is it?'), // 1
    say('lulu', 'No. Whoever made it is long gone.'), // 2
    say('yuna', 'They guarded the road to something. I hope we never learn what.'), // 3
    beat(1500),
    say('tidus', 'Same. Let us go up, into the light.'), // 4
    say('lulu', 'Mind the stairs. They are older than we are.'), // 5
    say('yuna', 'Thank you, all of you. For standing again.'), // 6
  ],

  victoryQuips: {},

  mid: [
    { id: ULTIMA_FALLS, when: { type: 'all-ko', ids: [ULTIMA] }, once: true, script: ULTIMA_FALLS },
    { id: OMEGA_FALLS, when: { type: 'all-ko', ids: [OMEGA] }, once: true, script: OMEGA_FALLS },
  ],

  midScripts: {
    [ULTIMA_FALLS]: [
      music(null, 900),
      camera('idle', 700),
      fx('pyreflies-rising', ULTIMA),
      hideActor(ULTIMA, 700), // the machine goes dark where it stood
      wait(900),
      say('lulu', 'One down. The next will not be so gentle.', { auto: 2000, fallback: [{ who: 'yuna' }, { who: 'tidus' }] }),
      say('tidus', 'The next?', { auto: 900, fallback: [{ who: 'yuna' }, { who: 'lulu' }] }),
      say('yuna', 'Further in, where the light gathers.', { auto: 2000, fallback: [{ who: 'lulu' }, { who: 'tidus' }] }),
      flash(800, '#ffffff'), // under 900 ms: a flash, not a cover (tests/unit/flash-covers.test.ts lists every 900 ms or longer white-out)
      wait(600),
    ],
    [OMEGA_FALLS]: [
      music(null, 900),
      camera('idle', 700),
      fx('pyreflies-rising', OMEGA),
      hideActor(OMEGA, 700),
      wait(900),
      say('lulu', 'It was gathering the whole time. Be glad it never finished.', { auto: 2300, fallback: [{ who: 'yuna' }, { who: 'tidus' }] }),
      say('tidus', 'Is that all of them?', { auto: 900, fallback: [{ who: 'yuna' }, { who: 'lulu' }] }),
      say('yuna', 'No. The last of the old creations. Its worst blows kill outright, so stand twice.', { auto: 2600, fallback: [{ who: 'lulu' }, { who: 'tidus' }] }),
      flash(800, '#ffffff'),
      wait(700),
    ],
  },
};

export default omegaRuinsScripts;
