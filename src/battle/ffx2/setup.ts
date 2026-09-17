/**
 * `init()` — building the live `BattleState` from a `BattleSetup`.
 *
 * Two things this has to get right that the FFX side does not:
 *
 * 1. **A girl carries no stat block.** `FFX2MemberBuild` is
 *    `level + dressphere + garment grid + accessories`, because in X-2 stats
 *    are a function of `(dressphere x level)` only [ffx2-combat-core §5.1]. We
 *    derive them, then layer the Garment Grid's permanent `P-` equip effect on
 *    top. Gate (`T-`) bonuses arrive later, when she actually crosses a gate.
 * 2. **Chained encounters.** The engine never advances groups itself
 *    (CONTRACT-CHANGES §6): the BattleScreen re-inits for the next group with
 *    the party's carried-over state, so `init()` must accept HP, MP, statuses
 *    and dressphere/grid progress rather than starting the girls fresh.
 */

import type {
  BattleSetup,
  BattleState,
  CombatantId,
  EnemyDef,
  FFX2MemberBuild,
  FFX2PartyBuild,
  StatBlock,
} from '../common/types.ts';
import type { CarriedPartyState, Ffx2EngineOptions, Ffx2Unit } from './internal.ts';
import { dressphereStats } from './dressphere-stats.ts';
import { withAccessories } from './accessories.ts';
import { activeGateBonuses, gateStatTotal, withStatBonus } from './garment-grids.ts';
import { baseRequired, refreshGauge } from './gauges.ts';
import { defaultGarmentGrids } from './garment-grids.ts';

function emptyAtb(agi: number): Ffx2Unit['atb'] {
  return { ticks: 0, required: baseRequired(agi), gauge: 0, charging: null, recovery: 0 };
}

/** Node contents: the build lists what she owns, not where it sits. `[estimate]` */
function gridNodeContents(member: FFX2MemberBuild, nodes: number): Array<string | null> {
  const out: Array<string | null> = new Array(nodes).fill(null);
  const ordered = [member.currentDressphere, ...member.owned.filter((d) => d !== member.currentDressphere)];
  for (let i = 0; i < nodes && i < ordered.length; i++) out[i] = ordered[i] ?? null;
  // `noUncheckedIndexedAccess`: every slot is now `string | null`, never undefined.
  const at = member.garmentGrid.nodePosition;
  if (at >= 0 && at < nodes && out[at] !== member.currentDressphere) {
    const existing = out.indexOf(member.currentDressphere);
    if (existing >= 0) out[existing] = out[at] ?? null;
    out[at] = member.currentDressphere;
  }
  return out;
}

function buildMember(member: FFX2MemberBuild, slot: number, options: Ffx2EngineOptions): Ffx2Unit {
  const derive = options.dresspheres?.stats ?? dressphereStats;
  const base = derive(member.currentDressphere, member.level);
  const grids = options.garmentGrids ?? defaultGarmentGrids;
  const grid = grids.get(member.garmentGrid.id);
  // The `P-` equip effect is the `gates: []` bonus and is always on. §4.1
  const equip = grid ? gateStatTotal(activeGateBonuses(grid, [])) : {};
  // …then the two accessories, the fourth term this file's own header has
  // always named and nothing ever computed [accessories.ts, ffx2-combat-core
  // §5.4]. Without it the researched loadouts are inert and Chapter 5's Tail
  // kills the White Mage from full on its first Noli Me Tangere.
  const stats: StatBlock = withAccessories(withStatBonus(base, equip), member.accessories);

  return {
    id: member.id,
    name: member.name,
    side: 'party',
    spriteKey: member.spriteKey,
    portraitKey: member.portraitKey,
    stats,
    hp: member.hp ?? stats.maxHp,
    mp: member.mp ?? stats.maxMp,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: (member.hp ?? stats.maxHp) > 0,
    removed: false,
    slot,
    flags: {},
    level: member.level,
    dresspheres: {
      current: member.currentDressphere,
      owned: [...member.owned],
      garmentGrid: {
        ...member.garmentGrid,
        passedGates: [...member.garmentGrid.passedGates],
        wornThisBattle: [...new Set([...member.garmentGrid.wornThisBattle, member.currentDressphere])],
      },
      abilitiesLearned: member.abilitiesLearned,
    },
    atb: emptyAtb(stats.agi),
    accessories: [...member.accessories],
    chainCount: 0,
    chainWindowTicks: 0,
    // Carried in from the previous link of a chain (CONTRACT-CHANGES, additive).
    ...(member.statuses ? { statuses: { ...member.statuses } } : {}),
  };
}

function buildEnemy(enemy: EnemyDef, isPart: boolean): Ffx2Unit {
  const stats: StatBlock = { ...enemy.stats };
  return {
    id: enemy.id,
    name: enemy.name,
    side: 'enemy',
    spriteKey: enemy.spriteKey,
    stats,
    hp: enemy.hp,
    mp: enemy.mp,
    statuses: {},
    affinities: { ...enemy.affinities },
    immunities: { ...enemy.immunities },
    immunityFlags: [...enemy.immunityFlags],
    controller: 'ai',
    alive: enemy.hp > 0,
    removed: false,
    slot: enemy.slot,
    flags: { ...enemy.flags, ...(isPart ? { isPart: true } : {}) },
    sensorText: enemy.sensorText,
    scanText: enemy.scanText,
    misleadingSensor: enemy.misleadingSensor,
    level: enemy.level ?? 1,
    atb: emptyAtb(stats.agi),
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
    aiMemory: {},
    thinkingTicks: 0,
    enemy: {
      aiScriptId: enemy.aiScriptId,
      formIndex: 0,
      forms: enemy.forms,
      rewards: enemy.rewards,
      ...(enemy.level !== undefined ? { level: enemy.level } : {}),
      ...(enemy.thinkingPeriod !== undefined ? { thinkingPeriod: enemy.thinkingPeriod } : {}),
    },
  };
}

/** Restore a girl from the previous link of a chain. CONTRACT-CHANGES §6. */
function applyCarriedState(unit: Ffx2Unit, carried: CarriedPartyState): void {
  const row = carried.members.find((m) => m.id === unit.id);
  if (!row) return;
  unit.hp = Math.max(0, Math.min(unit.stats.maxHp, row.hp));
  unit.mp = Math.max(0, Math.min(unit.stats.maxMp, row.mp));
  unit.alive = unit.hp > 0;
  unit.statuses = { ...row.statuses };
  if (row.dresspheres) unit.dresspheres = row.dresspheres;
  if (row.accessories) unit.accessories = [...row.accessories];
  // Gate effects are lost at the end of a battle, but a chained link is the
  // *same* battle in every way that matters, so `passedGates` rides along.
}

/**
 * Opening ATB fill. §1.6: normal battles start every bar at a randomised level;
 * a pre-emptive strike fills the party's, an ambush fills the enemies'.
 */
function seedOpeningGauges(units: Ffx2Unit[], condition: BattleSetup['condition'], rng: { int(a: number, b: number): number }): void {
  for (const unit of units) {
    if (condition === 'preemptive') {
      unit.atb.ticks = unit.side === 'party' ? unit.atb.required : 0;
    } else if (condition === 'ambush') {
      unit.atb.ticks = unit.side === 'enemy' ? unit.atb.required : 0;
    } else if (condition === 'scripted') {
      unit.atb.ticks = 0;
    } else {
      unit.atb.ticks = Math.floor((unit.atb.required * rng.int(0, 60)) / 100);
    }
    refreshGauge(unit);
  }
}

/**
 * Seed the live item counts.
 *
 * `inventory:<itemId>` is the convention `BattleScreenSetup.carryInventory`
 * already reads back when a chained link hands the party on, and the FFX side
 * spells it the same way — it just had nothing writing it on the X-2 side,
 * because the X-2 command menu never offered an item at all. A carried-in count
 * from the previous link of a chain wins over the build's own.
 */
function inventoryFlags(
  party: FFX2PartyBuild,
  options: Ffx2EngineOptions,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const entry of party.inventory ?? []) out[`inventory:${entry.itemId}`] = entry.count;
  for (const entry of options.carriedParty?.inventory ?? []) out[`inventory:${entry.itemId}`] = entry.count;
  return out;
}

/** Live item counts, keyed by item id, for the command menu. */
export function inventoryCounts(state: BattleState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(state.flags)) {
    if (key.startsWith('inventory:') && typeof value === 'number') out[key.slice('inventory:'.length)] = value;
  }
  return out;
}

export interface BuiltState {
  state: BattleState;
  units: Ffx2Unit[];
  /** Node contents per girl, so the command menu can offer legal spherechanges. */
  gridNodes: Record<CombatantId, Array<string | null>>;
}

/** Build the whole initial state. Called by `FFX2Engine.init`. */
export function buildState(
  setup: BattleSetup,
  options: Ffx2EngineOptions,
  rng: { int(a: number, b: number): number },
): BuiltState {
  if (setup.party.game !== 'ffx2') throw new Error('FFX2Engine: setup.party must be an FFX2PartyBuild');
  const party = setup.party as FFX2PartyBuild;

  const grids = options.garmentGrids ?? defaultGarmentGrids;
  const units: Ffx2Unit[] = [];
  const gridNodes: Record<CombatantId, Array<string | null>> = {};

  party.members.forEach((member, i) => {
    const unit = buildMember(member, i, options);
    const grid = grids.get(member.garmentGrid.id);
    gridNodes[unit.id] = gridNodeContents(member, grid?.nodes ?? 6);
    if (options.carriedParty) applyCarriedState(unit, options.carriedParty);
    units.push(unit);
  });

  for (const enemy of setup.enemies.enemies) units.push(buildEnemy(enemy, false));
  for (const part of setup.enemies.parts ?? []) units.push(buildEnemy(part, true));

  seedOpeningGauges(units, setup.condition, rng);

  const combatants: BattleState['combatants'] = {};
  for (const unit of units) combatants[unit.id] = unit;

  const state: BattleState = {
    game: 'ffx2',
    combatants,
    activeIds: party.members.map((m) => m.id),
    reserveIds: [],
    enemyIds: units.filter((u) => u.side === 'enemy').map((u) => u.id),
    aeonId: null,
    turn: 0,
    ticks: options.carriedParty?.elapsedTicks ?? 0,
    log: [],
    nextSeq: 0,
    triggers: [...setup.triggers],
    firedTriggerIds: [],
    result: null,
    seed: setup.seed,
    flags: {
      ...(setup.chained || options.chained ? { chained: true } : {}),
      ...(setup.enemies.nextGroupId ? { nextGroupId: setup.enemies.nextGroupId } : {}),
      canEscape: setup.canEscape ?? setup.enemies.canEscape ?? false,
      ...inventoryFlags(party, options),
    },
  };

  return { state, units, gridNodes };
}
