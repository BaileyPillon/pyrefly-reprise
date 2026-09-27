// @vitest-environment jsdom
/**
 * PR-0031 / PR-0178 (FFX only): the top TARGET plate in both approved targeting frames is an
 * agent's inference (the tile's `mustRemain` names the hand, the ring and the dim only), so it is
 * built behind a switch; plan §8 Q5 was answered yes on 2026-09-27 (D-249), so it ships ON. OFF:
 * nothing ever shows. ON: it names the target set.
 */
import { describe, expect, it } from 'vitest';
import { FfxTargetPlate, FFX_TARGET_PLATE_ENABLED } from '../../src/ui/ffx/targetPlateFfx.ts';

describe('the FFX TARGET plate', () => {
  it('ships ON since Bailey yes (D-249, plan section 8 Q5)', () => {
    expect(FFX_TARGET_PLATE_ENABLED).toBe(true);
    const p = new FfxTargetPlate();
    p.show(['Yu Pagoda A']);
    expect(p.el.hidden).toBe(false);
  });

  it('switched off, nothing ever shows', () => {
    const p = new FfxTargetPlate(false);
    p.show(['Yu Pagoda A']);
    expect(p.el.hidden).toBe(true);
  });

  it('switched on, names the set and hides at the end of the selection', () => {
    const p = new FfxTargetPlate(true);
    p.show(['Tidus', 'Yuna', 'Auron']);
    expect(p.el.hidden).toBe(false);
    expect(p.el.textContent).toBe('TARGETTidus · Yuna · Auron');
    p.show(null);
    expect(p.el.hidden).toBe(true);
  });
});
