/**
 * Chapter XV — the options for Bailey, measured (`docs/plans/den-of-woe-options-2026-09-25.md`).
 * **FFX-2 only.** Measure, never tune: every row is a sourced player-side option or one of our own
 * lines; no boss number changes. Each row passes the option in as numbers, exactly as the switch
 * would, so the table stays the same after Bailey's pick of 2026-09-26 ("Den: both, drop the prep":
 * the "both, no prep" row is the chapter as shipped, `den-of-woe-shipped-bench.test.ts`).
 *
 * - **Kit:** the Chapter V preset (GP5 a, GP6 a), + 3 Hero Drinks (GP6 b), + 8 levels (GP5 b), or
 *   both (shipped since 2026-09-26). The count and the raise are `[estimate]`s.
 * - **Line:** the intended line with the Lightfall prep (the sources' advice) or without it (M1,
 *   shipped since 2026-09-26).
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
  ['Chapter V kit', denOfWoeBuild(0, 0)],
  ['+ 3 Hero Drinks (GP6 b)', denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS_OPTION, 0)],
  ['+ 8 levels (GP5 b)', denOfWoeBuild(0, DEN_OF_WOE_LEVEL_BONUS_OPTION)],
  ['both (GP5 b + GP6 b, shipped)', denOfWoeBuild(DEN_OF_WOE_HERO_DRINKS_OPTION, DEN_OF_WOE_LEVEL_BONUS_OPTION)],
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
    // Re-parity W4 (FFX-2 only; reason "game-code parity", `docs/handoff/re-parity-w4.md`): the sheet's four ranking claims (no prep beats
    // prep on the shipped kit; prep edges ahead with both options; every option beats the chapter as first shipped; both together beat either
    // alone) were true at the old gauge, where the Den was a 47 percent fight. At the game's gauge the Den is won 72 to 100 times of 100 in every
    // cell (the Chapter V kit with the prep is the only one under 90; the handoff has the 100-seed table), no prep is still the better line on
    // the Chapter V kit (96 against 72), and the strict comparisons that fell are the saturated ones: the shipped kit with the prep 198 against
    // 200 without it. The table is the measurement and it is printed; the claims are recorded in the handoff, not asserted.
    console.log([
      '| Kit, line | Den, human Wait split (first try) | Den, bench | Den, Active 1.5 s | Nooj fresh, human | Within 1 / 3 / 5 tries, retry from Baralai (GP4 a) | Within 1 / 3 / 5 tries, retry from the lost link (GP4 b) |',
      '|---|---:|---:|---:|---:|---|---|',
      ...table,
    ].join('\n'));
  });
});

/**
 * M1 re-put (repair 2): is the Lightfall prep worth teaching? The human model's speed is our own
 * guess, so the verdict must hold across it. First try at three menu speeds on every kit, and within
 * five tries (retry from Baralai) under both kit options. The measured lean is **no prep**: the prep
 * wins only at the sheet's 1.5 s point on the first try with both options on.
 */
const SPEEDS: Array<[number, number]> = [[1000, 300], [1500, 500], [2500, 800]];

describe.skipIf(!MEASURE)('Chapter XV, the Lightfall prep across human speeds (PYREFLY_MEASURE=1)', () => {
  it('the Lightfall prep across human speeds, recorded (no ranking asserted since re-parity W4)', () => {
    const rows: string[] = [];
    const firstTry = new Map<string, number>();
    const five = new Map<string, number>();
    for (const [ms, top] of SPEEDS) {
      const o: DriveOptions = { decisionMs: ms, topMs: top, engine: { atbMode: 'wait', waitSplit: true } };
      for (const [k, [kitName, party]] of KITS.entries()) {
        const cells: string[] = [];
        for (const prep of [true, false]) {
          const line = lineFor(prep, party);
          const w = den(line, party, o);
          firstTry.set(`${ms}|${k}|${prep}`, w);
          let cell = String(w);
          if (k === 3) {
            let n = 0;
            for (let seed = 1; seed <= SEEDS; seed++) {
              const a = driveDenAttempts(line, seed, 5, false, { ...o, party });
              if (a !== undefined && a <= 5) n++;
            }
            five.set(`${ms}|${prep}`, n);
            cell += ` (${n} within 5)`;
          }
          cells.push(cell);
        }
        rows.push(`| ${ms / 1000} s / ${top / 1000} s | ${kitName} | ${cells.join(' | ')} |`);
      }
    }
    // Re-parity W4 (FFX-2 only; reason "game-code parity", `docs/handoff/re-parity-w4.md`): the five ranking claims this test asserted (no prep wins at
    // every speed on three kits; no prep wins the first try at 1.0 s and 2.5 s with both options; within five tries; 'both' is the best kit at every
    // speed) described a Den that was a 47 percent fight. At the game's gauge most cells sit at 90 to 100 of 100 and differ by noise, and the
    // first strict comparison to fail was `1.0 s, + 3 Hero Drinks: 192 against 194` of 200. The table is the measurement; it is printed and no ranking is asserted.
    void firstTry;
    void five;
    console.log(['| Menu / top list | Kit | Prep | No prep |', '|---|---|---:|---:|', ...rows].join('\n'));
  }, 1_800_000);
});

describe('the options harness (always runs)', () => {
  it('a retry reseeds and, from the lost shade, replays the entry state; the first try is the plain Den', () => {
    // Re-parity W4 (FFX-2 only; reason "game-code parity"): the harness check used the shipped kit (Hero Drinks and +8 levels), which at the
    // game's gauge clears the Den on the first try on every seed (30 of 30 measured); the Chapter V kit still loses a first try now and then
    // (seeds 4, 6, 26 and 30 of the first 30 with the prep), so it can show that a later try clears.
    const party = KITS[0]![1];
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
