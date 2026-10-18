/**
 * `window.__pyrefly.rigs()`: which figures a battle draws as a rig, and why the others are the painting set (the rig, 2026-10-17; both games; captures, checks and the critic's probe only).
 *
 * `rigs()` lists every subject decided so far: `{ subject, on, reason, ids, info? }`, `info` being the live rig of the first figure using it (key, parts, vertices, bones, chains).
 * `rigs({ reload: true })` forgets what was read first, for a rig just rewritten on disk (the next figure staged reads it afresh). The same decision is logged once per subject as
 * `[rig] subject on|off (reason)`.
 */
import { clearRigCache, rigReport, rigSwitch, type RigReportEntry } from '../engine/rig/RigLoad.ts';

export interface RigsReport {
  /** The switch as it reads now: `?rig=` first, then the default. */
  switch: { on: boolean; reason: string };
  figures: RigReportEntry[];
}

export function installRigDebug(api: Record<string, unknown>): void {
  api['rigs'] = (o?: { reload?: boolean }): RigsReport => {
    if (o?.reload) clearRigCache();
    return { switch: rigSwitch(), figures: rigReport() };
  };
}
