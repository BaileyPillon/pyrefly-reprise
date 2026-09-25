/**
 * Chapter XV — seeded benches, per shade and for the whole Den, across 200 seeds
 * (plan `docs/plans/chapter-gippal-review.md` §9, T10). **FFX-2 only.** Measure,
 * never tune: a low rate goes to Bailey as a measured option (GP4 c, GP5, GP6);
 * no boss number is changed to move it.
 *
 * Bench speed is zero decision time under the engine's default Wait (the whole-
 * menu hold a human gets too). The human-speed rows spend 1.5 s a menu under
 * Active (Bailey's pick for FFX-2, 2026-09-21), 40 seeds each. A single shade is
 * fought from the preset at full HP and MP; the Den carries everything (GP3 a).
 *
 * One **what-if** row set, not shipped: the same preset at +8 levels (54 / 56 / 58,
 * nearer the shades' 52-63), the GP5 b question put as numbers, `[estimate]`.
 */

import { describe, expect, it } from 'vitest';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { driveDen, driveLink, LINES, type DriveOptions, type LineOptions } from '../helpers/denOfWoeDrive.ts';
import { DEN_BARALAI, DEN_GIPPAL, DEN_NOOJ } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';

const SEEDS = 200;
const HUMAN_SEEDS = 40;
const rows: string[] = [];

const WHAT_IF: FFX2PartyBuild = {
  ...farplaneBuild,
  members: farplaneBuild.members.map((m) => ({ ...m, level: m.level + 8 })) as FFX2PartyBuild['members'],
};

function benchLink(id: string, line: LineOptions, seeds: number, opts: DriveOptions & { party?: FFX2PartyBuild } = {}) {
  let wins = 0;
  let unfinished = 0;
  let ticks = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const run = driveLink(id, line, seed, opts);
    if (run.outcome === 'victory') wins += 1;
    if (run.outcome === undefined) unfinished += 1;
    ticks += run.ticks;
  }
  return { wins, unfinished, seeds, avgTicks: Math.round(ticks / seeds) };
}

function benchDen(line: LineOptions, seeds: number, opts: DriveOptions & { party?: FFX2PartyBuild } = {}) {
  let wins = 0;
  let unfinished = 0;
  const lostAt = [0, 0, 0];
  for (let seed = 1; seed <= seeds; seed++) {
    const run = driveDen(line, seed, opts);
    if (run.outcome === 'victory') wins += 1;
    else if (run.outcome === undefined) unfinished += 1;
    else lostAt[run.links.length - 1]! += 1;
  }
  return { wins, unfinished, seeds, lostAt };
}

function row(link: string, line: string, mode: string, r: { wins: number; seeds: number; avgTicks?: number; lostAt?: number[] }): void {
  const extra = r.lostAt ? `lost at Baralai ${r.lostAt[0]}, Gippal ${r.lostAt[1]}, Nooj ${r.lostAt[2]}` : `${r.avgTicks}`;
  rows.push(`| ${link} | ${line} | ${mode} | ${r.wins}/${r.seeds} | ${extra} |`);
}

const LINKS: Array<[string, string]> = [['1 Baralai', DEN_BARALAI], ['2 Gippal', DEN_GIPPAL], ['3 Nooj', DEN_NOOJ]];
const NAMED: Array<[string, LineOptions]> = [
  ['intended: Protect+Shell, Darkness x2, heals, Remedy, Lightfall prep', LINES.intended],
  ['intended without the Lightfall prep', LINES.noPrep],
  ['wrong: magic (Drain on MP), no Protect, no Remedy', LINES.magic],
  ['wrong: all-out, no cures, no Remedy', LINES.allOut],
];

describe('Chapter XV benches (200 seeds, bench speed, Wait)', () => {
  const wins = new Map<string, number>();

  for (const [link, id] of LINKS) {
    for (const [name, line] of NAMED) {
      it(`${link}: ${name}`, () => {
        const r = benchLink(id, line, SEEDS);
        wins.set(`${link}|${name}`, r.wins);
        row(link, name, 'Wait, D=0', r);
        expect(r.unfinished).toBe(0); // every run ends in a win or a loss
      }, 300_000);
    }
  }

  it('the intended line beats both credibly wrong ones on every shade', () => {
    for (const [link] of LINKS) {
      const at = (n: number) => wins.get(`${link}|${NAMED[n]![0]}`) ?? -1;
      expect(at(0), link).toBeGreaterThanOrEqual(at(2));
      expect(at(0), link).toBeGreaterThan(at(3));
    }
  });

  it('the whole Den, carried (GP3 a), a loss retrying from Baralai (GP4 a)', () => {
    for (const [name, line] of NAMED) {
      const r = benchDen(line, SEEDS);
      row('Den (1-2-3)', name, 'Wait, D=0', r);
      expect(r.unfinished).toBe(0);
    }
  }, 600_000);

  it('what-if, not shipped: the preset at +8 levels (GP5 b as numbers)', () => {
    for (const [link, id] of LINKS) row(link, 'intended, what-if +8 levels', 'Wait, D=0', benchLink(id, LINES.intended, SEEDS, { party: WHAT_IF }));
    row('Den (1-2-3)', 'intended, what-if +8 levels', 'Wait, D=0', benchDen(LINES.intended, SEEDS, { party: WHAT_IF }));
  }, 600_000);

  it('human speed: 1.5 s a menu under Active (40 seeds)', () => {
    for (const [link, id] of LINKS) {
      const r = benchLink(id, LINES.intended, HUMAN_SEEDS, { decisionMs: 1500, engine: { atbMode: 'active' } });
      row(link, 'intended', 'Active, D=1.5 s', r);
      expect(r.unfinished).toBe(0);
    }
    row('Den (1-2-3)', 'intended', 'Active, D=1.5 s', benchDen(LINES.intended, HUMAN_SEEDS, { decisionMs: 1500, engine: { atbMode: 'active' } }));
    console.log(['| Link | Line | ATB | Wins | Avg ticks, or where the Den was lost |', '|---|---|---|---:|---|', ...rows].join('\n'));
  }, 600_000);
});
