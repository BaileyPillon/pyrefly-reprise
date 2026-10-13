/**
 * Rig and **independent oracle** for `parity-ffx-engine-command.test.ts` (re-parity RC7 lane L-CMD; **FFX only**).
 *
 * The rig builds a small battle (a context around a handful of combatants, the real catalog abilities) so the test can call the engine's own
 * `executeCommand`, `resolveDoublecast` and `availableCommands`. The oracle restates `research/re-ffx-command-gate.md` in its own terms: plain
 * booleans and numbers, a different arithmetic for the MP cost (cases, not the divisor and addend of the kernel) and no import from
 * `src/battle/ffx/kernel/`, `adapt/command-gate.ts` or `command-start.ts`: a wrong translation of an engine fact into a kernel input shows as
 * a difference between the engine and this file.
 */

import type { AbilityDef, AutoAbilityId, BattleState, FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { makeFfxRng } from '../../../src/battle/ffx/adapt/streams.ts';
import { FFXContentRegistry } from '../../../src/battle/ffx/registry.ts';
import { type Ctx, type FFXRuntime, makeActorRuntime } from '../../../src/battle/ffx/state.ts';
import { ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';

/** Who stands in the rig, in the terms of the game's character facts. */
export interface Who {
  id: string;
  side: 'party' | 'aeon' | 'enemy';
  mp?: number;
  hp?: number;
  /** Auto-abilities worn (weapon slot). */
  autos?: AutoAbilityId[];
  /** Statuses on (permanent flavour; `silence`, `curse`, `ko`, `petrify`, `mp-cost-zero` ...). */
  statuses?: StatusId[];
  /** The Overdrive gauge as the engine keeps it (percent of the bar). */
  gauge?: number;
  mode?: 'coward' | 'stoic';
  /** BattleDistance of the combatant (the game's distance byte; 0 when absent). */
  distance?: number;
  removed?: boolean;
  controller?: 'player' | 'ai';
  /** Abilities the character has learned (Doublecast checks its spell against them). */
  learned?: string[];
}

export function combatantOf(w: Who): FFXCombatant {
  const status = (id: StatusId): [StatusId, StatusInstance] => [id, { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false }];
  const on = (w.statuses ?? []).map(status);
  const dead = (w.statuses ?? []).includes('ko');
  const maxHp = 9999;
  const c: FFXCombatant = {
    id: w.id,
    name: w.id,
    side: w.side,
    spriteKey: w.id,
    hp: dead ? 0 : (w.hp ?? 5000),
    mp: w.mp ?? 100,
    stats: { hp: maxHp, mp: 999, str: 20, def: 20, mag: 20, mdef: 20, agi: 20, luck: 20, eva: 0, acc: 100, maxHp, maxMp: 999 },
    statuses: Object.fromEntries(on),
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: w.controller ?? (w.side === 'enemy' ? 'ai' : 'player'),
    alive: !dead,
    removed: w.removed === true,
    slot: 0,
    flags: w.distance !== undefined && w.distance > 0 ? { battleDistance: w.distance } : {},
    learnedAbilityIds: w.learned ?? [],
  };
  if (w.side !== 'enemy') c.equipment = { weapon: { name: 'Weapon', slots: 4, autoAbilities: w.autos ?? [] }, armor: { name: 'Armor', slots: 4, autoAbilities: [] } };
  if (w.gauge !== undefined || w.mode !== undefined) c.overdrive = { gauge: w.gauge ?? 0, mode: w.mode ?? 'stoic', unlockedOverdriveIds: [] };
  return c;
}

export interface Rig {
  ctx: Ctx;
  events: Array<Record<string, unknown>>;
  byId: Map<string, FFXCombatant>;
}

/** A battle context around the given combatants (party ids first, in order; the party is the active line). */
export function rigOf(whos: readonly Who[], seed = 20261013, inventory: ReadonlyArray<readonly [string, number]> = []): Rig {
  const rng = makeFfxRng(seed);
  const combatants = whos.map(combatantOf);
  const byId = new Map(combatants.map((c) => [c.id, c] as const));
  const partyIds = combatants.filter((c) => c.side === 'party').map((c) => c.id);
  const state: BattleState = {
    game: 'ffx',
    combatants: Object.fromEntries(combatants.map((c) => [c.id, c])),
    activeIds: partyIds,
    reserveIds: [],
    enemyIds: combatants.filter((c) => c.side === 'enemy').map((c) => c.id),
    aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0, triggers: [], firedTriggerIds: [], result: null, seed, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0,
    finished: false, aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(inventory), gil: 0,
    chained: false, overkilled: [], canEscape: true, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
  };
  for (const c of combatants) rt.actors.set(c.id, makeActorRuntime(c));
  const events: Array<Record<string, unknown>> = [];
  const content = new FFXContentRegistry();
  content.addAbilities(Object.values(ABILITIES));
  content.addItems(Object.values(ITEMS));
  const ctx: Ctx = {
    state,
    rt,
    rng: rng as unknown as Ctx['rng'],
    content,
    emit: (event) => {
      const full = { ...event, seq: state.nextSeq++ };
      state.log.push(full as never);
      events.push(full as never);
    },
  };
  return { ctx, events, byId };
}

// ------------------------------------------------------------------------------------------------------------------------ the oracle

/** The auto-abilities that matter to the MP cost. */
export interface CostFacts {
  half: boolean;
  one: boolean;
  booster: boolean;
  /** Spellspring: no MP cost. */
  free: boolean;
}

/**
 * The MP the game charges, in cases. Spellspring: 0. One MP Cost: 1 for any ability that costs something, and 2 when the Magic Booster also
 * applies to a Black or White Magic spell. Otherwise a boosted spell pays double (and Half MP Cost then gives back exactly the printed
 * cost), an unboosted one under Half MP Cost pays half rounded UP, and the rest pay the printed cost.
 */
export function oracleMpCost(printed: number, category: 'black' | 'white' | 'other', f: CostFacts): number {
  if (f.free) return 0;
  const boosted = f.booster && category !== 'other';
  if (f.one && printed > 0) return boosted ? 2 : 1;
  if (boosted) return f.half ? printed : printed * 2;
  if (f.half) return Math.ceil(printed / 2);
  return printed;
}

/** Does the Silence flag of the record gate it? The oracle reads the record's own flag word (the game's data), nothing else. */
export function oracleGated(def: AbilityDef): boolean {
  const flags = def.record?.flagsMisc;
  if (flags !== undefined) return (flags & 0x20000) !== 0;
  return def.category === 'blackmagic' || def.category === 'whitemagic';
}

/** The game's category of a record for the Booster: 1 Black Magic, 2 White Magic, else 0 (from the record's own type byte). */
export function oracleCategory(def: AbilityDef): 'black' | 'white' | 'other' {
  const type = def.record?.type ?? (def.category === 'blackmagic' ? 1 : def.category === 'whitemagic' ? 2 : 0);
  return type === 1 ? 'black' : type === 2 ? 'white' : 'other';
}

/** A small deterministic generator for the scenes (not the battle's). */
export function lcg(seed: number): { int: (lo: number, hi: number) => number; chance: (p: number) => boolean; pick: <T>(a: readonly T[]) => T } {
  let s = seed >>> 0 || 1;
  const next = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return {
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (a) => a[Math.floor(next() * a.length)] as never,
  };
}
