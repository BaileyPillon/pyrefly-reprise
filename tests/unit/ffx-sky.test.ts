/**
 * **FFX's sky** (`src/engine/ffx3d/ffxSky.ts`; FFX only). The bowl is re-coloured as the game's shader shades it and the cloud sea is a set of world-fixed layers under the ship. Everything here is made up or
 * computed from a made-up bowl: no retail file is read. What this file pins:
 *
 * 1. {@link tone} is the game's curve: a soft-kneed "times two" that saturates at 0.58 into 0.996, clamped to 0..1.
 * 2. {@link bowlColours} applies it as `tone(texel * vertex colour)` per channel and keeps the alpha; {@link bakeBowl} puts the result on every mesh that has the file's raw colour, and only those, with a
 *    material of vertex colours alone that draws first and writes no depth.
 * 3. {@link parseSkySidecar} reads the exporter's `sky.json` strictly.
 * 4. {@link FfxSky} lays one plane per layer whose texture it was given, `floorY` minus the layer's depth, rides the camera horizontally and drifts the texture; `dispose` frees it.
 *
 * Game case: FFX only.
 */
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Texture, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { FfxSky, SKY_FADE, SKY_LAYERS, bakeBowl, bowlColours, parseSkySidecar, tone } from '../../src/engine/ffx3d/ffxSky.ts';

describe('the tone curve', () => {
  it('is 2.1 c - 0.038 up to 0.4, 1.08 c + 0.37 to 0.58, and flat above', () => {
    expect(tone(0)).toBe(0); // -0.038 clamped
    expect(tone(0.2)).toBeCloseTo(2.1 * 0.2 - 0.038, 12);
    expect(tone(0.4)).toBeCloseTo(0.802, 12);
    expect(tone(0.5)).toBeCloseTo(1.08 * 0.5 + 0.37, 12);
    expect(tone(0.58)).toBeCloseTo(0.9964, 12);
    expect(tone(0.9)).toBeCloseTo(0.9964, 12);
    expect(tone(5)).toBeCloseTo(0.9964, 12);
  });

  it('never leaves 0..1, and does not go backwards', () => {
    let last = -1;
    for (let c = -0.2; c < 2; c += 0.01) {
      const t = tone(c);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
      expect(t).toBeGreaterThanOrEqual(last - 1e-12);
      last = t;
    }
  });
});

describe('the bowl\'s colours', () => {
  it('are tone(texel * vertex colour) per channel, the alpha kept', () => {
    const raw = [0.439, 0.608, 0.812, 1, 0, 0.157, 0.357, 0.25];
    const out = bowlColours(raw, [71, 67, 79]);
    expect(out).toHaveLength(8);
    expect(out[0]).toBeCloseTo(tone((71 / 255) * 0.439), 6);
    expect(out[1]).toBeCloseTo(tone((67 / 255) * 0.608), 6);
    expect(out[2]).toBeCloseTo(tone((79 / 255) * 0.812), 6);
    expect(out[3]).toBe(1);
    expect(out[4]).toBe(0); // tone(0) is clamped
    expect(out[7]).toBeCloseTo(0.25, 6);
  });

  it('puts them on every mesh with the file\'s raw colour and leaves a mesh without alone', () => {
    const sky = new Group();
    const make = (withColour: boolean): Mesh => {
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
      if (withColour) g.setAttribute('_ffx_color', new Float32BufferAttribute([0.4, 0.6, 0.8, 1, 0.4, 0.6, 0.8, 1, 0, 0.1, 0.3, 0], 4));
      return new Mesh(g, new MeshBasicMaterial({ map: new Texture(), color: 0x123456, depthWrite: true }));
    };
    const a = make(true);
    const b = make(false);
    sky.add(a, b);
    expect(bakeBowl(sky, [71, 67, 79])).toBe(1);
    const colour = a.geometry.getAttribute('color');
    expect(colour.itemSize).toBe(4);
    expect(colour.getX(0)).toBeCloseTo(tone((71 / 255) * 0.4), 6);
    expect(colour.getW(2)).toBe(0);
    const m = a.material as MeshBasicMaterial;
    expect(m.map).toBeNull();
    expect(m.color.getHex()).toBe(0xffffff);
    expect(m.vertexColors).toBe(true);
    expect(m.depthWrite).toBe(false);
    expect(a.renderOrder).toBeLessThan(0);
    expect(b.geometry.getAttribute('color')).toBeUndefined();
    expect((b.material as MeshBasicMaterial).map).not.toBeNull(); // untouched
  });
});

describe('the sidecar', () => {
  const good = { version: 1, bowl: { texel: [71, 67, 79] }, clouds: { '12928': { file: 'cloud-12928.png' }, '12800': { file: 'cloud-12800.png' } } };

  it('reads the texel and the cloud files by tag', () => {
    expect(parseSkySidecar(good)).toEqual({ texel: [71, 67, 79], clouds: { '12928': 'cloud-12928.png', '12800': 'cloud-12800.png' } });
  });

  it('is null for anything that is not one: a missing bowl or clouds, a texel that is not three numbers in 0..255', () => {
    for (const bad of [null, 3, [], {}, { bowl: {}, clouds: {} }, { ...good, bowl: { texel: [1, 2] } }, { ...good, bowl: { texel: [1, 2, 300] } }, { ...good, bowl: { texel: [1, 2, 'x'] } }, { ...good, clouds: 4 }]) expect(parseSkySidecar(bad), JSON.stringify(bad)).toBeNull();
  });

  it('drops a cloud whose file is not a safe path under the folder', () => {
    const t = parseSkySidecar({ ...good, clouds: { a: { file: '../up.png' }, b: { file: 'ok.png' }, c: { file: 'C:/abs.png' }, d: 7, e: { file: 'a\\b.png' } } });
    expect(t!.clouds).toEqual({ b: 'ok.png' });
  });
});

describe('the cloud sea', () => {
  const textures = (): Record<string, Texture> => ({ '12928': new Texture(), '12864': new Texture() });

  it('has a plane for each layer it was given a texture for, `below` under the floor, flat', () => {
    const sea = new FfxSky(textures(), 3.4);
    expect(sea.count).toBe(2);
    expect(sea.group.children.map((c) => c.name)).toEqual(['ffx-clouds-12928', 'ffx-clouds-12864']);
    SKY_LAYERS.forEach((layer, i) => {
      const mesh = sea.group.children[i]!;
      expect(mesh.position.y).toBeCloseTo(3.4 - layer.below, 12);
      expect(mesh.rotation.x).toBeCloseTo(-Math.PI / 2, 12);
      expect(mesh.renderOrder).toBeLessThan(0);
    });
    const only = new FfxSky({ '12928': new Texture() }, 0);
    expect(only.count).toBe(1);
    expect(new FfxSky({}, 0).count).toBe(0);
  });

  it('rides the camera horizontally and keeps its height, and the plane reaches the far end of the fade', () => {
    const sea = new FfxSky(textures(), 3.4);
    sea.update(0.5, new Vector3(-9.5, 13.5, -33.4));
    for (const mesh of sea.group.children) {
      expect(mesh.position.x).toBe(-9.5);
      expect(mesh.position.z).toBe(-33.4);
    }
    expect(sea.group.children[0]!.position.y).toBeCloseTo(3.4 - SKY_LAYERS[0]!.below, 12);
    const geometry = (sea.group.children[0] as Mesh).geometry;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.x).toBeGreaterThanOrEqual(SKY_FADE.far);
  });

  it('frees its planes on dispose and leaves the scene', () => {
    const scene = new Group();
    const sea = new FfxSky(textures(), 0);
    scene.add(sea.group);
    sea.dispose();
    expect(sea.count).toBe(0);
    expect(sea.group.parent).toBeNull();
    sea.dispose(); // twice is nothing
  });
});
