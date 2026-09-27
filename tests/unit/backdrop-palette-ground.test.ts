/**
 * B2 part 1: the exported `BackdropPalette.ground` reading A-8 builds on
 * (both games; B3's contact shadows take a floor luma). The painting's own
 * ground band, as a hex and a Rec. 709 luma, 0..1.
 */

import { describe, expect, it } from 'vitest';
import { paletteGround } from '../../src/engine/Backdrop.ts';

describe('paletteGround', () => {
  it('reads the ground band as hex and luma', () => {
    expect(paletteGround({ ground: 0xffffff })).toEqual({ hex: 0xffffff, luma: 1 });
    expect(paletteGround({ ground: 0x000000 })).toEqual({ hex: 0, luma: 0 });
  });

  it('weights green over red over blue (Rec. 709)', () => {
    const g = paletteGround({ ground: 0x00ff00 })!.luma;
    const r = paletteGround({ ground: 0xff0000 })!.luma;
    const b = paletteGround({ ground: 0x0000ff })!.luma;
    expect(g).toBeCloseTo(0.7152, 4);
    expect(r).toBeCloseTo(0.2126, 4);
    expect(b).toBeCloseTo(0.0722, 4);
  });

  it('is null-safe for a scene with no palette', () => {
    expect(paletteGround(null)).toBeNull();
    expect(paletteGround(undefined)).toBeNull();
  });
});
