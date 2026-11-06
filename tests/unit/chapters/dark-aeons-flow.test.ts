/**
 * **The hidden Dark Aeons chapter through the real chain loop** (`runEncounterChain`, the real FFX engine, the real `BattlePresenter` and the shipped advisor line, against fake ports; FFX only): the seven links chain with no
 * results screen between them, a seam plays after each fall but the last, each link is scored by its formation's cue, the spoils are paid together, and every link from the second on is a retry checkpoint, entered on a whole
 * party and whole aeons. How often the line wins is the bench's (`dark-aeons-bench.test.ts`); here the tests take a seed the line wins and what is pinned is the plumbing.
 */

import { describe, expect, it } from 'vitest';

import type { BattleSetup } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { defendStrategy, intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import type { AutoStrategy } from '../../../src/engine/BattlePresenterPorts.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { cueForGroup, runEncounterChain, type EncounterChainResult } from '../../../src/app/screens/BattleEncounterChain.ts';
import { CHAPTER_IDS, CHAPTERS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { CHAPTER_META, UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_AEONS_CHAPTER_ID, DARK_SIX_LINKS } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import { DARK_SIX_GROUPS } from '../../../src/data/ffx/enemies/dark-aeons-six-groups.ts';
import { DARK_SEAMS, DARK_CALLOUTS } from '../../../src/story/scripts/dark-aeons.ts';
import { FakeAudio, FakeCutscenes, FakeStage } from '../helpers/FakeStage.ts';
import { setCappedAutoPlay } from '../helpers/presenterCap.ts';

const chapter = getChapter(DARK_AEONS_CHAPTER_ID)!;

describe('the chapter is registered as a hidden experiment-class chapter', () => {
  it('number 34, FFX, experimental, found by getChapter and EXPERIMENT_CHAPTERS, on no card and in no count; its meta is the unlisted one', () => {
    expect(chapter).toMatchObject({ id: 'dark-aeons', game: 'ffx', number: 34, experimental: true, title: 'The Dark Aeons', sceneKey: 'dark-aeons' });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('dark-aeons');
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('dark-aeons');
    expect((CHAPTER_IDS as readonly string[]).includes('dark-aeons')).toBe(false);
    expect(CHAPTER_META.some((m) => m.id === 'dark-aeons')).toBe(false);
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === 'dark-aeons')).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', title: 'The Dark Aeons' });
  });

  it('the first group is Dark Valefor\'s, the build is the Dark Aeons\' (Tidus, Yuna, Auron), and the sensor lines name all seven foes', () => {
    expect(chapter.enemyGroupRef).toBe(DARK_SIX_GROUPS[0]);
    expect(chapter.buildRef).toBe(darkAeonsBuild);
    expect(Object.keys(chapter.sensorTexts).sort()).toEqual(['dark-anima', 'dark-bahamut', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-valefor']);
    for (const link of DARK_SIX_LINKS) expect(chapter.sensorTexts[link.bodyId], link.key).toBe(DARK_SIX_GROUPS.find((g) => g.id === link.groupId)!.enemies[0]!.sensorText);
    expect(darkAeonsBuild.activeSlots).toEqual(['tidus', 'yuna', 'auron']);
    expect(darkAeonsBuild.reserve).toEqual(['lulu', 'wakka', 'kimahri', 'rikku']);
    expect(darkAeonsBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo', 'cindy', 'sandy', 'mindy', 'anima']);
  });

  it('the music is the mountain\'s bed under the scenes, the Challenge cue for the fights, Yojimbo\'s for the last, the FFX fanfare', () => {
    expect(chapter.music).toEqual({ scene: 'scene-gagazet', battle: 'boss-challenge', phase2: 'boss-yojimbo', victory: 'victory-ffx' });
  });
});

/** Plays the chain from `startLink` on `setup`, `strategy` (the advisor's line by default) answering every menu. */
async function play(seed: number, opts: { startLink?: number; setup?: BattleSetup; strategy?: AutoStrategy } = {}): Promise<{ result: EncounterChainResult; music: string[]; scripts: unknown[]; restaged: number }> {
  await registerBattleContent();
  const first = opts.setup ?? setupForChapter(chapter, seed);
  const group = (opts.startLink ?? 1) > 1 ? first.enemies : chapter.enemyGroupRef;
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(first.seed);
  engine.init(first);
  const audio = new FakeAudio();
  const cutscenes = new FakeCutscenes();
  const stage = new FakeStage(first.party.members.map((m) => m.id), ['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-anima', 'dark-bahamut']);
  const presenter = new BattlePresenter({ stage, audio, sleep: () => Promise.resolve(), cutscenes, midScripts: chapter.scriptsRef.midScripts });
  presenter.setSpeed('skip');
  setCappedAutoPlay(presenter, opts.strategy ?? intendedStrategy);
  let restaged = 0;
  const result = await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: { stage: () => { restaged++; return Promise.resolve(); } },
    group,
    setup: first,
    seed,
    startLink: opts.startLink ?? 1,
    findGroup: findEnemyGroup,
    audio,
  });
  return { result, music: audio.music, scripts: cutscenes.played, restaged };
}

/** A seed the advisor's line wins the whole chain on: the first of the first sixty. These tests pin the plumbing, not how often the line wins (the bench's), so they ask for a winning seed instead of fixing one an engine change could flip. */
let winner: number | undefined;
async function winningSeed(): Promise<number> {
  if (winner !== undefined) return winner;
  for (let seed = 1; seed <= 60; seed++) {
    if ((await play(seed)).result.outcome.kind === 'victory') return (winner = seed);
  }
  throw new Error('the advisor line wins none of the first sixty seeds');
}

describe('the chain: seven links, no results screen between them', () => {
  it('the advisor\'s line wins all seven on a winning seed: seven formations fought, re-staged six times (a plate swap each)', async () => {
    const { result, restaged } = await play(await winningSeed());
    expect(result.outcome.kind).toBe('victory');
    expect(result.links).toBe(7);
    expect(restaged).toBe(6);
  });

  it('every seam plays once, after its fall: six scripts for the six links that have a next one; the last foe\'s fall is the post scene', async () => {
    const { scripts } = await play(await winningSeed());
    for (const id of Object.values(DARK_SEAMS)) expect(scripts.filter((s) => s === chapter.scriptsRef.midScripts[id]), id).toHaveLength(1);
    // The callouts play when a foe's gauge fills; they are at most once each (a line that never lets one fill plays none).
    for (const id of Object.values(DARK_CALLOUTS)) expect(scripts.filter((s) => s === chapter.scriptsRef.midScripts[id]).length, id).toBeLessThanOrEqual(1);
  });

  it('each link is scored by its formation\'s cue: the Challenge cue for the first six, Yojimbo\'s for the last', async () => {
    DARK_SIX_GROUPS.forEach((g, i) => expect(cueForGroup(chapter, g, i === 0 ? 'first' : 'next').track, g.id).toBe(i === 6 ? 'boss-yojimbo' : 'boss-challenge'));
    const { music } = await play(await winningSeed());
    expect(music[0]).toBe('boss-challenge');
    expect(music).toContain('boss-yojimbo');
  });

  it('the spoils are paid together: all seven AP (150,000, no gil) and a Dark Matter or a Master Sphere from each of the seven slots', async () => {
    const { result } = await play(await winningSeed());
    if (result.outcome.kind !== 'victory') throw new Error('not won');
    const r = result.outcome.result;
    expect(r.gil).toBe(0);
    expect(r.ap).toBeGreaterThanOrEqual(150_000);
    const dropped = r.drops.filter((d) => d.itemId === 'dark-matter' || d.itemId === 'master-sphere').reduce((n, d) => n + d.count, 0);
    expect(dropped).toBeGreaterThanOrEqual(7);
    expect(Object.keys(r.turnsTaken ?? {})).toEqual(expect.arrayContaining(['tidus', 'yuna', 'auron']));
  });
});

describe('every link from the second on is a retry checkpoint, entered through the heal; the first makes none', () => {
  it('the chain\'s last checkpoint is link 7 (Dark Bahamut\'s), on its plate, with the party and the aeons restored on entry', async () => {
    const { result } = await play(await winningSeed());
    expect(result.checkpoint).not.toBeNull();
    expect(result.checkpoint!.link).toBe(7);
    expect(result.checkpoint!.group.id).toBe('dark-aeons-bahamut');
    expect(result.checkpoint!.group.plate).toBe('zanarkand-dome');
    expect(result.checkpoint!.group.restoresPartyOnEntry).toBe(true);
    expect(result.checkpoint!.group.restoresAeonsOnEntry).toBe(true);
    expect(checkpointAt(1, DARK_SIX_GROUPS[0]!, setupForChapter(chapter, 1))).toBeNull();
    for (let link = 2; link <= 7; link++) expect(checkpointAt(link, DARK_SIX_GROUPS[link - 1]!, setupForChapter(chapter, 1)), `link ${link}`).not.toBeNull();
  });

  it('a retry at any checkpoint, whatever state the link before left, opens on a whole party and whole aeons', async () => {
    const first = setupForChapter(chapter, 3);
    for (let link = 2; link <= 7; link++) {
      const group = DARK_SIX_GROUPS[link - 1]!;
      const checkpoint = checkpointAt(link, group, { ...first, enemies: group })!;
      const retry = resumeSetup(checkpoint, 7);
      for (const m of retry.party.members) (m as { hp?: number }).hp = 5; // whatever the link before left
      const engine = new FFXEngine({ autoResolveMinigames: true });
      engine.setSeed(retry.seed);
      engine.init(retry);
      const state = engine.state();
      for (const id of state.activeIds) expect(state.combatants[id]!.hp, `link ${link}: ${id}`).toBe(state.combatants[id]!.stats.maxHp);
      for (const a of darkAeonsBuild.aeons) expect(state.combatants[a.id]!.hp, `link ${link}: ${a.id}`).toBe(state.combatants[a.id]!.stats.maxHp);
    }
  });
});

describe('a defeat retries the link it was lost on', () => {
  it('a party that only defends is beaten on the first link and the chain stops there (a defeat on link 1 starts the chapter over)', async () => {
    const { result } = await play(5, { strategy: defendStrategy });
    expect(result.outcome.kind).toBe('defeat');
    expect(result.links).toBe(1);
  });

  it('started AT link 5 (the checkpoint), the same party is beaten there and the chain never goes back to the road', async () => {
    const first = setupForChapter(chapter, 3);
    const group = DARK_SIX_GROUPS[4]!;
    const retry = resumeSetup(checkpointAt(5, group, { ...first, enemies: group })!, 5);
    const { result } = await play(5, { startLink: 5, setup: retry, strategy: defendStrategy });
    expect(result.outcome.kind).toBe('defeat');
    expect(result.links).toBe(5);
  });

  it('a retry resumed at link 5 is winnable with the advisor\'s line, and goes on to link 6', async () => {
    let reached = 0;
    for (let seed = 1; seed <= 12 && reached === 0; seed++) {
      const first = setupForChapter(chapter, seed);
      const group = DARK_SIX_GROUPS[4]!;
      const retry = resumeSetup(checkpointAt(5, group, { ...first, enemies: group })!, seed + 100);
      const { result } = await play(seed + 100, { startLink: 5, setup: retry });
      if (result.links >= 6) reached = result.links;
    }
    expect(reached).toBeGreaterThanOrEqual(6);
  });
});
