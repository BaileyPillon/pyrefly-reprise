/**
 * Build an FF7 battle: combatants from the party build and the enemy group,
 * derived stats from base stats + equipment + Materia, the Turn Timer rates and
 * the battle-start timers.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.** The shared `stats` block on
 * each combatant is a **display mirror** (HP and MP for shared UI); the engine
 * reads only the `ff7` block (`battle/common/types-ff7.ts`).
 */

import { cloneData } from '../common/clone.ts';
import type {
  BattleSetup,
  BattleState,
  Ff7Combatant,
  Ff7MemberBuild,
  Ff7PartyBuild,
  EnemyDef,
  Rng,
  StatBlock,
} from '../common/types.ts';
import { battleStartTimers, normalSpeed, turnTimerIncrease, vTimerIncrease, type Ff7Formation } from './atb.ts';
import type { Ff7Registry } from './defs.ts';
import type { Ff7Runtime } from './internal.ts';
import { deriveMemberStats } from './stats.ts';

/** What {@link buildFf7Battle} returns. */
export interface Ff7Built {
  state: BattleState;
  rt: Ff7Runtime;
}

/** Map the shared opening condition to FF7's formation [core §2.4]. A boss's `'scripted'` start is Normal. */
function formationOf(condition: BattleSetup['condition']): Ff7Formation {
  switch (condition) {
    case 'preemptive':
      return 'preemptive';
    case 'ambush':
      return 'back';
    default:
      return 'normal';
  }
}

/** The display mirror of the shared `StatBlock`: Att, Def, MAt, MDf, Dex, Lck, Df%, At%. */
function mirror(maxHp: number, maxMp: number, s: { att: number; def: number; mat: number; mdf: number; dex: number; lck: number; dfPct: number; atPct: number }): StatBlock {
  return {
    hp: maxHp, mp: maxMp, maxHp, maxMp,
    str: s.att, def: s.def, mag: s.mat, mdef: s.mdf, agi: s.dex, luck: s.lck, eva: s.dfPct, acc: s.atPct,
  };
}

function partyMember(m: Ff7MemberBuild, slot: number, reg: Ff7Registry): Ff7Combatant {
  const derived = deriveMemberStats(m, reg.materia);
  const hp = Math.min(m.hp ?? derived.maxHp, derived.maxHp);
  const mp = Math.min(m.mp ?? derived.maxMp, derived.maxMp);
  return {
    id: m.id,
    name: m.name,
    side: 'party',
    spriteKey: m.spriteKey,
    portraitKey: m.portraitKey,
    stats: mirror(derived.maxHp, derived.maxMp, derived),
    hp,
    mp,
    statuses: cloneData(m.statuses ?? {}),
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: hp > 0,
    removed: false,
    slot,
    flags: {},
    ff7: {
      base: { ...m.base },
      derived,
      row: m.row,
      limit: cloneData(m.limit),
      materia: cloneData(m.materia),
      atb: { turnTimer: 0, vTimer: 0, ready: false },
      defending: false,
    },
  };
}

function enemy(def: EnemyDef): Ff7Combatant {
  const f = def.ff7;
  if (!f) throw new Error(`FF7 engine: enemy '${def.id}' has no ff7 block`);
  const s = f.stats;
  return {
    id: def.id,
    name: def.name,
    side: 'enemy',
    spriteKey: def.forms[0]?.spriteKey ?? def.spriteKey,
    stats: mirror(s.maxHp, s.maxMp, { ...s, atPct: 0 }),
    hp: def.hp,
    mp: def.mp,
    statuses: {},
    affinities: cloneData(def.affinities),
    immunities: {},
    immunityFlags: [...def.immunityFlags],
    controller: 'ai',
    alive: def.hp > 0,
    removed: false,
    slot: def.slot,
    flags: cloneData(def.flags ?? {}),
    ff7: {
      // Enemies' listed stats are already final; no At%, no MD% [core §1.3].
      derived: { ...s, atPct: 0, mdPct: 0 },
      row: 'front',
      atb: { turnTimer: 0, vTimer: 0, ready: false },
      enemy: cloneData(f),
      formIndex: 0,
      aiScriptId: def.aiScriptId,
    },
  };
}

/**
 * Turn Timer increase per tick for each combatant at a Battle Speed [core §2.3]:
 * party `[(TotalDex + 50) * V / NormalSpeed]`, enemy `[Dex * V / NormalSpeed]`.
 * Recomputed when the Battle Speed changes; NormalSpeed stays the battle-start one.
 */
export function turnIncreases(units: readonly Ff7Combatant[], normal: number, battleSpeed: number): Record<string, number> {
  const v = vTimerIncrease(battleSpeed);
  const out: Record<string, number> = {};
  for (const c of units) out[c.id] = turnTimerIncrease(c.ff7.derived.dex, c.side === 'enemy', v, normal);
  return out;
}

/**
 * Build the state for one FF7 battle. Draws from `rng`: one `Rnd(0..32767)` per
 * combatant for the battle-start timers, party first in slot order, then enemies
 * [core §2.4; the draw order is our estimate, `atb.ts`].
 */
export function buildFf7Battle(setup: BattleSetup, reg: Ff7Registry, rng: Rng, battleSpeed: number): Ff7Built {
  if (setup.game !== 'ff7' || setup.party.game !== 'ff7') throw new Error('FF7 engine: the setup is not an FF7 battle');
  const party = setup.party as Ff7PartyBuild;
  const byId = new Map(party.members.map((m) => [m.id, m]));
  const members = party.activeSlots.map((id, slot) => {
    const m = byId.get(id);
    if (!m) throw new Error(`FF7 engine: active slot '${id}' has no member build`);
    return partyMember(m, slot, reg);
  });
  const foes = setup.enemies.enemies.map((d) => enemy(d));

  const combatants: Record<string, Ff7Combatant> = {};
  for (const c of [...members, ...foes]) combatants[c.id] = c;

  // NormalSpeed from the battle party's **base** Dex only [core §2.3].
  const normal = normalSpeed(members.map((c) => c.ff7.base?.dex ?? 0));
  const increase = turnIncreases([...members, ...foes], normal, battleSpeed);

  const order = [...members, ...foes];
  const timers = battleStartTimers(order.map((c) => ({ isEnemy: c.side === 'enemy' })), formationOf(setup.condition), rng);
  order.forEach((c, i) => {
    c.ff7.atb.turnTimer = c.alive ? (timers[i] ?? 0) : 0;
  });

  const weapons: Ff7Runtime['weapons'] = {};
  for (const m of party.members) weapons[m.id] = m.weapon;
  const forms: Ff7Runtime['forms'] = {};
  for (const d of setup.enemies.enemies) forms[d.id] = d.forms.map((f) => ({ name: f.name, spriteKey: f.spriteKey }));
  const inventory: Record<string, number> = {};
  for (const row of party.inventory) inventory[row.itemId] = (inventory[row.itemId] ?? 0) + row.count;

  const state: BattleState = {
    game: 'ff7',
    combatants,
    activeIds: members.map((c) => c.id),
    reserveIds: [],
    enemyIds: foes.map((c) => c.id),
    aeonId: null,
    turn: 0,
    ticks: 0,
    log: [],
    nextSeq: 0,
    triggers: cloneData(setup.triggers),
    firedTriggerIds: [],
    result: null,
    seed: setup.seed,
    flags: {},
  };
  return { state, rt: { weapons, inventory, normalSpeed: normal, increase, inputQueue: [], actions: [], forms, lastTurnTick: 0 } };
}
