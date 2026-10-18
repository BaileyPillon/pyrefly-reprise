/**
 * **RE-parity balance measurement, FFX-2: action time per command** (lane X2-A, row XA6 slice A; the tables of `docs/handoff/re-parity-rc10-x2-action-time.md`).
 *
 * The SHIPPED `intendedStrategy` plays each chapter's whole chain through the app's own path on a range of seeds (`helpers/ffx2ChainPlay.ts`) at one of three paces
 * (`bench` zero decision time, `human` the Wait split, `active` Active ATB), and at one arm of the switch (`kernel` knobs of `action-span.ts`):
 *
 * - `base`: the switch OFF (production; the engine of the base commit, byte for byte);
 * - `on`: `ACTION_TIME_PER_COMMAND` ON, a formation's flat 3 s superseded (the design: the per-command span everywhere);
 * - `on-keep`: ON, but a formation that sets a flat 3 s keeps it (what the formation overrides cost);
 * - `phys`: ON, physical spans only (casts, skills, items and specials owe nothing);
 * - `cast`: ON, charge-kind spans only (physical commands owe nothing);
 * - `on-norun` / `on-far`: ON, with the run-up distance taken to 0 / doubled (how much the least known term matters);
 * - `on-hit`: ON, a monster's hit at the macro's normal-attack-frames estimate when later than its clip; `on-fx80` / `on-fx125`: ON, every effect length x0.8 / x1.25.
 *
 * **Measure, never tune.** Besides wins it counts what explains a move: the actions each side finished, the mean span the per-command rule gave a side's actions, the party's
 * KOs, the party's turns and the minutes the chain took. Rows carry `perSeed` (one letter a seed) so runs split across processes merge exactly.
 *
 * Runs only with `PYREFLY_X2AT_MEASURE=1`. `PYREFLY_X2AT_ARM`, `PYREFLY_X2AT_PACE`, `PYREFLY_X2AT_SEEDS` (`<n>` or `<a>-<b>`), `PYREFLY_X2AT_CHAPTERS` (comma list; default all twelve),
 * `PYREFLY_X2AT_OUT` (a JSON file for the rows).
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import { withActionSpanKnobsAsync, type ActionSpanKnobs } from '../../src/battle/ffx2/action-span.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { FFX2_CHAPTERS, playChain, type One, type Pace } from './helpers/ffx2ChainPlay.ts';

const MEASURE = process.env['PYREFLY_X2AT_MEASURE'] === '1';
const OUT = process.env['PYREFLY_X2AT_OUT'];
const ARM = process.env['PYREFLY_X2AT_ARM'] ?? 'base';
const PACE = (process.env['PYREFLY_X2AT_PACE'] ?? 'bench') as Pace;
const SEED_SPEC = process.env['PYREFLY_X2AT_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const CHAPTER_IDS = process.env['PYREFLY_X2AT_CHAPTERS']?.split(',') ?? FFX2_CHAPTERS;

const ARMS: Record<string, Partial<ActionSpanKnobs>> = {
  base: { perCommand: false },
  on: { perCommand: true },
  'on-keep': { perCommand: true, supersedeFormation: false },
  phys: { perCommand: true, casts: false },
  cast: { perCommand: true, physical: false },
  // the run-up is the least known term: none at all, and twice the estimated distance
  'on-norun': { perCommand: true, runDistanceScale: 0 },
  'on-far': { perCommand: true, runDistanceScale: 2 },
  // the other soft terms: a monster's hit at the macro's normal-attack-frames estimate when that is later than its clip; every effect 20 percent shorter / 25 percent longer
  'on-hit': { perCommand: true, monsterHit: 'estimate' },
  'on-fx80': { perCommand: true, effectScale: 0.8 },
  'on-fx125': { perCommand: true, effectScale: 1.25 },
};

/** Spans the per-command rule computed in one seed, by side. */
interface Spans {
  partySum: number;
  partyN: number;
  enemySum: number;
  enemyN: number;
}

describe.skipIf(!MEASURE)('RE parity, FFX-2: action time per command, wins by chapter, arm and pace (PYREFLY_X2AT_MEASURE=1)', () => {
  it('plays the chapters and writes the rows', async () => {
    await registerBattleContent();
    const base = ARMS[ARM];
    if (base === undefined) throw new Error(`no arm "${ARM}"`);
    const rows: Array<Record<string, unknown>> = [];
    for (const id of CHAPTER_IDS) {
      const chapter = getChapter(id);
      if (!chapter || chapter.game !== 'ffx2') {
        console.log(JSON.stringify({ chapter: id, skipped: 'not an FFX-2 chapter on this build' }));
        continue;
      }
      const runs: One[] = [];
      const spans: Spans = { partySum: 0, partyN: 0, enemySum: 0, enemyN: 0 };
      const record = (unit: { side: string }, steps: number): void => {
        if (unit.side === 'party') {
          spans.partySum += steps;
          spans.partyN += 1;
        } else {
          spans.enemySum += steps;
          spans.enemyN += 1;
        }
      };
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await withActionSpanKnobsAsync({ ...base, record }, () => playChain(chapter, seed, PACE)));
      const sum = (f: (r: One) => number): number => runs.reduce((a, r) => a + f(r), 0);
      rows.push({
        chapter: id,
        arm: ARM,
        pace: PACE,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        unresolved: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        sums: {
          partyTurns: sum((r) => r.partyTurns), engineTurns: sum((r) => r.engineTurns), minutes: Math.round((sum((r) => r.steps) / STEPS_PER_SECOND / 60) * 100) / 100,
          partyKos: sum((r) => r.partyKos), invalidated: sum((r) => r.invalidated), partyActions: sum((r) => r.partyActions), enemyActions: sum((r) => r.enemyActions),
          partySpanSteps: spans.partySum, partySpanN: spans.partyN, enemySpanSteps: spans.enemySum, enemySpanN: spans.enemyN,
        },
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
  }, 20_000_000);
});
