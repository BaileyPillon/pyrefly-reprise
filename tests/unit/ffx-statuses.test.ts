/**
 * Status application, Zombie semantics, Doom, Poison and Regen
 * [ffx-combat-core §4].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, FFXCombatant } from '../../src/battle/common/types.ts';
import {
  applyStatus,
  buildBattle,
  consumeNulCharges,
  type Ctx,
  ESUNA_CURES,
  FFXContentRegistry,
  onTurnEnd,
  onTurnStart,
  payRegen,
  removeStatuses,
  rollStatus,
  tickDurationStatuses,
} from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { enemy, setup } from './ffx-fixtures.test.ts';

function makeCtx(overrides: Partial<BattleSetup> = {}): { ctx: Ctx; events: BattleEvent[] } {
  const s = setup(overrides);
  const events: BattleEvent[] = [];
  let seq = 0;
  const ctx = buildBattle(s, new SeededRng(s.seed), new FFXContentRegistry(), (e) => {
    events.push({ ...e, seq: seq++ } as BattleEvent);
  });
  return { ctx, events };
}

function at(ctx: Ctx, id: string): FFXCombatant {
  const c = ctx.state.combatants[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c as FFXCombatant;
}

describe('the application model (§4.1)', () => {
  it('chance 255 ignores even a 255 resistance', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    target.immunities['poison'] = 255;
    expect(rollStatus(ctx, target, 'poison', 255)).toBe(true);
  });

  it('chance 254 is guaranteed, but a 255 resistance still blocks it', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    expect(rollStatus(ctx, target, 'poison', 254)).toBe(true);
    target.immunities['poison'] = 255;
    expect(rollStatus(ctx, target, 'poison', 254)).toBe(false);
  });

  it('resistance SUBTRACTS: a 50 Ward completely blocks a chance-50 application', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    target.immunities['sleep'] = 50;
    for (let i = 0; i < 200; i++) expect(rollStatus(ctx, target, 'sleep', 50)).toBe(false);
  });

  it('a 50 Ward halves a chance-100 application rather than multiplying it', () => {
    const { ctx } = makeCtx();
    const warded = at(ctx, 'dummy');
    warded.immunities['sleep'] = 50;
    let landed = 0;
    for (let i = 0; i < 2000; i++) if (rollStatus(ctx, warded, 'sleep', 100)) landed++;
    // (100 - 50) > rng%101 -> 50/101 of the time.
    expect(landed / 2000).toBeGreaterThan(0.42);
    expect(landed / 2000).toBeLessThan(0.58);
  });

  it('does not refresh or stack a status that is already present', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    expect(applyStatus(ctx, undefined, target, { status: 'sleep', chance: 255, duration: 3 })).toBe(true);
    const first = target.statuses['sleep'];
    expect(applyStatus(ctx, undefined, target, { status: 'sleep', chance: 255, duration: 10 })).toBe(false);
    expect(target.statuses['sleep']).toBe(first);
    expect(target.statuses['sleep']?.turnsRemaining).toBe(3);
  });

  it('stacks Cheer to a cap of five', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    for (let i = 0; i < 8; i++) {
      applyStatus(ctx, undefined, tidus, { status: 'cheer', chance: 255, duration: 254, stacks: 1 });
    }
    expect(tidus.statuses['cheer']?.stacks).toBe(5);
  });
});

describe('Zombie (§4.2, §7.1)', () => {
  it('blocks a chance-100 Death — which is exactly how Mega Death works', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'zombie', chance: 255, duration: 254 });
    for (let i = 0; i < 200; i++) expect(rollStatus(ctx, tidus, 'ko', 100)).toBe(false);
  });

  it('does not block an "always inflicts death" chance-255 attack', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'zombie', chance: 255, duration: 254 });
    expect(rollStatus(ctx, tidus, 'ko', 255)).toBe(true);
  });

  it('Mega Death kills a mixed party except the Zombie and the Deathproof member', () => {
    const { ctx } = makeCtx();
    const zombied = at(ctx, 'tidus');
    const proofed = at(ctx, 'yuna');
    const plain = at(ctx, 'auron');
    applyStatus(ctx, undefined, zombied, { status: 'zombie', chance: 255, duration: 254 });
    proofed.immunities['ko'] = 255;

    const megaDeath = { status: 'ko' as const, chance: 100, duration: 254 };
    const landed = [zombied, proofed, plain].map((c) => applyStatus(ctx, undefined, c, megaDeath));
    expect(landed).toEqual([false, false, true]);
  });

  it('is NOT cured by Esuna', () => {
    expect(ESUNA_CURES).not.toContain('zombie');
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'zombie', chance: 255, duration: 254 });
    removeStatuses(ctx, tidus, ESUNA_CURES, 'cured');
    expect(tidus.statuses['zombie']).toBeDefined();
  });

  it('turns a Regen tick into damage (the Yunalesca attrition engine)', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 1500;
    applyStatus(ctx, undefined, tidus, { status: 'zombie', chance: 255, duration: 254 });
    applyStatus(ctx, undefined, tidus, { status: 'regen', chance: 255, duration: 10 });
    payRegen(ctx, 20);
    // floor(20 * 2000 / 256) + 100 = 256
    expect(tidus.hp).toBe(1500 - 256);
  });
});

describe('Regen (§4.3)', () => {
  it('pays floor(elapsedTicks * maxHP / 256) + 100 at any unit’s turn', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 100;
    applyStatus(ctx, undefined, tidus, { status: 'regen', chance: 255, duration: 10 });
    payRegen(ctx, 20);
    expect(tidus.hp).toBe(100 + 256);
  });

  it('pays at least its +100 even with zero elapsed ticks', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 100;
    applyStatus(ctx, undefined, tidus, { status: 'regen', chance: 255, duration: 10 });
    payRegen(ctx, 0);
    expect(tidus.hp).toBe(200);
  });
});

describe('Poison (§4.2)', () => {
  it('costs a character maxHP // 4 at the end of their own turn', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'poison', chance: 255, duration: 254 });
    onTurnEnd(ctx, tidus);
    expect(tidus.hp).toBe(2000 - 500);
  });

  it('uses the enemy’s own percentage', () => {
    const { ctx } = makeCtx({
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'seymour-flux', poisonTickPercent: 2 })] },
    });
    const boss = at(ctx, 'seymour-flux');
    applyStatus(ctx, undefined, boss, { status: 'poison', chance: 255, duration: 254 });
    const before = boss.hp;
    onTurnEnd(ctx, boss);
    expect(before - boss.hp).toBe(Math.floor((boss.stats.maxHp * 2) / 100));
  });
});

describe('Doom (§4.2)', () => {
  it('counts down on the victim’s own turn and KOs at zero', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'doom', chance: 255, duration: 3 });
    onTurnStart(ctx, tidus, 0);
    expect(tidus.statuses['doom']?.turnsRemaining).toBe(2);
    onTurnStart(ctx, tidus, 0);
    expect(tidus.statuses['doom']?.turnsRemaining).toBe(1);
    onTurnStart(ctx, tidus, 0);
    expect(tidus.alive).toBe(false);
    expect(tidus.statuses['ko']).toBeDefined();
  });
});

describe('durations and Petrify', () => {
  it('ticks only Sleep, Silence, Darkness, Slow and Regen, on the victim’s own action', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'silence', chance: 255, duration: 3 });
    applyStatus(ctx, undefined, tidus, { status: 'protect', chance: 255, duration: 254 });
    tickDurationStatuses(ctx, tidus);
    expect(tidus.statuses['silence']?.turnsRemaining).toBe(2);
    expect(tidus.statuses['protect']?.turnsRemaining).toBe(254);
  });

  it('wipes other statuses on petrification but keeps the buff stacks', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'cheer', chance: 255, duration: 254, stacks: 3 });
    applyStatus(ctx, undefined, tidus, { status: 'protect', chance: 255, duration: 254 });
    applyStatus(ctx, undefined, tidus, { status: 'petrify', chance: 255, duration: 254 });
    expect(tidus.statuses['protect']).toBeUndefined();
    expect(tidus.statuses['cheer']?.stacks).toBe(3);
    expect(tidus.statuses['petrify']).toBeDefined();
  });
});

describe('Nul statuses beat everything (§3)', () => {
  it('consumes one charge and nullifies the attack', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'nulblaze', chance: 255, duration: 1 });
    expect(consumeNulCharges(ctx, tidus, ['fire'])).toBe(true);
    expect(tidus.statuses['nulblaze']).toBeUndefined();
    expect(consumeNulCharges(ctx, tidus, ['fire'])).toBe(false);
  });

  it('only nullifies when every element of the attack is covered', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    applyStatus(ctx, undefined, tidus, { status: 'nulblaze', chance: 255, duration: 1 });
    expect(consumeNulCharges(ctx, tidus, ['fire', 'ice'])).toBe(false);
    expect(tidus.statuses['nulblaze']).toBeDefined();
  });

  it('beats Absorb — a Fire Eater with NulBlaze nullifies rather than absorbing', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.affinities['fire'] = 'absorb';
    applyStatus(ctx, undefined, tidus, { status: 'nulblaze', chance: 255, duration: 1 });
    expect(consumeNulCharges(ctx, tidus, ['fire'])).toBe(true);
  });
});
