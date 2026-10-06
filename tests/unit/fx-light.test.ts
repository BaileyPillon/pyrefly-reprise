/**
 * The figure lighting MOCKUPS (branch lighting-mockups, `src/engine/fx/light/`) that can be checked without a browser: the shader
 * block against the real painted shader (and on top of the MAX mix's defringe), the compile hook putting the program back exactly,
 * the pose-url reader, the hand-confirmed rooms and the hand-placed stars. Game case: both (shared plumbing).
 */
import { describe, expect, it } from 'vitest';
import { ShaderMaterial } from 'three';
import { paintedFragmentShader, paintedVertexShader } from '../../src/engine/shaders/PaintedShader.ts';
import { patchDefringe } from '../../src/engine/fx/mix/defringe.ts';
import { setMixPatch } from '../../src/engine/fx/mix/patch.ts';
import { patchLight } from '../../src/engine/fx/light/lightShader.ts';
import { poseKeyOf } from '../../src/engine/fx/light/poseData.ts';
import { GLINTS } from '../../src/engine/fx/light/glints.ts';
import { ROOMS } from '../../src/engine/fx/light/rooms.ts';
import headBoxes from '../../src/engine/fx/light/headBoxes.json';

describe('the figure light block (both games)', () => {
  it('goes into the real painted shader before the flash, and never twice', () => {
    const out = patchLight(paintedFragmentShader);
    expect(out).not.toBeNull();
    expect(out!.indexOf('lgMode > 0.5')).toBeGreaterThan(out!.indexOf('c *= contact;'));
    expect(out!.indexOf('lgMode > 0.5')).toBeLessThan(out!.indexOf('float FLASH_FLOOR'));
    expect(out!.indexOf('uniform float lgMode')).toBeLessThan(out!.indexOf('void main()'));
    expect(patchLight(out!)).toBeNull();
  });

  it('skips a shader that is not the painted figure\'s', () => {
    expect(patchLight('void main() { gl_FragColor = vec4(1.0); }')).toBeNull();
  });

  it('sits on top of the defringe: both patches land, in either order', () => {
    const a = patchLight(patchDefringe(paintedFragmentShader)!);
    const b = patchDefringe(patchLight(paintedFragmentShader)!);
    expect(a).toContain('mixDefringe');
    expect(a).toContain('lgMode');
    expect(b).toContain('mixDefringe');
    expect(b).toContain('lgMode');
  });

  it('is skipped whole by lgMode 0 or lgK 0 (the frame is the unpatched shader\'s)', () => {
    expect(patchLight(paintedFragmentShader)).toContain('if (lgMode > 0.5 && lgK > 0.0) {');
  });
});

describe('the compile hook (both games)', () => {
  it('compiles the block in only while it is on, and puts the program key back exactly', () => {
    const mat = new ShaderMaterial({ vertexShader: paintedVertexShader, fragmentShader: paintedFragmentShader });
    const before = mat.customProgramCacheKey();
    const hadHook = mat.onBeforeCompile;
    setMixPatch(mat, 'light', true);
    expect(mat.customProgramCacheKey()).not.toBe(before);
    const shader = { fragmentShader: paintedFragmentShader, vertexShader: paintedVertexShader, uniforms: {} } as never;
    mat.onBeforeCompile(shader, null as never);
    expect((shader as { fragmentShader: string }).fragmentShader).toContain('lgMode');
    setMixPatch(mat, 'light', false);
    expect(mat.customProgramCacheKey()).toBe(before);
    expect(mat.onBeforeCompile).toBe(hadHook);
  });
});

describe('the pose reader (both games)', () => {
  it('reads the art id and the pose file from a painting url, whatever its scale or format', () => {
    expect(poseKeyOf('/art/characters/tidus/ready.png')).toEqual({ id: 'tidus', pose: 'ready' });
    expect(poseKeyOf('http://127.0.0.1:6944/art/characters/yuna-white-mage/idle@2x.webp?v=3')).toEqual({ id: 'yuna-white-mage', pose: 'idle' });
    expect(poseKeyOf('/art/backdrops/gagazet.png')).toBeNull();
    expect(poseKeyOf(undefined)).toBeNull();
  });
});

describe('the hand-confirmed rooms and stars (FFX Chapter I, FFX-2 Chapter IV)', () => {
  it('carry a key inside the painting, a hue each and a front share a figure can still be modelled by', () => {
    for (const name of ['gagazet', 'bevelle-underground']) {
      const r = ROOMS[name]!;
      expect(r.keys.length).toBeGreaterThan(0);
      for (const k of r.keys) {
        expect(k.at[0]).toBeGreaterThanOrEqual(0);
        expect(k.at[0]).toBeLessThanOrEqual(1);
        expect(k.w).toBeGreaterThan(0);
        expect(k.front).toBeGreaterThanOrEqual(0.3);
        expect(k.front).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('place every star inside its painting, at a sensible size, and at most six to a pose', () => {
    for (const [pose, pts] of Object.entries(GLINTS)) {
      expect(pts.length, pose).toBeLessThanOrEqual(6);
      for (const [u, v, s] of pts) {
        expect(u, pose).toBeGreaterThan(0);
        expect(u, pose).toBeLessThan(1);
        expect(v, pose).toBeGreaterThan(0);
        expect(v, pose).toBeLessThan(1);
        expect(s, pose).toBeGreaterThan(0.02);
        expect(s, pose).toBeLessThan(0.2);
      }
    }
  });

  it('read the reviewed head boxes as uv boxes the right way up', () => {
    const boxes = headBoxes as unknown as Record<string, number[]>;
    const t = boxes['tidus/idle']!;
    expect(t[0]!).toBeLessThan(t[2]!);
    expect(t[1]!).toBeLessThan(t[3]!);
    expect(t[3]!).toBeGreaterThan(0.7); // a head is near the top of a standing painting
  });
});
