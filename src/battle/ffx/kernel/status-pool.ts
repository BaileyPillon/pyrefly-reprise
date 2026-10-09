/**
 * FFX Double HP and Double MP (`pp_BtlApplyDoubleHpMp`, VA 0x0078d270): the two Mix / tonic flags that change a
 * character's maximum HP and MP.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` section 7. Pure and deterministic (no random draw), not wired into the engine.
 *
 * The flags live in the buff byte `Chr+0x640` (bit 0 Double HP, bit 1 Double MP; the other bits belong to the damage
 * pipeline). The function is called with a new flag word to store (a non-negative number) or with a negative number
 * to leave the byte alone and just rebuild the maxima from it. For each pool it decides, from the OLD bit in the byte,
 * the bit now in force and whether a new word was given:
 *
 * | bit in force | old bit | new word given | what happens |
 * |---|---|---|---|
 * | 1 | 1 | yes | nothing (already doubled) |
 * | 1 | any | no, or old bit 0 | maximum = clamp(2 * base maximum, 0, cap) |
 * | 0 | 0 | yes | nothing (was never doubled) |
 * | 0 | any | no, or old bit 1 | maximum = the base maximum, unclamped |
 *
 * Whenever the maximum is written the current HP or MP is clamped to 0..maximum. The cap is 9999 for HP and 999 for
 * MP, raised to 99999 and 9999 by the Break HP Limit and Break MP Limit auto-abilities (`Chr+0x6be` bits 9 and 10).
 * The base maxima are `Chr+0x59c` and `Chr+0x5a0`; the current maxima `Chr+0x594` and `Chr+0x598`.
 */

export interface PoolState {
  /** `Chr+0x640` (byte): bit 0 Double HP, bit 1 Double MP. */
  buffFlags: number;
  /** `Chr+0x59c` and `Chr+0x5a0` (s32): the maxima before any doubling. */
  baseMaxHp: number;
  baseMaxMp: number;
  /** `Chr+0x594` and `Chr+0x598` (s32): the maxima in force. */
  maxHp: number;
  maxMp: number;
  /** `Chr+0x5d0` and `Chr+0x5d4` (s32): HP and MP. */
  hp: number;
  mp: number;
  /** `Chr+0x6be` (u16): bit 9 (0x200) Break HP Limit, bit 10 (0x400) Break MP Limit. */
  autoB: number;
}

/** `pp_Clamp(v, lo, hi)` as the exe writes it: raise to `lo` first, then lower to `hi` (so `hi` wins when below `lo`). */
function clampExe(v: number, lo: number, hi: number): number {
  let x = v | 0;
  if (x < lo) x = lo;
  if (hi < x) x = hi;
  return x;
}

type PoolStep = 'skip' | 'double' | 'base';

/** The decision table in the file header. */
function poolStep(wasDoubled: boolean, doubledNow: boolean, haveNew: boolean): PoolStep {
  if (doubledNow) return wasDoubled && haveNew ? 'skip' : 'double';
  return !wasDoubled && haveNew ? 'skip' : 'base';
}

/**
 * `pp_BtlApplyDoubleHpMp(id, chr, newFlags)`. `newFlags` is the exe's third argument as a signed 32-bit number: a
 * negative value means "no new flags" (rebuild the maxima from the byte already stored). The input is not modified.
 * HP is done first, then MP; the HP result does not feed the MP half.
 */
export function applyDoubleHpMp(state: PoolState, newFlags: number): PoolState {
  const out: PoolState = { ...state };
  const old = state.buffFlags & 0xff;
  const haveNew = (newFlags | 0) >= 0;
  const inForce = haveNew ? newFlags | 0 : old;
  if (haveNew) out.buffFlags = newFlags & 0xff;

  const hp = poolStep((old & 1) !== 0, (inForce & 1) !== 0, haveNew);
  if (hp !== 'skip') {
    const cap = (state.autoB & 0x200) !== 0 ? 99999 : 9999;
    out.maxHp = hp === 'double' ? clampExe(Math.imul(state.baseMaxHp, 2), 0, cap) : state.baseMaxHp | 0;
    out.hp = clampExe(state.hp, 0, out.maxHp);
  }
  const mp = poolStep(((old >> 1) & 1) !== 0, ((inForce >> 1) & 1) !== 0, haveNew);
  if (mp !== 'skip') {
    const cap = (state.autoB & 0x400) !== 0 ? 9999 : 999;
    out.maxMp = mp === 'double' ? clampExe(Math.imul(state.baseMaxMp, 2), 0, cap) : state.baseMaxMp | 0;
    out.mp = clampExe(state.mp, 0, out.maxMp);
  }
  return out;
}
