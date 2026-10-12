/**
 * X-2 status semantics [research/ffx2-combat-core.md §2.8, §2.6a; research/re-ffx2-atb-status.md §6].
 *
 * The rule this file exists to enforce: **the two engines share status ids and
 * nothing else** (`docs/CONTRACTS.md`, engine agents). In X-2, Haste is the
 * Config speed x21/20 (95 -> 99 units a logic step), Slow halves it, Berserk is
 * x1.25 rather than x1.5, Regen pays max HP / 32 every 16,000 units on its own
 * random phase rather than on every unit's turn boundary, and a duration is a
 * COUNTER of 1,500 units (Doom 10,000) that the character's speed pays, not a
 * count of the victim's own turns.
 *
 * **Re-parity W4 (2026-10-10; FFX-2 only, reason "game-code parity").** The clocks are the game's: `status-clock.ts` runs
 * `MsStatusProcess` once per logic step. The old tests converted a duration at 0.53 s a unit and ticked a 3,000-a-second clock
 * with a 3% payout; they are replaced by the same questions asked of the game's counters. The hand-worked step counts are in
 * `parity-ffx2-engine-atb-hand.test.ts`; the generated proof against the kernels is `parity-ffx2-engine-atb.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import {
  advanceStatusClocks,
  applyStatus,
  canAct,
  clearAfterBattle,
  DISPEL_REMOVES,
  ESUNA_CURES,
  FFX2Engine,
  INFINITE_STATUSES,
  newGauge,
  PERSISTS_AFTER_BATTLE,
  removeStatus,
  statLevel,
  hitProbability,
  statusProbability,
  stepsUntilNextEvent,
} from '../../src/battle/ffx2/index.ts';
import type { EventDraft, Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { freshSpeeds } from '../../src/battle/ffx2/atb-engine.ts';
import type { ResolveContext } from '../../src/battle/ffx2/resolve-hp.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import type { AbilityDef, BattleEvent } from '../../src/battle/common/types.ts';

function unit(maxHp = 1000): Ffx2Unit {
  return {
    id: 'u', name: 'u', side: 'party', spriteKey: 'u',
    stats: { hp: maxHp, mp: 100, str: 1, def: 0, mag: 1, mdef: 0, agi: 50, luck: 1, eva: 0, acc: 0, maxHp, maxMp: 100 },
    hp: maxHp, mp: 100, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [],
    controller: 'player', alive: true, removed: false, slot: 0, flags: {},
    level: 24,
    atb: { ticks: 0, required: 10000, gauge: 0, charging: null, recovery: 0 },
    accessories: [], chainCount: 0, chainWindowTicks: 0,
    gauge: newGauge(0),
  };
}

/**
 * Run the game's status process on one unit for `steps` logic steps at the Normal speed, the speeds as the ATB process would
 * have written them just before it each step. Returns the HP the unit lost (negative when Regen healed it).
 */
function runSteps(u: Ffx2Unit, steps: number, emit: (e: EventDraft) => void = () => {}): number {
  const before = u.hp;
  const ctx: ResolveContext = { units: [u], abilities: { get: () => undefined }, rng: new SeededRng(1), emit, breaksDamageLimit: () => false };
  for (let i = 0; i < steps; i++) {
    u.gauge.speeds = freshSpeeds(u, 95, false);
    advanceStatusClocks([u], emit, ctx);
  }
  return before - u.hp;
}

describe('a duration is a counter of the game\'s units (1,500 a count, Doom 10,000), loaded when the status lands', () => {
  it('a timed status takes the command\'s amount as its counter: Shell with 20 is 20 counts = 30,000 units, nothing banked yet', () => {
    const u = unit();
    const shell = applyStatus(u, { status: 'shell', chance: 254, duration: 20 });
    expect(shell?.counter).toBe(20);
    expect(shell?.accumulator).toBe(0);
    expect(shell?.ticksRemaining).toBe(20 * 1500);
  });

  it('the counter is held to 1..125 (the game\'s byte); an application with no amount is "until cured" and has no clock', () => {
    const u = unit();
    expect(applyStatus(u, { status: 'protect', chance: 254, duration: 500 })?.counter).toBe(125);
    const v = unit();
    const forever = applyStatus(v, { status: 'protect', chance: 254, duration: 0 });
    expect(forever?.counter).toBeUndefined();
    expect(forever?.ticksRemaining).toBeNull();
  });

  it('Sleep, Confusion and Berserk keep their own timers whatever the command said: 150,000, 200,000 and 200,000 units', () => {
    const u = unit();
    expect(applyStatus(u, { status: 'sleep', chance: 254, duration: 97 })?.ticksRemaining).toBe(150_000);
    expect(applyStatus(u, { status: 'confuse', chance: 254, duration: 5 })?.ticksRemaining).toBe(200_000);
    expect(applyStatus(u, { status: 'berserk', chance: 254, duration: 133 })?.ticksRemaining).toBe(200_000);
  });

  it('Doom counts in 10,000s and sits on its last count until the unit is KO\'d', () => {
    const u = unit();
    const doom = applyStatus(u, { status: 'doom', chance: 254, duration: 5 });
    expect(doom?.counter).toBe(5);
    expect(doom?.ticksRemaining).toBe(5 * 10_000);
  });
});

describe('infinite statuses never expire', () => {
  it('covers the whole published `Infinite` list', () => {
    for (const id of ['poison', 'darkness', 'silence', 'petrify', 'curse', 'pointless', 'itchy', 'auto-life', 'spellspring'] as const) {
      expect(INFINITE_STATUSES).toContain(id);
    }
    // Every Up/Down stack is Infinite too.
    for (const id of ['str-up', 'mag-down', 'accu-up', 'luck-down'] as const) {
      expect(INFINITE_STATUSES).toContain(id);
    }
  });

  it('applies them with no remaining ticks and survives a long clock', () => {
    const u = unit(1_000_000);
    const instance = applyStatus(u, { status: 'darkness', chance: 254, duration: 100 });
    expect(instance?.ticksRemaining).toBeNull();
    expect(instance?.permanent).toBe(true);
    runSteps(u, 3000 * 600 / 100); // 18,000 steps, well past any timer
    expect(u.statuses.darkness).toBeDefined();
  });

  it('expires a timed status and emits `status-remove` with reason `expired` (Haste with 50 counts: 75,000 units at 99 a step = 758 steps)', () => {
    const u = unit();
    applyStatus(u, { status: 'haste', chance: 254, duration: 50 });
    const events: EventDraft[] = [];
    runSteps(u, 700, (e) => events.push(e));
    expect(u.statuses.haste).toBeDefined();
    expect(events.some((e) => e.type === 'status-tick')).toBe(true);

    runSteps(u, 100, (e) => events.push(e));
    expect(u.statuses.haste).toBeUndefined();
    const removed = events.find((e) => e.type === 'status-remove') as
      | Extract<BattleEvent, { type: 'status-remove' }>
      | undefined;
    expect(removed?.reason).toBe('expired');
  });

  it('drains at half rate on a Slowed unit (47 a step against 95)', () => {
    const slowed = unit();
    applyStatus(slowed, { status: 'slow', chance: 254, duration: 125 });
    applyStatus(slowed, { status: 'protect', chance: 254, duration: 50 });
    const normal = unit();
    applyStatus(normal, { status: 'protect', chance: 254, duration: 50 });

    runSteps(slowed, 800);
    runSteps(normal, 800);
    // 50 counts = 75,000 units: gone after 790 steps at 95 a step; the Slowed unit has paid only 800 x 47 = 37,600.
    expect(normal.statuses.protect).toBeUndefined();
    expect(slowed.statuses.protect).toBeDefined();
  });
});

describe('Regen and Poison [research/re-ffx2-atb-status.md §6]', () => {
  it('both move (8 x max HP) >> 8 = max HP / 32 every 16,000 units, on their own phase', () => {
    const poisoned = unit(1000);
    applyStatus(poisoned, { status: 'poison', chance: 254, duration: 0 });
    expect(runSteps(poisoned, 169)).toBe(31); // phase 0: 16,001 units = 169 steps at 95

    const regen = unit(1000);
    regen.hp = 400;
    applyStatus(regen, { status: 'regen', chance: 254, duration: 50 });
    expect(runSteps(regen, 169)).toBe(-31);
  });

  it('is inert while Stopped: Stop freezes both tickers', () => {
    const u = unit(1000);
    applyStatus(u, { status: 'poison', chance: 254, duration: 0 });
    applyStatus(u, { status: 'stop', chance: 254, duration: 100 });
    expect(runSteps(u, 169 * 4)).toBe(0);
  });

  it('accumulates partial intervals rather than dropping them', () => {
    const u = unit(1000);
    applyStatus(u, { status: 'poison', chance: 254, duration: 0 });
    expect(runSteps(u, 84)).toBe(0);
    expect(runSteps(u, 85)).toBe(31);
  });
});

describe('application rules', () => {
  it('refuses to re-apply a non-stacking status already present', () => {
    const u = unit();
    expect(applyStatus(u, { status: 'protect', chance: 254, duration: 100 })).not.toBeNull();
    // §2.6: re-applying a status already on the target displays "MISS".
    expect(applyStatus(u, { status: 'protect', chance: 254, duration: 100 })).toBeNull();
  });

  it('stacks the Up/Down levels to a ceiling of 10', () => {
    const u = unit();
    applyStatus(u, { status: 'str-up', chance: 254, duration: 0, stacks: 4 });
    expect(statLevel(u, 'str-up')).toBe(4);
    applyStatus(u, { status: 'str-up', chance: 254, duration: 0, stacks: 4 });
    expect(statLevel(u, 'str-up')).toBe(8);
    applyStatus(u, { status: 'str-up', chance: 254, duration: 0, stacks: 9 });
    expect(statLevel(u, 'str-up')).toBe(10);
    expect(applyStatus(u, { status: 'str-up', chance: 254, duration: 0, stacks: 1 })).toBeNull();
  });

  it('makes Haste and Slow mutually exclusive', () => {
    const u = unit();
    applyStatus(u, { status: 'slow', chance: 254, duration: 100 });
    applyStatus(u, { status: 'haste', chance: 254, duration: 50 });
    expect(u.statuses.slow).toBeUndefined();
    expect(u.statuses.haste).toBeDefined();
  });

  it('Stop also removes Sleep, Confusion and Berserk', () => {
    const u = unit();
    applyStatus(u, { status: 'sleep', chance: 254, duration: 97 });
    applyStatus(u, { status: 'confuse', chance: 254, duration: 133 });
    applyStatus(u, { status: 'berserk', chance: 254, duration: 133 });
    applyStatus(u, { status: 'stop', chance: 254, duration: 100 });
    expect(u.statuses.sleep).toBeUndefined();
    expect(u.statuses.confuse).toBeUndefined();
    expect(u.statuses.berserk).toBeUndefined();
    expect(u.statuses.stop).toBeDefined();
  });

  it('blocks acting while Asleep, Stopped or Petrified', () => {
    for (const id of ['sleep', 'stop', 'petrify'] as const) {
      const u = unit();
      applyStatus(u, { status: id, chance: 254, duration: 100 });
      expect(canAct(u), id).toBe(false);
    }
    // Silence, Curse and Itchy gate *commands*, not the ability to act.
    const silenced = unit();
    applyStatus(silenced, { status: 'silence', chance: 254, duration: 0 });
    expect(canAct(silenced)).toBe(true);
  });
});

describe('the status-infliction rule [§2.6a], the game’s own (re-parity W3; reason "game-code parity")', () => {
  // The engine used to compute three hand-written percentages (statusChanceLinear / Quartic / Sextic). The game has one
  // landing rule for every rider (kernel/statusTypes.ts statusLands: a chance byte of 255 always lands, then a resist of
  // 255 never does, 254 always, else the roll 0..100 is below chance + 5 * (attacker level - target level) - resist), and
  // the instant Death / Petrify / Eject / Zantetsu rows are decided by an accuracy formula (3 to 5 and 7) first.
  it('a rider lands when the roll (0 to 100) is below chance + 5 per level of lead - resist', () => {
    expect(statusProbability(100, 0, 20, 24)).toBeCloseTo(80 / 101, 9); // 100 - 20 levels of deficit
    expect(statusProbability(100, 50, 20, 24)).toBeCloseTo(30 / 101, 9);
    expect(statusProbability(100, 0, 99, 1)).toBe(1); // a lead of 98 levels: certain
    expect(statusProbability(20, 0, 1, 99)).toBe(0); // a deficit of 98 levels: impossible
    expect(statusProbability(0, 0, 99, 1)).toBe(0); // a chance byte of 0 is not a status at all
  });

  it('255 beats a resist of 255, 254 does not, and 100 still fails one roll in 101', () => {
    expect(statusProbability(255, 255, 1, 99)).toBe(1);
    expect(statusProbability(254, 255, 99, 1)).toBe(0);
    expect(statusProbability(254, 254, 1, 99)).toBe(1);
    expect(statusProbability(100, 0, 24, 24)).toBeCloseTo(100 / 101, 9);
  });

  /** An instant-effect row: accuracy formula `accuracyFormula` (3 Eject, 4 Death, 5 Petrify, 7 Zantetsu), power `power`, not a spell. */
  function instant(accuracyFormula: number, power: number): AbilityDef {
    return {
      id: 'x2-test-instant', name: 'Instant', game: 'ffx2', category: 'skill', mpCost: 0, power: 0, formula: 'none',
      damageType: 'other', element: [], targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [], flags: [],
      ffx2Record: { id: 0x3087, category: 9, flagsTarget: 0x433, flagsMisc: 0x6 | (accuracyFormula << 3), flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 0: 254 } },
    };
  }

  it('Death’s accuracy formula (4) is why every boss shrugs off Death: (resist+5)^2 in the denominator', () => {
    // Same caster, same power, same target level — only the resistance moves. SinirothX prints exactly this kind of
    // figure: `Resistant- Eject (12)`. Level 50 against 57, power 5, over the 128 values of (draw & 0x7f).
    const user = unit();
    user.level = 50;
    const target = (resist: number): Ffx2Unit => {
      const t = unit();
      t.side = 'enemy';
      t.level = 57;
      if (resist > 0) t.immunities['ko'] = resist;
      return t;
    };
    const death = instant(4, 5);
    expect(hitProbability(user, target(0), death)).toBeGreaterThan(0.5);
    expect(hitProbability(user, target(12), death)).toBeLessThan(0.1);
    expect(hitProbability(user, target(255), death)).toBe(0);
  });

  it('Zantetsu (accuracy formula 7, level to the sixth power) collapses against a resist of 255', () => {
    const user = unit();
    user.level = 50;
    const target = (zantetsu: number, level: number): Ffx2Unit => {
      const t = unit();
      t.side = 'enemy';
      t.level = level;
      t.enemy = {
        aiScriptId: '', formIndex: 0, forms: [], rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
        ffx2Record: { row: 0, table: 1, acc: 95, resist1: {}, resist2: {}, special: 0, species: 0, zantetsu, stealByte: 0, stealGil: 0, steal: [0, 0, 0, 0], bribe: [0, 0, 0, 0] },
      };
      return t;
    };
    const zantetsu = instant(7, 0);
    expect(hitProbability(user, target(255, 57), zantetsu)).toBeLessThan(0.01);
    expect(hitProbability(user, target(0, 20), zantetsu)).toBe(1);
  });
});

describe('after the battle', () => {
  it('keeps only the six that persist, and clears everything else', () => {
    const u = unit();
    for (const id of ['darkness', 'poison', 'silence', 'protect', 'haste', 'regen'] as const) {
      applyStatus(u, { status: id, chance: 254, duration: 100 });
    }
    clearAfterBattle(u);
    expect(u.statuses.darkness).toBeDefined();
    expect(u.statuses.poison).toBeDefined();
    expect(u.statuses.silence).toBeDefined();
    expect(u.statuses.protect).toBeUndefined();
    expect(u.statuses.haste).toBeUndefined();
    expect(u.statuses.regen).toBeUndefined();
  });

  it('publishes the Esuna and Dispel lists the item data will reference', () => {
    expect(ESUNA_CURES).toContain('petrify');
    expect(ESUNA_CURES).not.toContain('ko');
    expect(DISPEL_REMOVES).toContain('spellspring');
    expect(DISPEL_REMOVES).not.toContain('poison');
    expect(PERSISTS_AFTER_BATTLE).toHaveLength(6);
  });

  it('removeStatus reports whether anything was there', () => {
    const u = unit();
    expect(removeStatus(u, 'poison')).toBe(false);
    applyStatus(u, { status: 'poison', chance: 254, duration: 0 });
    expect(removeStatus(u, 'poison')).toBe(true);
  });
});

describe('the look-ahead sees status work coming (steps until the soonest clock event)', () => {
  it('reports Infinity when nothing is pending (a unit whose menu is open, with no status)', () => {
    const u = unit();
    u.gauge.state = 4;
    expect(stepsUntilNextEvent([u], 95)).toBe(Infinity);
  });

  it('reports the soonest expiry, sooner for a Hasted unit (99 a step) than a plain one (95)', () => {
    const u = unit();
    u.gauge.state = 4;
    applyStatus(u, { status: 'protect', chance: 254, duration: 100 });
    const plain = stepsUntilNextEvent([u], 95);
    expect(plain).toBe(Math.floor((100 * 1500) / 95)); // the whole bank of 100 counts, at the plain 95 units a step
    applyStatus(u, { status: 'haste', chance: 254, duration: 125 });
    expect(stepsUntilNextEvent([u], 95)).toBeLessThan(plain);
  });
});

describe('a whole battle runs to a decision', () => {
  it('reaches victory or defeat rather than stalling', () => {
    const engine = new FFX2Engine({ minigames: false });
    engine.init(bahamutSetup(31));
    let outcome: string | null = null;
    for (let i = 0; i < 20000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
      if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
      if (d.kind === 'resolved') continue;
      const t = d.commands.find((c) => c.command.kind === 'attack')?.validTargets[0];
      engine.submit(t ? { kind: 'attack', targets: [t] } : { kind: 'defend', targets: [] });
    }
    expect(outcome).not.toBeNull();
    // Lv 24 physicals into Def 160 is the near-worthless route the research
    // warns about, so a party that only ever Attacks is expected to lose.
    expect(['victory', 'defeat']).toContain(outcome);
    expect(engine.state().turn).toBeGreaterThan(5);
  });
});
