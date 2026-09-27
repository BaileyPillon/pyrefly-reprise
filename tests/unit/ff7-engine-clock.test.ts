/**
 * FF7's running clock in the engine: battle-start timers, the Turn Timer rates,
 * the three Config modes, the grace pause, and `tick` with and without a menu
 * open. FF7 only. "core" is `research/ff7-battle-core.md`.
 */

import { describe, expect, it } from 'vitest';
import {
  clockHeldByMenu,
  DEFAULT_FF7_ATB_MODE,
  gracePauseTicks,
  msToTicks,
  NORMAL_START_TOP,
  ticksToMs,
} from '../../src/battle/ff7/index.ts';
import { ATTACK_BOSS, DEFEND, newEngine, toNextMenu, u } from './helpers/ff7.ts';

describe('battle start [core §2.4]', () => {
  it('Normal formation: the highest timer is exactly 57,344 and everyone sits between 37.5% and 87.5%', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const e = newEngine(seed);
      const timers = ['cloud', 'barret', 'guard-scorpion'].map((id) => u(e, id).ff7.atb.turnTimer);
      expect(Math.max(...timers)).toBe(NORMAL_START_TOP);
      for (const t of timers) expect(t).toBeGreaterThanOrEqual(NORMAL_START_TOP - 32767);
    }
  });

  it('nobody is ready at the start, so the first decision waits', () => {
    const d = newEngine(3).nextDecision();
    expect(d.kind).toBe('waiting');
  });
});

describe('Turn Timer rates at Battle Speed 128 [core §2.3 derived table]', () => {
  it('Cloud 178, Barret 182, Guard Scorpion 182 per tick: 369, 361 and 361 ticks per full gauge', () => {
    const snap = newEngine(1).gaugeSnapshot();
    const req = Object.fromEntries(snap.bars.map((b) => [b.actorId, b.required]));
    expect(req).toEqual({ cloud: 369, barret: 361, 'guard-scorpion': 361 });
  });

  it('Battle Speed 0 fills three times as fast (Speed Value 273, core §2.1)', () => {
    const e = newEngine(1, { battleSpeed: 0 });
    const cloud = e.gaugeSnapshot().bars.find((b) => b.actorId === 'cloud');
    // [(9 + 50) * 546 / 60] = 536 per tick -> 123 ticks.
    expect(cloud?.required).toBe(123);
  });

  it('waiting reports the ms to the next fill; one tick of that length brings exactly that turn', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const e = newEngine(seed, { atbMode: 'active' });
      const d = e.nextDecision();
      if (d.kind !== 'waiting') throw new Error('expected waiting');
      const out = e.tick(d.nextEventMs);
      const bossActed = out.some((ev) => ev.type === 'turn-start' && ev.actorId === 'guard-scorpion');
      const menu = e.nextDecision().kind === 'player-input';
      expect(bossActed || menu, `seed ${seed}`).toBe(true);
    }
  });
});

describe('ticks and milliseconds [core §2.2: our estimate, 30 per second]', () => {
  it('ticksToMs rounds up so msToTicks gives back at least the ticks asked for', () => {
    for (const n of [1, 2, 15, 361, 369, 1083]) expect(msToTicks(ticksToMs(n)).ticks).toBeGreaterThanOrEqual(n);
    expect(msToTicks(1000).ticks).toBe(30);
  });
});

describe('the three modes [core §2.5]', () => {
  it('Recommended is the default (single source: wiki)', () => {
    expect(DEFAULT_FF7_ATB_MODE).toBe('recommended');
    expect(newEngine(1).ff7AtbMode()).toBe('recommended');
  });

  it('only Wait holds the clock, and only below the top command list', () => {
    expect(clockHeldByMenu('wait', true, 'deep')).toBe(true);
    expect(clockHeldByMenu('wait', true, 'top')).toBe(false);
    expect(clockHeldByMenu('wait', false, 'deep')).toBe(false);
    expect(clockHeldByMenu('recommended', true, 'deep')).toBe(false);
    expect(clockHeldByMenu('active', true, 'deep')).toBe(false);
  });

  it("the presenter's two-way view: Wait is 'wait', Recommended and Active run under a menu", () => {
    expect(newEngine(1, { atbMode: 'wait' }).atbMode()).toBe('wait');
    expect(newEngine(1, { atbMode: 'recommended' }).atbMode()).toBe('active');
    expect(newEngine(1, { atbMode: 'active' }).atbMode()).toBe('active');
  });

  it('Wait: a fresh menu opens at the top list, where time runs; a sub-menu holds every timer', () => {
    const e = newEngine(2, { atbMode: 'wait' });
    const who = toNextMenu(e);
    expect(who).not.toBeNull();
    expect(e.clockHeld()).toBe(false); // a fresh menu starts at the top list [core §2.5]
    const before = e.state().ticks;
    e.tick(100, { throughInput: true });
    expect(e.state().ticks).toBeGreaterThan(before);
    e.setMenuLevel('deep');
    expect(e.clockHeld()).toBe(true);
    const held = e.state().ticks;
    expect(e.tick(5000, { throughInput: true })).toEqual([]);
    expect(e.state().ticks).toBe(held);
  });

  it('FF7 never takes the FFX-2 setters the app duck-types (applyAtbConfig)', () => {
    const e = newEngine(1) as unknown as Record<string, unknown>;
    expect(e['setAtbMode']).toBeUndefined();
    expect(e['setAtbSpeed']).toBeUndefined();
  });
});

describe('the grace pause [core §2.5: rule single source wiki; length our estimate]', () => {
  it('is [SpeedValue / 6] ticks: 15 at the default speed', () => {
    expect(gracePauseTicks(128)).toBe(15);
    expect(gracePauseTicks(0)).toBe(45);
  });

  it('starts when a party gauge fills (Recommended and Wait), never in Active', () => {
    for (const [mode, want] of [['recommended', 15], ['wait', 15], ['active', 0]] as const) {
      const e = newEngine(4, { atbMode: mode });
      toNextMenu(e);
      expect(e.graceTicks(), mode).toBe(want);
    }
  });

  it('holds every Turn Timer while it runs, then time moves on', () => {
    const e = newEngine(4);
    toNextMenu(e);
    e.submit(DEFEND); // queued -> the grace pause starts again
    expect(e.graceTicks()).toBe(15);
    const timers = () => ['cloud', 'barret', 'guard-scorpion'].map((id) => u(e, id).ff7.atb.turnTimer);
    const before = timers();
    const ticks0 = e.state().ticks;
    e.tick(ticksToMs(10));
    expect(timers()).toEqual(before);
    expect(e.state().ticks - ticks0).toBeGreaterThanOrEqual(10);
    expect(e.graceTicks()).toBeLessThanOrEqual(5);
  });
});

describe('tick under an open menu', () => {
  it('without throughInput the clock does not run past a waiting party member', () => {
    const e = newEngine(6, { atbMode: 'active' });
    toNextMenu(e);
    const t = e.state().ticks;
    e.tick(3000);
    expect(e.state().ticks).toBe(t);
  });

  it('with throughInput (Active/Recommended) time runs, and a boss whose gauge fills acts inside the step', () => {
    const e = newEngine(6, { atbMode: 'active' });
    const owner = toNextMenu(e);
    let events: ReturnType<typeof e.tick> = [];
    for (let i = 0; i < 400 && events.length === 0; i++) events = e.tick(50, { throughInput: true });
    expect(events.some((ev) => ev.type === 'turn-start' && ev.actorId === 'guard-scorpion')).toBe(true);
    // The owner's menu is still answerable unless the boss's action KO'd them.
    if (owner && u(e, owner).alive) expect(e.inputValid(owner)).toBe(true);
    const out = e.submit(ATTACK_BOSS);
    expect(out.some((ev) => ev.type === 'turn-start')).toBe(true);
  });
});
