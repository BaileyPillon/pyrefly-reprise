// @vitest-environment jsdom
/**
 * **The FFX-2 HUD plays a battle with the per-command action time ON, and does not stall** (r56, 2026-10-19; FFX-2 only; `ACTION_TIME_PER_COMMAND` is on in production).
 *
 * The real `FFX2BattleHud` mounted in jsdom, the real `BattlePresenter` over a real `FFX2Engine`, set up through the app's own path (`registerBattleContent`,
 * `setupForChapter`), with a fake clock and fake stage ports. The player is the keyboard: `Enter` (the command menu's confirm key, dispatched on `window` like a real
 * press) picks the first row (Attack) and then the first target of every menu the HUD opens. Chapter XII (Den of Woe, link 1: Baralai) and Chapter XVI (Angra Mainyu,
 * link 1) at the default Wait mode and at Active; the pass is the link reaching a verdict through the HUD with the engine clock advancing, a girl's menu opened and
 * answered several times, and the per-command spans really in use (the engine's executing countdown ran: a girl's action took more than 0 steps).
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { BattleEvent, CombatantId } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ACTION_TIME_PER_COMMAND } from '../../src/battle/ffx2/action-time.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

beforeAll(async () => {
  await registerBattleContent();
});

const press = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};

interface Played {
  outcome: string;
  /** Turns of the party the HUD asked for (menus opened). */
  asked: number;
  /** Girls' actions that finished. */
  partyActions: number;
  enemyActions: number;
  ticks: number;
  /** Key presses it took. */
  presses: number;
  /** True when the loop ran out of turns before a verdict (a stall). */
  stalled: boolean;
}

/** Play link 1 of a chapter through the real HUD and presenter, the keyboard confirming the first row and the first target of every menu. */
async function playThroughHud(chapterId: string, mode: 'wait' | 'active', seed: number): Promise<Played> {
  const chapter = getChapter(chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const setup = setupForChapter(chapter, seed);
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false, atbMode: mode });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const state = engine.state();

  const root = document.createElement('div');
  document.body.append(root);
  const hud = new FFX2BattleHud();
  hud.mount(root);

  const played: Played = { outcome: 'unresolved', asked: 0, partyActions: 0, enemyActions: 0, ticks: 0, presses: 0, stalled: false };
  const asking = hud.chooseCommand.bind(hud);
  hud.chooseCommand = (actorId, commands, ...rest) => {
    played.asked += 1;
    return asking(actorId, commands, ...rest);
  };
  const onEvent = hud.onEvent.bind(hud);
  hud.onEvent = (event: BattleEvent) => {
    if (event.type === 'action-end') {
      const side = (engine.state().combatants[event.actorId as CombatantId] as { side?: string } | undefined)?.side;
      if (side === 'enemy') played.enemyActions += 1;
      else played.partyActions += 1;
    }
    return onEvent(event);
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
  let result: string | undefined;
  void presenter.run(engine).then((r) => {
    result = r.kind;
  });

  for (let i = 0; i < 400_000 && result === undefined; i += 1) {
    await Promise.resolve();
    if (i % 25 === 0) {
      press('Enter');
      played.presses += 1;
    }
  }
  played.stalled = result === undefined;
  played.outcome = result ?? 'unresolved';
  played.ticks = engine.state().ticks;
  presenter.abort();
  hud.unmount();
  root.remove();
  return played;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the FFX-2 HUD runs a battle with the per-command action time ON, and does not stall', () => {
  it('the switch is on in production', () => {
    expect(ACTION_TIME_PER_COMMAND).toBe(true);
  });

  for (const [id, label] of [
    ['ffx2-den-of-woe', 'Chapter XII, Den of Woe (Baralai)'],
    ['ffx2-angra-mainyu', 'Chapter XVI, Angra Mainyu'],
  ] as const) {
    for (const mode of ['wait', 'active'] as const) {
      it(`${label}, ${mode} ATB: the keyboard answers every menu and the link reaches a verdict`, async () => {
        const p = await playThroughHud(id, mode, 3);
        console.log(`HUD ${id} ${mode}: ${JSON.stringify(p)}`);
        expect(p.stalled, JSON.stringify(p)).toBe(false);
        expect(['victory', 'defeat']).toContain(p.outcome);
        expect(p.asked, 'the HUD opened the girls\' menus').toBeGreaterThan(2);
        expect(p.partyActions, 'the girls\' actions finished').toBeGreaterThan(2);
        expect(p.enemyActions, 'the monsters acted').toBeGreaterThan(0);
        expect(p.ticks, 'the engine clock advanced').toBeGreaterThan(0);
      }, 120_000);
    }
  }
});
