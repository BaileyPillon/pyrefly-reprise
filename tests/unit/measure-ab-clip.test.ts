/**
 * T-04 of the motion-fluidity pass (lane L5; both games, tooling): the A/B clip factory. The pure parts (`critic/runner/lib/ab-pure.mjs`) are tested on their own; the composer
 * (`tools/measure/ab-compose.mjs`: sharp and ffmpeg, no browser) is run end to end on a synthetic capture of two variants of a moment: a block moving across a 640 x 360 viewport.
 * The browser side (`tools/ab-clip.mjs`) is run for real by the lane and its output is the evidence (docs/handoff/mf-l5-tools.md).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { BUDGET, blindOrder, checkSpec, clipFps, clipName, cropRegion, joinQuery, nearestFrame, nextCrf, seedOf, speedTrace, stripIndexes, trackPoints, windowOf } from '../../critic/runner/lib/ab-pure.mjs';
import { FFMPEG, composeCard } from '../../tools/measure/ab-compose.mjs';

describe('the blind order', () => {
  const variants = [{ id: 'V0', name: 'today' }, { id: 'V1', name: 'new' }, { id: 'V2', name: 'other' }];
  it('hands the letters out in a seeded shuffle that a rebuild keeps, and keeps the key apart from the picture', () => {
    const a = blindOrder(variants, 'CP-03-ch1-hit-light');
    const b = blindOrder(variants, 'CP-03-ch1-hit-light');
    expect(a.order.map((o) => o.id)).toEqual(b.order.map((o) => o.id));
    expect(a.order.map((o) => o.letter)).toEqual(['A', 'B', 'C']);
    expect(Object.keys(a.key)).toEqual(['A', 'B', 'C']);
    expect(new Set(Object.values(a.key).map((k) => k.id))).toEqual(new Set(['V0', 'V1', 'V2']));
  });
  it('varies with the card id: across many cards the first panel is not always "today"', () => {
    const firsts = Array.from({ length: 40 }, (_, i) => blindOrder(variants.slice(0, 2), `card-${i}`).order[0]!.id);
    expect(new Set(firsts)).toEqual(new Set(['V0', 'V1']));
    const share = firsts.filter((f) => f === 'V0').length / firsts.length;
    expect(share).toBeGreaterThan(0.25);
    expect(share).toBeLessThan(0.75);
    expect(seedOf('a')).not.toBe(seedOf('b'));
  });
});

describe('the crop', () => {
  const vp = { w: 2560, h: 1440 };
  it('is 16:9, inside the viewport, never under 960 x 540 and widened to hold every point with a margin', () => {
    const small = cropRegion([{ x: 1200, y: 700 }, { x: 1300, y: 900 }], vp);
    expect(small.w).toBeGreaterThanOrEqual(960);
    expect(small.h).toBeGreaterThanOrEqual(540);
    expect(Math.abs(small.w / small.h - 16 / 9)).toBeLessThan(0.02);
    const wide = cropRegion([{ x: 300, y: 600 }, { x: 1900, y: 900 }], vp);
    expect(wide.w).toBeGreaterThanOrEqual(1600);
    expect(wide.x).toBeLessThanOrEqual(300);
    expect(wide.x + wide.w).toBeGreaterThanOrEqual(1900);
    for (const c of [small, wide]) { expect(c.x).toBeGreaterThanOrEqual(0); expect(c.x + c.w).toBeLessThanOrEqual(vp.w); expect(c.y + c.h).toBeLessThanOrEqual(vp.h); expect(c.w % 2).toBe(0); expect(c.h % 2).toBe(0); }
  });
  it('clamps at the edge and scales with a smaller viewport', () => {
    const edge = cropRegion([{ x: 20, y: 20 }], vp);
    expect(edge).toMatchObject({ x: 0, y: 0 });
    const small = cropRegion([{ x: 300, y: 150 }], { w: 640, h: 360 });
    expect(small.w).toBeGreaterThanOrEqual(240);
    expect(cropRegion([], vp)).toEqual({ x: 0, y: 0, w: 2560, h: 1440 });
  });
  it('reads the tracked points of the focus actors only', () => {
    const frames: Array<{ actors?: Record<string, Record<string, number>> }> = [{ actors: { a: { hx: 10, hy: 20, fx: 12, fy: 90 }, b: { hx: 500, hy: 500, fx: 500, fy: 600 } } }, { actors: { a: { hx: 30, hy: 20, fx: 32, fy: 90 } } }];
    expect(trackPoints(frames, ['a'], 0, 1)).toHaveLength(4);
    expect(trackPoints(frames, ['b'], 0, 1)).toHaveLength(2);
  });
});

describe('the window, cut by event', () => {
  const frames = Array.from({ length: 200 }, (_, i) => ({ vt: i * 10, playing: i >= 60 && i < 120 }));
  it('runs from the lead before the confirm to the settle after the presenter finished', () => {
    const w = windowOf(frames, [], { t0: 500, leadMs: 300, settleMs: 400, maxMs: 8000 })!;
    expect(w.startMs).toBe(200);
    expect(w.endMs).toBe(1190 + 400);
    expect(frames[w.i0]!.vt).toBe(200);
    expect(frames[w.i1]!.vt).toBeLessThanOrEqual(1590);
    expect(w.truncated).toBe(false);
  });
  it('is capped at the maximum and says so', () => {
    const w = windowOf(frames, [], { t0: 500, leadMs: 300, settleMs: 4000, maxMs: 1000 })!;
    expect(w.truncated).toBe(true);
    expect(w.lengthMs).toBe(1000);
  });
  it('falls back on the last log event when the presenter never reported playing', () => {
    const w = windowOf(frames.map((f) => ({ ...f, playing: false })), [{ vt: 900 }], { t0: 500, leadMs: 0, settleMs: 100 })!;
    expect(w.endMs).toBe(1000);
    expect(windowOf([], [], { t0: 0 })).toBeNull();
  });
  it('finds the nearest frame by time', () => {
    expect(nearestFrame(frames, 123)).toBe(12);
    expect(nearestFrame(frames, 126)).toBe(13);
    expect(nearestFrame(frames, -50)).toBe(0);
    expect(nearestFrame(frames, 99999)).toBe(199);
  });
});

describe('the speed trace', () => {
  it('is in px per 60 Hz frame whatever the capture rate', () => {
    const at = (hz: number) => Array.from({ length: 30 }, (_, i) => ({ vt: (i * 1000) / hz, actors: { hero: { gx: (i * 600) / hz / 146, ox: 0, gy: 0, oy: 0 } } })); // 600 px a second
    const t60 = speedTrace(at(60), 'hero', 0, 29, { scale: 1 });
    const t144 = speedTrace(at(144), 'hero', 0, 29, { scale: 1 });
    expect(t60[5]!.v).toBeCloseTo(10, 0);
    expect(t144[5]!.v).toBeCloseTo(10, 0);
  });
});

describe('the small rules', () => {
  it('joins the address words', () => {
    expect(joinQuery('?coach=off', '&hit=ramp')).toBe('?coach=off&hit=ramp');
    expect(joinQuery('', '&hit=ramp')).toBe('?hit=ramp');
    expect(joinQuery('?coach=off', '')).toBe('?coach=off');
    expect(joinQuery('', '')).toBe('');
  });
  it('names files as the core lane did', () => {
    expect(clipName({ chapter: 'ch4', move: 'attack', hz: 120, slow: true })).toBe('AB-ch4-attack-120-slow4x.mp4');
    expect(clipName({ chapter: 'ch1', move: 'hit', hz: 60, ext: 'png' })).toBe('AB-ch1-hit-60.png');
  });
  it('plays a real-time clip at 60 fps at most and a slow copy at a quarter of the capture rate', () => {
    expect([clipFps(60), clipFps(120), clipFps(144)]).toEqual([60, 60, 60]);
    expect([clipFps(120, true), clipFps(144, true)]).toEqual([30, 36]);
  });
  it('steps the CRF up only while the file is over budget', () => {
    expect(nextCrf(20, 7 * 1024 * 1024)).toBeNull();
    expect(nextCrf(20, 9 * 1024 * 1024)).toBe(23);
    expect(nextCrf(BUDGET.crfMax, 9 * 1024 * 1024)).toBeNull();
  });
  it('spreads strip indexes and refuses a spec it cannot film twice', () => {
    expect(stripIndexes(100, 12)).toHaveLength(12);
    expect(stripIndexes(100, 12)[0]).toBe(0);
    expect(stripIndexes(100, 12)[11]).toBe(99);
    expect(stripIndexes(5, 12)).toEqual([0, 1, 2, 3, 4]);
    expect(checkSpec({ id: 'a', chapter: 'c', move: 'm', variants: [{ id: 'V0' }, { id: 'V1' }] })).toEqual([]);
    expect(checkSpec({ id: 'a b', chapter: 'c', move: 'm', variants: [{ id: 'V0' }] }).join(' ')).toMatch(/at least two variants/);
    expect(checkSpec({ id: 'a', chapter: 'c', move: 'm', variants: [{ id: 'V0' }, { id: 'V0' }] }).join(' ')).toMatch(/distinct/);
    expect(checkSpec({ id: 'a', chapter: 'c', move: 'm', variants: [{ id: 'V0' }, { id: 'V1' }], rates: [5] }).join(' ')).toMatch(/rates/);
    expect(checkSpec(null)).toHaveLength(1);
  });
});

const haveFfmpeg = fs.existsSync(FFMPEG);

describe.skipIf(!haveFfmpeg)('the composer, end to end on a synthetic capture', () => {
  const root = path.resolve(__dirname, '..', '..');
  const W = 640, H = 360, HZ = 120;

  async function capture(workDir: string, id: string, speed: number) {
    const dir = path.join(workDir, `${id}-${HZ}`);
    fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
    const frames: Array<Record<string, unknown>> = [];
    const N = 150;
    for (let f = 0; f < N; f++) {
      const vt = Math.round((f * 1000) / HZ * 10) / 10;
      const x = 100 + Math.min(vt, 800) * speed;
      frames.push({ f, vt, t: 1000 + vt, playing: vt >= 100 && vt < 900, menu: false, hs: 1, actors: { hero: { hx: x, hy: 120, fx: x, fy: 250, gx: x / 146, ox: 0, gy: 0, oy: 0, pose: 'attack' } } });
      const px = Buffer.alloc(W * H * 3, 24);
      for (let yy = 100; yy < 250; yy++) for (let xx = Math.max(0, Math.round(x) - 15); xx < Math.min(W, Math.round(x) + 15); xx++) { const i = (yy * W + xx) * 3; px[i] = 220; px[i + 1] = 180; px[i + 2] = 60; }
      await sharp(px, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 80 }).toFile(path.join(dir, 'frames', `f${String(f).padStart(5, '0')}.jpg`));
    }
    fs.writeFileSync(path.join(dir, 'rec.json'), JSON.stringify({ meta: { viewport: { width: W, height: H }, hz: HZ }, t0: 100, frames, events: [{ f: 30, vt: 250, type: 'damage' }] }));
  }

  it('writes a blind two-panel clip under 8 MB, its quarter-speed copy, the 1080 px card, the trace, the key and the numbers', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-compose-'));
    try {
      const work = path.join(tmp, 'work'), out = path.join(tmp, 'out');
      await capture(work, 'V0', 0.35);
      await capture(work, 'V1', 0.5);
      const spec = { id: 'T-1', title: 'A block crosses', chapter: 'ch1', move: 'cross', rates: [HZ], variants: [{ id: 'V0', name: 'today' }, { id: 'V1', name: 'new' }], focus: ['hero'], viewport: { w: W, h: H }, leadMs: 50, settleMs: 100, maxMs: 1000, questions: ['Which is tighter?'], strip: { event: 'damage', ordinal: 1, offset: -2 } };
      const res = await composeCard({ spec, workDir: work, outDir: out, root });
      const names = fs.readdirSync(out).sort();
      expect(names).toEqual(expect.arrayContaining(['AB-ch1-cross-120.mp4', 'AB-ch1-cross-120-slow4x.mp4', 'AB-ch1-cross-120-card.jpg', 'AB-ch1-cross-120-trace.png', 'KEY.json', 'numbers.json', 'README.txt']));
      for (const f of ['AB-ch1-cross-120.mp4', 'AB-ch1-cross-120-slow4x.mp4']) expect(fs.statSync(path.join(out, f)).size).toBeLessThan(BUDGET.maxBytes);
      const info = (f: string) => spawnSync(FFMPEG, ['-i', path.join(out, f)], { encoding: 'utf8' }).stderr;
      expect(info('AB-ch1-cross-120.mp4')).toMatch(/720x810/);
      expect(info('AB-ch1-cross-120.mp4')).toMatch(/60 fps/);
      expect(info('AB-ch1-cross-120-slow4x.mp4')).toMatch(/30 fps/);
      const card = await sharp(path.join(out, 'AB-ch1-cross-120-card.jpg')).metadata();
      expect(card.width).toBe(1080);
      const key = JSON.parse(fs.readFileSync(path.join(out, 'KEY.json'), 'utf8'));
      expect(new Set(Object.values(key.key as Record<string, { id: string }>).map((k) => k.id))).toEqual(new Set(['V0', 'V1']));
      expect(JSON.stringify(res)).toContain('joltsInWindow');
      const numbers = JSON.parse(fs.readFileSync(path.join(out, 'numbers.json'), 'utf8'));
      expect(Object.keys(numbers['120'].numbers)).toEqual(['A', 'B']);
      expect(numbers['120'].crop.w).toBeGreaterThanOrEqual(240);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }, 120000);
});
