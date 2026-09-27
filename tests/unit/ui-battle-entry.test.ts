// @vitest-environment jsdom
/**
 * A-2, the battle entry by situation (the approved "pane breaks" tile, Bailey
 * 2026-09-19): FFX blurs out of a scene and shatters on a skip or a retry,
 * FFX-2 shatters its own way, reduced motion cuts, low effects keeps the
 * swirl, skip spends 0 s, Confirm ends the leaving, and the implosion is off.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { entryKindFor, playBattleEntry } from '../../src/ui/common/transitions/entry.ts';
import { fracture, SHATTER_MAX_SHARDS } from '../../src/ui/common/transitions/shatter.ts';
import { IMPLOSION_ENABLED } from '../../src/ui/common/transitions/implosion.ts';

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('which entry', () => {
  it('follows the pick, per game and situation', () => {
    expect(entryKindFor('ffx', 'scene')).toBe('blur');
    expect(entryKindFor('ffx', 'skipped')).toBe('shatter-ffx');
    expect(entryKindFor('ffx', 'retry')).toBe('shatter-ffx');
    expect(entryKindFor('ffx2', 'scene')).toBe('shatter-ffx2');
    expect(entryKindFor('ffx2', 'retry')).toBe('shatter-ffx2');
  });

  it('never swirls outside the low tier; reduced motion cuts', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      for (const s of ['scene', 'skipped', 'retry'] as const) {
        expect(entryKindFor(game, s)).not.toBe('swirl');
        expect(entryKindFor(game, s, { low: true })).toBe('swirl');
        expect(entryKindFor(game, s, { reduced: true, low: true })).toBe('cut');
      }
    }
  });

  it('keeps the implosion off, and FFX-2 only when switched on', () => {
    expect(IMPLOSION_ENABLED).toBe(false);
    expect(entryKindFor('ffx2', 'scene', { implosion: true })).toBe('implosion');
    expect(entryKindFor('ffx', 'scene', { implosion: true })).toBe('blur');
  });
});

describe('the fracture', () => {
  it('caps the shard count', () => {
    const shards = fracture(1600, 900, 'ffx');
    expect(shards.length).toBeGreaterThan(20);
    expect(shards.length).toBeLessThanOrEqual(SHATTER_MAX_SHARDS);
  });

  it("FFX's glass leaves right to left: the rightmost shard moves first", () => {
    const shards = fracture(1600, 900, 'ffx');
    const right = shards.filter((s) => s.cx > 1200);
    const left = shards.filter((s) => s.cx < 400);
    expect(Math.max(...right.map((s) => s.delay))).toBeLessThan(Math.min(...left.map((s) => s.delay)));
    expect(shards.every((s) => s.ux < 0)).toBe(true);
  });

  it("FFX-2's bursts away from the strike, nearest first", () => {
    const shards = fracture(1600, 900, 'ffx2');
    const near = shards.reduce((a, b) => (Math.hypot(a.cx - 872, a.cy - 378) < Math.hypot(b.cx - 872, b.cy - 378) ? a : b));
    expect(near.delay).toBe(Math.min(...shards.map((s) => s.delay)));
  });

  it('is deterministic', () => {
    expect(fracture(1280, 720, 'ffx').map((s) => s.delay)).toEqual(fracture(1280, 720, 'ffx').map((s) => s.delay));
  });
});

describe('playing it', () => {
  it('spends nothing at skip speed', async () => {
    const root = document.createElement('div');
    const onCover = vi.fn();
    await playBattleEntry(root, { game: 'ffx', situation: 'scene', instant: true, onCover });
    expect(onCover).toHaveBeenCalledTimes(1);
    expect(root.children).toHaveLength(0);
  });

  it('swaps under the held frame at once, waits for the load, then leaves; a fresh Confirm ends it', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const order: string[] = [];
    let loaded: () => void = () => {};
    let done = false;
    const p = playBattleEntry(root, {
      game: 'ffx',
      situation: 'retry',
      reduced: false,
      low: false,
      onCover: () => {
        order.push('cover');
        return new Promise<void>((r) => (loaded = () => { order.push('loaded'); r(); }));
      },
    }).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(20);
    expect(order).toEqual(['cover']);
    expect(root.querySelector('.pf-entry--shatter')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(5000);
    expect(done).toBe(false); // held while loading
    loaded();
    await vi.advanceTimersByTimeAsync(50);
    // A key still held from the scene skip repeats: it does not end the leaving.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    await vi.advanceTimersByTimeAsync(50);
    expect(done).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await vi.advanceTimersByTimeAsync(40);
    await p;
    expect(done).toBe(true);
    expect(root.querySelector('.pf-entry')).toBeNull();
  });

  it('keeps the swirl for the low tier', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const root = document.createElement('div');
    const p = playBattleEntry(root, { game: 'ffx2', situation: 'scene', low: true, reduced: false });
    await vi.advanceTimersByTimeAsync(10);
    expect(root.querySelector('.pf-swirl')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(2000);
    await p;
    vi.unstubAllGlobals();
  });
});
