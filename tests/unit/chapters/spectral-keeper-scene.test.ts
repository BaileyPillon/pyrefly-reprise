/**
 * The hidden Spectral Keeper's stage (FFX only): the seven glyph platforms are **drawn**. They are figure-less combatants on overhead anchors, and an overhead anchor drew nothing until it asked for a floor ring
 * (`floorRing`, `src/engine/PartAnchors.ts`): the ch-keeper review's major 1 (a player saw no platform, no sweep zone and no lit mine). Pure three.js, no renderer.
 */

import { describe, expect, it } from 'vitest';
import { Color, Group, PerspectiveCamera, type Mesh, type MeshBasicMaterial } from 'three';
import { LIT_RING_COLOUR, PART_RING_COLOUR, PartRings, type ParentPose, type PartAnchor } from '../../../src/engine/PartAnchors.ts';
import { FARPLANE_PART_ANCHORS } from '../../../src/scenes/farplane-parts.ts';
import { GARDEN_PART_ANCHORS } from '../../../src/scenes/garden-of-pain.ts';
import { GLYPH_RING_RADIUS, SPECTRAL_KEEPER_GLYPH_SPOTS, SPECTRAL_KEEPER_PART_ANCHORS } from '../../../src/scenes/spectral-keeper.ts';
import { SPECTRAL_ARMED_FLAG_PREFIX, SPECTRAL_CIRCLE_IDS } from '../../../src/data/ffx/spectral-keeper-ids.ts';

const keeper: ParentPose = { x: 1.55, y: 0, z: -4.6, height: 2.9 };
const camera = new PerspectiveCamera();
camera.position.set(0, 2, 10);
camera.lookAt(0, 1, -4);

function build(anchors: Record<string, PartAnchor>): { rings: PartRings; root: Group } {
  const root = new Group();
  const rings = new PartRings(root);
  for (const [id, a] of Object.entries(anchors)) rings.add(id, a);
  return { rings, root };
}

describe('the glyph platforms are drawn', () => {
  it('seven rings, one per Circle, with the platform 1 to 6 ring round the Keeper and the rock at the side', () => {
    const { rings, root } = build({ ...SPECTRAL_KEEPER_PART_ANCHORS });
    expect(root.children.length).toBe(7);
    rings.update(5, () => keeper, camera);
    const snap = rings.snapshot();
    expect(snap.map((s) => s.id).sort()).toEqual([...SPECTRAL_CIRCLE_IDS].sort());
    for (const [i, id] of SPECTRAL_CIRCLE_IDS.entries()) {
      const s = snap.find((r) => r.id === id)!;
      const spot = SPECTRAL_KEEPER_GLYPH_SPOTS[i]!;
      expect(s.visible, id).toBe(true);
      expect(s.opacity, id).toBeGreaterThan(0.5);
      expect(s.at[0], id).toBeCloseTo(spot[0], 5);
      expect(s.at[2], id).toBeCloseTo(spot[2], 5);
      expect(s.at[1], `${id} lies on the floor`).toBeCloseTo(0.03, 5);
    }
  });

  it('the rings lie flat (face up) and round, and no two overlap', () => {
    const { rings, root } = build({ ...SPECTRAL_KEEPER_PART_ANCHORS });
    rings.update(1, () => keeper, camera);
    for (const m of root.children) {
      expect(m.rotation.x).toBeCloseTo(-Math.PI / 2, 5);
      expect(m.scale.x).toBe(1);
      expect(m.scale.y).toBe(1);
    }
    const spots = SPECTRAL_KEEPER_GLYPH_SPOTS;
    for (let a = 0; a < spots.length; a++) {
      for (let b = a + 1; b < spots.length; b++) {
        const d = Math.hypot(spots[a]![0] - spots[b]![0], spots[a]![2] - spots[b]![2]);
        expect(d, `${a + 1} and ${b + 1}`).toBeGreaterThan(GLYPH_RING_RADIUS * 2);
      }
    }
  });

  it('a ring follows its parent (the Keeper hops, the platform goes with it) and fades with the parent gone', () => {
    const { rings } = build({ ...SPECTRAL_KEEPER_PART_ANCHORS });
    rings.update(5, () => ({ ...keeper, x: keeper.x + 1 }), camera);
    const first = rings.snapshot().find((r) => r.id === SPECTRAL_CIRCLE_IDS[0])!;
    expect(first.at[0]).toBeCloseTo(SPECTRAL_KEEPER_GLYPH_SPOTS[0]![0] + 1, 5);
    rings.update(5, () => undefined, camera);
    expect(rings.snapshot().every((r) => !r.visible)).toBe(true);
  });

  it('a ring turns amber while its Circle is armed (the engine\'s plat.armed flag), and only that ring, and settles back', () => {
    const { rings, root } = build({ ...SPECTRAL_KEEPER_PART_ANCHORS });
    const colourOf = (id: string): number => ((root.children.find((m) => m.name === `part-ring:${id}`) as Mesh).material as MeshBasicMaterial).color.getHex();
    const state = (armed: string[]): Parameters<PartRings['sync']>[1] => ({
      combatants: Object.fromEntries(SPECTRAL_CIRCLE_IDS.map((id) => [id, { alive: true }])) as never,
      flags: Object.fromEntries(armed.map((id) => [`plat.armed.${id}`, true])),
    });
    const violet = new Color(PART_RING_COLOUR).getHex();
    const amber = new Color(LIT_RING_COLOUR).getHex();
    const frames = (armed: string[], n: number): void => {
      for (let i = 0; i < n; i++) {
        for (const id of SPECTRAL_CIRCLE_IDS) rings.sync(id, state(armed));
        rings.update(0.25, () => keeper, camera);
      }
    };
    frames([], 20);
    for (const id of SPECTRAL_CIRCLE_IDS) expect(colourOf(id), `${id} unlit`).toBe(violet);
    frames([SPECTRAL_CIRCLE_IDS[2]!, SPECTRAL_CIRCLE_IDS[4]!], 30);
    expect(colourOf(SPECTRAL_CIRCLE_IDS[2]!)).toBe(amber);
    expect(colourOf(SPECTRAL_CIRCLE_IDS[4]!)).toBe(amber);
    for (const i of [0, 1, 3, 5, 6]) expect(colourOf(SPECTRAL_CIRCLE_IDS[i]!), `${SPECTRAL_CIRCLE_IDS[i]} stays violet`).toBe(violet);
    const lit = rings.snapshot().find((r) => r.id === SPECTRAL_CIRCLE_IDS[2])!;
    const idle = rings.snapshot().find((r) => r.id === SPECTRAL_CIRCLE_IDS[0])!;
    expect(lit.opacity).toBeGreaterThan(idle.opacity); // brighter as well as amber
    frames([], 60); // the blast: disarmed
    expect(colourOf(SPECTRAL_CIRCLE_IDS[2]!)).toBe(violet); // and the colour is put back exactly, not left a shade off
  });

  it('every glyph ring names its own Circle\'s flag, and the prefix is the data layer\'s', () => {
    for (const id of SPECTRAL_CIRCLE_IDS) {
      const a = SPECTRAL_KEEPER_PART_ANCHORS[id]!;
      expect(a.mode === 'overhead' && a.floorRing?.litFlag).toBe(`${SPECTRAL_ARMED_FLAG_PREFIX}${id}`);
    }
  });

  it('controls: an overhead anchor with no floor ring still draws nothing (Vegnagun nodes, the Mortiphasm discs); the Farplane foot rings are unchanged', () => {
    const nodes = Object.fromEntries(Object.entries(FARPLANE_PART_ANCHORS).filter(([, a]) => a.mode === 'overhead'));
    expect(Object.keys(nodes).length).toBeGreaterThan(0);
    expect(build(nodes).root.children.length).toBe(0);
    expect(build({ ...GARDEN_PART_ANCHORS }).root.children.length).toBe(0);
    const onParent = Object.fromEntries(Object.entries(FARPLANE_PART_ANCHORS).filter(([, a]) => a.mode === 'onParent'));
    expect(build(onParent).root.children.length).toBe(Object.keys(onParent).length);
  });
});
