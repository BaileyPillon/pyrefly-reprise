/**
 * What the continuity harness reads off a painting (`critic/runner/lib/continuity-silhouette.mjs`): the stance from the
 * silhouette, the mass when no head is registered, and the anchors from a registration record only while the record is
 * fresh. Paintings here are drawn in the test (a figure with a head, legs and a thin blade that hangs lower than its boots),
 * encoded as PNG and decoded the way the harness decodes a real one.
 *
 * Game case: both (shared critic plumbing).
 */
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { anchorsFor, bboxRows, decodeMask, estimateMass, estimateStance, loadPoseMeasure, openMask, subjectPoseOf } from '../../critic/runner/lib/continuity-silhouette.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';

const W = 200, H = 300;

/** A figure: head (circle at 100,55 r 28), body and legs (x 72..128, y 85..270), boots (x 66..134, y 262..272), and a thin blade hanging to the bottom edge. */
async function painting(opts: { blade?: boolean; width?: number; height?: number } = {}): Promise<Buffer> {
  const w = opts.width ?? W, h = opts.height ?? H;
  const px = Buffer.alloc(w * h * 4);
  const set = (x: number, y: number): void => { if (x >= 0 && y >= 0 && x < w && y < h) { const i = (y * w + x) * 4; px[i] = 200; px[i + 1] = 120; px[i + 2] = 90; px[i + 3] = 255; } };
  const sx = w / W, sy = h / H;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x / sx, Y = y / sy;
    const head = (X - 100) ** 2 + (Y - 55) ** 2 <= 28 ** 2;
    const body = X >= 72 && X <= 128 && Y >= 85 && Y <= 270;
    const boots = X >= 66 && X <= 134 && Y >= 262 && Y <= 272;
    const blade = opts.blade !== false && X >= 150 && X <= 153 && Y >= 120 && Y <= 298;
    if (head || body || boots || blade) set(x, y);
  }
  return sharp(px, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

describe('reading a painting', () => {
  it('keeps the shape and the aspect, and says the real size', async () => {
    const m = await decodeMask(await painting({ width: 400, height: 600 }), 150);
    expect(m.srcW).toBe(400);
    expect(m.srcH).toBe(600);
    expect(m.w).toBe(100);
    expect(m.h).toBe(150);
    expect(m.bits).toHaveLength(m.w * m.h);
    expect(Math.max(...m.bits)).toBe(1);
    expect(m.bits[2]).toBe(0); // the corner is transparent
    const bb = bboxRows(m)!;
    expect(bb.top / m.h).toBeGreaterThan(0.06); // the head starts a little under a tenth of the way down
    expect(bb.bottom / m.h).toBeGreaterThan(0.97); // the blade reaches the bottom edge
  });

  it('finds the stance at the boots, not at the tip of a blade that hangs lower', async () => {
    const m = await decodeMask(await painting());
    const st = estimateStance(m)!;
    expect(st.u).toBeGreaterThan(0.47);
    expect(st.u).toBeLessThan(0.53);
    expect(st.t).toBeGreaterThan(0.88); // the boots end at y 272 of 300
    expect(st.t).toBeLessThan(0.93);
  });

  it('opens a thin blade away and keeps the body', async () => {
    const m = await decodeMask(await painting());
    const o = openMask(m, 4);
    const at = (x: number, y: number): number => o.bits[Math.floor((y / H) * o.h) * o.w + Math.floor((x / W) * o.w)]!;
    expect(at(100, 180)).toBe(1); // the body
    expect(at(151, 200)).toBe(0); // the blade
  });

  it('takes the mass: the share of the painting the opened silhouette fills, a thin blade not counted', async () => {
    const withBlade = estimateMass(await decodeMask(await painting()))!;
    const without = estimateMass(await decodeMask(await painting({ blade: false })))!;
    // head (about 2460 px), body (57 x 186), boots (69 x 11): a little under a quarter of the 200 x 300 painting
    expect(withBlade).toBeGreaterThan(0.18);
    expect(withBlade).toBeLessThan(0.27);
    expect(Math.abs(withBlade - without)).toBeLessThan(0.005);
  });

  it('answers null for a painting with nothing in it', async () => {
    const blank = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    const m = await decodeMask(blank);
    expect(estimateStance(m)).toBeNull();
    expect(estimateMass(m)).toBeNull();
  });
});

describe('where a painting\'s anchors come from', () => {
  const measure = (size: number[], extra: Record<string, unknown> = {}): PoseMeasure => ({
    path: 'x', sha256: 'y', count: 1,
    subjects: { hero: { poses: { attack: { size, head: [80, 20, 120, 60], stance: { x: 100, row: 270 }, prone: false, standing: true, ...extra } } } },
  });

  it('parses an art url, the shipped WebP and an @2x master included', () => {
    expect(subjectPoseOf('/art/characters/tidus/attack.png')).toEqual({ subject: 'tidus', pose: 'attack' });
    expect(subjectPoseOf('https://echoesofspira.com/art/characters/yuna-gunner/ready.webp?v=2')).toEqual({ subject: 'yuna-gunner', pose: 'ready' });
    expect(subjectPoseOf('/art/characters/auron/idle@2x.png')).toEqual({ subject: 'auron', pose: 'idle' });
    expect(subjectPoseOf('/art/backdrops/gagazet.png')).toBeNull();
  });

  it('uses a fresh registration record, in the painting\'s own fractions', async () => {
    const mask = await decodeMask(await painting());
    const a = anchorsFor({ url: '/art/characters/hero/attack.png', mask, measure: measure([W, H]) });
    expect(a.head).toEqual({ u0: 80 / W, t0: 20 / H, u1: 120 / W, t1: 60 / H });
    expect(a.stance).toEqual({ u: 100 / W, t: 270 / H });
    expect(a.stanceSrc).toBe('registration');
    expect(a.stale).toBe(false);
    expect(a.mass).toBeGreaterThan(0.1);
  });

  it('gives the same fractions for the same painting at twice the size', async () => {
    const mask2 = await decodeMask(await painting({ width: 400, height: 600 }));
    const a = anchorsFor({ url: '/art/characters/hero/attack@2x.webp', mask: mask2, measure: measure([W, H]) });
    expect(a.head!.u0).toBeCloseTo(0.4, 6);
    expect(a.stale).toBe(false);
  });

  it('distrusts a record whose picture has another shape than the painting drawn', async () => {
    const mask = await decodeMask(await painting());
    const a = anchorsFor({ url: '/art/characters/hero/attack.png', mask, measure: measure([W * 1.2, H]) });
    expect(a.stale).toBe(true);
    expect(a.head).toBeNull();
    expect(a.stanceSrc).toBe('silhouette');
    expect(a.mass).toBeGreaterThan(0.1);
  });

  it('reads a figure with no record from its silhouette: stance and mass, never a head', async () => {
    const mask = await decodeMask(await painting());
    const a = anchorsFor({ url: '/art/characters/seymour-flux/idle.png', mask, measure: null });
    expect(a.head).toBeNull();
    expect(a.mass).toBeGreaterThan(0.1);
    expect(a.stanceSrc).toBe('silhouette');
    expect(a.stance!.u).toBeGreaterThan(0.47);
  });

  it('lays a wide painting down unless the registration says it stands (a lunge)', async () => {
    const wide = await decodeMask(await painting({ width: 300, height: 200 }));
    expect(anchorsFor({ url: '/art/characters/hero/attack.png', mask: wide, measure: null }).prone).toBe(true);
    const lunge = anchorsFor({ url: '/art/characters/hero/attack.png', mask: wide, measure: measure([300, 200], { prone: true, standing: true }) });
    expect(lunge.prone).toBe(false);
    const ko = anchorsFor({ url: '/art/characters/hero/attack.png', mask: wide, measure: measure([300, 200], { prone: true, standing: false }) });
    expect(ko.prone).toBe(true);
  });

  it('has no records file to read when none is given', () => {
    expect(loadPoseMeasure(null)).toBeNull();
    expect(loadPoseMeasure('D:/does/not/exist/pose-measure.json')).toBeNull();
  });
});
