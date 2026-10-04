Build / artifact / target version: f4244e1f2c606781046d46259614399b51a6a85e (release 37.1 candidate, D:/pyrefly-rel371, dist-gate bundle index-DhiL5vEz.js, 1,715 files, 798,330,509 bytes before the deploy adds artifact-manifest.json, about 798,570,277 shipped, 1,429,723 under the 800,000,000 cap, 0 source maps, artifactHash 505e9ad6cc077616f8bf173e66912e428e47e9b2a5480554de32354919be9b24) / live cd9dbbb0 (release 37, bundle BGBDEn_P, artifactHash 766d9587007f584b) / targets.json sha256 99480bc2168b62e85209e8d6e1ee9761077a60b593f1a251fa37accc8c7fad5c
Review: focused
Deployment: NOT APPLICABLE. Live verification of this exact artifact is a separate obligation after the deploy.
Changed area: FAIL. Both round-20 acceptance checks pass on the candidate (and fail on live), nothing critical or major regressed, but one approved-target case fails on a reachable path (FOC371-01, major) and CHK-003 fails on the phone (FOC371-03, polish, old size).
Ship: SHIP. No critical defect and no regression at major or critical severity against release 37. The release DISCLOSES FOC371-01 (major, introduced by the candidate, not a regression): a hurried opening never plays Bailey's approved night-sakura arrival in Chapter IX. Also disclosed: FOC371-02 (polish) the intent card still paints over the slab on desktop, FOC371-03 (polish) slab text under the 14 px floor on a phone, FOC371-04 (suggestion) the slab covers the guide and intent cards while open.
Milestone: not assessed
Quality: not scored (focused pass). Last full score: deep round 20 on cd9dbbb0 (release 37), 2026-10-03, provisional, ship HOLD: combat 9.2, encounter 8.9, visual 8.8, feel 8.6, narrative 9.0, audio UNVERIFIED, interface 8.2, onboarding 8.6, prep 9.1, delivery 8.4. The build has changed since; no score carries.
Targets: required 1 / matched 0 / failing 1 / unverified 0 / waiting 0 (the cold chamber tile: the arrival passes on a played-through opening, fails on a hurried one)
Top issues: FOC371-01 (major, FFX only): hurried Ch IX never plays the approved arrival; evidence critic/reviews/f4244e1f-focused/composites/pr0341-candidate-hurried-frames.jpg; next: play it from the first menu without hiding the figures, or get Bailey's yes to skipping it, and re-scope PR-0342. FOC371-02 (polish, FFX-2): intent card over the slab on desktop (2 of 4 windows, Ch V 1600x900); evidence critic/reviews/f4244e1f-focused/composites/th-intent-card-over-slab-1600x900-desktop.jpg; next: mount the slab above .eint and .mad. FOC371-03 (polish): MASH TAP 5.33 px on a phone.
Coverage: Tested: tsc, 25 changed-area test files (297 tests), orphans, approved-art verifier, audio qa, production build, artifact check and manifest diff, 28 candidate Trigger Happy windows by real keyboard, emulated pad, emulated touch and mouse (Ch V and IV, three layouts) with live comparison, Ch IX hurried x6 / tapped x1 with live x3, four autopilot digests against live, stacking chains. Reused: the integrator's full suite (only six source files changed), release 37's deep round for every untouched area. Not tested: a physical pad or phone, Safari or Firefox, the route-less fallback, cancel and pause exits of the slab in a browser, other Gunner chapters, Ch IX retry, the deep review.
Next required review and why: live verification of f4244e1f after the deploy (CHK-017), then the deep review this build owes (deepAfterDeploy true); Bailey's answer on FOC371-01 before the next Cavern change.
Elapsed review time / repeated work avoided: about 78 minutes. The integrator's full suite and the builder's browser tables were not repeated (every number below was re-measured with a new harness, and the autopilot digests equal the builder's).

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel371: depth focused for this candidate (reason: 36 substantial checkpoints since the last deep review), review class deep, deepBeforeDeploy false, focusedBeforeDeploy true, deepAfterDeploy true, obligations live, focused, deep; games both; 18 chapters; checks CHK-002, 003, 006, 007, 008, 009, 010, 013, 015, 016, 017, 020, 021; targetGroups fight, pause, phone, presentation; dataAudit false; approvedArtCheck false (run anyway). Not the save-data class, no milestone claim, so the focused pass runs. Changed product paths: BattleScreen.ts, cavern-stolen-fayth-arrival.ts, cavern-stolen-fayth.ts, openingMark.ts, TriggerHappy.ts, minigames.css.

## Candidate and environment

- D:/pyrefly-rel371 at f4244e1f, detached, sparse (no docs/screenshots), junctions for node_modules and public/art, public/fx copied from the main tree and verified against the candidate's list (see FOC371-05). dist-gate built with `npx vite build --outDir dist-gate --emptyOutDir` (3.0 s, 1,273 modules, bundle index-DhiL5vEz.js 3,679,258 bytes, css index-B8jtRvzT.css 337,013 bytes, 322 unshipped files left out by the dist filter).
- Served by `vite preview` on 127.0.0.1:6741 (PID 27360). Stopped by its own PID at the end of the browser work (taskkill /PID 27360 /T /F, which also ended its helper child 69540); Get-NetTCPConnection then showed no listener on 6740 to 6749. No harness or Playwright browser process was left running.
- Browser: headless Playwright Chromium from node, PYREFLY_BROWSER=gpu (ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)), no black canvas, no fallback, one browser at a time. Harness (mine, written for this review; it uses the critic's route libraries for the context, gamepad shim and menu reading) is saved beside this report under harness/.
- Live comparisons ran on https://baileypillon.github.io/pyrefly-reprise/ (release 37; its artifact-manifest.json equals critic/artifacts/cd9dbbb0.json).

## Game case (CHK-021)

FOC37-02: **FFX-2 only** (Trigger Happy is the Gunner's X-2 ability, research/ffx2-combat-core.md 3.1). PR-0341: **FFX only** (the Cavern of the Stolen Fayth, Chapter IX). The one shared line, BattleScreen marking a hurried scene, is inert for every scene that does not read it. Present: the slab with three routes in Ch IV and V; the Cavern fix in Ch IX. Absent: 6 Ch IX first menus show 0 FFX-2 HUD nodes and 0 slabs; FFX-2 has no Cavern. The cases are written in docs/handoff/r37-hotfix.md and in commits d8b18561 and 61bb53ca.

## Data audit

dataAudit is false and no data value changed: the source delta has nothing under src/data or src/battle.

## Gates (all re-run on the candidate)

- tsc: exit 0 (TypeScript 7.0.2).
- Changed-area tests: 25 files, 297 tests, 0 failed (ui-ffx2-trigger-happy-input 23, ui-ffx2-trigger-happy 5, cavern-hurried-arrival 10, cavern-scene 17, cavern-arrival-framing 16, cavern-hold-bottom 3, ginnem-glow 13, flow-opening-hurry 5, opening-hurry 3, presenter-opening-skip 7 and callouts 7, the battle-screen and intent-opening suites).
- orphans: 1,204 modules, 1,180 reachable, 24 orphaned (the same 24).
- verify-approved (ROOT = the candidate): 634 ok, 0 mismatched, 0 missing (586 approved, 48 judge-locked).
- audio qa --strict: exit 0, 0 cues with findings, 0 sfx findings, 88.49 of 90 MB.
- Build: 0 .map files, 0 files with sourceMappingURL; artifact check (decode of every shipped file): 1,715 files, 967 decoded, 2 flat images, both listed in critic/policy.json: 0 problems after policy.
- Manifest against release 37 (critic/artifacts/cd9dbbb0.json): added assets/index-B8jtRvzT.css and assets/index-DhiL5vEz.js, changed index.html (same 3,056 bytes), removed assets/index-BGBDEn_P.js and assets/index-BI-IdB4b.css and the deploy-only .nojekyll; net +1,438 bytes (JS +1,270, CSS +168), exactly the integrator's prediction; nothing else differs. Total 798,330,509 bytes plus about 239,768 for artifact-manifest.json: about 798,570,277 shipped, 1,429,723 under 800,000,000.

## FOC37-02: Trigger Happy, real input (Yuna Gunner, Skill > Trigger Happy; hits from the engine log, "landed" = damage events of that action)

Round 20's acceptance check, item by item: keyboard R x3 = 3 hits: PASS (3). Pad R1 x3 (emulated pad) = 3: PASS (3). 390x844 touch taps x3 = 3: PASS (3). The overlay names the key for the active input: PASS (MASH R, MASH R1, MASH TAP, MASH CLICK; live says MASH R1 for every input). Ch IV and V autopilot digests identical: PASS (4 of 4, below).

| Route (presses) | Candidate 37.1 | Live 37 |
|---|---|---|
| keyboard R x3, Ch V 1600x900 | UI "MASH R" 3 HITS, engine trigger.hits 3, damage events 3 [78, 81, 78] | UI "MASH R1" 3 HITS, engine trigger.hits 3, damage events 3 [78, 81, 78] (words MASH R1) |
| pad R1 x3 (shim), Ch V | UI "MASH R1" 3 HITS, engine trigger.hits 3, damage events 3 [74, 74, 82] | UI "MASH R1" 0 HITS, engine trigger.hits 0, damage events 1 [72] |
| touch taps x3, Ch V 390x844 | UI "MASH TAP" 3 HITS, engine trigger.hits 3, damage events 3 [52, 76, 73] | UI "MASH R1" 0 HITS, engine trigger.hits 0, damage events 1 [52] (slab not topmost: the intent card covers it) |
| mouse clicks x3, Ch V 1600x900 | UI "MASH CLICK" 3 HITS, engine trigger.hits 3, damage events 3 [72, 81, 78] (words MASH R at open, MASH CLICK after the first click) | not run |
| Enter x3 (control), Ch V | UI "MASH R" 0 HITS, engine trigger.hits 0, damage events 1 [72] | UI "MASH R1" 0 HITS, engine trigger.hits 0, damage events 1 [72] |
| keyboard R x3, Ch IV 1600x900 / 2000x1012 | UI "MASH R" 3 HITS, engine trigger.hits 3, damage events 3 [7, 10, 10] / UI "MASH R" 3 HITS, engine trigger.hits 3, damage events 3 [11, 10, 11] | not run |
| pad R1 x3, Ch IV | UI "MASH R1" 3 HITS, engine trigger.hits 3, damage events 3 [7, 10, 10] | not run |
| touch taps x3, Ch IV 390x844 | UI "MASH TAP" 3 HITS, engine trigger.hits 3, damage events 3 [10, 10, 12] | not run |
| 12 presses, key / pad / touch, Ch V | 12 / 12 / 12 hits | not run |

The keyboard row is identical on both builds down to the three seeded damage numbers (78, 81, 78): the keyboard path did not move. Enter still counts nothing on either build.

Autopilot digests (the unattended path through the real page, intended strategy, skip speed), candidate = live:

- ffx2-bahamut s1: 2042 events, sha256 ec2eab04..7dc2 on both builds, outcome victory
- ffx2-bahamut s2: 2127 events, sha256 d5fb0717..e94c on both builds, outcome victory
- ffx2-vegnagun-shuyin s1: 1434 events, sha256 e9240ffe..a52a on both builds, outcome victory
- ffx2-vegnagun-shuyin s2: 1160 events, sha256 4534749b..9087 on both builds, outcome victory

## PR-0341: Chapter IX at the first menu (seed 1, fresh profile, real keys, per-frame actor probe)

Round 20's acceptance check: at 1600x900 and 2000x1012, seed 1, Yojimbo, Daigoro and Ginnem are drawn in the first 3 frames after awaitingMenu in 3 of 3 runs: PASS at both sizes (3 of 3 and 3 of 3, aligned both to the command menu on screen and to the engine's awaitingMenu); live 0 of 2.

| Run | Drawn in the first 3 frames after the menu | Hidden span against the first menu (Yojimbo / Daigoro) | Arrival meshes, peak opacity |
|---|---|---|---|
| candidate hurried 1600x900 #1 | yes (Ginnem, Yojimbo, Daigoro) | never hidden | 0 |
| candidate hurried 1600x900 #2 | yes (Ginnem, Yojimbo, Daigoro) | never hidden | 0 |
| candidate hurried 1600x900 #3 | yes (Ginnem, Yojimbo, Daigoro) | never hidden | 0 |
| candidate hurried 2000x1012 #1 | yes (Ginnem, Yojimbo, Daigoro) | never hidden | 0 |
| candidate hurried 2000x1012 #2 | yes (Ginnem, Yojimbo, Daigoro) | never hidden | 0 |
| candidate hurried 2000x1012 #3 | yes (Ginnem, Yojimbo, Daigoro) | never hidden | 0 |
| candidate tapped-through 1600x900 | yes | -11.8 to -8.6 s / -11.8 to -9.1 s (before the menu: the arrival) | 1.0 at -8.7 s |
| live hurried 1600x900 | NO | -4.9 to +5.5 s / -4.9 to +5.0 s | 1.0 at +5.4 s |
| live hurried 2000x1012 | NO | -4.6 to +5.7 s / -4.6 to +5.2 s | 1.0 at +5.6 s |
| live tapped-through 1600x900 | yes | -11.5 to -8.6 s / -11.5 to -9.0 s | 1.0 at -8.7 s |

## Findings

1. **FOC371-01** major, FFX only, introduced by the candidate, not a regression, disclosed: A hurried opening never plays Bailey's approved night-sakura arrival: Chapter IX starts with Daigoro and Yojimbo already standing, and the blue tree, night veil and petals never appear. Candidate, hurried opening (Enter held through the scene), 6 of 6 runs at 1600x900 and 2000x1012: Ginnem, Yojimbo and Daigoro are drawn on every frame from staging (alpha never below 0.95), and the arrival's own meshes (sakura-arrival veil, tree, glow, petals) peak at opacity 0 over 935 to 956 frames; the frames from battle start to 11 s after the menu show no tree (composites/pr0341-candidate-hurried-frames.jpg). Candidate with the scene tapped through (opening not hurried): the arrival plays as designed, tree opacity 1.0, peak 8.7 s BEFORE the first menu, Yojimbo and Daigoro hidden until it (Yojimbo hidden 11.8 to 8.6 s before the menu), the same as live tapped (peak 8.7 s before; hidden 11.5 to 8.6 s before): the played-through opening is unchanged and matches the approved arrival (composites chamber-arrival-target-vs-candidate-tapped-opening.jpg). Live release 37, hurried (2 of 2 runs): Yojimbo and Daigoro are missing until +5.5 / +5.0 s after the first menu (1600x900) and +5.7 / +5.2 s (2000x1012), when the tree peaks (opacity 1.0 at +5.4 s): the arrival plays mid first turn, which round 20 filed as PR-0341 (major) and PR-0342 (polish, "a foreign blue tree"). Release 36 played the arrival for every opening. So 37.1 cures the missing figures by never playing the arrival on a hurried opening. docs/handoff/r37-hotfix.md and the paper preflight say so ("the arrival is not played", "the arrival stops playing for a first-time player") but name no owner decision for it and do not mention the tile's mustChange.
2. **FOC371-02** polish, FFX-2 only, old: On desktop the enemy-intent card is still painted above the Trigger Happy slab: in Chapter V at 1600x900 it hid the ring, the hit counter and half the bar in 2 of 4 windows. True on the 390x844 phone (the slab is topmost at its left, centre and right in 4 of 4 windows, although the card covers 70 to 94 percent of its rect), not on desktop. The slab (z-index 15) sits in .ffx2hud__stage, which has a transform and is therefore its own stacking context; the intent layer .eint (z-index 2) is a sibling of that stage under #ui, so it paints above the whole stage. With the card parked over the slab, elementsFromPoint lists h4.eint__head eint__head--random > div.eint__body > div.eint__panel eint__panel--detached > div.ig-minigame__head > div.ig ig--ffx2 ig-minigame ffx2-trigger (card first, slab after); live has the same structure with the slab at z-index auto and pointer-events none, so the slab is not even hit-tested there (h4.eint__head eint__head--random > div.eint__body > div.eint__panel eint__panel--detached > canvas > div: the card, then the canvas). Natural frames: Chapter V seed 1 at 1600x900, windows 3 and 4 of 4 (and the 12-press pad window): the card (x 477 to 852, y 184 to 400) covers 34 percent of the slab, hiding the ring and the hit counter, and a click on the covered part lands on the card. The guide card is inside the stage, so the slab does beat it. Not new and not a regression: live is the same or worse (its slab is under the guide card too); 37.1 fixed the guide card and the phone only.
3. **FOC371-03** polish, FFX-2 only, old size: Trigger Happy's instruction and counter are under the 14 px legibility floor on a phone and at 1600x900 (MASH TAP 5.33 px and 0 HITS 5.78 px at 390x844; MASH R 13.33 px at 1600x900). Effective sizes read from the DOM at the three layouts: 390x844 MASH TAP 5.33, 0 HITS 5.78, title 16.89; 1600x900 MASH R 13.33, 0 HITS 14.45; 2000x1012 MASH R 14.98, 0 HITS 16.25. The sizes are the ones MASH R1 always had (live reads the same), so not a regression; what is new is that TAP, CLICK and R1 are now true instructions and on a phone the label is 37 x 6 px.
4. **FOC371-04** suggestion: The slab now covers the guide card (desktop) and the enemy-intent card (phone) for the 1.8 to 2.6 s the window is open. At 2000x1012 the slab covers 86 percent of the guide panel and 100 percent of its chip; at 1600x900 it cuts the guide's header; at 390x844 it covers 87 percent of the intent card. Live drew the slab under both. The covered cards carry nothing the player needs during the window.
5. **FOC371-05** suggestion, process: The shared fx backup was overwritten by the r38-bytes branch, so node tools/fx-assets.mjs restore (and ensure) refuses on the release tree. node tools/fx-assets.mjs restore in D:/pyrefly-rel371 prints FAIL (8): bevelle-underground, djose-chamber-provisional, gagazet and macalania-temple depth.json and depth.png differ from the f4244e1f list. The backup copies were written today at 15:16 and match the r38-bytes branch's list (gagazet/depth.png 118,208 bytes there, 1,058,487 in main's list). D:/pyrefly-rel371/public/fx was therefore copied from the main tree's public/fx instead, which verifies PASS against the candidate's list (node tools/fx-assets.mjs verify). The backup itself was not touched. The deploy builds from public/fx, so nothing shipped is affected; a later ensure or restore on main would fail or restore the r38-bytes files.

## Not a defect, for the record

- Pressing R or the pad's R1 during the window also fast-forwards the presenter (BattleScreen.ts `justPressed('r1')`, old behaviour for the keyboard); it did not change the hit count in any run.
- Two harness failures were fixed and rerun (see CHK-016); none of their captures is used.
- tools/end-state-board.mjs and tools/end-state-board-decisions.mjs are untracked in the main tree, so the approved-tile composites had to be made from the main tree, not from the release worktree.

## Evidence

All under critic/reviews/f4244e1f-focused/: harness/ (hlib.mjs, th.mjs, pr0341.mjs, digest.mjs, compose.mjs, montage.mjs, summarize.mjs, the batch scripts), gates/ (tsc, vitest, orphans, verify-approved, audio qa, build and artifact logs, manifest-diff.json, the candidate's manifest, critic-plan.json), th/ (one folder per Trigger Happy run: run.json and frames), pr0341/ (one folder per Chapter IX run: run.json with the per-frame timeline, early and first-menu frames), digest/ (one run.json per digest), composites/ (live against candidate, the contact sheets, the intent card over the slab), and the two approved-tile composites chamber-tile-vs-candidate-hurried-first-menu.jpg and chamber-arrival-target-vs-candidate-tapped-opening.jpg at the folder root.
