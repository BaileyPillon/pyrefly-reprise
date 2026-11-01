/**
 * THE SKY READ TOOL (release 71, branch `booth-ffx2-b4-sky`; FFX-2 only; `tools/sky-plate-read.mjs`): the measure the lift of the held look is judged by, run on stills with no browser. Pure functions here (the PNG decode is `sharp`'s and is
 * exercised by the tool's own run on the r70 stills, whose whole-frame numbers it reproduces exactly: Chapter V's first menu reads 101.5 and 2.66 percent on release 69, 126.6 and 13.52 on the r70 build; the note quotes them).
 */
import { describe, expect, it } from 'vitest';
import { BANDS, luma, regionStats, skyRead } from '../../tools/sky-plate-read.mjs';

/** A w x h RGB frame, every pixel the same colour. */
function flat(w: number, h: number, rgb: readonly [number, number, number], channels = 3): Uint8Array {
  const d = new Uint8Array(w * h * channels);
  for (let i = 0; i < w * h; i++) for (let k = 0; k < 3; k++) d[i * channels + k] = rgb[k]!;
  return d;
}

describe('the luma and the region statistics (the r70 lanes\' own formula: Rec. 709 weights on the 8-bit values)', () => {
  it('weights the channels 0.2126, 0.7152 and 0.0722', () => {
    expect(luma(255, 0, 0)).toBeCloseTo(54.213, 3);
    expect(luma(0, 255, 0)).toBeCloseTo(182.376, 3);
    expect(luma(0, 0, 255)).toBeCloseTo(18.411, 3);
    expect(luma(255, 255, 255)).toBeCloseTo(255, 6);
  });

  it('counts a pixel over 240 only when its luma is, not when one channel is', () => {
    const w = 10;
    const d = flat(w, 10, [250, 250, 250]);
    expect(regionStats(d, w, 3, 0, w, 0, 10)).toMatchObject({ pixels: 100, over240: 100, over235: 100 });
    const red = flat(w, 10, [255, 0, 0]); // luma 54: one channel at the top is not a clipped pixel
    expect(regionStats(red, w, 3, 0, w, 0, 10)).toMatchObject({ over240: 0, over235: 0 });
    const edge = flat(w, 10, [238, 238, 238]); // over 235, not over 240
    expect(regionStats(edge, w, 3, 0, w, 0, 10)).toMatchObject({ over240: 0, over235: 100 });
  });

  it('reads a half-open region of a frame with an alpha channel, and an empty region as zeroes', () => {
    const w = 8;
    const d = flat(w, 8, [10, 10, 10], 4);
    for (let y = 0; y < 8; y++) for (let x = 4; x < 8; x++) for (let k = 0; k < 3; k++) d[(y * w + x) * 4 + k] = 255; // the right half is white
    expect(regionStats(d, w, 4, 0, 4, 0, 8).mean).toBeCloseTo(10, 6);
    expect(regionStats(d, w, 4, 4, 8, 0, 8).mean).toBeCloseTo(255, 6);
    expect(regionStats(d, w, 4, 4, 8, 0, 8).over240).toBe(100);
    expect(regionStats(d, w, 4, 0, 8, 0, 8)).toMatchObject({ pixels: 64, over240: 50 });
    expect(regionStats(d, w, 4, 3, 3, 0, 8)).toEqual({ pixels: 0, mean: 0, over240: 0, over235: 0 });
  });
});

describe('the sky band', () => {
  it('is the part above the party that no HUD covers: Chapter V x 0.27 to 0.62, Chapter XI x 0.27 to 0.52, both y 0.14 to 0.42', () => {
    expect(BANDS.v).toEqual({ id: 'ffx2-vegnagun-shuyin', x0: 0.27, x1: 0.62, y0: 0.14, y1: 0.42 });
    expect(BANDS.xi).toEqual({ id: 'ffx2-fallen-aeons', x0: 0.27, x1: 0.52, y0: 0.14, y1: 0.42 });
  });

  it('reads the band and the frame apart: a white patch inside the band of a dark frame is all of the band and a few percent of the frame', () => {
    const w = 100;
    const h = 100;
    const d = flat(w, h, [20, 20, 20]);
    for (let y = 14; y < 42; y++) for (let x = 27; x < 62; x++) for (let k = 0; k < 3; k++) d[(y * w + x) * 3 + k] = 255;
    const r = skyRead(d, w, h, 3, 'v');
    expect(r.chapter).toBe('ffx2-vegnagun-shuyin');
    expect(r.size).toBe('100x100');
    expect(r.band.over240).toBe(100);
    expect(r.band.mean).toBeCloseTo(255, 6);
    expect(r.frame.over240).toBeCloseTo(9.8, 6); // 35 x 28 of 10,000
    const xi = skyRead(d, w, h, 3, 'xi'); // the narrower band: x 0.27 to 0.52 sits inside the patch too
    expect(xi.band.over240).toBe(100);
    expect(() => skyRead(d, w, h, 3, 'iv' as never)).toThrow(/unknown chapter key/);
  });
});
