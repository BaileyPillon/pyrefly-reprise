/**
 * `window.__pyrefly.swap(mode?)`: the pose-swap smoothing switch (W5, pose continuity; both games; captures and checks only).
 *
 * `swap()` returns the mode in force (`'today'` or `'smooth'`, from `?swap=` or `POSE_SWAP_DEFAULT`); `swap('smooth')` and `swap('today')` set it for the actors that change
 * pose from now on, the lunges that start from now on, and the frame clock's clamp (1/40 s or 1/20 s). A page normally just takes `?swap=smooth` in its address.
 */
import type { App } from '../app/App.ts';
import { frameClockMax, poseSwapLog, poseSwapMode, poseSwapStats, resetPoseSwapStats, setPoseSwapMode, type PoseSwapMode, type PoseSwapRecord, type PoseSwapStats } from '../engine/PoseSwap.ts';

export function installPoseSwapDebug(api: Record<string, unknown>, app: Pick<App, 'setMaxDelta'>): void {
  api['swap'] = (mode?: PoseSwapMode): PoseSwapMode => {
    if (mode === 'today' || mode === 'smooth') {
      setPoseSwapMode(mode);
      app.setMaxDelta(frameClockMax(mode));
    }
    return poseSwapMode();
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
