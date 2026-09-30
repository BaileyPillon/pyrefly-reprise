// @vitest-environment jsdom
/**
 * The Sphere Grid defects a friend's playtest turned up (Bailey, 2026-09-29:
 * "i don't get the sphere grid, feels buggy"), each proven on the live build
 * first (docs/handoff/fb-0929-sphere.md). FFX only: the Sphere Grid is FFX's
 * levelling board; FFX-2 has dresspheres and the Garment Grid instead.
 *
 * 1. A travelled step was priced "1/4 S.Lv" and then charged a whole S.Lv.
 * 2. An opened lock still read as a closed one (label, tooltip, caption).
 * 3. Leaving party prep and coming back closed every lock the player had
 *    opened, while the key spheres stayed spent; an emptied pouch refilled.
 * 4. HP and MP nodes skipped the base stat, so max HP broke the §9 rule the
 *    rest of the game uses (Tidus: HP +200 gave 2620, the rule says 2640).
 * 5. Walk mode's arrows let the cursor wander past the character's reach,
 *    so Enter then answered "Not linked to this node."
 * 6. After a click the caption only said "Enter", never the second click.
 */

import { describe, expect, it } from 'vitest';

import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { effectivePool } from '../../src/battle/ffx/effectiveStats.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { NODE_BY_ID, neighboursOf, nodeEffect, nodeLabel, type GridNode } from '../../src/ui/ffx/party-prep/sphereGridData.ts';
import { SphereGridModel } from '../../src/ui/ffx/party-prep/sphereGridModel.ts';
import { actionLine, tooltipLines } from '../../src/ui/ffx/party-prep/sphereGridCaption.ts';
import { SphereGridView } from '../../src/ui/ffx/party-prep/SphereGridView.ts';

function fresh(): { build: FFXPartyBuild; model: SphereGridModel } {
  const build = structuredClone(gagazetBuild);
  return { build, model: new SphereGridModel(build) };
}

/** Walk (paying freely) to the nearest node matching `want`, never through a closed lock. Returns it. */
function walkTo(model: SphereGridModel, memberId: string, want: (n: GridNode) => boolean, stopBeside = false): number {
  const grid = model.gridFor(memberId)!;
  const prev = new Map<number, number | null>([[grid.position, null]]);
  const queue = [grid.position];
  let found: number | null = null;
  let stand: number | null = null;
  while (queue.length && found === null) {
    const cur = queue.shift()!;
    for (const nb of neighboursOf(cur)) {
      const node = NODE_BY_ID.get(nb)!;
      if (stopBeside && want(node)) {
        found = nb;
        stand = cur;
        break;
      }
      if (prev.has(nb) || (node.kind === 'lock' && !model.unlocked.has(nb))) continue;
      prev.set(nb, cur);
      if (!stopBeside && want(node)) {
        found = nb;
        stand = nb;
        break;
      }
      queue.push(nb);
    }
  }
  expect(found, 'a matching node within reach').not.toBeNull();
  const path: number[] = [];
  for (let c: number | null = stand; c !== null && c !== grid.position; c = prev.get(c) ?? null) path.unshift(c);
  for (const step of path) {
    model.memberBuild(memberId)!.sphereGrid.sLv = 99;
    expect(model.moveTo(memberId, step).ok, `step to ${step}`).toBe(true);
  }
  return found!;
}

describe('1. the price of a travelled step is what it actually costs', () => {
  it('moveCost equals the S.Lv each travelled step really spends', () => {
    const { build, model } = fresh();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    const grid = model.gridFor('tidus')!;
    for (let i = 0; i < 6; i++) {
      const here = grid.position;
      const next = model.reachable('tidus').find((n) => n !== here && grid.visited.has(n));
      expect(next, 'travelled ground to walk back over').toBeDefined();
      const quoted = model.moveCost('tidus', next!);
      const before = tidus.sphereGrid.sLv;
      expect(model.moveTo('tidus', next!).ok).toBe(true);
      expect(before - tidus.sphereGrid.sLv, `step ${i}: quoted ${quoted}`).toBe(quoted);
    }
  });

  it('the caption prices a first travelled step at a whole S.Lv, and the next three as already paid', () => {
    const { model } = fresh();
    const grid = model.gridFor('tidus')!;
    const back = model.reachable('tidus').find((n) => grid.visited.has(n))!;
    const node = NODE_BY_ID.get(back)!;
    expect(actionLine(model, 'tidus', node, true)).toMatch(/1 S\.Lv/);
    expect(actionLine(model, 'tidus', node, true)).not.toMatch(/1\/4/);
    model.moveTo('tidus', back);
    const again = model.reachable('tidus').find((n) => n !== grid.position && grid.visited.has(n))!;
    expect(actionLine(model, 'tidus', NODE_BY_ID.get(again)!, true)).toMatch(/no S\.Lv/i);
  });
});

describe('2. an opened lock reads as an empty node', () => {
  it('label, effect and tooltip stop calling it a barrier once it is open', () => {
    const { build, model } = fresh();
    const lock = walkTo(model, 'tidus', (n) => n.kind === 'lock' && (n.lockLevel ?? 9) <= 2, true);
    const node = NODE_BY_ID.get(lock)!;
    build.sphereInventory[`lv-${node.lockLevel}-key-sphere`] = 1;
    expect(model.activate('tidus', lock).ok).toBe(true);
    const opened = model.unlocked.has(lock);
    expect(opened).toBe(true);
    expect(nodeLabel(node, opened)).toBe('');
    expect(nodeEffect(node, opened)).not.toMatch(/blocks the path/i);
    expect(nodeEffect(node, opened)).toMatch(/opened/i);
    const tip = tooltipLines(model, 'tidus', node);
    expect(tip.sub).not.toMatch(/blocks/i);
    expect(tip.cost).not.toMatch(/Key Sphere/);
  });

  it('an activated node says so in the tooltip instead of pricing a sphere again', () => {
    const { model } = fresh();
    const grid = model.gridFor('tidus')!;
    const lit = NODE_BY_ID.get(grid.position)!;
    expect(grid.activated.has(lit.id)).toBe(true);
    const tip = tooltipLines(model, 'tidus', lit);
    expect(tip.cost).toMatch(/activated/i);
    expect(tip.cost).not.toMatch(/held/);
  });
});

describe('3. the grid remembers what it did when party prep is left and re-entered', () => {
  it('an opened lock stays open and its key is not spent twice', () => {
    const { build, model } = fresh();
    const lock = walkTo(model, 'tidus', (n) => n.kind === 'lock' && (n.lockLevel ?? 9) <= 2, true);
    const key = `lv-${NODE_BY_ID.get(lock)!.lockLevel}-key-sphere`;
    build.sphereInventory[key] = 2;
    expect(model.activate('tidus', lock).ok).toBe(true);
    // Leaving party prep and coming back mounts a new panel, which builds a new model on the same build.
    const again = new SphereGridModel(build);
    expect(again.unlocked.has(lock)).toBe(true);
    expect(again.canActivate('tidus', lock).ok).toBe(false);
    expect(build.sphereInventory[key]).toBe(1);
  });

  it('an emptied pouch is not refilled by the starter estimate', () => {
    const { build, model } = fresh();
    expect(model.pouchIsEstimated).toBe(true);
    for (const id of Object.keys(build.sphereInventory)) build.sphereInventory[id] = 0;
    const again = new SphereGridModel(build);
    expect(Object.values(build.sphereInventory).every((n) => n === 0)).toBe(true);
    expect(again.pouchIsEstimated).toBe(true); // still the same estimated pouch, now spent
  });

  it('ground walked in an earlier visit is still travelled ground', () => {
    const { build, model } = fresh();
    const grid = model.gridFor('tidus')!;
    model.memberBuild('tidus')!.sphereGrid.sLv = 99;
    // New ground this visit: a dormant node, then one more step past it.
    const first = walkTo(model, 'tidus', (n) => n.kind !== 'lock' && !grid.visited.has(n.id));
    const second = neighboursOf(first).find((n) => NODE_BY_ID.get(n)!.kind !== 'lock' && !grid.visited.has(n));
    expect(second, 'a second fresh node').toBeDefined();
    expect(model.moveTo('tidus', second!).ok).toBe(true);
    const again = new SphereGridModel(build);
    expect(again.gridFor('tidus')!.position).toBe(second);
    // Stepping back onto `first` is travelled ground: a quarter step, not a new S.Lv each time.
    expect(again.gridFor('tidus')!.visited.has(first)).toBe(true);
  });
});

describe('4. HP and MP nodes follow the same max-HP rule as the rest of the game', () => {
  it('an HP node raises base HP, and max HP stays baseHP * (100 + HP%) // 100', () => {
    const { build, model } = fresh();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    const hpNode = walkTo(model, 'tidus', (n) => n.stat === 'maxHp' && !model.gridFor('tidus')!.activated.has(n.id));
    const baseBefore = tidus.stats.hp;
    const value = NODE_BY_ID.get(hpNode)!.value;
    expect(model.activate('tidus', hpNode).ok).toBe(true);
    expect(tidus.stats.hp).toBe(baseBefore + value);
    expect(tidus.stats.maxHp).toBe(effectivePool(tidus, 'hp'));
    expect(tidus.hp).toBe(tidus.stats.maxHp);
  });

  it('an MP node raises base MP the same way', () => {
    const { build, model } = fresh();
    const lulu = build.members.find((m) => m.id === 'lulu')!;
    const mpNode = walkTo(model, 'lulu', (n) => n.stat === 'maxMp' && !model.gridFor('lulu')!.activated.has(n.id));
    const baseBefore = lulu.stats.mp;
    expect(model.activate('lulu', mpNode).ok).toBe(true);
    expect(lulu.stats.mp).toBe(baseBefore + NODE_BY_ID.get(mpNode)!.value);
    expect(lulu.stats.maxMp).toBe(effectivePool(lulu, 'mp'));
  });

  it('other stats stop at 255 [ffx-combat-core §10.1 caps]', () => {
    const { build, model } = fresh();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    const str = walkTo(model, 'tidus', (n) => n.stat === 'str' && !model.gridFor('tidus')!.activated.has(n.id));
    tidus.stats.str = 254;
    expect(model.activate('tidus', str).ok).toBe(true);
    expect(tidus.stats.str).toBe(255);
  });
});

describe('5. walk mode keeps the cursor within the character’s reach', () => {
  it('arrows only land on the character’s node or a node linked to it', () => {
    const { model } = fresh();
    const view = new SphereGridView();
    view.show(model, 'tidus');
    const pos = model.gridFor('tidus')!.position;
    const allowed = new Set([pos, ...neighboursOf(pos)]);
    const dirs: Array<[number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0], [1, 0], [0, 1], [0, 1], [-1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      view.moveCursor(dx, dy);
      expect(allowed.has(view.cursorNode!.id), `cursor on ${view.cursorNode!.id} after (${dx},${dy})`).toBe(true);
    }
    view.unmount();
  });
});

describe('6. the caption tells a mouse player a second click does it too', () => {
  it('names both Enter and a click for the node under the cursor', () => {
    const { model } = fresh();
    const next = model.reachable('tidus')[0]!;
    expect(actionLine(model, 'tidus', NODE_BY_ID.get(next)!, true)).toMatch(/Enter or click/);
  });
});
