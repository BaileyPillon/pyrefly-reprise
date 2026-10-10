/**
 * The same 2026-10-10 report as `presenter-victory-seam.test.ts`, one level up: the REAL engines, presenter and chain loop over Chapter VI's three
 * acts (and the hidden experimental Leblanc, which plays the same record by reference), with a recording audio port.
 *
 * Pinned: three acts, one battle theme, ONE sting (the last link's), the theme requested again at each seam but never replaced, and the theme taken
 * out exactly once, under the sting. The measured live build played the fanfare three times (twice over the running theme).
 *
 * Game case: FFX-2 only for this file's chapters (both games share the code under test; CHK-020).
 */
import { describe, expect, it } from 'vitest';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { BattleEngine } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

async function play(chapter: Chapter, seed: number) {
  const setup = setupForChapter(chapter, seed);
  await registerBattleContent();
  const engine: BattleEngine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const audio = new FakeAudio();
  const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
  const presenter = new BattlePresenter({ stage, audio, sleep: () => Promise.resolve() });
  presenter.setSpeed('skip');
  setCappedAutoPlay(presenter, intendedStrategy);
  const result = await runEncounterChain({ chapter, presenter, engine, stage: { stage: () => Promise.resolve() }, group: chapter.enemyGroupRef, setup, seed, findGroup: findEnemyGroup, audio });
  return { ...result, cues: audio.cues, music: audio.music };
}

describe.each(['ffx2-leblanc', 'exp-leblanc'])('%s: three acts, one battle theme, one sting', (id) => {
  it('plays the fanfare once (the last act), never over the running theme at a seam, and takes the theme out once, under it', async () => {
    const chapter = getChapter(id)!;
    const { outcome, links, cues, music } = await play(chapter, 1);
    expect(outcome.kind).toBe('victory');
    expect(links).toBe(3); // Act I entrance -> Act II Logos' room -> Act III the Last Room
    expect(cues.filter((c) => c === 'victory-fanfare')).toHaveLength(1);
    // The theme is requested at each link (a request for the cue already playing is a no-op in the AudioManager) and is never replaced by another cue.
    expect(new Set(music.filter((m) => m !== 'stop'))).toEqual(new Set([chapter.music.battle]));
    expect(music.filter((m) => m === 'stop')).toHaveLength(1);
    expect(music.at(-1)).toBe('stop');
  });
});
