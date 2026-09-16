/**
 * Engine-private runtime state and the small helpers every FFX module shares.
 *
 * {@link BattleState} is the public, JSON-pure view the presenter reads. Things
 * the presenter has no business seeing — raw CTB counters, AI scratch memory,
 * the suspended command a minigame is waiting on — live in {@link FFXRuntime}
 * instead, so `state()` stays serialisable and stable.
 */

import type {
  AbilityDef,
  AbilityId,
  BattleEvent,
  BattleState,
  Combatant,
  CombatantId,
  Command,
  FFXCombatant,
  MinigameKind,
  Side,
  StatusId,
  StatusInstance,
} from '../common/types.ts';
import type { SeededRng } from '../common/rng.ts';
import type { FFXContentRegistry } from './registry.ts';
import { baseCtb } from './math.ts';

/** `Omit` that distributes over a union, so the event union survives it. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A {@link BattleEvent} without its `seq`; the emitter assigns that. */
export type EventInput = DistributiveOmit<BattleEvent, 'seq'>;

/** Per-combatant engine bookkeeping. */
export interface ActorRuntime {
  /** CTB counter. Lowest acts next [ffx-combat-core §1.1]. */
  ctb: number;
  /** Cached `ICV_BASE[agility]`, refreshed whenever Agility could change. */
  base: number;
  /** Active telegraph, mirrored into `TurnPreview.chargeStage` [visual-bible §3.13]. */
  charge: { name: string; turnsLeft: number; stage: 1 | 2 } | null;
  /** Live Threaten chance, a percent that may exceed 100 [ffx-combat-core §4.4]. */
  threatenChance: number;
  /** How many turns this actor has taken. */
  turnsTaken: number;
  /** Free-form AI scratch memory, keyed by the AI script. */
  ai: Record<string, number | string | boolean>;
  /** `EnemyDef.abilityIds` — the actions this enemy's AI script may select. */
  abilityIds: string[];
  /** Successful steals against this enemy, halving the base chance each time. */
  stealCount: number;
}

/** Battle-level engine bookkeeping. */
export interface FFXRuntime {
  actors: Map<CombatantId, ActorRuntime>;
  /** Whose turn is currently open. `null` between turns. */
  currentActorId: CombatantId | null;
  /** CTB ticks that elapsed at the start of the current turn, for the Regen payout. */
  elapsedTicks: number;
  /** The enemy that acted most recently, for Seymour's alternation guard. */
  lastEnemyActorId: CombatantId | null;
  /** A command suspended waiting for a minigame outcome [CONTRACTS.md]. */
  pendingMinigame: { actorId: CombatantId; kind: MinigameKind } | null;
  /** Accumulated presentation time, summed from emitted `wait` events. */
  elapsedMs: number;
  /** Set once `victory` / `defeat` / `escape` has been emitted. */
  finished: boolean;
  /** Aeon gauges that were banked before a Grand Summon, keyed by combatant id. */
  aeonStoredGauge: Map<CombatantId, number>;
  /** Party CTB counters frozen while an aeon holds the field [ffx-combat-core §6.1]. */
  frozenPartyCtb: Map<CombatantId, number>;
  /** Aeon builds Yuna owns, so Summon can materialise them. */
  aeonRoster: Map<string, FFXCombatant>;
  /** Item counts, by item id. */
  inventory: Map<string, number>;
  /** Party gil, for Spare Change and the result screen. */
  gil: number;
  /** True when this battle is a link in a chain and should not show results. */
  chained: boolean;
  /** Ids of enemies that have been overkilled. */
  overkilled: CombatantId[];
  /** Whether Escape / Flee are legal at all. */
  canEscape: boolean;
}

/** Everything an engine module needs to do its job. */
export interface Ctx {
  state: BattleState;
  rt: FFXRuntime;
  rng: SeededRng;
  content: FFXContentRegistry;
  emit: (event: EventInput) => void;
}

/** A fresh, empty {@link ActorRuntime} for a combatant. */
export function makeActorRuntime(c: Combatant): ActorRuntime {
  return {
    ctb: 0,
    base: baseCtb(c.stats.agi),
    charge: null,
    threatenChance: 100,
    turnsTaken: 0,
    ai: {},
    abilityIds: [],
    stealCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** The combatant with this id, typed as an FFX fighter. Throws when missing. */
export function actor(ctx: Ctx, id: CombatantId): FFXCombatant {
  const c = ctx.state.combatants[id];
  if (!c) throw new Error(`FFX engine: unknown combatant '${id}'`);
  return c as FFXCombatant;
}

/** The combatant with this id, or `undefined`. */
export function tryActor(ctx: Ctx, id: CombatantId): FFXCombatant | undefined {
  return ctx.state.combatants[id] as FFXCombatant | undefined;
}

/** The runtime block for this id, created on demand. */
export function rtOf(ctx: Ctx, id: CombatantId): ActorRuntime {
  let r = ctx.rt.actors.get(id);
  if (!r) {
    r = makeActorRuntime(actor(ctx, id));
    ctx.rt.actors.set(id, r);
  }
  return r;
}

/** Every combatant, in a stable order (party, aeon, enemies). */
export function allCombatants(ctx: Ctx): FFXCombatant[] {
  const ids = [
    ...ctx.state.activeIds,
    ...ctx.state.reserveIds,
    ...(ctx.state.aeonId ? [ctx.state.aeonId] : []),
    ...ctx.state.enemyIds,
  ];
  const seen = new Set<CombatantId>();
  const out: FFXCombatant[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const c = tryActor(ctx, id);
    if (c) out.push(c);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

/** Does this combatant carry `status`? */
export function has(c: Combatant, status: StatusId): boolean {
  return c.statuses[status] !== undefined;
}

/** The status instance, or `undefined`. */
export function statusOf(c: Combatant, status: StatusId): StatusInstance | undefined {
  return c.statuses[status];
}

/** Stack count for a stacking buff (0 when absent). */
export function stacks(c: Combatant, status: StatusId): number {
  return c.statuses[status]?.stacks ?? 0;
}

/** True when the combatant is on the field and able to take turns. */
export function canAct(c: Combatant): boolean {
  if (!c.alive || c.removed) return false;
  if (has(c, 'ko') || has(c, 'petrify') || has(c, 'eject') || has(c, 'sleep')) return false;
  if (has(c, 'threaten')) return false;
  return true;
}

/** True when the combatant occupies the field, alive or KO'd. */
export function onField(c: Combatant): boolean {
  return !c.removed && !has(c, 'eject');
}

/** True when the combatant is a legal target for an ordinary action. */
export function targetable(c: Combatant): boolean {
  return onField(c) && !c.flags.untargetable && !c.flags.hidden;
}

/** True when the combatant is alive (not KO'd, not petrified out of the battle). */
export function isAlive(c: Combatant): boolean {
  return c.alive && !has(c, 'ko') && onField(c);
}

/** Party side while no aeon is out; the aeon alone while one is. */
export function friendlySide(ctx: Ctx): Side {
  return ctx.state.aeonId ? 'aeon' : 'party';
}

/**
 * The friendly combatants presently on the field.
 *
 * While an aeon holds the field it is the *only* present friendly actor — the
 * party is off-stage with frozen counters [ffx-combat-core §6.1].
 */
export function friendlies(ctx: Ctx): FFXCombatant[] {
  if (ctx.state.aeonId) {
    const a = tryActor(ctx, ctx.state.aeonId);
    return a ? [a] : [];
  }
  return ctx.state.activeIds.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => !!c);
}

/** The enemy combatants presently on the field, in formation order. */
export function enemies(ctx: Ctx): FFXCombatant[] {
  return ctx.state.enemyIds
    .map((id) => tryActor(ctx, id))
    .filter((c): c is FFXCombatant => !!c && onField(c));
}

/** Friendlies that are alive. */
export function livingFriendlies(ctx: Ctx): FFXCombatant[] {
  return friendlies(ctx).filter(isAlive);
}

/** Enemies that are alive and targetable. */
export function livingEnemies(ctx: Ctx): FFXCombatant[] {
  return enemies(ctx).filter((c) => isAlive(c) && targetable(c));
}

/** Everyone on the opposite side of `c` who is alive and targetable. */
export function opponentsOf(ctx: Ctx, c: Combatant): FFXCombatant[] {
  return c.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx);
}

/** Everyone on the same side as `c` who is on the field. */
export function alliesOf(ctx: Ctx, c: Combatant): FFXCombatant[] {
  return c.side === 'enemy' ? enemies(ctx) : friendlies(ctx);
}

// ---------------------------------------------------------------------------
// Ability resolution
// ---------------------------------------------------------------------------

/** The {@link AbilityDef} for an id, or `undefined` when unregistered. */
export function abilityOf(ctx: Ctx, id: AbilityId): AbilityDef | undefined {
  return ctx.content.ability(id);
}

/** Ability rank, with the documented rank-0 -> rank-3 fallback [ffx-combat-core §1.3]. */
export function rankOf(def: AbilityDef | undefined): number {
  const r = def?.rank ?? 3;
  return r <= 0 ? 3 : r;
}

/** True when an ability carries a flag. */
export function hasFlag(def: AbilityDef, flag: AbilityDef['flags'][number]): boolean {
  return def.flags.includes(flag);
}

/** The ability a command resolves to, if it names one. */
export function commandAbility(ctx: Ctx, command: Command): AbilityDef | undefined {
  switch (command.kind) {
    case 'attack':
      return ctx.content.ability('attack');
    case 'defend':
      return ctx.content.ability('defend');
    case 'ability':
    case 'overdrive':
      return ctx.content.ability(command.id);
    case 'item':
      return ctx.content.itemEffect(command.id);
    default:
      return undefined;
  }
}
