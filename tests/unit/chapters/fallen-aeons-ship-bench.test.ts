/**
 * Chapter XI — the **ship gate's** bench (2026-09-25): re-measure the intended line on the chapter
 * as registered, before its ship layer is built. **FFX-2 only** [AGENTS.md rule 14]: ATB, the Wait
 * split, dresspheres. Measure, never tune (`docs/plans/chapter-fallen-aeons-review.md` §9): no boss
 * number moves here; a low rate goes to Bailey with sourced player-side options.
 *
 * The model is the one the Trema benches use (`trema-shipped-bench.test.ts`): bench speed is zero
 * decision time; human speed is the live default, **Wait split**, 1.5 s a menu, 0.5 s of it on the
 * top-level list with the clock running and 1.0 s inside a submenu (held). Seeds: 200 at bench
 * speed; 40 at human speed (the brief), plus 200 on the chapter row for a tighter human figure.
 *
 * The rows follow the registered record (`FFX2_FALLEN_AEONS`: its build and first formation), and
 * the chapter row is one unbroken run of the Road (Shiva, Magus Sisters, Anima) through the Save
 * Sphere restore, no retry. The shipped flow retries at the lost link (FA3), so each link's own
 * rate is also printed; a link on its own equals its FA3 retry. The table is copied into
 * `docs/plans/fallen-aeons-bench.md`.
 */

import { describe, expect, it } from 'vitest';
import { driveChain, driveLink, LINES, type DriveOptions, type LineOptions } from '../helpers/fallenAeonsDrive.ts';
import { FALLEN_AEONS_CHAIN_ORDER, ROAD_ANIMA, ROAD_SHIVA, ROAD_SISTERS } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { FFX2_FALLEN_AEONS } from '../../../src/data/chapter-ffx2-fallen-aeons.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';

const SEEDS = 200;
const HUMAN_SEEDS = 40;
const HUMAN: DriveOptions = { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } };
/** The guide's habit line ("Pick a command at once. Until you do, the clock still runs."): a quicker top list. */
const HABIT: DriveOptions = { decisionMs: 1500, topMs: 250, engine: { atbMode: 'wait', waitSplit: true } };
const BENCH: DriveOptions = {};
const INTENDED = [LINES.shivaIntended, LINES.sistersDarknessDispel, LINES.animaIntended] as const;
const rows: string[] = [];

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number; lostAt: [number, number, number] }

const minutesOf = (ticks: number): number => ticks / 3000 / 60;

function chapter(opts: DriveOptions, seeds: number, lines: readonly [LineOptions, LineOptions, LineOptions] = INTENDED): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, lostAt: [0, 0, 0] };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = driveChain(lines, seed, opts);
    t.minutes += r.links.reduce((m, l) => m + minutesOf(l.ticks), 0);
    if (r.outcome === 'victory') t.wins += 1;
    else t.lostAt[r.links.length - 1]! += 1;
    if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

function link(id: string, line: LineOptions, opts: DriveOptions, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, lostAt: [0, 0, 0] };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = driveLink(id, line, seed, opts);
    t.minutes += minutesOf(r.ticks);
    if (r.outcome === 'victory') t.wins += 1;
    if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

const pct = (t: Tally): string => `${((100 * t.wins) / t.seeds).toFixed(1)} %`;

function row(what: string, line: string, mode: string, t: Tally, lost = ''): void {
  rows.push(`| ${what} | ${line} | ${mode} | ${t.wins}/${t.seeds} | ${pct(t)} | ${(t.minutes / t.seeds).toFixed(2)} | ${lost} |`);
}

const lostText = (t: Tally): string => `Shiva ${t.lostAt[0]}, Sisters ${t.lostAt[1]}, Anima ${t.lostAt[2]}`;

describe('Chapter XI ship gate: the intended line, bench and human Wait split', () => {
  const tallies = new Map<string, Tally>();

  it('the bench follows the registered record', () => {
    expect(FFX2_FALLEN_AEONS.buildRef).toBe(farplaneBuild);
    expect(FFX2_FALLEN_AEONS.enemyGroupRef.id).toBe(FALLEN_AEONS_CHAIN_ORDER[0]);
    expect(FALLEN_AEONS_CHAIN_ORDER).toEqual([ROAD_SHIVA, ROAD_SISTERS, ROAD_ANIMA]);
  });

  it('Chapter (Road 1-2-3, one run): bench 200, human Wait split 40 and 200', () => {
    const b = chapter(BENCH, SEEDS);
    const h40 = chapter(HUMAN, HUMAN_SEEDS);
    const h200 = chapter(HUMAN, SEEDS);
    tallies.set('chapter|bench', b);
    tallies.set('chapter|human40', h40);
    tallies.set('chapter|human200', h200);
    row('**Chapter (1-2-3), one run**', 'intended on each link', 'bench, D=0', b, lostText(b));
    row('**Chapter (1-2-3), one run**', 'intended on each link', 'human, Wait split 0.5 s top / 1.0 s held', h40, lostText(h40));
    row('**Chapter (1-2-3), one run**', 'intended on each link', 'human, Wait split, 200 seeds', h200, lostText(h200));
    expect(b.unfinished + h40.unfinished + h200.unfinished).toBe(0);
  }, 1_800_000);

  const links: Array<[string, string, string, LineOptions]> = [
    ['1 Shiva', ROAD_SHIVA, 'intended', LINES.shivaIntended],
    ['2 Sisters', ROAD_SISTERS, 'intended: Darkness x2 + Dispel + heals', LINES.sistersDarknessDispel],
    ['3 Anima', ROAD_ANIMA, 'intended', LINES.animaIntended],
  ];
  for (const [name, id, lineName, line] of links) {
    it(`${name} on its own (= its FA3 retry): bench 200, human 40`, () => {
      const b = link(id, line, BENCH, SEEDS);
      const h = link(id, line, HUMAN, HUMAN_SEEDS);
      tallies.set(`${name}|bench`, b);
      tallies.set(`${name}|human`, h);
      row(name, lineName, 'bench, D=0', b);
      row(name, lineName, 'human, Wait split', h);
      expect(b.unfinished + h.unfinished).toBe(0);
    }, 900_000);
  }

  it('the Sisters, the sourced alternatives now that FFX-2 magic never rolls (881d4548)', () => {
    const alts: Array<[string, LineOptions]> = [
      ['kill Mindy first by Drain + Dispel (wiki, GamerGuides: Mindy first)', LINES.sistersMindyFirstDrain],
      ['kill Cindy first by Drain + Dispel (Split_Infinity: Cindy first)', { ...LINES.sistersMindyFirstDrain, dk: { focus: 'cindy', via: 'drain' } }],
      ['kill Mindy first by Attack + Dispel', LINES.sistersMindyFirst],
      ['wrong: Darkness spam, no Dispel', LINES.sistersDarknessSpam],
    ];
    for (const [name, line] of alts) {
      const b = link(ROAD_SISTERS, line, BENCH, SEEDS);
      const h = link(ROAD_SISTERS, line, HUMAN, HUMAN_SEEDS);
      row('2 Sisters', name, 'bench, D=0', b);
      row('2 Sisters', name, 'human, Wait split', h);
      expect(b.unfinished + h.unfinished).toBe(0);
    }
  }, 1_800_000);

  it("the guide's habit line: a quicker top list (0.25 s) on the chapter and the Sisters, 40 seeds", () => {
    const c = chapter(HABIT, HUMAN_SEEDS);
    const s = link(ROAD_SISTERS, LINES.sistersDarknessDispel, HABIT, HUMAN_SEEDS);
    row('Chapter (1-2-3), one run', 'intended', 'human, Wait split 0.25 s top / 1.25 s held', c, lostText(c));
    row('2 Sisters', 'intended', 'human, Wait split 0.25 s top / 1.25 s held', s);
    expect(c.unfinished + s.unfinished).toBe(0);
  }, 900_000);

  it('measured options for Bailey (none built): action time, the preset at the top of its level band (200 seeds)', () => {
    // Action time: a SOURCED rule the engine breaks (src/battle/ffx2/action-time.ts, [verified: 2]); its
    // length is an unsourced [estimate]. Chapter XIII ships it at 3 s on its own formations only.
    // Levels: the preset's 46 / 48 / 50 are an [estimate] inside research §5's band (43-52); 52 is its top.
    const top: FFX2PartyBuild = { ...farplaneBuild, members: farplaneBuild.members.map((m) => ({ ...m, level: 52 })) as FFX2PartyBuild['members'] };
    const options: Array<[string, DriveOptions]> = [
      ['action time 1.5 s (engine option)', { engine: { actionTimeSeconds: 1.5 } }],
      ['action time 3 s (engine option)', { engine: { actionTimeSeconds: 3 } }],
      ['preset at Lv 52 / 52 / 52', { build: top }],
    ];
    for (const [name, o] of options) {
      const h: DriveOptions = { ...HUMAN, ...o, engine: { ...HUMAN.engine, ...o.engine } };
      const b = chapter(o, SEEDS);
      const c = chapter(h, SEEDS);
      const s = link(ROAD_SISTERS, LINES.sistersDarknessDispel, h, SEEDS);
      row('Chapter (1-2-3), one run', `intended; OPTION ${name}`, 'bench, D=0', b, lostText(b));
      row('Chapter (1-2-3), one run', `intended; OPTION ${name}`, 'human, Wait split', c, lostText(c));
      row('2 Sisters', `intended; OPTION ${name}`, 'human, Wait split', s);
      expect(b.unfinished + c.unfinished + s.unfinished).toBe(0);
    }
  }, 1_800_000);

  it('the chapter is winnable at both speeds', () => {
    expect(tallies.get('chapter|bench')?.wins).toBeGreaterThan(0);
    expect(tallies.get('chapter|human200')?.wins).toBeGreaterThan(0);
  });

  it('prints the table', () => {
    console.log(['| Fight | Line | Mode | Wins | Rate | Avg min | Lost at |', '|---|---|---|---:|---:|---:|---|', ...rows].join('\n'));
  });
});
