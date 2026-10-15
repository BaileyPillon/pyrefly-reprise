/**
 * The hidden Mirror Aeons chapter (FFX; the Dark Magus Sisters on Mushroom Rock Road, then Dark Yojimbo in the Cavern of the Stolen Fayth): the scene before the first fight, the seam between the two acts, one
 * callout and the scene after the second. **Game case: FFX only** [AGENTS.md rule 14]. The Dark Aeons are FFX's (International and HD releases) and so are Yuna's Yojimbo and Magus Sisters.
 *
 * ## The beats, and where each comes from
 *
 * The beats are the guides', and only those (`research/ffx-mirror-aeons.md`): Yevon's acolytes, disguised, call the Dark Magus Sisters up on Mushroom Rock Road (Jegged Sisters), and a Yevon soldier calls Dark
 * Yojimbo up in the Cavern of the Stolen Fayth (Jegged Yojimbo); the Dark Aeons "appear very similar to their counterparts that Yuna can summon" (Jegged Dark Aeons). **Every line is ours** and quotes nothing of
 * the game's script [AGENTS.md rule 8]. Voices from `research/writing-bible.md` (Tidus section 1.1, Yuna 1.3, Auron 1.4, Wakka 1.5, Lulu 1.6): Auron few words and flat, Wakka's "ya", Lulu dry, Yuna gentle and set.
 * The Dark Aeons and the acolytes say nothing (no barks: the driver's rule for the hidden chapters).
 *
 * ## The mirror is the theme
 *
 * The enemies wear Yuna's friends' shapes. The scene never explains the mechanics; it says what the party feels: the sisters and the swordsman are being used, and sending them properly is the kindest thing.
 *
 * ## Wiring
 *
 * - `pre` is eight lines, the **seam** (`SISTERS_FALL`) three plain lines and a white-out, `post` eight, one callout. Like the other hidden chapters' stories this one is NOT in `../registry.ts`; `tests/unit/chapters/
 *   mirror-aeons-chapter.test.ts` audits the lint and the trigger-to-script agreement.
 * - The seam fires on **`all-ko` of the three sisters** (`MIRROR_SEAM`): the trio has no single last sister, so the condition names all three and is true when every sister present is down (a formation with one or two
 *   sisters works the same; in Act II there are none, so it never fires). The battle screen then puts the Cavern's plate on the stage under a white pulse (`EnemyGroupDef.plate`), so the seam ends on a white flash.
 * - The callout (`dark-yojimbo-ready`) answers Dark Yojimbo's gauge reaching 100, whenever the Overdrive rules that fill it (the reverse-engineering session's) emit the change.
 * - Music: the chapter's scene cue under `pre` and `post`; the fights' cues are the formations' (`boss-challenge`, then `boss-yojimbo`).
 */

import type { ChapterScripts } from '../dsl.ts';
import { backdrop, battleStart, beat, camera, fade, flash, fx, hideActor, music, narrate, parallel, results, say, shake, wait } from '../dsl.ts';

/** The seam's and the callout's ids, mirrored by `src/data/ffx/mirror-aeons-ids.ts` (the story layer does not reach into the data layer). */
export const SISTERS_FALL = 'sisters-fall';
export const DARK_YOJIMBO_READY = 'dark-yojimbo-ready';
const SISTERS = ['dark-cindy', 'dark-sandy', 'dark-mindy'] as const;
const DARK_YOJIMBO = 'dark-yojimbo';
/** The two plates, mirrored from `src/data/ffx/mirror-aeons-ids.ts` (`MIRROR_ACT_I_PLATE`, `MIRROR_ACT_II_PLATE`). The scene's own key is not a plate (this chapter's stage is one scene with two plates), so the opening names the road's plate itself. */
const ROAD_PLATE = 'mushroom-rock-road';
const CAVERN_PLATE = 'cavern-stolen-fayth';

export const mirrorAeonsScripts: ChapterScripts = {
  pre: [
    backdrop(ROAD_PLATE, 0), // the scene's key is not a plate, so the opening draws the road's explicitly (a black screen otherwise)
    camera('idle', 0),
    fade('clear', 1200),
    wait(600),
    say('tidus', 'Mushroom Rock Road. Feels like a lifetime ago.'), // 1
    say('yuna', 'Someone is calling an aeon. Here, now.'), // 2
    say('auron', 'Not calling. Forcing.'), // 3
    shake(6, 700),
    say('lulu', 'Three of them. I know those shapes.'), // 4
    say('yuna', 'Cindy. Sandy. Mindy. Wearing the wrong colours.'), // 5
    say('wakka', "Yevon's doing, ya? Even our friends, now."), // 6
    say('auron', 'Then we send them properly.'), // 7
    say('tidus', "Together. Like always."), // 8
    battleStart(),
  ],

  post: [
    music(null, 900),
    backdrop(CAVERN_PLATE, 0), // the second act was fought in the cavern, and so is this
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('yuna', 'Rest now. All of you.'), // 1
    say('auron', 'He fought like a man who was paid.'), // 2
    say('tidus', "Wasn't it his own blade, though?"), // 3
    say('yuna', 'No. Someone borrowed it.'), // 4
    beat(1500),
    say('lulu', 'And the sisters?'), // 5
    say('yuna', 'They came when I called. They will again.'), // 6
    say('wakka', "That's the real thing, ya. The mirror was just a trick."), // 7
    say('auron', 'Go on. The road is still long.'), // 8
    results(),
  ],

  victoryQuips: {},

  mid: [
    { id: SISTERS_FALL, when: { type: 'all-ko', ids: [...SISTERS] }, once: true, script: SISTERS_FALL },
    { id: DARK_YOJIMBO_READY, when: { type: 'overdrive', who: DARK_YOJIMBO }, once: true, script: DARK_YOJIMBO_READY },
  ],

  midScripts: {
    [SISTERS_FALL]: [
      music(null, 900),
      camera('idle', 700),
      parallel(...SISTERS.map((id) => fx('pyreflies-rising', id))),
      parallel(...SISTERS.map((id) => hideActor(id, 700))), // the sisters go with the light
      wait(1000),
      say('auron', 'That was only the road.', { auto: 1800 }),
      say('tidus', 'Only?', { auto: 900 }),
      say('auron', 'Yevon has a second summoner waiting below.', { auto: 2200 }),
      fade('white', 3000),
      narrate('Deep in the cavern, a blade was already drawn.', 2200),
      flash(1200, '#ffffff'),
      wait(700),
    ],
    [DARK_YOJIMBO_READY]: [say('auron', 'His blade is ready. Call an aeon, now!', { auto: 1800, fallback: [{ who: 'tidus' }, { who: 'yuna' }, { who: 'wakka' }, { who: 'lulu' }] })],
  },
};

export default mirrorAeonsScripts;
