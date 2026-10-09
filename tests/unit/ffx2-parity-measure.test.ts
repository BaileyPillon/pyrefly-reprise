/**
 * **RE-parity balance measurement, FFX-2** (`docs/plans/re-parity-review.md` section 5, batch W3).
 *
 * For every FFX-2 chapter in `src/data/encounters.ts`, the SHIPPED `intendedStrategy` plays the chapter through the
 * app's own path (`registerBattleContent`, `setupForChapter`, `setupForNextLink`: the real party build, the chapter's
 * mid-battle triggers, every link of its chain, minigames auto-resolved, the same wiring the app's battle screen
 * builds its FFX-2 engine with) on a range of seeds. Per chapter it reports wins (every link won), losses, the mean
 * number of party turns (decisions the strategy was asked for), the mean engine turn count, the mean game time in
 * minutes and the mean number of party KOs, over the whole chain, plus how many seeds won the FIRST link (the rows also carry
 * `perSeed`, one letter per seed, and the `sums` behind the means, so runs of a few hundred seeds can be split across processes
 * and merged exactly). **Measure,
 * never tune**: nothing here changes a boss or a party number, and a chapter whose wins move by 2 or more of 12
 * between two commits is reported to Bailey with the cause (found by ablation, as batch W1 did).
 *
 * Runs only with `PYREFLY_MEASURE=1`. `PYREFLY_MEASURE_SEEDS=<n>` plays seeds 1 to n (default 12, the plan's
 * sample; 500 is the second pass) and `<a>-<b>` plays seeds a to b, `PYREFLY_MEASURE_OUT=<file>` writes the rows as JSON, and
 * `PYREFLY_MEASURE_CHAPTERS=<id,id>` narrows the run. `PYREFLY_MEASURE_USAGE=<file>` also writes, per ability id, how
 * many hits, misses, crits and the average damage it produced over the whole run (the per-ability old-against-new
 * table of the handoff note). By default the file is skipped, so the full suite pays nothing.
 *
 * Game case: **FFX-2 only** (the FFX and FF7 engines are not driven here; `ffx-parity-measure.test.ts` is FFX's).
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const USAGE_OUT = process.env['PYREFLY_MEASURE_USAGE'];
const SEED_SPEC = process.env['PYREFLY_MEASURE_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const ONLY = process.env['PYREFLY_MEASURE_CHAPTERS']?.split(',');
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Row {
  chapter: string;
  seeds: number;
  /** The first seed played; the seeds are contiguous. */
  firstSeed: number;
  /** One letter a seed: W won the whole chain, L lost, U unresolved. */
  perSeed: string;
  /** The totals the means are made of, so split runs merge exactly. */
  sums: { partyTurns: number; engineTurns: number; minutes: number; partyKos: number };
  wins: number;
  losses: number;
  unresolved: number;
  link1Wins: number;
  meanPartyTurns: number;
  meanEngineTurns: number;
  meanMinutes: number;
  meanPartyKos: number;
}

interface One {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  minutes: number;
  partyKos: number;
}

interface Usage {
  hits: number;
  misses: number;
  crits: number;
  total: number;
  /** Ability ids seen at `action-start`, counted per use. */
  uses: number;
}

/** What the golden helpers play when the strategy has no pick: the first enabled Attack, else the first enabled row. */
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

/** Credit each damage and miss event to the ability of the latest `action-start` of its source. */
function tallyUsage(state: Readonly<BattleState>, usage: Map<string, Usage>): void {
  const current = new Map<string, string>();
  const row = (id: string): Usage => {
    let u = usage.get(id);
    if (!u) {
      u = { hits: 0, misses: 0, crits: 0, total: 0, uses: 0 };
      usage.set(id, u);
    }
    return u;
  };
  for (const e of state.log) {
    if (e.type === 'action-start') {
      current.set(e.actorId, e.abilityId ?? 'unknown');
      row(e.abilityId ?? 'unknown').uses += 1;
    } else if (e.type === 'damage' && e.sourceId !== undefined) {
      const id = current.get(e.sourceId);
      if (id === undefined) continue;
      const u = row(id);
      u.hits += 1;
      u.total += e.amount;
      if (e.crit) u.crits += 1;
    } else if (e.type === 'miss' && e.sourceId !== undefined) {
      const id = current.get(e.sourceId);
      if (id !== undefined) row(id).misses += 1;
    }
  }
}

async function playChain(chapter: Chapter, seed: number, usage: Map<string, Usage>): Promise<One> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  let outcome = 'unresolved';
  let link = 1;
  let link1Won = false;
  let partyTurns = 0;
  let engineTurns = 0;
  let partyKos = 0;
  let ticks = 0;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      engineTurns += d.result.turns;
      partyKos += partyKosOf(engine.state() as Readonly<BattleState>);
      ticks += (engine.state() as Readonly<BattleState>).ticks;
      if (USAGE_OUT) tallyUsage(engine.state() as Readonly<BattleState>, usage);
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
  return { outcome, link1Won, partyTurns, engineTurns, minutes: ticks / 3000 / 60, partyKos };
}

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

describe.skipIf(!MEASURE)('RE parity, FFX-2: the intended line in every FFX-2 chapter (PYREFLY_MEASURE=1)', () => {
  it("measures wins, losses, party turns and party KOs over each chapter's whole chain", async () => {
    await registerBattleContent();
    const rows: Row[] = [];
    const usage = new Map<string, Usage>();
    for (const chapter of CHAPTERS.filter((c) => c.game === 'ffx2')) {
      if (ONLY && !ONLY.includes(chapter.id)) continue;
      const runs: One[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed, usage));
      rows.push({
        chapter: chapter.id,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        sums: {
          partyTurns: runs.reduce((a, r) => a + r.partyTurns, 0),
          engineTurns: runs.reduce((a, r) => a + r.engineTurns, 0),
          minutes: runs.reduce((a, r) => a + r.minutes, 0),
          partyKos: runs.reduce((a, r) => a + r.partyKos, 0),
        },
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        unresolved: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        meanPartyTurns: mean(runs.map((r) => r.partyTurns)),
        meanEngineTurns: mean(runs.map((r) => r.engineTurns)),
        meanMinutes: mean(runs.map((r) => r.minutes)),
        meanPartyKos: mean(runs.map((r) => r.partyKos)),
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
    if (USAGE_OUT) {
      const table = [...usage.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, u]) => ({
          id,
          uses: u.uses,
          hits: u.hits,
          misses: u.misses,
          crits: u.crits,
          total: u.total,
          avg: u.hits === 0 ? 0 : Math.round((u.total / u.hits) * 10) / 10,
        }));
      writeFileSync(USAGE_OUT, JSON.stringify(table, null, 2));
    }
  }, 6_000_000);
});
