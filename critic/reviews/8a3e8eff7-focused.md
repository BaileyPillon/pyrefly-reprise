Build / artifact / target version: 8a3e8eff7 (Release 50 candidate, M:/pyrefly-ch-angra-mainyu, dist-release bundle index-CDwyZHD2.js, built with BASE_PATH=/) / live f939b87f2 (r49) / targets.json sha256 ba8a7e74...c0b98
Review: focused
Deployment: NOT APPLICABLE. Live verification of this exact artifact is a separate obligation after the deploy.
Changed area: FAIL. Chapter XXVII and the r50-rc fixes work and nothing regressed, but two majors stand: Yuna's Yojimbo has a Y monogram for a face and both Yojimbos draw the painting D-054 rejected (FOC50-01, new feature), and CHK-027 fails on the party's motion as it does on live (FOC50-02, not introduced).
Ship: SHIP. No critical defect, no regression against live r49. 11 of 11 FFX chapters give the same-seed battle log as live; 7 of 7 FFX-2 chapters still win. This release discloses FOC50-01 (new feature) and FOC50-02 (already on live), plus the chapter's known difficulty (the advisor line wins about 3 of 4 seeds; Act II was lost on seed 1 by the route driver, which cannot Pay).
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19 (rubric v1 history).
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (the board tile; the other groups are not touched by this change)
Top issues: FOC50-01 (major, new feature): Yuna's Yojimbo is a Y tile in the turn bar and HUD, and his painting is the one D-054 says is not approved; next step is Bailey's painted Yojimbo. FOC50-02 (major, not introduced): 117 one-frame jumps of 40 px or more on the party (worst 210.6 px), the same class as r38 baseline. FOC50-03 (polish): the results location line is cut and the board's boss line omits Dark Yojimbo.
Coverage: Tested: tsc; the full unit suite (1,290 files passed, 0 failed); approved hashes 916/0/0; data audit of the Dark Aeons' records; Chapter XXVII by real keys at 1600x900 (route), 2000x1012 (proof 31/31) and 390x844 touch (proof 31/31) plus a loss and RETRY (24/24); the board, "of 19" and the ribbon; the phone door field by touch; Biran and Yenke's Sensor card; Angra Mainyu's phone header against live; 18 same-seed pairs against live; the continuity harness on Chapter XXVII. Reused: the FFX-2 end wait, Itchy and Osmose rows (unit suite and the r50-rc frames); continuity of the other chapters (r38 baseline). Not tested: the Act II win by the route driver, a phone loss, Biran and Yenke's continuity (the harness cannot enter a hidden chapter), audio, devices.
Next required review and why: live verification of 8a3e8eff7 after the deploy (CHK-017); then the deep review the plan owes on the live build.
Elapsed review time / repeated work avoided: about 215 minutes, most of it the 5-minute production builds (the first build was ruined by MSYS rewriting BASE_PATH=/, so it was run twice), an 18-minute and a 17-minute route, and a 30-minute continuity run. The 200-seed benches were not re-run.

## Plan

`node tools/critic-plan.mjs --json` in M:/pyrefly-ch-angra-mainyu: depth deep, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`; games both; 19 chapters; checks CHK-001 to 011, 013, 015, 016, 017, 019 to 023, 026, 027, B1; targetGroups audio, chapters, fight, pause, phone, presentation, scenes; `dataAudit: true`, `approvedArtCheck: false` (run anyway). The change touches no save-data class and claims no milestone, so the focused pass runs.

## Candidate and environment

M:/pyrefly-ch-angra-mainyu at 8a3e8eff7, `BASE_PATH=/` set from PowerShell for the build and the preview (Git Bash rewrote it to a Windows path the first time and broke every asset URL), vite preview on 5611, headless Playwright Chromium from node with PYREFLY_BROWSER=gpu (no black canvas). The preview was stopped by its PID and port 5611 is closed.

## Game-aware case (CHK-021)

Chapter XXVII is FFX only (research/ffx-mirror-aeons.md). Present: the XXVII card under FINAL FANTASY X, "of 19", the word `yojimbo`. Absent: no card in the X-2 group at 1600x900 or 390x844. The FFX-2 header, item ledger and end wait are FFX-2 only: FFX same-seed logs equal live. The door field is both: it opened FFX's Biran and Yenke from the shared board.

## What was checked, with the result

- Chapter XXVII by the player's own keys. Desktop proof tool: Act I (the pair), Yuna's Summon list (Yojimbo, Cindy), the Sisters out with Free choice, Attack order and Combine, a real Delta Attack (12 hits), the seam with the HUD fading out and back, the heal (party and aeons whole), Act II (Dark Yojimbo and the dog), the Pay ladder (Pay 1,000 / 10,000 / 100,000 / 1,000,000 / Pay all; the gil fell by exactly 100,000 and compatibility rose 128 to 131), Yojimbo's Zanmato ending the fight, the post scene, Results (Victory, NEW BEST), the board with the ribbon and "1 OF 19 BEATEN", and the clear in the save. 31/31 at 2000x1012 (seed 3) and 31/31 at 390x844 touch (seed 1); retry 24/24 (a lost Act II, RETRY, Act II reopened on a whole party).
- Desktop at 1600x900 by the route driver (seed 1): Act I won, the seam, Act II reached. The driver does not choose Pay (it picks the advisor's "Yojimbo" row and no payment), so Yojimbo fell at once and Act II was lost: that is the driver's limit, and the proof tool covers Pay. The first keyed desktop proof on seed 2 lost Act I with both sisters at about 10 percent; seed 1 in the first full proof showed Combine lit and no Delta Attack once (FOC50-05, not reproduced in two reruns).
- Difficulty read: autoBattle on seeds 1 to 7: wins on 2, 3, 4, 6, 7; losses on 1 and 5, in line with the disclosed 294 of 400.
- Same-seed pairs, live against candidate, seed 1, autoBattle intended, 18 chapters: all victories on both sides. The 11 FFX chapters (I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII) have identical battle-log hashes. The 7 FFX-2 chapters (IV, V, VI, XI, XIII, XV, XVI) have different logs, as the rc8 item ledger and end window predict; Leblanc takes 39 turns, live 44.
- r50-rc fixes: the Biran and Yenke Sensor card starts at x 1017 and Yenke's tail ends near x 965 at 1600x900 (clear). Angra Mainyu at 390x844: candidate stacks TAWRICH and ZARICH rows, live prints TAWRICH over SCAN. The phone door field: no field before or after a tap, a field after a 0.9 s touch hold, a wrong word closes it and opens nothing, `gagazet` opens Biran and Yenke's party prep. The FFX-2 end wait, Itchy's White Magic reason and Osmose rows are pinned by the unit suite (not re-shot here).
- Data: the Dark Aeons' ten-column records equal research/re-ffx-dark-aeons.md section 2. Approved and judge-locked hashes on the candidate tree: 916 ok, 0 mismatched, 0 missing.
- Continuity (CHK-026, CHK-027) on Chapter XXVII: 1,009 swaps in 978 s at 59 fps. CHK-026 PASS (max head jump 13.2 percent, feet 0.9 px). CHK-027 FAIL: 117 jerks of 40 px or more (worst 210.6 px), of 311 overall 301 on Tidus, Yuna and Lulu; 0 snaps, 0 hard cuts, no ghost over the limit. The r38 baseline already fails the same check at 211 to 371 px in Chapters I, IV and VIII, so it is not a regression. Biran and Yenke could not be entered by the harness: UNVERIFIED.

## Issues

| ID | Severity | What | Introduced / regression / new feature |
|---|---|---|---|
| FOC50-01 | major | Yuna's Yojimbo shows a Y monogram in the turn bar and HUD card (desktop and phone); the field painting of both Yojimbos is the navy one D-054 rejected | true / false / true |
| FOC50-02 | major | CHK-027: 117 jerks of 40 px or more on the party, worst 210.6 px; live's baseline has the same class | false / false / false |
| FOC50-03 | polish | results location line cut with an ellipsis; board BOSS line lists only Dark Mindy and Dark Sandy | true / false / true |
| FOC50-04 | suggestion | Dark Aeons draw the same paintings as Yuna's own Sisters and Yojimbo (the documented precedent); taste item for Bailey | true / false / true |
| FOC50-05 | polish | not reproduced: one run with Combine lit and no Delta Attack played | true / false / true |

## Proposals (unscored, nothing built without Bailey's yes)

None added by this review beyond FOC50-04's recoloured Dark paintings, which wait for Bailey.

Evidence: critic/reviews/8a3e8eff7-focused/ (proof/, route/, shots/, continuity/, pair-cand.json, pair-live.json, vitest-full.log, door-run.log).
