// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { blinkAperture, CYCLE_S, drift, faceWeightsAt, jitter, springStep, swell } from '../../src/app/screens/pause/livingTimeline.ts';
import { framePoint, glanceSide, irisOffset, lookToward, LIMIT } from '../../src/app/screens/pause/livingGaze.ts';
import { parsePartsManifest, resetPartsManifest, type PlateParts } from '../../src/app/screens/pause/livingParts.ts';
import { atRest, drawFace, pressAlpha, stateKey, type Ctx2D, type RenderLayer } from '../../src/app/screens/pause/livingRender.ts';
import { LivingPortraitDriver } from '../../src/app/screens/pause/LivingPortraitDriver.ts';
import { existsSync, readFileSync } from 'node:fs';

describe('the A2 clock (D-143)', () => {
  it('is the approved clip in the first cycle: smile at 0.6 s, blinks 1.45 and 6.05, press 6.1', () => {
    expect(faceWeightsAt(0).smile).toBe(0);
    expect(faceWeightsAt(0.6).smile).toBe(0);
    expect(faceWeightsAt(1.0).smile).toBeCloseTo(1, 5); // 400 ms in
    expect(faceWeightsAt(3.8).smile).toBe(0); // 2.8 s out
    expect(faceWeightsAt(1.0 + 1.4).smile).toBeCloseTo(0.5, 2); // halfway down the 2.8 s ease
    expect(faceWeightsAt(1.45 + 0.05 + 0.01).aperture).toBe(0);
    expect(faceWeightsAt(1.45 + 0.2).aperture).toBe(1);
    expect(faceWeightsAt(6.05 + 0.06).aperture).toBe(0);
    expect(faceWeightsAt(6.1).press).toBe(0);
    expect(faceWeightsAt(6.5).press).toBeCloseTo(1, 5);
    expect(faceWeightsAt(9.3).press).toBe(0);
  });

  it('glances aside from 2.0 to 5.2 s and never worries a brow (there is no brow weight)', () => {
    expect(faceWeightsAt(1.9).glance).toBe(0);
    expect(faceWeightsAt(3.5).glance).toBe(1);
    expect(faceWeightsAt(5.2).glance).toBeCloseTo(0, 5);
    expect(Object.keys(faceWeightsAt(3)).sort()).toEqual(['aperture', 'glance', 'press', 'smile']);
  });

  it('repeats every cycle, jittered by a fixed hash (deterministic, none in cycle 0)', () => {
    expect(jitter(0, 1)).toBe(0);
    expect(jitter(3, 2)).toBe(jitter(3, 2));
    for (let c = 1; c < 50; c++) expect(Math.abs(jitter(c, 1))).toBeLessThan(0.35);
    expect(faceWeightsAt(CYCLE_S + 1.0).smile).toBeCloseTo(1, 5);
    const a = faceWeightsAt(CYCLE_S * 2 + 1.5);
    expect(faceWeightsAt(CYCLE_S * 2 + 1.5)).toEqual(a);
  });

  it('keeps blinks and swells in range, springs without overshoot, drifts under a pixel', () => {
    for (let t = 0; t < 40; t += 0.007) {
      const w = faceWeightsAt(t);
      for (const v of [w.smile, w.press, w.aperture, w.glance]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    expect(blinkAperture(0, 1)).toBe(1);
    expect(swell(0.5, 0.6)).toBe(0);
    let s = { pos: 0, vel: 0 };
    let max = 0;
    for (let i = 0; i < 120; i++) {
      s = springStep(s.pos, s.vel, 5, 0.05, 1 / 60);
      max = Math.max(max, s.pos);
    }
    expect(max).toBeLessThanOrEqual(5.0001); // critically damped: no overshoot
    expect(s.pos).toBeCloseTo(5, 3);
    for (let t = 0; t < 60; t += 0.1) expect(Math.hypot(drift(t).x, drift(t).y)).toBeLessThan(1.1);
  });
});

describe('where the eyes look (D-321)', () => {
  it('maps the highlighted element into the frame, -1 to 1', () => {
    const frame = { left: 0, top: 0, width: 1600, height: 900 };
    expect(framePoint({ left: 760, top: 430, width: 80, height: 40 }, frame)).toEqual({ x: 0, y: 0 });
    expect(framePoint({ left: 0, top: 0, width: 100, height: 20 }, frame).y).toBeLessThan(-0.9);
    expect(framePoint({ left: 0, top: 0, width: 1, height: 1 }, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('deflects toward the highlight, fully at a quarter frame away, and never past the limit', () => {
    const face = { x: 0.4, y: 0 };
    expect(lookToward({ x: 0.4, y: 0 }, face)).toEqual({ x: 0, y: 0 });
    expect(lookToward({ x: -0.1, y: 0 }, face).x).toBeCloseTo(-1, 5);
    expect(lookToward({ x: 0.5, y: 0 }, face).x).toBeGreaterThan(0);
    for (const gaze of [0.3, 1]) {
      for (const g of [-1, 0, 1]) {
        const o = irisOffset({ x: g, y: g }, 1, glanceSide({ x: g, y: g }, face), gaze);
        expect(Math.abs(o.x)).toBeLessThanOrEqual(LIMIT.x * gaze + 1e-9);
        expect(Math.abs(o.y)).toBeLessThanOrEqual(LIMIT.y * gaze + 1e-9);
      }
    }
    expect(irisOffset({ x: 1, y: 1 }, 1, 1, 0)).toEqual({ x: 0, y: 0 }); // Auron: no eye movement
    expect(glanceSide({ x: 0, y: 0 }, { x: 0.5, y: 0 })).toBe(-1); // toward the middle of the frame
  });
});

const spec: PlateParts = {
  canvas2x: [100, 100, 400, 200], canvas1x: [50, 50, 200, 100], blink: ['L'], gaze: ['L'], gazeScale: 1,
  parts: {
    'mouth-open-smile': { box2x: [150, 250, 100, 40], box1x: [75, 125, 50, 20] },
    'mouth-concerned-press': { box2x: [150, 250, 100, 40], box1x: [75, 125, 50, 20] },
    'lidL-closed': { box2x: [300, 120, 60, 30], box1x: [150, 60, 30, 15] },
    'eyeL-socket': { box2x: [300, 120, 60, 30], box1x: [150, 60, 30, 15] },
    'eyeL-iris': { box2x: [300, 120, 60, 30], box1x: [150, 60, 30, 15] },
    'eyeL-catch': { box2x: [300, 120, 60, 30], box1x: [150, 60, 30, 15] },
    'eyeL-window': { box2x: [300, 120, 60, 30], box1x: [150, 60, 30, 15] },
  },
};

function fakeLayer(plate: PlateParts = spec): { calls: string[]; layer: RenderLayer; ctx: Ctx2D } {
  const calls: string[] = [];
  const mk = (tag: string): Ctx2D => ({
    clearRect: () => calls.push(`${tag}:clear`),
    drawImage: (img, x, y) => calls.push(`${tag}:draw ${String(img)}@${x},${y}`),
    save: () => calls.push(`${tag}:save`),
    restore: () => calls.push(`${tag}:restore`),
    beginPath: () => undefined,
    rect: (x, y, w, h) => calls.push(`${tag}:rect ${x},${y},${w},${h}`),
    clip: () => calls.push(`${tag}:clip`),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
  });
  const images = new Map(Object.keys(plate.parts).map((n) => [n, n]));
  const layer: RenderLayer = {
    spec: plate, scale: '2x', origin: plate.canvas2x, images,
    scratch: () => ({ canvas: 'scratch', ctx: mk('s') }),
  };
  return { calls, layer, ctx: mk('m') };
}

describe('drawing a face (D-320)', () => {
  const rest = { smile: 0, press: 0, aperture: 1, iris: { x: 0, y: 0 } };

  it('draws nothing at rest: the plate is exactly today\'s', () => {
    const { calls, layer, ctx } = fakeLayer();
    expect(atRest(rest)).toBe(true);
    expect(drawFace(ctx, layer, rest)).toBe(false);
    expect(calls).toEqual(['m:clear']);
  });

  it('draws the open smile and the press at their boxes, relative to the canvas corner', () => {
    const a = fakeLayer();
    drawFace(a.ctx, a.layer, { ...rest, smile: 1 });
    expect(a.calls).toContain('m:draw mouth-open-smile@50,150');
    const b = fakeLayer();
    drawFace(b.ctx, b.layer, { ...rest, press: 1 });
    expect(b.calls).toContain('m:draw mouth-concerned-press@50,150');
    expect(b.calls.some((c) => c.includes('open-smile'))).toBe(false);
  });

  it('a blink puts the closed lid up whole (a cel blink, no wipe, no cross-fade) once the aperture is under half', () => {
    const { calls, layer, ctx } = fakeLayer();
    drawFace(ctx, layer, { ...rest, aperture: 0.66 });
    expect(calls.some((c) => c.includes('lidL'))).toBe(false);
    const shut = fakeLayer();
    expect(drawFace(shut.ctx, shut.layer, { ...rest, aperture: 0.33 })).toBe(true);
    expect(shut.calls).toContain('m:draw lidL-closed@200,20');
    expect(shut.calls.some((c) => c.includes('rect') || c.includes('clip'))).toBe(false);
  });

  it('moves the iris and the catchlight (0.3x, in whole pixels) and clips both to the eye window', () => {
    const { calls, layer, ctx } = fakeLayer();
    drawFace(ctx, layer, { ...rest, iris: { x: 5, y: -3 } });
    expect(calls).toContain('s:draw eyeL-iris@5,-3');
    expect(calls).toContain('s:draw eyeL-catch@2,-1');
    expect(calls).toContain('s:draw eyeL-window@0,0');
    expect(calls).toContain('m:draw eyeL-socket@200,20');
    expect(calls.indexOf('m:draw eyeL-socket@200,20')).toBeLessThan(calls.indexOf('m:draw scratch@200,20'));
  });

  it('never touches an eye the plate has no parts for (Kimahri\'s far eye, the Rikkus\' wink) or moves an eyeless plate (Auron)', () => {
    const { calls, layer, ctx } = fakeLayer();
    drawFace(ctx, layer, { ...rest, aperture: 0, iris: { x: 6, y: 2 } });
    expect(calls.some((c) => /eyeR|lidR/.test(c))).toBe(false);
    const auron = fakeLayer({ ...spec, gaze: [] });
    drawFace(auron.ctx, auron.layer, { ...rest, iris: { x: 6, y: 2 } });
    expect(auron.calls.some((c) => c.includes('iris'))).toBe(false);
  });

  it('halves the iris at the 1x scale and shapes the press so it is not half there for long', () => {
    const { calls, layer, ctx } = fakeLayer();
    drawFace(ctx, { ...layer, scale: '1x', origin: spec.canvas1x }, { ...rest, iris: { x: 8, y: 0 } });
    expect(calls).toContain('s:draw eyeL-iris@4,0');
    expect(pressAlpha(0.1)).toBe(0);
    expect(pressAlpha(0.8)).toBe(1);
    expect(pressAlpha(0.45)).toBeCloseTo(0.5, 5);
    expect(stateKey({ ...rest, smile: 0.001 })).toBe(stateKey(rest));
    expect(stateKey({ ...rest, smile: 0.5 })).not.toBe(stateKey(rest));
  });
});

describe('the manifest', () => {
  // The parts are local files (public/portrait-parts, excluded from git until release time): skipped where absent.
  it.skipIf(!existsSync('public/portrait-parts/manifest.json'))('parses what tools/portrait-parts.py writes and keeps every plate\'s lists', () => {
    const raw = JSON.parse(readFileSync('public/portrait-parts/manifest.json', 'utf8')) as unknown;
    const m = parsePartsManifest(raw);
    expect(m).not.toBeNull();
    expect(Object.keys(m!.plates).sort()).toEqual(['auron', 'kimahri', 'lulu', 'paine', 'rikku', 'rikku-ffx2', 'tidus', 'wakka', 'yuna', 'yuna-ffx2']);
    expect(m!.plates['kimahri']!.blink).toEqual(['L']); // the near eye only
    expect(m!.plates['rikku']!.blink).toEqual(['L']); // both Rikkus keep the wink
    expect(m!.plates['rikku-ffx2']!.gaze).toEqual(['L']);
    expect(m!.plates['auron']!.gaze).toEqual([]); // dark glasses: no eye movement
    expect(m!.plates['auron']!.parts['mouth-open-smile']).toBeTruthy();
    expect(m!.plates['tidus']!.canvas2x[2]).toBeGreaterThan(0);
  });

  it('refuses garbage and drops a bad plate without losing the rest', () => {
    expect(parsePartsManifest(null)).toBeNull();
    expect(parsePartsManifest({ version: 2 })).toBeNull();
    const m = parsePartsManifest({ version: 1, master: [2688, 1536], plates: { bad: { canvas2x: [0, 0, 0, 0] }, ok: { ...spec } } });
    expect(Object.keys(m!.plates)).toEqual(['ok']);
  });
});

describe('the driver (jsdom: no canvas, no parts: it must stay out of the way)', () => {
  beforeEach(() => resetPartsManifest());
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  function plate(): HTMLImageElement {
    const root = document.createElement('div');
    const img = document.createElement('img');
    img.className = 'pause__plate';
    img.dataset['plate'] = 'tidus';
    root.appendChild(img);
    document.body.appendChild(root);
    return img;
  }

  it('adds nothing and does not throw when the parts cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const img = plate();
    const d = new LivingPortraitDriver({ enabled: () => true, scale: () => '2x', raf: () => 1, caf: () => undefined });
    expect(() => d.mount(img, 'tidus')).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
    expect(document.querySelector('[data-living]')).toBeNull();
    expect(d.snapshot()['ready']).toBe(false);
    expect(() => {
      d.setGaze(0.3, -0.8);
      d.blink();
      d.setExpression('neutral');
    }).not.toThrow();
    d.dispose();
    d.dispose();
    vi.unstubAllGlobals();
  });

  it('a fallback or missing plate is left alone', () => {
    const img = plate();
    img.dataset['art'] = 'fallback';
    const d = new LivingPortraitDriver({ enabled: () => true, scale: () => '2x', raf: () => 1 });
    d.mount(img, 'tidus');
    expect(d.snapshot()['plate']).toBeNull();
    d.dispose();
  });
});
