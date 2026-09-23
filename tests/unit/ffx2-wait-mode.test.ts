/**
 * **Wait mode** — FFX-2's clock stops while a command menu is open. FFX-2 only.
 *
 * Bailey, 2026-09-22 21:45 EDT (`docs/target/decisions.json` D-029, superseding
 * D-009): *"1. C Wait mode. Also I want the default to be wait mode instead of
 * active mode please."* Source: `research/ffx2-combat-core.md` §1.5, Wait row;
 * the reading built (the whole menu, top level included) and why is
 * `docs/plans/ffx2-wait-mode-review.md` §2.
 *
 * Real `FFX2Engine`, real chapter 4 data, a fake clock and the real pump. No
 * DOM, no wall clock, seeded.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import type { CombatantId, StatusId, StatusInstance } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { activeClockEngine, runActivePump, type ActiveClockEngine } from '../../src/engine/BattlePresenterActive.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';

const CH4 = 'ffx2-bahamut';

function newEngine(seed: number, extra: Partial<Ffx2EngineOptions> = {}): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID[CH4];
  if (!group) throw new Error(`${CH4} missing`);
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
    ...extra,
  });
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function runToInput(engine: FFX2Engine): CombatantId {
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d.actorId;
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    else if (d.kind === 'battle-over') throw new Error('battle ended before any menu opened');
  }
  throw new Error('no menu inside 20 000 decisions');
}

function timed(id: StatusId): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: 30_000, charges: null, stacks: 1, permanent: false };
}

/** Everything the clock can move: ticks, gauges, every status instance, the log length. */
function clockPicture(engine: FFX2Engine): string {
  const s = engine.state();
  return JSON.stringify({
    ticks: s.ticks,
    log: s.log.length,
    gauges: engine.gaugeSnapshot(),
    statuses: Object.values(s.combatants).map((c) => [c.id, c.hp, c.statuses]),
  });
}

/** Put a timed Regen on a girl and a timed Poison on the first enemy, so durations exist to move. */
function withTimers(engine: FFX2Engine): void {
  const all = Object.values(engine.state().combatants) as Array<{ side: string; statuses: Record<string, StatusInstance> }>;
  const girl = all.find((c) => c.side === 'party');
  const enemy = all.find((c) => c.side === 'enemy');
  if (!girl || !enemy) throw new Error('no party or no enemy');
  girl.statuses['regen'] = timed('regen');
  enemy.statuses['poison'] = timed('poison');
}

describe('Wait mode (FFX-2 only): the clock stops while a command menu is open', () => {
  it('is the engine default, and setAtbMode round-trips', () => {
    const engine = new FFX2Engine();
    expect(engine.atbMode()).toBe('wait');
    engine.setAtbMode('active');
    expect(engine.atbMode()).toBe('active');
    expect(new FFX2Engine({ atbMode: 'active' }).atbMode()).toBe('active');
  });

  it('6 s with a menu open move no tick, no gauge and no status duration', () => {
    const engine = newEngine(7);
    runToInput(engine);
    withTimers(engine);
    const before = clockPicture(engine);
    // 6 s of real clock, the way the pump would hand it over, then a plain tick too.
    for (let i = 0; i < 120; i++) expect(engine.tick(50, { throughInput: true })).toEqual([]);
    expect(engine.tick(6000)).toEqual([]);
    expect(clockPicture(engine)).toBe(before);
  });

  it('the ATB rows hold still: the owner full, every other bar frozen where it was', () => {
    const engine = newEngine(7);
    const owner = runToInput(engine);
    const snap = engine.gaugeSnapshot();
    engine.tick(6000, { throughInput: true });
    const after = engine.gaugeSnapshot();
    expect(after).toEqual(snap);
    const ownerBar = after.bars.find((b) => b.actorId === owner);
    expect(ownerBar?.ready).toBe(true);
    expect(ownerBar?.fill).toBeGreaterThanOrEqual(1);
  });

  it('the clock resumes on confirm', () => {
    const engine = newEngine(7);
    runToInput(engine);
    const d = engine.nextDecision();
    if (d.kind !== 'player-input') throw new Error('expected a menu');
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
    if (!row) throw new Error('no enabled row');
    engine.submit({ ...row.command, targets: row.validTargets.slice(0, 1) } as never);
    const ticks = engine.state().ticks;
    const next = engine.nextDecision();
    if (next.kind === 'waiting') engine.tick(next.nextEventMs);
    else engine.tick(500);
    expect(engine.state().ticks).toBeGreaterThan(ticks);
  });

  it('Active on the same seed still runs the clock under the menu (15385ab unchanged)', () => {
    const engine = newEngine(7, { atbMode: 'active' });
    runToInput(engine);
    const before = engine.state().ticks;
    engine.tick(2000, { throughInput: true });
    expect(engine.state().ticks).toBeGreaterThan(before);
  });

  it('switching Wait -> Active mid-menu releases the clock; Active -> Wait stops it', () => {
    const engine = newEngine(7);
    runToInput(engine);
    const t0 = engine.state().ticks;
    engine.tick(1000, { throughInput: true });
    expect(engine.state().ticks).toBe(t0);
    engine.setAtbMode('active');
    engine.tick(1000, { throughInput: true });
    const t1 = engine.state().ticks;
    expect(t1).toBeGreaterThan(t0);
    engine.setAtbMode('wait');
    // Still her menu? Only if nothing invalidated it; either way no tick moves now.
    engine.tick(1000, { throughInput: true });
    expect(engine.state().ticks).toBe(t1);
  });

  it('survives init, like the ATB speed (a chained chapter keeps it across links)', () => {
    const engine = newEngine(7, { atbMode: 'active' });
    engine.setAtbMode('wait');
    const group = data.ENEMY_GROUPS_BY_ID[CH4]!;
    engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 3, condition: 'normal', canEscape: false });
    expect(engine.atbMode()).toBe('wait');
  });
});

describe('the presenter under Wait (src/engine/BattlePresenterActive.ts)', () => {
  function fakeEngine(mode: { v: 'wait' | 'active' }) {
    const fed: number[] = [];
    const engine: ActiveClockEngine = {
      tick: (ms) => {
        fed.push(ms);
        return [];
      },
      inputValid: () => true,
      gaugeSnapshot: () => ({ bars: [], elapsedMs: 0 }) as never,
      atbMode: () => mode.v,
    };
    return { engine, fed };
  }

  it('a Wait engine gets no pump at all; an Active one does; FFX never does', () => {
    expect(activeClockEngine(newEngine(7))).toBeNull();
    expect(activeClockEngine(newEngine(7, { atbMode: 'active' }))).not.toBeNull();
    const flipped = newEngine(7);
    flipped.setAtbMode('active');
    expect(activeClockEngine(flipped)).not.toBeNull();
    expect(activeClockEngine(new FFXEngine())).toBeNull();
  });

  it('flipped to Wait mid-menu, the pump stops at the next step without a tick', async () => {
    const mode = { v: 'active' as 'wait' | 'active' };
    const { engine, fed } = fakeEngine(mode);
    let clock = 0;
    let steps = 0;
    const stop = await runActivePump({
      engine,
      actorId: 'yuna' as CombatantId,
      settled: () => false,
      aborted: () => false,
      sleep: (ms) => {
        steps += 1;
        clock += ms;
        // The pause closes on step 5 with X-2 BATTLE set to WAIT, after 6 s away.
        if (steps === 5) {
          mode.v = 'wait';
          clock += 6000;
        }
        return Promise.resolve();
      },
      now: () => clock,
      play: () => Promise.resolve({ dropped: 0 }),
      syncGauges: () => undefined,
    });
    expect(stop).toBe('settled');
    expect(fed).toEqual([50, 50, 50, 50]);
  });

  it('an engine with no atbMode reads as Active (older doubles unchanged)', async () => {
    const fed: number[] = [];
    let clock = 0;
    let steps = 0;
    await runActivePump({
      engine: { tick: (ms) => (fed.push(ms), []), inputValid: () => true, gaugeSnapshot: () => ({ bars: [], elapsedMs: 0 }) as never },
      actorId: 'yuna' as CombatantId,
      settled: () => steps >= 3,
      aborted: () => false,
      sleep: (ms) => {
        steps += 1;
        clock += ms;
        return Promise.resolve();
      },
      now: () => clock,
      play: () => Promise.resolve({ dropped: 0 }),
      syncGauges: () => undefined,
    });
    expect(fed.length).toBeGreaterThan(0);
  });
});
