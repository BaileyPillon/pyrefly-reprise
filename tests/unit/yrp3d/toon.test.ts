/**
 * **The painted-toon look** (`src/engine/yrp3d/toon.ts`; the hidden 3D Bahamut chapter, FFX-2 only): the ramp texture, the toon material built from a loaded one, the inverted-hull ink for a plain and a skinned mesh, the
 * channels the figure drives, and the freeing. Built with three's real classes and no renderer (nothing here needs WebGL).
 */
import {
  BackSide,
  BoxGeometry,
  Bone,
  Color,
  DataTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Texture,
  Uint16BufferAttribute,
  Float32BufferAttribute,
} from 'three';
import { describe, expect, it, vi } from 'vitest';

import { TOON, rampAt } from '../../../src/engine/yrp3d/layout.ts';
import { SHOULDER_SHARE, disposeToon, drive, flapSpecOf, inkMaterial, makeFlap, setFlap, setInkThickness, toonMaterialOf, toonRamp, toonify, withFlap } from '../../../src/engine/yrp3d/toon.ts';

const white = (): Color => new Color(1, 1, 1);

describe('the ramp', () => {
  it('is 64 texels wide, linearly filtered (so the soft steps stay soft), grey, and the shape of rampAt', () => {
    const ramp = toonRamp();
    const data = ramp.image.data as Uint8Array;
    expect([ramp.image.width, ramp.image.height]).toEqual([64, 1]);
    expect([ramp.minFilter, ramp.magFilter, ramp.generateMipmaps]).toEqual([LinearFilter, LinearFilter, false]);
    let previous = -1;
    for (let i = 0; i < 64; i++) {
      const [r, g, b, a] = [data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!, data[i * 4 + 3]!];
      expect([r === g, g === b, a]).toEqual([true, true, 255]);
      expect(r).toBe(Math.round(255 * rampAt((i + 0.5) / 64)));
      expect(r).toBeGreaterThanOrEqual(previous);
      previous = r;
    }
    expect(data[0]).toBe(Math.round(255 * TOON.bands[0]!));
    expect(data[63 * 4]).toBe(255);
  });

  it('can be made at another width', () => {
    expect(toonRamp(16).image.width).toBe(16);
  });
});

describe('the toon material', () => {
  it('keeps the file\'s base colour map (read as sRGB) and colour, takes the ramp, and drops every other map', () => {
    const map = new Texture();
    const src = new MeshStandardMaterial({ name: 'skin', map, color: new Color(0.5, 0.25, 1), normalMap: new Texture(), metalnessMap: new Texture(), roughnessMap: new Texture() });
    const ramp = toonRamp();
    const toon = toonMaterialOf(src, ramp);
    expect(toon).toBeInstanceOf(MeshToonMaterial);
    expect([toon.name, toon.map, toon.gradientMap]).toEqual(['skin', map, ramp]);
    expect(map.colorSpace).toBe(SRGBColorSpace);
    expect(toon.color.toArray()).toEqual(new Color(0.5, 0.25, 1).toArray());
    expect([toon.normalMap, toon.emissiveMap]).toEqual([null, null]);
    expect(toon.emissive.getHex()).toBe(0);
    expect(toon.transparent).toBe(false);
  });

  it('is plain white-on-grey when the source has no map and no colour', () => {
    const toon = toonMaterialOf(new MeshBasicMaterial(), toonRamp());
    expect(toon.map).toBeNull();
    expect(toon.color.getHex()).toBe(0xffffff);
  });
});

describe('the ink', () => {
  it('draws back faces only, flat, unfogged and untone-mapped', () => {
    const ink = inkMaterial(0.02);
    expect([ink.side, ink.fog, ink.toneMapped, ink.color.getHex()]).toEqual([BackSide, false, false, TOON.ink]);
  });

  it('pushes each vertex out along its normal after skinning: the patched shader carries the uniform, the skinned normal when the mesh is skinned, and one program for every hull', () => {
    const ink = inkMaterial(0.02);
    const shader = { uniforms: {} as Record<string, { value: number }>, vertexShader: '#include <common>\nvoid main() {\n#include <skinning_vertex>\n#include <project_vertex>\n}' };
    (ink.onBeforeCompile as (s: typeof shader, r: unknown) => void)(shader, null);
    expect(shader.vertexShader).toContain('uniform float uInk;');
    expect(shader.vertexShader).toContain('#ifdef USE_SKINNING\n  transformed += normalize( objectNormal ) * uInk;\n#else\n  transformed += normalize( normal ) * uInk;\n#endif');
    expect(shader.vertexShader.indexOf('skinning_vertex')).toBeLessThan(shader.vertexShader.indexOf('transformed +='));
    expect(shader.vertexShader.indexOf('transformed +=')).toBeLessThan(shader.vertexShader.indexOf('project_vertex'));
    expect(shader.uniforms['uInk']!.value).toBe(0.02);
    expect(ink.customProgramCacheKey()).toBe('yrp-ink-hull');
    expect(inkMaterial(0.5).customProgramCacheKey()).toBe(ink.customProgramCacheKey());
  });

  it('changes thickness through the one uniform cell the compiled program reads, with no recompile', () => {
    const ink = inkMaterial(0.02);
    const shader = { uniforms: {} as Record<string, { value: number }>, vertexShader: '#include <common>\n#include <skinning_vertex>' };
    (ink.onBeforeCompile as (s: typeof shader, r: unknown) => void)(shader, null);
    setInkThickness(ink, 0.07);
    expect(shader.uniforms['uInk']!.value).toBe(0.07);
  });
});

/** A group with two meshes that share one material and one with its own. */
function scene(): { root: Group; a: Mesh; b: Mesh; c: Mesh; shared: MeshStandardMaterial } {
  const shared = new MeshStandardMaterial({ color: 0xff0000, map: new Texture() });
  const root = new Group();
  const a = new Mesh(new BoxGeometry(1, 2, 1), shared);
  const b = new Mesh(new BoxGeometry(1, 1, 1), shared);
  const c = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 0x00ff00 }));
  a.position.set(0, 1, 0);
  b.position.set(1, 2.5, 0);
  c.rotation.y = 0.5;
  const arm = new Group();
  arm.add(b);
  root.add(a, arm, c);
  return { root, a, b, c, shared };
}

describe('toonify', () => {
  it('swaps every mesh\'s material for a toon one (one per source material), puts a hull beside each, and says what it made', () => {
    const { root, a, b, c, shared } = scene();
    const set = toonify(root, 0.03);
    expect(set.materials).toHaveLength(2); // the shared one is made once
    expect(a.material).toBe(b.material);
    expect(a.material).not.toBe(shared);
    expect(a.material).toBeInstanceOf(MeshToonMaterial);
    expect(c.material).toBeInstanceOf(MeshToonMaterial);
    expect(set.hulls).toHaveLength(3);
    for (const mesh of [a, b, c]) {
      expect([mesh.castShadow, mesh.receiveShadow, mesh.frustumCulled]).toEqual([true, true, false]);
      const hull = mesh.parent!.children.find((o) => o.userData['yrpHull'] === true && (o as Mesh).geometry === mesh.geometry) as Mesh;
      expect(hull, mesh.name).toBeDefined();
      expect(hull.material).toBe(set.hullMaterial);
      expect([hull.castShadow, hull.receiveShadow, hull.frustumCulled]).toEqual([false, false, false]);
      expect(hull.position.toArray()).toEqual(mesh.position.toArray()); // the same place in the same parent
      expect(hull.quaternion.toArray()).toEqual(mesh.quaternion.toArray());
    }
    expect(set.geometries.size).toBe(3);
    expect(set.textures.size).toBe(1); // only the base colour map of the shared material
  });

  it('never makes a hull of a hull: a second pass over the same scene adds nothing to the hulls it already has', () => {
    const { root } = scene();
    const first = toonify(root, 0.03);
    const meshes = (): number => {
      let n = 0;
      root.traverse((o) => (o as Mesh).isMesh && n++);
      return n;
    };
    const before = meshes();
    expect(before).toBe(3 + first.hulls.length);
    toonify(root, 0.03);
    expect(meshes() - before).toBe(3); // three new hulls for the three meshes, none for the three old ones
  });

  it('gives a skinned mesh a skinned hull on the same skeleton and bind matrix, so the ink follows the bones', () => {
    const geometry = new BoxGeometry(1, 2, 1);
    const count = geometry.getAttribute('position').count;
    geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Array(count * 4).fill(0), 4));
    geometry.setAttribute('skinWeight', new Float32BufferAttribute(Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)), 4));
    const bone = new Bone();
    const mesh = new SkinnedMesh(geometry, new MeshStandardMaterial());
    mesh.add(bone);
    mesh.bind(new Skeleton([bone]));
    const root = new Group();
    root.add(mesh);
    const set = toonify(root, 0.03);
    const hull = set.hulls[0] as SkinnedMesh;
    expect(hull.isSkinnedMesh).toBe(true);
    expect(hull.skeleton).toBe(mesh.skeleton);
    expect(hull.bindMatrix.toArray()).toEqual(mesh.bindMatrix.toArray());
    expect(hull.bindMode).toBe(mesh.bindMode);
    expect(hull.parent).toBe(root);
  });
});

describe('the channels', () => {
  it('multiply the file\'s colour, set the glow, and fade the figure and its ink together, going transparent only while it is faded', () => {
    const { root } = scene();
    const set = toonify(root, 0.03);
    const [m0, m1] = set.materials;
    drive(set, { colour: new Color(0.5, 1, 1), emissive: new Color(1, 0.5, 0), amount: 0.4, opacity: 1 });
    expect(m0!.color.toArray()).toEqual(new Color(1, 0, 0).multiply(new Color(0.5, 1, 1)).toArray());
    expect(m1!.color.toArray()).toEqual(new Color(0, 1, 0).multiply(new Color(0.5, 1, 1)).toArray());
    expect(m0!.emissive.toArray()).toEqual([0.4, 0.2, 0]);
    expect([m0!.transparent, set.hullMaterial.transparent, m0!.opacity]).toEqual([false, false, 1]);
    drive(set, { colour: white(), emissive: new Color(0, 0, 0), amount: 0, opacity: 0.4 });
    expect([m0!.transparent, m1!.transparent, set.hullMaterial.transparent]).toEqual([true, true, true]);
    expect([m0!.opacity, set.hullMaterial.opacity]).toEqual([0.4, 0.4]);
    expect(m0!.color.toArray()).toEqual(new Color(1, 0, 0).toArray()); // the colour comes back from the file's own, not from the last frame's
    drive(set, { colour: white(), emissive: new Color(0, 0, 0), amount: 0, opacity: 1 });
    expect([m0!.transparent, set.hullMaterial.transparent]).toEqual([false, false]);
  });
});

describe('freeing', () => {
  it('disposes the materials, the ink and the ramp, and takes the hulls out of the scene; the file\'s own geometry and textures only when asked', () => {
    const { root } = scene();
    const set = toonify(root, 0.03);
    const spies = [...set.materials, set.hullMaterial, set.ramp].map((o) => vi.spyOn(o as { dispose(): void }, 'dispose'));
    const geometrySpy = vi.spyOn([...set.geometries][0]!, 'dispose');
    disposeToon(set);
    for (const s of spies) expect(s).toHaveBeenCalledTimes(1);
    expect(geometrySpy).not.toHaveBeenCalled();
    let hulls = 0;
    root.traverse((o) => o.userData['yrpHull'] === true && hulls++);
    expect(hulls).toBe(0);
    disposeToon(set, true);
    expect(geometrySpy).toHaveBeenCalled();
  });

  it('a ramp is a DataTexture, so a test and a build with no canvas can make one', () => {
    expect(toonRamp()).toBeInstanceOf(DataTexture);
  });
});

describe('the wing flap', () => {
  /** A winged rigid scene: a body and two wings out to +-5.5, the way the real Bahamut measures (10.96 across). */
  function winged(): Group {
    const g = new Group();
    g.add(new Mesh(new BoxGeometry(1.2, 4, 1.2), new MeshStandardMaterial({ color: 0x6a3fa8 })));
    const wings = new Mesh(new BoxGeometry(10.96, 0.2, 2), new MeshStandardMaterial({ color: 0xb05a2a }));
    wings.position.y = 4;
    g.add(wings);
    return g;
  }
  const shaderOf = (m: { onBeforeCompile: (s: never, r: never) => void }) => {
    const shader = { uniforms: {} as Record<string, { value: number }>, vertexShader: '#include <common>\nvoid main() {\n#include <begin_vertex>\n#include <skinning_vertex>\n#include <project_vertex>\n}' };
    m.onBeforeCompile(shader as never, null as never);
    return shader;
  };

  it('reads the wingspan from the meshes, and puts the shoulder at 0.18 of the whole span from the centre', () => {
    const spec = flapSpecOf(winged())!;
    expect(spec.halfSpan).toBeCloseTo(5.48, 6);
    expect(spec.shoulder).toBeCloseTo(SHOULDER_SHARE * 10.96, 6);
    expect(SHOULDER_SHARE).toBe(0.18);
    expect(flapSpecOf(new Group())).toBeNull();
    const cells = makeFlap(spec);
    expect([cells.uFlapTime.value, cells.uFlapAmp.value, cells.uFlapShoulder.value, cells.uFlapHalf.value]).toEqual([0, 0, spec.shoulder, spec.halfSpan]);
  });

  it('adds the displacement after begin_vertex (so skinning and projection see it): beyond the shoulder, growing to the tip, mostly up with a little forward', () => {
    const shader = { vertexShader: '#include <common>\n#include <begin_vertex>\n#include <project_vertex>' };
    withFlap(shader);
    const v = shader.vertexShader;
    for (const u of ['uFlapTime', 'uFlapAmp', 'uFlapShoulder', 'uFlapHalf']) expect(v).toContain(`uniform float ${u};`);
    expect(v).toContain('smoothstep( uFlapShoulder, uFlapHalf, yrpAx )');
    expect(v).toContain('transformed.y += yrpFlap;');
    expect(v).toMatch(/transformed\.z \+= yrpFlap \* 0\.\d+;/);
    expect(v.indexOf('begin_vertex')).toBeLessThan(v.indexOf('yrpFlap'));
    expect(v.indexOf('yrpFlap')).toBeLessThan(v.indexOf('project_vertex'));
  });

  it('shares one set of cells between every toon material and the ink hull, so the outline flaps with the wing, and gives the flapping programs their own cache keys', () => {
    const root = winged();
    const cells = makeFlap(flapSpecOf(root)!);
    const set = toonify(root, 0.03, toonRamp(), cells);
    expect(set.flap).toBe(cells);
    for (const m of [...set.materials, set.hullMaterial]) {
      const shader = shaderOf(m as never);
      expect(shader.uniforms['uFlapTime'], 'the cell itself, not a copy').toBe(cells.uFlapTime);
      expect(shader.uniforms['uFlapAmp']).toBe(cells.uFlapAmp);
      expect(shader.vertexShader).toContain('yrpFlap');
    }
    expect(set.materials[0]!.customProgramCacheKey()).toBe('yrp-toon-flap');
    expect(set.hullMaterial.customProgramCacheKey()).toBe('yrp-ink-hull-flap');
    const hullShader = shaderOf(set.hullMaterial as never);
    expect(hullShader.vertexShader.indexOf('yrpFlap')).toBeLessThan(hullShader.vertexShader.indexOf('transformed += normalize')); // displaced, then pushed along the normal
    setFlap(set, 1.25, 0.4);
    expect([cells.uFlapTime.value, cells.uFlapAmp.value]).toEqual([1.25, 0.4]);
  });

  it('leaves a model with no flap alone: no cells, the plain programs, and setFlap does nothing', () => {
    const { root } = scene();
    const set = toonify(root, 0.03);
    expect(set.flap).toBeNull();
    expect(set.materials[0]!.customProgramCacheKey()).not.toBe('yrp-toon-flap');
    expect(set.hullMaterial.customProgramCacheKey()).toBe('yrp-ink-hull');
    expect(() => setFlap(set, 1, 1)).not.toThrow();
  });
});
