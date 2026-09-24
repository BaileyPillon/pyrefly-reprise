// @vitest-environment jsdom
/**
 * **FFX-2 Wait's split ships switched off, with a URL switch to try it**
 * (repair pass, 2026-09-24). FFX-2 only (AGENTS.md rule 14).
 *
 * The split (`research/ffx2-combat-core.md` §1.5) is built, but its measured
 * cost (chapters 5 and 6 harder for a player who thinks on the top list) and
 * the Wait copy it would make false are Bailey's call (D-029 follow-up 2, the
 * adversarial review in `docs/plans/ffx2-wait-split-review.md`). So the
 * default is the whole-menu hold the live build ships, `?wait=split` turns the
 * split on for a try, and `?wait=hold` pins the hold. Also covers the two
 * small pieces split out of over-cap files: `MenuWaker` and `MenuLevelRelay`.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { applyAtbMode, waitSplitFromUrl } from '../../src/app/screens/BattleScreenWiring.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { MenuWaker, followMenuLevel } from '../../src/engine/BattlePresenterActive.ts';
import { MenuLevelRelay, type MenuLevel } from '../../src/ui/ffx2/atbClockChip.ts';

/** Chapter 4, seed 7, run to its first open command menu. */
function ch4(engine: FFX2Engine): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
  for (let i = 0; i < 2000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return engine;
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
  }
  throw new Error('no menu opened');
}

/** Ticks the clock moves in 2 s of an open menu reported at the top list. */
function topListTicks(engine: FFX2Engine): number {
  engine.setMenuLevel('top');
  const t0 = engine.state().ticks;
  engine.tick(2000, { throughInput: true });
  return engine.state().ticks - t0;
}

afterEach(() => {
  history.replaceState(null, '', '/');
});

describe('the default is the live whole-menu hold', () => {
  it('a default engine under Wait holds the clock at the top list', () => {
    const engine = ch4(new FFX2Engine({ atbMode: 'wait' }));
    expect(engine.waitSplit()).toBe(false);
    expect(topListTicks(engine)).toBe(0);
  });

  it('applyAtbMode with no URL switch leaves the engine setting alone', () => {
    const engine = new FFX2Engine({ waitSplit: true });
    applyAtbMode(engine);
    expect(engine.waitSplit()).toBe(true);
  });
});

describe('?wait=split / ?wait=hold', () => {
  it('parses the switch and ignores anything else', () => {
    expect(waitSplitFromUrl('?wait=split')).toBe(true);
    expect(waitSplitFromUrl('?coach=off&wait=hold')).toBe(false);
    expect(waitSplitFromUrl('?wait=active')).toBeNull();
    expect(waitSplitFromUrl('')).toBeNull();
  });

  it('?wait=split turns the split on: the top list runs the clock, a submenu holds it', () => {
    history.replaceState(null, '', '/?wait=split');
    const engine = new FFX2Engine({ atbMode: 'wait' });
    applyAtbMode(engine);
    expect(engine.waitSplit()).toBe(true);
    expect(topListTicks(ch4(engine))).toBeGreaterThan(0);
    engine.setMenuLevel('deep');
    const t = engine.state().ticks;
    engine.tick(2000, { throughInput: true });
    expect(engine.state().ticks).toBe(t);
  });

  it('?wait=hold pins the whole-menu hold', () => {
    history.replaceState(null, '', '/?wait=hold');
    const engine = new FFX2Engine({ atbMode: 'wait', waitSplit: true });
    applyAtbMode(engine);
    expect(engine.waitSplit()).toBe(false);
    expect(topListTicks(ch4(engine))).toBe(0);
  });

  it('is a no-op for FFX', () => {
    history.replaceState(null, '', '/?wait=split');
    const engine = new FFXEngine();
    expect(() => applyAtbMode(engine)).not.toThrow();
    expect('setWaitSplit' in engine).toBe(false);
  });
});

describe('MenuWaker and followMenuLevel', () => {
  it('park resolves on wake; resumed bumps the epoch and wakes; the teardown forgets a parked menu', async () => {
    const waker = new MenuWaker();
    let woke = 0;
    void waker.park().then(() => (woke += 1));
    waker.wake();
    await Promise.resolve();
    expect(woke).toBe(1);

    void waker.park().then(() => (woke += 1));
    waker.resumed();
    await Promise.resolve();
    expect(woke).toBe(2);
    expect(waker.epoch).toBe(1);

    const levels: MenuLevel[] = [];
    let listener: ((l: MenuLevel) => void) | null = null;
    const hud = {
      onMenuLevel(l: (level: MenuLevel) => void): () => void {
        listener = l;
        return () => {
          listener = null;
        };
      },
    };
    const engine = {
      tick: () => [],
      inputValid: () => true,
      gaugeSnapshot: () => ({ elapsedMs: 0, bars: [] }),
      setMenuLevel: (l: MenuLevel) => {
        levels.push(l);
      },
    };
    const off = followMenuLevel(hud, engine, waker);
    void waker.park().then(() => (woke += 1));
    listener!('top');
    await Promise.resolve();
    expect(levels).toEqual(['top']);
    expect(woke).toBe(3);

    void waker.park().then(() => (woke += 1));
    off();
    expect(listener).toBeNull();
    waker.wake(); // the teardown cleared it: nothing parked to wake
    await Promise.resolve();
    expect(woke).toBe(3);
  });

  it('FFX (no clock engine) gets only the teardown', () => {
    const waker = new MenuWaker();
    let subscribed = false;
    const hud = {
      onMenuLevel(): () => void {
        subscribed = true;
        return () => undefined;
      },
    };
    const off = followMenuLevel(hud, null, waker);
    expect(subscribed).toBe(false);
    expect(() => off()).not.toThrow();
  });
});

describe('MenuLevelRelay', () => {
  it('drops repeats, replays the open level to a late listener, forgets it on close', () => {
    const relay = new MenuLevelRelay();
    const heard: MenuLevel[] = [];
    relay.report('top');
    const off = relay.subscribe((l) => heard.push(l));
    relay.report('top');
    relay.report('deep');
    expect(heard).toEqual(['top', 'deep']);
    off();
    relay.report('top');
    expect(heard).toEqual(['top', 'deep']);
    relay.closed();
    const late: MenuLevel[] = [];
    relay.subscribe((l) => late.push(l));
    expect(late).toEqual([]);
  });
});
