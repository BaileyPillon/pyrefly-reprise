/**
 * FFX-2 automatic statuses: the layer a character's kept statuses and SOS statuses make, and the check that switches the SOS set
 * on and off with the HP state (re-parity X2-D; **FFX-2 only**).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69): the saturating add 0x00624d60,
 * the automatic status copy 0x00636920 and the SOS check 0x006362e0 (the HP state, 0x00619fc0, is `dressphere-stats.ts#hpState`,
 * which the same note proved). Note FFX2-G04 sections 3.1 to 3.3: 89,184 vectors in four groups, 0 mismatches; the vector sample
 * is `tests/fixtures/parity/ffx2/auto_layer.json`. Pure, deterministic, no DOM, no engine types, no random draw.
 *
 * A character keeps three layers of permanent status (offsets into the battle character):
 * - the KEPT set (`Chr+0x534` mask of group 1 statuses, `+0x538` 24 count bytes of group 2): what its Auto-abilities keep on;
 * - the SOS set (`+0x518` mask, `+0x51c` 24 count bytes, flag `+0x66c`): what its SOS abilities keep on while HP is low;
 * - the EFFECTIVE layer (`+0x4fc` mask, `+0x500` 24 count bytes): what the battle reads as permanent (the status word's permanent
 *   source). `+0x66e` remembers the HP state the effective layer was last made for.
 * The layers hold what the character set-up and the ability tables (`ability-effects.ts`) wrote; this module only copies and switches.
 */

import { hpState } from './dressphere-stats.ts';
import { s8 } from './intops.ts';

export { hpState };

/** A count of 126 or more means "permanent"; a saturating sum stops at 125. */
export const COUNT_CEILING = 125;

/**
 * The saturating signed add of two status counts (exe 0x00624d60 with the bounds -125 and 125): when either operand is already
 * above 125 the LARGER operand comes back unchanged (so 126 and 127 survive a sum), otherwise the sum is clamped to -125..125.
 */
export function saturatingAdd(a: number, b: number): number {
  if (COUNT_CEILING < a || COUNT_CEILING < b) return Math.max(a, b);
  const sum = a + b;
  return sum < -COUNT_CEILING ? -COUNT_CEILING : COUNT_CEILING < sum ? COUNT_CEILING : sum;
}

/** What the copy and the SOS check read of a character. */
export interface Ffx2AutoLayerChr {
  /** `Chr+0x3b4`, `+0x384`: signed 32-bit HP and maximum HP. */
  readonly hp: number;
  readonly maxHp: number;
  /** `Chr+0x534`, `+0x538`: the kept set. */
  readonly kept: number;
  readonly keptCnt: readonly number[];
  /** `Chr+0x518`, `+0x51c`: the SOS set. */
  readonly sos: number;
  readonly sosCnt: readonly number[];
  /** `Chr+0x66c`: the SOS flag (non-zero: the character has an SOS ability). */
  readonly flag: number;
  /** `Chr+0x4fc`, `+0x500`: the effective layer as it stands. */
  readonly eff: number;
  readonly effCnt: readonly number[];
  /** `Chr+0x66e`: the HP state the effective layer was last made for. */
  readonly hpPrev: number;
}

/** What the copy leaves: the layer and the HP state it was made for. */
export interface Ffx2AutoCopyResult {
  /** 1 when the layer was refreshed, 0 when nothing changed. */
  readonly ret: 0 | 1;
  readonly eff: number;
  readonly effCnt: number[];
  readonly hpPrev: number;
}

/**
 * The automatic status copy (exe 0x00636920). Unless `force` is set, a character whose HP state has not changed since the last copy is
 * left alone (returns 0). Otherwise the kept set becomes the effective layer; and ONLY IF the HP state is 1 ("under a third") the SOS
 * set is added on top: the mask is ORed, each of the 24 counts is the saturating sum of the kept and the SOS count. State 0 (healthy)
 * and state 2 (dead) leave the kept layer alone, so SOS statuses vanish at once on a knock-out or a heal to a third.
 */
export function automaticStatusCopy(c: Ffx2AutoLayerChr, force: boolean): Ffx2AutoCopyResult {
  const state = hpState(c.hp, c.maxHp);
  if (!force && state === (c.hpPrev & 0xff)) return { ret: 0, eff: c.eff >>> 0, effCnt: [...c.effCnt], hpPrev: c.hpPrev };
  let eff = c.kept >>> 0;
  const counts = c.keptCnt.map(s8);
  if (state === 1) {
    eff = (eff | c.sos) >>> 0;
    for (let i = 0; i < 24; i++) counts[i] = saturatingAdd(counts[i] ?? 0, s8(c.sosCnt[i] ?? 0));
  }
  return { ret: 1, eff, effCnt: counts.map((n) => n & 0xff), hpPrev: state };
}

/** What the SOS check did: the copy's result, and which of the two callees it ran (the status recompute and the status-effect check). */
export interface Ffx2SosCheckResult extends Ffx2AutoCopyResult {
  /** The status recompute ran (`MsSetStatus(id, 0xff, 1, 1)`): the effective layer changed. */
  readonly recompute: boolean;
  /** The status-effect check ran (`MsStatusEffectCheck(id)`): only when the caller asked to be told. */
  readonly effectCheck: boolean;
}

/**
 * The SOS check (exe 0x006362e0). With the SOS flag clear it does nothing (returns 0). With it set, it runs the copy without `force`:
 * if the HP state is the one the layer was made for, nothing happens; otherwise the layer is refreshed, the status recompute runs, and
 * if `notify` is set (a script set the HP) so does the status-effect check. Returns 1 only when the layer was refreshed.
 */
export function sosCheck(c: Ffx2AutoLayerChr, notify: boolean): Ffx2SosCheckResult {
  if (c.flag === 0) return { ret: 0, eff: c.eff >>> 0, effCnt: [...c.effCnt], hpPrev: c.hpPrev, recompute: false, effectCheck: false };
  const copy = automaticStatusCopy(c, false);
  if (copy.ret === 0) return { ...copy, recompute: false, effectCheck: false };
  return { ...copy, recompute: true, effectCheck: notify };
}
