/**
 * **The hidden Fayth chapter's camera on FFX's own programs** (`FaythCamera`): FFX's camera director (`./director.ts`) in the shape the scene publishes it, on a dev server with Bailey's local camera folder. The
 * scene (`../../scenes/exp-fayth-camera.ts`) builds one, publishes {@link FaythCamera.shotDirector} as `SceneStaging.shotDirector` and calls {@link FaythCamera.update} once a frame with the frame's `dt`; this file
 * is pure (no `three`, no DOM) and so runs in Node against the presenter's fakes.
 *
 * Everything the camera owes that does not depend on how a shot is made (time, the roster, the launch fallback, the airship's range scenes, the defeat, the tracking net) is `./cameraCore.ts`'s, shared with the
 * website's table camera (`./tableCamera.ts`). What is the VM's, and so here:
 *
 * - **The roster and the frames.** The director's host is given {@link FAYTH_ROSTER} (our combatant ids against FFX's character numbers; each player character is the party or the reserve by whether it is on the
 *   field, `rosterFor`) and a live frame source over the scene's actors (`./frames.ts`), so a shot framed on "the targets" follows the figures. **Their camHeight and camWidth are the game's own** when the camera
 *   folder has them (`./extents.ts`: Proven), else what the models measure (a fit).
 * - **The FAR fit** (`./farFit.ts`): the script's FAR look-at is moved along the deck to the party's column.
 * - **The whole-fight programs**: the ones the book answers Enter, the airship scene, the victory and the defeat with.
 *
 * Game case: FFX only.
 */

import type { FfxCameraPrograms } from './book.ts';
import { CameraCore, HOLD_CAP_STEPS, type FaythCameraWorld } from './cameraCore.ts';
import { FfxCameraDirector } from './director.ts';
import { farFit } from './farFit.ts';
import { frameSource } from './frames.ts';
import type { Vec3 } from './ir.ts';
import { FAYTH_ROSTER, rosterFor } from './roster.ts';
import type { HomeView, NetEvent } from './safetyNet.ts';
import type { CameraSink } from './sink.ts';

export { HOLD_CAP_STEPS };
export type { FaythCameraWorld };

/** The tags whose programs are views of the whole fight: Enter (the default view), the airship scene, the victory and the defeat. */
const WHOLE_FIGHT_TAGS: readonly number[] = [24, 0, 66, 67];

export interface FaythCameraOptions {
  readonly programs: FfxCameraPrograms;
  /** Where the director publishes its pose (a `PoseLatch`: the camera is written at render time). */
  readonly sink: CameraSink;
  readonly world: FaythCameraWorld;
  /** The camera's own dice (the battle's seed is fine: the sources are separate). */
  readonly seed?: number;
  readonly warn?: (message: string) => void;
  /** FFX's two default views: with them the tracking safety net is on (it needs a view to re-aim); without, the pose goes to the sink as the programs say it. */
  readonly homes?: { readonly near: HomeView; readonly far: HomeView };
  /** False turns the net off even with `homes` (the comparison mode). */
  readonly net?: boolean;
  /** The FAR look-at of the script and the party's slots: with them the FAR fit is on (`./farFit.ts`). */
  readonly farFit?: { readonly ref: Vec3; readonly party: readonly Vec3[] };
  /** Where the net's events go (default: a dev `console.info`). */
  readonly netLog?: (event: NetEvent) => void;
}

export class FaythCamera extends CameraCore<FfxCameraDirector> {
  readonly director: FfxCameraDirector;

  constructor(opts: FaythCameraOptions) {
    const made: { director?: FfxCameraDirector } = {};
    super({
      makeBackend: (sink) =>
        (made.director = new FfxCameraDirector({
          programs: opts.programs,
          sink,
          ...(opts.seed === undefined ? {} : { seed: opts.seed }),
          ...(opts.warn ? { warn: opts.warn } : {}),
          ...(opts.farFit ? { rewriteCall: farFit(opts.farFit.ref, opts.farFit.party) } : {}),
        })),
      sink: opts.sink,
      world: opts.world,
      wholeFight: new Set(WHOLE_FIGHT_TAGS.map((tag) => opts.programs.book.forTag(tag)?.id).filter((id): id is string => id !== undefined)),
      onLineup: (ids) => made.director?.host.setRoster(rosterFor(ids)),
      ...(opts.homes ? { homes: opts.homes } : {}),
      ...(opts.net === undefined ? {} : { net: opts.net }),
      ...(opts.warn ? { warn: opts.warn } : {}),
      ...(opts.netLog ? { netLog: opts.netLog } : {}),
    });
    this.director = this.backend;
    this.director.host.setRoster(FAYTH_ROSTER);
    this.director.host.setSource(frameSource(FAYTH_ROSTER, (id) => opts.world.actor(id), (chr) => opts.programs.extents[String(chr)]));
  }
}
