# Fight prebuild: the figures of each demo fight built behind the title and the picker (lane "prebuild", 2026-10-24)

**Game case: both.** Shared presentation plumbing; the cost is the same in Chapter I (FFX) and Chapter IV (FFX-2). **Conference demo only** (`?demo=1&pack=demo`); `?prebuild=off` is r63-play exactly. No game number, rule, painting or sound moves. Branch `fight-prebuild`, cut from `origin/r63-play` at `6fd2a6547` (the briefed `c10d91580` plus the booth-screens merge that landed since; the fight code is the same). Served builds for the checks (:5377, stopped, and `dist-prebuild` removed, when the lane ended): `index-BP0yUArc.js` (set m1: the figures only), `index-BHTfgYVM.js` (sets m2, m3, m2x: the figures, the looks' reads, the shared master), **`index-BNEF5PmN.js` (sets m4, m5 and the checks: the same, with every fight's essentials before any fight's other poses)**.

## The problem, measured

r63-play builds each demo fight's STAGE behind the title and the picker, and the first 9 s of every fight still lost 0.6 to 2 s of frame time (frames of 100 to 530 ms), even at 34 % GPU. A CPU profile with a WebGL tap (`tools/diagstart.mjs`, stacks on every call over 15 ms) of the served build with the stage warm finished gave this inventory for Chapter I (the sizes are the same kind in Chapter IV):

| cost at the battle's entry | what it was | size |
|---|---|---|
| the figures' paintings | each pose uploaded on the frame that first draws it | 17 uploads over 2 ms = 223 MB in the first 2.4 s, 17 to 80 ms each |
| the 5376 x 3072 backdrop master | uploaded by the warm, then **uploaded again** by the plate compose (`composeHiPlates` made a second `Texture` over the same image) | 279 ms, then 289 ms in the entry swirl |
| the room's light | `LookRoom.findRoomLight`: one `drawImage` of the 84 MB master to 256 x 144 and a `getImageData` | 264 ms in one frame (a 417 ms frame) |
| the look's alpha reads of each pose | `LookBold.extentsOf` (128 x 128), `geometry.alphaOf` (48 x 72), the breathing field (32 x 48) | 30 to 60 ms each, up to 128 ms, five to ten in the first 2 s |
| programs | 28 link at the entry: the room's dressing (Living Paintings' fields, haze, lamps, cast shadows, sway planes), the spectacle and the effects' materials are created there, so the warm never saw them | `getProgramInfoLog` 47 to 93 ms, four times |
| splash crops | five `toBlob` | 11 ms each |

The earlier attempt to pace the battle's own first draw (reverted, `859af1b86`) made Chapter IV take 65 s to its first menu; this does not touch the battle's draw at all.

## What it does

While the title or the picker is up, in steps of at most about 100 ms that look at the pad first (`demoWarm.ts`'s `idle`), after the stage is built and for the fight the cursor rests on first:

1. **The room's light** is found ahead (`LookRoom.primeRoomLight`: the same 256 x 144 reduction, drawn in four strips, each its own task; the result is cached by the painting's image and `findRoomLight` takes it).
2. **The figures are built** and parked (`FigureCache.ts`): the opening state comes from an engine made for it (as `battlePreload.ts` already does), each figure the stage would stage is asked for exactly as `PaintedStage.add` asks (`StageFigureRequest.figureSpec`, extracted from `add` as a pure function) and built by the same calls (`tryRigFigure`, else `PaintedActor.create`). `add` takes a parked figure when the **fingerprint** of its own question is equal (the request's options without their functions, the side, the rig switch); otherwise the parked one is disposed and the figure is built as before.
3. **Every figure's idle painting goes up** (one `initTexture` a task, with its breathing read), then **the figures' programs are built** (`prebuildDraw.ts`: the figures are put in the scene for one synchronous draw per program family into the composer's own buffer, everything else in the scene hidden for that draw, and taken out before the draw returns; a fence is polled after each draw), then the look's reads of the idle paintings, then the splash crops. **The other poses** (painting, breathing field, extents, alpha, one task each) wait until every fight's essentials are done: the first version did them straight after the first fight's, and with the second fight picked they took 5 to 6 s that its stage was waiting for (a patient Chapter IV run had the cursor's fight at "depth plates cut" when the press came).
4. **The plates are composed from the painting plane's own texture** (`PlateCompose.composeHiPlates` takes it, `DepthPlates.build` passes it with `shareMaster`, only when the page says the prebuild is on: `engine/PrebuildGate.ts`, set once in `main.ts`). The painting is already on the GPU; the second 84 MB upload and its 289 ms are gone (and so is an 84 MB duplicate). The same pixels are sampled one to one.

A press stops the plan at its next step (`calm()`); a figure that finishes after the press is disposed, never parked; figures the battle did not take are freed (`dropParked` after `stage.stage`). `window.__prebuildStats` counts `parked / taken / mismatched / absent` (a full Chapter I run: 5 / 5 / 0 / 0). `window.__demoWarmLog` carries the steps with their times.

Files: new `src/engine/StageFigureRequest.ts`, `FigureCache.ts`, `PrebuildGate.ts`, `look/AlphaPrime.ts` (the extents cache `LookBold` had per rig, now per page, so the warm can fill it), `src/app/demo/prebuildSwitch.ts`, `prebuildFigures.ts`, `prebuildDraw.ts`; changed `BattlePresenterStage.add` (calls `figureSpec`, takes a parked figure first), `PaintedActor.heldTextures`, `LookBold`, `LookRoom`, `fx/mix/geometry.primeAlpha`, `fx/b/DepthPlates`, `PlateCompose`, `LivingPaintings` (one option), `demoWarm` (the figures step), `BattleScreen` (one `dropParked` line), `main.ts` (the gate). No contract file (`docs/CONTRACTS.md`) is touched.

## Results

Same-session interleaved A/B, one browser, a fresh context per run, A (`prebuild=off`, r63-play's code path) and B (on) alternating from the same served build; headless GPU Chromium, 2560 x 1440, simulated pad (`tools/pairs.mjs`: title dwell, picker dwell, an 80 ms tap, then frame intervals for 9 s from the moment the screen is `battle`). "Lost" is the sum of (interval - 16.7 ms) over intervals above 20 ms. **The machine was never free for long**: another program's Blender render held 3.4 to 12 GB and up to 99 % of the GPU in bursts (the columns show the utilisation before and after each run). The spread is therefore part of the result; every run is in `D:/Tools/pyrefly-scratch/2026-10-24/prebuild/evidence/pairs-*`.

"Human pace" is 3 s on the title and 3 s on the picker (the press lands about 7.5 s after the load), "fast" is 2 s and 2 s (about 5.5 s), "patient" is 10 s on the title and 3 s on the picker (the warm has finished the fight).

**Human pace** (3 s title, 3 s picker; the press lands about 7.5 s after the load)

| set | chapter | side | n | first 9 s lost, ms (runs) | median | swirl lost median | worst frame ms (runs) | frames >50 ms | swallowed | errors | warm log lines at press | GPU util % (before-after) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2: human 3+3, BHTf | ch1 | off (r63-play) | 5 | 1583 / 550 / 950 / 550 / 1049 | 950 | 250 | 367 / 200 / 283 / 183 / 333 | 8 / 2 / 9 / 3 / 7 | 0 | 0 | 3/4/3/4/3 | 2-96 60-43 43-33 36-92 92-82 |
| m2: human 3+3, BHTf | ch1 | on | 5 | 1133 / 300 / 217 / 383 / 283 | 300 | 200 | 367 / 100 / 100 / 150 / 117 | 7 / 1 / 2 / 2 / 1 | 0 | 0 | 4/11/11/11/11 | 99-82 23-92 33-35 35-36 82-33 |
| m2: human 3+3, BHTf | ch4 | off (r63-play) | 5 | 1983 / 1933 / 1866 / 1816 / 1983 | 1933 | 283 | 350 / 717 / 717 / 700 / 767 | 13 / 10 / 10 / 9 / 11 | 0 | 0 | 2/2/2/2/1 | 98-44 99-49 49-99 99-41 41-99 |
| m2: human 3+3, BHTf | ch4 | on | 5 | 650 / 1649 / 1683 / 1766 / 633 | 1649 | 350 | 217 / 733 / 800 / 850 / 200 | 6 / 10 / 8 / 8 / 6 | 0 | 0 | 4/1/2/2/4 | 44-53 53-99 99-39 39-99 99-30 |
| m2x: human 3+3, B vs the served :5410 | ch1 | off (r63-play) | 3 | 1166 / 633 / 1633 | 1166 | 200 | 250 / 200 / 367 | 7 / 5 / 9 | 0 | 0 | 4/4/2 | 0-99 44-37 37-99 |
| m2x: human 3+3, B vs the served :5410 | ch1 | on | 3 | 983 / 1016 / 400 | 983 | 117 | 300 / 317 / 133 | 7 / 8 / 3 | 0 | 0 | 4/3/11 | 99-99 99-44 99-99 |
| m3: human 3+3, BHTf | ch1 | off (r63-play) | 5 | 1750 / 1133 / 1083 / 1116 / 566 | 1116 | 450 | 333 / 333 / 333 / 333 / 183 | 13 / 7 / 8 / 7 / 3 | 0 | 0 | 2/2/2/2/4 | 0-26 94-30 30-36 32-39 39-32 |
| m3: human 3+3, BHTf | ch1 | on | 5 | 1150 / 1249 / 300 / 1083 / 300 | 1083 | 200 | 350 / 367 / 117 / 333 / 117 | 9 / 8 / 2 / 8 / 2 | 0 | 0 | 2/2/11/2/11 | 19-98 98-94 35-39 39-32 32-35 |
| m4: human 3+3, BNEF | ch4 | off (r63-play) | 4 | 2416 / 766 / 800 / 733 | 783 | 392 | 533 / 233 / 217 / 233 | 12 / 7 / 5 / 6 | 0 | 0 | 1/4/4/4 | 0-43 51-49 49-44 51-47 |
| m4: human 3+3, BNEF | ch4 | on | 4 | 1833 / 1133 / 1733 / 1033 | 1433 | 300 | 867 / 417 / 783 / 450 | 8 / 7 / 8 / 4 | 0 | 0 | 2/3/2/4 | 43-39 39-51 44-39 39-51 |
| m5: human 3+3, BNEF | ch1 | off (r63-play) | 4 | 1466 / 683 / 483 / 483 | 583 | 242 | 283 / 183 / 183 / 167 | 11 / 6 / 2 / 4 | 0 | 0 | 1/4/4/4 | 97-38 99-43 43-71 28-94 |
| m5: human 3+3, BNEF | ch1 | on | 4 | 1083 / 1199 / 1200 / 1300 | 1200 | 125 | 333 / 350 / 350 / 350 | 7 / 9 / 9 / 11 | 0 | 0 | 2/2/4/2 | 42-27 34-99 78-96 96-28 |

**Fast pace** (2 s and 2 s)

| set | chapter | side | n | first 9 s lost, ms (runs) | median | swirl lost median | worst frame ms (runs) | frames >50 ms | swallowed | errors | warm log lines at press | GPU util % (before-after) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m1f: fast 2+2, BP0y | ch1 | off (r63-play) | 3 | 1199 / 1199 / 2399 | 1199 | 1533 | 233 / 350 / 700 | 6 / 9 / 12 | 0 | 0 | 1/1/0 | 97-75 94-28 28-36 |
| m1f: fast 2+2, BP0y | ch1 | on | 3 | 1033 / 1017 / 649 | 1017 | 1483 | 333 / 317 / 217 | 6 / 8 / 4 | 0 | 0 | 1/1/2 | 42-26 26-94 36-41 |
| m1f: fast 2+2, BP0y | ch4 | off (r63-play) | 3 | 1699 / 1433 / 1366 | 1433 | 1250 | 317 / 350 / 317 | 12 / 10 / 10 | 0 | 0 | 1/1/1 | 0-48 41-54 54-48 |
| m1f: fast 2+2, BP0y | ch4 | on | 3 | 2016 / 1249 / 1033 | 1249 | 350 | 833 / 417 / 400 | 9 / 4 / 5 | 0 | 0 | 1/2/2 | 32-41 23-41 48-51 |
| m2f: fast 2+2, BHTf | ch1 | off (r63-play) | 4 | 1533 / 550 / 950 / 899 | 925 | 1317 | 367 / 167 / 283 / 300 | 11 / 5 / 8 / 7 | 0 | 0 | 1/2/1/1 | 99-35 99-34 34-42 35-38 |
| m2f: fast 2+2, BHTf | ch1 | on | 4 | 633 / 699 / 933 / 983 | 816 | 809 | 200 / 217 / 300 / 267 | 3 / 4 / 8 / 7 | 0 | 0 | 2/1/1/1 | 35-98 98-93 42-41 41-35 |
| m2f: fast 2+2, BHTf | ch4 | off (r63-play) | 4 | 2066 / 1133 / 1666 / 1999 | 1833 | 1034 | 350 / 417 / 333 / 700 | 14 / 6 / 10 / 8 | 0 | 0 | 1/2/1/1 | 98-99 49-52 52-49 100-99 |
| m2f: fast 2+2, BHTf | ch4 | on | 4 | 900 / 1000 / 2666 / 1283 | 1142 | 642 | 383 / 400 / 350 / 283 | 4 / 5 / 18 / 8 | 0 | 0 | 2/2/1/1 | 100-51 52-49 49-100 100-100 |

**Patient** (the warm has finished the fight)

| set | chapter | side | n | first 9 s lost, ms (runs) | median | swirl lost median | worst frame ms (runs) | frames >50 ms | swallowed | errors | warm log lines at press | GPU util % (before-after) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m2p: patient 10+3, BHTf | ch1 | off (r63-play) | 3 | 1683 / 1216 / 1299 | 1299 | 400 | 383 / 317 / 333 | 10 / 7 / 7 | 0 | 0 | 8/8/8 | 41-29 99-32 32-29 |
| m2p: patient 10+3, BHTf | ch1 | on | 3 | 433 / 233 / 300 | 300 | 450 | 133 / 100 / 117 | 4 / 1 / 2 | 0 | 0 | 18/28/18 | 29-99 99-99 29-40 |
| m2p: patient 10+3, BHTf | ch4 | off (r63-play) | 3 | 1482 / 450 / 783 | 783 | 483 | 317 / 117 / 150 | 11 / 3 / 8 | 0 | 0 | 8/8/8 | 99-99 65-42 42-42 |
| m2p: patient 10+3, BHTf | ch4 | on | 3 | 499 / 450 / 1466 | 499 | 233 | 117 / 133 / 733 | 4 / 2 / 6 | 0 | 0 | 22/23/14 | 99-41 26-65 42-99 |
| m3p: patient 8+3, BHTf | ch4 | off (r63-play) | 5 | 2116 / 716 / 550 / 666 / 450 | 666 | 300 | 333 / 150 / 133 / 133 / 133 | 14 / 6 / 4 / 6 / 2 | 0 | 0 | 5/6/8/6/8 | 0-99 52-52 49-51 24-52 52-48 |
| m3p: patient 8+3, BHTf | ch4 | on | 5 | 483 / 416 / 400 / 466 / 583 | 466 | 283 | 133 / 117 / 133 / 133 / 133 | 4 / 3 / 3 / 3 / 5 | 0 | 0 | 15/16/16/16/16 | 99-50 50-52 51-51 51-50 46-50 |
| m4p: patient 8+3, BNEF | ch4 | off (r63-play) | 4 | 1083 / 1149 / 500 / 549 | 816 | 492 | 250 / 233 / 167 / 150 | 9 / 11 / 4 / 4 | 0 | 0 | 6/5/8/8 | 0-55 66-93 93-45 21-49 |
| m4p: patient 8+3, BNEF | ch4 | on | 4 | 367 / 566 / 333 / 1733 | 467 | 284 | 133 / 150 / 150 / 767 | 4 / 4 / 3 / 9 | 0 | 0 | 23/17/23/12 | 7-43 25-66 45-60 60-41 |
| m5p: patient 8+3, BNEF | ch1 | off (r63-play) | 3 | 1600 / 800 / 1433 | 1433 | 383 | 333 / 233 / 367 | 10 / 5 / 7 | 0 | 0 | 7/8/7 | 95-91 99-100 100-97 |
| m5p: patient 8+3, BNEF | ch1 | on | 3 | 383 / 367 / 350 | 367 | 200 | 133 / 133 / 117 | 3 / 2 / 2 | 0 | 0 | 13/22/13 | 91-100 100-99 99-98 |

**The same runs grouped by how far the warm had got for the picked fight when the pad pressed the picker's A** (the cleaner read: the warm's progress is what the machine's load moved from run to run)

| chapter | state of the warm at the press | runs | first 9 s lost, ms (sorted) | median | worst frame, ms (median, max) | swirl lost median |
|---|---|---|---|---|---|---|
| ch1 | off, stage not ready (cold) | 9 | 550 / 899 / 950 / 1083 / 1116 / 1133 / 1466 / 1533 / 1750 | 1116 | 333, 367 | 933 |
| ch1 | off, stage ready at the press | 15 | 483 / 483 / 550 / 550 / 566 / 683 / 800 / 950 / 1049 / 1216 / 1299 / 1433 / 1583 / 1600 / 1683 | 950 | 283, 383 | 250 |
| ch1 | on, figures and programs ready at the press | 12 | 217 / 233 / 283 / 300 / 300 / 300 / 300 / 350 / 367 / 383 / 383 / 433 | 300 | 117, 150 | 200 |
| ch1 | on, stage not ready (cold) | 10 | 633 / 699 / 933 / 983 / 1083 / 1083 / 1150 / 1199 / 1249 / 1300 | 1083 | 333, 367 | 359 |
| ch1 | on, stage ready, figures not yet | 2 | 1133 / 1200 | 1167 | 359, 367 | 109 |
| ch4 | off, stage not ready (cold) | 18 | 666 / 716 / 733 / 766 / 800 / 1083 / 1133 / 1149 / 1666 / 1816 / 1866 / 1933 / 1983 / 1983 / 1999 / 2066 / 2116 / 2416 | 1741 | 342, 767 | 550 |
| ch4 | off, stage ready at the press | 7 | 450 / 450 / 500 / 549 / 550 / 783 / 1482 | 549 | 150, 317 | 300 |
| ch4 | on, figures and programs ready at the press | 2 | 333 / 367 | 350 | 142, 150 | 325 |
| ch4 | on, stage not ready (cold) | 20 | 400 / 416 / 466 / 483 / 583 / 633 / 650 / 900 / 1000 / 1033 / 1133 / 1283 / 1466 / 1649 / 1683 / 1733 / 1733 / 1766 / 1833 / 2666 | 1083 | 392, 867 | 300 |
| ch4 | on, stage ready, figures not yet | 3 | 450 / 499 / 566 | 499 | 133, 150 | 233 |

Reading it:

- **Where the warm had the fight's stage and figures ready at the press (the last table: Chapter I, 12 runs, patient and human pace together), the first 9 s lose a median of 0.3 s (217 to 433 ms) against 0.95 s (483 to 1,683 ms, 15 runs) in r63-play's runs with its own stage ready, and the median worst frame is 117 ms (at most 150) against 283 ms (at most 383).** That is the prebuild doing what it was built for. Chapter I patient: off 1366 ms (n=6, 800 to 1683) against on 359 ms (n=6, 233 to 433); Chapter IV patient: off 691 ms (n=12, 450 to 2116) against on 475 ms (n=12, 333 to 1733).
- **At human pace the warm is the limit, not the work it does.** In 14 Chapter I runs at 3 s and 3 s the stage was ready at the press in 9 (off) and 8 (on) runs, and the figures and programs in 6 of the on runs; the rest fought cold, in both columns, and a cold fight is r63-play's fight (with nothing parked `add` takes the line it always took): pooled over all of them the medians are off 1000 ms (n=14, 483 to 1750) against on 1083 ms (n=14, 217 to 1300) (every human-pace run, ready or not). **Chapter IV at human pace is never ready in either build** (0 of 13 each way): its stage is built after the first fight's and the press comes first; its cold numbers (0.4 to 2.7 s, worst frames up to 870 ms) are the same noise on both sides, and are what a visitor who picks the second card in his first 8 s gets in either build. Chapter IV patient (the warm finished): off 691 ms (n=12, 450 to 2116) against on 475 ms (n=12, 333 to 1733).
- **The warm's early timeline wobbles by about a second from run to run for a reason that is neither build**: a main-thread task of 600 to 700 ms (the page's second WebGL context for the staged-upload probe, `StageProbe.ts`, which takes 0.2 s or 0.7 s depending on what the GPU is doing) lands before the press in some runs of either column (3 of 4 off runs in one set, 4 of 4 on runs in another), and a run that has it is the cold one. The pairs alternate sides to spread this, and it still decides who is ready at the press.
- **Presses swallowed: 0 in every run of every set** (the harness repeats a tap that changes nothing within 2.5 s and counts it). Console errors and page errors: 0.
- **Time to the first command menu is not longer**: from the picker's A to `awaitingMenu`, the same pad path, patient dwell: Chapter I 3914 ms off, 2918 ms on, Chapter IV 10714 ms off, 10015 ms on (`shots.mjs`; one run each).
- The patient Chapter IV runs at 1,466 and 1,733 ms (worst frames 733 and 767 ms) are machine events: a 600 to 700 ms task before the press, GPU memory at 12 GB (Blender), the warm 5 to 10 lines behind the other runs.
- Cross-check against the served r63-play build (:5410, no prebuild code): `m2x` above, 3 runs each, both cold in the two slow cases; r63-play behaves like `prebuild=off`.

**Against the target** (first 9 s under 0.3 s at human pace when the GPU is not saturated; worst frame under 50 ms; time to the first menu not longer; 0 presses swallowed; 0 console errors): **0 swallowed and 0 errors: met. Time to the first menu: not longer: met. First 9 s at or under 0.3 s: met in 7 of the 12 ready Chapter I runs (217 to 433 ms, median 300), and only when the warm is ready at the press, which at human pace happened in 6 of 14 runs; Chapter IV at human pace: not met (cold in both builds). Worst single frame under 50 ms: not met (100 to 150 ms in the best runs).** The GPU was never free for a whole set (another program's Blender render), so "when the GPU is not saturated" is a condition I could only see in the best runs.

## Memory

- JS heap at the end of the first 9 s: median 159 MB with the prebuild off, 150 MB on (the on runs hold the parked figures' decoded paintings: a few tens of MB more).
- GPU: the parked figures' paintings, decoded and with their mip chain: **291 MB for Chapter I (47 paintings), 227 MB for Chapter IV (42 paintings)** (the warm's own count, width x height x 4 x 1.33), 518 MB if both fights are parked; the shared master saves 84 MB per fight. Total GL textures after the first 9 s: median 115 off, 115 on (renderer.info.memory.textures at the end of the first 9 s). A parked fight that is never picked keeps its figures until the page ends (a picked fight frees whatever it did not take). `nvidia-smi` totals are not usable here: Blender's own 3.4 to 12 GB swings by more than this.

## What remains, and what I did not do

1. **The room's dressing at the entry.** Living Paintings builds its plates (four render targets of 5376 x 3072), fields, haze, lamps, cast-shadow quads and sway planes when the battle binds it, and the programs of those materials link on their first draw: `getProgramInfoLog` 47 to 93 ms, about four times, 0.3 to 0.4 s of the remaining loss in the best runs, and the 100 to 130 ms worst frames. The way to take them is to build `Living` behind the picker and let `bindLivingScene` adopt it (park by scene, adopt when the key, scene, camera and renderer are the same); the figure-dependent parts (`Figures` finds the actors by walking the scene) would still build at the entry. Not done: it needs a visual comparison of the dressing and a second matrix, and it touches a singleton (`current`) that the title does not own.
2. **A 2688 x 1536 image uploaded at +0.3 s** (about 50 ms) and the spectacle's program: not in the warm.
3. **The warm's own throughput** is the limit at human pace: on this loaded machine the first fight's stage is ready at 5.0 to 6.6 s of page time and its figures, programs and reads at 6.2 to 7.2 s (the other poses to about 12 s), the second fight's about 5 s after that. A press at 7.5 s finds the cursor's fight ready only if it is the one the warm started with. The booth's page is up for hours before a visitor arrives (the attract card runs on a 60 s idle), and each fight is rebuilt behind the picker after it is played, so the case that matters at the booth is "patient"; tell Bailey to stay on the title and the picker about 12 s before the first press of a Saturday test session, as r63-play already says.
4. **The retry** (TRY AGAIN) is unchanged: its light warm builds the stage only; the figures are built at the entry as before.
5. The `probeBrowser` second WebGL context (a 600 ms task around 1.4 s of page time when the GPU is busy) is not sliceable and still delays the early warm; it is why some runs in either column are cold.

## Checks run

`npx tsc --noEmit` clean. New `tests/unit/prebuild-figures.test.ts` (the switch, the cache, the fingerprint, `PaintedStage.add` taking and refusing a parked figure, which combatants are staged, the GPU half's contract: paintings idle first, a figure in the scene only inside one synchronous draw with the rest hidden, a stop leaves nothing behind, the extents cache). Touched families: `r62-demo-warm`, `r61-booth-warm`, `r62-demo-warm-stage`, `r63-fix-m1-warm`, `entrance-census`, `look-bold`, the `stage-*` tests, `painted-actor-blend`, `battle-screen-teardown`, `battle-screen-frame-clocks`, `boss-clean`: 18 files, 244 tests pass on the final code (the new `prebuild-figures` and `prebuild-warm-order` among them); the whole suite (`npm test`: 1,637 files, 25,763 tests) had 9 files and 11 tests red, **all nine are art-dependent files that are red on r63-play too** (`pose-scale-art`, `pose-install-0926` and `-0930`, `pose-stature-hold`, `held-defend-ffx` and `-ffx2`, `critic-continuity-pose-motion`, `exp-leblanc`, `tools/pose-gate-art`; the overnight fixer lane's full run lists the same files, `fix/runs/fullsuite.out`), and none is a file this lane touches or imports. Both chapters played to results by simulated pad with the prebuild on and the warm finished: **both chapters to the results screen by simulated pad, prebuild on, the warm finished** (`rv/tools/play2.mjs`, 8 s on the title and 2 s on the picker, the fight steered by the harness's usual assists: HP and the foes' HP set as in the overnight run): Chapter I 14 turns, results at 238 s, Chapter IV 22 turns, results at 194 s (`pb-ch4-final`); 0 console errors and 0 page errors in both; the oracle armed before the first menu (the first version of the harness armed it late on a prebuilt start and left Chapter I standing on a menu: `play.mjs` held the pad 4.2 s through a cutscene that now ends sooner, `play2.mjs` releases it when the cutscene ends and arms first); the frames are `docs/screenshots/fight-prebuild/ch1-results.jpg` and `ch4-results.jpg`; the first-menu frames of both chapters with the prebuild off and on, same dwell, are `first-menu-ch1-off.jpg` / `-on.jpg` and `first-menu-ch4-off.jpg` / `-on.jpg` (the same composition, the same plates and figures; the coarse 128 x 72 difference of 4.6 and 2.5 of 255 is the camera's drift and the particles, which are not at the same moment). `node tools/orphans.mjs`: none of the new modules is listed.

## For the driver

- Address words: nothing to add for the booth (`?pack=demo` turns it on). `?prebuild=off` turns it off at once if anything looks wrong; `?prebuild=on` turns it on in demo mode without the pack.
- Open question for Bailey: whether to spend the time on item 1 above (Living adopted from behind the picker) before Monday; it is the next 0.3 s and the 100 ms frames.
- Scratch (not in the repo): `D:/Tools/pyrefly-scratch/2026-10-24/prebuild/` (`tools/pairs.mjs`, `diagstart.mjs`, `table.mjs`, the evidence folders, `progress.md`).

## Race fix and merge (light review 2, 2026-10-24)

**Game case: both.** Shared presentation plumbing in the conference demo (`?demo=1&pack=demo`); the race was seen in Chapter IV (FFX-2) and not in Chapter I (FFX) (the review's reading: Chapter I's intro cutscene, about 10 s, separates the press from the battle's entry), but the cause is in code both run, so the fix is both. No game number, rule, painting or sound moves.

**The finding (critical, introduced by this branch).** `inChapter()` in `src/app/demo/prebuildFigures.ts` names the chapter for a figure's construction (`setCurvesChapter`, the gate every new piece reads through `DemoGate.demoChapter`) and puts back what was there afterwards. Its guard was `demoChapter() === chapter.id`. When the visitor presses A on the picker while a figure of that same fight is still being built, `BattleScreen.enter` names the same chapter for the battle, the build then finishes, the guard is still true, and the restore writes the saved value (nothing) over the battle's own. The fight runs with the demo chapter unset: every new piece off (curves, pro look, staging, HUD, moments, smear, fx, camera) and a cyan outline on Bahamut. Measured by the review on the candidate with a pad press timed to the warm log (`review2/tools/race.mjs`): Chapter IV 2 of 6 timed presses (n1) and **5 of 13** (scan), Chapter I 0 of 13; the control on the parent (r63-play) 0 of 8.

**The fix.**

- `withDemoChapter(chapterId, calm, work)` (exported from `prebuildFigures.ts`, used by the plan's `inChapter`): the restore runs only `if (calm() && demoChapter() === chapterId)`. `calm()` is the warm's own "still on the title or picker and not stopped"; `stopDemoWarm` has run by the time a fight starts, so `calm()` is false and the chapter belongs to the battle, whether it is the same chapter or the other one.
- `parkOrDispose(scope, id, fingerprint, built, calm)` (the tail of `buildOne`): a figure that finishes after the press is disposed, never parked, and now also calls `unregisterRigUse(id)` (a rigged figure registered itself live in `tryRigFigure`; `FigureCache.release` already did this for a parked one that is dropped, the in-flight disposal path did not).
- New `tests/unit/prebuild-race.test.ts` (9 tests): the race in pure form (a build in flight, the press stops the warm, the battle names the same chapter, the build ends: the chapter must survive; the variants: press without the chapter named yet, the other chapter entered, no press so the earlier name comes back, a build that throws), and `parkOrDispose` (parked when calm; disposed, unregistered and not parked when not; a registry that throws still lets the figure be disposed). **Proved to fail without the guard**: with the old `demoChapter() === chapterId` line put back, three of the nine fail (`expected undefined to be 'ffx2-bahamut'`); with the fix all nine pass.
- Checks: `tsc --noEmit` clean; `prebuild-race`, `prebuild-figures`, `prebuild-warm-order`, `r62-demo-warm`, `r62-demo-warm-stage`, `r61-booth-warm`, `r63-fix-m1-warm`, `entrance-census`: 8 files, 113 tests pass. Not re-run in a browser on this branch; the timed-press harness (`race.mjs`) is the way to re-prove it live (expect 0 of 13 with `demoChapter` set for the whole fight).

**The light review's other results on the candidate (all fine, none blocking).** Focus wiggle on the picker: 12 trials, correct chapter, party and foes every time, 0 swallowed presses, 0 errors. Pad taps: parent lost 4 of 487, candidate 4 of 479 (the same; not task-correlated). TRY AGAIN, OTHER FIGHT, back to the picker: all correct in both chapters, 0 errors (the retry path is unchanged). Both chapters won to the results screen by the pad bot (Chapter I 81 s, Chapter IV 91 s, 0 errors). Memory over four fights: JS heap 20 to 36 MB candidate against 18 to 35 MB parent, the same growth per fight in both (the DOM growth is pre-existing); the candidate holds +75 textures and +7 programs at the picker and about 550 MB more GPU memory (the parked figures). First-menu frames of the two builds have the same composition.

**The booth case (the review's table).** The page sits on the title between visitors (the attract card comes up after 60 s, 70 s idle), a pad press wakes it, a second takes the title, the picker stands 3 s, the visitor picks; then the first 9 s of the fight. P0 is the parent (r63-play, no prebuild), ON the candidate; same browser session, a fresh context per run, 2560 x 1440, `?demo=1&pack=demo`, interleaved. "Lost" is the sum of (interval - 16.7 ms) over frame intervals above 20 ms. The GPU was shared with another program's render, so the spread is part of the result. Evidence: `D:/Tools/pyrefly-scratch/2026-10-24/prebuild/review2/evidence/booth-*` and `after-*`; table by `review2/tools/table.mjs`.

| case | side | runs | first 9 s lost, ms: median [range] (runs) | worst frame, ms: median [range] | frames over 50 ms | press to first menu, s | swallowed | errors |
|---|---|---|---|---|---|---|---|---|
| Booth, Chapter I (FFX), idle 70 s | P0 | 4 | 958 [600-1066] (933 / 600 / 1066 / 983) | 284 [183-383] | 5 [5-7] | 20 [20-20.7] | 0 | 0 |
| Booth, Chapter I (FFX), idle 70 s | ON | 4 | 175 [150-600] (150 / 167 / 600 / 183) | 109 [100-233] | 2 [1-5] | 20 [19.5-19.9] | 0 | 0 |
| Booth, Chapter IV (FFX-2), idle 70 s | P0 | 4 | 475 [350-1000] (1000 / 350 / 383 / 566) | 117 [100-183] | 5 [2-11] | 11 [10.2-11.1] | 0 | 0 |
| Booth, Chapter IV (FFX-2), idle 70 s | ON | 4 | 233 [166-383] (183 / 283 / 383 / 166) | 117 [117-117] | 2 [1-4] | 10 [9.9-10.2] | 0 | 0 |
| After a won Chapter I fight, then Chapter IV | P0 | 2 | 1041 [866-1216] (1216 / 866) | 284 [217-350] | 7 [6-7] | 12 [10.7-12.3] | 0 | 0 |
| After a won Chapter I fight, then Chapter IV | ON | 2 | 166 [166-166] (166 / 166) | 109 [100-117] | 1 [1-1] | 10 [9.9-10] | 0 | 0 |
| After a won Chapter IV fight, then Chapter I | P0 | 2 | 775 [517-1033] (517 / 1033) | 250 [183-317] | 6 [5-6] | 19 [19.1-19.6] | 0 | 0 |
| After a won Chapter IV fight, then Chapter I | ON | 2 | 242 [167-316] (316 / 167) | 150 [117-183] | 1 [1-1] | 19 [18.6-18.7] | 0 | 0 |

Reading it: in the booth case the candidate loses a median of 0.18 s (Chapter I) and 0.23 s (Chapter IV) of the first 9 s against 0.96 s and 0.48 s in r63-play, with a worst frame of about 110 to 120 ms against 120 to 280 ms, and the first menu comes no later. (The two "after" rows were first runs of a new harness, 2 pairs each; the first fight was won with the presenter's auto strategy and the foes at 1 HP, a stated assist, and only the second fight is measured.) The race this section fixes is not in these numbers either way: the booth runs press after a long idle, when every figure was built long ago; the race needs a press that lands inside a figure's build, which is why the review needed a press timed against the warm log to find it.

**The merge.** `fight-prebuild` at `b273fdb7d` (this fix on top of `dbb231c54`, pushed to origin) is merged into `r63-play` (tree `D:/pyrefly-continuity`) with `--no-ff`: merge commit `1bc679554` (pushed), no conflicts. After the merge: `tsc --noEmit` clean; the prebuild, booth, demo, title and warm test files (38 files, 557 tests pass, 3 skipped as before). The playtest build on :5410 is rebuilt from it with `node tools/candidate-build.mjs --out dist-r63-play` (release 62 stamp, base `/`, 75 s) and served by `node tools/candidate-build.mjs --serve --out dist-r63-play --port 5410`: **pid `48304`, bundle `index-BRj-zlCy.js`** (before: pid `46248`, `index-Do01L2lo.js`, stopped; `D:/Tools/pyrefly-scratch/2026-10-23/r63-play/servers.json` says the same). Headless load at 2560 x 1440 (`D:/Tools/pyrefly-scratch/2026-10-24/prebuild/merge/evidence/loadcheck.json`, frames beside it): the title, the picker and the first command menu of Chapter I and of Chapter IV by the keyboard, page title "Echoes of Spira", **0 console errors, 0 page errors, 0 failed requests**. The two review preview servers (5387 parent, 5388 candidate; pids 71440 and 59920) are stopped; their folders are kept. Not deployed. **The race, re-run live on the merged build** (the review's own harness `race.mjs`, pointed at :5410: Chapter IV, 13 pad presses timed 0 to 120 ms in 10 ms steps after the warm log's "paine built", 1280 x 720, no CPU throttle; `D:/Tools/pyrefly-scratch/2026-10-24/prebuild/merge/evidence/race-postmerge-ch4-1792855410035`): **0 of 13 presses leave the fight with the demo chapter unset** (the same scan on the unfixed candidate: 5 of 13, at 20, 30, 40, 60 and 100 ms); every one of the 13 fights ended with `demoChapter` = `ffx2-bahamut` and curves, pro look, staging, F1 HUD, moments, smear, new fx and the pro camera all on; 0 console errors; 13 of 13 presses fired and took the battle (`__prebuildStats` e.g. parked 3, taken 3, mismatched 0). Chapter I was not re-scanned (0 of 13 before the fix; the cause was never reachable there in the review's runs).

**Still open (not done here).** Item 1 above (the room's dressing adopted from behind the picker; the next 0.3 s and the 100 ms frames), the Chapter IV human-pace cold case, and the cross-fight growth of GL textures and DOM nodes (pre-existing in the parent).
