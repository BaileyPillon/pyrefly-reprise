import { describe, expect, it } from 'vitest';
import { sceneLookA } from '../../src/engine/fx/a/sceneLooks.ts';

/**
 * VP-1001-23 (FFX-2 only, Chapter V): eye candy D's default FFX-2 bloom (0.45, x1.5) spilled the
 * bright Farplane plate over the girls and washed Rikku's face out. The room keeps to the hot light,
 * as the scene's own palette does (threshold 0.9 at half strength, `farplane.ts`).
 */
describe('the Farplane look', () => {
  it('blooms only the hot light, well above the plate behind the party (~0.76)', () => {
    const look = sceneLookA('farplane', 'ffx2');
    expect(look.bloom.threshold).toBeGreaterThan(0.8);
    expect(look.bloom.strength).toBeLessThanOrEqual(1);
    expect(look.shafts).toEqual([]);
  });

  it('changes nothing for an FFX chapter that shares no key', () => {
    expect(sceneLookA('farplane', 'ffx').game).toBe('ffx');
  });
});
