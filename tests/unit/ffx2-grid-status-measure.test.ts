/**
 * **RE-parity measurement, FFX-2 Garment Grids that keep a status or an SOS set** (re-parity RC10 lane XD1b; `docs/handoff/re-parity-rc10-x2-grid-status.md`). **FFX-2 only.**
 *
 * The shipped `intendedStrategy` plays every FFX-2 chapter's whole chain through the app's own path (the same loop as `ffx2-stat-setter-measure.test.ts` and `ffx2-parity-measure.test.ts`) and,
 * besides wins, party turns and party KOs, this file counts what the lane's rows touch, from the event logs only, so the same file runs on the base tree (`origin/r52-rc`, which has none of
 * the lane) and on the branch:
 *
 * - `gateChanges`: dress changes of a girl that cross at least one gate (a `spherechange` event with `gatesCrossed`);
 * - `layerOn`: statuses the automatic-status layer put on in the middle of a battle (a `status-add` whose source is `auto-layer`), by status: `haste` is Highroad Winds' SOS Haste (or any other source of it),
 *   `max-hp-x2` and `max-mp-x2` are Double HP and Double MP (Downtrodder, Tempered Will);
 * - `girlsDoubled`: seeds in which a girl's Double HP or Double MP came on.
 *
 * Every row also carries one digest per seed of every event of every link (`digests`), so a run on two trees says seed by seed whether the fights are the same event for event.
 *
 * `PYREFLY_MEASURE_PACE=bench|human|active` picks how the player thinks: `bench` (default) answers every menu at once under Wait, the shipped default, as every parity measure does; `human`
 * is Wait's split with 1.5 s spent at each menu, 0.5 s of it on the top list (the PR-0076 bench's modelled human); `active` is the Active clock with 1.5 s at each menu. The 1.5 s and the 0.5 s are
 * authored measurement inputs, not game data.
 *
 * Runs only with `PYREFLY_MEASURE=1`. `PYREFLY_MEASURE_SEEDS=<n>` plays seeds 1 to n (default 12) or `<a>-<b>`; `PYREFLY_MEASURE_OUT=<file>` writes the rows as JSON;
 * `PYREFLY_MEASURE_CHAPTERS=<id,id>` narrows the run; `PYREFLY_MEASURE_TAG=<text>` is written into every row. Measure, never tune: nothing here changes a boss or a party number.
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { describe, it, vi } from 'vitest';

// The ablation: `PYREFLY_GRID_AUTO_STATUS=off` puts the pre-RC10 rule back through a module mock of the switch (`constants.ts#GRID_AUTO_STATUS`), so one file measures both sides of the lane's one rule.
// A tree that has no such switch (the base) is unaffected: the mock only adds a name.
vi.mock('../../src/battle/ffx2/constants.ts', async (original) => {
  const m = await original<Record<string, unknown>>();
  return process.env['PYREFLY_GRID_AUTO_STATUS'] === 'off' ? { ...m, GRID_AUTO_STATUS: false } : m;
});

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
const PACE = (['bench', 'human', 'active'] as const).find((p) => p === process.env['PYREFLY_MEASURE_PACE']) ?? 'bench';
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;
const THINK_MS = 1500;
const TOP_MS = 500;

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Counters {
  gateChanges: number;
  haste: number;
  hpX2: number;
  mpX2: number;
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

const NONE: Counters = { gateChanges: 0, haste: 0, hpX2: 0, mpX2: 0 };

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

/** What the lane's rows touched in one link, read from its event log. */
function countersOf(state: Readonly<BattleState>): Counters {
  const out: Counters = { ...NONE };
  for (const e of state.log as readonly BattleEvent[]) {
    if (e.type === 'spherechange' && (e.gatesCrossed?.length ?? 0) > 0) out.gateChanges += 1;
    else if (e.type === 'status-add' && e.instance.sourceAbilityId === 'auto-layer') {
      if (e.status === 'haste') out.haste += 1;
      else if (e.status === 'max-hp-x2') out.hpX2 += 1;
      else if (e.status === 'max-mp-x2') out.mpX2 += 1;
    }
  }
  return out;
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const options = { ...ffx2EngineOptions(), minigames: false, ...(PACE === 'active' ? { atbMode: 'active' as const } : {}) };
  const engine = new FFX2Engine(options);
  engine.setSeed(setup.seed);
  engine.init(setup);
  let outcome = 'unresolved';
  let link = 1;
  let link1Won = false;
  let partyTurns = 0;
  let engineTurns = 0;
  let partyKos = 0;
  let ticks = 0;
  const sum: Counters = { ...NONE };
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
    if (PACE === 'human') {
      // Wait's split: read the top list for TOP_MS (the clock runs), then think inside a submenu (held).
      engine.setMenuLevel('top');
      engine.tick(TOP_MS, { throughInput: true });
      engine.setMenuLevel('deep');
      if (!engine.inputValid(d.actorId)) continue;
      engine.tick(THINK_MS - TOP_MS, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    } else if (PACE === 'active') {
      engine.tick(THINK_MS, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return { outcome, link1Won, partyTurns, engineTurns, minutes: ticks / STEPS_PER_SECOND / 60, partyKos, ...sum, digest: hash.digest('hex').slice(0, 12) };
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

describe.skipIf(!MEASURE)('RE parity, FFX-2 grids that keep a status or an SOS set: the intended line in every FFX-2 chapter (PYREFLY_MEASURE=1)', () => {
  it("measures wins, party turns, KOs and what the grid rows touched, over each chapter's whole chain", async () => {
    await registerBattleContent();
    const rows: unknown[] = [];
    for (const chapter of [...CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2' && (ONLY ? ONLY.includes(c.id) : CHAPTERS.includes(c)))) {
      const runs: One[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed));
      const total = (key: keyof Counters): number => sum(runs.map((r) => r[key]));
      rows.push({
        chapter: chapter.id,
        tag: TAG,
        pace: PACE,
        ablation: process.env['PYREFLY_GRID_AUTO_STATUS'] === 'off' ? 'GRID_AUTO_STATUS off' : 'as built',
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
          gateChanges: total('gateChanges'),
          seedsWithGateChange: runs.filter((r) => r.gateChanges > 0).length,
          layerHaste: total('haste'),
          layerDoubleHp: total('hpX2'),
          layerDoubleMp: total('mpX2'),
          seedsWithDoubling: runs.filter((r) => r.hpX2 + r.mpX2 > 0).length,
        },
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 6_000_000);
});
