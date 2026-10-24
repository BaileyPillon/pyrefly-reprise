Build / artifact / target version: c8ecbcb31 base, r62-rc c8ecbcb31 (release 62 candidate, dist-gate index-C9xPmvqR.js) / 1b09ad4e5a03
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (CHK-003 on a phone in two new demo-only screens; CHK-027 inherited from live)
Ship: SHIP, better than live r61. Discloses R62-01 (major, inherited, equal on live); R62-02 and R62-03 are polish inside new demo-only screens.
Milestone: not assessed
Quality: not scored in a focused review
Targets: 4 / 3 / 0 / 1 / 0 (the Auron first-use line is unverified in a browser)
Top issues: R62-01 CHK-027 pose-swap jerks (major, same on live); R62-02 thanks card clipped at 390 (polish, demo only); R62-03 defeat hint overlaps slabs at 390 (polish, demo only)
Coverage: Ch I and Ch IV demo flows at 1600x900, 2000x1012 and 390x844; pad skip Ch I; reset; OD 50; living cathedral; Mega Flare; non-demo Ch I; continuity Ch I and IV with live Ch IV; 372 unit tests. Not tested: pad timing Ch IV, the Auron line in a browser, Mega Flare shake and accessibility variants, the other 17 chapters, audio, CHK-008 and CHK-009.
Next required review and why: deep review of the live build after deploy (shared systems changed)
Elapsed review time / repeated work avoided: about 200 minutes, most of it waiting for the shared browser lock; no earlier evidence reused

- Game case: 173a and 173b FFX-2 only; 173c and 173f FFX only; 173d, 173g, 173h, 173i both (demo only); pad skip, warm and PR-0504 both; PR-0487 FFX only. Presence and absence were checked in the intended and the other game for the ones that can be seen.
- Pad A and Start end the Ch I opening in 0.5 s (10 s unpressed); Start does not open the pause; Enter does the same. Ch IV pad timing was not measured.
- TRY AGAIN restarts the same seed (7) with no prep or intro; OTHER FIGHT starts Bahamut (seed 56); the thanks card ignores a press inside 0.7 s and ends on the next press or by itself; the reset hold restores volumes 0.8 and 0.7.
- Frame rates and pose continuity equal live in the same harness. The GPU was shared, so no timing is called a regression.
- The report is keyed c8ecbcb31 as the brief asked; the commit tested is c8ecbcb31 (origin/r62-rc).


Key correction (release driver, 2026-10-22): this report was first written as 3e520971e-focused because the workflow passed origin/main's sha; the review itself ran on r62-rc c8ecbcb31 (bundle index-C9xPmvqR.js, confirmed on the served index.html). Findings unchanged.
