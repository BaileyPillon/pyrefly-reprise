# RC4 assembly: the gear, target and item-reaction lanes merged into one FFX line (FFX only)

Status: **assembled, tested and measured on branch `re-parity-rc4`; pushed; not merged into `main`, not deployed** (2026-10-11). Cut from `origin/re-parity-rc4-base` (`f39cd57b`: the live build `fcecfa74` plus RC3 plus each game's own random streams). **Game case: FFX only** (AGENTS.md rule 14): every merged lane is FFX only (FFX-2 builds its characters from dresspheres and has its own spread routine, counters and auto-abilities in its own exe). `ffx2-atb-golden` and `ff7-golden` pass unchanged; `git diff origin/re-parity-rc4-base -- src/battle/ffx2 src/data/ffx2 src/battle/ff7 src/data/ff7` is empty.
Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity. this is very useful for our project."; 2026-10-09 "Your findings need to be implemented into live builds as the decompilation work progresses."; 2026-10-10 "go full speed ahead please" and "ill go with all your recommendations". Deploys need his word. Nothing on a boss or a party member was tuned; no new screen, no new content.
The three lane notes (each has its rows, proofs, mutants and its own measurement; read them for the rules): [re-parity-rc4-gear.md](re-parity-rc4-gear.md) (lane L1: gear and auto-ability decode, equipment auto-statuses and SOS statuses), [re-parity-rc4-react.md](re-parity-rc4-react.md) (lane FFX-G: the engine builds an action's targets once), [re-parity-rc4-items.md](re-parity-rc4-items.md) (lane L3: Auto-Potion, Auto-Med, Auto-Phoenix and the Overdrive results).

## 0. In one paragraph

Three lanes were cut from the same base and each changed how a battle reads the game's own rules. They are now one line: the party's gear is read the way the game reads it (percents added, 3 critical points per worn piece, resistance bytes summed, equipment and SOS statuses switched by the per-action sweep); an action's targets are built once, before any hit (Cover, Reflect, the random spread, Berserk, Confuse, Provoke); and the three item reactions and the Overdrive results are the game's (Auto-Med answers only a newly inflicted Poison, Zombie, Darkness or Silence, an item is paid once, a random-target Overdrive plans every hit and then has some removed). The merge needed three decisions that no single lane could make, all small (section 3), and found one real defect that belongs to a lane and is fixed here (a dry run could change Tidus's Cover counters). `ffx-engine-golden` is re-baselined once for the merged state (section 4). Over 500 seeds per chapter, one chapter leaves the sampling band: **Chapter XII (Seymour Omnis, the Garden of Pain) is easier, 436 to 462 wins of 500**; the cause is the gear lane alone.

## 1. Commits on `re-parity-rc4` (oldest first)

| Commit | What |
|---|---|
| `510493da` | Merge `origin/re-parity-rc4-gear`. No conflict. |
| `49014ce8` | Merge `origin/re-parity-rc4-react`. One conflict, the golden file (comments kept, table left stale on purpose). |
| `de81ab53` | Merge `origin/re-parity-rc4-items`. Five conflicts (section 2) and the one real adaptation: the target builder deals a planned Overdrive's hits and `removePlannedHits` takes some away. |
| `9035b430` | The dry-run clone copies the Tidus counters; `parity-ffx-rc4-merge.test.ts` pins the seams (two mutants caught). |
| `a4e287f5` | `ffx-engine-golden` re-baselined **once**, each moved digest attributed. |
| (this note's commit) | This handoff. |

The golden table is stale in the three merge commits and in `9035b430` (the re-baseline is its own commit, so there is one for the whole assembly, as the brief asked). The tip is green on everything this note lists.

## 2. Merges and conflicts (what each side wanted, what is kept)

| File | Conflict | Resolution |
|---|---|---|
| `tests/unit/ffx-engine-golden.test.ts` (merges 2 and 3) | the comment block and the 18-digest table, both sides appended | all three lanes' comment blocks kept in merge order; the table is rewritten once in `a4e287f5` |
| `src/battle/ffx/runtime.ts` (merge 3) | imports (`AutoState` of the gear lane, `PendingItemReaction` of the items lane) and the new `FFXRuntime` fields (`coverBond` of the react lane; `itemReactions`, `reactionDeaths`, `prepaidItem` of the items lane) | both kept; no field is shared |
| `src/battle/ffx/hit-apply.ts` (merge 3) | imports: the react lane removed `redirectTarget` and `reflectBounceTarget` (the builder decides Cover and Reflect), the items lane added `reactToHit` | `reactToHit` only |
| `src/battle/ffx/engine-end.ts` (merge 3) | the equipment-reaction loop. Gear: a sweep after each reaction, and the loop still ran items. Items: the loop runs only Counterattack and Magic Counter, the item reactions run in `runItemReactions` | the items lane's attack-only loop with the gear lane's `sweepAutoStatuses(ctx)` after it, **and a sweep after each item reaction in `runItemReactions`** (section 3, seam 2) |
| `src/battle/ffx/abilities.ts` (merge 3) | three hunks: imports, the target building, the hit loop. The react lane builds the targets once (`buildAction`); the items lane planned a random-target Overdrive's hits with its own picks (`planSpreadHits`, built on `nextHitTargets`, which the react lane deleted) | section 3, seam 3 |

The other files two lanes both changed, which git merged without a conflict and which were read for a semantic one: `execute.ts` (react's forced attack and items' `prepaidItem`: independent), `engine.ts` (react's forced turn at the turn start, items' `runItemReactions` after the start-of-turn tick: independent, in that order), `hp.ts` (items' cancel of the dying character's queued records and its Auto-Phoenix try, gear's equipment-status restore at an Auto-Life revive: compatible, in the KO order), `intent.ts` (react's forced-turn panel and items' clone fields: the defect of seam 1) and, in merge 2, `runtime.ts`. `docs/CONTRACT-CHANGES.md` has the gear lane's one entry (`EquipmentDef.bonusCrit`); the other two lanes and this assembly touch no contract file.

## 3. The three seams, and the defect found

1. **A dry run changed the real battle's Tidus counters (a defect of the react lane that the merge exposed; fixed in `9035b430`).** The react lane keeps the seven Tidus counters in `FFXRuntime.coverBond`, an array changed in place. `intent.ts#cloneCtx` (the advisor's, the intent panel's and `estimate`'s dry run) copies the runtime with `...ctx.rt`, so a clone shared that array: a dry run of Tidus's Cure or of his cover moved the counters the real battle's Cover scores read. The items lane had already learned this lesson for its own fields and copies them there; `coverBond` is copied now too. No golden digest moves (the 18 were run with and without the copy). Test: `parity-ffx-rc4-merge.test.ts` (mutation: dropping the line fails 1 test; the second test pins that a clone which makes the counters does not make them for the battle).
2. **An item reaction ends in the per-action sweep.** The gear lane's rule is "the SOS statuses are switched at the end of every action, and every reaction is an action of its own". Before the merge Auto-Potion, Auto-Med and Auto-Phoenix were run by the loop that carried the sweep; the items lane moved them to `runItemReactions`, so a potion that lifts a wearer over half HP would have left her SOS Shell on until the end of the turn. `runItemReactions` now calls `sweepAutoStatuses` after each reaction. Test: `parity-ffx-rc4-merge.test.ts` (Auron in a Shell Targe armour with Auto-Potion, struck far under half: the Shell is on the moment the reaction is over, and not before; dropping the call fails it). No golden digest moves (switched off alone, all 18 equal).
3. **A planned Overdrive is dealt by the builder and trimmed afterwards.** The items lane's rule (game: `0x0078ba70` plans, `0x007afe00` trims): a random-target Overdrive (Slice and Dice, Lulu's Fury) plans the menu record's full hit count over the targets one pick at a time (stream 5), the result removes the missing hits one at a time from the targets holding the most (stream 16), and the rest land target by target in character order. The react lane's builder now makes the picks for every random-target row (stream 5, no draw with one candidate), so the items lane's own pick loop was replaced: `resolveAbility` asks `buildAction` for the **full planned count** and `adapt/overdrive-result.ts#removePlannedHits(ctx, built, n)` removes `n` hits from what the builder dealt (`planSpreadHits` is gone). The draws are the same draws in the same order on the same streams: the items lane's engine-level file (`parity-ffx-engine-overdrive-result.test.ts`, an oracle that reads streams 5 and 16 from its own generator, 400 Fury and 200 Slice and Dice fights over one to four enemies) passes **unchanged** on the merged tree and fails on both mutants tried (the builder asked for the casts instead of the full count: 4 tests fail; the removal skipped: 3 fail). Two things differ from the items lane's tree and neither can change a value: the first pick is now made after the targets' `onTargeted` hooks instead of before (the picker and the scripts' hooks draw on different streams), and a member of the set that no pick chose is in the builder's answer and is dropped from the plan. No golden digest moves (the planned path switched off: all 18 equal; no golden line sends a Slice and Dice or a Fury at two enemies).
   One thing was kept as the items lane wrote it and is listed in section 9: the hits of a *planned* Overdrive land target by target with each target's script hearing of its hits before the next target's hits (the items lane's loop), while every other random-target row keeps the react lane's "all hit records first, then every script hears" (the base engine's rule for a spread). I did not change either: the notes do not decide which of the two the game does.

## 4. The goldens, explained (own commit `a4e287f5`, once)

`ffx-engine-golden`: **fifteen of the 18 digests move against the base, three do not** (seymour-natus#7, isaaru-via-purifico#1 and #7). Outcomes: **one moves, seymour-anima-macalania#7 defeat to victory** (the gear lane's critical bonus); the other 17 keep theirs. `ffx2-atb-golden` and `ff7-golden` are unchanged.

How the attribution was proved: the gear lane's two rows that matter on these lines (the equipment critical bonus, 3 per worn piece; the summed percents of the four damage families) were put back on the merged tree (temporary edits to `equipment.ts`, put back byte for byte, sha1 checked) and all 18 were run. **They equal, digest for digest, the react and items lanes' own values together**: flux `33074c0e c3845a`, yunalesca `eced7435 ae1bbe58`, braskas-final-aeon#1 `4d93d0d0 96867650 eb8b7a8a 88ef63f8 3c10c054 4e0e8bde 2cb442aa`, evrae `f4927a78 b67a717e`, and the base's value for every other digest. Each row alone, then, gives the per-row attribution:

| Digest (base to merged) | Moved by | Evidence |
|---|---|---|
| seymour-flux#1 `d362acf6` to `33074c0e`, #7 `9f8aaa5c` to `c3845a` | react only (the random spread of the Gems, G6) | unchanged by the gear rows |
| evrae-airship#7 `4740e2ef` to `b67a717e` | react only (Photon Spray and Power Shot, G6) | unchanged by the gear rows |
| evrae-airship#1 `e5ecff52` to `4f323f6e` | **react and gear**: the spread reorders Evrae's rolls (`f4927a78`), then the wider critical window catches one of them | critical row put back: `f4927a78`; percents put back: unchanged. The gear lane alone left this digest where it was; the composite is new |
| yunalesca#1 `c694ec20` to `ef0b1f5a`, #7 `a99a90c3` to `e75064e9` | gear (critical and percents) and react (the Hastega bounce and Chapter II's new opening, G2) | both gear rows back: `eced7435`, `ae1bbe58`, the react lane's values |
| braskas-final-aeon#1, all seven links | gear (critical and percents) and items (Auron's Auto-Med no longer answers Petrify, F2) | both gear rows back: the items lane's values, link for link |
| braskas-final-aeon#7 | gear (both rows) | neither lane else moves it; both rows back: the base's |
| seymour-anima-macalania#1 `7ef9b368` to `a6d9e71f`, #7 `29f126ed:defeat` to `e9ae2f10:victory` | gear (critical bonus) | critical back: both return to the base; percents back: unchanged |
| seymour-natus#1 `409993aa` to `40514ec8` | gear (critical bonus) | critical back: the base's |
| yojimbo-cavern#1 `c72bb8ab` to `62272b5c`, #7 `9f40902b` to `af8241eb` | gear (summed percents: Yuna's Blessed Ring) | percents back: the base's |
| seymour-omnis#1 `1d95ac3b` to `d2966784`, #7 `5089f63` to `30b6f82f` | gear (both rows) | each row alone leaves a third value; both back: the base's |

The comment beside the table carries the same words. A moved digest is a deal of the same odds, not a change of difficulty; one seed is one sample (section 6 has 500). Nothing was tuned.

## 5. Tests

`npx tsc --noEmit` (the Node route in the brief): exit 0, after every merge and at the tip. `node tools/orphans.mjs`: 36 orphans, the same 36 as the base; none of the new modules is one.

- **The lanes' named files** (tip): the gear lane's six (`parity-ffx-gear`, `ffx-gear-table`, `parity-ffx-auto-status`, `parity-ffx-engine-gear`, `parity-ffx-engine-auto-status`, `ffx-effective-stats`), the react lane's six (`parity-ffx-target-builder`, `-cover`, `-sets`, `-forced`, `parity-ffx-engine-targets`, `parity-ffx-rng-streams`) and the items lane's five (`parity-ffx-reaction-items`, `parity-ffx-overdrive-result`, `parity-ffx-engine-reactions`, `-reactions-live`, `parity-ffx-engine-overdrive-result`): **17 files, 238 tests passed, 2 skipped** (the two big-set switches), unchanged files, no edit to any of them in the assembly.
- **Wider set** (107 files: all 50 `parity-ffx-*`, `rng-streams`, the 40 `advisor*` and `ffx-advisor*`, the chapter and strategy files the lanes touched, the three goldens, the new seam file): 99 files passed, **8 failed with 10 tests, every one a load timeout** ("Test timed out in 60000 ms" to 240000 ms; the machine was at 100 percent CPU from other lanes, the run took 44 minutes). The same eight files re-run alone, two workers: **8 of 8 pass, 58 tests** (`advisor-plan` 13 tests in 190 s; `advisor-degenerate-boards`, `advisor-noop-30-turns`, `advisor-noop-guard`, `advisor-plan-recovery`, `advisor-sentence`, `strategy-seymour-flux` (the 144-of-160 floor holds) and `omnis-advisor-discs`).
- **The seam file** `parity-ffx-rc4-merge.test.ts`: 4 tests, 2 mutants caught (section 3).
- **The whole suite, once, at the tip:** `vitest run --maxWorkers=4 --testTimeout=400000` (a long per-test timeout because the machine was at 100 percent CPU from other lanes; JSON report `D:Toolsfx-parityc4-assemblysuite.json`, classifier `classify-suite.cjs`), 1,774 s: **1,114 files: 1,079 passed, 13 skipped, 22 failed; 16,793 tests: 16,496 passed, 113 skipped, 1 todo, 183 failed. No timeout.** The 183 are **the same 22 files and the same 183 tests that fail on `origin/re-parity-rc4-base` (`f39cd57b`)**, as the gear lane ran it on that commit: the worktree has no `public/art` (the paintings are gitignored and live on the main tree's disk). Files: `art-ref-defaults`, `chapter-meta`, `chapter-meta-evrae`, `chapter-meta-ffx2-leblanc`, `chapter-meta-seymour-anima-macalania`, `cutscene-story-poses`, `party-face-manifest`, `pause-remake`, `ui-portrait-face-crop` (145 of the 183), and under `chapters/`: `chapters-6-7-8-enemy-sprite-manifest`, `den-of-woe-ship-content`, `den-of-woe-ship-scene`, `experiment-scene`, `fallen-aeons-ship-content`, `fallen-aeons-ship-scene`, `isaaru-ship`, `leblanc-art`, `leblanc-party-sprites`, `natus-ship-content`, `natus-ship-scene`, `trema-ship-content`, `yojimbo-content`. Every failing assertion is a plate, sidecar or manifest on disk; the one exception in kind is `trema-ship-content` "shipped kit on Trema: a Soul Spring drains him first" (FFX-2 Chapter XIII data, expected `x2-soul-spring`, got `x2-alchemist-stash-phoenix-down`), which the items lane found failing identically on the unchanged base and which this assembly cannot have moved (`git diff origin/re-parity-rc4-base -- src/battle/ffx2 src/data/ffx2` is empty).

## 6. Measurement (every FFX chapter, shipped line, merged tree against `origin/re-parity-rc4-base`)

`tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`, seeds 1 to 500 in one run (the 12-seed table is seeds 1 to 12 of the same run). Before = the base, whose three 500-seed files made by the three lanes are byte for byte equal (sha1 `8be8764c`), so one is used. Raw: `D:\Tools\ffx-parity\rc4-assembly\merged-500.json`, the base `D:\Tools\ffx-parity\rc4-gear\before-500.json`, the ablation `abl-gear-500.json`; compare script `cmp.cjs`. A mover is a win count outside two standard errors of the difference of two proportions at 500 seeds (or 2 of 12). Chapter numbers: VII Macalania, VIII Evrae, IX Yojimbo, X Natus, XII Omnis, XIV Isaaru, XVII and XVIII Sin.

### 500 seeds

| Chapter | Wins before to after | Party turns | Engine turns | Party KOs | z | Flipped W to L / L to W | Seeds identical |
|---|---|---|---|---|---|---|---|
| I seymour-flux | 499 to 499 | 48.9 to 48.6 | 67.5 to 66.9 | 1 to 1 | 0.00 | 1 / 1 | 380 |
| II yunalesca | 474 to 476 | 154.9 to 145.0 | 216.9 to 209.4 | 12.9 to 13.7 | 0.29 | 22 / 24 | 0 |
| III braskas-final-aeon | 481 to 479 | 241.0 to 231.7 | 387.7 to 373.0 | 5.5 to 5.4 | -0.32 | 8 / 6 | 2 |
| VII seymour-anima-macalania | 467 to 470 | 54.9 to 54.7 | 87.1 to 86.7 | 4.8 to 4.7 | 0.39 | 3 / 6 | 366 |
| VIII evrae-airship | 488 to 488 | 72.6 to 71.0 | 91.7 to 89.8 | 0.7 to 0.7 | 0.00 | 0 / 0 | 266 |
| IX yojimbo-cavern | 493 to 493 | 67.4 to 67.4 | 95.9 to 95.9 | 3.9 to 3.9 | 0.00 | 0 / 0 | 497 |
| X seymour-natus | 483 to 483 | 34.0 to 33.5 | 49.0 to 48.3 | 1.7 to 1.7 | 0.00 | 1 / 1 | 388 |
| **XII seymour-omnis** | **436 to 462** | 103.0 to 95.3 | 139.7 to 129.1 | 1.3 to 0.8 | **2.72** | 25 / 51 | 13 |
| XIV isaaru-via-purifico | 452 to 452 | 38.2 to 38.2 | 84.4 to 84.4 | 2.9 to 2.9 | 0.00 | 0 / 0 | 500 |
| XVII sin-fins-core | 442 to 437 | 328.1 to 296.4 | 419.4 to 382.9 | 3.0 to 3.0 | -0.48 | 36 / 31 | 2 |
| XVIII sin-face | 500 to 500 | 47.2 to 45.3 | 52.5 to 50.3 | 0 to 0 | 0.00 | 0 / 0 | 40 |

Link-1 wins are the same as wins in every chapter except XIV (500 before and after) and XVII (499 before and after).

### 12 seeds (seeds 1 to 12; a one-seed move is z about 1, so this is a sanity check, not evidence)

| Chapter | Wins | Party turns | Engine turns | Party KOs | Flipped W to L / L to W |
|---|---|---|---|---|---|
| I seymour-flux | 12 to 12 | 48.3 to 48.0 | 68.3 to 67.8 | 1.3 to 1.3 | 0 / 0 |
| II yunalesca | 10 to 12 | 165.7 to 149.3 | 230.9 to 214.0 | 14.1 to 13.7 | 0 / 2 |
| III braskas-final-aeon | 11 to 11 | 233.0 to 239.6 | 378.4 to 386.2 | 6.0 to 5.5 | 0 / 0 |
| VII seymour-anima-macalania | 11 to 12 | 54.0 to 54.2 | 87.2 to 87.9 | 5.0 to 4.8 | 0 / 1 |
| VIII evrae-airship | 12 to 12 | 71.3 to 70.9 | 89.1 to 88.6 | 0.6 to 0.7 | 0 / 0 |
| IX yojimbo-cavern | 11 to 11 | 65.3 to 65.3 | 92.5 to 92.5 | 3.6 to 3.6 | 0 / 0 |
| X seymour-natus | 11 to 11 | 35.4 to 35.0 | 52.1 to 51.5 | 2.4 to 2.4 | 0 / 0 |
| XII seymour-omnis | 9 to 11 | 102.1 to 91.5 | 138.8 to 124.3 | 1.9 to 0.8 | 0 / 2 |
| XIV isaaru-via-purifico | 11 to 11 | 37.6 to 37.6 | 83.3 to 83.3 | 3.0 to 3.0 | 0 / 0 |
| XVII sin-fins-core | 11 to 11 | 355.5 to 310.0 | 450.8 to 395.7 | 4.1 to 1.7 | 1 / 1 |
| XVIII sin-face | 12 to 12 | 47.3 to 45.5 | 52.4 to 50.5 | 0 to 0 | 0 / 0 |

### Causes, by ablation (merged tree, 500 seeds, the gear lane's two rows put back; `D:\Tools\ffx-parity\rc4-assembly\abl-gear-500.json`)

With the equipment critical bonus and the summed damage percents put back, the merged tree measures **exactly the react lane's and the items lane's own numbers** (the table below is those two lanes together on the base): Chapter II 465 wins / 148.4 turns / 14.2 KOs (the react lane's figures to the digit) and Chapter III 473 / 242.2 / 5.6 (the items lane's to the digit). The gear lane's two rows are then the rest:

| Chapter | Base | React + items (gear rows put back) | Merged | Cause of the move |
|---|---|---|---|---|
| XII seymour-omnis | 436, 103.0 turns, 1.3 KOs | 436, 103.0, 1.3 (identical to the seed, 500 of 500) | **462**, 95.3, 0.8 | **the gear lane, alone.** +26 wins (87.2 to 92.4 percent), outside the band (2 se = 19.1). The party wears two tiers of Strength and Magic (the sum is +15 where the engine used +10) and every Attack has 3 more critical points |
| II yunalesca | 474, 154.9, 12.9 | 465, 148.4, 14.2 | 476, 145.0, 13.7 | the two lanes pull opposite ways on wins and agree on turns: react -9 (Hastega no longer gets through Reflect; the opening is Hastega first, Reflect second), gear +11 wins and 3.4 fewer party turns (in the gear lane's own ablation its critical row adds wins and its summed Magic Def takes more off the party's heals; not split again here). Net +2, inside the band |
| III braskas-final-aeon | 481, 241.0, 5.5 | 473, 242.2, 5.6 | 479, 231.7, 5.4 | items -8 (Auron's Auto-Med no longer burns a Remedy on Petrify; Lulu's Soft cures it on a turn), gear +6 and 10.5 fewer turns. Net -2, inside the band |
| XVII sin-fins-core | 442, 328.1, 3.0 | 441, 327.9, 3.0 | 437, 296.4, 3.0 | wins inside the band; the line kills 10 percent faster, all of it the gear rows (summed percents -22 turns, critical -9 in the gear lane's own ablation) |
| XVIII sin-face | 500, 47.2 | 500, 47.2 | 500, 45.3 | gear rows, 4 percent faster |
| VII seymour-anima-macalania | 467, 54.9 | 469, 55.1 | 470, 54.7 | inside the band. The ablation puts back only the critical and percent rows, so the 469 still has the gear lane's SOS Shell on Rikku's armour (+2 in the gear lane's own table); the critical bonus adds the last +1 |
| VIII evrae-airship, X seymour-natus | 488 / 483 | identical | 488 / 483, turns 72.6 to 71.0 and 34.0 to 33.5 | critical bonus only (gear) |
| I seymour-flux | 499 | 497 | 499 | the react lane's spread (the Gems) loses 2 seeds, a different deal of the same odds (react note); the gear rows win 2 back. All inside the band |
| IX yojimbo-cavern, XIV isaaru-via-purifico | identical | identical | identical (497 and 500 of 500 seeds) | nothing in these lines reads a changed rule |

## 7. Disclosures: what the player will notice (difficulty, in plain words)

- **Chapter XII (Seymour Omnis, the Garden of Pain) is easier.** The party wins 92 of 100 runs of the shipped line where it won 87, in about 8 fewer party turns and with fewer knock-outs (1.3 to 0.8 a run). Cause: the party's bonus gear now adds up, and every weapon and armour adds 3 to the critical chance. Parity, not tuning; it is the only chapter that leaves the band.
- **Sin (Chapters XVII and XVIII) and Braska's Final Aeon (III) go faster**, by about 10, 4 and 4 percent of the party's turns. Wins are the same.
- **Yunalesca (II)** plays about 6 percent faster and costs about 0.8 more knock-outs a run; the win rate is the same (95.2 percent). Her opening changed: Tidus casts Hastega before Yuna raises Reflect, because Hastega bounces back at Yunalesca off a Reflecting Yuna.
- **Spells now find their targets as the game does**, in every chapter: a Hastega, Slowga or Nul spell cast at a Reflecting character goes across to an enemy; Reflect off an enemy sends a spell straight back at the caster; Guard and Sentinel cover for whoever is best placed once for a whole attack; a Provoked monster spends its turn on whoever provoked it (except Seymour Natus, Braska's Final Aeon and the Sinspawn Gui); a Confused fighter hits only its own side, a Berserk one only the other.
- **Auron's Auto-Med** (Tetra Bracer in Chapters III and XVII) no longer cures Petrify, Sleep, Confuse, Berserk, Slow or Curse; it cures a new Poison, Zombie, Darkness or Silence only. The line cures Petrify with Lulu's Soft on her turn.
- **Rikku's Shell Targe works** (Chapter VII): she has Shell while under half HP.

## 8. CHANGELOG paragraphs (FFX; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX only. Gear works the way the game's does.** Bonuses of one kind on a piece now add up: Magic Def +10% and +5% on Yuna's Blessed Ring is 15%, two HP +10% are HP +20%. Every weapon and every armour adds 3 to your critical chance, so a character wearing both has 6 and criticals land a little more often. Curse Ward now stops Curse completely, like Curseproof, and two Wards against the same status add together. Rikku's Shell Targe finally does what it says: while she is under half HP she gets Shell, and loses it again when she is healed; the Auto-Shell, Auto-Haste and other auto-statuses a character wears come back after a revive or when Petrify wears off. In the Garden of Pain (Seymour Omnis), Braska's Final Aeon and the two Sin fights the party hits a little harder and a little more often, and the Garden of Pain is noticeably easier for it.

**FFX only. Spells and blows now find their targets the way the real game does.** A spell aimed at an enemy that wears Reflect comes straight back at whoever cast it; a Reflect on your own side sends the spell to a random enemy instead, and that now includes Hastega, Slowga and the Nul spells, which used to ignore Reflect altogether, so a Haste meant for a party member wearing Reflect goes across to an enemy. Guard and Sentinel now cover for whoever is best placed (the one with the most HP, doubled for Sentinel, leaning toward whoever Tidus has been looking after), once for the whole attack, and only if the guard is in a state to act. Multi-hit random attacks such as the Gems, Slice and Dice, the Furies and Evrae's Photon Spray now choose all their targets up front. A Confused fighter strikes only its own side, itself included; a Berserk one only the other side; and a Provoked monster spends its whole turn attacking whoever provoked it, unless it is one of the few that keep their own head (Seymour Natus, Braska's Final Aeon, the Sinspawn Gui). Chapter II's recommended opening changed with it: Tidus casts Hastega before Yuna puts Reflect up, so the Haste is not turned back onto Yunalesca.

**FFX only. Auto-Med, Auto-Potion and Auto-Phoenix now work the way the game's do, and two Overdrive details follow the game.** Auto-Med only reaches for a cure when a hit gives you a Poison, Zombie, Darkness or Silence you did not already have, and it no longer burns a Remedy on Petrify, Sleep, Confuse, Berserk, Slow or Curse; when two land at once it uses a Remedy, otherwise the matching cure (Antidote, Holy Water, Eye Drops, Echo Screens) and a Remedy only if that one has run out. Auto-Potion drinks at exactly half HP or below, only after a hit that took HP off, and a character who is knocked out by that same blow loses the potion; Auto-Phoenix raises a fallen friend once, with a Phoenix Down only (never a Mega Phoenix), using the first able wearer in party order, and does nothing for someone who still had Auto-Life. Each of these now spends one item, not two. In the Overdrives, Auron's Banishing Blade, Shooting Star and Dragon Fang now also take their stronger "immune" strike against a foe that already has the status they would inflict, and Slice & Dice's miss and Lulu's Fury with fewer casts now spread all their hits over the foes first and then take the missing ones away from the foes that were hit most, instead of re-aiming each remaining hit (it only shows when two or more foes are standing).

(Nothing about any boss or party member's numbers changed in any of the three.)

## 9. Open items (the union of the three lanes' lists, plus the assembly's)

The lanes' own lists stand (gear: C5, C6 and C8 not changed, the SOS sweep's timing between hits, a KO'd member's Auto-* statuses at the next sweep, FFX-D, aeons; react: G13 needs script data, slice G-c, the 44 `random-*` rows with no spread bit, processing order in a spread, Tidus counters start at 0, Provoke "keeps control" is taken from three scripts, Scan on a Reflecting enemy bounces; items: F4 and F5 (the 62-slot reaction queue), B2 to B4, the first pass's own draws are not modelled, Petrified Bushido targets, Auto-Phoenix for a monster victim). New or changed by the assembly:

1. **Planned-Overdrive finish order (seam 3).** A planned Overdrive lets each target's script hear of its hits before the next target's hits land; every other random-target row lets all hit records land first. The notes do not say which the game does for either; it matters only for a script that listens to a random-target Overdrive (the Fins, Genais, the Core against a Fury or Slice and Dice), and only through the order of that script's own reaction. Decide from the next read of the scripts (`FFX-G01` and `FFX-G04` section on the per-target step).
2. **The gear lane's note calls Seymour Omnis "Chapter X"** in two places (its chapter list and its mover table); it is **Chapter XII** (Natus is X). Fixed here only in this note; the lane note is left as its author wrote it.
3. **The items lane's note names `adapt/overdrive-result.ts#planSpreadHits`**, which no longer exists (section 3, seam 3: `removePlannedHits`). Left as is.
4. **`src/battle/ffx/intent.ts` is 740 lines** (729 on the base, 11 added by the lanes and this assembly; AGENTS.md rule 7 says 400). It was over the limit before; a split is its own change.
5. **`research/ffx-combat-core.md` §4.2 and §9, the strategy guide's Reflect wording and the doc comments the react lane listed as stale** are still stale (the react lane's open item 6, the items lane's open item 7).
6. **`sin-fins-core-bench` and the advisor files are slow** under a loaded machine; the two bench tests carry a 60 s timeout (react lane, `32407992`). The 10 timeouts of the wider run are a measure of the machine, not of the merge, but there is no base run of the same files on this load to prove it; the same eight files pass alone.
7. **`critic-plan`** (`node tools/critic-plan.mjs` on `a4e287f5`, previous live build `2ae1a9e4`) says: review DEEP; FOCUSED review of the production candidate before a deploy, live verification and the DEEP review on the live build after it; obligations live + focused + deep. The list of reasons also carries the base's audio and manifest files (they are in the live build's diff, not this assembly's).

## 10. Decisions for Bailey (all four lanes' decisions in one place, with the lane that raised each)

1. **Q5, Fahrenheit's Lulu 700, Auron 2,000, Kimahri 1,250 (gear).** `research/ffx-evrae-airship.md` §9.3 does not say whether the HP column is before or after the +10 HP armours. Left as the note says; (a) treat the three as Sphere Grid HP (770, 2,200, 1,375, consistent with Tidus and Wakka), or (b) keep them. Chapter VIII measures 488 wins of 500 either way.
2. **Chapter XII is easier by 5 points** (436 to 462). Parity; disclosed, nothing to do unless you want it kept at the old difficulty by a deliberate departure from 1:1.
3. **Chapter II's opening (react).** Hastega first, Reflect second (465 against 474 wins before the gear rows; 476 merged). Keep it, or ask for another way to protect the party from Yunalesca's counters.
4. **Hastega, Slowga and the Nul spells bounce off Reflect in every chapter (react).** It is the game's rule; the guide's wording and `research/ffx-combat-core.md` §4.2 say otherwise. Should the strategy guide carry a line about it ("do not Haste a Reflecting character")?
5. **Random rows with no spread bit (react).** Keep the 44 stand-ins, or add a target-type word to the records so the reel shots and Mix results follow the game's group and all-target rules?
6. **G13 (react).** The target class and the "only targetable by" id need a read of the scripts' property writes; the same read the boss-AI lanes would use. Do it with the next read, or leave the approximation.
7. **Auron's Auto-Med no longer answers Petrify (items).** The game's rule. If you would rather keep the old gift it is a deliberate departure from 1:1 and I will not do it without your word.
8. **The reaction queue, F4 and F5 (items).** An architecture change (XL); recommended not now.
9. **Deploy.** Nothing is deployed. The critic plan above says what it needs first (a focused review of the candidate, then the deep review on the live build).

## 11. Re-run (repo root; Node 24; TEMP and TMP on D:)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx-rc4-merge.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts tests/unit/parity-ffx-gear.test.ts tests/unit/ffx-gear-table.test.ts tests/unit/parity-ffx-auto-status.test.ts tests/unit/parity-ffx-engine-gear.test.ts tests/unit/parity-ffx-engine-auto-status.test.ts tests/unit/parity-ffx-target-builder.test.ts tests/unit/parity-ffx-target-cover.test.ts tests/unit/parity-ffx-target-sets.test.ts tests/unit/parity-ffx-target-forced.test.ts tests/unit/parity-ffx-engine-targets.test.ts tests/unit/parity-ffx-rng-streams.test.ts tests/unit/parity-ffx-reaction-items.test.ts tests/unit/parity-ffx-overdrive-result.test.ts tests/unit/parity-ffx-engine-reactions.test.ts tests/unit/parity-ffx-engine-reactions-live.test.ts tests/unit/parity-ffx-engine-overdrive-result.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=<file> (same vitest, --maxWorkers=1 --testTimeout=3000000) tests/unit/ffx-parity-measure.test.ts
node D:/Tools/ffx-parity/rc4-assembly/cmp.cjs D:/Tools/ffx-parity/rc4-gear/before-500.json <file> 500     (or 12)
```

The ablation of section 4 and section 6 is two temporary edits to `src/battle/ffx/equipment.ts` (`equipmentCrit` returns the weapon's `bonusCrit ?? 0`; `offensiveBonusPercent` and `defensiveBonusPercent` take the best tier of the family), never committed; the scripts are in the scratch folder of the run and the 18 digests of each variant are in `D:\Tools\ffx-parity\rc4-assembly\golden-print-*.log`.
