Build / artifact / target version: eaf599d0c (release 65 candidate, dist-gate, bundle index-8rsIfOcP.js) / not deployed / targets 1b09ad4e
Review: focused (GPU Playwright, PYREFLY_BROWSER=gpu; the GPU art batch and several lanes shared the machine, so no frame timing is called a regression)
Deployment: NOT APPLICABLE (candidate, not deployed)
Changed area: FAIL (only CHK-026 and CHK-027, polish, carried from the live build at the same class and size)
Ship: SHIP. The fight opening, the card cut and the switches work as written; nothing critical or major, no regression. Majors this release discloses: none.
Milestone: not assessed
Quality: no new full score (last full score: round 03, rubric v1, evidence baseline only)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting (no approved tile changed its look; the change is timing)
Top issues: R65-P1 (polish) pose-swap continuity FAIL carried from release 64 in Chapters I and IV; R65-S1 (suggestion) Chapter IV stature-band count 4 against 1, watch next run
Coverage: tested the opening of Chapters I and IV (set-up and demo path, 1600x900 and 2560x1440), the card against ?cardhold=full, the boot words, a won fight per chapter with the stamped continuity harness; reused release 64 evidence for the unchanged HUD; not tested: shake at 60/144 Hz, a lost fight, phone first menu, a second FFX-2 chapter
Next required review and why: deep review of the live build (shared presenter, global layout and boot)
Elapsed review time / repeated work avoided: about 5.5 hours of wall time, about 80 minutes of it work and the rest waiting for the review-browser lock; release 64 evidence reused for everything unchanged

## What the change does, and the case

Release 65 = live release 64 + four lanes. Case per lane (research and notes, not memory): post-tool-pin is critic tooling for both games; post-shake-time is both games (shared clock); post-fight-start is both games (shared opening plumbing; Chapter I is FFX, Chapter IV is FFX-2); post-flicker is FFX-2 only (the ATB turn start).

## What was measured

1. Opening, per frame on the page clock (opening/opening.ndjson, six runs): the boss card goes to "leaving" and the HUD goes down in the same sample (0 ms offset) in Chapter I and Chapter IV, set-up and demo path, 1600x900 and 2560x1440; the card is gone 261 to 285 ms later and the first menu opens with the HUD back (11.9 to 22.0 s after the start of the page, the demo Chapter I includes its 10 s voiced intro, which is by design). 0 console errors.
2. The card hold, same build, default against ?cardhold=full (timeline/*.json, fight-start-timeline, cold, demo): Chapter IV 1283 ms against 2162 ms; Chapter I 1264 ms against 2168 ms. The floor of 1000 ms plus the reveal holds. Press to first menu Chapter IV 10.70 s against 11.68 s.
3. ?timing=frames and ?timing=today turn the real-time shake off, ?motion=classic leaves it on, default is real time (switch/switch-probe.json).
4. Stamped continuity harness (5f9ecb91b07c, this tree at eaf599d0c), Chapter IV and Chapter I, each won by real keys: both CHK-026 and CHK-027 FAIL, at the live build's own class and size. Against release 64: Chapter IV ghost frames 931 to 637 and ghost swaps 256 to 210 (the ready-hold fix reads as intended), swap jerk 45 px unchanged, mid-move dash 120 to 32 px; Chapter I head 12.1 percent unchanged, swap jerks 2 with the worst 69 down to 46 px. Chapter IV out-of-band stature swaps read 4 against 1 with the same extremes; one run each, noted as R65-S1.

## What was not proved

The party at alpha 0 under the fading card is not in a picture (a screenshot is slower than the fade); the HUD-down timing is the evidence. Shake and impact frame at 60 and 144 Hz were not measured (headless cannot set the refresh rate); the unit tests pin the real-time count. The live URL was not re-run.
