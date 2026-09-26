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
 *
 * **Re-pinned a second time, for the Leg's drop id** (commit 697c0380,
 * 2026-09-23, `docs/handoff/fix-ffx2-vegnagun-facts.md`): the Vegnagun Leg's
 * `rewards.drops` id changed from the unresolved `x2-mythril-bangle` to the
 * accessory registry's own key `mythril-bangle`; `buildResult()` copies
 * `rewards.drops` verbatim into the link's `victory` event
 * (`src/battle/ffx2/results.ts`), so the id string is part of the logged event
 * and the hash. Measured before re-pinning, full event-by-event diff of chapter
 * 5 seeds 1 (D=0) and 2 (D=1500) against the pre-change engine: of 8,189 and
 * 14,832 events respectively, **exactly one event differs**, and only the
 * `drops[0].itemId` field inside it — same turn count, same tick and ms
 * totals, same ap/exp/gil, every other event byte-identical. Chapter 4 never
 * touches the Leg, so `CH4_D0` and `CH4_D1500` are unchanged (verified:
 * recomputed and diffed equal to the arrays below). The steal tables added to
 * the Head and Tail in the same commit are inert here — nothing under
 * `src/battle/ffx2` reads `rewards.steal` (only the FFX-1 engine and two
 * unrelated FFX-2 tactics files for Leblanc/Seymour do).
 *
 * **Re-pinned a third time, for combat-fixes-0924 (a)** (branch
 * `combat-fixes-0924`, 2026-09-24, `docs/plans/combat-fixes-0924-review.md`): a
 * magical action no longer rolls the §2.6 hit check (hard rule 5), so it no longer
 * draws from the seeded stream, and chapter 5's Nodes, Vegnagun, Shuyin and the
 * party's Black Sky used to. Measured before re-pinning:
 * under the old engine chapter 5 D=0 had evaded magic on 17 of 20 seeds and
 * D=1500 on 9 of 10; with the roll still drawn and only the miss ignored (a
 * throwaway probe, not shipped) exactly the seeds with **no** evaded magic
 * (D=0 seeds 3, 15, 18; D=1500 seed 4) were byte-identical to the old hashes,
 * so the only behaviour that moved is the magic miss. Chapter 4 casts no rolling
 * magic, so `CH4_D0` and `CH4_D1500` are unchanged (recomputed, equal). After:
 * zero evaded magic on every seed, D=0 still 20/20. The Active D=1500 arm moved
 * from 2/10 to 0/10 wins (it pins hashes, not outcomes; disclosed in the plan).
 *
 * **Re-pinned a fourth time, one hash, for the spherechange accessories fix**
 * (branch `chapter-trema-0925`, 2026-09-25, `docs/plans/trema-winnability-method-check.md`
 * E2, `src/battle/ffx2/spherechange.ts#refreshDerivedStats`): a girl keeps her accessories
 * through a spherechange (ffx2-combat-core §4.2, §5.4). Only `CH5_D1500` seed 3 moves: Yuna
 * changes White Mage to Gunner under Itchy and her next Poison tick is 102, not 51, because her
 * Crystal Bangle's max HP survives the change. Measured event by event against the pre-fix
 * engine: every event before that tick is identical, the outcome (a loss) is unchanged, and
 * every D=0 hash and every chapter 4 hash is unchanged (recomputed, equal).
 *
 * **Re-pinned a fifth time, the Active D = 1500 arm only, for "an enemy hit closes an open menu"**
 * (decision sheet 2026-09-25 item 4, A1; `research/ffx2-combat-core.md` §1.1, §1.5;
 * `docs/plans/ffx2-hit-closes-menu-review.md`). At 1.5 s under Active every seed has an enemy hit
 * land on an open menu, so all twenty `CH4_D1500` / `CH5_D1500` hashes move: 109 and 289 menus
 * closed over the ten seeds; chapter 4 still wins 10/10, chapter 5 0/10 as before. Every D = 0
 * hash is unchanged (no menu is ever open while the clock runs at zero decision time), and so is
 * the Wait arm below (the whole-menu hold lets no enemy act). FFX-2 only.
 *
 * **Re-pinned a sixth time, the chapter 5 arrays only, for IC-2 and Acta Est Fabula's target**
 * (branch `ffx2-engine-fixes-0926`, 2026-09-26, `docs/plans/ffx2-engine-fixes-2026-09-26.md`).
 * (1) An all-target action now hits each target taken at its start, and a target KO'd partway is
 * skipped rather than its hits wrapped onto someone already hit (`research/ffx2-combat-core.md`
 * §9.1). Measured against the old engine with a throwaway probe: every moved seed's first
 * differing event follows a KO inside an all-target action (a Bulwark dying to Black Sky, or a girl
 * dying to the Tail, a Node or the Leg); `CH5_D1500` seed 6 has none and did not move. (2) Acta Est
 * Fabula hits the two Redoubts it names, not the Head as well (§3.4 "both Redoubts";
 * `constants.ts` NAMED_TARGETS_ONLY): every D = 0 seed casts it 5-6 times, so all twenty move.
 * Outcomes: D = 0 still 20/20; the Active D = 1500 arm 0/10 -> 1/10 (seed 7). Chapter 4 never meets
 * either case: `CH4_D0` and `CH4_D1500` are unchanged (recomputed, equal).
 *
 * **Re-pinned a seventh time, the Active D = 1500 arrays only, for the menu-cancel correction**
 * (Bailey, 2026-09-26: "I'll take all your recommendations", answering "menu correction on (my
 * recommendation), or keep it as is"; `research/ffx2-combat-core.md` §9.2, Split_Infinity G1041 /
 * G1042; `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES now true). An open menu is closed only by
 * an enemy ability with a Delay effect or Action-cancel, not by every hit, which replaces the fifth
 * re-pin's rule (item 4 A1). At 1.5 s under Active every seed had a plain hit close a menu, so all
 * twenty `CH4_D1500` / `CH5_D1500` hashes move: menus the clock closed over the ten seeds fall from
 * 109 to 4 in chapter 4 (Bahamut carries no Delay ability, so what is left is a status or a KO, each
 * closing a menu on its own rule) and from 300 to 56 in chapter 5 (the same, plus the Leg's Vita
 * Brevis, a strong Delay). Outcomes: chapter 4 still
 * 10/10; chapter 5 1/10 -> 4/10. The engine option `menuCancelOnlyDelayAbilities: false` still
 * replays the fifth/sixth pins byte for byte (recomputed, equal; `ffx2-menu-cancel-delay.test.ts`
 * pins that). Every D = 0 hash and the Wait arm are unchanged (no clock runs under a menu there).
 * The old hashes are in git at 63767b5b. FFX-2 only.
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

/** Re-pinned for IC-2 + Acta Est Fabula's target (2026-09-26); the old hashes are in git at ea05f877. */
const CH5_D0 = [
  '7a91c483c3dd8d2c', '054c5f01b9f23ffe', '678d9b991119fa5a', '06f41fb4fb006fbf', '1a487e798a11a864',
  'a41b99982fd20f8c', '0c1cbbc0c51f3dcb', '417742a6b0ae62b6', '818b87ecca6cc80b', 'ea6dac586568298a',
  'febe9b943707b3e0', '17cd9bd9e06b9f6d', '9fd978ff17bd934d', 'fa5d938948bf4897', '49d34f2f14d4ff64',
  '3308bf9c4da70848', '1404aa309330d2e2', 'f43e5c95eba9b8b8', 'bcb5f17ee39f6771', '2499f5d1a03632af',
];

/** Re-pinned for the menu-cancel correction (only a Delay / Action-cancel hit closes a menu, 2026-09-26); the old hashes are in git at 63767b5b. */
const CH4_D1500 = [
  'f7184d7b87948e2c', 'e162970a86a2268f', 'fc6c4f4b8b7cb240', '7f9abbf856f2464a', '4439b76d4c54cc7d',
  '51f22c7af66239a8', 'd73d41236dc23eb0', '042fd279eda61cb1', '82058d0ebeeadaeb', '4ec0c1f9c35887d7',
];
/** Re-pinned for the menu-cancel correction (2026-09-26); the old hashes are in git at 63767b5b. */
const CH5_D1500 = [
  '6be1a4346ecdd543', 'd87ae9b34cf3f68c', '0f23aa5c24c2e101', '845dee0fe14e44bf', 'f61a6a28d122fb1b',
  'abeeba939da2c5ea', 'c4b8430493fbd119', '5ce39e1ce17df9f6', '350f1f16efbdba4d', 'c1e9f4bdf61704ec',
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
