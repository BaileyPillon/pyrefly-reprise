Build / artifact / target version: 816d80f9 (release 39 candidate 2 on main, pushed; full 816d80f9d07b750261804dc30b9e6991aaf75a9f) / artifact D:/pyrefly-r39-int/dist rebuilt from 816d80f9, bundle index-DIf_suBq.js and index-E1Wn4nPC.css, 3,848 files, 8.32 GB / live 8136f2ed (release 38, bundle X5kGUd9G, https://echoesofspira.com) / previous candidate c7135bec (HOLD) / targets.json sha256 b5933731...2e7d
Review: focused (the delta c7135bec to 816d80f9 re-measured; everything else carried from critic/reviews/c7135bec-focused.json)
Deployment: NOT APPLICABLE. Live verification of this exact artifact is a separate obligation after the deploy; nothing was deployed.
Changed area: FAIL, as for c7135bec, now only because carried claims are still unmet (the guide's labels under the 14 px floor in windows narrower than 1600, the link-gated 2x backdrops, a Ch III sliver, and the new R39F-11 sliver at two small windows). Both targets of this delta are met with no regression that matters: the Natus card is clear of him at 1440x810 and wider (R39F-01 fixed), and Evrae behaves as on live (R39F-02 fixed).
Ship: SHIP. No critical defect, no major regression against live. R39F-01 (cover 47 to 48% down to 0.0 to 0.1%) and R39F-02 (the Evrae cut reverted; at equal frame rate live and this build read the same 20 double images and 2 to 3 snaps) are fixed and verified on the rebuilt dist. This release discloses R39F-03 and R39F-04 (CHK-026 and CHK-027 still FAIL, as on live) and the polish items, among them R39F-11 (the card touches wing-spike tips at 1280x720 and 1366x768).
Milestone: not assessed
Quality: not scored (focused pass). Bailey's five visual sub-scores, provisional, with the continuity caps applied (CHK-026 FAILS: characterModels and animation at most 7.0): characterModels 7.0 (capped; 8.3 without), enemyModels 8.0, animation 7.0 (capped; 7.5 without), fidelity 8.6, camera 8.1; c7135bec read 7.0 / 8.0 / 7.0 / 8.5 / 8.0 and round 21 read 8.2 / 7.8 / 7.4 / 8.2 / 7.9. The last full weighted score is round 21 (6461999e, 2026-10-04): provisional, audio unverified, six categories under the 9 floor.
Targets: required 8 / matched 8 / failing 0 / unverified 0 / waiting 0
Top issues: R39F-01 fixed (Natus card cover 47 to 48% to 0.0 to 0.1% at 1440x810 and wider; evidence results/sensor2-cand-*.json and the three-up frame) with the residue filed as R39F-11 (polish, 1.6 to 2.3% of his painted pixels at 1280x720 and 1366x768). R39F-02 fixed (the Evrae cut reverted; the 22 double images the fixer read are live's own at 60 fps: a fresh live run reads 20; evidence continuity-live-control). Open and carried unchanged: R39F-03 and R39F-04 (major, disclosed, CHK-026 and CHK-027), R39F-05 to R39F-10 (polish or suggestion).
Coverage: Tested: the rebuilt dist's bundle; the Natus card at six window sizes with the cursor on each target, against live at five; a painted-pixel estimate at the two small windows; the continuity harness on Ch VIII (victory, 59.5 fps) and again on live at full frame rate; smokes of Ch I, IV and X by real keys. Reused: everything else from c7135bec-focused (rendering, art gates, interface, Lady Luck, Ch III, targets, deploy tooling, data audit, Ch I and IV continuity), because the diff touches none of it. Not tested: Ch I and IV continuity again, a live control for Ch I and IV, the other 7 target tiles again, audio, real devices, the live artifact.
Next required review and why: live verification of this exact artifact after the deploy (CHK-017), then the deep review owed on the live build (plan depth deep; this is the second shared-system deploy while a deep review is owed, so a third would be refused). Before that, nothing blocks: R39F-11, R39F-03 to R39F-10 go to the next batch, and the continuity baseline should be re-taken at full frame rate.
Elapsed review time / repeated work avoided: about 48 minutes (two 7-minute harness runs, this build and the live control, and 16 short probes and smokes). Only the delta was re-measured: Ch I and IV continuity, the art gates, the interface and Lady Luck runs and the whole c7135bec evidence were carried.

## What changed (the delta)

`git diff c7135bec 816d80f9`: 10 files changed, 215 insertions(+), 69 deletions(-). Three commits. **6bd12f55** (R39F-01): `src/ui/common/hud-floor.css` only: the open Sensor card's `top` regains `+ var(--ffx-sensor-py, 0px)` and is wrapped in `max(0px, ...)` so the pinned lift cannot carry the plate (and its name) past the top of the stage at 1280x720 to 1440x810; the new test `hud-floor-sensor-top` reads the sheets and evaluates the rule. **1c096064** (R39F-02): reverts 9ff5760f (PR-0367): `BattlePresenterStage.ts` is back to `crossfadeMs: poseCut ? 0 : party ? 120 : 140`, `PoseCut.ts` is deleted and `poseCutArt` is gone from `evrae-airship-deck.ts` and `types.ts` (FF7's whole-scene `poseCut` is untouched); tests `r39-evrae-crossfade` added, `r39-pose-cut` removed. **816d80f9**: docs only (`r39-visfix.md`). Everything else in `src/` and `public/` is identical, and the rebuilt dist has the same 3,848 files and differs by 116 bytes (its bundle and stylesheet only). Checked in the built files: the stylesheet carries `top:max(0px, calc(166px + var(--ffx-sensor-dy,0px) + var(--ffx-sensor-py,0px) - clamp(...)))` and no longer the old rule; the bundle reads `crossfadeMs:this.opts.slots.poseCut?0:n==="party"?120:140` and holds no `poseCutArt`. Neither change reaches a chapter other than X (the card's pin term is written only by Natus's pin) and VIII (the Evrae scene row).

## R39F-01: the Natus Sensor card, re-measured on the rebuilt dist

Method as in the c7135bec review (setSeed(1) before the first key, ?coach=off, real keys from the title to Chapter X's first menu; then Attack, the cursor to the right twice, then E): the Sensor card's rect over Natus's figure box, read from the game's own `targeting().rects`. The figure box is Natus's drawn size: larger on this build than on live, where he is unpinned, at every window shape.

| Window | c7135bec, first menu | 816d80f9 first menu | Attack step (Mortibody aimed) | cursor on Natus | cursor back on Mortibody | card top (px) | live r38, worst |
|---|---|---|---|---|---|---|---|
| 1280x720 | not measured | 6.9% | 7.0% | 0.0% | 7.1% | 0 | 0.0% |
| 1366x768 | not measured | 7.6% | 7.9% | 0.0% | 7.9% | 0 | 0.0% |
| 1440x810 | not measured | 0.0% | 0.0% | 0.0% | 0.0% | 0 | not run (unpinned) |
| 1600x900 | 47.9% | 0.0% | 0.1% | 0.0% | 0.0% | 8 | 0.0% |
| 2000x1012 | 47.3% | 0.0% | 0.0% | 0.0% | 0.0% | 11 | 0.0% |
| 2560x1440 | 47.1% | 0.0% | 0.0% | 0.0% | 0.0% | 16 | 0.0% |

Reading it: at 1440x810 and wider the card stands at the top of the stage and ends at or above his box (first menu 1440x810 0.0% (Attack step 0.0%); the worst reading at any step is 0.1%): **R39F-01 is fixed**. The card's name is never clipped above the window (the card top is 0 px at 1280x720, 1366x768 and 1440x810, where max(0px, ...) holds it; 8, 11 and 16 px at 1600, 2000 and 2560 wide). **At 1280x720 and 1366x768** the floor's larger type makes the card taller than the pin's lift can clear, so with Mortibody aimed (the default first target) it reaches 7.0% and 7.9% of his box, where live reads 0% (live's Natus is 92x165 to 98x176 px and unpinned, well left of the card). The box includes the transparent margin above his wing tips, so I also counted his own pixels in a scene-only frame (the HUD hidden, the scene frozen; his white rim and saturated violet, not the lamps or the hall): 86 of 5521 at 1280x720 (1.6%) and 141 of 6254 at 1366x768 (2.3%): the card's lowest row touches the tips of one wing spike (frames natus-attack-step-1280x720 and -1366x768 show it). **By the strict measure that is a regression against live, so it is recorded (R39F-11); its size is polish.** With the cursor on Natus the card moves left and reads 0.0% at every size.

## R39F-02: Evrae's pose change, re-measured with the continuity harness

Why the fixer's numbers look worse than live, and why they are not. The c7135bec review compared Chapter VIII with a live baseline (`continuity-baseline-r38`, 04:57Z) captured at **42.4 fps with 2,266 slow frames and a 918 ms stall** (Ch I 45.8 fps with a 6.2 s stall, Ch IV 39.1 fps): the GPU was shared with the art lane then. A 140 ms crossfade needs 8 frames at 60 fps; at 42 fps with stalls it lasts 0 to 6, so its double-image severity often reads 0.28 to 0.29 instead of 0.435 and falls under the 0.40 line. To settle it with a control instead of an argument, the same harness was run on https://echoesofspira.com (release 38) again, alone, at full frame rate, from the same seed:

| Run | fps (slow frames) | Battle s | Evrae swaps / cast swaps | Evrae cast swaps at 0.40 or more | of the cast swaps that blended 7+ frames | Snaps (per min) | Double images 0.40+ (chapter) | Jerks 40 px+ | Head over / feet over |
|---|---|---|---|---|---|---|---|---|---|
| live r38 baseline (04:57Z) | 42.4 (2266) | 394.2 | 110 / 20 | 9 | 6 of 6 | 3 (0.46) | 10 | 92 | 85 / 280 |
| live r38 control (this review) | 59.5 (48) | 330 | 108 / 19 | 19 | 19 of 19 | 2 (0.36) | 20 | 25 | 186 / 260 |
| c7135bec (hard cut) | 59.5 (44) | 328.6 | 105 / 20 | 0 | 0 of 0 | 107 (19.54) | 2 | 38 | 152 / 1 |
| 816d80f9 (crossfade restored) | 59.5 (43) | 329.2 | 110 / 20 | 19 | 19 of 19 | 3 (0.55) | 20 | 23 | 149 / 0 |

- **Same swaps, not more:** the fight plays the same script: 110 Evrae swaps and 20 cast swaps on this build, 108 and 19 on the live control, 110 and 20 on the old baseline. The count of Evrae cast swaps did not grow.
- **Same severity:** at 59.5 fps every full-length Evrae cast crossfade (7 or 8 blended frames) reads 0.435 to 0.439 on both builds: 19 of 19 on the live control and 19 of 19 on this build. The old baseline's six full-length ones read the same 0.435; its other fourteen were cut to 0 to 5 blended frames by the stall (ten read 0.28 to 0.29, three still read 0.43 to 0.44, one did not blend).
- **Same count:** 20 double images of 0.40 or more in the chapter on both, worst 0.439 on both (Tidus attack to follow reads 0.405 here, 0.472 on live).
- **Snaps:** 3 here (Rikku hurt to KO, Tidus idle to KO, and one Evrae idle to cast that did not blend), 2 on the live control (the same two KO swaps) and 3 on the old baseline (the same two plus an Evrae cast swap that did not blend): 0.55 against 0.36 and 0.46 a minute, all over the 0.25 limit and the same events. Against the cut build's 107.
- **Better, and independent of the frame rate:** feet over tolerance 0 against 260 (worst 0.9 px against 257.4), heads over tolerance 149 against 186 (worst registered 8.4% against 39.2%). Jerks of 40 px or more: 23 against 25.

**Verdict on R39F-02: not a regression against live; the same behaviour at the same swap count, and the two-head frame Evrae's cast shows is live's own** (it is in R39F-04's scope). The hard cut would remove 18 of those 20 double images and costs 105 snaps; which of the three answers Bailey wants is still his call.

## Smoke (real keys): Chapters I, IV, VIII and X

Real keys from the title, setSeed(1) before the first key and ?coach=off, on the rebuilt dist at 1600x900: **Chapter I** 3 Attack turns, then the results screen (the fight was lost: an all-Attack party cannot beat Seymour Flux in three turns), **Chapter IV** 8 turns including the advisor's Shell, Protect and Cura, **Chapter X** 5 Attack turns, then the results screen (lost likewise), and **Chapter VIII** the whole fight by the harness (76 turns, victory, the board with the chapter cleared, cleared again after a reload). 0 console errors and 0 missing files in all four; art responses 219, 208 and 208 in the three smokes, all HTTP 200, 0 raw `@` URLs, 0 redirects, 0 bad; the rung is F plus in each. The harness runs also read 0 console errors, 0 missing files and no HTML answered to an image.

## Findings, one row each

| ID | Severity | Status on 816d80f9 | Introduced / regression | Title |
|---|---|---|---|---|
| R39F-01 | major | fixed and verified on 816d80f9 at 1440x810 and wider | true / true | Seymour Natus: the Sensor card sits on his body (about 48% covered) because the floor rule drops the pin's lift |
| R39F-02 | major | fixed | true / true | Evrae now cuts between poses: 19.5 snaps a minute against 0.46 on live (a double image traded for hard cuts) |
| R39F-03 | major | open | false / false | CHK-026 still fails: figures change size and feet across pose changes (less than on live) |
| R39F-04 | major | open | false / false | CHK-027 still fails: jerks and double images remain, and Ch I and IV keep the snaps live has |
| R39F-05 | polish | open | false / false | The strategy guide's labels fall below the 14 px floor in windows narrower than 1600 |
| R39F-06 | polish | open | true / false | The first-run board card says "Click its picture" to keyboard and pad players |
| R39F-07 | polish | open | false / false | The 2x backdrop masters depend on the browser's link estimate: below 10 Mbps the six un-held backdrops stay 1x |
| R39F-08 | polish | open | true / false | At TEXT SIZE 115 and 130 the in-battle guide gives way in FFX-2 Ch IV and VI and G does nothing |
| R39F-09 | suggestion | open | true / false | The title screen now fetches 58 art files before input (live: 27) |
| R39F-10 | polish | open | false / false | Chapter III with Yuna first: her staff keeps a sliver of overlap with Braska's Final Aeon through the whole menu |
| R39F-11 | polish | open | true / true | At 1280x720 and 1366x768 the pinned Sensor card touches the tips of one of Natus's wing spikes (1.6 to 2.3% of his painted pixels; live 0%) |

Every row except R39F-01, R39F-02 and R39F-11 is carried unchanged from the c7135bec review (`critic/reviews/c7135bec-focused.md` has each one's expected, observed, repro, evidence, where, fix and acceptance check): the code outside the diff is identical (`git diff c7135bec 816d80f9`: 10 files changed, 215 insertions(+), 69 deletions(-)).

### R39F-01 (major): fixed and verified
c7135bec: the card covered 47.9%, 47.3% and 47.1% of Natus at 1600x900, 2000x1012 and 2560x1440. On 816d80f9: 1440x810 0.0% (Attack step 0.0%), 1600x900 0.0% (Attack step 0.1%), 2000x1012 0.0% (Attack step 0.0%), 2560x1440 0.0% (Attack step 0.0%); every step 0.0 to 0.1%. See the table above. The residue at two small windows is R39F-11.

### R39F-02 (major): fixed; not a regression after the revert
The hard cut (19.54 snaps a minute against 0.46) is gone: Chapter VIII reads 3 snaps in 329.2 s (0.55 a minute), the same events as live. The two-head frame on Evrae's cast is live's behaviour (a fresh live run: 20 double images of 0.40 or more, as here).

### R39F-03 (major, disclosed): carried, numbers updated for Chapter VIII
Across Ch I and IV (carried from c7135bec) and Ch VIII (fresh): 278 of 1,269 swaps over the head tolerance (live baseline 297 of 1,281), worst 115.7% by mass and 8.4% where registered (live 57.1%), 136 standing swaps over the feet tolerance (live 868), worst 140.6 px (Ch IV; live 259.4). Ch VIII alone against the live control at equal fps: heads 149 over against 186, feet 0 against 260, registered worst 8.4% against 39.2%. Still FAIL.

### R39F-04 (major, disclosed): carried, with a correction to its comparison
CHK-027 still FAILS: 12 snaps in 19.6 minutes is 0.61 a minute (the old baseline also had 12, 0.53), 131 jerks of 40 px or more (worst 353.1 px) and 33 double images of 0.40 or more (worst 0.439). **The c7135bec review's "fewer jerks (230 to 146) and double images (20 to 15) than live" is withdrawn**: its live baseline ran at 39 to 46 fps, which inflates jerks and truncates crossfades. At equal fps in Chapter VIII the two builds read the same (jerks 23 against 25, double images 20 against 20); for Ch I and IV there is no equal-fps live run, so no comparison is claimed.

### R39F-11 (polish, new): the card touches wing-spike tips at 1280x720 and 1366x768
See the R39F-01 section: 7.0% to 7.9% of his box and 1.6% to 2.3% of his painted pixels with Mortibody aimed; live 0%; the name is whole. Cost of holding the card at the stage's top; the floor's 14 px type makes it taller than the pin's lift can clear at those sizes.

### R39F-05 to R39F-10: carried unchanged
Not touched by the diff; see the c7135bec review for each one's expected, observed, repro, evidence, where, fix and acceptance check.

## Continuity (CHK-026 and CHK-027)

Ch VIII was re-run on this build; Ch I and IV are carried from c7135bec (the diff touches neither's code). The combined aggregate was recomputed with the harness's own `aggregate()` (it reproduces the c7135bec aggregate exactly from the three c7135bec chapters).

| | 816d80f9 (Ch I, IV carried; Ch VIII fresh) | c7135bec | Live baseline (39 to 46 fps) |
|---|---|---|---|
| Battle time, swaps counted | 1174.2 s, 1269 | 1173.6 s, 1268 | 1370.3 s, 1281 |
| Head over tolerance | 278 | 281 | 297 |
| Worst head jump, by mass / registered | 115.7% / 8.4% | 115.7% / 8.4% | 115.7% / 57.1% |
| Feet over tolerance, worst | 136, 140.6 px | 137, 140.6 px | 868, 259.4 px |
| Snaps, per minute | 12, **0.61** | 116, 5.93 | 12, 0.53 |
| Double images of 0.40 or more, worst | 33, 0.439 | 15, 0.422 | 20, 0.47 (understated: low fps) |
| Jerks of 40 px or more, worst | 131, 353.1 px | 146, 353.1 px | 230, 371.3 px (inflated: stalls) |
| CHK-026 / CHK-027 | FAIL / FAIL | FAIL / FAIL | FAIL / FAIL |

Chapter VIII against the live control at equal fps: see the table in the R39F-02 section. The caps follow as before: while CHK-026 fails characterModels and animation are at most 7.0, and the snap rate is over 0.25 (which caps animation at 7.5).

## Targets

- Title: **matched**. Ink slab, PRESS ENTER, vertical line and legend as approved; the renamed title (Echoes of Spira, 2026-10-04) and the parallax key art are Bailey's later picks (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/title.jpg`.
- Battle HUD, FFX: **matched**. Ch I first menu: the approved command stack, party plates and turn order, plus the approved guide and next-move panels; Defend tab bottom left (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/battle-hud-ffx.jpg`.
- Battle HUD, FFX-2: **matched**. Ch IV: pink command stack, girls' plates, boss bar, guide and intent slab (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/battle-hud-ffx2.jpg`.
- Swordplay Overdrive: **matched**. Slab, title, SWORDPLAY line, timer ring, bonus chip and the gold zone bar; the mockup's tier labels are illustrative (zones come from the sourced ordering and the owner-adopted estimates) (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/swordplay-overlay.jpg`.
- Ch. 1 Mt. Gagazet: **matched**. The painting is the approved composition (2x master with `?artlink=fast`) (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/scene-gagazet.jpg`.
- Ch. 4 Bevelle Underground: **matched**. The hall, lamps and central door as approved at 1600x900 and the conduits at 2560x1080 (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/scene-bevelle-underground.jpg`.
- Pause on the Until Dawn character screen: **matched**. Tab strip, meter rows, objective line and painting as approved (carried from c7135bec). Evidence `critic/reviews/c7135bec-focused/targets/pause.jpg`.
- Seymour Natus, Chapter X (FFX): **matched**. The card stands at the top right and the figure is clear, as in the lane's frame of the accepted option N (0.0 to 0.1% at 1440x810 and wider); at 1280x720 and 1366x768 it touches wing-spike tips (R39F-11). Evidence `critic/reviews/816d80f9-focused/frames/natus-sensor-card-c7135bec-vs-816d80f9-vs-accepted-option.jpg`.

## Sub-scores (Bailey's five, provisional, not part of the weighted score)

characterModels 7.0, enemyModels 8.0, animation 7.0, fidelity 8.6, camera 8.1. Against c7135bec: fidelity 8.6 (+0.1) and camera 8.1 (+0.1) because the Natus card is off his body at 1440x810 and wider (held now only by the link-gated tier and by the sliver at 1280x720 and 1366x768); enemyModels stays 8.0 (the card fix is offset by Evrae's two-head cast frame coming back, which is live's own); characterModels and animation are capped at 7.0 by CHK-026 (judged 8.3 and 7.5 without the cap; Chapter VIII's feet and registered heads are far better than live's at equal frame rate, 0 against 260 feet swaps and 8.4% against 39.2%). Caps applied: CHK-026 FAILS: characterModels and animation are at most 7.0 (critic/policy.json continuity.caps.sizeFails). Judged without the cap: characterModels 8.3, animation 7.5. snaps per minute 0.61 is over 0.25: animation is at most 7.5 (continuity.caps.snaps); the 7.0 above is already below it.

## Checks

| Check | Result | This review | Where |
|---|---|---|---|
| CHK-002 | PASS | carried | both; Ch I, III, IV, V, VIII, X, XIII, XVI; 1600x900, 2000x1012, 2560x1440, 390x844 |
| CHK-003 | FAIL | carried | both; the failing labels are the strategy guide's, at windows narrower than 1600 |
| CHK-004 | PASS | carried | both; Ch VII, IX, XII, XVII, XVIII (cards), Ch V and XIII (executed), Ch IV phone |
| CHK-006 | PASS | carried | both; first-run cards, Overdrive and reels overlays, target steps |
| CHK-007 | PASS | carried | both; the copy this release changed |
| CHK-008 | PASS | re-measured | FFX only; Ch X Seymour Natus (re-measured); other panels carried |
| CHK-009 | PASS | carried | both; Ch I, IV, V, VI; TEXT SIZE 100, 115, 130 |
| CHK-010 | PASS | carried | both; Ch I, IV (phone), V, XVI |
| CHK-011 | PASS | re-measured | both; Ch X re-measured, Ch III and Ch V carried |
| CHK-012 | PASS | carried | both; the whole shipped art set |
| CHK-013 | PASS | carried | both; Ch I, VIII (4K and 1440p), the held backdrops |
| CHK-014 | PASS | carried | both; Ch I, III, IV, V, VIII, X, XVI |
| CHK-015 | PASS | carried | both; keys, mouse, pad, touch |
| CHK-016 | PASS | carried | both |
| CHK-017 | NOT APPLICABLE | carried | both |
| CHK-018 | PASS | carried | both; shipped art URLs and deploy tooling (read only) |
| CHK-019 | PASS | carried | both; the whole shipped art set, 2x, 3x and 4x tiers |
| CHK-020 | PASS | carried | both |
| CHK-021 | PASS | carried | FFX only / FFX-2 only / both, per item |
| CHK-022 | PASS | re-measured | both; Ch VIII (re-run), Ch I, IV and the loss carried |
| CHK-023 | PASS | carried | both |
| CHK-026 | FAIL | re-measured | both; Ch VIII re-run, Ch I and IV carried; continuity harness |
| CHK-027 | FAIL | re-measured | both; Ch VIII re-run, Ch I and IV carried; continuity harness |

Re-measured here: CHK-008, CHK-011, CHK-022, CHK-026, CHK-027. The others are carried from the c7135bec review with the dependency argument in the JSON (the diff touches neither their code nor the art set). `validateReport` (the function `tools/deploy-pages.mjs` uses, with `loadPolicy`) returns no errors on the JSON, and `shipVerdict` reads SHIP, with R39F-03 and R39F-04 disclosed.

## Coverage

**Tested**
- The rebuilt production dist of 816d80f9 (bundle index-DIf_suBq.js; vite preview 127.0.0.1:5462, BASE_PATH=/) in headless GPU Chromium 153, real keys; labelled hooks only: setSeed(1) before the first key and ?coach=off.
- R39F-01: the Sensor card's cover of Natus on the first menu, the Attack step, with the cursor on each target and with the read-out, at 1280x720, 1366x768, 1440x810, 1600x900, 2000x1012 and 2560x1440 (live at all but 1440x810); a painted-pixel estimate at the two small windows from a frozen scene-only frame.
- R39F-02: the continuity harness (real keys, the game's own probe) over Chapter VIII on the rebuilt dist (329.2 s, 59.5 fps, victory) and again on live release 38 at full frame rate as the control; the old baseline and the c7135bec cut build re-read by swap and pose pair.
- Smokes by real keys: Ch I (3 turns), Ch IV (8), Ch X (5) and the whole Ch VIII fight; 0 console errors, 0 missing files, no non-200 art response.
- The diff read in full (git diff c7135bec 816d80f9), the built stylesheet and bundle checked for both changes, and the dist counted (3,848 files, 116 bytes different).
- The harness's own `aggregate()` re-run over Ch I and IV (carried) and Ch VIII (fresh): 1174.2 s of battle, 1269 swaps.

**Reused**
- every other finding, check, target and gate of the c7135bec review: rendering and the governor, the art gates (2,918 images in Chromium and WebKit, 2,874 masters), the interface, TEXT SIZE, EYE CANDY, Lady Luck, Ch III, the first-run guide, the deploy tooling, the data audit, and the whole evidence folder. From critic/reviews/c7135bec-focused.json and its folder. Why: the code outside the diff is identical (git diff c7135bec 816d80f9: 10 files changed, 215 insertions(+), 69 deletions(-); src in five files, none of them read by those checks), public/ is unchanged and the dist has the same 3,848 files within 116 bytes.
- Chapter I and IV continuity (the two runs and their strips). From critic/reviews/c7135bec-focused/continuity. Why: the diff changes Evrae's scene row and one stylesheet rule; neither chapter loads either.
- the live baseline for Ch I and IV. From critic/reviews/continuity-baseline-r38. Why: its feet, head and snap numbers do not depend on the frame rate; its jerk and double-image numbers do (39 to 46 fps), so no comparison of those two is claimed for Ch I and IV.

**Not tested**
- Chapters I and IV continuity again on this build, and a live control at full frame rate for them
- Chapters other than I, IV, VIII and X by play; the seven other target tiles again; Natus at 1440x900 (16:10, unpinned by design) and at TEXT SIZE 115 and 130
- Audio (agents cannot hear), real devices and browsers, a laptop or integrated GPU, a throttled link
- The live verification of the exact artifact (CHK-017, after the deploy) and the deep review owed on the live build

## Candidate, servers and housekeeping

- D:/pyrefly-r39-int at 816d80f9d07b, clean apart from the two reviews' folders and files (untracked, uncommitted). The dist is the driver's rebuild; this review checked its bundle (the built stylesheet carries `top:max(0px, calc(166px + var(--ffx-sensor-dy,0px) + var(--ffx-sensor-py,0px) - clamp(...)))`, the bundle `crossfadeMs: poseCut ? 0 : party ? 120 : 140` and no `poseCutArt`).
- Served by `vite preview` on 127.0.0.1:5462 (BASE_PATH=/), PID 44728. **Stopped by PID (taskkill /PID 44728 /T /F); port 5462 confirmed closed at 04:22 EDT.** No dev server was started. Headless Playwright Chromium 153 with PYREFLY_BROWSER=gpu, never Claude-in-Chrome and never the in-app pane; the harness ran alone, the probes in two lanes.
- The GPU art lane was idle (GPU at 1 to 11% before and between runs), so the driver's PAUSE-GPU marker was not recreated for this delta; it stays at F:/pyrefly-parked/2026-10-05/r39-focused/PAUSE-GPU, where the c7135bec review left it. The harness ran at 59.5 fps with 43 and 48 slow frames in its two runs.
- Scratch (D:/Tools/pyrefly-scratch/2026-10-05/r39-delta) was parked to F:/pyrefly-parked/2026-10-05/r39-focused/scratch-delta/ by copy, size check and removal. Nothing was committed, pushed or deployed; `npm run deploy`, `tools/deploy-pages.mjs` and wrangler were not run.
