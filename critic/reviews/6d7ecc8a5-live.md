```text
Build / artifact / target version: 6d7ecc8a5, bundle BqgCyT8R, artifact ac420514e36e944600deba3a05c074788982aaa78ba4c9ef9c81c6498b29dd7f
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: not applicable to a live review (the focused reports for 0804dc482 and 6d7ecc8a5 are SHIP)
Milestone: not assessed
Quality: not scored (live review)
Targets: not assessed
Top issues: none
Coverage: see JSON
Next required review and why: deep review on the live build (owed from 6d7ecc8a5)
Elapsed review time / repeated work avoided: about 60 minutes, most of it the 7169-file byte comparison; the focused reports reused by reference
```

Browser: PYREFLY_BROWSER=gpu headless Chromium from node (critic/reviews/6d7ecc8a5-live/smoke.mjs, reload.mjs). No Claude-in-Chrome or built-in pane.

CHK-017 PASS: verify-live --full, 7169 files checked, none mismatched, missing or wrong type; live manifest matches.
CHK-016 PASS: Evrae, Vegnagun, Fallen Aeons, Ixion and Mirror Aeons each reached a first player menu by real keys; treated list and holds as released; cancel, Attack, Escape/P pause, H hide/restore all behaved; prerendered music playing. 0 console errors, 0 404s.
CHK-024 PASS (lightweight): reduce-flashes setting set through the pause options, survived a reload. Progress and the upgrade matrix not tested.
Pose census (static): 1106 paintings, 829 pass, 79 waived, 0 fail, 198 exempt (data, not a verdict).
