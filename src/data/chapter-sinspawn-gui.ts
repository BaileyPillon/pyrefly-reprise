/**
 * **Sinspawn Gui at Mushroom Rock Road** (Operation Mi'ihen), with Seymour on the party's side — a NEW, HIDDEN FFX chapter (branch `ch-gui`, built overnight 2026-10-10).
 *
 * Bailey, 2026-10-10 (verbatim): "I'll add in those 2 chapter recommendations." Then: "i want those chapters added in over night while im sleep along with what you are working on now. also include
 * the reverse engineered and decompiled game mechanics please. this is really important." The driver's reading, recorded as his delegation: end state first is waived for tonight because he asked to
 * build now; the chapter ships HIDDEN behind a typed word, following the experimental Leblanc chapter (`./chapter-exp-leblanc.ts`); listing it on the board waits for his word; the art is PROVISIONAL (new
 * subjects only, never replacing an approved painting). The paper preflight is `docs/plans/ch-gui-review.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, the FFX status set and a guest in the party (`FFXGuestSpec`) are FFX's; FFX-2 has no Gui and no Operation Mi'ihen.
 *
 * **It is an experiment, not a listed chapter**, exactly as Leblanc's preview is: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save (`pyrefly-reprise:save:v1`), so there is no save change, it is out of the board's "N of 18", the veteran check and total play time. It is
 * not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it and `getChapter` finds it. The board has no card for it;
 * typing the word `mushroom` on chapter select opens it (`../app/screens/frontend/mushroomDoor.ts`).
 *
 * The record imports its data modules directly (it derives from no other chapter), and `./encounters.ts` imports this file for the registry; this file imports only the `Chapter` TYPE from there.
 */

import type { Chapter } from './encounters.ts';
import { mushroomRockBuild } from './ffx/builds/mushroom-rock.ts';
import { sinspawnGuiGroup } from './ffx/enemies/sinspawn-gui.ts';
import { sinspawnGuiScripts } from '../story/scripts/sinspawn-gui.ts';

/** The hidden chapter's id: its key in the experiments' store and on the board. */
export const SINSPAWN_GUI_ID = 'sinspawn-gui' as const;

/** The chapter's scene key: the Mushroom Rock Road diorama (`../scenes/mushroom-rock-road.ts`, a provisional plate). */
export const MUSHROOM_ROCK_SCENE = 'mushroom-rock-road';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-sinspawn-gui.ts`, both read them). Our own words over the research's sourced beats. */
export const SINSPAWN_GUI_TEXT = {
  title: 'Sinspawn Gui',
  subtitle: "Operation Mi'ihen, and a guest who fights beside you",
  blurb:
    "The Crusaders have made their stand on Mushroom Rock Road, and Sin has sent one of its own to meet them. Seymour offers his staff for the day. " +
    'Take the thing apart, and mind who is standing next to you while you do.',
} as const;

/** Chapter XIX in registration order, but no board number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`). */
export const SINSPAWN_GUI: Chapter = {
  id: SINSPAWN_GUI_ID,
  game: 'ffx',
  number: 19,
  experimental: true,
  ...SINSPAWN_GUI_TEXT,
  location: "Mushroom Rock Road — Operation Mi'ihen",
  sceneKey: MUSHROOM_ROCK_SCENE,
  thumbnailKey: 'chapter-sinspawn-gui',
  buildRef: mushroomRockBuild,
  enemyGroupRef: sinspawnGuiGroup,
  scriptsRef: sinspawnGuiScripts,
  music: {
    // Existing cues only (no new audio). Settled from the research when it lands; see `docs/audio/THEMES.md` "Owed cues for chapters not yet listed".
    scene: 'scene-gagazet',
    battle: 'battle-ffx',
    victory: 'victory-ffx',
  },
  sensorTexts: {},
};
