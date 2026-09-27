/**
 * PR-0206 (FFX only; the 2000x1012 case for `ui-ffx-hud-safe-zones.test.ts`, kept in its own file
 * because that one is 1,071 lines). Round 13 found no advisor card at Chapter I's first decision at
 * 2000x1012 while the chip still read "N HIDE MOVES". Replayed on iter2-b5 with the round-13 board
 * route and the PR-0202 pinned seed (`route.mjs seymour-flux lose --size=2000x1012 --seed=1`): the card
 * is up (320x275 px, no row or face under it) and N hides it. The case did not fail first: the
 * decline no longer reproduces. This pins the solver on the live 2000x1012 board, measured through
 * the HUD's own `stageRect` / `partySpriteRects` / `enemySpriteRects` (grid px, scale 2.811).
 */
import { describe, expect, it } from 'vitest';
import { advisorZone, SKEW, type AdvisorZoneInput, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const out = (r: Rect, q: number): Rect => ({
  left: Math.floor(r.left / q) * q,
  top: Math.floor(r.top / q) * q,
  right: Math.ceil(r.right / q) * q,
  bottom: Math.ceil(r.bottom / q) * q,
});

/** Chapter I, first menu (Tidus), 2000x1012, seed 1: the solver's input as the HUD builds it. */
const BOARD: AdvisorZoneInput = {
  cmdArea: out(R(30.2, 177.8, 217.8, 334.2), 1),
  cmdInfo: R(24, 121, 196, 154),
  partyStatus: out(R(402.7, 258.3, 616.9, 348), 1),
  guide: out(R(21.3, 44, 153.3, 100), 1),
  sensor: out(R(426.6, 166, 545.3, 254), 1),
  intent: null,
  intentChip: out(R(566.8, 38.8, 618.9, 46.3), 4),
  ctb: out(R(547.6, 49.8, 620.4, 200.4), 1),
  sprites: [R(147.5, 171.6, 272.2, 315), R(275.4, 165.5, 392.3, 299.9), R(227.6, 149.2, 323.4, 259.3)].map((r) => out(r, 4)),
  enemies: [R(373.5, 33.5, 512.1, 192.9), R(283, 68.2, 413, 172.9)].map((r) => out(r, 4)),
};

/** The painted party (the faces are the top 30 percent of each). */
const PARTY: Record<string, Rect> = {
  tidus: R(171.9, 179.4, 268, 316.6),
  yuna: R(286.3, 171.5, 383.3, 298.9),
  kimahri: R(242.5, 155.5, 309.8, 258.5),
};

const overlap = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

describe('PR-0206: Chapter I at 2000x1012, the first decision', () => {
  it('finds a zone: the card is shown, not declined', () => {
    expect(advisorZone(BOARD)).not.toBeNull();
  });

  it('the card, at every height the zone allows, is on no party face and no panel', () => {
    const z = advisorZone(BOARD)!;
    for (let h = 8; h <= z.maxHeight; h += 4) {
      const reach = (SKEW * h) / 2;
      const card = R(z.left - reach, 360 - z.bottom - h, z.left + z.width + reach, 360 - z.bottom);
      for (const [id, q] of Object.entries(PARTY)) {
        const face = R(q.left, q.top, q.right, q.top + (q.bottom - q.top) * 0.3);
        expect({ id, h, over: Math.round(overlap(card, face)) }).toMatchObject({ over: 0 });
      }
      for (const [name, p] of Object.entries({ cmd: BOARD.cmdArea, status: BOARD.partyStatus, guide: BOARD.guide!, ctb: BOARD.ctb! })) {
        expect({ name, h, over: Math.round(overlap(card, p)) }).toMatchObject({ over: 0 });
      }
    }
  });
});
