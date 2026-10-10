/**
 * **The hidden Fayth chapter's scene** (FFX only; `../data/chapter-exp-fayth.ts`): the Fahrenheit's deck over Chapter VIII's plate, publishing a camera director.
 *
 * Game case: FFX only [AGENTS.md rule 14; research/ffx-evrae-airship.md]. It is Chapter VIII's deck (`./evrae-airship-deck.ts`): the same ship, the same NEAR / FAR range director that stages Evrae, the same
 * rigs, party arc, lighting and slots, because the chapter is Chapter VIII's encounter. It is built with `makeAirshipDeckScene` over **Chapter VIII's own plate** (`EVRAE_DECK_PLATE`), so it draws
 * exactly Chapter VIII's painting (and would fall back to it as Sin's chapters do should it ever be given a plate of its own), and nothing in Chapter VIII's scene changes.
 *
 * What it adds is one staging switch, `SceneStaging.shotDirector` (`../engine/ShotDirector.ts`): the camera plan `BattleMoments` asks before it moves the camera for a beat. Today it is the
 * **stub** (`../engine/ffxcam/stubDirector.ts`), which declines every beat, so the chapter plays Chapter VIII's camera; the FFX shot table (D-632, test modes A and B) takes the beats over later. The
 * airship range director keeps staging Evrae (spots, paintings, the NEAR / FAR rigs) and does not drive the camera in this scene.
 *
 * The registration lives with the other hidden chapters' scenes (`./experiment-scenes.ts`): `./index.ts` is over the house 400 lines and does not grow for a hidden chapter.
 */

import type { SceneEntry } from './index.ts';
import type { SceneFactory } from './types.ts';
import { buildDemoScene } from './demo.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS, EVRAE_DECK_PLATE, makeAirshipDeckScene } from './evrae-airship-deck.ts';
import { STUB_SHOT_DIRECTOR } from '../engine/ffxcam/stubDirector.ts';
import { EXP_FAYTH_SCENE } from '../data/ffx/exp-fayth-ids.ts';

/** The deck over Chapter VIII's plate, with the stub director on it. */
export const buildExpFaythDeckScene: SceneFactory = makeAirshipDeckScene({ key: EVRAE_DECK_PLATE, staging: { shotDirector: STUB_SHOT_DIRECTOR } });

/** The scene-table row: real (the factory wins); `build` is the unreachable demo diorama, as for the deck itself. The slots are the deck's, so Chapter VIII's heights and pins hold. */
export const EXP_FAYTH_SCENE_ENTRY: SceneEntry = {
  key: EXP_FAYTH_SCENE,
  title: 'The deck of the Fahrenheit — Evrae, with FFX\'s camera (experimental)',
  build: buildDemoScene,
  slots: EVRAE_AIRSHIP_DECK_SLOTS,
  placeholder: false,
};
