/**
 * `window.__pyrefly.poseTrust()`: which character paintings the runtime withholds (pose continuity, 2026-10-16; both games; captures, checks and the critic's probe only).
 *
 * `poseTrust()` lists the paintings a battle has loaded that the install never vouched for (blocked, or never registered), which the actor treats as missing and
 * replaces with the next pose down its chain, ending on the idle (`engine/PoseTrust.ts`). `poseTrust(true)` adds every painting stamped so far. On a tree whose
 * art all passes `tools/pose-gate.mjs` the list is empty.
 */
import { poseTrustReport, type PoseTrustReport } from '../engine/PoseTrust.ts';

export function installPoseTrustDebug(api: Record<string, unknown>): void {
  api['poseTrust'] = (all = false): PoseTrustReport => poseTrustReport(all);
}
