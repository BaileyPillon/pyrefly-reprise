# Round 31: deep review of release 68 (live build 2a9340249, bundle CahDxk82)

```text
Build / artifact / target version: main 2a9340249 / 865efda30b6915c0ee3794b7ed1126a531a7a51f48086f303927047aedb3c17d / targets 1b09ad4e5a0315f4233b38cdaccc5a6ce2c3854fe9d5a6f21db39145ad6ca5b2
Review: deep (live site https://echoesofspira.com/, release 68 live since 2026-10-29T14:45:49Z)
Deployment: PASS
Changed area: FAIL
Ship: SHIP, No critical defect: all 19 chapters were won by real keys from the title to results, CONFIRM and chapter select with 0 console errors and 0 not-found requests, the save-data class is untouched (SaveData.ts byte-identical, 19 of 19 clears survive a real reload), and the live page serves the build under review.
  Majors this release discloses: 9 lines (below)
Milestone: not assessed
Quality: provisional; scored combat 9.4, encounter 9.2, visual 8.4, feel 8.3, narrative 8.8, interface 8; audio, onboarding, prep, delivery UNVERIFIED (no number). Last full score: none (round 30b was provisional too).
Targets: required 17 / matched 12 / failing 0 / unverified 3 / waiting on decision 2
Top issues: PR-0531, PR-0459, PR-0517, PR-0380, PR-0379, PR-0570, PR-0148, PR-0567, PR-0295 (see the ranked list)
Coverage: tested, reused with reason, not tested: see "Coverage matrix"; requiredNotTested is empty
Next required review and why: The deep obligation of 2a9340249 is settled by this report if critic-clear accepts it (changed area FAIL; CHK-001, CHK-B1 and CHK-B2 stay UNVERIFIED and pass nothing). The next deep review owes Bailey's listening verdict (CHK-B1) and his answer on the camera and cut look (PR-0530), the written method check for the pose-swap family, the prep and colour-vision walks (PR-0503), a real-controller and real-phone pass, first-load time on the live URL, and loss and retry at a later chained link.
Elapsed review time / repeated work avoided: 95 minutes of chief time; the 19-chapter continuity run, the engine probe set and the audio technical run were produced once and read by every lane.
```

## Score output (verbatim from tools/critic-score.mjs)

```text
score: PROVISIONAL — no verified score for audio, onboarding, prep, delivery (never averaged away, never zero)
below the 9 floor: visual, feel, narrative, interface
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio, onboarding, prep, delivery
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - 9 critical or major issue(s) remain open
  - 3 required target(s) unverified
  - 2 required target(s) waiting
  - only 12 of 17 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148)
  - human judgment not recorded: Feel: are the planned smear hard cuts (22 a minute now), the pro camera shots and the big turn cut-in the look he wants (PR-0530, PR-0521, PR-0536; CHK-B2)
  - human judgment not recorded: Art: should the Rikku Dark Knight and Paine Warrior ready and attack poses be repainted or only registered (PR-0517)
  - human judgment not recorded: Audio: keep or change the silent Chapter IV results screen (PR-0504)
  - human judgment not recorded: Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
  - human judgment not recorded: Interface: should desktop Chapters I and IV show a first-menu teaching card as the phone does (D-1344, R31-ONB-02)
  - human judgment not recorded: Narrative: portrait expression on grief lines in both games (PR-0485)
  - human judgment not recorded: Accessibility: do COLOUR VISION, TEXT SIZE, REDUCE FLASHES and REDUCE MOTION do what he wants (walked in part by the gap pass; remapping is not built; PR-0503, PR-0559)
report: valid evidence
```

## Verdicts

- **deployment**: PASS: CHK-017: the live page serves index-CahDxk82.js, the live review compared 7,169 files byte for byte (PASS), the capture owner, the harness (19 runs) and the chief's gap runs saw 0 console errors and 0 not-found requests.
- **changedArea**: FAIL: CHK-008, CHK-009, CHK-020, CHK-026 and CHK-027 FAIL; nine majors are open, none a regression. CHK-002, 003 and the measured r68 areas (run-in stand 0 to 34 ms, turn-order overlap 0, HUD closure retention gone, Trigger Happy smooth and REDUCE-MOTION-gated, ghosting 3,474 to 1,689 ms a minute, swap jerks 115 to 66, retry 16.5 to 4.9 s in Chapter I) met their targets. CHK-001 and CHK-B1 stay UNVERIFIED and are filed non-mandatory.
- **ship**: SHIP: no critical defect was found or left reachable; every critical or major issue is tagged introducedByCandidate false (PR-0570 unknown) and regressionVsLive false; the one regression (PR-0571, phone name abbreviation) is minor.

Ship reasons:
- No critical defect: all 19 chapters were won by real keys from the title to results, CONFIRM and chapter select with 0 console errors and 0 not-found requests, the save-data class is untouched (SaveData.ts byte-identical, 19 of 19 clears survive a real reload), and the live page serves the build under review.
- Better than live release 67 where it was measured: swap jerks 115 to 66, see-through time 3,474 to 1,689 ms a minute, the revive first-frame pop 80 to 108 px gone (PR-0570 is the step that moved), the FFX-2 run-in stand 184 to 200 ms to 0 to 34 ms, turn-order overlap 0, the FFX-2 HUD leak fixed, the Chapter I retry 11.6 s faster.
- Every open major is tagged introducedByCandidate false or unknown and regressionVsLive false: the pose-swap majors were failing on live and are disclosed; the one minor regression (the phone enemy-move line shows Yun / Rik / Pai) is disclosed.

Majors this release discloses:
- PR-0531 (major): pose swaps still change head, height or feet in 14 of 19 chapters (CHK-026 FAIL; 476 head swaps, 16 feet shifts, Trema Paragon 10.5 px).
- PR-0459 (major): Auron's head changes 9.3 percent at two Chapter I swaps (open across four deep reviews; method check owed).
- PR-0517 (major): FFX-2 Chapter IV Paine and Rikku attack and ready poses read as a different-sized figure (strip: real head x0.82 at attack to follow).
- PR-0380 (major): 66 pose-swap jerks of 40 px or more in 8 chapters, worst 252 px (CHK-027 FAIL).
- PR-0379 (major): see-through dissolves at pose swaps are down to 1,689 ms a minute but the four chapters kept on the old scope sit at 2,569 to 5,531.
- PR-0570 (major): Chapter I Tidus's revive steps 89 px in one frame at +117 ms (the first-frame pop is gone).
- PR-0567 (major): a phone on 10 Mbit/s waits 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card for about 94 MB before the first command; the load diet does not move it.
- PR-0148 (major, evidence gap): no owner listening number covers the shipped mix. PR-0295 (major, carried): phone prep tabs not re-walked.
- PR-0571 (minor regression): the phone FFX-2 enemy-move line abbreviates the party names.

## The ten categories

### combat: 9.4

Chief critic, round 31 (deep, build 2a9340249, bundle CahDxk82). Auditor reading adopted: Combat auditor, round 31 (deep, build main 2a9340249, bundle index-CahDxk82, release 68), engine run from D:/pyrefly-release55 (HEAD 67256e1ca; git diff 2a9340249..HEAD is empty for src, tests, tools and research, so the tree under test is the live build). No browser opened by this lane. IDENTITY: git diff 2b48cee95 (round 30/30b live build) against 2a9340249 is EMPTY for src/battle, src/engine/tactics, src/story, research/, and for src/data except two art-registration files (src/data/art/poseRegistrationFfx2.ts, src/data/art/readyIdentity.ts: pose paintings, no combat or encounter value). So no game-data value changed and none needs a source audit; the 107 changed src files are presenter, split of PaintedActor/BattlePresenter/BattleMoments/BattleScreen, pose swap scope, HUD, input focus, load diet. RE-RUN, NOT ASSUMED (critic/rounds/round-31/audit-combat): the whole round-30 probe toolkit plus both parity measures, 16 outputs, every one md5-identical to round 30 (aeonmenu, bahamut56, ch3, chain, demoseeds, hidden, immunefuzz 51,782 forks, kernel 478 checks 0 mismatches, kernelx2 68 checks 0 mismatches, naive attack and random FFX 40 seeds x 12, naivex2 FFX-2 7 chapters x2 arms, ko, ffx-parity-measure seeds 5001-5200, ffx2-parity-measure seeds 1-100); six of them (kernel, kernelx2, aeonmenu, chain, bahamut56, ch3) were run a second time in this pass and re-wrote byte-identical files, which also proves determinism. Boundary and high-risk sample (CTB ticks and ranks, Haste/Slow, Zombie, Breaks, Overdrive modes, ATB speeds, chains, dresspheres, Garment Grid gates): zero mismatches. Intended-line win rates (engine): FFX 200 seeds, Seymour Flux 200, Yunalesca 180, Braska 197, Anima 189, Evrae 194, Yojimbo 196, Natus 190, Omnis 174, Via Purifico 180, Sin core 178, Sin face 200, Mirror Aeons 148; FFX-2 100 seeds, Bahamut 100, Vegnagun 99, Leblanc 100, Fallen Aeons 100, Trema 71, Den of Woe 100, Ixion 100. Credible wrong lines lose: attack-only and random 0/40 in 10 of 12 FFX chapters; FFX-2 attack-only 0/40 in Vegnagun, Leblanc, Fallen Aeons, Trema, Den of Woe (Bahamut 37/40 and Ixion 4/40 with the per-command span, as explained in 30b); the real-key idle loss in Chapter IV followed the sourced loop (Curse, 3 Attack, 2 Impulse, countdown, Mega Flare, 3 Attack, 2 Impulse, Mega Flare) per research/re-ffx2-ai-bahamut-vegnagun.md section 2.1. UNIT SUITE on this tree: 27,254 tests, 27,113 passed, 113 skipped or todo, 28 failed in 27 suites that were all 15 s timeouts (plus one EPERM on a lock file) while the host ran the capture and harness jobs at the same time; the 13 failing files rerun serially with a 240 s timeout pass 239 of 239 (advisor-floor, advisor-menu, advisor-note, advisor, the angra, daigoro, fayth and valefor door tests, strategy-chapter2 37 of 40 seeds, ui-ffx2-atbmode, ui-pause-stack, audio-manifest-io 25 of 25 three times, tourist-trap-bench). The tests of every r68 subsystem pass in that run (ctb-slide-crossing 9, m3-flips 30, m3-flips-moves 12, ffx2-hud-release 4, atb-live 15, trigger-happy-smooth 6, revive-prone-hold 6, ready-identity 13, defeat-cause-speed 11, pro-defeat-label 12, input-focus-contract 32, input-shift-tap 17, r67-public-retry-opening 12, mf15-summon-leap 6, chain-checkpoint-spoils 2, release-notes 15). tsc --noEmit clean; node tools/orphans.mjs: 24 orphans, all pre-existing, none of the r68 modules (CutAnchor 5 importers, ReadyIdentity 3, PoseStream 2, LoadDiet 7, focusContract 8). CHK-023 on the live bundle through the capture owner's event logs (critic/rounds/round-31/evidence, seed 1, gpu mode, real keys, injected 0): Chapter I win logs Lance of Atrophy x3, Mortiorchis Full-Life x3 with Mortibsorption heals 4000, 3000, 2000, 1000, 1000, 1000, Zombie x3, Banish x5, Protect/Reflect/Dispel/Flare, five Summons with their dismisses, one revive, seymour-lance, seymour-half and mortiorchis-first-charge triggers, Auron's Dragon Fang through the real window (auron-sequence 8 of 8 inputs, research D2); Yunalesca: form-2, first-zombie, form-3 and mega-death triggers in order, Mega Death x3, Absorb exactly floor(maxHP/2) every time (2,200 on Auron's 4,400, no variance, highest-HP target, research/ffx-yunalesca.md section 4.5), 8 revives, Shooting Star 7 of 7 twice; Braska: bfa-low, bfa-sword, bfa-talk and jecht-falls triggers, five Summons, Shooting Star 7 of 7 twice and Tidus Energy Rain timing success x2, results AP 0 and gil 0 (the sourced all-zero record), seven links and six seams won; Chapter IV: Curse once, the sourced six-action cycle, first-mega-flare-countdown, bahamut-half and bahamut-low, one spherechange, 199 ATB snapshots and 105 chain events, 0 KOs; Chapter V link 1: Pallida Mors before the Redoubts fall, Acta Est Fabula, head-down, Shuyin lines 1 and 2 and jecht-no-overtime. Game case (CHK-021): the five FFX-2 only lanes (ready hold, run-in lead, ATB bars, Trigger Happy, screen release) live in src/ui/ffx2 and the FFX-2 dress rows of readyIdentity.ts, the turn-order slide in src/ui/ffx/CtbSlide.ts, the summon leap in the FFX summon path; no CTB event in an FFX-2 log and no ATB event in an FFX log. Why 9.4 and not 9.5: (1) Trigger Happy, now smoothed and on by default, was never played in a browser by anyone this release (r68 SUMMARY section 7 lists it as not run; no round-31 chapter run used the Gunner window), so the one changed combat window has only unit tests behind it; (2) Wakka's reels, Lulu's fury and Kimahri's rage were not driven this round on the r68 input layer, only Auron's and Tidus's windows were (by keys, live); the pad-driven evidence of round 30b is reused with a written argument below, not re-observed; (3) carried and unchanged: the Shooting Star button order is a documented source conflict (research/ffx-overdrive-input-rules-2026-09-30.md D3, the shipped order Triangle, Cross, Square, Circle, Left, Right, Circle follows neither GF-KB nor the others and waits for a Steam HD check), PR-0550 (the confirming pad A also stops Wakka's first reel) and PR-0524 (research/ffx2-bahamut.md still prints the superseded C = 24 Mega Flare). Nothing regressed; no engine change.

Chief addition: Trigger Happy, the one changed combat window with no browser evidence in the auditor's reading, was driven by the chief by real keys on the live site in Chapter VI (Yuna Gunner): the window opened, 11 KeyR presses registered 11 hits (11 HITS on the overlay, action-start extra gunner-trigger hits 11), the bar moved on every drawn frame in the default smooth mode (83 distinct bar values over 83 live frames, transform scaleX) and stepped by width with REDUCE MOTION set, and the damage events followed (6 on the first foe until its KO, then 3 on the next). That closes the auditor's reason (1) for holding 9.4 and not 9.5; reasons (2) and (3) stand, so the score stays 9.4.

### encounter: 9.2

Encounter auditor, round 31 (deep), live build 2a9340249 (bundle index-CahDxk82, release 68). Encounter data, AI scripts, phases, party builds, rewards and the chapter registry are byte-identical to the round 30/30b live build (empty git diff for src/battle, src/data other than two art-registration files, src/story and research/); all 16 engine benches re-run and identical (see combat), so win rates, boss attack lists, form and link rules are exactly those audited in rounds 29 and 30. REAL FLOWS ON THIS BUILD (title to results by real keys, injected 0, gpu mode, setSeed(1) only as the labelled setup hook): the continuity harness (critic/rounds/round-31/continuity) won ALL 19 chapters to results, confirm and chapter select with 0 console errors and 0 not-found in every run: Seymour Flux 53 turns, Yunalesca 143, Braska 256 (seven links, 6 seams, 25:18), Anima 59, Evrae 85, Yojimbo 14, Natus 26, Omnis 92, Via Purifico 38, Sin core 319, Sin face 45, Mirror Aeons 209, Bahamut 60, Vegnagun 86, Leblanc 83, Fallen Aeons 52, Trema 230, Den of Woe 30, Ixion 28. The capture owner's own routes add Chapter I (win at 1600x900 and 2000x1012, 53 turns each; idle/attack-only loss in 4 party turns: Lance of Atrophy zombifies Kimahri and Tidus, Mortiorchis Full-Life KOs both, Cross Cleave 2,667 kills Yuna, exactly the sourced Holy Water trap), Chapter II (154 turns, seed 3), Chapter III (284 turns, seven links, seed 1), Chapter IV (60, 59 and 60 turns at 1600, 2000 and 390x844 touch; idle loss at 162.7 s elapsed), Chapter V (88 turns). Loss and TRY AGAIN by real keys on r68 in Chapter I (defeat card 'FELLED BY CROSS CLEAVE, TURN 18, ATTEMPT 1', retry first menu in 4.9 s with a new seed, second loss, CHAPTER SELECT) and Chapter IV ('FELLED BY ATTACK', retry to a first menu in 10.2 s, new seed): the pro-defeat card now names the cause at normal speed (the r67 repair of PR-0546; SKIP speed not re-run). Source spot checks of runtime values against research: Mortibsorption heals 4,000 to 1,000 with a 1,000 floor; Yunalesca Absorb floor(maxHP/2) with no variance and the Slap/Absorb alternation; Bahamut cycle and Mega Flare countdown; Braska all-zero rewards. Held back from higher and why (all carried and unchanged): Trema about 60 percent at human pace (PR-0227; engine 71/100), Den of Woe 95 percent (PR-0498), Mirror Aeons 74 percent and Omnis 87 percent as shipped, hidden chapters that do not punish credible mistakes (PR-0447), demo mode's 50 percent Overdrive gauges (PR-0525), the stale research/ffx2-bahamut.md (PR-0524); and new this round: the loss and retry path was re-shown on r68 in only two of 19 chapters (I and IV), none of them chained, after the BattleScreen split and the r67 public-retry change, so retry in the chained chapters (Braska link 2+, Vegnagun, Trema, Sin core, Mirror Aeons) is UNVERIFIED on this build (unit tests chain-checkpoint-spoils, r63-fix-quick-retry and r67-public-retry-opening pass). The phone Chapter I touch run lost because the harness could not reach Poison Fang in a 6-row window of a 27-item list (23 of 35 picks fell back to Attack; same as round 30, harness limit PR-0539); the phone Chapter IV touch run won in 60 turns. Three pause captures in Den of Woe, Trema and Via Purifico read 'screen wanted pause got battle' exactly as in round 30 (PR-0523, the open guide panel takes the first Esc; pOpens and resumedByEsc are true): interface lane, not an encounter defect. Score held at round 30b's 9.2: coverage equal on wins and lower on losses, no content change.

Chief addition: loss and TRY AGAIN were shown on the r68 build in 12 chapters in total (seymour-flux (I), ffx2-bahamut (IV), braskas-final-aeon, ffx2-vegnagun-shuyin, sin-fins-core, ffx2-trema, ffx2-fallen-aeons, mirror-aeons, seymour-omnis, ffx2-den-of-woe, evrae-airship, yunalesca), including the chained chapters; see CHK-022. The auditor's extra hold (retry unobserved in chained chapters) is therefore reduced; the score stays 9.2 because the content is unchanged and the carried holds (Trema, Den of Woe, Mirror Aeons, Omnis, hidden chapters, demo gauges, PR-0524) are unchanged.

### visual: 8.4

Round 31 deep review, live build 2a9340249 (bundle index-CahDxk82, release 68), https://echoesofspira.com/. I opened no browser. I read the capture owner's headless-GPU evidence (critic/rounds/round-31/evidence, PYREFLY_BROWSER=gpu, keyboard from the title) and the continuity harness output (critic/rounds/round-31/continuity: 19 of 19 chapters, dedicated harness, 10,383 s of battle, 56.2 to 60 fps), and I read the target composites in critic/rounds/round-31/targets plus the 12-frame strips. CREDITS: (1) Approved art is intact: verify-approved re-run on D:/pyrefly-release55 gives 917 ok, 0 mismatched, 0 missing (approved 869, judge-locked 48). (2) Release 68's pose continuity shows in the numbers against round 30b: see-through ghosting 3,474 to 1,689 ms a minute (99 frames a minute at 60 Hz; the worst severity is 0.375, under the 0.4 fail line); jerks at a pose swap over the fail line 115 to 66 (worst 200.5 to 252.2 px, but the worst one is now a single Sin fins/core event); swaps drawn outside their height band 15 to 5; silhouette-stance misses 39 to 23; snaps per minute 0.01 (one snap; the 0.25 cap does not bind). (3) The targets I could judge match: title painting, chapter select, dialogue, results, pause (Tidus, FFX-2 Yuna, until-dawn layout), the phone defeat page (PR-0001 option B), Auron's briefing and the three boss body sheets. Chapter IV is clean: Bahamut is a finished cut-out, the three heroes are whole, sized alike and grounded. DEBITS: (1) CHK-026 still FAILS in 14 of 19 chapters (476 head swaps over tolerance; 470-odd of them are the Lulu rig head read, a few px of a roughly 35 px head, where the strips show no visible jump; the registered-head worst is 9.3 percent). Trema's Paragon feet move 10.5 px at the cast-to-idle swap and the same swap has 9 see-through frames (strip swap-147). (2) CHK-027 FAILS in 8 of 19 chapters (Yunalesca, Braska, Vegnagun, Fallen Aeons, Trema, Den of Woe, Sin fins/core, Mirror Aeons) on jerks at a swap. (3) The Chapter I action frame crops Seymour Flux's head off the top edge under the turn order (23-midfight; carried since round 30). (4) Chapter III: Auron is drawn almost wholly behind Tidus (23-midfight). (5) Chapter II: Tidus's HP plate covers Yunalesca's lower body in the hit frame. (6) The first menu of Chapter I is under Seymour's banter card, which hides the lower command rows (10-first-menu-coach); transient and only a polish item. (7) Hard cuts rose from 75 to 3,864 (22 a minute) because ?swapscope=wide turned the planned smear cuts on in 13 more chapters; the look itself is Bailey's call (PR-0530, no judgement recorded), so I score neither for nor against it. NOT SEEN: the settled party-prep frame, the phone pause screen, a Shuyin dialogue portrait, Chapters VII to XXVII beyond the continuity strips. Held at 8.4: +0.1 over round 30's 8.3 for the measured drop in ghosting, jerks and height misses; no further credit while CHK-026 fails in 14 chapters and the three framing debits stay open. SUB-SCORES (outside the weighted score, RUBRIC 6a): characterModels capped at 7.0 and animation capped at 7.0 while CHK-026 FAILS; the 0.25 snaps cap does not bind (0.01).

### feel: 8.3

Chief-critic input, feel auditor, round 31, LIVE build main 2a9340249 (bundle index-CahDxk82), judged from files only (no browser opened; the capture owner's captures are GPU headless, mode gpu). SCOPE, stated first: real-key captures exist for 5 of 19 chapters (Chapter I seymour-flux 1600/2000/phone-touch plus a lose-retry; yunalesca; braskas-final-aeon; ffx2-bahamut 1600/2000/phone-touch plus lose and lose-retry; ffx2-vegnagun-shuyin). The round's own continuity harness did not finish (summary file missing, only seymour-flux started, no per-chapter result), so CHK-026 and CHK-027 are UNVERIFIED for the round as run. I substitute the orchestrator's live gap pass of the same bundle (D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps, run after the 14:45Z deploy: Braska 415.8 s with the dedicated harness at wide and at pack, the Chapter I Tidus revive probe, the run-in stand probe, the HUD probe) as LIVE evidence for those items only; I do not stretch it to the other chapters. WHAT I SAW. Transitions: boss card to stage with the HUD down under the dissolve (seymour-flux seq-transition-into-battle f00 to f09, 3.3 s, no pose pop at the hand-over). Action and reaction in timed frames at about 250 ms steps: Chapter I Mega Phoenix (seq-party-action: command list, item glow, revive, menu returns inside 2.2 s) and Poison Fang (seq-action-playing: the 1968 number holds about 1.2 s on Seymour, then the menu is back by 1.9 s); Chapter IV spherechange (Rikku WARRIOR gate card, twirl, new dress, attack with a 172 and a 161 number, all in about 2.2 s), which reads cleanly. Chain seams in Braska (seq-seam-3 and -5, about 2.6 s each): the arena is empty of foes for about 1.1 s, then a flash, the Yu Pagodas and the possessed aeon arrive with a name banner; readable, paced, no jerk. Retry pacing, real keys: Chapter I defeat panel up 1.7 s after the last KO and TRY AGAIN back at a first menu 4.9 s after the press (round 30b: 16.5 s); Chapter IV 10.2 s (30b: 9.9 s); chapter select to first command about 42 s in Chapter I with the pre-scene read (30b: 43.2 s) and 20.9 to 23.3 s in Chapter IV (30b: 26.6 s). MEASURED IN THE RELEASE-68 AREAS (live gap pass): FFX-2 run-in lead: the stand between a run stopping and the strike dash is 0 to 34 ms for Paine (33, 34, 34, 33, 34, 33 ms) and 0 to 34 ms for Rikku (17, 0, 17, 33, 17, 33 ms), so the prediction of 0 to 33 and 0 to 17 holds. Turn-order slide: 0 overlap frames at 250, 120, 70 and 50 ms (prefix control 8, 0, 15, 0). Braska live, wide scope against pack: see-through time 1,310 ms a minute against 3,425 (30b's round-30 Braska figure was 3,620), 367 counted swaps, 0 snaps, 150 of 150 hard cuts excused as logged planned smears, p99 frame 22.2 ms, 59.7 fps, 0 console errors. WHAT STILL BREAKS. (1) The revive: the r67 first-frame pop of 80 to 108 px is gone (1.7 px at frame 0) but Chapter I Tidus's standing plane now jumps 89.3 px sideways in one frame at +117 ms (revive-sheet-ch1.png frame 5 to 6, revive-ch1-tidus-1600.metrics.json reviveMaxStep 89.3); Chapter II Tidus and Chapter IV Rikku are clean (2.6 px). (2) CHK-027 FAILS in Braska on live: one pose-swap jerk of 103.4 px, Ixion's hurt to KO (strip jerk-009-ixion.jpg: a five-frame see-through blend then the feet land 103 px away), the same pair as the 102.9 px at pack scope and the 104 px of round 30b, so not a regression; 16 swap jerks in all, 56 planned-cut jerks to 153.6 px (Auron head, about 24 of them, excused by the smear rule). Shiva's hurt to KO is a five-frame double image with 0.063 outline overlap (swap-216-shiva-hurt-ko.jpg), 539 ghost frames over the fight. (3) A bright, blank cream frame with the cutscene eyebrow and the ENTER ADVANCE strip on top was captured between the Yunalesca victory and the results card (yunalesca-win/30-post-scene.png, 2.7 s before the results capture); the harness flagged it UNVERIFIED (screen read as results), its length is unknown. GAIN against round 30b's 8.2: +0.1, defined as the measured Braska see-through time cut by about 64 percent on live, the FFX-2 run-in stand at 0 to 34 ms, Chapter I's retry 11.6 s faster, the turn-order overlap at 0, and the revive's first-frame pop removed. HELD below 8.5 because CHK-027 still fails where it was measured, a new revive jump replaced the old one, 14 chapters have no live motion evidence this round, no input-to-response latency was measured in ms (the key to first visible frame in seq-party-action is 65 ms at the first sampled frame, a ceiling, not a measurement), phone motion was not driven (the touch runs lost the fight and could not pick items), and nothing in this round times the Mega Flare detonation or the physical attack cycle. A cap on animation (RUBRIC 6a) is not claimed: CHK-027 is UNVERIFIED for the round as run, and where measured the snaps per minute are 0.

Chief addition after the 19-chapter continuity harness finished (the auditor wrote before it did): CHK-026 FAIL in 14 and CHK-027 FAIL in 8 of 19 chapters; 66 pose-swap jerks (round 30b 115), ghosting 1,689 ms a minute (3,474), 0.01 snaps a minute (the 7.5 cap does not bind), hard cuts 3,864 (22 a minute; PR-0530 is Bailey's call). The two caps of RUBRIC 6a that bind (characterModels and animation at 7.0) are in subScores, not in this number. The auditor's 8.3 stands: gain +0.1 against 8.2 is the measured fall in jerks, ghosting and the retry pace; held below 8.5 by the open CHK-027 FAIL, the Chapter I revive step (PR-0570) and the four chapters still on the old swap scope.

### narrative: 8.8

Chief-critic input, feel and narrative auditor, round 31, LIVE build 2a9340249. No browser opened. DEPENDENCY ARGUMENT for the unchanged part (reused from round 30b, 8.8): git diff 2b48cee95..2a9340249 over src/story, src/data (except the two art registration files poseRegistrationFfx2.ts and readyIdentity.ts) and research/writing-bible.md is EMPTY for story and bible, so every script is byte-identical to the one round 30b read against the bible; release 68's changes are motion, pose, HUD, input and load, none of which touches a line of text; no open related defect (PR-0485, the portrait expression that never follows the line, is carried and unrelated to r68). FRESH REAL-KEY EVIDENCE this round: pre-scene, scene skip (Esc over the scene opens the pause with the chapter objectives, quote and unlocked stills), results, Confirm, the post scene and the chapter select, played by real keys in 5 chapters: Chapter I seymour-flux (pre-scene opens on Kimahri's 'Kimahri knows this one. And this one.', the bible's line 2; post scene 'You can't send what refuses to go.' with Seymour's plate; script read: all 22 pre lines and the three post scenes A, B and C present in src/story/scripts/seymour-flux.ts), Chapter II yunalesca (Braska's 'Thank you for coming this far with me.' opens it; the post scene is Yunalesca's 'There. Now no one can summon it.', bible E2 post line 2, and she is not made to taunt), Chapter III braskas-final-aeon (post scene opens on Rikku's 'Is that it? Did we—'; results AP 0, gil 0 as the sourced record), Chapter IV ffx2-bahamut (Rikku 'Creepy hole, creepy ladder, creepy hallway.' before; after the fight the card says 'Results' with no victory word and no quip, and Rikku's '...Yunie.', matching the bible's E6 ban on a victory pose, fanfare or quip; Bahamut has no line of dialogue), Chapter V ffx2-vegnagun-shuyin (Nooj 'Baralai carries him.', and the Farplane Glen coda with Shuyin kneeling, 'Let's go home' on the results). Right tone for each game: FFX chapters carry the grim column of the quip table, FFX-2 Chapter IV carries none, Chapter V carries a quiet one. Reachable aftermath: every one of the five reaches its post scene and returns to chapter select with the clear kept after reload (CHK-022 PASS for those five). NOT SCORED INTO THE NUMBER and still UNVERIFIED this round: reachability of the other 14 chapters' scenes by real keys (30b saw all 19 won by real keys; nothing in r68 touches scene flow, but no r31 capture exists), phone scenes (the phone-touch runs skipped the pause path), and any listening to the voiced lines. Open and carried, none new: PR-0485. Held at 8.8 for the same reasons as 30b: expression tags still read by no portrait, and the five-chapter coverage.

### audio: UNVERIFIED (no number)

Chief-critic audit of AUDIO for deep review round 31, live build main 2a9340249, bundle index-CahDxk82 (confirmed on the live index.html). I cannot hear, and no agent heard anything. No number is given: there is no numeric owner listening verdict for this mix. The only number is 'I like all the music 7/10' (2026-10-13, D-804, music only). It predates the re-rendered victory cues, the SFX and voice passes and the conference sound pass. docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28, and decisions.json has no newer score (D-1310: no listening score is made without ears; D-1371: CHK-B1 cannot be delegated). Approving a direction is not a score, so the category is UNVERIFIED, not a guess. Nothing is averaged or zeroed.

TECHNICAL, MY OWN RUN THIS ROUND (no browser; ffmpeg, node, curl HEAD, vitest; files in critic/rounds/round-31/audio/):
- tools/audio/qa.mjs --strict: 43 music cues, 0 cues with findings, 0 sfx findings. Integrated loudness -16.21 to -16.01 LUFS. Worst true peak -1.48 dBTP. 0 clipped samples. Loop seams 43 of 43 ok. SFX sprite 134 cues (peak -1.13 dBTP), v2 sprite 92 cues (-1.11), 9 parity packs all findings-free. 222 voice lines (4.04 MB) and 9 voice-pass lines. Shipped audio 71.61 of 105 MB (qa.log).
- All 319 mp3 under public/audio decode with 0 ffmpeg errors. 34 of them are public/audio/candidates, which are not shipped. (verify.log)
- 300 of 300 audio entries of critic/artifacts/2a9340249.json are sha256-equal to public/audio. Manifest decodeChecked true, audioUnverified 0.
- LIVE https://echoesofspira.com/: HEAD on all 300 shipped audio files returns 200 with the right content-type (audio/mpeg, application/json for the manifest) and a content-length equal to the local size. 300 of 300 ok (head.log). The byte-for-byte comparison of all 7,169 live files is the live review's (PASS) and is not repeated.
- themes-audit: 0 chapters depart from the chapter cue map. Vitest, audio-*, results-music, pause-music, themes-*, voice-* and flow-encounter-chain: 70 files, 1,185 tests, all pass.
- Voice levels (ffmpeg ebur128, voice-lufs.json): Chapter I 28 lines, Chapter II 18, Chapter III 46. -22.4 to -21.1 LUFS, mean -21.7, worst peak -1.7 dBFS. Music is about -16 LUFS. At the default sliders (voice 0.9, music 0.7) with the 3.5 dB music duck, a spoken line and the ducked music come out at about the same long-term level on paper. Trims are not modelled. This is a measurement for Bailey's ear (CHK-B1), not a defect.

CHANGE SCOPE: git diff 2b48cee95..2a9340249 over public/audio, src/audio, tools/audio and docs/audio is empty. Over src/story, src/data and the chain and results-music code it holds only two pose-registration files. The audio call sites in the BattleScreen split (setPauseMusic, voice.setPaused, menu-open, momentEvents) are the same text moved, which I checked by reading the old and new code. No sound call was added or removed by release 68. The shipped cue set and routing logic are therefore the ones round 30b measured, and I re-measured them anyway.

ROUTING: capture owner's AudioManager snapshots, live site, headless Playwright, PYREFLY_BROWSER=gpu, real keys, 11 runs, plus each run's music request list. I opened no browser.
- Scene and battle cues are correct at the first battle menu in every run: Chapter II scene-zanarkand-dome then boss-challenge, Chapter III scene-dreams-end then boss-jecht, Chapter IV scene-bevelle-underground then boss-bahamut, Chapter V scene-farplane then boss-vegnagun. Every cached music track is source 'prerendered'; none is a synth.
- Chapter I's pre-scene is silent at the sampled instant. That matches the script, which starts with music(null) and brings scene-gagazet in at line 105. boss-seymour is playing at the first menu in 6 runs.
- Chapter III chain: boss-jecht at the first menu. Seam 2, the scripted 'valefor-enters' scene, is silent at +0, +1.5 and +3 s. Its script opens with music(null) and a chant SFX and ends with music('boss-yu-yevon'). boss-yu-yevon is then current at seams 3, 4, 5, 6 and 7, each at +0, +1.5 and +3 s.
- Chapter V chain: boss-vegnagun is current at seams 2 to 5, 3 samples each. boss-shuyin.mp3 was requested. Its playing was not sampled this round (see capturesNeeded; the r30b observation is reused below).
- Wins: victory-ffx at the results of Chapter I (1600 and 2k), Chapter II and Chapter III. victory-ffx2 at the results of Chapter V.
- Chapter IV desktop wins are silent at the results (1600 and 2k). The phone win plays 'pause'. This is the documented design (D-1294, D-1352, quiet results), not a routing fault. It is an open owner call from r30b.
- Losses: defeat-ffx2 starts as boss-bahamut fades (Chapter IV route loss). defeat-ffx plays at the results of the Chapter I phone loss.
- Voice: asked equals started in every run (29/29 in Chapter III). Every play is heard with why=ended. cache.failed is 0. The duck flag equals 'a line is playing' in all 87 snapshots. The context was running throughout. Volumes were master 0.8, music 0.7, sfx 0.7, not muted.
- 0 audio requests missing in 11 runs (notFound 0). Capture owner reports 0 console errors.

MINOR DEFECTS (all carried, none introduced by release 68 so far as shown): PR-0532, a Chapter I fanfare cut and restarted at the results swap (reproduces here). PR-0514, the first UI sound on the procedural synth (more frequent this round). Detail in issues.

NOT EVIDENCED THIS ROUND (UNVERIFIED; capturesNeeded): title and chapter-select cues, the pause cue mid-battle and its return, the retried fight's theme after a loss, Chapter I's scene-gagazet under its scene, the boss-shuyin phase live, and the Chapter III ending-ffx and Chapter V ending-ffx2 post-scene beds.

Verdict: technical health and routing support a high reading, but the listening half decides the number and there is no owner verdict. UNVERIFIED.

### interface: 8

Round 31 deep review, live build main 2a9340249 (bundle CahDxk82, release 68). I read the capture owner's stills and run.json files only and opened no browser (capture mode PYREFLY_BROWSER=gpu, headless Playwright, per index.json). Sizes seen: 1600x900 (Chapters I, II, III, IV, V and the FFX-2 Vegnagun chapter), 2000x1012 (Chapter I and IV) and 390x844 touch (Chapter I and IV). Not seen: 4:3, ultrawide, 1440p, 4K. Same score as round 30b (8.0). Release 68 gained one thing in my area and broke one, and every other defect I audit is the same as in round 30b: the pause screens are pixel-near-identical to round 30 (fewer than 0.01 percent of pixels differ by more than 40 levels), and the first-menu, intent and guide frames carry the same defects. WORKS. (1) Target selection is clear in all six chapters seen: pointing hand (FFX) or lotus ring (FFX-2), a TARGET flag with the name and damage type, brackets, the other party rows dimmed; Esc returns to the same menu with 0 targets (run.json afterTargetCancel, every chapter); FFX-2 also shows ENTER CONFIRM / ESC BACK. The target flag is now about 14 px (cap height about 9 px; PR-0551 looks fixed by r68, and the focused review's DOM sweep says 14.0 or more at five sizes). (2) Advice is legal, owned and located. Across the eight winning runs 784 of 784 advisor picks found their named row and took it (0 label mismatches, 0 empty picks, 0 target mismatches on desktop); the card or chip names the action, target, MP cost and the submenu (IN ITEMS, IN SKILL, a star on the owning row). On broken boards it stays right: Chapter I with Kimahri KO proposes Mega Phoenix (revives all, no MP); Chapter IV with Yuna cursed shows the CURSE guide note (Holy Water, Esuna or Remedy) and Rikku's change warning. (3) The enemy-intent card separates certain from conditional: Chapter I Lance of Atrophy SCRIPTED, ZOMBIE 50 percent chip, DAMAGE RANDOM TARGET with per-ally ranges and the line that it lands on one of them; Chapter II Absorb with an IF YOU ATTACK block (blind or silence on every action that reaches her); Chapter III Power Wave; Chapter IV Curse with an ALSO line that says the Mega Flare wait is about 25 seconds on the game's own clock; Chapter V Tail Beam with random-target ranges. (4) Overlays: after a lost fight, TRY AGAIN, party prep, the second loss and CHAPTER SELECT, no overlay of the lost fight survived in either game; the default button moves to CHAPTER SELECT after the second loss. (5) Pause: Esc and P open and close (run.json pOpens, pCloses, resumedByEsc true in every desktop run); the plate is full-bleed at 1600, 2000 and 390 with the face on screen. (6) Copy: 0 developer-vocabulary hits in 650+ captured text strings. (7) KO is shown by a KO tag and strike-through as well as colour; GRANTS text and status words are not colour-only. PROBLEMS, all minor or polish, none critical or major: (a) Chapter I intent card at 1600 and 2000: the IF YOU ATTACK header shows with no body (clipped; J HOLD +4 MORE or +3 MORE), so the conditional half is hidden by default (R31-INT-01, PR-0540; Chapter II shows its body, so it is the Chapter I card height); it sits over the NOW tile of the turn order (R31-INT-02, PR-0516 and R64-P2). (b) Seymour's bark box covers SPECIAL, WHITE MAGIC and ITEMS at the Chapter I first menu at 1600, 2000 and on the phone, and the turn-intro wipe hides the first menu on the retry in both games (R31-INT-03, PR-0502). (c) Chapter IV desktop CHANGE list: 'GRANTS: BLUE' is pink on cream and unreadable at 1600 and 2000 and never explained (R31-INT-04, PR-0541). (d) NEW in r68: the phone FFX-2 enemy-move line now abbreviates the party to 'Yun / Rik / Pai' although the second row has room; round 30 (r66) printed Yuna, Rikku, Paine in full (R31-INT-05, CHK-009). (e) Phone: CHANGE tiles clip ('UNNER', 'GRANTS: BLUI'); the pause header wraps over the tab dots, the tab strip is cut at CHAPTER and ACCESSIBI, and the OPTIONS pane stops at a half row of TEXT SPEED with no scroll cue (R31-INT-06, PR-0518 and PR-0554). (f) Pause chrome contrast by the same pixel sampling as round 30b: header 1.88:1, BATTLE STATS 2.37, H PAINTING ONLY 2.83, inactive tab 3.49, options section titles 2.38 (R31-INT-07, PR-0542; thin antialiased text, so a rough figure). (g) FFX target mode shows no Enter/Esc strip though FFX-2 does, and the hint strip labels the guide 'Intel' while its panel says GUIDE (R31-INT-08, PR-0543). (h) The default Chapter I advisor is a one-row chip; the reason, benefit and CURES KO tag live only in the G card (PR-0519, a standing question for Bailey), and the capture owner's run.json cardFirst/focFirst (advisorMinEffPx 14.2, overlap 0) measures a card at x15 y118 that is not in the screenshot, so that number is not evidence for what the player sees (R31-INT-09). (i) The phone Items list shows six rows (Potion to Mega Phoenix) of 27; the advisor's Holy Water and Poison Fang picks could not be reached by the harness in rounds 30 and 31 and an ally target tap resolved to the boss, so whether a touch player can reach and aim them is unproven (R31-INT-10). The stalled list (open in rounds 30, 30b and 31 at the same severity) is R31-INT-01, 02, 03, 04, 06, 07, 08. Counts toward the unchanged score: one defect fixed (PR-0551) against one introduced (R31-INT-05). Not judged because no frame exists: 4:3, ultrawide, 1440p and 4K shapes, the Items and Special lists beyond the first rows, multi-target and all-party target frames, and gamepad hints.

Chief addition: the matrix and phone sweeps on the live bundle (914 and 267 text elements, none under 14 px) support the auditor's reading that the legibility floor holds; the one regression (PR-0571) and the stalled list stand, so 8.0 is unchanged.

### onboarding: UNVERIFIED (no number)

Round 31 deep review, live build 2a9340249. No number, for the fifth review running. The pause ACCESSIBILITY, CONTROLS and MUSIC tabs (text scale, REDUCE MOTION, REDUCE FLASHES, colour vision, key remapping) have no frame in the round-31 evidence: run.json pause.tabs lists only Tidus/Yuna/Kimahri (or Yuna/Rikku/Paine), Chapter, Guide, Options, the OPTIONS list has no text-scale row (TEXT SPEED only), and the tabs appear only as labels in the strip. Release 68 changed exactly this area (accessibility text, REDUCE MOTION gating of the new ramps, focus rings, Tab and Enter on menus, 44 px targets), but the only measurements are the builder's branch runs and the focused review (TEXT SIZE 115 and 130 in the F1 HUD at 1280x720 and 1600x900 in Chapters I and IV), none of them on the live bundle in this round, so I do not reuse them for a score. NEWCOMER WALKTHROUGH: SIMULATED only, never real. Every route is a scripted real-input run (Playwright keyboard; touch taps at 390x844) from a fresh profile; no human newcomer, no real phone, no real controller. What the stills show of the first-time path: the title strip lists ARROWS/WASD, ENTER, ESC, B Briefing, L Changelog, T Title art; Auron's briefing teaches the rule that differs between the games ('nothing moves until you act' for FFX; 'the clock keeps running until you pick a command, then it waits' for FFX-2) and is skippable (ENTER/ESC skip, 20 seconds, once; D never show again; the phone says TAP SKIP and TAP HERE NEVER SHOW THIS AGAIN); the board guide is three steps with ESC SKIP THE GUIDE and a phone TAP HERE SKIP THE GUIDE; the Chapter IV board card names its game and its mode (CTB or ATB). On the phone the first menu carries a first-time coach (Chapter I Auron 'He strikes first', true in this seed because Seymour's Lance hit Kimahri before the first menu; Chapter IV Rikku 'GAUGES RUNNING, A COMMAND HOLDS THEM', FADES ON ITS OWN, FIRST TIME ONLY). On desktop Chapters I and IV (the F1 HUD) there is no teaching card at the first menu (Seymour's line and a TIP-less menu in Chapter I; nothing but the Curse banner in Chapter IV): that is release 64's decision D-1344, still an open question for Bailey, not a defect. Chapters II, III and V on desktop (legacy HUD) do show the coach (Auron in Chapter II, Rikku in Chapter V). Non-colour cues hold in the frames: KO tag and strike-through, status words (CURSE with the cure list), dressphere letter badges (WM, DK, WR), the pointing hand and TARGET text, key-glyph chips. Defects seen: the phone pause still shows keyboard hints (ESC RESUME, H PAINTING ONLY) and its tab strip is cut so the ACCESSIBILITY tab is not reachable by sight on a phone (R31-INT-06 and R31-ONB-01); VISUAL STYLE 'HD-2D' and PRESENTATION 'THE ECHO - B' stay unexplained and the FFX options list shows no focused row (PR-0508, PR-0511, carried). Because text scale, remapping, colour vision, flash and motion accommodation cannot be judged from this evidence, the category stays UNVERIFIED and is never averaged away.

Chief addition: the gap pass walked the pause ACCESSIBILITY tab on the live bundle (TEXT SIZE 100 to 115 to 130 sets data-text-size and enlarges the tab strip; REDUCE MOTION, REDUCE FLASHES and LOW EFFECTS set their attributes). Colour vision on a frame, key remap, the 130 percent first menu and the phone first menu remain unwalked, so there is still no number.

### prep: UNVERIFIED (no number)

Deep review round 31, live build main 2a9340249 (release 68), bundle index-CahDxk82.js, https://echoesofspira.com/. I opened no browser. I read the capture owner's evidence (critic/rounds/round-31/evidence: 291 index entries, all PYREFLY_BROWSER=gpu headless Chromium, keyboard 244 and touch+keyboard 47, injected false on all, 1600x900 / 2000x1012 / 390x844, only labelled setSeed(1) as a setup hook), the focused report, and the r68 gap pass, and ran tools only.

SEEN AND PROVED. (1) Results and rewards read clearly and trace to sources: Chapter I win shows AP 10,000 x4, gil 6,000, Lv. 4 Key Sphere, per-character S.LV gains, NEW BEST (research/ffx-seymour-flux.md, as round 30b traced); Chapter II shows AP 14,000, gil 9,000, Lv. 3 Key Sphere, which matches research/ffx-yunalesca.md line 89 and 1007 (14,000 / 9,000 / key sphere; the 21,000 overkill variant not triggered); Braska's Final Aeon shows AP 0 and gil 0 (the sourced all-zero record round 30b noted); Chapter IV shows EXP 1,300, AP 15 per dressphere, gil 1,000, Gris Gris Bag, per-dressphere AP progress (src/data/ffx2/enemies/bahamut.ts, round 30b); Chapter V shows EXP 18,600, AP 160, gil 9,450 and three items, which I did NOT reconcile against the per-part table in research/ffx2-vegnagun-shuyin.md (parts are listed separately there), so I take it as shown, not as proved. The defeat results screen on the phone (390x844) names TURNS, ATTEMPTS, BEST and offers RETRY / CHAPTER SELECT. (2) Defeat and retry are understood and fast on the live build: Chapter I (injected hp 1, labelled): defeat card 'Try again / Chapter select' in 1.7 s, TRY AGAIN to a first menu in 4.9 s with a new seed (1612001106), second loss 1.6 s later, CHAPTER SELECT slab back to the board. Chapter IV: first loss card at 20.8 s, TRY AGAIN to a first menu in 10.2 s (seed 987401995); the card names a cause, turn, attempt and time ('Felled by Attack, turn 4, attempt 1, 0:30'; attempt 2 'turn 4, 0:29'; the stuck-probe frame 'Felled by Mega Flare, turn 12, 1:24'). Release 67's wording fix is visible: the second slab reads CHAPTER SELECT on the public address (ProDefeatScreen, backlog 58) and TRY AGAIN is the focused slab. Round 30b measured 16.5 s (Chapter I) and 9.9 s (Chapter IV) for the same path: Chapter I is 11.6 s faster, Chapter IV unchanged. (3) Progress is reliable: 8 of 8 wins show the clear on the board and the same clear after a real page reload (1600x900, 2000x1012 and 390x844; ledger of 19 tiles, beaten 1 each run, selected id correct). (4) The CHAPTER tab (objectives, a sourced TIP, three 'moment' cards) renders in both games at 1600x900 and on the phone; the r68 prep tab strip rebuild (role=tablist/tab, roving tabindex, prepTabs.ts) draws unchanged.

NOT SEEN, so no number. The prep agency itself: no capture in 291 entries opens STATS, SPHERE GRID, EQUIPMENT, ITEMS or OVERDRIVE (FFX) or DRESSSPHERES, STATS, ACCESSORIES, ITEMS (FFX-2), changes a value, and shows the change in the first menu; Auron says 'The tabs are for later' and every route starts the battle from the CHAPTER tab. The r68 change to this exact surface (tab roles, Tab/Enter reaching the strip) was never driven by a key. On the phone prep capture the tab strip is cut at 'ACCESS' (ITEMS off screen); the CSS makes it a scrolling strip, but no touch scroll was run. The hold-Home booth reset, REDUCE FLASHES / REDUCE MOTION and the pause ACCESSIBILITY, CONTROLS and MUSIC tabs are likewise unwalked. This is the thirteenth review with the same open half (PR-0503); RUBRIC section 8 already requires the method check before a further try. Indicative only, not a score: with agency unseen, the proved half (results, retry, progress, defeat clarity) would read about 9.0. Cross-references, scored elsewhere: first-menu waits and the Chapter IV retry's 10 s (delivery); Chapter IV victory silence on the default desktop (PR-0504, audio).

### delivery: UNVERIFIED (no number)

Deep review round 31, live build main 2a9340249, bundle index-CahDxk82.js, artifact hash 865efda30b6915c0ee3794b7ed1126a531a7a51f48086f303927047aedb3c17d, https://echoesofspira.com/. I opened no browser. Host: Windows 11 10.0.26200, AMD Ryzen 7 7800X3D (16 threads), 64 GB, RTX 5070 Ti (named in round 30b, confirmed there on this PC), headless Chromium 153.0.8010.12, PYREFLY_BROWSER=gpu (ANGLE D3D11), real Cloudflare network for the capture owner's runs, warm cache; the focused review's runs were against a local server of the same bundle.

PROVED. (1) Exact artifact (CHK-017): my own verify-live against critic/artifacts/2a9340249.json (sample 80, 97 files checked) = PASS, liveManifest match, 0 mismatched, 0 missing, 0 wrong type, 0 errors; the live HTML names index-CahDxk82.js; the live review's full compare (7,169 files, 15:08Z) is PASS and index.html matches once the Cloudflare analytics beacon is cut; rehash of the stored manifest confirms the hash; dist-release/artifact-manifest.json carries the same hash. Bundle fetched from the live edge in 0.47 s (1,450,107 bytes brotli, node-side curl, not a browser). (2) Shipping references and media (CHK-018, CHK-019): art-derive audit --dir dist-release PASS (1,371 literal art names: 42 shipped files, 1,329 derived masters, 0 dangling; 38 of 38 strip thumbnails); the grep for variant or raw paths in src finds one comment only; the manifest diff from release 66 (2b48cee95) to this build is 7 added and 7 removed JS/CSS files and index.html, no art or audio byte changed, manifest decodeChecked true, audioUnverified 0, two flat-colour Paine files on the intentional list. (3) Console and network: 0 console errors, 0 not-found, 0 html-served-as-image in all 14 capture-owner runs; 0 in the live review smoke; the phone gate on live saw one ANGLE X3595 shader-compile warning in the Chapter I phone run, not a page error. (4) Complete flows by real input (CHK-022): all five chapters won from the title to results, CONFIRM, the scene after CONFIRM, chapter select and a real reload that keeps the clear: Chapter I 53 turns (1600x900 and 2000x1012), Chapter II 154 turns (15:30), Braska's Final Aeon 284 turns (27:41, seven links, six seams, no stall), Chapter IV 60/59/60 turns at 1600x900, 2000x1012 and 390x844 touch, Chapter V 88 turns (13:16); defeat and TRY AGAIN in Chapters I and IV. 286 of 291 captures are harness-verified; the five harness UNVERIFIED frames each carry a cause (three results-screen frames taken after the scene had passed, two phone Esc frames because a phone has no Esc). (5) Saves (CHK-024): SaveData.ts, every storage call and the settings schema are untouched since release 66 (git diff 2b48cee95..2a9340249: no persistence file, no new getItem/setItem; coachState.ts is a comment change); the round 29 upgrade matrix is reused on that argument; I ran the 9 save and defaults vitest files (144 tests) green; 8 of 8 real-reload board checks pass and the live review's volume survives a reload. (6) Frame times, reused from the focused review's candidate runs of the same bundle (dependency: same content-hashed bundle, art and audio byte-identical to release 66, live byte-identical to the artifact), 1600x900, 59.5 to 59.9 fps: Chapter I 59.6 fps p99 24.9 ms 0.4 percent over 34 ms max 296.8 ms; Chapter IV 59.5 fps p99 39.3 ms 1.6 percent max 158.6 ms (release 66 live: p99 35.3, 1.2 percent); Braska 59.9 fps p99 25.2 ms 0.4 percent max 185.5 ms; Vegnagun 59.8 fps p99 24.4 ms 0.1 percent max 476.6 ms (release 66: 446 ms); Trema 57.3 fps p99 72.5 ms 2.3 percent max 143.7 ms (release 66: 57.4 fps, 71.2 ms, 2.3 percent, 366.7 ms), so no regression and PR-0544 open.

NOT PROVED, so no number. (a) First-load time on the live URL in a browser: no run timed it (the focused cold load is a local server, cache off, 0.39 s to the title, two unthrottled runs, the throttled list empty); my node-side probe puts the cold title at about 3.1 MB on the wire (HTML, bundle 1.45 MB brotli, CSS 0.10 MB, two small chunks 0.16 MB, title painting 1.36 MB at 1x or 0.81 MB at 2x), which meets the proposed 4 MB budget, but that is arithmetic, not a load (PR-0520, third review). (b) Browsers and devices: Chromium only; no Firefox, WebKit or Safari play, no real phone or controller. (c) Live-build frame times for this round's 19-chapter continuity run: it was still running (Chapter I only at 13:55); the numbers above are the focused review's. (d) First-ability stalls: the probe keeps the worst frame, not when it happened. (e) Emulated phone first-command waits are 19.8 s and 42.4 s (R31-D1); memory climbs per chapter change (R31-D2). Indicative only, not a score: the proved half is strong (identity, flows, saves, 0 errors) and the measured weaknesses are R31-D1, R31-D2, PR-0544 and single frames of 297 to 477 ms, which together would hold the category near 8.5 if the two named gaps close clean.

Chief addition: frame-time outliers of the live run (PR-0580), the phone first-command wait (PR-0567), the memory growth (PR-0573) and a renderer crash in a long idle gap run (PR-0565) are filed; first-load time on the live URL, Firefox and Safari were not measured, so there is still no number.

## Visual sub-scores (outside the weighted score, RUBRIC 6a)

characterModels 7, enemyModels 7.9, animation 7, fidelity 8.6, camera 7.5 (previous 7 / 7.9 / 7 / 8.6 / 7.5). All five held. The numbers moved in the right direction (jerks 115 to 66, ghosting 3,474 to 1,689 ms, height misses 15 to 5, stance misses 39 to 23, snaps 0.01) but both capped scores sit at their cap while CHK-026 fails and the head and feet fails did not fall (489 to 476, 12 to 16); camera stays 7.5 (PR-0479, and 22 planned hard cuts a minute awaiting Bailey, PR-0530); enemyModels 7.9: Seymour Flux and Bahamut cut-outs are clean, Mortiorchis still dissolves through a see-through frame.

## Continuity harness (CHK-026 and CHK-027)

continuity harness (CHK-026/CHK-027): 19 chapter(s), 10383 s of battle, 56.2 to 60 fps, 19 of 19 run by the dedicated harness; CHK-026 FAIL (476 swap(s) change a head by more than the tolerance (worst 28.8 percent; 9.3 percent where the head is registered); 16 swap(s) of a standing figure move its feet more than the tolerance (worst 10.5 px at 1600 wide); 5 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.765 to 1.261; the bands are tools/posescale/pose-bands.mjs's); 23 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 43 px at 1600 wide), whatever stance the registration claims); CHK-027 FAIL (66 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 252.2 px)); 1,689 ms of see-through a minute (101.3 frames a minute at 60 Hz) Read by harness 39fa82cc3c9e (37 files; tree D:/pyrefly-release55 at 67256e1ca; policy e3bacf4e; probe v3 2c2bfe73; pose table cc796c34 (114 subjects); waivers 84fc043f (80 rows)).

| chapter | CHK-026 | CHK-027 | swaps | ghost ms/min | worst head % | feet px | worst swap jerk px | fps | p99 ms |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| seymour-flux | FAIL | PASS | 209 | 517 | 10.8 | 4.9 | 0 | 58.8 | 33 |
| yunalesca | FAIL | FAIL | 1158 | 5531 | 10.7 | 1 | 109.7 | 56.2 | 51 |
| braskas-final-aeon | FAIL | FAIL | 1456 | 1197 | 15.8 | 1.4 | 155.8 | 59.2 | 35.8 |
| ffx2-bahamut | PASS | PASS | 286 | 587 | 0.7 | 0.3 | 0 | 59.6 | 39.4 |
| ffx2-vegnagun-shuyin | PASS | FAIL | 478 | 792 | 9.1 | 0.6 | 200.8 | 59.8 | 25.8 |
| ffx2-leblanc | PASS | PASS | 558 | 1615 | 28.8 | 0.8 | 29.2 | 59.5 | 38.2 |
| seymour-anima-macalania | FAIL | PASS | 283 | 669 | 22.2 | 1 | 0 | 59.8 | 22.8 |
| evrae-airship | FAIL | PASS | 453 | 3186 | 15.5 | 1.1 | 0 | 59.7 | 22.3 |
| yojimbo-cavern | FAIL | PASS | 78 | 508 | 15.4 | 0.3 | 0 | 59.7 | 20.5 |
| seymour-natus | PASS | PASS | 141 | 1324 | 13.4 | 0.8 | 0 | 59.8 | 20.6 |
| ffx2-fallen-aeons | FAIL | FAIL | 363 | 1157 | 15.6 | 1.2 | 57.3 | 59.7 | 26.3 |
| seymour-omnis | PASS | PASS | 631 | 1273 | 8.7 | 1.5 | 28 | 60 | 23.9 |
| ffx2-trema | FAIL | FAIL | 1752 | 2724 | 2.3 | 10.5 | 109.6 | 56.7 | 74.7 |
| isaaru-via-purifico | FAIL | PASS | 223 | 453 | 16.6 | 1.2 | 27.3 | 59.9 | 19 |
| ffx2-den-of-woe | FAIL | FAIL | 196 | 1049 | 2.8 | 0.7 | 48.8 | 59.8 | 20.4 |
| ffx2-ixion-djose | FAIL | PASS | 209 | 5030 | 18.9 | 0.6 | 0 | 59.6 | 26.2 |
| sin-fins-core | FAIL | FAIL | 1603 | 1350 | 15.5 | 1.4 | 252.2 | 59.9 | 23.5 |
| sin-face | FAIL | PASS | 286 | 2569 | 15.5 | 1.1 | 0 | 59.7 | 21.4 |
| mirror-aeons | FAIL | FAIL | 982 | 1005 | 19.8 | 0.9 | 58 | 59.7 | 29.6 |

## Target gate

required 17, matched 12, failing 0, unverified 3, waiting 2. Visual auditor's counts from critic/rounds/round-31/targets (title, chapter select, dialogue, results, party prep, pause, phone defeat page, Auron briefing, three boss body sheets, FFX and FFX-2 battle). The settled party-prep frame was captured by the gap pass (guide dismissed, 2.5 s). Unverified: a Shuyin dialogue portrait, the phone Chapter III and IV results frames, the Chapter III post-fight stage. Waiting: surfaces with no tile in targets.json.

## Checks

| check | result | mandatory | state / reason |
|---|---|---|---|
| CHK-001 | UNVERIFIED | no | technical and routing checked; listening absent. Technical half PASS (qa --strict 43 cues, 0 findings, -16.21 to -16.01 LUFS, 300 of 300 shipped files HEAD 200 and hash-equal, 319 mp3 decode clean, routing correct at every sampled first menu, seam and results). The pass rule needs Bailey's sign-off on the listening half (PR-0148), which only he can give. Filed mandatory:false by reviewer judgment as ratified in round 30b; it passes nothing. The title cue is null before the first gesture (autoplay lock), not shown to be a defect; the FFX-2 board cue and Chapter V pause cue were not sampled. |
| CHK-002 | PASS | yes | pause plate at 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160 (fresh browser each, real Escape), and 390x844 by touch chip. Chief gap run on the live bundle: the plate draws from the 2x master (pause/tidus.2x.webp) at every desktop size; the plate is the slid option B (D-070) with the uncovered side the feathered falloff and the face on screen; at 3840 the plate is the D-450 capped 3,360 px; scrollWidth equals clientWidth at all six sizes. At 390x844 the touch chip opened the pause and the plate fills the window with the face on screen (gap-pass still read by the chief); its rect was not measured. The load diet and presentation split did not change which variant is picked. |
| CHK-003 | PASS | yes | legibility sweeps: matrix (Chapter I at six sizes, command menu and pause) and phone (Chapters I and IV, first menu, battle menu, pause). Chief gap runs on the live bundle, floor 14 css px: matrix 11 of 12 surfaces measured (914 text elements, smallest 14 px, none under); the 12th, the 390x844 pause by key, cannot open (a phone has no Escape) and is covered by the phone job, which opened it by the chip: 6 of 6 surfaces, 267 elements, smallest 14 px, none under. The "clipped" count is the PAUSE chip's visually hidden label (a 46 px icon chip; sw 124 against cw 44), not visible text. Round 30b's only FAIL reason (PR-0551, the target flag under 14 px) is fixed. Not swept this round: prep, results and the other 17 battle first menus (carried; not required by this plan). Pause chrome contrast is PR-0542 (CHK-003 is about size). |
| CHK-004 | PASS | yes | first menus and advice, Chapters I to V. Every panel that names an action named one the actor could press: 784 of 784 advisor picks found their named row (0 label mismatches, 0 empty picks, 0 target mismatches on desktop); broken boards held up (Mega Phoenix with Kimahri down; Curse on Yuna shows the cure list). |
| CHK-005 | UNVERIFIED | no | broken boards. Two broken boards were seen and held up; the rest of the matrix (two down, healer or summoner down, no revive items, no MP, a telegraphed re-kill) is not in this round's evidence. PR-0515 not re-examined. Non-mandatory in the plan. |
| CHK-006 | PASS | yes | after a lost fight: TRY AGAIN, party prep, second loss, CHAPTER SELECT. No overlay of the lost fight survived in either game in Chapters I and IV; the default button moves to CHAPTER SELECT after the second loss; the chained chapters' results-screen defeats return to a first menu with a new seed (chief gap runs). |
| CHK-007 | PASS | yes | player-facing copy. 0 developer-vocabulary hits in 650+ captured text strings. |
| CHK-008 | FAIL | yes | panels over actors and live controls. The opened E card covers the current actor's turn-order tile and part of Seymour; the bark box covers three command rows (PR-0516, PR-0502). The 80-state sweep at 1280x720 and 2560x1440 was not re-run: PR-0552, PR-0553, PR-0560 are carried, not re-observed. |
| CHK-009 | FAIL | yes | names whole. Names are whole in the CTB list, party rows, command rows and boss bars at 1600 and 2000. FAIL on two counts: the phone enemy-move line prints Yun / Rik / Pai (new in r68, PR-0571) and the phone CHANGE tiles clip UNNER and GRANTS: BLUI (PR-0518). The DOM scrollWidth sweep at 1280 and 3840 passed for Chapter I (no horizontal scroll at any matrix size); the longest-name set was not swept. |
| CHK-010 | PASS | yes | single-target frames in Chapters I to V (capture owner) and group (all-party) target frames in Chapter I (Mega-Potion) and Chapter IV (Lunar Curtain) by real keys (chief). Single-target selection is obvious at a glance in every frame seen (gold or pink row, pointing hand or lotus ring, TARGET flag with name and damage type, brackets, party rows dimmed; phone: name tag, hand, ATTACK to SEYMOUR FLUX). The chief opened the Items list by real keys and chose a group item: Chapter I Mega-Potion shows an explicit ALL ALLIES label, corner brackets on every living ally and the KO ally dimmed (group-target.png); Chapter IV Lunar Curtain shows the ALL ALLIES label (DOM read; target step up, cancel returns to the menu with awaitingMenu true). The multi-enemy case was not framed (these chapters have one foe or the list was not reached). One low-confidence reading carried:  |
| CHK-013 | PASS | yes | approved art in the running game. verify-approved on this tree: 917 ok, 0 mismatched, 0 missing (approved 869, judge-locked 48); the live artifact is byte-identical to the focused-reviewed bundle; the visual auditor judged the title, chapter select, dialogue, results, pause, defeat and boss bodies as they render. No art file changed in release 68. |
| CHK-014 | PASS | yes | facing and pose for the shot, 19 chapters. In every continuity strip and capture read (19 chapters of strips, the fan's 11 frame sets) the figures face across the field and attack poses read as aimed at the target; no facing complaint came from the visual auditor or the fan. Staging overlaps (Auron behind Tidus) are PR-0549; size changes are CHK-026. Confidence medium: no per-chapter numeric slot check was run this round. |
| CHK-015 | PASS | yes | 5 chapters by the capture owner, 19 by the harness; real keys and touch at 390x844. Real Playwright keyboard (and touch contexts at 390x844) on the live site, positive and cancel paths: scene Esc skip, pause Esc/Tab/options, target single and cancel, advisor N, intent E, guide G, results Enter, defeat card TRY AGAIN and CHAPTER SELECT. The chief's Trigger Happy run used real KeyR presses. Only labelled setup hooks: setSeed and, for lose-retry scripts, hp 1 and mp 0. Not covered: a physical controller and a physical phone. |
| CHK-016 | PASS | yes | 291 captures. Every capture asserted the screen through window.__pyrefly.screen(); 286 of 291 harness-verified; 5 failed their own assertion and are recorded UNVERIFIED, not used as proof (30-post-scene in seymour-flux-win, seymour-flux-win-2k and yunalesca-win; two phone Esc frames). The Chapter IV lose-retry folder mixes runs (PR-0539). |
| CHK-017 | PASS | yes | exact live artifact. The live page still serves assets/index-CahDxk82.js (chief curl at the start of the review and again at its end). The live review's full compare of 7,169 files is PASS (critic/reviews/2a9340249-live.json); the delivery auditor's verify-live against critic/artifacts/2a9340249.json (sample 80, 97 files) is PASS with 0 mismatched, 0 missing; all 14 capture-owner runs, the 19 harness runs and the chief's gap runs saw 0 console errors and 0 not-found requests. Artifact hash 865efda30b6915c0ee3794b7ed1126a531a7a51f48086f303927047aedb3c17d. The first-load clause is UNVERIFIED (PR-0520); identity is proved. |
| CHK-018 | PASS | no | shipping references. art-derive audit on dist-release: 1,371 literal art names, 0 dangling; no art or audio file changed since release 66. |
| CHK-019 | PASS | yes | decode of art and audio. Manifest decodeChecked true, audioUnverified 0; all 319 mp3 decode with 0 ffmpeg errors; the two flat-colour Paine eye-catch files are on the intentional list. |
| CHK-020 | FAIL | yes | FFX and FFX-2 parity. Polish-level differences only: FFX target frames lack the Enter/Esc strip and the hint strip says Intel (PR-0543); the phone FFX-2 enemy-move line abbreviates names (PR-0571). The ATB and CTB differences are deliberate. Chapters I and IV use the F1 slab HUD while II, III and V use the older HUD (D-1324, by design, provisional). |
| CHK-021 | PASS | yes | game case for every r68 lane. Release note 68 reads Both, FFX-2, FFX, Both, FFX-2. The FFX-2 only lanes live in src/ui/ffx2 and the FFX-2 dress rows of readyIdentity.ts; the FFX only lanes are src/ui/ffx/CtbSlide.ts and the summon leap. No ATB snapshot appears in any FFX log and no CTB turn order in any FFX-2 log; the chief's Trigger Happy run is FFX-2 only (Chapter VI). |
| CHK-022 | UNVERIFIED | no | 19 of 19 wins; retry in 12 chapters. Wins: 19 of 19 chapters by real keys from the title to results, CONFIRM, chapter select and a reload that keeps the clear (continuity harness), the post scene in 5 chapters watched by the capture owner and in most harness runs. Loss and TRY AGAIN on the r68 bundle: seymour-flux (I), ffx2-bahamut (IV), braskas-final-aeon, ffx2-vegnagun-shuyin, sin-fins-core, ffx2-trema, ffx2-fallen-aeons, mirror-aeons, seymour-omnis, ffx2-den-of-woe, evrae-airship, yunalesca (12 of 19), with the loss itself injected by hp 1 (labelled); the chained chapters retry at link 1 of their chain only. Chapters I and IV use the pro-defeat card (TRY AGAIN / CHAPTER SELECT), the others the results-screen defeat (RETRY /  |
| CHK-023 | PASS | yes | every changed subsystem invoked through the real path on the live bundle; Trigger Happy driven by the chief. PASS for summons (5 in Chapter I, 5 in Chapter III link 1, 4 plus a Grand Summon in Chapter II), revives (1 and 8), ATB snapshots, chains and spherechange (Chapter IV), the flowing run-in and the ATB bars in every FFX-2 run, the turn-order list and the hurt and KO paths in every FFX run, Auron Bushido 8 of 8 and 7 of 7 and Tidus Energy Rain by keys on the r68 input layer, the pro-defeat cause label, the FFX-2 screen release on every exit, and Trigger Happy (the auditor's one UNVERIFIED): chief run in Chapter VI by real keys, window up, 11 KeyR presses gave 11 hits in action-start extra (gunner-trigger hits 11), 8 to 9 damage events followed, the bar moved on all 83 live frames in smooth mode |
| CHK-024 | PASS | no | save and reload. SaveData.ts and every storage call are untouched since release 66 (git diff 2b48cee95..2a9340249 empty); the 9 save and defaults vitest files (144 tests) pass; 19 of 19 real-reload board checks keep the clear (5 owner, 19 harness). |
| CHK-026 | FAIL | yes | 19 chapters won by real keys, live, 1600x900, GPU. 476 swap(s) change a head by more than the tolerance (worst 28.8 percent; 9.3 percent where the head is registered); 16 swap(s) of a standing figure move its feet more than the tolerance (worst 10.5 px at 1600 wide); 5 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.765 to 1.261; the bands are tools/posescale/pose-bands.mjs's); 23 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 43 px at 1600 wide), whatever stance the registration claims. Strips read by the chief: Paine attack to follow (real head x0.8167, hard cut), Paragon cast to idle, Auron follow to idle; PASS in Bahamut, Natus, Omnis, Vegnagun, L |
| CHK-027 | FAIL | yes | 19 chapters won by real keys, live, 1600x900, GPU. 66 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 252.2 px). Revive: Chapter I Tidus 89.3 px at +117 ms (PR-0570). |
| CHK-B1 | UNVERIFIED | no | owner listening. Only music has an owner number (7/10, 2026-10-13, D-804), older than three re-rendered victory cues, five SFX files, 245 voice lines and the conference sound pass; D-1310 forbids a score without ears. Only Bailey can give this verdict: it stays UNVERIFIED. Filed mandatory:false as ratified in round 30b; audio keeps no score and the milestone stays blocked. |
| CHK-B2 | UNVERIFIED | no | owner feel. What a double image, a snap or a planned smear cut feels like is Bailey's own play (PR-0530, PR-0521, PR-0536). |

## Encounters through their real flow

- **seymour-flux**: completed. victory 53 turns at 1600x900 and 53 at 2000x1012 (seed 1); lose and TRY AGAIN verified; 390x844 touch run ended in defeat Live bundle index-CahDxk82 (sha 2a934024), PYREFLY_BROWSER=gpu, headless Playwright. Real keys from title through chapter select, prep, pre-scene (Esc over scene), fight (N advisor, E intent, G guide, pause Esc/Tab/options, single target and cancel), results, confirm, post scene (watched, 'You can't send what refuses to go...'), chapter select, reload keeps clear. Lose: the route lost (defeat panel, 4 turns); the lose-retry script (hp 1 injected, labelled) reached the pro-defeat card, TRY AGAIN to a first menu in 4.9 s (new seed), second loss, CHAPTER SELECT slab back to chapter select. The 390x844 touch run lost the fight (harness: item picking on the phone list, same as round 30); its Esc-pause captures read screen=battle because a phone has no Esc (pause chip path was not driven here for this chapter). Console errors 0, 404s 0. Loss and TRY AGAIN by the chief: defeat card pro-defeat (Try again / Chapter select) 1.7 s, TRY AGAIN to a first menu in 4.9 s with a new seed, second loss, CHAPTER SELECT (capture owner).
- **yunalesca**: completed. victory 154 turns (15:30), seed 3, 1600x900 Won by real keys to results, confirm, post scene ('There. Now no one can summon it.'), chapter select. One harness assertion: the 30-post-scene capture was taken after the scene had already passed to results (screen wanted cutscene got results): recorded UNVERIFIED for that frame only, the scene itself was watched afterwards. No lose/retry run for this chapter; no 2000x1012 or phone run. 0 console errors, 0 404s. Loss and TRY AGAIN by the chief: defeat card results (RETRY / CHAPTER SELECT) 1592 ms after the last change, retry to a first menu in 9670 ms with a new seed 76732615, boss ["yunalesca"], second loss card then OTHER FIGHT to chapter select; console errors 0.
- **braskas-final-aeon**: completed. victory 284 turns, 27:41, seven links, six seams, seed 1, 1600x900 Won by the capture owner's own route (the stall of round 30 did not recur): seam captures seq-seam-2 to -7, results AP 0 / gil 0 (matches the sourced all-zero record noted in round 30b), confirm, chapter select, board shows braskas-final-aeon cleared after reload. Console errors 0, 404s 0. Loss and TRY AGAIN by the chief: defeat card results (RETRY / CHAPTER SELECT) 1581 ms after the last change, retry to a first menu in 13403 ms with a new seed 1011431742, boss ["braskas-final-aeon","yu-pagoda-left","yu-pagoda-right"], second loss card then OTHER FIGHT to chapter select; console errors 0.
- **ffx2-bahamut**: completed. victory 60 turns (1600x900), 59 (2000x1012), 60 (390x844 touch); defeat route and a lose-retry Seed 1. Spherechange frame sequence captured at all three sizes. Results, confirm, post scene, chapter select, reload keeps clear. Lose: route defeat reached the pro-defeat card; lose-retry (hp 1 injected, labelled) reached the defeat card in 20.4 s on the longer-window run, TRY AGAIN to a new first menu in 10.1 s (seeds 1788553297 and 987401995 across runs), second loss then CHAPTER SELECT. Three earlier attempts with a 70 s window saw no defeat card; a state dump showed the fight alive (turn 11, Bahamut charging Mega Flare, one party member still standing), so that is the injected loss not finishing in 70 s, not a hang. Console errors 0, 404s 0. Loss and TRY AGAIN by the chief: defeat card pro-defeat naming a cause, TRY AGAIN to a first menu in 10.2 s with a new seed, second loss then CHAPTER SELECT (capture owner).
- **ffx2-vegnagun-shuyin**: completed. victory 88 turns (13:16 on the results screen), seed 1, 1600x900 Won by real keys through the seams (seq-seam-2 to -5), spherechange sequence, results (EXP 18,600), confirm, chapter select. 0 console errors, 0 404s. No lose, 2000x1012 or phone run for this chapter. Loss and TRY AGAIN by the chief: defeat card results (RETRY / CHAPTER SELECT) 1234 ms after the last change, retry to a first menu in 10253 ms with a new seed 226610514, boss ["vegnagun-tail"], second loss card then OTHER FIGHT to chapter select; console errors 0.
- **ffx2-leblanc**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness ffx2-leblanc: 559.9 s of battle, 558 swaps, CHK-026 PASS, CHK-027 PASS. Loss and retry: not run this round.
- **seymour-anima-macalania**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness seymour-anima-macalania: 330 s of battle, 283 swaps, CHK-026 FAIL, CHK-027 PASS. Loss and retry: not run this round.
- **evrae-airship**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness evrae-airship: 379.7 s of battle, 453 swaps, CHK-026 FAIL, CHK-027 PASS. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 1237 ms after the last change, retry to a first menu in 9620 ms with a new seed 845826798, boss ["evrae","cid"], second loss card then OTHER FIGHT to chapter select; console errors 0.
- **yojimbo-cavern**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness yojimbo-cavern: 120.6 s of battle, 78 swaps, CHK-026 FAIL, CHK-027 PASS. Loss and retry: not run this round.
- **seymour-natus**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness seymour-natus: 149.7 s of battle, 141 swaps, CHK-026 PASS, CHK-027 PASS. Loss and retry: not run this round.
- **ffx2-fallen-aeons**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness ffx2-fallen-aeons: 390.8 s of battle, 363 swaps, CHK-026 FAIL, CHK-027 FAIL. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 69078 ms after the last change, retry to a first menu in 9952 ms with a new seed 575373198, boss ["x2-shiva"], second loss card then OTHER FIGHT to chapter select; console errors 0.
- **seymour-omnis**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness seymour-omnis: 516.4 s of battle, 631 swaps, CHK-026 PASS, CHK-027 PASS. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 49437 ms after the last change, retry to a first menu in 9996 ms with a new seed 223529987, boss ["seymour-omnis","mortiphasm-1","mortiphasm-2","mortiphasm-3","mortiphasm-4"], second loss window missed in the run (not required); console errors 0.
- **ffx2-trema**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness ffx2-trema: 1194.1 s of battle, 1752 swaps, CHK-026 FAIL, CHK-027 FAIL. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 43980 ms after the last change, retry to a first menu in 10372 ms with a new seed 414001075, boss ["paragon"], second loss window missed in the run (not required); console errors 0.
- **isaaru-via-purifico**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness isaaru-via-purifico: 274 s of battle, 223 swaps, CHK-026 FAIL, CHK-027 PASS. Loss and retry: not run this round.
- **ffx2-den-of-woe**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness ffx2-den-of-woe: 236.6 s of battle, 196 swaps, CHK-026 FAIL, CHK-027 FAIL. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 7994 ms after the last change, retry to a first menu in 10775 ms with a new seed 1758812560, boss ["shade-baralai"], second loss card then OTHER FIGHT to chapter select; console errors 0.
- **ffx2-ixion-djose**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness ffx2-ixion-djose: 134.2 s of battle, 209 swaps, CHK-026 FAIL, CHK-027 PASS. Loss and retry: not run this round.
- **sin-fins-core**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness sin-fins-core: 1062.9 s of battle, 1603 swaps, CHK-026 FAIL, CHK-027 FAIL. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 22269 ms after the last change, retry to a first menu in 9666 ms with a new seed 993653740, boss ["left-fin","cid"], second loss window missed in the run (not required); console errors n/a.
- **sin-face**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness sin-face: 174.5 s of battle, 286 swaps, CHK-026 FAIL, CHK-027 PASS. Loss and retry: not run this round.
- **mirror-aeons**: completed. victory by the continuity harness (real keys from the title to results, CONFIRM and chapter select; clear kept after a reload), seed 1, 1600x900, 0 console errors, 0 not-found Continuity harness mirror-aeons: 1158.6 s of battle, 982 swaps, CHK-026 FAIL, CHK-027 FAIL. Loss and retry: defeat card results (RETRY / CHAPTER SELECT) 12798 ms after the last change, retry to a first menu in 13601 ms with a new seed 1978361134, boss ["dark-mindy","dark-sandy"], second loss card then OTHER FIGHT to chapter select; console errors 0.

## Coverage matrix

**Tested**
- Live exact artifact: the page serves index-CahDxk82.js (chief curl start and end); the live review compared 7,169 files (PASS); verify-live sample 97 files; 0 console errors and 0 not-found in 14 capture-owner runs, 19 harness runs and the chief's gap runs.
- All 19 chapters won by real keys from the title to results, CONFIRM and chapter select with the clear kept (continuity harness, 10,383 s of battle, 56.2 to 60 fps); Chapters I, II, III, IV, V also by the capture owner; I and IV at 2000x1012 and 390x844 touch.
- Loss and TRY AGAIN by real keys on the r68 bundle: Chapters I and IV by the capture owner; seymour-flux (I), ffx2-bahamut (IV), braskas-final-aeon, ffx2-vegnagun-shuyin, sin-fins-core, ffx2-trema, ffx2-fallen-aeons, mirror-aeons, seymour-omnis, ffx2-den-of-woe, evrae-airship, yunalesca by the chief (labelled hp 1 injection for the loss).
- Engines: 16 probe and measure outputs re-run and byte-identical; full unit suite (27,254 tests); tsc clean; orphans 24 pre-existing, none r68.
- Audio: qa --strict, decode of 319 mp3, 300 of 300 live files HEAD 200 and byte-equal, routing at every sampled first menu, seam and results.
- Chief gap runs 2026-10-30 on the live bundle: the CHK-002 and CHK-003 matrix at six sizes (Chapter I, fresh browser each), the phone sweep (Chapters I and IV, first menu, battle menu, pause by the chip), Trigger Happy by real keys in Chapter VI Leblanc with and without REDUCE MOTION (the attribute set as a labelled hook), 12 lose-and-retry runs. CHK-010 group target frames in Chapters I and IV (ALL ALLIES label).
- Gap pass of the orchestrator (live bundle): settled party-prep frame, title and chapter-select cue, Chapter I pause cue, pause ACCESSIBILITY walk by keys (TEXT SIZE 100 to 130, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS), the phone pause chip and swipe; r68 live measurements: run-in stand, turn-order overlap, HUD closure, revive probes in three chapters, Braska wide and pack harness runs.
- First-time fan over the capture owner's sequences (about 11 frame sets, 20 breakers; dispositions in the issue list, with the dropped items named in PR-0528 and below).

**Reused (with the dependency argument)**
- Pad-driven Overdrive windows (Wakka reels, Lulu fury, Kimahri rage) and Braska links 3 to 6 Summon rows (PR-0460, PR-0550) (from critic/rounds/round-30/gaps2 (round 30b)): Combat auditor's written argument: the only r68 change on the input path is src/app/Input.ts (KEY_MAP, PAD_MAP and MODIFIER_CODES moved verbatim to inputKeyMap.ts, bodies diff-identical; padMap.ts, padActivity.ts, inputDevice.ts unchanged) plus a FocusLedger inert for the gamepad; Auron (8 of 8, 7 of 7) and Tidus windows were played live on this build through the same handler; input-focus-contract (32) and input-shift-tap (17) pass; open related defect PR-0550, found by that evidence. Never used for a PASS of CHK-023.
- Story and script reading of Chapters VI to XVIII and the writing bible (from round 30b): git diff 2b48cee95..2a9340249 over src/story, research and src/data (non-art) is empty; r68 touches no text; the five chapters' aftermath was re-played by real keys this round.
- CHK-024 save migration matrix (from round 29 and 30b): No persistence file or storage call changed since 2b48cee95; 144 save and defaults tests pass; 19 of 19 reload checks fresh.
- CHK-018 art-derive verify (5,404 masters) (from critic/reviews/2a9340249-live.json and round 30b): No art file changed in release 68; verify-approved re-run today (917 ok); manifest decodeChecked.
- Frame times of the focused review for Chapters I, IV, V, Braska and Trema (from critic/reviews/2a9340249-focused): Same content-hashed bundle; superseded by this round's own 19-chapter live probe wherever both exist (PR-0580).
- Engine probe outputs and parity measures of round 30 (from round 30): Comparison baseline only; every output was produced again in round 31.

**Not tested**
- A physical gamepad, a real phone, a real hidden tab, a 144 Hz display, a 4K panel, Safari and iOS, Firefox and WebKit on a player's machine: no agent has them (Playwright WebKit and Firefox stand in and were not run this round; emulated touch is labelled).
- Bailey's listening and feel judgments (CHK-B1, CHK-001, CHK-B2): only Bailey can give them; audio keeps no score.
- Prep agency by key or touch (every prep tab and a changed value in the first menu), colour vision on a frame, the key remap, the hold-Home booth reset, the 130 percent first menus and the phone first menu with text scaling (PR-0503; no method check written).
- Phone: tapping each pause tab, the options pane end, the Items swipe to Holy Water and an ally tap (PR-0483), Chapter IV on the phone pause, the phone Chapter III and IV results frames, the Shuyin dialogue portrait frame.
- CHK-005 beyond two broken boards; CHK-010 beyond what is listed in its entry; CHK-008 80-state sweep at 1280x720 and 2560x1440 (PR-0552, PR-0553, PR-0560 carried); the longest-name set at 1280 and 3840 (CHK-009).
- The legibility sweep for prep, results and the other 17 battle first menus on the live bundle; first-load time on the live URL in a browser (PR-0520).
- Timed victory-to-results frames, the Mega Flare detonation and attack-cycle clips, input-to-response in milliseconds, the dense audio timeline for the Chapter I fanfare (PR-0532), the Chapter V boss-shuyin sample, the Chapter V pause cue and the FFX-2 board cue.
- Loss and retry in a LATER link of a chained chapter (the chief's runs lose at link 1 of each chain; the chain checkpoint code and its tests are unchanged and pass).
- The renderer crash of the chief's long idle Leblanc run was not reproduced (PR-0565).

**Required and not tested:** none.

## Human judgments owed

- [not recorded] Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148)
- [not recorded] Feel: are the planned smear hard cuts (22 a minute now), the pro camera shots and the big turn cut-in the look he wants (PR-0530, PR-0521, PR-0536; CHK-B2)
- [not recorded] Art: should the Rikku Dark Knight and Paine Warrior ready and attack poses be repainted or only registered (PR-0517)
- [not recorded] Audio: keep or change the silent Chapter IV results screen (PR-0504)
- [not recorded] Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
- [not recorded] Interface: should desktop Chapters I and IV show a first-menu teaching card as the phone does (D-1344, R31-ONB-02)
- [not recorded] Narrative: portrait expression on grief lines in both games (PR-0485)
- [not recorded] Accessibility: do COLOUR VISION, TEXT SIZE, REDUCE FLASHES and REDUCE MOTION do what he wants (walked in part by the gap pass; remapping is not built; PR-0503, PR-0559)

## Ranked issue list (77 open)

Order: critical, major, minor, polish; within a severity the owner's reported problems (pose continuity, size, snapping), frequency, player impact, coverage, effort. One root defect across chapters is one issue.

### 1. PR-0531 (major, visual): Figures still change head, height or feet at pose swaps in 14 of 19 chapters (CHK-026 FAIL; the umbrella for PR-0529 and PR-0534)

- Game / chapter / state: both / Chapters I, II, III, VII to XIX (14 of 19; PASS in IV, V, VI, X, XII... see continuity) / every pose swap of 19 chapters won by real keys, live, 1600x900, seed 1
- Observed: Harness (10,383 s of battle, 11,850 swaps): 476 head swaps over tolerance (worst 28.8 percent; 9.3 percent where the head is registered), 16 feet shifts over 2 px (worst 10.5 px, Trema), 5 swaps outside the height band (round 30b: 15), 23 silhouette-stance misses (39), snaps 0.01 a minute. Down from round 30b on height and stance, not on head (489 to 476) or feet (12 to 16). The harness head reading is a control that passes a registered pose by construction (PR-0534): the chief read the Chapter IV strip swap-202 (Paine attack to follow): real head x0.8167, height x1.075, drawn as a hard cut under a flash, a visible size change that the harness lists as PASS for that chapter.
- Expected: Head within 3 percent, standing feet within 2 px at 1600 wide, stature inside the pose band at every swap (CHK-026).
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); the 19-chapter run of this round is critic/rounds/round-31/continuity
- Evidence: critic/rounds/round-31/continuity/continuity-summary.json; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-202-paine-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/strips/swap-147-paragon-cast-idle.jpg; critic/rounds/round-31/continuity/seymour-flux-win-r31/continuity/strips/swap-265-auron-follow-idle.jpg
- Confidence: high for the counts, medium for the visible weight of the rig-head share; requirement: CHK-026, RUBRIC 6a (Bailey 2026-10-04: "characters change size and height across poses ... ruins the immersion")
- Smallest fix: Re-register the pose paintings the strips name to the idle head and ground line (registration, never a repaint on taste), refit the Den of Woe and Ixion poses outside their height band, and have the harness read the head from the part's own box for rig figures; do not loosen the tolerance. A written method check is owed before a third batch (RUBRIC section 8: open in rounds 29, 30, 30b, 31).
- Acceptance check: Harness on Chapters I, IV, VII, IX, XI, XII, XIII, XVI: feet, height and stance lists empty outside written waivers; the five named strips show one size.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 2. PR-0459 (major, visual): Chapter I (FFX): Auron's head changes 9.3 percent at two swaps and one swap draws him at stature 0.765 (CHK-026 FAIL, still open, a fourth deep review)

- Game / chapter / state: FFX only / seymour-flux / Auron attack/follow/idle swaps, killing-blow close-up
- Observed: Harness perFigure.auron: 30 swaps, registered-head worst 9.3 percent, sizeOver 2, heightOver 1 (minStature 0.7654). Chapter I CHK-026 FAIL reads exactly these two reasons. Same figure and swaps as round 30b (7 and 9 percent).
- Expected: Head within 3 percent at every swap (CHK-026).
- Repro: Continuity harness, seymour-flux, seed 1, 1600x900; strips swap-265-auron-follow-idle.jpg and the Auron entries of continuity.json.
- Evidence: critic/rounds/round-31/continuity/seymour-flux-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/seymour-flux-win-r31/continuity/strips/swap-265-auron-follow-idle.jpg
- Confidence: high; requirement: CHK-026
- Smallest fix: Method check first (RUBRIC section 8; stalled since round 29): read the two strips, re-register Auron follow to the idle head, re-run Chapter I.
- Acceptance check: Chapter I harness: Auron worstHeadPct under 3 and heightOver 0.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 3. PR-0517 (major, visual): FFX-2 Chapter IV: Rikku's and Paine's attack and ready poses still read as a different-sized figure from their idle (carried; r68's ready hold did not change it)

- Game / chapter / state: FFX-2 only / ffx2-bahamut / Paine attack to follow, Rikku attack to follow and idle to attack
- Observed: Chapter IV CHK-026 reads PASS in the harness (head x0.7 percent, 0 height over) but the chief read strip swap-202 (Paine attack to follow, frame 17546): the strip header itself prints real head x0.8167 and height x1.075 while the control reads x0.9993; the figure shrinks and crouches at the swap under a flash. Rikku swap-207 and swap-267 carry the same class. The release 68 ready hold (three dresses) moved the ready pose into the idle family but the attack and follow paintings keep their own size.
- Expected: A figure keeps one size across a pose change (CHK-026; Bailey 2026-10-04).
- Repro: Continuity harness ffx2-bahamut, seed 1, 1600x900.
- Evidence: critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-202-paine-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-207-rikku-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-267-rikku-idle-attack.jpg
- Confidence: medium (one strip read in full by the chief; the others by their headers); requirement: CHK-026, PR-0517 (ask Bailey: repaint or register only; human judgment unrecorded)
- Smallest fix: Register the attack and follow paintings to the idle head and ground line (or give the swap a smear cut); Bailey decides whether the Dark Knight and Warrior ready poses are repainted.
- Acceptance check: Strip header real head within 3 percent for the named swaps; harness stays PASS.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 4. PR-0380 (major, feel): CHK-027 FAILS in 8 of 19 chapters: 66 pose-swap jerks of 40 px or more in one frame (round 30b: 115), worst 252 px (Sin fins/core), 201 px Vegnagun tail whip, 156 px Braska, 110 px Yunalesca and Trema

- Game / chapter / state: both / II, III, V, XI, XII, XIV, XVII, XIX (yunalesca, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-fallen-aeons, ffx2-trema, ffx2-den-of-woe, sin-fins-core, mirror-aeons) / every frame of every fight, 19 chapters, live
- Observed: Harness: swapJerksOverFail 66 (round 30b 115, 15 chapters), worst 252.2 px Sin fins/core, 200.8 px Vegnagun (boss tail whip, R68-C1), 155.8 px Braska (R68-C2: Ixion hurt to KO 103 px in the live Braska gap run), 109.7 px Yunalesca, 109.6 px Trema, 58 px Mirror Aeons, 57 px Fallen Aeons, 48.8 px Den of Woe. 42 of the 66 on a steady frame. 4,310 of 4,471 cuts the engine planned as smears are excused (3,664 snaps not counted, 2,017 jerks, worst 208.9 px; PR-0530). Vegnagun swap-129 (Rikku attack to follow): see-through about six frames, lost behind the tail and the hit flash, back in the next pose.
- Expected: No jump of 40 px or more in one frame at a pose swap, or a swap that happens under a cut with no ghost (CHK-027).
- Repro: Continuity harness, ffx2-vegnagun-shuyin and sin-fins-core, seed 1, 1600x900 (strips under critic/rounds/round-31/continuity/<chapter>-win-r31/continuity/strips)
- Evidence: critic/rounds/round-31/continuity/continuity-summary.json; critic/rounds/round-31/continuity/ffx2-vegnagun-shuyin-win-r31/continuity/strips; D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/evidence/h-braska-wide/braskas-final-aeon-win-braska-wide/continuity/strips/jerk-009-ixion.jpg
- Confidence: high; requirement: CHK-027 (Bailey 2026-10-04)
- Smallest fix: Start with the Sin fins/core and Vegnagun swap lists (the worst two); register Ixion hurt and KO to one feet anchor; extend the registered stance to the poses the lists name. Method check owed (RUBRIC section 8).
- Acceptance check: Harness on the eight chapters: swap jerks over the line under 10 in total.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 5. PR-0379 (major, feel): See-through cross-dissolves at pose swaps: 1,689 ms a minute (round 30b: 3,474), but 13 of 19 chapters are over the 1,000 ms line and the four chapters kept on the old scope sit at 2,569 to 5,531

- Game / chapter / state: both / worst: Yunalesca 5,531, Ixion 5,030, Evrae 3,186, Trema 2,724, Sin face 2,569 ms a minute / all fights, live, ?swapscope=wide default in 13 chapters
- Observed: ghostMsPerMinute by chapter: seymour-flux 517, bahamut 587, anima 669, yojimbo 508, vegnagun 792, via-purifico 453 (six under 1,000); braska 1,197, fallen 1,157, den 1,049, mirror 1,005, omnis 1,273, natus 1,324, sin-fins-core 1,350, leblanc 1,615; trema 2,724; the four pack-scope exceptions (Evrae, Yunalesca, Sin face, Ixion) 3,186, 5,531, 2,569, 5,030. Worst ghost severity 0.375 (under the 0.4 fail line). The first-time fan saw the class in four captures: Kimahri revives as a pale see-through figure floating over Yuna (Chapter I Mega Phoenix), Yuna drawn twice (Chapter II), Auron pale and short while buffed (Chapter III), Rikku glowing double at the sphere change (Chapter IV).
- Expected: Under 1,000 ms a minute of see-through in every chapter (the issue's own line).
- Repro: Continuity harness, any chapter, seed 1.
- Evidence: critic/rounds/round-31/continuity/continuity-summary.json; critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f07.jpg; critic/rounds/round-31/evidence/yunalesca-win/seq-party-action; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-party-action
- Confidence: high; requirement: CHK-027 item 3
- Smallest fix: Continue the planned list: Evrae head registration, Sin face lunge return, Yunalesca planned cuts over 120 px, then move each of the four exceptions to the wide scope when its blocker clears.
- Acceptance check: All 19 chapters under 1,000 ms a minute or named exceptions.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 6. PR-0570 (major, feel): Chapter I Tidus's revive steps 89 px sideways in one frame at +117 ms (r68 removed the first-frame pop; the step moved later)

- Game / chapter / state: FFX only (Chapter I Tidus; Chapter II Tidus peaks 39.3 px and Chapter IV Rikku 30.9 px, no step) / seymour-flux / Tidus revived from knock-out, 60 Hz stepped frames, live
- Observed: revive-ch1-tidus-1600.metrics.json: reviveSteps 1.7, 4.9, 11.2, 20.8, 27.9, 29.0, 89.3, 13.1, 11.5 ... px; the standing plane steps 89.3 px in one frame while the lying painting is still blending out. Round r67 had an 80 to 108 px pop at frame 0 in both games; r68 cleared frame 0 (1.7 px). Chapter II and IV ramp to 39.3 and 30.9 px with no discontinuity (a confirmer note: the auditors quoted 2.6 px, which is only the first frame).
- Expected: No step over 40 px in one frame of a revive (CHK-027 item 4).
- Repro: https://echoesofspira.com/?coach=off, Chapter I, seed 1: let Kimahri fall, revive him or Tidus (Mega Phoenix or Phoenix Down); record 60 Hz stepped frames and track the standing plane (probe D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/lib).
- Evidence: D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/evidence/revive-sheet-ch1.png; D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/evidence/revive-ch1-tidus-1600.metrics.json; D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/evidence/revive-ch2-tidus-1600.metrics.json
- Confidence: high (measured, confirmed by the confirmer from the stored metrics; not re-recorded by the chief); requirement: CHK-027 item 4; parent PR-0473
- Smallest fix: Give the standing plane the lying painting's registration offset for the first eight frames of the lift, or hold the swap until the plane has risen; Chapters II and IV already pass, so the difference is Chapter I Tidus's registration.
- Acceptance check: reviveMaxStep under 40 px at 60 and 120 Hz; Chapters II and IV stay under 40.
- introducedByCandidate: unknown; regressionVsLive: false; inNewFeature: false

### 7. PR-0148 (major, audio): No numeric owner listening verdict covers the shipped mix (carried; an evidence gap, not a player defect)

- Game / chapter / state: both / all / owner listening
- Observed: The only number is the music 7/10 of 2026-10-13 (D-804). It predates three re-rendered victory cues, five SFX files, 245 voice lines and the conference sound pass. OWNER-VERDICT.md has nothing after 2026-09-28. Technical half re-run this round: qa --strict 43 cues, 0 findings, -16.21 to -16.01 LUFS, 300 of 300 shipped audio files HEAD 200 and byte-equal.
- Expected: CHK-B1: a dated verbatim numeric verdict naming the build or cue set.
- Repro: Read docs/target/decisions.json (D-804, D-1310, D-1371) and docs/audio/OWNER-VERDICT.md.
- Evidence: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json; critic/rounds/round-31/audio/qa.log
- Confidence: high; requirement: RUBRIC audio: Bailey's listening assessment; CHK-B1
- Smallest fix: Bailey listens to docs/audio/audition.html and gives a 0 to 10 number for music, SFX and voice, recorded verbatim.
- Acceptance check: A dated verbatim numeric verdict naming the build or cue set is recorded.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 8. PR-0567 (major, delivery): A phone on a 10 Mbit/s line waits 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card, about 94 MB on the wire, before the first command; release 68's load diet does not move it

- Game / chapter / state: both / seymour-flux and ffx2-bahamut (measured); suspected for all / first-command job, phone10 profile (390x844, DPR 2, touch, CPU x4, 10 Mbit/s, 40 ms), real keys and taps, candidate bundle of the live artifact
- Observed: cand68: entry-load 18.3 s + first draw 1.5 s (Chapter I) and 41.0 s + 1.3 s (Chapter IV); wire bytes to the first menu 93.6 and 94.0 MB. Release 67 on the same job: 20.1 s / 39.2 s and 93.7 / 92.2 MB. Desktop 50 Mbit/s: Chapter I load card 5.9 s (B2a 5.0 s; r67 6.0 s). The wait is bandwidth-bound (94 MB at 10 Mbit/s is about 75 s of transfer). The phone budget (50 MB, 8 s) is a proposal, not owner-approved. Also the focused review R68-B1.
- Expected: A phone reaches the first command menu without a 20 to 40 s load card; the 5 s goal of BUDGETS B2a holds on the desktop line.
- Repro: critic/reviews/2a9340249-focused/budgets jobs/first-command.mjs --profile=phone10 --mode=pad (emulation only; a desktop GPU is not a phone).
- Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json; critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-r67.json; critic/reviews/2a9340249-focused/budgets/first-command-desk50-pad-cand68.json
- Confidence: medium (one run per cell, emulated phone; cand68 and r67 agree within 3 s and 2 MB); requirement: RUBRIC section 2 and 6 delivery; BUDGETS B2a, B3a (proposed)
- Smallest fix: Measure the wire set before the first menu with ?loaddiet=off and on, find what is fetched before the opening poses need it (suspected: the whole chapter's 1x paintings plus board strips), defer the rest until after the first menu.
- Acceptance check: Three runs per chapter: phone10 wire bytes to the first menu at most 50 MB, load wait at most 8 s, desk50 Chapter I load card at most 5.0 s.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 9. PR-0295 (major, interface): Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; not re-examined; the prep tab strip is cut at ACCESS on the 390x844 prep capture)

- Game / chapter / state: both / prep, phone / carried
- Observed: Not re-walked this round: no capture opens a prep tab other than CHAPTER (PR-0503). The 390x844 prep capture shows the tab strip cut at "ACCESS" with ITEMS off screen; the CSS makes it scroll but no swipe was run on prep. r68 rebuilt the strip (role=tablist/tab, roving tabindex) and touched this surface, so round 30b's reading is not reused as current.
- Expected: A phone prep that is a phone layout.
- Repro: 390x844 touch, any chapter, prep screen.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/04-prep.png
- Confidence: low (not walked); requirement: RUBRIC section 6 prep and interface
- Smallest fix: Walk it (PR-0503), then fix on what the walk shows.
- Acceptance check: Per tab at 390x844: opened by tap, readable, one change made, visible in the first menu.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 10. PR-0571 (minor, interface): Phone FFX-2 enemy-move line abbreviates the party to 'Yun / Rik / Pai' (new in r68; trades round 30's split figure for abbreviated names)

- Game / chapter / state: FFX-2 only / Chapter IV, 390x844 touch / first menu and CHANGE list
- Observed: Round 30 (r66) printed 'YUNA 168-190 / RIKKU 92-104 / PAINE 115-' with the last range broken over two lines; r68 prints 'Yun 168-190 / Rik 92-104 / Pai 115-130' on two rows and 'ACTS NEXT' became 'NEXT'. The figures are whole now; the names are abbreviated although the row has room (about 100 px free). The FFX line keeps full names. Chief read scratch/phone-intent-cmp.png.
- Expected: Names whole where they fit (CHK-009), figures not split.
- Repro: 390x844 touch, Chapter IV, first menu.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-31/scratch/phone-intent-cmp.png
- Confidence: high; requirement: CHK-009, CHK-020
- Smallest fix: Keep full names and wrap by pair, or abbreviate only when a name does not fit its slot.
- Acceptance check: Yuna, Rikku and Paine whole at 390x844 with no figure split.
- introducedByCandidate: true; regressionVsLive: true

### 11. PR-0572 (minor, delivery): Release 68's load-diet claim is not shown by the first-command job (bytes and wait equal release 67's within noise)

- Game / chapter / state: both / seymour-flux, ffx2-bahamut / desk50 and phone10
- Observed: Wire bytes to the first menu 110.31 / 112.03 MB against 110.34 / 111.89 (desk50) and 93.56 / 94.04 against 93.65 / 92.19 (phone10); load wait 5.92 / 4.44 s against 6.03 / 4.53 and 19.8 / 42.4 against 20.1 / 39.2. The release note says the first menu no longer waits for every pose; the handoff says it changes what the menu waits for, not what is fetched.
- Expected: The measured wait or bytes fall, or the note does not claim it.
- Repro: critic/reviews/2a9340249-focused/budgets first-command-*-cand68.json against *-r67.json; also with ?loaddiet=off.
- Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json
- Confidence: medium; requirement: RUBRIC section 5 (match proof to the claim)
- Smallest fix: Run the pair default vs ?loaddiet=off on phone10 and say which is which, or reword the player note.
- Acceptance check: Paired run shows the stated difference or the note is changed.
- introducedByCandidate: true; regressionVsLive: false

### 12. PR-0573 (minor, delivery): Page memory climbs 60 to 110 MB with every chapter change, no plateau in five visits (434 to 700 MB at the board; tree peak 3,225 MB); the focused review rated it major

- Game / chapter / state: both / seymour-flux and ffx2-bahamut / five visits with the board between, desk50
- Observed: chapter-memory job: 434, 440, 511, 624, 700 MB at the board; JS heap flat (24.7 to 31.4 MB); growth 74 percent against a proposed 10 percent budget (r67: 321 to 642, 85 percent). DOM at the board is flat from the third visit (r67 rose), but the gap pass still reads CDP nodes +485 a visit (223 detached, no HUD classes). No failure observed; the budget is proposed, not owner-approved, so the chief rates it minor.
- Expected: Memory settles (cache caps 96 paintings / 900 MB; texture governor 2,600 MB).
- Repro: critic/reviews/2a9340249-focused/budgets chapter-memory job; run to eight or more visits.
- Evidence: critic/reviews/2a9340249-focused/budgets/chapter-memory-desk50-cand68.json
- Confidence: medium; requirement: RUBRIC section 2 and 6 (stability)
- Smallest fix: Extend the job to eight changes and trace which cache holds the growth (the JS heap is not it).
- Acceptance check: Growth between visit 4 and 8 within 10 percent, tree peak at most 3,500 MB.
- introducedByCandidate: false; regressionVsLive: false

### 13. PR-0580 (minor, delivery): Frame-time outliers in the live 19-chapter run: Yunalesca one 5,610 ms frame and p99 51 ms (56.2 fps), Mirror Aeons 1,026 ms, Braska 705 ms, Vegnagun 482 ms, Trema p99 74.7 ms (extends PR-0544, PR-0480, PR-0527)

- Game / chapter / state: both / yunalesca, mirror-aeons, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-trema / continuity probe, 1600x900, GPU
- Observed: frameTime.maxMs 5,609.7 (Yunalesca, longFramePct 2.6, fps 56.2), 1,026.2 (Mirror Aeons), 704.5 (Braska), 481.5 (Vegnagun; r66 446); Trema p99 74.7 ms, 2.3 percent over 34 ms, 56.7 fps (r66 71.2 ms, same). Other chapters 59.5 to 60 fps with p99 19 to 39 ms. The combat auditor's unit suite ran on the same host during the harness, so a host stall is possible for the 5.6 s frame: not shown either way (harness frameP99MsIsPacing false).
- Expected: BUDGETS B4a to B4c: at least 59.5 fps, p99 at most 25 ms, at most 0.5 percent over 34 ms in every chapter.
- Repro: Continuity harness, Yunalesca and Trema, seed 1, host idle.
- Evidence: critic/rounds/round-31/continuity/yunalesca-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/continuity-summary.json
- Confidence: medium for the numbers, low for cause; requirement: RUBRIC section 2 (60 fps, report spikes)
- Smallest fix: Re-run Yunalesca on an idle host to settle the 5.6 s frame; per-frame trace of Trema against battle clock and phase (PR-0544).
- Acceptance check: Yunalesca max frame under 500 ms on an idle host; Trema p99 at most 25 ms.
- introducedByCandidate: false; regressionVsLive: false

### 14. PR-0565 (minor, delivery): A renderer crash again: the chief's Chapter VI gap run (Leblanc) ended in "Page crashed" after about seven minutes of polling an empty menu (extends PR-0565)

- Game / chapter / state: FFX-2 / ffx2-leblanc / headless Chromium gpu, live, enemy turns with the command menu closed
- Observed: th-probe first run: after five rounds of waiting for a menu, page.waitForTimeout threw "Page crashed" (timeout 420 s). Not reproduced in the next three Leblanc runs (about 60 s each) or in any of the 19 harness runs (0 crashes). Round 30b had one crash (Trema pace run). Cause unknown (GPU or memory in a long headless idle).
- Expected: No renderer crash in a long session.
- Repro: critic/rounds/round-31/gaps-chief/th-probe.mjs ffx2-leblanc with the Defend branch removed (the menu never reopens).
- Evidence: critic/rounds/round-31/gaps-chief/th.log
- Confidence: low; requirement: RUBRIC section 2 (stability)
- Smallest fix: Capture the renderer's crash dump on the next occurrence; the long-session memory growth (PR-0573) is a suspect.
- Acceptance check: No crash across ten 10-minute idle runs.
- introducedByCandidate: unknown; regressionVsLive: unknown

### 15. PR-0479 (minor, visual): Chapter I action shot: the humanoid Seymour's upper body leaves the top of the frame under the turn order (the creature's head is inside; the confirmer refuted the 'head cropped' wording)

- Game / chapter / state: FFX only / seymour-flux / mid-fight, 1600x900
- Observed: In 23-midfight.png the Mortiorchis head with spines and jaw is wholly inside the frame (about y 20 to 300); the humanoid torso at the right runs off the top edge and the turn-order icons overlap it. In seq-party-action f02 the same figure is cropped at the top. Carried at minor since round 30; the auditor's raise to major is not supported.
- Expected: Outside an intended close-up the boss stays in frame.
- Repro: Chapter I by real keys, seed 1, first attack.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/23-midfight.png; critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f02.jpg
- Confidence: high; requirement: CHK-008
- Smallest fix: Lower the action camera for this boss or move the turn order off the quad.
- Acceptance check: Same state: the torso is wholly inside the frame.
- introducedByCandidate: false; regressionVsLive: false

### 16. PR-0530 (minor, feel): Question for Bailey: hard cuts rose from 75 to 3,864 (22 a minute) because ?swapscope=wide turned the planned smear cuts on in 13 more chapters; the fan reads them as camera jerks and pops (Chapter I battle start, the Chapter IV sphere change, Braska seams)

- Game / chapter / state: both / all; fan captures in seymour-flux, ffx2-bahamut, braskas-final-aeon / continuity run and the fan's strips
- Observed: motion.hardCuts 3,864 (22.3 a minute), smearsPlanned 4,471, smearSnapsExcused 3,664, snaps 1 (0.01 a minute, under the 0.25 cap). The fan lists: the camera jumps from a wide dark view to a close one in one frame at the Chapter I battle start; the sphere change swings sideways and rebuilds the scene (Chapter IV); Bahamut changes size between frames of one turn; a boss or aeon and its pagodas appear in one frame (Braska start and seams). The feel auditor read Braska seams 3 and 5 as "readable, paced, no jerk". Whether this is the look Bailey wants is his call (CHK-B2, humanJudgments).
- Expected: Bailey's judgment of the planned smear cuts and the pro camera shots (PR-0530, PR-0521).
- Repro: Chapter I and IV by real keys; see the fan's captures seq-transition-into-battle and seq-spherechange.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/continuity/continuity-summary.json
- Confidence: medium; requirement: RUBRIC 6a (the definition of a jerk is Bailey's, D-420 to D-426)
- Smallest fix: Show Bailey the strips and ask; build nothing until he answers.
- Acceptance check: A recorded verbatim judgment.
- introducedByCandidate: false; regressionVsLive: false

### 17. PR-0473 (minor, feel): A revive is a dissolve with no rise: Kimahri returns as a pale see-through figure over Yuna (carried, re-observed by the fan in three Chapter I runs)

- Game / chapter / state: FFX only (Chapter I) / seymour-flux / Mega Phoenix revive
- Observed: seq-party-action f07 to f09 at 1600, 2000 and the phone: the revived figure is pale for three frames and floats above the floor line with Yuna drawn through it. See PR-0570 for the one-frame step.
- Expected: A rise that reads as standing up.
- Repro: Chapter I turn 3, Mega Phoenix with Kimahri down.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f07.jpg; critic/rounds/round-31/evidence/seymour-flux-win-2k/seq-party-action
- Confidence: high; requirement: CHK-027 item 4
- Smallest fix: As PR-0570, then a rise.
- Acceptance check: Strip of the revive shows one figure, grounded, from frame 0.
- introducedByCandidate: false; regressionVsLive: false

### 18. PR-0534 (minor, visual): Lulu's rig head reads 5 to 15 percent different at ready, cast and idle in the FFX chapters (about 470 of the 476 CHK-026 head fails; likely the head part's box, not a visible jump)

- Game / chapter / state: FFX only / Chapters II, III, VII to XIX with Lulu / continuity harness
- Observed: headRig 920 swaps read from the rig's own head mesh; the chapter strips show no visible jump. Harness head fails 476 (round 30b 489).
- Expected: The harness reads the head from the part's own box.
- Repro: Continuity harness, braskas-final-aeon, strip swap-172-lulu-ready-item.jpg (round 30b path).
- Evidence: critic/rounds/round-31/continuity/continuity-summary.json
- Confidence: medium; requirement: CHK-026
- Smallest fix: Read the rig head with its own box in critic/runner/lib/continuity-rig.mjs, or show the strips are not visible.
- Acceptance check: Lulu rig head swaps under 5 percent or shown not visible.
- introducedByCandidate: false; regressionVsLive: false

### 19. PR-0529 (minor, visual): FFX-2 Chapter XII (Trema): Paragon's feet move 10.5 px at the cast-to-idle swap with nine see-through frames and height x1.13 (carried)

- Game / chapter / state: FFX-2 only / ffx2-trema / Paragon cast to idle
- Observed: strip swap-147: two overlapped Paragons for nine frames, feet 10.5 px apart (22.2 px from the pixels); the only feet-over fail of the 19 chapters at that size.
- Expected: Feet within 2 px, a cut or a short blend.
- Repro: Continuity harness ffx2-trema, seed 1.
- Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/strips/swap-147-paragon-cast-idle.jpg
- Confidence: high; requirement: CHK-026, CHK-027
- Smallest fix: Register Paragon cast and idle feet; shorten the blend on this boss.
- Acceptance check: Paragon swaps have 3 or fewer ghost frames, feet within 2 px.
- introducedByCandidate: false; regressionVsLive: false

### 20. PR-0516 (minor, interface): Panels over painted actors and live controls (CHK-008 FAIL, carried): the Chapter I E card covers the NOW tile of the turn order; the Vegnagun chain counter, panels and damage numbers stack; the 'Possessed ...' banner crosses the aeon's body

- Game / chapter / state: both / Chapter I, Chapter V, Chapter III seams / E card open; chain fight; aeon seams
- Observed: At 1600 and 2000 the opened E card sits over the current actor's turn-order tile ('3RD IN QUEUE' over 'NOW') and Seymour's figure (R31-INT-02). The fan lists the same class: the Vegnagun chain box cut at the screen edge ('x1.9') with piled damage numbers, the Possessed Ixion/Valefor/Bahamut/Yu Yevon banner as a dark bar across the aeon, and the big turn cut-in covering the party at turn start (PR-0536). The 80-state sweep at 1280x720 and 2560x1440 was not re-run (PR-0552, PR-0553, PR-0560 carried).
- Expected: No panel hides the current actor's turn slot or a figure it should not (CHK-008).
- Repro: Chapter I first menu, press E, screenshot.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
- Confidence: high; requirement: CHK-008, docs/ENGINE-API.md#hud-safe-area
- Smallest fix: Anchor the intent card left of or below the turn order; move the possessed banner off the body.
- Acceptance check: Intersection of the card and the NOW tile is 0 at 1280x720, 1600x900, 2000x1012, 2560x1440 in Chapter I.
- introducedByCandidate: false; regressionVsLive: false

### 21. PR-0502 (minor, interface): The boss's bark box, the opening quip banner and the turn-intro wipe cover the first command menu (carried, stalled, now also on retry)

- Game / chapter / state: both / Chapter I first menu; Chapter I and IV retry / awaitingMenu true
- Observed: Seymour's line 'It's quieter on the other side.' covers SPECIAL, WHITE MAGIC and ITEMS at 1600, 2000 and the phone while the menu is awaiting input; the banner lasts under 1 s (gap pass); on both retries the first menu is under the actor's full-height portrait wipe. Seymour's banter card hides Skills and Magic rows and Tidus's plate (visual auditor, 10-first-menu-coach).
- Expected: The command rows are visible while the menu awaits input, or the menu does not await until they are.
- Repro: Chapter I real keys, first menu, no key pressed; or lose and TRY AGAIN.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/10-first-menu-coach.png; critic/rounds/round-31/evidence/seymour-flux-lose-retry/3-retry-menu.jpg; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/3-retry-menu.jpg
- Confidence: high; requirement: CHK-008, CHK-006
- Smallest fix: Place the bark clear of the command stack or hold awaiting until it has cleared.
- Acceptance check: At awaitingMenu true the command rows are unobscured.
- introducedByCandidate: false; regressionVsLive: false

### 22. PR-0540 (minor, interface): Chapter I intent card shows the IF YOU ATTACK header with no body (carried, stalled; third review at the same severity)

- Game / chapter / state: FFX only / Chapter I / E card at 1600 and 2000
- Observed: The conditional body (Delay Attack or Buster punished with party-wide Slowga; Protect under 75 percent; Reflect and phase 2 under 50 percent) is in the DOM but the card height clips it until J is held. Chapter II shows its body.
- Expected: The conditional half is readable by default or the header is not drawn without a body.
- Repro: Chapter I, seed 1, first menu, press E.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png
- Confidence: high; requirement: RUBRIC section 2 (enemy intent separates certain from conditional)
- Smallest fix: Let the card grow to its content as Chapter II's does.
- Acceptance check: E shows a non-empty IF YOU ATTACK body without J; scrollHeight equals clientHeight.
- introducedByCandidate: false; regressionVsLive: false

### 23. PR-0541 (minor, interface): Chapter IV desktop CHANGE list: 'GRANTS: BLUE' is pink on cream and nearly invisible, and a grant is never explained (carried, stalled)

- Game / chapter / state: FFX-2 only / ffx2-bahamut / CHANGE open at 1600 and 2000
- Observed: The unselected WARRIOR row's GRANTS: BLUE is nearly invisible; Gunner's GRANTS: GREEN on the selected row reads.
- Expected: Readable rows and one line saying what a grant is.
- Repro: Chapter IV, ArrowDown to CHANGE, Enter.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/21-change-open.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/21-change-open.png
- Confidence: high; requirement: CHK-003, CHK-007
- Smallest fix: Use the row ink for unselected GRANTS and add one explanatory line.
- Acceptance check: GRANTS contrast at least 4.5:1 selected and unselected.
- introducedByCandidate: false; regressionVsLive: false

### 24. PR-0518 (minor, interface): Phone 390x844: CHANGE tiles clip their text (UNNER, GRANTS: BLUI), the pause header wraps over the tab dots, the tab strip is cut at CHAPTER with no scroll cue (ACCESSIBILITY, CONTROLS and MUSIC are reached only by an unprompted swipe), the options pane stops at a half row, and the phone pause shows keyboard hints (carried, stalled; merges PR-0554, R31-ONB-01)

- Game / chapter / state: both / Chapter I and IV phone / pause by the chip; CHANGE list
- Observed: The pause chip is a 46x46 target and a tap opens the pause (gap pass). A real touch swipe on the strip scrolls it; nothing hints at it. Smallest visible text on the phone pause is 14 px; no horizontal page scroll (scrollWidth 390).
- Expected: Every tab reachable by sight; tiles whole; touch hints on a touch device.
- Repro: 390x844 touch, Chapter I, tap the chip, read the strip.
- Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause/phone-pause-0.png; critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause2/swipe1.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png
- Confidence: high; requirement: CHK-003, CHK-009, onboarding (device usability)
- Smallest fix: Fade the strip edge as a scroll cue; hide keyboard hints on touch; fit the tile text.
- Acceptance check: Strip shows an edge cue; no clipped tile text at 390x844.
- introducedByCandidate: false; regressionVsLive: false

### 25. PR-0542 (minor, interface): Pause chrome labels are low contrast, about 1.9 to 3.5:1 by pixel sampling (carried, stalled)

- Game / chapter / state: both / pause / pause at 1600 and 2000
- Observed: header 1.88:1, BATTLE STATS 2.37, H PAINTING ONLY 2.83, inactive tab 3.49, options section titles 2.38 (thin antialiased text, rough figure).
- Expected: At least 4.5:1 for small text.
- Repro: Pause screenshot, sample.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/14-pause-Esc.png
- Confidence: medium; requirement: CHK-003
- Smallest fix: Raise the label tokens.
- Acceptance check: Sampled contrast at least 4.5:1.
- introducedByCandidate: false; regressionVsLive: false

### 26. PR-0543 (minor, interface): FFX target mode lacks the Enter/Esc strip FFX-2 shows, and the hint strip calls the guide 'Intel' (carried, stalled; CHK-020 polish difference)

- Game / chapter / state: FFX only / FFX target mode / target step
- Observed: FFX-2 target frames show ENTER CONFIRM / ESC BACK; FFX frames do not; the hint strip labels the guide Intel while its panel says GUIDE.
- Expected: The same help in both, in one word.
- Repro: Chapter I, Attack, target step.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/16-target-single.png
- Confidence: high; requirement: CHK-020
- Smallest fix: Add the strip and unify the word.
- Acceptance check: Both games print the strip; one word for the guide.
- introducedByCandidate: false; regressionVsLive: false

### 27. PR-0483 (minor, interface): A touch player's route to the advisor's picks in the 27-item list and to an ally target is unproven (carried; two rounds of harness runs could not reach Holy Water or aim Yuna)

- Game / chapter / state: FFX (Chapter I phone) / seymour-flux / 390x844 touch
- Observed: Items list shows six rows of 27; 23 label mismatches; an ally target tap resolved to Seymour Flux; the touch run lost at turn 35. Also harness limit PR-0539.
- Expected: A touch player can reach every row the advisor names and aim an ally.
- Repro: 390x844 touch, Chapter I, Items, swipe to Holy Water, Yuna as target.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win-phone-touch/run.json
- Confidence: low; requirement: CHK-015, CHK-004
- Smallest fix: Prove first with a scripted swipe and ally tap.
- Acceptance check: By touch events Holy Water lands on Yuna (event log).
- introducedByCandidate: unknown; regressionVsLive: unknown

### 28. PR-0558 (minor, interface): At TEXT SIZE 115 and 130 the desktop F1 HUD overlaps: the boss ribbon over the guide chip and the intent panel over the turn strip; the Chapter IV help band sat under the PAUSE chip (merges R68-P1)

- Game / chapter / state: both (F1 HUD: Chapters I and IV) / Chapter I, IV / TEXT SIZE 115 and 130
- Observed: Focused review R68-P1 (candidate bundle, 1280x720 and 1600x900). The gap pass set TEXT SIZE 100 to 115 to 130 on the live pause and saw data-text-size set and the tab strip larger; it did not capture the battle HUD at 130 (r68 now scales the desktop HUD, so PR-0559 is probably fixed, not re-verified).
- Expected: No overlap at any text size.
- Repro: Pause, ACCESSIBILITY, TEXT SIZE 130, resume, open E and G.
- Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y-keys/a11y-after-changes.png
- Confidence: medium; requirement: CHK-008, onboarding (text size)
- Smallest fix: Reflow the ribbon and the intent panel under the larger scale.
- Acceptance check: Rect intersections 0 at 130 in Chapters I and IV.
- introducedByCandidate: false; regressionVsLive: false

### 29. PR-0549 (minor, visual): Party figures stack on each other in staging: Auron is almost wholly behind Tidus in Chapter III; the party reads as toys against Vegnagun and Bahamut (carried)

- Game / chapter / state: both / braskas-final-aeon, ffx2-vegnagun-shuyin / mid-fight
- Observed: Only Auron's coat edge shows behind Tidus in 23-midfight (two figures read). The fan also lists Ixion's body sitting through Yu Yevon.
- Expected: Three readable figures.
- Repro: Chapter III by real keys, seed 1, 23-midfight.
- Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/23-midfight.png
- Confidence: high; requirement: CHK-008
- Smallest fix: Offset Auron's slot in this chapter's layout.
- Acceptance check: All three heroes visible at the first menu.
- introducedByCandidate: false; regressionVsLive: false

### 30. PR-0521 (minor, feel): Pro camera framing in the action stills: Bahamut zooms and shifts within a turn; the sphere change swings the scene sideways (carried; see PR-0530 for the question to Bailey)

- Game / chapter / state: FFX-2 (Chapter IV) / ffx2-bahamut / seq-action-playing and seq-spherechange at 250 ms steps
- Observed: Head cut by the top in one frame, smaller and further right a few frames later; the sphere change f02 to f06 re-frames the dragon (upright and centred, then tilted at the left with an empty right half). The feel auditor read the Chapter IV sphere change as "reads cleanly" at the HUD level.
- Expected: A coherent camera (Bailey's judgment, PR-0530).
- Repro: Chapter IV, Rikku WARRIOR change at 1600 and 2000.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/seq-spherechange
- Confidence: medium; requirement: CHK-B2
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- introducedByCandidate: false; regressionVsLive: false

### 31. PR-0481 (minor, feel): Time to the first command: about 42 s in Chapter I and 21 to 23 s in Chapter IV from picking the chapter (pre-scene read included); the retry is now 4.9 s (Chapter I) and 10.2 s (Chapter IV)

- Game / chapter / state: both / Chapters I and IV / real keys, desktop line
- Observed: Round 30b: 43.2 s and 26.6 s; retry 16.5 s and 9.9 s. The chained chapters retry in 9.6 to 13.6 s (this round's gap runs).
- Expected: A short wait to the first command.
- Repro: Chapter select to awaitingMenu with a timer.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/run.json; critic/rounds/round-31/gaps-chief/lose-braskas-final-aeon.log
- Confidence: high; requirement: RUBRIC section 2 (pace)
- Smallest fix: See PR-0567.
- Acceptance check: As PR-0567.
- introducedByCandidate: false; regressionVsLive: false

### 32. PR-0532 (minor, audio): Chapter I's win fanfare is cut at the results swap and restarted from its first note (carried; contradicts D-1295 'one fanfare')

- Game / chapter / state: FFX only / seymour-flux / results swap
- Observed: After-fight snapshot shows current null (or victory-ffx fading at gain 0.002) and the results snapshot about 4 s later shows victory-ffx current at gain 1, at 1600 and 2000, the same signature as round 30b; not heard; the code is unchanged (BattleScreen exit stopMusic(0.6), line moved in the r68 split).
- Expected: D-1295: one fanfare.
- Repro: Chapter I win, dense audioDebug timeline from the last blow.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/audio-debug.jsonl; critic/rounds/round-31/evidence/seymour-flux-win-2k/audio-debug.jsonl
- Confidence: medium; requirement: AUDIO phase transitions; D-1295
- Smallest fix: Skip the exit's stopMusic for a win when the results cue is already current.
- Acceptance check: A 100 ms timeline shows victory-ffx continuous.
- introducedByCandidate: false; regressionVsLive: false

### 33. PR-0514 (minor, audio): The first UI sounds of a session fall back to the procedural synth, more often and for longer this round (7 of 11 logged runs, up to 14 sounds in the FFX-2 chapters; round 30: 2 of 17)

- Game / chapter / state: both / title and chapter select, first 2 to 7 s of a fresh profile / cold profile, live network
- Observed: ffx2-bahamut-win-2k 13 synth sounds 3.47 to 6.05 s; phone 9; vegnagun 14 (3.83 to 6.58 s); the Chapter I runs are clean. Cause not established (sprites 2.7 and 4.6 MB over the live network, host load, or the r68 load order).
- Expected: CHK-001 item 3: nothing falls back to synth.
- Repro: Fresh profile, FFX-2 chapter select to Chapter IV; move and confirm within 3 to 6 s.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/audio-debug.jsonl; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/audio-debug.jsonl
- Confidence: medium for the entries, none for the cause; requirement: CHK-001 item 3
- Smallest fix: Gate the UI cue on the first sprite decode, or start its fetch ahead of art.
- Acceptance check: Ten cold runs log no synth entry in the first 7 s.
- introducedByCandidate: unknown; regressionVsLive: unknown

### 34. PR-0504 (minor, audio): Chapter IV win results are silent on the default desktop build, by a release 62 pick nobody has heard (carried question for Bailey; re-observed at 1600 and 2000)

- Game / chapter / state: FFX-2 only / ffx2-bahamut / results
- Observed: Desktop wins are silent at the results; the phone win plays pause music.
- Expected: Bailey's decision.
- Repro: Chapter IV win.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/audio-debug.jsonl
- Confidence: high; requirement: AUDIO
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- introducedByCandidate: false; regressionVsLive: false

### 35. PR-0523 (minor, interface): Esc from the command menu closes an open guide panel first, so the pause seems ignored (carried; re-observed in Den of Woe, Trema and Via Purifico; a gap-pass Esc after ACCESSIBILITY row changes took more than 1.2 s to close, not reproduced as a defect)

- Game / chapter / state: both / ffx2-den-of-woe, ffx2-trema, isaaru-via-purifico / guide panel open
- Observed: pOpens and resumedByEsc are true; three pause captures read screen battle.
- Expected: The first Esc pauses or the panel says it closed first.
- Repro: Open the guide, press Esc.
- Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/14-pause-Esc.png
- Confidence: medium; requirement: CHK-015
- Smallest fix: As carried.
- Acceptance check: As carried.
- introducedByCandidate: false; regressionVsLive: false

### 36. PR-0550 (minor, interface): Gamepad: the A that confirms the target also stops Wakka's first reel as the overlay opens (carried; the pad evidence is reused from round 30b under a written argument)

- Game / chapter / state: FFX only / Wakka Overdrive / virtual pad
- Observed: Not re-driven this round (reused from round 30b).
- Expected: The first reel runs until pressed.
- Repro: As in round 30b.
- Evidence: critic/rounds/round-30/gaps2/g2
- Confidence: medium; requirement: CHK-023
- Smallest fix: As carried.
- Acceptance check: As carried.
- introducedByCandidate: false; regressionVsLive: false

### 37. PR-0460 (minor, combat): Chapter III possession links 3 to 6 Summon rows still not seen in a browser this round (carried; reused from round 30b under a written argument)

- Game / chapter / state: FFX only / braskas-final-aeon / links 3 to 6
- Observed: Engine and data byte-identical; the summon presentation code ran live in Chapters I, II and III link 1.
- Expected: Seen by real keys.
- Repro: As round 30b.
- Evidence: critic/rounds/round-30/gaps2
- Confidence: medium; requirement: CHK-023
- Smallest fix: As carried.
- Acceptance check: As carried.
- introducedByCandidate: false; regressionVsLive: false

### 38. PR-0503 (minor, process): Prep agency (STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; DRESSSPHERES, ACCESSORIES) and the r68 prep tab roles were never walked by key or touch (carried, the fourteenth review; the pause ACCESSIBILITY tab was walked by the gap pass)

- Game / chapter / state: both / all / prep
- Observed: 291 entries, 11 of them prep first tab; none opens another tab or changes a value. The gap pass walked pause E (Tidus, Yuna, Kimahri, Chapter, Guide, Options, Accessibility, Controls, Music), TEXT SIZE 100 to 115 to 130 (data-text-size), REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS toggles. Not done: COLOUR VISION on a frame, key remap, prep tabs, hold-Home reset. RUBRIC section 8 requires the method check before another attempt; none is written.
- Expected: Per game and input: each prep tab opened, one change made, visible in the first menu.
- Repro: Add one scripted real-input walk to the capture owner.
- Evidence: critic/rounds/round-31/evidence/index.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/run.json
- Confidence: high; requirement: RUBRIC section 6 and 8
- Smallest fix: Write the method check; assign the walk to the capture owner's script.
- Acceptance check: A run.json with the walks and the changed value in the first menu, both games, both sizes.
- introducedByCandidate: false; regressionVsLive: false

### 39. PR-0520 (minor, delivery): First-load time on the live URL still not measured in a browser (carried, the fourth review)

- Game / chapter / state: both / title / cold edge
- Observed: Node-side arithmetic: cold title about 3.1 MB on the wire (bundle 1,450,107 B brotli in 0.47 s), inside the proposed 4 MB. No browser timing.
- Expected: Title usable under 5 s cold on a named profile.
- Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/coldload.mjs --base=https://echoesofspira.com/
- Evidence: critic/reviews/2a9340249-focused/cold-cand/gaps/coldload/out.json
- Confidence: high that it is unmeasured; requirement: CHK-017 cold-load clause
- Smallest fix: Run coldload.mjs against the live URL.
- Acceptance check: A report line with the median and the throttled load.
- introducedByCandidate: false; regressionVsLive: false

### 40. PR-0544 (minor, delivery): FFX-2 Trema 56.7 fps, p99 74.7 ms, 2.3 percent over 34 ms (carried since round 30; see PR-0580 for the other outliers)

- Game / chapter / state: FFX-2 / ffx2-trema / continuity probe
- Observed: Live run: 56.7 fps, 1,588 of 67,748 frames over 34 ms, max 158 ms.
- Expected: B4a to B4c.
- Repro: Trema continuity.
- Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json
- Confidence: high for numbers; requirement: RUBRIC section 2
- Smallest fix: Per-frame trace first.
- Acceptance check: p99 at most 25 ms.
- introducedByCandidate: false; regressionVsLive: false

### 41. PR-0547 (minor, interface): FFX-2 results ledger names the dressphere Rikku started in, not the one she finished in (carried, re-observed)

- Game / chapter / state: FFX-2 only / ffx2-bahamut / results
- Observed: As round 30b.
- Expected: The finishing dress.
- Repro: Chapter IV win, change Rikku, results.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/31-results.png
- Confidence: medium; requirement: RUBRIC prep (understandable results)
- Smallest fix: As carried.
- Acceptance check: As carried.
- introducedByCandidate: false; regressionVsLive: false

### 42. PR-0539 (minor, harness): Critic harness limits (carried): the phone Items list is 6 rows of 27 for the route, timed sequences carry no frame timestamps, the capture owner's retry folder for Chapter IV mixes runs and its images are not indexed (R31-U1), and the cardFirst advisor measurement describes a card not on screen (R31-INT-09)

- Game / chapter / state: both / critic runner / tools
- Observed: ffx2-bahamut-lose-retry holds files from 13:20 to 13:28 of several runs; none is in index.json.
- Expected: One run per folder, every image indexed.
- Repro: ls --time-style=full-iso on the folder against run.json.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
- Confidence: high; requirement: CHK-016
- Smallest fix: Re-run into a clean folder with the images indexed.
- Acceptance check: A folder whose run.json and images share one run and are in index.json with verified true.
- introducedByCandidate: false; regressionVsLive: false

### 43. PR-0099 (minor, audio): Stand-in or borrowed scene beds and battle cues in eleven chapters (carried; not re-judged by ear)

- Game / chapter / state: both / eleven chapters / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 44. PR-0515 (minor, interface): Doublecast advice says NO MP while the spell picker shows the MP cost (carried, not re-examined)

- Game / chapter / state: FFX-2 only / doublecast / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 45. PR-0485 (minor, narrative): Portrait expression never follows the line; 46 emotion tags are read by nothing (carried; no story file changed)

- Game / chapter / state: both / all / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 46. PR-0537 (minor, visual): The live Chapter I boss card has no approved target (carried, not re-examined)

- Game / chapter / state: FFX only / Chapter I / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 47. PR-0552 (minor, interface): FFX-2 Mega Flare telegraph: the CHAIN counter is drawn over the ATTACK row (carried; not re-observed)

- Game / chapter / state: FFX-2 only / Chapter IV / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 48. PR-0555 (minor, prep): The prep STATS tab keeps the pre-spend value after a Sphere Grid activation (carried; not walked)

- Game / chapter / state: FFX only / prep / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 49. PR-0556 (minor, onboarding): The Sphere Grid card says Enter acts, but Enter after the card starts the battle (carried; not walked)

- Game / chapter / state: FFX only / prep / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 50. PR-0557 (minor, prep): OVERDRIVE modes on the prep tab have no keyboard route (carried; not walked)

- Game / chapter / state: FFX only / prep / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 51. PR-0559 (minor, onboarding): TEXT SIZE scaled the pause and the phone command menu but not the desktop battle HUD (r68 a11y-text now scales it per the focused review; not re-verified live)

- Game / chapter / state: both / all / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 52. PR-0560 (minor, interface): Chapter I ally target with the Items list open: rows cover the TARGET plate and hand (carried; not re-observed)

- Game / chapter / state: FFX only / Chapter I / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 53. PR-0561 (minor, prep): The FFX-2 prep STATS tab does not say it leaves accessories and the Garment Grid out (carried; not walked)

- Game / chapter / state: FFX-2 only / prep / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 54. PR-0562 (minor, onboarding): On the phone the first-run guide step 3 pointer covers part of the TIP text (carried; not re-observed)

- Game / chapter / state: both / phone / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 55. PR-0563 (minor, delivery): WebKit 26.6: party-plate portraits draw as noise at the first menu (carried; Chromium only this round)

- Game / chapter / state: both / Chapter I / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 56. PR-0564 (minor, delivery): WebKit 26.6 holds 12 to 26 fps at the first menu (carried; Chromium only this round)

- Game / chapter / state: both / all / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 57. PR-0566 (minor, feel): First sight still stalls: the first 0.1 to 4.1 s of every battle carry 5 to 9 frames over 100 ms (carried; the live run records the worst frames, not when they fall)

- Game / chapter / state: both / all / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 58. PR-0568 (minor, feel): hz-matrix: chained beats differ 25 to 30 ms between 60 and 120 or 144 Hz (carried; not re-run)

- Game / chapter / state: both / Chapter IV / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 59. PR-0577 (polish, interface): FFX-2 target flag plate overlaps the command panel edge and clips the status tag ("Curse") at 1280 to 2000 wide (new in r68)

- Game / chapter / state: FFX-2 only / Chapter IV / target step
- Observed: Focused review R68-P2, candidate bundle (same artifact as live).
- Expected: No overlap and no clipped tag.
- Repro: Chapter IV, Attack, target step, 1280 to 2000 wide.
- Evidence: critic/reviews/2a9340249-focused.json
- Confidence: medium (focused review; not re-observed live by the chief); requirement: CHK-008
- Smallest fix: Offset the flag clear of the panel edge.
- Acceptance check: Flag and panel rects do not intersect at five widths.
- introducedByCandidate: true; regressionVsLive: unknown

### 60. PR-0578 (polish, interface): Phone board: three text chips under 44 px (skip the guide 18 px, two hint chips) (R68-P3)

- Game / chapter / state: both / phone board / 390x844
- Observed: Focused review R68-P3; the chief's phone sweep read 14 px type, none under 14 px, on the battle menu, first menu and pause (separate from touch-target size).
- Expected: 44 px touch targets.
- Repro: tools/text-floor-sweep.mjs --touch=1 --targets=1 --sizes=390x844.
- Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/gaps-chief/gaps/sweep/out-phone.json
- Confidence: medium; requirement: RUBRIC onboarding (device usability)
- Smallest fix: Pad the chips to 44 px.
- Acceptance check: Touch-target probe lists no control under 44 px on the board.
- introducedByCandidate: false; regressionVsLive: false

### 61. PR-0579 (polish, visual): Magic Break caption box sits over its own pink tag and clips it (FFX-2 Chapter IV, 2000x1012; one capture)

- Game / chapter / state: FFX-2 only / ffx2-bahamut / mid-fight
- Observed: The caption box overlaps the MAGIC BREAK tag so the tag text is half hidden. On the phone the same two labels sit side by side without clipping (23-midfight).
- Expected: One readable label.
- Repro: node critic/runner/lib/route.mjs ffx2-bahamut win --size=2000x1012 --seed=1; open 23-midfight.png (moment dependent).
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/23-midfight.png
- Confidence: low; requirement: CHK-011
- Smallest fix: Offset the tag or drop the duplicate while the caption shows.
- Acceptance check: A Magic Break capture shows one readable label.
- introducedByCandidate: unknown; regressionVsLive: unknown

### 62. PR-0553 (polish, interface): Chapter II: Tidus's HP plate covers Yunalesca's lower body in the hit frame; the party panel crosses Auron's boots (carried)

- Game / chapter / state: FFX only / yunalesca / first hit, 1600x900
- Observed: The plate sits over her legs and feet during the damage burst.
- Expected: HUD off the boss body or faded over it.
- Repro: Chapter II, seed 3, first hit, 23-midfight.
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/23-midfight.png
- Confidence: high; requirement: CHK-008
- Smallest fix: Move the plates down or fade over a boss quad.
- Acceptance check: No plate over the boss body at that moment.
- introducedByCandidate: false; regressionVsLive: false

### 63. PR-0548 (polish, feel): Hit flashes, whiteouts and glow edges wash out the figure for a frame or more (carried): Braska's Final Aeon is a white blob for five frames on a heal, Vegnagun flickers copper for a frame, Rikku glows double at the sphere change

- Game / chapter / state: both / braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-bahamut / effect frames
- Observed: Fan strips: braska seq-action-playing f02-f06; vegnagun seq-action-playing f04 and f09; bahamut seq-spherechange f01-f02.
- Expected: A flash that stays readable.
- Repro: Chapter III Power Wave heal; Chapter V chain; Chapter IV change.
- Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-action-playing; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing
- Confidence: medium; requirement: CHK-027 (flicker)
- Smallest fix: Cap the heal wash and the glow on the figure's alpha.
- Acceptance check: The figure outline stays readable in the named frames.
- introducedByCandidate: false; regressionVsLive: false

### 64. PR-0574 (polish, feel): A boss or aeon and its pagodas appear in one frame (Braska battle start and aeon swaps); the party flashes from faded to full in one frame at the seams (first-time fan; the feel auditor read seams 3 and 5 as readable and paced)

- Game / chapter / state: FFX only / braskas-final-aeon / seq-transition-into-battle f02 to f03; seq-seam-2/4/6/7
- Observed: See captures; the arena is empty for about 1.1 s, then a flash and the possessed aeon with a name banner.
- Expected: A readable arrival.
- Repro: Chapter III by real keys.
- Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-transition-into-battle; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
- Confidence: low; requirement: CHK-027 (popping)
- Smallest fix: None until Bailey judges the seam look (PR-0530).
- Acceptance check: A recorded verdict.
- introducedByCandidate: false; regressionVsLive: false

### 65. PR-0575 (polish, feel): MISS pops over healthy allies when a party-wide Mega Phoenix is used with one ally down (unsourced; do not change without a source)

- Game / chapter / state: FFX only / seymour-flux / turn 3 Mega Phoenix
- Observed: The engine logs miss reason wrong-state for tidus and yuna while Kimahri's revive resolves; it reads as if the item failed. Round 30b saw the same.
- Expected: Unknown: no source says what the original draws.
- Repro: Chapter I seed 1 turn 3.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f04.jpg; critic/rounds/round-31/evidence/seymour-flux-win/battle-log.json
- Confidence: low; requirement: AGENTS rule 6
- Smallest fix: Source the original, or ask Bailey.
- Acceptance check: A sourced statement then the same repro.
- introducedByCandidate: false; regressionVsLive: false

### 66. PR-0576 (polish, feel): UNVERIFIED observation: a blank cream cutscene frame between the Yunalesca victory and the results card

- Game / chapter / state: FFX only / yunalesca / victory to results
- Observed: yunalesca-win/30-post-scene.png: flat cream with the chapter eyebrow and the advance strip and no painting; the harness read the screen as results (UNVERIFIED capture). Chapter I shows a washed painting.
- Expected: The painting under the wash, or a few frames only.
- Repro: Chapter II seed 3, capture at the end of the fight (timed sequence needed).
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/30-post-scene.png
- Confidence: low; requirement: CHK-022
- Smallest fix: None until measured.
- Acceptance check: A timed sequence shows under 500 ms of a painting-less frame.
- introducedByCandidate: unknown; regressionVsLive: unknown

### 67. PR-0536 (polish, feel): The turn cut-in (MF-16) covers nearly half the stage for several frames at every turn start in every chapter the fan looked at; the first-time fan rated it major

- Game / chapter / state: both / all / turn start
- Observed: The fan lists 14 captures (yunalesca, bahamut, vegnagun, flux). It is a deliberate feature (on since release 66). Whether it covers too much is a design judgment (carried PR-0536, and CHK-B2).
- Expected: Bailey's judgment.
- Repro: Any chapter, turn start.
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-transition
- Confidence: medium; requirement: RUBRIC feel (readable effects)
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- introducedByCandidate: false; regressionVsLive: false

### 68. PR-0528 (polish, visual): First-time fan polish breakers kept: attacks that do not visibly connect (a Yunalesca slash arc around Tidus while she stands at the right edge; a Bahamut hit that arrives as a purple streak from off-screen), one empty-stage frame as Bahamut fades in, a monster vanishing for a frame (Mortiorchis)

- Game / chapter / state: both / yunalesca, ffx2-bahamut, seymour-flux / effects
- Observed: Fan captures yunalesca seq-transition-into-battle f03-f05, bahamut seq-spherechange f06-f09, flux seq-action-playing f06. Floating and hovering bosses (Bahamut, Yunalesca) are by design; the fan's "feet in the air" and "party tiny" items are dropped.
- Expected: Effects aimed at their target.
- Repro: see captures
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange
- Confidence: low; requirement: CHK-027
- Smallest fix: Aim the slash and the streak from the actor.
- Acceptance check: Frames show origin at the actor.
- introducedByCandidate: false; regressionVsLive: false

### 69. PR-0524 (polish, encounter): research/ffx2-bahamut.md still carries the superseded Mega Flare constant 24 and the 614 to 1,165 damage with no banner (carried)

- Game / chapter / state: FFX-2 only / ffx2-bahamut / docs
- Observed: research/ is byte-identical to round 30b.
- Expected: A superseded banner.
- Repro: head and section 2.3 of research/ffx2-bahamut.md against re-ffx2-ai-bahamut-vegnagun.md section 2.3.
- Evidence: research/ffx2-bahamut.md
- Confidence: high; requirement: AGENTS rule 6
- Smallest fix: Add the banner.
- Acceptance check: The banner exists.
- introducedByCandidate: false; regressionVsLive: false

### 70. PR-0533 (polish, test-coverage): The 15 s default test timeout fails 27 CPU-bound suites when the suite shares the host with browser jobs (extends PR-0533; the 13 files pass 239 of 239 serially)

- Game / chapter / state: both (tooling) / advisor, strategy-chapter2, door tests, ui-ffx2-atbmode, audio-manifest-io / full suite 27,254 tests
- Observed: 28 failed in 27 suites, all 15 s timeouts (one EPERM on a lock file) while the harness ran.
- Expected: A green full suite on a loaded host.
- Repro: npm test while a capture runs.
- Evidence: critic/rounds/round-31/audit-combat/full-suite.json
- Confidence: high; requirement: AGENTS Done means
- Smallest fix: Give the fuzz-style files a 60 s timeout; retry the lock open on EPERM.
- Acceptance check: npm test passes while one browser job runs.
- introducedByCandidate: false; regressionVsLive: false

### 71. PR-0519 (polish, interface): Question for Bailey (carried): the default F1 HUD shows the advisor as a one-row chip; the reason, benefit and CURES KO tag live only in the G card

- Game / chapter / state: both / Chapters I and IV / first menu
- Observed: Advice itself is right: 784 of 784 picks found their row; the reason is one key away.
- Expected: Bailey's decision.
- Repro: Chapter I first menu.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/11-advisor.png
- Confidence: high; requirement: RUBRIC interface
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- introducedByCandidate: false; regressionVsLive: false

### 72. PR-0546 (polish, prep): The pro-defeat card now names its cause at normal speed ('Felled by Attack, turn 4, attempt 1' ) after r67's repair; the SKIP-speed wording was not re-run

- Game / chapter / state: both / Chapters I and IV / defeat card
- Observed: Seen at normal speed in both chapters; SKIP not re-run.
- Expected: A cause at every speed.
- Repro: Lose with battle speed SKIP.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
- Confidence: medium; requirement: RUBRIC prep (understandable defeat)
- Smallest fix: Run it at SKIP.
- Acceptance check: The card names a cause at SKIP.
- introducedByCandidate: false; regressionVsLive: false

### 73. PR-0487 (polish, onboarding): 'He strikes first' coach against a turn order that puts Seymour third (carried; not reproduced in seed 1 where Seymour does strike first)

- Game / chapter / state: FFX only / Chapter I phone / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 74. PR-0508 (polish, onboarding): VISUAL STYLE and PRESENTATION 'THE ECHO - B' are unexplained and the FFX options pane shows no focused row (carried)

- Game / chapter / state: both / options / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 75. PR-0569 (polish, delivery): Firefox console font warnings for Rajdhani and Chakra (carried; Chromium only this round)

- Game / chapter / state: both / all / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 76. PR-0526 (polish, interface): Small copy and fit points in the booth and phone surfaces (carried, not re-examined)

- Game / chapter / state: both / booth, phone / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

### 77. PR-0527 (polish, delivery): UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 runs in round 29 (carried; none seen in the 19 live runs, but see the 5.6 s frame in PR-0580)

- Game / chapter / state: both / harness / carried
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Expected: as in the earlier rounds that opened it
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium; requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Note: No round-31 evidence; kept open, never closed by silence.

Closed this round:
- PR-0551: FIXED by r68: the FFX target flag label is about 14 px (cap height about 9 px); the focused review measures 14.0 or more at five sizes; the chief's matrix sweep read 914 text elements, smallest 14 px, none under (11 of 12 surfaces).
- PR-0522 and PR-0461: stay CLOSED: the dedicated harness ran all 19 chapters with 0 probe errors; all 19 won by real keys.

First-time fan dispositions: camera jerks, pops and flicker are merged into PR-0530, PR-0521, PR-0574 and PR-0548; ghosting into PR-0379, PR-0473 and PR-0531; UI over the action into PR-0516, PR-0536 and PR-0549; the unreachable-attack and floating-feet items into PR-0528 (the floating of Bahamut and Yunalesca is by design and dropped). Dropped as not supported: "on the phone the battle gets only the top third of the screen and the bottom half is empty black" (the phone stage fills about the upper half and a band of about 130 px under the command tiles is empty by layout; the chief read 23-midfight at 390x844).

## What stands between this build and acceptance

A deep review cannot accept a milestone. For the finished milestone this build still lacks: a verified number for audio, onboarding, prep and delivery (the first needs Bailey's ears; the others need the prep and colour-vision walks, first-load and cross-browser time); every scored category at 9.0 or higher (visual 8.4, feel 8.3, narrative 8.8, interface 8.0 are below the floor); CHK-008, 009, 020, 026 and 027 passing; no open major (nine are open); the targets still unverified or waiting; and the human judgments in the list above.

## What changed since round 30b (rubric v2 only)

Release 67 and 68 landed between the rounds. Measured on the live builds: swap jerks 115 to 66 (15 to 8 chapters), see-through time 3,474 to 1,689 ms a minute, height misses 15 to 5, stance misses 39 to 23, head fails 489 to 476 (no gain), feet fails 12 to 16 (no gain), hard cuts 75 to 3,864 (the wide scope turned the planned smear cuts on in 13 more chapters; PR-0530), the Chapter I retry 16.5 to 4.9 s, the FFX-2 run-in stand 184 to 200 ms to 0 to 34 ms, turn-order overlap 0, the FFX-2 HUD node leak fixed, the target flag at 14 px (PR-0551 closed). New this round: the Chapter I revive step (PR-0570), the phone name abbreviation (PR-0571), the unproven load-diet claim (PR-0572), the memory curve (PR-0573), the 5.6 s frame outlier (PR-0580). Scores against 30b: combat 9.5 to 9.4 (the combat auditor held 0.1 back for the Trigger Happy window nobody had played, the open Shooting Star button-order source conflict, PR-0550 and PR-0524; the chief own Trigger Happy run closes the first reason only), encounter 9.2 to 9.2, visual 8.3 to 8.4, feel 8.2 to 8.3, narrative 8.8 (reused), interface 8.0 (same).

## Proposals (nothing here is built without Bailey's yes)

- Written method check for the pose-swap family (RUBRIC section 8: PR-0531, PR-0459, PR-0380 and PR-0379 have been open at the same severity in rounds 29, 30, 30b and 31): read the worst strip per class (Vegnagun tail, Sin fins/core, Auron follow, Paine attack to follow, Ixion hurt to KO, Kimahri revive), say which of the r68 switches helped (wide scope: ghosting down 52 to 76 percent; jerks 115 to 66), then choose continue, change method, or ask Bailey.
- Show Bailey the strips behind PR-0530 (22 planned hard cuts a minute, the big turn cut-in, the Chapter I battle-start cut) and ask for one verdict; nothing in the camera is built before he answers.
- Make the harness read a rig figure's head from its own part box and print the strip header's real-head figure as a second number (PR-0534, PR-0517): the control reads PASS where the strip shows x0.82.
- Add a Trigger Happy and a lose-retry-at-link-N job to the capture owner's script (the chief's th-probe.mjs and the loseretry3.mjs runs are the starting point) so these are not gap-pass work every round.
- A phone budget job at eight chapter visits and with ?loaddiet=off to settle PR-0567, PR-0572 and PR-0573 together.

## Clear output (verbatim from tools/critic-clear.mjs)

```text
settled focused: FAIL
  settled deep: FAIL
  every obligation for this build is settled; marker moved to critic/cleared/
```
