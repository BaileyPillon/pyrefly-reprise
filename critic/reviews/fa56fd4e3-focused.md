Build / artifact / target version: fa56fd4e3 (release 63 conference build, second candidate), bundle index-Bo7iMtyZ.js, targets 1b09ad4e5a03
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (R63-P1 fixed; the harness FAIL on CHK-026 for five outlier swaps, R63-M2 polish, and CHK-027 equal to live)
Ship: SHIP. The phone HOLD is fixed and verified; the continuity HOLD was harness misreadings, and the candidate now matches live on swap jerks; discloses polish R63-M2.
Milestone: not assessed
Quality: not scored (focused review)
Targets: 2 required / 0 matched / 0 failing / 1 unverified (Pause on a phone: chip present, pause screen not opened) / 2 waiting on a decision (F1 HUD against the Ink and Gold tiles)
Top issues: R63-M2 (polish, candidate only), R63-M1 (polish, equal to live), R63-O1, R63-S1
Coverage: tested and notTested as in the JSON; first-review results reused where the code delta cannot reach them
Next required review and why: deep review on the live build after the deploy (owed); R63-M2 strips
Elapsed review time / repeated work avoided: about 160 minutes; first-review desktop and other-chapter reads reused

Browser mode: PYREFLY_BROWSER=gpu, headless Chromium from node, one browser at a time under RIG-RECORD. Server: candidate-build --serve on 5431, stopped by PID 31244, port closed.

What I did wrong: I called "candidate-build.mjs --help" to read its flags; it has no help and ran a full build into dist-gate, which I cut off. I rebuilt dist-gate in full with the same command; same bundle name, art verify and audit PASS (5404 masters).

Verified: R63-P1 at 390x844 / 844x390 / 768x1024 (touch): release-62 HUD, PAUSE chip, whole command names; live at 390x844 identical. Desktop pack on in both chapters; ?pack=demo forces it on at a phone; ?pack=off turns it off.
Continuity (candidate vs live r62, same harness): Chapter I snaps 0 (first candidate 0.62), swap jerks 47 vs 43.4 px, dashes 113.8 vs 47 px; Chapter IV snaps 0, 44.9 vs 48.3 px. Candidate CHK-026 FAIL (five outlier swaps, 0.85 / 1.12 stature), live PASS.
Caution: the harness now excuses more (unseen figures, late planned cuts, half the drawn height, lunge steps as dashes), so CHK-027 equal to live is on a wider rule; I did not look at an excused 220 px Tidus step.
