/**
 * **FFX's own battle camera on the hidden Fayth chapter's scene** (FFX only; `docs/plans/fayth-3d.md` phase 4b). What the deck scene does on a **dev server** once a skin is staged, and only there:
 * `./exp-fayth-deck.ts` reaches this file through a dynamic `import()` inside `import.meta.env.DEV`, so a production build neither contains it nor the camera loader behind it.
 *
 * - **No programs, no change.** `loadFfxCameraPrograms('evrae')` (`../engine/ffxcam/load.ts`) returns null on the website, in production, in every test and on a dev server without Bailey's local camera folder:
 *   `stageFaythCamera` then returns the build it was given, with the stub director on it, and nothing differs. So it does when no skin was staged (`?skin=classic`, no converted models and no `?skin=`): the
 *   camera programs are written in FFX's stage coordinates, which only the two skins stand things at.
 * - **With programs, the director is published** as `SceneStaging.shotDirector` in place of the stub, for **both skins** (`ffx` and `?skin=painted`): `BattleMoments` asks it at every beat
 *   (`../engine/ShotDirector.ts`) and the FFX camera plays. `?ffxcam=a|b` picks the test mode (D-632): A (the default) is every angle as FFX has it, B clamps the camera's azimuth about its look-at point to
 *   +-35 degrees of the near default view's (`../engine/ffxcam/variant.ts`).
 * - **The camera is written last.** The game's own camera writers run in the frame in this order: this scene's `update`, then `BattleCamera.update` (position, aim and roll, **every frame**), then the MAX mix
 *   (`framing.applyLens`: a view offset), then the render. The director's pose is therefore only **kept** by its sink (`PoseLatch`) and written by the sink at the head of the render: the scene's three.js
 *   `Scene.onBeforeRender` (`hookBeforeRender`), which `WebGLRenderer.render` calls after the matrices are updated and before it reads them. The sink also **clears the view offset**: CHAPTER FRAMING's lens
 *   shift is for the painted game's HUD, FFX's shot fills the frame, and the chapter has no switch to opt out of the mix (`fx/mix/*` is shared, so nothing there is touched).
 * - **The world it frames** is read live: the actors by name among the scene's children (as the skin finds them), their positions mapped back to FFX's frame, the models' extents, the range director's current
 *   range (`airshipRangeDirectorOf`), the party's fall. `../engine/ffxcam/faythCamera.ts` has the rest.
 *
 * Under `import.meta.env.DEV` a handle, `__ffxcam`, is left on `globalThis` for captures and checks (the director, the latch, the variant); it is not there in production.
 *
 * Game case: FFX only.
 */

import { Scene, type PerspectiveCamera } from 'three';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { FaythCamera, type FaythCameraWorld } from '../engine/ffxcam/faythCamera.ts';
import type { CameraActor } from '../engine/ffxcam/frames.ts';
import { PoseLatch, hookBeforeRender } from '../engine/ffxcam/latch.ts';
import { loadFfxCameraPrograms } from '../engine/ffxcam/load.ts';
import { FAYTH_ACTIVE_PARTY } from '../engine/ffxcam/roster.ts';
import { ThreeCameraSink } from '../engine/ffxcam/sink.ts';
import { ffxCamVariantOf, variantFilter, type FfxCamVariant } from '../engine/ffxcam/variant.ts';
import { FFX_NEAR_VIEW } from '../engine/ffx3d/ffxStaging.ts';
import { ffxWorldMatrix } from '../engine/ffx3d/ffxWorld.ts';
import type { FfxSkin } from '../engine/ffx3d/ffxSkin.ts';
import { airshipRangeDirectorOf } from './evrae-airship-director.ts';
import { derive, skinOf } from './exp-fayth-skin.ts';
import type { SceneBuild } from './types.ts';

/** The encounter's folder under the dev route's `camera/` (`D:\Tools\ffx-parity\assets\runtime\camera\evrae\`). */
const CAMERA_ENCOUNTER = 'evrae';

/** What the debug handle `globalThis.__ffxcam` holds (dev server only). */
export interface FaythCameraHandle {
  readonly camera: FaythCamera;
  readonly latch: PoseLatch;
  readonly variant: FfxCamVariant;
  /** The three.js camera the pose is written on, once the battle camera is bound. */
  readonly target: () => PerspectiveCamera | null;
}

/**
 * How a battle actor is read by the camera: live, so a lunging figure is followed. `model()`: the `ffx` skin's model of this actor, whose extents are the figure's (asked each time: the skin attaches a model a frame
 * after the actor appears); null for a painted billboard, which is framed by its painting.
 */
export function viewOf(actor: PaintedActor, model: () => { height: number; width: number } | null): CameraActor {
  return {
    get position() {
      return actor.position;
    },
    get facingDir() {
      return actor.facingDir;
    },
    get height() {
      return model()?.height ?? actor.height * actor.scale.y;
    },
    get width() {
      return model()?.width ?? actor.poseSize[0] * actor.scale.x;
    },
  };
}

/** The scene's world as the camera reads it: the actors among the scene's children (found by name, as `FfxSkin` finds them), the range director's range, the party's fall. */
function worldOf(build: SceneBuild, skin: FfxSkin | null): FaythCameraWorld {
  const range = airshipRangeDirectorOf(build.group);
  const views = new Map<PaintedActor, CameraActor>();
  const find = (id: string): PaintedActor | undefined => build.group.parent?.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
  return {
    actor(id) {
      const actor = find(id);
      if (!actor) return undefined;
      let view = views.get(actor);
      if (!view) views.set(actor, (view = viewOf(actor, () => skin?.modelOf(id) ?? null)));
      return view;
    },
    range: () => (range ? { current: range.current, shifting: range.shifting } : null),
    partyFallen() {
      const party = FAYTH_ACTIVE_PARTY.map(find).filter((a): a is PaintedActor => a !== undefined);
      return party.length > 0 && party.every((a) => a.pose === 'ko');
    },
  };
}

/**
 * Publish FFX's camera on the staged scene, or return it unchanged. `base` is Chapter VIII's deck with the stub director (`./exp-fayth-deck.ts`), `skinned` what `stageFaythSkin` made of it (the same object when no skin
 * was staged). Resolves to `skinned` when there is no skin or no camera data; otherwise to a derived build with the director, the camera hook and the per-frame update.
 */
export async function stageFaythCamera(base: SceneBuild, skinned: SceneBuild): Promise<SceneBuild> {
  if (skinned === base) return skinned; // no skin staged: the programs' coordinates have nothing to stand on
  const programs = await loadFfxCameraPrograms(CAMERA_ENCOUNTER);
  if (!programs) return skinned;

  const search = typeof location === 'undefined' ? '' : location.search;
  const variant = ffxCamVariantOf(search);
  const latch = new PoseLatch(variantFilter(variant, FFX_NEAR_VIEW.thetaDeg));
  // The camera's own dice (the spells' shot choice): fixed unless `?ffxseed=` says otherwise, so A and B, and two runs, choose the same shots.
  const seed = Number.parseInt(new URLSearchParams(search).get('ffxseed') ?? '', 10);
  const camera = new FaythCamera({ programs, sink: latch, world: worldOf(skinned, skinOf(skinned)), seed: Number.isFinite(seed) ? seed : 1 });
  let target: PerspectiveCamera | null = null;
  let unhook: (() => void) | null = null;

  const unbind = (): void => {
    unhook?.();
    unhook = null;
    latch.bind(null);
    target = null;
  };
  if (import.meta.env.DEV) (globalThis as { __ffxcam?: FaythCameraHandle }).__ffxcam = { camera, latch, variant, target: () => target };

  return derive(skinned, {
    shotDirector: camera.shotDirector,
    bindCamera(c) {
      skinned.bindCamera?.(c);
      unbind();
      const scene = skinned.group.parent;
      if (!c || !(scene instanceof Scene)) return;
      target = c.camera;
      latch.bind(new ThreeCameraSink(c.camera, ffxWorldMatrix(), { clearViewOffset: true }));
      unhook = hookBeforeRender(scene, c.camera, () => latch.present());
    },
    update(dt: number): void {
      skinned.update(dt);
      camera.update(dt);
    },
    dispose(): void {
      camera.dispose();
      unbind();
      const g = globalThis as { __ffxcam?: FaythCameraHandle };
      if (import.meta.env.DEV && g.__ffxcam?.camera === camera) delete g.__ffxcam; // not a newer scene's handle (a retry builds the next scene before the last one is disposed)
      skinned.dispose();
    },
  });
}
