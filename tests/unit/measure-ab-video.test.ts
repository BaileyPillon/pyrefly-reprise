/**
 * Review M4 of the motion-fluidity pass (lane L5; both games, tooling): where the 12-frame strip of a phone card made from an existing clip is anchored. `pickAnchor` is pure.
 * An unrestricted "the panels differ most" pick landed on frame 0 (tidus-ko), on the last frames (tidus-hurt), and in a whiteout (rikku-ko), and favours the frame that shows the flaw.
 */
import { describe, expect, it } from 'vitest';
import { pickAnchor } from '../../tools/measure/ab-video.mjs';

const flat = (n: number, v = 1) => Array.from({ length: n }, () => v);

describe('where the strip is anchored', () => {
  it('a card\'s own frame wins, clamped into the clip', () => {
    const curve = flat(240); curve[3] = 99;
    expect(pickAnchor({ curve, total: 240, override: 96 })).toEqual({ at: 96, kind: 'chosen' });
    expect(pickAnchor({ curve, total: 240, override: 9999 }).at).toBe(239);
    expect(pickAnchor({ curve, total: 240, override: -5 }).at).toBe(0);
  });

  it('otherwise the largest difference in the middle 60 percent, never the first or last stretch of the clip', () => {
    const curve = flat(240); curve[0] = 50; curve[236] = 60; curve[110] = 9;
    const pick = pickAnchor({ curve, bright: flat(240, 80), total: 240 });
    expect(pick).toEqual({ at: 110, kind: 'largest-difference-in-the-middle' });
    // the middle 60 percent of 240 frames is 48 to 191
    expect(pickAnchor({ curve: flat(240).map((_, i) => (i === 40 || i === 200 ? 70 : 1)), total: 240 }).at).toBeGreaterThanOrEqual(48);
  });

  it('leaves a whiteout out, and falls back to the middle of the clip when every frame is washed out', () => {
    const curve = flat(240); curve[100] = 80; curve[150] = 5;
    const bright = flat(240, 70); bright[100] = 240; // the biggest "difference" is a flash
    expect(pickAnchor({ curve, bright, total: 240 }).at).toBe(150);
    expect(pickAnchor({ curve, bright: flat(240, 250), total: 240 })).toEqual({ at: 120, kind: 'middle' });
  });
});
