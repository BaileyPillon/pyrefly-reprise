/**
 * The Luca Opener (the hidden FFX-2 chapter): the winnability bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`); a result goes to
 * Bailey. The party is the chapter's own estimate (Lv 2 / 2 / 3: the girls' levels and bag at Luca have no source, `src/data/ffx2/builds/luca-opener.ts`), with Lv 1, 4 and 6 and the Chateau and Chapter 2 presets as what-ifs.
 * The enemies' moves run on the game's own rows and their scripts are the game's own (`research/re-ffx2-luca-opener.md`).
 *
 * The model is the one the other benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running, 1.0 s inside a submenu, held);
 * and the **Active** clock at 1.5 s a decision. Lines (`../helpers/lucaOpenerDrive.ts`): **advisor** (the shipped move advisor's tactic, the line the guide teaches) and **naive** (everyone strikes the first living enemy;
 * nobody steals, heals or revives). A cell plays whole chapter runs: link 1, then link 2 through the app's own seam.
 *
 * `PYREFLY_BENCH_SEEDS` sets the seeds a cell at bench speed (100 by default, the suite's size and the preflight's floor); the human-speed cells run half as many (at least 40). The handoff's table is the 200 / 100 run
 * (`node --experimental-transform-types tools/luca-opener-bench.mjs --seeds 200`), copied into `docs/handoff/ch-luca-opener.md`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed, that the advisor line does at least as well as the naive one, that the shipped line wins every run (the sourced difficulty is "very easy":
 * Jegged, both fights), and that no fight comes near a stall: a regression guard, not a claim about the game. **The honest reading is in the handoff**: with the engine's stats for a Lv 2 girl the fights are not close.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { driveLuca, templatesAt, type LucaDriveOptions, type LucaLine, type LucaRun } from '../helpers/lucaOpenerDrive.ts';

const SEEDS = Math.max(100, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
/** The human-speed cells run fewer seeds: each fight there costs more. */
const HUMAN_SEEDS = Math.max(40, Math.floor(SEEDS / 2));
const PACES: ReadonlyArray<[string, LucaDriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];

interface Tally {
  seeds: number; runs: number; link1: number; link2: number; unfinished: number; minutes: number; kos: number; hpLost: number; potions: number; potionsOnOrmi: number; thunderRuns: number; steals: number; maxActions: number;
}

function measure(line: LucaLine, opts: LucaDriveOptions, seeds: number): Tally {
  const t: Tally = { seeds, runs: 0, link1: 0, link2: 0, unfinished: 0, minutes: 0, kos: 0, hpLost: 0, potions: 0, potionsOnOrmi: 0, thunderRuns: 0, steals: 0, maxActions: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r: LucaRun = driveLuca(line, seed, opts);
    if (r.outcome === undefined) t.unfinished += 1;
    if (r.won >= 1) t.link1 += 1;
    if (r.won >= 2) {
      t.link2 += 1;
      if (r.outcome === 'victory') t.runs += 1;
    }
    t.minutes += r.ticks / STEPS_PER_SECOND / 60;
    t.kos += r.kos;
    t.hpLost += r.damageTaken;
    t.potions += r.moves['x2-luca-logos-potion'] ?? 0;
    t.potionsOnOrmi += r.potionsOnOrmi;
    if ((r.moves['x2-luca-leblanc-thunder'] ?? 0) > 0) t.thunderRuns += 1; // runs in which Leblanc lived to cast her Thunder at least once
    t.steals += r.steals;
    t.maxActions = Math.max(t.maxActions, r.order.length);
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const rows: string[] = [];
const row = (party: string, line: string, mode: string, t: Tally): void => {
  rows.push(`| ${party} | ${line} | ${mode} | ${t.seeds} | ${t.runs} | ${t.link1} | ${t.link2} | ${avg(t.minutes, t)} | ${avg(t.kos, t)} | ${Math.round(t.hpLost / t.seeds)} | ${avg(t.potions, t)} | ${avg(t.potionsOnOrmi, t)} | ${avg(t.thunderRuns, t)} | ${avg(t.steals, t)} | ${t.maxActions} |`);
};

describe(`the Luca Opener: ${SEEDS} chapter runs a cell at bench speed and ${HUMAN_SEEDS} at human speed, advisor and naive, three paces, and the presets as what-ifs`, () => {
  const results = new Map<string, Tally>();

  it('measures every cell to the end of every seed', () => {
    for (const line of ['advisor', 'naive'] as LucaLine[]) {
      for (const [pace, opts] of PACES) {
        const t = measure(line, opts, pace.startsWith('bench') ? SEEDS : HUMAN_SEEDS);
        results.set(`${line} / shipped / ${pace}`, t);
        row('shipped Lv 2 / 2 / 3', line, pace, t);
        expect(t.unfinished, `${line} / ${pace}: every run reaches an outcome`).toBe(0);
      }
    }
    // The line that lets Logos live long enough to throw his Potion (Ormi struck first): the one cell where the Potion is in play.
    for (const [pace, opts] of PACES.slice(0, 2)) {
      const t = measure('ormiFirst', opts, pace.startsWith('bench') ? SEEDS : HUMAN_SEEDS);
      results.set(`ormiFirst / shipped / ${pace}`, t);
      row('shipped Lv 2 / 2 / 3', 'ormiFirst', pace, t);
      expect(t.unfinished, `ormiFirst / ${pace}: every run reaches an outcome`).toBe(0);
    }
    const whatIfs: Array<[string, LucaDriveOptions]> = [
      ['Lv 1 / 1 / 1', templatesAt([1, 1, 1])],
      ['Lv 4 / 4 / 4', templatesAt([4, 4, 4])],
      ['Lv 6 / 6 / 6', templatesAt([6, 6, 6])],
      ['Chateau preset (20 / 21 / 22), no Songstress hold', { build: structuredClone(chateauBuild), songstress: structuredClone(chateauBuild) }],
      ['Chapter 2 preset (23 / 24 / 25), no Songstress hold', { build: structuredClone(bevelleBuild), songstress: structuredClone(bevelleBuild) }],
    ];
    for (const [name, opts] of whatIfs) {
      for (const line of ['advisor', 'naive'] as LucaLine[]) {
        const t = measure(line, opts, HUMAN_SEEDS);
        results.set(`${line} / ${name}`, t);
        row(name, line, 'bench (0 ms)', t);
        expect(t.unfinished, `${line} / ${name}: every run reaches an outcome`).toBe(0);
      }
    }
    console.log(
      `\n| party | line | pace | seeds | runs won | link 1 won | link 2 won | minutes | girl KOs | HP lost | Potions thrown | Potions that mended Ormi | runs with a Thunder | steals | longest (their actions) |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n`,
    );
  }, 1_800_000);

  it('the advisor line does at least as well as the naive one at every pace, and the shipped line wins every run of both links ("very easy", Jegged), with nobody knocked out', () => {
    for (const [pace] of PACES) {
      const a = results.get(`advisor / shipped / ${pace}`);
      const n = results.get(`naive / shipped / ${pace}`);
      if (a === undefined || n === undefined) throw new Error('the first test fills the table');
      expect(a.runs, `${pace}: advisor ${a.runs} against naive ${n.runs}`).toBeGreaterThanOrEqual(n.runs);
      expect(a.runs, `${pace}: every run is won`).toBe(a.seeds);
      expect(a.link1, `${pace}: link 1`).toBe(a.seeds);
      expect(a.link2, `${pace}: link 2`).toBe(a.seeds);
      expect(a.kos, `${pace}: nobody falls`).toBe(0);
    }
  });

  it('when Ormi is struck first Logos does get his Potion off in some runs (and never more than one a run), and the chapter is still won every time', () => {
    const t = results.get('ormiFirst / shipped / bench (0 ms)')!;
    expect(t.potions, 'Potions thrown over the runs').toBeGreaterThan(0);
    expect(t.potions, 'never more than one a run').toBeLessThanOrEqual(t.seeds);
    // How many of them mend Ormi (a Potion thrown after he fell is turned onto a living friend by the engine: handoff section 3) is a measurement, not a rule: it is printed in the table and only bounded here.
    expect(t.potionsOnOrmi, 'a Potion mends Ormi at most once a run, and never more often than it is thrown').toBeLessThanOrEqual(t.potions);
    expect(t.runs).toBe(t.seeds);
  });

  it('the advisor line steals from every enemy it meets (about two and a half steals a run: Logos, Ormi and Leblanc, one try each), and the naive line steals nothing', () => {
    const a = results.get('advisor / shipped / bench (0 ms)')!;
    expect(a.steals / a.seeds).toBeGreaterThan(2);
    expect(a.steals / a.seeds).toBeLessThanOrEqual(3);
    expect(results.get('naive / shipped / bench (0 ms)')!.steals).toBe(0);
  });

  it('no fight comes near a stall: the longest run, in the enemies\' own actions, is under thirty', () => {
    for (const [key, t] of results) expect(t.maxActions, key).toBeLessThan(30);
  });

  it('the stronger presets win every run too: the Chapter 2 and Chateau parties (the party is the lever on difficulty, never a boss number)', () => {
    for (const key of ['advisor / Chateau preset (20 / 21 / 22), no Songstress hold', 'advisor / Chapter 2 preset (23 / 24 / 25), no Songstress hold']) {
      const t = results.get(key)!;
      expect(t.runs, key).toBe(t.seeds);
    }
  });
});
