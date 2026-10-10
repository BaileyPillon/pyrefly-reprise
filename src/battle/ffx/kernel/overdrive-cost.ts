/**
 * FFX Overdrive gauge kernel, part 3: paying for an action (MP and Overdrive), the Grand Summon gauge hold, Tidus's
 * Overdrive learning by use count, and the Entrust gauge transfer.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: `pp_BtlPayCosts`
 * 0x0078e5a0, the gauge restore 0x007b06b0, the gauge hold 0x007b06e0, Tidus's learning 0x007b0cd0 (table at VA
 * 0x00c43948), and the transfer in `pp_BtlApplyHitRecords` 0x0078f060 (read, not run: it sits inside that function).
 * Spec: `research/re-ffx-overdrive-steal-aeons.md` section 1.8. Not wired into the engine. Pure.
 */

import { clamp } from './ap-award.ts';
import type { OdSlot, OdWorld } from './overdrive.ts';

/**
 * Tidus's four Overdrives and the number of Overdrives he must have used to learn each: Spiral Cut (command 0x3060) at
 * 0, Slice & Dice (0x3061) at 10, Energy Rain (0x3062) at 30, Blitz Ace (0x3063) at 80. Read from the exe's table at
 * VA 0x00c43948 (four u16 ids) and 0x00c43950 (four s32 thresholds). The learned bits are bits 0 to 3 of the word at
 * VA 0x011307fc.
 */
export const TIDUS_OVERDRIVES: ReadonlyArray<{ command: number; uses: number }> = [
  { command: 0x3060, uses: 0 },
  { command: 0x3061, uses: 10 },
  { command: 0x3062, uses: 30 },
  { command: 0x3063, uses: 80 },
];

/**
 * `FUN_007b0cd0(id)` (0x007b0cd0): after an Overdrive is paid for. For Tidus (id 0) outside demo mode 2 the use counter
 * goes up by one; then for each of his four Overdrives in order, one he has not learned and whose threshold the counter
 * has reached (signed compare) raises the learned flag and records its id (a later entry overwrites an earlier one).
 * Returns 1 when any did. Every other character, and mode 2, leave everything alone.
 */
export function tidusOverdriveLearn(w: OdWorld, id: number): number {
  if (id !== 0 || w.demoMode === 2) return 0;
  w.tidus.uses = (w.tidus.uses + 1) | 0;
  let ret = 0;
  TIDUS_OVERDRIVES.forEach((o, k) => {
    const known = (w.tidus.learnedWord & (1 << k)) !== 0;
    if (!known && w.tidus.uses >= o.uses) {
      ret = 1;
      w.learnedFlag = true;
      w.tidus.learnId = o.command;
    }
  });
  return ret;
}

/**
 * `FUN_007b06e0(chr)` (0x007b06e0), run when an action is prepared: when it contains Grand Summon the character's gauge is
 * saved and then held at its maximum (so the 100-point cost can be paid whatever the gauge was), and the restore flag is set.
 */
export function odHoldForGrandSummon(w: OdWorld, c: OdSlot): void {
  if (!w.grandSummon) return;
  c.savedGauge = c.gauge;
  c.gauge = c.gaugeMax;
  c.savedFlag = true;
}

/**
 * `pp_BtlPayCosts(id)` (0x0078e5a0), at the end of an action: MP goes down by `Chr+0x6cc` (clamped to 0..9999), the gauge
 * by `Chr+0x6cd` (clamped to 0..max). When an Overdrive cost was paid the saved gauge of a Grand Summon is put back
 * (so Grand Summon leaves Yuna's own gauge as it was) and Tidus's learning counter runs. Both cost bytes are cleared.
 */
export function odPayCosts(w: OdWorld, id: number): void {
  const c = w.slots[id] as OdSlot;
  c.mp = clamp(c.mp - c.mpUsed, 0, 9999);
  c.gauge = clamp(c.gauge - c.odUsed, 0, c.gaugeMax);
  if (c.odUsed !== 0) {
    if (c.savedFlag) {
      c.savedFlag = false;
      c.gauge = c.savedGauge;
    }
    tidusOverdriveLearn(w, id);
  }
  c.mpUsed = 0;
  c.odUsed = 0;
}

/**
 * The gauge transfer of a hit whose command carries the transfer flag (bit 0x02000000 of the command's misc word: Entrust)
 * and whose target is not Petrified (`pp_BtlApplyHitRecords`, 0x0078f060): the user's whole gauge is added to the
 * target's, clamped to the target's maximum, and the user's gauge becomes 0. Read from the code, not run.
 */
export function odTransfer(user: OdSlot, target: OdSlot): void {
  const given = user.gauge;
  user.gauge = 0;
  target.gauge = clamp(target.gauge + given, 0, target.gaugeMax);
}
