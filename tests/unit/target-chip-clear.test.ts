// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { clearChipOfSlab } from '../../src/ui/ffx/targetChipClear.ts';

/**
 * PR-0019 (FFX only): the "ALL ALLIES"/"ALL ENEMIES" chip must clear the
 * command help slab instead of painting over it. jsdom never lays elements
 * out, so `getBoundingClientRect()` is stubbed per element the way the round
 * 12 verifier's live capture found it overlapping (chip centred over the
 * slab's right half, at 1280x720 Chapter 1 Special > Cheer scale).
 */
function rectEl(box: { top: number; left: number; width: number; height: number }): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
      right: box.left + box.width,
      bottom: box.top + box.height,
      x: box.left,
      y: box.top,
      toJSON: () => box,
    }) as DOMRect;
  return el;
}

describe('clearChipOfSlab', () => {
  it('nudges the chip clear when it overlaps the slab', () => {
    const slab = rectEl({ top: 121, left: 30, width: 160, height: 33 });
    const chip = rectEl({ top: 110, left: 90, width: 80, height: 20 });
    chip.style.top = '110px';

    clearChipOfSlab(chip, slab);

    const newTop = parseFloat(chip.style.top);
    const newBottom = newTop + 20;
    // Cleared vertically: either fully above the slab's top, or fully below
    // its bottom (with the 4px gap the function keeps).
    expect(newTop >= 154 || newBottom <= 121).toBe(true);
  });

  it('picks the shorter nudge', () => {
    // Slab spans 121..154. A chip barely dipping into the top of the slab
    // (bottom at 125) is 4px from clearing upward and 33px from clearing
    // downward — it must go up.
    const slab = rectEl({ top: 121, left: 30, width: 160, height: 33 });
    const chip = rectEl({ top: 105, left: 90, width: 80, height: 20 });
    chip.style.top = '105px';

    clearChipOfSlab(chip, slab);

    expect(parseFloat(chip.style.top)).toBeLessThan(105);
  });

  it('leaves the chip alone when there is no overlap', () => {
    const slab = rectEl({ top: 121, left: 30, width: 160, height: 33 });
    const chip = rectEl({ top: 10, left: 90, width: 80, height: 20 });
    chip.style.top = '10px';

    clearChipOfSlab(chip, slab);

    expect(chip.style.top).toBe('10px');
  });

  it('does nothing when the slab is hidden or has no box', () => {
    const slab = rectEl({ top: 0, left: 0, width: 0, height: 0 });
    const chip = rectEl({ top: 10, left: 10, width: 80, height: 20 });
    chip.style.top = '10px';

    clearChipOfSlab(chip, slab);
    expect(chip.style.top).toBe('10px');

    const hiddenSlab = rectEl({ top: 121, left: 30, width: 160, height: 33 });
    hiddenSlab.hidden = true;
    clearChipOfSlab(chip, hiddenSlab);
    expect(chip.style.top).toBe('10px');

    clearChipOfSlab(chip, null);
    expect(chip.style.top).toBe('10px');
  });
});
