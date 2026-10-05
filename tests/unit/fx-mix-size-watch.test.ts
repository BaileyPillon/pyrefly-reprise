// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { SizeWatch, windowKey } from '../../src/engine/fx/mix/colossusPin.ts';

/**
 * A window resized under a table row (Seymour Natus's pinned colossus master, FFX only; PR-0331): the pin is proved for window shapes 1.70 to 2.45 and judged at plan
 * time, and the live check never re-plans a pinned master, so a window dragged to 16:10 or 4:3, or fullscreen left, kept a master the table has not proved (measured on
 * the branch before this watch: at 1440x900 a member 15 % under a panel, at 1024x768 42 %). The plan is asked for again once the window has stood at a new size for 0.4 s.
 */
const STEP = 1 / 60;

/** Runs frames from `t0` for `secs` seconds at `size`; returns the first time `moved` answered true, or null. */
function run(w: SizeWatch, t0: number, secs: number, size: string): number | null {
  for (let t = t0; t < t0 + secs; t += STEP) if (w.moved(t, size)) return t;
  return null;
}

describe('SizeWatch', () => {
  it('watches nothing while no table row pins a master (the plan noted no window)', () => {
    const w = new SizeWatch();
    expect(run(w, 0, 2, '1600x900')).toBeNull();
    expect(run(w, 2, 2, '1024x768')).toBeNull();
    w.plannedFor('');
    expect(run(w, 4, 2, '1440x900')).toBeNull();
  });

  it('is quiet at the size the plan was made for, however long it stays', () => {
    const w = new SizeWatch();
    run(w, 0, 1, '1600x900');
    w.plannedFor('1600x900');
    expect(run(w, 1, 60, '1600x900')).toBeNull();
  });

  it('asks once the window has stood at a new size for 0.4 s, and not before', () => {
    const w = new SizeWatch();
    run(w, 0, 1, '1600x900');
    w.plannedFor('1600x900');
    const at = run(w, 1, 2, '1440x900');
    expect(at).not.toBeNull();
    expect(at! - 1).toBeGreaterThanOrEqual(0.4 - 1e-9);
    expect(at! - 1).toBeLessThan(0.4 + 2 * STEP);
  });

  it('a drag, a new size every frame, asks only after it stops', () => {
    const w = new SizeWatch();
    run(w, 0, 1, '1600x900');
    w.plannedFor('1600x900');
    let asked: number | null = null;
    let t = 1;
    for (let i = 0; i < 90; i++, t += STEP) if (w.moved(t, `${1500 - i * 4}x900`) && asked === null) asked = t;
    expect(asked).toBeNull();
    const after = run(w, t, 1, `${1500 - 89 * 4}x900`);
    expect(after).not.toBeNull();
    expect(after! - t).toBeLessThan(0.4 + 2 * STEP);
  });

  it('is quiet again once the plan for the new size is made', () => {
    const w = new SizeWatch();
    run(w, 0, 1, '1600x900');
    w.plannedFor('1600x900');
    expect(run(w, 1, 1, '1024x768')).not.toBeNull();
    w.plannedFor('1024x768');
    expect(run(w, 2, 30, '1024x768')).toBeNull();
    // and back to the proved shape: another plan, once
    expect(run(w, 32, 1, '1600x900')).not.toBeNull();
  });

  it('a size that comes back to the planned one within the wait asks for nothing', () => {
    const w = new SizeWatch();
    run(w, 0, 1, '1600x900');
    w.plannedFor('1600x900');
    expect(run(w, 1, 0.3, '1440x900')).toBeNull();
    expect(run(w, 1.3, 5, '1600x900')).toBeNull();
  });

  it('keeps asking until the plan is made (a plan that has to wait for a calm frame)', () => {
    const w = new SizeWatch();
    run(w, 0, 1, '1600x900');
    w.plannedFor('1600x900');
    const first = run(w, 1, 1, '1440x900');
    expect(first).not.toBeNull();
    expect(w.moved(first! + STEP, '1440x900')).toBe(true);
    expect(w.moved(first! + 5 * STEP, '1440x900')).toBe(true);
  });
});

describe('windowKey', () => {
  it('reads the window the plan stands in', () => {
    expect(windowKey()).toBe(`${window.innerWidth}x${window.innerHeight}`);
  });
});
