/**
 * The battle screen's debug surface, moved out of `BattleScreen.ts` unchanged:
 * the capture tool's playback / HUD / camera-rig triggers and the engine half
 * of `snapshot()`. Game case: both (shared debug plumbing).
 */

import { describe, expect, it, vi } from 'vitest';
import { battleDebugTrigger, battleStateSnapshot } from '../../src/app/screens/BattleScreenDebug.ts';

function parts() {
  const presenter = { setSpeed: vi.fn() };
  const hud = { setVisible: vi.fn() };
  const scene = {
    battleCamera: { rigNames: ['idle', 'wide'], moveTo: vi.fn(() => Promise.resolve()) },
    trigger: vi.fn((name: string) => name === 'scene:own'),
  };
  return { presenter, hud, scene, run: (name: string) => battleDebugTrigger(name, presenter as never, hud as never, scene as never) };
}

describe('battleDebugTrigger', () => {
  it('sets the playback speed for battle:fast, battle:skip and battle:normal', () => {
    const p = parts();
    expect(p.run('battle:fast')).toBe(true);
    expect(p.run('battle:skip')).toBe(true);
    expect(p.run('battle:normal')).toBe(true);
    expect(p.presenter.setSpeed.mock.calls).toEqual([['fast'], ['skip'], ['normal']]);
  });

  it('shows and hides the HUD', () => {
    const p = parts();
    expect(p.run('hud:off')).toBe(true);
    expect(p.run('hud:on')).toBe(true);
    expect(p.hud.setVisible.mock.calls).toEqual([[false], [true]]);
  });

  it('moves the camera to a known rig and refuses an unknown one', () => {
    const p = parts();
    expect(p.run('rig:wide')).toBe(true);
    expect(p.scene.battleCamera.moveTo).toHaveBeenCalledWith('wide', 700);
    expect(p.run('rig:nowhere')).toBe(false);
  });

  it('hands anything else to the scene, prototype names included', () => {
    const p = parts();
    expect(p.run('scene:own')).toBe(true);
    expect(p.run('toString')).toBe(false);
    expect(p.presenter.setSpeed).not.toHaveBeenCalled();
    expect(battleDebugTrigger('battle:fast', null, null, null)).toBe(true);
    expect(battleDebugTrigger('anything', null, null, null)).toBe(false);
  });
});

describe('battleStateSnapshot', () => {
  it('is null before an engine exists and summarises the state after', () => {
    expect(battleStateSnapshot(undefined)).toBeNull();
    const state = {
      turn: 3,
      ticks: 40,
      log: [{}, {}],
      result: null,
      combatants: {
        tidus: { id: 'tidus', hp: 500, stats: { maxHp: 520 }, mp: 12, alive: true, side: 'party', statuses: { haste: {} } },
      },
    };
    expect(battleStateSnapshot(state as never)).toEqual({
      turn: 3,
      ticks: 40,
      events: 2,
      result: null,
      combatants: [{ id: 'tidus', hp: 500, maxHp: 520, mp: 12, alive: true, side: 'party', statuses: ['haste'] }],
    });
  });
});
