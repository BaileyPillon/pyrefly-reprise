# Critic round 19b (deep) — production candidate c69de96a, release 36

```text
Build / artifact / target version: main c69de96a3bfa7e57cfad6c7b127ed6d8fd662718 (bundle index-GO0eMOto.js) / artifactHash 37273cfee71633f8c077b288adc56ae1f84b96149f2b85cd3500a5553eecaaaa (dist-gate, 1,431 files, not deployed) / targets.json sha256 650de885de231e5b957833d09c9c60412fa9573325fd732f1d8f1bbd48f1263f
Review: deep
Deployment: NOT APPLICABLE (candidate, not deployed; CHK-017 owed by the live review)
Changed area: FAIL (the five r36fix changes meet their targets; release 36 still regresses the advisor card under the colossus HUD layout, PR-0330, polish)
Ship: SHIP — no critical, no major regression against live 35; round 19's HOLD (PR-0307, PR-0312) fixed. Discloses the majors PR-0148, PR-0308, PR-0269, PR-0310, PR-0311, PR-0099, PR-0270, PR-0222 and the polish regression PR-0330
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED, no number); categories combat 9.2, encounter 8.9, visual 8.9, feel 8.2, narrative 8.9, audio UNVERIFIED, interface 8.5, onboarding 8.6, prep 9.1, delivery 8.5
Targets: required 87 / matched 70 / failing 0 / unverified 17 / waiting on decision 6
Top issues: PR-0148, PR-0308, PR-0269, PR-0310, PR-0311 (full ranked list below)
Coverage: 18 chapters by real keys (15 won through aftermath; XIII, XVII, XVIII loss + RETRY only), five aspects for the colossus chapters, 20 dressphere changes, card fade, 24-case save matrix, combat replay and benches; reused with dependency arguments: front-end tiles, narrative, FFX-2 benches, blackout, Overdrive shot; not tested: perf single lane, non-Chromium, real devices, CHK-002 measure, CHK-006 FFX-2 matrix
Next required review and why: live review (CHK-017) if c69de96a deploys; next batch PR-0330, PR-0333, PR-0308, harness PR-0339/PR-0261, then its focused review
Elapsed review time / repeated work avoided: about 165 min wall clock / combat benches, front-end tiles, narrative and audio technical evidence reused
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
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 8 critical or major issue(s) remain open
  - encounter sin-fins-core has no complete real-input flow
  - encounter sin-face has no complete real-input flow
  - encounter ffx2-trema has no complete real-input flow
  - 17 required target(s) unverified
  - 6 required target(s) waiting
  - only 70 of 87 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
  - human judgment not recorded: Feel: the held Overdrive shot, the dressphere shot (PR-0314) and twirl keys, including the twirl-start block (PR-0334), breathing and KO collapse in play (CHK-B2)
  - human judgment not recorded: Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
  - human judgment not recorded: Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
  - human judgment not recorded: Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
  - human judgment not recorded: Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
  - human judgment not recorded: Delivery: ship source maps or free 22.8 MB for the waiting art; does the 800 MB line mean MB or MiB (PR-0328)
  - human judgment not recorded: Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270)
  - human judgment not recorded: Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
  - human judgment not recorded: Art: Yuna Thief painting options, or take Thief out of the Ch VI grid until it exists (PR-0311)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## critic-clear output (verbatim)

```text
critic:clear no pending marker for build c69de96a: kept as candidate evidence
```

## Verdicts

- **deployment: NOT APPLICABLE.** Candidate review; c69de96a is not deployed. CHK-017 is owed by the live review after any deploy, against artifactHash 37273cfe...
- **changedArea: FAIL.** FAIL. The five r36fix changes meet their targets on this build: PR-0307 (Ch II dome fills the frame at four aspects, matches live), PR-0309 (faces clear in every captured shot), PR-0312 (0 fade rows with a menu up, Natus clear), PR-0310 (masters fail closed; no master worsens a gap) and PR-0311 (no close-up on the placeholder). But release 36's changed area as a whole still carries one regression against live 35 at polish: the advisor card squeezed under the colossus HUD layout in Ch III, IX and IV (PR-0330); CHK-008 fails (PR-0333 phone Bahamut head, regression unknown) and CHK-012 fails (PR-0311 placeholder, pre-existing); the dressphere shot stays a half-second flash (PR-0314, new feature).
- **milestone: not assessed.** A deep review does not assess the milestone.
- **ship: SHIP.** SHIP: no critical issue; every major is pre-existing and not a regression (all tagged introducedByCandidate false, regressionVsLive false); round 19's HOLD regressions PR-0307 and PR-0312 are fixed. The one regression found (PR-0330) is polish and is disclosed.

Ship reasons:
- SHIP: no critical defect is introduced or left reachable: no crash, lock or lost progress in 24 route runs and 53 gap sessions (0 console errors, 0 failed requests in the logged runs), and the save class passes (CHK-024, 24 of 24 on re-read, saves written by the r33, r34 and r35 artifacts).
- Round 19's HOLD is cleared: PR-0307 (Yunalesca plate regression) and PR-0312 (cards fading over the boss) are fixed and measured on this exact bundle; PR-0309 is fixed in every captured case.
- No major is a regression against live 35: PR-0148, PR-0308, PR-0269, PR-0310, PR-0311, PR-0099, PR-0270 and PR-0222 all exist on live and are disclosed and carried into the next batch.
- Disclosed polish regression: PR-0330, the move-advisor card loses its effect, number and hit-chance lines under the colossus HUD layout in Ch III, IX and IV at 1600x900 and 2000x1012 (the pick, target and cost stay right). Polish does not hold under RUBRIC section 3; it goes first into the next batch.
- Unknown against live, polish only: PR-0333 (phone Bahamut head under the intent strip) and PR-0332 (2560x1080 plate bands); neither is critical, so neither holds.
- This deep report is the save-data-class evidence the plan asks for before the deploy (deepBeforeDeploy true).

Majors the release announcement must disclose:
- PR-0148: no numeric owner listening verdict for the shipped mix (music v2, SFX v2)
- PR-0308: Bushido and Swordplay ignore the Overdrive chosen; every Bushido shows one invented 7-input sequence and every Swordplay tier has the same zone and speed
- PR-0269: the advisor line loses Chapter XVII and is unreliable in Chapter XVIII
- PR-0310: party and boss still interpenetrate at rest in Ch II, Ch III and Ch VIII
- PR-0311: Yuna's Thief dressphere is still a translucent mannequin placeholder for the rest of the fight
- PR-0099: nine chapter rows in THEMES.md still play a stand-in cue
- PR-0270: TEXT SIZE grows nothing in the FFX-2 battle HUD
- PR-0222: the fix for the hidden FF7 fight's black hold on a cold cache is still not captured
- Also disclosed (polish, regression against live 35): PR-0330, the move-advisor card loses its detail lines under the colossus HUD layout in Ch III, IX and IV.

## The ten categories

| Category | Weight | Score | Status | Round 19 |
|---|---:|---:|---|---:|
| combat | 20 | 9.2 | scored | 9.2 |
| encounter | 10 | 8.9 | scored | 8.9 |
| visual | 15 | 8.9 | scored | 8.7 |
| feel | 10 | 8.2 | scored | 8.1 |
| narrative | 10 | 8.9 | scored | 8.9 |
| audio | 10 | — | UNVERIFIED | UNVERIFIED |
| interface | 10 | 8.5 | scored | 8.5 |
| onboarding | 5 | 8.6 | scored | 8.6 |
| prep | 5 | 9.1 | scored | 9.1 |
| delivery | 5 | 8.5 | scored | 8.5 |

Bailey's five visual sub-scores (provisional, judged with motion; not in the weighted score), against round 19 (8aee1e69):

| Sub-score | 19b | Round 19 |
|---|---:|---:|
| characterModels | 7.9 | 7.9 |
| enemyModels | 7.5 | 7.6 |
| animation | 6.9 | 6.9 |
| fidelity | 8.1 | 8 |
| camera | 7.7 | 7.6 |

Chief's reconciliation. Visual auditor: 7.9 / 7.5 / 6.9 / 8.1 / 7.7. Feel auditor: animation 6.9, camera 7.8. Capture owner: 7.9 / 7.6 / 6.9 / 8.0 / 7.8. Camera taken at 7.7: the Yunalesca regression is gone and held shots honour menus and REDUCE MOTION, against a colossus master now delivered in two chapters, the phone Bahamut head crop and a dressphere shot that is shorter and rarer. Enemy models 7.5: Natus, BFA and Evrae lose their colossus scale, Bahamut's head is still washed out. Fidelity 8.1: the Yunalesca void is gone; the 21:9 bands and the bloom remain. Animation 6.9 held: the KO collapse was timed this round (FFX hurt about 1.7 s, down about 2.07 s; REDUCE MOTION 0.87 / 1.26 s, shorter and not skipped; FFX-2 0.68 / 0.96 s) but the crossfade ghosting is still there.

### combat — 9.2

Chief: accepted at 9.2. No combat file changed in c69de96a (git diff 8aee1e69..c69de96a and ef3f6bbf..c69de96a empty for src/battle, src/data, tactics, BattlePresenter*, src/story, research); the 10 single-link FFX real-key logs of this round replay event for event through the pure engine; PR-0308 (major) is re-confirmed by real keys on this build (gap pass, Ch II Dragon Fang shows 7 chips, correctInputs 7) and by the confirmer (overdrive.ts:313-316 hard-codes inputs 7 and zonePercent 22). Held, not raised: nothing fixed in combat since round 19.

[combat + encounter auditor, deep round 19b, PRODUCTION CANDIDATE main c69de96a from D:/pyrefly-rel26c, not deployed, deployment NOT APPLICABLE. No browser opened, no dev or preview server started by me (only vitest runs, all exited; Get-NetTCPConnection on 5170-5990 shows no listener, only the OS's 5357).]

WHAT CHANGED IN COMBAT: nothing. git diff is empty for src/battle, src/data, src/engine/tactics, src/engine/BattlePresenter*, src/story and research, both against live ef3f6bbf and against round 19's candidate 8aee1e69. The five r36fix changes (PR-0307 Yunalesca off the colossus list, PR-0312 HUD cards with a menu up, PR-0310 masters fail closed, PR-0309 dressphere shot clear of HP bars, PR-0311 no close-up on a placeholder dressphere) touch only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts. I read the diffs: actionFade.ts only gates its own card fade on commandMenuUp() (DOM read), it does not touch ATB state, command availability or the presenter queue; heldShots/masters only choose camera poses. Every changed game-data value audited: there are none (no data file changed since live), so the data audit reduces to re-running the dependent probes on this candidate.

RE-RUN ON THIS CANDIDATE (not reused): od-rows-probe, od-params-probe, link3-rows, sin-fins-advisor and sinprobe outputs are byte-identical to round 19 (diff, build string aside): Overdrive fail/immune/finisher rows, timers (Tornado 3000, others 4000), failed-Overdrive bonus 0, Blitz Ace finisher on success only all still match research/ffx-combat-core 5.3, 5.5 and the input-rules note.

CHK-023 FIDELITY: I replayed the 10 single-link FFX real-key command streams of THIS round's capture (critic/rounds/round-19b/evidence/*/battle-log.json) through the pure engine at the recorded seed with the chapter's own setup: Ch I win (73 turns), Ch I loss (3), Ch I phone (9, defeat), II (120), VI (52), VIII (78), IX (17), X (45), XII (119), XVIII (65, defeat). All 10 are event-for-event identical to the live log, outcome included (critic/rounds/round-19b/combat/ffx-replay.json). So the real runtime drives the engine exactly as the engine alone would; the presentation fixes do not perturb combat. Game separation (CHK-021): across all 23 capture logs, FFX logs carry 0 atb and 0 spherechange events, FFX-2 logs 0 ctb and 0 overdrive events.

INDEPENDENT SAMPLES of unchanged high-risk mechanics, written from research rather than from the engine tests (zz-ctb-sourced.test.ts, 3 tests pass): ICV_BASE equals the research 1.2 breakpoints at all 256 agilities, opening jitter bound 0..9 and 0 at Agility 0; recoveryTicks is linear in rank, Haste floors (floor(n/2)) and Slow doubles at nine agilities x eight ranks; the MITIGATION integer chain equals an independent BigInt implementation of research 2.3 for every Defense 0..255.

UNIT SUITE: the 324-file combat/engine subset (the round 19 list of 318 plus the five r36fix and mix tests): 320 files passed, 3 skipped, 1 file with 1 failure: strategy-ffx2-bahamut 'heal-only route' timed out at the repo's 15 s test limit under a loaded machine (the test printed 1/30 wins, which meets its bar of 1). Re-run alone: 19/19 pass in 11.8 s (the case takes 10.8 s, so it sits 4 s under the limit; harness fragility, listed as a suggestion, not a combat defect). Totals 5,435 passed + the re-run, 31 skipped. Subset covers CTB ticks, locks and ranks, Haste and Slow, statuses including Zombie, Breaks, Overdrive modes, ATB speed, golden/Active/Wait, chains, spherechange, Steal.

REAL-KEY FFX-2 OUTCOMES (capture owner, run.json): Bahamut win at 2000x1012 (50 turns) and phone (47), loss path reaches defeat, Vegnagun/Shuyin 5 links won (159), Leblanc 3 links won (78; round 19 seed 1 stalled UNDECIDED, this one finished), Fallen Aeons 3 links (80), Ixion and Djose (47), Den of Woe 3 links won first attempt (51). PR-0312 evidence: with the command list up there were 0 faded card rows in Active (9 rows, 2 Bahamut actions) and Wait (13 rows), advisor/intent/cmd opacity 1.

CARRIED OPEN: PR-0308 (major, Bushido/Swordplay ignore the chosen Overdrive's sequence, zone and speed; params probe unchanged), PR-0269 (major, advisor line loses Ch XVII), PR-0273 (polish, disabled rows at Ch XVII link 3), PR-0217 (suggestion, Zombie kept across KO). Nothing was fixed since round 19 and nothing regressed, so the score holds at round 19's 9.2; the gains and the open input-fidelity major still roughly offset, and I state that as the reason, not as a reward or a penalty for this release's presentation work.

### encounter — 8.9

Chief: accepted at 8.9. The three-line bench is byte-identical to round 19 (53 rows); PR-0269 re-confirmed by the confirmer (XVII advisor chain 3/40). Trema 0 of 6 real-key attempts again (0 of 14 over two rounds), a harness and pace question (PR-0227), not a regression.

SEEDED THREE-LINE BENCH re-run on c69de96a (critic/rounds/round-19b/combat/ffx-three-line-r19.json): intended, advisor (v3 card, options {}) and mash lines, seeds 1-40 plus 40 large seeds, 9 FFX chapters plus the live seeds. The file is byte-identical to round 19's (all 53 rows), as it must be when the engine, data and tactics are unchanged, which independently confirms the candidate did not move any encounter rule. Highlights (wins / 40, intended | advisor): Flux 18 | 19 (mash 0), Yunalesca 40 | 38, Braska 39 | 39, Macalania 38 | 37, Evrae 40 | 40, Yojimbo 33 | 40, Natus 31 | 38, Omnis 27 | 24 (large40 23 | 18), Isaaru 40 | 40, Sin face 12 | 15 (large40 7 | 13). Mash loses 0 of 40 everywhere, so credibly wrong tactics lose and canonical tactics are not penalised. Chapter XVII advisor chain 3/40 (sin-fins-advisor-r19.json, identical).

REAL-KEY OUTCOMES this round (run.json, headless GPU, human-paced scripted keys): wins in I (73 turns), II (120), III (220, all 7 links), IV (50/47), V (159), VI (52), VIII (78), IX (17), X (45), XI (80), XII (119), XIV (32), XVI (47), plus Leblanc (78, 3 links) and Den of Woe (51, first attempt). Losses: Ch XIII Trema 0 of 6 attempts (seeds 1/1001/2001, 2/1002/2002 or 3/1003/2003 pattern; every loss at link 1, Oversoul Paragon, 77 to 102 turns); with round 19 that is 0 of 14, against a bench of 13-14 % at human pace (P of 0 in 14 is about 0.13, not significant). Ch XVII won link 1 and was defeated at link 2 on seeds 1 and 1001; Ch XVIII defeated on seeds 1 and 1001 (65 and 59 turns), same numbers as round 19 turn for turn. The capture harness enters no Overdrive input (Enter after 3 s), which understates human damage in the Sin races.

Measured gains carried from round 19 stand (Sin link-3 checkpoint, the race term lifting XVIII advisor from 10 to 15 of 40, fixed failed-Bushido semantics). Carried: PR-0279 (Sin difficulty, D-282 undecided), PR-0257 (Ch III 220 real-key turns, about 2.3x the sourced rows), PR-0280, PR-0306 (Den now 1 of 1, so the rate question is unchanged but not worsened), PR-0227 (Trema). No encounter data, AI, phase rule or party preset changed, so the category holds at round 19's 8.9.

### visual — 8.9

Chief: accepted at 8.9 (round 19: 8.7). The gain is for two closed majors measured on this build (PR-0307 at four aspects, PR-0309 in the captured cases); held under 9 by PR-0310 (three chapters, confirmed from the plate reports) and PR-0311 (placeholder on a pickable dressphere, CHK-012 FAIL), and by the narrower colossus delivery (two chapters instead of five).

[Visual and targets auditor, deep round 19b, PRODUCTION CANDIDATE main c69de96a, dist-gate in D:/pyrefly-rel26c, bundle assets/index-GO0eMOto.js. Not deployed, so the deployment verdict is NOT APPLICABLE. I opened no browser and started no server. Every judgment comes from the capture owner's round-19b evidence (829 index records, all mode gpu = PYREFLY_BROWSER=gpu headless Chromium, 788 harness-verified; sizes 1600x900, 2000x1012, 390x844 touch, plus 1920x1080, 2560x1440, 2560x1080 and 1280x720 for the framing gap runs). A listen check over 5400-5990 shows no listener, so nothing was left running.]

IDENTITY AND PROTECTED ART. dist-gate differs from round 19's candidate manifest (8aee1e69, 1,431 files) only in index.html and the bundle pair (index-DU_vcl-u.js/.map replaced by index-GO0eMOto.js/.map); every art, audio and font file is byte-identical to round 19. Approved 543/543 and judge-locked 48/48 byte-identical in dist-gate (visual/hashcheck.mjs, result in visual/hashcheck-candidate.json); node D:/Tools/pyrefly-lora/tools/verify-approved.mjs on the tree gives approved ok 543, mismatched 0, missing 0; judge-locked ok 48, mismatched 0, missing 0. The preview on 5950 started 02:59:43, seven seconds after the dist-gate build (02:59:36), and the first lane at 03:00, so the captures are of this bundle (the stale 'DU_vcl-u' text in cap/lanes.sh is only a comment). The 'live35' comparison frames were taken from https://baileypillon.github.io/pyrefly-reprise/ (run.json base), which is release 35, ef3f6bbf.

WHAT I RE-JUDGED (the fixes' footprint): PR-0307 Ch II at five aspects; PR-0310 rest gap for all seven colossus-list chapters; PR-0312 card fade and Natus Sensor card; PR-0309/0311 dressphere shot (Leblanc Rikku at 1280x720, 1600x900, 2000x1012; Yuna Gunner to Thief; Trema Yuna and Paine; Bahamut Yuna); Ch IV Bahamut at five aspects and 390x844; Ch X Natus, Ch III BFA, Ch VIII Evrae, Ch IX Yojimbo against live 35 at 1600x900; Ch I Flux and the phone first menus.

FINDINGS.
PR-0307 FIXED at four of five aspects: Yunalesca's dome fills the frame at 1600x900, 1920x1080, 2000x1012 and 2560x1440 (visual/sheet-yuna-aspects.jpg); mix report plate chosen = today = 0 at all four, class hero, no master. At 2560x1080 the plate shows dark side bands and a tilted edge (plate 0.154, equal to 'today'); I have no live-35 frame at that aspect, so parity with live is from the builder's measurement only (UNVERIFIED, see issue V19B-02). The Yunalesca regression against live 35 is gone.
PR-0309 FIXED in the cases captured: Leblanc Rikku to White Mage lands a 0.5-0.7 s shot at 1280x720 (100-703 ms), 1600x900 (199-703 ms) and 2000x1012 (385-751 ms) with the three enemy gauge rows and SCAN tags clear of every face, no head cut, and the changing girl as the focus (sc-rikku-ffx2-leblanc-1600x900-s1 f02-f06); Trema Yuna 1600x900 and 2000x1012 clean; Bahamut Yuna clean and gives way to Paine's menu (one frame of overlap at 984 ms). Cost: Trema Paine has no clean frame at 1600x900 or 2000x1012 (skipped 1), so the master holds and she gets no shot; the phone never gets one (sc 0).
PR-0311: the shot is no longer cut to the placeholder (Yuna Gunner to Thief: 'sc yuna skipped: placeholder art', master stays up), so the close-up of a mannequin is gone; but the translucent grey-violet mannequin with the 'Yuna Thief' label is still what the player sees for the rest of the fight (sheet-thief.jpg f02/f06/f16). The art gap itself is unchanged and stays open.
PR-0312 FIXED: Ch IV Bahamut 2000x1012, Active and Wait, two Bahamut actions each: card opacity 1 and 0 fade rows in 9 + 13 timeline samples and 77 + 117 during-enemy samples with the menu up (round 19: 9 and 14 fade rows, opacity 0). The Natus Sensor card covers 0 of Natus (Natus keeps today's rig).
PR-0310 only PARTLY addressed: Bahamut, Yojimbo and Natus keep a positive rest gap (1 to 19 px), but Yunalesca (-112 to -183 px at the five aspects), Braska's Final Aeon (-44 to -100) and Evrae (-284 to -454, party inside the silhouette) still overlap at rest, because the fix holds the colossus master and falls back to today's rig; the staging itself is untouched (gaps/plate/*.json). Same as live 35, not a regression.
COST OF 'FAIL CLOSED': Natus, BFA and Evrae now render exactly as live 35 (sheet-natus-evrae.jpg); the D-316 colossus presence that round 19 credited to Natus (about 470 px) is gone for them and Natus is about 160-190 px tall at 1600x900. Only Yojimbo (four aspects) and FFX-2 Bahamut (all five) keep a master. This is the safe answer and is not a defect against live, but it narrows what the release delivers.
DEFECTS RE-OBSERVED: Bahamut's head is still blown out by the lamp bloom (PR-0316); Bahamut at 390x844 has the head and top of the wings under the enemy-intent strip (new, V19B-03); the twirl crossfade shows a semi-transparent double of the neighbouring girl as well as the changer (Yuna at f04, V19B-04); the first-time Rikku coach card and its 'GAUGES RUNNING' tag cut Yuna's and Rikku's lower legs during the shot at 1600x900 (PR-0320); a KO'd Yuna lies behind the party status rows in Ch I (PR-0318).

CHK-013/014: facing, ground contact and the art's rendering are unchanged from round 19 and hold in every frame I read (party faces the enemies, contact rings under every actor, Seymour Flux, Yunalesca, BFA, Evrae, Natus, Yojimbo, Shiva, Ixion, Bahamut, Vegnagun parts, Leblanc Syndicate all on model, no monogram fallback in any chip I read).

SCORE. 8.9 against round 19's 8.7. Two of the four majors that sat on this category are closed (PR-0307 at the tested aspects, PR-0309 in the tested chapters) and nothing new at major was found; it stays below 9 because PR-0310 (three chapters) and PR-0311 (a placeholder on a pickable dressphere) are open majors and the colossus gain shrank from five chapters to two.

BAILEY'S FIVE SUB-SCORES (provisional, judged with motion; not part of the weighted score), against round 19 (8aee1e69): CHARACTER MODELS 7.9 (7.9): party and re-rolled art unchanged, the Thief placeholder and the crowding stay. ENEMY MODELS 7.5 (7.6): Natus, BFA and Evrae lose their colossus scale, Bahamut's head is still washed out, Flux's crown is still tight at the top. ANIMATION 6.9 (6.9): breathing, twirl keys, chain and Overdrive motion are in; crossfade ghosting is still there and the KO collapse was not captured. FIDELITY 8.1 (8.0): the Yunalesca void is gone; bloom on Bahamut's head and the 21:9 plate bands remain. CAMERA 7.7 (7.6): the plate regression and the dressphere framing defects are fixed and the held shots honour menus and REDUCE MOTION, but the colossus master now ships for two chapters and the dressphere shot is rarer and shorter (0.5-0.7 s, none for Trema Paine or on the phone).

### feel — 8.2

Chief: accepted at 8.2 (round 19: 8.1). +0.1 for the closed camera regression (Ch II) and the FFX-2 cards that stay readable while a menu is up; PR-0314 is STALLED (second consecutive review, attempts 2) and the new low-confidence twirl-start block (PR-0334) is a question for Bailey's eye.

[feel auditor, deep round 19b, PRODUCTION CANDIDATE main c69de96a (round 19's 8aee1e69 plus the r36fix HOLD fixes), built in D:/pyrefly-rel26c/dist-gate. Not deployed, so deployment is NOT APPLICABLE. I opened no browser and started no server. I read the capture owner's evidence in critic/rounds/round-19b/evidence (headless Playwright, PYREFLY_BROWSER=gpu; index.json has 829 records, all mode gpu, 788 harness-verified, 5 UNVERIFIED post-scene frames explained below, 36 unflagged). A check of the machine found no listener on ports 5400-5990. Scratch is in critic/rounds/round-19b/feel-narr/: scsum.cjs, dbox.cjs, pace.cjs, firstmenu.cjs, contact sheets and crops.]

SCORE AND BASELINE: round 19 (8aee1e69) gave feel 8.1. This build gets 8.2. The +0.1 is for two measured gains: the camera regression is closed, and the FFX-2 cards stay readable while the player is choosing. Nothing else moved, and I give no credit for the dressphere beat length.

WHAT CHANGED THAT FEEL CAN SEE (git diff 8aee1e69..c69de96a: eight files, all under src/engine/fx/mix and src/ui/ffx2/actionFade.ts; src/story, src/app and research are untouched):
(1) PR-0307 closed, FFX only (camera coherence). Ch II Yunalesca at 2000x1012 now frames as live 35: the dome fills the frame, the plate edge and void are gone (gaps/fm-yunalesca-2000x1012 against ...-live35, same composition). The entry dolly (yunalesca-win seq-transition-into-battle f02-f09) runs over the full plate with its foreground pillars. Plate coverage is 0 / today 0 at four aspects and 0.154 / 0.154 at 2560x1080, equal to live.
(2) PR-0312, FFX-2 cards, measured. Ch IV Bahamut at 2000x1012: with the command list up, 77 samples in Active and 117 in Wait, across Bahamut's Curse and Attack actions, show 0 samples with a fade and minimum card opacity 1. Round 19 saw opacity 0 for 0.55-0.6 s on every action. The enemy lunge, the 105 numeral and the slash stay readable beside the solid cards (gaps/actfade-*/seq). The opposite case was shown by the independent r36fix check (the fade still fires when no list is up).
(3) PR-0309 and PR-0311, dressphere shot (FFX-2 only). Rikku to White Mage at Leblanc, 1280x720 / 1600x900 / 2000x1012 plus reduce motion: shot 534 / 566 / 484 / 500 ms (scMs). The faces are clear of the enemy gauge rows and no head is cut by the top edge. Yuna to Thief: sc 0, skipped 1, 'sc yuna skipped: placeholder art'; the master holds and the twirl keys still play on it. The shot is closed on the phone (sc 0). No enemy action played inside any shot: enemyActionPlayedInsideShot is [] in every one of 20 changes, so PR-0313 did not recur (0 of 12 in round 19's gap pass, 0 of 20 here). Hand-back happens before the next girl's menu opens (the shot flips to master about a frame before menu:true; one 90 ms sample shows sc with the menu flag but the screenshot already shows no menu, so I treat it as sampling, not a defect). In Bahamut, Rikku's change while Yuna's menu was open plays in the master with no cut, as the D-316 gate says.
(4) Pacing is unchanged. Same seed and turn count, wall time per turn at the same viewport: Flux 6.22 to 6.37 s, Braska 6.58 to 6.75, Natus 4.47 to 4.52, Macalania 6.19 to 6.26, Isaaru 7.64 to 7.67, Omnis 6.34 to 6.47, Sin face 3.73 to 3.76. Those are +0.4 to +2.6 %, and the capture ran 4-5 lanes in parallel (lanes.log). Yunalesca is +6.9 % (5.22 to 5.58 s, median turn gap 4383 to 4633 ms); I could not establish a cause (the fix removes a camera, adds no beat), so it is carried as unmeasured under a single-lane retime, not as a defect. In-game time to first menu is equal or lower in 25 of 27 comparable runs (firstmenu.cjs), for example Flux 8.15 to 8.02 s, Natus 9.38 to 8.88 s, Yunalesca 9.28 to 8.95 s; Sin face is the exception (+0.17 s, within noise).
(5) Skip and pause are respected in this build too (every run.json: Esc on the pre-scene opens pause, one hold skips the scene).

LOSSES, COSTS AND STILL OPEN:
(a) PR-0314 stays open (second consecutive review, same severity; see issues): 9 of 9 shots that cut play 484-566 ms (against the design hold of 1.6 s), and the new strict gates make a shot rarer (none for Paine at Trema at two sizes, none for Yuna's Thief, none with a menu up, none on the phone). The twirl keys play on the master in those cases, so the moment is not lost, but the close-up beat is now a half-second flash on the occasions it exists.
(b) Natus, Braska's Final Aeon and Evrae now keep today's rig: they are live 35's composition again (no regression against live), with Natus small in a wide empty plate (seymour-natus-win seq-transition f03-f09; fm-seymour-natus-1600x900 equals ...-live35). D-316's colossus look therefore survives for Yojimbo and FFX-2 Bahamut only. The builder asks whether Natus should get its master back through card steering; that is Bailey's decision, not a defect.
(c) Carried and not improved: PR-0104 (Shell shows no name chip), PR-0061 (entry length), PR-0301 (FFX-2 seam hand-back), PR-0315 (twirl crossfade double image). The code that decides each is unchanged by the eight files, so round 19's measurements stand (see reused).
(d) New, low confidence, polish: at the start of a change the twirl-start key reads as a hard-edged white rectangle with pink dots across the girl (Rikku at Leblanc 2000x1012 f01 and 1600x900 f02; Paine's White Mage at Vegnagun f00), for about 100-200 ms. It may be the intended light column; if so its straight left, right and top edges are a rendering question for Bailey's eye (CHK-B2).
(e) Not measured, no credit: input latency, KO collapse in motion, the FFX Overdrive held shot on this exact build, breathing at a visible rate, the seam hand-back under the new masters, and Bailey's play verdict (CHK-B2).
(f) Cross-references, scored elsewhere: Yuna's Thief placeholder ghost stays in the master for the rest of the fight (PR-0311, visual); Ch IV Bahamut at 390x844 has the head under the enemy-intent strip (visual); the first-time coach card 'FADES ON ITS OWN' sits across the changing girl's feet during the shot (interface, pre-existing).

BAILEY'S FIVE SUB-SCORES (provisional, judged with motion; not in the weighted score). The two that are mine: animation 6.9 (held from round 19: the twirl keys, splash crops and KO collapse stay the gains; hit timing, pose ghosting and the PR-0315 double image were not re-measured, and this batch changed no animation) and camera 7.8 (round 19 feel pass 7.8, chief 7.6; up from the chief's 7.6 because PR-0307 is closed and every colossus now fails closed to the live composition, held below 8 because PR-0314 is open, the colossus master is gone from three chapters and the phone Bahamut head is clipped). Character models, enemy models and fidelity belong to the visual auditor; I do not restate them. Round 19 for comparison: characters 7.9, enemies 7.6, animation 6.9, fidelity 8.0, camera 7.6 (chief).

### narrative — 8.9

Chief: accepted at 8.9, held. src/story, src/app and research are untouched; 13 of 15 comparable dbox timelines byte-identical to round 19, the other two differ only in random banter.

[narrative auditor, deep round 19b, candidate c69de96a, not deployed. No browser opened, no server started.]

WHAT CHANGED: git diff 8aee1e69..c69de96a touches nothing in src/story, src/app or research (checked in D:/pyrefly-rel26c). The r36fix is camera, card-fade and dressphere-shot code only, so the story judgments of round 19 stand. I re-observed them rather than only reusing them. For 13 of the 15 comparable chapter runs the dboxTimeline (speaker, text, screen) is byte-identical between round 19 and 19b: Ch I, II, III, VII, VIII, IX, X, XII, XIV, IV, VI, XI and XVI. The other two differ only in random battle banter that depends on the battle's course: Vegnagun, where Shuyin's mid-fight line differs ('Stop singing. Stop singing.' against 'You fight like someone who still wants something.'), and Den of Woe, where this run is a different seed and link count from round 19's s3 run (seed 1, 51 turns, 26 lines against 32). The aftermath text is the same in both.

REACHABLE AFTERMATH BY REAL INPUT (CHK-022), this build: 15 chapters, results to scene to board to a reload that keeps the clear: I, II, III, IV (desktop 2000x1012 and 390x844 touch), V, VI, VII, VIII, IX, X, XI, XII, XIV, XV and XVI, in both games. In Ch IX, X, XII and XIV the authored aftermath plays before results (afterFight 'cutscene', then results, then chapter select) and the same text is in dboxTimeline (postLines 13, 5, 8, 7). In I, II, III, IV, V, VI, VII, VIII, XI, XV and XVI it plays after CONFIRM (33-after-confirm-scene). I viewed those frames. Ch VII shows Seymour kneeling on the plate under 'He went down on one knee. The hall was very quiet.' (PR-0244 stays closed). Ch II shows Yunalesca's 'There. Now no one can summon it.' on the live-composition dome. Ch I shows Seymour's 'You can't send what refuses to go.' Ch III shows Rikku's 'Is that it? Did we-'. The five '30-post-scene' records marked UNVERIFIED (screen=results) are the harness order that round 19 traced to results() coming first in the scripts (seymour-flux.ts:146-150); the scene follows CONFIRM and is captured. NOT reached: XIII Trema (defeat on seeds 1001, 1002 and 1003), XVII Sin fins (defeat, link 2) and XVIII Sin face (defeat). Their aftermath is reused from round 18b with a dependency argument and its reachability stays UNVERIFIED.

TONE: FFX is elegiac and short (Natus's narrated campsite 'We made camp under the trees...', Isaaru's 'No. Please. Keep that for the road ahead.'). FFX-2 is quick and warm (Rikku 'That's for robbing our airship!' through 'Keep it. It suits you.', Ch IV's 'No arguing! This is a Brother order!'). Ch IV's results are silent, per the writing-bible.

INTENTIONAL, NOT A DEFECT: Yunalesca's 'The statue's empty, you see. / Has been for ages. Nobody tells you that part.' has speaker '' because the script uses say('none', ...) for a disembodied voice (src/story/scripts/yunalesca.ts:90-91).

OPEN, UNCHANGED SCRIPTS (re-observed in the 19b timelines): PR-0255 (Tromell's five Ch VII lines at 388402-388551 ms still have no speaker), PR-0256 (Ch XVI whistles are '(Whistle)' captions with no mote shown in the frames), PR-0272 (Ch XVII cannon is a caption, 'The Fahrenheit's cannon tears the fin away.' at 679391 ms and 1774765 ms), and PR-0262 (the '...Okay. Next one.' results quip in I, II and VIII). PR-0254 (Ch VII Talk silent) was not re-probed here and is carried on the unchanged script. PR-0254 is still open and stalled.

The harness hold-skips each scene, so natural reading pace is unmeasured here (round 19's confirmer measured about 47 ms per character with no input). Bailey's story read (CHK-B3) is not recorded. Net: 8.9 held, no gain and no loss.

### audio — UNVERIFIED

Chief: UNVERIFIED, no number (RUBRIC section 6: Bailey's listening assessment is part of the category and none is recorded; CHK-B1). The technical half passes and no audio byte changed since live 35.

[Audio auditor, deep round 19b. Candidate main c69de96a, bundle index-GO0eMOto.js, built in D:/pyrefly-rel26c/dist-gate (index.html 2026-10-03 02:59, after the 02:50 commit). Not deployed. Live is release 35, ef3f6bbf.] I cannot hear and listened to nothing. I opened no browser and started no server. Everything below comes from offline decoding, the repo's audio tools, and the capture owner's runtime evidence (critic/rounds/round-19b/evidence, GPU mode, 24 chapter runs with an AudioManager log).

WHY NO SCORE: docs/audio/OWNER-VERDICT.md was last changed 2026-09-29 (5e5ef411) and is byte-identical in main and rel26c. None of its entries gives a number. The shipping music is v2 (D-302) and the SFX are v2 (D-303), both adopted on 'I'll go with all your recommendations', not scored by ear. D-300, D-305 and D-306 are likewise on-recommendation. D-307, D-308 and D-309 are ear questions still 'proposed' and unanswered (decisions.json, re-read this round). Under RUBRIC section 6 and CHK-B1 the category is UNVERIFIED: not averaged away, not zero.

WHAT CHANGED SINCE ROUND 19's CANDIDATE: no audio. `git diff 8aee1e69 c69de96a` touches nothing in public/audio, src/audio, tools/audio or docs/audio. The only src changes are src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts; none of those eight files contains the words audio, sfx or playSfx. decisions.json gains only D-335 (source maps), which is not audio. All 29 files in dist-gate/audio are sha256-identical to public/audio and to the live artifact ef3f6bbf (critic/artifacts/ef3f6bbf.json): 29 identical, 0 different. So round 19's technical measurements hold, and I re-ran them anyway.

TECHNICAL: PASS.
- `node tools/audio/qa.mjs --strict` (run in D:/pyrefly-rel26c) exits 0: 0 cue findings and 0 SFX findings. The 26 music cues measure -16.00 to -16.21 LUFS and -1.08 to -3.06 dBTP, 0 clipped samples, every loop seam and flux/tilt gate ok. The v1 sprite has 134 cues, peak -1.13 dBTP. The v2 sprite has 100 cues, peak -1.12 dBTP. Total shipped audio 88.49 MB of the 90 MB budget (D-306).
- Independent ffmpeg 9.0.1 decode of all 28 MP3s: 0 errors. ebur128 spot checks (title, chapter-select, pause, boss-yu-yevon, boss-shuyin, boss-ffx2-aeon, victory-ffx2): -15.8 to -16.0 LUFS, true peak -1.1 to -1.7. sprite-v2 -18.5 LUFS at -1.1.
- Stereo, 26 cues: L/R correlation 0.643 to 0.796, mono-sum loss -0.49 to -0.91 dB. No phase or hollowness signature (compare the 0.04 to 0.08 that PR-era Direction B showed).
- themes-audit: 0 chapters depart from the chapter cue map; the same 4 cues depart from the bible as in round 19 (scene-gagazet, scene-dreams-end, scene-farplane lack a tempo map, PR-0039; scene-macalania-temple has no row, PR-0260).

ROUTING (CHK-023), from 166 AudioManager samples in 24 runs: ready true and not muted in all 166; both sprites decoded in 166 of 166; the v2 sprite game is ffx in every FFX run and ffx2 in every FFX-2 run; volumes 0.8/0.7/0.7 and sfxMix {b, trim 1, bus 0.70} in all 166. 117 samples have music playing and all 117 come from 'prerendered' (none from the synth path), and each matches music.current. Every cue heard is the one the chapter's data and the THEMES.md row name: scene-gagazet then boss-seymour then victory-ffx (I, XIV via boss-yojimbo, IX, X natus/omnis), scene-zanarkand-dome and boss-yunalesca (II), scene-dreams-end, boss-jecht, boss-yu-yevon (III), scene-bevelle-underground and boss-ffx2-aeon (IV, VI, XVI), scene-farplane, boss-vegnagun, boss-shuyin (V, XI), scene-macalania-temple and boss-seymour-macalania (VII), scene-fahrenheit and boss-evrae (VIII, XVII, XVIII), boss-shuyin (XV). Omnis plays scene-dreams-end, as THEMES row XII says. Chain seams hold their cue at +0, +1.5 and +3 s: V seams 2-5, XI 2-3, XV 2-3, VI 2-3, IX 2-3, VIII 2-3, VII/III chains 3-7 where boss-jecht hands to boss-yu-yevon (no cue changed inside any seam window). Chapter III seam 2 is silent in all three samples, authored (jecht-falls and valefor-enters call music(null); PR-0129). Chapter I's first pre-scene sample is silent because the script opens music(null, 600) and scene-gagazet enters at line 105: authored. Results cues: victory-ffx after all 9 FFX wins and victory-ffx2 after all 5 FFX-2 wins (V, VI, XI, XV, XVI). Chapter IV's results are silent as authored; every loss has silent results because the map has no defeat cue. The 11,459 SFX log entries: 11,139 via v2, 296 via sprite, 24 via synth.
Network (network-and-console-summary.json, 77 runs incl. gap runs): 185 audio requests, 0 not found, 0 console errors. That file records URLs, not content types, so 'decodes' rests on spriteDecoded and prerendered source in the AudioManager samples plus the ffmpeg decode, not on a header check.

ONE FINDING (polish, carried from live, not introduced): in 24 of 24 runs sfxLog[0] is the title's press-start 'battle-start' via the procedural synth at t 0.16 to 0.38 s, before either sprite can decode (PR-0326, TitleScreen.ts:195). It is the only synth entry; the first sound of every session is the timbre Bailey rejected as 'arcade-y'.

SAVE, audio half of CHK-024: PASS. 24 of 24 cases have the mixer volumes equal to the stored settings. Fresh and release-33/34/35 written saves give 0.8/0.7/0.7 or the hand-made 0.55/0.4/0.5; fixtures 33, 34, 35 and 31a keep their own levels (31a's 0.2 SFX kept). Missing, truncated and not-JSON fall back to 0.8/0.7/0.7. The matrix reads 23 of 24 overall; the one failing case, fresh-profile, fails on whole-save creation diffs (version, chapters, unlocked, seenCoach), not on audio.

REUSED with a written dependency argument (labelled reused): the pause cue starting and handing back to the battle cue, and the title and chapter-select 'playing' samples, from round 18's gap pass (round-18/evidence/gaps/firstrun-seymour-flux-1600x900/run.json: title after first key, chapter-select on the board, pause while paused, boss-seymour after resume), already reused by round 19. Dependency: pause.mp3, title.mp3 and chapter-select.mp3 are byte-identical; src/ui/common/pauseMusic.ts is unchanged since 65152c1b; src/audio/AudioManager.ts changed once since then (dac3bff57, SFX v2) and that diff touches no music, duck, fade or track line; nothing under src/audio or src/app/screens changed between 8aee1e69 and c69de96a; no open related defect. This round's own runs did exercise Esc pause (pause screen text in run.json, MUSIC R1 row present) but took no AudioManager sample while paused, so the live-in-this-round half is a capture owed.

NOT VERIFIED THIS ROUND: Chapter XIII (Trema) phase 2. The three Trema runs are defeats with 0 seams (102+ turns, retry), so boss-ffx2-aeon as Trema's phase cue and victory-ffx2 were never reached; only the scene bed was heard at pre-scene and first menu. Same as round 19. Likewise Sin chapters XVII and XVIII are defeats on the capture, so victory-ffx there is unverified.

SERVERS: I started none. netstat shows no listener on ports 5400 to 5990.

Chief: UNVERIFIED, no number, per RUBRIC section 6 and CHK-B1: no numeric ear verdict exists for music v2 and SFX v2. Technical health and routing pass; no audio file or audio code changed against live or against round 19's candidate.

### interface — 8.5

Chief: accepted at 8.5, flat. PR-0312 closed (+) against the newly measured advisor-card squeeze under the colossus HUD layout (PR-0330, a polish regression against live 35 in Ch III, IX and IV) and the widened timed-input claim (PR-0324). The chief read tgt-ffx2-bahamut-1600x900-shell/target.png: the whole-party selection reads (TARGET All allies, ALL ALLIES tag, brackets, lit rows), but the Bahamut intent card stands over Rikku and Paine (PR-0249 re-observed).

Deep review 19b of main c69de96a (production candidate, dist-gate from D:/pyrefly-rel26c). I judged the capture owner's evidence in critic/rounds/round-19b/evidence (index.json 829 records, 24 chapter run.json files, gaps/*) and read round 19's evidence for what the r36fix commits cannot touch. Capture mode: headless Playwright PYREFLY_BROWSER=gpu by the capture owner at 1600x900, 2000x1012 and 390x844 touch, plus 1920x1080, 2560x1080 and 2560x1440 first-menu frames for six chapters. I opened no browser and started no server, so I have no port to close; netstat shows no listener in 5400-5990. Contrast figures are pixel estimates (99.5th-percentile glyph luminance against the 30th-percentile background, my script critic/rounds/round-19b/audit/zz-agg.tmp.cjs and round 19's zz-ifaudit-contrast.tmp.py).

FIXED, VERIFIED THIS ROUND:
- PR-0312 (FFX-2 Ch IV, the cards): with the command menu up, the advisor, guide and intent cards no longer fade. critic/rounds/round-19b/evidence/gaps/actfade-ffx2-bahamut-2000x1012-active and -wait: 0 fade rows in 9 and 13 timeline samples, card opacity 1 throughout two Bahamut actions in both ATB modes (round 19 candidate: 9 and 14 fade rows, opacity 0). Contrast in the same frame index: advisor meta 13.0:1 (live 35 14.5:1, round 19 candidate 1.2:1), intent hit chances 5.7:1 (live 5.5:1, round 19 1.5:1). The Natus half is also gone: the Sensor card sits on the floor, off Natus, at 1600x900 (seymour-natus-win/11-advisor.png; the advisor card moved from y 274 to y 174 and widened to 597 px). Not captured by the owner: the opposite case, no menu up (does the fade still fire), see capturesNeeded.

HOLDS (both games): all 24 chapter runs show 0 card-vs-command overlap at the first menu, advisor minimum 14.2 px effective on desktop (15 px phone), 0 clipped rows, 0 target mismatches, target cancel returns to the menu with 0 targets left, N hides the advisor, E and G toggle intent and guide, Esc and P open and close the pause and Esc resumes (every run). Advice names a legal enabled action with its submenu and cost ('Stamina Tonic -> the party IN ITEMS', 'Shell -> the party IN WHITE MAGIC 10 MP'). Intent separates certain from conditional ('SCRIPTED', 'Most likely 58%', 'DAMAGE - RANDOM TARGET ... Lands on one of these, picked when it acts', 'Spends the turn and does nothing', 'Deals no damage'). Developer-vocabulary sweep over 88,422 characters of captured player text: 0 hits (the six regex hits are DOM textContent concatenation, not rendered text).

WEAK OR NEW:
- R19B-IF-01 (polish, regression vs live, candidate-introduced, first measured here): under the colossus HUD layout the advisor card shrinks to a stub or a squeezed column. Ch III Braska's Final Aeon at 1600x900 and 2000x1012 (chip wraps to two lines, target wraps, NO MP, +MAX HP X2 and the threat line lost; live 35 full), Ch IX Yojimbo at 1600x900 and 2000x1012 (the NEXT BEST MOVE heading, GUIDE'S PICK, 2,810-3,175 and 5 HITS gone at first menu; live 35 full), FFX-2 Ch IV Bahamut at 1600x900 and 2000x1012 (100% TO HIT, + SHELL and the reason line gone; live 35 at 2000x1012 full). Fine at 1920x1080 and above for Bahamut, and for Flux, Yunalesca, Natus, Evrae at 1600x900. Round 19's candidate already had it (BFA frame identical) and did not call it; r36fix did not cause it, but Yojimbo at 2000x1012 is worse than 8aee1e69 (full card there). Graded polish, not major: the pick, target, submenu and item cost are still correct, nothing shown is wrong.
- R19B-IF-02 (polish, cross-ref visual): at 390x844 Ch IV Bahamut's head and neck are wholly under the BAHAMUT ACTS NEXT strip; identical in round 19, so not a r36fix effect. Live 35 phone frame not in evidence.
- PR-0324 widened: the advisor says 'Timed input' for Yuna's Grand Summon (Ch XIV Isaaru, isaaru-via-purifico-win run.json advisorText); the project's own timer for that minigame is 0 (not timed).
- PR-0251 family widened with numbers: smallest HUD text is 12.25 px at 1600x900 (11.68 px for the FFX-2 'White Magic' command-info label), 13.1-13.8 px at 2000x1012, 14 px from 1920x1080; live 35 reads 12.22 at 1600x900, so this is not a regression.
Carried and unchanged (code untouched since round 19): PR-0321, PR-0325, PR-0302 to PR-0305, PR-0286, PR-0291, PR-0288, PR-0246, PR-0237, PR-0249, PR-0252, PR-0276.
Score: flat at 8.5. PR-0312 closing is worth about +0.2; the newly measured advisor-card regression in three chapters at Bailey's two main sizes and the extended timed-input claim take it back. Not reaching 9 because of the long carried polish list and the floor under 14 px at 1600x900 and 2000x1012.

### onboarding — 8.6

Chief: accepted at 8.6, held. Nothing in this candidate touches options, coach, settings or text size; PR-0270 (major) and PR-0032 carried. Newcomer walkthrough simulated, not real.

Same evidence base as interface. NEWCOMER WALKTHROUGH: SIMULATED, not real. Every chapter run starts from a fresh profile and walks the visible flow with real keys (touch on the phone): Auron's briefing ('ENTER / ESC SKIP - 20 SECONDS, ONCE', 'D NEVER SHOW THIS AGAIN'; phone 'TAP SKIP', 'TAP HERE NEVER SHOW THIS AGAIN'), first-run guide step 1 'AURON - 1 OF 3' on the board, step 2 at prep ('Your party is ready.', prepEsc=party-prep in all 24 runs), the first-turn coach ('He moves after you. Not before. Use it.'). No human newcomer played this build.

What I saw freshly in 19b: pause Esc and OPTIONS tab at 1600x900, 2000x1012 and 390x844 (ten rows: MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE, REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP); the EYE CANDY page at 1600x900 (gaps/fm-seymour-flux-1600x900/21-eye-candy.png: '11 OF 11 ON', ALL ON, 12 rows each with a plain label, both-games note); REDUCE MOTION honoured in the dressphere shot (sc-rikku-ffx2-leblanc-1600x900-s1-rm run.json: twirl played 0, shot still cuts); the phone gate (shot stays master, twirl plays); X-2 BATTLE flipped by real input (ffx2-bahamut-lose/15-options-active.png); save matrix 23 of 24 with the 24th a harness expectation (fresh-profile unexpectedDiffs are version, chapters, unlocked, seenCoach, flags written to an empty store; settings, looks and parts are all as expected; same as round 19). Non-colour cues hold ('CHANGE CURSED', glyph status icons, written cures).

REUSED from round 19 (dependency argument in checks): the EYE CANDY page at the other sizes, REDUCE MOTION rows, upgrade ('upgraded-r35') matrices, TEXT SIZE at 1600 and 390. The whole of git diff 8aee1e69..c69de96a under src/ui, src/app and src/story is one file, src/ui/ffx2/actionFade.ts (card opacity while a menu is open); no options, pause, settings, save, coach or CSS file moved.

WEAK (all carried, none new): PR-0270 (major, FFX-2 battle HUD ignores TEXT SIZE; src/ui/common/hudTextSize.ts header still 'Game case: FFX only'), PR-0032 (no REDUCE FLASHES row and no key remapping; the OPTIONS frame in 19b shows neither; src/app/fxEnv.ts still reads a flag no row writes), PR-0289 (confirmed again: sin-fins-core-win/03-card.png says 'Start with the first one.' while Chapter XVII is selected and the coach card covers the Chapter VII-XII rows), PR-0322 and PR-0323 (EYE CANDY copy, not re-observed), PR-0321 (phone pause at 12 px, not re-measured).
Score flat at 8.6: nothing in this candidate touches the area; the options page and briefing remain strong, held back by PR-0270, PR-0032 and the unverified gamepad, remap and text-size checks of the new page.

### prep — 9.1

Chief: accepted at 9.1, held. Rewards re-checked against research; retry 7.3-8.1 s; 16 victory runs keep the clear through a real reload.

Prep and delivery auditor, round 19b deep review of production candidate main c69de96a (D:/pyrefly-rel26c/dist-gate, bundle index-GO0eMOto.js). I opened no browser and started no server. I worked from critic/rounds/round-19b/evidence: index.json, which is a flat array of 829 captures all with mode gpu, 24 route run.json files, the save-matrix and the logs. Everything is headless Chromium from node with PYREFLY_BROWSER=gpu, run by the capture owner. I also ran 43 vitest files on c69de96a: 806 of 806 passed (prep-delivery/vitest-prep-delivery.txt).

PREP AGENCY. All 18 board chapters reached party prep by real keys (24 route runs at 1600x900, 2000x1012 and 390x844). Esc on prep still reads party-prep on a fresh profile. That is Auron's guided first run (step 2 ends the guide and keeps prep), same as round 19 and not a broken back key. Prep shows objectives and a tip (Flux, 'Bio him turn one...'). FFX-2 dressphere change was played by real input in the sc-* gap runs (Leblanc Rikku, Trema Yuna and Paine) and the Den of Woe, Fallen Aeons and Trema results rows show the changed outfits. The prep, results, checkpoint and flow code is byte-identical between 8aee1e69 and c69de96a (git diff --stat src/app src/ui/common is empty). The five release-36 HOLD fixes live only in fx/mix and actionFade. Prep screens are therefore unchanged against round 19.

RESULTS AND REWARDS (sourced). The panels match round 19 and the research docs. Spot checks this round:
- Yunalesca AP 14,000, GIL 9,000, Lv. 3 Key Sphere (ffx-yunalesca.md rewards table).
- Evrae AP 5,400 (ffx-evrae-airship.md).
- Ixion EXP 2,600, AP 15, GIL 1,800, Soul of Thamasa (ffx2-ixion-djose.md, 6 sources).
- Bahamut EXP 1,300, GIL 1,000 (ffx2-bahamut.md).
- Leblanc EXP 1,640, AP 14, GIL 1,590 equals the three-act sum of the per-enemy rows (Act I 260/350, Act II 480/460, Act III 900/780 against research section 6.3 and G9).
The other rows are the same as round 19: Flux AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere; Anima OVERKILL x1, AP 6,330, GIL 8,600, Ability Sphere x3; Natus AP 6,300, GIL 3,500; Omnis AP 24,000, GIL 12,000; Isaaru 5,000 AP to Yuna; Yojimbo and BFA AP 0 and GIL 0 (sourced); Vegnagun EXP 42,400, AP 120, GIL 18,300; Den of Woe EXP 4,200, GIL 35,200. The 'no full turn taken, no AP' rule still shows (Natus Kimahri, Omnis Tidus). Defeat cards show TURNS, ATTEMPTS and BEST, and ATTEMPTS counts across RETRY (Trema ATTEMPTS 2 with TURNS 291, 279 and 238; Sin ATTEMPTS 2).

RETRY. 13 retries (2 per run for Trema x3, Sin XVII and Sin XVIII; 1 each for Flux 2000x1012, Flux phone and Bahamut). Every one went defeat, results, RETRY, prep, new battle with a +1000 reseed. End of fight to the retried battle took 7.3 to 8.1 s (mean 7.5 s). The one 8.1 s is Flux at 2000x1012. Round 19 measured 7.2 to 7.5 s, so retry speed is steady; the 8.1 s is not an issue by itself. Phone retry used Enter on a touch context (see delivery).

PROGRESS. All 16 victory runs (15 chapters) keep the clear through a real reload (boardAfterReload.cleared). The board has 18 tiles throughout. The r31a fixture shows two clears with best times on the board after boot.

AGAINST (all carried, none new):
- PR-0258 (polish): overkill drop quantity. Not re-observed.
- PR-0295 (polish): phone prep tabs STATS, EQUIPMENT, ITEMS and OVERDRIVE letterboxed. Not re-captured; the code is unchanged.
- The Sphere Grid interaction, its F6 key, pad and phone routes (PR-0292 fix d112c8e), and the Equipment, Items and Overdrive prep tabs were not captured on this candidate. They are not covered by the ef3f6bbf focused review either (its notTested list names F6). They get no credit and are in capturesNeeded.
- Trema, Sin XVII and Sin XVIII were still not won (0 of 6 Trema attempts this round, on seeds 1, 1001, 1002, 1003 and their reseeds). That belongs to encounter and combat (PR-0227, PR-0269) and is cross-referenced here only for CHK-022.

GAIN FOR PREP: none this round beyond round 19. Leblanc's win and results are now verified (round 19's run stalled), which adds a sourced row but does not move the category.

Score 9.1, equal to round 19 and not compared with rubric v1 rounds.

### delivery — 8.5

Chief: accepted at 8.5, held and provisional on performance: identity, decode (1,431 files, problems []), 3,317 requests with 0 errors and the 24-case save matrix are clean; no single-lane frame-time or load measurement exists for this build (PR-0259, PR-0240), three win paths stay unproven (CHK-022), and no non-Chromium browser or real device was run.

PROVISIONAL: frame time, load time and every non-Chromium browser or device get no credit this round, and the mandatory single-lane measurement stays owed (PR-0259, PR-0240). Same position as round 19.

CANDIDATE IDENTITY (mine). In D:/pyrefly-rel26c at HEAD c69de96a3bfa, node tools/artifact-manifest.mjs build --dir dist-gate gives:
- 1,431 files, 798,872,755 bytes (761.9 MiB), under the 800,000,000-byte line by 1,127,245 bytes;
- artifactHash 37273cfee71633f8c077b288adc56ae1f84b96149f2b85cd3500a5553eecaaaa;
- decodeChecked true, audioUnverified 0, problems [] (flat-colour detection included);
- file: critic/rounds/round-19b/prep-delivery/artifact-manifest-dist-gate.json.
The worktree is clean apart from the untracked dist-gate. dist-gate/index.html was built at 02:59 after the 02:50 commit. The capture owner's matrix and every route run name bundle index-GO0eMOto.js, so every capture ran on this exact bundle.
Against live r35 (critic/artifacts/ef3f6bbf.json) there are 163 added, 4 removed and 85 changed files (prep-delivery/diff-vs-live-ef3f6bbf.txt), the same counts as round 19. Against round 19's candidate 8aee1e69 the only differences are the JS bundle and map, the CSS names and index.html: 0 art, 0 audio and 0 font bytes differ (prep-delivery/diff-vs-r19-8aee1e69.txt). The shipped media is therefore byte-identical to what round 19 decode-checked, and I re-ran the full decode check anyway.

FLOWS (CHK-022). 24 route runs made 3,317 requests (185 audio, 3,124 art): 0 console errors, 0 responses >= 400, 0 images served as text/html. All 3,317 media references resolve to paths in the manifest.
- Won by real keys through results, CONFIRM, scene, board and a reload that keeps the clear: 15 of 18 chapters. FFX: I, II, III, VII, VIII, IX, X, XII, XIV. FFX-2: IV (desktop and 390x844), V, VI, XI, XV, XVI.
- Not won: XIII Trema (0 of 6), XVII Sin Fins and Core (defeated in link 2 on seeds 1 and 1001), XVIII Sin Face (defeated on seeds 1 and 1001). Loss and RETRY are proven for all three, and for Flux (2000x1012 and phone) and Bahamut. Their win aftermath is UNVERIFIED on this candidate, as in rounds 17-19.
- Flux on the phone: the route's win attempt was defeated and RETRY reached battle, so the phone Flux win path is not shown; the phone Bahamut win is.
- Leblanc seed 1 finished this round (round 19's stalled).
- Five 30-post-scene frames (Flux, Yunalesca, Anima, Evrae, Leblanc) are stamped UNVERIFIED by the harness because results comes before the scene in its order. The scene after CONFIRM was shown for those chapters.

SAVE (CHK-024; the plan lists SaveData.ts and the save-data class, so deep before deploy). save-matrix19.mjs, run 07:02 to 07:04 UTC:
- Phase A: the r33, r34 and r35 artifacts themselves (bundles DCYkAkI-, cJFxGdIo, DiuZMSBm) booted and wrote four saves each: fresh, all looks on, LIGHT+LIVING off, SPECTACLE off with reduce motion. 12 of 12 booted to the board with 0 errors.
- Phase B: this candidate booted those 12 written saves, the four fixtures (r31a, r33, r34, r35) and 8 edge cases (parts stored false under a look that is on; parts stored true under a look that is off; non-boolean parts; non-boolean looks; settings missing; fresh; truncated; not JSON). All reached the board with 0 errors.
- The harness says 23 of 24. The single 'fail' is fresh-profile, and it is the harness's own expectation: expected('{}') flags the normal default save (version, chapters, unlocked, seenCoach [briefing], flags) as unexpected. That case's looks, parts, reload, volumes and errors are all correct, so the re-read result is 24 of 24. Same as round 19.
- The D-317 rule holds in every case: a stored part boolean is kept; a missing or non-boolean part takes its look's value; looks coerce to on.
- Clears are kept: the r31a fixture shows I and XVI cleared with best times on the board; the settings-missing case keeps four clears.
- Settings are applied, not only stored (CHK-023): mixer volumes equal the save (0.8/0.7/0.7 default, 0.9/0.5/0.2 for r31a, 0.7/0.3/0.5 for r35); html textSize 130 and data-reduceMotion follow the fixtures. The reload is identical (sameStored true in all 24).
- Truncated and not-JSON storage boot to the board on a default save without an error. There is no mid-fight save, and reload during prep, pause or battle was not exercised by this matrix.
- There is no reset or erase flow in the game, so that part of CHK-024 is NOT APPLICABLE.
- Reused from round 19: EYE CANDY page persistence through a reload (8 runs, both games, three sizes). The 19b capture has no ecpage runs. The src/app, src/ui/common and pause-eye-candy files are identical between the two candidates, so the argument holds.
- Unit tests: save-fx-parts, save-fx-looks, save-comfort-migration, save-upgrade-fixture, save-two-tabs and the other save-* files pass (806 of 806).

MEDIA (CHK-019): PASS on the decode-checked manifest. SHIPPING REFERENCES (CHK-018): PASS. The variant-path grep finds only the doc comment in titleMarkup.ts:11, and the 3,317 media references all resolve in the manifest.

WHAT THE RELEASE-36 FIXES TOUCH. PR-0310's fail-closed guard and PR-0307's plate guard sit in fx/mix. The colossus chapters (II, III, VIII, IX, X and IV) completed through their real flows with 0 console errors, so no throw or hang from the fail-closed paths was seen. No per-frame cost for the new plate and clearance code was measured.

NO CREDIT, UNVERIFIED:
- Frame time. The route lanes ran 3 to 6 at a time on one host (logs/lanes.log), and the gap pass ran at 03:21 EDT beside lanes A-D. The only timing in the evidence is one keydown to paint series (10 presses, 17.4 to 26.3 ms, FFX-2 Bahamut 1600x900), taken on that contended host, so it is not creditable.
- Load time and the cold 10 Mbit entry. Round 18b's 52.0 s was measured on a 577 MB build; this build is 799 MB (+221 MB of art), so that figure is stale.
- Cold-cache first dressphere change (about 2 MB of twirl keys).
- Firefox, WebKit, Edge, a real phone and a controller: never run.
- Network and console were logged only for the 24 route runs. The 53 gap-pass sessions logged none (they record 0 requests), and the save matrix logs its own error count of 0.
- Touch: the phone runs proved battle taps only. The Bahamut run has 136 taps and 68 keyboard fallbacks; Flux has 31 taps and 38 fallbacks. START BATTLE, CONFIRM, RETRY, chapter select and prep were reached by keyboard in the touch context.

HEADROOM. 1.13 MB under the 800 MB line (0.14 %), while about 33 MB of adopted art waits (D-332). The shipped source maps (index 17.1 MB, two workers 5.7 MB, 22.8 MB total) sit inside the line (PR-0328, a proposal that needs Bailey's yes).

SERVERS. I started none. Get-NetTCPConnection shows no listener on 5400-5990 now (checked 04:57 EDT).

Score 8.5, equal to round 19. The save class, identity, decode and flows are clean and the ship-relevant fixes caused no new defect in them, but the perf measurement and three win paths are owed again. Not compared with rubric v1 rounds.

## Target gate

Required 87, matched 70, failing 0, unverified 17, waiting on a decision 6. Visual auditor's tally against docs/target/targets.json at sha256 650de885 (unchanged since round 19). Round 19's one failing tile, scenes-ch2-zanarkand, now matches (PR-0307 fixed). 17 unverified: fight-targeting-s1-ch1 and s1-ch4 (the gap pass captured both states on c69de96a and the chief read the frames: the selection reads, but no end-state-board composite against the tiles was made, so they stay unverified), picks-status-o3-ffx (the gap pass shows the ZOMBIE plate at 1600x900, no composite) and picks-status-o3-ffx-phone (no Zombie ally on the touch run), and 13 carried from round 19's classification. 6 wait on a decision. UNVERIFIED: 17 required tiles are not verified on this build; a deep review does not accept the milestone in any case.

## Checks

| Check | Result | Mandatory | Who | State | Reason / evidence |
|---|---|---|---|---|---|
| CHK-001 | FAIL | yes | audio | all 24 route runs; shipped audio files | Technical half passes (qa --strict exit 0, 28/28 decode, 29 files byte-identical to live 35). Step 3 fails on one cue: the title press-start battle-start plays via the procedural synth in 24 of 24 runs (PR-0326, pre-existing). Listening half is CHK-B1. Evidence: critic/rounds/round-19b/audio/qa-strict.txt; critic/rounds/round-19b/audio/ffmpeg-decode.json; critic/rounds/round-19b/audio/routing.json |
| CHK-002 | UNVERIFIED | yes | interface | pause plates | The painting-rect and currentSrc measure at 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160 was not run on c69de96a; screenshots at 1600x900, 2000x1012 and 390x844 show a full-bleed pause. PR-0293 (3840x2160) stays open, not re-measured; PauseScreen files unchanged since round 19. |
| CHK-003 | FAIL | yes | interface | first menus at 1600x900, 2000x1012, 1920x1080, 2560x1080, 2560x1440, 390x844 | Smallest rendered HUD text 12.25 px at 1600x900 (11.68 px FFX-2 command-info label), 13.1-13.8 px at 2000x1012, under the 14 px floor; live 35 reads 12.22 at 1600x900, so carried (PR-0251), not a regression. Evidence: critic/rounds/round-19b/evidence/gaps/fm-*/run.json |
| CHK-004 | PASS | yes | interface | advisor text of all 24 runs | 0 target mismatches, 0 empty picks; the Grand Summon "Timed input" phrase is filed as PR-0324. Evidence: critic/rounds/round-19b/evidence/*/run.json (advisorText) |
| CHK-005 | PASS | yes | interface | damaged boards (Zombie ally) |  Evidence: critic/rounds/round-19b/evidence/gaps/zombie-seymour-flux-1600x900/ REUSED from critic/rounds/round-19/evidence/gaps/zombie-seymour-flux-1600x900, zombie-seymour-flux-390x844-touch — src/engine/tactics, src/battle and src/data unchanged 8aee1e69..c69de96a; the 19b gap pass re-observed the Zombie plate at 1600x900 on this build (the 390x844 touch run met no Zombie ally). |
| CHK-006 | UNVERIFIED | yes | interface | target cancel, N/E/G toggles, pause close (all runs); four-exit matrix per overlay | Target cancel leaves 0 targets in every FFX run and in FFX-2 Leblanc and Trema, toggles and pause close cleanly; but the four-exit matrix (confirm, cancel, turn passes, battle ends) is not captured for FFX-2 Ch IV, V, XI, XV, XVI, the Overdrive picker or the spherechange wheel. |
| CHK-007 | PASS | yes | interface | 88,422 characters of player text | 0 developer-vocabulary hits (six regex matches are DOM textContent joins, not rendered text). Evidence: critic/rounds/round-19b/evidence/*/run.json |
| CHK-008 | FAIL | yes | visual + interface + chief | dressphere shot (Leblanc, Trema, Bahamut), first menus at five aspects, 390x844 Ch IV, whole-party target Ch IV | The changed area passes (faces clear of the gauge rows in every dressphere frame read; Natus Sensor card covers 0 of Natus), but the check fails on the build: at 390x844 Bahamut's head is under the intent strip (PR-0333, regression unknown), the coach card covers the girls' legs during the shot (PR-0320), status rows over legs and a KO'd body (PR-0318), and the Bahamut intent card stands over Rikku and Paine at the whole-party target (PR-0249, re-observed by the chief). Evidence: critic/rounds/round-19b/visual/sheet-leb-rikku.jpg; critic/rounds/round-19b/visual/crop-bah-phone.png; critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png |
| CHK-009 | PASS | yes | interface | all 24 runs and every first-menu size | 0 clipped name labels. Evidence: critic/rounds/round-19b/evidence/*/run.json |
| CHK-010 | PASS | yes | interface + gap pass + chief | single target Ch I; whole party Ch I Hastega and Ch IV Shell at 1600x900 on c69de96a | Selection mode all with the three party ids and the ally accent in both games. The chief read both frames: TARGET label naming the party, ALL ALLIES tag, brackets on every member, lit party rows. The probe's "lit 0" field is not a visible miss. Evidence: critic/rounds/round-19b/evidence/seymour-flux-win/16-target-single.png; critic/rounds/round-19b/evidence/gaps/tgt-seymour-flux-1600x900-hastega/target.png; critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png |
| CHK-011 | PASS | yes | visual | first-menu framing of Natus, BFA, Evrae, Yojimbo, Vegnagun parts, Leblanc trio, Macalania |  Evidence: critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/targets/fight-targeting-s2-ch3.jpg |
| CHK-012 | FAIL | yes | visual | Ch VI Leblanc, Yuna Gunner to Thief, 1600x900, seed 1 | Yuna Thief renders as a translucent mannequin for the rest of the fight (PR-0311); the shot is now correctly not cut to it. Evidence: critic/rounds/round-19b/visual/sheet-thief.jpg; critic/rounds/round-19b/evidence/gaps/sc-yuna-ffx2-leblanc-1600x900-s1/run.json |
| CHK-013 | PASS | yes | visual | all chapters; protected art | Approved 543/543 and judge-locked 48/48 byte-identical in dist-gate; dist-gate differs from round 19's candidate only in index.html and the bundle. Evidence: critic/rounds/round-19b/visual/hashcheck-candidate.json |
| CHK-014 | PASS |  | visual | all chapters at rest and in sampled actions | Facing and contact only; interpenetration is PR-0310. Evidence: critic/rounds/round-19b/visual/sheet-flux-act.jpg; critic/rounds/round-19b/visual/sheet-yuna-aspects.jpg |
| CHK-015 | PASS | yes | capture owner | all 18 chapters, 24 route runs plus gap runs | Only labelled setup hook: setSeed(n) before the first key. Touch taps proven for battle commands only; START BATTLE, CONFIRM, RETRY and chapter select were reached by keyboard in the touch context (PR-0335). Evidence: critic/rounds/round-19b/evidence/*/run.json; critic/rounds/round-19b/evidence/logs/lanes.log |
| CHK-016 | PASS | yes | capture owner + auditors | 829 index records | 788 harness-verified; 5 post-scene frames stamped UNVERIFIED (harness order) and 36 save-matrix boards without a verified stamp; none of the 41 used as evidence. Evidence: critic/rounds/round-19b/evidence/index.json |
| CHK-017 | NOT APPLICABLE | yes | prep-delivery | candidate not deployed | c69de96a is a production candidate and is not deployed. Its manifest (artifactHash 37273cfe...) is in critic/rounds/round-19b/prep-delivery/artifact-manifest-dist-gate.json for the live review. |
| CHK-018 | PASS |  | prep-delivery | 3,317 media requests |  Evidence: critic/rounds/round-19b/evidence/network-and-console-summary.json; critic/rounds/round-19b/prep-delivery/artifact-manifest-dist-gate.json |
| CHK-019 | PASS | yes | prep-delivery + audio | 1,431 shipped files | decodeChecked true, audioUnverified 0, problems []; 28/28 MP3 decode in ffmpeg. Evidence: critic/rounds/round-19b/prep-delivery/artifact-manifest-dist-gate.json; critic/rounds/round-19b/audio/ffmpeg-decode.json |
| CHK-020 | FAIL | yes | interface + combat + prep-delivery | TEXT SIZE in the FFX-2 HUD; shared prep, results and save flow; PR-0310 fail-closed path | PR-0270 (major, carried): TEXT SIZE grows nothing in the FFX-2 battle HUD. The shared prep, results and save flow and the PR-0310 fail-closed path behave the same in both games. Evidence: src/ui/common/hudTextSize.ts ("Game case: FFX only"); critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch |
| CHK-021 | PASS | yes | combat + visual + feel | game case of each r36fix change; event census of 23 logs | PR-0307 FFX only (Ch II); PR-0309, PR-0311 and the card-fade half of PR-0312 FFX-2 only; PR-0310 and the plate gate both. FFX logs carry 0 atb and 0 spherechange events, FFX-2 logs 0 ctb and 0 overdrive. Evidence: critic/rounds/round-19b/combat/ffx-replay.json; critic/rounds/round-19b/evidence/*/battle-log.json; docs/handoff/r36fix.md |
| CHK-022 | UNVERIFIED | yes | capture owner + auditors + gap pass | 15 of 18 chapters won through results, CONFIRM, aftermath, board and reload; loss and RETRY in both games | Win path not reached for XIII Trema (0 of 6), XVII Sin fins and core (defeated at link 2 on seeds 1 and 1001; the gap pass Swordplay route hit its 81-turn cap) and XVIII Sin face (defeated on seeds 1 and 1001). Same pattern as rounds 17-19, harness route and pace, not a regression. The capture owner wrote FAIL; recorded UNVERIFIED because no product failure is shown. Evidence: critic/rounds/round-19b/evidence/*-win/run.json; critic/rounds/round-19b/evidence/gaps/swordplay-sin-fins-core-1600x900-s1/run.json |
| CHK-023 | FAIL | yes | combat + audio + feel + gap pass | FFX Overdrive inputs through the real HUD dispatch; spherechange to presenter; audio routing; card fade | The r36fix code is invoked through the real path (spherechange reaches the shot, the placeholder skip fires, the fade holds with a menu up; music routing right in 166 samples). Fails on the carried PR-0308: the engine's Bushido sequence and Swordplay tier never reach the overlays (Dragon Fang 7 chips by real keys on this build). Evidence: critic/rounds/round-19b/combat/od-params-probe.json; critic/rounds/round-19b/evidence/gaps/bushido-yunalesca-1600x900-s1/run.json; critic/rounds/round-19b/audio/routing.json; critic/rounds/round-19b/evidence/gaps/sc-rikku-ffx2-leblanc-1600x900-s1/run.json |
| CHK-024 | PASS | yes | capture owner + prep-delivery + audio | saves written by the r33, r34 and r35 artifacts, four fixtures, eight edge cases | 24 of 24 on re-read (the harness prints 23: its fresh-profile expectation is an empty object, PR-0336). Settings applied, not only stored; D-317 parts rule holds; clears kept; truncated and non-JSON storage boot to a default save. EYE CANDY page reload persistence reused from round 19 (src/app, src/ui/common and pause-eye-candy.css identical). Reload during prep, pause and battle not exercised. Evidence: critic/rounds/round-19b/evidence/save-matrix/save-matrix.json; critic/rounds/round-19b/evidence/logs/save-matrix.log; critic/rounds/round-19b/prep-delivery/vitest-prep-delivery.txt |
| CHK-B1 | UNVERIFIED | yes | audio | shipped music v2 and SFX v2 | Agents cannot hear. OWNER-VERDICT.md has no numeric verdict (last changed 2026-09-29); D-307 to D-309 unanswered. Owed to Bailey via docs/audio/audition.html. |
| CHK-B2 | UNVERIFIED |  | feel + interface | feel in play | No human play session on this build; the newcomer walkthrough was simulated. |
| CHK-B3 | UNVERIFIED |  | feel-narrative | taste, story read | Bailey's story read and taste judgments are owed; scripts unchanged. |

## Encounters (capture owner, real input)

| Chapter | Real flow complete | Outcome | Note |
|---|---|---|---|
| seymour-flux | yes | victory 1600x900 seed 1 (title, board, prep with Esc back, pre-scene with Esc and hold-skip, fight, results, CONFIRM, board, reload kept cleared). Loss and RETRY at 2000x1012 reached battle. Phone 390x844 touch: the route's win attempt was defeated and RETRY reached battle (same as round 19) | Pause (Esc), N, E, G, single target and cancel exercised. 30-post-scene recorded UNVERIFIED (results comes before the scene in the harness; same as round 19). |
| yunalesca | yes | victory 2000x1012 seed 1 | PR-0307 re-captured at five aspects: dome fills the frame at 1600x900, 1920x1080, 2000x1012, 2560x1440; 2560x1080 shows side bands (plate 0.154, equal to today's rig and to live 35). Post-scene shot UNVERIFIED as above. |
| braskas-final-aeon | yes | victory 1600x900 seed 1, seams 2-7 captured | Camera is live 35's composition. Party and boss overlap at rest (rest gap -44 to -100 px), staging not camera, PR-0310 carried. |
| seymour-anima-macalania | yes | victory 2000x1012 seed 1 | Post-scene shot UNVERIFIED (harness order). |
| evrae-airship | yes | victory 2000x1012 seed 1 | Composition matches live 35. Rest gap -284 to -454 px (party inside the silhouette), pre-existing staging. |
| yojimbo-cavern | yes | victory 1600x900 seed 1 | Colossus master kept; at 1600x900 the move-advisor card is squeezed (see issue). |
| seymour-natus | yes | victory 1600x900 seed 1 | Sensor card covers 0 of Natus at five aspects; composition equals live 35. |
| seymour-omnis | yes | victory 1600x900 seed 1 | Reuse not needed; recaptured. |
| isaaru-via-purifico | yes | victory 2000x1012 seed 1 |  |
| sin-fins-core | NO | link 1 won, defeated in link 2 on seeds 1 and 1001; RETRY reached battle | Win path UNVERIFIED, same pattern as rounds 17-19 (harness route, not new). |
| sin-face | NO | defeat on seeds 1 and 1001; RETRY reached battle | Win path UNVERIFIED, same as round 19. |
| ffx2-bahamut | yes | loss + RETRY at 1600x900; victory at 2000x1012; victory on phone 390x844 touch | Dressphere shot, spherechange, chain, Mega Flare card; PR-0312 re-measured: 0 fade rows with the menu up in Active and Wait. |
| ffx2-vegnagun-shuyin | yes | victory 1600x900 seed 1, seams 2-5 | 26.9 min route. |
| ffx2-leblanc | yes | victory 1600x900 seed 1 (round 19 seed 1 stalled UNDECIDED; this run finished) | Dressphere shot for Rikku lands 484-566 ms at 1280x720, 1600x900, 2000x1012 and REDUCE MOTION (500 ms); Yuna Gunner to Thief gets no shot (placeholder rule). |
| ffx2-fallen-aeons | yes | victory 2000x1012 seed 1 |  |
| ffx2-trema | NO | defeat on 3 seeds (1/1001, 2/1002, 3/1003), 6 attempts; RETRY reached battle every time | Loss and retry complete; win, post-battle scene and return after a win NOT reached (0 wins in 8 attempts in round 19 too). Win path UNVERIFIED. Yuna's dressphere shot lands (516 ms); Paine's gets none. |
| ffx2-den-of-woe | yes | victory 2000x1012 seed 1 |  |
| ffx2-ixion-djose | yes | victory 1600x900 seed 1 |  |

## Coverage matrix

**Tested on c69de96a**
- All 18 chapters by real keys from a fresh profile on c69de96a (24 route runs at 1600x900 / 2000x1012 / 390x844 touch, GPU headless): 15 won through results, CONFIRM, aftermath, board and reload; every loss to RETRY and a new battle (13 retries, 7.3-8.1 s)
- Ch II first menu at 1600x900, 1920x1080, 2000x1012, 2560x1440, 2560x1080 (and live 35 at 2000x1012); mix plate and gate reports for Ch I, II, III, VI, VIII, X, IV at five aspects; Natus, Bahamut, Evrae at five aspects; Yojimbo and BFA at two; four chapters at 390x844
- Dressphere shot: 20 changes at 1280x720, 1600x900, 2000x1012, REDUCE MOTION and the phone (Leblanc Rikku and Yuna, Trema Yuna and Paine, Bahamut Yuna), timed frames
- Card fade with a menu up: Ch IV Active and Wait, 2000x1012, two Bahamut actions each (timeline and during-enemy samples)
- Save-data class (CHK-024): 24 cases, saves written by the r33, r34 and r35 artifacts, four fixtures, eight edge cases; settings applied; 43 prep/delivery vitest files (806 tests)
- Combat: 10 FFX single-link real-key logs replayed event for event; od-rows, od-params, link3-rows, Sin advisor and three-line benches re-run byte-identical; sourced CTB/Haste/Slow/mitigation sample; 324-file combat subset
- Gap pass on c69de96a: real-key Bushido (Ch II, 7 chips), Swordplay mis-press and hit (Ch XVII), whole-party targeting in both games, Zombie plate at 1600x900, KO collapse timed in both games with and without REDUCE MOTION
- Audio: qa --strict, ffmpeg decode 28/28, 29 files identical to live 35, routing in 166 samples
- Delivery: artifact manifest (1,431 files, 798,872,755 bytes, decode-checked), diff vs live and vs round 19, 3,317 requests with 0 errors
- Protected art: approved 543/543 and judge-locked 48/48 byte-identical
- Chief: read the whole-party targeting frames of both games (CHK-010) and reconciled the five sub-scores

**Reused, with the dependency argument**
- Front-end target tiles, speaker portraits, EYE CANDY page tiles, pause sheets — from critic/rounds/round-19 (tile verdicts). Why: 19b frames pixel-identical to round 19 (mean absolute difference 0.00-0.54, visual/diff19.json); every art, audio and font byte identical; the diff touches only fx/mix and actionFade, none of which draws those screens.
- EYE CANDY page reload persistence (8 runs), REDUCE MOTION rows, TEXT SIZE captures, upgraded-r35 matrices — from critic/rounds/round-19.json. Why: src/app, src/ui/common and pause-eye-candy.css identical between 8aee1e69 and c69de96a; the 19b save matrix independently shows looks and parts surviving a reload.
- FFX-2 bench figures (Den 199/200, Fallen Aeons 174/200 and 164/200, Ixion 197/200, Leblanc 40/40, Trema link 1 26/200 and 28/200) — from critic/rounds/round-19. Why: The unit tests asserting them pass on c69de96a and the FFX-2 battle diff since round 19 is empty.
- Hit blackout (149 timed sequences), FFX Overdrive held shot and resolve, PR-0104, PR-0301, PR-0315 measurements — from critic/rounds/round-19/feel-narr/lum.json and the round 19 gap pass. Why: The od branch of heldShots.ts and the flash and blackout code are untouched; strict gating applies to sc only.
- Narrative audit (beats, voice, tone) — from critic/rounds/round-19.json. Why: src/story, src/app and research unchanged; 13 of 15 timelines byte-identical in 19b.
- Aftermath content of XIII, XVII and XVIII (judgment only, not reachability) — from round 18b gap pass. Why: src/story and cutscene screens unchanged; reachability stays UNVERIFIED under CHK-022.
- Zombie plate on the phone and the whole-party targeting tiles (CHK-005, CHK-010 reuse half) — from critic/rounds/round-19/evidence/gaps/zombie-*, tgt-*. Why: No change under src/engine/tactics, src/battle, src/data or targeting CSS; the 19b gap pass re-captured the desktop states.
- HUD floor at 1280x960 and 3840x2160 (PR-0251, PR-0293) — from round 19 gap pass. Why: HUD CSS and layout unchanged; colossus card placement at those shapes is NOT reused (requiredNotTested).
- Audio title, chapter-select and pause samples (CHK-023) — from round 18 gap pass via round 19. Why: No audio file or code changed since live 35.

**Not tested**
- Firefox, WebKit/Safari, Edge, a real phone, a real controller (no evidence path; RUBRIC section 10)
- Natural reading pace of the cutscenes (the route hold-skips)
- Input-to-response latency on c69de96a; the FFX-2 chain seam hand-back (PR-0301)
- The FFX Overdrive held shot for Kimahri on this build (Auron and Tidus timed in the gap pass)
- Sphere Grid F6 key, pad and phone routes; phone prep tabs (PR-0295)
- Cold-cache first dressphere change (PR-0327); the hidden FF7 fight (PR-0222, CHK-025)
- Live 35 frames at 2560x1080 (PR-0332) and at 390x844 Ch IV (PR-0333), and live 35 Ch III, IX, IV advisor cards at every size of PR-0330
- The opposite case of PR-0312 (no menu up, the fade still fires) by the critic; only the builder-side check shows it
- Ch VII Talk (PR-0254) re-probe

**Required by this review and not tested**
- CHK-002: painting-rect and currentSrc measure of the pause at 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160 on this build
- CHK-006: the four-exit overlay matrix for FFX-2 Ch IV, V, XI, XV, XVI, the Overdrive picker and the spherechange wheel
- CHK-017: live verification of the exact artifact (owed after any deploy)
- CHK-022: real-key win paths through results, CONFIRM, aftermath and board for XIII Trema, XVII Sin fins and core, XVIII Sin face
- CHK-024: reload during prep, pause and battle
- Performance: single-lane frame time, spikes, first-ability stalls and the cold 10 Mbit load on the 799 MB build (RUBRIC section 2; PR-0259, PR-0240)
- Phone touch on START BATTLE, CONFIRM, RETRY and chapter select (PR-0335)
- Human judgments CHK-B1 (listening), CHK-B2 (feel in play), CHK-B3 (story read)
- Target gate: 17 required tiles unverified on this build

## Ranked issue list (one root defect = one id)

### Critical (0)

None.

### Major (8)

#### PR-0148 — (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)

- **Category:** audio
- **Game:** both
- **Chapter and state:** all
- **Expected:** A numeric owner listening verdict recorded against the exact shipped cues (CHK-B1, RUBRIC section 6).
- **Observed:** OWNER-VERDICT.md last changed 2026-09-29 (5e5ef411), identical in main and rel26c; no entry gives a number out of 10. D-302, D-303 and D-306 adopted on recommendation; D-307, D-308 and D-309 proposed and unanswered. The latest ear words (2026-09-28) are about the Direction B sketches, not the shipped cues.
- **Repro and seed:** Read docs/audio/OWNER-VERDICT.md and decisions.json D-253, D-283 and D-292. No entry gives a score out of 10 for the R1 mix. No seed is needed.
- **Evidence:** docs/audio/OWNER-VERDICT.md; docs/target/decisions.json (D-302, D-303, D-306 to D-309); confirmer re-read (critic/rounds/round-19b/chief/inputs/confirm.json)
- **Confidence:** high
- **Requirement:** RUBRIC section 6 audio: 'Bailey's listening assessment'; CHK-B1
- **File and line (traced or suspected as stated):** docs/audio/OWNER-VERDICT.md; shipped public/audio/music/*.mp3 (R1)
- **Smallest fix:** Send Bailey docs/audio/audition.html with one question: a number out of 10 for the shipped battle, boss and scene cues, plus D-307 to D-309. Record the answer verbatim in OWNER-VERDICT.md.
- **Acceptance check:** OWNER-VERDICT.md has a dated verbatim numeric verdict naming the shipped cue set.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Confirmed by the confirmer. No audio byte changed since live 35.
- **Note:** Owner-reported. Open at major in rounds 15, 16 and 17: STALLED; the next audio batch starts with a method check (RUBRIC section 8).

#### PR-0308 — (carried, re-confirmed by real keys on c69de96a): Bushido and Swordplay ignore the Overdrive chosen; every Bushido shows one invented 7-input sequence and every Swordplay tier has the same zone and speed

- **Category:** combat
- **Game:** FFX only
- **Chapter and state:** every FFX chapter where Tidus or Auron fills the gauge (real-key Auron Overdrives in II, XII, XVIII; Tidus in XVII)
- **Expected:** Bushido shows each Overdrive's sourced sequence and length (research/ffx-combat-core.md section 5.5 [verified: 2 sources], International baseline): Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6 inputs, in different orders. Swordplay: a stronger Overdrive has a narrower zone and a faster marker (section 5.3 rule 2 [verified: 2 sources]; per-tier values are the tuning table's estimates).
- **Observed:** od-params-probe re-run on c69de96a is byte-identical to round 19: all four Bushido render up down left right cross circle triangle (7 inputs), only the timer differs (4000/4000/4000/3000); every Swordplay tier sends travelMs 1400 and zonePercent 22. Gap pass, real keys at 1600x900 seed 1, Ch II: Shooting Star and Dragon Fang both show 7 chips, correctInputs 7. Research 5.5 [verified: 2 sources] gives Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6 inputs; 5.3 rule 2 says a stronger Swordplay has a narrower zone and a faster marker.
- **Repro and seed:** Node: in D:/pyrefly-rel26c run vitest with critic/rounds/round-19/combat/vitest.critic.config.ts on od-params-probe.test.ts and read od-params-probe.json. In game: fresh profile, setSeed(1), real keys to Ch II; follow the advisor until Auron's gauge is full; Overdrive > Shooting Star, later Dragon Fang.
- **Evidence:** critic/rounds/round-19b/combat/od-params-probe.json; critic/rounds/round-19b/evidence/gaps/bushido-yunalesca-1600x900-s1/ (od1-chips.png, run.json)
- **Confidence:** high (real engine function, real overlay dispatch, real keys; confirmer re-ran the probe)
- **Requirement:** AGENTS.md rules 6 and 14; RUBRIC section 2 faithful Overdrives; CHK-023
- **File and line (traced or suspected as stated):** src/battle/ffx/overdrive.ts:313-316 (hard-codes inputs 7 and zonePercent 22; traced by the confirmer); src/ui/ffx/minigames/AuronSequence.ts:40-43; src/ui/ffx/minigames/TidusTiming.ts:25-26
- **Smallest fix:** Make minigameParams send what the overlays read: a per-record Bushido sequence from the 5.5 table (button order is marked conflicting: recommend GameFAQs' order, Bailey's stated preference, or settle it in the Steam copy, and say which), and Swordplay zone and speed from the 5.3 tier table. Add a unit test that feeds minigameParams into openMinigame.
- **Acceptance check:** od-params-probe shows four chip rows of length 8/7/7/6 matching 5.5 and four Swordplay zones that narrow while speed rises; a real-key Dragon Fang in Ch II shows 8 chips and resolves correctInputs 8.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged from:** combat-encounter PR-0308; gap pass "Ch II Auron Dragon Fang shows 7 chips"; confirm: confirmed

#### PR-0269 — (carried, STALLED): the advisor line loses Chapter XVII and is unreliable in Chapter XVIII

- **Category:** combat
- **Game:** FFX
- **Chapter and state:** XVII Sin Fins/Core and XVIII Sin Face; seeds 1 and 1001
- **Expected:** A card that follows sourced play wins a fair share, as the sensible line does (r17: XVIII 31%, XVII 25.5%).
- **Observed:** Real keys this round: XVII won link 1 and was defeated at link 2 on seeds 1 and 1001; XVIII defeated on seeds 1 and 1001 (65 and 59 turns), turn for turn as round 19. Bench re-run: XVII advisor chain 3/40 (confirmer re-ran it: 13 losses at link 2 to Ram, 7 at link 2 to Smack, 7 at link 3 to Sigh); XVIII advisor 15/40 (large40 13/40) against the intended line's 12/40 (7/40). A real-key Swordplay route in the gap pass hit its 81-turn cap at link 1. The harness enters no Overdrive input, which understates human damage.
- **Repro and seed:** Capture owner routes sin-face-win and sin-fins-core-win, 1600x900 and 2000x1012, seeds 1 and 1001.
- **Evidence:** critic/rounds/round-19b/combat/sin-fins-advisor-r19.json; critic/rounds/round-19b/combat/ffx-three-line-r19.json; critic/rounds/round-19b/evidence/sin-fins-core-win/run.json; critic/rounds/round-19b/evidence/sin-face-win/run.json; critic/rounds/round-19b/evidence/gaps/swordplay-sin-fins-core-1600x900-s1/
- **Confidence:** high
- **Requirement:** encounter: fair wins; interface: legal and useful advice
- **File and line (traced or suspected as stated):** the advisor (src/engine/tactics), unchanged since round 17
- **Smallest fix:** Give the Sin tactics the race priorities of the sensible line (damage over top-ups while the timer runs); never change boss numbers.
- **Acceptance check:** The advisor-card chain wins at least the sensible line's rate minus a small margin on the 200-seed Sin benches, and one real-key XVIII win on the card.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged from:** combat-encounter PR-0269; gap pass "No real-key win path reached for Sin XVII"; confirm: confirmed

#### PR-0310 — (carried; the fail-closed fix covers the colossus masters only): party and boss still interpenetrate at rest in Ch II, Ch III and Ch VIII

- **Category:** visual
- **Game:** FFX only (Ch II, III, VIII); the fail-closed gate itself is both
- **Chapter and state:** yunalesca, braskas-final-aeon, evrae-airship, first menu at rest
- **Expected:** At rest no party member stands inside a boss's painted silhouette (restGap >= 0).
- **Observed:** restGap at the first menu: Yunalesca -112 (1600x900), -135, -130, -183 (2560x1440); Braska's Final Aeon -44 to -100; Evrae -284 to -454 (Tidus inside the serpent's coil). The fix holds a master that would worsen the gap and falls back to today's rig, so these three chapters look as live 35 does. Bahamut, Yojimbo and Natus are now positive (1 to 19 px). Confirmer: Ch VIII a clear major, Ch III Auron and Tidus over BFA's legs, Ch II mild (Auron's shoulder over the train, reads as depth).
- **Repro and seed:** Seed 1, board card by arrows, prep confirmed, scene held-skip, first menu at 1600x900: Ch II, III, VIII; read __pyrefly.fx.mix.snapshot().framing.plate.restGap (node critic/rounds/round-19b/gapcap/plateprobe.mjs <chapter> <sizes>).
- **Evidence:** critic/rounds/round-19b/evidence/gaps/plate/yunalesca.json, braskas-final-aeon.json, evrae-airship.json; critic/rounds/round-19b/visual/sheet-yuna-aspects.jpg, sheet-natus-evrae.jpg
- **Confidence:** high
- **Requirement:** VP-1001-02; approved targeting B; masters.ts contract
- **File and line (traced or suspected as stated):** chapter staging (party and boss slots), suspected; plate.restGap in critic/rounds/round-19b/evidence/gaps/plate/*.json
- **Smallest fix:** Separate the party and boss slots in these three scenes (a staging change, not a camera change). It changes how approved scenes look, so it needs Bailey's yes (rule 9) first.
- **Acceptance check:** restGap >= 0 and no party member inside the boss silhouette at rest in Ch II, III and VIII at 1600x900, 2000x1012 and 2560x1440.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged from:** visual PR-0310; capture owner "PR-0310 residual" (polish); confirm: confirmed

#### PR-0311 — (carried, pre-existing art gap; the close-up half is fixed): Yuna's Thief dressphere is still a translucent mannequin placeholder for the rest of the fight

- **Category:** visual
- **Game:** FFX-2 only
- **Chapter and state:** VI ffx2-leblanc (Yuna's garment grid offers Thief)
- **Expected:** Painted Yuna-Thief art, or the change not offered until the art exists (no placeholders in shipped chapters).
- **Observed:** Ch VI, seed 1, Yuna Gunner to Thief: the dressphere shot is no longer cut to the mannequin (run.json lastTry "sc yuna skipped: placeholder art", master up), but the grey-violet mannequin labelled "Yuna Thief" stays on screen for the rest of the fight (f02, f06, f16).
- **Repro and seed:** setSeed(1), real keys to Ch VI; on Yuna's turn CHANGE, Right, Enter.
- **Evidence:** critic/rounds/round-19b/visual/sheet-thief.jpg; critic/rounds/round-19b/feel-narr/yuna-thief.jpg; critic/rounds/round-19b/evidence/gaps/sc-yuna-ffx2-leblanc-1600x900-s1/run.json
- **Confidence:** high
- **Requirement:** visual: character fidelity; CHK-012 (no accidental placeholders)
- **File and line (traced or suspected as stated):** art/characters/yuna-thief/ does not exist in dist-gate or public/art; live returns 404 for art/characters/yuna-thief/idle.png
- **Smallest fix:** Paint Yuna Thief through the end-state flow (rule 9: options, Bailey picks); until then, with Bailey's yes, take Thief out of the Ch VI grid or mark it unavailable.
- **Acceptance check:** Yuna's Thief form renders painted in battle at 1600x900 and the shot plays for it; or Thief is not offered.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Note:** The art was always missing (live also 404s); the candidate's dressphere shot makes it more visible. Disclosed.
- **Merged from:** visual PR-0311; feel cross-reference; confirm: confirmed

#### PR-0099 — (carried, STALLED): nine chapter rows in THEMES.md still play a stand-in cue

- **Category:** audio
- **Game:** both
- **Chapter and state:** VI, IX (scene), X, XI, XII, XIII, XIV, XV, XVI (field bed), XVII, XVIII
- **Expected:** D-209: every chapter gets its own composed cue, and a stand-in never counts as finished.
- **Observed:** Runtime this round: XV plays boss-shuyin and scene-bevelle-underground, XII boss-seymour with scene-dreams-end, XIV boss-yojimbo with scene-gagazet, XVII and XVIII boss-evrae and scene-fahrenheit, as the THEMES rows say; themes-audit: 0 chapters depart from the map, and rows VI, X, XII, XIII, XIV, XV, XVI, XVII, XVIII are marked borrowed/owed (confirmer: THEMES.md lines 645-668).
- **Repro and seed:** node tools/audio/themes-audit.mjs in D:/pyrefly-rel28 lists the '[borrowed; owed]' rows.
- **Evidence:** critic/rounds/round-19b/audio/themes-audit.txt; critic/rounds/round-19b/audio/routing.json
- **Confidence:** high
- **Requirement:** D-209; RUBRIC section 6 audio (thematic coherence)
- **File and line (traced or suspected as stated):** docs/audio/THEMES.md chapter cue map; src/data chapter music records
- **Smallest fix:** After D-292's newer-model test settles the render path, compose the owed cues in priority order (Sin assault and countdown, Omnis, Natus), each auditioned by Bailey before it ships.
- **Acceptance check:** themes-audit shows no '[borrowed]' for the chapters delivered, with an ear verdict recorded per cue.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Merged from:** audio PR-0099; confirm: confirmed

#### PR-0270 — (carried, code unchanged): TEXT SIZE grows nothing in the FFX-2 battle HUD

- **Category:** onboarding
- **Game:** FFX-2
- **Chapter and state:** IV Bahamut
- **Expected:** A2 says TEXT SIZE grows the battle HUD, dialogue and menus in both games; the FFX-2 pass waits on Bailey's D-220 Q4 pick.
- **Observed:** TEXT_SIZE_WIDE_SCOPE is still false (applyComfort.ts unchanged). The gap pass measured the FFX-2 desktop cure hint at 15.2 px at 100, 115 and 130 %, while the FFX one grows 15.2 -> 17.5 -> 19.7 px.
- **Repro and seed:** cap/comfort2.mjs ffx2-bahamut --size=1600x900 and --size=390x844 --phone (real keys: P, OPTIONS, TEXT SIZE Right).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-ffx2-bahamut-1600x900/run.json (reused); D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/run.json
- **Confidence:** high
- **Requirement:** A2 (D-285); docs/handoff/r31-access.md CHECK major 2 (disclosed)
- **File and line (traced or suspected as stated):** app/applyComfort.ts TEXT_SIZE_WIDE_SCOPE=false; text-size-wide.css not active
- **Smallest fix:** Before Q4: label the row honestly (for example "FFX battle HUD and dialogue"). After Bailey's Q4 pick: switch on TEXT_SIZE_WIDE_SCOPE with the FFX-2 intent-board solver slot.
- **Acceptance check:** After Q4: the FFX-2 command, party and advisor panels grow at 115/130 % on desktop and phone with no overlaps, measured by the comfort probe.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Carried from round 19 (ecfont-ffx2-bahamut-390x844-touch); src/ui/common/hudTextSize.ts still states "Game case: FFX only"; no FFX-2 text-size capture taken in 19b.
- **Merged from:** capture owner: TEXT SIZE does not grow the FFX-2 battle HUD; interface R17-ON-01

#### PR-0222 — (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

- **Category:** delivery
- **Game:** FF7 (hidden experiment)
- **Chapter and state:** FF7 Guard Scorpion (unlisted)
- **Expected:** No black hold: the swirl's last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- **Observed:** Not captured this round. No FF7 file and no shipped asset changed between 65152c1b and f302f163.
- **Repro and seed:** Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears. Press Esc and arrows during the hold.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/prep-delivery/diff-vs-r18-candidate-65152c1b.txt
- **Confidence:** low (unverified either way)
- **Requirement:** CHK-017 / CHK-025; RUBRIC §5
- **File and line (traced or suspected as stated):** secret door -> swirl -> field, cold cache
- **Smallest fix:** None proposed until it is observed.
- **Acceptance check:** No black sample longer than 1 s, the field arrives, and Esc and arrows during the hold neither lock nor start anything.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Not re-tested in 19b: the hidden FF7 experiment and its assets are unchanged (diff vs round 19 candidate: only the JS bundle, map and index.html). Stays major and unverified either way.

### Polish (72)

#### PR-0330 — (new, first measured here; regression against live 35): under the colossus HUD layout the move-advisor card shrinks to a stub or a squeezed column and drops its hit chance, effect, number and reason lines in Ch III, Ch IX and Ch IV

- **Category:** interface
- **Game:** both (FFX Ch III and IX; FFX-2 Ch IV)
- **Chapter and state:** braskas-final-aeon (1600x900 and 2000x1012), yojimbo-cavern (1600x900 and 2000x1012), ffx2-bahamut (1600x900 and 2000x1012); first menu
- **Expected:** The advisor card keeps its effect and number lines as on live 35 (RUBRIC section 2: the advisor says what an action costs and does), or a shorter card is an approved choice.
- **Observed:** Same seed and size, live 35 against c69de96a. Ch III BFA 1600x900: card 273x188, the NEXT BEST MOVE chip and the target wrap, "NO MP", "+ MAX HP X2" and "next, Left-Arm Strike hits for about 2,500" are gone (live 380x178, all shown); also short at 2000x1012. Ch IX Yojimbo 1600x900: 230x139, the heading, GUIDE'S PICK, "2,810-3,175" and "5 HITS" are gone, leaving "Kimahri / Fire Gem -> Yojimbo / IN ITEMS" (live 284x159 full); at 2000x1012 worse than round 19's candidate. FFX-2 Ch IV at 1600x900 and 2000x1012: "100% TO HIT", "+ SHELL" and the reason line gone (live 35 at 2000x1012 full); fine at 1920x1080 and above. Flux, Yunalesca, Natus and Evrae are full at 1600x900. The pick, target, submenu and cost stay correct.
- **Repro and seed:** vite preview of dist-gate c69de96a; node critic/rounds/round-19b/gapcap/cardrect.mjs braskas-final-aeon 1600x900 (and yojimbo-cavern, ffx2-bahamut; base live for comparison), seed 1, real keys to the first menu.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/fm-braskas-final-aeon-1600x900/10-first-menu.png vs ...-live35; critic/rounds/round-19b/cap/sheet-cand-vs-live.jpg; critic/rounds/round-19b/audit/sheet-adv-braska-yoj.jpg, sheet-adv-1600.jpg; run.json advisorText
- **Confidence:** high on the measurement (two independent reviewers), low on the cause
- **Requirement:** RUBRIC section 2 (advisor says what an action costs and does); RUBRIC section 3 (no regression against live); CHK-004
- **File and line (traced or suspected as stated):** advisor card fitting under the colossus clearance field (suspected; src/engine/fx/mix/hudPanels.ts or clearance.ts); not traced
- **Smallest fix:** Give the card its full variant whenever the colossus clearance would squeeze it: move the card (as already done for Natus) or let the compact variant keep chip, one-line target, cost and the effect line. Trace first.
- **Acceptance check:** cardrect.mjs shows the detail lines (NO MP / effect / numbers / hit chance) at 1600x900 and 2000x1012 for Ch III, IX and IV, as on live 35.
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature false
- **Note:** Polish, not major: nothing shown is wrong and the action is still legal and reachable; the lost lines are the useful detail. Introduced by release 36 (already present in round 19's candidate 8aee1e69, uncalled), not by the r36fix commits. A polish regression does not hold the build under RUBRIC section 3; it is disclosed and goes first into the next batch.

#### PR-0333 — (new): FFX-2 Bahamut at 390x844 has its head, neck and the top of its wings under the BAHAMUT ACTS NEXT intent strip

- **Category:** visual
- **Game:** FFX-2 only
- **Chapter and state:** ffx2-bahamut (Ch IV), 390x844 touch, first menu
- **Expected:** The boss's head is whole between the intent strip and the party.
- **Observed:** Only wings and tail show; identical in round 19's candidate (so not an r36fix effect). The independent r36fix check of 2026-10-03 says live 35 shows the head whole; no live-35 phone frame exists in the critic's evidence (the gap pass did not capture it).
- **Repro and seed:** Seed 1, Ch IV first menu at 390x844 touch.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/fm-ffx2-bahamut-390x844/10-first-menu.png; critic/rounds/round-19b/visual/crop-bah-phone.png; critic/rounds/round-19b/audit/phone-bah-r19-r19b.png
- **Confidence:** medium; regression against live unknown
- **Requirement:** CHK-008; RUBRIC section 5 (accidental crop damage)
- **File and line (traced or suspected as stated):** colossus master framing at the phone layout; the clearance field does not count the intent strip as a panel (suspected)
- **Smallest fix:** Count the intent strip in the clearance field on the phone, or fail the colossus master closed at 390 wide.
- **Acceptance check:** Bahamut's head fully below the intent strip at 390x844 on three first menus, compared with a live-35 frame at the same seed.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Note:** Polish: the boss stays identifiable and selectable (CHK-011 holds); unknown tags on a polish issue never hold the build.

#### PR-0314 — (carried, second consecutive review, STALLED, attempts 2): the FFX-2 DRESSPHERE SHOT plays as a half-second cut, never as its 1.6 s hold, and is rarer after the strict gates

- **Category:** feel
- **Game:** FFX-2 only
- **Chapter and state:** IV, VI, XIII, XVI
- **Expected:** When it fires, a held close shot of at least its 1.6 s minimum (D-316 spec), or no cut at all.
- **Observed:** c69de96a, real keys, seed 1: 9 shots, each held 484-566 ms (Leblanc Rikku 534/566/500 RM/484 ms at 1280x720/1600x900/RM/2000x1012; Bahamut Yuna 533; Trema Yuna 516 at both sizes). No shot: Paine at Trema at 1600x900 and 2000x1012 (no clean frame), Yuna's Thief (placeholder skip), Rikku in Bahamut while Yuna's menu was open, and the phone. The twirl keys still play on the master in each of those cases. No enemy action played inside any of 20 shots.
- **Repro and seed:** node critic/rounds/round-19/gapcap/sc.mjs <chapter> <size> 1
- **Evidence:** critic/rounds/round-19b/evidence/gaps/sc-*/run.json; critic/rounds/round-19b/feel-narr/leb-rikku.jpg, leb-rikku2k.jpg, bah-c0.jpg, scsum.cjs
- **Confidence:** medium
- **Requirement:** D-316 DRESSPHERE SHOT; feel
- **File and line (traced or suspected as stated):** src/engine/fx/mix/heldShots.ts (sc minimum hold 1.6 s vs menu-open hand-back)
- **Smallest fix:** Skip the cut unless it can hold its minimum (do not cut when the next girl's menu is due within 1.6 s), or stretch the spherechange beat; on no clean frame, consider the far-side swing or a small push-in (a design change: Bailey's yes). Say on the EYE CANDY page that the phone never plays it.
- **Acceptance check:** Over 12 desktop changes in both ATB modes, every shot that cuts holds at least 1.3 s, or none cuts (scMs in run.json).
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Repair attempts:** 2
- **Merged from:** feel PR-0314; visual PR-0314 (now rarer)

#### PR-0331 — (new, a question for Bailey): the fail-closed gates take the D-316 colossus master away from Natus, Braska's Final Aeon and Evrae; only Yojimbo and FFX-2 Bahamut keep it

- **Category:** visual
- **Game:** FFX only (Ch III, VIII, X)
- **Chapter and state:** seymour-natus, braskas-final-aeon, evrae-airship, 1600x900 to 2560x1440
- **Expected:** D-316 lists colossus presence for the big bosses.
- **Observed:** At all five aspects Natus, BFA and Evrae render exactly as live 35 (pixel-mean difference 10, 22, 17, mostly HUD text): Natus about 160-190 px tall at 1600x900 against about 470 px in round 19's candidate. Not worse than live; narrower than round 19 promised.
- **Repro and seed:** Seed 1, first menu of Ch X, III, VIII at 1600x900; compare with gaps/fm-*-live35.
- **Evidence:** critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/evidence/gaps/plate/seymour-natus.json
- **Confidence:** high
- **Requirement:** D-316 scope; RUBRIC visual and feel (boss presence)
- **File and line (traced or suspected as stated):** src/engine/fx/mix/framing.ts, plate.ts (gates)
- **Smallest fix:** Ask Bailey whether Natus should get its master back by steering the Sensor card off the boss (builder's proposal); list the three chapters as "today's framing" in the release notes.
- **Acceptance check:** Bailey's decision recorded; if steered, Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false

#### PR-0332 — (new, pre-existing): at 2560x1080 every measured chapter shows plate side bands; worst is Yunalesca (15.4 percent of the plate share, dark pillars and a tilted edge)

- **Category:** visual
- **Game:** both (FFX measured in 6 chapters; FFX-2 Bahamut 9.4 percent)
- **Chapter and state:** yunalesca, braskas-final-aeon, seymour-natus, yojimbo-cavern, evrae-airship, seymour-flux, ffx2-bahamut; 2560x1080 first menu
- **Expected:** The painted plate fills a 21:9 frame (platform goal 4:3 to 21:9), or the edge is dressed.
- **Observed:** plate share at 2560x1080, chosen = today: Yunalesca 0.154, BFA 0.103, Natus 0.094, Yojimbo 0.094, Evrae 0.085, Flux 0.034, Bahamut 0.094. No live-35 frame at this aspect; parity rests on the builder's chosen = today measurement.
- **Repro and seed:** Seed 1, Ch II first menu at 2560x1080; gapcap/plateprobe.mjs.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/fm-yunalesca-2560x1080/11-first-menu-N-G-hidden.png; critic/rounds/round-19b/evidence/gaps/plate/*.json
- **Confidence:** medium
- **Requirement:** RUBRIC section 2 platform goals; visual composition
- **File and line (traced or suspected as stated):** plate cover-fit for frames wider than 2:1 (suspected)
- **Smallest fix:** Cover-scale the plate for frames wider than 2:1 (crop top and bottom) or extend the edge with the existing fog; never repaint approved plates.
- **Acceptance check:** Plate share 0 at 2560x1080 in all seven chapters.
- **Tags:** introducedByCandidate false, regressionVsLive "unknown", inNewFeature false

#### PR-0315 — (carried, widened): the twirl crossfade double-exposes the neighbouring girl as well as the changer for about 0.2 s

- **Category:** feel
- **Game:** FFX-2 only
- **Chapter and state:** ffx2-fallen-aeons, ffx2-trema (seq-spherechange f01)
- **Expected:** Cuts on the beat or matched silhouettes between keys (as the 2026-10-01 visual pass recommended).
- **Observed:** Leblanc, Rikku to White Mage, 1600x900, f04 at 619 ms: Yuna, who is not changing, shows as two semi-transparent overlapping images while the camera blends in.
- **Repro and seed:** Candidate, seed 1, Ch XI or XIII, CHANGE a dressphere.
- **Evidence:** critic/rounds/round-19b/visual/crop-f04.jpg; critic/rounds/round-19b/evidence/gaps/sc-rikku-ffx2-leblanc-1600x900-s1/c0-seq/f04.jpg
- **Confidence:** medium
- **Requirement:** feel: smooth transitions; VP-1001-20
- **File and line (traced or suspected as stated):** src/engine/fx/mix/twirl.ts (key-to-key crossfade; suspected)
- **Smallest fix:** Hold neighbours on one plate through the shot blend; cut the keys on the beat or crossfade in 60 ms or less.
- **Acceptance check:** No frame of the 19-frame sequence shows two copies of any girl at partial opacity.
- **Merged from:** visual PR-0315 (widened); feel PR-0315

#### PR-0320 — (new): during the first CHANGE, the first-time Rikku coach line covers part of the dressphere close shot

- **Category:** visual
- **Game:** FFX-2 only
- **Chapter and state:** IV ffx2-bahamut, first CHANGE
- **Expected:** The held close shot reads cleanly.
- **Observed:** Re-observed: on a fresh profile the first-time coach card and its GAUGES RUNNING / FADES ON ITS OWN tag cover Yuna's and Rikku's lower legs in f03-f06 of the Leblanc shot at 1280x720 and 1600x900.
- **Repro and seed:** 2000x1012, seed 1, first girl's turn > CHANGE > Black Mage.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/sc-rikku-ffx2-leblanc-1600x900-s1/c0-seq/f04.jpg; critic/rounds/round-19b/feel-narr/leb-rikku2k.jpg
- **Confidence:** high
- **Requirement:** D-316 dressphere shot readability
- **Smallest fix:** Hold a first-time coach line until the shot cuts back.
- **Acceptance check:** Frame sequence of the first CHANGE shows no coach box inside the shot.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true

#### PR-0249 — (carried, re-observed by the chief): the FFX-2 intent card covers the girls at 1600x900; at the whole-party Shell target in Ch IV it stands over Rikku and Paine

- **Category:** interface
- **Game:** FFX-2
- **Chapter and state:** IV Bahamut
- **Expected:** No panel over a face or a weapon.
- **Observed:** tgt-ffx2-bahamut-1600x900-shell/target.png (c69de96a, seed 1, real keys): the BAHAMUT ACTS NEXT card (x about 490-865, y about 185-500) covers Rikku and Paine almost to the feet while the target brackets frame them; Yuna stays clear. Under the colossus master the girls stand further back than in round 18b's frame, so the overlap reads larger; whether it differs from live 35 at this state is not captured.
- **Repro and seed:** Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- **Evidence:** critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png
- **Confidence:** high for the observation; unknown against live
- **Requirement:** CHK-008
- **Smallest fix:** Add the projected party quads to the intent card's placement test while targeting.
- **Acceptance check:** Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Widened (merged R18b-VIS-01): in Ch IV at 1600x900 the default intent card also covers Rikku's head and Paine's head and torso while Yuna's WHITE MAGIC list is open, which hides Paine's Cursed darkening; the same with REDUCE MOTION on. Intent and camera code are unchanged in this diff.

#### PR-0316 — (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera

- **Category:** visual
- **Game:** FFX-2 only
- **Chapter and state:** IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012
- **Expected:** The boss's face reads clearly in his signature framing.
- **Observed:** Re-observed, not re-measured: Bahamut's head is a bright blob at 1600x900 and 2000x1012.
- **Repro and seed:** Candidate, seed 1, Ch IV, first menu.
- **Evidence:** critic/rounds/round-19b/visual/sheet-bahamut.jpg
- **Confidence:** medium
- **Requirement:** visual: recognisability, lighting
- **Smallest fix:** Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
- **Acceptance check:** Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.

#### PR-0318 — (R19-VIS-07 + FR-35-02 + gap-pass KO capture): party status rows overlap party legs and KO'd bodies; in Ch I at 1600x900 Yuna's KO collapse lands almost entirely behind the status panel

- **Category:** visual
- **Game:** both
- **Chapter and state:** I seymour-flux (KO Yuna, 1600x900 and 2000x1012), XVIII sin-face (Wakka), II yunalesca (Auron) mid-fight
- **Expected:** Party figures, standing or down, clear of the status rows except the declared command-stack overlap.
- **Observed:** Re-observed, not re-measured: in Ch I a collapsed Yuna lies almost entirely behind the party status rows at 1600x900.
- **Repro and seed:** setSeed(1), real keys to Ch I at 1600x900; Attack each turn until Lance of Atrophy KOs Yuna.
- **Evidence:** critic/rounds/round-19b/targets/picks-status-o3-ffx-plates.jpg
- **Confidence:** high
- **Requirement:** CHK-008; D-316 KO collapse
- **File and line (traced or suspected as stated):** src/engine/fx/mix/hudPanels.ts / clearance.ts (status-row box and the downed pose footprint not counted; suspected)
- **Smallest fix:** Add the status-row box and the downed pose's footprint to the HUD-free area the masters fit into.
- **Acceptance check:** CHK-008 matrix at 1600x900 and 2000x1012: party clear of the status rows; Yuna's KO pose >= 80 % clear of the panel.
- **Tags:** introducedByCandidate "unknown", regressionVsLive false, inNewFeature false
- **Merged from:** visual R19-VIS-07; gaps: Yuna's KO collapse lands behind the party status panel; FR-35-02 (ef3f6bbf focused)

#### PR-0334 — (new, low confidence): the twirl-start key can read as a hard-edged white rectangle across the changing girl for 100-200 ms

- **Category:** feel
- **Game:** FFX-2 only
- **Chapter and state:** ffx2-leblanc (Rikku), ffx2-vegnagun-shuyin (Paine)
- **Expected:** A soft light column or the painted key with feathered edges.
- **Observed:** A bright white block with pink dots and straight left, right and top edges stands over the girl at the start of a change (Rikku 2000x1012 f01, 1600x900 f02; Paine White Mage at Vegnagun f00). Yuna's White to Black Mage twirl in round 19 shows no such block.
- **Repro and seed:** Ch VI, 2000x1012, seed 1: Rikku CHANGE to White Mage; frames 1-2 of the sequence.
- **Evidence:** critic/rounds/round-19b/feel-narr/twirl-start-crop.jpg; critic/rounds/round-19b/evidence/gaps/sc-rikku-ffx2-leblanc-2000x1012-s1/c0-seq/f01.jpg
- **Confidence:** low: it may be the intended light-pillar painting, and approved art is protected
- **Requirement:** RUBRIC feel; CHK-013 (how approved art renders)
- **File and line (traced or suspected as stated):** twirl key rendering (alpha or edge feather), suspected
- **Smallest fix:** If unintended, check the key's alpha and edge feather; never replace the artwork.
- **Acceptance check:** Bailey's eye on a change in play (CHK-B2); the first three frames show no straight-edged block.
- **Tags:** introducedByCandidate "unknown", regressionVsLive false, inNewFeature true

#### PR-0324 — (carried, widened): the advisor calls Kimahri's Ronso Rage and Yuna's Grand Summon a "Timed input"; neither is timed

- **Category:** interface
- **Game:** FFX only
- **Chapter and state:** any chapter with Kimahri (seen in I)
- **Expected:** The project's own data: "No timed input; a picker only" (src/battle/common/types.ts:1457).
- **Observed:** isaaru-via-purifico-win run.json advisorText: "Yuna Grand Summon GUIDE'S PICK IN OVERDRIVE NO MP Timed input". advisor.ts adds "timed input" whenever def.minigame is set; overdrive.ts timerMsFor returns 0 for yuna-grand-summon. Round 19 filed only Ronso Rage.
- **Repro and seed:** Ch I seed 1, 1600x900: Kimahri with a full gauge > Overdrive; read the help slab.
- **Evidence:** critic/rounds/round-19b/evidence/isaaru-via-purifico-win/run.json
- **Confidence:** high
- **Requirement:** interface: honest information; AGENTS.md rule 6
- **File and line (traced or suspected as stated):** src/engine/tactics advisor.ts (phrase), src/battle/ffx/overdrive.ts timerMsFor (as traced by the interface auditor)
- **Smallest fix:** Add the phrase only when the minigame's timer is above 0.
- **Acceptance check:** No "Timed input" on Ronso Rage, Grand Summon or Mix rows; Swordplay and Bushido keep it.
- **Tags:** introducedByCandidate false, regressionVsLive false

#### PR-0251 — (carried, widened): HUD text floor is 12.25 px at 1600x900 (11.68 px for the FFX-2 command-info label) and 13.1-13.8 px at 2000x1012; 9.3-9.8 px at 1280x960 (round 19)

- **Category:** interface
- **Game:** both
- **Chapter and state:** Ch I and Ch IV battle HUD; pause OPTIONS on a phone
- **Expected:** Zero text a player must read under 14 px effective at the CHK-002 viewports.
- **Observed:** fm run measures: 1600x900 minPx 12.25 (Yojimbo 12.22, FFX-2 Bahamut 11.68 on the "White Magic" ffx2-cmd-info__label), 2000x1012 13.13-13.77, 14 at 1920x1080, 2560x1080, 2560x1440. Live 35 Yojimbo at 1600x900 is 12.22, so not a regression.
- **Repro and seed:** node critic/rounds/round-17/cap/gaps/sweep.mjs <chapter> <WxH> [touch]
- **Evidence:** critic/rounds/round-19b/evidence/gaps/fm-*/run.json
- **Confidence:** high
- **Requirement:** CHK-003; PR-0251 acceptance (text part)
- **Smallest fix:** Floor the stage-scaled HUD labels at 14 px effective (CTB names, badges, OD, FFX-2 job and max-HP spans), and raise the phone pause .pause__k / .pause__v / .pause__tab to 14 px.
- **Acceptance check:** sweep.mjs reports under14 = 0 for the battle HUD at 1600x900, 1280x960 and 390x844, and for every pause tab at 390x844.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0061 — (carried, STALLED): hold-skip to the first usable menu takes 8.0-12.1 s

- **Category:** feel
- **Game:** both
- **Chapter and state:** Ch I, IV, VII at 1600x900
- **Expected:** Under 3 s.
- **Observed:** In-game time to the first menu on c69de96a: Flux 8.02 s, Yunalesca 8.95, Natus 8.88, Braska 8.92, Evrae 8.97, Bahamut 8.43-8.87, Leblanc 11.18, Yojimbo 12.10, Trema 10.17-10.55; equal to round 19 or up to 1.2 s lower (25 of 27 comparable runs equal or lower).
- **Repro and seed:** node critic/rounds/round-17/cap/gaps/latency17.mjs <chapter> --base=<url> --evidence=<dir>
- **Evidence:** critic/rounds/round-19b/feel-narr/firstmenu.cjs over critic/rounds/round-19b/evidence/*/run.json
- **Confidence:** high
- **Requirement:** PR-0061 acceptance
- **Smallest fix:** After a hold-skip, skip or compress the intro dolly and enemy-intro beats regardless of the pace preset.
- **Acceptance check:** holdToFirstMenuMs < 3000 in I, IV and VII at the default settings.
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature false
- **Note:** Reused from round 18 (presenter, camera and pace code unchanged in this diff).
- **Merged from:** gaps PR-0061 (re-measured: Ch VII 8.3 / 8.6 s, Ch IV 9.3 s, Ch I 8.4 s); feel PR-0061 (not measured by the auditor)

#### PR-0301 — (new; R18B-GAP2-05): FFX-2 chain seams hand control back about 2.5-3 s later than live 32, because the battle-start moment now runs 2.9-3.1 s instead of 0.6-0.75 s

- **Category:** feel
- **Game:** FFX-2 (every chain seam measured: XV and XI)
- **Chapter and state:** XV ffx2-den-of-woe and XI ffx2-fallen-aeons, seams
- **Expected:** A seam no slower than live, unless the longer opening is an approved end-state choice.
- **Observed:** Same lane on both builds (setSeed 1, labelled Stop and hasten injection), seam -> first party menu: XV live 13.3 / 14.5 s vs candidate 15.8 / 17.4 s; XI live 13.2 / 13.8 s vs candidate 16.1 / 16.4 s. moment:battle-start: live 617-752 ms, candidate 2,862-3,114 ms (2,238 ms with OS reduced motion). The rest of the hand-back (ATB refill plus one enemy action) matches live.
- **Repro and seed:** critic/rounds/round-18b/cap/gaps/sSeamStop2.mjs ffx2-den-of-woe and ffx2-fallen-aeons, setSeed(1), 1600x900; --base=https://baileypillon.github.io/pyrefly-reprise/ for live 32.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-live32-ffx2-den-of-woe-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-live32-ffx2-fallen-aeons-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-default-ffx2-den-of-woe-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/seamstop2-cand-ffx2-fallen-aeons-1600x900/run.json
- **Confidence:** high for the timing; cause not traced
- **Requirement:** RUBRIC section 6 feel (responsive input, smooth transitions)
- **File and line (traced or suspected as stated):** not traced; suspected: the slide-in that the PR-0281 fix now lets finish, or the steady pacing / calm camera defaults of the release-33 line
- **Smallest fix:** Trace which change lengthened moment:battle-start. If it is the intended look, show Bailey the A/B frames and record the decision; otherwise bring it back to about 0.6 s or open input during it.
- **Acceptance check:** Same lane on the next candidate: moment:battle-start at most 1 s, or a recorded decision approving the longer opening; seam -> first menu within 0.5 s of live.
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Polish: about 2.5 s more per seam on a 13-17 s hand-back. A question for Bailey if the longer opening is intended.

#### PR-0300 — (new; R18b-FN-01 + R18B-GAP2-04): at every Chapter XV link seam the painted cave plate stops short of the right edge, leaving a black band (21-25 % of the width for about 1.1 s, still about 8 % at 2.5 s); live 32 is full-bleed

- **Category:** feel
- **Game:** FFX-2 only (seen in XV; VI shows a 6-7 % margin for about 1 s; VIII, XIII and XIV fill the frame)
- **Chapter and state:** XV ffx2-den-of-woe, seams link 1->2 and 2->3, moment:battle-start
- **Expected:** The scene plate fills the frame at every camera rest of the seam, as on live.
- **Observed:** In 13 of 13 seam sequences on the candidate (real keys and injected lanes; 1600x900 and 2000x1012; with or without a Stopped girl), frames from 0.05 to 0.76 s have no column with mean luma above 6 past 75-79 % of the width; the plate ends in a hard vertical edge with black beyond it. Live 32 (bundle ChAAAZ-I), same seed and lane, and live 31a cover the frame for the whole sequence. Present already in 65152c1b, where the PR-0281 freeze hid it.
- **Repro and seed:** setSeed(1), 1600x900, Ch XV by advisor keys to the link 1->2 seam (route18d.mjs seq-seam-2), or critic/rounds/round-18b/cap/gaps/sSeamStop2.mjs with and without --q=cam=current; 8 frames every 350 ms from the link change.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/feel-narr/den-seam-f00-cand-vs-live31a.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-default.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-camcur.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/sheets/xv-seam2-live32.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-seq-seam-2/
- **Confidence:** high for the observation (per-column luma on every frame, A/B against live 32); cause not traced
- **Requirement:** RUBRIC section 6 feel (coherent camera, smooth transitions) and visual (correct rendering); CHK-002 coverage. Scored once, under feel.
- **File and line (traced or suspected as stated):** not traced; the gap pass ruled the calm camera out (?cam=current shows the band too, plate edge at x~1270 at 366 ms; default camera edge at x~1470 at 1.8 s)
- **Smallest fix:** Find which plate or scale change since live 32 shortened the den floor plate at this framing; extend or scale the plate to cover the battle-start moment's widest framing, or clamp the moment camera to the plate bounds. Do not replace the approved painting.
- **Acceptance check:** Ch XV seams 1->2 and 2->3 at 1600x900 and 2000x1012, seeds 1 and 2, both camera modes: in every frame the rightmost column with mean luma above 6 is at least 95 % of the width.
- **Tags:** introducedByCandidate true, regressionVsLive true, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Polish, not major: about a second at one chapter's two seams, with the frame filling as the camera settles. Introduced by the release-33 line (already in 65152c1b), not by the r33-fix diff.

#### PR-0104 — (carried, 4th review, STALLED): under Wait, a confirmed FFX-2 support command (Shell) shows nothing but a cast pose; the next menu opens at 2.27 s

- **Category:** feel
- **Game:** FFX-2
- **Chapter and state:** IV ffx2-bahamut (1600x900) and VI ffx2-leblanc (2000x1012); XVI on 390x844 shows only a help line
- **Expected:** A confirmed command gets immediate visible acknowledgement, such as its name chip over the actor or a charge cue, while it waits for its turn.
- **Observed:** Gap pass, 100 ms frames from White Magic > Shell > All allies (Wait, keys): no frame from 0 to 2.2 s shows 'Shell' anywhere; Yuna takes her cast pose; the next menu opens at 2.27 s (round 17: 1.8 s).
- **Repro and seed:** Candidate 1a6fd3cc, Ch IV at 1600x900, seed 1: Yuna, White Magic, Shell, All allies.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/contact-shell.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/seq-shell-confirm-100ms/
- **Confidence:** high on what is shown; FFX-2 charge time itself is canon
- **Requirement:** RUBRIC §6 feel (input-to-response)
- **Smallest fix:** Under Wait, show the queued command's name chip over the actor at confirm (FFX-2 only), kept until the action starts.
- **Acceptance check:** A frame within 300 ms of the confirm shows the command name on or next to the actor, at 1600x900 and 390x844.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Reused from round 18 (FFX-2 HUD and presenter unchanged in this diff).

#### PR-0321 — (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor

- **Category:** interface
- **Game:** both
- **Chapter and state:** any (pause > OPTIONS > EYE CANDY) at 390x844
- **Expected:** CHK-003: no player text under 14 css px at 390x844.
- **Observed:** 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
- **Repro and seed:** 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
- **Evidence:** critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
- **Confidence:** high
- **Requirement:** CHK-003
- **File and line (traced or suspected as stated):** src/ui/common/pause-screen.css:824-825 (--pu-fs:12px; --pu-fs-v:13px, an authored phone exception)
- **Smallest fix:** Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
- **Acceptance check:** ecfont at 390x844 in both games: under14 empty, no clipping.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** The new page inherits the pre-existing phone pause floor; the capture owner filed it as minor/new, the interface auditor as a pre-existing exception. One issue.

#### PR-0317 — (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900

- **Category:** visual
- **Game:** FFX only
- **Chapter and state:** I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03)
- **Expected:** A boss in action stays inside the frame (CHK-014).
- **Observed:** His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
- **Repro and seed:** Candidate, seed 1, 1600x900, Ch I, let Seymour act.
- **Evidence:** critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
- **Confidence:** high
- **Requirement:** CHK-014; CHK-013
- **Smallest fix:** Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
- **Acceptance check:** Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0259 — (carried; evidence gap, merged with R19B-PD-01): no single-lane frame-time measurement exists for c69de96a; round 18 saw isolated 66-117 ms spikes

- **Category:** delivery
- **Game:** both
- **Chapter and state:** sin-face, seymour-flux, ffx2-ixion-djose
- **Expected:** No visible hitch in the fight.
- **Observed:** The 19b capture ran 3 to 6 browser lanes at once and the gap pass beside lanes A-D, so no timing counts; the only timing is one keydown-to-paint series (17.4-26.3 ms, Bahamut 1600x900) on that contended host. Release 36 adds per-frame plate, clearance and framing work nobody has timed; the gap pass's rAF p50/p95 16.7 ms around a Swordplay cut is a single contended sample.
- **Repro and seed:** critic/rounds/round-18/cap/perf18.mjs, cold profile, GPU mostly idle (21 % / 8 %).
- **Evidence:** critic/rounds/round-19b/evidence/logs/lanes.log; critic/rounds/round-19b/chief/inputs/audit_prep-delivery.json
- **Confidence:** medium
- **Requirement:** RUBRIC §2 (report spikes)
- **File and line (traced or suspected as stated):** fight playing, 20 s windows
- **Smallest fix:** One capture lane with nothing else running, PYREFLY_BROWSER=gpu: rAF deltas p50/p95/p99/max through full fights in Ch I, II, IV, VIII and X at 1600x900 and 2000x1012, warm and cold.
- **Acceptance check:** A single-lane perf JSON for c69de96a or its successor; maximum frame time under 50 ms in the same windows.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.
- **Merged from:** prep-delivery R19B-PD-01

#### PR-0240 — (downgraded major -> polish after a measurement): a cold chapter entry at 10 Mbit/s reaches the first menu at 52 s (15.5 s unthrottled); the V0 music adds only about 2-3 s of it

- **Category:** delivery
- **Game:** both
- **Chapter and state:** all
- **Expected:** A first battle within the platform load goal on named slow-network conditions (RUBRIC section 2: a load under 5 s).
- **Observed:** Confirmer, headless gpu, CDP throttling 10 Mbit/s down + 40 ms, cache cleared, Ch I 1600x900, from Enter on the chapter card: first command menu 52.0 s throttled vs 15.5 s unthrottled; boss-seymour playing at 32.6 s vs 6.2 s. Chapter entry fetched two music files (scene-gagazet 3.10 MB, boss-seymour 2.96 MB), about 4.8 s at 10 Mbit/s; live's encode would be about 2.4 s. The rest of the 36 s penalty is art that is identical to live. The music growth was approved by Bailey (D-292) and is within the 85 MB audio budget (80.93 MB; D-306 raises it to 90). RUBRIC names a five-second load goal but no cold slow-network budget.
- **Repro and seed:** critic/rounds/round-18b cap/confirm cold10 script: cold profile, CDP 10 Mbit/s + 40 ms, Ch I at 1600x900, time from Enter on the chapter card to the first menu and to the battle cue.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/cold10-seymour-flux/cold10.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/confirm/warmnet-seymour-flux/cold10.json; D:/Final Fantasy/critic/rounds/round-18b/audio/qa-strict.txt
- **Confidence:** medium (one run each; toBattle's fixed waits add the same overhead to both)
- **Requirement:** RUBRIC §2 platform goals; §6 delivery (measured loading)
- **File and line (traced or suspected as stated):** chapter entry on a cold cache
- **Smallest fix:** Start the battle before every chapter plate has arrived (progressive art: a low-resolution plate first), and defer the boss cue behind the SFX sprite. Measure the art share first.
- **Acceptance check:** A named 10 Mbit/s cold run per game: first menu within a budget Bailey sets (none exists today), and the music share recorded.
- **Tags:** introducedByCandidate false, regressionVsLive "unknown", inNewFeature false
- **Round 19b:** The 52.0 s cold 10 Mbit figure (round 18b) was measured on a 577 MB build; c69de96a ships 799 MB, so the figure is stale and owed again (R19B-PD-01).
- **Note:** Merged the audio auditor's and the delivery auditor's PR-0240 entries into this one. Downgraded: the confirmer refuted "music over budget" as framed; the slow entry is art-dominated and exists on live too, and the ~2-3 s music share is an owner-approved size.

#### PR-0327 — (new; R19-PD-01): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; on a cold or slow cache the outfit can land before the keys (builder-stated, not captured)

- **Category:** delivery
- **Game:** FFX-2 only
- **Chapter and state:** every FFX-2 chapter, first spherechange
- **Expected:** Keys present when the twirl plays, or a clean fallback.
- **Observed:** Den of Woe seed 3 requested 12 twirl-*.png only at Rikku's change; throttled behaviour not captured.
- **Repro and seed:** Cold profile, 10 Mbit/s, Ch IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
- **Evidence:** critic/rounds/round-19/evidence/ffx2-den-of-woe-win-s3/network-media.json; D:/pyrefly-rel26c/docs/handoff/r36-art.md
- **Confidence:** medium
- **Requirement:** delivery: measured loading
- **Smallest fix:** Prefetch the party's twirl keys at battle start (idle priority).
- **Acceptance check:** Throttled capture shows no outfit-before-keys pop.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Not re-measured (R19B-PD-05): on a warm local server the Leblanc change found its keys at 88 ms and played them at 199 ms; cold or slow cache untested.

#### PR-0326 — (new finding, pre-existing): the first sound of every session is the procedural synth: the title's press-start "battle-start" plays before either sprite has decoded

- **Category:** audio
- **Game:** both
- **Chapter and state:** title screen
- **Expected:** No cue falls back to the synth path (CHK-001 step 3); the first sound is the sprite or nothing.
- **Observed:** 24 of 24 runs: sfxLog[0] = {asked battle-start, via synth} at AudioContext time 0.16-0.38 s; the only synth entry in any run.
- **Repro and seed:** Fresh profile, candidate at 1600x900: press Enter on the title; read the audio debug sfxLog[0].
- **Evidence:** critic/rounds/round-19b/audio/routing.json; critic/rounds/round-19b/evidence/seymour-flux-win/audio-debug.jsonl
- **Confidence:** high (data read; nobody listened)
- **Requirement:** CHK-001 step 3; Bailey 2026-09-18 "audio is arcade-y"
- **File and line (traced or suspected as stated):** src/app/screens/TitleScreen.ts:195 (audio.playSfx("battle-start") on press-start)
- **Smallest fix:** Wait for the sprite decode before the press-start cue, or play nothing on that first press.
- **Acceptance check:** sfxLog shows no via:synth entry in a fresh-profile run.
- **Tags:** introducedByCandidate false, regressionVsLive false

#### PR-0263 — (carried, downgraded major -> polish; friends' "no attack SFX"): the fix is delivered by D-293 (SFX b, bus 0.70 in 185/185 samples; a hit's true peak now ~1.5 dB under the music's, was ~7.5 dB) but no ear has confirmed it

- **Category:** audio
- **Game:** both
- **Chapter and state:** all battles
- **Expected:** D-293 balance b: effects +6 dB against D-210, so a hit lands about level with the music's peaks.
- **Observed:** The runtime SFX bus is 0.70 in 185 of 185 candidate samples. Measured, not heard: a hit's true peak now sits about 1.5 dB under the music's true peak (hit-1 at -1.02 dBTP x0.7 bus x0.8 cue volume, against music at -1.5 dBTP x0.7). It was about 7.5 dB under. The whiff's 400 ms momentary sits about 7.5 dB under the battle music's median (it was about 13.5 dB under). The two estimates use different windows, so they do not compare directly.
- **Repro and seed:** Default profile, any chapter: land an attack and a miss. Read the audio debug sfxMix, and see src/engine/BattlePresenterBeats.ts:130 and BattlePresenterEvents.ts:229.
- **Evidence:** evidence/*/audio-debug.jsonl; critic/rounds/round-17/audio-r17-sfx-vs-music.json (reused, dependency: the sprite is sha-identical and the music loudness is within 0.02 LU)
- **Confidence:** medium
- **Requirement:** D-293; CHK-B1
- **Smallest fix:** None in code. Ask Bailey or the friends to confirm by ear that hits now read over the music. If the miss still disappears, consider the miss cue's own volume of 0.5.
- **Acceptance check:** An owner or playtester ear note says the attack SFX are audible at the default settings.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Bus 0.70 in 166 of 166 samples; no ear has confirmed the friends' "no attack SFX" is fixed.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0261 — (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- **Category:** harness
- **Game:** both (tooling)
- **Chapter and state:** all phone routes
- **Expected:** contexts.touch.blocked names the element that intercepts the tap.
- **Observed:** The run.json files of ffx2-den-of-woe-win and -stall-{cand,fxoff,pacecurrent,confirmer} say outcome 'victory', although the chain never finished; runs-summary.json repeats it; only index.json's note says soft-lock. Round 17's reticle-interception-as-timeout part is unchanged.
- **Repro and seed:** Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- **Confidence:** high
- **Requirement:** CHK-016 evidence integrity
- **Smallest fix:** Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- **Acceptance check:** A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** New instance (merged with the delivery auditor's note): route-fight.mjs:265 read battleLog() holding link 2's per-link victory, so two XV defeats were first logged as "victory"; repeated attempts also overwrite frames (20-link-2.png, 24-seam-2-first-menu.png). The gap pass caught it from the results text ("Defeat"). No verdict here rests on the mislabelled lines.
- **Merged from:** R18-CE-02

#### PR-0322 — (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey

- **Category:** onboarding
- **Game:** both
- **Chapter and state:** pause > OPTIONS > EYE CANDY
- **Expected:** Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
- **Observed:** FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
- **Repro and seed:** Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
- **Confidence:** high (contrast estimated from JPEG)
- **Requirement:** D-317; CHK-003
- **Smallest fix:** Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
- **Acceptance check:** After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0323 — (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")

- **Category:** onboarding
- **Game:** both
- **Chapter and state:** pause > OPTIONS > EYE CANDY
- **Expected:** Copy a first-time player understands (CHK-007).
- **Observed:** CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
- **Repro and seed:** Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
- **Confidence:** high
- **Requirement:** CHK-007
- **Smallest fix:** Name the thing: "Off: the standard battle camera", "Off: the plain splash".
- **Acceptance check:** No "today" in the page's help strings; capture at 1600x900.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0032 — (carried, weight up): no REDUCE FLASHES row and no key remapping, while the new default look adds ink impact frames and lens flares; the soft-flash path exists but reads a setting no row writes

- **Category:** onboarding
- **Game:** both
- **Chapter and state:** all
- **Expected:** A player-reachable flash reduction when the default look flashes. Remapping stays a Bailey decision.
- **Observed:** The spectacle defaults on:
- Up to 3 ink impact frames per rolling second (SpectacleRules FlashBudget).
- Lens flares (LensFlare).

A 'soft' impact frame and a 0.35 flare peak exist behind eyeCandy.reduceFlashes, but fxEnv reads a 'reduceFlashes' setting that no row writes (settingsAtBoard has no such key). The workarounds are REDUCE MOTION (removes impact frames) or turning off BATTLE SPECTACLE and CINEMA LIGHT, and none of those rows mentions flashes. Remapping is still absent.
- **Repro and seed:** Pause OPTIONS in either game: there is no flash row.
- **Evidence:** D:/pyrefly-rel26c/src/engine/fx/c/SpectacleRules.ts:43,181,201; src/app/fxEnv.ts:41; round-18/evidence/fxrows-*/run.json settingsAtBoard
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding (motion and flash accommodations); D-220 Q7 undecided
- **File and line (traced or suspected as stated):** pause OPTIONS; battle with BATTLE SPECTACLE and CINEMA LIGHT on (default)
- **Smallest fix:** Ask Bailey (D-220 Q7). If yes, add a REDUCE FLASHES row writing settings.reduceFlashes. Until then, name the flash in the BATTLE SPECTACLE row's help.
- **Acceptance check:** A row toggles reduceFlashes by keys, mouse and taps. With it on, impactFrame is 'soft' and the flare peak is 0.35. It persists across a reload.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** 19b OPTIONS frames list REDUCE MOTION and LOW EFFECTS but no REDUCE FLASHES; src/app/fxEnv.ts still reads a flag no row writes.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0319 — (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line

- **Category:** visual
- **Game:** FFX only
- **Chapter and state:** IX yojimbo-cavern, first menu 2000x1012
- **Expected:** Background staging reads as background.
- **Observed:** Under the colossus master the far-back figure stands on the party's line at party scale.
- **Repro and seed:** Candidate, seed 1, Ch IX first menu.
- **Evidence:** critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
- **Confidence:** low
- **Requirement:** visual: composition
- **Smallest fix:** Push the prop deeper or dim it under the colossus master.
- **Acceptance check:** In the first-menu frame Ginnem sits clearly behind the line or out of view.
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0325 — (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot

- **Category:** interface
- **Game:** FFX only
- **Chapter and state:** I seymour-flux, 1600x900
- **Expected:** The selected row is obvious (CHK-010).
- **Observed:** 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
- **Repro and seed:** Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
- **Evidence:** critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
- **Confidence:** medium-low
- **Requirement:** CHK-010
- **Smallest fix:** If confirmed, give the selected row the filled slab of the main list.
- **Acceptance check:** Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0302 — (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- **Category:** interface
- **Game:** both
- **Chapter and state:** I (Zombie), IV (Curse); any hinted status
- **Expected:** CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- **Observed:** Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- **Repro and seed:** critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- **Confidence:** high (measured)
- **Requirement:** CHK-003; RUBRIC section 5 (effective text size)
- **File and line (traced or suspected as stated):** src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- **Smallest fix:** Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- **Acceptance check:** Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0303 — (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- **Category:** interface
- **Game:** FFX (FFX-2's shorter target card leaves room: 0 px2)
- **Chapter and state:** I seymour-flux, a target step with a hinted status (Zombie)
- **Expected:** The target-step instructions and the hint do not overlap (CHK-008).
- **Observed:** 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- **Repro and seed:** Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- **Confidence:** high
- **Requirement:** CHK-008; PR-0282 acceptance (the hint never over the command surface)
- **File and line (traced or suspected as stated):** src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- **Smallest fix:** Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- **Acceptance check:** 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0304 — (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- **Category:** interface
- **Game:** FFX-2 (desktop, guide open)
- **Chapter and state:** IV ffx2-bahamut, the girls' menus after Curse lands
- **Expected:** While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- **Observed:** At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- **Repro and seed:** Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- **Confidence:** medium (symptom high; cause suspected)
- **Requirement:** Status O3 target (the hint in the guide's slot); CHK-008
- **File and line (traced or suspected as stated):** suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- **Smallest fix:** Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- **Acceptance check:** 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0305 — (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- **Category:** onboarding
- **Game:** FFX-2 (the FFX help line follows each actor in both modes)
- **Chapter and state:** IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
- **Expected:** The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- **Observed:** Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- **Repro and seed:** 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- **Confidence:** medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- **Requirement:** CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- **File and line (traced or suspected as stated):** suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- **Smallest fix:** Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- **Acceptance check:** BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- **Tags:** introducedByCandidate false, regressionVsLive "unknown", inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0291 — (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** I
- **Expected:** As in the approved O3 target, both panels are readable.
- **Observed:** The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- **Repro and seed:** Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- **Confidence:** high
- **Requirement:** approved target O3 / interface readability
- **File and line (traced or suspected as stated):** 1600x900 Items list aimed at a Zombie
- **Smallest fix:** Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- **Acceptance check:** No overlap between .stwarn and the Guide card rect in that frame.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Re-observed on f302f163 and widened (visual auditor): at 1600x900 with the guide open, the red Zombie warning slab and also the grey TALK help slab ("A one-off action this encounter offers") overprint the Guide card's NEXT "Holy Water -> Yuna" line. Round 18's frame is identical.

#### PR-0286 — (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** Ch I
- **Expected:** The message and the dialogue text do not overlap.
- **Observed:** 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- **Repro and seed:** 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- **Confidence:** medium
- **Requirement:** CHK-008
- **File and line (traced or suspected as stated):** 390x844, a status lands while a battle line is on screen
- **Smallest fix:** Offset the message line below the banner while a line is up, or queue it until the line ends.
- **Acceptance check:** Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Widened by the gap pass (merged R18B-GAP2-06): at 1280x960 FFX desktop, "Kimahri was hasted." (371 px2) and then "Yuna became a Zombie." (568 px2) overlap the visible dialogue text for about 2.5 s (13 samples at 200 ms); no overlap at 1600x900, 2000x1012, 2560x1080 or 3840x2160. On the FFX-2 phone the new floor (withStatusLooks.ts) moves the message clear of the docked hint within one 200 ms sample. The FFX phone had 0 px2 of message over dialogue in 15 samples.
- **Merged from:** capture-owner issue 4; R18-IF-05

#### PR-0289 — (new, first run O2): step 1 says 'Start with the first one' while the spot sits on another selected chapter

- **Category:** onboarding
- **Game:** both
- **Chapter and state:** chapter select, first run
- **Expected:** The words match the picture the spot points at, or the spot stays on Chapter I.
- **Observed:** The plate shows CHAPTER XVI Ixion while the slab reads 'Start with the first one. Tap its picture to begin.' This is a documented open item in firstrun-o2.md.
- **Repro and seed:** Fresh profile, 390x844. Choose Ixion on the board before tapping the plate.
- **Evidence:** critic/rounds/round-19b/evidence/sin-fins-core-win/03-card.png
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding; approved O2 target (only Chapter I drawn)
- **File and line (traced or suspected as stated):** 390x844 and desktop board, guide step 1, a chapter other than I selected
- **Smallest fix:** Ask Bailey which: keep the spot on Chapter I, or reword to 'Tap its picture to begin.' without 'the first one'.
- **Acceptance check:** With a non-first chapter selected, the slab never says 'the first one'.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Reconfirmed: sin-fins-core-win/03-card.png at 1600x900.
- **Note:** Re-observed in all six real-flow runs on f302f163: O2 step 1 says "Start with the first one." while Chapter XV or IV is selected.
- **Merged from:** R18-ON-03; R18-VIS-02

#### PR-0292 — (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- **Category:** onboarding
- **Game:** FFX
- **Chapter and state:** I prep
- **Expected:** Every control has a key or pad route, and touch wording on touch screens.
- **Observed:** No key binding: Tab is WALK, A is Left. The phone explainer reads 'CLICK TWICE… press Enter… wheel to zoom' and 'Enter or click again'. On the phone the explainer's buttons start below the fold (one swipe reaches them).
- **Repro and seed:** Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- **Confidence:** high
- **Requirement:** onboarding: input access
- **File and line (traced or suspected as stated):** Sphere Grid tab
- **Smallest fix:** Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- **Acceptance check:** A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0288 — (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** Ch I
- **Expected:** The full help sentence, wrapped if needed.
- **Observed:** 'TIDUS · Nothing left to say — A one-off action this enc…'
- **Repro and seed:** 390x844 Ch I after Talk is used up, cursor on TALK.
- **Evidence:** round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **File and line (traced or suspected as stated):** 390x844 command menu, TALK disabled
- **Smallest fix:** Allow two lines, or shorten the copy for the phone.
- **Acceptance check:** scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0293 — (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- **Category:** visual
- **Game:** both
- **Chapter and state:** I, IV, VII, XVII, XVIII (every chapter checked)
- **Expected:** CHK-002: the pause painting covers the window at every supported size.
- **Observed:** Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- **Repro and seed:** Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- **Confidence:** high
- **Requirement:** CHK-002
- **File and line (traced or suspected as stated):** pause layer at 4K (the 3360x1920 master is not scaled to cover)
- **Smallest fix:** Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- **Acceptance check:** pauseRect.full is true at 3840x2160 in both games.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Confirmed on f302f163 by the gap pass: pauseRect [-4,-2,3368x1925] in FFX (kimahri.2x.webp 3360x1920) and [-4,-2,3369x1925] in FFX-2; full=false in both.

#### PR-0237 — (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- **Category:** interface
- **Game:** FFX-2
- **Chapter and state:** Ch XVI, Ch IV
- **Expected:** The intent line stays readable.
- **Observed:** Rikku's line lies over 'IXION ACTS NEXT … MOST LIKELY 83%' and the random-target list, and over 'BAHAMUT ACTS NEXT … SCRIPTED'.
- **Repro and seed:** Fresh profile at 390x844, FFX-2 chapter, first menu.
- **Evidence:** round-18/evidence/ffx2-ixion-djose-win-touch/10-first-menu-coach.png; probe-ffx2-bahamut-390x844-touch-cand/10-status-hint-over-commands.jpg
- **Confidence:** high
- **Requirement:** CHK-008
- **File and line (traced or suspected as stated):** 390x844 first command menu
- **Smallest fix:** As in round 17.
- **Acceptance check:** Coach box ∩ intent box = 0 at 390x844.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0250 — (carried, confirmed): the phone results location caption is clipped

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** Ch XII
- **Expected:** The full caption.
- **Observed:** 'INSIDE SIN — THE GARDEN C…'
- **Repro and seed:** Lose or win Ch XII at 390x844.
- **Evidence:** round-18/evidence/seymour-omnis-win-touch/31-results.png
- **Confidence:** high
- **Requirement:** CHK-009
- **File and line (traced or suspected as stated):** 390x844 results
- **Smallest fix:** As in round 17.
- **Acceptance check:** The caption's scrollHeight <= clientHeight + 1 at 390x844.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0296 — (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** XVII sin-fins-core, first decisions
- **Expected:** CHK-008: plates never cover the intent text.
- **Observed:** Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- **Repro and seed:** 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/
- **Confidence:** medium (frames only)
- **Requirement:** CHK-008
- **File and line (traced or suspected as stated):** 390x844 battle HUD
- **Smallest fix:** Reserve the intent line's band from the range plate on the phone layout.
- **Acceptance check:** No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0295 — (new finding, outside the changed area): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed at 0.61 (tiny text), unlike CHAPTER and SPHERE GRID

- **Category:** prep
- **Game:** FFX
- **Chapter and state:** party prep, any FFX chapter
- **Expected:** Every prep tab is usable at phone size (RUBRIC §6 device usability).
- **Observed:** Gap pass (sphere-phonetabs-390x844-touch): only CHAPTER and SPHERE GRID have a phone page; the other four tabs are the scaled desktop board.
- **Repro and seed:** 390x844 touch, Ch I prep, swipe through the tabs.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-phonetabs-390x844-touch/
- **Confidence:** high
- **Requirement:** RUBRIC §6 onboarding/prep device usability; CHK-003
- **File and line (traced or suspected as stated):** 390x844 party prep tabs
- **Smallest fix:** Give the remaining prep tabs the phone page treatment Sphere Grid B introduced.
- **Acceptance check:** CHK-003 sweep of each prep tab at 390x844: no player text under 14 px.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Not re-captured (R19B-PD-07); prep code unchanged. The Sphere Grid F6 key, pad and phone routes have no capture on this candidate.
- **Note:** Carried (prep code unchanged).

#### PR-0258 — (carried, re-confirmed): FFX victory spoils ignore the sourced x2-on-overkill drop quantity

- **Category:** prep
- **Game:** ffx
- **Chapter and state:** seymour-anima-macalania
- **Expected:** The sourced overkill quantity (4), per round 17.
- **Observed:** OVERKILL x1 with 'ITEMS Ability Sphere ×3, Blk Magic Sphere'.
- **Repro and seed:** seymour-anima-macalania-win, seed 1, 1600x900, real keys.
- **Evidence:** critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json (resultsText)
- **Confidence:** high
- **Requirement:** AGENTS.md rule 6; RUBRIC §6 prep
- **File and line (traced or suspected as stated):** results after an OVERKILL win
- **Smallest fix:** Apply the sourced overkill drop multiplier in the results spoils.
- **Acceptance check:** The same run shows the sourced overkill quantity.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Not re-checked (R19B-PD-07); results code unchanged.
- **Note:** Carried (data unchanged).

#### PR-0254 — (carried, STALLED): Chapter VII Talk is still silent

- **Category:** narrative
- **Game:** FFX
- **Chapter and state:** VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- **Expected:** A Tidus line and Seymour's reply within 3 s of each Talk.
- **Observed:** The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- **Repro and seed:** Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- **Evidence:** critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- **Confidence:** high
- **Requirement:** narrative: banter and reachable character voice
- **Smallest fix:** Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- **Acceptance check:** The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0255 — (carried): Tromell's five aftermath lines in Chapter VII still have no speaker

- **Category:** narrative
- **Game:** FFX
- **Chapter and state:** VII aftermath (CONFIRM scene)
- **Expected:** The speaker 'Tromell' with a name plate.
- **Observed:** Re-observed in 19b: "Step away from Lord Seymour, Lady Summoner." and four more have speaker "" (388402-388551 ms).
- **Repro and seed:** Ch VII win, CONFIRM on results.
- **Evidence:** critic/rounds/round-19b/feel-narr/dbox-all.txt
- **Confidence:** high
- **Requirement:** narrative: character voice
- **Smallest fix:** Add a 'tromell' speaker with a name plate and no portrait (like 'brother'), and move the lines to it.
- **Acceptance check:** The dboxTimeline shows speaker 'Tromell' on the five lines.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0272 — (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- **Category:** narrative
- **Game:** FFX
- **Chapter and state:** XVII sin-fins-core, seam 1 -> 2
- **Expected:** A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- **Observed:** "The Fahrenheit's cannon tears the fin away." at 679391 ms and 1774765 ms with no hit shown.
- **Repro and seed:** Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- **Evidence:** critic/rounds/round-19b/feel-narr/dbox-all.txt
- **Confidence:** high
- **Requirement:** narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- **Smallest fix:** Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- **Acceptance check:** A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0256 — (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- **Category:** feel
- **Game:** FFX-2
- **Chapter and state:** XVI aftermath, whistles 1 to 4
- **Expected:** A visible light, nearer on each whistle.
- **Observed:** Re-observed in the 19b dboxTimeline at 429802-430000 ms; hold-skipped, so no plate frames.
- **Repro and seed:** Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- **Evidence:** critic/rounds/round-19b/feel-narr/dbox-all.txt
- **Confidence:** medium
- **Requirement:** feel/narrative: shown, not told
- **Smallest fix:** A small gold mote fx step per whistle.
- **Acceptance check:** A timed capture after each whistle shows the light, nearer each time.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0279 — (carried, a question for Bailey): Sin's difficulty is still undecided (D-282); nothing in the engine changed, so the r17 figures stand

- **Category:** encounter
- **Game:** FFX
- **Chapter and state:** XVII, XVIII
- **Expected:** Bailey's call on D-282
- **Observed:** Unchanged data and AI. Real keys lost 2/2 in each chapter this round.
- **Repro and seed:** r17 sin benches (reused, see reused)
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/combat/sin-bench-out.txt
- **Confidence:** high
- **Requirement:** encounter: correct difficulty
- **Smallest fix:** Ask Bailey
- **Acceptance check:** A decision is recorded in decisions.json
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0257 — (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows (208 real-key turns this round, the same as round 17)

- **Category:** encounter
- **Game:** FFX
- **Chapter and state:** III
- **Expected:** The release note figure matches the measured length
- **Observed:** Real keys again 220 turns over 7 links (round 19: 220, round 17: 208).
- **Repro and seed:** runs-summary.json
- **Evidence:** critic/rounds/round-19b/evidence/braskas-final-aeon-win/run.json
- **Confidence:** high
- **Requirement:** encounter pacing
- **Smallest fix:** Correct the note or ask Bailey
- **Acceptance check:** The note matches the bench
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0280 — (carried): the v3 card's Chapter XII rate is unchanged (bench identical); the live v4 card covers it

- **Category:** encounter
- **Game:** FFX
- **Chapter and state:** XII
- **Expected:** n/a
- **Observed:** ffx-three-line-r18.json XII rows are identical to round 17
- **Repro and seed:** Run ffx-bench.test.ts
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- **Confidence:** high
- **Requirement:** advice usefulness
- **Smallest fix:** none needed now
- **Acceptance check:** n/a
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0220 — (carried, downgraded major -> polish): an emulated pad-only run now unlocks audio on the first pad A (title, chapter-select, boss-seymour), but headless Chromium already had user activation, so a real Chrome with a real controller is not proven

- **Category:** audio
- **Game:** both
- **Chapter and state:** all
- **Expected:** The first gamepad button unlocks the AudioContext, and the title or chapter-select music starts.
- **Observed:** Gap pass pad-only-seymour-flux-1600x900: standard-mapping virtual pad, no keyboard/pointer/touch events; after the first pad A ready:true, playing:'title'; board 'chapter-select'; first battle menu 'boss-seymour'. navigator.userActivation was already active in headless Chromium, so the run cannot tell a pad gesture from none.
- **Repro and seed:** From a fresh profile, press only gamepad buttons from the title into a battle, then read __pyrefly audio debug: ready and playing.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pad-only-seymour-flux-1600x900/run.json
- **Confidence:** low (unknown)
- **Requirement:** RUBRIC s2 platform goals (gamepad); CHK-023
- **Smallest fix:** Add one emulated-gamepad Playwright run that asserts audio ready and a playing cue.
- **Acceptance check:** A real controller on real Chrome (or a headed browser with userActivation provably false before the pad press) reaches the title cue on the first pad button.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0039 — (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- **Category:** audio
- **Game:** both
- **Chapter and state:** I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- **Expected:** Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- **Observed:** themes-audit fails scene-gagazet, scene-dreams-end and scene-farplane, the same as round 17. Note: scene-farplane measures E minor against the map's E major.
- **Repro and seed:** node tools/audio/themes-audit.mjs
- **Evidence:** themes-audit output, round 18
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md
- **Smallest fix:** Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- **Acceptance check:** themes-audit reports 0 departures for these cues.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0260 — (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- **Category:** audio
- **Game:** ffx
- **Chapter and state:** VII
- **Expected:** Every shipped cue has a row in the bible's cue map.
- **Observed:** FAIL scene-macalania-temple: the cue is not in the bible's cue map.
- **Repro and seed:** node tools/audio/themes-audit.mjs
- **Evidence:** themes-audit output, round 18
- **Confidence:** high
- **Requirement:** docs/audio/THEMES.md
- **Smallest fix:** Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- **Acceptance check:** themes-audit shows ok for scene-macalania-temple.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0278 — (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- **Category:** audio
- **Game:** both
- **Chapter and state:** docs
- **Expected:** One contiguous table of rows I to XVIII.
- **Observed:** Line 656 is '| ## Owed cues for chapters not yet listed'. Rows XVII and XVIII sit at lines 667 and 668, after a stray separator at line 666, outside the table. themes-audit still reads 18 of 18.
- **Repro and seed:** Open D:/pyrefly-rel26c/docs/audio/THEMES.md at lines 638 to 668.
- **Evidence:** docs/audio/THEMES.md:656,666-668
- **Confidence:** high
- **Requirement:** docs hygiene
- **Smallest fix:** Move the XVII and XVIII rows up under XVI, and put a blank line before the '## Owed cues' heading.
- **Acceptance check:** The rendered markdown shows one table of 18 rows, and themes-audit still passes.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0298 — (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- **Category:** audio
- **Game:** both
- **Chapter and state:** all
- **Expected:** D-292 as worded: the music grows from about 39 MB to about 73 MB.
- **Observed:** The music is 78.2 MB and the total 80.93 MB (qa). The AUDIO_BUDGET_BYTES constant went from 60 to 85 MB, and the D-292 note in manifest-io.mjs documents the gap. Each chapter's music download roughly doubled; for example III requests 12.7 MB of music, up from 6.5. Any effect on slow-link loading is the delivery category's call (PR-0240) and is not scored here. NOW.md already lists 'music 78 MB ok?' as open for Bailey.
- **Repro and seed:** node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- **Confidence:** high
- **Requirement:** RUBRIC s7 (a pick approves what Bailey named)
- **Smallest fix:** Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- **Acceptance check:** decisions.json records Bailey's answer on the 78 MB size.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature false
- **Round 19b:** Shipped audio 88.49 MB of the 90 MB budget (D-306); music about 78 MB.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0271 — (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- **Category:** visual
- **Game:** FFX only
- **Chapter and state:** XVIII Sin: the Face
- **Expected:** No HUD panel over a face, including during camera moves (CHK-008).
- **Observed:** When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- **Repro and seed:** Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- **Evidence:** critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- **Confidence:** medium (observed; no live action-frame evidence to compare)
- **Requirement:** CHK-008
- **File and line (traced or suspected as stated):** Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- **Smallest fix:** Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- **Acceptance check:** XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown", inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0248 — (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- **Category:** visual
- **Game:** FFX only
- **Chapter and state:** VII Seymour and Anima
- **Expected:** The Sensor card placed clear of the fiends' projected quads.
- **Observed:** The card spans Guardian B from shoulders to knees; only his head shows above it.
- **Repro and seed:** Seed 1, Ch VII, 1600x900. Target by real keys, then cancel.
- **Evidence:** critic/rounds/round-17/evidence/seymour-anima-macalania-win/16b-after-cancel.png; 16-target-single.png
- **Confidence:** high
- **Requirement:** CHK-008
- **File and line (traced or suspected as stated):** Sensor card placement (not traced)
- **Smallest fix:** Use the line-card free-slot picker for the Sensor card, or dismiss it on cancel.
- **Acceptance check:** Ch VII 16b-after-cancel at 1600x900 and 2000x1012: no enemy torso under the card.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0246 — (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- **Expected:** The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- **Observed:** 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- **Repro and seed:** node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- **Evidence:** D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- **Confidence:** high
- **Requirement:** PR-0246 acceptance; CHK-009
- **Smallest fix:** Wrap the label to two lines, or drop the verb when the name is long.
- **Acceptance check:** The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0252 — (carried): the first-turn coach card overlaps the selected command row

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** X Seymour Natus at 2000x1012 (2560x1080 not captured)
- **Expected:** Coach clear of the command stack.
- **Observed:** Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- **Repro and seed:** Fresh profile, 2000x1012, Ch X first menu.
- **Evidence:** critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- **Confidence:** high
- **Requirement:** CHK-008
- **Smallest fix:** Add the command stack to coachActorAvoid's rects at wide sizes.
- **Acceptance check:** 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0276 — (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- **Category:** interface
- **Game:** FFX-2
- **Chapter and state:** IV Bahamut
- **Expected:** Header visible, or scrolling inside the rows only.
- **Observed:** The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- **Repro and seed:** Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- **Evidence:** critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- **Confidence:** high
- **Requirement:** CHK-009
- **Smallest fix:** Make the header sticky, or scroll the rows container only.
- **Acceptance check:** Header box fully inside the list viewport after wheel up and down.
- **Tags:** introducedByCandidate true, regressionVsLive false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0277 — (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** I Seymour Flux
- **Expected:** The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- **Observed:** The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- **Repro and seed:** Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- **Evidence:** critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- **Confidence:** low
- **Requirement:** CHK-005 (says in plain words what to spend the turn on)
- **Smallest fix:** Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- **Acceptance check:** On the same board the card names the raise, then the cure, in that order.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0239 — (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- **Category:** interface
- **Game:** FFX-2 (the rail is shared)
- **Chapter and state:** XI Fallen Aeons, Rikku's Mega-Potion charging
- **Expected:** The two panels do not contradict each other about the same turn.
- **Observed:** The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- **Repro and seed:** FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- **Evidence:** critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- **Confidence:** high
- **Requirement:** Interface: useful advice
- **Smallest fix:** Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- **Acceptance check:** In the same case, the rail and the card agree or the rail defers.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0273 — (new; gap pass): Ch XVII link 3 (on Sin's back) still lists disabled PULL BACK and CLOSE IN rows at the top of the command menu

- **Category:** combat
- **Game:** FFX
- **Chapter and state:** Ch XVII sin-fins-core, link 3 (Sinspawn Genais + Sin's Core), every party menu
- **Expected:** research/ffx-sin.md §1 table, link 3: 'on Sin's back (the party jumps from the ship) ... no Trigger Command'. No order rows in link 3.
- **Observed:** In link 3 the menu reads PULL BACK / CLOSE IN / ATTACK / SPECIAL / WHITE MAGIC / ITEMS, and the engine marks both orders disabled. The stage also still shows the Fahrenheit deck.
- **Repro and seed:** Real-key win seed 1 (gaproute.mjs sin-fins-core, POLICY=xvii): the first link-3 menu.
- **Evidence:** critic/rounds/round-19b/combat/link3-rows.json
- **Confidence:** high
- **Requirement:** research/ffx-sin.md §1 (link 3 has no Trigger Command); CHK-004
- **File and line (traced or suspected as stated):** engine emits disabled 'pull-back'/'close-in' triggers in link 3 (in-process probe combat/gaplink3-out.json); AirshipOrders folds orders only when airship.range is set (src/ui/ffx/AirshipOrders.ts:137); file of the trigger source not traced
- **Smallest fix:** Drop the airship trigger commands from link 3's formation or triggers, or hide disabled trigger rows when no range state exists.
- **Acceptance check:** The first link-3 menu lists no PULL BACK or CLOSE IN row, and in-process the link-3 decision carries no trigger commands.
- **Tags:** introducedByCandidate false, regressionVsLive false
- **Round 19b:** link3-rows.json re-run on c69de96a, identical to round 19.
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### FOC28-P02 — FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- **Category:** interface
- **Game:** FFX
- **Chapter and state:** II and XIV Grand Summon picker, 390x844
- **Expected:** Legible and not clipped.
- **Observed:** Recorded by the focused review of this same build and still open.
- **Repro and seed:** See critic/reviews/6ea8528f-focused.md.
- **Evidence:** critic/reviews/6ea8528f-focused.json (reused, same sha)
- **Confidence:** high
- **Requirement:** CHK-003
- **Smallest fix:** As proposed in the focused report.
- **Acceptance check:** As proposed in the focused report.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0223 — (carried): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- **Category:** delivery
- **Game:** FF7 (hidden experiment)
- **Chapter and state:** FF7 Guard Scorpion
- **Expected:** 0 requests >= 400 on the FF7 pause.
- **Observed:** Not captured in round 17. No FF7 file changed in this candidate.
- **Repro and seed:** FF7 door, then battle, then Esc; record the network log.
- **Evidence:** absent; builder claim only (docs/handoff/r29-load.md)
- **Confidence:** low
- **Requirement:** CHK-017 / CHK-018
- **File and line (traced or suspected as stated):** pause in the FF7 fight
- **Smallest fix:** None until observed.
- **Acceptance check:** FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0247 — (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- **Category:** visual
- **Game:** FFX
- **Chapter and state:** VII, battle, Anima's arrival at 390x844 touch
- **Expected:** The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- **Observed:** At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- **Repro and seed:** Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- **Confidence:** high
- **Requirement:** visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- **Smallest fix:** Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- **Acceptance check:** The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0335 — (new, critic tooling): the phone runs prove battle taps only; START BATTLE, results CONFIRM, defeat RETRY and chapter select were reached by keyboard in the touch context

- **Category:** harness
- **Game:** both
- **Chapter and state:** seymour-flux and ffx2-bahamut at 390x844
- **Expected:** Every step of a phone route proved by touch.
- **Observed:** Bahamut phone: 136 taps and 68 keyboard fallbacks; Flux phone: 31 taps and 38 fallbacks; tapped list holds only row: and target: entries.
- **Repro and seed:** critic/rounds/round-19b/evidence/*-touch/run.json
- **Evidence:** critic/rounds/round-19b/evidence/ffx2-bahamut-win-touch/run.json; critic/rounds/round-19b/evidence/seymour-flux-win-touch/run.json
- **Confidence:** high
- **Requirement:** CHK-015
- **Smallest fix:** Tap START BATTLE, CONFIRM, RETRY and the chapter tile in the route harness; keep the keyboard fallback as a recorded second path.
- **Acceptance check:** A phone route with 0 keyboard fallbacks on those steps.
- **Tags:** introducedByCandidate false, regressionVsLive false

#### PR-0336 — (carried from round 19 unnamed, critic tooling): the save matrix reports a false FAIL for the fresh-profile case

- **Category:** harness
- **Game:** both
- **Chapter and state:** n/a
- **Expected:** The harness passes a correct default save.
- **Observed:** save-matrix.json says 23 of 24 and fails fresh-profile; its unexpectedDiffs (version, chapters {}, unlocked [], seenCoach [briefing], flags {}) are the normal default save; looks, parts, volumes, reload and errors are all correct.
- **Repro and seed:** critic/rounds/round-19b/cap/save-matrix19.mjs
- **Evidence:** critic/rounds/round-19b/evidence/save-matrix/save-matrix.json
- **Confidence:** high
- **Requirement:** CHK-024 evidence quality
- **Smallest fix:** Make expected("{}") the default save shape.
- **Acceptance check:** The matrix prints 24 of 24 on an unchanged build.
- **Tags:** introducedByCandidate false, regressionVsLive false

#### PR-0337 — (new, critic tooling): network and console are logged only for the 24 route runs; the 53 gap-pass sessions and the save-matrix boards carry no response log or verified stamp

- **Category:** harness
- **Game:** both
- **Chapter and state:** n/a
- **Expected:** Every capture session records requests, status >= 400 and console errors.
- **Observed:** network-and-console-summary.json: 3,317 requests for 24 route runs and 0 for each of the 53 gap-pass sessions; the 36 save-matrix board shots carry an asserted screen but no verified stamp.
- **Repro and seed:** critic/rounds/round-19b/gapcap/gaplib.mjs; critic/rounds/round-19b/cap/save-matrix19.mjs
- **Evidence:** critic/rounds/round-19b/evidence/network-and-console-summary.json
- **Confidence:** high
- **Requirement:** CHK-016, CHK-018
- **Smallest fix:** Record requests and console errors in gaplib.mjs and save-matrix19.mjs; stamp the matrix shots through the route runs' screen assertion.
- **Acceptance check:** Every 19c session carries a network and console log.
- **Tags:** introducedByCandidate false, regressionVsLive false

#### PR-0339 — (critic tooling, carried pattern from rounds 17-19): the route harness never wins Ch XIII, XVII or XVIII, and stamps the post-scene capture before the results screen

- **Category:** harness
- **Game:** both
- **Chapter and state:** ffx2-trema, sin-fins-core, sin-face; post-scene in I, II, VII, VIII, VI
- **Expected:** A recorded real-key win through results and back to the board for every included chapter (CHK-022).
- **Observed:** Trema 0 of 6 (0 of 14 over two rounds); Sin chapters defeated twice each; the gap pass Swordplay route hit its 81-turn cap. Five runs record 30-post-scene UNVERIFIED because the harness wants a cutscene while results is up (the scene follows CONFIRM and is captured as 33-after-confirm-scene). The harness enters no Overdrive input on the routes.
- **Repro and seed:** cap/lanes.sh with ffx2-trema win --seed=1|2|3 --attempts=2; gapcap/swordplay.mjs sin-fins-core 1600x900 "" 1
- **Evidence:** critic/rounds/round-19b/evidence/ffx2-trema-win*/run.json; critic/rounds/round-19b/evidence/sin-*/run.json; critic/rounds/round-19b/evidence/gaps/swordplay-sin-fins-core-1600x900-s1/
- **Confidence:** high that it is not a product regression; unknown whether a better bot wins
- **Requirement:** CHK-022
- **Smallest fix:** Teach the route to enter the shown Overdrive input and a race-aware policy for the Sin chapters, raise the turn cap, and read the post-scene after CONFIRM (with PR-0261).
- **Acceptance check:** A recorded win through results, CONFIRM, scene and board for XIII, XVII and XVIII.
- **Tags:** introducedByCandidate false, regressionVsLive false

### Suggestion (9)

#### PR-0328 — (proposal, needs Bailey's yes; R19-PD-02): 22.7 MB of JavaScript source maps ship inside the 800 MB line while 33 MB of adopted art waits for room (D-332)

- **Category:** delivery
- **Game:** both
- **Chapter and state:** build
- **Expected:** Only player-facing files spend the line.
- **Observed:** index-DU_vcl-u.js.map 17.0 MB + two worker maps 5.7 MB in a 798.85 MB build.
- **Repro and seed:** node tools/artifact-manifest.mjs build --dir dist-gate; list *.map.
- **Evidence:** critic/rounds/round-19/prep-delivery/artifact-manifest-dist-gate.json
- **Confidence:** high
- **Requirement:** delivery budget D-332; RUBRIC section 8 proposals
- **File and line (traced or suspected as stated):** vite.config.ts:52 (sourcemap: true)
- **Smallest fix:** Build hidden maps and leave .map out of the shipped dist (kept locally).
- **Acceptance check:** Bailey's answer recorded; if yes, no .map in the manifest.
- **Round 19b:** 19b: 798,872,755 bytes, 1,127,245 under the 800,000,000 line; index map 17.06 MB plus two worker maps 5.7 MB (22.77 MB). Whether the line means MB or MiB is Bailey's word (R19B-PD-06).

#### PR-0329 — (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON

- **Category:** interface
- **Game:** both
- **Chapter and state:** pause > EYE CANDY
- **Expected:** As adopted in D-317 ("players who had a look off keep the new parts off").
- **Observed:** A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
- **Repro and seed:** Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
- **Evidence:** critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
- **Confidence:** high (behaviour); taste question
- **Requirement:** D-317; RUBRIC section 7 (inferred items never fail a build)
- **Smallest fix:** None unless Bailey wants it.
- **Acceptance check:** Bailey's answer recorded.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature true
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).

#### PR-0306 — (new, a question for Bailey; R18b-CE-01): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 7 real-key attempts this round (seeds 1, 1001, 2, 1002, 2002 and the gap pass's 1 / 1001; one Active-mode loss besides)

- **Category:** encounter
- **Game:** FFX-2 only
- **Chapter and state:** XV ffx2-den-of-woe, links 2 (Gippal) and 3 (Nooj)
- **Expected:** Bailey decides whether the Den's difficulty is right. The bosses' numbers are sourced; the party level at the Den is an unsourced estimate (research/ffx2-gippal-den-of-woe.md section 5, G-12).
- **Observed:** The capture owner lost 5 of 5 (closest: Nooj at 4,538 / 23,800). The gap pass lost seed 1 and won seed 1001 (32 turns, 324 s) on the same advisor route, and lost one attempt at X-2 BATTLE ACTIVE. Engine bench on the identical engine (round 18, sourced intended line, seeds 1-200): 44/200 at Wait with instant decisions, 3/200 at Active with 2.5 s decisions. The advisor plays legally and sensibly (Remedy for Stop and Curse, Megalixir under Lightfall, Darkness on the shades).
- **Repro and seed:** Production candidate f302f163, fresh profile, setSeed before the first key, real keys following the advisor every turn (critic/rounds/round-18b/cap route18d.mjs). Bench: critic/rounds/round-18/combat/den-stop-frequency.test.ts.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win-s2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/ffx2-den-of-woe-win-gap2/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/xv-active-1600x900-s1/run.json; D:/Final Fantasy/critic/rounds/round-18/combat/den-stop-frequency.json
- **Confidence:** high for the observed rates; no source says what the rate should be
- **Requirement:** RUBRIC section 6 encounter (fair wins and losses); AGENTS.md hard rule 6 (never invent data)
- **Smallest fix:** No code change from the critic. Put the XV figures to Bailey alongside PR-0279 (Sin) and PR-0227 (XIII); if a change is wanted, measure party-side options only (the level estimate or the prep kit) before building any.
- **Acceptance check:** Bailey's decision recorded in docs/target/decisions.json; if a party-side option is chosen, re-run the bench and three real-key XV attempts and report win rates against the chosen band.
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 19b:** Den of Woe won on the first attempt this round (seed 1, 3 links, 51 turns); the rate question is unchanged.

#### PR-0299 — (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- **Category:** audio
- **Game:** both
- **Chapter and state:** all
- **Expected:** RUBRIC s7: an inferred item is asked before it is built.
- **Observed:** src/app/saveSfxBalance.ts moves any 0.35 stored without the marker. The rule works exactly as stated (28 of 28 cases pass), but D-293 marks the existing-save half as inferred, and NOW.md lists it as open for Bailey. A pre-release player who picked 0.35 by hand cannot be told apart from an untouched one.
- **Repro and seed:** Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- **Confidence:** high
- **Requirement:** RUBRIC s7 inferred items; D-293
- **Smallest fix:** Ask Bailey whether this is acceptable. No code change unless he says no.
- **Acceptance check:** D-293's inferred note moves to named, or is reversed by Bailey.
- **Tags:** introducedByCandidate true, regressionVsLive false, inNewFeature false
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0297 — R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- **Category:** target-registry
- **Game:** both
- **Chapter and state:** docs/target/targets.json group picks-0929
- **Expected:** Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- **Observed:** All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- **Repro and seed:** Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- **Evidence:** D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- **Confidence:** high
- **Requirement:** RUBRIC §7 (delivery field, required targets)
- **Smallest fix:** Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- **Acceptance check:** node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged from round 19: not re-observed in 19b; its deciding code is untouched (git diff 8aee1e69..c69de96a changes only src/engine/fx/mix/{MaxMix,clearance,framing,heldShots,hudPanels,masters,plate}.ts and src/ui/ffx2/actionFade.ts).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0217 — (carried): Zombie is kept across a KO (unsourced); the advisor top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- **Category:** combat
- **Game:** FFX
- **Chapter and state:** I, II
- **Expected:** A sourced rule, or the rule labelled as an assumption
- **Observed:** The three-line bench is identical to round 17, zombieReviveTopRows included
- **Repro and seed:** ffx-bench.test.ts
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- **Confidence:** medium
- **Requirement:** AGENTS.md rule 6
- **Smallest fix:** Source the rule or label it
- **Acceptance check:** A written source
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Carried unchanged (combat auditor).
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0227 — (carried, updated): Chapter XIII (Trema) is not won at human pace by real keys, now 0 of 14 across rounds 19 and 19b

- **Category:** encounter
- **Game:** FFX-2
- **Chapter and state:** XIII Trema
- **Expected:** Information for Bailey
- **Observed:** Six attempts on seeds 1/1001, 2/1002, 3/1003: every loss at link 1 (Oversoul Paragon, 77 to 102 turns); the engine bench wins link 1 at 13-14 % at human pace (P of 0 in 14 about 0.13, not significant).
- **Repro and seed:** runs-summary.json
- **Evidence:** critic/rounds/round-19b/evidence/ffx2-trema-win*/run.json
- **Confidence:** medium (Active ATB is wall-clock sensitive)
- **Requirement:** encounter: fair difficulty
- **Smallest fix:** none (a question)
- **Acceptance check:** n/a
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Note:** Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

#### PR-0262 — (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four

- **Category:** narrative
- **Game:** FFX
- **Chapter and state:** results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
- **Expected:** No two chapters share a first-choice quip, and at most two use 'That's it?'.
- **Observed:** src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
- **Repro and seed:** Win I, II and VIII and read the results quip.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-18b/evidence/seymour-flux-win/run.json
- **Confidence:** high
- **Requirement:** narrative: character voice, no repetition across chapters
- **Smallest fix:** Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
- **Acceptance check:** First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.
- **Tags:** introducedByCandidate "unknown", regressionVsLive "unknown"
- **Round 19b:** Re-observed in I, II and VIII.
- **Note:** Seen again on f302f163: Ch I victory results read "...Okay. Next one." (seymour-flux-win/run.json resultsText).

#### PR-0338 — (new, test harness): tests/unit/strategy-ffx2-bahamut.test.ts "heal-only route" takes about 10.8 s against the 15 s limit and timed out once on a loaded machine

- **Category:** harness
- **Game:** FFX-2
- **Chapter and state:** n/a (unit test)
- **Expected:** A unit test well inside its time limit.
- **Observed:** 324-file subset run: 1 failure, a timeout; re-run alone 19/19 pass in 11.8 s.
- **Repro and seed:** npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts on a loaded host
- **Evidence:** critic/rounds/round-19b/combat/vitest-combat-subset.txt
- **Confidence:** high
- **Requirement:** test reliability
- **Smallest fix:** Give that case its own timeout or fewer seeds.
- **Acceptance check:** The case passes inside the subset run under load.

## Resolved this round

- **PR-0307** (fixed): FIXED on c69de96a (FFX only): yunalesca is off the COLOSSUS list; the dome fills the frame at 1600x900, 1920x1080, 2000x1012 and 2560x1440 (plate chosen = today = 0, class hero, no master); at 2000x1012 the first menu matches live 35 (gaps/fm-yunalesca-2000x1012 vs -live35). The 2560x1080 side bands (0.154 = today) are filed separately as PR-0332 (pre-existing, every FFX chapter). Evidence: critic/rounds/round-19b/visual/sheet-yuna-aspects.jpg, evidence/gaps/plate/yunalesca.json.
- **PR-0309** (fixed): FIXED in every captured case (FFX-2 only): Leblanc Rikku to White Mage at 1280x720, 1600x900, 2000x1012 and REDUCE MOTION, Trema Yuna at 1600x900 and 2000x1012, Bahamut Yuna at 1600x900: the three enemy gauge rows and SCAN tags clear every face, no head cut at the top, the changing girl is the focus. Cost recorded under PR-0314 (Trema Paine and the phone get no shot). Evidence: critic/rounds/round-19b/visual/sheet-leb-rikku.jpg, sheet-bah-sc.jpg, evidence/gaps/sc-*/run.json.
- **PR-0312** (fixed): FIXED (both games): Ch IV Bahamut 2000x1012, Active and Wait, two Bahamut actions each: card opacity 1 and 0 fade rows in 9 + 13 timeline samples and 77 + 117 during-enemy samples with the menu up (round 19: 9 and 14 fade rows, opacity 0); advisor meta contrast 13.0:1 (live 14.5:1). The Natus Sensor card covers 0 of Natus at five aspects. The opposite case (no menu up, the fade still fires) is shown only by the builder-side check. Evidence: critic/rounds/round-19b/evidence/gaps/actfade-ffx2-bahamut-2000x1012-active, -wait; gaps/plate/seymour-natus.json.
- **PR-0313** (withdrawn (not reproduced)): NOT REPRODUCED (FFX-2 only): enemyActionPlayedInsideShot is [] in all 20 dressphere changes on c69de96a (0 of 12 in round 19's gap pass); the strict hand-back closes the shot before the next actor. Reopen on any recurrence. Evidence: critic/rounds/round-19b/evidence/gaps/sc-*/run.json.

Merged this round:
- PR-0308 <- combat PR-0308 + gap pass "Dragon Fang shows 7 chips" + confirm
- PR-0269 <- combat PR-0269 + gap pass "No real-key win path for Sin XVII" + confirm
- PR-0310 <- visual PR-0310 + capture owner "PR-0310 residual" (polish) + confirm
- PR-0311 <- visual PR-0311 + feel cross-reference + confirm
- PR-0330 <- interface R19B-IF-01 + capture owner "Move-advisor card is squeezed"
- PR-0331 <- visual V19B-01 + feel suggestion "Natus, BFA and Evrae lost their master"
- PR-0333 <- visual V19B-03 + interface R19B-IF-02 + feel cross-reference
- PR-0314 <- feel PR-0314 + visual PR-0314 (now rarer)
- PR-0315 <- visual PR-0315 (widened) + feel PR-0315
- PR-0259 <- prep-delivery R19B-PD-01 (with PR-0240)
- PR-0327 <- R19B-PD-05; PR-0328 <- R19B-PD-06; PR-0295 and PR-0258 <- R19B-PD-07
- PR-0316 and PR-0318 split back from the visual auditor's combined entry (two root causes)
- PR-0339 <- capture owner "Route harness cannot win XIII, XVII, XVIII" (harness)

Downgraded or reclassified this round:
- capture owner "PR-0310 residual" polish -> merged into the open major PR-0310 (same root defect)
- gap pass "No real-key win path reached for Sin XVII" major -> merged into PR-0269 and PR-0339: an evidence gap, not a product defect
- CHK-022 capture owner FAIL -> UNVERIFIED: the three win paths are unproven, not shown broken

Confirmation of the top items (confirmer, re-run on rel26c c69de96a):
- CONFIRMED — PR-0308: Bushido and Swordplay ignore the Overdrive chosen. Re-ran od-params-probe on rel26c c69de96a. All four Bushido (Dragon Fang, Shooting Star, Banishing Blade, Tornado) get inputs 7 and the same chip row up down left right cross circle triangle. Only the timer differs (4000/4000/4000/3000). Swordplay sends travelMs 1400 and zonePercent 22 for every tier. The cause is traced to src/battle/ffx/overdrive.ts:313-316, which hard-codes inputs 7 and zonePercent 22. Canon (research/ffx-combat-core.md V14-V16 and 5.5) gives different sequences: Dragon Fang is 8 inputs (down left up right L1 R1 cross circle), Shooting Star 7 and Tornado 6. The overdrive.ts, minigames and tactics files are unchanged from 8aee1e69 to c69de96a, so this is carried, not a regression. FFX only. I did not run the real-key in-game repro. Fix recommendation stands, with the button order settled by GameFAQs or the Steam copy.
- CONFIRMED — PR-0269: advisor line loses Chapter XVII and is unreliable in Chapter XVIII. Re-ran sin-fins-advisor.test.ts on rel26c. The advisor chain wins 3/40 on XVII. Losses are 13 at link 2 to Ram, 7 at link 2 to Smack, 7 at link 3 to Sigh, and a few more at link 3. This matches the reported 3/40. I did not re-run the XVIII bench or the real-key owner routes. I rely on the round-19b run.json evidence for those, and the src/engine/tactics files are unchanged. Bench harness enters no Overdrive input, so human damage is understated. This is not a regression and FFX only.
- CONFIRMED — PR-0310: party and boss interpenetrate at rest in Ch II, III, VIII. The plate JSONs captured today on the candidate show restGap negative in every chapter listed. Yunalesca is -112, -135, -130 and -183. Braska's Final Aeon is -44 to -100. Evrae is -284 to -454. I did not re-capture in a browser. In the sheet images, Evrae is the clearest case, with Tidus standing inside the serpent's coil. Braska's Final Aeon has Auron and Tidus overlapping its legs. Yunalesca is mild: Auron's shoulder overlaps her train, and she stands on a raised ledge, so it reads as depth. I would class Ch II as minor-to-major and Ch VIII as a clear major. The candidate looks like live 35 in these three scenes. Fixing it changes approved scenes, so it needs Bailey's yes under rule 9.
- CONFIRMED — PR-0311: Yuna Thief dressphere is still a mannequin placeholder. sheet-thief.jpg (round-19b) shows a translucent grey-violet mannequin labelled 'Yuna Thief' on screen in f02, f06 and f16. Rikku and Paine are painted figures. The run.json shows the dressphere shot correctly skipped for the placeholder. This is a pre-existing art gap in FFX-2 Ch VI, which CHK-012 forbids as a final face. I confirmed it from the saved sheet and run.json, not a fresh capture.
- CONFIRMED — PR-0148: no numeric owner listening verdict for the shipped mix. OWNER-VERDICT.md last changed in commit 5e5ef4116 on 2026-09-29. Its entries say no number out of 10 was given (lines 72-92). D-302 and D-303 were adopted on 'I'll go with all your recommendations', before Bailey had listened. D-306 was adopted the same way. D-307, D-308 and D-309 are state 'proposed' with words null. Agents cannot hear, so CHK-B1 stays owed. This is not a regression.
- CONFIRMED — PR-0099: nine chapter rows still play a stand-in cue. docs/audio/THEMES.md rows VI, X, XII, XIII, XIV, XV, XVI, XVII and XVIII are each marked 'stand-in' or 'owed, stand-in in use' (lines 645-668). For example, VI uses Chapter IV's cues, X uses Chapter VII's battle cue, and XVII and XVIII use Chapter VIII's cues. THEMES.md is shared by main and rel26c. I did not check the IX scene row. This is not a regression. I started no servers (I read saved evidence and ran vitest only), so none were left running and no port needed closing.

## What stands between this build and acceptance

- The audio category has no number until Bailey gives a listening verdict (CHK-B1, PR-0148).
- Seven categories sit under the 9.0 floor: encounter 8.9, visual 8.9, feel 8.2, narrative 8.9, interface 8.5, onboarding 8.6, delivery 8.5.
- 8 majors stay open: PR-0148, PR-0308, PR-0269, PR-0310, PR-0311, PR-0099, PR-0270, PR-0222.
- Three encounters have no complete real-input win flow (XIII Trema, XVII Sin fins and core, XVIII Sin face; CHK-022 UNVERIFIED).
- Mandatory checks failing or unverified: CHK-001, CHK-002, CHK-003, CHK-006, CHK-008, CHK-012, CHK-020, CHK-022, CHK-023, CHK-B1.
- 17 required targets unverified and 6 waiting on Bailey; 11 human judgments unrecorded.
- Live verification of the exact artifact (only after a deploy), and the single-lane performance measurement.

## What changed since the previous round (round 19, candidate 8aee1e69)

- The candidate is round 19's plus the r36fix HOLD fixes; only src/engine/fx/mix (seven files) and src/ui/ffx2/actionFade.ts changed, no art, audio, data, story, save or battle code.
- Fixed and measured on this bundle: PR-0307 (Yunalesca plate, the regression that held round 19), PR-0312 (cards fading over the boss, the second regression), PR-0309 (dressphere shot over faces). PR-0313 not reproduced in 20 changes.
- Narrowed: PR-0311 keeps its art gap but the close-up no longer frames the mannequin; PR-0310 no longer worsens under a master (fail closed), but Ch II, III and VIII still overlap at rest as on live.
- Cost of failing closed: the colossus master ships for Yojimbo and FFX-2 Bahamut only (PR-0331, a question for Bailey); the dressphere shot is rarer (PR-0314, now STALLED).
- New this round: PR-0330 (advisor card squeeze, a polish regression against live 35 that was already in round 19's candidate), PR-0332 (2560x1080 plate bands), PR-0333 (phone Bahamut head), PR-0334 (twirl-start block, low confidence), harness items PR-0335 to PR-0339.
- Scores moved: visual 8.7 to 8.9, feel 8.1 to 8.2; all other numbers held. Rubric v1 rounds 02 and 03 are history under another rubric and are not compared.
- Round 19 said HOLD; this round says SHIP.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- Ship hidden source maps (PR-0328): frees about 22.8 MB of the 800 MB line for the 33 MB of adopted art waiting under D-332. Benefit: room for adopted art without a new budget. Cost: a build-config change plus local map storage. Fit: neutral to both games. Risk: harder production debugging. Preview: the manifest before and after. Nothing is built without Bailey's yes.
- Give Natus its colossus master back by steering the Sensor card off the boss (builder's proposal, PR-0331). Benefit: D-316's presence for the Ch X fight (about 470 px instead of 160-190 px at 1600x900). Cost: one card-steering rule plus the plate and gap gates already built. Fit: FFX only. Risk: card placement regressions like PR-0330. Preview: a 1600x900 and 2000x1012 first-menu still beside live 35. Nothing is built without Bailey's yes.
- Re-stage Ch II, III and VIII so the party stands clear of the boss (PR-0310). Benefit: no one inside Evrae's coil or BFA's legs. Cost: per-chapter slot changes. Fit: FFX only. Risk: it changes approved scene compositions (rule 9), so it needs 2-4 stills first. Nothing is built without Bailey's yes.
- When the dressphere shot finds no clean frame, offer a small push-in on the changing girl instead of no shot (PR-0314). Benefit: every change gets its beat, including Trema Paine. Cost: one more framing candidate. Fit: FFX-2 only. Risk: the push-in itself must clear panels. Preview: a timed contact sheet. Nothing is built without Bailey's yes.
- Critic tooling (no product change): teach the route harness the shown Bushido/Swordplay input, a race-aware Sin policy and the post-results scene order (PR-0261, PR-0339); add network logging to the gap and matrix libraries (PR-0337); fix the matrix's fresh-profile expectation (PR-0336); tap every phone button (PR-0335).

## Server hygiene and notes

- Chief: started no server and opened no browser; at about 05:33 local Get-NetTCPConnection showed no listener on any port 5400-5990. Capture owner stopped vite preview 5950 (PID 50036) and 5951-5953 by their own PIDs (netstat confirmed closed); the gap pass stopped 5950 (PID 64148) by its PID and confirmed the port closed; the auditors and confirmer started none.
- The relayed chat message (Bailey's delegation rule) is a standing instruction to the orchestrator; it did not change this task. The chief did its assigned consolidation itself.
- About 165 minutes wall clock (02:58 to about 05:43 local): capture owner 135 min (lanes in parallel), six auditors in parallel (about 10-70 min each, finished by 05:08), gap pass about 20 min, confirmer about 2 min, chief about 12 min. Repeated work avoided: combat benches, front-end tiles, narrative and audio technical evidence reused with dependency arguments.
- Inputs of this consolidation (auditor, capture, gap and confirm results) are kept in critic/rounds/round-19b/chief/inputs/; the report is generated by critic/rounds/round-19b/chief/build-report.mjs and render-md.mjs.
