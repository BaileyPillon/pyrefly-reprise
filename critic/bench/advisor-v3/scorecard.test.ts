/**
 * **The advisor scorecard** (docs/plans/advisor-v3-method-check.md): every listed FFX
 * and FFX-2 chapter, N seeds, a player who presses only the card's top row at the
 * house pace (`./drive.ts`), scored on five readings (`./metrics.ts`).
 *
 * ```
 * npx vitest run --config critic/bench/advisor-v3/vitest.config.ts
 * ```
 *
 * Env: `SCORECARD_SEEDS` (40), `SCORECARD_CHAPTERS` (comma ids; default every listed
 * FFX and FFX-2 chapter), `SCORECARD_DRIVERS` (`card`, or `card,intended` to add the
 * chapter's own line at the same pace for scale), `SCORECARD_TAG` (the results file
 * name, `results-<tag>.json` beside this file), `SCORECARD_PURITY=0` skips the purity
 * check. Not part of `npm test` (its config includes only `tests/unit/**`).
 *
 * Game case: **both** (AGENTS.md rule 14); duplicate advice is an FFX-2-only reading.
 */

import { afterAll, describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from '../../../src/battle/common/types.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, listedChapters, runChapter, type DecisionContext, type Driver, type RunResult } from './drive.ts';
import { observe, type DecisionObs } from './metrics.ts';

const SEEDS = Number(process.env['SCORECARD_SEEDS'] ?? 40);
const CHAPTERS = (process.env['SCORECARD_CHAPTERS'] ?? '').split(',').filter(Boolean);
const DRIVERS = (process.env['SCORECARD_DRIVERS'] ?? 'card').split(',').filter(Boolean);
const TAG = process.env['SCORECARD_TAG'] ?? 'baseline-v2';
const HERE = dirname(fileURLToPath(import.meta.url));

interface Tally {
  chapterId: string; game: string; driver: string; seeds: number; wins: number; linksCleared: number;
  outcomes: Record<string, number>; decisions: number; closed: number; refused: number; fallbacks: number; minutes: number;
  pendingDecisions: number; dupStrict: number; dupSame: number; dupCensus: Record<string, number>;
  downDecisions: number; raiseOnMenu: number; topRaises: number; runnerUpRaises: number; noteOnMiss: number;
  missedRevive: number; missedWhileLosing: number; lostRunsWithMissedRevive: number;
  notOnMenu: number; badAim: number; lethalThreat: number; savable: number; lethalMiss: number;
  latencies: number[];
}

function tally(chapterId: string, game: string, driver: string): Tally {
  return {
    chapterId, game, driver, seeds: 0, wins: 0, linksCleared: 0, outcomes: {}, decisions: 0, closed: 0, refused: 0,
    fallbacks: 0, minutes: 0, pendingDecisions: 0, dupStrict: 0, dupSame: 0, dupCensus: {}, downDecisions: 0,
    raiseOnMenu: 0, topRaises: 0, runnerUpRaises: 0, noteOnMiss: 0, missedRevive: 0, missedWhileLosing: 0,
    lostRunsWithMissedRevive: 0, notOnMenu: 0, badAim: 0, lethalThreat: 0, savable: 0, lethalMiss: 0, latencies: [],
  };
}

function add(t: Tally, o: DecisionObs): void {
  if (o.pending > 0) t.pendingDecisions += 1;
  if (o.dupStrict) t.dupStrict += 1;
  if (o.dupSame) t.dupSame += 1;
  if (o.dupWhat) t.dupCensus[o.dupWhat] = (t.dupCensus[o.dupWhat] ?? 0) + 1;
  if (o.down > 0) t.downDecisions += 1;
  if (o.raiseOnMenu) t.raiseOnMenu += 1;
  if (o.raiseOnMenu && o.topRaises) t.topRaises += 1;
  if (o.missedRevive) {
    t.missedRevive += 1;
    if (o.runnerUpRaises) t.runnerUpRaises += 1;
    if (o.noteShown) t.noteOnMiss += 1;
    if (o.losing) t.missedWhileLosing += 1;
  }
  if (o.notOnMenu) t.notOnMenu += 1;
  if (o.badAim) t.badAim += 1;
  if (o.lethalThreat) t.lethalThreat += 1;
  if (o.savable) t.savable += 1;
  if (o.lethalMiss) t.lethalMiss += 1;
}

/** The card follower, observed. `observeOn = false` is the purity control. */
function cardDriver(t: Tally | null, missed: { any: boolean }, observeOn = true): Driver {
  return (ctx: DecisionContext): Command | null => {
    const t0 = performance.now();
    const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, ctx.advisorOptions);
    t?.latencies.push(performance.now() - t0);
    if (observeOn && t) {
      const o = observe(ctx, view);
      add(t, o);
      if (o.missedRevive) missed.any = true;
    }
    return view?.suggestions[0]?.command ?? null;
  };
}

const intendedDriver: Driver = (ctx) => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);

function pct(n: number, d: number): string {
  return d > 0 ? `${((100 * n) / d).toFixed(1)} %` : '—';
}

function pctl(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.round((p / 100) * (s.length - 1)))]!;
}

const tallies: Tally[] = [];
const chapters = CHAPTERS.length > 0 ? CHAPTERS.map(chapterById) : listedChapters();

describe('advisor scorecard', () => {
  if (process.env['SCORECARD_PURITY'] !== '0') {
    it('purity: the observers leave the battle exactly as they found it', async () => {
      for (const id of ['seymour-flux', 'ffx2-vegnagun-shuyin']) {
        for (const seed of [1, 2]) {
          const ch = chapterById(id);
          const on = await runChapter(ch, seed, cardDriver(tally(id, ch.game, 'card'), { any: false }, true));
          const off = await runChapter(ch, seed, cardDriver(null, { any: false }, false));
          expect([on.outcome, on.decisions, on.finalLogLength, on.finalLogDigest]).toEqual([off.outcome, off.decisions, off.finalLogLength, off.finalLogDigest]);
        }
      }
    }, 600_000);
  }

  for (const ch of chapters) {
    for (const driver of DRIVERS) {
      it(`${ch.id} (${ch.game}), ${driver}, ${SEEDS} seeds`, async () => {
        const t = tally(ch.id, ch.game, driver);
        for (let seed = 1; seed <= SEEDS; seed++) {
          const missed = { any: false };
          const r: RunResult = await runChapter(ch, seed, driver === 'intended' ? intendedDriver : cardDriver(t, missed));
          t.seeds += 1;
          if (r.outcome === 'victory') t.wins += 1;
          else if (missed.any) t.lostRunsWithMissedRevive += 1;
          t.outcomes[r.outcome] = (t.outcomes[r.outcome] ?? 0) + 1;
          t.linksCleared += r.linksCleared;
          t.decisions += r.decisions;
          t.closed += r.closed;
          t.refused += r.refused;
          t.fallbacks += r.fallbacks;
          t.minutes += r.minutes;
        }
        tallies.push(t);
        expect(t.seeds).toBe(SEEDS);
      }, 3_600_000);
    }
  }

  afterAll(() => {
    if (tallies.length === 0) return;
    const lines = [
      '',
      `Advisor scorecard, tag ${TAG}, ${SEEDS} seeds; FFX-2 at human pace (Wait split, 0.5 s top / 1.0 s held).`,
      '',
      '| Chapter | Game | Driver | Wins | Links (avg) | Decisions | Dup strict / pending | Dup same move | Down: raise on menu | Missed revive (losing) | Runner-up raise / note on miss | Not on menu / bad aim | Lethal: savable / missed | Fallbacks / refused / closed | p50 / p95 ms |',
      '|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|---|---|---|',
      ...tallies.map((t) =>
        `| ${t.chapterId} | ${t.game} | ${t.driver} | ${t.wins}/${t.seeds} | ${(t.linksCleared / t.seeds).toFixed(2)} | ${t.decisions} | ` +
        `${t.dupStrict} / ${t.pendingDecisions} (${pct(t.dupStrict, t.pendingDecisions)}) | ${t.dupSame} | ${t.raiseOnMenu} | ` +
        `${t.missedRevive} (${t.missedWhileLosing}); ${pct(t.missedRevive, t.raiseOnMenu)} | ${t.runnerUpRaises} / ${t.noteOnMiss} | ` +
        `${t.notOnMenu} / ${t.badAim} | ${t.savable} / ${t.lethalMiss} of ${t.lethalThreat} | ${t.fallbacks} / ${t.refused} / ${t.closed} | ` +
        `${pctl(t.latencies, 50).toFixed(1)} / ${pctl(t.latencies, 95).toFixed(1)} |`),
      '',
      'Duplicate census (pending -> top row, most frequent):',
      ...tallies.filter((t) => Object.keys(t.dupCensus).length > 0).map((t) =>
        `- ${t.chapterId}: ${Object.entries(t.dupCensus).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} x${v}`).join(', ')}`),
    ];
    console.log(lines.join('\n'));
    const out = tallies.map(({ latencies, ...rest }) => ({ ...rest, latencyP50: pctl(latencies, 50), latencyP95: pctl(latencies, 95) }));
    writeFileSync(join(HERE, `results-${TAG}.json`), JSON.stringify({ tag: TAG, seeds: SEEDS, when: new Date().toISOString(), rows: out }, null, 2));
  });
});
