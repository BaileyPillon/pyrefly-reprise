Build / artifact / target version: a061e9dc (candidate r42-rc, dist-gate) / not deployed / ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE (pre-deploy candidate)
Changed area: PASS
Ship: SHIP, because there is no critical and no regression against live (five chapters played with real keys, advisor timing level with live, suite green). Discloses one major: FOC42-01 (CHK-027 jerks over 40 px at camera cuts, same as live)
Milestone: not assessed
Quality: no new score (a focused pass is not a score)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: FOC42-01 major (jerks, carried); FOC42-02 polish (stale Bahamut intent note); FOC42-03 polish (difficulty shifts to disclose: Experiment harder, Chapter XIII and Omnis easier)
Coverage: tested Ch IV, XIII, XV, II, XII by real keys, advisor timing against live, full vitest and tsc; not tested: 2000x1012 and 390x844, live re-runs of continuity, audio by ear
Next required review and why: live verification after the deploy, then the deep review on the live build
Elapsed review time / repeated work avoided: about 100 min; builder's 500-seed tables reused

# Focused review of a061e9dc

Browser: headless Chromium, PYREFLY_BROWSER=gpu (59 to 60 fps, no black canvas). Evidence: critic/reviews/a061e9dc-focused/.

- Case (CHK-021): FFX-2 W4 clock and boss scripts are FFX-2 only; RC4 gear, reactions, Reflect and targeting are FFX only; the RNG streams are both, one set per game. The diff touches the two game folders separately.
- Bahamut: the Mega Flare countdown (the 25 s idle) ran inside a real fight to victory in 45 turns, 255 s. Party gauges read 0 only while a spell is charging (the cast bar shows it); attack recoveries fill smoothly. No stall.
- Advisor after a real N press: candidate 3 to 6 ms, live 2 to 7 ms.
- Continuity: CHK-026 PASS (0 over tolerance). CHK-027 FAIL, 173 jerks over 40 px, worst values equal the previous baseline; the worst strips are camera cuts. Ch IV improved (3 against 11).
- Yunalesca (Ch II) was lost by the naive route, as on fcecfa74, and the retry battle was reached.
- Full vitest 1107 files passed (17,205 tests); tsc clean.
- Disclose: the Bahamut intent note is stale (intent.ts:307); the hidden Experiment is harder (500 to 380 by the builder's bench); Chapter XIII and Omnis are easier; the r41 camera fix and SFX hooks held (golden pin test passed; no slabs in the Ch IV capture).
