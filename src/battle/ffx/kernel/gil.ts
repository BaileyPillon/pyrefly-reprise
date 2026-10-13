/**
 * Gil: the pay at an action's start and the add (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * Source: the private note FFX-G05 section 3.8, FFX.exe 0x007859a0 (pay) and 0x00784830 (add) (Steam build 25501027, SHA-256
 * 0537B2A1...686D), run as the real machine code on 30,000 inputs, 0 mismatches (`tests/fixtures/parity/ffx/gil_pay_add.json` replays 300,
 * `tests/unit/parity-ffx-bag.test.ts`). Pure.
 *
 * - **Pay**, once per executed action with the gil amount it carries (Spare Change, Bribe): if gil minus the amount is not negative, the gil is reduced by
 *   the amount (return 0); otherwise **nothing is paid and the return value, -1, is ignored by the executor**, so the action goes ahead unpaid with the
 *   full amount. The gil is then clamped to 0 to 999,999,999.
 * - **Add** caps the gil at 999,999,899 (an unsigned compare of the 32-bit sum); the clamp helper and the "set maximum" helper use 999,999,999. The
 *   100-gil gap between the two is in the exe; the source of the difference is not known (note open question 8).
 *
 * The amounts and the gil are 32-bit signed words in the game; a negative gil or amount is a corrupt save, not a play state, but the vectors cover them.
 */

/** The clamp the pay applies. */
export const GIL_CLAMP = 999_999_999;
/** The cap the add applies. */
export const GIL_ADD_CAP = 999_999_899;

/** The result of a pay: the gil afterwards and the return value (0 paid, -1 refused). */
export interface GilPay {
  gil: number;
  ret: 0 | -1;
}

/** `pp_BtlPayGil(amount)` (0x007859a0). */
export function payGil(gil: number, amount: number): GilPay {
  const difference = (gil - amount) | 0;
  const paid = difference >= 0;
  const after = paid ? difference : gil | 0;
  return { gil: Math.max(0, Math.min(GIL_CLAMP, after)), ret: paid ? 0 : -1 };
}

/** `pp_BtlAddGil(amount)` (0x00784830): the sum cut at 999,999,899 (compared unsigned; the stored word is signed). */
export function addGil(gil: number, amount: number): number {
  const sum = ((gil + amount) >>> 0);
  return (sum > GIL_ADD_CAP ? GIL_ADD_CAP : sum) | 0;
}
