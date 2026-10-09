/**
 * **The game's boss-script hooks** (re-parity, `research/re-ffx-ai-seymour.md` section 1.1).
 * **FFX only** [AGENTS.md rule 14].
 *
 * A monster's script has up to nine entry points. Besides the turn itself (our `AiScript`), the
 * engine runs these at fixed moments, and several fights are built on exactly when:
 *
 * | Hook | When the engine runs it | Where we run it |
 * |---|---|---|
 * | `preTurn` | once per turn start, before Doom and the action request; also for every party member and aeon (the formation script's handlers) | `ticks.ts#onTurnStart` |
 * | `onTargeted` | for each target of a valid command, before any damage | `abilities.ts#resolveAbility`, once per action per target |
 * | `onHit` | **once per action per target, after the last of that action's hit records on the target is applied, and before the death check** (a miss counts: the record is still applied) | `abilities.ts#resolveAbility`, after each target's hits |
 * | `postPoison` | right after the poison damage of that monster's own turn | `ticks.ts#onTurnEnd` |
 *
 * `onHit` before the death check is what lets Mortiorchis, Mortibody and Macalania Seymour put
 * HP back so the death never happens: a hook that {@link ScriptHooks.holdsDeath} makes
 * `hp.ts#dealDamage` leave a lethal hit's KO pending until the hook has run
 * (`hp.ts#settleDeferredDeath` finishes it when the hook did not save the target).
 *
 * **Reactions.** A command a hook queues becomes a reaction of its owner: it runs after the
 * triggering action resolves, adds no CTB delay, and may itself trigger hooks, which append to the
 * same first-in-first-out queue (`reaction-drain.ts`). `forced` is the game's `forcePerformCommand`
 * (queued whatever the owner's state); a normal one needs the owner to be able to act
 * ({@link canQueueCommand}).
 *
 * The registry knows nothing about any fight: each fight's module registers its hooks under its
 * `aiScriptId` at load time, as it registers its turn script. This module imports types only, so
 * the engine's resolver can use it without an import cycle.
 */

import type { AbilityDef, CombatantId, Command, FFXCombatant } from '../../common/types.ts';
import type { Ctx, EventInput } from '../state.ts';

/** The command a hook is told about (the game's `usedCommand()`) and who used it. */
export interface UsedCommand {
  readonly def: AbilityDef;
  readonly user: FFXCombatant;
}

/** What `onHit` knows about the action's effect on its owner. */
export interface HitReport {
  /** The owner's HP before the first hit record of this action reached it. */
  readonly hpBefore: number;
  /** True when the action took HP from it (a heal, a miss and a zero-damage action did not). */
  readonly lostHp: boolean;
}

/** One script's hooks. */
export interface ScriptHooks {
  /** The KO of a lethal hit waits for this script's `onHit` (it may put HP back). */
  readonly holdsDeath?: boolean;
  preTurn?(ctx: Ctx, self: FFXCombatant): void;
  onTargeted?(ctx: Ctx, self: FFXCombatant, used: UsedCommand): void;
  onHit?(ctx: Ctx, self: FFXCombatant, used: UsedCommand, report: HitReport): void;
  postPoison?(ctx: Ctx, self: FFXCombatant): void;
}

/** A pre-turn handler the formation script gives every actor (party, aeons and monsters). */
export type FormationPreTurn = (ctx: Ctx, actor: FFXCombatant) => void;

const SCRIPT_HOOKS = new Map<string, ScriptHooks>();
const FORMATION_PRE_TURN: FormationPreTurn[] = [];

/** Register a script's hooks under its `aiScriptId`. */
export function registerScriptHooks(scriptId: string, hooks: ScriptHooks): void {
  SCRIPT_HOOKS.set(scriptId, hooks);
}

/** Register a formation-level pre-turn handler (it must test for its own formation). */
export function registerFormationPreTurn(handler: FormationPreTurn): void {
  if (!FORMATION_PRE_TURN.includes(handler)) FORMATION_PRE_TURN.push(handler);
}

/** The `aiScriptId` in force for a combatant (a form's own id wins), without importing the AI index. */
export function scriptIdOf(c: FFXCombatant): string | undefined {
  const enemy = c.enemy;
  if (!enemy) return undefined;
  return enemy.forms[enemy.formIndex]?.aiScriptId ?? enemy.aiScriptId;
}

/** The hooks of a combatant's script, if it has any. */
export function hooksOf(c: FFXCombatant): ScriptHooks | undefined {
  const id = scriptIdOf(c);
  return id === undefined ? undefined : SCRIPT_HOOKS.get(id);
}

/** True when a lethal hit on `c` must wait for its `onHit` before the KO is decided. */
export function holdsDeathForHook(c: FFXCombatant): boolean {
  return hooksOf(c)?.holdsDeath === true;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

/** Turn start: the formation's handlers for everybody, then the actor's own script. */
export function runPreTurn(ctx: Ctx, actor: FFXCombatant): void {
  for (const handler of FORMATION_PRE_TURN) handler(ctx, actor);
  hooksOf(actor)?.preTurn?.(ctx, actor);
}

/** An action named these targets: every target with a script hears it once. */
export function runOnTargeted(ctx: Ctx, used: UsedCommand, targets: readonly FFXCombatant[]): void {
  for (const target of targets) hooksOf(target)?.onTargeted?.(ctx, target, used);
}

/** An action's hit records are all on `target`: its script hears it once. */
export function runOnHit(ctx: Ctx, used: UsedCommand, target: FFXCombatant, report: HitReport): void {
  hooksOf(target)?.onHit?.(ctx, target, used, report);
}

/** A poison tick just landed on `actor` on its own turn. */
export function runPostPoison(ctx: Ctx, actor: FFXCombatant): void {
  hooksOf(actor)?.postPoison?.(ctx, actor);
}

// ---------------------------------------------------------------------------
// The reaction queue
// ---------------------------------------------------------------------------

/** One queued reaction. */
export type Reaction =
  | {
      kind: 'command';
      /** Whose command it is (the user). */
      ownerId: CombatantId;
      command: Command;
      /** `forcePerformCommand`: queued whatever the owner's state. */
      forced: boolean;
      /** The script keeps control when Provoked (only Natus does). */
      keepsControl: boolean;
      /** The actor whose action set it off, for the `counter` event. */
      byId: CombatantId;
    }
  | {
      /** Mortibsorption: the mount's max HP into the host, and the mount comes back (`scripted.ts#mortibsorption`). */
      kind: 'drain';
      mountId: CombatantId;
      hostId: CombatantId;
    }
  | {
      /**
       * An event a hook wants **after** the action's own events (a story line that pauses playback, which must not
       * land between a spell's damage numbers and its `action-end`). Emitted when the queue drains.
       */
      kind: 'emit';
      event: EventInput;
    };

/**
 * One queue per battle runtime, held beside it rather than inside it: `FFXRuntime` is cloned for the
 * advisor's dry runs and structured-cloned for forks, and a queue only ever holds anything inside one
 * action (it is empty again by the time `afterAction` returns), so a clone simply starts with none.
 */
const QUEUES = new WeakMap<object, Reaction[]>();

function queueOf(ctx: Ctx): Reaction[] {
  let queue = QUEUES.get(ctx.rt);
  if (!queue) {
    queue = [];
    QUEUES.set(ctx.rt, queue);
  }
  return queue;
}

/** Queue a command as a reaction of `ownerId`. */
export function queueReaction(
  ctx: Ctx,
  ownerId: CombatantId,
  command: Command,
  options: { forced?: boolean; keepsControl?: boolean; byId?: CombatantId } = {},
): void {
  queueOf(ctx).push({
    kind: 'command',
    ownerId,
    command,
    forced: options.forced === true,
    keepsControl: options.keepsControl === true,
    byId: options.byId ?? ownerId,
  });
}

/** Queue an event for when the action's own events are done (see {@link Reaction}). */
export function queueEmit(ctx: Ctx, event: EventInput): void {
  queueOf(ctx).push({ kind: 'emit', event });
}

/** Queue the mount's Mortibsorption on its host. */
export function queueDrain(ctx: Ctx, mountId: CombatantId, hostId: CombatantId): void {
  queueOf(ctx).push({ kind: 'drain', mountId, hostId });
}

/** The next reaction, removed from the queue. */
export function takeReaction(ctx: Ctx): Reaction | undefined {
  return QUEUES.get(ctx.rt)?.shift();
}

/** True when anything is waiting. */
export function hasReactions(ctx: Ctx): boolean {
  return (QUEUES.get(ctx.rt)?.length ?? 0) > 0;
}

/**
 * The game's `performCommand` gate for a normal (not forced) command: the owner must be able to
 * act. Not petrified, ejected, KO'd, asleep, Confused, Berserk or Threatened, and not Provoked
 * unless its script keeps control.
 */
export function canQueueCommand(owner: FFXCombatant, keepsControl: boolean): boolean {
  if (!owner.alive || owner.removed) return false;
  const s = owner.statuses;
  if (s['ko'] || s['eject'] || s['petrify'] || s['sleep'] || s['confuse'] || s['berserk'] || s['threaten']) return false;
  if (s['provoke'] && !keepsControl) return false;
  return true;
}
