/**
 * The range and dead-target filter the executor applies when a sub-action starts (re-parity RC7 lane L-CMD; **FFX only**).
 *
 * Source and spec: `research/re-ffx-command-gate.md` section 3. Function: `pp_BtlRangeCheck`, FFX.exe 0x00791fa0 (30,000 vectors against
 * the real machine code, 0 mismatches; `tests/unit/parity-ffx-command-gate.test.ts`, fixture `tests/fixtures/parity/ffx/command_range.json`).
 *
 * **There is no retarget.** The filter walks the sub-action's target mask once. A target whose distance byte is above the command's reach
 * (and that is not the user) is counted as out of reach and dropped; a target that is dead is dropped unless the command may target the
 * dead; everything else is kept. Nothing takes the place of a dropped target. When the mask named someone and nobody is kept, the
 * sub-action does not start ({@link startsAfter}).
 *
 * The animation and focus requests the game makes for each kept target are presentation and are not part of this kernel.
 */

/** One target of the sub-action as the filter reads it. */
export interface RangeTarget {
  /** True for the user itself, which is never out of reach. */
  isUser: boolean;
  /** The signed distance byte `Chr+0x4ff` (0 is next to the user). */
  far: number;
  /** The dead flag `Chr+0xdcc`. */
  dead: boolean;
}

/** What the filter keeps and counts. */
export interface RangeOutcome {
  /** For each input target, whether it is kept. */
  kept: boolean[];
  /** How many targets were out of reach (the count the message decision reads). */
  outOfReach: number;
}

/**
 * The filter. `reach` is the command's reach (0 to 3: `kernel/legal-set.ts#commandReach`), `allowsDead` the command's "may target the
 * dead" bit. A target that is out of reach is counted even when it is also dead.
 */
export function rangeFilter(reach: number, allowsDead: boolean, targets: readonly RangeTarget[]): RangeOutcome {
  const kept: boolean[] = [];
  let outOfReach = 0;
  for (const t of targets) {
    if (reach < t.far && !t.isUser) {
      outOfReach += 1;
      kept.push(false);
    } else {
      kept.push(allowsDead || !t.dead);
    }
  }
  return { kept, outOfReach };
}

/**
 * True when the sub-action goes on after the filter. The game's return value is 0 only for a **strict** command (a record with a hit-count
 * byte, the item-steal flag or the gil-steal flag) when nobody was kept, and 0 stops the start; for any command the start also needs
 * the mask to have been empty or somebody to have survived. So a strict command starts only with a survivor, any other with a survivor
 * or an empty mask.
 */
export function startsAfter(named: number, keptCount: number, strict: boolean): boolean {
  return strict ? keptCount > 0 : named === 0 || keptCount > 0;
}
