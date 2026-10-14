# Re-parity RC7: the assembly of the four command, Mix and automatic-status lanes

Status: **assembled, tested and committed on branch `re-parity-rc7` (from `origin/re-parity-rc6-ch2`, `f6af1e3b`); pushed to `origin/re-parity-rc7`; not merged to main, not deployed** (2026-10-14).
**Game case: both games, each lane by its own game** (AGENTS.md rule 14). FFX: lane L-CMD (the command rules, `FFX-G07`) and lane FFX-H (Rikku's Mix chart and the item bag, `FFX-G05`). FFX-2: lane X2-D (automatic statuses, SOS layer, Berserker counters, Evade & Counter, `FFX2-G04`) and lane X2-B (the command menu's data and rules, `FFX2-G02`). No FFX lane touches `src/battle/ffx2` or `src/data/ffx2`, and no FFX-2 lane touches `src/battle/ffx` or `src/data/ffx`; `ff7-golden` and `src/battle/ff7` are untouched.
No boss number and no party number was changed or added by any lane or by this assembly.

Bailey's words (the owner), as the brief quotes them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (the full Mix chart with the 21 missing results and nearest-family effects; the FFX-2 menu data and rules first; numbers-only tables in the repo); 2026-10-13 "i'll go with all of your recommendations", "so it can go in live builds asap", "keep going please full speed ahead".

## 1. Result in one paragraph

Four branches cut from the same base are one line now, in four merge commits, two of them with a conflict (both joined by hand, section 3). **Nothing a chapter measures moved except one thing the FFX-2 menu lane already disclosed**: on the shipped line of every FFX chapter (11 chapters, 12 and 500 seeds) the merged tree equals the base seed for seed, byte for byte (`cmp` of the two result files is equal), and the whole-chain event logs move on exactly the seeds lane L-CMD named (Braska 149 of 500, Sin: the Face 124, Yunalesca 1) and nowhere else; on the FFX-2 shipped line (8 chapters, 12 and 500 seeds) seven chapters equal the base to the last digit and Chapter V (Vegnagun and Shuyin) carries lane X2-B's Silence-scope movement and nothing more (wins 490 and 490, every seed the same outcome, +35 party turns and +3 party KOs over 500 seeds). Lane X2-D adds nothing to the shipped line (no shipped girl holds an automatic ability); on its three variant loadouts the merged tree equals lane X2-D alone seed for seed. `ffx-engine-golden` (18 of 18) and `ff7-golden` are unchanged; `ffx2-atb-golden` carries the one digest lane X2-B moved and no other. The assembly re-baselines nothing.

## 2. The merges

All four are `git merge --no-ff`, each its own merge commit, in the brief's order. Base `f6af1e3b` is `ab57f082` plus a docs-only note (`git diff --stat ab57f082 f6af1e3b` is one handoff file).

| Order | Merge commit | Lane (its tip) | Conflicts | Case |
|---|---|---|---|---|
| 1 | `ab090892` | `origin/re-parity-rc7-cmd` (`308c8cc2`): `FFX-G07`, rows I1 to I5 and J1 to J5, then the 2026-10-14 Entrust and Nul-All MP values | none | FFX only |
| 2 | `2bed0d39` | `origin/re-parity-rc7-x2auto` (`30977020`): `FFX2-G04`, rows XD1 to XD6 | none | FFX-2 only |
| 3 | `a845c887` | `origin/re-parity-rc7-mix` (`2dda1f1e`): `FFX-G05`, rows H1 to H8 | `src/battle/ffx/execute.ts` (text) and `aim` (meaning), joined by hand | FFX only |
| 4 | `640bcaf8` | `origin/re-parity-rc7-x2cmd` (`1580aa14`): `FFX2-G02`, rows XB1 to XB13 | `src/battle/ffx2/engine-core.ts` and `setup.ts` (import lines), joined by hand | FFX-2 only |

The handoffs of the four lanes are `re-parity-rc7-cmd.md`, `re-parity-rc7-x2auto.md`, `re-parity-rc7-mix.md` and `re-parity-rc7-x2cmd.md` in this folder; each keeps its own tables, mutant lists and re-run commands. This note adds only what the merge changes.

## 3. The seams

**3.1 `execute.ts`, item payment (lane L-CMD with lane FFX-H; FFX only).** L-CMD makes a command pay (MP, gauge, item) only after the cost check and the range filter have let it start, so a command that does not start costs nothing. FFX-H moved the payment of an item into `item-use.ts#payForItem`, called **before** both checks, and routed every stock change through the game's 99-per-stack bag. A text merge produced one marker, and a second hidden clash: both lanes declared `const aim`. Joined so that both intents hold:

- `item-use.ts` now has two halves. `itemAbility` runs where the old code set up the item (the aeon refusal, the item's own targeting and name), because the range filter needs the item's targeting. `payForItem` runs after the filter and the cost check: the reaction's prepaid item, the bag spend charged to the user (`spendItem(ctx, id, actor)`: 99 cap, a monster never touches the bag), "No items left", and the Spare Change pay (`payGil`: paid in full or not at all).
- `command-start.ts#fizzle` returns a reaction's prepaid item **through the bag with its user** (`refundItem(ctx, id, actor)`).
- A Mix is aimed by the game's auto-target, not by the command: the range filter is given the Mix's picked targets (`mix.targets`, else `command.targets`). The same list is what `action-start` announces and `resolveAbility` hits. A Mix's ingredients are spent by the resolver before the filter and **stay spent** if the filter refuses: `FFX-G05` says the executor's refund of the result record finds nothing to return (the queue-time deduction stops at the Mix command), so no refund is added.
- Proof the join is live: `parity-ffx-engine-command` ("an item is spent only when the command starts; one paid for in advance comes back when it does not") fails on a scratch mutant that pays the item before the filter (checked: 1 failed of 17) and passes on the join; the 14 tests of `parity-ffx-engine-mix` and the 17 of `parity-ffx-mix` pass on it.
- `execute.ts` is 363 lines (it was 378 and 371 in the two lanes).

**3.2 `engine-core.ts` and `setup.ts` (lane X2-D with lane X2-B; FFX-2 only).** Import lines only: X2-D added the counter queue (`runPartyCounters`) and the layer start (`initAutoLayers`, which replaced the old `accessoryAutoStatuses` use), X2-B moved `MenuContext` to `menu.ts` and added `gateAutoTags` and `autoWordsOf`. Kept both sides' lines; `tsc` is clean.

**3.3 Checked, no change needed.**

- X2-D's layer words (`unit.autoLayer.words`, the counters) and X2-B's MP words (`unit.autoWords`, Half MP Cost, One MP Cost, Magic Booster) are built by the same kernel (`abilityWords`) from different sources (the rows the layer holds, the worn ladder plus the grid's tags). They do not overlap in what they feed; both stay. A later change that wants one set of words per girl should merge them (open item 4).
- X2-B removed the passive markers from the menu (Counterattack, Magic Counter, Evade & Counter are no longer rows) and X2-D made them work from the ability ids: the two are consistent, and the three variant loadouts below equal X2-D alone seed for seed.
- X2-B's re-pinned digest (`CH5_D0` seed 4) is not moved further by X2-D (it holds in the merged tree).
- The cost-check placement (L-CMD) is before the Mix is shaped, so the gauge is checked before the ingredients are spent, and the Mix still spends no gauge when it finds nobody (FFX-H).

## 4. Goldens

Each game's goldens were recomputed once on the merged tree, not lane by lane.

| Golden | Result | Why |
|---|---|---|
| `ffx-engine-golden` (9 chapters x seeds 1 and 7, every link's full log) | **18 of 18 unchanged, nothing re-baselined** | The pinned seeds never reach a changed path: neither L-CMD's dropped target nor FFX-H's Mix and 99-cap fire on them. (The seeds that do fire are in section 6.3.) |
| `ffx2-atb-golden` (Chapters 4 and 5, D = 0 and D = 1500, Wait, the speed lever) | **one digest differs from the base: `CH5_D0` seed 4, `92f34919fb6d8fcc` to `4662e80c1515469b`; the other 59 are the base's** | Lane X2-B's. Cause, by its ablation: in Chapter V link 4 Rikku is Silenced and used to cast Black Sky, an Arcana spell the old Silence rule let through; the game silences Arcana, so she now uses Darkness, and a Silenced Yuna can use Pray and Vigor. Lane X2-D moves no digest. The re-pin was already committed by X2-B; the merged tree reproduces it |
| `chapters/den-of-woe-carry` (pins the same Chapter 5 seed 4 once more) | the same one hash, already re-pinned by X2-B; the other 31 are the base's | same cause |
| `ff7-golden` | unchanged | no lane touches FF7 |

I added a dated paragraph to the header of `ffx-engine-golden.test.ts` and of `ffx2-atb-golden.test.ts` (comments only) so the table's history says the RC7 merge moved nothing further.

## 5. Checks

All run from the worktree with the tools by path and `TEMP`/`TMP` on `D:`.

| Check | Result |
|---|---|
| `tsc --noEmit` (whole project, TypeScript 7) | clean after the two hand joins and on the tip |
| The lanes' named files: `parity-ffx-command-gate` (15), `parity-ffx-engine-command` (17), `parity-ffx-mix` (17), `parity-ffx-bag` (20), `parity-ffx-engine-mix` (14), `data-ffx-command-records` (19), `data-ffx-tables-abilities` (62), `parity-ffx2-auto-layer` (19), `-auto-engine` (20), `-auto-sources` (11), `-auto-clock` (6), `parity-ffx2-command-menu` (7), `parity-ffx2-menu-engine` (28), the three goldens, `den-of-woe-carry`, the updated older tests (`yojimbo-callouts`, `yojimbo-repair`, `parity-ffx-ai-omnis-discs`, `r38-telegraph-hold`, `strategy-ffx2-bahamut`, `ffx2-command-attack-identity`, `ffx2-command-menu-attack-duplicate`, `ffx2-berserk-zero-rows`, `trema-kit`) | all pass |
| Every `parity-ffx-*` and `parity-ffx2-*` file, and `rng-streams` (the substring filters `parity-ffx-`, `parity-ffx2-`) | 106 files, 2,117 tests passed, 14 skipped by their own flags, 0 failed |
| `node tools/orphans.mjs` | 28 modules nothing imports, none of them a module of these lanes (the FFX kernel orphans `drops.ts` and `gear-drop.ts` are lane FFX-M's) |
| Source files over 400 lines | none that a lane touched (the three over 400, `ffx/intent.ts`, `ffx/simulate.ts`, `ffx2/intent.ts`, are the base's) |
| The whole suite, once, `--maxWorkers=2` | see section 5.1 |

### 5.1 The whole suite (once, on the tip before this note's commit)

`vitest run --maxWorkers=2` from the worktree root on the tip (the commits after it are comment-only notes in the two golden tests and this note), `TEMP` and `TMP` on `D:`, 2,225 s: **1,175 files: 1,137 passed, 15 skipped, 23 failed; 17,854 tests: 17,555 passed, 183 failed, 115 skipped, 1 todo.** The 23 sort as follows.

1. **22 files are the art-only set** a worktree without `public/art` has, the same 22 files and the same 182 tests that `origin/re-parity-rc6-ch2` and every lane record (each failure is an ENOENT on `public/art/...`, a missing `public/art/manifest.json`, or "does not resolve under public/"): `ui-portrait-face-crop` (145 tests), `art-ref-defaults` (4), `pause-remake` (3), `chapter-meta` (file), `chapter-meta-evrae` (3), `chapter-meta-ffx2-leblanc` (2), `chapter-meta-seymour-anima-macalania` (3), `cutscene-story-poses` (1), `party-face-manifest` (file), `chapters/chapters-6-7-8-enemy-sprite-manifest` (file), `chapters/den-of-woe-ship-content` (3), `chapters/den-of-woe-ship-scene` (1), `chapters/experiment-scene` (1), `chapters/fallen-aeons-ship-content` (2), `chapters/fallen-aeons-ship-scene` (1), `chapters/isaaru-ship` (3), `chapters/leblanc-art` (2), `chapters/leblanc-party-sprites` (file), `chapters/natus-ship-content` (2), `chapters/natus-ship-scene` (2), `chapters/trema-ship-content` (4), `chapters/yojimbo-content` (file). Not fixed, by rule.
2. **One load timeout, not the code:** `advisor-floor`, "the same rule in FFX-2 ... holds across 4. Bahamut", 16.7 s against the 15 s limit, while other sessions were using the machine. Alone on the tip the file passes 22 of 22 (Bahamut 3.3 s). The cost of the merged engine in that test, base against tip, alternating runs (alone): Bahamut 3.13 and 3.25 s against 3.30 and 3.33 s, Vegnagun 1.22 and 1.17 s against 1.22 and 1.23 s, Trema 2.89 and 2.96 s against 3.18 and 3.32 s: 0 to 12 percent, nowhere near the 5 times of the loaded run. Lane L-CMD's run timed out in this file too (Braska and Omnis there) and passed alone.

No file of the four lanes fails, and the two older tests that the Mix lane's full run had broken (`re-parity-ai-evrae`, `engine/r38-telegraph-hold`) pass. The tree holds 1,175 test files against 1,163 on the base: the lanes add the parity files and the measurement files. The suite was run once, as asked; the only later changes are the two comment paragraphs in the golden tests (`ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden` and `den-of-woe-carry` re-run green after them, 34 tests) and this note.

## 6. Measurement

Method: `tests/unit/ffx-parity-measure.test.ts` and `ffx2-parity-measure.test.ts` (the shipped `intendedStrategy` plays each chapter's whole chain through the app's own path, seeds 1 to 12 and 1 to 500), the same file on both sides. **Before** is `origin/re-parity-rc6-ch2` itself: `git archive` of its `src` into a scratch folder (`D:\Tools\ffx-parity\rc7-asm\base`, 18 MB, with a junction to `node_modules`), measured side by side with this tree; **after** is the tip. Nothing was tuned. Raw files: `D:\Tools\ffx-parity\rc7-asm\out\` (`base-*` and `new-*`, `*-digest.json`, `new-<variant>-500.json`).

### 6.1 FFX, every chapter, 12 and 500 seeds

**The two result files are byte-identical at 12 seeds and at 500** (`cmp`; they include the Mix counter, which is 0 everywhere). Wins before and after, the same on every seed:

| Chapter | 12 seeds | 500 seeds | party turns (500) | party KOs (500) | seeds identical in outcome, turns, KOs |
|---|---|---|---|---|---|
| I Seymour Flux | 12 / 12 | 500 / 500 | 52 | 0.9 | 500 of 500 |
| II Yunalesca | 12 / 12 | 453 / 453 | 157.7 | 13.6 | 500 of 500 |
| III Braska's Final Aeon | 11 / 11 | 479 / 479 | 232.1 | 5.4 | 500 of 500 |
| VII Seymour and Anima | 12 / 12 | 470 / 470 | 54.7 | 4.7 | 500 of 500 |
| VIII Evrae | 12 / 12 | 488 / 488 | 71 | 0.7 | 500 of 500 |
| IX Yojimbo | 11 / 11 | 493 / 493 | 67.4 | 3.9 | 500 of 500 |
| X Seymour Natus | 11 / 11 | 483 / 483 | 33.5 | 1.7 | 500 of 500 |
| XII Seymour Omnis | 11 / 11 | 462 / 462 | 95.3 | 0.8 | 500 of 500 |
| XIV Isaaru | 11 / 11 | 452 / 452 | 38.2 | 2.9 | 500 of 500 |
| XVII Sin: the Fins and the Core | 11 / 11 | 437 / 437 | 296.4 | 3 | 500 of 500 |
| XVIII Sin: the Face | 12 / 12 | 500 / 500 | 45.3 | 0 | 500 of 500 |

### 6.2 FFX-2, every chapter, 12 and 500 seeds (the eight, the hidden Experiment included)

Seven chapters equal the base in every sum and every seed's outcome. Chapter V moves exactly as lane X2-B reported alone (its 500-seed sums are the same figures: 47,984 to 48,019 party turns, 80,536 to 80,596 engine turns, 490 to 493 KOs, +1.4 game minutes):

| Chapter | wins 12 | wins 500 | link 1 won | party turns (500) | engine turns | KOs a fight | minutes a chain |
|---|---|---|---|---|---|---|---|
| IV Bahamut | 12 / 12 | 500 / 500 | 500 | 43.9 | 55.9 | 0 | 1.1 |
| V Vegnagun, Shuyin | 12 / 12 | 490 / 490 | 500 | 96.0 (47,984 to **48,019** over 500) | 161.1 / **161.2** | 1 / 1 (490 to 493) | 3.3 |
| VI Leblanc | 12 / 12 | 500 / 500 | 500 | 67.3 | 92.7 | 0.7 | 1.9 |
| XI Fallen Aeons | 12 / 12 | 500 / 500 | 500 | 48 | 73.9 | 0.1 | 2 |
| XIII Paragon, Trema | 10 / 10 | 363 / 363 | 388 | 165.7 | 261.7 | 1.2 | 8.3 |
| XV Den of Woe | 12 / 12 | 500 / 500 | 500 | 31.3 | 46.6 | 0.3 | 1 |
| XVI Ixion | 12 / 12 | 500 / 500 | 500 | 26.9 | 37.2 | 0 | 1.1 |
| The Experiment (hidden) | 10 / 10 | 362 / 362 | 500 | 25.6 | 32.7 | 1.3 | 0.8 |

At 12 seeds Chapter V moves 93.7 to 94.3 party turns and 0.8 to 0.9 KOs a fight. **Cause (lane X2-B's ablation, which put the old Silence rule back and reproduced the base sums exactly; not re-run here, because the merged tree equals X2-B alone in every sum):** the Silence scope. Where the party is Silenced, the Dark Knight's Arcana spells are refused (the game silences Arcana) and Pray and Vigor are allowed (the game does not silence them).

### 6.3 Where the whole-chain event log moves (FFX, the lanes' movers, 500 seeds)

The outcome measures above cannot see a log that moved while the fight went the same way, so the full event-log digest of every link (the same digest `ffx-engine-golden` pins, JSON of every field) was compared for seeds 1 to 500 of **all eleven chapters**:

| Chapter | seeds whose log moved | outcome of any seed | Cause (lane L-CMD's, read from its logs) |
|---|---|---|---|
| III Braska's Final Aeon | **149 of 500** | none | the second cast of Lulu's Doublecast, aimed at the foe the first cast just killed: the old engine paid the second cast's MP and hit the corpse; now it does not start |
| XVIII Sin: the Face | **124 of 500** | none | the same, on Chapter XVIII's Doublecast line |
| II Yunalesca | **1 of 500** (seed 429) | none | the party has just been wiped and her queued Hellbiter at three fallen members used to log an action before the defeat; now nothing starts |
| I, VII, VIII, IX, X, XII, XIV, XVII | **0 of 500 each** | none | the item arithmetic through the new bag, the new payment order and every Mix change leave these logs byte for byte |

These are exactly the three movers and the counts lane L-CMD reported alone. Lane FFX-H adds no moved log: no shipped line fires Rikku's Mix, and the bag returns the counts the old arithmetic did on every item use of every chapter.

### 6.4 Lane X2-D's loadouts (the movers of that lane), 500 seeds, seven shipped FFX-2 chapters

The shipped line does not wear an automatic ability, so lane X2-D measured three loadouts that do (`ffx2-auto-measure.test.ts`: `berserker`, `mixed`, `bangles`). Re-run on the merged tree and compared with lane X2-D's own result files seed by seed: **the outcomes of all 21 chapter-loadout pairs are identical, 0 of 10,500 seeds differ, and the sums equal X2-D alone in 20 of the 21.** The one that differs is `bangles` in Chapter V: 63,965 to 64,070 party turns, 108,008 to 108,160 engine turns, 906 to 909 KOs and 2,700 to 2,704 SOS sets over 500 seeds with wins unchanged (442), the same direction as lane X2-B's Chapter V movement on the shipped line (Silence scope; the girls wear SOS accessories there). Wins, base to X2-D alone to merged, are lane X2-D's table unchanged: `berserker` Vegnagun 476 / 484 / 484, Fallen Aeons 465 / 496 / 496, Trema 291 / 327 / 327; `mixed` Vegnagun 393 / 417 / 417, Fallen Aeons 421 / 464 / 464, Ixion 490 / 499 / 499; `bangles` Vegnagun 425 / 442 / 442, Den of Woe 491 / 498 / 498, Trema 25 / 29 / 29 (the rest are 500 / 500 / 500).

### 6.5 Cost

The simulation costs nothing measurable beyond the noise of a machine other sessions share: the FFX 500-seed run took 797 s on the base and 814 s on the tip (run side by side); two alternating timings of 100 seeds of Chapters V and XIII took 41.9 and 62.2 s on the base and 52.3 and 57.1 s on the tip. Lane L-CMD measured 6 to 15 percent more CPU on Braska's chain (the aim is computed once for the gate and once for the resolution) and saw `advisor-floor` time out twice in a loaded whole-suite run; the first thing to try if that recurs is to cache the gate's `aimOf`.

## 7. Findings now wired, and findings still only decompiled

Wired by this assembly (each is live in a build cut from this branch):

| Note | Wired | Still only decompiled or not built |
|---|---|---|
| `FFX-G07` (FFX command gate) | MP cost 0x0078cf70 (Half MP rounds up, One MP with the Booster costs 2), usability gate 0x0078c690 (Silence follows the record flag: Summon is free, Scan is gated), cost check at sub-action start 0x0078ab20, range and dead-target filter 0x00791fa0 (no retarget), executor failure path 0x00792210 (nothing paid, an item paid ahead comes back, out-of-reach message and an open turn for a player's own command), Flee loop 0x007ada60; Entrust 8 MP and the aeons' Nul-All 4 MP | 0x0078ce50 (which of two ids is the command), the Copycat branch, Quick Pockets, Doublecast's two-pick composition and who pays the first cast, the text of messages 0x300E, 0x3016, 0x3017, which formations disable Escape or Flee |
| `FFX-G05` (Mix, bag, gil) | the complete 112 x 112 chart (82 groups) and the 64 results, 21 new results with the game's own records, the resolver (both ingredients first, the auto-target on stream 5 or 4, learn bit, Mix failed), the 99-per-stack bag for every stock change, deduct and refund (a monster never touches the bag), the Spare Change pay | the queue and its priority insertion (3.5), Copycat's saver and copier (3.7), the game's `addGil` (proven, no caller), the loss of queued items when their user dies, the delay of a Mix that finds nobody |
| `FFX2-G04` (automatic statuses) | HP state, the automatic status copy, the SOS check (at the start, after every applied result and Poison or Regen payout, after a dress change), the 16 accessories, Warrior, Samurai, Lady Luck's Critical, Mascot, the counter check (Counterattack, Magic Counter, Evade & Counter as the holder's own Attack at the attacker), the forced miss of Evade & Counter | Berserker's Auto-Regen, Lady Luck's SOS Spellspring, the Festivalist, Psychic, the 10 garment grids that keep a status, Double HP and Double MP, a script setting HP, the player-side monsters 15 to 22 |
| `FFX2-G02` (command menu) | the command-table builder, party list, list writer and sort (kernel, proven on 424 worlds), the usability test (480 answers), what a girl is offered (free pairs, passives are not rows, a Trainer per girl, the Mascot's cross-dress), Itch greyed, Silence's exact scope, the MP formula in the menu and in the payment, a Special form with no Item or Escape, the ladders (Samurai, Alchemist, Thief, Songstress, Dark Knight, Berserker, Warrior, White Mage) | the grouped command window (needs a mockup, rule 9), Blue Bullet learn-by-hit, the page stack and menu memory, the target dispatchers, key items, accessory MP words, the Specials' ladders |

## 8. Disclosures, in player words (what the release should say, and what it should admit)

**FFX**

- A Silenced Yuna can still call an aeon (only White and Black Magic, Scan included, are cut off). **The Silence card in the status guide still says "no Summon"**; its words need the edit in section 11, decision 1.
- Scan can no longer be cast while Silenced.
- A blow named at a foe that has died or left by the time its attacker acts now lands on nobody instead of being sent to a random foe. The visible case is Lulu's Doublecast in Braska's Final Aeon and in Sin's Face: the second spell is no longer thrown, or paid for, when the first spell has already killed the foe.
- Half MP Cost rounds up (a 5 MP spell costs 3) and One MP Cost with the Magic Booster costs 2. No chapter's party wears these yet.
- Entrust costs 8 MP and the Magus Sisters' Nul-All 4; no chapter offers either yet.
- Rikku's Mix: any two items make something (the game has a result for all 6,328 pairs), the 21 missing Mixes are in (Pineapple to Dark Rain; they borrow the nearest family's effect, so their art and sound are those of that family), both ingredients are used up the moment the Mix goes off, a Mix with nobody to hit costs the ingredients but not Rikku's gauge, and stacks stop at 99 wherever items arrive. The Mix list now shows a result for every pair (**superseded by section 13: the preview is gated and shows only the registered recipes**). No chapter's line plays a Mix, so no fight changes.
- **Unverified, kept as the engine's stand-in (said so in the notes):** a command that fizzles charges the scheduler's reset delay (rank 3, the note's inference); a Mix that finds nobody delays Rikku by 6 (the result's own rank; the delay is not established); a player's out-of-reach pick keeps the turn open (the note's inference from the flags the path sets).

**FFX-2**

- The battle menu follows the game's rules: the commands a dressphere gives from the start are there before you learn anything (Pray, Cure, Power Break, Fire, Blizzard, Thunder, Water); passive abilities (Darkproof, Trigger Happy Lv. 2, Counterattack and the like) are no longer commands you can pick; Yuna, Rikku and Paine each have their own Trainer moves; a girl in a Special dressphere has no Item or Escape; while a girl is Itchy every command stays on the list, greyed, with Escape and changing dressphere the ways out.
- Silence stops everything the game stops, every Dance and Song and the Dark Knight's Arcana included, and leaves Pray, Vigor, Focus and MP Absorb alone. **The Silence card in the status guide still lists only "White Magic, Black Magic or Arcana"** (decision 1).
- Moves that cost MP follow Half MP Cost, One MP Cost and Magic Booster. No shipped girl wears them.
- **Pray is a free, 0 MP heal of the whole party on the White Mage's menu from the start** (the game lists it so). It does not change a shipped line, but a White Mage who only prays is now very hard to wear down (the Bahamut "mash" test line wins 21 of 30 seeds instead of 2; the test harness was taught that Pray is sustain). A later balance pass should not be surprised.
- Chapter V plays about 0.07 party turns longer a fight because of the Silence scope above; it wins exactly as often.
- The Berserker's Counterattack, Magic Counter and Evade & Counter, which did nothing before, now answer a blow with the girl's own Attack (Evade & Counter makes a physical swing miss outright). The SOS abilities (Warrior, Samurai, the Wall Ring, the Regen and Haste Bangles, Cat Nip) switch their statuses on when her HP falls under a third and off when it is healed past it, announced like any other status; the 16 accessories and the dresspheres that keep a status now keep it, out of a Dispel's reach. **No shipped build wears or learns any of these, so the chapters play as before until a player masters the abilities**; with them the fights get shorter and the girls fall less (Fallen Aeons 93.0 to 99.2 percent of seeds won with three Berserkers, Trema 58.2 to 65.4).
- **Unverified, kept as the engine's reading:** a miss still reaches the counter check (Counterattack and Evade & Counter answer a miss; one live check settles it), and a queued counter costs the girl no gauge.
- No girl's counter has been seen on a screen yet (it reuses the existing `counter` pose and lunge with her Attack banner).

## 9. CHANGELOG paragraphs (for the main session to paste; `CHANGELOG.md` is not edited here)

**FFX only.** The command rules and Rikku's Mix now follow the game. A Silenced Yuna can still call an aeon, because only White and Black Magic (Scan included) are cut off by Silence; Scan, which the game files as White Magic, is cut off too. Half MP Cost rounds up, as the game does (a 5 MP spell costs 3, not 2), One MP Cost together with the Magic Booster costs 2, Entrust costs 8 MP and the Magus Sisters' Nul-All 4. As an action starts it is checked again for Silence, MP and a full Overdrive gauge, and if it cannot start it costs nothing. A target that has died or gone by the time its attacker acts is no longer swapped for a random one: the attack lands on nobody, so Lulu's Doublecast in Sin's Face and in Braska's Final Aeon no longer fires its second spell, or spends its MP, at a foe the first spell has already killed. Flee counts only party members who are still in the battle. Rikku's Mix works the way the game's does: any two items make something (the game has a result for every one of the 6,328 pairs), the Mix list shows what each pair will make (**superseded by section 13: drop this clause; the list shows "? ? ?" for a pair outside the registered recipes, though the pair still makes the game's result**), the 21 Mixes that were missing are in (Pineapple, Blaster Mine, Hazardous Shell, Calamity Bomb, Heat Blaster, Brimstone, and the ice, thunder and water families from Snow Flurry to Dark Rain), both ingredients are used up the moment the Mix goes off, a Mix with nobody to aim at costs the ingredients but not Rikku's Overdrive, and who a Mix lands on is chosen as the game chooses (one random member for the single-target ones, a whole side otherwise). Stacks of items stop at 99 wherever they grow, a stolen item and a refund included, and a Spare Change offer is paid in full or not at all. No boss number and no party number changed, and every chapter wins as often as before.

**FFX-2 only.** The girls' automatic abilities now work the way the game's do, and the battle menu follows the game's own rules for what a girl can use. An accessory or dressphere ability that keeps a status on her for good (the Moon, Shining, Defense, Star, Recovery and Speed Bracers, Adamantite, Ragnarok, Bloodlust, Wring, Minerva's Plate, Shmooth Shailing, Lady Luck's Critical, the Mascot's Auto-Shell and Auto-Protect) puts it on and keeps it, out of a Dispel's reach, and the SOS abilities (Warrior's SOS Protect, Samurai's SOS Critical, the Wall Ring, the Regen and Haste Bangles, Cat Nip) switch their statuses on when her HP drops under a third and off when she is healed past it. The Berserker's Counterattack, Magic Counter and Evade & Counter, which did nothing until now, answer a blow with her own Attack at the attacker (Evade & Counter makes a physical swing miss her outright). Nothing a shipped build wears uses these yet, so the chapters play as before until a player masters the abilities or wears the accessories. The commands a dressphere gives you from the start are there before you learn anything (Pray, Cure, Power Break, Fire, Blizzard, Thunder and Water), the passive abilities you learn no longer appear as commands you can pick, and Yuna, Rikku and Paine each have their own Trainer moves. While a girl is Itchy every command stays on the list but greyed out, with Escape and changing dressphere the ways out. Silence stops everything the game stops, every Dance and Song and the Dark Knight's spells included, and leaves Pray, Vigor, Focus and MP Absorb alone. Moves that cost MP follow Half MP Cost, One MP Cost and Magic Booster the way the game does, and a girl in a Special dressphere has no Item or Escape command. The Samurai gains Magicide, Dismissal, Fingersnap, Momentum, Shin-Zantetsu and Clean Slate, the Alchemist gains Dispel Tonic and Mega Phoenix, and the order in which commands unlock now matches the game for the Samurai, Thief, Berserker, Warrior, White Mage and Alchemist.

## 10. Open items

Everything open in the four lane notes stays open (each lists its own); the ones a release should know:

1. **Rules wired that no shipped line reaches (FFX):** the cost-check refusals, the Half and One MP rules, Flee's Coward hook, a Silenced enemy's gated record, Entrust and Nul-All fire on 0 of 5,500 chapter runs. They are unit-oracle parity with no measured effect. If the release driver prefers only rules a chapter can reach, the cost check and Flee are the two to take out; the Doublecast and range parts are reachable and fire.
2. **Three inferences stand in for numbers the notes do not establish:** the delay of a command that fizzles (rank 3), the delay of a Mix that finds nobody (6), the turn left open after "Out of reach". None fires on a shipped line except the 274 range fizzles (no delay question there).
3. **Two engine readings in FFX-2 await one live check:** a miss reaching the counter check, and a counter costing no gauge. The first is switchable (`constants.ts#COUNTER_AFTER_MISS`).
4. **The FFX-2 unit carries two sets of ability words** (`autoWords` for MP, `autoLayer.words` for counters). Correct as built; a later change that reads accessories' MP abilities (X2-B open item 6) should unify them.
5. **Content the engine lacks (new content, rule 10):** the Gun Mage's ten Fiend Hunter commands, Berserker's Envenom, Hurt, Itchproof and Auto-Regen, Lady Luck's seven, the Trainer's and Mascot's partial ladders, Psychic, Festivalist, Freelancer, Leblanc Goon; the new abilities run on derived rows until a chapter reaches them.
6. **The Mix picker's content** (every pair's result, or only discovered ones), the monsters' group numbers (a chapter with two enemy groups could differ), Copycat, `addGil`'s missing caller.
7. **Stale text, not rewritten:** `research/ffx-combat-core.md` §5.9 (the Mix's 43 rows), `research/ffx2-combat-core.md` (Cat Nip, "does not trigger on hit-all attacks", "attempt to evade"), the prose of `src/data/ffx/mixes/abilities-*.ts` that counts 43, the overlay comment in `ui/ffx/minigames/RikkuMix.ts`, `docs/ENGINE-API.md` if it calls `mixResult` a pure lookup.
8. **A seam no test reaches:** a Mix whose picked target the range filter refuses (the ingredients stay spent by the note; no engine target is out of reach for a Mix result today, and no line fires a Mix).
9. **Nothing was looked at in a browser:** no screen is built or changed by these lanes; the girl's counter and the longer Mix list are the first things to look at (lane notes name the debug-API and variant routes).

## 11. Decisions for Bailey

1. **The two Silence cards.** `src/ui/common/statusWords.ts` `FFX_HINTS.silence` (FFX only) says a silenced character has "no White or Black Magic and no Summon"; after lane L-CMD the Summon half is false. Suggested words: "no White or Black Magic" (Scan counts as White Magic). `FFX2_HINTS.silence` (FFX-2 only) lists "White Magic, Black Magic or Arcana" and now also misses the Dances and Songs and the Moogle, Cait and Eraser spells that Silence stops; suggested: "no spells, Dances or Songs". Neither was edited here (player-facing wording is Bailey's and no lane was asked to); the FFX one is a factual error in a shipped card the day this branch ships, so it should be edited with the release.
2. **Keep a miss reaching the counter check?** (X2-D open item 1.) Recommendation: keep it on (two notes agree on the applier; the check has no hit test of its own) and have one live check done when a driver is at the game.
3. **New FFX-2 content** (open item 5): the game's own rows, not new design, but new abilities and dresspheres are content (rule 10). Recommendation: the Berserker's Auto-Regen and Lady Luck's SOS Spellspring when those abilities are added to their ladders; the Festivalist and the garment grids with a grid or menu lane that has its own mockup. Keep the learned lists as the authority (X2-B decision 3).
4. **Mix, three small calls:** how long a Mix with nobody to hit delays Rikku (keep 6 until read); whether an auto-resolved Mix (a headless run) should stay a random pair or pick the best available (new behaviour: a yes); whether the picker shows every pair's result or only discovered ones (a screen: a mockup first).
5. **Wired-but-unreachable FFX rules** (open item 1): keep all, as built (recommended: they are the game's rules, tested against its machine code, and cost almost nothing), or take the cost check and Flee out.
6. **Entrust and Nul-All** were set to the game's 8 and 4 MP as the release driver decided; nothing to decide, listed so the ledger has them.
7. **Pray on the White Mage's opening menu** (section 8): nothing to decide now; if a later balance pass wants it otherwise, it is the game's row.

## 12. Re-run

From the worktree root, Git Bash, tools by path, `TEMP` and `TMP` on `D:`:

```
export TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx- tests/unit/parity-ffx2- tests/unit/rng-streams.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts tests/unit/chapters/den-of-woe-carry.test.ts
node tools/orphans.mjs
```

The measurement: `PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=<file> node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts`, and for FFX-2 `PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CHAPTERS=ffx2-bahamut,ffx2-vegnagun-shuyin,ffx2-leblanc,ffx2-fallen-aeons,ffx2-trema,ffx2-den-of-woe,ffx2-ixion-djose,ffx2-masterpiece-theatre ... tests/unit/ffx2-parity-measure.test.ts`; the X2-D loadouts with `PYREFLY_X2D_VARIANT=berserker|mixed|bangles ... tests/unit/ffx2-auto-measure.test.ts`. The base side is the same file run in a scratch folder holding `git archive origin/re-parity-rc6-ch2 src` (scripts `run-stream.sh`, `run-variants.sh`, `cmp2.mjs`, `cmpv.mjs` in `D:\Tools\ffx-parity\rc7-asm\`). The event-log digests are `ffx-engine-golden`'s chain function over seeds 1 to 500 (a scratch test, not committed).

## 13. Follow-up: the Mix picker's preview is gated (FFX only)

Added after the assembly, at the release driver's request (2026-10-14). **Game case: FFX only** (Rikku's Mix is an FFX Overdrive; no FFX-2 file is touched).

**What was wrong.** Lane FFX-H (H4) made `mixablePairs` walk every pair of the bag through the game's complete chart, and `minigameParams` fed those pairs to the Mix overlay, so the preview line named the result of every pair. The live build (r46) shows "? ? ?" for any pair outside the registered recipes (`src/data/ffx/mixes/recipes.ts`, 43 pairs, `FFXContentRegistry.mixPairs()`). Whether the picker should name every pair's result is a screen choice for Bailey (decision 4 above; AGENTS.md rule 9: a mockup first), so it must not ship by accident.

**The change.**

- `MIX_PREVIEW_ALL_PAIRS = false`, in `src/battle/ffx/pickerParams.ts` (FFX has no constants file of its own; `ffx2/constants.ts` is FFX-2's, and the FFX switches live in the module that owns their rule, like `KEEP_REFLECTED_SELF_HASTE` in `ai/evrae-rules.ts`).
- `overdrive.ts#mixPreviewPairs(ctx, allPairs = MIX_PREVIEW_ALL_PAIRS)`: off, it is the registered recipes whose two ingredients are in the bag (a doubled item needs two in stock), in the registry's order, which is the code the live build ran; on, it is `mixablePairs(ctx)`, every pair of the bag. `minigameParams` hands `mixPickerParams` this list instead of `mixablePairs`. Nothing else changed: `RikkuMix.ts` is untouched, and the params keep their shape (`inventory`, `ingredients`, `recipes`, `recipeNames`).
- **Kept on the full chart, as the lane built it:** the engine's resolution of a fired pair (`overdriveShape.ts` to `mix.ts#resolveMixAction`, so the game's real result), and the automatic draw of an AI or headless Mix (`rollDefaultMinigame` still picks among `mixablePairs`).
- **An intended consequence, to put in the release notes:** a pair the preview shows as "? ? ?" is reported by the overlay with no result, and the engine now resolves it from the chart, so it fires the game's real Mix where the live build said "Mix failed!". The picker is the only place the gate is visible; what a pair makes is the game's in every build cut from this branch.
- The two sentences in sections 8 and 9 that say the Mix list shows a result for every pair no longer hold while the switch is off; they are marked in place and the CHANGELOG paragraph should drop that clause.

**Proof.** `tests/unit/parity-ffx-mix-preview.test.ts` (8 tests): the switch is false; with it off, the preview's keys equal the bag's registered recipe pairs (restated from `MIX_RECIPES`, not from the engine), with the registered results and names, and no chart-only pair; the stock rules (a lone Fire Gem is no pair with itself, an empty Ether stack no ingredient, Potion twice needs two); with it on (passed in, and flipped for real with `vi.doMock` of `pickerParams.ts` under a fresh `overdrive.ts`), the keys are every pair of the bag with the chart's result; four unregistered pairs fired as the overlay reports them (no result) make `mixResultAbilityId(a, b)` and use both ingredients; a registered pair makes the registry's result, which is the chart's answer; a bag with no registered pair previews nothing and the headless draw still mixes. Two scratch mutants were killed (the switch set true: 5 of 8 fail; `minigameParams` handed `mixablePairs` again: 3 of 8 fail). `parity-ffx-mix`, `parity-ffx-bag`, `parity-ffx-engine-mix`, `data-ffx-command-records`, `ffx-overdrive-pickers` (the real Chapter VII Mix picker), `-picker-presenter`, `-menu-rows`, `-inputs`, `-overlay-title`, `trigger-commands`, `ffx-unread-riders` and the three goldens all pass (224 tests in 15 files, `tsc --noEmit` clean); every `parity-ffx-` file, every `ffx-overdrive` file and `rng-streams` together: 65 files, 1,240 tests passed, 5 skipped by their own flags, 0 failed. No outcome of any chapter can move: the preview is read by the overlay only, and the one thing in an event log that differs from the lane's own tree is the `recipes` and `recipeNames` of a Mix `minigame-request`, which no shipped line fires (the goldens above are unchanged); against the base `origin/re-parity-rc6-ch2` that request now carries the same registered pairs it always did.

**To turn it on** after Bailey picks a screen: set `MIX_PREVIEW_ALL_PAIRS = true` (the on-state test already pins what it sends), and give the overlay whatever the approved mockup shows (an item that is not yet discovered, for example, would need the learn bits from `ctx.rt.mixShared`, which the params do not carry today).
