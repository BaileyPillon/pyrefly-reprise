/**
 * Status application, Zombie semantics, Doom, Poison and Regen
 * [ffx-combat-core §4].
 *
 * **Rewritten for re-parity W2 (FFX only).** The engine's status model is the game's now: a status lands through the infliction step
 * of a hit (`adapt/status.ts`, the kernel `kernel/status-inflict.ts`, VA 0x0078ae00), the per-turn ticks are `kernel/turn-ticks.ts`.
 * These tests keep the RULES the old file pinned and run them through that path:
 *
 * - landing goes through `inflict` (`helpers/ffxStatus.ts`: a command carrying the application, resolved as one hit), with the rolls
 *   scripted where a result must not depend on the seed;
 * - a status is put on by hand (`giveStatus`) only where the test is about something else;
 * - what a cleanse removes is read off the game's own records (the real Esuna), not off a list of ours;
 * - the ticks are the start-of-turn and end-of-turn functions the engine runs.
 *
 * The exhaustive proof against an independent oracle is `parity-ffx-engine-status.test.ts` and `parity-ffx-engine-ticks.test.ts`; the
 * kernels' proof against the exe's machine code is `parity-ffx-status-*.test.ts` and `parity-ffx-turn-ticks.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, FFXCombatant } from '../../src/battle/common/types.ts';
import {
  buildBattle,
  type Ctx,
  FFXContentRegistry,
  onTurnEnd,
  onTurnStart,
  removeStatus,
  resolveAbility,
} from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { ability, enemy, setup } from './ffx-fixtures.test.ts';
import { giveStatus, inflict } from './helpers/ffxStatus.ts';
import { ScriptedRng } from './helpers/ffxEngineWiring.ts';

/** A battle context. `raws` scripts the rolls (raw 31-bit values, reduced the way the game reduces them); absent, the seeded stream. */
function makeCtx(overrides: Partial<BattleSetup> = {}, raws?: readonly number[]): { ctx: Ctx; events: BattleEvent[] } {
  const s = setup(overrides);
  const events: BattleEvent[] = [];
  let seq = 0;
  const rng = raws ? new ScriptedRng(raws) : new SeededRng(s.seed);
  const ctx = buildBattle(s, rng, new FFXContentRegistry(), (e) => {
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
    expect(inflict(ctx, at(ctx, 'tidus'), target, { status: 'poison', chance: 255, duration: 254 })).toBe(true);
  });

  it('chance 254 is guaranteed, but a 255 resistance still blocks it', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    const tidus = at(ctx, 'tidus');
    expect(inflict(ctx, tidus, target, { status: 'poison', chance: 254, duration: 254 })).toBe(true);
    delete target.statuses['poison'];
    target.immunities['poison'] = 255;
    expect(inflict(ctx, tidus, target, { status: 'poison', chance: 254, duration: 254 })).toBe(false);
  });

  it('resistance SUBTRACTS: a 50 Ward completely blocks a chance-50 application', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    target.immunities['sleep'] = 50;
    const tidus = at(ctx, 'tidus');
    for (let i = 0; i < 200; i++) expect(inflict(ctx, tidus, target, { status: 'sleep', chance: 50, duration: 3 })).toBe(false);
  });

  it('a 50 Ward halves a chance-100 application rather than multiplying it', () => {
    const { ctx } = makeCtx();
    const warded = at(ctx, 'dummy');
    warded.immunities['sleep'] = 50;
    const tidus = at(ctx, 'tidus');
    let landed = 0;
    for (let i = 0; i < 2000; i++) {
      delete warded.statuses['sleep'];
      if (inflict(ctx, tidus, warded, { status: 'sleep', chance: 100, duration: 3 })) landed++;
    }
    // The roll 0..100 lands below 100 - 50: 50 of 101 rolls.
    expect(landed / 2000).toBeGreaterThan(0.42);
    expect(landed / 2000).toBeLessThan(0.58);
  });

  it('lands exactly on the rolls below chance - resistance, and the roll is one draw modulo 101', () => {
    // chance 100, resistance 30 -> rolls 0..69 land (the kernel's worked example); a raw draw of 101 * 7 + 69 acts as 69.
    for (const [raw, lands] of [[69, true], [70, false], [101 * 7 + 69, true], [101 * 7 + 70, false], [0, true], [100, false]] as const) {
      const { ctx } = makeCtx({}, [raw]);
      const target = at(ctx, 'dummy');
      target.immunities['poison'] = 30;
      ctx.rng = new ScriptedRng([raw]); // the opening draws are spent; this one is the status roll
      expect(inflict(ctx, at(ctx, 'tidus'), target, { status: 'poison', chance: 100, duration: 254 }), `raw ${raw}`).toBe(lands);
    }
  });

  it('does not refresh or stack a status that is already present', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    const tidus = at(ctx, 'tidus');
    expect(inflict(ctx, tidus, target, { status: 'sleep', chance: 255, duration: 3 })).toBe(true);
    const first = target.statuses['sleep'];
    expect(inflict(ctx, tidus, target, { status: 'sleep', chance: 255, duration: 10 })).toBe(false);
    expect(target.statuses['sleep']).toBe(first);
    expect(target.statuses['sleep']?.turnsRemaining).toBe(3);
  });

  it('a status cast on oneself lasts one turn longer (a finite duration that ticks at the end of the holder\'s turn)', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    expect(inflict(ctx, tidus, tidus, { status: 'silence', chance: 255, duration: 3 })).toBe(true);
    expect(tidus.statuses['silence']?.turnsRemaining).toBe(4);
    // 254 ("until removed") is not a turn count and gains nothing.
    expect(inflict(ctx, tidus, tidus, { status: 'protect', chance: 255, duration: 254 })).toBe(true);
    expect(tidus.statuses['protect']?.turnsRemaining).toBe(254);
  });

  it('stacks Cheer to a cap of five', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    for (let i = 0; i < 8; i++) {
      inflict(ctx, at(ctx, 'yuna'), tidus, { status: 'cheer', chance: 255, duration: 254, stacks: 1 });
    }
    expect(tidus.statuses['cheer']?.stacks).toBe(5);
  });

  it('Haste and Slow cancel each other, and a permanent one cannot be displaced', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    const yuna = at(ctx, 'yuna');
    inflict(ctx, yuna, tidus, { status: 'slow', chance: 255, duration: 254 });
    inflict(ctx, yuna, tidus, { status: 'haste', chance: 255, duration: 254 });
    expect(tidus.statuses['slow']).toBeUndefined();
    expect(tidus.statuses['haste']).toBeDefined();
    giveStatus(yuna, 'haste', { permanent: true, turnsRemaining: 255 });
    expect(inflict(ctx, tidus, yuna, { status: 'slow', chance: 255, duration: 254 })).toBe(false);
    expect(yuna.statuses['haste']).toBeDefined();
  });

  it('Confuse, Berserk, Provoke and Threaten exclude one another', () => {
    const { ctx } = makeCtx();
    const target = at(ctx, 'dummy');
    const tidus = at(ctx, 'tidus');
    inflict(ctx, tidus, target, { status: 'confuse', chance: 255, duration: 254 });
    inflict(ctx, tidus, target, { status: 'berserk', chance: 255, duration: 254 });
    expect(target.statuses['confuse']).toBeUndefined();
    expect(target.statuses['berserk']).toBeDefined();
    inflict(ctx, tidus, target, { status: 'provoke', chance: 255, duration: 254 });
    expect(target.statuses['berserk']).toBeUndefined();
    expect(target.statuses['provoke']).toBeDefined();
  });
});

describe('Zombie (§4.2, §7.1)', () => {
  it('blocks a chance-100 Death — which is exactly how Mega Death works', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'zombie');
    const boss = at(ctx, 'dummy');
    // The game raises the resistance to 254 against a Zombie record: no roll from 0 to 100 gets under chance - 254.
    for (let i = 0; i < 200; i++) expect(inflict(ctx, boss, tidus, { status: 'ko', chance: 100, duration: 254 })).toBe(false);
    expect(tidus.alive).toBe(true);
  });

  it('does not block an "always inflicts death" chance-255 attack, or a chance-254 one', () => {
    for (const chance of [255, 254]) {
      const { ctx } = makeCtx();
      const tidus = at(ctx, 'tidus');
      giveStatus(tidus, 'zombie');
      expect(inflict(ctx, at(ctx, 'dummy'), tidus, { status: 'ko', chance, duration: 254 }), `chance ${chance}`).toBe(true);
      expect(tidus.alive).toBe(false);
    }
  });

  it('Mega Death kills a mixed party except the Zombie and the Deathproof member', () => {
    // Rolls scripted so the one chance-100 roll that fails (exactly 100) cannot come up.
    const { ctx } = makeCtx({}, [7]);
    const zombied = at(ctx, 'tidus');
    const proofed = at(ctx, 'yuna');
    const plain = at(ctx, 'auron');
    giveStatus(zombied, 'zombie');
    proofed.immunities['ko'] = 255;
    const megaDeath = { status: 'ko' as const, chance: 100, duration: 254 };
    const boss = at(ctx, 'dummy');
    const landed = [zombied, proofed, plain].map((c) => inflict(ctx, boss, c, megaDeath));
    expect(landed).toEqual([false, false, true]);
  });

  it('is NOT cured by Esuna (the game\'s own record of it)', () => {
    const { ctx } = makeCtx();
    const esuna = ALL_ABILITIES.find((a) => a.id === 'esuna');
    if (!esuna) throw new Error('esuna missing from the data layer');
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'zombie');
    giveStatus(tidus, 'poison');
    resolveAbility(ctx, at(ctx, 'yuna'), esuna, ['tidus']);
    expect(tidus.statuses['poison']).toBeUndefined();
    expect(tidus.statuses['zombie']).toBeDefined();
  });

  it('turns a Regen tick into damage (the Yunalesca attrition engine)', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 1500;
    giveStatus(tidus, 'zombie');
    giveStatus(tidus, 'regen', { turnsRemaining: 10 });
    ctx.rt.actors.get('tidus')!.regenTicks = 20;
    onTurnStart(ctx, at(ctx, 'yuna'));
    // (20 * 2000 >> 8) + 100 = 256
    expect(tidus.hp).toBe(1500 - 256);
  });
});

describe('Regen (§4.3)', () => {
  it('pays (its own tick counter * maxHP >> 8) + 100 at any unit’s turn', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 100;
    giveStatus(tidus, 'regen', { turnsRemaining: 10 });
    ctx.rt.actors.get('tidus')!.regenTicks = 20;
    onTurnStart(ctx, at(ctx, 'yuna'));
    expect(tidus.hp).toBe(100 + 256);
    // The payout resets the holder's tick counter, so the next turn start pays the +100 alone.
    expect(ctx.rt.actors.get('tidus')!.regenTicks).toBe(0);
    onTurnStart(ctx, at(ctx, 'yuna'));
    expect(tidus.hp).toBe(100 + 256 + 100);
  });

  it('pays at least its +100 with no ticks counted', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 100;
    giveStatus(tidus, 'regen', { turnsRemaining: 10 });
    ctx.rt.actors.get('tidus')!.regenTicks = 0;
    onTurnStart(ctx, at(ctx, 'yuna'));
    expect(tidus.hp).toBe(200);
  });

  it('a Regen that lands resets its holder\'s tick counter: a fresh Regen pays +100, not a full maxHP (VA 0x0078f060)', () => {
    // The counter saturates at 255 long before anybody casts Regen; the write-back of the hit record puts it back to 0 when the Regen
    // counter goes from 0 to something, so the first payout counts the ticks since the cast. Without the reset it was 255 * 2000 >> 8 + 100.
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    const regen = { status: 'regen', chance: 255, duration: 10 } as const;
    tidus.hp = 500;
    ctx.rt.actors.get('tidus')!.regenTicks = 255;
    expect(inflict(ctx, at(ctx, 'yuna'), tidus, regen)).toBe(true);
    expect(ctx.rt.actors.get('tidus')!.regenTicks).toBe(0);
    onTurnStart(ctx, at(ctx, 'yuna'));
    expect(tidus.hp).toBe(500 + 100);
    // The same Zombie: the fresh Regen costs it 100, it does not drop it from full to nothing.
    const yuna = at(ctx, 'yuna');
    giveStatus(yuna, 'zombie');
    const yunaHp = yuna.hp;
    ctx.rt.actors.get('yuna')!.regenTicks = 255;
    expect(inflict(ctx, tidus, yuna, regen)).toBe(true);
    onTurnStart(ctx, tidus);
    expect(yuna.hp).toBe(yunaHp - 100);
  });

  it('counts down at the START of its holder\'s own turn, and not at the end', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'regen', { turnsRemaining: 10 });
    onTurnStart(ctx, at(ctx, 'yuna'));
    expect(tidus.statuses['regen']?.turnsRemaining).toBe(10); // somebody else's turn
    onTurnStart(ctx, tidus);
    expect(tidus.statuses['regen']?.turnsRemaining).toBe(9);
    onTurnEnd(ctx, tidus);
    expect(tidus.statuses['regen']?.turnsRemaining).toBe(9);
  });
});

describe('Poison (§4.2)', () => {
  it('costs a character maxHP * 25 / 100 at the end of their own turn', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'poison');
    onTurnEnd(ctx, tidus);
    expect(tidus.hp).toBe(2000 - 500);
  });

  it('uses the enemy’s own percentage', () => {
    const { ctx } = makeCtx({
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'seymour-flux', poisonTickPercent: 2 })] },
    });
    const boss = at(ctx, 'seymour-flux');
    giveStatus(boss, 'poison');
    const before = boss.hp;
    onTurnEnd(ctx, boss);
    expect(before - boss.hp).toBe(Math.floor((boss.stats.maxHp * 2) / 100));
  });

  it('a poisoned enemy with no Poison byte of its monster record is an error, not a guess', () => {
    const { ctx } = makeCtx();
    const boss = at(ctx, 'dummy');
    giveStatus(boss, 'poison');
    expect(() => onTurnEnd(ctx, boss)).toThrow(/poisonTickPercent/);
  });

  it('only follows an action whose results were applied: a passed turn (a sleeper\'s) takes none', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'poison');
    onTurnEnd(ctx, tidus, false);
    expect(tidus.hp).toBe(2000);
    onTurnEnd(ctx, tidus, true);
    expect(tidus.hp).toBe(1500);
  });
});

describe('Double HP and Double MP (VA 0x0078d270)', () => {
  it('cap at 9,999 and 999 without the Break limits, and removing the flags brings the stored base back', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.stats.maxHp = 6000;
    tidus.hp = 6000;
    tidus.stats.maxMp = 700;
    tidus.mp = 700;
    expect(inflict(ctx, at(ctx, 'yuna'), tidus, { status: 'max-hp-x2', chance: 255, duration: 254 })).toBe(true);
    expect(inflict(ctx, at(ctx, 'yuna'), tidus, { status: 'max-mp-x2', chance: 255, duration: 254 })).toBe(true);
    expect([tidus.stats.maxHp, tidus.stats.maxMp]).toEqual([9999, 999]); // 12,000 and 1,400 without the equipment
    tidus.statuses['max-hp-x2'] && removeStatus(ctx, tidus, 'max-hp-x2', 'expired');
    removeStatus(ctx, tidus, 'max-mp-x2', 'expired');
    expect([tidus.stats.maxHp, tidus.stats.maxMp]).toEqual([6000, 700]); // the stored base comes back
  });

  it('removing one flag leaves the other doubled maximum alone: with Break MP Limit a doubled 800 stays 1,600', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.equipment!.armor.autoAbilities = [...tidus.equipment!.armor.autoAbilities, 'break-mp-limit'];
    tidus.stats.maxHp = 2000;
    tidus.stats.maxMp = 800;
    tidus.mp = 800;
    expect(inflict(ctx, at(ctx, 'yuna'), tidus, { status: 'max-hp-x2', chance: 255, duration: 254 })).toBe(true);
    expect(inflict(ctx, at(ctx, 'yuna'), tidus, { status: 'max-mp-x2', chance: 255, duration: 254 })).toBe(true);
    expect([tidus.stats.maxHp, tidus.stats.maxMp]).toEqual([4000, 1600]);
    removeStatus(ctx, tidus, 'max-hp-x2', 'expired');
    // The Double MP flag is still on and the function was handed the byte already in force: "already doubled", nothing is recomputed (the table of
    // research/re-ffx-ctb-status.md section 7), so the 1,600 the limit allowed is not cut back to the 999 of a wearer without it.
    expect([tidus.stats.maxHp, tidus.stats.maxMp]).toEqual([2000, 1600]);
  });
});

describe('Doom (§4.2)', () => {
  it('counts down from the game\'s 5 on the victim’s own turn and KOs at zero', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    // The ability's duration (3) is a placeholder of the data: a party member's Doom countdown is the game's 5.
    expect(inflict(ctx, at(ctx, 'dummy'), tidus, { status: 'doom', chance: 255, duration: 3 })).toBe(true);
    expect(tidus.statuses['doom']?.turnsRemaining).toBe(5);
    for (const left of [4, 3, 2, 1]) {
      onTurnStart(ctx, tidus);
      expect(tidus.statuses['doom']?.turnsRemaining).toBe(left);
    }
    onTurnStart(ctx, tidus);
    expect(tidus.alive).toBe(false);
    expect(tidus.statuses['ko']).toBeDefined();
  });

  it('an enemy that can be Doomed starts from the countdown of its monster record', () => {
    const { ctx } = makeCtx({
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'seymour-flux', doomTurns: 3 })] },
    });
    const boss = at(ctx, 'seymour-flux');
    expect(inflict(ctx, at(ctx, 'tidus'), boss, { status: 'doom', chance: 255, duration: 254 })).toBe(true);
    expect(boss.statuses['doom']?.turnsRemaining).toBe(3);
  });

  it('an enemy with no Doom countdown is an error, not a guess', () => {
    const { ctx } = makeCtx();
    expect(() => inflict(ctx, at(ctx, 'tidus'), at(ctx, 'dummy'), { status: 'doom', chance: 255, duration: 254 })).toThrow(/doomTurns/);
  });
});

describe('durations and Petrify', () => {
  it('ticks Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow at the end of the holder\'s own turn, and nothing else', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'silence', { turnsRemaining: 3 });
    giveStatus(tidus, 'shell', { turnsRemaining: 6 });
    giveStatus(tidus, 'haste', { turnsRemaining: 2 });
    giveStatus(tidus, 'protect'); // 254: until removed, never counted down
    giveStatus(tidus, 'defend');
    onTurnEnd(ctx, tidus);
    expect(tidus.statuses['silence']?.turnsRemaining).toBe(2);
    expect(tidus.statuses['shell']?.turnsRemaining).toBe(5);
    expect(tidus.statuses['haste']?.turnsRemaining).toBe(1);
    expect(tidus.statuses['protect']?.turnsRemaining).toBe(254);
    expect(tidus.statuses['defend']).toBeDefined();
    onTurnEnd(ctx, tidus);
    expect(tidus.statuses['haste']).toBeUndefined(); // ran out
  });

  it('Defend, Guard, Sentinel, Shield and Boost end at the start of the holder\'s next turn', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    for (const s of ['defend', 'guard', 'sentinel', 'shield', 'boost'] as const) giveStatus(tidus, s);
    onTurnStart(ctx, at(ctx, 'yuna'));
    expect(Object.keys(tidus.statuses).sort()).toEqual(['boost', 'defend', 'guard', 'sentinel', 'shield']); // somebody else's turn
    onTurnStart(ctx, tidus);
    expect(Object.keys(tidus.statuses)).toEqual([]);
  });

  it('wipes other statuses on petrification but keeps the buff stacks', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    const boss = at(ctx, 'dummy');
    inflict(ctx, boss, tidus, { status: 'cheer', chance: 255, duration: 254, stacks: 3 });
    inflict(ctx, boss, tidus, { status: 'protect', chance: 255, duration: 254 });
    inflict(ctx, boss, tidus, { status: 'petrify', chance: 255, duration: 254 });
    expect(tidus.statuses['protect']).toBeUndefined();
    expect(tidus.statuses['cheer']?.stacks).toBe(3);
    expect(tidus.statuses['petrify']).toBeDefined();
  });

  it('a Petrified monster shatters at once: Petrify puts Death and Eject in the record itself', () => {
    const { ctx } = makeCtx();
    const boss = at(ctx, 'dummy');
    inflict(ctx, at(ctx, 'tidus'), boss, { status: 'petrify', chance: 255, duration: 254 });
    expect(boss.statuses['eject']).toBeDefined();
    expect(boss.removed).toBe(true);
    expect(boss.alive).toBe(false);
  });
});

describe('Nul statuses beat everything (§3)', () => {
  const fire = ability({
    id: 'fire',
    name: 'Fire',
    category: 'blackmagic',
    power: 14,
    formula: 'magic',
    damageType: 'magical',
    element: ['fire'],
    canMiss: false,
    flags: [],
  });
  const fireAndIce = { ...fire, id: 'fire-ice', element: ['fire', 'ice'] as typeof fire.element };

  it('consumes one charge and nullifies the attack', () => {
    const { ctx, events } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'nulblaze', { turnsRemaining: null, charges: 1 });
    resolveAbility(ctx, at(ctx, 'dummy'), fire, ['tidus']);
    expect(tidus.hp).toBe(2000);
    expect(tidus.statuses['nulblaze']).toBeUndefined();
    expect(events.some((e) => e.type === 'miss' && e.reason === 'nullified')).toBe(true);
    resolveAbility(ctx, at(ctx, 'dummy'), fire, ['tidus']);
    expect(tidus.hp).toBeLessThan(2000);
  });

  it('only nullifies when every element of the attack is covered', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'nulblaze', { turnsRemaining: null, charges: 1 });
    resolveAbility(ctx, at(ctx, 'dummy'), fireAndIce, ['tidus']);
    expect(tidus.hp).toBeLessThan(2000);
    expect(tidus.statuses['nulblaze']).toBeDefined();
  });

  it('beats Absorb — a Fire Eater with NulBlaze nullifies rather than absorbing', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    tidus.hp = 1000;
    tidus.affinities['fire'] = 'absorb';
    giveStatus(tidus, 'nulblaze', { turnsRemaining: null, charges: 1 });
    resolveAbility(ctx, at(ctx, 'dummy'), fire, ['tidus']);
    expect(tidus.hp).toBe(1000);
    expect(tidus.statuses['nulblaze']).toBeUndefined();
  });

  it('a permanent Nul never runs out', () => {
    const { ctx } = makeCtx();
    const tidus = at(ctx, 'tidus');
    giveStatus(tidus, 'nulblaze', { turnsRemaining: null, charges: null, permanent: true });
    for (let i = 0; i < 4; i++) resolveAbility(ctx, at(ctx, 'dummy'), fire, ['tidus']);
    expect(tidus.hp).toBe(2000);
    expect(tidus.statuses['nulblaze']).toBeDefined();
  });
});
