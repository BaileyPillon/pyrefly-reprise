/**
 * **Hit events**: the game's `onHit` hook, once per target per sub-action (re-parity, AI lane B; **FFX only**).
 *
 * `research/re-ffx-ai-yunalesca-bfa.md` section 1.1 (read in FFX.exe, `pp_BtlApplyHitRecords` 0x0078f060): after the
 * last hit record of a sub-action has been applied to a target, whether those hits damaged, missed, healed or only
 * touched statuses, the target's script gets one `onHit` call, and it runs **before** the death check
 * (`pp_BtlDamageCheckDeath`). So a script can refill its own HP inside the hook and the monster simply does not die.
 * Two things in the engine only ever knew a per-hit world and a per-action one:
 *
 * - the form changes of Yunalesca and Braska's Final Aeon and the destruction of a Yu Pagoda ran inside the hit that
 *   took the HP to 0, so the rest of a multi-hit action landed on the new form (the game discards it);
 * - the counters (`ai/reactions.ts`) were collected from the damage events of the whole action, so an evaded or
 *   zero-damage action never provoked one (the game's hook runs for those too).
 *
 * This module is the registry and the shapes. The runner is `hit-event.ts` (called from `abilities.ts#resolveAbility`
 * after the hits); the scripts that register here are `ai/yunalesca.ts`, `ai/braskas-final-aeon.ts`, `ai/yu-pagoda.ts`,
 * `ai/possessed-aeons.ts` and `ai/yu-yevon.ts`. It imports types only, so an AI script can register at load time
 * without pulling the damage chain behind it into an import cycle.
 *
 * Inert for every combatant whose script registers no hook: nothing in any other chapter reads it, so their event
 * logs are unchanged (`tests/unit/ffx-engine-golden.test.ts`).
 */

import type { AbilityDef, Command, CombatantId, FFXCombatant } from '../common/types.ts';
import type { Ctx } from './state.ts';

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

/** A free action a hook asked for: the game's `performCommand` from inside `onHit`, run once the sub-action is done. */
export interface Reaction {
  /** Who performs it. */
  actorId: CombatantId;
  /** The `counter` event's target, and the combatant a dead one is refused for (the queue refuses a dead target). */
  targetId: CombatantId;
  command: Command;
  /** The `counter` event's `cause`. */
  cause: string;
}

/** The two runtime fields hooks use (`state.ts#FFXRuntime` extends this; both are absent until first needed). */
export interface HitRuntime {
  /** Free actions the hooks asked for this turn; `engine-end.ts#afterAction` runs them once the action is done. */
  reactions?: Reaction[];
  /** True while a reaction (a counter) is resolving: a hit it lands queues no further reaction. */
  inReaction?: boolean;
  /** `state.nextSeq` when Yunalesca last changed form: a Doublecast whose first cast did it cancels the second (row Y6). */
  formDiedAtSeq?: number;
}

/** An `onHit` script. */
export type HitHook = (event: HitEvent) => void;

interface HitScript {
  hook: HitHook;
  /**
   * The script decides, inside the hook, whether a target at 0 HP is refilled (a form change, a Yu Pagoda's
   * "destruction") or really dies. While one of this script's targets takes the hits of an action its KO waits for the
   * hook, so the rest of the action lands on a 0-HP body, which is what the game does (section 2.10 of the note).
   */
  managesHp: boolean;
}

const HIT_SCRIPTS = new Map<string, HitScript>();

/** Register the `onHit` hook of an AI script id (the id `EnemyForm.aiScriptId` / `EnemyFields.aiScriptId` names). */
export function registerHitScript(scriptId: string, hook: HitHook, options: { managesHp?: boolean } = {}): void {
  HIT_SCRIPTS.set(scriptId, { hook, managesHp: options.managesHp === true });
}

/** The script id in force for this combatant right now (the same rule as `ai/index.ts#activeScriptId`). */
function scriptIdOf(c: FFXCombatant): string | undefined {
  const enemy = c.enemy;
  if (!enemy) return undefined;
  return enemy.forms[enemy.formIndex]?.aiScriptId ?? enemy.aiScriptId;
}

/** The hit script of a combatant, if its AI script registered one. */
export function hitScriptOf(c: FFXCombatant): HitScript | undefined {
  const id = scriptIdOf(c);
  return id === undefined ? undefined : HIT_SCRIPTS.get(id);
}

/** True when this combatant's KO is the hook's to decide (see {@link HitScript.managesHp}). */
export function managesHp(c: FFXCombatant): boolean {
  return hitScriptOf(c)?.managesHp === true;
}

/**
 * Queue a free action from a hook. A hit that lands while a reaction is itself resolving updates the script's state
 * but asks for nothing more: a counter never triggers another counter (the rule `ai/reactions.ts` has always held).
 */
export function queueReaction(ctx: Ctx, reaction: Reaction): void {
  if (ctx.rt.inReaction === true) return;
  (ctx.rt.reactions ??= []).push(reaction);
}

/** Take every queued reaction, oldest first. */
export function drainReactions(ctx: Ctx): Reaction[] {
  const queued = ctx.rt.reactions;
  if (queued === undefined || queued.length === 0) return [];
  ctx.rt.reactions = [];
  return queued;
}
