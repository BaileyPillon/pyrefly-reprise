# FFX-2 Special dresspheres: the engine, the data and the look options (branch `ffx2-specials`)

**FFX-2 only** (a Special dressphere is an FFX-2 idea; nothing here touches FFX or FF7). Lane of 2026-11-09 under Bailey's words "Keep going please with everything you were doing" (2026-11-09 ~12:35 EST) and "Build them (Recommended)" (his answer of 2026-11-07 to the question whether to build FFX-2's special dresspheres, D-1499; the answer is on record verbatim in the driver's chat as an answered AskUserQuestion, logged 2026-11-09 ~12:27 EST, and D-1499 is closed on it). Decision 92d (D-937, **in force**): the Specials' three-part look gets 2 or 3 options shown to Bailey first, and nothing perceivable is built until he picks. So this lane built the **non-visual engine behind a switch that is OFF**, the **data**, the **research** and **three look options**; no HUD, wheel, presenter or art file was touched.

## 1. What is on the branch

| Part | Where | State |
|---|---|---|
| Research | `research/re-ffx2-special-dresspheres.md` | how the form is reached, what the parts are, all 99 commands with every number sourced, the stats, the finishers, how the form ends, the conflicts between sources, the driver's picks with their alternatives (section 10) |
| Look options (92d) | `special-dress-up-A.jpg`, `-B.jpg`, `-C.jpg` in the lane's scratch folder (outside the repository: the pictures use the private art mirror and never go to `main`) (1080 x 1920, JPEG, about 330 KB each) | three distinct options, each labelled; A is the faithful reading. Made on the local ComfyUI (animagine-xl-4.0, the project's own checkpoint and style tags, img2img over the approved paintings of the r77 art mirror), composed with `sharp` (the fight panels' one-line captions got a solid strip behind them in the fix pass: the review found them low in contrast). **Waiting for Bailey's pick** (section 6) |
| Data | `data/ffx2/command-records/special.ts` (99 rows), `abilities/special-*.ts` and `special-build.ts`, `dresspheres/special/*.ts` (ladders), `battle/ffx2/adapt/game-ids-special.ts`; fixture `tests/fixtures/parity/ffx2/special_rows.json` | every command of the nine parts is the game's own row (kernel `command.bin`, parts from `job.bin`); the earlier trimmed lists are replaced |
| Engine | `battle/ffx2/special/` (`forms`, `stats`, `availability`, `change`, `enter`) and small hooks in `execute.ts`, `menu.ts`, `engine.ts`, `setup.ts`, `adapt/*.ts` | the Special Dress Up through the real garment-grid path, three-part actors, every command, the form's end. **Switch: `Ffx2EngineOptions.specialDressUp` (`constants.ts#SPECIAL_DRESS_UP = false`).** With it off no chapter reaches any of it |
| Tests | `tests/unit/ffx2-special-dress-up.test.ts` (15), `data-ffx2-special-rows.test.ts` (7), `chapters/farplane-cup-specials.test.ts` (9), `ffx2-special-form-edges.test.ts` (9, the fix pass: Ejected girls, the form's Auto-Life, the fall's layer, a second entry, the battle's end), helpers `specialDrive.ts`, `farplaneCupSpecials.ts` | section 4 |

## 2. How to turn it on (a run or a test; no build does)

```ts
new FFX2Engine(ffx2Options({ specialDressUp: true }))
```

The menu then offers, to a girl who has worn every dressphere of her real Garment Grid this battle (the ordinary Change rows are the walk) and owns her Special, a `spherechange` row with `extra.specialDressUp = true` (the shape the wheel's own R1 command already sends). Entering follows the game's rules (`research/re-ffx2-special-dresspheres.md` sections 2, 3, 6): her marks wiped and her place kept, accessories set aside, the Special's growth rows with her grid's node count for the main body and plate 0 (6 nodes) for the two pods, Ribbon wards (Eject among them, by the game's own row), Auto-Life once, the other two girls out of the field (`removed`, `aiMemory.sdspParked`), `state.activeIds` = the three parts. **A part is a normal party unit**: its menu lists the commands of its own ladder, its gauge is its own (slots 3 to 8, the pods' child records), a KO'd pod can be raised by Revival, All-Life or Reboot.

The form ends by the girl's one Change row (back to the dress she stood on) or when her main body falls while a pod stands (she comes back knocked out in her old dress; the pods go; the others return). All three parts down is a defeat. A form still on when the battle's result is built is ended silently, so a chain carries a girl in her dress (section 8).

The portrait hook that already exists (`engine/BigMoves.ts`, lane `ui-marker-portraits`) rides the real events now: the entry emits the `spherechange` event with `special`, and the three finishers are the ability ids it names (pinned in `ffx2-special-dress-up.test.ts` with the real engine's event).

## 3. Picks, with the alternative of each (the driver's calls; Bailey's to overturn)

The full table is `research/re-ffx2-special-dresspheres.md` section 10. The ones that move play:

| Pick | Alternative |
|---|---|
| **A part whose build names no learned list knows only the commands the game lists from the start** (Floral Fallal: Attack, the four Whirls, and each pistil's free commands), no passive; `forms.ts#masteredLearned` gives everything | the whole ladder and Double and Triple HP (x3 HP) for every part: far stronger than any early chapter's party |
| The game's stat scale `(nodes + 25) / 25` (main: her grid's node count; pods: 6 nodes, x1.24) | the community's unscaled rows (one constant; the open question of the research note section 5) |
| A fallen main body ends the form if a pod still stands | the form persists until all three are down (the exe's evaluation as read) |
| Auto-Life once on each part | none (two community sources; the row keeps no status) |
| Pods start at full HP and MP at each entry, and their gauge one standard bar behind (the girl's own wait after a Change) `[estimate]` | unknown in the game; an empty gauge with no wait |
| The main body's Auto-Life carries the form as its source and comes off with the form; one she held before is swept at entry by the Special's Ribbon ward and not given back | keep it (a free revive, the review's finding); give the swept one back (not sourced) |
| A girl Ejected before the form stays Ejected: not parked, not brought back, no rewards | the form returns every other girl, an Ejected one too (the review's finding) |
| Every form still on ends when the battle's result is built, silently (pools by the ratio rule, the dress she stood on, the pods stand down) | leave it on and let the next link's setup put her back (the game's own moment): a chain would carry a Special's absolute HP into a normal dress |
| One Change row inside a form (the dress she stood on) | the full grid scene's choices (not traced) |
| The walk after a form is empty (kernel mode 2 does nothing) | her worn dress counted as visited |

## 4. Evidence (rule 3: the engine was run)

* **Entry through the real path** (Chapter IV, seeded): each of the three girls walks her real grid by the Change rows (Yuna 4 Changes, Rikku 4, Paine 3: her Stonehewn grid has 4 nodes, the others 5), is offered the row only then, and puts it on. The numbers checked against the kernel (Floral Fallal Lv 23 on a 5-node grid: HP 2,155, pods 1,499; the research note's worked example Lv 20 on 6 nodes: HP 1,971, MP 225). Rikku's and Paine's Specials are in Chapter IV's bag for Rikku only; **Paine's Full Throttle is added to her bag as a rig in that test** (the build gives it to her in Chapter V and the Cup).
* **Every command's formula** is the game's row: the data test pins all 99 against the fixture; the engine test plays each finisher: Great Whirl lands 12 hits, Vajra 1, Sword Dance 2 (rows power 8, 80, 48).
* **Determinism**: the same seed gives the same fight, byte for byte, for each Special.
* **Flag off**: the offer is never made, and the wheel's own command is refused as it always was; the full suite is the byte-for-byte proof for every chapter (section 5).
* **Form end**: the way out, a main body that falls, all three parts down (a defeat).
* **The Farplane Cup, duel 1** (`chapters/farplane-cup-specials.test.ts`, 100 seeds, the bench's `curtains` line for everyone who is not in the form; one girl walks her real grid and plays her three parts; **a bot, a measurement input, never game data; nothing is tuned**):

| Line | Wins of 100 | Put the Special on | Median entry | Girl and part KOs a fight |
|---|---|---|---|---|
| nobody walks (the bench's reference) | **11** | - | - | 0.40 |
| Yuna in Floral Fallal, the build as given | 14 | 67 | 18.8 s | 1.81 |
| Yuna, everything learned | **36** | 67 | 18.8 s | 1.13 |
| Rikku in Machina Maw, as given | 0 | 70 | 21.4 s | 2.44 |
| Rikku, everything learned | 5 | 70 | 21.4 s | 2.91 |
| Paine in Full Throttle, as given | 10 | 81 | 19.1 s | 2.38 |
| Paine, everything learned | **44** | 81 | 19.1 s | 1.84 |

**What this says, plainly.** A Special reached by the sourced route is **the best answer to duel 1 found so far** (a mastered Full Throttle or Floral Fallal wins 36 to 44 of 100 against 11 for the plain line), and **no Eject ever lands on a part** (0 of 100 seeds in every cell: the game's own Ribbon row wards it). But the walk (four or five Changes) finishes at a median of 19 to 21 seconds, **after Auron's first Shooting Star** (median 18.2 s in `ch-farplane-cup.md`), so it is not a way to avoid the Star: the walk is not finished on 19 to 33 of the 100 seeds (the fight ends first), and the bench prints 107 to 193 Ejects on girls outside a form across the 100 fights of each line. With the Specials as the build gives them (free commands only) the form is no better than no form (14, 0 and 10). Rikku's Machina Maw does worse than the plain line because her main body falls often (19 to 29 seeds of 100) and the bot spends the parts' turns on buffs; the bot is not tuned. **The earlier "95 if the girls were Eject-proof with the Dark Knight kit kept" row is still not reachable by any route the sources give.** Duels 2 and 3 are measured the same way for information (the test prints them; no pins beyond "a verdict on every seed").

## 5. Checks run

* `npx tsc --noEmit`: clean.
* New and changed test files: `ffx2-special-dress-up` 15 of 15, `data-ffx2-special-rows` 7 of 7, `farplane-cup-specials` 9 of 9; `data-ffx2-citations`, `data-ffx2-command-records`, `parity-ffx2-grid-status-engine` pass after the two shared-test edits below.
* **Two shared tests were touched, each for a reason that is not the engine:** `data-ffx2-command-records.test.ts` exempts the Special rows from the shared row comparison (they have their own fixture and test, as every hidden chapter's rows do); `helpers/ffx2AutoRig.ts` keeps `PLAIN_BLOW` on the first of the *older* families (the rig picks the first matching row of the whole ability pool, so the 99 new rows moved the pick to Left Stigma, a row that uses the user's own properties and does 0 damage from a dummy).
* `node tools/orphans.mjs`: nothing of this lane is orphaned (the report lists the older modules only).
* **The full unit suite** (`BOSS_ART_ROOT` at the r78 art mirror, `--maxWorkers=3 --testTimeout=60000 --hookTimeout=60000`, 8,094 s, other lanes' suites running on the same machine): **2,164 files: 2,129 passed, 32 skipped, 3 failed; 34,704 tests: 34,496 passed, 203 skipped, 1 todo, 4 failed.** Every failure is explained:
  1. `audio-sfx-parity-pin` (ffx2): **a real consequence of this lane's data, now fixed.** The scripted fight plays every ability of the catalogue; the old trimmed Special abilities had no game row, so a Vajra, a Howitzer or a Reboot made a charge cue and nothing, and on their rows they strike, heal and apply statuses (32 scenarios of the three Special families moved, none outside them; the FFX half is untouched). The golden was moved by hand for exactly those 32, as the test's header describes for earlier data changes, and the header says so; the test passes. (Five of the old ids that the new data had first renamed with a part suffix, `howitzer`, `hp-repair`, `mp-repair`, `stamina`, `reboot`, keep the id they had on the part that held it; the other duplicate names carry the part's key.)
  2. `booth-b4-last-rows` (1 test): **environment, not this lane**: the test checks that `docs/screenshots/booth-b4-last-plate-grade.png` exists on disk, and this tree is a sparse checkout without `docs/screenshots` (7,444 files marked skip-worktree; the file is tracked on `origin/main`). It fails the same way on any commit in this tree.
  3. `data-ffx2-special-rows` (2 tests): they ran in the minute this lane renamed the five ids in the data and the fixture (a race with the run, not a defect); they pass since.
  After the fixes a **targeted re-run of 198 files** (`data-ffx2*`, `parity-ffx2*`, `ffx2*`, `audio-sfx*`, `portraits*`, `chapters/farplane-cup*`, the new files among them): **185 passed, 13 skipped, 0 failed; 5,685 tests passed.** With the switch off every chapter's goldens are unchanged (the suite's chapter, parity and bench files all green).
* House rule 7: every file under 400 lines (`internal.ts` 399, `engine.ts` 399 after the fix pass).
* **The fix pass of 2026-11-09 (section 8), on the merged tree (`origin/main` a61354d59 merged in):** `npx tsc --noEmit` clean; `ffx2-special-form-edges` 9 of 9, `ffx2-special-dress-up` 15 of 15; `node tools/orphans.mjs` 24 orphaned, the same 24 as main, none of this lane's; **the flag-off census again, 210 of 210 runs identical to `origin/main`** (21 FFX-2 chapters x 5 seeds x 2 decision times; event hash, ticks, event count and outcome); **the full unit suite** (`BOSS_ART_ROOT` at the r78 art mirror, `--maxWorkers=3 --testTimeout=60000 --hookTimeout=60000`, 7,732 s, other lanes' suites running on the same machine): **2,165 files: 2,131 passed, 32 skipped, 2 failed; 34,713 tests: 34,507 passed, 203 skipped, 1 todo, 2 failed.** Both failures are explained and neither is this lane's: (1) `booth-b4-last-rows`: the screenshot `docs/screenshots/booth-b4-last-plate-grade.png` is tracked on main and absent from this sparse worktree (as in the first run); (2) `live-record` ("docs/LIVE.md is stale: the last live deploy is cc0fea14a"): **main's own state**, not the branch's: main's last commit (a61354d59, deep review round 36) moved the marker of cc0fea14a from `critic/pending` to `critic/cleared` and did not regenerate `docs/LIVE.md`, so the page is stale on `origin/main` too; it is the release pipeline's record (the lane did not regenerate it: `node tools/live-record.mjs` after the next deploy, or by whoever merges, clears it). The two ledger checks (`decisions-ledger`, `actions-ledger`) pass on the new rows.

## 6. What waits for Bailey, and what comes after his pick

1. **The pick of the look** (the three cards; decision 92d): A the game's own reading (three bodies in the party slots, the main in the middle, two floating pods), B the Ink and Gold cut-in (the girl rides her Special, pods are gold-tethered satellites, one wide plate), C the held tableau (the girl dissolves, the three party slots keep their places, pods are girl-sized spirits, the HUD rows do not move). After his pick: write it as the target in `docs/target/targets.json` with the liked / disliked / must-remain lines, then build the three sprites a Special, the three-part HUD block and the camera beat; **only then** wire the wheel (`ui/ffx2/SpherechangeWheel.ts` still sends the command from the mock screen only) and turn the switch on for the chapters that give a girl her Special (Chapter IV for Yuna and Rikku, V, the Cup and the later hidden ones).
2. **Which chapters get it on** (not decided): the builds name no learned list for a Special, so a switched-on chapter would give the commands from the start only.

## 7. Open issues (none blocks the OFF default)

* **Presenter and art are not built**: a pod's `spriteKey` is its part id (`floral-fallal-right-pistil`, ...) with no painting; the presenter has no layout for a three-part party; the pods' hit-reaction clip lengths (motion-set slots 16 and 17, `data/ffx2/hit-reaction-frames.ts`) are not wired (the engine keeps its 2 s / 3 s chain window on a pod).
* **Key items are not modelled**: Break HP Limit and Break Damage Limit (Aurora Rain, Twilight Rain, Machina Reactor and Booster, Corpus Invictus, Victor Primoris) are never on.
* **Sources not read**: GameFAQs' pages answered this machine's fetch with 403. Of Jegged only the Garment Grids overview was read (it carries the unlock rule and says nothing of the stats, the other girls, the accessories or the end of the form; research note section 0.3, which is the record: the first draft of this line said Jegged returned 403 as a whole), and no Jegged page on the Specials' own abilities exists in the repo's reads. The FF Wiki (public API), GamerGuides and fan-thread snippets were read. No Ghidra instance was running, so the form's start-up and its main-body-falls code in the exe were not decompiled (research note section 11).
* **A finding outside this lane**: the ordinary accessory Ribbon (a_ability row 103, `0x8067`) wards **Doom** at 255 in the game's own row, while `kit.ts#RIBBON_IMMUNE` lists twelve statuses without Doom (its header says "not Doom"). Not changed here (it would move shipped fights); noted for the driver.
* **The bench bot is simple**: the Machina Maw numbers say more about the bot than about the Special.
* The wheel's own R1 command is still refused by the ordinary change path when the switch is off (`performSpherechange` answers "Not linked"); with it on, `special/change.ts` settles it first.

## 8. The fix pass of 2026-11-09 (the adversarial review of `7516dbf8e`)

The review found no critical defect, two major ones in the form's end and a process item; every one is fixed, and the review's minors where cheap. **Game case: FFX-2 only** (every change is under `battle/ffx2/special/`, the switch-gated hooks of `engine.ts`, or a test; nothing runs with the switch off).

| Finding | What was done |
|---|---|
| MAJOR 1: a girl Ejected before another girl's form came back when it ended (and earned rewards) | `enter.ts`: a girl who is `removed` is not parked, and stand-down only returns a girl still marked parked. Test: Rikku Ejected, Yuna enters and leaves, Rikku stays out and counts as ejected for the reward roll |
| MAJOR 2: the form's Auto-Life never came off (and would have ridden across a whole-state seam) | The Auto-Life the form puts on the main body carries `sourceAbilityId: 'special-form'` and comes off in `undress` (a way out, a fall, the battle's end); one she held before is swept at entry by the Ribbon ward (the kernel sweep) and is not given back. Tests: off after leaving (with the `status-remove` event), off after a fall, a foreign source is never touched, a held one is swept at entry |
| MAJOR 3 (process): Bailey's yes not in the ledger | Verified in the driver's chat: the AskUserQuestion answer "Build them (Recommended)" is on record (logged 2026-11-09 ~12:27 EST, given in the window of account #2's copy on 2026-11-07). D-1499 is closed on it with the verbatim quote; decision 92d stays in force. Rows for the picks, an action row and a NOW.md entry were added |
| MINOR 1: a fall did not rebuild the auto layer | `FormHost.rebuild` (the engine passes `rebuildAutoLayer`): after a fall her layer is the one a fresh build of the dress she is in gives. Test with her two bangles |
| MINOR 2: the pods' gauge start was in neither the picks nor the note | Recorded as research note section 10 pick 11 and the table above (an estimate) |
| MINOR 3: two `gridNodeContents` callers lacked the third argument | `BattleScreenCarry.ts` and `engine/yrp3d/dressReach.ts` pass `SPECIAL_DRESS_UP`, the default the engine reads (no effect with the switch off) |
| MINOR 4: pods in `rewardsByMember` | Not a defect: the game's own owner slots 3 to 8; recorded as pick 13. Nothing in `src` reads the map for a pod |
| MINOR 5: a link that ends in a form carried its absolute HP | Every form still on ends once the battle's result is built (`engine.ts#checkBattleEnd`, `settleForms(..., atEnd)`; silent; the rewards were built first), so the pools follow the ratio rule and the seam carries a girl in her dress. Pick 12. Test: a victory in a form, the carry of the whole-state seam |
| MINOR 6: the docs disagreed | "4 to 5 Changes" is 4, 4, 3 (re-measured); the Jegged line follows the note's section 0.3; the two scratch-relative paths are out of the committed docs |
| MINOR 7: stale SinirothX growth in the data | `parts` (and `exactLevels`, `nodeScale`, `SpecialPartGrowth`) removed from `data/ffx2/dresspheres/special/*`; nothing read them |
| MINOR 8: process | `docs/plans/ffx2-specials-review.md` (the paper preflight), this note, NOW.md, an ACTIONS row and the decision rows |
| MINOR 9: tests | `ffx2-special-form-edges.test.ts` (9 tests) |
| MINOR 10: low-contrast caption | The cards were recomposed with a solid strip behind each fight panel's caption (the cards stay in scratch and wait for Bailey) |

**A defect the review did not see, found while writing its test: the second Special Dress Up of a battle had pods that never got a turn.** The engine keeps its slot order by object and checks it by length (`engine-core.ts#slotOrder`); a second entry swapped the two dormant pods for new objects at the same indices, so the length did not change and the new pods were never stepped (their gauges sat at 0 for ever; the girl alone took every turn). The pods are now made new in place (same object, every field reset). Pick 14. This is only reachable with the switch on and only after a form was left and a second one put on.

**Still open (unchanged):** pick 3 (a fallen main body ends the form) is checked against nothing but a fan thread: no Ghidra instance was running in this pass either (`list_instances` returned none), so the exe was not read.

## 9. The look, step A (2026-11-10; branch `ffx2-specials`; plan `docs/plans/ffx2-specials-look-review.md`)

**Game case: FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2); the shared plumbing (`HudPort`, `FFX2BattleHud`, `CoachLayer`, `BattleMomentsHeld`, the twirl and held-shot early-outs, `PresenterDeps`, the Vite define) is **both games, additive, optional and inert while `specialDressUp` is OFF**. The switch is OFF in every shipped chapter; nothing was built for ON beyond the test word; no file under `src/battle/` is edited. Reading G is the plan (one connected figure, three HUD plates: main, right part, left part); reading T (section 11 of the plan) is kept and marked not built.

### 9.1 What landed (the code in four commits, in this order, then the records and one test)

| Commit | What | Tests |
|---|---|---|
| `8f93bd5f1` | **The OFF pins, alone, before any other edit.** `tests/fixtures/specials/off-pins/*.json`, `helpers/offPins.ts` | `party-rows-off-pin`, `special-off-pins` |
| `2b6fe7a3a` | The pure core: `SpecialArtIds`, `SpecialFormTracker`, `SpecialBeatPlans`, `SpecialReactions`, `SpecialPartyHold`; `helpers/specialFormState.ts`; the ten recorded logs | `special-form-tracker`, `special-beat-plans`, `special-reactions`, `special-party-hold` (holder half), `special-first-time`, `special-first-time-port` |
| `a0cbbced6` | `HudPort.holdRows?` and `showAtbChip?` with their `FFX2BattleHud` lines, the `CoachedHud` forwards, `BattleMomentsHeld.portraitWait()`, the three early-outs, `PresenterDeps.specialSeen?` | `special-party-hold` (HUD half), `special-no-twirl` |
| `cadcfc607` | The test word `?specials=on` (`src/app/specialsWord.ts`), its Vite define, `window.__pyrefly.specials` | `specials-word`, `specials-word-api`, `special-switch-off` |
| `ca4d9822d` | The records: this section, the `CONTRACT-CHANGES.md` entry, the plan copy, the two research notes | none |
| `9c786b70e` | `special-party-hold` proves the held rows in the smooth ATB bar look too (the default) | `special-party-hold` |

### 9.2 The pins, and how to regenerate them

The pins hold what the FFX-2 party rows, the face stacks, the mounted HUD column and the named CSS rules are **today** (string pins; the row of every FFX-2 chapter of `CHAPTERS`, 225 face-stack strings, `faceLadder`, `partyFaceHtml` for one FFX chapter, the one FF7 chapter and every girl in every dress, the party column of a mounted `FFX2BattleHud` for Chapters IV and V in both bar looks, and the rules of `ffx2-hud.css`, `hudf1-ffx2.css` and `phone-hud.css` whose selectors the test names). They are taken at the branch head `d63c82110`, not at `bc93b1fdd` (no checkout is allowed): `git diff --stat bc93b1fdd..HEAD` over `src/ui src/engine src/scenes src/app tools` lists 61 files (the release 80 integration's hidden chapters and tools), but **none of the files the pins read**: `PartyRows.ts`, `partyFace.ts`, `FFX2BattleHud.ts`, `dressphereIcons.ts`, `HudPort.ts`, `portrait.ts`, `proMarkers.ts`, `AtbLive.ts` and the three sheets are identical to `bc93b1fdd`. **What the pins do not prove:** the engine commits between `bc93b1fdd` and the head are covered only by PROOF's flag-off A/B. To regenerate (only for a meant, approved change): `PYREFLY_WRITE_PINS=1 node node_modules/vitest/vitest.mjs run tests/unit/party-rows-off-pin.test.ts tests/unit/special-off-pins.test.ts`. The ATB shimmer's phase comes from the page clock, so the cases that print it stop `performance.now`.

### 9.3 The recorded logs, and how to record them again

`tests/fixtures/specials/logs/*.json` (`{ girl, seed, source, events, state }`): `entry-yuna|rikku|paine`, `exit-yuna`, `fall-part-standing`, `defeat-all-parts-down`, `autolife-main`, `part-falls-raised` (engine) and `heal-on-part-synthetic`, `status-on-part-synthetic` (hand-written: the engine's rigs emit no event for a heal or a status on a part). **A fall cannot be made with `fell(u)`** (it emits no `ko` event); the capture takes the main's `invincible` and `auto-life` off, sets her HP to 1 and lets the foe's own action land (`helpers/specialFormState.ts`). With every part down `settleForms` does nothing and the log ends in `defeat` (OP-2: the seen fall is a defeat in the engine; `fallPlan(true)` is data only, the hold is released at `defeat` with no beat). Record again: `PYREFLY_CAPTURE_SPECIAL_LOGS=1 node node_modules/vitest/vitest.mjs run tests/unit/special-form-tracker.test.ts`; a normal run captures again under each file's recorded seed and compares (the engine is deterministic). The capture keeps the **shortest** log of the seeds 1 to 8 that produce a case (the step spec said the first), so the fixtures are small.

### 9.4 Transient orphans (`node tools/orphans.mjs`)

Base list: 24 orphaned modules. After step A: 28, the base plus exactly `SpecialFormTracker`, `SpecialBeatPlans`, `SpecialReactions`, `SpecialPartyHold` (no production importer until C2; the tool does not count tests as importers). `SpecialArtIds` and `specialsWord` are imported (by the three fx files, and by `BattleScreenWiring` and `debug/api`).

### 9.5 Deviations from the step spec, each kept to its intent

1. **`ActorHandle` has 29 members, not 28.** `noteStatus?` was added on 2026-11-09 (the Wendigo finish, after the spec was written). `HANDLE_MEMBERS` classed it `forward` (a status the event names reaches the figure for the MAIN; a status on a part never gets there, `reactionOf` answers `none`): 17 forward, 9 swallow, 3 source. **Superseded by section 14 (R1-4): `swallow` for the part's handle, so 16 forward, 10 swallow, 3 source; the main's actor still forwards it.** The `Record<keyof ActorHandle, ...>` type is the build-time count.
2. **The test preview build is a build MODE, not an environment variable.** `vite.config.ts` defines `__PYREFLY_SPECIALS__` as `command === 'serve' || mode === 'specials-test'`; the ON preview is `vite build --mode specials-test --outDir <its own folder>`. The spec read `process.env['PYREFLY_SPECIALS_TEST']`, but `tests/unit/release-build.test.ts` fails on any new variable `vite.config.ts` reads ("a new one must be pinned or listed on purpose"), and mending that means editing the test and `tools/release-build.mjs`; a mode needs neither and, unlike a variable left in a shell, cannot ship the word (the deploy passes no `--mode`). STAGE 2 builds its ON preview with the mode.
3. `window.__pyrefly.specials` needs a line in the `PyreflyDebugApi` interface as well (api.ts +3, not +2).
4. `NOW.md` and `CHANGELOG.md` are **not** edited by this step (the driver's records stage writes them, overriding the spec's "every step ends by updating NOW.md").
5. The fall plan, the `reactionOf` table and the beat plans use the labels and splits in 9.7 below.

### 9.6 Open points taken (the driver's calls; Bailey's to overturn)

OP-1 section-4 defaults (plain renders, no part mark, size `trial`, hold `per-save`, Machina Maw `standing`); OP-2 (a) the reachable fall only; OP-3 (a) `VfxPort.special?` is C2's call, its body stage 2's; OP-6 both main and parts hit-gated; OP-7 the rows stay held on the parts for the whole life of the form; OP-9 pins at the head; OP-11 the four transient orphans; OP-12 mask fixtures (C1); OP-14 the badge is hidden until a part row is drawn (D1); OP-19 no `scenes/types.ts` field; OP-22 three pause tabs named by the plates; OP-31 the `[ours]` values are table values (9.7); OP-32 the carry layout is left as it is: with `?specials=on` the engine drops a Special off the grid but `BattleScreenCarry.ts` and `engine/yrp3d/dressReach.ts` still pass the constant `SPECIAL_DRESS_UP`, inert unless the carry switch is on (matters for Paine in Chapter V ON; stage 2 decides).

### 9.7 `[ours]` rows (values and rules the preflight does not give; table values, none a game number)

| Value or rule | Where | Why |
|---|---|---|
| `REDUCE_MOTION_SCALE` 0.25 (camera, pieces and flash removed; rows and chip order kept) | `SpecialBeatPlans.ts` | "every plan collapses" is all the preflight says; goes to the decisions ledger for Bailey |
| The preambles 6000 / 3000 / 3000 ms (PREAMBLE_MS) | `SpecialBeatPlans.ts` | preflight 2.1 |
| The fall: 2000 lead-in, 4000 grey and squash, 6000 dissolve, 7500 girl lying; `FALL_SQUASH` 0.8 | `SpecialBeatPlans.ts` | the 2000 and the 0.8 are the preflight's `[ours]`; 4000, 6000 and 7500 are inferred from the defeat frames |
| The fade of the other two begins at 2000 ms and lasts the summon's 620 ms (`PARTY_SWAP_MS`, asserted equal) | `SpecialBeatPlans.ts` | preflight 2.1 row 2 |
| Rikku's assemble 16000-21000 split at 18500 (R2 above, then R3) | `SpecialBeatPlans.ts` | "R2 then R3": the split is ours |
| Camera labels: Yuna's reveal `low-close` (a close-up, no pull-back seen), Paine's burst `pull-back` and reveal `low-form`, her armour close carries no camera | `SpecialBeatPlans.ts` | the labels are plan names; C2 maps them to existing rigs and adds none |
| The exit's marks: the girls' rows at 4000, the chip back and control at 4500; the fall's `tag-wait` and `numbers` marks at 2000 | `SpecialBeatPlans.ts` | preflight 2.7 and 2.8 |
| `reactionOf`: the `plate` flag per event type; `ko` of the MAIN is `guard` (the figure holds until the fall beat); a `revive` of the main flashes the pyrefly green for any cause (the figure never lay down) | `SpecialReactions.ts` | the table in the step spec names the rows, not every flag |
| The look words `specialsfit`, `specialsmark`, `specialshold` and their values | `specialsWord.ts` | OPEN 2: Bailey's four look questions stay switches |

### 9.8 Byte delta (R-21)

The shared bundles gain `SpecialArtIds.ts` (three string literals and one function with one import, `baseArtId`), three early-out lines, and the optional HUD members. The tracker, the plans, the reactions, the holder and `forms.ts` are **orphans** until C2, so they are in no bundle. No production build was made in this step (the rule), so the main chunk's delta is **not measured**: PROOF measures it.

### 9.9 For the next steps

C1 and C2 import `tests/unit/helpers/specialFormState.ts` (`chapterIV`, `FORM_GIRLS`, `formUp`, `captureBursts`, the logs) and never copy it; `tests/unit/special-switch-off.test.ts` grows with each step (it already proves the presenter plays an ordinary Change burst without a call to `holdRows` or `showAtbChip`). `specialsLookWord()` is how C1's `setSpecialLook` and C2's `entryKind(..., hold)` read the look words. The pins must pass at every step.

## 10. The look, step C1 (2026-11-10; branch `ffx2-specials`; plan `docs/plans/ffx2-specials-look-review.md`)

**Game case: FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2); the shared plumbing (the anchor types, `StageFigureRequest`, `PartyStature`, `SummonStaging`, `StrikeReach`, the pose tooling) is **both games, additive, inert while the switch `specialDressUp` is OFF**. Nothing in an FFX or FF7 chapter changes; `git diff <start> HEAD -- src/battle` is empty. The step builds the stage-side machinery, pure and testable without a canvas; the stage call-ins (`BattlePresenterStage.ts`, the presenter, the preload) are C2's.

### 10.1 What landed (seven commits, in this order, then the records)

| Commit | What | Tests |
|---|---|---|
| `761c77a4e` | **The pins, alone, before any source edit**: the PartRings/StageAnchors/figure-request snapshot of every anchor in the scene tables, the literal old bodies of `sceneOwnHeight` and `formPlanScale`, the source text of the three summon functions, `subjectKind`/`gameOf`/`sideOf` of every subject | `special-anchor-ring`, `special-fit`, `summon-staging`, `pose-kinds-special` |
| `b31a29fd5` | `OnParentAnchor.box?`, `ring.hidden?/mark?/colour?`, `PartRings.setMark/setAnchor`, `StageAnchors.anchoredQuad` (box) and `anchorNow` | `special-anchor-ring` |
| `524e5fcdb` | `tools/special-part-anchors.mjs`, the generated `src/data/art/specialParts.ts`, the quarter-size mask fixtures | `special-part-anchors-tool` |
| `00638fe48` | `SpecialStaging.ts` and `FormActorHandle.ts` (the spec's steps 3 and 4 in one commit: the staging imports the handle) | `special-staging`, `form-actor-handle` |
| `e7c36d5c6` | `sceneOwnHeight`'s fit, `FigureEnv.specialFit?`, the hidden turn ring, `SummonStaging.idsOffStage/idsBack/heldOffAll`, `StrikeReach` | `special-fit`, `summon-staging`, `special-switch-off` (grown) |
| `536f815a5` | the fixtures keep a thin tip (box within a block of the full-size one); the table regenerated | `special-part-anchors-tool` |
| `1ed60c1ac` | the pose kind `special-ffx2` | `pose-kinds-special` |

### 10.2 The table is generated and provisional

`src/data/art/specialParts.ts` is written by `node tools/special-part-anchors.mjs` (`--check` exits 1 when it is stale; `--masks <dir>` and `--sidecars <dir>` override the inputs; `--out <file>`). Its inputs are the 48 quarter-size masks under `tests/fixtures/specials/masks/<special>/<pose>/{whole,main,right,left}.png` plus a `meta.json` each (the full-size render's size, feet row, top row and box). They are alpha silhouettes of the model renders (poses `idle`, `attack`, `cast`, `hurt`; frames idle-1, attack-2, cast-3, hurt-2); `victory` is owed, its render is not made. Every Special is `provisional: true`. **Regenerate the table whenever the art changes**: at stage 2 the painting's own masks and sidecars replace the fixtures. Right and left come from the file name, never from x (Full Throttle's attack has the right wing on the screen-right).

### 10.3 The four switches, as built (defaults; Bailey has not answered)

`setSpecialLook({ fit, mark, hold })` (null = defaults; C2 calls it with `specialsLookWord()`): `fit` `trial` (1.55 / 1.45 / 1.55 girls desktop, 1.15 / 1.0 / 1.15 phone, enemy share 0.9, width caps 35 and 60 percent), `larger`, `true` (the wider camera is NOT built); `mark` `a` (nothing on the figure, a whole-figure row with a hidden ring) or `b` (a gold target ring on the part); `hold` `per-save` or `short-always` (read by C2's `entryKind`). `STAND_POINT` is `own` for the three girls; `'middle'` is not implemented. The pose class of the Special kind is `standing` (D-36: class `part` needs Bailey's quoted words).

### 10.4 Moved to stage 2 or later, as the spec says

The Special rows of `src/data/art/poseRegistrationFoes.ts` and the three rows of `tools/posescale/subjects.json` are generated from the paintings and their sidecars (`measure.py`, python): no painting exists. `src/scenes/types.ts` is not edited (no `formGirlsPhone` field: the per-surface cap is `FIT_ROWS[row].formGirls`, the surface from `surfaceOf`). `upright: true` for Machina Maw's attack and hurt rows is stage 2's; `pose-kinds-special.test.ts` already proves from the fixtures that exactly those two are prone (771x636, 659x538).

### 10.5 Transient orphans (`node tools/orphans.mjs`)

After step A: 28. After C1: 31 = those 28 plus exactly `src/engine/SpecialStaging.ts`, `src/engine/FormActorHandle.ts` and `src/data/art/specialParts.ts` (their importers are C2's stage call-ins and D1's `partCrop.ts`, a second importer of `specialParts.ts`). Step A's four (`SpecialFormTracker`, `SpecialBeatPlans`, `SpecialReactions`, `SpecialPartyHold`) stay until C2. Any other new name is a defect. `FormActorHandle` imports `SpecialReactions` (so C2's presenter import of A's four is unaffected).

### 10.6 Deviations from the step spec, each kept to its intent

1. **Steps 3 and 4 are one commit** (`SpecialStaging` imports `FormActorHandle`). 2. The mask fixtures are cut by a **block rule** (a 4 x 4 block with any drawn pixel goes to the layer that owns most of it) so the quarter-size box is within one block of the full-size one; `meta.json` also carries `wholeBbox`, `baselineY` and `contentTop` at full size, because the prone test (Machina Maw's idle is 1.146 against the 1.15 line) cannot be decided from a quarter-size mask: `pose-kinds-special.test.ts` runs the real rule on the full-size box and checks the mask agrees to 8 px. 3. The mask reader takes the **alpha when the file has one, else the grey value** (the lane's masks are grey RGB); the committed fixtures are RGBA, so the spec's alpha rule holds for them. 4. `formSlots(stage, slots, pose = 'idle')` and `anchorRowFor(..., look, refHeight?)` take an optional trailing argument (the spec gives no pose to `formSlots`). 5. `PartAnchors.ts` is +22 lines (budget +20); `sync` leaves a mark ring's lit state alone (else the stage's per-frame `sync` would put every mark out), and a mark ring is not visible while unlit. 6. `heldOffAll` with no ids returns `heldOffStage`'s own set (equal, not identical: `heldOffStage` builds a new empty set each call). 7. `NOW.md` and `CHANGELOG.md` are not edited (the driver's records stage). 8. The spec's "spies on all of them" is done with pass-through `vi.mock` spies on the six stage hooks in `special-switch-off.test.ts`; nothing calls them in C1, so the case proves an ordinary Change burst through the real presenter never does.

### 10.7 `[ours]` rows (table values and rules the preflight does not give; none is a game number)

| Value or rule | Where | Why |
|---|---|---|
| Ring radius = 0.5 x the longer side of the part's box, capped at 0.35 of the figure's width | `tools/special-part-anchors.mjs` | the preflight says "ring radii", not how |
| Plate tile (`crop`) = the part's box grown to a square of 1.15 x its longer side round its centre, slid to stay inside the painting | the same | "the crop box" |
| Number point = the box's centre x, 0.30 of its height below the top (`NUMBER_POINT_Y`) | the same | "over the figure's upper middle" |
| `widthCapGirls` = trial girls x the window-share cap / the paper share (24 / 33 / 33 desktop, 42 / 55 / 59 phone; Full Throttle's provisional) = 2.26 / 1.54 / 1.64 and 1.64 / 1.09 / 1.17 | the same | the width term's unit (OPEN 3) |
| The `larger` row: 2.0 girls each on the desktop, the trial values on the phone; the `true` row: the silhouettes, no enemy term, no width term | the same | Q-3 (b) and (c) |
| The mode-(a) whole-figure row: the number point as `px` and `chestPx`, the figure's box, a hidden ring of radius 0.15 (`WHOLE_ROW_RADIUS`) | `SpecialStaging.ts` | "radius: small" |
| The mode-(b) ring's world radius = `radiusPx` over the feet-to-top span x the trial desktop height | `SpecialStaging.ts` | the table is in pixels, the ring in world units |
| The surface test: the shared phone test (`w < 600 && h > w`) | `SpecialStaging.surfaceOf` | OPEN 2 |
| The hit gate's reset events, set by C2: `action-start`, `action-end` and `turn-start` (a later poison tick is a first blow again) | the spec, rule 8 | code-fit F-21 |

### 10.8 For the next steps

C2 imports `SpecialStaging.ts` (`setStageForm`, `formHandleOf`, `partViewOf`, `specialFitOf`, `anchorSourceOf`, `formSlots`, `formKeepIds`, `partRoleOf`, `setSpecialLook`, `specialLook`, `FALL_GRADE`) and calls `StageAnchors.anchorNow` each frame, `idsOffStage`/`idsBack` for the parked girls, and reads `heldOffAll` at `BattlePresenterStage.ts:622`; it creates `StageForm.gate` with the form and flips `blocked` once per event. D1 imports `SPECIAL_PARTS` (`crop`, the plate tile) and reads the plates' order hint in both modes. `special-switch-off.test.ts` has the six hook spies (`vi.mock` at the top of the file): C2 keeps them. Stage 2 runs `node tools/special-part-anchors.mjs --sidecars <dir> --masks <dir>` and builds the ON preview with `vite build --mode specials-test`.

### 10.9 Open points taken in this step (the driver's calls; Bailey's to overturn)

OP-1 the section-4 defaults (plain renders, mark (a), size `trial`, hold `per-save`, Machina Maw `standing`); OP-5 no art is installed by this step (the masks are fixtures cut from the model renders); OP-6 BOTH the main's actor and the parts' handles are hit-gated (`formHandleOf` answers a hit-gated actor for the main's id); OP-9 the pins were taken at the branch head `ad10e9f00` (the release 80 integration line), so only PROOF's A/B covers the engine commits; OP-11 the three transient orphans of 10.5, accepted and named in the commits; OP-12 the quarter-size mask fixtures are committed (`tests/fixtures/specials/masks/`), so the tool's test runs in a clean checkout; OP-18 the ring, crop and number-point formulas are inferred constants (10.7) and the table is `provisional` until the real masks replace the fixtures; OP-19 no field in `scenes/types.ts`, the derived `widthCapGirls` table; OP-21 `STAND_POINT` is `own` for all three; OP-31 the `[ours]` values are table values with the rows of 10.7; OP-35 the files the preflight does not list are edited and counted: `motion/StrikeReach.ts` (+2) and `tools/posescale/pose-kinds.d.mts` (+3); OP-37 the handle cache is cleared by `setStageForm(stage, null)` and the stage-integrated cases of tests 4 and 14 are C2's.

## 11. The look, step C2: the presenter (2026-11-10; branch `ffx2-specials`; plan `docs/plans/ffx2-specials-look-review.md`)

**Game case: FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2); the presenter and stage call-ins are **shared plumbing for both games, synchronous and false or null while the switch `specialDressUp` is OFF**. Nothing in an FFX or FF7 chapter changes; `git diff <start> HEAD -- src/battle` is empty. The switch is OFF in every shipped chapter; nothing deploys; no art is installed.

### 11.1 What landed

| Commit | What | Tests |
|---|---|---|
| `0e8da18b4` | **The pins, alone, before any source edit**: `artCandidatesFor` for 62 ordinary combatants (every listed FFX and FFX-2 chapter's party and first formation, bare and in a namespace), the paintings/images/probes `preloadBattle` sends for Chapters IV and V with the switch OFF, `figureEnv().slots` being the stage's own object | `special-c2-pins` |
| `6fe43e111` | `BattleStage.setForm?`, `VfxPort.special?`; `FakeStage.setForm`/`vfx.special`, `FakeHud` recorders | (doubles) |
| `daa1568b3` | `BattlePresenterSpecial.ts`, `SpecialEntry.ts`, `SpecialExitFall.ts`, the guards and the call-ins of Playback, Base, Commands, `BattlePresenter.run`, Events, Beats, Arrivals | `special-presenter-sequence`, `special-reactions-replay`, `special-portrait-order`, `special-first-time-presenter`, `special-switch-off` (grown) |
| `a72de476e` | the stage call-ins (+21 lines on `BattlePresenterStage.ts`, already over the cap), `markedPartsOf` | `special-stage`, `stage-actor-sites` |
| `ef668e22a` | `SpecialArt.ts`, `artCandidatesFor`, `BattleScreenEncounter` (`specialSeen`, `setSpecialLook`, `markParts`), the preload | `special-art-ids`, `special-preload` |
| `8b141eb0f` | the framing cases of test 14, a portrait-order test that can fail | `special-stage`, `special-portrait-order` |

### 11.2 The runtime and the hold's life

One module `WeakMap<EventCtx, SpecialRuntime>` (`runtimeOf(ctx)`; no field on `EventCtx`): the tracker, the party hold, the stage form with its hit gate, the beat the event now playing starts, the girls' ids before the change. `noteSpecial` (once per event, before `playEvent`, with the engine's live state) makes it at the first `spherechange` with `special` while `state.flags.specialDressUp` is true; `preSubmit` makes it earlier and holds the HUD's list before `engine.submit` (OP-7: the rows stay held on the parts for the WHOLE life of the form, released by the exit, the fall, `defeat`/`victory`, `abort()` and the start of a link; `releaseSpecial` is idempotent). Every HUD change after the hold is a FULL sync (`SpecialHost.syncFullHud`), never `syncVitals`.

The entry walks A's `fullPlan`/`shortPlan` through `runPlan` (starts at 600 ms: the HUD's flourish; `ctx.sleep` scales by the speed, durations given to ports by `moveScale`; a step's own measured wait, such as a portrait longer than 700 ms, is added to the elapsed time so it shortens the next step, never the cut). The first-time id is written at the cut of a FULL plan only (not short, not aborted, not skip). The exit and the reachable fall (a part stands) are fixed plans; with all three bodies down the engine ends in `defeat`, the hold and the form are released there with no beat (OP-2 (a)); `fallPlan(true)` stays tested data.

### 11.3 The guards and the hit gate

`specialHolds` (ko, revive: the tracker knows the id), `specialStatusHolds` (a status on a part, petrify on the main, auto-life added to the main) are plain functions. `partKo`: the cue and the beat's time, no pose, no lie-down, no flash. `formRevive`: a part gets the heal cue and its numeral, the main (Auto-Life) the green flash. `formStatus` never calls `statusAdded` or `statusFxLanding`. The hit gate (D-9, OP-6: main and parts): `noteSpecial` sets `form.gate.blocked` for the event about to play: `action-start`, `action-end`, `turn-start` re-open it; a `damage` on the main or a part is gated when one already played in this action; every other event leaves it open. The numerals still print per plate.

### 11.4 Files the preflight did not list (accepted, OP-35; each counted)

`BattlePresenterPlayback.ts` (+13: `SpecialHost`, `noteSpecial`, the end test), `BattlePresenterBase.ts` (+2: `abort`), `BattlePresenterCommands.ts` (+2: `preSubmit`), `BattlePresenter.ts` (+2: `run`). Events +4, Beats +2, Arrivals +3, Ports +6, Art +3, Stage +21 (the spec's stop sign was +22), SpecialStaging +6 (`markedPartsOf`), Encounter +5, preload +19. Every new file is under 400 (Special 188, Entry 162, ExitFall 143, Art 31).

### 11.5 Transient orphans

31 (after C1) to 24: the seven transient orphans of steps A and C1 are closed (the stage imports `SpecialStaging`, the presenter the tracker, plans, reactions, hold and handle). The list is the base's 24 again.

### 11.6 `[ours]` rows (none is a game number)

| Value or rule | Where | Why |
|---|---|---|
| A part's status is `TIMING.status * 0.4` | `formStatus` | pacing, nothing seen |
| A part's revive keeps its heal numeral (at the part's number point, which is the figure's) | `formRevive` | the plate's information |
| The camera names hold the neutral wide shot (`SPECIAL_SHOTS` is empty); no rig is added | `SpecialEntry.ts` | OP-20; the first clip says which names need a rig |
| The short plan's reveal (stubs, painting) happens at its `cut` | `SpecialEntry.ts` | the short plan has no reveal step |
| The reveal's white flash on the new figure (600 ms, 0.9, not under reduce motion) | `SpecialEntry.ts` | the figure appears |
| The exit's whiten is a figure flash without the turn ring's flare (no port member for it) | `SpecialExitFall.ts` | stage 2 |
| The fall's squash is restored by a second ramp; not played under skip or reduce motion | `SpecialExitFall.ts` | the ramp is a share of the starting size |
| "The others return and the rows go back to three girls" at the end of a fall | `SpecialExitFall.ts` | not seen; the splits 4000/6000/7500 are A's |
| A stub's engine slot `3 + 2 * girlIndex + k` | `SpecialEntry.ts` | names the stub; it is anchored, not spotted |

### 11.7 Deviations from the step spec, each kept to its intent

1. The reactions replay is a NEW file (`special-reactions-replay.test.ts`), the stage-integrated cases a new `special-stage.test.ts`, the presenter half of test 8 a new `special-first-time-presenter.test.ts` (a module mock of `PaintedActor` and a different rig would change what the existing files prove). 2. `PhaseLighting.figures` still lists a stub: it lists every anchored part today (Chapter V's Bulwarks) and a filter would change that OFF; a figure-less actor has no painting to light. The phase floor centre, StageArt's party list and the smear's warm figure skip a stub (no added lines). 3. `stage()` also sets the parked girls to alpha 0 after re-adding them (+1 line): a re-stage would otherwise bring them back. 4. `FakeHud` recorders are `holdLog`, `chipLog`, `modeLog`, `hudLog` (a subclass of `FakeHud` in an older test already has a field named `order`). 5. `SpecialRuntime` carries two more fields, `beat` and `girls`. 6. `formRevive` prints the numeral for the main as well. 7. Nothing is run in a browser; the ON spec and the clips are stage 2's.

### 11.8 Known edges for the next steps

After a victory with the form up the figure and the faded parked girls stay on the stage for the results (OP-29: nothing built; D2's snapshot). `heldIds` of the parked girls survive a victory until the stage is rebuilt. The portrait's nominal length is 700 ms; a longer one is measured on the presenter's `now` clock. A `preSubmit` hold with a command the engine then rejects stays until the next release (harmless: it equals `activeIds`).

## 12. The look, step D1: the party plates and the command menu (2026-11-10; branch `ffx2-specials`; plan `docs/plans/ffx2-specials-look-review.md`)

**Game case: FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2). The row helpers answer "no form" (`null`, the unit's own dress, `''`) for a unit with no `dresspheres.special`, which is every unit while the switch `specialDressUp` is OFF; `TargetCursor` is a shared FFX file and the hint is additive and absent by default; `CommandMenu` and the HUD pass new optional members that do nothing without a form. Nothing in an FFX or FF7 chapter changes. No browser, no dev server and no build ran in this step: the CSS numbers are the preflight's starting values and are judged on screenshots in Stage 2, not claimed here.

### 12.1 What landed

| Commit | What | Tests |
|---|---|---|
| `2298ca6e9` | **The pins, alone, before any source edit**: the real engine's command window at Chapter IV (top rows, the Change submenu, `helpLabel` of every Change row, the aimed-ally view), a mounted `FFX2BattleHud`'s party-list `className` and root `outerHTML` through a menu open and an ally pick, one FFX chapter's mounted HUD, the cursor's cycling order with no hint, the results page's member rows (FFX and FFX-2) | `command-menu-off-pin`, `target-cursor-order-pin`, `results-rows-off-pin` |
| `e3f69e883` | the mounted-HUD pin leaves out the move advisor's card (see 12.7) | `command-menu-off-pin` |
| `e7e33645b` | `specialRows.ts`, `partCrop.ts`, `specialLeave.ts`, `plateTap.ts`; `PartyRows` form markup; `dressphereIcons` six part ids | `party-rows-special`, `special-part-tile-crop` |
| `69ddbf4cd` | `CommandMenu` (Leave label, tap path, order hint), `TargetCursor.setOrder`, `FFX2BattleHud` (one `PlateTaps`, two members handed to every menu); the switch-off append | `special-leave-label`, `ffx-cursor-unchanged`, `special-plate-tap`, `special-switch-off` (grown) |
| `8315c2c05` | the CSS of three sheets, additions only | `special-form-css` |
| this commit | CONTRACT-CHANGES entry and this section | |

`partyFace.ts` is **not edited** (the main's head is chosen by `faceDressOf`, which `faceStackHtml` passes to `faceLadder`; the shared builders keep their pins). `faceLadder`, `faceLayersHtml`, `portrait.ts`, `tests/e2e/portraits.spec.ts` and `tests/unit/atb-live.test.ts` are untouched.

### 12.2 The markup contract (what D2 and Stage 2 may rely on)

- A row of a form: `class="ig-stat ... ig-stat--form ig-stat--form-main"` or `... ig-stat--form-part`, `data-actor-id="<id>"`, `data-form-role="main|right|left"`, `data-form-special="floral-fallal|machina-maw|full-throttle"`. `right` is the engine's `parts.podLeft` and `left` its `parts.podRight`: the names are never sorted by screen x.
- The main's row also carries `<i class="ffx2stat__badge" style="--ffx2-special:<colour>" title="<Special>">FF|MW|FT</i>`, after the body's closing `</div>`; a part carries no badge and no job chip. The main's face tile shows HER head (`characters/<girl>-<returnTo>/idle.png`, `returnTo` read from the unit's own `sdsp`), not the figure's crown.
- A part's tile: `ffx2stat__face ffx2stat__face--part` holding the monogram floor (RP LP SR CL DW SW) and, when the manifest does not say the art is missing, `<img class="ffx2stat__face-img ffx2stat__part-img">` cropped from `characters/<main's art id>/idle.png` by `partCropOf` (C1's `SPECIAL_PARTS[...].poses.idle.<role>.crop`). **No part id ever appears in a URL**, and the tile has no `data-face-*` attribute. If a Special has no `idle` row the tile is the monogram floor only, and the crop test fails first, so that cannot ship.
- **No class, attribute or style is ever written to the party list**, switch OFF or ON. The form rules in CSS read `:has(.ig-stat--form-part)`.
- The targeted ring is the existing `.ffx2--targeted-ally` that `paintLit` puts on any `[data-actor-id]`: no new class on an ordinary row, no pink "targeted name".
- Taps: `PlateTaps` (one delegated `click` on the list; `[data-form-role]` rows only) is handed to `openCommandMenu`, which sets a handler at every build and clears it in `cleanup`. The handler acts only for an id in `targetIds` and goes through the same `clickPath` as a click on the figure's mark (a touch tap aims first, the second tap confirms; a mouse click confirms). The plates get `pointer-events: auto; cursor: pointer` from `[data-form-role]` alone.
- Order: `formTargetOrder(state, ids)` returns the ids of `activeIds` that are in `ids`, in `activeIds` order (main, right, left), whenever `ids` holds a part, in both look modes; otherwise `null`. `TargetCursor.setOrder` puts the hinted ids first in that order and the rest after them by projected x.

### 12.3 A finding for D2 and Stage 2: every plate-to-plate command of a form is a group heal today

**Corrected by 13.5 and 14: this holds for YUNA's Floral Fallal parts only; Rikku's and Paine's parts do offer one-target ally rows (HP Repair, MP Repair, Stamina, Mettle), so AC-5 has a target on their side.** The real engine, driven through a form (all three girls' decisions, mastered and not), offers Yuna's form no single-target command that lists the plates: White Pollen, White Honey, Hard Leaves, Tough Nuts, Mirror Petals, Floral Rush and All-Life carry `targeting: 'all-allies'` and the menu aims them as a group at once; Barrier and Shield are self. So the plates' order hint and taps are reached by a group pick not at all and by a one-target pick only if the engine offers one (a Revival row for a fallen part is the candidate). `special-plate-tap.test.ts` therefore takes the real White Pollen row and drops its group `targeting`, an input to the menu and not game data; the e2e 24 that D2 writes and Stage 2 runs says whether a real one-target pick exists. Nothing was invented to make one.

### 12.4 The CSS starting values (the preflight's; judged on screenshots in Stage 2)

`ffx2-hud.css`: `--ffx2-form-w: 250px`, `--ffx2-form-name: 100px` on the form's list (not on `.ffx2hud`), acting row +7 px; the badge hidden by default and shown only while a part row is drawn. `hudf1-ffx2.css`: the F1 list anchored by its right edge (`right: 29px`) while a form is drawn, the name column. FFX-2 `phone-hud.css`: one column of slim rows (46 px, a 34 px face, 17 px lines), full names (`text-overflow: clip`), the badge at 14 px, and the Wait/Active chip and the status hint lifted by 84 px.

### 12.5 `[ours]` rows (none is a game number)

| Value or rule | Where | Why |
|---|---|---|
| The badge is hidden until a part row is drawn (OP-14) | `ffx2-hud.css` | no spoiler during the one-row stretch of the entry; delete the `:has` condition on the badge rule to show it always |
| Floral Fallal's two parts in the neutral cream `#F4F1E8` (OP-15) | `dressphereIcons.ts` | pink already means the acting row, the aimed enemy and the Special itself; one table value |
| Rows 46 px, face 34 px, lines 17 px, gap 4 px on the phone | `phone-hud.css` | the preflight's stacked rows; judged at 390 by 844 in Stage 2 |
| The lift of the Wait/Active chip and the status hint by 84 px | `phone-hud.css` | the stack is about 84 px taller than the one line of chips; other anchors, if any, are found by the first phone screenshot (OP-17) |
| The order hint is passed in both look modes, and cleared with `null` when a pick has no form | `CommandMenu.ts` | the plates' rectangles do not tie to the pixel under mode (a); a hint left by an earlier target view cannot leak |
| A badge floor on the old HUD (`max(5.5px, var(--hud-floor))`, scoped to `:not(.hud-f1)`) | `ffx2-hud.css` | the job chip has the same rule in `hud-floor.css`; the F1 HUD has its own in `hudf1-ffx2.css` |

### 12.6 The driver's calls this step took (open points; each is the spec's own recommendation)

OP-13 (mode a/b of the part mark and the taps: the default draws no mark, leave to the first clip). OP-14 badge hidden until a part row is drawn. OP-15 the neutral cream. OP-16 `:has()`, not a `data-form` attribute (if a target browser lacks `:has`, the rules drop and the rows keep the ordinary layout; then add `partyEl.toggleAttribute('data-form', ...)` in `renderParty` and swap the selectors). OP-17 what sits above the lifted phone chips and O-7 (the pixel width of "Sinistral Wing" and "Smasher-R") are measured in Stage 2's first phone screenshots. OP-18 C1's crop table is provisional and regenerated at Stage 2; the tile follows without a code change. OP-23 the pause CHAPTER tab prints a part's dressphere with dashes removed (`panels.ts`): D2's file, left and recorded. OP-27 the "Use <Part> skills." help line is not built (no source says where the menu prints it; the menu already names the acting part). OP-31 the `[ours]` rows above. OP-33 "the figure does not cover the HUD lanes" is a Stage 2 screenshot. OP-35 no file outside the preflight's list was touched (the three CSS files, `PartyRows`, `dressphereIcons`, `CommandMenu`, `TargetCursor`, `FFX2BattleHud`). OP-20, OP-21, OP-24 to OP-26, OP-28 to OP-30, OP-34, OP-36 and OP-37 belong to other steps and are unchanged by this one.

### 12.7 Deviations from the step spec, each kept to its intent

1. **The mounted-HUD pin leaves out the move advisor's card** (`e3f69e883`). The card has text only when the tactics data was already imported, so the same HUD pinned differently in a file that had run `createEngine` first. D1 edits nothing of the advisor; the fixture is the first pin with the same cut applied, and it passes against the edited source.
2. **`cursor.setOrder(order ?? null)`** in `renderTargets`, where the spec writes `if (order) cursor.setOrder(order)`: a hint an earlier target view left would otherwise stay. With the switch OFF the hint is `null` both ways.
3. **A badge floor on the old HUD** (12.5), not in the spec's CSS list: the job chip has one in `hud-floor.css`.
4. **Existing test edited: `special-switch-off.test.ts`**, as the spec says ("Append to ... test 10"): imports, three `vi.mock` pass-through spies (`specialRows`, `partCrop`, `specialLeave`), a `setAtbBarsSmooth(null)` in the existing `afterEach`, one new `describe`. No assertion was changed.
5. **The plate-tap test drops the group `targeting` of one real row** (12.3: Yuna's White Pollen, the one girl whose form has no one-target pick; see 13.5 for the other two).
6. **`PlateTaps.dispose` is not called by the HUD's `unmount`** (the spec lists five call-in lines): the listener sits on an element the HUD drops with itself.
7. **Process:** the first commit message was written with a shell heredoc (a rule of this build says to write files with the Write tool); it wrote only the message file.

### 12.8 Known edges and what comes next

D2: the pause tabs, `ProFieldMarks`, `phoneFraming`, the always-visible-surface snapshot, e2e 23 and 24 (written, not run). Stage 2: the real art, the CSS numbers judged at 1600 by 900 and 390 by 844, O-7, the lift anchors, `SPECIAL_SHOTS`, the effects. The count of three plates in the list is not yet tested at the phone's 360 width: rows stack, so the width is the name's.

## 13. The look, step D2: the always-visible surfaces (2026-11-10; branch `ffx2-specials`; plan `docs/plans/ffx2-specials-look-review.md`)

**Game case: FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2). The pause files, `ProFieldMarks.ts` and the tactics are shared by both games, so every edit is additive and inert while the switch `specialDressUp` is OFF (no combatant carries `dresspheres.special`, so the new readers answer `null`, `false` and `[]`). The rule is D-32: the surfaces name the three plates (the girl, then the two parts by their own names) and nothing else; a part is never given a girl's plate, tab portrait or count; a girl who is away is never named, counted or offered a revive.

### 13.1 What landed

| Commit | What | Tests |
|---|---|---|
| `5b80f283c` | **The OFF pins, alone, before any edit**: `buildTabs` at Chapter IV, Chapter V, the FFX state and no battle; a real `PauseView` over Chapter IV on each girl's tab (the `PortraitStage.show` arguments, the img on screen, the mirror class, the tab strip, the body text) with a manifest listing the plates and with none; `ProFieldMarks` with the pro piece forced on for a downed girl, FFX-2 and FFX | `pause-tabs-off-pin` |
| `15ace9c43` | `SpecialFormMembers.ts` (52 lines): `formMainOf`, `isFormPartId`, `awayGirlIds` (transient orphan for this commit only: its importers come in the next but one) | `special-form-members` |
| `599dd56bd` | **The snapshot tests, written before any edit**, every always-visible surface with a real form up (26 cases, all pass against the unedited code): the surface table of 13.2; `helpers/specialSurfaces.ts`; `fell` and `playUntilOver` copied into `helpers/specialFormState.ts` | `special-surfaces-fight` |
| `e8fa11d46` | the two edits the snapshots demanded (13.3), the pause snapshot (22 cases; 19 failed before the edit, output kept with the build notes), the pro KO marks block, the OFF identity half of the pins, the switch-off append | `special-surfaces-pause`, `special-surfaces-fight`, `pause-tabs-off-pin`, `special-switch-off` |
| `b63a2e16d` | e2e 23 and 24 and `tests/e2e/support/special-walk.ts`, written, not run | `tsc -p tsconfig.e2e.json` |
| this commit | CONTRACT-CHANGES entry and this section | |

### 13.2 The surface table: what each snapshot found

| Surface (read point) | Result of the snapshot with a REAL form up (Floral Fallal, Machina Maw, Full Throttle) | Edit |
|---|---|---|
| Turn cut-in (`TurnCutIn`, `?portraits=turns`) | `ATB 1 OF 3`, `ATB 2 OF 3`, `ATB 3 OF 3` for the main, right part, left part, with the part's own name; no cut-in and `wants` false for an away girl | none (passed unedited) |
| Strategy Guide (`buildGuideView`) | `next.actorName` is the acting plate, `next.targetName` is a plate, a foe or "the party" / "all enemies"; no away girl in `next`, the watch rows or the phase label (hint prose is chapter text and is not read) | none |
| Enemy-intent slab (`engine.intent()`) | Impulse lists all three plates (with the girls' invincibility rig taken off: with it on the main is not "touched" and the slab lists only the two parts, which is the rig's doing); a random-target row lists only plates; no away girl | none |
| Move advisor (`buildAdvisorView`) | the card is for the acting plate; no line names an away girl; every aim is a plate or a foe; a fallen part is a legal target of the menu's Revival row (Yuna's All-Life, Rikku's Revival; Paine's wings have no revive row) and an away girl never is | none |
| Phone framing (`framedIds`) | the three plates then the foe; actor weighs `actor`, the other plates `party`; a downed part weighs `party` in Chapter IV and `ko` only on a KO-framing road (checked on a clone of the board with `x2-shiva` as the foe) | none |
| Results page (`buildMemberRows`, the real `ResultsScreen`) | after a victory in a form the engine has ended the form silently: `activeIds` is the three girls again and the rows are Yuna, Rikku, Paine | none |
| HUD party column (`FFX2BattleHud`) | a downed part's row has `ffx2-hp--ko` (and the KO pill under the pro look); the main's and the other part's do not | none |
| The same surfaces with the HUD holding the girls, one girl or the three parts | tabs, Guide, intent, advisor, framing and away list answer the same whatever list is held; the HUD column follows the held list | none |
| Pause tabs (`buildTabs`) | already the three plates' names in the order main, right, left, then the six fixed tabs; none for an away girl | none (`tabs.ts` is not edited) |
| Pause plate (`PauseView.renderPlate`) | **FAILED**: a part's tab asked for `art/pause/<part id>.png` and `art/portraits/<part id>.png` | `plates.ts` `plateMemberFor` + the one call in `PauseView.ts` |
| Pro KO marks (`ProFieldMarks.sync`) | **FAILED**: a downed part got a wash and a mark on the figure it stands on, and the parts (the figure's rectangle) pushed the main's own mark off its point | `ProFieldMarks.ts`, two reads of `isFormPartId` |
| HUD lane fence (`FFX2BattleHud` projection loop) | not testable in jsdom (needs layout) | none: a Stage 2 screenshot with a form up and the Guide open |
| Pause body (`meters.ts`, `panels.ts`) | a part's tab shows the part's own HP pool and meters; the stat bars compare the three plates | none; see 13.5 |

### 13.3 The edits (all additive, all inert while OFF)

- `src/engine/SpecialFormMembers.ts` (new, 52 lines, types only).
- `src/app/screens/pause/plates.ts` (286 to 295): `plateMemberFor(id, state)`, a part gives its main's id, anything else the id itself.
- `src/app/screens/pause/PauseView.ts` (404, no net change; over the cap before): `renderPlate` passes its member through `plateMemberFor`, so the plate and the chrome side are the main's.
- `src/ui/common/ProFieldMarks.ts` (201 to 204): `this.standing` and the loop leave a form part out. The spec names line 101 (the standing list) and the loop; both are guarded, because with only the loop guarded the main's own mark was pushed off the figure by her parts' rectangles (the snapshot showed the mark at 320 instead of 500).

### 13.4 How to run e2e 23 and 24 (Stage 2, under the suite lock, art installed)

`node node_modules/@playwright/test/cli.js test tests/e2e/pause-with-form.spec.ts tests/e2e/special-touch-aim.spec.ts` (each starts its own vite dev server on a random port 5400-5990 and stops it by PID). `STRICT_404=1` makes e2e 23 demand no failed response at all (art installed); `SPECIAL_SHOTS=1` writes `docs/screenshots/special-pause-form-<girl>.png`. The walk is greedy over the Change rows (cap 60 decisions); if it wanders, the fallback is `window.__pyrefly.specials(true)` plus a state seeded by `specialDrive` in a unit test. Nothing in either spec has met a browser.

### 13.5 Open points and findings

- **A finding that corrects 12.3:** the one-target ally rows of a form do exist for two of the three girls. Rikku's Machina Maw parts offer HP Repair and MP Repair (`single-ally`, three valid targets: the main and both parts), Paine's Full Throttle wings offer Stamina and Mettle (`single-ally`, three targets). Only Yuna's Floral Fallal parts offer no one-target pick (White Pollen, Hard Leaves, Tough Nuts, Mirror Petals are `all-allies`; Revival is the candidate when a part is down). So e2e 24 runs Rikku and Paine; AC-5 (a part aimed by a real tap) has a target there. For Yuna it is a design question for Bailey, unchanged.
- **The pause body prints a part's Dressphere as the part id with dashes removed** ("floral fallal right pistil", on the part's own tab and on the CHAPTER tab's party column). Left as it is (spec OP-23; the pause body is not a fight surface). Option for Bailey: the Special's name instead.
- **The advisor warns "This target is immune - nothing lands" on a revive aimed at a fallen part** (seen for Yuna's All-Life and Rikku's Revival, in the card's `warning`, while the engine's own menu lists the part as a valid target and the engine raises it). The warning comes from `advisor.ts`'s generic "tried to apply something and applied nothing" rule (the revive's status effect); it was not investigated for an ordinary girl. Nothing asserts on it. Recorded, not guessed at (spec 8.3).
- **Phone framing under mode (a)** weighs the figure three times (three plate ids share its rectangle): a Stage 2 phone screenshot judges whether the camera moves wrongly.
- **Pro-look marks are off by default**, so the `ProFieldMarks` edit has no visible effect in a shipped build; the unit tests force the option on.
- The Guide is "silent about the away girls" by construction on every path read (the away girls are not in `activeIds`; the status-hint card skips `removed`).

### 13.6 `[ours]` rows (none is a game number)

| Rule | Where | Why |
|---|---|---|
| A part rides its main's pause plate (and chrome side); the tabs stay three, one per plate (OP-22) | `plates.ts`, `PauseView.ts` | a part has no painting of its own; the other reading, one tab per girl with the parts inside, is one filter in `buildTabs` |
| The pause body's dashed part names are left (OP-23) | `meters.ts`, `panels.ts` | the body is not a fight surface |
| A downed form part makes no field KO mark, and is not a figure the main's mark keeps clear of | `ProFieldMarks.ts` | the figure must not change when a part falls; the row's KO pill says it |

### 13.7 Deviations from the step spec, each kept to its intent

1. **The pins commit has no `plateMemberFor` identity half**: the function cannot exist before the edit that adds it. The identity for every `activeIds` entry of the pinned states is asserted in `pause-tabs-off-pin.test.ts` by the commit that adds `plateMemberFor`.
2. **`PauseView.ts` has no net line change** (the spec counts +2): the import line and the member line were changed in place.
3. **`ProFieldMarks.ts` is +3 lines** (the spec counts +4): the import and a two-line comment; both reads guarded (13.3).
4. **A transient orphan between two commits**: `SpecialFormMembers.ts` has no production importer between its own commit and the edit commit; the orphan list at the end is the base's 24.
5. **Existing test edited: `special-switch-off.test.ts`**, as the spec says ("Append to ... test 10"): imports and one new `describe`; no assertion changed.
6. **The cut-in, Guide, intent, advisor, framing, results and HUD cases are asserted on names, ids and weights, not on hint prose** (spec 3.3).
7. **The intent case takes the girls' invincibility rig off** (a rig of the measurement, as `exposed` does elsewhere) so every plate is touched by Impulse.

## 14. The review fix pass (2026-11-10; branch `ffx2-specials`; three independent reviews of `9ddb00cc8`)

Game case: **FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2); every source edit below is shared plumbing, additive or inert while the switch `specialDressUp` is OFF. `src/battle/**` is untouched. Each finding was checked against the code first; none was false. One commit per finding or group (`Specials review fix R...`).

| Finding | Result |
|---|---|
| R1-1 `--sidecars` | `tools/special-part-anchors.mjs`: a sidecar counts only with its own width and height; with one, `baselineY` and `contentTop` come from it or from the figure's box scaled to its size, never from `meta.json`'s render scale; `provisional` clears per Special only when EVERY posed row matched a sidecar (Full Throttle stays provisional: its width is with the swords); unmatched poses are named on stderr. Four new cases. The committed table is byte for byte unchanged. |
| R1-2 | `stand-reach.test.ts`: a form's parked girl (`idsOffStage`) is no obstacle in the lunge lane; fails when `StrikeReach` reads `heldOffStage` again. |
| R1-3 | `special-stage.test.ts` asserts the seven stage hooks through a real `PaintedStage` (each asked, each answers undefined / empty / the same object); the presenter-only case in `special-switch-off.test.ts` is renamed to what it proves. |
| R1-4 | `noteStatus` is `swallow` for the part's handle (**16 forward, 10 swallow, 3 source**; supersedes 9.5 (1)); the main's actor still forwards it. |
| R1-5 | Two stale comments (`vite build --mode specials-test`; `anchor-ring-pin.txt`). |
| R1-6 | `anchorSourceOf(stage, mainHeight?)`: the stage passes the parent actor's live height, so a mark-(b) ring follows the figure on a phone (it was 35 percent too big). Default mark (a) draws no ring. |
| R2-1, R2-2 | `special-presenter-submit.test.ts` (new): `presenter.submit` on the real engine, the first hold set by `preSubmit` before the engine mutates `activeIds` and before any event, `run()` / victory / `abort()` releasing a form, a real `FFX2BattleHud` (held lists in order, a full sync after the swap and the cut, no `syncVitals` before the cut, the main's row text from the live state). Each call-in was deleted in turn to see its case fail. The dead spy and the tautology are gone from `special-presenter-sequence.test.ts`. |
| R2-3 | `releaseSpecial` now calls `idsBack` for the parked girls (the form's list, else the tracker's for a release before the reveal): `heldOffAll` is empty again and they fade back in. |
| R2-4 | `SpecialEntry.clockOf` reads `beatNow`, then `now`, then `Date.now` (kept for the wall-clock beats, whose sleep it matches). A test with a jumping wall clock and a control. |
| R2-5 | The exit's `girl-stands` dissolves the old-dress girl back in (`dissolveTo(0)`, SPEC-C2 rule 9) instead of popping her in. The fall's `girl-lies` is unchanged (the spec leaves it open). |
| R2-6 | Pin 1b: the FF7 chapters (hidden, in `UNLISTED_CHAPTERS`) keep the literal old `artCandidatesFor` body. |
| R2-7 | `markedPartsOf` answers one shared frozen empty list. |
| R3-1 | `phone-hud.css`: the phone's form row rule carries `width: auto` (the desktop's 250 px rule, specificity 0,4,0, beat the phone chip's 0,3,1); a css test reads both specificities. A Stage 2 390 x 844 screenshot still confirms it by eye. |
| R3-2 | e2e 24 (written, not run): the enemy-aim block opens the part's own one-enemy skill (Howitzer; Venom Wing or Ma'at's Feather) because the engine offers a part no Attack row. |
| R3-3, R3-4 | Pause body and CHAPTER tab with a real form; the OFF halves of the enemy-intent slab and the advisor. |
| R3-5 | A part's turn cut-in (only under `?portraits=turns`) keeps the part's own name and ATB label and borrows its MAIN's portrait file: `portraitId?` on `TurnCutInRequest` and on `MomentsPort.turnCutIn`, set by `TurnCutIn.play` through `formMainOf`. This follows SPEC-D2's "no portrait file for a part; the main's stands in" (the pause already does). The tsc of the commit before the type follow-up was red for two lines of a test. |
| R3-6 | 12.3 and 12.7 item 5 corrected (only Yuna's parts have no one-target pick). |

**Game case of commit `a9049025b` (R2-6, pin 1b): FFX-2 only.** The commit is tests only and pins the hidden FF7 path of `artCandidatesFor` as UNCHANGED, so FF7 is touched by nothing. Its message says "tests only, FF7 untouched" and does not name the game case; commits are never amended, so this line is the record (fix pass 2, item O4).

**Found by the reader run, not by a reviewer:** `noteSpecial` and `preSubmit` read `state?.flags['specialDressUp']` and threw on a state double with no `flags` field (`portraits-big-moves.test.ts` failed at the head); now `flags?.`, with a case.

**Left for the driver (an existing test that step C2's spec'd behaviour breaks; no test was edited):** `exp-leblanc.test.ts` "resolves every figure to the ids it always did" and "resolves each girl in each dressphere ... inside the namespace" fail at the head and before this pass. `girlsInEveryDressphere()` builds a girl wearing each OWNED dressphere of Chapter VI's build, the three Specials included, and C2's `specialArtCandidates` answers a girl wearing a Special with her Special's painting only (SPEC-C2 rule 12). Such a girl cannot exist with the switch OFF. The smallest fix is in the test: leave the three Special ids out of `girlsInEveryDressphere()`. **Fix pass 2 ran that claim on the real engine and it does not hold for a forged command: see 15.2; the test is still not edited.**

## 15. The review fix pass 2 (2026-11-10; branch `ffx2-specials`; the verifier's FAIL of `bd53ec595`)

Game case: **FFX-2 only in what is seen** (the three Special dresspheres exist only in FFX-2). This pass changes tests, test helpers and these records. No file under `src/` changed, none under `src/battle/**`; the switch `specialDressUp` stays OFF in every shipped chapter. One commit per item.

| Item | Result |
|---|---|
| O1 (R3-2 finished: the rows e2e 24 opens) | **Done** (`8b18ebc23`). The rows are candidate lists in one shared table, proved on the real engine with each chapter's own party build. Two more walk problems found and one fixed (15.3). |
| O2 (the two `exp-leblanc.test.ts` cases) | **Stopped, as the pass's own rule says, because the proof failed** (15.2). `exp-leblanc.test.ts` is not edited. |
| O3 (`special-surfaces-fight.test.ts` over 400 lines) | **Done** (`7ea4b9a1c`): 36 cases before, 26 + 10 after, the same 36 titles (15.4). |
| O4 (`a9049025b` does not name the game case) | **Done**: one line in section 14, after its table (commits are never amended). |

### 15.1 O1: what the part menus really offer, and the shared table

`tests/e2e/support/special-rows.ts` (no playwright import) holds `CHAPTER_OF`, `PARTS`, `AIMED_GIRLS`, `ENEMY_ROWS`, `ALLY_ROWS`, `PASS_ROWS`, the walk's row names and the two small rules (`firstPresent`, `nextChangeRow`); the specs and `tests/unit/special-e2e-rows.test.ts` import the same objects. The unit test plays the walk of each girl on `setupForChapter(chapter)` with the chapter's own `buildRef` (switch ON, Wait, seed 1; `helpers/specialPartMenus.ts`), reads the menus of the three plates and asserts every table entry against them. Run it: `node node_modules/vitest/vitest.mjs run tests/unit/special-e2e-rows.test.ts`.

What the real engine offers (rows by what the menu prints; Chapter IV's build for Yuna and Rikku, Chapter V's for all three; the rows are the same in both chapters):

| Plate | Rows |
|---|---|
| Yuna | Attack; Skill: Heat Whirl, Ice Whirl, Electric Whirl, Aqua Whirl; Change: Leave Floral Fallal |
| Right Pistil | Skill: White Pollen, Hard Leaves, Tough Nuts, Mirror Petals (all allies), Floral Bomb (all enemies) |
| Left Pistil | Skill: Dream Pollen, Mad Seeds, Sticky Honey, Halfdeath Petals, Silent White (all enemies) |
| Rikku | Attack; Skill: Death Missile, Bio Missile, Break Missile; Change: Leave Machina Maw |
| Smasher-R, Crusher-L | Skill: Howitzer, HP Repair, MP Repair, Homing Ray (Howitzer and Homing Ray one foe; the repairs one ally, aimed at all three plates) |
| Paine (Chapter V) | Attack; Skill: Aestus, Winterkill, Whelmen, Levin; Change: Leave Full Throttle |
| Dextral Wing (right) | Skill: Venom Wing, Blind Wing, Mute Wing, Lazy Wing (one foe), Stamina, Mettle (one ally, three plates) |
| Sinistral Wing (left) | Skill: Steel Feather, Diamond Feather (all allies), White Feather, Buckle Feather (all enemies), Stamina, Mettle (one ally, three plates) |

A part has no Attack row and no Change row; its whole top level is one Skill submenu. **Paine's left wing has no one-foe skill in Chapter V's own build** (Ma'at's Feather, which e2e 24 named after review fix R3-2, is a row only a mastered rig offers: the unit test shows it on `formUp('paine', { mastered: true })` and not on the chapter). Its pick is therefore a group aim (White Feather, Buckle Feather); the spec asserts the aim mode the table names (`single` or `all`), and a tap on a plate while a foe or the foe group is aimed must still do nothing (`PlateTaps` acts only on a plate that is a candidate). Rikku's parts and Paine's right wing keep a one-foe pick first.

### 15.2 O2: the proof that no girl can wear a Special with the switch OFF failed

The pass had to prove by running the real engine that, with the switch OFF, no girl can wear a Special, and only then move the Special dresses out of `exp-leblanc.test.ts`'s `girlsInEveryDressphere()`. Run on Chapter VI's build (`chateauBuild`, through `ffx2-leblanc` and through the experiment `exp-leblanc`), on Chapter IV's and Chapter V's:

- **Held:** her own walk along the whole grid (every dress worn, 4 or 5 Changes) never offers the Special row with the switch OFF, and no girl wears a Special; the Special row's own command forged at the node she stands on is refused (nothing changes); no chapter's build starts a girl in a Special (23 FFX-2 builds scanned). With the switch ON the same walk offers the row and picking it puts the Special on her (the control).
- **Failed, route 3:** `engine.submit({ kind: 'spherechange', targets: [], extra: { toDressphere: <her Special>, toNode: <any node linked to the one she stands on>, gatesCrossed: [] } })` on her own turn, with `specialDressUp` true, false or absent, leaves `state.combatants[girl].dresspheres.current` equal to the Special's id. 27 of 27 combinations (chapter, girl, flag) with the switch OFF: nodes 1, 3 and 4 on Yuna's and Rikku's grids, 1, 4 and 5 on Paine's; on all four builds. A made-up id (`no-such-dress`) and another girl's Special are worn the same way.
- **Why:** `FFX2Engine.submit` performs any command it is given; `performCommand` asks `performSpecialChange` (false with the switch OFF) and then `performSpherechange`, which takes `extra.toDressphere` as given and checks only that `toNode` is linked to her node. It never checks that the dress on that node is the one named. With the switch ON the same forged command without the flag (`false` or absent) is accepted too; with the flag `true` it is refused. The existing case `ffx2-special-dress-up.test.ts` "with the switch off there is no row and the wheel's own command is refused" forges at her CURRENT node, which is why it did not see this.
- **How it is reached in a shipped build:** no menu builds such a command (a Change row carries the dress that sits on its node), as far as the callers of `submit` read, the strategies and the move advisor take rows the engine offered; `window.__pyrefly.forceCommand(command)` (`src/debug/api.ts`) submits any command, so a console user can. Nothing in play does.

So the premise of the proposed helper edit ("such a girl cannot exist with the switch OFF") is true of every menu and false of the command API. Not done, because of that: the edit of `girlsInEveryDressphere()`, the cases that pin the Special rule in the art namespace, and the art-gap case (all three wait for the driver's decision). The decision: (a) accept the weaker statement (no menu, AI or advisor route; the console only) and move the helper, or (b) close the hole first in `src/battle/ffx2` (a Change must name the dress that sits on the node), an engine edit with its own pins and A/B. For the open point the pass would have recorded: the manifest holds 24 `exp-leblanc-*` subjects and no Special painting under any namespace, plain ids included (no subject is named `floral-fallal`, `machina-maw` or `full-throttle`), so before the switch may go on for the experimental Leblanc chapter either namespaced Special paintings are installed or `SpecialArt` gets a namespace fallback (a Stage 2 decision for Bailey).

### 15.3 O1 also found two problems in the walk of `special-walk.ts`

The unit test plays `walkToForm`'s rules on the real engine (`greedyWalk` in the helper: the same `nextChangeRow` and `PASS_ROWS`, the girls' HP topped up as `specialDrive.walkTo` does).

- **W1, fixed: Yuna starts both chapters as a White Mage, whose menu is White Magic, Change and Item, with no Attack row.** The walk took Attack for every plate that is not the girl being walked and threw on Yuna's turn in Rikku's and Paine's walks. `PASS_ROWS` (Attack, then Cure: a White Mage spell on her menu in both chapters, one ally) is the fix; `openRowAnywhere` moved from the touch-aim spec to `special-walk.ts` so the walk can open Cure inside White Magic.
- **W2, found and not fixed: the foe's Curse greys the whole Change list.** In Chapter IV at seed 1 Yuna is Cursed in Gunner after her first Change, and every Change row reads "Cursed" (the walk throws at once now, with the rows it saw, instead of wandering through its 60 menus). `specialDrive.walkTo` lifts the status as a rig; the page has no such rig, and the in-game answer is Holy Water on the girl (an Item row, aimed at her). With the engine's rig off the walk reached the Special for Rikku (Chapter IV) and for Rikku, Paine and Yuna (Chapter V) at seed 1; only Yuna in Chapter IV was Cursed. The page's timing is not the engine's, so this is a risk for Stage 2, not a certainty. Options: play Yuna's e2e 23 in Chapter V (her Special is there too), or add a Holy Water step to the walk.

### 15.4 O3

`special-surfaces-fight.test.ts` (444 lines) keeps the cut-in, the Guide, the intent slab, the advisor and the phone framing (241 lines, 26 cases); `special-surfaces-fight-hud.test.ts` (new, 180 lines, 10 cases) holds the results page, the party column, the held-list case and the pro KO marks. `helpers/specialFightSurfaces.ts` holds what both read (`guideLine`, `cardOf`, `mountHud`, `off`, the shared jsdom hooks as `useFightHooks`). Whole `describe` blocks moved; every other line is byte for byte the old one.

### 15.5 `[ours]` rows and deviations

- `[ours]`: Cure as the pass row of a White Mage (any harmless spell of her own menu would do); the pick order within each part's candidate list (the first present wins); the group aim for Paine's left wing. None is a game number.
- Deviation: O1 grew past the verifier's finding (PASS_ROWS, `openRowAnywhere` moved, the Change-list guard) because the pass said to check every row name in both specs and the support file; `pause-with-form.spec.ts` is not edited (it reads the same tables through `special-walk.ts`).
- Deviation: O2 stopped (15.2).
