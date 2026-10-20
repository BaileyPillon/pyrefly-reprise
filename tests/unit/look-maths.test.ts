import { describe, expect, it } from 'vitest';
import { LOOKS } from '../../src/engine/look/LookConfig.ts';
import { findLight } from '../../src/engine/look/LookLight.ts';
import { blurOffsets, blurRadiusPx, blurWeights, fogBand, fogOnFigure, lightColour, ringPx } from '../../src/engine/look/LookMaths.ts';
import { installLookKeys, lookState, lookWanted, setLookName, setLookQuality, setLookTweak } from '../../src/engine/look/LookState.ts';

/** Demo looks (dev flag only; both games): the pure maths the shaders mirror, the light finder and the switch state. */
describe('the blur radius', () => {
  const b = LOOKS.hd2d.blur;

  it('is zero inside the sharp band and grows past it', () => {
    expect(blurRadiusPx(b.focus, b, 1)).toBe(0);
    expect(blurRadiusPx(b.focus + b.band * 0.99, b, 1)).toBe(0);
    expect(blurRadiusPx(b.focus - b.band * 0.99, b, 1)).toBe(0);
    const up = [0.6, 0.75, 0.9, 1].map((y) => blurRadiusPx(y, b, 1));
    for (let i = 1; i < up.length; i++) expect(up[i]!).toBeGreaterThanOrEqual(up[i - 1]!);
    const down = [0.15, 0.1, 0.05, 0].map((y) => blurRadiusPx(y, b, 1));
    for (let i = 1; i < down.length; i++) expect(down[i]!).toBeGreaterThanOrEqual(down[i - 1]!);
  });

  it('reaches the far strength at the top edge and the near strength at the bottom edge, and scales with the frame', () => {
    expect(blurRadiusPx(1, b, 1)).toBeCloseTo(b.far, 5);
    expect(blurRadiusPx(0, b, 1)).toBeCloseTo(b.near, 5);
    expect(blurRadiusPx(1, b, 1.6)).toBeCloseTo(b.far * 1.6, 5);
  });

  it('never blurs when both strengths are zero (anime)', () => {
    for (const y of [0, 0.2, 0.5, 0.8, 1]) expect(blurRadiusPx(y, LOOKS.anime.blur, 1)).toBe(0);
  });
});

describe('the fog', () => {
  it('is thickest at the bottom and gone at its height', () => {
    expect(fogBand(0, 0.6)).toBe(1);
    expect(fogBand(0.6, 0.6)).toBe(0);
    expect(fogBand(0.9, 0.6)).toBe(0);
    expect(fogBand(0.3, 0.6)).toBeGreaterThan(fogBand(0.5, 0.6));
  });

  it('reaches a figure only round the feet', () => {
    expect(fogOnFigure(0.05, 0.3)).toBeCloseTo(0.3, 5);
    expect(fogOnFigure(0.5, 0.3)).toBe(0);
    expect(fogOnFigure(0.7, 0.3)).toBe(0);
  });
});

describe('the blur taps', () => {
  it('are symmetric and the weights sum to one', () => {
    for (const n of [3, 9, 13]) {
      const o = blurOffsets(n);
      expect(o[0]).toBe(-1);
      expect(o[n - 1]).toBe(1);
      const w = blurWeights(n);
      expect(w.reduce((a, c) => a + c, 0)).toBeCloseTo(1, 8);
      for (let i = 0; i < n; i++) expect(w[i]).toBeCloseTo(w[n - 1 - i]!, 8);
      expect(w[(n - 1) / 2]!).toBeGreaterThan(w[0]!);
    }
  });
});

describe('the light colour and the ring', () => {
  it('lightColour is vivid and never white', () => {
    const c = lightColour([0.4, 0.3, 0.1]);
    expect(Math.max(...c)).toBeCloseTo(1, 5);
    expect(Math.min(...c)).toBeLessThan(0.9);
    expect(lightColour([0, 0, 0]).every((x) => Number.isFinite(x))).toBe(true);
  });

  it('ringPx scales with the frame and never goes under three quarters of a pixel', () => {
    expect(ringPx(2, 900)).toBeCloseTo(2, 5);
    expect(ringPx(2, 1440)).toBeCloseTo(3.2, 5);
    expect(ringPx(0.1, 900)).toBe(0.75);
  });
});

describe('findLight', () => {
  const W = 320;
  const H = 180;
  const picture = (fill: (x: number, y: number) => [number, number, number]): Uint8Array => {
    const d = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const [r, g, b] = fill(x, y);
        d.set([r, g, b, 255], (y * W + x) * 4);
      }
    }
    return d;
  };

  it('finds a bright spot in a dark picture', () => {
    const spot = (cx: number, cy: number) => (x: number, y: number): [number, number, number] => (Math.hypot(x - cx, y - cy) < 9 ? [255, 220, 150] : [20, 24, 40]);
    const f = findLight(picture(spot(224, 36)), W, H);
    expect(f.u).toBeGreaterThan(0.62);
    expect(f.u).toBeLessThan(0.78);
    expect(f.v).toBeGreaterThan(0.1);
    expect(f.v).toBeLessThan(0.3);
    expect(f.color[0]).toBeGreaterThan(f.color[2]);
    expect(f.score).toBeGreaterThan(0.05);
  });

  it('prefers a small bright light to a large pale area', () => {
    // a pale sky over the left half, a small lamp on the right
    const f = findLight(picture((x, y) => (Math.hypot(x - 260, y - 70) < 7 ? [255, 200, 120] : x < 160 ? [170, 175, 185] : [30, 34, 50])), W, H);
    expect(f.u).toBeGreaterThan(0.7);
  });

  it('ignores the lowest strip (the floor)', () => {
    const f = findLight(picture((x, y) => (Math.hypot(x - 80, y - 172) < 7 ? [255, 255, 255] : Math.hypot(x - 240, y - 30) < 6 ? [200, 180, 120] : [24, 24, 30])), W, H);
    expect(f.v).toBeLessThan(0.5);
  });

  it('survives a flat picture without a NaN', () => {
    const f = findLight(picture(() => [90, 90, 90]), W, H);
    expect(Number.isFinite(f.u) && Number.isFinite(f.v) && f.score >= 0).toBe(true);
  });
});

describe('the switch state', () => {
  it('is unarmed without a flag, armed once a look is set, and counts every change', () => {
    expect(lookState.armed).toBe(false); // vitest runs in Node: no location, no flag
    expect(lookWanted()).toBe(false);
    const v0 = lookState.version;
    setLookName('anime');
    expect(lookState.name).toBe('anime');
    expect(lookWanted()).toBe(true);
    setLookQuality('low');
    expect(lookState.quality).toBe('low');
    setLookQuality('bogus' as never);
    expect(lookState.quality).toBe('low');
    setLookTweak('shaft.gain', 0.7);
    expect(lookState.tweaks['shaft.gain']).toBe(0.7);
    setLookTweak('shaft.gain', null);
    expect(lookState.tweaks['shaft.gain']).toBeUndefined();
    expect(lookState.version).toBeGreaterThan(v0 + 3);
    setLookName(null);
    expect(lookState.name).toBeNull();
  });

  it('F6 and F7 cycle the look and the quality once armed', () => {
    const handlers: ((e: unknown) => void)[] = [];
    installLookKeys({ addEventListener: ((_t: string, h: (e: unknown) => void) => handlers.push(h)) as never });
    expect(handlers.length).toBe(1); // armed by the test above
    const key = (k: string): void => handlers[0]!({ key: k, preventDefault: () => undefined });
    setLookName(null);
    setLookQuality('high');
    key('F6');
    expect(lookState.name).toBe('hd2d');
    key('F6');
    expect(lookState.name).toBe('cinematic');
    key('F6');
    expect(lookState.name).toBe('anime');
    key('F6');
    expect(lookState.name).toBeNull();
    key('F7');
    expect(lookState.quality).toBe('medium');
    key('x');
    expect(lookState.quality).toBe('medium');
  });
});
