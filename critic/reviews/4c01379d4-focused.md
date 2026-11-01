Build / artifact / target version: 4c01379d4, bundle index-BZBJ5-uz.js, targets 1b09ad4e5a03
Review: focused (delta over 10b426248)
Deployment: NOT APPLICABLE
Changed area: FAIL (Chapter XVIII still hops)
Ship: HOLD. R71-C1 Chapter XVIII: 17 one-frame hops over 100 px (up to 401 px) that the pack control does not have; introduced by the candidate, regression vs live, major. Fixed: R71-C2 (VIII, 0 hops) and R71-C3 (Mirror, 0 hops). Disclosed if shipped anyway: R71-C4 (XVI, polish).
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R71-C1 (CHK-027), see JSON
Coverage: see JSON
Next required review and why: Focused review of a repaired candidate (CHK-027 on XVIII against ?treated=pack); the deep review on the live build stays owed.
Elapsed review time / repeated work avoided: about 100 minutes; previous report's clean findings and the pack controls reused by reference

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock. Server on port 5877 (pid 35208) stopped by PID, port confirmed closed.

## Results (delta only)
| Chapter | previous candidate raw hops >100 px | this candidate | pack control | CHK-027 |
|---|---|---|---|---|
| VIII evrae-airship | 16 (to 494 px) | 0 | 0 | PASS |
| XVIII sin-face | 28 (to 530 px) | 17 (to 401 px) | 0 | FAIL |
| Mirror Aeons | 32 (to 207 px) | 0 | 0 | PASS |

Each fight went title to Victory by real keys with 0 console errors. Chapter I (seymour-flux) holds nothing, so its real clips play; treated().holds shows "real" in VIII, XVIII, Mirror and III only among FFX, and in no FFX-2 row.

R71-C1: the hold is present in XVIII yet 17 hops remain (Auron teleport 401 px, Auron dashes 113 to 278 px, Wakka dashes about 115 px, all on damage or knock-out swaps). The remaining source is not the real clips; suspected another treatment piece, not traced.
