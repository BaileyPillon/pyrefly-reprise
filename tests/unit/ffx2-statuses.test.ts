/**
 * X-2 status semantics [research/ffx2-combat-core.md §2.8, §2.6a].
 *
 * The rule this file exists to enforce: **the two engines share status ids and
 * nothing else** (`docs/CONTRACTS.md`, engine agents). In X-2, Haste is a x1.05
 * tick rate rather than FFX's halved CTB recovery, Berserk is x1.25 rather than
 * x1.5, Regen pays ~3% of max HP on a real-time interval rather than on every
 * unit's turn boundary, and duration is an integer `durationValue` converted at
 * 0.53 s per unit rather than a count of the victim's own turns.
 */

import { describe, expect, it } from 'vitest';
import {
  advanceStatuses,
  applyStatus,
  canAct,
  clearAfterBattle,
  DISPEL_REMOVES,
  durationToTicks,
  ESUNA_CURES,
  FFX2Engine,
  INFINITE_STATUSES,
  PERSISTS_AFTER_BATTLE,
  removeStatus,
  REGEN_FRACTION,
  POISON_FRACTION,
  statLevel,
  hitProbability,
  statusProbability,
  STATUS_TICK_INTERVAL_TICKS,
  TICKS_PER_DURATION_UNIT,
  ticksUntilStatusEvent,
} from '../../src/battle/ffx2/index.ts';
import type { EventDraft, Ffx2Unit } from '../../src/battle/ffx2/index.ts';
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
  };
}

describe('duration is an integer value, converted at 0.53 s per unit', () => {
  it('reproduces the sheet’s own anchor: durationValue 20 -> 10.6 s', () => {
    // Which is exactly how long an in-game Hero Drink's Invincible lasts.
    expect(TICKS_PER_DURATION_UNIT).toBeCloseTo(1590, 5);
    const ticks = durationToTicks(20);
    expect(ticks).toBe(31800);
    expect((ticks ?? 0) / 3000).toBeCloseTo(10.6, 5);
  });

  it('converts the published duration values', () => {
    // §2.8: Sleep 97 -> 51.4 s; Berserk/Confuse 133 -> 70.5 s; Slow 100 -> 53.0 s.
    expect((durationToTicks(97) ?? 0) / 3000).toBeCloseTo(51.4, 1);
    expect((durationToTicks(133) ?? 0) / 3000).toBeCloseTo(70.5, 1);
    expect((durationToTicks(100) ?? 0) / 3000).toBeCloseTo(53.0, 1);
  });

  it('treats a duration of 0 as infinite', () => {
    expect(durationToTicks(0)).toBeNull();
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
    const u = unit();
    const instance = applyStatus(u, { status: 'poison', chance: 254, duration: 100 });
    expect(instance?.ticksRemaining).toBeNull();
    expect(instance?.permanent).toBe(true);
    advanceStatuses(u, 3000 * 600, () => {});
    expect(u.statuses.poison).toBeDefined();
  });

  it('expires a timed status and emits `status-remove` with reason `expired`', () => {
    const u = unit();
    applyStatus(u, { status: 'haste', chance: 254, duration: 50 }); // 26.5 s
    const events: EventDraft[] = [];
    advanceStatuses(u, 3000 * 20, (e) => events.push(e));
    expect(u.statuses.haste).toBeDefined();
    expect(events.some((e) => e.type === 'status-tick')).toBe(true);

    advanceStatuses(u, 3000 * 10, (e) => events.push(e));
    expect(u.statuses.haste).toBeUndefined();
    const removed = events.find((e) => e.type === 'status-remove') as
      | Extract<BattleEvent, { type: 'status-remove' }>
      | undefined;
    expect(removed?.reason).toBe('expired');
  });

  it('drains x2.0 slower on a Slowed unit and x0.95 faster on a Hasted one', () => {
    const slowed = unit();
    applyStatus(slowed, { status: 'slow', chance: 254, duration: 1000 });
    applyStatus(slowed, { status: 'protect', chance: 254, duration: 50 });
    const normal = unit();
    applyStatus(normal, { status: 'protect', chance: 254, duration: 50 });

    advanceStatuses(slowed, 3000 * 30, () => {});
    advanceStatuses(normal, 3000 * 30, () => {});
    // 26.5 s of Protect: gone after 30 s at normal speed; the Slowed unit's
    // remaining duration drains at half rate, so 53 s of wall clock for her.
    expect(normal.statuses.protect).toBeUndefined();
    expect(slowed.statuses.protect).toBeDefined();
  });
});

describe('Regen and Poison [§2.3]', () => {
  it('both move ~3% of max HP per interval', () => {
    expect(REGEN_FRACTION).toBe(0.03);
    expect(POISON_FRACTION).toBe(0.03);
  });

  it('Poison damages and Regen heals, in units of 3% max HP', () => {
    const poisoned = unit(1000);
    applyStatus(poisoned, { status: 'poison', chance: 254, duration: 0 });
    expect(advanceStatuses(poisoned, STATUS_TICK_INTERVAL_TICKS, () => {})).toBe(30);

    const regen = unit(1000);
    applyStatus(regen, { status: 'regen', chance: 254, duration: 50 });
    expect(advanceStatuses(regen, STATUS_TICK_INTERVAL_TICKS, () => {})).toBe(-30);
  });

  it('is inert while Stopped — Stop freezes both tickers', () => {
    const u = unit(1000);
    applyStatus(u, { status: 'poison', chance: 254, duration: 0 });
    applyStatus(u, { status: 'stop', chance: 254, duration: 100 });
    expect(advanceStatuses(u, STATUS_TICK_INTERVAL_TICKS * 4, () => {})).toBe(0);
  });

  it('accumulates partial intervals rather than dropping them', () => {
    const u = unit(1000);
    applyStatus(u, { status: 'poison', chance: 254, duration: 0 });
    const half = STATUS_TICK_INTERVAL_TICKS / 2;
    expect(advanceStatuses(u, half, () => {})).toBe(0);
    expect(advanceStatuses(u, half, () => {})).toBe(30);
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

describe('the tick scheduler sees status work coming', () => {
  it('reports Infinity when nothing is pending', () => {
    expect(ticksUntilStatusEvent(unit())).toBe(Infinity);
  });

  it('reports the soonest expiry, scaled by Haste or Slow', () => {
    const u = unit();
    applyStatus(u, { status: 'protect', chance: 254, duration: 100 });
    const plain = ticksUntilStatusEvent(u);
    applyStatus(u, { status: 'haste', chance: 254, duration: 1000 });
    expect(ticksUntilStatusEvent(u)).toBeLessThan(plain);
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
