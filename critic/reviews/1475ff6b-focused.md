```text
Build / artifact / target version: main 1475ff6b (release 30 candidate, D:/pyrefly-rel28/dist-gate, bundle index-B0cfXTil.js) / targets.json sha256 3ceb8b55...8c9512
Review: focused
Deployment: NOT APPLICABLE (pre-deploy; the live check follows the deploy)
Changed area: PASS
Ship: SHIP - no critical introduced, no regression vs live release 29 (49005f73); no majors to disclose (D-282 Sin difficulty already disclosed by the driver)
Milestone: not assessed
Quality: no current full score; last full score = round 03 on 7191674 (2026-09-19, rubric v1, history only)
Targets: required 2 / matched 2 / failing 0 / unverified 0 / waiting 0 (Sin XVII and XVIII tiles, driver's D-279 picks)
Top issues: FOC30-P01 polish (phone XVII queue banner under the Fin plate), FOC30-P02 polish (phone XVIII countdown panel + coach card over the party), FOC30-P03 polish (pause dossier over Sin's eye), FOC30-S01 suggestion (XVIII cursor starts on SPECIAL, card picks Hastega)
Coverage: tested - both Sin chapters from the board by real keys and taps (desktop, phone) through prep, scene, a fight, a loss, RETRY, CHAPTER SELECT; XVIII clock 13 to 1 and Giga-Graviton; old save; 18-card board; advisor card in Chapter VII; Songstress in XIII; FFX-2 absence of v4. Reused - e2e 4/4 and probe2 from the first pass of this review (same sha and bundle). Not tested - XVII links II/III by real input, Songstress in Chapter VI, long-fight advisor v4, audio, real phones, Safari, gamepad
Next required review and why: live verification of this exact artifact after the deploy; then the owed deep review on the live build (FFX CTB engine, combat core, presenter, chapter registry, two new chapters, advisor v4)
Elapsed review time / repeated work avoided: 49 min (40 first pass + 9 resumed); the 6-min e2e suite was not re-run because the bundle is byte-identical
```

## Change and game case (CHK-021)

- **Sin: the Fins and the Core (XVII) and Sin: the Face (XVIII)**: FFX only (research/ffx-sin.md §0.3). Listed under FINAL FANTASY X only; absent from every FFX-2 run.
- **Songstress paintings for Rikku and Paine (D-281)**: FFX-2 only (dresspheres, research/ffx2-combat-core.md). Requested only in Chapter XIII after a real-key Change; no Songstress request in any FFX run.
- **Advisor v4 (D-272)**: FFX only; the extra look-ahead worker appears in Chapter VII (two workers) and not in Chapter XIII (one worker, v3).
- **Chapter VII fixes (PR-0243/0244/0245/0253)**: FFX only; card and revive-on-foe re-checked here, the rest reused from the r30-ch7 check.

## Ship reasoning

No critical defect: both Sin chapters run end to end by real input with zero page errors, console errors or failed requests. No regression against live: the board goes from 16 to 18 cards and a release-28 save loads with its three clears and settings intact; Chapter VII's advisor card reads as live and holds still with the menu open; Chapter XIII plays as before. The four findings are polish or suggestion, all inside the new Sin chapters.

## Resumed pass (this session)

The first pass of this review (12:14 to 12:37) wrote the JSON and stopped before this prose report and `critic-clear`. The resumed pass rebuilt `dist-gate` from D:/pyrefly-rel28 (same bundle hash), served it with vite preview on 5437 (GPU headless), re-ran the supplementary real-input script (`supp-recheck/`) and two unit files (27/27). Every step matched the first pass. Three harness-only FAIL lines are explained in `coverage.notes` of the JSON: two also fail on live or come from the harness's own waits, and RETRY returns through party prep as it does live. The preview server (port 5437) was stopped by its PID and the port confirmed closed.

## Issues

| ID | Severity | Where | Observed | Fix |
|---|---|---|---|---|
| FOC30-P01 | polish | XVII, 390x844 | queue banner second line under the Left Fin plate | stack the Fin plate below the banner on narrow viewports |
| FOC30-P02 | polish | XVIII, 390x844 | countdown panel and first-time coach card cover the party | dock the countdown into the top band or beside the party rows on narrow viewports |
| FOC30-P03 | polish | XVIII pause, CHAPTER tab | dossier columns over Sin's eye and teeth | add the measured face box for the plate |
| FOC30-S01 | suggestion | XVIII first menu | cursor on SPECIAL while the card picks Hastega in White Magic | decide the rule and apply it to every chapter |

Full records (checks, evidence paths, tags) are in `1475ff6b-focused.json`.
