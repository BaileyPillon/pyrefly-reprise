/**
 * A-4, the presenter side (FFX Ch II; FFX-2 Ch IV, V, XIII take 'hold' from
 * B5's chapter-meta): on 'hold' the figures keep their battle stance, the
 * victory cue stays quiet, and the camera still settles on the victory rig.
 * 'pose' (the default) is today's behaviour.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { VictoryPose } from '../../src/engine/VictoryPose.ts';
import { FakeAudio, FakeStage, noSleep } from './helpers/FakeStage.ts';

async function win(victoryPose?: VictoryPose) {
  const stage = new FakeStage(['yuna', 'rikku-x2', 'paine'], ['bahamut-x2']);
  const audio = new FakeAudio();
  const presenter = new BattlePresenter({ stage, audio, sleep: noSleep, ...(victoryPose ? { victoryPose } : {}) });
  await presenter.play([{ type: 'victory', seq: 0, result: { outcome: 'victory' } } as unknown as BattleEvent]);
  return { stage, audio };
}

describe("A-4 victory pose, presenter side", () => {
  it("poses by default, to the fanfare, on the victory rig", async () => {
    const { stage, audio } = await win();
    expect(stage.calls).toContain('pose=victory:yuna');
    expect(stage.calls).toContain('pose=victory:paine');
    expect(audio.cues).toContain('victory-fanfare');
    expect(stage.calls).toContain('camera:victory');
  });

  it("'pose' is the same as the default", async () => {
    const { stage, audio } = await win('pose');
    expect(stage.calls.filter((c) => c.startsWith('pose=victory'))).toHaveLength(3);
    expect(audio.cues).toContain('victory-fanfare');
  });

  it("'hold' keeps the battle stance and the cue quiet, and still settles the camera", async () => {
    const { stage, audio } = await win('hold');
    expect(stage.calls.some((c) => c.startsWith('pose=victory'))).toBe(false);
    expect(audio.cues).not.toContain('victory-fanfare');
    expect(stage.calls).toContain('camera:victory');
    for (const id of ['yuna', 'rikku-x2', 'paine']) expect(stage.actors.get(id)!.pose).toBe('idle');
  });
});
