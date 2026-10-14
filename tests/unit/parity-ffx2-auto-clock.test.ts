/**
 * The automatic-status layer where the engine's CLOCK and chain seams reach it (re-parity X2-D; **FFX-2 only**): a Poison or Regen payout is a result
 * the engine builds itself and reaches the SOS check (note FFX2-G04 3.3, with `research/re-ffx2-ai-fallen-trema.md` 1.2); a timed status that runs
 * out while the layer holds the same status stays; a chained link carries a girl's statuses and the layer is made again for her HP.
 *
 * Driven on a real engine (`helpers/ffx2AutoRig.ts`), one logic step at a time (`Probe.steps`), against the note's rules written out in the test.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): the SOS check dropped after a payout; the expiry of an applied status
 * not handing the status over to the layer; a stale layer-owned status kept across a link seam; Haste's expiry not putting the layer's Slow back.
 */

import { describe, expect, it } from 'vitest';
import type { Command, StatusId } from '../../src/battle/common/types.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { BIG, LAYER_STATUSES, LOADOUTS, PLAIN_BLOW, THIRD, board, instanceOf, type Loadout } from './helpers/ffx2AutoRig.ts';
const holds = (u: Ffx2Unit): StatusId[] => LAYER_STATUSES.filter((s) => u.statuses[s] !== undefined).sort();
const ev = (e: unknown): { type: string; targetId?: string; status?: string; reason?: string; instance?: { sourceAbilityId?: string } } => e as never;

describe('a Regen or Poison payout reaches the SOS check', () => {
  it('SOS Regen turns itself off when its own healing takes her back over a third (and says so)', () => {
    const e = board({ yuna: { ...(LOADOUTS['regenHaste'] as Loadout) } }, 4);
    const yuna = e.unit('yuna');
    yuna.stats.maxHp = BIG;
    yuna.hp = THIRD + 10;
    // the SOS set comes on with one result: the plain blow takes her under a third
    e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(yuna.hp * 3).toBeLessThan(BIG);
    expect(holds(yuna)).toEqual(['haste', 'regen']);
    const before = yuna.hp;
    const events = e.steps(900).map(ev); // 30 seconds of logic steps: the Regen pays 8 x max HP >> 8 = 3,124 every 16,000 units
    expect(yuna.hp).toBeGreaterThan(before);
    expect(yuna.hp * 3).toBeGreaterThanOrEqual(BIG); // over a third: state 0
    expect(holds(yuna)).toEqual([]); // the layer let go of both
    expect(events.filter((x) => x.type === 'status-remove' && x.targetId === 'yuna' && (x.status === 'regen' || x.status === 'haste'))).toHaveLength(2);
  });

  it('a permanent Poison takes her under a third, and her SOS set comes on in that step', () => {
    const l: Loadout = { name: 'Bloodlust and Wall Ring', accessories: ['bloodlust', 'wall-ring'], kept: ['poison', 'berserk'], sos: ['shell', 'protect'], word0: 0 };
    const e = board({ yuna: l }, 5);
    const yuna = e.unit('yuna');
    yuna.stats.maxHp = BIG;
    yuna.hp = THIRD + 50; // Poison pays 3,124: one payout crosses the line
    const events = e.steps(600).map(ev);
    expect(yuna.hp * 3).toBeLessThan(BIG);
    expect(holds(yuna)).toEqual(['berserk', 'poison', 'protect', 'shell']);
    expect(events.filter((x) => x.type === 'status-add' && x.targetId === 'yuna' && x.instance?.sourceAbilityId === 'auto-layer').map((x) => x.status).sort()).toEqual(['protect', 'shell']);
  });
});

describe('a timed status the layer also holds', () => {
  it('stays when its clock runs out: it is the layer\'s from then on, and goes only when the layer lets go', () => {
    const e = board({ yuna: { ...(LOADOUTS['regenHaste'] as Loadout) } }, 6);
    const yuna = e.unit('yuna');
    yuna.stats.maxHp = BIG;
    yuna.hp = THIRD - 100;
    // Haste cast on her with one count left (a count is 1,500 units of her speed: about 16 steps)
    yuna.statuses.haste = { ...instanceOf('haste'), ticksRemaining: 1500, counter: 1, accumulator: 0 };
    yuna.hp = THIRD + 10;
    e.act(e.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command); // the SOS set comes on (Haste is hers already, Regen is the layer's)
    expect(holds(yuna)).toEqual(['haste', 'regen']);
    const events = e.steps(60).map(ev); // the cast Haste runs out
    expect(yuna.hp * 3).toBeLessThan(BIG);
    expect(holds(yuna)).toEqual(['haste', 'regen']);
    expect(yuna.statuses.haste?.counter).toBeUndefined();
    expect(yuna.statuses.haste?.ticksRemaining).toBeNull();
    expect(events.filter((x) => x.type === 'status-remove' && x.status === 'haste')).toEqual([]);
  });

  it('Haste running out lets the layer\'s Slow show again (the status recompute clears Slow only while Haste is in effect)', () => {
    const l = { ...(LOADOUTS['slowAndSpeed'] as Loadout), name: 'Shmooth Shailing', accessories: ['shmooth-shailing'], kept: ['slow' as StatusId] };
    const e = board({ yuna: l }, 7);
    const yuna = e.unit('yuna');
    expect(holds(yuna)).toEqual(['slow']);
    applyStatus(yuna, { status: 'haste', chance: 255, duration: 1 }); // a Haste cast on her (one count): the engine's own exclusivity takes Slow off
    expect(holds(yuna)).toEqual(['haste']);
    const events = e.steps(60).map(ev); // the Haste runs out
    expect(holds(yuna)).toEqual(['slow']); // and the layer's Slow shows again
    expect(events.filter((x) => x.targetId === 'yuna' && (x.type === 'status-add' || x.type === 'status-remove')).map((x) => `${x.type}:${x.status}`)).toEqual(['status-remove:haste', 'status-add:slow']);
  });
});

describe('a chained link', () => {
  it('opens with the layer made for her HP: a status she needed in the last link and does not now is gone, one she still needs stays', () => {
    const l = LOADOUTS['wallAndMoon'] as Loadout; // kept Shell; SOS Shell and Protect
    const last = board({ yuna: l }, 1);
    const yunaThen = last.unit('yuna');
    yunaThen.stats.maxHp = BIG;
    yunaThen.hp = THIRD + 10;
    last.act(last.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command); // a result on her: the check runs
    expect(holds(yunaThen)).toEqual(['protect', 'shell']);
    // the next link opens with her statuses as they were and her HP healed by a Save Sphere
    const carry = {
      chained: true as const,
      members: [{ id: 'yuna', hp: BIG, mp: yunaThen.mp, statuses: structuredClone(yunaThen.statuses), accessories: [...yunaThen.accessories], dresspheres: structuredClone(yunaThen.dresspheres!) }],
    };
    const next = board({ yuna: l }, 2, { carriedParty: carry });
    const yuna = next.unit('yuna');
    expect(yuna.hp).toBeGreaterThan(0);
    expect(holds(yuna)).toEqual(['shell']);
    expect(yuna.statuses.protect).toBeUndefined();
    expect(yuna.autoStatuses).toEqual(['shell']);
  });

  it('a girl who now holds no auto-ability row sheds the statuses the layer put on in the last link', () => {
    const l = LOADOUTS['warriorSos'] as Loadout;
    const last = board({ yuna: l }, 1);
    const yunaThen = last.unit('yuna');
    yunaThen.stats.maxHp = BIG;
    yunaThen.hp = THIRD + 10;
    last.act(last.unit('paragon'), { kind: 'ability', id: PLAIN_BLOW.id, targets: ['yuna'] } as Command);
    expect(holds(yunaThen)).toEqual(['protect']);
    const carry = {
      chained: true as const,
      members: [{ id: 'yuna', hp: THIRD - 100, mp: yunaThen.mp, statuses: structuredClone(yunaThen.statuses), accessories: [], dresspheres: { ...structuredClone(yunaThen.dresspheres!), current: 'gunner' } }],
    };
    const next = board({ yuna: { ...l, dressphere: 'gunner' } }, 2, { carriedParty: carry });
    expect(holds(next.unit('yuna'))).toEqual([]);
  });
});
