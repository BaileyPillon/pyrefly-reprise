/**
 * Bailey, 2026-10-10, playing the Leblanc chapter on the live build 39.4.3: "the music and sound effects are atrocious. it also sounds
 * like 2 different sound tracks are playing at once?"
 *
 * Measured on the live build (`D:/Tools/pyrefly-scratch/2026-10-10/leblanc-audio`): the music slot never holds two tracks past a crossfade,
 * but the presenter's `victory` beat played the first-bank `victory-fanfare` (3.4 s, B major, as loud as the score) at the end of EVERY
 * formation of a chained encounter. Chapter VI (and the hidden experimental Leblanc, which plays it by reference) chains three acts on
 * one battle theme (`boss-ffx2-aeon`, Bb minor), so the fanfare lay over the theme twice mid-fight and once more over the last link's
 * theme (which `BattleScreen.exit` only stops ~2.8 s later): a second tune a semitone off the first.
 *
 * Pinned here: a formation that chains on plays the victory pose and the camera settle but no sting and leaves the theme alone;
 * the last formation takes the theme out under the sting; the flag is per run (the chain re-uses one presenter), and 'hold' is untouched.
 *
 * Game case: both (shared plumbing, CHK-020). Affects every chained encounter that is not 'hold': FFX-2 Chapter VI (three acts) and the
 * experimental Leblanc, and any FFX chain whose chapter strikes the pose. FFX-2 Chapters IV, V, XIII and FFX Chapter II are 'hold' and
 * were already quiet. Whether the pose itself should be held at a seam is `research/ffx-vs-ffx2-presentation.md` §14 item 10 and stays
 * open (this change touches the sound only).
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { attackStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { VictoryPose } from '../../src/engine/VictoryPose.ts';
import { FakeEngine } from './helpers/FakeEngine.ts';
import { FakeAudio, FakeStage, noSleep } from './helpers/FakeStage.ts';

function rig(victoryPose?: VictoryPose) {
  const stage = new FakeStage(['yuna', 'rikku-x2', 'paine'], ['ormi-entrance']);
  const audio = new FakeAudio();
  const presenter = new BattlePresenter({ stage, audio, sleep: noSleep, ...(victoryPose ? { victoryPose } : {}) });
  presenter.setAutoPlay(attackStrategy);
  return { stage, audio, presenter };
}

describe('the victory sting is the end of the fight, not the end of a link', () => {
  it('the last formation plays the sting and takes the battle theme out under it', async () => {
    const { audio, presenter } = rig();
    const outcome = await presenter.run(new FakeEngine({ enemyHp: 2400 }), { moreLinks: false });
    expect(outcome.kind).toBe('victory');
    expect(audio.cues).toContain('victory-fanfare');
    expect(audio.music.at(-1)).toBe('stop'); // the theme goes out as the sting begins
    expect(audio.fades.at(-1)).toBeLessThanOrEqual(0.5);
  });

  it('a formation that chains on plays no sting, leaves the theme running, and still poses and settles the camera', async () => {
    const { stage, audio, presenter } = rig();
    await presenter.run(new FakeEngine({ enemyHp: 2400 }), { moreLinks: true });
    expect(audio.cues).not.toContain('victory-fanfare');
    expect(audio.music).not.toContain('stop');
    expect(stage.calls).toContain('pose=victory:yuna');
    expect(stage.calls).toContain('camera:victory');
  });

  it('no link is told anything by default: a lone encounter keeps its sting (every chapter without a chain)', async () => {
    const { audio, presenter } = rig();
    await presenter.run(new FakeEngine({ enemyHp: 2400 }));
    expect(audio.cues).toContain('victory-fanfare');
  });

  it('the flag is per run: the chain re-uses one presenter, and the third act ends with its sting', async () => {
    const { audio, presenter } = rig();
    await presenter.run(new FakeEngine({ enemyHp: 2400 }), { moreLinks: true }); // Act I
    await presenter.run(new FakeEngine({ enemyHp: 2400 }), { moreLinks: true }); // Act II
    expect(audio.cues.filter((c) => c === 'victory-fanfare')).toHaveLength(0);
    await presenter.run(new FakeEngine({ enemyHp: 2400 }), { moreLinks: false }); // Act III
    expect(audio.cues.filter((c) => c === 'victory-fanfare')).toHaveLength(1);
  });

  it("'hold' is unchanged: no sting at all, and the theme is not stopped by the beat", async () => {
    const { audio, presenter } = rig('hold');
    await presenter.run(new FakeEngine({ enemyHp: 2400 }), { moreLinks: false });
    expect(audio.cues).not.toContain('victory-fanfare');
    expect(audio.music).not.toContain('stop');
  });
});
