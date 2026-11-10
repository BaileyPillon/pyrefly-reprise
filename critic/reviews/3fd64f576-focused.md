Build / artifact / target version: 3fd64f576 / dist-gate bundle index-C26ETj4I.js / targets 1d05c392
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (Oblitzerator CHK-027 inside a new chapter; Wendigo continuity UNVERIFIED; nothing regressed)
Ship: SHIP. No regression against live; the majors below are disclosed (R80-1 Oblitzerator ghosting in a new chapter, R80-2 Seymour Flux CHK-026 already on live)
Milestone: not assessed
Quality: not scored in a focused review
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R80-1 Oblitzerator pose-swap ghosting (2,628 ghost ms a minute); R80-2 Seymour Flux CHK-026 (same on live); R80-3 Wendigo continuity probe sees no battle; R80-4 phone prep tab row clips its last tabs until scrolled
Coverage: tested: wendigo, blitz, dragon, debut to results by real keys; Isaaru and Ixion Djose routed to victory; prep at 390, 1600, 2000; continuity on three chapters; art and lake proofs. Reused: the full unit suite. Not tested: Sleep stance and the aeons in a browser, CHK-002 sweep, CHK-013 art rubric
Next required review and why: deep review on the live build (second deploy while a deep review is owed; release 81 refuses)
Elapsed review time / repeated work avoided: about 70 minutes; unit suite and census reused

## What was checked

Case: Wendigo and Oblitzerator FFX only; Special dresspheres, Gullwings, Luca opener and the stat-table fix FFX-2 only; the prep fix both. Browser: headless Playwright, PYREFLY_BROWSER=gpu, one browser at a time under the RIG-RECORD lock. The server on port 5612 was stopped by PID 38868 and the port is closed.

- Wendigo (word wendigo, 1600x900): prep, first menu with Wendigo and two Guardians on the lake stage with 3D models loaded, Guardian Berserk and the last shields, victory and results; no console errors. The word does nothing in a 390 px window (desktop only). The route harness also won it in 52 turns.
- Oblitzerator (blitz): crane stays dark, wakes on the third Thunder, Use crane takes 5,625 off 6,000, results read 580 gil, 36 AP and an Elixir.
- Gullwings Chapter 1 (dragon) and Luca opener (debut): to the Celsius seam and to the post scene lines; girls at Lv 12/13/14 on the fixed table.
- Special: specialDressUp defaults to false in the bundle; the FFX-2 menu reads Attack, Skill, Change, Item.
- Regression: Ixion Djose (FFX-2) wins in 27 turns on both candidate and live; Isaaru (FFX) wins; Seymour Flux continuity reads the same on both builds.
- Party prep: title whole at 390, 1600 and 2000; no horizontal page scroll; the last tab is reachable by a real tap on the phone.
- Art: art-derive verify and audit PASS, lake models 28 files PASS, approved hashes 0 mismatched.

Disclosed and not counted: the Luca opener's stale handoff screenshots, the Luca open picks, the CHAPTER card cut tile, stand-in art on the new chapters. Live Ixion Djose logged 60 console errors against 0 on the candidate (the live site's own, not a candidate finding).
