/**
 * **The hidden Wind Waker chapter's scene** (`../data/chapter-exp-windwaker.ts`; FFX-2 only): hidden chapter 24's Valefor fight drawn as a Wind Waker HD style 3D scene. The look is the look lab's approved `hd` variant
 * (`D:\Tools\pyrefly-scratch\2026-10-20\windwaker\look-lab`, Bailey's pick "HD (Recommended)"), the picture is TARGET-C ("Besaid, toon 3-head", Bailey's pick): a low camera, three short girls in a diagonal on the
 * left, Valefor hovering in the right half with her wings spread, a round blue-stone temple chamber under a roof opening onto the sky and the spiral clouds, the bottom fifth calm for the HUD.
 *
 * Game case: FFX-2 only [AGENTS.md rule 14; research/ffx2-fallen-aeons.md section 7.1]. It is the same encounter as `ffx2-valefor-besaid` (the party, the formation, its AI, the scripts and the music are chapter 24's by
 * reference); what this scene replaces is the picture, wholly: **no painted plate** (the temple is 3D, `../engine/ww3d/stage.ts`), the engine's own light rig hidden (the sun and the fill are the stage's), the camera rigs
 * (`../engine/ww3d/camera.ts`), the grade (`../engine/ww3d/post.ts`) and the figures: toon-shaded GLB models on the stage's actors (`public/models-exp/windwaker/<id>.glb`, `../engine/ww3d/`) with the painted planes
 * switched off. A slot with no file stands on a neutral capsule, so the chapter always plays. The existing FFX-2 battle HUD stays the HTML overlay, unchanged.
 *
 * - **Staging.** The party's three slots, Valefor's spot and the reserve spots are the lab's (`../engine/ww3d/layout.ts`); `holdParty` keeps the stage's relaxation off the slots (the girls' weapons are aimed at them);
 *   Valefor's world height is published (`figureHeights`) and she hovers on the model's own hover and bob.
 * - **The look.** `?ww=hd` (the default), `?ww=hd-soft` (half the bloom) or `?ww=classic` (no bloom, a razor-hard terminator) choose the lab's variant; `?ww=painted` plays chapter 24's own scene, the comparison.
 * - **Loaded on use.** Everything under `../engine/ww3d/` is imported dynamically, so no other chapter carries it. The files are local only (`tools/dist-filter.mjs`): on the website the chapter plays on capsules and
 *   procedural weapons and temple pieces.
 * - **Swappable.** `models-exp/windwaker/props/<pistol|dagger|sword>.glb` and `temple/<wall|door|brazier|pillar>.glb` replace the procedural stand-ins when they exist (`../engine/ww3d/swaps.ts`).
 *
 * The upright phone is not staged; this chapter is a desktop experiment.
 */

import { Group, Vector3 } from 'three';
import { Backdrop } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig } from '../engine/Lighting.ts';
import { RIGS, TARGET_POSITION, type RigData } from '../engine/ww3d/camera.ts';
import { BOSS_HEIGHT, BOSS_SPOT, ENEMY_SLOTS, PARTY_HEIGHT, PARTY_SLOTS, WORLD_HEIGHT, WW_BOSS_ID, type V3 } from '../engine/ww3d/layout.ts';
import { EXP_WINDWAKER_SCENE, WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR } from '../data/windwaker-ids.ts';
import { buildDemoScene } from './demo.ts';
import { buildDjoseChamberScene } from './djose-chamber.ts';
import type { SceneEntry, SceneSlots } from './index.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneStaging } from './types.ts';

const toRig = (r: RigData): CameraRig => ({ position: [...r.position], lookAt: [...r.lookAt], fov: r.fov, ...(r.sway === undefined ? {} : { sway: r.sway }) });
const toRigs = (): Record<string, CameraRig> => Object.fromEntries(Object.entries(RIGS).map(([k, v]) => [k, toRig(v)]));
const toVec = (v: V3): Vector3 => new Vector3(v[0], v[1], v[2]);
const toSpot = (v: V3): [number, number, number] => [v[0], v[1], v[2]];

/** The staging switches and spots the scene publishes (also the scene-table row's slots). */
const STAGING: Pick<SceneStaging, 'holdParty' | 'noRigs' | 'ownImpacts' | 'enemySpots' | 'figureHeights' | 'guideFolded'> = {
  holdParty: true,
  guideFolded: true, // the strategy guide starts folded to its chip (G opens it): at the target shot the girls' heads stand under the sheet's least height, so an open sheet covered Yuna's hair (polish 1)
  noRigs: true, // Valefor has a painted rig on a machine with the rigs dir: its parts are not planes, so the skin could not hide them (the boss stood twice)
  ownImpacts: true, // the stage's shared impact bloom, sparks, slash, drawn spell effect and shot are off: a blow draws this chapter's star burst and smoke (`engine/ww3d/hitFx.ts`; polish 2, the shared bloom was a white blob over the girl it landed on)
  enemySpots: { [WW_BOSS_ID]: toSpot(BOSS_SPOT) },
  figureHeights: { [WW_BOSS_ID]: BOSS_HEIGHT },
};

export const EXP_WINDWAKER_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map(toSpot),
  enemy: ENEMY_SLOTS.map(toSpot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: BOSS_HEIGHT,
  ...STAGING,
};

/** The query switch: `?ww=painted` plays chapter 24's own scene (the comparison); anything else, or nothing, is the 3D scene (and `?ww=hd-soft` / `?ww=classic` pick the look). */
export function paintedForced(search: string): boolean {
  return new URLSearchParams(search).get('ww') === 'painted';
}

/** A tiny flat canvas: the backdrop's stand-in painting, which is never drawn (the temple is 3D) but gives the engine's scene contract the palette, fog and background it expects. */
function flatPainting(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 9;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#8ec5ff';
    g.fillRect(0, 0, 16, 9);
  }
  return c;
}

/**
 * The scene: a bare backdrop (hidden: fog and background only), the engine's light rig (hidden: the stage has its own), the temple stage, the toon models on the actors, Valefor's effects, the lab's rigs and palette. The
 * models, the swapped pieces and the stage load before the scene is handed back (a fight does not open on a half-loaded figure).
 */
export const buildExpWindwakerStageScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const search = typeof location === 'undefined' ? '' : location.search;
  if (paintedForced(search)) return buildDjoseChamberScene(opts);

  // where the scene's own time goes (a dev server's debug handle reads it as `__ww3d.timings`, milliseconds since the factory was called; polish 1, the battle start held 11 to 18 s)
  const t0 = typeof performance === 'undefined' ? 0 : performance.now();
  const timings: Record<string, number> = {};
  const mark = (name: string): void => {
    if (typeof performance !== 'undefined') timings[name] = Math.round(performance.now() - t0);
  };
  const [{ STAGE, buildStage }, { loadSwaps, swapNames }, { loadWwModels, prefetchModels }, { WwSkin }, { MoveFx }, { HitFx }, { tapDirector }, { FileCache, defaultIO }, { paletteFor }, toon] = await Promise.all([
    import('../engine/ww3d/stage.ts'),
    import('../engine/ww3d/swaps.ts'),
    import('../engine/ww3d/model.ts'),
    import('../engine/ww3d/skin.ts'),
    import('../engine/ww3d/moveFx.ts'),
    import('../engine/ww3d/hitFx.ts'),
    import('../engine/ww3d/beats.ts'),
    import('../engine/ww3d/io.ts'),
    import('../engine/ww3d/post.ts'),
    import('../engine/ww3d/toon.ts'),
  ]);

  mark('imports');
  const group = new Group();
  group.name = 'scene:exp-windwaker';
  const variantName = toon.variantFromSearch(search);
  const variant = toon.TOON_VARIANTS[variantName];
  const uniforms = toon.createToonUniforms();
  toon.applyVariant(uniforms, variant);

  // The engine's scene contract wants a backdrop (its fog and background are installed by `mountScene`) and a light rig: both are kept and neither is seen. The painting plane is hidden, the fog and the sky are the lab's,
  // and every light of the rig is off, so the only light on the models is the stage's sun and fill.
  const backdrop = await Backdrop.create({ placeholder: flatPainting, ground: false, layers: [], fogPlanes: false, fog: { near: STAGE.fog.near, far: STAGE.fog.far, colorMix: 0 }, background: STAGE.background });
  backdrop.fog?.color.set(STAGE.fog.colour);
  backdrop.group.visible = false;
  group.add(backdrop.group);
  const lights = new LightRig({ palette: backdrop.palette, shadows: false });
  for (const l of [lights.key, lights.fill, lights.rim, lights.ambient, lights.practical]) l.visible = false;
  group.add(lights.group);

  // the files: the swapped pieces first (the weapons are attached to the models, the temple pieces to the stage), then the four models
  const base = import.meta.env.BASE_URL;
  const files = new FileCache(defaultIO(), (m) => console.warn(m));
  prefetchModels(files, base, WW_MODEL_DIR); // the big files start now, beside the pieces
  const swaps = await loadSwaps(files, base, WW_PROP_DIR, WW_TEMPLE_DIR);
  mark('swaps');
  const found = swapNames(swaps);
  if (found.length > 0) console.info(`[ww3d] swapped in: ${found.join(', ')}`);
  const stage = buildStage(uniforms, { swaps: swaps.temple, ...(opts.quality ? { quality: opts.quality } : {}) });
  group.add(stage.group);
  mark('stage');
  const models = await loadWwModels({
    base,
    dir: WW_MODEL_DIR,
    heights: WORLD_HEIGHT,
    context: { uniforms, swaps: swaps.props, camera: TARGET_POSITION },
    files,
    warn: (m) => console.warn(m),
    log: (m) => console.info(m),
  });

  mark('models');
  const fx = new MoveFx();
  group.add(fx.group);
  const hits = new HitFx();
  group.add(hits.group);
  const skin = new WwSkin({ host: group, models, fx, hits });
  const directed = tapDirector(undefined, skin.listener); // the beats start the models' clips (attack and cast), the move effects and the wings' flap
  if (import.meta.env.DEV) (globalThis as { __ww3d?: unknown }).__ww3d = { skin, models, stage, fx, hits, uniforms, variant: variantName, swaps, timings }; // the debug handle (a dev server only)

  mark('ready');
  let clock = 0;
  const build: SceneBuild = {
    group,
    backdrop,
    lights,
    particles: [],
    rigs: toRigs() as SceneBuild['rigs'],
    partySlots: PARTY_SLOTS.map(toVec),
    enemySlots: ENEMY_SLOTS.map(toVec),
    partyHeight: PARTY_HEIGHT,
    enemyHeight: BOSS_HEIGHT,
    ...STAGING,
    shotDirector: directed,
    palette: paletteFor(variantName),
    ownGrade: true, // the palette above is the whole grade: the painted chapters' eye-candy post (option A) blew this stage out to white (phase 2)
    update(dt: number): void {
      clock += dt;
      lights.update(dt);
      stage.update(clock);
      skin.update(dt);
      fx.update(dt);
      hits.update(dt);
    },
    dispose(): void {
      const g = globalThis as { __ww3d?: { skin?: unknown } };
      if (g.__ww3d?.skin === skin) delete g.__ww3d; // not a newer scene's handle
      fx.dispose();
      hits.dispose();
      skin.dispose(); // frees the models
      files.dispose();
      stage.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};

/** The scene-table row: real (the factory wins); `build` is the unreachable demo diorama, as for every scene with a factory of its own. */
export const EXP_WINDWAKER_SCENE_ENTRY: SceneEntry = {
  key: EXP_WINDWAKER_SCENE,
  title: 'Besaid Temple — Valefor, in Wind Waker style (experimental)',
  build: buildDemoScene,
  slots: EXP_WINDWAKER_SLOTS,
  placeholder: false,
};
