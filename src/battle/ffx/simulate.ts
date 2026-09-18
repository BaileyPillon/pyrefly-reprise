/**
 * **Previewing** a command: what would happen if this were submitted, without
 * submitting it.
 *
 * The in-battle move advisor (`src/engine/tactics/advisor.ts`) has to put a
 * number on every row the command menu is offering — "Attack → Seymour Flux,
 * 1 204-1 361" — and the only honest source for that number is the damage chain
 * the engine itself runs. Re-deriving it in the UI is how a strategy panel ends
 * up lying to the player the first time a data agent retunes a stat block.
 *
 * So this module runs **the real one**: it deep-clones the state, rebuilds the
 * small amount of engine runtime that is not in it, and calls
 * {@link executeCommand} on the copy. Every formula, every status branch, every
 * affinity table and every one-off `extra` rule is the shipped code, and the
 * live battle never sees any of it.
 *
 * ## Three rules this module keeps
 *
 * 1. **It never mutates the state it is given.** {@link simulateFFXCommand}
 *    clones first and resolves second. `tests/unit/advisor-simulate.test.ts`
 *    asserts a deep-equality of the live state across a simulation.
 * 2. **It is deterministic.** No `SeededRng`, no `Math.random()`: the RNG is
 *    {@link RollPolicyRng}, which answers every draw from a fixed policy, so
 *    the same board and the same command always produce the same estimate and
 *    a test can pin it.
 * 3. **It resolves the action and nothing after it.** `executeCommand` is the
 *    command; counters, the CTB charge, status ticks and the enemy's reply are
 *    the *rest of the turn*. A preview that ran those would be predicting the
 *    boss's answer as if it were a consequence of the player's choice.
 *
 * ## What the three rolls mean
 *
 * FFX's damage chain draws one variance roll per hit — `dmg * (roll + 240) //
 * 256`, a 32-step ladder from x0.9375 to x1.0586 [ffx-combat-core §2.1] — and
 * a handful of *branch* rolls that decide whether something happens at all
 * (hit, crit, status application, escape). {@link RollPolicy} sweeps the first
 * and never the second:
 *
 * | Draw | `'min'` | `'mid'` | `'max'` |
 * |---|---|---|---|
 * | Magnitude (`int(0,31)`, a hit count, a swept angle) | low end | midpoint | high end |
 * | Branch (`int(0,100)`, `int(0,99)`, `int(0,255)`) | median | median | median |
 *
 * A branch roll at its median is the **likely** outcome: an action whose hit
 * chance is over 50 lands in all three rolls, and a critical whose chance is
 * under 50 fires in none of them. That is deliberate and it is why the advisor
 * prints hit chance and crit chance as their own numbers rather than letting
 * them smear the range — a range that silently included a critical in its top
 * end would read as "this move might do double", which is not what a range
 * means.
 */

import type {
  AbilityDef,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  FFXCombatant,
  StatusId,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import { type Ctx, type EventInput, type FFXRuntime, makeActorRuntime } from './state.ts';
import { FFXContentRegistry, getFFXRegistry } from './registry.ts';
import { executeCommand } from './execute.ts';
import { commandAbility } from './state.ts';
import { critChance, hitChance } from './formulas.ts';
import { equipmentCrit } from './equipment.ts';

// ---------------------------------------------------------------- the rolls

/** Which end of every magnitude roll a simulation takes. */
export type RollPolicy = 'min' | 'mid' | 'max';

/**
 * The deterministic stand-in for `SeededRng` a preview draws from.
 *
 * See the file header for the magnitude/branch split. The three branch ranges
 * are the engine's own named helpers — `percentRoll` (`int(0, 100)`),
 * `byteRoll` (`int(0, 255)`) and the bare `int(0, 99)` that X-2 and FFX's
 * Overdrive defaults use — so recognising them by range is recognising the
 * helper, not guessing at intent.
 */
export class RollPolicyRng extends SeededRng {
  constructor(private readonly policy: RollPolicy) {
    // `Ctx.rng` is typed as the concrete `SeededRng`, not the `Rng` interface,
    // so a preview's generator has to *be* one. Every draw is overridden below;
    // the inherited mulberry32 state is never advanced.
    super(0);
  }

  /** The median of `[0, 1)`. Nothing in either engine's resolve path calls this. */
  override next(): number {
    return 0.5;
  }

  override int(min: number, max: number): number {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (hi <= lo) return lo;
    const median = lo + Math.floor((hi - lo) / 2);
    if (isBranchRange(lo, hi)) return median;
    if (this.policy === 'min') return lo;
    if (this.policy === 'max') return hi;
    // The variance ladder's exact x1.0 step is roll 16 of 0-31, which is
    // `lo + 16`, not the midpoint of the span — so mid-roll damage is the
    // unmodified chain figure rather than one step under it.
    return hi - lo === 31 ? lo + 16 : median;
  }

  /** The middle element, so a `random-enemy` aim is stable across the three rolls. */
  override pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('RollPolicyRng.pick: empty array');
    return items[Math.floor((items.length - 1) / 2)] as T;
  }

  /** Identity: a preview must not reorder a target list behind the player's back. */
  override shuffle<T>(items: readonly T[]): T[] {
    return items.slice();
  }

  /** The heaviest option — the outcome an AI weight table is most likely to take. */
  override weighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0) throw new Error('RollPolicyRng.weighted: empty array');
    let best = 0;
    for (let i = 1; i < items.length; i++) {
      if ((weights[i] ?? 0) > (weights[best] ?? 0)) best = i;
    }
    return items[best] as T;
  }
}

/** `[0, 100]`, `[0, 99]` and `[0, 255]`: hit, crit, status application, escape. */
function isBranchRange(lo: number, hi: number): boolean {
  return lo === 0 && (hi === 100 || hi === 99 || hi === 255);
}

// --------------------------------------------------------------- the result

/** One status the previewed action put on, or took off, somebody. */
export interface SimStatusChange {
  targetId: CombatantId;
  status: StatusId;
  /** True for `status-add`, false for `status-remove`. */
  applied: boolean;
}

/**
 * What one previewed command did on the copy.
 *
 * Signs follow the engine's own convention: `hpDelta` is **positive for damage
 * and negative for healing**, per target, because a `heals`-flagged action is a
 * `damage` event with a negative amount [docs/CONTRACTS.md]. That is what lets
 * the advisor notice that a Cure aimed at a Zombie comes back positive.
 */
export interface SimOutcome {
  /** Signed HP delta per combatant: positive = it lost HP. */
  hpDelta: Record<CombatantId, number>;
  /** Total HP taken off enemies (and enemy parts). Never negative. */
  damageToEnemies: number;
  /** Total HP restored to the party and its aeon. Never negative. */
  healingToAllies: number;
  /** Total HP *taken off* the party by this action — a mistake, usually. */
  harmToAllies: number;
  /** Landed hits and whiffed ones, counted from `damage` / `miss` events. */
  hits: number;
  misses: number;
  /** Combatants this action would take to 0 HP. */
  kills: CombatantId[];
  /** Combatants this action would stand back up. */
  revives: CombatantId[];
  statusChanges: SimStatusChange[];
  /** MP the actor spends. */
  mpSpent: number;
  /** True when the engine refused the command outright (a menu marker). */
  rejected: boolean;
  /** The ability that actually resolved, after Overdrive/Rage/Mix reshaping. */
  ability: AbilityDef | null;
  /** Every event the copy emitted, for tests and for the advisor's own reading. */
  events: BattleEvent[];
}

export interface SimOptions {
  roll?: RollPolicy;
  /** Ability/item records. Defaults to the process-wide registry. */
  content?: FFXContentRegistry;
}

// ---------------------------------------------------------------- the clone

/**
 * A battle state a simulation may scribble on.
 *
 * The log is dropped rather than copied. It is the largest thing in a late
 * state by two orders of magnitude (Chapter 1 reaches ~600 events), nothing in
 * the command-resolution path reads it — triggers are evaluated by the engine
 * loop *after* `executeCommand`, not inside it — and the advisor wants the
 * events this command emitted, not those plus the whole battle's history.
 */
export function cloneStateForSim(state: Readonly<BattleState>): BattleState {
  const combatants: Record<CombatantId, FFXCombatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    combatants[id] = cloneCombatant(c as FFXCombatant);
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

/**
 * One combatant, copied as deeply as the resolve path can reach and no deeper.
 *
 * `structuredClone` on a full FFX combatant costs about 0.2 ms, and a single
 * open menu runs sixty of these — 2.4 ms per *state* clone, which was three
 * quarters of the advisor's whole cost and a visible hitch when the command
 * stack opened. Almost all of it is three fields that the damage chain only
 * ever reads: the sphere grid (a few hundred activated node ids), the learned
 * ability list and the equipment block. Those are shared by reference; the
 * mutable ones are copied.
 *
 * "Only ever reads" is checked, not assumed: `sphereGrid` is touched in
 * `results.ts` (after the battle), `learnedAbilityIds` in lookups, and
 * `equipment` in `equipment.ts`'s readers and `applyEquipmentToCombatant`,
 * which runs at `setup.ts` time and never during a command. The test
 * `advisor-simulate.test.ts` deep-compares the live state across a whole
 * battle's worth of previews, which is what would catch this going stale.
 */
function cloneCombatant(c: FFXCombatant): FFXCombatant {
  const out: FFXCombatant = {
    ...c,
    stats: { ...c.stats },
    statuses: cloneStatuses(c.statuses),
    flags: { ...c.flags },
    affinities: { ...c.affinities },
    immunities: { ...c.immunities },
    immunityFlags: [...c.immunityFlags],
  };
  if (c.overdrive) {
    out.overdrive = {
      ...c.overdrive,
      ...(c.overdrive.unlockedModes ? { unlockedModes: [...c.overdrive.unlockedModes] } : {}),
      unlockedOverdriveIds: [...c.overdrive.unlockedOverdriveIds],
    };
  }
  if (c.aeon) out.aeon = { ...c.aeon };
  if (c.enemy) {
    out.enemy = {
      ...c.enemy,
      forms: c.enemy.forms.map((f) => ({ ...f })),
      rewards: { ...c.enemy.rewards, drops: c.enemy.rewards.drops.map((d) => ({ ...d })) },
      ...(c.enemy.reviveRule ? { reviveRule: { ...c.enemy.reviveRule } } : {}),
    };
  }
  return out;
}

function cloneStatuses(
  src: FFXCombatant['statuses'],
): FFXCombatant['statuses'] {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src)) {
    const value = (src as Record<string, unknown>)[key];
    if (value) out[key] = { ...(value as object) };
  }
  return out as FFXCombatant['statuses'];
}

/**
 * Rebuild the engine runtime the public state does not carry.
 *
 * `FFXRuntime` holds CTB counters, AI scratch memory and the item bag — none of
 * which are in `BattleState`, because `state()` is the presenter's view and
 * must stay JSON-pure [`state.ts` header]. A preview does not need any of it to
 * be *accurate*: `executeCommand` reads the counters only to charge them at the
 * end of the turn, which a preview does not reach. What it does need is for
 * the bag not to be empty, or every Item row would come back "No items left"
 * — so a count seen in `state.flags['inventory:<id>']` (which `spendItem`
 * mirrors there for the chained-battle handover) is used when present, and
 * anything unseen is stocked, since `AvailableCommand.enabled` has already
 * decided the row is legal.
 */
function runtimeFor(state: BattleState, command: Command): FFXRuntime {
  const rt: FFXRuntime = {
    actors: new Map(),
    currentActorId: null,
    elapsedTicks: 0,
    lastEnemyActorId: null,
    pendingMinigame: null,
    elapsedMs: 0,
    finished: false,
    aeonStoredGauge: new Map(),
    frozenPartyCtb: new Map(),
    aeonRoster: new Map(),
    inventory: new Map(),
    gil: typeof state.flags['gil'] === 'number' ? state.flags['gil'] : 999_999,
    chained: false,
    overkilled: [],
    canEscape: false,
    sensedIds: new Set(),
    pendingPartRevivals: [],
  };
  for (const [id, raw] of Object.entries(state.combatants)) {
    const c = raw as FFXCombatant;
    const actorRt = makeActorRuntime(c);
    actorRt.abilityIds = [...c.learnedAbilityIds];
    rt.actors.set(id, actorRt);
    if (c.side === 'aeon') rt.aeonRoster.set(id, c);
  }
  if (command.kind === 'item') {
    const stocked = state.flags[`inventory:${command.id}`];
    rt.inventory.set(command.id, typeof stocked === 'number' && stocked > 0 ? stocked : 99);
  }
  return rt;
}

// ----------------------------------------------------------- the ability def

/**
 * The `AbilityDef` a command resolves to, without building a context.
 *
 * `state.ts#commandAbility` wants a `Ctx`, and the advisor needs this one step
 * earlier than that — it decides *which targets are worth previewing* from the
 * statuses a move cures, so it has to read the record before the first
 * simulation rather than after it.
 */
export function abilityForCommand(
  command: Command,
  content: FFXContentRegistry = getFFXRegistry(),
): AbilityDef | undefined {
  switch (command.kind) {
    case 'attack':
      return content.ability('attack');
    case 'defend':
      return content.ability('defend');
    case 'ability':
    case 'overdrive':
      return content.ability(command.id);
    case 'item':
      return content.itemEffect(command.id);
    default:
      return undefined;
  }
}

// ------------------------------------------------------------ the simulation

/**
 * Resolve `command` for `actorId` on a copy of `state` and report what it did.
 *
 * Returns `null` when the actor is not on the board. Never touches `state`.
 */
export function simulateFFXCommand(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  options: SimOptions = {},
): SimOutcome | null {
  const clone = cloneStateForSim(state);
  const actor = clone.combatants[actorId] as FFXCombatant | undefined;
  if (!actor) return null;

  const before = hpSnapshot(clone);
  const mpBefore = actor.mp;
  const events: BattleEvent[] = [];
  const emit = (event: EventInput): void => {
    const full = { ...event, seq: clone.nextSeq++ } as BattleEvent;
    clone.log.push(full);
    events.push(full);
  };

  const ctx: Ctx = {
    state: clone,
    rt: runtimeFor(clone, command),
    rng: new RollPolicyRng(options.roll ?? 'mid'),
    // Not `.clone()`: the engine copies the registry at `init` so two battles
    // cannot mutate each other's content, but nothing on the resolve path
    // writes to it and a preview runs dozens of times per open menu. Cloning
    // ~250 records per candidate row was most of the advisor's frame cost.
    content: options.content ?? getFFXRegistry(),
    emit,
  };
  ctx.rt.currentActorId = actorId;

  let rejected = false;
  let ability: AbilityDef | null = commandAbility(ctx, command) ?? null;
  try {
    // `autoResolveMinigames: true` — a preview has nobody to play an overlay,
    // so an Overdrive rolls its default outcome from this RNG rather than
    // emitting a `minigame-request` and stopping [docs/CONTRACTS.md].
    const result = executeCommand(ctx, actor, command, true);
    rejected = result.rejected === true;
    if (result.def) ability = result.def;
  } catch (err) {
    // A one-off scripted rule that did not expect this board. The advisor drops
    // the row rather than showing a number it could not compute; the live
    // battle is untouched either way, because nothing here is the live battle.
    console.warn('[simulate/ffx] command preview failed', command, err);
    return null;
  }

  return summarise(clone, before, events, {
    mpSpent: Math.max(0, mpBefore - (clone.combatants[actorId]?.mp ?? mpBefore)),
    rejected,
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
  extra: { mpSpent: number; rejected: boolean; ability: AbilityDef | null },
): SimOutcome {
  const hpDelta: Record<CombatantId, number> = {};
  let damageToEnemies = 0;
  let healingToAllies = 0;
  let harmToAllies = 0;

  for (const [id, c] of Object.entries(after.combatants)) {
    const delta = (before[id] ?? c.hp) - c.hp; // positive = lost HP
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
    rejected: extra.rejected,
    ability: extra.ability,
    events,
  };
}

// -------------------------------------------------------------- the numerals

/**
 * Hit chance in percentage points, or `null` when the action cannot miss.
 *
 * The engine's own {@link hitChance}; re-exported through here so the advisor
 * has one import site for "what a preview can tell you about this command".
 */
export function previewHitChance(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  targetId: CombatantId | null,
  def: AbilityDef,
): number | null {
  const user = state.combatants[actorId] as FFXCombatant | undefined;
  const target = (targetId ? state.combatants[targetId] : undefined) as FFXCombatant | undefined;
  if (!user || !target) return null;
  const chance = hitChance(user, target, def);
  return chance === null ? null : Math.max(0, Math.min(100, chance));
}

/** Critical chance in percentage points. Excluded from the range; printed beside it. */
export function previewCritChance(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  targetId: CombatantId | null,
  def: AbilityDef,
): number {
  const user = state.combatants[actorId] as FFXCombatant | undefined;
  const target = (targetId ? state.combatants[targetId] : undefined) as FFXCombatant | undefined;
  if (!user || !target) return 0;
  const equip = equipmentCrit(user);
  return Math.max(0, Math.min(100, critChance(user, target, def, equip)));
}
