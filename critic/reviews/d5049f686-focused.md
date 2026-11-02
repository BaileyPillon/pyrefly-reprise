Build / artifact / target version: d5049f686, bundle index-DY38b3Cj.js, targets 1b09ad4e5a03
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (the floor removes the hops it was built for and the Sin face passes at both speeds; CHK-027 and CHK-026 still FAIL in VIII, 27 and I, all carried from release 72 and equal to or better than live)
Ship: SHIP. No critical, no regression against live. Discloses R73-1 (VIII fast swap jerks), R73-2 (27 swap jerk 55 px), R73-3 (I and IV real-row hops at fast), R73-4 (head swaps, carried).
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R73-1 major, R73-2 major, R73-3 major, R73-4 major, R73-5 polish
Coverage: see JSON
Next required review and why: deep review on the live build (owed)
Elapsed review time / repeated work avoided: about 270 minutes, almost all continuity runs and lock waits; lane evidence reused for byte and load numbers

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock; candidate served on port 5733 (listening pid 25040) and stopped by PID, port confirmed closed. One run (sin-F-pack) timed out waiting for the page and was repeated. Frame timings were taken beside other lanes and are not used for a verdict.
Case: strike floor both games (house strike only); Sin face FFX only; phone entry both.
