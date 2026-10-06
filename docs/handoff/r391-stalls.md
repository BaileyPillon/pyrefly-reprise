# r391-stalls: no master swap lands on a frame (release 39.1 material)

Date 2026-10-05. Branch `r391-stalls` (from `origin/main` cfab29b4, release 39), worktree `D:/pyrefly-critic-continuity`. Pushed; **nothing is merged into `main` and nothing is deployed**. Game case:
**both games, shared plumbing** (the governor, the painted textures and the renderer are the same code for FFX and FFX-2; nothing reads a game id and no painting, scale or number of any chapter changes).
Bailey, 2026-10-04: "I need super high resolution now. DO NOT hold back." and 2026-10-05: "you can go full speed ahead i have another account with full usage". This is a bug fix inside that scope, not a new look.
Paper preflight: [../plans/r391-stalls-review.md](../plans/r391-stalls-review.md). Charts: [../screenshots/r391/](../screenshots/r391/). `critic-plan` says **DEEP** (asset loader; checks CHK-008 012 013 016 017 018 019 020 021 026 027): the focused review before a deploy, the deep one after.

## Result

Release 39 swapped a 2x/3x/4x master into a painting's texture in place and Three uploaded it inside the next `render()`: **145 ms for a 4096-square figure master, 193 to 216 ms for a 5376 x 3072 backdrop**, on the frame that drew
it (Chromium decodes the PNG again on the main thread inside `texSubImage2D(<img>)` when the alpha is left straight, which is what Three asks for; the `img.decode()` the loader awaited decodes a different, premultiplied copy). A pose that had never been drawn
(a sibling brought up in the background, or the 2x `ready` pose each hero has) paid the same at its first draw, mid-turn. Now the master is decoded off the main thread, **uploaded ahead in row bands of 1.3 to 1.7 ms**, and the painting **adopts the finished GL texture
between two draws** (Three's own `Source` sharing). The painting keeps drawing the texture it has until then. Option chosen: spread the upload over frames (option 2 of the preflight); a one-call upload (21 to 25 ms) is the fall-back, release 39's swap the last one.

First three real-key turns on the production code build, headless Chromium on the RTX 5070 Ti, two interleaved repetitions each side (the machine was shared with other agents; see "What the numbers are" below):

| | Chapter I (FFX) 1440p | IV (FFX-2) 1440p | VIII (FFX) 1440p | I 4K | IV 4K | VIII 4K |
|---|---|---|---|---|---|---|
| GL texture calls in the window, release 39 | 18 (677 ms of main thread) | 11 (643 ms) | 12 (364 ms) | 18 (654 ms) | 11 (397 ms) | 12 (403 ms) |
| the same, 39.1 | 5 (19 ms) | **0** | **0** | 7 (57 ms) | **0** | **0** |
| of those, calls over 5 ms | 18 to 1 | 11 to **0** | 12 to **0** | 18 to 1 | 11 to **0** | 12 to **0** |
| frames over 50 ms that carry a texture upload | 13 to 4 | 9 to **0** | 8 to **0** | 13 to 2 | 8 to 1 | 8 to **0** |

\Medians of two repetitions; the full per-run table is in the "Measurements" section. The one texture call over 5 ms left in Chapter I is a lazily swapped 1762 x 1482 pose (a boss's cast or hurt painting) drawn for the first time at 3 to 5 s after the first menu: it is past the warm cap.

`maxUploadMs` (the slowest single upload call the stager made in a whole run) was 1.5 to 5.5 ms in 9 of the 12 matrix runs, 7.7 to 16.7 ms in three runs where another process had the GPU, and 181 ms once (a Chapter IV identity run on a loaded card):
a call that waits on a busy GPU cannot be made shorter, so a call over 6 ms now cuts the next 8 frames' budget to a quarter (`SLOW_UPLOAD_MS`, `BACKOFF_FRAMES`) and nothing piles on. (That guard went in after the matrix was measured: it only acts when a call is slow, which happened in 3 of the 12 runs; the matrix numbers are from the build without it.)

**Pixels are unchanged where it matters and within one level of 255 on screen** (detail in "Identity"): level 0 of every governed texture, 100.0 to 143.6 million texels per chapter, is byte-identical to the legacy upload; on screen, in the first-menu frame, 0 to 311 of 3.69 million pixels
differ and none by more than 1 of 255. The cause of the 311 is a driver effect on the generated mip levels 2 and up of non-power-of-two textures written in several calls (below).

**What it costs.** *Memory:* Chapter I at 1440p holds 1,338 MB of textures at the first menu against 715 MB (VIII: 1,054 against 540, IV: 1,142 against 723); the difference is the warm pool, paintings uploaded before their first draw instead of at it, capped at
`min(640 MB, 30 percent of the class's texture budget)`. By the end of a real fight most of it would be resident anyway; what changed is *when*. *Time to the first sharp master* (seconds from the chapter call; the first menu comes at 12 to 15 s): the first master lands 1.4 s earlier (Chapter I, 1440p: 7.6 to 6.2 s) to 1.0 s later (Chapter IV: 3.6 to 4.6 s) than in 39, and the last one before the first menu 1.5 s earlier to 1.8 s later: a staged master adds its fetch-decode-band time (0.1 to 0.3 s for a big one; the slowest ask-to-swap was 1.1 to 1.6 s with
other loads in the air). All of it lands during the opening; no upgrade lands after the first menu in any of the 12 runs of either build (a few warm-ups of lazily swapped poses do, 126 to 180 ms from ask to swap, uploaded in bands).
*Main thread:* a band costs 1.3 to 1.7 ms, on 65 to 111 frames per run (the stager's `busyFrames`, nearly all of them during the opening); the governor's own CPU is unchanged (0.07 ms a frame).

## What the numbers are, and are not

Nearly all the frames still over 50 ms after the change are **not texture uploads** (no texture call over 0.8 ms inside them; the exceptions are the lazily swapped pose above): CPU tasks of 60 to 170 ms in the game's own `tick` (the long-animation-frame log shows the app's `requestAnimationFrame` callback and, once, the `keydown` handler for the Attack
command: 130 ms); a few draw or program calls of 5 to 40 ms (a busy GPU) turn up in both builds, 192 ms once. A V8 profile of them was inconclusive (the thread is mostly waiting). They are the same in both builds and are what is left of "first-ability stalls" (PR-0395). The frame totals per run swing with the machine: other agents' browsers were
on the same card (GPU use 4 to 49 percent before each run, 3 to 100 after), one 1440p Chapter I run of 39.1 counted 75 frames over 50 ms with 817 ms frames scattered through it, and at 4K Chapter I the two builds are within the spread (31 and 20 frames over 50 ms against 32 and 16). Two repetitions are not a
distribution: the claim made here is the one the GL log supports exactly (no texture upload over 5 ms lands in a frame any more, except the few paintings past the warm cap), not a drop in the total of long frames. **Owed: two more repetitions per cell on a quiet card** (the lane's pause is held only while timing; I released it at 15:53).

## What is built

| | file | what |
|---|---|---|
| new | `src/engine/TextureStager.ts` | the staged upload: a staging `Texture` (the painting's sampler state, `source.dataReady = false`) allocated through `renderer.initTexture`, filled by `texSubImage2D(ImageBitmap)` in row bands through the WebGL2 sub-rectangle overload (`UNPACK_SKIP_ROWS`), one `generateMipmap`, then **adoption**: `target.dispose(); target.source = staging.source; renderer.initTexture(target); staging.dispose()` (the painting's old GL texture is freed, the staged one kept, nothing uploaded). A frame budget (4 MB, 6 MB for a live need, a quarter while the frame is late or after a slow call), cancellation on dispose and on a lost context, a one-call fall-back when the handle is missing |
| new | `src/engine/StageBands.ts`, `StageProbe.ts` | the band arithmetic; the **run-time proof**: a 4 x 2 PNG with colour hidden under alpha 0 and partial alpha is uploaded the legacy way and the staged way in a throwaway WebGL2 context and read back; any difference or error turns the stager off for the session |
| new | `src/engine/MasterLoad.ts` | the governor's load as one fetch read two ways: an `<img>` handle (what `texture.image` keeps, decoded off the thread) and `createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'flipY' })`; background loads at `priority: 'low'`, warm-ups from the cache; the same fall-back chain as `loadPixels` |
| new | `src/engine/ArtMemory.ts`, `ArtEntry.ts` | the governor's memory ledger (committed, room, evictions, the **warm pool**) and its internal records, split out of `ArtGovernor.ts` (388 of 400 lines) |
| changed | `src/engine/ArtGovernor.ts` | a loaded master with a bitmap is staged and swapped only when resident; a load stays "in the air" until then (two, plus one for a figure on screen); a painting not yet drawn is **warmed** (its own master uploaded before its first draw), up to the cap; stats gain `staging`, `stagedLanded`, `warmed`, `warmMB`, `swaps` |
| changed | `StageArt.ts`, `ArtMeasure.ts`, `ArtDevice.ts`, `BattlePresenterStage.ts`, `BattleScreen.ts`, `debug/artApi.ts` | the stager is built from the renderer the stage is given (`renderer:` in `PaintedStageOptions`, one line in `BattleScreen`) and ticked once a frame before the governor's update; **`?stage=off`** (and `__pyrefly.art.stage(false)`) is the kill switch and the A/B |

Knobs: `BAND_BYTES` / `URGENT_BAND_BYTES` (`StageBands.ts`), `WARM_MAX_MB` / `WARM_SHARE` / `WARM_MIN_PIXELS` (`ArtMemory.ts`), `MAX_LOADS` / `URGENT_EXTRA` (`ArtEntry.ts`). `__pyrefly.art.stats().governor` now carries `stager` (mode, probe verdict, jobs, uploads, MB, slowest call).

## Identity (the exact-art rule)

1. **The shipped files are untouched** and the build gates prove the build: `art-derive verify` PASS (2,874 masters, 0 problems), `audit` PASS, `art-browser-load` PASS (2,918 of 2,918 in Chromium and WebKit), `art-browser-identity --screen-exact` PASS (2,704 pairs compared in the browser, 593 WebP, 2,111 recompressed PNG, `--screen-exact`, 0 problems, 36 minutes).
2. **The upload path, in isolation** (spike, three real masters with 340,533 to 1,971,579 texels of colour under alpha 0 and 57,783 to 155,793 of partial alpha): the legacy `<img>` upload, the one-call bitmap upload and the banded bitmap upload read back **byte for byte equal**, and equal to sharp's straight RGBA read of the PNG, flipped.
3. **In the game, on every governed painting** (`identity2.mjs`: one run on the production build, then a reference texture is made the legacy way from the same `texture.image` and levels 0 to 3 of both are read back from the real context): level 0 and level 1 **identical for all 44 / 34 / 40 paintings** (143.6 / 100.0 / 116.3 million texels, Chapters I / IV / VIII).
   Levels 2 and 3 differ for non-power-of-two paintings only: 160,291 and 84,622 bytes in Chapter I, worst 8 and 13 of 255 (sRGB, a few dark texels).
4. **The cause** (spike, ANGLE/D3D11): any upload split across more than one `texSubImage2D` call, even two halves or raw bytes, makes `generateMipmap` produce slightly different levels 2+ for non-power-of-two textures than one full upload does (RGBA8: 1 of 255; sRGB8_ALPHA8: up to 6 to 13). Power-of-two textures (4096 square) are identical. It does not depend on the band size (256, 512, 1024 rows give the same) and not on a `generateMipmap` made on the empty allocation.
5. **On screen** (`visual.mjs`: the same frozen first-menu frame rendered with the game's textures, then with every painting's texture swapped for a legacy upload, read back): noise floor 0; **Chapter I 311 of 3,686,400 pixels differ, by at most 1 of 255; Chapter IV 0; Chapter VIII 0**; restoring the game's textures gives 0 again.
6. **Other browsers, by construction**: the probe ran the real `StageProbe.ts` in Playwright's engines: Chromium (GPU and SwiftShader) passes; **WebKit 26.6 refuses** ("the bitmap upload differs from the legacy upload in 12 bytes"), so Safari keeps release 39's swap; Firefox would not launch here (`spawn UNKNOWN`), not measured.

## Gates

`npx tsc --noEmit` clean. New tests (all green): `tests/unit/engine/r391-stage-bands` (13), `r391-stage-probe` (8), `r391-texture-stager` (21), `r391-governor-staging` (17), `r391-master-load` (8), `r391-stage-art-wiring` (5), `r391-three-contract` (6, pins the three 0.186.0 internals the stager reads) plus `tests/unit/helpers/fake-stage-host.ts`; the existing art, governor and loader tests (`r39-art-governor`, `r39-art-tiers`, `r39-preload-masters`, `r35-art-keys`, `art-shipped`, `art-url-sources`) unchanged and green.
`node tools/orphans.mjs`: 24 orphaned, the same 24 as release 39 (the new modules are reachable). Full `npm test`: 874 files passed, 5 skipped (879); 13,028 tests passed, 46 skipped, 1 todo, 0 failed (`vitest run --testTimeout=60000 --maxWorkers=3`, 1,046 s, with the real `public/art`).

## Not done, and risks

- **Two more repetitions on a quiet card** (above). A third phase the brief names, compressed GPU formats, was not built (a transcoder download, a second shipped file set, not lossless); nothing needed it.
- **The first load.** The backdrop's 2x master (5376 x 3072, 160 to 190 ms) and the figures' first draws still upload at the opening (frames of 0.7 to 1.6 s while the stage is built, 5 to 13 frames over 50 ms before the first menu in every chapter, same as 39); they sit behind the opening, not mid-turn. Not touched.
- **Past the warm cap** (Chapter I at 1440p: about 40 paintings, 640 MB) a painting is uploaded at its first draw, as in 39: one 19 to 65 ms upload of a lazily swapped 1762 x 1482 pose remained in Chapter I's window in three of the four runs. `WARM_MAX_MB` is the knob (+100 MB buys about six paintings). Eviction (over the texture budget; the high class does not reach it) still re-uploads lazily.
- **Safari, Firefox, an integrated GPU and a real network are not measured.** The probe decides at run time; WebKit's verdict is "no". A device that reports high but has little VRAM gets the same budgets as in 39 plus the warm pool (the cap is a share of the class budget: 640 / 270 / 150 / 66 MB for high / mid / low / phone).
- **Phone** (390 x 844 at ratio 3, 4x CPU throttle, Chapters I and IV, final build): class `phone`, 1x base, the governor idle (0 upgrades, 0 warm-ups, nothing staged), 78 and 97 MB of textures (release 39 measured 96), no console error: unchanged by construction.
- **`texture.image` is still the `<img>` handle** (decoded off the thread), so a restored WebGL context re-uploads from it exactly as in 39 (a slow path, once).
- The two checks the critic owes on a swap, CHK-026 and CHK-027 (continuity), read the planes' fades and corners; a swap here changes no plane, fade or geometry, so they should read as before. Not re-run (no harness run in this lane).

## The art lane's pause

I created `D:/Tools/pyrefly-scratch/2026-10-04/r39-art/PAUSE-GPU` at **14:13:15 EDT** on the driver's word; timing ran 14:25 to 14:28 (cut short when Claude Code restarted and killed my processes) and 15:37 to 15:53; I moved the file to `F:/pyrefly-parked/2026-10-05/r391-stalls/PAUSE-GPU.released-2026-10-05T15-53-52-EDT` at **15:53:52**. The ComfyUI queue was empty throughout. Log: `D:/Tools/pyrefly-scratch/2026-10-05/r391-stalls/runs/pause-gpu.log`. Total hold 100 minutes by the clock, 20 of them timing; the rest was the restart gap and the first harness iterations.

## How to run it again

```
cd D:\pyrefly-critic-continuity    (junctions: node_modules -> main tree; public/art and public/fx -> D:/pyrefly-r39-int/public, read only)
node node_modules/vite/bin/vite.js build --config <scratch config: the repo's vite.config.ts + publicDir:false + a cacheDir> --outDir <dist>      (the code-only production build; ~2 s)
node harness/serve.mjs --port=7441 --dist=<dist> --public=D:/pyrefly-critic-continuity/public
node harness/stalls.mjs --base http://127.0.0.1:7441/pyrefly-reprise/ --chapter ch1|ch4|ch8 --res 2560|3840 --tag <t>      (PYREFLY_BROWSER=gpu; real keys; prints the three windows)
http://127.0.0.1:7441/pyrefly-reprise/?stage=off     (release 39's swap in the same build)
```
The harness (stalls, matrix, batch with the pause handling, identity, identity2, visual, phone, chart, summarize, the upload spike) is in `D:/Tools/pyrefly-scratch/2026-10-05/r391-stalls/harness/` and the spike in `.../spike/` (scratch, not durable); a copy with every run's JSON is parked at `F:/pyrefly-parked/2026-10-05/r391-stalls/`.

## Measurements

Production **code** builds (`vite build`, `publicDir` off, one shared art root so both draw the same files) of `cfab29b4` (before) and of this branch (after), served by `harness/serve.mjs`; `PYREFLY_BROWSER=gpu` headless Chromium 153 on the RTX 5070 Ti from node,
real keys (Attack, three commands; Chapter IV's first dressphere cannot Attack and casts Shell), seed 1, a fresh browser for every run, one browser at a time, runs interleaved before/after with the order alternating, `?artlink=fast`. The windows: "load and intro" is the call to `gotoChapter` until the first
command menu; "turns" is the first menu until the next menu after the third command (Chapter I ends in the results screen: the party is wiped in three turns on seed 1, so that window includes the KO paintings, the heaviest first draws). The art lane's pause was held for these runs (14:25 to 14:28, 15:37 to 15:53). Every run's JSON (frame series, every GL texture call over 0.8 ms
with the frame it landed in, the governor's timeline, the GPU tally, the console and network errors: none in 24 runs) is in `D:/Tools/pyrefly-scratch/2026-10-05/r391-stalls/runs/m-before|m-after/`.

#### Frames over the first three turns (the window from the first command menu to the end of the third turn)

Median over the reps, with the range. "texture-attributed" = a frame over 50 ms that has a GL texture call (over 0.8 ms) inside it; "other" = a frame over 50 ms with none (a CPU task of shader, HUD or effect work).

| chapter | window | build | reps | frames | over 33 ms | over 50 ms | over 100 ms | worst frame ms | texture-attributed over 50 | other over 50 | GL texture calls (n, ms) | texture calls over 5 ms | other GL calls over 5 ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I FFX | 2560x1440 | before | 2 | 2016 (1984 to 2047) | 34 (28 to 40) | 24 (19 to 29) | 5 (4 to 6) | 258.4 (166.7 to 350) | 13 (12 to 14) | 11 (7 to 15) | 18 calls, 677 (602 to 752) ms | 18 | 0 |
| I FFX | 2560x1440 | after | 2 | 1862 (1605 to 2118) | 56 (6 to 105) | 40 (4 to 75) | 21 (1 to 40) | 466.6 (116.6 to 816.5) | 4 (1 to 6) | 36 (3 to 69) | 5 (3 to 6) calls, 19 (12 to 25) ms | 1 | 3 (0 to 5) |
| IV FFX-2 | 2560x1440 | before | 2 | 1063 (998 to 1127) | 32 (16 to 47) | 24 (12 to 35) | 11 (5 to 17) | 375 (283.3 to 466.7) | 9 (8 to 9) | 15 (3 to 27) | 11 calls, 643 (454 to 833) ms | 11 | 2 (1 to 2) |
| IV FFX-2 | 2560x1440 | after | 2 | 1138 (1124 to 1152) | 9 (4 to 13) | 7 (3 to 10) | 3 (1 to 4) | 175.1 (116.7 to 233.4) | 0 | 7 (3 to 10) | 0 calls, 0 ms | 0 | 0 |
| VIII FFX | 2560x1440 | before | 2 | 787 (780 to 794) | 15 (14 to 15) | 13 (12 to 14) | 5 (4 to 5) | 141.7 (133.3 to 150) | 8 (7 to 8) | 6 (5 to 6) | 12 calls, 364 (350 to 379) ms | 12 | 0 |
| VIII FFX | 2560x1440 | after | 2 | 800 (798 to 801) | 14 (12 to 15) | 8 (7 to 8) | 4 | 166.7 | 0 | 8 (7 to 8) | 0 calls, 0 ms | 0 | 0 |
| I FFX | 3840x2160 | before | 2 | 2038 (1994 to 2081) | 29 (20 to 38) | 24 (16 to 32) | 5 (1 to 9) | 316.7 (216.7 to 416.6) | 13 (12 to 14) | 11 (4 to 18) | 18 calls, 654 (557 to 750) ms | 18 | 0 |
| I FFX | 3840x2160 | after | 2 | 1997 (1951 to 2042) | 37 (28 to 45) | 26 (20 to 31) | 11 (6 to 15) | 341.7 (250 to 433.3) | 2 (1 to 3) | 24 (19 to 28) | 7 calls, 57 (37 to 77) ms | 1 | 4 (3 to 4) |
| IV FFX-2 | 3840x2160 | before | 2 | 1031 (940 to 1121) | 27 (16 to 38) | 20 (13 to 26) | 6 (3 to 8) | 566.7 (233.3 to 900) | 8 (7 to 8) | 12 (6 to 18) | 11 (10 to 11) calls, 397 (330 to 464) ms | 11 (10 to 11) | 1 (0 to 1) |
| IV FFX-2 | 3840x2160 | after | 2 | 1035 (1028 to 1042) | 35 (30 to 40) | 22 (18 to 26) | 12 (9 to 14) | 625.1 (616.8 to 633.3) | 1 (0 to 1) | 22 (18 to 25) | 0 calls, 0 ms | 0 | 3 (2 to 3) |
| VIII FFX | 3840x2160 | before | 2 | 777 (774 to 780) | 16 (15 to 16) | 14 | 7 (6 to 8) | 183.4 (150 to 216.7) | 8 (7 to 8) | 7 (6 to 7) | 12 calls, 403 (400 to 406) ms | 12 | 0 |
| VIII FFX | 3840x2160 | after | 2 | 801 (799 to 803) | 11 (9 to 12) | 8 (7 to 9) | 4 | 166.7 (150 to 183.4) | 0 | 8 (7 to 9) | 0 calls, 0 ms | 0 | 0 |

#### The load and intro (the chapter call to the first command menu): the stage is built behind the opening; shown for completeness

| chapter | window | build | frames over 50 ms | over 100 ms | worst frame ms | first menu s |
|---|---|---|---|---|---|---|
| I FFX | 2560x1440 | before | 17 (12 to 22) | 11 (7 to 14) | 2567 (2150 to 2983) | 16.5 (14.7 to 18.3) |
| I FFX | 2560x1440 | after | 13 (10 to 16) | 8 (6 to 9) | 1783 (1450 to 2117) | 14.7 (13.8 to 15.7) |
| IV FFX-2 | 2560x1440 | before | 12 (11 to 12) | 9 (8 to 9) | 908 (800 to 1017) | 13 (12.8 to 13.2) |
| IV FFX-2 | 2560x1440 | after | 13 (12 to 14) | 9 | 967 (950 to 983) | 14 (13.8 to 14.2) |
| VIII FFX | 2560x1440 | before | 9 (8 to 10) | 6 | 1142 (983 to 1300) | 12.3 (11.9 to 12.6) |
| VIII FFX | 2560x1440 | after | 8 (7 to 9) | 5 | 1242 (1167 to 1317) | 12.6 (12.6 to 12.7) |
| I FFX | 3840x2160 | before | 11 (10 to 12) | 9 (7 to 10) | 1658 (1533 to 1783) | 14.2 (13.6 to 14.7) |
| I FFX | 3840x2160 | after | 10 (8 to 11) | 8 (7 to 8) | 1633 (1617 to 1650) | 14.4 (14.3 to 14.4) |
| IV FFX-2 | 3840x2160 | before | 12 (10 to 13) | 11 (10 to 11) | 1000 (983 to 1017) | 14.1 (14.1 to 14.1) |
| IV FFX-2 | 3840x2160 | after | 15 (11 to 18) | 11 (9 to 12) | 1000 (900 to 1100) | 15.1 (14.2 to 16) |
| VIII FFX | 3840x2160 | before | 10 (9 to 10) | 7 (6 to 7) | 1267 (1150 to 1383) | 12.8 (12.6 to 13) |
| VIII FFX | 3840x2160 | after | 8 | 6 | 1317 (1267 to 1367) | 12.9 (12.6 to 13.1) |

#### Texture memory (the exact tally of every texStorage, texImage and renderbuffer allocation), MB

| chapter | window | build | textures at the first menu | textures peak (whole run) | render targets | governor resident MB at the end | warm pool MB | art MB fetched | art files |
|---|---|---|---|---|---|---|---|---|---|
| I FFX | 2560x1440 | before | 715 | 1027 | 84 | 412 | - | 244 (237 to 251) | 232 (229 to 235) |
| I FFX | 2560x1440 | after | 1338 (1332 to 1343) | 1371 (1364 to 1377) | 84 | 749 | 337 | 246 (238 to 254) | 234 (230 to 237) |
| IV FFX-2 | 2560x1440 | before | 723 | 906 | 88 | 270 | - | 221 (217 to 224) | 218 (217 to 219) |
| IV FFX-2 | 2560x1440 | after | 1142 | 1145 | 88 | 509 | 239 | 196 (192 to 201) | 210 (207 to 212) |
| VIII FFX | 2560x1440 | before | 540 | 726 | 84 | 260 | - | 218 (215 to 220) | 206 (204 to 207) |
| VIII FFX | 2560x1440 | after | 1054 | 1057 | 84 | 591 | 331 | 221 (221 to 222) | 207 (206 to 208) |
| I FFX | 3840x2160 | before | 1035 | 1349 | 190 | 412 | - | 246 (237 to 256) | 233 (229 to 237) |
| I FFX | 3840x2160 | after | 1653 | 1684 (1668 to 1699) | 190 | 749 | 347 (337 to 356) | 252 (250 to 255) | 238 (236 to 239) |
| IV FFX-2 | 3840x2160 | before | 1052 | 1237 | 198 | 270 | - | 202 (192 to 211) | 210 (206 to 214) |
| IV FFX-2 | 3840x2160 | after | 1471 | 1476 | 198 | 509 | 239 | 200 (195 to 205) | 211 (209 to 212) |
| VIII FFX | 3840x2160 | before | 944 | 1132 | 190 | 260 | - | 212 (210 to 214) | 202 (201 to 203) |
| VIII FFX | 3840x2160 | after | 1458 | 1463 | 190 | 591 | 331 | 221 (217 to 226) | 207 (205 to 209) |

#### Time to the first sharp master (a painting drawn from a master above its base scale) and the swaps

Seconds from the chapter call (the battle starting to build). "upgrades before the first menu" counts the governor swaps that landed during the opening; "in the turns" the ones that landed after it.

| chapter | window | build | first master lands, s | last master lands before the first menu, s | upgrades before the first menu | upgrades in the turns | staged and adopted | warmed | slowest staged ask-to-swap ms |
|---|---|---|---|---|---|---|---|---|---|
| I FFX | 2560x1440 | before | 7.6 (5.9 to 9.3) | 10.2 (7.3 to 13.1) | 37 | 0 | 0 | 0 | - |
| I FFX | 2560x1440 | after | 6.2 (5.4 to 7) | 8.7 (7.4 to 10.1) | 37 | 0 | 40 | 5 (4 to 5) | 1322 (1134 to 1509) |
| IV FFX-2 | 2560x1440 | before | 3.6 (3.2 to 3.9) | 4.7 (4.1 to 5.3) | 28 | 0 | 0 | 0 | - |
| IV FFX-2 | 2560x1440 | after | 4.6 (4.5 to 4.7) | 6.5 (6 to 7.1) | 28 | 0 | 30 | 2 | 1327 (1174 to 1479) |
| VIII FFX | 2560x1440 | before | 3.5 (3.2 to 3.9) | 4.6 (4.3 to 4.9) | 32 | 0 | 0 | 0 | - |
| VIII FFX | 2560x1440 | after | 4.2 (4.2 to 4.2) | 6 (5.9 to 6) | 32 | 0 | 36 | 4 | 1285 (1230 to 1339) |
| I FFX | 3840x2160 | before | 5.5 (4.9 to 6.1) | 6.9 (6.1 to 7.7) | 37 | 0 | 0 | 0 | - |
| I FFX | 3840x2160 | after | 5.8 (5.6 to 6) | 7.8 (7.6 to 8) | 37 | 0 | 40 | 5 | 1331 (1193 to 1469) |
| IV FFX-2 | 3840x2160 | before | 4.6 (4.5 to 4.6) | 5.8 (5.6 to 5.9) | 28 | 0 | 0 | 0 | - |
| IV FFX-2 | 3840x2160 | after | 5.2 (4.7 to 5.6) | 7.5 (6.3 to 8.6) | 28 | 0 | 30 | 2 | 1289 (1219 to 1359) |
| VIII FFX | 3840x2160 | before | 4 (3.8 to 4.3) | 5.2 (4.9 to 5.4) | 32 | 0 | 0 | 0 | - |
| VIII FFX | 3840x2160 | after | 4.6 (4.2 to 5) | 6.4 (6 to 6.8) | 32 | 0 | 36 | 4 | 1560 (1492 to 1628) |

#### The machine during each run (the GPU is shared; nvidia-smi before and after)

| build | runs | GPU util before, % | GPU util after, % | other GPU memory in use before, MB |
|---|---|---|---|---|
| before | 12 | 26 (11 to 56) | 37 (6 to 99) | 8119 (4067 to 10776) |
| after | 12 | 21 (4 to 49) | 45 (3 to 100) | 5919 (4019 to 10536) |

Runs with a console error or a failed request: 0 of 24.


#### Every run

| run (chapter-width-repetition) | build | frames | over 33 ms | over 50 ms | over 100 ms | worst ms | over 50 with a texture upload | GPU use before the run, % | other GPU memory in use, MB |
|---|---|---|---|---|---|---|---|---|---|
| ch1-2560-r1 | after | 1605 | 105 | 75 | 40 | 817 | 6 | 15 | 5323 |
| ch1-2560-r1 | before | 2047 | 28 | 19 | 4 | 167 | 12 | 26 | 8692 |
| ch1-2560-r2 | after | 2118 | 6 | 4 | 1 | 117 | 1 | 40 | 6364 |
| ch1-2560-r2 | before | 1984 | 40 | 29 | 6 | 350 | 14 | 25 | 6250 |
| ch1-3840-r1 | after | 1951 | 45 | 31 | 15 | 433 | 3 | 12 | 4019 |
| ch1-3840-r1 | before | 1994 | 38 | 32 | 9 | 417 | 14 | 42 | 8570 |
| ch1-3840-r2 | after | 2042 | 28 | 20 | 6 | 250 | 1 | 26 | 7315 |
| ch1-3840-r2 | before | 2081 | 20 | 16 | 1 | 217 | 12 | 23 | 6754 |
| ch4-2560-r1 | after | 1124 | 13 | 10 | 4 | 233 | 0 | 14 | 5357 |
| ch4-2560-r1 | before | 998 | 47 | 35 | 17 | 467 | 8 | 11 | 4067 |
| ch4-2560-r2 | after | 1152 | 4 | 3 | 1 | 117 | 0 | 4 | 5473 |
| ch4-2560-r2 | before | 1127 | 16 | 12 | 5 | 283 | 9 | 18 | 5886 |
| ch4-3840-r1 | after | 1028 | 40 | 26 | 14 | 633 | 1 | 11 | 5056 |
| ch4-3840-r1 | before | 1121 | 16 | 13 | 3 | 233 | 7 | 26 | 7854 |
| ch4-3840-r2 | after | 1042 | 30 | 18 | 9 | 617 | 0 | 40 | 9323 |
| ch4-3840-r2 | before | 940 | 38 | 26 | 8 | 900 | 8 | 34 | 9718 |
| ch8-2560-r1 | after | 801 | 15 | 8 | 4 | 167 | 0 | 22 | 5443 |
| ch8-2560-r1 | before | 780 | 15 | 14 | 5 | 150 | 8 | 26 | 5227 |
| ch8-2560-r2 | after | 798 | 12 | 7 | 4 | 167 | 0 | 23 | 7774 |
| ch8-2560-r2 | before | 794 | 14 | 12 | 4 | 133 | 7 | 27 | 8383 |
| ch8-3840-r1 | after | 799 | 12 | 7 | 4 | 183 | 0 | 19 | 7296 |
| ch8-3840-r1 | before | 774 | 16 | 14 | 6 | 150 | 8 | 36 | 8838 |
| ch8-3840-r2 | after | 803 | 9 | 9 | 4 | 150 | 0 | 49 | 10536 |
| ch8-3840-r2 | before | 780 | 15 | 14 | 8 | 217 | 7 | 56 | 10776 |

(Chapter I at 1440p, repetition 1, 39.1: the disturbed run. A later A/B of the staged path against `?stage=off` inside one build at 4K, made after the pause was released, ran on a card at 99 to 100 percent with 15 GB in use and counted 33 to 184 frames over 50 ms in both modes, worst frame 9.3 s: discarded, kept at `runs/contaminated/`; only its texture-attributed counts, 14 to 16 with the swap in place and 0 to 3 staged, agree with the table above.)
