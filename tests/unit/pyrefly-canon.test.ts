/**
 * A-5 and A-6 (iteration 2 B3), with D-225 (Bailey, 2026-09-26: "I'll go with
 * all of your recommendations"):
 * - every registered scene has a cited pyrefly canon row, and D-225's three
 *   rows say what the sources say (Macalania held for Seymour's death, Leblanc
 *   none, Gagazet unchanged);
 * - only fiends that are sent dissolve into pyreflies, never a person;
 * - the dissolve's lights belong to the stage, not the figure: they outlive
 *   the combatant's removal (and so the results wipe), and go with the stage;
 * - the low tier (low effects or reduced motion) releases nothing.
 * Game case per row: each location row is its own game's; the rule is both.
 */
import { describe, expect, it } from 'vitest';
import { Group, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { sceneKeys } from '../../src/scenes/index.ts';
import { HELD_PYREFLIES, PYREFLY_CANON, pyreflyCanonFor, pyreflyDissolves } from '../../src/engine/pyreflyCanon.ts';
import { PyreflyStage, type DissolveSource, type PyreflyTier } from '../../src/engine/PyreflyStage.ts';

class FakeFigure implements DissolveSource {
  dissolveLevel = 0;
  style: 'plain' | 'pyrefly' = 'plain';
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3] {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    q[0].set(2, 0, -3);
    q[1].set(5, 0, -3);
    q[2].set(5, 4, -3);
    q[3].set(2, 4, -3);
    return q;
  }
  setDissolveStyle(s: 'plain' | 'pyrefly'): void {
    this.style = s;
  }
}

function run(tier: PyreflyTier = 'full') {
  const root = new Group();
  const stage = new PyreflyStage(root, () => tier);
  const fiend = new FakeFigure();
  stage.stage('seymour-flux', 'enemy', fiend);
  // The 620 ms KO dissolve, at 60 fps.
  for (let f = 1; f <= 37; f++) {
    fiend.dissolveLevel = Math.min(1, f / 37);
    stage.update(1 / 60);
  }
  return { root, stage, fiend };
}

describe('pyreflies: the canon table (A-6, D-225)', () => {
  it('every registered scene has a row with a citation', () => {
    for (const key of sceneKeys()) {
      const row = pyreflyCanonFor(key);
      expect(row, key).toBeDefined();
      expect(row!.cite.length, key).toBeGreaterThan(20);
      expect(row!.cite, key).toMatch(/research\//);
    }
    for (const key of Object.keys(PYREFLY_CANON)) expect(sceneKeys(), key).toContain(key);
  });

  it("D-225's three rows: Macalania held for Seymour's death (FFX), Leblanc none (FFX-2), Gagazet unchanged (FFX)", () => {
    expect(PYREFLY_CANON['macalania-temple']).toMatchObject({ game: 'ffx', verdict: 'absent' });
    expect(Object.entries(HELD_PYREFLIES)).toEqual([['pyreflies:after-seymour-macalania', 'seymour-macalania']]);
    expect(PYREFLY_CANON['leblanc-last-room']).toMatchObject({ game: 'ffx2', verdict: 'absent' });
    expect(PYREFLY_CANON['gagazet']).toMatchObject({ game: 'ffx', verdict: 'unattested' });
    expect(PYREFLY_CANON['gagazet']!.treatment).toMatch(/unchanged/);
  });
});

describe('pyreflies: the dissolve (A-5)', () => {
  it('only fiends that are sent dissolve into pyreflies; people and every other departure do not', () => {
    expect(pyreflyDissolves('seymour-flux')).toBe(true);
    expect(pyreflyDissolves('x2-bahamut')).toBe(true);
    for (const id of ['dr-goon', 'fem-goon', 'leblanc', 'logos', 'ormi', 'evrae', 'seymour-macalania', 'yojimbo', 'trema', 'mortiorchis']) {
      expect(pyreflyDissolves(id), id).toBe(false);
    }
  });

  it('a sent fiend gets the feet-up erosion and releases lights from its eroding band', () => {
    const { stage, fiend } = run();
    expect(fiend.style).toBe('pyrefly');
    const n = stage.emitter.alive;
    expect(n).toBeGreaterThan(150);
    for (const [x, y] of stage.emitter.positions()) {
      expect(x).toBeGreaterThan(1.5);
      expect(x).toBeLessThan(5.5);
      expect(y).toBeGreaterThanOrEqual(-0.1);
    }
  });

  it('a party member, a person or a figure that leaves another way gets neither', () => {
    const root = new Group();
    const stage = new PyreflyStage(root, () => 'full');
    for (const [id, side] of [['tidus', 'party'], ['dr-goon', 'enemy'], ['evrae', 'enemy']] as const) {
      const f = new FakeFigure();
      stage.stage(id, side, f);
      expect(f.style, id).toBe('plain');
    }
    expect(stage.trackedIds).toEqual([]);
  });

  it('the lights outlive the figure (and the results wipe) and go with the stage', () => {
    const { root, stage } = run();
    stage.leave('seymour-flux');
    const before = stage.emitter.alive;
    for (let f = 0; f < 60; f++) stage.update(1 / 60);
    expect(stage.emitter.alive).toBeGreaterThan(before * 0.5);
    expect(root.children).toContain(stage.emitter);
    expect(stage.emitter.positions().some(([, y]) => y > 1)).toBe(true);
    stage.dispose();
    expect(stage.emitter.isDisposed).toBe(true);
    expect(root.children).not.toContain(stage.emitter);
  });

  it('reduced motion and low effects: a short erosion with no lingering lights', () => {
    const { stage, fiend } = run('low');
    expect(fiend.style).toBe('pyrefly');
    expect(stage.emitter.alive).toBe(0);
  });

  it("D-225: a held field stays hidden until its combatant's KO, then comes up", () => {
    const root = new Group();
    const field = new Object3D();
    field.name = 'pyreflies:after-seymour-macalania';
    root.add(field);
    let alive = true;
    const stage = new PyreflyStage(root, () => 'full', 'macalania-temple');
    expect(field.visible).toBe(false);
    stage.update(0.5, () => alive);
    expect(field.visible).toBe(false);
    alive = false;
    stage.update(0.5, () => alive);
    expect(field.visible).toBe(true);
  });

  it('A-6: an attested location gets the faint lens band; an absent one does not', () => {
    const cam = new PerspectiveCamera();
    const on = new PyreflyStage(new Group(), () => 'full', 'zanarkand-dome', cam);
    on.update(1 / 60);
    expect(on.snapshot().lens).toBe(true);
    const off = new PyreflyStage(new Group(), () => 'full', 'leblanc-last-room', cam);
    off.update(1 / 60);
    expect(off.snapshot().lens).toBe(false);
  });
});
