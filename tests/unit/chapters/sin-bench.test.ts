/**
 * **Chapter XVIII, Sin: the Face — link 4 bench** (Overdrive Sin, FFX only). 200 seeds per
 * line, on the real engine, the real data and the chapter's party
 * (`sin-fahrenheit.ts`: Garden of Pain with Yuna's Tetra Ring back, S-29).
 *
 * **Measure, never tune** (the `boss-side-fix-needs-measured-options` rule):
 * this prints the numbers `docs/plans/sin-link4-bench.md` reports and pins only
 * that every battle ends in a victory or a defeat, and that the sensible line
 * does at least as well as the naive one. No target rate is pinned.
 *
 * The lines are `../helpers/sinPolicies.ts` (sensible = research §8 row 8;
 * naive = the credibly wrong line). S-1 is measured both ways: Giga-Graviton on
 * Sin's 13th turn (the default) and on the 12th (Gestahl's reading).
 *
 * Human pace equals bench speed: FFX is CTB and the clock moves only on turns.
 *
 * **The full 200 seeds are gated** (REVIEW 13): `PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-bench.test.ts`.
 * Without the variable a 6-seed smoke set runs in the suite. Package B added the **advisor card** as a third
 * line (the top row of the move advisor, as `critic/bench/advisor-v3/drive.ts` presses it).
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { BattleEngine, Command } from '../../../src/battle/common/types.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { liveAdvisorOptions } from '../../../critic/bench/advisor-v3/drive.ts';
import { type Input, drive, newEngine } from '../helpers/sinUnits.ts';
import { type Policy, type Reading, play, read } from '../helpers/sinPolicies.ts';

const FULL = process.env['PYREFLY_SIN_BENCH'] === '1';
const SEEDS = FULL ? 200 : 6;
type Line = Policy | 'advisor';

beforeAll(async () => {
  await registerBattleContent(); // the advisor reads the process-wide content, as the scorecard's driver does
});

/** One battle under a line; the advisor line presses the card's top row (falling back to Attack, then the first row, as `drive.ts` does). */
function playLine(engine: BattleEngine, line: Line): Reading {
  if (line !== 'advisor') return play(engine, line, drive);
  const options = liveAdvisorOptions('ffx');
  drive(engine, (d: Input): Command => {
    const top = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, options)?.suggestions[0]?.command;
    if (top) return top;
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
    return row ? ({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command) : { kind: 'defend', targets: [] };
  });
  return read(engine);
}

interface Tally {
  wins: number;
  outcomes: Record<string, number>;
  giga: number;
  turns: number;
  sinTurns: number;
  hpLeftOnLoss: number[];
  gazes: number;
  farDamage: number;
  overdrives: Array<{ who: string; id: string; damage: number }>;
  winTurns: number[];
}

function bench(policy: Line, lastTurn: number): Tally {
  const t: Tally = { wins: 0, outcomes: {}, giga: 0, turns: 0, sinTurns: 0, hpLeftOnLoss: [], gazes: 0, farDamage: 0, overdrives: [], winTurns: [] };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r: Reading = playLine(newEngine(seed, lastTurn), policy);
    t.outcomes[r.outcome] = (t.outcomes[r.outcome] ?? 0) + 1;
    if (r.outcome === 'victory') { t.wins++; t.winTurns.push(r.sinTurns); }
    else t.hpLeftOnLoss.push(r.sinHpLeft);
    if (r.gigaGraviton) t.giga++;
    t.turns += r.turns;
    t.sinTurns += r.sinTurns;
    t.gazes += r.gazes;
    t.farDamage += r.farDamage;
    t.overdrives.push(...r.overdrives);
  }
  return t;
}

const pct = (n: number) => `${n}/${SEEDS} (${Math.round((n * 1000) / SEEDS) / 10} %)`;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : 0; };

describe(`Chapter XVIII (sin-face) link 4 bench (${SEEDS} seeds${FULL ? '' : ', smoke: PYREFLY_SIN_BENCH=1 for the 200'}; measured, not tuned)`, () => {
  it('the three lines, S-1 both ways', () => {
    const rows = [
      '| Line | Giga-Graviton turn | Wins | Ended by Giga-Graviton | Mean turns (all actors) | Mean Sin turns | Sin HP left on a loss (mean / median) | Gazes per fight | FAR damage (3 pulls) | Overdrives per fight | Damage per Overdrive |',
      '|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|',
    ];
    const perOd: string[] = ['| Line | Turn | Who | Overdrive | Uses | Mean damage |', '|---|---:|---|---|---:|---:|'];
    const res: Record<string, Tally> = {};
    for (const policy of ['sensible', 'naive', 'advisor'] as Line[]) {
      for (const last of [13, 12]) {
        const t = bench(policy, last);
        res[`${policy}/${last}`] = t;
        const odDmg = t.overdrives.reduce((a, o) => a + o.damage, 0);
        rows.push(
          `| ${policy} | ${last} | ${pct(t.wins)} | ${pct(t.giga)} | ${(t.turns / SEEDS).toFixed(1)} | ${(t.sinTurns / SEEDS).toFixed(1)} | ` +
            `${Math.round(mean(t.hpLeftOnLoss)).toLocaleString('en-US')} / ${median(t.hpLeftOnLoss).toLocaleString('en-US')} | ${(t.gazes / SEEDS).toFixed(1)} | ` +
            `${Math.round(t.farDamage / SEEDS).toLocaleString('en-US')} | ${(t.overdrives.length / SEEDS).toFixed(2)} | ${t.overdrives.length ? Math.round(odDmg / t.overdrives.length).toLocaleString('en-US') : '-'} |`,
        );
        const byOd = new Map<string, number[]>();
        for (const o of t.overdrives) byOd.set(`${o.who}|${o.id}`, [...(byOd.get(`${o.who}|${o.id}`) ?? []), o.damage]);
        for (const [k, v] of [...byOd].sort()) {
          const [who, id] = k.split('|');
          perOd.push(`| ${policy} | ${last} | ${who} | ${id} | ${v.length} | ${Math.round(mean(v)).toLocaleString('en-US')} |`);
        }
        expect(Object.keys(t.outcomes).every((o) => o === 'victory' || o === 'defeat'), `${policy}/${last} ${JSON.stringify(t.outcomes)}`).toBe(true);
        if (t.winTurns.length) rows.push(`|  | wins end on Sin's turn (mean) | ${mean(t.winTurns).toFixed(1)} | | | | | | | | |`);
      }
    }
    if (FULL) console.log(['', ...rows, '', ...perOd, ''].join('\n'));
    // The link-4 pin (sensible at least as good as naive) reads only at 200 seeds; the smoke set pins that every battle ends.
    if (FULL) expect(res['sensible/13']!.wins).toBeGreaterThanOrEqual(res['naive/13']!.wins);
  }, 3_600_000);
});
