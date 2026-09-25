// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { boardRects, reticleBoxes } from '../../src/ui/ffx2/intentBoard.ts';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';

/**
 * FOC16-01 (release 16 focused review, `critic/reviews/fc7f1a20-focused.md`):
 * at Chapter XIII's target step the FFX-2 six-petal reticle around Oversoul
 * Paragon covered the enemy-move slab's description at 1600x900 and 2000x1012.
 * The slab now steers off the reticle's box, soft (like a fighter: never onto
 * the chrome to dodge it).
 *
 * **Game case: FFX-2 only.** The flower is FFX-2's reticle (FFX docks a hand);
 * the placement is the FFX-2 HUD's. Every FFX-2 chapter's target step uses it.
 */

const r = (left: number, top: number, right: number, bottom: number, soft = false): SlabRect => ({ left, top, right, bottom, ...(soft ? { soft } : {}) });
const overlap = (a: SlabRect, b: SlabRect): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

function rectOf(el: HTMLElement, b: SlabRect): void {
  el.getBoundingClientRect = () =>
    ({ left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.right - b.left, height: b.bottom - b.top, x: b.left, y: b.top, toJSON: () => ({}) }) as DOMRect;
}

/** The flower as `TargetCursor` draws it: an inline square, turning, so its bounding box breathes. */
function flower(root: HTMLElement, cx: number, cy: number, side: number, turnedBy: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'ffx-target__flower';
  el.style.width = `${side}px`;
  el.style.height = `${side}px`;
  const grown = (side * (Math.abs(Math.cos(turnedBy)) + Math.abs(Math.sin(turnedBy)))) / 2;
  rectOf(el, r(cx - grown, cy - grown, cx + grown, cy + grown));
  root.appendChild(el);
  return el;
}

describe('reticleBoxes (FFX-2 only)', () => {
  it('is the flower\'s own square, soft, at any angle of its turn', () => {
    for (const angle of [0, Math.PI / 8, Math.PI / 4]) {
      const root = document.createElement('div');
      flower(root, 884.5, 386.5, 501, angle);
      expect(reticleBoxes(root)).toEqual([r(634, 136, 1135, 637, true)]);
    }
  });

  it('skips a flower that is not laid out, and there is none outside target select', () => {
    const root = document.createElement('div');
    expect(reticleBoxes(root)).toEqual([]);
    const el = flower(root, 100, 100, 200, 0);
    rectOf(el, r(0, 0, 0, 0));
    expect(reticleBoxes(root)).toEqual([]);
  });

  it('boardRects lists it with the chrome', () => {
    const root = document.createElement('div');
    const stack = document.createElement('div');
    stack.className = 'ffx2hud__command';
    rectOf(stack, r(1245, 350, 1570, 610));
    root.appendChild(stack);
    flower(root, 884.5, 386.5, 501, 0.3);
    expect(boardRects(root, { scale: 2.5, chipReach: 19 })).toEqual([r(1245, 350, 1570, 610), r(634, 136, 1135, 637, true)]);
  });
});

describe('the slab clears the reticle at the Chapter XIII target step, 1600x900 (FFX-2 only)', () => {
  // Measured on the dev build at the target step (docs/concepts/chapters/trema/ship/polish/).
  const LAYER = { width: 1600, height: 900 };
  const SIZE = { w: 375, h: 102 };
  const SCALE = 2.5;
  const CHIP = { w: 76, h: 19, gap: SCALE };
  const CHROME: SlabRect[] = [
    r(52, 55, 636, 150), // boss plate
    r(52, 190, 383, 430), // guide rail
    r(690, 48, 913, 124), // TARGET plate (padded, reaching down by the chip)
    r(1328, 48, 1583, 124), // actor plate (padded)
    r(1245, 350, 1570, 610), // command stack
    r(1140, 650, 1560, 875), // party plates
    r(655, 655, 1112, 830), // move advisor
    r(665, 860, 935, 892), // ENTER CONFIRM hint
  ];
  const FIGHTERS: SlabRect[] = [r(700, 200, 1080, 560, true), r(350, 450, 700, 800, true)];
  const root = document.createElement('div');
  flower(root, 884.5, 386.5, 501, 0.2);
  const RETICLE = reticleBoxes(root);
  const NATURAL = { left: 884.5 - SIZE.w / 2, top: 122 };
  const HEADROOM = CHIP.h + SCALE;

  const place = (board: SlabRect[]) => {
    const p = placeSlab(NATURAL, SIZE, board, LAYER, 4 * SCALE, HEADROOM, { tiered: true, chip: CHIP });
    const box = r(p.left, p.top, p.left + SIZE.w, p.top + SIZE.h);
    const cap = r(box.right - CHIP.w, box.top - CHIP.gap - CHIP.h, box.right, box.top - CHIP.gap);
    const on = (list: SlabRect[]) => list.reduce((s, o) => s + overlap(box, o) + overlap(cap, o), 0);
    return { reticle: on(RETICLE), chrome: on(CHROME) };
  };

  it('before: without the reticle on the board the slab stays inside it', () => {
    expect(place([...CHROME, ...FIGHTERS]).reticle).toBeGreaterThan(0);
  });

  it('after: off the reticle, and still off every piece of chrome', () => {
    const now = place([...CHROME, ...FIGHTERS, ...RETICLE]);
    expect(now.reticle).toBe(0);
    expect(now.chrome).toBe(0);
  });
});
