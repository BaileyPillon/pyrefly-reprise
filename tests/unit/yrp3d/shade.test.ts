/**
 * **The soft look** (`src/engine/yrp3d/shade.ts`, `flap.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only), on three's real materials and no renderer. What it pins:
 *
 * 1. **The diffuse look** (the real humans and the game's Bahamut): the file's colour map and colour kept, the alpha test and sidedness kept (the hair and the cloth are cut-outs, the cloth double-sided), `SHADE`'s high
 *    roughness, no metal, no environment, and none of the normal, roughness, metalness or emissive maps (no gloss comes back); an emissive of black to be driven.
 * 2. **The pbr look** (the AI boss): the file's own material kept whole: every map and its roughness and metalness; the emissive ours.
 * 3. **Sharing and channels**: one material per source material however many meshes share it; the figure's colour, glow and opacity drive them (transparent only while fading); meshes never culled, cast but do not receive shadows,
 *    are on the figure layer as well as the default one (the wet floor's mirror draws that layer alone), and no fog reaches the figures' materials (`LOOK.figure.fog`).
 * 4. **The flap**: patched into every material of a model by one set of cells, with the displacement past the shoulder only; the uniform cells are shared by reference.
 */
import { BoxGeometry, Color, DataTexture, DoubleSide, FrontSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';
import { describe, expect, it } from 'vitest';

import { flapSpecOf, makeFlap, patchFlap, setFlap, withFlap, SHOULDER_SHARE } from '../../../src/engine/yrp3d/flap.ts';
import { SHADE } from '../../../src/engine/yrp3d/layout.ts';
import { LAYER, LOOK } from '../../../src/engine/yrp3d/look.ts';
import { disposeShade, drive, shadeMaterialOf, shadeify } from '../../../src/engine/yrp3d/shade.ts';

const tex = (): DataTexture => new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);

/** A glTF-like material with every map a scan ships. */
function loaded(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    name: 'cloth',
    color: 0xffeedd,
    map: tex(),
    normalMap: tex(),
    roughnessMap: tex(),
    metalnessMap: tex(),
    emissiveMap: tex(),
    emissive: new Color(0x223344),
    roughness: 0.3,
    metalness: 0.9,
    envMapIntensity: 2,
    alphaTest: 0.5,
    side: DoubleSide,
  });
}

describe('the diffuse look', () => {
  it('keeps the colour map, the colour, the alpha test and the sidedness, and nothing that makes gloss', () => {
    const src = loaded();
    const m = shadeMaterialOf(src);
    expect(m).not.toBe(src);
    expect(m.map).toBe(src.map);
    expect(m.map!.colorSpace).toBe(SRGBColorSpace);
    expect(m.map!.anisotropy).toBe(SHADE.anisotropy);
    expect(m.color.getHex()).toBe(src.color.getHex());
    expect([m.alphaTest, m.side, m.name]).toEqual([0.5, DoubleSide, 'cloth']);
    expect([m.roughness, m.metalness, m.envMapIntensity]).toEqual([SHADE.roughness, 0, 0]);
    expect([m.normalMap, m.roughnessMap, m.metalnessMap, m.emissiveMap]).toEqual([null, null, null, null]);
    expect(m.emissive.getHex()).toBe(0); // black, to be driven
    expect([m.transparent, m.opacity]).toEqual([false, 1]);
  });

  it('takes a plain material (a basic one, a test figure) as a colour and a map', () => {
    const m = shadeMaterialOf(new MeshBasicMaterial({ color: 0x336699 }));
    expect([m.color.getHex(), m.map, m.side]).toEqual([0x336699, null, FrontSide]);
  });
});

describe('the pbr look', () => {
  it("keeps the file's own material whole: every map, its roughness and metalness; the glow is ours", () => {
    const src = loaded();
    const m = shadeMaterialOf(src, 'pbr');
    expect(m).not.toBe(src); // its own copy: the figure's channels never write the file's
    expect([m.map, m.normalMap, m.roughnessMap, m.metalnessMap]).toEqual([src.map, src.normalMap, src.roughnessMap, src.metalnessMap]);
    expect([m.roughness, m.metalness, m.alphaTest, m.side]).toEqual([0.3, 0.9, 0.5, DoubleSide]);
    expect([m.emissiveMap, m.emissive.getHex(), m.envMapIntensity]).toEqual([null, 0, SHADE.envMapIntensity]);
    expect(m.map!.anisotropy).toBe(SHADE.anisotropy);
    drive({ materials: [m], meshes: [], geometries: new Set(), textures: new Set() }, { colour: new Color(0.5, 0.5, 0.5), emissive: new Color(1, 0, 0), amount: 1, opacity: 1 });
    expect(src.emissive.getHex()).toBe(0x223344); // untouched
    expect(src.color.getHex()).toBe(0xffeedd);
  });

  it('turns a plain material into a standard one with a sensible roughness', () => {
    const m = shadeMaterialOf(new MeshBasicMaterial({ color: 0x336699 }), 'pbr');
    expect([m.color.getHex(), m.roughness, m.metalness]).toEqual([0x336699, 0.85, 0]);
  });
});

describe('sharing, channels and meshes', () => {
  it('gives one material per source material however many meshes share it, covers a material array, and sets the meshes up', () => {
    const root = new Object3D();
    const shared = new MeshStandardMaterial({ color: 0x884422 });
    const a = new Mesh(new BoxGeometry(), shared);
    const b = new Mesh(new BoxGeometry(), shared);
    const c = new Mesh(new BoxGeometry(), [new MeshStandardMaterial(), new MeshStandardMaterial()]);
    root.add(a, b, c);
    const set = shadeify(root);
    expect(set.materials).toHaveLength(3); // one for the shared, two for the array
    expect(a.material).toBe(b.material);
    expect(Array.isArray(c.material)).toBe(true);
    expect(set.meshes).toEqual([a, b, c]);
    for (const m of [a, b, c]) expect([m.castShadow, m.receiveShadow, m.frustumCulled]).toEqual([true, false, false]);
    expect(set.geometries.size).toBe(3);
  });

  it('puts every mesh on the figure layer as well as the default one, and keeps fog off the figures materials in both looks', () => {
    const root = new Object3D();
    const a = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    const nested = new Object3D();
    const b = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    nested.add(b);
    root.add(a, nested);
    for (const look of ['diffuse', 'pbr'] as const) {
      const set = shadeify(root.clone(true), { look });
      for (const m of set.meshes) expect([m.layers.isEnabled(0), m.layers.isEnabled(LAYER.figure), m.layers.isEnabled(LAYER.backdrop)], look).toEqual([true, true, false]);
      for (const m of set.materials) expect(m.fog, look).toBe(LOOK.figure.fog);
    }
    expect(LOOK.figure.fog).toBe(false);
    expect(shadeMaterialOf(new MeshBasicMaterial({ color: 0x336699 })).fog).toBe(false);
    expect(shadeMaterialOf(new MeshBasicMaterial({ color: 0x336699 }), 'pbr').fog).toBe(false);
  });

  it('drives colour, glow and opacity on every material, going transparent only while fading', () => {
    const root = new Object3D();
    root.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: 0x808080 })));
    const set = shadeify(root);
    const m = set.materials[0]!;
    const base = new Color(0x808080);
    drive(set, { colour: new Color(0.5, 1, 1), emissive: new Color(0, 1, 0), amount: 0.4, opacity: 1 });
    expect(m.color.r).toBeCloseTo(base.r * 0.5, 6);
    expect(m.color.g).toBeCloseTo(base.g, 6);
    expect(m.emissive.g).toBeCloseTo(0.4, 6);
    expect([m.transparent, m.opacity]).toEqual([false, 1]);
    drive(set, { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 0.3 });
    expect([m.transparent, m.opacity]).toEqual([true, 0.3]);
    drive(set, { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 1 });
    expect([m.transparent, m.opacity]).toEqual([false, 1]);
  });

  it("frees the materials, and the file's geometry and textures only when asked", () => {
    const root = new Object3D();
    const geometry = new BoxGeometry();
    root.add(new Mesh(geometry, new MeshStandardMaterial({ map: tex() })));
    const set = shadeify(root);
    let freed = 0;
    set.materials[0]!.addEventListener('dispose', () => freed++);
    geometry.addEventListener('dispose', () => freed++);
    disposeShade(set);
    expect(freed).toBe(1); // the material alone
    disposeShade(set, true);
    expect(freed).toBeGreaterThanOrEqual(2); // and now the geometry too
  });
});

describe('the wing flap', () => {
  it('reads the wingspan from the meshes and puts the shoulder at the stated share of it', () => {
    const root = new Object3D();
    root.add(new Mesh(new BoxGeometry(10, 2, 2)));
    const spec = flapSpecOf(root)!;
    expect(spec.halfSpan).toBe(5);
    expect(spec.shoulder).toBeCloseTo(SHOULDER_SHARE * 10, 9);
    expect(flapSpecOf(new Object3D())).toBeNull();
  });

  it('adds the displacement to a vertex shader after begin_vertex, past the shoulder only (a smoothstep from the shoulder to the tip), mostly up and down with a little forward', () => {
    const shader = { vertexShader: '#include <common>\nvoid main() {\n#include <begin_vertex>\n#include <project_vertex>\n}' };
    withFlap(shader);
    expect(shader.vertexShader).toContain('uniform float uFlapTime;');
    expect(shader.vertexShader.indexOf('transformed.y += yrpFlap')).toBeGreaterThan(shader.vertexShader.indexOf('#include <begin_vertex>'));
    expect(shader.vertexShader.indexOf('transformed.y += yrpFlap')).toBeLessThan(shader.vertexShader.indexOf('#include <project_vertex>'));
    expect(shader.vertexShader).toContain('smoothstep( uFlapShoulder, uFlapHalf, yrpAx )');
    expect(shader.vertexShader).toContain('transformed.z += yrpFlap * 0.22');
  });

  it('patches every material of a model with one set of cells, shared by reference, under a program key of its own', () => {
    const root = new Object3D();
    root.add(new Mesh(new BoxGeometry(10, 2, 2), new MeshStandardMaterial()), new Mesh(new BoxGeometry(4, 2, 2), new MeshStandardMaterial()));
    const flap = makeFlap(flapSpecOf(root)!);
    const set = shadeify(root, { flap });
    expect(set.materials).toHaveLength(2);
    for (const m of set.materials) {
      expect(m.customProgramCacheKey()).toContain('yrp-flap');
      const shader = { uniforms: {} as Record<string, unknown>, vertexShader: '#include <common>\n#include <begin_vertex>' };
      m.onBeforeCompile(shader as never, undefined as never);
      expect(shader.uniforms['uFlapTime']).toBe(flap.uFlapTime); // the cell itself: one write moves every material
      expect(shader.vertexShader).toContain('yrpFlap');
    }
    setFlap(flap, 2.5, 0.4);
    expect([flap.uFlapTime.value, flap.uFlapAmp.value]).toEqual([2.5, 0.4]);
    const plain = shadeify(new Object3D());
    expect(plain.materials).toHaveLength(0);
    patchFlap(new MeshStandardMaterial(), flap); // patching a bare material is fine
  });
});
