/**
 * **The absence test for Active ATB** (AGENTS.md rule 14, `critic/CHECKS.md`
 * CHK-021).
 *
 * Active is FFX-2's mechanic and FFX-2's alone: it is an FFX-2 Config entry
 * (`research/ffx2-combat-core.md` §1.5), and FFX is CTB — its engine parks
 * waiting for a command by design and there is no clock to run
 * (`research/ffx-vs-ffx2-presentation.md` §4.3). One `BattlePresenter` serves
 * both, so the pump it grew is shared plumbing (CHK-020) and it must be
 * **completely inert** on an FFX fight.
 *
 * Proved by running the real presenter over the real FFX engine with a HUD
 * whose `chooseCommand` never answers, exactly as a player sitting still would
 * leave it, and reading the engine (hard rule 3 — prove it by running, not by
 * grepping).
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { activeClockEngine } from '../../src/engine/BattlePresenterActive.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import type { AvailableCommand, BattleEvent, Command, CombatantId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import {
  FakeAudio,
  FakeCutscenes,
  FakeDamageNumbers,
  FakeMessageBar,
  FakeStage,
} from './helpers/FakeStage.ts';

/** A HUD that opens a menu and never answers it — a player reading the screen. */
class SilentMenuHud implements HudPort {
  chooseCommandCalls = 0;
  closeCalls = 0;
  gaugeSyncs = 0;
  readonly seen: BattleEvent[] = [];

  mount(): void {}
  unmount(): void {}
  sync(): void {}
  syncGauges(): void {
    this.gaugeSyncs += 1;
  }
  chooseCommand(_actorId: CombatantId, _commands: AvailableCommand[]): Promise<Command> {
    this.chooseCommandCalls += 1;
    return new Promise<Command>(() => undefined);
  }
  closeCommandMenu(): void {
    this.closeCalls += 1;
  }
  onEvent(event: BattleEvent): void {
    this.seen.push(event);
  }
  openMinigame(): Promise<never> {
    return new Promise<never>(() => undefined);
  }
  setVisible(): void {}
  setProjector(): void {}
}

/** Let every pending microtask and the fake pump's waits drain. */
async function settle(turns = 2000): Promise<void> {
  for (let i = 0; i < turns; i++) await Promise.resolve();
}

function newFfxEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('yunalesca group missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: zanarkandBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

describe('FFX never gets an Active clock (rule 14 absence test)', () => {
  it('the FFX engine offers neither tick nor inputValid, so no pump can start', () => {
    const engine = newFfxEngine(7);

    expect(activeClockEngine(engine)).toBeNull();
    expect((engine as unknown as { tick?: unknown }).tick).toBeUndefined();
  });

  it('its CTB clock does not move while a command menu sits open, however long the wait', async () => {
    const engine = newFfxEngine(7);
    const state = engine.state();
    const hud = new SilentMenuHud();
    let clock = 0;
    const presenter = new BattlePresenter({
      stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
      hud,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      // Five seconds of fake wall clock pass on every wait the loop takes.
      sleep: () => {
        clock += 5000;
        return Promise.resolve();
      },
      now: () => clock,
    });

    const run = presenter.run(engine);
    await settle();

    expect(hud.chooseCommandCalls).toBeGreaterThan(0);
    const ticksAtMenu = engine.state().ticks;
    const logAtMenu = engine.state().log.length;

    await settle();

    // Nothing at all: no clock, no events, and the pump never touched the HUD.
    expect(engine.state().ticks).toBe(ticksAtMenu);
    expect(engine.state().log.length).toBe(logAtMenu);
    expect(hud.gaugeSyncs).toBe(0);
    expect(hud.closeCalls).toBe(0);
    expect(await Promise.race([run, Promise.resolve('still-waiting' as const)])).toBe('still-waiting');

    presenter.abort();
  });
});
