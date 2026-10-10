/**
 * Test builders for the FFX hit kernel (`src/battle/ffx/kernel/hit.ts`), shared by
 * `parity-ffx-hit.test.ts` and `parity-ffx-hit-flow.test.ts`. Game case: FFX only.
 */

import { hitCheck, hitPlan, type HitCheckInput, type HitResult } from '../../../src/battle/ffx/kernel/hit.ts';

/** `Cmd+0x1c` bit 6: the command is blinded by Darkness. */
export const DARK = 0x40;

/** `Cmd+0x1c` with accuracy formula `formula` (bits 3..5) and optional extra bits. */
export const formulaFlags = (formula: number, extra = 0): number => (formula << 3) | extra;

/** Everything a test may set; anything left out is 0 / false. */
export interface HitOverrides {
  flagsMisc?: number;
  accuracy?: number;
  acc?: number;
  userLuck?: number;
  darkness?: number;
  aim?: number;
  luckStack?: number;
  status?: number;
  eva?: number;
  targetLuck?: number;
  reflex?: number;
  jinx?: number;
  sleep?: number;
  recStatus?: number;
  counterKind?: number;
  debugAlwaysHit?: boolean;
  debugNeverHit?: boolean;
}

/** A neutral input: formula 0, everything zero. Tests override only what they are about. */
export function makeHitInput(over: HitOverrides): HitCheckInput {
  return {
    cmd: { flagsMisc: over.flagsMisc ?? 0, accuracy: over.accuracy ?? 0 },
    user: {
      acc: over.acc ?? 0,
      luck: over.userLuck ?? 0,
      darkness: over.darkness ?? 0,
      aim: over.aim ?? 0,
      luckStack: over.luckStack ?? 0,
    },
    target: {
      status: over.status ?? 0,
      eva: over.eva ?? 0,
      luck: over.targetLuck ?? 0,
      reflex: over.reflex ?? 0,
      jinx: over.jinx ?? 0,
    },
    rec: { sleep: over.sleep ?? 0, status: over.recStatus ?? 0 },
    counterKind: over.counterKind ?? 0,
    ...(over.debugAlwaysHit === undefined ? {} : { debugAlwaysHit: over.debugAlwaysHit }),
    ...(over.debugNeverHit === undefined ? {} : { debugNeverHit: over.debugNeverHit }),
  };
}

/** Run the check with a raw draw value; also report how many times the kernel drew. */
export function runHit(input: HitCheckInput, raw = 0): { result: HitResult; draws: number } {
  let draws = 0;
  const result = hitCheck(input, () => (draws++, raw));
  return { result, draws };
}

/** The percent the kernel compares the roll with (throws if the check does not roll at all). */
export function percentOf(input: HitCheckInput): number {
  const plan = hitPlan(input);
  if (!plan.rolls) throw new Error(`expected a rolled check, got fixed result ${plan.result}`);
  return plan.percent;
}
