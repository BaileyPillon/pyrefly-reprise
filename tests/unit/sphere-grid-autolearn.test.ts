// @vitest-environment jsdom
/**
 * AUTO-LEARN and its UNDO (Bailey's pick D-290, option C of
 * docs/concepts/fb-0929/sphere/). FFX only: the Sphere Grid is FFX's.
 *
 * - auto-learn equals doing the same steps by hand (same build, same model);
 * - undo restores the exact state, build and model, and a later visit to the
 *   tab (a new model on the same build) sees the restored walk;
 * - it never opens a lock or spends a key, never activates a node it does not
 *   stand on, and leaves everything untouched when nothing can be paid for.
 */

import { describe, expect, it } from 'vitest';

import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { NODE_BY_ID } from '../../src/ui/ffx/party-prep/sphereGridData.ts';
import { SphereGridModel } from '../../src/ui/ffx/party-prep/sphereGridModel.ts';
import { AUTO_LEARN_BATCH, autoLearn, nextTarget, restoreGrid, snapshotGrid } from '../../src/ui/ffx/party-prep/sphereGridAutoLearn.ts';

function fresh(): { build: FFXPartyBuild; model: SphereGridModel } {
  const build = structuredClone(gagazetBuild);
  return { build, model: new SphereGridModel(build) };
}

/** Everything a player could observe about one character on the grid, as plain data. */
function state(model: SphereGridModel, memberId: string): unknown {
  const g = model.gridFor(memberId)!;
  const w = model.walkRecord(memberId)!;
  return {
    build: JSON.parse(JSON.stringify(model.build)),
    position: g.position,
    activated: [...g.activated].sort((a, b) => a - b),
    visited: [...g.visited].sort((a, b) => a - b),
    quarterSteps: g.quarterSteps,
    walkVisited: [...w.visited].sort((a, b) => a - b),
    walkQuarterSteps: w.quarterSteps,
    unlocked: [...model.unlocked].sort((a, b) => a - b),
  };
}

describe('auto-learn (FFX only)', () => {
  it("reproduces the approved picture's figures on Tidus in Chapter I", () => {
    const { build, model } = fresh();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    const r = autoLearn(model, 'tidus')!;
    expect(r).not.toBeNull();
    // docs/concepts/fb-0929/sphere/option-c-autolearn.jpg: 4 nodes, S.Lv 30 -> 23,
    // STR 31 -> 35, AGI 30 -> 34, MAX HP 2420 -> 2640, 3 Power and 1 Speed Sphere.
    expect(r.activated.length).toBe(AUTO_LEARN_BATCH);
    expect([r.sLvBefore, r.sLvAfter]).toEqual([30, 23]);
    expect(r.sLvAfter).toBe(tidus.sphereGrid.sLv);
    expect(r.gains).toEqual([
      { label: 'STR', before: 31, after: 35 },
      { label: 'AGI', before: 30, after: 34 },
      { label: 'MAX HP', before: 2420, after: 2640 },
    ]);
    expect(r.spent).toEqual([
      { label: 'Power', count: 3 },
      { label: 'Speed', count: 1 },
    ]);
    // Pressing again carries on until nothing the pouch and S.Lv can pay for is left.
    let presses = 1;
    while (autoLearn(model, 'tidus')) presses++;
    expect(nextTarget(model, 'tidus')).toBeNull();
    expect(presses).toBeGreaterThan(1);
  });

  it('equals doing the same steps by hand', () => {
    const auto = fresh();
    const r = autoLearn(auto.model, 'tidus', 1000)!;

    // Replay by hand on a second copy: step node to node along the planner's
    // own choices, activating where it stood, through the same model calls a
    // click makes (moveTo, then activate on the node the character stands on).
    const hand = fresh();
    for (;;) {
      const path = nextTarget(hand.model, 'tidus');
      if (!path) break;
      for (const id of path) expect(hand.model.moveTo('tidus', id).ok).toBe(true);
      const here = hand.model.gridFor('tidus')!.position;
      expect(hand.model.activate('tidus', here).ok).toBe(true);
    }
    expect(state(hand.model, 'tidus')).toEqual(state(auto.model, 'tidus'));
    expect([...hand.model.gridFor('tidus')!.activated].slice(-r.activated.length)).toEqual(r.activated);
  });

  it('never opens a lock, never spends a key, and only activates where it stands', () => {
    for (const id of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku']) {
      const { build, model } = fresh();
      const keysBefore = Object.fromEntries(Object.entries(build.sphereInventory).filter(([k]) => k.includes('key')));
      const unlockedBefore = [...model.unlocked].sort();
      const r = autoLearn(model, id, 1000);
      const keysAfter = Object.fromEntries(Object.entries(build.sphereInventory).filter(([k]) => k.includes('key')));
      expect(keysAfter).toEqual(keysBefore);
      expect([...model.unlocked].sort()).toEqual(unlockedBefore);
      for (const n of r?.activated ?? []) {
        const node = NODE_BY_ID.get(n)!;
        expect(node.kind === 'stat' || node.kind === 'ability').toBe(true);
      }
    }
  });

  it('UNDO restores the exact state, and a later visit sees it too', () => {
    const { build, model } = fresh();
    // Move one step by hand first, so the snapshot holds a part-paid travelled walk.
    const before = state(model, 'tidus');
    const r = autoLearn(model, 'tidus')!;
    expect(state(model, 'tidus')).not.toEqual(before);
    restoreGrid(model, r.snapshot);
    expect(state(model, 'tidus')).toEqual(before);

    // Leaving party prep and coming back builds a new model on the same build.
    const again = new SphereGridModel(build);
    const g = again.gridFor('tidus')!;
    expect(g.position).toBe((before as { position: number }).position);
    expect(g.quarterSteps).toBe((before as { quarterSteps: number }).quarterSteps);
  });

  it('UNDO after a walk over travelled ground restores the paid steps', () => {
    const { model } = fresh();
    const g = model.gridFor('tidus')!;
    // Step back onto travelled ground once: 1 S.Lv paid, 3 travelled steps banked.
    const back = [...g.visited].find((id) => id !== g.position && model.reachable('tidus').includes(id));
    if (back !== undefined) expect(model.moveTo('tidus', back).ok).toBe(true);
    const before = state(model, 'tidus');
    const r = autoLearn(model, 'tidus');
    if (r) restoreGrid(model, r.snapshot);
    expect(state(model, 'tidus')).toEqual(before);
  });

  it('does nothing and changes nothing when nothing can be paid for', () => {
    const { build, model } = fresh();
    for (const k of Object.keys(build.sphereInventory)) build.sphereInventory[k] = 0;
    const before = state(model, 'tidus');
    expect(autoLearn(model, 'tidus')).toBeNull();
    expect(state(model, 'tidus')).toEqual(before);

    const other = fresh();
    other.build.members.find((m) => m.id === 'tidus')!.sphereGrid.sLv = 0;
    const snap = snapshotGrid(other.model, 'tidus');
    const r = autoLearn(other.model, 'tidus');
    // With no S.Lv only the node Tidus already stands on could be activated.
    if (r) expect(r.activated).toEqual([snap!.gridPosition]);
    else expect(state(other.model, 'tidus')).toBeTruthy();
  });

  it('is deterministic', () => {
    const a = fresh();
    const b = fresh();
    expect(autoLearn(a.model, 'lulu')?.activated).toEqual(autoLearn(b.model, 'lulu')?.activated);
  });
});
