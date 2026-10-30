// @vitest-environment jsdom
/**
 * `__pyrefly.art.stats()` carries the books the budgets jobs read (lane "budgets-2", 2026-10-29; BOTH games, debug seam only; review X22): the memory the caches hold and what the last fight released,
 * the phone hold's counts and the queue, and three's own count of what the renderer holds. The jobs read these keys at every board; a change that drops or renames one would leave them reading
 * nothing, so the shape is pinned here.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { installArtDebug } from '../../src/debug/artApi.ts';
import { clearPaintingCache } from '../../src/engine/PaintedArtCache.ts';
import { resetHoldForTests } from '../../src/engine/LoadHold.ts';

afterEach(() => {
  clearPaintingCache();
  resetHoldForTests();
});

type Stats = Record<string, unknown> & {
  memory: { paintings: number; paintingMB: number; stamps: number; relight: { maps: number; textures: number; pinned: number; stamps: number }; fight: number; release: boolean; last: unknown };
  hold: { held: boolean; holds: number; opens: number; ceilings: number; deferredMaps: number; deferredPoses: number; heldMs: number; queue: { inFlight: number; queued: number } };
  gl: { geometries: number; textures: number; programs: number } | null;
};

const stats = (renderer: unknown): Stats => {
  const api: Record<string, unknown> = {};
  installArtDebug(api, { renderer, current: null } as unknown as App);
  return (api['art'] as { stats: () => Stats }).stats();
};

describe('art.stats(): the books of the memory and the load', () => {
  it('memory, hold and gl are there with the keys the jobs read', () => {
    const s = stats({ aaMode: 'off', renderer: { info: { memory: { geometries: 3, textures: 7 }, programs: [{ id: 1, name: 'standard' }, { id: 2, name: 'figure' }] } } });
    expect(s.memory).toEqual({
      paintings: 0,
      paintingMB: 0,
      stamps: 0,
      relight: { maps: 0, textures: 0, pinned: 0, stamps: 0 },
      fight: 0,
      release: true,
      last: null,
    });
    expect(s.hold).toEqual({ held: false, holds: 0, opens: 0, ceilings: 0, deferredMaps: 0, deferredPoses: 0, heldMs: 0, queue: { inFlight: 0, queued: 0 } });
    expect(s.gl).toEqual({ geometries: 3, textures: 7, programs: 2 });
    expect(s.programs).toEqual(['1:standard', '2:figure']);
  });

  it('a renderer that does not report its memory gives gl null, not a throw', () => {
    const s = stats({ aaMode: 'off', renderer: {} });
    expect(s.gl).toBeNull();
    expect(s.memory.release).toBe(true);
  });
});
