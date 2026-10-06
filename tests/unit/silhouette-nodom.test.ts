import { describe, expect, it } from 'vitest';
import { alphaMaskOf, profileOfActor } from '../../src/engine/motion/Silhouette.ts';

/** Without a DOM (a unit test, a worker) a painting cannot be read: the strike falls back to the painted box (r391-reach). */
describe('Silhouette without a DOM canvas', () => {
  it('reads nothing, and says so with undefined rather than throwing', () => {
    expect(typeof document).toBe('undefined');
    const actor = {
      active: 0,
      slots: [{ mesh: { scale: { x: 1, y: 1 } }, material: { uniforms: { map: { value: { image: { width: 100, height: 100 } } } } }, scale: { contentBox: { x0: -0.5, x1: 0.5, y0: 0, y1: 1 }, offsetY: 0.5 } }],
    };
    expect(alphaMaskOf(actor)).toBeUndefined();
    expect(profileOfActor(actor)).toBeUndefined();
  });
});
