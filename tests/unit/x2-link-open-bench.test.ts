/**
 * **X2-L / XL1: how Chapter VI's Acts II and III open (PR-0107), measured on today's engine.** Measurement only, skipped unless
 * `PYREFLY_MEASURE=1`. **FFX-2 only** (AGENTS.md rule 14): the flag, the Chateau chain and the game's start-up are FFX-2's.
 *
 * The question (docs/handoff/re-parity-rc9-x2-link-open.md; Bailey's D-242 kept PR-0107 OFF because it moved Chapter VI 16.5 points at
 * human pace, 157 -> 124 of 200, outside the batch's 5-point band): the game starts every `btlExe` as a full battle (random opening waits,
 * then the trim, no preemptive or ambush roll: FFX2-G10 sections 4 to 6), so should a chained link flagged `opensAsSeparateBattle` open
 * like one? This re-measures it after re-parity W4 (the logic-step clock and the game's gauges) and the RNG lane (the game's streams),
 * which rebuilt the opening the D-242 numbers were taken on.
 *
 * Arms, every one setting `separateBattleGauges` itself so the run does not depend on the constant's value:
 * - `off`:  the continuation opening in both links (every wait whole, no trim), the shipped state before this lane.
 * - `on`:   Acts II and III open as fresh battles.
 * - `act2`: ON for Act II only (Act III's flag is taken off for the run, put back after).
 * - `act3`: ON for Act III only.
 *
 * Speeds, as `iter2-b1` defines them: human (the live Wait split, 1.5 s a menu and 0.5 s of it on the top list), Active (1.5 s a menu, the
 * clock running), bench (zero decision time). Each run is Acts I to III in the shipped order with the shipped line. "Within 5" is
 * `1 - (1 - p) ** 5`, independent retries, as iter2-b1 computed it. Minutes are logic steps over `STEPS_PER_SECOND`
 * (iter2-b1's `ticks / 3000` is the pre-W4 clock and would read this engine's steps as 1/100 of a second).
 *
 * `X2L_SEEDS` (default 500), `X2L_ARMS`, `X2L_SPEEDS` (comma lists) narrow a run; `X2L_OUT=<file>` writes the numbers-only JSON; `X2L_FILL_OUT=<file>`
 * writes the first-bar-to-fill numbers (how long a link waits before anyone can act).
 *
 * ```
 * PYREFLY_MEASURE=1 X2L_OUT=<file> node vitest.mjs run tests/unit/x2-link-open-bench.test.ts --testTimeout=0
 * ```
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BattleSetup } from '../../src/battle/common/types.ts';
import { makeFfx2Rng } from '../../src/battle/ffx2/adapt/streams.ts';
import type { Ffx2EngineOptions } from '../../src/battle/ffx2/internal.ts';
import { STEPS_PER_SECOND, baseSpeedOf } from '../../src/battle/ffx2/clock.ts';
import { buildState } from '../../src/battle/ffx2/setup.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_II, LEBLANC_ACT_III } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { driveChapter6 } from './helpers/ffx2ChapterDrive.ts';
import { SPEEDS, driveLeblanc, type LeblancRun, type Speed } from './helpers/x2LinkOpenDrive.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['X2L_SEEDS'] ?? 500);
const OUT = process.env['X2L_OUT'];
const FILL_OUT = process.env['X2L_FILL_OUT'];

interface Arm { engine: Partial<Ffx2EngineOptions>; stripped: readonly string[] }
const ARM_LIST: Record<string, Arm> = {
  off: { engine: { separateBattleGauges: false }, stripped: [] },
  on: { engine: { separateBattleGauges: true }, stripped: [] },
  act2: { engine: { separateBattleGauges: true }, stripped: [LEBLANC_ACT_III] },
  act3: { engine: { separateBattleGauges: true }, stripped: [LEBLANC_ACT_II] },
};
const ARM_KEYS = (process.env['X2L_ARMS'] ?? 'off,on,act2,act3').split(',');
const SPEED_KEYS = (process.env['X2L_SPEEDS'] ?? 'human,active,bench').split(',');

/** Run `fn` with the flag taken off the named groups, and put it back after (a measurement of one act alone). */
function withFlagOff<T>(ids: readonly string[], fn: () => T): T {
  const saved: Array<[{ opensAsSeparateBattle?: boolean }, boolean | undefined]> = [];
  for (const id of ids) {
    const group = data.ENEMY_GROUPS_BY_ID[id];
    if (!group) throw new Error(`no formation "${id}"`);
    saved.push([group, group.opensAsSeparateBattle]);
    delete group.opensAsSeparateBattle;
  }
  try {
    return fn();
  } finally {
    for (const [group, was] of saved) {
      if (was === undefined) delete group.opensAsSeparateBattle;
      else group.opensAsSeparateBattle = was;
    }
  }
}

const hashOf = (r: { logs: readonly (readonly unknown[])[] }): string => {
  const h = createHash('sha256');
  for (const log of r.logs) h.update(JSON.stringify(log));
  return h.digest('hex').slice(0, 16);
};

/** What one link of one arm and speed counts up to. */
interface LinkTally {
  reached: number;
  won: number;
  /** First `turn-start` of the link: a girl / the Syndicate. */
  partyFirstTurn: number;
  enemyFirstTurn: number;
  /** First `action-start` of the link. */
  partyFirstAct: number;
  enemyFirstAct: number;
  /** The smallest wait on the field at the opening: a girl / the Syndicate. */
  partyFills: number;
  enemyFills: number;
  /** Links won when a girl / the Syndicate took the first turn. */
  wonPartyFirstTurn: number;
  wonEnemyFirstTurn: number;
  /** Links won when a girl / the Syndicate held the smallest wait at the opening. */
  wonPartyFills: number;
  wonEnemyFills: number;
  /** The joint of "held the smallest wait" and "took the first turn": [fills][acts], girl = 0 and Syndicate = 1. */
  fillsActs: [[number, number], [number, number]];
  /** Girls' HP lost, and logic steps, in links where a girl / the Syndicate took the first turn. */
  damagePartyFirstTurn: number;
  damageEnemyFirstTurn: number;
  stepsPartyFirstTurn: number;
  stepsEnemyFirstTurn: number;
  /** Girls' HP lost in the link, summed; girls knocked out, summed; logic steps, summed. */
  damage: number;
  kos: number;
  steps: number;
}
const newLink = (): LinkTally => ({
  reached: 0, won: 0, partyFirstTurn: 0, enemyFirstTurn: 0, partyFirstAct: 0, enemyFirstAct: 0, partyFills: 0, enemyFills: 0,
  wonPartyFirstTurn: 0, wonEnemyFirstTurn: 0, wonPartyFills: 0, wonEnemyFills: 0, fillsActs: [[0, 0], [0, 0]],
  damagePartyFirstTurn: 0, damageEnemyFirstTurn: 0, stepsPartyFirstTurn: 0, stepsEnemyFirstTurn: 0, damage: 0, kos: 0, steps: 0,
});

interface Cell {
  seeds: number;
  wins: number;
  /** Seeds that won, in seed order (1 = won), for the paired comparison with `off`. */
  results: number[];
  steps: number;
  damage: number;
  links: LinkTally[];
}

function runCell(arm: Arm, speed: Speed): Cell {
  const cell: Cell = { seeds: SEEDS, wins: 0, results: [], steps: 0, damage: 0, links: [newLink(), newLink(), newLink()] };
  withFlagOff(arm.stripped, () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const run: LeblancRun = driveLeblanc(seed, speed, arm.engine);
      const won = run.outcome === 'victory';
      cell.wins += won ? 1 : 0;
      cell.results.push(won ? 1 : 0);
      run.links.forEach((link, i) => {
        const t = cell.links[i]!;
        const linkWon = link.outcome === 'victory';
        t.reached += 1;
        t.won += linkWon ? 1 : 0;
        if (link.firstTurn === 'party') { t.partyFirstTurn += 1; t.wonPartyFirstTurn += linkWon ? 1 : 0; t.damagePartyFirstTurn += link.damageTaken; t.stepsPartyFirstTurn += link.ticks; }
        if (link.firstTurn === 'enemy') { t.enemyFirstTurn += 1; t.wonEnemyFirstTurn += linkWon ? 1 : 0; t.damageEnemyFirstTurn += link.damageTaken; t.stepsEnemyFirstTurn += link.ticks; }
        if (link.firstTurn !== null) t.fillsActs[link.fillsFirst === 'party' ? 0 : 1]![link.firstTurn === 'party' ? 0 : 1]! += 1;
        if (link.fillsFirst === 'party') t.wonPartyFills += linkWon ? 1 : 0;
        else t.wonEnemyFills += linkWon ? 1 : 0;
        if (link.firstAct === 'party') t.partyFirstAct += 1;
        if (link.firstAct === 'enemy') t.enemyFirstAct += 1;
        if (link.fillsFirst === 'party') t.partyFills += 1;
        else t.enemyFills += 1;
        t.damage += link.damageTaken;
        t.kos += link.kos;
        t.steps += link.ticks;
        cell.steps += link.ticks;
        cell.damage += link.damageTaken;
      });
    }
  });
  return cell;
}

const pct = (x: number, digits = 1): string => (100 * x).toFixed(digits);
const within5 = (p: number): number => 1 - (1 - p) ** 5;
const round = (x: number, d: number): number => Math.round(x * 10 ** d) / 10 ** d;

/** The numbers-only record of one cell. */
function record(cell: Cell, off: Cell | undefined): Record<string, unknown> {
  const p = cell.wins / cell.seeds;
  const link = (t: LinkTally): Record<string, number> => ({
    reached: t.reached, won: t.won,
    partyFirstTurn: t.partyFirstTurn, enemyFirstTurn: t.enemyFirstTurn,
    partyFirstAct: t.partyFirstAct, enemyFirstAct: t.enemyFirstAct,
    partyFills: t.partyFills, enemyFills: t.enemyFills,
    wonPartyFirstTurn: t.wonPartyFirstTurn, wonEnemyFirstTurn: t.wonEnemyFirstTurn,
    wonPartyFills: t.wonPartyFills, wonEnemyFills: t.wonEnemyFills,
    fillsGirlActsGirl: t.fillsActs[0]![0]!, fillsGirlActsEnemy: t.fillsActs[0]![1]!, fillsEnemyActsGirl: t.fillsActs[1]![0]!, fillsEnemyActsEnemy: t.fillsActs[1]![1]!,
    damagePartyFirstTurn: t.damagePartyFirstTurn, damageEnemyFirstTurn: t.damageEnemyFirstTurn, stepsPartyFirstTurn: t.stepsPartyFirstTurn, stepsEnemyFirstTurn: t.stepsEnemyFirstTurn,
    meanSteps: round(t.steps / Math.max(1, t.reached), 1), meanDamage: round(t.damage / Math.max(1, t.reached), 0), kos: t.kos,
  });
  let winToLoss = 0;
  let lossToWin = 0;
  if (off) cell.results.forEach((r, i) => { if (off.results[i] === 1 && r === 0) winToLoss += 1; if (off.results[i] === 0 && r === 1) lossToWin += 1; });
  return {
    seeds: cell.seeds,
    wins: cell.wins,
    firstTry: round(p, 4),
    within5: round(within5(p), 4),
    standardError: round(Math.sqrt((p * (1 - p)) / cell.seeds), 4),
    meanMinutes: round(cell.steps / STEPS_PER_SECOND / 60 / cell.seeds, 2),
    meanDamageTaken: round(cell.damage / cell.seeds, 0),
    pairedWinToLoss: winToLoss,
    pairedLossToWin: lossToWin,
    act1: link(cell.links[0]!),
    act2: link(cell.links[1]!),
    act3: link(cell.links[2]!),
  };
}

describe.skipIf(!MEASURE)('X2-L XL1: Chapter VI link opening, OFF vs ON vs one act at a time (PYREFLY_MEASURE=1)', () => {
  it('the local driver is the shipped chain loop: seeds 1 to 3 give the same event logs as driveChapter6, at every speed', () => {
    for (const speed of SPEEDS) {
      for (let seed = 1; seed <= 3; seed++) {
        const theirs = driveChapter6(seed, speed.decisionMs, { ...speed.engine, separateBattleGauges: false }, undefined, speed.topMs);
        const ours = driveLeblanc(seed, speed, { separateBattleGauges: false });
        expect(hashOf(ours), `${speed.key} seed ${seed}`).toBe(hashOf(theirs));
        expect(ours.outcome).toBe(theirs.outcome);
      }
    }
  }, 0);

  it('the four arms at the three speeds', () => {
    const out: Record<string, Record<string, unknown>> = {};
    const lines: string[] = [];
    for (const speedKey of SPEED_KEYS) {
      const speed = SPEEDS.find((s) => s.key === speedKey);
      if (!speed) throw new Error(`no speed ${speedKey}`);
      const cells: Record<string, Cell> = {};
      for (const armKey of ARM_KEYS) {
        const arm = ARM_LIST[armKey];
        if (!arm) throw new Error(`no arm ${armKey}`);
        cells[armKey] = runCell(arm, speed);
        const c = cells[armKey]!;
        const p = c.wins / c.seeds;
        const a2 = c.links[1]!;
        const a3 = c.links[2]!;
        lines.push(
          `| ${speed.key} | ${armKey} | ${c.wins}/${c.seeds} | ${pct(p)} % | ${pct(within5(p), 2)} % | ${round(c.steps / STEPS_PER_SECOND / 60 / c.seeds, 2)} | ${round(c.damage / c.seeds, 0)} | ` +
            `${pct(a2.partyFirstTurn / Math.max(1, a2.reached), 0)} / ${pct(a2.enemyFirstTurn / Math.max(1, a2.reached), 0)} | ${pct(a3.partyFirstTurn / Math.max(1, a3.reached), 0)} / ${pct(a3.enemyFirstTurn / Math.max(1, a3.reached), 0)} |`,
        );
        expect(c.wins).toBeLessThanOrEqual(c.seeds);
      }
      out[speed.key] = Object.fromEntries(Object.entries(cells).map(([k, c]) => [k, record(c, cells['off'])]));
    }
    console.log(
      [
        '',
        `Chapter VI, ${SEEDS} seeds a row. Opening shares are the first turn of the link: a girl / the Syndicate.`,
        '| Speed | Arm | Wins | First try | Within 5 | Mean min | Damage taken / run | Act II girl / Syndicate | Act III girl / Syndicate |',
        '|---|---|---:|---:|---:|---:|---:|---|---|',
        ...lines,
      ].join('\n'),
    );
    if (OUT) {
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, `${JSON.stringify({ seeds: SEEDS, stepsPerSecond: round(STEPS_PER_SECOND, 4), cells: out }, null, 1)}\n`);
    }
  }, 0);

  it('the first bar to fill: how long a link waits before anyone can act, switch off against on (seconds, Normal ATB speed)', () => {
    const out: Record<string, Record<string, Record<string, number>>> = {};
    const lines: string[] = [];
    const toSeconds = (units: number): number => units / baseSpeedOf('normal') / STEPS_PER_SECOND;
    const mean = (a: number[]): number => a.reduce((x, y) => x + y, 0) / a.length;
    for (const [key, act] of [['act2', LEBLANC_ACT_II], ['act3', LEBLANC_ACT_III]] as const) {
      out[key] = {};
      for (const [armKey, separate] of [['off', false], ['on', true]] as const) {
        const first: number[] = [];
        const girls: number[] = [];
        const syndicate: number[] = [];
        for (let seed = 1; seed <= SEEDS; seed++) {
          const setup: BattleSetup = { game: 'ffx2', party: chateauBuild, enemies: data.ENEMY_GROUPS_BY_ID[act]!, triggers: [], seed, condition: 'scripted', canEscape: false };
          const units = buildState(setup, { atbMode: 'wait', separateBattleGauges: separate }, makeFfx2Rng(seed)).units;
          const g = Math.min(...units.filter((u) => u.side === 'party').map((u) => u.atb.recovery));
          const e = Math.min(...units.filter((u) => u.side === 'enemy').map((u) => u.atb.recovery));
          girls.push(toSeconds(g));
          syndicate.push(toSeconds(e));
          first.push(toSeconds(Math.min(g, e)));
        }
        out[key]![armKey] = {
          seeds: SEEDS, firstMean: round(mean(first), 2), firstMax: round(Math.max(...first), 2),
          girlsMean: round(mean(girls), 2), girlsMax: round(Math.max(...girls), 2), syndicateMean: round(mean(syndicate), 2), syndicateMax: round(Math.max(...syndicate), 2),
        };
        lines.push(`| ${key} | ${armKey} | ${round(mean(first), 2)} | ${round(Math.max(...first), 2)} | ${round(mean(girls), 2)} | ${round(mean(syndicate), 2)} |`);
        expect(Math.max(...first)).toBeGreaterThan(0);
      }
    }
    console.log(['', '| Act | Switch | First bar to fill, mean (s) | max (s) | A girl\'s first, mean (s) | The Syndicate\'s first, mean (s) |', '|---|---|---:|---:|---:|---:|', ...lines].join('\n'));
    if (FILL_OUT) {
      mkdirSync(dirname(FILL_OUT), { recursive: true });
      writeFileSync(FILL_OUT, `${JSON.stringify({ seeds: SEEDS, firstFill: out }, null, 1)}\n`);
    }
  }, 0);
});
