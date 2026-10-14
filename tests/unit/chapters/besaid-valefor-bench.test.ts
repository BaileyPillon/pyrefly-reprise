/**
 * Valefor at Besaid (FFX-2 Chapter 3, the hidden chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`);
 * a result goes to Bailey. The party is the Chapter 2 preset carried forward (Yuna 23, Rikku 24, Paine 25: `[estimate]`, `src/data/ffx2/builds/besaid.ts`).
 *
 * The model is the one the other aeon benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running,
 * 1.0 s inside a submenu, held); and the **Active** clock at 1.5 s a decision. 100 seeds a row. Lines (`../helpers/valeforDrive.ts`): **advisor** (the shipped move advisor's tactic, the line the guide
 * teaches) and **naive** (no Protect, no Shell, no Breaks, no healing but Cura below 40 %). The chapter ships action time **on, 3 s** (`VALEFOR_ACTION_TIME_ON`, the sibling aeon chapters' pick); the
 * "OFF" rows are the same fight with the time taken away by the engine option (`actionTimeSeconds: 0`). The table is printed, and copied into the handoff `docs/handoff/ch-besaid-valefor.md`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed and that the advisor line does better than the naive one: a regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { VALEFOR_ACTION_TIME_ON, VALEFOR_ACTION_TIME_SECONDS } from '../../../src/data/ffx2/enemies/valefor.ts';
import { driveValefor, type ValeforDriveOptions, type ValeforLine, type ValeforRun } from '../helpers/valeforDrive.ts';

const SEEDS = 100;
const BENCH: ValeforDriveOptions = {};
const WAIT_SPLIT: ValeforDriveOptions = { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } };
const ACTIVE: ValeforDriveOptions = { decisionMs: 1500, engine: { atbMode: 'active' } };
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

describe('Valefor at Besaid: 100 seeds, advisor and naive, bench and human pace, action time on and off', () => {
  const cells: Array<[ValeforLine, string, ValeforDriveOptions]> = [
    ['advisor', 'bench (0 ms), action time on', BENCH],
    ['advisor', 'Wait split 1.5 s, action time on', WAIT_SPLIT],
    ['advisor', 'Active 1.5 s, action time on', ACTIVE],
    ['advisor', 'Wait split 1.5 s, action time OFF', off(WAIT_SPLIT)],
    ['advisor', 'Active 1.5 s, action time OFF', off(ACTIVE)],
    ['naive', 'bench (0 ms), action time on', BENCH],
    ['naive', 'Wait split 1.5 s, action time on', WAIT_SPLIT],
    ['naive', 'Active 1.5 s, action time on', ACTIVE],
    ['naive', 'Wait split 1.5 s, action time OFF', off(WAIT_SPLIT)],
  ];
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
  }, 600_000);

  it('the advisor line does better than the naive one at every pace the two share, and wins at bench speed more often than not', () => {
    for (const mode of ['bench (0 ms), action time on', 'Wait split 1.5 s, action time on', 'Active 1.5 s, action time on', 'Wait split 1.5 s, action time OFF']) {
      const a = results.get(`advisor / ${mode}`);
      const n = results.get(`naive / ${mode}`);
      if (a === undefined || n === undefined) throw new Error('the first test fills the table');
      expect(a.wins, `${mode}: advisor ${a.wins} against naive ${n.wins}`).toBeGreaterThanOrEqual(n.wins);
    }
    expect(results.get('advisor / bench (0 ms), action time on')!.wins).toBeGreaterThan(SEEDS / 2);
  });
});
