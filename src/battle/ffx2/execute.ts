/**
 * Turning one `Command` into events: charge, minigame, resolve, recover.
 *
 * Split out of `engine.ts` so both live under the 400-line house rule. The
 * engine hands in an {@link ExecEnv} rather than `this`, which also makes the
 * four-phase pipeline testable on its own.
 *
 * The order here is the ATB pipeline from [ffx2-combat-core §1.1]:
 * ```
 * [command] -> [CTIM charge, purple bar] -> [execute] -> [RECTIM recovery]
 * ```
 * with the minigame suspension (`docs/CONTRACTS.md`) sitting between the charge
 * and the execution.
 */

import type {
  AbilityDef,
  AtbSnapshot,
  BattleState,
  CombatantId,
  Command,
  Rng,
} from '../common/types.ts';
import type {
  AbilityRegistry,
  DressphereRegistry,
  EventDraft,
  Ffx2EngineOptions,
  Ffx2Unit,
  GarmentGridRegistry,
  ItemRegistry,
} from './internal.ts';
import { resolveAbility, type ResolveContext } from './resolve.ts';
import { performSpherechange } from './spherechange.ts';
import { attachedResult, hitsFromOutcome, rollDefault } from './minigames.ts';
import { beginCharge, beginRecovery, chargeTicksFor, extraRecoveryTicks } from './gauges.ts';
import { ATB_BASE_VALUE, ATB_DOUBLE_RECOVERY_VALUE } from './constants.ts';

/** Everything `performCommand` needs from the engine. */
export interface ExecEnv {
  units: Ffx2Unit[];
  state: BattleState;
  rng: Rng;
  options: Ffx2EngineOptions;
  abilities: AbilityRegistry;
  items?: ItemRegistry;
  grids: GarmentGridRegistry;
  dresspheres: DressphereRegistry;
  gridNodes: Record<CombatantId, Array<string | null>>;
  emit(event: EventDraft): void;
  snapshot(): AtbSnapshot;
  resolveCtx(): ResolveContext;
  /** How many drafts exist right now, so an action can slice its own events. */
  draftCount(): number;
  /** Post-action bookkeeping: AI hooks, story triggers, battle end. */
  afterAction(actor: Ffx2Unit, startedAt: number): void;
  /** Story triggers and the battle-end check, without the AI hooks. */
  flushSignal(startedAt: number, actor: Ffx2Unit): void;
  /** The command suspended on a timed-input overlay, if any. */
  getAwaiting(): Command | null;
  setAwaiting(command: Command | null): void;
}

/** Protect-reducible / Shell-reducible / neither — the Bulwarks answer in kind. */
export function attackClass(ability: AbilityDef): string {
  if (ability.damageType === 'physical') return 'protect-reducible';
  if (ability.damageType === 'magical') return 'shell-reducible';
  return 'none';
}

/** Which `AbilityDef` a command resolves to, if any. */
export function abilityFor(env: ExecEnv, command: Command): AbilityDef | undefined {
  if (command.kind === 'attack') return env.abilities.get('attack');
  if (command.kind === 'ability' || command.kind === 'overdrive') return env.abilities.get(command.id);
  if (command.kind === 'item') {
    // CONTRACT-CHANGES §7: `ItemDef.effect` is always an `AbilityId`.
    const item = env.items?.get(command.id);
    return item && typeof item.effect === 'string' ? env.abilities.get(item.effect) : undefined;
  }
  return undefined;
}

/**
 * Whether to suspend for a timed-input overlay.
 *
 * `docs/CONTRACTS.md`: when `extra` is absent because nobody can play the
 * minigame — an AI actor, auto-battle, a deterministic test — the engine rolls
 * a default from the seeded RNG and never emits the request at all.
 */
function needsMinigame(env: ExecEnv, actor: Ffx2Unit, ability: AbilityDef, command: Command): boolean {
  if (!ability.minigame) return false;
  if (actor.controller !== 'player') return false;
  if (env.options.minigames === false) return false;
  if (env.getAwaiting()) return false;
  return !('extra' in command && command.extra);
}

/** End the action: spend the gauge, close it out, and run the hooks. */
function finishAction(env: ExecEnv, actor: Ffx2Unit, startedAt: number, extraRecovery = 0): void {
  beginRecovery(actor, extraRecovery);
  env.emit({ type: 'action-end', actorId: actor.id });
  env.emit({ type: 'atb', snapshot: env.snapshot() });
  env.afterAction(actor, startedAt);
}

/**
 * Resolve one command for `actor`.
 *
 * `alreadyCharged` is true when this is the deferred half of a `CT` ability
 * whose purple bar has just emptied — the wind-up was announced then, so the
 * `action-start` is not repeated.
 */
export function performCommand(
  env: ExecEnv,
  actor: Ffx2Unit,
  command: Command,
  alreadyCharged: boolean,
  startedAt?: number,
): void {
  const before = startedAt ?? env.draftCount();

  // L1 spherechange consumes the whole turn and has no charge bar. §4.2
  if (command.kind === 'spherechange') {
    performSpherechange(
      actor,
      command,
      { grids: env.grids, dresspheres: env.dresspheres, gridNodes: env.gridNodes },
      (e) => env.emit(e),
    );
    finishAction(env, actor, before);
    return;
  }

  const ability = abilityFor(env, command);
  if (!ability) {
    // Escape, Defend, Trigger and anything the registry does not know still
    // spend the turn rather than silently doing nothing.
    finishAction(env, actor, before);
    return;
  }

  // The purple charge bar runs before the ability fires, shortened by any
  // "<skillset> wait down" gate bonus she has banked this battle. §1.1, §1.3
  const waitDown = typeof actor.aiMemory?.['waitDown'] === 'number' ? actor.aiMemory['waitDown'] : 0;
  const chargeTicks = alreadyCharged ? 0 : chargeTicksFor(ability, actor, waitDown);
  if (chargeTicks > 0) {
    env.emit({
      type: 'action-start',
      actorId: actor.id,
      command,
      abilityId: ability.id,
      abilityName: ability.name,
      targets: command.targets,
    });
    beginCharge(actor, command, chargeTicks);
    actor.pendingCommand = command;
    env.emit({ type: 'atb', snapshot: env.snapshot() });
    env.flushSignal(before, actor);
    return;
  }

  if (needsMinigame(env, actor, ability, command)) {
    env.setAwaiting(command);
    env.emit({
      type: 'minigame-request',
      who: actor.id,
      kind: ability.minigame as NonNullable<AbilityDef['minigame']>,
      params: { ...(ability.extra ?? {}), abilityId: ability.id },
    });
    return;
  }
  env.setAwaiting(null);

  if (!alreadyCharged) {
    env.emit({
      type: 'action-start',
      actorId: actor.id,
      command,
      abilityId: ability.id,
      abilityName: ability.name,
      targets: command.targets,
    });
  }

  // The Bulwark retaliation log reads this. [ffx2-vegnagun-shuyin §3.3]
  if (actor.side === 'party') env.state.flags['lastAttackClass'] = attackClass(ability);

  // Step 15's halving is scoped to the *player's* Black/White Magic cast on
  // all — enemy party-wide moves are not halved. §2.1
  const multiTarget =
    actor.side === 'party' &&
    (ability.category === 'blackmagic' || ability.category === 'whitemagic') &&
    (ability.targeting === 'all-enemies' || ability.targeting === 'all-allies');

  const outcome = ability.minigame
    ? (attachedResult(command) ?? rollDefault(ability.minigame, env.rng))
    : null;
  const hits = hitsFromOutcome(outcome);

  resolveAbility(env.resolveCtx(), actor, ability, command.targets, {
    multiTarget,
    ...(hits !== null ? { hitsOverride: hits } : {}),
  });

  const recoveryValue = ability.flags.includes('2xrt')
    ? ATB_DOUBLE_RECOVERY_VALUE
    : (ability.recoveryTicks ?? ATB_BASE_VALUE);
  finishAction(env, actor, before, extraRecoveryTicks(recoveryValue, actor.stats.agi));
}
