/**
 * A real walk across a Garment Grid, for `parity-ffx2-grid-status-engine.test.ts` (re-parity RC10 lane XD1b; **FFX-2 only**): a Wait-mode battle against an idle dummy in which Yuna wears
 * a grid, the menu her Change rows come from, and a planner that walks her along the shortest route that crosses the gates asked for. The route is planned on the card as numbers
 * (`helpers/ffx2GridOracle.ts`: the oracle reads the game's cards and imports no grid, layout or adapter code of the engine), and each step is taken through the menu the engine offers.
 */

import type { Command, Decision, FFX2PartyBuild, GateColour } from '../../../src/battle/common/types.ts';
import { bevelleParty, enemy, group, member } from '../../../src/battle/ffx2/fixtures.ts';
import { GARMENT_GRID_LAYOUTS } from '../../../src/data/ffx2/garment-grids/index.ts';
import { Probe } from './ffx2AutoRig.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { cardOf, engineOrderOf, reachFrom } from './ffx2GridOracle.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
export const DRESSES = ['gunner', 'thief', 'warrior', 'black-mage', 'white-mage', 'songstress'];
export const LEVEL = 24;

export function walkBattle(gridId: string, seed = 1): Probe {
  const base = bevelleParty(LEVEL);
  const yuna = member('yuna', 'Yuna', DRESSES[0] as string, LEVEL, gridId, [...DRESSES]);
  const party: FFX2PartyBuild = { ...base, members: [yuna, ...base.members.slice(1)] as FFX2PartyBuild['members'] };
  const engine = new Probe(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party, enemies: group('ffx2-dummy', [enemy('dummy', 'Training dummy', 'idle', { hp: 99999, maxHp: 99999 })]), triggers: [], seed, condition: 'scripted', canEscape: false });
  return engine;
}

export function yunasMenu(engine: Probe): Input {
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

interface Change { command: Command; to: string; toNode: number; gates: GateColour[] }
const changesOf = (d: Input): Change[] =>
  d.commands.flatMap((c) =>
    c.command.kind === 'spherechange'
      ? [{ command: c.command as Command, to: c.command.extra.toDressphere, toNode: c.command.extra.toNode, gates: [...(c.command.extra.gatesCrossed ?? [])] as GateColour[] }]
      : [],
  );

/**
 * The shortest run of engine nodes that crosses every gate number in `need`, planned on the card (the oracle's own reading: a dressphere node joins another directly or through one gate;
 * `engineOrderOf` numbers them). `from` is the engine node she stands on and `have` the gate numbers already crossed.
 */
function plan(plate: number, from: number, need: readonly number[], have: readonly number[]): number[] {
  const card = cardOf(plate);
  const dress = engineOrderOf(card);
  const mask = (ks: readonly number[]): number => need.reduce((m, k, i) => (ks.includes(k) ? m | (1 << i) : m), 0);
  const done = (1 << need.length) - 1;
  const start = { node: from, m: mask(have), path: [] as number[] };
  const seen = new Set<string>([`${start.node}/${start.m}`]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.m === done) return cur.path;
    for (const { to, gate } of reachFrom(card, dress[cur.node] as number)) {
      const node = dress.indexOf(to);
      const m = gate === null ? cur.m : cur.m | mask([gate]);
      const key = `${node}/${m}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ node, m, path: [...cur.path, node] });
    }
  }
  throw new Error(`no walk on plate ${plate} crosses ${need.join()}`);
}

export interface Step { dress: string; passed: GateColour[]; maxHp: number; maxMp: number; hp: number; mp: number; log: string[] }

/** Walk Yuna along the shortest plan until she has crossed the gate numbers `need`, taking the menu's own Change row for each node. Returns the state after each change. */
export function walk(engine: Probe, gridId: string, need: readonly number[]): Step[] {
  const layout = GARMENT_GRID_LAYOUTS[gridId]!;
  const u = engine.unit('yuna');
  const have = (): number[] => [1, 2, 3, 4].filter((k) => u.dresspheres?.garmentGrid.passedGates.includes(layout.colourOfGate[k - 1] as GateColour));
  const out: Step[] = [];
  for (const node of plan(layout.plate, u.dresspheres?.garmentGrid.nodePosition ?? 0, need, have())) {
    const pick = changesOf(yunasMenu(engine)).find((r) => r.toNode === node);
    if (pick === undefined) throw new Error(`the menu offers no Change to node ${node}`);
    const from = engine.state().log.length;
    engine.submit(pick.command);
    for (let i = 0; i < 400 && u.dresspheres?.current !== pick.to; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else break;
    }
    out.push({
      dress: u.dresspheres?.current ?? '',
      passed: [...(u.dresspheres?.garmentGrid.passedGates ?? [])] as GateColour[],
      maxHp: u.stats.maxHp,
      maxMp: u.stats.maxMp,
      hp: u.hp,
      mp: u.mp,
      log: engine.state().log.slice(from).map((x) => x.type + (x.type === 'status-add' || x.type === 'status-remove' ? `:${(x as { status?: string }).status}` : '')),
    });
  }
  return out;
}

