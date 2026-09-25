Build / artifact / target version: a999d133 (release 13 candidate against live e3b8c2a3), D:/pyrefly-rel13/dist-gate, bundle Ji5E4fD0. The reviewed manifest is b5873d9c (939 files, all decode-checked, 0 problems). It matches the deployed artifact 612bae4c byte for byte, except for the .nojekyll file the deploy adds. targets.json e64a5322 (candidate tree). NOTE: a999d133 was deployed at 19:47 EDT under an owner override while this review was running (docs/deploys.log, NOW.md).
Review: focused
Deployment: NOT APPLICABLE (pre-deploy candidate; live verification owed after the deploy)
Changed area: FAIL (two polish regressions against live, R13-02 and R13-03; every adopted change is present and matches its tile)
Ship: SHIP. There is no critical defect and no major regression against live. Every adopted change is present, and the combat changes are sourced and tested. Disclosed major: R13-04 (Evrae, Chapter VIII: the FFX command stack covers Tidus at the first menu; the same on live).
Milestone: not assessed
Quality: no full score for this build; the last full score is round 03 (rubric v1, 7191674, 2026-09-19), history only
Targets: required 7 / matched 6 / failing 0 / unverified 1 (D-044 Vegnagun part anchors) / waiting 0
Top issues: R13-04 major (Evrae: the stack covers Tidus, same on live, disclosed); R13-02 polish (ch. I reticle bracket crosses the moves panel text, regression); R13-03 polish (Evrae 2000x1012: Rikku partly under the stack, regression); R13-01 polish (Yuna's new slot overlaps Kimahri and Auron, the accepted D-041 trade-off); R13-05 polish (FFX-2 phone pause text overlap, same on live)
Coverage: tested: the real-input flow into all seven listed chapters at 1600x900 and 2000x1012 on both builds (first menu plus a targeting step, measured visibility), the cut-in, pause faces at five sizes in both games, phone and desktop prep, the FFX-2 victory frame, FFX defeat to retry, engine outcomes on 16 seeds, the artifact hash and decode, tsc, the full vitest suite. Reused: none. Not tested: the PR-0019 chip in a browser, a named Vegnagun part as target, the Evrae targeting step, gamepad, real phone, Safari and Firefox, the unlisted IX-XI, listening.
Next required review and why: live verification of the exact artifact after npm run deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepBeforeDeploy false, deep carried from e3b8c2a3)
Elapsed review time / repeated work avoided: about 50 min (about 20 min of it unattended capture). The staging sweep, pause and prep runs each used one browser session per build, so no full replay was repeated.

## Plan and case

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel13 gives depth deep, **deepBeforeDeploy false**, focusedBeforeDeploy true and deepAfterDeploy true. Games: both. dataAudit true, approvedArtCheck false. Obligations: live, focused, deep (deep carried from e3b8c2a3). Under the 2026-09-21 release rule ("A, B, and C together please.") the focused pass decides the deploy, and the deep review follows on the live build.

Game cases (CHK-021), with sources:
- **Both (plumbing):** holdParty staging, pause faces B (D-070), phone prep card A (D-071), PG UP / PG DN paging on the desktop prep card.
- **FFX only:** Yuna's slot in I and III (D-041), the menu above the turn cut-in (D-042, PR-0005 B), the PR-0019 chip, and the Mortibsorption threshold counters (research/ffx-seymour-flux.md 2.2 line 200 [verified: 2 sources]; 4.3, Protect below 75 %, Reflect below 50 %).
- **FFX-2 only:** Paine stack A (D-122), the s3 target plates (PR-0150), the Vegnagun anchors (D-044), and magic never rolling (research/ffx2-combat-core.md 2.9: the magic tables carry no Accuracy column; Enchanted Ammo's `Stat`, line 620, is the one opt-in).

Presence and absence were both checked:
- The cut-in lift is present on the FFX candidate (`.ffxhud__lift`) and absent on live. The FFX-2 path is proved untouched by `ui-ffx-cutin-lift.test.ts`.
- The target plates appear only in FFX-2.
- `pause--stack` appears only for FFX-2 Paine at 1280 wide.
- The Yuna move shows only in I and III.

## Evidence

Renderer: PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti) throughout, with no fallback. The candidate was served by `vite preview` on 127.0.0.1:5921, which was stopped by its own PID (63020) at the end; port 5921 was confirmed closed. Live: https://baileypillon.github.io/pyrefly-reprise/ (e3b8c2a3).

**Staging, every listed chapter (item 1).** Each chapter was entered with real keys: title Enter, briefing Enter, arrows to the tile, Enter, prep Enter, and Enter held through the scenes. The measurements came from `PaintedStage.visibility()` and `visibilityInFrame()` at the first menu and at a targeting step (data/sweep-*.json, data/target*-*.json; `analyze.mjs` compares live with the candidate).

| Chapter | Candidate vs live (frame visibility, 1600 / 2000) |
|---|---|
| I Seymour Flux | Yuna 0.28 to 1.00 (the fix). Kimahri 0.72 to 0.41 by box (R13-01). Mortiorchis box under the wider moves panel; the reticle crosses its text (R13-02) |
| II Yunalesca | no material change (Yuna 0.70 to 0.74, Auron 0.67 to 0.75 at 1600) |
| III Braska's Final Aeon | Yuna 0.29 to 1.00 (the fix). Auron 0.82 to 0.34 by box, still readable (R13-01) |
| VIII Evrae | Tidus under the stack on both builds, 0.16 to 0.23 (R13-04). Rikku 0.85 to 0.63 at 2000 only (R13-03) |
| IV Bahamut | unchanged or better (Paine 0.82 to 0.90 at targeting) |
| V Vegnagun | the body stays on live's spot (Tail 0.86 on both builds at 1600); Yuna 0.89 to 1.00 at 2000 |
| VI Leblanc | Dr. Goon's lane unchanged, every figure at least 0.82 on both builds |

Composites: pr-0002.jpg (the PR-0002 A tile against ch. III) matches. The pair images and crops that show R13-01 to R13-03 are in D:/Tools/pyrefly-scratch/focused-r13/.

**Menu above the cut-in (item 2).** Captured during the slab at 1600x900 and 2000x1012. On the candidate the command cascade draws above the slab while the rest of the HUD sits under the veil. Live draws the slab over the menu. The composite with the chosen `b-under.png`, pr-0005-ffx.jpg, matches. PR-0127 desktop: PG DN scrolls the CHAPTER columns (0 to 36/37 px) and PG UP returns them, with the hint "PG UP / PG DN SCROLL" in I and IV (data/prepkeys.json). This feature is new in the candidate (89df9ba3 is not in e3b8c2a3). The "live" side of that pass (19:57 EDT) already showed it, which dates the moment live switched to a999d133.

**Baseline validity.** These comparisons ran before 19:47 EDT, so they are true comparisons against e3b8c2a3:
- the staging sweep and the targeting passes;
- the cut-in;
- the phone prep.

The live pause pass (19:53-19:57) still served e3b8c2a3: it showed no Paine stack, which exists only in the candidate. The prep-keys and engine-outcome passes ran against a999d133, so neither is a baseline. The phone prep card, option A (prep/phone-sheet.jpg, pr-0127-phone.jpg):
- Its minimum effective text rises from 3 px on live to 14 px.
- START BATTLE is pinned at 782-828 px.
- The wheel scrolls the page.
- A touch tap on START BATTLE begins the battle, in both games.
- There is no horizontal overflow.

The PR-0019 chip was not exercised in a browser; `target-chip-clear.test.ts` passes.

**Pause faces (item 3).** Esc and then Q/E (the tab keys) at 1280x720, 1280x960, 1600x900, 2000x1012 and 390x844 (pause/, pause-cand.json and pause-live.json):
- Auron and Tidus in III: at 1280x960 the plate slides so that the IN THIS FIGHT values clear the face. On live the values sit by Auron's ear (pause/sheet-ch3-1280x960.jpg).
- Paine in V: `pause--stack` is on at 1280x720 and 1280x960 only, and her face is clear. Rikku's face is clear (pause/sheet-ch5-cand-1280.jpg). The composite with the pause-faces tile is pause-faces.jpg.
- Phone: identical to live (pause/sheet-phone.jpg). The FFX-2 phone overlap is pre-existing (R13-05).
- Across all sizes: no horizontal overflow and no console errors.

**FFX-2 HUD (item 4).** At targeting, the TARGET plate, the actor plate ("Yuna WHITE MAGE") and the controls hint appear: in ch. IV at a single target with "change target" shown, and in ch. V at All allies with "change target" correctly dropped (targeting-s3.jpg, the composite with s3). At the victory event, in IV and V, 0 plates, hints or targeting classes are visible (data/victory-*.json). IV then reaches results and its aftermath.

**Combat (item 5).**
- Data audit: the three changed reachable values match their research sources (see the JSON `dataAudit`).
- Tests: `ffx2-magic-never-misses` and `chapters/seymour-flux-mortibsorption` pass. The full suite passes: 340 files, 6664 tests. `npx tsc --noEmit` is clean.
- Engine outcomes (data/outcomes.json), from `gotoChapter` with auto intended and seeds 1-8 in I, 1-3 in IV, 1-2 in V and 1 in II, III, VIII and VI: every listed chapter finishes on the candidate, and ch. I intended wins 6 of 8 (seeds 1 and 3 lose). **This is not a comparison with e3b8c2a3.** The live side of the pass ran at 20:00-20:04 EDT, after the 19:47 deploy, so it ran against a999d133 itself. The regression question for combat therefore rests on the suite and on the fixes' own tests. In the builder's 200-seed bench (commit 617a45b8), the ch. I win rates are unchanged; that bench is the builder's evidence, not this review's.
- Real-input entry with the intended strategy: ch. I seed 1 (a defeat) reaches results and then prep, so retry works.

**Registry (item 6).** Chapter select has 8 tiles on both builds, and only seymour-anima-macalania is COMING (locked). Chapters IX, X and XI have no card. Their data sits in the bundle, but normal play cannot reach it.

**Artifact.** `tools/artifact-manifest.mjs build` on dist-gate gives 939 files, every one decode-checked, with 0 problems and 0 audio unverified. The diff against critic/artifacts/e3b8c2a3.json:
- 51 files added, all for the unlisted IX-XI (art, the boss-yojimbo.mp3 cue at 90.27 s by ffprobe, the pause plate and portraits).
- 3 files changed: art/manifest.json, audio/manifest.json and index.html.
- No shipped art or audio changed, so no approved hash is touched.

## Issues

- **R13-04 (major, disclosed; introducedByCandidate false, regressionVsLive false).** In Evrae (VIII), at the first menu, the FFX command stack covers Tidus at 1600x900 and 2000x1012. This is the same defect class as PR-0002, which D-041 fixed for I and III only. Fix: an options sheet for chapter VIII, for Bailey. Acceptance: Tidus at least 0.9 visible at the first menu.
- **R13-03 (polish; introduced true, regression true).** In Evrae at 2000x1012, Rikku stands about 30 px further left and her left side falls under the stack rows (0.87 to 0.64). Her face and weapon are still clear. Suspected cause: holdParty staging.
- **R13-02 (polish; introduced true, regression true).** At the ch. I targeting step (1600x900), the reticle's top-left bracket crosses the NEXT BEST MOVE panel text. On live the panel compacts clear of it. Mortiorchis stands lower now that the relax is retired.
- **R13-01 (polish; introduced true, regression false).** In I and III, Yuna's new slot overlaps Kimahri and Auron, and her staff crosses them. Both stay readable. This is the trade-off D-041 accepted.
- **R13-05 (polish; same on live).** On the FFX-2 phone pause, the GARMENT GRID row prints over the chapter caption.

Harness notes (not product defects):
- The first Enter at the first battle menu dismisses the one-time coach line, the same as live (HF3-01).
- In II, III and VIII the default row is TALK or ORDERS, so the targeting step there needed ArrowDown. Evrae's key path went into Orders instead, so its targeting step is UNVERIFIED.

## Coverage

Tested and not tested are as in the header; the JSON has the full lists. Evidence is under critic/reviews/a999d133-focused/, and the harness scripts are in D:/Tools/pyrefly-scratch/focused-r13/h/.
