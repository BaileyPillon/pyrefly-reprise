# r64-fixes: the six fixes after the skeptic and the fight prebuild (lane "r64-fixes", 2026-10-24)

Branch `r64-fixes` (tree `D:/pyrefly-r39-color`), cut from `origin/r63-play` at `03116347d` (the served :5410 build's source: `git diff 1bc679554 03116347d` is booth tooling and docs only). Conference demo only (`?demo=1&pack=demo`); nothing deploys. Each fix is its own commit and says FFX / FFX-2 / both. No game rule, number, painting or sound is changed; Chapter I is FFX, Chapter IV is FFX-2.

**Method.** A = the served r63-play build (:5410, `index-BRj-zlCy.js`); B = a production candidate of this branch (`node tools/candidate-build.mjs --out dist-r64`, served on :5377; the last one `index-DbvIqxGL.js`), headless GPU Chromium at 2560 x 1440, simulated Xbox pad, A and B in the same browser session, a fresh context per run, one RIG-RECORD job at a time. **The GPU was shared** (another lane's Blender and recordings held 7 to 15 GB and 12 to 99 percent of it): every table says the utilisation, and the spread is part of the result. Scratch: `D:/Tools/pyrefly-scratch/2026-10-24/r64-fixes/` (`tools/`, `evidence/`, `progress.md`, `jobs.log`).

## The skeptic's review and the fix pass (2026-10-24 evening)

The skeptic (`D:/Tools/pyrefly-scratch/2026-10-24/r64-fixes/review/REVIEW.md`, verdict MERGE WITH CONDITIONS, nothing critical) found one major and five minors. This pass fixed F1 to F4 and measured each on a new production candidate of the branch (`index-BD5cQ2QG.js`, served on :5377, the review's own harnesses: `review/tools/browse.mjs`, `pick.mjs`, `retryprobe.mjs`, `lose3.mjs`, `review/rv/tools/ixion2.mjs`, `misc1.mjs`; A = the served r63-play on :5410; headless GPU Chromium, 2560 x 1440, simulated pad, one RIG-RECORD job at a time; the GPU was shared with other lanes at 16 to 61 percent). Evidence: `D:/Tools/pyrefly-scratch/2026-10-24/r64-fixes/review/evidence/` (`browse-FX1-*`, `pick-FX2-*`, `pick-FX3-*`, `retryprobe-FXRP1-*`, `retryprobe-FXRP2-*`, `lose3-FXL3-*`) and `review/rv/evidence/` (`FXIX-*`, `FXMISC-*`).

| finding | case | state after this pass |
|---|---|---|
| **F1 (major)**: the 700 ms pad quiet starves the fight warm while a visitor browses the picker | both | **fixed and measured** (below) |
| **F2**: the party swap's arrival half does not work in the real game (a second `render()` replaces the animated rows) | FFX only (Chapter I, the F1 HUD) | **fixed and measured in the real flow**; `?partyswap=off` added |
| **F3**: the retried fight's theme still starts late; the ask at the press is not what starts it | both | **cause confirmed and fixed**: the theme now starts 0.2 to 0.35 s after the press (was 1.9 s); `?retrytheme=off` added |
| **F4**: the `=` legend opened on the pause screen keeps `sb-pause` after the resume | both (the playtest label only) | **fixed and measured** |
| F5: OTHER FIGHT from a lost Chapter I to Chapter IV takes 10 to 12 s to the first menu (both builds) | both | **not touched**: pre-existing, the other fight's figures are not prebuilt (open) |
| F6: `Input.ts`, `BattleScreenFlow.ts`, `demo.css` were over 400 lines and grew | both | **not fixed, said plainly**: all three were over 400 before this lane (573, 635, 416 lines); the sampler cannot leave `Input.ts` without a refactor of its key state; this pass adds nothing to `Input.ts` or `demo.css` (open) |
| F7 / item 2: B at the top of the command menu pauses | both | **unchanged, one question for Bailey** (item 2 below) |

**F1.** `PAD_QUIET_MS` 700 to 150, and the quiet has a budget of 2 s per warm run (`PAD_QUIET_BUDGET_MS`, `padShouldWait` in `demoWarm.ts`); a button that is down still holds a step as it did on r63-play (at most 1.2 s per call). The 4 ms sampler in `Input` (item 1) is untouched. Measured (Chapter IV, the review's `browse.mjs`: title 4 s, 8 s of cursor toggling, pick; n = 4 each, A and B alternating in one browser):

| | A (:5410) | B (this pass) | the reviewed build |
|---|---|---|---|
| first 3.5 s lost, ms | 583, 450, 500, 616 (median 558) | 983, 433, 633, 716 (median 675) | 1400 to 3166 (median 2600) |
| figures parked at the pick | 9 parked, 4 taken, 0 absent in 4 of 4 | 9 parked, 4 taken, 0 absent in 4 of 4 | 0 in 5 of 5 |
| press to first menu | 10.0 to 10.1 s | 9.96 to 10.4 s | 11.2 to 14.8 s |

Chapter I, the same flow (`browse-FX4-*`, n = 3 each): first 3.5 s lost A 900, 450, 416 ms (median 450), B 383, 466, 333 ms (median 383); 9 figures parked and 5 taken in 6 of 6; press to first menu 2.2 to 2.6 s on both.

And the swallowed-press check (`pick.mjs`, 16 timed presses a cell, human and fast, both chapters, FX2 + FX3 = 256 per side): **A 7 swallowed, B 0**, 0 console errors. So the sampler alone removes the swallowed presses and the short quiet no longer costs the browsing visitor the figures. A press that falls wholly inside one stall of the warm is still lost in principle (none seen in 256).

**F2.** `PartyStatusWindow` remembers the swap in flight (`swapT`, `swapAt`); a render inside its window (`swapInFlight`: 90 + 3 x 40 + 220 ms) gives the new rows the same arrival at the same point in it (`resumePartySwapIn`: a negative `delay` starts the animation part-way, a card whose arrival is over is left alone). In the real flow by pad (`ixion2.mjs`, Yuna, Summon, Valefor, then the dismissal): the summon's second render at +129 ms replaces the row (id 4 to 5) and the fade carries on 0.59, 0.74, 0.83, 0.89, 0.97 (before: 0.22 then a pop to 1); the dismissal's second render at +3 ms leaves the three cards cascading 0.25 / 0.11 / 0.31 to 1 with the ghost fading out (before: a cut at full opacity). 0 console errors. `?partyswap=off` is the original's one-frame swap, for a comparison.

**F3.** Cause: the lost `BattleScreen`'s `exit()` calls `audio.stopMusic(0.6)` when the retry's screen replaces it, a few hundred ms after the press, and `stopMusic` bumps the request id, so the theme asked for at the press never started (the reviewed build's mixer: `current` null from +0.36 s, the theme's source at +1.93 s, from the chain's own ask). Now no ask is made at the press; the flow passes `retryTheme: true` in the options of the retried demo fight's `BattleScreen`, whose `enter()` asks for the cue (`demoDefeat.startRetryTheme`), after the exit. The buffer is still kept decoded by the defeat cue (`upcoming`), so no fetch. Probe (`retryprobe.mjs`, a bufferSource hook and the mixer every 20 ms): Chapter IV the 79 s theme buffer starts at **+338 ms** (before +1934 ms) and `music.current` is `boss-bahamut` from +357 ms with no null span; Chapter I the 90 s buffer starts at **+175 ms**, `boss-seymour` from +200 ms. The chain's later ask finds it playing and starts nothing. The whole loss flow by pad on this build (`lose3.mjs`: loss, TRY AGAIN, a second loss, OTHER FIGHT, a third loss, B back to the picker), both chapters, **0 console errors**: TRY AGAIN to the first menu 2.85 s (Chapter IV) and 2.03 s (Chapter I); OTHER FIGHT 3.06 s (IV to I) and 10.4 s (I to IV, F5, as on A); B lands on the picker with the lost chapter selected. `?retrytheme=off` leaves the theme to the chain (r63-play). Not listened to (rule 13): the timing is read from the mixer; the crossfade is the defeat theme's 0.6 s fade-out (the lost screen's exit) under the theme's 0.8 s fade-in.

**F4.** `switchboard.render()` sets `sb-pause` before the legend branch. Measured: legend opened on the pause screen, resume, the legend is `sb sb-legend` at the top right (box 732, 8 to 1912, 518), not the bottom right over the command menu and party cards. The QR plate at five sizes and the 17 keys were rechecked on this build, 0 errors.

Disclosed, not changed: the swap ease (F2), the press-time theme (F3) and the short pad quiet are on with `?pack=demo` by default, as in the reviewed branch; the first two now have a word to turn them off (`?partyswap=off`, `?retrytheme=off`; `?demowarm=off` stops the whole warm, the quiet with it). Bailey has not seen the swap ease or heard the theme timing; if he wants "nothing new on by default", those two go behind a word instead.

## Summary

| # | Fix | Case | State |
|---|---|---|---|
| 1 | swallowed picker presses | both | **fixed in the measure**: 4 of 128 timed presses swallowed on A, 0 of 128 on B (B1 build); the cause was the page's frame gap, not a stall; **repeated on the final build after the review pass: A 7 of 256, B 0 of 256** (the quiet is now 150 ms, see the review section) |
| 2 | B opens the pause with no menu open | both | **left as it is: unsourced** (below), one question for Bailey |
| 3 | TRY AGAIN: silence, hitches | both | **better**: first 3.5 s lost 716 / 817 ms against 1,199 / 966 ms; **after the review pass the theme starts 0.2 to 0.35 s after the press** (the lost screen's exit had been dropping the ask; see the review section) |
| 4 | Ixion swap cut; "970" over the turn strip | FFX only | **fixed**: the swap eases (12 ghost frames, 7 + 7 frames of fade; **in the real flow after the review pass**, where the game renders the list twice), the numerals dodge the strip's whole footprint |
| 5 | switchboard label over the pause tabs; QR caption at 1280 x 720 | both (playtest label, booth plate) | **fixed**, measured |
| 6 | the room's dressing behind the picker | both | **built, proved identical, OFF BY DEFAULT** (`?livingpre=on`): the booth A/B pairs could not separate it from noise and one Chapter I run lost 2.7 s; two pages holding parked rooms crashed twice |

Checks: `tsc --noEmit` clean; 72 touched test files, 959 tests pass (new: `r64-pad-sampler`, `r64-hud-fixes`, `r64-living-park`; `prebuild-warm-order` updated); `node tools/orphans.mjs`: 24 orphans before and after (2149 to 2154 modules, the 5 new ones all reachable); both chapters to the results screen by simulated pad on the final build with **0 console errors** (Chapter IV 22 turns, 180 s; Chapter I 14 turns, 222 s; `rv-evidence/evidence/b4-ch4-win`, `b4-ch1-win`, the harness's usual assists, `R63_ASSIST` 150). Not run: the whole `npm test` (the nine art-dependent files that are red on r63-play are red here too, by the prebuild note).

## 1. Swallowed picker presses (both games) · commit "Pad is read between frames ..."

**Cause, found with the page's own trace (`tools/pick.mjs`: per tap the in-page down and up times, every rAF, a MessageChannel heartbeat for main-thread stalls, a CDP CPU profile, a GL tap).** Presses were swallowed when no frame ran inside the hold: the swallowed taps had **0 or 1 frame inside a 75 to 107 ms hold, covered by a frame interval of 133 to 367 ms, with no main-thread stall inside the hold** (the page was waiting on the GPU process, the main thread free). `Input.update` read the pad once per frame, so a press that began and ended inside that gap was never seen. The warm's own steps do hold the page (profile of the same runs: `getProgramInfoLog` 100 to 250 ms, the 5376 x 3072 `texSubImage2D` 290 to 314 ms, a 64 x 64 `getImageData` 316 ms to 650 ms, `drawImage` 300 ms) and cover other presses, but they were not what ate these.

**Fix.** `Input.sample()` reads the pad on a 4 ms timer while a pad is connected (`Input.ts`; a press seen between frames is latched until the next frame reports it, and its release is held back one frame so a held-button reader such as fast-forward still gets its release edge; no pad, no timer; stopped by `detach`). The demo warm does not start a step in the 700 ms after a pad button changed (`padActivity.ts`, `demoWarm.idle`, at most 1.2 s per call), which protects the rest of a run of presses from the 100 to 650 ms steps.

**Before / after (same session, A = :5410, B = dist-r64 of that commit; each cell 32 timed presses: title A, 28 cursor moves, the pick's A; hold 100 ms and gap 330 ms at "human", 70 ms and 120 ms at "fast"):**

| chapter | pace | A swallowed | B swallowed | presses with no frame inside the hold (A / B) | stalls of 40 ms or more after the title (A / B, one rep each) |
|---|---|---|---|---|---|
| I (FFX) | human | 0 / 32 | 0 / 32 | 0 / 1 | 30 / 10 and 19 / 13 |
| I (FFX) | fast | 2 / 32 | 0 / 32 | 2 / 0 | 16 / 6 and 23 / 6 |
| IV (FFX-2) | human | 1 / 32 | 0 / 32 | 0 / 2 | 29 / 22 and 40 / 20 |
| IV (FFX-2) | fast | 1 / 32 | 0 / 32 | 1 / 1 | 19 / 12 and 33 / 13 |
| **all** | | **4 / 128** | **0 / 128** | | |

The four on A were all cursor moves (title A 0 of 8 and the pick's A 0 of 8 on both sides). An earlier A-only run: 1 of 32 (Chapter IV, human; `evidence/pick-A1-*`). 0 console errors. Evidence: `evidence/pick-P1-1792862128268` (`results.json`, `frames-*.json`), `tools/pick.mjs`. **Honest limit:** 0 of 128 against 4 of 128 is a clear direction and not a proof (about p 0.06); a press that falls wholly inside one 300 to 650 ms stall of the warm is still lost, and the quiet wait only protects the second press onward. The measure was taken on the build before the room prebuild (item 6) and before the retry changes (item 3); the final build was played by pad to results with 0 errors but the 128 presses were not repeated on it (time).

## 2. B opens the pause menu with no menu open (both games) · no code change

`BattleScreen.canPauseOnCancel` lets the pad's B / Circle (and Esc, Backspace, X) open the pause when no submenu owns it (the 2026-10 report: "Esc did nothing" at the top row). Sources checked: `research/assets-and-tech.md` §2A.1 and 2A.2 (our own input map: `face.east` = "Cancel / back", `menu.start` = "pause / system menu", Start on `buttons[9]`), `research/ffx-combat-core.md`, `ffx2-combat-core.md`, `ffx-overdrive-input-rules-2026-09-30.md`, the `re-*.md` notes. **None says what ○ / B does at the top level of the command menu in FFX or FFX-2**, only what each button means in the minigames and that Start is the pause. By rule 6 ("never invent game data") and rule 14 it is left as it is. **Question for Bailey:** may B at the top level do nothing (Start / P / the chip pause; Esc keeps pausing on a keyboard, where it is the documented pause key)? The change is one line in `canPauseOnCancel` and a `menuOwnsCancel` case; it would also stop two quick B presses from opening the pause after backing out of a submenu (the skeptic's m12).

## 3. TRY AGAIN (both games) · commits "TRY AGAIN brings the fight's theme in ..." and "TRY AGAIN: the lost fight's theme stays decoded ..."

Findings on the served build, then what changed: (a) the defeat theme is a sting that has ended before the press, and the fight's theme came in with the chain, 2.9 to 3.3 s after the press; the probe (network and `audioDebug().music` every 125 ms) showed `boss-bahamut.mp3` requested 0.32 s after the press and **audible only 2.2 s after it**, because `AudioManager`'s eviction (keep 3) had dropped the decoded buffer when the defeat theme started, so the retry decoded it again. (b) the light retry warm built the stage but not the figures, so their paintings went up again under the retry's first seconds.

Changes: the lost demo fight's own theme is named `upcoming` when the defeat cue starts (kept decoded), the theme is asked for at the press itself (`showProDefeat`, with the flow's later ask as the fallback), and `warmDemoFights` with `light` now runs the figure prebuild behind the defeat card too (`?prebuild=off` keeps the old light warm).

| run (same session, 3 s on the defeat card) | A | B |
|---|---|---|
| **R2, the final build.** Ch IV: first 3.5 s lost / worst frame / press to first menu | 1,199 ms / 350 / 3.33 s | 716 ms / 300 / 2.84 s |
| Ch IV: theme audible after the press (silent span) | 3.33 s (3.13 s) | 1.76 s (1.64 s) |
| Ch I: first 3.5 s lost / worst frame / press to first menu | 966 ms / 233 / 2.13 s | 817 ms / 250 / 2.17 s |
| Ch I: theme audible after the press (silent span) | 3.00 s (2.88 s) | 2.51 s (2.38 s) |
| R1, the first build (before the music fix), Ch IV, 2 pairs: lost 3.5 s | 1,016 / 533 | 483 / 450 |
| R1: silent span | 2.88 / 2.50 s | 2.13 / 2.13 s |

Figures are parked behind the card (`__prebuildStats` after the retry: parked 13, taken 8, mismatched 0, against 9 / 4 on A). 0 console errors. Evidence: `evidence/retry2-R2-1792869326630`, `retry2-R1-*`, `retry2-R1d-*` (the timeline), `tools/retry2.mjs`. **Not finished, said plainly:** 1.6 to 2.4 s of silence remain after the press; I did not find why the theme still starts 1.5 s after the call when the buffer should be cached (the hold made it earlier by 0.5 to 1.6 s, so part of it worked; the next thing to read is whether the buffer is still evicted by a later `playMusic` without `upcoming` between the defeat sting and the press). One pair per chapter on the final build; Chapter I's retry hitch is smaller (817 against 966 ms), not gone. Nobody has listened (rule 13).

## 4. The Ixion swap and the numeral over the turn strip (FFX only: Chapter I)

*Swap.* `ui/ffx/partySwap.ts`: when a render changes who is on the list (an aeon's summon, Banish) in the F1 HUD, the old cards stay as a ghost that slides out and fades over the HUD's own 170 ms and the new ones slide in over its 220 ms, one step (40 ms) apart after 90 ms; REDUCE MOTION fades only. The swap itself stays as the original has it. Measured by asking the real HUD's list to show one actor and then the three again, sampled every frame (`tools/probe970.mjs`):

| | A | B |
|---|---|---|
| list height 112 px to 364 px (and back) | one frame | ghost drawn for **12 frames**; the new first card is at opacity 0 for 7 frames, then 0.22, 0.50, 0.68, 0.79, 0.86, 0.91, 0.94 |
| stills (the same swap at a tenth of the speed) | | `docs/screenshots/r64-fixes/party-swap-B-ghost-t250.jpg`, `party-swap-B-after.jpg` |

*Numeral.* The FFX numerals dodged `.ig-ctb`'s own box (88 to 266 px at 2560 x 1440), but the strip's names and chips hang to 356 and its heading starts at 53 (`footprintOf`); a foe's number landing at the top right printed over the names (the skeptic's "970", m6). The strip is now dodged by the union of everything drawn in it. On A a 9999 on Seymour Flux overlapped the footprint (numeral box 1512 to 1880 by 289 to 499 against the strip's 1860 to 2502 by 53 to 356); on B none of six numerals (970, 9999, 57 on both foes) overlaps it (`over: []`). `numeral-9999-A-before.jpg` / `-B-after.jpg`. Limit: I could not make the exact moment of the skeptic's frame (the Ixion finish) happen; the 970 itself did not overlap on A in my probe (its x was clear of the strip), the 9999 did. Evidence: `evidence/probe970-A-b1-*`, `probe970-B-b1-*`.

## 5. The two small overlaps (both games; the playtest label, the booth QR plate)

- Switchboard label on the pause screen, Chapter IV, 1920 x 1080 (`tools/shots5.mjs`): on A its box (614 to 1306 by 4 to 77) overlaps the tabs Guide, Options, Accessibility, Controls, Music; on B (`sb-pause`, bottom edge, 1003 to 1076) it overlaps none. `pause-label-A-before-top.png`, `pause-label-B-after-bottom.png`.
- QR plate at 1280 x 720: on A the plate is 113.8 px wide (99.5 inside), "PLAY IT YOURSELF" wraps to two lines and the address (117 px) spills past both edges; on B it is 156 px (141.8 inside), one line (132 px), the address fits. At 1920 x 1080 both are the same (170.7 px). `qr-1280-A-before.png`, `qr-1280-B-after.png`.

## 6. The room's dressing built behind the picker (both games) · OFF BY DEFAULT

`LivingPark.ts` / `LivingPaintings.parkLivingScene` / `app/demo/prebuildLiving.ts`: the warm builds the same `Living` (the bind `BattleScreen.enter` makes, from the same scene, camera, renderer and battle camera), draws its parts once per program family (`prebuildDraw.drawParts`), and parks it; `bindLivingScene` adopts a room parked for exactly that scene (whole or still building) and disposes any other. A room with arcs is never parked (its arcs read the camera at the build; neither demo room has them). The plan runs it after the figures' programs. `LivingPaintings.ts` stays under 400 lines (the plates request and `warmLivingPlates` moved to `LivingPlates.ts`, unchanged). **`?livingpre=on` turns it on (under the `?prebuild` gate); the default is r63-play's** (the last commit).

*Proof that it is the same room (the "frozen-frame compare").* A cross-session A against B frame cannot be pixel-exact: even A against A differs (the plates' `pixelWidth` is 2688 in some loads and 5376 in others on both builds, and the entry's clocks drift), so the compare is inside one page: the clocks are frozen (`fx.freeze`), the adopted room is captured twice 1.5 s apart (the page's own noise floor), the room is then rebuilt the normal way (`fx.tier('low')` then back, which makes the room's own `build()` run again with the figures and camera in place) and captured a third time (`tools/flip6.mjs`):

| chapter (room) | noise floor (two shots) | adopted vs rebuilt | the plate build: adopted vs rebuilt |
|---|---|---|---|
| IV, FFX-2 (bevelle-underground, 5376 plates) | 0 of 3,686,400 pixels differ | **0 differ**, the PNGs are byte-identical | 8 ms vs 268 ms |
| I, FFX (gagazet, 2688 plates) | 0 of 3,686,400 | **0 differ** | 11 ms vs 429 ms |

(Chapter IV once more at 2688, byte-identical too, and a first run of that flip; `evidence/flip-X1`, `-X2`, `-X4`. Chapter I frozen from the title crashed the page twice, because its intro scene does not run frozen: it is frozen when the battle appears instead.) The plan's own log: "the room's dressing built behind the picker (6 to 9 ms, 5 parts)" then "the room's programs built in 110 to 148 ms (9 draws)"; adopted room's stats at the first menu: 4 plates, 4 lamps, the fields, the haze, 0 console errors (`evidence/smoke6-S6a-*`).

*The booth A/B (70 s idle, the attract card, a wake press, a second press, the picker 3 s with the cursor on the chapter, the pick; first 9 s of the fight; `tools/booth2.mjs`).* Four-page waves (two pages per chapter, idle together, measured one at a time) crashed the browser twice on B (never on A) and saturated the GPU for the later runs; single pages in sequence were slower to collect. All runs, first 9 s lost in ms / worst frame in ms, GPU utilisation at the wake (before the measure):

| chapter | A | B |
|---|---|---|
| IV (FFX-2) | 516 / 133 (GPU 17 %), 400 / 117 (21 %), 200 / 117 (12 %), 2,064 / 500 (84 %, saturated) | 433 / 117 (14 %), 300 / 133 (84 %, saturated), 2,166 / 467 (92 %, saturated) |
| I (FFX) | 733 / 400 (58 %), 283 / 183 (67 %), 183 / 100 (14 %), 3,947 / 833 (99 %, saturated) | 200 / 133 (53 %), **2,683 / 717 (13 %, not saturated)**, 4,648 / 1,800 (99 %, saturated) |

("Saturated": the GPU at 80 percent or more when the visitor woke the card. Same-session pairs: BO1 (both sides, four pages in parallel), BO4 (B and A one page at a time in turn), BO3 (A only, then B's browser crashed).)

Reading it: without the saturated runs the lists are A 516, 400, 200 and B 433, 300 in Chapter IV, and A 733, 283, 183 and B 200, 2,683 in Chapter I: no difference I can call, and one Chapter I run on B that lost 2.7 s (a 1.25 s frame in the entry, six long tasks of 300 to 700 ms; it was the third run in that browser) which I could not explain or repeat in the time left. Presses swallowed: 0 in all 14 wake, picker and pick sequences, both sides. The adopted room's mechanism does work (8 to 11 ms of plate build at the bind against 268 to 429 ms rebuilt), and the entry's cost it removes is real, but on a shared GPU it did not show above the noise, and a page holding two parked rooms plus the parked figures (about 0.7 GB more) crashed when two pages shared the card (B twice, A never). So it ships off. **Question for Bailey / the driver:** try `?livingpre=on` on the booth PC with the GPU free and 5 runs of the booth case; if it is not clearly better, drop it. Evidence: `evidence/booth2-BO1-*`, `BO3-*`, `BO4-*`, `flip-X*`, `smoke6-S6a-*`.

## What is not done

- Item 2 (above: unsourced, one question). Item 6: no clear before/after gain; default off. F5 (OTHER FIGHT from Chapter I to Chapter IV, 10 to 12 s to the first menu, both builds) and F6 (three files over 400 lines before this lane) are open.
- The review pass did not run: the whole `npm test` (1,642 files); a real pad, a 120 Hz screen, any listening; the numerals in a real fight corner.
- `docs/handoff/NOW.md` and the ledgers are not updated by this lane (records belong to the driver's merge).
- Not listened to (rule 13): the retry's music timing. Not run: a real pad, a 120 Hz screen.
