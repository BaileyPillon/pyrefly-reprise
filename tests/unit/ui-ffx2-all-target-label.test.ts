// @vitest-environment jsdom
/**
 * The FFX-2 "ALL ENEMIES" / "ALL ALLIES" field label reads at a glance and the
 * enemy-move slab keeps off it (critic round 13 PR-0193; release 19 focused
 * review FOC19-05; CHK-010, CHK-003, CHK-008).
 *
 * Before: the label was a fixed 13 px at every viewport (it lives on the
 * unscaled overlay), and nothing moved it off the enemy-move slab, which sat
 * over it in Chapter VI at 2560x1440 (Grenade) and in the Den at 1600x900
 * (Pray). The label now steps off the panels (`allLabelClear.ts`); making the
 * slab dodge it instead pushed the slab onto Yuna.
 *
 * **Game case: FFX-2 only** for this change: the rule is in the FFX-2 HUD's own
 * sheet (`target-plates.css`) and its plate docking loop (`plateRedock.ts`). The FFX
 * half of PR-0193 (Chapter III) lives in `ffx/ffx-hud.css` and
 * `ffx/TargetCursor.ts`, which belong to another batch.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { clearGroupLabels, clearShift } from '../../src/ui/ffx2/allLabelClear.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx2', 'target-plates.css'), 'utf8');

function rectOf(el: HTMLElement, left: number, top: number, right: number, bottom: number): void {
  el.getBoundingClientRect = () =>
    ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
}

describe('the FFX-2 ALL label (PR-0193, FOC19-05)', () => {
  it('steps off a panel it lands on by the smallest clear shift, inside the window', () => {
    const label = { left: 900, top: 300, right: 1060, bottom: 330 };
    const slab = { x: 1000, y: 280, w: 400, h: 300 }; // the enemy-move slab over its right half
    const s = clearShift(label, [slab], { width: 2560, height: 1440 })!;
    expect(s).not.toBeNull();
    const moved = { left: label.left + s.dx, top: label.top + s.dy, right: label.right + s.dx, bottom: label.bottom + s.dy };
    const hit = moved.left < slab.x + slab.w && moved.right > slab.x && moved.top < slab.y + slab.h && moved.bottom > slab.y;
    expect(hit).toBe(false);
    expect(Math.hypot(s.dx, s.dy)).toBeLessThanOrEqual(80); // left of the slab: 66 px
  });

  it('stays put when already clear, and when nothing fits', () => {
    expect(clearShift({ left: 0, top: 0, right: 10, bottom: 10 }, [{ x: 100, y: 100, w: 10, h: 10 }], { width: 200, height: 200 })).toEqual({ dx: 0, dy: 0 });
    expect(clearShift({ left: 0, top: 0, right: 10, bottom: 10 }, [{ x: 0, y: 0, w: 20, h: 20 }], { width: 20, height: 20 })).toBeNull();
  });

  it('writes the shift as a translate on the label, and measures from its home', () => {
    const root = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'ffx-target__all';
    rectOf(label, 900, 300, 1060, 330);
    root.append(label);
    clearGroupLabels(root, [{ x: 1000, y: 280, w: 400, h: 300 }]);
    expect(label.style.translate).toMatch(/px/);
    // A second pass on the same (stubbed, unshifted) box computes the same shift.
    const first = label.style.translate;
    rectOf(label, 900 + Number(label.dataset['clearShift']!.split(' ')[0]), 300 + Number(label.dataset['clearShift']!.split(' ')[1]), 1060 + Number(label.dataset['clearShift']!.split(' ')[0]), 330 + Number(label.dataset['clearShift']!.split(' ')[1]));
    clearGroupLabels(root, [{ x: 1000, y: 280, w: 400, h: 300 }]);
    expect(label.style.translate).toBe(first);
  });

  /** `font-size: max(Apx, calc(Bpx * var(--ffx2-scale)))` evaluated at a stage scale. */
  function renderedPx(scale: number): number {
    const m = SHEET.match(/\.ffx2hud \.ffx-target__all span\s*\{[^}]*font-size:\s*max\(([\d.]+)px,\s*calc\(([\d.]+)px \* var\(--ffx2-scale[^)]*\)\)\)/);
    expect(m, 'the scaled font-size rule').not.toBeNull();
    return Math.max(Number(m![1]), Number(m![2]) * scale);
  }

  it('scales with the stage and never renders under 14 px', () => {
    const at = (w: number, h: number): number => renderedPx(Math.min(w / 640, h / 360));
    expect(at(1280, 720)).toBeGreaterThanOrEqual(14);
    expect(at(1600, 900)).toBeGreaterThanOrEqual(14);
    expect(at(2560, 1440)).toBeGreaterThan(at(1280, 720));
    expect(at(2560, 1440)).toBeGreaterThanOrEqual(20);
  });
});
