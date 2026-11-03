/**
 * A girl's walk across her Garment Grid, as a player takes it through the menu's own Change rows (the Fallen Maesters' floor 60 needs a result of 10,000 and The End's Break Damage Limit is behind two gates; **FFX-2 only**).
 *
 * The route is planned on the game's card as numbers (`helpers/ffx2GridOracle.ts`: it imports no grid or adapter code of the engine, and `ffx2GridWalk.ts` plans the same way for Yuna); this helper adds the way HOME, because
 * a Dark Knight who has crossed the gates is only useful once she wears the Dark Knight again. Each step is a Change row the menu offers, never a state written by the test.
 */

import type { Command, Decision, GateColour } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { GARMENT_GRID_LAYOUTS } from '../../../src/data/ffx2/garment-grids/index.ts';
import { cardOf, engineOrderOf, reachFrom } from './ffx2GridOracle.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Walker {
  dresspheres?: { current: string; garmentGrid: { id: string; nodePosition: number; passedGates: GateColour[] } };
}

/**
 * The next engine node on the shortest walk that crosses every colour in `need` and ends on `home` (engine node numbers; a gate may be crossed in any order), or `null` when she already stands home with them crossed or no walk exists.
 */
export function nextNodeOnWalk(gridId: string, from: number, passed: readonly GateColour[], need: readonly GateColour[], home = 0): number | null {
  const layout = GARMENT_GRID_LAYOUTS[gridId];
  if (!layout) return null;
  const card = cardOf(layout.plate);
  const dress = engineOrderOf(card);
  const wanted = need.map((c) => layout.colourOfGate.indexOf(c) + 1).filter((k) => k > 0);
  const have = (ks: readonly GateColour[]): number => wanted.reduce((m, k, i) => (ks.includes(layout.colourOfGate[k - 1] as GateColour) ? m | (1 << i) : m), 0);
  const done = (1 << wanted.length) - 1;
  const start = { node: from, m: have(passed), first: -1 };
  if (start.m === done && start.node === home) return null;
  const seen = new Set<string>([`${start.node}/${start.m}`]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const { to, gate } of reachFrom(card, dress[cur.node] as number)) {
      const node = dress.indexOf(to);
      const m = gate !== null && wanted.includes(gate) ? cur.m | (1 << wanted.indexOf(gate)) : cur.m;
      const key = `${node}/${m}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const first = cur.first === -1 ? node : cur.first;
      if (m === done && node === home) return first;
      queue.push({ node, m, first });
    }
  }
  return null;
}

/**
 * The Change row that takes `girl` one step along the walk (crossing `need`, then home), or `null` when the walk is done or the menu offers none. The command is the menu's own row.
 */
export function walkChange(d: Input, engine: FFX2Engine, girl: string, need: readonly GateColour[]): Command | null {
  const u = engine.state().combatants[girl] as unknown as Walker;
  const grid = u.dresspheres?.garmentGrid;
  if (!grid) return null;
  const node = nextNodeOnWalk(grid.id, grid.nodePosition, grid.passedGates, need);
  if (node === null) return null;
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.command.extra.toNode === node);
  return row ? (row.command as Command) : null;
}
