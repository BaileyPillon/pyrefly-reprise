import { describe, expect, it } from 'vitest';

import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import {
  NODES,
  NODE_BY_ID,
  neighboursOf,
  statField,
} from '../../src/ui/ffx/party-prep/sphereGridData.ts';
import { SphereGridModel } from '../../src/ui/ffx/party-prep/sphereGridModel.ts';

/**
 * `SphereGridModel` is the half of the Sphere Grid tab a screenshot cannot
 * check: the canvas shows that a node is lit, not that activating it really
 * spent a sphere and really moved the number on the character's stat block.
 * These run the rules straight against a clone of the shipped chapter-1 build
 * (`docs/handoff/polish-sphere-grid.md`).
 */
function freshBuild(): FFXPartyBuild {
  return structuredClone(gagazetBuild);
}

function modelFor(): { model: SphereGridModel; build: FFXPartyBuild } {
  const build = freshBuild();
  return { model: new SphereGridModel(build), build };
}

describe('SphereGridModel — hydration', () => {
  it('turns every placeholder position into a real node id', () => {
    const { model, build } = modelFor();
    for (const member of build.members) {
      const grid = model.gridFor(member.id);
      expect(grid, member.id).not.toBeNull();
      expect(NODE_BY_ID.has(grid!.position), `${member.id} stands on a real node`).toBe(true);
      // The build is rewritten in place, so nothing downstream still carries
      // `'tidus-sphere-30'`.
      expect(member.sphereGrid.position).toBe(String(grid!.position));
    }
  });

  it('seeds a pouch when the chapter ships an empty one, and says so', () => {
    const { model, build } = modelFor();
    expect(model.pouchIsEstimated).toBe(true);
    expect(build.sphereInventory['power-sphere']).toBeGreaterThan(0);
  });

  it('never seeds a pouch over one the chapter already filled', () => {
    const build = freshBuild();
    build.sphereInventory['power-sphere'] = 3;
    const model = new SphereGridModel(build);
    expect(model.pouchIsEstimated).toBe(false);
    expect(build.sphereInventory['power-sphere']).toBe(3);
  });
});

describe('SphereGridModel — movement', () => {
  it('only steps along a link', () => {
    const { model, build } = modelFor();
    const id = build.members[0]!.id;
    const far = NODES.find((n) => !neighboursOf(model.gridFor(id)!.position).includes(n.id))!;
    expect(model.moveTo(id, far.id).ok).toBe(false);
  });

  it('spends one S.Lv for new ground and one per four travelled steps', () => {
    const { model, build } = modelFor();
    const member = build.members[0]!;
    const grid = model.gridFor(member.id)!;
    const start = grid.position;
    const back = model.reachable(member.id).find((n) => grid.visited.has(n));
    expect(back, 'the route leaves travelled ground to walk back over').toBeDefined();

    const before = member.sphereGrid.sLv;
    // First travelled step opens a quarter-step budget: one S.Lv buys four.
    for (let i = 0; i < 4; i++) {
      const here = model.gridFor(member.id)!.position;
      const next = model.reachable(member.id).find((n) => n !== here && grid.visited.has(n));
      if (next === undefined) break;
      expect(model.moveTo(member.id, next).ok).toBe(true);
    }
    expect(member.sphereGrid.sLv).toBe(before - 1);
    expect(model.gridFor(member.id)!.position).not.toBe(start);
  });

  it('refuses to move with no S.Lv left', () => {
    const { model, build } = modelFor();
    const member = build.members[0]!;
    member.sphereGrid.sLv = 0;
    const next = model.reachable(member.id)[0]!;
    const result = model.moveTo(member.id, next);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/S\.Lv/);
  });
});

describe('SphereGridModel — activation', () => {
  /** Walk to the nearest node this character has not activated yet. */
  function walkToUnspent(model: SphereGridModel, memberId: string): number | null {
    const grid = model.gridFor(memberId)!;
    const seen = new Set<number>([grid.position]);
    let frontier: number[][] = [[grid.position]];
    for (let depth = 0; depth < 12; depth++) {
      const next: number[][] = [];
      for (const path of frontier) {
        for (const id of neighboursOf(path[path.length - 1]!)) {
          if (seen.has(id)) continue;
          seen.add(id);
          const node = NODE_BY_ID.get(id)!;
          if (node.kind === 'lock') continue;
          const route = [...path, id];
          if (node.kind === 'stat' && !grid.activated.has(id)) {
            for (const step of route.slice(1)) {
              model.memberBuild(memberId)!.sphereGrid.sLv = 99; // the walk is not what is under test
              expect(model.moveTo(memberId, step).ok, `step to ${step}`).toBe(true);
            }
            return id;
          }
          next.push(route);
        }
      }
      frontier = next;
    }
    return null;
  }

  it('spends a sphere and moves the stat on the live build', () => {
    const { model, build } = modelFor();
    const member = build.members[0]!;
    const target = walkToUnspent(model, member.id);
    expect(target, 'an unactivated stat node within twelve steps').not.toBeNull();

    const node = NODE_BY_ID.get(target!)!;
    const field = statField(node.stat)!;
    const statBefore = member.stats[field];
    const itemId = node.sphere === 'power' ? 'power-sphere' : `${node.sphere}-sphere`;
    const heldBefore = build.sphereInventory[itemId] ?? 0;
    expect(heldBefore, `${itemId} in the pouch`).toBeGreaterThan(0);

    const result = model.activate(member.id, target!);
    expect(result.ok, result.message).toBe(true);
    expect(member.stats[field]).toBe(statBefore + node.value);
    expect(build.sphereInventory[itemId]).toBe(heldBefore - 1);
    expect(member.sphereGrid.activatedNodeIds).toContain(String(target));
    // A second go is refused rather than double-counted.
    expect(model.activate(member.id, target!).ok).toBe(false);
    expect(member.stats[field]).toBe(statBefore + node.value);
  });

  it('refuses a node the character is not standing on', () => {
    const { model, build } = modelFor();
    const member = build.members[0]!;
    const elsewhere = NODES.find(
      (n) => n.kind === 'stat' && n.id !== model.gridFor(member.id)!.position,
    )!;
    expect(model.canActivate(member.id, elsewhere.id).ok).toBe(false);
  });

  it('refuses a node whose sphere the pouch cannot pay for', () => {
    const { model, build } = modelFor();
    const member = build.members[0]!;
    const target = walkToUnspent(model, member.id);
    expect(target).not.toBeNull();
    for (const id of Object.keys(build.sphereInventory)) build.sphereInventory[id] = 0;
    const check = model.canActivate(member.id, target!);
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/sphere/i);
  });

  it('opens a lock globally, from the node beside it', () => {
    const { model, build } = modelFor();
    const member = build.members[0]!;
    member.sphereGrid.sLv = 99;
    const grid = model.gridFor(member.id)!;
    // Find a lock within reach and stand next to it.
    const lock = NODES.find(
      (n) =>
        n.kind === 'lock' &&
        !model.unlocked.has(n.id) &&
        neighboursOf(n.id).some((a) => neighboursOf(grid.position).includes(a) || a === grid.position),
    );
    if (!lock) return; // no lock within two steps of this build's start; nothing to assert
    const beside = neighboursOf(lock.id).find(
      (a) => a === grid.position || neighboursOf(grid.position).includes(a),
    )!;
    if (beside !== grid.position) expect(model.moveTo(member.id, beside).ok).toBe(true);
    build.sphereInventory[`lv-${lock.lockLevel}-key-sphere`] = 1;
    expect(model.activate(member.id, lock.id).ok).toBe(true);
    expect(model.unlocked.has(lock.id)).toBe(true);
    // Global: every other character sees it open too.
    const other = build.members[1]!;
    expect(model.canActivate(other.id, lock.id).reason).not.toMatch(/Lock/);
  });
});
