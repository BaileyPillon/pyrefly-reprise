/**
 * PR-0150 regression (FFX-2 only): the target-frame hold must never swallow the
 * battle's end shot. With the ATB running under an open command menu (Active),
 * the kill can land under that menu (a poison tick, a charged command, a queued
 * action); the victory event then plays inside the menu clock pump, and before
 * this fix `BattleMoments.victory`'s move to the `victory` rig was swallowed.
 * A mid-battle story beat under the menu must also get its camera back.
 */
import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { HoldableCamera, playUnheld } from '../../src/engine/TargetFrameHold.ts';
import type { CameraPort } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

describe('the FFX-2 target-frame hold lets the end of the battle through', () => {
  it('plays the victory shot when the kill lands under an open Active menu', async () => {
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
    if (!group) throw new Error('ffx2-bahamut missing');
    const engine = new FFX2Engine(ffx2Options());
    engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
    // Test setup: every enemy at 1 HP with permanent Poison, so the first
    // poison payout — under the menu, never answered — ends the battle.
    type Unit = { id: string; hp: number; statuses: Record<string, unknown> };
    const units = (engine as unknown as { units: Unit[] }).units;
    const enemyIds = new Set<string>(engine.state().enemyIds);
    for (const u of units) {
      if (!enemyIds.has(u.id)) continue;
      u.hp = 1;
      u.statuses.poison = { id: 'poison', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    }
    const state = engine.state();
    const stage = new FakeStage([...state.activeIds], [...state.enemyIds]);
    const held = new HoldableCamera(stage.camera);
    Object.defineProperty(stage, 'camera', { value: held });

    let opened = false;
    const hud: HudPort = {
      mount() {},
      unmount() {},
      sync() {},
      syncGauges() {},
      setVisible() {},
      setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      closeCommandMenu() {},
      chooseCommand(_actorId: CombatantId, _commands: AvailableCommand[]) {
        opened = true;
        return new Promise<Command>(() => undefined); // the menu is never answered
      },
      onEvent() {},
    };
    let clock = 0;
    const presenter = new BattlePresenter({
      stage,
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
    let outcome: string | null = null;
    void presenter.run(engine).then((o) => (outcome = (o as { result?: { outcome?: string } }).result?.outcome ?? 'ended'));
    for (let i = 0; i < 400_000 && outcome === null; i++) await Promise.resolve();

    expect(opened).toBe(true);
    expect(outcome).not.toBeNull();
    expect(held.holding).toBe(false);
    expect(stage.calls.filter((c) => c.startsWith('camera')).slice(-3)).toContain('camera:victory');
    presenter.abort();
  });

  it('playUnheld lifts an engaged hold for a story beat and re-engages it after', async () => {
    const moves: string[] = [];
    let rig = 'idle';
    const inner: CameraPort = {
      rigNames: ['idle', 'action'],
      get rigName() {
        return rig;
      },
      moveTo: async (r) => void (moves.push(r), (rig = r)),
      snapTo: (r) => void (moves.push(`!${r}`), (rig = r)),
      shake: () => undefined,
      punch: async () => undefined,
      release: async () => undefined,
    };
    const held = new HoldableCamera(inner);
    held.hold(true);
    await playUnheld(held, async () => {
      expect(held.holding).toBe(false);
      await held.moveTo('action', 400); // the beat's own camera cue
    });
    expect(moves).toEqual(['action', 'idle']); // the cue played, then the menu frame came back
    expect(held.holding).toBe(true);

    held.hold(false);
    await playUnheld(held, async () => held.moveTo('action', 400));
    expect(held.holding).toBe(false); // never engages a hold that was off
  });

  it('a mid-battle story beat played under a held menu gets its camera cue, then the menu frame back', async () => {
    const stage = new FakeStage(['yuna'], ['bahamut']);
    const held = new HoldableCamera(stage.camera);
    Object.defineProperty(stage, 'camera', { value: held });
    const cutscenes = new (class extends FakeCutscenes {
      override async play(script: Parameters<FakeCutscenes['play']>[0]): Promise<void> {
        await held.moveTo('action', 400); // what BattleScreenCutscenes' camera() cue does
        await super.play(script);
      }
    })();
    const presenter = new BattlePresenter({ stage, cutscenes, midScripts: { beat: [] }, sleep: noSleep });
    held.hold(true); // an FFX-2 menu is open
    stage.calls.length = 0;
    await presenter.play([{ type: 'script-trigger', name: 'beat', seq: 0 } as BattleEvent]);
    expect(stage.calls.filter((c) => c.startsWith('camera') && c !== 'camera:release')).toEqual(['camera:action', 'camera:idle']);
    expect(held.holding).toBe(true);
  });
});
