Build / artifact / target version: fc7f1a20 (release 16, D:/pyrefly-rel16, bundle index-BQnfWT0X.js) / dist-gate built from that tree / targets.json sha256 71b1f65a...ad64 (candidate tree)
Review: focused (after the fact: the build went live first under Bailey's owner override, "push the build live now please")
Deployment: NOT APPLICABLE (live verification is a separate obligation)
Changed area: FAIL (CHK-008 fails inside Chapter XIII; the phone HUD B majors stand)
Ship: SHIP. No critical defect and no regression against 5be4babe. The release discloses five majors, all inside features that are not on 5be4babe: FOC16-01 (Chapter XIII target reticle covers the enemy-move slab), FOC16-02 (the pause CHAPTER column covers Trema's face on plate B), PHB-01 (phone: an ALL-target command has no touch confirm), PHB-02 (phone: the FFX-2 chain label is about 6 px), PHB-03 (phone: Chapter V's acting girl off the left edge)
Milestone: not assessed
Quality: not scored (focused pass); the last full score is round 03 on 7191674, 2026-09-19, rubric v1 history (round 12 on 5be4babe is provisional)
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (phone HUD B matched in layout; decisions compared: Oversoul look B matched, Trema hero plate B's plate matches but a panel covers the face = FOC16-02)
Top issues: FOC16-01 major (reticle over slab, new chapter), FOC16-02 major (panel over plate face, new chapter), PHB-01..03 majors (phone HUD B, new layout), FOC16-03..06 polish
Coverage: tested Chapter XIII real-key flow at 1600x900, 2000x1012, 390x844; win destinations (labelled HP setup) and two defeat -> RETRY paths; kill link; pause + CHAPTER tab; Chapter V and a touch ALL-target probe on the candidate and on 5be4babe; data spot-check; tsc + full unit suite. Reused: the data-fidelity verifier, the phone HUD B verifier. Not tested: human winnability, E1/E2 in play, Chapter V speakers, Evrae/Vegnagun staging repairs, Chapters IV/VI slab, FFX pause fallback, audio, load times
Next required review and why: live verification of fc7f1a20 if not already settled, then the deep review this shared FFX-2 engine / presenter / new-chapter change owes on the live build (plan depth deep, deepAfterDeploy)
Elapsed review time / repeated work avoided: about 75 minutes (over the 15-minute budget: the FFX-2 real-key harness had to be written, two runs were needed to carry the flow across the kill link, one debug-driven run was discarded as a harness race, and the unit suite ran in the candidate tree) / the data-fidelity audit and the phone verifier's measurements were reused, not re-run

## Plan

`node tools/critic-plan.mjs --since 5be4babe --json` in D:/pyrefly-rel16 (with no `--since` the plan compares fc7f1a20 with itself, because deploys.log already names it): depth **deep**, `deepBeforeDeploy: false` (no save-data class, no milestone claim), `focusedBeforeDeploy: true`, `deepAfterDeploy: true`; games both; systems: FFX-2 ATB engine, shared combat core, battle presenter, chapter registry, global layout / input, both HUDs, pause, scenes, strategy guide, advisor; checks CHK-002..011, 013, 015, 016, 017, 020..023; targetGroups chapters, fight, pause, phone, presentation, scenes; dataAudit true; approvedArtCheck false. Under the 2026-09-21 rule this focused pass runs and the deep review follows on the live build.

## Candidate and environment

- `npx vite build --outDir dist-gate --emptyOutDir` in D:/pyrefly-rel16 (fc7f1a20): bundle `index-BQnfWT0X.js`, the name release 16 serves live.
- Served with `vite preview` on 127.0.0.1:5412; the previous live build 5be4babe from D:/pyrefly-rel15/dist-gate (`index-Dat8v42m.js`) on 127.0.0.1:5413.
- Headless Playwright Chromium, `PYREFLY_BROWSER=gpu` (ANGLE D3D11, RTX 5070 Ti); no black canvas, no fallback. No visible window, no OS input (the screen belongs to the FFX-2 game-check agent).
- Both servers were stopped by their own listening PIDs (21888 on 5412, 6812 on 5413, `taskkill /PID /T /F`); both ports confirmed closed.
- `npx tsc --noEmit` clean; `npx vitest run --testTimeout=60000` in the candidate tree: 389 files passed, 7,426 tests passed (5 skipped, 1 todo).

## Game case (CHK-021)

- **Chapter XIII (Trema), Cloister action time 3 s, E1 timed ailments, E3 always-hit physicals: FFX-2 only**, and within FFX-2 only the two Cloister groups (constants live in `src/data/ffx2/enemies/trema.ts`; research/ffx2-trema.md). Trema is listed in the FFX-2 group of chapter select (index 9, after Leblanc) and nowhere in the FFX group.
- **E2 accessories survive a spherechange: shared FFX-2** (FFX has no spherechange). Its Chapter V effect was not played here (deep review).
- **Pause CHAPTER heroArtFallback: both.** Seen in FFX-2 (Chapter XIII plate present); the FFX mirror was not opened (CHK-020 UNVERIFIED).
- **Enemy-move slab: FFX-2 only** (`src/ui/ffx2`).
- **Phone HUD B: both**, per-game halves: the FFX-2 phone shows the boss gauge and no turn list, as the research says.

## What was played

1. Title -> briefing ("Nine fights") -> chapter select -> ArrowRight to Chapter XIII -> Enter -> prep -> Enter -> pre scene (10 lines; Trema, Yuna, Rikku, Paine portraits load) -> battle, all with real keys, at 1600x900, 2000x1012 and 390x844. First menu 12 to 23 s after the battle starts, including the first-time coach card.
2. Real-key Attack on Paragon (3,326 damage, matching the advisor's 3,218-3,634 range); Esc pauses from the command menu, E three times opens CHAPTER (hero plate B, "BATTLE 1 OF 2"), Esc resumes.
3. **Win (labelled):** at each command menu the debug API set the enemy to 1 HP, then a real-key Attack. Paragon's victory carried `nextGroupId: ffx2-cloister-trema`; the kill link moved to Trema in the same battle screen with HP carried (Yuna KO); a real Attack finished Trema; the post scene played by Enter, then results (Victory, NEW BEST, EXP 10,000, AP 50, gil 10,000, Dark Matter), Enter, the aftermath line ("Hole in the floor. Out."), Enter, **chapter select**. 0 console errors, 0 HTTP errors.
4. **Loss, twice:** Attack-only real play, and one run handed to `autoBattle('intended')` at skip speed (labelled; seed 13 won through `gotoChapter` but diverged in the real flow). Both reached results (Defeat, RETRY / CHAPTER SELECT); Enter on RETRY returned to the battle.
5. Chapter V first menu on the candidate and on 5be4babe: identical rows and HP; no errors on either.
6. Touch-only ALL-target probe at 390x844 (Chapter V, White Magic -> Pray) on both builds: neither build confirmed Pray by touch through the paths tried, so PHB-01 is not a regression on this evidence.

A discarded run: pressing Enter on the title and then calling `gotoChapter` orphaned the title root, and after the debug flow resolved the aftermath scene waited for 369 presses. CHK-016 names that race; the real flow does not show it (step 3).

## Data audit (dataAudit: true)

Reused the Trema go-live data-fidelity verifier (PASS, 0 blockers, same commit). Spot-checked against research/ffx2-trema.md: Trema HP 999,999 (6 sources), EXP / AP / gil 10,000 / 50 / 10,000, Dark Matter drop 100 %, steal base chance labelled `[estimate]`; Oversoul Paragon HP 210,000, EXP / AP / gil 13,000 / 2 / 8,000, Dark Matter drop; `CLOISTER_ACTION_TIME_SECONDS = 3` labelled `[estimate]`, Bailey's pick, Cloister links only; the E1 timed-ailment default labelled `[estimate]`. All equal to the source. The results screen shows only Trema's rewards (FOC16-04, polish).

## Target comparisons

- `phone-battle-hud-B-ffx2-menu.jpg`: frame B-ffx2-menu against the Chapter XIII phone menu. The layout matches (rail with boss gauge and pause, the enemy line, three chips, tip line with GUIDE, 2-column tiles, footer). The fighters are much smaller than in the frame (FOC16-05).
- `oversoul-look-B.jpg`: option B frame against the first menu. Blue cast, rim and motes match.
- `trema-hero-plate-B.jpg`: b-pause.jpg against the CHAPTER tab. The plate matches; the third column covers the face (FOC16-02).

## Checks

| Check | Result | Note |
|---|---|---|
| CHK-016 (mandatory) | PASS | every capture asserted its screen; one failed assertion recorded UNVERIFIED and retaken |
| CHK-017 (mandatory) | NOT APPLICABLE | focused candidate review; the live check is separate |
| CHK-021 (mandatory) | PASS | cases written; Trema present in FFX-2, absent in FFX |
| CHK-015 | PASS | every step by real keys |
| CHK-022 | PASS | win (labelled HP setup) and loss destinations by real Enter |
| CHK-023 | PASS | kill link on the real path, HP carried |
| CHK-004 | PASS | advisor rows match the menu |
| CHK-007 | PASS | no developer words on the captured surfaces |
| CHK-010 | PASS | target chip, ring, dimming; ALL ALLIES on the phone |
| CHK-011 | PASS | one enemy per link, visible |
| CHK-013 | PASS | Oversoul B, plate B, speaker portraits in game |
| CHK-008 | FAIL | FOC16-01, FOC16-02 |
| CHK-009 | FAIL | DRESSPHE… (polish) |
| CHK-003 | FAIL | reused: chain label about 6 px on the phone |
| CHK-002 | UNVERIFIED | the six-viewport sweep was not run |
| CHK-005 | UNVERIFIED | degenerate boards not run |
| CHK-006 | UNVERIFIED | overlay exits not walked |
| CHK-020 | UNVERIFIED | FFX pause fallback not opened |

## Issues

Each major carries its ship tags in the JSON. All five are `inNewFeature: true`. Four are `regressionVsLive: false`; PHB-03 is `unknown` (Chapter V on the phone was not re-checked here).

1. **FOC16-01, major:** at the Chapter XIII target step the FFX-2 flower reticle around Paragon covers the enemy-move slab's description at 1600x900 and 2000x1012. Evidence: `cand-trema-probe-1600x900-10-target-step.jpg`, `cand-trema-probe-2000x1012-10-target-step.jpg`. Fix: keep the slab clear of the reticle's projected box.
2. **FOC16-02, major:** on the pause CHAPTER tab, the quote and polaroid column sits across Trema's eyes on hero plate B, while the picked frame keeps the face clear (H hides it). Evidence: `trema-hero-plate-B.jpg`.
3. **PHB-01, major (phone HUD B):** an ALL-target command has no touch confirm. Reproduced with Pray; 5be4babe also failed the same probe.
4. **PHB-02, major (phone HUD B):** the FFX-2 chain label is about 6 px (reused finding, not re-measured).
5. **PHB-03, major (phone HUD B):** Chapter V's acting girl is off the left edge (reused finding; a repair is running on main).
6. FOC16-03 polish: the pause CHAPTER tab prints DRESSPHE…
7. FOC16-04 polish: Chapter XIII results show only Trema's rewards (Paragon's 13,000 / 2 / 8,000 are not shown).
8. FOC16-05 polish: on the phone the Cloister camera leaves the fighters small.
9. FOC16-06 polish: the guide heading reads "Trema" during the Paragon link.

Evidence folder: `critic/reviews/fc7f1a20-focused/`. Harnesses (agent scratch): `tools/zz-crit16-flow.tmp.mjs`, `zz-crit16-win.tmp.mjs`, `zz-crit16-seeds.tmp.mjs`, `zz-crit16-select.tmp.mjs`, `zz-crit16-touch.tmp.mjs`.
