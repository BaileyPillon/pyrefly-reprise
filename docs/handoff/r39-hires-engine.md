# r39-hires-engine: the high-resolution engine (release 39 material)

Date 2026-10-04. Branch `r39-hires-engine` (from `origin/r38-bytes` 61708db6), worktree `D:/pyrefly-r21-road`. Nothing is merged into
`main` and nothing is deployed. Game case: **both games, shared plumbing**; the Bevelle Underground deck is Chapter IV, **FFX-2 only**; the
Fahrenheit's foredeck (Evrae's airship deck, Sin's flight) is **FFX only**; the held-shot sizes the governor plans for are per game (FFX Overdrive
shot, FFX-2 dressphere shot). Bailey, 2026-10-04 ~00:35 EDT, verbatim: "I need super high resolution now. DO NOT hold back. I want the visual
fidelity to be amazing and absolutely beautiful. The critic will ensure this is the case." Paper preflight:
[../plans/r39-hires-engine-review.md](../plans/r39-hires-engine-review.md). Pictures: [../screenshots/r39/](../screenshots/r39/).

## Result

Branch `r39-hires-engine`, code tip **a7c660b4** (the commits on `origin/r38-bytes` 61708db6 listed below, then two docs commits), pushed; nothing is merged and nothing is deployed. Every
priority of the brief is built, measured against the start build and the live site, and gated. Game case: both games, shared plumbing; the
Fahrenheit's foredeck is FFX only (Evrae, Sin's flight) and the Bevelle deck FFX-2 only.

**What changes on screen.** 1440p, the standard camera, the first menu. The number is the screen pixels one texel of the file actually drawn covers
(1.0 is one texel per pixel, lower is sharper). Start build, then this branch:

| | Chapter I (FFX) | Chapter IV (FFX-2) |
|---|---|---|
| backdrop plates | 1.72, then 0.65 | 1.53, then 0.58 |
| the floor, median and worst point | 2.48 and 3.65, then 0.61 and 0.91 (snowfield) | 6.22 and 10.0, then 0.78 and 1.26 (machina deck) |
| the largest figure | 0.62, then 0.31 | 0.89, then 0.45 |
| the same at 4K: plates, floor, figure | 2.57, 3.71, 0.92, then 0.98, 0.93, 0.48 | 2.29, 9.34, 0.70, then 0.87, 1.18, 0.67 |

All 18 listed chapters were swept (every textured plane hidden in turn on a frozen frame, to see which are really seen): the plates go from 1.5 to 2.5 down to 0.58
to 0.93 wherever the library has painted the backdrop's 2x (31 of them so far; Ixion at Djose draws a provisional painting and stays soft); the floors from 1.4 to 2.5 down to 0.4 to
0.6; the parallax bands of the scenes with no depth plates from 2.1 to 3.2 down to 0.8 to 1.2; the Fahrenheit's deck from 3.9 to 1.3 (Sin's, by the same arithmetic, from 2.9 to 1.0).
The held shots: the FFX Overdrive shot magnifies Tidus's approved painting 2.31x at 1440p (3.47x at 4K); the governor takes his 3x master (4x at 4K) and brings it to 0.77 (0.87).
The camera lab's HERO CLOSE on Tidus is 2.84x at 1x and 0.72 from the 4x it picks. Silhouettes get SMAA after the grade.

**What it costs.** The final production build against the start build, paired and interleaved, four rounds, medians (the card is shared with an overnight render job, so a single run swings):
the render itself (a render plus a one-pixel readback) 3.6 ms to 4.3 ms (Chapter I, 1440p), 5.2 to 6.5 (Chapter IV), 7.6 to 7.7 (Chapter I, 4K); for a few seconds after the first menu, while
the other poses come up in the background, a run is sometimes 2 to 3 times slower (the worst 11.6 ms). VRAM once everything has arrived 290 MB to 757 MB (Chapter I, 1440p), 319 to 793 (Chapter IV),
507 to 1044 (4K). Art for a cold first battle: 60 MB to 108 MB by the first menu and 172 MB when the background is done (Chapter I), 56 to 93 to 128 (IV).
First menu, cold, with the prep screens skipped: 15.7 to 19.2 s in Chapter I, 13.6 to 15.1 s in IV (the intro is about 14 s of that); on the project's named network (25 Mbit/s, 20 ms) 22.8 to 35.6 s,
on 100 Mbit/s 16.1 to 20.2 s; a slow link (under 10 Mbit/s as Chromium reports it) starts everything at the approved file (23.6 s on 25 Mbit/s with that rule, measured before the opening-poses change).
The real flow's card, prep and scene screens hide part of this. The phone (390x844, 4x throttle) is unchanged: no plate, floor or AA change there, same 96 MB, about 1 MB more art.

**Found on the way, fixed.** Every battle left its backdrop painting's texture on the GPU, forever (the backdrop released everything but the painting): 22 MB per battle at 2688 px, 84 MB per battle from the 2x
master. It was in the code before this release; the 2x masters made it four times as expensive. Flat at 148 MB at the chapter select across six visits now.

**Gates.** `tsc` clean; the unit suite green (778 files and 11,411 tests; three load-sensitive files, ff7-judge-repair, strategy-ffx2-bahamut and ui-pause-stack, time out inside the full run while a browser and a build share the machine and pass alone); `art-derive verify` PASS (2,562 masters, 0 problems), `art-derive audit` PASS, `art-browser-load` PASS (2,606 of 2,606 images load and decode at the master's size in Chromium and WebKit);
`orphans` lists nothing of this release; the e2e specs boot, chapters, ffx-sin, pause and ffx2-ixion ran against the production build on the real GPU, with real keys and touch through the board, the card, prep and the fight
(Sin and Ixion, desktop and phone): 25 passed, 1 skipped, 2 failed, and both failures are the same on the start build (a stale assertion that the game lists six chapters, and the Yunalesca chain ending after one link);
boot and chapters ran again on the final build: 14 passed, 1 skipped, the same 2 failures. The payload is 8.0 GB shipped (10.2 GB as installed); the largest file is 18.2 MB.

## What is built (one commit per piece)

| | commit | what |
|---|---|---|
| 1a | f61d275c, fab9f6d4 | Backdrop plates at the painting's own width, from the 2x master on a strong desktop; the 1x-4x master contract (manifest, `ArtTier`, `ArtBudget`, `ArtDevice`, `tools/hires-install.mjs`) |
| 1b | 7281a94e | Floors redrawn at the device's resolution (snow 1024/2048/4096, deck 512/2048/4096) |
| 1b+ | a9614881, eba4be89 | The parallax bands at the painting's own scale, the Fahrenheit's deck on its design grid (then 3x on a strong card), and the backdrop painting's texture freed when a battle ends (a leak) |
| 1c | 0fa9a381 | SMAA after the grade (default), 4x MSAA selectable |
| 2 | 22f73968 | The art governor, the plan ahead of the shots, the device budget with eviction, the bounded painting cache, `__pyrefly.art` |
| 2+ | 5b4d42db, be22c89e, f0e22c2b, e64d0105, e62e9c4e, f250fa80, a7c660b4 | Base load held at the base scale and the colossus master planned once the figures are up; the preload fetches the master a battle will draw; time-based persistence; `@3x` derived without flattening the colour under transparent pixels, plates rebuilt after a lost WebGL context; the governor's own CPU in its stats; a slow link starts at the approved file; only the backdrop and the opening poses start at the 2x master, the rest are brought up in the background |
| 3 | this note | The measurements, the crops, this handoff |

### 1a. Plates

`DepthPlates.build` cuts the painting once at the depth map's own 1344x768 and composes the four plates on the GPU
(`PlateCompose.ts`) at the painting's size: 2688x1536 from the approved painting, 5376x3072 when the painting loaded as its `@2x`
master (`backdrops/<key>@2x.png`: strong desktop, buffer from 1440p up). The plate is the painting's own pixels wherever the plate above
does not cover it completely, the cut's push-pull fill where it does, and the cut's alpha: at rest the stack composites to the
2x painting as the old stack did to the approved one. Phone and `low` effects keep their small cuts; with no renderer (unit tests) the
cut runs on the CPU at the approved width. A lost WebGL context rebuilds the composed plates when it is restored (`LivingPaintings.onRestore`).

### 1b. Floors, bands

The snowfield (Chapter I and the rooms that use `Backdrop`'s ground), the machina deck (Chapter IV, FFX-2 only) and the Fahrenheit's foredeck
(Evrae and Sin's flight, FFX only) are procedural canvases written on a design grid, so they are the same drawing through a scale. The snowfield gets one more
octave of fine grain on the big canvases; the decks get none (the machina deck's texture is its bump map). The earlier evidence's floor numbers
(11.6x and 22x) did not divide by the texture's repeat (4 over the snow, 3.25 over the deck); the corrected before-numbers are in the tables.
The parallax bands (`backdrop-layer-N`) were capped at 1536 px: in the scenes with no depth plates they cover the lower half of the frame and were the softest thing in it;
`ArtBudget.bandPx` is 1536 / 1536 / 2688 / 4096 (phone, low, mid, high). The decks are drawn through `ArtBudget.floorDetail`: 1 / 1 / 2 / 3, and 4 on a strong card at 4K (never past the GPU's largest texture). Soft glow planes (rim fire, light shafts, reflections, haze: 256 to 512 px) are left alone:
hiding any of them changes under 2 percent of the frame (`planecheck.mjs`).

### 1c. Anti-aliasing

Paired and interleaved on the RTX 5070 Ti, standard idle camera, high tier (the GPU is shared with the overnight batch, so a single round varies
by a millisecond; the means over three rounds):

| | 1440p frame | 4K frame | GPU at 1440p | GPU at 4K |
|---|---|---|---|---|
| off | 3.68 ms | 6.14 ms | 573 MB | 790 MB |
| SMAA after the grade | 3.74 ms | 6.52 ms | 630 MB (+57) | 917 MB (+127) |
| 4x MSAA on the scene pass | 4.60 ms | 8.03 ms | 784 MB (+211) | 1265 MB (+475) |

Both clean polygon edges (the faceted rocks); SMAA also smooths a figure's texture and rim edges, which MSAA cannot touch; MSAA leaves
painted interiors crisp where SMAA softens the odd thin line. Crops: `aa-*` in the pictures. SMAA is the default on mid and high; a phone and a
software renderer run none. `?aa=off|smaa|msaa` and `Renderer.setAa` override.

### 2. Masters, the governor, the budget

- **Naming and manifest.** `<state>@2x.png`, `@3x.png`, `@4x.png` beside the approved file; `backdrops/<key>@2x.png`. The manifest lists them
  (`subjects[id].tiers`, `backdropTiers`; `states2x` stays); the game never asks for one that is not listed. Install: `node tools/hires-install.mjs`
  (dry run; `--apply`; `--only characters/tidus/`; `--redo3`), then `node tools/gen/manifest.mjs`. `@3x` is derived from `@4x` with colour and alpha resized apart, so the colour ring the 4x keeps under its transparent pixels survives.
- **Device class** (`ArtBudget.classifyDevice`, automatic, no setting, no save key): `phone` (the phone layout), `low` (software renderer),
  `mid` (integrated, unknown, or a discrete GPU the browser says has 4 GB or less), `high` (discrete: NVIDIA, Radeon RX, Apple M, Arc).
  Figure master ceiling 2x / 2x / 2x / 4x; backdrop master 1x / 1x / 1x / 2x; floors 1024+512 / 1024+512 / 2048+2048 / 4096+4096;
  texture budget 220 / 500 / 900 / 2600 MB; AA none / none / SMAA / SMAA.
- **Base scale** (what loads before anything is measured): the 1x file under a 2560 px buffer; from 1440p up the backdrop and the poses the first menu draws
  (`idle*` and `ready`, `ArtTier.isOpeningPose`) load as the 2x master and every other pose as the 1x file, which the governor's sibling rule then brings up to 2x in the background
  once the figure's opening pose is on screen (the standard camera draws a 1x pose at 0.95x or less at 1440p, so nothing is soft at rest in the meantime); and the 1x file for everything on a slow link
  (`ArtDevice.slowLink`: data-saver, 3G or slower, under 10 Mbit/s as Chromium reports it).
- **The governor** (`ArtGovernor.ts`): every frame, each drawn painting's texel is projected through its plane and the camera;
  the smallest master that keeps it under one pixel is asked for, within the class ceiling and the GPU's largest texture. The swap is in
  place on the texture the plane already draws. A need must last 0.3 s; siblings follow a lasting upgrade within budget and never evict;
  over the budget the masters off screen go back to where they started (least recently seen first, nothing seen in the last 0.75 s).
  Its own cost is 0.03 to 0.05 ms per frame.
- **The plan ahead** (`StageArt.ts`): 30 frames after the figures stand, every rig at rest, the held shots by size (FFX Overdrive shot up
  to 0.72 of the frame's height, FFX-2 dressphere shot up to 0.68) and the colossus master (`anticipateView`, called by the MaxMix framing
  when it installs the master). A punch is not chased (it bounces a figure up for a third of a second); a held push is a lasting need.
- **The painting cache** is bounded by decoded megabytes (900) as well as count.

## Measurements

Every number is from headless Chromium on the real GPU (RTX 5070 Ti, ANGLE/D3D11), one browser at a time, Playwright from node. The card was shared with an overnight render job for most of it (87 to 100 percent utilisation, up to 15.6 of 16.3 GB of VRAM), so a single run is not a number to read: the timings are paired and interleaved with the start build and given as means with their ranges, and the third paired session started with the card mostly idle.
"start" is the production build of the starting commit (r38-bytes 61708db6; its render path is origin/main's, the two differ only in the art plumbing), "live" is https://baileypillon.github.io/pyrefly-reprise/ (release 37.1), "r39" is a production build of this branch.
A texel per pixel of 1.0 is one source pixel per screen pixel; the figure column is as drawn from the file that loaded (its scale in brackets). GPU megabytes are an exact tally of every `texStorage`, `texImage` and `renderbufferStorage` call.
Art megabytes before 07:36 on 2026-10-04 were read from the page's resource timing at its default 250-entry buffer, which fills in a busy battle and hides the last requests: they can undercount by up to 3 percent (the later runs raise the buffer).
The harness and every run's result.json, frames and logs are in `D:/Tools/pyrefly-scratch/2026-10-04/hires-engine/` (scratch; not durable); a copy of the harness, the crops, the logs and these notes is parked at `F:/pyrefly-parked/2026-10-04/hires-engine/`. No download was made: the hi-res library was already on disk.

### A. The standard camera (idle rig): texels per pixel, memory, bytes

Plates: median over the four plates. Floor: median / p90 / max of the ground (Chapter I) or the deck (Chapter IV). Figures: the largest of the five (three) on screen, as drawn from the file loaded. The r39 rows are the end state (every pose at 2x, measured on the build that loads them all up front; the final build reaches the same state in the background, A2). Frame cost and first-menu time are in A2: a single run on a card shared with a render job is not a number to read (the same build swings by 8 seconds).

| chapter | res | build | plate px | plate mag | floor px | floor mag med / p90 / max | figure mag max (scale) | GPU tex MB | art MB fetched |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I FFX | 1920×1080 | start (r38-bytes) | 2048 | 1.28 | 1024 | 1.86 / 2.71 / 2.74 | 0.46 (1x) | 198 | 57.5 |
| I FFX | 1920×1080 | r39 (end state: every pose at 2x) | 2688 | 0.98 | 4096 | 0.46 / 0.68 / 0.69 | 0.46 (1x) | 325 | 59.7 |
| I FFX | 2560×1440 | live 37.1 | 2048 | 1.71 | 1024 | 2.46 / 3.58 / 3.63 | 0.62 (1x) | 262 | 78.5 |
| I FFX | 2560×1440 | start (r38-bytes) | 2048 | 1.72 | 1024 | 2.48 / 3.63 / 3.65 | 0.62 (1x) | 262 | 59.7 |
| I FFX | 2560×1440 | r39 (end state: every pose at 2x) | 5376 | 0.65 | 4096 | 0.61 / 0.90 / 0.91 | 0.31 (2x) | 729 | 177.5 |
| I FFX | 3840×2160 | live 37.1 | 2048 | 2.57 | 1024 | 3.71 / 5.42 / 5.49 | 0.93 (1x) | 443 | 78.5 |
| I FFX | 3840×2160 | start (r38-bytes) | 2048 | 2.57 | 1024 | 3.71 / 5.40 / 5.46 | 0.92 (1x) | 443 | 59.7 |
| I FFX | 3840×2160 | r39 (end state: every pose at 2x) | 5376 | 0.98 | 4096 | 0.93 / 1.35 / 1.37 | 0.48 (2x) | 980 | 177.5 |
| IV FFX-2 | 1920×1080 | start (r38-bytes) | 2048 | 1.15 | 512 | 4.72 / 7.06 / 7.58 | 0.67 (1x) | 222 | 49.8 |
| IV FFX-2 | 1920×1080 | r39 (end state: every pose at 2x) | 2688 | 0.90 | 4096 | 0.51 / 0.82 / 0.94 | 0.69 (1x) | 331 | 52.8 |
| IV FFX-2 | 2560×1440 | live 37.1 | 2048 | 1.53 | 512 | 6.14 / 9.26 / 9.99 | 0.90 (1x) | 288 | 74.0 |
| IV FFX-2 | 2560×1440 | start (r38-bytes) | 2048 | 1.53 | 512 | 6.22 / 9.34 / 10.03 | 0.89 (1x) | 288 | 49.8 |
| IV FFX-2 | 2560×1440 | r39 (end state: every pose at 2x) | 5376 | 0.58 | 4096 | 0.78 / 1.17 / 1.26 | 0.45 (2x) | 762 | 132.4 |
| IV FFX-2 | 3840×2160 | live 37.1 | 2048 | 2.36 | 512 | 8.21 / 13.08 / 14.93 | 1.36 (1x) | 476 | 74.0 |
| IV FFX-2 | 3840×2160 | start (r38-bytes) | 2048 | 2.29 | 512 | 9.34 / 14.00 / 14.97 | 0.70 (1x) | 471 | 55.8 |
| IV FFX-2 | 3840×2160 | r39 (end state: every pose at 2x) | 5376 | 0.87 | 4096 | 1.18 / 1.76 / 1.88 | 0.67 (2x) | 1020 | 129.9 |

### A2. Paired and interleaved: the start build and r39, three and four rounds each (idle rig)

Rounds alternate start / r39 on the same server session of the GPU (the card is shared with the overnight batch, so one run varies by a millisecond or two; read the means). Each cell is mean (min to max) over the rounds; session 2 waited for the card to be under 11 GB in use before each run.

| chapter | res | build | first menu s | bench ms (render + readback) | loop fps (uncapped rAF) | art MB fetched | GPU total MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I FFX | 2560×1440 | start (r38-bytes), session 1 | 15.6 (15.4 to 15.7) | 5.56 (5.02 to 5.87) | 393 (357 to 435) | 59 (58 to 60) | 290 (290 to 290) |
| I FFX | 2560×1440 | r39 (the first production build), session 1 | 20.1 (19.8 to 20.3) | 4.02 (3.68 to 4.64) | 353 (283 to 426) | 177 (175 to 178) | 757 (757 to 757) |
| I FFX | 2560×1440 | start (r38-bytes), session 2 | 14.9 (14.6 to 15.5) | 3.45 (3.32 to 3.71) | 441 (405 to 508) | 55 (54 to 58) | 290 (290 to 290) |
| I FFX | 2560×1440 | r39 (every pose at 2x, the build before the last change), session 2 | 19.7 (19.0 to 20.1) | 4.04 (3.59 to 4.59) | 395 (361 to 449) | 172 (171 to 175) | 757 (757 to 757) |
| I FFX | 2560×1440 | start (r38-bytes), session 3 | 15.7 (15.5 to 15.8) | 3.92 (3.31 to 5.19) | 380 (300 to 428) | 60 (60 to 60) | 290 (290 to 290) |
| I FFX | 2560×1440 | r39 (the final production build: opening poses at 2x, the rest brought up in the background), session 3 | 19.2 (17.0 to 21.8) | 5.75 (2.84 to 11.63) | 330 (267 to 364) | 108 (97 to 143) | 562 (498 to 757) |
| IV FFX-2 | 2560×1440 | start (r38-bytes), session 1 | 13.8 (12.7 to 15.1) | 5.92 (4.75 to 6.87) | 277 (241 to 301) | 56 (55 to 58) | 319 (319 to 319) |
| IV FFX-2 | 2560×1440 | r39 (the first production build), session 1 | 15.7 (15.2 to 16.0) | 6.51 (5.15 to 7.66) | 248 (233 to 274) | 128 (123 to 130) | 793 (793 to 793) |
| IV FFX-2 | 2560×1440 | start (r38-bytes), session 2 | 12.6 (12.5 to 12.7) | 4.85 (3.96 to 5.38) | 304 (294 to 324) | 52 (50 to 54) | 319 (319 to 319) |
| IV FFX-2 | 2560×1440 | r39 (every pose at 2x, the build before the last change), session 2 | 15.4 (15.1 to 15.9) | 5.53 (4.35 to 6.37) | 264 (262 to 268) | 128 (126 to 130) | 793 (793 to 793) |
| IV FFX-2 | 2560×1440 | start (r38-bytes), session 3 | 13.6 (12.7 to 14.6) | 5.17 (4.78 to 5.43) | 301 (286 to 322) | 56 (54 to 57) | 319 (319 to 319) |
| IV FFX-2 | 2560×1440 | r39 (the final production build: opening poses at 2x, the rest brought up in the background), session 3 | 15.1 (13.2 to 18.2) | 7.69 (6.31 to 11.49) | 264 (176 to 332) | 93 (77 to 107) | 656 (520 to 793) |
| I FFX | 3840×2160 | start (r38-bytes), session 1 | 16.9 (16.2 to 17.7) | 5.59 (4.91 to 6.25) | 182 (165 to 203) | 58 (58 to 60) | 507 (507 to 507) |
| I FFX | 3840×2160 | r39 (the first production build), session 1 | 27.5 (25.1 to 29.4) | 7.89 (5.42 to 9.98) | 165 (159 to 177) | 178 (177 to 178) | 1044 (1044 to 1044) |
| I FFX | 3840×2160 | start (r38-bytes), session 2 | 16.0 (15.3 to 16.5) | 5.42 (4.29 to 6.75) | 203 (193 to 228) | 55 (54 to 58) | 507 (507 to 507) |
| I FFX | 3840×2160 | r39 (every pose at 2x, the build before the last change), session 2 | 19.8 (19.5 to 20.3) | 6.30 (4.71 to 7.63) | 176 (161 to 193) | 172 (171 to 175) | 1044 (1044 to 1044) |
| I FFX | 3840×2160 | start (r38-bytes), session 3 | 20.9 (16.1 to 30.8) | 7.28 (4.32 to 9.69) | 188 (161 to 199) | 58 (54 to 60) | 507 (507 to 507) |
| I FFX | 3840×2160 | r39 (the final production build: opening poses at 2x, the rest brought up in the background), session 3 | 22.0 (19.4 to 24.4) | 7.78 (5.14 to 10.63) | 163 (125 to 180) | 107 (94 to 143) | 849 (784 to 1044) |

### B. Every standard rig, 1440p: the largest figure magnification (texels per pixel)

| chapter | build | idle | action | party | enemy |
| --- | --- | --- | --- | --- | --- |
| I FFX | start | 0.62 (1x) | 0.70 (1x) | 0.83 (1x) | 0.85 (1x) |
| I FFX | r39 | 0.31 (2x) | 0.35 (2x) | 0.41 (2x) | 0.43 (2x) |
| IV FFX-2 | start | 0.89 (1x) | 0.53 (1/2x) | 0.54 (1/2x) | 0.53 (1/2x) |
| IV FFX-2 | r39 | 0.45 (2x) | 0.46 (2x) | 0.52 (2x) | 0.53 (2x) |

### C. Device classes at 1440p (Chapter I and IV, idle rig)

| chapter | class | plate px | plate mag | floor px | floor max | figure mag max (scale) | GPU tex MB | GPU total MB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I FFX | low | 2688 | 1.31 | 1024 | 3.67 | 0.31 (2x) | 403 | 431 |
| I FFX | mid | 2688 | 1.31 | 2048 | 1.81 | 0.31 (2x) | 476 | 504 |
| I FFX | high | 5376 | 0.65 | 4096 | 0.91 | 0.31 (2x) | 729 | 757 |
| IV FFX-2 | low | 2688 | 1.20 | 512 | 10.03 | 0.46 (2x) | 369 | 401 |
| IV FFX-2 | mid | 2688 | 1.16 | 2048 | 2.53 | 0.45 (2x) | 446 | 477 |
| IV FFX-2 | high | 5376 | 0.58 | 4096 | 1.26 | 0.45 (2x) | 762 | 793 |

### D. A battle at each master scale (every painting pinned to that scale; 1440p, high class)

| chapter | scale | art MB fetched | GPU tex MB | figure mag max | first menu s, mean (min to max) of 3 paired rounds |
| --- | --- | --- | --- | --- | --- |
| I FFX | 1x | 59.7 | 413 | 0.62 | 16.5 (15.6 to 17.7) |
| I FFX | 2x | 177.0 | 729 | 0.31 | 17.7 (17.5 to 17.8) |
| I FFX | 3x | 506.1 | 940 | 0.21 | 21.3 (20.8 to 21.8) |
| I FFX | 4x | 800.7 | 1236 | 0.15 | 25.5 (23.8 to 27.3) |
| IV FFX-2 | 1x | 52.5 | 427 | 0.91 | 13.1 (12.5 to 13.4) |
| IV FFX-2 | 2x | 126.0 | 762 | 0.45 | 15.7 (15.6 to 15.8) |
| IV FFX-2 | 3x | 268.8 | 852 | 0.32 | 17.9 (17.0 to 18.6) |
| IV FFX-2 | 4x | 487.4 | 1009 | 0.24 | 21.7 (18.7 to 27.3) |

### E. The phone (390x844 at ratio 3, 4x CPU throttle)

| chapter | build | plate px | floor px | figure mag max | GPU tex MB | art MB |
| --- | --- | --- | --- | --- | --- | --- |
| I FFX | start | 1024 | 1024 | 0.27 | 96 | 51.8 |
| I FFX | r39 | 1024 | 1024 | 0.27 | 96 | 52.9 |
| IV FFX-2 | start | 1024 | 512 | 0.31 | 94 | 42.3 |
| IV FFX-2 | r39 | 1024 | 512 | 0.32 | 94 | 45.0 |

### E2. The phone, paired and interleaved: the start build and r39, three rounds each (390x844 at ratio 3, 4x CPU throttle)

| chapter | build | first menu s | bench ms (render + readback) | loop fps | GPU tex MB | art MB fetched |
| --- | --- | --- | --- | --- | --- | --- |
| I FFX | start (r38-bytes) | 27.8 (26.3 to 30.0) | 9.07 (7.48 to 10.25) | 50 (43 to 56) | 96 (96 to 96) | 57.7 (56.8 to 59.7) |
| I FFX | r39 | 26.4 (24.8 to 28.5) | 11.04 (8.53 to 13.18) | 58 (47 to 67) | 96 (96 to 96) | 58.4 (57.5 to 59.2) |
| IV FFX-2 | start (r38-bytes) | 19.8 (18.9 to 21.6) | 11.61 (8.24 to 14.25) | 40 (26 to 48) | 96 (94 to 100) | 44.5 (42.3 to 45.6) |
| IV FFX-2 | r39 | 20.6 (19.7 to 22.3) | 16.04 (12.27 to 18.22) | 39 (32 to 43) | 98 (94 to 100) | 46.7 (46.0 to 47.1) |

### F. Every listed chapter, 1440p, idle rig, high class: plates, the largest floor or painting layer, figures, memory, errors

"before" is the start build; "after" is this branch with every master the hi-res library has painted so far installed (dev server, same GPU). Glow, haze, light-shaft and reflection planes are soft by design and left out of the "other" column (a plane that changes under 2 percent of the frame when hidden is not counted either; `planecheck.mjs`). Plate magnification is the median over the four plates; a scene with no depth plates shows its painting and parallax bands in the "other" column. The Zanarkand wet-floor and the Dreams End floor-cracks read 11.7x and 5.4x, but hiding either changes none of the frame (0 percent of pixels over 8 levels: they are dark and under the light of the party), so they were left alone. The Evrae and Sin decks are 3072 x 6144 from the final code (1.27x and about 0.96x); the sweep row shows the painting because it is now the larger.

| chapter | plate px before → after | plate mag before → after | largest other plane before (px, median / max) | after | figure mag max before → after | GPU tex MB before → after | console errors / failed after |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seymour-flux | 2048 → 5376 | 1.72 → 0.65 | ground 1024 px, 2.46 / 3.64 | ground 4096 px, 0.62 / 0.91 | 0.62 → 0.31 | 262 → 729 | 0 / 0 |
| yunalesca | 2048 → 5376 | 1.52 → 0.58 | wet-floor 512 px, 11.61 / 16.20 | wet-floor 512 px, 11.66 / 16.35 | 0.62 → 0.31 | 245 → 554 | 0 / 0 |
| braskas-final-aeon | 2048 → 5376 | 1.62 → 0.62 | floor-cracks 1024 px, 5.34 / 7.27 | floor-cracks 1024 px, 5.36 / 7.30 | 0.60 → 0.30 | 261 → 666 | 0 / 0 |
| ffx2-bahamut | 2048 → 5376 | 1.58 → 0.60 | machina-deck 512 px, 5.48 / 9.99 | machina-deck 4096 px, 0.69 / 1.24 | 0.46 → 0.46 | 283 → 762 | 0 / 0 |
| ffx2-vegnagun-shuyin | 2048 → 5376 | 2.45 → 0.93 | backdrop-layer-0 1536 px, 3.17 / 3.47 | backdrop-layer-0 4096 px, 1.19 / 1.30 | 0.85 → 0.85 | 275 → 718 | 0 / 0 |
| ffx2-leblanc | 2048 → 5376 | 1.61 → 0.61 | ground 1024 px, 2.26 / 3.54 | ground 4096 px, 0.56 / 0.89 | 0.52 → 0.26 | 236 → 655 | 0 / 0 |
| seymour-anima-macalania | 2048 → 5376 | 1.58 → 0.60 | ground 1024 px, 1.75 / 2.59 | ground 4096 px, 0.44 / 0.65 | 0.51 → 0.26 | 249 → 680 | 0 / 0 |
| evrae-airship | - → - | - → - | deck 1024 px, 3.88 / 5.27 | backdrop-painting 2688 px, 1.43 / 1.58 | 0.55 → 0.56 | 222 → 378 | 0 / 0 |
| yojimbo-cavern | - → - | - → - | ground 1024 px, 1.39 / 1.97 | backdrop-painting 5376 px, 0.61 / 0.64 | 0.43 → 0.22 | 232 → 556 | 0 / 0 |
| seymour-natus | - → - | - → - | backdrop-layer-0 1536 px, 2.13 / 2.26 | backdrop-layer-0 4096 px, 0.80 / 0.85 | 0.42 → 0.21 | 217 → 533 | 0 / 0 |
| ffx2-fallen-aeons | - → - | - → - | backdrop-layer-0 1536 px, 2.84 / 3.03 | backdrop-layer-0 4096 px, 1.06 / 1.13 | 0.51 → 0.25 | 223 → 529 | 0 / 0 |
| seymour-omnis | 2048 → 5376 | 1.63 → 0.62 | ground 1024 px, 1.79 / 2.45 | ground 4096 px, 0.45 / 0.61 | 0.62 → 0.31 | 236 → 640 | 0 / 0 |
| ffx2-trema | 2048 → 5376 | 1.59 → 0.61 | ground 1024 px, 2.12 / 3.31 | ground 4096 px, 0.52 / 0.83 | 0.51 → 0.31 | 243 → 625 | 0 / 0 |
| isaaru-via-purifico | 2048 → 5376 | 1.58 → 0.60 | ground 1024 px, 1.73 / 2.60 | ground 4096 px, 0.42 / 0.64 | 0.51 → 0.26 | 261 → 669 | 0 / 0 |
| ffx2-den-of-woe | 2048 → 5376 | 1.87 → 0.71 | - | - | 0.46 → 0.23 | 237 → 625 | 0 / 0 |
| ffx2-ixion-djose | 2048 → 5376 | 16.01 → 6.06 | - | - | 0.46 → 0.34 | 234 → 511 | 0 / 0 |
| sin-fins-core | - → - | - → - | deck 1024 px, 2.86 / 3.47 | backdrop-painting 2688 px, 1.28 / 1.31 | 0.54 → 0.54 | 225 → 393 | 0 / 0 |
| sin-face | - → - | - → - | deck 1024 px, 2.87 / 3.48 | backdrop-painting 2688 px, 1.28 / 1.32 | 0.55 → 0.55 | 248 → 382 | 0 / 0 |

### G. The held shots, by size (the Overdrive shot up to 0.72 of the frame height in FFX, the dressphere shot up to 0.68 in FFX-2): what the approved painting would be magnified to, and the master that keeps it under one texel per pixel

The worst pose of each figure (the shortest painted height in approved texels), at the largest held-shot size. "mag 1x" is screen pixels per approved texel; the master is the smallest of 2x, 3x, 4x that brings it to one or under (with the governor's 4 percent margin), and "mag there" is what is left.

| chapter | figure | shortest painted height (texels) | size | mag 1x at 1440p | master | mag there | mag 1x at 4K | master | mag there |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I FFX | tidus | 448 | 0.72 | 2.31 | 3x | 0.77 | 3.47 | 4x | 0.87 |
| I FFX | yuna | 653 | 0.72 | 1.59 | 2x | 0.79 | 2.38 | 3x | 0.79 |
| I FFX | kimahri | 772 | 0.72 | 1.34 | 2x | 0.67 | 2.01 | 3x | 0.67 |
| IV FFX-2 | yuna-white-mage | 569 | 0.68 | 1.72 | 2x | 0.86 | 2.58 | 3x | 0.86 |
| IV FFX-2 | rikku-dark-knight | 833 | 0.68 | 1.18 | 2x | 0.59 | 1.76 | 2x | 0.88 |
| IV FFX-2 | paine-warrior | 805 | 0.68 | 1.22 | 2x | 0.61 | 1.82 | 2x | 0.91 |

### H. The cold first battle on a real link (Chapter I, 1440p, the prep screens skipped; Chromium network emulation, 20 ms latency)

One run each, so read the gap, not the second. "slow-link rule" is the build with every pose at 2x and `?artlink=slow`, which is what Chromium's own connection reading would choose on a link this slow (data-saver, 3G or under 10 Mbit/s). The "art MB fetched" of a run that brings poses up in the background is what had arrived when the first menu was measured, not what it will have fetched a minute later.

| link | build | art MB fetched | first menu s |
| --- | --- | --- | --- |
| 100 Mbit/s | start (r38-bytes) | 60.4 | 16.1 |
| 100 Mbit/s | this branch with every pose at 2x (the build before the last change) | 178.2 | 24.2 |
| 100 Mbit/s | this branch, final: opening poses at 2x, the rest in the background | 142.9 | 20.2 |
| 100 Mbit/s | this branch with every pose at 2x, slow-link rule | 96.6 | 17.1 |
| 25 Mbit/s | start (r38-bytes) | 60.4 | 22.8 |
| 25 Mbit/s | this branch with every pose at 2x (the build before the last change) | 178.2 | 50.5 |
| 25 Mbit/s | this branch, final: opening poses at 2x, the rest in the background | 122.0 | 35.6 |
| 25 Mbit/s | this branch with every pose at 2x, slow-link rule | 76.7 | 23.6 |


## Pictures (docs/screenshots/r39/, JPEG, 1:1 unless a zoom is named; before = the start build, after = this branch)

| file | what it shows |
|---|---|
| 01, 02 | Chapter I at 1440p: the moon and the mountain plates, before and after (2688 px painting cut at 2048, then the 2x master's 5376 px plates) |
| 03 | Chapter I at 4K: the same plates, before and after |
| 04 | Chapter III (Zanarkand dome) at 1440p: Yunalesca and the dome's plates, before and after |
| 05, 06 | Floors at 1440p, contrast raised: the snowfield and the machina deck as the start build drew them, and from the mid (2048) and high (4096) canvases |
| 07 | The Fahrenheit's deck at 1440p, before and after (1024 x 2048 canvas, then 3072 x 6144) |
| 08 | Tidus at 4K, before and after, at 2x zoom |
| 09 | The camera lab's HERO CLOSE on Tidus at 1440p from the 1x, 2x, 3x and 4x file (the governor picks the 4x) |
| 10 | Tidus's idle face from each file, at the same size on screen (3x zoom, nearest) |
| 11, 12, 13 | Silhouettes at 1440p and 4K, 4x zoom, three panels each: no anti-aliasing, SMAA, 4x MSAA |
| 14, 15 | Every listed chapter at 1440p, the start build and this branch (contact sheets; a frame is not frozen to the same instant, so figures differ by an animation step) |

## Decisions for Bailey

1. **Ship the masters as PNG or as lossless WebP?** Release 38's rule ships a master as lossless WebP only where every decoder draws the same pixels (opaque, or alpha only 0 and 255).
   The hi-res masters have a smooth, partly transparent silhouette by design, so under the `exact` default every figure master ships as a PNG recompressed at maximum effort (about 6 percent smaller than the library's).
   The measured payload of the final build (`dist-final`): **8.0 GB** (approved paintings 433 MB; 2x masters 1.63 GB, 3x 2.30 GB, 4x 3.63 GB; the largest single file is 18.2 MB, so nothing nears Cloudflare Pages' 25 MiB limit).
   The same masters as lossless WebP are about 5.5 times smaller (the library's own numbers: the 4x figure masters 3,765 MB as PNG and 670 MB as WebP, the 2x set 1,116 MB against 175 MB), which would bring the payload under 2.5 GB.
   Cloudflare lifts the size cap, so exactness can stay the rule; WebP for masters needs the decoder-agreement question answered first (`PYREFLY_ART_WEBP=all` plus `art-derive verify --allow-inexact` measures it).
2. **How early do the masters load?** (built; yours to change) From a 2560 px buffer up the backdrop and the poses the first menu draws (`idle*`, `ready`) load as the 2x master; every other pose loads as the approved file and the art
   governor brings it up to 2x in the background during the intro (two loads at a time, never evicting; `ArtTier.isOpeningPose` and the governor's sibling rule). The first version of this release loaded every pose at 2x, which made a cold
   first battle 3x the bytes (Chapter I 59 MB to 172 MB) and 22.8 s to 50.5 s on the project's named network (25 Mbit/s, 20 ms, prep screens skipped). Now, measured against the start build:
   Chapter I 60 MB to 108 MB by the first menu (172 MB when the background is done) and 15.7 s to 19.2 s; Chapter IV 56 to 93 MB and 13.6 s to 15.1 s; on 25 Mbit/s 22.8 s to 35.6 s, on 100 Mbit/s 16.1 s to 20.2 s.
   A **slow connection** (data-saver, 3G, or under 10 Mbit/s as Chromium reports it; Safari and Firefox do not report it) starts everything at the approved file (`ArtDevice.slowLink`, `?artlink=slow`): 23.6 s on 25 Mbit/s, measured before the opening-poses rule.
   What is left of the cost is the backdrop's 2x master (26 MB, the largest single file and the largest visible gain) and the opening poses' masters (about 20 MB). The alternative I did not build: plates composed from the approved painting first and
   rebuilt from the 2x master once it lands (a visible sharpening of the backdrop 10 to 30 s into the battle). The real flow's card, prep and scene screens hide part of the cost. The constant is `BASE_BUFFER_WIDTH` in `ArtBudget.ts`.
3. **Which anti-aliasing?** SMAA after the grade (default, nearly free). 4x MSAA is built and selectable (`?aa=msaa`): crisper painted interiors, +0.9 ms at 1440p and +211 MB. Say if you want MSAA on the top class.
4. **Which devices are "high"?** A discrete GPU the browser names (NVIDIA, Radeon RX, Apple M, Arc) with more than 4 GB of memory reported: masters to 4x, 2x plates, 4096 floors and bands, 2.6 GB of figure textures.
   Everything the browser does not name reads as "mid" (2x masters, native plates, 2048 floors, 2688 bands). If a discrete card should read as mid, or the reverse, the table is `ArtBudget.ts`.
5. **Backdrops stop at 2x.** A 4x backdrop master is 264 MB of GPU for one plate and 65 MB as a file; the library has two (Gagazet, Bevelle Underground) and the installer skips them.
6. **The floors are the same drawing, sharper, not a new floor.** The snowfield, the machina deck and the Fahrenheit's foredeck are drawn on their design grid through a scale. Their seams, rivets and lettering are crisper and nothing else changed; the deck's panel seams are faint in the frame, so its gain is crispness more than new detail. If you want a floor richer (visible plating, a lit reflection), that is a look decision and needs options.
7. **The 3x tier costs 2.3 GB of the 8.0 GB shipped** (523 files; it is derived here from the 4x, not painted). It buys 44 percent less GPU memory than 4x for the shots that need 2.0 to 3.0 texels per pixel (the Overdrive and dressphere shots on a 1440p screen). Skipping it (`--scales 2,4` to the installer) leaves 2x then 4x: a close shot pays a 4x master (about 1.8x the memory of a 3x). Your call; I kept it because the brief names the four tiers.
8. **Scenes that are still provisional.** Ixion at Djose draws a provisional backdrop (`djose-chamber-provisional`); its depth plate nearest the camera is a perspective floor cut from the painting and stays 6x magnified even from the 2x master (16x before). It needs the final painting, not more resolution. Soft glow planes (rim fire, light shafts, reflections, haze: 256 to 512 px) are left alone by design: hiding them changes under 2 percent of the frame.
9. **D: space.** The installer derived 523 `@3x` files (a real PNG each, 3.4 GB as written) and hard-linked the rest; D: has 94 GB free (it was 95 percent full). `D:/Tools/pyrefly-art-cache` now holds the derivations of the whole set (the Cloudflare lane's build reuses them).

## Owed, and not done

- **The library is still being painted.** The overnight batch has about 650 jobs in its worklist; the installer is idempotent, so re-run `node tools/hires-install.mjs --apply` and `node tools/gen/manifest.mjs` when it finishes (this branch was measured with 523 figure poses at 2x, 3x and 4x and 31 backdrops at 2x installed). A painting without a master simply draws at 1x. `public/art` is gitignored: nothing of the masters is in a commit.
- **The deploy.** Nothing here deploys; `tools/deploy-pages.mjs` and the critic runners were not touched. The full set ships at 8.0 GB, so the Cloudflare lane owns the upload. `node tools/art-derive.mjs warm` has already been run over the whole set (the cache `D:/Tools/pyrefly-art-cache` holds all 2,562 derivations, 2,269 s at `--jobs 3`), so that lane's build takes minutes. The critic plan for this branch is DEEP (focused before a deploy, deep after).
- **Plates and floors are decided when a battle is built.** A window that is resized across 1440p mid-battle keeps the plates and floors it was built with (the figures follow the governor live). The next battle is built at the new size.
- **Held shots in the camera lab.** Its close shots (HERO CLOSE, TARGET, CASTER LOW) live on another branch; they get their masters through the governor's live path today and should call `anticipateView({ pos, look, fov })` when a command is chosen so the master is resident at the cut.
- **The backdrop's 2x master is still in the base load** (decision 2): the opening poses and the backdrop start at 2x, every other pose is brought up in the background. A base load of the approved backdrop with a rebuild of the plates from the 2x master after the first menu is not built.
- **A pose drawn before its upgrade lands** (the first seconds, or a slow link) shows at the approved file and sharpens when its master swaps in; the popcheck measured the swap at 1 to 2.5 levels mean over a figure's box.
- **Not measured:** Safari and iOS (Playwright's WebKit only, through the load gate), an integrated GPU (the class table is reasoned, the numbers are the discrete card's), a real network (the bytes are exact, the times are a local server's), and a card with nothing else on it: most timings here were taken while an overnight render job held the GPU (87 to 100 percent, up to 15.6 of 16.3 GB of VRAM), which is why identical 4K runs swing by 8 s; the last paired session started with the card mostly idle.
- **A real-input pass over every chapter** was not run; the harness enters each chapter through `gotoChapter` (the same code path as the chapter select, minus the prep screens). The e2e specs boot, chapters, ffx-sin, pause and ffx2-ixion were run against the production build just before the opening-poses change (25 passed, 2 failed that fail the same on the start build), and boot and chapters again on the final build. Running them rewrites tracked screenshots under `docs/screenshots/` in the worktree (`00-demo-scene.png`, `chapter-ixion/listed/`, `sin/listed/`): those changes are left unstaged and are not part of any commit.

## How to run it again

```
cd D:\pyrefly-r21-road        (worktree on r39-hires-engine; node_modules is a junction, public/art a hard-link farm of the library)
node tools/hires-install.mjs ; node tools/hires-install.mjs --apply ; node tools/gen/manifest.mjs       (dry run first; idempotent; --redo3 re-derives every @3x)
node node_modules/vite/bin/vite.js --config .r39-vite-tmp.config.mjs --port 6920                       (dev; stop it by its PID after)
http://127.0.0.1:6920/?arttier=high&artscale=2&aa=smaa&artlink=fast                                    (force a class, pin a scale, pick the AA, the connection)
window.__pyrefly.art.stats() / .rigs() / .shots() / .plan()
harness: D:/Tools/pyrefly-scratch/2026-10-04/hires-engine/harness/   (capture, planecheck, aabench, govtest, closeup, rigs, shots, loadtimeline, tables, run-*.sh)
gates:   node tools/art-derive.mjs verify --dir <dist> ; node tools/art-derive.mjs audit --dir <dist> ; node tools/art-browser-load.mjs --dir <dist>
builds:  D:/Tools/pyrefly-scratch/2026-10-04/hires-engine/dist-final3 is the final production build, dist-before the start build (node node_modules/vite/bin/vite.js preview --outDir <dir> --port 6925);
         the two earlier r39 builds are parked under F:/pyrefly-parked/2026-10-04/hires-engine/dist/
```

## Merge with release 38 (branch `r39-int`, 2026-10-04)

Integrator pass by a Sonnet sub-agent of the driver session, worktree `D:/pyrefly-r39-int` (sparse: no `docs/screenshots`; branch `r39-int` from this branch's tip d6810315).
Bailey's words, 2026-10-04: "I need super high resolution now. DO NOT hold back. I want the visual fidelity to be amazing and absolutely beautiful. The critic will
ensure this is the case." and "continue on until I reach my usage limit". Release 38 is live (main **4a401c13**, bundle DHaa2xD1, which contains 6461999e); this branch
was cut from r38-bytes 61708db6, the first of release 38's merges, so the merge brings in the rest of release 38: r38-advisor-card, r38-polish, r38-bushido, r38-pushin,
r38-keys, r38-rename, r38-restage, r38-motion, the art install, r38-keyart-fix, r38-evrae, r38-wings and the records (365 files, 24,095 insertions; nothing under `public/`).
**Nothing here is deployed, nothing is merged into `main`, and no release was cut**: release 39 waits for Bailey's picks (masters format, the 3x tier, anti-aliasing,
the close-up route) and for Cloudflare. Game case: both games, shared plumbing; the per-item cases of release 38's own lanes are unchanged (Evrae E1-H FFX only, the plate
wings FFX-2 only, SKILL TRAVEL both, the run-in FFX-2 only, the slots FFX only).

### The merge (`git merge --no-ff origin/main`): one conflict, seven files edited by both sides

Both sides edited 7 files; git merged 6 by itself and I read each result. The seventh conflicted.

| File | What each side did | Result |
|---|---|---|
| `src/engine/BattlePresenterStage.ts` | **CONFLICT.** This branch ended the constructor with `this.art = new StageArt({...})` (release 39: the master each figure draws, measured against the camera, `StageArt.ts`). `origin/main` ended it with `this.motion = new StageMotion({...})` and added the `smearWarmId()` method after it (r38-motion: SKILL TRAVEL and the FFX-2 run-in). Both appended at the same place, so the hunks collided. | **Both kept**, in that order: `this.art = ...`, then `this.motion = ...`, the constructor's closing brace, a blank line, `smearWarmId()`. A resolver script (`D:/Tools/pyrefly-scratch/2026-10-04/r39-int/resolve-stage.mjs`, CRLF kept, refusing any other shape) did it; the file is 904 lines (`git diff HEAD` on it is 30 lines, main's `StageMotion` block and `smearWarmId` only). Neither field depends on the other (`StageArt` reads `actors`, `camera`, `canvas`, `battleCamera`; `StageMotion` reads the scene, the quads and the comfort flags). |
| `src/engine/fx/mix/framing.ts` | This branch: `import { anticipateView } from '../../StageArt.ts'` and one call after `this.masterPose = d.pose` in `commit` (the colossus master is planned once the figures are up). Main: the chapter's slots (`stageTable.ts`, `side` on `Decision`, `staging.hold`, `readStand`) in about 25 places. | Merged by git, no overlap. **The file is now 400 lines (main's was 398): zero headroom; the next change there must extract first** (r38's note said the same at 398). |
| `src/main.ts` | This branch: `installArtDebug` (`__pyrefly.art`) next to `installFxDebug`. Main: the fatal screen's title, "Echoes of Spira" (r38-rename). | Merged by git; disjoint hunks. |
| `src/app/screens/BattleScreen.ts` | This branch: `renderer: this.app.renderer.renderer` added to `bindLivingScene`'s argument (the plates are composed on the GPU). Main: `markOpeningHurried` and `markOpeningBegun` (FOC371-01, Chapter IX's arrival). | Merged by git; neighbouring lines, no overlap. The file is 929 lines (main's number). |
| `src/engine/Backdrop.ts` | This branch: `bandPx` for the parallax bands, `groundPx` for the floor, the painting's texture freed with the backdrop. Main: `adoptTexture(tex)` (r38-wings). | Merged by git. They fit together: the painted wing strips are adopted by `adoptTexture`, the painting's own texture is in `ownedTextures` from `create`, and `dispose` frees both. 513 lines. |
| `src/scenes/bevelle-underground.ts` | This branch: `deckCanvas(px)` drawn through a scale, `artBudget().deckPx` (FFX-2 only). Main: `BEVELLE_PLATE_WINGS.painted` and `await paintPlateWings(...)` after `addPlateWings` in both build paths (r38-wings, FFX-2 only). | Merged by git; disjoint hunks. The wings' geometry is world units from the plate mesh's own width and a constant `plateWidthPx: 2688` for the strip art, so a plate drawn from the 2x master (5376 px) leaves the wings where they were; the strips are 1x (716 px) beside a 2x plate, so they are the softer part of the frame at the edges (a look note for the critic, not a break). |
| `docs/DEV.md` | Both added sections. | Merged by git. |

`git diff --stat` of the merge against this branch: 365 files changed by main's side alone, none under `public/`. `npx tsc --noEmit`: clean (exit 0, empty output) on the merge with the conflict resolved.
`docs/handoff/NOW.md` is main's committed text (this branch never touched it); the shared tree's own uncommitted edits to it are not part of any commit here.

### The art install on the merged tree (the library has grown since this branch was measured)

`D:/pyrefly-r39-int/public/art` is a **real folder** (never a junction): the shared tree's `public/art` as of main 4a401c13 (release 38's install and the Evrae E1-H paintings; robocopy `/E`,
2,090 files, 936.6 MB) plus the hi-res masters, then `public/fx` restored from the backup (`fx-assets restore` 24 files, `verify` PASS). The library
(`D:/Tools/pyrefly-art-backup/hires`, 760 assets: 201 refined, 553 base, 6 flagged; its batch is **paused** by the STOP file, which I did not touch) installs through
`node tools/hires-install.mjs --apply` (the library's own `manifest.json` names the file at each path, so an asset the batch refined since this branch was measured installs as its
refined master, and an asset it has not refined yet installs as its base master), then `node tools/gen/manifest.mjs`.

| What | Result |
|---|---|
| The plain run | 1,914 files written in 4 min 18 s: **1,291 hard links** (no extra bytes) and **623 `@3x` derived** from the `@4x`; 11.63 GB as written. Skipped 64: 48 already installed (the approved pilot `@2x` masters stay), 10 `1x painting changed since the master was rendered` (all Evrae: the E1-H repaint changed the 1x files the library rendered from; Evrae keeps its approved E1-H `idle@2x` and no other master, a re-render of Evrae from the new paintings is owed), 6 flagged (`evrae/idle-far`, portraits `overdrive-sin`, `sin-core`, `sinspawn-genais`, `valefor`, pause `ch15-ffx2-den-of-woe`) |
| **Parked, not kept (a finding)** | The plain run also installs the library's `pause/<name>@4x.png` (31), `portraits/<name>@2x.png` (41) and `title/<name>@2x.png` (1), and derives a `@3x` from each pause `@4x` (31): **104 files, 1,407 MB, which no loader reads** (the manifest and `ArtTier` know only `characters/<id>/<state>@Nx.png` and `backdrops/<id>@Nx.png`; the pause screen's retina plate is `<id>.2x.webp`). The Vite build copies `public/` whole, so they would ship as dead bytes, and **three pause `@3x` are over Cloudflare's 25 MiB per-file limit as written** (26.97, 26.42 and 26.33 MB). I moved all 104 (verified copy, then the name dropped; the 73 hard links' data stays in the library) to `F:/pyrefly-parked/2026-10-04/r39-int/unreferenced-masters/` (log `D:/Tools/pyrefly-scratch/2026-10-04/r39-int/park-unreferenced.json`). **Install only what a loader reads: `node tools/hires-install.mjs --apply --only characters/,backdrops/`** (a dry run of that on this tree says 0 to install; a plain dry run says 104). A caution is now in `docs/ART-PIPELINE.md`; making that the installer's default is a code change I did not make |
| **Installed and kept** | **1,810 files, 10.16 GB as written** (the 592 `@3x` are the only new bytes on disk): `@2x` 626 files 1.656 GB (444 base, 182 refined; 597 characters 1.214 GB and 29 backdrops 441.9 MB), `@3x` 592 files 4.004 GB (396 base, 196 refined), `@4x` 592 files 4.497 GB (396 base, 196 refined). By asset: 660 library assets got files, **461 base and 199 refined**. Manifest: 101 subjects with `tiers` (592 poses at 3x and 4x, 647 at 2x counting the pilots), 29 `backdropTiers`, `pause2x` 31 and `title2x` 1 unchanged; `manifest.mjs --check` unchanged |
| Approved art | `verify-approved.mjs` with `ROOT=D:/pyrefly-r39-int`: **759 ok (711 approved, 48 judge-locked), 0 mismatched, 0 missing**, the same 759 as the shared tree at main 4a401c13 (the Evrae E1-H set included); no 1x painting was touched (the installer only adds files) |

### Gates on the merged tree (gate numbers; the build gates are in the next block)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean after the merge and again at this tip (exit 0, empty output) |
| Full suite `vitest run --testTimeout=60000 --maxWorkers=3` (log `D:/Tools/pyrefly-scratch/2026-10-04/r39-int/logs/full-suite.log`) | **802 files passed, 5 skipped (807); 11,818 tests passed, 46 skipped, 1 todo (11,865); 0 failed; exit 0; 601.8 s**, with the real `public/art` (the three art-dependent files pass here). None of the four known load timeouts (`strategy-ffx2-bahamut`, `sin-fins-core-bench`, `ui-pause-stack`, `critic-release-rules`) fired. Against release 38's tip (798 files, 11,754 tests): **+4 files and +64 tests**, all this branch's (`r39-art-governor`, `r39-art-tiers`, `r39-hires-install`, `r39-preload-masters`) |
| `node tools/orphans.mjs` | 1,229 modules, 1,205 reachable, **24 orphaned**: the same 24 as release 38 (1,220 / 1,196 / 24); this branch's new modules (`ArtBudget`, `ArtDevice`, `ArtGovernor`, `ArtManifestTiers`, `ArtMeasure`, `PostAa`, `StageArt`, `PlateCompose`, `artApi`) are all reachable |
| `node tools/audio/qa.mjs --strict` | exit 0, 0 cues and 0 sfx with findings; 88.49 MB of the 90 MB budget (unchanged) |
### Build gates and measurements on the merged build (branch `r39-int`, 2026-10-04; both games, shared plumbing)

Production build of the merged tree with the real art, into `D:/Tools/pyrefly-scratch/2026-10-04/r39-int/build` (vite 914 s, 0 source maps). The live build for comparison is
release 38's artifact (main 6461999e, bundle DHaa2xD1, `D:/pyrefly-rel38/dist-release`, served under `/pyrefly-reprise/`). Both served by `harness/serve.mjs` on 7052 (live) and 7050
(this build). Headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`), Playwright from node, never the browser pane.

| Gate | Result |
|---|---|
| `fx-assets verify` | PASS |
| `art-derive verify` (exact) | PASS: 2,815 masters (568 WebP, 2,247 PNG, 2,670 pixel-compared), 0 problems, 222 s |
| `art-derive audit` | PASS: 832 text files, 582 literal art names in the bundle (14 shipped files, 568 derived masters, 0 dangling) |
| `art-browser-load` | PASS: 2,815 art files + 44 other images, 2,859 of 2,859 loaded and decoded at the master's size in Chromium 153 and WebKit 26.6, 0 failed |
| Cloudflare limits (`harness/cf-limits.mjs`; 25 MiB per file, 20,000 files free plan) | **3,742 files** (headroom 16,258); **largest file 19,059,770 bytes = 18.18 MiB** (`art/characters/x2-anima/overdrive@4x.png`), headroom 7.15 MB under 25 MiB (26,214,400); 0 files over the limit. No total-size limit on Cloudflare |
| Bytes, counted as the deploy counts them (`harness/bytes-manifest.mjs`, repo `buildManifest`, rerun after the handoff kill, 1,400 s) | **9,129,027,809 bytes shipped** (9,128,484,395 of 3,742 files + `artifact-manifest.json` 543,414; 3,744 files with the manifest and `.nojekyll`), artifact hash 957ccbb2. Decode-checked, 0 audio unverified, 0 problems after the 4 listed flat images. **Over the 800,000,000-byte line (D-332, D-344) by 8,329,027,809 bytes (11.4 times the line); the exit is 1 on that alone.** Release 38's live build counted 798,696,333 |

Bytes by tier (shipped files, MB = 1e6): 1x art 491.5 MB (571 WebP 311.8 + 416 PNG 176.2 + 815 json 3.5); **@2x 1,688.4 MB** (647 PNG 1,358.2 + 29 WebP backdrops 330.2); **@3x 2,664.6 MB** (592 PNG);
**@4x 4,188.9 MB** (592 PNG); audio 88.5 MB (29 files); code and other 6.6 MB (51 files). By extension: PNG 2,259 files 8,388.9 MB, WebP 600 files 642.1 MB, mp3 28 files 88.5 MB, js 3 files 4.9 MB.

Texels per pixel at 1440p (2560x1440, dpr 1, standard idle rig, high class, Chapter I = FFX, Chapter IV = FFX-2; `harness/capture.mjs --rigs idle --no-bench`, one run each; tag `tx-live`/`tx-new`).
The in-page reading is "mag" = pixels one texel covers; **texels per pixel = 1 / mag** (more is sharper; below 1 the paint is stretched). Live 6461999e -> this build:

| Item | Live: file, texels per pixel | This build: file, texels per pixel |
|---|---|---|
| Ch I backdrop plate (median) | 2048x1170, 0.58 | 2688x1536, 0.77 |
| Ch I floor (median / p90) | 1024x1024, 0.40 / 0.28 | 4096x4096, 1.61 / 1.10 |
| Ch I largest figure, Seymour Flux (0.40 of the frame height) | 1500x2422 (2x), 4.05 | 750x1211 (1x), 2.03 |
| Ch I weakest figure, Tidus | 673x766, 1.62 | 1346x1532 (2x), 3.24 |
| Ch IV backdrop plate (median) | 2048x1170, 0.65 | 2688x1536, 0.86 |
| Ch IV deck floor (median / p90) | 512x512, 0.16 / 0.11 | 4096x4096, 1.27 / 0.85 |
| Ch IV largest figure, Bahamut (0.62) | 2048x2048, 2.23 | 2048x2048, 2.24 |
| Ch IV second Bahamut painting (0.57) | 1097x948, 1.12 | 2194x1896, 2.24 |
| Ch IV weakest figure, Paine | 816x2360, 5.81 | 408x1180, 2.92 |

Reading: the plates and floors, which were 0.16 to 0.66 texels per pixel (stretched), are now 0.77 to 1.61; the floors rose 4 to 8 times. Figures are held at about 2 to 4 texels per
pixel: the governor brings the weak ones up (Tidus 1.62 -> 3.24, Bahamut's second painting 1.12 -> 2.24) and, past the budget's need, takes the over-supplied ones down (Seymour Flux
4.05 -> 2.03, Mortiorchis 5.08 -> 2.54, Paine 5.81 -> 2.92; their 2x masters stay installed; this run did not test a closer shot). Plates and floors are the surfaces that were
below one texel per pixel, and they remain the softest items (the plate is 0.77 to 0.87 at 1440p; the deck-reflection plane is a 512 px glow plane left alone on purpose).

GPU memory after the first menu (the harness's exact allocation tally; deterministic, not a timing reading): Ch I 350.3 MB -> 502.8 MB (textures 322.1 -> 474.7); Ch IV 327.5 MB -> 509.7 MB (295.8 -> 478.0).
Art bytes fetched by the cold first menu (2560x1440): Ch I 77.2 MB -> 105.2 MB; Ch IV 73.9 MB -> 90.9 MB. Cold first menu (walk from the title, one run each, **not a quiet-machine reading**: another
lane was hashing and other agents were live): Ch I 18.5 s -> 19.1 s, Ch IV 15.7 s -> 14.9 s.

Real-key turns on this build (`harness/turns.mjs`, one turn per chapter: Attack in Ch I and VIII, White Magic > Shell in Ch IV, then the next actor's menu; every one took the turn and opened the next menu):

| Size | Console errors | Non-2xx responses | Aborted requests (`requestFailed`) |
|---|---|---|---|
| 1600x900, Ch I, IV, VIII | 0, 0, 0 | 0, 0, 0 | 1, 0, 0 |
| 2560x1440, Ch I, IV, VIII | 0, 0, 0 | 0, 0, 0 | 0, 6, 0 |
| 2560x1440 first-menu frames, Ch II, IX, XV (no turn) | 0, 0, 0 | 0, 0, 0 | 0, 8, 10 |

The aborted requests are `net::ERR_ABORTED` on warm-up fetches of other chapters' paintings (backdrops and idle paintings the game starts early and cancels when the scene changes); **the live build does the
same** (Ch I 1, Ch IV 19, Ch VIII 7, Ch IX 5, Ch XV 15 at 2560x1440 without a turn, 0 console errors, 0 non-2xx), so it is not a regression and no response was an error. The harness's own "noNon2xx" check counts them
and so marks those rows; a reviewer should read the status codes (all 2xx). Art requested in Ch I at 2560x1440: 72 files at 1x and 46 at 2x, none at 3x or 4x (these flows never asked for a 3x or 4x master).
Art requested at 1600x900: all 1x (the governor's need is met at 1x there).

Frames (2560x1440, JPEG, the first command menu of each chapter, this build): `docs/screenshots/r39-int/ch1-seymour-flux-2560x1440-first-menu.jpg`, `ch2-yunalesca-...`, `ch4-ffx2-bahamut-...`, `ch8-evrae-airship-...`, `ch9-yojimbo-cavern-...`, `ch15-ffx2-den-of-woe-...` (same names).
