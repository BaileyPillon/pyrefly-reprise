/**
 * Parity tests for the FFX-2 Garment Grid layout rules (`src/battle/ffx2/kernel/grid-path.ts`; re-parity RC9 lane X2-I; `FFX2-G09`).
 *
 * **Game case: FFX-2 only** (FFX has no garment grids).  Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69): the gate number 0x005eb2a0,
 * the all-worn test 0x005eb920, the gate state 0x005eb7d0, the path finder 0x005eb080, the commit of a move 0x005f51a0 and the gate evaluation 0x005f4170, all run
 * as the real machine code in the emulator harness on the 64 real grid cards (note `FFX2-G09`: 690 + 10,724 + 4,056 + 4,173 vectors, 0 mismatches against an
 * independent model).  `tests/fixtures/parity/ffx2/grid_path.json` holds a stratified subset of those vectors (the game's own answers) and the 64 cards as numbers.
 *
 * The walk vectors compose the pieces the way the game does: the commit marks the route, the gate state is read off the visited nodes, and the existing
 * `kernel/spherechange.ts#gateSlotsAfter` (proven on its own in `parity-ffx2-spherechange.test.ts`) turns the gates into the girl's eight gate-ability slots.
 */

import { describe, expect, it } from 'vitest';
import {
  allDressNodesVisited,
  commitMove,
  dressNodes,
  findPath,
  gateNumber,
  gateState,
  movePairs,
  moveRecord,
  ringOrder,
  type Ffx2GridLayout,
  type Ffx2MoveRecord,
} from '../../src/battle/ffx2/kernel/grid-path.ts';
import { gateSlotsAfter } from '../../src/battle/ffx2/kernel/spherechange.ts';
import { GARMENT_GRID_LAYOUTS } from '../../src/data/ffx2/garment-grids/index.ts';
import { arr, inOf, kernelCheck, num, outOf, sub, vectorsOf } from './helpers/ffx2AtbAdapters.ts';
import { cardOf, engineOrderOf } from './helpers/ffx2GridOracle.ts';

const fx = kernelCheck('grid_path');
const cards = (fx as unknown as { layouts?: Record<string, Ffx2GridLayout> } | null)?.layouts ?? {};
const layoutOf = (plate: number): Ffx2GridLayout => {
  const l = cards[String(plate)];
  if (!l) throw new Error(`no card for plate ${plate}`);
  return l;
};

describe('the fixture (the 64 cards and the game\'s own answers)', () => {
  it('is present and holds all 64 cards and every class of vector', () => {
    expect(fx).not.toBeNull();
    expect(Object.keys(cards)).toHaveLength(64);
    for (const cls of ['gate_number', 'gate_state', 'path', 'walk']) expect(vectorsOf(fx!, cls).length, cls).toBeGreaterThan(500);
  });

  it('every card is well formed: link ids are 0 to L-1 and each joins two different nodes, at most 10 nodes and 13 links, no node touches itself twice', () => {
    let maxNodes = 0;
    let maxLinks = 0;
    for (let p = 0; p < 64; p++) {
      const l = layoutOf(p);
      maxNodes = Math.max(maxNodes, l.nodes.length);
      maxLinks = Math.max(maxLinks, l.links.length);
      const pairs = new Set<string>();
      for (const [a, b] of l.links) {
        expect(a, `plate ${p}`).not.toBe(b);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(l.nodes.length);
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        expect(pairs.has(key), `plate ${p}: ${key} joined twice`).toBe(false);
        pairs.add(key);
      }
    }
    // the visited and crossed masks are plain numbers: bit k for node or link k, so 31 would be the limit
    expect(maxNodes).toBe(10);
    expect(maxLinks).toBe(13);
  });

  it('a gate is a node of its own: exactly two neighbours, both dressphere nodes; no gate touches another; each gate number 1 to 4 appears at most once on a grid', () => {
    let gates = 0;
    for (let p = 0; p < 64; p++) {
      const l = layoutOf(p);
      const seen = new Set<number>();
      l.nodes.forEach(([gate], i) => {
        if (gate === 0) return;
        gates += 1;
        expect(gate, `plate ${p} node ${i}`).toBeGreaterThanOrEqual(1);
        expect(gate).toBeLessThanOrEqual(4);
        expect(seen.has(gate), `plate ${p}: gate ${gate} twice`).toBe(false);
        seen.add(gate);
        const next = l.links.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a));
        expect(next, `plate ${p} gate node ${i}`).toHaveLength(2);
        for (const n of next) expect(gateNumber(l, n), `plate ${p}: gate ${i} touches gate ${n}`).toBe(0);
      });
    }
    expect(gates).toBe(206); // FFX2-G09 summary 2: 206 gate nodes over the 64 grids
  });

  it('no pair of dressphere nodes has two routes (a direct link and a gate, or two gates), so the order of a node\'s neighbour slots never decides an answer (FFX2-G09: 0 ambiguous routes)', () => {
    for (let p = 0; p < 64; p++) {
      const l = layoutOf(p);
      const next = (n: number): number[] => l.links.filter(([a, b]) => a === n || b === n).map(([a, b]) => (a === n ? b : a));
      const dress = dressNodes(l);
      for (const a of dress) {
        for (const b of dress) {
          if (a === b) continue;
          const direct = next(a).filter((n) => n === b).length;
          const gates = next(a).filter((n) => gateNumber(l, n) !== 0 && next(b).includes(n)).length;
          expect(direct + gates, `plate ${p}: ${a} to ${b}`).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe('gate number, gate state and every-node-worn (exe 0x005eb2a0, 0x005eb7d0, 0x005eb920)', () => {
  it('the gate number of every node of every card, and 0 for a node the grid does not have: all vectors agree', () => {
    const vs = vectorsOf(fx!, 'gate_number');
    let bad = 0;
    for (const v of vs) {
      const got = gateNumber(layoutOf(num(inOf(v), 'plate')), num(inOf(v), 'node'));
      if (got !== num(outOf(v), 'gate')) bad += 1;
    }
    expect(vs.length).toBe(690);
    expect(bad).toBe(0);
  });

  it('gate k crossed = the gate node numbered k is visited; every gate node visited; every dressphere node visited; bits past the grid\'s nodes are ignored: all vectors agree', () => {
    const vs = vectorsOf(fx!, 'gate_state');
    let bad = 0;
    let withJunk = 0;
    for (const v of vs) {
      const l = layoutOf(num(inOf(v), 'plate'));
      const visited = num(inOf(v), 'visited');
      const s = gateState(l, visited);
      const flags = arr(outOf(v), 'gates').map((x) => x === 1);
      if (visited >>> l.nodes.length !== 0) withJunk += 1;
      if (JSON.stringify(s.gates) !== JSON.stringify(flags) || s.allGates !== (num(outOf(v), 'allGates') === 1) || allDressNodesVisited(l, visited) !== (num(outOf(v), 'allWorn') === 1)) bad += 1;
    }
    expect(bad).toBe(0);
    expect(withJunk).toBeGreaterThan(50); // the stratified subset keeps masks with bits above the last node
  });

  it('a grid with no gate has every gate "crossed" (nothing is missing) and a bare mask has none', () => {
    const first = layoutOf(0); // First Steps: six dressphere nodes, no gates
    expect(gateState(first, 0)).toEqual({ gates: [false, false, false, false], allGates: true });
    const hub = layoutOf(1); // five dressphere nodes and four gates
    expect(gateState(hub, 0).allGates).toBe(false);
    expect(allDressNodesVisited(hub, 0)).toBe(false);
    expect(allDressNodesVisited(hub, 0b100001111)).toBe(true); // the dressphere nodes are 0 to 3 and 8
  });
});

describe('the path finder (exe 0x005eb080)', () => {
  it('every vector agrees: the result kind, the three nodes of the path and the two links, for dressphere pairs, a node to itself and a gate at either end', () => {
    const vs = vectorsOf(fx!, 'path');
    const kinds = [0, 0, 0];
    let bad = 0;
    for (const v of vs) {
      const p = findPath(layoutOf(num(inOf(v), 'plate')), num(inOf(v), 'from'), num(inOf(v), 'to'));
      kinds[p.kind] = (kinds[p.kind] ?? 0) + 1;
      if (p.kind !== num(outOf(v), 'ret') || JSON.stringify(p.path) !== JSON.stringify(arr(outOf(v), 'path')) || JSON.stringify(p.links) !== JSON.stringify(arr(outOf(v), 'links'))) bad += 1;
    }
    expect(bad).toBe(0);
    // the subset reaches all three answers
    for (const k of kinds) expect(k).toBeGreaterThan(100);
  });

  it('on all 64 cards a move between two dressphere nodes is either direct or through exactly one gate, never both, and the same both ways (FFX2-G09 3.2: 192 direct and 206 through-a-gate pairs)', () => {
    let direct = 0;
    let viaGate = 0;
    for (let p = 0; p < 64; p++) {
      const l = layoutOf(p);
      const dress = dressNodes(l);
      for (const a of dress) {
        for (const b of dress) {
          if (a === b) continue;
          const ab = findPath(l, a, b);
          const ba = findPath(l, b, a);
          expect(ab.kind, `plate ${p} ${a}->${b}`).toBe(ba.kind);
          if (ab.kind === 2) expect(ab.path[1], `plate ${p} ${a}-${b}`).toBe(ba.path[1]);
          if (a < b && ab.kind === 1) direct += 1;
          if (a < b && ab.kind === 2) viaGate += 1;
        }
      }
    }
    expect(direct).toBe(192);
    expect(viaGate).toBe(206);
  });

  it('a node to itself answers "through a gate" when it has a gate neighbour and nothing otherwise; the pair list leaves such pairs out (the grid scene never offers the current node)', () => {
    const hub = layoutOf(1);
    expect(findPath(hub, 0, 0).kind).toBe(2); // node 0 touches gate nodes 6 and 7
    expect(findPath(layoutOf(0), 0, 0)).toEqual({ kind: 0, path: [0, -1, -1], links: [-1, -1] });
    expect(movePairs(hub).every(({ a, b }) => a < b)).toBe(true);
  });

  it('a route is never longer than one gate: two dressphere nodes joined only through two gates are not joined (plate 9: the four-node four-gate ring)', () => {
    const ring = layoutOf(9);
    const reach = movePairs(ring).map(({ a, b }) => `${a}-${b}`);
    expect(reach).toEqual(['0-1', '0-3', '1-2', '2-3']); // the diagonals 0-2 and 1-3 are not joined
    expect(findPath(ring, 0, 2).kind).toBe(0);
  });

  it('a hub grid joins the hub to the four corners directly and the corners to each other through a gate (plate 1, node ids as the card has them)', () => {
    const hub = layoutOf(1);
    expect(dressNodes(hub)).toEqual([0, 1, 2, 3, 8]);
    expect(movePairs(hub)).toEqual([
      { a: 0, b: 1, gateNode: 7 },
      { a: 0, b: 3, gateNode: 6 },
      { a: 0, b: 8, gateNode: null },
      { a: 1, b: 2, gateNode: 5 },
      { a: 1, b: 8, gateNode: null },
      { a: 2, b: 3, gateNode: 4 },
      { a: 2, b: 8, gateNode: null },
      { a: 3, b: 8, gateNode: null },
    ]);
  });
});

describe('the commit of a move (exe 0x005f51a0) and the gate abilities it re-evaluates (0x005f4170)', () => {
  const asRecord = (r: number[]): Ffx2MoveRecord => r as unknown as Ffx2MoveRecord;

  it('every walk step agrees with the game: where she stands, the visited nodes, the crossed links, the count of gate abilities and the eight slots (stale ones kept)', () => {
    const vs = vectorsOf(fx!, 'walk');
    const modes = [0, 0, 0];
    let bad = 0;
    const firstBad: string[] = [];
    for (const v of vs) {
      const plate = num(inOf(v), 'plate');
      const l = layoutOf(plate);
      const rec = asRecord(arr(inOf(v), 'rec'));
      const b = sub(inOf(v), 'before');
      modes[rec[0]] = (modes[rec[0]] ?? 0) + 1;
      const w = commitMove({ cur: num(b, 'cur'), visited: num(b, 'visited'), crossed: num(b, 'crossed') }, rec);
      let cnt = num(b, 'cnt');
      let slots = arr(b, 'slots');
      if (rec[0] === 0) {
        const g = gateState(l, w.visited);
        const r = gateSlotsAfter(slots, 0x6000 + plate, { gates: g.gates, allGates: g.allGates, allJobs: allDressNodesVisited(l, w.visited) });
        cnt = r.count;
        slots = r.slots;
      } else if (rec[0] === 1) {
        cnt = 0;
        slots = new Array<number>(8).fill(255); // entering a Special empties her eight gate slots
      }
      const o = outOf(v);
      const same = w.cur === num(o, 'cur') && w.visited === num(o, 'visited') && w.crossed === num(o, 'crossed') && cnt === num(o, 'cnt') && JSON.stringify(slots) === JSON.stringify(arr(o, 'slots'));
      if (!same) {
        bad += 1;
        if (firstBad.length < 3) firstBad.push(JSON.stringify({ id: v.id, got: { w, cnt, slots }, want: o }));
      }
    }
    expect(firstBad).toEqual([]);
    expect(bad).toBe(0);
    for (const m of modes) expect(m).toBeGreaterThan(100); // an ordinary move, entering a Special, leaving one
  });

  it('a move along a path marks the destination and the gate it crossed as visited and both links as crossed; the girl\'s first node counts as worn when the grid opens (the scene marks it)', () => {
    const hub = layoutOf(1);
    const p = findPath(hub, 0, 1); // node 0 to node 1 through gate node 7
    expect(p).toEqual({ kind: 2, path: [0, 7, 1], links: [7, 6] });
    const rec = moveRecord(p, 0x5001);
    expect(rec).toEqual([0, 0x5001, 1, 7, 6, 0, 7, 1]);
    const after = commitMove({ cur: 0, visited: 1 << 0, crossed: 0 }, rec);
    expect(after).toEqual({ cur: 1, visited: (1 << 0) | (1 << 7) | (1 << 1), crossed: (1 << 7) | (1 << 6) });
    expect(gateState(hub, after.visited)).toEqual({ gates: [true, false, false, false], allGates: false }); // gate 1 was the node 7
  });

  it('a direct move crosses no gate; entering a Special wipes the walk and does not move her; leaving one does nothing', () => {
    const hub = layoutOf(1);
    const direct = moveRecord(findPath(hub, 0, 8), 0x5002);
    const after = commitMove({ cur: 0, visited: 1, crossed: 0 }, direct);
    expect(after).toEqual({ cur: 8, visited: (1 << 0) | (1 << 8), crossed: 1 << 10 });
    expect(gateState(hub, after.visited).gates).toEqual([false, false, false, false]);
    const entered = commitMove(after, [1, 0x500f, 8, 0, 0, 0, 0, 0]);
    expect(entered).toEqual({ cur: 8, visited: 0, crossed: 0 });
    expect(commitMove(entered, [2, 0x5001, 8, 0, 0, 0, 0, 0])).toEqual(entered);
  });

  it('entering a Special leaves her where she stands even when the record names another node (the game\'s record carries her own node; the commit never moves her: FFX2-G09 3.4)', () => {
    expect(commitMove({ cur: 3, visited: 0b1111, crossed: 0b11 }, [1, 0x500f, 8, 0, 0, 0, 0, 0])).toEqual({ cur: 3, visited: 0, crossed: 0 });
  });
});

describe('the shipped layouts (src/data/ffx2/garment-grids/layouts.ts) are the cards', () => {
  const entries = Object.entries(GARMENT_GRID_LAYOUTS);

  it('covers 39 grids, one plate each, and every one equals the card of its plate: the same nodes, positions and links', () => {
    expect(entries).toHaveLength(39);
    const plates = new Set<number>();
    for (const [id, layout] of entries) {
      expect(plates.has(layout.plate), `${id}: plate ${layout.plate} used twice`).toBe(false);
      plates.add(layout.plate);
      const card = layoutOf(layout.plate);
      expect(layout.nodes.map((n) => [...n]), id).toEqual(card.nodes.map((n) => [...n]));
      expect(layout.links.map((l) => [...l]), id).toEqual(card.links.map((l) => [...l]));
    }
  });
});

describe('the order the engine numbers a grid\'s dressphere nodes in: along a ring (ringOrder; our numbering, not the game\'s)', () => {
  it('the kernel finds the same ring an exhaustive search does on all 64 cards (the lowest one, starting at the first dressphere node; the card order where there is none)', () => {
    for (let p = 0; p < 64; p++) {
      const l = layoutOf(p);
      const order = ringOrder(l);
      expect(order, `plate ${p}`).toEqual(engineOrderOf(cardOf(p)));
      expect([...order].sort((a, b) => a - b), `plate ${p}: a permutation of the dressphere nodes`).toEqual(dressNodes(l));
      expect(order[0], `plate ${p}: starts at the card's first dressphere node`).toBe(dressNodes(l)[0]);
    }
  });

  it('in the order, every node is joined to the next by a move and the last to the first, so every join of the old ring is still there (the real grid has more, never fewer): 62 cards, every grid our data covers among them; plates 33 and 63 have no ring', () => {
    const noRing: number[] = [];
    for (let p = 0; p < 64; p++) {
      const l = layoutOf(p);
      const order = ringOrder(l);
      if (order.length >= 3 && !order.every((node, i) => findPath(l, node, order[(i + 1) % order.length] as number).kind !== 0)) {
        noRing.push(p);
        continue;
      }
      if (order.length < 3) {
        expect(findPath(l, order[0] as number, order[1] as number).kind, `plate ${p}: the one link`).not.toBe(0);
        continue;
      }
      order.forEach((node, i) => {
        const to = order[(i + 1) % order.length] as number;
        expect(findPath(l, node, to).kind, `plate ${p}: ${node} to ${to}`).not.toBe(0);
        expect(findPath(l, to, node).kind, `plate ${p}: ${to} to ${node}`).not.toBe(0);
      });
    }
    expect(noRing).toEqual([33, 63]);
    for (const layout of Object.values(GARMENT_GRID_LAYOUTS)) expect(noRing, `plate ${layout.plate}`).not.toContain(layout.plate);
  });

  it('the shipped builds\' grids come out as these: the cards\' own order where the card lays its nodes round a ring, and these where it does not', () => {
    expect(ringOrder(layoutOf(1))).toEqual([0, 1, 2, 3, 8]); // Vanguard and its family: four corners round and the hub last
    expect(ringOrder(layoutOf(5))).toEqual([0, 2, 4, 6, 8]); // Protection Halo
    expect(ringOrder(layoutOf(36))).toEqual([1, 3, 5, 7]); // Stonehewn: four nodes round, four gates
    expect(ringOrder(layoutOf(0))).toEqual([0, 3, 1, 5, 2, 4]); // First Steps: six nodes, nine joins
    expect(ringOrder(layoutOf(50))).toEqual([1, 3, 2, 4, 5]); // Tempered Will
    expect(ringOrder(layoutOf(40))).toEqual([0, 1, 6, 7, 4, 5]); // Pride of the Sword
  });

  it('a grid with no ring keeps the card\'s order (a synthetic line of four, which no card is), and a grid of two nodes is the card\'s two', () => {
    const line: Ffx2GridLayout = { nodes: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]], links: [[0, 1], [1, 2], [2, 3]] };
    expect(ringOrder(line)).toEqual([0, 1, 2, 3]);
    expect(ringOrder(layoutOf(56))).toEqual([0, 1]);
  });
});
