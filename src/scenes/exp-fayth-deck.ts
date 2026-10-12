/**
 * **The hidden Fayth chapter's scene** (FFX only; `../data/chapter-exp-fayth.ts`): the Fahrenheit's deck over Chapter VIII's plate, publishing a camera director.
 *
 * Game case: FFX only [AGENTS.md rule 14; research/ffx-evrae-airship.md]. It is Chapter VIII's deck (`./evrae-airship-deck.ts`): the same ship, the same NEAR / FAR range director that stages Evrae, the same
 * rigs, party arc, lighting and slots, because the chapter is Chapter VIII's encounter. It is built with `makeAirshipDeckScene` over **Chapter VIII's own plate** (`EVRAE_DECK_PLATE`), so it draws
 * exactly Chapter VIII's painting (and would fall back to it as Sin's chapters do should it ever be given a plate of its own), and nothing in Chapter VIII's scene changes.
 *
 * What it adds is one staging switch, `SceneStaging.shotDirector` (`../engine/ShotDirector.ts`): the camera plan `BattleMoments` asks before it moves the camera for a beat. Phase 1 published the
 * **stub** (`../engine/ffxcam/stubDirector.ts`), which declines every beat, so the chapter played Chapter VIII's camera; the factory below still builds it that way and `?skin=classic` on a dev server returns it
 * untouched. Everywhere else the chapter's camera is FFX's (below). The airship range director keeps staging Evrae (spots, paintings, the NEAR / FAR rigs); in FFX's camera it does not drive the camera,
 * the camera's range scenes (Pull back, Move in) do.
 *
 * **Two skins, one scene (phase 3).** On a dev server the scene may take FFX's own staging and, when Bailey's converted folder is behind the dev route, his own models: `./exp-fayth-skin.ts`, reached through a
 * dynamic `import()` inside `import.meta.env.DEV`. Production and the website have no skin code and no loader: only the painted skin at FFX's staging (`./exp-fayth-stage.ts`).
 *
 * **FFX's camera (phase 4b).** With a skin staged and the camera folder behind the dev route, `./exp-fayth-camera.ts` (the same dynamic `import()`) replaces the stub with the FFX camera director for both skins.
 *
 * **The website's camera (phase 6).** Wherever FFX's own programs are not there (the website, production, every test, a dev server without Bailey's folder) the scene is the painted skin at FFX's staging with the
 * **table director** (`./exp-fayth-table.ts`): FFX's camera timing and framing from our own keyframe table, painted variant B (Bailey's pick, 2026-10-11). Production-safe: no local file, no VM. A dev server
 * forces it with `?ffxcam=table`; `?skin=classic` keeps phase 1's scene as the factory built it.
 *
 * The registration lives with the other hidden chapters' scenes (`./experiment-scenes.ts`): `./index.ts` is over the house 400 lines and does not grow for a hidden chapter.
 */

import type { SceneEntry } from './index.ts';
import type { SceneBuildOptions, SceneFactory } from './types.ts';
import { buildDemoScene } from './demo.ts';
import { EVRAE_AIRSHIP_DECK_SLOTS, EVRAE_DECK_PLATE, makeAirshipDeckScene } from './evrae-airship-deck.ts';
import { STUB_SHOT_DIRECTOR } from '../engine/ffxcam/stubDirector.ts';
import { EXP_FAYTH_SCENE } from '../data/ffx/exp-fayth-ids.ts';

/** Chapter VIII's deck over its own plate, with the stub director on it: phase 1's scene, as the factory builds it. */
const buildPainted: SceneFactory = makeAirshipDeckScene({ key: EVRAE_DECK_PLATE, staging: { shotDirector: STUB_SHOT_DIRECTOR } });

/**
 * The hidden chapter's scene. On a dev server (only there: a production build drops the branch, and the skin and the VM camera with it) the skins of `./exp-fayth-skin.ts` and FFX's own camera
 * (`./exp-fayth-camera.ts`) come first when Bailey's local folders are there; `?skin=classic` is phase 1's scene as it was, and `?ffxcam=table` forces the website's. Otherwise, everywhere, it is the painted
 * skin at FFX's staging with the table director (`./exp-fayth-table.ts`), loaded on demand so the other chapters do not carry it.
 */
export const buildExpFaythDeckScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const build = await buildPainted(opts);
  if (import.meta.env.DEV) {
    const search = typeof location === 'undefined' ? '' : location.search;
    const { stageFaythSkin, skinParam } = await import('./exp-fayth-skin.ts');
    const { tableForced } = await import('./exp-fayth-table.ts');
    if (skinParam(search) === 'classic') return build; // phase 1's scene, as the factory made it
    if (!tableForced(search)) {
      const skinned = await stageFaythSkin(build);
      const { stageFaythCamera } = await import('./exp-fayth-camera.ts');
      const withCamera = await stageFaythCamera(build, skinned); // FFX's own camera, when Bailey's camera folder is there and a skin is staged; else `skinned` as it is
      if (withCamera !== skinned || (skinned !== build && skinParam(search) !== 'painted')) return withCamera; // FFX's programs, or the `ffx` skin with the camera it had
    }
  }
  const { stageFaythTable } = await import('./exp-fayth-table.ts');
  return stageFaythTable(build);
};

/** The scene-table row: real (the factory wins); `build` is the unreachable demo diorama, as for the deck itself. The slots are the deck's, so Chapter VIII's heights and pins hold. */
export const EXP_FAYTH_SCENE_ENTRY: SceneEntry = {
  key: EXP_FAYTH_SCENE,
  title: 'The deck of the Fahrenheit — Evrae, with FFX\'s camera (experimental)',
  build: buildDemoScene,
  slots: EVRAE_AIRSHIP_DECK_SLOTS,
  placeholder: false,
};
