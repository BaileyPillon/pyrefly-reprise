/**
 * **IC-1 and IC-2 (2026-09-26): what the all-target fix and the immune-hit chain switch do to every
 * listed FFX-2 chapter.** Measurement only, skipped unless `PYREFLY_MEASURE=1`. **FFX-2 only**
 * (AGENTS.md rule 14): the FFX engine has its own resolver and is not touched.
 *
 * Three arms on the same seeds: the branch as built (the IC-2 fix, and Acta Est Fabula on the
 * Redoubts only, `NAMED_TARGETS_ONLY`); `ic2-only` (Acta's old target set, the Head included); and
 * `switch`, the built engine with IC-1's named OFF switch `immuneHitsSkipChain` turned on
 * (`research/ffx2-combat-core.md` §9.2: whether an immune hit feeds a chain is unsourced). The
 * before column is the same file run on ea05f877, the commit before the fix
 * (`docs/plans/ffx2-engine-fixes-2026-09-26.md`).
 *
 * Speeds, as every FFX-2 bench measures them: bench (zero decision time) and human (the live default
 * Wait split, 1.5 s a menu, 0.5 s of it on the top-level list with the clock running), plus Active at
 * 1.5 s a menu (the clock runs under the whole menu). 200 seeds. `ENGINE_FIX_ARMS`,
 * `ENGINE_FIX_SPEEDS` and `ENGINE_FIX_CHAPTERS` (comma-separated prefixes) narrow a run.
 * Each chapter is one unbroken run in the shipped order with its shipped line. Nothing here tunes a
 * boss (hard rule 6).
 *
 * `ENGINE_FIX_HASH_OUT=<file>` writes each run's event-log hash; `ENGINE_FIX_HASH_BASE=<file>`
 * counts the seeds whose log differs from that file (which chapters' logs move).
 *
 * ```
 * PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-engine-fixes-bench.test.ts --testTimeout=60000
 * ```
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import { driveChapter4, driveChapter5, driveChapter6 } from './helpers/ffx2ChapterDrive.ts';
import { driveChain as driveRoad, LINES as ROAD } from './helpers/fallenAeonsDrive.ts';
import { driveChapter as driveTrema, LINES as TREMA } from './helpers/tremaDrive.ts';
import { FFX2_TREMA } from '../../src/data/chapter-ffx2-trema.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['ENGINE_FIX_SEEDS'] ?? 200);
const HASH_OUT = process.env['ENGINE_FIX_HASH_OUT'];
const HASH_BASE = process.env['ENGINE_FIX_HASH_BASE'];
const ARMS = (process.env['ENGINE_FIX_ARMS'] ?? 'built,menu,switch,both').split(',');
/**
 * `built`: the branch, option B (IC-2 fix, Acta on the Redoubts only); `ic2-only`: Acta's old target
 * set; `switch`: plus IC-1's switch; `menu`: plus the menu-cancel correction (§9.2, only a Delay or
 * Action-cancel ability closes an open menu, `menuCancelOnlyDelayAbilities`); `both`: plus both.
 */
const ARM_OPTIONS: Record<string, Partial<Ffx2EngineOptions>> = {
  built: {},
  'ic2-only': { namedTargetsOnly: false },
  switch: { immuneHitsSkipChain: true },
  menu: { menuCancelOnlyDelayAbilities: true },
  both: { immuneHitsSkipChain: true, menuCancelOnlyDelayAbilities: true },
};

interface Speed { name: string; decisionMs: number; topMs?: number; engine: Partial<Ffx2EngineOptions> }
const SPEED_LIST: Speed[] = [
  { name: 'human 1.5 s / 0.5 s', decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } },
  // Active at human pace: the clock runs under the whole menu, where the menu-cancel rule matters most.
  { name: 'active 1.5 s', decisionMs: 1500, engine: { atbMode: 'active' } },
  { name: 'bench D=0', decisionMs: 0, engine: {} },
];
const SPEED_FILTER = process.env['ENGINE_FIX_SPEEDS']?.split(',');
const SPEEDS = SPEED_FILTER ? SPEED_LIST.filter((s) => SPEED_FILTER.some((f) => s.name.startsWith(f))) : SPEED_LIST;
const CHAPTER_FILTER = process.env['ENGINE_FIX_CHAPTERS']?.split(',');

type Run = { outcome: string | undefined; logs: readonly (readonly BattleEvent[])[]; ticks: number };
type Drive = (seed: number, s: Speed, extra: Partial<Ffx2EngineOptions>) => Run;

const flat = (r: { outcome: string | undefined; links: Array<{ log: readonly BattleEvent[]; ticks: number }> }): Run => ({
  outcome: r.outcome,
  logs: r.links.map((l) => l.log),
  ticks: r.links.reduce((t, l) => t + l.ticks, 0),
});
const TREMA_SHIPPED = { build: FFX2_TREMA.buildRef as FFX2PartyBuild, paragonGroup: FFX2_TREMA.enemyGroupRef.id };

const CHAPTERS: Array<[string, Drive]> = [
  ['IV Bahamut', (seed, s, x) => driveChapter4(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs)],
  ['V Vegnagun', (seed, s, x) => driveChapter5(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs)],
  ['VI Leblanc', (seed, s, x) => driveChapter6(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs)],
  ['XI Fallen Aeons', (seed, s, x) => flat(driveRoad([ROAD.shivaIntended, ROAD.sistersDarknessDispel, ROAD.animaIntended], seed, {
    decisionMs: s.decisionMs, ...(s.topMs !== undefined ? { topMs: s.topMs } : {}), engine: { ...s.engine, ...x },
  }))],
  ['XIII Trema', (seed, s, x) => flat(driveTrema(TREMA.kitIntended, seed, {
    ...TREMA_SHIPPED, decisionMs: s.decisionMs, ...(s.topMs !== undefined ? { topMs: s.topMs } : {}), engine: { ...s.engine, ...x },
  }))],
];

function hashOf(r: Run): string {
  const h = createHash('sha256');
  for (const log of r.logs) h.update(JSON.stringify(log));
  return h.digest('hex').slice(0, 16);
}

const base: Record<string, string> = HASH_BASE && existsSync(HASH_BASE) ? JSON.parse(readFileSync(HASH_BASE, 'utf8')) : {};
const hashes: Record<string, string> = {};
const rows: string[] = [];

describe.skipIf(!MEASURE)('IC-1 / IC-2: every FFX-2 chapter, bench and human Wait split (PYREFLY_MEASURE=1)', () => {
  for (const [name, drive] of CHAPTERS) {
    if (CHAPTER_FILTER && !CHAPTER_FILTER.some((f) => name.startsWith(f))) continue;
    it(name, () => {
      for (const arm of ARMS) {
        const extra: Partial<Ffx2EngineOptions> = ARM_OPTIONS[arm] ?? {};
        for (const speed of SPEEDS) {
          let wins = 0;
          let unfinished = 0;
          let minutes = 0;
          let moved = 0;
          let vsBuilt = 0;
          for (let seed = 1; seed <= SEEDS; seed++) {
            const r = drive(seed, speed, extra);
            if (r.outcome === 'victory') wins += 1;
            if (r.outcome === undefined) unfinished += 1;
            minutes += r.ticks / 3000 / 60;
            const key = `${name}|${speed.name}|${arm}|${seed}`;
            const h = hashOf(r);
            hashes[key] = h;
            const was = base[`${name}|${speed.name}|built|${seed}`];
            if (was !== undefined && was !== h) moved += 1;
            const built = hashes[`${name}|${speed.name}|built|${seed}`];
            if (built !== undefined && built !== h) vsBuilt += 1;
          }
          const p = wins / SEEDS;
          const five = 1 - (1 - p) ** 5;
          rows.push(`| ${name} | ${speed.name} | ${arm} | ${wins}/${SEEDS} | ${(100 * p).toFixed(1)} % | ${(100 * five).toFixed(1)} % | ${(minutes / SEEDS).toFixed(2)} | ${HASH_BASE ? `${moved}/${SEEDS}` : '—'} | ${vsBuilt}/${SEEDS} | ${unfinished} |`);
          expect(wins + unfinished).toBeLessThanOrEqual(SEEDS);
        }
      }
    }, 3_600_000);
  }
  afterAll(() => {
    if (HASH_OUT) writeFileSync(HASH_OUT, JSON.stringify(hashes));
    console.log([
      '',
      '| Chapter | Speed | Arm | Wins | First try | Within 5 (independent retries, computed) | Avg min | Logs moved vs base | Logs moved vs built | Unfinished |',
      '|---|---|---|---:|---:|---:|---:|---:|---:|---:|',
      ...rows,
    ].join('\n'));
  });
});
