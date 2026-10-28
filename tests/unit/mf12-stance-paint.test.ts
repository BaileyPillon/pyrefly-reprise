/**
 * Release 66 merge of lane L1 (mf-l1-swaps, MF-05: `ready` drawn on the idle painting under `?stance=v1a|v1b`) and lane L2 (mf-l2-moves, MF-12: a held string of blows hands the stance it began from back).
 * Both are switches that default to today, and they meet in one place: the flinch of a second blow reads `hurt` as the requested pose, so the painting it hands back must be the string's, not `hurt`'s (none).
 * Pure bookkeeping (`StringStance`), both games.
 */
import { describe, expect, it } from 'vitest';
import { StringStance } from '../../src/engine/motion/StringStance.ts';

describe('StringStance paints the stance a held string hands back', () => {
  it('with nothing held, answers the actor\'s own pose and painting (the default is today\'s line)', () => {
    const s = new StringStance();
    expect(s.back('ready', 1)).toBe('ready');
    expect(s.paint('ready', 'idle', 1)).toBe('idle');
    s.begin(1, 'ready', false, 'idle');
    expect(s.back('hurt', 1)).toBe('hurt');
    expect(s.paint('hurt', undefined, 1)).toBeUndefined();
  });

  it('a single flinch begun without a hold keeps nothing for the next blow', () => {
    const s = new StringStance();
    s.begin(1, 'ready', false, 'idle');
    expect(s.paint('hurt', undefined, 1)).toBeUndefined();
  });

  it('a held first blow hands the string\'s stance AND its painting to the second blow', () => {
    const s = new StringStance();
    s.begin(1, 'ready', true, 'idle');
    expect(s.back('hurt', 1)).toBe('ready');
    expect(s.paint('hurt', undefined, 1)).toBe('idle');
  });

  it('forgets once another action took the token', () => {
    const s = new StringStance();
    s.begin(1, 'ready', true, 'idle');
    expect(s.paint('hurt', undefined, 2)).toBeUndefined();
    expect(s.paint('ready', 'idle', 1)).toBe('idle');
  });
});
