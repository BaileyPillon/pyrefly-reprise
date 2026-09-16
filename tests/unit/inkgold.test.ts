// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { showTurnCutIn } from '../../src/ui/inkgold/cutin.ts';
import { installInkGoldStyles } from '../../src/ui/inkgold/index.ts';
import { playWipe, prefersReducedMotion, resolveWipeOptions } from '../../src/ui/inkgold/wipe.ts';

const INKGOLD_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/inkgold');
const readCss = (name: string): string => readFileSync(join(INKGOLD_DIR, name), 'utf8');

function mockReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------- pure logic

describe('resolveWipeOptions', () => {
  it('defaults to an ltr, paper-coloured, 480ms wipe with no onCover', () => {
    expect(resolveWipeOptions()).toEqual({
      direction: 'ltr',
      durationMs: 480,
      color: '#f4f1e8',
      onCover: undefined,
    });
  });

  it('keeps every explicit override', () => {
    const onCover = (): void => {};
    expect(resolveWipeOptions({ direction: 'rtl', durationMs: 200, color: '#fff', onCover })).toEqual({
      direction: 'rtl',
      durationMs: 200,
      color: '#fff',
      onCover,
    });
  });
});

describe('prefersReducedMotion', () => {
  it('is false when the injected host has no matchMedia', () => {
    expect(prefersReducedMotion({})).toBe(false);
  });

  it('reflects an injected matcher that prefers reduced motion', () => {
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: true }) })).toBe(true);
  });

  it('reflects an injected matcher that does not', () => {
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: false }) })).toBe(false);
  });

  it('falls back to the real window when no host is given', () => {
    mockReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('installInkGoldStyles', () => {
  it('is a no-op safe to call more than once', () => {
    expect(() => {
      installInkGoldStyles();
      installInkGoldStyles();
    }).not.toThrow();
  });
});

// -------------------------------------------------------- reduced-motion cut

describe('playWipe under prefers-reduced-motion', () => {
  it('resolves immediately, fires onCover once, and never inserts a wipe panel', async () => {
    mockReducedMotion(true);
    const root = document.createElement('div');
    const onCover = vi.fn();

    await playWipe(root, { onCover });

    expect(onCover).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.ig-wipe')).toBeNull();
  });
});

describe('showTurnCutIn under prefers-reduced-motion', () => {
  it('mounts already at rest (no transition) and dismisses synchronously', async () => {
    mockReducedMotion(true);
    const root = document.createElement('div');

    const handle = showTurnCutIn(root, { name: 'Tidus', portraitUrl: 'tidus.png', ctbLabel: 'CTB 1 OF 3' });
    const slab = handle.el.querySelector('.ig-cutin__slab') as HTMLElement;
    expect(slab.style.transform).toBe('skewX(-12deg)');

    await handle.dismiss();
    expect(root.querySelector('.ig-cutin')).toBeNull();
  });
});

// --------------------------------------------------------- timed animations

describe('playWipe sweep timing', () => {
  beforeEach(() => {
    mockReducedMotion(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('covers at the halfway point, then clears and resolves at the full duration', async () => {
    const root = document.createElement('div');
    const onCover = vi.fn();
    const done = playWipe(root, { durationMs: 100, onCover });

    expect(root.querySelector('.ig-wipe')).not.toBeNull();
    expect(onCover).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);
    expect(onCover).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.ig-wipe')).not.toBeNull(); // still clearing

    await vi.advanceTimersByTimeAsync(50);
    await done;
    expect(root.querySelector('.ig-wipe')).toBeNull();
  });

  it('mirrors direction "rtl" to a negative skew angle', () => {
    const root = document.createElement('div');
    void playWipe(root, { direction: 'rtl', durationMs: 100 });
    const panel = root.querySelector('.ig-wipe') as HTMLElement;
    expect(panel.style.transform).toContain('skewX(-19deg)');
  });
});

describe('showTurnCutIn entrance/exit timing', () => {
  beforeEach(() => {
    mockReducedMotion(false);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('overshoots to -24deg then settles to -12deg, 120ms later', () => {
    const root = document.createElement('div');
    const handle = showTurnCutIn(root, { name: 'Tidus', portraitUrl: 'tidus.png', ctbLabel: 'CTB 1 OF 3' });
    const slab = handle.el.querySelector('.ig-cutin__slab') as HTMLElement;

    expect(slab.style.transform).toBe('translateX(0%) skewX(-24deg)');
    vi.advanceTimersByTime(120);
    expect(slab.style.transform).toBe('translateX(0%) skewX(-12deg)');
  });

  it('mirrors side "right": positions from the right edge with a positive rest skew', () => {
    const root = document.createElement('div');
    const handle = showTurnCutIn(root, {
      name: 'Shuyin',
      portraitUrl: 'shuyin.png',
      ctbLabel: 'CTB 1 OF 3',
      side: 'right',
    });
    const slab = handle.el.querySelector('.ig-cutin__slab') as HTMLElement;
    expect(slab.style.left).toBe('');
    expect(slab.style.right).not.toBe('');

    vi.advanceTimersByTime(180);
    expect(slab.style.transform).toBe('translateX(0%) skewX(12deg)');
  });

  it('renders the "YOUR TURN" label with the caller-supplied CTB text', () => {
    const root = document.createElement('div');
    const handle = showTurnCutIn(root, { name: 'Yuna', portraitUrl: 'yuna.png', ctbLabel: 'CTB 2 OF 3' });
    expect(handle.el.querySelector('.ig-cutin__ctb')?.textContent).toBe('YOUR TURN · CTB 2 OF 3');
    expect(handle.el.querySelector('.ig-cutin__name')?.textContent).toBe('Yuna');
  });

  it('dismiss() slides the slab off and removes the cut-in after DISMISS_MS', async () => {
    const root = document.createElement('div');
    const handle = showTurnCutIn(root, { name: 'Tidus', portraitUrl: 'tidus.png', ctbLabel: 'CTB 1 OF 3' });
    vi.advanceTimersByTime(180); // let the entrance settle first

    const done = handle.dismiss();
    expect(root.querySelector('.ig-cutin')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(150);
    await done;
    expect(root.querySelector('.ig-cutin')).toBeNull();
  });
});

// ---------------------------------------------------------------- CSS tokens

describe('tokens.css', () => {
  const css = readCss('tokens.css');

  it('declares every palette token from the spec, verbatim', () => {
    for (const hex of ['#0b0a12', '#f4f1e8', '#e3b94a', '#b8862a', '#b02a2a', '#7fc6e8', '#f7b6d9']) {
      expect(css.toLowerCase()).toContain(hex);
    }
  });

  it('declares the slab skew and wipe angle from the spec', () => {
    expect(css).toContain('-12deg');
    expect(css).toContain('19deg');
  });

  it('swaps the accent to pink under .ig--ffx2', () => {
    const ffx2Block = css.slice(css.indexOf('.ig--ffx2'));
    expect(ffx2Block).toContain('--ig-pyre-pink');
  });

  it('falls back to the shared --font-serif rather than declaring its own @font-face', () => {
    expect(css).toContain('var(--font-serif');
    expect(css).not.toContain('@font-face');
  });
});

describe('slabs.css', () => {
  const css = readCss('slabs.css');

  it('converts the command row rect (292x52 @1440) to the logical grid', () => {
    expect(css).toContain('129.78px'); // 292 / 2.25
    expect(css).toContain('23.11px'); // 52 / 2.25
  });

  it('converts the CTB "now" tile (64px @1440) and its diagonal step (-8px @1440)', () => {
    expect(css).toContain('28.44px'); // 64 / 2.25
    expect(css).toContain('-3.56px'); // -8 / 2.25
  });

  it('converts the party status row rect (450x62 @1440)', () => {
    expect(css).toContain('200px'); // 450 / 2.25
    expect(css).toContain('27.56px'); // 62 / 2.25
  });

  it('converts the damage numeral size (128px @1440)', () => {
    expect(css).toContain('56.89px'); // 128 / 2.25
  });
});
