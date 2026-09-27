/**
 * A-3, the board half (iteration 2, B6): the focused card's battle starts loading after a short
 * dwell, arrowing past cards starts nothing, and the chapter select screen wires it.
 *
 * Game case: both (shared loading).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardWarmer, DWELL_MS } from '../../src/app/screens/frontend/boardWarm.ts';
import type { Chapter } from '../../src/data/encounters.ts';

const ch = (id: string): Chapter => ({ id } as unknown as Chapter);

describe('A-3: warm the board', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts the focused chapter after the dwell, once', () => {
    const warm = vi.fn();
    const w = new BoardWarmer(warm);
    w.focus(ch('seymour-flux'));
    vi.advanceTimersByTime(DWELL_MS - 1);
    expect(warm).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(warm).toHaveBeenCalledTimes(1);
    expect(warm.mock.calls[0]![0].id).toBe('seymour-flux');
    // Coming back to it later does not start a second run.
    w.focus(ch('yunalesca'));
    w.focus(ch('seymour-flux'));
    vi.advanceTimersByTime(DWELL_MS * 2);
    expect(warm).toHaveBeenCalledTimes(1);
    expect(w.warmed).toEqual(['seymour-flux']);
  });

  it('arrowing past cards starts nothing; only the card the player rests on loads', () => {
    const warm = vi.fn();
    const w = new BoardWarmer(warm);
    for (const id of ['a', 'b', 'c', 'd']) {
      w.focus(ch(id));
      vi.advanceTimersByTime(DWELL_MS / 3);
    }
    w.focus(null); // a COMING card
    vi.advanceTimersByTime(DWELL_MS * 3);
    expect(warm).not.toHaveBeenCalled();
    w.focus(ch('e'));
    vi.advanceTimersByTime(DWELL_MS);
    expect(warm.mock.calls.map((c) => c[0].id)).toEqual(['e']);
  });

  it('leaving the screen cancels a pending start', () => {
    const warm = vi.fn();
    const w = new BoardWarmer(warm);
    w.focus(ch('a'));
    w.cancel();
    vi.advanceTimersByTime(DWELL_MS * 2);
    expect(warm).not.toHaveBeenCalled();
  });

  it('the chapter select screen focuses the warmer on every selection and cancels on exit', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '..', '..', 'src', 'app', 'screens', 'ChapterSelectScreen.ts'), 'utf8');
    expect(src).toContain("import { BoardWarmer } from './frontend/boardWarm.ts';");
    expect(src).toMatch(/this\.warmer\.focus\(/);
    expect(src).toMatch(/this\.warmer\.cancel\(\)/);
  });
});
