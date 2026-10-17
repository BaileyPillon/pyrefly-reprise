/**
 * Re-parity W4: what a HIT does to the gauges, through the engine's real resolve path.
 *
 * The engine-against-game test plays Delay hits and hit reactions in by hand (`applyDelay`, `gauge.hitReaction`); this file sends real
 * commands through `resolve-strike.ts` and checks the three things a strike does to a gauge: a damaging hit starts the target's hit reaction (the
 * tick is halved for 15 steps unless its monster row says otherwise), a hit of the ATB class pushes a gauge back and closes the menu it had
 * open (`apply_atb_damage`), and a hit with a magic-cancel chance aborts a cast on the bar (`magic_cancel`). **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFX2CommandRecord } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEP_MS, isReady } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AbilityRegistry, AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { Ffx2AtbState } from '../../src/battle/ffx2/kernel/atb-gauge.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { COMMAND_RECORDS_ENEMIES } from '../../src/data/ffx2/command-records/enemies.ts';

const SLOW_ROW = COMMAND_RECORDS_ENEMIES['x2-redoubt-left-slow'] as FFX2CommandRecord; // damage class 4 (ATB), formula 4 (a percent of the target's CURRENT wait), power 16, a cast cost of 90
// Every monster row costs 100 to recover from (as most of the game's monster rows do), so the monster hits once and then waits 100 * 10000 / (60 + 1) units.
const base: Omit<FFX2CommandRecord, 'id'> = {
  costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0, flagsDamage: 0x5, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, killer: 0,
};
const abilityOf = (id: string, rec: FFX2CommandRecord): AbilityDef => ({
  id, name: id, game: 'ffx2', category: 'enemy', mpCost: 0, power: 16, formula: 'strength', damageType: 'physical', element: ['none'],
  targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [], flags: [], canMiss: false, ffx2Record: rec,
});
const RECORDS: Record<string, FFX2CommandRecord> = {
  'zz-hit': { ...base, id: 0x7001 }, // a plain physical hit, no cost
  'zz-delay': { ...base, id: 0x7002, damageClass: 4, flagsDamage: 0, flagsMisc: 0x1000 }, // a weak Delay: ATB damage of exactly 4,000 units (formula 0x18 reads the rom's delay count)
  'zz-slow': { ...SLOW_ROW, id: 0x7005, costCast: 0, costAtb: 100, status2: {}, statusTime: {} }, // the monsters' Slow without the status or the cast: ATB damage = the target's current wait x 16 / 16
  'zz-cancel': { ...base, id: 0x7003, magicCancel: 100 }, // a hit that always cancels a cast on the bar
  'zz-cast': { ...base, id: 0x7004, costAtb: 50, costCast: 100, flagsDamage: 0, damageClass: 0, power: 0 }, // a girl's cast: 100 / (AGI + 1) of charge and 50 / (AGI + 1) of recovery, nothing else
};
const registry: AbilityRegistry = { get: (id) => (RECORDS[id] === undefined ? undefined : abilityOf(id, RECORDS[id] as FFX2CommandRecord)) };

let monsterPlays = 'zz-hit';
registerAiScript({
  id: 'zz-interrupt',
  decide: (ctx) => ({ kind: 'ability', id: monsterPlays, targets: [ctx.party()[0]?.id ?? ''] }) as Command,
} satisfies AiScript);

interface Rig {
  engine: FFX2Engine;
  u(id: string): Ffx2Unit;
}

/** One monster (`special` is its row's special-flag word: bit 1 = hit reactions do not slow it), three girls; everyone far from ready. */
function rig(special: number): Rig {
  const m0 = enemy('m0', 'M0', 'zz-interrupt', { agi: 60, hp: 9_999_999, maxHp: 9_999_999, str: 200, def: 0 }, {
    slot: 0, immunityFlags: [], flags: {},
    ffx2Record: { row: 0, table: 1, acc: 95, resist1: {}, resist2: {}, special, species: 0, zantetsu: 0, stealByte: 0, stealGil: 0, steal: [0, 0, 0, 0], bribe: [0, 0, 0, 0] },
  });
  const engine = new FFX2Engine({ abilities: registry, minigames: false });
  engine.init({ ...setup(group('zz-interrupt', [m0]), { seed: 1, level: 40 }), condition: 'scripted' });
  const state = engine.state();
  const u = (id: string): Ffx2Unit => (state.combatants as Record<string, Ffx2Unit>)[id] as Ffx2Unit;
  for (const id of ['yuna', 'rikku', 'paine', 'm0']) {
    u(id).gauge.state = Ffx2AtbState.Recover;
    u(id).gauge.thinking = 0;
    u(id).atb.recovery = 90_000;
  }
  return { engine, u };
}

/** The monster is ready: one step later it plays `monsterPlays` at Yuna. */
function monsterAboutToAct(r: Rig): void {
  r.u('m0').atb.recovery = 10;
}

describe('a damaging hit starts a hit reaction', () => {
  // Re-parity RC9 lane X2-A, slice 1 (FFX-2 only; reason "game-code parity", note FFX2-G01 section 7 and the live game of 2026-10-13, question Q1): the halving lasts as long as the
  // girl's own flinch, her damage clip plus one step (Yuna's here, 30 frames: 31 steps), where it was a flat 15 (the figure read off a Hasted Rikku, 28 frames at twice the speed, 14 + 1).
  // With the switch off (`CHAIN_WINDOW_PER_BODY`) this test passes as it stood: 15.
  it('a girl who is hit has her tick halved (95 -> 47) for her reaction (her clip plus one step, 31 here), then it is 95 again', () => {
    monsterPlays = 'zz-hit';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    monsterAboutToAct(r);
    const hp = yuna.hp;
    r.engine.tick(STEP_MS);
    expect(yuna.hp).toBeLessThan(hp); // the hit landed
    expect(yuna.gauge.hitReaction).toBe(31);
    const ticks: number[] = [];
    for (let i = 0; i < 32; i++) {
      r.engine.tick(STEP_MS);
      ticks.push(yuna.gauge.speeds.tick);
    }
    expect(ticks).toEqual([...new Array<number>(31).fill(47), 95]);
  });

  it('a monster whose row says its reaction does not slow it still flinches (the counter runs) but keeps its tick; one whose row does not, halves', () => {
    for (const [special, expected] of [[0x183, 95], [0x98, 47]] as const) {
      monsterPlays = 'zz-hit';
      const r = rig(special);
      r.u('yuna').atb.recovery = -5; // her menu is open: the engine hands it out on the next decision
      r.u('yuna').gauge.state = Ffx2AtbState.WaitCommand;
      const d = r.engine.nextDecision();
      expect(d.kind).toBe('player-input');
      r.engine.submit({ kind: 'ability', id: 'zz-hit', targets: ['m0'] } as Command);
      expect(r.u('m0').gauge.hitReaction).toBe(15);
      r.engine.tick(STEP_MS);
      expect(r.u('m0').gauge.speeds.tick, `special 0x${special.toString(16)}`).toBe(expected);
    }
  });
});

describe('a hit of the ATB class pushes a gauge back and closes a menu (apply_atb_damage)', () => {
  it('Yuna, ready with her menu open, is knocked back by a weak Delay to exactly 4,000 units (the measured figure) and is no longer ready', () => {
    monsterPlays = 'zz-delay';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    yuna.atb.recovery = -10;
    yuna.gauge.state = Ffx2AtbState.WaitCommand;
    expect(isReady(yuna)).toBe(true);
    monsterAboutToAct(r);
    r.engine.tick(STEP_MS);
    expect(isReady(yuna)).toBe(false);
    expect(yuna.gauge.state === Ffx2AtbState.Idle || yuna.gauge.state === Ffx2AtbState.Recover).toBe(true);
    expect(yuna.atb.recovery).toBe(4000); // the running game set a ready girl's counter to exactly 4,000 (research/re-ffx2-timing-measured.md section 5)
    expect(yuna.gauge.recoveryMax).toBeGreaterThanOrEqual(yuna.atb.recovery);
  });

  it('the monsters\' Slow row (the ATB class, formula 4) delays a girl by her CURRENT wait: 5,000 left becomes about 10,000', () => {
    monsterPlays = 'zz-slow';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    yuna.atb.recovery = 5000;
    yuna.gauge.recoveryMax = 18_000;
    yuna.gauge.state = Ffx2AtbState.Recover;
    monsterAboutToAct(r);
    r.engine.tick(STEP_MS);
    // 5,000 less this step's tick (95) is what the pool held when the monster's command resolved; the hit adds that much again.
    expect(yuna.atb.recovery).toBeGreaterThan(9500);
    expect(yuna.atb.recovery).toBeLessThanOrEqual(10_000);
  });

  it('...and a girl with nothing left to wait (her current wait is 0) is not moved: she stays ready with her menu open', () => {
    monsterPlays = 'zz-slow';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    yuna.atb.recovery = -10;
    yuna.gauge.state = Ffx2AtbState.WaitCommand;
    monsterAboutToAct(r);
    r.engine.tick(STEP_MS);
    expect(yuna.gauge.state).toBe(Ffx2AtbState.WaitCommand);
    expect(isReady(yuna)).toBe(true);
  });

  it('a plain hit leaves the open menu alone', () => {
    monsterPlays = 'zz-hit';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    yuna.atb.recovery = -10;
    yuna.gauge.state = Ffx2AtbState.WaitCommand;
    monsterAboutToAct(r);
    r.engine.tick(STEP_MS);
    expect(yuna.gauge.state).toBe(Ffx2AtbState.WaitCommand);
    expect(isReady(yuna)).toBe(true);
  });
});

describe('a hit with a magic-cancel chance aborts a cast on the bar (magic_cancel)', () => {
  it('Yuna is charging a cast when the Giant\'s cancelling hit lands: the charge is gone and she recovers by that command\'s own ATB cost', () => {
    monsterPlays = 'zz-cancel';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    yuna.atb.recovery = -10;
    yuna.gauge.state = Ffx2AtbState.WaitCommand;
    const d = r.engine.nextDecision();
    expect(d.kind).toBe('player-input');
    r.engine.submit({ kind: 'ability', id: 'zz-cast', targets: ['m0'] } as Command);
    expect(yuna.atb.charging).not.toBeNull(); // 100 / (AGI + 1) of charge: far more than one step
    monsterAboutToAct(r);
    r.engine.tick(STEP_MS);
    expect(yuna.atb.charging).toBeNull();
    expect(yuna.pendingCommand ?? null).toBeNull();
    expect(yuna.gauge.state === Ffx2AtbState.Idle || yuna.gauge.state === Ffx2AtbState.Recover).toBe(true);
    // The recovery is the CANCELLED command's cost (50), not the previous command's (the gauge held the Attack's 70 until then).
    expect(yuna.atb.recovery).toBe(Math.floor((50 * 10000) / (Math.round(yuna.stats.agi) + 1)));
  });

  it('a hit with no cancel chance leaves the cast alone', () => {
    monsterPlays = 'zz-hit';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    yuna.atb.recovery = -10;
    yuna.gauge.state = Ffx2AtbState.WaitCommand;
    r.engine.nextDecision();
    r.engine.submit({ kind: 'ability', id: 'zz-cast', targets: ['m0'] } as Command);
    monsterAboutToAct(r);
    r.engine.tick(STEP_MS);
    expect(yuna.atb.charging).not.toBeNull();
  });
});

describe('Defense lasts until the recovery that follows it ends (MsResetDefenseStatus)', () => {
  it('a girl who defended keeps the status through her recovery and loses it in the step the recovery ends', () => {
    monsterPlays = 'zz-hit';
    const r = rig(0x183);
    const yuna = r.u('yuna');
    applyStatus(yuna, { status: 'defend', chance: 255, duration: 0 }, yuna.id);
    expect(yuna.statuses['defend']).toBeDefined();
    yuna.atb.recovery = 100; // 100 -> 5 after one step (still recovering), 5 -> -90 after two (done)
    const first = r.engine.tick(STEP_MS);
    expect(yuna.statuses['defend']).toBeDefined();
    expect(first.some((e) => e.type === 'status-remove' && (e as { status?: string }).status === 'defend')).toBe(false);
    const second = r.engine.tick(STEP_MS);
    expect(yuna.statuses['defend']).toBeUndefined();
    expect(second.some((e) => e.type === 'status-remove' && (e as { status?: string }).status === 'defend')).toBe(true);
  });
});
