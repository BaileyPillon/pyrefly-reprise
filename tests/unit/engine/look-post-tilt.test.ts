/**
 * The stock tilt-shift passes are not run while they would only copy the frame (lane "perf-trim", 2026-10-23; both games, shared plumbing): a look that draws its own mask-aware blur sets the stock
 * blur to 0, the tilt-shift shader returns its input for a radius under 0.05 px, so the two passes (two full-frame reads and writes at 2560x1440) change nothing. Pinned: the three looks do set it to 0 at
 * both strengths; the passes are switched off exactly while the stock blur is under the shader's own cut-off and back on when it is not or when the look leaves.
 */
import { describe, expect, it, vi } from 'vitest';
import { Vector2, Vector3 } from 'three';
import { applyLookPost, restoreTilt, TILT_COPY_PX } from '../../../src/engine/look/LookPost.ts';
import { lookParams } from '../../../src/engine/look/LookBoldConfig.ts';
import { LOOK_NAMES } from '../../../src/engine/look/LookConfig.ts';
import { TiltShiftShader } from '../../../src/engine/shaders/TiltShiftShader.ts';
import type { Renderer } from '../../../src/engine/Renderer.ts';

function fakeRenderer() {
  const u = { selective: { value: 0 }, smoothWidth: { value: 0 }, whiteDamp: { value: 0 }, bloomTint: { value: new Vector3() }, uTexel: { value: new Vector2() }, figureMask: { value: 0 } };
  const r = { bloomPass: { materialHighPassFilter: { uniforms: u } }, tiltH: { enabled: true }, tiltV: { enabled: true }, applyPost: vi.fn() };
  return r as unknown as Renderer & { tiltH: { enabled: boolean }; tiltV: { enabled: boolean }; applyPost: ReturnType<typeof vi.fn> };
}

const input = (name: 'hd2d' | 'cinematic' | 'anime', strength: 'subtle' | 'bold', useBlur: boolean, paletteMaxBlur?: number) => {
  const p = lookParams(name, strength);
  return { p, v: () => 0.5, W: 2560, H: 1440, useBlur, focus: 0.4, band: 0.2, paletteMaxBlur };
};

describe('the stock tilt-shift passes', () => {
  it('the shader copies its input for a radius under the cut-off the rig uses', () => {
    expect(TiltShiftShader.fragmentShader).toContain('radius < 0.05');
    expect(TILT_COPY_PX).toBe(0.05);
  });

  it('every look has a stock blur of 0 at both strengths, so the passes only copy while the look\'s own blur draws', () => {
    for (const name of LOOK_NAMES) for (const s of ['subtle', 'bold'] as const) expect(lookParams(name, s).tiltMaxBlur).toBe(0);
  });

  it('are switched off while the look blurs, and the blur uniforms are still written for the sharpening to follow', () => {
    for (const name of ['hd2d', 'cinematic'] as const) {
      const r = fakeRenderer();
      applyLookPost(r, input(name, 'bold', true));
      expect(r.tiltH.enabled).toBe(false);
      expect(r.tiltV.enabled).toBe(false);
      const patch = r.applyPost.mock.calls[0]![0] as Record<string, number>;
      expect(patch['tiltMaxBlur']).toBe(0);
      expect(patch['tiltFocus']).toBe(0.4);
      expect(patch['tiltBandWidth']).toBe(0.2);
    }
  });

  it('run when the quality cannot afford the look\'s blur (the palette\'s own stock blur) and come back when the look leaves', () => {
    const r = fakeRenderer();
    applyLookPost(r, input('hd2d', 'bold', false, 6));
    expect(r.tiltH.enabled).toBe(true);
    expect((r.applyPost.mock.calls[0]![0] as Record<string, number>)['tiltMaxBlur']).toBe(6);
    applyLookPost(r, input('hd2d', 'bold', true));
    expect(r.tiltH.enabled).toBe(false);
    restoreTilt(r);
    expect(r.tiltH.enabled).toBe(true);
    expect(r.tiltV.enabled).toBe(true);
  });

  it('a look with no blur at all and no palette blur never leaves a stock blur of its own on (nothing to copy, nothing run)', () => {
    const r = fakeRenderer();
    const i = input('hd2d', 'bold', false, 0);
    applyLookPost(r, { ...i, p: { ...i.p, blur: { ...i.p.blur, far: 0, near: 0 } } });
    expect(r.tiltH.enabled).toBe(false);
  });
});
