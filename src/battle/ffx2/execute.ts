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
import { resolveTheft } from './steal.ts';
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
  if ('extra' in command && command.extra) return false;
  // A **bare re-submit of the same action** is the presenter saying nobody is
  // going to play this overlay, so the engine rolls the outcome itself rather
  // than asking again — asking again is an unbounded loop, and the FFX engine
  // was measured re-picking one Overdrive 19,916 times before it was fixed.
  // Backing out of the overlay and choosing a *different* timed action is not
  // that, and still opens its own overlay.
  const awaiting = env.getAwaiting();
  return !(awaiting !== null && sameAction(awaiting, command));
}

/** Two commands naming the same action — the re-submit the contract describes. */
function sameAction(a: Command, b: Command): boolean {
  if (a.kind !== b.kind) return false;
  const idA = 'id' in a ? a.id : '';
  const idB = 'id' in b ? b.id : '';
  return idA === idB;
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

  // Spend the item. One party inventory, decremented on the resolving action
  // rather than on the pick, so an interrupted charge does not eat the stock.
  if (command.kind === 'item') {
    const key = `inventory:${command.id}`;
    const left = env.state.flags[key];
    if (typeof left === 'number') env.state.flags[key] = Math.max(0, left - 1);
  }

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

  // Steal and Pilfer Gil are thefts, not hits (`steal.ts`); everything else resolves normally.
  const theft = { units: env.units, state: env.state, rng: env.rng, emit: (e: EventDraft) => env.emit(e), ...(env.items ? { items: env.items } : {}) };
  if (!resolveTheft(theft, actor, ability, command.targets)) {
    resolveAbility(env.resolveCtx(), actor, ability, command.targets, {
      multiTarget,
      ...(hits !== null ? { hitsOverride: hits } : {}),
    });
  }

  const recoveryValue = ability.flags.includes('2xrt')
    ? ATB_DOUBLE_RECOVERY_VALUE
    : (ability.recoveryTicks ?? ATB_BASE_VALUE);
  finishAction(env, actor, before, extraRecoveryTicks(recoveryValue, actor.stats.agi));
}
