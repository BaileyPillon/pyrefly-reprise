// PR-0300 (FFX-2 only: Chapters IV, XIII and XV): the painted plate keeps filling the frame at wide windows.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, Texture, type BufferAttribute } from 'three';
import type { Backdrop } from '../../src/engine/Backdrop.ts';
import { artUrl } from '../../src/engine/PaintedArt.ts';
import { addPlateWings, paintPlateWings, plateEdges } from '../../src/scenes/plateWings.ts';
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
  const backdrop = { group, adopt: (m: Mesh) => { group.add(m); adopted.push(m); }, adoptTexture: () => undefined } as unknown as Backdrop;
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

describe('D-343: painted wings replace the mirrored strips (FFX-2 only: Chapters IV, XIII and XV)', () => {
  const stripWorld = (plateWidth: number, spec: { stripPx: number; plateWidthPx: number }) => (plateWidth * spec.stripPx) / spec.plateWidthPx;
  const overlapWorld = (plateWidth: number, spec: { overlapPx: number; plateWidthPx: number }) => (plateWidth * spec.overlapPx) / spec.plateWidthPx;

  for (const [name, plateWidth, centreY, z, wing] of [
    ['den-of-woe (Chapter XV)', DEN_BACKDROP.width, DEN_BACKDROP.centreY, DEN_BACKDROP.distance, DEN_PLATE_WINGS],
    ['bevelle-underground (Chapters IV and XIII)', BEVELLE_UNDERGROUND_BACKDROP.width, BEVELLE_UNDERGROUND_BACKDROP.centreY, BEVELLE_UNDERGROUND_BACKDROP.distance, BEVELLE_PLATE_WINGS],
  ] as const) {
    it(`${name}: each strip is laid over the plate's edge and ends exactly where the mirrored wing ended`, async () => {
      const { backdrop, group } = fakeBackdrop(plateWidth, centreY, z);
      addPlateWings(backdrop, wing);
      const asked: string[] = [];
      const given = new Map<string, Texture>();
      const painted = await paintPlateWings(backdrop, wing, async (url) => {
        asked.push(url);
        const t = new Texture();
        given.set(url, t);
        return t;
      });
      expect(painted).toBe(2);
      expect([...asked].sort()).toEqual([wing.painted.left, wing.painted.right].map((p) => artUrl(p)).sort());
      const left = group.getObjectByName('backdrop-wing-left') as Mesh;
      const right = group.getObjectByName('backdrop-wing-right') as Mesh;
      const w = stripWorld(plateWidth, wing.painted);
      const o = overlapWorld(plateWidth, wing.painted);
      for (const [mesh, dir, art] of [[right, 1, wing.painted.right], [left, -1, wing.painted.left]] as const) {
        const g = mesh.geometry as PlaneGeometry;
        expect(g.parameters.width).toBeCloseTo(w, 6);
        expect(g.parameters.height).toBeCloseTo(plateWidth / IMAGE_ASPECT, 6);
        // the strip's inner edge is `overlapPx` painting pixels inside the plate's edge, its outer edge `wing.width` outside it
        const inner = mesh.position.x - dir * (w / 2);
        const outer = mesh.position.x + dir * (w / 2);
        expect(inner).toBeCloseTo(dir * (plateWidth / 2 - o), 6);
        // the strip is whole painting pixels (550 for the Den, 620 for Bevelle), so its outer edge is within a hundredth of a
        // world unit of the 18 the mirrored wing reached (17.99 for Bevelle); the coverage below is proved with the real extent
        expect(Math.abs(outer - dir * (plateWidth / 2 + wing.width))).toBeLessThan(0.01);
        expect(mesh.position.z).toBe(z);
        // drawn just after the plate, transparent so the alpha ramp cross-fades over the plate's own edge
        expect(mesh.renderOrder).toBe(-89);
        const mat = mesh.material as MeshBasicMaterial;
        expect(mat.transparent).toBe(true);
        expect(mat.map).toBe(given.get(artUrl(art)));
        // the standard UVs: the whole strip, once
        const uv = g.getAttribute('uv') as BufferAttribute;
        const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
        expect(Math.min(...us)).toBeCloseTo(0);
        expect(Math.max(...us)).toBeCloseTo(1);
      }
    });
  }

  for (const [name, rigs, plate, wing] of [
    ['den-of-woe (Chapter XV)', DEN_RIGS, DEN_BACKDROP, DEN_PLATE_WINGS],
    ['bevelle-underground (Chapters IV and XIII)', BEVELLE_UNDERGROUND_RIGS, BEVELLE_UNDERGROUND_BACKDROP, BEVELLE_PLATE_WINGS],
  ] as const) {
    it(`${name}: with the painted strips' own extent every rig is still fully covered at every window`, () => {
      const wingWorld = ((wing.painted.stripPx - wing.painted.overlapPx) * plate.width) / wing.painted.plateWidthPx;
      for (const aspect of ASPECTS) {
        for (const [rigName, rig] of Object.entries(rigs)) {
          const e = plateEdges(rig, aspect, { ...plate, width: plate.width + wingWorld * 2, imageAspect: IMAGE_ASPECT });
          expect(e.left, `${rigName} @${aspect.toFixed(2)} left`).toBeLessThanOrEqual(0);
          expect(e.right, `${rigName} @${aspect.toFixed(2)} right`).toBeGreaterThanOrEqual(1);
        }
      }
    });
  }

  it('a strip that is not there keeps its mirrored wing, and a side that loads is painted on its own', async () => {
    const { backdrop, group } = fakeBackdrop(88, -0.5, -48);
    addPlateWings(backdrop, DEN_PLATE_WINGS);
    const mirroredGeo = (group.getObjectByName('backdrop-wing-left') as Mesh).geometry;
    const painted = await paintPlateWings(backdrop, DEN_PLATE_WINGS, async (url) => (url.includes('right') ? new Texture() : null));
    expect(painted).toBe(1);
    const left = group.getObjectByName('backdrop-wing-left') as Mesh;
    expect(left.geometry).toBe(mirroredGeo); // untouched: still the 18-unit mirrored strip
    expect((left.geometry as PlaneGeometry).parameters.width).toBe(18);
    expect((left.material as MeshBasicMaterial).transparent).toBe(false);
    expect(((group.getObjectByName('backdrop-wing-right') as Mesh).geometry as PlaneGeometry).parameters.width).toBeCloseTo(stripWorld(88, DEN_PLATE_WINGS.painted), 6);
  });

  it('with no painted spec, or no painting mesh, nothing happens', async () => {
    const { backdrop, group } = fakeBackdrop(88, -0.5, -48);
    addPlateWings(backdrop, { width: 18, reflect: 0.2 });
    const before = (group.getObjectByName('backdrop-wing-right') as Mesh).geometry;
    expect(await paintPlateWings(backdrop, { width: 18, reflect: 0.2 }, async () => new Texture())).toBe(0);
    expect((group.getObjectByName('backdrop-wing-right') as Mesh).geometry).toBe(before);
    const bare = { group: new Group(), adopt: () => undefined } as unknown as Backdrop;
    expect(await paintPlateWings(bare, DEN_PLATE_WINGS, async () => new Texture())).toBe(0);
  });

  it('a placeholder plate (its own file missing) gets no painted wings and loads nothing', async () => {
    const { backdrop, group } = fakeBackdrop(88, -0.5, -48);
    (backdrop as unknown as { placeholder: boolean }).placeholder = true;
    addPlateWings(backdrop, DEN_PLATE_WINGS);
    let asked = 0;
    expect(await paintPlateWings(backdrop, DEN_PLATE_WINGS, async () => { asked++; return new Texture(); })).toBe(0);
    expect(asked).toBe(0);
    expect(((group.getObjectByName('backdrop-wing-right') as Mesh).geometry as PlaneGeometry).parameters.width).toBe(18);
  });

  it('a backdrop torn down while a strip loads is left alone and the texture is freed', async () => {
    const { backdrop, group } = fakeBackdrop(88, -0.5, -48);
    addPlateWings(backdrop, DEN_PLATE_WINGS);
    const tex = new Texture();
    let disposed = 0;
    tex.addEventListener('dispose', () => { disposed++; });
    const painting = paintPlateWings(backdrop, { ...DEN_PLATE_WINGS, sides: ['right'] }, async () => {
      group.getObjectByName('backdrop-wing-right')?.removeFromParent(); // the scene went away mid-load
      return tex;
    });
    expect(await painting).toBe(0);
    expect(disposed).toBe(1);
  });

  it('the strips the install put in public/art are the sizes the spec says (local art only: skipped where it is absent)', () => {
    for (const [wing, plateWidth] of [[DEN_PLATE_WINGS, DEN_BACKDROP.width], [BEVELLE_PLATE_WINGS, BEVELLE_UNDERGROUND_BACKDROP.width]] as const) {
      // the wing part of a strip is `wing.width` world units of the plate's pixels: 550 px for the Den (18 of 88), 620 px for Bevelle (18 of 78)
      expect(wing.painted.stripPx - wing.painted.overlapPx).toBe(Math.round((wing.width / plateWidth) * wing.painted.plateWidthPx));
      for (const side of ['left', 'right'] as const) {
        const file = join(process.cwd(), 'public', wing.painted[side]);
        if (!existsSync(file)) continue; // public/art is local-only: absent in a bare checkout
        const head = readFileSync(file).subarray(0, 24);
        expect(head.readUInt32BE(16), file).toBe(wing.painted.stripPx);
        expect(head.readUInt32BE(20), file).toBe(1536);
      }
    }
  });
});
