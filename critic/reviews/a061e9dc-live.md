```text
Build / artifact / target version: main a061e9dc / bundle Chs9J3OY / artifactHash 506dafe97789f6855c14d83d2da9b75db95e58da2ee745d9e2ff5885d7fd6e83
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (a live review does not gate ship)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: none found by this pass
Coverage: tested = all 5169 files byte-identical, FFX Ch II and FFX-2 Ch IV to the first menu, four real FFX-2 turns, Ch IV opening camera (no pipe slabs), pause/hide/resume, prerendered music, settings reload; reused = none; not tested = full upgrade matrix, chapter-clear persistence, FFX turns past the first menu, the content claims of r41/RC3/RC4 beyond byte identity
Next required review and why: the deep review this build owes (critic/pending/a061e9dc.json: shared combat core, FFX CTB engine, per-game RNG streams)
Elapsed review time / repeated work avoided: ~62 minutes, almost all of it the byte comparison (the stock sequential verify-live was too slow for 5169 files, so the same verifyLive ran with a 16-way prefetch); nothing reused
```

Browser: headless Playwright from node, PYREFLY_BROWSER=gpu, 1600x900, fresh context, cache-busted URL. GPU PAUSE flag created before browser work and removed after. Screenshots: D:/Tools/pyrefly-scratch/a061/*.png.

Details are in a061e9dc-live.json (CHK-017 PASS, CHK-016 PASS, CHK-024 PASS lightweight). A first smoke run picked Chapter III instead of IV because the board has 18 tiles; the screen assertion caught it, the run was discarded and the script now reads the selected header (reviewer harness error, not a game defect). In the FFX Ch II first menu the first-time guide absorbed the Enter presses, so no FFX attack turn was counted; FFX-2 turns advanced 8 -> 28 log entries with every turn returning to the menu.
