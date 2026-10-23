/**
 * **The hidden 3D Bahamut chapter's scene, the real-models version** (`../data/chapter-exp-yrp-3d.ts`; branch `exp-yrp-real`; FFX-2 only): Chapter IV's chamber (the Bevelle underground: the painted plate and wings, the machina deck, the torn hole, the lamps, the
 * shafts) under **end-state frame A, "classic, now in 3D"** (Bailey's picked target, art room image p_2e12f3ab, kept out of the repo and never shipped): a high three-quarter camera, the trio in a loose diagonal on the right facing left (Paine at the
 * back, Rikku in the middle, Yuna at the front), Bahamut filling the left half with his wings spread, calm floor along the bottom for the HUD. Frame B's low, close view is the `action` rig, and frame C's (behind and
 * above the trio as Bahamut rears with his orb) the `overdrive` rig the shot director takes for Mega Flare (`../engine/yrp3d/director.ts`). The numbers are `../engine/yrp3d/layout.ts`'s (pure, and pinned by `tests/unit/yrp3d/layout.test.ts` without a browser).
 *
 * **Framing mockups** (opt-in, dev): `?frame=b` and `?frame=c` replace the resting shots (`idle`, `intro`) with two closer views, the girls at about 35 and 44 percent of the frame's height (`../engine/yrp3d/frames.ts`);
 * no query is frame A, the approved layout, unchanged.
 *
 * Game case: FFX-2 only [AGENTS.md rule 14; research/ffx2-bahamut.md]. It is Chapter IV's room (`./bevelle-underground.ts`, built by that factory and not touched), so the painting, the lamps and the set pieces are
 * Chapter IV's; what this scene changes is the staging, the camera and **the look** (the girls must read clearly in the arena: Bailey found the first in-game shots too dark, too blue and too small), and what it adds is the figures'
 * light and the skin that carries the real models:
 *
 * - **Staging.** The party's three slots, Bahamut's spot and the reserve spots are frame A's; the girls stand at 1.9 and Bahamut at 5.0 (`PARTY_HEIGHT`, `BOSS_HEIGHT`); bodies face each other along x (the party toward -x,
 *   Bahamut toward +x: `SceneStaging.sideFacing`, the switch FF7's reactor and the hidden Fayth chapter use); `holdParty` keeps the stage's relaxation off the row. The light pools under the figures move with them.
 * - **The camera.** `idle`, `intro`, `action`, `party`, `enemy`, `bahamut` and `victory` are `RIGS` (the names Chapter IV's presenter and script ask for); the close shots take a long lens from further back and none is tighter
 *   than waist-up. The painting's parallax stack is aligned for the new `idle` (`SceneBuildOptions.cameraRef`), so the bands register at rest.
 * - **Light.** The soft studio of the turntable sheets Bailey liked, as one table (`LOOK`, `../engine/yrp3d/look.ts`; built by `rig.ts`): a neutral-warm key from the front left and above, a cool-neutral fill, a soft rim from behind and
 *   a grey world (an ambient light), none casting a shadow, fixed in the world from frame A's camera and on the figure layer too (the floor's mirror). Chapter IV's own cyan key, cold fill, rust rim and dark-blue ambient, which
 *   light every real surface, are taken down to `LOOK.room`'s share (none: with the deck hidden the figures are the only lit things in the room), so nothing of the arena's blue swamps them; the lamps and the hit-and-cast flash
 *   stay. Fog does not reach the figures.
 * - **The stage's look** (`../engine/yrp3d/stageLook.ts`, brought over from the look lab's branch without its toon material, ink or stepped motion): the wet tile floor with the lantern streaks and the figures reflected in place
 *   of the deck, a soft contact shadow under each figure, and a neutral grade that encodes (Bailey called the first in-game stage "very dark with heavy post-processing"). `?yrp=painted` keeps Chapter IV's room, lights and grade.
 * - **The models.** `../engine/yrp3d/` (loaded on use, so no other chapter carries it): the real FFX-2 Yuna, Rikku and Paine, `public/models-exp/yrp-hd/` (4x textures, one subdivision level) when their file is there and
 *   `public/models-exp/yrp/` when not, with their own battle motions, on the stage's actors, with the painted planes switched off. `?models=base` takes the base folder alone (the comparison between the two). **The boss is the
 *   AI-made Bahamut playing the game's own Bahamut clips** (the v2 rig, `bahamut-ai-rigged.glb` and `bahamut-ai-anims.glb`; his own physically based look; frame A's size and place); `?bossrig=simple`, or a disk without the
 *   rigged files, keeps his first motion (`bahamut-ai.glb`, the procedural wing flap and breath); `?boss=real` fights the game's own (`bahamut.glb`, his real clips at 4x). A slot whose file is missing stands on a neutral capsule, so the
 *   chapter always plays. `?yrp=painted` keeps every figure a painted billboard (the comparison with the paintings).
 *
 * The upright phone is not staged (Chapter IV's phone rig and slice fit are for its own layout); this chapter is a desktop experiment.
 */

import { Vector3, type DirectionalLight, type Light, type Object3D } from 'three';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { tapDirector } from '../engine/yrp3d/beats.ts';
import { YRP_SHOT_DIRECTOR } from '../engine/yrp3d/director.ts';
import { DEFAULT_FRAME, frameChoice, partySlotsFor, rigsFor, type FrameName } from '../engine/yrp3d/frames.ts';
import { BOSS_HEIGHT, BOSS_SPOT, ENEMY_SLOTS, PARTY_HEIGHT, YRP_BOSS_ID, YRP_CAST, bossChoice, type RigData, type V3 } from '../engine/yrp3d/layout.ts';
import { LOOK, mergeRig, type Rig, type RigPatch } from '../engine/yrp3d/look.ts';
import type { RoomDim } from '../engine/yrp3d/rig.ts';
import type { YrpModels } from '../engine/yrp3d/load.ts';
import { EXP_YRP_SCENE, YRP_MODEL_DIRS } from '../data/yrp-ids.ts';
import { buildDemoScene } from './demo.ts';
import { buildBevelleUndergroundScene } from './bevelle-underground.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
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
const toRigs = (table: Readonly<Record<string, RigData>>): Record<string, CameraRig> => Object.fromEntries(Object.entries(table).map(([k, v]) => [k, toRig(v)]));
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
  party: partySlotsFor(DEFAULT_FRAME).slice(0, 3).map(toSpot), // the default frame's (a page that asks for `?frame=a` or `c` gets its own, from the build below)
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
function movePools(group: Object3D, slots: readonly V3[]): void {
  const pools = group.children.filter((c) => c.name === 'light-pool');
  pools.slice(0, 3).forEach((p, i) => p.position.set(slots[i]![0], 0.02, slots[i]![2] - 0.55)); // behind the slot, as Chapter IV's are
  group.getObjectByName('enemy-pool')?.position.set(BOSS_SPOT[0], 0.018, BOSS_SPOT[2]);
  group.getObjectByName('enemy-reflection')?.position.set(BOSS_SPOT[0], 0.016, BOSS_SPOT[2] + 2.6);
}

/**
 * The scene: Chapter IV's chamber (`./bevelle-underground.ts`, aligned to the new `idle`), restaged, with the skin of real models on its actors where the models are on disk and the stage's look and the figures' light around
 * them (`../engine/yrp3d/look.ts`, `rig.ts`, `stageLook.ts`). The models load before the scene is handed back (a fight does not open on a half-loaded figure), in parallel; a file that is not there is replaced by the neutral
 * capsule. `?yrp=painted` leaves Chapter IV's room, lights and grade exactly as they were.
 */
export const buildExpYrp3dStageScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const search = typeof location === 'undefined' ? '' : location.search;
  const frame: FrameName = frameChoice(search); // frame b unless the page asks for `?frame=a` (the old framing) or `?frame=c` (`../engine/yrp3d/frames.ts`)
  const frameRigs = rigsFor(frame);
  const frameSlots = partySlotsFor(frame);
  const base = await buildBevelleUndergroundScene({ ...opts, cameraRef: frameRigs['idle']!.position as [number, number, number] });
  movePools(base.group, frameSlots);

  let skin: { update(dt: number): void; dispose(): void } | null = null;
  let look: { follow(models: YrpModels['models']): void; dispose(): void; palette: ScenePalette } | null = null;
  let room: RoomDim | null = null;
  let followed: YrpModels['models'] | null = null;
  let figureLights: Light[] = [];
  let directed: SceneStaging['shotDirector'] = YRP_SHOT_DIRECTOR;
  if (!paintedForced(search)) {
    const [{ YrpSkin }, { loadYrpModels, modelDirs }, { applyStage }, rig] = await Promise.all([
      import('../engine/yrp3d/skin.ts'),
      import('../engine/yrp3d/load.ts'),
      import('../engine/yrp3d/stageLook.ts'),
      import('../engine/yrp3d/rig.ts'),
    ]);
    const heights = { yuna: PARTY_HEIGHT, rikku: PARTY_HEIGHT, paine: PARTY_HEIGHT, bahamut: BOSS_HEIGHT };
    const models = await loadYrpModels({ base: import.meta.env.BASE_URL, dirs: modelDirs(search, YRP_MODEL_DIRS), choice: bossChoice(search), heights, warn: (m) => console.warn(m) });
    const made = new YrpSkin({ host: base.group, models });
    skin = made;
    followed = models.models;
    figureLights = rig.figureLights();
    for (const light of figureLights) base.group.add(light, ...((light as DirectionalLight).target ? [(light as DirectionalLight).target] : [])); // the studio's three suns and its grey world (`LOOK.rig`)
    room = rig.dimRoom(base.group, base.lights); // the chamber's own cyan, cold and rust light no longer swamps them (`LOOK.room`)
    const stage = applyStage(base.group, base.backdrop.group, YRP_CAST);
    look = stage;
    directed = tapDirector(YRP_SHOT_DIRECTOR, made.listener, new Set([YRP_BOSS_ID])); // the beats also start the models' clips (attack and cast), and put the strike on the blow; Bahamut's attack waits for its rear-up (`beats.ts`)
    if (import.meta.env.DEV) {
      let current: Rig = LOOK.rig;
      const tune = (patch: RigPatch): Rig => (rig.setRig(figureLights, (current = mergeRig(current, patch))), current); // `__yrp3d.tune({ key: { intensity: 2.4 } })`: the light, live
      (globalThis as { __yrp3d?: unknown }).__yrp3d = { skin: made, models, stage, tune, look: LOOK }; // the debug handle (a dev server only)
    }
  }

  return derive(base, {
    rigs: toRigs(frameRigs) as SceneBuild['rigs'],
    partySlots: frameSlots.map(toVec),
    enemySlots: ENEMY_SLOTS.map(toVec),
    partyHeight: PARTY_HEIGHT,
    enemyHeight: BOSS_HEIGHT,
    ...STAGING,
    ...(directed ? { shotDirector: directed } : {}),
    ...(look ? { palette: look.palette } : {}), // the stage's own grade; the painted comparison keeps Chapter IV's
    update(dt: number): void {
      base.update(dt);
      room?.apply(); // after the scene set its lamps' flicker for this frame
      skin?.update(dt);
      if (followed) look?.follow(followed); // after the skin: the discs go under the figures where the presenter put them this frame
    },
    dispose(): void {
      const g = globalThis as { __yrp3d?: { skin?: unknown } };
      if (skin && g.__yrp3d?.skin === skin) delete g.__yrp3d; // not a newer scene's handle
      look?.dispose();
      room?.restore();
      for (const light of figureLights) {
        (light as DirectionalLight).target?.removeFromParent();
        light.removeFromParent();
        light.dispose();
      }
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
