/**
 * **The flash and the glow as a rim accent** (`src/engine/yrp3d/rim.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only), on three's real materials and no renderer. What it pins:
 *
 * 1. **The caps**: the share of full emissive a hit's flash and a cast glow reach, for the boss and for the party, stay far under the old whole-body 0.42 and 0.3 (a flat salmon silhouette; the girls blown to white).
 * 2. **The shape**: a surface facing the camera takes `ACCENT.body` of the accent, a surface turned away takes all of it, and it only rises between.
 * 3. **The shader**: the rim step is inserted right after three's emissive step, on every material `shadeify` makes (with and without the flap), under a program key of its own.
 */
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import { makeFlap, flapSpecOf } from '../../../src/engine/yrp3d/flap.ts';
import { ACCENT, patchRim, rimShare, withRim } from '../../../src/engine/yrp3d/rim.ts';
import { shadeify } from '../../../src/engine/yrp3d/shade.ts';

describe('the caps', () => {
  it('keep the flash and the glow far under the old whole-body gains, the boss a little above the girls, the glow under the flash', () => {
    expect(ACCENT.flash).toEqual({ boss: 0.3, party: 0.24 });
    expect(ACCENT.glow).toEqual({ boss: 0.2, party: 0.16 });
    for (const who of ['boss', 'party'] as const) {
      expect(ACCENT.flash[who]).toBeLessThan(0.42); // the old FLASH_GAIN
      expect(ACCENT.glow[who]).toBeLessThan(0.3); // the old GLOW_GAIN
      expect(ACCENT.glow[who]).toBeLessThan(ACCENT.flash[who]);
    }
    expect(ACCENT.flash.boss).toBeGreaterThan(ACCENT.flash.party);
  });

  it("leave a face toward the camera with only a small share, so the armour's own detail stays through the middle of the body", () => {
    expect(ACCENT.body).toBeLessThanOrEqual(0.3);
    for (const who of ['boss', 'party'] as const) expect(ACCENT.flash[who] * rimShare(1)).toBeLessThanOrEqual(0.08); // a face-on surface's flash: under 0.08 of full emissive
    // the area-weighted mean over a hemisphere (the weight of a cosine band is the cosine) at the boss's cap: the old flat was 0.34 everywhere
    let sum = 0;
    let weight = 0;
    for (let i = 0; i < 1000; i++) {
      const facing = (i + 0.5) / 1000;
      sum += rimShare(facing) * facing;
      weight += facing;
    }
    expect((ACCENT.flash.boss * sum) / weight).toBeLessThan(0.15);
  });
});

describe('the shape', () => {
  it('takes the body share face-on, all of it edge-on, and rises monotonically between', () => {
    expect(rimShare(1)).toBeCloseTo(ACCENT.body, 9);
    expect(rimShare(0)).toBeCloseTo(1, 9);
    let last = rimShare(1);
    for (let f = 0.95; f >= 0; f -= 0.05) {
      const now = rimShare(f);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
    expect(rimShare(2)).toBe(rimShare(1)); // clamped
    expect(rimShare(-1)).toBe(rimShare(0));
  });
});

describe('the shader', () => {
  it("inserts the rim after three's own emissive step, with the numbers of ACCENT, and leaves a shader without that step alone", () => {
    const shader = { fragmentShader: 'void main() {\n#include <normal_fragment_maps>\n#include <emissivemap_fragment>\n#include <lights_physical_fragment>\n}' };
    withRim(shader);
    const f = shader.fragmentShader;
    expect(f.indexOf('totalEmissiveRadiance *=')).toBeGreaterThan(f.indexOf('#include <emissivemap_fragment>'));
    expect(f.indexOf('totalEmissiveRadiance *=')).toBeLessThan(f.indexOf('#include <lights_physical_fragment>'));
    expect(f).toContain('dot( normal, normalize( vViewPosition ) )');
    expect(f).toContain(`${ACCENT.body} + ${1 - ACCENT.body} * pow( 1.0 - yrpFacing, ${ACCENT.power} )`);
    const bare = { fragmentShader: 'void main() {}' };
    withRim(bare);
    expect(bare.fragmentShader).toBe('void main() {}');
  });

  it('patches a bare material under a program key of its own, after anything it already patches', () => {
    const m = new MeshStandardMaterial();
    const calls: string[] = [];
    m.onBeforeCompile = () => void calls.push('earlier');
    patchRim(m);
    expect(m.customProgramCacheKey()).toContain('yrp-rim');
    const shader = { uniforms: {}, vertexShader: '', fragmentShader: '#include <emissivemap_fragment>' };
    m.onBeforeCompile(shader as never, undefined as never);
    expect(calls).toEqual(['earlier']);
    expect(shader.fragmentShader).toContain('yrpFacing');
  });

  it('is on every material shadeify makes, in both looks, with the flap or without', () => {
    const root = new Object3D();
    root.add(new Mesh(new BoxGeometry(10, 2, 2), new MeshStandardMaterial()), new Mesh(new BoxGeometry(4, 2, 2), new MeshStandardMaterial()));
    const flap = makeFlap(flapSpecOf(root)!);
    for (const set of [shadeify(root.clone(true)), shadeify(root.clone(true), { look: 'pbr' }), shadeify(root.clone(true), { flap, look: 'pbr' })]) {
      expect(set.materials.length).toBeGreaterThan(0);
      for (const m of set.materials) {
        expect(m.customProgramCacheKey()).toContain('yrp-rim');
        const shader = { uniforms: {} as Record<string, unknown>, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <emissivemap_fragment>' };
        m.onBeforeCompile(shader as never, undefined as never);
        expect(shader.fragmentShader).toContain('yrpFacing');
      }
    }
  });
});
