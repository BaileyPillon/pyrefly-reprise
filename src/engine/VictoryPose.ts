/**
 * A-4, the victory pose where the sources give one and the held stance where
 * they withhold it (iteration 2 B2 part 1: the port; the presenter side reads
 * it in `BattlePresenterBeats.victory`).
 *
 * - `'pose'`: today's behaviour and the default. The party (and an aeon)
 *   strike their victory painting to the fanfare.
 * - `'hold'`: the figures keep their battle stance and the victory cue stays
 *   quiet; the camera still settles on the victory rig. The sources withhold
 *   the celebration after Zanarkand (FFX Ch II), Bahamut (FFX-2 Ch IV) and
 *   Shuyin (FFX-2 Ch V), and our estimate adds Trema (FFX-2 Ch XIII, C-7):
 *   research/ffx-vs-ffx2-presentation.md §2.1 and §2.2.
 *
 * The value is per chapter and is **passed in** by the screen (B5 sets it from
 * chapter-meta); the presenter never reads it from the DOM. No DOM, no `three`.
 */

export type VictoryPose = 'pose' | 'hold';

export const VICTORY_POSES: readonly VictoryPose[] = ['pose', 'hold'];

/** The victory pose a presenter's deps ask for; anything but `'hold'` is the default `'pose'`. */
export function victoryPoseOf(deps: { victoryPose?: VictoryPose | null | undefined }): VictoryPose {
  return deps.victoryPose === 'hold' ? 'hold' : 'pose';
}
