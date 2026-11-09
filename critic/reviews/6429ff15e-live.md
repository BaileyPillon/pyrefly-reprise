Build / artifact / target version: main 6429ff15e, bundle DQzgTgdc, artifact 74832395e7b649f13a949b38d0f16ad506ec5a1ae09f3bfed3aae2f1c88698cf
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (live pass)
Ship: not applicable (a live pass; no majors found, none disclosed here)
Milestone: not assessed
Quality: not scored in a live pass
Targets: not assessed in a live pass
Top issues: none found.
Coverage: tested = artifact identity (974 changed files vs 36b6e851d, live manifest match), title/board, the three new words (spherimorph, youth, weapon) open party prep with cancel path back to the board, Chapter I and Chapter IV to a player turn by real keys with [rig] tidus on and [rig] rikku-dark-knight on, FFX cone marker on a target (99x54) and Escape cancel, Escape/P pause and resume, H hide and restore, music mp3 fetched and playing (boss-seymour), reload smoke, pose census; reused = none; not tested = full byte comparison of all files (--full stopped by PID after the changed-from run passed, as in releases 75 and 76), battles of the three hidden chapters, ?partyrigs=off, ?marker=hand and ?portraits=turns variants, FFX-2 Special Eject rule, Dark Aeons link-4 guide anchor, full upgrade matrix, touch
Next required review and why: deep review of the affected chapters and systems (owed for 6429ff15e)
Elapsed review time / repeated work avoided: about 35 minutes, most of it the stopped --full download

CHK-017 PASS, CHK-016 PASS, CHK-024 PASS (lightweight). Mode: headless Playwright, PYREFLY_BROWSER=gpu (no black canvas, no fallback). Console errors 0, 404s 0 across the smoke runs (smoke.mjs, smoke2.mjs, reload.mjs). Chapter IV is board id ffx2-bahamut. Pose census totals: {"subjects":174,"paintings":1247,"pass":948,"waived":101,"rigged":0,"fail":0,"exempt":198,"byClass":{"idle":174,"standing":642,"ko":114,"low":71,"wide":16,"staged":176,"part":54},"byGame":{"FFX-2":819,"FFX":314,"unknown":92,"FF7":22},"byRowStatus":{"ok":862,"held":86,"waived":101,"none":198}}.
