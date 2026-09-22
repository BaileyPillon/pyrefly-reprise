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
 */

import { describe, expect, it } from 'vitest';
import { driveChapter4, driveChapter5, logHash } from './helpers/ffx2ChapterDrive.ts';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

const CH4_D0 = [
  'da60312fcfd5dd34', '49631c5ab73bb999', 'aa98a8b91473173c', '00501f71ba0fec85', 'bc74cd09f10e3989',
  '2d6a709bac4e2841', '4abf94a65599f526', '63d2e77ee6513bcb', '2fd720d96b588cc7', 'ae9686e5b40d2477',
  '82058e15734bf3c7', '94d86e4f782ba6d6', '041ebe7b057109db', '24486a61891d4a61', '35a70dcaa68546bb',
  '53fc3143e34beef1', '6ef3abe613f40b44', 'a5099ce117a53bd3', '7a27abedd94a3110', '5d3940e303878382',
];

const CH5_D0 = [
  '18db4630271a090b', '0f4613c2e552653f', 'b608db6269308b8e', 'ce45ac053cc840f7', 'e352d9dae3d136e2',
  'c031edf4e7a0fe95', '47d57d153956efdd', '9a2db3c673d249bf', 'd8b00268931c04e6', '2464db761e35c766',
  'da6ebec53da04b6e', '7f5b674c77f0d2e4', 'e14867b1bc20ce58', '133db53ca6df211f', 'c960c031ad7e7c81',
  '3221072cddc06a90', '440f071746152753', '7cb297a9381a453e', '6376ea66c11e3e16', '178c255400acc69f',
];

/** Recorded after the hold / owner fixes (commit 1 of the track), before the speed lever. */
const CH4_D1500 = [
  '06d856cf21831cf0', '86001f282dfa2689', '31a3789b74514b8c', '510a919fab2b367d', '95b6f16c5e729580',
  '7c906d485fc5a1d1', 'cf8de5edec0227a7', '0518033afe081629', '089eadef2333d9a7', '9b50e029dc8e56a4',
];
const CH5_D1500 = [
  'db47b08ec7552d18', '60c1ea16ee79bdda', '3fbda8613f79ec20', 'f4239bde7b5c4b5f', '9306d2c88015fcb0',
  'a5a099ab3072543c', '1eefe146b62be4d2', '015b2f7867a9984b', 'b667e6545822e445', 'c8e9c53cf33cb1ab',
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
