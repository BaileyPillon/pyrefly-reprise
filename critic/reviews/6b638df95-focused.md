Build / artifact / target version: 6b638df95 (release 50.1 candidate, M:/pyrefly-ch-angra-mainyu, dist-release rebuilt, vite preview :5612) / live r50 8a3e8eff7 (CDwyZHD2) / targets.json sha256 ba8a7e74...
Review: focused
Deployment: NOT APPLICABLE (live verification is a separate obligation)
Changed area: FAIL. The fixes land (Lulu and the other poses; Dark paintings; Yuna's Yojimbo), but the new Dark paintings are unregistered and fail CHK-026 feet and CHK-027 double image.
Ship: SHIP. No critical; no confirmed regression (FOC501-01 is regression-unknown, major, not critical). Discloses FOC501-01 and FOC501-02.
Milestone: not assessed
Quality: not scored (focused pass).
Targets: not composited in this pass (0 / 0 / 0 / 0 / 0)
Top issues: FOC501-01 (major, Dark pose continuity unregistered), FOC501-02 (major, jerks, same as live), FOC501-03 and -04 polish.
Coverage: real-key proof at 1600, 2000, 390; continuity on XXVII and IX plus live XXVII; tests; FFX-2 and tile composites not tested.
Next required review and why: live verification after the deploy, then the owed deep review.
Elapsed review time / repeated work avoided: about 110 minutes; two 7-minute builds (the first dist-release was older than the code commits, and the first rebuild had a mangled base).

## Evidence
Continuity (candidate vs live r50, Chapter XXVII): head swaps over tolerance 0 vs 80 (Lulu x1.38 critical to idle on live); feet over 239 vs 0 (all Dark figures); double image over 0.40 21 vs 0; jerks over 40 px 154 vs 109. Chapter IX: both PASS. Strips under continuity/ and continuity-live/. Proof shots under proof/, proof-2000/, proof-phone/, proof-zan/.
