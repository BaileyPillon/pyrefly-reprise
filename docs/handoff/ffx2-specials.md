# FFX-2 Special dresspheres: the engine, the data and the look options (branch `ffx2-specials`)

**FFX-2 only** (a Special dressphere is an FFX-2 idea; nothing here touches FFX or FF7). Lane of 2026-11-09 under Bailey's words "Keep going please with everything you were doing" (2026-11-09 ~12:35 EST) and "Build them (Recommended)" (2026-11-07, answering whether to build FFX-2's special dresspheres). Decision 92d (D-937, **in force**): the Specials' three-part look gets 2 or 3 options shown to Bailey first, and nothing perceivable is built until he picks. So this lane built the **non-visual engine behind a switch that is OFF**, the **data**, the **research** and **three look options**; no HUD, wheel, presenter or art file was touched.

## 1. What is on the branch

| Part | Where | State |
|---|---|---|
| Research | `research/re-ffx2-special-dresspheres.md` | how the form is reached, what the parts are, all 99 commands with every number sourced, the stats, the finishers, how the form ends, the conflicts between sources, the driver's picks with their alternatives (section 10) |
| Look options (92d) | `special-dress-up-A.jpg`, `-B.jpg`, `-C.jpg` in the lane's scratch folder (`2026-11-09/specials/cards/`, outside the repo: the pictures use the private art mirror and never go to `main`) (1080 x 1920, JPEG, about 330 KB each) | three distinct options, each labelled; A is the faithful reading. Made on the local ComfyUI (animagine-xl-4.0, the project's own checkpoint and style tags, img2img over the approved paintings of the r77 art mirror), composed with `sharp`. **Waiting for Bailey's pick** (section 6) |
| Data | `data/ffx2/command-records/special.ts` (99 rows), `abilities/special-*.ts` and `special-build.ts`, `dresspheres/special/*.ts` (ladders), `battle/ffx2/adapt/game-ids-special.ts`; fixture `tests/fixtures/parity/ffx2/special_rows.json` | every command of the nine parts is the game's own row (kernel `command.bin`, parts from `job.bin`); the earlier trimmed lists are replaced |
| Engine | `battle/ffx2/special/` (`forms`, `stats`, `availability`, `change`, `enter`) and small hooks in `execute.ts`, `menu.ts`, `engine.ts`, `setup.ts`, `adapt/*.ts` | the Special Dress Up through the real garment-grid path, three-part actors, every command, the form's end. **Switch: `Ffx2EngineOptions.specialDressUp` (`constants.ts#SPECIAL_DRESS_UP = false`).** With it off no chapter reaches any of it |
| Tests | `tests/unit/ffx2-special-dress-up.test.ts` (15), `data-ffx2-special-rows.test.ts` (7), `chapters/farplane-cup-specials.test.ts` (9), helpers `specialDrive.ts`, `farplaneCupSpecials.ts` | section 4 |

## 2. How to turn it on (a run or a test; no build does)

```ts
new FFX2Engine(ffx2Options({ specialDressUp: true }))
```

The menu then offers, to a girl who has worn every dressphere of her real Garment Grid this battle (the ordinary Change rows are the walk) and owns her Special, a `spherechange` row with `extra.specialDressUp = true` (the shape the wheel's own R1 command already sends). Entering follows the game's rules (`research/re-ffx2-special-dresspheres.md` sections 2, 3, 6): her marks wiped and her place kept, accessories set aside, the Special's growth rows with her grid's node count for the main body and plate 0 (6 nodes) for the two pods, Ribbon wards (Eject among them, by the game's own row), Auto-Life once, the other two girls out of the field (`removed`, `aiMemory.sdspParked`), `state.activeIds` = the three parts. **A part is a normal party unit**: its menu lists the commands of its own ladder, its gauge is its own (slots 3 to 8, the pods' child records), a KO'd pod can be raised by Revival, All-Life or Reboot.

The form ends by the girl's one Change row (back to the dress she stood on) or when her main body falls while a pod stands (she comes back knocked out in her old dress; the pods go; the others return). All three parts down is a defeat.

The portrait hook that already exists (`engine/BigMoves.ts`, lane `ui-marker-portraits`) rides the real events now: the entry emits the `spherechange` event with `special`, and the three finishers are the ability ids it names (pinned in `ffx2-special-dress-up.test.ts` with the real engine's event).

## 3. Picks, with the alternative of each (the driver's calls; Bailey's to overturn)

The full table is `research/re-ffx2-special-dresspheres.md` section 10. The ones that move play:

| Pick | Alternative |
|---|---|
| **A part whose build names no learned list knows only the commands the game lists from the start** (Floral Fallal: Attack, the four Whirls, and each pistil's free commands), no passive; `forms.ts#masteredLearned` gives everything | the whole ladder and Double and Triple HP (x3 HP) for every part: far stronger than any early chapter's party |
| The game's stat scale `(nodes + 25) / 25` (main: her grid's node count; pods: 6 nodes, x1.24) | the community's unscaled rows (one constant; the open question of the research note section 5) |
| A fallen main body ends the form if a pod still stands | the form persists until all three are down (the exe's evaluation as read) |
| Auto-Life once on each part | none (two community sources; the row keeps no status) |
| Pods start at full HP and MP at each entry | unknown in the game |
| One Change row inside a form (the dress she stood on) | the full grid scene's choices (not traced) |
| The walk after a form is empty (kernel mode 2 does nothing) | her worn dress counted as visited |

## 4. Evidence (rule 3: the engine was run)

* **Entry through the real path** (Chapter IV, seeded): each of the three girls walks her real grid by the Change rows (4 to 5 Changes), is offered the row only then, and puts it on. The numbers checked against the kernel (Floral Fallal Lv 23 on a 5-node grid: HP 2,155, pods 1,499; the research note's worked example Lv 20 on 6 nodes: HP 1,971, MP 225). Rikku's and Paine's Specials are in Chapter IV's bag for Rikku only; **Paine's Full Throttle is added to her bag as a rig in that test** (the build gives it to her in Chapter V and the Cup).
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
* House rule 7: every file under 400 lines (`internal.ts` 399, `engine.ts` 395).

## 6. What waits for Bailey, and what comes after his pick

1. **The pick of the look** (the three cards; decision 92d): A the game's own reading (three bodies in the party slots, the main in the middle, two floating pods), B the Ink and Gold cut-in (the girl rides her Special, pods are gold-tethered satellites, one wide plate), C the held tableau (the girl dissolves, the three party slots keep their places, pods are girl-sized spirits, the HUD rows do not move). After his pick: write it as the target in `docs/target/targets.json` with the liked / disliked / must-remain lines, then build the three sprites a Special, the three-part HUD block and the camera beat; **only then** wire the wheel (`ui/ffx2/SpherechangeWheel.ts` still sends the command from the mock screen only) and turn the switch on for the chapters that give a girl her Special (Chapter IV for Yuna and Rikku, V, the Cup and the later hidden ones).
2. **Which chapters get it on** (not decided): the builds name no learned list for a Special, so a switched-on chapter would give the commands from the start only.

## 7. Open issues (none blocks the OFF default)

* **Presenter and art are not built**: a pod's `spriteKey` is its part id (`floral-fallal-right-pistil`, ...) with no painting; the presenter has no layout for a three-part party; the pods' hit-reaction clip lengths (motion-set slots 16 and 17, `data/ffx2/hit-reaction-frames.ts`) are not wired (the engine keeps its 2 s / 3 s chain window on a pod).
* **Key items are not modelled**: Break HP Limit and Break Damage Limit (Aurora Rain, Twilight Rain, Machina Reactor and Booster, Corpus Invictus, Victor Primoris) are never on.
* **Sources not read**: Jegged's and GameFAQs' pages answered this machine's fetch with 403; the FF Wiki (public API), GamerGuides and fan-thread snippets were read. No Ghidra instance was running, so the form's start-up and its main-body-falls code in the exe were not decompiled (research note section 11).
* **A finding outside this lane**: the ordinary accessory Ribbon (a_ability row 103, `0x8067`) wards **Doom** at 255 in the game's own row, while `kit.ts#RIBBON_IMMUNE` lists twelve statuses without Doom (its header says "not Doom"). Not changed here (it would move shipped fights); noted for the driver.
* **The bench bot is simple**: the Machina Maw numbers say more about the bot than about the Special.
* The wheel's own R1 command is still refused by the ordinary change path when the switch is off (`performSpherechange` answers "Not linked"); with it on, `special/change.ts` settles it first.
