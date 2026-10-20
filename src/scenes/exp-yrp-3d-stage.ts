/**
 * **The hidden 3D Bahamut chapter's scene** (`../data/chapter-exp-yrp-3d.ts`; FFX-2 only): Chapter IV's chamber (the Bevelle underground: the painted plate and wings, the machina deck, the torn hole, the lamps, the
 * shafts) under **end-state frame A, "classic, now in 3D"** (Bailey's picked target, art room image p_2e12f3ab, kept out of the repo and never shipped): a high three-quarter camera, the trio in a loose diagonal on the right facing left (Paine at the
 * back, Rikku in the middle, Yuna at the front), Bahamut filling the left half with his wings spread, calm floor along the bottom for the HUD. Frame B's low, close view is the `action` rig, and frame C's (behind and
 * above the trio as Bahamut rears with his orb) the `overdrive` rig the shot director takes for Mega Flare (`../engine/yrp3d/director.ts`). The numbers are `../engine/yrp3d/layout.ts`'s (pure, and pinned by `tests/unit/yrp3d/layout.test.ts` without a browser).
 *
 * Game case: FFX-2 only [AGENTS.md rule 14; research/ffx2-bahamut.md]. It is Chapter IV's room (`./bevelle-underground.ts`, built by that factory and not touched), so the painting, the lamps, the deck and the grade are
 * Chapter IV's; what this scene changes is the staging and the camera, and what it adds is two toon lights and the skin that carries the models:
 *
 * - **Staging.** The party's three slots, Bahamut's spot and the reserve spots are frame A's; the girls stand at 1.9 and Bahamut at 5.0 (`PARTY_HEIGHT`, `BOSS_HEIGHT`); bodies face each other along x (the party toward -x,
 *   Bahamut toward +x: `SceneStaging.sideFacing`, the switch FF7's reactor and the hidden Fayth chapter use); `holdParty` keeps the stage's relaxation off the row. The light pools under the figures move with them.
 * - **The camera.** `idle`, `intro`, `action`, `party`, `enemy`, `bahamut` and `victory` are `RIGS` (the names Chapter IV's presenter and script ask for). The painting's parallax stack is aligned for the new `idle`
 *   (`SceneBuildOptions.cameraRef`), so the bands register at rest.
 * - **Light.** The scene's own key, fill, rim and practicals light the models (they light all real geometry); two lights are added for the toon look and neither casts a shadow (the chamber's key casts the models' shadows on the
 *   deck): a soft key from the front left, tinted like the vault's, so a face turned to the lens is on the lit side of the first band, and a warm rim from behind, the lamps' orange, that edges every figure (frame B's warm rim).
 * - **The models.** `../engine/yrp3d/` (loaded on use, so no other chapter carries it): toon-shaded GLBs, `public/models-exp/yrp/yuna.glb`, `rikku.glb`, `paine.glb` and `bahamut.glb`, on the stage's actors, with the painted
 *   planes switched off. A slot whose file is missing stands on a neutral toon capsule, so the chapter always plays in frame A. `?yrp=painted` keeps every figure a painted billboard (the comparison).
 *
 * The upright phone is not staged (Chapter IV's phone rig and slice fit are for its own layout); this chapter is a desktop experiment.
 */

import { Color, DirectionalLight, Vector3, type Object3D } from 'three';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { tapDirector } from '../engine/yrp3d/beats.ts';
import { YRP_SHOT_DIRECTOR } from '../engine/yrp3d/director.ts';
import { BOSS_HEIGHT, BOSS_SPOT, ENEMY_SLOTS, PARTY_HEIGHT, PARTY_SLOTS, RIGS, YRP_BOSS_ID, type RigData, type V3 } from '../engine/yrp3d/layout.ts';
import { EXP_YRP_SCENE, YRP_MODEL_DIR } from '../data/yrp-ids.ts';
import { buildDemoScene } from './demo.ts';
import { buildBevelleUndergroundScene } from './bevelle-underground.ts';
import type { SceneEntry, SceneSlots } from './index.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneStaging } from './types.ts';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some of its fields replaced. The getters (the backdrop that hot-swaps) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

const toRig = (r: RigData): CameraRig => ({ position: [...r.position], lookAt: [...r.lookAt], fov: r.fov, ...(r.sway === undefined ? {} : { sway: r.sway }) });
const toRigs = (): Record<string, CameraRig> => Object.fromEntries(Object.entries(RIGS).map(([k, v]) => [k, toRig(v)]));
const toVec = (v: V3): Vector3 => new Vector3(v[0], v[1], v[2]);
const toSpot = (v: V3): [number, number, number] => [v[0], v[1], v[2]];

/** The staging switches and spots the scene publishes (also the scene-table row's slots). */
const STAGING: Pick<SceneStaging, 'holdParty' | 'sideFacing' | 'enemySpots' | 'figureHeights' | 'shotDirector'> = {
  holdParty: true,
  sideFacing: { party: -1, enemy: 1 },
  enemySpots: { [YRP_BOSS_ID]: toSpot(BOSS_SPOT) },
  figureHeights: { [YRP_BOSS_ID]: BOSS_HEIGHT },
  shotDirector: YRP_SHOT_DIRECTOR, // Bahamut's Mega Flare takes frame C's camera (`../engine/yrp3d/director.ts`); every other beat is Chapter IV's own
};

export const EXP_YRP_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map(toSpot),
  enemy: ENEMY_SLOTS.map(toSpot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: BOSS_HEIGHT,
  ...STAGING,
};

/** The query switch: `?yrp=painted` keeps every figure a painted billboard (the comparison); anything else, or nothing, loads the models that are on disk. */
export function paintedForced(search: string): boolean {
  return new URLSearchParams(search).get('yrp') === 'painted';
}

/** Move the chamber's light pools (a faint additive disc under each standing spot) to the new spots, by the names the factory gave them. */
function movePools(group: Object3D): void {
  const pools = group.children.filter((c) => c.name === 'light-pool');
  pools.slice(0, 3).forEach((p, i) => p.position.set(PARTY_SLOTS[i]![0], 0.02, PARTY_SLOTS[i]![2] - 0.55)); // behind the slot, as Chapter IV's are
  group.getObjectByName('enemy-pool')?.position.set(BOSS_SPOT[0], 0.018, BOSS_SPOT[2]);
  group.getObjectByName('enemy-reflection')?.position.set(BOSS_SPOT[0], 0.016, BOSS_SPOT[2] + 2.6);
}

/**
 * The toon key: soft, from the front left and above, in the vault's cool hue warmed toward white, with no shadow of its own. The chamber's real lights light the models too (Chapter IV's key from the left and behind
 * leaves a face turned to the lens in shade); this lifts the lens side to the ramp's first lit band.
 */
function toonKey(source: DirectionalLight): DirectionalLight {
  const light = new DirectionalLight(new Color(source.color).lerp(new Color(0xfff1dc), 0.72).getHex(), 1.05);
  light.name = 'yrp-toon-key';
  light.position.set(-4.5, 8.5, 11.5);
  light.target.position.set(0, 1.2, -1.5);
  light.castShadow = false;
  return light;
}

/** The warm rim: the lamps' orange from behind and a little above, edging each figure on the side away from the lens. */
function warmRim(): DirectionalLight {
  const light = new DirectionalLight(0xffa35e, 0.95);
  light.name = 'yrp-warm-rim';
  light.position.set(-1.5, 5.5, -13);
  light.target.position.set(0.5, 1.4, -1.5);
  light.castShadow = false;
  return light;
}

/**
 * The scene: Chapter IV's chamber (`./bevelle-underground.ts`, aligned to the new `idle`), restaged and re-lit, with the skin of toon models on its actors where the models are on disk. The models load before the scene is
 * handed back (a fight does not open on a half-loaded figure), in parallel; a file that is not there is replaced by the neutral capsule.
 */
export const buildExpYrp3dStageScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildBevelleUndergroundScene({ ...opts, cameraRef: RIGS['idle']!.position as [number, number, number] });
  movePools(base.group);
  const key = toonKey(base.lights.key);
  const rim = warmRim();
  base.group.add(key, key.target, rim, rim.target);

  const search = typeof location === 'undefined' ? '' : location.search;
  let skin: { update(dt: number): void; dispose(): void } | null = null;
  let directed: SceneStaging['shotDirector'] = YRP_SHOT_DIRECTOR;
  if (!paintedForced(search)) {
    const [{ YrpSkin }, { loadYrpModels }] = await Promise.all([import('../engine/yrp3d/skin.ts'), import('../engine/yrp3d/model.ts')]);
    const heights = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, bahamut: BOSS_HEIGHT };
    const models = await loadYrpModels({ base: import.meta.env.BASE_URL, dir: YRP_MODEL_DIR, heights, warn: (m) => console.warn(m) });
    const made = new YrpSkin({ host: base.group, models });
    skin = made;
    directed = tapDirector(YRP_SHOT_DIRECTOR, made.listener); // the beats also start the models' clips (attack and cast), and put the strike on the blow
    if (import.meta.env.DEV) (globalThis as { __yrp3d?: unknown }).__yrp3d = { skin: made, models }; // the debug handle (a dev server only)
  }

  return derive(base, {
    rigs: toRigs() as SceneBuild['rigs'],
    partySlots: PARTY_SLOTS.map(toVec),
    enemySlots: ENEMY_SLOTS.map(toVec),
    partyHeight: PARTY_HEIGHT,
    enemyHeight: BOSS_HEIGHT,
    ...STAGING,
    ...(directed ? { shotDirector: directed } : {}),
    update(dt: number): void {
      base.update(dt);
      skin?.update(dt);
    },
    dispose(): void {
      const g = globalThis as { __yrp3d?: { skin?: unknown } };
      if (skin && g.__yrp3d?.skin === skin) delete g.__yrp3d; // not a newer scene's handle
      skin?.dispose();
      base.dispose();
    },
  });
};

/** The scene-table row: real (the factory wins); `build` is the unreachable demo diorama, as for every scene with a factory of its own. */
export const EXP_YRP_SCENE_ENTRY: SceneEntry = {
  key: EXP_YRP_SCENE,
  title: 'Bevelle Underground — Bahamut, in 3D (experimental)',
  build: buildDemoScene,
  slots: EXP_YRP_SLOTS,
  placeholder: false,
};
