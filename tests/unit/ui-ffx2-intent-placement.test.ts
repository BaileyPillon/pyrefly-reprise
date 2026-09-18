import { describe, expect, it } from 'vitest';
import { placeSlab, steerRects, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';

/**
 * The enemy-intent slab's placement, and the round trip through
 * `EnemyIntentPanel.layout`'s greedy dodge.
 *
 * {@link greedy} below is that dodge, copied verbatim from
 * `src/ui/common/EnemyIntent.ts` so the steering can be proved rather than
 * eyeballed: feed it the rectangles `steerRects` produces and it must land on
 * the placement `placeSlab` chose. If that file's algorithm changes, this test
 * fails, which is the signal to delete `intentPlacement.ts` and use whatever
 * replaced it (see `docs/handoff/fix3-ffx2-hud-prep.md`).
 */

const EDGE = 8; // EDGE_MARGIN 4 * the 1280x720 letterbox scale of 2.

/** `EnemyIntent.layout`'s step 3, verbatim. */
function greedy(
  natural: { left: number; top: number },
  size: { w: number; h: number },
  avoid: readonly SlabRect[],
  layer: { width: number; height: number },
  edge: number,
): { left: number; top: number } {
  const { w, h } = size;
  const clampX = (v: number, width = w): number =>
    Math.max(edge, Math.min(Math.max(edge, layer.width - width - edge), v));
  const clampY = (v: number, height = h): number =>
    Math.max(edge, Math.min(Math.max(edge, layer.height - height - edge), v));
  let left = clampX(natural.left);
  let top = clampY(natural.top);
  for (const a of avoid) {
    const hit = left < a.right && left + w > a.left && top < a.bottom && top + h > a.top;
    if (!hit) continue;
    const roomLeft = a.left - 4;
    const roomRight = layer.width - a.right - 4;
    if (roomLeft >= w && roomLeft >= roomRight) left = clampX(a.left - w - 4);
    else if (roomRight >= w) left = clampX(a.right + 4);
    else top = clampY(a.bottom + 4);
  }
  return { left, top };
}

function hits(box: SlabRect, o: SlabRect): boolean {
  return box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top;
}

/**
 * The real Chapter 4 board, measured off the live 1280x720 run
 * (`docs/screenshots/fix3/ffx2-hud-prep/report-battle4-c.json`). The overlay is
 * the whole viewport, so layer coordinates are viewport coordinates.
 */
const LAYER = { width: 1280, height: 720 };
const SIZE = { w: 300, h: 196 };
const BOARD: SlabRect[] = [
  { left: 42.7, top: 35.5, right: 516.6, bottom: 97.5 }, // boss gauge strip
  { left: 928, top: 520, right: 1266, bottom: 700 }, // party column
  { left: 953.8, top: 281, right: 1256, bottom: 487.1 }, // command stack
  { left: 509.6, top: 551.6, right: 928.4, bottom: 668 }, // advisor card
  { left: 520.4, top: 533, right: 625.3, bottom: 548 }, // advisor chip
  { left: 42.7, top: 130, right: 306.7, bottom: 382 }, // strategy rail
  { left: 41.1, top: 108, right: 141.9, bottom: 123 }, // strategy chip
  { left: 222, top: 391.9, right: 367, bottom: 650.8 }, // Yuna
  { left: 383.1, top: 362, right: 507.6, bottom: 584.3 }, // Rikku
  { left: 464.4, top: 336.5, right: 571.1, bottom: 527 }, // Paine
  { left: 622.3, top: 116.3, right: 799.1, bottom: 432 }, // Bahamut
];
/** Bahamut's head, minus HEAD_GAP * scale, minus the slab. */
const NATURAL = { left: 710.7 - SIZE.w / 2, top: 116.3 - 10 * 2 - SIZE.h };

describe('placeSlab', () => {
  it('leaves the slab alone when its natural spot is already free', () => {
    const out = placeSlab({ left: 400, top: 40 }, SIZE, [{ left: 0, top: 600, right: 200, bottom: 700 }], LAYER, EDGE);
    expect(out.free).toBe(true);
    expect(out.left).toBeCloseTo(400, 3);
    expect(out.top).toBeCloseTo(40, 3);
  });

  it('finds a free spot on the real Chapter 4 board', () => {
    const out = placeSlab(NATURAL, SIZE, BOARD, LAYER, EDGE);
    expect(out.free).toBe(true);
    const box = { left: out.left, top: out.top, right: out.left + SIZE.w, bottom: out.top + SIZE.h };
    for (const o of BOARD) expect([o, hits(box, o)]).toEqual([o, false]);
  });

  it('keeps that spot on the boss’s own eye line rather than dropping to the floor', () => {
    // The shipped greedy pass put the slab at top 516 — the bottom clamp, on
    // the advisor card. The solved placement stays up with the dragon.
    const out = placeSlab(NATURAL, SIZE, BOARD, LAYER, EDGE);
    expect(out.top).toBeLessThan(300);
  });

  it('never floats the slab above where it wants to be', () => {
    const out = placeSlab({ left: 400, top: 300 }, SIZE, BOARD, LAYER, EDGE);
    expect(out.top).toBeGreaterThanOrEqual(300 - 0.5);
  });

  it('stays inside the layer', () => {
    const out = placeSlab({ left: 5000, top: 5000 }, SIZE, BOARD, LAYER, EDGE);
    expect(out.left).toBeGreaterThanOrEqual(EDGE);
    expect(out.top).toBeGreaterThanOrEqual(EDGE);
    expect(out.left + SIZE.w).toBeLessThanOrEqual(LAYER.width - EDGE + 0.001);
    expect(out.top + SIZE.h).toBeLessThanOrEqual(LAYER.height - EDGE + 0.001);
  });

  it('reports the least-covering spot when nothing is free', () => {
    const wall: SlabRect[] = [{ left: -10, top: -10, right: 1290, bottom: 730 }];
    const out = placeSlab(NATURAL, SIZE, wall, LAYER, EDGE);
    expect(out.free).toBe(false);
  });
});

describe('steerRects', () => {
  const clamped = {
    left: Math.max(EDGE, Math.min(LAYER.width - SIZE.w - EDGE, NATURAL.left)),
    top: Math.max(EDGE, Math.min(LAYER.height - SIZE.h - EDGE, NATURAL.top)),
  };

  it('emits nothing when the slab is already placed', () => {
    expect(steerRects(clamped, clamped, SIZE, LAYER)).toEqual([]);
  });

  it('round-trips the solved placement through the real greedy dodge', () => {
    const target = placeSlab(NATURAL, SIZE, BOARD, LAYER, EDGE);
    const rects = steerRects(clamped, target, SIZE, LAYER);
    const landed = greedy(clamped, SIZE, rects, LAYER, EDGE);
    expect(landed.left).toBeCloseTo(target.left, 3);
    expect(landed.top).toBeCloseTo(target.top, 3);
  });

  it('round-trips a leftward move', () => {
    const target = { left: clamped.left - 250, top: clamped.top };
    const landed = greedy(clamped, SIZE, steerRects(clamped, target, SIZE, LAYER), LAYER, EDGE);
    expect(landed.left).toBeCloseTo(target.left, 3);
    expect(landed.top).toBeCloseTo(target.top, 3);
  });

  it('round-trips a rightward move', () => {
    const target = { left: clamped.left + 200, top: clamped.top };
    const landed = greedy(clamped, SIZE, steerRects(clamped, target, SIZE, LAYER), LAYER, EDGE);
    expect(landed.left).toBeCloseTo(target.left, 3);
    expect(landed.top).toBeCloseTo(target.top, 3);
  });

  it('round-trips a move on both axes at once', () => {
    const target = { left: clamped.left + 200, top: clamped.top + 150 };
    const landed = greedy(clamped, SIZE, steerRects(clamped, target, SIZE, LAYER), LAYER, EDGE);
    expect(landed.left).toBeCloseTo(target.left, 3);
    expect(landed.top).toBeCloseTo(target.top, 3);
  });

  it('round-trips a downward-only move', () => {
    const target = { left: clamped.left, top: clamped.top + 150 };
    const landed = greedy(clamped, SIZE, steerRects(clamped, target, SIZE, LAYER), LAYER, EDGE);
    expect(landed.left).toBeCloseTo(target.left, 3);
    expect(landed.top).toBeCloseTo(target.top, 3);
  });

  it('solves and steers every Chapter 4 viewport to a clear placement', () => {
    for (const scale of [2, 2.5, 3.125, 4]) {
      const layer = { width: 640 * scale, height: 360 * scale };
      const size = { w: 150 * scale, h: 98 * scale };
      const edge = 4 * scale;
      const board = BOARD.map((o) => ({
        left: (o.left / 2) * scale,
        top: (o.top / 2) * scale,
        right: (o.right / 2) * scale,
        bottom: (o.bottom / 2) * scale,
      }));
      const natural = { left: (NATURAL.left / 2) * scale, top: (NATURAL.top / 2) * scale };
      const start = {
        left: Math.max(edge, Math.min(layer.width - size.w - edge, natural.left)),
        top: Math.max(edge, Math.min(layer.height - size.h - edge, natural.top)),
      };
      const target = placeSlab(natural, size, board, layer, edge);
      expect([scale, target.free]).toEqual([scale, true]);
      const landed = greedy(start, size, steerRects(start, target, size, layer), layer, edge);
      const box = { left: landed.left, top: landed.top, right: landed.left + size.w, bottom: landed.top + size.h };
      for (const o of board) expect([scale, o, hits(box, o)]).toEqual([scale, o, false]);
    }
  });
});
