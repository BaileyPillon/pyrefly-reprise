/**
 * A-11 (both games) and A-1 (FFX-2 only) through the moments: a push stops
 * short of cutting the party, and under FFX-2 framing a shot that loses the
 * enemy in play or cuts a girl falls back through `action` to `idle`. FFX's
 * CTB keeps its cuts; a camera with no `frame` plays every shot as asked.
 */

import { describe, expect, it } from 'vitest';
import { BattleMoments, MOMENT_PUSH } from '../../src/engine/BattleMoments.ts';
import { PHONE_FIT_KEY } from '../../src/engine/ShotRules.ts';
import { ffx2Shot, fittedPush, partySubjects, FFX2_BOSS_MIN, PARTY_MIN } from '../../src/engine/ShotFit.ts';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Frame = (rig: string, push: number, subjects: ReadonlyArray<{ actor: ActorHandle; min: number }>) => { fits: boolean; push: number; worst: number } | null;

/** A stage whose camera measures shots by a table: which rigs fit, and the push each allows. */
function setup(table: Record<string, { fits: boolean; maxPush: number }>, ffx2 = false) {
  const stage = new FakeStage(['yuna', 'rikku'], ['bahamut']);
  const asked: Array<{ rig: string; push: number; n: number }> = [];
  const frame: Frame = (rig, push, subjects) => {
    asked.push({ rig, push, n: subjects.length });
    const t = table[rig] ?? { fits: true, maxPush: 1 };
    return { fits: t.fits, push: Math.min(push, t.maxPush), worst: t.fits ? 1 : 0.4 };
  };
  (stage.camera as { frame?: Frame }).frame = frame;
  const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => 'normal' });
  moments.shots.ffx2Framing = ffx2;
  const pushes = () => stage.calls.filter((c) => c.startsWith('camera:push'));
  return { stage, moments, asked, pushes };
}

describe('A-11: the push stops short (both games)', () => {
  it('takes the push the camera allows on the rig', async () => {
    const { moments, pushes } = setup({ party: { fits: true, maxPush: 0.02 } });
    await moments.actionOpen('yuna', 'attack');
    expect(pushes()).toEqual(['camera:push=0.02']);
  });

  it('keeps the authored push when nobody is cut', async () => {
    const { moments, pushes } = setup({});
    await moments.actionOpen('yuna', 'attack');
    expect(pushes()).toEqual([`camera:push=${MOMENT_PUSH.action.toFixed(2)}`]);
  });

  it('frames for the standing party only, at 85% plus the sway margin', () => {
    const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['bahamut']);
    stage.actors.get('paine')!.setPose('ko');
    const subjects = partySubjects(stage, PARTY_MIN);
    expect(subjects).toHaveLength(2);
    expect(subjects.every((s) => Math.abs(s.min - 0.88) < 1e-9)).toBe(true);
  });

  it('plays as asked on a camera that cannot measure', () => {
    const stage = new FakeStage(['yuna'], ['bahamut']);
    expect(fittedPush(stage, stage.camera, 'party', 0.14)).toBe(0.14);
    expect(ffx2Shot(stage, stage.camera, 'enemy', 0.06, 'bahamut')).toBe('enemy');
  });
});

describe('A-1: the FFX-2 wait camera', () => {
  it('falls back to action when the side rig loses the boss or cuts a girl', async () => {
    const { stage, moments, asked } = setup({ enemy: { fits: false, maxPush: 1 }, action: { fits: true, maxPush: 1 } }, true);
    await moments.actionOpen('bahamut', 'attack');
    expect(stage.calls).toContain('camera:action');
    expect(stage.calls).not.toContain('camera:enemy');
    // Party at 90% plus the enemy in play at 75%.
    const q = asked.find((a) => a.rig === 'enemy')!;
    expect(q.n).toBe(3);
    expect(FFX2_BOSS_MIN).toBe(0.75);
  });

  it('falls back to idle when action does not fit either', async () => {
    const { stage, moments } = setup({ enemy: { fits: false, maxPush: 1 }, action: { fits: false, maxPush: 1 } }, true);
    await moments.actionOpen('bahamut', 'attack');
    expect(stage.calls).toContain('camera:idle');
  });

  it('treats a rig whose push would have to stop short as not fitting', () => {
    const { stage } = setup({ party: { fits: true, maxPush: 0.01 } }, true);
    expect(ffx2Shot(stage, stage.camera, 'party', 0.06, 'bahamut')).toBe('action');
  });

  it('does not cut to a target rig that fails on impact', async () => {
    const { stage, moments } = setup({ party: { fits: false, maxPush: 1 }, action: { fits: false, maxPush: 1 } }, true);
    await moments.actionOpen('bahamut', 'attack');
    stage.calls.length = 0;
    moments.impact('yuna', { hitIndex: 0 });
    expect(stage.calls.some((c) => c.startsWith('camera!:party'))).toBe(false);
  });

  it('is FFX-2 only: FFX keeps the side rig and the impact cut', async () => {
    const { stage, moments } = setup({ enemy: { fits: false, maxPush: 1 }, party: { fits: false, maxPush: 1 } }, false);
    await moments.actionOpen('bahamut', 'attack');
    expect(stage.calls).toContain('camera:enemy');
    moments.impact('yuna', { hitIndex: 0 });
    expect(stage.calls).toContain('camera!:party');
  });
});

describe('A-1: the push on the fallback keeps the enemy in play too', () => {
  it('asks the camera with the boss among the subjects', async () => {
    const { moments, asked, pushes } = setup({ enemy: { fits: false, maxPush: 1 }, action: { fits: false, maxPush: 1 }, idle: { fits: true, maxPush: 0 } }, true);
    await moments.actionOpen('bahamut', 'attack');
    const idleAsk = asked.filter((a) => a.rig === 'idle');
    expect(idleAsk.length).toBeGreaterThan(0);
    expect(idleAsk.every((a) => a.n === 3)).toBe(true);
    expect(pushes()).toEqual(['camera:push=0.00']);
  });
});

describe('A-12: an upright phone keeps the fight on its refitted master (both games)', () => {
  function phoneSetup(slice: number | null) {
    const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux']);
    const fitted: Array<{ rig: string; slice: number; n: number }> = [];
    (stage.camera as { fitSlice?: unknown }).fitSlice = (rig: string, s: number, subjects: unknown[]) => {
      fitted.push({ rig, slice: s, n: subjects.length });
      return true;
    };
    const overlay = { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => slice };
    const moments = new BattleMoments({ stage, moments: overlay, sleep: noSleep, speed: () => 'normal' });
    return { stage, moments, fitted };
  }

  it('refits the master to the slice at the battle start, for everyone on the field', async () => {
    const { moments, fitted } = phoneSetup(0.42);
    await moments.battleStart({ partyIds: ['tidus', 'yuna'] });
    expect(fitted).toEqual([{ rig: 'idle', slice: 0.42, n: 3 }]);
  });

  it('leaves out a figure its scene marked with PHONE_FIT_KEY (Chapter VIII\'s Evrae, FFX only) and fits the rest', async () => {
    const { stage, moments, fitted } = phoneSetup(0.42);
    (stage.actors.get('seymour-flux') as unknown as { userData?: Record<string, unknown> }).userData = { [PHONE_FIT_KEY]: false };
    await moments.battleStart({ partyIds: ['tidus', 'yuna'] });
    expect(fitted).toEqual([{ rig: 'idle', slice: 0.42, n: 2 }]);
  });

  it('keeps a figure whose mark is anything but false in the fit', async () => {
    const { stage, moments, fitted } = phoneSetup(0.42);
    (stage.actors.get('seymour-flux') as unknown as { userData?: Record<string, unknown> }).userData = { [PHONE_FIT_KEY]: true, other: false };
    await moments.battleStart({ partyIds: ['tidus', 'yuna'] });
    expect(fitted).toEqual([{ rig: 'idle', slice: 0.42, n: 3 }]);
  });

  it('plays actions and impacts on the master with no push', async () => {
    const { stage, moments } = phoneSetup(0.42);
    await moments.battleStart({});
    stage.calls.length = 0;
    await moments.actionOpen('tidus', 'attack', ['seymour-flux']);
    moments.impact('seymour-flux', { hitIndex: 0 });
    expect(stage.calls.filter((c) => /^camera!?:(party|enemy|action)$/.test(c))).toEqual([]);
    expect(stage.calls).toContain('camera:push=0.00');
  });

  it('changes nothing off the phone', async () => {
    const { stage, moments, fitted } = phoneSetup(null);
    await moments.battleStart({});
    await moments.actionOpen('tidus', 'attack', ['seymour-flux']);
    expect(fitted).toEqual([]);
    expect(stage.calls).toContain('camera:party');
  });
});
