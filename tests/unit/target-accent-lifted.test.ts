/**
 * PR-0031 (both games, one field renderer): a figure its station lifts off the floor (the Chapter III
 * Yu Pagodas stand at y 1.01) wears the selection accent as the upright halo behind it, as a
 * levitating figure does, not as a pool on the floor far below it. Real keys at 1600x900 (iter2-b5):
 * the floor pool under Pagoda A lay behind Tidus, Auron and Yuna and read as nothing. A figure on
 * the ground keeps its floor pool.
 */
import { describe, expect, it } from 'vitest';
import { selectAccentStyle } from '../../src/engine/selectAccentStyle.ts';

describe('selectAccentStyle', () => {
  it('a station-lifted figure (Yu Pagoda at y 1.01) gets the halo', () => {
    expect(selectAccentStyle(0, 1.01)).toBe('halo');
  });
  it('a levitating figure gets the halo', () => {
    expect(selectAccentStyle(0.8, 0)).toBe('halo');
  });
  it('a figure on the ground keeps the floor pool', () => {
    expect(selectAccentStyle(0, 0)).toBe('pool');
    expect(selectAccentStyle(0, 0.02)).toBe('pool');
  });
});
