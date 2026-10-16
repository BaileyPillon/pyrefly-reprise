/**
 * **RE-parity measurement, FFX-2 script stat setter** (re-parity RC9 lane X2-E; `docs/handoff/re-parity-rc9-x2-stat-setter.md` section 5). **FFX-2 only.**
 *
 * The shipped `intendedStrategy` plays every FFX-2 chapter's whole chain through the app's own path (the same loop as `ffx2-parity-measure.test.ts` and `ffx2-confusion-measure.test.ts`) and,
 * besides wins, party turns and party KOs, this file counts what the lane's rows touch, from the event logs and the final state only, so the same file runs on the base tree
 * (`origin/r50-release`, which has none of the lane) and on the branch:
 *
 * - `coreFell`: seeds in which the Vegnagun Core was knocked out (the death entry XE4 answers); at the end of that link, `bulwarksAtZero`: Bulwarks alive at 0 hit points (what the entry leaves), `bulwarksDown`: Bulwarks
 *   that had already fallen (the entry stores 0 over their 0: nothing changes) and `bulwarksStanding`: Bulwarks alive above 0 (neither); `bulwarkKoAfterCore`: Bulwark knock-outs that come after the Core's in the same
 *   link (a command still in flight when the Core fell, which now meets a Bulwark at 0);
 * - `trioKoInWindow`: knock-outs of Ormi, Logos or Leblanc while the combo flag of No Love Lost is up (from Leblanc's `x2-nll-1` to her next turn), the situation the Act III death entries (XE3, not built) answer;
 * - `enemyAutoLife`: Auto-Life revivals of a monster (XE5 changes the check for a monster that leaves the battle at its KO).
 *
 * Every row also carries one digest per seed of every event of every link (`digests`), so a run on two trees says seed by seed whether the fights are the same event for event.
 * Runs only with `PYREFLY_MEASURE=1`. `PYREFLY_MEASURE_SEEDS=<n>` plays seeds 1 to n (default 12) or `<a>-<b>`; `PYREFLY_MEASURE_OUT=<file>` writes the rows as JSON;
 * `PYREFLY_MEASURE_CHAPTERS=<id,id>` narrows the run; `PYREFLY_MEASURE_TAG=<text>` is written into every row. Measure, never tune: nothing here changes a boss or a party number.
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleEvent, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const SEED_SPEC = process.env['PYREFLY_MEASURE_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const ONLY = process.env['PYREFLY_MEASURE_CHAPTERS']?.split(',');
const TAG = process.env['PYREFLY_MEASURE_TAG'] ?? '';
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Counters {
  coreFell: number;
  bulwarksAtZero: number;
  bulwarksDown: number;
  bulwarksStanding: number;
  bulwarkKoAfterCore: number;
  trioKoInWindow: number;
  enemyAutoLife: number;
}

interface One extends Counters {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  minutes: number;
  partyKos: number;
  /** A digest of every event of every link, in order: two trees agree on a seed only when their logs are the same event for event. */
  digest: string;
}

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

/** What the lane's rows touched in one link, read from its event log and its final state. */
function countersOf(state: Readonly<BattleState>): Counters {
  const out: Counters = { coreFell: 0, bulwarksAtZero: 0, bulwarksDown: 0, bulwarksStanding: 0, bulwarkKoAfterCore: 0, trioKoInWindow: 0, enemyAutoLife: 0 };
  let coreSeq = -1;
  let comboUp = false;
  for (const e of state.log as readonly BattleEvent[]) {
    if (e.type === 'ko') {
      if (e.targetId === 'vegnagun-body') {
        out.coreFell = 1;
        coreSeq = e.seq;
      } else if ((e.targetId === 'bulwark-r' || e.targetId === 'bulwark-l') && coreSeq >= 0) out.bulwarkKoAfterCore += 1;
      if (comboUp && (e.targetId === 'ormi' || e.targetId === 'logos' || e.targetId === 'leblanc')) out.trioKoInWindow += 1;
    } else if (e.type === 'action-start' && e.actorId === 'leblanc' && e.abilityId === 'x2-nll-1') comboUp = true;
    else if (e.type === 'turn-start' && e.actorId === 'leblanc') comboUp = false;
    else if (e.type === 'revive' && e.cause === 'auto-life' && state.combatants[e.targetId]?.side === 'enemy') out.enemyAutoLife += 1;
  }
  if (out.coreFell === 1) {
    for (const id of ['bulwark-r', 'bulwark-l']) {
      const c = state.combatants[id];
      if (c === undefined) continue;
      if (!c.alive) out.bulwarksDown += 1;
      else if (c.hp === 0) out.bulwarksAtZero += 1;
      else out.bulwarksStanding += 1;
    }
  }
  return out;
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
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
  const sum: Counters = { coreFell: 0, bulwarksAtZero: 0, bulwarksDown: 0, bulwarksStanding: 0, bulwarkKoAfterCore: 0, trioKoInWindow: 0, enemyAutoLife: 0 };
  const hash = createHash('sha1');
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      const state = engine.state() as Readonly<BattleState>;
      engineTurns += d.result.turns;
      partyKos += partyKosOf(state);
      ticks += state.ticks;
      const c = countersOf(state);
      for (const key of Object.keys(sum) as Array<keyof Counters>) sum[key] += c[key];
      outcome = String(d.result.outcome);
      for (const event of state.log) hash.update(JSON.stringify(event));
      hash.update(`|over:${outcome}:${d.result.turns}|`);
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
  return { outcome, link1Won, partyTurns, engineTurns, minutes: ticks / STEPS_PER_SECOND / 60, partyKos, ...sum, digest: hash.digest('hex').slice(0, 12) };
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

describe.skipIf(!MEASURE)('RE parity, FFX-2 script stat setter: the intended line in every FFX-2 chapter (PYREFLY_MEASURE=1)', () => {
  it("measures wins, party turns, KOs and what the stat setter rows touched, over each chapter's whole chain", async () => {
    await registerBattleContent();
    const rows: unknown[] = [];
    for (const chapter of [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2' && (ONLY ? ONLY.includes(c.id) : CHAPTERS.includes(c)))) {
      const runs: One[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed));
      const total = (key: keyof Counters): number => sum(runs.map((r) => r[key]));
      rows.push({
        chapter: chapter.id,
        tag: TAG,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        digests: runs.map((r) => r.digest),
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        sums: { partyTurns: sum(runs.map((r) => r.partyTurns)), engineTurns: sum(runs.map((r) => r.engineTurns)), minutes: Math.round(sum(runs.map((r) => r.minutes)) * 10) / 10, partyKos: sum(runs.map((r) => r.partyKos)) },
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        meanPartyTurns: mean(runs.map((r) => r.partyTurns)),
        meanEngineTurns: mean(runs.map((r) => r.engineTurns)),
        meanMinutes: mean(runs.map((r) => r.minutes)),
        meanPartyKos: mean(runs.map((r) => r.partyKos)),
        touched: {
          seedsWithCoreFell: runs.filter((r) => r.coreFell > 0).length,
          bulwarksAtZero: total('bulwarksAtZero'),
          bulwarksDown: total('bulwarksDown'),
          bulwarksStanding: total('bulwarksStanding'),
          bulwarkKoAfterCore: total('bulwarkKoAfterCore'),
          seedsWithBulwarkKoAfterCore: runs.filter((r) => r.bulwarkKoAfterCore > 0).length,
          trioKoInWindow: total('trioKoInWindow'),
          enemyAutoLife: total('enemyAutoLife'),
        },
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 6_000_000);
});
