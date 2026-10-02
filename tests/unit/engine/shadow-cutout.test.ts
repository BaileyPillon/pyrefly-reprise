import { MeshDepthMaterial, RGBADepthPacking, ShaderMaterial, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { cutoutShadow } from '../../../src/engine/ShadowCutout.ts';

/**
 * VP-1001-31 (both games; seen in FFX-2's Chapter XIII): three r186's shadow pass copies the
 * object's material `map` and `alphaTest` onto a custom depth material
 * (`WebGLShadowMap.getDepthMaterial`), so a figure whose texture lives in a ShaderMaterial
 * uniform cast its whole quad. The figure material now carries the same values.
 */
function threeShadowCopy(material: ShaderMaterial, depth: MeshDepthMaterial): void {
  // The two lines of three r186 that caused the slabs, verbatim in effect.
  depth.alphaTest = material.alphaToCoverage === true ? 0.5 : material.alphaTest;
  depth.map = (material as ShaderMaterial & { map?: Texture | null }).map ?? null;
}

describe('cutoutShadow', () => {
  it('survives three copying the figure material onto the depth material', () => {
    const material = new ShaderMaterial();
    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, alphaTest: 0.4 });
    const tex = new Texture();

    // Before the fix: the copy empties the cut-out.
    depth.map = tex;
    threeShadowCopy(material, depth);
    expect(depth.map).toBeNull();
    expect(depth.alphaTest).toBe(0);

    cutoutShadow(material, depth, tex, 0.4);
    threeShadowCopy(material, depth);
    expect(depth.map).toBe(tex);
    expect(depth.alphaTest).toBe(0.4);
  });

  it('follows every pose swap without churning the program version', () => {
    const material = new ShaderMaterial();
    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, alphaTest: 0.4 });
    const a = new Texture();
    const b = new Texture();
    cutoutShadow(material, depth, a, 0.4);
    threeShadowCopy(material, depth);
    const v = depth.version;
    threeShadowCopy(material, depth);
    threeShadowCopy(material, depth);
    expect(depth.version).toBe(v); // stable values: no per-frame program change
    cutoutShadow(material, depth, b, 0.4);
    threeShadowCopy(material, depth);
    expect(depth.map).toBe(b);
  });
});
