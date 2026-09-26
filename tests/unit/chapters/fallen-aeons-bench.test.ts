/**
 * Chapter XI — seeded benches, per link and for the whole Road, across 200
 * seeds (plan `docs/plans/chapter-fallen-aeons-review.md` §9, T10). **FFX-2
 * only.** Measure, never tune: a low rate goes to Bailey as a measured option;
 * no boss number is changed to move it. The table is printed and copied into
 * `docs/plans/fallen-aeons-bench.md`.
 *
 * Bench speed is zero decision time under the engine's default Wait, which is
 * also what the whole-menu Wait gives a human (the clock holds under any open
 * menu). The human-speed rows spend 1.5 s per menu under Active and under the
 * Wait split (0.5 s on the top list), 40 seeds each, to show the clock's cost.
 */

import { describe, expect, it } from 'vitest';
import { driveChain, driveLink, LINES, type LineOptions } from '../helpers/fallenAeonsDrive.ts';
import { ROAD_ANIMA, ROAD_SHIVA, ROAD_SISTERS } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { AC_TRIGGER_FLAG } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';

const SEEDS = 200;
const HUMAN_SEEDS = 40;
const rows: string[] = [];

function bench(linkId: string, line: LineOptions, seeds: number, opts: Parameters<typeof driveLink>[3] = {}) {
  let wins = 0;
  let unfinished = 0;
  let deltas = 0;
  let overdrives = 0;
  let ticks = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const run = driveLink(linkId, line, seed, opts);
    if (run.outcome === 'victory') wins += 1;
    if (run.outcome === undefined) unfinished += 1;
    deltas += run.deltaAttacks;
    overdrives += run.overdrives;
    ticks += run.ticks;
  }
  return { wins, unfinished, seeds, deltas, overdrives, avgTicks: Math.round(ticks / seeds) };
}

function row(link: string, name: string, mode: string, r: ReturnType<typeof bench>): void {
  rows.push(
    `| ${link} | ${name} | ${mode} | ${r.wins}/${r.seeds} | ${(r.overdrives / r.seeds).toFixed(2)} | ${(r.deltas / r.seeds).toFixed(2)} | ${r.avgTicks} |`,
  );
}

describe('Chapter XI benches (200 seeds, bench speed, Wait)', () => {
  const cases: Array<[string, string, string, LineOptions]> = [
    ['1 Shiva', ROAD_SHIVA, 'intended: Protect+Shell, Darkness x2, heals, Remedy on Stop', LINES.shivaIntended],
    ['1 Shiva', ROAD_SHIVA, 'wrong: all-out (no cures, no Remedy)', LINES.shivaAllOut],
    ['2 Sisters', ROAD_SISTERS, 'intended: Darkness x2 + Dispel + heals (3-guide clear)', LINES.sistersDarknessDispel],
    ['2 Sisters', ROAD_SISTERS, 'alternative: kill Mindy first with Attack + Dispel', LINES.sistersMindyFirst],
    ['2 Sisters', ROAD_SISTERS, 'alternative: kill Mindy first with Drain + Dispel', LINES.sistersMindyFirstDrain],
    ['2 Sisters', ROAD_SISTERS, 'wrong: Darkness spam, no Dispel', LINES.sistersDarknessSpam],
    ['3 Anima', ROAD_ANIMA, 'intended: Shell+Protect, Darkness x2, heals, Remedy after Pain', LINES.animaIntended],
    ['3 Anima', ROAD_ANIMA, 'wrong: no Shell, no Remedy', LINES.animaNoAnswers],
  ];
  const results = new Map<string, ReturnType<typeof bench>>();

  for (const [link, id, name, line] of cases) {
    it(`${link}: ${name}`, () => {
      const r = bench(id, line, SEEDS);
      results.set(name, r);
      row(link, name, 'Wait, D=0', r);
      expect(r.unfinished).toBe(0); // every run ends in a win or a loss
    }, 300_000);
  }

  // Since option A (3 s of action time on the Road, Bailey 2026-09-25) Shiva and Anima forgive the
  // wrong line at bench speed (Shiva 200 vs 194, Anima 200 vs 200 of 200): measured and disclosed in
  // docs/plans/fallen-aeons-bench.md, never tuned. The Sisters still separate the lines, so the
  // strict check stays there and the other two are pinned as "never worse".
  it('the intended line is never worse than the credibly wrong one, and beats it on the Sisters', () => {
    const wins = (link: string, kind: 'intended' | 'wrong') => {
      const c = cases.find((x) => x[0] === link && x[2].startsWith(kind));
      return c ? (results.get(c[2])?.wins ?? -1) : -1;
    };
    for (const link of ['1 Shiva', '2 Sisters', '3 Anima']) {
      expect(wins(link, 'intended'), link).toBeGreaterThanOrEqual(wins(link, 'wrong'));
    }
    expect(wins('2 Sisters', 'intended')).toBeGreaterThan(wins('2 Sisters', 'wrong'));
  });

  it('FA8 b (landed damage only) measured on the Sisters, for Bailey', () => {
    const flags = { [AC_TRIGGER_FLAG]: 'damaged' };
    const a = bench(ROAD_SISTERS, LINES.sistersDarknessDispel, SEEDS, { flags });
    const b = bench(ROAD_SISTERS, LINES.sistersDarknessSpam, SEEDS, { flags });
    row('2 Sisters', 'intended, under FA8 b', 'Wait, D=0', a);
    row('2 Sisters', 'wrong, under FA8 b', 'Wait, D=0', b);
    expect(a.unfinished + b.unfinished).toBe(0);
  }, 300_000);

  it('the whole Road, intended lines, carrying the party through the Save Spheres', () => {
    let wins = 0;
    const lostAt = [0, 0, 0];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const run = driveChain([LINES.shivaIntended, LINES.sistersDarknessDispel, LINES.animaIntended], seed);
      if (run.outcome === 'victory') wins += 1;
      else lostAt[run.links.length - 1]! += 1;
      expect(run.outcome).toBeDefined();
    }
    rows.push(`| Road (1-2-3) | intended on each link | Wait, D=0 | ${wins}/${SEEDS} | lost at Shiva ${lostAt[0]}, Sisters ${lostAt[1]}, Anima ${lostAt[2]} | | |`);
  }, 300_000);

  it('human speed: 1.5 s a menu under Active and under the Wait split (40 seeds)', () => {
    const intended: Array<[string, string, LineOptions]> = [
      ['1 Shiva', ROAD_SHIVA, LINES.shivaIntended],
      ['2 Sisters', ROAD_SISTERS, LINES.sistersDarknessDispel],
      ['3 Anima', ROAD_ANIMA, LINES.animaIntended],
    ];
    for (const [link, id, line] of intended) {
      const active = bench(id, line, HUMAN_SEEDS, { decisionMs: 1500, engine: { atbMode: 'active' } });
      const split = bench(id, line, HUMAN_SEEDS, { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } });
      const whole = bench(id, line, HUMAN_SEEDS, { decisionMs: 1500, engine: { atbMode: 'wait' } });
      row(link, 'intended', 'Active, D=1.5 s', active);
      row(link, 'intended', 'Wait split, D=1.5 s (0.5 s top)', split);
      row(link, 'intended', 'Wait (whole menu), D=1.5 s', whole);
      expect(active.unfinished + split.unfinished + whole.unfinished).toBe(0);
    }
    // The credibly wrong lines at human pace (Wait split), for the option A disclosure.
    const wrong: Array<[string, string, LineOptions]> = [
      ['1 Shiva', ROAD_SHIVA, LINES.shivaAllOut],
      ['2 Sisters', ROAD_SISTERS, LINES.sistersDarknessSpam],
      ['3 Anima', ROAD_ANIMA, LINES.animaNoAnswers],
    ];
    for (const [link, id, line] of wrong) {
      const split = bench(id, line, HUMAN_SEEDS, { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } });
      row(link, 'wrong', 'Wait split, D=1.5 s (0.5 s top)', split);
      expect(split.unfinished).toBe(0);
    }
    console.log(
      ['| Link | Line | ATB | Wins | Overdrives / fight | Delta Attacks / fight | Avg ticks |', '|---|---|---|---:|---:|---:|---:|', ...rows].join('\n'),
    );
  }, 600_000);
});
