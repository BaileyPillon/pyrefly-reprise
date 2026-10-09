/**
 * CTB: the Agility -> base-ticks table, rank-linear recovery, Haste/Slow, Delay
 * and the turn forecast [ffx-combat-core §1].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup } from '../../src/battle/common/types.ts';
import {
  baseCtb,
  buildBattle,
  type Ctx,
  FFXContentRegistry,
  nextActor,
  predictTurnOrder,
  recoveryTicks,
  resolveAbility,
} from '../../src/battle/ffx/index.ts';
import { advance } from '../../src/battle/ffx/turnQueue.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { ScriptedRng } from './helpers/ffxEngineWiring.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { enemy, member, party, setup } from './ffx-fixtures.test.ts';
import { giveStatus, inflict } from './helpers/ffxStatus.ts';

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
    inflict(hasted, undefined, target as never, { status: 'haste', chance: 255, duration: 254 });
    expect(recoveryTicks(target as never, 3)).toBe(Math.floor(plain / 2));

    const slowed = makeCtx();
    const other = slowed.state.combatants['tidus'];
    if (!other) throw new Error('fixture');
    inflict(slowed, undefined, other as never, { status: 'slow', chance: 255, duration: 254 });
    expect(recoveryTicks(other as never, 3)).toBe(plain * 2);
  });
});

describe('a Haste or Slow status landing does not move the current counter (§1.4)', () => {
  // The game has no such code (research/re-ffx-ctb-status.md §5): the rescale is the CAST's own CTB damage, formula 0xd, which the
  // hit applies; a status that arrives any other way (equipment, a monster move with no CTB class) leaves the counter alone.
  // The cast itself is proven in parity-ffx-engine-ctb-status.test.ts.
  it('Haste and Slow leave a pending wait of 30 at 30', () => {
    const ctx = makeCtx();
    const tidus = ctx.state.combatants['tidus'];
    if (!tidus) throw new Error('fixture');
    const tidusRt = ctx.rt.actors.get('tidus');
    if (tidusRt) tidusRt.ctb = 30;
    inflict(ctx, undefined, tidus as never, { status: 'haste', chance: 255, duration: 254 });
    expect(ctbOf(ctx, 'tidus')).toBe(30);

    const ctx2 = makeCtx();
    const yuna = ctx2.state.combatants['yuna'];
    if (!yuna) throw new Error('fixture');
    const yunaRt = ctx2.rt.actors.get('yuna');
    if (yunaRt) yunaRt.ctb = 30;
    inflict(ctx2, undefined, yuna as never, { status: 'slow', chance: 255, duration: 254 });
    expect(ctbOf(ctx2, 'yuna')).toBe(30);
  });

  it('Haste and Slow are mutually exclusive', () => {
    const ctx = makeCtx();
    const tidus = ctx.state.combatants['tidus'];
    if (!tidus) throw new Error('fixture');
    inflict(ctx, undefined, tidus as never, { status: 'slow', chance: 255, duration: 254 });
    inflict(ctx, undefined, tidus as never, { status: 'haste', chance: 255, duration: 254 });
    expect(tidus.statuses['slow']).toBeUndefined();
    expect(tidus.statuses['haste']).toBeDefined();
  });
});

describe('Delay (§1.5)', () => {
  /** A battle whose rolls are scripted (a raw draw of 0 lands every hit), and the real Delay abilities. */
  function delayCtx(over: Partial<BattleSetup> = {}): Ctx {
    const s = setup(over);
    return buildBattle(s, new ScriptedRng([0]), new FFXContentRegistry(), () => undefined);
  }
  const abilityOf = (id: string) => ALL_ABILITIES.find((a) => a.id === id)!;

  it('weak delay adds floor(tick*3/2), strong adds tick*3, using the target\'s own tick speed (inside the hit, VA 0x0078e0f0)', () => {
    const ctx = delayCtx({
      enemies: {
        id: 'g',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', stats: { ...enemy({ id: 'x' }).stats, agi: 20 } })],
      },
    });
    const tidus = ctx.state.combatants['tidus'] as never;
    const before = ctbOf(ctx, 'dummy');
    resolveAbility(ctx, tidus, abilityOf('delay-attack'), ['dummy']);
    // The dummy's Agility 20 is a tick speed of 10: 10 * 3 / 2 = 15.
    expect(ctbOf(ctx, 'dummy')).toBe(before + 15);
    resolveAbility(ctx, tidus, abilityOf('delay-buster'), ['dummy']);
    expect(ctbOf(ctx, 'dummy')).toBe(before + 15 + 30);
  });

  it('does nothing to an immune-to-delay enemy', () => {
    const ctx = delayCtx({
      enemies: {
        id: 'g',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', immunityFlags: ['immune-to-delay'] })],
      },
    });
    const before = ctbOf(ctx, 'dummy');
    resolveAbility(ctx, ctx.state.combatants['tidus'] as never, abilityOf('delay-buster'), ['dummy']);
    expect(ctbOf(ctx, 'dummy')).toBe(before);
  });

  it('is clamped to the byte: a counter near 255 stops there', () => {
    const ctx = delayCtx();
    const rt = ctx.rt.actors.get('dummy')!;
    rt.ctb = 250;
    resolveAbility(ctx, ctx.state.combatants['tidus'] as never, abilityOf('delay-buster'), ['dummy']);
    expect(rt.ctb).toBe(255);
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
      giveStatus(tidus as never, status);
    }
    const row = predictTurnOrder(ctx, 8).find((r) => r.actorId === 'tidus');
    expect(row?.statusIcons.length).toBe(3);
  });
});

describe('the clock (VA 0x00790fb0)', () => {
  it('counts every counter down together until the first reaches 0, and reports the ticks that took', () => {
    const ctx = makeCtx();
    for (const [, rt] of ctx.rt.actors) rt.ctb += 100;
    const onField = ['tidus', 'yuna', 'auron', 'dummy'];
    const before = new Map(onField.map((id) => [id, ctbOf(ctx, id)]));
    const elapsed = advance(ctx);
    expect(elapsed).toBeGreaterThan(0);
    // Everybody on the field lost exactly the elapsed ticks, and the lowest is at 0.
    for (const id of onField) expect(ctbOf(ctx, id)).toBe((before.get(id) as number) - elapsed);
    expect(Math.min(...onField.map((id) => ctbOf(ctx, id)))).toBe(0);
    // Somebody is ready now, so the clock does not move again.
    expect(advance(ctx)).toBe(0);
  });
});
