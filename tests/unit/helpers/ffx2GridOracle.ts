/**
 * The independent oracle of the Garment Grid layout tests (re-parity RC9 lane X2-I; FFX-2 only).
 *
 * It imports no grid, layout or adapter code of the engine. It reads the game's plate rows and auto-ability rows (`plateRow`, `abilityRow`: numbers read from
 * `plate.bin` and `a_ability.bin`) and the 64 cards as numbers (`tests/fixtures/parity/ffx2/grid_path.json`, the note's export), and counts by itself.
 */

import { plateRow } from '../../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { abilityRow } from '../../../src/battle/ffx2/kernel/dressphere-rows.ts';
import { kernelCheck } from './ffx2AtbAdapters.ts';

export type Stats = { str: number; def: number; mag: number; mdef: number; agi: number; luck: number };
/** The four stats most grids pay (the lane's first version proved only these). */
export const KEYS = ['str', 'def', 'mag', 'mdef'] as const;
/** The six stats the data can carry for a grid: the four above and Agility (Howling Wind) and Luck (Ray of Hope); follow-up D1. The plate rows' other bytes (HP %, MP %, Accuracy, Evasion) are zero on all 64 rows. */
export const ALL_KEYS = ['str', 'def', 'mag', 'mdef', 'agi', 'luck'] as const;
/** Where those stats sit in an `up_status` array: HP %, MP %, then STR, DEF, MAG, MDEF, AGI, ACC, EVA, LUCK. */
export const UP_AT: Record<(typeof ALL_KEYS)[number], number> = { str: 2, def: 3, mag: 4, mdef: 5, agi: 6, luck: 9 };

/** One card as the fixture holds it: `nodes[i] = [gate, x, y]`, `links[k] = [a, b]`. */
export interface Card {
  nodes: ReadonlyArray<readonly [number, number, number]>;
  links: ReadonlyArray<readonly [number, number]>;
}

const fx = kernelCheck('grid_path');
const cards = (fx as unknown as { layouts?: Record<string, Card> } | null)?.layouts ?? {};

/** The card of a plate (the game's data as numbers). */
export function cardOf(plate: number): Card {
  const card = cards[String(plate)];
  if (!card) throw new Error(`no card for plate ${plate}: is tests/fixtures/parity/ffx2/grid_path.json present?`);
  return card;
}

/** What the game's plate row pays when the gates in `crossed` have been crossed: the always-on bytes, plus every gate pair whose condition holds. */
export function plateTotal(plate: number, crossed: ReadonlySet<number>, all: boolean): Stats {
  const row = plateRow(0x6000 + plate);
  const total: Stats = { str: row.up[2], def: row.up[3], mag: row.up[4], mdef: row.up[5], agi: row.up[6], luck: row.up[9] };
  const has = (k: number): boolean => crossed.has(k);
  for (const [cond, ability] of row.abilities) {
    let ok = cond === 0; // always on: the equip effect
    if (cond >= 1 && cond <= 4) ok = has(cond);
    else if (cond === 5) ok = has(1) && has(2);
    else if (cond === 6) ok = has(3) && has(4);
    else if (cond === 7) ok = has(1) && has(2) && has(3);
    else if (cond === 100) ok = all;
    if (!ok || ability >> 12 !== 8) continue; // only an auto-ability row carries stat bytes (the others are commands)
    const up = abilityRow(ability).up;
    for (const k of ALL_KEYS) total[k] += up[UP_AT[k]] ?? 0;
  }
  return total;
}

/** Every subset of `ks`, in bit order. */
export function subsets(ks: readonly number[]): number[][] {
  const out: number[][] = [];
  for (let m = 0; m < 1 << ks.length; m++) out.push(ks.filter((_, i) => (m >> i) & 1));
  return out;
}

/** The dressphere nodes of a card, in the card's order. */
export function cardDressIds(card: Card): number[] {
  return card.nodes.flatMap(([gate], i) => (gate === 0 ? [i] : []));
}

/**
 * Where a girl standing on card node `from` can go, by the game's rule written out here: a dressphere node joined to hers by a link, or two links through a gate node
 * (a node with a gate number) that touches both; `gate` is that gate's number, `null` for a direct join. Ascending by destination node.
 */
export function reachFrom(card: Card, from: number): Array<{ to: number; gate: number | null }> {
  const near = (n: number): number[] => card.links.filter(([a, b]) => a === n || b === n).map(([a, b]) => (a === n ? b : a));
  const gateOf = (n: number): number => card.nodes[n]?.[0] ?? 0;
  const out: Array<{ to: number; gate: number | null }> = [];
  for (const to of cardDressIds(card)) {
    if (to === from) continue;
    if (near(from).includes(to)) {
      out.push({ to, gate: null });
      continue;
    }
    const via = near(from).find((n) => gateOf(n) !== 0 && near(to).includes(n));
    if (via !== undefined) out.push({ to, gate: gateOf(via) });
  }
  return out;
}

/**
 * The order the engine numbers a card's dressphere nodes in, written out independently by trying every ordering: the dressphere nodes in the order of the lexicographically smallest ring that
 * starts at the card's first dressphere node (every node joined to the next by a move, the last to the first); a card of one or two dressphere nodes, or with no such ring, in the card's order.
 */
export function engineOrderOf(card: Card): number[] {
  const dress = cardDressIds(card);
  if (dress.length <= 2) return dress;
  const joined = (a: number, b: number): boolean => reachFrom(card, a).some((r) => r.to === b);
  const rest = dress.slice(1);
  let found: number[] | null = null;
  const permute = (left: number[], chosen: number[]): void => {
    if (found) return;
    if (left.length === 0) {
      const ring = [dress[0] as number, ...chosen];
      if (ring.every((n, i) => joined(n, ring[(i + 1) % ring.length] as number))) found = ring;
      return;
    }
    for (const n of left) permute(left.filter((x) => x !== n), [...chosen, n]); // ascending: the first complete ring is the lexicographically smallest
  };
  permute(rest, []);
  return found ?? dress;
}
