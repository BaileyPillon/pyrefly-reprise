/**
 * Measurement for DIFF-B (the options page "FFX-2 Difficulty Options", PR-0227): Chapter XIII's card follows the
 * chapter's own line. This is the options harness (`drivex.ts`, `disagree.test.ts` unchanged; `critic/bench/r43/` of the
 * options page's scratch worktree) with one addition: the driver `card-before` is the card with the rule switched off
 * (`AdvisorOptions.lineFirst: false`), so before and after run through one binary on one board and one set of seeds.
 *
 * Run one process per job list:
 *   R44_JOBS='[{"chapter":"ffx2-trema","arm":"house","driver":"card","from":1,"to":200}]' R44_OUT=<file.jsonl> \
 *   node node_modules/vitest/vitest.mjs run --maxWorkers=2 --config critic/bench/r44-diffb/vitest.config.ts critic/bench/r44-diffb/measure.test.ts
 * One JSON line per run: chapter, arm name, driver, seed, outcome, links, decisions, game minutes, menus closed.
 * Drivers: `card` (the shipped card), `card-before` (the card without DIFF-B), `line` (`intendedStrategy`, the page's "line").
 * Nothing in the game's data is touched; a party variant is a different SOURCED build handed to `setupForChapter`.
 */

import { describe, expect, it } from 'vitest';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Command } from '../../../src/battle/common/types.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, type DecisionContext, type Driver } from '../advisor-v3/drive.ts';
import { runChapterX, HOUSE, type Arm } from './drivex.ts';
import { tremaBuildFor, type TremaKitOption } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';

interface Job {
  chapter: string;
  /** A name for the arm (the aggregator groups by it). */
  arm: string;
  /** Overrides on the house pace. */
  topMs?: number;
  heldMs?: number;
  atbMode?: 'wait' | 'active';
  waitSplit?: boolean;
  atbSpeed?: 'slow' | 'normal' | 'fast';
  driver: 'card' | 'card-before' | 'line';
  /** A sourced party variant: a Trema kit option, or `lv:52` for the Chapter V band's top. */
  build?: string;
  from: number;
  to: number;
}

const JOBS: Job[] = JSON.parse(
  process.env['R44_JOBS_FILE'] ? readFileSync(process.env['R44_JOBS_FILE'], 'utf8') : (process.env['R44_JOBS'] ?? '[]'),
) as Job[];
const OUT = process.env['R44_OUT'] ?? 'D:/Tools/pyrefly-scratch/r44-results/default.jsonl';
mkdirSync(dirname(OUT), { recursive: true });

const cardDriver = (lineFirst: boolean | undefined): Driver => (ctx: DecisionContext): Command | null => {
  const options = lineFirst === undefined ? ctx.advisorOptions : { ...ctx.advisorOptions, lineFirst };
  const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, options);
  return view?.suggestions[0]?.command ?? null;
};
const lineDriver: Driver = (ctx) => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);

function buildFor(spec: string | undefined, base: FFX2PartyBuild): FFX2PartyBuild {
  if (!spec) return base;
  if (spec.startsWith('lv:')) {
    const lv = Number(spec.slice(3));
    return { ...base, members: base.members.map((m) => ({ ...m, level: lv })) as FFX2PartyBuild['members'] };
  }
  return tremaBuildFor(spec as TremaKitOption);
}

describe('r44 DIFF-B measure', () => {
  for (const job of JOBS) {
    it(`${job.chapter} ${job.arm} ${job.driver} seeds ${job.from}..${job.to}`, async () => {
      const arm: Arm = {
        ...HOUSE,
        ...(job.topMs !== undefined ? { topMs: job.topMs } : {}),
        ...(job.heldMs !== undefined ? { heldMs: job.heldMs } : {}),
        ...(job.atbMode ? { atbMode: job.atbMode } : {}),
        ...(job.waitSplit !== undefined ? { waitSplit: job.waitSplit } : {}),
        ...(job.atbSpeed ? { atbSpeed: job.atbSpeed } : {}),
      };
      const base = chapterById(job.chapter);
      const chapter = job.build ? { ...base, buildRef: buildFor(job.build, base.buildRef as FFX2PartyBuild) } : base;
      const driver = job.driver === 'card' ? cardDriver(undefined) : job.driver === 'card-before' ? cardDriver(false) : lineDriver;
      for (let seed = job.from; seed <= job.to; seed++) {
        const r = await runChapterX(chapter, seed, driver, arm);
        appendFileSync(
          OUT,
          JSON.stringify({
            chapter: job.chapter, arm: job.arm, driver: job.driver, seed, outcome: r.outcome, links: r.linksCleared,
            decisions: r.decisions, minutes: Math.round(r.minutes * 100) / 100, closed: r.closed, refused: r.refused,
            fallbacks: r.fallbacks,
          }) + '\n',
        );
      }
      expect(true).toBe(true);
    }, 6 * 60 * 60_000);
  }
});
