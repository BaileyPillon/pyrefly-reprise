// @vitest-environment jsdom
/**
 * **FFX-2 Wait split, the presenter's half.** FFX-2 only (AGENTS.md rule 14).
 *
 * The engine knows *that* a menu is open; only the HUD knows whether the
 * cursor is on the top-level list or inside a submenu / target cursor
 * (`research/ffx2-combat-core.md` §1.5: Wait runs at the top level, freezes
 * in a submenu). The HUD reports the level (`HudPort.onMenuLevel`), the
 * presenter tells the engine and pumps or parks on `engine.clockHeld()`.
 * `docs/plans/ffx2-wait-split-review.md`.
 *
 * Real `FFX2Engine`, real chapter 4 data, the real presenter, a fake clock;
 * the pause-epoch case drives `runActivePump` directly.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { MenuLevel } from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { PUMP_MS, runActivePump } from '../../src/engine/BattlePresenterActive.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

function newEngine(seed: number, split: boolean): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', waitSplit: split }));
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

interface Rig {
  engine: FFX2Engine;
  presenter: BattlePresenter;
  asked: CombatantId[];
  /** The level the HUD would report, as the presenter's listener hears it. */
  report: (level: MenuLevel) => void;
  subscribed: () => boolean;
  until: (cond: () => boolean, max?: number) => Promise<void>;
}

/** The real presenter parked on chapter 4's first menu, never answered. `coach` wraps the HUD like the game does. */
async function rig(split: boolean, coach = true): Promise<Rig> {
  const engine = newEngine(3, split);
  const state = engine.state();
  let listener: ((level: MenuLevel) => void) | null = null;
  const r = { asked: [] as CombatantId[] } as unknown as Rig;
  const inner: HudPort = {
    mount() {},
    unmount() {},
    sync() {},
    syncGauges() {},
    setVisible() {},
    setProjector() {},
    setAtbMode() {},
    onMenuLevel(l) {
      listener = l;
      return () => {
        if (listener === l) listener = null;
      };
    },
    openMinigame: () => new Promise<never>(() => undefined),
    chooseCommand(actorId: CombatantId, _commands: AvailableCommand[]) {
      r.asked.push(actorId);
      return new Promise<Command>(() => undefined);
    },
    onEvent(_event: BattleEvent) {},
  };
  const hud = coach ? withCoach('ffx2', inner) : inner;
  let clock = 0;
  const presenter = new BattlePresenter({
    stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    sleep: (ms) => {
      clock += ms;
      return Promise.resolve();
    },
    now: () => clock,
  });
  void presenter.run(engine);
  r.engine = engine;
  r.presenter = presenter;
  r.report = (level) => listener?.(level);
  r.subscribed = () => listener !== null;
  r.until = async (cond, max = 20_000) => {
    for (let i = 0; i < max && !cond(); i++) await Promise.resolve();
  };
  await r.until(() => r.asked.length > 0 && listener !== null);
  expect(r.asked.length).toBe(1);
  return r;
}

const settle = async (n = 5000): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

describe('the presenter runs the Wait clock at the top list and parks it below (through withCoach)', () => {
  it('held until the HUD reports the top list; top runs; submenu holds; top runs again; same owner', async () => {
    const r = await rig(true);
    expect(r.subscribed()).toBe(true);
    const t0 = r.engine.state().ticks;
    await settle();
    expect(r.engine.state().ticks).toBe(t0);

    r.report('top');
    await r.until(() => r.engine.state().ticks >= t0 + 300);
    expect(r.engine.state().ticks).toBeGreaterThanOrEqual(t0 + 300);

    r.report('deep');
    await settle(500);
    const t1 = r.engine.state().ticks;
    await settle();
    expect(r.engine.state().ticks).toBe(t1);

    r.report('top');
    await r.until(() => r.engine.state().ticks >= t1 + 300);
    expect(r.engine.state().ticks).toBeGreaterThanOrEqual(t1 + 300);
    expect(r.asked.length).toBe(1);
    r.presenter.abort();
  });

  it('with the split off, the top list stays held (the whole-menu hold)', async () => {
    const r = await rig(false);
    const t0 = r.engine.state().ticks;
    r.report('top');
    await settle();
    expect(r.engine.state().ticks).toBe(t0);
    r.presenter.abort();
  });

  it('a flip to ACTIVE inside a submenu runs the clock at once', async () => {
    const r = await rig(true, false);
    const t0 = r.engine.state().ticks;
    r.report('deep');
    await settle(500);
    expect(r.engine.state().ticks).toBe(t0);
    r.engine.setAtbMode('active');
    r.presenter.atbModeChanged();
    await r.until(() => r.engine.state().ticks >= t0 + 300);
    expect(r.engine.state().ticks).toBeGreaterThanOrEqual(t0 + 300);
    r.presenter.abort();
  });
});

describe('the pause epoch: time behind a pause is never handed to the clock', () => {
  it('a 10 s pause between two pump steps hands tick 0 ms, not the 250 ms clamp', async () => {
    let clock = 0;
    let epoch = 0;
    let steps = 0;
    const dts: number[] = [];
    let done = false;
    const engine = {
      tick(ms: number) {
        dts.push(ms);
        return [];
      },
      inputValid: () => true,
      gaugeSnapshot: () => ({ elapsedMs: 0, bars: [] }),
    };
    await runActivePump({
      engine,
      actorId: 'yuna',
      settled: () => done,
      aborted: () => false,
      sleep: async (ms) => {
        steps += 1;
        // The second wait is the one a pause parks: 10 s pass, then the
        // pause-close hook bumps the epoch before the pump resumes.
        clock += steps === 2 ? 10_000 : ms;
        if (steps === 2) epoch += 1;
        if (steps === 4) done = true;
      },
      now: () => clock,
      play: async () => ({ dropped: 0 }),
      syncGauges: () => undefined,
      epoch: () => epoch,
    });
    expect(Math.max(...dts)).toBeLessThanOrEqual(PUMP_MS);
    expect(dts.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(2 * PUMP_MS);
  });
});
