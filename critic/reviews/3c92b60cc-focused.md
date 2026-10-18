Build / artifact / target version: 3c92b60cc (r52-rc) / dist-release built here / ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE (not deployed yet)
Changed area: UNVERIFIED (Gui not seen in play; CHK-027 FAIL is pre-existing)
Ship: SHIP. Better than live r51 on the pose fix; the one major (swap jerks) exists on live too and is disclosed
Milestone: not assessed
Quality: no full score taken; last full score unchanged
Targets: 0 required captured / 0 matched / 0 failing / 0 unverified / 0 waiting (approvedArtCheck false)
Top issues: FOC52-001 major swap jerks (live too); FOC52-002 polish Ch 28 caption overlap; FOC52-003 polish harness cannot open Gui
Coverage: tested Ch 28 first turns, three continuity chapters on candidate and live, layouts at 3 sizes; not tested Gui, Ch V, most CHK-003 to 023
Next required review and why: deep review on the live build (deepAfterDeploy)
Elapsed review time / repeated work avoided: about 175 min, of which about 2 h harness runs

Mode: PYREFLY_BROWSER=gpu headless Chromium; preview server on 5612 stopped (PID 44736, port closed).

Continuity (candidate vs live r51): Ixion/Djose CHK-026 PASS vs FAIL (feet shift 1.2 vs 29.4 px); Bahamut PASS/PASS; Dark Aeons PASS/PASS; CHK-027 FAIL on both for all three (swap jerks 115.7/177.8/173.8 vs 112.9/138.6/170.3 px).
