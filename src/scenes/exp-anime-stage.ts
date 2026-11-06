/**
 * **The hidden anime chapter's scene** (`../data/chapter-exp-anime.ts`; FFX-2 only): hidden chapter 24's Valefor fight drawn in the anime cel-shaded manner of Genshin Impact and Guilty Gear Strive. It is the Wind Waker
 * chapter's scene (`./exp-windwaker-stage.ts`) with a different cast, material, staging and camera, and nothing else changed: **the same temple stage** (`../engine/ww3d/stage.ts`, a stand-in), the same models loader, skin,
 * hit and move effects, shot director and palette, all handed this chapter's numbers through the engine's optional seams (`WwStaging`, `ModelShading`).
 *
 * Game case: FFX-2 only [AGENTS.md rule 14; research/ffx2-fallen-aeons.md section 7.1]. It is the same encounter as `ffx2-valefor-besaid` (the party, the formation, its AI, the scripts and the music are chapter 24's by
 * reference); what this scene replaces is the picture, wholly: no painted plate, the engine's own light rig hidden, the camera rigs (`../engine/ww3d/animeLayout.ts`, the anime lab's), the grade (`../engine/ww3d/post.ts`) and the
 * figures: the Meshy toon girls (`public/models-exp/windwaker/anime/<id>.glb`, about seven heads tall after the part-2 proportion pass, 1.55 to 1.72 m, with the Wind Waker cast's upright idle and victory) and Valefor (the Wind Waker chapter's `valefor.glb`, scaled to 5 m) under the cel material with
 * outlines (`../engine/ww3d/cel.ts`, `outline.ts`, `faceMask.ts`, `celify.ts`), the painted planes switched off. A slot with no file stands on a neutral capsule, so the chapter always plays.
 *
 * - **The look.** Three looks of one shader, `?look=genshin` (the default: the survey's recommendation, **Bailey has not chosen**), `?look=gg` (Guilty Gear: a razor terminator, one flat violet shadow, a thick near-black
 *   line) and `?look=blend` (Guilty Gear's lines and shadows on Genshin's light); `?look=painted` plays chapter 24's own scene, the comparison. `?outline=0` draws no lines. He picks by playing.
 * - **The wet floor and the air** (`../engine/ww3d/stageAnime.ts`): the temple's sand floor becomes a polished blue-grey stone and a planar mirror lies over it (drawn once per game frame; `?reflect=0` leaves it out, a low-quality build has none); the waterfalls are widened, a mist lies at their feet and dust motes drift in the light shaft.
 * - **Loaded on use.** Everything under `../engine/ww3d/` is imported dynamically, so no other chapter carries it. The girls' files are kept out of git but SHIP in a production build (`tools/dist-filter.mjs`;
 *   `tools/vite-ww-models.mjs` fails a release build that lacks them).
 *
 * The upright phone is not staged; this chapter is a desktop experiment.
 */

import { Group, Vector3, Vector4 } from 'three';
import { Backdrop } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig } from '../engine/Lighting.ts';
import { eyeCandy } from '../engine/fx/EyeCandy.ts';
import { ANIME_BOSS_SPOT, ANIME_CAMERA_POSITION, ANIME_ENEMY_SLOTS, ANIME_PARTY_SLOTS, ANIME_RIGS, ANIME_STAGING, ANIME_WORLD_HEIGHT } from '../engine/ww3d/animeLayout.ts';
import type { RigData } from '../engine/ww3d/camera.ts';
import { WW_BOSS_ID, type V3 } from '../engine/ww3d/layout.ts';
import { EXP_ANIME_SCENE } from '../data/anime-ids.ts';
import { WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR } from '../data/windwaker-ids.ts';
import { buildDemoScene } from './demo.ts';
import { buildDjoseChamberScene } from './djose-chamber.ts';
import type { SceneEntry, SceneSlots } from './index.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneStaging } from './types.ts';

const toRig = (r: RigData): CameraRig => ({ position: [...r.position], lookAt: [...r.lookAt], fov: r.fov, ...(r.sway === undefined ? {} : { sway: r.sway }) });
const toRigs = (): Record<string, CameraRig> => Object.fromEntries(Object.entries(ANIME_RIGS).map(([k, v]) => [k, toRig(v)]));
const toVec = (v: V3): Vector3 => new Vector3(v[0], v[1], v[2]);
const toSpot = (v: V3): [number, number, number] => [v[0], v[1], v[2]];

const PARTY_HEIGHT = ANIME_STAGING.partyHeight;
const BOSS_HEIGHT = ANIME_STAGING.bossHeight;

/** The staging switches and spots the scene publishes (also the scene-table row's slots): the Wind Waker chapter's, with this chapter's numbers. */
const STAGING: Pick<SceneStaging, 'holdParty' | 'noRigs' | 'ownImpacts' | 'enemySpots' | 'figureHeights' | 'guideFolded'> = {
  holdParty: true,
  guideFolded: true, // the strategy guide starts folded to its chip (G opens it): at the target shot the girls' heads stand under the sheet's least height
  noRigs: true, // Valefor has a painted rig on a machine with the rigs dir: its parts are not planes, so the skin could not hide them (the boss stood twice)
  ownImpacts: true, // the stage's shared impact bloom, sparks, slash, drawn spell effect and shot are off: a blow draws this chapter's star burst and smoke (`engine/ww3d/hitFx.ts`)
  enemySpots: { [WW_BOSS_ID]: toSpot(ANIME_BOSS_SPOT) },
  figureHeights: { [WW_BOSS_ID]: BOSS_HEIGHT },
};

export const EXP_ANIME_SLOTS: SceneSlots = {
  party: ANIME_PARTY_SLOTS.slice(0, 3).map(toSpot),
  enemy: ANIME_ENEMY_SLOTS.map(toSpot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: BOSS_HEIGHT,
  ...STAGING,
};

/** The query switch: `?look=painted` plays chapter 24's own scene (the comparison); anything else, or nothing, is the 3D scene (and `?look=genshin|gg|blend` picks the look). */
export function paintedForced(search: string): boolean {
  return new URLSearchParams(search).get('look') === 'painted';
}

/** `?outline=0` draws the figures with no outline (a debugging view); anything else draws it. */
export function outlineWanted(search: string): boolean {
  return new URLSearchParams(search).get('outline') !== '0';
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
 * The scene: a bare backdrop (hidden: fog and background only), the engine's light rig (hidden: the stage has its own), the temple stage, the cel-shaded models on the actors, Valefor's effects, the anime rigs and the
 * palette of the look's stage row. The models, the swapped pieces and the stage load before the scene is handed back (a fight does not open on a half-loaded figure).
 */
export const buildExpAnimeStageScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const search = typeof location === 'undefined' ? '' : location.search;
  if (paintedForced(search)) return buildDjoseChamberScene(opts);

  const t0 = typeof performance === 'undefined' ? 0 : performance.now();
  const timings: Record<string, number> = {};
  const mark = (name: string): void => {
    if (typeof performance !== 'undefined') timings[name] = Math.round(performance.now() - t0);
  };
  const [{ STAGE, buildStage }, { loadSwaps, swapNames }, { loadWwModels, prefetchModels }, { WwSkin }, { MoveFx }, { HitFx }, { tapDirector }, { FileCache, defaultIO }, { paletteFor }, toon, cel, { createCelRig }, floorMod] = await Promise.all([
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
    import('../engine/ww3d/cel.ts'),
    import('../engine/ww3d/celify.ts'),
    import('../engine/ww3d/stageAnime.ts'),
  ]);

  mark('imports');
  const group = new Group();
  group.name = 'scene:exp-anime';
  const lookName = cel.lookFromSearch(search);
  const look = cel.CEL_LOOKS[lookName];
  const celRig = createCelRig(lookName, { outline: outlineWanted(search) });
  // The temple and the weapons' stand-ins take the Wind Waker toon at the look's stage row (`hd` has bloom, `classic` none); the lab zeroed the stage's rim.
  const stageVariant = toon.TOON_VARIANTS[look.stage];
  const uniforms = toon.createToonUniforms();
  toon.applyVariant(uniforms, stageVariant);
  const stageUniforms = toon.withUniforms(uniforms, { uToonRim: { value: new Vector4(0, 0, 0, 0) } });

  // The engine's scene contract wants a backdrop (its fog and background are installed by `mountScene`) and a light rig: both are kept and neither is seen.
  const backdrop = await Backdrop.create({ placeholder: flatPainting, ground: false, layers: [], fogPlanes: false, fog: { near: STAGE.fog.near, far: STAGE.fog.far, colorMix: 0 }, background: STAGE.background });
  backdrop.fog?.color.set(STAGE.fog.colour);
  backdrop.group.visible = false;
  group.add(backdrop.group);
  const lights = new LightRig({ palette: backdrop.palette, shadows: false });
  for (const l of [lights.key, lights.fill, lights.rim, lights.ambient, lights.practical]) l.visible = false;
  group.add(lights.group);

  const base = import.meta.env.BASE_URL;
  const files = new FileCache(defaultIO(), (m) => console.warn(m));
  prefetchModels(files, base, WW_MODEL_DIR, ANIME_STAGING); // the big files start now, beside the pieces
  const swaps = await loadSwaps(files, base, WW_PROP_DIR, WW_TEMPLE_DIR);
  mark('swaps');
  const found = swapNames(swaps);
  if (found.length > 0) console.info(`[ww3d] swapped in: ${found.join(', ')}`);
  const stage = buildStage(stageUniforms, { swaps: swaps.temple, ...(opts.quality ? { quality: opts.quality } : {}) });
  group.add(stage.group);
  const floor = floorMod.addAnimeFloor(stage, { ...(opts.quality ? { quality: opts.quality } : {}), reflect: floorMod.reflectWanted(search) }); // the wet stone and its mirror
  const air = floorMod.addAtmosphere(stage, { extras: opts.quality !== 'low' }); // the wide waterfalls, the mist at their feet, the motes in the shaft
  mark('stage');
  const models = await loadWwModels({
    base,
    dir: WW_MODEL_DIR,
    heights: ANIME_WORLD_HEIGHT,
    context: { uniforms: stageUniforms, swaps: swaps.props, camera: ANIME_CAMERA_POSITION, staging: ANIME_STAGING, shading: celRig.shading },
    files,
    warn: (m) => console.warn(m),
    log: (m) => console.info(m),
  });

  mark('models');
  const calm = (): boolean => eyeCandy.reduceFlashes; // REDUCE FLASHES (PR-0032): the scene draws its own hits and moves, so the row is kept here
  const fx = new MoveFx({ calm });
  group.add(fx.group);
  const hits = new HitFx({ calm });
  group.add(hits.group);
  const skin = new WwSkin({ host: group, models, fx, hits, staging: ANIME_STAGING });
  const directed = tapDirector(undefined, skin.listener); // the beats start the models' clips (attack and cast), the move effects and the wings' flap
  if (import.meta.env.DEV) (globalThis as { __ww3d?: unknown }).__ww3d = { skin, models, stage, floor, air, fx, hits, uniforms, variant: look.stage, look: lookName, cel: celRig, swaps, timings }; // the debug handle (a dev server only)

  mark('ready');
  let clock = 0;
  const build: SceneBuild = {
    group,
    backdrop,
    lights,
    particles: [],
    rigs: toRigs() as SceneBuild['rigs'],
    partySlots: ANIME_PARTY_SLOTS.map(toVec),
    enemySlots: ANIME_ENEMY_SLOTS.map(toVec),
    partyHeight: PARTY_HEIGHT,
    enemyHeight: BOSS_HEIGHT,
    ...STAGING,
    shotDirector: directed,
    palette: paletteFor(look.stage),
    ownGrade: true, // the palette above is the whole grade: the painted chapters' eye-candy post (option A) blew this stage out to white (the Wind Waker chapter, phase 2)
    update(dt: number): void {
      clock += dt;
      lights.update(dt);
      stage.update(clock);
      floor.update(dt);
      air.update(clock);
      skin.update(dt);
      fx.update(dt);
      hits.update(dt);
    },
    dispose(): void {
      const g = globalThis as { __ww3d?: { skin?: unknown } };
      if (g.__ww3d?.skin === skin) delete g.__ww3d; // not a newer scene's handle
      fx.dispose();
      hits.dispose();
      skin.dispose(); // frees the models and their hulls
      files.dispose();
      air.dispose();
      floor.dispose();
      stage.dispose();
      celRig.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};

/** The scene-table row: real (the factory wins); `build` is the unreachable demo diorama, as for every scene with a factory of its own. */
export const EXP_ANIME_SCENE_ENTRY: SceneEntry = {
  key: EXP_ANIME_SCENE,
  title: 'Besaid Temple — Valefor, in an anime style (experimental)',
  build: buildDemoScene,
  slots: EXP_ANIME_SLOTS,
  placeholder: false,
};
