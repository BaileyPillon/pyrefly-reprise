/**
 * The hidden Biran and Yenke chapter (FFX; Kimahri's solo trial at the Mountain Gate of Mt. Gagazet): the scene before the fight and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * The beats are the research's, and only those: Kelk Ronso has granted passage and Kimahri still has to defeat Biran and Yenke before the trail (`research/ffx-seymour-flux.md` section 7.1: "Kelk Ronso grants
 * passage -> Kimahri defeats Biran & Yenke -> mountain trail"), and the party is not in the fight (`research/re-ffx-biran-yenke.md` section 4: the field event empties the party and adds only Kimahri). **Every line is
 * ours** and quotes nothing of the game's script [AGENTS.md rule 8]; the brothers' own lines inside the battle (the game's dialogue scenes, RE section 5.8) are **not** reproduced and have no stand-in: no barks
 * (the driver's decision: new lines would be new content). Voices from `research/writing-bible.md`: Kimahri (section 1.7) speaks in the third person, three to eight words, **once, after a silence**, and never into one.
 *
 * `pre` is five lines and a silence, `post` three lines and a silence; no mid-battle scripts and no victory quips (the fight is a trial between kin).
 *
 * Like the Experiment's and Sinspawn Gui's, this chapter is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/biran-yenke-story.test.ts`
 * audits the lint and the line count.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, say, wait } from '../dsl.ts';

export const biranYenkeScripts: ChapterScripts = {
  pre: [
    // --- The Mountain Gate, Kimahri alone before the two Ronso ---------------------------
    camera('idle', 0),
    fade('clear', 1400),
    wait(600),
    say('yenke', 'Kelk has opened the road.'), // 1
    say('biran', 'We have not.'), // 2
    beat(1400), // the silence Kimahri answers
    say('yenke', 'Half a horn. Come and show us what is left.'), // 3
    say('biran', 'Alone, as it should be.'), // 4
    beat(1600),
    say('kimahri', 'Kimahri passes.'), // 5
    battleStart(),
  ],

  post: [
    // --- After the trial -----------------------------------------------------------------
    music(null, 900),
    camera('idle', 0),
    fade('clear', 1400),
    wait(800),
    say('biran', 'Enough.'), // 1
    say('yenke', 'The road is yours. Go up.'), // 2
    beat(1800),
    say('kimahri', 'Kimahri climbs.'), // 3
    results(),
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default biranYenkeScripts;
