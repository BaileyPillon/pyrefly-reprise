Build / artifact / target version: ff3884fb (release 23 candidate, D:/pyrefly-rel23, dist-gate bundle index-BfW8CHQs.js) / live a44297ca (release 22, bundle DLvZcIgF) / targets.json sha256 77707685...8967 (candidate tree)
Review: focused
Deployment: NOT APPLICABLE. Live verification of this exact artifact is a separate obligation after the deploy.
Changed area: FAIL. Nothing regressed, but one claim is not met. A-12 says Seymour Flux fits the phone field, and in Chapter I at 390x844 his figure is still cut at the right edge, as it is on live (FOC23-01, polish). The A-2 entry transitions are built and deliberately left unwired (5 orphan modules, disclosed).
Ship: SHIP. There is no critical defect and no regression against release 22. The FF7 experiment is a new hidden feature. It stays off the board and writes only its own store. This release discloses these FF7 items: no action effects yet (stand-in lunges), the attack is a slide, the results screen is the house panel, there is no music, and the phone letterbox is small. It also discloses the unwired A-2 transitions. No major defect was found by this review.
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19 (rubric v1 history).
Targets: required 5 / matched 4 / failing 0 / unverified 1 / waiting 0
Top issues: FOC23-01 (polish, not introduced): A-12 does not visibly fit Seymour Flux on a phone in Chapter I; the next step is to fit the visible figure, not the body quad (suspected). FOC23-02 (polish, in a new feature): __pyrefly.gotoChapter reaches the FF7 fight on production. The brief calls this the intended route; Bailey decides whether it stays.
Coverage: Tested: tsc; 50 vitest files; FF7 e2e 5/5 by keys, taps and pad; Ch I by keys at 1600 and by touch at 390; Ch IV won by keys at 2000x1012, then saved and reloaded; the board against the live site at three sizes; door negatives; approved hashes; orphans; data audit of every FF7 value. Reused: A-13 roll, A-3 cold-load, PR-0104, PR-0185 and the A-11 sweep (iter2-b2 handoff and its CHECK), and the FF7 re-check (non-empty save, debug route). Not tested: chapters II, III and V to XV, the PR-0072 pool, A-12 on IV, audio, performance, devices.
Next required review and why: live verification of ff3884fb after the deploy (CHK-017). After that, the deep review owed on the live build (plan depth deep, deepAfterDeploy true, carriedDeep a44297ca).
Elapsed review time / repeated work avoided: about 27 minutes. About 15 of them were uninterrupted playthroughs. The full suite and the 200-seed benches were not re-run, and the FF7 re-check's negative door sweep was reused.

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel23 gave:
- depth deep, with `deepBeforeDeploy: false`, `focusedBeforeDeploy: true` and `deepAfterDeploy: true`
- obligations live / focused / deep; carriedDeep a44297ca
- games: both; 14 chapters
- checks: CHK-002 to 011, 013 to 017, 020 to 023, 025
- targetGroups: chapters, fight, pause, phone, presentation, scenes
- `dataAudit: true`, `approvedArtCheck: false` (the approved-hash check was run anyway)

The change touches no save-data class and makes no milestone claim, so the focused pass runs.

## Candidate and environment

- D:/pyrefly-rel23 at ff3884fbe691. It is clean apart from docs/deploys.log and the untracked dist-gate. dist-gate was built at 09:43, after the 09:40 commit, so it was reused.
- Served by `vite preview --outDir dist-gate` on 127.0.0.1:5431 (PID 59900). **Stopped with taskkill /PID 59900 /T /F; port 5431 confirmed closed.**
- Browser: headless Playwright Chromium with `PYREFLY_BROWSER=gpu`. No black canvas and no fallback. One browser at a time.
- Drivers:
  - `critic/runner/lib/route.mjs` from the candidate.
  - The candidate's `tests/e2e/ff7-guard-scorpion.spec.ts`, copied to `tools/zz-foc23.tmp/` with its frames sent to this review's folder, so the candidate tree stays clean.
  - The scratch probes `tools/zz-foc23.tmp/board.mjs` and `door2.mjs`.

## Game case of each change (CHK-021)

- **FFX-2 only: A-1 wait camera, PR-0104 cut-in cap, PR-0072 Vegnagun pool.** A-1 is gated on an ATB `tick`, and since ff3884fb also on `state().game !== 'ff7'`. The FF7 engine's state reads `game: 'ff7'`.
  - Presence: in the IV wait frames at 2000x1012, Bahamut and the three girls stay in frame (`ch4-seq-*-strip.jpg`).
  - Absence: Ch I (FFX) replays the identical 23 picks and HP ledger as the release 22 review at 1600x900, and the identical 5 picks at 390x844 by touch.
- **FFX only: PR-0185 (IX 4:3 rig).** Not exercised here; the builder's evidence is reused.
- **Both: A-13, A-11, A-12, A-3, PR-0061(a), acting signal, victoryPose port, ground palette.**
  - The A-3 card over the ink shows on the Ch I entry (`ch1-transition-strip.jpg`).
  - The opening callouts clear before the first menu.
  - The phone master stands slightly further back in I (party smaller than on release 22). Seymour Flux is still cut (FOC23-01).
- **FF7 only, plus shared plumbing: the Guard Scorpion experiment.**
  - The fight shows no Ink & Gold card or moments.
  - The board shows no FF7 text or tile.

## FF7 experiment (CHK-025, CHK-015, CHK-022)

- **e2e 5/5 on the production candidate:**
  - LIMIT by keys, then a win with Bolt and Defend. The three warnings show as one block, Tail Laser deals 73 (the research gives 72 to 77), and Cloud reaches the strike point. The results panel shows EXP 100, AP 10 PER MATERIA, 100 gil and the Assault Gun. The board afterwards is the same as before.
  - Seven taps at 390x844, then a win by taps.
  - A loss, then the defeat panel, then RETRY at seed+1000, then CHAPTER SELECT.
  - The pad shim opens the fight.
  - Phone A.
  - The main save is byte-identical in every run.
- **Board against live:**
  - Identical snapshot at 1600x900, 2000x1012 and 390x844: 15 tiles, the same order, one COMING, "0 OF 14 BEATEN", no FF7 text.
  - LIMI and FRFR do nothing.
  - X backs to the title on both builds (as on main).
  - LIMIT opens the battle with `pyrefly-reprise:save:v1` still absent; only `pyrefly-reprise:experiments:v1` is written.
- **Data audit:** every FF7 value checked against research/ff7-guard-scorpion.md and ff7-battle-core.md. All of them match:
  - The boss: Lv 12, HP 800, MP 0, Att 30, MAt 15, Def 40/255, MDf 256/384, Dex 60, Lck 1, 100 EXP / 10 AP / 100 gil, Assault Gun certain, weak to Lightning, Gravity void, the 16 status immunities.
  - Abilities (power / hit%): Rifle 16/100, Scorpion Tail 28/95, Tail Laser 48/120.
  - Spells (power / MP): Bolt and Ice 8 / 4 MP, Cure 5 / 5 MP.
  - Limits: Braver 48/255, Big Shot 52/255.
  - The Cloud and Barret presets, the equipment, and the inventory of Potion x3 and Phoenix Down x1.
  - No FFX or FFX-2 data value changed.

## FFX and FFX-2 routes (no regression)

| Route | Result | Compared with release 22 |
|---|---|---|
| seymour-flux, 1600x900, keys | Defeat on turn 23; results; RETRY reaches prep at seed 1001 and the retried fight | Picks and HP ledger identical; first-menu composite identical |
| seymour-flux, 390x844, touch | Defeat on turn 5; RETRY works | Picks identical; the master stands back slightly; Seymour still cut (FOC23-01, same on live) |
| ffx2-bahamut, 2000x1012, keys | Victory in 56 turns (as in the FF7 re-check); results; post scene; the board reads 1 OF 14 BEATEN after a reload | First-menu composite identical |

All routes had 0 console errors, 0 not-found files and 0 assertion failures.

## Checks

The records are in the JSON. CHK-011 is FAIL (FOC23-01, not a regression) and CHK-017 is NOT APPLICABLE; every other selected check is PASS.

## Other results

- tsc: clean.
- vitest: 49 files pass, 1 skipped (664 tests).
- orphans: 29 (main's 24 plus the 5 unwired A-2 modules).
- verify-approved: 267 ok, 0 mismatched, 0 missing.

## Issues

- **FOC23-01 (polish; not introduced; not a regression).** At 390x844 in Chapter I, Seymour Flux sits past the right edge on the first menu and through the fight, although A-12 claims 1.0 for him. The suspected cause is that the fit measures the body quad rather than the visible figure.
- **FOC23-02 (polish; new feature).** `__pyrefly.gotoChapter('ff7-guard-scorpion')` opens the fight on production. The brief calls it intended (re-check R-1); Bailey decides whether it stays.

Evidence: `critic/reviews/ff3884fb-focused/`.
