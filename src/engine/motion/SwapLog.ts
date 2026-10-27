/**
 * THE SWAP RECORD OF THE FLUIDITY PASS (lane L1; MF-05 and MF-06; pure: no `three`, no DOM; both games). Two small logs the continuity harness reads back (`window.__pyrefly.swapLog()`,
 * `src/debug/swapApi.ts`; `critic/runner/lib/continuity-why.mjs`), each stamped with `performance.now()` like the planned-smear log (`SmearLog.ts`):
 *
 * - **reasons**: why the presenter asked for a painting, at the few call sites that choose it: the command menu opening (`menu`), the turn start dropping a figure to the idle (`turn-start`), an action
 *   opening on its wind-up, cast, item or strike (`wind-up`, `cast`, `item`, `attack`), the end of an action (`after-action`). The harness splits "stance up" into the menu's, the wind-up's and the
 *   after-action's with it (MF-05 has to price `v1a` against `v1b` before anything is filmed), where the swap alone cannot say which of them it was.
 * - **designed**: every blend the planner chose on purpose (a 50 ms three-frame blend), so the harness can report a designed blend apart from an undesigned dissolve, as it reports a planned cut apart
 *   from a snap. They are NOT in the planned-smear log: that log excuses a snap and a jerk, and a blend has neither.
 */
export interface SwapReason {
  /** `performance.now()` (ms) of the request. */
  at: number;
  actor: string;
  /** The pose name asked for (`ready`, `idle`, `cast`, ...) and the painting that was drawn for it when it differs (`paint`). */
  pose: string;
  paint?: string;
  reason: 'menu' | 'turn-start' | 'wind-up' | 'cast' | 'item' | 'attack' | 'after-action';
}

export interface DesignedBlend {
  at: number;
  actor: string;
  from: string;
  to: string;
  /** The class that asked (`SwapClass`, or `stance`) and the length, real ms. */
  cls: string;
  ms: number;
}

const CAP = 600;
const reasons: SwapReason[] = [];
const designed: DesignedBlend[] = [];

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function noteReason(actor: string, pose: string, reason: SwapReason['reason'], paint?: string): void {
  if (reasons.length >= CAP) reasons.shift();
  reasons.push({ at: now(), actor, pose, reason, ...(paint ? { paint } : {}) });
}

export function noteDesigned(rec: Omit<DesignedBlend, 'at'>): void {
  if (designed.length >= CAP) designed.shift();
  designed.push({ at: now(), ...rec });
}

/** Both logs, oldest first (copies); `reset` empties them. */
export function swapLog(reset = false): { reasons: SwapReason[]; designed: DesignedBlend[] } {
  const out = { reasons: reasons.slice(), designed: designed.slice() };
  if (reset) {
    reasons.length = 0;
    designed.length = 0;
  }
  return out;
}

/** Tests: empty both logs. */
export function resetSwapLog(): void {
  reasons.length = 0;
  designed.length = 0;
}
