/**
 * **Advisor v4 prototype scorecard** (docs/plans/advisor-v4-method-check.md): the v3 scorecard's
 * chapters, drive and readings (`../advisor-v3/`), with a second driver that presses v4's pick
 * (`./search.ts`) instead of v3's top row. Same seeds, same pace, same readings, so every row is
 * v3 against v4 on identical ground.
 *
 * ```
 * node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/scorecard.test.ts
 * ```
 *
 * Env: `V4_SEEDS` (40), `V4_FIRST_SEED` (1), `V4_CHAPTERS` (comma ids; default every listed FFX
 * chapter), `V4_DRIVERS` (`v3,v4`), `V4_CONFIG` (a preset name from {@link PRESETS}, or JSON for a
 * `SearchConfig`), `V4_TAG` (writes `results/<tag>.json` beside this file).
 *
 * Game case: **both** (the harness is shared plumbing).
 */

import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from '../../../src/battle/common/types.ts';
import { buildAdvisorView, sameCommand, type AdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { chapterById, listedChapters, runChapter, type DecisionContext, type Driver } from '../advisor-v3/drive.ts';
import { observe, type DecisionObs } from '../advisor-v3/metrics.ts';
import { searchDecision, CEILING, type SearchConfig } from './search.ts';
import { PRESETS } from './presets.ts';
import { chainOf, type Forkable } from './rollout.ts';

const SEEDS = Number(process.env['V4_SEEDS'] ?? 40);
const FIRST = Number(process.env['V4_FIRST_SEED'] ?? 1);
const IDS = (process.env['V4_CHAPTERS'] ?? '').split(',').filter(Boolean);
const DRIVERS = (process.env['V4_DRIVERS'] ?? 'v3,v4').split(',').filter(Boolean);
const RAW = process.env['V4_CONFIG'] ?? 'ceiling';
const CONFIG: SearchConfig = RAW.trim().startsWith('{') ? (JSON.parse(RAW) as SearchConfig) : PRESETS[RAW] ?? CEILING;
const TAG = process.env['V4_TAG'] ?? `v4-${RAW.startsWith('{') ? 'custom' : RAW}`;
const HERE = dirname(fileURLToPath(import.meta.url));

interface Row {
  chapterId: string; game: string; driver: string; config: string; seeds: number; wins: number; winSeeds: number[];
  linksCleared: number; decisions: number; searched: number; switched: number; switchOrigins: Record<string, number>;
  skipped: Record<string, number>; simDecisions: number; missedRevive: number; dupStrict: number; dupSame: number;
  notOnMenu: number; badAim: number; lethalThreat: number; savable: number; lethalMiss: number; closed: number;
  ms: number[]; searchMs: number[];
}

const row = (chapterId: string, game: string, driver: string): Row => ({
  chapterId, game, driver, config: driver === 'v4' ? RAW : '-', seeds: 0, wins: 0, winSeeds: [], linksCleared: 0,
  decisions: 0, searched: 0, switched: 0, switchOrigins: {}, skipped: {}, simDecisions: 0, missedRevive: 0, dupStrict: 0,
  dupSame: 0, notOnMenu: 0, badAim: 0, lethalThreat: 0, savable: 0, lethalMiss: 0, closed: 0, ms: [], searchMs: [],
});

function add(r: Row, o: DecisionObs): void {
  if (o.missedRevive) r.missedRevive += 1;
  if (o.dupStrict) r.dupStrict += 1;
  if (o.dupSame) r.dupSame += 1;
  if (o.notOnMenu) r.notOnMenu += 1;
  if (o.badAim) r.badAim += 1;
  if (o.lethalThreat) r.lethalThreat += 1;
  if (o.savable) r.savable += 1;
  if (o.lethalMiss) r.lethalMiss += 1;
}

/** The card with `pick` on top (the readings read the top row and the runner-up). */
function withTop(view: AdvisorView | null, pick: Command | null): AdvisorView | null {
  if (!view || !pick) return view;
  const rest = view.suggestions.filter((s) => !sameCommand(s.command, pick));
  const lifted = view.suggestions.find((s) => sameCommand(s.command, pick));
  const top = lifted ?? { ...view.suggestions[0]!, command: pick, source: 'simulated' as const, facts: [] };
  return { ...view, suggestions: [top, ...rest] };
}

function driverFor(r: Row, kind: string): Driver {
  return (ctx: DecisionContext): Command | null => {
    const t0 = performance.now();
    const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, ctx.advisorOptions);
    let pick = view?.suggestions[0]?.command ?? null;
    if (kind === 'v4') {
      const t1 = performance.now();
      const s = searchDecision(ctx.engine as unknown as Forkable, ctx.state, ctx.decision, view, ctx.advisorOptions, CONFIG, chainOf(ctx));
      r.searchMs.push(performance.now() - t1);
      r.simDecisions += s.simDecisions;
      if (s.searched) r.searched += 1;
      if (s.skipped) r.skipped[s.skipped] = (r.skipped[s.skipped] ?? 0) + 1;
      if (s.switched) {
        r.switched += 1;
        r.switchOrigins[s.origin] = (r.switchOrigins[s.origin] ?? 0) + 1;
        pick = s.command;
      }
    }
    r.ms.push(performance.now() - t0);
    add(r, observe(ctx, withTop(view, pick)));
    return pick;
  };
}

export function pctl(xs: readonly number[], p: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.round((p / 100) * (s.length - 1)))]!;
}

const rows: Row[] = [];
const chapters = IDS.length > 0 ? IDS.map(chapterById) : listedChapters().filter((c) => c.game === 'ffx');

describe(`advisor v4 prototype scorecard (${RAW})`, () => {
  for (const ch of chapters) {
    for (const kind of DRIVERS) {
      it(`${ch.id} (${ch.game}), ${kind}, seeds ${FIRST}..${FIRST + SEEDS - 1}`, async () => {
        const r = row(ch.id, ch.game, kind);
        for (let seed = FIRST; seed < FIRST + SEEDS; seed++) {
          const res = await runChapter(ch, seed, driverFor(r, kind));
          r.seeds += 1;
          process.stderr.write(`[v4] ${ch.id} ${kind} seed ${seed}: ${res.outcome} (${res.decisions} decisions)\n`);
          if (res.outcome === 'victory') {
            r.wins += 1;
            r.winSeeds.push(seed);
          }
          r.linksCleared += res.linksCleared;
          r.decisions += res.decisions;
          r.closed += res.closed;
        }
        rows.push(r);
        expect(r.seeds).toBe(SEEDS);
      });
    }
  }

  afterAll(() => {
    if (rows.length === 0) return;
    const lines = [
      '',
      `Advisor v4 prototype, tag ${TAG}, config ${JSON.stringify(CONFIG)}, seeds ${FIRST}..${FIRST + SEEDS - 1}`,
      '| Chapter | Game | Driver | Wins | Decisions | Searched / switched | Lethal miss / savable / threats | Missed revive | Dup strict / same | Not on menu / bad aim | ms p50 / p95 / p99 / max | sim decisions / decision |',
      '|---|---|---|---:|---:|---|---|---:|---|---|---|---:|',
      ...rows.map((r) =>
        `| ${r.chapterId} | ${r.game} | ${r.driver} | ${r.wins}/${r.seeds} | ${r.decisions} | ${r.searched} / ${r.switched} | ` +
        `${r.lethalMiss} / ${r.savable} / ${r.lethalThreat} | ${r.missedRevive} | ${r.dupStrict} / ${r.dupSame} | ${r.notOnMenu} / ${r.badAim} | ` +
        `${pctl(r.ms, 50).toFixed(1)} / ${pctl(r.ms, 95).toFixed(1)} / ${pctl(r.ms, 99).toFixed(1)} / ${pctl(r.ms, 100).toFixed(1)} | ` +
        `${(r.simDecisions / Math.max(1, r.decisions)).toFixed(0)} |`),
    ];
    console.log(lines.join('\n'));
    const out = rows.map(({ ms, searchMs, ...rest }) => ({
      ...rest, msP50: pctl(ms, 50), msP95: pctl(ms, 95), msP99: pctl(ms, 99), msMax: pctl(ms, 100),
      searchP50: pctl(searchMs, 50), searchP95: pctl(searchMs, 95),
    }));
    mkdirSync(join(HERE, 'results'), { recursive: true });
    writeFileSync(join(HERE, 'results', `${TAG}.json`), JSON.stringify({ tag: TAG, config: CONFIG, seeds: SEEDS, first: FIRST, when: new Date().toISOString(), rows: out }, null, 2));
  });
});
