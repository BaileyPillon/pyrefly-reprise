import { Matrix4, type Camera } from 'three';
import { headLockOff } from './HeadLock.ts';

/**
 * **The engine keeps the head steady: the stage's half** (D-510, both games; maths in `HeadLock.ts`, the plane's half is `PaintedActor.holdHead`).
 *
 * Once a frame, after every actor has moved (`PaintedActor.update`), the stage hands each of them this frame's view-projection and
 * each one holds the heads of the planes it shows to the idle's on screen. The camera is passed in, not kept: an actor never holds one
 * (`PaintedActor` harvests the azimuth in `onBeforeRender` for the same reason), and a cutscene, a portrait or the title, which never
 * call this, are never touched. `?headlock=off` leaves every plane at the table's scale (captures and A/B comparisons).
 */

const view = new Matrix4();

/** The one thing the pass needs of a staged figure. */
interface Holds {
  actor: { holdHead?(view: Matrix4): void };
}

/** Hold every figure's heads for this frame. `camera` is the one the frame is rendered with (`PaintedStage.opts.camera`). */
export function holdHeads(staged: Iterable<Holds>, camera: Camera): void {
  if (headLockOff()) return;
  camera.updateMatrixWorld(); // the rig has set this frame's position and look-at; the renderer would only update the matrices after the actors have moved
  view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  for (const s of staged) s.actor.holdHead?.(view);
}
