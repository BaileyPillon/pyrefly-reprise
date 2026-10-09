/**
 * **RE-parity balance measurement, FFX** (`docs/plans/re-parity-review.md` section 5).
 *
 * For every FFX chapter in `src/data/encounters.ts`, the SHIPPED `intendedStrategy` plays the chapter through
 * the app's own path (`registerBattleContent`, `setupForChapter`, `setupForNextLink`: the real party build, the
 * chapter's mid-battle triggers, every link of its chain, minigames auto-resolved, the same wiring
 * `ffx-engine-golden.test.ts` replays) on 12 seeds. Per chapter it reports wins (every link won), losses, the
 * mean number of party turns (decisions the strategy was asked for), the mean engine turn count and the mean
 * number of party KOs, over the whole chain, plus how many seeds won the FIRST link. **Measure, never tune**:
 * nothing here changes a boss or a party number, and a chapter whose wins move by 2 or more of 12 between two
 * commits is reported to Bailey with the cause.
 *
 * Runs only with `PYREFLY_MEASURE=1` (seconds); `PYREFLY_MEASURE_OUT=<file>` also writes the rows as JSON, which
 * is how the before and after tables in `docs/handoff/re-parity-w1.md` were made. By default it is skipped, so
 * the full suite pays nothing.
 *
 * Game case: **FFX only** (the FFX-2 and FF7 engines are not driven here).
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MAX_STEPS = 200_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Row {
  chapter: string;
  seeds: number;
  wins: number;
  losses: number;
  unresolved: number;
  link1Wins: number;
  meanPartyTurns: number;
  meanEngineTurns: number;
  meanPartyKos: number;
}

interface One {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  partyKos: number;
}

/** What the golden test plays when the strategy has no pick: the first enabled Attack, else the first enabled row. */
function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function partyKosOf(state: Readonly<BattleState>): number {
  let kos = 0;
  for (const e of state.log) {
    if (e.type !== 'ko') continue;
    const side = state.combatants[e.targetId]?.side;
    if (side === 'party' || side === 'aeon') kos += 1;
  }
  return kos;
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  let outcome = 'unresolved';
  let link = 1;
  let link1Won = false;
  let partyTurns = 0;
  let engineTurns = 0;
  let partyKos = 0;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      engineTurns += d.result.turns;
      partyKos += partyKosOf(engine.state() as Readonly<BattleState>);
      outcome = String(d.result.outcome);
      if (link === 1) link1Won = outcome === 'victory';
      if (outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return { outcome, link1Won, partyTurns, engineTurns, partyKos };
}

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

describe.skipIf(!MEASURE)('RE parity, FFX: the intended line in every FFX chapter (12 seeds; PYREFLY_MEASURE=1)', () => {
  it('measures wins, losses, party turns and party KOs over each chapter\'s whole chain', async () => {
    await registerBattleContent();
    const rows: Row[] = [];
    for (const chapter of CHAPTERS.filter((c) => c.game === 'ffx')) {
      const runs: One[] = [];
      for (const seed of SEEDS) runs.push(await playChain(chapter, seed));
      rows.push({
        chapter: chapter.id,
        seeds: runs.length,
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        unresolved: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        meanPartyTurns: mean(runs.map((r) => r.partyTurns)),
        meanEngineTurns: mean(runs.map((r) => r.engineTurns)),
        meanPartyKos: mean(runs.map((r) => r.partyKos)),
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 900_000);
});
