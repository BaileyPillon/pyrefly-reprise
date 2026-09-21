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
} from '../common/types.ts';
import type { SeededRng } from '../common/rng.ts';
import type { FFXContentRegistry } from './registry.ts';
import { baseCtb } from './math.ts';
import { isAlive, onField, targetable } from './predicates.ts';

// The single-combatant predicates live in `./predicates.ts` since round 04
// (PR-0040: this file crossed the 400-line house limit, AGENTS.md hard rule 7).
// They are re-exported here so every existing `from './state.ts'` importer is
// unchanged — the split is a move, not an API change.
export {
  canAct,
  canSwitchIn,
  has,
  inTurnQueue,
  isAlive,
  isSubmenuMarker,
  onField,
  stacks,
  statusOf,
  targetable,
} from './predicates.ts';

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
  /**
   * Cap on every **single hit** of HP damage this actor takes, applied inside
   * `hp.ts#dealDamage` before {@link hpFloor}.
   *
   * Macalania Seymour is the case this exists for: in the HD Remaster — this
   * project's declared baseline — he "cannot be killed before he summons", and
   * the build enforces it by capping every hit on him at **5,999** until Anima
   * has been summoned [ffx-seymour-anima-macalania §5.2, verified: 2 sources].
   * On PS2 the same situation with a 6,000+ second Doublecast **softlocks the
   * game**; that is a bug, not a feature, and reproducing it would be an own
   * goal.
   *
   * Engine-internal on purpose — `ActorRuntime` is not a contract file and
   * nothing outside `src/battle/ffx/**` sees it, so this is a capability, not
   * a schema change. The encounter's AI script sets it at setup and deletes it
   * when the summon fires.
   */
  damageCapPerHit?: number;
  /** Lowest HP any damage may take this actor to. Cleared with {@link damageCapPerHit}. */
  hpFloor?: number;
  /**
   * **Enemy Cover**: a single-target *physical* party action aimed at this id
   * lands on **this** actor instead [ffx-seymour-anima-macalania §2.3,
   * verified: 2 sources]. Magic is never covered.
   *
   * The mirror image of the party-side Guard/Sentinel interception
   * `targeting.ts#redirectTarget` has always had. Cleared implicitly when the
   * coverer dies, because the redirect only considers living enemies.
   */
  coversAllyId?: CombatantId;
  /**
   * Overdrive gauge points this **enemy** gains every time a player-side action
   * targets it, whether or not the action deals damage.
   *
   * `onDamageTaken` only fires on damage, and Anima's third clock advances on a
   * heal or a debuff too [ffx-seymour-anima-macalania §3.4]. The value itself
   * is an `[estimate]` — see `ANIMA_GAUGE_PER_TARGETING`.
   */
  gaugePerTargeting?: number;
  /**
   * **On the field and taking turns, but not a combatant**: never a victory
   * condition and never a defeat condition.
   *
   * **Cid on the *Fahrenheit* is the only user.** He is an invisible enemy with
   * his own CTB icon [ffx-evrae-airship §2], so he needs a turn and the
   * tie-break rank `turnQueue.ts` reserves for the id `'cid'` — but he is
   * unkillable and untargetable, so `engine.ts#checkEnd` would wait for him for
   * ever. Widening `Side` would have forced a decision at ~30 `side === 'enemy'`
   * sites; `flags.isPart` is false and would list him as a limb.
   */
  nonCombatant?: boolean;
  /**
   * **This character's weapon reaches a distant enemy**, whatever the action
   * says. Read only by `targeting.ts#reachesAtRange`, and only at FAR. Wakka's
   * blitzball is the only one: §4.3 is explicit that it is a **character**
   * property and that the ordinary `attack` row is `long_range = false`, so the
   * flag cannot live on the action.
   */
  rangedWeapon?: boolean;
  /**
   * Count every **player-side action that names this actor**, damage or not.
   * {@link gaugePerTargeting} answers "was I targeted" with a gauge; this with a
   * number a script compares against its own last reading. Evrae's Swooping
   * Scythe fires on *being targeted* at range [§4.5], which includes a miss and
   * a status-only command, so neither the damage nor the status set expresses
   * it. Bumped by `onTargeted`, once per action.
   */
  countsPartyTargetings?: boolean;
  partyTargetings?: number;
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
  /**
   * A command suspended waiting for a minigame outcome [CONTRACTS.md].
   *
   * `abilityId` is carried so a *bare* re-submit of the very same Overdrive can
   * be told apart from the player backing out and picking a different one. The
   * first is "nobody is going to play this overlay" and the engine rolls the
   * outcome itself; the second is a fresh request.
   */
  pendingMinigame: { actorId: CombatantId; kind: MinigameKind; abilityId: AbilityId } | null;
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
  /**
   * Enemies the passive **Sensor** auto-ability has already announced.
   *
   * Kept out of {@link BattleState} because an `immune-to-sensor` enemy is
   * announced without ever becoming `revealed`, so the state flag cannot double
   * as the "already printed" mark [ffx-combat-core §9, `sensor.ts`].
   */
  sensedIds: Set<CombatantId>;
  /**
   * Destroyed parts waiting on their {@link EnemyDef.reviveRule} timer.
   *
   * `atTicks` is a value of `state.ticks`, the field-wide CTB clock the engine
   * advances by `normalise()`'s elapsed count every turn — not a turn count,
   * because a dead Pagoda takes no turns of its own
   * [ffx-bfa-yu-yevon §1.4].
   */
  pendingPartRevivals: Array<{ id: CombatantId; atTicks: number; maxHp: number }>;
  /**
   * Stalemate watch: the lowest total enemy HP this battle has ever reached,
   * and the turn it was reached on.
   *
   * Yu Yevon is why. He counters every damaging player action with a 9,999
   * Curaga, the two Yu Pagodas put another ~4,500 back between his turns, and
   * the party carries a permanent fayth Auto-Life that makes losing impossible
   * — so a party that runs out of the one Candle of Life is in a battle with
   * **no exit in either direction**. Measured on the shipped board with Defend
   * on every decision: 40,000 steps, 25,364 turns, no `battle-over`, the boss
   * parked at an equilibrium of 6,001 of 99,999 [ffx-bfa-yu-yevon §3.4, §3.5].
   *
   * "Progress" is deliberately a **new minimum**, not "any HP moved": Gravija
   * takes 75% of everybody's current HP every cycle, so HP is moving
   * constantly in exactly the fight that is stuck.
   */
  progress: { bestEnemyHp: number; atTurn: number };
  /**
   * The `A`/`B`/`C` suffixes duplicates carry, assigned once per battle from
   * the formation roster so an enemy is never renamed mid-fight when its twin
   * dies (round 04 PR-0023). Built lazily by `turnQueue.ts`; `rosterSize` is
   * the `state.enemyIds` length it was built from, so an enemy that joins
   * mid-battle rebuilds it and a death never does.
   */
  letterTags?: { rosterSize: number; tags: ReadonlyMap<CombatantId, string> };
}

/** Everything an engine module needs to do its job. */
export interface Ctx {
  state: BattleState;
  rt: FFXRuntime;
  rng: SeededRng;
  content: FFXContentRegistry;
  emit: (event: EventInput) => void;
}

/**
 * Spend one of `id` from the party bag, and **mirror the new count into
 * `state.flags`** so a chained chapter carries it.
 *
 * `app/screens/BattleScreenSetup.ts carryInventory()` reads
 * `state.flags['inventory:<itemId>']` between links and passes the build's
 * original count through untouched when that flag is absent. Only the FFX-2
 * engine ever wrote it; the FFX engine keeps its counts in `rt.inventory`, a
 * Map, and nothing mirrored them — so **every FFX chain silently restocked the
 * whole bag at every link**. Measured on Chapter 3, whose seven links share one
 * inventory: the party spent 25-36 X-Potions out of a build that owns 10, and
 * the count printed after each link was still the untouched 10. Chapter 5's
 * FFX-2 chain was never affected.
 *
 * Returns false when the bag is empty, so callers keep their existing "No items
 * left" behaviour.
 */
export function spendItem(ctx: Ctx, id: string): boolean {
  const count = ctx.rt.inventory.get(id) ?? 0;
  if (count <= 0) return false;
  const left = count - 1;
  ctx.rt.inventory.set(id, left);
  ctx.state.flags[`inventory:${id}`] = left;
  return true;
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
