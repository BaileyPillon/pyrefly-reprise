/**
 * `window.__pyrefly.motionMode(mode?)` and `window.__pyrefly.swap(mode?)`: the pose-motion switches (W5, pose continuity; both games; captures and checks only).
 *
 * `motionMode()` returns the mode in force (`'smooth'`, the default, or `'classic'`, from `?motion=`); `motionMode('classic')` and `motionMode('smooth')` set it for the lunges that start
 * from now on and for the battle field's animation clock (clamped at 1/40 s or 1/20 s; the next frame reads it, and every timer keeps 1/20 s either way). `swap()` returns `'aligned'` or `'off'` (from `?swap=aligned`, off by default); `swap('aligned')` and `swap('off')` set
 * the aligned dissolve for the actors that change pose from now on. A page normally just takes the switch in its address.
 */
import {
  alignedSwapOn,
  motionMode,
  poseSwapLog,
  poseSwapStats,
  resetPoseSwapStats,
  setAlignedSwap,
  setMotionMode,
  type MotionMode,
  type PoseSwapRecord,
  type PoseSwapStats,
} from '../engine/PoseSwap.ts';

export function installPoseSwapDebug(api: Record<string, unknown>): void {
  api['motionMode'] = (mode?: MotionMode): MotionMode => {
    if (mode === 'smooth' || mode === 'classic') setMotionMode(mode);
    return motionMode();
  };
  api['swap'] = (mode?: 'aligned' | 'off'): 'aligned' | 'off' => {
    if (mode === 'aligned' || mode === 'off') setAlignedSwap(mode === 'aligned');
    return alignedSwapOn() ? 'aligned' : 'off';
  };
  api['swapStats'] = (reset = false): PoseSwapStats => {
    const now = poseSwapStats();
    if (reset) {
      resetPoseSwapStats();
      poseSwapLog(true);
    }
    return now;
  };
  api['swapLog'] = (reset = false): PoseSwapRecord[] => poseSwapLog(reset);
}
