/**
 * `window.__pyrefly.govern`: the frame-budget governor's state and a hand on its level (lane "perf-trim"; captures and the cost harness only, nothing the game reads).
 *
 * - `govern()`: the host's report (mode, whether it is acting, the levers now, the governor's last judgement and its log of steps);
 * - `govern(level)`: hold the level (0 to 3) until `govern(null)`; the levers fade there, the governor stops stepping on its own;
 * - `govern.live()`: the lever cells the consumers read (`engine/governor/GovernorLive.ts`);
 * - `govern.enable(false)`: the governor off as if `?govern=off` (the cost harness's `before`); `govern.tilt(false)`: run the two copy-only tilt-shift passes again, as r63-int did.
 */
import { demoGovernor } from '../engine/governor/DemoGovernor.ts';
import { govLive } from '../engine/governor/GovernorLive.ts';
import { lookTrim } from '../engine/look/LookPost.ts';

export function installGovernDebug(api: Record<string, unknown>): void {
  const govern = (level?: 0 | 1 | 2 | 3 | null): Record<string, unknown> => {
    if (level !== undefined) demoGovernor.pinLevel = level === null ? null : (Math.min(3, Math.max(0, Math.round(level))) as 0 | 1 | 2 | 3);
    return demoGovernor.report();
  };
  govern.live = (): typeof govLive => ({ ...govLive });
  govern.enable = (on: boolean): void => {
    demoGovernor.disabled = !on;
  };
  govern.tilt = (on: boolean): void => {
    lookTrim.tilt = on;
  };
  api['govern'] = govern;
}
