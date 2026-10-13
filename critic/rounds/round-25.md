# Round 25: deep review of the live build main fcecfa74 (bundle CvOwYJX5)

```text
Build / artifact / target version: main fcecfa74, bundle CvOwYJX5, artifact dfbabd7ae7a1... / targets.json ba8a7e74a9d6...
Review: deep (round 25, rubric v2), judged on https://echoesofspira.com/, headless Playwright from node, PYREFLY_BROWSER=gpu, no black canvas, no fallback
Deployment: PASS
Changed area: FAIL
Ship: SHIP (No critical defect (crash, lock, lost progress, an encounter that cannot finish) was found, introduced or left reachable); the majors this release discloses: PR-0380, PR-0295, PR-0148, PR-0099, PR-0421
Milestone: not assessed
Quality: score: PROVISIONAL — no verified score for audio, prep, delivery (never averaged away, never zero); no earlier full score exists for this build; round 24 (72973096) was also provisional
Targets: required 51 / matched 37 / failing 0 / unverified 13 / waiting on decision 1
Top issues: PR-0380, PR-0295, PR-0148, PR-0099, PR-0421 (see the ranked list)
Coverage: tested, reused with reason and not tested are in the matrix below; the required list of this round was attempted in full, results recorded
Next required review and why: the deep obligation moves to the next build; audio, prep and delivery carry no number and a dozen mandatory checks are FAIL or UNVERIFIED
Elapsed review time / repeated work avoided: about 660 minutes wall; the 5,169-file live comparison and the round-24 audits that did not depend on changed data were not repeated
```

## Score output (critic-score, verbatim)

```text
score: PROVISIONAL — no verified score for audio, prep, delivery (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, narrative, interface, onboarding
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio, prep, delivery
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-005 is UNVERIFIED
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-010 is UNVERIFIED
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 5 critical or major issue(s) remain open
  - 13 required target(s) unverified
  - 1 required target(s) waiting
  - only 37 of 51 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix and the 9 ElevenLabs cues of 2026-10-10 (CHK-B1, PR-0148, PR-0099)
  - human judgment not recorded: Feel: Bailey's play of the KO dissolve (a fall or a dissolve?), the 80 ms recoil, the real-clock blends and the camera cuts (CHK-B2, PR-0378, PR-0437)
  - human judgment not recorded: Narrative: Bailey's story read (CHK-B3); scripts unchanged except the music keys
  - human judgment not recorded: Visual: is the colour change between a figure's pose paintings acceptable (PR-0436); the Leblanc backdrop tile 35, picture or written pick (PR-0399)
  - human judgment not recorded: Encounter: the human-pace target for FFX-2 Ch V, XIII, XV (PR-0227, written method check owed); Ch XVIII now the easiest chapter and Ch IX random play (PR-0447, PR-0448); the Ch III gauntlet length (PR-0257)
  - human judgment not recorded: Audio: boss-seymour and chapter-select as heard or narrowed (D-582, PR-0446); defeat and Ch IV victory cues (PR-0410); Ch XII and XV battle stand-ins and the scene beds (PR-0099)
  - human judgment not recorded: Narrative: the Ch V wipe versus timer ending (PR-0444); the retrospective narrator's last line in Ch VII (PR-0445)
report: valid evidence
```

## What this round did differently

Round 24 settled nothing because required coverage was not tested. This round attempted every item of the required list with real input: CHK-022 (real-key wins in Ch II, XIII, XV, XVIII, the Ch XIII link-2 retry three times, the Ch V fourth-fight defeat), CHK-002/003/009 (six-viewport pause matrix and a 14 px DOM sweep over 17 chapters, four phone chapters and the prep tabs), CHK-004, 005, 006, 010, 013, 015, 023, B1 and B2, delivery first load and frame time, and prep tabs 2 to 6 at two sizes. Most results are real PASS or FAIL now; what remains UNVERIFIED is listed with its cause under "What stands between this build and acceptance". After the gap pass the chief ran five captures of its own (cold load, 14 px sweep, Attack confirm timing, title probe, cross-engine smoke); they are in `evidence/gaps/` and `chief/`.

## Verdicts

- **deployment**: The exact artifact is live (CHK-017 PASS: 167-file fresh verify plus the reused 5,169-file comparison) and the capture owner's runs were clean: 34 real-key runs, 0 console errors, 0 not-found.
- **changedArea**: FAIL: the changed motion area still fails CHK-027 (532 jerks; the snap and double-image counts passed or nearly passed), CHK-001 and CHK-B1 cannot be settled without Bailey's ear, and CHK-003 fails on prep. The changed combat area (W5, aeons, Steal, Ch X, Ch XVIII) PASSES with no regression.
- **ship**: SHIP: nothing critical, nothing regressed against 72973096; the five majors are carried and disclosed.

Ship reasons:
- No critical defect (crash, lock, lost progress, an encounter that cannot finish) was found, introduced or left reachable: all 18 listed chapters were won by real keys to results, the board and a reload; save code and schema are unchanged since 931613a8; 0 console errors in 34 runs.
- No regression against the live predecessor 72973096: snaps fell from 0.60 to 0.02 a minute, severe double images from 253 to 44, jerks of 40 px or more from 1,043 to 532, Chapter XVIII went from 0 to 100 percent, Chapter XIII got its first real-key win, FFX-2 win rates equal round 24 within noise, PR-0425 and PR-0424 resolved.
- Every major is a carried defect that is neither a regression nor introduced by this change (PR-0380, PR-0295, PR-0148, PR-0099) or is not re-observed (PR-0421, inside the 39.4.4 phone and camera rig); they are disclosed in the release announcement and carried into the next batch.

## The ten categories

| Category | Weight | Score |
|---|---:|---|
| combat | 20 | 9.5 |
| encounter | 10 | 8.9 |
| visual | 15 | 8.6 |
| feel | 10 | 8.5 |
| narrative | 10 | 8.7 |
| audio | 10 | UNVERIFIED (no number) |
| interface | 10 | 8.2 |
| onboarding | 5 | 8.3 |
| prep | 5 | UNVERIFIED (no number) |
| delivery | 5 | UNVERIFIED (no number) |

### combat: 9.5

AUDITOR (combat, round 25; live main fcecfa74 bundle CvOwYJX5; no browser; shipped source read and run in D:/pyrefly-r40-rc at bc373d58, which has an empty diff over src, tests, tools and public against fcecfa74). Round 24 was 9.4 on 72973096; up 0.1. tsc --noEmit clean (audit-combat/tsc.out). Unit suites run on that tree: core batch (parity*, re-parity*, ffx*, data-ffx*, battle*) 201 files passed, 8 env-gated skipped, 5,045 tests passed; chapters, ff7, advisor, guide, tactics, trigger, evrae and flow batch 230 files passed, 3 skipped, 2,894 tests passed; zero failures; ffx-engine-golden, ffx2-atb-golden and ff7-golden pass. The rest of the roughly 1,050-file suite (ui, audio, art) was not run here: outside combat. DATA AUDIT, independent of the builder, from the raw jppc .bin files in D:/Tools/rea: (1) all 979 command records re-read with the auditor's own reader equal tests/fixtures/parity/ffx/command_status.json, 0 differences; the new Cancel record 0x3108 is rank 3 in the raw bytes and its flag word 528390 (0x81006) equals Pull back and Talk in the repo fixture; (2) the aeon recovery counts re-read from ply_rom byte 0x2b are Valefor 8, Ifrit 12, Ixion 20, Shiva 20, Bahamut 24, Anima 24, Yojimbo 24, Cindy, Sandy and Mindy 30, equal to src/battle/ffx/aeon-gear.ts, 10 of 10; (3) CTB tick and opening-jitter table from ctb_base.bin equals the engine for Agility 1 to 255, 255 of 255 rows; boundary values Agility 10 tick 14, rank 3 = 42, Haste 21, Slow 84, Agility 255 tick 3 and Haste+Slow 8 match research/re-ffx-ctb-status.md. (4) The W5 Overdrive gauge was checked against the live runtime: 177 of 177 Stoic gains in the capture owner's real-key battle logs (all FFX chapters, 9 capped events skipped) equal floor(damage x 30 / max HP) + 1 per hit, using the member's max HP (6,492 or 9,999 under Stamina Tonic); script-driven gauge causes (warrior, healer, comrade, victor, aeon-damage, aeon-attack, aeon-ko, spent, grand-summon, talk) all appear in real play. Not independently re-derived: the aeon equipment crit bonus of 6, Pierce on nine aeons and Break Damage Limit on five (read by the builder from FFX.exe in an emulator; the dependent tests parity-ffx-engine-aeons, parity-ffx-aeon-stats and the goldens pass), and the steal chance schedule beyond the first steal (kernel proven by the builder's golden vectors; two first-steals seen live). MECHANICS RUN: fresh-seed (3001 to 3100) intended-line win rates on the whole chain: I 100, II 94, III 92, VII 95, VIII 95, IX 99, X 97, XII 87, XIV 92, XVII 86, XVIII 100 of 100; they reproduce the builder's 500-seed table inside noise (II 469/500, X 485, XVIII 500, VII 488) and round 24's (X 62 to 97 by the reflect line; XVIII 0 to 100; II 100 to 94 from the summoner's recovery rule, disclosed by the builder; I 99 to 100). FFX-2 on seeds 3001 to 3060 (the FFX-2 engine is untouched by this build; round 24 in brackets): IV 60 (60), V 54 (50), VI 59 (59), XI 60 (59), XIII 24 (22), XV 25 (24), XVI 60 (60): no regression. Credibly wrong lines on seeds 4001 to 4040: attack only, defend only and random win 0 of 40 in I, II, III, X, XVIII, VIII and XVII (the passive lines in XVII end only at the designed 400-turn stalemate); Chapter IX random play wins 9 of 40 (items are legal; see R25-ENC-03). Chapter XVIII ladder, 100 seeds: the old line with no Wards 1, old line with Wards 18, new line with no Wards 72, new line with Wards 100: both levers matter, equals the builder's. Runtime invocation (CHK-023): Cancel used by real keys in Chapter XVII ('Tidus cancels the order' x2), Evrae's one-order menu used (Pull back x2, Close in x1), Rikku Reflect on Natus and Mortibody's Cura bouncing onto Tidus (no heal on Natus), Gaze x7 in Chapter XVIII with zero Petrify, Confuse or Zombie landing on the Warded party, Steal 'Stole Hi-Potion' from both Guado guardians, five distinct aeons each summoned once and KO'd across Braska's links (consistent with the game's long recovery counts), Auron's Dragon Fang by real key press in Chapter XVIII, Bahamut's Mega Flare, spherechanges by real keys in Chapters V, XI and XVI. Open and carried: PR-0383 (aeon menu offers a Defend row that the Aeon Ribbon's Defend immunity makes inert; reproduced on seeds 5001 to 5010 with Bahamut), PR-0427 (reactions ignore the can-act gate; src/battle/ffx/ticks.ts untouched by this build, not re-run). NOT SHOWN by real input: the third Talk in Chapter III (offered, speech only), the airship Cancel in Chapter VIII, and the 'fewer than two standing' branch of the Chapter XIII retry rule.

### encounter: 8.9

AUDITOR (encounter, round 25; same build and tree as combat). Round 24 was 8.5; up 0.4. GAINS. PR-0279 is resolved: Chapter XVIII was won by real keys at seed 1 (sin-face-win: 47 party turns, fight 3:41, results, post scene, chapter-select board and reload, Wards blocked all 7 Gazes), and the engine wins 100 of 100 fresh seeds and 40 of 40 for the shipped line and 30 of 30 for the advisor card (round 24: 0 of 100 and 1 of 30); the 12-turn Giga-Graviton rule is the game's (research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md section 7.2) and was not tuned. PR-0353 is resolved: Chapter XIII has its first real-key victory in eight reviews (ffx2-trema-win-t8: attempt 2, seed 1003, 244 turns, 33 minutes, results 'Victory'); the engine intended line wins it 24 of 60. PR-0407 is narrowed: in ffx2-trema-win-lose2 two retries from a link-2 loss reopened at Trema with all three girls standing (Yuna 9,079, Rikku 9,999, Paine 8,412 of 9,999, a4-33-retry-battle.png); the restore rule (commit 95fb69aa) is in 39.4.4 and live and unit-pinned. PR-0306 improved: Chapter XV won at seed 1 by real keys (37 turns, 7.4 min). Chapter X rose from 62 to 97 percent by the Bailey-picked 'reflect' line, whose every step is cited (research/ffx-seymour-natus-highbridge.md, Jegged) and which wins by real keys (26 turns). All 18 listed chapters now have a real-key win in this round (Chapter II only through a labelled harness target patch, PR-0397; Chapter III needed 32 minutes against the default 15-minute budget; Chapter XVII 19 minutes). Chapter V real-key: seed 1 lost link 1 in 4 turns, seed 1001 lost link 2, seed 2 won in 27 minutes (five links); the fourth-link defeat reached 'Defeat' and Retry. LOSSES AND LIMITS. Chapter II fell from 100 to 94 percent because the summoner now pays her Summon's recovery (the game's rule, builder-disclosed, sourced; not a defect). Chapter XVIII is now the easiest chapter (100 percent; Bailey kept it, R25-ENC-04 is a question, not a defect). FFX-2 human-pace play stays hard: advisor-card follower at the Wait-split pace, 30 seeds, Chapter V 16/30 and the chapter's own line 13/30 (zero-delay engine 54/60), XIII card 8/30 and line 10/30, XV card 11/30 and line 9/30 (R25-ENC-01). Advisor card against the intended line (30 seeds): Isaaru 14 against 25, Yunalesca 28 against 29, Natus 29 against 29 (round 24: 83 against 63), Chapter XVII 22 against 23, Flux 30 against 29, Omnis 30 against 25 (PR-0422 stays, Isaaru is the one that trails). Chapter XVII card chain 73 percent (PR-0269: round 24 measured 48.5 percent: improved). Chapter III gauntlet is still about 2.3 times the sourced rows (218 turns this round; PR-0257). No enemy stat, HP, immunity, attack list or phase rule changed in the build except the sourced Overdrive-gauge, aeon-recovery and menu rules; every changed encounter number traces to research/re-ffx-overdrive-steal-aeons.md, re-ffx-ai-evrae-yojimbo-isaaru-sin.md or re-ffx-ai-yunalesca-bfa.md and its golden vectors.

### visual: 8.6

Scored 8.6 for the tested scope: all 18 live chapters at 1600x900 (real-key win routes; first menu and mid-fight frames read for every chapter), Ch I and Ch IV at 2000x1012 and 390x844, the six-viewport pause matrix, and the 18-chapter continuity harness (dedicated run, 59.6 fps, pose registration on). No browser was opened by me; PYREFLY_BROWSER=gpu is the capture owner's mode. (1) Approved art intact: verify-approved.mjs against D:/pyrefly-r40-rc and D:/pyrefly-r39-int reads 916 ok, 0 mismatched, 0 missing (868 approved + 48 judge-locked); the copy under D:/Final Fantasy is a stale tree (741 ok, 19 mismatched, 47 missing) and is not the shipped source. (2) Target gate: 51 required, 37 matched, 0 failing, 13 unverified, 1 waiting on a decision (composites in critic/rounds/round-25/targets/). (3) CHK-026 PASS: 0 of 10,072 judged swaps over tolerance, worst head 25.7 percent silhouette-read against 30 percent, 0.2 percent where registered, worst feet 1.5 px. (4) The new KO motion (tilt-fall, 3-frame dissolve, revive mirror) reads as one continuous painted figure in every strip read (Rikku and Yuna Ch V, Auron and Tidus Ch II, Shiva Ch III, Sandy Ch XI): snaps fell from 89 (0.60 per min, r24) to 3 (0.02 per min); double images of severity 0.4 or more fell from 253 to 44; jerks of 40 px or more from 1,043 to 532. Remaining visible weaknesses hold the score below 9: boss pop-ins and teleports with no fade (Anima Ch XI 967.7 px, Overdrive Sin Ch XVIII 341.8 px, Paragon Ch XIII 355 px), three boss cast-to-idle hard cuts and 36 of the 44 double images on Sin's Right Fin (Ch XVII), a Yuna bent-over to upright head jump of 226 px in one frame (Ch XV), the pale rim and loose chips on Bahamut's wings at 1600x900 (PR-0423 confirmed in a 1.6x crop), HUD plates and first-time cards standing over painted figures (Ch II, XII, XVII), and the Leblanc backdrop picture that still disagrees with Bailey's written pick (target waiting). Not scored down: the approved paintings themselves. Sub-score caps (RUBRIC 6a): CHK-026 PASS so none on characterModels or animation; snaps per minute 0.02 is under 0.25 so none on animation. Not covered: hidden chapters, KO sequences at 2000x1012, the pause CHAPTER tab, phone victory results, calm-camera framing. CHIEF: the Yuna ready-to-item strip shows a colour change of outfit at the swap that the harness cannot see (PR-0436); the Shiva KO strip shows a short dissolve rather than a fall (PR-0378). Neither moves the number: the first is a question about approved art, the second is already in the 8.6.

### feel: 8.5

Round 24 was 7.7; +0.8. Evidence read: the continuity harness (18 chapters, 8,956 s of battle, 59.4 to 59.8 fps, PYREFLY_BROWSER=gpu, real keys, live https://echoesofspira.com/ bundle CvOwYJX5), the transition strips, the gap pass's event-locked clips (summon, dresssphere change, chain seam, scene to battle) and the capture owner's 180 ms timed sequences. MEASURED GAINS: snaps per minute 0.60 to 0.02 (3 hard cuts in 8,956 s; the 0.25 limit passes, so the animation sub-score cap of 7.5 is lifted); swaps with a double image of severity 0.40 or more 253 to 44 (36 of the 44 are Chapter XVII's Right Fin; worst 0.436, was 0.465); jerks of 40 px or more 1,043 to 532; CHK-026 PASS (0 of 10,072 swaps over tolerance, worst feet 1.5 px). STRIPS READ: KO is now a fall that blends down over about 14 frames and lands (Auron in Ch II, Rikku and Yuna in Ch V, Shiva in Ch III), and the revive rises from the floor through a 2 to 5 frame blend (Rikku Ch VII, Rikku Ch V): Bailey's one-frame KO cut (PR-0378) is gone. The Overdrive-free first minute of Ch I: scene to battle in about 0.7 s, Seymour's Lance lands with a numeral at 0.72 s, a name plate and a portrait slide-in hand control back in 1.1 to 1.4 s. Summon: confirm to Yuna's cast pose 0.27 s, Valefor on screen about 2.8 s after confirm, menu back at about 4.3 s (reads clearly, flash and blend, no dead frame). Dresssphere change: confirm to twirl 0.24 s, Gunner pose and name tag held about 1 s, menu back 2.2 s after confirm. Chain seam (Ch V link 2): party fades in at 0.0 s, name plate 0.9 s, whole handover 1.3 s. Esc, P, H and the chip pause correctly at the top row, in a submenu (Esc steps back one level), while targeting (Esc cancels, P pauses) and during an action (Ch I and VI, real keys). All 18 chapters ran to an outcome with 0 stall recoveries in the winning runs. REMAINING BREAKS: CHK-027 still FAILS on 532 jerks of 40 px or more (323 at a swap, 209 mid-move) and 44 severe double images. About half the head jumps at swaps are the revive rise itself (a lying figure standing up) and are by design; the rest are boss and large-figure events: Paragon (Ch XIII) moves 51.9 px sideways at every idle/attack swap (52 times) and 355 px at a turn start; Right Fin cast to idle snaps 346 px in one frame and Left Fin and Evrae 'gathers'/'inhale' cast to idle are hard cuts (the 3 remaining snaps); Anima's wing appears in one frame at 968 px (Ch XI, unchanged worst, a pop-in entrance); Overdrive Sin's head is cut in at 342 px (Ch XVIII); Tidus teleports 295 px at a run-in start in Ch XVII. NOT SHOWN: no Overdrive input window or chain-seam clip (the special clips are menu cycling only), the plain-attack clip never played an attack in 10 s (the target step stayed up after the harness's confirm; cause not established, so not counted as a defect), no input latency measured, no Bailey play (CHK-B2). The continuity harness could not see motion in cutscenes, effects drawn by no plane, or the camera itself. Fan lens: the visible breakers left are the fins' two overlapping arms for 4 frames, boss pop-in entrances and Paragon's sideways step. CHIEF: the KO strip (Ch III swap-261) shows a dissolve of about 4 frames, not the 14-frame fall the auditor wrote; both readings agree the one-frame cut is gone. The first-time fan's camera-cut and flash items are filed as polish questions (PR-0437, PR-0438) and are not scored down.

### narrative: 8.7

Round 24 was 8.7 on 8 chapters; this round the text actually shown in the real flows (run.json dboxTimeline, results text and after-results scenes) was read for all 18 chapters against research/writing-bible.md, so the score now covers the whole scope; it holds because the one-line defects are unchanged. FFX (elegiac): Ch I carries every canonical beat of the bible's beat map (Kimahri's charge staged in the script, Seymour's late-Ronso line, Jecht-is-Sin and the bargain, Yuna's refusal, the post-fight telling of Yuna by Tidus and Auron, the Fayth Scar, the dream reveal; mid-battle 'Let it in', 'Good. Struggle', 'hold the cure', 'It's charging' all fired); Ch II gives Yunalesca the thesis lines, Auron's 'She killed me for asking that', and a no-hero-speech ending ('We got a no. That's not nothing'); Ch III has Jecht's goodbyes, the ordered aeon farewells (Valefor, Ifrit, Ixion, Shiva, Bahamut), Yu Yevon's noise and Auron's send-off; Ch VII, VIII, IX (Lulu and Lady Ginnem), X, XII, XIV, XVII and XVIII read in character with the first-person retrospective narrator. FFX-2 (buoyant): Ch IV keeps the bible's rule that Bahamut is not celebrated (results titled 'Results', no quip, no fayth, no Shuyin or Lenne; Paine's 'That's a timer.'); Ch VI is the three-beat banter with one sincere beat; Ch V has the Farplane voices, Shuyin and Lenne, the Fayth Boy coda and the Yes/No prompt; Ch XI, XIII (Trema), XV and XVI follow the same register. REACHABILITY (CHK-022): every one of the 18 chapters was won with real keys to results, a scene or epilogue where one exists (12 of 18 have a scene after results; 6 end their aftermath before results), the board and a reload that keeps the clear. OPEN, ALL POLISH AND UNCHANGED OR WORSE: Shuyin's taunt now repeats 4 times in 117 s in Ch V (PR-0429 widened); Ch XIII, XV and XVI open in unattributed third person while FFX-2 chapters are meant to be in Yuna's voice (PR-0390); the results quip '...Okay. Next one.' is on five chapters (I, II, VIII, XVII, XVIII; PR-0262) and Tromell's five Ch VII lines have a blank speaker (PR-0255); Ch VII Talk is still silent (3 Talks, no reply; PR-0254); a wipe in Ch V link 4 gives a plain 'Defeat' card and not the bible's narrative loss; Ch VII's narrator explains the point. NOT SHOWN: the timer-path bad ending (240 Head turns), Ch I's Banish, Flare and Total Annihilation callouts, the scenes' timing (the route skipped the pre-scenes by hold, so text was judged, not delivery pace), and whether the writing sounds like the characters (CHK-B3, Bailey).

### audio: UNVERIFIED

No number, seventh review in a row: the listening half has no numeric owner verdict (CHK-B1, PR-0148) and no agent can hear; I did not listen to anything. The latest recorded ear words about the mix are negative and pre-date this build (Bailey, 2026-10-10, D-682/D-683: 'arcade-y and like snes music again', 'atrocious'); the 7 new cues plus the 2 from 39.4.4 were picked by the driver under delegation (D-702), not by ear, and docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28. TECHNICAL HEALTH of the exact live build (fcecfa74, bundle CvOwYJX5), measured by me with tools/audio/qa.mjs, a separate ffmpeg ebur128/true-peak/decode-error pass, and my own loop-seam script (critic/rounds/round-25/audio/): all 38 audio files on echoesofspira.com fetched live, 38 of 38 byte-identical to the artifact manifest (status 200, audio content types); 35 music cues plus both SFX sprites decode with no errors, none silent, none clip; every cue -15.8 to -16.2 LUFS, true peak -1.08 to -4.53 dBTP (sprites -1.1), loop seams ok (no click at any splice, boss-evrae's 0.45 ms loop-point shift measures a 0.0008 step), qa 0 findings, total 100.80 MB of the 105 MB budget (raised from 100 by driver item 53a under Bailey's 2026-10-10 words). PR-0425 is RESOLVED: all 8 narrowed ElevenLabs cues now pass the stereo gate (corr 0.696 to 0.703, side-to-mid -7.5 dB, mono loss -0.71 to -0.72 dB; boss-ff7-guard passes unchanged at 0.629). PR-0424 is RESOLVED: themes-audit chapter map 0 of 18 chapters depart and the 43 audio vitest files (694 tests) pass. ROUTING (237 AudioManager samples in 34 real-key runs, all 18 chapters, PYREFLY_BROWSER=gpu): the first battle cue is the one THEMES.md names in 18 of 18 chapters (new cues boss-seymour-natus X, boss-ffx2-fallen-aeons XI and XVI on every link, boss-trema on link 2 of XIII including three retries, boss-isaaru XIV, boss-sin-assault XVII on all links, boss-sin-countdown XVIII, boss-bahamut IV, boss-leblanc VI on both seams); Ch III boss-jecht, script silence at the link-2 seam, boss-yu-yevon; Ch V boss-vegnagun on 4 seams (boss-shuyin fetched, onset not sampled); only the last link of a chain plays victory (the 'two soundtracks' fix holds in V, VI, XI, XIV, XVII); at results the right victory cue is playing in 18 of 18 won fights (12 victory-ffx, 6 victory-ffx2); Ch IV victory and every defeat are silent (PR-0410); no music synth fallback in 168 cached-track observations; 0 console errors and 0 not-found in 34 runs; the 390x844 touch runs reach the boss cue. SFX: the P1 trims and the one menu tick work in play (confirm plays v2 cursor-move with trim 5.3 dB in both games, FFX-2 uses the -x2 twins; trimmed cues peak at most -4.1 dBTP before the 0.70 bus and the master limiter). Open findings: PR-0373 worse on a loaded host (scene cue not yet playing at the first lines in 10 of 30 non-Ch-I runs), PR-0326 (first SFX of a cold session is synth in 33 of 34 runs; battle-start 0 of 34), boss-seymour and chapter-select still fail the stereo gate as shipped (D-582 unanswered). NOT COVERED: ear verdicts; pause open/resume and title-cue timing (no continuous audio log in this round's gap pass, UNVERIFIED not reused because PR-0374 and PR-0373 are open); real phone/pad unlock; the hidden chapters' audio. CHIEF: stays UNVERIFIED: the listening half (CHK-B1) needs Bailey's ear and no agent can supply it; the technical half is green. The gap pass since settled two items the auditor marked UNVERIFIED: the pause hand-back is 0.6 to 0.8 s out and 0.5 to 0.7 s back in both games (PR-0374 not reproduced) and the cold title cue starts 2.1 to 3.4 s after the first Enter.

### interface: 8.2

PROVISIONAL, scored from capture-owner evidence only (no browser opened). Seen at 1600x900 by real keys: all 18 chapters (first menu, advisor card, E intent, G guide, pause, Esc over the pre-battle scene), 9 of them also with target step, plus results, board and reload. Seen at 2000x1012 and 390x844 touch: FFX Ch I and FFX-2 Ch IV. Six-viewport pause matrix (390, 1280, 1600, 2000, 2560x1080, 3840x2160) on live. Real-key pause matrix in Ch I and Ch VI. HOLDS: advisor ownership across 2,484 recorded real-key decisions in 34 runs: 0 menu mismatches (the 42 label differences are harness annotations such as '(one-item group, direct)' and 6 Summon/picker steps whose row opens a picker; engineDid confirms the Summon happened). The card names the submenu and MP cost on desktop (e.g. 'IN WHITE MAGIC 30 MP'). Enemy intent separates SCRIPTED / MOST LIKELY 83% / POSSIBLE 25% with per-target ranges, KO and hit chance; 'random target' wording is honest. No developer vocabulary in any captured HUD text. Single-target cue is obvious in FFX (corner brackets, name chevron, TARGET plate, pointing hand, dimmed party HUD) and FFX-2 (oval ring, TARGET plate, green party-row outline), reticle count 0 after cancel in every captured chapter. Esc and P open the pause from the command-menu top row, a submenu, while targeting and during an animation (Ch I, Ch VI); H hides panels; the pause chip works; real Esc pauses over the pre-battle scene (34 of 34 runs); the pause plate keeps a 2x tier and no ancestor transform at all six sizes; no horizontal page scroll at any size. Battle-end leaves only the results root (no stale battle overlay). FFX and FFX-2 carry the same shared screens with game-specific differences only (CHK-020 PASS). DEDUCTIONS: CHK-003 FAIL (results sub-lines, prep hint strip, pause stat labels measured about 11-13 px at roughly 2.4-3:1 from this round's pixels; 4K coach text about 11-14 px against a 2160 screen); CHK-002 FAIL at 3840x2160 (plate 3392x1938, PR-0293); CHK-009 FAIL at 3840x2160 (affinity chips overprint, PR-0391); new R25-IF-01 (Ch XII intent shows 'TIDUS 4,132-2,333' and 'Deals no damage' above a damage table); PR-0430 now in Ch I and Ch II (sentence ends mid-way / runs on); PR-0357 ghosted ALSO line in Ch IV and VI; story boxes cover the advisor, guide and party HP at the first menu in 8 chapters and at 2000x1012 and 2560x1080 (PR-0370 widened); chapter-select hero card and party portraits blank on arrival and after reload (PR-0384 widened); phone OPTIONS clips its tab strip and shows 3.5 of 10 settings (PR-0372/PR-0321). NOT JUDGED (UNVERIFIED, see checks and capturesNeeded): CHK-005 constructed broken boards, CHK-006 beyond target cancel and battle end, multi-target and all-party target label (the 'all-target' gap captures show one reticle, a harness mislabel), CHK-008 actor-quad projection, CHK-015 results-screen pause and gamepad, prep tabs 2-6 by input, Controls tab, pad, TEXT SIZE frames, 4:3, wide, 1440p. Carried issues not re-observed this round and therefore still open: PR-0302, PR-0303, PR-0304, PR-0305, PR-0292, PR-0295, PR-0286, PR-0288, PR-0291, PR-0296, PR-0324, PR-0325, PR-0363, PR-0389, PR-0392, PR-0393, PR-0413, PR-0414 (sheet drawn dim in Ch VI mid-fight, not conclusive), PR-0416, PR-0422. Not reproduced this round and candidates to close after one more state: PR-0237 (Ch IV phone coach now sits below the intent strip), PR-0412 (Ch VI Attack and Trigger Happy target steps at 1600x900 leave the enemies clear), PR-0250 (Ch I phone results caption fits). CHIEF ADJUSTMENT (8.5 to 8.2): the auditor scored from capture-owner evidence only and had not seen the gap pass: multi-target and all-party steps are evidenced (Cheer ALL ALLIES, Shell, Trigger Happy, Potion, three brackets each) which supports the number, but the party-prep tabs on a 390x844 phone are a desktop frame shrunk to 3 px text (PR-0295, major, two independent captures) and prep, results and the pause headers carry text under 14 px (PR-0356). CHIEF SWEEP (chief/sweep14.mjs, live, real keys, 14 css px floor with the minimum and the count): the battle command menu and the pause (default tab) are clean in 15 of 17 chapters at 1600x900; yojimbo-cavern: Daigoro 12.2px, + Kozuka 12.2px, + Wakizashi 12.2px | seymour-omnis: Colour order: our estimate 12px, Discs 13px, Absorbs 13px, Weak 13px, Enemy intent 13px (minimum 12 px, 0 truncated labels); four chapters at 390x844 read the same (seymour-flux: battle 0/14px, pause 0/14px, truncated 1; ffx2-bahamut: battle 0/14px, pause 0/14px, truncated 1; braskas-final-aeon: battle 0/14px, pause 0/14px, truncated 1; ffx2-fallen-aeons: battle 0/14px, pause 0/14px, truncated 1). The prep screens do not: 11.7 to 12 px key chips at 1600x900 and 2.98 px text in six heavy tabs at 390x844.

### onboarding: 8.3

PROVISIONAL, scored from capture-owner evidence only. The newcomer walkthrough is SIMULATED (a scripted real-key and real-touch route from a fresh profile in headless Chromium, 34 runs); no human newcomer, no real phone, no pad. SEEN AND GOOD: title shows 'B BRIEFING'; Auron's one-time briefing (CTB 'nothing moves until you act' versus ATB 'the clock keeps running until you pick a command'; ENTER/ESC skip, 'D never show again'; 'TAP SKIP' on touch); the three-step coach (board 1 of 3, prep 2 of 3 'The tabs are for later. Start the battle.', first battle 3 of 3 'Pick ATTACK, then pick who it hits.') marked FIRST TIME ONLY / FADES ON ITS OWN with 'ESC SKIP THE GUIDE'; the FFX-2 first-turn coach teaches 'Gauges running, a command holds them'; touch copy says 'Tap its picture' and 'TAP START BATTLE'; Replay Briefing, Restart Encounter in Options; Options carries MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE (100%), REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP, plus X-2 BATTLE (Wait/Active) and ATB SPEED in FFX-2 (flip by real input seen at 390x844); non-colour cues present: filled slab plus arrow on the selected row, element chips carry names, MISS/HIT and gold-zone text on timed inputs, status chips carry words, KO written as text. GAPS: keyboard players are told 'Click its picture to begin' while the footer says ENTER BEGIN, and the card covers chapter rows VII to XII and the location panel (PR-0386, re-observed in 61 of 63 keyboard runs; the touch runs say Tap); OPTIONS has no REDUCE FLASHES, no colour-vision setting and no visible remap row (PR-0032, a proposal for Bailey, not a defect); the Controls tab was not captured, so key listing and any remapping are UNVERIFIED; phone Options clips its tab strip and the settings list (PR-0372, PR-0321); no TEXT SIZE 115/130 frame, no reduce-motion emulation, no pad (PR-0411 pad prep wording not re-captured) and no 4:3, wide or 4K options frame. Round 24 sat at 8.3 on the same evidence gaps; no new onboarding defect and no gain, so the number holds. CHIEF: holds at 8.3: the gap pass confirms TEXT SIZE 115 and 130 are reachable by real keys and clean at 1600x900 in both games and on the FFX-2 phone, with one FFX phone overlap (PR-0435); the Controls tab lists keys with no remap row (a proposal, PR-0032). Phone prep is scored under interface, once.

### prep: UNVERIFIED

No number: the preparation half of this category is still unproved by input (sixth review). Prep screens were never operated past the CHAPTER tab (Stats, Sphere Grid, Equipment, Items, Overdrive; Dresspheres, Accessories, Items): the 34 route runs capture only 04-prep.png (CHAPTER tab, Auron coach, objectives and tip) and no run changes a value and shows it in the first menu. SEEN on live fcecfa74 (headless Chromium, PYREFLY_BROWSER=gpu, real keys): (1) Results: 20 victories and 11 defeats read through a results screen with chapter, time, NEW BEST, AP/EXP, gil and items; sourced-looking rewards identical in shape to round 24 (Ch I AP 10,000 x4, gil 6,000, Lv.4 Key Sphere; Ch IV EXP 1,300 and Gris-Gris Bag; Ch VI EXP 1,640, gil 1,590, Twist Headband x3, Charm Bangle x2, Reassembled Sphere; Ch XIII EXP 23,000, gil 18,000, Dark Matter x2; Ch V EXP 42,400, gil 18,300, Megalixir x5 etc.); Ch III, IX (yojimbo) show 0 AP and 0 gil, Ch XIV 0 gil; Natus shows no ITEMS row again (PR-0352 unchanged). Reward values were read, not source-audited this round (enemy data for Fallen Aeons, Ixion and Trema changed since 931613a8, so round-24 audits are not reused). (2) Retry speed: defeat to a playable retry battle took 7.3 to 11.7 s in 11 measured retries (Flux 11.5 s, Bahamut 8.3, Vegnagun 9.8/10.1/8.2, Trema 11.3/11.8/10.3/10.2/9.1/7.3/8.9/5.9, Yunalesca 46.5/7.9/8.0 where the first figure includes the harness waiting); 390x844 touch Flux 9.3 s and Bahamut 7.4 s. Defeat screens offer RETRY and CHAPTER SELECT. (3) Link retries: Ch V fourth-fight defeat gives 'Defeat' with Retry reached (ffx2-vegnagun-shuyin-win-lose4/31-results.png); Ch XIII link-2 loss thrice, each retry restarts at link 2 (first enemy action is Trema, seq 3) with three girls alive at 7,945 to 9,999 of 9,999 HP (a4-33 and a5-33 captures), so the one-survivor state of PR-0407 was not reproduced in play. (4) Progress reliability: after each of 18 wins the board shows the tile cleared (cleared:[id], beaten 1 in a fresh profile) and the same state after a page reload (boardAfterReload equals boardAfter in all 18; 34 runs, 0 console errors). The cost of a loss is the open part: Ch II stock route lost three seeds (8, 14 and 11 min of fight each, 36 min total) before the win, Ch XIII took 33 min and 244 turns for its one win, Ch V 27 min over five links; the retry itself is fast, the fight it asks for is long (cross-ref encounter, not scored here). Observed subset reads about 8.8; that is not a score because the prep tabs, a changed value reaching the fight, the Key Sphere and Sphere Grid consequences, and 390x844 prep are unseen. CHIEF: the gap pass since opened every prep tab by real input (desktop: all six FFX and five FFX-2 tabs open; phone: the heavy tabs are unreadable, PR-0295). Still not shown: a changed value (an equipment swap, an item allocation, a sphere) reaching the first battle menu, and the reward values were read, not source-audited. Stays UNVERIFIED with no number.

### delivery: UNVERIFIED

No number: first load under five seconds was attempted and is NOT measured, because critic/rounds/round-25/delivery.mjs navigates twice (openRoute loads, clears storage, loads again: the second load is a warm-cache load) and starts its clock after __pyreflyReady, so its msToTitle of 2 ms and DOMContentLoaded of 595 ms are artefacts (R25-PD-01); it also ran while seven or eight other browser routes were running. PROVED on the exact live build fcecfa74 / CvOwYJX5: CHK-017 identity (live manifest artifactHash dfbabd7a...2057 equals critic/artifacts/fcecfa74.json; fresh verify-live this round 167 files, changed set plus 150 sampled, 0 mismatched, 0 missing, 0 wrong content type, index.html equals the artifact once Cloudflare's analytics beacon is cut; the live review's full 5,169-file byte comparison is reused because docs/deploys.log shows no deploy after 2026-10-11T14:44:38Z); 0 console errors, 0 responses of 400 or above and 0 images served as text/html in all 34 route runs; 5,279 media requests (986 unique) all resolve to files in the 5,169-file manifest; manifest decodeChecked true, audioUnverified 0, only the two intentional flat Paine eyeR-catch layers flagged; tools/gen/manifest.mjs --check exit 0 and 297 unit tests of chapter-meta, art-manifest-build, art-ref-defaults, audio-shipped-files and art-shipped pass in D:/pyrefly-r40-rc; flows complete with real keys in all 18 listed chapters to results, board and reload. FRAME TIME measured (continuity harness, one chapter at a time, 1600x900, headless Chromium GPU mode on this host, no throttling, battle frames only, 533,186 frames): average 58.2 to 59.8 fps in all 18 chapters; frames over 34 ms 0.84 percent of the set (round 24: 0.59), FFX 0.54 percent, FFX-2 1.34 percent; worst single frames Vegnagun 778 ms, Braska 497, Sin fins 409, Flux 254; slowest chapters Ixion 2.55 percent, Bahamut 2.23, Fallen Aeons 1.42, Vegnagun 1.41, Braska 0.97. A title-screen sample of 180 frames had median 16.7, p95 16.7, max 16.8 ms. NOT PROVED: cold-cache first load on any named hardware or throttled link, Firefox, Safari, a real phone, a real gamepad, a second GPU, and the post-title download (about 29.7 MB over 26 responses counted after the title was ready). SaveData.ts and the save schema are unchanged since 931613a8 (no new storage key in the diff), so the upgrade matrix is not applicable; the reload smoke held in 18 wins. Observed subset reads about 8.3 (clean artifact, no errors, 60 fps average, but frame hitches of 0.4 to 0.8 s that are worse than round 24 and a headline load figure nobody has measured); not a score because the five-second clause and the browser and device clauses are unmeasured. CHIEF: the first-load clause is now measured: cold load to an interactive title, one navigation per fresh browser, cache disabled, nothing else running (GPU PAUSE held), 1600x900: unthrottled 3.6, 0.8, 0.7 s (about 2.1 MB and 12 requests before the title; the first run is the cold DNS/TLS one); on 1.6 Mbps / 150 ms 11.2 s (2.1 MB, first paint 1.6 s, DOMContentLoaded 11.1 s). Cross-engine smoke: webkit 26.6: title=1793; screen=chapter-select; after-card-enter=party-prep; screen-change=party-prep; screen-change=cutscene; screen-change=battle; first-menu=true; frames={"n":46,"fps":11.5,"medianMs":85,"p95Ms":98,"maxMs":174}; webgl=Apple GPU; rows=["Talk","Attack","Special▸×4","White Magic▸×3","Items▸×27","Flee"]; reticles-after-attack-enter=0; damage-or-rig=idle; errors 0, 4xx 0 || firefox: NOT RUN (the Playwright Firefox 1543 fails to launch on this host, browserType.launch spawn UNKNOWN, twice): UNVERIFIED. WebKit is the Playwright Windows build, not Safari; its 11.5 fps in battle is that build software path and says nothing about Safari.. 

### Visual sub-scores (Bailey's five; not part of the weighted score)

characterModels 8.3, enemyModels 8.1, animation 7.8, fidelity 8.6, camera 7.5 (round 24: 7, 8.4, 7, 8.6, 7.5). characterModels 8.3 (cap lifted: 0 of 10,072 swaps over tolerance, feet within 1.5 px; held down by the pose colour change PR-0436 and the unmeasured pose table). enemyModels 8.1 (8.4 carried less 0.3: boss entrances pop in one frame, the Right Fin double image, Paragon's sideways step, the wing rim PR-0423). animation 7.8 (7.0 capped before; snaps 0.60 to 0.02 and the KO now a dissolve; 532 jerks and 44 severe double images remain). fidelity 8.6 carried, not re-graded (approved art proved intact). camera 7.5 carried: PR-0421 unverified, camera cuts a question for Bailey.

### Continuity harness (CHK-026 and CHK-027)

CHK-026 PASS: 7149 of 10072 measured swaps had a registered head (tolerance 3 percent); 2923 were read by the figure's mass (tolerance 30 percent, whole-figure jumps only); 0 had no reading. CHK-027 FAIL: 532 jerk(s) of 40 px or more in one frame (worst 967.7 px); 44 swap(s) show a double image of severity 0.4 or more (worst 0.436).

| Size | | Motion | |
|---|---|---|---|
| judged swaps | 10072 | snaps per minute | 0.02 (3 hard cuts) |
| worst head, silhouette-read | 25.7 % | ghost swaps / severe (0.4+) | 9628 / 44 (worst 0.436) |
| worst head, registered | 0.2 % | jerks / 40 px or more | 1751 / 532 (worst 967.7 px) |
| worst feet | 1.5 px | battle seconds | 8956.5 |

## Target gate

Required 51, matched 37, failing 0, unverified 13, waiting on a decision 1. Visual auditor's count: 51 required, 37 matched, 0 failing, 13 unverified (the capture lists are in the visual auditor's capturesNeeded: tiles 18, 24, 32, 41, 42, 47, 49, 50 and others), 1 waiting on a decision (tile 35, PR-0399). Round 24: 14 matched and 36 unverified. Frozen art: verify-approved 916 ok, 0 mismatched, 0 missing for the shipped source trees.

## Checks

| Check | Result | Mandatory | Reason (short) |
|---|---|---|---|
| CHK-001 | FAIL | yes | Technical half green: qa strict 0 findings on 35 cues and 2 sprites, ffmpeg decodes all 38 with no errors, every cue -16 LUFS +/-0.2, true peak at most -1.08 dBTP, loop seams ok, 38 of 38 audio files live and byte-identical, stereo gate passes on the 8 narrowed cues (PR-0425 resolved), themes-audit chapter map 0 of 18 depart (PR... |
| CHK-002 | FAIL | yes | Five sizes pass (plate covers or feathers into the window, 2x master, no ancestor transform, no horizontal scroll). 3840x2160 FAILS the strict rule: plate 3392x1938 at (-15,-8), about 463 px right and 215 px bottom dark falloff (PR-0391 / PR-0293, a soft vignette, not a hard bar). |
| CHK-003 | FAIL | yes | Battle menu and pause default tab: 15 of 17 chapters are clean; Ch IX (guard labels Daigoro, + Kozuka, + Wakizashi at 12.2 px) and Ch XII (the disc panel's notes at 12 to 13 px) are not (yojimbo-cavern: Daigoro 12.2px, + Kozuka 12.2px, + Wakizashi 12.2px / seymour-omnis: Colour order: our estimate 12px, Discs 13px, Absorbs 13px,... |
| CHK-004 | PASS | yes | 0 menu mismatches in 2,484 decisions (42 label differences are harness annotations, 6 Summon picker steps fired); cards name the submenu and cost. Residual one-word effects (PR-0330). Not run: a board where the line's move belongs to another character. |
| CHK-005 | UNVERIFIED | yes | No constructed broken board (whole party critical, status-locked caster, no revive stock, telegraphed re-kill) was captured; the natural-play sample (75 decisions with a member at 0 HP, a revive named in 54) neither passes nor fails it. |
| CHK-006 | UNVERIFIED | yes | Two of four exits for one overlay (target reticle gone after Esc in Ch I, VI, IV; clean results root after battle end). Not captured: Overdrive or rage picker, spherechange wheel, submenu slab, telegraph banner through cancel, turn passing, actor dying mid-decision. |
| CHK-007 | PASS | no | No ids, undefined, null, NaN, file names, section signs or research citations in player-facing text across run.json and the screenshots. |
| CHK-008 | FAIL | yes | Panels stand over painted actors (PR-0366 family): Ch II Tidus plate over Auron's legs, Ch XII intent text over the party, Ch XVII first-time card over two figures, story boxes over the advisor and party HP in 8 chapters. Polish level, carried; the actor-quad projection matrix was not run. |
| CHK-009 | FAIL | yes | No clipped or ellipsised label in 17 chapters at 1600x900 (battle menu and pause) including Braska's Final Aeon, Yu Pagoda, Seymour Omnis, Mortiorchis; the only truncation is the icon-only PAUSE chip at 390x844. FAIL at 3840x2160: the Mortiorchis affinity chips overprint (PR-0391). Vegnagun Head and Lady Luck were read on screen... |
| CHK-010 | UNVERIFIED | yes | Single-target selection is clear everywhere captured; the party-wide and all-enemies steps are evidenced by the gap pass (Ch I Cheer ALL ALLIES, Ch IV Shell and Potion, Ch VI Trigger Happy: three brackets and a label each) but Hastega, Ch XII and the marker area and contrast measurement at 1280 and 2560 were not done. |
| CHK-011 | UNVERIFIED | no | No hidden or unreachable enemy in the 11 chapters read; the target frames for Ch III, VIII, XI, XIV, XV, XVI, XVII, XVIII were not read. |
| CHK-012 | PASS | no | Every figure read is a painted cut-out; no placeholder box or fallback face; hidden chapters not covered. |
| CHK-013 | PASS | yes | The art reads in the running game as the approved house look at the sizes captured; approved-art hashes intact (verify-approved 916 ok, 0 mismatched, 0 missing). Limit: two chapters at 2000x1012 and phone; the pale rim on Bahamut's wings (PR-0423) is a cause-unknown matte question. |
| CHK-014 | PASS | no | Party faces right, bosses face left, feet on the ground rings in all 18 chapters. |
| CHK-015 | UNVERIFIED | yes | Proved in Ch I and Ch VI: Esc and P at the top row, inside a submenu (Esc steps back one level), while targeting (Esc cancels, P pauses), during an action; H, N, E, G; the chip. Not proved: any gamepad input, Ch IV single-target cancel, Ch I Esc while targeting, pause on the results screen and during a cutscene. |
| CHK-016 | PASS | yes | 887 of 891 route items and 31 of 32 gap items carry a verified read-back; the 6 UNVERIFIED captures (five 30-post-scene slots, PR-0431; the Ch IV after-Esc target frame) were not used as proof. |
| CHK-017 | PASS | yes | Live manifest artifactHash dfbabd7a...2057 equals critic/artifacts/fcecfa74.json; a fresh 167-file verify (the changed set plus 150 sampled) found 0 mismatched, 0 missing, 0 wrong content type; the live review's full 5,169-file byte comparison is reused (no deploy after 2026-10-11T14:44:38Z). Every run used the live bundle index... |
| CHK-018 | PASS | no | No hand-written shipped path; 5,279 media requests in 34 live runs all resolve to the manifest; 297 unit tests pass. |
| CHK-019 | PASS | no | decodeChecked true, audioUnverified 0, only the two intentional flat Paine eyeR-catch layers flagged; 0 images served as text/html. |
| CHK-020 | PASS | no | FFX and FFX-2 screens compared pair by pair at 1600x900 and 390x844; differences are the written game differences; the combat auditor confirms the per-change game case (W5 gauge, aeons, Steal, Cid's menu, Braska Talk, Ch X and Ch XVIII lines FFX only; music keys FFX-2 only; KO and blends both). |
| CHK-021 | PASS | yes | git diff 72973096..fcecfa74 over src/battle/ffx2, src/battle/ff7 and src/data/ff7 is empty; src/data/ffx2 changes three music cue keys only; src/battle/common/types.ts changes doc comments only; ffx2-atb-golden 6 of 6 and ff7-golden 3 of 3 pass; FFX-2 win rates equal round 24 within noise (IV 60, V 54, VI 59, XI 60, XIII 24, XV ... |
| CHK-022 | PASS | yes | Every listed chapter reached a real-key victory with results, the board and a reload that kept the clear, including the four with no round-24 win: Ch II (only with a labelled harness target-id patch, PR-0397; the stock route lost three times), Ch XIII (seed 1003 after five lost attempts), Ch XV and Ch XVIII (first attempt). Ch X... |
| CHK-023 | UNVERIFIED | yes | PASS for most changed paths through the real runtime: W5 gauge (177 of 177 Stoic gains equal the formula), Cancel in Ch XVII (x2), Chapter X reflect line, Ch XVIII Wards and Doublecast, Steal, aeon recovery, Braska's first two Talks, Dragon Fang by real key, audio routing (battle cue right in 18 of 18 chapters, victory cue once ... |
| CHK-024 | PASS | no | Board after reload equals board before in 18 of 18 won runs; no change to src/app/SaveData.ts or the schema since 931613a8. The upgrade matrix is not applicable (persistence unchanged) and was not run. |
| CHK-025 | UNVERIFIED | no | Tile count is 18 on every board and no hidden card shows, but a hidden-experiment run leaving the main save key byte-identical was not captured. |
| CHK-026 | PASS | yes | 0 of 10,072 judged swaps over tolerance (7,149 head readings from the pose registration, 2,923 from silhouette mass at 30 percent); worst registered head 0.2 percent, worst silhouette-read 25.7 percent, worst feet 1.5 px. The capture owner's inline probes read FAIL on a loaded host without the pose table (PR-0450); they are not ... |
| CHK-027 | FAIL | yes | 532 jerk(s) of 40 px or more in one frame (worst 967.7 px); 44 swap(s) show a double image of severity 0.4 or more (worst 0.436). Snaps 0.02 a minute (limit 0.25; r24 0.60) and severe double images 44 (r24 253): both improved a great deal; the two failing counts remain. CHK-027 FAIL in 17 of 18 chapters (only Ch IX passes). |
| CHK-B1 | UNVERIFIED | yes | No agent can hear. No numeric listening verdict exists for the shipped mix or the 9 ElevenLabs cues of 2026-10-10; Bailey's last ear words (D-682, D-683) are negative and about the previous mix; OWNER-VERDICT.md has no entry after 2026-09-28. |
| CHK-B2 | UNVERIFIED | no | Needs Bailey's own play of the KO fall, the 80 ms recoil and the real-clock blends. Agent-side: confirm to first visible response 0.24 to 0.27 s (summon, dresssphere) at 40 to 46 fps under load; no true input latency measured. |
| CHK-B3 | UNVERIFIED | no | Whether the writing sounds like the characters is Bailey's call; the text was read against the bible for all 18 chapters. |
| CHK-B4 | NOT APPLICABLE | no | No proposal is built or counted as built in this review; the proposals section is unscored. |

## Encounters (real flow)

- **seymour-flux (I, FFX)**: win (seed 1, 9.5 min) with results, post scene, board and reload; lose and retry reached battle; repeated at 2000x1012; lose at 390x844 touch. evidence/seymour-flux-win, -lose, -win-w2000, -lose-p390-touch. Continuity run on the win: 0 snaps per minute, 21 jerks of 40 px or more (worst 185 px).
- **yunalesca (II, FFX)**: stock route: three defeats (seeds 1, 1001, 2001) and Retry reached. Win on seed 1 only after a labelled scratch harness fix (PR-0397 target-id patch, in round-25/lib): victory in 16.1 min, 160 turns, results, post scene, board, reload. evidence/yunalesca-win-r25fix3. Two earlier patched runs stalled at the route's budget (15 min, then 50 min on a host with 8 browsers); the harness is the cause, not the game. Input was real keys throughout; the harness patch is not a debug hook.
- **braskas-final-aeon (III, FFX)**: win (seed 1, 32 min) after the default 15-minute route budget stalled a first run mid-fight. evidence/braskas-final-aeon-win-b2; the stalled first run is braskas-final-aeon-win.
- **ffx2-bahamut (IV, FFX-2)**: win (seed 1, 7.6 min); lose and retry reached battle; repeated at 2000x1012; lose at 390x844 touch. evidence/ffx2-bahamut-win, -lose, -win-w2000, -lose-p390-touch. Continuity: 0 snaps per minute, 27 jerks of 40 px or more (worst 271 px).
- **ffx2-vegnagun-shuyin (V, FFX-2)**: win on seed 2 (27 min, five links). Seed 1 and 1001 lost (once in 4 turns, 41 s). A separate run won links 1 to 3 and lost link 4: results 'Defeat' and Retry reached. evidence/ffx2-vegnagun-shuyin-win-s2, -win-lose4, -win, -lose. The fourth-fight defeat is evidence/ffx2-vegnagun-shuyin-win-lose4/31-results.png and run.json resultsText.
- **ffx2-leblanc (VI, FFX-2)**: win (seed 1, 12.5 min), results, post scene, board. evidence/ffx2-leblanc-win. 30-post-scene.png is UNVERIFIED by assert (screen was results, harness slot expectation, PR-0431).
- **seymour-anima-macalania (VII, FFX)**: win (seed 1, 8.2 min). evidence/seymour-anima-macalania-win; post-scene capture slot UNVERIFIED (PR-0431).
- **evrae-airship (VIII, FFX)**: win (seed 1, 8.8 min). evidence/evrae-airship-win
- **yojimbo-cavern (IX, FFX)**: win (seed 1, 3.7 min), post scene seen. evidence/yojimbo-cavern-win
- **seymour-natus (X, FFX)**: win (seed 1, 3.7 min), post scene seen. evidence/seymour-natus-win
- **ffx2-fallen-aeons (XI, FFX-2)**: win (seed 1, 14.4 min), post scene seen. evidence/ffx2-fallen-aeons-win
- **seymour-omnis (XII, FFX)**: win (seed 1, 11.9 min), post scene seen. evidence/seymour-omnis-win
- **ffx2-trema (XIII, FFX-2)**: FIRST REAL-KEY WIN IN THE CRITIC'S HISTORY OF THIS CHAPTER: seed 1003 (attempt 2 of the run started at seed 3; 244 turns, 28.7 min, two links), post scene reached ('Why do you fight, if not to forget?'). Link-2 retry: a lose-at-link-2 run (seed 1003 line) lost link 2 three times in a row and each Retry returned to link 2 with the party alive (Yuna 9079/9999, Rikku 9999, Paine 8412 on entry), first menu up. evidence/ffx2-trema-win-t8 (win), ffx2-trema-win-lose2 (a3-a5 retry states, a4-33-retry-battle.png). Earlier runs (seed 1, 1001) lost at link 1 after 29 to 35 turns.
- **isaaru-via-purifico (XIV, FFX)**: win (seed 1, 7.2 min), post scene seen. evidence/isaaru-via-purifico-win
- **ffx2-den-of-woe (XV, FFX-2)**: win on the first attempt (seed 1, 7.4 min, 37 turns, 2 seams), post scene seen. evidence/ffx2-den-of-woe-win. PR-0306 not reproduced as a loss this round (one sample).
- **ffx2-ixion-djose (XVI, FFX-2)**: win (seed 1, 8.9 min). evidence/ffx2-ixion-djose-win; post-scene capture slot UNVERIFIED (PR-0431).
- **sin-fins-core (XVII, FFX)**: win (seed 1, 19 min, 271 turns, 17 orders) on the second run; the first run stalled at the default 15-minute budget at link 2. evidence/sin-fins-core-win-f2; first run sin-fins-core-win.
- **sin-face (XVIII, FFX)**: win on the first attempt (seed 1, 4.7 min, 11 turns left on the Giga-Graviton counter at mid-fight), post scene seen. evidence/sin-face-win. PR-0279 (wins almost never) not reproduced in this sample; one sample only. Not tested: the three hidden chapters.

## Chief captures (after the gap pass)

- Cold load: cold load to an interactive title, one navigation per fresh browser, cache disabled, nothing else running (GPU PAUSE held), 1600x900: unthrottled 3.6, 0.8, 0.7 s (about 2.1 MB and 12 requests before the title; the first run is the cold DNS/TLS one); on 1.6 Mbps / 150 ms 11.2 s (2.1 MB, first paint 1.6 s, DOMContentLoaded 11.1 s)
- Title probe: A single Enter at the title on a first visit starts Auron's one-time 20 s briefing (screen() keeps reading "title" for about 20 s; the second Enter or Esc skips it and the board arrives in about 2 s; evidence/gaps/coldload/title-4s-after-enter.png and titleprobe.json). It is the designed briefing, ENTER / ESC SKIP, not a defect.
- 14 px sweep: {"chaptersSwept":17,"clean":15,"offenders":["yojimbo-cavern: Daigoro 12.2px, + Kozuka 12.2px, + Wakizashi 12.2px","seymour-omnis: Colour order: our estimate 12px, Discs 13px, Absorbs 13px, Weak 13px, Enemy intent 13px"],"minPx":12,"phone":["seymour-flux: battle 0/14px, pause 0/14px, truncated 1","ffx2-bahamut: battle 0/14px, pause 0/14px, truncated 1","braskas-final-aeon: battle 0/14px, pause 0/14px, truncated 1","ffx2-fallen-aeons: battle 0/14px, pause 0/14px, truncated 1"]}
- Attack confirm timing: 150ms#0:33ms 150ms#1:SWALLOWED 400ms#0:35ms 400ms#1:SWALLOWED 700ms#0:38ms 700ms#1:SWALLOWED 1200ms#0:SWALLOWED 1200ms#1:39ms; cause: see "Refuted" below
- Cross-engine smoke: webkit 26.6: title=1793; screen=chapter-select; after-card-enter=party-prep; screen-change=party-prep; screen-change=cutscene; screen-change=battle; first-menu=true; frames={"n":46,"fps":11.5,"medianMs":85,"p95Ms":98,"maxMs":174}; webgl=Apple GPU; rows=["Talk","Attack","Special▸×4","White Magic▸×3","Items▸×27","Flee"]; reticles-after-attack-enter=0; damage-or-rig=idle; errors 0, 4xx 0 || firefox: NOT RUN (the Playwright Firefox 1543 fails to launch on this host, browserType.launch spawn UNKNOWN, twice): UNVERIFIED. WebKit is the Playwright Windows build, not Safari; its 11.5 fps in battle is that build software path and says nothing about Safari.

## Coverage matrix

**Tested**
- Live artifact: CHK-017 PASS (fresh 167-file verify; the 5,169-file byte comparison reused with its dependency argument); 0 console errors and 0 responses of 400 or more in 34 route runs.
- All 18 listed chapters by real keys at 1600x900 to a win, results, post scene where one exists, the board and a reload; lose and retry in Ch I, II, IV, V, XIII; Ch I and IV at 2000x1012 and 390x844 touch; Ch XI phone win.
- The required list of the task: CHK-022 (Ch II, XIII, XV, XVIII wins; Ch XIII link-2 retry three times; Ch V fourth-fight defeat), CHK-002, CHK-003 and CHK-009 (six-viewport pause matrix plus the chief's 14 px sweep), CHK-004 (2,484 decisions), CHK-005, CHK-006, CHK-010 (multi-target captures), CHK-013, CHK-015 (keyboard Ch I and VI), CHK-023, CHK-B1 and CHK-B2 (UNVERIFIED by rule), delivery first load and frame time, prep tabs 2 to 6 at two sizes: every one attempted, results above.
- Engine: tsc clean, 431 unit files and 7,939 tests pass (combat and chapter batches), 979 of 979 command records, the aeon recovery table 10 of 10, the CTB table 255 of 255, 177 of 177 Stoic gains, fresh-seed win rates for 11 FFX and 7 FFX-2 chapters.
- Audio: qa.mjs, ffmpeg ebur128 and my own seam script on all 38 shipped files, stereo gate on 9 cues, routing in 237 AudioManager samples over 34 runs, pause hand-back and cold title onset.
- Continuity harness over all 18 chapters (dedicated, one at a time) with 65 strips read by the fan and the Shiva, Yuna and Fin strips read by the chief.
- Chief captures: cold-load timing, a 14 px DOM sweep over the battle menu and pause in 18 chapters, four phone chapters and the prep tabs, the Attack-confirm timing, a Firefox and WebKit smoke.

**Reused (with the dependency argument)**
- CHK-017 byte-for-byte comparison of 5,169 files from D:/pyrefly-r40-rc/critic/reviews/fcecfa74-live-verify.json: No deploy after 2026-10-11T14:44:38Z; the live manifest hash recomputed this round equals the stored one; a fresh 167-file sample including the files changed since 2ae1a9e4 matched.

**Not tested**
- The three hidden chapters (Experiment, Sinspawn Gui, hidden Leblanc) and FF7 (no hidden run; no FF7 change in the diff).
- Loss paths of the 13 chapters not listed; the Ch V timer-path bad ending.
- Pause portrait motion clip (tile 24); calm-camera framing (tile 50); phone victory results beyond Ch XI.
- KO sequences at 2000x1012; target frames for Ch III, VIII, XI, XIV to XVIII.

**Required and not tested** (owed by this review, attempted or impossible, UNVERIFIED)
- CHK-B1 and CHK-B2 (Bailey's ear and play): no agent can supply them.
- CHK-005 broken boards and the CHK-006 overlay exits beyond the target reticle and battle end: not constructed.
- CHK-015 gamepad, pause on the results screen and during a cutscene, Ch IV single-target cancel; CHK-010 Hastega, Ch XII, marker contrast; CHK-011 eight chapters' target frames.
- CHK-023: the third Talk in Ch III, the airship Cancel row in Ch VIII, the Overdrive and Trigger Command input windows, FFX-2 chain-seam clips at 60 fps, the boss-special clips.
- Prep: a changed value (equipment, item, sphere) reaching the first battle menu; reward values source-audited for the changed Fallen Aeons, Ixion and Trema data.
- Delivery: named hardware, a real phone, a real gamepad, a throttled reload at the board (PR-0394 last measured at 36 s in round 22), the post-title download on a slow link.
- Audio: the Ch V link-5 continuous log across boss-vegnagun to boss-shuyin, scene-cue onset on an idle host (the gap pass's measure was invalid), real-device audio unlock.
- The Ch IV wide camera pull at 1600x900, 2000x1012, 2560x1080 as a continuous clip (PR-0421).

## Ranked issue list (full)

59 issues: critical 0, major 5, minor 18, polish 29, suggestion 7. Ranked: critical, major, minor, polish, suggestion; within a severity Bailey's reported problems first, then frequency, player impact, coverage and effort. 108 further issues from round 24 are carried open and were not re-observed this round (listed by id after the table).

### 1. PR-0380 (major, feel)

**PR-0380 (carried, NARROWED; CHK-027 FAIL): large and some party figures still jump, pop or teleport in one frame at pose swaps, entrances and run-ins (532 jerks of 40 px or more, was 1,043)**

- Game / chapter: both / XIII (Paragon), XVII (fins, Tidus), XI (Anima), XVIII (Sin), VIII (Evrae)
- Expected: No jerk of 40 px or more at 1600 wide in one frame outside a camera cut; a boss or aeon that arrives fades or moves in, and a lunge walks back.
- Observed: 532 jerks of 40 px or more over 18 chapters (323 at a swap, 209 mid-move; worst 967.7 px), CHK-027 FAIL in 17 of 18 chapters (only Yojimbo passes). The 150 px and larger events are boss and large-figure events: Anima appears in one frame at the top right in Ch XI (967.7 px, no fade; first-time fan: "a giant dark wing and body pops into the frame"), Overdrive Sin is absent for 6 frames and then appears whole in Ch XVIII (341.8 px, same shape as PR-0401), Paragon moves 51.9 px sideways at every idle/attack swap (52 times) and 355 px at a turn start in Ch XIII, Right Fin cast to idle snaps 346 px in Ch XVII, Tidus steps 295 px at a run-in start (Ch XVII), Valefor changes from wings spread to folded in one frame with the background jumping (Ch III), Bahamut grows about 1.5x at the end of a swap (Ch IV), Yuna goes bent-over to upright with the head moving 226 px (Ch XV). Fan: after a lunge the attacker dissolves where it ended and stands again at its seat instead of walking back (Auron Ch II and Ch I, Rikku Ch V). About half of the head jumps at swaps are the revive rise (a lying figure standing) and are by design. Per-cause tally: damage 201, action-start 64, atb 17, no cause 219. Snaps are NOT part of this issue any more (0.02 a minute). Not re-run on the live site by the confirmer; the counts are the harness aggregate, the strips are read.
- Repro: Live https://echoesofspira.com/, real keys, 1600x900, seed 1, GPU: node critic/runner/lib/route.mjs <chapter> win --continuity; ffx2-fallen-aeons, sin-face, ffx2-trema, sin-fins-core, ffx2-den-of-woe, braskas-final-aeon, ffx2-bahamut. Strips continuity/<chapter>-win-r25/continuity/strips/jerk-*.jpg
- Evidence: critic/rounds/round-25/continuity/continuity-summary.json; continuity/ffx2-fallen-aeons-win-r25/continuity/strips/jerk-000-x2-anima.jpg; continuity/sin-face-win-r25/continuity/strips/jerk-000-overdrive-sin.jpg; continuity/ffx2-trema-win-r25/continuity/continuity.json; continuity/sin-fins-core-win-r25/continuity/strips/jerk-000-tidus.jpg; targets/s-jerks1.jpg
- Confidence: high for the measurement and the strips read; causes not traced (suspected: unregistered boss poses and entrance keys with no blend); requirement: CHK-027; RUBRIC section 6 feel; D-420 to D-426
- Smallest fix: Fade or slide Anima and Overdrive Sin in under their entrance flash; register Paragon's idle and attack poses on one anchor; blend or sweep the fins' and Evrae's cast-to-idle; start Tidus's run-in at speed from the party position; walk the attacker back or blend at the lunge end; anchor the Ch XV Yuna swap at the feet. (Smallest first: the three entrances.)
- Acceptance check: Continuity harness over all 18 chapters: no jerk of 150 px or more outside a staged entrance flagged as such, entrances show at least a 3-frame fade, and jerks of 40 px or more fall under 100 in total.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Merged from: audit_feel-narrative: PR-0380 (carried, NARROWED, CHK-027 FAIL): large figures still jump in one frame at pose s ; capture-owner: Pose-change jerks of 40 px or more remain (PR-0380 carried; snaps and double images look f ; first-time-fan: FAN: A figure jumps sideways a long way in one frame during a move: Yuna bent over to upri ; first-time-fan: FAN: After a lunge the attacker does not walk back; it dissolves where it ended and is sta ; first-time-fan: FAN: Sin's head pops into the picture all at once, huge, from a frame where he was a small ; first-time-fan: FAN: Bahamut suddenly gets about 1.5 times bigger in one frame at the end of a see-through ; first-time-fan: FAN: A giant dark wing and body pops into the frame in a single frame when Anima arrives,  ; first-time-fan: FAN: Valefor pops from wings spread wide to a smaller folded pose in one frame, and the wh ; audit_visual-targets: PR-0380 and PR-0401 (carried, narrowed): bosses and some party poses appear or jump in one

### 2. PR-0295 (major, interface)

**PR-0295 (carried, RAISED from polish; now observed): the heavy party-prep tabs are a desktop frame shrunk to a third of the width on a 390x844 phone, text about 3 px (FFX Stats, Equipment, Items, Overdrive; FFX-2 Dresspheres, Stats, Accessories, Items)**

- Game / chapter: both / Ch I (FFX) and Ch IV (FFX-2) party prep
- Expected: A readable phone layout with text of at least 14 css px (CHK-003; 11 px at the very least).
- Observed: Gap pass by touch taps: each of those tabs draws the desktop layout at about a third of the screen width with text of roughly 4 to 5 px and empty screen above and below; only Chapter and Sphere Grid have a phone layout. The chief's DOM sweep of the same screens (live, real keys, fresh browser, effective CSS px = font-size times ancestor scale) reads a minimum of 2.98 px: FFX Stats 77 text elements under 14 px, FFX-2 Dresspheres 67, Stats 181, Accessories 47, Items 58; the Chapter tab reads 10 px minimum. No horizontal scroll. Desktop 1600x900 opens all six FFX tabs and all five FFX-2 tabs by Left/Right. Prep is the screen the player reaches before every fight, so on a phone the equipment, items and sphere choices are unreadable.
- Repro: Fresh profile, 390x844 touch context, live site, board, open Ch I or Ch IV to party prep, tap the tabs after Chapter (seed 1). Or node critic/rounds/round-25/chief/sweep14.mjs prep.
- Evidence: critic/rounds/round-25/evidence/gaps/preptabs-seymour-flux-390x844/tab-3-EQUIPMENT.png, tab-4-ITEMS.png, tab-5-OVERDRIVE.png; preptabs-ffx2-bahamut-390x844/tab-1-DRESSPHERES.png, tab-3-ACCESSORIES.png; evidence/gaps/sweep14/out-prep.json
- Confidence: high (two independent captures: screenshots and a DOM measurement); emulated phone, not a real device; requirement: CHK-003, CHK-002 (phone), RUBRIC section 6 interface (prep usability)
- Smallest fix: Give the remaining prep panels a phone layout in src/app/screens/party-prep/phonePrep.ts as was done for Chapter and Sphere Grid (suspected location, not traced).
- Acceptance check: sweep14.mjs prep at 390x844: every tab's minimum effective size is 14 px or more and the tab fills the width.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Merged from: gap-capture: Heavy party-prep tabs are a shrunken desktop frame on a 390x844 phone (both games) ; audit_prep-delivery: PR-0295 (carried, sixth review, still unproved by input): no prep tab but CHAPTER was open

### 3. PR-0148 (major, audio)

**PR-0148 (carried, seventh review): no numeric owner listening verdict for the shipped mix; 9 ElevenLabs cues accepted by delegation, and OWNER-VERDICT.md is stale**

- Game / chapter: both / all
- Observed: The audio category cannot be scored. docs/audio/OWNER-VERDICT.md ends at 2026-09-28; Bailey's later ear words live only in decisions.json (positive on three 2026-10-07 cues: D-544 'it sounds epic!', D-550, D-557; negative on 2026-10-10: D-682 'arcade-y and like snes music again', D-683 'atrocious'). The 2026-10-10 cues (boss-bahamut, boss-leblanc and the 7 new ones) were chosen by the driver under D-702 and no one has heard the shipped files. No agent can hear.
- Repro: Read docs/audio/OWNER-VERDICT.md and grep decisions.json for area audio from 2026-10-07; Bailey opens docs/audio/audition.html.
- Evidence: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json D-682, D-683, D-702
- Confidence: high; requirement: RUBRIC section 6 audio; CHK-B1
- Smallest fix: Bailey listens and gives a number; the driver appends his 2026-10-07 to 10-10 ear words to OWNER-VERDICT.md verbatim (docs only).
- Acceptance check: A numeric listening verdict recorded; OWNER-VERDICT.md carries the 2026-10 entries.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 4. PR-0099 (major, audio)

**PR-0099 (carried, PARTLY addressed again by this build): scene beds and two battle cues are still stand-ins**

- Game / chapter: both / VI, IX to XVIII (scene beds), XII, XV (battle)
- Observed: This build gives battle cues of their own to Ch X, XI, XIII (phase 2), XIV, XVI, XVII and XVIII (seven new ElevenLabs takes); routing is right in every one. Still borrowed per THEMES.md: Ch XII battle (boss-seymour) and Ch XV battle (boss-shuyin); the scene bed for Ch VI, IX, X, XI, XII, XIII, XIV, XV, XVI (scene-bevelle-underground, scene-gagazet, scene-farplane, scene-dreams-end), XVII and XVIII (scene-fahrenheit). Observed in play: Ch XV first menu boss-shuyin, Ch XII boss-seymour, Ch IX/X/XIV scene-gagazet.
- Repro: node tools/audio/themes-audit.mjs, then read the rows of the chapter cue map marked stand-in; routing-samples.txt rows for ffx2-den-of-woe-win and seymour-omnis-win.
- Evidence: critic/rounds/round-25/audio/routing-samples.txt; docs/audio/THEMES.md lines 659-687
- Confidence: high; requirement: THEMES.md cue map
- Smallest fix: Bailey's call per chapter (new cues cost money and need ear approval); nothing to build without his yes.
- Acceptance check: themes-audit lists no borrowed row Bailey wants replaced.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 5. PR-0421 (major, visual)

**PR-0421 (carried, NOT re-observed, UNVERIFIED this round): the Ch IV wide camera pull may show the backdrop plate edges at 2000x1012 and 2560x1080**

- Game / chapter: FFX-2 / IV (ffx2-bahamut)
- Expected: The backdrop fills the frame through the whole camera move.
- Observed: The gap pass took screenshots about every 310 ms from the battle slate at 2000x1012 and 2560x1080 (GPU mode; a first attempt in software-render mode was discarded). About 4.9 s after the slate the wide shot shows dark bands at the left and right edges (2000: x 0 to 205 and 1730 to 2000; 2560: both sides) and a dark floor. They may be painted pillars rather than a plate edge, so no defect is claimed and none is closed. 1600x900 was not re-captured. Round 24 read bands at x 0 to 190 and 1350 to 1470 at 1600x900.
- Repro: Live site, Ch IV by real keys at seed 1, CDP screencast from the battle slate; frames s150 to s300.
- Evidence: critic/rounds/round-25/evidence/gaps/shots-ffx2-bahamut-2000x1012/b-031175.jpg, b-031239.jpg; critic/rounds/round-24 s180
- Confidence: low this round (carried from round 24 at high); requirement: CHK-013, CHK-002 (edge or void), RUBRIC 7 composition
- Smallest fix: Extend or enlarge the plate to cover the widest camera frustum, or clamp the wide view (shipped derivative or camera preset only; the approved painting is not replaced).
- Acceptance check: Screencast of the Ch IV entry at 1600x900, 2000x1012 and 2560x1080: no dark band or plate edge in any frame of the move (or the bands are shown to be painted).
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature true

### 6. PR-0378 (minor, feel)

**PR-0378 (owner-reported, NARROWED and mostly resolved): the KO is no longer a one-frame cut but a 3 to 5 frame dissolve onto the lying painting, and three boss cast-to-idle changes are still one-frame hard cuts**

- Game / chapter: both (KO); FFX only (the three hard cuts) / all 18 (KO); VIII and XVII (hard cuts)
- Expected: A KO that moves (a fall) and a boss cast-to-idle that blends.
- Observed: Snaps per minute 0.60 to 0.02 (3 hard cuts in 8,956 battle seconds; the 0.25 limit passes). Chief read the Shiva KO strip (Ch III swap-261): the standing figure holds, dissolves over about 4 frames and the lying painting lands with no in-between pose; the first-time fan counts "2 to 3 frames, with almost nothing in between" on 10 KOs (Shiva, Possessed Ifrit, Natus, Sandy, Auron, Yuna). The auditors read a fall that "blends down over about 14 frames": the strip shows a short dissolve, not a 14-frame fall, so the KO is continuous (no cut) but not a fall. The 3 remaining hard cuts: Evrae cast to idle (Ch VIII, overlap 0.87), Left Fin cast to idle (Ch XVII, 0.88) and Right Fin cast to idle (Ch XVII, overlap 0.097, whole-silhouette change). Revive rises through a 2 to 5 frame blend.
- Repro: FFX Ch XVII sin-fins-core and Ch VIII evrae-airship real-key win routes, seed 1, 1600x900; strips continuity/sin-fins-core-win-r25/continuity/strips/swap-537-right-fin-cast-idle.jpg and the swap list entries ids 73 and 537 (Ch XVII), 398 (Ch VIII)
- Evidence: critic/rounds/round-25/continuity/braskas-final-aeon-win-r25/continuity/strips/swap-261-shiva-hurt-ko.jpg; continuity/sin-fins-core-win-r25/continuity/strips/swap-537-right-fin-cast-idle.jpg; targets/s-ko1.jpg, s-ko2.jpg, s-fin.jpg
- Confidence: high; requirement: CHK-027 item 1; D-420 to D-426
- Smallest fix: Boss and fin cast-to-idle get the same real-clock blend as the party; if Bailey wants a fall rather than a dissolve, a painted fall frame per member (a taste question, nothing built without his yes).
- Acceptance check: Harness reports 0 hard cuts for Ch VIII and XVII; KO strips read by Bailey (CHK-B2).
- Merged from: audit_visual-targets: PR-0378 (narrowed): three boss cast-to-idle changes are still one-frame hard cuts; the KO  ; audit_feel-narrative: PR-0378 is RESOLVED: the KO is no longer a one-frame cut (recorded here so the carried lis ; first-time-fan: FAN: When a figure is knocked out it goes from standing tall to lying flat in 2 to 3 frame

### 7. PR-0379 (minor, feel)

**PR-0379 (owner-reported, NARROWED, DOWNGRADED from major): double images at pose swaps fell from 253 to 44 severe swaps, 36 of them on Sin's Right Fin (Ch XVII)**

- Game / chapter: FFX (Right Fin, Yojimbo); FFX-2 (Fem-Goon, Yuna Trema) / XVII (also VI, IX, XIII)
- Expected: No swap with two paintings of one figure side by side at severity 0.40 or more.
- Observed: 44 of 10,956 swaps at double-image severity 0.40 or more (worst 0.436, was 0.465): Right Fin idle/attack/cast pairs 36 (two overlapping translucent arms for 4 frames), Fem-Goon idle/cast 4 (Ch VI; a second copy beside her), Trema's Yuna hurt/critical 4. Ghost frames below 0.4 occur at 9,628 swaps by design (the real-clock blend); the first-time fan saw it in about 65 strips and lists it as the single biggest pattern. Also Yojimbo hurt-to-idle (8 ghost frames, Ch IX). The blend is deliberate, so only the severe count is judged.
- Repro: FFX Ch XVII (sin-fins-core), real-key win route, seed 1, 1600x900; read continuity/sin-fins-core-win-r25/continuity/strips/ghost-485-right-fin-cast-idle.jpg and swap-492-right-fin-idle-attack.jpg; harness event ids in continuity/sin-fins-core-win-r25/continuity/continuity.json
- Evidence: critic/rounds/round-25/continuity/sin-fins-core-win-r25/continuity/strips/ghost-485-right-fin-cast-idle.jpg; continuity/ffx2-leblanc-win-r25/continuity/strips/swap-005-fem-goon-idle-cast.jpg; targets/s-fin.jpg
- Confidence: high; requirement: CHK-027 item 3
- Smallest fix: Shorter or masked blend for the Right Fin's four poses and the female goon's cast pair; or hold one pose across the hit flash.
- Acceptance check: Harness: 0 swaps at severity 0.40 or more on Ch XVII, VI, XIII.
- Merged from: audit_visual-targets: PR-0379 (carried, narrowed): Sin's Right Fin shows two overlapped silhouettes at nearly ev ; audit_feel-narrative: PR-0379 (carried, DOWNGRADED from major, NARROWED): double images at pose swaps fell from  ; first-time-fan: FAN: Every pose change is a crossfade, so for a few frames you see two poses of the same f ; first-time-fan: FAN: Yojimbo goes see-through and doubled for a long stretch when he gets hurt and then re ; first-time-fan: FAN: Fem-Goon gets a second copy of herself standing next to her for a moment when she goe

### 8. PR-0227 (minor, encounter)

**PR-0227 (carried, a question for Bailey; merges PR-0306 and R25-ENC-01): FFX-2 Chapters V, XIII and XV are won about half or less at human pace**

- Game / chapter: FFX-2 only / V, XIII, XV
- Expected: A difficulty the owner has chosen: the sources make the moves always hit, but the gap between zero-delay and human-pace play is not stated anywhere as an owner decision.
- Observed: Advisor-card follower and the chapter's own line at the Wait-split human pace, 30 seeds: Ch V card 16/30 and line 13/30 (zero-delay engine 54/60), Ch XIII card 8/30 and line 10/30 (engine 24/60), Ch XV card 11/30 and line 9/30 (engine 25/60). Real keys: Ch V seed 1 lost link 1 in 4 turns (41 s, two girls KO'd before the first party turn, Tail Beam twice), seed 1001 lost link 2, seed 2 won in 27 minutes; Ch XIII needed seed 1003 after five lost attempts (244 turns, 33 minutes); Ch XV won first time (7.4 min, one sample). Same issue open at the same severity two reviews: RUBRIC section 8 asks for a written method check before another batch.
- Repro: SCORECARD_SEEDS=30 SCORECARD_DRIVERS=card,intended npx vitest run --config critic/bench/advisor-v3/vitest.config.ts in D:/pyrefly-r40-rc; real keys: critic/rounds/round-25/evidence/ffx2-vegnagun-shuyin-win (seed 1), -win-s2 (seed 2).
- Evidence: critic/rounds/round-25/audit-combat/results-r25-deep.json; critic/rounds/round-25/audit-combat/scorecard.log; critic/rounds/round-25/audit-combat/ffx2-measure.log
- Confidence: high for the rates, medium for what the owner wants; requirement: Encounter authenticity and balance: correct difficulty, fair wins and losses (RUBRIC section 6)
- Smallest fix: Bailey's call. Per RUBRIC section 8 the same issue has been open at the same severity two reviews, so the next batch starts with a written method check. Measure options; never tune a boss by hand.
- Acceptance check: A recorded owner decision on the target human-pace rate for each chapter, then the same scorecard within it.
- Merged from: audit_combat-encounter: R25-ENC-01 (carried disclosure, now two reviews at the same severity; a question for Baile ; capture-owner: Ch V can end in 41 seconds with two girls KO'd before the player's first turn (question fo

### 9. PR-0407 (minor, encounter)

**PR-0407 (carried, DOWNGRADED from major, NARROWED): a Ch XIII link-2 retry now restores the party; the one-survivor state was not produced**

- Game / chapter: ffx2 / XIII Trema, link 2 retry
- Expected: A link-2 retry starts from a state the player can win (round 23 option for Bailey, D-146).
- Observed: Three link-2 retries by real keys (ffx2-trema-win-lose2 a3 to a5) each restart at link 2 with all three girls standing (Yuna 9,079, Rikku 9,999, Paine 8,412 of 9,999 on the first). The restore rule (commit 95fb69aa, in the live build, unit-pinned) is what round 23 asked options for (D-146). Not shown by input: a link-1 end state with two girls down, i.e. the "fewer than two standing" branch; the round-23 engine figure (one living girl wins 0 of 200) stands for that branch only.
- Repro: ffx2-trema route with loseAtLink=2, seed 1003 then 3003 to 6004.
- Evidence: evidence/ffx2-trema-win-lose2/a4-33-retry-battle.png, a5-33-retry-battle.png, run.json battleSeeds
- Confidence: medium; requirement: CHK-022 retry from a chained fight
- Smallest fix: Add a retry capture after a link 1 that ends with two girls down.
- Acceptance check: A retry from a deliberately degraded link-1 end state with the survivors shown at the first menu.

### 10. PR-0423 (minor, visual)

**PR-0423 (confirmed, cause not established): Bahamut's wing edges carry a pale rim and loose chips at 1600x900**

- Game / chapter: FFX-2 only / IV Bahamut
- Observed: A 1.6x crop of ffx2-bahamut-win/11-advisor.png shows a pale grey-white fringe along the right wing's trailing edge and two detached pale chips near the membrane, visible as a bright outline at 1x. Not established whether it is in the approved painting or the cutout matte.
- Repro: FFX-2 Ch IV, any first menu at 1600x900, seed 1 (evidence/ffx2-bahamut-win/11-advisor.png, crop x 850 y 60 w 700 h 520); crop at critic/rounds/round-25/targets/cr-bah.jpg
- Evidence: D:/pyrefly-r39-int/critic/rounds/round-25/targets/cr-bah.jpg
- Confidence: medium (cause unknown); requirement: CHK-013 (art judged in the game); approved-art rule
- Smallest fix: If the rim is a matte artefact fix the shipped derivative only; do not repaint the approved painting.
- Acceptance check: Wing edge shows no detached chips at 1600x900 and 2x; hash of the approved master unchanged.

### 11. PR-0422 (minor, interface)

**PR-0422 (carried, cross-reference only): the advisor card trails the chapter's intended line in Isaaru**

- Game / chapter: FFX only / XIV Isaaru
- Expected: The top row of the card follows the chapter's designed line closely enough to win about as often.
- Observed: Card follower 14/30 against the intended line 25/30 in Chapter XIV (Isaaru); round 24 had 63 against 90 percent. Natus now matches (29/30 against 29/30, round 24: 83 against 63); Chapter XVII 22 against 23; Yunalesca 28 against 29.
- Repro: The scorecard command in R25-ENC-01 with SCORECARD_CHAPTERS=isaaru-via-purifico.
- Evidence: critic/rounds/round-25/audit-combat/results-r25-deep.json
- Confidence: medium (n=30, about 9 points of noise, but the gap is 37); requirement: Legal, useful advice (RUBRIC section 2)
- Smallest fix: Re-read the card's top rows on the Isaaru boards that the card loses and repair the card's rules for the aeon-recovery rule; not a boss change.
- Acceptance check: Card follower within 10 points of the intended line on 100 seeds.

### 12. PR-0383 (minor, combat)

**PR-0383 (carried, reproduced): an aeon's menu offers an enabled Defend row that has no effect**

- Game / chapter: FFX only / I, II, III, VII, X (any aeon turn)
- Expected: No Defend row for an aeon, or the game's own row set.
- Observed: Bahamut's decision rows on seeds 5001 to 5010 of Chapter X: Attack, Impulse, Shield, Boost, Mega Flare, Defend, Dismiss, with Defend enabled. research/re-ffx-overdrive-steal-aeons.md section 4.6 gives every aeon an extra-immunity word that includes Defend, so the row can do nothing.
- Repro: critic/rounds/round-25/audit-combat/aeon-defend.probe.ts (seeds 5001 to 5010, chapter seymour-natus, intended line summons Bahamut).
- Evidence: critic/rounds/round-25/audit-combat/aeon-defend.out
- Confidence: high that the row is offered, medium that it is inert (the status read in the probe was taken before the action resolved); requirement: Honest, legal command rows
- Smallest fix: Do not build the Defend row for an aeon user in src/battle/ffx/commands.ts (the defendDef push after the item rows).
- Acceptance check: The aeon's rows contain no Defend; the goldens stay equal.

### 13. PR-0427 (minor, combat)

**PR-0427 (carried, not re-run): Counterattack, Auto-Potion, Auto-Med and Auto-Phoenix fire for a sleeping or Threatened wearer**

- Game / chapter: FFX only / any
- Expected: The four reactions respect the game's can-act test.
- Observed: src/battle/ffx/ticks.ts reaction code (lines 109 to 184) is untouched by 72973096..fcecfa74 and still has no can-act gate. Not exercised again this round.
- Repro: See round 24 PR-0427.
- Evidence: git diff 72973096 fcecfa74 -- src/battle/ffx/ticks.ts (6 lines, none in the reactions)
- Confidence: medium (carried, not re-run); requirement: Faithful CTB and statuses
- Smallest fix: Gate on canQueueAction as a batch of its own, then re-measure the benches.
- Acceptance check: A test with a sleeping Counterattack wearer that does not counter.

### 14. PR-0356 (minor, interface)

**PR-0356 (carried, WIDENED by a DOM measurement; CHK-003 FAIL): text under the 14 css px floor on prep, results and pause headers; contrast is low on several hints**

- Game / chapter: both / Pause (Ch I), prep, results, 1600x900
- Expected: Zero text under 14 css px (CHK-003) and AA contrast for hints.
- Observed: Chief's DOM sweep (live, real keys, effective px): FFX Ch I party prep at 1600x900 has a minimum of 11.7 px (key chips M, H at 11.7; Esc, "skip the guide", S.LV at 12) with 15 to 31 text elements under 14 px per tab; FFX-2 Ch IV prep minimum 12 px with 13 to 17 under 14 px. The battle first menu and the pause (default tab) are clean in 15 of 17 chapters at 1600x900; the others: yojimbo-cavern: Daigoro 12.2px, + Kozuka 12.2px, + Wakizashi 12.2px | seymour-omnis: Colour order: our estimate 12px, Discs 13px, Absorbs 13px, Weak 13px, Enemy intent 13px (8 elements under 14 px in total, minimum 12 px), 0 truncated names; at 390x844 four chapters read 14 px minimum in both (seymour-flux: battle 0/14px, pause 0/14px, truncated 1; ffx2-bahamut: battle 0/14px, pause 0/14px, truncated 1; braskas-final-aeon: battle 0/14px, pause 0/14px, truncated 1; ffx2-fallen-aeons: battle 0/14px, pause 0/14px, truncated 1). Auditor pixel measures: results sub-lines about 12 px, prep hint strip about 11 px at about 2:1 contrast, pause section headers about 2.4:1, "H PAINTING ONLY" about 2.9:1. Not swept: results, board, guide, cutscene dialogue, the other pause tabs.
- Repro: Ch I, Esc from the first menu; prep and results screens.
- Evidence: critic/rounds/round-25/evidence/gaps/sweep14/out-prep.json, out-battle.json, out-phone.json; evidence/seymour-flux-win/31-results.png, 04-prep.png
- Confidence: high (DOM) for prep, medium (pixels) for contrast; requirement: CHK-003
- Smallest fix: Raise the prep key chips, hint strip and results sub-lines to 14 px; lift the contrast of the pause section headers and hints.
- Acceptance check: sweep14.mjs on prep, results and pause at 1600x900 and 390x844: 0 under 14 px.
- Merged from: audit_interface-onboarding: PR-0356 (carried, re-measured from round-25 pixels): pause section headers, hint line, pre ; audit_prep-delivery: R25-PD-02 (critic tooling): the pause-matrix DOM sweep uses an 11 px floor, not CHK-003's  ; audit_interface-onboarding: R25-HX-01 (critic tooling, new): the DOM sweep floor is 11 px not 14, records no minimum, 

### 15. PR-0391 (minor, interface)

**PR-0391 / PR-0293 (carried; CHK-002 and CHK-009 FAIL at 3840x2160 only): the pause painting is not full-bleed and the Mortiorchis affinity chips overprint**

- Game / chapter: FFX Ch I (the pause is shared) / I
- Expected: HUD scaled with the stage and a full-bleed plate.
- Observed: At 3840x2160 the pause plate is 3392x1938 CSS px at (-15,-8) in a 3840x2160 window (slid false; master natural 3360x1920 drawn above 1:1): about 463 px at the right and 215 to 230 px at the bottom fall to a dark feathered falloff, a soft vignette and not a hard bar. The Ch I enemy affinity chips FIRE, ICE, THUNDER, WATER, HOLY, GRAV overprint each other ("FIR CHU CE WA HO GRAV") and the coach text and PAUSE chip draw small against the 2160 screen. 390 to 2560 wide pass CHK-002; the six-viewport matrix was real Esc in fresh browsers. DPR 1 only.
- Repro: Live, 3840x2160, Ch I first menu and Esc.
- Evidence: critic/rounds/round-25/evidence/gaps/pause-matrix-3840x2160/01-battle-menu.png, 02-pause.png; evidence/gaps/pause-matrix/out-390x844_1280x720_1600x900_2000x1012_2560x1080_3840x2160.json
- Confidence: high (DOM and screenshots) for the numbers, medium for how it looks to a player; requirement: CHK-002, CHK-003, CHK-009
- Smallest fix: Scale the 3840 plate to cover (use the 2x master at object-fit cover) or declare the feathered falloff the intended case in CHK-002; scale or wrap the affinity chips with the HUD.
- Acceptance check: Plate rect equals the viewport at 3840x2160 (or the written rule); affinity chips legible at 3840x2160 and 2560x1440.
- Merged from: audit_interface-onboarding: PR-0391 / PR-0293 (carried, re-observed at 3840x2160): the HUD does not scale with the win ; capture-owner: At 3840x2160 the pause painting does not cover the viewport rect

### 16. PR-0434 (minor, interface)

**PR-0434 (new, was R25-IF-01; FFX only, Ch XII): the Seymour Omnis intent card prints an inverted damage range, "TIDUS 4,132-2,333 68% HP", under "Deals no damage"**

- Game / chapter: FFX only / Ch XII Seymour Omnis, first command menu, E pressed
- Expected: A range with min below max (suspected 4,132-4,666) and no 'Deals no damage' line above damage rows.
- Observed: Mortiphasm Spells SCRIPTED, 'Deals no damage.' then DAMAGE rows: 'TIDUS 4,132-2,333 68% HP' and 'AURON 2,066-2,333 34% HP'. The minimum is greater than the maximum; Tidus's minimum is exactly double Auron's while the maximum is the same, and 68% HP is about twice Auron's 34%, so the percentage uses the doubled value and only the printed maximum is wrong. Earlier reviews (PR-0354) read the Tidus line as 2,066-2,333, so the doubling is a later change.
- Repro: PYREFLY_BROWSER=gpu, live, seed 1, real keys to Ch XII, first menu, press E; read intentText.
- Evidence: critic/rounds/round-25/evidence/seymour-omnis-win/run.json (intentText), critic/rounds/round-25/evidence/seymour-omnis-win/12-intent-E.png
- Confidence: high for the observation; cause suspected; requirement: RUBRIC section 2: the intent display separates certain from conditional and states values honestly; CHK-004 scope (the intent panel)
- Smallest fix: Compute min and max with the same multiplier, drop the 'Deals no damage' sentence when damage rows exist (PR-0354), and add a unit test that no printed range has min greater than max.
- Acceptance check: Ch XII first menu E: every range reads min <= max; unit test over every chapter's intent rows.

### 17. PR-0430 (minor, interface)

**PR-0430 (carried, widened to Ch II): intent-card bullets end mid-sentence or run on**

- Game / chapter: FFX only / Ch I and Ch II, first menu, E then J
- Expected: Finished sentences.
- Observed: Ch I 'Delay Attack or Delay Buster on the Mortiorchis is punished with party-wide Slowga; no other delay is' then the next bullet (4 runs this round). Ch II 'Sleep to one that is neither Her Blind/Silence gate reads the target she last picked...' has no stop between two sentences (4 runs).
- Repro: Live, seed 1, Ch I or Ch II first menu, press E, hold J, read IF YOU ATTACK.
- Evidence: critic/rounds/round-25/evidence/seymour-flux-win/run.json, critic/rounds/round-25/evidence/yunalesca-win-r25fix3/run.json
- Confidence: high; requirement: CHK-007 copy quality
- Smallest fix: Complete the Ch I sentence and add the missing full stop in Ch II; add a test that no bullet ends in a stop word or lacks terminal punctuation.
- Acceptance check: Read both cards after the fix; test over all intent bullets.

### 18. PR-0435 (minor, onboarding)

**PR-0435 (new): at TEXT SIZE 115 and 130 on a phone the FFX DEFEND chip covers the first word of the bottom description line (FFX only; the FFX-2 phone first menu is clean)**

- Game / chapter: FFX only / Ch I Seymour Flux, first menu, 390x844
- Expected: No overlap at any TEXT SIZE.
- Observed: The DEFEND chip (Q, triangle glyphs) widens at 115 and 130 and sits over the 'TIDUS' label of 'TIDUS - Physical damage'. At 100 percent they sit side by side.
- Repro: 390x844 touch, Ch I, pause, OPTIONS, TEXT SIZE Right once or twice, resume, first menu. Seed 1.
- Evidence: critic/rounds/round-25/evidence/gaps/textsize-seymour-flux-390x844/menu-115.png and menu-130.png beside pause-matrix-390x844/01-battle-menu.png
- Confidence: medium (the chip shows the Q and triangle glyphs after key presses, which may also contribute); requirement: CHK-003, PR-0389
- Smallest fix: Reserve the chip's width in the bottom strip or let the description line wrap beside it.
- Acceptance check: Same capture at 115 and 130: no element overlaps the description line.

### 19. PR-0436 (minor, visual)

**PR-0436 (new, a question for Bailey): some figures read in different colours or costume between pose paintings (Yuna ready pose in a purple skirt, item pose in white and orange; Kimahri, Yojimbo, Rikku)**

- Game / chapter: both / I, VIII, IX, XVI (fan strips)
- Expected: One figure keeps one costume colour across its poses, or Bailey accepts the variation.
- Observed: Chief read the Yuna ready-to-item strip (Ch I, ghost-016): the ready pose is a white top with a yellow obi over a deep-purple floral skirt, the item pose after the swap is white sleeves with an orange-and-white skirt and a lighter grade, a visible change of outfit colour at the swap although the head and feet registration is exact (0.0008 head, 0.2 px feet). The fan lists five (Yuna Ch I, Kimahri Ch VIII, Yojimbo Ch IX, Rikku Ch XVI) and the harness counts only 1 costume swap, because it compares silhouettes, not colour. Possibly the pose paintings are lit differently; these are approved paintings and the finding is how they render, so no replacement is proposed.
- Evidence: critic/rounds/round-25/continuity/seymour-flux-win-r25/continuity/strips/ghost-016-yuna-ready-item.jpg; evrae-airship-win-r25 swap-427-kimahri-idle-victory.jpg; yojimbo-cavern-win-r25 swap-042-yojimbo-hurt-idle.jpg; ffx2-ixion-djose-win-r25 swap-039-rikku-ready-critical.jpg
- Confidence: medium (one strip read by the chief, four by the fan); requirement: RUBRIC section 6 visual (consistency); CHK-026 does not measure colour
- Smallest fix: Bailey decides whether the variation is acceptable; if not, a colour-grade pass on the shipped derivative of the off pose (never a repaint of an approved master).
- Acceptance check: Bailey reads the strips; a per-figure mean-colour check across pose swaps below a tolerance he sets.

### 20. PR-0433 (minor, harness)

**PR-0433 (critic tooling, new): the default 15-minute route budget ends fights that are progressing (Ch II, III, XVII); long fights need LONG_FIGHT_BUDGET_MS**

- Game / chapter: FFX / II, III, XVII
- Expected: routes run to an outcome
- Observed: Stalled results at 15 minutes: Ch III at turn 120, Ch XVII at link 2, Ch II at turn 136 with Yunalesca at 9,104 of 60,000 HP; the longer-budget runs won in 32, 19 and 16 min.
- Repro: route.mjs braskas-final-aeon win / sin-fins-core win / yunalesca win with the default budget.
- Evidence: evidence/braskas-final-aeon-win vs -b2; sin-fins-core-win vs -f2; yunalesca-win-r25fix
- Confidence: high; requirement: CHK-022
- Smallest fix: Add braskas-final-aeon, sin-fins-core and yunalesca to LONG_FIGHT_BUDGET_MS (3,000,000 ms) in route-pure.mjs.
- Acceptance check: the stock route finishes these three without --budget

### 21. PR-0397 (minor, harness)

**PR-0397 (critic tooling, carried, RE-FIRED a second review; merges the capture owner's and the prep auditor's reports): the stock route resolves "Yuna" to Yunalesca and spends Phoenix Downs on the boss; the Ch II win needed a labelled harness patch**

- Game / chapter: FFX only / II
- Expected: The route's target check compares exact ids first.
- Observed: yunalesca-win: three defeats (seeds 1, 1001, 2001) with Phoenix Down aimed at yunalesca 15, 11 and 8 times while run.json says target "yuna", mismatch false; two patched runs stalled (15 min, then 50 min on a host with 8 browsers); the exact-id patch (critic/rounds/round-25/lib/route-pure.mjs line 60) won seed 1 in 160 turns, 16.1 minutes. The engine's intended line wins 94 of 100 fresh seeds, so the stock failure is the harness.
- Repro: critic/rounds/round-25/evidence/yunalesca-win/*battle-log.json, count action-start Phoenix Down targets.
- Evidence: critic/rounds/round-25/evidence/yunalesca-win/run.json
- Confidence: high; requirement: A harness failure is separated from a product failure (RUBRIC section 5)
- Smallest fix: In critic/runner/lib/route-pure.mjs resolveTargetId return the id equal to the slug before any prefix match; resolve unresolved when two ids match; fold the round-25 patch in and rerun Ch II at seeds 1 to 5.
- Acceptance check: The stock route wins Ch II on seed 1 with no Phoenix Down aimed at the boss.
- Merged from: audit_combat-encounter: PR-0397 (critic tooling, carried and re-fired): the stock Chapter II route resolves 'Yuna' ; capture-owner: The critic route still aims revive items at Yunalesca instead of Yuna (PR-0397 not fixed i ; audit_prep-delivery: PR-0397 (critic tooling, carried, re-fired): the Ch II win required a labelled target-id p

### 22. PR-0222 (minor, delivery)

**PR-0222 / PR-0223 / PR-0327 (carried, DOWNGRADED from major while unexercised): the hidden FF7 fight's black hold on a cold cache, its pause's Cloud files and the on-demand twirl keys were not captured**

- Game / chapter: both / hidden FF7 fight; Ch XIII twirl
- Expected: A cold-cache capture with no black hold; a network log of the FF7 pause with no 4xx; throttled twirl keys ending before the outfit frame.
- Observed: Not exercised: no hidden-chapter run this round. The chief's cold-load harness (chief/coldload.mjs) is now available and measures the title only; the FF7 door and a throttled twirl were not run. No FF7 product file changed in 39.4.4 or this build (git diff 72973096..fcecfa74 over src/battle/ff7 and src/data/ff7 is empty).
- Repro: Needs the throttled cold-cache harness.
- Evidence: none
- Confidence: n/a; requirement: CHK-017, CHK-019
- Smallest fix: Capture the FF7 door cold and throttled with coldload.mjs's settings.
- Acceptance check: No black hold; no 4xx in the FF7 pause; twirl keys end before the outfit frame.

### 23. PR-0395 (minor, delivery)

**PR-0395 (carried, re-observed, WIDENED, low-medium confidence): slow frames and worst hitches are higher than round 24 in 15 of 18 chapters' worst case, led by Ch XVI, IV, XI and V**

- Game / chapter: both (FFX-2 worst) / all 18, battle frames at 1600x900
- Expected: Under 0.5 percent slow frames and no single frame above about 250 ms on the same host (round 24's acceptance for this item).
- Observed: Serial continuity set on this host, headless Chromium GPU mode: frames over 34 ms, whole set 0.84 percent (round 24: 0.59), FFX 0.54 percent, FFX-2 1.34 percent. Ixion 2.55 percent (round 24: 1.79), Bahamut 2.23 (1.25), Fallen Aeons 1.42 (1.05), Vegnagun 1.41 (1.25), Braska 0.97, Yunalesca 0.62, Leblanc 0.40 (0.14), Den of Woe 0.27 (0.09); Trema fell to 0.35 (1.66). Worst single frames: Ch V 778 ms (round 24: 580), Braska 497 (234), Sin fins and core 409 (343), Flux 254 (114). Average fps stays 58.2 to 59.8.
- Repro: node critic/runner continuity run per chapter (PYREFLY_BROWSER=gpu), read continuity/<chapter>-win-r25/continuity/continuity.json probe.slowFrames, maxDtMs.
- Evidence: round-25/continuity/*-win-r25/continuity/continuity.json (probe block); round-25/continuity/run.log
- Confidence: medium: same harness and host as round 24, but the contention of other processes during each chapter is not recorded; cause not established (suspected: the motion and music build's KO and puff keys and new SFX decode, plus FFX-2 texture uploads as in round 24); requirement: RUBRIC section 2 (report frame-time spikes, not only the average)
- Smallest fix: Compare worst-frame timestamps in the Braska and Ch V runs against the event log (first use of a KO/puff key or a cue) and prefetch at battle start; re-measure alone.
- Acceptance check: FFX-2 chapters under 0.5 percent slow frames and worst frame under 250 ms on the same host.

### 24. PR-0366 (polish, visual)

**PR-0366 / PR-0320 / PR-0370 / PR-0333 (carried, merged; PR-0333 NARROWED from major): HUD panels, first-time cards and story boxes stand over painted figures and over the advisor, guide and party HP**

- Game / chapter:  / 
- Observed: Ch II the Tidus plate over Auron's legs mid-fight; Ch XII intent text over the party and Omnis; Ch XVII the first-time Auron card over Tidus's and Auron's legs; a story box covers the advisor, guide, intent card and party HP at the first menu in 8 chapters (FFX Ch I at 2000x1012 and 2560x1080, XVIII; FFX-2 Ch V, XI, XIII, XV); first-time fan: in Seymour Flux the party at the bottom left is half behind the command menu, guide card and status strip, and Kimahri sits behind Tidus, Rikku overlaps Yuna in target selection. PR-0333 (boss hidden at the phone first menu, major in r24) is narrowed to the coach moment: the next frame (advisor) shows Bahamut whole at 390x844.
- Evidence: critic/rounds/round-25/targets/ph.jpg; targets/40-sin-fins.jpg; targets/rest.jpg; evidence/seymour-flux-win-w2000/11-advisor.png; evidence/gaps/pause-matrix-2560x1080/01-battle-menu.png
- Confidence: high for the frames; the fan rated this major, the chief polish because it is transient and first-time only; requirement: CHK-008
- Smallest fix: Move the first-time card clear of the party row on Ch XVII; on a phone place the coach card in the stack band; keep story boxes off the advisor band.
- Acceptance check: First-menu frame in each chapter shows every party figure's legs and the advisor clear of any card at 1600x900, 2000x1012 and 2560x1080.
- Merged from: first-time-fan: FAN: The menus and info cards sit on top of the fight. In Seymour Flux the party at the bo ; audit_visual-targets: Panels and first-time cards stand over painted actors (PR-0366, PR-0320, PR-0333 narrowed) ; audit_interface-onboarding: PR-0370 (carried, widened): a story box covers the advisor, guide, intent card and party H ; first-time-fan: FAN: Figures stand on top of each other, so one is half hidden: Kimahri sits behind Tidus,

### 25. PR-0437 (polish, feel)

**PR-0437 (new, a question for Bailey; fan-reported): the camera cuts in one frame on attacks, swaps and the dresssphere change, and Paragon's head leaves the top of the frame at the start of its action (Ch XIII)**

- Game / chapter: both / all (925 camera cuts; Ch IV change; Ch XIII Paragon)
- Observed: The harness counts about 925 camera cuts across 18 chapters (205 in Ch XVII, 188 in Ch III, 92 in Ch XII); the fan sees the shot change in one frame (a figure vanishes and another appears, the party shrinks or grows). Opening Change cuts from the wide shot to a close-up on Yuna about twice her size and back (Ch IV clip). In Ch XIII the opening frames of Paragon's action put its head out of the top while the party is tiny at the bottom. These are camera presets, not figure jumps, and may be the intended cinematic grammar (camera-lab test is still owed); the dresssphere pop (Yuna from the hooded white mage to the spin pose to the gunner outfit with no in-between frames) is the same taste question.
- Evidence: evidence/gaps/clip-change screencast (ffx2-bahamut); evidence/ffx2-trema-win/seq-action-playing and seq-party-action first frames; continuity-summary.json cameraCuts per chapter
- Confidence: medium (fan reading plus harness counts); not a harness failure; requirement: RUBRIC section 6 feel (coherent camera)
- Smallest fix: Bailey decides the cut grammar; if kept, blend or ease the dresssphere close-up; reframe Paragon's opening shot.
- Acceptance check: Bailey picks (camera-lab test); frames of Paragon's action show the head inside the frame.
- Merged from: first-time-fan: FAN: The camera cuts in one frame and the shot changes: a figure vanishes and another appe ; first-time-fan: FAN: Opening Change cuts from the wide shot to a close-up on Yuna that makes her about twi ; first-time-fan: FAN: A framing loses a figure: Paragon's head is out of the top of the picture in the open ; first-time-fan: FAN: The dress change pops: Yuna goes from the hooded white mage to an open-arms spin pose

### 26. PR-0438 (polish, feel)

**PR-0438 (new, low confidence, fan-reported): a white flash or beam covers the acting figure for several frames in six battles (Paine Ch IV about 5 frames, Wakka Ch XII, Tidus Ch I, Yojimbo Ch IX, Yuna Ch II, Yu Pagoda Ch III)**

- Game / chapter:  / 
- Confidence: low (one reader, not re-read by the chief); effects may be the intended Overdrive and aeon flashes; requirement: 
- Smallest fix: Bailey judges whether the flash length is wanted; REDUCE FLASHES option is open (PR-0032).
- Acceptance check: Frames of each event show the figure in at least half of the flash frames, or Bailey accepts.

### 27. PR-0439 (polish, visual)

**PR-0439 (new, low confidence, fan-reported): one frame of Rikku's attack in Ch XIII turns into a pink-and-white negative of the picture**

- Game / chapter:  / 
- Confidence: low (single frame, one reader); requirement: 
- Smallest fix: Find the frame in the attack screencast and check the effect layer.
- Acceptance check: A full-rate capture of the Ch XIII Rikku attack shows no inverted frame.

### 28. PR-0440 (polish, visual)

**PR-0440 (new, low confidence, fan-reported, a question for Bailey): the summoned Valefor towers over the party (about 3 times their size), is cut off at the left edge and the party leaves the picture when it arrives (Ch II)**

- Game / chapter: FFX only / II (Valefor summon)
- Confidence: low (one reader, summon cut-in scale is a staging decision: PR-0310 and PR-0331 family); requirement: 
- Smallest fix: Bailey decides whether the summon cut-in scale and framing are wanted.
- Acceptance check: Summon cut-in frame keeps Valefor inside the frame, or Bailey accepts.

### 29. PR-0441 (polish, visual)

**PR-0441 (new, low confidence, fan-reported): on the chapter title card the painting is not there yet for several frames: the left panel is dark and the enemy arrives in pieces (Yunalesca's head first)**

- Game / chapter: FFX only / II, XVIII, IX (battle slate)
- Confidence: low-medium (opening frames of seq-transition-into-battle, host loaded; a slate that still loads); requirement: 
- Smallest fix: Gate the slate on the boss layer being decoded (as PR-0065 did for the board).
- Acceptance check: Opening 5 frames of the slate in 20 cold runs show the whole painting.

### 30. PR-0442 (polish, feel)

**PR-0442 (new, low confidence, fan-reported): before collapsing Yuna hovers above the floor line and slides back across the stage before she falls**

- Game / chapter: FFX-2 only / VI, V
- Confidence: low (two strips); requirement: 
- Smallest fix: Anchor the hurt-to-KO swap at the feet.
- Acceptance check: Harness feet shift at hurt-to-KO below 2 px.

### 31. PR-0443 (polish, interface)

**PR-0443 (new, low confidence): the speech box covers two ally HP rows during Paine's line in Ch IV at 2000x1012**

- Game / chapter: FFX-2 / IV
- Expected: party HP rows readable during banter
- Observed: 23-midfight.png shows Paine's dialogue slab over the Rikku and Paine party rows (only Yuna's row visible) while the fight continues.
- Repro: route.mjs ffx2-bahamut win --size=2000x1012 --tag=w2000, frame 23-midfight.
- Evidence: critic/rounds/round-25/evidence/ffx2-bahamut-win-w2000/23-midfight.png
- Confidence: low (one transient frame, not re-sampled); requirement: CHK-008
- Smallest fix: Keep the dialogue slab out of the party-row band or lift the rows during banter.
- Acceptance check: no overlap of the dialogue box and the party rows at 1600x900 and 2000x1012

### 32. PR-0384 (polish, interface)

**PR-0384 (carried, widened): the chapter-select hero card is blank and the party portraits show placeholders with broken-image text on arrival and after a reload**

- Game / chapter: both (seen FFX-2 Ch IV) / Board after the win and after a reload, 1600x900
- Expected: The card never paints empty; a placeholder or the loaded art, with no alt text visible.
- Observed: 34-board-after: the Bahamut hero card is a dark hall with no boss layer. 35-board-reload: the card is a black rectangle and the three party portraits are grey silhouettes with the alt text 'Yuna' and 'Paine' drawn over them. The host was loaded (other routes running), notFound is empty, so this is a not-yet-decoded state; its duration is not measured.
- Repro: Win Ch IV, return to the board, reload, screenshot at once.
- Evidence: critic/rounds/round-25/evidence/ffx2-bahamut-win/34-board-after.png, critic/rounds/round-25/evidence/ffx2-bahamut-win/35-board-reload.png
- Confidence: medium (capture timing); requirement: CHK-012, CHK-016
- Smallest fix: Hold the card behind its backdrop until decoded and set the portraits' alt text to empty or hide it until load.
- Acceptance check: Reload at the board with a cold cache: no empty card and no alt text visible.

### 33. PR-0387 (polish, interface)

**PR-0387 (carried, re-observed): the cleared-tile best-time ribbon on the board is clipped**

- Game / chapter: both / Board after a win, FFX-2 Ch IV
- Expected: The whole time.
- Observed: The row ribbon reads '5:2' with the last digit cut at the row's right edge.
- Repro: Win Ch IV, board screenshot.
- Evidence: critic/rounds/round-25/evidence/ffx2-bahamut-win/34-board-after.png
- Confidence: high; requirement: CHK-009
- Smallest fix: Re-seat the ribbon text so its right edge clears the clip.
- Acceptance check: Cleared rows read the full time.

### 34. PR-0354 (polish, interface)

**PR-0354 (carried, re-observed 2 of 2): the intent card says 'Deals no damage' above a damage table**

- Game / chapter: FFX only / Ch IX Yojimbo (Daigoro), Ch XII Omnis (Mortiphasm Spells)
- Expected: No 'Deals no damage' when damage rows exist.
- Observed: 'Daigoro SCRIPTED Deals no damage.' then 'DAMAGE . RANDOM TARGET LULU 544-615 42% HP ...'; same pattern in Ch XII (see R25-IF-01).
- Repro: Ch IX or XII first menu, E.
- Evidence: critic/rounds/round-25/evidence/yojimbo-cavern-win/run.json, critic/rounds/round-25/evidence/seymour-omnis-win/run.json
- Confidence: high; requirement: honest enemy intent
- Smallest fix: Suppress the line when damage rows exist (suspected describeAbility in src/battle/ffx/intent.ts, untraced).
- Acceptance check: Ch IX and XII cards show no contradiction.

### 35. PR-0357 (polish, interface)

**PR-0357 (carried, re-observed): the intent card's ALSO / overflow line is ghosted behind the dashed footer rule**

- Game / chapter: FFX-2 (also FFX Ch I) / Ch IV Bahamut, Ch VI Leblanc, 1600x900
- Expected: A collapsed card ends on a whole line or a clearly dimmed 'more' cue.
- Observed: 'The Mega Flare countdown is an action counter.' sits at about 2:1 under 'J HOLD . +1 MORE'; Ch VI shows a half-faded RIKKU row above 'J HOLD . +11 MORE'.
- Repro: Ch IV first menu, intent open at 1600x900.
- Evidence: critic/rounds/round-25/evidence/ffx2-bahamut-win/11-advisor.png, critic/rounds/round-25/evidence/ffx2-leblanc-win/12-intent-E.png
- Confidence: medium; requirement: CHK-003 legibility
- Smallest fix: Clip at a line boundary, or put the consequence in the first visible line.
- Acceptance check: No half-faded row above the J HOLD footer.

### 36. PR-0369 (polish, interface)

**PR-0369 (carried, re-observed): in Ch XII target mode the TARGET plate lies over the disc panel's 'FACING HIM' label**

- Game / chapter: FFX only / Ch XII, 1600x900
- Expected: Overlays do not overprint each other's labels.
- Observed: 'TARGET Seymour Omnis' covers the label; the sensor card stands over the boss torso and the intent slab text 'Every disc shows Fire' is overprinted at the target step.
- Repro: Ch XII first menu, Attack.
- Evidence: critic/rounds/round-25/evidence/seymour-omnis-win/16-target-single.png
- Confidence: high; requirement: CHK-008
- Smallest fix: Move the target plate below the disc panel or shift the panel one row.
- Acceptance check: Target step with the label readable.

### 37. PR-0386 (polish, onboarding)

**PR-0386 (carried, re-observed): the board's first coach says 'Click its picture to begin' to keyboard players and covers rows VII to XII**

- Game / chapter: both / Chapter select first-run coach, 1600x900 keyboard
- Expected: Device-aware copy and a card clear of the rows.
- Observed: 'Click its picture to begin. The others wait on the board.' while the footer says ENTER BEGIN; the card covers rows VII-XII and the location panel. The touch run says 'Tap its picture' (device-aware there).
- Repro: Fresh profile, Enter from the title, screenshot 03-card.
- Evidence: critic/rounds/round-25/evidence/seymour-flux-win/03-card.png, critic/rounds/round-25/evidence/seymour-flux-win/run.json (dossier)
- Confidence: high; requirement: onboarding teaches the actual controls
- Smallest fix: Pick the sentence by last input device as the touch build already does and move the card clear of the rows.
- Acceptance check: Keyboard says Press Enter; the card covers no row.

### 38. PR-0372 (polish, onboarding)

**PR-0372 / PR-0321 (carried, re-observed): phone pause OPTIONS clips its tab strip and shows about 3.5 of 10 settings in 12 to 13 px**

- Game / chapter: both (seen FFX-2 Ch IV) / 390x844 touch, pause then OPTIONS
- Expected: Tabs fit or scroll visibly; accessibility settings reachable without hunting; 14 px.
- Observed: Tabs read 'ER GUIDE OPTIONS CONTROLS' cut at both edges, the 'ECHOES OF SPIRA - FINAL FANTASY X-2' header wraps over them, SETTINGS shows MASTER VOLUME to a half-cut TEXT SPEED with no scroll cue; after a scroll TEXT SIZE and REDUCE MOTION appear.
- Repro: 390x844 touch emulation, Ch IV, pause, OPTIONS.
- Evidence: critic/rounds/round-25/evidence/ffx2-bahamut-lose-p390-touch/14-pause-options.png, critic/rounds/round-25/evidence/ffx2-bahamut-lose-p390-touch/15-options-active.png
- Confidence: high (emulation, no real phone); requirement: device usability, text and input access
- Smallest fix: Show a scroll affordance, put TEXT SIZE and REDUCE MOTION first on the phone, wrap or scroll the tab strip.
- Acceptance check: Phone options: all tabs and the first four settings visible without a scroll.

### 39. PR-0330 (polish, interface)

**PR-0330 (carried, re-observed): some advisor cards carry a one-word or no effect line**

- Game / chapter: FFX only / Ch VII Steal, Ch XVII Close in
- Expected: A one-line effect for every suggestion.
- Observed: Ch VII 'Steal -> Guado Guardian A IN SPECIAL NO MP Steal'; Ch XVII 'Close in IN ORDERS NO MP' with no sentence.
- Repro: Ch VII and XVII first menu.
- Evidence: critic/rounds/round-25/evidence/seymour-anima-macalania-win/run.json, critic/rounds/round-25/evidence/sin-fins-core-win-f2/run.json
- Confidence: high; requirement: advisor says what an action does
- Smallest fix: Author short effect lines for Steal and Orders.
- Acceptance check: Both cards read a sentence.

### 40. PR-0373 (polish, audio)

**PR-0373 (carried, RE-OBSERVED, higher rate on a loaded host): the chapter's scene cue is not playing at the first spoken lines in 10 of 30 non-Ch-I runs**

- Game / chapter: both / IV, VIII, XI, XIII, XV (chapter-select still playing); II, V, XVIII (silent)
- Observed: At the pre-scene sample (about 4 lines into the opening scene, 14 to 22 s after load) the scene cue was not yet playing in 10 of 30 runs: still on chapter-select in 6 (evrae-airship-win, ffx2-bahamut-win, ffx2-bahamut-win-w2000, ffx2-den-of-woe-win, ffx2-fallen-aeons-win, ffx2-trema-win-t8), on no music in 4 (yunalesca-win, ffx2-vegnagun-shuyin-lose, ffx2-vegnagun-shuyin-win-s2, sin-face-win), the scene track not cached at that moment. Round 23 saw 5 of 55. Ch I is excluded: its script starts scene-gagazet at a scripted beat (seymour-flux.ts line 105), null music before it is by design. The music-loading code is unchanged since 72973096 and the network list shows no new fetches, and the capture host ran up to 8 browsers, so load is the leading candidate; the rate is not a clean measurement. The title cue's cold-session onset was not re-captured this round. The gap pass's cold title cue onset improved to 2.1, 2.3 and 3.4 s after the first Enter (round 24 about 6 s; host loaded). The gap pass's own scene-onset measure is invalid (sampled from the prep screen) and settles nothing.
- Repro: critic/rounds/round-25/audio/routing-samples.txt, rows pre-scene; e.g. evidence/ffx2-bahamut-win/audio-debug.jsonl pre-scene (22 s, playing chapter-select, cached only chapter-select) against evidence/ffx2-bahamut-lose (scene-bevelle-underground). Seed 1.
- Evidence: critic/rounds/round-25/audio/routing-samples.txt
- Confidence: medium; requirement: CHK-023; RUBRIC section 6 audio (phase transitions)
- Smallest fix: Warm the chapter's scene, boss and victory cues when the chapter is confirmed on the board (its musicKeys), so the first line never waits on a fetch.
- Acceptance check: On 20 runs with the chapter chosen by real input on an idle host, the scene cue is playing by the first line in 20 of 20.

### 41. PR-0326 (polish, audio)

**PR-0326 (carried, fifth review): the first UI sounds of a cold session are the procedural synth; the title's press-start cue is silent**

- Game / chapter: both / title, board, first seconds of any run
- Observed: First logged effect is the synth path in 33 of 34 runs (53 of 63 in round 23); 208 synth entries (cursor-move 170, confirm 26, menu-page 4, cancel 4, wind-gust 2, dome-echo 1, farplane-voices 1); the last synth entry falls at 25.4 s (ffx2-vegnagun-shuyin-win-s2), 22.2 s (sin-face-win), 20.6 s (yunalesca-win) on a loaded host; 'battle-start' is in 0 of 34 sfxLogs. Recorded sprite and v2 cues take over in the same runs, so this is the first seconds only. The wind, dome and Farplane ambients are synth-only.
- Repro: Fresh profile, headless Chromium PYREFLY_BROWSER=gpu, https://echoesofspira.com/, press Enter at the title, move the board cursor, read audioDebug sfxLog; evidence/seymour-flux-win/audio-debug.jsonl last row (cursor-move synth at 3.15 s and 3.35 s, v2 from 7.4 s). No seed involved.
- Evidence: critic/rounds/round-25/evidence/*/audio-debug.jsonl (sfxLog of the last row)
- Confidence: high; requirement: CHK-001 step 3 (no silent unintended fallback)
- Smallest fix: Play UI sounds only from a decoded sprite (playSfxFromSprite) until the sprite is ready, or warm the sprite before the title is interactive; wire battle-start (TitleScreen.ts line 203).
- Acceptance check: sfxLog[0].via is not synth in 20 of 20 cold runs and battle-start appears once at press-start.

### 42. PR-0374 (polish, audio)

**PR-0374 / PR-0220 / PR-0263 / PR-0298 / PR-0039 / PR-0260 / PR-0278 (carried; PR-0374 NOT reproduced: the pause cue hands over in 0.6 to 0.8 s in both games)**

- Game / chapter: both / all
- Observed: PR-0374 (FFX Ch I pause cue starts 0.5 to 1.0 s late): no pause-audio capture this round, UNVERIFIED. PR-0220 (a real pad on real Chrome is not proven to unlock audio): still UNVERIFIED, emulated touch runs reach the boss cue. PR-0263 (the SFX level has no ear confirmation): sfxMix {b,1,0.7} in 237 of 237 samples, and P1 now raises the menu tick by 5.3 dB and the error by 6.9 dB, so the question is wider. PR-0298: total audio is 100.80 MB of a 105 MB budget (raised from 100 by driver item 53a under Bailey's delegation). PR-0039/PR-0260/PR-0278: themes-audit still reports 4 of 26 composed cues departing the bible (output unchanged since round 18); the THEMES.md Ixion-row table break was not re-read. The gap pass sampled AudioManager about every 120 ms: Ch I boss-seymour to pause cue about 0.6 to 0.8 s after Esc and back about 0.7 s after the resume Esc, Ch IV about 0.7 s and 0.5 s, so PR-0374's FFX-late difference did not reproduce (fade curve not sampled: audioDebug exposes no per-cue gain).
- Repro: node tools/audio/themes-audit.mjs and node tools/audio/qa.mjs in D:/pyrefly-r40-rc.
- Evidence: critic/rounds/round-25/audio/qa.txt; critic/rounds/round-25/audio/routing-samples.txt
- Confidence: high (measurement), unverified (listening); requirement: CHK-001; CHK-B1
- Smallest fix: As in the carried entries: Bailey's ear on the audition page; a real-controller check; documentation repair.
- Acceptance check: As in the carried entries.

### 43. PR-0352 (polish, prep)

**PR-0352 (carried, unchanged): the Natus victory panel still lists no item although the research sources a Lv. 2 Key Sphere x2**

- Game / chapter: ffx / X Seymour Natus
- Expected: The sourced Lv. 2 Key Sphere with its quantity, or a stated reason in the data file.
- Observed: evidence/seymour-natus-win results: AP 9,450 x5 (overkill), gil 3,500, no ITEMS row.
- Repro: Win Ch X (seed 1, 3.7 min) and read the results text.
- Evidence: evidence/seymour-natus-win/run.json resultsText
- Confidence: high that nothing shows; source claim carried from round 24; requirement: AGENTS.md rule 6 (sourced data)
- Smallest fix: Give the Key Sphere an item record and list it in drops, or document the omission.
- Acceptance check: The Natus panel shows the Lv. 2 Key Sphere with the sourced quantity.

### 44. PR-0257 (polish, encounter)

**PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3 times longer than the sourced rows**

- Game / chapter: FFX only / III
- Expected: The sourced length of the gauntlet.
- Observed: 218 party turns and 32 minutes by real keys (braskas-final-aeon-win-b2); the first run stalled at the route's 15-minute budget with 120 turns; round 24 had 204 and 220.
- Repro: critic/rounds/round-25/evidence/braskas-final-aeon-win-b2/run.json
- Evidence: critic/rounds/round-25/evidence/braskas-final-aeon-win-b2/run.json
- Confidence: high; requirement: Pacing and sourced length
- Smallest fix: Bailey's call on the gauntlet's length.
- Acceptance check: A named target length.

### 45. PR-0429 (polish, narrative)

**PR-0429 (carried, WIDENED): Shuyin's taunt repeats 4 times in 117 s and 'Stop singing' twice in 15 s**

- Game / chapter: FFX-2 only / V
- Expected: No taunt twice within 60 s.
- Observed: 'You fight like someone who still wants something.' at 1142, 1219, 1248 and 1259 s of the run; 'Stop singing. Stop singing.' at 1376 and 1391 s (round 24: 3 repeats in 90 s). Jecht's 'Forget the lights up top. The leg's the job.' also repeats at 412 and 455 s in one run.
- Repro: Ch V seed 2 win, dboxTimeline in run.json.
- Evidence: critic/rounds/round-25/evidence/ffx2-vegnagun-shuyin-win-s2/run.json
- Confidence: high; requirement: writing-bible 1.21, banter variety
- Smallest fix: Two or three authored variants picked by the payload index in the Shuyin script (src/story/scripts/ffx2-vegnagun-shuyin.ts, the shuyin-taunt and shuyin-desperate scripts), FFX-2 only.
- Acceptance check: A full Shuyin link shows no taunt twice within 60 s.

### 46. PR-0390 (polish, narrative)

**PR-0390 (carried, re-observed): FFX-2 chapters open or continue in unattributed third person**

- Game / chapter: FFX-2 only / XIII, XV, XVI
- Expected: FFX-2 chapters are narrated in Yuna's voice (writing-bible 2.2).
- Observed: Ch XIII: 'Under Bevelle, a dungeon goes down a hundred floors.' (speaker blank); Ch XV: 'Ten old spheres. Paine's recordings, every one.'; Ch XVI mixes 'At the top of the stairs, the aeon turns on them.' and 'Ixion rises and charges.' (third person) with Yuna's 'I fell a long way.'
- Repro: Ch XIII, XV, XVI pre-battle and aftermath, seed 1.
- Evidence: critic/rounds/round-25/evidence/ffx2-trema-win-t8/run.json; ffx2-den-of-woe-win/run.json; ffx2-ixion-djose-win/run.json
- Confidence: high; requirement: research/writing-bible.md section 2.2
- Smallest fix: Put the captions into Yuna's first person or mark them as stage text.
- Acceptance check: No unattributed third-person line in FFX-2 openers.

### 47. PR-0262 (polish, narrative)

**PR-0262 and PR-0255 (carried, re-observed): '...Okay. Next one.' is the results quip on five chapters, and Tromell's five Ch VII lines have a blank speaker**

- Game / chapter: both / I, II, VIII, XVII, XVIII; VII
- Expected: Distinct quips; every spoken line attributed.
- Observed: resultsText of Ch I, II, VIII, XVII and XVIII all carry '...Okay. Next one.'; Ch VII's aftermath lines 'Step away from Lord Seymour, Lady Summoner.' to 'Traitors, all of you.' show a blank speaker.
- Repro: Results text and dboxTimeline of those runs.
- Evidence: critic/rounds/round-25/evidence/seymour-anima-macalania-win/run.json; seymour-flux-win/run.json; sin-face-win/run.json
- Confidence: high; requirement: writing-bible 5.4
- Smallest fix: Vary the quip bank per chapter from writing-bible 5.4; give Tromell a name and role.
- Acceptance check: No quip repeated across five chapters; no empty-speaker line.

### 48. PR-0254 (polish, narrative)

**PR-0254 (carried, STALLED, re-observed): Chapter VII Talk is still silent**

- Game / chapter: FFX only / VII
- Expected: A Tidus line and Seymour's reply near each Talk.
- Observed: Three Talks (fight 5.0 s, 8.3 s, 10.0 s) produce no dialogue line; Ch X's Talk does reply ('Stop talking. You never say anything.' then Seymour). Ch I Talk is also silent (not in the bible).
- Repro: Ch VII seed 1, real keys, Talk on turns 1 to 3.
- Evidence: critic/rounds/round-25/evidence/seymour-anima-macalania-win/run.json (picks, dboxTimeline)
- Confidence: high; requirement: narrative: banter and reachable character voice
- Smallest fix: Add Ch VII Talk triggers following Ch X.
- Acceptance check: A dbox line within 3 s of each Ch VII Talk.

### 49. PR-0444 (polish, narrative)

**PR-0444 (new, was R25-NARR-01, a question for Bailey): a wipe in the Shuyin fight gives a plain Defeat card; only the 240-turn cannon timer plays the bible's narrative loss**

- Game / chapter: FFX-2 only / V (fourth fight)
- Expected: Writing-bible E7: 'Running out the cannon timer, or being wiped, does not produce a normal Game Over' (Shuyin: 'There. Now it's quiet.', a white hold).
- Observed: Real-key wipe in link 4 (61 turns) went to the standard results card ('Defeat', Turns 61, Attempts 1, Retry, Chapter Select) with no Shuyin line between his last taunt and the card; src/battle/ffx2/ai/vegnagun-head.ts sets badEnding only on the timer, and results.ts treats a wipe as an ordinary defeat. Retry works.
- Repro: Ch V, lose in link 4, seed 1 (evidence/ffx2-vegnagun-shuyin-win-lose4).
- Evidence: critic/rounds/round-25/evidence/ffx2-vegnagun-shuyin-win-lose4/31-results.png; research/writing-bible.md lines 1111 to 1124
- Confidence: medium-high (the timer path was not played; the wipe result is seen); requirement: writing-bible E7 defeat text
- Smallest fix: Either say the timer-only loss is the intended version in the bible, or play shuyin-line-7 on a link-4 wipe too.
- Acceptance check: A link-4 wipe shows the loss scene or the bible states the timer-only rule.

### 50. PR-0445 (polish, narrative)

**PR-0445 (new, was R25-NARR-02, low confidence, taste for CHK-B3): the retrospective narrator explains the point (Ch VII)**

- Game / chapter: FFX only / VII
- Expected: Writing-bible 2.1: narration 'never explains what just happened'.
- Observed: Ch VII's closing narration ends 'I kept waiting for someone official to fix it. That was the trick. There was nobody above him.'
- Repro: Ch VII aftermath, seed 1.
- Evidence: critic/rounds/round-25/evidence/seymour-anima-macalania-win/run.json
- Confidence: low; requirement: writing-bible 2.1
- Smallest fix: Stop at 'I kept waiting for someone official to fix it.'
- Acceptance check: Bailey's call.

### 51. PR-0449 (polish, visual)

**PR-0449 (new, low confidence): Ch V pre-scene frame is black at the first line in 2 of 4 captures (harness or fade timing not ruled out)**

- Game / chapter: FFX-2 only / V Vegnagun and Shuyin
- Observed: evidence/ffx2-vegnagun-shuyin-lose/05-pre-scene.png and -win-s2/05-pre-scene.png show only the chapter header and the controls hint on a black ground, no painting and no dialogue plate, while -win and -win-lose4 show the Farplane painting with Nooj's line. Asserted as screen=pre-scene.
- Repro: FFX-2 Ch V, fresh profile, Enter from the prep screen, seeds 1 and 2; compare the four 05-pre-scene captures
- Evidence: D:/pyrefly-r39-int/critic/rounds/round-25/targets/vp.jpg
- Confidence: low; requirement: CHK-016 (state proved); player-visible scene
- Smallest fix: Capture three frames over the first 3 s of the scene to tell a slow fade from a missing backdrop; fix only if the painting is late.
- Acceptance check: First dialogue line is on screen over the painting in every capture.

### 52. PR-0450 (polish, harness)

**PR-0450 (critic tooling, new; merges R25-PD-01, R25-PD-02, R25-HX-01 twice, the evidence disagreement and PR-0431's neighbours): the round-25 instruments mis-measured or mislabelled five things**

- Game / chapter: both (tooling) / critic instrument
- Expected: One continuity answer per chapter.
- Observed: (a) delivery.mjs loaded twice and started its clock after __pyreflyReady, so first load was unmeasured (the chief's coldload.mjs fixes it: one navigation, cache disabled, timed from navigation start); (b) pause-matrix.mjs swept an 11 px floor, recorded no minimum and ran Ch I only (the chief's sweep14.mjs uses 14 px, the minimum and the count, over 18 chapters, four phone chapters and the prep tabs); (c) three gap captures did not reach the state they claimed (the "all-target" captures labelled from the advisor card, the Ch IV after-Esc frame, the plain-Attack clip; the multi-target step is now evidenced by the gap pass's multi-* captures); (d) the capture owner's inline continuity probes disagree with the dedicated harness when the host is loaded (Ch I 41.8 percent and 48 px at 46 fps with no pose registration against 12.1 percent and 0.8 px at 59.6 fps): inline numbers are not scored; (e) the harness still expects the post-scene before results (PR-0431: 30-post-scene UNVERIFIED in 5 runs).
- Repro: Compare evidence/seymour-flux-win/continuity/continuity.json with continuity/seymour-flux-win-r25/continuity/continuity.json.
- Evidence: critic/rounds/round-25/chief/coldload.mjs, sweep14.mjs; round-25/delivery.mjs; pause-matrix.mjs; evidence/seymour-flux-win/continuity/continuity.json
- Confidence: high; requirement: RUBRIC section 5 and 9 (separate harness failures from product failures)
- Smallest fix: Fold coldload.mjs and sweep14.mjs into critic/runner/lib; drop the inline continuity probe from the route (run the dedicated harness alone on an idle host).
- Acceptance check: A next-round report line per instrument; no capture asserts a state it did not read.
- Merged from: audit_feel-narrative: R25-HX-01 (critic tooling, new): the capture owner's inline continuity probes disagree wit ; audit_prep-delivery: R25-PD-01 (critic tooling): the delivery harness measures a warm second load and starts it ; audit_visual-targets: Capture-owner's embedded continuity output disagrees with the dedicated harness run for Ch

### 53. PR-0446 (suggestion, audio)

**PR-0446 (new, a question for Bailey; residual of PR-0425 which is RESOLVED): boss-seymour (Ch I, XII) and chapter-select still fail the stereo gate as shipped; D-582 is unanswered**

- Game / chapter: both (boss-seymour FFX, chapter-select and title both) / I, XII, board, title
- Observed: Measured on the live files: boss-seymour corr 0.293, side-to-mid -2.62 dB, mono loss -1.89 dB (gate 0.60 to 0.85, -10 to -6, no worse than -1); chapter-select 0.431, -4.00, -1.46; title passes only by a hair (0.602, -6.01, -0.97). These are the cues Bailey did hear wide and approved (D-544 'it sounds epic!', D-550, D-557), and the narrow variants are staged; D-582 ('as heard' or 'narrow') has no answer. The 8 cues of 2026-10-10 were narrowed and now pass. Audibility is an ear question; I make no claim.
- Repro: node critic/rounds/round-25/audio/stereo-gate.mjs boss-seymour chapter-select title (run from D:/pyrefly-r40-rc, shipped dist-release/audio).
- Evidence: critic/rounds/round-25/audio/stereo-gate.txt
- Confidence: high on the measurement, low on audibility; requirement: THEMES.md stereo gate; D-582
- Smallest fix: Ask Bailey once (D-582): keep as heard, or install the staged narrow variants (node tools/audio/music-elevenlabs.mjs install --variant=narrow, then re-measure). Do not swap on taste.
- Acceptance check: A decision row records Bailey's choice, or the three cues pass the gate.

### 54. PR-0410 (suggestion, audio)

**PR-0410 (carried, a question for Bailey): every defeat and Chapter IV's victory results are silent**

- Game / chapter: both / all defeats; IV victory
- Observed: 21 of 39 results samples have nothing playing: all defeats (Ch I x2, II, IV x2, V x2, XIII and others), intermediate chain-link results, and Ch IV's victory results (cue map 'none'); the 18 won-fight results all play the right victory cue. The Ch III link-2 seam and Ch II epilogue silences are scripted (braskas-final-aeon.ts, yunalesca.ts) and not defects.
- Repro: critic/rounds/round-25/audio/routing-samples.txt rows results with playing= null; e.g. evidence/ffx2-bahamut-lose and ffx2-bahamut-win audio-debug.jsonl.
- Evidence: critic/rounds/round-25/audio/routing-samples.txt
- Confidence: high; requirement: CHK-023; Bailey's question
- Smallest fix: Ask Bailey whether a defeat cue and a Ch IV victory cue are wanted; build none without a yes.
- Acceptance check: Bailey's answer recorded.

### 55. PR-0405 (suggestion, delivery)

**PR-0405 (carried, re-measured, caveated): about 29.7 MB of art is downloaded after the title is already ready**

- Game / chapter: both / title
- Expected: The title requests what it draws and defers prefetch until input or idle.
- Observed: After __pyreflyReady the page received 26 responses carrying 29.7 MB (10.3 MB PNG, 19.3 MB WebP, by content-length only) within the 1.5 s plus 3 s sample; the per-chapter lists show a battle run requests 986 unique media files over the set. On a slow link this competes with the player's first input; round 22 saw a 36 s reload under 1.6 Mbps (PR-0394). Chief re-measure with a correct cold load: cold load to an interactive title, one navigation per fresh browser, cache disabled, nothing else running (GPU PAUSE held), 1600x900: unthrottled 3.6, 0.8, 0.7 s (about 2.1 MB and 12 requests before the title; the first run is the cold DNS/TLS one); on 1.6 Mbps / 150 ms 11.2 s (2.1 MB, first paint 1.6 s, DOMContentLoaded 11.1 s). In the 24 s after the title (cache disabled, the first-visit Auron briefing running, then the board) the unthrottled page fetched about 121 MB in about 96 requests (board art and music); on the 1.6 Mbps link about 0.8 MB.
- Repro: Load the site cold and log responses after the title appears.
- Evidence: evidence/gaps/delivery/out.json bytesAtTitle
- Confidence: medium (cold-load measured by the chief; per-file bytes at Content-Length); requirement: load time clause, PR-0259
- Smallest fix: Re-run with a correct cold-load script (R25-PD-01) and, if confirmed, defer the board prefetch to the first key.
- Acceptance check: Bytes before first input at most the title's own files.

### 56. PR-0396 (suggestion, delivery)

**PR-0396 (carried, re-observed): the hashed bundle is still served public, max-age=0, must-revalidate**

- Game / chapter: both / delivery
- Expected: A long max-age and immutable on content-hashed assets if Bailey wants return visits to skip revalidation.
- Observed: verify-live reads assets/index-CvOwYJX5.js with Cache-Control public, max-age=0, must-revalidate; index.html has the same policy.
- Repro: curl -I https://echoesofspira.com/assets/index-CvOwYJX5.js
- Evidence: round-25/verify-live-sample.json assetCacheControl
- Confidence: high; requirement: load time
- Smallest fix: public/_headers: /assets/* long max-age, immutable.
- Acceptance check: A repeat load sends no conditional requests for hashed assets.

### 57. PR-0447 (suggestion, encounter)

**PR-0447 (new, was R25-ENC-03, a question for Bailey): random legal play wins Chapter IX 9 of 40 seeds (22.5 percent)**

- Game / chapter: FFX only / IX
- Expected: A boss whose designed line is the aeon at gauge 96 is not beaten by unplanned item use about one time in four, or the item race is the intended line.
- Observed: Seeds 4001 to 4040: Yojimbo intended 39/40, random 9/40, attack only 0/40, defend only 0/40; the party's items (Fire Gems hit five times for about 600) are legal rows, and the real-key win (13 party turns) used Fire Gems rather than the summon line.
- Repro: critic/rounds/round-25/audit-combat/strategies.probe.ts with PC=yojimbo-cavern PS=40.
- Evidence: critic/rounds/round-25/audit-combat/strat.out
- Confidence: medium; requirement: Credible wrong tactics do not trivially win
- Smallest fix: None proposed; the sources (research/ffx-yojimbo.md) make Yojimbo 33,000 HP. Ask Bailey whether the Fire Gem race is the design. Never weaken the boss.
- Acceptance check: An owner statement of the intended line.

### 58. PR-0448 (suggestion, encounter)

**PR-0448 (new, was R25-ENC-04, a question for Bailey, builder-disclosed): Chapter XVIII is now the easiest chapter, 100 of 100 fresh seeds**

- Game / chapter: FFX only / XVIII
- Expected: An owner-chosen difficulty for the final fight.
- Observed: Shipped line 100/100 and 40/40, advisor card 30/30, 0 party KOs, Sin dead on its eighth turn of twelve; skipping either the Doublecast or the Wards still loses (72 and 18 of 100). Bailey answered 'Keep it, 500 of 500' on 2026-10-10.
- Repro: PYREFLY_CH18_LADDER=1 PYREFLY_MEASURE_SEEDS=3001-3100 npx vitest run tests/unit/re-parity-ch18-ladder.test.ts
- Evidence: critic/rounds/round-25/audit-combat/ch18-ladder.json
- Confidence: high; requirement: Correct difficulty
- Smallest fix: None; recorded so the choice stays visible. The lever is one preset line (docs/handoff/re-parity-ch18.md decision 1).
- Acceptance check: None.

### 59. PR-0399 (suggestion, visual)

**PR-0399 (carried, a question for Bailey; target tile 35 waiting): the Leblanc backdrop's picture and Bailey's written pick disagree**

- Game / chapter: FFX-2 only / VI Leblanc
- Observed: The tile picture (backdrop-c.png) is a warm crate warehouse with a teal door; the tile's must-change line asks for a mixed magenta and cyan room with a visible door and heart panel, which is what the build shows (neon heart over a blue door, Ch VI first menu and pre-scene). Build matches the written pick, not the picture.
- Repro: FFX-2 Ch VI, ffx2-leblanc-win/05-pre-scene.png and 23-midfight.png beside docs/concepts/chapters/leblanc/renders/backdrop-c.png (composite targets/35-leblanc.jpg)
- Evidence: D:/pyrefly-r39-int/critic/rounds/round-25/targets/35-leblanc.jpg
- Confidence: high; requirement: RUBRIC section 7 approved-target gate
- Smallest fix: Bailey decides which is the target; then correct the tile or the backdrop. No agent change.
- Acceptance check: Tile 35 moves to matched or the picture is replaced by the decision.

### Carried open from round 24, not re-observed this round

PR-0426 (minor), PR-0428 (polish), PR-0431 (polish), PR-0432 (polish), PR-0377 (polish), PR-0408 (polish), PR-0355 (polish), PR-0403 (polish), PR-0409 (polish), PR-0348 (polish), PR-0381 (polish), PR-0418 (polish), PR-0419 (polish), PR-0420 (polish), PR-0382 (polish), PR-0402 (polish), PR-0411 (polish), PR-0412 (polish), PR-0413 (polish), PR-0414 (polish), PR-0252 (polish), PR-0415 (polish), PR-0416 (polish), PR-0363 (polish), PR-0251 (polish), PR-0259 (polish), PR-0394 (polish), PR-0404 (polish), PR-0388 (polish), PR-0392 (polish), PR-0393 (polish), PR-0398 (polish), PR-0334 (polish), PR-0314 (polish), PR-0301 (polish), PR-0364 (polish), PR-0344 (polish), PR-0365 (polish), PR-0308 (polish), PR-0371 (polish), PR-0104 (polish), PR-0315 (polish), PR-0316 (polish), PR-0341 (polish), PR-0256 (polish), PR-0272 (polish), PR-0350 (polish), PR-0351 (polish), PR-0273 (polish), PR-0280 (polish), PR-0263 (polish), PR-0220 (polish), PR-0039 (polish), PR-0260 (polish), PR-0278 (polish), PR-0298 (polish), PR-0237 (polish), PR-0324 (polish), PR-0327 (polish), PR-0223 (polish), PR-0339 (polish), PR-0261 (polish), PR-0375 (polish), PR-0376 (polish), FOC37-03 (polish), PR-0342 (polish), PR-0347 (polish), PR-0346 (polish), PR-0248 (polish), FOC37-01 (polish), PR-0249 (polish), FOC28-P02 (polish), PR-0239 (polish), PR-0246 (polish), PR-0247 (polish), PR-0250 (polish), PR-0271 (polish), PR-0276 (polish), PR-0277 (polish), PR-0286 (polish), PR-0288 (polish), PR-0291 (polish), PR-0296 (polish), PR-0302 (polish), PR-0303 (polish), PR-0304 (polish), PR-0305 (polish), PR-0317 (polish), PR-0319 (polish), PR-0322 (polish), PR-0323 (polish), PR-0325 (polish), PR-0331 (polish), PR-0332 (polish), PR-0335 (polish), PR-0336 (polish), PR-0337 (polish), PR-0359 (polish), PR-0032 (suggestion), PR-0417 (suggestion), PR-0400 (suggestion), PR-0299 (suggestion), PR-0358 (suggestion), PR-0217 (suggestion), PR-0368 (suggestion), PR-0297 (suggestion), PR-0329 (suggestion), PR-0338 (suggestion)

## Resolved, merged, downgraded and refuted this round

**Resolved**
- PR-0279: Ch XVIII (Sin: Face) wins almost never. Won by real keys at seed 1 (47 party turns, 3:41); the engine wins 100 of 100 fresh seeds (r24 0 of 100); Wards blocked all 7 Gazes. Now the easiest chapter (PR-0448 is the question).
- PR-0353: Ch XIII Trema has no real-key victory. ffx2-trema-win-t8: seed 1003, 244 turns, 33 minutes. Typicality is PR-0227.
- PR-0425: the two new ElevenLabs cues fail the stereo gate. All 8 narrowed cues pass (corr 0.696 to 0.703, side-to-mid -7.5 dB); boss-seymour and chapter-select remain (PR-0446).
- PR-0424: THEMES.md rows IV and VI name boss-ffx2-aeon. themes-audit chapter map 0 of 18 depart; 43 audio vitest files (694 tests) pass.
- PR-0269: the Ch XVII advisor chain clears 97 of 200 seeds. Card chain 73 percent (r24 48.5), card 22/30 against the intended line 23/30; the remaining difficulty is the encounter's.
- PR-0378 (part): the KO is a one-frame cut. Snaps 0.60 to 0.02 a minute; the KO is a short dissolve (PR-0378 stays open as a minor for the three boss hard cuts and the question fall or dissolve).
- PR-0374 (observation): FFX Ch I pause cue starts late. Not reproduced: 0.6 to 0.8 s out and 0.7 s back in Ch I, 0.7 and 0.5 s in Ch IV.

**Merged**
- PR-0380 absorbs the capture owner's jerk issue, the fan's pop-in, teleport and lunge-return breakers and PR-0401.
- PR-0379 absorbs the fan's crossfade pattern and the Yojimbo and Fem-Goon ghost items.
- PR-0366 absorbs PR-0320, PR-0370, the narrowed PR-0333 and the fan's UI-covers-the-action and overlapping-figures items.
- PR-0227 absorbs PR-0306 and R25-ENC-01 and the capture owner's 41-second Ch V loss.
- PR-0391 absorbs PR-0293; PR-0356 absorbs R25-PD-02 and R25-HX-01; PR-0397 absorbs the capture owner's and the prep auditor's reports; PR-0450 absorbs the instrument items.

**Downgraded**
- PR-0379 major to minor
- PR-0407 major to minor (the restore rule is live and seen)
- PR-0222 major to minor (unexercised; no FF7 change in the diff)
- PR-0333 major to polish (narrowed to the coach moment)
- PR-0295 polish to major (now observed: 3 px text on a phone)

**Refuted**
- First-time fan: Rikku looks much bigger when she attacks, Wakka bigger when he kneels (size jumps): CHK-026 PASS over 10,072 swaps (worst feet 1.5 px, registered head 0.2 percent); the fan itself says most size changes in the strips were the camera or a crop change. Not filed as an issue.
- First-time fan: "nothing happens for 9 seconds after Attack is confirmed" as a defect in two chapters: CAUSE ESTABLISHED by the chief (enterdelay.mjs, enterdiag.mjs, 8 and 4 fresh-browser trials, Ch I, real keys): the first-time coach card "Auron - 3 of 3: He moves after you..." appears a few seconds after the first menu and the first Enter dismisses the card (ENTER / ESC SKIP, by design) instead of opening the Attack target step; in 3 of 4 diagnostic trials the card was still up when the harness pressed Enter, the second Enter opened the target step at once, and after the card is gone Enter opens it in 33 to 39 ms. Four of the eight delay trials lost their first Enter this way. A harness-ordering artefact and a first-time-only design, not an input defect; the gap pass and the feel auditor unexplained 9 s clip is the same thing.

## What stands between this build and acceptance

A milestone needs 9.60 unrounded, every category at 9.0 or more, no UNVERIFIED category or mandatory check and no open critical or major issue. Today: audio, prep and delivery carry no number (audio needs Bailey's ear; prep needs a changed value shown reaching the first menu; delivery needs named hardware, a real phone, a real pad and Firefox, which does not launch on this host); encounter 8.9, visual 8.6, feel 8.5, narrative 8.7, interface 8.2 and onboarding 8.3 are under the 9.0 floor; CHK-001, 002, 003, 008, 009 and 027 FAIL; CHK-005, 006, 010, 015, 023 and B1 are UNVERIFIED; five majors are open; 13 targets are unverified and one waits on a decision; no human judgment is recorded. The next build's largest levers, in order: the three boss entrances and the fins' blend (PR-0380, PR-0379, PR-0378), the phone prep layouts and the 14 px floor on prep and results (PR-0295, PR-0356), Bailey's ear on the audio (PR-0148), then the questions for Bailey (PR-0227, PR-0436, PR-0437, PR-0446).

## What changed since round 24 (72973096)

- Motion: snaps 0.60 to 0.02 a minute, severe double images 253 to 44, jerks of 40 px or more 1,043 to 532, CHK-026 FAIL to PASS (the KO fall, the revive mirror, the 80 ms recoil and the real-clock blends landed).
- Combat and encounter: Chapter XVIII 0 to 100 of 100 fresh seeds, Chapter X 62 to 97 by the reflect line, Chapter XIII first real-key victory, Ch II 100 to 94 (the summoner's recovery rule, sourced and disclosed); FFX-2 untouched and equal within noise; the W5 gauge, aeon recovery counts and Cid's menu verified against the raw tables.
- Audio: all 8 narrowed cues pass the stereo gate (PR-0425 resolved), themes-audit clean (PR-0424 resolved); seven new cues route right in every chapter; still no ear verdict.
- Evidence: the pause matrix, prep tabs, TEXT SIZE, multi-target steps, phone Ch XI and cold load were captured for the first time in several rounds; the three round-24 instrument gaps (P5 a, b, c) are partly closed (PR-0450 lists what is left).
- Round 24 majors: PR-0378, PR-0279, PR-0353, PR-0269 resolved or downgraded; PR-0379, PR-0407, PR-0222, PR-0333 downgraded; PR-0295 raised. Rubric v1 rounds 02 and 03 are history under another rubric and are not compared.

## Proposals (nothing here is built without Bailey's yes)

- Warm each chapter's scene, boss and victory cues when the card is confirmed on the board (idea: the first line never waits on a fetch, PR-0373). Benefit: removes the 10-of-30 late scene cues. Cost: a few lines in the music loader. Fit: both games. Risk: more bytes early. Nothing is built without Bailey's yes.
- Phone layouts for the heavy prep tabs (PR-0295): one shared single-column list per tab at 14 px. Preview: the tab-3-EQUIPMENT.png capture beside a mockup. Fit: both games (FFX tabs and FFX-2 tabs differ). Needs Bailey's mockup pick before building (hard rule 9).
- D-582 once, as a question: boss-seymour and chapter-select as heard, or the staged narrow variants (node tools/audio/music-elevenlabs.mjs install --variant=narrow); measure then choose by ear on the audition page.
- A defeat cue and a Chapter IV victory cue (PR-0410): benefit, the loss and the Bahamut win sound like events; cost, two cues and a budget check (100.80 of 105 MB used); fit: both games, Bahamut's results are deliberately uncelebrated in the bible. Needs Bailey's yes.
- FFX-2 human-pace difficulty (PR-0227): three measured options (leave and disclose, a recovery rule for the girls, a longer first-menu clock), each built and measured, none a boss tune by hand. Fit: FFX-2 only.
- Long-cache headers on content-hashed assets (public/_headers, PR-0396): repeat visits skip revalidation of 5,000 files. Cost: one header block; risk: a bad deploy sticks for a year unless the hash changes with the content (it does).
- REDUCE FLASHES, a colour-vision setting and a key-remap row in Options (PR-0032): accessibility options the sources neither require nor forbid. Needs Bailey's yes.
- Defer the board's 29.7 MB of art to the first key (PR-0405) so a slow link's first input is not competing with it. Preview: coldload.mjs on 1.6 Mbps (title in 11 s today).

## Next review

The deep obligation of 72973096 is not settled by this report either: audio, prep and delivery carry no number, CHK-001, CHK-002, CHK-003, CHK-008, CHK-009 and CHK-027 FAIL and a dozen mandatory checks are UNVERIFIED, so critic-clear settles nothing and the debt moves to the next build. Next batch, tooling first (no Bailey decision): fold coldload.mjs, sweep14.mjs and the exact-id target patch into critic/runner/lib (PR-0397, PR-0433, PR-0450). Product batch after Bailey's answers: the three boss entrances and the fins' blend (PR-0380, PR-0379, PR-0378), the phone prep layouts (PR-0295), the 14 px floor on prep and results (PR-0356), then PR-0421. Bailey's ear on the 9 cues (PR-0148) is the one item no build can supply. Stagnation (RUBRIC section 8): PR-0380, PR-0099 and PR-0227 are open at the same severity two reviews, so the next batch in those areas starts with a written method check.

## clear output

```text
[D:/pyrefly-r40-rc, where critic/pending/fcecfa74.json lives]
  still pending deep: required coverage was not tested: CHK-B1 and CHK-B2 (Bailey's ear and play): no agent can supply them., CHK-005 broken boards and the CHK-006 overlay exits beyond the target reticle and battle end: not constructed., CHK-015 gamepad, pause on the results screen and during a cutscene, Ch IV single-target cancel; CHK-010 Hastega, Ch XII, marker contrast; CHK-011 eight chapters' target frames., CHK-023: the third Talk in Ch III, the airship Cancel row in Ch VIII, the Overdrive and Trigger Command input windows, FFX-2 chain-seam clips at 60 fps, the boss-special clips., Prep: a changed value (equipment, item, sphere) reaching the first battle menu; reward values source-audited for the changed Fallen Aeons, Ixion and Trema data., Delivery: named hardware, a real phone, a real gamepad, a throttled reload at the board (PR-0394 last measured at 36 s in round 22), the post-title download on a slow link., Audio: the Ch V link-5 continuous log across boss-vegnagun to boss-shuyin, scene-cue onset on an idle host (the gap pass's measure was invalid), real-device audio unlock., The Ch IV wide camera pull at 1600x900, 2000x1012, 2560x1080 as a continuous clip (PR-0421).
[D:/pyrefly-r39-int, the default tree]
critic:clear no pending marker for build fcecfa74: kept as candidate evidence
```