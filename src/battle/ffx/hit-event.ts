/**
 * **Running the hit events of one sub-action** (re-parity, AI lane B; **FFX only**). The registry and the shapes are
 * `hit-hooks.ts`; this is the part `abilities.ts#resolveAbility` calls once an action's hits are all applied.
 *
 * `hit-apply.ts#resolveOneHit` keeps a tally per target it touched (every outcome counts, a miss and a nullified hit
 * too: the game raises the hook for those) and adds each hit's HP result to it, which is `LastDamageTakenHP`. When the
 * action is done, each touched target whose script registered a hook gets it, in the order the targets were first
 * touched. A body whose script manages its own HP (`managesHp`) was held at 0 HP while the hits landed
 * (`hp.ts#dealDamage`, `deferKo`); if its hook left it there it dies now, which is the game's order: the hook, then the
 * death check (`pp_BtlApplyHitRecords`, then `pp_BtlDamageCheckDeath`).
 *
 * A doublecast is two sub-actions, so two events for the same target (`doublecast.ts` resolves two actions): the note
 * reads the executor that way (section 1.1) and has not run it through the engine, so this follows it.
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../common/types.ts';
import { resolveCommand } from './adapt/command.ts';
import { hitScriptOf } from './hit-hooks.ts';
import { koActor } from './hp.ts';
import { type Ctx, isAlive } from './state.ts';

/** What one action did to one target so far: the target and its running `LastDamageTakenHP`. */
export interface Touched {
  target: FFXCombatant;
  hp: number;
}

/** The targets one action touched, in the order it first touched them. */
export type TouchedMap = Map<CombatantId, Touched>;

/** Note that a hit record is being applied to `target`, and get its running tally. */
export function touch(touched: TouchedMap, target: FFXCombatant): Touched {
  let seen = touched.get(target.id);
  if (seen === undefined) {
    seen = { target, hp: 0 };
    touched.set(target.id, seen);
  }
  return seen;
}

/** `readCommandProperty(cmd, affectHP)`: the command's damage class includes HP (the game's record, else the ability's own flags). */
export function affectsHp(def: AbilityDef, attacker: FFXCombatant): boolean {
  return (resolveCommand(def, attacker).record.damageClass & 1) !== 0;
}

/** The command's damage type as the scripts read it: the low two bits of its damage flags (0 neither, 1 physical, 2 magical, 3 both). */
export function damageTypeOf(def: AbilityDef, attacker: FFXCombatant): number {
  return resolveCommand(def, attacker).record.flagsDamage & 3;
}

/** Run the hooks of an action that has applied all its hits. */
export function runHitEvents(ctx: Ctx, attacker: FFXCombatant, def: AbilityDef, touched: TouchedMap): void {
  for (const seen of touched.values()) {
    const script = hitScriptOf(seen.target);
    if (script === undefined) continue;
    script.hook({
      ctx,
      target: seen.target,
      attacker,
      def,
      lastDamage: seen.hp,
      affectsHp: affectsHp(def, attacker),
    });
    if (script.managesHp && seen.target.hp === 0 && isAlive(seen.target)) koActor(ctx, seen.target, attacker.id);
  }
}
