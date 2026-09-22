/**
 * **Config "ATB Mode and Speed": Slow / Normal / Fast.** FFX-2 only.
 *
 * `research/ffx2-combat-core.md` §1.2 `tickRate()`: the Config speed
 * multiplies the global tick rate by `0.53 / 0.71` (Slow, 0.746x), `1`
 * (Normal) or `0.53 / 0.42` (Fast, 1.262x) — derived from §2.8's
 * status-duration constants. The setting is an FFX-2 Config entry
 * (`research/ffx-vs-ffx2-presentation.md:278`); FFX's CTB has no tick rate.
 *
 * What the lever scales is `docs/plans/ffx2-active-menu-review.md` §6: the
 * one global game clock — every gauge, every status clock, §1.7's chain
 * windows, the AI's clocks — runs faster or slower against real time, as one.
 * The fight in game time is the same fight; only the real time a player gets
 * per game second changes. Elapsed battle time stays real milliseconds.
 * Normal being byte-identical is `ffx2-atb-golden.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ATB_SPEED_MULTIPLIER, CHAIN_WINDOW_TICKS, type AtbSpeed } from '../../src/battle/ffx2/constants.ts';
import type { CombatantId } from '../../src/battle/common/types.ts';
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
function holdTheBoss(engine: FFX2Engine): { chainWindowTicks: number } {
  const boss = engine.state().combatants[engine.state().enemyIds[0]!] as unknown as { chainWindowTicks: number };
  boss.chainWindowTicks = CHAIN_WINDOW_TICKS;
  return boss;
}

describe('the Config ATB speed multipliers are the research’s own (§1.2)', () => {
  it('Slow 0.53/0.71, Normal exactly 1, Fast 0.53/0.42', () => {
    expect(ATB_SPEED_MULTIPLIER.slow).toBe(0.53 / 0.71);
    expect(ATB_SPEED_MULTIPLIER.normal).toBe(1);
    expect(ATB_SPEED_MULTIPLIER.fast).toBe(0.53 / 0.42);
    expect(ATB_SPEED_MULTIPLIER.slow).toBeCloseTo(0.746, 3);
    expect(ATB_SPEED_MULTIPLIER.fast).toBeCloseTo(1.262, 3);
  });

  it('defaults to Normal', () => {
    expect(new FFX2Engine().atbSpeed()).toBe('normal');
  });
});

describe('what the lever scales', () => {
  for (const speed of ['slow', 'normal', 'fast'] as const) {
    it(`${speed}: one real second is ${ATB_SPEED_MULTIPLIER[speed]} x 3000 game ticks, and one real second of elapsed time`, () => {
      const { engine } = atMenu(speed);
      holdTheBoss(engine);
      const ticks0 = engine.state().ticks;
      const ms0 = engine.gaugeSnapshot().elapsedMs;
      for (let i = 0; i < 10; i++) engine.tick(50, { throughInput: true });
      expect(engine.state().ticks - ticks0).toBeCloseTo(1500 * ATB_SPEED_MULTIPLIER[speed], 6);
      expect(engine.gaugeSnapshot().elapsedMs - ms0).toBeCloseTo(500, 6);
    });
  }

  it('the chain window runs on the same global clock — 2 s at Normal, 2 / multiplier real seconds otherwise', () => {
    for (const speed of ['slow', 'normal', 'fast'] as const) {
      const { engine } = atMenu(speed);
      const boss = holdTheBoss(engine);
      for (let i = 0; i < 10; i++) engine.tick(50, { throughInput: true });
      expect(boss.chainWindowTicks).toBeCloseTo(CHAIN_WINDOW_TICKS - 1500 * ATB_SPEED_MULTIPLIER[speed], 6);
    }
  });

  it('is the same fight in game time: at zero decision time every speed wins the same chapter 4 and 5 seeds', () => {
    for (const seed of [1, 2, 3, 7, 42]) {
      for (const speed of ['slow', 'fast'] as const) {
        expect(driveChapter4(seed, 0, { atbSpeed: speed }).outcome, `ch4 ${speed} ${seed}`).toBe('victory');
        expect(driveChapter5(seed, 0, { atbSpeed: speed }).outcome, `ch5 ${speed} ${seed}`).toBe('victory');
      }
    }
  }, 60_000);

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

  it('setAtbSpeed changes the rate mid-battle, from the next tick', () => {
    const { engine } = atMenu();
    holdTheBoss(engine);
    const t0 = engine.state().ticks;
    engine.tick(100, { throughInput: true });
    const normal = engine.state().ticks - t0;
    engine.setAtbSpeed('fast');
    expect(engine.atbSpeed()).toBe('fast');
    const t1 = engine.state().ticks;
    engine.tick(100, { throughInput: true });
    expect(engine.state().ticks - t1).toBeCloseTo(normal * ATB_SPEED_MULTIPLIER.fast, 6);
  });

  it('survives init, so a chained chapter keeps it across links', () => {
    const { engine } = atMenu('slow');
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!;
    engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 8, condition: 'normal', canEscape: false });
    expect(engine.atbSpeed()).toBe('slow');
  });
});
