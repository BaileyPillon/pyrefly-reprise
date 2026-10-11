/**
 * **Config "ATB Mode and Speed": Slow / Normal / Fast.** FFX-2 only.
 *
 * Re-parity W4: the setting is the game's own table, `rom.bin`'s `ATB_speed` (`kernel/atb-clock.ts`): 70, 95 or 120 UNITS
 * come off every gauge each logic step (`research/re-ffx2-atb-status.md` section 1). The game's clock does not change:
 * a logic step is 1/29.97 s at every setting, so Fast does not run the game's clock faster, it takes more off every gauge
 * and every status clock each step (and Slow less). It used to be a multiplier of 0.746 / 1 / 1.262 on a 3,000-ticks-a-second
 * clock, derived from the status durations of a single source. Animation time is not ATB time, so the chain window (a stand-in
 * for the hit reaction, 2 s) is the same real time at every setting.
 *
 * Normal at zero decision time wins the same seeds as before: `ffx2-atb-golden.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, STEPS_PER_SECOND, baseSpeedOf, type AtbSpeed } from '../../src/battle/ffx2/index.ts';
import { CHAIN_WINDOW_TICKS } from '../../src/battle/ffx2/constants.ts';
import type { CombatantId } from '../../src/battle/common/types.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { driveChapter4, driveChapter5, ffx2Options } from './helpers/ffx2ChapterDrive.ts';

function atMenu(speed?: AtbSpeed): { engine: FFX2Engine; owner: CombatantId } {
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  const engine = new FFX2Engine(ffx2Options(speed ? { atbSpeed: speed } : {}));
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { engine, owner: d.actorId };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
  }
  throw new Error('no menu');
}

/** Chain Bahamut so he cannot act (§1.7): the clock then runs uninterrupted under the menu. */
function holdTheBoss(engine: FFX2Engine): Ffx2Unit {
  const boss = engine.state().combatants[engine.state().enemyIds[0]!] as unknown as Ffx2Unit;
  boss.chainWindowTicks = CHAIN_WINDOW_TICKS;
  return boss;
}

describe('the Config ATB speed is the game\'s table (rom.bin ATB_speed)', () => {
  it('Slow 70, Normal 95, Fast 120 units a logic step', () => {
    expect(baseSpeedOf('slow')).toBe(70);
    expect(baseSpeedOf('normal')).toBe(95);
    expect(baseSpeedOf('fast')).toBe(120);
  });

  it('defaults to Normal', () => {
    expect(new FFX2Engine().atbSpeed()).toBe('normal');
  });
});

describe('what the lever scales', () => {
  for (const speed of ['slow', 'normal', 'fast'] as const) {
    it(`${speed}: one real second is 29.97 logic steps whatever the setting, and one real second of elapsed time; the gauge falls ${baseSpeedOf(speed)} units a step`, () => {
      const { engine } = atMenu(speed);
      holdTheBoss(engine);
      const steps0 = engine.state().ticks;
      const ms0 = engine.gaugeSnapshot().elapsedMs;
      for (let i = 0; i < 10; i++) engine.tick(50, { throughInput: true });
      // 500 ms is 14.985 steps. The part of a step left over from the walk to the menu is carried too, so the call runs 14 or
      // 15 whole steps: never more than one step from the exact figure (nothing is lost or invented).
      const ran = engine.state().ticks - steps0;
      expect(Math.abs(ran - 0.5 * STEPS_PER_SECOND)).toBeLessThan(1);
      expect(engine.gaugeSnapshot().elapsedMs - ms0).toBeCloseTo(ran * (1000 / STEPS_PER_SECOND), 6);
      const unit = engine.state().combatants[engine.state().activeIds[1]!] as unknown as Ffx2Unit;
      expect(unit.gauge.speeds.tick).toBe(baseSpeedOf(speed));
    });
  }

  it('the chain window is animation time, not ATB time: 60 steps (2 s) at every setting', () => {
    for (const speed of ['slow', 'normal', 'fast'] as const) {
      const { engine } = atMenu(speed);
      const boss = holdTheBoss(engine);
      const before = boss.chainWindowTicks;
      for (let i = 0; i < 10; i++) engine.tick(50, { throughInput: true });
      expect(Math.abs(before - boss.chainWindowTicks - 0.5 * STEPS_PER_SECOND), speed).toBeLessThan(1);
    }
  });

  it('at zero decision time every speed wins the same chapter 4 and 5 seeds as Normal', () => {
    for (const seed of [1, 2, 3, 7, 42]) {
      const normal4 = driveChapter4(seed, 0).outcome;
      const normal5 = driveChapter5(seed, 0).outcome;
      for (const speed of ['slow', 'fast'] as const) {
        expect(driveChapter4(seed, 0, { atbSpeed: speed }).outcome, `ch4 ${speed} ${seed}`).toBe(normal4);
        expect(driveChapter5(seed, 0, { atbSpeed: speed }).outcome, `ch5 ${speed} ${seed}`).toBe(normal5);
      }
    }
  }, 120_000);

  it('the Wait path asks for real milliseconds: Fast waits less, Slow waits more, for the same gauge', () => {
    const waits: Record<string, number> = {};
    for (const speed of ['slow', 'normal', 'fast'] as const) {
      const { engine } = atMenu(speed);
      engine.submit({ kind: 'defend', targets: [] });
      const d = engine.nextDecision();
      expect(d.kind).toBe('waiting');
      if (d.kind === 'waiting') waits[speed] = d.nextEventMs;
    }
    expect(waits['fast']!).toBeLessThan(waits['normal']!);
    expect(waits['slow']!).toBeGreaterThan(waits['normal']!);
  });

  it('setAtbSpeed changes the units a step takes off from the next tick', () => {
    const { engine } = atMenu();
    holdTheBoss(engine);
    const unit = engine.state().combatants[engine.state().activeIds[1]!] as unknown as Ffx2Unit;
    engine.tick(100, { throughInput: true });
    expect(unit.gauge.speeds.tick).toBe(95);
    engine.setAtbSpeed('fast');
    expect(engine.atbSpeed()).toBe('fast');
    engine.tick(100, { throughInput: true });
    expect(unit.gauge.speeds.tick).toBe(120);
  });

  it('survives init, so a chained chapter keeps it across links', () => {
    const { engine } = atMenu('slow');
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!;
    engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 8, condition: 'normal', canEscape: false });
    expect(engine.atbSpeed()).toBe('slow');
  });
});
