# The Pilgrimage (hidden prototype)

Branch `pilgrim-proto`, cut from `origin/r54-rc` (4f4dc77bc), 2026-10-18. **FFX only** for the prototype (every stop is an FFX chapter); the run plumbing around it (`GameFlow` hook, the door, the store) is game-neutral and is both games' shared plumbing. **It ships hidden behind a door word and nothing changes for a player who never types it.**

Source of the decision: Bailey, 2026-10-18, "it needs a really addictive aspect and tighter core gameplay loop"; from the mockups (`D:/Tools/pyrefly-scratch/2026-10-18/pilgrim-mock/`) he picked **"Option 2 + B: branching, boons (Recommended)"** as a **playable prototype only** (decision 122). Rule 10 holds: nothing here is approved as a shipped feature; it is a prototype behind a word.

## What is playable

Type `pilgrim` on chapter select (any case; on a phone, in the long-press field of the "Chapter select" label, which feeds the same matcher). No card, no sound, no sign.

1. **The road** (`pilgrim-route` screen): four stops, two forks. Stop 1 Seymour and Anima (VII) -> stop 2 Evrae (VIII) or Yojimbo (IX) -> stop 3 Seymour Natus (X) or **Mirror Aeons (XXVII, ELITE, pays 2 boons, its own fixed party)** -> stop 4 Braska's Final Aeon (III, the finale). Enter begins; Esc goes back to the board.
2. **Party Prep** of each stop is the real Party Prep with a **RUN tab first** (what the pack holds, what each boon did to the setup, a strip "Pilgrimage fight N of 4" with pips, a chip row for the pack). The tab and the strip show only while a run's fight is up; no other chapter's prep gains a tab.
3. **The fight** is `GameFlow.runChapter` for the stop's chapter, with the shipped record plus the pack's boons in its party. Cutscenes and the results page are skipped; the run's own screens replace them.
4. **After a win** (`pilgrim-boons`): take one of three boons (two after the Elite), then choose the road. Left/Right choose, Enter takes, Up/Down change row, Esc twice leaves. A click or tap on a card takes it.
5. **A loss, leaving, or the finale's win** ends the run: `pilgrim-over` (stops reached, time, boons used, the road as four marks, the chapter's own tip as "why it ended", **Again** / Chapter select). **Quick retry: Again is one press (Enter); the first stop's party prep is next; Enter starts the battle: two key presses from a loss.**
6. **Best run** is kept (see Storage). A run that won nothing is never the best.

Leaving by the pause menu: CHAPTER SELECT / QUIT TO TITLE navigate the flow away from under the run; it is dropped without a word and without a record. RESTART ENCOUNTER ends the run (it is not a free retry) and shows the run-over page as "The road is left".

## The boon pool (10 rows; every one a real FFX item or auto-ability with its source, or labelled NEW)

A boon lasts ONE fight. It is applied by cloning the stop's shipped party build and adding to it, using only inputs the engine already takes (`src/app/pilgrim/applyBoons.ts`). **No engine rule is changed and no boss number is touched; the shipped chapter record is never mutated** (a test runs every boon on every stop and compares the JSON before and after).

| Boon | Kind | What it does to the setup | Source |
|---|---|---|---|
| Light Curtain x2 | item | +2 `light-curtain` in the inventory (Protect to one ally) | `src/data/ffx/items/cures-utility-2.ts`, combat-core 8.2 |
| Lunar Curtain x2 | item | +2 `lunar-curtain` (Shell) | same |
| Star Curtain x2 | item | +2 `star-curtain` (Reflect) | same |
| Healing Spring x2 | item | +2 `healing-spring` (Regen) | same |
| Stamina Tablet | item | +1 `stamina-tablet` (doubles one ally's max HP for the battle) | same (8.2) |
| Mega Phoenix | item | +1 `mega-phoenix` (revives every fallen ally at full HP) | `src/data/ffx/items/restoratives-2.ts`, 8.2 |
| Auto-Haste | auto-ability loan | on the wearer's armour: permanent Haste, immune to Slow | `AutoAbilityId` `auto-haste`, combat-core 9 |
| Auto-Regen | auto-ability loan | permanent Regen, cannot be dispelled | `auto-regen`, combat-core 9 |
| Auto-Phoenix | auto-ability loan | uses a Phoenix Down on a fallen ally | `auto-phoenix`, combat-core 9 |
| **Overdrive charged** | **NEW, ours** | the wearer's starting `overdrive.gauge` = 100 | no FFX item does this; the card says NEW |

**Ours, and marked so on the cards:** the count one pick adds (curtains and springs x2, the rest x1), the preferred wearer lists (Haste: Tidus, Rikku, Wakka, Auron; Regen: Kimahri, Tidus, Auron, Yuna; Phoenix: Auron, Tidus, Kimahri, Yuna; Overdrive: Wakka, Auron, Tidus, Yuna; the first preferred ally on the field wins, else the first ally on the field who lacks it), "the Elite pays 2", the road itself. A full armour (4 of 4, as every Mirror Aeons armour is) gives up its last slot for the loan; it never makes a fifth. A boon nobody can take says so and changes nothing.

The draw is seeded and pure (`drawOffers(seed, pickNo, exclude)`, mulberry32): the same run seed and pick number give the same three. The run seed is `drawRunSeed()` (so `window.__pyrefly.setSeed(n)` pins it); a fight's seed is `run.seed + stop number`.

## Storage: outside SaveData

- **The experiments' key** `pyrefly-reprise:experiments:v1` under the id `pilgrimage`: attempts, clears and best clear time, through that module's own functions.
- **A sibling key** `pyrefly-reprise:pilgrim:v1` (`src/app/pilgrim/runStore.ts`): `{ runs, clears, best, last }`, `best`/`last` = `{ won, reached, cleared, timeMs, boonsUsed, finishedAt }`. Every read and write is in try/catch; corrupt or blocked storage reads as empty.
- **A run in progress is in memory only.** Nothing is written to `pyrefly-reprise:save:v1` by the run's own code: each fight takes its `FlowProgress` from the hook (`NO_PROGRESS`), so a run fight records no attempt, no clear and no best time for the chapter (a boon makes a fight easier; its clear is not the chapter's). `beginExperimentRun()` wraps the whole run so the coach's memory also stays off the save.
- **Disclosed:** the battle screen's existing per-chapter **play-time counter** (`SaveStore.addPlayTime`) still ticks during a run fight, as it does during any chapter. That is the same counter every chapter has, not an attempt, clear or best time; the e2e asserts the chapters of the run have `cleared: false, attempts: 0, bestTimeMs: null`. No file in the save-data class (`SaveData.ts`, schema, migration) is touched.

## How it is wired (the seams, all additive)

- `src/app/screens/frontend/pilgrimDoor.ts`: the word and its key analysis (P, I, L, G unbound; R is `r1`, M is `select`). The row is `RUN_DOORS` in `chapterDoors.ts`, **kept beside `CHAPTER_DOORS`** because `chapter-doors.test.ts` forbids the one-letter overlap `pilgrim`/`mushroom` (a harmless one: the board is shut from the frame the first word finishes). `BoardDoors.isRun(chapter)`. The door settles the board on the first stop's chapter; `ChapterSelectScreen.openDoor` arms the flow (`GameFlow.armPilgrimage`, one line).
- `GameFlow.runChapter`: if armed for that id and the options carry no run hook, it dynamically imports `pilgrim/PilgrimFlow.ts` (so a player who never types the word never fetches the run) and hands it a `PilgrimHost` (closures over `show`, `runChapter`, the hand-over flag). The arm is spent by whatever chapter runs next. `RunChapterOptions.pilgrim` (`PilgrimFightHook`): `playChapter` fights the hook's chapter, takes progress from the hook, and a loss returns with no panel and no retry. `restartCarry.runWithRestarts` does not replay a hooked fight.
- `PartyPrepScreen`: `PrepPanel.visible?(chapter)` and `prepPanelsFor(game, chapter?)`. The RUN tab (`pilgrimPrep.ts`) is `visible` only while `activeRun.ts` holds a fight.
- Files: `src/app/pilgrim/` `route.ts`, `boons.ts`, `applyBoons.ts`, `runState.ts` (pure), `runStore.ts`, `activeRun.ts`, `pilgrimHook.ts` (types), `pilgrimArt.ts`, `pilgrimMarkup.ts` (pure strings), `PilgrimScreens.ts`, `PilgrimFlow.ts`, `pilgrimPrep.ts`, `pilgrim.css`, `pilgrim-prep.css`. All under 400 lines; `PartyPrepScreen.ts` stays at 400 and `ChapterSelectScreen.ts` at 397.

## Tests

- New unit files (54 tests): `tests/unit/pilgrim-run.test.ts` (19: the road is existing FFX chapters in story order; the seeded draw is deterministic and distinct; the state machine; storage outside SaveData), `pilgrim-boons-engine.test.ts` (10: every boon applied to every shipped stop leaves the record untouched; the REAL FFX engine started from a boon'd setup shows Haste/Regen on the wearer, a full gauge, an item stack it spends), `pilgrim-door.test.ts` (14: the word, key bindings with the real `Input`, the title, the real board, the one `m` overlap, the flow arm), `pilgrim-flow.test.ts` (11: the real screens driven through `PilgrimFlow` with a stand-in for the fight: order of fights, boon in the NEXT fight only, the Elite's two, loss, Again with one press, leaving, QUIT TO TITLE, hand-over).
- Related existing suites, 55 files / 988 tests, all green: the door suites (`chapter-doors`, `yojimbo-door`, ... `summon-door`), `frontend-chapter-select-screen`, `party-prep-*`, `ui-ffx-party-prep`, `pause-restart-*`, `flow-*`, `ff7-experiment-records`, `title-near-mask`, `r43-text-floor-css`, and the chapter flow suites.
- e2e `tests/e2e/pilgrim.spec.ts` (real keys, headless Chromium, `PYREFLY_BROWSER=gpu`, 1600x900 and 390x844): title -> board -> `pilgrim` -> road -> RUN-tab prep -> battle -> win -> boon pick (the seed's offers equal `drawOffers`) -> road -> prep names the boon -> battle with **Auto-Regen on Tidus read from the engine** -> loss -> run-over -> Again in two presses; the keys and the save are checked. **Disclosed: the two fights are played by the engine's own auto-play** (`window.__pyrefly.autoBattle`, `intended` to win stop 1, `defend` to lose stop 2) at skip speed; the debug API only starts it and reads state. Run it: `MSYS_NO_PATHCONV=1 BASE_PATH=/ PREVIEW_PORT=5897 PYREFLY_BROWSER=gpu npx playwright test tests/e2e/pilgrim.spec.ts` against `npx vite --port 5897` (Git Bash rewrites `BASE_PATH=/` without `MSYS_NO_PATHCONV`). With watch off, restart the dev server after an edit: it serves its first transform.
- Frames: `docs/screenshots/pilgrim-proto/<w>x<h>-1-route`, `2-prep-first`, `3-boons`, `4-boons-road`, `5-prep-boon`, `6-fight-two`, `7-over` (1600x900 and 390x844). Target and build side by side: the mockups `o2B-a`, `o2B-b`, `o2B-c`, `o2B-d` in `pilgrim-mock/`.

## critic-plan class

`node tools/critic-plan.mjs --paths <the 20 shipped source files>`: **DEEP** review (before deploy a FOCUSED review of the production candidate; after deploy live verification, then the DEEP review on the live build; obligations live + focused + deep; checks CHK-002 003 009 015 016 017 020 021 022). The reason for every `src/app/pilgrim/*` path is "unclassified product path is a shared system": `critic/policy.json` has no row for `src/app/pilgrim/**`, and the touched shared files (`BattleScreenFlow`, `ChapterSelectScreen`, `PartyPrepScreen`, `chapterDoors`, `restartCarry`) are title/chapter-select/prep/pause systems. It is NOT save-data class.

## What is not built (and what is ours, unmeasured)

- No gil, shop, currency or carried build (Model A, the Sphere Grid / Grand Summon picks); only Model B, as picked.
- No FFX-2 hunt, no seven-stop road, no Sin elite, no Flux/Yunalesca/Omnis stops: the picked prototype is four stops.
- No per-stop time estimates on the cards (the mockup's minutes were unmeasured; the repo records no per-chapter fight times), no measured difficulty with and without boons, no win-rate by stop (only Macalania was won by the `intended` auto-play, on seed 7). The Elite's fixed party (S.Lv 150 to 180) is shown on its card; how the boons sit on it is untested beyond the unit test.
- A run in progress is not restored after a reload (memory only, by design).
- The run's screens use the board's chapter-select music; no cue of their own, no SFX for taking a boon beyond `confirm` / `cursor-move`.
- The RUN tab on a 390-wide prep is as small as every other prep tab (the prep is a scaled 640x360 stage; the existing phone page covers the CHAPTER tab only).
- No ledger rows (`DECISIONS.md`, `ACTIONS.md`), no NOW.md and no CHANGELOG entry: the driver records them. No deploy.
