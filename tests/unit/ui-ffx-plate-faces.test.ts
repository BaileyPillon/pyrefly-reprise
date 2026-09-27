/**
 * PR-0183 (FFX only): the target name plate docks on the target and off the
 * party's faces. Round 13 saw "Yu Pagoda A" printed between Auron's and
 * Yuna's heads, far from the Pagoda: the plate hangs under its figure by
 * default and the party stands right under the Pagodas. The faces now count
 * as obstacles for the plate's dock, so it takes the Pagoda's clear side.
 *
 * Geometry: the measured Chapter III Attack frame at 1600x900, viewport px
 * (`__pyrefly.targeting().rects`, probe of 2026-09-26).
 */
import { describe, expect, it } from 'vitest';
import { dockPlate, overlapArea, plateBox } from '../../src/ui/ffx/targetCursorParts.ts';
import { FACE_SHARE, partyFaceRects } from '../../src/ui/ffx/plateFaces.ts';

const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  tidus: { x: 415, y: 524, w: 229, h: 333 },
  yuna: { x: 698, y: 515, w: 251, h: 332 },
  auron: { x: 582, y: 474, w: 171, h: 253 },
};
const PAGODA_A = { x: 671, y: 279, w: 150, h: 234 };
const BFA = { x: 796, y: 215, w: 382, h: 357 };
const PLATE_H = 34;

describe('partyFaceRects', () => {
  it('is the top share of each fighter on the field, skipping the ones with no box', () => {
    const faces = partyFaceRects(['tidus', 'yuna', 'auron', 'kimahri'], (id) => RECTS[id] ?? null);
    expect(faces).toHaveLength(3);
    expect(faces[1]).toEqual({ x: 698, y: 515, w: 251, h: 332 * FACE_SHARE });
  });
});

describe('the plate docks off the party faces (PR-0183)', () => {
  const faces = partyFaceRects(['tidus', 'yuna', 'auron'], (id) => RECTS[id] ?? null);
  for (const [name, target, w] of [
    ['Yu Pagoda A', PAGODA_A, 141],
    ["Braska's Final Aeon", BFA, 178],
  ] as const) {
    it(`${name}: no face under the plate, and the plate touches its figure`, () => {
      const d = dockPlate(target, w, PLATE_H, faces);
      const box = plateBox(d.side, d.x, d.y, w, PLATE_H);
      for (const f of faces) expect(overlapArea(box, f)).toBe(0);
      // Docked to the figure's own edge (the dock's 6 px gap).
      const gapY = Math.max(0, target.y - (box.y + box.h), box.y - (target.y + target.h));
      const gapX = Math.max(0, target.x - (box.x + box.w), box.x - (target.x + target.w));
      expect(gapY).toBeLessThanOrEqual(6.5);
      expect(gapX).toBeLessThanOrEqual(6.5);
    });
  }
});
