/**
 * **The strategy guide's line, measured against today's line** (Bailey 2026-10-03: the guide follows
 * the encounter guides and is its own thing, apart from the move advisor; `docs/handoff/r38-guide-jegged.md`).
 *
 * Information, never a gate and never a reason to change a chapter: how often the party wins a chapter
 * when it presses the guide's NEXT at every open decision, next to how often it wins pressing today's
 * shipped line. Three drivers, one engine, one set of seeds:
 *
 * - **intended**: the shipped `intendedStrategy` (what `__pyrefly.autoBattle('intended')` plays), the
 *   line the chapter's tactic and the move advisor use. The guide does not read it.
 * - **line**: the guide's own line as the panel shows it (plan steps, support steps, last resort).
 * - **plan**: the guide's plan steps only, then the same last resort. It leaves out the support steps (the
 *   revive, the heal, the idle turn) that no encounter guide spells out, so it is not a whole strategy: it
 *   can stall (a fight neither side finishes) and is printed for completeness, not as a result.
 *
 * Each run plays the whole chain from its first link through the app's own chapter setup and the
 * screen's own carry (`setupForChapter`, `setupForNextLink`), on the registered chapter record, so a
 * link's party is what the player brings to it. FFX is CTB (the clock never runs while a menu is open),
 * FFX-2 runs in Wait mode with no decision time, which is the bench speed every FFX-2 bench uses; the
 * Road's, the Den's and Trema's human-speed tables are in their own benches and are not repeated here.
 * One try, no retries, no checkpoints: a chain lost is a chain lost.
 *
 * **Measure, never tune.** `PYREFLY_MEASURE=1` runs 200 seeds a row (`GLINE_SEEDS` overrides) and prints
 * one `GLINE {json}` line per row; by default it is a one-seed smoke that pins only that every run ends.
 * `GLINE_CHAPTERS`, `GLINE_DRIVERS` narrow a run (comma lists); `GLINE_FIRST` moves the first seed.
 *
 * **Game case: both** [AGENTS.md rule 14]: FFX chapters on the CTB engine, FFX-2 chapters on the ATB
 * engine, each with its own chapter list and its own setup.
 */

import { describe, expect, it } from 'vitest';
import type { AutoStrategy } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { guideLineStrategy, guidePlanStrategy } from '../../src/engine/tactics/guide-line.ts';
import { guidedChapters, playChapter } from './helpers/guideLineDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['GLINE_SEEDS'] ?? (MEASURE ? 200 : 1));
const FIRST = Number(process.env['GLINE_FIRST'] ?? 1);
const list = (key: string, all: string[]): string[] => (process.env[key] ? process.env[key]!.split(',') : all);

type Driver = 'intended' | 'line' | 'plan';
const STRATEGIES: Readonly<Record<Driver, AutoStrategy>> = {
  intended: intendedStrategy,
  line: guideLineStrategy,
  plan: guidePlanStrategy,
};

const chapters = guidedChapters();
const wantedChapters = list('GLINE_CHAPTERS', chapters.map((c) => c.id));
const wantedDrivers = list('GLINE_DRIVERS', ['intended', 'line', 'plan']) as Driver[];

describe(`the guide's line against today's line (${SEEDS} seeds a row, both games)`, () => {
  for (const chapter of chapters) {
    it.skipIf(!wantedChapters.includes(chapter.id))(
      `${chapter.id} (${chapter.game}): every run reaches an outcome; one GLINE line per driver`,
      () => {
        for (const driver of wantedDrivers) {
          const t0 = Date.now();
          let wins = 0;
          let decisions = 0;
          let declines = 0;
          let stalled = 0;
          const lossAtLink: Record<string, number> = {};
          for (let seed = FIRST; seed < FIRST + SEEDS; seed++) {
            const run = playChapter(chapter.id, seed, STRATEGIES[driver], {
              maxDecisions: 20_000,
              onDecision: (d) => {
                if (d.picked === null) declines += 1;
              },
            });
            // A whole strategy always ends the fight; the plan-only arm is not one and may stall.
            if (run.outcome === 'cap') {
              stalled += 1;
              if (driver !== 'plan') expect.fail(`${chapter.id} ${driver} seed ${seed} never ended`);
              continue;
            }
            decisions += run.decisions;
            if (run.outcome === 'victory') wins += 1;
            else lossAtLink[`link ${run.links}`] = (lossAtLink[`link ${run.links}`] ?? 0) + 1;
          }
          console.log(
            `GLINE ${JSON.stringify({
              chapterId: chapter.id,
              game: chapter.game,
              driver,
              seeds: SEEDS,
              first: FIRST,
              wins,
              winPct: +((100 * wins) / SEEDS).toFixed(1),
              stalled,
              decisionsPerRun: +(decisions / Math.max(1, SEEDS - stalled)).toFixed(1),
              declinesPerRun: +(declines / SEEDS).toFixed(2),
              lossAtLink,
              ms: Date.now() - t0,
            })}`,
          );
        }
      },
      MEASURE ? 0 : 180_000,
    );
  }
});
