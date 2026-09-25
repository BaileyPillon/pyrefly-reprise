/**
 * **An enemy hit closes an open menu (decision sheet 2026-09-25 item 4, A1): the five-chapter
 * bench.** Measurement only, skipped unless `PYREFLY_MEASURE=1`. **FFX-2 only** (AGENTS.md rule 14).
 *
 * `docs/plans/ffx2-hit-closes-menu-review.md` §7: Chapters IV, V, VI, XI and XIII on their
 * intended lines, at bench speed (D = 0, the default Wait split), under the human Wait-split model
 * the Chapter XIII benches use (1.5 s a menu: 0.5 s on the top-level list, the clock running,
 * 1.0 s held) and an Active 1.5 s control. Decision times are **authored measurement inputs, not
 * game data**. Nothing here tunes a boss (hard rule 6). Run once before the engine change and
 * once after; the table goes into the preflight.
 *
 * ```
 * PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-hit-closes-menu-bench.test.ts --testTimeout=60000
 * ```
 * `HIT_BENCH_ONLY=iv,v` limits the chapters (ids: iv, v, vi, xi, xiii).
 */

import { createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2_TREMA } from '../../src/data/chapter-ffx2-trema.ts';
import { driveChapter4, driveChapter5, driveChapter6, logHash } from './helpers/ffx2ChapterDrive.ts';
import { driveChain, LINES as FA_LINES } from './helpers/fallenAeonsDrive.ts';
import { driveChapter as driveTrema, LINES as TR_LINES, type DriveOptions as TremaOptions } from './helpers/tremaDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const ONLY = (process.env['HIT_BENCH_ONLY'] ?? 'iv,v,vi,xi,xiii').split(',');

type ArmId = 'bench' | 'split' | 'active';
const ARM_LABEL: Record<ArmId, string> = {
  bench: 'bench, D = 0 (Wait split default)',
  split: 'human, Wait split 0.5 s top / 1.0 s held',
  active: 'control, Active 1.5 s',
};

interface Run { outcome: string | undefined; seconds: number; hash: string }
interface Tally { wins: number; seeds: number; unfinished: number; seconds: number; closed: number; hashes: string[] }

/** Every `inputValid` that answered false: a menu the running clock closed (KO, Stop, a hit...). */
let closed = 0;
const realInputValid = FFX2Engine.prototype.inputValid;
FFX2Engine.prototype.inputValid = function (this: FFX2Engine, id) {
  const ok = realInputValid.call(this, id);
  if (!ok) closed += 1;
  return ok;
};
afterAll(() => {
  FFX2Engine.prototype.inputValid = realInputValid;
});

const ch456 = (drive: typeof driveChapter4) => (arm: ArmId, seed: number): Run => {
  const r =
    arm === 'bench' ? drive(seed, 0, { atbMode: 'wait', waitSplit: true })
    : arm === 'split' ? drive(seed, 1500, { atbMode: 'wait', waitSplit: true }, undefined, 500)
    : drive(seed, 1500, { atbMode: 'active' });
  return { outcome: r.outcome, seconds: r.ticks / 3000, hash: logHash(r) };
};

const ch11 = (arm: ArmId, seed: number): Run => {
  const lines = [FA_LINES.shivaIntended, FA_LINES.sistersDarknessDispel, FA_LINES.animaIntended] as const;
  const r =
    arm === 'bench' ? driveChain(lines, seed, { engine: { atbMode: 'wait', waitSplit: true } })
    : arm === 'split' ? driveChain(lines, seed, { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } })
    : driveChain(lines, seed, { decisionMs: 1500, engine: { atbMode: 'active' } });
  const seconds = r.links.reduce((a, l) => a + l.ticks, 0) / 3000;
  return { outcome: r.outcome, seconds, hash: `${r.outcome}:${r.links.map((l) => l.ticks).join(',')}` };
};

const SHIPPED: TremaOptions = { build: FFX2_TREMA.buildRef as FFX2PartyBuild, paragonGroup: FFX2_TREMA.enemyGroupRef.id };
const ch13 = (arm: ArmId, seed: number): Run => {
  const opts: TremaOptions =
    arm === 'bench' ? { ...SHIPPED, engine: { atbMode: 'wait', waitSplit: true } }
    : arm === 'split' ? { ...SHIPPED, decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }
    : { ...SHIPPED, decisionMs: 1500, engine: { atbMode: 'active' } };
  const r = driveTrema(TR_LINES.kitIntended, seed, opts);
  const h = createHash('sha256');
  for (const l of r.links) h.update(JSON.stringify(l.log));
  return { outcome: r.outcome, seconds: r.links.reduce((a, l) => a + l.ticks, 0) / 3000, hash: h.digest('hex').slice(0, 16) };
};

const CHAPTERS: Array<{ id: string; name: string; run: (arm: ArmId, seed: number) => Run; seeds: Record<ArmId, number> }> = [
  { id: 'iv', name: 'IV Bahamut', run: ch456(driveChapter4), seeds: { bench: 40, split: 40, active: 40 } },
  { id: 'v', name: 'V Vegnagun', run: ch456(driveChapter5), seeds: { bench: 40, split: 40, active: 40 } },
  { id: 'vi', name: 'VI Leblanc', run: ch456(driveChapter6), seeds: { bench: 40, split: 40, active: 40 } },
  { id: 'xi', name: 'XI Fallen Aeons', run: ch11, seeds: { bench: 40, split: 40, active: 40 } },
  { id: 'xiii', name: 'XIII Trema', run: ch13, seeds: { bench: 200, split: 200, active: 40 } },
];

const rows: string[] = [];

function bench(run: (arm: ArmId, seed: number) => Run, arm: ArmId, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, seconds: 0, closed: 0, hashes: [] };
  const before = closed;
  for (let seed = 1; seed <= seeds; seed++) {
    const r = run(arm, seed);
    if (r.outcome === 'victory') t.wins += 1;
    if (r.outcome === undefined) t.unfinished += 1;
    t.seconds += r.seconds;
    t.hashes.push(r.hash);
  }
  t.closed = closed - before;
  return t;
}

describe.skipIf(!MEASURE)('item 4 A1 bench: Chapters IV, V, VI, XI, XIII (PYREFLY_MEASURE=1)', () => {
  for (const ch of CHAPTERS.filter((c) => ONLY.includes(c.id))) {
    it(ch.name, () => {
      for (const arm of ['bench', 'split', 'active'] as const) {
        const t = bench(ch.run, arm, ch.seeds[arm]);
        const all = createHash('sha256').update(t.hashes.join('|')).digest('hex').slice(0, 12);
        rows.push(
          `| ${ch.name} | ${ARM_LABEL[arm]} | ${t.wins}/${t.seeds} | ${(t.seconds / t.seeds / 60).toFixed(2)} | ${t.closed} | ${t.unfinished} | ${all} |`,
        );
        expect(t.seeds).toBeGreaterThan(0);
      }
    }, 3_600_000);
  }
  afterAll(() => {
    console.log(['', '| Chapter | Arm | Wins | Avg min | Menus closed | Unfinished | Log hash |', '|---|---|---:|---:|---:|---:|---|', ...rows].join('\n'));
  });
});
