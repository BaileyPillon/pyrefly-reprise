/**
 * **Test kit for the FFX camera director** (`src/engine/ffxcam/director.ts`): a sink that records the poses it is given, a clock the test winds, and the fake contexts `BattleMoments` hands a shot
 * director. The program builders and the world are `./ffxcamKit.ts`.
 *
 * Game case: FFX only.
 */
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
