/**
 * FFX CTB kernels, part 2: the opening counters of a battle (`pp_BtlInitCtb`, VA 0x0078ded0).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` section 3. Pure, deterministic, not wired into the engine.
 *
 * What the game does, in its own order (the call is made once per battle, with the start type that
 * `rollStartType` in `./rolls.ts` produced):
 *
 * 1. For every one of the 31 character slots, `Chr+0x65d` (the base ICV) becomes `tickSpeed(AGI) * 3` as a byte.
 * 2. Slots 0..0x11 (party members 0..7, then aeons 8..0x11), in id order: the starting value is
 *    - preemptive: 0;  ambush: the base ICV;  normal (any other start type): `base - draw % (bonus + 1)`, where
 *      `bonus` is byte 1 of the CTB table record of the slot's Agility and the draw comes from the slot's mode 0
 *      stream (`rngStreamIndex(id, 0, isAeon)`: party 20 + id, every aeon 27);
 *    a slot with the First Strike auto-ability (`Chr+0x6bc` bit 1) is forced to 0 AFTER the draw (the draw is still
 *      spent); then Haste halves and Slow doubles the value, clamped to 0..255 ({@link hasteSlow}).
 * 3. Monster slots 0x14..0x1b, in order: preemptive: the base ICV; ambush: 0; normal:
 *    `base * 100 / (100 - draw % 11)` with truncating division (0..10 percent slower than the base), from the
 *    monster's own stream (`id + 8`); then First Strike, Haste and Slow exactly as above.
 * 4. The smallest value among characters that are in the battle (`Chr+0xdc8`) and sit in the slots handled by steps
 *    2 and 3 is subtracted (byte arithmetic) from every character in the battle, slots 0..0x1e. The function
 *    returns that minimum, or -1 when nobody qualified.
 *
 * The draws are NOT conditional on who is in the battle: a normal start spends 18 + 8 = 26 draws, in this order,
 * even for empty slots; a preemptive or ambush start spends none.
 */

import { chrBaseCtb, CTB_CHR_SLOTS, hasteSlow, icvBonus } from './ctb.ts';
import { rngStreamIndex } from './rng.ts';
import { StartType } from './rolls.ts';

/** First monster slot (chr id 0x14) and the number of monster slots. */
export const MONSTER_SLOT_FIRST = 0x14;
export const MONSTER_SLOT_COUNT = 8;
/** Slots 0..0x11 are party members and aeons. */
export const PARTY_AEON_SLOT_COUNT = 0x12;

/** `Chr+0x6bc` bit 1: First Strike (the character starts at 0). */
export const AUTO_FIRST_STRIKE = 0x02;

/** One character slot as `pp_BtlInitCtb` reads it. */
export interface InitCtbSlot {
  /** `Chr+0x5ac`, Agility (byte). */
  agi: number;
  /** `Chr+0x613`, the Haste counter (byte). */
  haste: number;
  /** `Chr+0x614`, the Slow counter (byte). */
  slow: number;
  /** `Chr+0x6bc` (u16), auto-ability word A; bit 1 is First Strike. */
  autoA: number;
  /** `Chr+0xdc8`, set for a character that is in the battle. */
  inBattle: boolean;
  /** `Chr+0x590` bit 2: the slot is an aeon; picks the RNG stream (27 for every aeon). */
  isAeon: boolean;
  /** `Chr+0x65c` before the call; only matters for a slot the function never writes (0x12, 0x13, 0x1c..0x1e). */
  ctb?: number;
}

export interface InitCtbResult {
  /** `Chr+0x65d` of all 31 slots after the call. */
  base: number[];
  /** `Chr+0x65c` of all 31 slots after the call (the opening counters). */
  ctb: number[];
  /** The value the function returns: the subtracted minimum, or -1 when no tracked character is in the battle. */
  minimum: number;
}

function startValue(startType: number, partySide: boolean, base: number, draw: (modulus: number) => number, bonus: number): number {
  if (partySide) {
    if (startType === StartType.Preemptive) return 0;
    if (startType === StartType.Ambush) return base;
    return base - (draw(bonus + 1) % (bonus + 1));
  }
  if (startType === StartType.Preemptive) return base;
  if (startType === StartType.Ambush) return 0;
  const v = Math.trunc((base * 100) / (100 - (draw(11) % 11)));
  return v < 0 ? 0 : v;
}

/**
 * `pp_BtlInitCtb(startType)`. `slots` has 31 entries (index = chr id). `draw(stream)` returns the raw 31-bit value of
 * the game's RNG for that stream (the kernel masks it to 31 bits). `startType` is 0 normal, 1 preemptive, 2 ambush;
 * any other number behaves as normal, like the exe's `mode == 1`, `mode == 2` tests.
 *
 * The callback is also told the modulus the kernel is about to apply (`bonus + 1` for a party member or aeon, 11 for a
 * monster). The game ignores it (its draw is the raw value); a caller whose generator is not the game's can draw a value
 * already in range, which the kernel's own `%` then leaves alone.
 */
export function initialCtb(
  startType: number,
  slots: readonly InitCtbSlot[],
  draw: (stream: number, modulus: number) => number,
): InitCtbResult {
  const base: number[] = [];
  const ctb: number[] = [];
  for (let i = 0; i < CTB_CHR_SLOTS; i++) {
    const s = slots[i] as InitCtbSlot;
    base.push(chrBaseCtb(s.agi));
    ctb.push((s.ctb ?? 0) & 0xff);
  }

  let minimum = -1;
  const place = (i: number, partySide: boolean): void => {
    const s = slots[i] as InitCtbSlot;
    const stream = rngStreamIndex(i, 0, s.isAeon);
    const bonus = icvBonus(s.agi);
    const raw = startValue(startType, partySide, base[i] as number, (modulus) => draw(stream, modulus) & 0x7fffffff, bonus);
    const firstStrike = (s.autoA & AUTO_FIRST_STRIKE) !== 0;
    const value = hasteSlow(firstStrike ? 0 : raw, s.haste, s.slow);
    ctb[i] = value;
    if (s.inBattle && (minimum < 0 || value < minimum)) minimum = value;
  };

  for (let i = 0; i < PARTY_AEON_SLOT_COUNT; i++) place(i, true);
  for (let k = 0; k < MONSTER_SLOT_COUNT; k++) place(MONSTER_SLOT_FIRST + k, false);

  for (let i = 0; i < CTB_CHR_SLOTS; i++) {
    if ((slots[i] as InitCtbSlot).inBattle) ctb[i] = ((ctb[i] as number) - minimum) & 0xff;
  }
  return { base, ctb, minimum };
}
