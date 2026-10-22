Build / artifact / target version: 6db09ac86 / dist-gate (stamped PYREFLY_RELEASE=59) / ba8a7e74a9d6
Review: focused
Deployment: NOT APPLICABLE (pre-deploy candidate)
Changed area: FAIL (the change met its targets; the continuity checks FAIL and one Kimahri painted-set polish regression)
Ship: SHIP: no critical, no regression at major or above; disclose R59-F1 and R59-F2
Milestone: not assessed
Quality: not rescored; last full score unchanged
Targets: 4 / 0 / 0 / 4 / 0 (not composited)
Top issues: R59-F1 Lulu rig head size 15.8 percent (major, not a regression); R59-F2 Chapter III swap jerks (major, cause unknown); R59-F3 Kimahri painted-set jerks (polish, regression)
Coverage: item use for 7 FFX members and 3 FFX-2 girls; Chapter III win; continuity on 4 chapters (live compared on 3); not tested FF7 and 15 chapters of continuity
Next required review and why: deep on the live build (shared presenter)
Elapsed review time / repeated work avoided: about 195 min; the 30 min live Chapter III run was skipped

## Findings
- R59-F1 (major): Lulu's rig changes her head size by up to 15.8 percent between keys (idle, ready, cast). Introduced by candidate: false. Regression vs live: false.
- R59-F2 (major): Chapter III: 39 pose-swap jerks of 40 px or more (worst 135 px possessed Ixion, Shiva 88 px, Lulu 78 px) and one Shiva stance shift of 35.6 px. Introduced by candidate: unknown. Regression vs live: unknown.
- R59-F3 (polish): Kimahri's painted poses jerk 44 to 67 px at swaps in Chapter I (the worst his revive, lying to standing, as a double image). Introduced by candidate: true. Regression vs live: true.
- R59-F4 (polish): FFX-2 Ixion chapter: 5 swap jerks of 40 px or more, worst 89 px on the boss (live: 4, worst 54 px on Rikku). Introduced by candidate: unknown. Regression vs live: false.
- R59-F5 (polish): FFX: the first Enter in the Items list, with no arrow key before it, does nothing (live r58 the same). Introduced by candidate: false. Regression vs live: false.

## Checks
- CHK-015 PASS: Every item use was made with real key presses (Items row, item row, arrow keys to the target, Enter) on the production candidate; the debug API only set the scene (gotoChapter, setSeed) and wounded the target so the item had something to heal (a labelled setup hook).
- CHK-016 PASS: Every item capture is taken only after the harness asserted the actor's turn (phase command:actor, or the log's last turn-start in FFX-2), the item row and the aimed target; a failed wait throws ASSERT-FAIL (two FFX-2 attempts did and were rerun, not photographed).
- CHK-021 PASS: FFX only: the green orb on an ally (toss, sparkle ring, heal numeral) and the green glow on the user were seen for Tidus, Yuna, Auron, Wakka, Lulu, Kimahri, Rikku and Phoenix Down on KO'd Kimahri. FFX-2 only: no orb, a white-blue spark and burst on Yuna, a Potion from Rikku, Paine and Yuna. FF7 was not played in a browser this pass: its item path is the third branch of the gate and the item-gesture tests (61 tests with the stage and doublecast files) hold that FF7 draws nothing new, so FF7 absence is reasoned, not seen.
- CHK-022 PASS: Chapter III (braskas-final-aeon) played title to results to the board again with real keys on the fixed route: Lulu Doublecast Firaga+Firaga from turn 48, 284 turns, victory, results screen, the cleared tile persisted across a reload, 0 console errors, 0 failed requests, 29.5 min.
- CHK-026 FAIL: Continuity harness, 4 chapters (2326 s of battle): Chapter I PASS; FFX-2 Ixion PASS; Yojimbo FAIL and Chapter III FAIL, from Lulu's rig keys (13 and 102 swaps change a head by more than 3 percent, worst 15.8 percent) plus one Shiva stance shift of 35.6 px. This is the rig reader's first run: Lulu's rig is also on in live r58, whose own Yojimbo run fails worse (25.3 percent head jump, 32 swaps over, Kimahri's rig in it). Chapter I improves from live FAIL (25.5 percent, 13 swaps over, one stature out of band) to PASS.
- CHK-027 FAIL: Continuity harness: Chapter I FAIL (5 swap jerks of 40 px or more, worst 71.7 px; three are Kimahri's painted poses, the worst his Phoenix Down revive from lying to standing; live r58 had 2, both Tidus, worst 52.3), Yojimbo PASS (live PASS), FFX-2 Ixion FAIL (5 over, worst 89.1 px on the boss; live 4 over, worst 54.3 px on Rikku), Chapter III FAIL (39 swap jerks, worst 135.1 px, possessed Ixion; not run on live). Candidate runs show frame p99 of 33 to 41 ms against live 24 to 26 ms (the machine was busier), which inflates some jerks; Kimahri's were on steady frames of 15 to 26 ms.
- CHK-023 PASS: The item gesture was exercised only through the real presentation path (BattlePresenterItem to ItemOrbStage on the live battle screen, real battle log events). In every run the action ended and the next command phase came back (no stalled or doubled turn); the item unit files (61 tests) also pass.
- CHK-020 PASS: Both games got the same work: every FFX party member and FFX-2 Yuna, Rikku and Paine, plus the Chapter III route; the gesture differs by game on purpose (orb vs spark) and is gated by the chapter's game.
- CHK-002 PASS: At 390x844 and 1600x900 the HUD, command menu and the item effect stay inside the window; no stage-sized layer seen in the item runs.
- CHK-003 NOT APPLICABLE: No text, size or contrast changed; the change adds light effects and turns a rig off.
- CHK-006 PASS: The orb, glow and sparks die with the action: the late frames of every sheet show only the heal numeral and then the next menu; no light stayed on screen (3.6 s captures, then the next command phase).
- CHK-008 UNVERIFIED: Panel versus actor measurements were not re-run; the change moves no panel and the sheets show no new overlap with the HUD, but nothing was measured.
- CHK-009 NOT APPLICABLE: No names or labels changed.
- CHK-013 UNVERIFIED: The new item light and Kimahri's return to his painting set were judged by eye on contact sheets only, not against the written art rubric; no approved tile covers the orb.
- CHK-017 NOT APPLICABLE: The focused review runs on the production candidate; the live check belongs to the live review.

Browser mode: headless Playwright Chromium with PYREFLY_BROWSER=gpu. The preview server on port 5457 was stopped by PID and the port confirmed closed.
