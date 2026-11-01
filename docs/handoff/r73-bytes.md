# r73-bytes: what a phone's battle entry waits for, and the four things it no longer waits for

Branch `r73-bytes` (tree `D:/pyrefly-rig-valefor`), from `origin/r72` `2f9c91791` (release 72's candidate; live is release 71, `6d7ecc8a5`). 2026-11-01, the driver's lane "r73-bytes" (ChatGPT's point 5; `docs/BUDGETS.md` B2a and B3a; round 32b's finding PR-0567).
**Game case: both games, phone class only.** A request, a line and a wait are properties of the page, not of a game (shared plumbing, CHK-020, AGENTS.md rule 14). The content the cuts move is FFX Chapter I (Seymour Flux's rig, five idle maps) and FFX-2 Chapter IV (Bahamut's rig, four idle maps) plus every chapter's results cues (0.77 MB in FFX, 0.99 MB in FFX-2); no rule or number of either game is read. A desktop, a tablet and a window that is not the phone class are not held and see release 72 byte for byte.
Authority: Bailey, 2026-10-31 ~23:40 EDT, "im going to sleep please keep going. i'll go with all of your recommendations. you make the executive decisions for the next few days." Every call below is the sub-agent's under that delegation, the driver's to adopt and Bailey's to overturn.
**Nothing deploys from this branch. No browser, dev server, Playwright or GPU was run for it**; the code is proved by unit tests, a 23-mutant check and an offline byte model checked against release 70's live phone10 run; the browser jobs are written, their judge self-tested on that live record, and they wait (section 6).

## The short answer

- **Release 69's hold left four loads on the phone's line during the entry, none of them drawn or heard before the first command.** Release 70's live phone10 run (round 32b, G4) moved 8.8 MB (Chapter I) and 15.3 MB (Chapter IV) between the battle screen's first line and the last figure being built (`pyrefly:enter:begin` to `stage`, 8.6 s and 16.9 s), and the first command waited for them at 1.25 MB/s. The four, in the order of the bytes they hold in Chapter I: **the boss rig's variant looks** (attack, cast, hurt, telegraph, ko with their rim and normal pieces: 2.8 MB in Chapter I, 3.3 MB in Chapter IV, awaited whole before the rig could be built), **the five (four) idle lighting maps** (2.2 MB, 1.8 MB: asked for by the first draw of each figure, which the hold had not deferred), **a magnified figure's 2x master** (Kimahri's idle, 0.9 MB of 2.4 MB inside the window, the governor's on-demand upgrade under the load card) and **the chapter's results cues** (the victory and defeat music: 1.6 MB in Chapter IV, fetched behind the fight's own theme).
- **The cut (all behind `bytesHeld()`, the phone class's hold plus `?phonebytes=off` not said): they wait for the hold and start when it opens, through the same ranked queue as the later poses.** The same bytes in another order, nothing dropped, nothing changed off the phone class. Per chapter on / held: section 4.
- **Modelled, offline, from the art manifest, the rig files and the shipped-file list of release 71:** the window falls from **13.2 to 7.3 MB in Chapter I (10.6 s to 5.8 s of a 10 Mbit/s line, 45 percent)** and from **16.3 to 9.7 MB in Chapter IV (13.1 s to 7.7 s, 41 percent)**; every other chapter loses its results cues (0.8 to 1.0 MB, 0.6 to 0.8 s). The model reproduces the live run's rig (4.68 against 4.73 MB), idle maps (2.23 against 2.23 MB), Chapter IV's rig (5.68 against 5.71), wings and depth plate (2.76 MB) and cues (1.59 MB, the brief's "audio 1.6"). The model counts the opening poses and the cues in full in both arms (a long scene moves them before the entry), so it is the upper bound of the window; the live run's actual window held 8.8 and 15.3 MB.
- **Predicted (rule 15, written before any measurement, section 6): Chapter I's load wait 11.1 s to about 6 s (band 4.5 to 8.0, about 85 percent to meet the 8 s budget); Chapter IV's 18.4 s to about 12.5 s (band 9.5 to 15.5; about 3 percent to meet 8 s, said in advance).** B3a (bytes to the first menu: 80.1 and 60.7 MB against 50) is **not** moved: the bytes are the same, only their order is. The half-size phone derivative stays Bailey's yes and is not built.
- **Tests:** 43 new tests in five files (audio 10, maps 8, rig stream 12, governor 6, offline model 7); a 23-mutant check of the new code, 23 killed by test name; the 483 test files related to the changed sources: 482 pass, one fails on a docs file this tree's sparse checkout does not carry (`pause-remake.test.ts`, not this lane's); `tsc --noEmit` clean; `node tools/orphans.mjs` 24 as before; no source file grew past 400 lines (`AudioManager.ts` 966 before and after, `RigActor.ts` untouched at 399).
- **Review class: DEEP** (asset loader, the figure build, the music warm). Focused review before any deploy, deep review on the live build (RUBRIC section 4; not the save-data class). `node tools/critic-plan.mjs --paths <the shipped files>` says so.

## 1. What the live run says (round 32b G4, `critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/phone10/first-command-phone10-pad-r32-g4-live.json`, read only)

Live release 70, phone10 (390x844, DPR 2, CPU x4, 10 Mbit/s, 40 ms), the pad route with the scene read, one run each, the host 28 to 32 percent busy (upper bounds). Each request's bytes are summed with the linear overlap of its start and end with the window (`begin` to `stage`); a file that ends after the stage counts only the share that crossed inside it.

| | Chapter I (FFX) | Chapter IV (FFX-2) |
|---|---|---|
| load wait (begin to shown) | 11,120 ms | 18,358 ms |
| window (begin to stage) / tail (stage to shown: HUD, shader warm-up) | 8,610 ms / 2,501 ms | 16,898 ms / 1,452 ms |
| `takeScene` (begin to the scene mark) | 0.2 s | **8.0 s** (the wings, 2.6 MB, behind the pre-battle scene's leftovers in the line's FIFO) |
| bytes in the window | **8.8 MB** | **15.3 MB** |
| the boss rig (109 / 91 files) | 4.73 MB | 5.71 MB |
| idle lighting maps (5 / 4 files) | 2.23 MB | 1.79 MB |
| poses | 1.68 MB (Kimahri's idle at 2x 0.94, two Overdrive keys of Tidus in flight from the preload 0.73) | 1.40 MB (the three `ready` poses) |
| other art | 0.12 MB | 4.11 MB (wings 2.64, a portrait 0.90, a pre-battle plate 0.56) |
| audio | 0 | 2.16 MB (the victory cue `pause` 1.48, the boss theme's tail 0.57, the defeat cue 0.11) |
| wire MB to the menu | 80.1 | 60.7 |

The brief's whole-file sums (Chapter I 9.1 MB: rig 4.9, idle maps 2.2, opening poses 1.8; Chapter IV 19.6 MB: art-other 7.0, rig 5.9, poses 3.1, idle maps 1.8, audio 1.6) are the same classes counted whole for every file that starts in the window.
**One number of the brief does not hold for release 70: "audio 16.6 MB fetched before the stage in Chapter IV".** That is release 68's phone run (`budgets-2.md` section 1.1: audio 16.6 MB of 87.8 MB after the press). The release 70 record has six audio files in Chapter IV, 4.8 MB by the first menu, of which 2.16 MB inside the window and 1.6 MB of those are the two results cues, which this lane holds. The SFX sprites (`sprite.mp3` 2.7 MB, the recorded set 4.6 MB) are not in that record at all; if a human run fetches them after the press they are a further 7.3 MB inside the window and the gate could take them too, but which sound a menu makes first is Bailey's ear (rule 13), so they are not touched (question 3).

## 2. What changed (all behind `LoadHold.bytesHeld()`)

| # | Cut | What | Files |
|---|---|---|---|
| 1 | **The idle lighting maps** (Chapters I and IV, the two whose look is on) | `FigureRelight.bindRelight` asked for the map of a pose drawn for the first time at once. While the hold is shut it registers the material as a waiter, puts the map on the book as loading and asks for it, at the head of the ranked queue (`mapRank`: `2 * need + 1`, the idle poses first), when the hold opens; a re-bind or a second plane of the pose promotes nothing during the hold. The shader program is compiled with the relight block at the bind and does not change when a map lands (a uniform), so no program is compiled later. | `look/relight/FigureRelight.ts` |
| 2 | **The boss rig's variant looks, by first use** | `RigFigure.load` fetched every look of every part (own image and one per pose that swaps it, each with its rim mask and normal piece) before the figure could exist. While the hold is shut it waits for each part's own look only; a variant is a `pending` look that shares the part's textures and is drawn as the part's own look (`lookOf`) until it lands. When the hold opens they are asked for through the queue (rank 2, the everyday moves') in the order a fight first draws them: hurt, telegraph, attack, cast, ko (`VARIANT_FIRST_USE`; a heuristic of order). A look that lands for a part that is showing it goes on the mesh at once; a figure that went frees what lands; a failed look is asked for once more and then left (the part keeps its own image for that pose, one warning); `swapMaps` waits for the stream and leaves a look that never landed alone. | new `rig/RigLook.ts`; `rig/RigFigure.ts` (389 lines), `rig/RigGhost.ts` (`Look.pending?`) |
| 3 | **The results cues** (every chapter) | The music warm fetches scene bed, first fight's theme, victory, defeat in that order from the card. `WarmGate` lets the app layer make a cue wait; `musicChapter` holds exactly `chapterLaterCues` (everything after the scene's bed and the first fight's theme) while `bytesHeld()`; they are fetched, in order, when the hold opens. The scene's bed and the boss theme are never held (the first cue's own file). | new `audio/WarmGate.ts`; `audio/AudioManager.ts` (net zero lines), `app/chapterMusicWarm.ts` |
| 4 | **The governor's on-demand masters** | `ArtGovernor.dispatch` sets aside every need that is not a warm-up while the hold is shut: a figure drawn under the load card is measured as magnified and asked for its 2x master (Kimahri's idle, 2.4 MB, 0.94 MB of it inside Chapter I's window); nobody sees it there. Warm-ups (an upload of pixels already here) go on. | `ArtGovernor.ts` (397 lines) |
| | **The switch and the books** | `?phonebytes=off` brings release 69/70/71's order back while the hold stays shut; `?phonediet=off` takes both away; `?phonediet=on` engages all of it on a desktop (the A/B). `__pyrefly.art.stats().bytes` counts `audioCues`, `idleMaps`, `rigLooks`, `rigLanded`, `rigFailed`, `governorNeeds`. | `LoadHold.ts`, `debug/artApi.ts` |

Not done, and why: **the opening poses** (4.4 to 5.5 MB in every chapter in the model, `idle*` and `ready*`; the preload moves most of them during the pre-battle scene, and what is left is the stage's real work); **the scene's wings and the pre-battle scene's leftovers** in Chapter IV (2.6 MB of wings the scene needs, 1.5 MB of a plate and a portrait the entry does not: a cancel of the preload's scene art at the battle's first line is a candidate, question 4); **a half-size phone derivative** (a look change; Bailey's yes; `load-diet.md` section 5); **the SFX sprites** (rule 13).

## 3. What a player can see (AGENTS.md rule 9; the call is delegated and flagged)

- **Lighting.** The idle maps used to land under the load card. They now land after the last figure is built, first in the queue: 2.2 MB takes 1.8 s of a 10 Mbit/s line and the tail (HUD, shader warm-up) is 2.5 s in Chapter I, 1.45 s in Chapter IV, then the boss card (1.3 s) and the sweep (6.4 s) follow. At 10 Mbit/s the figures are lit by the time the field is shown in Chapter I and within about 0.5 s of it in Chapter IV, behind the boss card. **On a line slower than that, the figures are lit later and a person can see an unlit frame** (the shader still compiles once). It is the budgets-2 trade again (that lane's section 2) and it is the slow line only.
- **The boss rig.** A boss move whose variant has not landed draws the part's own image for that pose (the bones still move; the arm is not the attack arm). The variants (2.8 and 3.3 MB) queue behind the idle maps (rank 1) and share rank 2 with the party's everyday poses, so at 10 Mbit/s they land 5 to 9 s after the hold opens, about 2 s before the first command (10.8 s after the stage in release 70's record; the backlog after the stage was about 10 MB, now about 15 MB). That is a margin, not a certainty: rows R73-14 and R73-16 measure it, and if they miss, the answer is a better rank for the variants (rank 1, with the idle maps), not a longer hold. At 1.6 Mbit/s (round 30b's Slow 4G) 3 MB takes about 15 s on its own and the first enemy move of an Active-mode FFX-2 fight could draw the part's own image. A variant that never lands (a dropped file) leaves that pose on the part's own image instead of dropping the whole rig to the painting set (the one non-additive change, logged in `CONTRACT-CHANGES.md`).
- **The results cues** are a sound that plays at the end of a fight; they have landed long before.
- **The 2x master** is Kimahri's idle sharpening a few seconds later than before.
- The by-eye job (r73-5) reads the first two on a slow line. Keep, or hold the releases back until the card is up: the driver's call; the switch is one address word.

## 4. Per chapter, on and held (the model, `tests/unit/phone-entry-bytes.test.ts`, `R73_REPORT=<file>` writes the rows)

All 19 listed chapters get the hold's four gates on a phone; what moves is the table below, in MB of art and audio the window would wait for (worst case: nothing preloaded), and the seconds of a 10 Mbit/s line. "Rig, own looks" is the rig.json (at 0.4 of its size, the wire compresses it), the parts' own images, rims and normal pieces; "variants" the rest of the rig. The idle maps and the variants are Chapters I and IV's alone (their look is the only one on by default, and the only two bosses with variant rigs); Yojimbo's and the Mirror Aeons' `lulu` rig has one look a part and nothing to stream.

| Chapter | Game | Wings + depth | Opening poses | Rig, own looks | Rig, variants | Idle maps | Results cues | Window r70 | Window r73 | Line r70 | Line r73 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| seymour-flux | FFX | 0.1 | 5.5 | 1.7 | 2.9 | 2.2 | 0.8 | 13.2 | 7.3 | 10.6 s | 5.8 s |
| yunalesca | FFX | 0.1 | 4.9 | 0.0 | 0.0 | 0.0 | 0.8 | 5.8 | 5.0 | 4.6 s | 4.0 s |
| braskas-final-aeon | FFX | 0.0 | 5.4 | 0.0 | 0.0 | 0.0 | 0.8 | 6.2 | 5.4 | 5.0 s | 4.3 s |
| ffx2-bahamut | FFX-2 | 2.8 | 4.5 | 2.4 | 3.3 | 1.8 | 1.6 | 16.3 | 9.7 | 13.1 s | 7.7 s |
| ffx2-vegnagun-shuyin | FFX-2 | 0.1 | 4.8 | 0.0 | 0.0 | 0.0 | 1.0 | 5.9 | 4.9 | 4.7 s | 3.9 s |
| ffx2-leblanc | FFX-2 | 0.1 | 4.4 | 0.0 | 0.0 | 0.0 | 1.0 | 5.5 | 4.5 | 4.4 s | 3.6 s |
| seymour-anima-macalania | FFX | 0.1 | 5.0 | 0.0 | 0.0 | 0.0 | 0.8 | 5.8 | 5.0 | 4.6 s | 4.0 s |
| evrae-airship | FFX | 0.0 | 4.4 | 0.0 | 0.0 | 0.0 | 0.8 | 5.2 | 4.4 | 4.1 s | 3.5 s |
| yojimbo-cavern | FFX | 0.0 | 5.0 | 1.4 | 0.0 | 0.0 | 0.8 | 7.2 | 6.5 | 5.8 s | 5.2 s |
| seymour-natus | FFX | 0.0 | 5.5 | 0.0 | 0.0 | 0.0 | 0.8 | 6.3 | 5.5 | 5.0 s | 4.4 s |
| ffx2-fallen-aeons | FFX-2 | 0.0 | 4.7 | 0.0 | 0.0 | 0.0 | 1.0 | 5.7 | 4.7 | 4.5 s | 3.7 s |
| seymour-omnis | FFX | 0.1 | 5.3 | 0.0 | 0.0 | 0.0 | 0.8 | 6.2 | 5.4 | 4.9 s | 4.3 s |
| ffx2-trema | FFX-2 | 0.1 | 5.1 | 0.0 | 0.0 | 0.0 | 1.0 | 6.1 | 5.1 | 4.9 s | 4.1 s |
| isaaru-via-purifico | FFX | 0.1 | 2.9 | 0.0 | 0.0 | 0.0 | 0.8 | 3.7 | 3.0 | 3.0 s | 2.4 s |
| ffx2-den-of-woe | FFX-2 | 1.9 | 4.5 | 0.0 | 0.0 | 0.0 | 1.0 | 7.4 | 6.4 | 5.9 s | 5.1 s |
| ffx2-ixion-djose | FFX-2 | 0.1 | 4.7 | 0.0 | 0.0 | 0.0 | 1.0 | 5.8 | 4.8 | 4.6 s | 3.8 s |
| sin-fins-core | FFX | 0.0 | 5.2 | 0.0 | 0.0 | 0.0 | 0.8 | 6.0 | 5.2 | 4.8 s | 4.2 s |
| sin-face | FFX | 0.0 | 4.9 | 0.0 | 0.0 | 0.0 | 0.8 | 5.7 | 4.9 | 4.6 s | 3.9 s |
| mirror-aeons | FFX | 0.0 | 3.5 | 1.4 | 0.0 | 0.0 | 0.8 | 5.7 | 5.0 | 4.6 s | 4.0 s |

Median over the 19: 5.9 MB to 5.0 MB (4.7 s to 4.0 s of line). Read honestly: **only Chapters I and IV change by more than a second**, and the 4 to 5 MB of opening poses that every chapter still waits for is the biggest remaining item (question 2). The model does not know the governor's masters (they depend on the camera) or how much of the opening poses and cues the scene already moved.

## 5. Tests and checks

| | |
|---|---|
| `tests/unit/phone-bytes-audio.test.ts` (10) | `WarmGate` as a seam (no gate, the newest gate wins, an old run cannot remove the newer gate, a throwing gate is no gate); `AudioManager.fetchWarm` waits for the gate and a replaced run fetches nothing more; `musicChapter` holds exactly the later cues in both games, only while held, fetches them in order at the opening, `?phonebytes=off` and no hold fetch straight through; the gate goes with the run |
| `tests/unit/phone-bytes-maps.test.ts` (8) | not held: asked at once; held: nothing asked, the material waits unlit, asked at the opening, lit on landing; `?phonebytes=off`; re-binds and second planes promote nothing; rank order idle, attack, victory; a map released before the opening is never asked; after the opening a pose asks at once; a map on its way is not asked twice |
| `tests/unit/rig/rig-variant-stream.test.ts` (12) | the first-use order; built whole when nothing is held and under `?phonebytes=off`; held: only own looks are awaited, a pending variant shows the part's own image and mesh, the order at the opening, landing on a showing part goes on the mesh at once, failure retried once then left with one warning, a figure disposed before the opening asks for nothing, one disposed with a variant on the wire frees it, `swapMaps` waits and skips what never landed, a v1 rig |
| `tests/unit/engine/phone-bytes-governor.test.ts` (6) | a lasting close-up fetches nothing while held, starts on the next frame after the opening; planned views wait; `?phonebytes=off`; warm-ups go on |
| `tests/unit/phone-entry-bytes.test.ts` (7) | the model against release 70's live run (rig, idle maps, wings, cues of Chapters I and IV within 1 to 3 percent); r73 = wings + opening poses + own looks; saved = variants + idle maps + cues; the idle maps and the variants are Chapter I's and IV's alone; every other chapter loses only its cues |
| mutation check (`D:/Tools/pyrefly-scratch/2026-11-01/r73-bytes/mutate.mjs`, log `mutate.log`) | 23 mutants of the new source (a held bind asking at once, the queue ignoring the hold, a promote during the hold, the idle rank not first, the audio gate never holding / holding the boss theme / holding without a hold / never removed / not awaited, the rig always whole / always streamed, a pending look shown as itself, landing not refreshing the mesh, `swapMaps` not waiting, no first-use sort, no retry, a gone figure still asking, a landed look kept by a gone figure, no wait for the hold, the governor check gone / holding warm-ups, `?phonebytes=off` ignored, `bytesHeld` ignoring the hold): 22 killed on the first run, one survivor (a texture landing on a gone figure was freed by the figure's own dispose in the test) fixed with a test that follows that one texture, now killed: 23 of 23 |
| the related files | `vitest related` over the ten changed sources: 483 files, 6,446 tests, 482 files pass; the one failing file is `pause-remake.test.ts`, which reads `docs/concepts/pause-until-dawn/options.json` that this tree's sparse checkout does not carry (the same absence makes `tsc` list the `pause-living-portrait*` tests); not this lane's |
| `tsc --noEmit`, `node tools/orphans.mjs` | clean (apart from those sparse-checkout files); 24 orphans as before; new modules are imported (`RigLook` by `RigFigure`, `WarmGate` by `AudioManager` and `chapterMusicWarm`) |
| Line counts | `RigFigure.ts` 389 (381 before), `ArtGovernor.ts` 397 (394), `FigureRelight.ts` 278, `RigActor.ts` 399 untouched, `AudioManager.ts` 966 before and after (one import, two lines in the loop, the doc rewrapped), new `RigLook.ts` 112, `WarmGate.ts` 30 |

## 6. The browser jobs and the predictions (written before any measurement; AGENTS.md rule 15)

`D:/Tools/pyrefly-scratch/2026-11-01/r73-bytes/jobs/` (outside git; `queue.json`, `r73-predictions.json`, `judge-r73.mjs`, `selftest.mjs`: 34 checks pass on release 70's live record and records made from it; `first-command.mjs`, `lib.mjs`, `pure.mjs`, `ld-reqs.mjs`, `budgets.json` are the budgets-2 lane's J2 copied, with `make-r73-jobs.mjs` adding `art.stats().bytes` to the environment probe; `--dry` runs; **nothing was run in a browser**). The candidate is built lean from a clean mirror of the pushed sha (`node tools/mirror-tree.mjs make <sha> <dir>`) and served over the live artifact's art on port 5613 (read only; stop it by its port), **all arms one build, the arm is the address word**: `old` = `&phonebytes=off` (release 69/70/71's order), `new` = the build. Control: the live site (release 71). About 41 minutes of browser: r73-1 (14 min, FIRST: phone10, both chapters, scene read, both arms, three runs each), r73-2 (4: the live control), r73-3 (8: the scene held), r73-4 (8: desk50, the desktop must not move), r73-5 (7: by eye on a slow line, the look call). After the queue: `node judge-r73.mjs` (exit 2 = a non-informative miss). A miss that is not informative stops the lane for a written method check.

| ID | Run | Metric (median) | Band (central) | Why |
|---|---|---|---|---|
| R73-01, 04 | phone10, scene read, Chapter I, new | load wait; within 8 s | 4.5 to 8.0 s (6.0); about 85 percent | the window's bytes fall from 8.8 to about 2.6 MB (2.1 s of line); the CPU floor is 4.2 s; the tail is 2.5 s |
| R73-02, 03 | the same, old; old minus new | load wait | 9.0 to 13.5 s (11.1); at least 3.0 s (5.0) | release 69's order read 11.1 s live; 6.1 MB is 4.9 s |
| R73-05, 08 | phone10, Chapter IV, new | load wait; within 8 s | 9.5 to 15.5 s (12.5); **expected MISS, about 3 percent (info)** | 15.3 to 8.6 MB is 5.4 s, plus a little for the FIFO; the wings, the pre-battle leftovers and the 7.6 s CPU floor are not touched |
| R73-06, 07 | the same, old; old minus new | load wait | 16.0 to 21.5 s (18.4); 3.5 to 9.0 s (5.7) | |
| R73-09, 10 | new | window (begin to stage) | Chapter I 2.5 to 5.5 s (3.8); Chapter IV 7.0 to 13.0 s (11.0) | |
| R73-11 | Chapter I, new minus old | tail (stage to shown) | -0.5 to +1.5 s (0.3) | the held loads now share the line with the HUD and the shader warm-up |
| R73-12 | both, new over old | wire MB to the menu | 0.88 to 1.03 (0.97) | the same bytes in another order; **B3a stays FAILED** |
| R73-13 | new | the books at the first menu | idle maps 5 / 4; rig looks 30 / 25 | 6 parts x 5 variants, 5 parts x 5 |
| R73-14 (info) | new | every streamed rig look has landed by the first menu, none failed | about a 65 percent chance | the variants wait behind the idle maps and share a rank with the party's everyday poses; if this misses, rank 1 for the variants |
| R73-15, 16 (info) | new | results cues held; the last rig look lands after the stage | Chapter I 0, Chapter IV 0 to 2; within 11 s / 15 s (7 s / 9.5 s) | the 35 s scene lets Chapter I's warm finish |
| R73-17 | both, new over old | `heldMs` of the hold | 0.3 to 0.85 (0.55) | the hold is the window |
| R73-18 | phone10, scene held, Chapter I, new (info) | load wait | 6.0 to 11.5 s (8.5) | nothing hides the load |
| R73-19, 20 | desk50, both chapters | new minus old; the books | within 1.0 s; all zero | the hold never engages on a desktop class |
| R73-21 | every run | errors | none | the stream warns, it does not throw |

## 7. Files

New: `src/audio/WarmGate.ts`, `src/engine/rig/RigLook.ts`; `tests/unit/phone-bytes-audio.test.ts`, `phone-bytes-maps.test.ts`, `phone-entry-bytes.test.ts`, `rig/rig-variant-stream.test.ts`, `engine/phone-bytes-governor.test.ts`, `helpers/phone-entry-model.ts`; this note.
Changed: `src/engine/LoadHold.ts`, `look/relight/FigureRelight.ts`, `rig/RigFigure.ts`, `rig/RigGhost.ts`, `ArtGovernor.ts`, `src/audio/AudioManager.ts`, `src/app/chapterMusicWarm.ts`, `src/debug/artApi.ts`, `docs/DEV.md`, `docs/CONTRACT-CHANGES.md`, `tests/unit/helpers/load-bytes-model.ts` (two exports).

## 8. Open questions for the driver (and Bailey)

1. **The look call (rule 9), delegated, with its numbers:** on a phone and a slow line the idle lighting arrives after the field is shown, and a boss move whose variant has not landed draws the part's own image. At 10 Mbit/s neither shows (section 3); under about 5 Mbit/s they can. Keep (the speed comes from it), or release the idle maps with the figures (the maps are 2.2 MB: that alone is 1.8 s of Chapter I). The by-eye job r73-5 is how it is judged.
2. **The opening poses** (4.4 to 5.5 MB in every chapter, `idle*` and `ready*`) are now the largest item left in every window. Cutting them is a look change (a `ready` stance missing at the first menu) or the half-size phone derivative of `load-diet.md` section 5 (Bailey's yes). Not built.
3. **The SFX sprites** (7.3 MB if a human run fetches them after the press) and **Chapter IV's 8 s**: the wings (2.6 MB) and the pre-battle scene's leftovers on the line cannot be held (the scene needs the wings); a cancel of the preload's scene art at the battle's first line on the phone class is the next lever and touches the pause and results warm (a separate lane). B2a for Chapter IV at 8 s stays a restatement per line and scene length (budgets-2 question 3).
4. **Ship?** DEEP class, focused review first. My recommendation: carry it as release 73's phone change after r73-1 and r73-4 have run (the gain and the desktop), with the CHANGELOG lines below held until r73-1 reads the load wait.
5. **The kill switch for everyone** is one line: `LoadHold.phoneBytes()` returning false.

## 9. Paste-ready CHANGELOG lines (not shipped; held until r73-1 has run)

- **Both games, on a phone: the battle's entry waits for less before the loading card goes.** While the entry loads, the lighting maps of the figures drawn for the first time (Chapter I and Chapter IV), the boss's attack, cast, hurt, telegraph and knock-out parts (the same two chapters), the victory and defeat music (every chapter) and the sharper copy of a magnified figure now start once the figures exist, in the order a fight needs them; the same files arrive. On a slow line the lighting can arrive a moment after the field and a boss move can draw the part's resting image until its own has arrived (`?phonebytes=off` brings the old order back). A desktop is unchanged.
- **FFX only (Chapter I, Seymour Flux) and FFX-2 only (Chapter IV, Bahamut), the same change in each game's boss:** the rig is built from each part's resting image and its move images stream in, hurt first.
