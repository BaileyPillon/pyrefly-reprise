# Re-parity W2: the FFX engine takes its turn order, statuses and per-turn ticks from the game's own kernels

Status: **built and committed on branch `re-parity-w2` (from `bd908802`, 2026-10-09), merged with release candidate 1 (`origin/re-parity-rc1`, 2026-10-10: see "Merged onto release candidate 1" below) and pushed to `origin/re-parity-w2`; not deployed**. Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-review.md) row W2). Owner: Bailey.
**Game case: FFX only** (AGENTS.md rule 14). FFX-2 and FF7 do not import any module this batch touched; `ffx2-atb-golden` and `ff7-golden`
pass unchanged.

Bailey, 2026-10-08, the ask this track answers: "It needs to be a 1:1 parity." On 2026-10-09: "Full speed ahead you don't need to conserve".

Commits (all on `re-parity-w2`; the table is the 2026-10-09 branch before the merge, which is described after it):

| Commit | What |
|---|---|
| `608ee073` | The per-turn tick kernels (end of turn, start of turn with Regen and the stances, the Threaten link, Poison, Doom, action done) run against the exe's machine code; research note section 14 |
| `762415e2` | The measurement harness takes `PYREFLY_MEASURE_SEEDS` and `PYREFLY_MEASURE_CHAPTERS` |
| `e8ec8c2b` | The game's command records carry the CTB rank, the status chances and durations, the extra-status word, the stage buffs and the buff flags for 452 abilities; the fixture of the 979 records |
| `2928f5bb` | Checkpoint: the engine takes the turn order, status infliction and per-turn ticks from the kernels |
| `e052f8e7` | Checkpoint 2: the engine-level oracles for the status step and the ticks; Banish and the shatter through the step's decision |
| `788edf20` | Double HP and Double MP honour Break HP and MP Limit; a Doom command at a Doom-proof boss asks for no countdown; three stale status texts |
| `5a5ab8f0` | The chain carry: a Tonic's doubled pool is capped like the game's, so the seam carries the base maxima |
| `e54e7f19` | The tests that pinned the old turn order, status rolls or ticks pin what the game's code does, each with its reason |
| `0163b4b1`, `f11c892d` | Research note section 15 and the CONTRACT-CHANGES entry; the `advisor-note` seed |
| `09bf0adb` | `ffx-engine-golden` re-baselined |
| `717ed360` | The shatter chance is the command record's byte 0x2c |
| `9bd5b576` | A Regen that lands resets its holder's tick counter (found by the cause tally) |
| `214d8915` | The cause tally and its compare tool |
| `6171dedb` | The status oracle runs 5,000 hits and carries a landed Threaten's decay to the next hit; Double HP / MP cases |
| `939f0eb8` | `natus-bench`: the old midpoint party compares with "not behind" |
| `e070c72a` | This note |
| `06210431` | The note's list of deleted engine code names only what is gone (the head of the branch before the merge) |
| `4197e783` | The merge of `origin/re-parity-rc1` (`931613a8`), conflicts resolved, the seams fixed and pinned, the goldens and the seed pins re-derived, this section |

## Merged onto release candidate 1 (RC2-W2, 2026-10-10)

Bailey, 2026-10-09: "Your findings need to be implemented into live builds as the decompilation work progresses." and, 2026-10-10, "ok keep going please".
This lane makes W2 the base of the next release candidate: `origin/re-parity-rc1` (`931613a8`, release candidate 1 folded into the release driver's final
build `a74b2b8e`) is merged into `re-parity-w2` (`06210431`) by a real merge commit (`4197e783`; no rebase, no squash), the 19 conflicts resolved as the RC1
handoff said, and every W2 check run again on the merged tree. Pushed to `origin/re-parity-w2`; not deployed; no production build (D: has 2.9 GB free).
**Game case (AGENTS.md rule 14): FFX only.** `ffx2-atb-golden`, `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`, `chapters/den-of-woe-carry` and
`ff7-golden` pass unchanged; the FFX-2 and FF7 engines reach none of the files this merge touched but `src/battle/common/types.ts` (interfaces and optional
members, merged by git without a conflict).

### M.1 The 19 conflicts, and how each was resolved

| File | Resolution |
|---|---|
| `docs/CONTRACT-CHANGES.md` | Both sides' entries kept, newest first by commit time (W2's two entries sit between AI-Seymour's 18:01 entry and lane B's, and above the driver's phone-fit entry), plus this merge's entry on top. **Proved by line sets: 0 non-blank lines of either side (2,308 and 2,473) missing from the result** |
| `src/battle/ffx/abilities.ts` | The `HitScope` literal carries all three: W2's `rank` and `records`, the scripts' `touched` |
| `src/battle/ffx/hit-apply.ts` | The scripts' `holdsDeathForHook` import and `Touched` tally; `HitScope` has the three fields; the revival and the Zombie kill are W2's (the kernel's Death bit decides, then `applyStatusStep`), which drops the old `else if (has(target, 'zombie'))` branch the scripts had only added `...holdKo` to (open item 1) |
| `src/battle/ffx/engine-end.ts` | The scripts' reaction drains around `inReaction` and after the Poison tick, W2's `onTurnEnd(ctx, actor, command !== undefined)` |
| `src/battle/ffx/forms.ts` | The scripts' rule that Braska's Final Aeon's change writes no CTB and Yunalesca's writes boss 0 / party +1, on W2's byte counters (clamped at 255); both `normalise` calls gone |
| `src/battle/ffx/state.ts`, `runtime.ts` | W2's `state.ts` (the interfaces live in `runtime.ts`); the scripts' three edits to those interfaces applied there: `guardMark` replaces `damageCapPerHit`, `hpFloor` and `coversAllyId`, `inReaction` and `formDiedAtSeq` are added |
| `src/battle/ffx/ticks.ts` | `onTurnStart`: the tick, then the scripts' pre-turn hooks, then Doom (M.2 item 3); `onTurnEnd`: the kernel's Poison tick, and the monster's `postPoison` hook right after a tick that took HP (M.2 item 2); the scripts' removal of `runOmnisTurnEnd` kept (Omnis's discs turn from the script's `onHit`) |
| `src/data/ffx/command-records/enemies.ts` | W2's records (every line carries `rank` and the status bytes) plus lane C's four Summon dummies (0x4090, 0x408c, 0x408b, 0x408f), rank 3 from W2's fixture of the game's 979 records |
| `src/engine/tactics/advisor-roll.ts` | The header's two bullets: W2's FFX wording and W3's FFX-2 wording |
| `tests/unit/ffx-engine-golden.test.ts` | Both lanes' header paragraphs, a new one for this merge, the table re-pinned once (M.4) |
| `tests/unit/ffx-parity-measure.test.ts` | The scripts' seed reading (a range `1-500` or a list; a bare number is that one seed, not a count); `ffx-parity-cause.test.ts` reads it the same way |
| `tests/unit/chapters/sin-fins-engine.test.ts` | The scripts' list of statuses that stop the Fin's counter, and W2's Petrify on Auron; the Fin gets a Poison byte (M.3) |
| `tests/unit/ffx-ai.test.ts` | The scripts' cycle-state tests, with W2's `giveStatus` where they called the deleted `applyStatus` |
| `advisor-note`, `advisor-v4-card`, `ffx-overdrive-menu-rows`, `guide-advisor-target-agreement`, `presenter-vitals-hp-ceiling`, `strategy-seymour-flux` | Seed pins both lanes had moved, **re-derived on the merged engine from the rule each stands for** (M.3), each with the history of both sides in its comment |

### M.2 The seams a textual merge gets wrong without a conflict marker

A merge that compiles can still be wrong: each of these is a rule one line wrote against the other line's old code. `tests/unit/re-parity-w2-rc1-merge.test.ts` (11 tests) pins
them; every test was mutation-checked (the change that breaks it is named in the test's title, and each of the 10 mutants fails the test it should, restored byte for byte, sha1 checked).

| # | Seam | What the merge does |
|---|---|---|
| 1 | **The scripts' boss openings and the kernel's opening.** Lane C's start hook (Yojimbo, Isaaru's aeons, Genais, Sin's face), lane B's possession openings and AI-Seymour's Macalania opening write "boss 0, party +1 or +2" after the engine's opening pass, and called W2's deleted `normalise` to rebase. | The opening pass is the game's 26 fixed draws on byte counters now. The writes stand as they are, a counter pushed back is clamped at 255 (`ai/opening.ts`, `ai/possession-setup.ts`, `ai/macalania-rules.ts`); the old rebase only shifted every counter by the same amount and never changed an order. The compiler found it (three errors) |
| 2 | **`postPoison`.** The scripts call a monster's hook right after its own Poison tick (Macalania's Seymour); W2 moved the tick into the kernel adapter, so the hook's place was gone. | `adapt/ticks.ts#endOfTurn` returns whether the tick took HP and `ticks.ts#onTurnEnd` runs the hook then: not for a passed turn, not without Poison, not for a Poison byte of 0 |
| 3 | **`preTurn` and the start-of-turn tick.** The scripts ran their pre-turn hooks first, before Regen's payout; W2's tick is the game's. | **The exe's `pp_BtlTurnStart` (VA 0x00792a90) calls the tick (0x007af4f0), then requests the scripts' pre-turn entry, then Doom's tick (0x00799cd0)**: the hooks run after the tick and before Doom. No golden digest and no parity file moved by the change |
| 4 | **Threaten and the can-act test.** W2 took Threaten out of `canAct` (the pair is released as the turn opens, so a Threatened character takes its turn). The scripts' gate `canQueue`, the enemy Cover and the orders had used `canAct`'s refusal of Threaten, and the exe's `pp_BtlCanAct` (VA 0x007b24a0) is asked with its not-Threatened flag by every caller (counter queue, Cover, range check, Auto-Potion, Auto-Med, Auto-Phoenix). | New `canQueueAction` (`predicates.ts`) = `canAct` and not Threatened; the three call sites use it; `canAct` stays W2's. Six of the scripts' tests failed without it (a Threatened Evrae, Yojimbo, Isaaru's aeons, a Fin, Yu Yevon and Yunalesca queued reactions); the PR-0004 source-text pin points at the new gate |
| 5 | **The mount's recovery (AI-Seymour open item 8).** The mount copies Flux's counter when its turn is requested and must be charged the dummy Command 150's rank 3, not the performed move's. | W2's `charge` adds `rank * tick speed` to the running counter, so the copy survives; all four moves the mount can perform (Slowga, Full-Life, Cross Cleave, Total Annihilation) and the pass are rank 3, the rank of record 0x608c (the fixture row is the proof). Chapter I: 499 of 500 on the merged tree (500 on RC1) |
| 6 | **Hit scopes.** W2's `rank` and `records` and the scripts' `touched` are three fields of one object. | Pinned by the type checker (the test helper `inflict` builds a scope by hand and needed `touched`) |
| 7 | **Found by W2's own oracle on the merged ability pool:** a Regen that lands in the hit that kills its holder did not reset the holder's tick counter (the status itself is never added to the dead target, so the reset had been skipped with it). | The reset belongs to the write-back, which runs before the death handler: moved ahead of the dead-target check in `adapt/status-apply.ts`. Not observable in play (a dead holder has no Regen; a fresh Regen resets again), but the oracle is the exe's |
| 8 | **Evrae's Stone Gaze record.** W2 re-attached the ability to record 0x6062; lane C's class fixture and override table had the old record. | The override `0x6062: 3` and five fixture rows (0x6062, 0x609e, 0x609f, 0x60d2, 0x60f6), numbers only, read from the same game tables the fixture was made from |

### M.3 Tests changed by the merge, and why

| Test | Change | Reason |
|---|---|---|
| `re-parity-w2-rc1-merge` (new, 11 tests) | the seams above | M.2 |
| `advisor-note` | the 16-decision board is seed 14 (was 7; W2's branch 8 and 1); the "then raise" sentence is seed 108 (was 218) | the same boards, reached by other seeds: seeds 1 to 13 miss a card (5, 9 and 11 only the Poison Fang one); none of 1 to 107 shows the timing sentence within 20 decisions. Nothing about the advisor changed |
| `advisor-v4-card` | seed 3's first menu is Holy Water on Yuna (was Kimahri) | the Zombie is Yuna's now; the card's own rule is to clear a healer's Zombie at once |
| `guide-advisor-target-agreement` | seed 2, label Tidus (was seed 9, Kimahri) | seed 2's opening puts the first Holy Water on Tidus, the premise the test was written on; the label is the rule's witness |
| `presenter-vitals-hp-ceiling` | Chapter VIII seed 2 (W2's branch 3, the scripts' 2) | the first of seeds 1 to 60 that reproduces the evidence log's four commands |
| `chapters/macalania-engine` A-8 | seed 1 (W2's branch 3) | the first of seeds 1 to 40 whose act three has a Multi- cast that lands both hits |
| `chapters/evrae-engine` C-8 | the Auto-Haste half takes Petrify off the party | the victim is the script's pick now, and Rikku's armour (Al Bhed Bracer) wears Stone Ward; with her picked the Petrify rider shows nothing (nine of 60 seeds showed nothing; the three looked at all picked her). The claim (Auto-Haste blocks the Slow) is the seed-free one |
| `chapters/sin-fins-engine` NEAR Negation | the Fin gets a Poison byte | it carries every status the test forces on, no longer Sleep (the scripts' list), so it takes a turn and a Poison tick, which W2 makes an error without the byte; the test is about what Negation takes |
| `re-parity-ai-possessed` (2 tests) | the reference counters are redone from the same seed | the old reference relied on the 'scripted' start being jitter-free; it is the game's 26 draws now |
| `re-parity-ai-bfa`, `re-parity-ai-yunalesca`, `ffx-ai` | `giveStatus` for the deleted `applyStatus` | setup helper only |
| `ffx-round04-engine` | the PR-0004 call-site pin reads `canQueueAction` | M.2 item 4 |
| `strategy-seymour-flux` | measured counts in the titles and comments (40 of 40 for seeds 1 to 40; 158 of 160 over the four windows, was 160) | floors unchanged (36 and 144): nothing tuned |
| `strategy-guide` ("explains most of what it recommends") | the walk is seed 1 (was 42) | seed 42's battle is one of the six short ones in seeds 1 to 40 (38 decisions, 17 with a citation = 0.447); 34 of the 40 are above a half and the pool is 1,127 of 1,965 = 0.574, so the rule holds and the single battle is the variable one |
| `chapters/sin-fins-core-bench` (the dry-Auron seam) | seeds 1, 2, 3 and 9 (were 1 to 4) | the seam (Auron short of 12 MP with an Ether in the bag, link 3, the Core unbroken) comes up on seeds 9, 12, 13 and 14 of the first 16 and none of the 16 leaves him Defending dry |
| `chapters/evrae-breath-hold` (seed 8) | seed 3 (12 menus on the board; seed 7 has 10) | seed 8's battle holds for a charged breath on none of its menus now; the card's rule (answer with the line, never name Evrae) is unchanged |
| `ffx-engine-golden` | all 18 digests re-pinned once | M.4 |

### M.4 Goldens

`ffx-engine-golden`: the merged tree against release candidate 1's table: **all 18 digests move**, which is the merge doing what W2 does (the opening is 26 draws, a landed hit runs the infliction step and its draws, the clock picks
by a byte counter and the game's tie key); the scripts on top are unchanged, which the 24 AI parity files and the combined hooks test show. Five outcomes moved on seeds nobody tuned: `yunalesca#1` defeat to victory,
`braskas-final-aeon#1` link 1 defeat to seven victories, `seymour-natus#7` defeat to victory, `seymour-omnis#7` defeat to victory, `isaaru-via-purifico#1` link 3 victory to defeat; the other 13 keep their outcome.
One seed is one sample: M.5 has the rates. Re-pinned once, with the reason in the header. The old values are RC1's (`931613a8`) and W2's (`06210431`) in git history.
`ffx2-atb-golden` (60), `ffx2-hit-closes-menu` (9), `ffx2-menu-cancel-delay` (36), `chapters/den-of-woe-carry` (32) and `ff7-golden` pass unchanged.

### M.5 Measurement (the shipped `intendedStrategy`, whole chain; deterministic)

**500 seeds** (`PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500`), the merged tree against release candidate 1 (its own run, seed by seed: `D:\Tools\ffx-parity\rc1-final\ffx-500-merged.json`), with W2's own move on the old scripts beside it
("real" = beyond 3 sd of the difference of two samples, "borderline" = 2 to 3):

| Chapter | RC1 wins | merged | change | sd | party turns RC1 to merged | party KOs RC1 to merged | W2 alone on the old scripts (its own change) |
|---|---|---|---|---|---|---|---|
| I Seymour Flux | 500 | 499 | -1 | -1.0 | 46.7 to 48.8 | 0.6 to 0.5 | 131 to 144 (+13) |
| II Yunalesca | 483 | 494 | +11 | 2.3 borderline | 162.9 to 164.5 | 12.7 to 12.7 | 499 to 497 (-2) |
| III Braska's Final Aeon | 486 | 478 | -8 | -1.4 | 244.8 to 244.1 | 5.2 to 5.5 | 488 to 476 (-12) |
| VII Anima and Macalania | 443 | 456 | +13 | 1.4 | 58.3 to 59.4 | 5.4 to 5.2 | 494 to 493 (-1) |
| VIII Evrae | 490 | 490 | 0 | 0.0 | 70.3 to 72.4 | 0.8 to 0.8 | 487 to 480 (-7) |
| IX Yojimbo | 485 | 488 | +3 | 0.6 | 74.4 to 74.1 | 4.0 to 4.8 | 427 to 434 (+7) |
| **X Seymour Natus** | 386 | **302** | **-84** | **-5.7 real** | 54.4 to 56.7 | 2.1 to 5.4 | 389 to 325 (-64) |
| XII Seymour Omnis | 427 | 423 | -4 | -0.4 | 102.3 to 102.7 | 1.3 to 1.3 | 290 to 284 (-6) |
| XIV Isaaru (3 links) | 423 | 431 | +8 | 0.7 | 28.9 to 28.7 | 2.8 to 2.7 | 424 to 446 (+22) |
| XVII Sin: Fins and Core | 437 | 446 | +9 | 0.9 | 327.4 to 330.0 | 2.8 to 2.7 | 280 to 273 (-7) |
| XVIII Sin: Face | 3 | 7 | +4 | 1.3 | 56.8 to 57.3 | 3.0 to 2.9 | 124 to 117 (-7) |

**12 seeds** (the committed harness, unmodified; wins of 12, merged against RC1 and W2 alone): I 12 (RC1 12, W2 2), II 11 (10, 12), III 11 (11, 12), VII 12 (11, 10), VIII 11 (12, 12), IX 11 (12, 11), X 9 (8, 8), XII 10 (11, 6), XIV 11 (11, 10), XVII 10 (10, 7), XVIII 0 (0, 5);
party turns 48.6, 156.2, 228.2, 61.2, 71.9, 75.4, 58.3, 99.2, 28.8, 328.1, 56.4; party KOs 0.4, 12.2, 6.3, 4.8, 1.0, 5.4, 5.6, 1.3, 2.6, 2.8, 3.0. No row moves by more than the sampling band of 12 seeds.

**The one real mover is Chapter X (-84 of 500), and its cause is known: Natus's Flare is rank 3 in the game's record 0x6079 and 5 in our data** (Bailey's 1:1 rule stands; the data layer takes the record's rank). **Ablation, 500 seeds:** the
merged tree with Flare's record at rank 5 wins **386 of 500, exactly RC1's number** (party turns 55.9, party KOs 2.4), so the rank is the whole of it. W2 alone found the same cause on the old scripts (389 to 325, with rank 5 put back 387).
The other rows: II is borderline (+11, 2.3 sd; W2's own 2,000-seed run of the chapter found no move, 1,992 to 1,994, and with eleven chapters compared one row at this size is expected by chance); III moves -8 (-1.4 sd), in the direction and about the size W2's 2,000-seed run found on the
old scripts (97.9 to 94.8 percent, all in link 1) and on the sampling edge; the rest are inside noise. Chapter I keeps the AI-Seymour result (499 of 500; seeds 1 to 40 are 40 of 40, the four windows 158 of 160): the mount's recovery is the dummy command's (M.2 item 5).
Files: `D:\Tools\ffx-parity\rc2-w2\ffx-500-merged.json`, `ffx-12-merged.json`, `natus-flare5-500.json`, `ffx-500-final.json` (the same table re-run on the final source).

### M.6 Verification

* `tsc --noEmit` (TypeScript 7): clean. `node tools/orphans.mjs`: 1,457 modules, 1,405 reachable, **52 orphaned = the 24 from `origin/main` + the 18 unwired FFX-2 kernels + the 10 unwired FFX kernels** (aeon-party, aeon-stats, ap-award, battle-save, drops, gear-drop, overdrive-cost, overdrive-hooks, overdrive, steal-rewards: W5's); the nine W2 wired
  (ctb, ctb-init, ctb-scheduler, ctb-table, rng, rolls, status-extra, status-inflict, status-pool) are reachable.
* The W2 oracles on the merged tree: `parity-ffx-engine-ctb-status` (10), `parity-ffx-engine-status` (9; **5,000 generated hits, on an ability pool that grew with release candidate 1: one new situation found seam 7**), `parity-ffx-engine-ticks` (2), `parity-ffx-turn-ticks` (43) pass.
  The 24 AI parity files (`re-parity-ai-*`, `parity-ffx-ai-*`) and `re-parity-ai-merged-hooks` (53) pass; `ffx-engine-golden` (18) passes on the re-pinned table.
* The full unit suite, once, on the exact tree (`--testTimeout=60000 --maxWorkers=4`, the machine shared with other agents' runs; log `D:\Tools\ffx-parity\rc2-w2\fullsuite.log`):
  **1,016 files: 984 passed, 24 failed, 8 skipped; 15,449 tests: 15,162 passed, 184 failed, 102 skipped, 1 todo.** **21 of the 24 failed files are the art-only ones this worktree always has** (it has no `public/art`; the same 21
  as W1's and W2's own runs): `ui-portrait-face-crop` (145 tests), `trema-ship-content`, `art-ref-defaults`, `pause-remake`, `isaaru-ship`, `den-of-woe-ship-content`, `chapter-meta-seymour-anima-macalania`, `chapter-meta-evrae`, `natus-ship-scene`,
  `natus-ship-content`, `leblanc-art`, `fallen-aeons-ship-content`, `chapter-meta-ffx2-leblanc`, `cutscene-story-poses`, `fallen-aeons-ship-scene`, `den-of-woe-ship-scene`, and five that fail on import for the missing `public/art/manifest.json`:
  `party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta` (release candidate 1's run on the release art had 0 failures). **The other three were seed pins the merge moved**, re-pinned in
  the merge commit (M.3) and each green when run alone on the final tree: `strategy-guide` ("explains most", seed 42 to 1), `chapters/sin-fins-core-bench` (the Ether seam, seeds 1 to 4 to 1, 2, 3 and 9) and `chapters/evrae-breath-hold` (seed 8 to 3). The suite was not repeated: one run, as the brief asks.
* Mutation checks of the new test file: 10 mutants of the seams, 10 caught, each restored byte for byte (sha1 checked).
* **Nothing was lost from either side, proved by file sets** (`git diff --name-only`): the merge `4197e783` differs from release candidate 1 (`931613a8`) in 110 files = 95 of the 96 files W2 changed + 15 resolution files named here (the five AI modules
  `ai/opening.ts`, `ai/possession-setup.ts`, `ai/macalania-rules.ts`, `ai/game-rolls.ts`, `ai/command-formula.ts`; `orders.ts`, `targeting.ts`; the gaze fixture; `evrae-breath-hold`, `sin-fins-core-bench`, `strategy-guide`, `re-parity-ai-bfa`, `re-parity-ai-possessed`, `re-parity-ai-yunalesca`;
  the new merge test). The one W2 file that equals release candidate 1 is `tests/unit/ffx-parity-measure.test.ts`, where the scripts' seed parser is kept on purpose (M.1). It differs from W2 (`06210431`) in **every one of the 992 files release candidate 1 changed**, so no change of the
  other side is missing either.

### M.7 Open items, and decisions for Bailey

1. **Death by the status record on a target whose script holds its KO.** Release candidate 1 held every lethal write of a scripted boss until its `onHit` had run; W2's write-back kills a target at the Death bit of the record. The two meet only on a Zombie hit by a
   revival effect (Phoenix Down on a Zombie), and of the bosses that hold their KO only Braska's Final Aeon takes Zombie (50); the shipped Chapter III line uses Zombie for the pillars' Power Wave, not for Phoenix Down. W2's order is kept; which comes first in the exe for a Death bit is not read. Recommendation: leave it.
2. **The equipment reactions** (Counterattack, Auto-Potion, Auto-Med, Auto-Phoenix, `ticks.ts#collectReactions`) do not test the can-act gate, though in the exe all four go through `pp_BtlCanAct` with the not-Threatened flag (a Threatened or sleeping wearer cannot react). Both lines had left it; not changed here (it would move seeds). Recommendation: a batch of its own, measured.
3. **The preTurn order is now the exe's** (tick, pre-turn, Doom); nothing in the goldens or the parity files moved. The lanes' notes that say "before Doom, Provoke and the action request" stay true.
4. W2's own decisions (section 10) stand and the merge changes none: Natus's Flare at rank 3 (Bailey's 1:1 rule; Chapter X 386 to 302 of 500), Chapter III's first link a little harder, an aeon's Defend that does nothing, the KO status reset and Zombie, the record bytes that now rule the status step, the stale status text.
5. **Stale text, still not rewritten** (guides are Bailey's wording): `ui/common/statusWords.ts` ("gauge frozen, no turns" for Sleep), `data/ffx/statuses/core.ts` ("a physical hit" shatters a Petrified target), the Chapter X guide card and line that teach the old Flare cadence, the lists in the RC1 handoff section 6.
6. No browser check was run (no UI file changed by this merge; the worktree has no `public/art`); the CTB list reads `predictTurnOrder`, which the oracle covers.

### M.8 What the player sees (plain words, for the CHANGELOG entry of the release that carries this)

**FFX, every chapter (W2).** Who acts next, and what a status does, follow the game. A fight opens with the game's own turn-order draws (First Strike gives a head start; a preemptive or ambush start spends none); after each action the clock waits the game's number of ticks,
fast characters first when two are ready; Haste and Slow change the wait the way the game's tables do (and a Slow that fails no longer doubles the wait); Delay Attack and Delay Buster add the game's ticks. A status lands by the game's rule: one roll for each status a move can cause, the 255 and 254 rules, exclusions (Haste and Slow cancel, Petrify wipes the rest),
no refresh of one already on. Regen pays by the ticks since its last payout, Poison takes 25 percent after an action (a sleeper's passed turn takes none), Doom counts from 5 on the victim's own turn, Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow count down at the end of the holder's turn.
**Chapter X is harder**: Natus casts Flare much more often, because its wait after a cast is rank 3 in the game's tables and was 5 in ours (W2 counted 5.2 casts a fight against 2.9): the shipped line wins 302 of 500 seeds, it won 386. Every other chapter stays inside the sampling band (Chapter I 99.8 percent, Chapter II 98.8, Chapter III 95.6).

## What the engine does now

An action visits its targets and runs each target's hits in a row (W1). Everything the game decides about WHO acts and WHAT STATUS a
hit leaves is now the kernels', through `adapt/`:

- **The opening** (`adapt/ctb.ts#openingCtb`, `kernel/ctb-init.ts`): the game's 26 fixed draws, one per slot of the party, the aeons
  and the monsters in the game's order, empty slots and the bench included; none for a preemptive or ambush start. First Strike on
  any slot that wears it (a monster never does), Haste halves and Slow doubles the start value of every slot.
- **The clock** (`adapt/ctb.ts#advanceClock`, `kernel/ctb-scheduler.ts`): a BYTE counter per character slot counts down one point per
  tick; the engine jumps the ticks of a stretch with nobody ready in one step (proved equal to the scheduler kernel called once per
  tick). The next actor is the first ready character by the game's tie key: higher Agility first among the party and the aeons, then
  the monsters in formation order. Every ticked character also gains a Regen tick point.
- **Recovery** (`adapt/ctb.ts#charge`): `HasteSlow(tickSpeed(Agility) * max(rank, 1))` as a byte add, with the game's rank byte of the
  command (17 abilities changed rank, section 6). A revived character's counter is the base stored at the opening.
- **Delay Attack, Delay Buster, Haste, Slow and Threaten's delay** are the hit kernel's CTB class: added to the target's counter
  inside the hit and clamped to 0..255; Haste and Slow rescale the counter (formula 0xd) only when the status landed.
- **Status infliction** (`adapt/status.ts`, `adapt/status-apply.ts`): every hit that lands runs the game's step over a per-target
  hit record kept across the hits of an action: one draw per visited status with a chance byte (`% 101`, Threaten `% 100`), the 255 and
  254 rules, the exclusions, Petrify's wipe, the self-cast turn, no refresh, then the extra statuses, the shatter roll, the stage
  buffs and the buff flags. The record is written back after the damage with the events the engine always emitted.
- **The ticks** (`adapt/ticks.ts`, `adapt/threaten.ts`): Regen pays every holder from its own tick counter at the start of any turn
  and counts down at the start of its holder's turn; the stances and the Threaten pair end at the start of a turn; Doom counts down
  from 5 (a monster's own byte); Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow count down at the END of the
  holder's turn; Poison follows only an action whose results were applied.
- **Double HP and Double MP** (`statuses.ts`, `kernel/status-pool.ts`): capped at 9,999 and 999 (99,999 and 9,999 with Break HP /
  MP Limit), and removing the flag restores the stored base.

What stays the engine's own business: Reflect, Cover and Provoke, the events, the HP / MP / CTB application, revival, the Overdrive
gauges, the equipment reactions (Auto-Potion, Auto-Med, Auto-Phoenix, counters), KO and Auto-Life, Eject and the aeon leaving the field.
The draws are one engine draw per kernel draw from the engine's seeded stream; **adopting each game's own generator is the RNG lane's.**

Files: `adapt/{ctb,slots,status,status-apply,status-odds,threaten,ticks}.ts` (new), `runtime.ts` (new; `ActorRuntime` and `FFXRuntime`
moved out of `state.ts`, which crossed 400 lines), `hit-apply.ts`, `turnQueue.ts`, `statuses.ts`, `ticks.ts`, `kernel/turn-ticks*.ts`.

## 1. Every kernel input and its engine source

An input the engine cannot supply is an error, never a default. "Constant": the value is the game's and the reason is in the row.
"Ours": a number our data carries, not retuned.

**The opening counters** (`kernel/ctb-init.ts`, exe 0x78ded0; `adapt/ctb.ts#openingCtb`)

| Input | Engine source |
|---|---|
| start type (normal 0, preemptive 1, ambush 2) | `BattleSetup.condition`; the engine's `'scripted'` (a chain's later link) is a normal start, the game has no scripted one; absent = normal |
| the 31 character slots | `adapt/slots.ts`: Tidus 0, Yuna 1, Auron 2, Kimahri 3, Wakka 4, Lulu 5, Rikku 6; the aeons Valefor 8, Ifrit 9, Ixion 0xa, Shiva 0xb, Bahamut 0xc, Anima 0xd, Yojimbo 0xe, the Magus Sisters 0xf to 0x11; a monster is 0x14 plus its index in `BattleState.enemyIds` (the formation order, taken to be the game's monster slot order). A combatant with no slot is an error |
| Agility | `stats.agi`; 0 for an empty slot (its draw is spent and thrown away, as in the game) |
| Haste and Slow counters | the `haste` and `slow` statuses: 255 when permanent, else the turns left clamped to 1..254 |
| First Strike | the equipment auto-ability for a party member or an aeon; 0 for every monster (the exe zeroes a monster's auto-ability block) |
| in the battle | on the field and not `ordersOnly` (Yojimbo's dog owns no turn) |
| aeon flag | slots 8 to 0x11 |
| the draws | `ctx.rng.int(0, modulus - 1)` with the kernel's own modulus (`bonus + 1` for a party slot, 11 for a monster): 26 on a normal start |
| written back | `ActorRuntime.ctb` (the counter) and `.icv` (the base value stored for a revival) |

**The clock and the ready list** (`kernel/ctb-scheduler.ts`, 0x790fb0; `adapt/ctb.ts#schedulerView`)

| Input | Engine source |
|---|---|
| in the battle / dead / permanent word | on the field and not `ordersOnly`; not alive; `permWord` (only Petrify is read) |
| queued actions | 0: the engine runs an action to its end before it picks the next turn |
| counter, base value, Regen tick counter | `ActorRuntime.ctb`, `.icv`, `.regenTicks` |
| gets turns | true. While an aeon holds the field the party is simply not in the battle (section 7) |
| rank | constant 3: the scheduler resets it to 3 at counter 0, and the engine keeps an action's rank on the action |
| Agility (tie key) | `stats.agi`; the key is `(255 - AGI) * 256 + slot` for the party and aeons, `slot + 0x10000` for a monster |
| scheduler globals | not paused, no queued action, period 1, no debug switch, no script hold |

**Recovery, revival and a hit's CTB class** (0x78d1d0, 0x78d530, 0x78e0f0, 0x78e1e0)

| Input | Engine source |
|---|---|
| tick speed | `tickSpeed` of the combatant's live Agility (Agility below 1 reads 1) |
| the rank of the action | `rankOf(def)`: the ability's `rank`, which `attachCommandRecords` sets to the record's rank byte (0 means 3) for every recorded ability; a passed turn is 3 |
| Haste and Slow counters | as above |
| the running counter | `ActorRuntime.ctb` |
| a revived character's counter | `ActorRuntime.icv` |
| Delay Attack / Buster: the bits, the target's tick speed, `3 * tick` base, delay immunity | `flagsMisc` bits 13 and 14 of the record (derived from `weak-delay` / `strong-delay` for a record-less ability), `tickSpeedOf(target)`, `immunityFlags` `immune-to-delay` |
| Haste / Slow: the CTB class amount | formula 0xd with the ability's own `power` (ours: 8 and 16); the status step zeroes it when the status did not land |
| Threaten's delay | `delay + userCounter - targetCounter`, the delay being the recovery of the action's rank for the user |

**Status infliction** (`kernel/status-inflict.ts`, 0x78ae00; `adapt/status.ts#runStatusStep`)

| Input | Engine source |
|---|---|
| command type byte, `flagsMisc`, `flagsDamage` (cleanse bit 5) | the ability's game record; a record-less ability derives them from its own flags (`adapt/command.ts`) |
| the 25 chance bytes and the 13 duration bytes | the record's; a record-less ability: its `statusEffects` (one chance byte each, its duration) and `removesStatuses` (254) |
| the shatter chance | the record's byte 0x2c (`shatter`); a record-less ability: its `shatterChance` |
| wanted extra bits, stage mask and amount, buff flags | the record's; record-less: mapped from `statusEffects` |
| the weapon's bytes (command word bit 18) | `weaponStatusStrikes(user)` of a party user, the per-status maximum; none for anyone else |
| user and target id | the self-cast test only: the user is 0, the target is 0 when it is the user and 1 otherwise |
| user Agility, counter, rank, Haste, Slow, current command, auto word A | `stats.agi`, `ActorRuntime.ctb`, `rankOf(def)`, the statuses, `command.currentCommand`, Magic Booster 0x40 |
| target is a monster slot | `side === 'enemy'` |
| the 25 resistance bytes | `immunities` byte for byte (255 immune). Threaten's is an enemy's LIVE Threaten percent (`ActorRuntime.threatenChance`; 0 when immune; a party member's and an aeon's is 0). `immune-to-regen` is Regen 255 |
| live words (permanent, 13 counters, extra) | `permWord`, `temporalCounters`, `extraWord` as the ACTION began (the snapshot of the target's first hit). A KO'd member's Zombie bit is masked (the exe's death handler clears it; section 7) |
| equipment-given words | the statuses whose `permanent` is set |
| extra-status immunity word | the extra statuses whose immunity is 255 or more; Banish (`extra.bypassesAeonRibbon`) lifts the Eject bit on an aeon |
| special word | `specialWord` (the Life-immune bit is the one this step reads) |
| target counter | `ActorRuntime.ctb` |
| Doom's starting value | 5 for a party member or an aeon, `EnemyDef.doomTurns` for an enemy; read only when a Doom lands; an enemy that can be Doomed without it is an error |
| the hit record | the target's three words at its first hit of the action, edited by every hit, written back after the damage |
| the draws | `% 101` (Threaten `% 100`) per visited status with a chance byte, none for a cleansing command; one `% 101` for a Petrified record's shatter |

**Pools, stage buffs, buff flags** (`kernel/status-pool.ts`, `status-extra.ts`)

| Input | Engine source |
|---|---|
| the stored base maxima | `ActorRuntime.poolBaseHp` / `poolBaseMp`, set when a flag is first turned on (a chain's later link: the base maxima the seam carries) |
| maxima in force, HP, MP | `stats.maxHp`, `stats.maxMp`, `hp`, `mp` |
| the buff byte | the `max-hp-x2` (1) and `max-mp-x2` (2) statuses, plus 9,999 (8), always critical (0x10), Overdrive x1.5 / x2 |
| Break HP / MP Limit | `autoWordB`: the equipment abilities, bits 0x200 and 0x400 |
| stage stacks | the `cheer`, `aim`, `focus`, `reflex`, `luck`, `jinx` stacks, clamped 0..5 |

**The per-turn ticks** (`kernel/turn-ticks.ts`, 0x7af390, 0x7af4f0, 0x799cd0, 0x7afab0, 0x78e410; `adapt/ticks.ts`)

| Input | Engine source |
|---|---|
| on the field / dead / Petrified | `onField` and present; `!alive` or `ko`; `petrify` |
| HP, maximum HP | `hp`, `stats.maxHp` |
| permanent word, 13 counters, extra word | as above; a Nul status counts charges, a permanent one is 255 |
| equipment-given extra word | the statuses whose `permanent` is set |
| the Regen tick counter | `ActorRuntime.regenTicks` (counted by the clock, reset by a payout and by a Regen that lands) |
| Doom counter | the `doom` status's `turnsRemaining` |
| Poison percentage | 25 for a party member or an aeon; `EnemyDef.poisonTickPercent` for an enemy (an error when absent) |
| the Threaten pair | the target's `threaten` status carries the user's id; `adapt/threaten.ts` writes both ends onto the 31 slots |
| a turn that is being re-entered / the silent flag | constants false: the engine opens a turn once, and a Switch hands the open turn to the incoming member without a second tick; the flag is presentation |
| whether the action's results were applied | `onTurnEnd(ctx, actor, resultsApplied)`: false for a passed turn |

## 2. Data added

- **Command records** (`FFXCommandRecord`, additive, CONTRACT-CHANGES): `rank`, `chances`, `durations`, `extra`, `stage`, `buff` (`e8ec8c2b`) and
  `shatter` (`717ed360`), for the 452 recorded abilities (plus the four core ones in `registry.ts`), from the game's kernel tables;
  the fixture of all 979 records (`tests/fixtures/parity/ffx/command_status.json`, numbers only) and `research/re-ffx-commands.md`
  section 7. Six abilities were re-attached by their status bytes (section 7.1 there).
- **The ability's `rank`** is the record's rank byte now (`attachCommandRecords`), one source for the engine and the interface. 17
  abilities changed (section 6).
- **`EnemyDef.poisonTickPercent` and `EnemyDef.doomTurns`** were optional fields; they are read where the game reads them and an enemy
  that needs one and has none is an error. Every shipped enemy carries them or is immune.
- **Where our own status data differs from the record** (the record wins; `tests/unit/data-ffx-command-records.test.ts` pins every row):
  Provoke 100 (ours 254) and Threaten 100 (ours 255); Havoc Shot's Sleep, Silence and Darkness 254 (ours 100); Time Shot also slows;
  Full Life (Seymour's) cleanses only Death (ours also removed eight statuses and Doom); the possessed Yojimbo's Zanmato has no Death byte;
  Evrae's Stone Gaze slows for 100 (ours 254); and the shatter chances (7 of ours the record overrides, 148 plus the party's Attack the record adds).

## 3. Engine code replaced and deleted

No parallel path is left. Deleted: `applyStatus`, `removeStatuses`, `rollStatus`, `rollThreaten`, `consumeNulCharges`,
`tickDurationStatuses`, `DURATION_STATUSES`, `ESUNA_CURES`, `DISPEL_REMOVES`, `STACKING_BUFFS`, `MIX_FLAGS`, `NUL_BY_ELEMENT`,
`clearUntilNextTurnStatuses`, the scripted death roll of `scripted.ts`, `normalise`, `applyDelay`, `onHasteApplied`, `onSlowApplied`, the
hand-built `ICV_BASE` and `ICV_VARIANCE` tables (they remain as read-only views of the kernel's `tickSpeed` and `icvBonus`), `payRegen`, the
`estimate.ts` copy of the landing rule, and the engine's own Double HP / Double MP code. `turnQueue.ts` 350 -> 243 lines, `statuses.ts` 397 -> 173, `ticks.ts` 236 -> 183, `state.ts` 398 -> 230,
`math.ts` 108 -> 43. The removed exports of `src/battle/ffx/index.ts` and the new `ActorRuntime` fields are in `docs/CONTRACT-CHANGES.md`.

Mirrors: `ffx/estimate.ts#statusOdds` is the kernel's landing predicate counted over every roll the game can draw
(`adapt/status-odds.ts`), so the enemy-intent panel and the advisor (`engine/tactics/advisor-roll.ts`) cannot drift from the engine;
`ffx/simulate.ts` gives a preview's enemies their Threaten byte; `predictTurnOrder` plays the game's key and recovery forward. The
FFX-2 mirrors (`statusOddsFFX2`, `statusChanceLinear`) are W3's.

## 4. Tests changed, and why

| Test | Change | Game-code reason |
|---|---|---|
| `parity-ffx-engine-ctb-status` (new, 10 tests) | the engine's clock, opening counters, recovery, revive, Haste / Slow / Delay casts and the forecast against an independent oracle (`helpers/ffxEngineCtb.ts`) on generated fields: 400 for the clock, 300 for the opening, 300 for recovery, 60 for the revive counter, 300 for the forecast | the proof of the turn-order wiring |
| `parity-ffx-engine-status` (new, 9 tests) | 5,000 generated hits (the game's own records and fuzzed ones, 1 to 3 hits, party and enemy targets, Zombie, Petrify, Death, Eject, revival, Threaten, Doom, Double HP and MP, stage buffs, weapon strikes, the Regen tick counter) against the kernels run by an independent route | the proof of the status wiring |
| `parity-ffx-engine-ticks` (new, 2 tests) | 800 generated fields through the engine's start of turn, Doom and end of turn | the proof of the tick wiring |
| `parity-ffx-turn-ticks` and `fixtures/parity/ffx/turn_ticks_*.json` | the tick kernels against the exe's machine code | `608ee073` |
| `ffx-statuses` | rewritten on the real path (`helpers/ffxStatus.ts`); the rules the old file pinned kept, the changed ones re-pinned: Regen pays from the holder's tick counter and counts down at the START of its holder's turn, Poison 25 percent after an action whose results were applied, Doom from 5, the ticking list, Death against a living Zombie reads 254, Esuna read off the game's own record | the exe's tick and infliction functions |
| `ffx-ctb` | the clock counts every counter down (no minimum subtraction), Haste and Slow leave the counter alone when no cast moves it, Delay in the hit | `kernel/ctb*.ts` |
| `data-ffx-command-records` | the status bytes word for word, the difference lists, the 17 rank changes, the shatter bytes | section 2 |
| seeds re-pinned because the opening is 26 draws and the statuses draw too | `advisor-note` (Chapter 1 seeds 8 then 1), `advisor-plan-recovery` (seed 1), `advisor-v4-card` (seed 3's first menu is Kimahri's Zombie board), `guide-advisor-target-agreement` (Holy Water on Tidus opens seed 10), `ffx-round04-engine` (seed 3 -> 4; and its PR-0025 text check now pins that the denied-turn rank 3 cites the exe), `ffx-results-ap` (4 -> 2), `presenter-vitals-hp-ceiling` (seed 3), `presenter-vitals-sync`, `chapters/macalania-engine` (A-8 waits for a Multi- action that landed both hits: seed 1 -> 3), `chapters/evrae-engine` (an invincible party for the order queue; Petrify impossible for the Stone Gaze test) | each file names its seed and why |
| moved to the real status path (`helpers/ffxStatus.ts`: `giveStatus`, `inflict`) | `ffx-aeons`, `ffx-ai`, `ffx-chapter2`; `ffx-overdrive-menu-rows` (a preemptive start, so the order does not depend on the opening draws) | the old helpers were deleted with the engine's own formulas |
| `chapters/natus-bench` | the old midpoint party (not shipped) is unwinnable for both lines now, so "intended beats wrong" there is `>=`; the strict comparison stays on the shipped preset. Measured at the change (200 seeds): shipped preset intended 119 -> 110, **drain-farm 66 -> 0**, midpoint intended 5 -> 0; with the old ranks put back 113, 58 and 13 | Flare's rank (record `0x6079`) |
| `chapters/natus-engine` | Natus's Flare is rank 3 (the game's record 0x6079); the Mortibsorption loop repeats a missed Attack | record `0x6079` |
| `chapters/sin-fins-engine` | Petrify goes on Auron, not on the Tidus who also carries Zombie | a cleanse on a Petrified record works for Petrify only, and Zombie (status 1) is reached before Petrify (2) |
| `chapters/sin-carry`, `sin-carry-ceiling` | the seam carries the BASE maxima and the next link doubles them under the cap (9,999 for Auron under a Stamina Tonic, not 12,984) | `pp_BtlApplyDoubleHpMp` |
| `enemy-intent` | Mega Death on a living character reads 99 percent | the landing rule counted over the 101 rolls |
| `strategy-seymour-flux` | documented losses seeds 1, 7 and 20260916; the floors hold (10 of 40, 48 of 160, 9 early) | the new draws |
| `ffx-engine-golden` | all 18 digests, then Chapter II's two again (`09bf0adb`, `9bd5b576`) | section 8 |

Mutation checks, run again on the final code (a change made to the engine or an adapter in a scratch copy, the test files run, "caught" = a test
failed). CTB adapters 15 of 18: the three survivors cannot show in the engine (the draw callback is not keyed by stream, so an aeon's stream flag changes nothing; a permanent
Slow reads 255 or 254 alike; the Delay Buster bit of a DERIVED record is read only for an ability with no game record, and none ships with the flag). Status adapters 31 of 34
(5,000 hits): two anchors moved with the Doom fix and their mutations are the Doom set, 2 of 2 caught; the survivor is Magic Booster's word, which only the exe's Auto-Life bonus
flag reads and the engine has no use for. Tick adapters 15 of 18: the survivors are unobservable (a Doom counter read for a combatant with no Doom; a dead member counted
alive, whose HP is 0 and so is skipped anyway; the Threaten bit left on the USER when the target's link byte is missing, which the engine never reads back because it keeps
the pair on the target). Double HP and MP limits 5 of 6 (the survivor is the removal path, which is handed the byte already in force and recomputes nothing); the chain carry 3 of 3.
Two more, made after: the shatter chance read from the ability instead of the record, and the Regen reset removed: both caught by the status oracle.

## 5. Before and after

Harness: `tests/unit/ffx-parity-measure.test.ts` with `PYREFLY_MEASURE=1` (`PYREFLY_MEASURE_SEEDS=1-N`, a range or a list since the merge, `PYREFLY_MEASURE_CHAPTERS=a,b`,
`PYREFLY_MEASURE_OUT=<file>`): the shipped `intendedStrategy` through each FFX chapter's whole chain, seeds 1 to N. Before = the tree at
`bd908802` (the W1 engine, the table of `docs/handoff/re-parity-w1.md` section 5), after = `9bd5b576` (the engine; `214d8915` only added the tally). Causes: `tests/unit/ffx-parity-cause.test.ts`
and `tools/parity-cause-compare.mjs`.

**12 seeds** (wins / losses / party turns / party KOs, before -> after):

| Chapter | Wins | Losses | Party turns | Party KOs | Change |
|---|---|---|---|---|---|
| I Seymour Flux | 2 -> 2 of 12 (16.7% -> 16.7%) | 10 -> 10 | 24.7 -> 23.4 | 4.1 -> 4.8 | +0 (0.0 pts, 0.0 sd)  |
| II Yunalesca | 12 -> 12 of 12 (100.0% -> 100.0%) | 0 -> 0 | 134.6 -> 146.5 | 8.7 -> 9.5 | +0 (0.0 pts, 0.0 sd)  |
| III Braska's Final Aeon (7 links) | 12 -> 12 of 12 (100.0% -> 100.0%) | 0 -> 0 | 255.4 -> 256.1 | 5 -> 5 | +0 (0.0 pts, 0.0 sd)  |
| VII Anima and Macalania | 12 -> 10 of 12 (100.0% -> 83.3%) | 0 -> 2 | 50.6 -> 48.8 | 4.2 -> 4.9 | -2 (-16.7 pts, -1.5 sd) MOVED |
| VIII Evrae | 11 -> 12 of 12 (91.7% -> 100.0%) | 1 -> 0 | 66.8 -> 68.8 | 0.8 -> 0.7 | +1 (8.3 pts, 1.0 sd)  |
| IX Yojimbo | 9 -> 11 of 12 (75.0% -> 91.7%) | 3 -> 1 | 71 -> 78.3 | 6.8 -> 8.4 | +2 (16.7 pts, 1.1 sd) MOVED |
| X Seymour Natus | 9 -> 8 of 12 (75.0% -> 66.7%) | 3 -> 4 | 45.4 -> 44.8 | 0.8 -> 1.6 | -1 (-8.3 pts, -0.5 sd)  |
| XII Seymour Omnis | 7 -> 6 of 12 (58.3% -> 50.0%) | 5 -> 6 | 111 -> 98.6 | 14.9 -> 10.8 | -1 (-8.3 pts, -0.4 sd)  |
| XIV Isaaru (3 links) | 10 -> 10 of 12 (83.3% -> 83.3%) | 2 -> 2 | 30.5 -> 30.1 | 2.8 -> 2.6 | +0 (0.0 pts, 0.0 sd)  |
| XVII Sin: Fins and Core | 3 -> 7 of 12 (25.0% -> 58.3%) | 9 -> 5 | 303.3 -> 349.9 | 11 -> 10.3 | +4 (33.3 pts, 1.8 sd) MOVED |
| XVIII Sin: Face | 4 -> 5 of 12 (33.3% -> 41.7%) | 8 -> 7 | 64.4 -> 65.6 | 2 -> 1.8 | +1 (8.3 pts, 0.4 sd)  |

**500 seeds** (standard deviation of the difference of two samples; "real" = beyond 3, "borderline" = 2 to 3):

| Chapter | Wins | Losses | Party turns | Party KOs | Change |
|---|---|---|---|---|---|
| I Seymour Flux | 131 -> 144 of 500 (26.2% -> 28.8%) | 369 -> 356 | 27.2 -> 29.9 | 4.4 -> 4.5 | +13 (2.6 pts, 0.9 sd) noise |
| II Yunalesca | 499 -> 497 of 500 (99.8% -> 99.4%) | 1 -> 3 | 132.4 -> 135.4 | 8.2 -> 8.4 | -2 (-0.4 pts, -1.0 sd) noise |
| III Braska's Final Aeon (7 links) | 488 -> 476 of 500 (97.6% -> 95.2%) | 12 -> 24 | 257.7 -> 258.5 | 5.3 -> 5.6 | -12 (-2.4 pts, -2.0 sd) borderline |
| VII Anima and Macalania | 494 -> 493 of 500 (98.8% -> 98.6%) | 6 -> 7 | 50.5 -> 50.3 | 4.8 -> 4.8 | -1 (-0.2 pts, -0.3 sd) noise |
| VIII Evrae | 487 -> 480 of 500 (97.4% -> 96.0%) | 13 -> 20 | 68.8 -> 70.8 | 0.9 -> 1.1 | -7 (-1.4 pts, -1.2 sd) noise |
| IX Yojimbo | 427 -> 434 of 500 (85.4% -> 86.8%) | 73 -> 66 | 76.1 -> 76.4 | 7 -> 7.9 | +7 (1.4 pts, 0.6 sd) noise |
| X Seymour Natus | 389 -> 325 of 500 (77.8% -> 65.0%) | 111 -> 175 | 49.1 -> 50.3 | 1.3 -> 3.1 | -64 (-12.8 pts, -4.5 sd) real |
| XII Seymour Omnis | 290 -> 284 of 500 (58.0% -> 56.8%) | 210 -> 216 | 109.2 -> 107.5 | 11.6 -> 10.9 | -6 (-1.2 pts, -0.4 sd) noise |
| XIV Isaaru (3 links) | 424 -> 446 of 500 (84.8% -> 89.2%) | 76 -> 54 | 30.3 -> 30.2 | 2.7 -> 2.6 | +22 (4.4 pts, 2.1 sd) borderline |
| XVII Sin: Fins and Core | 280 -> 273 of 500 (56.0% -> 54.6%) | 220 -> 227 | 307.4 -> 312.9 | 8.1 -> 8.3 | -7 (-1.4 pts, -0.4 sd) noise |
| XVIII Sin: Face | 124 -> 117 of 500 (24.8% -> 23.4%) | 376 -> 383 | 64 -> 64 | 2.3 -> 2.3 | -7 (-1.4 pts, -0.5 sd) noise |

**Wider samples for the rows that were not clear** (2,000 seeds, the old engine against the new one): II Yunalesca 1,992 -> 1,994 (noise); **III Braska's
Final Aeon 1,958 -> 1,897 of 2,000 (97.9 -> 94.8 percent, -3.0 points, -5.2 sd: real)**; VIII Evrae 1,951 -> 1,951 (nothing); XIV Isaaru 1,704 -> 1,730 (+1.3 points, 1.2 sd:
noise, the 500-seed +22 was a two-sigma swing). The 12-seed flags (VII -2, IX +2, XVII +4) are sampling: 500 seeds say -1, +7 and -7.

Causes, from the cause tally (old engine against new, line by line; Chapters II, III, VIII, IX, X, XIV at 500 seeds, Chapter III again at 2,000, the other five at 500)
and from ablations (the wired engine with one change put back, 500 seeds unless said):

- **X Seymour Natus, real: 389 -> 325 of 500 (-12.8 points; party KOs a fight 1.3 -> 3.1). Cause: Natus's Flare is rank 3 in the game's record, 5 in our data.**
  It is cast 5.2 times a fight and not 2.9, and it is the only line that moved in the tally (KOs by Flare 1.23 -> 3.05 a fight; no other cause moved by more than 0.7).
  With the old ranks put back the new engine wins 387 of 500 (the old engine 389): the rank is 62 of the 64. The same rank takes the guide's **drain-farm line** (strategy 6, farming
  Mortibody kills so each Mortibsorption drains Natus) from 66 of 200 to none, and the old midpoint party from 5 to none (`chapters/natus-bench`); with the old rank back they are 58 and 13.
- **II Yunalesca: 499 -> 497.** The first run of the wired engine showed 492 of 500 and party KOs with no action resolving ("tick") at 3.89 a fight against 0.58: a Regen that
  landed did not reset its holder's tick counter, so a fresh Regen paid a full heal (a kill for a Zombie). Found with the tally, fixed in `9bd5b576`, pinned by the status oracle.
- **III Braska's Final Aeon, real: -3.0 points at 2,000 seeds, and all of it is link 1** (Braska's Final Aeon and the two Yu Pagodas: 42 -> 103 losses; every later link is won every time it is
  reached, 1,958 of 1,958 in the old engine and 1,897 of 1,897 in the new). What the tally shows in link 1: the fight takes 2.7 percent more ticks (824.6 -> 846.4 a fight) and every
  actor but Tidus takes 3 to 5 percent more turns; the Pagodas' Power Waves are 5.2 percent more frequent (44.5 -> 46.8 a fight), each adds 20 to the boss's Overdrive gauge, so his
  Overdrives and Blade Blitz come sooner (Ultimate Jecht Shot +9 percent, Blade Blitz +7 percent) and the party's KOs by Blade Blitz go 0.17 -> 0.38 and by Ultimate Jecht Shot
  0.08 -> 0.23 a fight; a Firaga does 1.5 percent less on average (the likely reason is Mental Break being stripped more often; not measured). That loop is clear; **its first cause is not isolated.** Single changes put back,
  2,000 seeds: the command ranks of the old data 1,897 (nothing), the old tie order 1,899 (+2), the old Haste / Slow rule (a Slow that fails still doubled the target's counter)
  1,916 (+19, 1.4 sd: inside the noise); at 500 seeds the aeon Defend rule, the old shatter numbers and the old finite-duration list moved nothing, and counting every tick the old clock
  dropped (its extra `normalise` calls) moved nothing either (981 of 1,000 in both). The slow uptime of a Pagoda is the same (70 and 79 percent of its turns) in both engines. The
  AI track for this chapter (`research/re-ffx-ai-yunalesca-bfa.md`, rows B1 to B7 replace the script weights and the gauge) changes exactly these numbers, so the honest next
  measurement is Chapter III after that track merges.
- **VIII Evrae: 487 -> 480 (500 seeds), 1,951 -> 1,951 (2,000): noise.** Putting the old Haste / Slow rule back gives 484; Stone Gaze's Slow back to 254 moves nothing.
- **IX Yojimbo: 427 -> 434: noise.** The Agility tie key is worth +19 here on its own (with the old slot order the new engine wins 415).
- **XIV Isaaru: 424 -> 446 at 500 seeds, +26 at 2,000: noise.** No line of the tally moved and no ablation moved it.
- **I, VII, XII, XVII, XVIII: noise** (+13, -1, -6, -7, -7 at 500 seeds). The tallies show only counts: the aeon's Defend is a no-op now (item 14 below; wins unchanged in every chapter
  with an aeon), one Eject event per Banish, `critical` events with the hit.

`combat-fixes-bench` (200 seeds a line): every FFX-2 row (Chapters IV to VI) is byte-for-byte identical before and after (the FFX-2 engine is untouched). FFX: Chapter I intended
53 -> 56 of 200, drain-farm 1 -> 0, wrong 0 -> 0; Chapter III link 1 intended 195 -> 191, the Provoke line 9 -> 14.

## 6. Behaviour changes, each from the game's code

Everything below is the exe's answer, put into the engine; none of it is a tuning decision.

1. **The opening.** 26 fixed draws in the game's order; the bench has counters (the old engine left them at 0); Haste halves and Slow
   doubles every slot's start value; First Strike on any slot (no monster has it); a chain's later link is a normal start. The jitter
   distribution is the same as before, so this moves replays and not difficulty.
2. **The clock and the order.** Counters count down one point per tick per character, the next actor is the first at 0 by the game's tie
   key (Agility first among the party and the aeons, then monsters in formation order; the old engine used a fixed list). In the old golden
   battles the key picked a different actor on 10 of 2,648 turns.
3. **Recovery** is `HasteSlow(tickSpeed * max(rank, 1))`, clamped to 0..255, with the game's rank byte. The ranks that changed:
   Wakka's four reels 3 -> 4, Fury's menu marker 5 -> 3, Passado 3 -> 5, Mix 6 -> 5, **Natus's Flare 5 -> 3**, and the nine aeon Attack rows (never
   reached, the generic Attack serves every aeon).
4. **Haste and Slow rescale the counter only when the status landed.** The old engine rescaled it even when the status failed: in the
   golden battles 6 of 12 Slow casts failed (4 on a Yu Pagoda, 2 on Evrae) and doubled the counter anyway.
5. **Delay Attack and Buster** add `tickSpeed * 3 / 2` and `tickSpeed * 3` inside the hit, with the 255 clamp; **Threaten** writes
   `delay + userCounter - targetCounter` into the target's counter at once and the pair is released at the start of whichever end's turn comes
   first, or by a death or a leaving.
6. **Status draws.** One draw per visited status with a chance byte, in status order, whatever the odds; none for a cleansing command. The
   landing rule is `roll < chance - resistance` (a chance of 100 against resistance 0 fails on the one roll of 100: Mega Death reads 99
   percent), 255 always lands, 254 lands unless immune, **Death against a living Zombie reads a resistance of 254** (so a chance of 254 or
   255 gets through and 253 and below fail).
7. **Exclusions and wipes.** Confuse, Berserk, Provoke and Threaten remove one another; Haste and Slow cancel each other and a permanent one
   cannot be displaced; Petrify wipes the thirteen counters (a permanent Haste or Slow too) and keeps the extra bits 0 to 5, 8 and 15; a status
   cast on oneself with a finite duration lasts one extra turn; a status that is already on is not refreshed; stage buffs cap at 5 and survive Petrify.
8. **A Petrified record refuses the statuses after Petrify in status order**, and a cleansing command works on a Petrified record only for Petrify
   itself. A Petrified monster is shattered at once (Petrify puts Death and Eject in its record). A Petrified party member meets the shatter roll of
   whatever hits it: one `% 101` draw spent whatever the command, and the command record's own chance decides.
9. **Durations tick on the game's list.** Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow at the END of the holder's turn,
   Regen at the START of its holder's turn, the Nul statuses never. Shell with a counter of 100 loses one per turn end (the old engine ticked five
   statuses and left Shell, Protect, Reflect and Haste alone).
10. **Regen** pays EVERY holder `(own tick counter * maxHP >> 8) + 100` at the start of any turn (a Zombie takes it as damage), resets
    the counter on the payout and when a Regen lands, and counts down at the start of its holder's turn.
11. **Poison** takes `maxHP * percent / 100` (25 for the party and the aeons, the monster record's byte for an enemy) after an action whose results
    were applied; a sleeper's passed turn takes none.
12. **Doom** starts from 5 (the party) or the monster record's byte, counts down on the victim's own turn even while it sleeps, and kills at 0. A
    Doom command at a Doom-proof boss lands nothing and asks for no countdown.
13. **Double HP and Double MP** cap at 9,999 and 999 (99,999 and 9,999 with the Break limits) and removing the flag restores the stored base;
    a Tonic on Auron (6,492 HP) is 9,999, not 12,984.
14. **Extra statuses honour the immunity bit, whatever the chance byte.** The old engine let a chance of 255 override an immunity; the game's
    extra-status step has no roll and refuses a bit in the target's immunity word. **An aeon's Defend, Guard and Sentinel therefore land nothing**
    (the aeon's sourced Ribbon list includes them, `setup.ts#AEON_INNATE_IMMUNITIES`); the engine's aeon menu still offers Defend (section 10).
15. **Banish** is an ordinary Eject command that lands on an aeon (the Aeon Ribbon byte is not in the word it is handed). The status-add event for
    the Eject is emitted once, not twice.
16. **The event stream** keeps its shapes. Differences in counts: one Eject event per Banish (was two); the `critical` status event comes with
    the hit that took the HP under half (the status step refreshes it after every hit), where the old engine emitted 909 of Chapter III's 2,992
    of them (20 seeds) at the owner's next turn start (why the old engine lagged was not traced); and `turn-start.elapsedTicks` is the ticks the clock ran.

## 7. What was not done, and what could not be sourced

- **The KO status reset.** The death handler (VA 0x0079a190) clears the permanent word but Death (so Zombie too), the counters, the extra word
  (so Scan and Eject too), the stacks and the buff byte. The engine's `SURVIVES_KO` keeps `ko`, `scan`, `zombie` and `eject` on a member who
  dies, on the strength of `research/ffx-yunalesca.md` section 15.2 number 29 (the Hellbiter weighting reads Zombie on KO'd slots). The two
  cannot both hold; this track does not settle which the script reads (PR-0217, D-214), keeps the list, and shows the infliction step the word
  the exe would have (Death alone). Recommendation: have the Yunalesca AI lane check whether the weighting reads the permanent word at all, then
  drop Zombie and Scan from the list.
- **The aeon summon and dismissal counters** (`pp_BtlSummonCtb` 0x007b1aa0, the character refresh 0x007a89c0): read, not proven. The party's counters
  are frozen while an aeon holds the field and the aeon enters at 0; the party is not ticked meanwhile.
- **The party's Threaten release when it is summoned away** was not traced; the target meets the release at its own turn start, which comes right after.
- **Whether an equipment-given Haste or Slow comes back after Petrify** zeroes the record's counters (the temporal auto word `Chr+0x62c`).
- **The script hold of the scheduler** (the scene value 0x1ad and VA 0x0112c9d1) and **how long a tick lasts in real time**: the engine runs no frames.
- **The enemy formation order** is taken to be the game's monster slot order; it decides ties between enemies only.
- **The game's random streams.** One engine draw per kernel draw from the single seeded stream (the RNG lane).
- **Enemy resistance bytes** are the `immunities` of our enemy data (the P5 data wave), not read from the monster files here.
- **The Petrify and Scan change handlers** of the write-back (VA 0x0078e150, 0x007891b0) are presentation and animation state, and one rule: a Petrified
  character with HP below 1 gets the Eject bit. Not modelled.
- **Browser check.** No UI file changed and this worktree has no `public/art`, so the plan's real-input browser check (acceptance case 6) is left to
  the main session's validation. The CTB list shows `predictTurnOrder`'s rows, which the oracle covers.

## 8. Goldens

All 18 digests were re-baselined (`09bf0adb`), Chapter II's two again (`9bd5b576`). Old values are in git history (`bd908802`).

| Golden | Old digests (W1) | New digests | Outcome |
|---|---|---|---|
| seymour-flux#1 | 28692f2c | d6d988d5 | unchanged (defeat) |
| seymour-flux#7 | f923eb10 | 8aa995a1 | unchanged (defeat) |
| yunalesca#1 | 2327f640 | c290c94e | unchanged (victory) |
| yunalesca#7 | 4225415d | bf24ebdd | unchanged (victory) |
| braskas-final-aeon#1 | 567c3bf4 ea51a558 ba4a14f2 509fbd2 1ebf8f7c da4942b3 e84aa63 | 1c226807 67153004 4a4b7aa4 2093256d 4252bff8 9210c50b c12e2c6e | unchanged (victory x7) |
| braskas-final-aeon#7 | 2b85c492 f82347e2 42bd9a74 48d2e753 86304bae 7e4d660e cddd0f5d | a1681a38 36c3ca08 f02a6c2f e461cd79 3ea598fa 10aeab6a 1e1df139 | unchanged (victory x7) |
| seymour-anima-macalania#1 | 15ecc081 | 50d1cb36 | unchanged (victory) |
| seymour-anima-macalania#7 | 86868cbf | 3a5e47f6 | MOVED victory -> defeat |
| evrae-airship#1 | 14674509 | c3c29c19 | unchanged (victory) |
| evrae-airship#7 | 3c97dd63 | a42e3add | unchanged (victory) |
| yojimbo-cavern#1 | fce6b795 | 955b4cb | unchanged (victory) |
| yojimbo-cavern#7 | c3a419df | 5dd41cd1 | unchanged (victory) |
| seymour-natus#1 | d4682a0e | ba205c84 | unchanged (victory) |
| seymour-natus#7 | 2133d3d8 | 4dab376e | unchanged (victory) |
| seymour-omnis#1 | b7b53dbe | dfa46cb6 | unchanged (defeat) |
| seymour-omnis#7 | 1a2a42df | 421c74e9 | MOVED victory -> defeat |
| isaaru-via-purifico#1 | d916c9d0 bc11f7e3 42ea7beb | 70c30985 70d6e055 a372f3f0 | MOVED (third link victory -> defeat) |
| isaaru-via-purifico#7 | b073037f 584e6881 e0f5e2d6 | 36047a9f f5fb7559 87a76d9b | unchanged (victory x3) |

A flipped seed is not a change of difficulty (one sample): section 5 has the 500-seed rates. `ffx2-atb-golden` and `ff7-golden` pass unchanged.

## 9. Full suite

One run of the whole unit suite on `6171dedb` (`node vitest.mjs run`, 2026-10-09, after everything above except the `natus-bench` edit): **929 files, 898 passed, 24 failed,
7 skipped; 13,880 tests, 13,635 passed, 164 failed, 80 skipped, 1 todo.**

The 24 failing files:

- **21 need `public/art`**, which this worktree does not have (the same 21 as the W1 run, `docs/handoff/re-parity-w1.md` section 9): `ui-portrait-face-crop` (125 tests),
  `chapters/trema-ship-content` (4), `art-ref-defaults` (4), `pause-remake` (3), `chapters/isaaru-ship` (3), `chapters/den-of-woe-ship-content` (3),
  `chapter-meta-seymour-anima-macalania` (3), `chapter-meta-evrae` (3), `chapters/natus-ship-scene` (2), `chapters/natus-ship-content` (2), `chapters/leblanc-art` (2),
  `chapters/fallen-aeons-ship-content` (2), `chapter-meta-ffx2-leblanc` (2), `cutscene-story-poses` (1), `chapters/fallen-aeons-ship-scene` (1),
  `chapters/den-of-woe-ship-scene` (1), and five files that fail on import because `public/art/manifest.json` is missing: `party-face-manifest`, `chapters/yojimbo-content`,
  `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`.
- **2 time out at the 15-second default under the load of a full run and pass alone**: `strategy-ffx2-bahamut` ("heal-only route clears Mega Flare", an FFX-2 test; 8 s alone, the
  same file W1 listed) and `live-url-follows-host` (walks the tree; 0.2 s alone).
- **1 was this track's**: `chapters/natus-bench` ("the intended line beats the credibly wrong one ... at the old midpoint") failed with 0 against 0, because Natus's Flare is
  rank 3 now (section 5). Fixed in the commit after the run (the midpoint comparison is `>=`, with the measured numbers in the test); the file passes, 5 of 5.

Every other file passes, including all the parity tests, `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden`. `node tools/orphans.mjs`: no FFX kernel module is left unimported
(the 26 `ffx2/kernel` files are W3's and W4's).

## 10. Decisions for Bailey

1. **Natus's Flare is rank 3 in the game, 5 in our data.** The game's own record is applied. Chapter X's win rate fell from 77.8 to 65.0
   percent (389 to 325 of 500) because Flare now comes about 5.2 times a fight and not 2.9 (section 5), and the guide's drain-farm line (strategy 6) falls from 33 percent
   to none on the 200-seed bench. Options: keep the game's answer
   (the 1:1 reading, and the recommendation), or give Flare a rank of our own, which is an invented number.
2. **Chapter III's first link is harder: 97.9 to 94.8 percent** (42 to 103 losses in 2,000 seeds, all in Braska's Final Aeon and the two Pagodas; section 5). No
   single change put back explains it (the largest, the old rule that a failed Slow still doubled the counter, is 19 wins of the 61, inside the noise), so the move is the sum of the
   engine's smaller exact answers and a feedback loop through the boss's gauge. Nothing was retuned. Recommendation: leave it, and measure the chapter again after the
   AI-YUNALESCA-BFA track merges, because that track replaces the very weights and gauge the loop runs through.
3. **An aeon's Defend now does nothing** (item 14 of section 6): our aeons are immune to Defend, Guard and Sentinel by sourced data and the
   game's extra-status step honours the immunity, where the old engine let the chance byte win. The game's aeons have no Defend command at all.
   Options: take the Defend row off the aeon menu (the game's menu; the recommendation), or leave a row that does nothing.
4. **The KO status reset and Zombie** (section 7): drop Zombie and Scan from `SURVIVES_KO` once the Yunalesca lane has checked the weighting.
5. **The command record's bytes now rule the status step** wherever our own data differed (section 2): Provoke and Threaten bytes, Havoc Shot,
   Time Shot's Slow, Seymour's Full Life, the possessed Zanmato, Evrae's Stone Gaze duration, and the shatter chances. Say if any of these should
   stay ours; each is one line of data.
6. **Stale text, not changed** (rule 6 and 10 cover game text): `ui/common/statusWords.ts` tells the player that a sleeper's "gauge [is] frozen, no
   turns" (the game's sleeper keeps a counter, reaches the front and loses the turn); `data/ffx/statuses/core.ts` says only "a physical hit" can shatter
   a Petrified target (any command with a shatter chance can); the pause screen's status help and the strategy guide were not read line by line.

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-*.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/data-ffx-command-records.test.ts tests/unit/ffx-statuses.test.ts tests/unit/ffx-ctb.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_CAUSE_OUT=causes.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-cause.test.ts
node tools/parity-cause-compare.mjs old-causes.json causes.json seymour-natus
node tools/orphans.mjs
```

NOW.md is left to the main session (other agents are active in the tree).
