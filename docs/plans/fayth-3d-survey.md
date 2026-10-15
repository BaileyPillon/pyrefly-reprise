# Fayth 3D: architecture survey for a hidden Evrae chapter with a 3D presentation

Read-only survey for the main session, 2026-10-10. Base: `origin/rel-3944` = `3d71c216edd18e6f2159bde35dafd2e5c1540986`.
Every claim carries `path:line` in that tree. "Memory" means a memory note (it may be stale); "not read" marks what this survey did not open.
Nothing was built, run, committed or installed (no npm, vite, Playwright or tsc). Nothing here is a decision.

Bailey, 2026-10-10 ~15:00 EDT, verbatim: "decompile all ffx art and assets as well as camera perspective and camera angles changes during battle then add an experimental new chapter with this 3d presentation of an encounter we already have in game. add as a new experimental chapter please that is hidden. with a code word i need to type in at the chapter select menu please."
His picks (~15:15): one chapter; on his PC it loads the real FFX 3D models and stage from a local folder outside the repo; on the website the same chapter and camera use our painted art; encounter Evrae; word `fayth`.

---

## 0. The worktree, the base, the keep list

| | |
|---|---|
| Worktree | `D:/Final Fantasy/.claude/worktrees/fayth-3d` (sparse: `/*` and `!/docs/screenshots/`) |
| Branch | `fayth-3d`, no upstream (`--no-track`), nothing committed, tree clean |
| Base | `origin/rel-3944` `3d71c216edd18e6f2159bde35dafd2e5c1540986` ("Merge origin/ch-gui (c9960b34) into rel-3944"). Created on `origin/main` `8e16a4aa2c197ae4d478d41e89f14d2344ab3c6d`, then `git merge --ff-only origin/rel-3944` (44 commits; main is an ancestor; the local branch `rel-3944` in `D:/pyrefly-r39-int` is at the same sha, 0 ahead and 0 behind origin) |
| Main tree's local `main` | `157562f8be98d723730859db4f5eed62fe17f63b`, 223 commits behind `origin/main`, none ahead. Not used |
| Keep list | `D:\Tools\disk-cleanup\keep.txt`, one line appended: `fayth-3d` (now line 15; the 423 existing bytes are unchanged, 433 now). The matcher is `$name -like $k` on the folder's name (`D:\Tools\disk-cleanup\common.ps1:156`) and on every path segment (`d-make-space-lib.ps1:1357`). The folder was already protected by the built-in rule (`common.ps1:16` regex `\\Final Fantasy(\\|$)`; `d-never.txt:5-6`), so the line is belt and braces |
| Missing from the worktree | `node_modules` and `public/art` (both untracked; `AGENTS.md:83` "`public/art/` never goes to `main`"). No junction was created. Memory `pyrefly-worktree-tooling.md`: run `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit` and `node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run <file>` by path, never `npx`; three test files fail in a worktree for lack of art (`ui-portrait-face-crop`, `chapter-meta`, `party-face-manifest`); any junction must be unlinked with `cmd /c rmdir` before a worktree is ever removed |

---

## 1. Code words at chapter select

### 1.1 Where typed input is captured, and how a word opens a chapter

- **One screen owns every door.** `src/app/screens/ChapterSelectScreen.ts`. Fields: `door = new SecretDoor()` (FF7's "limit"), `leblancDoor`, `experimentDoor`, `mushroomDoor` (all `WordDoor`), `wordKey`, `opening` (`:97-102`). `enter()` builds the board with `buildChapterTiles(this.app.save)` (`:118`) and calls `armDoor()` (`:137`); `exit()` calls `disarmDoor()` (`:149`).
- **Capture.** `armDoor()` creates fresh door objects on every visit (`:295-297`) and adds a `keydown` listener on `window` (`:298`; removed at `:304`). A fresh object per visit means no letter, tap or progress survives leaving the board.
- **Feed.** `onDoorKey` (`:309-317`) ignores auto-repeat, Ctrl/Meta/Alt chords, and anything while `confirming` or `opening` (`:310`); it feeds the same `KeyboardEvent.key` and one timestamp to each door (`:311-315`). When a word completes it sets `this.opening = <chapter id>` (`:313-315`). `:316` sets `wordKey` if any word door's last letter extended a live match.
- **The matcher.** `src/app/screens/frontend/secretDoor.ts`: `WordDoor` (`:104-130`) over `SequenceMatcher` (`:52-87`). One character is lower-cased and fed (`:116`); the gap limit is `KEY_GAP_MS = 2000` (`:37`); a wrong letter resets, but a wrong letter equal to the word's first letter restarts at 1 (`:70`); Shift, CapsLock and the other typing aids neither add a letter nor break the word (`:94-97`, `:117`); any other non-character key (arrow, Enter, Escape) resets (`:118`). `WordDoor.continued` (`:123-125`) is true only right after a later letter of a live match, never for the first letter.
- **Opening is one frame later.** `handleInput` (`:157-196`): if `opening` is set it consumes every button (`:164`) and calls `openDoor(id)` (`:159-167`). The reason (`leblancDoor.ts:7-9`, `ChapterSelectScreen.ts:160-161`): the word's last letter can be a bound key (Leblanc's C is START) and party prep would begin the fight on the latched press.
- **A later letter is not a board press.** `:172`: when `wordKey` is set, `left/right/up/down/confirm/cancel` are consumed for that frame (Leblanc's A is `left`, Mushroom's S is `down`: comment at `:101`).
- **openDoor** (`:330-337`): sets `confirming`, calls `onSelect(id)` and `settle(id)`; unlike `confirm()` it never calls `rememberBoardChapter` (`:276` vs `:330-337`; comment `:325-328`). `main.ts:73-89` receives the id and runs `app.runChapter(id, {})`.
- **FF7's other paths** (taps on the "Chapter select" label x7 in 4 s, pad L1 R1 L1 R1 Select) are `SecretDoor` only (`secretDoor.ts:40-46`, `:133-168`; fed at `ChapterSelectScreen.ts:170,320`).

| Word | Constant | Leads to | Door file |
|---|---|---|---|
| `limit` | `secretDoor.ts:34` | `ff7-guard-scorpion` (`ChapterSelectScreen.ts:23`; gated by `ff7ExperimentReady`, `:331`) | `secretDoor.ts` |
| `leblanc` | `leblancDoor.ts:19` | `exp-leblanc` (`:22`) | `leblancDoor.ts` |
| `experiment` | `experimentDoor.ts:25` | `ffx2-masterpiece-theatre` (`:28`) | `experimentDoor.ts` |
| `mushroom` | `mushroomDoor.ts:25` | `sinspawn-gui` (`:28`) | `mushroomDoor.ts` |

### 1.2 How a hidden chapter is registered and "listed" once unlocked

It is never listed. The board has no card for it before or after the word: `buildChapterTiles(save, registries = {})` (`chapterGrid.ts:174-177`) only adds hidden chapters when a caller hands in `registries.experiments` (`:159`, `:194-196`), and only tests do. The door just resolves the board's `done` promise with the id and the flow takes over. The record is found by `getChapter(id)` (`encounters.ts:394-396`) because it is in `EXPERIMENT_CHAPTERS` (`encounters.ts:356`, built by `chapters-experiments.ts:24-26`).

### 1.3 Does the unlock persist, and is it save-data class?

- **The unlock persists nowhere.** "The unlock is not remembered: the word is typed on each visit" (`leblancDoor.ts:8-9`; same in `mushroomDoor.ts:9`, `experimentDoor.ts:9-10`). Test: after opening, `localStorage` has neither `SAVE_KEY` nor `EXPERIMENTS_KEY` (`tests/unit/mushroom-door.test.ts:296-297`).
- **Playing a hidden chapter does not write the save.** `experimental: true` routes everything to the experiments' store, a separate localStorage key `pyrefly-reprise:experiments:v1` (`src/app/experiments/experimentRecords.ts:18`). The flow swaps its progress object: `const save: FlowProgress = chapter.experimental ? experimentProgress : this.app.save` (`BattleScreenFlow.ts:322`; `FlowProgress` `experimentRecords.ts:132-142`). Results skip the save (`ResultsScreen.ts:146-147`), play time goes to the experiment store (`BattleScreen.ts:743`), the board reads best time from it (`ChapterSelectScreen.ts:263`, `chapterGrid.ts:119`), counts exclude experiments (`chapterProgress.ts:52`). The coach's memory is held in RAM during an experiment run (`experimentRun.ts:1-13`, started at `BattleScreenFlow.ts:309`); the standing check is CHK-025 (`critic/CHECKS.md:826-846`).
- **So the change is NOT save-data class**, provided the chapter stays `experimental: true` and nothing touches `src/app/SaveData.ts`, the save schema or migration, or adds a settings row (settings live in the save: `BattleScreen.ts:225-226`). `critic/policy.json:98` (`save-schema`, `"deepBeforeDeploy": true`, match `src/app/SaveData.ts`) is the only class that needs deep evidence before a deploy (`policy.json:42`).

### 1.4 Tests that cover the doors

`tests/unit/ff7-secret-door.test.ts` (limit), `exp-leblanc-door.test.ts` (leblanc), `mushroom-door.test.ts` (mushroom; 548 lines; the model to copy: pure word, every letter proven against the real `Input`, hidden-by-default board, flow into the real `PartyPrepScreen`), `ffx2-experiment-door.test.ts` (experiment), `ff7-hidden-board.test.ts`, plus the board suites `frontend-chapter-select-screen.test.ts` and `frontend-chapter-grid.test.ts`.
**There is no single test over all the words.** The overlap check is per suite and each hard-codes its neighbours: Leblanc's compares only with "limit" (`exp-leblanc-door.test.ts:70-74`); Mushroom's compares `[limit, leblanc, mushroom]` (`mushroom-door.test.ts:65-75`) and does not know "experiment"; Experiment's compares against `[limit, leblanc, 'mushroom']` with the literal pinned in the test, because "its constant is not on this branch" (`ffx2-experiment-door.test.ts:36-37,62-70`). The coordinator's description ("a test checks that no word begins with, ends with or contains another") is true per suite, not over the set of four.

### 1.5 The word `fayth` (computed, not argued)

- Against `limit`, `leblanc`, `mushroom`, `experiment`: no word begins with, ends with or contains another in either direction, and no suffix of one is a prefix of another (checked mechanically).
- Letters against `KEY_MAP` (`src/app/Input.ts:39-73`): **F is `l1`** (`:71`), **A is `left`** (`:45`), Y, T and H are bound to nothing. The first F reaches the board as `l1`, which the board ignores (it answers left, right, up, down, confirm, cancel: `ChapterSelectScreen.ts:174-180`); it starts FF7's pad sequence harmlessly (`secretDoor.ts:46`) and the next token (`left`) resets it (`:70`). The A is claimed by the `wordKey` guard (`:172`), exactly as Leblanc's A is. The last letter H is bound to nothing, so no latched press is left for party prep (cf. `leblancDoor.ts:7-9`), but the `opening` frame still consumes everything.
- Other `KeyH`/`KeyF`/`KeyT` listeners exist (`app/screens/pause/keys.ts:56-60`, `ui/ffx/party-prep/sphereGridHelp.ts:72`, `DemoScene.ts:81`, `ui/ffx2/FFX2HudMockScreen.ts:34`), all on other screens, not the board. The hidden mark key is Backquote (`app/markMoment.ts:25`).
- **Gotcha for the board-text test.** Mushroom's suite asserts the board text does not match `/experiment|EXP\b|gui\b|mushroom/i` (`mushroom-door.test.ts:256`). A copy of that assertion with `/fayth/i` would FAIL: Chapter IX's card says "Cavern of the Stolen Fayth" (`chapter-yojimbo-cavern.ts:2,55`). Assert on the new chapter's id, numeral `EXP` and tile count instead.
- **A fifth door does not fit in `ChapterSelectScreen.ts`.** The file is exactly 399 lines (cap 400, `AGENTS.md:81-82`); lines `:18` and `:297` are already several statements joined to stay under it. A fifth `WordDoor` field, import, `armDoor` line and `onDoorKey` line cannot fit. The natural move is one table-driven module under `frontend/` (`{ word, chapter }[]`, one loop in `armDoor`/`onDoorKey`, one `continued` sweep) plus one test over the whole table. That edit touches `src/app/screens/**` (policy class `front-end-screens`, focused, `critic/policy.json:107`) and all four door suites become the regression net.

---

## 2. The experimental Leblanc chapter as a template (and the two newer hidden chapters)

### 2.1 How a hidden chapter is defined

- **Derived from a listed chapter (Leblanc).** `src/data/chapter-exp-leblanc.ts`: id `'exp-leblanc'` (`:38`); text const (`:41-47`); `experimentalLeblanc(base)` (`:55-64`) spreads Chapter VI's record and overrides `id`, `number: 19` (`:59`), `experimental: true` (`:60`), the text, and `sceneKey: EXP_LEBLANC_SCENE` (`:62`). Everything else is Chapter VI's by reference: `buildRef`, `enemyGroupRef`, `scriptsRef`, `music`, `sensorTexts`, `location`, `thumbnailKey` (`:50-53`). It is a function because a value import of `FFX2_LEBLANC` from `encounters.ts` would be a cycle (`:30-32`); `chapters-experiments.ts:24-26` receives the base as an argument, and `encounters.ts:356` passes it. Evrae's record lives in its own module (`chapter-evrae-airship.ts:48-51`, which imports only the `Chapter` type from `encounters.ts`, plus its data modules), so a derived Evrae record could import `EVRAE_AIRSHIP` directly without a cycle.
- **Stand-alone (Gui, FFX).** `chapter-sinspawn-gui.ts:40-68`: a full `Chapter` with its own build, group, scripts, music (`number: 21` `:43`, `experimental: true` `:44`). Ids live in a no-import module `data/ffx/sinspawn-gui-ids.ts` so the door and the scene name them without the record's graph (`:25`, `mushroomDoor.ts:22`).
- **Stand-alone (Experiment, FFX-2).** `chapter-ffx2-experiment.ts:34` (id), `:48-53` (`number: 20`, `experimental: true`, `sceneKey`).

### 2.2 Its flags, and what "hidden" and "preview-only" really are

- Only one flag exists: `Chapter.experimental?: true` (`encounters.ts:109-110`). "Hidden" is a property of registration: absent from `CHAPTERS` and `CHAPTER_IDS` (`encounters.ts:359-391`), present in `EXPERIMENT_CHAPTERS` (`:356`), excluded by `ListedChapterId` (`:66`), no board tile (section 1.2), numeral `EXP` and eyebrow `EXPERIMENTAL` (`ui/common/roman.ts:15-24`; `ChapterMeta.numeral` includes `'EXP'` at `chapter-meta.ts:99`).
- **"Preview-only" is not a code flag.** No `previewOnly`, `MODE` or `VITE_*` switch exists in `src/` (the only grep hit is a comment about a debug harness, `scenes/leblanc-last-room-painted.ts:33`; the only environment gates are `import.meta.env.DEV` for dev-server conveniences, for example `main.ts:68`, `scenes/evrae-airship-deck.ts:343`). A preview build differs from production only in where it is deployed: a second Worker with no routes (`tools/deploy-host.mjs:71-82`), logged in `preview-deploys.log` (`:167-168`), "no critic obligation, no ledger entry" (`:391-392`). The bundle is identical. Hidden chapters now ship in the live build behind their word (Bailey 2026-10-06, `leblancDoor.ts:4-6`). Memory `preview-deploy-gate-and-resume.md`: `--preview` still needs Bailey's words while deep debt is at the cap.

### 2.3 Scene and art wiring (the Leblanc way)

- Scene `src/scenes/exp-leblanc-last-room.ts:31-54`: Chapter VI's room factory (`makeLeblancLastRoomScene(EXP_LEBLANC_PLATE)`) over its own plate key and an art namespace; registered in two tables of `scenes/index.ts`: the `SCENES` map (`:197-198`) and `SCENE_FACTORIES` (`:280`).
- **Art namespaces** (`src/data/art/artNamespace.ts`): a namespace is a prefix on an art id (`exp-leblanc-yuna-gunner`) plus a scene key of its own (`:22-51`); `ART_NAMESPACES` (`:23`) and `SCENE_ART_NAMESPACE` (`:30-32`) are closed tables. The scene publishes it as `SceneStaging.artNamespace` (`scenes/types.ts:253-257`); the stage prefixes every id it resolves (`BattlePresenterStage.ts:319,641`), the preload does the same (`app/screens/battlePreload.ts:221`), as do the cutscene stage and dialogue (`CutsceneScreen.ts:191-202`). Tooling half: `tools/exp-art-lib.mjs`, `tools/exp-art-table.mjs` (not read).
- Pause metadata: `chapter-meta-exp-leblanc.ts:29-37` spreads Chapter VI's `ChapterMeta` (`numeral: 'EXP'`, own hero art); registered in `UNLISTED_CHAPTER_META` (`chapter-meta.ts:392`), found by `getChapterMeta` (`:395-397`).
- Gui used a stand-alone scene (`scenes/mushroom-rock-road.ts`, `index.ts:231,289`) and the Experiment another (`experiment-grounds.ts`, `index.ts:194,293`).

### 2.4 What a derived record inherits for free

- Advisor and guide are found by game plus a boss id present on the board, not by the running chapter's id: `engine/tactics/lookup.ts:2-20,52-59` (`chapterOnBoard`). The Evrae tactic row (`engine/tactics/index.ts:136`) and guide (`data/guides/evrae.ts:18-20`, `docs/evrae.ts:14-16`) therefore apply to any chapter whose board has Evrae. `CHAPTER_GAME` (`lookup.ts:25-45`) lists the chapters that have a row, not every chapter.
- The story layer: hidden chapters carry `scriptsRef` on the record; `story/registry.ts:73-98` (`STORY_CHAPTERS`, `ChapterKey`) holds the listed eighteen only (see `tests/unit/chapters/experiment-story.test.ts:4`).
- Phase lighting, order widget, range director and the stage hook read engine flags or scene content, not the chapter id (section 3.3).

---

## 3. Evrae: what exists

### 3.1 Identity

Chapter VIII, id `evrae-airship`, number 8, FFX only, listed and playable on the board (`LOCKED_CHAPTER_IDS` is empty, `comingChapters.ts:124-131`). Record `src/data/chapter-evrae-airship.ts:54-85` (id `:55`, game `:56`, number `:57`, `sceneKey: 'evrae-airship-deck'` `:68`, `thumbnailKey` `:69`, `buildRef` `:70`, `enemyGroupRef` `:71`, `scriptsRef` `:72`, music `scene-fahrenheit` / `boss-evrae` / `victory-ffx` `:73-78`, Sensor text `:82-84`). Pause meta `chapter-meta-evrae.ts:44-86` (numeral VIII `:47`, hero art `pause/evrae-chapter-card` `:54`, fallback `portraits/tidus.png` `:55`, three snapshots `:79-83`, focal `tidus` `:84`). Registered at `encounters.ts:43,365,382`.

### 3.2 Data

| What | Where |
|---|---|
| Party | `data/ffx/builds/fahrenheit.ts:348-360`: members tidus, wakka, rikku, lulu, auron, kimahri; `activeSlots` tidus, wakka, rikku; `aeons: []`. Yuna absent by design (`:19-50`) |
| Enemy group | `data/ffx/enemies/evrae.ts:263-274` (`evraeGroup`, id `evrae-airship` `:82`, `canEscape: false`, enemies `[evrae, cid]`, cue `boss-evrae`); Evrae def from `:103` (32,000 HP, `spriteKey 'evrae'`, slot 0); Cid (id `cid`, `untargetable`, `hideHpBar` `:256`, ability `cid-guided-missiles` `:251`, never drawn: `BattleScreenAirship.ts:16-24,84-90`); abilities `data/ffx/enemies/evrae-abilities.ts` |
| AI | `battle/ffx/ai/evrae.ts`, `evrae-rules.ts`, `evrae-counters.ts` |
| Story | `story/scripts/evrae-airship.ts` (mid-battle triggers keyed on combatant id `'evrae'`, `:239-255`; no AI-emitted triggers, `story/registry.ts:135`) |
| Guide / advisor | `data/guides/evrae.ts`, `data/guides/docs/evrae.ts`, `engine/tactics/evrae.ts`, `evrae-quiet.ts`, `airship-orders.ts` |
| Art (read-only listing of the main tree; gitignored) | `public/art/backdrops/evrae-airship-deck.{png,json}` (4.8 MB, 2688x1536 per `evrae-airship-deck.ts:31-32`); `public/art/characters/evrae/` = `idle`, `idle-near`, `idle-far`, `idle@2x`, `idle-far@2x`, `attack`, `breath-charge`, `hurt`, `ko` (`.png` + `.json`); party folders `characters/{tidus,wakka,rikku,lulu,auron,kimahri}/` (poses attack, cast, critical, follow, hurt, idle, idle@2x, item, ko, ready, sleep, victory; Tidus also two Overdrives); no `cid` folder on purpose; `pause/evrae-chapter-card.png` (`chapter-meta-evrae.ts:54`) |
| Research | `research/ffx-evrae-airship.md`; handoffs `docs/handoff/chapter-evrae{,-scene,-engine,-script,-guide,-measure,-music}.md`, `r38-evrae.md` |

### 3.3 Scene, backdrop, billboards and the airship distance mechanic

- **Scene.** `src/scenes/evrae-airship-deck.ts`. A 2688x1536 plate far out at z -45, 90 wide, rolled -11.6 degrees (`BACKDROP` `:54`); the deck and rail are geometry (`evrae-airship-sky.ts`), so there is no floor in the painting (`:31-44`). Rigs: `intro`, `idle`, `action`, `enemy`, `party`, `victory` plus `idle-far`, `action-far`, `enemy-far` (`:70-88`); party slots (Tidus front-centre, Wakka back-left, Rikku back-right, then four reserve spots off-frame left) `:106-114`; enemy slots (Evrae and Cid share one) `:131-134`; staging `holdParty` plus pinned `enemySpots` for `evrae` and `cid` (`:162-168`); published slots `:171-177`; palette `:193-211`. **`makeAirshipDeckScene(plate)` (`:232`) already builds the same deck over any plate key**, falling back to Chapter VIII's painting when a plate is missing (`:280-287`); Sin's two chapters use it, with their own `SCENES` rows and factories (`evrae-airship-sin.ts:65-74`, registered at `scenes/index.ts:214,283`). Chapter VIII's own registration: `index.ts:212-213,282`.
- **The distance mechanic is an engine flag, read by the presentation.** `state.flags['airship.range']` is `'near'` or `'far'` (`battle/ffx/ai/evrae-rules.ts:207`; "only this encounter sets it", `:19`); sibling flags `:208-220`. Cid's two orders are Trigger Commands `pull-back` and `close-in` (`data/ffx/abilities/special-orders-evrae.ts:90-101`; ids `evrae-rules.ts:99-100`; only Tidus and Rikku own them, `:103`; rank 3 is an estimate C-7, `:147`); an order costs the character's turn and runs on Cid's next turn in place of a volley (`special-orders-evrae.ts:40-46`). Presentation: `AirshipRangeDirector` (`scenes/evrae-airship-director.ts:84`) is published on the scene group (`attachAirshipRange` `:383`, `airshipRangeDirectorOf` `:391`); `attachAirshipBattle` (`app/screens/BattleScreenAirship.ts:108-158`) finds it by scene content ("finds nothing on any scene but the Fahrenheit's deck and returns null", `:4-7`), binds the battle camera and Evrae's actor, removes Cid's actor (`hideCid`, `:85-90`) and calls `director.sync(state)` each frame. The director swaps the scene's `idle`/`action`/`enemy` rigs for NEAR or FAR sets (`RANGE_STAGING`, `evrae-airship-range.ts:233`, type `AirshipRange` `:44`), fades and moves Evrae between spots and between the `idle-near` set and the `idle-far` painting (`FAR_POSES`, director `:82`), retints key light and haze, and plays a defeat veil (`evrae-airship-fall.ts`). Phase grade for FAR: `engine/phaseCanon.ts:125-129,164` from the same flag. Order UI: `ui/ffx/AirshipOrders.ts` and `AirshipOrderWidget.ts`, keyed on the flag (`AirshipOrders.ts:63`, `FFXBattleHud.ts:175,584`).
- **Billboards.** Evrae and the party are `PaintedActor`s (section 4.2). Evrae's world height is 4.1 (`EVRAE_WORLD_HEIGHT`, `evrae-airship-range.ts:146`); NEAR spot `[2.3, -0.9, -4.7]` (`:153`); party heights Tidus 1.75, Wakka 1.85, Rikku 1.6 (`evrae-airship-deck.ts:144-149`).
- **Keyed on what.** Nothing in the Evrae presentation or HUD tests `chapter.id === 'evrae-airship'`. Every `'evrae-airship'` literal in `src/` is a data row, a registry or the group id: `encounters.ts:62,382`, `story/registry.ts:76,88,135,183`, `engine/tactics/index.ts:136`, `tactics/lookup.ts:33`, the guide ids, `comingChapters.ts:86`, `chapterPlates.ts:150`, `scenes/evrae-airship-debug-battle.ts:65`. A derived chapter that keeps `sceneKey 'evrae-airship-deck'` and the same group inherits the whole mechanic, the order widget, the advisor and the guide with no further registration.
- **Other Evrae-specific code that a new scene key would not inherit:** `scenes/evrae-airship-aspect.ts` (NEAR stands back by window aspect, D-360), `evrae-airship-window.ts`, `evrae-airship-subjects.ts`, `engine/ShotRules.ts:29` (`PHONE_FIT_KEY`), `engine/BattlePresenterDepartures.ts` (Evrae's fall, D-031; keyed by combatant id), `ui/ffx/evraeFarStreakBounds.ts`, `enemyObstacleRect.ts`.

---

## 4. Rendering and cameras

### 4.1 Renderer and scene setup

`src/engine/Renderer.ts`: one `WebGLRenderer` (`antialias:false`, `preserveDrawingBuffer:true`, `NoToneMapping`, PCF soft shadows, `:140-160`); one `PerspectiveCamera(fov 34, aspect, 0.1, 400)` at (0, 3.4, 9) looking at (0, 1.4, 0) (`:176-178`); an `EffectComposer` chain: render (or supersampled) pass, `UnrealBloomPass`, horizontal and vertical tilt-shift, optional SMAA/FXAA, sharpen, a grade pass (`:97-106,180-203`). `BattleScreen.ts:231` loads the scene (`loadScene(chapter.sceneKey, renderer.camera)`), `:249` builds the one `PaintedStage`, `:269` the engine, `:274` stages the combatants, `:276` attaches the stage hook, `:281` mounts the HUD.

### 4.2 How painted billboards are placed

`PaintedStage.add(c)` (`BattlePresenterStage.ts:313-403`): resolves art ids (`artCandidatesFor`, `:319`), computes a world height (`worldHeightFor`, `figureHeight`, `:322-326`), creates `PaintedActor.create({... worldHeight, rim, shadow, turnRing, facing ...})` (`:329-363`), and sets `actor.position` from the scene's slot table, or a pinned spot (`:367-370`). `PaintedActor` (`engine/PaintedActor.ts:440`, 2,090 lines) is a `Group` holding two crossfading `PlaneGeometry(1,1)` meshes with an unlit `ShaderMaterial`, `DoubleSide`, `depthWrite:false` (`:790-811`); the body faces +x for party and -x for enemies (`facingForSide`, `:425-428,740`); mirroring is decided per pose sidecar; an "interim yaw" turns a flat plane toward the other team and answers to the live camera (`:430-434,813-820`). The scene owns no actors; slots are `SceneBuild.partySlots` (seven) and `enemySlots` (`scenes/types.ts:78-85`).

### 4.3 Camera classes and where each is created

| Class | Where | Role |
|---|---|---|
| `PerspectiveCamera` | `Renderer.ts:176` | the one real camera |
| `BattleCamera` | `engine/BattleCamera.ts:38`; created in `scenes/index.ts:352` (`new BattleCamera(camera, { rigs: build.rigs, initial: 'idle' })`) | named rigs (`position`, `lookAt`, `fov`, `sway`; `:5-14`), `snapTo` (`:152`), `moveTo` (`:177`), `addRig` (`:112`), `shake`, `punch`, `push`/`release`, `roll`, idle sway, `restCamera` (`:229`) |
| `PresetCamera` | `engine/CameraPreset.ts:166` | comfort presets `current`, `calm` (default, `:98`), `steady`, `originals` (FFX only: every rig change a cut, no roll or push, `:89-92,128-132`) |
| `StillCamera` | `engine/ComfortCamera.ts:31` | REDUCE MOTION |
| `HoldableCamera` / `FixedCamera` | `engine/TargetFrameHold.ts:56`, `StageFacing.ts:56,74` | FFX-2 hold under a menu; FF7's fixed angle |
| chain | `BattlePresenterStage.ts:178-181`: `stageCamera(new StillCamera(new PresetCamera(battleCamera, preset), still), slots.fixedCamera)` | this chain is the `CameraPort` the presenter holds (`BattlePresenterPorts.ts:81`) |

### 4.4 How a shot is chosen per battle event

`engine/BattleMoments.ts:11` says it is "the only thing that decides which shot": methods `battleStart` (`:256`), `turnStart` (`:348`), `actionOpen` (`:363`), `impact` (`:384`), `actionClose` (`:421`), `overdriveStart/End` (`:434,459`), `telegraph` (`:477`), `formChange` (`:509`), `victory` (`:529`), `moveToRig` (`:215`); rig pick `rigFor` (`:188`) uses the scene's `party`/`enemy`/`action`/`idle` rigs, whichever it publishes (`pick`, `:177`). The presenter calls them from `BattlePresenter.ts:480` and `BattlePresenterBeats.ts:42,74,76,113,164,276,289,308,320,329,361-364`. Framing rules sit in `engine/ShotRules.ts` (`class ShotRules` `:41`, A-11/A-1/A-12, plus `ShotFit.ts`, `FrameFit.ts`, `fx/mix/*`). An enemy's data file can also emit an explicit `camera` event: `BattlePresenterEvents.ts:387` -> `moveToRig(event.rig, event.ms ?? 700)`; cutscene scripts have a `camera(rig)` step (`docs/ARCHITECTURE.md:117`, `docs/CONTRACTS.md:224`; `story/dsl.ts` itself not read).

### 4.5 Per-chapter camera or presentation overrides that already exist

None replaces the camera system; these are the hooks:
1. **Rigs by name.** `SceneBuild.rigs` must publish `intro`, `idle`, `action`, `victory` (`scenes/types.ts:68,301`); extra names are free (Evrae adds `party`, `enemy`, `*-far`).
2. **`SceneBuild.bindCamera(camera)`** (`scenes/types.ts:110`, called from `scenes/index.ts:353`): the scene may re-frame itself mid-battle; Evrae's director does exactly this (`evrae-airship-director.ts:139-142`).
3. **`SceneStaging` switches** (`scenes/types.ts:133-274`): `fixedCamera` (`:208`), `artNamespace` (`:257`), `sideFacing`, `figureLight`, `poseCut`, `enemySpots`, `figureHeights`, `holdParty`, `guideFolded`, ... passed through `stagingOf` (`:277-299`).
4. **The stage hook** `BattleScreenStageHook.ts:19-26`: `attachStageHook(game, loaded, stage, state)` picks FF7's staging or the airship hook by game; this is the one per-location hook in the battle screen (called at `BattleScreen.ts:276`).
5. **Comfort preset** (`?cam=` or `__pyrefly.cam()`), chosen per game (`app/screens/battleCameraComfort.ts:29-31`, wired at `BattleScreen.ts:262`).
6. **Explicit `camera` events** from data and the story DSL (above).
There is no per-chapter `CameraPort` swap: the chain at `BattlePresenterStage.ts:178-181` is built the same for every chapter.

### 4.6 The seams a 3D stage would use (facts only)

`BattlePresenterPorts.ts` imports nothing but battle types (`:1-11`) and defines the two ports the presenter plays against: `ActorHandle` (`:49-71`: `position`, `setPose`, `flash`, `shake`, `lunge`, `recoil`, `squash`, `hop`, `fadeTo`, `setAlpha`, `dissolveTo`, `moveTo`, `setFacing`, `setBrightness`, optional `lieDown`/`setStone`, `centerPoint`, `headPoint`) and `BattleStage` (`:331-386`: `camera`, `vfx`, `actor`, `sideOf`, `staged`, `project`, `setArt`, `addCombatant`, `removeCombatant`, optional `slotOf`, `arrive`, `paints`, `motion`). `PaintedStage` is the only implementation and `BattleScreen.ts:249` the only construction site. `PaintedStage` is 917+ lines and wires billboard-only subsystems to `PaintedActor` internals (contact shadow, rim, `StageArt` masters, `quadOf`/`contentQuad` for motion, head lock, pose scaling): a 3D stage that must keep the HUD working also has to answer `project()` and `projectRect()` (`:433,467`).

### 4.7 Camera-lab branches (read-only listing)

`git branch -a --list "*camera*"`: `camera-lab` (also `origin/camera-lab`, tip `959e5925` 2026-10-03, worktree `D:/pyrefly-camera-lab`), `camera-lab-r39` (also origin, tip `759d9bb4` 2026-10-04, worktree `D:/pyrefly-lab-r39`), `fb2-0929-camera` (also origin, tip `4f9d74f8`, already an ancestor of `rel-3944`). `camera-lab` is 7 commits ahead of and 230 behind `origin/main`; `camera-lab-r39` 10 ahead and 233 behind. Both edit these shared files: `src/app/screens/BattleScreen.ts`, `src/engine/BattleMoments.ts`, `BattlePresenter.ts`, `BattlePresenterBeats.ts`, `BattlePresenterEvents.ts`, `BattlePresenterPorts.ts`, `PaintedActor.ts`, `src/main.ts`, and add `src/engine/lab/*`, `src/ui/lab/*`, `src/lab-entry.ts`. Memory `camera-lab-test-first.md`: when main changes `BattleCamera`, `ComfortCamera`, `ShotRules` or the presenter's camera calls, send the "Game perspective mockups" session a line so the lab can rebase; and do not build the Clair Obscur / Persona grammar into main before Bailey picks. Related standing decision: D-632 (`DECISIONS.md:4977`), "Replicate the real FFX battle camera and its angle switches: go; record the real camera in PCSX2 first, then build two test modes for one chapter and show them side by side with the real game before anything ships (FFX only)"; the PCSX2 camera recording lane started 2026-10-08 22:43 (A-0584) and NOW.md records it as ON HOLD (A-0603). Sourced camera facts: `research/battle-camera-perspectives.md` (FFX camera authored, reframes per action, not player-controlled; no source publishes its parameters).

---

## 5. Asset loading

- **URLs.** `artUrl(path)` (`engine/PaintedArt.ts:96-99`) resolves against the Vite base and then `shippedArtUrl` (`engine/ArtShipped.ts:75-82`): a production build serves each master PNG as a lossless WebP when the build's `__PYREFLY_ART_WEBP__` list says so, and writes `@` as `%40`; `logicalArtUrl` (`:88-94`) is the inverse and anything that reads an art URL back apart must use it first. Character poses `characterUrl(artId, pose)` = `art/characters/<id>/<pose>.png`, backdrops `backdropUrl(sceneKey)` = `art/backdrops/<key>.png` (`BattlePresenterArt.ts:119-131`).
- **A chapter declares its art by convention, not by a list.** Art ids come from the combatants (`artCandidatesFor`, `BattlePresenterArt.ts:114-116`) and the backdrop from `chapter.sceneKey`. `public/art/manifest.json` is generated (`tools/gen/manifest.mjs`, run by `predev` and `prebuild`, `package.json:12-15`) and answers "what exists" (`engine/ArtManifest.ts:1-20`); `battlePreload.ts:206-270` warms the opening frame's files from the engine's opening state.
- **Vite.** `vite.config.ts`: plugins `distFilter`, `pyreflyArtDerive` (build only), `pyreflyArtAtSign` (dev and preview) (`:84`); `PROD_BASE` `/pyrefly-reprise/` unless `BASE_PATH` is set (`:9`; the live site is built with `BASE_PATH=/`); dev server `127.0.0.1:5173`, preview `127.0.0.1:4173` (`:103-110`; DEV.md says 4319); ES2022 target, hidden source maps only when a folder is named (`:85-97`); module worker for the advisor (`:98-102`). Vitest: `vitest.config.ts` (node environment, 15 s timeouts, `tests/unit/**/*.test.ts`).
- **three.js 0.186.0** (`package.json:28`, `@types/three` `:33`). **No glTF or any model loader exists** in `src/`, `tools/` or `tests/` (searched for `GLTFLoader`, `OBJLoader`, `FBXLoader`, `DRACOLoader`, `KTX2Loader`, `.glb`, `.gltf`). `three/addons` is used only for post-processing (`Renderer.ts:15-19`, `crisp/*`, `PostAa.ts`, `fx/*`). The loaders ship inside the `three` package; a dynamic `import()` would keep one out of the main chunk (not tested).
- **Dev-only or local-only mechanisms that exist:** (a) `import.meta.env.DEV` gates (`main.ts:68`; `watchAssets` in every scene, `PaintedArt.ts:542`); (b) a Vite plugin pattern that adds a middleware for both `vite` and `vite preview` and never runs in `vite build`: `tools/vite-art-at.mjs:22-37` (`apply: 'serve'`, `configureServer`, `configurePreviewServer`); (c) `tools/dist-filter.mjs:44-50` prunes working files from `public/` after the build. **Nothing serves a folder from outside the repo**, and `public/` ships whole except what the filter prunes, so anything copied under `public/` would deploy.
- **Where the deploy would notice a stray file:** per `AGENTS.md` ("Release", not re-read in `tools/deploy-pages.mjs`), `npm run deploy` hashes and decode-checks every shipped file (`artifact-manifest.json`) and then compares the live files with the build byte for byte; the site is held to 800,000,000 bytes of shipped files (`tools/dist-filter.mjs:19-24`).
- **No security headers to fight:** `index.html` has no CSP; `tools/cloudflare/wrangler.jsonc:22-33` is an assets-only Worker with no header rules. A page on `https://echoesofspira.com` fetching `http://127.0.0.1:<port>` is a cross-origin request subject to CORS and Chrome's Private Network Access preflight (browser rules, not read in the repo): see question 2 in section 8.

---

## 6. What adding a hidden chapter requires (checklist from the templates)

**Records and registries**
1. `src/data/encounters.ts` (a contract file, `docs/CONTRACTS.md:9`): add the id to `ChapterId` (`:58-63`; add it to the long last line, the file is 396 of 400 lines), exclude it from `ListedChapterId` (`:66`), widen `Chapter.number` to include 22 (`:108`; the union ends at 21). This is additive and needs a note in `docs/CONTRACT-CHANGES.md`, newest first, in the style of the 2026-10-10 Gui entry (`CONTRACT-CHANGES.md:9-26`: heading `## date - title (branch; game case; additive)`, then one bullet per changed contract file).
2. A chapter record module (derived like `experimentalLeblanc`, or stand-alone like `SINSPAWN_GUI`) and its add to the list in `chapters-experiments.ts:24-26` ("not by editing `./encounters.ts`", `:11`).
3. Pause metadata: a `ChapterMeta` (`chapter-meta.ts:96-116`: three objectives, three snapshots, quote, tip, `numeral: 'EXP'`) added to `UNLISTED_CHAPTER_META` (`chapter-meta.ts:392`; file is 397 of 400 lines).
4. The door: a `<word>Door.ts` constant file, and the board wiring (section 1.5).
5. Number: 22. The Experiment (20) and Gui (21) and Leblanc (19) are taken; verified at `chapter-ffx2-experiment.ts:50`, `chapter-sinspawn-gui.ts:43`, `chapter-exp-leblanc.ts:59`.

**Only if the chapter gets a scene key of its own** (a derived chapter that keeps `evrae-airship-deck` needs none of these):
6. `SCENES.set(...)` and `SCENE_FACTORIES[...]` in `scenes/index.ts` (`:128`, `:273-295`; the file is 422 lines, already over the cap), as Sin does (`evrae-airship-sin.ts:65-74`).
7. A `PYREFLY_CANON` row with a research citation: `tests/unit/pyrefly-canon.test.ts:49-57` fails for any registered scene key without one, and for any canon key that is not a scene (`engine/pyreflyCanon.ts:110` is Evrae's row).
8. If it has paintings of its own: an `ART_NAMESPACES` entry and `SCENE_ART_NAMESPACE` row (`artNamespace.ts:23,30-32`), the pose-registration tables (`engine/PoseRegistration.ts:38`), `tools/exp-art-*.mjs` (not read), the art manifest.

**Tests that must change or be added**
- `tests/unit/chapter-numbers.test.ts`: uniqueness over all registered chapters (`:18,21-31`) passes by itself once the number is unique; the by-name test (`:41-46`) and the header comment (`:10`) should name 22.
- `tests/unit/engine/party-stature-chapters.test.ts:41-44`: `HIDDEN_FFX_CHAPTERS` lists the hidden FFX chapters the stature rule reaches; a hidden FFX chapter not listed falls into the "others stay at height 1" loop (`:103-111`) and fails. It also requires `getScene(chapter.sceneKey)` to exist (`:52-56`).
- New: a door suite (copy `mushroom-door.test.ts`), a registration suite (copy `sinspawn-gui-data.test.ts:234-261`: registered with the experiments, not in `CHAPTERS`/`CHAPTER_IDS`, number, `experimental`, meta in `UNLISTED_CHAPTER_META`), and a determinism proof that a derived Evrae plays to the same event log as Chapter VIII (the Leblanc preview did this: `exp-leblanc.test.ts:1-15`).
- Not touched by a hidden chapter: `chapter-meta.test.ts` (listed eighteen), the 18 FFX golden digests (`ffx-engine-golden.test.ts`), the e2e specs (they use `CHAPTER_IDS`), the story registry audits (`CHAPTER_KEYS`).

**Process rules that apply** (`AGENTS.md`)
- Rule 7: every new source file under 400 lines; rule 4: run `node tools/orphans.mjs` after adding a module (a green suite does not catch an unwired module).
- Rule 8: original assets only, no retail Square Enix assets, "`public/art/` never goes to `main`"; `docs/ARCHITECTURE.md:125-127`: "No retail models, textures, audio, fonts or script transcripts are included"; `src/data/ffx/party-stature.ts:15`: "No game file or mesh data is in the repo". The local-model mode needs a recorded Bailey decision and a proof that nothing retail reaches the repo or `dist/`.
- Rule 9 (end state first, "Direction is settled: painted 2.5D"): the 3D presentation is something Bailey will see; D-632 already promised two test modes shown against the real game before anything ships; the Gui and Experiment lanes recorded the waiver as the driver's delegation. Rule 14: write the game case (FFX only) in the plan, handoff and commit. Rule 12: art generation was ON until 10:00 EDT on 2026-10-10 and is OFF now unless Bailey says otherwise (`NOW.md:2`).
- Ledgers: `node tools/decisions-ledger.mjs` (D rows for Bailey's words) and `node tools/actions-ledger.mjs --check` (A rows); CHANGELOG entry; `docs/handoff/NOW.md` and a track handoff.
- Review class (`critic/policy.json`, by path): `src/data/encounters.ts`, `src/data/chapter-meta.ts`, `src/scenes/index.ts` = `chapter-registry`, **deep** (after the deploy unless it is the save class) (`:102`); `src/engine/BattleMoments.ts` and `BattlePresenter*.ts` = `battle-presenter`, **deep** (`:96`); `src/main.ts`, `src/app/Input.ts`, `src/engine/Renderer.ts`, `src/ui/common/**` = `global-layout-input-boot`, **deep** (`:100`); `vite.config.*` and `package.json` = `build-and-delivery`, **deep** (`:103`); `src/engine/PaintedArt.ts`, `BattlePresenterArt.ts`, `ArtManifest.ts` = `asset-loader`, **deep** (`:99`); `src/app/screens/**` = focused (`:107`); `src/engine/BattleCamera.ts` = focused (`:109`); other `src/engine/**` and `src/scenes/**` = focused fallback (`:121`). `AGENTS.md` "Release": at most two deploys while a deep review is owed, and NOW.md records one owed on 931613a8; run `node tools/critic-plan.mjs --paths a,b` before choosing files.

---

## 7. The debug API, for later checks

`window.__pyrefly` (`src/debug/api.ts`, installed in `main.ts:144-147`; `docs/DEV.md:338-452`).
- Open a chapter directly: `await __pyrefly.waitReady(); __pyrefly.setSeed(1); await __pyrefly.gotoChapter(id, { skipCutscenes, skipPrep (default true), seed, auto: 'intended', speed, skipResults })` (`api.ts:399-407`; `GotoChapterOptions` `:30`). It resolves with how the run ended. `gotoChapter(id: ChapterId, ...)` is typed by the `ChapterId` union, so the new id must be in it; it goes through `getChapter`, so hidden chapters work (`chapters-experiments.ts:1-4`). `__pyrefly.chapters()` returns only the listed eighteen (`api.ts:397`). The board's `trigger('select:<id>')` works only for ids that have a board tile (`ChapterSelectScreen.ts:203-214`), so it cannot open a hidden chapter.
- To exercise the door itself, type the word with real key events on the board (that is what the door suites do).
- Screenshots: `__pyrefly.shot(rig?, frames?)` moves the camera to a rig and settles (`api.ts:147`, `DEV.md:426`); `__pyrefly.scenes()` lists scene keys (`:151`); `__pyrefly.snapshotState()`, `battleState()`, `battleLog()`, `autoBattle('intended')`, `setBattleSpeed('skip')`, `waitBattleEnd()` (`DEV.md:351-378`); `__pyrefly.cam(name)` / `?cam=` for the comfort preset; `?arttier=`, `?artscale=`, `?crisp=` pin art and sharpness for captures (`DEV.md:385,409`); `__pyrefly.goto('scene-evrae-airship-deck')` opens the scene alone (`debug/sceneScreens.ts:25,52`).
- Tool: `npm run screenshot -- --url=http://localhost:5173/ --out=docs/screenshots/<name>.png` (`tools/screenshot.mjs`: `--screen=` calls `goto(name)`, `--rig=`, `--frames=`, `--width/--height`); it has no chapter flag, so a chapter capture is a short Playwright script that calls `gotoChapter`. Headless runs on SwiftShader by default and `PYREFLY_BROWSER=gpu` is the 20x faster opt-in (`DEV.md:43-106`); the reviewer rule is headless Playwright from node, never the Claude-in-Chrome extension (memory `feedback-reviewers-headless-only.md`). Stop every server you start (`AGENTS.md`, "Shared working tree").

---

## 8. Seams, and the forks the main session has to decide (not decided here)

**Seams that exist:** (a) `SceneFactory` + `SceneBuild.rigs` + `bindCamera` for a scene that publishes its own camera angles and re-frames itself (the airship director is the working precedent); (b) `makeAirshipDeckScene(plate)` for the same deck over another plate; (c) the `BattleStage`/`ActorHandle` ports for a different stage implementation; (d) `attachStageHook` for a per-location, per-battle hook; (e) the art-namespace mechanism for a separate set of paintings; (f) a dev/preview-only Vite middleware (`vite-art-at.mjs`) or a stand-alone static server for a folder outside the repo.

**Forks:**
1. **One chapter, two presentations: where is the switch?** Because a chapter keeps one `sceneKey`, "painted on the website, 3D on his PC" is either (i) one scene factory that probes for the local models at runtime and returns the painted deck when they are absent, or (ii) two scene keys with the chapter record choosing at load. (i) keeps one registration and degrades by itself; the painted path must stay byte-identical to Chapter VIII's.
2. **Does the 3D mode have to work on the live site in his browser?** If yes, the page fetches `http://127.0.0.1:<port>` cross-origin (CORS and Private Network Access). If it only has to work on his own dev/preview server, same-origin middleware is enough and nothing can leak into a deploy.
3. **Where the camera lives.** The same camera on both sides means the shot table (angles per event) must be data both presentations read; `BattleMoments`/`ShotRules`/`BattlePresenterPorts` are camera-lab-watched and `deep`-class, whereas rigs published by a scene and a `bindCamera` director are not. FFX's camera is not player-controlled and cuts per beat (`research/battle-camera-perspectives.md` section A); D-632 names the A/B test modes. Flat paintings look paper-thin when a real FFX camera swings to the side or behind (`DECISIONS.md:4979`).
4. **Cutscenes.** Pre and post scenes are DOM stages over a 2D backdrop `art/backdrops/<sceneKey>.png` (`CutsceneScreen.ts:173-176`, `backdropKey` override); a 3D stage would keep them on Evrae's painted deck unless 3D cutscene staging is also built.
5. **Resolution at close-ups.** Bailey (2026-10-03, memory `camera-lab-test-first.md`): close-ups "need to be significantly higher res"; Evrae has `idle@2x` and `idle-far@2x` only (listing above), the party mostly `idle@2x`.
6. **Which `Settings`/storage the mode may use.** A setting row in `SaveData.settings` makes the change save-data class (section 1.3); the experiments' store or a key of its own does not.

---

## 9. Risks

1. **Save-data class: avoidable.** Keep `experimental: true`; touch no `SaveData.ts`, no schema, no settings row. Then it is the same class as Gui and the Experiment (deep review after the deploy, `policy.json:102`), not `deepBeforeDeploy`.
2. **Shared contracts.** `src/data/encounters.ts` (a `docs/CONTRACTS.md` file: `ChapterId`, `ListedChapterId`, `Chapter.number`) needs a `docs/CONTRACT-CHANGES.md` entry. `scenes/types.ts` if a new `SceneStaging` switch is added (additive). Ids for CONTRACTS' list `src/data/ffx/ids.ts` only if a new combatant or ability id is created (a derived Evrae creates none).
3. **Camera code the camera-lab session watches.** `BattleCamera.ts`, `ComfortCamera.ts`, `ShotRules.ts`, `BattleMoments.ts`, `BattlePresenter*.ts`, `BattleScreen.ts`, `PaintedActor.ts`, `main.ts` (what the two lab branches modify). Editing any of them means a rebase for the lab and a line to that session (memory); the `deep` classes `battle-presenter` and `global-layout-input-boot` apply. A scene-published rig set plus `bindCamera` and new files under `src/scenes/` or a new `src/engine/` subfolder avoids all of it.
4. **File-size pressure.** `ChapterSelectScreen.ts` 399, `encounters.ts` 396, `chapter-meta.ts` 397 of 400: the fifth door and the registrations must be table-driven or split. `scenes/index.ts` is already 422.
5. **Retail assets (hard rule 8).** The local-model mode is policy-level new: it must live outside the repo and outside `public/`, never reach `dist/` (check `tools/dist-filter.mjs`, the deploy's artifact manifest, `tools/art-*audit*`), never be committed (the repo is public: memory `public-repo-no-pii.md`), and be recorded as a decision. Ledger and docs must not cite retail file contents or paths beyond what the repo already does for research.
6. **Build and delivery class.** Touching `vite.config.ts`, `package.json` or a dependency is `build-and-delivery`, deep. A stand-alone `tools/*.mjs` server plus a runtime probe avoids both.
7. **Painted path regression.** Any change to `PaintedStage`, `PaintedActor`, `BattleMoments` or the shared scene registry can move Chapters I to XVIII; the golden digests, `pyrefly-canon.test.ts`, `party-stature-chapters.test.ts` and the Evrae suites (`tests/unit/chapters/evrae-*.test.ts`) are the net; the continuity checks CHK-026/027 judge pose swaps on the live build.
8. **The word.** `fayth` collides in text, not in typing, with Chapter IX's "Stolen Fayth" (board-text assertions); sound otherwise (section 1.5).
9. **Environment.** The worktree has no `node_modules` and no `public/art`; three art-dependent files fail there by memory; the art listed in section 3.2 exists only in the main tree. Junctions must be unlinked with `cmd /c rmdir` before any worktree removal (memory incident of 2026-09-26). Other agents hold the main tree's uncommitted files; this worktree touched none.
10. **Process.** Rule 9 (mockups before building what Bailey will see), D-632 (two test modes beside the real game), rule 14 (FFX only), and the ledgers; usage mode NORMAL by Bailey's word (`NOW.md:2`, a 2026-10-10 01:50 reading: read it again).

---

## 10. The coordinator's three facts, checked

| Fact | Result |
|---|---|
| Hidden chapters now register in `src/data/chapters-experiments.ts`, not `encounters.ts` | True for the **record**: `chapters-experiments.ts:11,24-26` ("registers here ... not by editing `./encounters.ts`"). `encounters.ts` must still be edited for the `ChapterId` union (`:58-63`), `ListedChapterId` (`:66`) and `Chapter.number` (`:108`), and it exports `EXPERIMENT_CHAPTERS` (`:356`) |
| 19 (exp-leblanc), 20 (the Experiment), 21 (Gui) are taken and pinned by `tests/unit/chapter-numbers.test.ts`; ours will be 22 | Taken: `chapter-exp-leblanc.ts:59`, `chapter-ffx2-experiment.ts:50`, `chapter-sinspawn-gui.ts:43`. The test pins **uniqueness** for every registered chapter (`:18,21-31`) and **by name** only 19 and 21 (`:41-46`; it still says 20 is "reserved to the FFX-2 experiment lane", `:10,41`). The type `Chapter.number` ends at 21 (`encounters.ts:108`), so 22 needs the union widened |
| Door words share a `WordDoor` (limit, leblanc, mushroom, experiment) and a test checks that no word begins with, ends with or contains another | The shared class is true (`secretDoor.ts:104`; board fields `ChapterSelectScreen.ts:97-100`). The test is per suite, not one over four words (section 1.4) |

## 11. Not covered, not verified

`story/dsl.ts` camera step; `tools/exp-art-*.mjs`; the HD/Steam model folders (`D:\Tools\ffx-hd`, `D:\Tools\ffx-parity`) and what was extracted from them; `tools/gen/manifest.mjs` internals; browser CORS/PNA behaviour; whether `three/addons/loaders/GLTFLoader.js` tree-shakes under Vite 8 (rolldown); every `PaintedActor` consumer inside `PaintedStage`; which tests currently pass (nothing was run).
