/**
 * **The hidden Fayth chapter's camera on the website's shot table** (`TableCamera`; FFX only): the table director (`./tableDirector.ts`) in the shape the scene publishes it, beside the dev server's
 * `FaythCamera` (`./faythCamera.ts`, FFX's own programs). Both are `./cameraCore.ts`'s camera, so the time, the roster, the launch fallback, the range scenes, the defeat and the tracking net are the same code;
 * what is the table's is only which shot a beat plays. Production-safe: no local file, no VM, nothing of the programs.
 *
 * The scene (`../../scenes/exp-fayth-table.ts`) builds one, publishes {@link TableCamera.shotDirector} as `SceneStaging.shotDirector` and calls {@link TableCamera.update} once a frame with the frame's `dt`.
 *
 * Game case: FFX only.
 */

import type { EvraeShotTable } from '../../data/ffx/camera/shotTypes.ts';
import { CameraCore, type FaythCameraWorld } from './cameraCore.ts';
import type { HomeView, NetEvent } from './safetyNet.ts';
import type { CameraSink } from './sink.ts';
import { TableDirector } from './tableDirector.ts';

export interface TableCameraOptions {
  readonly table: EvraeShotTable;
  /** Where the pose goes (a `PoseLatch`: the camera is written at render time). */
  readonly sink: CameraSink;
  readonly world: FaythCameraWorld;
  /** The camera's own dice for the shot branches. */
  readonly seed?: number;
  readonly homes?: { readonly near: HomeView; readonly far: HomeView };
  /** False turns the tracking net off even with `homes`. */
  readonly net?: boolean;
  readonly warn?: (message: string) => void;
  readonly netLog?: (event: NetEvent) => void;
  /** Called when a shot starts: its id, the logic step and the beat that asked for it. */
  readonly onStart?: (shot: string, step: number, why: string) => void;
}

export class TableCamera extends CameraCore<TableDirector> {
  readonly director: TableDirector;

  constructor(opts: TableCameraOptions) {
    const made: { director?: TableDirector } = {};
    super({
      makeBackend: (sink) =>
        (made.director = new TableDirector({
          table: opts.table,
          sink,
          ...(opts.seed === undefined ? {} : { seed: opts.seed }),
          range: () => opts.world.range()?.current ?? 'near',
          ...(opts.onStart ? { onStart: opts.onStart } : {}),
        })),
      sink: opts.sink,
      world: opts.world,
      wholeFight: TableDirector.wholeFightShots(opts.table),
      onLineup: (ids) => made.director?.setLineup(ids),
      ...(opts.homes ? { homes: opts.homes } : {}),
      ...(opts.net === undefined ? {} : { net: opts.net }),
      ...(opts.warn ? { warn: opts.warn } : {}),
      ...(opts.netLog ? { netLog: opts.netLog } : {}),
    });
    this.director = this.backend;
  }
}
