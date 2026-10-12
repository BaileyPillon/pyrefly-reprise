/**
 * Re-parity AI-FFX2-b, the engine pieces the boss scripts stand on (**FFX-2 only**): the reaction entry and the exact-target
 * scripted command. Run against the shipped records and the real resolver [hard rule 3].
 *
 * The game runs a monster's reaction entry at the end of its result applier, once for every result applied to the monster
 * (research/re-ffx2-ai-fallen-trema.md 1.2): each strike that lands, one for a command that misses or has no effect, the
 * transfer of a drain delivered to the drainer, a Scan or Libra. `ResolveContext.onResult` is that seam; `AiScript.onResult`
 * is what a script writes there. A scripted command names its targets as a mask, whatever group its row can reach:
 * `AbilityCommand.exactTargets`.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): `ctx.onResult` not called after the strike; called
 * inside the per-hit loop of a miss; the drained call dropped; the sensor call dropped; `exactTargets` ignored.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { board } from './helpers/tremaUnits.ts';

const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;

interface Call { target: string; source: string; ability: string }

function watch(b: ReturnType<typeof board>): { calls: Call[]; ctx: ReturnType<typeof b.resolveCtx> } {
  const calls: Call[] = [];
  const ctx = {
    ...b.resolveCtx(),
    onResult: (target: Ffx2Unit, source: Ffx2Unit, ability: AbilityDef) => calls.push({ target: target.id, source: source.id, ability: ability.id }),
  };
  return { calls, ctx };
}

function sturdy(b: ReturnType<typeof board>): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const g = b.unit(id);
    g.stats.maxHp = 999999;
    g.hp = 999999;
  }
}

describe('the reaction entry runs once per result applied to a unit', () => {
  it('each strike that lands is a result: a three-hit command is three', () => {
    const b = board('paragon');
    sturdy(b);
    const { calls, ctx } = watch(b);
    resolveAbility(ctx, b.unit('paragon'), ab('trema-dying-star'), ['yuna']);
    expect(calls).toEqual([0, 1, 2].map(() => ({ target: 'yuna', source: 'paragon', ability: 'trema-dying-star' })));
  });

  it('a command that misses is ONE result for the whole command, however many hits it had', () => {
    const b = board('paragon');
    sturdy(b);
    const { calls, ctx } = watch(b);
    // Beguiling Mire is three hits on accuracy formula 1 (base 95); Paragon's Luck 13 against the Rabite's Foot builds' 111 never lands.
    resolveAbility(ctx, b.unit('paragon'), ab('trema-beguiling-mire'), ['yuna']);
    expect(b.events.filter((e) => e.type === 'miss')).toHaveLength(1);
    expect(b.events.filter((e) => e.type === 'damage')).toHaveLength(0);
    expect(calls).toEqual([{ target: 'yuna', source: 'paragon', ability: 'trema-beguiling-mire' }]);
  });

  it('a drain delivers its transfer to the drainer as a result of its own, the drainer being the source', () => {
    const b = board('paragon');
    sturdy(b);
    const { calls, ctx } = watch(b);
    resolveAbility(ctx, b.unit('paragon'), ab('x2-cindy-absorb'), ['yuna']);
    expect(calls).toEqual([
      { target: 'yuna', source: 'paragon', ability: 'x2-cindy-absorb' },
      { target: 'paragon', source: 'paragon', ability: 'x2-cindy-absorb' },
    ]);
  });

  it('a Scan is a result on its target', () => {
    const b = board('paragon');
    const { calls, ctx } = watch(b);
    resolveAbility(ctx, b.unit('yuna'), ab('x2-gun-mage-scan'), ['paragon']);
    expect(calls).toEqual([{ target: 'paragon', source: 'yuna', ability: 'x2-gun-mage-scan' }]);
  });

  it('a status-only strike with nothing to land is still a result (Dispel on a girl who has nothing)', () => {
    const b = board('paragon');
    const { calls, ctx } = watch(b);
    resolveAbility(ctx, b.unit('paragon'), ab('paragon-os-dispel'), []);
    expect(calls.map((c) => c.target).sort()).toEqual(['paine', 'rikku', 'yuna']);
  });

  it('a unit fixture with no onResult runs as it always did', () => {
    const b = board('paragon');
    sturdy(b);
    expect(() => resolveAbility(b.resolveCtx(), b.unit('paragon'), ab('trema-dying-star'), ['yuna'])).not.toThrow();
  });
});

describe('a scripted command that names its targets exactly (AbilityCommand.exactTargets)', () => {
  const hpOf = (b: ReturnType<typeof board>) => ['yuna', 'rikku', 'paine'].map((id) => b.unit(id).hp);

  it('hits only the named girl, whatever group the row can reach', () => {
    const b = board('paragon');
    sturdy(b);
    const before = hpOf(b);
    resolveAbility(b.resolveCtx(), b.unit('paragon'), ab('x2-dark-knight-demi'), ['rikku'], { exactTargets: true });
    const after = hpOf(b);
    expect(after[1]).toBeLessThan(before[1]!);
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
  });

  it('without the flag the row decides: the same all-party Demi hits all three', () => {
    const b = board('paragon');
    sturdy(b);
    const before = hpOf(b);
    resolveAbility(b.resolveCtx(), b.unit('paragon'), ab('x2-dark-knight-demi'), ['rikku']);
    const after = hpOf(b);
    for (let i = 0; i < 3; i++) expect(after[i]).toBeLessThan(before[i]!);
  });

  it('a named girl who has fallen is not re-aimed: nothing happens', () => {
    const b = board('paragon');
    sturdy(b);
    const rikku = b.unit('rikku');
    rikku.hp = 0;
    rikku.alive = false;
    const before = hpOf(b);
    resolveAbility(b.resolveCtx(), b.unit('paragon'), ab('x2-dark-knight-demi'), ['rikku'], { exactTargets: true });
    expect(hpOf(b)).toEqual(before);
  });
});
