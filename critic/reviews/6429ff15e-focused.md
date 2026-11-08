Build / artifact / target version: 6429ff15e, bundle DQzgTgdc, targets 1b09ad4e5a03
Review: focused
Deployment: NOT APPLICABLE
Changed area: UNVERIFIED (what ran passed; 17 of 19 chapters not run through the harness, no big-move portrait frame)
Ship: SHIP. Discloses R77-1 (Spherimorph rewards differ from the data), R77-2 (Seymour Flux continuity read, also on live).
Milestone: not assessed
Quality: not scored (focused)
Targets: 0 / 0 / 0 / 0 / 0
Top issues: R77-1, R77-2, R77-3, R77-4, R77-5
Coverage: see JSON coverage
Next required review and why: deep review on the live build (plan depth deep)
Elapsed review time / repeated work avoided: about 100 minutes

The full record is critic/reviews/6429ff15e-focused.json. Browser mode: PYREFLY_BROWSER=gpu headless Playwright, no black canvas. The GPU was shared, so no timing finding is made.
Process note: my first call to tools/candidate-build.mjs --help actually built and was cut by a pipe, leaving dist-gate without its WebP derivatives (the first pass then showed every rig failing to build). I re-ran the prep command (same bundle DQzgTgdc) and redid every browser check on it; the first pass is kept in first-pass-damaged-dist/ and is not evidence.
