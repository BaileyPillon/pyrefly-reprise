/**
 * Garment Grids and the spherechange action [ffx2-combat-core §4].
 *
 * A Grid is 2–6 **nodes** joined by links, with 0–4 coloured **gates** sitting
 * *on* the links. Spherechange (L1) costs the girl's whole turn, may only move
 * **one link**, and passes *through* any gates on that link — gates are not a
 * step of their own. Gate effects (`T-`) last the rest of the battle and
 * survive KO and revival; equip effects (`P-`) are always on.
 *
 * **Topology is an `[estimate]`.** The research publishes each Grid's node
 * count, gate set and bonus table (§4.3) but not the shape of the links, so
 * every Grid here is modelled as a ring with the gates spread over successive
 * links. Adjacency ("one link away") and gate accumulation — the two things the
 * rules actually key off — come out right; only the exact route does not.
 *
 * The §4.1 "stacking quirk": a Grid whose stat bonus is allocated to *all* four
 * gates grants it **per gate passed**, so three or four times the listed value.
 * Those Grids carry `perGate: true`.
 */

import type { GateColour, StatBlock } from '../common/types.ts';
import type { GarmentGridDef, GarmentGridRegistry, GateBonus } from './internal.ts';

const ALL_GATES: readonly GateColour[] = ['red', 'green', 'blue', 'yellow'];

/** Build a ring Grid: `nodes` nodes, `gates` spread one per successive link. */
function ring(id: string, nodes: number, gates: readonly GateColour[], bonuses: GateBonus[]): GarmentGridDef {
  const links: GarmentGridDef['links'] = [];
  for (let i = 0; i < nodes; i++) {
    const to = (i + 1) % nodes;
    if (nodes === 2 && i === 1) break; // a 2-node Grid has exactly one link
    const gate = gates[i];
    links.push({ from: i, to, gates: gate ? [gate] : [] });
  }
  return { id, nodes, links, bonuses };
}

function stat(gates: GateColour[], stats: Partial<StatBlock>, label: string, perGate = false): GateBonus {
  return { gates, stats, label, ...(perGate ? { perGate: true } : {}) };
}

/**
 * The Grids the two builds realistically own [ffx2-combat-core §4.3].
 * A Grid the caller asks for that is not here degrades to a 6-node, gateless
 * ring so nothing crashes; the data agent's registry supersedes all of it.
 */
const GRIDS: readonly GarmentGridDef[] = [
  ring('first-steps', 6, [], []),
  ring('unerring-path', 2, [], []),
  ring('vanguard', 5, ALL_GATES, [
    stat([], { str: 5, mag: 5 }, 'STR +5, MAG +5'),
    stat(['yellow'], { str: 5 }, 'STR +5'),
    stat(['red'], { str: 5 }, 'STR +5'),
    stat(['blue'], { mag: 5 }, 'MAG +5'),
    stat(['green'], { mag: 5 }, 'MAG +5'),
  ]),
  ring('protection-halo', 5, ALL_GATES, [
    stat([], { def: 5, mdef: 5 }, 'DEF +5, MDEF +5'),
    stat(['yellow'], { def: 5 }, 'DEF +5'),
    stat(['red'], { def: 5 }, 'DEF +5'),
    stat(['blue'], { mdef: 5 }, 'MDEF +5'),
    stat(['green'], { mdef: 5 }, 'MDEF +5'),
  ]),
  ring('hour-of-need', 5, ALL_GATES, [
    stat([], { def: 10, mdef: 10 }, 'DEF +10, MDEF +10'),
    stat(['yellow'], { def: 10 }, 'DEF +10'),
    stat(['red'], { def: 10 }, 'DEF +10'),
    stat(['blue'], { mdef: 10 }, 'MDEF +10'),
    stat(['green'], { mdef: 10 }, 'MDEF +10'),
  ]),
  ring('bum-rush', 5, ALL_GATES, [
    stat([], { str: 10, mag: 10 }, 'STR +10, MAG +10'),
    stat(['yellow'], { str: 10 }, 'STR +10'),
    stat(['red'], { str: 10 }, 'STR +10'),
    stat(['blue'], { mag: 10 }, 'MAG +10'),
    stat(['green'], { mag: 10 }, 'MAG +10'),
  ]),
  // §4.1 stacking quirk: allocated to every gate, so it pays per gate passed.
  ring('stonehewn', 4, ALL_GATES, [
    stat([], { def: 10 }, 'DEF +10'),
    stat(['red'], { def: 15 }, 'DEF +15 per gate', true),
  ]),
  ring('enigma-plate', 4, ALL_GATES, [
    stat([], { mdef: 10 }, 'MDEF +10'),
    stat(['red'], { mdef: 15 }, 'MDEF +15 per gate', true),
  ]),
  ring('samurais-honor', 6, ALL_GATES, [
    stat(['red'], { str: 15 }, 'STR +15 per gate', true),
    { gates: [...ALL_GATES], waitDownPercent: 40, label: 'Bushido wait down' },
  ]),
  ring('pride-of-the-sword', 6, ALL_GATES, [
    stat(['red'], { str: 15 }, 'STR +15 per gate', true),
    { gates: [...ALL_GATES], waitDownPercent: 40, label: 'Swordplay wait down' },
  ]),
  ring('blood-of-the-beast', 6, ALL_GATES, [stat(['red'], { str: 15 }, 'STR +15 per gate', true)]),
  ring('chaos-maelstrom', 6, ALL_GATES, [
    stat(['red'], { mag: 15 }, 'MAG +15 per gate', true),
    { gates: [...ALL_GATES], waitDownPercent: 40, label: 'Arcana wait down' },
  ]),
  ring('black-tabard', 6, ALL_GATES, [
    stat(['red'], { mag: 15 }, 'MAG +15 per gate', true),
    { gates: [...ALL_GATES], waitDownPercent: 40, label: 'Black Magic wait down' },
  ]),
  ring('flash-of-steel', 5, ALL_GATES, [
    stat([], { str: 20, mag: 20 }, 'STR +20, MAG +20'),
    stat(['yellow'], { str: 20 }, 'STR +20'),
    stat(['red'], { str: 20 }, 'STR +20'),
    stat(['blue'], { mag: 20 }, 'MAG +20'),
    stat(['green'], { mag: 20 }, 'MAG +20'),
  ]),
  ring('tempered-will', 5, ['red', 'green'], [
    { gates: ['green'], label: 'Double HP' },
    { gates: ['red'], label: 'Double MP' },
  ]),
  ring('the-end', 5, ALL_GATES, [
    { gates: ['green', 'red'], breaksDamageLimit: true, label: 'Break Damage Limit' },
  ]),
  ring('highroad-winds', 4, ALL_GATES, []),
  ring('heart-of-flame', 3, ['red', 'green', 'yellow'], []),
  ring('white-signet', 6, ALL_GATES, [stat(['red'], { mag: 10 }, 'MAG +10 per gate', true)]),
];

const BY_ID = new Map(GRIDS.map((g) => [g.id, g]));

/**
 * Look up a Grid, always succeeding.
 *
 * A Grid the caller asks for that this table does not carry degrades to a
 * 6-node gateless ring: a half-transcribed data file should produce a boring
 * Grid, not a crash.
 */
export function garmentGrid(id: string): GarmentGridDef {
  return BY_ID.get(id) ?? ring(id, 6, [], []);
}

/** Fallback registry. Injecting a `GarmentGridRegistry` replaces it entirely. */
export const defaultGarmentGrids: GarmentGridRegistry = { get: garmentGrid };

/** Nodes reachable from `node` in exactly one link, with the gates on the way. */
export function adjacentNodes(grid: GarmentGridDef, node: number): Array<{ node: number; gates: GateColour[] }> {
  const out: Array<{ node: number; gates: GateColour[] }> = [];
  for (const link of grid.links) {
    if (link.from === node) out.push({ node: link.to, gates: [...link.gates] });
    else if (link.to === node) out.push({ node: link.from, gates: [...link.gates] });
  }
  return out;
}

/** The gates on the single link between two nodes, or `null` when not adjacent. §4.2 */
export function gatesBetween(grid: GarmentGridDef, from: number, to: number): GateColour[] | null {
  for (const link of grid.links) {
    if ((link.from === from && link.to === to) || (link.to === from && link.from === to)) {
      return [...link.gates];
    }
  }
  return null;
}

/**
 * Sum every gate bonus this girl has unlocked with the gates she has passed.
 *
 * `gates: []` is the permanent equip effect and is always counted. A bonus
 * requiring several gates fires once all of them have been passed, in any
 * order. `perGate: true` pays once **per gate passed** (§4.1 stacking quirk).
 */
export function activeGateBonuses(grid: GarmentGridDef, passed: readonly GateColour[]): GateBonus[] {
  const unique = new Set(passed);
  const out: GateBonus[] = [];
  for (const bonus of grid.bonuses) {
    if (bonus.gates.length === 0) {
      out.push(bonus);
      continue;
    }
    if (bonus.perGate) {
      for (let i = 0; i < unique.size; i++) out.push(bonus);
      continue;
    }
    if (bonus.gates.every((g) => unique.has(g))) out.push(bonus);
  }
  return out;
}

/** Flat stat total from the unlocked bonuses, ready to add onto a `StatBlock`. */
export function gateStatTotal(bonuses: readonly GateBonus[]): Partial<StatBlock> {
  const total: Partial<StatBlock> = {};
  for (const bonus of bonuses) {
    if (!bonus.stats) continue;
    for (const [key, value] of Object.entries(bonus.stats) as Array<[keyof StatBlock, number]>) {
      total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
}

/** Add a flat stat delta onto a block, clamping the HP/MP pools to their mirrors. */
export function withStatBonus(base: StatBlock, delta: Partial<StatBlock>): StatBlock {
  const out: StatBlock = { ...base };
  for (const [key, value] of Object.entries(delta) as Array<[keyof StatBlock, number]>) {
    out[key] = Math.max(0, (out[key] ?? 0) + value);
  }
  out.maxHp = Math.max(out.maxHp, out.hp);
  out.maxMp = Math.max(out.maxMp, out.mp);
  return out;
}

/** The largest `waitDownPercent` unlocked. Reducers do not stack in the source. §1.3 */
export function waitDownPercent(bonuses: readonly GateBonus[]): number {
  let best = 0;
  for (const bonus of bonuses) best = Math.max(best, bonus.waitDownPercent ?? 0);
  return best;
}

/** True once a Break Damage Limit gate combination has been passed. §2.4 */
export function breaksDamageLimit(bonuses: readonly GateBonus[]): boolean {
  return bonuses.some((b) => b.breaksDamageLimit === true);
}

/**
 * Special Dress Up (R1) requires **every node occupied** and **every dressphere
 * on the Grid worn this battle** [ffx2-ids `SpecialDressphereId`, §3.15].
 */
export function canSpecialDressUp(
  grid: GarmentGridDef,
  occupiedDresspheres: readonly string[],
  wornThisBattle: readonly string[],
): boolean {
  if (occupiedDresspheres.length < grid.nodes) return false;
  return occupiedDresspheres.every((id) => wornThisBattle.includes(id));
}
