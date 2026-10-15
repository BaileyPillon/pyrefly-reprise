Build / artifact / target version: candidate f939b87f (release candidate r49-rc, worktree D:/pyrefly-r49; production build dist-gate, BASE_PATH=/); compared with LIVE ea431aa0 (r48); target version ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE (owed after the deploy: CHK-017)
Changed area: FAIL (CHK-008, CHK-011 and CHK-027 FAIL; CHK-003, CHK-006, CHK-022 UNVERIFIED)
Ship: SHIP, and why: no critical defect and no regression against live; the majors are inside the two new hidden chapters or carried and are disclosed (F939-01 the Sensor card over Yenke, F939-03 Angra not finishable by real keys in 15 minutes and very hard on Active, PR-0380 jerks)
Milestone: not assessed
Quality: no new score (a focused pass cannot score a build)
Targets: required 0 / matched 0 / failing 0 / unverified 0 / waiting 0 (the new chapters have no approved tile; the board is unchanged)
Top issues: F939-01 (major, new feature), F939-03 (major, new feature, known), PR-0380 (major, carried), F939-02 and F939-05 (polish)
Coverage: tested the two chapters at three sizes, nine door words, plates, 23 same-seed pairs, the data audit; reused continuity of other chapters; not tested a real-key Angra win, audio
Next required review and why: live verification of the exact artifact, then the deep review on the live build
Elapsed review time / repeated work avoided: about 140 minutes; the build, the full suite and the art gates were the driver's

# Focused review of r49-rc f939b87f against live ea431aa0

Game case: Biran and Yenke is FFX only; Angra Mainyu is FFX-2 only; the shared plumbing (door rows, registry, scenes, ItemDrop.rare, two departure rows) is additive and inert elsewhere (CHK-020, CHK-021). Plan: depth deep, deepBeforeDeploy false, focusedBeforeDeploy true, deepAfterDeploy true, dataAudit true, approvedArtCheck false. Browser mode: PYREFLY_BROWSER=gpu (headless Chromium, no black canvas).

## Ship verdict
SHIP (changedArea FAIL). See shipReasons in the JSON.

## What passes
- Doors: leblanc, experiment, mushroom, fayth, daigoro, valefor, gagazet, angra each open their own party prep with no console error and no 404; limit opens the FF7 battle screen as before; a wrong word opens nothing; the board reads 0 OF 18 BEATEN with 18 tiles.
- Biran and Yenke: real-key win (17 turns, 3:36, AP 9,000, Gil 3,000, Return Sphere x2; Lancet taught eight Rages, each filling the gauge), a loss and retry, three sizes. HP for the shipped Kimahri 3,208 and 2,406 as the formula gives.
- Angra Mainyu: loss and retry at three sizes; the hooked win reaches results EXP 5,000 x3, AP 30, Gil 5,000, Ribbon, then the board.
- Plates: the Tourist Trap and fayth openings draw their painting (FOC48-01 and FOC46-04 fixed).
- Data audit: every checked value equals research/. Same-seed identity: 23 of 23 pairs equal live.

## Disclosed majors
- F939-01 the open Sensor card hides Yenke at the first menu (I closes it); F939-03 Angra Mainyu is very hard on the Active clock (advisor line 1 of 20 at 1.5 s) and the unhooked real-key run did not finish in 15 minutes; PR-0380 carried: 118 jerks of 40 px or more on existing figures (no new figure reaches 40 px).

## Polish
- F939-02 TAWRICH over SCAN at 390x844; F939-05 one unexplained failed "fayth" open, not reproduced.

## Honesty notes
- The one Angra win used a debug hook on the boss HP (labelled). The continuity runs were at 33-36 fps. The first Sensor-card observation is the builder's handoff item, confirmed here.
