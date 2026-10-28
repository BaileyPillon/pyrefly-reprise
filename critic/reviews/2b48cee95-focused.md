Build / artifact / target version: 2b48cee95 (release 66 candidate, dist-gate, bundle index-BwPs1UaV.js) / not deployed / targets 1b09ad4e
Review: focused (GPU Playwright, PYREFLY_BROWSER=gpu; the machine was shared, so no frame timing is called a regression)
Deployment: NOT APPLICABLE (candidate, not deployed)
Changed area: UNVERIFIED (nothing failing beyond carried polish; a lost fight, a Chapter V real-key win, a second FFX win and a default frame strip were not played)
Ship: SHIP. No critical or major, no regression against release 65; the A items read as written. Majors this release discloses: none.
Milestone: not assessed
Quality: no new full score (last full score: round 03, rubric v1, evidence baseline only)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting (no approved tile changed; the change is timing)
Top issues: R66-P1 (polish) pose-swap and motion continuity FAIL carried from the live build; R66-S1 (suggestion) default-equals-live proved by tests and loads, not a frame strip
Coverage: 46 switch loads plus Chapter V and Yunalesca, openings of Chapters I and IV (set-up and demo), phone gate 390x844, a won fight in Chapters I and IV with the stamped harness; not tested: lost fights, Chapter V and a second FFX chapter to the end, frame strips, shake at 60/144 Hz
Next required review and why: deep review of the live build (shared presenter, global layout and boot)
Elapsed review time / repeated work avoided: about 100 minutes; release 65 evidence reused as the live baseline

## Case
Release 66 = release 65 + five motion-fluidity lanes. FFX-2 only: ?run= (and the eased ATB bars). Both: the swaps, ?stance=, ?hit=, ?rigko=, the timebase and the first-sight freezes (shared plumbing; Chapters I and IV are the demo pair). Data audit: no src/data or src/battle change (git diff eaf599d0c..2b48cee95), so no values to compare.

## Measured
1. Words: 46 loads on the candidate to the first menu and the first Attack, 0 console errors, default and every value of every B word and the all-on combination, in Chapter I and IV; Chapter V and Yunalesca default and all-on also clean (words/*.json). The menu flag was true again after 4.5 s, so this proves "plays on", not an animation comparison.
2. Opening: card up to leaving 2.74 s (Ch I) and 2.89 s (Ch IV) set-up, 2.25 and 2.66 s demo; release 65 read 3.03, 2.82, 2.28, 2.80: unchanged. HUD down at the exact card-leaving sample (0 ms) in all runs, 0 errors.
3. Phone 390x844: Chapters I and IV reach the first menu with the coach card, guide and intent buttons, no horizontal scroll, 0 errors (phone2/ch4-390-phone.jpg).
4. Continuity harness 9cc8f27cd66e, won by real keys: Chapter IV ghost frames 637 to 534, ghost swaps 210 to 177, swap jerk 45 px unchanged, stature outside band 4 to 3, p99 45.7 to 36.5 ms (noisy); Chapter I swap jerks 4 to 2, worst 46.3 to 32.1 px (CHK-027 PASS), head 12.1 percent unchanged (CHK-026 FAIL), ghost frames 655 to 656, dashes over the line 1 to 2 (one run each).
5. Unit: release66-defaults 29 pass, six lane files 100 pass, tsc clean.
6. Probe note: awaitingMenu read from snapshotState().screenState.playback.awaitingMenu as instructed; my first phone run was too short (7 s) and read false, rerun clean.

## Issues
See the json: R66-P1 polish (carried, not introduced, no regression), R66-S1 suggestion.
