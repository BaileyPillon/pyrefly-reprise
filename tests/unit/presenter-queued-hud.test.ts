/**
 * PR-0104 (FFX-2 only): `HudPort.syncQueued` is called the moment a command is submitted, **before** the submit's events
 * play (the full `sync` only arrives after them, about 1.6 s later), and again at each action's start and end so a
 * charge that has run out drops its chip. A HUD without the method plays exactly as before.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { attackStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { BattleState } from '../../src/battle/common/types.ts';
import { FakeEngine } from './helpers/FakeEngine.ts';
import { FakeHud, FakeStage, noSleep } from './helpers/FakeStage.ts';

class QueuedHud extends FakeHud {
  readonly order: string[] = [];
  syncQueued(_state: BattleState): void {
    this.order.push('queued');
  }
  override onEvent(event: { type: string }): void | Promise<void> {
    this.order.push(event.type);
  }
}

describe('HudPort.syncQueued', () => {
  it('is called after the submit and before the first event of that submit is shown', async () => {
    const hud = new QueuedHud();
    const presenter = new BattlePresenter({ stage: new FakeStage(['tidus', 'yuna', 'auron'], ['seymour-flux']), hud, sleep: noSleep });
    presenter.setAutoPlay(attackStrategy);
    await presenter.run(new FakeEngine({ enemyHp: 2400, partyDamage: 1200 }));
    const firstQueued = hud.order.indexOf('queued');
    expect(firstQueued).toBeGreaterThanOrEqual(0);
    const firstAction = hud.order.indexOf('action-start');
    expect(firstAction === -1 || firstQueued < firstAction).toBe(true);
  });

  it('a HUD without the method is untouched', async () => {
    const presenter = new BattlePresenter({ stage: new FakeStage(['tidus', 'yuna', 'auron'], ['seymour-flux']), hud: new FakeHud(), sleep: noSleep });
    presenter.setAutoPlay(attackStrategy);
    const outcome = await presenter.run(new FakeEngine({ enemyHp: 2400, partyDamage: 1200 }));
    expect(outcome.kind).toBe('victory');
  });
});
