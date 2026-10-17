/**
 * **The hidden Mirror Aeons chapter through the real chain loop** (`runEncounterChain`, the real FFX engine, the real `BattlePresenter` and the shipped advisor line, against fake ports; FFX only): the two acts chain
 * with no results screen between them, the seam plays between them, each act is scored by its own cue, the spoils are paid together, and Act II is the retry checkpoint, entered on a whole party and whole aeons (the heal
 * between the acts). The Dark Aeons play their own scripts (`battle/ffx/ai/dark-aeons.ts`); how often the line wins is the bench's (`mirror-aeons-bench.test.ts`, held until RE's engine fixes land), here the tests take a
 * seed the line wins and what is pinned is the plumbing.
 */

import { describe, expect, it } from 'vitest';

import type { BattleSetup, Command } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { defendStrategy, intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import type { AutoStrategy } from '../../../src/engine/BattlePresenterPorts.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { cueForGroup, runEncounterChain, type EncounterChainResult } from '../../../src/app/screens/BattleEncounterChain.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { darkAeonsGroupOf } from '../../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { MIRROR_ACT_I, MIRROR_ACT_II, MIRROR_ACT_II_GROUP, MIRROR_ACT_II_PLATE, MIRROR_AEONS_ID, MIRROR_SEAM } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { FakeAudio, FakeCutscenes, FakeStage } from '../helpers/FakeStage.ts';
import { setCappedAutoPlay } from '../helpers/presenterCap.ts';

const chapter = getChapter(MIRROR_AEONS_ID)!;
const act1 = darkAeonsGroupOf(MIRROR_ACT_I);
const act2 = darkAeonsGroupOf(MIRROR_ACT_II);

/** Plays the chain from `startLink` on `setup`, `strategy` (the advisor's line by default) answering every menu. */
async function play(seed: number, opts: { startLink?: number; setup?: BattleSetup; strategy?: AutoStrategy } = {}): Promise<{ result: EncounterChainResult; music: string[]; scripts: unknown[]; restaged: number; stage: FakeStage }> {
  await registerBattleContent();
  const first = opts.setup ?? setupForChapter(chapter, seed);
  const group = (opts.startLink ?? 1) > 1 ? first.enemies : chapter.enemyGroupRef;
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(first.seed);
  engine.init(first);
  const audio = new FakeAudio();
  const cutscenes = new FakeCutscenes();
  const stage = new FakeStage(
    first.party.members.map((m) => m.id),
    [...act1.enemies, ...act2.enemies].map((e) => e.id),
  );
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
  return { result, music: audio.music, scripts: cutscenes.played, restaged, stage };
}

/**
 * A seed the advisor's line wins both acts on: the first of the first sixteen. These tests pin the plumbing, not how often the line wins (the bench's, and it is held until RE's engine fixes land), so they ask for a
 * winning seed instead of fixing one that an engine change could flip.
 */
let winner: number | undefined;
async function winningSeed(): Promise<number> {
  if (winner !== undefined) return winner;
  for (let seed = 1; seed <= 16; seed++) {
    if ((await play(seed)).result.outcome.kind === 'victory') return (winner = seed);
  }
  throw new Error('the advisor line wins none of the first sixteen seeds');
}

describe('the chain: two acts, no results screen between them', () => {
  it("the advisor's line wins both on a winning seed, and the chain fought two formations, re-staged once", async () => {
    const { result, restaged } = await play(await winningSeed());
    expect(result.outcome.kind).toBe('victory');
    expect(result.links).toBe(2);
    expect(restaged).toBe(1);
  });

  it("the seam plays once, between the acts (the sisters' fall, a white-out, the cavern)", async () => {
    const { scripts } = await play(await winningSeed());
    const seam = chapter.scriptsRef.midScripts[MIRROR_SEAM]!;
    expect(scripts.filter((s) => s === seam)).toHaveLength(1);
  });

  it("Act I is scored by the generic boss cue and Act II by Yojimbo's own, each from the formation's own cue", async () => {
    expect(cueForGroup(chapter, act1, 'first').track).toBe('boss-challenge');
    expect(cueForGroup(chapter, act2, 'next').track).toBe('boss-yojimbo');
    const { music } = await play(await winningSeed());
    expect(music[0]).toBe('boss-challenge');
    expect(music).toContain('boss-yojimbo');
  });

  it("the spoils are paid together: the three Dark Aeons' AP (10,000 for each of the pair and 8,000 for Yojimbo), no gil, a Dark Matter or a Master Sphere from each of the three slots, and a row for everyone who fought", async () => {
    const { result } = await play(await winningSeed());
    if (result.outcome.kind !== 'victory') throw new Error('not won');
    const r = result.outcome.result;
    expect(r.gil).toBe(0);
    expect(r.ap).toBeGreaterThanOrEqual(28_000);
    const dropped = r.drops.filter((d) => d.itemId === 'dark-matter' || d.itemId === 'master-sphere').reduce((n, d) => n + d.count, 0);
    expect(dropped).toBeGreaterThanOrEqual(3);
    expect(Object.keys(r.turnsTaken ?? {})).toEqual(expect.arrayContaining(['tidus', 'yuna', 'lulu']));
  });

  it('Act II is the retry checkpoint, entered through the heal between the acts; the first act makes none', async () => {
    const { result } = await play(await winningSeed());
    expect(result.checkpoint).not.toBeNull();
    expect(result.checkpoint!.link).toBe(2);
    expect(result.checkpoint!.group.id).toBe(MIRROR_ACT_II_GROUP);
    expect(result.checkpoint!.group.plate).toBe(MIRROR_ACT_II_PLATE);
    expect(result.checkpoint!.group.restoresPartyOnEntry).toBe(true);
    expect(result.checkpoint!.group.restoresAeonsOnEntry).toBe(true);
    expect(checkpointAt(1, act1, setupForChapter(chapter, 1))).toBeNull();
  });

  it('a retry at the checkpoint, whatever state Act I left, opens the cavern on a whole party and whole aeons (the engine applies the heal of the group when it builds the battle)', async () => {
    const { result } = await play(await winningSeed());
    const retry = resumeSetup(result.checkpoint!, 7);
    for (const m of retry.party.members) (m as { hp?: number }).hp = 5; // whatever Act I left
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(retry.seed);
    engine.init(retry);
    const state = engine.state();
    for (const id of state.activeIds) expect(state.combatants[id]!.hp, id).toBe(state.combatants[id]!.stats.maxHp);
    for (const a of mirrorAeonsBuild.aeons) expect(state.combatants[a.id]!.hp, a.id).toBe(state.combatants[a.id]!.stats.maxHp);
  });
});

describe("Yuna's three Magus Sisters on the stage", () => {
  it('arrive on the party\'s three spots, Sandy left, Cindy middle, Mindy right (not piled on one), and a lone aeon stands in the middle', async () => {
    const sisters: AutoStrategy = (actorId, commands) => {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Cindy');
      if (actorId === 'yuna' && summon) return { ...summon.command, targets: [] } as Command;
      const home = commands.find((c) => c.enabled && c.command.kind === 'dismiss');
      if (home) return { ...home.command, targets: [] } as Command;
      return { kind: 'defend', targets: [] } as Command;
    };
    const { stage } = await play(1, { strategy: sisters });
    expect([stage.summonSlots.get('sandy'), stage.summonSlots.get('cindy'), stage.summonSlots.get('mindy')]).toEqual([0, 1, 2]);
  });
});

describe('a defeat in the cavern retries the cavern, not the road', () => {
  it('the party that only defends is beaten (Dark Yojimbo wears it down), and the chain keeps Act II as its checkpoint', async () => {
    // A party that never acts cannot win either act: Act I is lost first, so the checkpoint belongs to a run that reached Act II. Start AT Act II instead.
    const first = setupForChapter(chapter, 3);
    const checkpoint = { group: act2, setup: { ...first, enemies: act2 }, link: 2 };
    const retry = resumeSetup(checkpoint, 5);
    const { result } = await play(5, { startLink: 2, setup: retry, strategy: defendStrategy });
    expect(result.outcome.kind).toBe('defeat');
    expect(result.links).toBe(2); // the chain resumed at link 2 (the count is the link's number) and fought that one formation, never going back to the road
  });

  it("a retry resumed at the checkpoint is winnable with the advisor's line (one of the first sixteen seeds), and fights Act II alone", async () => {
    let won = false;
    for (let seed = 1; seed <= 16 && !won; seed++) {
      const first = setupForChapter(chapter, seed);
      const checkpoint = { group: act2, setup: { ...first, enemies: act2 }, link: 2 };
      const retry = resumeSetup(checkpoint, seed + 100);
      const { result } = await play(seed + 100, { startLink: 2, setup: retry });
      won = result.outcome.kind === 'victory';
      if (won) expect(result.links).toBe(2);
    }
    expect(won).toBe(true);
  });
});
