/**
 * **The pose latch and the render hook**: how the replayed FFX camera gets onto the screen **after** everything else has aimed the camera that frame (`./sink.ts` says it must).
 *
 * `BattleCamera.update` writes the camera's position, aim and roll every frame, and the painted game's MAX mix then puts a view offset on it; a pose the director wrote earlier in the frame would be
 * overwritten before it was drawn. So the director's sink is a {@link PoseLatch}: `apply` only **keeps** the newest pose (and counts it), and the camera is written by {@link PoseLatch.present}, which the
 * scene calls from the three.js `Scene`'s `onBeforeRender`: `WebGLRenderer.render` calls it after the scene and the camera's matrices are updated and **before** it reads the camera's matrices for the frustum
 * and the draw (`WebGLRenderer.js`: `scene.onBeforeRender(...)`, then `_projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)`), so whatever the sink writes there is exactly
 * what the frame draws, and the composer's render pass reaches it through `renderer.render`.
 *
 * - **One pose, however many renders.** A frame may render the scene more than once (a mask pass, the post chain's own passes): the hook writes the same latched pose each time, and only for the camera it was
 *   hooked to (`renderer.render(scene, other)` is left alone).
 * - **A pose per logic step.** The director steps at 29.97 Hz and a display runs faster, so the same pose is shown on consecutive frames: FFX's own camera is a 30 Hz one (nothing is interpolated, and a hard
 *   cut stays a cut).
 * - **Variant B** is a {@link PoseFilter} between the latch and the sink (`./variant.ts`): the director and its programs see the unfiltered pose, the screen sees the filtered one.
 * - **Before the first pose** (the director has not started a program) the hook does nothing and the scene's own camera plays.
 *
 * Game case: FFX only (the latch is published only by the hidden Fayth chapter's scene).
 */

import type { Camera, Scene } from 'three';
import type { CameraSink } from './sink.ts';
import type { CameraPose } from './solver.ts';
import type { PoseFilter } from './variant.ts';

export class PoseLatch implements CameraSink {
  private pose: CameraPose | null = null;
  private target: CameraSink | null = null;
  /** Poses the director has published, and writes the camera has had: a logged frame's proof of the order (`published` rises in the logic, `presented` at the render). */
  published = 0;
  presented = 0;

  constructor(private readonly filter: PoseFilter | null = null) {}

  /** Where {@link present} writes (a `ThreeCameraSink` on the real camera); null unbinds it. */
  bind(target: CameraSink | null): void {
    this.target = target;
  }

  /** The director's publish: keep the newest pose. Never touches the camera. */
  apply(pose: CameraPose): void {
    this.pose = pose;
    this.published += 1;
  }

  /** The newest pose the director has published, unfiltered. */
  get latest(): CameraPose | null {
    return this.pose;
  }

  /** The pose the screen will show (the newest, through the filter), or null before the first. */
  get shown(): CameraPose | null {
    return this.pose && this.filter ? this.filter(this.pose) : this.pose;
  }

  /** Write the camera now. True when a pose was written. Call it only after every other camera writer of the frame. */
  present(): boolean {
    const pose = this.shown;
    if (!pose || !this.target) return false;
    this.target.apply(pose);
    this.presented += 1;
    return true;
  }
}

/**
 * Run `present` at the head of every render of `scene` that uses `camera` (the scene's `onBeforeRender`, chained after any hook already there). Returns the function that takes the hook off again, which
 * puts back what it found: nothing else that hooked the scene since is disturbed unless it chained on ours (then ours stays as a no-op wrapper).
 */
export function hookBeforeRender(scene: Scene, camera: Camera, present: () => void): () => void {
  const previous = scene.onBeforeRender;
  let live = true;
  // `Scene` inherits `Object3D`'s six-parameter type; `WebGLRenderer.render` calls the scene's with four (renderer, scene, camera, render target), so the last two are whatever it passes.
  const hook: Scene['onBeforeRender'] = function (this: Scene, ...args: Parameters<Scene['onBeforeRender']>) {
    previous.apply(this, args);
    if (live && args[2] === camera) present();
  };
  scene.onBeforeRender = hook;
  return () => {
    live = false;
    if (scene.onBeforeRender === hook) scene.onBeforeRender = previous;
  };
}
