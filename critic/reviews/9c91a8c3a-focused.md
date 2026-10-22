Build / artifact / target version: 9c91a8c3a (release 53 candidate, M:/pyrefly-ch-angra-mainyu, dist-release rebuilt 01:26) / live r52 3c92b60cc / targets.json sha256 ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98
Review: focused
Deployment: NOT APPLICABLE. Live verification is a separate obligation after the deploy.
Changed area: FAIL. CHK-026 is fixed and CHK-027 improved 1.5 to 8 times, but swap jerks of 40 px or more remain (FOC53-001), and double-image severity peaks slightly higher than live (FOC53-002).
Ship: SHIP. No critical, no regression at major severity. Discloses: FOC53-001 (swap jerks still about 1 to 2 per minute, worst 141 px), the Chapter XI buff and the slow-load held card not seen by real keys.
Milestone: not assessed
Quality: not scored (focused pass).
Targets: required 0 / matched 0 / failing 0 / unverified 0 / waiting 0 (approvedArtCheck false; approved hashes verified anyway: 916 ok, 0 mismatched)
Top issues: FOC53-001 major swap jerks (live too); FOC53-002 polish double-image 0.413; FOC53-003 polish held card not exercised under slow load.
Coverage: see the JSON. Not tested: Ch XI buff by keys, throttled card, most CHK-003 to 019, 2000x1012.
Next required review and why: live verification, then the deep review (deepAfterDeploy).
Elapsed review time / repeated work avoided: about 215 min, of which about 150 harness minutes.

Mode: PYREFLY_BROWSER=gpu headless Chromium, no fallback. Preview on 5421 stopped (PID 68684), port closed.

Continuity (candidate vs live r52), swap jerks over 40 px per minute: Ixion/Djose 3.86 to 1.23; Dark Aeons 3.77 to 1.92; Bahamut 4.84 to 0.56; Gui 1.66 to 0.96; Seymour Flux 1.62 to 1.08. CHK-026: Gui and Seymour FAIL live, PASS here. Dark Aeons ends in defeat on the second link on both live and candidate (same).
