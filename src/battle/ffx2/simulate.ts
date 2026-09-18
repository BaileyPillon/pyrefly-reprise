/**
 * **Previewing** an FFX-2 command: what it would do, without doing it.
 *
 * The X-2 half of the move advisor's estimator. Same contract as
 * `src/battle/ffx/simulate.ts` — clone the state, resolve the command on the
 * copy with the shipped formulas, report what happened, never touch the live
 * battle — and the same three-roll sweep, using {@link RollPolicyRng} so the
 * two games' estimates are computed the same way and a test can pin both.
 *
 * ## Why this calls `resolveAbility` and not `performCommand`
 *
 * `performCommand` is the whole *turn*: the purple charge bar, the ATB
 * recovery, the AI hooks, the story triggers and the battle-end check.
 * Everything on that list is either scheduling (which a preview must not
 * predict — the gauges are real-time and the player has not committed yet) or a
 * consequence of the turn ending. `resolveAbility` is exactly the action: MP,
 * the HP cost a Dark Knight pays, per-hit targeting, the hit and crit checks,
 * the damage chain, the chain multiplier and every status rider.
 *
 * The one thing that path skips and this module has to put back is the
 * **minigame outcome**, because Trigger Happy's whole power is its shot count
 * and an estimate that resolved it as `hits: 1` would advise against the best
 * command in the Gunner's kit. {@link expectedMinigameHits} supplies it from
 * the engine's own default roller, swept across the three rolls: Trigger Happy
 * is 6-16 shots [`minigames.ts`, ffx2-combat-core §3.1], so a preview says
 * "6-16 hits" and means it.
 *
 * ## Chain
 *
 * The chain multiplier is read off the *cloned* target, so a preview taken
 * while a chain is live quotes the chained figure — which is the number the
 * player is about to get. `registerHit` then advances the clone's chain as the
 * previewed hits land, exactly as the real resolution would, so a multi-hit
 * action's later hits compound inside the estimate.
 */

import type {
  AbilityDef,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  FFX2Combatant,
  StatusId,
} from '../common/types.ts';
import type { AbilityRegistry, EventDraft, Ffx2Unit, ItemRegistry } from './internal.ts';
import { chainRegistries, defaultAbilities } from './abilities.ts';
import { chainMultiplier } from './chain.ts';
import { resolveAbility, type ResolveContext } from './resolve.ts';
import { critPercent, hitPercent } from './formulas.ts';
import { rollTriggerHappy, rollReels } from './minigames.ts';
import { SeededRng } from '../common/rng.ts';

// ----------------------------------------------------------------- the rolls

/** Which end of every magnitude roll a simulation takes. */
export type RollPolicy = 'min' | 'mid' | 'max';

/**
 * The deterministic stand-in for `SeededRng` a preview draws from.
 *
 * Deliberately **not** imported from `src/battle/ffx/simulate.ts`, where its
 * twin lives: the two engines share ids and share no code, and one importing
 * the other's module graph to borrow a thirty-line policy would be the first
 * edge in a dependency the layering rule exists to prevent
 * [docs/CONTRACTS.md, "Do not share status logic between the two games"].
 *
 * The split is the same in both. **Magnitude** rolls — X-2's step-7 randomiser
 * (`int(240, 271)` [ffx2-combat-core §2.1]), a Trigger Happy shot count, a
 * reel's hits — take the policy's end, and that is the range the advisor
 * prints. **Branch** rolls — `int(0, 99)` for the hit check, the critical check
 * and every status application — always take their median, so a preview shows
 * the *likely* outcome and the sweep never quietly turns "might crit" into a
 * higher top end.
 */
export class RollPolicyRng extends SeededRng {
  constructor(private readonly policy: RollPolicy) {
    super(0);
  }

  override next(): number {
    return 0.5;
  }

  override int(min: number, max: number): number {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (hi <= lo) return lo;
    const median = lo + Math.floor((hi - lo) / 2);
    if (lo === 0 && (hi === 100 || hi === 99 || hi === 255)) return median;
    if (this.policy === 'min') return lo;
    if (this.policy === 'max') return hi;
    return median;
  }

  /** The middle element, so a `random-enemy` aim is stable across the three rolls. */
  override pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('RollPolicyRng.pick: empty array');
    return items[Math.floor((items.length - 1) / 2)] as T;
  }

  override shuffle<T>(items: readonly T[]): T[] {
    return items.slice();
  }

  override weighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0) throw new Error('RollPolicyRng.weighted: empty array');
    let best = 0;
    for (let i = 1; i < items.length; i++) {
      if ((weights[i] ?? 0) > (weights[best] ?? 0)) best = i;
    }
    return items[best] as T;
  }
}

/** One status the previewed action put on, or took off, somebody. */
export interface SimStatusChange {
  targetId: CombatantId;
  status: StatusId;
  applied: boolean;
}

/**
 * What one previewed command did on the copy.
 *
 * Structurally identical to the FFX module's `SimOutcome` — the advisor
 * consumes one shape for both games — but declared here rather than imported,
 * because the two engines share ids and never share logic
 * [docs/CONTRACTS.md, engine agents].
 */
export interface SimOutcome {
  hpDelta: Record<CombatantId, number>;
  damageToEnemies: number;
  healingToAllies: number;
  harmToAllies: number;
  hits: number;
  misses: number;
  kills: CombatantId[];
  revives: CombatantId[];
  statusChanges: SimStatusChange[];
  mpSpent: number;
  rejected: boolean;
  ability: AbilityDef | null;
  events: BattleEvent[];
}

export interface Ffx2SimOptions {
  roll?: RollPolicy;
  /** The registries the live engine was constructed with; the baseline otherwise. */
  abilities?: AbilityRegistry;
  items?: ItemRegistry;
}

// ----------------------------------------------------------------- the clone

/** A state a preview may scribble on. The log is dropped — see the FFX twin. */
export function cloneStateForSim(state: Readonly<BattleState>): BattleState {
  const combatants: Record<CombatantId, FFX2Combatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    combatants[id] = deepClone(c) as FFX2Combatant;
  }
  return {
    game: state.game,
    combatants,
    activeIds: [...state.activeIds],
    reserveIds: [...state.reserveIds],
    enemyIds: [...state.enemyIds],
    aeonId: state.aeonId,
    turn: state.turn,
    ticks: state.ticks,
    log: [],
    nextSeq: 0,
    triggers: state.triggers.map((t) => ({ ...t })),
    firedTriggerIds: [...state.firedTriggerIds],
    result: null,
    seed: state.seed,
    flags: { ...state.flags },
  };
}

function deepClone<T>(value: T): T {
  const clone = (globalThis as { structuredClone?: <V>(v: V) => V }).structuredClone;
  if (typeof clone === 'function') return clone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

// ------------------------------------------------------------- the minigames

/**
 * How many hits a timed-input action lands, per roll policy.
 *
 * Drawn from the engine's own default rollers through {@link RollPolicyRng},
 * so the bounds cannot drift from the ones the engine actually rolls between:
 * `'min'` takes the low end of `rollTriggerHappy`'s 6-16, `'max'` the high end,
 * `'mid'` the midpoint. Returns `null` for an ability with no overlay, which
 * leaves `ability.hits` in charge.
 */
export function expectedMinigameHits(ability: AbilityDef, roll: RollPolicy): number | null {
  const rng = new RollPolicyRng(roll);
  if (ability.minigame === 'gunner-trigger') return rollTriggerHappy(rng);
  if (ability.minigame === 'ladyluck-reels') return Math.max(1, rollReels(rng).hits ?? 1);
  return null;
}

// ------------------------------------------------------------ the simulation

/**
 * The `AbilityDef` a command resolves to, mirroring `execute.ts#abilityFor`.
 *
 * Exported because the advisor reads it one step before the first simulation:
 * which targets are worth previewing depends on what the move cures.
 */
export function abilityForCommand(
  command: Command,
  abilities: AbilityRegistry = chainRegistries(undefined, defaultAbilities),
  items?: ItemRegistry,
): AbilityDef | undefined {
  if (command.kind === 'attack') return abilities.get('attack');
  if (command.kind === 'ability' || command.kind === 'overdrive') return abilities.get(command.id);
  if (command.kind === 'item') {
    // CONTRACT-CHANGES §7: `ItemDef.effect` is always an `AbilityId`.
    const item = items?.get(command.id);
    return item && typeof item.effect === 'string' ? abilities.get(item.effect) : undefined;
  }
  return undefined;
}

/**
 * Resolve `command` for `actorId` on a copy of `state` and report what it did.
 *
 * Returns `null` when the actor is missing or the command resolves to no
 * ability at all (Escape, Defend, a Trigger) — there is nothing to estimate,
 * and an estimate of zero would read as "this move does nothing", which is a
 * different claim.
 */
export function simulateFFX2Command(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  options: Ffx2SimOptions = {},
): SimOutcome | null {
  const abilities = chainRegistries(options.abilities, defaultAbilities);
  const ability = abilityForCommand(command, abilities, options.items);
  if (!ability) return null;

  const clone = cloneStateForSim(state);
  const units = Object.values(clone.combatants) as Ffx2Unit[];
  const user = units.find((u) => u.id === actorId);
  if (!user) return null;

  const before = hpSnapshot(clone);
  const mpBefore = user.mp;
  const events: BattleEvent[] = [];
  const emit = (event: EventDraft): void => {
    const full = { ...event, seq: clone.nextSeq++ } as BattleEvent;
    clone.log.push(full);
    events.push(full);
  };

  const ctx: ResolveContext = {
    units,
    abilities,
    rng: new RollPolicyRng(options.roll ?? 'mid'),
    emit,
    // Same read as `FFX2Engine.resolveCtx`: the flag is cached on the girl when
    // her gate bonuses were last recomputed, and the clone carries it.
    breaksDamageLimit: (unit) => unit.aiMemory?.['bdl'] === true,
  };

  const hitsOverride = expectedMinigameHits(ability, options.roll ?? 'mid');
  try {
    resolveAbility(ctx, user, ability, command.targets, {
      ...(hitsOverride !== null ? { hitsOverride } : {}),
    });
  } catch (err) {
    console.warn('[simulate/ffx2] command preview failed', command, err);
    return null;
  }

  return summarise(clone, before, events, {
    mpSpent: Math.max(0, mpBefore - (clone.combatants[actorId]?.mp ?? mpBefore)),
    ability,
  });
}

function hpSnapshot(state: BattleState): Record<CombatantId, number> {
  const out: Record<CombatantId, number> = {};
  for (const [id, c] of Object.entries(state.combatants)) out[id] = c.hp;
  return out;
}

function summarise(
  after: BattleState,
  before: Record<CombatantId, number>,
  events: BattleEvent[],
  extra: { mpSpent: number; ability: AbilityDef },
): SimOutcome {
  const hpDelta: Record<CombatantId, number> = {};
  let damageToEnemies = 0;
  let healingToAllies = 0;
  let harmToAllies = 0;

  for (const [id, c] of Object.entries(after.combatants)) {
    const delta = (before[id] ?? c.hp) - c.hp;
    if (delta === 0) continue;
    hpDelta[id] = delta;
    const foe = c.side === 'enemy';
    if (foe && delta > 0) damageToEnemies += delta;
    if (!foe && delta < 0) healingToAllies += -delta;
    if (!foe && delta > 0) harmToAllies += delta;
  }

  const statusChanges: SimStatusChange[] = [];
  const kills: CombatantId[] = [];
  const revives: CombatantId[] = [];
  let hits = 0;
  let misses = 0;
  for (const e of events) {
    switch (e.type) {
      case 'damage':
        hits += 1;
        break;
      case 'miss':
        misses += 1;
        break;
      case 'ko':
        kills.push(e.targetId);
        break;
      case 'revive':
        revives.push(e.targetId);
        break;
      case 'status-add':
        statusChanges.push({ targetId: e.targetId, status: e.status, applied: true });
        break;
      case 'status-remove':
        if (e.reason === 'cured' || e.reason === 'dispelled') {
          statusChanges.push({ targetId: e.targetId, status: e.status, applied: false });
        }
        break;
      default:
        break;
    }
  }

  return {
    hpDelta,
    damageToEnemies,
    healingToAllies,
    harmToAllies,
    hits,
    misses,
    kills,
    revives,
    statusChanges,
    mpSpent: extra.mpSpent,
    rejected: false,
    ability: extra.ability,
    events,
  };
}

// -------------------------------------------------------------- the numerals

/** Hit chance in percentage points. X-2's `hitPercent` clamps to 0-100 itself. */
export function previewHitChance(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  targetId: CombatantId | null,
  ability: AbilityDef,
): number | null {
  const user = state.combatants[actorId] as FFX2Combatant | undefined;
  const target = (targetId ? state.combatants[targetId] : undefined) as FFX2Combatant | undefined;
  if (!user || !target) return null;
  return hitPercent(user, target, ability);
}

/** Critical chance in percentage points. Excluded from the range; printed beside it. */
export function previewCritChance(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  targetId: CombatantId | null,
  ability: AbilityDef,
): number {
  const user = state.combatants[actorId] as FFX2Combatant | undefined;
  const target = (targetId ? state.combatants[targetId] : undefined) as FFX2Combatant | undefined;
  if (!user || !target) return 0;
  return critPercent(user, target, ability);
}

/** The chain multiplier a hit on `targetId` would carry right now. */
export function previewChainMultiplier(
  state: Readonly<BattleState>,
  targetId: CombatantId | null,
): number {
  const target = (targetId ? state.combatants[targetId] : undefined) as Ffx2Unit | undefined;
  return target ? chainMultiplier(target.chainCount) : 1;
}
