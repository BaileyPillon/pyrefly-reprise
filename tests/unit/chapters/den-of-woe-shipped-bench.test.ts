/**
 * Chapter XV — the **shipped setting's** bench: Bailey's pick of 2026-09-26, "I pick your
 * recommendation for Den of Woe" = "Den: both, drop the prep" (`docs/plans/den-of-woe-options-2026-09-25.md`).
 * **FFX-2 only** [AGENTS.md rule 14]. Measure, never tune: no boss number is touched.
 *
 * Everything is read off the registered record (`FFX2_DEN_OF_WOE_SHIPPED`: its build, the kit the
 * switches give: 3 Hero Drinks and +8 levels, both `[estimate]`) and the switches (the Lightfall prep
 * off, a Hero Drink on Nooj), so the rows follow the chapter if a switch moves. The line is the
 * bench line those switches name (`LINES.noPrep` with `heroDrink`), which the shipped tactic plays
 * (`den-of-woe-ship-content.test.ts` runs them side by side). A loss retries from Baralai, as the
 * game does (`DEN_OF_WOE_RETRY_FROM_LINK` off).
 *
 * The table (200 seeds a row, about two minutes alone) runs with `PYREFLY_MEASURE=1`, like the
 * options bench; the sheet's "Bailey's pick" section copies it. A small check always runs.
 */

import { describe, expect, it } from 'vitest';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { driveDen, driveDenAttempts, LINES, type DriveOptions, type LineOptions } from '../helpers/denOfWoeDrive.ts';
import { FFX2_DEN_OF_WOE_SHIPPED } from '../../../src/data/chapter-den-of-woe-ship.ts';
import { DEN_OF_WOE_HERO_DRINKS } from '../../../src/data/ffx2/builds/den-of-woe.ts';
import { DEN_OF_WOE_RETRY_FROM_LINK } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { DEN_OF_WOE_LIGHTFALL_PREP } from '../../../src/data/guides/ffx2-den-of-woe.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = 200;
const KIT = FFX2_DEN_OF_WOE_SHIPPED.buildRef as FFX2PartyBuild;
const LINE: LineOptions = { ...(DEN_OF_WOE_LIGHTFALL_PREP ? LINES.intended : LINES.noPrep), heroDrink: DEN_OF_WOE_HERO_DRINKS > 0 };
const split = (ms: number, top: number): DriveOptions => ({ decisionMs: ms, topMs: top, engine: { atbMode: 'wait', waitSplit: true } });

/** First try, and cleared within 3 and 5 tries (retry from Baralai unless the switch says otherwise). */
function row(o: DriveOptions): { first: number; three: number; five: number; lostAt: number[] } {
  let first = 0;
  let three = 0;
  let five = 0;
  const lostAt = [0, 0, 0];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const run = driveDen(LINE, seed, { ...o, party: KIT });
    if (run.outcome === 'victory') first++;
    else lostAt[run.links.length - 1]! += 1;
    const a = driveDenAttempts(LINE, seed, 5, DEN_OF_WOE_RETRY_FROM_LINK, { ...o, party: KIT });
    if (a !== undefined && a <= 3) three++;
    if (a !== undefined && a <= 5) five++;
  }
  return { first, three, five, lostAt };
}

describe('Chapter XV as shipped: the record and the line its switches name', () => {
  it('reads the pick: the kit carries the drinks and the levels, the line drops the prep and drinks', () => {
    expect(KIT.members.map((m) => m.level)).toEqual([54, 56, 58]);
    expect(KIT.inventory.find((i) => i.itemId === 'x2-hero-drink')?.count).toBe(3);
    expect(LINE.lightfallPrep).toBe(false);
    expect(LINE.heroDrink).toBe(true);
    expect(DEN_OF_WOE_RETRY_FROM_LINK).toBe(false);
    // Bench speed, 12 seeds: the chapter is winnable (the table below measures it properly).
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) if (driveDen(LINE, seed, { party: KIT }).outcome === 'victory') wins++;
    expect(wins).toBeGreaterThan(0);
  }, 120_000);
});

describe.skipIf(!MEASURE)('Chapter XV as shipped, measured (200 seeds; PYREFLY_MEASURE=1)', () => {
  it('first try and within 3 / 5 at three human speeds (Wait split), bench speed and Active', () => {
    const rows: string[] = [];
    const out = new Map<string, ReturnType<typeof row>>();
    const cases: Array<[string, DriveOptions]> = [
      ['human, Wait split 1.0 s / 0.3 s', split(1000, 300)],
      ['human, Wait split 1.5 s / 0.5 s (the live default)', split(1500, 500)],
      ['human, Wait split 2.5 s / 0.8 s', split(2500, 800)],
      ['bench, D = 0', {}],
      ['Active, 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
    ];
    for (const [name, o] of cases) {
      const r = row(o);
      out.set(name, r);
      rows.push(`| ${name} | ${r.first} | ${r.three} / ${r.five} | Baralai ${r.lostAt[0]}, Gippal ${r.lostAt[1]}, Nooj ${r.lostAt[2]} |`);
    }
    console.log([
      '| Speed | First try (of 200) | Within 3 / 5, retry from Baralai | First try lost at |',
      '|---|---:|---|---|',
      ...rows,
    ].join('\n'));
    const live = out.get('human, Wait split 1.5 s / 0.5 s (the live default)')!;
    expect(live.first).toBeGreaterThan(0);
    expect(live.five).toBeGreaterThanOrEqual(live.three);
    expect(live.three).toBeGreaterThanOrEqual(live.first);
  }, 1_800_000);
});
