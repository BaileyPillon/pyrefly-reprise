/**
 * PR-0150 (FFX-2 only): an FFX-2 command menu, and the target step under it,
 * holds the wide `idle` frame of the approved Targeting tile s3 while the ATB
 * plays actions underneath. `src/engine/TargetFrameHold.ts` has the why.
 */
import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { CameraPort } from '../../src/engine/BattlePresenterPorts.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { HoldableCamera, TARGET_FRAME_RIG } from '../../src/engine/TargetFrameHold.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

/** A camera that records every call, parked on `start`. */
function fakeCamera(start = 'idle') {
  const calls: string[] = [];
  let rig = start;
  const cam: CameraPort = {
    rigNames: ['idle', 'party', 'enemy', 'action'],
    get rigName() {
      return rig;
    },
    moveTo: async (r, ms) => {
      calls.push(`moveTo:${r}:${ms}`);
      rig = r;
    },
    snapTo: (r) => {
      calls.push(`snapTo:${r}`);
      rig = r;
    },
    shake: () => void calls.push('shake'),
    punch: async () => void calls.push('punch'),
    push: async () => void calls.push('push'),
    release: async () => void calls.push('release'),
    roll: async () => void calls.push('roll'),
  };
  return { cam, calls };
}

describe('HoldableCamera (PR-0150, FFX-2 target frame)', () => {
  it('passes every call through while no hold is engaged', async () => {
    const { cam, calls } = fakeCamera();
    const held = new HoldableCamera(cam);
    await held.moveTo('party', 300);
    held.snapTo('enemy');
    await held.push(0.06, 100);
    await held.roll(-4, 100);
    await held.punch(0.1, 100);
    held.shake(0.1, 100);
    expect(calls).toEqual(['moveTo:party:300', 'snapTo:enemy', 'push', 'roll', 'punch', 'shake']);
    expect(held.rigName).toBe('enemy');
  });

  it('settles on idle once, then swallows every framing request but shake', async () => {
    const { cam, calls } = fakeCamera('party');
    const held = new HoldableCamera(cam);
    held.hold(true);
    held.hold(true); // every arrow press re-applies: only the first moves
    expect(calls).toEqual(['release', `moveTo:${TARGET_FRAME_RIG}:320`]);
    calls.length = 0;
    await held.moveTo('enemy', 300);
    held.snapTo('party');
    await held.push(0.06, 100);
    await held.roll(-4, 100);
    await held.punch(0.1, 100);
    held.shake(0.1, 100);
    expect(calls).toEqual(['shake']);
    expect(held.rigName).toBe('idle');
  });

  it('frames normally again once released', async () => {
    const { cam, calls } = fakeCamera('idle');
    const held = new HoldableCamera(cam);
    held.hold(true);
    expect(calls).toEqual(['release']); // already on idle: no move
    held.hold(false);
    held.snapTo('enemy');
    expect(held.rigName).toBe('enemy');
    expect(held.holding).toBe(false);
  });
});

describe('the presenter holds the frame under an open FFX-2 menu (Active)', () => {
  it('swallows every rig move while the clock plays actions under the menu, and frames again after', async () => {
    const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
    if (!group) throw new Error('ffx2-bahamut missing');
    const engine = new FFX2Engine(ffx2Options());
    engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
    const state = engine.state();

    const stage = new FakeStage([...state.activeIds], [...state.enemyIds]);
    const held = new HoldableCamera(stage.camera);
    Object.defineProperty(stage, 'camera', { value: held });

    let answer: ((c: Command) => void) | null = null;
    let offered: AvailableCommand[] = [];
    let openedAt = -1;
    let asked = 0;
    const hud: HudPort = {
      mount() {},
      unmount() {},
      sync() {},
      syncGauges() {},
      setVisible() {},
      setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      closeCommandMenu() {},
      chooseCommand(_actorId: CombatantId, commands: AvailableCommand[]) {
        asked += 1;
        if (asked > 1) return new Promise<Command>(() => undefined);
        offered = commands;
        openedAt = stage.calls.length;
        return new Promise<Command>((res) => {
          answer = res;
        });
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
    void presenter.run(engine);
    const until = async (cond: () => boolean, max = 40_000): Promise<void> => {
      for (let i = 0; i < max && !cond(); i++) await Promise.resolve();
    };

    await until(() => openedAt >= 0);
    expect(openedAt).toBeGreaterThanOrEqual(0);
    await until(() => held.holding);
    expect(held.holding).toBe(true);
    // Let the clock run under the menu until something has played there.
    const ticks0 = engine.state().ticks;
    await until(() => stage.calls.slice(openedAt).some((c) => c.startsWith('impact:')) && engine.state().ticks > ticks0 + 3000, 200_000);
    const underMenu = stage.calls.slice(openedAt);
    expect(underMenu.some((c) => c.startsWith('impact:'))).toBe(true);
    const framing = underMenu.filter((c) => /^camera(!?:(?!shake|release)|:push|:roll|:punch)/.test(c));
    expect(framing).toEqual([]);

    const row = offered.find((c) => c.enabled && c.command.kind === 'attack') ?? offered.find((c) => c.enabled);
    const target = row?.validTargets[0];
    const answeredAt = stage.calls.length;
    answer!({ ...row!.command, targets: target ? [target] : [] } as Command);
    await until(() => !held.holding);
    expect(held.holding).toBe(false);
    await until(() => stage.calls.slice(answeredAt).some((c) => /^camera!?:(party|enemy|action)/.test(c)), 200_000);
    expect(stage.calls.slice(answeredAt).some((c) => /^camera!?:(party|enemy|action)/.test(c))).toBe(true);
    presenter.abort();
  });
});
