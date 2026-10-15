/**
 * **Test kit for the FFX camera director** (`src/engine/ffxcam/director.ts`): a sink that records the poses it is given, a clock the test winds, and the fake contexts `BattleMoments` hands a shot
 * director. The program builders and the world are `./ffxcamKit.ts`.
 *
 * Game case: FFX only.
 */
import type { Camera, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { CameraPort, PlaybackSpeed } from '../../../src/engine/BattlePresenterPorts.ts';
import type { ShotCtx, ShotSubject } from '../../../src/engine/ShotDirector.ts';
import type { FrameClock } from '../../../src/engine/ffxcam/director.ts';
import type { CameraSink } from '../../../src/engine/ffxcam/sink.ts';
import type { CameraPose } from '../../../src/engine/ffxcam/solver.ts';

export class RecordingSink implements CameraSink {
  readonly poses: CameraPose[] = [];
  apply(pose: CameraPose): void {
    this.poses.push(pose);
  }
  get last(): CameraPose {
    const p = this.poses[this.poses.length - 1];
    if (!p) throw new Error('the sink has received no pose');
    return p;
  }
}

export class ManualClock implements FrameClock {
  t = 0;
  now(): number {
    return this.t;
  }
}

/** The playback scale `BattleMoments.ms` applies (`SPEED_SCALE`). */
const SCALE: Record<PlaybackSpeed, number> = { normal: 1, fast: 0.32, skip: 0 };

/** A beat's common context at a playback speed. */
export function shotCtx(speed: PlaybackSpeed = 'normal'): ShotCtx {
  return { camera: {} as CameraPort, speed, skipping: speed === 'skip', ms: (base) => base * SCALE[speed] };
}

export const subject = (id: string, side: ShotSubject['side']): ShotSubject => ({ id, side });

/**
 * The head of `WebGLRenderer.render` in three r186 (`WebGLRenderer.js`: update the scene's and the camera's matrices, call `scene.onBeforeRender`, then compute the frustum from the camera's
 * `projectionMatrix` and `matrixWorldInverse`): a draw reads the camera after the hook. Records what each render saw of the camera.
 */
export class HeadOfRender {
  readonly drawn: Array<{ position: number[]; fov: number; viewEnabled: boolean; inverse: number[] }> = [];
  render(scene: Scene, camera: Camera): void {
    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();
    scene.onBeforeRender(this as unknown as WebGLRenderer, scene, camera, null as never, null as never, null as never);
    const cam = camera as PerspectiveCamera;
    this.drawn.push({ position: cam.position.toArray(), fov: cam.fov, viewEnabled: cam.view?.enabled === true, inverse: cam.matrixWorldInverse.toArray() });
  }
  get last(): { position: number[]; fov: number; viewEnabled: boolean; inverse: number[] } {
    const d = this.drawn[this.drawn.length - 1];
    if (!d) throw new Error('nothing has been rendered');
    return d;
  }
}
