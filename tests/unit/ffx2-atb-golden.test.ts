/**
 * **Golden: nothing that already plays moved.** FFX-2 only.
 *
 * `docs/plans/ffx2-active-menu-review.md` §5 I5 and §6. The hashes below were
 * recorded on the engine **before** the `ffx2-active-menu` track touched it
 * (main 8e1192a, 2026-09-22): sha256 of every link's full event log, first 16
 * hex, for chapter 4 (`ffx2-bahamut`) and the whole chapter 5 chain, seeds 1-20,
 * driven through the shipped `intendedStrategy` with zero decision time — the
 * auto-battler's own behaviour, which is what every replay, e2e run and critic
 * capture uses.
 *
 * Two changes must leave them exact:
 * - the chain-lock hold and the menu-owner rule (a `D = 0` run never has an
 *   owner chained under an open menu, so neither path is reachable);
 * - the Config ATB speed lever at **Normal**, explicit or omitted (every new
 *   multiply and divide is by exactly 1).
 *
 * The `D = 1500` arm was recorded after the two fixes and before the lever, so
 * it proves the lever's Normal is byte-identical on the Active path too.
 *
 * **Re-pinned once, deliberately, for PR-0075** (release-09 repair, 2026-09-22,
 * `docs/plans/ffx2-item-accuracy-review.md`): a heal or item on the party's own
 * side no longer rolls the §2.6 hit check, so it no longer draws from the seeded
 * stream and every seed that cast one moved. Measured before re-pinning: under the
 * old engine chapter 4 D=0 had friendly misses on 9 of 20 seeds, chapter
 * 5 D=0 on 18 of 20; with the roll still drawn (a throwaway probe, not shipped)
 * the 11 chapter 4 seeds that had none were byte-identical to the old hashes, so the
 * only behaviour that moved is the friendly miss. After: zero friendly "evaded"
 * misses on every seed, and D=0 is still 20/20 in both chapters.
 */

import { describe, expect, it } from 'vitest';
import { driveChapter4, driveChapter5, logHash } from './helpers/ffx2ChapterDrive.ts';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Re-pinned for PR-0075; the pre-change hashes are in git at 1b33971..17b9af2. */
const CH4_D0 = [
  '373c0af61dfb8aae', 'd0e49a7271c07e2b', '802486af811c9d6b', '03f91919f6b18a3e', '0a14b85f9f522050',
  '339cceeb08ad7f45', 'f6620aa81bc8d4f6', '8b0f606610090fc9', '79f0c871706a29dd', 'ff518ae4bb362478',
  'eba26c1a60ecedd5', '5ea5c660f8a30976', 'cb37596cb51386b6', '285c0ec16b43af5a', '3cfd436b50ba4f07',
  '6a153f98a05af5cf', '5764b43c5c6b9c94', '2649ce030cbd66bc', 'de6d7169d7f08905', '7b311b79d378648d',
];

const CH5_D0 = [
  '5768c4da29cbb005', '2f6305d343ecd04f', '46b939d92205b0b1', 'af3aa760d6e49334', '566d0a98889bb960',
  '3700fb016dec7c9b', 'dcffb12d092df765', 'b4070d9b40804b9f', '4215441079bc40dc', '6e62a395c64379ee',
  'bad3d03e95722e68', 'cdfb2d39c051377d', '3aecc54139a8de33', '39546243805f0060', '9e8dbe70a76ab325',
  '1341bcb1f1a2621c', '27020425d0dd3e92', '6eb7c2c7f1d16e49', 'dcf3a9e1589b6764', 'ba2a6f8c33e7cfbf',
];

/** Recorded after the hold / owner fixes (commit 1 of the track), before the speed lever. */
const CH4_D1500 = [
  'f7184d7b87948e2c', 'e162970a86a2268f', 'fc6c4f4b8b7cb240', '7f9abbf856f2464a', '4439b76d4c54cc7d',
  '51f22c7af66239a8', 'd73d41236dc23eb0', '042fd279eda61cb1', '82058d0ebeeadaeb', '4ec0c1f9c35887d7',
];
const CH5_D1500 = [
  'd9f15a6ad10a199f', '05ba836179afcebd', '4827ebd15aab9ddf', 'a70c9fdcaf9da8e1', 'bc1d1062c3d93496',
  'bf11cdedc00e8d23', 'ff37f688300a472b', 'b70e3e0f01592f0c', '924faf301d1e8f50', '6c49eb62069b6105',
];
const SEEDS_10 = SEEDS.slice(0, 10);

describe('FFX-2 golden event logs on the Active path (D = 1500 ms)', () => {
  it('chapter 4 and the chapter 5 chain, seeds 1-10, are byte-identical', () => {
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500)))).toEqual(CH5_D1500);
  }, 120_000);
});

describe('FFX-2 golden event logs at zero decision time (D = 0)', () => {
  it('chapter 4, seeds 1-20, is byte-identical to the pre-change engine and still 20/20', () => {
    const runs = SEEDS.map((s) => driveChapter4(s, 0));
    expect(runs.map(logHash)).toEqual(CH4_D0);
    expect(runs.every((r) => r.outcome === 'victory')).toBe(true);
  }, 120_000);

  it('the whole chapter 5 chain, seeds 1-20, is byte-identical and still 20/20', () => {
    const runs = SEEDS.map((s) => driveChapter5(s, 0));
    expect(runs.map(logHash)).toEqual(CH5_D0);
    expect(runs.every((r) => r.outcome === 'victory')).toBe(true);
  }, 120_000);
});

describe('the Config ATB speed lever at Normal changes nothing (§1.2)', () => {
  it('explicit atbSpeed: "normal" reproduces every golden, D = 0 and D = 1500', () => {
    const normal = { atbSpeed: 'normal' as const };
    expect(SEEDS.map((s) => logHash(driveChapter4(s, 0, normal)))).toEqual(CH4_D0);
    expect(SEEDS.map((s) => logHash(driveChapter5(s, 0, normal)))).toEqual(CH5_D0);
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500, normal)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500, normal)))).toEqual(CH5_D1500);
  }, 180_000);
});

/**
 * **Wait mode** (D-029, 2026-09-22; `docs/plans/ffx2-wait-mode-review.md` §5 I3/I4).
 *
 * Under Wait the clock does not move while a menu is open, so a human who reads
 * every menu for 1.5 s plays **exactly** the auto-battler's fight: the `D = 1500`
 * Wait arm must reproduce the `D = 0` golden byte for byte, and win 20/20.
 * And the mode is a runtime switch: an engine built in Wait and told Active
 * before its first decision must reproduce the Active `D = 1500` golden.
 */
describe('FFX-2 golden event logs under Wait mode (D-029)', () => {
  it('D = 1500 under Wait is byte-identical to D = 0, chapters 4 and 5, seeds 1-20, 20/20', () => {
    const wait = { atbMode: 'wait' as const };
    const ch4 = SEEDS.map((s) => driveChapter4(s, 1500, wait));
    const ch5 = SEEDS.map((s) => driveChapter5(s, 1500, wait));
    expect(ch4.map(logHash)).toEqual(CH4_D0);
    expect(ch5.map(logHash)).toEqual(CH5_D0);
    expect([...ch4, ...ch5].every((r) => r.outcome === 'victory')).toBe(true);
    expect([...ch4, ...ch5].every((r) => r.invalidated === 0 && r.held === 0 && r.refused === 0)).toBe(true);
  }, 180_000);

  it('a Wait engine switched to Active at runtime reproduces the Active D = 1500 golden', () => {
    const wait = { atbMode: 'wait' as const };
    const toActive = (e: { setAtbMode(m: 'active'): void }) => e.setAtbMode('active');
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500, wait, toActive)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500, wait, toActive)))).toEqual(CH5_D1500);
  }, 120_000);
});
