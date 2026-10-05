// A-9 Lady Ginnem's unsent glow (FFX only, Chapter IX): the outline finder, the switch plan, the painting-to-world
// mapping and the scene layer's behaviour with no DOM. The look itself is judged in the browser captures.
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { bodyMask, outlineFromRgba, OUTLINE_DEFAULTS } from '../../src/engine/fx/unsentOutline.ts';
import { BREATH, glowPlan, haloLevel, MOTES_PER_S } from '../../src/engine/fx/unsentGlowPlan.ts';
import { GinnemGlow, paintingToWorld } from '../../src/scenes/cavern-stolen-fayth-glow.ts';

/** An RGBA plane with a filled ellipse (alpha 224, like Ginnem's 0.88 body) and an optional lone speck. */
function ellipse(w: number, h: number, speck = false): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - w / 2) / (w * 0.3);
      const dy = (y - h / 2) / (h * 0.4);
      if (dx * dx + dy * dy <= 1) d[(y * w + x) * 4 + 3] = 224;
    }
  }
  if (speck) for (let y = 3; y < 7; y++) for (let x = 3; x < 7; x++) d[(y * w + x) * 4 + 3] = 255; // a baked mote
  return d;
}

describe('outline of the body', () => {
  const W = 120;
  const H = 200;
  it('lies on the ellipse edge with normals pointing out', () => {
    const pts = outlineFromRgba(ellipse(W, H), W, H);
    expect(pts.length).toBeGreaterThan(40);
    for (const p of pts) {
      const dx = (p.u * W - W / 2) / (W * 0.3);
      const dy = (p.v * H - H / 2) / (H * 0.4);
      const r = Math.hypot(dx, dy);
      expect(r).toBeGreaterThan(0.85);
      expect(r).toBeLessThan(1.12);
      // The normal points away from the centre.
      expect(p.nx * dx + p.ny * dy).toBeGreaterThan(0);
      expect(Math.hypot(p.nx, p.ny)).toBeCloseTo(1, 5);
    }
  });
  it('ignores a baked-in mote smaller than a cell, and is deterministic', () => {
    const a = outlineFromRgba(ellipse(W, H, true), W, H);
    const b = outlineFromRgba(ellipse(W, H, false), W, H);
    expect(a).toEqual(b);
    expect(a.some((p) => p.u < 0.1 && p.v < 0.1)).toBe(false);
  });
  it('treats the soft rim (alpha under the threshold) as outside', () => {
    const d = ellipse(W, H);
    for (let i = 3; i < d.length; i += 4) if (d[i] === 0) d[i] = 90; // a rim glow everywhere
    expect(outlineFromRgba(d, W, H)).toEqual(outlineFromRgba(ellipse(W, H), W, H));
  });
  it('caps the point count', () => {
    expect(outlineFromRgba(ellipse(W, H), W, H, { maxPoints: 25 }).length).toBe(25);
    expect(bodyMask(ellipse(W, H), W, H).cols).toBe(Math.ceil(W / OUTLINE_DEFAULTS.cell));
  });
});

describe('what the glow does under the switches', () => {
  const on = { look: true, sub: true, tier: 'full', reduceMotion: false } as const;
  it('full: breathing halo and motes', () => {
    expect(glowPlan(on)).toEqual({ halo: true, breathe: true, moteRate: MOTES_PER_S });
  });
  it('phone and LOW EFFECTS thin the shell', () => {
    expect(glowPlan({ ...on, tier: 'phone' }).moteRate).toBeCloseTo(MOTES_PER_S * 0.6);
    const low = glowPlan({ ...on, tier: 'low' });
    expect(low.moteRate).toBeCloseTo(MOTES_PER_S * 0.3);
    expect(low.breathe).toBe(false);
  });
  it('REDUCE MOTION: a still halo, no motes', () => {
    const p = glowPlan({ ...on, reduceMotion: true });
    expect(p).toEqual({ halo: true, breathe: false, moteRate: 0 });
    expect(haloLevel(0, p)).toBe(haloLevel(2.5, p));
  });
  it('LIVING PAINTINGS off, or the sub-switch off: nothing live', () => {
    expect(glowPlan({ ...on, look: false })).toEqual({ halo: false, breathe: false, moteRate: 0 });
    expect(glowPlan({ ...on, sub: false }).halo).toBe(false);
    expect(haloLevel(1, glowPlan({ ...on, look: false }))).toBe(0);
  });
  it('the breath stays inside its band and is slow', () => {
    const p = glowPlan(on);
    let lo = 1;
    let hi = 0;
    for (let t = 0; t < BREATH.periodS; t += 0.05) {
      const v = haloLevel(t, p);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    expect(lo).toBeGreaterThanOrEqual(BREATH.lo - 1e-6);
    expect(hi).toBeLessThanOrEqual(1 + 1e-6);
    expect(hi - lo).toBeGreaterThan(0.3);
    expect(BREATH.periodS).toBeGreaterThanOrEqual(4);
  });
});

describe('painting pixels to world', () => {
  const quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(-1, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 3, 0), new Vector3(-1, 3, 0)];
  const box = { x0: 100, x1: 300, y0: 50, y1: 650 };
  it('maps the box corners onto the quad corners', () => {
    expect(paintingToWorld(100, 650, quad, box).toArray()).toEqual([-1, 0, 0]);
    expect(paintingToWorld(300, 650, quad, box).toArray()).toEqual([1, 0, 0]);
    expect(paintingToWorld(300, 50, quad, box).toArray()).toEqual([1, 3, 0]);
    expect(paintingToWorld(100, 50, quad, box).toArray()).toEqual([-1, 3, 0]);
  });
  it('holds for a mirrored quad (the painting frame, not the screen frame)', () => {
    const mirrored: [Vector3, Vector3, Vector3, Vector3] = [quad[1].clone(), quad[0].clone(), quad[3].clone(), quad[2].clone()];
    expect(paintingToWorld(100, 650, mirrored, box).toArray()).toEqual([1, 0, 0]);
    expect(paintingToWorld(200, 350, mirrored, box).toArray()).toEqual([0, 1.5, 0]);
  });
  it('extends past the box for the halo margin', () => {
    expect(paintingToWorld(0, 700, quad, box).x).toBeLessThan(-1);
    expect(paintingToWorld(0, 700, quad, box).y).toBeLessThan(0);
  });
});

describe('the scene layer without a DOM', () => {
  const on = { look: true, sub: true, tier: 'full', reduceMotion: false } as const;
  it('draws nothing and throws nothing when the art cannot load (node), with and without her figure', () => {
    const g = new GinnemGlow('art/characters/ginnem/idle.png');
    const fig = { visible: true, alpha: 1, contentQuad: () => [new Vector3(), new Vector3(1, 0, 0), new Vector3(1, 1, 0), new Vector3(0, 1, 0)] as [Vector3, Vector3, Vector3, Vector3] };
    expect(() => g.update(0.016, fig, on)).not.toThrow();
    expect(() => g.update(0.016, null, on)).not.toThrow();
    expect(g.snapshot().halo).toBe(false);
    expect(g.snapshot().motes).toBe(0);
    g.dispose();
    expect(g.emitter.isDisposed).toBe(true);
    expect(() => g.update(0.016, fig, on)).not.toThrow();
  });
});
