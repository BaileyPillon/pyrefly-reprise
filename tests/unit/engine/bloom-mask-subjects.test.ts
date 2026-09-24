/**
 * The figure bloom mask, scoped to named subjects on one stage (Chapter VII,
 * FFX only, AGENTS.md rule 14): Macalania masks the Guado Guardian alone, whose
 * approved r3 idle has 16 percent of its opaque pixels over luma 0.9, so FFX's
 * Yuna and Tidus's blade glow there bloom exactly as before. Every other stage
 * names no subjects and keeps masking every figure at its palette strength.
 */

import { describe, expect, it } from 'vitest';
import { CustomBlending, NormalBlending, ShaderMaterial } from 'three';
import { figureBloomMasked, syncPaintedBloom, PAINTED_BLENDING } from '../../../src/engine/BloomMask.ts';
import {
  MACALANIA_FIGURE_BLOOM_MASK,
  MACALANIA_FIGURE_BLOOM_MASK_ART,
  MACALANIA_TEMPLE_PALETTE,
} from '../../../src/scenes/macalania-temple.ts';

describe('figureBloomMasked', () => {
  it('masks every figure where the stage names none', () => {
    expect(figureBloomMasked(undefined, 'yuna')).toBe(true);
    expect(figureBloomMasked(undefined, 'leblanc')).toBe(true);
  });

  it('masks only the named art where the stage names some', () => {
    expect(figureBloomMasked(MACALANIA_FIGURE_BLOOM_MASK_ART, 'guado-guardian')).toBe(true);
    for (const art of ['yuna', 'tidus', 'rikku', 'seymour-macalania', 'anima', 'shiva']) {
      expect(figureBloomMasked(MACALANIA_FIGURE_BLOOM_MASK_ART, art)).toBe(false);
    }
  });

  it('Macalania carries the strength on its palette', () => {
    expect(MACALANIA_TEMPLE_PALETTE.figureBloomMask).toBe(MACALANIA_FIGURE_BLOOM_MASK);
    expect(MACALANIA_FIGURE_BLOOM_MASK).toBeGreaterThan(0);
  });
});

describe('syncPaintedBloom', () => {
  const mat = (): ShaderMaterial => new ShaderMaterial({ ...PAINTED_BLENDING });

  it('keeps the mask blending on a whole, masked painting', () => {
    const m = mat();
    syncPaintedBloom(m, false);
    expect(m.blending).toBe(CustomBlending);
  });

  it('draws an unmasked figure, or a dissolving one, with normal blending', () => {
    const a = mat();
    syncPaintedBloom(a, false, false);
    expect(a.blending).toBe(NormalBlending);
    const b = mat();
    syncPaintedBloom(b, true, true);
    expect(b.blending).toBe(NormalBlending);
  });
});
