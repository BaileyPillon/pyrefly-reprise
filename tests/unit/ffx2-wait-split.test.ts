/**
 * **FFX-2 Wait, the faithful split** (D-029 follow-up 2). FFX-2 only (AGENTS.md
 * rule 14: ATB Mode is an FFX-2 Config entry; FFX is CTB).
 *
 * `research/ffx2-combat-core.md` §1.5, Wait `[single source]`: time runs while
 * the top-level Main Command Window is open and freezes the moment any submenu
 * is entered. Bailey on the live build, which held the top level too: *"none of
 * the attacks/moves i select take place until after i select moves for all 3
 * girls then all of them go at once? is it supposed to be like that?"* Every
 * skill has a charge bar, and the next girl's top-level menu froze it.
 * `docs/plans/ffx2-wait-split-review.md`.
 *
 * Real `FFX2Engine`, real chapter data, the shipped `intendedStrategy`.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { DEFAULT_WAIT_SPLIT, FFX2Engine, clockHeldByMenu } from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { driveChapter4, driveChapter5, ffx2Options, logHash } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

function ch4(seed: number, extra: Parameters<typeof ffx2Options>[0] = {}): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', waitSplit: true, ...extra }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Run the clock until a command menu opens (or the fight ends). */
function nextMenu(engine: FFX2Engine): Input | null {
  for (let i = 0; i < 2000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    if (d.kind === 'battle-over') return null;
  }
  return null;
}

function firstMenu(engine: FFX2Engine): Input {
  const d = nextMenu(engine);
  if (!d) throw new Error('no menu opened');
  return d;
}

function pick(engine: FFX2Engine, d: Input): Command {
  const chosen = intendedStrategy(d.actorId, d.commands, engine);
  if (chosen) return chosen;
  const row = d.commands.find((c) => c.enabled)!;
  return { ...row.command, targets: row.validTargets.slice(0, 1) } as Command;
}

describe('the policy', () => {
  it('the split ships switched off (dark launch until Bailey answers A or B), and clockHeldByMenu reads it', () => {
    expect(DEFAULT_WAIT_SPLIT).toBe(false);
    expect(new FFX2Engine().waitSplit()).toBe(false);
    expect(new FFX2Engine({ waitSplit: true }).waitSplit()).toBe(true);
    // Wait with a menu open: the top level runs only with the split; a submenu always holds.
    expect(clockHeldByMenu('wait', 'yuna', 'top', true)).toBe(false);
    expect(clockHeldByMenu('wait', 'yuna', 'deep', true)).toBe(true);
    expect(clockHeldByMenu('wait', 'yuna', 'top', false)).toBe(true);
    // No menu, or Active: never held.
    expect(clockHeldByMenu('wait', null, 'deep', true)).toBe(false);
    expect(clockHeldByMenu('active', 'yuna', 'deep', true)).toBe(false);
    // The old two-argument call is the whole-menu hold.
    expect(clockHeldByMenu('wait', 'yuna')).toBe(true);
  });
});

describe('Wait + split under an open menu (chapter 4, seed 7)', () => {
  it('the top level runs the clock; a submenu holds it; back at the top it runs again', () => {
    const engine = ch4(7);
    firstMenu(engine);
    // A new menu starts held until the HUD says it is on the top list.
    expect(engine.menuLevel()).toBe('deep');
    expect(engine.clockHeld()).toBe(true);
    const t0 = engine.state().ticks;
    engine.tick(2000, { throughInput: true });
    expect(engine.state().ticks).toBe(t0);

    engine.setMenuLevel('top');
    expect(engine.clockHeld()).toBe(false);
    engine.tick(300, { throughInput: true });
    const t1 = engine.state().ticks;
    expect(t1).toBeGreaterThan(t0);

    engine.setMenuLevel('deep');
    engine.tick(3000, { throughInput: true });
    expect(engine.state().ticks).toBe(t1);

    engine.setMenuLevel('top');
    engine.tick(300, { throughInput: true });
    expect(engine.state().ticks).toBeGreaterThan(t1);
  });

  it('the level resets to held with every new owner, and survives repeat asks for the same owner', () => {
    const engine = ch4(7);
    const d = firstMenu(engine);
    engine.setMenuLevel('top');
    // nextDecision is asked again for the same open menu: still hers, still top.
    const again = engine.nextDecision();
    expect(again.kind === 'player-input' ? again.actorId : null).toBe(d.actorId);
    expect(engine.menuLevel()).toBe('top');
    engine.submit(pick(engine, d));
    firstMenu(engine);
    expect(engine.menuLevel()).toBe('deep');
  });

  it('with the split off, a top-level report changes nothing (the whole-menu hold)', () => {
    const engine = ch4(7, { waitSplit: false });
    firstMenu(engine);
    engine.setMenuLevel('top');
    const t0 = engine.state().ticks;
    engine.tick(3000, { throughInput: true });
    expect(engine.state().ticks).toBe(t0);
    engine.setWaitSplit(true);
    engine.tick(300, { throughInput: true });
    expect(engine.state().ticks).toBeGreaterThan(t0);
  });

  it('Active ignores the level: a submenu does not stop its clock', () => {
    const engine = ch4(7, { atbMode: 'active' });
    firstMenu(engine);
    engine.setMenuLevel('deep');
    const t0 = engine.state().ticks;
    engine.tick(300, { throughInput: true });
    expect(engine.state().ticks).toBeGreaterThan(t0);
  });
});

describe("Bailey's report: a chosen skill plays out while the next girl's top list is open", () => {
  /**
   * Find the moment he describes: a girl confirms a charged command and the
   * very next decision is another girl's menu. Then give that menu 3 s on its
   * top list.
   */
  function reportMoment(split: boolean): { charger: string; resolvedUnderMenu: boolean } | null {
    for (let seed = 1; seed <= 12; seed++) {
      const engine = ch4(seed, { waitSplit: split });
      for (let turn = 0; turn < 40; turn++) {
        const d = nextMenu(engine);
        if (!d) break;
        const events = engine.submit(pick(engine, d));
        const started = events.some((e) => e.type === 'action-start' && e.actorId === d.actorId);
        const finished = events.some((e) => e.type === 'action-end' && e.actorId === d.actorId);
        const next = engine.nextDecision();
        if (next.kind === 'battle-over') break;
        if (!started || finished || next.kind !== 'player-input' || next.actorId === d.actorId) continue;
        engine.setMenuLevel('top');
        const from = engine.state().log.length;
        for (let k = 0; k < 60; k++) engine.tick(50, { throughInput: true });
        const after = engine.state().log.slice(from);
        return { charger: d.actorId, resolvedUnderMenu: after.some((e) => e.type === 'action-end' && e.actorId === d.actorId) };
      }
    }
    return null;
  }

  it('split on: the first girl finishes her skill while the second reads her top list', () => {
    const moment = reportMoment(true);
    expect(moment).not.toBeNull();
    expect(moment!.resolvedUnderMenu).toBe(true);
  });

  it("split off (the live build): it waits for the second girl's answer", () => {
    const moment = reportMoment(false);
    expect(moment).not.toBeNull();
    expect(moment!.resolvedUnderMenu).toBe(false);
  });
});

describe('equivalence: the split is Active on the top list and Wait below it (byte for byte)', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    it(`chapter 5 seed ${seed}: split (D 1500, top 500) = Active D 500; split top 0 = Wait D 0`, () => {
      const split = driveChapter5(seed, 1500, { atbMode: 'wait', waitSplit: true }, undefined, 500);
      const active = driveChapter5(seed, 500, { atbMode: 'active' });
      expect(logHash(split)).toBe(logHash(active));
      expect(split.outcome).toBe(active.outcome);

      const splitZero = driveChapter5(seed, 1500, { atbMode: 'wait', waitSplit: true }, undefined, 0);
      const wait = driveChapter5(seed, 0, { atbMode: 'wait', waitSplit: false });
      expect(logHash(splitZero)).toBe(logHash(wait));
    }, 60_000);
  }

  it('chapter 4 seed 7: the same two equalities', () => {
    const split = driveChapter4(7, 1500, { atbMode: 'wait', waitSplit: true }, undefined, 500);
    const active = driveChapter4(7, 500, { atbMode: 'active' });
    expect(logHash(split)).toBe(logHash(active));
    const splitZero = driveChapter4(7, 1500, { atbMode: 'wait', waitSplit: true }, undefined, 0);
    expect(logHash(splitZero)).toBe(logHash(driveChapter4(7, 0, { atbMode: 'wait' })));
  }, 60_000);
});
