# Critic round 19: deep review of the release 36 candidate 8aee1e69

```text
Build / artifact / target version: main 8aee1e69efe1a1cd6b3231661090dd5c6b0cc064 (bundle index-DU_vcl-u.js), artifact 4ede98e2358a3cd47c989d41732eddb35f7d897add51de1e7225665c03b1a28c (1,431 files, 798,846,029 bytes, dist-gate in D:/pyrefly-rel26c), targets.json sha256 650de885de231e5b957833d09c9c60412fa9573325fd732f1d8f1bbd48f1263f
Review: deep (round 19; save-data class before deploy, plus the deep debt carried from ef3f6bbf)
Deployment: NOT APPLICABLE (candidate, not deployed; CHK-017 owed after any deploy)
Changed area: FAIL (PR-0307 and PR-0312 regress against live under the colossus masters; PR-0309 and PR-0314 in the new dressphere shot; the EYE CANDY page, its save upgrade and the art install pass)
Ship: HOLD. PR-0307 (major) is a regression against live 35: Yunalesca's colossus master shows the plate edge and a void. If it is fixed, the release discloses PR-0148, PR-0308, PR-0269, PR-0310, PR-0309, PR-0311, PR-0099, PR-0270, PR-0222
Milestone: not assessed
Quality: provisional (audio UNVERIFIED: no ear verdict). Categories: combat 9.2, encounter 8.9, visual 8.7, feel 8.1, narrative 8.9, audio UNVERIFIED, interface 8.5, onboarding 8.6, prep 9.1, delivery 8.5. Bailey's visual sub-scores: character models 7.9, enemy models 7.6, animation 6.9, fidelity 8.0, camera 7.6
Targets: 87 required / 69 matched / 1 failing / 17 unverified / 6 waiting on decision
Top issues: PR-0307 (ship-blocking regression, Ch II plate edge), PR-0148 (no ear verdict), PR-0308 (Bushido/Swordplay ignore the Overdrive), PR-0269 (Sin real-key losses), PR-0310 (interpenetration), PR-0309 (dressphere shot over faces), PR-0311 (Yuna Thief placeholder); details below
Coverage: tested all 18 chapters by real keys (15 won through aftermath and reload), the 24-case save upgrade matrix from real r33-r35 saves, the EYE CANDY page by keys/mouse/touch, the MAX mix in motion, rotating shapes; reused the r34 pause closures and front-end tiles with dependency arguments; not tested: XIII/XVII/XVIII win paths, single-lane frame time, pause pointer re-check, gamepad, non-Chromium browsers
Next required review and why: a focused review of the fixed candidate (PR-0307, with PR-0312) on Ch II at four aspects against live 35 and every colossus chapter at rest, reusing this report for the save class; then the live review (CHK-017) after a deploy
Elapsed review time / repeated work avoided: About 200 minutes wall clock (15:03 to 18:25 local): capture 95 min, six auditors in parallel (28-85 min each), gap pass about 50 min, confirmer about 30 min, chief about 25 min. Repeated work avoided: front-end tiles, the pause cue and the PR-0264..0284 closures were reused with dependency arguments.
```

## Score output (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, narrative, interface, onboarding, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 10 critical or major issue(s) remain open
  - encounter ffx2-trema has no complete real-input flow
  - encounter sin-fins-core has no complete real-input flow
  - encounter sin-face has no complete real-input flow
  - 1 required target(s) failing
  - 17 required target(s) unverified
  - 6 required target(s) waiting
  - only 69 of 87 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
  - human judgment not recorded: Feel: the held Overdrive shot, the dressphere shot and twirl keys, breathing and KO collapse in play (CHK-B2)
  - human judgment not recorded: Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
  - human judgment not recorded: Visual: the colossus scale and camera (D-316) in the running game against the picked option C stills, including whether Yunalesca should be a colossus at all (PR-0307)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
  - human judgment not recorded: Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
  - human judgment not recorded: Delivery: ship source maps or free 22.7 MB for the waiting art (PR-0328)
  - human judgment not recorded: Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270)
  - human judgment not recorded: Overdrive inputs: which button order to use for the Bushido sequences, given D3 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## Verdicts

- **Deployment: NOT APPLICABLE.** Candidate review; 8aee1e69 is not deployed. CHK-017 is owed by the live review after any deploy.
- **Changed area: FAIL.** FAIL: the MAX mix regresses Ch II's approved backdrop composition against live (PR-0307) and puts bosses under HUD cards (PR-0312, also a regression); the new dressphere shot breaks CHK-008 at 1600x900 (PR-0309) and usually plays as a 0.5 s flash (PR-0314). The EYE CANDY page and its save upgrade pass (CHK-024, CHK-015, CHK-020, CHK-021); the art install renders correctly with every protected file intact (CHK-013).
- **Milestone: not assessed.** A deep review does not assess the milestone.
- **Ship: HOLD.**
  - HOLD: PR-0307 (major) is a regression against the live build. Yunalesca's Chapter II battle shows the painted plate's edge and a void at every tested aspect, where live release 35 fills the frame. The D-316 colossus master introduced it, and it plays by default because CHAPTER FRAMING ships ON.
  - Smallest path to SHIP: take yunalesca out of the COLOSSUS set (masters.ts:25), or clamp every colossus to its plate. Then run a focused re-check of Ch II at 1600x900, 2000x1012, 2560x1440 and 2560x1080 against live 35, with the same evidence reused for everything else. An owner override could also release it, but only by Bailey's own words.
  - The save-data class passes. CHK-024 held in all 24 upgrade cases, with saves written by the release 33, 34 and 35 artifacts themselves; the one harness "fail" is its own empty-seed expectation. No progress-loss, crash or lock was found, and no critical is open.
  - PR-0312 (the cards fading over Bahamut while a menu is open) is also a regression against live. It is graded polish, so it does not hold on its own; it shares PR-0307's cause and belongs in the same fix batch.
  - Disclosed if the build ships after the fix (majors that are not regressions): PR-0308, PR-0269, PR-0310, PR-0309 (inside the new DRESSPHERE SHOT), PR-0311, PR-0148, PR-0099, PR-0270 and PR-0222.

### Majors this release must disclose (once PR-0307 is fixed)

- PR-0148: (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (V0 encode, SFX b)
- PR-0308: (new finding, pre-existing code; R19-CE-01, confirmed in the engine and by real keys): Bushido and Swordplay ignore the Overdrive chosen. Every Bushido shows one invented 7-input sequence, and every Swordplay tier has the same zone and speed
- PR-0269: (carried, narrowed by the confirmer): the advisor line loses Chapter XVII; Chapter XVIII is unreliable on it (1 win in 3 real-key runs across rounds 18 and 18b)
- PR-0310: (carries VP-1001-02 from the 2026-10-01 visual pass; R19-VIS-03): party and boss still interpenetrate at rest under the new colossus masters
- PR-0309: (new; R19-VIS-02): at 1600x900 the new DRESSPHERE SHOT puts the enemy HP bars and SCAN tags over a girl's face and cuts a neighbour's head at the frame top, while the girl who changes stands small
- PR-0311: (new finding, pre-existing art gap): Yuna's Thief dressphere renders as a translucent purple placeholder mannequin, now framed in close-up by the dressphere shot and kept for the rest of the fight
- PR-0099: (carried, STALLED; count corrected): nine chapter rows in THEMES.md still play a stand-in cue, Chapter XV included
- PR-0270: (carried; owner-gated switch unchanged): TEXT SIZE grows nothing in the FFX-2 battle HUD
- PR-0222: (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

## The ten categories

### combat: 9.2

[combat + encounter auditor, deep round 19, PRODUCTION CANDIDATE main 8aee1e69 from D:/pyrefly-rel26c, not deployed, so deployment is NOT APPLICABLE. I opened no browser, started no dev or preview server and listened on no port, so there was nothing to stop. The only processes I started were vitest runs in D:/pyrefly-rel26c, and all of them have exited. Scratch is in D:/Final Fantasy/critic/rounds/round-19/combat/.]

WHAT CHANGED IN COMBAT. Against live ef3f6bbf, git diff is empty for src/battle, src/data, src/engine/tactics, BattlePresenter* and research. The release-36 changes are presentation only: the MAX mix (D-316), the EYE CANDY page (D-317) and the art. The mix modules import nothing from src/battle, and none of them awaits a presenter beat:
- heldShots.ts writes only the camera;
- twirl.ts plays inside the 0.8 s flourish beat;
- in vis-ffx2-bahamut-2000x1012, the spherechange phase starts at 435 ms or earlier and its action-end is at 766 ms.

The deep debt carried from f302f163, 25faec70 and ef3f6bbf contains combat changes that no deep review has seen: od2 to od6, PR-0267, D-310/311/312, the Blitz Ace Last Hit and the PR-0269 race term. 25faec70-focused said they were 'evidenced by tests ... and go to the deep review'. So I audited them here.

DATA AUDIT, every changed value against research:
- ffx-combat-core §5.3, §5.5 and the input-rules note Q1 to Q3.
- Fail rows: DF 16x1, SS 24x1, BB 28x1, Tornado 15x1 (rank 6); Spiral 24x1, S&D 8x3, ER 20x1, Blitz 4x8 (rank 6).
- Immune rows 19/27/30; Tornado has none.
- Every fail and immune row carries no status and no Delay (Q3a [verified: 5 sources]); crit-eligible is kept (Q3b).
- Blitz Ace finisher 24x1 on success only, and the fail row drops it.
- Tornado timer 3000 (D-312, GameFAQs); the others 4000; Swordplay timers 3000/3000/2600/2200.
- A failed Swordplay or Bushido earns timing bonus 0.
- All match (od-rows-probe.json).

RULES ON THE REAL BOARDS (od-rows-probe.json, seeded A/B through the real engine, every first-link enemy of 11 FFX chapters):
- Clean/failed damage ratios match DmgCon: Omnis SS 555/493 = 27/24, DF 391/329 = 19/16, Tornado 411+407 vs 308.
- Per-target immune rows work: Macalania DF gives Seymour 1100 vs the guardians 984/976.
- Banishing Blade on partly immune Omnis takes the success row, and only Armor and Mental Break land (D-310).
- Failed rows land no rider.

CHK-023 FIDELITY: I replayed all 14 single-link FFX real-key logs of round 19 through the pure engine at their recorded seeds (ffx-replay.json). Eleven are event-for-event identical, outcome included:
- Ch I: four runs (win, win-keys, loss, phone);
- II, VI, VIII, IX, X, XII and XVIII.

The three retry-seed rows diverge by design: each log holds attempt 1 only. The identical logs include the failed Shooting Star (Omnis, Yunalesca, Sin) and the failed Dragon Fang (Sin). So the fail path runs in the real runtime.

UNIT SUITE: I ran a 318-file combat subset: chapters/*, ffx2/*, ffx-*, ffx2-*, advisor-*, strategy-*, data-*, status-*, battle-*, chain-* and others. Result: 315 passed, 3 skipped; 5,339 tests passed, 31 skipped, 0 failed (vitest-combat-subset.txt). Eleven targeted Overdrive and checkpoint files, 117 tests, all pass (vitest-od-targeted.txt). They sample:
- CTB ticks, locks and ranks; Haste and Slow; statuses including Zombie; Breaks; Overdrive modes;
- ATB speed, golden, Active and Wait; chains; spherechange; Steal.

GAINS:
- PR-0267 is FIXED in the engine. Failed bonus = 0 (probe and ffx-bushido-fail-bonus).
- A wrong press now resets to input 1 instead of aborting (sourced Q1; ffx-bushido-wrong-press-reset).
- Fail, Immune and finisher rows are now sourced and wired.

NEW MAJOR, pre-existing: R19-CE-01.
- Every Bushido shows the same invented 7-key sequence.
- Every Swordplay tier has the same zone and speed.
- The engine's params never reach the overlays (od-params-probe.json).

CARRIED: PR-0269 (major), PR-0273 (polish; the engine still offers disabled pull-back/close-in at link 3, link3-rows.json), PR-0217 (suggestion).

The engine gains roughly offset the newly found input-fidelity major, so the score holds at round 18b's 9.2. I state that as the reason. It is not a reward for the gains, and it is not a penalty for something only now discovered.

Chief: kept at 9.2. The confirmer re-ran od-params-probe and the Bushido/Swordplay finding (PR-0308) stands at major; the gap pass proved the Swordplay mis-press restart and a Bushido success by real keys (gaps/swordplay-sin-fins-core-2000x1012-s1, gaps/bushido-yunalesca-1600x900-s1).

### encounter: 8.9

SEEDED THREE-LINE BENCH, re-run on the candidate (ffx-three-line-r19.json). Harness carried from round 18, only the paths changed. Intended, advisor (v3 card, options {}) and mash lines; seeds 1-40 plus the same 40 large seeds; 9 FFX chapters plus the live seeds.

47 of 53 rows are byte-identical to round 18. The six that moved are explained by the od fixes and the race term:
- Yunalesca advisor: 37 to 38 of 40, and large40 36 of 40.
- Evrae large40 intended: 39 of 40, median turns 69 to 70.
- Sin face advisor: 10 to 15 of 40, and 7 to 13 of 40 on large40. That is 28 of 80 (35 %) against the intended line's 19 of 80. The race term is a measured gain.

Chapter XVII advisor card, chained links 1-3 (sin-fins-advisor-r19.json): 3 of 40 (v3; the handoff said 1 of 40). Of the losses, 22 come at link 2 (Right Fin Ram/Smack), 2 at link 1 and 13 at link 3, and the link-3 checkpoint (D-284) now retries the link-3 losses there (unit tests sin-checkpoint*, which pass).

FFX-2 benches in the subset run (unchanged engine; the FFX-2 battle diff since round 18b is empty):
- Den link 1 intended 199/200, wrong 16 and 8 of 200;
- Fallen Aeons chapter 174/200 at bench pace and 164/200 at human Wait split;
- Ixion sensible as built 197/200;
- Leblanc 40/40 at D=0;
- Bahamut and Vegnagun strategies win seeds 1, 7 and 42;
- Trema link 1 (Oversoul Paragon) 26/200 at bench pace and 28/200 at human pace.

REAL-KEY OUTCOMES (capture owner, run.json attempts):
- Wins: I (73 turns, twice), II, III (220 turns, all 7 links), IV (47, three sizes and inputs), V, VI, VIII, IX, X, XI, XII, XIV, XVI, and LeBlanc seed 2.
- Losses: XIII 0 of 8 (seeds 1/1001, 2/1002/2002, 3/1003/2003). Every loss was at link 1 (Paragon), which fits the 13-14 % bench rate (P(0/8) is about 0.3).
- XV: 1 of 4 (1003 won).
- XVII: 0 of 2, both lost on link 2.
- XVIII: 0 of 2.

Round 18 also had XVII and XVIII at 0 of 2, so this is no regression. The harness also fails every Swordplay/Bushido input (minigameConfirm Enter after 3 s, correctInputs 0), which understates human damage in the Sin races.

Canonical tactics are not penalised. Gains: the Sin link-3 checkpoint (adopted D-284), the race term, and the fixed Bushido failure semantics. The real-key Sin and Trema routes have not improved. Carried: PR-0279, PR-0257 (III at 220 real-key turns), PR-0280 (XII bench identical: 24/40 and 18/40), PR-0306 and PR-0227. The measured gain on XVIII lifts the category by 0.1.

Chief: kept at 8.9. The confirmer re-ran the Sin benches (28/80 XVIII advisor, 3/40 XVII) and one real-key XVIII route (defeat in 65 turns, as reported).

### visual: 8.7

[Visual and targets auditor, deep round 19, PRODUCTION CANDIDATE main 8aee1e69 (D:/pyrefly-rel26c/dist-gate, 1431 files). Not deployed, so the deployment verdict is NOT APPLICABLE.] I opened no browser and started no server, so no port needed closing. Every judgment comes from the capture owner's round-19 evidence: headless Chromium, PYREFLY_BROWSER=gpu (910 of 934 index records say mode gpu), at 1600x900, 2000x1012 and 390x844 touch. My working files are under D:/Final Fantasy/critic/rounds/round-19/visual/ and /targets/.

HOW I CHECKED IT
- PROTECTED ART: hashcheck-candidate.json and verify-approved.json. Approved 543/543 and judge-locked 48/48 are byte-identical in dist-gate. verify-approved (ROOT=D:/pyrefly-rel26c) gives 591 ok, 0 mismatched, 0 missing.
- CHANGES SINCE LIVE ef3f6bbf: 85 shipped files changed, 163 added, 4 removed (bundle and .nojekyll).
- AUTHORISED REPLACEMENTS: 24 locked paintings changed hash, all moved to set bailey:2026-10-02-art. Pterya's idle and attack in the judge-locked list also changed, with supersedes records (commit ad0b8973). All are covered by D-322 to D-328 (Bailey 2026-10-02: "All your recommendations").

MOTION
- Breathing: idle figure crops move about 4 px over 1.3 s at full motion (shift.mjs). Under REDUCE MOTION the best shift is 0 px; the remaining MAD of about 5 is grain and particles.
- Held Overdrive shot (FFX, Kimahri): a gentle push while the picker is open, then a Jump splash crop of his painting. Under REDUCE MOTION it is one static frame.
- Dressphere shot (FFX-2): plays the painted twirl keys in 5 chapters, in this order: close on the girl, her ribbons, the new dressphere manifesting. About 0.9 s, cut short when a girl's menu opens, as designed. Under REDUCE MOTION it is one static cut to the new dressphere (st-dressphere-2000.jpg, st-spherechange-chapters.jpg, st-rm-shots.jpg).

FOR
- Colossus masters give Natus (about 470 px at 1600x900), FFX-2 Bahamut, Yojimbo and Braska's Final Aeon real boss presence (cmp-mid-r18-r19-*.jpg, st-colossus-rest.jpg).
- KO paintings now sit at party scale. This fixes the round-18 'giant KO' look (VP-1001-05).
- The new art renders correctly in battle: Valefor's and Pterya's whole wings, Yu Yevon at a matched size, the twirl keys, and Kimahri's new plates and portraits (st-newart-links.jpg).
- Depth of field and fog add depth without blurring the actors.

AGAINST
- R19-VIS-01: Yunalesca's colossus master shows the backdrop plate's edge and black void at 2000x1012.
- R19-VIS-02: the 1600x900 dressphere shot puts the enemy HP bars over a girl's face and cuts a neighbour's head at the frame top.
- VP-1001-02 is carried: party and boss still interpenetrate at rest in Yunalesca, FFX-2 Bahamut, Evrae and Macalania.
- Polish: R19-VIS-04 to -08.

SCORE
8.7: above the visual pass's 8.6 on release 33, because KO scale, presence, idle life and the spherechange keys improved. Still below 9 because two new framing defects were introduced and the interpenetration major is still open. Gain for this category is counted only when a major closes.

BAILEY'S FIVE SUB-SCORES (provisional, motion included)
- Character models 7.9 (7.6 on 10-01): KO scale fixed, party re-rolls and twirl keys on model; crowding remains.
- Enemy models 7.6 (7.1): colossus scale and whole wings; Bahamut's head is washed out, Flux's crown is clipped, the white rim fringe remains.
- Animation 6.9 (6.2): breathing measured, twirl keys and held shots built; crossfade ghosting in the twirl; KO collapse not captured.
- Fidelity 8.0 (7.9): Yunalesca's void and Bahamut's bloom offset the SMAA, depth of field and fog gains.
- Camera 7.6 (7.5): colossus masters and the held shots honour menus and REDUCE MOTION; the Yunalesca plate edge and the dressphere-shot framing pull it down.

FEEL is not scored by me. The motion facts above are offered to the feel auditor.

Chief: kept at 8.7. The confirmer and the gap pass both reproduced R19-VIS-01 (now PR-0307) and showed it is a regression against live release 35 at 1600x900, 1920x1080, 2000x1012, 2560x1440 and 2560x1080. The auditor had already counted it as an introduced major. The gap pass also found Yuna's Thief dressphere is a placeholder mannequin, now framed in close-up (PR-0311, pre-existing art gap); it is filed but does not move the number further, since the auditor's score already sits below 9 on two new framing majors.

### feel: 8.1

[feel auditor, deep round 19. Candidate: main 8aee1e69, built from D:/pyrefly-rel26c (dist-gate), not deployed. I worked only from the capture owner's evidence in critic/rounds/round-19/evidence: headless Playwright, PYREFLY_BROWSER=gpu, mode 'gpu' in every run.json. I opened no browser and started no server, so I had no port to close. logs/servers.log shows the capture owner's 5911-5913 servers stopped with 'listening now: 0'. My only command in the worktree was 'node tools/critic-plan.mjs --json'. git status was '?? dist-gate/' before and after. Scratch is in critic/rounds/round-19/feel-narr/: 152 contact sheets, lum.py/lum.json, dbox-all.txt, entry.cjs, firstmenu.cjs, pace.cjs, critic-plan.json, ixion-sc-zoom.jpg and x2-enemy-hit-during-menu.jpg.]

BASELINE: the last deep score was 8.3 (round 18b). The 2026-10-01 visual pass scored feel 7.9 provisionally, judged in motion on release 33. I score against that motion-based standard, as the brief asks.

GAINS ON THIS BUILD:
(1) FFX-2 now has a spherechange moment. VP-1001-01 and VP-1001-15 (the 0.47 s white card) are largely closed.
- At 2000x1012, the painted twirl keys read inside the 0.8 s beat: twirl start/going at 435 ms, ribbons at 597 ms, Black Mage landed by 766 ms (vis-ffx2-bahamut-2000x1012/seq-dressphere-shot; cap/sh-ds2.jpg).
- The close shot hands back before Paine's menu opens at 955 ms. The D-316 gate 'never while a girl's menu is open' held in both vis runs.
- Under REDUCE MOTION it is one static cut with no keys (vis-ffx2-bahamut-1600x900-rm f01-f03).
- An enemy lunge during Paine's open menu is a figure move, not a cut: the background is fixed in x2-enemy-hit-during-menu.jpg.
(2) FFX Overdrive resolve reads well (vis-seymour-flux-1600x900/seq-overdrive-resolve).
- The 'OVERDRIVE Jump' slab hangs high and clear of the party.
- The splash crop slams in at about 0.7-0.9 s and the hit lands at 2.15 s.
- Under REDUCE MOTION the hit lands at 1.34 s, with letterbox and no drift.
- The move name is right (VP-1001-16 did not recur for Jump).
(3) No hit blackout. In 149 timed sequences (230-350 ms per frame), no frame is darker than 45 % of its sequence median (feel-narr/lum.json). That is consistent with D-316's 0.43 s FFX blackout gate. The sampling can miss anything under about 0.3 s.
(4) The MAX mix adds no time. Same seed and same turns give the same wall time per turn as round 18:
- Flux 6.15 -> 6.22 s
- Yunalesca 5.20 -> 5.22 s
- Anima 6.13 -> 6.19 s
- Natus 4.52 -> 4.47 s
- Isaaru 7.59 -> 7.64 s
- Yojimbo 6.51 -> 6.53 s
In-game time to the first menu is unchanged or slightly lower in all 15 comparable chapters (firstmenu.cjs).
(5) PR-0285 is repaired as observed.
- Hastega now builds one cumulative line, ending 'Tidus, Yuna and Kimahri were hasted.' by 1.95 s.
- 'Yuna became a Zombie.' shows about 0.53 s after the Lance hit (seymour-flux-win seq-party-action and seq-action-playing).
- Round 18b measured 3.3 s and 5.26 s.
(6) PR-0244 is closed (shipped in releases 34-35). The Ch VII aftermath narration 'He went down on one knee' plays over Seymour's kneel painting (seymour-anima-macalania-win/33-after-confirm-scene.png).
(7) Skip and pause are respected. Esc over every pre-scene opens pause, and one hold skips, in 27 of 27 runs. Every win's CONFIRM scene hold-skips to the board.

LOSSES AND OPEN:
(a) New, R19-FN-01: the dressphere close shot can hold through an enemy action. In Ch XVI, Ixion's hit on Paine (363) lands inside Rikku's close shot with Ixion off camera, and a 783 numeral floats at the frame edge.
(b) PR-0104 still reproduces. In Ch IV, Rikku's cut-in and menu come first, and the Shell visual arrives about 2.36 s after the sequence starts.
(c) PR-0061 (entry length) is not improved.
(d) Not reachable or not measured, so no credit: the FFX Overdrive hero shot during a timed input (the 'held shot' capture is the Overdrive submenu at master framing; Kimahri's Jump has no timed input) and breathing at a rate that shows motion.
(e) Also not measured: KO collapse in motion, the FFX-2 seam control-return regression PR-0301 under the new framing masters, input latency, and Bailey's verdict (CHK-B2).
(f) Cross-reference, scored under visual: the Den post-seam master puts Yuna's head under the guide card (24-seam-2-first-menu.png), and the KO body under Tidus's panel (FR-35-02) is still present.

BAILEY'S SUB-SCORES, my two, provisional: animation 6.9 (pass 6.2: twirl keys, splash crops and KO collapse are gains; VP-1001-06 hit timing and pose ghosting were not re-measured) and camera 7.8 (pass 7.5: held shots are coherent cuts, colossus entries for Natus and FFX-2 Bahamut are stable dollies; minus R19-FN-01). Character models, enemy models and fidelity are the visual auditor's.

WHAT COUNTS AS A GAIN HERE: an approved remedy with measured motion evidence. The spherechange beat qualifies. The off-camera action is a small offset. Net: 7.9 (motion pass) -> 8.1.

Chief: kept at 8.1. Gap-pass evidence moves both ways and roughly cancels. For: the OVERDRIVE SHOT holds through a real timed input and returns the frame the slab closes, normal and REDUCE MOTION, rAF max 16.8 ms; KO collapse plays in motion (FFX-2 about 240 ms, REDUCE MOTION a cut); FFX-2 key-to-row latency 0.9-1.4 ms. Against: the DRESSPHERE SHOT meets its 1.6 s hold in 1 of 12 changes and is absent in 6 of 12 and on the phone (PR-0314). R19-FN-01 (PR-0313) did not reproduce in 12 more changes, so it stays polish at low frequency.

### narrative: 8.9

[narrative auditor, deep round 19, candidate 8aee1e69] Dialogue timelines come from the dboxTimeline in 27 run.json files (feel-narr/dbox-all.txt, built by dbox.cjs). Scripts were read from D:/pyrefly-rel26c/src/story.

WHAT CHANGED: git diff ef3f6bbf..8aee1e69 touches nothing in src/story, the cutscene screens, BattleScreenFlow or research. The MAX mix is battle-only: it is bound and released with LivingPaintings and never touches CutsceneStage. Since the last deep candidate (f302f163), the only story changes are the D-301 kneel and fall staging for Seymour (Ch VII) and the kneel paintings for Isaaru and Shuyin, which shipped in releases 34-35.

GAINS AND HELD:
(1) 15 chapters reach their aftermath by real input on this build: I, II, III, IV (desktop and 390x844 touch), V, VI, VII, VIII, IX, X, XI, XII, XIV, XV and XVI, in both games. Each goes results -> CONFIRM scene -> board -> reload. Examples:
- I: 'You can't send what refuses to go.' to 'Then I stopped counting.'
- II: 'There. Now no one can summon it.' to 'She looked lighter than she had in weeks.'
- III: 'Is that it? Did we-' to 'I left in the part where she kept walking.'
- IV: '...Yunie.' to 'No arguing! This is a Brother order!'
- V: 28 lines to 'Rikku talked the whole way. I let her.'
- VI: 'That's for robbing our airship!' to 'Keep it. It suits you.'
- XV: 'Enough. Let them rest.'
- XVI: the fall, Shuyin's 'Lenne.', Baralai, Gippal's 'Take care of things topside.', 'I'm all alone.'
(2) Ch VII's aftermath now stages what it narrates: Seymour kneels on the plate under 'He went down on one knee. The hall was very quiet.' PR-0244 is closed; its staging half is credited under feel.
(3) Tone per game holds. FFX is elegiac and short (Natus's narrated campsite, Isaaru's 'I'm sorry, Isaaru'). FFX-2 is quick and warm, with Leblanc's flourish restored by design and Ch IV's results silent per writing-bible §5.4.
(4) Six '30-post-scene' captures were flagged UNVERIFIED (screen=results). I traced them to scripts, not to a defect. In I, II, VII, VIII, VI and XVI, every post script puts results() before its first line. seymour-flux.ts:146-150 is music(null), camera('victory'), beat(1200), results(). The authored aftermath plays after CONFIRM, and 33-after-confirm-scene captured it in every one of those chapters.

OPEN, UNCHANGED SCRIPTS (observed again here):
- PR-0254: Ch VII Talk at fight ms 4371 and 22724 produces no line.
- PR-0255: Tromell's 5 lines still have speaker ''.
- PR-0262: '...Okay. Next one.' is the results quip in I, II and VIII again.
- PR-0256: Ch XVI whistles are '' captions.
- PR-0272 is carried and was not re-observed.

NOT REACHED THIS ROUND:
- XIII: lost on all 8 seeds.
- XVII and XVIII: lost twice each, with the same turn counts as round 18.
Their aftermath content is reused from the round-18b gap pass (dependency argument in 'reused'). Reachability on this build stays UNVERIFIED under CHK-022.

The harness hold-skips every scene after 2-4 lines, so natural reading pace is unmeasured. Bailey's story read (CHK-B3) is not recorded. Net: 8.9 held.

Chief: kept at 8.9. The capture owner's "post-battle scene runs at one line per frame" major was REFUTED by the confirmer: the route held Enter (550 ms hold-to-skip) after results; with no input, Ch II and Ch XVI post lines type at about 47 ms per character and wait 145-147 s for input. The narrative auditor had already traced the six 30-post-scene UNVERIFIEDs to results() coming first in those scripts.

### audio: UNVERIFIED (no number)

[Audio auditor, deep round 19. Candidate: main 8aee1e69, bundle index-DU_vcl-u.js, built in D:/pyrefly-rel26c/dist-gate. Not deployed. Live is release 35, ef3f6bbf.] I cannot hear and listened to nothing. Everything below comes from offline decoding, the repo's audio tools, and the capture owner's runtime evidence (critic/rounds/round-19/evidence, GPU mode, 27 runs with an AudioManager log). I opened no browser.

WHY NO SCORE: docs/audio/OWNER-VERDICT.md was last changed on 2026-09-29 (5e5ef411). It is identical in rel26c and in main. None of its entries gives a number. The music now shipping is v2 (D-302) and the SFX are v2 (D-303). Both were adopted on recommendation ('I'll go with all your recommendations'), not scored by ear. D-307, D-308 and D-309 are ear questions, still proposed and unanswered. Under RUBRIC section 6 and CHK-B1 the category is UNVERIFIED. It is neither averaged away nor scored zero.

WHAT CHANGED SINCE LIVE: no audio files changed. `git diff ef3f6bbf 8aee1e69` touches nothing in public/audio, src/audio, tools/audio or docs/audio. All 29 files in dist-gate/audio are sha256-identical to the live artifact (critic/artifacts/ef3f6bbf.json) and to public/audio. The only audio code added is three new SFX calls on the EYE CANDY page: cursor-move twice and cancel once. Both keys already exist and fire in play. None of the new visuals code (src/engine/fx/mix/*, held shots, twirl keys, KO collapse) calls audio or changes the beat timing the SFX play on. The SaveData.ts change only adds the fxParts fields; volume handling is untouched.

TECHNICAL: PASS.
- `node tools/audio/qa.mjs --strict` exits 0: 0 cue findings and 0 SFX findings.
- The 26 music cues measure -16.00 to -16.21 LUFS and -1.08 to -3.06 dBTP, with 0 clipped samples. Every loop seam and flux/tilt gate passes.
- The v1 sprite has 134 cues and peaks at -1.13 dBTP. The v2 sprite has 100 cues and peaks at -1.12 dBTP.
- Total shipped audio is 88.49 MB of the 90 MB budget (D-306).
- An independent ffmpeg 9.0.1 decode of all 28 MP3s found 0 errors.
- ebur128 spot checks: title, chapter-select, pause, boss-yu-yevon, boss-shuyin, boss-ffx2-aeon and victory-ffx2 all read -15.8 to -16.0 LUFS at a true peak of -1.1 to -1.7. sprite-v2 reads -18.5 LUFS at -1.1.
- Stereo, re-measured because the v2 music invalidates round 18's figures: L/R correlation is 0.643 to 0.796 and mono-sum loss is -0.49 to -0.91 dB. There is no phase or hollowness signature.

THEMES: themes-audit agrees with all 18 chapter rows. The same 4 cues depart from the bible: three have no tempo map (PR-0039) and scene-macalania-temple has no row (PR-0260). Nine chapters still play stand-ins (PR-0099). The table still breaks after the XVI row (PR-0278).

ROUTING (CHK-023): PASS on the reached scope.
- 200 AudioManager samples. All 138 samples with music playing come from 'prerendered'. Both sprites were decoded in 200 of 200 samples. Nothing was muted.
- Requests: 207 audio requests, 0 not found, 0 console errors.
- Scene and battle cues match the cue map in all 18 chapters.
- Chain seams hold their cue at +0, +1.5 and +3 s: V seams 2-5, XI 2-3, XIV 2-3, XV 2-3, VI 2-3, XVII 2, and III seams 3-7, where boss-jecht hands over to boss-yu-yevon.
- Chapter III has about 60 s without music: from Jecht's fall (about 742 s), through seam 2, to the end of the 'valefor-enters' scene. That silence is authored: jecht-falls and valefor-enters call music(null), and the Valefor link carries track null (PR-0129).
- Results cues: victory-ffx after all 9 FFX wins and victory-ffx2 after all 5 FFX-2 wins (V, VI s2, XI, XV s3, XVI). Chapter IV's results are silent, as authored. ending-ffx is requested after III and ending-ffx2 after V. Every loss has silent results, since the map has no defeat cue.
- SFX game voice: the v2 game is ffx in all 12 FFX runs and ffx2 in all 15 FFX-2 runs.
- 13,110 SFX log entries: 12,735 via v2, 348 via sprite, 27 via synth.
- The SFX mix reads {b, trim 1, bus 0.70} in every run.

ONE FINDING (minor, carried from live, not introduced): every one of those 27 synth plays is the title's press-start 'battle-start' (TitleScreen.ts:195), played about 0.1 s after the AudioContext is created and before either sprite can decode. The first sound of every session is the procedural synth, the timbre Bailey rejected as 'arcade-y'. The same entry appears in the r34 and r35 focused-review logs.

SAVE, audio half of CHK-024: PASS.
- 24 of 24 cases have the mixer equal to the settings.
- Saves from the release-33, 34 and 35 artifacts kept 0.8/0.7/0.7 (fresh) and 0.55/0.4/0.5 (hand-made).
- Fixtures 33, 34 and 35 kept their own levels. The 31a fixture's 0.2 SFX level was kept and its marker set.
- The missing, truncated and not-JSON cases fall back to 0.8/0.7/0.7.
- The one failing case, fresh-profile, fails on whole-save creation diffs, not on audio.

REUSED with a dependency argument: the pause cue playing and handing back to the battle cue, and the title and chapter-select samples, all from round 18's gap pass. pauseMusic.ts is unchanged since 65152c1b. AudioManager's only later change, dac3bff5, touches no music, duck, track or fade line. pause.mp3, title.mp3 and chapter-select.mp3 are byte-identical to round 18. The PauseScreen changes are page navigation only. pause.mp3 was requested in all 27 runs this round.

SERVERS: I started none. Get-NetTCPConnection shows no listener on ports 5400 to 5990.

Chief: UNVERIFIED, no number, per RUBRIC section 6 and CHK-B1: no ear verdict exists for the shipped music v2 and SFX v2. Technical health and routing pass; no audio file changed against live.

### interface: 8.5

Deep review round 19 of main 8aee1e69 (production candidate, dist-gate from D:/pyrefly-rel26c). I judged only the capture owner's evidence in D:/Final Fantasy/critic/rounds/round-19/evidence: index.json (934 records, 780 harness-verified), the run.json files, the logs and the frames I opened. All captures used headless Playwright with PYREFLY_BROWSER=gpu at 1600x900, 2000x1012 and 390x844 (touch). There are NO 1280x960, 2560x1080, 2560x1440 or 3840x2160 captures, so the rotating deep shapes are uncovered (see capturesNeeded). I opened no browser and started no server, so I had no port to close. Contrast figures are estimates from the JPEG/PNG pixels (99.5th-percentile glyph luminance against the 30th-percentile background), made with my scratch script critic/rounds/round-19/zz-ifaudit-contrast.tmp.py.

WHAT HOLDS OR IMPROVED (both games):
- Advice is legal and reachable. All 27 chapter runs show 0 card-vs-command overlap at the first menu and an advisor minimum of 14.2 px effective on desktop (15 px on the phone), with 0 clipped rows. There are 0 target mismatches in every desktop run. The two exceptions are not product defects: the Leblanc seed-1 harness stall the capture owner records, and the phone Ch I run, where the harness cannot page Items to Poison Fang (the known FR-34-02). Each card names its submenu and cost, e.g. 'GUIDE'S PICK IN WHITE MAGIC 10 MP 100% TO HIT'.
- Intent stays honest and separates the certain from the conditional: 'SCRIPTED', 'Most likely 83% ... Thundara 17%', 'Lands on one of these, picked when it acts.' (ffx2-ixion-djose-win, ffx2-bahamut-*).
- Real input works in all runs. Esc and P open and close the pause. N hides the advisor; E and G toggle the intent and the guide. A target cancel returns to the menu with 0 targets left.
- Fixes from releases 34 and 35 are confirmed in this round's frames:
  - PR-0275: the board shows 'Sin: the Fins and the Core' in full, and the numeral strip fits (sin-fins-core-win/03-card.png).
  - PR-0274: an advisor card shows at the first menu of both Sin chapters.
  - PR-0290: the phone Curse hint lists Holy Water, Esuna and Remedy (ffx2-bahamut-win-phone-touch/11-advisor.png).
  - PR-0287: the FFX-2 OPTIONS column fits at 1600x900 with BATTLE HELP visible (ecpage-ffx2-bahamut-1600x900-rm/10).
  - PR-0264, PR-0265, PR-0266, PR-0283 and PR-0284 were verified by the r34 independent checks and the 25faec70 focused review. They are NOT re-captured here, and PauseScreen.ts and PauseOverlays.ts changed in this candidate, so their re-check is listed in capturesNeeded.
- The new EYE CANDY page (D-317) works by every input path tested, in both games:
  - 12 rows. FFX lists OVERDRIVE SHOT, FFX-2 lists DRESSPHERE SHOT ('FFX-2 ONLY' in its help).
  - Enter opens it, Left/Right flips a row, a mouse click and a touch tap flip it, Esc returns to OPTIONS with the EYE CANDY row still selected, and a reload keeps the change.
  - No horizontal overflow and nothing off screen. The minimum font is 14 px at 1600 and 17 px at 2000.
  - The device notes ('ON · OFF HERE' / 'LESS HERE') come from the same deviceNote() the mix plays by (src/engine/fx/mix/gates.ts, MaxMix.snapshot), so the page cannot claim what the device does not do.

WEAK OR NEW:
- R19-IF-01 (polish, regression vs live at 2000x1012): the colossus masters put the boss under the cards that hudPanels.ts leaves out of its clearance (intent, moves and Sensor cards). Ch XII: the Sensor card over Natus's lower body. Ch IV: the intent card over Bahamut's wing. At a captured menu both cards were half see-through (advisor meta about 4:1 against 13:1 on live; intent hit chances about 2.6:1 against 6:1). The FFX-2 guide drops its reason line.
- R19-IF-02: the phone pause and the new page render at 12 px (an authored exception at pause-screen.css:824).
- R19-IF-03: Kimahri's Ronso Rage rows say 'timed input', which is false.
- R19-IF-04: no row of the FFX OVERDRIVE submenu reads as selected in the held shot (medium-low confidence).
- Carried, not re-measured: PR-0251 (the 4:3 HUD under the floor).
The score rises from 8.0 (round 18b) because five interface majors are closed by verified repairs and the changed area is solid. It stays well below 9 because of the uncovered shapes and the new framing collisions.

Chief: kept at 8.5. The gap pass measured the colossus/card collision worse than the auditor saw it (advisor and intent cards at opacity 0 for 552-601 ms on each Bahamut action with a menu open; Sensor card over 34.5 % of Natus) and confirmed it is a regression against live (PR-0312, graded polish: the cards return within 0.6 s and nothing shown is wrong). It also gave new rotating-shape coverage: 2560x1080, 2560x1440 and 3840x2160 pass the 14 px floor; 1280x960 still fails it (PR-0251). The two moves offset.

### onboarding: 8.6

Same evidence base as interface: round-19 capture owner's evidence, headless Playwright with PYREFLY_BROWSER=gpu at 1600x900, 2000x1012 and 390x844 touch. No browser was opened by me.

NEWCOMER WALKTHROUGH: SIMULATED, not real. Every chapter run starts from a fresh profile and walks the visible flow by real keys:
- Auron's briefing, with 'ENTER / ESC SKIP — 20 SECONDS, ONCE' and 'D NEVER SHOW THIS AGAIN';
- first-run guide step 1 'AURON · 1 OF 3' on the board;
- step 2 at prep, where Esc keeps party prep (prepEsc=party-prep in all 27 runs);
- the first-turn coach mark.
No human newcomer played this build.

GAINS:
- The EYE CANDY page (D-317) is good optional help. Each of the 12 switches has one plain help line that says what it does, what OFF gives, the device reason ('Off on a phone held upright: it shows a slice of the picture, so the camera stays wide') and the game case ('BOTH GAMES' / 'FFX-2 ONLY').
- REDUCE MOTION is honoured and said in place: 'BREATHING ON · STILL', 'KO COLLAPSE ON · CUT', 'OVERDRIVE SHOT ON · CUT' / 'DRESSPHERE SHOT ON · CUT' (ecpage-*-rm/run.json notes).
- Settings survive the upgrade. Release-33/34/35 saves, hand-made and fixture, keep each look and its new parts per D-317 ('players who had a look off keep the new parts off': upgraded-r35 runs, 5 OF 11 ON). The save matrix passes 23 of 24, and the 24th (fresh-profile) is a harness expectation, not a product failure.
- The phone OPTIONS list now shows six setting rows, including EYE CANDY, without scrolling (ecpage-ffx2-bahamut-390x844-touch/10).
- Non-colour cues hold: 'CHANGE CURSED', glyph status icons and written cures.

WEAK:
- R19-ON-01: after ALL OFF, the page heads '0 OF 11 ON' while seven part rows still read ON, in about 2:1 grey; DEPTH OF FIELD off and dim is about 1.5:1.
- R19-ON-02: help lines use developer-relative wording ('today's calm camera', 'today's splash').
- Carried and still open:
  - PR-0270 (major): FFX-2 battle HUD ignores TEXT SIZE; hudTextSize.ts is still 'FFX only'.
  - PR-0032: no REDUCE FLASHES row and no key remapping. This build adds held shots, splash art and impact frames, and the soft-flash path still reads a flag no row writes (src/app/fxEnv.ts:41).
  - PR-0289: step 1 says 'Start with the first one.' while Chapter XVII is selected (sin-fins-core-win/03-card.png).
- Phone pause text at 12 px is covered under interface (R19-IF-02).
The score is up from 8.4 because PR-0284 is fixed and the options page is exemplary, held back by PR-0270, PR-0032 and the missing gamepad and text-size checks of the new page.

Chief: kept at 8.6.

### prep: 9.1

Prep and delivery auditor, round 19 deep review. Candidate: main 8aee1e69, built in D:/pyrefly-rel26c/dist-gate, bundle index-DU_vcl-u.js. Capture owner: headless Chromium from node, PYREFLY_BROWSER=gpu (910 of 934 index entries say gpu; the other 24 are the unindexed post-probe frames). I opened no browser and started no server. I worked from critic/rounds/round-19/evidence (index.json, 44 run.json files, save-matrix/, network-and-console-summary.json, logs/). I also ran 40 vitest files on D:/pyrefly-rel26c HEAD 8aee1e69: 783 of 783 tests passed (critic/rounds/round-19/prep-delivery/vitest-prep-delivery.txt).

PREP AGENCY. All 18 listed chapters reached party prep by real keys (27 route runs: 1600x900, 2000x1012, and 390x844 touch). On these fresh profiles, Esc on prep reads party-prep. That is Auron's guided first run working as designed: step 2 ends the guide and keeps prep, as round 18 established. It is not a broken back key. FFX-2 dressphere change was played by real input: Den of Woe seed 3 (Rikku to Warrior through the Change menu) and the vis-ffx2-bahamut runs (Yuna to Black Mage). The prep, results, checkpoint and flow code is unchanged against live r35: git diff ef3f6bbf..8aee1e69 touches only settings, pause and fx-mix files.

RESULTS AND REWARDS. These match prior rounds and their sources:
- Flux: AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere.
- Yunalesca: AP 14,000, GIL 9,000, Lv. 3 Key Sphere.
- Evrae: AP 5,400, GIL 2,600, Blk Magic Sphere.
- Anima: OVERKILL x1, AP 6,330, GIL 8,600, Ability Sphere x3.
- Natus: AP 6,300, GIL 3,500.
- Omnis: AP 24,000, GIL 12,000, Lv. 3 Key Sphere.
- Isaaru: 5,000 AP to Yuna.
- Yojimbo: AP 0, GIL 0 (sourced).
- BFA: AP 0 (sourced).
- FFX-2 Bahamut: EXP 1,300, AP 15 per dressphere, GIL 1,000, Gris Gris Bag.
- Vegnagun: EXP 42,400, AP 120, GIL 18,300.
- Den of Woe: EXP 4,200, GIL 35,200 and three items.
The per-member 'no full turn taken · no AP' rule still applies (Natus Kimahri, Omnis Tidus). Defeat cards show TURNS, ATTEMPTS and BEST, and ATTEMPTS counts across RETRY (Trema s2 and s3 read ATTEMPTS 3; Sin XVIII reads ATTEMPTS 2).

RETRY. Every loss reached RETRY, then prep, then a new battle, with a reseed of +1000 per attempt (battleSeeds). Fifteen retries took 7.2 to 7.5 s from the end of the fight to the retried battle, harness waits included: Flux 2000x1012, Flux phone touch, Bahamut, Den, Trema x8 and Sin XVIII x2. This equals rounds 18 and 18b (steady pacing is Bailey's pick).

PROGRESS. All 17 victory runs (15 chapters) keep their clear after a real reload (boardAfterReload.cleared). The upgrade matrix keeps every clear, best, attempt, flag and coach id (see delivery).

PR-0268 is resolved in code. SIN_LINK3_CHECKPOINT is true at sin-genais-core.ts:200 (commit 841845a0, already in live r35), and sin-checkpoint-flow passes: 'win both Fins, lose link 3, RETRY: the retry opens on Genais and the Core'. Real input never reached link 3 this round: Sin XVII lost at link 2 on both attempts. So the real-key proof is still owed (capturesNeeded).

AGAINST:
- PR-0258 (polish, carried): overkill drop quantity.
- PR-0295 (polish, carried): phone prep tabs letterboxed. Prep code is unchanged, so this was not re-captured.
- The Sphere Grid interaction was not captured this round and gets no new credit. Its code is unchanged against live.

From 9.0 to 9.1: the one carried major (PR-0268) is closed by code and a flow test, and every other prep property holds on fresh evidence.

Chief: kept at 9.1.

### delivery: 8.5

PROVISIONAL: frame time and load time get no credit this round (see below).

CANDIDATE IDENTITY (mine). node tools/artifact-manifest.mjs build --dir dist-gate, in D:/pyrefly-rel26c at HEAD 8aee1e69efe1:
- 1,431 files, 798,846,029 bytes, under the 800,000,000-byte line by 1,153,971 bytes;
- artifactHash 4ede98e2358a3cd47c989d41732eddb35f7d897add51de1e7225665c03b1a28c;
- decodeChecked true, audioUnverified 0, problems [] (the decode check includes flat-colour detection);
- file: critic/rounds/round-19/prep-delivery/artifact-manifest-dist-gate.json.
Against live r35's manifest (critic/artifacts/ef3f6bbf.json, 87b5ed53...) there are 163 added, 4 removed and 85 changed files (prep-delivery/diff-vs-live-ef3f6bbf.json):
- added: 160 art/characters files, 138 of them twirl keys (29.0 MB), plus the new js, map and css;
- removed: the old js, map and css, and .nojekyll (deploy-only);
- changed: 78 character files, 3 pause files, 2 portraits, art/manifest.json and index.html.
Every capture ran on this exact bundle (index-DU_vcl-u.js in save-matrix.json).

FLOWS (CHK-022). 44 runs made 3,717 requests: 0 console errors, 0 responses >= 400, 0 images served as text/html (network-and-console-summary.json and every run.json).
- Won by real keys through results, CONFIRM, scene, board and a reload that keeps the clear: 15 of 18 chapters. FFX: I (twice), II, III, VII, VIII, IX, X, XII, XIV. FFX-2: IV (desktop and 390x844 touch), V, VI (seed 2), XI, XV (seed 3), XVI.
- Not won: XIII Trema (0 of 8), XVII and XVIII (0 of 2 each). These are advisor-harness losses (PR-0269), so their win aftermath is UNVERIFIED on this candidate. Loss and RETRY are proven for all three.
- Leblanc seed 1 was a harness stall in Wait mode, not a product freeze.
- Six post-battle scenes ran to results without input. That issue belongs to narrative and is cross-referenced here only.

SAVE (CHK-024; the plan says the save-data class, deep before deploy). Run by save-matrix19.mjs (save-matrix/save-matrix.json, logs/save-matrix.log).
- Phase A: the r33, r34 and r35 artifacts themselves (bundles DCYkAkI-, cJFxGdIo, DiuZMSBm) each booted four saves and wrote them back: fresh, all looks on, LIGHT+LIVING off, SPECTACLE off with reduce motion. 0 errors.
- Phase B: the candidate booted those 12 written saves, the four fixtures (r31a, r33, r34, r35) and 8 edge cases: parts stored false under a look that is on; parts stored true under a look that is off; non-boolean parts; non-boolean looks; settings missing; fresh; truncated; not JSON.
- The harness says 23 of 24. The single 'fail', fresh-profile, is the harness's own expectation: expected('{}') turns a missing slot into an empty object and then flags the normal default save (version, chapters, unlocked, seenCoach [briefing], flags) as unexpected. Its looks, parts, reload and errors are all correct. Re-read, the result is 24 of 24.
- In every case the D-317 rule holds exactly: a stored part boolean is kept; a missing or non-boolean part takes its look's value; looks coerce to on. Clears are kept. The reload is identical (sameStored true). Settings are applied, not only stored (CHK-023): mixer volumes equal the save (0.55/0.4/0.5; fixtures 0.9/0.5/0.2, 0.6/0.4/0.9 and 0.7/0.3/0.5); html textSize 115 and 130; data-reduceMotion; the fx tier is low for the r34 fixture's lowEffects.
- The EYE CANDY page persisted through a reload in all 8 ecpage runs, both games, at 1600x900, 2000x1012 and 390x844 touch. That includes two upgraded r35 saves, where the upgraded parts read OFF under LIGHT/LIVING off.
- Unit tests: save-fx-parts, save-fx-looks, save-comfort-migration, save-upgrade-fixture, save-two-tabs and the rest of the save-* files pass (vitest-prep-delivery.txt).
- There is no reset or erase flow in the game, so that part of CHK-024 is not applicable.

MEDIA (CHK-019): PASS on the decode-checked manifest. Shipping references (CHK-018): PASS. The variant-path grep finds only a comment in titleMarkup.ts, chapter-meta and art-manifest-build pass, and there were 0 404s.

NO CREDIT, UNVERIFIED: frame time and load. No perf capture exists in round 19. The capture ran 3 to 4 browser lanes in parallel (logs/lanes.log), so no timing in it could count. Round 18's numbers (p95 16.7-16.8 ms, spikes to 117 ms) cannot be reused, because the MAX mix adds per-frame work: DOF, SMAA and defringe, fog and breathing. The builder's own probe (docs/handoff/mix-build.md, not critic evidence) reports p95 unchanged, a Ch I max spike of 116.7 -> 166.7 ms, and the longest battle-start frame on Ch V at 348 -> 625 ms (shader compile behind the card).

OTHER GAPS:
- The cold 10 Mbit/s entry was not re-measured; r18b measured 52.0 s.
- The first FFX-2 spherechange fetches about 2 MB of twirl keys on demand. The builder says that on a cold cache the outfit can land before the keys.
- Never run: Firefox, WebKit, Edge, a real phone, a controller.

HEADROOM. 1.15 MB under the line, while 33 MB of adopted art waits (D-332). Meanwhile 22.7 MB of source maps ship inside the line (see the suggestion).

SERVERS. I started none. At 16:29 local, Get-NetTCPConnection showed no listener on ports 5400-5990. The capture owner's servers on 5911-5913 were stopped by their PIDs (logs/servers.log).

Why 8.5 (r18b: 8.7). The save class is proven more thoroughly than ever, and identity, decode and flows are clean. The score drops 0.2 because this rendering-heavy change has no critic frame-time or load evidence (no credit, mandatory measurement owed), and three chapters' win paths were not reached on this build.

Chief: kept at 8.5. Frame time is still not credited: the gap pass recorded rAF p95 16.7 ms / max 16.8 ms through a Swordplay input and a Bushido held shot, but on a shared multi-lane host and for single sequences, not the single-lane 60 fps measurement the delivery category owes (PR-0259).

### Bailey's five visual sub-scores (provisional, with motion; not weighted)

| Sub-score | Round 19 | Visual pass 2026-10-01 (release 33) |
|---|---:|---:|
| characterModels | 7.9 | 7.6 |
| enemyModels | 7.6 | 7.1 |
| animation | 6.9 | 6.2 |
| fidelity | 8 | 7.9 |
| camera | 7.6 | 7.5 |

From the visual auditor; the feel auditor gave animation 6.9 and camera 7.8. The chief keeps camera at 7.6 because the confirmer and the gap pass proved the Yunalesca plate regression (PR-0307) and the dressphere shot rarely holds (PR-0314).

## Checks

| Check | Result | Mandatory | Reason or evidence |
|---|---|---|---|
| CHK-002 | UNVERIFIED | yes | Full-bleed pause plates look right at 1600x900, 2000x1012 and 390x844 (ecpage-*/10-11.jpg), and the page reports overflowX=false and offscreen=[]. But 1280x720, 2560x1080 and 3840x2160 were not captured, and the painting rect and currentSrc tier were not measured. Chief: the gap pass captured 1280x960, 2560x1080, 2560x1440 and 3840x2160 battle and pause frames but measured no painting rect or currentSrc tier, so the check stays UNVERIFIED. |
| CHK-003 | FAIL | yes | Desktop passes at 1600x900 (min 14 px), 2000x1012 (17 px), and in the gap pass at 2560x1080, 2560x1440 and 3840x2160 (every text node >= 14 px). Fails on the phone pause and EYE CANDY page (12-13 px, authored floor pause-screen.css:824; PR-0321) and at 4:3 1280x960 in battle (9.34 px FFX-2, 9.8 px FFX; PR-0251). |
| CHK-008 | FAIL | yes | FAIL because of the new dressphere shot. At 1600x900 the Ormi, Dr. Goon and Fem-Goon HP bars and their SCAN tags cross Yuna's face (Leblanc). At Trema the Paragon bar crosses Rikku's chin and her crown is cut by the frame top (R19-VIS-02). Polish only: at 2000x1012 the party status rows sit over party legs and a KO'd body (Wakka in Sin Face, KO Yuna in Ch I; R19-VIS-07). Faces were clear of panels in every resting frame I read. The two overlaps ENGINE-API declares as permitted (the command stack over the party's lower third, the strategy guide's rail) were seen and are not counted. Chief: also FAIL on PR-0312 (cards fade to 0 over Bahamut with a menu open; Sensor card over 34.5 % of Natus) and the 4:3 framing (Ch I Yuna 25 % under the HUD, framing live.ok=false). |
| CHK-009 | UNVERIFIED | yes | At the captured sizes, names show in full: - the board shows 'Sin: the Fins and the Core'; - 'Seymour Natus' wraps to two lines in the CTB list; - the EYE CANDY rows report no clipping and offscreen=[]. The check requires 1280 and 3840, which were not captured. Chief: the gap pass found no clipped labels at 1280x960, 2560x1080, 2560x1440 or 3840x2160 for the first menu, chapter select and pause, but 1280x720 and the EYE CANDY page at 1280/3840 were not walked, so the check stays UNVERIFIED. |
| CHK-013 | PASS | yes | The 2026-10-02 art install renders in game, on model and uncropped by its own canvas: 69 twirl keys, the party re-rolls, Kimahri's plates and portraits, Valefor's and Pterya's whole wings, Yu Yevon, and Seymour Flux's four action keys. Approved 543/543 and judge-locked 48/48 are byte-identical, and verify-approved gives 591 ok, 0 mismatched, 0 missing. All 24 superseded locks are authorised by D-322 to D-328. Framing defects are filed under CHK-008 and the targets, not here. |
| CHK-015 | PASS | yes | H was not exercised by the routes this round. The gamepad was not exercised. The first Esc in one ecpage attempt did not report pause within 1 s; on re-run it opened on the first press (harness timing, recorded in that run's escOpens). Gamepad on the new EYE CANDY page owed (requiredNotTested). |
| CHK-016 | PASS | yes | Harness-level pass: every capture carries a read-back assertion and failed waits were recorded UNVERIFIED. Chief: the 30-post-scene UNVERIFIEDs were a harness expectation (scripts put results() first), and the post-results fast lines were the route's own Enter hold (confirmer), filed under PR-0261. |
| CHK-017 | NOT APPLICABLE | yes | Candidate review: 8aee1e69 is not deployed, so there is no live artifact to compare. Owed by the live review after any deploy. |
| CHK-020 | PASS | yes | EYE CANDY page, rows, keys and help exist in both games; paired flows (entry, seams, skip, aftermath, board) shown in both games; game-specific shot rows as documented. |
| CHK-021 | PASS | yes | Combat-facing cases: - od2-od6 (Swordplay/Bushido fail, immune and finisher rows, Tornado 3 s): FFX only. Commits 58f333a0, 3483de3b, 9834cba2, d355582c, f9c7caff and 8b106abf say so, sourced to the research input-rules note. - Sin link-3 checkpoint: FFX only (D-284). - PR-0269 race term: FFX only; raceOf returns null unless state.game is 'ffx'. Presence is proved on FFX boards (od-rows-probe, sin-face bench movement). Absence on FFX-2: git diff f302f163..8aee1e69 is empty for src/battle/ffx2, and the FFX-2 benches still pass. Held shots: the Overdrive shot is FFX only and the dressphere shot is FFX-2 only. heldShots.ts gates both by game, and the capture owner's mix flags read ffx overdriveShot:true/dressphereShot:false and ffx2 the reverse. |
| CHK-022 | UNVERIFIED | yes | 15 of 18 chapters were won by real keys through results, CONFIRM scene, aftermath, board and a reload that keeps the clear; every loss reached RETRY and a new battle. The win paths of XIII Trema (0 of 8), XVII Sin Fins/Core (0 of 2, plus 1 gap-pass attempt) and XVIII Sin Face (0 of 2, plus 1 confirmer attempt) were not reached, so they stay UNVERIFIED. The capture owner's FAIL rested on the post-battle scene running at skip speed with no input; the confirmer refuted it (the route held Enter after results; with no input Ch II and Ch XVI wait 145-147 s on their first post line), so the FAIL is withdrawn. |
| CHK-024 | PASS | yes | Save-data class (D-317 parts upgrade). The harness says 23/24. Its fresh-profile 'fail' is a harness expectation bug: a missing slot is modelled as {}, so the default save's version, chapters and so on read as unexpected diffs. The product behaviour is correct, so the re-read result is 24/24. Each case checks looks and parts against the rule, settings applied to the mixer, html and fx tier, clears kept, and a reload that stays identical. The EYE CANDY page persisted through a reload in 8/8 runs, including the upgraded r35 saves. The game has no reset flow (not applicable). Not exercised: booting a candidate-written save on r35 (rollback safety). |
| CHK-023 | FAIL | yes | The real runtime does invoke the changed Overdrive fail path. 11 of 14 single-link real-key FFX logs replay event-for-event identically through the pure engine at the recorded seed, among them the failed Shooting Star and Dragon Fang: no rider, timing bonus 0, the fail DmgCon.  But the runtime does not hand the overlays the data they need (R19-CE-01). The engine's minigame-request params, fed through the HUD's own openMinigame dispatch: - render the same 7 chips ↑↓←→✕○△ for all four Bushido; - render a 12.2 % zone at the default 340 px/s for all four Swordplay tiers. The overlays read sequence, zoneHalfWidth and speedPxPerSec. The engine sends inputs, travelMs and zonePercent.  Not proven by real input in this round: the success, Immune and finisher rows, the wrong-press reset and the Swordplay mis-press restart. The harness never enters a sequence. |
| CHK-019 | PASS | yes | artifact-manifest build with decode: decodeChecked true, audioUnverified 0, problems [] (the check flags flat single-colour images). It covers the 138 new twirl keys and the 85 changed files. |
| CHK-018 | PASS |  | The variant-path grep returns only a doc comment (titleMarkup.ts:11, a docs/concepts path). chapter-meta*, art-manifest-build and the save-*-listed fixtures pass. 0 responses >= 400 and 0 text/html images over 3,717 requests. |
| CHK-001 | FAIL | yes | Technical half passes: qa.mjs --strict exits 0, ffmpeg decodes 28/28 files with 0 errors, all 29 shipped audio files match live and public, no request returns 404, all 138 music samples are prerendered and both sprites are decoded in 200/200 samples. Step 3 of the check, 'nothing falls back to the synth path', fails on one cue: the title's press-start 'battle-start' plays via the procedural synth in 27 of 27 runs (t about 0.1 s, before either sprite has decoded). The owner sign-off half is CHK-B1 and is UNVERIFIED. |
| CHK-B1 | UNVERIFIED | yes | Agents cannot hear. OWNER-VERDICT.md has no numeric verdict; it was last changed on 2026-09-29. D-302 and D-303 were adopted on recommendation, not by ear. D-307, D-308 and D-309 are unanswered ear questions. The listening score stays owed to Bailey, collected through docs/audio/audition.html. |
| CHK-004 | PASS |  | Advised rows are found and taken in the named submenu, with cost and hit chance. The phone Ch I Poison Fang misses are the known paging harness limit (FR-34-02). Leblanc seed 1 is a harness stall. |
| CHK-005 | UNVERIFIED |  | The degenerate-board matrix was not constructed this round. The one board sampled reads well: Ch I with Yuna KO'd as a Zombie gives 'Leave Yuna down for now — a raise brings Yuna back still a Zombie, and Full-Life kills a Zombie outright' with Mighty Guard (vis-seymour-flux-1600x900/seq-overdrive-held-shot/f12.jpg). The advisor-v4 files changed since round 18b. |
| CHK-006 | UNVERIFIED |  | Exits tested: - target Escape returns to the menu with 0 targets (all runs); - Esc on the EYE CANDY page closes it (ecOpen=false) and keeps the OPTIONS row; - the pause opens and closes by Esc and P. The four-exit matrix (confirm / cancel / turn passes / battle ends) was not walked for every overlay. A faded 'I SEYMOUR NATUS' label is visible across Natus's chest mid-action (seymour-natus-win/23-midfight.png); it is low opacity and not a stale overlay by itself. |
| CHK-007 | FAIL |  | Help copy is relative to the previous build: 'Off: today's calm camera', 'Off: today's splash', 'the bosses keep today's size' (ecpage-ffx2-bahamut-390x844-touch/run.json walk). A new player has no 'today'. Filed as R19-ON-02 (polish). |
| CHK-010 | UNVERIFIED |  | Target captures exist at 1600 and 2000, but not at 1280 or 2560. In Ch I, Kimahri's OVERDRIVE submenu shows three identical gold-bordered slabs across 24 still frames with no visible cursor (R19-IF-04). A Down-press capture is needed to settle it. |
| CHK-011 | PASS | yes | Every targetable enemy can be picked out with its marker: both Yu Pagodas, Mortibody beside Natus, Mortiorchis, Guado A and B, the Syndicate trio, and Vegnagun's parts at links 2 and 4. Mortibody overlaps Natus's lower body but stays readable at about 120x110 px. |
| CHK-012 | PASS |  | No monogram fallback in any frame I read. Kimahri's new portrait and pause plate render painted. |
| CHK-014 | PASS |  | Facing and ground contact hold: the party faces the enemies, poses aim at their targets, and feet sit on the plane with contact rings. This check covers facing only. Scale against neighbours and interpenetration are filed separately (VP-1001-02 carried, R19-VIS-03) so the same defect is not counted twice. |
| CHK-025 | NOT APPLICABLE |  | No FF7 file changed and no FF7 save key was touched. The matrix's stored-slot diffs show only the main key's settings fields. |
| CHK-B2 | UNVERIFIED |  | Human check, owed to Bailey: how the held Overdrive and dressphere shots, the twirl keys, breathing and KO collapse feel in play. No agent can certify feel. |
| CHK-B3 | UNVERIFIED |  | Human check, owed to Bailey: his own read of the story beats and voice. Scripts are unchanged this release. |

## Encounters (capture owner, real input)

| Chapter | Real flow complete | Outcome | Note |
|---|---|---|---|
| seymour-flux | yes | victory (seed 1, 1600x900); loss + RETRY at 2000x1012; phone 390x844 touch lost + RETRY reached battle; a key-tracked re-run (seymour-flux-win-keys) won again | Overdrive held shot captured by real input (vis-seymour-flux-1600x900, -2000x1012-rm). Post-battle scene not readable (see the post-scene issue); 30-post-scene recorded UNVERIFIED. Chief: the post-scene UNVERIFIED is a harness expectation (results() comes first in the script; the aftermath was captured after CONFIRM as 33-after-confirm-scene). The confirmer showed the post lines wait for input when nothing is pressed (Ch II, Ch XVI). |
| yunalesca | yes | victory, 2000x1012, seed 1 | Post-battle scene ran at skip speed with no input (30-post-scene UNVERIFIED). Chief: the post-scene UNVERIFIED is a harness expectation (results() comes first in the script; the aftermath was captured after CONFIRM as 33-after-confirm-scene). The confirmer showed the post lines wait for input when nothing is pressed (Ch II, Ch XVI). |
| braskas-final-aeon | yes | victory, 1600x900, seed 1, seams 2-7 | Every aeon link plus Yu Yevon captured (20-link-*.png, seq-seam-*). |
| ffx2-bahamut | yes | loss + RETRY at 2000x1012; victory at 1600x900; victory on phone 390x844 touch | Dressphere shot and twirl captured by real input (vis-ffx2-bahamut-2000x1012, -1600x900-rm). |
| ffx2-vegnagun-shuyin | yes | victory, 2000x1012, seed 1, seams 2-5 |  |
| ffx2-leblanc | yes | seed 1: UNDECIDED (harness stall); seed 2: victory at 2000x1012 | Seed 1: from turn 12 Rikku's menu reopened in the remembered White Magic submenu. The advisor wanted Phoenix Down from Item and the chooser never backed out, so 25 picks came back empty and the Wait-mode fight froze until the budget ran out. Harness limitation, not a product verdict. Seed-2 post scene skipped (30-post-scene UNVERIFIED). Chief: the post-scene UNVERIFIED is a harness expectation (results() comes first in the script; the aftermath was captured after CONFIRM as 33-after-confirm-scene). The confirmer showed the post lines wait for input when nothing is pressed (Ch II, Ch XVI). |
| seymour-anima-macalania | yes | victory, 2000x1012, seed 1 | Post scene skipped with no input (UNVERIFIED shot). Chief: the post-scene UNVERIFIED is a harness expectation (results() comes first in the script; the aftermath was captured after CONFIRM as 33-after-confirm-scene). The confirmer showed the post lines wait for input when nothing is pressed (Ch II, Ch XVI). |
| evrae-airship | yes | victory, 1600x900, seed 1 | Post scene skipped with no input (UNVERIFIED shot). The Orders widget was not opened on this route. Chief: the post-scene UNVERIFIED is a harness expectation (results() comes first in the script; the aftermath was captured after CONFIRM as 33-after-confirm-scene). The confirmer showed the post lines wait for input when nothing is pressed (Ch II, Ch XVI). |
| yojimbo-cavern | yes | victory, 2000x1012, seed 1 |  |
| seymour-natus | yes | victory, 1600x900, seed 1 | Colossus framing captured (11-advisor, 23-midfight). |
| ffx2-fallen-aeons | yes | victory, 2000x1012, seed 1, seams 2 and 3 |  |
| seymour-omnis | yes | victory, 1600x900, seed 1 |  |
| ffx2-trema | NO | defeat on all 8 attempts (seeds 1/1001, 2/1002/2002, 3/1003/2003); RETRY reached battle every time | Loss and retry path complete; win, post-battle scene and return to the board after a win NOT reached. Same as rounds 17 and 18, where the route won 1 attempt in 5, so this is no sign of a regression. UNVERIFIED for the win path. |
| isaaru-via-purifico | yes | victory, 2000x1012, seed 1, seams 2 and 3 |  |
| ffx2-den-of-woe | yes | seed 1: defeat x2; seed 3: defeat, then victory on retry (seed 1003), 1600x900 | Win reached by real input for the first time since round 18b. |
| ffx2-ixion-djose | yes | victory, 1600x900, seed 1 | Post scene skipped with no input (UNVERIFIED shot). Chief: the post-scene UNVERIFIED is a harness expectation (results() comes first in the script; the aftermath was captured after CONFIRM as 33-after-confirm-scene). The confirmer showed the post lines wait for input when nothing is pressed (Ch II, Ch XVI). |
| sin-fins-core | NO | defeat x2 (seeds 1, 1001); link 1 won, lost in link 2; RETRY reached battle | Win path UNVERIFIED; same pattern as rounds 17 and 18. |
| sin-face | NO | defeat x2 (seeds 1, 1001), 2000x1012; RETRY reached battle | Win path UNVERIFIED; same pattern as rounds 17 and 18. |

## Target gate

Required 87, matched 69, failing 1 (scenes-ch2-zanarkand (PR-0307: plate edge and void under the colossus master; live matches)), unverified 17, waiting on a decision 6. The visual auditor's tally against docs/target/targets.json at sha256 650de885de231e5b957833d09c9c60412fa9573325fd732f1d8f1bbd48f1263f (87 required: one more than round 18b). Portrait tiles for Paine and Seymour Ch VII and the front-end tiles are reused with dependency arguments (see coverage.reused).

Protected art: approved 543/543 and judge-locked 48/48 byte-identical in dist-gate; verify-approved (ROOT=D:/pyrefly-rel26c) 591 ok, 0 mismatched, 0 missing; the 24 superseded locks and Pterya's two judge-locked files are authorised by D-322 to D-328 (lock set bailey:2026-10-02-art, commit ad0b8973).

## Coverage matrix

### Tested

- All 18 chapters by real keys from a fresh profile (27 route runs, 1600x900 / 2000x1012 / 390x844 touch, GPU headless): 15 won through results, CONFIRM, aftermath, board and reload; every loss to RETRY and a new battle
- Save-data class (CHK-024): 24-case matrix with saves written by the release 33, 34 and 35 artifacts themselves, four fixtures and eight edge cases; settings applied, not only stored; EYE CANDY persistence across reload in 8 runs
- EYE CANDY page by keys, mouse and touch in both games at three sizes, REDUCE MOTION and an upgraded r35 save; computed font walk at 390x844
- MAX mix motion: Overdrive held shot (route and gap pass through a real timed input, normal and REDUCE MOTION), dressphere shot in 5 route chapters and 12 gap-pass changes at 1280x720 / 1600x900 / 2560x1440 / phone, breathing on/off, KO collapse at about 85 ms per frame both games
- Colossus framing: rest and mid-fight frames for every colossus chapter; Yunalesca at five aspects against live 35 (regression proved)
- Combat (FFX only changes since the last deep review): data audit of every od2-od6 value against research; od-rows probe on 11 FFX boards; 11 of 14 real-key FFX logs replayed event-for-event; 318-file combat subset (5,339 tests); three-line bench and Sin benches re-run (confirmer re-ran the Sin benches)
- Real-key Bushido success (Ch II) and Swordplay mis-press restart then hit (Ch XVII) on the candidate
- Rotating shapes: 1280x960, 2560x1080, 2560x1440, 3840x2160 first menus (Ch I, X, IV), chapter select and pause; legibility walk
- Card opacity timeline in Ch IV (Wait and Active) on the candidate and on live 35; Sensor overlap in Ch X
- Post-battle scene with no input after results (Ch II and Ch XVI, confirmer)
- Audio: qa --strict, ffmpeg decode 28/28, hashes identical to live, routing in 27 runs, seams, results cues
- Delivery: artifact manifest (1,431 files, 798,846,029 bytes, decode-checked), diff vs live, 3,717 requests with 0 errors and 0 404s; 40 prep/delivery vitest files (783 tests)
- Protected art: approved 543/543 and judge-locked 48/48 byte-identical; verify-approved 591 ok

### Reused, with the dependency argument

- **Closure of PR-0264, PR-0265, PR-0266, PR-0283, PR-0284** (from critic/reviews/25faec70-focused.json and the r34 independent checks (443e332e, 1150fb8f, 65df8025)): touchTapAim.ts, the restart code and the FFX text-size cap are unchanged since release 34. PauseScreen.ts (+18) and PauseOverlays.ts (+70) changed for the EYE CANDY page, so the pointer paths of PR-0265/0283/0284 are listed in requiredNotTested rather than re-passed.
- **PR-0270 measurement (FFX-2 HUD ignores TEXT SIZE)** (from round 18): hudTextSize.ts still FFX only; its one later change (d4296431) is FFX only.
- **Pause cue hand-back, title and chapter-select audio samples** (from round 18 gap pass): pauseMusic.ts unchanged since 65152c1b; AudioManager's later change dac3bff5 touches no music path; pause.mp3, title.mp3 and chapter-select.mp3 byte-identical.
- **Portrait tiles cast-portrait-paine and cast-portrait-seymour-ch7; front-end target tiles (title, chapter select, prep, results, first-run steps, onboarding C1-C3, PR-0001/0002/0005/0012/0127)** (from rounds 18 and 18b): Portrait files hash-identical; story scripts and speaker-plate code not in this candidate's product paths; the front-end screens are not in productPaths except the pause, which was re-judged.
- **Aftermath content of XIII, XVII and XVIII (narrative judgment only, not reachability)** (from round 18b gap pass): src/story and the cutscene screens are unchanged (git diff ef3f6bbf..8aee1e69); reachability on this build stays UNVERIFIED under CHK-022.

### Not tested

- Firefox, WebKit/Safari, Edge, a real phone, a real controller (no path exists; RUBRIC section 10)
- Natural reading pace of every aftermath (the route hold-skips; only Ch II and XVI first lines sampled without input)
- Aeon Overdrive and boss special splashes (Energy Ray, Mega Flare) on the candidate
- EYE CANDY page SFX log and music duck
- H key (help) in the routes

### Required by this review and not tested

- CHK-022: the win path, aftermath, results and board of XIII Trema, XVII Sin Fins/Core and XVIII Sin Face by real input (0 of 8, 0 of 3 and 0 of 3 attempts won)
- Sin XVII link-3 checkpoint retry by real keys (D-284; PR-0268 code fix) and the link-3 command list in the HUD (PR-0273)
- Frame time at 1600x900 on one lane with the MAX mix (60 fps, spikes, battle-start compile frame; PR-0259) and the cold load at 10 Mbit/s (PR-0240)
- CHK-002 painting rect and resolution tier at 1280x720, 2560x1080 and 3840x2160
- CHK-009 at 1280x720 and the EYE CANDY page at 1280 and 3840
- Pause by pointer after this candidate's PauseScreen/PauseOverlays changes: ESC RESUME, RESTART ENCOUNTER (no title root), REPLAY BRIEFING (PR-0265, PR-0283, PR-0284)
- EYE CANDY page by gamepad in both games
- FFX-2 chain-seam control return under the new masters (PR-0301), V seam 2 and XV seam 2, candidate vs live
- Twirl keys on a cold, throttled cache (PR-0327)
- CHK-008 projected-quad intersection matrix at 1280x720 and 2560x1440
- Human judgments CHK-B1, CHK-B2, CHK-B3

## Ranked issue list (all open issues)

### 1. PR-0307 [major, visual] (new; R19-VIS-01, confirmed twice): Yunalesca's colossus master pulls the camera past the painted Zanarkand Dome plate, showing its tilted edge and a dark void at every tested aspect; live release 35 fills the frame

- **Game:** FFX only (Ch II; the masters are per chapter)
- **Chapter / state:** II yunalesca, every battle frame from the first menu
- **Expected:** The approved Ch. 2 Zanarkand Dome composition (target scenes-ch2-zanarkand) fills the frame at every supported aspect, as on live release 35; masters.ts promises the masters stay within the view the backdrops were painted for.
- **Observed:** Candidate, first command menu: a straight, tilted plate edge crosses the top with a dark star-field band above and a ~180 px band on the left; the dome and pillars shrink to a strip behind the actors and the golden sphere is gone. Seen at 1600x900, 1920x1080, 2000x1012, 2560x1440 and 2560x1080, and through advisor, targeting, mid-fight and party-action frames. Live release 35 at the same seed and size shows the dome edge to edge with only a ~70 px left band.
- **Repro and seed:** Production candidate 8aee1e69 (dist-gate), fresh profile, setSeed(1), real keys: title > board > Ch II > prep > skip the scene > first command menu; press N and G to hide the cards. Same steps on https://baileypillon.github.io/pyrefly-reprise/ (release 35).
- **Evidence:** critic/rounds/round-19/confirm/yunalesca-2000x1012-menu.jpg; critic/rounds/round-19/confirm/yunalesca-2000x1012-live-menu.jpg; critic/rounds/round-19/confirm/yunalesca-1600x900-menu.jpg; critic/rounds/round-19/confirm/yunalesca-1920x1080-menu.jpg; critic/rounds/round-19/evidence/gaps/fm-yunalesca-{1600x900,2000x1012,2560x1440,2560x1080}/11-first-menu-N-G-hidden.png; critic/rounds/round-19/evidence/gaps/sheet-yunalesca-edge-cand-vs-live.jpg; critic/rounds/round-19/visual/st-yunalesca-r19.jpg
- **Confidence:** high for the observation and the regression (three independent captures, candidate and live side by side); medium for the cause
- **Requirement:** RUBRIC section 7 approved target scenes-ch2-zanarkand; RUBRIC section 3 (regression against live); CHK-013; masters.ts contract
- **File and line:** src/engine/fx/mix/masters.ts:25 (COLOSSUS includes yunalesca) and :51 (scaleTarget 1.7); pitch and distance math not traced (suspected)
- **Smallest fix:** Smallest: take yunalesca out of the COLOSSUS set (masters.ts:25) so Ch II keeps today's rig. Better, for every colossus: add a plate-coverage test to the master fit (the camera frustum must stay inside the backdrop plate at every supported aspect) and fall back to today's rig when it fails.
- **Acceptance check:** Ch II first menu at 1600x900, 1920x1080, 2000x1012, 2560x1440, 2560x1080 and 1280x960: no plate edge or void wider than live's, and the end-state-board composite against scenes-ch2-zanarkand matches (dome, pillars, sphere). Repeat the plate-coverage check for Natus, Yojimbo, BFA, Evrae and FFX-2 Bahamut.
- **Introduced by candidate:** true
- **Regression vs live:** true
- **In a new feature:** false
- **Note:** Ship-blocking. inNewFeature is false on purpose: CHAPTER FRAMING is a new switch, but the defect is the loss of an existing, approved chapter composition that works on live, and the switch ships ON by default (fxParts.ts: "Default will be on"). The visual auditor tagged it inNewFeature true and regressionVsLive unknown; the confirmer and the gap pass then proved the regression.

### 2. PR-0148 [major, audio] (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (V0 encode, SFX b)

- **Game:** both
- **Chapter / state:** all
- **Expected:** A numeric owner listening verdict recorded against the exact shipped cues (CHK-B1, RUBRIC section 6).
- **Observed:** docs/audio/OWNER-VERDICT.md last changed in 5e5ef411 (2026-09-29 00:07); every entry says no number out of 10 was given. D-307 (an ear question about battle-ffx and boss-vegnagun) is proposed and unanswered. Confirmed by the confirmer.
- **Repro and seed:** Read docs/audio/OWNER-VERDICT.md and decisions.json D-253, D-283 and D-292. No entry gives a score out of 10 for the R1 mix. No seed is needed.
- **Evidence:** D:/Final Fantasy/docs/audio/OWNER-VERDICT.md; D:/Final Fantasy/docs/target/decisions.json (D-307)
- **Confidence:** high
- **Requirement:** RUBRIC section 6 audio: 'Bailey's listening assessment'; CHK-B1
- **File and line:** docs/audio/OWNER-VERDICT.md; shipped public/audio/music/*.mp3 (R1)
- **Smallest fix:** When D-292's O1 (V0 re-encode) lands, send Bailey the audition page with one question: a number out of 10 for the shipped battle, boss and scene cues. Record it verbatim in OWNER-VERDICT.md.
- **Acceptance check:** OWNER-VERDICT.md has a dated verbatim numeric verdict naming the exact shipped build or cue set.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: OWNER-VERDICT.md unchanged since 2026-09-29; the shipped set is now music v2 (D-302) and SFX v2 (D-303), adopted on recommendation, not by ear; D-307 to D-309 unanswered. No audio file changed against live.
- **Note:** Owner-reported. Open at major in rounds 15, 16 and 17: STALLED; the next audio batch starts with a method check (RUBRIC section 8).

### 3. PR-0308 [major, combat] (new finding, pre-existing code; R19-CE-01, confirmed in the engine and by real keys): Bushido and Swordplay ignore the Overdrive chosen. Every Bushido shows one invented 7-input sequence, and every Swordplay tier has the same zone and speed

- **Game:** FFX only
- **Chapter / state:** every FFX chapter where Tidus or Auron fills the gauge (real-key Auron Overdrives in II, XII, XVIII; Tidus in XVII)
- **Expected:** Bushido shows each Overdrive's sourced sequence and length (research/ffx-combat-core.md section 5.5 [verified: 2 sources], International baseline): Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6 inputs, in different orders. Swordplay: a stronger Overdrive has a narrower zone and a faster marker (section 5.3 rule 2 [verified: 2 sources]; per-tier values are the tuning table's estimates).
- **Observed:** Engine params through the HUD's real openMinigame dispatch (jsdom): all four Bushido render the chips up down left right cross circle triangle; all four Swordplay tiers render a 12.22 % zone at the default 340 px/s, only the timer scales (3000/3000/2600/2200). In the running game (gap pass, Ch II seed 1, real keys) Shooting Star and Dragon Fang show the same 7-chip row and both resolve correctInputs 7. Same code on live.
- **Repro and seed:** Node: in D:/pyrefly-rel26c run vitest with critic/rounds/round-19/combat/vitest.critic.config.ts on od-params-probe.test.ts and read od-params-probe.json. In game: fresh profile, setSeed(1), real keys to Ch II; follow the advisor until Auron's gauge is full; Overdrive > Shooting Star, later Dragon Fang.
- **Evidence:** critic/rounds/round-19/combat/od-params-probe.json; critic/rounds/round-19/combat/od-params-probe.test.ts; critic/rounds/round-19/evidence/gaps/bushido-yunalesca-1600x900-s1/{od0-chips.png,od1-chips.png,run.json}; research/ffx-combat-core.md:862-865
- **Confidence:** high (real engine function, real overlay dispatch, real keys; confirmer re-ran the probe)
- **Requirement:** AGENTS.md rules 6 and 14; RUBRIC section 2 faithful Overdrives; CHK-023
- **File and line:** src/battle/ffx/overdrive.ts:313-316 (minigameParams hard-codes {travelMs:1400, zonePercent:22} and {inputs:7}); src/ui/ffx/minigames/AuronSequence.ts:40-43 (reads params.sequence, falls back to a default array); src/ui/ffx/minigames/TidusTiming.ts:25-26 (reads zoneHalfWidth/speedPxPerSec, which nothing sends)
- **Smallest fix:** Make minigameParams send what the overlays read: a per-record Bushido sequence from the section 5.5 table (button order is [conflicting] in D3; recommend GameFAQs' order or settle it in the Steam copy, and say which), and Swordplay zoneHalfWidth/speedPxPerSec from the section 5.3 tier table (or have TidusTiming convert travelMs/zonePercent). Add a unit test that feeds minigameParams into openMinigame.
- **Acceptance check:** od-params-probe shows four different chip rows of length 8/7/7/6 matching section 5.5 and four Swordplay zones that narrow while the speed rises; a real-key Dragon Fang in Ch II shows 8 chips and resolves correctInputs 8 on success.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false

### 4. PR-0269 [major, combat] (carried, narrowed by the confirmer): the advisor line loses Chapter XVII; Chapter XVIII is unreliable on it (1 win in 3 real-key runs across rounds 18 and 18b)

- **Game:** FFX
- **Chapter / state:** XVII Sin Fins/Core and XVIII Sin Face; seeds 1 and 1001
- **Expected:** A card that follows sourced play wins a fair share, as the sensible line does (r17: XVIII 31%, XVII 25.5%).
- **Observed:** Confirmer on f302f163, route18d.mjs following the card, seed 1, 1600x900: XVII DEFEAT (253 turns, 26 advisor orders; the fins link was won and the seam crossed). XVIII VICTORY in 74 turns, where round 18 lost the same seed in 68; the runs diverge at pick 20 because of real-time minigame and timing variance. The gap pass won both chapters through their aftermaths, but with the round-17 in-page policy, not the advisor card.
- **Repro and seed:** Capture owner routes sin-face-win and sin-fins-core-win, 1600x900 and 2000x1012, seeds 1 and 1001.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/sin-fins-core-win/31-results.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/sin-fins-core-win/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/sin-face-win/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json
- **Confidence:** high
- **Requirement:** encounter: fair wins; interface: legal and useful advice
- **File and line:** the advisor (src/engine/tactics), unchanged since round 17
- **Smallest fix:** As round 17: give the Sin tactics the race priorities of the sensible line (damage over top-ups while the timer runs).
- **Acceptance check:** The advisor-card chain wins at least the sensible line's rate minus a small margin on the 200-seed Sin benches, and one real-key XVIII win on the card.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19 (confirmed): real keys lost XVIII on seeds 1 and 1001 (65, 59 turns; confirmer re-run 65 turns) and XVII on seeds 1 and 1001 at link 2; bench XVIII advisor 28/80 (intended 19/80), XVII 3/40. The harness enters no Overdrive input (Enter after 3 s), which understates human damage. D-282 still proposed.

### 5. PR-0310 [major, visual] (carries VP-1001-02 from the 2026-10-01 visual pass; R19-VIS-03): party and boss still interpenetrate at rest under the new colossus masters

- **Game:** both
- **Chapter / state:** yunalesca, ffx2-bahamut, evrae-airship, seymour-anima-macalania (rest); seymour-natus (mid-fight)
- **Expected:** masters.ts promises a positive gap between party and enemies (VP-1001-02); approved targeting B keeps the party clear of the enemy group.
- **Observed:** First menu: Auron stands in Yunalesca's skirt; Paine inside Bahamut's tail and claws (1600x900 and 2000x1012); Rikku in Evrae's coils; Rikku mixed into the Guado and Seymour group; in the Natus mid-fight Auron overlaps Natus's lower body. Yojimbo, BFA and Ch I keep a gap.
- **Repro and seed:** Candidate 8aee1e69, seed 1, first command menu of each named chapter (capture owner's -win runs, 16b-after-cancel / 11-advisor).
- **Evidence:** critic/rounds/round-19/visual/st-colossus-rest.jpg; critic/rounds/round-19/evidence/vis-ffx2-bahamut-2000x1012/01-framing-first-menu.png; critic/reviews/visual-pass-2026-10-01.json VP-1001-02
- **Confidence:** high
- **Requirement:** VP-1001-02; approved targeting B; masters.ts contract
- **File and line:** src/engine/fx/mix/masters.ts (azimuth search and fit; "a positive gap" promised, not enforced)
- **Smallest fix:** Make the master fit fail closed: when the projected party and enemy boxes still overlap after the azimuth search, move the party slot left or the boss slot right (or lower the scale target) until the gap is above 0 px; one unit test per colossus chapter.
- **Acceptance check:** Every chapter at rest at 1600x900 and 2000x1012: projected party and enemy quads do not intersect.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false

### 6. PR-0309 [major, visual] (new; R19-VIS-02): at 1600x900 the new DRESSPHERE SHOT puts the enemy HP bars and SCAN tags over a girl's face and cuts a neighbour's head at the frame top, while the girl who changes stands small

- **Game:** FFX-2 only
- **Chapter / state:** VI ffx2-leblanc s1, XIII ffx2-trema s1 (1600x900); clean at 2000x1012 (XI, IV)
- **Expected:** D-316: shots keep every figure clear of the HUD while a menu is open; CHK-008: no panel over a face; the shot frames the girl who changes.
- **Observed:** Leblanc f03: the Ormi, Dr. Goon and Fem-Goon bars and SCAN tags run across Yuna's face while Rikku changes. Trema f02-f04: Rikku fills the foreground with her crown cut by the frame top and the Paragon bar across her chin, while Paine (who changes) stands small at mid-frame. The gap pass saw Trema frame cleanly at 1280x720 and 2560x1440, but there the shot was 0.5 s or absent (PR-0314).
- **Repro and seed:** Candidate 8aee1e69, seed 1, 1600x900, Ch VI (or XIII): choose CHANGE and a dressphere by keys; capture 0.3-0.9 s after the turn starts.
- **Evidence:** critic/rounds/round-19/evidence/ffx2-leblanc-win/seq-spherechange/f03.jpg; critic/rounds/round-19/evidence/ffx2-trema-win/seq-spherechange/f03.jpg; critic/rounds/round-19/visual/st-spherechange-chapters.jpg; critic/rounds/round-19/evidence/gaps/sheet-sc-sizes.jpg
- **Confidence:** high
- **Requirement:** CHK-008; D-316 gate; CHK-014
- **File and line:** src/engine/fx/mix/heldShots.ts (dressphere shot framing); clearance.ts computes the HUD-free area (suspected: the shot does not use it)
- **Smallest fix:** Aim the dressphere shot at the changing girl's box inside the HUD-free area clearance.ts already computes, with headroom for any neighbour in view; or hide the enemy HP bars for the shot's length.
- **Acceptance check:** Every FFX-2 spherechange shot at 1280x720, 1600x900, 2000x1012 and 390x844: no panel intersects a face, no head is cut by a frame edge, and the changing girl is the largest figure.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Note:** Inside the brand-new DRESSPHERE SHOT (a part switch, FFX-2 only): disclosed, does not hold; it can ship switched off.

### 7. PR-0311 [major, visual] (new finding, pre-existing art gap): Yuna's Thief dressphere renders as a translucent purple placeholder mannequin, now framed in close-up by the dressphere shot and kept for the rest of the fight

- **Game:** FFX-2 only
- **Chapter / state:** VI ffx2-leblanc (Yuna's garment grid offers Thief)
- **Expected:** Painted Yuna-Thief art, or the change not offered until the art exists (no placeholders in shipped chapters).
- **Observed:** Gap pass, Ch VI seed 1, real keys (Yuna CHANGE, Right, Enter: Gunner to Thief): a purple silhouette with pink dots appears in the close shot and stays for the rest of the fight, at 1280x720 and 2560x1440.
- **Repro and seed:** setSeed(1), real keys to Ch VI; on Yuna's turn CHANGE, Right, Enter.
- **Evidence:** critic/rounds/round-19/evidence/gaps/sc-ffx2-leblanc-1280x720-s1/sheet-c0-all.jpg; critic/rounds/round-19/evidence/gaps/sc-ffx2-leblanc-1280x720-s1/c1-grid.png; critic/rounds/round-19/evidence/gaps/sc-ffx2-leblanc-2560x1440-s1/c0-seq/
- **Confidence:** high
- **Requirement:** visual: character fidelity; CHK-012 (no accidental placeholders)
- **File and line:** art/characters/yuna-thief/ does not exist in dist-gate or public/art; live returns 404 for art/characters/yuna-thief/idle.png
- **Smallest fix:** Take Thief out of Yuna's Ch VI grid until art exists, and skip the dressphere close shot whenever the destination figure is a placeholder; painting Yuna-Thief goes through the end-state flow (rule 9) with Bailey's pick.
- **Acceptance check:** The same change shows painted art, or Thief is not offered; no placeholder actor in the __pyrefly snapshot.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Note:** The art was always missing (live also 404s); the candidate's dressphere shot makes it more visible. Disclosed.

### 8. PR-0099 [major, audio] (carried, STALLED; count corrected): nine chapter rows in THEMES.md still play a stand-in cue, Chapter XV included

- **Game:** both
- **Chapter / state:** VI, IX (scene), X, XI, XII, XIII, XIV, XV, XVI (field bed), XVII, XVIII
- **Expected:** D-209: every chapter gets its own composed cue, and a stand-in never counts as finished.
- **Observed:** XV plays Chapter V's boss-shuyin and Chapter IV's scene-bevelle-underground at runtime (13 + 1 AudioManager samples), as THEMES.md row XV says. Counting rule (confirmer): rows marked "stand-in" in the THEMES.md chapter cue-map table are VI, X, XII, XIII, XIV, XV, XVI, XVII and XVIII, nine rows; round 18's "11 of 18" counted rows that borrow a cue under another label.
- **Repro and seed:** node tools/audio/themes-audit.mjs in D:/pyrefly-rel28 lists the '[borrowed; owed]' rows.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/audio-debug.jsonl; D:/Final Fantasy/docs/audio/THEMES.md
- **Confidence:** high
- **Requirement:** D-209; RUBRIC section 6 audio (thematic coherence)
- **File and line:** docs/audio/THEMES.md chapter cue map; src/data chapter music records
- **Smallest fix:** After D-292's newer-model test settles the render path, compose the owed cues in priority order (Sin assault and countdown, Omnis, Natus), each auditioned by Bailey before it ships.
- **Acceptance check:** themes-audit shows no '[borrowed]' for the chapters delivered, with an ear verdict recorded per cue.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: themes-audit unchanged; the same nine rows borrow (critic/rounds/round-19/audio/themes-audit.txt).

### 9. PR-0270 [major, onboarding] (carried; owner-gated switch unchanged): TEXT SIZE grows nothing in the FFX-2 battle HUD

- **Game:** FFX-2
- **Chapter / state:** IV Bahamut
- **Expected:** A2 says TEXT SIZE grows the battle HUD, dialogue and menus in both games; the FFX-2 pass waits on Bailey's D-220 Q4 pick.
- **Observed:** TEXT_SIZE_WIDE_SCOPE is still false (applyComfort.ts unchanged). The gap pass measured the FFX-2 desktop cure hint at 15.2 px at 100, 115 and 130 %, while the FFX one grows 15.2 -> 17.5 -> 19.7 px.
- **Repro and seed:** cap/comfort2.mjs ffx2-bahamut --size=1600x900 and --size=390x844 --phone (real keys: P, OPTIONS, TEXT SIZE Right).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-ffx2-bahamut-1600x900/run.json (reused); D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/run.json
- **Confidence:** high
- **Requirement:** A2 (D-285); docs/handoff/r31-access.md CHECK major 2 (disclosed)
- **File and line:** app/applyComfort.ts TEXT_SIZE_WIDE_SCOPE=false; text-size-wide.css not active
- **Smallest fix:** Before Q4: label the row honestly (for example "FFX battle HUD and dialogue"). After Bailey's Q4 pick: switch on TEXT_SIZE_WIDE_SCOPE with the FFX-2 intent-board solver slot.
- **Acceptance check:** After Q4: the FFX-2 command, party and advisor panels grow at 115/130 % on desktop and phone with no overlaps, measured by the comfort probe.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: not re-measured; hudTextSize.ts still "Game case: FFX only" (only d4296431, FFX-only, touched it). Carried by dependency.

### 10. PR-0222 [major, delivery] (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

- **Game:** FF7 (hidden experiment)
- **Chapter / state:** FF7 Guard Scorpion (unlisted)
- **Expected:** No black hold: the swirl's last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- **Observed:** Not captured this round. No FF7 file and no shipped asset changed between 65152c1b and f302f163.
- **Repro and seed:** Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears. Press Esc and arrows during the hold.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/prep-delivery/diff-vs-r18-candidate-65152c1b.txt
- **Confidence:** low (unverified either way)
- **Requirement:** CHK-017 / CHK-025; RUBRIC §5
- **File and line:** secret door -> swirl -> field, cold cache
- **Smallest fix:** None proposed until it is observed.
- **Acceptance check:** No black sample longer than 1 s, the field arrives, and Esc and arrows during the hold neither lock nor start anything.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: no FF7 file changed; still not captured.

### 11. PR-0312 [polish, interface] (new; R19-IF-01 + gap-pass measurements): the colossus masters put the boss under HUD cards that the clearance leaves out; in Ch IV the advisor and intent cards fade to opacity 0 for 0.55-0.6 s on every Bahamut action while a menu is open, and in Ch X the Sensor card covers 34.5 % of Natus

- **Game:** both (FFX Ch X Natus; FFX-2 Ch IV Bahamut)
- **Chapter / state:** seymour-natus, ffx2-bahamut; first menu and enemy actions with a menu open
- **Expected:** Cards the player reads while choosing stay readable, as on live release 35 (opacity 1 throughout, no ffx2-actfade on the same seed); D-316: every boss part clear of the HUD while a menu is open.
- **Observed:** Ch IV 2000x1012, Wait and Active: on each Bahamut Attack the advisor and intent cards take ffx2-actfade and sit at opacity 0 for 552-601 ms with awaitingMenu true; live 35 shows 0 fade spans. The intent card sits over Bahamut's wing; the guide drops its reason line. Ch X 2000x1012: the Sensor card covers 34.5 % of Natus's projected rect (2.1 % after I folds it).
- **Repro and seed:** setSeed(1), real keys to Ch IV at 2000x1012; leave Yuna's menu open (Active) or play Attack (Wait) through two Bahamut actions, sampling card opacity every 50 ms; repeat on live 35. Ch X at 2000x1012: first menu, card shown and folded.
- **Evidence:** critic/rounds/round-19/evidence/gaps/actfade-ffx2-bahamut-2000x1012-{active,wait}/run.json; critic/rounds/round-19/evidence/gaps/actfade-ffx2-bahamut-2000x1012-{active,wait}-live35/run.json; critic/rounds/round-19/evidence/gaps/fm-seymour-natus-2000x1012/sensor-rects.json; critic/rounds/round-19/evidence/ffx2-bahamut-lose/11-advisor.png; critic/reviews/ef3f6bbf-focused/route/ffx2-bahamut-win-keys2000/11-advisor.jpg
- **Confidence:** high for the measurement and the regression; medium for the cause
- **Requirement:** CHK-008; rubric interface: readable values, honest intent; D-316 gate
- **File and line:** src/engine/fx/mix/hudPanels.ts:20-21 skips the intent slab (eint__), the moves card (mad__) and the Sensor card (ffx-sensor); src/ui/ffx2/actionFade.ts fades any card that meets the acting figure (suspected chain)
- **Smallest fix:** Count the intent slab, the moves card and the Sensor card as obstacles in the colossus clearance (or re-place them against the boss's projected quad), and do not fade the cards while a command menu is open.
- **Acceptance check:** Same captures: card opacity stays 1 while awaitingMenu is true during Bahamut's actions; Sensor coveredFrac for Natus <= 0.05 with the card shown; the guide keeps its reason line at 1600x900 and 2000x1012.
- **Introduced by candidate:** true
- **Regression vs live:** true
- **In a new feature:** false
- **Note:** Severity: the gap pass proposed major. The chief grades it polish: the cards return within 0.6 s, nothing shown is wrong, and every control stays usable (RUBRIC section 8 major = wrong information, unusable controls, severe deviation, missing content). It is a regression against live and goes into the next batch with PR-0307, which shares its cause (the colossus masters).

### 12. PR-0251 [polish, interface] (carried, re-measured at 4:3): at 1280x960 the battle HUD falls to 9.3-9.8 px effective with 32-35 visible elements under the 14 px floor

- **Game:** both
- **Chapter / state:** Ch I and Ch IV battle HUD; pause OPTIONS on a phone
- **Expected:** Zero text a player must read under 14 px effective at the CHK-002 viewports.
- **Observed:** Gap pass, fresh context at 1280x960: FFX min 9.8 px (32 elements under 14), FFX-2 min 9.3 px (35 under 14): CTB names 10.8 px, item badges 12.9 px, HP denominators 12.4 px, OD 9.8 px. At 2560x1080 the minimum is 13.6-13.9 px with 3-7 elements under 14; 2560x1440 menus 13.8 px with 2 under 14 (the coach footer).
- **Repro and seed:** node critic/rounds/round-17/cap/gaps/sweep.mjs <chapter> <WxH> [touch]
- **Evidence:** ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-1280x960/run.json","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-ffx2-bahamut-1280x960/run.json","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-2560x1080/run.json"]
- **Confidence:** high
- **Requirement:** CHK-003; PR-0251 acceptance (text part)
- **Smallest fix:** Floor the stage-scaled HUD labels at 14 px effective (CTB names, badges, OD, FFX-2 job and max-HP spans), and raise the phone pause .pause__k / .pause__v / .pause__tab to 14 px.
- **Acceptance check:** sweep.mjs reports under14 = 0 for the battle HUD at 1600x900, 1280x960 and 390x844, and for every pause tab at 390x844.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19 gap pass (1280x960, real keys): text down to 9.34 px (FFX-2) and 9.8 px (FFX), the moves card wraps NEXT BEST MOVE into a column, and the new framing reports live.ok=false with Ch I Yuna 25 % and Ch IV Yuna/Paine 13 % under the HUD (live not measured at 4:3, so the figure part is unknown vs live). 2560x1080, 2560x1440 and 3840x2160 pass the floor. The gap pass proposed major; kept at polish because the text measurement equals round 18b's and 4:3 is one rotating shape.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 13. PR-0313 [polish, feel] (new; R19-FN-01): the FFX-2 dressphere close shot can hold through an enemy action, so the attacker is off camera (seen once; 0 of 12 in the gap pass)

- **Game:** FFX-2 only
- **Chapter / state:** XVI ffx2-ixion-djose (route run)
- **Expected:** An action's actor and target are both readable; a held cosmetic shot does not hide an HP-changing enemy action.
- **Observed:** Route run: Ixion's hit on Paine (363) lands inside Rikku's close shot with Ixion out of frame, and a 783 numeral appears at the frame edge before the cut back at 1.87 s. Gap pass: 12 spherechanges in 6 runs, no enemy action inside a held shot.
- **Repro and seed:** Ch XVI seed 1, 1600x900, keys: play to Rikku's first Change (Black Mage) with DRESSPHERE SHOT on; watch 2.4 s after confirm.
- **Evidence:** critic/rounds/round-19/evidence/ffx2-ixion-djose-win/seq-spherechange (f03-f08); critic/rounds/round-19/feel-narr/ixion-sc-zoom.jpg; critic/rounds/round-19/evidence/gaps/sc-ffx2-ixion-djose-1600x900-s1/run.json
- **Confidence:** high for the one observation; frequency low
- **Requirement:** RUBRIC section 6 feel (coherent camera); D-316
- **File and line:** src/engine/fx/mix/heldShots.ts:112-119 (hand-back covers menu-open, switch-off and quiet/age, not another actor's action-start); traced, not run
- **Smallest fix:** Hand the shot back at the first action-start of any actor other than its subject.
- **Acceptance check:** Per-frame phase log over Ch IV and XVI spherechanges: every enemy action-start/damage frame shows the master framing with that enemy in frame.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 14. PR-0314 [polish, feel] (new, gap pass): the DRESSPHERE SHOT usually plays as a 0.5 s cut-in-cut-out or not at all, and never on the phone

- **Game:** FFX-2 only
- **Chapter / state:** IV, VI, XIII, XVI
- **Expected:** When it fires, a held close shot of at least its 1.6 s minimum (D-316 spec), or no cut at all.
- **Observed:** Wait ATB, 12 changes: held 0.47-0.62 s in 5, >= 1.38 s in 2 (1.6 s met once), no shot in 6 (a menu already open, or no framing passed at 2560x1440). Phone 390x844: 0 of 2 (twirl keys still play on the master).
- **Repro and seed:** node critic/rounds/round-19/gapcap/sc.mjs <chapter> <size> 1
- **Evidence:** critic/rounds/round-19/evidence/gaps/sc-*/run.json; critic/rounds/round-19/evidence/gaps/sc-ffx2-bahamut-390x844-s1-touch/run.json
- **Confidence:** medium
- **Requirement:** D-316 DRESSPHERE SHOT; feel
- **File and line:** src/engine/fx/mix/heldShots.ts (sc minimum hold 1.6 s vs menu-open hand-back)
- **Smallest fix:** Do not cut to the shot unless it can hold its minimum (skip it when a menu is due within 1.6 s); say on the EYE CANDY page if the phone never plays it (it already says OFF HERE for some parts).
- **Acceptance check:** No sc run shorter than 1.6 s in the same captures; the phone either plays it or the page says OFF HERE.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 15. PR-0318 [polish, visual] (R19-VIS-07 + FR-35-02 + gap-pass KO capture): party status rows overlap party legs and KO'd bodies; in Ch I at 1600x900 Yuna's KO collapse lands almost entirely behind the status panel

- **Game:** both
- **Chapter / state:** I seymour-flux (KO Yuna, 1600x900 and 2000x1012), XVIII sin-face (Wakka), II yunalesca (Auron) mid-fight
- **Expected:** Party figures, standing or down, clear of the status rows except the declared command-stack overlap.
- **Observed:** Status slabs cover legs and lower bodies (no face covered); after the KO collapse only Yuna's hair ornament shows above the Tidus row (gaps f30).
- **Repro and seed:** setSeed(1), real keys to Ch I at 1600x900; Attack each turn until Lance of Atrophy KOs Yuna.
- **Evidence:** critic/rounds/round-19/evidence/gaps/ko-seymour-flux-1600x900/seq/f30.jpg; critic/rounds/round-19/evidence/sin-face-win/23-midfight.png; critic/rounds/round-19/visual/zoom-flux-held-f12.jpg; critic/reviews/ef3f6bbf-focused.json FR-35-02
- **Confidence:** high
- **Requirement:** CHK-008; D-316 KO collapse
- **File and line:** src/engine/fx/mix/hudPanels.ts / clearance.ts (status-row box and the downed pose footprint not counted; suspected)
- **Smallest fix:** Add the status-row box and the downed pose's footprint to the HUD-free area the masters fit into.
- **Acceptance check:** CHK-008 matrix at 1600x900 and 2000x1012: party clear of the status rows; Yuna's KO pose >= 80 % clear of the panel.
- **Introduced by candidate:** unknown
- **Regression vs live:** false
- **In a new feature:** false

### 16. PR-0261 [polish, harness] (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- **Game:** both (tooling)
- **Chapter / state:** all phone routes
- **Expected:** contexts.touch.blocked names the element that intercepts the tap.
- **Observed:** The run.json files of ffx2-den-of-woe-win and -stall-{cand,fxoff,pacecurrent,confirmer} say outcome 'victory', although the chain never finished; runs-summary.json repeats it; only index.json's note says soft-lock. Round 17's reticle-interception-as-timeout part is unchanged.
- **Repro and seed:** Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- **Confidence:** high
- **Requirement:** CHK-016 evidence integrity
- **Smallest fix:** Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- **Acceptance check:** A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19 widened: (1) route19k holds Enter for 4 s whenever the screen is a cutscene after results, which fast-forwards the post-battle scene (hold-to-skip 550 ms) and produced a false "scene runs with no input" major, refuted by the confirmer; (2) the Leblanc seed-1 Wait-mode stall when the remembered submenu differs from the advisor's; (3) every Swordplay/Bushido is confirmed with Enter after 3 s (correctInputs 0); (4) battleLog() at results holds no outcome event. Fix the harness before round 20.
- **Note:** New instance (merged with the delivery auditor's note): route-fight.mjs:265 read battleLog() holding link 2's per-link victory, so two XV defeats were first logged as "victory"; repeated attempts also overwrite frames (20-link-2.png, 24-seam-2-first-menu.png). The gap pass caught it from the results text ("Defeat"). No verdict here rests on the mislabelled lines.

### 17. PR-0104 [polish, feel] (carried, 4th review, STALLED): under Wait, a confirmed FFX-2 support command (Shell) shows nothing but a cast pose; the next menu opens at 2.27 s

- **Game:** FFX-2
- **Chapter / state:** IV ffx2-bahamut (1600x900) and VI ffx2-leblanc (2000x1012); XVI on 390x844 shows only a help line
- **Expected:** A confirmed command gets immediate visible acknowledgement, such as its name chip over the actor or a charge cue, while it waits for its turn.
- **Observed:** Gap pass, 100 ms frames from White Magic > Shell > All allies (Wait, keys): no frame from 0 to 2.2 s shows 'Shell' anywhere; Yuna takes her cast pose; the next menu opens at 2.27 s (round 17: 1.8 s).
- **Repro and seed:** Candidate 1a6fd3cc, Ch IV at 1600x900, seed 1: Yuna, White Magic, Shell, All allies.
- **Evidence:** ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/contact-shell.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/seq-shell-confirm-100ms/"]
- **Confidence:** high on what is shown; FFX-2 charge time itself is canon
- **Requirement:** RUBRIC §6 feel (input-to-response)
- **Smallest fix:** Under Wait, show the queued command's name chip over the actor at confirm (FFX-2 only), kept until the action starts.
- **Acceptance check:** A frame within 300 ms of the confirm shows the command name on or next to the actor, at 1600x900 and 390x844.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: still reproduces in Ch IV (Shell visual about 2.36 s after the sequence starts; round 18 2.27 s).
- **Note:** Reused from round 18 (FFX-2 HUD and presenter unchanged in this diff).

### 18. PR-0061 [polish, feel] (carried, STALLED, now worse): hold-skip to the first usable menu takes 11.4-12.4 s at the new defaults, about 2.7 s longer than ?pace=current&cam=current (8.7-9.7 s)

- **Game:** both
- **Chapter / state:** Ch I, IV, VII at 1600x900
- **Expected:** Under 3 s.
- **Observed:** Gap pass, GPU idle (5 %), 3 runs each: default (steady pace, calm camera) Ch I 11406/11484/11497 ms, Ch IV 12157/11962/12368, Ch VII 11516/11608/11648; ?pace=current&cam=current Ch I 8681/8852/8999, IV 9686/9567/9600, VII 8781/8758/8763. The scene itself ends 1.1-1.5 s into the hold, so the rest is intro dolly and enemy-intro beats.
- **Repro and seed:** node critic/rounds/round-17/cap/gaps/latency17.mjs <chapter> --base=<url> --evidence=<dir>
- **Evidence:** ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/logs/","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/hold-seymour-flux-default-r1/run.json","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/hold-seymour-flux-current-r1/run.json"]
- **Confidence:** high
- **Requirement:** PR-0061 acceptance
- **Smallest fix:** After a hold-skip, skip or compress the intro dolly and enemy-intro beats regardless of the pace preset.
- **Acceptance check:** holdToFirstMenuMs < 3000 in I, IV and VII at the default settings.
- **Introduced by candidate:** true
- **Regression vs live:** true
- **In a new feature:** false
- **Round 19:** Round 19: entry length not improved (in-game time to the first menu unchanged or slightly lower in 15 comparable chapters).
- **Note:** Reused from round 18 (presenter, camera and pace code unchanged in this diff).

### 19. PR-0301 [polish, feel] (new; R18B-GAP2-05): FFX-2 chain seams hand control back about 2.5-3 s later than live 32, because the battle-start moment now runs 2.9-3.1 s instead of 0.6-0.75 s

- **Game:** FFX-2 (every chain seam measured: XV and XI)
- **Chapter / state:** XV ffx2-den-of-woe and XI ffx2-fallen-aeons, seams
- **Expected:** A seam no slower than live, unless the longer opening is an approved end-state choice.
- **Observed:** Same lane on both builds (setSeed 1, labelled Stop and hasten injection), seam -> first party menu: XV live 13.3 / 14.5 s vs candidate 15.8 / 17.4 s; XI live 13.2 / 13.8 s vs candidate 16.1 / 16.4 s. moment:battle-start: live 617-752 ms, candidate 2,862-3,114 ms (2,238 ms with OS reduced motion). The rest of the hand-back (ATB refill plus one enemy action) matches live.
- **Repro and seed:** critic/rounds/round-18b/cap/gaps/sSeamStop2.mjs ffx2-den-of-woe and ffx2-fallen-aeons, setSeed(1), 1600x900; --base=https://baileypillon.github.io/pyrefly-reprise/ for live 32.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-live32-ffx2-den-of-woe-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-live32-ffx2-fallen-aeons-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-default-ffx2-den-of-woe-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-cand-ffx2-fallen-aeons-1600x900/run.json
- **Confidence:** high for the timing; cause not traced
- **Requirement:** RUBRIC section 6 feel (responsive input, smooth transitions)
- **File and line:** not traced; suspected: the slide-in that the PR-0281 fix now lets finish, or the steady pacing / calm camera defaults of the release-33 line
- **Smallest fix:** Trace which change lengthened moment:battle-start. If it is the intended look, show Bailey the A/B frames and record the decision; otherwise bring it back to about 0.6 s or open input during it.
- **Acceptance check:** Same lane on the next candidate: moment:battle-start at most 1 s, or a recorded decision approving the longer opening; seam -> first menu within 0.5 s of live.
- **Introduced by candidate:** true
- **Regression vs live:** true
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Polish: about 2.5 s more per seam on a 13-17 s hand-back. A question for Bailey if the longer opening is intended.

### 20. PR-0300 [polish, feel] (new; R18b-FN-01 + R18B-GAP2-04): at every Chapter XV link seam the painted cave plate stops short of the right edge, leaving a black band (21-25 % of the width for about 1.1 s, still about 8 % at 2.5 s); live 32 is full-bleed

- **Game:** FFX-2 only (seen in XV; VI shows a 6-7 % margin for about 1 s; VIII, XIII and XIV fill the frame)
- **Chapter / state:** XV ffx2-den-of-woe, seams link 1->2 and 2->3, moment:battle-start
- **Expected:** The scene plate fills the frame at every camera rest of the seam, as on live.
- **Observed:** In 13 of 13 seam sequences on the candidate (real keys and injected lanes; 1600x900 and 2000x1012; with or without a Stopped girl), frames from 0.05 to 0.76 s have no column with mean luma above 6 past 75-79 % of the width; the plate ends in a hard vertical edge with black beyond it. Live 32 (bundle ChAAAZ-I), same seed and lane, and live 31a cover the frame for the whole sequence. Present already in 65152c1b, where the PR-0281 freeze hid it.
- **Repro and seed:** setSeed(1), 1600x900, Ch XV by advisor keys to the link 1->2 seam (route18d.mjs seq-seam-2), or critic/rounds/round-18b/cap/gaps/sSeamStop2.mjs with and without --q=cam=current; 8 frames every 350 ms from the link change.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/feel-narr/den-seam-f00-cand-vs-live31a.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-default.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-camcur.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-live32.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-seq-seam-2/
- **Confidence:** high for the observation (per-column luma on every frame, A/B against live 32); cause not traced
- **Requirement:** RUBRIC section 6 feel (coherent camera, smooth transitions) and visual (correct rendering); CHK-002 coverage. Scored once, under feel.
- **File and line:** not traced; the gap pass ruled the calm camera out (?cam=current shows the band too, plate edge at x~1270 at 366 ms; default camera edge at x~1470 at 1.8 s)
- **Smallest fix:** Find which plate or scale change since live 32 shortened the den floor plate at this framing; extend or scale the plate to cover the battle-start moment's widest framing, or clamp the moment camera to the plate bounds. Do not replace the approved painting.
- **Acceptance check:** Ch XV seams 1->2 and 2->3 at 1600x900 and 2000x1012, seeds 1 and 2, both camera modes: in every frame the rightmost column with mean luma above 6 is at least 95 % of the width.
- **Introduced by candidate:** true
- **Regression vs live:** true
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Polish, not major: about a second at one chapter's two seams, with the frame filling as the camera settles. Introduced by the release-33 line (already in 65152c1b), not by the r33-fix diff.

### 21. PR-0321 [polish, interface] (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor

- **Game:** both
- **Chapter / state:** any (pause > OPTIONS > EYE CANDY) at 390x844
- **Expected:** CHK-003: no player text under 14 css px at 390x844.
- **Observed:** 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
- **Repro and seed:** 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
- **Evidence:** critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
- **Confidence:** high
- **Requirement:** CHK-003
- **File and line:** src/ui/common/pause-screen.css:824-825 (--pu-fs:12px; --pu-fs-v:13px, an authored phone exception)
- **Smallest fix:** Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
- **Acceptance check:** ecfont at 390x844 in both games: under14 empty, no clipping.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Note:** The new page inherits the pre-existing phone pause floor; the capture owner filed it as minor/new, the interface auditor as a pre-existing exception. One issue.

### 22. PR-0315 [polish, feel] (new; R19-VIS-06): the twirl keys crossfade, leaving a semi-transparent double image of two paintings for about 0.2 s

- **Game:** FFX-2 only
- **Chapter / state:** ffx2-fallen-aeons, ffx2-trema (seq-spherechange f01)
- **Expected:** Cuts on the beat or matched silhouettes between keys (as the 2026-10-01 visual pass recommended).
- **Observed:** Between keys the old and new paintings show at once at partial opacity, so the girl reads as a ghosted double.
- **Repro and seed:** Candidate, seed 1, Ch XI or XIII, CHANGE a dressphere.
- **Evidence:** critic/rounds/round-19/visual/st-spherechange-chapters.jpg
- **Confidence:** medium
- **Requirement:** feel: smooth transitions; VP-1001-20
- **File and line:** src/engine/fx/mix/twirl.ts (key-to-key crossfade; suspected)
- **Smallest fix:** Cut on the beat, or crossfade in 60 ms or less.
- **Acceptance check:** A 60 fps strip shows no frame with two key paintings both above 20 % opacity.

### 23. PR-0317 [polish, visual] (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900

- **Game:** FFX only
- **Chapter / state:** I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03)
- **Expected:** A boss in action stays inside the frame (CHK-014).
- **Observed:** His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
- **Repro and seed:** Candidate, seed 1, 1600x900, Ch I, let Seymour act.
- **Evidence:** critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
- **Confidence:** high
- **Requirement:** CHK-014; CHK-013
- **Smallest fix:** Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
- **Acceptance check:** Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.

### 24. PR-0316 [polish, visual] (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera

- **Game:** FFX-2 only
- **Chapter / state:** IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012
- **Expected:** The boss's face reads clearly in his signature framing.
- **Observed:** The lamp sits behind his head; a white haze covers neck and crest (round 18 showed the head clearly). White rim fringe on the wings remains (VP-1001-17/18).
- **Repro and seed:** Candidate, seed 1, Ch IV, first menu.
- **Evidence:** critic/rounds/round-19/visual/zoom-bahamut-head-1600.jpg; critic/rounds/round-19/visual/zoom-bahamut-head-r18.jpg
- **Confidence:** medium
- **Requirement:** visual: recognisability, lighting
- **Smallest fix:** Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
- **Acceptance check:** Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.

### 25. PR-0324 [polish, interface] (new finding, pre-existing): Kimahri's Ronso Rage rows are described as "timed input", which they are not

- **Game:** FFX only
- **Chapter / state:** any chapter with Kimahri (seen in I)
- **Expected:** The project's own data: "No timed input; a picker only" (src/battle/common/types.ts:1457).
- **Observed:** Help line "Damage · timed input" under JUMP / MIGHTY GUARD / WHITE WIND.
- **Repro and seed:** Ch I seed 1, 1600x900: Kimahri with a full gauge > Overdrive; read the help slab.
- **Evidence:** critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f12.jpg
- **Confidence:** high
- **Requirement:** interface: honest information; AGENTS.md rule 6
- **File and line:** src/engine/tactics/advisor.ts:653 (pushes "timed input" whenever def.minigame is set; the rages carry minigame "kimahri-rage")
- **Smallest fix:** Skip the phrase for the kimahri-rage kind.
- **Acceptance check:** Unit test: no Ronso Rage description contains "timed input"; Swordplay still does.
- **Introduced by candidate:** false
- **Regression vs live:** false

### 26. PR-0322 [polish, onboarding] (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey

- **Game:** both
- **Chapter / state:** pause > OPTIONS > EYE CANDY
- **Expected:** Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
- **Observed:** FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
- **Repro and seed:** Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
- **Confidence:** high (contrast estimated from JPEG)
- **Requirement:** D-317; CHK-003
- **Smallest fix:** Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
- **Acceptance check:** After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 27. PR-0323 [polish, onboarding] (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")

- **Game:** both
- **Chapter / state:** pause > OPTIONS > EYE CANDY
- **Expected:** Copy a first-time player understands (CHK-007).
- **Observed:** CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
- **Repro and seed:** Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
- **Confidence:** high
- **Requirement:** CHK-007
- **Smallest fix:** Name the thing: "Off: the standard battle camera", "Off: the plain splash".
- **Acceptance check:** No "today" in the page's help strings; capture at 1600x900.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 28. PR-0320 [polish, visual] (new): during the first CHANGE, the first-time Rikku coach line covers part of the dressphere close shot

- **Game:** FFX-2 only
- **Chapter / state:** IV ffx2-bahamut, first CHANGE
- **Expected:** The held close shot reads cleanly.
- **Observed:** "GAUGES RUNNING · A COMMAND HOLDS THEM" sits over the right of the shot while Yuna twirls (about 0.8 s).
- **Repro and seed:** 2000x1012, seed 1, first girl's turn > CHANGE > Black Mage.
- **Evidence:** critic/rounds/round-19/evidence/vis-ffx2-bahamut-2000x1012/seq-dressphere-shot/f01.jpg-f03.jpg
- **Confidence:** high
- **Requirement:** D-316 dressphere shot readability
- **Smallest fix:** Hold a first-time coach line until the shot cuts back.
- **Acceptance check:** Frame sequence of the first CHANGE shows no coach box inside the shot.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 29. PR-0326 [polish, audio] (new finding, pre-existing): the first sound of every session is the procedural synth: the title's press-start "battle-start" plays before either sprite has decoded

- **Game:** both
- **Chapter / state:** title screen
- **Expected:** No cue falls back to the synth path (CHK-001 step 3); the first sound is the sprite or nothing.
- **Observed:** 27 of 27 runs: sfxLog[0] = {asked: battle-start, via: synth} at AudioContext time 0.10-0.21 s; the same in the r34 and r35 focused logs.
- **Repro and seed:** Fresh profile, candidate at 1600x900: press Enter on the title; read the audio debug sfxLog[0].
- **Evidence:** critic/rounds/round-19/evidence/seymour-flux-win/audio-debug.jsonl; critic/reviews/ef3f6bbf-focused/route/seymour-flux-win-keys1600/audio-debug.jsonl
- **Confidence:** high (data read; nobody listened)
- **Requirement:** CHK-001 step 3; Bailey 2026-09-18 "audio is arcade-y"
- **File and line:** src/app/screens/TitleScreen.ts:195 (audio.playSfx("battle-start") on press-start)
- **Smallest fix:** Wait for the sprite decode before the press-start cue, or play nothing on that first press.
- **Acceptance check:** sfxLog shows no via:synth entry in a fresh-profile run.
- **Introduced by candidate:** false
- **Regression vs live:** false

### 30. PR-0327 [polish, delivery] (new; R19-PD-01): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; on a cold or slow cache the outfit can land before the keys (builder-stated, not captured)

- **Game:** FFX-2 only
- **Chapter / state:** every FFX-2 chapter, first spherechange
- **Expected:** Keys present when the twirl plays, or a clean fallback.
- **Observed:** Den of Woe seed 3 requested 12 twirl-*.png only at Rikku's change; throttled behaviour not captured.
- **Repro and seed:** Cold profile, 10 Mbit/s, Ch IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
- **Evidence:** critic/rounds/round-19/evidence/ffx2-den-of-woe-win-s3/network-media.json; D:/pyrefly-rel26c/docs/handoff/r36-art.md
- **Confidence:** medium
- **Requirement:** delivery: measured loading
- **Smallest fix:** Prefetch the party's twirl keys at battle start (idle priority).
- **Acceptance check:** Throttled capture shows no outfit-before-keys pop.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 31. PR-0259 [polish, delivery] (carried, improved): isolated frame-time spikes of 66-117 ms in fights

- **Game:** both
- **Chapter / state:** sin-face, seymour-flux, ffx2-ixion-djose
- **Expected:** No visible hitch in the fight.
- **Observed:** Maximum spikes of 116.7 ms (XVIII, 4 frames over 50 ms), 83 ms (I) and 66.5 ms (XVI phone tier), with fx on and off alike. Average 59-60 fps, p95 16.7-16.8 ms. Round 17 measured 150-217 ms.
- **Repro and seed:** critic/rounds/round-18/cap/perf18.mjs, cold profile, GPU mostly idle (21 % / 8 %).
- **Evidence:** critic/rounds/round-18/evidence/perf/*.json
- **Confidence:** medium
- **Requirement:** RUBRIC §2 (report spikes)
- **File and line:** fight playing, 20 s windows
- **Smallest fix:** Profile the spike frames (likely first-use shader compiles or texture uploads) and pre-warm them.
- **Acceptance check:** Maximum frame time under 50 ms in the same windows.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: not measured by the critic (parallel lanes). Builder probe (not evidence): Ch I max 116.7 -> 166.7 ms; Ch V battle-start longest frame 348 -> 625 ms; p95 16.8 ms. Gap pass: rAF p95 16.7 / max 16.8 ms through one Swordplay input and one Bushido held shot.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 32. PR-0240 [polish, delivery] (downgraded major -> polish after a measurement): a cold chapter entry at 10 Mbit/s reaches the first menu at 52 s (15.5 s unthrottled); the V0 music adds only about 2-3 s of it

- **Game:** both
- **Chapter / state:** all
- **Expected:** A first battle within the platform load goal on named slow-network conditions (RUBRIC section 2: a load under 5 s).
- **Observed:** Confirmer, headless gpu, CDP throttling 10 Mbit/s down + 40 ms, cache cleared, Ch I 1600x900, from Enter on the chapter card: first command menu 52.0 s throttled vs 15.5 s unthrottled; boss-seymour playing at 32.6 s vs 6.2 s. Chapter entry fetched two music files (scene-gagazet 3.10 MB, boss-seymour 2.96 MB), about 4.8 s at 10 Mbit/s; live's encode would be about 2.4 s. The rest of the 36 s penalty is art that is identical to live. The music growth was approved by Bailey (D-292) and is within the 85 MB audio budget (80.93 MB; D-306 raises it to 90). RUBRIC names a five-second load goal but no cold slow-network budget.
- **Repro and seed:** critic/rounds/round-18b cap/confirm cold10 script: cold profile, CDP 10 Mbit/s + 40 ms, Ch I at 1600x900, time from Enter on the chapter card to the first menu and to the battle cue.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/cold10-seymour-flux/cold10.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/warmnet-seymour-flux/cold10.json; D:/Final Fantasy/critic/rounds/round-18b/audio/qa-strict.txt
- **Confidence:** medium (one run each; toBattle's fixed waits add the same overhead to both)
- **Requirement:** RUBRIC §2 platform goals; §6 delivery (measured loading)
- **File and line:** chapter entry on a cold cache
- **Smallest fix:** Start the battle before every chapter plate has arrived (progressive art: a low-resolution plate first), and defer the boss cue behind the SFX sprite. Measure the art share first.
- **Acceptance check:** A named 10 Mbit/s cold run per game: first menu within a budget Bailey sets (none exists today), and the music share recorded.
- **Introduced by candidate:** false
- **Regression vs live:** unknown
- **In a new feature:** false
- **Round 19:** Round 19: not re-measured; the candidate adds about 41 MB of shipped files, mostly twirl keys fetched later.
- **Note:** Merged the audio auditor's and the delivery auditor's PR-0240 entries into this one. Downgraded: the confirmer refuted "music over budget" as framed; the slow entry is art-dominated and exists on live too, and the ~2-3 s music share is an owner-approved size.

### 33. PR-0032 [polish, onboarding] (carried, weight up): no REDUCE FLASHES row and no key remapping, while the new default look adds ink impact frames and lens flares; the soft-flash path exists but reads a setting no row writes

- **Game:** both
- **Chapter / state:** all
- **Expected:** A player-reachable flash reduction when the default look flashes. Remapping stays a Bailey decision.
- **Observed:** The spectacle defaults on:
- Up to 3 ink impact frames per rolling second (SpectacleRules FlashBudget).
- Lens flares (LensFlare).

A 'soft' impact frame and a 0.35 flare peak exist behind eyeCandy.reduceFlashes, but fxEnv reads a 'reduceFlashes' setting that no row writes (settingsAtBoard has no such key). The workarounds are REDUCE MOTION (removes impact frames) or turning off BATTLE SPECTACLE and CINEMA LIGHT, and none of those rows mentions flashes. Remapping is still absent.
- **Repro and seed:** Pause OPTIONS in either game: there is no flash row.
- **Evidence:** D:/pyrefly-rel26c/src/engine/fx/c/SpectacleRules.ts:43,181,201; src/app/fxEnv.ts:41; round-18/evidence/fxrows-*/run.json settingsAtBoard
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding (motion and flash accommodations); D-220 Q7 undecided
- **File and line:** pause OPTIONS; battle with BATTLE SPECTACLE and CINEMA LIGHT on (default)
- **Smallest fix:** Ask Bailey (D-220 Q7). If yes, add a REDUCE FLASHES row writing settings.reduceFlashes. Until then, name the flash in the BATTLE SPECTACLE row's help.
- **Acceptance check:** A row toggles reduceFlashes by keys, mouse and taps. With it on, impactFrame is 'soft' and the flare peak is 0.35. It persists across a reload.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: still no REDUCE FLASHES row or remapping while this build adds held shots, splash art and impact frames; the soft-flash path reads a flag no row writes (src/app/fxEnv.ts:41).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 34. PR-0263 [polish, audio] (carried, downgraded major -> polish; friends' "no attack SFX"): the fix is delivered by D-293 (SFX b, bus 0.70 in 185/185 samples; a hit's true peak now ~1.5 dB under the music's, was ~7.5 dB) but no ear has confirmed it

- **Game:** both
- **Chapter / state:** all battles
- **Expected:** D-293 balance b: effects +6 dB against D-210, so a hit lands about level with the music's peaks.
- **Observed:** The runtime SFX bus is 0.70 in 185 of 185 candidate samples. Measured, not heard: a hit's true peak now sits about 1.5 dB under the music's true peak (hit-1 at -1.02 dBTP x0.7 bus x0.8 cue volume, against music at -1.5 dBTP x0.7). It was about 7.5 dB under. The whiff's 400 ms momentary sits about 7.5 dB under the battle music's median (it was about 13.5 dB under). The two estimates use different windows, so they do not compare directly.
- **Repro and seed:** Default profile, any chapter: land an attack and a miss. Read the audio debug sfxMix, and see src/engine/BattlePresenterBeats.ts:130 and BattlePresenterEvents.ts:229.
- **Evidence:** evidence/*/audio-debug.jsonl; critic/rounds/round-17/audio-r17-sfx-vs-music.json (reused, dependency: the sprite is sha-identical and the music loudness is within 0.02 LU)
- **Confidence:** medium
- **Requirement:** D-293; CHK-B1
- **Smallest fix:** None in code. Ask Bailey or the friends to confirm by ear that hits now read over the music. If the miss still disappears, consider the miss cue's own volume of 0.5.
- **Acceptance check:** An owner or playtester ear note says the attack SFX are audible at the default settings.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 35. PR-0319 [polish, visual] (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line

- **Game:** FFX only
- **Chapter / state:** IX yojimbo-cavern, first menu 2000x1012
- **Expected:** Background staging reads as background.
- **Observed:** Under the colossus master the far-back figure stands on the party's line at party scale.
- **Repro and seed:** Candidate, seed 1, Ch IX first menu.
- **Evidence:** critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
- **Confidence:** low
- **Requirement:** visual: composition
- **Smallest fix:** Push the prop deeper or dim it under the colossus master.
- **Acceptance check:** In the first-menu frame Ginnem sits clearly behind the line or out of view.

### 36. PR-0325 [polish, interface] (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot

- **Game:** FFX only
- **Chapter / state:** I seymour-flux, 1600x900
- **Expected:** The selected row is obvious (CHK-010).
- **Observed:** 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
- **Repro and seed:** Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
- **Evidence:** critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
- **Confidence:** medium-low
- **Requirement:** CHK-010
- **Smallest fix:** If confirmed, give the selected row the filled slab of the main list.
- **Acceptance check:** Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown

### 37. PR-0302 [polish, interface] (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- **Game:** both
- **Chapter / state:** I (Zombie), IV (Curse); any hinted status
- **Expected:** CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- **Observed:** Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- **Repro and seed:** critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- **Confidence:** high (measured)
- **Requirement:** CHK-003; RUBRIC section 5 (effective text size)
- **File and line:** src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- **Smallest fix:** Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- **Acceptance check:** Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.

### 38. PR-0303 [polish, interface] (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- **Game:** FFX (FFX-2's shorter target card leaves room: 0 px2)
- **Chapter / state:** I seymour-flux, a target step with a hinted status (Zombie)
- **Expected:** The target-step instructions and the hint do not overlap (CHK-008).
- **Observed:** 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- **Repro and seed:** Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- **Confidence:** high
- **Requirement:** CHK-008; PR-0282 acceptance (the hint never over the command surface)
- **File and line:** src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- **Smallest fix:** Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- **Acceptance check:** 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.

### 39. PR-0304 [polish, interface] (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- **Game:** FFX-2 (desktop, guide open)
- **Chapter / state:** IV ffx2-bahamut, the girls' menus after Curse lands
- **Expected:** While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- **Observed:** At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- **Repro and seed:** Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- **Confidence:** medium (symptom high; cause suspected)
- **Requirement:** Status O3 target (the hint in the guide's slot); CHK-008
- **File and line:** suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- **Smallest fix:** Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- **Acceptance check:** 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.

### 40. PR-0305 [polish, onboarding] (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- **Game:** FFX-2 (the FFX help line follows each actor in both modes)
- **Chapter / state:** IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
- **Expected:** The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- **Observed:** Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- **Repro and seed:** 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- **Confidence:** medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- **Requirement:** CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- **File and line:** suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- **Smallest fix:** Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- **Acceptance check:** BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- **Introduced by candidate:** false
- **Regression vs live:** unknown
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.

### 41. PR-0291 [polish, interface] (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- **Game:** FFX
- **Chapter / state:** I
- **Expected:** As in the approved O3 target, both panels are readable.
- **Observed:** The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- **Repro and seed:** Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- **Confidence:** high
- **Requirement:** approved target O3 / interface readability
- **File and line:** 1600x900 Items list aimed at a Zombie
- **Smallest fix:** Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- **Acceptance check:** No overlap between .stwarn and the Guide card rect in that frame.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Re-observed on f302f163 and widened (visual auditor): at 1600x900 with the guide open, the red Zombie warning slab and also the grey TALK help slab ("A one-off action this encounter offers") overprint the Guide card's NEXT "Holy Water -> Yuna" line. Round 18's frame is identical.

### 42. PR-0286 [polish, interface] (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- **Game:** FFX
- **Chapter / state:** Ch I
- **Expected:** The message and the dialogue text do not overlap.
- **Observed:** 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- **Repro and seed:** 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- **Confidence:** medium
- **Requirement:** CHK-008
- **File and line:** 390x844, a status lands while a battle line is on screen
- **Smallest fix:** Offset the message line below the banner while a line is up, or queue it until the line ends.
- **Acceptance check:** Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Widened by the gap pass (merged R18B-GAP2-06): at 1280x960 FFX desktop, "Kimahri was hasted." (371 px2) and then "Yuna became a Zombie." (568 px2) overlap the visible dialogue text for about 2.5 s (13 samples at 200 ms); no overlap at 1600x900, 2000x1012, 2560x1080 or 3840x2160. On the FFX-2 phone the new floor (withStatusLooks.ts) moves the message clear of the docked hint within one 200 ms sample. The FFX phone had 0 px2 of message over dialogue in 15 samples.

### 43. PR-0289 [polish, onboarding] (new, first run O2): step 1 says 'Start with the first one' while the spot sits on another selected chapter

- **Game:** both
- **Chapter / state:** chapter select, first run
- **Expected:** The words match the picture the spot points at, or the spot stays on Chapter I.
- **Observed:** The plate shows CHAPTER XVI Ixion while the slab reads 'Start with the first one. Tap its picture to begin.' This is a documented open item in firstrun-o2.md.
- **Repro and seed:** Fresh profile, 390x844. Choose Ixion on the board before tapping the plate.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/run.json
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding; approved O2 target (only Chapter I drawn)
- **File and line:** 390x844 and desktop board, guide step 1, a chapter other than I selected
- **Smallest fix:** Ask Bailey which: keep the spot on Chapter I, or reword to 'Tap its picture to begin.' without 'the first one'.
- **Acceptance check:** With a non-first chapter selected, the slab never says 'the first one'.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: re-confirmed (sin-fins-core-win/03-card.png).
- **Note:** Re-observed in all six real-flow runs on f302f163: O2 step 1 says "Start with the first one." while Chapter XV or IV is selected.

### 44. PR-0292 [polish, onboarding] (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- **Game:** FFX
- **Chapter / state:** I prep
- **Expected:** Every control has a key or pad route, and touch wording on touch screens.
- **Observed:** No key binding: Tab is WALK, A is Left. The phone explainer reads 'CLICK TWICE… press Enter… wheel to zoom' and 'Enter or click again'. On the phone the explainer's buttons start below the fold (one swipe reaches them).
- **Repro and seed:** Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- **Confidence:** high
- **Requirement:** onboarding: input access
- **File and line:** Sphere Grid tab
- **Smallest fix:** Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- **Acceptance check:** A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 45. PR-0288 [polish, interface] (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- **Game:** FFX
- **Chapter / state:** Ch I
- **Expected:** The full help sentence, wrapped if needed.
- **Observed:** 'TIDUS · Nothing left to say — A one-off action this enc…'
- **Repro and seed:** 390x844 Ch I after Talk is used up, cursor on TALK.
- **Evidence:** round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **File and line:** 390x844 command menu, TALK disabled
- **Smallest fix:** Allow two lines, or shorten the copy for the phone.
- **Acceptance check:** scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 46. PR-0293 [polish, visual] (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- **Game:** both
- **Chapter / state:** I, IV, VII, XVII, XVIII (every chapter checked)
- **Expected:** CHK-002: the pause painting covers the window at every supported size.
- **Observed:** Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- **Repro and seed:** Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- **Confidence:** high
- **Requirement:** CHK-002
- **File and line:** pause layer at 4K (the 3360x1920 master is not scaled to cover)
- **Smallest fix:** Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- **Acceptance check:** pauseRect.full is true at 3840x2160 in both games.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Confirmed on f302f163 by the gap pass: pauseRect [-4,-2,3368x1925] in FFX (kimahri.2x.webp 3360x1920) and [-4,-2,3369x1925] in FFX-2; full=false in both.

### 47. PR-0237 [polish, interface] (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- **Game:** FFX-2
- **Chapter / state:** Ch XVI, Ch IV
- **Expected:** The intent line stays readable.
- **Observed:** Rikku's line lies over 'IXION ACTS NEXT … MOST LIKELY 83%' and the random-target list, and over 'BAHAMUT ACTS NEXT … SCRIPTED'.
- **Repro and seed:** Fresh profile at 390x844, FFX-2 chapter, first menu.
- **Evidence:** round-18/evidence/ffx2-ixion-djose-win-touch/10-first-menu-coach.png; probe-ffx2-bahamut-390x844-touch-cand/10-status-hint-over-commands.jpg
- **Confidence:** high
- **Requirement:** CHK-008
- **File and line:** 390x844 first command menu
- **Smallest fix:** As in round 17.
- **Acceptance check:** Coach box ∩ intent box = 0 at 390x844.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 48. PR-0249 [polish, interface] (carried, widened): the FFX-2 intent card covers the girls at 1600x900, in multi-target (Yuna's lower body) and at Yuna's WHITE MAGIC list (Rikku's and Paine's heads)

- **Game:** FFX-2
- **Chapter / state:** IV Bahamut
- **Expected:** No panel over a face or a weapon.
- **Observed:** Heads are now clear. The intent card (x 10 to 385, y 560 to 880) sits over the White Mage's skirt and the end of her staff.
- **Repro and seed:** Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-1600x900/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-1600x900-osrm/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-x2-osrm-d02-paine.jpg
- **Confidence:** low
- **Requirement:** CHK-008
- **Smallest fix:** Add the projected party quads to the intent card's placement test while targeting.
- **Acceptance check:** Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Widened (merged R18b-VIS-01): in Ch IV at 1600x900 the default intent card also covers Rikku's head and Paine's head and torso while Yuna's WHITE MAGIC list is open, which hides Paine's Cursed darkening; the same with REDUCE MOTION on. Intent and camera code are unchanged in this diff.

### 49. PR-0250 [polish, interface] (carried, confirmed): the phone results location caption is clipped

- **Game:** FFX
- **Chapter / state:** Ch XII
- **Expected:** The full caption.
- **Observed:** 'INSIDE SIN — THE GARDEN C…'
- **Repro and seed:** Lose or win Ch XII at 390x844.
- **Evidence:** round-18/evidence/seymour-omnis-win-touch/31-results.png
- **Confidence:** high
- **Requirement:** CHK-009
- **File and line:** 390x844 results
- **Smallest fix:** As in round 17.
- **Acceptance check:** The caption's scrollHeight <= clientHeight + 1 at 390x844.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 50. PR-0296 [polish, interface] (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- **Game:** FFX
- **Chapter / state:** XVII sin-fins-core, first decisions
- **Expected:** CHK-008: plates never cover the intent text.
- **Observed:** Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- **Repro and seed:** 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- **Evidence:** ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/"]
- **Confidence:** medium (frames only)
- **Requirement:** CHK-008
- **File and line:** 390x844 battle HUD
- **Smallest fix:** Reserve the intent line's band from the range plate on the phone layout.
- **Acceptance check:** No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 51. PR-0295 [polish, prep] (new finding, outside the changed area): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed at 0.61 (tiny text), unlike CHAPTER and SPHERE GRID

- **Game:** FFX
- **Chapter / state:** party prep, any FFX chapter
- **Expected:** Every prep tab is usable at phone size (RUBRIC §6 device usability).
- **Observed:** Gap pass (sphere-phonetabs-390x844-touch): only CHAPTER and SPHERE GRID have a phone page; the other four tabs are the scaled desktop board.
- **Repro and seed:** 390x844 touch, Ch I prep, swipe through the tabs.
- **Evidence:** ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-phonetabs-390x844-touch/"]
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding/prep device usability; CHK-003
- **File and line:** 390x844 party prep tabs
- **Smallest fix:** Give the remaining prep tabs the phone page treatment Sphere Grid B introduced.
- **Acceptance check:** CHK-003 sweep of each prep tab at 390x844: no player text under 14 px.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: prep code unchanged; not re-captured.
- **Note:** Carried (prep code unchanged).

### 52. PR-0258 [polish, prep] (carried, re-confirmed): FFX victory spoils ignore the sourced x2-on-overkill drop quantity

- **Game:** ffx
- **Chapter / state:** seymour-anima-macalania
- **Expected:** The sourced overkill quantity (4), per round 17.
- **Observed:** OVERKILL x1 with 'ITEMS Ability Sphere ×3, Blk Magic Sphere'.
- **Repro and seed:** seymour-anima-macalania-win, seed 1, 1600x900, real keys.
- **Evidence:** critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json (resultsText)
- **Confidence:** high
- **Requirement:** AGENTS.md rule 6; RUBRIC §6 prep
- **File and line:** results after an OVERKILL win
- **Smallest fix:** Apply the sourced overkill drop multiplier in the results spoils.
- **Acceptance check:** The same run shows the sourced overkill quantity.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: Ch VII shows OVERKILL x1 with Ability Sphere x3; prep code unchanged.
- **Note:** Carried (data unchanged).

### 53. PR-0254 [polish, narrative] (carried, STALLED): Chapter VII Talk is still silent

- **Game:** FFX
- **Chapter / state:** VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- **Expected:** A Tidus line and Seymour's reply within 3 s of each Talk.
- **Observed:** The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- **Repro and seed:** Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- **Evidence:** critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- **Confidence:** high
- **Requirement:** narrative: banter and reachable character voice
- **Smallest fix:** Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- **Acceptance check:** The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: Talk at fight ms 4371 and 22724 still produces no line.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 54. PR-0255 [polish, narrative] (carried): Tromell's five aftermath lines in Chapter VII still have no speaker

- **Game:** FFX
- **Chapter / state:** VII aftermath (CONFIRM scene)
- **Expected:** The speaker 'Tromell' with a name plate.
- **Observed:** 'Step away from Lord Seymour, Lady Summoner.' and four more lines have speaker '' (dbox 376877-377023 ms).
- **Repro and seed:** Ch VII win, CONFIRM on results.
- **Evidence:** critic/rounds/round-18/feel-narr/dbox-all.txt
- **Confidence:** high
- **Requirement:** narrative: character voice
- **Smallest fix:** Add a 'tromell' speaker with a name plate and no portrait (like 'brother'), and move the lines to it.
- **Acceptance check:** The dboxTimeline shows speaker 'Tromell' on the five lines.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: Tromell's 5 lines still have speaker "".
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 55. PR-0272 [polish, narrative] (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- **Game:** FFX
- **Chapter / state:** XVII sin-fins-core, seam 1 -> 2
- **Expected:** A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- **Observed:** The line 'The Fahrenheit's cannon tears the fin away.' plays (567826 ms), then the seam shows an empty sky (46 ms), Sin fading in (410 ms) and 'Right Fin' at 1496 ms. There is no hit and no fin separation (2000x1012).
- **Repro and seed:** Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- **Evidence:** critic/rounds/round-18/feel-narr/sin-fins-core-win__seq-seam-2.jpg; dbox-all.txt
- **Confidence:** high
- **Requirement:** narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- **Smallest fix:** Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- **Acceptance check:** A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 56. PR-0256 [polish, feel] (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- **Game:** FFX-2
- **Chapter / state:** XVI aftermath, whistles 1 to 4
- **Expected:** A visible light, nearer on each whistle.
- **Observed:** The lines are unchanged ('A small gold light answers.' ... 'It runs ahead, over a bridge of light.'). The harness hold-skipped them 50 ms apart, so no plate frames exist for this build. Carried on the unchanged script and scene.
- **Repro and seed:** Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- **Evidence:** critic/rounds/round-18/feel-narr/dbox-all.txt (ffx2-ixion-djose-win)
- **Confidence:** medium
- **Requirement:** feel/narrative: shown, not told
- **Smallest fix:** A small gold mote fx step per whistle.
- **Acceptance check:** A timed capture after each whistle shows the light, nearer each time.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: Ch XVI whistles are still "" captions.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 57. PR-0279 [polish, encounter] (carried, a question for Bailey): Sin's difficulty is still undecided (D-282); nothing in the engine changed, so the r17 figures stand

- **Game:** FFX
- **Chapter / state:** XVII, XVIII
- **Expected:** Bailey's call on D-282
- **Observed:** Unchanged data and AI. Real keys lost 2/2 in each chapter this round.
- **Repro and seed:** r17 sin benches (reused, see reused)
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/combat/sin-bench-out.txt
- **Confidence:** high
- **Requirement:** encounter: correct difficulty
- **Smallest fix:** Ask Bailey
- **Acceptance check:** A decision is recorded in decisions.json
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: XVIII intended 19/80, v3 card 28/80; XVII v3 3/40 (22 losses at link 2, 13 at link 3); checkpoint on. D-282 still proposed.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 58. PR-0257 [polish, encounter] (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows (208 real-key turns this round, the same as round 17)

- **Game:** FFX
- **Chapter / state:** III
- **Expected:** The release note figure matches the measured length
- **Observed:** braskas-final-aeon-win: 208 turns, 24.3 min; the replay matches all 1,292 events
- **Repro and seed:** runs-summary.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/combat/ffx-replay.json
- **Confidence:** high
- **Requirement:** encounter pacing
- **Smallest fix:** Correct the note or ask Bailey
- **Acceptance check:** The note matches the bench
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: 220 real-key turns for all 7 links (208 in round 18); bench intended median 137.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 59. PR-0280 [polish, encounter] (carried): the v3 card's Chapter XII rate is unchanged (bench identical); the live v4 card covers it

- **Game:** FFX
- **Chapter / state:** XII
- **Expected:** n/a
- **Observed:** ffx-three-line-r18.json XII rows are identical to round 17
- **Repro and seed:** Run ffx-bench.test.ts
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- **Confidence:** high
- **Requirement:** advice usefulness
- **Smallest fix:** none needed now
- **Acceptance check:** n/a
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: bench byte-identical (24/40 and 18/40); real-key route won seed 1 in 119 turns.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 60. PR-0220 [polish, audio] (carried, downgraded major -> polish): an emulated pad-only run now unlocks audio on the first pad A (title, chapter-select, boss-seymour), but headless Chromium already had user activation, so a real Chrome with a real controller is not proven

- **Game:** both
- **Chapter / state:** all
- **Expected:** The first gamepad button unlocks the AudioContext, and the title or chapter-select music starts.
- **Observed:** Gap pass pad-only-seymour-flux-1600x900: standard-mapping virtual pad, no keyboard/pointer/touch events; after the first pad A ready:true, playing:'title'; board 'chapter-select'; first battle menu 'boss-seymour'. navigator.userActivation was already active in headless Chromium, so the run cannot tell a pad gesture from none.
- **Repro and seed:** From a fresh profile, press only gamepad buttons from the title into a battle, then read __pyrefly audio debug: ready and playing.
- **Evidence:** ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pad-only-seymour-flux-1600x900/run.json"]
- **Confidence:** low (unknown)
- **Requirement:** RUBRIC s2 platform goals (gamepad); CHK-023
- **Smallest fix:** Add one emulated-gamepad Playwright run that asserts audio ready and a playing cue.
- **Acceptance check:** A real controller on real Chrome (or a headed browser with userActivation provably false before the pad press) reaches the title cue on the first pad button.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 61. PR-0039 [polish, audio] (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- **Game:** both
- **Chapter / state:** I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- **Expected:** Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- **Observed:** themes-audit fails scene-gagazet, scene-dreams-end and scene-farplane, the same as round 17. Note: scene-farplane measures E minor against the map's E major.
- **Repro and seed:** node tools/audio/themes-audit.mjs
- **Evidence:** themes-audit output, round 18
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md
- **Smallest fix:** Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- **Acceptance check:** themes-audit reports 0 departures for these cues.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **Round 19:** Round 19: unchanged (themes-audit).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 62. PR-0260 [polish, audio] (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- **Game:** ffx
- **Chapter / state:** VII
- **Expected:** Every shipped cue has a row in the bible's cue map.
- **Observed:** FAIL scene-macalania-temple: the cue is not in the bible's cue map.
- **Repro and seed:** node tools/audio/themes-audit.mjs
- **Evidence:** themes-audit output, round 18
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md
- **Smallest fix:** Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- **Acceptance check:** themes-audit shows ok for scene-macalania-temple.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: unchanged.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 63. PR-0278 [polish, audio] (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- **Game:** both
- **Chapter / state:** docs
- **Expected:** One contiguous table of rows I to XVIII.
- **Observed:** Line 656 is '| ## Owed cues for chapters not yet listed'. Rows XVII and XVIII sit at lines 667 and 668, after a stray separator at line 666, outside the table. themes-audit still reads 18 of 18.
- **Repro and seed:** Open D:/pyrefly-rel26c/docs/audio/THEMES.md at lines 638 to 668.
- **Evidence:** docs/audio/THEMES.md:656,666-668
- **Confidence:** high
- **Requirement:** docs hygiene
- **Smallest fix:** Move the XVII and XVIII rows up under XVI, and put a blank line before the '## Owed cues' heading.
- **Acceptance check:** The rendered markdown shows one table of 18 rows, and themes-audit still passes.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: unchanged.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 64. PR-0298 [polish, audio] (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- **Game:** both
- **Chapter / state:** all
- **Expected:** D-292 as worded: the music grows from about 39 MB to about 73 MB.
- **Observed:** The music is 78.2 MB and the total 80.93 MB (qa). The AUDIO_BUDGET_BYTES constant went from 60 to 85 MB, and the D-292 note in manifest-io.mjs documents the gap. Each chapter's music download roughly doubled; for example III requests 12.7 MB of music, up from 6.5. Any effect on slow-link loading is the delivery category's call (PR-0240) and is not scored here. NOW.md already lists 'music 78 MB ok?' as open for Bailey.
- **Repro and seed:** node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- **Confidence:** high
- **Requirement:** RUBRIC s7 (a pick approves what Bailey named)
- **Smallest fix:** Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- **Acceptance check:** decisions.json records Bailey's answer on the 78 MB size.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 65. PR-0271 [polish, visual] (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- **Game:** FFX only
- **Chapter / state:** XVIII Sin: the Face
- **Expected:** No HUD panel over a face, including during camera moves (CHK-008).
- **Observed:** When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- **Repro and seed:** Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- **Evidence:** critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- **Confidence:** medium (observed; no live action-frame evidence to compare)
- **Requirement:** CHK-008
- **File and line:** Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- **Smallest fix:** Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- **Acceptance check:** XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 66. PR-0248 [polish, visual] (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- **Game:** FFX only
- **Chapter / state:** VII Seymour and Anima
- **Expected:** The Sensor card placed clear of the fiends' projected quads.
- **Observed:** The card spans Guardian B from shoulders to knees; only his head shows above it.
- **Repro and seed:** Seed 1, Ch VII, 1600x900. Target by real keys, then cancel.
- **Evidence:** critic/rounds/round-17/evidence/seymour-anima-macalania-win/16b-after-cancel.png; 16-target-single.png
- **Confidence:** high
- **Requirement:** CHK-008
- **File and line:** Sensor card placement (not traced)
- **Smallest fix:** Use the line-card free-slot picker for the Sensor card, or dismiss it on cancel.
- **Acceptance check:** Ch VII 16b-after-cancel at 1600x900 and 2000x1012: no enemy torso under the card.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 67. PR-0246 [polish, interface] (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- **Game:** FFX
- **Chapter / state:** Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- **Expected:** The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- **Observed:** 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- **Repro and seed:** node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- **Confidence:** high
- **Requirement:** PR-0246 acceptance; CHK-009
- **Smallest fix:** Wrap the label to two lines, or drop the verb when the name is long.
- **Acceptance check:** The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 68. PR-0252 [polish, interface] (carried): the first-turn coach card overlaps the selected command row

- **Game:** FFX
- **Chapter / state:** X Seymour Natus at 2000x1012 (2560x1080 not captured)
- **Expected:** Coach clear of the command stack.
- **Observed:** Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- **Repro and seed:** Fresh profile, 2000x1012, Ch X first menu.
- **Evidence:** critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- **Confidence:** high
- **Requirement:** CHK-008
- **Smallest fix:** Add the command stack to coachActorAvoid's rects at wide sizes.
- **Acceptance check:** 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 69. PR-0276 [polish, interface] (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- **Game:** FFX-2
- **Chapter / state:** IV Bahamut
- **Expected:** Header visible, or scrolling inside the rows only.
- **Observed:** The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- **Repro and seed:** Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- **Evidence:** critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **Smallest fix:** Make the header sticky, or scroll the rows container only.
- **Acceptance check:** Header box fully inside the list viewport after wheel up and down.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 70. PR-0277 [polish, interface] (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- **Game:** FFX
- **Chapter / state:** I Seymour Flux
- **Expected:** The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- **Observed:** The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- **Repro and seed:** Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- **Evidence:** critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- **Confidence:** low
- **Requirement:** CHK-005 (says in plain words what to spend the turn on)
- **Smallest fix:** Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- **Acceptance check:** On the same board the card names the raise, then the cure, in that order.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 71. PR-0239 [polish, interface] (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- **Game:** FFX-2 (the rail is shared)
- **Chapter / state:** XI Fallen Aeons, Rikku's Mega-Potion charging
- **Expected:** The two panels do not contradict each other about the same turn.
- **Observed:** The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- **Repro and seed:** FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- **Evidence:** critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- **Confidence:** high
- **Requirement:** Interface: useful advice
- **Smallest fix:** Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- **Acceptance check:** In the same case, the rail and the card agree or the rail defers.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 72. PR-0273 [polish, combat] (new; gap pass): Ch XVII link 3 (on Sin's back) still lists disabled PULL BACK and CLOSE IN rows at the top of the command menu

- **Game:** FFX
- **Chapter / state:** Ch XVII sin-fins-core, link 3 (Sinspawn Genais + Sin's Core), every party menu
- **Expected:** research/ffx-sin.md §1 table, link 3: 'on Sin's back (the party jumps from the ship) ... no Trigger Command'. No order rows in link 3.
- **Observed:** In link 3 the menu reads PULL BACK / CLOSE IN / ATTACK / SPECIAL / WHITE MAGIC / ITEMS, and the engine marks both orders disabled. The stage also still shows the Fahrenheit deck.
- **Repro and seed:** Real-key win seed 1 (gaproute.mjs sin-fins-core, POLICY=xvii): the first link-3 menu.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/sin-fins-core-win-r17gap-s1/seq-seam-3/f20.jpg; D:/Final Fantasy/critic/rounds/round-17/combat/gaplink3-out.json
- **Confidence:** high
- **Requirement:** research/ffx-sin.md §1 (link 3 has no Trigger Command); CHK-004
- **File and line:** engine emits disabled 'pull-back'/'close-in' triggers in link 3 (in-process probe combat/gaplink3-out.json); AirshipOrders folds orders only when airship.range is set (src/ui/ffx/AirshipOrders.ts:137); file of the trigger source not traced
- **Smallest fix:** Drop the airship trigger commands from link 3's formation or triggers, or hide disabled trigger rows when no range state exists.
- **Acceptance check:** The first link-3 menu lists no PULL BACK or CLOSE IN row, and in-process the link-3 decision carries no trigger commands.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **Round 19:** Round 19: the engine's first link-3 decision still lists trigger:pull-back(disabled) and trigger:close-in(disabled) (combat/link3-rows.json); no real-key run reached link 3.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 73. FOC28-P02 [polish, interface] FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- **Game:** FFX
- **Chapter / state:** II and XIV Grand Summon picker, 390x844
- **Expected:** Legible and not clipped.
- **Observed:** Recorded by the focused review of this same build and still open.
- **Repro and seed:** See critic/reviews/6ea8528f-focused.md.
- **Evidence:** critic/reviews/6ea8528f-focused.json (reused, same sha)
- **Confidence:** high
- **Requirement:** CHK-003
- **Smallest fix:** As proposed in the focused report.
- **Acceptance check:** As proposed in the focused report.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 74. PR-0223 [polish, delivery] (carried): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- **Game:** FF7 (hidden experiment)
- **Chapter / state:** FF7 Guard Scorpion
- **Expected:** 0 requests >= 400 on the FF7 pause.
- **Observed:** Not captured in round 17. No FF7 file changed in this candidate.
- **Repro and seed:** FF7 door, then battle, then Esc; record the network log.
- **Evidence:** absent; builder claim only (docs/handoff/r29-load.md)
- **Confidence:** low
- **Requirement:** CHK-017 / CHK-018
- **File and line:** pause in the FF7 fight
- **Smallest fix:** None until observed.
- **Acceptance check:** FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 75. PR-0247 [polish, visual] (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- **Game:** FFX
- **Chapter / state:** VII, battle, Anima's arrival at 390x844 touch
- **Expected:** The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- **Observed:** At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- **Repro and seed:** Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- **Confidence:** high
- **Requirement:** visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- **Smallest fix:** Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- **Acceptance check:** The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 76. PR-0328 [suggestion, delivery] (proposal, needs Bailey's yes; R19-PD-02): 22.7 MB of JavaScript source maps ship inside the 800 MB line while 33 MB of adopted art waits for room (D-332)

- **Game:** both
- **Chapter / state:** build
- **Expected:** Only player-facing files spend the line.
- **Observed:** index-DU_vcl-u.js.map 17.0 MB + two worker maps 5.7 MB in a 798.85 MB build.
- **Repro and seed:** node tools/artifact-manifest.mjs build --dir dist-gate; list *.map.
- **Evidence:** critic/rounds/round-19/prep-delivery/artifact-manifest-dist-gate.json
- **Confidence:** high
- **Requirement:** delivery budget D-332; RUBRIC section 8 proposals
- **File and line:** vite.config.ts:52 (sourcemap: true)
- **Smallest fix:** Build hidden maps and leave .map out of the shipped dist (kept locally).
- **Acceptance check:** Bailey's answer recorded; if yes, no .map in the manifest.

### 77. PR-0329 [suggestion, interface] (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON

- **Game:** both
- **Chapter / state:** pause > EYE CANDY
- **Expected:** As adopted in D-317 ("players who had a look off keep the new parts off").
- **Observed:** A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
- **Repro and seed:** Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
- **Confidence:** high (behaviour); taste question
- **Requirement:** D-317; RUBRIC section 7 (inferred items never fail a build)
- **Smallest fix:** None unless Bailey wants it.
- **Acceptance check:** Bailey's answer recorded.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** true

### 78. PR-0306 [suggestion, encounter] (new, a question for Bailey; R18b-CE-01): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 7 real-key attempts this round (seeds 1, 1001, 2, 1002, 2002 and the gap pass's 1 / 1001; one Active-mode loss besides)

- **Game:** FFX-2 only
- **Chapter / state:** XV ffx2-den-of-woe, links 2 (Gippal) and 3 (Nooj)
- **Expected:** Bailey decides whether the Den's difficulty is right. The bosses' numbers are sourced; the party level at the Den is an unsourced estimate (research/ffx2-gippal-den-of-woe.md section 5, G-12).
- **Observed:** The capture owner lost 5 of 5 (closest: Nooj at 4,538 / 23,800). The gap pass lost seed 1 and won seed 1001 (32 turns, 324 s) on the same advisor route, and lost one attempt at X-2 BATTLE ACTIVE. Engine bench on the identical engine (round 18, sourced intended line, seeds 1-200): 44/200 at Wait with instant decisions, 3/200 at Active with 2.5 s decisions. The advisor plays legally and sensibly (Remedy for Stop and Curse, Megalixir under Lightfall, Darkness on the shades).
- **Repro and seed:** Production candidate f302f163, fresh profile, setSeed before the first key, real keys following the advisor every turn (critic/rounds/round-18b/cap route18d.mjs). Bench: critic/rounds/round-18/combat/den-stop-frequency.test.ts.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win-s2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/ffx2-den-of-woe-win-gap2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/xv-active-1600x900-s1/run.json; D:/Final Fantasy/critic/rounds/round-18/combat/den-stop-frequency.json
- **Confidence:** high for the observed rates; no source says what the rate should be
- **Requirement:** RUBRIC section 6 encounter (fair wins and losses); AGENTS.md hard rule 6 (never invent data)
- **Smallest fix:** No code change from the critic. Put the XV figures to Bailey alongside PR-0279 (Sin) and PR-0227 (XIII); if a change is wanted, measure party-side options only (the level estimate or the prep kit) before building any.
- **Acceptance check:** Bailey's decision recorded in docs/target/decisions.json; if a party-side option is chosen, re-run the bench and three real-key XV attempts and report win rates against the chosen band.
- **Introduced by candidate:** false
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: XV won once in 4 real-key attempts (seed 1003); bench unchanged.

### 79. PR-0299 [suggestion, audio] (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- **Game:** both
- **Chapter / state:** all
- **Expected:** RUBRIC s7: an inferred item is asked before it is built.
- **Observed:** src/app/saveSfxBalance.ts moves any 0.35 stored without the marker. The rule works exactly as stated (28 of 28 cases pass), but D-293 marks the existing-save half as inferred, and NOW.md lists it as open for Bailey. A pre-release player who picked 0.35 by hand cannot be told apart from an untouched one.
- **Repro and seed:** Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- **Confidence:** high
- **Requirement:** RUBRIC s7 inferred items; D-293
- **Smallest fix:** Ask Bailey whether this is acceptable. No code change unless he says no.
- **Acceptance check:** D-293's inferred note moves to named, or is reversed by Bailey.
- **Introduced by candidate:** true
- **Regression vs live:** false
- **In a new feature:** false
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 80. PR-0297 [suggestion, target-registry] R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- **Game:** both
- **Chapter / state:** docs/target/targets.json group picks-0929
- **Expected:** Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- **Observed:** All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- **Repro and seed:** Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- **Evidence:** D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- **Confidence:** high
- **Requirement:** RUBRIC §7 (delivery field, required targets)
- **Smallest fix:** Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- **Acceptance check:** node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: carried, not re-observed; no product file it depends on changed in this candidate except where stated in coverage.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 81. PR-0217 [suggestion, combat] (carried): Zombie is kept across a KO (unsourced); the advisor top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- **Game:** FFX
- **Chapter / state:** I, II
- **Expected:** A sourced rule, or the rule labelled as an assumption
- **Observed:** The three-line bench is identical to round 17, zombieReviveTopRows included
- **Repro and seed:** ffx-bench.test.ts
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- **Confidence:** medium
- **Requirement:** AGENTS.md rule 6
- **Smallest fix:** Source the rule or label it
- **Acceptance check:** A written source
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: unchanged.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 82. PR-0227 [suggestion, encounter] (carried, information): Chapter XIII is rarely won at human pace. Seed 1 lost on 1 and 1001 (and on ?pace=current); the seed-2 route won on 1002

- **Game:** FFX-2
- **Chapter / state:** XIII Trema
- **Expected:** Information for Bailey
- **Observed:** ffx2-trema-win: defeat@1, defeat@1001. ffx2-trema-win-s2: defeat@2, victory@1002 (333 turns). ffx2-trema-win-pacecurrent: defeat@1.
- **Repro and seed:** runs-summary.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json
- **Confidence:** medium (Active ATB is wall-clock sensitive)
- **Requirement:** encounter: fair difficulty
- **Smallest fix:** none (a question)
- **Acceptance check:** n/a
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: XIII lost all 8 real-key attempts at link 1 (Oversoul Paragon), consistent with the 13-14 % bench rate.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 83. PR-0262 [suggestion, narrative] (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four

- **Game:** FFX
- **Chapter / state:** results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
- **Expected:** No two chapters share a first-choice quip, and at most two use 'That's it?'.
- **Observed:** src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
- **Repro and seed:** Win I, II and VIII and read the results quip.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/seymour-flux-win/run.json
- **Confidence:** high
- **Requirement:** narrative: character voice, no repetition across chapters
- **Smallest fix:** Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
- **Acceptance check:** First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.
- **Introduced by candidate:** unknown
- **Regression vs live:** unknown
- **Round 19:** Round 19: "...Okay. Next one." is the results quip in I, II and VIII again.
- **Note:** Seen again on f302f163: Ch I victory results read "...Okay. Next one." (seymour-flux-win/run.json resultsText).

## Resolved this round

- **PR-0264** (carried, re-confirmed on f302f163; friends' playtest "Hi-Potion killed Kimahri"): on the phone, a tap on a dimmed ally commits the heal at once, so a Hi-Potion: fixed (verified on 25faec70 by critic/reviews/25faec70-focused.json: aim-first touch, 0 mismatches; touchTapAim.ts unchanged since)
- **PR-0265** (carried, re-confirmed on f302f163): tapping ESC RESUME in the pause does nothing on any tab: fixed (verified on 25faec70: pointer ESC RESUME closes the pause; PauseScreen.ts changed in this candidate, so a pointer re-check is owed: coverage.requiredNotTested)
- **PR-0283** (carried, re-confirmed on f302f163): after RESTART ENCOUNTER the title root stays mounted over the whole restarted fight: fixed (verified on 25faec70: 0 title roots after RESTART in 30 samples; pointer re-check owed after this candidate's PauseScreen.ts / PauseOverlays.ts changes)
- **PR-0267** (carried, re-run on f302f163): a failed Bushido keeps its time remaining and earns the timing bonus, so a wrong first press out-damages a correct fast sequence;: fixed (round 19 combat: failed Bushido timing bonus 0 and wrong-press reset to input 1, od-rows-probe.json, ffx-bushido-fail-bonus and ffx-bushido-wrong-press-reset pass; failed Shooting Star replayed through the real runtime)
- **PR-0244** (carried, STALLED): the Ch VII CONFIRM scene narrates the kneel and the fall over a standing Seymour: fixed (round 19: seymour-anima-macalania-win/33-after-confirm-scene.png shows the kneel painting under "He went down on one knee")
- **PR-0268** (carried): Bailey adopted the Sin link-3 retry checkpoint (D-284), but SIN_LINK3_CHECKPOINT is still false (sin-genais-core.ts:199 at f302f163): fixed in code (SIN_LINK3_CHECKPOINT true, sin-checkpoint-flow passes); the real-key link-3 retry stays owed (coverage.requiredNotTested)
- **PR-0266** (carried; hudTextSize and CommandMenu unchanged): at TEXT SIZE 130 % the FFX help slab covers the TALK row in round 18's repro state: fixed (verified on 25faec70: TEXT SIZE 130 % re-caps the FFX list to 4 rows)
- **PR-0284** (carried, re-confirmed on f302f163): REPLAY BRIEFING opens under the pause UI: fixed (verified on 25faec70: REPLAY BRIEFING on top of the pause; re-check owed after this candidate's PauseOverlays.ts change)
- **PR-0290** (new, status O3): the phone Curse hint drops Esuna and Remedy ('Paine is cursed: Holy Water cures it.') that the desktop hint lists: fixed (round 19: ffx2-bahamut-win-phone-touch/11-advisor.png lists Holy Water, Esuna and Remedy)
- **PR-0285** (new, status O3): the status message line trails the event it names by 1.6-2.5 s and splits one Hastega into three lines: fixed (round 19 feel: one cumulative Hastega line by 1.95 s; the Zombie line 0.53 s after the hit)
- **PR-0287** (new): the FFX-2 OPTIONS settings column overflows at rest (STRATEGY GUIDE cut through the middle, BATTLE HELP below the fold); keyboard and wheel still reach e: fixed (round 19: ecpage-ffx2-bahamut-1600x900-rm/10 shows the FFX-2 OPTIONS column whole with BATTLE HELP)
- **PR-0294** (new finding): the phone OPTIONS settings list is a ~100 px scroll window (4 of 10-12 rows visible), so the three new eye-candy rows need scrolling with little : fixed (round 19: ecpage-ffx2-bahamut-390x844-touch/10 shows all six OPTIONS rows, EYE CANDY included, without scrolling)
- **PR-0275** (carried, confirmed): the board truncates 'Sin: the Fins and the …' and clips the Roman-numeral strip: fixed (round 19: sin-fins-core-win/03-card.png shows the full title and the numeral strip fits)
- **PR-0274** (carried, confirmed): no advisor card at the first command menu of either Sin chapter: fixed (round 19: an advisor card shows at the first menu of both Sin chapters)

## Refuted, merged and downgraded this round

- Refuted: The post-battle scene runs at about one line per frame with no input, in 6 chapters of both games (capture owner, major). The route held Enter for 4 s after results (route19k.mjs afterConfirm loop); hold-to-skip fast-forwards after 550 ms by design. With no input, Ch II and Ch XVI post lines type at about 47 ms per character and wait 145-147 s for input (critic/rounds/round-19/confirm/post-yunalesca-hold-s1.json, post-ffx2-ixion-djose-hold-s1.json). Folded into PR-0261 as a harness defect.
- Merged: PR-0307 <- visual R19-VIS-01 + gaps colossus plate + confirm
- Merged: PR-0308 <- combat R19-CE-01 + gaps Bushido chips
- Merged: PR-0312 <- interface R19-IF-01 + gaps actfade + gaps Natus Sensor card
- Merged: PR-0318 <- visual R19-VIS-07 + gaps Yuna KO under the panel + FR-35-02
- Merged: PR-0321 <- capture owner phone EYE CANDY 12 px + interface R19-IF-02
- Merged: PR-0251 <- gaps 4:3 legibility and framing
- Merged: PR-0261 <- the refuted post-scene finding and the Overdrive-input and Leblanc harness limits
- Downgraded: gaps "Advisor and enemy-intent cards blink to opacity 0" major -> polish (PR-0312): the information returns within 0.6 s and nothing shown is wrong
- Downgraded: gaps "4:3 breaks the legibility floor" major -> kept at PR-0251 polish: the text measurement equals round 18b's

## What stands between this build and acceptance

- **To ship:** PR-0307 (a regression against live). Fix it, ideally with PR-0312, then run a focused re-check.
- **To accept a milestone:** this is a deep review and cannot accept one. The gates still fail on several counts:
  - audio has no ear verdict (CHK-B1, PR-0148);
  - seven categories are under the 9.0 floor: encounter, visual, feel, narrative, interface, onboarding and delivery;
  - 10 majors are open;
  - CHK-001, CHK-003, CHK-008 and CHK-023 fail;
  - CHK-002, CHK-009 and CHK-022 are unverified;
  - XIII, XVII and XVIII have no real-input win;
  - 18 of 87 required targets are not matched;
  - nine human judgments are owed;
  - there is no live verification.

## What changed since the previous round (18b, f302f163)

- Builds in between: releases 33 to 35 shipped (f302f163, 25faec70, ef3f6bbf), each with a focused and a live review. This candidate adds the MAX mix, the EYE CANDY page and the 2026-10-02 art.
- Closed:
  - since round 18b: PR-0264, PR-0265, PR-0266, PR-0283 and PR-0284 (r34, reused);
  - PR-0267 (Bushido failure semantics), PR-0244 (Ch VII kneel staging) and PR-0268 (Sin link-3 checkpoint, in code);
  - PR-0285, PR-0274, PR-0275, PR-0287, PR-0290 and PR-0294;
  - VP-1001-05 (KO scale), largely VP-1001-01 and -15 (spherechange moment), and VP-1001-43 (colossus scale).
- New:
  - the ship-blocking regression PR-0307 and the card regression PR-0312, both from the colossus masters;
  - the pre-existing Bushido/Swordplay input defect PR-0308, found now;
  - the dressphere-shot defects PR-0309, PR-0313 and PR-0314;
  - Yuna's Thief placeholder, PR-0311.
- Category movement:
  - up: encounter 8.8 to 8.9, interface 8.0 to 8.5, onboarding 8.4 to 8.6, prep 9.0 to 9.1;
  - down: visual 9.1 to 8.7 and feel 8.3 to 8.1, which are now judged in motion against the 2026-10-01 visual pass standard; delivery 8.7 to 8.5, because frame time has no credit;
  - unchanged: combat 9.2, narrative 8.9, audio UNVERIFIED.
- No comparison is made with rubric v1 rounds 02 and 03.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- Ship hidden source maps (PR-0328): frees about 22.7 MB of the 800 MB line for the 33 MB of adopted art waiting under D-332. Benefit: room for adopted art without a new budget. Cost: a build-config change plus local map storage. Fit: neutral to both games. Risk: harder production debugging. Preview: the manifest before and after. Nothing is built without Bailey's yes.
- A plate-coverage guard for every framing master: reject a camera whose frustum leaves the painted backdrop and fall back to today's rig (would have caught PR-0307 before review). Benefit: protects every approved scene composition from future framing work. Cost: small, one geometry check plus a per-chapter test. Fit: both games. Risk: a few colossus fights may lose some scale. Nothing is built without Bailey's yes.
- Critic tooling (no product change): teach the route harness to type the shown Bushido/Swordplay input and to watch the post-results scene before holding Enter (PR-0261), so the Sin chapters' human damage and natural reading pace are measured fairly.
- Carried from round 18b: a presenter stall watchdog (log only); a standing headless lane across every FFX-2 seam with each carried status; one help line under each look row (the EYE CANDY page now has help lines for its rows, so this may be answered).

## Human judgments owed

- Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148): not recorded
- Feel: the held Overdrive shot, the dressphere shot and twirl keys, breathing and KO collapse in play (CHK-B2): not recorded
- Narrative: Bailey's story read (CHK-B3); scripts unchanged this release: not recorded
- Visual: the colossus scale and camera (D-316) in the running game against the picked option C stills, including whether Yunalesca should be a colossus at all (PR-0307): not recorded
- Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227): not recorded
- Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329): not recorded
- Delivery: ship source maps or free 22.7 MB for the waiting art (PR-0328): not recorded
- Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270): not recorded
- Overdrive inputs: which button order to use for the Bushido sequences, given D3 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference): not recorded

## Server hygiene

Chief: started no server and opened no browser; at 18:05 local no process listened on any port 5400-5999 (netstat). Capture owner stopped 5900 (PID 15068) and 5911-5913 by their own PIDs; the confirmer stopped 5731 (PID 77412, child 42816) by its PID and confirmed the port closed; the auditors started none.

## critic-clear output (verbatim)

```text
critic:clear no pending marker for build 8aee1e69: kept as candidate evidence
```
