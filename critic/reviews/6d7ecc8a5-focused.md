Build / artifact / target version: 6d7ecc8a5, bundle index-BqgCyT8R.js, targets 1b09ad4e5a03
Review: focused (delta over 0804dc482)
Deployment: NOT APPLICABLE
Changed area: PASS (privacy gate 0 hits, bundle loads, Chapters I and III play to the first menu, same 15 treated chapters and holds)
Ship: SHIP. The only change is a hold-reason string and a guard test; no new critical or major. Disclosed: R71-C4 (XVI, polish), R71-C5 (head-size reads equal to live, polish), carried by reference.
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: none critical or major
Coverage: see JSON
Next required review and why: Deep review on the live build (owed).
Elapsed review time / repeated work avoided: about 25 minutes; the 0804dc482, 4c01379d4 and 10b426248 reports reused by reference

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock. Server on port 5881 (pid 21792) stopped by PID, port confirmed closed. fps 59.8 and 59.7.
Process note: a mis-typed `candidate-build.mjs --help` re-ran the candidate build and was cut short by a pipe, leaving dist-gate part-built (unredacted art sidecars). It was rebuilt with the same pinned tool (tools/candidate-build.mjs --out dist-gate): bundle index-BqgCyT8R.js again, privacy gate 0 hits in 1367 files. All evidence is from the rebuilt folder.
