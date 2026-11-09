/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the hidden chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`);
 * a result goes to Bailey. The party is the Chapter 2 preset carried forward with the Samurai dressphere owned (Yuna 23, Rikku 24, Paine 25: `[estimate]`, `src/data/ffx2/builds/kilika.ts`). His moves run on the game's own rows
 * and his script is the game's own (`research/re-ffx2-ifrit-kilika.md`), so the charge and recovery of his moves are the rows' own.
 *
 * The model is the one the other aeon benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running, 1.0 s inside a
 * submenu, held); and the **Active** clock at 1.5 s a decision. Lines (\`../helpers/ifritKilikaDrive.ts\`): **advisor** (the shipped move advisor's tactic, the line the guide teaches) and **naive** (no Protect, no Shell, no
 * Breaks, no healing but Cura below 40 %). The per-command action time (\`ACTION_TIME_PER_COMMAND\`) is on in production; the "OFF" cells take the time away by the engine option \`actionTimeSeconds: 0\`. Two what-if
 * presets, measurement inputs and not shipped: **Paine wearing the Samurai dressphere** she owns (the guides' route to him; research U2) and the **Djose preset** (32 / 33 / 34, the end of Chapter 3). **Not measured:** an Ice
 * line (a Black Mage Yuna casting the free Blizzard): the advisor line has no plan for it, so a row for it would measure nothing; the engine test pins only that Ice hurts and Fire heals.
 *
 * \`PYREFLY_BENCH_SEEDS\` sets the seeds a cell at bench speed (100 by default, the suite's size); the human-speed cells and the what-ifs run half as many (at least 40). The handoff's table is the 200 / 100 run.
 * The table is printed and copied into the handoff \`docs/handoff/ch-ifrit-kilika.md\`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed, that the advisor line does better than the naive one, that the shipped line wins more often than not, and that **no fight comes near the
 * "battle too long" block** (his longest fight, in his own actions, stays far under 180): a regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { IFRIT_TOO_LONG_POLLS } from '../../../src/battle/ffx2/ai/ifrit.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { djoseKilika, driveIfrit, samuraiPaine, type IfritDriveOptions, type IfritLine, type IfritRun } from '../helpers/ifritKilikaDrive.ts';

const SEEDS = Math.max(100, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
/** The human-speed cells (Wait split, Active) and the what-ifs run fewer seeds: each fight there costs more. */
const HUMAN_SEEDS = Math.max(40, Math.floor(SEEDS / 2));
const PACES: ReadonlyArray<[string, IfritDriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];
/** The switch taken away: the engine option outranks the production span, and 0 is off. */
const off = (o: IfritDriveOptions): IfritDriveOptions => ({ ...o, engine: { ...o.engine, actionTimeSeconds: 0 } });

interface Tally {
  wins: number; seeds: number; unfinished: number; minutes: number; hisTurns: number; maxTurns: number; meteors: number; hellfires: number; firagas: number; onYuna: number; kos: number; silent: number;
}

function measure(line: IfritLine, opts: IfritDriveOptions, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, hisTurns: 0, maxTurns: 0, meteors: 0, hellfires: 0, firagas: 0, onYuna: 0, kos: 0, silent: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r: IfritRun = driveIfrit(line, seed, opts);
    t.minutes += r.ticks / STEPS_PER_SECOND / 60;
    t.hisTurns += r.order.length;
    t.maxTurns = Math.max(t.maxTurns, r.order.length);
    t.meteors += r.moves['x2-ifrit-meteor-strike'] ?? 0;
    t.hellfires += r.moves['x2-ifrit-hellfire'] ?? 0;
    t.firagas += r.moves['x2-ifrit-firaga'] ?? 0;
    t.onYuna += r.meteorVictims.filter((v) => v === 'yuna').length;
    t.kos += r.kos;
    if (r.outcome === 'victory') t.wins += 1;
    else if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const rows: string[] = [];
const row = (line: string, mode: string, t: Tally): void => {
  rows.push(`| ${line} | ${mode} | ${t.wins}/${t.seeds} | ${avg(t.minutes, t)} | ${avg(t.hisTurns, t)} | ${t.maxTurns} | ${avg(t.firagas, t)} | ${avg(t.meteors, t)} | ${avg(t.hellfires, t)} | ${t.meteors === 0 ? '-' : Math.round((100 * t.onYuna) / t.meteors)} | ${avg(t.kos, t)} | ${t.seeds - t.wins - t.unfinished} |`);
};

describe(`Ifrit at Kilika Temple: ${SEEDS} seeds at bench speed and ${HUMAN_SEEDS} at human speed, advisor and naive, three paces, action time on and off, and two what-if presets`, () => {
  const cells: Array<[IfritLine, string, IfritDriveOptions]> = [];
  for (const line of ['advisor', 'naive'] as IfritLine[]) {
    for (const [pace, opts] of PACES) {
      cells.push([line, `${pace}, action time on`, opts]);
      cells.push([line, `${pace}, action time OFF`, off(opts)]);
    }
  }
  // the what-ifs run at bench speed and at the live default (Wait split), the shipped action time
  const whatIfs: Array<[string, FFX2PartyBuild]> = [['Paine in Samurai', samuraiPaine()], ['Djose preset (32/33/34)', djoseKilika()]];
  const results = new Map<string, Tally>();

  it('measures every cell to the end of every seed', () => {
    for (const [line, mode, opts] of cells) {
      const t = measure(line, opts, mode.startsWith('bench') ? SEEDS : HUMAN_SEEDS);
      results.set(`${line} / ${mode}`, t);
      row(line, mode, t);
      expect(t.unfinished, `${line} / ${mode}: every fight reaches an outcome`).toBe(0);
    }
    for (const [name, build] of whatIfs) {
      for (const line of ['advisor', 'naive'] as IfritLine[]) {
        for (const [pace, opts] of PACES.slice(0, 2)) {
          const t = measure(line, { ...opts, build }, pace.startsWith('bench') ? SEEDS : HUMAN_SEEDS);
          results.set(`${line} / ${name} / ${pace}`, t);
          row(line, `${name}, ${pace}`, t);
          expect(t.unfinished, `${line} / ${name} / ${pace}: every fight reaches an outcome`).toBe(0);
        }
      }
    }
    console.log(
      `\n| line | mode | wins | minutes | his actions | longest (his actions) | Firaga | Meteor | Hellfire | Meteors on Yuna % | KOs | losses |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`,
    );
  }, 1_800_000);

  it('the advisor line does better than the naive one at every pace, with and without action time, and wins at bench speed more often than not', () => {
    for (const [pace] of PACES) {
      for (const setting of ['action time on', 'action time OFF']) {
        const a = results.get(`advisor / ${pace}, ${setting}`);
        const n = results.get(`naive / ${pace}, ${setting}`);
        if (a === undefined || n === undefined) throw new Error('the first test fills the table');
        expect(a.wins, `${pace}, ${setting}: advisor ${a.wins} against naive ${n.wins}`).toBeGreaterThanOrEqual(n.wins);
      }
    }
    expect(results.get('advisor / bench (0 ms), action time on')!.wins).toBeGreaterThan(SEEDS / 2);
    expect(results.get('advisor / Wait split 1.5 s, action time on')!.wins).toBeGreaterThan(HUMAN_SEEDS / 2);
  });

  it('no fight comes near the "battle too long" block: his longest fight, in his own actions, is under half of the 180 that starts it', () => {
    for (const [key, t] of results) expect(t.maxTurns, key).toBeLessThan(IFRIT_TOO_LONG_POLLS[0] / 2);
  });
});
