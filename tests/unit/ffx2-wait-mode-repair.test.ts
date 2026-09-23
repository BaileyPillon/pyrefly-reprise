// @vitest-environment jsdom
/**
 * **Wait mode, the verifier's repair pass.** FFX-2 only (AGENTS.md rule 14).
 *
 * Bailey, 2026-09-22 21:45 EDT (`docs/target/decisions.json` D-029): *"1. C Wait
 * mode. Also I want the default to be wait mode instead of active mode please."*
 * The adversarial verifier (critic/scratch/ffx2-wait/) refuted three things this
 * file pins, each through the real module that was wrong:
 *
 * 1. **The HUD's mode chip lied.** `FFX2BattleHud` hardcoded `'active'`, so a
 *    Wait fight showed "ACTIVE — ATB RUNNING" over a held clock. The presenter
 *    now tells the HUD the engine's mode at every menu and at every flip, and
 *    the coach wrapper forwards it (it forwarded neither this nor `syncGauges`
 *    nor `closeCommandMenu`, so the Active pump's bars never reached the real
 *    HUD either).
 * 2. **A flip to ACTIVE in the pause did not reach the menu open under it.** The
 *    presenter now parks a Wait menu on "answered, or the mode changed", and the
 *    pause-close hook wakes it (`BattlePresenter.atbModeChanged`).
 * 3. **FFX chapters printed the X-2 BATTLE row** (`pause-atb-mode.test.ts`).
 *
 * Real `FFX2Engine`, real chapter 4 data, the real presenter, a fake clock.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { AtbSnapshot, AvailableCommand, BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

const CH4 = 'ffx2-bahamut';

function newEngine(seed: number, mode: 'wait' | 'active'): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID[CH4];
  if (!group) throw new Error(`${CH4} missing`);
  const engine = new FFX2Engine(ffx2Options({ atbMode: mode }));
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

interface Rig {
  engine: FFX2Engine;
  presenter: BattlePresenter;
  asked: CombatantId[];
  modes: Array<'wait' | 'active'>;
  gauges: number;
  answer: (c: Command) => void;
  offered: AvailableCommand[];
  until: (cond: () => boolean, max?: number) => Promise<void>;
}

/** The real presenter over a real engine, parked on the first menu, which is never answered unless the test does. */
async function rig(mode: 'wait' | 'active'): Promise<Rig> {
  const engine = newEngine(3, mode);
  const state = engine.state();
  const r = { asked: [] as CombatantId[], modes: [] as Array<'wait' | 'active'>, gauges: 0 } as Rig;
  let answer: ((c: Command) => void) | null = null;
  const hud: HudPort & { setAtbMode(m: 'wait' | 'active'): void } = {
    mount() {},
    unmount() {},
    sync() {},
    syncGauges() {
      r.gauges += 1;
    },
    setVisible() {},
    setProjector() {},
    setAtbMode(m) {
      r.modes.push(m);
    },
    openMinigame: () => new Promise<never>(() => undefined),
    chooseCommand(actorId: CombatantId, commands: AvailableCommand[]) {
      r.asked.push(actorId);
      if (r.asked.length === 1) {
        r.offered = commands;
        return new Promise<Command>((res) => {
          answer = res;
        });
      }
      return new Promise<Command>(() => undefined);
    },
    onEvent(_event: BattleEvent) {},
  };
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
  r.answer = (c) => answer?.(c);
  r.until = async (cond, max = 20_000) => {
    for (let i = 0; i < max && !cond(); i++) await Promise.resolve();
  };
  await r.until(() => r.asked.length > 0);
  expect(r.asked.length).toBe(1);
  return r;
}

const settle = async (_r: Rig, n = 5000): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

describe('the presenter tells the HUD the true mode (verifier failure 1)', () => {
  it('a Wait menu reports wait; an Active menu reports active', async () => {
    const w = await rig('wait');
    await settle(w, 200);
    expect(w.modes.at(-1)).toBe('wait');
    w.presenter.abort();

    const a = await rig('active');
    await settle(a, 200);
    expect(a.modes.at(-1)).toBe('active');
    a.presenter.abort();
  });
});

describe('a pause flip reaches the menu that is already open (verifier failure 4)', () => {
  it('Wait → ACTIVE: the clock runs under the same menu, same owner, no re-ask', async () => {
    const r = await rig('wait');
    const held = r.engine.state().ticks;
    await settle(r);
    expect(r.engine.state().ticks).toBe(held);

    // The pause closes with X-2 BATTLE = ACTIVE: BattleScreen applies the
    // setting and then wakes the presenter.
    r.engine.setAtbMode('active');
    r.presenter.atbModeChanged();
    await r.until(() => r.engine.state().ticks >= held + 1000);
    expect(r.engine.state().ticks).toBeGreaterThanOrEqual(held + 1000);
    expect(r.asked.length).toBe(1);
    expect(r.modes.at(-1)).toBe('active');
    expect(r.gauges).toBeGreaterThan(0);
    r.presenter.abort();
  });

  it('ACTIVE → Wait: the clock stops under the same menu and the HUD says so', async () => {
    const r = await rig('active');
    const start = r.engine.state().ticks;
    await r.until(() => r.engine.state().ticks >= start + 500);
    r.engine.setAtbMode('wait');
    r.presenter.atbModeChanged();
    await settle(r, 500);
    const held = r.engine.state().ticks;
    await settle(r);
    expect(r.engine.state().ticks).toBe(held);
    expect(r.modes.at(-1)).toBe('wait');
    r.presenter.abort();
  });

  it('a Wait menu answered normally still plays the turn (no wake needed)', async () => {
    const r = await rig('wait');
    const row = r.offered.find((c) => c.enabled && c.validTargets.length > 0)!;
    const turn = r.engine.state().turn;
    r.answer({ ...row.command, targets: row.validTargets.slice(0, 1) } as Command);
    await r.until(() => r.engine.state().turn > turn);
    expect(r.engine.state().turn).toBeGreaterThan(turn);
    r.presenter.abort();
  });

  it('abort releases a parked Wait menu', async () => {
    const r = await rig('wait');
    r.presenter.abort();
    await settle(r, 200);
    expect(r.presenter.isAborted).toBe(true);
  });
});

describe('the coach wrapper forwards the FFX-2 clock methods (verifier failure 1, root)', () => {
  it('syncGauges, closeCommandMenu and setAtbMode reach the inner HUD', () => {
    const calls: string[] = [];
    const inner = {
      mount() {},
      unmount() {},
      sync() {},
      setVisible() {},
      setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      chooseCommand: () => new Promise<Command>(() => undefined),
      onEvent() {},
      syncGauges: (_s: AtbSnapshot) => calls.push('syncGauges'),
      closeCommandMenu: () => calls.push('closeCommandMenu'),
      setAtbMode: (m: 'wait' | 'active') => calls.push(`setAtbMode:${m}`),
    } as unknown as HudPort;
    const hud = withCoach('ffx2', inner);
    hud.syncGauges?.({ elapsedMs: 0, bars: [] });
    hud.closeCommandMenu?.();
    hud.setAtbMode?.('wait');
    expect(calls).toEqual(['syncGauges', 'closeCommandMenu', 'setAtbMode:wait']);
  });
});

describe('FFX2BattleHud names the mode it is told (verifier failure 1)', () => {
  it('reads WAIT — ATB HELD in Wait and ACTIVE — ATB RUNNING in Active, never a hardcoded Active', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    const chip = root.querySelector<HTMLElement>('.ffx2-atbmode')!;
    const show = (on: boolean): void =>
      (hud as unknown as { setActiveWaitVisible(on: boolean): void }).setActiveWaitVisible(on);

    // Before anyone says: the default (D-029), not Active.
    show(true);
    expect(chip.textContent).toBe('WAIT — ATB HELD');

    hud.setAtbMode('active');
    expect(chip.textContent).toBe('ACTIVE — ATB RUNNING');
    expect(chip.classList.contains('ffx2-atbmode--wait')).toBe(false);

    // A flip while the cursor is live updates the visible chip at once.
    hud.setAtbMode('wait');
    expect(chip.hidden).toBe(false);
    expect(chip.textContent).toBe('WAIT — ATB HELD');
    expect(chip.classList.contains('ffx2-atbmode--wait')).toBe(true);
    hud.unmount();
  });
});
