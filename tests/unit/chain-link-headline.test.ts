/**
 * **PR-0205 (round 13, R13-FN-02): a chain link may carry its own headline.**
 *
 * FFX-2 only (Chapter XI). The push onto the Road's second platform put the
 * reveal plate "Sandy" over a three-sister formation, because the opening names
 * the formation's first enemy. A formation (`EnemyGroupDef.headline`, optional
 * and additive) now names itself, and the presenter's opening prefers it. Every
 * formation without one is unchanged: the first enemy's name, as before.
 *
 * Proved by running the real chain loop, the real presenter and the real FFX-2
 * engine from link 2 of Chapter XI, and reading the reveal plate's title.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import type { BattleState, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { roadAnimaGroup, roadShivaGroup, roadSistersGroup } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';

/** The reveal plate's titles, in order; the presenter is aborted after the first. */
async function revealTitlesFrom(group: EnemyGroupDef): Promise<string[]> {
  const chapter = getChapter('ffx2-fallen-aeons');
  if (!chapter) throw new Error('Chapter XI is not registered');
  const base = setupForChapter(chapter, 1);
  const setup = { ...base, enemies: group };
  await registerBattleContent();
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);

  const titles: string[] = [];
  let presenter: BattlePresenter | null = null;
  const moments: MomentsPort = {
    letterbox: async () => {},
    nameSlab: async (opts) => {
      if (opts.kind === 'reveal') {
        titles.push(opts.title);
        presenter?.abort();
      }
    },
    vignette: () => {},
    clear: () => {},
  };
  const stage = new FakeStage(
    setup.party.members.map((m) => m.id),
    group.enemies.map((e) => e.id),
  );
  presenter = new BattlePresenter({ stage, audio: new FakeAudio(), moments, sleep: () => Promise.resolve() });
  presenter.setSpeed('normal');
  await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: { stage: (_s: BattleState) => Promise.resolve() },
    group,
    setup,
    seed: 1,
    findGroup: findEnemyGroup,
    audio: new FakeAudio(),
    startLink: 2,
  });
  return titles;
}

describe('PR-0205: a chain link names itself on its seam (FFX-2, Chapter XI)', () => {
  it('the Sisters formation carries the headline "Magus Sisters"', () => {
    expect(roadSistersGroup.headline).toBe('Magus Sisters');
    // One enemy per link: the enemy's own name already reads right.
    expect(roadShivaGroup.headline).toBeUndefined();
    expect(roadAnimaGroup.headline).toBeUndefined();
  });

  it('the seam-2 reveal plate reads "Magus Sisters", not "Sandy"', async () => {
    const titles = await revealTitlesFrom(roadSistersGroup);
    expect(titles[0]).toBe('Magus Sisters');
  });

  it('a link with no headline still names its first enemy (Anima)', async () => {
    const titles = await revealTitlesFrom(roadAnimaGroup);
    expect(titles[0]).toBe('Anima');
  });
});
