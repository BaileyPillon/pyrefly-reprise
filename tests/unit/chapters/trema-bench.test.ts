/**
 * Chapter XIII — seeded benches across 200 seeds per fight (plan
 * `docs/plans/chapter-trema-review.md` §9, T10; TR6 = c: "measure first, then ask once with
 * the numbers"). **FFX-2 only.** Measure, never tune: a low rate goes to Bailey as measured
 * options; no boss number is changed to move it. The table is printed and copied into
 * `docs/plans/trema-bench.md` and the commit body.
 *
 * Bench speed is zero decision time under Active ATB (Bailey, 2026-09-21: FFX-2 is Active
 * only); at zero decision time nothing ticks under a menu, so Active and Wait read alike. The
 * human-speed rows spend 1.5 s per menu under Active, 40 seeds each. Minutes are game minutes
 * at Normal ATB speed (3,000 ticks a second).
 *
 * The option rows are **not built**: they swap in the other sourced reading of Paragon's
 * block (T-6, the wiki's Mag 88 / Def 244 / MDef 89) or the sourced Stamina Tonic's doubled
 * max HP (TR11 c, which the engine does not model), to show Bailey what each would buy.
 */

import { describe, expect, it } from 'vitest';
import { driveChapter, driveParagon, driveTremaFresh, LINES, type DriveOptions, type LineOptions, type LinkRun } from '../helpers/tremaDrive.ts';

const SEEDS = 200;
const HUMAN_SEEDS = 40;
const WIKI_T6 = { mag: 88, def: 244, mdef: 89 };
const rows: string[] = [];

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number; winMinutes: number; bigBang: number; genesis: number; meteor: number; ultima: number; flare: number; blocked: number; darkness: number }

function bench(run: (seed: number) => LinkRun, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, winMinutes: 0, bigBang: 0, genesis: 0, meteor: 0, ultima: 0, flare: 0, blocked: 0, darkness: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = run(seed);
    if (r.outcome === 'victory') { t.wins += 1; t.winMinutes += r.minutes; }
    if (r.outcome === undefined) t.unfinished += 1;
    t.minutes += r.minutes;
    t.bigBang += r.count('paragon-big-bang');
    t.genesis += r.count('paragon-genesis');
    t.meteor += r.count('trema-meteor');
    t.ultima += r.count('trema-ultima');
    t.flare += r.count('trema-flare');
    t.blocked += r.blocked;
    t.darkness += r.count('x2-dark-knight-darkness');
  }
  return t;
}

const per = (n: number, t: Tally) => (n / t.seeds).toFixed(2);

function row(link: string, line: string, mode: string, t: Tally): void {
  const winMin = t.wins > 0 ? (t.winMinutes / t.wins).toFixed(1) : '—';
  const moves = link.startsWith('1')
    ? `BB ${per(t.bigBang, t)} · Gen ${per(t.genesis, t)}`
    : `Met ${per(t.meteor, t)} · Ult ${per(t.ultima, t)} · Flare ${per(t.flare, t)} · blocked ${per(t.blocked, t)}`;
  rows.push(`| ${link} | ${line} | ${mode} | ${t.wins}/${t.seeds} | ${(t.minutes / t.seeds).toFixed(2)} | ${winMin} | ${moves} | ${per(t.darkness, t)} |`);
}

const paragon = (line: LineOptions, opts: DriveOptions = {}) => (seed: number) => driveParagon(line, seed, opts);
const tremaFresh = (line: LineOptions, opts: DriveOptions = {}) => (seed: number) => driveTremaFresh(line, seed, opts);

describe('Chapter XIII benches (200 seeds a fight, bench speed, Active)', () => {
  const results = new Map<string, Tally>();
  const cases: Array<[string, string, (seed: number) => LinkRun]> = [
    ['1 Paragon', 'intended: Attack, Shell, heals, never Darkness', paragon(LINES.intended)],
    ['1 Paragon', 'wrong: Darkness on Paragon', paragon(LINES.darknessOnParagon)],
    ['1 Paragon', 'option T-6 b (wiki Mag 88 / Def 244 / MDef 89), intended', paragon(LINES.intended, { paragonStats: WIKI_T6 })],
    ['1 Paragon', 'option TR11 c (Stamina Tonic: max HP x2), intended', paragon(LINES.intended, { hpMultiplier: 2 })],
    ['2 Trema (fresh)', 'intended: Protect, drain to < 10 MP, Shell before Meteor, Darkness x2', tremaFresh(LINES.intended)],
    ['2 Trema (fresh)', 'intended without the drain', tremaFresh(LINES.noDrain)],
    ['2 Trema (fresh)', 'wrong: Darkness x2, no drain, no Curtains', tremaFresh(LINES.noDrainNoShell)],
    ['2 Trema (fresh)', 'option TR11 c (max HP x2), intended without the drain', tremaFresh(LINES.noDrain, { hpMultiplier: 2 })],
  ];

  for (const [link, name, run] of cases) {
    it(`${link}: ${name}`, () => {
      const t = bench(run, SEEDS);
      results.set(name, t);
      row(link, name, 'Active, D=0', t);
      expect(t.unfinished).toBe(0); // every run ends in a win or a loss
    }, 300_000);
  }

  it('the wrong line on Paragon draws Big Bang and the intended one never does', () => {
    expect(results.get('intended: Attack, Shell, heals, never Darkness')?.bigBang).toBe(0);
    expect(results.get('wrong: Darkness on Paragon')?.bigBang ?? 0).toBeGreaterThan(0);
  });

  it('the whole chapter, intended line, Trema entered in Paragon\'s end state', () => {
    let wins = 0;
    let reached = 0;
    let minutes = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const run = driveChapter(LINES.intended, seed);
      expect(run.outcome).toBeDefined();
      if (run.links.length > 1) reached += 1;
      if (run.outcome === 'victory') wins += 1;
      minutes += run.links.reduce((m, l) => m + l.minutes, 0);
    }
    rows.push(`| Chapter (1-2) | intended on both links | Active, D=0 | ${wins}/${SEEDS} | ${(minutes / SEEDS).toFixed(2)} | — | reached Trema ${reached}/${SEEDS} | |`);
  }, 300_000);

  it('human speed: 1.5 s a menu under Active (40 seeds)', () => {
    const human = { decisionMs: 1500 };
    row('1 Paragon', 'intended', 'Active, D=1.5 s', bench(paragon(LINES.intended, human), HUMAN_SEEDS));
    row('2 Trema (fresh)', 'intended without the drain', 'Active, D=1.5 s', bench(tremaFresh(LINES.noDrain, human), HUMAN_SEEDS));
    row('2 Trema (fresh)', 'intended', 'Active, D=1.5 s', bench(tremaFresh(LINES.intended, human), HUMAN_SEEDS));
    console.log(
      ['| Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |',
        '|---|---|---|---:|---:|---:|---|---:|', ...rows].join('\n'),
    );
  }, 600_000);
});
