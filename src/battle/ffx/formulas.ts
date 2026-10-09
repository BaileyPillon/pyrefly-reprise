/**
 * The FFX damage chain, from the game's own kernels (re-parity W1; **FFX only**).
 *
 * The chain used to live here as the engine's own arithmetic. It is now `kernel/damage.ts` (the base damage of
 * formulas 1 to 0x17), `kernel/modifiers.ts` (the sixteen per-hit steps in the game's order), `kernel/element.ts`
 * (the element ladder) and `kernel/aftermath.ts` (the cap), composed by `kernel/hitdamage.ts` exactly as the exe's
 * per-hit pipeline composes them (`research/re-ffx-damage.md` sections 2 to 6), and fed by `adapt/hit.ts`. What is
 * left here is the one-hit entry point tests and the debug API call with the rolls given, and the re-exports that
 * keep the module a single import site for "the numbers an action produces".
 *
 * Healing is **negative damage**: the sign flips in the base-damage function and not for a Zombie target, which is
 * the whole reason Zombie works and why the contract forbids a `heal` event for damage-formula healing
 * [docs/CONTRACTS.md].
 */

import type { Affinity, AbilityDef, ElementId, FFXCombatant } from '../common/types.ts';
import { fixedHit, type HitReport, type TimingBonus } from './adapt/hit.ts';
import { baseCtb } from './math.ts';

export type { TimingBonus } from './adapt/hit.ts';
export { estimatedDamage } from './adapt/preview.ts';
export { resolveAffinity, resolveElements } from './elements.ts';
// Hit and critical chance live in `accuracy.ts`; re-exported here so callers have one import site.
export { hitChance, critChance } from './accuracy.ts';

/** Everything one hit of the damage chain needs, with its random inputs already rolled. */
export interface DamageInput {
  user: FFXCombatant;
  target: FFXCombatant;
  def: AbilityDef;
  /** Overrides `def.power` (Slots resolve their own DmgCon, Fury its tier). */
  power?: number;
  crit: boolean;
  /** `damageRNG`, a uniform integer 0-31. 16 is exactly x1.0. */
  varianceRoll: number;
  /** Resolved element set, including weapon strikes. */
  elements: readonly ElementId[];
  timing?: TimingBonus | null;
  /** Spare Change only. */
  gilSpent?: number;
  /** The target's CTB counter, for the `ctb` formula. */
  targetCtb?: number;
}

/** What one hit of the damage chain produced. */
export interface DamageResult {
  /** Signed amount of the command's first damage class (HP, else MP, else CTB). Positive damages, negative restores. */
  amount: number;
  affinity: Affinity;
  /** True when the 9 999 / 99 999 cap bit. */
  capped: boolean;
}

/** The amount of a report's first damage class. */
function firstClassAmount(report: HitReport): number {
  if ((report.classes & 1) !== 0) return report.amounts[0];
  if ((report.classes & 2) !== 0) return report.amounts[1];
  if ((report.classes & 4) !== 0) return report.amounts[2];
  return 0;
}

/**
 * One hit of the chain with its rolls given: the hit lands, the variance and the critical decision are the ones
 * passed in. The engine itself resolves a hit through `adapt/hit.ts#resolveHit`, which draws them in the game's
 * order; this is the same computation with the draws fixed.
 */
export function computeDamage(input: DamageInput): DamageResult {
  const report = fixedHit(
    {
      actor: input.user,
      statsUser: input.user,
      target: input.target,
      row: input.def,
      ...(input.power !== undefined ? { power: input.power } : {}),
      ...(input.timing ? { timing: input.timing } : {}),
      ...(input.gilSpent !== undefined ? { gilSpent: input.gilSpent } : {}),
      targetCtb: input.targetCtb ?? 0,
      targetTick: baseCtb(input.target.stats.agi),
      isCounter: false,
      elements: input.elements,
    },
    input.varianceRoll,
    input.crit,
  );
  return { amount: firstClassAmount(report), affinity: report.affinity, capped: report.capped };
}
