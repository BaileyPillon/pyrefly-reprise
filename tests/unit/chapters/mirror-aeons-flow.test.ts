/**
 * **The hidden Mirror Aeons chapter through the real chain loop** (`runEncounterChain`, the real FFX engine, the real `BattlePresenter` and the shipped advisor line, against fake ports; FFX only): the two acts chain
 * with no results screen between them, the seam plays between them, each act is scored by its own cue, the spoils are paid together, and Act II is the retry checkpoint. **Until the reverse-engineering session's
 * Dark AI lands the enemies play the engine's fallback (a plain Attack), so a win here says nothing about difficulty**; what is pinned is the plumbing.
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
import { getChapter } from '../../../src/data/encounters.ts';
import { darkAeonsGroupOf } from '../../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { MIRROR_ACT_I, MIRROR_ACT_II, MIRROR_ACT_II_GROUP, MIRROR_ACT_II_PLATE, MIRROR_AEONS_ID, MIRROR_SEAM } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { FakeAudio, FakeCutscenes, FakeStage } from '../helpers/FakeStage.ts';
import { setCappedAutoPlay } from '../helpers/presenterCap.ts';

const chapter = getChapter(MIRROR_AEONS_ID)!;
const act1 = darkAeonsGroupOf(MIRROR_ACT_I);
const act2 = darkAeonsGroupOf(MIRROR_ACT_II);

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
  return { result, music: audio.music, scripts: cutscenes.played, restaged };
}

describe('the chain: two acts, no results screen between them', () => {
  it("the advisor's line wins both on a fixed seed, and the chain fought two formations, re-staged once", async () => {
    const { result, restaged } = await play(1);
    expect(result.outcome.kind).toBe('victory');
    expect(result.links).toBe(2);
    expect(restaged).toBe(1);
  });

  it("the seam plays once, between the acts (the sisters' fall, a white-out, the cavern)", async () => {
    const { scripts } = await play(1);
    const seam = chapter.scriptsRef.midScripts[MIRROR_SEAM]!;
    expect(scripts.filter((s) => s === seam)).toHaveLength(1);
  });

  it("Act I is scored by the generic boss cue and Act II by Yojimbo's own, each from the formation's own cue", async () => {
    expect(cueForGroup(chapter, act1, 'first').track).toBe('boss-challenge');
    expect(cueForGroup(chapter, act2, 'next').track).toBe('boss-yojimbo');
    const { music } = await play(1);
    expect(music[0]).toBe('boss-challenge');
    expect(music).toContain('boss-yojimbo');
  });

  it("the spoils are paid together: the four Dark Aeons' AP (10,000 a sister and 8,000 for Yojimbo), no gil, a Dark Matter or a Master Sphere from each of the four slots, and a row for everyone who fought", async () => {
    const { result } = await play(1);
    if (result.outcome.kind !== 'victory') throw new Error('not won');
    const r = result.outcome.result;
    expect(r.gil).toBe(0);
    expect(r.ap).toBeGreaterThanOrEqual(38_000);
    const dropped = r.drops.filter((d) => d.itemId === 'dark-matter' || d.itemId === 'master-sphere').reduce((n, d) => n + d.count, 0);
    expect(dropped).toBeGreaterThanOrEqual(4);
    expect(Object.keys(r.turnsTaken ?? {})).toEqual(expect.arrayContaining(['tidus', 'yuna', 'lulu']));
  });

  it('Act II is the retry checkpoint, entered on the party Act I ended with; the first act makes none', async () => {
    const { result } = await play(1);
    expect(result.checkpoint).not.toBeNull();
    expect(result.checkpoint!.link).toBe(2);
    expect(result.checkpoint!.group.id).toBe(MIRROR_ACT_II_GROUP);
    expect(result.checkpoint!.group.plate).toBe(MIRROR_ACT_II_PLATE);
    expect(checkpointAt(1, act1, setupForChapter(chapter, 1))).toBeNull();
  });
});

describe('a defeat in the cavern retries the cavern, not the road', () => {
  it('the party that only defends is beaten (the fallback enemy wears it down), and the chain keeps Act II as its checkpoint', async () => {
    // A party that never acts cannot win either act: Act I is lost first, so the checkpoint belongs to a run that reached Act II. Start AT Act II instead.
    const first = setupForChapter(chapter, 3);
    const checkpoint = { group: act2, setup: { ...first, enemies: act2 }, link: 2 };
    const retry = resumeSetup(checkpoint, 5);
    const { result } = await play(5, { startLink: 2, setup: retry, strategy: defendStrategy });
    expect(result.outcome.kind).toBe('defeat');
    expect(result.links).toBe(2); // the chain resumed at link 2 (the count is the link's number) and fought that one formation, never going back to the road
  });

  it("a retry resumed at the checkpoint is winnable with the advisor's line, and fights Act II alone", async () => {
    const first = setupForChapter(chapter, 4);
    const checkpoint = { group: act2, setup: { ...first, enemies: act2 }, link: 2 };
    const retry = resumeSetup(checkpoint, 9);
    const { result } = await play(9, { startLink: 2, setup: retry });
    expect(result.outcome.kind).toBe('victory');
  });
});
