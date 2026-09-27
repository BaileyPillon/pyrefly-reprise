/**
 * PR-0138 after a checkpoint retry (iteration 2 B5; the open item 3 of docs/handoff/iter2-b1.md):
 * a retry at a Save Sphere (XI) or at Shuyin (V, D-217) starts a new ledger, so the results
 * showed only the retried links' spoils (EXP 0 after a Shuyin retry). The checkpoint now carries
 * the spoils of the links won before it, and the retry hands them back to the chain.
 * **FFX-2 only** (AGENTS.md rule 14): only FFX-2 chains make checkpoints or sum spoils.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { resumeSetup, type ChainCheckpoint } from '../../src/app/screens/BattleChainCheckpoint.ts';
import type { BattleOutcome, BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { getChapter } from '../../src/data/encounters.ts';

const r = (exp: number, gil: number, ap: number): BattleResult =>
  ({ outcome: 'victory', exp, gil, ap, drops: [], turns: 1, elapsedTicks: 0, elapsedMs: 0, overkilled: [], sphereLevelsGained: {} }) as BattleResult;

describe('PR-0138: a checkpoint retry carries the earlier links\' spoils (FFX-2 only)', () => {
  it('Chapter XI: lose at Anima, retry at the Save Sphere, win: Shiva and the Sisters are in the total', async () => {
    await registerBattleContent();
    const chapter = getChapter('ffx2-fallen-aeons')!;
    const setup = setupForChapter(chapter, 7);
    const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    engine.setSeed(setup.seed);
    engine.init(setup);

    // Attempt 1: Shiva and the Sisters won, Anima lost.
    const first: BattleOutcome[] = [
      { kind: 'victory', result: r(8000, 2000, 15) },
      { kind: 'victory', result: r(9000, 3000, 24) },
      { kind: 'defeat', result: r(0, 0, 0) } as unknown as BattleOutcome,
    ];
    let seen: ChainCheckpoint | null = null;
    const presenter1 = { syncHud: () => {}, run: async () => first.shift()! } as unknown as BattlePresenter;
    const lost = await runEncounterChain({
      chapter, presenter: presenter1, engine, stage: { stage: async () => {} }, group: chapter.enemyGroupRef, setup, seed: 7,
      findGroup: findEnemyGroup, saveSphere: async (swap) => { await swap(); },
      onLink: (info) => { seen = info.checkpoint ?? seen; },
    });
    expect(lost.outcome.kind).toBe('defeat');
    const cp = lost.checkpoint!;
    expect(cp.link).toBe(3);
    expect(cp.won?.map((x) => x.exp)).toEqual([8000, 9000]);
    expect(seen).toEqual(cp);

    // Attempt 2: retry at Anima with the carried ledger.
    const presenter2 = { syncHud: () => {}, run: async (): Promise<BattleOutcome> => ({ kind: 'victory', result: r(6000, 2000, 15) }) } as unknown as BattlePresenter;
    const retry = resumeSetup(cp, 1007);
    engine.setSeed(retry.seed);
    engine.init(retry);
    const won = await runEncounterChain({
      chapter, presenter: presenter2, engine, stage: { stage: async () => {} }, group: cp.group, setup: retry, seed: 1007,
      findGroup: findEnemyGroup, startLink: cp.link, priorWon: cp.won ?? [],
    });
    expect(won.outcome.kind).toBe('victory');
    const result = won.outcome.kind === 'victory' ? won.outcome.result : null;
    expect(result).toMatchObject({ exp: 23000, gil: 7000, ap: 54 });
  });

  it('the battle screen passes the checkpoint\'s ledger into the chain', () => {
    const src = readFileSync('src/app/screens/BattleScreen.ts', 'utf8');
    expect(src).toMatch(/priorWon: this\.opts\.resumeAt\?\.won \?\? \[\]/);
    expect(src).toMatch(/this\.checkpoint = checkpoint \?\? this\.checkpoint/);
  });
});
