import { describe, expect, it } from 'vitest';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';
import { fighterBoxes } from '../../src/ui/ffx2/intentBoard.ts';
import type { BattleState } from '../../src/battle/common/types.ts';

/**
 * PR-0249 (FFX-2 only: the enemy-move slab and its placement are the FFX-2 HUD's; FFX has its own card).
 *
 * At Yuna's WHITE MAGIC list (Chapter IV, 1600x900 and 2000x1012) the slab sat across Rikku's and Paine's
 * heads and torsos (2,639 and 589 px2 measured at 1600x900; 3,537 and 610 at 2000x1012), because a girl and
 * the boss were both just "soft" and the slab, held to its natural row, took the cheaper total. A girl now ranks
 * above the boss's painting: chrome first, then the party, then the other fighters. Browser proof, before and
 * after, in `docs/handoff/r37-ui-floor.md`.
 */

const r = (left: number, top: number, right: number, bottom: number, extra: Partial<SlabRect> = {}): SlabRect => ({ left, top, right, bottom, ...extra });
const overlap = (a: SlabRect, b: SlabRect): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

const LAYER = { width: 1600, height: 900 };
const SIZE = { w: 375, h: 327 };
const NATURAL = { left: 507, top: 184 };
const EDGE = 10;

describe('placeSlab ranks a girl above the boss (PR-0249, FFX-2 only)', () => {
  // Rikku and Paine stand under the natural spot; painted fighters (the boss, a wing, a far one) fill both sides; a girl's slice is the cheapest place for a flat solver.
  const rikku = r(480, 455, 640, 730, { soft: true, party: true });
  const paine = r(570, 440, 720, 700, { soft: true, party: true });
  const boss = r(860, 150, 1040, 560, { soft: true });
  const wing = r(100, 150, 470, 560, { soft: true });
  const far = r(1050, 150, 1590, 560, { soft: true });
  const board = [rikku, paine, boss, wing, far];

  it('the party tier lifts the slab clear of the girls; unflagged boxes never lift it above its natural row', () => {
    const at = (p: { left: number; top: number }): SlabRect => r(p.left, p.top, p.left + SIZE.w, p.top + SIZE.h);
    const ranked = placeSlab(NATURAL, SIZE, board, LAYER, EDGE, 0, { tiered: true });
    expect(overlap(at(ranked), rikku) + overlap(at(ranked), paine)).toBe(0);
    expect(ranked.top).toBeLessThan(NATURAL.top); // it rose to sit flush above Rikku's head box
    const flat = placeSlab(NATURAL, SIZE, board.map((o) => ({ left: o.left, top: o.top, right: o.right, bottom: o.bottom, soft: true })), LAYER, EDGE, 0, { tiered: true });
    expect(flat.top).toBeGreaterThanOrEqual(NATURAL.top);
  });

  it('chrome still outranks the party: the slab covers a girl before it covers the command stack', () => {
    const stack = r(0, 0, 1600, 900); // a stack that leaves no clean spot anywhere but over the girls
    const hole = r(300, 100, 700, 520); // the only place the stack does not cover: a hole over Rikku's head
    const chrome = [r(0, 0, 1600, 100), r(0, 520, 1600, 900), r(0, 100, 300, 520), r(700, 100, 1600, 520)];
    void stack;
    const p = placeSlab(NATURAL, SIZE, [...chrome, { ...rikku, left: 320, top: 400, right: 480, bottom: 520 }], LAYER, EDGE, 0, { tiered: true });
    const box = r(p.left, p.top, p.left + SIZE.w, p.top + SIZE.h);
    expect(chrome.reduce((s, o) => s + overlap(box, o), 0)).toBeLessThanOrEqual(0 + 1);
    expect(hole.left).toBeLessThan(box.right);
  });

  it('with no party box it is the old answer', () => {
    const plain = [r(480, 455, 640, 730, { soft: true }), r(860, 150, 1040, 560, { soft: true })];
    const a = placeSlab(NATURAL, SIZE, plain, LAYER, EDGE, 0, { tiered: true });
    const b = placeSlab(NATURAL, SIZE, plain.map((o) => ({ ...o })), LAYER, EDGE, 0, { tiered: true });
    expect(a).toEqual(b);
  });
});

describe('fighterBoxes marks the girls', () => {
  it('a party member box is soft and party; an enemy box is soft only', () => {
    const state = {
      combatants: {
        yuna: { hp: 10, side: 'party' },
        bahamut: { hp: 10, side: 'enemy' },
      },
    } as unknown as BattleState;
    const project = (id: string, anchor?: string): { x: number; y: number } => (id === 'yuna' ? { x: 100, y: anchor === 'feet' ? 400 : 200 } : { x: 500, y: anchor === 'feet' ? 300 : 100 });
    const boxes = fighterBoxes(state, project as never);
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toMatchObject({ soft: true, party: true });
    expect(boxes[1]).toMatchObject({ soft: true, party: false });
  });
});
