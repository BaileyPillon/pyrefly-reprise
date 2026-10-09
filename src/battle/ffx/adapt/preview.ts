/**
 * The numbers the advisor, the intent panel and the Overdrive gauge ask the game's kernels for without rolling
 * anything (re-parity W1; **FFX only**): the hit chance, the critical chance, and the reference damage.
 *
 * They read the same inputs a real hit reads (`./hit.ts`), so what a preview prints is what the engine rolls.
 */

import type { AbilityDef, FFXCombatant } from '../../common/types.ts';
import { baseDamage } from '../kernel/damage.ts';
import { critChanceOf } from '../kernel/crit.ts';
import { hitPlan } from '../kernel/hit.ts';
import { resolveCommand } from './command.ts';
import { critCheckInputOf, hitCheckInputOf, type HitRequest } from './hit.ts';

/** A request for a preview: nothing is rolled, so the CTB and tick inputs (which only the damage classes read) are zero. */
function previewRequest(actor: FFXCombatant, target: FFXCombatant, row: AbilityDef): HitRequest {
  return { actor, statsUser: actor, target, row, targetCtb: 0, targetTick: 0, isCounter: false };
}

/**
 * The percent chance that `actor` hits `target` with `def`, or `null` when the game rolls no hit for it: a command
 * that always hits (accuracy formula 0: every spell, item and Overdrive), a sleeping or petrified target, or a
 * command with no effect on this target. The value is the game's sum, not clamped: a hit needs `roll < percent`
 * with the roll 0 to 100, so 101 or more never misses and 0 or less never hits.
 */
export function hitChancePercent(actor: FFXCombatant, target: FFXCombatant, def: AbilityDef): number | null {
  const req = previewRequest(actor, target, def);
  const plan = hitPlan(hitCheckInputOf(req, resolveCommand(def, actor.side)));
  return plan.rolls ? plan.percent : null;
}

/** The percent chance of a critical hit, or 0 for a command that cannot crit. Not clamped. */
export function critChancePercent(actor: FFXCombatant, target: FFXCombatant, def: AbilityDef): number {
  const req = previewRequest(actor, target, def);
  return critChanceOf(critCheckInputOf(req, resolveCommand(def, actor.side))) ?? 0;
}

/**
 * The reference figure the Warrior Overdrive mode measures against: the damage of a plain strike at power 16 that
 * ignores the target's defence, from Strength or from Magic, whichever is higher [ffx-combat-core §5.1]. The game
 * computes it by calling its base-damage function directly for formula 0xe (Strength cube) or 0x14 (Magic cube),
 * with no command, no variance and no stacks (`research/re-ffx-damage.md` section 2).
 */
export function estimatedDamage(user: FFXCombatant): number {
  const useMagic = user.stats.mag > user.stats.str;
  const value = baseDamage(
    {
      user: { str: user.stats.str, mag: user.stats.mag, cheer: 0, focus: 0, maxHp: user.stats.maxHp, maxMp: user.stats.maxMp, hp: user.hp, mp: user.mp },
      target: {
        id: 0xff, def: 0, mdf: 0, cheer: 0, focus: 0, maxHp: 0, maxMp: 0, baseCtb: 0, runningHp: 0, runningMp: 0, runningCtb: 0, saveCounter: 0,
      },
      cmd: null,
      formula: useMagic ? 0x14 : 0x0e,
      power: 16,
      snapshot: 0,
      mode: 1,
      variance: false,
    },
    () => 0,
  ).value;
  return Math.max(1, value);
}
