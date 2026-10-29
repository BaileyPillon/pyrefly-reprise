# budgets-2: what the phone waits for before its first command, and the memory a fight leaves behind

Branch `budgets-2` (tree `D:/pyrefly-r39-color`), from `origin/r68-final` `79385a07d` (release 68's last fixes and the three lane merges; `origin/main` is still release 67). 2026-10-29, the driver's lane "budgets-2" (ChatGPT's point 5, `docs/BUDGETS.md` B2a, B3a, B5a to B5c; release 68's focused review, finding R68-B1).
**Game case: both games.** A load, a line and a cache are properties of the page, not of a game (shared plumbing, CHK-020, AGENTS.md rule 14). Chapters I to III are FFX, IV and V FFX-2, the later ones by id prefix `ffx2-`. The two chapters whose HD-2D look is on by default, and so the only two that fetch lighting maps, are Chapter I (FFX) and Chapter IV (FFX-2); every other part of this change reads no rule or number of either game.
Authority: Bailey, 2026-10-28 ~13:00 EDT, "please work on the pose continuity fix and and crtiques for chatgpt i mentioned awhile ago as well as motion fluidity and animation. work on all those. i'll go with all your recommendations and decision-making for the next couple days." Every call below is the sub-agent's under that delegation, the driver's to adopt and Bailey's to overturn.
**Nothing deploys from this branch. No browser, dev server or Playwright was run for it** (release 68's live checks hold the browser in `D:/pyrefly-release55`): the code is proved by unit tests, a mutation check and the offline byte model; the browser jobs are written, self-tested and wait (section 5).

## The short answer

- **The phone's wait is the line, and the load diet did not touch it.** Release 68's focused review timed the phone profile (390 x 844, 10 Mbit/s, CPU x4): the load wait before the boss card was **19.8 s in Chapter I and 42.4 s in Chapter IV against 8 s** (live release 67: 20.1 and 39.2). The wire never rests: 87 MB after the press at 1.25 MB/s is 70 s, and the first command came at 69.5 s. Everything the fight start asks for shares the line with the few megabytes the entry needs, so the entry finishes when the line has drained. The diet changed what the first menu *waits for*, not what is *fetched* or in what order it competes.
- **The cut (section 2, change 2): foreground first on the phone class.** From `BattleScreen.enter` until `PaintedStage.stage` resolves (every figure is built) the lighting maps (17.9 MB in Chapter I, 13.7 in Chapter IV), a figure's later poses and the battle preload's phases 4 and 5 wait; then they start through a ranked queue, eight at a time across every figure, the poses a fight draws first first. **The same bytes in another order**; nothing changes on any other class. Prediction: Chapter I 19.8 s to about 8 s (central; 45 percent chance of 8.0 s or under), Chapter IV 42.4 s to about 12 s. **B2a for the phone in Chapter IV will still FAIL, and B3a (bytes) is untouched: the bytes are the limit** (section 3).
- **The memory a fight leaves behind (change 1).** The same chapter five times in a row is flat; Chapter I and IV alternating climb for eight visits and then plateau (renderer +74 percent over four changes in the candidate, JS heap +7 MB, DOM flat after the FFX-2 HUD fix). The hypothesis, with about even odds: the page keeps the chapter before the one it is playing in two caches built "for a retry" (the decoded paintings, 96 of them; the lighting maps, 56 or 112). A fight is now an epoch; when its stage is disposed what the fight did not touch is dropped, so a retry is as warm as before and the other chapter is not kept. **If the hypothesis is wrong the books say where to look next** (section 5); the FFX HUD is proved flat by a twin of the FFX-2 release test.
- **28 mutations of the new source: 27 killed, 1 equivalent** (section 6); 567 related test files and 7,434 tests pass; `tsc` clean; `node tools/orphans.mjs` the same 24; no source file grew past 400 lines.
- **Review class (`node tools/critic-plan.mjs --paths <the 11 shipped files>`): DEEP**, focused review before a deploy, deep review on the live build (77 checkpoints since the last deep review: the count, not the change). Not the save-data class. Check `npm run critic:status` for the deploy cap (two deploys may go out while a deep review is owed).

## 1. What the evidence says

### 1.1 The phone

Source: `critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-{cand68,r67}.json` (read only), the r68 measuring lanes' `RESULTS.md` and `notes.md`, `docs/handoff/load-diet.md`, the code.

| | Chapter I (FFX) | Chapter IV (FFX-2) |
|---|---|---|
| load wait (entry-load + first-draw), candidate / live r67 | 19.8 s / 20.1 s | 42.4 s / 39.2 s |
| the split, candidate | prep 1.6, scene 39.9, **entry-load 18.3**, first-draw 1.5, card 1.3, sweep 6.4 (total 69.5) | scene 15.9 s of a total of 72.0 |
| wire bytes to the menu / after the press | 93.6 / 87.3 MB (images 69.4, audio 17.7) | 94.0 / 87.8 MB |
| no network limit (phone4x, measuring lane q4) | 4.2 s | 7.6 s (main thread busy 60 to 65 percent) |
| desktop 50 Mbit/s, candidate / r67 | 5.9 s / 6.0 s (110 MB) | 4.4 s / 4.5 s (112 MB) |

- **The line is busy for the whole run.** 87.3 MB at 10 Mbit/s (1.25 MB/s) is 69.8 s; the first command is at 69.5 s. The phone does not wait for 19 MB of "the first menu"; it waits for the transfer.
- **Why the diet did nothing here.** It lets a figure be built once its opening poses are in and streams the rest, but (its own handoff, M2) it does not change what is fetched: the 28 MB of other poses, the 17.9 MB of maps, the board's rest and the audio all still ask for the same 1.25 MB/s, and everything in flight shares the line equally. The entry's own loads (the boss's rig, 109 files; the opening poses of any figure the preload had not finished; the backdrop) get their share of a line that has 100 requests on it.
- **What shares it at the entry, from the code** (`BattleScreenEncounter.enter`): `takeScene`, `createEngine`, then `PaintedStage.stage` builds every figure in parallel (`tryRigFigure` awaits the rig's pieces; `PaintedActor.create` awaits the opening poses and, for the others, up to the 3 s ceiling); the moment a figure exists `prefetchLights` asks for **all of its maps** (40 files in Chapter I) and `loadStreamed` starts **six later poses per figure** (five figures: thirty at once); the battle preload's phase 4 is still downloading the other poses if the pre-battle scene was too short to finish it. Nothing is waited for among those, and all of it shares the line with what is.
- **Why Chapter IV is worse.** Its pre-battle scene is 15.9 s against 35 to 40: it hides about 20 MB of the 94, so the entry begins with the line already behind.

### 1.2 The memory

Source: `chapter-memory-desk50-{cand68,r67}.json` and the measuring lane's controls (`.../r68/measure-ui-budgets/evidence/budgets-extra`, five series), read only.

| series (live r67, desk50, private MB at the boards) | renderer | GPU | DOM nodes | JS heap |
|---|---|---|---|---|
| Chapter I five times | 441 371 392 413 432 | 1156 1696 1784 1421 1728 | 1237 1776 1776 1776 1776 | 24.7 to 28.1 |
| Yunalesca (FFX, no maps) four times | 413 374 408 458 | 1117 1149 1245 1221 | 1203 1220 1220 1220 | 23.2 to 25.3 |
| Chapter IV (FFX-2) five times | 411 357 398 445 495 | 1315 1537 1876 1896 2262 | 1213 1708 2188 2668 3148 | 25.0 to 30.7 |
| Chapter I, IV alternating, eleven boards | 310 433 494 583 646 723 790 781 800 797 820 | 1164 1483 2043 2067 1999 2169 2087 2577 2519 2679 2664 | 1237 to 4291 | 24.6 to 36.4 |
| candidate A B A B A (the review) | 434 440 511 624 700 | 1156 1444 1743 1952 1976 | 1238 1381 1910 1905 1910 | 24.7 to 31.4 |

- **The FFX-2 HUD leak is fixed** (DOM flat from the third board at 1905 to 1910 against 2,337 to 2,822 and rising); it was not the cause of the renderer's and the GPU's climb, which is about the same in the candidate as in live release 67.
- **JS is flat and the DOM is flat, so what grows is native**: decoded images and canvases, textures, decoded audio, driver pools. Chapter I five times is flat (the second visit finds its own set); the two chapters alternating climb for eight visits and then flatten at 800 MB (renderer) and 2.7 GB (GPU). That is the shape of caches filling to their caps with the working set of **two** chapters, not of a per-visit leak.
- **The two caches, from the code.** `PaintedArtCache`: 96 paintings or 900 MB, the intent in its own comment "the chapter being played plus roughly the last two, a retry's worth" (Chapter I has 48 pose files and Chapter IV 43 by the offline model, so both fit under 96). `FigureRelight`: 56 maps, 112 while a figure pins one, evicting **one map per load** (Chapter I has 40 maps, Chapter IV 28). Music (`MusicLoader.evict`, 3 cues), the governor (disposed with the stage), the stage, the actors, the scene (`scene.dispose` frees backdrop, geometry, materials, particles) and the listeners (a scan of 61 global-target listeners and 228 module-scope collections found nothing written and never cleared) are disposed or bounded.
- **What the memory work cannot see without a browser:** the GPU process is a high-water mark (its freed memory returns to the driver's pools slowly), `chrome` decodes images lazily and discards them under pressure, and the "private" numbers are Windows' accounting. The predictions are therefore loose on the GPU (section 4).

## 2. What changed (two commits, tests that fail without each change)

| # | Change | Files | Switch |
|---|---|---|---|
| 1 | **Leaving a fight lets go of what it did not use.** A fight is a numbered epoch (`LeaveRelease.beginFight` in `BattleScreenEncounter.enter`); `PaintedArtCache.cachedPainting` and `FigureRelight` (`prefetchRelight`, `bindRelight`, `fetchMap`) stamp what they are asked for with it. `BattleScreen.releaseParts`, once the stage is disposed and its figures have let go of their pins, calls `endFight`: `dropPaintingsBefore` drops the paintings the fight did not touch (a painting still being made is forgotten and not kept when it lands); `releaseRelightBefore` disposes the unpinned maps it did not touch (one that arrives after its release is disposed on arrival); `bindEyeCandyScene(null)` lets go of the last diorama's Scene object (it was held until the next battle bound another). The chapter just left keeps all it used, so a retry is as warm as before. An `enter()` overtaken before its stage was built judges nothing; the demo keeps everything | `src/engine/LeaveRelease.ts` (new), `PaintedArtCache.ts`, `look/relight/FigureRelight.ts`, `BattleScreen.ts`, `BattleScreenEncounter.ts`, `debug/artApi.ts` | `?memrelease=off` is release 68 |
| 2 | **Foreground first on the phone class.** `LoadHold.holdBackground()` at the top of `enter()`; `releaseBackground()` right after `PaintedStage.stage` resolves, or when the screen is torn down, or after two minutes (a backstop: a slow line's entry waits as long as its opening poses take). While held: `prefetchLights` defers (once per figure) and asks, at the opening, for every pose's map in need order; `loadStreamed` builds the figure with its opening poses at once (no 3 s ceiling to sit out) and asks for each later pose at the opening; the preload's phase 4 and 5 start nothing. At the opening the later poses and the maps start through `BackgroundQueue` (`LATE_WIDTH` 8 across every figure; a pose is ranked `2 x need`, a map `2 x need + 1`; `LoadDiet.poseNeed`), a slot is given up after 15 s, the pump is picked in a microtask so everything asked for in one turn competes by rank, and a map released before its turn is never asked for. A pose map being drawn (`bindRelight`) still asks at once. `EntryMarks` leaves `performance.mark`s (`pyrefly:enter:begin, scene, engine, stage, hud, shaders, shown`) so the browser job can say what the lump of entry-load is made of. Off the phone class `queued()` is the task itself and every other line is as before | `src/engine/LoadHold.ts`, `BackgroundQueue.ts`, `EntryMarks.ts` (new), `PoseStream.ts`, `PaintedActorPoses.ts`, `battlePreload.ts`, `look/relight/FigureRelight.ts`, `BattleScreenEncounter.ts`, `BattleScreen.ts` | `?phonediet=off` is release 68; `?phonediet=on` holds on any class (a desktop A/B) |
| 3 | **The probe.** `__pyrefly.art.stats()` carries `memory` (`paintings`, `paintingMB`, `relight` {maps, textures, pinned}, `last`), `hold` (the phone hold's books and the queue's in-flight and waiting) and `gl` (three's geometries, textures and linked programs). This is BUDGETS section 7 item 1 (the painting cache had no accessor) | `debug/artApi.ts` | |

**Why the release point is after `stage`, not when the field is shown** (the first version of change 2 did that; the second commit moved it): what is left of the entry after the figures exist is the HUD, `warmShaders` (1.5 to 3 s of CPU and GPU) and the swirl; the line is idle through all of it, and the card (1.3 s) and the opening sweep (6.1 to 6.6 s) give the later poses and the maps that much more before the first command.

**What a player can see** (AGENTS.md rule 9; the call is delegated and flagged in section 8, question 1): on the phone class and a slow line the figures are drawn without their lighting for the first seconds (the maps of the idle and ready poses are the first to start; on a 10 Mbit/s line they land within about two to three seconds of the release), and a move whose own painting has not landed draws its fallback painting (the load diet's cost, unchanged). Nothing else: not the desktop, not the tablet class, not a line fast enough that the queue drains before the card.

## 3. What this does not do (said plainly)

- **B3a (50 MB to the first menu on a phone) stays FAILED.** The bytes are the same in another order; the first menu comes earlier on a line that is busy the whole time, so fewer bytes have crossed it by then (0.8 to 0.95 expected), not 50. The lever on the bytes is the half-size phone derivative of the 1x set (`load-diet.md` section 5; a phone shows a figure at most ~600 device pixels tall and fetches ~1,200): a third of the bytes, a new kind of tier and a picture to approve. **It needs Bailey's yes** (rule 10) and is not built.
- **B2a for the phone in Chapter IV will not reach 8 s by ordering alone** (about a 15 percent chance): 19 MB of the entry (15 s of line) against a 16 s scene, plus 7.6 s of CPU. Chapter I may (central 8 s).
- **The desktop's B2a is not touched** (5.9 s and 4.4 s against 5.0 s at 50 Mbit/s: the line is not the limit there, the scene hides 250 MB; it is the entry's work floor, `post-fight-start.md`: 2.1 to 5.2 s bimodal). The brief said without changing the desktop.
- **The boss rig's normal pieces are still awaited at the rig's load** (`RigFigure.load(..., normals)`); the offline model's 17.9 MB of "maps" counts pose maps only, so the rig's lighting pieces are an unknown share of the 16.8 MB G4 saw at the entry. Deferring them is a second change of the same kind (open question 4).
- **Audio is not touched** (rule 13: Bailey's ear): 17.7 MB after the press, of which the SFX sprites (8.2 MB) are not needed by the first command.
- **The memory change is a hypothesis.** It removes what the code shows is kept for the wrong chapter; whether that is the climb is the first thing the job measures (B5a-02 and B5a-04, about even odds).
- **A KO in the first seconds of a very slow line** still lies down in its standing painting until revived (the load diet's open item); the ranked queue starts `ko` with the everyday moves (need 1), as the load diet's review fix ordered it.

## 4. The predictions (written before any measurement; `jobs/b2-predictions.json`, 34 of them, 14 informative)

| ID | Run | Metric | Expected | Why |
|---|---|---|---|---|
| B2a-02 | phone10, scene read, Chapter I, new order | load wait (median of 3) | 4.5 to 12 s (central 8; about 45 percent chance of 8.0 s or under) | 17.9 MB of maps (14 s of line) no longer share the line with the rig (about 7 MB with its lighting pieces); the CPU is 4.2 s |
| B2a-03 | the same, old minus new | load wait | at least 5 s | |
| B2a-05 | phone10, Chapter IV, new order | load wait | 8 to 22 s (central 12; ~15 percent chance of 8 s or under) | 15.2 MB in by the end of a 16 s scene; rig 3 s; CPU 7.6 s partly overlapped |
| B2a-06 | the same, old minus new | load wait | at least 12 s | |
| B2a-07, -08 | desk50, both chapters, both arms | load wait | within 1.0 s of each other | the hold never engages on a desktop class |
| B3a-02, -03 | phone10, new / old | wire MB to the menu | 0.70 to 1.02 (Chapter I), 0.55 to 1.02 (Chapter IV) | the menu comes earlier on a busy line |
| B3a-04 | phone10, Chapter IV, new | wire MB to the menu | 50 to 95 | B3a stays FAILED; under 50 would be good news and a wrong handoff |
| B3a-05 | desk50 | new / old | 0.97 to 1.03 | untouched |
| B5a-02 | desk50, A B A B A, new | renderer growth, battle 1 to battle 5 | -5 to +25 percent | THE HYPOTHESIS; old arm +45 to +95 (B5a-01, informative) |
| B5a-04 | the same | renderer + GPU growth at the boards, board 1 to 5 | -5 to +40 percent | the GPU is a high-water mark; old arm +35 to +95 (informative) |
| B5a-05 | the same | old minus new, points | at least 15 | |
| B5a-06, -08, -09 | the books | paintings 40 to 60, maps 30 to 45, the last exit released 38 to 52 | | the chapter just left, nothing else |
| B5b-01 | the same | JS heap growth | -3 to +12 MB | 6.8 MB in the candidate; the release must not add |
| B5c-01, -02 | the same | tree peak | 2,400 to 3,500 MB; new minus old at most 150 | a fight holds the chapter before as well as its own until it ends: the peak is not lowered, the baseline stops climbing |
| B5x-01..-04 | attribution | gl textures and programs growth, decoded music at board 5, phone page growth | informative | which of them grows with the visits |

## 5. The job specs

`D:/Tools/pyrefly-scratch/2026-10-29/budgets-2/jobs/` (outside git; `README.md`, `queue.json`, `b2-predictions.json`, `judge-b2.mjs`, `selftest.mjs`: 186 checks pass; `first-command.mjs` and `chapter-memory.mjs` are the budgets lane's J2 and J4 as patched by the measuring lane (the fix of F6: Chromium's "GPU" process was counted as "other", so every "page" number was the renderer alone), the load-diet lane's `LD_QUERY` and request log, and this lane's `make-b2-jobs.mjs`: entry marks, the books, `LD_QUERY` for the memory job; every replacement asserted). The candidate is built lean and served over the live artifact's art (port 5612, read only), **all arms one build**, the arm the address word.

| entry | minutes | what |
|---|---|---|
| b2-1 | 8 | phone10, scene read, Chapter I, `old` (`&phonediet=off`) and `new`, 3 runs each |
| b2-2 | 8 | the same, Chapter IV |
| b2-3 | 5 | the scene held (nothing hides the line), Chapter I, 2 runs each |
| b2-4 | 8 | desk50, both chapters, both arms, 2 runs: the desktop must not move |
| b2-5 | 8 | desk50 A B A B A, three arms: `old` (`&memrelease=off&phonediet=off`), `new`, `memonly` (`&phonediet=off`) |
| b2-6 | 6 | the repeat of `old` and `new` (the renderer moves 150 MB from run to run) |
| b2-7 | 6 | the phone profile's A B A B A (informative; a desktop GPU's accounting of a phone-sized page) |
| b2-8 | 5 | **by eye**, a person: the first 20 s from the first menu on the phone profile, new order: how long until every figure is lit, whether the light arrives as a flash, whether a move drew the idle painting |

**If B5a misses**, the order to look in (`jobs/README.md`): (1) `memory.paintings` and `memory.relight.maps` at the boards are the expected numbers (49 and 40 for Chapter I in the new arm, 85 to 96 and 56 or more in the old) and `memory.last` is not null (it is null when `endFight` never ran); (2) `gl.textures`, `gl.geometries`, `gl.programs` grow per visit: a three-level leak, find the owner by the delta of one visit; (3) `audio.cachedTracks` above 3; (4) all flat and the processes still climb: the browser is holding it (decoded-image and canvas caches, GPU pools), not the page: `performance.measureUserAgentSpecificMemory()` at the boards and `renderer.forceContextLoss()` at the board as a control; (5) `memonly` against `new`.

## 6. Tests and checks run

- `tests/unit/leave-release.test.ts` (11): the painting cache by fight (what the fight did not ask for goes, a hit re-stamps, a painting still being made is not kept, a miss leaves nothing), the lighting-map cache by fight (unpinned and untouched maps are disposed, a pinned one never, a bound map counts as used, a map that arrives after its release is disposed), `beginFight`/`endFight` end to end, `?memrelease=off`, the demo's keep.
- `tests/unit/load-hold.test.ts` (15), `load-hold-preload.test.ts` (6, both chapters), `background-queue.test.ts` (10): who is held (the phone class, a desktop class not, `?phonediet=off|on`), the hold's life (once per owner, in order, the ceiling, a retry holds again), the maps of a real `PaintedActor` (none while held, every pose once at the opening, the opening poses first, nothing for a disposed figure), `loadStreamed` (back at once with its opening poses, nothing late until the opening, need order, the window, a gone figure never asked), the preload's phases 4 and 5, the queue (rank, width, rejection, hung slot, width change, two figures across the whole phone, forty-five maps in need order eight at a time, a released map never asked).
- `tests/unit/battle-screen-cycles.test.ts` (5): the REAL `BattleScreen` (`enter`, `exit`, `releaseParts`) five times, A B A B A, with the real caches, the window listeners, the eye-candy binding and the hold read after every exit: the caches hold the chapter just left and nothing else (12 and 12 every time), listeners balanced, the scene unbound, the hold open; the `?memrelease=off` control shows the release 68 growth (12, 24, 24, 24, 24); a retry finds its set warm; an `enter()` overtaken before its stage was built judges nothing.
- `tests/unit/ffx-hud-release.test.ts` (4): the FFX HUD, the twin of `ffx2-hud-release.test.ts`: five visits with a menu open, answered or absent leave the `window` and `document` listener count flat and the HUD's root collectable. FFX was flat in the browser; this keeps it so.
- **Mutation check** (`budgets-2/mutate.mjs`, log `mutate.log`): 28 mutations of the new source (the release, the stamps, the pins, the late-map guard, the unbinding, the hold's deferral, its ceiling, the stream's two changes, the preload's gate, the screen's calls, the actor's order, the queue's rank, width, slot and pump, the maps' and poses' routing), the new tests must fail on each: 27 killed; the survivor (a disposed figure still asking at the opening) is an equivalent mutant, because `PaintedActor.dispose` clears the pose map. The source is restored byte for byte after each.
- `npx tsc --noEmit` clean; `node tools/orphans.mjs` 24 as before; line counts: `PaintedActorPoses.ts` 391, `BattleScreenEncounter.ts` 380, `battlePreload.ts` 311, every other file touched or new under 260, none grew past 400.
- 567 test files and 7,434 tests related to the changed files pass (`npx vitest related ...`); the full suite was not run here (the driver's pass).
- Scans (scratch `scan-modstate.mjs`, `scan-listeners.mjs`): 228 module-scope collections, three written and never cleared (a screen's panel list and two static data tables); 61 listeners on `window` or `document`, eight without a matching remove in the same file (one-time installs, or removed in another file); none is a per-visit retainer.

## 7. Files

New: `src/engine/LeaveRelease.ts`, `LoadHold.ts`, `BackgroundQueue.ts`, `EntryMarks.ts`; `tests/unit/leave-release.test.ts`, `load-hold.test.ts`, `load-hold-preload.test.ts`, `background-queue.test.ts`, `battle-screen-cycles.test.ts`, `ffx-hud-release.test.ts`; this note.
Changed: `src/engine/PaintedArtCache.ts`, `look/relight/FigureRelight.ts`, `PoseStream.ts`, `PaintedActorPoses.ts`, `src/app/screens/battlePreload.ts`, `BattleScreen.ts`, `BattleScreenEncounter.ts`, `src/debug/artApi.ts`, `docs/DEV.md`, `docs/BUDGETS.md` (section 8), `docs/CONTRACT-CHANGES.md`.
Commits: `2f7162cd8` (the release, the hold, the probe, the tests), `2bd0252df` (the ranked queue and the release point), and the records on top.

## 8. Open questions for the driver (and Bailey)

1. **The look call (AGENTS.md rule 9), delegated:** on a phone and a slow line the HD-2D lighting of Chapters I and IV arrives after the entry instead of with it. The order is the poses a fight draws first. Keep it (the speed comes from it), or hold the maps' release until the card is up? The by-eye entry b2-8 is how it is judged; nothing decides it but a look.
2. **The half-size phone derivative** (B3a, `load-diet.md` section 5): Bailey's yes, or B3a restated for the phone (60 to 90 MB with the board; or "art the first menu waits for").
3. **B2a for the phone at 8 s:** Chapter IV cannot reach it at 10 Mbit/s with a 16 s scene by ordering; restate per line and scene length, or accept the derivative.
4. **The boss rig's normal pieces** (awaited at the rig's load): defer them behind the entry on the phone class? A change to `RigFigure.load`, its own risk.
5. **Ship in release 68?** DEEP class, 77 checkpoints owed; two deploys may go out while a deep review is owed. My recommendation: the memory release (change 1) is small, switchable and proved by the cycle tests; the hold (change 2) changes the order of every phone fight start and should wait for the b2-1 to b2-4 numbers and the by-eye look, i.e. release 69.
6. **The kill switches** (`?memrelease=off`, `?phonediet=off|on`): names and defaults as built; a deploy that wants either off for everyone is one line (`LeaveRelease.memRelease()` or `LoadHold.foregroundFirst()` returning false).
7. **The desktop's B2a** (5.9 s and 4.4 s against 5.0 s) is the entry's work floor, not the line; a separate item if the 5.0 s stays.

## 9. Paste-ready CHANGELOG lines (both games; not shipped)

- **Both games: leaving a battle no longer keeps the chapter before it in memory.** The decoded paintings and the lighting maps of the chapter you were not playing are let go when a fight ends; the one you just left stays warm for a retry (`?memrelease=off` brings the old behaviour back).
- **Both games, on a phone: the battle's entry gets the line to itself.** The figures' lighting maps and later poses start once every figure is built, in the order a fight draws them, instead of sharing the line with the files the entry needs; the same files arrive. On a 10 Mbit/s line the lighting may arrive a few seconds after the first frame (`?phonediet=off` brings the old order back).
