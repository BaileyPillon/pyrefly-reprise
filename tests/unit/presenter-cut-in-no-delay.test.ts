/**
 * **The turn cut-in never delays the command menu** (PR-0061 against PR-0005).
 *
 * The approved Turn cut-in tile shows the slab and a live command menu in one
 * frame; release 10 awaited the slab first, which put ~0.8 s in front of every
 * first menu. Proved by running the real presenter over the real FFX engine
 * with a moments port whose cut-in never finishes: the menu must open anyway.
 * Presenter plumbing, so both games (CHK-020).
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import type { AvailableCommand, Command, CombatantId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

class SilentMenuHud implements HudPort {
  opened: CombatantId[] = [];
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  syncGauges(): void {}
  chooseCommand(actorId: CombatantId, _commands: AvailableCommand[]): Promise<Command> {
    this.opened.push(actorId);
    return new Promise<Command>(() => undefined);
  }
  closeCommandMenu(): void {}
  onEvent(): void {}
  openMinigame(): Promise<never> {
    return new Promise<never>(() => undefined);
  }
  setVisible(): void {}
  setProjector(): void {}
}

async function settle(turns = 2000): Promise<void> {
  for (let i = 0; i < turns; i++) await Promise.resolve();
}

describe('turn cut-in vs the first usable menu (PR-0061, PR-0005)', () => {
  it('opens the command menu while the cut-in slab is still up', async () => {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const group = ENEMY_GROUPS_BY_ID['yunalesca'];
    if (!group) throw new Error('yunalesca group missing');
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({ game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
    const state = engine.state();

    const cutIns: string[] = [];
    const moments: MomentsPort = {
      letterbox: async () => {},
      nameSlab: async () => {},
      vignette: () => {},
      clear: () => {},
      // A slab that never leaves: an awaited cut-in would hold the menu forever.
      turnCutIn: (req) => {
        cutIns.push(req.actorId);
        return new Promise<void>(() => undefined);
      },
    };
    const hud = new SilentMenuHud();
    let clock = 0;
    const presenter = new BattlePresenter({
      stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
      hud,
      moments,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: () => {
        clock += 5000;
        return Promise.resolve();
      },
      now: () => clock,
    });

    void presenter.run(engine);
    await settle();

    expect(cutIns.length).toBe(1);
    expect(hud.opened).toEqual([cutIns[0]]);
    presenter.abort();
  });
});
