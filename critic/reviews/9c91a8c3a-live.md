```text
Build / artifact / target version: main 9c91a8c3a (Release 53) / bundle D9wTDH4W / artifactHash da1532d0d685806394c073631a3c0413b779ab1a4983201b2f3484e830bb25c4 (live at https://echoesofspira.com/, deployed 2026-10-18T07:43:48Z; target version: none, no approved tile in docs/target/targets.json covers the changed area)
Review: live
Deployment: PASS (exact artifact byte-identical, all 5309 downloadable files; the r53 changes under test work live on the intended states at 1600x900 and 390x844)
Changed area: NOT APPLICABLE (the focused review owns it: critic/reviews/9c91a8c3a-focused.json, ship SHIP, changedArea FAIL on the disclosed FOC53-001)
Ship: N/A (a live review does not gate ship); this pass adds no critical and no major issue and finds no confirmed regression against r52 (LV53-1 is one borderline CHK-026 reading to look at); the major the focused review disclosed (FOC53-001, swap jerks of 40 px or more, CHK-027) reads again as disclosed and smaller than on r52
Milestone: not assessed
Quality: not assessed (a live review does not recompute the score)
Targets: not assessed
Top issues: none new. Observations only: LV53-1 CHK-026 failed on 1 of 271 swaps in one of two Ixion harness runs (Yuna idle to hurt, stature 0.884 against the 0.90 floor); LV53-2 CHK-027 still FAIL (4 swap jerks of 40 px or more in 170 s and in 188 s, worst 70.9 and 58.4 px; r52 live read 20 in 192 s, worst 224 px, under load); LV53-3 the held start card lasts 2.4 to 6.2 s on cold live loads of Chapter IV (0.7 s on r52, 0.9 to 1.6 s on the same r53 files from local disk): the design's cost, now measured; LV53-4 the FFX first menu can open while the camera is still easing in (also on r52, so not r53's)
Coverage: tested = all 5309 downloadable files byte-compared (--full); poseTrust() empty in every chapter context (15 live smoke contexts); FFX-2 Chapter IV (Bahamut) on cold loads, hurried and with the card pressed once, desktop and phone, with the boss fitted at the first menu in 5 of 5; FFX Seymour Flux and FFX-2 Bahamut through real-key turns with every animation frame of every figure recorded, r53 live against the r52 build on the same machine; hidden Sinspawn Gui by the word "mushroom", two real-key turns, desktop and phone; FFX-2 Chapter XI, Yuna's Change to Gunner across the red gate of Tempered Will by real keys, with a no-gate control; the continuity harness on Ixion at Djose on the live artifact twice; reused = the focused review's code-level findings (the artifact is byte-identical to the candidate it ran on); not tested = see below
Next required review and why: the deep review of this live build (the marker's `deep` obligation, carried from earlier builds) is still owed, and the marker's `focused` obligation names a report the driver applies; this pass settles only `live`
Elapsed review time / repeated work avoided: about 65 minutes wall clock (the 30-minute --full download ran in the background beside the smoke); the r52 harness shape (common.mjs, the continuity command) was copied and adapted
```

Mode: headless Chromium launched by Playwright from node scripts, `PYREFLY_BROWSER=gpu` for every run (ANGLE, NVIDIA GeForce RTX 5070 Ti, Direct3D11; never SwiftShader, never the Claude-in-Chrome tools or the browser pane, no headed window). No canvas was black. Every run used a fresh browser context (empty HTTP cache, empty storage: a cold load) and a `?livesmoke=<ms>` cache-busting URL. `D:/Tools/pyrefly-scratch/GPU-QUIET` did not exist. The machine was not idle: other sessions ran vitest and screenshot jobs throughout, and the full download ran until about 08:20Z (frame p99 read 33 to 46 ms in the smoke runs, 32 and 49 ms in the two harness runs, which ran after it). Evidence is in `critic/reviews/9c91a8c3a-live/` (`run/` the result JSONs, per-run analysis, `summary.json`, frames as `*-frames.json.gz` (gunzip to re-analyse), screenshots as JPEG; `scripts/` the harness; `continuity/` the two harness runs; `verify-live.json`; `run/superseded/` two Chapter XI runs whose pass test was my harness's mistake, kept and explained below). Nothing was staged or committed. Two static servers of my own (ports 5937 and 5938) served the r52 build (`M:/pyrefly-ch4-builds/before`, bundle NmzXqL9o, byte for byte r52's) and the r53 `dist-release` for the same-machine comparison; both were stopped by PID and their ports are closed.

## Step 1: exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/9c91a8c3a.json --url https://echoesofspira.com/ --changed-from critic/artifacts/3c92b60cc.json --full --out critic/reviews/9c91a8c3a-live/verify-live.json
```

```json
{
 "result": "PASS",
 "artifactHash": "da1532d0d685806394c073631a3c0413b779ab1a4983201b2f3484e830bb25c4",
 "liveManifest": "match",
 "checked": 5309,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": []
}
```

PASS: the live manifest names this artifact and every compared file is byte-identical with the right content type. The manifest lists 5310 files (10.81 GB); `_headers` is read by Cloudflare and never served, so it is the one not downloaded; `index.html` as a browser asks for it is identical to the artifact once Cloudflare's Web Analytics beacon (366 bytes and the line feed after it) is cut out. The run took about 30 minutes (07:50:43Z to 08:20Z). The diff from r52 (3c92b60cc) is three added files (`index-D9wTDH4W.js`, `exp-fayth-table-DXqeoCsQ.js`, `worker-CJzw-Koi.js`), their three predecessors removed, and `index.html` changed; no painting, audio, data or style file moved. The manifest's two `problems` lines (`art/portrait-parts/paine/{1x,2x}/eyeR-catch.png` decode to a flat colour) are the `intentionalFlatImages` entries r52 carried. `window.__pyrefly.build()` read `{sha: "9c91a8c3", bundle: "index-D9wTDH4W.js"}` in all 15 smoke contexts and in the 6 local copies of the same bundle.

## Step 2: real-input smoke (CHK-016)

Real input only: `page.keyboard.press` and `type` for keys (a held Enter through the pre-battle scene where it says "hurried": the survey's route and the route on which the framing race was found), `page.mouse` and `page.touchscreen.tap` on the phone (Attack row tapped; the target by Enter, declared). The debug API was read for state (screen, pending menu, staged ids, pose trust, combatants, `stage.projectRect`, `stage.planSettled`, `entranceSnapshot`) and for nothing else: no pose was forced, no debug shortcut taken.

| Run (all fresh contexts) | What | Viewport | Result |
|---|---|---|---|
| bahamut-desk-hurry, -b, -c | FFX-2 Chapter IV (Bahamut) from the title, held Enter, first menu, 3 to 5 real-key turns | 1600x900 | all steps OK |
| bahamut-desk-press | the same, the start card pressed once (Enter), 3 turns | 1600x900 | all OK |
| bahamut-phone-hurry | the same, Attack tapped on the phone | 390x844 touch | all OK |
| seymour-desk, -b, seymour-cam-c, -d | FFX Chapter I (Seymour Flux), real-key turns (none in cam-c, -d) | 1600x900 | OK; the "boss does not re-size while the first menu is up" probe (an instant reading, 2 percent allowed) read 2.1 and 2.2 percent in 2 of 4: see LV53-4 |
| seymour-phone | FFX Chapter I, three tapped turns | 390x844 touch | all OK |
| gui-desk, gui-phone | hidden Sinspawn Gui by the word `mushroom`, two turns (Tidus, Auron) | both | all OK |
| xi-gunner-desk, -phone, xi-lady-luck-desk | FFX-2 Chapter XI (Fallen Aeons), Yuna's Change by real keys | 1600x900, 390x844, 1600x900 | all OK |
| continuity a and b | Ixion at Djose (ffx2-ixion-djose), the route harness to a win, real keys from the title | 1600x900 | see Step 3 |

**poseTrust() (a).** `window.__pyrefly.poseTrust()` read `withheld: []` and `unregistered: []` at the first menu and again after the turns in every chapter context: Bahamut (55 paintings seen: 30 ok, 7 reference, 9 exempt, 9 held), Seymour Flux (48 seen), Gui (13 held, 30 ok, 11 reference; the same on both viewports), Chapter XI (45 seen, 1 waived), phone contexts alike. Nothing is withheld on the live build.

**FFX-2 Chapter IV, the cold load and the first menu (b).** The card (`.bstart`), its opacity, the entrance hold and every figure's projected box were recorded on every animation frame from the title on. Three hurried cold loads at 1600x900 on the live site: the card stayed up **3.87, 6.18 and 4.53 s**; the boss stood at 414 to 419 px while the card was opaque; the plan landed under it (the boss 625 to 627 px: on the card's first leaving frame in two runs, earlier in the third) and the boss stayed held (its `held` flag) until the card's fade read opacity 0.01; the first menu opened 1.03 to 1.05 s after the card was gone with Bahamut at **575.6, 575.5 and 577.9 px** (569.0, 566.5 and 568.9 px two seconds later: within 1.6 percent). Pressed once (Enter, about 2.2 s after the card appeared): the card left at once, Bahamut was still held (300 px, the party standing), the plan landed during the opening and the first menu opened 6.4 s later with Bahamut at 579.6 px (568.6 px five seconds on). Phone 390x844: card 3.87 s, Bahamut 256, 258 and 253 px at card, card gone and first menu (nothing re-sized there). **The first menu opened with the camera fitted in 5 of 5 cold loads. In the three hurried desktop loads the card held until the boss was fitted; in the pressed load the press ended the card and the opening waited for the plan before it offered the menu (6.4 s); a press dismissed the card, as designed.** The same protocol on the r52 build from local disk: the card stayed 0.73 s and the boss was fitted at the first menu in 3 of 3 (the r52 race is 7 in 19, so three runs may not show it); the r53 build from the same local disk: card 1.61, 0.90 and 0.97 s, boss 580, 575 and 576 px at the first menu. So the longer holds on the live site (LV53-3) come from the live cold load, not from the files. One thing is the same on all three and is not r53's: when the card goes, every figure jumps 82 to 86 px in one frame (the opening's first camera frame; r52 local 84.9 to 85.7 px, r53 local 82.1 to 85.8 px, r53 live 82.2 to 86.5 px; 140 px on the pressed run, where the plan lands later). The card is at opacity 0.01 by then and its removal follows 40 ms later.

**The new lunge (c).** On every frame, each figure's world position (position, pivot and inner offsets) and its projected box were read; a lunge is a stretch of movement of at least 1 world unit; the first moving frame is measured as a fraction of the stretch's reach. Hit reactions (a recoil into `hurt`) are left out.

| Game, chapter, build | Mover | Stretches | First moving frame, share of the reach (max / median) | The figure's own first step, px (max) | Starts at 15 percent or more of the reach |
|---|---|---|---|---|---|
| FFX-2 Ch IV, r53 live (5 runs) | girls | 25 | 0.8 / 0.5 percent | 3.4 | 0 |
| FFX-2 Ch IV, r53 live | Bahamut | 6 | 4.9 / 0.25 percent | 11.5 | 0 |
| FFX-2 Ch IV, r53 local (3 runs) | girls / Bahamut | 6 / 12 | 0.4 / 4.9 percent | 0.8 / 18.6 | 0 / 0 |
| FFX-2 Ch IV, r52 local (3 runs) | girls | 11 | 0.6 / 0.2 percent | 1.6 | 0 |
| FFX-2 Ch IV, r52 local | Bahamut | 17 | **28.5** / 0.2 percent | **74.6** | **3** |
| FFX Ch I, r53 live (2 runs) | Tidus, Kimahri | 3 | 3.5 / 3.4 percent | 7.4 | 0 |
| FFX Ch I, r53 live | Seymour Flux | 2 | 4.5 / 2.5 percent | 10.0 | 0 |
| FFX Ch I, r52 local (1 run) | Tidus, Yuna, Kimahri | 7 | **42.2** / 27.7 percent | **115.8** | **4** |
| FFX Ch I, r52 local | Seymour Flux, Mortiorchis | 6 | 27.9 / 6.8 percent | 52.4 | 2 |

(The figure's own first step is its world-position step times the stretch's pixels per world unit, so a pose swap on the same frame does not count. The box-based step, which includes a painting swap, is larger in places: a Bahamut cast-to-idle swap reads 41.8 px on r52 and r53 alike with the figure moving 0.3 percent, and Seymour Flux's telegraph-to-attack swap reads 88.7 px on r53 with the figure moving 4.5 percent of 1.64 units; the harness's swap jerks in Step 3 are where those count.)

So the lunge change is real on the live build: the attacker's first moving frame covers 3 to 5 percent of its reach, where the r52 build, run the same day on the same machine, covered up to 28 percent (FFX-2's boss) and 42 percent (FFX's party). FFX-2's girls were already gentle on r52 (their lunge uses the reach curve) and read the same. **No lunge in any live run began with more than 11.5 px of figure movement or more than 5 percent of its reach.** This is measured frame by frame, not watched: no person looked at it.

**Hidden Sinspawn Gui (d).** On the board (no card) typing `mushroom` with real keys opens party prep; Enter plays the pre-scene; the card (2.1 s on desktop, 2.2 s on the phone) gives way to the first menu with Tidus, Auron and Lulu against Gui and its three parts (`sinspawn-gui`, `-head`, `-arm-left`, `-arm-right`; the boss body 374 px at the menu on desktop, 163 px on the phone, steady over 5 s); two real-key (desktop) and two tapped (phone) Attack turns by Tidus and Auron play; poseTrust() empty; `pyrefly-reprise:save:v1` byte-identical (the hidden chapter writes nothing), the reload shows the title with the save unchanged; no console error. This closes the focused review's FOC52-003 for Gui on live.

**FFX-2 Chapter XI, Tempered Will (e).** Yuna begins as a White Mage on node 0 of Tempered Will (level 46, maximum HP 2488, maximum MP 206). On her first menu, Change lists Gunner, Warrior and Lady Luck, and the Gunner row reads **GRANTS: RED** (frame `run/shots/xi-gunner-desk-yuna-change-list.jpg`). Enter on Gunner by real keys (once the first-time coach card is dismissed: it swallows the first Enter) changes her: `passedGates ["red"]`, dress Gunner, node 1. **Her maximum MP reads 170 = 2 x Gunner's base 85** (`dressphereStats('gunner', 46)` read with node: 85; 206 for the White Mage), her maximum HP 3416 = 2 x 1708 (the Crystal Bangle's doubling, no Double HP: the green gate is not crossed). The party strip prints it: `85 /170` on desktop (Shiva's Heavenly Strike had halved her HP and MP by that frame: HP 1708 /3416 beside it); the phone's row shows current values only (3416 and 170, the DOM carries the maximum), nothing clipped. The control, Change to Lady Luck (node 4, no gate): `passedGates []`, maximum MP 177 = Lady Luck's base, no doubling, maximum HP 2826 = 2 x 1413. Gunner was run on desktop and phone with the same result, the Lady Luck control on desktop. My first two runs of this step (kept in `run/superseded/`) reported "MP not doubled" because they compared the new maximum with the White Mage's 206 instead of with the destination dress's base; the engine and the strip were right, my test was wrong. The effect is exactly what the changelog says a player gets: the buff sound and a larger maximum, with no icon or line (an icon needs Bailey's yes). Only the red gate was crossed live; Double HP (the green gate), Highroad Winds' SOS Haste and Downtrodder are not worn in a shipped chapter and were not exercised.

**Console and network (f).** Across the 15 smoke contexts and the 2 harness contexts: **0 console errors, 0 page errors, 0 responses with status 400 or more (not one 404), 0 image or audio responses served as text/html.** 225 `requestfailed` events in the 15 smoke contexts (30 of them sampled in the results: all `net::ERR_ABORTED`, prefetches cancelled by a screen change; no status, no console error), the same kind earlier live reviews reported (r52: 116 in 9 contexts). **The save key.** `pyrefly-reprise:save:v1`, board against the end of the run, is **byte-identical in the hidden-chapter runs (Gui)**; on a first attempt of a listed chapter it gains exactly what the build before it gains: the chapter's own row (Bahamut: 12 chapter rows added, Seymour Flux: `attempts` 1 and `playTimeMs`), a `seenCoach` entry and `updatedAt`; no key removed, no version or `cleared` field changed, identical paths on the r52 build for the same flows. After each run a reload in the same context reached the title with the key byte-identical to what the run wrote (12 of 12 runs that played a battle turn or reached a first menu).

## Step 3: continuity harness on Ixion at Djose (CHK-026 and CHK-027), live artifact

```
node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --evidence=critic/reviews/9c91a8c3a-live/continuity --chapters=ffx2-ixion-djose --tag=live-r53   (and --tag=live-r53b)
```

Real keys from the title to a win, GPU, 1600x900, seed 1. r52's column is its live check (3c92b60cc), which ran beside the 5309-file download (frame p99 339 ms); r53's two runs ran after this review's download had finished (p99 32 and 49 ms), so the clock multiplied every move less.

| | r52 live | r53 live run a | r53 live run b |
|---|---|---|---|
| battle, swaps judged | 192.2 s, 233 | 170.1 s, 271 | 187.7 s, 276 |
| CHK-026 | PASS | **FAIL (1 swap over its height band)** | PASS |
| max feet shift, by registration / by pixels | 0.7 / 2.3 px | 0.8 / 2.4 px | 0.7 / 3.3 px |
| stature range; swaps out of band | 0.665 to 1.298; 0 | 0.884 to 1.109; 1 | 0.875 to 1.109; 0 |
| CHK-027 | FAIL | FAIL | FAIL |
| swap jerks of 40 px or more | 20 (6.2 per minute) | 4 (1.4 per minute) | 4 (1.3 per minute) |
| worst swap jerk | 224 px | 70.9 px | 58.4 px |
| mid-move dashes of 40 px or more | 10 | 0 | 0 |
| frame p99 | 339 ms | 32 ms | 49 ms |
| console errors, 404s | 0, 0 | 0, 0 | 0, 0 |

The focused review read the candidate at 1.23 swap jerks per minute, worst 70.7 px, on a quiet machine: this pass reads the same artifact at 1.3 and 1.4 per minute, worst 58.4 and 70.9 px. The feet are as steady as on r52 (0.7 to 0.8 px by registration, 2.4 to 3.3 px by the pixels). CHK-027 still fails; the major FOC53-001 is the disclosed state, and it is 4 to 5 times rarer than r52's reading (r52's was taken under load, so the true ratio is nearer the focused review's 3.1: 3.86 to 1.23 per minute on a quiet machine).

## Observations (no new issue)

- **LV53-1, CHK-026 on one swap, one run of two.** Run a: Yuna idle to hurt at 106.2 s reads stature 0.8843 against a floor of 0.90 (342.2 px to 302.6 px, flag `stature-low`); her hurt painting reads 0.884 to 0.894 on the six swaps of that run and 0.886 to 0.892 in run b, where the same painting passed (the gate's tolerance sits near 0.885, so one reading fell 0.0007 under it). Feet and head of that swap are fine (feet 0.1 px registered, 2.0 px by the pixels). This is the pose-ruler's 0.90 floor against what the pixels read at the edge, in the area r53 did touch (the ruler); the focused review read PASS on the same artifact. For the deep review: Yuna's hurt painting in her Ixion dress sits at the floor's edge (FFX-2 only).
- **LV53-2, CHK-027 FAIL on the live build (the disclosed FOC53-001).** Read above; smaller than r52's, still failing.
- **LV53-3, the held start card on a cold live load: 2.4 to 6.2 s.** Hurried opening at 1600x900: 3.87, 6.18, 4.53 s; phone 3.87 s; pressed once, the card left 2.4 s after it appeared (the press hands the wait to the opening, which then ran 6.4 s before the first menu). r52 held it 0.73 s on the same machine from local disk, r53 from local disk 0.90 to 1.61 s. This is the cost the changelog discloses ("about 3 frame-seconds longer on a slow first load"), measured: of the 3.6, 5.9 and 4.2 s, 2.1, 2.6 and 2.0 s were single frames over 100 ms (the cold load's shader and texture work), and the animation clock, which takes at most 25 ms a frame, advanced 1.1, 3.0 and 2.1 s; the card left when the plan landed, never on the bounded fallback (3 frame-seconds, never more than 15 s of wall clock), whose retire path was therefore not exercised live. The card itself is the full Chapter IV card (frame `run/shots/bahamut-desk-hurry-b-card.jpg`), not a blank screen. This closes the focused review's FOC53-003 (the slow-load wait and the press were not exercised) on the live build: both were seen. Whether 4 to 6 s of card on a first visit is acceptable is Bailey's.
- **LV53-4, the FFX first menu opening while the camera is still easing in (pre-existing).** Seymour Flux at 1600x900: the boss reads 544 px at the first menu and 485 px two seconds later (minus 10.8, 11.2 and 3.5 percent on 3 of 4 live cold loads, 0.4 on the other); the r52 build from local disk did the same in 2 of 4 runs (minus 4.2 and 11.0 percent) and the r53 build from local disk in 2 of 3 (minus 9.9 and 3.5), so this is not r53's and not the framing plan (the plan had settled before the card left in every r53 run). FFX only (CTB; the FFX-2 giant is fitted, see above). Seymour's first camera cut after the card is 317 to 382 px on every build.
- **LV53-5, a coach card can swallow the first Enter on the Change list.** On Yuna's first Change in Chapter XI the "FIRST TIME ONLY" card for Rikku was still up and took the Enter; the row needed a second press. Pre-existing coach behaviour (it dismisses on Enter), recorded because a player's first Change can need two presses.
- 225 `net::ERR_ABORTED` prewarm cancellations in the smoke contexts (no status, no console error).

## Not tested

The r53 content changes this pass did not exercise on live: the FFX hit order of a multi-target action (the turns were single-target Attacks), the FFX-2 per-body chain windows, Chapter VI's fresh-battle openings (Acts II and III), Trigger Happy and Lady Luck's minigames, the intent slab's Berserk and Confuse lines, Yojimbo's starting values, and any Overdrive; a full Chapter XI fight (only Yuna's first Change); Double HP (green gate), Highroad Winds and Downtrodder (not worn in a shipped chapter); the held card under a deliberately throttled CPU or network and the retire fallback (only the natural cold-load spread was seen); the lunge by a person's eye (measured, not watched); the lunge of FFX-2's girls at phone width beyond 4 stretches; the hidden Chapter 28 and the other hidden chapters (Gui excepted); sizes other than 1600x900 and 390x844; the full CHK-024 upgrade matrix (one reload smoke per run only: the save written by the live build reloads byte-identical); a quiet machine (other sessions were running); listening to any audio; a real phone, Safari, a gamepad.
