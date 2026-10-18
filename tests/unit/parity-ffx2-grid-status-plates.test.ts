/**
 * **All ten plates that keep a status, through a real engine** (re-parity RC10 lane XD1b; **FFX-2 only**).
 *
 * The engine's registry holds three of the note's ten grids (plates 9, 15, 50); the other seven (10, 23, 24, 25, 33, 62, 63) are not in `data/ffx2/garment-grids`, and adding one is new
 * content (AGENTS.md hard rule 10). The mechanism is keyed by plate number, so here each of the ten plates is injected as a registry entry built from the game's card (the grids lane's export,
 * `tests/fixtures/parity/ffx2/grid_path.json`) and the plate's colour table, and a girl who wears it is built with every set of its gates crossed. The oracle is the note's table typed in the game's
 * terms and imports nothing from `adapt/`, the layer or the kernels: the plate's pairs (`tests/fixtures/parity/ffx2/grid_status.json`), and what each row keeps (`FFX2-G04` 3.4), as engine statuses.
 *
 * For every plate and every set of crossed gates: the rows she holds are the oracle's, in order (gate rows, then the always-on ones); at full HP exactly the kept statuses are on and nothing is announced;
 * after a blow that leaves her under a third the SOS statuses are on as well (and their `status-add` events say so); the pools are doubled exactly when a Double row is held.
 */

import { describe, expect, it } from 'vitest';
import type { Command, GateColour, StatusId } from '../../src/battle/common/types.ts';
import { garmentGridRegistryFrom } from '../../src/battle/ffx2/index.ts';
import { withPoolStatuses } from '../../src/battle/ffx2/kit.ts';
import { GARMENT_GRIDS } from '../../src/data/ffx2/garment-grids/index.ts';
import fixture from '../fixtures/parity/ffx2/grid_status.json';
import { BIG, PLAIN_BLOW, THIRD, board, type Loadout } from './helpers/ffx2AutoRig.ts';
import { cardOf } from './helpers/ffx2GridOracle.ts';

const PAIRS = fixture.pairs as unknown as Record<string, Array<[number, number]>>;
const COMMON: GateColour[] = ['red', 'green', 'yellow', 'blue'];

/** FFX2-G04 3.4: what each row keeps, as engine statuses; `sos` rows are in the SOS set. Typed by hand from the note's table. */
const KEEPS: Record<number, { sos: boolean; statuses: StatusId[] }> = {
  0x8069: { sos: false, statuses: ['slow'] },
  0x806a: { sos: false, statuses: ['shell'] },
  0x806b: { sos: false, statuses: ['protect'] },
  0x806c: { sos: false, statuses: ['shell', 'protect'] },
  0x806d: { sos: false, statuses: ['reflect'] },
  0x806e: { sos: false, statuses: ['regen'] },
  0x806f: { sos: false, statuses: ['haste'] },
  0x8070: { sos: false, statuses: ['guaranteed-critical'] },
  0x8071: { sos: false, statuses: ['spellspring'] },
  0x8074: { sos: true, statuses: ['shell'] },
  0x8075: { sos: true, statuses: ['protect'] },
  0x8076: { sos: true, statuses: ['reflect'] },
  0x8077: { sos: true, statuses: ['regen'] },
  0x8078: { sos: true, statuses: ['haste'] },
  0x8079: { sos: true, statuses: ['spellspring'] },
  0x807a: { sos: true, statuses: ['berserk', 'damage-9999', 'slow'] },
  0x807b: { sos: true, statuses: ['guaranteed-critical'] },
  0x809b: { sos: true, statuses: ['shell', 'protect'] },
  0x8095: { sos: false, statuses: ['poison', 'berserk'] },
  0x8096: { sos: false, statuses: ['poison', 'haste'] },
  0x8098: { sos: false, statuses: ['max-hp-x2'] },
  0x8099: { sos: false, statuses: ['max-mp-x2'] },
  0x809c: { sos: false, statuses: ['pointless'] },
};

const TEN = [9, 10, 15, 23, 24, 25, 33, 50, 62, 63];
const WATCHED: StatusId[] = ['slow', 'shell', 'protect', 'reflect', 'regen', 'haste', 'guaranteed-critical', 'spellspring', 'berserk', 'damage-9999', 'poison', 'pointless', 'max-hp-x2', 'max-mp-x2'];

/** The oracle: rows listed for a plate with the gate numbers `crossed`: gate rows in plate order, then the always-on ones; only rows the note says keep a status. */
function rowsOf(plate: number, crossed: ReadonlySet<number>): number[] {
  const all = card(plate).gates.every((k) => crossed.has(k));
  const has = (k: number): boolean => crossed.has(k);
  const gate: number[] = [];
  const always: number[] = [];
  for (const [cond, id] of PAIRS[plate] as Array<[number, number]>) {
    if (KEEPS[id] === undefined) continue;
    if (cond === 0) always.push(id);
    else if ((cond >= 1 && cond <= 4 && has(cond)) || (cond === 5 && has(1) && has(2)) || (cond === 6 && has(3) && has(4)) || (cond === 100 && all)) gate.push(id);
  }
  return [...gate, ...always];
}

/** Statuses the rows keep (kept always, SOS only when `low`), with Haste clearing Slow as the game's status recompute does. */
function statusesOf(rows: readonly number[], low: boolean): StatusId[] {
  const on = new Set<StatusId>();
  for (const id of rows) {
    const k = KEEPS[id] as { sos: boolean; statuses: StatusId[] };
    if (!k.sos || low) for (const s of k.statuses) on.add(s);
  }
  if (on.has('haste')) on.delete('slow');
  return WATCHED.filter((s) => on.has(s));
}

function card(plate: number): { nodes: ReturnType<typeof cardOf>['nodes']; links: ReturnType<typeof cardOf>['links']; gates: number[] } {
  const c = cardOf(plate);
  return { nodes: c.nodes, links: c.links, gates: [...new Set(c.nodes.map(([g]) => g).filter((g) => g > 0))].sort() };
}

/** A registry with every real grid and one entry per plate under test, built from the card. */
function registry(): ReturnType<typeof garmentGridRegistryFrom> {
  const extra = TEN.map((plate) => {
    const c = card(plate);
    return {
      id: `plate-${plate}`,
      nodeCount: c.nodes.filter(([g]) => g === 0).length,
      gateColours: c.gates.map((k) => COMMON[k - 1] as GateColour),
      gateEffects: [],
      layout: { plate, colourOfGate: [1, 2, 3, 4].map((k) => (c.gates.includes(k) ? (COMMON[k - 1] as GateColour) : null)), nodes: c.nodes, links: c.links },
    };
  });
  return garmentGridRegistryFrom([...Object.values(GARMENT_GRIDS), ...extra]);
}

const subsets = (ks: readonly number[]): number[][] => Array.from({ length: 1 << ks.length }, (_, m) => ks.filter((_, i) => (m >> i) & 1));
const loadout = (plate: number, crossed: readonly number[]): Loadout => ({ name: `plate ${plate}`, kept: [], sos: [], word0: 0, grid: { id: `plate-${plate}`, passed: crossed.map((k) => COMMON[k - 1] as GateColour) } });
const watched = (statuses: Record<string, unknown>): StatusId[] => WATCHED.filter((s) => statuses[s] !== undefined);

describe('every plate that keeps a status, every set of crossed gates, on a real engine', () => {
  const garmentGrids = registry();

  it('the ten plates and their gate sets are 86 cases (16 + 16 + 8 + 2 + 2 + 2 + 4 + 4 + 16 + 16)', () => {
    expect(TEN.reduce((n, p) => n + (1 << card(p).gates.length), 0)).toBe(86);
  });

  for (const plate of TEN) {
    it(`plate ${plate}: the rows held, the kept statuses at the start, the SOS statuses under a third, and the doubled pools are the oracle's for every set of gates`, () => {
      const base = board({ yuna: loadout(plate, []) }, 1, { garmentGrids }).unit('yuna');
      for (const crossed of subsets(card(plate).gates)) {
        const rows = rowsOf(plate, new Set(crossed));
        const e = board({ yuna: loadout(plate, crossed) }, 1, { garmentGrids });
        const yuna = e.unit('yuna');
        const label = `plate ${plate}, gates ${crossed.join(',') || 'none'}`;
        expect(yuna.autoLayer?.rows ?? [], label).toEqual(rows);
        if (rows.length === 0) {
          expect(yuna.autoLayer, label).toBeUndefined();
          continue;
        }
        // at full HP: the kept statuses, nothing announced
        expect(watched(yuna.statuses), `${label} at full HP`).toEqual(statusesOf(rows, false));
        expect(e.state().log.filter((x) => x.type === 'status-add' || x.type === 'status-remove'), label).toEqual([]);
        // the pools
        const hp = rows.some((id) => KEEPS[id]?.statuses.includes('max-hp-x2'));
        const mp = rows.some((id) => KEEPS[id]?.statuses.includes('max-mp-x2'));
        expect(yuna.stats.maxHp, `${label} max HP`).toBe(hp ? Math.min(base.stats.maxHp * 2, Math.max(base.stats.maxHp, 9999)) : base.stats.maxHp);
        expect(yuna.stats.maxMp, `${label} max MP`).toBe(mp ? Math.min(base.stats.maxMp * 2, Math.max(base.stats.maxMp, 999)) : base.stats.maxMp);
        // under a third: the SOS statuses come on too
        yuna.stats.maxHp = BIG;
        yuna.hp = THIRD - 1000;
        const events = e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
        expect(yuna.alive, label).toBe(true);
        expect(watched(yuna.statuses), `${label} under a third`).toEqual(statusesOf(rows, true));
        const sosOn = statusesOf(rows, true).filter((s) => !statusesOf(rows, false).includes(s));
        const announced = events.filter((x) => x.type === 'status-add' && (x as { targetId?: string }).targetId === 'yuna').map((x) => (x as unknown as { status: StatusId }).status);
        expect([...announced].sort(), `${label} announced`).toEqual([...sosOn].sort());
      }
    });
  }
});

describe("the doubled pools follow the game's maximum recompute (clamp(2 * base, 0, cap), caps 9,999 and 999)", () => {
  const stats = (maxHp: number, maxMp: number): never => ({ str: 1, def: 1, mag: 1, mdef: 1, agi: 1, acc: 1, eva: 1, luck: 1, hp: maxHp, maxHp, mp: maxMp, maxMp }) as never;
  const pools = (maxHp: number, maxMp: number, held: { hp: boolean; mp: boolean }): [number, number] => {
    const out = withPoolStatuses(stats(maxHp, maxMp), undefined, held) as unknown as { maxHp: number; maxMp: number };
    return [out.maxHp, out.maxMp];
  };

  it('under the caps the maximum doubles; over a cap it stops at the cap; a base already past the cap is kept (the engine never capped a Crystal Bangle)', () => {
    expect(pools(3000, 300, { hp: true, mp: true })).toEqual([6000, 600]);
    expect(pools(6000, 600, { hp: true, mp: true })).toEqual([9999, 999]);
    expect(pools(5000, 500, { hp: true, mp: true })).toEqual([9999, 999]);
    expect(pools(12000, 1200, { hp: true, mp: true })).toEqual([12000, 1200]);
  });

  it('each pool doubles on its own bit, and with neither held the block is the same object', () => {
    expect(pools(3000, 300, { hp: true, mp: false })).toEqual([6000, 300]);
    expect(pools(3000, 300, { hp: false, mp: true })).toEqual([3000, 600]);
    const same = stats(3000, 300);
    expect(withPoolStatuses(same, undefined, { hp: false, mp: false })).toBe(same);
    expect(withPoolStatuses(same, undefined)).toBe(same);
  });

  it('a Stamina Tonic and the grid together double once (one bit)', () => {
    const tonic = { 'max-hp-x2': { sourceAbilityId: 'x2-item-stamina-tonic' } };
    const out = withPoolStatuses(stats(3000, 300), tonic, { hp: true, mp: false }) as unknown as { maxHp: number };
    expect(out.maxHp).toBe(6000);
  });
});
