/**
 * CTB: the Agility -> base-ticks table, rank-linear recovery, Haste/Slow, Delay
 * and the turn forecast [ffx-combat-core §1].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup } from '../../src/battle/common/types.ts';
import {
  applyDelay,
  applyStatus,
  baseCtb,
  buildBattle,
  type Ctx,
  FFXContentRegistry,
  nextActor,
  predictTurnOrder,
  recoveryTicks,
  normalise,
} from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { enemy, member, party, setup } from './ffx-fixtures.test.ts';

function makeCtx(overrides: Partial<BattleSetup> = {}): Ctx {
  const s = setup(overrides);
  const events: BattleEvent[] = [];
  let seq = 0;
  return buildBattle(s, new SeededRng(s.seed), new FFXContentRegistry(), (e) => {
    events.push({ ...e, seq: seq++ } as BattleEvent);
  });
}

function ctbOf(ctx: Ctx, id: string): number {
  return ctx.rt.actors.get(id)?.ctb ?? -1;
}

describe('ICV_BASE — Agility to base ticks (§1.2)', () => {
  it.each([
    [0, 28],
    [1, 28],
    [2, 26],
    [3, 24],
    [4, 20],
    [5, 16],
    [6, 16],
    [7, 15],
    [10, 14],
    [12, 13],
    [15, 12],
    [17, 11],
    [19, 10],
    [23, 9],
    [29, 8],
    [35, 7],
    [44, 6],
    [62, 5],
    [98, 4],
    [170, 3],
    [255, 3],
  ])('Agility %i -> %i ticks', (agi, ticks) => {
    expect(baseCtb(agi)).toBe(ticks);
  });
});

describe('recovery is linear in rank (§1.3)', () => {
  const ctx = makeCtx({
    party: party({
      members: [member({ id: 'tidus', stats: { ...member({ id: 'x' }).stats, agi: 20 } })],
      activeSlots: ['tidus', 'tidus', 'tidus'],
    }),
  });
  const tidus = ctx.state.combatants['tidus'];

  it('rank 4 delays exactly twice as long as rank 2', () => {
    if (!tidus) throw new Error('fixture');
    expect(recoveryTicks(tidus as never, 2)).toBe(20);
    expect(recoveryTicks(tidus as never, 4)).toBe(40);
    expect(recoveryTicks(tidus as never, 3)).toBe(30);
  });

  it('Haste floors recovery to half and Slow doubles it (§1.4)', () => {
    const hasted = makeCtx();
    const target = hasted.state.combatants['tidus'];
    if (!target) throw new Error('fixture');
    const plain = recoveryTicks(target as never, 3);
    applyStatus(hasted, undefined, target as never, { status: 'haste', chance: 255, duration: 254 });
    expect(recoveryTicks(target as never, 3)).toBe(Math.floor(plain / 2));

    const slowed = makeCtx();
    const other = slowed.state.combatants['tidus'];
    if (!other) throw new Error('fixture');
    applyStatus(slowed, undefined, other as never, { status: 'slow', chance: 255, duration: 254 });
    expect(recoveryTicks(other as never, 3)).toBe(plain * 2);
  });
});

describe('Haste and Slow move the current counter on application (§1.4)', () => {
  it('Haste halves the pending wait, Slow doubles it', () => {
    const ctx = makeCtx();
    const tidus = ctx.state.combatants['tidus'];
    if (!tidus) throw new Error('fixture');
    // After normalisation the leading actor sits at 0, so give him a real wait.
    const tidusRt = ctx.rt.actors.get('tidus');
    if (tidusRt) tidusRt.ctb = 30;
    applyStatus(ctx, undefined, tidus as never, { status: 'haste', chance: 255, duration: 254 });
    expect(ctbOf(ctx, 'tidus')).toBe(15);

    const ctx2 = makeCtx();
    const yuna = ctx2.state.combatants['yuna'];
    if (!yuna) throw new Error('fixture');
    const yunaRt = ctx2.rt.actors.get('yuna');
    if (yunaRt) yunaRt.ctb = 30;
    applyStatus(ctx2, undefined, yuna as never, { status: 'slow', chance: 255, duration: 254 });
    expect(ctbOf(ctx2, 'yuna')).toBe(60);
  });

  it('Haste and Slow are mutually exclusive', () => {
    const ctx = makeCtx();
    const tidus = ctx.state.combatants['tidus'];
    if (!tidus) throw new Error('fixture');
    applyStatus(ctx, undefined, tidus as never, { status: 'slow', chance: 255, duration: 254 });
    applyStatus(ctx, undefined, tidus as never, { status: 'haste', chance: 255, duration: 254 });
    expect(tidus.statuses['slow']).toBeUndefined();
    expect(tidus.statuses['haste']).toBeDefined();
  });
});

describe('Delay (§1.5)', () => {
  it('weak delay adds floor(base*3/2), strong adds base*3, using the target base', () => {
    const ctx = makeCtx({
      enemies: {
        id: 'g',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', stats: { ...enemy({ id: 'x' }).stats, agi: 20 } })],
      },
    });
    normalise(ctx);
    const before = ctbOf(ctx, 'dummy');
    applyDelay(ctx, 'dummy', 'weak');
    expect(ctbOf(ctx, 'dummy')).toBe(before + Math.floor((10 * 3) / 2));
    applyDelay(ctx, 'dummy', 'strong');
    expect(ctbOf(ctx, 'dummy')).toBe(before + 15 + 30);
  });

  it('does nothing to an immune-to-delay enemy', () => {
    const ctx = makeCtx({
      enemies: {
        id: 'g',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', immunityFlags: ['immune-to-delay'] })],
      },
    });
    const before = ctbOf(ctx, 'dummy');
    expect(applyDelay(ctx, 'dummy', 'strong')).toBe(false);
    expect(ctbOf(ctx, 'dummy')).toBe(before);
  });
});

describe('turn order', () => {
  it('the faster actor goes first at a known Agility pair', () => {
    // Party at Agility 20 -> base 10 -> opening 30; enemy at 40 -> base 7 -> 21.
    const ctx = makeCtx({
      enemies: {
        id: 'g',
        game: 'ffx',
        enemies: [enemy({ id: 'yunalesca', stats: { ...enemy({ id: 'x' }).stats, agi: 40 } })],
      },
    });
    expect(nextActor(ctx)?.id).toBe('yunalesca');
  });

  it('breaks ties by the published priority: Tidus before Yuna before Auron', () => {
    const ctx = makeCtx();
    for (const id of ['tidus', 'yuna', 'auron']) {
      const rt = ctx.rt.actors.get(id);
      if (rt) rt.ctb = 5;
    }
    const enemyRt = ctx.rt.actors.get('dummy');
    if (enemyRt) enemyRt.ctb = 5;
    const order = predictTurnOrder(ctx, 4).map((row) => row.actorId);
    expect(order).toEqual(['tidus', 'yuna', 'auron', 'dummy']);
  });
});

describe('predictTurnOrder (§1.6, visual-bible §3.2)', () => {
  it('returns rows ascending by tickValue, carrying the HUD fields', () => {
    const ctx = makeCtx();
    const rows = predictTurnOrder(ctx, 8);
    expect(rows).toHaveLength(8);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]?.tickValue).toBeGreaterThanOrEqual(rows[i - 1]?.tickValue ?? 0);
      expect(rows[i]?.index).toBe(i);
    }
    const tidusRow = rows.find((r) => r.actorId === 'tidus');
    expect(tidusRow?.isParty).toBe(true);
    expect(tidusRow?.portraitKey).toBe('tidus');
    expect(tidusRow?.overdriveReady).toBe(false);
    expect(Array.isArray(tidusRow?.statusIcons)).toBe(true);
  });

  it('assumes rank 3 for everyone, and applies previewCommand only to the actor acting now', () => {
    const ctx = makeCtx();
    const plain = predictTurnOrder(ctx, 6);
    const first = plain[0]?.actorId;
    expect(first).toBeDefined();

    // An Escape is rank 1, so the current actor comes back round much sooner.
    const previewed = predictTurnOrder(ctx, 6, { kind: 'escape', targets: [], extra: { mode: 'single' } });
    const plainReturn = plain.findIndex((r, i) => i > 0 && r.actorId === first);
    const fastReturn = previewed.findIndex((r, i) => i > 0 && r.actorId === first);
    expect(fastReturn).toBeGreaterThan(0);
    expect(fastReturn).toBeLessThanOrEqual(plainReturn === -1 ? 99 : plainReturn);
  });

  it('shows at most three status pips', () => {
    const ctx = makeCtx();
    const tidus = ctx.state.combatants['tidus'];
    if (!tidus) throw new Error('fixture');
    for (const status of ['poison', 'silence', 'darkness', 'slow', 'protect'] as const) {
      applyStatus(ctx, undefined, tidus as never, { status, chance: 255, duration: 254 });
    }
    const row = predictTurnOrder(ctx, 8).find((r) => r.actorId === 'tidus');
    expect(row?.statusIcons.length).toBe(3);
  });
});

describe('normalisation keeps counters small', () => {
  it('subtracts the field minimum and reports it as elapsed ticks', () => {
    const ctx = makeCtx();
    for (const [, rt] of ctx.rt.actors) rt.ctb += 100;
    const elapsed = normalise(ctx);
    expect(elapsed).toBeGreaterThan(0);
    const min = Math.min(...[...ctx.rt.actors.values()].map((r) => r.ctb));
    expect(min).toBe(0);
  });
});
