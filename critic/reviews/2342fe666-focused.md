Build / artifact / target version: 2342fe666, bundle index-eSs6-WR_.js, targets 1b09ad4e5a03
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (CHK-026 in I and III and CHK-027 in III, XVII and at fast speed still FAIL, all equal to or better than live; XII and XVII HUD and the FFX-2 revive unread)
Ship: SHIP. No critical, no regression against live. Discloses R74-1 (III head and swap jerk), R74-2 (fast swap jerks), R74-3 (I head), R74-4 (unread: FFX-2 revive, XII and XVII HUD on a production build), R74-5 (hidden 3D Bahamut texture leak).
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R74-1 major, R74-2 major, R74-3 major, R74-4 major, R74-5 major (new feature)
Coverage: see JSON
Next required review and why: deep review on the live build (owed)
Elapsed review time / repeated work avoided: about 25 minutes in this continuation; the previous critic's browser work (hidden chapters, continuity, cold loads) reused, no new browser work

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock (previous critic); candidate served on 5561 (pid 99308), control on 5562 (pid 106640), both confirmed stopped and the ports closed. Frame timings beside other lanes are noisy and not used.
Case: Lulu rig, Chapter XII and XVII, Spectral Keeper FFX only; Maesters, 3D Bahamut, Wind Waker FFX-2 only; revive and three/src plugin both.

Evidence is under critic/reviews/2342fe666-focused/ (continuity summaries and worst strips, logs, hidden indexes, cold loads, bytes). The treated-lane pair and plate numbers come from the lane on a dev server of an earlier tip and are labelled as such.
