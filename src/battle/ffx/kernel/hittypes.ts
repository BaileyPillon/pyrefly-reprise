/**
 * Input and output shapes of one hit (see hitdamage.ts). Plain objects of the numbers and flags the game
 * reads, named after the game's fields with their `Chr+0x...` / `Cmd+0x...` / hit-record offsets in the
 * comments. No engine types.
 *
 * **Game case: FFX only.** Source: FFX.exe Steam build 25501027, the per-hit pipeline at 0x78e630.
 */

import type { StatusOutcome, Triple } from './aftermath.ts';
import type { BaseDamageTarget, BaseDamageUser } from './damage.ts';
import type { ElementAffinity, NulCounters } from './element.ts';
import type { ScaleOverride } from './modifiers.ts';

/** The user fields of a hit: the base-damage ones plus the status and ability words. */
export interface HitUser extends BaseDamageUser {
  /** Chr+0x0c: the user's character id (picks the RNG stream; not read by the damage code). */
  id: number;
  /** Chr+0x606 (u16): permanent statuses. 0x02 Zombie, 0x10 Power Break, 0x20 Magic Break, 0x200 Berserk. */
  perm: number;
  /** Chr+0x6bc (u16): auto-ability word A. 0x40 Magic Booster, 0x200 Alchemy, 0x2000 Pierce. */
  autoA: number;
  /** Chr+0x6be (u16): auto-ability word B. 0x800 Break Damage Limit. */
  autoB: number;
  /** Chr+0x640 (u8): command buff flags. 8 = every hit deals exactly 9999. */
  buffFlags: number;
  /** Chr+0x6c6 (u16): the default attack's command id. */
  defaultAttack: number;
  /** Chr+0xf5c (u16): the command id being executed. */
  currentCommand: number;
  /** Chr+0x5ca (u8): the flag command 0x311f consumes. */
  bonusFlag: number;
  /** Chr+0x5c1, 0x5c7, 0x5d9: the weapon's damage formula, power and element, used when the command uses weapon properties. */
  weapon: { formula: number; power: number; element: number };
  /** Bytes 0 and 1 of the user's entry in the party percent table (0x02311240). */
  partyDealt: { phys: number; mag: number };
  /** The timed-input scale (Chr+0xd26 set, floats at +0xd2c / +0xd30), or null. */
  scale: ScaleOverride | null;
}

/** The target fields of a hit. */
export interface HitTarget extends BaseDamageTarget {
  /** Chr+0x616 (u16): extra statuses as the character holds them (0x40 Shield stance, 0x80 Boost stance). */
  extra: number;
  /** Chr+0x5b8 (u16): special bits. 1 Armored, 2 immune to fractions, 0x20 immune physical, 0x40 immune magic, 0x80 immune all. */
  special: number;
  /** Chr+0x5b9 bit 0: immune to CTB damage. */
  delayImmune: boolean;
  /** The tick speed for Chr+0x5ac (Agility), from the CTB table; read by Delay Attack only. */
  tickSpeed: number;
  /** Chr+0x5a4 (s32): the overkill threshold. */
  overkillThreshold: number;
  /** Chr+0x5da to 0x5dd. */
  affinity: ElementAffinity;
  /** Bytes 2 and 3 of the target's entry in the party percent table. */
  partyTaken: { phys: number; mag: number };
}

/** The target snapshot the game keeps in the hit record (0x2c bytes). */
export interface HitRecord {
  /** +0x14 (u16): permanent statuses at this moment. */
  perm: number;
  /** +0x16 (u16): extra statuses (0x800 Defend, 0x2000 Sentinel). */
  extra: number;
  /** +0x0a: Shell turns left. */
  shell: number;
  /** +0x0b: Protect turns left. */
  protect: number;
  /** +0x0d to +0x10: the Nul counters. */
  nul: NulCounters;
}

/** The command record fields of a hit. */
export interface HitCommand {
  /** The command id (0x3000 attack family, 0x2xxx items, 0x311f Auto-Life). */
  id: number;
  /** Cmd+0x17: the command type byte (1 and 2 are the magic kinds Magic Booster boosts). */
  type: number;
  /** Cmd+0x1c (u32): bit 0x100 absorbs, 0x2000 Delay Attack, 0x4000 Delay Buster, 0x10000 pierces armor, 0x40000 uses weapon properties. */
  flagsMisc: number;
  /** Cmd+0x20 (u16): bits 0-1 damage type (1 physical, 2 magical), 2 can crit, 4 heal, 0x40 cap 9999, 0x80 cap 99999. */
  flagsDamage: number;
  /** Cmd+0x23: damage classes, 1 HP, 2 MP, 4 CTB. */
  damageClass: number;
  /** Cmd+0x28: the damage formula. */
  formula: number;
  /** Cmd+0x2a: the power byte. */
  power: number;
  /** Cmd+0x2d: the element bits. */
  element: number;
}

/** What the hit roll returned: 0 hit, 1 miss, 2 no effect. */
export type HitRollResult = 0 | 1 | 2;

export interface HitInput {
  user: HitUser;
  target: HitTarget;
  cmd: HitCommand;
  record: HitRecord;
  /** The signed global at VA 0x0112be90: the gil offered (formula 0x15). */
  gilOffered?: number;
  /** True switches the variance off (every class uses the plain factor 256 and draws nothing). */
  noVariance?: boolean;
  /** The result of the status infliction; the default is "nothing changed". */
  status?: StatusOutcome;
}

/** The three sources of randomness, consumed lazily and in the game's order. */
export interface HitIo {
  /** The raw 31-bit value of the user's mode-0 RNG stream, for a variance draw. */
  draw: () => number;
  /** The hit roll's result, or a function that makes the roll (called once, after the Nul check). */
  hit: HitRollResult | (() => HitRollResult);
  /** The critical decision, or a function that makes the roll (called only for a command that can crit). */
  crit: boolean | (() => boolean);
}

export type HitOutcome = 'hit' | 'miss' | 'noEffect' | 'nullified';

export interface HitOutput {
  outcome: HitOutcome;
  /** Hit record +0x20, +0x24, +0x28: HP, MP, CTB amounts after the clamp (negative heals). */
  amounts: Triple;
  /** Hit record +0x18, including the overkill bit 0x80. */
  resultMask: number;
  /** Hit record +0x03: 0 normal, 1 missed, 2 nullified or reduced by Shell/Protect. */
  outcomeByte: number;
  /** Hit record +0x1c: the HP base damage without variance. */
  unvariedHpBase: number;
  /** The target's running HP, MP, CTB (Chr+0x6e4, 0x6e8, 0x6ec) after the hit. */
  running: Triple;
  /** The Nul counters after the Nul check. */
  nul: NulCounters;
  /** The user's Chr+0x5ca after the Magic Booster step. */
  bonusFlag: number;
  /**
   * Bookkeeping the game keeps in locals for its reaction code (presentation only; not compared with emulator
   * vectors): the damage classes still live, how often an immunity cancelled the damage, whether Armored divided it.
   */
  classLeft: number;
  immunityCount: number;
  /** 1 when the Armored step divided the damage. */
  armored: number;
  /** 1 when Shield or Defend/Sentinel wrote the target's Chr+0x6da. */
  guardMark: number;
  /** The DEF and MDF the HP formula saw (undefined when no HP formula ran or it returned early). */
  defUsed: number | undefined;
  mdfUsed: number | undefined;
}
