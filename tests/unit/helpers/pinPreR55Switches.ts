/**
 * **Pins the four FFX parity switches to what they were before release 55** (re-parity r55 RE; **FFX only**).
 *
 * Release 55 ships `MENU_DRAW_PARITY` (items a to e), `TARGET_STEP_PARITY` (all but `cursorStartFoe` and `sideSwitch`), `CH3_ROSTER_REMOVAL` and `GRAND_SUMMON_KO_REFUSED` ON. The tests of the lanes
 * that built them were written when every one of them was OFF: they describe "off" (the old menu) and "on" (the game's) side by side, and the "off" halves ran on the module defaults. Calling this
 * once at the top of such a file makes every test in it start from an explicit OFF (the switch off, nothing skipped), exactly the state the test was written for, and put the shipped values back
 * after each test. The tests then turn on what they exercise, as they always did. The shipped values themselves are pinned in `parity-ffx-shipped-switches.test.ts`, which does not call this.
 */

import { afterEach, beforeEach } from 'vitest';
import { setMenuDrawParity } from '../../../src/battle/ffx/menu-draw-parity.ts';
import { setTargetStepParity } from '../../../src/battle/ffx/target-step-parity.ts';
import { setCh3RosterRemoval } from '../../../src/battle/ffx/roster-removal.ts';
import { setGrandSummonKoRefused } from '../../../src/battle/ffx/grand-summon-ko.ts';

/** Register hooks that set the four switches to an explicit OFF before each test of the calling file and restore the shipped values after it. */
export function pinSwitchesToPreR55(): void {
  let back: Array<() => void> = [];
  beforeEach(() => {
    back = [setMenuDrawParity(false), setTargetStepParity(false), setCh3RosterRemoval(false), setGrandSummonKoRefused(false)];
  });
  afterEach(() => {
    for (const b of back.reverse()) b();
    back = [];
  });
}
