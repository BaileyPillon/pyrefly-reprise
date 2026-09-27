// iter2 B6: the upright phone's enemy-move line steps off the Vegnagun leg's lens
// (Chapter V, link 2), keeping the picked staging. Game case: the mechanism is both;
// the only guarded feature is FFX-2's.
import { describe, expect, it } from 'vitest';
import { GUARD_PAD, LINE_GUTTER, MIN_LINE_WIDTH, PHONE_GUARDS, guardBoxes, lineSlot, withGuards } from '../../src/ui/common/phoneBattleGuard.ts';
import type { PhoneField } from '../../src/ui/common/phoneFraming.ts';
import type { BattleState } from '../../src/battle/common/types.ts';

// The leg's tight box at 390x844, link 2, as the live probe read it (seed 1).
const LEG = { x: 68.9, y: -4.8, w: 243.1, h: 357.1 };
// The line as it stood: full width under three Node bars.
const LINE = { x: 10, y: 145, w: 370, h: 50 };

describe('phone line guard (Vegnagun leg lens)', () => {
  it('projects the lens onto the leg box, padded', () => {
    const [box] = guardBoxes(['vegnagun-leg'], (id) => (id === 'vegnagun-leg' ? LEG : null));
    expect(box).toBeDefined();
    // The lens sits left of the leg's middle, just under the line's bottom edge.
    expect(box!.x).toBeGreaterThan(LEG.x + 0.2 * LEG.w - GUARD_PAD - 1);
    expect(box!.x + box!.w).toBeLessThan(LEG.x + 0.45 * LEG.w);
    expect(box!.y).toBeLessThan(LINE.y + LINE.h);
    expect(box!.y + box!.h).toBeGreaterThan(LINE.y + LINE.h);
  });

  it('the default line covers the lens, and the slot moves it to the right of it', () => {
    const guards = guardBoxes(['vegnagun-leg'], () => LEG);
    const slot = lineSlot(LINE, guards, 390);
    expect(slot).not.toBeNull();
    const g = guards[0]!;
    expect(slot!.left).toBeGreaterThanOrEqual(g.x + g.w);
    expect(slot!.maxWidth).toBeGreaterThanOrEqual(MIN_LINE_WIDTH);
    expect(slot!.left + slot!.maxWidth).toBeLessThanOrEqual(390 - LINE_GUTTER);
  });

  it('leaves the line alone when nothing guarded is under it', () => {
    expect(lineSlot(LINE, guardBoxes(['node-a', 'tidus'], () => LEG), 390)).toBeNull();
    const far = { ...LEG, y: 400 };
    expect(lineSlot(LINE, guardBoxes(['vegnagun-leg'], () => far), 390)).toBeNull();
  });

  it('keeps its place rather than being crushed when neither side has room', () => {
    const wide = [{ x: 60, y: 150, w: 280, h: 30 }];
    expect(lineSlot(LINE, wide, 390)).toBeNull();
  });

  it('moves left of a feature on the right', () => {
    const slot = lineSlot(LINE, [{ x: 300, y: 150, w: 40, h: 30 }], 390);
    expect(slot).toEqual({ left: LINE_GUTTER, maxWidth: 290 });
  });

  it('stays moved through a little camera sway (hysteresis)', () => {
    const g = { x: 130, y: 196, w: 40, h: 30 }; // 1 px under the line: clear at rest
    expect(lineSlot(LINE, [g], 390, false)).toBeNull();
    expect(lineSlot(LINE, [g], 390, true)).not.toBeNull();
  });

  it('only FFX-2 Chapter V has a guarded feature today', () => {
    expect(Object.keys(PHONE_GUARDS)).toEqual(['vegnagun-leg']);
  });

  it('the wrapped field lists the live figures only and still forwards to the field', () => {
    const calls: string[] = [];
    const field: PhoneField = {
      setRects: () => calls.push('rects'),
      setState: () => calls.push('state'),
      setActor: () => undefined,
      frame: () => undefined,
      reset: () => undefined,
    };
    const guarded = withGuards(field);
    expect(guarded.guards!()).toEqual([]);
    guarded.setRects(() => LEG);
    const state = { enemyIds: ['vegnagun-leg'], combatants: { 'vegnagun-leg': { hp: 100 } } } as unknown as BattleState;
    guarded.setState(state);
    expect(calls).toEqual(['rects', 'state']);
    expect(guarded.guards!()).toHaveLength(1);
    guarded.setState({ enemyIds: ['vegnagun-leg'], combatants: { 'vegnagun-leg': { hp: 0 } } } as unknown as BattleState);
    expect(guarded.guards!()).toEqual([]);
  });
});
