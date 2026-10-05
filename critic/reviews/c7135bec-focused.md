Build / artifact / target version: c7135bec (release 39 candidate on main, pushed; full c7135bec6ef6e820445e4714de1bf11750594b7f) / artifact D:/pyrefly-r39-int/dist, bundle index-gfFVfQgT.js and index-CcZyQUTT.css, 3,848 files, 8.32 GB, built from 3cb9c520 with src, public, index.html, vite.config and package.json identical to c7135bec / live 8136f2ed (release 38, bundle X5kGUd9G, https://echoesofspira.com) / targets.json sha256 b5933731...2e7d
Review: focused
Deployment: NOT APPLICABLE. Live verification of this exact artifact is a separate obligation after the deploy; nothing was deployed.
Changed area: FAIL. Most of what release 39 claims holds (see "What held"), but the Chapter X Sensor card sits on Seymour Natus (R39F-01), Evrae's new pose cuts raise its snaps from 0.46 to 19.5 a minute (R39F-02), and the two continuity checks still fail on the candidate as on live.
Ship: HOLD. R39F-01 is a major regression against live (the Natus card covers about 48% of his figure; live 0%; one-line fix measured) and R39F-02 is a second major regression (a snap the change adds; Bailey's taste call between a cut and a ghost). No critical defect. Disclosed majors that are not regressions: R39F-03 (CHK-026 still fails, fewer failures than live) and R39F-04 (CHK-027 still fails, fewer jerks and double images than live).
Milestone: not assessed
Quality: not scored (focused pass). Bailey's five visual sub-scores, provisional, with the continuity caps applied: characterModels 7.0 (capped; 8.3 judged without the cap), enemyModels 8.0, animation 7.0 (capped; 7.5 without), fidelity 8.5, camera 8.0; round 21 (6461999e, 2026-10-04) read 8.2 / 7.8 / 7.4 / 8.2 / 7.9. The last full weighted score is round 21: provisional, audio unverified, encounter, visual, feel, interface, onboarding and delivery under the 9 floor.
Targets: required 8 / matched 7 / failing 1 / unverified 0 / waiting 0
Top issues: R39F-01 (major, regression, FFX Ch X): the Sensor card covers about 48% of Natus; add `--ffx-sensor-py` to the card's `top` in hud-floor.css lines 73 to 75 (cover 0.0 to 0.1% with it); evidence natus-sensor-card-candidate-vs-diagnostic-vs-approved.jpg. R39F-02 (major, regression, FFX Ch VIII): Evrae cuts between poses, 107 snaps in 5.5 minutes against 3 on live; Bailey chooses cut, hold or an authored in-between; evidence the continuity strips swap-027 and swap-365. R39F-03 and R39F-04 (major, disclosed): CHK-026 and CHK-027 still FAIL on both builds, with fewer failures on the candidate. Polish: the guide's labels under the 14 px floor below 1600 wide (R39F-05), "Click its picture" for key and pad players (R39F-06), the 2x backdrops gated by the link estimate (R39F-07), the guide giving way at TEXT SIZE 115 and 130 in FFX-2 (R39F-08), 58 art files at the title (R39F-09), a Chapter III Yuna-first sliver (R39F-10).
Coverage: Tested: the production build in headless GPU Chromium with real keys, a pad, mouse and touch: rendering and the governor, the art tiers and wire form, the held backdrops, Ch III, Ch X at three sizes with resizes, the five visual fixes, Defend, the slab, the Overdrive overlays, first run, the advisor ladder, the 14 px floor, TEXT SIZE, EYE CANDY, the guide, Lady Luck in Wait and Active, three real-key fights to the board, a loss and retry, two phone turns, the continuity harness over Ch I, IV and VIII, and the art gates. Reused: the driver's tsc, suite and integration gates; the live continuity baseline. Not tested: Ch II, VII, IX, XI, XII, XIV, XV, XVII, XVIII by play, a full win by touch or pad, FFX-2 losses, audio, real devices, Safari and Firefox, results screens at other sizes, the live artifact.
Next required review and why: fix R39F-01 and settle R39F-02, then a focused re-check of the changed areas on the new candidate; after the deploy, live verification of that artifact (CHK-017) and the deep review owed on the live build (two shared-system deploys may go out while a deep review is owed; the third refuses).
Elapsed review time / repeated work avoided: about 108 minutes, a third of it in unattended fights and the continuity harness. The unit suite, tsc and the Cloudflare gates were not re-run (the integration lane ran them on this tree); the live continuity baseline was reused.

## Plan

`node tools/critic-plan.mjs` in D:/pyrefly-r39-int gave: review DEEP; before the deploy a FOCUSED review of the production candidate; after the deploy live verification, then the DEEP review on the live build (this build owes it); obligations live, focused and deep; 189 shipped files and 932 with no product effect; both games; checks CHK-002, 003, 004, 006 to 023, 026 and 027; target groups cast, fight, pause, phone, presentation and scenes, plus an audit of every changed data value against research/. The change touches no save-data class and makes no milestone claim, so the focused pass runs first.

## Candidate and environment

- D:/pyrefly-r39-int at c7135bec6ef6, clean apart from this review's folder. dist is the production build (BASE_PATH=/), served by `vite preview` on 127.0.0.1:5461 (PID 90908). **Stopped by PID (taskkill /PID 90908 /T /F); port 5461 confirmed closed.** No dev server was started.
- Browser: headless Playwright Chromium 153 with PYREFLY_BROWSER=gpu (RTX 5070 Ti, ANGLE D3D11): no black canvas, no software fallback. One or two browsers at a time, never Claude-in-Chrome and never the in-app pane. Live comparisons read https://echoesofspira.com, which still serves release 38 (bundle X5kGUd9G, confirmed at review time).
- The driver's PAUSE-GPU marker (D:/Tools/pyrefly-scratch/2026-10-04/r39-art/PAUSE-GPU) was in place from 01:44 EDT while this review used the GPU, so the GPU art lane's watcher held its batch. **It was moved (copied, size-checked, then removed from there) to F:/pyrefly-parked/2026-10-05/r39-focused/PAUSE-GPU at 03:15 EDT; the watcher may resume the batch now.** Nothing else was deleted; the harness's 9 frame-sequence folders (13.6 MB) and the PNG originals of the continuity frames were parked under F:/pyrefly-parked/2026-10-05/r39-focused/ the same way, and this review's scratch followed.
- Drivers: the scratch probes in D:/Tools/pyrefly-scratch/2026-10-05/r39-focused/cap (now parked) over the product's own debug API, `critic/runner/lib/continuity.mjs` and `critic/runner/lib/route.mjs` from the candidate, and the repo's art tools. Labelled hooks only: setSeed(1) before the first key, ?coach=off, gotoChapter for navigation, battleState gauge := 100 for the Overdrive runs, crisp.simulate (the product's QA seam), and the URL switches ?artlink, ?artscale, ?crisp, ?stand, ?figtrue.

## Game case of each change (CHK-021)

- **FFX only:** Chapter III calm menus and the target-aware lunge (the staging row answers only for FFX); the Natus pin and card (Ch X); Evrae's masters and pose cut (Ch VIII); the Gagazet, Garden of Pain and Via Purifico masters; Defend on the tab and the pad Select slab toggle; Bushido and Swordplay by tap and click; the per-tier Swordplay zones (our estimate, adopted by Bailey 2026-10-04).
- **FFX-2 only:** Lady Luck's reels and her chapter availability; the twirl start, dressphere shot, run-in truck and Bevelle conduits; the Road to the Farplane masters.
- **Both:** the sharpness ladder and governor, the art tiers and wire form, the 14 px floor, TEXT SIZE, EYE CANDY (OVERDRIVE SHOT in FFX, DRESSPHERE SHOT in FFX-2), the guide sheet and the advisor ladder, the first-run guide, the figure true-colour switch, the continuity harness. Checked: FFX-2 has no Defend tab and its slab still toggles on Triangle; FFX has no reels.

## What held (measured on the production build)

- **Rendering (both).** F plus is the default at 1600x900, 2560x1440 and 3840x2160 (2x supersampling, 59.9 fps, 0 errors). With a simulated 30 ms frame interval (the product's QA seam) the governor stepped F plus to F (1.5x) within 2 s and to A2 within 5 s, and stayed on A2 through the 9 healthy seconds that followed (never back up); `?crisp=fplus` stays pinned; the phone keeps its own chain at 59.9 fps. Figure masters load at 2x at windows 2560 wide or more (backdrops also need the link estimate, R39F-07), and `?artscale=3` and `=4` load and draw (Evrae 39 files each; Ch I at 4K 46 at 4x). 0 raw `@` art requests and 0 redirects in the candidate's runs; the 19 HTTP 307s in the recorded runs all come from the five live release 38 runs.
- **Backdrops (FFX Gagazet, Garden of Pain, Via Purifico; FFX-2 Road to the Farplane and its links).** With the link forced fast, each draws its 5,376 px master from the first sample; naturally it depends on the browser's link estimate (R39F-07). The title's own backdrop master has no screen that draws it (the title draws title/keyart.2x.webp).
- **Evrae and the rims (FFX).** Evrae's new 2x, 3x and 4x masters load and decode; 100 percent crops at 4K show smooth contours with no specks or dashes on Evrae and Wakka. The figure true-colour switch is off by default: 0 of 1,440,000 pixels differ between the default and an explicit 0; switched to 1 it changes 707,779.
- **Staging.** Chapter III (FFX): camera drift while a menu is open 0.18 to 0.21 units against live's 0.95 to 0.97; with Tidus first there is no overlap at any reading (live median 2,566 px2); with Yuna first the overlap falls from live's median 3,803 px2 to 167 px2 (R39F-10); the lunge reaches every target (9 of 9 and 11 of 11 attacks make contact; run-in 2.12 to 2.51 against 1.40 with the stage off). Chapter X (FFX): Natus is pinned at 1600x900, 2000x1012 and 2560x1440 and re-plans after a window resize at the next turn; at 16:10 (1440x900) the pin is off by design and he plays as on live.
- **Visual fixes (FFX-2).** Twirl start: the keys begin at 100 ms and the colour column is never drawn before the twirl (2 of 2 changes). Dressphere shot: full, 1.6 s, with no menu or coach card in it. Run-in truck (Ch XVI): all three girls whole in 623 of 623 samples at 1600x900, 2000x1012 and 390x844. Bevelle conduits: the pillars and lamps stand at plus or minus 10.5 and 11.9 units at 2560x1080 and plus or minus 7.9 and 8.9 at 1600x900. Evrae's cut: see R39F-02.
- **Interface.** Defend fires by Q, a click, a tap and the pad Triangle, and Shift alone does nothing. The FFX slab toggles on pad Select (and E); FFX-2 keeps Triangle. Swordplay works by pad, click and tap and Bushido by key, pad, click and tap (Swordplay's keyboard press is the old path and was not re-run). The first-run guide completes by key, pad and touch. The advisor ladder prints cost and effect in the narrow boxes of Ch VII, IX, XII, XVII and XVIII. The 14 px floor and the Overdrive clamp hold at 1600x900 and on phones; TEXT SIZE 115 and 130 keep every text at 14 px or more in Ch I, IV, V and VI and both pauses. EYE CANDY: switching a look back on brings its parts back, in both games. The strategy guide shows the corrected Seymour Flux Total Annihilation text (Shell halves it; Defend does not).
- **Lady Luck (FFX-2).** Present in Ch V, XIII and XVI and absent in IV and VI, as research/ffx2-lady-luck-availability.md says (XI and XV match in data). The timed reels played by key, pad and tap in Wait and Active ATB: three stops, a result spell (cherry reels cast Flare; Red 7 cast Ultima), "PRESS ENTER / PRESS CROSS / TAP TO STOP" by device. One pad press in Active missed its symbol (a timing game).
- **Outcomes.** Real-key wins in Ch I (73 turns), Ch IV (48) and Ch VIII (76) reached the Victory screen, the board and a reload with the chapter cleared; a Ch I defeat reached the Defeat screen and Retry reached a battle; two phone touch turns (Ch I Attack and target; Ch IV White Magic, Shell, and the CONFIRM control) used no key. 0 console errors, 0 missing files, 0 bad art responses in 125 recorded runs.

## Issues

### R39F-01 (major): Seymour Natus: the Sensor card sits on his body (about 48% covered) because the floor rule drops the pin's lift

- Game and chapter: FFX, seymour-natus (Chapter X). Tags: introducedByCandidate true, regressionVsLive true, inNewFeature false.
- Expected: The r39-natus lane stands the Sensor card at the top of the stage while Natus's colossus master stands (pin card [410, 4]); the card is clear of his figure at every window shape from 1.7 to 2.45. The lane measured 0% card cover of his painted pixels at 1600x900, 2000x1012 and 2560x1440 on its own branch (docs/handoff/r39-natus.md), and Bailey accepted option N on 2026-10-04.
- Observed: On the production build the card is at CSS top 165 px instead of 4 px. It covers 47.9% of Natus's figure box at 1600x900 (card 297x223 at x1001 y413; Natus 201x349 at x1085 y231), 47.3% at 2000x1012 and 47.1% at 2560x1440, and 47 to 48% again on the Attack target step and whenever Mortibody is the aimed enemy (the default first target). Live covers 0%. In the later states of the resize run the visible `.ffx-sensor` was the 146x27 strip at the top (cover 0); the full card was not on screen in those states. With one diagnostic stylesheet rule that adds `--ffx-sensor-py` to the card's `top`, the card moves to top 3.2 px and the cover is 0.0 to 0.1% in all four steps.
- Repro: Real keys, setSeed(1), ?coach=off, 1600x900, 2000x1012 or 2560x1440: title, board, Chapter X Seymour Natus, Enter on prep, skip the scene, first menu; read `.ffx-sensor` against `__pyrefly.targeting().rects["seymour-natus"]` (scratch cap/natus.mjs and cap/sensorprobe.mjs; results in the review folder).
- Evidence: `critic/reviews/c7135bec-focused/frames/natus-sensor-card-candidate-vs-diagnostic-vs-approved.jpg`, `critic/reviews/c7135bec-focused/frames/natus-first-menu-1600x900-candidate.jpg`, `critic/reviews/c7135bec-focused/frames/natus-first-menu-1600x900-diagnostic-css.jpg`, `critic/reviews/c7135bec-focused/frames/natus-first-menu-2560x1440-candidate.jpg`, `critic/reviews/c7135bec-focused/results/sensor-cand-1600x900.json`, `critic/reviews/c7135bec-focused/results/sensor-cand-2560x1440.json`, `critic/reviews/c7135bec-focused/results/sensor-live-1600x900.json`, `critic/reviews/c7135bec-focused/results/sensor-cand-1600x900-fixdiag.json`, `critic/reviews/c7135bec-focused/results/natus-1600x900-s1-a.json`, `critic/reviews/c7135bec-focused/results/natus-2000x1012-s1-a.json`, `critic/reviews/c7135bec-focused/results/natus-2560x1440-s1-a.json`
- Confidence: high (measured at three sizes against the game's own figure rect; cause shown by the diagnostic change). Requirement: CHK-008, CHK-011; the r39-natus acceptance (card clear of Natus); target tile "Seymour Natus, Chapter X (FFX)".
- Where: src/ui/common/hud-floor.css lines 73 to 75: `html:not([data-phone-battle]) .ffxhud .ffx-sensor:not(.ffx-sensor--folded) { top: calc(166px + var(--ffx-sensor-dy, 0px) - clamp(...)) }` omits `+ var(--ffx-sensor-py, 0px)`, which src/ui/ffx/ffx-hud.css:556 has and src/engine/fx/mix/sensorPin.ts writes (-162 px). The floor rule (r381-ui-floor) was merged after the pin (r39-natus) and wins the cascade. Cause shown by the diagnostic; the fix itself is not applied.
- Smallest fix: Add `+ var(--ffx-sensor-py, 0px)` inside that `top: calc(...)` (one line). Keep the folded rule as is.
- Acceptance check: sensorCoverOfBoss at most 0.05 on the first menu, on the Attack target step and with Mortibody aimed, at 1600x900, 2000x1012 and 2560x1440; card top about 4 px; the card at TEXT SIZE 115 and 130 and in other chapters unchanged; the floor lane's 14 px and clamp measurements unchanged.

### R39F-02 (major): Evrae now cuts between poses: 19.5 snaps a minute against 0.46 on live (a double image traded for hard cuts)

- Game and chapter: FFX, evrae-airship (Chapter VIII). Tags: introducedByCandidate true, regressionVsLive true, inNewFeature false.
- Expected: PR-0367 removes the two-heads frame (the 140 ms cross-fade drew two half-strength heads on every hit). CHK-027 and D-424 allow at most 0.25 snaps per minute of battle.
- Observed: Evrae's 105 counted pose swaps are all hard cuts (the chapter's snaps by the pose they land on: 56 to idle, 32 to hurt, 10 to cast, 7 to attack, 2 to KO; silhouette overlap as low as 0.008). The chapter has 107 snaps in 328.6 s (19.54 per minute) against 3 in 394.2 s on live (0.46); the severe double images on Evrae (0.40 or more) went from 9 to 0 and the chapter's from 10 to 2. Its head mass jump (115.6%) is unchanged. A cut between two silhouettes this different is a snap by the harness's definition and by Bailey's continuity rule.
- Repro: `node critic/runner/lib/continuity.mjs --base=<candidate url> --chapters=evrae-airship` on the candidate and on live (the baseline of release 38 is in critic/reviews/continuity-baseline-r38); read strips swap-027-evrae-cast-idle.jpg and swap-365-evrae-idle-cast.jpg.
- Evidence: `critic/reviews/c7135bec-focused/continuity/evrae-airship-win-c7135bec/continuity/continuity.json`, `critic/reviews/c7135bec-focused/continuity/evrae-airship-win-c7135bec/continuity/strips/swap-027-evrae-cast-idle.jpg`, `critic/reviews/c7135bec-focused/continuity/evrae-airship-win-c7135bec/continuity/strips/swap-365-evrae-idle-cast.jpg`, `critic/reviews/continuity-baseline-r38/evrae-airship/continuity.json`, `critic/reviews/c7135bec-focused/frames/evrae-2560x1440-crop-live-left-candidate-right.jpg`
- Confidence: high for the measurement; whether a cut beats a ghost is Bailey's taste call, not a measurement (the lane chose the cut on purpose: docs/handoff/r39-visfix.md, PR-0367). Requirement: CHK-027 (category feel); D-420 to D-426; RUBRIC 6a snap cap.
- Where: suspected: SceneStaging.poseCutArt (named in docs/handoff/r39-visfix.md); not traced here
- Smallest fix: Bailey decides, from a measured clip or mockup of each answer (rule 9 and the boss-side rule: do not tune numbers): (a) keep the cut and record the snap count as accepted; (b) a short hold or mask that never shows two heads; (c) an authored in-between pose for the head-only moves. The snap cap on animation (7.5) applies until then.
- Acceptance check: Evrae chapter snaps per minute at most 0.25 and 0 double images of severity 0.40 or more in the continuity harness, or an owner decision recorded that a hard cut between poses of different silhouettes is accepted.

### R39F-03 (major): CHK-026 still fails: figures change size and feet across pose changes (less than on live)

- Game and chapter: both, Ch I, IV, VIII (harness). Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false.
- Expected: Head size within 3% where the head is registered (30% by mass), feet within 2 px registered (6 px by silhouette) across a pose change (CHK-026).
- Observed: 281 of 1,268 swaps change a head beyond tolerance (live 297 of 1,281), worst 115.7% by mass (Evrae, unchanged) and 8.4% registered (live 57.1%); 137 standing swaps move the feet beyond tolerance (live 868), worst 140.6 px (live 259.4). By chapter, head-over / feet-over: Ch I 100 / 135 (live 177 / 346), Ch IV 29 / 1 (live 35 / 242), Ch VIII 152 / 1 (live 85 / 280; the head count rises because more swaps are now registered and held to the stricter 3%, 236 against 114). Ch IV's single remaining feet swap is 140.6 px (live worst 98.3).
- Repro: The same harness run, strips in the continuity folder.
- Evidence: `critic/reviews/c7135bec-focused/continuity/continuity-summary.json`, `critic/reviews/c7135bec-focused/continuity/seymour-flux-win-c7135bec/continuity/continuity.json`, `critic/reviews/c7135bec-focused/continuity/ffx2-bahamut-win-c7135bec/continuity/continuity.json`, `critic/reviews/c7135bec-focused/continuity/ffx2-bahamut-win-c7135bec/continuity/strips/swap-392-bahamut-hurt-ko.jpg`, `critic/reviews/continuity-baseline-r38/continuity-summary.json`
- Confidence: high (harness measurement; the strips show the worst swaps). Requirement: CHK-026; D-420 to D-426.
- Where: the pose registration table (src/data/art/poseRegistration*.ts, r39-posescale) and the poses it does not cover; not traced
- Smallest fix: Continue the r39-posescale batches over the poses the strips name (Ch IV Bahamut hurt to KO, Paine's follow and ready, Evrae's mass jump); the harness is the acceptance.
- Acceptance check: CHK-026 PASS in the harness over Ch I, IV and VIII, or a recorded owner decision per figure.

### R39F-04 (major): CHK-027 still fails: jerks and double images remain (fewer than on live), and Ch I and IV keep the snaps live has

- Game and chapter: both, Ch I, IV, VIII (harness). Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false.
- Expected: At most 0.25 snaps per minute, no double image of severity 0.40 or more, no jerk of 40 px or more in one frame (CHK-027).
- Observed: 146 jerks of 40 px or more (live 230), worst 353.1 px (live 371.3); 15 swaps with a double image of 0.40 or more (live 20), worst 0.422 (live 0.47); Ch I 8 snaps in 7.9 minutes (1.01 per minute; live also 8, 0.88) and Ch IV 1 (0.16; live 0.14). Ch IV has 12 double images against live's 7, all Paine at 0.401 to 0.410 (on the line); live's worst there was 0.452.
- Repro: The same harness run, strips in the continuity folder (ghost-*.jpg, jerk-*.jpg).
- Evidence: `critic/reviews/c7135bec-focused/continuity/continuity-summary.json`, `critic/reviews/c7135bec-focused/continuity/seymour-flux-win-c7135bec/continuity/strips/swap-087-seymour-flux-idle-hurt.jpg`, `critic/reviews/c7135bec-focused/continuity/seymour-flux-win-c7135bec/continuity/continuity.json`, `critic/reviews/continuity-baseline-r38/continuity-summary.json`
- Confidence: high (harness measurement). Requirement: CHK-027; D-420 to D-426.
- Where: presenter pose swaps and camera cuts; not traced
- Smallest fix: The continuity program's next batches; the harness is the acceptance.
- Acceptance check: CHK-027 PASS in the harness, or a recorded owner decision.

### R39F-05 (polish): The strategy guide's labels fall below the 14 px floor in windows narrower than 1600

- Game and chapter: both, Ch I, III (FFX), Ch IV (FFX-2) at 1280x720 and 1024x768. Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false.
- Expected: No text under 14 px at any window (CHK-003; the floor lane read 14.0 in 60 of 60 cells).
- Observed: The guide's Boss Battle tag, "In Game Description:", "HP:", "Steal:" and "Drops:" draw at 11.4 px at 1280x720 and 9.1 px at 1024x768 (FFX Ch I; 4 labels in Ch III and in FFX-2 Ch IV at 11.4 px). Everything else on the HUD holds 14 px. At 1600x900 and on phones there are 0 under 14.
- Repro: node cap/floor.mjs seymour-flux 1280x720 (the results are in the review folder).
- Evidence: `critic/reviews/c7135bec-focused/results/floor-seymour-flux-1280x720.json`, `critic/reviews/c7135bec-focused/results/floor-seymour-flux-1024x768.json`, `critic/reviews/c7135bec-focused/results/floor-braskas-final-aeon-1280x720.json`, `critic/reviews/c7135bec-focused/results/floor-ffx2-bahamut-1280x720.json`
- Confidence: high. Requirement: CHK-003; the owner's 14 px floor.
- Where: src/ui/common/strategy-guide.css (.sgd__tag, .sgd__flabel, .sgd__listlabel); suspected: the guide sheet was merged after the floor lane and is not in hud-floor.css's floor rules
- Smallest fix: Give those three selectors the same floor as the other HUD type (max of the authored size and 14 px over the stage scale).
- Acceptance check: floor.mjs minimum at least 13.95 at 1024x768 and 1280x720 for Ch I and Ch IV.

### R39F-06 (polish): The first-run board card says "Click its picture" to keyboard and pad players

- Game and chapter: both, chapter select (first run). Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true.
- Expected: The verb follows the device (the touch card says "Tap its picture"; the reels and Overdrive overlays already name ENTER, CROSS or TAP).
- Observed: Step 1 reads "Click its picture to begin. The others wait on the board." for keyboard and pad users, who select with arrows and Enter or Cross. Steps 2 and 3 read correctly.
- Repro: Fresh profile, press Enter on the title, read the board card by keys or the pad (firstrun-cand-key, firstrun-cand-pad).
- Evidence: `critic/reviews/c7135bec-focused/results/firstrun-cand-key.json`, `critic/reviews/c7135bec-focused/results/firstrun-cand-pad.json`, `critic/reviews/c7135bec-focused/frames/firstrun-board-step1-key.jpg`
- Confidence: high. Requirement: CHK-007 (copy); the first-run target tile.
- Where: src/ui/coach/firstRunCopy.ts (suspected)
- Smallest fix: Say "Pick Seymour Flux" with the device's control for key and pad, as the other steps do.
- Acceptance check: Step 1 names the control in use on key, pad and touch.

### R39F-07 (polish): The 2x backdrop masters depend on the browser's link estimate: below 10 Mbps the six un-held backdrops stay 1x

- Game and chapter: both, Ch I, XI, XII, XIV (the six held backdrops). Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false.
- Expected: Gagazet, Garden of Pain, Via Purifico and Road to the Farplane draw their 2x masters at a 2560 wide window.
- Observed: They do with `?artlink=fast` or a link estimate of 10 (5,376 px masters from the first sample). On this machine's loopback the page reports a downlink of 9.2 to 9.9 and `slowLink()` (downlink under 10) keeps the 1x masters (2,688 px) at 2560x1440 with no cue. Browsers without the Network Information API (Safari, Firefox) get 2x. The title's own backdrop master has no on-screen user (the title draws title/keyart.2x.webp, 2,841 px).
- Repro: Ch I at 2560x1440 with and without `?artlink=fast` (bdwatch results).
- Evidence: `critic/reviews/c7135bec-focused/results/bdwatch-seymour-flux-2560x1440-fast.json`, `critic/reviews/c7135bec-focused/results/bdwatch-seymour-flux-2560x1440-b.json`, `critic/reviews/c7135bec-focused/results/bdwatch-isaaru-via-purifico-2560x1440-fast.json`, `critic/reviews/c7135bec-focused/results/bdwatch-ffx2-fallen-aeons-2560x1440-fast.json`, `critic/reviews/c7135bec-focused/results/bdwatch-seymour-omnis-2560x1440-fast.json`, `critic/reviews/c7135bec-focused/results/titlefast-2560x1440-fast.json`
- Confidence: high. Requirement: CHK-013; the r39-art claim.
- Where: src/engine/ArtDevice.ts slowLink()
- Smallest fix: Bailey's call: lower the threshold, or ask for 2x from a measured throughput after the first assets rather than the cached estimate.
- Acceptance check: A fast broadband Chromium session reads 2x for the four backdrops at 2560 wide.

### R39F-08 (polish): At TEXT SIZE 115 and 130 the in-battle guide gives way in FFX-2 Ch IV and VI and G does nothing

- Game and chapter: FFX-2, ffx2-bahamut, ffx2-leblanc (Ch IV, VI). Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true.
- Expected: A designed give-way (sgd--squeezed) tells the player, or the guide stays reachable.
- Observed: At 115 and 130 percent the guide panel and its chip are hidden in Ch IV and VI (panel 0x0) and pressing G toggles a flag with nothing shown. The pause GUIDE tab still has the page. At 100 percent and in Ch V at 130 the guide shows. The lane documents the give-way (r39-judg).
- Repro: Pause, OPTIONS, TEXT SIZE 130, back to the first menu, press G.
- Evidence: `critic/reviews/c7135bec-focused/results/textsize-ffx2-bahamut-1600x900-130-pause.json`, `critic/reviews/c7135bec-focused/results/textsize-ffx2-leblanc-1600x900-130.json`, `critic/reviews/c7135bec-focused/frames/textsize130-ch6-menu-narrow-slab.jpg`
- Confidence: high. Requirement: CHK-004 (names how to reach it).
- Where: src/ui/common/StrategyGuide.ts (sgd--squeezed, railRoom)
- Smallest fix: Show a one-line chip "GUIDE: pause menu" while squeezed, or fold the guide into the advisor lane.
- Acceptance check: At 130 percent in Ch IV and VI a player can tell where the guide went.

### R39F-09 (suggestion): The title screen now fetches 58 art files before input (live: 27)

- Game and chapter: both, title. Tags: introducedByCandidate true, regressionVsLive false, inNewFeature false.
- Expected: A cold title is light.
- Observed: At 2560x1440 the candidate's title made 58 art requests (every chapter's backdrop and boss idle among them) against 27 on live; all were 200s. Whether this is the intended warm-up was not asked; the cost on a slow link was not measured.
- Repro: title.mjs on candidate and live.
- Evidence: `critic/reviews/c7135bec-focused/results/title-cand-2560x1440.json`, `critic/reviews/c7135bec-focused/results/title-live-2560x1440.json`
- Confidence: medium (counts only; bytes and timing not measured). Requirement: delivery; CHK-018.
- Where: src/app/screens/TitleScreen.ts preload (suspected)
- Smallest fix: Measure the cold-title bytes on a throttled link before the deploy; Bailey decides.
- Acceptance check: A recorded cold-title byte figure.

### R39F-10 (polish): Chapter III with Yuna first: her staff keeps a sliver of overlap with Braska's Final Aeon through the whole menu

- Game and chapter: FFX, braskas-final-aeon (Chapter III). Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false.
- Expected: docs/handoff/r39-looks.md: a Yuna-first menu touches only in its first 3 s (up to 681 px2) and is clear after 3.0 s.
- Observed: Seed 9 (Yuna first), 1600x900: overlap up to 1,129 px2 in the first 3 s, then a median of 167 px2 (max 282) in 85% of the 78 later readings; at 2000x1012: up to 1,486 px2, then a median of 104 (max 545) in 99% of readings. Live: a median of 3,803 px2 (max 5,261). Seed 1 (Tidus first) is clear at every reading (gap 28 px or more; live median 2,566 px2). The sliver is about a 13 px square; the camera drift while a menu is open is 0.18 to 0.21 units against live's 0.95 to 0.97.
- Repro: node cap/ch3.mjs 1600x900 9 cand (setSeed(9) before the first key; real keys; results in the review folder).
- Evidence: `critic/reviews/c7135bec-focused/results/ch3-cand-1600x900-s9-cand.json`, `critic/reviews/c7135bec-focused/results/ch3-cand-2000x1012-s9-cand.json`, `critic/reviews/c7135bec-focused/results/ch3-live-1600x900-s9-live.json`, `critic/reviews/c7135bec-focused/results/ch3-cand-1600x900-s1-cand.json`, `critic/reviews/c7135bec-focused/frames/ch3-first-menu-yuna-first-1600x900-seed9.jpg`, `critic/reviews/c7135bec-focused/frames/ch3-first-menu-yuna-first-1600x900-seed9-live-r38.jpg`
- Confidence: medium (the painted-overlap reading is in the lane's style but measured here with a fresh probe; the lane's numbers were taken before the pose-scale merge). Requirement: CHK-008, CHK-011.
- Where: src/engine/fx/mix/stageTable.ts (the Chapter III row) with the pose registration merged after the lane measured (suspected)
- Smallest fix: Re-measure with the lane's own probe on this tree; if it reads the same, step the boss or the party 0.1 further apart for the Yuna menu.
- Acceptance check: Painted overlap 0 after 3 s for seeds 1 and 9 at 1600x900 and 2000x1012.

## Continuity (CHK-026 and CHK-027, `critic/runner/lib/continuity.mjs`, real keys, Ch I, IV and VIII)

| | Candidate (c7135bec) | Live (release 38) |
|---|---|---|
| Battle time, swaps counted | 1173.6 s, 1268 | 1370.3 s, 1281 |
| Head over tolerance | 281 | 297 |
| Worst head jump, by mass / where registered | 115.7% / 8.4% | 115.7% / 57.1% |
| Feet over tolerance, worst | 137, 140.6 px | 868, 259.4 px |
| Snaps, per minute | 116, **5.93** | 12, 0.53 |
| Double images of 0.40 or more, worst | 15, 0.422 | 20, 0.47 |
| Jerks of 40 px or more, worst | 146, 353.1 px | 230, 371.3 px |
| CHK-026 / CHK-027 | FAIL / FAIL | FAIL / FAIL |

By chapter (candidate against live): Ch I snaps 8 and 8, feet over 135 against 346, jerks of 40 px or more 34 against 69; Ch IV snaps 1 and 1, feet over 1 against 242 (that swap 140.6 px against live's worst 98.3), double images 12 against 7 (all Paine, 0.401 to 0.410, on the line; live's worst 0.452); Ch VIII snaps 107 against 3, feet over 1 against 280, double images 2 against 10, head over 152 against 85 (more swaps are now registered and held to 3%; the registered worst is 8.4% against live's 37.2%). The caps follow: while CHK-026 fails, characterModels and animation are at most 7.0; the snap rate is also over 0.25, which caps animation at 7.5.

## Targets

- Title: **matched**. Ink slab, PRESS ENTER, vertical line and legend as approved; the renamed title (Echoes of Spira, 2026-10-04) and the parallax key art are Bailey's later picks. Evidence `critic/reviews/c7135bec-focused/targets/title.jpg`.
- Battle HUD, FFX: **matched**. Ch I first menu: the approved command stack, party plates and turn order, plus the approved guide and next-move panels; Defend tab bottom left. Evidence `critic/reviews/c7135bec-focused/targets/battle-hud-ffx.jpg`.
- Battle HUD, FFX-2: **matched**. Ch IV: pink command stack, girls' plates, boss bar, guide and intent slab. Evidence `critic/reviews/c7135bec-focused/targets/battle-hud-ffx2.jpg`.
- Swordplay Overdrive: **matched**. Slab, title, SWORDPLAY line, timer ring, bonus chip and the gold zone bar; the mockup's tier labels are illustrative (zones come from the sourced ordering and the owner-adopted estimates). Evidence `critic/reviews/c7135bec-focused/targets/swordplay-overlay.jpg`.
- Ch. 1 Mt. Gagazet: **matched**. The painting is the approved composition (2x master with `?artlink=fast`). Evidence `critic/reviews/c7135bec-focused/targets/scene-gagazet.jpg`.
- Ch. 4 Bevelle Underground: **matched**. The hall, lamps and central door as approved at 1600x900 and the conduits at 2560x1080. Evidence `critic/reviews/c7135bec-focused/targets/scene-bevelle-underground.jpg`.
- Pause on the Until Dawn character screen: **matched**. Tab strip, meter rows, objective line and painting as approved. Evidence `critic/reviews/c7135bec-focused/targets/pause.jpg`.
- Seymour Natus, Chapter X (FFX): **failing**. The lane's own frame of the accepted option N has the card at the top and the figure clear; the build covers about 48% of him (R39F-01). Evidence `critic/reviews/c7135bec-focused/frames/natus-sensor-card-candidate-vs-diagnostic-vs-approved.jpg`.

The tiles this candidate changed or could regress, compared by `node tools/end-state-board.mjs --pair` (target left, build right) at the sizes named. The other tiles of the plan's groups (cast poses, targeting rings, onboarding, phone party prep and the rest) were not compared in this focused pass; the deep review owed after the deploy covers them.

## Sub-scores (Bailey's five, provisional, not part of the weighted score)

characterModels 7.0, enemyModels 8.0, animation 7.0, fidelity 8.5, camera 8.0. enemyModels 8.0 (+0.2): Evrae's ten re-made masters, smooth rims and no severe double image, Natus staged larger; held by the hard cuts (R39F-02) and the Natus card. fidelity 8.5 (+0.3): F plus 2x supersampling by default at 59.9 fps up to 4K, 2x/3x/4x masters load clean, un-held backdrops, lossless art proved in two engines; held by the link-gated tier (R39F-07) and the Natus card. camera 8.0 (+0.1): Ch III calm menus (camera drift while a menu is open 0.18 to 0.21 against live's 0.95 to 0.97), Natus framing at three sizes with a re-plan after a resize, run-in truck, Bevelle conduits at ultrawide; held by Natus being unpinned at 16:10 by design. animation: twirl start, dressphere shot and run-in truck are fixed, the reels are timed and readable; held by 5.93 snaps a minute and the jerks. Caps applied: CHK-026 FAILS: characterModels and animation are at most 7.0 (critic/policy.json continuity.caps.sizeFails). Judged without the cap: characterModels 8.3, animation 7.5. snaps per minute 5.93 is over 0.25: animation is at most 7.5 (continuity.caps.snaps); the 7.0 above is already below it.

## Checks

| Check | Result | Where |
|---|---|---|
| CHK-002 | PASS | both; Ch I, III, IV, V, VIII, X, XIII, XVI; 1600x900, 2000x1012, 2560x1440, 390x844 |
| CHK-003 | FAIL | both; the failing labels are the strategy guide's, at windows narrower than 1600 |
| CHK-004 | PASS | both; Ch VII, IX, XII, XVII, XVIII (cards), Ch V and XIII (executed), Ch IV phone |
| CHK-006 | PASS | both; first-run cards, Overdrive and reels overlays, target steps |
| CHK-007 | PASS | both; the copy this release changed |
| CHK-008 | FAIL | FFX only; Ch X Seymour Natus (R39F-01) |
| CHK-009 | PASS | both; Ch I, IV, V, VI; TEXT SIZE 100, 115, 130 |
| CHK-010 | PASS | both; Ch I, IV (phone), V, XVI |
| CHK-011 | PASS | both; Ch III, Ch X, Ch V |
| CHK-012 | PASS | both; the whole shipped art set |
| CHK-013 | PASS | both; Ch I, VIII (4K and 1440p), the held backdrops |
| CHK-014 | PASS | both; Ch I, III, IV, V, VIII, X, XVI |
| CHK-015 | PASS | both; keys, mouse, pad, touch |
| CHK-016 | PASS | both |
| CHK-017 | NOT APPLICABLE | both |
| CHK-018 | PASS | both; shipped art URLs and deploy tooling (read only) |
| CHK-019 | PASS | both; the whole shipped art set, 2x, 3x and 4x tiers |
| CHK-020 | PASS | both |
| CHK-021 | PASS | FFX only / FFX-2 only / both, per item |
| CHK-022 | PASS | both; Ch I, IV, VIII (wins), Ch I (loss) |
| CHK-023 | PASS | both |
| CHK-026 | FAIL | both; Ch I, IV, VIII; continuity harness |
| CHK-027 | FAIL | both; Ch I, IV, VIII; continuity harness |

The reasons and evidence of each check are in the JSON beside this file. `validateReport` (the function `tools/deploy-pages.mjs` uses, with `loadPolicy`) returns no errors on it, and `shipVerdict` reads HOLD from R39F-01 and R39F-02, with R39F-03 and R39F-04 disclosed.

## Deploy tooling, read without running it

`verifyLive` accepts exactly one Cloudflare Web Analytics beacon (its own host and path, no attribute Cloudflare does not use) and any other difference is a mismatch; `checkHeadersFile` vets the one `_headers` a Workers build may ship, and the tree holds no `_headers`, `_redirects` or `.assetsignore` (nor does dist); the commit identity is read from git config at run time and no tool file holds a personal address; `tools/cloudflare/wrangler.jsonc` holds nothing account-specific. Nothing in this review ran `npm run deploy`, `tools/deploy-pages.mjs` or wrangler.

## Data audit

Changed game data against live: Swordplay zones and sweeps (22/16/12/9 percent, 1,400/1,150/900/700 ms) equal research/ffx-combat-core.md 5.3's table and are labelled our estimate adopted by Bailey on 2026-10-04 (ordering sourced); the Lady Luck chapter map equals research/ffx2-lady-luck-availability.md in all 7 chapters; the 9 HP fields of the 18 new guide documents equal the engine's HP (Seymour Flux 70,000, Anima 18,000, Sinspawn Genais 20,000 among them); the corrected Seymour Flux Total Annihilation lines say what the game does. The guide documents' steals, drops and prose were not audited line by line (they follow research/jegged-encounter-guides-ffx-*.md).

## Coverage

**Tested**
- The production build of c7135bec (dist, vite preview 127.0.0.1:5461) in headless GPU Chromium 153 with real keys, a virtual pad, the mouse and touch; labelled hooks only: setSeed(1) before the first key, ?coach=off, gotoChapter for navigation, battleState gauge := 100 for Overdrive runs, crisp.simulate, and the URL switches ?artlink, ?artscale, ?crisp, ?stand, ?figtrue.
- Rendering: F plus default at 1600x900, 2560x1440 and 3840x2160 (59.9 fps, 2x supersampling); the governor stepping F plus to F to A2 and staying, the pinned frame holding, the phone chain; 2x default, 3x and 4x forced tiers; 0 raw @ requests; the six held backdrops with the link forced fast and natural; Evrae and Wakka rims at 100 percent; the figure true-colour switch off by default (0 differing pixels against set 0).
- Staging: Ch III first menus (two seeds, two sizes, stage on and off) and the lunge; Ch X Natus at 1600x900, 2000x1012 and 2560x1440 with three mid-fight resizes (2000x1012, 1440x900, 2560x1440); twirl start (Ch XV, VI), dressphere shot (Ch VI), run-in truck (Ch XVI at three sizes), Evrae cut (Ch VIII, 120 s), Bevelle conduits at 1600x900, 2560x1080, 3440x1440 and 390x844.
- Interface: Defend by four inputs and Shift; the slab on pad Select in both games; Swordplay by pad, click and tap and Bushido by key, pad, click and tap (Chapter XVII's fight, gauge forced to 100); the first-run guide by key, pad and touch; the advisor cards for Ch VII, IX, XII, XVII and XVIII at 1600x900 and 2000x1012; the 14 px floor and Overdrive clamp at 1024x768, 1280x720, 1600x900 and 390x844 in Ch I and IV (Ch III at the two small sizes); TEXT SIZE 115 and 130 in Ch IV, V, VI and both pauses (the FFX HUD at 130 percent, not part of this release's claim and not compared with live, covers 27% of Yuna in Ch I against 2% at 100 percent); EYE CANDY in both games; the strategy guide.
- Lady Luck (FFX-2 only): reels in Ch XVI by key, pad and tap in Wait and Active ATB, in Ch V and XIII by key; Red 7 and cherry results; absent in Ch IV and VI; smoke fights in Ch V and XIII (8 turns each).
- Continuity: the harness over Ch I, IV and VIII with real keys (1,173.6 s of battle) and the same harness on live (the baseline); real-key wins in all three to the board and a reload; a Ch I loss and retry; one phone touch turn in Ch I and one in Ch IV (touch only, CONFIRM tapped).
- Gates re-run here: art-derive audit, art-derive verify (2,874 masters, 0 problems), art-browser-load (2,918 of 2,918 in Chromium and WebKit), verify-approved (807 ok), orphans (24, the same 24 as release 38), a numeric cross-check of the 9 HP fields of the new guide documents against the engine (9 of 9), the Lady Luck chapter map against research/ffx2-lady-luck-availability.md (7 of 7 chapters), the Swordplay zones against research/ffx-combat-core.md 5.3. Deploy tooling read without running it.

**Reused**
- tsc, the full vitest suite (859 files, 12,825 tests) and the integration lane's build gates, Cloudflare limits, play audit and real-key smoke. From docs/handoff/r39-int.md (the integration lane, same tree). Why: they are the driver's gates and the tree is unchanged since (the source diff from 3cb9c520 to c7135bec is empty); this review re-ran the art gates and the behaviour, not the unit suite.
- the live side of the continuity comparison. From critic/reviews/continuity-baseline-r38 (the same harness against https://echoesofspira.com, release 38, 2026-10-05T04:57Z). Why: live is unchanged (bundle X5kGUd9G, confirmed at review time); the candidate side was run here.
- the Natus lane's own frame of the accepted option N, and its 0% card cover measured on its branch. From docs/handoff/r39-natus.md and its evidence folder. Why: it is the reference the candidate is compared with; the candidate was measured afresh here.

**Not tested**
- Chapters II, VII, IX, XI, XII, XIV, XV, XVII and XVIII by full play (Ch VII, IX, XII, XVII and XVIII only at the first menu, for the advisor cards; Ch XI and XV only as data for Lady Luck)
- A full win by touch or by pad; a loss in FFX-2
- Audio (agents cannot hear; docs/audio/audition.html is Bailey's)
- Real-device browsers and hardware (Safari, Firefox, iOS, a laptop or integrated GPU, a throttled link beyond the forced switches); cold-load timing
- Victory and Defeat screens at sizes other than 1600x900; targets of the cast, fight and phone groups other than the eight named; copy outside the changed screens
- The live verification of the exact artifact (CHK-017, after the deploy) and the deep review owed on the live build

## For Bailey

- **R39F-02 needs your answer** (rule: do not tune numbers; measure each option): keep Evrae's hard cut and accept the snap count, a short hold that never shows two heads, or an authored in-between pose.
- **R39F-07**: whether the 2x backdrops should wait for a 10 Mbps estimate, or be asked for after a measured fetch.
- **R39F-09**: whether the title should warm 58 files before input.
