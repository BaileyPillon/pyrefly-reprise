/**
 * The hidden Wendigo chapter (FFX; frozen Lake Macalania): the scene before the fight and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **No line of its own** (the preflight's CW15, the driver's pick, his to overturn): the game's battle script has no message and no scene (`research/re-ffx-wendigo-lake-macalania.md` section 2), and the pre and post
 * scripts here are therefore silent: the pre scene only fades in on the lake and starts the fight, the post scene is the results page and the fade out. Nothing is quoted, nothing is invented (rule 6). The ice that
 * breaks after the win is the field event's, not the battle's (RE 2), and belongs to the presentation lane's epilogue; it carries no text either. The alternative, a caption in our own words, waits for Bailey's yes.
 *
 * Like the other hidden chapters', this one is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/wendigo-story.test.ts` audits the lint and the silence.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, beat, camera, fade, music, results, wait } from '../dsl.ts';

export const wendigoScripts: ChapterScripts = {
  pre: [
    music('scene-macalania-temple', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(1200),
    music('boss-challenge', 900), // a stand-in cue (RE 2: the battle's own theme is not read; Bailey's ear decides, rule 13)
    camera('action', 700),
    battleStart(),
  ],

  post: [
    music(null, 1000),
    camera('victory', 800),
    beat(1200),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(800),
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default wendigoScripts;
