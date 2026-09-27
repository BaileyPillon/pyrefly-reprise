/**
 * PR-0095 remainder (iteration 2 B3; FFX-2 only, Chapter V): the Bulwark rings
 * in the picked colossus frames (docs/concepts/vegnagun-colossus-2026-09-26/
 * 02 and 05) are upright, camera-facing ellipses squashed to 0.46 of their
 * height: the mock turned a ground ring upright and kept its 0.46 floor squash
 * (docs/handoff/iter2-vegnagun-a.md, CHECK finding 1). The Redoubt rings stay
 * round. The squash is a per-anchor field, inert for every other ring.
 */
import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, type Mesh } from 'three';
import { GROUND_RING_SQUASH, PartRings, type OnParentAnchor } from '../../src/engine/PartAnchors.ts';
import { colossusStaging } from '../../src/scenes/farplane-colossus.ts';

const PAINT = { width: 1213, height: 827, baselineY: 811, contentTop: 40 };
const parent = { x: 0, y: 0, z: 0, height: 4 };

function ringScaleY(anchor: OnParentAnchor): number {
  const root = new Group();
  const rings = new PartRings(root);
  rings.add('p', anchor);
  const cam = new PerspectiveCamera();
  cam.position.set(0, 2, 10);
  cam.lookAt(0, 2, 0);
  rings.update(0.1, () => parent, cam);
  return (root.children[0] as Mesh).scale.y;
}

describe('part rings: the flattened Bulwark rings of the picked frame', () => {
  it('an upright ring with a squash keeps it; an upright ring without one is round; a ground ring is flat', () => {
    expect(ringScaleY({ mode: 'onParent', px: [100, 700], paint: PAINT, ring: { radius: 1, ground: false, squash: GROUND_RING_SQUASH } })).toBeCloseTo(0.46, 5);
    expect(ringScaleY({ mode: 'onParent', px: [100, 700], paint: PAINT, ring: { radius: 1, ground: false } })).toBe(1);
    expect(ringScaleY({ mode: 'onParent', px: [100, 811], paint: PAINT, ring: { radius: 1, ground: true } })).toBeCloseTo(0.46, 5);
  });

  for (const phone of [false, true]) {
    it(`the colossus squashes the Bulwark rings and leaves the Redoubts round (${phone ? 'phone' : 'desktop'})`, () => {
      const a = colossusStaging(phone).partAnchors;
      for (const id of ['bulwark-r', 'bulwark-l']) {
        const b = a[id]!;
        expect(b.mode === 'onParent' && b.ring.ground === false && b.ring.squash, id).toBe(GROUND_RING_SQUASH);
      }
      for (const id of ['redoubt-r', 'redoubt-l']) {
        const r = a[id]!;
        expect(r.mode === 'onParent' && (r.ring.squash ?? 1), id).toBe(1);
      }
    });
  }
});
