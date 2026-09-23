/**
 * Engine-internal types for `battle/ffx2`.
 *
 * Everything here is additive on top of the shared contract in
 * `battle/common/types.ts` — nothing in this file changes a contract shape, so
 * a `Ffx2Unit` is always assignable to an `FFX2Combatant` and the presenter and
 * UI never see any of it.
 *
 * The registries exist because the FFX-2 *data* files
 * (`src/data/ffx2/abilities`, `src/data/ffx2/dresspheres`, …) are owned by a
 * different agent and are still stubs. The engine takes them by injection and
 * falls back to the small research-cited baseline in `abilities.ts` and
 * `dressphere-stats.ts` for anything the caller does not supply.
 */

import type {
  AbilityDef,
  AbilityId,
  BattleEvent,
  CombatantId,
  Command,
  FFX2Combatant,
  GateColour,
  ItemDef,
  ItemId,
  Rng,
  StatBlock,
} from '../common/types.ts';
import type { AtbSpeed } from './constants.ts';
import type { AtbMode } from './active.ts';

/** `Omit` over a discriminated union, preserving the members. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An event before the engine stamps its monotonic `seq`. */
export type EventDraft = DistributiveOmit<BattleEvent, 'seq'>;

/** Pushes an event draft onto the current action's event list. */
export type Emit = (event: EventDraft) => void;

/** Per-unit bookkeeping the engine needs and the contract has nowhere to put. */
export interface Ffx2Unit extends FFX2Combatant {
  /** Accumulated ticks toward the next Regen / Poison payout. */
  statusTickAccumulator?: number;
  /** Free-form AI memory, keyed by the script. Scripts own their own keys. */
  aiMemory?: Record<string, number | string | boolean>;
  /** Queued command waiting on the purple charge bar, mirrored from `atb.charging`. */
  pendingCommand?: Command | null;
  /** Ticks the enemy still owes to its `thinkingPeriod` before it will choose. */
  thinkingTicks?: number;
  /** Set on a special-dressphere part so the engine can restore the girl on defeat. */
  sdspOwnerId?: CombatantId;
  /** Set on a girl who is currently transformed; her parts hold the field. */
  sdspPartIds?: CombatantId[];
  /** Grid node count she transformed from, 2–6. Drives main-part stat scaling. */
  sdspGridNodeCount?: number;
}

/** Ability lookup. Data files register the real table; `abilities.ts` is the fallback. */
export interface AbilityRegistry {
  get(id: AbilityId): AbilityDef | undefined;
}

/** Item lookup. `ItemDef.effect` is always an `AbilityId` per CONTRACT-CHANGES §7. */
export interface ItemRegistry {
  get(id: ItemId): ItemDef | undefined;
}

/** One Garment Grid: nodes, the links between them, and the gates on those links. */
export interface GarmentGridDef {
  id: string;
  /** 2–6 nodes. A node holds one dressphere id, or `null` when empty. */
  nodes: number;
  /**
   * Links as `[from, to]` node index pairs with the gates sitting on them.
   * Links are undirected; `spherechange` walks one link per turn.
   */
  links: Array<{ from: number; to: number; gates: GateColour[] }>;
  /** Gate-combination bonuses. `gates: []` is the permanent equip effect. */
  bonuses: GateBonus[];
}

/** A `T-` gate effect (or the `P-` equip effect when `gates` is empty). §4.1 */
export interface GateBonus {
  /** Every gate in this list must have been passed this battle. Order does not matter. */
  gates: GateColour[];
  /** Flat stat adds applied for the rest of the battle. */
  stats?: Partial<StatBlock>;
  /** Extra ability ids unlocked (`T-ACTA`). */
  abilities?: AbilityId[];
  /** Skillset charge reduction in percent (`"<skillset> wait down"`, -40). */
  waitDownPercent?: number;
  /** Raises this girl's damage cap to 99 999 for the battle (The End, G+R). */
  breaksDamageLimit?: boolean;
  /** Human-readable label for the HUD. */
  label?: string;
  /**
   * §4.1 stacking quirk: Grids whose stat bonus is allocated to *every* gate
   * grant it **per gate passed**. Set on those Grids only.
   */
  perGate?: boolean;
}

export interface GarmentGridRegistry {
  get(id: string): GarmentGridDef | undefined;
}

/** Derives a girl's stat block from (dressphere x level). [ffx2-combat-core §5.1] */
export type DressphereStats = (dressphereId: string, level: number) => StatBlock;

/** What a dressphere can do, for the command menu. */
export interface DressphereDef {
  id: string;
  name: string;
  /** Ability ids the skillset offers once learned. */
  abilityIds: AbilityId[];
  /** Songstress and the two mage spheres have **no Attack command**. §3.4–3.6 */
  hasAttack: boolean;
  /** Long-range dresspheres never break a chain by approach time. §1.7 */
  longRange: boolean;
  /** Thief's Attack strikes twice. §3.2 */
  attackHits?: number;
}

export interface DressphereRegistry {
  get(id: string): DressphereDef | undefined;
  stats: DressphereStats;
}

/** Everything the engine takes by injection. All optional; all have fallbacks. */
export interface Ffx2EngineOptions {
  abilities?: AbilityRegistry;
  items?: ItemRegistry;
  dresspheres?: DressphereRegistry;
  garmentGrids?: GarmentGridRegistry;
  /**
   * Party state carried over from the previous link of a chained encounter
   * (CONTRACT-CHANGES §6). When set, `init()` restores HP/MP/statuses/ATB
   * rather than starting the girls fresh, and no results screen shows between
   * links.
   */
  carriedParty?: CarriedPartyState;
  /** True for every link after the first in a chained encounter. */
  chained?: boolean;
  /**
   * Whether the engine suspends for timed-input overlays. `true` (default) is
   * the player-facing behaviour: a minigame ability emits `minigame-request`
   * and waits for the UI to re-submit with `extra`. `false` makes the engine
   * roll a default outcome from the seeded RNG and never emit the request at
   * all, which is what lets e2e run a chapter to victory headlessly
   * (`docs/CONTRACTS.md`, "Minigame protocol").
   */
  minigames?: boolean;
  /**
   * The Config ATB speed (`constants.ts` {@link ATB_SPEED_MULTIPLIER}, §1.2).
   * Default `'normal'`, which is bit-for-bit the engine as it was before the
   * setting existed (`tests/unit/ffx2-atb-golden.test.ts`). Changeable
   * mid-battle with `FFX2Engine.setAtbSpeed`.
   */
  atbSpeed?: AtbSpeed;
  /**
   * The Config ATB mode (`active.ts` {@link AtbMode}, §1.5). Default **`'wait'`**
   * (Bailey, `docs/target/decisions.json` D-029): the clock stops while a
   * command menu is open. `'active'` keeps it running under the menu. No
   * difference to a run that never ticks under a menu (every automated run).
   * Changeable mid-battle with `FFX2Engine.setAtbMode`.
   */
  atbMode?: AtbMode;
}

/** The party's live state as it crosses from one chained group to the next. */
export interface CarriedPartyState {
  chained: true;
  members: Array<{
    id: CombatantId;
    hp: number;
    mp: number;
    statuses: FFX2Combatant['statuses'];
    dresspheres?: FFX2Combatant['dresspheres'];
    /** Accessories still equipped. */
    accessories?: string[];
  }>;
  /** Item counts left after the previous link. */
  inventory?: Array<{ itemId: ItemId; count: number }>;
  /** Total elapsed ticks so far, so the chain reports one battle length. */
  elapsedTicks?: number;
  elapsedMs?: number;
}

/** The slice of engine state an AI script may read and write. */
export interface AiContext {
  self: Ffx2Unit;
  units: Ffx2Unit[];
  rng: Rng;
  /** Live encounter flags, shared with story triggers. */
  flags: Record<string, number | string | boolean>;
  /** Total ATB ticks elapsed this battle. */
  ticks: number;
  ability(id: AbilityId): AbilityDef | undefined;
  /** Living, targetable party members (or SDSP parts). */
  party(): Ffx2Unit[];
  /** Living enemies other than `self`. */
  allies(): Ffx2Unit[];
  emit: Emit;
}

/**
 * An AI script, keyed by `EnemyFields.aiScriptId`.
 *
 * `decide` returns the command this enemy takes on its turn, or `null` for a
 * flavour turn that consumes the ATB slot but does nothing. Scripts may emit
 * telegraph (`charge`) and `message` events directly.
 */
export interface AiScript {
  id: string;
  decide(ctx: AiContext): Command | null;
  /** Optional hook run after every resolved turn of *any* unit (fail clocks). */
  onTurnResolved?(ctx: AiContext, actor: Ffx2Unit): void;
  /** Optional hook run when `self` takes damage (counter-attack scripts). */
  onDamaged?(ctx: AiContext, sourceId: CombatantId | undefined, amount: number): void;
}

/** Read or write a numeric AI memory slot. */
export function mem(unit: Ffx2Unit, key: string, fallback = 0): number {
  const value = unit.aiMemory?.[key];
  return typeof value === 'number' ? value : fallback;
}

export function setMem(unit: Ffx2Unit, key: string, value: number | string | boolean): void {
  if (!unit.aiMemory) unit.aiMemory = {};
  unit.aiMemory[key] = value;
}
