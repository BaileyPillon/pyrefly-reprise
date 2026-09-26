// @vitest-environment jsdom
/**
 * The FFX-2 "ALL ENEMIES" / "ALL ALLIES" field label reads at a glance and the
 * enemy-move slab keeps off it (critic round 13 PR-0193; release 19 focused
 * review FOC19-05; CHK-010, CHK-003, CHK-008).
 *
 * Before: the label was a fixed 13 px at every viewport (it lives on the
 * unscaled overlay), and the slab did not list it as an obstacle, so it sat
 * over the label's last lines in Chapter VI at 2560x1440 (Grenade) and in the
 * Den at 1600x900 (Pray).
 *
 * **Game case: FFX-2 only** for this change: the rule is in the FFX-2 HUD's own
 * sheet (`target-plates.css`) and its slab solver (`intentBoard.ts`). The FFX
 * half of PR-0193 (Chapter III) lives in `ffx/ffx-hud.css` and
 * `ffx/TargetCursor.ts`, which belong to another batch.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { boardRects } from '../../src/ui/ffx2/intentBoard.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'ffx2', 'target-plates.css'), 'utf8');

function rectOf(el: HTMLElement, left: number, top: number, right: number, bottom: number): void {
  el.getBoundingClientRect = () =>
    ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
}

describe('the FFX-2 ALL label (PR-0193, FOC19-05)', () => {
  it('is an obstacle the enemy-move slab steers around', () => {
    const root = document.createElement('div');
    const targeting = document.createElement('div');
    targeting.className = 'ffx-targeting';
    const label = document.createElement('div');
    label.className = 'ffx-target__all ffx-target__all--enemy';
    rectOf(label, 900, 300, 1060, 330);
    targeting.append(label);
    root.append(targeting);
    const rects = boardRects(root, { scale: 2.5, chipReach: 20 });
    const hit = rects.find((r) => r.left <= 900 && r.right >= 1060 && r.top <= 300 && r.bottom >= 330);
    expect(hit, JSON.stringify(rects)).toBeDefined();
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
