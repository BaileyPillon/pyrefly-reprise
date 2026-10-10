/**
 * The chances behind a roll, as the kernels compute them (re-parity W3; **FFX-2 only**).
 *
 * The engine's hit, critical and status rolls are the kernels' (`resolve-strike.ts`); the move advisor, the enemy-intent
 * panel and the HUD need the odds of those rolls without making them. Each function here reads the same inputs the
 * strike reads and answers with the exact probability over the draws the kernel reduces (`% 101`, `% 100`, `& 0x7f`,
 * `& 0xff`, `& 0x3ff`), so a printed 62% is the chance the game's own rule gives, not a second formula that could drift.
 * Nothing here draws a random number or changes a unit.
 */

import type { AbilityDef, FFX2Combatant, StatusId } from '../../common/types.ts';
import type { Ffx2Unit } from '../internal.ts';
import { COMMAND_BRIBE_FREE_ROLL, HitResult, rollHit } from '../kernel/hit.ts';
import { critChance } from '../kernel/crit.ts';
import { resolveCommand } from './command.ts';
import { hitAttacker, hitTarget, levelOf, statByte } from './inputs.ts';
import { slotOf } from './slots.ts';
import { has, luckStage } from './words.ts';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/** The kernel slot ids a preview gives the two sides (they only decide the Petrify rule and the stream, neither read here). */
const PARTY_ID = 0;
const MONSTER_ID = 15;

/**
 * The chance a hit of `ability` from `user` lands on `target`, 0 to 1, from the accuracy formula of the command row
 * (`kernel/hit.ts`): formula 0 never rolls; 1 and 2 compare a roll of 0 to 100 with the race threshold; 3 to 5 compare a
 * constant with a threshold that depends on a 7-bit draw; 6 (Bribe) and 7 compare a byte / ten-bit roll with a threshold.
 * A target the formula calls immune is 0. `gilSpent` is the Bribe's offer.
 */
export function hitProbability(user: FFX2Combatant, target: FFX2Combatant, ability: AbilityDef, gilSpent = 0): number {
  const attacker = user as Ffx2Unit;
  const victim = target as Ffx2Unit;
  const command = resolveCommand(ability, attacker);
  const formula = command.accuracyFormula;
  if (formula === 0) return 1;
  const a = hitAttacker(attacker, PARTY_ID);
  const t = hitTarget(victim, MONSTER_ID);
  const action = { repeatCount: 0, repeatLimit: 3, amount: gilSpent, hitsOverride: 0 };
  const run = (draw: number) => rollHit(a, command.hit, action, t, () => draw);
  const probe = run(0);
  if (probe.result === HitResult.NoEffect) return 0;
  if (formula === 1 || formula === 2) {
    if (probe.forceMiss) return 0;
    if (probe.forceHit) return 1;
    return clamp01((probe.threshold ?? 0) / 101);
  }
  if (formula >= 3 && formula <= 5) {
    let hits = 0;
    for (let d = 0; d < 128; d++) if (run(d).result === HitResult.Hit) hits += 1;
    return hits / 128;
  }
  if (probe.forceMiss) return 0;
  const threshold = probe.threshold ?? 0;
  if (formula === 6) return command.hit.id === COMMAND_BRIBE_FREE_ROLL ? (threshold > 0 ? 1 : 0) : clamp01(threshold / 256);
  return clamp01(threshold / 1024);
}

/**
 * The chance a hit of `ability` from `user` on `target` is critical, 0 to 1: the row's own byte or the Luck gap
 * (`kernel/crit.ts`: `roll % 100 < chance`, an Always Critical attacker always crits), 0 when the row cannot crit.
 */
export function critProbability(user: FFX2Combatant, target: FFX2Combatant, ability: AbilityDef): number {
  const attacker = user as Ffx2Unit;
  const command = resolveCommand(ability, attacker);
  if ((command.pipeline.flagsDamage & 4) === 0) return 0;
  if (has(attacker, 'guaranteed-critical')) return 1;
  const chance = critChance({
    canCrit: true,
    fixedChance: (command.pipeline.flagsDamage & 8) !== 0,
    critByte: command.record.critByte,
    attackerSlot: PARTY_ID,
    attackerLuck: statByte(attacker.stats.luck),
    attackerLuckStage: luckStage(attacker),
    targetLuck: statByte(target.stats.luck),
    targetLuckStage: luckStage(target),
    alwaysCritical: false,
  });
  return clamp01(chance / 100);
}

/**
 * The chance a status with chance byte `chance` lands on a target with resist byte `resist` (`kernel/statusTypes.ts
 * statusLands`): 255 always, then a resist of 255 never, then 254 always, else `roll % 101 < chance + 5 * (levelGap) -
 * resist`, a roll of 0 to 100, so 101 or more is certain and 0 or less impossible.
 */
export function statusProbability(chance: number, resist: number, attackerLevel: number, targetLevel: number): number {
  const c = Math.max(0, Math.min(255, Math.round(chance)));
  const r = Math.max(0, Math.min(255, Math.round(resist)));
  if (c === 0) return 0;
  if (c === 255) return 1;
  if (r === 255) return 0;
  if (c === 254) return 1;
  return clamp01((c + 5 * (attackerLevel - targetLevel) - r) / 101);
}

/** {@link statusProbability} between two units, the attacker's level and the target's resist byte for `status`. */
export function statusProbabilityBetween(user: FFX2Combatant, target: FFX2Combatant, status: string, chance: number): number {
  const resist = (target.immunities as Record<string, number | undefined>)[status] ?? 0;
  return statusProbability(chance, resist, levelOf(user as Ffx2Unit), levelOf(target as Ffx2Unit));
}

/**
 * The chance byte the engine rolls for `status` when `user` casts `ability` (the command row's own table, not the
 * ability's authored list), and the share of casts that roll it: a pick-one command (Russian Roulette) rolls only the
 * row it picked, so a status carried by one of five rows is rolled in one cast of five. `undefined` when the row carries
 * no chance for it (the engine never rolls it) or when the status has no slot in the game's tables (see {@link rollsStatus}).
 */
export function rolledChance(ability: AbilityDef, user: FFX2Combatant, status: StatusId): { chance: number; share: number } | undefined {
  const slot = slotOf(status);
  if (slot === undefined) return undefined;
  const rows = ability.ffx2Record?.pickOne?.length ?? 1;
  let chance = 0;
  let carrying = 0;
  for (let variant = 0; variant < rows; variant++) {
    const command = resolveCommand(ability, user as Ffx2Unit, 0, variant);
    const byte = (slot.group === 1 ? command.status.chance1 : command.status.chance2)[slot.index] ?? 0;
    if (byte > 0) {
      carrying += 1;
      chance = Math.max(chance, byte);
    }
  }
  return carrying === 0 ? undefined : { chance, share: carrying / rows };
}

/**
 * Does the engine ever roll `status` for this cast? A status with a slot is rolled only if the command row carries a chance
 * for it; a status with no slot in the game's tables (the hidden Delay effect, Action-cancel, Shattering) is rolled by the
 * engine from the ability's own list.
 */
export function rollsStatus(ability: AbilityDef, user: FFX2Combatant, status: StatusId): boolean {
  return slotOf(status) === undefined || rolledChance(ability, user, status) !== undefined;
}
