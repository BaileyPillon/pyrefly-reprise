/**
 * The odds a status lands, read off the game's own landing rule (re-parity W2; **FFX only**).
 *
 * The enemy-intent panel and the advisor print "how likely is this status to land" without rolling anything. They used to
 * carry their own copy of the roll (`chance - resistance` over a `rng % 101` draw). The roll is the kernel's now
 * (`kernel/status-inflict.ts#statusLanding`, the exe's rule at VA 0x0078ae00), and the odds here are that SAME predicate counted
 * over every roll the game can draw, so a preview cannot drift from what the engine rolls: 0 to 100 for every status but Threaten,
 * 0 to 99 for Threaten, whose resistance byte is a success percentage.
 *
 * The bytes are the engine's own: the command's chance byte for the status (the game's record, or the ability's own statuses for
 * one with none; a weapon command takes the larger of the two with the wielder's weapon), and the target's resistance byte.
 */

import type { AbilityDef, FFXCombatant, StatusId } from '../../common/types.ts';
import { statusLanding } from '../kernel/status-inflict.ts';
import { PermBit, Status } from '../kernel/status-types.ts';
import { resolveCommand } from './command.ts';
import {
  BUFF_STATUS_BIT,
  EXTRA_STATUS_BIT,
  PERM_STATUS_IDS,
  STACK_STATUS_IDS,
  TEMPORAL_STATUS_IDS,
  commandStatus,
  extraImmuneWord,
  recordOf,
  resistBytesWith,
  weaponBytes,
} from './status.ts';

/** How likely a status is to land, in percent, and whether nothing can make it land. */
export interface StatusPercent {
  percent: number;
  blocked: boolean;
}

/** The number of a regular status (0 to 24), or -1 for one the chance bytes do not carry. */
export function regularNumber(status: StatusId): number {
  const perm = PERM_STATUS_IDS.indexOf(status);
  if (perm >= 0) return perm;
  const temporal = TEMPORAL_STATUS_IDS.indexOf(status);
  return temporal >= 0 ? 12 + temporal : -1;
}

/** The percentage of the possible rolls on which a regular status with these bytes lands. */
export function landingPercent(number: number, chance: number, resist: number, recordHasZombie: boolean): StatusPercent {
  const rolls = number === Status.Threaten ? 100 : 101;
  let landed = 0;
  for (let roll = 0; roll < rolls; roll++) if (statusLanding(number, roll, chance, resist, recordHasZombie).landed) landed++;
  return { percent: Math.round((landed * 100) / rolls), blocked: landed === 0 };
}

/**
 * The odds that `def`, used by `user`, puts `status` on `target`, or `undefined` when the command does not try to.
 *
 * `threatenChance` is the live Threaten percent of an enemy target (a preview has no battle runtime; the enemy's own starting
 * value is `target.enemy.threatenChance`, 100 when it carries none).
 */
export function statusPercentOf(
  user: FFXCombatant | undefined,
  target: FFXCombatant,
  def: AbilityDef,
  status: StatusId,
  threatenChance: number = target.enemy?.threatenChance ?? 100,
): StatusPercent | undefined {
  const command = resolveCommand(def, user ?? { side: 'party' });
  const bytes = commandStatus(def, command);
  const cleanse = (bytes.cmd.flagsDamage & 0x20) !== 0;
  const usesWeapon = (command.flagsMisc & 0x40000) !== 0;

  const number = regularNumber(status);
  if (number >= 0) {
    let chance = bytes.cmd.chances[number] ?? 0;
    if (usesWeapon && user?.side === 'party') chance = Math.max(chance, weaponBytes(user).chances[number] ?? 0);
    if (chance === 0) return undefined;
    if (cleanse) return { percent: 100, blocked: false };
    const resist = resistBytesWith(target, threatenChance)[number] as number;
    const zombie = (recordOf(target).perm & PermBit.Zombie) !== 0;
    return landingPercent(number, chance, resist, zombie);
  }

  // An extra status, a stage buff or a buff flag has no roll: it lands unless the target cannot take it.
  const extraBit = EXTRA_STATUS_BIT[status];
  if (extraBit !== undefined) {
    if ((bytes.extra & extraBit) === 0) return undefined;
    const immune = (extraImmuneWord(target, def) & extraBit) !== 0;
    return { percent: immune ? 0 : 100, blocked: immune };
  }
  const stack = STACK_STATUS_IDS.indexOf(status);
  if (stack >= 0) return (bytes.stageMask & (1 << stack)) !== 0 ? { percent: 100, blocked: false } : undefined;
  const buffBit = BUFF_STATUS_BIT[status];
  if (buffBit !== undefined) return (bytes.buff & buffBit) !== 0 ? { percent: 100, blocked: false } : undefined;
  return undefined;
}
