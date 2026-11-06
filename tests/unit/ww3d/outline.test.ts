/**
 * **The inverted-hull outline** (`src/engine/ww3d/outline.ts`; the hidden anime chapter, FFX-2 only), pinned without a GPU: the program patch against three's own `MeshBasicMaterial` source, the welded normals (a hard edge
 * or a UV seam must not tear the line), and the hull itself: a second `SkinnedMesh` that shares the first's skeleton (so the line follows every pose), back faces only, with its per-vertex width.
 */
import { BackSide, BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, ShaderLib, SkinnedMesh, Vector4 } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { addOutline, createOutlineUniforms, makeOutlineMaterial, patchOutlineShader, weldedNormals } from '../../../src/engine/ww3d/outline.ts';
import type { ShaderLike } from '../../../src/engine/ww3d/toon.ts';
import { plainMesh, skinnedGirl } from '../helpers/animeFixtures.ts';

const row = { width: 0.0075, pow: 0.9, inner: 0.6, dark: '#2b160c', albedoMix: 0.35, albedoDark: 0.22 };
const basicProgram = (): ShaderLike => ({ vertexShader: ShaderLib['basic']!.vertexShader, fragmentShader: ShaderLib['basic']!.fragmentShader, uniforms: {} });

describe('the uniforms', () => {
  it('carry the row: width, depth exponent, inner share and the discard threshold (0.5 unless given), the line colour, the albedo tint', () => {
    const u = createOutlineUniforms(row);
    expect(u.uOutline.value).toEqual(new Vector4(0.0075, 0.9, 0.6, 0.5));
    expect(createOutlineUniforms({ ...row, discard: 0.2 }).uOutline.value.w).toBe(0.2);
    expect(u.uOutDark.value.getHexString()).toBe('2b160c');
    expect([u.uOutMix.value.x, u.uOutMix.value.y]).toEqual([0.35, 0.22]);
  });
});

describe('the program patch against three\'s own MeshBasicMaterial source', () => {
  it('replaces the projection with the view-space push along the skinned normal, discards the faces that look away, and adds the uniforms', () => {
    const u = createOutlineUniforms(row);
    const shader = basicProgram();
    expect(patchOutlineShader(shader, u)).toEqual({ ok: true, problems: [] });
    expect(shader.vertexShader).toContain('attribute float aThick;');
    expect(shader.vertexShader).toContain('mvPosition.xyz += nV * wOut;');
    expect(shader.vertexShader).toContain('vec3 hullN = objectNormal;'); // skinned: the normal three skinned first
    expect(shader.vertexShader).toContain('vec3 hullN = normal;'); // not skinned
    expect(shader.vertexShader).not.toContain('#include <project_vertex>');
    expect(shader.fragmentShader).toContain('discard;');
    expect(shader.fragmentShader).toContain('uOutDark');
    expect(Object.keys(shader.uniforms).sort()).toEqual(['uOutDark', 'uOutMix', 'uOutline']);
  });

  it('leaves the program untouched, and says why, when an include is missing', () => {
    const shader: ShaderLike = { vertexShader: 'void main() {}', fragmentShader: 'void main() {}', uniforms: {} };
    const r = patchOutlineShader(shader, createOutlineUniforms(row));
    expect(r.ok).toBe(false);
    expect(r.problems.length).toBeGreaterThan(0);
    expect(shader.vertexShader).toBe('void main() {}');
    expect(Object.keys(shader.uniforms)).toEqual([]);
  });

  it('the hull material draws back faces only, takes no fog, keeps the source\'s colour map and cut-out, and runs an extra vertex hook after the patch', () => {
    const hook = vi.fn();
    const m = makeOutlineMaterial(createOutlineUniforms(row), { alphaTest: 0.3 }, hook);
    expect(m).toBeInstanceOf(MeshBasicMaterial);
    expect([m.side, m.fog, m.alphaTest]).toEqual([BackSide, false, 0.3]);
    expect(m.customProgramCacheKey()).toBe('ww-outline-v1-x');
    expect(makeOutlineMaterial(createOutlineUniforms(row), {}).customProgramCacheKey()).toBe('ww-outline-v1');
    const shader = basicProgram();
    m.onBeforeCompile(shader as never, undefined as never);
    expect(shader.vertexShader).toContain('aThick');
    expect(hook).toHaveBeenCalledWith(shader);
  });
});

describe('welded normals', () => {
  /** Two triangles sharing the corner at the origin with different normals (a hard edge): the corner is two vertices. */
  const seam = (): BufferGeometry => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0]), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array([0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1]), 3));
    return g;
  };

  it('gives vertices at the same place one averaged, unit normal, and leaves the others', () => {
    const n = weldedNormals(seam());
    const s = Math.SQRT1_2;
    expect([n[0], n[1], n[2]].map((v) => +v!.toFixed(4))).toEqual([+s.toFixed(4), +s.toFixed(4), 0]);
    expect([n[3], n[4], n[5]]).toEqual([n[0], n[1], n[2]]);
    expect([n[6], n[7], n[8]]).toEqual([0, 0, 1]);
    for (let i = 0; i < 4; i++) expect(Math.hypot(n[i * 3]!, n[i * 3 + 1]!, n[i * 3 + 2]!)).toBeCloseTo(1, 5);
  });

  it('welds the normals it is given instead (the head\'s smoothed normals are not the ones the hull should push along)', () => {
    const g = seam();
    const own = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const n = weldedNormals(g, own);
    expect([n[0], n[1], n[2]]).toEqual([0, 0, 1]);
  });
});

describe('the hull', () => {
  it('of a skinned mesh is a second SkinnedMesh on the SAME skeleton and bind matrix, beside it, back faces, drawn after, casting and receiving nothing', () => {
    const girl = skinnedGirl();
    const hull = addOutline(girl.mesh, createOutlineUniforms(row), { force: true })!;
    expect(hull).toBeInstanceOf(SkinnedMesh);
    const h = hull as SkinnedMesh;
    expect(h.skeleton).toBe(girl.skeleton);
    expect(h.bindMatrix.equals(girl.mesh.bindMatrix)).toBe(true);
    expect(hull.parent).toBe(girl.mesh.parent);
    expect(hull.name).toBe('Mesh_0:outline');
    expect((hull.material as MeshBasicMaterial).side).toBe(BackSide);
    expect([hull.castShadow, hull.receiveShadow, hull.frustumCulled, hull.renderOrder]).toEqual([false, false, false, 1]);
    expect(hull.geometry).not.toBe(girl.mesh.geometry); // its own buffers: the normals are welded
    expect(hull.geometry.attributes['normal']).not.toBe(girl.mesh.geometry.attributes['normal']);
    expect(girl.mesh.geometry.attributes['aThick']).toBeUndefined();
  });

  it('carries the per-vertex width: full by default, the given weights (zero inside a face) when they match the vertex count, and ignores weights of the wrong length', () => {
    const a = skinnedGirl();
    const full = addOutline(a.mesh, createOutlineUniforms(row), { force: true })!;
    expect(Array.from((full.geometry.attributes['aThick'] as BufferAttribute).array)).toEqual([1, 1, 1, 1, 1, 1]);
    const b = skinnedGirl();
    const weights = new Float32Array([0, 0, 1, 1, 1, 1]);
    const some = addOutline(b.mesh, createOutlineUniforms(row), { force: true, weights })!;
    expect(Array.from((some.geometry.attributes['aThick'] as BufferAttribute).array)).toEqual([0, 0, 1, 1, 1, 1]);
    const c = skinnedGirl();
    const wrong = addOutline(c.mesh, createOutlineUniforms(row), { force: true, weights: new Float32Array(3) })!;
    expect((wrong.geometry.attributes['aThick'] as BufferAttribute).array.length).toBe(6);
  });

  it('is skipped for a double-sided or cut-out mesh unless forced (a hull of a flat card is a shifted copy of the card), and for a mesh told to skip', () => {
    const g = skinnedGirl(); // double sided
    expect((g.mesh.material as MeshBasicMaterial).side).toBe(DoubleSide);
    expect(addOutline(g.mesh, createOutlineUniforms(row))).toBeNull();
    expect(addOutline(g.mesh, createOutlineUniforms(row), { force: true, skip: true })).toBeNull();
    const card = plainMesh();
    new BufferAttribute(new Float32Array(1), 1);
    (card.material as MeshBasicMaterial).alphaTest = 0.5;
    const parent = new Mesh();
    parent.add(card);
    expect(addOutline(card, createOutlineUniforms(row))).toBeNull();
    expect(addOutline(card, createOutlineUniforms(row), { force: true })).not.toBeNull();
  });

  it('of a mesh with no skin is a plain Mesh with the source\'s transform; a mesh with no parent has no hull', () => {
    const root = new Mesh();
    const m = plainMesh();
    m.position.set(1, 2, 3);
    m.scale.setScalar(2);
    root.add(m);
    const hull = addOutline(m, createOutlineUniforms(row))!;
    expect(hull).not.toBeInstanceOf(SkinnedMesh);
    expect(hull).toBeInstanceOf(Mesh);
    expect(hull.position.toArray()).toEqual([1, 2, 3]);
    expect(hull.scale.x).toBe(2);
    expect(addOutline(plainMesh(), createOutlineUniforms(row))).toBeNull();
  });
});
