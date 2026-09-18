// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';

import { ImpactFlash } from '../../../src/engine/VFX.ts';

/**
 * The impact bloom is an additive quad with `depthTest: false` and a
 * `renderOrder` above every figure, so whatever it covers it covers
 * completely. That is what made Rikku a white blob in
 * `docs/screenshots/70/52-ffx2-bahamut.png` — issue 7 of
 * `docs/handoff/playability-round-1.md` §4.
 *
 * The fix is three numbers and one pass-through, and all four are the kind of
 * thing a later tuning pass can undo by accident, so they are pinned here.
 *
 * jsdom's canvas has no 2D context unless the optional `canvas` package is
 * installed, and `radialCanvas` dereferences `getContext('2d')` directly, so
 * the ramp is recorded through a stub instead. The stops it receives are the
 * thing under test anyway.
 */
const stops: Array<[number, number]> = [];

beforeAll(() => {
  const gradient = {
    addColorStop(at: number, css: string) {
      const m = /rgba\(255,255,255,([\d.]+)\)/.exec(css);
      if (m) stops.push([at, Number(m[1])]);
    },
  };
  HTMLCanvasElement.prototype.getContext = (() => ({
    createRadialGradient: () => gradient,
    fillRect: () => {},
    fill: () => {},
    set fillStyle(_v: unknown) {},
    get fillStyle() {
      return '';
    },
    beginPath: () => {},
    arc: () => {},
    clearRect: () => {},
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    createLinearGradient: () => gradient,
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

/** Drive a whole `play()` and return every opacity the tween produced. */
function opacitiesOver(flash: ImpactFlash, ms: number, steps = 40): number[] {
  const mat = flash.material as { opacity: number };
  const seen: number[] = [];
  for (let i = 0; i < steps; i++) {
    flash.update(ms / 1000 / steps);
    seen.push(mat.opacity);
  }
  return seen;
}

describe('ImpactFlash — the bloom that erased Rikku', () => {
  it('never rises above its peak opacity, and the default peak is well under 1', () => {
    const flash = new ImpactFlash({ size: 3 });
    flash.play(new Vector3(0, 1, 0), 260, 0.67);
    const seen = opacitiesOver(flash, 260);
    // 0.95 was the old hard-coded value; at that level the additive quad
    // clipped a 1.8-unit party member's torso to pure white.
    expect(Math.max(...seen)).toBeLessThanOrEqual(0.55);
    expect(Math.max(...seen)).toBeGreaterThan(0.1);
    flash.dispose();
  });

  it('decays to nothing and hides itself rather than sitting on the figure', () => {
    const flash = new ImpactFlash({ size: 3 });
    flash.play(new Vector3(0, 1, 0), 260, 0.67);
    const seen = opacitiesOver(flash, 300);
    expect(seen.at(-1)).toBe(0);
    expect(flash.visible).toBe(false);
    // Faster than linear: half way through its life it is already well below
    // half brightness, so the bloom reads as a pop and not as a quarter of a
    // second of bright fill.
    const half = seen[Math.floor(seen.length / 2) - 1] ?? 1;
    expect(half).toBeLessThan(0.55 * 0.5);
    flash.dispose();
  });

  it('honours the element colour it is played with, and falls back when given none', () => {
    const flash = new ImpactFlash({ size: 3, color: 0xdff0ff });
    const mat = flash.material as unknown as { color: { getHex(): number } };

    // A heal has to bloom green. Every element used to bloom the same icy
    // white, which is also the only colour that clips all three channels at
    // once — precisely the "blown out to pure white" complaint.
    flash.play(new Vector3(0, 1, 0), 260, 0.67, 0x9dffc4);
    expect(mat.color.getHex()).toBe(0x9dffc4);

    flash.play(new Vector3(0, 1, 0), 260, 0.67);
    expect(mat.color.getHex()).toBe(0xdff0ff);
    flash.dispose();
  });

  it('has no fully opaque texel at the centre of its ramp', () => {
    stops.length = 0;
    const flash = new ImpactFlash({ size: 3 });
    expect(stops.length).toBeGreaterThan(0);
    // An alpha of 1.0 in the middle of an additive disc adds the full colour
    // on top of the painting and clips it. Everything else about the bloom can
    // be tuned; this stop is what makes the figure legible through it.
    const centre = stops.find(([at]) => at === 0)?.[1] ?? 1;
    expect(centre).toBeLessThan(0.8);
    expect(centre).toBeGreaterThan(0.2);
    flash.dispose();
  });
});
