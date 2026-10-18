/**
 * **A girl's dress changes follow the real Garment Grid** (re-parity RC9 lane X2-I; `FFX2-G09`; **FFX-2 only**), through the real engine.
 *
 * The oracle (`helpers/ffx2GridOracle.ts`) imports no kernel, adapter or layout code of the engine. It reads the 64 cards as numbers (the note's export) and writes the game's rule out by
 * itself: from a dressphere node a girl can go to another dressphere node joined to hers by a link, or through a gate node that touches both, and that gate is crossed. The engine is
 * driven exactly as the game is played: a battle is built from a party, the girl's menu is read, a Change row is submitted.
 *
 * Engine node `i` of a grid is the i-th dressphere node along the lexicographically smallest ring through them that starts at the card's first one (the cards number gate nodes among the
 * dressphere nodes and the game has no "node 0"; the engine counts dressphere nodes only, and the builds place their dresspheres for a ring, so a ring through the real grid keeps every join
 * they were written for), and the menu lists a node's Change rows by ascending destination node: both are conventions of ours, pinned here. The oracle finds the ring by trying every ordering.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, Decision, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine, dressphereStats, garmentGridRegistryFrom } from '../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/index.ts';
import { bevelleParty, enemy, group, member } from '../../src/battle/ffx2/fixtures.ts';
import { gridNodeContents } from '../../src/battle/ffx2/setup.ts';
import { GARMENT_GRIDS, GARMENT_GRID_LAYOUTS } from '../../src/data/ffx2/garment-grids/index.ts';
import { ALL_KEYS, KEYS, cardOf, engineOrderOf, plateTotal, reachFrom } from './helpers/ffx2GridOracle.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Six dresspheres, so that every node of a six-node grid holds one; the girl wears the first. */
const DRESSES = ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress'];
const LEVEL = 24;

function partyOn(gridId: string, nodePosition: number): FFX2PartyBuild {
  const base = bevelleParty(LEVEL);
  const yuna = member('yuna', 'Yuna', DRESSES[0] as string, LEVEL, gridId, [...DRESSES]);
  yuna.garmentGrid.nodePosition = nodePosition;
  return { ...base, members: [yuna, ...base.members.slice(1)] as FFX2PartyBuild['members'] };
}

function newBattle(party: FFX2PartyBuild, seed = 1, extra: Partial<Ffx2EngineOptions> = {}): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...extra }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party, enemies: group('ffx2-dummy', [enemy('dummy', 'Training dummy', 'idle', { hp: 99999, maxHp: 99999 })]), triggers: [], seed, condition: 'scripted', canEscape: false });
  return engine;
}

/** Play every other turn with a plain Attack until Yuna's menu opens, and return it. */
function yunasMenu(engine: FFX2Engine): Input {
  for (let i = 0; i < 4_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') throw new Error(`the battle ended or stalled: ${d.kind}`);
    if (d.actorId === 'yuna') return d;
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
    const target = row?.validTargets[0];
    engine.submit({ ...row!.command, targets: target ? [target] : [] } as Command);
  }
  throw new Error('Yuna never got a menu');
}

interface Change { to: string; toNode: number; gates: string[] }
const changesOf = (d: Input): Change[] =>
  d.commands.flatMap((c) => (c.command.kind === 'spherechange' ? [{ to: c.command.extra.toDressphere, toNode: c.command.extra.toNode, gates: [...(c.command.extra.gatesCrossed ?? [])] }] : []));

const yuna = (engine: FFX2Engine) => (engine.state().combatants['yuna'] as unknown as { dresspheres: { current: string; garmentGrid: { nodePosition: number; passedGates: string[] } }; stats: Record<string, number> });

describe('the Change rows a girl is offered are the game\'s joins, grid by grid and node by node', () => {
  const grids = Object.entries(GARMENT_GRID_LAYOUTS);

  it('there are 44 covered grids to walk (the first lane walked 39; follow-up D1 added the other five)', () => {
    expect(grids).toHaveLength(44);
  });

  for (const [id, layout] of grids) {
    it(`${id} (plate ${layout.plate}): from every node the menu offers exactly the nodes the card joins to it, each with its gate, in ascending node order`, () => {
      const card = cardOf(layout.plate);
      const dress = engineOrderOf(card);
      for (let node = 0; node < dress.length; node++) {
        const party = partyOn(id, node);
        const member0 = party.members[0]!;
        const placed = gridNodeContents(member0, dress.length); // the build's own placement of the six dresses on the grid
        const rows = changesOf(yunasMenu(newBattle(party)));
        const want = reachFrom(card, dress[node] as number)
          .map(({ to, gate }) => ({ rank: dress.indexOf(to), gate }))
          .sort((p, q) => p.rank - q.rank)
          .map(({ rank, gate }) => ({ to: placed[rank] as string, toNode: rank, gates: gate === null ? [] : [layout.colourOfGate[gate - 1] as string] }));
        expect(rows, `${id}, from node ${node}`).toEqual(want);
      }
    });
  }

  it('a grid with direct joins offers more than a ring: First Steps, six nodes and nine joins, offers two from each outer node and four from each inner one where the ring offered two from every node', () => {
    const counts = [0, 1, 2, 3, 4, 5].map((node) => changesOf(yunasMenu(newBattle(partyOn('first-steps', node)))).length);
    expect(counts).toEqual([2, 4, 2, 4, 2, 4]); // the ring order is card nodes 0, 3, 1, 5, 2, 4: the inner nodes 3, 5 and 4 are engine nodes 1, 3 and 5
  });

  it('a hub grid (Vanguard: four corners and a hub) lets a corner reach the hub and its two gate neighbours but not the far corner; the hub reaches all four corners', () => {
    const corner = changesOf(yunasMenu(newBattle(partyOn('vanguard', 0))));
    expect(corner.map((c) => c.toNode)).toEqual([1, 3, 4]); // node 2 is two joins away
    const hub = changesOf(yunasMenu(newBattle(partyOn('vanguard', 4))));
    expect(hub.map((c) => c.toNode)).toEqual([0, 1, 2, 3]);
    expect(hub.every((c) => c.gates.length === 0)).toBe(true); // the hub is joined directly
  });

  it('a grid the data gives no layout keeps the ring it always had: every one of the data\'s 44 grids has a layout now (follow-up D1), so a synthetic four-node grid with two gates stands in for it', () => {
    expect((Object.values(GARMENT_GRIDS) as Array<{ layout?: unknown }>).filter((g) => g.layout === undefined)).toHaveLength(0);
    const synthetic = { id: 'ring-estimate', nodeCount: 4, gateColours: ['red', 'green'] } as const;
    const garmentGrids = garmentGridRegistryFrom([...Object.values(GARMENT_GRIDS), synthetic]);
    const rows = changesOf(yunasMenu(newBattle(partyOn('ring-estimate', 0), 1, { garmentGrids })));
    expect(rows.map((c) => ({ toNode: c.toNode, gates: c.gates }))).toEqual([
      { toNode: 1, gates: ['red'] }, // a ring of four: the next node, through the first gate the estimate puts on the first link
      { toNode: 3, gates: [] }, // and the last node, on a link with no gate
    ]);
  });
});

describe('follow-up D1: the corrected grids pay what the game\'s plate rows pay, through the real engine', () => {
  const base = (dressphere: string): Record<string, number> => dressphereStats(dressphere, LEVEL) as unknown as Record<string, number>;
  const gateNumbersOf = (card: ReturnType<typeof cardOf>): number[] => card.nodes.flatMap(([gate]) => (gate === 0 ? [] : [gate]));

  /** Submit the Change row to engine node `toNode` and return the girl afterwards. */
  function change(engine: FFX2Engine, toNode: number): ReturnType<typeof yuna> {
    const row = yunasMenu(engine).commands.find((c) => c.command.kind === 'spherechange' && c.command.extra.toNode === toNode);
    if (!row) throw new Error(`no Change row to node ${toNode}`);
    engine.submit(row.command as Command);
    return yuna(engine);
  }

  /**
   * Walk the engine nodes in `moves` from node 0 and check after every Change that all six stats are the new dressphere's plus what the plate row pays for the gates crossed so far: the
   * always-on bytes, and the per-gate stat once for each different gate (a gate crossed again adds nothing). The oracle names the gate of each move from the card.
   */
  function walk(gridId: string, moves: readonly number[], expectCrossed: number): void {
    const layout = GARMENT_GRID_LAYOUTS[gridId]!;
    const card = cardOf(layout.plate);
    const order = engineOrderOf(card);
    const engine = newBattle(partyOn(gridId, 0));
    const crossed = new Set<number>(); // a Set keeps the order of first crossing, which is the order the engine records the colours in
    let at = 0;
    for (const to of moves) {
      const step = reachFrom(card, order[at] as number).find((r) => r.to === order[to]);
      if (!step) throw new Error(`${gridId}: node ${at} is not joined to node ${to}`);
      const girl = change(engine, to);
      if (step.gate !== null) crossed.add(step.gate);
      at = to;
      expect(girl.dresspheres.garmentGrid.passedGates, `${gridId}: the gates crossed, in order, by this grid's colours`).toEqual([...crossed].map((k) => layout.colourOfGate[k - 1]));
      const paid = plateTotal(layout.plate, crossed, crossed.size === gateNumbersOf(card).length);
      const sphere = girl.dresspheres.current;
      for (const k of ALL_KEYS) expect(girl.stats[k], `${gridId}: ${k} after reaching node ${at} in ${sphere}`).toBe((base(sphere)[k] as number) + paid[k]);
    }
    expect(crossed.size, `${gridId}: different gates crossed`).toBe(expectCrossed);
  }

  it('Howling Wind: Agility +5 always on and +5 for each different gate crossed, on a ring of four nodes (the data used to say Magic +10 and no gate effect)', () => {
    const start = yuna(newBattle(partyOn('howling-wind', 0)));
    expect(start.stats['agi']).toBe((base(start.dresspheres.current)['agi'] as number) + 5);
    expect(start.stats['mag']).toBe(base(start.dresspheres.current)['mag']); // no Magic bonus any more
    walk('howling-wind', [1, 2, 3, 0, 1], 4); // round the ring: four different gates, then the first again
  });

  it('Ray of Hope: Luck +30 always on and +30 for each different gate crossed; six nodes, two of the six joins direct (no gate), four through a gate', () => {
    const engine = newBattle(partyOn('ray-of-hope', 0));
    const start = yuna(engine);
    expect(start.stats['luck']).toBe((base(start.dresspheres.current)['luck'] as number) + 30);
    expect(changesOf(yunasMenu(engine)).map((c) => c.toNode)).toEqual([1, 5]); // the ring of six: the next node and the last, both direct joins
    walk('ray-of-hope', [1, 2, 3, 4, 5, 0, 1], 4); // the first and the last move are direct joins and cross nothing
  });

  it('Seething Cauldron (Magic) and Strength of One (Strength): +10 always on and +15 for each different gate crossed, on the four nodes of the card (the data had five)', () => {
    walk('seething-cauldron', [1, 2, 3, 0, 1], 4);
    walk('strength-of-one', [1, 2, 3, 0, 1], 4);
  });

  it('White Signet: Magic +15 for each different gate crossed, 60 with all four (the data paid nothing at the gates); the route 0 to 3 to 2 to 1 to 0 crosses the gates 1, 2, 3 and 4 once each', () => {
    walk('white-signet', [3, 2, 1, 0, 3], 4);
  });

  it('Healing Wind: a triangle of three dressphere nodes, one join direct and two through the gates 1 (red) and 4 (blue); the Change rows are the card\'s', () => {
    const card = cardOf(29);
    const order = engineOrderOf(card);
    const layout = GARMENT_GRID_LAYOUTS['healing-wind']!;
    const rows = changesOf(yunasMenu(newBattle(partyOn('healing-wind', 0))));
    const want = reachFrom(card, order[0] as number)
      .map(({ to, gate }) => ({ rank: order.indexOf(to), gate }))
      .sort((p, q) => p.rank - q.rank)
      .map(({ rank, gate }) => ({ toNode: rank, gates: gate === null ? [] : [layout.colourOfGate[gate - 1] as string] }));
    expect(rows.map((c) => ({ toNode: c.toNode, gates: c.gates }))).toEqual(want);
    expect(want).toEqual([{ toNode: 1, gates: ['red'] }, { toNode: 2, gates: [] }]); // card nodes 0, 2, 4: 0 to 2 through the gate 1, 0 to 4 direct
  });
});

describe('a change crosses the gate it passes through, and only that gate; the stats follow the game\'s plate row', () => {
  const gridId = 'vanguard';
  const layout = GARMENT_GRID_LAYOUTS[gridId]!;
  const card = cardOf(layout.plate);
  const dress = engineOrderOf(card);
  const base = (dressphere: string): Record<string, number> => dressphereStats(dressphere, LEVEL) as unknown as Record<string, number>;

  /** Submit the Change row to engine node `toNode` and return the girl afterwards. */
  function change(engine: FFX2Engine, toNode: number): ReturnType<typeof yuna> {
    const menu = yunasMenu(engine);
    const row = menu.commands.find((c) => c.command.kind === 'spherechange' && c.command.extra.toNode === toNode);
    if (!row) throw new Error(`no Change row to node ${toNode}`);
    engine.submit(row.command as Command);
    return yuna(engine);
  }

  it('Vanguard: 0 to 1 passes the gate between them (number 1), 1 to the hub passes none, the hub to 2 passes none, 2 to 3 passes the gate number 4; each adds the plate row\'s stat once', () => {
    const engine = newBattle(partyOn(gridId, 0));
    const crossed = new Set<number>();
    const walk: Array<{ toNode: number; gate: number | null }> = [
      { toNode: 1, gate: 1 },
      { toNode: 4, gate: null },
      { toNode: 2, gate: null },
      { toNode: 3, gate: 4 },
    ];
    let at = 0;
    for (const step of walk) {
      const want = reachFrom(card, dress[at] as number).find((r) => r.to === dress[step.toNode])!;
      expect(want.gate, `the oracle's gate from ${at} to ${step.toNode}`).toBe(step.gate);
      const girl = change(engine, step.toNode);
      if (step.gate !== null) crossed.add(step.gate);
      at = step.toNode;
      expect(girl.dresspheres.garmentGrid.nodePosition, 'where she stands').toBe(at);
      expect(girl.dresspheres.garmentGrid.passedGates, 'the gates crossed so far, by the colour this grid gives them').toEqual([...crossed].sort().map((k) => layout.colourOfGate[k - 1]));
      // her stats: the new dressphere's, plus the equip bytes and every gate crossed, as the plate row pays them
      const paid = plateTotal(layout.plate, crossed, crossed.size === 4);
      const sphere = girl.dresspheres.current;
      for (const k of KEYS) expect(girl.stats[k], `${k} after reaching node ${at} in ${sphere}`).toBe((base(sphere)[k] as number) + paid[k]);
    }
    expect(crossed).toEqual(new Set([1, 4]));
  });

  it('Stonehewn, whose every gate pays the same: each different gate crossed adds +15 once, a gate crossed again adds nothing (the stat is per gate crossed, not per move)', () => {
    const stone = GARMENT_GRID_LAYOUTS['stonehewn']!;
    const sc = cardOf(stone.plate);
    const sd = engineOrderOf(sc);
    const engine = newBattle(partyOn('stonehewn', 0));
    const seen = new Set<number>();
    // go round the ring 0 -> 1 -> 2 -> 3 -> 0 -> 1: five moves, four different gates, the fifth a gate seen before
    let at = 0;
    for (const to of [1, 2, 3, 0, 1]) {
      const want = reachFrom(sc, sd[at] as number).find((r) => r.to === sd[to])!;
      const girl = change(engine, to);
      seen.add(want.gate!);
      at = to;
      const sphere = girl.dresspheres.current;
      expect(girl.stats['def'], `DEF after ${seen.size} different gates`).toBe((base(sphere)['def'] as number) + 10 + 15 * seen.size);
    }
    expect(seen.size).toBe(4);
  });

  it('a Change the grid does not join is refused: nothing moves and the turn is spent (the menu never offers it; this is the engine\'s own guard)', () => {
    const engine = newBattle(partyOn(gridId, 0));
    const menu = yunasMenu(engine);
    expect(changesOf(menu).map((c) => c.toNode)).not.toContain(2); // the far corner is two joins away
    const events: BattleEvent[] = engine.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: DRESSES[2] as string, toNode: 2, gatesCrossed: [] } } as Command);
    const girl = yuna(engine);
    expect(girl.dresspheres.garmentGrid.nodePosition).toBe(0);
    expect(girl.dresspheres.current).toBe(DRESSES[0]);
    expect(girl.dresspheres.garmentGrid.passedGates).toEqual([]);
    expect(events.some((e) => e.type === 'message' && e.text === 'Not linked')).toBe(true);
    expect(events.some((e) => e.type === 'spherechange')).toBe(false);
  });
});
