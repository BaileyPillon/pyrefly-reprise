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
  StatBlock,
  StatusId,
} from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import type { AtbSpeed } from './clock.ts';
import type { AtbMode } from './active.ts';
import type { ResultsReport } from './results-tally.ts';
import type { Ffx2AutoLayer } from './adapt/auto-layer.ts';

/** `Omit` over a discriminated union, preserving the members. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An event before the engine stamps its monotonic `seq`. */
export type EventDraft = DistributiveOmit<BattleEvent, 'seq'>;

/** Pushes an event draft onto the current action's event list. */
export type Emit = (event: EventDraft) => void;

/**
 * The game's ATB character fields the contract's {@link FFX2Combatant.atb} has no place for (re-parity W4; FFX-2 only).
 * Each one names the field of the game's character record it stands for (`research/re-ffx2-atb-status.md`); the
 * recovery counter itself (`Chr+0x9d8`) is `atb.recovery`, the charge pair of the action record `atb.charging`.
 */
export interface Ffx2Gauge {
  /** `Chr+0xe68`, the kernel's `Ffx2AtbState`: 0 idle, 1 recovering, 2 thinking, 3 ready, 4 a girl's menu is open, 5 a monster's script is asked, 7 confused, 8 berserk, 9 a command is queued or executing. */
  state: number;
  /** The kernel slot id (`Chr+0xc`): the party 0 to 14, the enemies 15 to 30, each side by its slot. Decides the visiting order and which stream a draw comes from. */
  slot: number;
  /** `Chr+0x9dc`: the largest value the recovery counter has been set to (the HUD's reference for a delayed bar). */
  recoveryMax: number;
  /** `Chr+0x9f4`: steps of thinking left after the recovery ended. Girls think 0; a monster thinks 30 for every fallen girl. */
  thinking: number;
  /** `Chr+0x9e0`: delay damage taken while executing, paid with the next recovery. */
  carry: number;
  /** Logic steps of action time left before the command completes (the E4 estimate, `action-time.ts`); 0 when the command ends the moment it resolves. */
  executing: number;
  /** The ATB cost (`Cmd+0x22`) of the command that is executing, which its completion turns into a recovery. */
  costAtb: number;
  /** The four speeds of the last step (`Chr+0x9f0`, `+0x9ec`, `+0x9e8`, `+0x9e4`); the status clocks read the first three. */
  speeds: { raw: number; awake: number; active: number; tick: number };
  /** `Chr+0x684`, `+0x688`: the Poison and Regen accumulators against their 16,000-unit period. */
  poisonAcc: number;
  regenAcc: number;
  /**
   * Logic steps left of the unit's HIT REACTION (`Chr+0xd98`): while it runs the tick is halved, unless the unit's row says hit
   * reactions do not slow it. The reaction is a motion-system state, so its length is not a number in the exe: the engine starts
   * it at `constants.ts` HIT_REACTION_STEPS when a damaging hit lands (measured, `research/re-ffx2-timing-measured.md` section 5).
   */
  hitReaction: number;
  /**
   * Where the unit stands in the READY LIST (`MsChrATBprocess`, exe 0x006343a0): `step * 64 + rank`, where `step` is the logic step it became
   * ready in and `rank` its place in that step's list, which the game serves lowest recovery counter first (the most negative overshoot
   * first, ties by slot). The engine hands out turns in this order, so two units that run out in the same step act in the game's order.
   * `Number.MAX_SAFE_INTEGER` until the unit has been ready once.
   */
  readyKey: number;
  /**
   * True while the unit sits out an IDLE WAIT: a script poll that issued nothing and asked not to be polled again for some logic steps
   * (`ai/idle.ts` idleFor; the countdown of Bahamut's Mega Flare is 750 polls, one a step). The wait is the same `executing` countdown the
   * action time uses, but it is not a command: when it ends the unit is ready at once and nothing is added for fallen girls (RC3).
   */
  idleWait?: boolean;
  /**
   * What cuts an idle wait short (RC3): a bit mask of `WAKE_ON_RESULT` (a result lands on this unit) and `WAKE_ON_ALIVE_CHANGE` (any unit falls or is
   * raised), `ai/idle.ts`. The game polls a ready monster every step, so a script that is waiting for something sees it on the very next step;
   * the engine cannot poll every step (the presenter abandons a long run of decisions without an event), so it waits for the event instead.
   */
  idleWake?: number;
}

/** Per-unit bookkeeping the engine needs and the contract has nowhere to put. */
export interface Ffx2Unit extends FFX2Combatant {
  /** The game's ATB character fields; `atb` carries the recovery counter and the HUD mirrors. */
  gauge: Ffx2Gauge;
  /** Free-form AI memory, keyed by the script. Scripts own their own keys. */
  aiMemory?: Record<string, number | string | boolean>;
  /** Queued command waiting on the purple charge bar, mirrored from `atb.charging`. */
  pendingCommand?: Command | null;
  /** Set on a special-dressphere part so the engine can restore the girl on defeat. */
  sdspOwnerId?: CombatantId;
  /** Set on a girl who is currently transformed; her parts hold the field. */
  sdspPartIds?: CombatantId[];
  /** Grid node count she transformed from, 2–6. Drives main-part stat scaling. */
  sdspGridNodeCount?: number;
  /** Set on an enemy once an item has been stolen from it: one per battle (`steal.ts`). */
  stolenFrom?: boolean;
  /** Set on an enemy once Pilfer Gil has taken its gil: once per battle (`steal.ts`). */
  gilPilfered?: boolean;
  /** `EnemyDef.autoStatuses`, kept so a Dispel can leave them alone (`resolve.ts`). */
  autoStatuses?: StatusId[];
  /** A girl's automatic-status layer: the auto-ability rows she holds, the kept and SOS sets and the effective layer (`adapt/auto-layer.ts`, `auto-layer.ts`; re-parity X2-D). Absent when she holds no row. */
  autoLayer?: Ffx2AutoLayer;
  /** The most hits one chain on this unit ever reached this battle (`Chr+0x5ae`): it never resets, and the drop roll adds it to the current chain (`chain.ts#bumpChain`; re-parity RC9, lane X2-C). */
  bestChain?: number;
  /** The gil bribed into this enemy so far this battle (`Chr+0x67c`), which the Bribe accuracy formula reads (`adapt/inputs.ts`). */
  bribeAccumulated?: number;
  /** The Bribe threshold the last attempt stored (`Chr+0x680`); the reward grows with its square root (`kernel/steal.ts`). */
  bribeThreshold?: number;
  /**
   * The three auto-ability words (`Chr+0x650`, `+0x652`, `+0x654`) of a girl: her listed auto-abilities and the ones her garment grid's tags stand for
   * (`adapt/menu.ts#autoWordsOf`). The MP cost reads them (Half MP Cost, One MP Cost, Magic Booster; re-parity RC7 lane X2-B). Absent: all zero.
   */
  autoWords?: readonly [number, number, number];
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
  /** The auto-ability tags this effect carries (`Half MP Cost`, `One MP Cost`, `Magic Booster` are the ones the menu reads: re-parity RC7 lane X2-B). */
  autoTags?: string[];
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
   * The Config ATB speed (`clock.ts`: Slow 70, Normal 95, Fast 120 units a logic step, the game's table; §1.2).
   * Default `'normal'`. Changeable mid-battle with `FFX2Engine.setAtbSpeed`.
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
  /**
   * Wait's faithful split (`active.ts` {@link DEFAULT_WAIT_SPLIT}, §1.5): the
   * top-level command list runs the clock, a submenu holds it. Default off (dark launch);
   * `false` is the whole-menu hold. Changeable with `FFX2Engine.setWaitSplit`.
   */
  waitSplit?: boolean;
  /**
   * Seconds of **action time** each action owes before its actor's gauge refills (method check
   * E4, `action-time.ts`): the length is an unsourced `[estimate]`. Wins over the formation's
   * `EnemyGroupDef.actionTimeSeconds` and the global switch; absent (the default) leaves them.
   * For measurement runs. `0` is off.
   */
  actionTimeSeconds?: number;
  /**
   * IC-1 (`constants.ts` IMMUNE_HITS_SKIP_CHAIN, ON since D-242): an immune hit opens no chain
   * window. **No longer read** (re-parity W3): the game's chain counter rises only when a positive HP number is
   * applied (`kernel/apply.ts applyHpDamage`), so an immune hit never opens a window; kept so callers still compile.
   */
  immuneHitsSkipChain?: boolean;
  /** `constants.ts` NAMED_TARGETS_ONLY (Acta Est Fabula on the Redoubts only), for a measurement run. */
  namedTargetsOnly?: boolean;
  /**
   * No longer read (re-parity W4): the game's rule is the only one now, a hit closes the menu when its ATB damage is positive
   * (`constants.ts`, the menu-cancel note). Kept so callers that name it still compile.
   */
  menuCancelOnlyDelayAbilities?: boolean;
  /** `constants.ts` SEPARATE_BATTLE_GAUGES (PR-0107, Chapter VI's Acts II and III), for a measurement run. */
  separateBattleGauges?: boolean;
  /**
   * Roll the preemptive / ambush result at the start of a `'normal'` battle (`MsCalcFirstAttack`, `kernel/atb-start.ts`),
   * from the party's and the monsters' average Agility. Default **off**: no shipped encounter rolls it (the chapters are story
   * battles, and whether the game presets their opening is not in the sources we have), so a `'normal'` opening is the
   * random gauge alone, as before. `condition: 'preemptive'` and `'ambush'` are the game's PRESET results and always apply.
   */
  rollFirstAttack?: boolean;
  /** `constants.ts` LEBLANC_SCRIPT_SINIROTHX (PR-0106, Chapter VI's Leblanc), for a measurement run. */
  leblancScriptSinirothX?: boolean;
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
  rng: BattleRng;
  /** Live encounter flags, shared with story triggers. */
  flags: Record<string, number | string | boolean>;
  /** Total logic steps elapsed this battle (29.97 a second, `clock.ts`). */
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
  /**
   * Stats the script's init entry writes before the battle's first gauge is rolled (`setup.ts`; RC3, FFX-2 only). The game's scripts run init
   * once at the start, so a number set there is the one the opening gauge uses (the Vegnagun Head's Agility 110, row H3).
   */
  init?: { agi?: number };
  /** Optional hook run after every resolved turn of *any* unit (fail clocks). */
  onTurnResolved?(ctx: AiContext, actor: Ffx2Unit): void;
  /**
   * Optional hook run when `self` takes damage (counter-attack scripts), once per action with the total. `hits` is the
   * number of separate HP-damaging results the action put on `self` (the game's reaction entry runs once per result, so
   * a script that counts hits reads this; absent from older callers, meaning one).
   */
  onDamaged?(ctx: AiContext, sourceId: CombatantId | undefined, amount: number, hits?: number): void;
  /**
   * Optional hook run once per party action that was aimed at `self`, hit, miss,
   * immune or status-only alike (`engineHooks.ts#notifyEnemiesTargeted`). The
   * fallen aeons' "+5 when attacked" reading FA8 a [ffx2-fallen-aeons §4].
   */
  onTargeted?(ctx: AiContext, sourceId: CombatantId): void;
  /** Optional hook run when a Regen tick heals `self` (the Magus Sisters' +5, §4.2). */
  onRegen?(ctx: AiContext, amount: number): void;
  /**
   * Optional **reaction entry** (re-parity AI-FFX2-b; FFX-2 only): runs once for every result applied to `self`, after the
   * result's HP, MP and statuses are in (`resolve-strike.ts`, the game's result applier). That is once per strike that
   * lands (a three-hit command that lands is three results), once for a command that misses or has no effect on `self`
   * (one result for the whole command), once for a status-only or zero-damage strike, once for a drain's transfer, which
   * is delivered to the drainer with the drainer as the source, and once for a Scan or Libra. `source` is the unit whose
   * command it is and `ability` the command's row. Regen and Poison ticks are not routed here ({@link onRegen} keeps
   * them). The fallen aeons' and the Magus Sisters' gauges, Paragon's Big Bang flag and the Oversoul's answer state are
   * written here [research/re-ffx2-ai-fallen-trema.md 1.2]. No other script defines it, so no other log changes.
   */
  onResult?(ctx: AiContext, source: Ffx2Unit, ability: AbilityDef): void;
  /**
   * Optional hook run after every action that applied results to `self` (`engineHooks.ts#notifyEnemiesResults`),
   * once, with how many and whose latest one it was. The game runs the reaction entry once per result (each landing
   * strike, one for a miss, one for a no-effect result, never `self`'s own); Baralai's burst counter and Ixion's
   * action counter count them (`results-tally.ts`; re-parity AI lane C, `research/re-ffx2-ai-leblanc-den-ixion.md` 1.2).
   */
  onResults?(ctx: AiContext, report: ResultsReport): void;
  /**
   * Optional **out-of-turn counter** (`engineHooks.ts#runCounters`): asked once after every
   * party action that damaged `self`, with the damage and that action's mitigation class
   * (`execute.ts#attackClass`). A command returned here resolves at once, costs `self` no
   * ATB and emits a `counter` event. Paragon's Big Bang [ffx2-trema §4.1, `[SinirothX]`
   * "Counter"; plan TR12 = b]. No other script defines it, so no other log changes.
   */
  counter?(ctx: AiContext, attacker: Ffx2Unit, hit: { amount: number; attackClass: string }): Command | null;
  /**
   * Optional hook run once after **every party action**, hit or not (`engineHooks.ts#runPartyActionAnswers`),
   * with the ability it used and whether it was aimed at `self`. A command returned here resolves
   * at once as a counter, like {@link counter}. Oversoul Paragon's copy-and-answer script
   * [ffx2-trema §12.2]; an OFF option, and no other script defines it, so no other log changes.
   */
  onPartyAction?(ctx: AiContext, actor: Ffx2Unit, action: { abilityId: string | undefined; aimedAtSelf: boolean }): Command | null;
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
