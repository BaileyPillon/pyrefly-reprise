/**
 * **What Wait's split costs, chapters 4, 5, 6** (measurement, skipped unless
 * `PYREFLY_MEASURE=1`). FFX-2 only (AGENTS.md rule 14).
 *
 * The PR-0076 bench's method (`critic/bench/ffx2-wait/bench.test.ts`, read-only
 * for this track): 40 seeds, the shipped `intendedStrategy`, a modelled human
 * decision time `D` handed to the clock at every menu. `D` and the top-list
 * share `T` are **authored measurement inputs, not game data**. Before = the
 * live Wait (the whole-menu hold, split off); after = the split, with `T` of the
 * `D` spent on the top-level list (the clock runs) and the rest inside a
 * submenu (held). Active at the same `D` is the control. Nothing here tunes a
 * boss (hard rule 6). `docs/plans/ffx2-wait-split-review.md` §4 and build pass.
 *
 * ```
 * PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-wait-split-measure.test.ts
 * ```
 */

import { describe, expect, it } from 'vitest';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import { driveChapter4, driveChapter5, driveChapter6, type DriveResult } from './helpers/ffx2ChapterDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

type Drive = (seed: number, d: number, extra: Partial<Ffx2EngineOptions>, prepare?: undefined, topMs?: number) => DriveResult;

interface Arm {
  label: string;
  d: number;
  extra: Partial<Ffx2EngineOptions>;
  topMs?: number;
}

const ARMS: Arm[] = [
  { label: 'before: Wait, whole-menu hold', d: 0, extra: { atbMode: 'wait', waitSplit: false } },
  { label: 'before: Wait, whole-menu hold', d: 1500, extra: { atbMode: 'wait', waitSplit: false } },
  { label: 'after: Wait split, T 0', d: 0, extra: { atbMode: 'wait', waitSplit: true }, topMs: 0 },
  { label: 'after: Wait split, T 0', d: 1500, extra: { atbMode: 'wait', waitSplit: true }, topMs: 0 },
  { label: 'after: Wait split, T 500', d: 1500, extra: { atbMode: 'wait', waitSplit: true }, topMs: 500 },
  { label: 'after: Wait split, T 1500', d: 1500, extra: { atbMode: 'wait', waitSplit: true }, topMs: 1500 },
  { label: 'control: Active', d: 1500, extra: { atbMode: 'active' } },
];

const CHAPTERS: Array<[string, Drive]> = [
  ['ch4 Bahamut', driveChapter4],
  ['ch5 Vegnagun', driveChapter5],
  ['ch6 Leblanc', driveChapter6],
];

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : (s[Math.floor((s.length - 1) / 2)]! + s[Math.ceil((s.length - 1) / 2)]!) / 2;
}

describe.skipIf(!MEASURE)('Wait split: chapters 4, 5, 6, forty seeds per arm (PYREFLY_MEASURE=1)', () => {
  for (const [name, drive] of CHAPTERS) {
    it(name, () => {
      const lines = [`\n${name}: arm | D | wins | median s | menus invalidated | commands held | refused`];
      for (const arm of ARMS) {
        const runs = SEEDS.map((seed) => drive(seed, arm.d, arm.extra, undefined, arm.topMs));
        const wins = runs.filter((r) => r.outcome === 'victory').length;
        lines.push(
          [
            arm.label,
            `${arm.d} ms`,
            `${wins}/${SEEDS.length}`,
            median(runs.map((r) => r.ticks / 3000)).toFixed(1),
            runs.reduce((a, r) => a + r.invalidated, 0),
            runs.reduce((a, r) => a + r.held, 0),
            runs.reduce((a, r) => a + r.refused, 0),
          ].join(' | '),
        );
      }
      console.log(lines.join('\n'));
      expect(true).toBe(true);
    }, 1_800_000);
  }
});

describe('the measurement harness drives chapter 6 (always runs)', () => {
  it('Leblanc, seed 1, Wait at D = 0 reaches an outcome', () => {
    const r = driveChapter6(1, 0, { atbMode: 'wait' });
    expect(r.outcome).toBeDefined();
  }, 60_000);
});
