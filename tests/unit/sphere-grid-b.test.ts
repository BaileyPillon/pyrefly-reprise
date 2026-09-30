// @vitest-environment jsdom
/**
 * Sphere Grid option B (Bailey's pick D-295, docs/concepts/fb-0929/sphere/option-b-layout.jpg):
 * the selected-node preview, the route and its price, and WALK AND ACTIVATE. FFX only.
 *
 * - the route's S.Lv is what `moveTo` then takes, step by step;
 * - the card's numbers (stat before/after, sphere before/after, S.Lv after) are what
 *   WALK AND ACTIVATE then does, and a preview leaves the build exactly as it was;
 * - WALK AND ACTIVATE equals the same steps by hand (moveTo per step, then activate);
 * - it is all or nothing: a walk the S.Lv cannot pay for changes nothing;
 * - a closed lock is reached from beside it and opened with its key;
 * - the target's opening figures: Tidus, Chapter I, Strength +2, 2 steps, 2 S.Lv, STR 31 -> 33, Power 12 -> 11.
 */

import { describe, expect, it } from 'vitest';

import type { FFXPartyBuild } from '../../src/battle/common/types.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { nextTarget } from '../../src/ui/ffx/party-prep/sphereGridAutoLearn.ts';
import { NODES, NODE_BY_ID, neighboursOf } from '../../src/ui/ffx/party-prep/sphereGridData.ts';
import { SphereGridModel } from '../../src/ui/ffx/party-prep/sphereGridModel.ts';
import { previewNode, walkAndActivate } from '../../src/ui/ffx/party-prep/sphereGridPreview.ts';
import { routeTo } from '../../src/ui/ffx/party-prep/sphereGridRoute.ts';
import { cardHtml, pouchHtml, routeTag } from '../../src/ui/ffx/party-prep/sphereGridSide.ts';

const MEMBERS = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'];

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

/** Nodes within `depth` links of where a member stands, nearest first. */
function around(model: SphereGridModel, memberId: string, depth: number): number[] {
  const start = model.gridFor(memberId)!.position;
  const seen = new Set([start]);
  let frontier = [start];
  const out: number[] = [];
  for (let d = 0; d < depth; d++) {
    const next: number[] = [];
    for (const f of frontier) for (const n of neighboursOf(f)) if (!seen.has(n)) (seen.add(n), next.push(n));
    out.push(...next);
    frontier = next;
  }
  return out;
}

describe('option B preview (FFX only)', () => {
  it("opens on the target's figures: Tidus, Strength +2, 2 steps, 2 S.Lv, STR 31 -> 33, Power 12 -> 11", () => {
    const { model } = fresh();
    const path = nextTarget(model, 'tidus')!;
    const id = path[path.length - 1]!;
    const p = previewNode(model, 'tidus', id);
    expect(p.title).toBe('Strength +2');
    expect(p.action).toBe('walk-activate');
    expect(p.ok).toBe(true);
    expect(p.steps.map((s) => s.kind)).toEqual(['pays4', 'new']);
    expect([p.sLvCost, p.sLvBefore, p.sLvAfter]).toEqual([2, 30, 28]);
    expect(p.change).toEqual({ label: 'STR', before: 31, after: 33 });
    expect(p.sphere).toEqual({ family: 'power', label: 'Power', before: 12, after: 11 });
    expect(routeTag(p)).toBe('+2 STR');
    const html = cardHtml(p, 'Tidus', model, 'Enter or click again does the same.');
    expect(html).toContain('STR 31 <em>&rarr; 33</em>');
    expect(html).toContain('Power &middot; 12 &rarr; 11');
    expect(html).toContain('2 steps &middot; 2 S.Lv');
    expect(html).toContain('S.Lv 28');
  });

  it('a preview leaves the build and the model exactly as they were', () => {
    for (const m of MEMBERS) {
      const { model } = fresh();
      const before = state(model, m);
      for (const id of around(model, m, 4)) previewNode(model, m, id);
      expect(state(model, m)).toEqual(before);
    }
  });

  it("the card's numbers are what WALK AND ACTIVATE then does, node by node", () => {
    let checked = 0;
    for (const m of MEMBERS) {
      for (const id of around(fresh().model, m, 4)) {
        const { model, build } = fresh();
        const p = previewNode(model, m, id);
        const r = walkAndActivate(model, m, id);
        expect(r.ok).toBe(p.ok);
        expect(r.preview).toEqual(p);
        const member = build.members.find((x) => x.id === m)!;
        if (!p.ok) continue;
        checked++;
        expect(member.sphereGrid.sLv).toBe(p.sLvAfter);
        if (p.change) {
          const field = { STR: 'str', DEF: 'def', MAG: 'mag', MDF: 'mdef', AGI: 'agi', ACC: 'acc', EVA: 'eva', LCK: 'luck', 'MAX HP': 'maxHp', 'MAX MP': 'maxMp' }[p.change.label] as keyof typeof member.stats;
          expect(member.stats[field]).toBe(p.change.after);
        }
        if (p.sphere) expect(model.spheresHeld(p.sphere.family)).toBe(p.sphere.after);
        const where = model.gridFor(m)!.position;
        const node = NODE_BY_ID.get(id)!;
        if (node.kind === 'lock' && p.action === 'open') {
          expect(model.unlocked.has(id)).toBe(true);
          expect(neighboursOf(id)).toContain(where);
        } else expect(where).toBe(id);
      }
    }
    expect(checked).toBeGreaterThan(40);
  });

  it("the route's S.Lv is what moveTo takes, step by step", () => {
    for (const m of MEMBERS) {
      for (const id of around(fresh().model, m, 5)) {
        const { model, build } = fresh();
        const route = routeTo(model, m, id);
        if (!route) continue;
        const member = build.members.find((x) => x.id === m)!;
        member.sphereGrid.sLv = 99;
        let total = 0;
        for (const step of route.steps) {
          const before = member.sphereGrid.sLv;
          expect(model.moveTo(m, step.node).ok).toBe(true);
          expect(before - member.sphereGrid.sLv).toBe(step.cost);
          total += step.cost;
        }
        expect(total).toBe(route.sLv);
      }
    }
  });

  it('WALK AND ACTIVATE equals the same steps by hand', () => {
    for (const m of MEMBERS) {
      for (const id of around(fresh().model, m, 3)) {
        const auto = fresh();
        const r = walkAndActivate(auto.model, m, id);
        const hand = fresh();
        if (r.ok) {
          for (const s of r.preview.steps) expect(hand.model.moveTo(m, s.node).ok).toBe(true);
          if (['walk-activate', 'activate', 'open'].includes(r.preview.action)) expect(hand.model.activate(m, id).ok).toBe(true);
        }
        expect(state(auto.model, m)).toEqual(state(hand.model, m));
      }
    }
  });

  it('is all or nothing: a walk the S.Lv cannot pay for changes nothing', () => {
    const { model, build } = fresh();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    tidus.sphereGrid.sLv = 1;
    const path = nextTarget(fresh().model, 'tidus')!;
    const id = path[path.length - 1]!;
    const before = state(model, 'tidus');
    const p = previewNode(model, 'tidus', id);
    expect(p.ok).toBe(false);
    expect(p.reason).toBe('Needs 2 S.Lv; Tidus has 1.');
    const r = walkAndActivate(model, 'tidus', id);
    expect(r.ok).toBe(false);
    expect(state(model, 'tidus')).toEqual(before);
  });

  it('with no sphere for the node it only walks there, and says so', () => {
    const { model, build } = fresh();
    build.sphereInventory['power-sphere'] = 0;
    const path = nextTarget(fresh().model, 'tidus')!;
    const p = previewNode(model, 'tidus', path[path.length - 1]!);
    expect(p.action).toBe('walk');
    expect(p.reason).toBe('No Power Sphere left: this only walks there.');
    expect(p.change).toBeNull();
    expect(p.sphere).toBeNull();
  });

  it('reaches a closed lock from beside it and opens it with its key', () => {
    let opened = 0;
    for (const m of MEMBERS) {
      const probe = fresh();
      const lock = around(probe.model, m, 8)
        .map((id) => NODE_BY_ID.get(id)!)
        .find((n) => n.kind === 'lock' && !probe.model.unlocked.has(n.id) && routeTo(probe.model, m, n.id) !== null);
      if (!lock) continue;
      const { model, build } = fresh();
      build.members.find((x) => x.id === m)!.sphereGrid.sLv = 99;
      const key = `lv-${lock.lockLevel}-key-sphere`;
      build.sphereInventory[key] = 1;
      const p = previewNode(model, m, lock.id);
      expect(p.action).toBe('open');
      expect(p.sphere).toEqual({ family: `key${lock.lockLevel}`, label: `Lv.${lock.lockLevel} Key`, before: 1, after: 0 });
      const r = walkAndActivate(model, m, lock.id);
      expect(r.ok).toBe(true);
      expect(model.unlocked.has(lock.id)).toBe(true);
      expect(neighboursOf(lock.id)).toContain(model.gridFor(m)!.position);
      expect(build.sphereInventory[key]).toBe(0);
      opened++;
    }
    expect(opened).toBeGreaterThan(0);
  });

  it('never routes through a closed lock', () => {
    const { model } = fresh();
    for (const n of NODES.slice(0, 400)) {
      const r = routeTo(model, 'tidus', n.id);
      for (const s of r?.steps ?? []) {
        const node = NODE_BY_ID.get(s.node)!;
        expect(node.kind === 'lock' && !model.unlocked.has(node.id)).toBe(false);
      }
    }
  });

  it('prints the pouch in words, keys folded into one chip', () => {
    const { build } = fresh();
    const html = pouchHtml(build, 'power');
    const text = html.replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
    expect(text).toBe('Power 12Speed 8Mana 8Ability 4Fortune 1Keys 4·2·1·1');
    expect(html).toContain('ffxprep-sg__sphere--wanted');
  });
});
