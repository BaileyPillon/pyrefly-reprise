/**
 * Re-parity W4, the engine against the game: numbers worked by hand (the generated battles of `parity-ffx2-engine-atb.test.ts`
 * prove the engine and the kernels agree everywhere; these prove the kernels' answers, written down from the game's code and
 * from what Bailey's running game showed on 2026-10-09 (`research/re-ffx2-timing-measured.md`), come out of the engine).
 *
 * Each block says where its number comes from. **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { makeFfx2Rng } from '../../src/battle/ffx2/adapt/streams.ts';
import type { AbilityDef, Command, StatusId } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEPS_PER_SECOND, STEP_MS, baseRequired, isReady } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AbilityRegistry, AiScript, Ffx2EngineOptions, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { stopStateOf, stopStateOfWord } from '../../src/battle/ffx2/atb-engine.ts';

// ---------------------------------------------------------------------------------------------------------------------
// a battle to poke at: three girls, monsters that say nothing, abilities that cost what the test says and deal nothing
// ---------------------------------------------------------------------------------------------------------------------

const noop = (costAtb: number, costCast: number, extra: Partial<AbilityDef> = {}): AbilityDef => ({
  id: `zz-hand-${costAtb}-${costCast}`, name: 'hand', game: 'ffx2', category: 'skill', mpCost: 0, power: 0, formula: 'none', damageType: 'other',
  element: ['none'], targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [], flags: [],
  ffx2Record: {
    id: 0x7000, costAtb, costCast, category: 0, flagsTarget: 0x33, flagsMisc: 0, flagsDamage: 0, damageClass: 0, formula: 0,
    critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0,
  },
  ...extra,
});
const registry: AbilityRegistry = {
  get(id) {
    const m = /^zz-hand-(\d+)-(\d+)$/.exec(id);
    return m === null ? undefined : noop(Number(m[1]), Number(m[2]));
  },
};
/** A script that picks nothing: the monster takes a flavour turn each time (it waits the standard gauge). */
const quiet: AiScript = { id: 'zz-hand-quiet', decide: () => null };
registerAiScript(quiet);

interface Battle {
  engine: FFX2Engine;
  u(id: string): Ffx2Unit;
}

function battle(over: { agis?: number[]; condition?: 'normal' | 'scripted' | 'preemptive' | 'ambush'; seed?: number; level?: number; options?: Ffx2EngineOptions } = {}): Battle {
  const agis = over.agis ?? [60];
  const enemies = agis.map((agi, i) => enemy(`m${i}`, `M${i}`, 'zz-hand-quiet', { agi, hp: 9_999_999, maxHp: 9_999_999 }, { slot: i, immunityFlags: [], flags: {} }));
  const engine = new FFX2Engine({ abilities: registry, minigames: false, ...over.options });
  engine.init({ ...setup(group('zz-hand', enemies), { seed: over.seed ?? 1, level: over.level ?? 24 }), condition: over.condition ?? 'scripted' });
  const state = engine.state();
  return { engine, u: (id) => (state.combatants as Record<string, Ffx2Unit>)[id] as Ffx2Unit };
}

/** Run `n` logic steps, one call each, handing every ready girl the command `spec` (cost pair) at the step boundary. */
function run(b: Battle, n: number, girlsDo?: (id: string) => Command | null): void {
  for (let i = 0; i < n; i++) {
    b.engine.tick(STEP_MS);
    for (let g = 0; g < 32; g++) {
      const d = b.engine.nextDecision();
      if (d.kind === 'resolved') continue;
      if (d.kind === 'player-input') {
        const c = girlsDo?.(d.actorId) ?? null;
        if (c === null) return; // the test wants this menu left open
        b.engine.submit(c);
        continue;
      }
      break;
    }
  }
}
const cmd = (costAtb: number, costCast: number, to = 'm0'): Command => ({ kind: 'ability', id: `zz-hand-${costAtb}-${costCast}`, targets: [to] });
const steps = (b: Battle): number => b.engine.state().ticks;

// ---------------------------------------------------------------------------------------------------------------------
// the clock
// ---------------------------------------------------------------------------------------------------------------------

describe('the clock is the game\'s logic step: 29.97 a second, measured on the running game', () => {
  it('60 / 1.001 / 2 steps a second; a step is 33.3667 ms', () => {
    expect(STEPS_PER_SECOND).toBeCloseTo(29.97003, 5);
    expect(STEP_MS).toBeCloseTo(33.36667, 4);
  });

  it('real milliseconds become whole steps and the remainder waits for the next call (nothing is lost or invented)', () => {
    const b = battle({ condition: 'scripted' });
    // Keep the monster out of it (an enemy that acts ends the call early and carries the rest to the next one): it sleeps for good.
    applyStatus(b.u('m0'), { status: 'sleep', chance: 255, duration: 0 });
    (b.u('m0').statuses['sleep'] as { ticksRemaining: number }).ticksRemaining = 2_000_000_000;
    b.engine.setAtbMode('active'); // the girls' menus do not hold the clock
    // 1,000 ms is 29.97 steps, ten seconds 299.7, a hundred 2,997.
    for (let s = 1; s <= 100; s++) {
      b.engine.tick(1000, { throughInput: true });
      expect(steps(b), `after ${s} s`).toBe(Math.floor(s * STEPS_PER_SECOND + 1e-6));
    }
  });
});

describe('the Config ATB speed and the status speeds are the game\'s table (rom.bin: Slow 70, Normal 95, Fast 120; Haste x21/20; Slow /2)', () => {
  const tickOf = (b: Battle, id: string): number => {
    b.engine.tick(STEP_MS);
    return b.u(id).gauge.speeds.tick;
  };

  it('a character\'s gauge falls 70, 95 or 120 units a step', () => {
    expect(tickOf(battle({ options: { atbSpeed: 'slow' } }), 'yuna')).toBe(70);
    expect(tickOf(battle({ options: { atbSpeed: 'normal' } }), 'yuna')).toBe(95);
    expect(tickOf(battle({ options: { atbSpeed: 'fast' } }), 'yuna')).toBe(120);
  });

  it('Haste is x21/20 truncated (95 -> 99, 120 -> 126), Slow halves (95 -> 47, 70 -> 35)', () => {
    const haste = battle();
    applyStatus(haste.u('yuna'), { status: 'haste', chance: 255, duration: 20 });
    expect(tickOf(haste, 'yuna')).toBe(99);
    const fastHaste = battle({ options: { atbSpeed: 'fast' } });
    applyStatus(fastHaste.u('yuna'), { status: 'haste', chance: 255, duration: 20 });
    expect(tickOf(fastHaste, 'yuna')).toBe(126);
    const slow = battle();
    applyStatus(slow.u('yuna'), { status: 'slow', chance: 255, duration: 20 });
    expect(tickOf(slow, 'yuna')).toBe(47);
    const slowSlow = battle({ options: { atbSpeed: 'slow' } });
    applyStatus(slowSlow.u('yuna'), { status: 'slow', chance: 255, duration: 20 });
    expect(tickOf(slowSlow, 'yuna')).toBe(35);
  });

  it('the stop state read straight off the unit is the kernel\'s MsStatCheckStop over the whole status word, for every mix of Sleep, Petrify and Stop', () => {
    const b = battle();
    const girl = b.u('yuna');
    for (let mask = 0; mask < 8; mask++) {
      for (const s of ['sleep', 'petrify', 'stop'] as const) delete girl.statuses[s];
      (['sleep', 'petrify', 'stop'] as const).forEach((s, i) => {
        if ((mask & (1 << i)) !== 0) girl.statuses[s] = { id: s, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
      });
      expect(stopStateOf(girl), `mask ${mask}`).toBe(stopStateOfWord(girl));
      expect(stopStateOf(girl), `mask ${mask} against the numbers`).toBe(((mask & 1) !== 0 ? 4 : 0) | ((mask & 2) !== 0 ? 2 : 0) | ((mask & 4) !== 0 ? 1 : 0));
    }
  });

  it('a Stopped, asleep or petrified unit has a speed of 0; a hit reaction halves a monster that flinches and not one that does not', () => {
    const b = battle();
    applyStatus(b.u('rikku'), { status: 'stop', chance: 255, duration: 20 });
    applyStatus(b.u('paine'), { status: 'sleep', chance: 255, duration: 0 });
    b.engine.tick(STEP_MS);
    expect(b.u('rikku').gauge.speeds.tick).toBe(0);
    expect(b.u('paine').gauge.speeds.tick).toBe(0);
    // A hit reaction halves the tick: 95 -> 47. An enemy whose row says hits do not slow it keeps 95.
    const h = battle();
    h.u('yuna').gauge.hitReaction = 15;
    h.u('m0').gauge.hitReaction = 15;
    h.u('m0').enemy = { ...(h.u('m0').enemy as NonNullable<Ffx2Unit['enemy']>), ffx2Record: { row: 0, table: 1, acc: 95, resist1: {}, resist2: {}, special: 0x2, species: 0, zantetsu: 0, stealByte: 0, stealGil: 0, steal: [0, 0, 0, 0], bribe: [0, 0, 0, 0] } };
    h.engine.tick(STEP_MS);
    expect(h.u('yuna').gauge.speeds.tick).toBe(47);
    expect(h.u('m0').gauge.speeds.tick).toBe(95);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// the gauge
// ---------------------------------------------------------------------------------------------------------------------

describe('what a command leaves behind: recovery = cost_atb x 10000 / (AGI + 1), a cast = cost_cast x 10000 / (AGI + 1)', () => {
  /** Run until a girl's menu opens (or `limit` steps), without answering it; returns whose it is (the first to open). */
  const untilMenu = (b: Battle, limit = 2000): string => {
    for (let i = 0; i < limit; i++) {
      b.engine.tick(STEP_MS);
      const d = b.engine.nextDecision();
      if (d.kind === 'player-input') return d.actorId;
    }
    throw new Error('no menu opened');
  };

  it('Attack (cost 70) at Agility A sets the recovery 70 x 10000 / (A + 1): the Giant-class and girl numbers the running game showed', () => {
    const b = battle();
    const girl = untilMenu(b);
    const agi = b.u(girl).stats.agi;
    b.engine.submit(cmd(70, 0));
    expect(b.u(girl).atb.recovery).toBe(Math.floor((70 * 10000) / (agi + 1)));
    expect(b.u(girl).gauge.recoveryMax).toBe(Math.floor((70 * 10000) / (agi + 1)));
    // Examples from the measurement: AGI 37 -> 18,421, AGI 66 -> 10,447, AGI 73 -> 9,459 (research/re-ffx2-timing-measured.md section 4).
    expect(Math.floor((70 * 10000) / 38)).toBe(18421);
    expect(Math.floor((70 * 10000) / 67)).toBe(10447);
    expect(Math.floor((70 * 10000) / 74)).toBe(9459);
  });

  it('a cast (Fire, cost_cast 70) at Agility 73 counts down 9,459 units at the full tick: 100 steps, and the recovery after it is 0', () => {
    const b = battle();
    const girl = untilMenu(b);
    const agi = b.u(girl).stats.agi;
    const cast = Math.floor((70 * 10000) / (agi + 1));
    b.engine.submit(cmd(0, 70));
    const charge = b.u(girl).atb.charging;
    expect(charge?.totalTicks).toBe(cast);
    expect(charge?.remainingTicks).toBe(cast);
    expect(b.u(girl).gauge.state).toBe(9);
    const startedAt = steps(b);
    let released = -1;
    for (let i = 0; i < 4000 && released < 0; i++) {
      b.engine.tick(STEP_MS);
      if (b.u(girl).atb.charging === null) released = steps(b) - startedAt;
    }
    expect(released).toBe(Math.ceil(cast / 95)); // the measurement: Paine's Fire, 9,459 units at AGI 73, 100 steps
    expect(Math.ceil(9459 / 95)).toBe(100);
    expect(b.u(girl).atb.recovery).toBe(0); // a spell leaves 0
    expect(b.u(girl).gauge.state).toBe(0);
  });

  it('a girl\'s wait-down gate shortens the cast the way atb_charge_time does: (100 - percent) x base / 100', () => {
    const b = battle();
    const girl = untilMenu(b);
    b.u(girl).aiMemory = { waitDown: 40 };
    const agi = b.u(girl).stats.agi;
    b.engine.submit(cmd(0, 70));
    const base = Math.floor((70 * 10000) / (agi + 1));
    expect(b.u(girl).atb.charging?.totalTicks).toBe(Math.floor((60 * base) / 100));
  });

  it('a monster thinks 30 steps for every girl who is down when its command ends (and a girl thinks none)', () => {
    const b = battle({ agis: [60], options: {} });
    run(b, 1);
    b.u('yuna').alive = false;
    b.u('paine').alive = false;
    // Make the monster take a turn: advance to its readiness.
    for (let i = 0; i < 3000 && b.u('m0').gauge.state !== 5; i++) {
      b.engine.tick(STEP_MS);
      if (b.u('rikku').gauge.state === 4) b.engine.submit(cmd(70, 0));
    }
    b.engine.nextDecision(); // the monster acts: a flavour turn
    expect(b.u('m0').gauge.thinking).toBe(60);
    expect(b.u('m0').gauge.state).toBe(0);
  });
});

describe('the opening: ((draw & 63) + 32) x full / 128, then two thirds of the smallest wait off everyone', () => {
  it('matches the arithmetic written out here, with the engine\'s own seeded draws, party first', () => {
    const b = battle({ condition: 'normal', seed: 7 });
    const rng = makeFfx2Rng(7);
    const order = ['yuna', 'rikku', 'paine', 'm0'];
    const stream = [20, 21, 22, 28]; // each unit draws on its own purpose-0 stream: a party slot + 20, the first monster slot (15) + 13
    const full = order.map((id) => Math.floor((70 * 10000) / (b.u(id).stats.agi + 1)));
    const start = order.map((_, i) => Math.floor((((rng.on(stream[i] as number).int(0, 63) & 63) + 32) * (full[i] as number)) / 128));
    const cut = Math.floor((2 * Math.min(...start)) / 3);
    order.forEach((id, i) => {
      expect(b.u(id).atb.recovery, id).toBe((start[i] as number) - cut);
      expect(b.u(id).gauge.recoveryMax, id).toBe(full[i]);
    });
  });

  it('a preemptive strike: the girls start at 0 (ready in the first step), a monster at (113 + (draw & 15)) x full / 128', () => {
    const b = battle({ condition: 'preemptive', seed: 3 });
    const rng = makeFfx2Rng(3);
    for (const s of [20, 21, 22, 28]) rng.on(s).int(0, 63); // the four opening draws, each on its own stream
    const slotStream = (slot: number): number => (slot < 15 ? slot + 20 : slot + 13);
    const draws = Array.from({ length: 31 }, (_, slot) => rng.on(slotStream(slot)).int(0, 15)); // the 31 resets, one a slot, each on its own stream
    expect(b.u('yuna').atb.recovery).toBe(0);
    expect(b.u('rikku').atb.recovery).toBe(0);
    expect(b.u('paine').atb.recovery).toBe(0);
    const full = Math.floor((70 * 10000) / (b.u('m0').stats.agi + 1));
    expect(b.u('m0').atb.recovery).toBe(Math.floor(((113 + (draws[15] as number)) * full) / 128));
    b.engine.tick(STEP_MS);
    expect(isReady(b.u('yuna')) && isReady(b.u('rikku')) && isReady(b.u('paine'))).toBe(true);
  });

  it('a continuation link of a chain opens with every wait whole and nothing trimmed', () => {
    const b = battle({ condition: 'scripted' });
    for (const id of ['yuna', 'rikku', 'paine', 'm0']) expect(b.u(id).atb.recovery, id).toBe(baseRequired(b.u(id).stats.agi));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// the status clocks
// ---------------------------------------------------------------------------------------------------------------------

describe('the status clocks: counters of 1,500 units, timers of 150,000, Poison and Regen of 16,000', () => {
  const stepsUntilGone = (b: Battle, id: string, status: StatusId): number => {
    let n = 0;
    while (b.u(id).statuses[status] !== undefined && n < 2000) {
      b.engine.tick(STEP_MS);
      n += 1;
    }
    return n;
  };

  it('Shell with 20 counts lasts 316 steps at the Normal speed (20 x 1,500 = 30,000 units at 95 a step, the note\'s worked example)', () => {
    const b = battle();
    applyStatus(b.u('m0'), { status: 'shell', chance: 255, duration: 20 });
    expect(stepsUntilGone(b, 'm0', 'shell')).toBe(316);
    expect(Math.ceil(30000 / 95)).toBe(316);
  });

  it('a Hasted unit pays its own clocks faster: Haste with 20 counts is gone after 304 steps (30,000 units at 99 a step)', () => {
    const b = battle();
    applyStatus(b.u('m0'), { status: 'haste', chance: 255, duration: 20 });
    expect(stepsUntilGone(b, 'm0', 'haste')).toBe(Math.ceil(30000 / 99));
    expect(Math.ceil(30000 / 99)).toBe(304);
  });

  it('Sleep never ends by itself at the Fast speed (150,000 / 120 lands on exactly 0), but a Hasted sleeper wakes after 1,191 steps (150,000 / 126)', () => {
    const fast = battle({ options: { atbSpeed: 'fast' } });
    applyStatus(fast.u('m0'), { status: 'sleep', chance: 255, duration: 0 });
    for (let i = 0; i < 1500; i++) fast.engine.tick(STEP_MS);
    expect(fast.u('m0').statuses['sleep']).toBeDefined();
    expect(fast.u('m0').statuses['sleep']?.ticksRemaining).toBe(0); // it lands on 0 and the game never looks at it again
    const hasted = battle({ options: { atbSpeed: 'fast' } });
    applyStatus(hasted.u('m0'), { status: 'haste', chance: 255, duration: 125 });
    applyStatus(hasted.u('m0'), { status: 'sleep', chance: 255, duration: 0 });
    let n = 0;
    while (hasted.u('m0').statuses['sleep'] !== undefined && n < 3000) {
      hasted.engine.tick(STEP_MS);
      n += 1;
    }
    expect(n).toBe(Math.floor(150000 / 126) + 1); // 1,191: the timer goes below 0 on the step after 1,190 whole payments
  });

  it('Doom with 5 counts takes 4 x 10,000 units: the victim is KO\'d at step 422 (14.08 s)', () => {
    const b = battle();
    applyStatus(b.u('m0'), { status: 'doom', chance: 255, duration: 5 });
    let n = 0;
    while (b.u('m0').alive && n < 2000) {
      b.engine.tick(STEP_MS);
      n += 1;
    }
    expect(n).toBe(422);
    expect(b.u('m0').statuses['doom']).toBeUndefined();
    expect(b.u('m0').statuses['ko']).toBeDefined();
  });

  it('Poison pays (8 x max HP) >> 8 = max HP / 32 every 16,000 units after its random first phase; Regen heals the same', () => {
    const b = battle();
    const girl = b.u('yuna');
    girl.hp = Math.floor(girl.stats.maxHp / 2);
    applyStatus(girl, { status: 'poison', chance: 255, duration: 0 });
    girl.gauge.poisonAcc = 0; // phase 0: the first payout needs 16,001 units, 169 steps at 95
    const per = (girl.stats.maxHp * 8) >>> 8;
    const hp0 = girl.hp;
    let n = 0;
    while (girl.hp === hp0 && n < 1000) {
      b.engine.tick(STEP_MS);
      n += 1;
    }
    expect(n).toBe(169);
    expect(hp0 - girl.hp).toBe(per);
  });
});

describe('Delay and the knock-out', () => {
  it('a recovering unit with 5,000 left that takes a weak Delay (4,000) has 9,000, its menu closed, and starts over from IDLE', async () => {
    const { applyDelay } = await import('../../src/battle/ffx2/atb-engine.ts');
    const b = battle();
    b.u('yuna').gauge.state = 1;
    b.u('yuna').atb.recovery = 5000;
    b.u('yuna').gauge.recoveryMax = 5000;
    expect(applyDelay(b.u('yuna'), 4000)).toBe(true);
    expect(b.u('yuna').atb.recovery).toBe(9000);
    expect(b.u('yuna').gauge.recoveryMax).toBe(9000);
    expect(b.u('yuna').gauge.state).toBe(0);
  });

  it('a Delay on a girl whose menu is open sets her counter to exactly 4,000 (the measured case: it was at the overshoot, 0 or below)', async () => {
    const { applyDelay } = await import('../../src/battle/ffx2/atb-engine.ts');
    const b = battle();
    b.u('rikku').gauge.state = 4;
    b.u('rikku').atb.recovery = -52;
    expect(applyDelay(b.u('rikku'), 4000)).toBe(true);
    expect(b.u('rikku').atb.recovery).toBe(4000);
    expect(b.u('rikku').gauge.state).toBe(0);
  });

  it('a Delay on a unit that is executing is banked and paid with its next recovery; on a cast it lengthens the cast, never cancels it', async () => {
    const { applyDelay } = await import('../../src/battle/ffx2/atb-engine.ts');
    const b = battle();
    b.u('yuna').gauge.state = 9;
    expect(applyDelay(b.u('yuna'), 4000)).toBe(false);
    expect(b.u('yuna').gauge.carry).toBe(4000);
    b.u('paine').gauge.state = 9;
    b.u('paine').atb.charging = { commandRef: cmd(0, 70), remainingTicks: 3000, totalTicks: 9000 };
    applyDelay(b.u('paine'), 4000);
    expect(b.u('paine').atb.charging?.remainingTicks).toBe(7000);
    expect(b.u('paine').atb.charging?.totalTicks).toBe(9000);
  });

  it('a knock-out drops the command in flight and sets the counter to the whole standard gauge, which a revived unit then pays (one draw)', async () => {
    const { applyHpDelta } = await import('../../src/battle/ffx2/resolve-hp.ts');
    const b = battle();
    const yuna = b.u('yuna');
    yuna.gauge.state = 9;
    yuna.atb.charging = { commandRef: cmd(0, 70), remainingTicks: 1000, totalTicks: 9000 };
    yuna.atb.recovery = -3;
    yuna.gauge.hitReaction = 9;
    const units = Object.values(b.engine.state().combatants) as Ffx2Unit[];
    const rng = makeFfx2Rng(99);
    const twin = makeFfx2Rng(99);
    // A hit that takes all her HP: the engine's own KO path.
    applyHpDelta({ units, abilities: registry, rng, emit: () => undefined, breaksDamageLimit: () => false }, yuna, yuna.hp);
    expect(yuna.alive).toBe(false);
    expect(yuna.atb.charging).toBeNull();
    expect(yuna.gauge.hitReaction).toBe(0);
    expect(yuna.gauge.state).toBe(0);
    expect(yuna.atb.recovery).toBe(Math.floor((70 * 10000) / (yuna.stats.agi + 1)));
    expect(yuna.gauge.recoveryMax).toBe(yuna.atb.recovery);
    twin.on(20).int(0, 63); // the knock-out routine's single draw, on Yuna's own purpose-0 stream (party slot 0 + 20)
    expect(rng.on(20).int(0, 63)).toBe(twin.on(20).int(0, 63));
    for (let s = 0; s < 68; s++) if (s !== 20) expect(rng.states[s], `stream ${s}`).toBe(twin.states[s]); // and no other stream moved
  });
});
