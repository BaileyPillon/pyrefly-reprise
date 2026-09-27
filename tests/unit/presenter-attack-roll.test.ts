/**
 * A-13: the approved Ink & Gold per-attack camera roll (both games; the motion
 * spec is shared, presentation-ink-and-gold.md "Motion & camera": "-4deg roll
 * on every attack"). The roll lands on the attack's **first hit** and falls
 * back level, scaled by the playback speed, skipped at 'skip' and under
 * reduce-motion, and never awaited, so it adds 0 s to an action.
 */

import { describe, expect, it } from 'vitest';
import { BattleMoments, ATTACK_ROLL_DEG, MOMENT_TIMING } from '../../src/engine/BattleMoments.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { MomentsPort, PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

class Overlay implements MomentsPort {
  constructor(private readonly reduced = false) {}
  async letterbox(): Promise<void> {}
  async nameSlab(): Promise<void> {}
  vignette(): void {}
  clear(): void {}
  reduceMotion(): boolean {
    return this.reduced;
  }
}

function setup(opts: { speed?: PlaybackSpeed; reduced?: boolean } = {}) {
  const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux']);
  const rolls: Array<{ deg: number | undefined; ms: number | undefined }> = [];
  (stage.camera as { roll: (deg?: number, ms?: number) => Promise<void> }).roll = async (deg, ms) => {
    rolls.push({ deg, ms });
    stage.calls.push(`camera:roll=${deg ?? 0}`);
  };
  const moments = new BattleMoments({
    stage,
    moments: new Overlay(opts.reduced ?? false),
    sleep: noSleep,
    speed: () => opts.speed ?? 'normal',
  });
  return { stage, moments, rolls };
}

describe('A-13 attack roll', () => {
  it('does not roll on the swing, only on the first hit', async () => {
    const { moments, rolls } = setup();
    await moments.actionOpen('tidus', 'attack');
    expect(rolls).toHaveLength(0);
    moments.impact('seymour-flux', { hitIndex: 0 });
    expect(rolls).toEqual([{ deg: ATTACK_ROLL_DEG, ms: MOMENT_TIMING.returnOut }]);
  });

  it('rolls once for a multi-hit attack', async () => {
    const { moments, rolls } = setup();
    await moments.actionOpen('tidus', 'attack');
    for (let i = 0; i < 4; i++) moments.impact('seymour-flux', { hitIndex: i });
    expect(rolls).toHaveLength(1);
  });

  it('does not roll a spell, and a spell after an attack does not inherit it', async () => {
    const { moments, rolls } = setup();
    await moments.actionOpen('yuna', 'cast');
    moments.impact('seymour-flux', { hitIndex: 0 });
    await moments.actionOpen('tidus', 'attack');
    await moments.actionClose(); // the attack missed: no hit landed
    await moments.actionOpen('yuna', 'cast');
    moments.impact('seymour-flux', { hitIndex: 0 });
    expect(rolls).toHaveLength(0);
  });

  it('scales with the playback speed', async () => {
    const { moments, rolls } = setup({ speed: 'fast' });
    await moments.actionOpen('tidus', 'attack');
    moments.impact('seymour-flux', { hitIndex: 0 });
    expect(rolls).toHaveLength(1);
    expect(rolls[0]!.ms).toBeLessThan(MOMENT_TIMING.returnOut);
  });

  it("is skipped at 'skip' and under reduce-motion", async () => {
    for (const o of [{ speed: 'skip' as const }, { reduced: true }]) {
      const { moments, rolls } = setup(o);
      await moments.actionOpen('tidus', 'attack');
      moments.impact('seymour-flux', { hitIndex: 0 });
      expect(rolls).toHaveLength(0);
    }
  });

  it('adds no time to the action: the presenter never waits on the roll', async () => {
    const stage = new FakeStage(['tidus'], ['seymour-flux']);
    let rolled = 0;
    (stage.camera as { roll: () => Promise<void> }).roll = () => {
      rolled++;
      return new Promise<void>(() => {}); // never settles
    };
    const slept: number[] = [];
    const presenter = new BattlePresenter({ stage, moments: new Overlay(), sleep: async (ms) => void slept.push(ms) });
    const events = [
      { type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: ['seymour-flux'] }, targets: ['seymour-flux'] },
      { type: 'damage', targetId: 'seymour-flux', amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
      { type: 'action-end', actorId: 'tidus' },
    ].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
    await presenter.play(events);
    expect(rolled).toBe(1);
    const total = slept.reduce((a, b) => a + b, 0);
    // The same burst with no roll port at all sleeps exactly as long.
    const plain = new FakeStage(['tidus'], ['seymour-flux']);
    delete (plain.camera as { roll?: unknown }).roll;
    const slept2: number[] = [];
    await new BattlePresenter({ stage: plain, moments: new Overlay(), sleep: async (ms) => void slept2.push(ms) }).play(events);
    expect(total).toBe(slept2.reduce((a, b) => a + b, 0));
  });
});
