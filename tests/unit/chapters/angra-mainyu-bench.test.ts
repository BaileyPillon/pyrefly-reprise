/**
 * Angra Mainyu (FFX-2 Chapter 5, the hidden chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`); a result
 * goes to Bailey. The party is the Chapter V preset (Yuna 46, Rikku 48, Paine 50: `[estimate]`, the Experiment's, `src/data/ffx2/builds/angra-mainyu.ts`: no source gives the mission's levels). The three bodies run on
 * the game's own rows and scripts (`research/re-ffx2-angra-mainyu.md`).
 *
 * The model is the one the other benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running, 1.0 s inside a
 * submenu, held); and the **Active** clock at 1.5 s a decision. Lines (`../helpers/angraMainyuDrive.ts`): **advisor** (the shipped move advisor\'s tactic, the line the guide teaches: one healer, two Dark Knights
 * using Darkness) and **naive** (no Protect, no Shell, no items, plain attacks). **Action time** (the 3 s animation window) is **kept by precedent** (D-151 Cloister, D-187 and D-197 Road, D-269 Ixion),
 * **awaiting Bailey\'s pick for this chapter** (`ANGRA_MAINYU_ACTION_TIME_ON`); every cell is measured **with and without it** (the "OFF" cells take the time away by the engine option `actionTimeSeconds: 0`).
 * The second table is the one option the measurements hand to Bailey: **a raise of the preset\'s three levels** (`ANGRA_MAINYU_LEVEL_BONUS`, OFF at 0), advisor line, bench speed, action time on. Both tables are printed, and copied
 * into the handoff `docs/handoff/ch-angra-mainyu.md`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed, that the sourced preset is what ships (no level raised), that the advisor line does no worse than the naive one, and that more levels
 * never make the advisor line win less often: a regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { ANGRA_MAINYU_ACTION_TIME_ON, ANGRA_MAINYU_ACTION_TIME_SECONDS } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { ANGRA_MAINYU_LEVEL_BONUS, angraMainyuBuild } from '../../../src/data/ffx2/builds/angra-mainyu.ts';
import { ANGRA_ABILITY as A } from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { driveAngra, type AngraDriveOptions, type AngraLine, type AngraRun } from '../helpers/angraMainyuDrive.ts';

const SEEDS = 20;
const PACES: ReadonlyArray<[string, AngraDriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];
/** The switch taken away: the engine option outranks the formation\'s field (`action-time.ts`), and 0 is off. */
const off = (o: AngraDriveOptions): AngraDriveOptions => ({ ...o, engine: { ...o.engine, actionTimeSeconds: 0 } });

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number; bodyTurns: number; flames: number; osmoses: number; fullLives: number; armKos: number; kos: number }

function measure(line: AngraLine, opts: AngraDriveOptions): Tally {
  const t: Tally = { wins: 0, seeds: SEEDS, unfinished: 0, minutes: 0, bodyTurns: 0, flames: 0, osmoses: 0, fullLives: 0, armKos: 0, kos: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r: AngraRun = driveAngra(line, seed, opts);
    t.minutes += r.ticks / STEPS_PER_SECOND / 60;
    t.bodyTurns += r.order.length;
    t.flames += r.moves[A.flame] ?? 0;
    t.osmoses += r.moves[A.osmose] ?? 0;
    t.fullLives += r.moves[A.fullLife] ?? 0;
    t.armKos += r.armKos;
    t.kos += r.kos;
    if (r.outcome === 'victory') t.wins += 1;
    else if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const row = (label: string, mode: string, t: Tally): string =>
  `| ${label} | ${mode} | ${t.wins}/${t.seeds} | ${avg(t.minutes, t)} | ${avg(t.bodyTurns, t)} | ${avg(t.flames, t)} | ${avg(t.osmoses, t)} | ${avg(t.fullLives, t)} | ${avg(t.armKos, t)} | ${avg(t.kos, t)} | ${t.seeds - t.wins - t.unfinished} |`;
const HEAD = '| line | mode | wins | minutes | body actions | Flames | Osmoses | Full-Lifes | arm KOs | girl KOs | losses |\n|---|---|---|---|---|---|---|---|---|---|---|';

describe('the shipped defaults', () => {
  it('the sourced preset ships: no level is raised, and the 3 s window is on by precedent (awaiting Bailey\'s pick)', () => {
    expect(ANGRA_MAINYU_LEVEL_BONUS).toBe(0);
    expect(angraMainyuBuild.members.map((m) => [m.id, m.level])).toEqual([['yuna', 46], ['rikku', 48], ['paine', 50]]);
    expect(ANGRA_MAINYU_ACTION_TIME_ON).toBe(true);
    expect(ANGRA_MAINYU_ACTION_TIME_SECONDS).toBe(3);
  });
});

describe(`Angra Mainyu: ${SEEDS} seeds, advisor and naive, three paces, action time on and off`, () => {
  const cells: Array<[AngraLine, string, AngraDriveOptions]> = [];
  for (const line of ['advisor', 'naive'] as AngraLine[]) {
    for (const [pace, opts] of PACES) {
      cells.push([line, `${pace}, action time on`, opts]);
      cells.push([line, `${pace}, action time OFF`, off(opts)]);
    }
  }
  const results = new Map<string, Tally>();

  it('measures every cell to the end of every seed', () => {
    const rows: string[] = [];
    for (const [line, mode, opts] of cells) {
      const t = measure(line, opts);
      results.set(`${line} / ${mode}`, t);
      rows.push(row(line, mode, t));
      expect(t.unfinished, `${line} / ${mode}: every fight reaches an outcome`).toBe(0);
    }
    console.log(`\n${HEAD}\n${rows.join('\n')}\n`);
  }, 900_000);

  it('the advisor line does no worse than the naive one at every pace, with and without action time', () => {
    for (const [pace] of PACES) {
      for (const setting of ['action time on', 'action time OFF']) {
        const a = results.get(`advisor / ${pace}, ${setting}`);
        const n = results.get(`naive / ${pace}, ${setting}`);
        if (a === undefined || n === undefined) throw new Error('the first test fills the table');
        expect(a.wins, `${pace}, ${setting}: advisor ${a.wins} against naive ${n.wins}`).toBeGreaterThanOrEqual(n.wins);
        expect(a.minutes, `${pace}, ${setting}: the advisor line lasts at least as long`).toBeGreaterThanOrEqual(n.minutes);
      }
    }
  });
});

describe('the one option: a raise of the preset\'s three levels (advisor line, bench speed, action time on)', () => {
  it('measures +0, +10, +20 and +30 levels, and more levels never win less often', () => {
    const wins: number[] = [];
    const rows: string[] = [];
    for (const raise of [0, 10, 20, 30]) {
      const build = structuredClone(angraMainyuBuild);
      for (const m of build.members) m.level = Math.min(99, m.level + raise);
      const t = measure('advisor', { build });
      wins.push(t.wins);
      rows.push(row('advisor', `levels ${build.members.map((m) => m.level).join('/')} (+${raise})`, t));
      expect(t.unfinished, `+${raise}: every fight reaches an outcome`).toBe(0);
    }
    console.log(`\n${HEAD}\n${rows.join('\n')}\n`);
    for (let i = 1; i < wins.length; i++) expect(wins[i]!, `wins at +${i * 10} against +${(i - 1) * 10}`).toBeGreaterThanOrEqual(wins[i - 1]!);
  }, 900_000);
});
