import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { RunInMotion } from '../../src/app/screens/BattleScreenRunIn.ts';

/**
 * r391-reach, FFX-2: the strike's lunge reaches for its target for the fiends (no run: the lunge is their whole approach) and for a girl who has RUN IN (the stop is staged, not
 * sourced: the lunge from there closes what it leaves). A long-range dressphere fires from where she stands (sourced) and a girl with no run (a menu open) does not run: neither closes the
 * distance.
 */
const state = (sides: Record<string, string>): BattleState => ({ combatants: Object.fromEntries(Object.entries(sides).map(([id, side]) => [id, { id, side }])) }) as unknown as BattleState;

describe('RunInMotion.reachFor', () => {
  it('is true for a fiend, false for a girl who has not run in (whatever her dressphere) and for a combatant it does not know', () => {
    const m = new RunInMotion(() => state({ yuna: 'party', paine: 'party', bahamut: 'enemy', 'ormi-entrance': 'enemy' }));
    expect(m.reachFor('bahamut')).toBe(true);
    expect(m.reachFor('ormi-entrance')).toBe(true);
    expect(m.reachFor('yuna')).toBe(false);
    expect(m.reachFor('paine')).toBe(false);
    expect(m.reachFor('nobody')).toBe(false);
  });

  it('is true for a girl while she is out on her run (the strike that follows it closes what her stop leaves), and false again once she is home', () => {
    const m = new RunInMotion(() => state({ yuna: 'party', paine: 'party' }));
    (m as unknown as { runs: Map<string, unknown> }).runs.set('yuna', { home: { x: 0, y: 0, z: 0 }, figure: {} });
    expect(m.reachFor('yuna')).toBe(true);
    expect(m.lungeFor('yuna')).toBe(0.6);
    expect(m.reachFor('paine')).toBe(false);
    (m as unknown as { runs: Map<string, unknown> }).runs.delete('yuna');
    expect(m.reachFor('yuna')).toBe(false);
  });

  it('is false with no battle behind it (the port is built before the fight is)', () => {
    expect(new RunInMotion().reachFor('bahamut')).toBe(false);
    expect(new RunInMotion(() => null).reachFor('bahamut')).toBe(false);
  });

  it('leaves a girl\'s own lunge alone: no run registered, so `lungeFor` answers nothing and the house 1.4 stands (her lunge does not reach)', () => {
    const m = new RunInMotion(() => state({ yuna: 'party' }));
    expect(m.lungeFor('yuna')).toBeUndefined();
    expect(m.reachFor('yuna')).toBe(false);
  });
});
