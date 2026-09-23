import { describe, expect, it } from 'vitest';
import {
  CustomBlending,
  NormalBlending,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  SrcAlphaFactor,
  ZeroFactor,
} from 'three';
import { PAINTED_BLENDING, syncPaintedBloom } from '../../../src/engine/BloomMask.ts';

/** PR-0097 (both games): painted planes mask themselves out of the whole-frame bloom. */
describe('BloomMask', () => {
  it('blends colour as normal but multiplies the frame alpha by (1 - painting alpha)', () => {
    expect(PAINTED_BLENDING.blending).toBe(CustomBlending);
    expect(PAINTED_BLENDING.blendSrc).toBe(SrcAlphaFactor);
    expect(PAINTED_BLENDING.blendDst).toBe(OneMinusSrcAlphaFactor);
    expect(PAINTED_BLENDING.blendSrcAlpha).toBe(ZeroFactor);
    expect(PAINTED_BLENDING.blendDstAlpha).toBe(OneMinusSrcAlphaFactor);
  });

  it('hands a dissolving painting back to normal blending, so a death glow still blooms', () => {
    const m = new ShaderMaterial({ transparent: true, ...PAINTED_BLENDING });
    syncPaintedBloom(m, true);
    expect(m.blending).toBe(NormalBlending);
    syncPaintedBloom(m, false);
    expect(m.blending).toBe(CustomBlending);
    m.dispose();
  });
});
