// PR-0300 (FFX-2 only: Chapters IV, XIII and XV): the painted plate keeps filling the frame at wide windows.
import { describe, expect, it } from 'vitest';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, type BufferAttribute } from 'three';
import type { Backdrop } from '../../src/engine/Backdrop.ts';
import { addPlateWings, plateEdges } from '../../src/scenes/plateWings.ts';
import { DEN_BACKDROP, DEN_PLATE_WINGS, DEN_RIGS } from '../../src/scenes/den-of-woe.ts';
import { BEVELLE_PLATE_WINGS, BEVELLE_UNDERGROUND_BACKDROP, BEVELLE_UNDERGROUND_RIGS } from '../../src/scenes/bevelle-underground.ts';

const IMAGE_ASPECT = 2688 / 1536;
/** The windows the game ships to: 16:9, the critic's 2000x1012, a 21:9 monitor (2560x1080, 2.37). */
const ASPECTS = [1.5, 16 / 9, 2000 / 1012, 2.37];

function fakeBackdrop(width: number, centreY: number, z: number): { backdrop: Backdrop; group: Group; adopted: Mesh[] } {
  const group = new Group();
  const main = new Mesh(new PlaneGeometry(width, width / IMAGE_ASPECT), new MeshBasicMaterial());
  main.name = 'backdrop-painting';
  main.position.set(0, centreY, z);
  main.renderOrder = -90;
  group.add(main);
  const adopted: Mesh[] = [];
  const backdrop = { group, adopt: (m: Mesh) => { group.add(m); adopted.push(m); } } as unknown as Backdrop;
  return { backdrop, group, adopted };
}

describe('plate wings', () => {
  it('builds a mirrored strip on each side at the plate depth, named as the painting\'s own', () => {
    const { backdrop, adopted } = fakeBackdrop(88, -0.5, -48);
    const wings = addPlateWings(backdrop, DEN_PLATE_WINGS);
    expect(wings.map((w) => w.name)).toEqual(['backdrop-wing-left', 'backdrop-wing-right']);
    expect(adopted).toHaveLength(2);
    const [left, right] = wings as [Mesh, Mesh];
    expect(right.position.x).toBeCloseTo(44 + 9);
    expect(left.position.x).toBeCloseTo(-44 - 9);
    expect(right.position.z).toBe(-48);
    expect(right.renderOrder).toBe(-90);
    // The strip reads the plate's outer 20 %, reversed: the right wing's left edge is the plate's right edge (u 1).
    const ru = right.geometry.getAttribute('uv') as BufferAttribute;
    const us = Array.from({ length: ru.count }, (_, i) => ru.getX(i));
    expect(Math.max(...us)).toBeCloseTo(1);
    expect(Math.min(...us)).toBeCloseTo(0.8);
    const lu = left.geometry.getAttribute('uv') as BufferAttribute;
    const ls = Array.from({ length: lu.count }, (_, i) => lu.getX(i));
    expect(Math.min(...ls)).toBeCloseTo(0);
    expect(Math.max(...ls)).toBeCloseTo(0.2);
    // The joins: the wing's vertex nearest the plate carries the plate's own edge column.
    const rp = right.geometry.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < rp.count; i++) if (rp.getX(i) < 0) expect(ru.getX(i)).toBeCloseTo(1);
    // It shares the painting's texture and grade (a clone of the plate's material), not the plate's material itself.
    expect((right.material as MeshBasicMaterial)).not.toBe((backdrop.group.getObjectByName('backdrop-painting') as Mesh).material);
  });

  it('adds nothing when the backdrop has no painting mesh', () => {
    const backdrop = { group: new Group(), adopt: () => undefined } as unknown as Backdrop;
    expect(addPlateWings(backdrop, DEN_PLATE_WINGS)).toEqual([]);
  });
});

describe('PR-0300: the plate edge against every rig and window', () => {
  const winged = (plate: { width: number; distance: number; centreY: number }, wing: { width: number }) => ({
    ...plate,
    width: plate.width + wing.width * 2,
    imageAspect: IMAGE_ASPECT,
  });

  it('the defect, as the round measured it: Chapter XV intro rig, 2000x1012, the plane ends at 94 % of the frame', () => {
    const e = plateEdges(DEN_RIGS['intro']!, 2000 / 1012, { ...DEN_BACKDROP, imageAspect: IMAGE_ASPECT });
    expect(e.right).toBeGreaterThan(0.93);
    expect(e.right).toBeLessThan(0.96);
  });

  for (const [name, rigs, plate, wing] of [
    ['den-of-woe (Chapter XV)', DEN_RIGS, DEN_BACKDROP, DEN_PLATE_WINGS],
    ['bevelle-underground (Chapters IV and XIII)', BEVELLE_UNDERGROUND_RIGS, BEVELLE_UNDERGROUND_BACKDROP, BEVELLE_PLATE_WINGS],
  ] as const) {
    it(`${name}: with the wings every rig is fully covered, left and right, at every window`, () => {
      for (const aspect of ASPECTS) {
        for (const [rigName, rig] of Object.entries(rigs)) {
          const e = plateEdges(rig, aspect, winged(plate, wing));
          expect(e.left, `${rigName} @${aspect.toFixed(2)} left`).toBeLessThanOrEqual(0);
          expect(e.right, `${rigName} @${aspect.toFixed(2)} right`).toBeGreaterThanOrEqual(1);
        }
      }
    });
  }
});
