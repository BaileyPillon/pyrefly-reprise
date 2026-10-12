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
 *
 * **Re-pinned an eighth time, every array, for re-parity W3** (branch `re-parity`, 2026-10-09, FFX-2 only, reason "game-code parity";
 * `docs/handoff/re-parity-w3.md`). The engine now rolls every hit, critical hit, damage number, status and theft through the kernels
 * proven against FFX-2.exe, on the game's own command rows and monster rows, in the game's draw order (every target's hit roll first,
 * then per strike the variance, the critical roll, the status rolls, the theft rolls), so every seeded replay is a different replay and
 * all sixty hashes moved. Outcomes: chapter 4 D = 0 is still 20/20 and the Active D = 1500 arm still 10/10; chapter 5 D = 0 is still
 * 20/20 and its Active D = 1500 arm is 2/10 (seeds 4 and 7; it was 4/10). The Wait arm still equals the D = 0 arrays and the Wait
 * engine switched to Active still equals the Active arrays (both asserted below). The old hashes are in git at 029d49c7.
 *
 * **Re-pinned a ninth time, the Chapter 4 arrays only, for Mega Flare at the game's power 14** (release candidate 1, 2026-10-09, FFX-2
 * only, reason "game-code parity"; Bailey: "Use 14 from the files", `research/re-ffx2-commands.md` section 5). The ability, the engine
 * table's record and the data record carried the authored 24 over the game's row (0x409c) and now carry the row's 14. All twenty
 * `CH4_D0` and all ten `CH4_D1500` hashes move; **every `CH5_D0` and `CH5_D1500` hash is unchanged** (recomputed, equal), and so is
 * every Chapter 6 hash. Cause, found by diffing the full event logs of the twenty D = 0 seeds with the 24 and the 14 (the 24 put back
 * for the run): in every seed the first event that differs is Bahamut's first Mega Flare damage event, and only its `amount` differs
 * (42 to 47 on a girl under Shell before, 14 to 16 after); every event before it, and the random stream up to it, is identical. (Event
 * payloads hold the engine's live status instances, so an early `status-add` of a Shell shows a different `ticksRemaining` at the end of
 * the run: that is the later divergence showing through, not an earlier one.) Outcomes: D = 0 still 20/20 and the Active D = 1500 arm
 * still 10/10. The old hashes are in git at 3663cd3a. The same Chapter 4 rows moved in `ffx2-hit-closes-menu.test.ts` and
 * `ffx2-menu-cancel-delay.test.ts`.
 *
 * **Re-pinned once for the merged state of release candidate 3** (branch re-parity-rc3, 2026-10-11, FFX-2 only; reasons "game-code parity" and "game-script parity"; docs/handoff/re-parity-rc3.md): re-parity W4's logic-step engine, gauges and status clocks and the three boss-AI lanes (a: Bahamut, the Vegnagun chain, Shuyin; b: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul, Trema; c: the Leblanc Syndicate, the Den of Woe, Ixion) are in one tree, with the AI lanes' timer rows put on the logic-step clock (Bahamut's countdown is 750 steps, a voice poll recovers by the speak command's 60 instead of 70, the Vegnagun Head's Agility 110 is rolled into its first gauge, the Oversoul idles 1,201 steps, the Redoubts and the Head wait for the fall they are waiting for and are polled on the next step). Each branch had re-pinned these for itself; this is the one pin of the merged tree. Every one of the sixty hashes moved, against the live build (39.4.4, the first differing event of every seed is the opening: W4's gauge rolls
 * the first waits on the game's draws, see the tenth re-pin below) and against W4 alone. Against W4 alone the first differing event is: Chapter 4, Bahamut's
 * very first action, the Curse's girl (lane a, rows B1 and B5: the near-weighted search draws one 31-bit value where the engine drew a float), on 14 of the 20
 * D = 0 seeds and 8 of the 10 Active seeds, and on the others a later chain break or miss that follows from the same draw (seeds 5, 12, 14, 15, 19 and 6 at D = 0);
 * Chapter 5, the Tail's first turn comes 9 steps earlier on 13 of 20 seeds (RC3: its opening voice poll is the speak command, ATB cost 60, not the standard 70) and
 * the other seven differ a few events on, in who acts first after it; later in the chain the Redoubts of link 4 are polled on the step after their twin falls (row R4),
 * which moves the Chapter 5 chain's tail on every D = 0 seed and on five of the ten Active seeds (the pins before that edit, 382108ec, differ only there). Outcomes: Chapter 4 D = 0 20/20 and the Active arm 10/10, as under W4 and on the live build;
 * Chapter 5 D = 0 20/20 (it was 14/20 under lane a alone on the old clock, 20/20 under W4 and on the live build), and its Active arm is **5/10** (6/10 under W4
 * alone, 1/10 under lane a alone on the old clock, 2/10 on the live build): the Head's Agility, the Nodes' starting colours and the Core's answers are the game's
 * (lane a), and the menus now cost the girls the game's real waiting times (W4); measured, not tuned (docs/handoff/re-parity-rc3.md, 500 seeds of the shipped line).
 * The Wait arm still equals the D = 0 arrays and a Wait engine switched to Active still equals the Active arrays (both asserted below).
 * **Re-pinned a tenth time, every array, for re-parity W4** (branch `re-parity`, 2026-10-10, FFX-2 only, reason "game-code parity";
 * `docs/handoff/re-parity-w4.md`). The engine clock is now the game's logic step (29.97 a second, measured on Bailey's running game
 * on 2026-10-09) and every gauge is the game's own counter: a command leaves `cost_atb x 10000 / (AGI + 1)` (a spell 0), a cast counts
 * down `cost_cast x 10000 / (AGI + 1)` at the full tick, the opening is `((draw & 63) + 32) x full / 128` with the two-thirds trim,
 * monsters think, a hit of the ATB class pushes a gauge back, and the status clocks are the game's counters of 1,500 and timers of
 * 150,000 units. Every seeded replay is a different replay, so all sixty hashes moved. Outcomes: chapter 4 D = 0 still 20/20 and the
 * Active D = 1500 arm still 10/10; chapter 5 D = 0 still 20/20 and its Active D = 1500 arm is **6/10** (it was 2/10 after W3, 4/10
 * before it): the same menus now cost the girls the game's real waiting times, so a human who takes 1.5 s a menu is no longer behind
 * a boss whose casts were far too fast; measured, not tuned (seeds 1 to 10, `docs/handoff/re-parity-w4.md`). The turns are handed out in
 * the game's ready-list order too (lowest recovery counter first), which is why this is 6 and not the 8 an earlier build of the same
 * gauges gave. The Wait arm still equals
 * the D = 0 arrays (20/20 in both chapters, no menu invalidated, held or refused) and the Wait engine switched to Active still equals
 * the Active arrays (both asserted below). The old hashes are in git at 931613a8. The same rows moved in
 * `ffx2-hit-closes-menu.test.ts`, `ffx2-menu-cancel-delay.test.ts` and `chapters/den-of-woe-carry.test.ts`.
 * **Re-pinned a tenth time, every array, for the boss AI of Chapters IV and V** (re-parity AI lane FFX-2 a, branch `re-parity-ai-ffx2-a`, 2026-10-10,
 * FFX-2 only, reason "game-script parity"; `docs/handoff/re-parity-ai-ffx2-a.md`). Bahamut, the Vegnagun chain and Shuyin now follow the game's own scripts
 * (`research/re-ffx2-ai-bahamut-vegnagun.md` section 10), so every one of the sixty digests moved. Cause, found by fingerprinting the full event log of every
 * seed before (the base commit's sources put back for the run) and after and comparing the logs event by event (the table is in the handoff). Chapter 4: on 22 of
 * the 30 seeds (D = 0 seeds 1-4, 7-11, 13, 16-18 and 20; Active seeds 1-4 and 7-10) the first difference is Bahamut's very first action, the Curse's girl (now picked by the
 * near-weighted search, one 31-bit draw, where the engine's pick was one float draw); on the other 8 the Curse lands on the same girl by chance and the first difference
 * is the aim of a later Bahamut Attack (D = 0 seeds 5, 6, 12, 14, 15 and 19; Active seeds 5 and 6). (On those a status event's payload, a live status object,
 * already differs earlier in the hash: that is the later divergence showing through, as in the ninth re-pin.) Chapter 5: every seed differs inside the Tail's link
 * and nowhere earlier, either at the first Tail Beam's aim (near-weighted now; D = 0 seeds 1, 4, 8, 11-14, 17, 19; Active seeds 1, 2, 4-9) or at the next damage
 * roll after the Tail's opening sweep, because that sweep runs a target search the script throws away, which draws once and moves every later roll one draw (D = 0 seeds
 * 2, 3, 5-7, 9, 10, 15, 16, 18, 20; Active seeds 3 and 10). Outcomes: Chapter 4 is
 * still 20/20 at D = 0 and 10/10 on the Active arm; Chapter 5 at D = 0 is 14/20 (it was 20/20; the losses are seeds 2, 3, 4, 5, 14 and 20) and its Active arm is
 * 1/10 (seed 5; it was 2/10), which is the chain getting harder, measured and disclosed in the handoff (500 seeds of the shipped line: 430 to 323), not tuned. The
 * Wait arm still equals the D = 0 arrays and the Wait engine switched to Active still equals the Active arrays (both asserted below). The old hashes are in git at 931613a8.
 * **Re-pinned an eleventh time, every array, for the game's own random streams** (re-parity RNG lane, branch re-parity-rng, 2026-10-11, FFX-2 only; reason "game RNG streams (Bailey 2026-10-09)": FFX-2 draws from its own 68 streams, every seed is another deal of the same odds, and nothing else moved (docs/handoff/re-parity-rng.md). The old hashes are in git at 0c729fa5. Every hit, critical, variance, status, theft, opening-gauge and target-search draw moves to the stream the game gives it (a girl's own stream is slot + 20, a monster's slot + 13, plus 16 for the hit roll and 32 for status rolls; 5 for a random-target pick, 10 and 11 for theft, 2 and 4 for the scripts), so every one of the sixty digests moved. The outcomes did not: Chapter 4 is still 20/20 at D = 0 and Chapter 5 still 20/20 (CH5_D0_OUTCOMES is unchanged). Nothing on the bosses or the party was tuned.
 */

import { describe, expect, it } from 'vitest';
import { driveChapter4, driveChapter5, logHash } from './helpers/ffx2ChapterDrive.ts';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Re-pinned for PR-0075; the pre-change hashes are in git at 1b33971..17b9af2. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for Mega Flare at the game's power 14 (2026-10-09, see the ninth re-pin above); the old hashes are in git at 3663cd3a. Re-pinned a fourth time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH4_D0 = [
  '08332b98dd23c13e', 'b320e520bf125d9c', '3b1bae27af9363c1', '4f8c87800a532af0', 'fcbc982c603fae64',
  '300c16a2498a6a36', '8c994ac8e401a081', '487ad2569fc675f6', 'a183074c99b62dbc', '97e281a62a4e83d2',
  '9a76d41f653670d3', '3a77e68afe04fe8f', '9fa897d1235af985', 'cc0fbb7c4962d455', '267f7d8428d4de22',
  '47851e5ebdac808e', '58daa1fb3c29507c', '953ebac39bcdf582', 'f30620e6ee91ce1a', '01470faf3fb827ec',
];

/** Re-pinned for IC-2 + Acta Est Fabula's target (2026-09-26); the old hashes are in git at ea05f877. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH5_D0 = [
  '14c489f0278792bb', '24d443bbb861aaa6', '833dda720297db2e', '92f34919fb6d8fcc', '2b5cfff69fa679a1',
  '7a2a583e90ef2080', '15f003b141b6a6f3', 'f73910bcb4c31588', '056a29c9f64475e6', 'ea11e6bc57472033',
  '05af170bce70e2d5', '74a919cdaf0a8ad6', 'f780f0894a0abad4', '1364bcf4301efff4', '6a307cb2f5a5ac7c',
  '8cb28183509bba6e', '462f552cd4c79127', '5f977e99eddd8cf7', 'a2cde3f49733da1a', 'acec700595ac3f00',
];

/** Re-pinned for the menu-cancel correction (only a Delay / Action-cancel hit closes a menu, 2026-09-26); the old hashes are in git at 63767b5b. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for Mega Flare at the game's power 14 (2026-10-09, see the ninth re-pin above); the old hashes are in git at 3663cd3a. Re-pinned a fourth time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH4_D1500 = [
  '9318b354f5ca9274', 'c325078b03484e03', '05f9575c5edc6a2d', '5ca4f2ee4ae9edfd', '0af57a98ab480cbe',
  'b75b69c690bc619e', 'e098f02143c771f7', 'e30ae9d24e21bed9', 'd72bd8136f4aecf1', 'dcb5dfd472e93c13',
];
/** Re-pinned for the menu-cancel correction (2026-09-26); the old hashes are in git at 63767b5b. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH5_D1500 = [
  'db1e80d7abded255', '128eb3693b451727', 'b75aa5e2ee54da92', 'ad3bd0a96b7a2b1a', '6fa8a633acc41166',
  '8e0c8849569198c2', '1ca8f3c131542b5d', 'd3f5e401c53a86e5', '966da767eeda3cec', '64742449853c3c75',
];
const SEEDS_10 = SEEDS.slice(0, 10);
/** One letter a seed, W a won chain and d a defeat (every seed wins at D = 0 on the live build, under W4 and in the merged RC3 tree; lane a alone, on the old clock, lost six). */
const CH5_D0_OUTCOMES = 'WWWWWWWWWWWWWWWWWWWW';

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

  it('the whole chapter 5 chain, seeds 1-20, is byte-identical and wins 20/20', () => {
    const runs = SEEDS.map((s) => driveChapter5(s, 0));
    expect(runs.map(logHash)).toEqual(CH5_D0);
    expect(runs.map((r) => (r.outcome === 'victory' ? 'W' : 'd')).join('')).toBe(CH5_D0_OUTCOMES);
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
  it('D = 1500 under Wait is byte-identical to D = 0, chapters 4 and 5, seeds 1-20, 20/20 and 20/20', () => {
    const wait = { atbMode: 'wait' as const };
    const ch4 = SEEDS.map((s) => driveChapter4(s, 1500, wait));
    const ch5 = SEEDS.map((s) => driveChapter5(s, 1500, wait));
    expect(ch4.map(logHash)).toEqual(CH4_D0);
    expect(ch5.map(logHash)).toEqual(CH5_D0);
    expect(ch4.every((r) => r.outcome === 'victory')).toBe(true);
    expect(ch5.map((r) => (r.outcome === 'victory' ? 'W' : 'd')).join('')).toBe(CH5_D0_OUTCOMES);
    expect([...ch4, ...ch5].every((r) => r.invalidated === 0 && r.held === 0 && r.refused === 0)).toBe(true);
  }, 180_000);

  it('a Wait engine switched to Active at runtime reproduces the Active D = 1500 golden', () => {
    const wait = { atbMode: 'wait' as const };
    const toActive = (e: { setAtbMode(m: 'active'): void }) => e.setAtbMode('active');
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500, wait, toActive)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500, wait, toActive)))).toEqual(CH5_D1500);
  }, 120_000);
});
