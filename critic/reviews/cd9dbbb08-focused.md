Build / artifact / target version: cd9dbbb08 (release 37 candidate, D:/pyrefly-rel37 dist-gate, bundle index-BGBDEn_P.js; shipped files byte-identical to the 3fb1de85 dist-gate) / live c69de96a (release 36) / targets.json sha256 99480bc2168b62e85209e8d6e1ee9761077a60b593f1a251fa37accc8c7fad5c (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (live verification of this artifact is a separate obligation after the deploy)
Changed area: FAIL (carried from 3fb1de85: one polish regression FOC37-03 and unverified named changes; nothing new found)
Ship: SHIP. Shipped bytes identical to the reviewed 3fb1de85 candidate; fresh smoke clean. Discloses FOC37-01 (major, new feature: Lady Luck reel overlay behind the guide card) and FOC37-02 (Trigger Happy press count, sourced rule), plus the lane disclosures in docs/handoff/release-37.md.
Milestone: not assessed
Quality: not scored (focused pass); last full score round 03 on 7191674, 2026-09-19 (rubric v1 history)
Targets: required 4 / matched 2 / failing 0 / unverified 2 / waiting 0 (carried)
Top issues: FOC37-01 major (new feature, not a regression); FOC37-03 polish regression (Ch IV coach clipped at 2000x1012); FOC37-02, FOC37-05, FOC37-04, FOC37-06 polish. Full text in the JSON and in 3fb1de85-focused.md.
Coverage: Tested: diff -rq of both dist-gates (1715 files, identical); real-key smoke Ch I (ffx) and Ch IV (ffx2) at 1600x900 to first menu, living pause open and close, Attack resolved, 0 console or page errors; artifact-manifest unit test 16 of 16. Reused with reason (byte-identical files): all of the 3fb1de85 review, including tsc, orphans, approved-art verifier, data audit, 2000 and 390 routes. Not tested: as listed in the 3fb1de85 report.
Next required review and why: live verification of this exact artifact after the deploy (CHK-017), then the deep review this build owes.
Elapsed review time / repeated work avoided: about 8 minutes; the 75-minute review of 3fb1de85 was reused.

## Notes

- Plan: depth deep, deepBeforeDeploy false, games both; the focused pass runs. Game case: both games per change, as in the 3fb1de85 report; smoke showed Ch I with ffx only and Ch IV with ffx2 only.
- Change since 3fb1de85: tools/artifact-manifest.mjs, its unit test, critic/policy.json, docs/target/decisions.json. No file under dist changed.
- Browser: headless Playwright, PYREFLY_BROWSER=gpu, no black canvas. Server: vite preview on 127.0.0.1:5471 (PID 79256) stopped by PID; port 5471 confirmed closed (0 listeners).
- Harness reused from critic/reviews/3fb1de85.../harness-h.mjs; evidence in critic/reviews/cd9dbbb08-focused/.
