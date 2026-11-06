/**
 * **The face mask** (`src/engine/ww3d/faceMask.ts`; the hidden anime chapter, FFX-2 only), pinned without a renderer: the ellipse and the depth gate in head space, the smoothed head normals, the outline's zero width
 * inside the face, and the adapter that reads a loaded girl (a skinned mesh with `Head` and `head_end`) and writes `aFace`.
 */
import { BufferAttribute } from 'three';
import { describe, expect, it } from 'vitest';

import { FACE_FIT, faceMaskOf, fitFor, hullWeights, measureFace, smoothHeadNormals, sstep } from '../../../src/engine/ww3d/faceMask.ts';
import { skinnedGirl } from '../helpers/animeFixtures.ts';

const H = 0.3;
const fit = FACE_FIT.yuna;

/** One vertex in head space (x, y, z). */
const at = (...v: number[]): number[] => v;

describe('the ellipse in head space', () => {
  it('is 1 at its centre on the front of the face, 0 behind the head, 0 outside the ellipse, 0 without head weight', () => {
    const centre = at(0, fit.cy * H, 0.1);
    expect(faceMaskOf(centre, [1], H, fit)[0]).toBe(1);
    expect(faceMaskOf(at(0, fit.cy * H, -0.1), [1], H, fit)[0], 'behind the Head bone: hair').toBe(0);
    expect(faceMaskOf(at(fit.rx * H * 1.2, fit.cy * H, 0.1), [1], H, fit)[0], 'outside the ellipse').toBe(0);
    expect(faceMaskOf(at(0, (fit.cy + fit.ry * 1.2) * H, 0.1), [1], H, fit)[0]).toBe(0);
    expect(faceMaskOf(centre, [0.04], H, fit)[0], 'a vertex of the body').toBe(0);
  });

  it('falls off smoothly between the inner share and the rim, and with the head weight', () => {
    const x = (frac: number): number[] => at(fit.rx * H * frac, fit.cy * H, 0.1);
    const m = [0.5, 0.7, 0.85, 1.0].map((f) => faceMaskOf(x(f), [1], H, fit)[0]!);
    expect(m[0], 'inside the inner share (0.6)').toBe(1);
    expect(m[1]!).toBeLessThan(1);
    expect(m[1]!).toBeGreaterThan(m[2]!);
    expect(m[2]!).toBeGreaterThan(m[3]!);
    expect(m[3]).toBe(0);
    const w = [0.4, 0.55, 0.75, 1].map((hw) => faceMaskOf(at(0, fit.cy * H, 0.1), [hw], H, fit)[0]!);
    expect(w[0]!).toBeLessThan(w[1]!);
    expect(w[2]).toBe(1);
    expect(w[3]).toBe(1);
  });

  it('is per girl: Rikku\'s face is the biggest, Paine\'s the narrowest, an unknown id takes Yuna\'s', () => {
    expect(FACE_FIT.rikku.rx).toBeGreaterThan(FACE_FIT.yuna.rx);
    expect(FACE_FIT.paine.rx).toBeLessThan(FACE_FIT.yuna.rx);
    expect(fitFor('rikku')).toBe(FACE_FIT.rikku);
    expect(fitFor('x2-valefor')).toBe(FACE_FIT.yuna);
    expect(fitFor('toString')).toBe(FACE_FIT.yuna);
  });
});

describe('the smoothed head normals', () => {
  const pos = [0, 0.1, 0.1, 0, 0.1, -0.1, 0, 0, 0];
  const nor = [1, 0, 0, 1, 0, 0, 1, 0, 0];

  it('pull a face vertex hard toward the skull sphere, a hair vertex lightly, and leave a vertex with no head weight alone; the result is unit and the input is not changed', () => {
    const before = [...nor];
    const r = smoothHeadNormals(pos, nor, [1, 1, 0], [1, 0, 0], [0, 0, 0]);
    expect(nor).toEqual(before);
    const at0 = [r.normals[0]!, r.normals[1]!, r.normals[2]!];
    const at1 = [r.normals[3]!, r.normals[4]!, r.normals[5]!];
    expect(at0[2]!, 'the face normal turned toward +z, where the vertex is from the skull').toBeGreaterThan(at1[2]! * -1);
    expect(Math.abs(at0[0]! - 1), 'moved off the original').toBeGreaterThan(Math.abs(at1[0]! - 1) * 0.5);
    expect([r.normals[6], r.normals[7], r.normals[8]], 'no head weight: kept').toEqual([1, 0, 0]);
    for (let i = 0; i < 2; i++) expect(Math.hypot(r.normals[i * 3]!, r.normals[i * 3 + 1]!, r.normals[i * 3 + 2]!)).toBeCloseTo(1, 5);
    expect([r.headVerts, r.faceVerts]).toEqual([2, 1]);
  });
});

describe('the outline\'s width weight', () => {
  it('is zero inside the face, full on the hair, and keeps a thin contour when the face is not fully killed', () => {
    const mask = [1, 0.5, 0];
    const w = hullWeights(mask, 0.4);
    expect(w[0]).toBeCloseTo(0, 6);
    expect(w[2]).toBe(1);
    expect(w[1]!).toBeGreaterThan(0);
    expect(w[1]!).toBeLessThan(1);
    const thin = hullWeights(mask, 0.4, 0.5);
    expect(thin[0]!, 'half killed: the thin contour 0.4 of the rest').toBeCloseTo(1 - 0.5 - 0.5 * 0.4, 6);
  });

  it('sstep is the smoothstep the shader uses', () => {
    expect([sstep(0, 1, -1), sstep(0, 1, 0.5), sstep(0, 1, 2)]).toEqual([0, 0.5, 1]);
  });
});

describe('measuring a loaded girl', () => {
  it('finds the face on the right vertices, writes aFace, smooths the head\'s normals, and keeps the original normals for the hull', () => {
    const g = skinnedGirl();
    const before = Array.from(g.mesh.geometry.attributes['normal']!.array as Float32Array);
    const f = measureFace(g.scene, g.mesh, 'yuna')!;
    expect(f).not.toBeNull();
    expect(f.H).toBeCloseTo(0.3, 5);
    expect(f.origin.y).toBeCloseTo(1.3, 5);
    expect(Array.from(f.mask)[0], 'the face vertex').toBe(1);
    expect(f.mask[2], 'the hair behind the head').toBe(0);
    expect(f.mask[4], 'the hips').toBe(0);
    expect(f.hw[0]).toBe(1);
    expect(f.hw[4]).toBe(0);
    expect(Array.from(f.originalNormals)).toEqual(before);
    const aFace = g.mesh.geometry.attributes['aFace'] as BufferAttribute;
    expect(aFace.count).toBe(6);
    expect(Array.from(aFace.array)).toEqual(Array.from(f.mask));
    expect(Array.from(g.mesh.geometry.attributes['normal']!.array as Float32Array).slice(12, 18), 'the body\'s normals untouched').toEqual(before.slice(12, 18));
    expect(Array.from(g.mesh.geometry.attributes['normal']!.array as Float32Array).slice(0, 3)).not.toEqual(before.slice(0, 3));
    expect(f.headVerts).toBe(4);
    expect(f.faceVerts).toBeGreaterThanOrEqual(1);
  });

  it('measures a girl once (a second call sees aFace and returns null), and a figure with no head bones (a boss, a weapon) returns null', () => {
    const g = skinnedGirl();
    expect(measureFace(g.scene, g.mesh, 'yuna')).not.toBeNull();
    expect(measureFace(g.scene, g.mesh, 'yuna')).toBeNull();
    const headless = skinnedGirl();
    headless.scene.getObjectByName('head_end')!.removeFromParent();
    expect(measureFace(headless.scene, headless.mesh, 'yuna')).toBeNull();
  });

  it('takes a per-girl override of the fit (the proportion pass will re-fit it)', () => {
    const g = skinnedGirl();
    const far = measureFace(g.scene, g.mesh, 'yuna', { cy: 5 })!; // an ellipse five head-lengths above the head: no vertex is on it
    expect(Math.max(...Array.from(far.mask))).toBe(0);
    const h = skinnedGirl();
    const own = measureFace(h.scene, h.mesh, 'yuna')!;
    expect(Math.max(...Array.from(own.mask))).toBe(1);
  });
});
