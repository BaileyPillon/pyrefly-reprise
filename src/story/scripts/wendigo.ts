/**
 * The hidden Wendigo chapter (FFX; frozen Lake Macalania): the scene before the fight and the scene after it. **Game case: FFX only** [AGENTS.md rule 14].
 *
 * **No line of its own** (the preflight's CW15, the driver's pick, his to overturn): the game's battle script has no message and no scene (`research/re-ffx-wendigo-lake-macalania.md` section 2), and the pre and post
 * scripts here are therefore silent. Nothing is quoted, nothing is invented (rule 6).
 *
 * **What these scripts can and cannot show of the 3D stage** (`src/engine/lake3d/`). The pre and post scenes run on their own screen, over the chapter's painted plate, and own no 3D scene (`CutsceneScreen`: its camera
 * port is empty), so a `camera` step here moves nothing on the lake. The two things the lake has to show are therefore played by the battle screen itself: the **opening fly-in** is the shot director's answer to the
 * fight's first beat (the scene parks the battle camera on the flight's first key as it is made), and the **ice break** (the field event, RE 2: a magic effect, the twelve ice layers hidden, the camera shaking twice, a
 * fade to white) is played in the battle at the close of the action that fells the last foe, the presenter waiting for it, with the party posing on the breaking ice. The screen is white when the battle ends, so the post
 * scene opens on white (`fade('white', 0)`), holds it a moment (the field event's warp to the lake bottom is not ours) and goes to the results page.
 *
 * Like the other hidden chapters', this one is NOT in `../registry.ts` (its tests pin that the registry's keys are the listed chapters); `tests/unit/chapters/wendigo-story.test.ts` audits the lint and the silence.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, camera, fade, music, results, wait } from '../dsl.ts';

export const wendigoScripts: ChapterScripts = {
  pre: [
    music('scene-macalania-temple', 1200),
    camera('idle', 0),
    fade('clear', 1000),
    wait(600),
    music('boss-challenge', 900), // a stand-in cue (RE 2: the battle's own theme is not read; Bailey's ear decides, rule 13)
    battleStart(), // the director flies the camera down from the aurora to the idle frame
  ],

  post: [
    music(null, 1000),
    fade('white', 0), // the battle ended on white (the ice break's fade, played in the battle)
    wait(900),
    results(),
    music(null, 300),
    camera('idle', 900),
    fade('clear', 800),
    wait(600),
  ],

  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default wendigoScripts;
