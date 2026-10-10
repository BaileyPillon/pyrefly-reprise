/**
 * **How AI lane B's scripts hang on the engine's one hit runner** (re-parity; **FFX only**): Yunalesca, Braska's Final
 * Aeon, the Yu Pagodas, the five possessed aeons and Yu Yevon.
 *
 * There is exactly one runner for the game's `onHit` (`research/re-ffx-ai-yunalesca-bfa.md` section 1.1,
 * `research/re-ffx-ai-seymour.md` section 1.1): once per action per target, after the last of the action's hit records
 * on that target and before the death check. It is `./hooks.ts#runOnHit`, called from `abilities.ts#finishTouched`
 * over the tally `hit-apply.ts` keeps, and the Chapter I, VII, X and XII scripts register on it directly
 * (`registerScriptHooks`). Chapters II and III were written against a hit event of their own, so this module is the
 * thin layer that lets their five scripts keep that shape and still run on the same runner:
 *
 * - {@link registerHitScript} registers an `onHit` that is handed a {@link HitEvent} (the target, the attacker, the
 *   command, `LastDamageTakenHP` and the command's HP class bit; the report's definitions are the same in both lanes) and, with
 *   `managesHp`, makes the target's KO wait for the hook (`ScriptHooks.holdsDeath`): the script refills or revives
 *   its body, or the engine kills it afterwards (`hp.ts#settleDeferredDeath`).
 * - {@link queueCounter} asks for a free action aimed at the attacker through the shared reaction queue, and keeps
 *   the engine's older rule that **a counter never triggers another counter**: while the reactions of an action
 *   resolve (`FFXRuntime.inReaction`, set by `engine-end.ts#afterAction`) it asks for nothing. The scripts of
 *   Chapters I, VII, X and XII chain on purpose and never read the flag.
 *
 * Imports types and the registry only, so a script can register at load time without pulling the damage chain
 * behind it into an import cycle.
 */

import type { AbilityDef, CombatantId, Command, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import type { Ctx } from '../state.ts';
import { queueReaction, registerScriptHooks } from './hooks.ts';

/** One hit event: the hits of one sub-action on one target are all applied. */
export interface HitEvent {
  ctx: Ctx;
  /** The enemy that was hit. */
  target: FFXCombatant;
  /** Who acted: the game's "last attacker" (`Chr+0xDED`). */
  attacker: FFXCombatant;
  /** The command that hit (`usedCommand()`). */
  def: AbilityDef;
  /**
   * `LastDamageTakenHP` (property 166): the sum of the sub-action's HP results on this target, each after the
   * 9,999 cap (99,999 with Break Damage Limit) and **before** the clamp to the HP that was left, so it includes
   * overkill. Negative for a heal; a heal that lands on a Zombie is already damage here (the kernel inverts it).
   */
  lastDamage: number;
  /** The command's damage class includes HP (`readCommandProperty(cmd, affectHP)`). */
  affectsHp: boolean;
}

/** An `onHit` script. */
export type HitHook = (event: HitEvent) => void;

/**
 * Register the `onHit` hook of an AI script id (the id `EnemyForm.aiScriptId` / `EnemyFields.aiScriptId` names).
 * `managesHp`: the script decides, inside the hook, whether a target at 0 HP is refilled (a form change, a Yu Pagoda's
 * "destruction") or really dies.
 */
export function registerHitScript(scriptId: string, hook: HitHook, options: { managesHp?: boolean } = {}): void {
  registerScriptHooks(scriptId, {
    ...(options.managesHp === true ? { holdsDeath: true } : {}),
    onHit: (ctx, self, used, report) =>
      hook({ ctx, target: self, attacker: used.user, def: used.def, lastDamage: report.lastDamage, affectsHp: report.affectsHp }),
  });
}

/** A free action a script asks for at the combatant that hit it: the game's `performCommand` from inside `onHit`. */
export interface Counter {
  /** Who performs it. */
  actorId: CombatantId;
  /** The combatant it is aimed at: the `counter` event's target, and the one the game's queue refuses it for if it is gone. */
  targetId: CombatantId;
  command: Command;
}

/**
 * Queue a counter from a hook. A hit that lands while a reaction is itself resolving updates the script's state but asks
 * for nothing more: a counter never triggers another counter (the rule `ai/reactions.ts` has always held).
 */
export function queueCounter(ctx: Ctx, counter: Counter): void {
  if (ctx.rt.inReaction === true) return;
  // `keepsControl`: the scripts test whether the actor can act themselves (`game-rolls.ts#canQueue`); Provoke is not among their tests.
  queueReaction(ctx, counter.actorId, counter.command, {
    keepsControl: true,
    byId: counter.targetId,
    requiresAlive: counter.targetId,
  });
}

/** The command's damage type as the scripts read it: the low two bits of its damage flags (0 neither, 1 physical, 2 magical, 3 both). */
export function damageTypeOf(def: AbilityDef, attacker: FFXCombatant): number {
  return resolveCommand(def, attacker).record.flagsDamage & 3;
}
