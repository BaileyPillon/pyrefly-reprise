import { describe, expect, it } from 'vitest';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';

/**
 * The FFX-2 enemy-move slab ranks the HUD chrome above the fighters, and places
 * its `E HIDE` chip with it (M2 of the Chapter XIII ship check, 2026-09-25).
 *
 * Before: every square pixel counted the same, so at 1600x900 Trema's slab
 * (375x321: he has more moves than any other FFX-2 boss) could not clear both
 * his own robe and the command stack, took the smaller overlap, and printed
 * across ATTACK. And a slab parked just under the boss plate wore its chip
 * across the plate (Chapter XI at 1280x720, 663 px²).
 *
 * **Game case: FFX-2 only** (the FFX-2 HUD's placement; the FFX HUD has its own).
 */

const r = (left: number, top: number, right: number, bottom: number, soft = false): SlabRect => ({ left, top, right, bottom, ...(soft ? { soft } : {}) });
const overlap = (a: SlabRect, b: SlabRect): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/** Chapter XIII, Trema alone, first menu at 1600x900: the chrome measured in the browser, the fighters from the frame. */
const LAYER = { width: 1600, height: 900 };
const SIZE = { w: 375, h: 321 };
const SCALE = 2.5;
const CHROME: SlabRect[] = [
  r(1246, 351, 1570, 609), // command stack
  r(1160, 650, 1575, 875), // party plates
  r(53, 103, 615, 180), // boss plate
  r(53, 220, 383, 404), // guide rail
  r(51, 193, 198, 219), // guide chip
  r(731, 613, 1139, 835), // coach card
  r(752, 584, 895, 608), // coach chip
];
const FIGHTERS: SlabRect[] = [
  r(823, 325, 937, 530, true), // Trema
  r(332, 485, 508, 800, true), // Yuna
  r(493, 455, 647, 730, true), // Rikku
  r(577, 440, 723, 700, true), // Paine
];
const BOARD = [...CHROME, ...FIGHTERS];
const NATURAL = { left: 880 - SIZE.w / 2, top: 325 - 10 * SCALE - SIZE.h };
const EDGE = 4 * SCALE;
const HEADROOM = 19 + SCALE;

function chromeCover(p: { left: number; top: number }): number {
  const box = r(p.left, p.top, p.left + SIZE.w, p.top + SIZE.h);
  return CHROME.reduce((s, o) => s + overlap(box, o), 0);
}

describe('placeSlab, tiered (FFX-2 only)', () => {
  it('Trema at 1600x900: the untiered rule covers chrome; the tiered one covers none', () => {
    const old = placeSlab(NATURAL, SIZE, BOARD, LAYER, EDGE, HEADROOM);
    expect(chromeCover(old)).toBeGreaterThan(0);
    const now = placeSlab(NATURAL, SIZE, BOARD, LAYER, EDGE, HEADROOM, { tiered: true });
    expect(chromeCover(now)).toBe(0);
  });

  it('with the whole board free it is the untiered answer (tiering only breaks ties it used to lose)', () => {
    const board = [r(0, 800, 200, 890), r(1400, 0, 1590, 100, true)];
    const a = placeSlab({ left: 600, top: 200 }, SIZE, board, LAYER, EDGE, HEADROOM);
    const b = placeSlab({ left: 600, top: 200 }, SIZE, board, LAYER, EDGE, HEADROOM, { tiered: true });
    expect(b).toEqual(a);
  });

  it('a fighter is covered before any chrome', () => {
    // A slab-sized hole in the chrome, with a fighter in it, and nothing else free.
    const board = [r(0, 0, 600, 900), r(1000, 0, 1600, 900), r(600, 400, 1000, 900), r(700, 100, 800, 300, true)];
    const out = placeSlab({ left: 620, top: 20 }, SIZE, board, LAYER, EDGE, 0, { tiered: true });
    expect(out.free).toBe(false);
    const box = r(out.left, out.top, out.left + SIZE.w, out.top + SIZE.h);
    expect(board.slice(0, 3).reduce((s, o) => s + overlap(box, o), 0)).toBe(0);
  });
});

describe('placeSlab, the chip rides with the slab (FFX-2 only)', () => {
  // Chapter XI at 1280x720: the boss plate, and a slab that wants to sit right under it.
  const layer = { width: 1280, height: 720 };
  const size = { w: 300, h: 207 };
  const plate = r(43, 82, 487, 144);
  const chip = { w: 61, h: 15, gap: 2 };

  it('without the chip it parks flush under the plate, and the chip would cross it', () => {
    const out = placeSlab({ left: 197, top: 100 }, size, [plate], layer, 8, 17);
    const cap = r(out.left + size.w - chip.w, out.top - chip.gap - chip.h, out.left + size.w, out.top - chip.gap);
    expect(overlap(cap, plate)).toBeGreaterThan(0);
  });

  it('with the chip, neither the slab nor its chip touches the plate', () => {
    const out = placeSlab({ left: 197, top: 100 }, size, [plate], layer, 8, 17, { tiered: true, chip });
    const box = r(out.left, out.top, out.left + size.w, out.top + size.h);
    const cap = r(out.left + size.w - chip.w, out.top - chip.gap - chip.h, out.left + size.w, out.top - chip.gap);
    expect(overlap(box, plate)).toBe(0);
    expect(overlap(cap, plate)).toBe(0);
    expect(out.free).toBe(true);
  });
});
