/**
 * **Iteration 2, batch B1: the FFX-2 switches measured on every FFX-2 chapter.** Measurement only,
 * skipped unless `PYREFLY_MEASURE=1`. **FFX-2 only** (AGENTS.md rule 14): the three switches are
 * FFX-2 rules (chains, dresspheres, the Leblanc Syndicate) and the six chapters are FFX-2's.
 *
 * Arms, each an OFF switch turned on for the run (nothing here tunes a boss, hard rule 6):
 * - `off`: the engine as shipped (every switch at its constant's default).
 * - `ic1`: IC-1 / PR-0209, an immune or Invincible hit opens no chain (`immuneHitsSkipChain`;
 *   `research/ffx2-combat-core.md` §10.1, Split_Infinity G1032, GameFAQs' reading, our estimate).
 * - `carry`: PR-0124, the worn dressphere carries across a chain seam, gates and the special
 *   unlock do not (`research/ffx2-combat-core.md` §10.2, KADFC FAQ 38278, our estimate).
 * - `leblanc`: PR-0106, the failsafe fires once and turn 5 is Fan Slap
 *   (`research/ffx2-leblanc-syndicate.md` §19, SinirothX, our estimate; conflicts with the wiki).
 * - `all`: the three together.
 *
 * Speeds, as every FFX-2 bench measures them: human (the live Wait split, 1.5 s a menu, 0.5 s of it
 * on the top list), Active 1.5 s, and bench (zero decision time). Each chapter is one unbroken run
 * in the shipped order with its shipped line; XV is the shipped Den (`den-of-woe-shipped-bench`).
 *
 * `B1_SEEDS`, `B1_ARMS`, `B1_SPEEDS`, `B1_CHAPTERS` (comma-separated prefixes) narrow a run.
 * `B1_HASH_OUT=<file>` writes each run's event-log hash; `B1_HASH_BASE=<file>` counts the seeds
 * whose log differs from that file (the byte-identical checks: PR-0083's split, every OFF arm).
 *
 * ```
 * PYREFLY_MEASURE=1 npx vitest run tests/unit/iter2-b1-bench.test.ts --testTimeout=0
 * ```
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';

/**
 * The seam switch, set per run (the drivers call `setupForNextLink` themselves), and PR-0124's probe:
 * the shipped lines never spherechange before a seam, so the carry arm cannot move them. The
 * "change once" rows play a player who changes each girl's dressphere on her first turn (the first
 * enabled Change row, the next node of her grid), then the shipped line (`intendedStrategy`).
 */
const seam = vi.hoisted(() => ({ carry: false, changeOnce: false, changed: new Set<string>() }));
vi.mock('../../src/engine/BattlePresenterStrategies.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/BattlePresenterStrategies.ts')>();
  const wrapped: typeof real.intendedStrategy = (actorId, commands, engine) => {
    if (seam.changeOnce && !seam.changed.has(actorId)) {
      seam.changed.add(actorId);
      const row = commands.find((c) => c.enabled && c.command.kind === 'spherechange');
      if (row) return { ...row.command, targets: [actorId] } as ReturnType<typeof real.intendedStrategy>;
    }
    return real.intendedStrategy(actorId, commands, engine);
  };
  return { ...real, intendedStrategy: wrapped };
});
vi.mock('../../src/app/screens/BattleScreenSetup.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/app/screens/BattleScreenSetup.ts')>();
  type Args = Parameters<typeof real.setupForNextLink>;
  return {
    ...real,
    setupForNextLink: (a: Args[0], b: Args[1], c: Args[2], d: Args[3], e?: Args[4]) =>
      real.setupForNextLink(a, b, c, d, seam.carry ? { ...e, dressphereCarries: true } : e),
  };
});

const { driveChapter4, driveChapter5, driveChapter6 } = await import('./helpers/ffx2ChapterDrive.ts');
const { driveChain: driveRoad, LINES: ROAD } = await import('./helpers/fallenAeonsDrive.ts');
const { driveChapter: driveTrema, LINES: TREMA } = await import('./helpers/tremaDrive.ts');
const { driveDen, LINES: DEN } = await import('./helpers/denOfWoeDrive.ts');
const { FFX2_TREMA } = await import('../../src/data/chapter-ffx2-trema.ts');
const { FFX2_DEN_OF_WOE_SHIPPED } = await import('../../src/data/chapter-den-of-woe-ship.ts');
const { DEN_OF_WOE_HERO_DRINKS } = await import('../../src/data/ffx2/builds/den-of-woe.ts');
const { DEN_OF_WOE_LIGHTFALL_PREP } = await import('../../src/data/guides/ffx2-den-of-woe.ts');

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['B1_SEEDS'] ?? 200);
const HASH_OUT = process.env['B1_HASH_OUT'];
const HASH_BASE = process.env['B1_HASH_BASE'];
const ARMS = (process.env['B1_ARMS'] ?? 'off,ic1,carry,leblanc,all').split(',');

interface Arm { engine: Partial<Ffx2EngineOptions>; carry: boolean }
const ARM_OPTIONS: Record<string, Arm> = {
  off: { engine: {}, carry: false },
  ic1: { engine: { immuneHitsSkipChain: true }, carry: false },
  carry: { engine: {}, carry: true },
  leblanc: { engine: { leblancScriptSinirothX: true }, carry: false },
  all: { engine: { immuneHitsSkipChain: true, leblancScriptSinirothX: true }, carry: true },
  /** PR-0107: Chapter VI's Acts II and III open on randomised bars (a sourced rule, OFF by the stop rule). */
  sep: { engine: { separateBattleGauges: true }, carry: false },
};

interface Speed { name: string; decisionMs: number; topMs?: number; engine: Partial<Ffx2EngineOptions> }
const SPEED_LIST: Speed[] = [
  { name: 'human 1.5 s / 0.5 s', decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } },
  { name: 'active 1.5 s', decisionMs: 1500, engine: { atbMode: 'active' } },
  { name: 'bench D=0', decisionMs: 0, engine: {} },
];
const SPEED_FILTER = process.env['B1_SPEEDS']?.split(',');
const SPEEDS = SPEED_FILTER ? SPEED_LIST.filter((s) => SPEED_FILTER.some((f) => s.name.startsWith(f))) : SPEED_LIST;
const CHAPTER_FILTER = process.env['B1_CHAPTERS']?.split(',');

type Run = { outcome: string | undefined; logs: readonly (readonly BattleEvent[])[]; ticks: number };
type Drive = (seed: number, s: Speed, extra: Partial<Ffx2EngineOptions>) => Run;
/** A drive with the "change once" player (PR-0124's probe rows). */
const changing = (drive: Drive): Drive => (seed, s, x) => {
  seam.changeOnce = true;
  seam.changed.clear();
  try { return drive(seed, s, x); } finally { seam.changeOnce = false; }
};

const flat = (r: { outcome: string | undefined; links: Array<{ log: readonly BattleEvent[]; ticks: number }> }): Run => ({
  outcome: r.outcome,
  logs: r.links.map((l) => l.log),
  ticks: r.links.reduce((t, l) => t + l.ticks, 0),
});
const top = (s: Speed): { topMs?: number } => (s.topMs !== undefined ? { topMs: s.topMs } : {});
const TREMA_SHIPPED = { build: FFX2_TREMA.buildRef as FFX2PartyBuild, paragonGroup: FFX2_TREMA.enemyGroupRef.id };
const DEN_KIT = FFX2_DEN_OF_WOE_SHIPPED.buildRef as FFX2PartyBuild;
const DEN_LINE = { ...(DEN_OF_WOE_LIGHTFALL_PREP ? DEN.intended : DEN.noPrep), heroDrink: DEN_OF_WOE_HERO_DRINKS > 0 };

const CHAPTERS: Array<[string, Drive]> = [
  ['IV Bahamut', (seed, s, x) => driveChapter4(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs)],
  ['V Vegnagun', (seed, s, x) => driveChapter5(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs)],
  ['VI Leblanc', (seed, s, x) => driveChapter6(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs)],
  ['V change once', changing((seed, s, x) => driveChapter5(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs))],
  ['VI change once', changing((seed, s, x) => driveChapter6(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs))],
  ['XI Fallen Aeons', (seed, s, x) => flat(driveRoad([ROAD.shivaIntended, ROAD.sistersDarknessDispel, ROAD.animaIntended], seed, {
    decisionMs: s.decisionMs, ...top(s), engine: { ...s.engine, ...x },
  }))],
  ['XIII Trema', (seed, s, x) => flat(driveTrema(TREMA.kitIntended, seed, {
    ...TREMA_SHIPPED, decisionMs: s.decisionMs, ...top(s), engine: { ...s.engine, ...x },
  }))],
  ['XV Den of Woe', (seed, s, x) => {
    const logs: BattleEvent[][] = [];
    const r = driveDen(DEN_LINE, seed, {
      party: DEN_KIT, decisionMs: s.decisionMs, ...top(s), engine: { atbMode: 'wait', ...s.engine, ...x },
      inspect: (engine) => { logs.push([...engine.state().log]); },
    });
    return { outcome: r.outcome, logs, ticks: r.links.reduce((t, l) => t + l.ticks, 0) };
  }],
];

const PARTY = new Set(['yuna', 'rikku', 'paine']);

function hashOf(r: Run): string {
  const h = createHash('sha256');
  for (const log of r.logs) h.update(JSON.stringify(log));
  return h.digest('hex').slice(0, 16);
}

/** Damage the girls took, and the longest chain the party built on an enemy. */
function anatomy(r: Run): { taken: number; chain: number } {
  let taken = 0;
  let chain = 0;
  for (const log of r.logs) {
    for (const e of log) {
      if (e.type === 'damage' && PARTY.has(e.targetId) && e.amount > 0) taken += e.amount;
      if (e.type === 'chain' && !PARTY.has(e.targetId)) chain = Math.max(chain, e.count);
    }
  }
  return { taken, chain };
}

const base: Record<string, string> = HASH_BASE && existsSync(HASH_BASE) ? JSON.parse(readFileSync(HASH_BASE, 'utf8')) : {};
const hashes: Record<string, string> = {};
const rows: string[] = [];

describe.skipIf(!MEASURE)('B1: the FFX-2 switches on every FFX-2 chapter (PYREFLY_MEASURE=1)', () => {
  for (const [name, drive] of CHAPTERS) {
    if (CHAPTER_FILTER && !CHAPTER_FILTER.some((f) => name.startsWith(f))) continue;
    it(name, () => {
      for (const armName of ARMS) {
        const arm = ARM_OPTIONS[armName];
        if (!arm) throw new Error(`no arm ${armName}`);
        for (const speed of SPEEDS) {
          let wins = 0;
          let unfinished = 0;
          let minutes = 0;
          let taken = 0;
          let chain = 0;
          let moved = 0;
          let vsOff = 0;
          seam.carry = arm.carry;
          for (let seed = 1; seed <= SEEDS; seed++) {
            const r = drive(seed, speed, arm.engine);
            if (r.outcome === 'victory') wins += 1;
            if (r.outcome === undefined) unfinished += 1;
            minutes += r.ticks / 3000 / 60;
            const a = anatomy(r);
            taken += a.taken;
            chain += a.chain;
            const key = `${name}|${speed.name}|${armName}|${seed}`;
            const h = hashOf(r);
            hashes[key] = h;
            const was = base[key];
            if (was !== undefined && was !== h) moved += 1;
            const off = hashes[`${name}|${speed.name}|off|${seed}`];
            if (off !== undefined && off !== h) vsOff += 1;
          }
          seam.carry = false;
          const p = wins / SEEDS;
          rows.push(`| ${name} | ${speed.name} | ${armName} | ${wins}/${SEEDS} | ${(100 * p).toFixed(1)} % | ${(100 * (1 - (1 - p) ** 5)).toFixed(1)} % | ${(minutes / SEEDS).toFixed(2)} | ${Math.round(taken / SEEDS)} | ${(chain / SEEDS).toFixed(1)} | ${HASH_BASE ? `${moved}/${SEEDS}` : '-'} | ${vsOff}/${SEEDS} | ${unfinished} |`);
          expect(wins + unfinished).toBeLessThanOrEqual(SEEDS);
        }
      }
    }, 0);
  }
  afterAll(() => {
    if (HASH_OUT) writeFileSync(HASH_OUT, JSON.stringify(hashes));
    console.log([
      '',
      '| Chapter | Speed | Arm | Wins | First try | Within 5 (computed) | Avg min | Damage taken / run | Longest party chain / run | Logs moved vs base | Logs moved vs off | Unfinished |',
      '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
      ...rows,
    ].join('\n'));
  });
});
