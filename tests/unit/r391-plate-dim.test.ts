/**
 * Release 39.1, B6 (FFX-2 only: Chapter IV's Bevelle plate): the lit pane strip behind the gap in Bahamut's neck is held down by a multiply on the
 * painting's own plane (`plateDim.ts`), the painting file untouched, the frame's alpha (FFX-2's bloom mask) unchanged.
 */
import { describe, expect, it } from 'vitest';
import { CustomBlending, Group, Mesh, MeshBasicMaterial, OneFactor, PlaneGeometry, SrcColorFactor, ZeroFactor, type ShaderMaterial } from 'three';
import type { Backdrop } from '../../src/engine/Backdrop.ts';
import { addPlateDim, plateDimFactor } from '../../src/scenes/plateDim.ts';
import { BEVELLE_PLATE_DIM, BEVELLE_UNDERGROUND_BACKDROP } from '../../src/scenes/bevelle-underground.ts';

function fakeBackdrop(withPainting = true): { backdrop: Backdrop; group: Group; adopted: Mesh[]; main: Mesh } {
  const group = new Group();
  const main = new Mesh(new PlaneGeometry(78, 44.57), new MeshBasicMaterial());
  main.name = 'backdrop-painting';
  main.position.set(0, -2.82, -50);
  main.renderOrder = -90;
  if (withPainting) group.add(main);
  const adopted: Mesh[] = [];
  const backdrop = { group, adopt: (m: Mesh) => { group.add(m); adopted.push(m); } } as unknown as Backdrop;
  return { backdrop, group, adopted, main };
}

describe("the dim factor (the shader's own rule)", () => {
  const spec = { at: [0.5, 0.5], radius: [0.1, 0.05], keep: 0.4 } as const;
  it('is `keep` at the centre and in the inner 55 percent of the ellipse, 1 at and beyond its edge, and rises smoothly between', () => {
    expect(plateDimFactor(spec, 0.5, 0.5)).toBeCloseTo(0.4, 10);
    expect(plateDimFactor(spec, 0.5 + 0.1 * 0.55, 0.5)).toBeCloseTo(0.4, 10);
    expect(plateDimFactor(spec, 0.6, 0.5)).toBeCloseTo(1, 10);
    expect(plateDimFactor(spec, 0.9, 0.9)).toBe(1);
    const mid = plateDimFactor(spec, 0.5 + 0.1 * 0.775, 0.5); // half way across the ramp
    expect(mid).toBeCloseTo(0.4 + 0.6 * 0.5, 6);
    let last = 0;
    for (let k = 0; k <= 10; k++) {
      const f = plateDimFactor(spec, 0.5 + 0.1 * (k / 10), 0.5);
      expect(f).toBeGreaterThanOrEqual(last - 1e-12);
      last = f;
    }
  });
});

describe("the dim mesh on the painting's plane", () => {
  it('multiplies the picture (colour) and leaves the frame alpha alone, a hair in front of the plate, after the plate and its lamp layer, before the nearer plates', () => {
    const { backdrop, adopted, main } = fakeBackdrop();
    const mesh = addPlateDim(backdrop, BEVELLE_PLATE_DIM)!;
    expect(adopted).toEqual([mesh]);
    const m = mesh.material as ShaderMaterial;
    expect(m.blending).toBe(CustomBlending);
    expect([m.blendSrc, m.blendDst]).toEqual([ZeroFactor, SrcColorFactor]); // colour: what is there times the factor
    expect([m.blendSrcAlpha, m.blendDstAlpha]).toEqual([ZeroFactor, OneFactor]); // alpha: what is there
    expect(m.depthWrite).toBe(false);
    expect(mesh.position.x).toBe(main.position.x);
    expect(mesh.position.y).toBe(main.position.y);
    expect(mesh.position.z).toBeGreaterThan(main.position.z);
    expect(mesh.position.z - main.position.z).toBeLessThan(0.05);
    expect(mesh.renderOrder).toBeGreaterThan(-89); // after plate 0 (-90) and its lamps (-89)
    expect(mesh.renderOrder).toBeLessThan(-87); // before plate 1 (-87)
    const g = mesh.geometry as PlaneGeometry;
    expect([g.parameters.width, g.parameters.height]).toEqual([78, 44.57]);
    // the painting's v runs down, the shader's up
    const u = (m.uniforms['uDim']!.value as { toArray(): number[] }).toArray();
    expect(u[0]).toBeCloseTo(BEVELLE_PLATE_DIM.at[0], 10);
    expect(u[1]).toBeCloseTo(1 - BEVELLE_PLATE_DIM.at[1], 10);
  });

  it('is nothing for a backdrop with no painting plane', () => {
    const { backdrop, adopted } = fakeBackdrop(false);
    expect(addPlateDim(backdrop, BEVELLE_PLATE_DIM)).toBeNull();
    expect(adopted).toEqual([]);
  });
});

describe("Chapter IV's dim sits on the lit strip behind the neck gap", () => {
  it("its centre is inside the painting's pane strip (u 0.44-0.565, v 0.11-0.155) and it holds the picture well under its brightness there", () => {
    const [u, v] = BEVELLE_PLATE_DIM.at;
    expect(u).toBeGreaterThan(0.44);
    expect(u).toBeLessThan(0.565);
    expect(v).toBeGreaterThan(0.11);
    expect(v).toBeLessThan(0.155);
    expect(BEVELLE_PLATE_DIM.keep).toBeLessThan(0.6);
    expect(BEVELLE_PLATE_DIM.keep).toBeGreaterThan(0.2); // a muted strip, not a hole: the panes still read
    // the strip's own ends are inside the ramp, so the dim does not stop at a line
    expect(plateDimFactor(BEVELLE_PLATE_DIM, 0.44, 0.14)).toBeGreaterThan(plateDimFactor(BEVELLE_PLATE_DIM, 0.503, 0.14));
    // the dim stays far from the plate's edges (the wings and the layer ends)
    expect(plateDimFactor(BEVELLE_PLATE_DIM, 0.1, 0.5)).toBe(1);
    expect(plateDimFactor(BEVELLE_PLATE_DIM, 0.9, 0.5)).toBe(1);
    expect(BEVELLE_UNDERGROUND_BACKDROP.width).toBe(78);
  });
});
