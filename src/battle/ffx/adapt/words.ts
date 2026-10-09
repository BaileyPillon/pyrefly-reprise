/**
 * What the game keeps in bit words, read off the engine's combatants (re-parity W1; **FFX only**).
 *
 * The parity kernels take the numbers the game's own functions read: the permanent and extra status words
 * (`Chr+0x606`, `Chr+0x616`), the temporal counters, the four element byte masks (`Chr+0x5da` to `0x5dd`), the
 * special word (`Chr+0x5b8`), the auto-ability words (`Chr+0x6bc`, `0x6be`) and the buff flags (`Chr+0x640`). The
 * engine keeps the same facts as status ids, immunity flags and equipped auto-abilities; this module is the whole
 * of the translation, in one direction, with no default for anything the engine cannot say.
 *
 * Bit values: `kernel/status-types.ts` (`PermBit`, `ExtraBit`); the rest are the bits the damage kernels test,
 * named here beside the engine fact they stand for. Source: `docs/handoff/re-parity-w1.md`, the input table.
 */

import type { ElementId, FFXCombatant, StatusId } from '../../common/types.ts';
import type { ElementAffinity, NulCounters } from '../kernel/element.ts';
import { ExtraBit, PermBit } from '../kernel/status-types.ts';
import { defensiveBonusPercent, hasAuto, offensiveBonusPercent } from '../equipment.ts';
import { has, statusOf } from '../predicates.ts';

/** Engine status id to its bit in the permanent status word (`Chr+0x606`). */
const PERM_BITS: ReadonlyArray<readonly [StatusId, number]> = [
  ['ko', PermBit.Death],
  ['zombie', PermBit.Zombie],
  ['petrify', PermBit.Petrify],
  ['poison', PermBit.Poison],
  ['power-break', PermBit.PowerBreak],
  ['magic-break', PermBit.MagicBreak],
  ['armor-break', PermBit.ArmorBreak],
  ['mental-break', PermBit.MentalBreak],
  ['confuse', PermBit.Confuse],
  ['berserk', PermBit.Berserk],
  ['provoke', PermBit.Provoke],
  ['threaten', PermBit.Threaten],
];

/** Engine status id to its bit in the extra status word (`Chr+0x616`). */
const EXTRA_BITS: ReadonlyArray<readonly [StatusId, number]> = [
  ['scan', ExtraBit.Scan],
  ['shield', ExtraBit.Shield],
  ['boost', ExtraBit.Boost],
  ['eject', ExtraBit.Eject],
  ['auto-life', ExtraBit.AutoLife],
  ['curse', ExtraBit.Curse],
  ['defend', ExtraBit.Defend],
  ['guard', ExtraBit.Guard],
  ['sentinel', ExtraBit.Sentinel],
  ['doom', ExtraBit.Doom],
];

/**
 * The permanent status word of a combatant. A combatant that is down but still on the field is dead in the game's sense
 * (the Death bit) whether or not the `ko` marker is on it: `koActor` sets both, and the invariant is the engine's.
 */
export function permWord(c: FFXCombatant): number {
  let word = 0;
  for (const [status, bit] of PERM_BITS) if (has(c, status)) word |= bit;
  if (!c.alive && !c.removed) word |= PermBit.Death;
  return word;
}

/** The extra status word of a combatant. */
export function extraWord(c: FFXCombatant): number {
  let word = 0;
  for (const [status, bit] of EXTRA_BITS) if (has(c, status)) word |= bit;
  return word;
}

/** A temporal counter's value as the kernels read it: any non-zero number means the status is on. */
export function counterOf(c: FFXCombatant, status: StatusId): number {
  return has(c, status) ? 1 : 0;
}

/** The four Nul counters (hit record +0x0d to +0x10, `Chr+0x60e` to `0x611`): 0 none, 0xff a permanent one (never ticks), else the charges left. */
export function nulCounters(c: FFXCombatant): NulCounters {
  const one = (status: StatusId): number => {
    const inst = statusOf(c, status);
    if (!inst) return 0;
    if (inst.permanent) return 0xff;
    return Math.max(1, inst.charges ?? 1);
  };
  return { tide: one('nultide'), blaze: one('nulblaze'), shock: one('nulshock'), frost: one('nulfrost') };
}

/** The element bits: 1 fire, 2 ice, 4 thunder (our `lightning`), 8 water, 0x10 holy. Gravity and none are 0. */
const ELEMENT_BIT: Readonly<Partial<Record<ElementId, number>>> = {
  fire: 0x01,
  ice: 0x02,
  lightning: 0x04,
  water: 0x08,
  holy: 0x10,
};

/** An element list as the game's element byte. */
export function elementMask(elements: readonly ElementId[]): number {
  let mask = 0;
  for (const e of elements) mask |= ELEMENT_BIT[e] ?? 0;
  return mask;
}

/** The target's four affinity byte masks: absorb, null (our `immune`), resist and weak. */
export function affinityMasks(c: FFXCombatant): ElementAffinity {
  const masks: ElementAffinity = { absorb: 0, null: 0, resist: 0, weak: 0 };
  for (const [element, affinity] of Object.entries(c.affinities) as Array<[ElementId, string | undefined]>) {
    const bit = ELEMENT_BIT[element] ?? 0;
    if (bit === 0) continue;
    if (affinity === 'absorb') masks.absorb |= bit;
    else if (affinity === 'immune') masks.null |= bit;
    else if (affinity === 'resist') masks.resist |= bit;
    else if (affinity === 'weak') masks.weak |= bit;
  }
  return masks;
}

/**
 * `Chr+0x5b8`: 0x01 Armored, 0x02 immune to fractional damage, 0x04 immune to Life (the status step reads it: a Life on a Zombie
 * kills it unless the target is immune to Life), 0x20 immune to physical, 0x40 to magical, 0x80 to everything.
 */
export function specialWord(c: FFXCombatant): number {
  const flags = c.immunityFlags;
  let word = 0;
  if (flags.includes('armored')) word |= 0x01;
  if (flags.includes('immune-to-percentage-damage')) word |= 0x02;
  if (flags.includes('immune-to-life')) word |= 0x04;
  if (flags.includes('immune-to-physical-damage')) word |= 0x20;
  if (flags.includes('immune-to-magical-damage')) word |= 0x40;
  if (flags.includes('immune-to-damage')) word |= 0x80;
  return word;
}

/** `Chr+0x6bc`, the bits the damage kernels read: 0x40 Magic Booster, 0x200 Alchemy, 0x2000 Pierce. */
export function autoWordA(c: FFXCombatant): number {
  let word = 0;
  if (hasAuto(c, 'magic-booster')) word |= 0x40;
  if (hasAuto(c, 'alchemy')) word |= 0x200;
  if (hasAuto(c, 'piercing')) word |= 0x2000;
  return word;
}

/**
 * `Chr+0x6be`: 0x200 Break HP Limit (the Double HP ceiling goes from 9,999 to 99,999), 0x400 Break MP Limit (999 to 9,999),
 * 0x800 Break Damage Limit (the damage cap). `research/re-ffx-ctb-status.md` section 7.
 */
export function autoWordB(c: FFXCombatant): number {
  let word = 0;
  if (hasAuto(c, 'break-hp-limit')) word |= 0x200;
  if (hasAuto(c, 'break-mp-limit')) word |= 0x400;
  if (hasAuto(c, 'break-damage-limit')) word |= 0x800;
  return word;
}

/** `Chr+0x640`: 8 "every hit deals exactly 9999" (Trio of 9999, Quartet of 9), 0x10 "always critical" (Hero and Miracle Drink). */
export function buffFlags(c: FFXCombatant): number {
  let word = 0;
  if (has(c, 'damage-9999')) word |= 0x08;
  if (has(c, 'guaranteed-critical')) word |= 0x10;
  return word;
}

/** The party percent table's bytes for one combatant (`0x02311240`): damage dealt to physical and magical, damage taken likewise. */
export function percentBytes(c: FFXCombatant): { dealt: { phys: number; mag: number }; taken: { phys: number; mag: number } } {
  return {
    dealt: { phys: offensiveBonusPercent(c, 'physical'), mag: offensiveBonusPercent(c, 'magical') },
    taken: { phys: defensiveBonusPercent(c, 'physical'), mag: defensiveBonusPercent(c, 'magical') },
  };
}
