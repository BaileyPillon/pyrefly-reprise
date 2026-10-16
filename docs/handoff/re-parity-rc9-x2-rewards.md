# Re-parity RC9, lane X2-C: FFX-2's kills pay the way the game pays them

Status: **built, measured, mutation-checked and run through the whole suite on branch `re-parity-rc9-x2-rewards`, pushed, not merged, not deployed** (2026-10-15). Lane X2-C of the wiring plan
(`D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`, rows XC1 to XC9; the source is the private decompile note FFX2-G03, whose numbers are the ones in the proof fixtures below).
Owner: Bailey. Base: `f939b87f` (`origin/r49-rc`). **Game case: FFX-2 only** (AGENTS.md rule 14): no file of `src/battle/ffx`, `src/data/ffx`, `src/battle/ff7` or `src/audio` changed;
`ffx-engine-golden` and `ff7-golden` run no code this lane touched and pass unchanged. Plan: [re-parity-rc9-x2-rewards-review](../plans/re-parity-rc9-x2-rewards-review.md).
Release class (`node tools/critic-plan.mjs --paths` on the lane's files): **DEEP** (the FFX-2 ATB engine and the shared combat core are shared systems); the reviews are the release driver's.

Bailey, 2026-10-08: "It needs to be a 1:1 parity." 2026-10-15: "keep going please all of this reverse engineering needs to be incorporated into our game" and "keep going please full speed ahead". Wiring-plan decision Q9
(accepted as recommended): "results screen: mockup first, then yes", so **the rules are wired and today's results screen is kept**; the per-girl lines are a screen item (section 9, and decision 1 of section 12).

Nothing on a boss or a party was tuned (hard rule 6 and the lane brief). What moved is what the game's routine says moves (section 8).

Commits (all on `re-parity-rc9-x2-rewards`, on top of `f939b87f`):

| Commit | What |
|---|---|
| `7ca13c2d9` | the paper preflight, `kernel/kill-rewards.ts` with `kill_rewards.json` (535 emulator vectors) and its kernel test, the measurement harness |
| `8db34eac6` | the wiring: the monster rows' reward bytes on the enemy data, the ledger, the knock-out hook, the reward abilities, the Eject rule, the Syndicate and Bulwark records, the contract entry, the four pinned-log tests re-pinned with the cause |
| `633806b5c` | the stream registry in step (the independent table and its oracle), the engine test's accounting oracle over Chapter V's whole chain, the best chain pinned, the measurement's reward-ability variants |
| `a0fb3ebd3` | the reward rows file's citation and confidence tag (comments only) |
| `eba04593c` | every shipped monster's reward numbers carry their row citation, pinned (tests only) |
| `820eafd05` | the new `BattleResult` comment no longer spells the third game's name: the whole-suite run found `ff7-class-a` at 12 lines of `types.ts` against its 11 (one comment word) |
| `d2581ee1f` | the Eject rule pinned by the two ids, after the second mutation pass found a survivor (tests only) |
| `99f79adbf` | the measurement prints a digest of every chain's event logs with the results' payloads set aside (tests only) |
| `2230a8133` | the first version of this note (the whole-suite result still to come) |
| the commit that holds this version | this note with the whole-suite result, the advisor-preview case in the engine test (found by reading `simulate.ts`), the contract entry's stale line count |

## 1. What the engine does now

| Piece | Where | What it is |
|---|---|---|
| The kernel | `kernel/kill-rewards.ts` | the item function (0x00624890), the reward roll with its per-owner modifiers (0x006246d0, 0x006244c0), the AP gain (0x00635590), the end-of-battle rollback and the battle-start commit (0x00624450, 0x006244a0). 535 stratified emulator vectors (145 item, 150 roll, 240 AP), 0 mismatches; the note's own proofs are 213,000 |
| The rows | `data/ffx2/monster-records/kill-rewards.ts` | every shipped FFX-2 monster's EXP, AP, gil, drop chance byte and two item slots (42 rows: the seven chapters, the Experiment, Tourist Trap, Valefor at Besaid, Angra Mainyu, the Fiend Arena's Trema), read from `monster.bin` / `monster2.bin` with our own read-only reader, laid on the enemy as `ffx2Record.kill`; pinned to `tests/fixtures/parity/ffx2/kill_reward_rows.json`, which the reader wrote |
| The adapter | `adapt/kill-rewards.ts` | a unit as the kernel's victim (its row, `chainBefore` and `bestChain`), the nine owner slots (the three girls; present unless the slot is empty, ejected when removed, her ability word 1, Pointless), one owner as the AP gain reads her, the lists as our drops, and the table of the game's item numbers against ours (30 ids) |
| The ledger | `kill-rewards.ts`, `BattleState.ffx2Rewards` | `payKill` at each knock-out; `rewardsOfBattle` at the end (EXP after the rollback of a girl who is dead or Petrified, gil, the items, the best-credited girl's AP, each girl's share) |
| The seams | `resolve-hp.ts`, `resolve-status.ts`, `chain.ts`, `results.ts`, `adapt/menu.ts` | `applyHpDelta` calls the roll once a unit falls (Auto-Life spent first, before its chain breaks); an Eject by a command other than Steal Will or a Bribe pays like a knock-out; `bumpChain` records the best chain; `buildResult` reads the ledger; the garment-grid tags for the seven reward abilities reach the girls' ability words |
| The streams | `adapt/streams.ts` (table), `parity-ffx2-rng-streams.test.ts` | one draw on stream 10 at every knock-out (a girl's too), a draw on stream 11 when an item drops; the independent stream table and its oracle now name the role |

## 1b. Sources, and the row each monster's reward numbers cite

* **The routine and its rules**: the private decompile note FFX2-G03 (`D:\Tools\ffx-parity\coverage\ffx2\FFX2-G03.md`, written 2026-10-10, third check 2026-10-11; FFX-2.exe, Steam build 25501027): sections 4.1 to 4.9 (when the roll runs, its order, EXP, gil, AP, the drop and the rare slot, the reward abilities, the end of battle), 5.1 (the chapter bosses' rows) and 8 (the differences from our engine). Its own proofs are 213,000 emulator vectors with 0 mismatches; this lane replays 535 of them (`tests/fixtures/parity/ffx2/kill_rewards.json`: 145 for the item function, 150 for the roll, 240 for the AP gain) and the note's worked examples. The note is private: no decompiled code or game text is in the repo, only addresses, offsets and numbers.
* **The monster rows**: `battle/kernel/monster.bin` of the same build (`monster2.bin` for the Oversoul Paragon), read with our own read-only reader, numbers only; the columns are the ones `research/re-ffx2-yojimbo-valefor.md` section 3 proves (EXP +0x9c, gil +0xa0, AP +0xa8, the drop chance byte +0xaa, the two item slots +0xac). 42 rows, pinned field for field to `tests/fixtures/parity/ffx2/kill_reward_rows.json`, which the reader wrote. A second witness for the numbers: 36 of the 42 rows are tabulated in the note's own table 5.1 (an independent write-up of the same rows, with the item names) and agree with the fixture on the row number, EXP, AP, gil, drop byte and both item slots (`final\note_vs_fixture.py`, 0 differences); the other six (Yojimbo, Daigoro, Valefor, Angra Mainyu, Zarich, Tawrich) are the hidden chapters' and are checked against what those chapters' own fixtures decode (`parity-ffx2-rewards-data.test.ts`, the second-witness case), as is the Experiment's row.
* **The citation travels with the numbers**: `FFX2KillReward` carries the `table` and `row` of the monster's row; `data/ffx2/monster-records/kill-rewards.ts` names the file, the reader, the note and a `[verified: ...]` tag (the data-citation guard `data-ffx2-citations.test.ts` wants one). Checked for every monster of every shipped formation (25 formations, 42 monsters; `parity-ffx2-rewards-data.test.ts`, "every shipped monster's reward numbers carry their row citation"): each wears a row; the row it cites is the row the reader read, is named for the same monster, and is the row its record cites for the rest of it (one exception on purpose: the Fiend Arena's Trema is built from the story Trema's record, row 295, and is paid by its own row, 328, FFX2-G03 table 5.1); no formation cites a row twice.
* **Rows by chapter** (`monster.bin` row numbers): IV Bahamut 168. V the Tail 282, the Leg 283 (Nodes A to C 284 to 286), the Body 287 (Bulwarks 288 right, 289 left), the Head 290 (Redoubts 291 right, 292 left), Shuyin 260. VI Act I Ormi 243, Dr. Goon 135, Fem-Goon 138; Act II Ormi 244, Logos 249; Act III Ormi 245, Logos 250, Leblanc 253. XI Shiva 167, Sandy 172, Cindy 171, Mindy 173, Anima 169. XIII Paragon 152 (the Oversoul version: `monster2.bin` 152), Trema 295, the Fiend Arena's Trema 328. XV Baralai 176, Gippal 177, Nooj 258. XVI Ixion 166. Hidden: the Experiment 194 (both battles), Yojimbo 170 and Daigoro 174, Valefor at Besaid 164, Angra Mainyu 268 with Zarich 269 and Tawrich 270.
* **Plan and decisions**: `D:\Tools\ffx-parity\coverage\wiring-plan-draft-2026-10-11.md`, lane X2-C (rows XC1 to XC9) and decision Q9, which Bailey accepted as recommended ("results screen: mockup first, then yes").
* **The note's open questions, respected and not guessed**: question 2 (which result codes reach the teardown, so whether a flee pays or rolls back) is not modelled: the FFX-2 engine has no flee outcome, a battle ends in victory or defeat, and only a victory pays; question 8 (which scripted "leave" commands pay) is not modelled: only the two commands the note names (Steal Will 0x30c7 and Bribe 0x30f0) pay nothing, every other way of falling or leaving pays, and the Syndicate's Acts I and II, which leave in the game, fall by HP here and pay (the note's own table assumes they pay); question 10 (does the stats refresh after a mastery draw) is not modelled: the spending of AP into abilities is not wired, so no refresh runs.

## 2. Difference rows (FFX2-G03 section 8, plan rows XC1 to XC9): what changed

Game case for every row: **FFX-2 only**.

| Row | The game | What the build did | What it does now | Proof |
|---|---|---|---|---|
| XC1 | one draw on stream 10 always, a drop when `(draw mod 255) < drop byte + best + current chain + 64 per Item Hunter owner`, then stream 11 for the rare slot | paid every listed drop of every enemy on victory, no roll; each Bulwark paid both of two entries | the roll, per knock-out | `parity-ffx2-rewards-kernel.test.ts` (vectors, hand examples), `parity-ffx2-rewards-engine.test.ts` (the engine on the tapped draws) |
| XC2 | drop bytes 128 (the goons, the Bulwarks) and 192 (Logos, Act III) | Potion always, Charm Bangle always | the bytes, from the rows | `parity-ffx2-rewards-data.test.ts` |
| XC3 | the rare slots differ (Shiva, Sandy, Cindy, Paragon, Trema, the Oversoul, the arena Trema, the Nodes, the Bulwarks) | one common item per enemy | both slots, from the rows | same |
| XC4 | each present, not ejected owner gets the full EXP, doubled by her own Double EXP, none under Pointless; a girl down or Petrified at the end loses it | one party EXP | the ledger keeps each girl's; `BattleResult.exp` stays the results total, `rewardsByMember` is new | engine test |
| XC5 | per girl, x2 / x3 / x6, a pool capped at 99 for the battle | one summed AP | per girl, capped; **the spending into the worn dressphere's abilities is not wired** (section 11) | kernel and engine tests |
| XC6 | gil x2 per Gillionaire owner; Pilfer Gil goes to the wallet | one sum | x2 per owner; **Pilfer Gil stays on the results line as today** (a screen item) | engine test |
| XC7 | the reward bits are read by the routine | the masks existed, nothing read them | read from the girl's ability words (`Ffx2Unit.autoWords`: her ladder, plus the grid tags `double-ap`, `triple-ap`, `butterfingers`, `gillionaire`, `double-items`, `double-exp`, `item-hunter`) | data test (each tag and the game's row set the same bit; a Thief who learned Item Hunter carries it) |
| XC8 | Ormi, Act I: 220 EXP, 1 AP, 220 gil, Black Choker | 240, 2, 230, Twist Headband | the row's | data test |
| XC9 | Ormi, Act II: 1 AP, Defense Veil; Logos, Act II: 1 AP, Favorite Outfit | 2 AP; Twist Headband and Charm Bangle | the rows' | data test |

Also: the Bulwarks' authored drops are the common slot only (`vegnagun-body.ts`; the two entries at chance 50 that nothing read are gone).

## 3. The three states

| Finding (FFX2-G03) | Decompiled | Wired (on this branch, tested) | Live |
|---|---|---|---|
| 1 the roll per kill, the two paths that pay nothing | yes | the roll at every knock-out; Steal Will and Bribe Ejects pay nothing | no |
| 2 EXP per owner, 3 gil and item multipliers, 4 the drop and rare tests | yes | yes | no |
| 5 AP per owner, the pool and its cap | yes | yes | no |
| 6 AP spending into abilities, the learn event, the order | yes (0x00635510, 0x00635430, 0x00635690) | **no**: the build's data keeps one banked AP number per dressphere, not the AP held per ability and the learn target the routine walks | no |
| 7 five item lists, 8 ids a category, stack caps | yes | yes (a girl's results show them as one list) | no |
| 8 the teardown rollback | yes | a girl dead or Petrified at the end of a won battle | no |
| 9 the story-progress EXP grant | yes (dead code: no caller found) | nothing to wire | no |
| 10 the monster rows | yes | all 42 | no |
| 11 the in-battle stats refresh after a mastery (may draw on the girl's own stream) | not read | no (open question 10) | no |

"Live" is no for every row: the branch is not merged and not deployed.

## 4. Engine rules that are the engine's own (not in the note)

1. **The owners are the three girls** (slots 0 to 2). The six slots the note gives a Special dressphere's parts (3 to 8) are empty here: the engine's three-part form is not wired (`sdspPartIds` is declared and unused), and what a part character is was not read (note open question 4).
2. **A chain's terms**: the current chain is `chainBefore(unit)` (the engine's window stands in for hit reaction; a Stopped or Petrified unit reads 0), the best is `Ffx2Unit.bestChain`, raised in `bumpChain` and never lowered.
3. **`BattleResult.ap` is the AP of the best-credited girl** (the screen's "per dressphere" number; the three are equal unless a girl wears Double AP or Triple AP). `rewardsByMember` carries each girl's own.
4. **A monster with no row of the game** (a hand-built test enemy) pays its authored EXP, AP and gil and its authored drops outright; the shipped chapters have none (a test).
5. **A Petrified girl or monster is not a knock-out here** (the note names Petrify only as a side call of the knock-out resolution, and when the resolution runs for it was not read).
6. **Pilfer Gil stays on the results gil line** on a victory, as it always was; the game banks it in the wallet at once and its results show only the kills' gil.

## 5. Proofs and tests

| File | Tests | What it pins |
|---|---|---|
| `parity-ffx2-rewards-kernel.test.ts` | 16 | the 535 vectors (item function, roll with owners, AP gain), the note's worked examples (EXP per owner, Double EXP not carried, x8 gil, the Pointless and ejected owners, the stream draws, the drop test at its edges, the rare share, Butterfingers, Double Items, the lists, the AP cap, the rollback) |
| `parity-ffx2-rewards-data.test.ts` | 13 | the rows equal the reader's numbers; every enemy of every chapter wears one; the authored EXP, AP, gil and common drop agree; every item id has a game number and a name; each grid tag and the game's row set the same ability bit; a Thief with Item Hunter; **every shipped monster's reward numbers carry their row citation** (4 cases: the table and row as the reader read them, the same monster's name, the same row as its record; one row a monster in a formation; the data file names its source; the hidden chapters' rows equal what those chapters' own fixtures decode, a second witness) |
| `parity-ffx2-rewards-engine.test.ts` | 23 | the real engine, knock-outs through `applyHpDelta`, expectations written from the note and the raw draws read off the generator's tap: a kill pays at once, a standing monster pays nothing, a monster killed twice pays twice, a girl's knock-out takes the draw and pays nothing, the byte-128 drop over 120 seeds against the tapped values, the chain terms, Item Hunter, Butterfingers, Double Items, the owners (x8 gil, Double EXP, x6 AP, Pointless, ejected, down at the end, Petrified), the 99 cap, Pilfer Gil, a monster with no row, the advisor's fork and its per-command preview of a killing blow (the preview pays into its own copy), the Eject rule (and the two ids that clear the pay flag); **Chapter V's whole chain on the shipped line, seeds 1 to 4: each link pays exactly the rows of the monsters that fell in it, one stream-10 draw per knock-out, one stream-11 draw per item, and the Nodes pay nothing** |
| `parity-ffx2-rng-streams.test.ts`, `helpers/ffx2WiringOracle.ts` | 12 | the independent stream table and the oracle name the reward draw (role `reward`, stream 10) |
| `data-ffx2-vegnagun-chain.test.ts`, `ffx2-steal.test.ts` | (edited) | the Bulwarks' authored drops are the common slot; a victory pays what fell, so a fixture where nothing fell pays only the Pilfer Gil |
| `ffx2-rewards-measure.test.ts` | (gated by `PYREFLY_MEASURE=1`) | the measurement of section 7, and the log digest |

**Mutation pass** (by hand, scratch: one textual change at a time on a snapshot of the pushed commit `eba04593c` made with `git archive` (`D:\Tools\ffx-parity\rc9\x2-rewards\final\mut`, so the worktree is never touched), the three lane test files run for each change, `final\mut2.py`; a fault is caught when a test fails, and the run shows the assertion, not only a timeout): **64 faults, 63 caught, 1 equivalent** (the first run, of 63, left two alive: the equivalent one, and a Bribe paying; the Bribe got its test, and a 64th fault, the preview sharing the live ledger, was added with its own test).
The kernel (26): Gillionaire, Double Items and Item Hunter counted once; Butterfingers ignored, and compounding (**the equivalent one**: 8, 64 and 512 all put 32 m past the 255 ceiling of the draw); the chain dropped from the drop test and from the rare test; the drop test `<=`; a zero byte still dropping; an ejected owner counted;
Pointless ignored for EXP and for AP; Double EXP carried to the next owner, and ignored; Triple AP replacing Double AP; no pool cap; a dead owner credited AP; stream 11 always drawn; the multiplier applied to every category; a ninth id appended; the key-item stack cap raised; the rollback doing nothing; the EXP total not added;
the stream-10 reduction `% 256`; the rare mask `& 0x7f`; the common and rare slots swapped. The engine side (17): the roll not called, called after the chain breaks, skipped for a girl; a standing monster paid at the victory; a defeat paying; the best chain not recorded, and overwritten instead of kept;
the rollback sparing a Petrified girl, and a dead one; the AP as a sum over the girls; the pool not accumulating; a monster with no row losing its drops; an Eject never paying, always paying; Steal Will paying; a Bribe paying; the advisor's preview of a killing blow sharing the live ledger. The adapter (11): the chain read as 0; the best chain ignored; the owner's word taken from word 0, the AP word from word 1; one shared save index;
the stream-10 reduction `% 256`; the two slots swapped; an ejected, a Pointless and a dead girl not noticed; a wrong id in the item table. The grid tags (3): Double AP and Item Hunter missing, Gillionaire on the wrong row. The rows and the enemy data (7): a row number off by one, a table wrong, a record's row off by one, an EXP off by one,
the source tag removed, the Bulwarks' second entry back, Ormi's AP back to 2.
**The one real survivor of the first run was a Bribe paying** (the engine's Bribe never ejects, so the Eject case could only try Steal Will): `parity-ffx2-rewards-engine.test.ts` now pins the rule by the two ids, and the nine faults re-run against it (the survivor and the slow ones) are all caught; the preview case was found by reading `simulate.ts` (the advisor's per-command preview runs the same knock-out code on a copy of the state), and the new test fails when the copy shares the live ledger.
The earlier session's pass (37 faults on the tree at `633806b5c`: 36 caught, 1 equivalent; its one real survivor, the best chain never recorded, is pinned by a chain that breaks and starts again) is a subset: the same 37 are in this list.
One more check outside the count, because it takes two files at once: a wrong Yojimbo EXP written both in the reader's fixture and in the data file (the first witness, which compares the two, cannot see it) is caught by the case that reads the hidden chapters' own fixtures (`final\second_witness_mutant.py`).

`tsc --noEmit` clean. `node tools/orphans.mjs`: 28 modules orphaned, none of this lane's four new ones (all reachable). Files over 400 lines among those touched: in `src` only `battle/common/types.ts` (the shared contract file, 3,058 lines; 3,010 at base, this lane adds 48 additive lines) and, among the tests, the helper `helpers/ffx2WiringOracle.ts` (422 lines at base, 428 now); `battle/ffx2/internal.ts` is 391 (389 at base).

## 6. Goldens

Four pinned-log tests moved, **all 119 pinned logs**, and every one for the same reason, proved by ablation: the `victory` event carries the result record, and the result is now what the reward routine paid at each knock-out
(plus the new `rewardsByMember`), so that one event's payload differs. With each `victory` result put back to what the old `buildResult` made from the same board (the sum of the authored rewards, the Bulwarks' old two entries,
the three Syndicate records as they were, no `rewardsByMember`), **all 119 logs give their old digest again**: `ffx2-atb-golden` 60 of 60 (CH4_D0 20, CH5_D0 20, CH4_D1500 10, CH5_D1500 10), `ffx2-menu-cancel-delay` 18 of 18,
`ffx2-hit-closes-menu` 9 of 9, `chapters/den-of-woe-carry` 32 of 32 (Chapters 5, 6, XI and the Sisters). So no battle changed and not one event before the victory moved: the knock-out draws on streams 10 and 11 shift no roll, because the intended line
steals nothing in these chapters. Each file carries its cause paragraph. Outcomes are unchanged (CH5_D0_OUTCOMES stays). `ffx-engine-golden` (18) and `ff7-golden` (3) pass unchanged. The ablation is a scratch test (`zz-x2c-golden-cause.tmp.test.ts`, gated by `X2C_CAUSE=1`, untracked, not committed; it stays in this worktree's `tests/unit` and a copy is in `D:\Tools\ffx-parity\rc9\x2-rewards\`). It reads the pins from the pinned-log test files of its own tree, so it proves something only beside the **base's** four files: **re-run on the tip in this session** (`final\abl`: the tip's `src` and helpers with the four test files as `origin/r49-rc` has them), it gave 119 of 119: CH4_D0 20/20, CH5_D0 20/20, CH4_D1500 10/10, CH5_D1500 10/10, hit-closes 9/9, menu-cancel 18/18, den-of-woe-carry 32/32 (52 s).
The measurement's log digest (section 7) extends the same statement to the chapters the pinned logs do not cover (XIII, XV, XVI and the four hidden ones).

**The whole suite, once** (`node ... vitest.mjs run --maxWorkers=2`, from this worktree at `99f79adbf`, which has no `public/art`; 18:16 to 20:52 on 2026-10-15, 9,377 s, on a machine shared with the other parity lanes: CPU at 99 percent, over a hundred node processes): **1,270 files: 1,225 passed, 28 failed, 17 skipped; 19,610 tests: 19,291 passed, 193 failed, 125 skipped, 1 todo.** The 28 failing files fall in two groups and none is this lane's:

1. **Art only: 22 files, 182 failed tests, and 5 of the 22 cannot even load** (`public/art/` is gitignored and local, so a worktree has none): `art-ref-defaults` (4), `chapter-meta-evrae` (3), `chapter-meta-ffx2-leblanc` (2), `chapter-meta-seymour-anima-macalania` (3), `chapter-meta` (no `manifest.json`), `cutscene-story-poses` (1), `party-face-manifest` (no manifest), `pause-remake` (3), `ui-portrait-face-crop` (145), `chapters/chapters-6-7-8-enemy-sprite-manifest` (no manifest), `chapters/den-of-woe-ship-content` (3), `chapters/den-of-woe-ship-scene` (1), `chapters/experiment-scene` (1), `chapters/fallen-aeons-ship-content` (2), `chapters/fallen-aeons-ship-scene` (1), `chapters/isaaru-ship` (3), `chapters/leblanc-art` (2), `chapters/leblanc-party-sprites` (no manifest), `chapters/natus-ship-content` (2), `chapters/natus-ship-scene` (2), `chapters/trema-ship-content` (4), `chapters/yojimbo-content` (no manifest).
   **Proved art only**: with the r49 line's `public/art` linked into the worktree for one run (a junction to `D:\pyrefly-r49\public\art`, made for the run and removed after with `rmdir`; both art folders were checked intact), **all 22 files pass, 746 tests**. With the main tree's `public/art` instead, 20 pass and 2 (`ui-portrait-face-crop`, `chapters/experiment-scene`) miss files that only the r49 line's art holds (the `exp-leblanc` portraits, the Experiment plate).
2. **Timeouts only: 6 files, 11 tests**, each a test that ran over its 15 s budget on the loaded machine (a test took 15 to 125 s): `advisor-floor` (3 of 22), `advisor-note` (4 of 27), `advisor-plan` (1 of 13, its own 120 s limit), `art-sidecar-redact` (1 of 19), `strategy-chapter2` (1 of 13), `ui-ffx2-atbmode` (1 of 6). They are FFX advisor and strategy runs, a source scan and an FFX HUD DOM test; none runs this lane's code. Re-run alone, `advisor-plan`, `art-sidecar-redact` and `strategy-chapter2` pass; `advisor-floor`, `advisor-note` and `ui-ffx2-atbmode` time out again at 15 s on the loaded machine and **pass with the test timeout raised to 300 s on the command line** (55 tests, 265 s; nothing in the repo changed; the HUD test needs 14 of the 15 s even then). Which files time out moves from run to run with the load: the earlier session's run (13:59, on the tree before step 4) timed out in `strategy-ffx2-bahamut` and `ui-pause-stack` (both pass in this one) as well as `ui-ffx2-atbmode` and `art-sidecar-redact` (both time out again), and had one more failure that does not recur, `chapters/exp-fayth-skin` (a count of fetches); this run's `advisor-floor`, `advisor-note`, `advisor-plan` and `strategy-chapter2` timeouts are new.

**What the first whole-suite run found, now fixed**: the earlier session's run (190 failed) had one failure caused by this lane, `ff7-class-a` ("types.ts does not grow for FF7": 12 lines against its 11, the new `rewardsByMember` comment); fixed in `820eafd05`, passing in this run.

The lane's own files in this run, all passing: `parity-ffx2-rewards-kernel` 16, `-data` 12 (13 with the hidden chapters' second-witness case added afterwards), `-engine` 22 (23 with the preview case added afterwards), `parity-ffx2-rng-streams` 12, `data-ffx2-citations` 111, `data-ffx2-monster-records` 10, `data-ffx2-vegnagun-chain` 16, `ffx2-steal` 7, `ff7-class-a` 7, and the goldens: `ffx2-atb-golden` 6, `ffx2-menu-cancel-delay` 6, `ffx2-hit-closes-menu` 7, `chapters/den-of-woe-carry` 7, `ffx-engine-golden` 18, `ff7-golden` 3. After the run the engine test gained its preview case, the data test its hidden-chapters case, and the contract entry's line count changed: `tsc --noEmit` clean and the three lane test files green again (engine 23, kernel 16, data 13: 52 tests).

## 7. Measurement

Method: `tests/unit/ffx2-rewards-measure.test.ts` plays every FFX-2 chapter's intended line through the app's own path (the real party build, the chapter's triggers, every link of its chain; the shipped `intendedStrategy`) and adds up what each **won** chain paid on its results screen, summed over the links as `chainSpoils` does. Twelve chapters: the seven listed ones (IV Bahamut, V Vegnagun and Shuyin, VI Leblanc, XI the Fallen Aeons, XIII Trema, XV the Den of Woe, XVI Ixion) and the five hidden ones (the experimental Leblanc `exp-leblanc`, the Experiment `ffx2-masterpiece-theatre`, Tourist Trap, Valefor at Besaid, Angra Mainyu). Seeds 1 to 500 (three processes: 1-167, 168-334, 335-500) and 1 to 12.
**Before** = the base `f939b87f` (`origin/r49-rc`: the battle sources untouched, this same test file); **after** = this branch (the snapshot of `eba04593c`, whose source equals the tip's apart from comments; the shards ran 18:07 to 18:27 on 2026-10-15). The base was run from a `git archive` of `origin/r49-rc` under `D:\Tools\ffx-parity\rc9\x2-rewards\final\base`, never from the worktree. For the seven listed chapters the 500-seed "before" shards are the earlier session's (run on the base sources at 13:02, harness at `7ca13c2d9`); this session re-ran the base on 12 seeds and got the same won-or-lost letters, wins, totals, items and per-battle sums, and re-ran the branch on all 500 seeds and got the earlier session's "after" numbers exactly: the harness is deterministic. The five hidden chapters' "before" shards were run in this session on the base. Measure, never tune: nothing was adjusted to move a number. Scratch under `D:\Tools\ffx-parity\rc9\x2-rewards\final\out`.

**1. No battle changed; what moved is what the victory pays.**
* 12 seeds on each of the twelve chapters (144 chains): the **event log of every chain is identical before and after**, with only the payload of the `victory` and `defeat` results set aside (the digest hashes every link's whole log; the pinned-log tests of section 6 say the same for the 119 logs they hold), and the won-or-lost letter of every seed is the same.
* 500 seeds on each of the twelve chapters (6,000 chains): the won-or-lost letter of every seed is the same before and after (the column "seeds whose letter differs" is 0 for every chapter), so no chain's outcome changed, and the knock-out draws on streams 10 and 11 shifted no roll (the intended lines steal nothing).

**2. Totals over the 500 seeds, summed over the won chains, before to after** (EXP, AP, gil and the number of items the chains paid):

| Chapter | won chains | EXP total | AP total | gil total | items total |
|---|---|---|---|---|---|
| ffx2-bahamut | 500 | 650,000 | 7,500 | 500,000 | 500 |
| ffx2-vegnagun-shuyin | 490 | 20,776,000 to 9,017,800 | 58,800 to 66,199 | 8,967,000 to 4,558,350 | 4,900 to 1,985 |
| ffx2-leblanc | 500 | 820,000 to 810,000 | 7,000 to 5,500 | 795,000 to 790,000 | 4,000 to 3,420 |
| ffx2-fallen-aeons | 500 | 11,500,000 | 27,000 | 3,500,000 | 2,500 |
| ffx2-trema | 363 | 8,349,000 | 18,876 | 6,534,000 | 726 to 812 |
| ffx2-den-of-woe | 500 | 2,100,000 | 10,000 | 17,600,000 | 1,500 |
| ffx2-ixion-djose | 500 | 1,300,000 | 7,500 | 900,000 | 500 |
| exp-leblanc | 500 | 820,000 to 810,000 | 7,000 to 5,500 | 795,000 to 790,000 | 4,000 to 3,420 |
| ffx2-masterpiece-theatre | 362 | 0 | 28,960 | 0 | 724 |
| ffx2-tourist-trap | 470 | 940,000 | 7,050 | 705,000 | 470 |
| ffx2-valefor-besaid | 500 | 750,000 | 7,500 | 600,000 | 500 |
| ffx2-angra-mainyu | 465 | 2,325,000 | 13,950 | 2,325,000 | 465 |

**3. Per won chain** (the means of the same runs; where one number stands, nothing moved):

| Chapter | seeds | wins (before to after) | seeds whose won-or-lost letter differs | EXP per won chain | AP per won chain | gil per won chain | items per won chain |
|---|---:|---|---:|---|---|---|---|
| ffx2-bahamut | 500 | 500 | 0 | 1,300 | 15 | 1,000 | 1 |
| ffx2-vegnagun-shuyin | 500 | 490 | 0 | 42,400 to 18,403.7 | 120 to 135.1 | 18,300 to 9,302.8 | 10 to 4.05 |
| ffx2-leblanc | 500 | 500 | 0 | 1,640 to 1,620 | 14 to 11 | 1,590 to 1,580 | 8 to 6.84 |
| ffx2-fallen-aeons | 500 | 500 | 0 | 23,000 | 54 | 7,000 | 5 |
| ffx2-trema | 500 | 363 | 0 | 23,000 | 52 | 18,000 | 2 to 2.24 |
| ffx2-den-of-woe | 500 | 500 | 0 | 4,200 | 20 | 35,200 | 3 |
| ffx2-ixion-djose | 500 | 500 | 0 | 2,600 | 15 | 1,800 | 1 |
| exp-leblanc | 500 | 500 | 0 | 1,640 to 1,620 | 14 to 11 | 1,590 to 1,580 | 8 to 6.84 |
| ffx2-masterpiece-theatre | 500 | 362 | 0 | 0 | 80 | 0 | 2 |
| ffx2-tourist-trap | 500 | 470 | 0 | 2,000 | 15 | 1,500 | 1 |
| ffx2-valefor-besaid | 500 | 500 | 0 | 1,500 | 15 | 1,200 | 1 |
| ffx2-angra-mainyu | 500 | 465 | 0 | 5,000 | 30 | 5,000 | 1 |

Most AP a single battle paid (the game credits a girl at most 99 in a battle): ffx2-bahamut 15, ffx2-vegnagun-shuyin 35 to 99, ffx2-leblanc 6, ffx2-fallen-aeons 24, ffx2-trema 50, ffx2-den-of-woe 10, ffx2-ixion-djose 15, exp-leblanc 6, ffx2-masterpiece-theatre 40, ffx2-tourist-trap 15, ffx2-valefor-besaid 15, ffx2-angra-mainyu 30.

**4. Per battle** (the results the screen would show for each battle of the chain, means over the won chains; the experimental Leblanc plays Chapter VI's battles, so its rows are Chapter VI's and are left out), before to after:

| Chapter | link | won (before to after) | EXP | AP | gil | items |
|---|---:|---|---|---|---|---|
| ffx2-bahamut | 1 | 500 | 1,300 | 15 | 1,000 | 1 |
| ffx2-vegnagun-shuyin | 1 | 490 | 5,000 | 5 | 3,000 | 1 |
| ffx2-vegnagun-shuyin | 2 | 490 | 30,000 to 6,000 | 35 to 5 | 12,000 to 3,000 | 4 to 1 |
| ffx2-vegnagun-shuyin | 3 | 490 | 7,400 to 7,403.67 | 30 to 30.18 | 3,300 to 3,302.76 | 5 to 2.05 |
| ffx2-vegnagun-shuyin | 4 | 490 | 0 | 30 to 74.92 | 0 | 0 |
| ffx2-vegnagun-shuyin | 5 | 490 | 0 | 20 | 0 | 0 |
| ffx2-leblanc | 1 | 500 | 260 to 240 | 4 to 3 | 350 to 340 | 3 to 2.04 |
| ffx2-leblanc | 2 | 500 | 480 | 4 to 2 | 460 | 2 |
| ffx2-leblanc | 3 | 500 | 900 | 6 | 780 | 3 to 2.8 |
| ffx2-fallen-aeons | 1 | 500 | 8,000 | 15 | 2,000 | 1 |
| ffx2-fallen-aeons | 2 | 500 | 9,000 | 24 | 3,000 | 3 |
| ffx2-fallen-aeons | 3 | 500 | 6,000 | 15 | 2,000 | 1 |
| ffx2-trema | 1 | 363 | 13,000 | 2 | 8,000 | 1 to 1.12 |
| ffx2-trema | 2 | 363 | 10,000 | 50 | 10,000 | 1 to 1.12 |
| ffx2-den-of-woe | 1 | 500 | 1,200 | 5 | 200 | 1 |
| ffx2-den-of-woe | 2 | 500 | 1,200 | 5 | 5,000 | 1 |
| ffx2-den-of-woe | 3 | 500 | 1,800 | 10 | 30,000 | 1 |
| ffx2-ixion-djose | 1 | 500 | 2,600 | 15 | 1,800 | 1 |
| ffx2-masterpiece-theatre | 1 | 362 | 0 | 40 | 0 | 1 |
| ffx2-masterpiece-theatre | 2 | 362 | 0 | 40 | 0 | 1 |
| ffx2-tourist-trap | 1 | 470 | 2,000 | 15 | 1,500 | 1 |
| ffx2-valefor-besaid | 1 | 500 | 1,500 | 15 | 1,200 | 1 |
| ffx2-angra-mainyu | 1 | 465 | 5,000 | 30 | 5,000 | 1 |

**5. Items**, before to after (count per won chain; "chains paying" is how many won chains paid at least one; the experimental Leblanc's rows are Chapter VI's):

| Chapter | item | before: per won chain | after: per won chain | before: chains paying | after: chains paying |
|---|---|---|---|---|---|
| ffx2-bahamut | gris-gris-bag | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-vegnagun-shuyin | mythril-bangle | 1 | 1 | 490 of 490 | 490 of 490 |
| ffx2-vegnagun-shuyin | x2-mega-potion | 2 | 0.91 | 490 of 490 | 341 of 490 |
| ffx2-vegnagun-shuyin | x2-megalixir | 5 | 2 | 490 of 490 | 490 of 490 |
| ffx2-vegnagun-shuyin | x2-x-potion | 2 | 0.14 | 490 of 490 | 65 of 490 |
| ffx2-leblanc | black-choker | 0 | 1 | 0 of 500 | 500 of 500 |
| ffx2-leblanc | charm-bangle | 2 | 0.8 | 500 of 500 | 400 of 500 |
| ffx2-leblanc | defense-veil | 0 | 1 | 0 of 500 | 500 of 500 |
| ffx2-leblanc | favorite-outfit | 0 | 1 | 0 of 500 | 500 of 500 |
| ffx2-leblanc | reassembled-sphere | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-leblanc | twist-headband | 3 | 1 | 500 of 500 | 500 of 500 |
| ffx2-leblanc | x2-grenade | 0 | 0.07 | 0 of 500 | 37 of 500 |
| ffx2-leblanc | x2-hi-potion | 0 | 0.05 | 0 of 500 | 27 of 500 |
| ffx2-leblanc | x2-potion | 2 | 0.91 | 500 of 500 | 349 of 500 |
| ffx2-fallen-aeons | crystal-gloves | 1 | 1 | 500 of 500 | 447 of 500 |
| ffx2-fallen-aeons | faerie-earrings | 2 | 1.82 | 500 of 500 | 500 of 500 |
| ffx2-fallen-aeons | pixie-dust | 1 | 1.06 | 500 of 500 | 452 of 500 |
| ffx2-fallen-aeons | regal-crown | 0 | 0.12 | 0 of 500 | 59 of 500 |
| ffx2-fallen-aeons | tetra-band | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-trema | x2-dark-matter | 2 | 2.24 | 363 of 363 | 363 of 363 |
| ffx2-den-of-woe | crystal-ball | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-den-of-woe | kaiser-knuckles | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-den-of-woe | magical-dances-vol-1 | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-ixion-djose | soul-of-thamasa | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-masterpiece-theatre | x2-elixir | 2 | 2 | 362 of 362 | 362 of 362 |
| ffx2-tourist-trap | recovery-bracer | 1 | 1 | 470 of 470 | 470 of 470 |
| ffx2-valefor-besaid | moon-bracer | 1 | 1 | 500 of 500 | 500 of 500 |
| ffx2-angra-mainyu | ribbon | 1 | 1 | 465 of 465 | 465 of 465 |

**6. Causes**, mover by mover:

* **Chapter V, the Leg (battle 2)**: the three Nodes (8,000 EXP, 10 AP, 3,000 gil and a Megalixir or a Hero Drink each) are never knocked out, so they pay nothing: EXP 30,000 to 6,000, AP 35 to 5, gil 12,000 to 3,000, items 4 to 1 (the Megalixir the Nodes would carry, and the Leg's Mythril Bangle stays). Pinned by `parity-ffx2-rewards-engine.test.ts`: over four seeds of the whole chain the engine knocks out no Node; in the 490 won chains of the 500 seeds the Leg always paid exactly 6,000.
* **Chapter V, the Body (battle 3)**: EXP 7,400 to 7,403.7 and gil 3,300 to 3,302.8: the Bulwarks (200 EXP and 150 gil each) now pay when they fall, and they fall 2.02 times a chain on average, not exactly twice; their loot is one roll each (a byte of 128: 50.2 percent before any chain, Mega-Potion or, one in eight of those, X-Potion) where two items were handed over every time: items 5 to 2.05, AP 30 to 30.2.
* **Chapter V, the Head (battle 4)**: the engine's fight revives the two Redoubts and knocks them out again and again; each knock-out pays 10 AP (EXP 0, gil 0), so the battle's AP line, 30 before, averages 74.9 and reaches the 99 cap in many chains (the most one battle paid was 35 before and 99 after).
* **Chapter VI (Leblanc, and the experimental Leblanc, which plays the same battles)**: the three Syndicate records that differed from their rows (Ormi in Act I: 240 / 2 / 230 and a Twist Headband became 220 / 1 / 220 and a Black Choker; Ormi in Act II and Logos in Act II: 2 AP became 1, and their drops became a Defense Veil and a Favorite Outfit) take the first room from 260 EXP / 4 AP / 350 gil to 240 / 3 / 340 and the second room's AP from 4 to 2; the goons and Logos in the last room are rolls (a Potion 0.91 a chain from the two goons instead of 2, a Charm Bangle 0.80 a chain instead of 2, because the old Act II Logos paid one too, and a Hi-Potion or a Grenade now and then).
* **Fallen Aeons, Trema**: the rare slots. Shiva's Regal Crown 0.12 a chain in place of the Crystal Gloves (Sandy's rare slot holds the Gloves, Cindy's the Pixie Dust), Dark Matter 2 to 2.24 a chain in Trema's two battles. The Bahamut, Den of Woe and Ixion rows have one item with a byte of 255 and the same item in both slots, so nothing moved.
* **The four hidden chapters** (the Experiment, Tourist Trap, Valefor at Besaid, Angra Mainyu): every monster has a byte of 255 (or 0), the same item in both slots, and falls once, so each pays exactly the row it paid as an authored number: nothing moved.
* The EXP, AP and gil of Bahamut, the Fallen Aeons, Trema, the Den of Woe, Ixion and the hidden chapters are exactly the rows': each of their monsters falls once.

**7. 12 seeds on every chapter** (the plan's first pass, against `origin/r49-rc`), before to after, summed over the 12 (`wins` of the 12 seeds):

| Chapter | wins (before to after) | won-or-lost letters equal | event logs equal | EXP | AP | gil | items |
|---|---|---|---|---|---|---|---|
| ffx2-bahamut | 12 of 12 | yes | 12 of 12 | 15,600 | 180 | 12,000 | 12 |
| ffx2-vegnagun-shuyin | 12 of 12 | yes | 12 of 12 | 508,800 to 220,800 | 1,440 to 1,589 | 219,600 to 111,600 | 120 to 47 |
| ffx2-leblanc | 12 of 12 | yes | 12 of 12 | 19,680 to 19,440 | 168 to 132 | 19,080 to 18,960 | 96 to 82 |
| ffx2-fallen-aeons | 12 of 12 | yes | 12 of 12 | 276,000 | 648 | 84,000 | 60 |
| ffx2-trema | 10 of 12 | yes | 12 of 12 | 230,000 | 520 | 180,000 | 20 to 24 |
| ffx2-den-of-woe | 12 of 12 | yes | 12 of 12 | 50,400 | 240 | 422,400 | 36 |
| ffx2-ixion-djose | 12 of 12 | yes | 12 of 12 | 31,200 | 180 | 21,600 | 12 |
| exp-leblanc | 12 of 12 | yes | 12 of 12 | 19,680 to 19,440 | 168 to 132 | 19,080 to 18,960 | 96 to 82 |
| ffx2-masterpiece-theatre | 10 of 12 | yes | 12 of 12 | 0 | 800 | 0 | 20 |
| ffx2-tourist-trap | 12 of 12 | yes | 12 of 12 | 24,000 | 180 | 18,000 | 12 |
| ffx2-valefor-besaid | 12 of 12 | yes | 12 of 12 | 18,000 | 180 | 14,400 | 12 |
| ffx2-angra-mainyu | 11 of 12 | yes | 12 of 12 | 55,000 | 330 | 55,000 | 11 |

The won-or-lost letter of each of the 12 seeds is the same before and after in every chapter, and so is every event log (the column "event logs equal": seeds with the same digest).


**8. The reward abilities** (100 seeds, 1 to 100, measured earlier in the lane on the code that is now the tip apart from comments; the ability words laid on the three girls after each link's `init`, the combat untouched; the same engine without and with the words):

| Variant | Chapter | wins | EXP / chain | AP / chain | gil / chain | items / chain | items by id (per chain) |
|---|---|---|---|---|---|---|---|
| hunter: Item Hunter on all three girls (+64 each on the drop byte) | ffx2-vegnagun-shuyin | 95 to 95 | 18,402.1 | 133.4 | 9,301.6 | 4 to 5 | x2-mega-potion 0.84 to 1.76; x2-x-potion 0.14 to 0.25 |
| hunter: Item Hunter on all three girls (+64 each on the drop byte) | ffx2-leblanc | 100 to 100 | 1,620 | 11 | 1,580 | 6.8 to 8 | charm-bangle 0.75 to 1; x2-grenade 0.08 to 0.09; x2-hi-potion 0.05 to 0.13; x2-potion 0.89 to 1.78 |
| butterfingers: Butterfingers on all three girls (the rare slot is certain) | ffx2-vegnagun-shuyin | 95 to 95 | 18,402.1 | 133.4 | 9,301.6 | 4 | x2-mega-potion 0.84 to 0; x2-x-potion 0.14 to 0.98 |
| butterfingers: Butterfingers on all three girls (the rare slot is certain) | ffx2-fallen-aeons | 100 to 100 | 23,000 | 54 | 7,000 | 5 | crystal-gloves 0.98 to 1; faerie-earrings 1.85 to 1; pixie-dust 1.02 to 1; regal-crown 0.15 to 1 |
| butterfingers: Butterfingers on all three girls (the rare slot is certain) | ffx2-trema | 74 to 74 | 23,000 | 52 | 18,000 | 2.4 to 4 | x2-dark-matter 2.35 to 4 |

## 8. Disclosures, in player words

What a player of the shipped chapters sees change, in plain words (the numbers are the 500-seed tables of section 7, per won chain):

1. **A monster pays when it falls, so one that is still standing pays nothing.** Chapter V's second battle (the Leg) used to add the three Nodes to its results (they carry 300,000 HP each and the fight never asks you to kill one): that battle read 30,000 EXP, 12,000 gil, 35 AP and 4 items. It now reads the Leg's own 6,000 EXP, 3,000 gil, 5 AP and 1 item. Over the whole Chapter V chain the EXP line reads about 18,400 (it read 42,400), the gil about 9,300 (18,300) and the items about 4 (10). This is the biggest change of the lane; it follows from the game's rule (the roll runs in the knock-out, and the three callers of that routine do not include the end of a battle), and it is the second decision below.
2. **The Head's two Redoubts fall again and again in the engine's fight, and each fall pays its 10 AP** (EXP and gil are 0). A girl is credited at most 99 AP in a battle, so that battle's AP line, 30 before, averages 75 and reaches 99 in many chains; over Chapter V the AP line reads about 135 (120).
3. **Loot is a roll.** Dr. Goon and Fem-Goon drop their Potion about half the time (byte 128, 50.2 percent before any chain; a Hi-Potion or a Grenade now and then in the rare slot), the two Bulwarks together a Mega-Potion 0.91 times a chain and an X-Potion 0.14 times (they used to hand over two of each, every chain), Logos in the last room his Charm Bangle four times in five (byte 192 plus the chain). Every boss with a byte of 255 still drops one item every time, but where its second slot holds another item, that one shows up about one time in eight (more after a long chain): Shiva's Regal Crown in place of the Crystal Gloves (0.12 a chain), Sandy's Crystal Gloves, Cindy's Pixie Dust, Paragon's and Trema's second Dark Matter (2.24 Dark Matter a chain in Chapter XIII instead of 2), the Nodes' Hero Drink and the Bulwarks' X-Potion where they fall.
4. **Ormi and Logos in the Syndicate's first two rooms pay what their rows say**: Ormi in the first room 220 EXP, 1 AP, 220 gil and a Black Choker (it paid 240, 2, 230 and a Twist Headband); Ormi in the second room 1 AP and a Defense Veil; Logos in the second room 1 AP and a Favorite Outfit. The first room reads 240 EXP, 3 AP and 340 gil instead of 260, 4 and 350, the second room 2 AP instead of 4.
5. **A girl who is down or turned to stone when a battle ends loses the EXP she earned in it** (AP already credited stays). Today's screen does not show per-girl EXP, so this is not visible yet (section 9).
6. **A girl's own knock-out moves the dice of the next steal, Pilfer Gil or Bribe** (the game takes a stream-10 draw for it). Invisible, but a seeded replay of a fight that steals after a fall differs. The intended lines of the shipped chapters steal nothing, so no chapter's fight moved (section 7).
7. **The reward abilities work** but no shipped build wears one (the Thief's Item Hunter, learned, is the one a shipped dressphere teaches): Gillionaire doubles the gil per girl who has it (times eight for three), Double Items the same for potions and the like, Double EXP and Double or Triple AP count for the girl who has them (times six together, still capped at 99), Item Hunter adds 64 of 255 to the drop byte per girl, Butterfingers makes the rare item certain.
8. **Nothing else moves.** Chapter IV (Bahamut), Chapter XV (the Den of Woe), Chapter XVI (Ixion) and the four hidden chapters (the Experiment, Tourist Trap, Valefor at Besaid, Angra Mainyu) pay exactly the EXP, AP, gil and items they paid; Chapters XI and XIII pay the same EXP, AP and gil and only the items change (point 3).

## 9. What the release driver would need

No new screen was added and none was touched. What a player sees on today's results screen after this lane: the **EXP** line is the sum of the monsters that fell (not the ones still standing), the **AP** line is the AP of the best-credited girl
(capped at 99 a battle), the **GIL** line is the kills' gil (times two for each Gillionaire) plus the Pilfer Gil taken, and the **ITEMS** line is what the rolls dropped, an item per roll rather than every listed item. Items the engine has no item row for
(every accessory and key item: the Black Choker, the Regal Crown, the Favorite Outfit, the Defense Veil ...) print as their title-cased ids, as the Charm Bangle always did.

The screen items, which need the mockup Bailey's Q9 asked for first (decision 1 of section 12 lists them as the driver's mockup item):
1. **Per-girl lines**: `BattleResult.rewardsByMember[girlId] = { exp, ap }` is filled (EXP after the end-of-battle rollback: a girl who is down or turned to stone loses hers; AP as credited, capped at 99). Nothing reads it yet. In a chained fight `chainSpoils` (`app/screens/BattleChainSpoils.ts`) sums the totals but copies only the last battle's `rewardsByMember`: the screen task must sum the per-girl figures across the links.
2. **The AP figure** is one number for three girls; with Double AP or Triple AP on one girl they differ.
3. **Pilfer Gil**: the game banks it in the wallet and its results show only the kills' gil; today's line adds it.
4. **The new drops** print as ids without an item card.
5. **A girl who is down at the end** shows her full EXP in the old rows (`buildMemberRows` gives every member `result.exp`); the game takes it from her.

**Merging with the other FFX-2 lanes.** The hot spots are the four pinned-log tests (`ffx2-atb-golden`, `ffx2-menu-cancel-delay`, `ffx2-hit-closes-menu`, `chapters/den-of-woe-carry`: their hashes move with every lane that changes a `victory` payload or a roll, and this lane's arrays are the base's with the result payload changed), `battle/ffx2/internal.ts` (391 lines), `adapt/menu.ts` (the tag table), `results.ts`, `common/types.ts` and `docs/CONTRACT-CHANGES.md`. After a merge, run those four files: where a digest differs from the merged pins, the scratch ablation (a copy in `D:\Tools\ffx-parity\rc9\x2-rewards\`; it replays every pinned log twice, as it is and with each `victory` result put back to what the old `buildResult` made from the same board, and compares the second hash with the pins in the test files beside it, so put the base's copies of the four files beside it, as `final\abl` does) says whether this lane's result payload is the only difference; a merge that moves any other event is another lane's cause and needs its own paragraph in the test file.

## 10. Stale text and mirrors

* `research/ffx2-combat-core.md` lines 1176 (Item Hunter "raises post-battle item drop odds": it is +64 of 255 on the drop byte per owner, never on the rare share), 1704 and 1705 (Gillionaire and Double Items "stack": x2 per owner; Double Items doubles consumables only, wider than "accessories excluded"), 3312 ("Double AP, AP Egg, Key to Success ... stack the way the gil/item doublers do": AP is per girl, x2 and x3 on one girl make x6, nothing stacks across girls, and a girl is capped at 99 a battle), 3321 to 3323 (the same, and "you keep rewards from enemies defeated before fleeing": consistent with the code read, the flee path is untraced). Not rewritten (player-facing wording and the research are Bailey's).
* `research/ffx2-vegnagun-shuyin.md` line 1016 ("each Vegnagun part gives 3,000 gil"): the Nodes' row says 3,000 gil, but a Node that is never killed pays nothing.
* The guides (`src/data/guides/docs/ffx2-*.ts`) list one drop per enemy: still the common slot, still right.
* `docs/handoff/re-parity-rc7-x2auto.md` and the other lanes' notes are untouched.

## 11. Open items

1. **The spending of AP into the worn dressphere's abilities** (0x00635510, 0x00635430, 0x00635690): decompiled and proved in the note (30,000 and 8,000 vectors), not wired. It needs the AP held per ability and a learn target per girl and dressphere, which the build's data does not have (one `ap` number per dressphere), and it can make an ability usable in the middle of a battle (the mastery event) and draw on the girl's own stream through the stats refresh (open question 10). A progression lane, with its own mockup for what the player sees.
2. **The flee and teardown trigger** (G03 open question 2): the FFX-2 engine has no flee outcome (a battle ends in victory or defeat), so nothing is paid on an escape; if a flee path is added, whether the buffer reaches the results screen is unread. Not guessed.
3. **The pay-nothing death kinds** (question 8): Steal Will and Bribe are wired by the note's reading of the two command ids (the Bribe never ejects in the engine yet); a script's own "leave" command (the Syndicate's Acts I and II) is not modelled (those enemies fall by HP here and pay, as the note's own table assumes). Not guessed.
4. **A girl's knock-out takes the stream-10 draw** (summary 1 of the note, read from the routine, which does not test the victim): it moves later steals, Pilfer Gil rolls and Bribe rolls. The note's G05 harness runs show the precondition (`Chr+0x13` set) on the characters it used; that a real girl has it is read, not seen. One live check settles it: a girl falls, then a steal; does the steal's draw move?
5. **The self-kill command** (row 0x80, `pcom_Kamikaze`) pays nothing in the game; no shipped monster lists it and who can use it was not traced (open question 12).
6. **The Special dresspheres' parts as owners** (open question 4) and **a Petrified character's knock-out resolution** (the note's table names the call, not when it runs).
7. **The fourth user of the shared streams** (live 0x61A960, command 0x31DA, one stream-10 draw) and any routine that picks stream 10 or 11 from a variable (open question 12) are not modelled.
8. **No shipped build wears a reward ability.** The grid tags are wired through the existing tag table, but the three grids that carry them (Covenant of Growth, Ray of Hope, Treasure Hunt) are on no shipped girl; AP Egg (0x906f, Triple AP) and the accessory the notes call Key to Success (0x9077, "double all") are not in the engine's accessory data; the Thief's Item Hunter is the one reward ability a shipped dressphere teaches. The measurement lays the words on the girls to show the effect (section 7).
9. **XE3** (Act III Ormi, Logos and Leblanc revive in place and pay again at the next kill) waits for the stat-setter lane; the roll already pays a second knock-out.
10. **`chainSpoils` and the per-girl figures** (section 9, item 1): the pooled result of a chained fight carries the last battle's `rewardsByMember`; the screen lane sums them.
11. **The stats refresh's draws** (question 10): not modelled, because no refresh runs while the spending is not wired.
12. **Stale text**: section 10.

## 12. Decisions for Bailey

The driver's mockup item comes first; the others are the lane's findings, each with a recommendation in the style of Bailey's "all your recommendations".

1. **Results screen: the per-girl EXP and AP lines (Q9, accepted as "mockup first, then yes"; the driver's mockup item).** The data is ready and nothing reads it: `BattleResult.rewardsByMember[girlId] = { exp, ap }` for every won battle (EXP after the end-of-battle rollback, AP as credited and capped at 99). Today's screen is unchanged: one EXP total with "x3 PARTY", one AP figure "per dressphere", the gil, the items. The mockup has to settle: (a) the girls' own lines, EXP and AP on each girl's row (they differ only when a girl wears Double EXP, Double AP or Triple AP, is Pointless, was ejected, or is down at the end); (b) what a girl who is down or turned to stone when the fight ends shows, because the game takes her EXP back (her row would read 0, or struck out, where today's `buildMemberRows` gives every member the full figure); (c) what the one AP figure says when the girls differ (today it is the best-credited girl's); (d) whether Pilfer Gil gets its own small line (the game banks it in the wallet at once and its results show only the kills' gil; today's gil line adds it); (e) how the new accessory drops read (Black Choker, Regal Crown, Defense Veil, Favorite Outfit ... print as title-cased names and have no card). One engineering note for that screen: in a chained fight (Chapter V has five battles) `chainSpoils` pools the totals but carries only the last battle's `rewardsByMember`, so the per-girl figures must be summed across the links the way the totals are. Recommendation: one mockup of the party list with those five things, then yes.
2. **A monster still standing when the battle is won pays nothing.** It is the game's rule, and it takes Chapter V's totals down by more than half (EXP about 42,400 to 18,400, gil 18,300 to 9,300, items 10 to 4 per won chain): the Leg's three Nodes, which the fight never asks you to kill, are no longer paid, while the Bulwarks and the Redoubts pay each time they fall. There is no switch, because the old reading (pay every part at the victory) is not the game's. Recommendation: keep.
3. **The Head's Redoubts pay 10 AP each time they fall, up to the 99 AP a girl is credited in a battle.** The engine's Head fight revives them and knocks them out again (the boss-AI lane's reading of the game's script), so that battle's AP line averages about 75 where it read 30. It follows the rule; if the Redoubts' revival is ever corrected, the AP follows. Recommendation: keep.
4. **The new drops have no item cards.** The accessories the rows can drop (the Regal Crown, Black Choker, Defense Veil, Favorite Outfit, Ribbon, Moon Bracer, Recovery Bracer ...) have no item row in the engine: they print as title-cased names on the ITEMS line, as the Charm Bangle always did, with no description or art. Recommendation: an item-rows task with the accessory cards only if Bailey wants them described (new content, rule 10).
5. **The spending of AP into the worn dressphere's abilities** (decompiled and proved, not wired): it needs the AP held per ability and a learn target per girl and dressphere, which the build's data does not have, and it makes an ability usable the moment it is mastered, in the middle of a battle, with the game's learn message. A progression lane with its own mockup. Recommendation: not now; ask when the dresspheres and progression lane is next up.
6. **A girl's own knock-out takes the game's stream-10 draw** (it moves the next steal, Pilfer Gil or Bribe on the same seed, and nothing else). Read from the routine, which does not test the victim; one live check (a girl falls, then a steal: does the steal's draw move?) would confirm it. Recommendation: keep; add the check to the next live session's list.

## 13. Re-run

From the worktree root (`D:\Final Fantasy\.claude\worktrees\re-parity-ai-ffx-c`), Git Bash, tools by path, `TEMP` and `TMP` on `D:`:

```
export TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx2-rewards-kernel.test.ts tests/unit/parity-ffx2-rewards-data.test.ts tests/unit/parity-ffx2-rewards-engine.test.ts tests/unit/parity-ffx2-rng-streams.test.ts tests/unit/data-ffx2-citations.test.ts tests/unit/data-ffx2-monster-records.test.ts tests/unit/ff7-class-a.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ff7-golden.test.ts tests/unit/chapters/den-of-woe-carry.test.ts tests/unit/ffx2-hit-closes-menu.test.ts tests/unit/ffx2-menu-cancel-delay.test.ts
node tools/orphans.mjs
```

The measurement (one seed range, one variant; the same file runs on the base commit; it prints a digest per seed): `PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-167 [PYREFLY_X2C_VARIANT=hunter|butterfingers|gillionaire|doubles|triple] PYREFLY_MEASURE_CHAPTERS=<id,id> PYREFLY_MEASURE_OUT=<file> node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 tests/unit/ffx2-rewards-measure.test.ts`. The base is a `git archive` of `origin/r49-rc` (`src` and the configs) with the same test file and a `node_modules` junction, under `D:\Tools\ffx-parity\rc9\x2-rewards\final\base`; the branch's own snapshots are `head` and `head12`, the mutation sandbox `mut` and the ablation tree `abl` (the scratch is never inside the repo). The five `node_modules` junctions were removed with `rmdir` after the runs (`D:\Final Fantasy\node_modules` checked intact: 84 entries before and after); to repeat a run, make one with `cmd /c mklink /J node_modules "D:\Final Fantasy\node_modules"` inside the snapshot and `rmdir` it after, never a recursive delete.
Scratch under `D:\Tools\ffx-parity\rc9\x2-rewards` (`dump_rewards.py` reads the rows, `make_fixture.py` builds the vector fixture, `gen_ts.py` writes the data file) and `final\` (`mut2.py` is the mutation pass on a snapshot, `make_tables.py` and `build_measure.py` merge the shards and write section 7, `note_vs_fixture.py` compares the reader's rows with the note's table 5.1 (36 of the 42 rows are tabulated there and agree field for field; the six hidden-chapter rows are pinned by their own chapters' fixtures), `classify_suite.py` and `suite_summary.py` read a suite run's report).

## 14. CHANGELOG paragraph

**FFX-2 only.** Kills now pay the way the game pays them. A monster's EXP, AP, gil and loot arrive the moment it falls, not when the battle is won, so a monster still standing at the end pays nothing: the three Nodes of the Vegnagun Leg, which the fight never asks you to kill, no longer add 24,000 EXP and 9,000 gil to that battle. Loot is now a roll with the game's own numbers: Dr. Goon, Fem-Goon and the two Bulwarks drop about half the time, Logos in the last room about four times in five, every other boss's item is certain, and where a monster carries a rarer second item (Shiva's Regal Crown, Sandy's Crystal Gloves, Cindy's Pixie Dust, Paragon's Dark Matter, Trema's second Dark Matter, the Nodes' Hero Drink, the Bulwarks' X-Potion) it turns up about one time in eight, more after a long chain; the Bulwarks no longer hand over both of their items at once. Each girl is credited her own AP, at most 99 in a battle, and a girl who is down or turned to stone when the fight ends loses the EXP she earned. The reward abilities now do what they say: Gillionaire doubles the gil for every girl who has it (times eight with three), Double Items doubles potions and the like the same way, Double EXP and Double or Triple AP count for the girl who has them, Item Hunter raises the chance of a drop, and Butterfingers makes the rare item certain. Ormi's first fight pays 220 EXP, 1 AP, 220 gil and a Black Choker, and Ormi and Logos in the second room pay 1 AP each and a Defense Veil and a Favorite Outfit. The hidden chapters (the Experiment, Tourist Trap, Valefor at Besaid, Angra Mainyu) pay what they paid. The results screen is unchanged for now (the per-girl lines wait for its mockup), and nothing a shipped build wears uses the reward abilities yet.
