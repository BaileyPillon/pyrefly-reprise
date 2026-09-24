// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { anchorChipToRow, clearChipOfSlab } from '../../src/ui/ffx/targetChipClear.ts';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';

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

/**
 * PR-0019 remainder (FFX only): Chapter 3 at 1600x900 with Al Bhed Potion
 * chosen from the item list, the chip landed level with the list's top row
 * (HI-POTION, y 416..474) rather than the chosen one (y 549..607). Boxes are
 * the live GPU measurements (docs/screenshots/phase2/ffx-ui-pr0019/).
 */
describe('anchorChipToRow', () => {
  it('hangs the chip just right of the chosen row, centred on its height', () => {
    const root = rectEl({ top: 0, left: 0, width: 1600, height: 900 });
    const row = rectEl({ top: 549, left: 105, width: 392, height: 58 });
    const chip = rectEl({ top: 406, left: 606, width: 137, height: 33 });
    expect(anchorChipToRow(chip, row, root)).toBe(true);
    expect(chip.classList.contains('ffx-target__all--row')).toBe(true);
    expect(parseFloat(chip.style.left)).toBe(507);
    expect(parseFloat(chip.style.top)).toBe(578);
  });

  it('works in root-relative coordinates when the root is offset', () => {
    const root = rectEl({ top: 20, left: 40, width: 1280, height: 720 });
    const row = rectEl({ top: 120, left: 100, width: 300, height: 40 });
    const chip = rectEl({ top: 0, left: 0, width: 100, height: 20 });
    anchorChipToRow(chip, row, root);
    expect(parseFloat(chip.style.left)).toBe(400 - 40 + 10);
    expect(parseFloat(chip.style.top)).toBe(140 - 20);
  });

  it('refuses a row with no box and leaves the chip alone', () => {
    const root = rectEl({ top: 0, left: 0, width: 1600, height: 900 });
    const chip = rectEl({ top: 10, left: 10, width: 80, height: 20 });
    chip.style.top = '10px';
    expect(anchorChipToRow(chip, rectEl({ top: 0, left: 0, width: 0, height: 0 }), root)).toBe(false);
    expect(chip.style.top).toBe('10px');
    expect(chip.classList.contains('ffx-target__all--row')).toBe(false);
  });
});

describe('TargetCursor group chip follows the anchor row (FFX only)', () => {
  const PARTY: TargetEntry[] = [
    { id: 'tidus', name: 'Tidus', kind: 'self' },
    { id: 'yuna', name: 'Yuna', kind: 'ally' },
    { id: 'auron', name: 'Auron', kind: 'ally' },
  ];
  const cursor = (): TargetCursor => {
    document.body.innerHTML = '';
    const c = new TargetCursor();
    c.setProjector(() => ({ x: 600, y: 470, w: 120, h: 300 }));
    document.body.append(c.el);
    return c;
  };

  it('with a visible chosen row, the chip sits beside that row', () => {
    const c = cursor();
    const row = rectEl({ top: 549, left: 105, width: 392, height: 58 });
    c.setGroupAnchorRow(() => row);
    c.showGroup(PARTY);
    const chip = c.el.querySelector<HTMLElement>('.ffx-target__all')!;
    expect(chip.classList.contains('ffx-target__all--row')).toBe(true);
    expect(parseFloat(chip.style.top)).toBe(578);
  });

  it('with no row (list closed, or FFX-2 which never wires one) it keeps its place over the group', () => {
    const c = cursor();
    c.setGroupAnchorRow(() => null);
    c.showGroup(PARTY);
    const chip = c.el.querySelector<HTMLElement>('.ffx-target__all')!;
    expect(chip.classList.contains('ffx-target__all--row')).toBe(false);
    expect(parseFloat(chip.style.top)).toBe(470);
  });
});
