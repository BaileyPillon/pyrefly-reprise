/**
 * Valefor at Besaid (FFX-2 Chapter 3, the hidden chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`);
 * a result goes to Bailey. The party is the Chapter 2 preset carried forward (Yuna 23, Rikku 24, Paine 25: `[estimate]`, `src/data/ffx2/builds/besaid.ts`). Her moves run on the game's own rows and her script is the
 * game's own (the RE review of 2026-10-14), so the charge and recovery of her moves are the rows' own.
 *
 * The model is the one the other aeon benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running,
 * 1.0 s inside a submenu, held); and the **Active** clock at 1.5 s a decision. 100 seeds a cell. Lines (`../helpers/valeforDrive.ts`): **advisor** (the shipped move advisor's tactic, the line the guide
 * teaches) and **naive** (no Protect, no Shell, no Breaks, no healing but Cura below 40 %). **Action time** (the 3 s animation window) is **kept by precedent** (D-151 Cloister, D-187 and D-197 Road, D-269 Ixion),
 * **awaiting Bailey's pick for this chapter** (`VALEFOR_ACTION_TIME_ON`); every cell is measured **with and without it** (the "OFF" cells take the time away by the engine option `actionTimeSeconds: 0`). The table is
 * printed, and copied into the handoff `docs/handoff/ch-besaid-valefor.md`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed and that the advisor line does better than the naive one: a regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { VALEFOR_ACTION_TIME_ON, VALEFOR_ACTION_TIME_SECONDS } from '../../../src/data/ffx2/enemies/valefor.ts';
import { driveValefor, type ValeforDriveOptions, type ValeforLine, type ValeforRun } from '../helpers/valeforDrive.ts';

const SEEDS = 100;
const PACES: ReadonlyArray<[string, ValeforDriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];
/** The switch taken away: the engine option outranks the formation's field (`action-time.ts`), and 0 is off. */
const off = (o: ValeforDriveOptions): ValeforDriveOptions => ({ ...o, engine: { ...o.engine, actionTimeSeconds: 0 } });

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number; herTurns: number; rays: number; blasts: number; wings: number; kos: number }

function measure(line: ValeforLine, opts: ValeforDriveOptions): Tally {
  const t: Tally = { wins: 0, seeds: SEEDS, unfinished: 0, minutes: 0, herTurns: 0, rays: 0, blasts: 0, wings: 0, kos: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r: ValeforRun = driveValefor(line, seed, opts);
    t.minutes += r.ticks / STEPS_PER_SECOND / 60;
    t.herTurns += r.order.length;
    t.rays += r.moves['x2-valefor-energy-ray'] ?? 0;
    t.blasts += r.moves['x2-valefor-energy-blast'] ?? 0;
    t.wings += r.moves['x2-valefor-sonic-wings'] ?? 0;
    t.kos += r.kos;
    if (r.outcome === 'victory') t.wins += 1;
    else if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const rows: string[] = [];
const row = (line: string, mode: string, t: Tally): void => {
  rows.push(`| ${line} | ${mode} | ${t.wins}/${t.seeds} | ${avg(t.minutes, t)} | ${avg(t.herTurns, t)} | ${avg(t.rays, t)} | ${avg(t.blasts, t)} | ${avg(t.wings, t)} | ${avg(t.kos, t)} | ${t.seeds - t.wins - t.unfinished} |`);
};

describe('Valefor at Besaid: 100 seeds, advisor and naive, three paces, action time on and off', () => {
  const cells: Array<[ValeforLine, string, ValeforDriveOptions]> = [];
  for (const line of ['advisor', 'naive'] as ValeforLine[]) {
    for (const [pace, opts] of PACES) {
      cells.push([line, `${pace}, action time on`, opts]);
      cells.push([line, `${pace}, action time OFF`, off(opts)]);
    }
  }
  const results = new Map<string, Tally>();

  it('measures every cell to the end of every seed', () => {
    expect(VALEFOR_ACTION_TIME_ON).toBe(true);
    expect(VALEFOR_ACTION_TIME_SECONDS).toBe(3);
    for (const [line, mode, opts] of cells) {
      const t = measure(line, opts);
      results.set(`${line} / ${mode}`, t);
      row(line, mode, t);
      expect(t.unfinished, `${line} / ${mode}: every fight reaches an outcome`).toBe(0);
    }
    console.log(
      `\n| line | mode | wins | minutes | her actions | Rays | Blasts | Sonic Wings | KOs | losses |\n|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`,
    );
  }, 900_000);

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
  });
});
