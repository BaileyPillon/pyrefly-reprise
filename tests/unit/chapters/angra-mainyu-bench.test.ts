/**
 * Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5, the hidden chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6;
 * `boss-side-fix-needs-measured-options`); a result goes to Bailey. The party is the Chapter 5 preset (Yuna 46 White Mage, Rikku 48 and Paine 50 Dark Knights: `[estimate]`,
 * `src/data/ffx2/builds/farplane.ts`), the band every strategy source fights him with (`research/ffx2-angra-mainyu.md` §5). His and his arms' numbers are the written sources' and the stand-in rows'
 * (research §0.2: **no row of theirs was read**), so this table measures the model, and the handoff `docs/handoff/ch-angra-mainyu.md` carries it with that warning.
 *
 * The model is the one the other FFX-2 benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running,
 * 1.0 s inside a submenu, held). 40 seeds a cell (a fight runs about ten minutes of game time, so a cell costs as much as 200 seeds of a short fight). Lines (`../helpers/angraDrive.ts`): **advisor**
 * (the shipped move advisor, the line the guide teaches) and **naive** (no Darkness, no Protect, no cleansing: the girls swing at the body). **Action time** (the 3 s animation window) is **kept by
 * precedent** (D-846), **awaiting Bailey's pick for this chapter** (`ANGRA_ACTION_TIME_ON`); every cell is measured **with and without it** (the "OFF" cells take it away with the engine option
 * `actionTimeSeconds: 0`). The table is printed, and copied into the handoff.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed, that the advisor line does better than the naive one, and that it wins at bench speed more often than not: a
 * regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { ANGRA_ACTION_TIME_ON, ANGRA_ACTION_TIME_SECONDS } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { FLAME_EVERY } from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { driveAngra, type AngraDriveOptions, type AngraLine, type AngraRun } from '../helpers/angraDrive.ts';

const SEEDS = 40;
const PACES: ReadonlyArray<[string, AngraDriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
];
/** The switch taken away: the engine option outranks the formation's field (`action-time.ts`), and 0 is off. */
const off = (o: AngraDriveOptions): AngraDriveOptions => ({ ...o, engine: { ...o.engine, actionTimeSeconds: 0 } });

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number; winMinutes: number; hisTurns: number; flames: number; falls: number; revives: number; kos: number }

function measure(line: AngraLine, opts: AngraDriveOptions): Tally {
  const t: Tally = { wins: 0, seeds: SEEDS, unfinished: 0, minutes: 0, winMinutes: 0, hisTurns: 0, flames: 0, falls: 0, revives: 0, kos: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r: AngraRun = driveAngra(line, seed, opts);
    const minutes = r.ticks / STEPS_PER_SECOND / 60;
    t.minutes += minutes;
    t.hisTurns += r.order.length;
    t.flames += r.flames;
    t.falls += r.armFalls;
    t.revives += r.armRevives;
    t.kos += r.kos;
    if (r.outcome === 'victory') {
      t.wins += 1;
      t.winMinutes += minutes;
    } else if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const rows: string[] = [];
const row = (line: string, mode: string, t: Tally): void => {
  const winMinutes = t.wins > 0 ? (t.winMinutes / t.wins).toFixed(2) : '-';
  rows.push(`| ${line} | ${mode} | ${t.wins}/${t.seeds} | ${avg(t.minutes, t)} | ${winMinutes} | ${avg(t.hisTurns, t)} | ${avg(t.flames, t)} | ${avg(t.falls, t)} | ${avg(t.revives, t)} | ${avg(t.kos, t)} | ${t.seeds - t.wins - t.unfinished} |`);
};

describe(`Angra Mainyu: ${SEEDS} seeds, advisor and naive, two paces, action time on and off`, () => {
  const cells: Array<[AngraLine, string, AngraDriveOptions]> = [];
  for (const line of ['advisor', 'naive'] as AngraLine[]) {
    for (const [pace, opts] of PACES) {
      cells.push([line, `${pace}, action time on`, opts]);
      cells.push([line, `${pace}, action time OFF`, off(opts)]);
    }
  }
  const results = new Map<string, Tally>();

  it('measures every cell to the end of every seed', () => {
    expect(ANGRA_ACTION_TIME_ON).toBe(true);
    expect(ANGRA_ACTION_TIME_SECONDS).toBe(3);
    for (const [line, mode, opts] of cells) {
      const t = measure(line, opts);
      results.set(`${line} / ${mode}`, t);
      row(line, mode, t);
      expect(t.unfinished, `${line} / ${mode}: every fight reaches an outcome`).toBe(0);
    }
    console.log(
      `\n| line | mode | wins | minutes | minutes of a win | his actions | Flames | arm falls | arm revives | KOs | losses |\n|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`,
    );
  }, 900_000);

  it('the advisor line does better than the naive one at every pace, with and without action time, and wins at bench speed more often than not', () => {
    for (const [pace] of PACES) {
      for (const setting of ['action time on', 'action time OFF']) {
        const a = results.get(`advisor / ${pace}, ${setting}`);
        const n = results.get(`naive / ${pace}, ${setting}`);
        if (a === undefined || n === undefined) throw new Error('the first test fills the table');
        expect(a.wins, `${pace}, ${setting}: advisor ${a.wins} against naive ${n.wins}`).toBeGreaterThan(n.wins);
      }
    }
    expect(results.get('advisor / bench (0 ms), action time on')!.wins).toBeGreaterThan(SEEDS / 2);
  });

  it('the lesson holds on the advisor line: with the arms kept down he looses fewer Flames than his clock alone would (one every seven of his turns), and the arms fall and come back again and again', () => {
    for (const setting of ['action time on', 'action time OFF']) {
      const a = results.get(`advisor / bench (0 ms), ${setting}`)!;
      expect(a.flames, `${setting}: ${a.flames} Flames in ${a.hisTurns} of his turns`).toBeLessThan(a.hisTurns / FLAME_EVERY);
      expect(a.falls / a.seeds, setting).toBeGreaterThan(10);
      expect(a.revives / a.seeds, setting).toBeGreaterThan(10);
    }
  });
});
