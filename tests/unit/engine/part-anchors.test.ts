/**
 * Figure-less destructible parts (D-044; `src/engine/PartAnchors.ts`) and the
 * scene data that uses them, plus the Chapter 6 lane pin and the PR-0002 A
 * slot move that ride in the same scene tables.
 *
 * GAME-AWARE: the anchor plumbing is both games and inert without a table; the
 * Farplane table is FFX-2 only (Chapter 5); the Leblanc lane is FFX-2 only
 * (Chapter 6); the Dream's End slots are FFX only (Chapter 3).
 */
import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { anchorFor, anchorPoint, PartRings, RING_FORWARD, type PartAnchor } from '../../../src/engine/PartAnchors.ts';
import { solveFormation, type FormationMember } from '../../../src/engine/Formation.ts';
import { FARPLANE_ENEMY_SPOTS, FARPLANE_PART_ANCHORS, FARPLANE_STAGING } from '../../../src/scenes/farplane-parts.ts';
import { DREAMS_END_SLOTS } from '../../../src/scenes/dreams-end.ts';
import { ZANARKAND_DOME_SLOTS } from '../../../src/scenes/zanarkand-dome.ts';

const parent = { x: 1, y: 0, z: -5, height: 4 };

describe('anchorPoint', () => {
  const foot: PartAnchor = {
    mode: 'onParent',
    px: [100, 811],
    paint: { width: 1000, height: 827, baselineY: 811, contentTop: 11 },
    chestPx: [100, 411],
    ring: { radius: 0.5, ground: true },
  };

  it('maps a painted pixel through the parent proportions when no live plane is given', () => {
    // width 1000 over an 800 px feet-to-top span at 4 units tall -> 5 units wide.
    const [x, y, z] = anchorPoint(foot, parent);
    expect(x).toBeCloseTo(1 + (0.1 - 0.5) * 5);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(-5 + RING_FORWARD);
    const chest = anchorPoint(foot, parent, 'chest');
    expect(chest[1]).toBeCloseTo(2); // (811 - 411) / 800 * 4
  });

  it('counts u from the right when the parent is drawn mirrored', () => {
    const [x] = anchorPoint(foot, { ...parent, mirrored: true });
    expect(x).toBeCloseTo(1 + (0.9 - 0.5) * 5);
  });

  it('prefers the live plane when the stage hands one over', () => {
    const seen: number[][] = [];
    const [x, y, z] = anchorPoint(foot, {
      ...parent,
      toWorld: (u, t) => {
        seen.push([u, t]);
        return [7, 8, 9];
      },
    });
    expect(seen[0]![0]).toBeCloseTo(0.1);
    expect(seen[0]![1]).toBeCloseTo(811 / 827);
    expect([x, y, z]).toEqual([7, 8, 9 + RING_FORWARD]);
  });

  it('hangs an overhead part off its parent by a plain offset', () => {
    expect(anchorPoint({ mode: 'overhead', offset: [2, 9, -1.5] }, parent)).toEqual([3, 9, -6.5]);
  });
});

describe('Farplane part anchors (FFX-2 only, Chapter 5)', () => {
  it('covers every Bulwark, Redoubt and Node by combatant id, and nothing else', () => {
    expect(Object.keys(FARPLANE_PART_ANCHORS).sort()).toEqual(
      ['bulwark-l', 'bulwark-r', 'node-a', 'node-b', 'node-c', 'redoubt-l', 'redoubt-r'].sort(),
    );
    expect(anchorFor(FARPLANE_PART_ANCHORS, 'vegnagun-body')).toBeUndefined();
    expect(anchorFor(undefined, 'bulwark-r')).toBeUndefined();
  });

  it('puts the Bulwarks on the ground and the Redoubts upright', () => {
    for (const id of ['bulwark-r', 'bulwark-l']) {
      const a = FARPLANE_PART_ANCHORS[id]!;
      expect(a.mode === 'onParent' && a.ring.ground).toBe(true);
    }
    for (const id of ['redoubt-r', 'redoubt-l']) {
      const a = FARPLANE_PART_ANCHORS[id]!;
      expect(a.mode === 'onParent' && !a.ring.ground).toBe(true);
    }
  });

  it('hangs all three Nodes far above the leg and off the top of the idle frame', () => {
    // The Farplane idle camera looks from ~y 3 toward the field; 9 units up at
    // the leg's depth is well above the frame (measured live: y < 0 at 1600x900).
    const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 200);
    cam.position.set(0, 3, 9.5);
    cam.lookAt(0.3, 1.6, -2);
    cam.updateMatrixWorld();
    const leg = { x: 0.8, y: 0, z: -5, height: 4 };
    for (const id of ['node-a', 'node-b', 'node-c']) {
      const [x, y, z] = anchorPoint(FARPLANE_PART_ANCHORS[id]!, leg);
      expect(y).toBeGreaterThanOrEqual(9);
      const p = new Vector3(x, y, z).project(cam);
      expect(p.y).toBeGreaterThan(1); // NDC above the top edge
    }
  });
});

describe('PartRings', () => {
  it('draws a ring for an on-parent part only, and fades it out once the part is KO', () => {
    const root = new Group();
    const rings = new PartRings(root);
    rings.add('bulwark-r', FARPLANE_PART_ANCHORS['bulwark-r']!);
    rings.add('node-a', FARPLANE_PART_ANCHORS['node-a']!);
    expect(rings.snapshot().map((r) => r.id)).toEqual(['bulwark-r']);

    const body = { x: 0.8, y: 0, z: -5, height: 3.4 };
    rings.update(0.016, () => body, null);
    expect(rings.snapshot()[0]!.visible).toBe(true);

    rings.setAlive('bulwark-r', false);
    for (let i = 0; i < 120; i++) rings.update(0.05, () => body, null);
    expect(rings.snapshot()[0]!.visible).toBe(false);

    rings.dispose();
    expect(root.children.length).toBe(0);
  });
});

describe('Chapter 6 lane pin (FFX-2 only)', () => {
  it('keeps the Act I left flank off the party side', () => {
    const act1: FormationMember[] = [
      { id: 'ormi-entrance', height: 1.66 },
      { id: 'dr-goon', height: 1.162 },
      { id: 'fem-goon', height: 1.162 },
    ];
    const pinned = solveFormation(act1, { x: [0.0, 2.4], z: [-3.2, -6.8] });
    const derived = solveFormation(act1, { x: [-1.7, 3.6], z: [-3.2, -6.8] });
    const x = (slots: typeof pinned, id: string): number => slots.find((s) => s.id === id)!.spot[0];
    expect(x(derived, 'dr-goon')).toBeLessThan(0);
    expect(x(pinned, 'dr-goon')).toBeGreaterThan(0.3);
    expect(x(pinned, 'fem-goon')).toBeLessThan(2.4);
  });
});

describe("PR-0002 A: Yuna's slot (FFX only, Chapter 3)", () => {
  it('stands Yuna front-right of Tidus and right of Auron, clear of the command stack side', () => {
    const [front, yuna, back] = DREAMS_END_SLOTS.party;
    // Right of both (the stack is on the left), between them in depth.
    expect(yuna![0]).toBeGreaterThan(front![0] + 1.5);
    expect(yuna![0]).toBeGreaterThan(back![0] + 0.9);
    expect(yuna![2]).toBeLessThan(front![2]);
    expect(yuna![2]).toBeGreaterThan(back![2]);
    // Not stacked on anyone: well right of Tidus, and two units in front of Auron.
    expect(Math.abs(yuna![2] - back![2])).toBeGreaterThan(1.5);
  });
});

describe("PR-0002 A: Yuna's slot (FFX only, Chapter 2)", () => {
  it('stands Yuna right of where the old settle pushed her (-1.14), still left of Tidus', () => {
    const [front, yuna, back] = ZANARKAND_DOME_SLOTS.party;
    expect(yuna![0]).toBeGreaterThan(-1.0);
    expect(yuna![0]).toBeLessThan(front![0] - 0.8);
    expect(yuna![0]).toBeLessThan(back![0] - 1.5);
  });
});

describe("Vegnagun's body stands on its own spot at link 3 (FFX-2 only)", () => {
  it("is pinned on live's own spot (76f587c3), not the tail's slot, and published with the anchors", () => {
    const body = FARPLANE_ENEMY_SPOTS['vegnagun-body']!;
    expect(body).toEqual([5.75, 0, -10.0]);
    // Well right of and behind the tail's slot [0.8, 0, -5.0], where it stood behind Rikku and Paine.
    expect(body[0]).toBeGreaterThan(0.8 + 4);
    expect(body[2]).toBeLessThan(-5.0 - 4);
    expect(FARPLANE_STAGING.enemySpots).toBe(FARPLANE_ENEMY_SPOTS);
    expect(FARPLANE_STAGING.partAnchors).toBe(FARPLANE_PART_ANCHORS);
    // Pinned by combatant id, never by an anchored part's id.
    for (const id of Object.keys(FARPLANE_ENEMY_SPOTS)) expect(FARPLANE_PART_ANCHORS[id]).toBeUndefined();
  });
});
