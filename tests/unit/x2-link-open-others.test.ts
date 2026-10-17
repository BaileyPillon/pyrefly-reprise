/**
 * **X2-L / XL1: with Chapter VI's link opening switched on, no other FFX-2 chapter moves.** Measurement only, skipped unless
 * `PYREFLY_MEASURE=1`. **FFX-2 only** (AGENTS.md rule 14).
 *
 * Only `leblancLogosRoomGroup` and `leblancLastRoomGroup` carry `EnemyGroupDef.opensAsSeparateBattle` (pinned by
 * `iter2-b1-rules.test.ts`, "only the two Chateau links carry the flag"). The Vegnagun links (Chapter V) are NOT flagged: whether the
 * events keep a chained link inside one battle is unread (FFX2-G10 open question 3). This runs 12 seeds of every FFX-2 chapter record
 * on this tip twice, `separateBattleGauges` false and true, at the three paces, and counts the seeds whose whole event log differs.
 * IV, V, XI, XIII and XV use the chapters' shipped lines of `iter2-b1-bench.test.ts`; XVI and the hidden FFX-2 chapters go through their
 * own record's chain with the shipped strategy (`driveChapterRecord`). Chapter VI, and the Leblanc preview derived from it (`exp-leblanc`
 * is Chapter VI's record by reference), are the two that MUST move.
 *
 * `X2L_OTHER_SEEDS` (default 12), `X2L_OTHERS_OUT=<file>` for the numbers-only JSON.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BattleEvent, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { FFX2_TREMA } from '../../src/data/chapter-ffx2-trema.ts';
import { FFX2_DEN_OF_WOE_SHIPPED } from '../../src/data/chapter-den-of-woe-ship.ts';
import { DEN_OF_WOE_HERO_DRINKS } from '../../src/data/ffx2/builds/den-of-woe.ts';
import { DEN_OF_WOE_LIGHTFALL_PREP } from '../../src/data/guides/ffx2-den-of-woe.ts';
import { driveChapter4, driveChapter5, driveChapter6, driveChapterRecord } from './helpers/ffx2ChapterDrive.ts';
import { driveChain as driveRoad, LINES as ROAD } from './helpers/fallenAeonsDrive.ts';
import { driveChapter as driveTrema, LINES as TREMA } from './helpers/tremaDrive.ts';
import { driveDen, LINES as DEN } from './helpers/denOfWoeDrive.ts';
import { SPEEDS, type Speed } from './helpers/x2LinkOpenDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['X2L_OTHER_SEEDS'] ?? 12);
const OUT = process.env['X2L_OTHERS_OUT'];

interface Run { outcome: string | undefined; logs: readonly (readonly BattleEvent[])[] }
type Drive = (seed: number, s: Speed, extra: Partial<Ffx2EngineOptions>) => Run;

const top = (s: Speed): { topMs?: number } => (s.topMs !== undefined ? { topMs: s.topMs } : {});
const flat = (r: { outcome: string | undefined; links: Array<{ log: readonly BattleEvent[] }> }): Run => ({ outcome: r.outcome, logs: r.links.map((l) => l.log) });
const TREMA_SHIPPED = { build: FFX2_TREMA.buildRef as FFX2PartyBuild, paragonGroup: FFX2_TREMA.enemyGroupRef.id };
const DEN_KIT = FFX2_DEN_OF_WOE_SHIPPED.buildRef as FFX2PartyBuild;
const DEN_LINE = { ...(DEN_OF_WOE_LIGHTFALL_PREP ? DEN.intended : DEN.noPrep), heroDrink: DEN_OF_WOE_HERO_DRINKS > 0 };

/** Any FFX-2 chapter record by id, driven through its own chain with the shipped strategy. */
function byRecord(id: string): Drive {
  const chapter = getChapter(id);
  if (!chapter) throw new Error(`no chapter ${id}`);
  return (seed, s, x) => driveChapterRecord(chapter, seed, s.decisionMs, { ...s.engine, ...x });
}

const CHAPTERS: Array<{ id: string; name: string; moves: boolean; drive: Drive }> = [
  { id: 'ffx2-bahamut', name: 'IV Bahamut', moves: false, drive: (seed, s, x) => driveChapter4(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs) },
  { id: 'ffx2-vegnagun-shuyin', name: 'V Vegnagun', moves: false, drive: (seed, s, x) => driveChapter5(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs) },
  { id: 'ffx2-leblanc', name: 'VI Leblanc', moves: true, drive: (seed, s, x) => driveChapter6(seed, s.decisionMs, { ...s.engine, ...x }, undefined, s.topMs) },
  { id: 'ffx2-fallen-aeons', name: 'XI Fallen Aeons', moves: false, drive: (seed, s, x) => flat(driveRoad([ROAD.shivaIntended, ROAD.sistersDarknessDispel, ROAD.animaIntended], seed, { decisionMs: s.decisionMs, ...top(s), engine: { ...s.engine, ...x } })) },
  { id: 'ffx2-trema', name: 'XIII Trema', moves: false, drive: (seed, s, x) => flat(driveTrema(TREMA.kitIntended, seed, { ...TREMA_SHIPPED, decisionMs: s.decisionMs, ...top(s), engine: { ...s.engine, ...x } })) },
  {
    id: 'ffx2-den-of-woe',
    name: 'XV Den of Woe',
    moves: false,
    drive: (seed, s, x) => {
      const logs: BattleEvent[][] = [];
      const r = driveDen(DEN_LINE, seed, { party: DEN_KIT, decisionMs: s.decisionMs, ...top(s), engine: { atbMode: 'wait', ...s.engine, ...x }, inspect: (engine) => { logs.push([...engine.state().log]); } });
      return { outcome: r.outcome, logs };
    },
  },
  { id: 'ffx2-ixion-djose', name: 'XVI Ixion at Djose', moves: false, drive: byRecord('ffx2-ixion-djose') },
  { id: 'exp-leblanc', name: 'hidden: Leblanc preview (Chapter VI by reference)', moves: true, drive: byRecord('exp-leblanc') },
  { id: 'ffx2-masterpiece-theatre', name: 'hidden: the Experiment', moves: false, drive: byRecord('ffx2-masterpiece-theatre') },
  { id: 'ffx2-tourist-trap', name: 'hidden: Tourist Trap', moves: false, drive: byRecord('ffx2-tourist-trap') },
  { id: 'ffx2-valefor-besaid', name: 'hidden: Valefor at Besaid', moves: false, drive: byRecord('ffx2-valefor-besaid') },
  { id: 'ffx2-angra-mainyu', name: 'hidden: Angra Mainyu', moves: false, drive: byRecord('ffx2-angra-mainyu') },
];

function hashOf(r: Run): string {
  const h = createHash('sha256');
  for (const log of r.logs) h.update(JSON.stringify(log));
  return h.digest('hex').slice(0, 16);
}

describe.skipIf(!MEASURE)('X2-L XL1: the switch ON moves Chapter VI and nothing else (PYREFLY_MEASURE=1)', () => {
  const rows: string[] = [];
  const out: Record<string, Record<string, Record<string, number>>> = {};
  for (const chapter of CHAPTERS) {
    it(chapter.name, () => {
      out[chapter.id] = {};
      for (const speed of SPEEDS) {
        let moved = 0;
        let winsOff = 0;
        let winsOn = 0;
        let steps = 0;
        for (let seed = 1; seed <= SEEDS; seed++) {
          const off = chapter.drive(seed, speed, { separateBattleGauges: false });
          const on = chapter.drive(seed, speed, { separateBattleGauges: true });
          if (hashOf(off) !== hashOf(on)) moved += 1;
          winsOff += off.outcome === 'victory' ? 1 : 0;
          winsOn += on.outcome === 'victory' ? 1 : 0;
          steps += off.logs.reduce((n, l) => n + l.length, 0);
        }
        out[chapter.id]![speed.key] = { seeds: SEEDS, moved, winsOff, winsOn, eventsOff: steps };
        rows.push(`| ${chapter.name} | ${speed.key} | ${winsOff}/${SEEDS} | ${winsOn}/${SEEDS} | ${moved}/${SEEDS} |`);
        if (chapter.moves) expect(moved, `${chapter.name} ${speed.key} must move`).toBeGreaterThan(0);
        else expect(moved, `${chapter.name} ${speed.key} must not move`).toBe(0);
      }
    }, 0);
  }
  it('prints the table', () => {
    console.log(['', `${SEEDS} seeds a row, separateBattleGauges false vs true; "moved" = seeds whose whole event log differs.`, '| Chapter | Pace | Wins off | Wins on | Logs moved |', '|---|---|---:|---:|---:|', ...rows].join('\n'));
    if (OUT) {
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, `${JSON.stringify({ seeds: SEEDS, chapters: out }, null, 1)}\n`);
    }
  });
});
