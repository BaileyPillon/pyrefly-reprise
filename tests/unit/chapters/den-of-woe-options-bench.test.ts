/**
 * Chapter XV — the options for Bailey, measured (`docs/plans/den-of-woe-options-2026-09-25.md`).
 * **FFX-2 only.** Measure, never tune: every row is a sourced player-side option or one of our own
 * lines; no boss number changes. The options are built OFF (`den-of-woe-options.test.ts`), so each
 * row passes the option in as numbers, exactly as the switch would.
 *
 * - **Kit:** the Chapter V preset (GP5 a, GP6 a, shipped), + 3 Hero Drinks (GP6 b), + 8 levels
 *   (GP5 b), or both. The count and the raise are `[estimate]`s.
 * - **Line:** the intended line with the Lightfall prep (the guide as shipped) or without it (M1).
 * - **Speed:** human, Wait split (the live default: 1.5 s a menu, 0.5 s of it on the top list),
 *   200 seeds; bench speed (D = 0) and Active at 1.5 s for reference.
 * - **Retries (GP4):** a player who tries again, up to 10 times: from Baralai (GP4 a, as built) or
 *   from the link lost (GP4 b, the `checkpointOnEntry` seam). The share cleared within 1, 3 and 5.
 *
 * The table takes about three minutes under the full suite's load, so it runs with
 * `PYREFLY_MEASURE=1` (the `ffx2-wait-split-measure.test.ts` precedent); a small check of the
 * harness always runs.
 */

import { describe, expect, it } from 'vitest';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { driveDen, driveDenAttempts, driveLink, LINES, type DriveOptions, type LineOptions } from '../helpers/denOfWoeDrive.ts';
import { DEN_NOOJ } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import {
  DEN_OF_WOE_HERO_DRINKS_OPTION, DEN_OF_WOE_LEVEL_BONUS_OPTION, denOfWoeBuild,
} from '../../../src/data/ffx2/builds/den-of-woe.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = 200;
const TRIES = 10;
const split: DriveOptions = { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } };
const active: DriveOptions = { decisionMs: 1500, engine: { atbMode: 'active' } };

const KITS: Array<[string, FFX2PartyBuild]> = [
  ['Chapter V kit (shipped)', denOfWoeBuild(0, 0)],
  ['+ 3 Hero Drinks (GP6 b)', denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS_OPTION, 0)],
  ['+ 8 levels (GP5 b)', denOfWoeBuild(0, DEN_OF_WOE_LEVEL_BONUS_OPTION)],
  ['both (GP5 b + GP6 b)', denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS_OPTION, DEN_OF_WOE_LEVEL_BONUS_OPTION)],
];

function lineFor(prep: boolean, party: FFX2PartyBuild): LineOptions {
  const drinks = party.inventory.some((i) => i.itemId === 'x2-hero-drink');
  return { ...(prep ? LINES.intended : LINES.noPrep), heroDrink: drinks };
}

function den(line: LineOptions, party: FFX2PartyBuild, o: DriveOptions): number {
  let wins = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (driveDen(line, seed, { ...o, party }).outcome === 'victory') wins++;
  return wins;
}

function nooj(line: LineOptions, party: FFX2PartyBuild): number {
  let wins = 0;
  for (let seed = 1; seed <= SEEDS; seed++) if (driveLink(DEN_NOOJ, line, seed, { ...split, party }).outcome === 'victory') wins++;
  return wins;
}

/** Cleared within 1, 3 and 5 tries, of {@link SEEDS} players. */
function within(line: LineOptions, party: FFX2PartyBuild, fromLink: boolean): [number, number, number] {
  const at: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) at.push(driveDenAttempts(line, seed, TRIES, fromLink, { ...split, party }) ?? Infinity);
  const n = (k: number): number => at.filter((a) => a <= k).length;
  return [n(1), n(3), n(5)];
}

describe.skipIf(!MEASURE)('Chapter XV options for Bailey (human speed, 200 seeds; PYREFLY_MEASURE=1)', () => {
  const table: string[] = [];
  const first = new Map<string, number>();

  for (const [kitName, party] of KITS) {
    for (const prep of [true, false]) {
      const name = `${kitName}, ${prep ? 'with the Lightfall prep' : 'no prep'}`;
      it(name, () => {
        const line = lineFor(prep, party);
        const human = den(line, party, split);
        const bench = den(line, party, {});
        const act = den(line, party, active);
        const fresh = nooj(line, party);
        const start = within(line, party, false);
        const link = within(line, party, true);
        first.set(name, human);
        table.push(
          `| ${name} | ${human} | ${bench} | ${act} | ${fresh} | ${start.join(' / ')} | ${link.join(' / ')} |`,
        );
        expect(start[0]).toBe(human); // the first try is the plain Den
        expect(link[0]).toBe(human);
      }, 600_000);
    }
  }

  it('what the options sheet claims', () => {
    const at = (kit: number, prep: boolean): number => first.get(`${KITS[kit]![0]}, ${prep ? 'with the Lightfall prep' : 'no prep'}`) ?? -1;
    // M1: on the shipped kit the prep costs wins at human speed; with both options on it pays.
    expect(at(0, false)).toBeGreaterThan(at(0, true));
    expect(at(3, true)).toBeGreaterThan(at(3, false));
    // Every option beats the shipped chapter, and both together beat either alone.
    for (const k of [1, 2, 3]) expect(Math.max(at(k, true), at(k, false))).toBeGreaterThan(at(0, true));
    expect(at(3, true)).toBeGreaterThan(Math.max(at(1, true), at(1, false), at(2, true), at(2, false)));
    console.log([
      '| Kit, line | Den, human Wait split (first try) | Den, bench | Den, Active 1.5 s | Nooj fresh, human | Within 1 / 3 / 5 tries, retry from Baralai (GP4 a) | Within 1 / 3 / 5 tries, retry from the lost link (GP4 b) |',
      '|---|---:|---:|---:|---:|---|---|',
      ...table,
    ].join('\n'));
  });
});

describe('the options harness (always runs)', () => {
  it('a retry reseeds and, from the lost shade, replays the entry state; the first try is the plain Den', () => {
    const party = KITS[3]![1];
    const line = lineFor(true, party);
    for (let seed = 1; seed <= 4; seed++) {
      const plain = driveDen(line, seed, { party }).outcome === 'victory';
      const fromStart = driveDenAttempts(line, seed, 1, false, { party });
      const fromLink = driveDenAttempts(line, seed, 1, true, { party });
      expect(fromStart === 1, `seed ${seed}`).toBe(plain);
      expect(fromLink === 1, `seed ${seed}`).toBe(plain);
    }
    // A player who lost the first try can still clear on a later one.
    const tries = Array.from({ length: 10 }, (_, i) => driveDenAttempts(line, i + 1, 5, true, { party }));
    expect(tries.some((t) => t !== undefined && t > 1), JSON.stringify(tries)).toBe(true);
  }, 120_000);
});
