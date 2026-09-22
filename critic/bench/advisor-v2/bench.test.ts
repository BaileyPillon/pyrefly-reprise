/**
 * **The forty-seed sweep.** Five chapters, three drivers, one table.
 *
 * Run it on its own, never as part of `npm test`:
 *
 * ```
 * npx vitest run --config critic/bench/advisor-v2/vitest.config.ts
 * ```
 *
 * Narrow it while iterating with `BENCH_SEEDS`, `BENCH_CHAPTERS`,
 * `BENCH_DRIVERS` (comma lists). Writes `results.json` beside this file; the
 * handoff quotes it rather than a number typed by hand.
 *
 * ## Which game
 *
 * **Both** — the five chapters are three FFX and two FFX-2, and every row of
 * the table is reported per chapter so a regression in one game can never hide
 * inside the other's average [AGENTS.md rule 14].
 */

import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CHAPTER_IDS,
  type DriverName,
  type RunResult,
  run,
  summarise,
} from './harness.ts';

const SEEDS = Number(process.env.BENCH_SEEDS ?? 40);
const CHAPTERS =
  process.env.BENCH_CHAPTERS?.split(',').filter(Boolean) ?? ([...CHAPTER_IDS] as string[]);
const DRIVERS = (process.env.BENCH_DRIVERS?.split(',').filter(Boolean) ?? [
  'intended',
  'advisor-v1',
  'advisor-v2',
]) as DriverName[];

describe('advisor v2 bench', () => {
  it(
    `${CHAPTERS.length} chapters x ${SEEDS} seeds x ${DRIVERS.join('/')}`,
    () => {
      const rows: ReturnType<typeof summarise>[] = [];
      const all: RunResult[] = [];
      for (const chapterId of CHAPTERS) {
        for (const driver of DRIVERS) {
          const runs: RunResult[] = [];
          for (let seed = 1; seed <= SEEDS; seed += 1) {
            runs.push(run(chapterId, seed, driver));
          }
          all.push(...runs);
          const s = summarise(runs);
          rows.push(s);
          // eslint-disable-next-line no-console
          console.log(
            `${chapterId.padEnd(22)} ${driver.padEnd(11)} ` +
              `${String(s.wins).padStart(3)}/${s.seeds} W  ` +
              `${s.winRate.toFixed(1).padStart(5)}%  ` +
              `turns~${String(s.medianTurns).padStart(4)}  ` +
              `dec~${String(s.medianDecisions).padStart(5)}  ` +
              `p50 ${String(s.latencyP50).padStart(6)}ms  p95 ${String(s.latencyP95).padStart(6)}ms  ` +
              `declines ${s.declines} (${s.seedsWithDeclines}/${s.seeds} seeds)  ` +
              JSON.stringify(s.outcomes),
          );
        }
      }
      writeFileSync(
        new URL(`./results${process.env.BENCH_TAG ? `-${process.env.BENCH_TAG}` : ''}.json`, import.meta.url),
        `${JSON.stringify({ seeds: SEEDS, at: new Date().toISOString(), rows }, null, 2)}\n`,
      );
      expect(rows.length).toBe(CHAPTERS.length * DRIVERS.length);
    },
    30 * 60_000,
  );
});
