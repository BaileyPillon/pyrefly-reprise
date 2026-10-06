/**
 * Release 39.1 ("r391-stalls"; both games, shared plumbing): the arithmetic of a staged texture upload and the warm pool's memory accounting.
 * Pure: no DOM, no GL. The numbers behind the constants are the spike's (`docs/plans/r391-stalls-review.md`): a 256-row band of a 4096-wide master is 1.3 to 1.7 ms of
 * main thread, so a frame uploads about 4 MB.
 */
import { describe, expect, it } from 'vitest';
import {
  BAND_BYTES,
  LATE_FRAME_MS,
  MAX_BAND_ROWS,
  MIN_BAND_ROWS,
  URGENT_BAND_BYTES,
  VERY_LATE_FRAME_MS,
  bandBudget,
  framesToUpload,
  nextBand,
  rowsForBudget,
} from '../../../src/engine/StageBands.ts';
import { evictions, roomFor, committedMB, warmCap, warmMB, warmRoom, WARM_MAX_MB, WARM_SHARE } from '../../../src/engine/ArtMemory.ts';
import type { Entry } from '../../../src/engine/ArtEntry.ts';
import { textureMB } from '../../../src/engine/ArtBudget.ts';

describe('the band budget', () => {
  it('is 4 MB a frame for a background load and 6 MB for a figure that is waiting', () => {
    expect(bandBudget(false, 16.7)).toBe(BAND_BYTES);
    expect(bandBudget(true, 16.7)).toBe(URGENT_BAND_BYTES);
    expect(URGENT_BAND_BYTES).toBeGreaterThan(BAND_BYTES);
  });

  it('is cut to a quarter when the frame is late and an eighth when it is badly late, and never to nothing', () => {
    expect(bandBudget(false, LATE_FRAME_MS + 1)).toBe(BAND_BYTES / 4);
    expect(bandBudget(false, VERY_LATE_FRAME_MS + 1)).toBe(BAND_BYTES / 8);
    expect(bandBudget(true, 500)).toBeGreaterThan(0);
    expect(bandBudget(false, LATE_FRAME_MS)).toBe(BAND_BYTES); // the line itself is on time
  });
});

describe('rows and bands', () => {
  it('fits as many rows as the budget holds: 256 rows of a 4096-wide master in 4 MB', () => {
    expect(rowsForBudget(4096, 4 * 1024 * 1024)).toBe(256);
    expect(rowsForBudget(5376, 4 * 1024 * 1024)).toBe(195);
  });

  it('keeps a band between the minimum and the maximum', () => {
    expect(rowsForBudget(4096, 10)).toBe(MIN_BAND_ROWS);
    expect(rowsForBudget(64, 100 * 1024 * 1024)).toBe(MAX_BAND_ROWS);
    expect(rowsForBudget(0, 1000)).toBeGreaterThanOrEqual(MIN_BAND_ROWS);
  });

  it('walks a texture top to bottom in bands that add up to its height, the last one short', () => {
    const h = 1000;
    let done = 0;
    const seen: Array<[number, number]> = [];
    for (let band = nextBand(done, h, 256); band; band = nextBand(done, h, 256)) {
      seen.push([band.y, band.rows]);
      done += band.rows;
    }
    expect(seen).toEqual([[0, 256], [256, 256], [512, 256], [768, 232]]);
    expect(done).toBe(h);
    expect(nextBand(h, h, 256)).toBeNull();
    expect(nextBand(0, h, 0)).toBeNull();
  });

  it('says how many frames a master takes: a 4x figure in 16, a 2x pose in two or three', () => {
    expect(framesToUpload(4096, 4096, BAND_BYTES)).toBe(16);
    expect(framesToUpload(1346, 1532, BAND_BYTES)).toBeLessThanOrEqual(3);
    expect(framesToUpload(4096, 4096, URGENT_BAND_BYTES)).toBeLessThan(framesToUpload(4096, 4096, BAND_BYTES));
  });
});

function entry(over: Partial<Entry> & { w?: number; h?: number } = {}): Entry {
  const { w = 1000, h = 1000, ...rest } = over;
  return {
    texture: { image: { width: w, height: h }, userData: {} } as unknown as Entry['texture'],
    painted: { texture: undefined, meta: { width: 500, height: 500 }, url: '/art/x.png', scale: 2 } as unknown as Entry['painted'],
    url: '/art/x.png',
    scale: 2,
    baseScale: 2,
    baseImage: null,
    mb: 0,
    lastSeen: -1e9,
    px1x: 0,
    loading: 0,
    failed: new Set(),
    needSince: -1,
    staged: null,
    askedAt: 0,
    dropped: false,
    warm: false,
    warmTried: false,
    pendingMB: 0,
    ...rest,
  };
}

describe('the warm pool', () => {
  it('is a share of the class budget and never more than 640 MB', () => {
    expect(warmCap(2600)).toBe(WARM_MAX_MB); // high class: 780 would be 30 percent, the cap is 640
    expect(warmCap(900)).toBeCloseTo(900 * WARM_SHARE, 6); // mid: 270
    expect(warmCap(220)).toBeCloseTo(66, 6); // phone: 66
    expect(warmCap(0)).toBe(0);
  });

  it('counts only the paintings uploaded ahead and not drawn since, and the speculative loads on their way', () => {
    const entries = [entry({ warm: true, mb: 20 }), entry({ warm: false, mb: 50 }), entry({ warm: true, mb: 30 })];
    expect(warmMB(entries)).toBe(50);
    expect(warmMB([...entries, entry({ pendingMB: 16 })])).toBe(66);
  });

  it("does not count a load's own pending megabytes twice when it asks whether it fits", () => {
    const own = entry({ pendingMB: 30 });
    const entries = [entry({ warm: true, mb: 600 }), own];
    expect(warmRoom(entries, 30, 2600)).toBe(false); // 600 + 30 + 30 > 640
    expect(warmRoom(entries, 30, 2600, own)).toBe(true); // 600 + 30 <= 640
  });

  it('has room for a master while the pool plus it fits the cap', () => {
    const entries = [entry({ warm: true, mb: 600 })];
    expect(warmRoom(entries, 30, 2600)).toBe(true); // 630 <= 640
    expect(warmRoom(entries, 41, 2600)).toBe(false); // 641 > 640
    expect(warmRoom([], 640, 2600)).toBe(true);
  });
});

describe('the memory ledger', () => {
  it('counts what is resident, what was swapped in above its first scale and what is on its way', () => {
    const drawn = entry({ mb: textureMB(1000, 1000) });
    const swapped = entry({ scale: 3, baseScale: 2 });
    const loading = entry({ loading: 4, scale: 2 });
    const idle = entry({}); // base scale, never drawn, nothing loading: not counted
    const total = committedMB([drawn, swapped, loading, idle]);
    // the image of a master already swapped in is its own size; a load on its way counts at the size it will have (4 / 2 = twice the edge)
    expect(total).toBeCloseTo(textureMB(1000, 1000) + textureMB(1000, 1000) + textureMB(2000, 2000), 6);
  });

  it('says whether a master of a bigger scale fits under the budget', () => {
    const e = entry({ mb: textureMB(1000, 1000) });
    expect(roomFor([e], 4, e, 1000)).toBe(true);
    expect(roomFor([e], 4, e, 10)).toBe(false);
  });

  it('sends back the masters above their first scale that are not on screen, least recently seen first, until it fits', () => {
    const a = entry({ scale: 4, baseScale: 2, mb: 100, lastSeen: 1000 });
    const b = entry({ scale: 4, baseScale: 2, mb: 100, lastSeen: 2000 });
    const c = entry({ scale: 4, baseScale: 2, mb: 100, lastSeen: 9999 }); // seen a moment ago: kept
    const base = entry({ scale: 2, baseScale: 2, mb: 100, lastSeen: 0 }); // at its first scale: kept
    const out = evictions([a, b, c, base], 10_000, 250);
    expect(out).toEqual([a, b]);
    expect(evictions([a, b, c, base], 10_000, 1000)).toEqual([]);
  });
});
