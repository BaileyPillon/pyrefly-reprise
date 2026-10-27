Build / artifact / target version: 8ee3ca11b (release 63 conference build), bundle index-DAo9s-Zx.js, targets 1b09ad4e5a03
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (phone regression R63-P1, Chapter I continuity regression R63-M1; desktop play of both pack chapters works)
Ship: HOLD. R63-P1: on a 390x844 phone the pack (on by default in Chapters I and IV) removes the PAUSE button and cuts the command names; live has both. A major regression introduced by this candidate.
Milestone: not assessed
Quality: not scored (focused review)
Targets: 2 required / 0 matched / 0 failing / 0 unverified / 2 waiting on a decision (F1 HUD against the Ink and Gold tiles); the phone Pause tile fails under R63-P1
Top issues: R63-P1 (major, regression), R63-M1 (major, regression), R63-O1, R63-S1, R63-T1 (polish), R63-X1 (suggestion)
Coverage: tested and notTested as in the JSON
Next required review and why: Fix R63-P1 (phone gate) and look at the R63-M1 strips, rebuild, focused rerun on a phone and Chapter I continuity; deep review on the live build after the deploy.
Elapsed review time / repeated work avoided: about 120 minutes

Browser mode: PYREFLY_BROWSER=gpu, headless Chromium, one browser at a time under the RIG-RECORD lock. Server: vite preview on 5871 (pid 48916) stopped by PID, port closed.

- R63-P1: on a 390x844 phone the pack (on by default in Chapters I and IV) removes the PAUSE button and cuts the command names; live has both. A major regression introduced by this candidate.
- R63-M1: Chapter I swaps snap more than live (0.62 snaps per minute against 0; swap jerks to 290 px and a 603 px teleport against a 47 px worst), measured by the harness on both builds; cause suspected in the new Overdrive and camera staging, not traced.
- What is good: on the desktop (1600x900, 2000x1012) the pack in Chapters I and IV plays from the real title to a lost and a won fight with 0 console errors at 59 to 60 fps; the other chapters match live; Chapter IV motion is level with live. R63-P1 is fixed by a gate on narrow screens, and the conference PC is not affected, so Bailey may choose to override the HOLD for the booth.
