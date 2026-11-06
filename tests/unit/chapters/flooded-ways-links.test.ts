/**
 * The hidden Flooded Ways chapter through the real chain loop (FFX only): `runEncounterChain` itself, not a copy of it. The chain's position counter (`links`) is what the pause screen's "battle n of m", the objectives'
 * `link-reached` rule, the seeds and a retry checkpoint read; a skipped area (Evrae Altana fell in an earlier one) is a formation of the chain that was passed, so the counter moves over it
 * (`BattleScreenFloodedCarry.ts#skipSpentLinksCounted`, `BattleEncounterChain.ts`). Review finding M2 (the "Reach the Baaj Temple" row never ticked on the two-Phoenix-Down route) lived in exactly this gap: the other chain
 * tests replay the chain with their own helper. Here a scripted presenter plays the real engine through the real loop; nothing about the chain is mocked.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleResult, BattleState, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import type { BattleOutcome, BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { FLOODED_WAYS } from '../../../src/data/chapter-flooded-ways.ts';
import { FLOODED_WAYS_META } from '../../../src/data/chapter-meta-flooded-ways.ts';
import { FLOODED_LINKS, GEOSGAENO_ID } from '../../../src/data/ffx/flooded-ways-ids.ts';
import { chainLengthOf, runEncounterChain, type EncounterChainResult } from '../../../src/app/screens/BattleEncounterChain.ts';
import { skipSpentLinksCounted } from '../../../src/app/screens/BattleScreenFloodedCarry.ts';
import { encounterProgress, evaluateObjectives } from '../../../src/ui/common/chapterObjectives.ts';
import { content, groupOf, setup } from '../helpers/floodedDrive.ts';
import { evraeOrdinary, evraePhoenix, geosgaenoLine, type Line } from '../helpers/floodedBench.ts';

const find = async (id: string): Promise<EnemyGroupDef | null> => ENEMY_GROUPS_BY_ID[id] ?? null;

interface Seen {
  links: number;
  groupId: string;
  seed: number;
  checkpointLink: number | null;
  objectives: Record<string, boolean>;
  progress: string | undefined;
}

/**
 * A presenter that plays the real engine with a line and reports how it ended: only what the chain asks of one (`run`, `syncHud`, `isAborted`). The line for a link is the Evrae one while Evrae Altana is on the field and
 * the Geosgaeno one in the Baaj Temple.
 */
function scripted(evrae: Line, geosgaeno: Line): BattlePresenter {
  const presenter = {
    isAborted: false,
    syncHud(): void {},
    async run(engine: BattleEngine): Promise<BattleOutcome> {
      const line = engine.state().enemyIds.includes(GEOSGAENO_ID) ? geosgaeno : evrae;
      for (let i = 0; i < 4_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          const result: BattleResult = d.result;
          return result.outcome === 'victory' ? { kind: 'victory', result } : { kind: 'defeat', result };
        }
        if (d.kind !== 'player-input') continue;
        engine.submit(line(d, engine) ?? { kind: 'defend', targets: [] });
      }
      return { kind: 'aborted' };
    },
  };
  return presenter as unknown as BattlePresenter;
}

/** The chapter through the real chain loop, recording what the screen is told at the head of every link. */
async function runChapter(seed: number, evrae: Line, geosgaeno: Line): Promise<{ result: EncounterChainResult; seen: Seen[]; chainLength: number; final: BattleState }> {
  const start = setup(seed, 'area-1');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(start.seed);
  engine.init(start);
  const first = groupOf('area-1');
  const chainLength = await chainLengthOf(first, find);
  const seen: Seen[] = [];
  const result = await runEncounterChain({
    chapter: FLOODED_WAYS,
    presenter: scripted(evrae, geosgaeno),
    engine,
    stage: { stage: () => Promise.resolve() },
    group: first,
    setup: start,
    seed,
    findGroup: find,
    onLink: ({ links, group, setup: linkSetup, checkpoint }) => {
      const state = engine.state();
      const done = Object.fromEntries(evaluateObjectives(FLOODED_WAYS_META.objectives, { state, log: state.log, links }).map((o) => [o.id, o.done]));
      seen.push({ links, groupId: group.id, seed: linkSetup.seed, checkpointLink: checkpoint?.link ?? null, objectives: done, progress: encounterProgress({ state, log: state.log, links }, { chainLength })?.label });
    },
  });
  return { result, seen, chainLength, final: engine.state() };
}

describe('the chain position counts a skipped area as passed', () => {
  it('the counter: skipSpentLinksCounted says how many areas it passed over', async () => {
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setup(1, 'area-1'));
    const state = engine.state();
    const boss = state.combatants['evrae-altana'] as unknown as { hp: number; alive: boolean };
    expect((await skipSpentLinksCounted(groupOf('area-2'), state, find)).skipped).toBe(0); // standing: the next area as it is
    boss.hp = 0;
    boss.alive = false;
    expect(await skipSpentLinksCounted(groupOf('area-2'), state, find)).toMatchObject({ skipped: 2 }); // areas 2 and 3, on to Geosgaeno
    expect(await skipSpentLinksCounted(groupOf('area-3'), state, find)).toMatchObject({ skipped: 1 });
    expect(await skipSpentLinksCounted(groupOf('geosgaeno'), state, find)).toMatchObject({ skipped: 0 }); // not a carrying link
  });

  it('two Phoenix Downs in area 1: Geosgaeno is the chain\'s fourth position, "Reach the Baaj Temple" ticks, the pause row reads battle 4 of 4, and a retry checkpoint sits at position 4', async () => {
    const { seen, chainLength, result } = await runChapter(3, evraePhoenix, geosgaenoLine('smart'));
    expect(chainLength).toBe(4);
    expect(seen.map((s) => s.groupId)).toEqual(['flooded-area-1', 'flooded-geosgaeno']); // the later areas were never fought
    expect(seen.map((s) => s.links)).toEqual([1, 4]);
    expect(result.links).toBe(4);
    const baaj = seen[1]!;
    expect(baaj.objectives).toMatchObject({ 'first-gate': true, 'baaj-temple': true, 'last-home': false });
    expect(baaj.progress).toBe('BATTLE 4 OF 4');
    expect(baaj.checkpointLink).toBe(4); // a defeat in the Baaj Temple retries there, as position 4 (and the seed follows the position)
    expect(baaj.seed).toBe(3 + 3);
    // Area 1 itself: nothing ticks yet but the chapter is begun.
    expect(seen[0]!.objectives).toMatchObject({ 'first-gate': false, 'baaj-temple': false, 'last-home': false });
    expect(seen[0]!.progress).toBe('BATTLE 1 OF 4');
  });

  it('the long way (the locks opened, every area fought out): the position is the group\'s place in the chain at every link, whichever areas a seed skips; the Baaj row ticks only at Geosgaeno', async () => {
    let reachedBaaj = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { seen, result } = await runChapter(seed, evraeOrdinary, geosgaenoLine('smart'));
      for (const s of seen) {
        const place = FLOODED_LINKS.findIndex((l) => l.groupId === s.groupId);
        expect(s.links, `seed ${seed} ${s.groupId}`).toBe(place + 1);
        expect(s.seed, `seed ${seed} ${s.groupId}: link n is seeded seed + n - 1`).toBe(seed + place);
        expect(s.objectives['baaj-temple'], `seed ${seed} ${s.groupId}`).toBe(s.groupId === 'flooded-geosgaeno');
        expect(s.objectives['first-gate'], `seed ${seed} ${s.groupId}`).toBe(place >= 1);
        expect(s.progress, `seed ${seed} ${s.groupId}`).toBe(`BATTLE ${place + 1} OF 4`);
      }
      expect(seen[0]!.groupId, `seed ${seed}`).toBe('flooded-area-1');
      expect(result.links, `seed ${seed}`).toBe(FLOODED_LINKS.findIndex((l) => l.groupId === seen[seen.length - 1]!.groupId) + 1);
      if (seen.some((s) => s.groupId === 'flooded-geosgaeno')) reachedBaaj++;
    }
    expect(reachedBaaj).toBeGreaterThan(0); // the long way does reach the temple on these seeds (the ordinary line wins every Evrae fight in the bench)
  });

  it('a victory ticks the last row, on whichever route', async () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { result, final } = await runChapter(seed, evraePhoenix, geosgaenoLine('smart'));
      if (result.outcome.kind !== 'victory') continue; // the Geosgaeno fight is won about seven times in ten: a lost seed ends the chain, not this check
      const done = evaluateObjectives(FLOODED_WAYS_META.objectives, { state: final, log: final.log, links: result.links });
      expect(done.map((o) => o.done), `seed ${seed}`).toEqual([true, true, true]);
      return;
    }
    throw new Error('no seed of the first eight won the chapter');
  });
});
