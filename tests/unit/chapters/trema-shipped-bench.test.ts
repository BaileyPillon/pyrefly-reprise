/**
 * Chapter XIII — the **shipped setting's** bench: Bailey's "Trema: 1 and 3 at 3 s" (2026-09-25,
 * "I'll go with all your recommendations"): Oversoul Paragon, then the story Trema, with
 * Split_Infinity's kit and 3 s of action time on the Cloister links. **FFX-2 only** [AGENTS.md
 * rule 14]. Measure, never tune (`docs/plans/chapter-trema-review.md` §9).
 *
 * Everything is read off the registered record (`FFX2_TREMA`: its first formation, its build) and
 * the formations' own action time, so the rows follow the chapter if a switch moves. The line is
 * the kit's intended line (`LINES.kitIntended`). 200 seeds at bench speed (zero decision time) and
 * 200 at human speed under Wait split (1.5 s a menu: 0.5 s on the top-level list with the clock
 * running, 1.0 s held), the live default. The table is copied into `docs/plans/trema-bench.md`.
 */

import { describe, expect, it } from 'vitest';
import { driveChapter, driveParagon, driveTremaFresh, LINES, type DriveOptions, type LinkRun } from '../helpers/tremaDrive.ts';
import { FFX2_TREMA } from '../../../src/data/chapter-ffx2-trema.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';

const SEEDS = 200;
const WAIT_SPLIT = { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait' as const, waitSplit: true } };
const SHIPPED: DriveOptions = { build: FFX2_TREMA.buildRef as FFX2PartyBuild, paragonGroup: FFX2_TREMA.enemyGroupRef.id };
const rows: string[] = [];

interface Tally { wins: number; seeds: number; unfinished: number; reached: number; minutes: number; winMinutes: number; bigBang: number; finalImpact: number }
type Run = LinkRun | { outcome: string | undefined; links: LinkRun[] };

function bench(run: (seed: number) => Run, seeds = SEEDS): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, reached: 0, minutes: 0, winMinutes: 0, bigBang: 0, finalImpact: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = run(seed);
    const links = 'links' in r ? r.links : [r];
    const minutes = links.reduce((m, l) => m + l.minutes, 0);
    if (r.outcome === 'victory') { t.wins += 1; t.winMinutes += minutes; }
    if (r.outcome === undefined) t.unfinished += 1;
    if (links.length > 1) t.reached += 1;
    t.minutes += minutes;
    for (const l of links) {
      t.bigBang += l.count('paragon-big-bang');
      t.finalImpact += l.count('paragon-os-final-impact');
    }
  }
  return t;
}

function row(link: string, mode: string, t: Tally): void {
  const winMin = t.wins > 0 ? (t.winMinutes / t.wins).toFixed(1) : '—';
  const reached = link.startsWith('Chapter') ? `${t.reached}/${t.seeds}` : '—';
  rows.push(`| ${link} | ${mode} | ${t.wins}/${t.seeds} | ${(t.minutes / t.seeds).toFixed(2)} | ${winMin} | ${reached} | ${(t.bigBang / t.seeds).toFixed(2)} | ${(t.finalImpact / t.seeds).toFixed(2)} |`);
}

describe('Chapter XIII as shipped: Oversoul Paragon, Split_Infinity\'s kit, 3 s of action time', () => {
  const tallies = new Map<string, Tally>();
  const cases = [
    ['1 Oversoul Paragon', (o: DriveOptions) => (s: number) => driveParagon(LINES.kitIntended, s, o)],
    ['2 Trema (fresh)', (o: DriveOptions) => (s: number) => driveTremaFresh(LINES.kitIntended, s, o)],
    ['Chapter (1-2)', (o: DriveOptions) => (s: number) => driveChapter(LINES.kitIntended, s, o)],
  ] as const;

  for (const [link, run] of cases) {
    it(`${link}: bench (200) and human Wait split (200)`, () => {
      const b = bench(run(SHIPPED));
      const h = bench(run({ ...SHIPPED, ...WAIT_SPLIT }));
      tallies.set(`${link}|bench`, b);
      tallies.set(`${link}|human`, h);
      row(link, 'bench, D=0', b);
      row(link, 'human, Wait split 0.5 s top / 1.0 s held', h);
      expect(b.unfinished).toBe(0);
      expect(h.unfinished).toBe(0);
    }, 900_000);
  }

  it('the chapter is winnable at both speeds; the formations\' 3 s equals the engine option the options sheet measured', () => {
    expect(tallies.get('Chapter (1-2)|bench')?.wins).toBeGreaterThan(0);
    expect(tallies.get('Chapter (1-2)|human')?.wins).toBeGreaterThan(0);
    for (let seed = 1; seed <= 10; seed++) {
      const viaFormation = driveChapter(LINES.kitIntended, seed, SHIPPED);
      const viaEngine = driveChapter(LINES.kitIntended, seed, { ...SHIPPED, engine: { actionTimeSeconds: 3 } });
      expect(viaFormation.outcome).toBe(viaEngine.outcome);
      expect(JSON.stringify(viaFormation.links.map((l) => l.log))).toBe(JSON.stringify(viaEngine.links.map((l) => l.log)));
    }
  }, 300_000);

  it('prints the table', () => {
    console.log(['| Link | Mode | Wins | Avg min | Avg min (wins) | Reached Trema | Big Bang / fight | Final Impact / fight |',
      '|---|---|---:|---:|---:|---:|---:|---:|', ...rows].join('\n'));
  });
});
