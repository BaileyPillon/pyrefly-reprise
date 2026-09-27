/**
 * PR-0138: a chained FFX-2 chapter's results carry every battle's spoils, not the last link's.
 * **FFX-2 only** (AGENTS.md rule 14): FFX's chains grant their rewards once, at the end
 * (`research/ffx-yunalesca.md` line 94), so an FFX chain keeps its last result byte for byte.
 * Proven by running the engine (hard rule 3): the per-link results come from real victories.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleResult } from '../../src/battle/common/types.ts';
import { chainSpoils } from '../../src/app/screens/BattleChainSpoils.ts';
import { driveChapter5 } from './helpers/ffx2ChapterDrive.ts';
import { driveChain as driveRoad, LINES as ROAD } from './helpers/fallenAeonsDrive.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { chainLengthOf, runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import type { BattleOutcome, BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { getChapter } from '../../src/data/encounters.ts';

function victories(logs: ReadonlyArray<readonly BattleEvent[]>): BattleResult[] {
  return logs.map((log) => {
    const v = log.find((e) => e.type === 'victory');
    if (!v || v.type !== 'victory') throw new Error('a link did not end in victory');
    return v.result;
  });
}

function ledger(game: 'ffx' | 'ffx2', results: BattleResult[]): BattleResult {
  return chainSpoils(game, results.slice(0, -1), results[results.length - 1]!);
}

describe('PR-0138: FFX-2 chain spoils (FFX-2 only)', () => {
  it('Chapter V: the results sum all five battles, Tail to Shuyin (the engine\'s own per-link results)', () => {
    const run = driveChapter5(1, 0);
    expect(run.outcome).toBe('victory');
    const links = victories(run.logs);
    expect(links).toHaveLength(5);
    const total = ledger('ffx2', links);
    // Tail 5,000 / 5 / 3,000 (research line 203) is in it, and Shuyin's 20 AP (line 435).
    expect(links[0]).toMatchObject({ exp: 5000, ap: 5, gil: 3000 });
    expect(links[4]).toMatchObject({ exp: 0, ap: 20, gil: 0 });
    expect(total.exp).toBe(links.reduce((t, r) => t + r.exp, 0));
    expect(total.gil).toBe(links.reduce((t, r) => t + r.gil, 0));
    expect(total.ap).toBe(links.reduce((t, r) => t + r.ap, 0));
    expect(total.drops).toHaveLength(links.reduce((t, r) => t + r.drops.length, 0));
    expect(total.exp).toBeGreaterThan(links[4]!.exp); // it used to read Shuyin's 0 EXP
    // Everything else stays the last link's (turns, time), so the flow's timing is untouched.
    expect(total.turns).toBe(links[4]!.turns);
    expect(total.elapsedMs).toBe(links[4]!.elapsedMs);
  });

  it('Chapter XI: the results include Shiva\'s 8,000 EXP and 2,000 gil (research ffx2-fallen-aeons §3.1)', () => {
    const run = driveRoad([ROAD.shivaIntended, ROAD.sistersDarknessDispel, ROAD.animaIntended], 1, {});
    expect(run.outcome).toBe('victory');
    const links = victories(run.links.map((l) => l.log));
    expect(links[0]).toMatchObject({ exp: 8000, gil: 2000 });
    const total = ledger('ffx2', links);
    expect(total.exp).toBe(8000 + links[1]!.exp + 6000);
    expect(total.gil).toBe(2000 + links[1]!.gil + 2000);
    expect(total.drops.map((d) => d.itemId)).toContain('tetra-band');
    expect(total.drops.map((d) => d.itemId)).toContain('crystal-gloves');
  });

  it('an FFX chain (Chapters II and III) keeps its last result exactly', () => {
    const a = { outcome: 'victory', exp: 0, ap: 100, gil: 5, drops: [{ itemId: 'x', count: 1 }] } as unknown as BattleResult;
    const b = { outcome: 'victory', exp: 0, ap: 7, gil: 9, drops: [] } as unknown as BattleResult;
    expect(chainSpoils('ffx', [a], b)).toBe(b);
  });

  it('a single FFX-2 battle is its own result', () => {
    const b = { outcome: 'victory', exp: 1, ap: 2, gil: 3, drops: [] } as unknown as BattleResult;
    expect(chainSpoils('ffx2', [], b)).toBe(b);
  });
});

describe('PR-0138 in the chain loop: runEncounterChain hands the flow the summed result', () => {
  async function run(chapterId: string, results: BattleResult[]): Promise<BattleResult | undefined> {
    await registerBattleContent();
    const chapter = getChapter(chapterId)!;
    const setup = setupForChapter(chapter, 7);
    const engine = chapter.game === 'ffx2' ? new FFX2Engine({ ...ffx2EngineOptions(), minigames: false }) : createFFXEngine();
    engine.setSeed(setup.seed);
    engine.init(setup);
    const queue = [...results];
    const presenter = {
      syncHud: () => {},
      run: async (): Promise<BattleOutcome> => ({ kind: 'victory', result: queue.shift()! }),
    } as unknown as BattlePresenter;
    const out = await runEncounterChain({
      chapter, presenter, engine, stage: { stage: async () => {} }, group: chapter.enemyGroupRef, setup, seed: 7,
      findGroup: findEnemyGroup, saveSphere: async (swap) => { await swap(); },
    });
    return out.outcome.kind === 'victory' ? out.outcome.result : undefined;
  }
  const r = (exp: number, gil: number, ap: number): BattleResult =>
    ({ outcome: 'victory', exp, gil, ap, drops: [], turns: 1, elapsedTicks: 0, elapsedMs: 0, overkilled: [], sphereLevelsGained: {} }) as BattleResult;

  it('Chapter XI (FFX-2): three wins, one summed ledger', async () => {
    const out = await run('ffx2-fallen-aeons', [r(8000, 2000, 15), r(9000, 3000, 24), r(6000, 2000, 15)]);
    expect(out).toMatchObject({ exp: 23000, gil: 7000, ap: 54 });
  });

  it('Chapter III (FFX): the last link\'s result, unchanged', async () => {
    const chapter = getChapter('braskas-final-aeon')!;
    const links = await chainLengthOf(chapter.enemyGroupRef, findEnemyGroup);
    const results = Array.from({ length: links }, (_, i) => r(0, 10 * (i + 1), 1));
    const out = await run('braskas-final-aeon', results);
    expect(out).toBe(results[results.length - 1]);
  });
});
