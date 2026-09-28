/**
 * **Advisor v4 scorecard through the game's worker path** (docs/handoff/advisor-v4.md): every
 * listed FFX chapter, v3's card against the card the game would show with v4 on, where v4's card
 * comes the way the game gets it: `attachAdvisorV4` on the live engine, a pre-start at every
 * `init` and `submit`, the battle copied by `structuredClone` (what `postMessage` does) into the
 * real worker core (`src/app/advisorV4/core.ts`), the answer read at menu open by the host
 * (`cardFor`), v3's card whenever there is no answer.
 *
 * The one thing node cannot give is the animation window: here the worker gets all the time it
 * wants before each menu opens (`idle()`), so this is v4's card whenever it is ready; how often it
 * is ready in a browser is the timing run's number (`critic/bench/advisor-v4/browser-timing.mjs`).
 *
 * The drive is the v3 scorecard's for FFX (`../advisor-v3/drive.ts`: the chapter's own record,
 * `setupForNextLink` with `seed + link`, the refusal streak, the fallback), and the readings are its
 * `observe`. FFX has no clock under a menu, so there is no pace.
 *
 * ```
 * node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/worker-path.test.ts
 * ```
 * Env: `V4W_CHAPTERS` (ids), `V4W_SEEDS` (40), `V4W_FIRST_SEED` (1), `V4W_DRIVERS` (`v3,v4`),
 * `V4W_BUDGET` (`lean` | `mini`), `V4W_TAG` (writes `results/<tag>.json`).
 *
 * Game case: FFX only.
 */

import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BattleSetup, BattleState, Command, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { buildAdvisorView, sameCommand, type AdvisorView } from '../../../src/engine/tactics/advisor.ts';
import type { BudgetName } from '../../../src/engine/tactics/advisor-v4/presets.ts';
import type { MoveAdvisorLookAhead } from '../../../src/ui/common/MoveAdvisor.ts';
import { attachAdvisorV4 } from '../../../src/app/advisorV4/wiring.ts';
import type { AdvisorV4Host } from '../../../src/app/advisorV4/host.ts';
import { chapterById, fallbackCommand, listedChapters, type DecisionContext } from '../advisor-v3/drive.ts';
import { observe, type DecisionObs } from '../advisor-v3/metrics.ts';
import { InProcWorker } from './inproc-worker.ts';

const SEEDS = Number(process.env['V4W_SEEDS'] ?? 40);
const FIRST = Number(process.env['V4W_FIRST_SEED'] ?? 1);
const IDS = (process.env['V4W_CHAPTERS'] ?? '').split(',').filter(Boolean);
const DRIVERS = (process.env['V4W_DRIVERS'] ?? 'v3,v4').split(',').filter(Boolean);
const BUDGET = (process.env['V4W_BUDGET'] ?? 'lean') as BudgetName;
const TAG = process.env['V4W_TAG'] ?? `wp-${BUDGET}`;
const HERE = dirname(fileURLToPath(import.meta.url));
const REFUSAL_STREAK = 3;

function pctl(xs: readonly number[], p: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.round((p / 100) * (s.length - 1)))]!;
}

interface Row {
  chapterId: string; driver: string; budget: string; seeds: number; wins: number; winSeeds: number[]; linksCleared: number;
  decisions: number; shownV4: number; switched: number; notReady: number; lethalMiss: number; savable: number; missedRevive: number;
  notOnMenu: number; badAim: number; refused: number; workerMs: number[]; cardMs: number[];
}

const rows: Row[] = [];

function add(r: Row, o: DecisionObs): void {
  if (o.lethalMiss) r.lethalMiss += 1;
  if (o.savable) r.savable += 1;
  if (o.missedRevive) r.missedRevive += 1;
  if (o.notOnMenu) r.notOnMenu += 1;
  if (o.badAim) r.badAim += 1;
}

async function runOne(chapterId: string, seed: number, driver: string, r: Row): Promise<{ outcome: string; links: number }> {
  await registerBattleContent();
  const chapter = chapterById(chapterId);
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  let source: MoveAdvisorLookAhead | null = null;
  const worker = new InProcWorker();
  let host: AdvisorV4Host | null = null;
  if (driver === 'v4') {
    (globalThis as { __pyreflyAdvisorV4Force?: boolean }).__pyreflyAdvisorV4Force = true;
    const owner = { moveAdvisor: { setLookAhead: (s: MoveAdvisorLookAhead | null) => { source = s; } } };
    host = attachAdvisorV4(owner, e, 'ffx', { spawn: () => worker, budget: BUDGET, capMs: 3_600_000 });
  }
  const groups: EnemyGroupDef[] = [];
  for (let g: EnemyGroupDef | null = group; g?.nextGroupId && groups.length < 12; ) {
    g = (await findEnemyGroup(g.nextGroupId)) ?? null;
    if (g) groups.push(g);
  }
  let link = 1;
  let outcome = 'unresolved';
  let links = 0;
  let streakActor = '';
  let streak = 0;
  let index = 0;
  for (let step = 0; step < 120_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      if (outcome !== 'victory') break;
      links += 1;
      if (!group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    index += 1;
    r.decisions += 1;
    const state = e.state();
    const t0 = performance.now();
    let view: AdvisorView | null = null;
    if (host) {
      await worker.idle();
      view = (source as MoveAdvisorLookAhead | null)?.cardFor(state, d) ?? null;
      if (view) r.shownV4 += 1;
      else r.notReady += 1;
    }
    const v3 = view ? null : buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, {});
    const card = view ?? v3;
    r.cardMs.push(performance.now() - t0);
    if (view) {
      const plain = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, {});
      if (plain?.suggestions[0] && view.suggestions[0] && !sameCommand(plain.suggestions[0].command, view.suggestions[0].command)) r.switched += 1;
    }
    const ctx: DecisionContext = {
      chapterId, game: 'ffx', seed, link, index, engine: e, state, decision: d, advisorOptions: {},
      chain: { setup, next: groups.slice(link - 1) },
    };
    add(r, observe(ctx, card));
    (source as MoveAdvisorLookAhead | null)?.closed();
    let pick: Command | null = streak >= REFUSAL_STREAK && d.actorId === streakActor ? null : card?.suggestions[0]?.command ?? null;
    pick ??= fallbackCommand(d);
    const events = e.submit(pick);
    if (events.length === 0) {
      r.refused += 1;
      streak = d.actorId === streakActor ? streak + 1 : 1;
      streakActor = d.actorId;
    } else {
      streak = 0;
      streakActor = '';
    }
  }
  if (host) {
    for (const s of host.stats.worker) r.workerMs.push(s.totalMs);
    host.dispose();
  }
  return { outcome, links };
}

const chapters = IDS.length > 0 ? IDS.map(chapterById) : listedChapters().filter((c) => c.game === 'ffx');

describe(`advisor v4 through the worker path (${BUDGET})`, () => {
  for (const ch of chapters) {
    for (const driver of DRIVERS) {
      it(`${ch.id}, ${driver}, seeds ${FIRST}..${FIRST + SEEDS - 1}`, async () => {
        const r: Row = {
          chapterId: ch.id, driver, budget: driver === 'v4' ? BUDGET : '-', seeds: 0, wins: 0, winSeeds: [], linksCleared: 0, decisions: 0,
          shownV4: 0, switched: 0, notReady: 0, lethalMiss: 0, savable: 0, missedRevive: 0, notOnMenu: 0, badAim: 0, refused: 0, workerMs: [], cardMs: [],
        };
        for (let seed = FIRST; seed < FIRST + SEEDS; seed++) {
          const res = await runOne(ch.id, seed, driver, r);
          r.seeds += 1;
          r.linksCleared += res.links;
          if (res.outcome === 'victory') {
            r.wins += 1;
            r.winSeeds.push(seed);
          }
          process.stderr.write(`[v4w] ${ch.id} ${driver} seed ${seed}: ${res.outcome}\n`);
        }
        rows.push(r);
        expect(r.seeds).toBe(SEEDS);
      });
    }
  }

  afterAll(() => {
    if (rows.length === 0) return;
    const out = rows.map(({ workerMs, cardMs, ...rest }) => ({
      ...rest, workerP50: pctl(workerMs, 50), workerP95: pctl(workerMs, 95), workerMax: pctl(workerMs, 100),
      cardP50: pctl(cardMs, 50), cardP95: pctl(cardMs, 95),
    }));
    for (const o of out) {
      console.log(`| ${o.chapterId} | ${o.driver} | ${o.wins}/${o.seeds} | ${o.decisions} | v4 shown ${o.shownV4}, switched ${o.switched}, not ready ${o.notReady} | lethal miss ${o.lethalMiss} | missed revive ${o.missedRevive} | menu ${o.notOnMenu}/${o.badAim} | worker ms p50 ${o.workerP50.toFixed(0)} p95 ${o.workerP95.toFixed(0)} |`);
    }
    mkdirSync(join(HERE, 'results'), { recursive: true });
    writeFileSync(join(HERE, 'results', `${TAG}.json`), JSON.stringify({ tag: TAG, budget: BUDGET, seeds: SEEDS, first: FIRST, when: new Date().toISOString(), rows: out }, null, 2));
  });
});
