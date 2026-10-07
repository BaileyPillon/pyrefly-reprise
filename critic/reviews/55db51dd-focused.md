Build / artifact / target version: 55db51dd (release 39.4 candidate: live 39.3 = b80f772f / Dk9resVW plus the 2026-10-07 repairs, the head lock, three door fixes and three music files; branch r394-int, pushed) / dist-gate bundle index-D57LJe-j.js, 4,537 files, artifactHash fd7b1b89f2d9c7f3123b4c1b61aee097e8809961269aa98fabd1e8a6ef6a8d82 / targets.json sha256 ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98
Review: focused
Deployment: NOT APPLICABLE (nothing deployed; the exact artifact at the live URL is the live review's obligation)
Changed area: FAIL (the head lock, the door fixes, the music and the art repairs met their targets and nothing regressed at critical or major; CHK-027 still fails in every chapter as on live, CHK-003 fails the 14 px floor as on live, the hidden chapter fails CHK-026 and CHK-027 as on 39.3, and the release adds two polish items: all carried or polish)
Ship: SHIP. No critical defect and no regression at critical or major severity against live 39.3. Discloses F392-01 (CHK-027 in every chapter), F392-03 (phone Chapter IX gauge card), F393-01 and F393-02 (the hidden chapter's feet and double images), plus the polish items F394-01 (Auron's coat) and F394-02 (first-menu downloads about 10 percent heavier, +14 to +16 MB; 6.37 GB to upload)
Milestone: not assessed
Quality: not scored (focused pass)
Targets: required 9 / matched 8 / failing 0 / unverified 1 / waiting 0 (the nine approved cast tiles whose hash sets the repairs re-pinned; Shiva not captured)
Top issues: F392-01 (major); F392-03 (major); F393-01 (major); F393-02 (major); F394-01 (polish); F394-02 (polish)
Coverage: the candidate rebuilt and served beside live 39.3's own bytes; the harness by real keys in Chapters V and XVII and I and IV (CHK-026 PASS in each, CHK-027 FAIL as on live); the hidden chapter board to results to board; the door at three sizes; the music in the real engine and the reduced browser proof; 20094 head-lock planes read over 21 real-key chapter visits; every gate (tsc, 229 targeted tests, verify-approved, art-derive, art-browser-load in Chromium and WebKit, qa --strict, the manifest diff). Reused: CHK-026 and CHK-027 for II, VII, IX, XVIII from the driver's runs on the same source. Not tested: the harness in III, VI, VIII, X to XVI, listening, real Safari, phone and pad, 4K, Shiva's tile, deployment verification
Next required review and why: Live verification of the exact artifact after the deploy (CHK-017: artifactHash fd7b1b89f2d9c7f3, bundle index-D57LJe-j.js, 2,070 files to upload), then the deep review owed on the live build: every chapter, the continuity harness again (III, VI, VIII, X to XVI have not had it on this build), the first-time-fan lens, the hidden chapter's feet and double images (F393-01, F393-02), and Bailey's ears on the title, Chapters I and XII and the board (CHK-B1) and his eye on Auron's coat (F394-01).
Elapsed review time / repeated work avoided: about 78 minutes of wall clock (13:14 to 14:32 EDT; the rebuild took 46.5 s, the continuity runs and the hidden chapter's fight took most of it); reused instead of rerun: the driver's phase-2 continuity of four chapters, the driver's phase-B tooling and records (the manifest was rebuilt and compared, not trusted)

## What was proved, in short

- **The head lock fixes the two chapters that failed.** Chapter V: CHK-026 PASS, worst registered head step 0.29 percent, 0 of 1102 registered swaps over 1 percent, Yuna's knock-out swaps x0.9994 to x1.0015 (39.2: x1.0405 and x0.9616); Chapter XVII: PASS, worst 0.24 percent, 0 of 1260, 22 knock-out swaps with a registered head, worst x1.0024 (39.2: x1.0334, x0.9698). Feet within 0.9 px. CHK-027 fails as on live (snaps, jerks and double images are the same crossfades and knock-out cuts).
- Chapter I: CHK-026 PASS, CHK-027 FAIL (0.97 snaps/min, 45 jerks of 40 px or more, 1 double images; 57.8 fps).
- Chapter IV: CHK-026 PASS, CHK-027 FAIL (0.16 snaps/min, 36 jerks of 40 px or more, 7 double images; 55 fps).
- **The lock is quiet.** Read from the stage after real attacks: 20094 planes held, 0 clamped, factors 0.9797 to 1.0174 (a figure's size moves by at most about 2 percent), at 1600x900, 2000x1012 and 390x844.
- **The door.** "leblanc" opens party prep and it holds (four ways of typing, three sizes); the first arrow after part of "leblanc" or "limit" moves the cursor; "limit" still opens FF7's chapter; wrong words, a pause and the near-miss do nothing; the board shows the eighteen. The hidden chapter's full run (victory, 80 turns) leaves seenCoach untouched and the experiments store at attempts 1, clears 1.
- **The music.** The title and the board loop in the real engine (loop points read off the nodes, 19 and 18 s past their loop ends and still playing); Chapter I plays the new Seymour take, Chapter VII the unchanged one; 26 cues decode to length, no click, no level jump; qa --strict 0 findings.
- **The art.** 2,063 repaired files, every one a stem of the approved install list and the same pixel size as before; verify-approved 807 / 0 / 0; art-derive verify and audit PASS; 3,346 of 3,346 images load in Chromium and WebKit. The rim edit is confined to the 1 to 3 px edge and the colour matches are right except Auron's coat (F394-01).

## Issues

- **F392-01** (major, both, every chapter (re-measured here: V, XVII, I, IV)): CHK-027 still FAILS in every chapter, as on live: pose changes snap, ghost and jerk (carried; the head lock changes none of it) [introducedByCandidate false, regressionVsLive false]
- **F392-03** (major, ffx, yojimbo-cavern (phone)): Phone, Chapter IX: the Zanmato gauge card sits over Yojimbo, Daigoro and Ginnem (carried; unchanged here) [introducedByCandidate false, regressionVsLive false]
- **F393-01** (major, ffx2, exp-leblanc (hidden)): Hidden chapter, CHK-026: the figures still slide their feet and change size at pose changes (carried; the head lock does not cover the chapter) [introducedByCandidate false, regressionVsLive false]
- **F393-02** (major, ffx2, exp-leblanc (hidden)): Hidden chapter, CHK-027: 226 of 642 pose swaps show a double image of 0.40 or more, with 49 jerks and 0.37 snaps a minute (carried) [introducedByCandidate false, regressionVsLive false]
- **F394-01** (polish, ffx, II, III, XVII, XVIII (Auron)): After the colour match, Auron's coat is uneven in cast, attack and victory: pale blotches, a two-tone coat, flatter fold shading
- **F394-02** (polish, both, every chapter (cold first load)): The base-size art a player downloads is about 10 percent heavier: 407 repaired poses ship as PNG instead of lossless WebP (disclosed)
- **F392-04** (polish, both, first menus (carried)): Text under the 14 px floor at the first menu (carried; the same elements as on live)
- **F393-06** (polish, ffx2, exp-leblanc (hidden)): The pre-battle scene's location label (pink caps, top left) crosses the pale window glow and reads at the edge of legibility (carried)
- **F393-07** (suggestion, ffx2, exp-leblanc (hidden)): Question for Bailey: after a Change the girl is drawn in the old painting beside the new-art figures (known, shipped as is; not re-tested here)
- **F394-03** (suggestion, both, chapter select (shared board)): The board's best-time read creates an empty chapter record in memory, and any later save (a HUD toggle, a setting) writes it into the main save

Verified fixed in this candidate: F393-03 (Typing the word skipped the hidden chapter's party prep (the last lett); F393-04 (After part of a word the first arrow press on the board was swallowed ); F393-05 (A hidden-chapter run wrote six coach hints and a timestamp into the ma).

## Checks

- CHK-001: PASS
- CHK-002: PASS
- CHK-003: FAIL
- CHK-006: PASS
- CHK-008: PASS
- CHK-009: PASS
- CHK-012: PASS
- CHK-013: PASS
- CHK-015: PASS
- CHK-016: PASS
- CHK-017: NOT APPLICABLE
- CHK-018: PASS
- CHK-019: PASS
- CHK-020: PASS
- CHK-021: PASS
- CHK-022: PASS
- CHK-023: PASS
- CHK-025: PASS
- CHK-026: FAIL
- CHK-027: FAIL
- CHK-B1: UNVERIFIED

## Evidence

- critic/reviews/55db51dd-focused.json (this report); the folder critic/reviews/55db51dd-focused/ holds continuity/ (the harness: Chapters V, XVII, I, IV), exp-route/ (the hidden chapter's run and its continuity), door/, door-2000/, door-phone/, word-probe/, exp-smoke/, music-loop/, audio-proof.json, others/ (first menus, head-lock counters and request lists), savewrite/, art/ (the comparisons and sheets), targets/ (the cast tiles beside the game), artifact-manifest-cand.json, logs/ (the build, the gates, the manifest diff), plan.json, scripts/ (every script used).
- Environment: headless Playwright Chromium on the GPU (PYREFLY_BROWSER=gpu, RTX 5070 Ti), Windows 11; vite preview of D:/pyrefly-r39-int/dist-gate (BASE_PATH=/, 127.0.0.1:5441) beside live 39.3's own bytes (dist-release, bundle Dk9resVW, 127.0.0.1:5442); 1600x900 (2000x1012 and 390x844 touch for the layout steps); seed 1.
- Servers: vite preview on 5441, 5442 and 5443 stopped by PID, ports closed.
