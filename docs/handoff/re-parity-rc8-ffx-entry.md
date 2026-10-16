# Re-parity RC8 lane FFX-L: battle entry (the start-type draw, the placement shuffle, Victory Overdrive at every ending) and lane FFX-K slice K3 (the Wakizashi id)

Status: **built, tested and committed on branch `re-parity-rc8-ffx-entry` (from `origin/r48-rc`, `ea431aa0`); pushed to `origin/re-parity-rc8-ffx-entry`; not merged to main, not deployed, not live** (2026-10-15).
**Game case: FFX only** (AGENTS.md rule 14). The decompiled notes are `FFX-G10` (battle entry and exit) and `FFX-G08` row D6 (FFX.exe, Steam build 25501027); FFX-2 has its own start-up
and battle end (FFX2-G10, lane X2-L) and its own Yojimbo; `src/battle/ffx2`, `src/data/ffx2` and `src/audio` are untouched, and `ffx2-atb-golden` and `ff7-golden` pass unchanged.
No boss number and no party number was changed or added. The condensed spec is `research/re-ffx-battle-entry.md`; nothing from the notes' open questions is used as a fact.
Paper preflight: `docs/plans/re-parity-rc8-ffx-entry-review.md` (`critic-plan` classes the change DEEP).

Bailey's words that govern the lane: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please"; 2026-10-13 "so it can go in live builds asap";
2026-10-15 "keep going please, please incorporate all of your findings into our game". The wiring plan addendum marks all four rows "Bailey first: no".

## 1. What changed, row by row

Row ids are the wiring plan addendum's (`coverage/wiring-plan-addendum-2026-10-13.md`, lanes FFX-L and FFX-K); "note" is the section of `FFX-G10` / `FFX-G08` (condensed in `research/re-ffx-battle-entry.md`).

| Row | The game's rule (proof) | Engine now | Seen in a shipped line? |
|---|---|---|---|
| L3 Victory Overdrive at every ending | the hook (0x007b1540) is called for every result 1 to 5: each party member in the battle counts, and a Victor who is alive, free of Curse and not Petrified gains 20 (traced in all 35 result scenarios; the body read; the end-of-battle save keeps the gain) | `results.ts#buildBattleResult` calls `gaugeOnVictory` whatever the outcome (it called it only on a victory) | **no**: 0 gauge moves at a defeat or an escape in 6,000 chain runs (section 5); proven by the tests |
| L2 the start-type draw | one draw of stream 1 in every battle, scripted or not (emulated, 589,824 vectors); every chapter formation overwrites the answer with a normal start | `adapt/entry.ts#spendEntryDraws`, called from `setup.ts#buildBattle` before the opening counters, spends the draw (`rollStartType`, argument 0x20, `value & 0xff`) and discards the answer; `BattleSetup.condition` stays; `FfxStream.StartType = 1` joins the registry | **no**: nothing reads stream 1 (0 of 12 chapters move; Chapter VII with the draw alone: 0 of 500) |
| L1 the placement shuffle | the monster load links equal monster words (the first equal earlier slot is the leader), and 0x007842f0 spends 2n purpose-0 draws per group of n before the opening counters (emulated, 20,000 scenarios and the real words of 28 formation files); the stored position is read by no script | `kernel/placement-shuffle.ts` (the link rule and the shuffle), `adapt/entry.ts#LINKED_FORMATIONS` (the four formation files that repeat a word, by engine group id), called in the same place after the start-type draw | **yes, in Chapter VII only**: 274 of 500 seeds' event logs move (Guardian damage rolls), 0 outcomes. Chapter XII's discs and the Gui chapter's arms take no turns, so nothing of theirs moves |
| K3 the all-target Wakizashi id | the all-target Wakizashi is `0x30E1`, the single `0x30E0` (emulated, 57,839 roll vectors) | `data/ffx/command-records/player.ts`: `wakizashi-multi` carries `0x30E1`; both ids pinned in `tests/unit/data-ffx-wakizashi-ids.test.ts` | no: no code branches on either id by value; the two game rows carry the same fields |

Streams and slots (`research/re-ffx-battle-entry.md` section 2). The shuffle's draws, in order, by group:

| Chapter | Formation file | Monster words | Linked | Streams drawn |
|---|---|---|---|---|
| VII, Seymour with two Guado Guardians (plus Anima) | `mcyt06_00` | 108d 107c 108d 107d | slots 0 and 2 | 28, 28, 28, 30 |
| XII, Seymour Omnis with four Mortiphasm discs | `sins03_00` | 1083 106a 106a 106a 106a | slots 1 to 4 | 29 x5, 30, 31, 32 |
| the hidden Gui chapter, fight 1 and fight 2 | `kino02_00`, `kino03_10` | 1075 10a0 10a1 10a1 | slots 2 and 3 (the arms) | 30, 30, 30, 31 |

The engine's slot is the index in `BattleState.enemyIds` (the enemies, then the parts); in these three battles that is the game's slot order (Guardian, Seymour, Guardian, Anima; Omnis then the discs; body, head, left arm, right arm), pinned by a test.

A **one-stream generator** (`SeededRng`: FF7, the advisor's forecasts, every scripted test generator) spends none of the new draws, so every older scripted test reads as before; the game generator always spends them.

## 2. Wired, and what stays decompiled (the three states)

| Finding (FFX-G10 / G08) | Decompiled and proven | Wired in the engine | Live |
|---|---|---|---|
| 0x0078d090 start-type roll | emulated, 589,824 vectors | **wired** (the draw; the answer is discarded because every chapter formation overwrites it) | no (branch pushed only) |
| 0x00783680 / 0x00783990 / 0x00783b00 link rule, 0x007842f0 placement shuffle | emulated, 20,000 scenarios + 28 real formations | **wired** | no |
| 0x007b1540 Victory Overdrive at every result | traced (call order), body read | **wired** | no |
| FFX-G08 D6 Wakizashi id | read, emulated roll | **wired** (data) | no |
| 0x007928d0 battle-end status, 0x007917d0 state machine, 0x00798b70 AP settle | emulated / traced | **already equivalent** in the engine (the Petrified-monster victory, the AP rule, the defeat test); nothing to wire | n/a |
| 0x00780d10 random-encounter step roll and the weight tables | emulated, 401,243 vectors | **not wired, nothing to wire**: every chapter is a scripted boss fight | n/a |
| 0x00861160 hand-off, the results (spoils) module, the reward struct, gear drops (0x00798c10) | emulated / read | **not wired**: lane FFX-M (item economy, a results change; "Bailey first: yes") | no |
| FFX-G08 K1, K2, K4, K5 (the player's Yojimbo and the Magus Sisters) | emulated / script-VM | **not wired**: new content, blocked on a sourced starting compatibility and Bailey's yes | no |

## 3. Proofs

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-entry.test.ts` (13 tests) | the kernels against the game: **864** sampled start-type vectors (`tests/fixtures/parity/ffx/start_type.json`; every `x`, with and without Initiative, the low byte from 0 to 255) and **300** sampled shuffle scenarios (`placement_shuffle.json`: monster words, each draw's stream and raw value, the parents, leaders and stored positions the game left) replayed with 0 mismatches; the 28 real formation files (only `mcyt06_00`, `sins03_00`, `kino02_00`, `kino03_10` draw, on the streams the note lists); eight hand-worked corner cases (a three-way link attaches to the first slot, two groups draw in ascending leader order, a word with no file never links, a missing file is skipped, `& 3` and `+ 8k`, `mod remaining`); **1,000** generated formations against an independent model of the draw order (written from the note's wording, sharing no code) |
| `tests/unit/parity-ffx-engine-entry.test.ts` (21 tests) | the **wiring**, against oracles that import nothing from `adapt/entry.ts` or `results.ts`: every group of every chapter and link (12 chapters including the hidden Gui, 3 seeds each) built on the game generator with a tap: stream 1, the formation's shuffle, then the 26 opening draws (20..26, 27 x11, 28..35), each on its stream and each equal to the next output of an independent restatement of that stream's generator; Chapter VII's Guardians' opening draws are the 4th and 2nd outputs of their streams; a preemptive or ambush start spends the first two and none of the 26; a one-stream generator spends only the 26 it always did; the start-type answer through a real battle for 12 byte and Initiative cases; **600 generated fields x 3 endings** for the Victor gauge against the kernel's world built by hand (Cursed, dead, Petrified, out of the battle, a bar nearly full, an aeon holding the field); and the real Chapter II and III parties through `finish` at a victory, a defeat and an escape (a dead Wakka gains nothing) |
| `tests/unit/data-ffx-wakizashi-ids.test.ts` (3 tests) | both ids pinned; each record equals its own row of the game's table; the two rows carry the same fields; neither id is in the reach-0 set |
| mutation pass | **29 mutants of the production code, each putting one game rule back wrong; all 29 caught** (the list is in section 10). The first four ran with all four lane test files, the other 25 with the one test file that should catch them |
| existing | `data-ffx-command-records` (the 979 records), `parity-ffx-rolls`, `parity-ffx-rng-streams`, `parity-ffx-engine-gauge`, `parity-ffx-ctb`, `parity-ffx-engine-ctb-status` and the three goldens stay green |

`npx tsc --noEmit` is clean (run by path; it covers `src` and `tests/unit`). Every new source file is under 400 lines (`placement-shuffle.ts` 134, `entry.ts` 71; `setup.ts` 383 and `results.ts` 175 were under before). `node tools/orphans.mjs`: no new orphan: `kernel/placement-shuffle.ts` and `rolls.ts#rollStartType` are reached from `setup.ts`; the two FFX kernel orphans left are `drops.ts` and `gear-drop.ts` (lane FFX-M).

## 4. Goldens

`ffx-engine-golden` (9 chapters, seeds 1 and 7, the whole chain, every link's full log) is **unchanged and green at 18 of 18: no digest moved, so nothing was re-baselined**. Why the shuffle does not reach it: the pinned
seeds of Chapter VII (1 and 7) are two of the five seeds in the first twelve whose event logs the shuffle leaves alone (seeds 3, 4, 6, 8, 9, 10 and 11 move; seed 1 and 7 do not), and Chapter XII's discs never roll.
`ffx2-atb-golden` (6 tests) and `ff7-golden` (3 tests) are green and untouched. The seeds that do move are measured, not pinned (section 5).

## 5. Measurement (the shipped line of every FFX chapter, `setupForChapter`, `autoResolveMinigames` on)

Before = `origin/r48-rc` (`ea431aa0`, measured in this worktree before the first engine edit); after = the engine code of this branch. `z` is the two-proportion z of the win rate. The scratch lab lives outside
the repository: the measure test with a per-seed event-log digest and the hidden Gui chapter (`zz-rc8-measure.tmp.test.ts`) and the ablation test that puts one rule back inside the new tree (`zz-rc8-cause.tmp.test.ts`); neither is committed.
The 12-seed and 500-seed baselines reproduce RC7's table to the digit (the baseline was clean).

**Every FFX chapter, 12 seeds (11 chapters and the hidden Gui chapter):** every chapter has the same wins, party turns and party KOs, and the same outcome seed by seed:

| Chapter | wins before | wins after | turns b / a | KOs b / a | z | flipped W>L / L>W | seeds identical (outcome, turns, KOs) | event-log digests moved |
|---|---|---|---|---|---|---|---|---|
| seymour-flux | 12 | 12 | 53.3 / 53.3 | 1.1 / 1.1 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| yunalesca | 12 | 12 | 148.5 / 148.5 | 12 / 12 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| braskas-final-aeon | 11 | 11 | 240.1 / 240.1 | 5.5 / 5.5 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| seymour-anima-macalania | 12 | 12 | 54.2 / 54.2 | 4.8 / 4.8 | 0.00 | 0 / 0 | 12 of 12 | 7 of 12 |
| evrae-airship | 12 | 12 | 70.9 / 70.9 | 0.7 / 0.7 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| yojimbo-cavern | 11 | 11 | 65.3 / 65.3 | 3.6 / 3.6 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| seymour-natus | 11 | 11 | 35 / 35 | 2.4 / 2.4 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| seymour-omnis | 11 | 11 | 91.5 / 91.5 | 0.8 / 0.8 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| isaaru-via-purifico | 11 | 11 | 37.6 / 37.6 | 3 / 3 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| sin-fins-core | 11 | 11 | 310 / 310 | 1.7 / 1.7 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| sin-face | 12 | 12 | 45.5 / 45.5 | 0 / 0 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |
| sinspawn-gui | 12 | 12 | 82.2 / 82.2 | 0.9 / 0.9 | 0.00 | 0 / 0 | 12 of 12 | 0 of 12 |

**500 seeds, all 12 chapters (not only the movers):**

| Chapter | wins before | wins after | turns b / a | KOs b / a | z | flipped W>L / L>W | seeds identical (outcome, turns, KOs) | event-log digests moved |
|---|---|---|---|---|---|---|---|---|
| seymour-anima-macalania | 470 | 470 | 54.7 / 54.7 | 4.7 / 4.7 | 0.00 | 0 / 0 | 498 of 500 | 274 of 500 |
| seymour-omnis | 462 | 462 | 95.3 / 95.3 | 0.8 / 0.8 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| sinspawn-gui | 496 | 496 | 80.6 / 80.6 | 0.6 / 0.6 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| yunalesca | 453 | 453 | 157.7 / 157.7 | 13.6 / 13.6 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| braskas-final-aeon | 479 | 479 | 232.1 / 232.1 | 5.4 / 5.4 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| seymour-flux | 500 | 500 | 52 / 52 | 0.9 / 0.9 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| evrae-airship | 488 | 488 | 71 / 71 | 0.7 / 0.7 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| yojimbo-cavern | 493 | 493 | 67.4 / 67.4 | 3.9 / 3.9 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| seymour-natus | 483 | 483 | 33.5 / 33.5 | 1.7 / 1.7 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| isaaru-via-purifico | 452 | 452 | 38.2 / 38.2 | 2.9 / 2.9 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| sin-fins-core | 437 | 437 | 296.4 / 296.4 | 3 / 3 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |
| sin-face | 500 | 500 | 45.3 / 45.3 | 0 / 0 | 0.00 | 0 / 0 | 500 of 500 | 0 of 500 |

**What moved, and why.**

- **Only Chapter VII's event logs move: 274 of 500 seeds, 0 outcomes.** Cause, proved by ablation (the scratch test puts one rule back inside the new tree): with the placement shuffle put back to "none" and the start-type draw kept,
  Chapter VII is **500 of 500 digests identical** to the base; with the start-type draw put back to "none" and the shuffle kept, it is the same **274 of 500**. With both put back, all 12 chapters are byte for byte the base's at 12 seeds.
  The first difference in the logs I read (seeds 3, 4, 6 and 8 of 12) is a **Guado Guardian's damage roll** (seed 3, event 90: Yuna took 102 from a Guardian's Thunder before and takes 101 now; seed 4, event 47: 101 before, 106 now; seed 6, event 42: Rikku 138 before, 128 now): the Guardians' streams (28 and 30)
  stand three and one draws further on, so every roll they make is dealt again from there. Their opening counters came out the same in those seeds (both Guardians open at 0 after the normalisation). Seeds 148 and 201 end in a different number of turns (55 to 45 party turns, 58 to 56) because a re-dealt roll changed the course;
  both are victories as before.
- **Chapter XII (0 of 500) and the Gui chapter (0 of 500) do not move**: the four Mortiphasm discs and the two arms are the linked monsters, they take no turns and so never roll on the streams the shuffle moved.
- **L2 moves nothing** (stream 1 is read by no chapter), and **L3 moves nothing** in these chapters: of 6,000 chain runs (500 seeds x 12 chapters) there were 286 defeats and 1 escape (the Yu Yevon stalemate), and in 88 of those endings a Victor-mode Wakka stood on the field
  (Wakka's Victor row is in the Chapter II and III builds, and Chapter XII's build copies Chapter III's); the hook moved a gauge in **none** of them (at a defeat the party is down, a Victor with it; in the one escape no gauge moved). The rule is proven by the tests, not by a shipped line.
- Wins before and after are the same in every chapter (no flipped seed in either direction), so no win rate is outside sampling, and the cost is not measured: the lane adds one draw to every battle and up to eight more in three of them.

## 6. The whole suite (once, at the end of the code work)

INTERIM, to be replaced by the result of the whole-suite run: the whole suite (1,252 test files, `--maxWorkers=2`) was started once after the last code change and was still running (its long FFX-2 bench files are slow on a busy machine) when this note was first pushed. The lane files, the three goldens, `data-ffx-command-records`, `parity-ffx-rolls`, `parity-ffx-rng-streams` and `parity-ffx-engine-gauge` were run on their own and pass; `tsc` is clean.

## 7. Disclosures, in player words (FFX only)

- **Chapter VII (Seymour, the two Guado Guardians and Anima):** the Guardians' hits land for slightly different numbers than before on most seeds (a handful of points either way), because their dice now start where the game's do. Nobody wins or loses more often. Nothing else about the fight changed.
- **Chapters II, III and XII (Wakka's Victor Overdrive):** if a fight ever ends in a flight or a defeat with Wakka (Victor) still standing, he now gets his 20 Overdrive points as after a win. No shipped line reaches it; it is rule parity only.
- **Everything else:** nothing you can see. Every battle now spends the game's start-up roll and the Wakizashi on all targets carries the game's own command number; neither changes what happens.

## 8. Open items

- **A shuffle's stored position is dropped.** It is read by no script of the game (1,224 scanned); the note says it may also move a position on screen ("possibly a position"), which the engine's stage does not model. Not used as a fact.
- **The stream-1 draw is order-sensitive in the game only against the formation script group** (the roll comes first, then the group starts; the group's own first update is after). The engine has no formation scripts at the entry; the scene-and-camera draws of Chapter VIII and Sin's Fins on stream 2 (RNG lane) are separate and unchanged. Whether a formation script draws on stream 2 *before* the monster load is not modelled (the note lists 25 of the 26 chapter formations as having random calls; where they fall relative to the opening is not established).
- **The one-stream exemption.** A scripted generator in a test, FF7 and the advisor's forecasts do not spend the entry draws. If the release driver prefers one rule for every generator the cost is re-pinning the older scripted tests that read an opening of Chapter VII, XII or the Gui chapter (not measured).
- **L3's mode counters.** The engine keeps every Victor learning counter at "never counts" (the builds name one mode per member), so the hook's counter advance has no observable effect; only the +20 does.
- **Lane FFX-K (K1, K2, K4, K5) stays "decompiled, proven, not wired, no consumer".** Q13 of the addendum (do any chapter's builds own the player's Yojimbo or the Magus Sisters?) is the decision that would start it; the sourced starting compatibility is still missing.
- **Lane FFX-M (kill rewards, the results panel) is not started** (item economy; Bailey first).

## 9. Decisions for Bailey

None are needed for these rows (numeric parity under the 1:1 order). For the release note (FFX only): Chapter VII's Guardians roll different damage numbers on most seeds (no outcome moves).

## 10. The mutants (each must be caught by a test)

| Mutant | Rule it breaks | Caught by |
|---|---|---|
| `link-follows-last` | a follower attaches to the FIRST equal earlier slot (not the last) | parity-ffx-entry, parity-ffx-engine-entry |
| `link-class-ignored` | a word names a file only when its class nibble is 0 or 1 | parity-ffx-entry |
| `link-file0-links` | a file id of 0 has no file and never links | parity-ffx-entry |
| `link-missing-file-links` | a file the file system lacks is skipped | parity-ffx-entry |
| `shuffle-no-member-draws` | n member draws follow the n position draws (2n in all) | parity-ffx-entry |
| `shuffle-leader-skipped` | the leader draws its own pick first | parity-ffx-entry |
| `shuffle-leader-stream-mode1` | the position draws are on the leader's purpose-0 stream | parity-ffx-entry |
| `shuffle-member-on-leader-stream` | each member draws on its own stream | parity-ffx-entry |
| `shuffle-and7` | a position is (value & 3) + 8k | parity-ffx-entry |
| `shuffle-step4` | a position is (value & 3) + 8k (the step is 8) | parity-ffx-entry |
| `shuffle-mod-n` | a member's pick is value mod (the entries still unassigned) | parity-ffx-entry |
| `shuffle-leaders-descending` | leaders draw in ascending chr id | parity-ffx-entry |
| `shuffle-lone-monster-draws` | a monster with no partner draws nothing | parity-ffx-entry |
| `entry-no-start-draw` | one start-type draw in every battle | parity-ffx-engine-entry |
| `entry-x-wrong` | the start-type roll takes X = 0x20 | parity-ffx-engine-entry |
| `entry-initiative-ignored` | Initiative on a party member in the battle lowers the roll | parity-ffx-engine-entry |
| `entry-no-shuffle` | a linked formation spends the placement shuffle | parity-ffx-engine-entry |
| `entry-all-generators` | a one-stream generator spends none of the entry draws | parity-ffx-engine-entry |
| `entry-omnis-missing` | Chapter XII's discs are linked | parity-ffx-engine-entry |
| `entry-macalania-unlinked` | Chapter VII's Guardians are linked (slots 0 and 2) | parity-ffx-engine-entry |
| `entry-gui2-missing` | the Gui chapter's second fight is linked | parity-ffx-engine-entry |
| `entry-shuffle-before-roll` | the start-type draw comes before the shuffle | parity-ffx-engine-entry |
| `entry-start-draw-low-bits` | the roll takes the low byte of the draw | parity-ffx-engine-entry |
| `entry-start-stream-2` | the start-type roll is on stream 1 | parity-ffx-engine-entry |
| `entry-after-opening` | the entry draws come before the opening counters | parity-ffx-engine-entry |
| `l3-victory-only` | Victory Overdrive runs at every ending | parity-ffx-engine-entry |
| `l3-not-on-escape` | Victory Overdrive runs at an escape | parity-ffx-engine-entry |
| `l3-not-on-defeat` | Victory Overdrive runs at a defeat | parity-ffx-engine-entry |
| `k3-old-id` | the all-target Wakizashi is 0x30E1 | data-ffx-wakizashi-ids |

## 11. Changelog paragraph (FFX only)

**FFX only.** Battles now start the way the game's do. Every battle spends the game's start-up roll, and in Seymour's fight with the two Guado Guardians (Chapter VII), Seymour Omnis's discs (Chapter XII) and the hidden Sinspawn Gui fights the game also shuffles the linked monsters before the first turn, so the monsters' dice stand where the game's would: in Chapter VII the Guardians' hits land for slightly different numbers than before (nobody wins or loses more often), and Chapters XII and the Gui fights look the same because their linked monsters never roll. Victory Overdrive now runs at every ending, as in the game, so a Victor-mode Wakka still standing when a fight ends in a flight gains his 20 points as after a win (no shipped line reaches it). Yojimbo's all-target Wakizashi carries the game's command number; nothing changes in play.
