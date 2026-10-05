# Critic round 20: deep review of live release 37 (main cd9dbbb0, bundle BGBDEn_P)

```text
Build / artifact / target version: main cd9dbbb0, bundle BGBDEn_P / artifact 766d9587007f584bd20256f6afbaaa1397252b47ea3aa7e3d1f40a49283898f7 (1,716 files, 798,329,071 bytes) / targets.json 83bef3ea9fbf74b3f83d7acf070a58d79dc2d8fc7f385768f9e95fb06c96dd10
Review: deep (after the deploy, on the live build https://baileypillon.github.io/pyrefly-reprise/)
Deployment: PASS (exact artifact verified live, critic/reviews/cd9dbbb0-live.json; 31 real-input runs played it; the one 404 is missing art in the build, PR-0311)
Changed area: FAIL (FOC37-02 regression, PR-0340 Lady Luck unreachable, PR-0330 widened, PR-0341 unconfirmed, several named changes unverified)
Ship: HOLD. FOC37-02 is a major regression against live 36 (Trigger Happy: Enter, touch and pad now get one hit). Already live, so this rolls nothing back: fix forward or roll back is Bailey's call. Discloses PR-0148, PR-0308, PR-0269, PR-0311, PR-0341, PR-0340, PR-0310, PR-0270, PR-0099, PR-0222; polish regressions PR-0330, FOC37-03
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED, no number); combat 9.2, encounter 8.9, visual 8.8, feel 8.6, narrative 9, audio UNVERIFIED, interface 8.2, onboarding 8.6, prep 9.1, delivery 8.4
Targets: required 89 / matched 70 / failing 0 / unverified 18 / waiting on decision 7
Top issues: FOC37-02 (HOLD, Trigger Happy input), PR-0148 (no listening score), PR-0308 (Overdrive inputs), PR-0269 (Ch XVII card 48.5%), PR-0311 (Thief mannequin, no Rikku Warrior), PR-0341 (Ch IX boss not drawn at first menu), PR-0340 (Lady Luck unreachable), PR-0310, PR-0270, PR-0099
Coverage: 18 chapters by real keys on live (16 won, Trema and Den lost), 3 sizes, GPU headless; reused: save matrix, audio save half, Trema/Den text; not tested: perf, gamepad, other browsers, 4:3/21:9/4K, phone outside battle
Next required review and why: a focused review of the fix-forward candidate (FOC37-02 with touch and pad captures); this build still owes coverage.requiredNotTested
Elapsed review time / repeated work avoided: about 190 min wall; no 19b frame reused as evidence, save matrix reused with a dependency argument
```

## Score (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, interface, onboarding, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-018 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-B1 is UNVERIFIED
  - 11 critical or major issue(s) remain open
  - 18 required target(s) unverified
  - 7 required target(s) waiting
  - only 70 of 89 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
  - human judgment not recorded: Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
  - human judgment not recorded: Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
  - human judgment not recorded: Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
  - human judgment not recorded: Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
  - human judgment not recorded: Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270)
  - human judgment not recorded: Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
  - human judgment not recorded: Art: Yuna Thief painting options, or take Thief out of the Ch VI grid until it exists (PR-0311)
  - human judgment not recorded: Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
  - human judgment not recorded: Combat (FFX-2): should Lady Luck be reachable (a grid node for its owner) or ship dormant (PR-0340); should the reels be timed by the press (PR-0349)
  - human judgment not recorded: Combat (FFX-2): Trigger Happy honours the press count (the faithful rule) - confirm that, and how a phone or pad player presses (FOC37-02)
report: valid evidence
```

## Ship decision

- HOLD: FOC37-02 (major) is a regression against live release 36: since release 37 the Trigger Happy press count decides the damage, but only keyboard R / PgDn count; Enter (measured live: 0 hits, one 118 hit), touch and pad (traced: no route) now get one hit where release 36 always rolled 6 to 16.
- No critical defect was found: every chapter reached an outcome through real input, the exact artifact is live, and no save path changed.
- Disclosed majors that are not regressions: PR-0148, PR-0308, PR-0269 (improved), PR-0311 (widened to Rikku Warrior), PR-0341 (new, cause and regression status unknown, unconfirmed single run), PR-0310 (not re-measured), PR-0270, PR-0099, PR-0222; PR-0340 sits inside the brand-new Lady Luck feature and does not block.
- Polish regressions disclosed: PR-0330 (advisor card stub, now also Ch VII Anima at 2000x1012) and FOC37-03 (Ch IV coach clip at 2000x1012, not reproduced this round).
- Gains measured against release 36: hurried entry 3.4-5.2 s (PR-0061 resolved), dressphere shot held 1.4-1.6 s, KO bodies clear of the rows (PR-0318 resolved), overkill drops sourced (PR-0258 resolved), living pause portraits with a working REDUCE MOTION off, Ch XVII card 4.5 -> 48.5 percent, Sin XVII and XVIII won by real keys, no source maps.

Verdict notes. Deployment: PASS: the exact artifact (766d9587..., bundle BGBDEn_P) is what is live (critic/reviews/cd9dbbb0-live.json verify-live PASS, re-run by the prep-delivery auditor), and 31 real-input route runs loaded and played it with 0 console errors outside the two Trema runs, whose one 404 is a missing art file in the build (PR-0311), not a deployment fault. Changed area: FAIL: release 37's changed systems did not all meet their targets: FOC37-02 is a major regression (Trigger Happy input), Lady Luck is not reachable (PR-0340), PR-0330 regressed further in Ch VII, Yojimbo and Daigoro missing at one first menu (PR-0341, cause unknown), and several named changes (row-follow, EYE CANDY repairs, Auron line, Talk card, end banner, plate defocus, 21:9 wings) were not verified. Living portraits, Ginnem's glow, the held dressphere shot, KO staging, the hurried entry, overkill drops and the Sin advisor met theirs. Ship: HOLD under RUBRIC section 3: one major regression against release 36 (FOC37-02). The build is already live; this verdict says it is not better than release 36 on that point, it rolls nothing back. The remedy is Bailey's choice: a fix-forward candidate (the smallest fix is in FOC37-02) with its own focused review, or a rollback that would also take away release 37's gains.

## Categories (weights 20/10/15/10/10/10/10/5/5/5)

### combat: 9.2

CHIEF: 9.2, held at round 19b (the combat auditor proposed 9.3). The auditor's +0.1 rests partly on "a sourced subsystem that did nothing now works": the gap pass shows Lady Luck's reels are reachable by no player on any shipped grid (PR-0340), and Trigger Happy's honoured count works only for keyboard R / PgDn (FOC37-02), so that half of the gain is not player-facing. What stays: PR-0258 resolved on the live results screen, PR-0269 improved 4.5 -> 48.5 percent on 200 seeds, no regression in 1,200 A/B digests and 13 of 13 real-key FFX logs replayed event for event. AUDITOR TEXT: Round 19b: 9.2. Gain 0.1, stated: a sourced subsystem that did nothing now works and a carried major improved on its own metric, with no regression anywhere I measured. Not higher: PR-0308 (major) is open and unchanged, and the release's new FFX-2 subsystems were never invoked in any real-key capture. NO BROWSER; pure engines, seeded benches, unit suite, owner event logs. Main tree D:/Final Fantasy, src byte-identical to cd9dbbb0; baseline for A/B = git archive of c69de96a (release 36). Scratch and outputs: critic/rounds/round-20/combat/.

WHAT CHANGED IN COMBAT (git diff c69de96a..cd9dbbb0, src/battle + src/data + tactics + presenter): (1) FFX overkill doubles item drops (results.ts, PR-0258, FFX only); (2) FFX-2 Lady Luck: new reels.ts + data/ffx2/reels.ts pay table, Dud, Auto-Life payload, reel CT Long, spinner-owned minigame answer (suspendedActor), minigame result carried on 'ability' commands (also makes a human's Trigger Happy press count count), status-only action on an immune target emits a 'miss immune' event; (3) new Samurai records Magicide, Shin-Zantetsu, Clean Slate (reel payloads only; in no dressphere menu list); (4) Vegnagun Bulwark immunities (Str/Mag/Def/MDef Up-Down now land); (5) Ch XVII Sin advisor tactic (sin-common, sin-fins-core, PR-0269) and Omnis/Evrae/advisor text hooks (no engine effect).

DATA AUDIT against research/ (typed my own oracle, did not read src/data/ffx2/reels.ts): all 216 stops of each of the two reel sets pay exactly what ffx2-combat-core 3.12 says (read left to right; three of a kind / slots 1+2 / lone Cherry in slot 1 / else Dud; Red 7 and BAR have no pair row so 7-7-x and BAR-BAR-x are Duds): 0 mismatches, 56 paying stops and 160 Dud stops per set (tiers 6 three / 20 pair / 30 cherry). Payload constants match section 2.9.1/3.12 worked examples (Ultima power 70, Black Sky 6 x 10, Flare 55, Excalibur 32, Delay Buster 18, Intimidate 16 Slow 100, Armor Break 18, Demi 4/16, Cripple 8/16). Magicide 4 MP power 8 Str vs MP; Shin-Zantetsu 32 MP, Death 80, all enemies, CT Long (sec 1.3 names it); Clean Slate 16 MP self, 25 percent max HP, magical so Shell halves it, cures exactly Curse/Darkness/Pointless/Poison/Silence/Slow: all match 3.9/2.3. Dud = percent-current power 12 (75 percent) through step 7's 240..271/256 randomiser (sec 2.1: every step-7 action), all-allies relative to the spinner, noChain: measured at 1, 2, 3, 10, 777, 9999 HP, no KO from the Dud, whole party once, 70 to 79 percent (the builder's 'not a flat 75' is the sourced pipeline, not a defect). Estimates are labelled in code (reel CT, Auto-Life targeting, re-aim rule, noChain carve-out). Bulwark immunities: both Bulwarks immune to all 23 statuses sec 3.3 lists and to none of Str/Mag/Def/MDef Up-Down: 0 missing, 0 wrong. Sampled 29 unchanged boss HP/AP/gil values (FFX I to XVIII, FFX-2 IV to XV) are all present in their research files. Overkill: Anima win replay gives Ability Sphere 1+1+2 (overkilled Anima doubled) and the live results screen reads 'OVERKILL x1 ... Ability Sphere x4, Blk Magic Sphere' (critic/rounds/round-20/evidence/seymour-anima-macalania-win/31-results.png), research 140/224/264 'x2 on overkill'. PR-0258 is RESOLVED (round 19b: x3, expected 4). Natus still ships drops: [] (see R20-CE-06).

NO REGRESSION, MEASURED: (a) unit suite on this tree: 768 files passed, 5 skipped (env-gated benches), 11,273 tests passed, 0 failed (critic/rounds/round-20/combat/vitest-full.txt); ffx-engine-golden re-pinned only for Anima (overkill drops), ffx2-atb-golden unchanged and passing. (b) A/B digest bench, same driver on c69de96a and cd9dbbb0, sha256 of every link's full event log, 120 seeds each: FFX-2 Ch IV, V, VI (Wait, D=0), Ch XI Fallen Aeons intended and wrong lines, Ch XV Den intended and wrong, Ch XIV Ixion sensible and naive, Ch XIII Trema intended: 0 digest differences in all 10 families (1,200 runs). (c) FFX three-line bench re-run: all 53 rows byte-identical to round 19b. (d) Overdrive rows probe and params probe re-run: identical to 19b except the build string; link-3 rows and CTB sourced rows identical. (e) independent CTB test zz-ctb-sourced passes (ICV table at 256 agilities, Haste floors, Slow doubles, MITIGATION chain vs BigInt).

CHK-023 FIDELITY: replayed 13 real-key FFX command streams of this round's capture through the pure engine at the recorded seed with the chapter's own setup: 13 of 13 identical event for event, outcome included (Flux win 73 and loss 3, Flux phone defeat 9 x2, Yunalesca defeat 116 and the 19b-route win 120, Braska 125 commands, Anima 52, Evrae 76, Yojimbo 17, Natus 45, Omnis 115, Sin face 64). battle-log.json holds attempt 1 only (seed 1), so retry attempts (seeds 1001/2001) are not replayable and are UNVERIFIED. Game separation CHK-021: 0 atb / spherechange / chain events in the 12 FFX logs and 0 ctb / overdrive-gauge / turn-preview / switch events in the 14 FFX-2 logs (the two Mortiorchis 'charge' events in Flux are FFX's own).

MEASURED GAIN: Ch XVII advisor-card chain (the v3 card, options {}, shipped switches, seeds 1 to 200): c69de96a 9/200 (4.5 percent), cd9dbbb0 97/200 (48.5 percent); the bench's own sensible line 51/200 and naive 0/200 are identical on both trees. Ch XVIII rows unchanged. PR-0269 stays open (Genais's Sigh on link 3 now loses 60/200 runs).

OPEN / CARRIED: PR-0308 major, unchanged (src/battle/ffx/overdrive.ts:311-316 still hard-codes one 7-input sequence and tidus-timing travel 1400 / zone 22 for every Bushido and Swordplay; params probe identical). PR-0217 Zombie kept across KO, not re-measured (no status code changed).

UNVERIFIED (never invoked in any real-key capture; 0 reel, 0 Trigger Happy, 0 immune-status miss events in 14 FFX-2 logs): the Lady Luck human path through the real overlay, the Trigger Happy human count, the new immune miss event, Bulwark Break landings. They are covered by engine and presenter-level tests (ffx2-lady-luck-reels, -human, -active, ui-ffx2-lady-luck, minigame-resubmit, data-ffx2-vegnagun-stat-immunities, ffx-overkill-drops) and by my own probes, which pass, but not by real input; see capturesNeeded. Trigger Happy honouring the human count is the faithful rule (hits 3 gives 3 damage events, 12 gives 12, 16 gives 16, unattended 14) and the shipped autopilot is unchanged (Ch V digests identical); I do not file the builder's disclosed 'major' as a defect.

### encounter: 8.9

Held at round 19b's 8.9. No encounter data, AI script, phase rule or party preset changed in cd9dbbb0 except the Bulwark immunity block, which the A/B digest bench shows moves nothing in Ch V (intended line identical on 120 seeds). The one measured movement is the Ch XVII card chain, which is PR-0269 and is credited in combat only (not double counted). NO BROWSER; pure engines, seeded benches, owner event logs.

SEEDED EVIDENCE ON THIS BUILD: FFX three-line bench (intended, advisor card, mash; seeds 1-40 plus 40 large seeds; 9 chapters): 53 rows byte-identical to round 19b, as expected when engine, data and tactics are unchanged for those chapters. Wins / 40, intended | advisor: Flux 18 | 19, Yunalesca 40 | 38, Braska 39 | 39, Macalania 38 | 37, Evrae 40 | 40, Yojimbo 33 | 40, Natus 31 | 38, Omnis 27 | 24, Sin face 12 | 15; mash loses 40/40 everywhere, so credibly wrong play loses and canonical play is not penalised. FFX-2 on both trees, 120 seeds, bench speed under Wait (autopilot ceiling, not human pace): Bahamut 120, Vegnagun/Shuyin 112 (93 percent), Leblanc 120; Fallen Aeons intended 105 vs wrong 74; Ixion sensible 119 vs naive 51; Den intended 9 vs wrong 0; Trema (unshipped config) 0. Repo benches printed in the full run (shipped settings): Ch XV Den as shipped first try 48/200 (24 percent) at the live Wait split 1.5 s / 0.5 s, within 3 tries 127/200, within 5 tries 162/200, Active 1.5 s 18/200; Ch XIII Trema as shipped, chapter 14/200 bench and 13/200 human Wait split (Paragon link 26/200, Trema fresh 177/200); Yojimbo 153/200 intended, 0/200 wrong; Natus 115/200 intended, 0/200 wrong; Isaaru shipped line 173/200.

REAL-KEY OUTCOMES (capture owner, replayed by me where single link): wins in Ch I (73 turns), III (204), IV (50, phone 47), V (149), VII Anima (52), VIII Evrae (76), IX Yojimbo (17), X Natus (45), XII Omnis (116), XIV Isaaru (32), XVII (252), XVIII (64), FFX-2 Fallen Aeons (115), Ixion (51, third run; runs 1 and 2 aborted at 0.21 min, harness), Leblanc (76 on the rerun; first run STALLED, see R20-CE-05). Losses: Yunalesca new route lost twice (116 and 121 turns) while the 19b route wins in 120; the engine reproduces both logs event for event, the difference is the route's pick sequence from party action 78 on, not the build; Trema seeds 1/1001 and 2/1002 defeated at link 1 (0 of 4, 0 of 18 over rounds 19 to 20); Den defeated at 13 and 23 turns on seeds 1 and 1001 (0 of 4; 1 of 11 over the two rounds against 24 percent first try at the live pace, P(1 or fewer of 11) about 0.22, not significant); Flux phone touch defeated at 9, 31, 11 turns (the intended Poison Fang is unreachable on touch: same 9-turn defeat as 19b).

CARRIED, unchanged: PR-0279 Sin difficulty undecided (D-282), PR-0257 Ch III gauntlet about 2.3x the sourced rows (204 real-key turns, 208 in 19b), PR-0280, PR-0306 Den pace, PR-0227 Trema pace, PR-0217. No intended or credible tactic is penalised for being strong; no boss number was touched; nothing in this release is an encounter-balance change. UNVERIFIED: Lady Luck's Dud risk in Ch V and Ch XIII as a player-facing balance factor (no real-key spin, see capturesNeeded); retry-attempt fidelity (attempt 2+ logs not kept).

### visual: 8.8

[Visual and targets auditor, deep round 20, LIVE build main cd9dbbb0 bundle BGBDEn_P (artifactHash 766d9587..., 1716 files, live identity PASS in critic/reviews/cd9dbbb0-live.json). I opened no browser and started no server; every judgment is from the capture owner's round-20 evidence (805 index records, all mode gpu = PYREFLY_BROWSER=gpu headless Chromium, 799 harness-verified, 6 unverified = the 30-post-scene frames); sizes 1600x900, 2000x1012 and 390x844 touch; the file critic/rounds/round-20/evidence/index.json is an array of capture records, not the {encounters} object the brief quotes.

PROTECTED ART. node D:/Final Fantasy/../pyrefly-lora/tools/verify-approved.mjs on the tree: approved ok 586, mismatched 0, missing 0; judge-locked ok 48, mismatched 0, missing 0. Pause hero plates pause-hero-ch1/ch4/ch9 compared as files from public/art/pause (same hashes) and identical to their targets in the composites. The 2026-10-03 install (193 portrait-part files, 8 twirl keys, 35 boss keys) renders on model in every frame I read: no monogram or letter-tile fallback in any chip read.

WHAT I RE-CAPTURED AND READ (all re-composited with node tools/end-state-board.mjs --pair, 95 composites in critic/rounds/round-20/targets/ plus 33 contact sheets): the whole front end, all 18 chapters' first menus, mid-fights and target frames, results, the pause on both games and phone, onboarding, EYE CANDY options, dressphere sequences (Bahamut, Leblanc, Trema), KO collapse (FFX and FFX-2, normal and REDUCE MOTION), Ginnem post-scene, living pause portraits.

RELEASE 37 FINDINGS. (1) LIVING PORTRAITS (D-143/D-320/D-321): working. Flux 1600x900, 18 frames over 12 s: the twin canvas is present (2 canvases), gaze moves, and the eyes visibly change between frames (pupil and lid positions differ across p00/p03/p06/p08/p10 in the cropped sheet liv-faces.jpg); frame-to-frame mean difference in the face region is 1.0-4.3 continuously with the setting on, against 0.00 for ten of twelve steady frames with REDUCE MOTION (only the first-frame fade and the tab switch move), so the off switch works; FFX-2 Yuna X-2 then Rikku X-2 at 2000x1012 and on the 390x844 touch run run too (1.0-3.3). 24, 19 and 19 portrait-parts requests, 0 console errors, 0 404. Not shown by my evidence: a blink, the smile or the press state (every logged expression is neutral) and the eyes following a highlighted ROW (the arrow press landed on a tab without rows; the gaze changed only on the tab change) - UNVERIFIED, see capturesNeeded. (2) LADY GINNEM (A-9): the post scene at 2000x1012 shows a soft cool halo and a shell of motes on her outline over the cold plate, with no mote on her face; reads as unsent and matches the approved option B (pyreflies-edged glow) better than the baked rim alone. (3) KO WEIGHT: Ch I Yuna's collapse now lies left of the status rows, clear of them (1600x900), and FFX-2 Yuna lies clear of the intent card at 2000x1012; PR-0318 fixed in the captured cases. FFX hurt-to-down 0.92 -> 1.88 s (REDUCE MOTION 0.99 -> 1.37 s), FFX-2 0.51 -> 0.82 s (0.46 -> 0.74 s). (4) DRESSPHERE SHOT: the held shot now lasts 1.40-1.51 s where it plays (Bahamut Yuna 702-2135 ms, Rikku 519-1983 ms; Leblanc Rikku 548-1957 ms; Trema Yuna 479-1985 ms) against 0.5-0.7 s in 19b, so PR-0314 reads fixed where it plays; it plays less often (none for Leblanc at 2000x1012 where another actor was acting, none for Trema Paine, none on the phone). (5) NEW DEFECT: Ch IX Yojimbo and Daigoro are not drawn at the first menu at 2000x1012 seed 1 (V20-01, major, cause unestablished). (6) STILL OPEN and re-observed: PR-0311 (Yuna Thief is a grey mannequin; Rikku Warrior has no painted art at all, art/characters/rikku-warrior/idle.json 404 in the Trema run), PR-0316 (Bahamut head washed out), PR-0333 (phone Bahamut head under the intent strip), PR-0334 (hard-edged white rectangle in the twirl start), PR-0320 (coach line over the girls' feet during the held shot, not hidden). PR-0310 (party and boss overlap at rest in Ch II, III, VIII) was NOT re-measured: no gap measurement exists for this build, so it is carried open and UNVERIFIED, not closed.

Facing, ground contact, scale against neighbours and the on-model look hold in every actor frame (party faces the enemies, contact rings under every actor, Flux, Yunalesca, BFA, Evrae, Natus, Yojimbo, Shiva, Ixion, Bahamut, Vegnagun parts, Leblanc trio, Sin fins, Fallen Aeons, Den shades).

SCORE 8.8 against round 19b's 8.9. The gains (living portraits, Ginnem glow, KO bodies clear of the rows, a held dressphere shot, all twirl keys in) are real but do not lift the category because two majors carry (PR-0310 unmeasured, PR-0311 placeholder, now two missing dresspheres) and release 37 adds a major in Ch IX (V20-01) that I could not tie to a cause. It stays below 9 on those, not on taste.

BAILEY'S FIVE SUB-SCORES (provisional, judged with motion; not part of the weighted score), against round 19b (7.9 / 7.5 / 6.9 / 8.1 / 7.7): CHARACTER MODELS 8.0 (+0.1: living pause close-ups put blinking, glancing faces on all ten plates; the in-battle party is unchanged and the Thief placeholder stays). ENEMY MODELS 7.5 (held: 35 boss keys are installed and their files load in play but I did not see them play on screen; Yojimbo and Daigoro missing at one first menu offsets the gain; Bahamut's head still washed out). ANIMATION 7.1 (+0.2: faces move in the pause, Ginnem breathes, the full twirl key set plays and the KO collapse is timed; held below 7.5 by the white rectangle at the twirl start and the mannequin the twirl lands on). FIDELITY 8.1 (held: Ginnem's halo and the full-bleed plate wings are a gain, offset by the visible mirrored-lantern strip and Bahamut's bloom; the 21:9 bands were not re-measured). CAMERA 7.7 (held: the dressphere shot holds 1.4-1.5 s again, offset by it being skipped at Leblanc 2000x1012, for Trema Paine and on the phone, and Bahamut reading about 12 percent smaller at 2000x1012 than in 19b). A 21:9 and 4K pass was not part of this round's capture set.

### feel: 8.6

Feel + cinematic direction, deep round 20, live main cd9dbbb0 bundle BGBDEn_P (release 37) against round 19b (8.2, c69de96a). I opened no browser and started no server; all judgments come from the capture owner's evidence (index.json: 805 records, all mode=gpu = PYREFLY_BROWSER=gpu headless, 799 harness-verified, 6 UNVERIFIED post-scene frames = results screen shown before the scene, same harness order as 19b; the scene is captured after CONFIRM in 33-after-confirm-scene). Scratch is in critic/rounds/round-20/feel-narr/ (pace.cjs, trprof.py, scsum.cjs, dbox.cjs, ddiff.cjs, sheet.py and contact sheets).

MEASURED GAINS (both games, why 8.2 -> 8.6):
(1) PR-0061 hurried scene entry (BOTH games, shared flow plumbing). In-game time to first usable menu after a hold-skip, same harness and field as 19b (firstState.playTimeMs): 19b 6.6-12.1 s (typically 8.4-10.5); r20 3.4-5.2 s in 23 of 28 comparable runs (e.g. Flux 8.02 to 5.42, Natus 8.88 to 4.52, Yunalesca 8.95 to 3.93, Yojimbo 12.10 to 4.45, Leblanc 11.18 to 3.47, Bahamut 8.43 to 3.95, phone Bahamut 4.02, phone Flux 4.12). Wall time from the prep Escape to the battle seed fell from 23.8-27.3 s to 18.9-20.7 s in the same 23 runs, matching the builder's claim (docs/handoff/r37-scenes.md: 3.2-4.8 s). Slower entries all sit in the first 4-lane parallel burst or the Den lane (Flux win 5.42, Trema 6.33, Braska 7.42, Den first run 16.85 with a 31 s wall); in those runs the chapter card is still up 3-4 s into the transition sequence (Flux f09 at 2.95 s, Braska 3.3 s, Trema 4.08 s, Den 2.75 s still the full card). Cause unestablished (host load vs load time, see R20-FEEL-01). Pause over the pre-scene opens in 27 of 27 route runs and one hold skips the scene (holdsToSkip 1 everywhere): CHK-015 PASS. A scene tapped through is not in this evidence (the harness always hold-skips), so the unchanged long path is not re-timed.
(2) PR-0314 / PR-0313 FFX-2 dressphere shot. Gap pass, 50 ms sampling, GPU: when the shot plays it holds for at least 1.41 s to 1.47 s (Bahamut 1600x900 Yuna and Rikku, Leblanc Rikku 1.43 s) and the one case whose window closed inside the capture measures sc 479 ms to master 2035 ms = 1.556 s (Trema 2000x1012, Yuna); 19b was 0.48-0.57 s. The design hold is 1.6 s, so the beat now reads as a real close-up push-in with the girl in her new dress and the twirl ribbon aura (sc-trema2.jpg f02 against f12). Enemy action inside the shot: [] in all 10 changes; menu during shot: false in all 10 (menuWhileSc false). The first-time coach line that covered the shot in 19b (PR-0320) is gone by the shot frame at 2000x1012. The four Bahamut/Leblanc windows end while the shot is still on, so their true length is only bounded below.
(3) PR-0318 downed pose / status rows: Flux Yuna KO at 1600x900 (ko-seymour-flux f27) lies fully visible above the status rows instead of behind them. KO collapse timing (hurt/down, ms from first frame): FFX 1547/1882 (19b 1675/2067), FFX REDUCE MOTION 986/1372 (868/1256), FFX-2 511/822 (676/957), FFX-2 RM 459/738 (514/762): same shape, shorter or equal, RM still shortens but does not skip.
(4) Living pause portraits (D-143/D-320/D-321, both games). Frame differencing of the portrait region over 18 frames (~22 s): motion on at 1.4-3.4 mean grey levels per frame (Tidus, Rikku, Yuna FFX-2, phone), exactly 0.00 in every frame after the tab fade with REDUCE MOTION (feat/*-rm): off as specified. The contact sheet and p05/p07/p09/p10 show a one-eye blink/wink, the eyes shifting, the mouth moving between a closed grin and an open smile; no console errors, no 404, 19-24 face-part requests (0 under RM).
(5) PR-0300 plate wings: the Den of Woe (Ch XV) link 2 seam at 1600x900 is full-bleed in all 8 frames (no black band; 19b had 21-25 percent).
(6) Pacing per turn is unchanged: Flux 6.37 to 6.53 s, Braska 6.75 to 6.77, Natus 4.52 to 4.63, Macalania 6.26 to 6.26, Isaaru 7.67 to 7.85, Vegnagun 9.63 to 9.33 s per turn; retry from defeat to the next battle 7.6-7.8 s (19b 7.6-8.1).

LOSSES / STILL OPEN: PR-0301 seam hand-back unchanged: Leblanc link 2 seam shows no command menu in any of 8 frames to 2.53 s, Den the same (carried). PR-0104 carried, 5th review: Bahamut Shell in Wait shows only a raised-staff cast and the next menu opens at about 2.6 s with no name chip. New R20-FEEL-03: the Den link-2 seam camera pushes Yuna out of the left edge by 2.5 s (also in 19b, so not a regression). R20-FEEL-02: the dressphere shot was absent in 5 of 10 captured changes (three Leblanc cases logged 'another actor is acting' incl. both changes at 2000x1012, Paine at Trema, phone closed by design); each fails closed to the master where the twirl still plays, so no moment is lost. Leblanc seed 1 stalled once at 957 s (see R20-FEEL-05); not a feel defect, listed so the dead wait is not hidden.

NOT MEASURED, NO CREDIT: input-to-response latency (no timed input record exists), the D-216/D-248 Auron Ch XII line, the D-247 Ch III Talk card at 0.6, the FFX-2 end-of-fight banner, drift-driven plate defocus and Ginnem's glow as motion (stills prove no timing), whether the pause eyes follow the highlighted ROW (capture only ever had tab focus), real-controller and real-phone feel, and Bailey's play verdict (CHK-B2 stays owed).

BAILEY'S FIVE SUB-SCORES (provisional, judged with motion; not in the weighted score). Mine: animation 7.2 (19b 6.9: new living portraits measured in motion, all 77 twirl keys in, KO collapse equal or faster; held down by the unmeasured PR-0315 crossfade double image and the silent Shell cast) and camera 8.0 (19b 7.7: the dressphere close-up now holds 1.4-1.6 s, the entry is about 5 s faster, the Den wings are full-bleed; held below 8.5 by the 2.5-3 s seam hand-back, the Den seam crop, a shot that is absent about half the time, and the 3-4 s card in loaded runs). Character models, enemy models and fidelity belong to the visual auditor; I do not restate them. Round 19b for comparison: 7.9 / 7.5 / 6.9 / 8.1 / 7.7.

### narrative: 9

Narrative, emotion and character voice, deep round 20, live main cd9dbbb0. No browser opened, no server started; judged from the capture owner's dboxTimeline text and post-scene frames (GPU headless). git log f302f163..cd9dbbb0 -- src/story shows only d0aaaee72 and e9815c9cf (Chapter VII kneel and fall staging, story-pose paintings); git diff c69de96a cd9dbbb0 touches nothing in src/story or research except one visual-bible edit, so the scripts are those of 19b.

WHAT I CHECKED: dbox timelines of 29 runs against 19b, normalising only the final period (the typewriter capture drops or keeps the last character: Flux, Omnis, Yojimbo and Evrae differ by exactly that and nothing else). After normalising, Braska (78 lines), Bahamut (30), Macalania (55), Natus, Isaaru, Flux, Omnis, Yojimbo and both defeat runs are line-for-line identical to 19b; Fallen Aeons and Vegnagun differ by one random battle banter line (Rikku 'Yunie's frozen! Remedy, now!' absent; Shuyin 'Stop singing. Stop singing.' instead of 'You fight like someone who still wants something.').

NEWLY REACHED, BY REAL INPUT (CHK-022): Chapter XVII (Sin, Fins and the Core, 3 links, 252 turns, seed 1) and Chapter XVIII (Sin, the Face, 64 turns, seed 1) both won at 2000x1012 with no harness fails, the authored aftermath played (XVII: 'Sin plows into the outskirts of Bevelle as the sun goes down. / It is not over. It will rise again. / Yeah. So we beat the one inside it. / Then I fix the gun.'; XVIII: the Fahrenheit dives into the mouth and the narrated Farplane passage ending 'I thought the worst of it was behind us.'), then results, chapter select with the clear shown, and a reload that keeps the clear (boardAfterReload cleared: sin-fins-core, sin-face). In 19b both were defeats and their aftermath was reused from round 18b; that gap is now closed with fresh evidence. Aftermath reached by real flow this round in 16 of 18 chapters (I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIV, XVI, XVII, XVIII); XIII Trema and XV Den of Woe were not won this round.

TONE: FFX reads elegiac and short (Isaaru: 'No. Please. Keep that for the road ahead.'; Braska/Jecht: 'Not today, old man.' and the narrated 'I left in the part where she kept walking.'), FFX-2 quick and warm (Leblanc: 'Fine. Take it. I'd memorised the good part anyway.', 'Keep it. It suits you.'; Bahamut: 'No arguing! This is a Brother order!', results silent per the writing-bible). Beats stay inside research/ffx-sin.md (cannon takes the fins in order, Cid at the helm).

STILL OPEN, UNCHANGED SCRIPTS (re-observed): PR-0255 (Tromell's five Chapter VII lines, speaker '' in Macalania run lines 42-48), PR-0256 (Ixion: '(Whistle)' captions with 'A small gold light answers.' and no mote shown in frames), PR-0272 (the Fahrenheit's cannon is still only a caption at 313585 ms and 637490 ms), PR-0262 (not re-probed), PR-0254 (Chapter VII Talk, not re-probed).

NOT REACHED THIS ROUND: XIII Trema (defeat on seeds 1001 and 1002, 77 and 75 turns, as 19b; reachability UNVERIFIED for a 3rd round, text reused from 18b below) and XV Den of Woe (first fight defeat at 13 turns, second attempt ended defeat with seed 1001; aftermath not shown this round; reused from 19b). The harness hold-skips every scene, so natural reading pace is unmeasured here (19b measured about 47 ms per character); Bailey's story read (CHK-B3) is not recorded. UNVERIFIED this round: D-247 Chapter III Talk card at 0.6 (no Talk frame in the Braska run; the line 'Tidus: Hey! You still in there?' is in the timeline at 603671 ms, 3149 ms long) and the Ch XII Auron disc line 'Hit a disc. Three alike, and his spell reaches everyone.' (not in any dbox, coach or text capture of the Omnis run; the route harness does not follow the advisor's top row, which is what fires it).

Score: 8.9 -> 9.0. No script changed; the +0.1 is for closing the Sin-chapters reachability gap with real-flow evidence and finding their aftermath on tone, held below 9.5 by four unchanged caption and speaker issues, Trema and Den aftermath not re-reached, and no human story read.

### audio: UNVERIFIED (no number)

Chief-ready, no number. RUBRIC section 6 lists Bailey's listening assessment as part of the audio category, and no numeric owner verdict exists. docs/audio/OWNER-VERDICT.md was last changed 2026-09-29 (5e5ef411) and gives no number out of 10. decisions.json D-349 (ask 14, adopted on 'all your recommendations, godspeed') records 'no number given yet'. D-307/D-308/D-309 are still proposed and unanswered. Music v2 and SFX v2 (D-302/D-303/D-306) were adopted on recommendation, not by ear. Under CHK-B1 the category is UNVERIFIED: not averaged away, not zero.

I cannot hear and listened to nothing. I opened no browser and started no server. Everything below is offline decoding, the repo's audio tools, and the capture owner's AudioManager and network evidence (critic/rounds/round-20/evidence, GPU mode, 27 runs with an audio log, 29 network files). Scratch and outputs are in critic/rounds/round-20/audio/.

WHAT CHANGED IN AUDIO SINCE 19b (c69de96a to cd9dbbb0): code only, no audio byte. `git diff` on public/audio and docs/audio is empty. src/audio changed in AudioManager.ts (+30, new playSfxFromSprite) and SfxSprites.ts (a firstBank promise). Callers: TitleScreen.ts:195 now calls `void audio.playSfxFromSprite('battle-start')` (PR-0326). Nothing else in src references audio/music/sfx in the diff; the living pause code, the hurried-entry change in BattleScreenFlow.ts and the FFX-2 shot changes contain no audio line. All 29 shipped audio files are sha256-identical across the cd9dbbb0 artifact manifest (critic/artifacts/cd9dbbb0.json), release 35's manifest, round 19b's candidate hashes and the working tree. Live bytes: 29 of 29 identical (28 first pass; the one 408 timeout, boss-ffx2-aeon.mp3, retried: 200, audio/mp3, 4,069,829 bytes, hash equal). Content types: audio/mp3, and application/json for manifest.json.

TECHNICAL: PASS. `node tools/audio/qa.mjs --strict` exit 0, 0 cue findings and 0 SFX findings: 26 music cues -16.00 to -16.21 LUFS, -1.08 to -3.06 dBTP, 0 clipped samples, every loop seam ok; v1 sprite 134 cues peak -1.13 dBTP; v2 sprite 100 cues peak -1.12 dBTP; total 88.49 MB of the 90 MB budget. Independent ffmpeg 9.0.1 decode: 28 of 28 shipped MP3s, 0 errors (62 files incl. unshipped candidates, 0 errors); ebur128 spot checks title, chapter-select, pause, boss-yu-yevon, boss-shuyin, boss-ffx2-aeon, victory-ffx2: -15.8 to -16.0 LUFS, true peak -1.1 to -1.7; sprite-v2 -18.5 LUFS at -1.1. Stereo, 26 cues: L/R correlation 0.643 to 0.796, mono-sum loss -0.49 to -0.91 dB (no hollow-phase signature). themes-audit: 0 chapters depart from the chapter cue map; the same four cues depart from the bible as in 19b (PR-0039 scene-gagazet, scene-dreams-end, scene-farplane; PR-0260 scene-macalania-temple).

ROUTING (CHK-023), from 193 AudioManager samples in 27 runs: ready true and not muted in 193 of 193; volumes 0.8/0.7/0.7 and sfxMix {b, trim 1, bus 0.70} in 193 of 193; v2 sprite game ffx in every FFX run and ffx2 in every FFX-2 run; 134 music samples, all from 'prerendered' (none from the synth path), each matching music.current. The right cue at the real moments: title (flux-lose), chapter-select on the board, scene-gagazet then boss-seymour then victory-ffx (I, IX via boss-yojimbo, X natus/omnis), scene-zanarkand-dome and boss-yunalesca (II), boss-jecht then silent seam then boss-yu-yevon x15 then victory-ffx (III), scene-bevelle-underground and boss-ffx2-aeon (IV, VI, XVI), scene-farplane, boss-vegnagun, boss-shuyin, victory-ffx2 (V, XI), scene-macalania-temple and boss-seymour-macalania (VII), scene-fahrenheit, boss-evrae, victory-ffx (VIII, XVII, XVIII), boss-shuyin through seams 2 and 3 (XV). New against 19b: victory-ffx was reached after the Sin wins (XVII, XVIII), which 19b could not show. Omnis plays scene-dreams-end as THEMES.md says. Ch III seam 2 is silent in all three samples, authored (PR-0129). Network: 216 audio requests, 26 distinct URLs, 0 not found, 0 audio console errors (the only 404 in the set is art/characters/rikku-warrior/idle.json, a visual matter, cross-referenced and not scored here). The shipped battle-ffx and boss-dread cues were requested by none of these chapters (same as 19b).

TWO CHANGES IN BEHAVIOUR FOUND (one issue, R20-AUD-01, cause unestablished). (1) PR-0326 is half delivered: 'battle-start' never plays via synth any more (0 of 27 runs; 24 of 24 in 19b), but it also never plays at all (0 entries in 27 of 27 sfxLogs), and the first sounds of a session are still the procedural synth: sfxLog[0] is synth in 25 of 27 runs (cursor-move 82, confirm 8; 90 synth entries against 24 in 19b), at AudioContext time 1.9 to 5.2 s. In 19b every one of those same board cursor-moves at 2.2 to 3.4 s was via sprite. The sprite's first successful use now lands at 2.3 to 14.0 s. (2) The music lags behind it in 3 of 27 runs (0 of 24 in 19b): the pre-scene sample still shows the previous cue as current (title in seymour-flux-lose with chapter-select not cached at 16.0 s; chapter-select in braskas-final-aeon-win and ffx2-trema-win), and the v2 sprite is still undecoded at pre-scene in two lose runs (flux, bahamut; 16 to 17.5 s). Every later boss sample is the right cue. The pre-scene sample time is the same as 19b (median 15.1 s against 15.2 s), so the harness pace did not change, but the capture owner notes 3 to 5 parallel runs on one host, so host load is a candidate; release 37's heavier early art traffic is another. I cannot separate them from this evidence.

OWNER-VERDICT facts: the shipped mix has no number; the latest ear words about shipped audio are 2026-09-27 'still sounds like snes music' (release 21), before music v2/SFX v2.

REUSED (labelled): the audio half of the save matrix (volumes applied from storage after reload; fixtures 31a, 33, 34, 35) from round 19b (critic/rounds/round-19b/audio/routing.json and its save-matrix verdict). Dependency: src/app/SaveData.ts, src/app/saveSfxBalance.ts and every settings file are unchanged in c69de96a..cd9dbbb0 (git diff empty), AudioManager's volume code is untouched by the +30 lines, no open related defect. The pause cue starting and handing back to the battle cue (round 18 gap pass, reused by 19 and 19b): pause.mp3 byte-identical, src/ui/common/pauseMusic.ts unchanged, PauseScreen.ts unchanged, PauseView.ts gains only the living-portrait driver and its dispose line after music.dispose, the new living modules contain no audio, music or sfx word; but this round took no sample while paused, so the live-in-this-round half is a capture owed. PR-0263's sfx-vs-music level estimate (round 17): the sprite is sha-identical; the bus 0.70 is re-observed this round (193 of 193).

NOT VERIFIED THIS ROUND: no sample while paused; Ch X Natus results (victory-ffx not decoded at the results sample, see capturesNeeded; not claimed as a defect); Ch XIII Trema phase 2 and victory-ffx2 (Trema defeats again, as 19b); the Ch III scene-dreams-end sample (19b had it; this round's Braska pre-scene sample is the board's cue, see R20-AUD-01); sound timing against the longer dressphere shot (1.4 to 1.5 s hold) and the living portraits (nothing to see in the log; needs ears).

SERVERS: I started none; I used no browser.

### interface: 8.2

CHIEF: 8.2 (the interface auditor proposed 8.4 before the gap pass). Lowered for FOC37-02: the Trigger Happy overlay names R1, counts only keyboard R / PgDn, and since release 37 that count decides the damage, so Enter, touch and pad players get one hit (reliable input is this category's; scored here once, not again in combat). AUDITOR TEXT: Round 20 deep review of live main cd9dbbb0 (bundle BGBDEn_P), interface auditor. I opened no browser and started no server (no port to close); I judged the capture owner's evidence in critic/rounds/round-20/evidence (804 index records; 31 run.json from title to results/board in headless Playwright PYREFLY_BROWSER=gpu at 1600x900, 2000x1012, 390x844 touch; feat/ pause-living sequences; gaps/ = KO and dressphere-shot only). Own scripts: critic/rounds/round-20/agg1/agg2/agg3.tmp.mjs and audit/zz-contrast.tmp.mjs (pixel-estimate contrast, 99.5th-percentile glyph vs 30th-percentile background); I ran 9 vitest files locally on HEAD 4b7adea6 (src/ identical to cd9dbbb0: git diff cd9dbbb0..HEAD over src, public, tools is empty): advisor-ownership (18 chapters, 300+ decisions each), advisor-degenerate-boards, advisor-copy-sweep, enemy-intent, advisor-phone-tip-menu, advisor-card-css-type-floor, ffx2-hud-end-of-fight, ui-ffx2-hud, ui-ffx-hud-safe-zones: 157 tests green. orphans.mjs lists MessageBar.ts and PartyPrep.ts (pre-existing, not this release).

HOLDS: 28 desktop route runs: 0 picks where the key pressed differed from the card's move (advisor-named action was legal and enabled), 0 target mismatches, target cancel returns to the menu with 0 targets left in 19 runs with a cancel frame, Esc/P open and close the pause and resume in every run, N hides the advisor, E toggles intent. Developer-vocabulary sweep over 217,033 characters of captured player text (briefing, board, prep, scenes, advisor, intent, pause, results): 0 real hits (regex hits are DOM textContent concatenation and 'thousand-year-old'). Advisor minimum effective size 14.2 px desktop (15 px phone), 0 clipped rows, 0 card-vs-command-stack overlaps at the first menu in all 20 FFX/FFX-2 runs where the card was measured. Intent separates certain from conditional ('SCRIPTED', 'MOST LIKELY 83%', 'POSSIBLE 25%', 'Spends the turn and does nothing', 'Odds' lists). Honest warnings on a broken board: Ch VI frame 27 (Paine 0/1089) advises Phoenix Down with 'Ormi uses Supercollider before Paine can act'; Ch I phone advises Holy Water for Zombie Tidus. Results copy and values read in full (Ch IV EXP 1,300, AP 15, GIL 1,000). Ch XVII advisor now gives a real pick with reason ('Close in ... do not reach from FAR') on every one of 252 turns (0 turns without advice); Ch XVII and XVIII are now won by real keys (252 and 64 turns; both were defeats in 19b).

BETTER THAN 19b: PR-0324 half fixed (code diff cd9dbbb0 excludes kimahri-rage; the live Ronso Rage card was not captured). PR-0269 improved in Ch XVII.

WORSE OR NEW: (1) PR-0330 (advisor card squeezed to a stub under the colossus HUD layout) persists in Ch III 1600x900 (293x188, same 68 characters as 19b), Ch IX 2000x1012, FFX-2 Ch IV 1600x900, Ch XII; and a NEW regression against release 36: Ch VII Anima at 2000x1012, same seed, 489x261 / 265 characters (NO MP, 3% CRIT, effect line) in 19b became 274x204 / 69 characters now. Suspected cause: release 37's clearance/framing change (src/engine/fx/mix/clearance.ts, MaxMix.ts); not traced. (2) R20-IF-01: Ch XII intent card reads 'Mortiphasm Spells SCRIPTED Deals no damage.' above damage rows of 2,066-2,333 (34% HP) for Tidus and Auron: a false sentence from describeAbility on a formula 'none' volley row whose own label is commented PLACEHOLDER (src/data/ffx/enemies/seymour-omnis-abilities.ts:170, src/battle/ffx/intent.ts:315); present in 19 and 19b, never filed. (3) R20-IF-02: FFX-2 Ch VI enemy list, a stable frame, Ormi's 'STATUS 4' tag overprints the name 'Dr. Goon'. (4) PR-0324 still wrong for Yuna's Grand Summon ('Timed input', Ch XIV; the project timer is 0).

CARRIED, re-observed live this round: PR-0237/FOC37-04 (Ch IV phone: the coach tag overprints the third line of the intent strip, '115-' cut), PR-0248 (Ch VII target mode at 2000x1012: the Sensor card stands over Guado Guardian B), PR-0289. Carried, not re-observed: PR-0249, PR-0251, PR-0321, PR-0291, PR-0286, PR-0288, PR-0246, PR-0252, PR-0276, PR-0325.

NOT COVERED this round (cannot score them, listed in capturesNeeded): wide and 4K shapes, 1280x960, multi-target and all-party frames, TEXT SIZE at 115/130, EYE CANDY page, the HUD font-floor sweep. Score 8.4 (19b: 8.5): the advisor, targeting, intent honesty and cleanup core is solid; the new Ch VII squeeze regression and the false Ch XII sentence outweigh the Ch XVII and Rage gains; not 9 because of the long carried polish list, the stub card in five chapters and the 12.25 px HUD floor carried. Provisional on the uncaptured shapes.

### onboarding: 8.6

Round 20 deep review, onboarding auditor, same evidence base as interface. NEWCOMER WALKTHROUGH: SIMULATED, not real. Every route run starts on a fresh profile and walks only visible instructions with real keys (touch taps on the phone): title; Auron's briefing ('Eighteen fights... In the FFX fights, nothing moves until you act... In the FFX-2 fights, the clock keeps running until you pick a command. Then it waits while you choose.', 'ENTER / ESC SKIP - 20 SECONDS, ONCE', 'D NEVER SHOW THIS AGAIN'; phone 'TAP SKIP', 'TAP HERE NEVER SHOW THIS AGAIN'); first-run guide step 1 'AURON - 1 OF 3' on the board; step 2 at prep ('Your party is ready.'; prepEsc returns to party-prep in 31 of 31 runs); the first-turn coach (FFX 'He moves after you. Not before. Use it.'; FFX-2 Rikku 'Bar's full, she's up! Pick a command and take your time, nobody moves.', GAUGES RUNNING / FADES ON ITS OWN / FIRST TIME ONLY); results; board; reload keeps the clear. No human newcomer played this build.

What I saw freshly: pause OPTIONS at 1600x900 (ten rows both games: MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE, REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP, plus X-2 BATTLE WAIT and ATB SPEED NORMAL in FFX-2), the cursor dot beside EYE CANDY no longer clipped. NEW IN 37 VERIFIED: living pause portraits respect REDUCE MOTION (feat/seymour-flux-pause-living-1600x900-rm: driver false, gaze 0,0 in 18 of 18 frames; the motion run has driver true and a changing gaze); the pause opens full-bleed at 1600x900, 2000x1012 and 390x844 and closes on Esc. NOT VERIFIED LIVE: the EYE CANDY page repairs PR-0322/PR-0323 (built in 4f5e11c6, no frame of the page this round); the Ch XII Auron disc coach line (ffx-omnis-disc; no frame shows it); LIVING PAINTINGS off. Non-colour cues hold (CURSE chip with written cure, ZOMBIE 100% tag, glyph status icons).

STILL OPEN: PR-0270 (major, third review, STALLED: TEXT_SIZE_WIDE_SCOPE is still false at src/app/applyComfort.ts:41 and hudTextSize.ts still says FFX only, so TEXT SIZE does nothing in the FFX-2 battle HUD while the row reads as covering both games; those files and the options/settings files are untouched in c69de96a..cd9dbbb0, which is the dependency argument for carrying it); PR-0032 (re-verified in the live rows of both games: no REDUCE FLASHES row, no key remapping; the new default look still has impact frames and flares); PR-0289 re-observed at 2000x1012 and on the phone (step 1 says 'Start with the first one.' while Chapter IV is selected and the card covers rows I-VI on the phone). Gamepad, Safari and text-size checks are UNVERIFIED. Score held at 8.6: no gain and no loss in this release's reach; the briefing, first-run guide, options page and motion accommodation are strong; held below 9 by PR-0270, PR-0032 and the unverified new page. A method check is owed before a fourth review on PR-0270 (RUBRIC section 8).

### prep: 9.1

Prep and delivery auditor, round 20 deep review of live main cd9dbbb0 (bundle BGBDEn_P). I opened no browser and started no server. I worked from critic/rounds/round-20/evidence/ (index.json with 804 captures, 32 route run.json files, 4 feat runs, gap sessions), all headless Chromium from node with PYREFLY_BROWSER=gpu, run by the capture owner; plus git diff c69de96a..cd9dbbb0, critic/artifacts/cd9dbbb0.json, research/ffx-sin.md and research/ffx-seymour-anima-macalania.md, and round-19b's prep and delivery text for comparison.

PREP AGENCY. All 18 board chapters reached party prep by real keys (boardAtEntry shows 18 tiles in every run, prepText 841-1,207 chars in every run, Esc on prep reads party-prep on a fresh profile = Auron's guided first run, same as 19b). Prep and results code is untouched by release 37: src/app/screens has only battle-flow, cutscene and pause files in the diff, no PartyPrep, Results or Board file. FFX-2 dressphere change was played by real input (21-change-open.png in every FFX-2 run, seq-spherechange sequences, Trema Paine/Yuna/Rikku changes in the battle log).

RESULTS AND REWARDS (sourced). I diffed every comparable results panel against 19b: identical (only the clock differs) for Flux (AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere), Natus, Omnis (AP 24,000, GIL 12,000, Lv. 3 Key Sphere), Evrae (AP 5,400, Blk Magic Sphere), Isaaru (AP 5,000 to Yuna), Yojimbo and Braska (AP 0, GIL 0, sourced), Yunalesca (AP 14,000, GIL 9,000, Lv. 3 Key Sphere), Bahamut (EXP 1,300, GIL 1,000), Leblanc (EXP 1,640, AP 14, GIL 1,590), Ixion (EXP 2,600, GIL 1,800), Fallen Aeons (EXP 23,000, AP 54, GIL 7,000), Vegnagun (EXP 42,400, AP 120, GIL 18,300). One real change: Anima's Ability Sphere went x3 to x4 with OVERKILL x1. That is PR-0258 (FFX only): research/ffx-seymour-anima-macalania.md says Ability Sphere x1, x2 on overkill, so it is sourced, and the handoff's real-engine run shows 1 to 2. NEW rows this round (Sin XVII and XVIII were lost in 19b): Sin Fins and Core AP 19,800 x4 (Genais 1,800 + Core 18,000), GIL 20,000 (10,000 + 10,000), Return Sphere and MP Sphere; Sin Face AP 20,000 x5, GIL 12,000, Lv. 3 Key Sphere. All match research/ffx-sin.md section 2.4. The 'no full turn, no AP' rule still shows (Natus Kimahri, Omnis Tidus, Sin Face Yuna). Defeat cards show TURNS, ATTEMPTS, BEST and ATTEMPTS counts across RETRY (Den of Woe ATTEMPTS 2, Trema ATTEMPTS 2, Flux phone ATTEMPTS 3).

RETRY. 16 retries measured from the fight-end step to the retried battle's first menu (steps ms): 7.2 to 8.0 s, mean 7.5 s, FFX and FFX-2, 1600x900, 2000x1012 and 390x844 (19b: 7.3 to 8.1 s). Steady.

PROGRESS. 17 victory runs across 16 chapters all keep the clear through a real reload (boardAfterReload.cleared names the chapter, 17 of 17); the post-confirm epilogue scene and board return were reached in each. No settings or save code changed (src/app/*.ts byte-identical).

NOT SHOWN THIS ROUND: no win and no reward row for XIII Trema (defeated 0 of 4 attempts, same as 19b) or XV Den of Woe (defeated in all four attempts; 19b won it, see R20-PD-02), so those two chapters' reward and results rows are unverified on this build. The prep tabs STATS, SPHERE GRID (F6, pad, phone), EQUIPMENT, ITEMS and OVERDRIVE were not captured (second round without them; PR-0292, PR-0295 stay carried, no credit).

GAIN FOR PREP: none that moves the category; the Sin rows add two sourced chapters, the Den and Trema rows are owed. Score 9.1, equal to 19b. Not compared with rubric v1 rounds.

### delivery: 8.4

PROVISIONAL on performance, exactly as 19b: frame time, load time, cold or throttled entry and every non-Chromium browser or real device get NO credit (see DELIVERY-PERF). Score 8.4 against 19b's 8.5.

EXACT ARTIFACT (CHK-017, mine, run this review). node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/cd9dbbb0.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/c69de96a.json -> result PASS, artifactHash 766d9587007f584bd20256f6afbaaa1397252b47ea3aa7e3d1f40a49283898f7, liveManifest match, checked 342, mismatched [], missing [], wrongType [], errors [] (1 m 15 s; output kept in the session scratchpad). Independently: the live index.html names assets/index-BGBDEn_P.js; that file downloads at 3,677,988 bytes (equal to the manifest), content-type application/javascript, 0 sourceMappingURL strings; its .map URL is 404 (intended, D-335); art/portrait-parts/manifest.json is 200 application/json. The 342-file compare covers files changed since release 36; the unchanged files rest on the served manifest matching and the deploy's own byte compare.

MANIFEST (CHK-019). critic/artifacts/cd9dbbb0.json: 1,716 files, 798,329,071 bytes (1,670,929 under the 800,000,000 line, 0.21 percent), 0 .map files (19b: 22.8 MB of maps; -543,684 bytes against c69de96a, 1,432 files), decodeChecked true, audioUnverified 0. problems lists exactly two files, art/portrait-parts/paine/1x and 2x/eyeR-catch.png, 'decodes to a single flat colour'. Both are in critic/policy.json intentionalFlatImages (D-320 parts, Paine's right-eye catchlight is an empty layer; I decoded the 1x file: 58x66, every RGBA channel min and max 0, fully transparent, so it is intentional and harmless). 193 portrait-parts files, 3,079,042 bytes ship.

NETWORK AND CONSOLE (29 route runs, network-media.json). 3,951 media requests (216 audio, 3,735 art, 806 unique), every successful reference is in the manifest, 0 image responses served as text/html, 0 console errors in 27 runs. The 2 other runs, FFX-2 Chapter XIII Trema seeds 1 and 2 at 2000x1012, each logged one console error and one 404: art/characters/rikku-warrior/idle.json (R20-PD-01; live still returns 404 now; 19b's three Trema runs had 0 errors). The 4 living-portrait pause runs (Flux 1600x900, Flux 1600x900 REDUCE MOTION, Bahamut 2000x1012, Bahamut 390x844 touch): 0 errors, 0 404; 24, 0, 19 and 19 part requests, so REDUCE MOTION fetches no parts (as intended) and the 1x parts serve the phone. The 53 gap-pass sessions logged no network again (UNVERIFIED for them).

FLOWS (CHK-022). Won by real keys through results, CONFIRM, scene (where one follows), board and a reload that keeps the clear: 16 of 18 chapters (17 runs). FFX: I, II (route-19b library; the new route library lost 116 and 121 turns, a harness pick difference), III, VII, VIII, IX, X, XII, XIV, XVII, XVIII. FFX-2: IV (2000x1012 and 390x844 touch), V, VI (second run), XI, XVI. New against 19b: Sin XVII and XVIII are now won (19b lost both) and their post-scenes and results reached. Not won: XIII Trema (4 of 4 attempts defeated, loss and retry reached, as 19b) and XV Den of Woe (the same route that won in 19b lost link 2 at 13 turns and link 3 at 23 turns, identically in two runs; R20-PD-02). Loss and RETRY are proven for Flux (2000x1012 and phone), Bahamut, Yunalesca, Trema and Den. Flux on the phone was lost 4 of 4 times and its win path is not shown (R20-PD-04). First Leblanc run STALLED (R20-PD-03); the rerun won in 76 turns. Ixion runs 1 and 2 aborted before play at the board (route.mjs findCard presses ArrowRight only 16 times and the Ixion tile is the 18th; R20-PD-05), run 3 won; no product fault.

SAVE (CHK-024). No persistence change in this release: git diff c69de96a..cd9dbbb0 shows no file in src/app other than screens/*, no added localStorage, sessionStorage or settings write, no fixture change, and the one new constant is a URL-only dial ('focus' in FX_DIALS), so the full upgrade matrix is not owed. REUSED from round 19b (24-case matrix on c69de96a, 12 of 12 earlier artifacts booted, D-317 rules, truncated and not-JSON storage). This round's own evidence: 17 of 17 victory runs reload with the clear kept; the live smoke (critic/reviews/cd9dbbb0-live.json) changed MASTER VOLUME by keys and it survived a reload. Not exercised: a stored LIVING PAINTINGS OFF from an upgraded save against the new portrait path.

REMOVED RISK: no source maps ship, the deploy that was refused at 13:02 EDT for blank-layer false positives now passes with a recorded exception list.

STILL OPEN: PR-0259 and PR-0240 (no single-lane frame time or load measurement for this build; third review in a row, release 37 adds per-frame work: living portrait canvases, plate defocus in 8 more rooms, plate wings, about 5 MB of twirl keys at battle start on desktop full tier); the 4 to 5 browser lanes on one host during this capture (logs/lanes.log) make any timing from it uncreditable; headroom 1.67 MB under the line with about 33 MB of adopted art waiting (D-332); PR-0335 (phone runs prove battle taps only: Bahamut phone 136 taps and 80 keyboard fallbacks, Flux 31 and 38, then 167 and 61); Firefox, WebKit, Edge, a real phone and a controller never run.

Score 8.4: identity, decode, save and 16 of 18 flows are clean and Sin is newly proven, offset by a new 404 on the live site, Den of Woe unproven, a repeated Leblanc stall and the third review without a performance reading.

### Bailey's five visual sub-scores (provisional, not in the weighted score)

| | character models | enemy models | animation | fidelity | camera |
|---|---:|---:|---:|---:|---:|
| round 20 (cd9dbbb0) | 8 | 7.5 | 7.1 | 8.1 | 7.9 |
| round 19b (c69de96a) | 7.9 | 7.5 | 6.9 | 8.1 | 7.7 |

Chief's reconciliation. Visual auditor 8.0 / 7.5 / 7.1 / 8.1 / 7.7; feel auditor animation 7.2, camera 8.0; capture owner 7.9 / 7.5 / 7.0 / 8.2 / 7.9. Character models 8.0: the living pause close-ups blink and glance on all ten plates; the in-battle party is unchanged and the Thief mannequin stays (PR-0311). Enemy models 7.5 held: 35 boss keys load but were not seen playing; Yojimbo and Daigoro missing at one first menu (PR-0341); Bahamut's head still blown out. Animation 7.1 (median of 7.0 / 7.1 / 7.2): faces move, Ginnem breathes, all twirl keys play, KO timed; the twirl-start rectangle and the mannequin landing hold it down. Fidelity 8.1 held: Ginnem's halo and full-bleed wings against the mirrored lantern and the bloom; 21:9 not re-measured. Camera 7.9 (median of 7.7 / 7.9 / 8.0): the dressphere close-up now holds 1.4-1.6 s and the entry is about 5 s faster, against a shot absent in half the changes, the 2.5 s seam hand-back and Bahamut reading smaller at 2000x1012.

## Target gate

Required 89, matched 70, failing 0, unverified 18, waiting on a decision 7. Visual auditor's tally against docs/target/targets.json (sha256 83bef3ea): the 87 of round 19b plus the two tiles release 37 newly requires (living portrait feel; backdrops with a floor and a sky). 95 composites made with tools/end-state-board.mjs --pair in critic/rounds/round-20/targets/ (pairs.json). Protected art: approved 586/586 and judge-locked 48/48 byte-identical (verify-approved). UNVERIFIED: 18 required tiles are not verified on this build (row-follow and expression readout of the living portraits among them); 7 wait on a decision. A deep review does not accept the milestone in any case.

## Checks

| Check | Result | Mandatory | State | Reason (short) |
|---|---|---|---|---|
| CHK-001 | FAIL | yes | 27 route runs, fresh profile, 1600x900 / 2000x1012 / 390x844 touch | Technical half PASS: qa --strict exit 0 (0 cue findings, 0 SFX findings, 26 cues -16.00 to -16.21 LUFS, max true peak -1.08 dBTP, 0 clipped, all loop seams ok); ffmpeg decode 28 of 28 shipped MP3s, 0 errors; 29 of 29 shipped audio files sha256-identical to the cd9dbbb0 artifact manifest, release 35, |
| CHK-002 | UNVERIFIED | yes | pause opened by real Esc/P over a live command menu; FFX Ch I, FFX-2 Ch IV | Only 3 of the 6 CHK-002 viewports were captured this round (1600x900, 2000x1012, 390x844). At those three the pause opens full-bleed (Ch I and Ch IV frames p05 at 2000x1012 and 390x844, 14-pause-options at 1600x900), nothing stale remains after Esc (pOpens and pCloses true, resumedByEsc true in 31 o |
| CHK-003 | FAIL | yes | first menu with guide, advisor and intent open; pause tabs | Measured this round on the live build: (a) intent-card overflow line ghosted at 1.4-2.0:1 and cut mid-sentence behind the 'J HOLD' rule (Ch I 'Lands on one of these, picked when it acts' 2.0:1; Ch IV Bahamut ALSO line 2 1.37:1); (b) pause section labels at 2.1-2.8:1 (BATTLE STATS 2.5, THIS ENCOUNTER |
| CHK-004 | PASS | yes | command menu open for each acting member; 18 chapters | Across 28 desktop route runs every pick pressed the action the card named (0 tookOther), with submenu chip and, on desktop, the MP cost (e.g. 'IN WHITE MAGIC 30 MP', 'IN ITEMS'); advisor-ownership holds for 18 chapters at 300+ decisions each on HEAD (27 tests green). Ch XVII now supplies a pick on a |
| CHK-005 | PASS | yes | KO ally, Zombie ally, boss re-kill telegraph | Live broken boards: Ch VI Paine 0/1089 gets Phoenix Down in ITEM with '+272' and the red re-kill note 'Ormi uses Supercollider before Paine can act'; Ch I phone Zombie Tidus gets Holy Water; Ch XVII advice follows the party's state over 252 turns. Model level: advisor-degenerate-boards and advisor-z |
| CHK-006 | PASS | yes | target cancel; confirm; battle end to results | Target cancel leaves 0 target cursors and the same rows in 19 runs (afterTargetCancel) and the 16b frames show no stale tag (Ch III 16b-after-cancel); results frames carry no HUD layer; ffx2-hud-end-of-fight (the new endOfFight sweep, release 37) and ui-ffx-hud-safe-zones 'a title slab never outlive |
| CHK-007 | PASS | yes | all surfaces of a full chapter run, both games | Sweep of 217,033 characters of captured player-facing text from 31 runs found no section sign, file stem, row or step numbering, debug, TODO, chapter-line chip or camelCase id; the only regex hits are DOM textContent concatenation ('nextNoli', 'hitLands') and 'thousand-year-old'. The Ch XII label 'M |
| CHK-009 | FAIL | yes | enemy list, CTB list, target header | Names read in full everywhere else (Seymour Flux, Braska's Final Aeon, Mortiorchis, Guado Guardian A/B, Yu Pagoda with A/B badge, Dr. Goon, Fem-Goon; no ellipsis engaged in any captured frame). One stable exception: FFX-2 Ch VI, Ormi's 'STATUS 4' tag overprints the name 'Dr. Goon' (frame 27, 1600x90 |
| CHK-010 | PASS | yes | single target step, FFX and FFX-2; whole-party step reused | Single target in both games reads at a glance: ground ring and brackets on the target, 'TARGET <name>' header, in-world name tag, matching CTB/turn-order highlight, non-targets and party rows dimmed (Ch III Yu Pagoda A, Ch VII Guado Guardian A, Ch VI Ormi; phone 'ATTACK -> MORTIORCHIS' confirm bar w |
| CHK-005 | PASS | yes | FFX Ch XVII card on healthy and spent boards, seeds 1-200; Ch XVIII and the nine other chapters unchanged | The new tactic spends the bag and MP more slowly (heal at 40 and 50 percent, Al Bhed Potion kept for the weakest, two Close in trips and two Mental Break casts per Fin) and the chain rises from 4.5 to 48.5 percent; it is still far from the project's 90 percent bar (PR-0269 stays open). The Omnis, Ev |
| CHK-008 | FAIL | yes | first menu and single-target step; 1600x900, 2000x1012, 390x844; FFX Ch I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII and FFX-2 Ch IV, | Interface auditor FAIL: Panel over a painted actor, re-observed live: Ch VII target mode at 2000x1012, the Sensor card stands over Guado Guardian B (PR-0248); Ch IV phone, the coach tag overprints the intent strip (PR-0237); Ch XII, the ENEMY INTENT slab covers the lower part of the fourth disc and  |
| CHK-011 | FAIL | yes | FFX Ch IX Yojimbo cavern, first menu, 2000x1012, seed 1, real keys to the menu | Ch IX Yojimbo (the boss) and Daigoro are not drawn at the first command menu at 2000x1012, seed 1: frames 10-first-menu-coach, 11-advisor, 12-intent-E (about 3.7 s apart by index timestamps) and the transition frames f07-f09 show only Lady Ginnem on the platform, while the turn list and boss plate s |
| CHK-012 | FAIL | yes | FFX-2 Ch VI Leblanc Yuna Gunner to Thief seed 1 1600x900; Ch XIII Trema attempt 2 Rikku to Warrior | A fallback still ships as a final face: Yuna's Thief dressphere renders as a translucent grey mannequin (FFX-2 Ch VI, c1-seq f10 and f20, 1600x900; PR-0311 carried), and Rikku Warrior has no painted art at all: art/characters/rikku-warrior/idle.json returns 404 in the Trema run (one console error) a |
| CHK-013 | PASS | yes | all chapters in the round-20 route runs, pause, dialogue, results | verify-approved: approved ok 586, mismatched 0, missing 0; judge-locked ok 48, mismatched 0, missing 0. Approved paintings render inside the running game on model (Flux, Yunalesca, BFA, Evrae, Natus, Yojimbo, Bahamut, Shiva, Ixion, Vegnagun parts, Sin, Leblanc trio, Magus sisters, shades) and the te |
| CHK-014 | PASS | yes | all chapters at rest and in the sampled actions | Party faces the enemies, poses aim at their targets, feet sit on the plane with contact rings, neighbours do not mirror into each other (FFX Flux, Yunalesca, BFA, Evrae, Yojimbo, Sin fins; FFX-2 Bahamut, Leblanc, Trema, Fallen Aeons, Den). A KO'd Yuna lies on the ground plane left of the rows. This  |
| CHK-015 | PASS | yes | desktop keyboard paths: title, briefing, board, prep, scene Esc/hold-skip, command menus, targets and cancel, pause, N/E/G, results, retry,  | Desktop: every route run reaches battle from the title with real keyboard input (Playwright), through briefing, board, prep, scene and fight to results and board; pause, N, E, G and target steps are real keys. Phone: real taps in battle, but START BATTLE, results CONFIRM, retry and chapter select we |
| CHK-015 | FAIL | yes | Skill > Trigger Happy overlay with real keys, live, 1600x900, seed 1 | R counts (hits 3 and 12); Enter counts 0 and the shot lands once; the overlay names "R1"; no pointer or pad route exists in the overlay (traced, not captured). FOC37-02. |
| CHK-015 | UNVERIFIED | yes | phone outside battle rows; gamepad; Lady Luck overlay | Taps proved battle rows and targets. START BATTLE, results CONFIRM, defeat RETRY, chapter select and prep were reached by keyboard in the touch context, and the Items list showed 6 of 27 rows so the intended Poison Fang and Holy Water were unreachable by tap; whether a swipe scrolls to them is not s |
| CHK-016 | PASS | yes | live cd9dbbb0, every route run | 804-805 index records carry an asserted screen read back with a stale-root check; 799 verified; the six 30-post-scene frames that showed results instead of the scene are stamped verified:false and are not used as evidence (feel, visual, prep and combat auditors agree). |
| CHK-017 | PASS | yes | live https://baileypillon.github.io/pyrefly-reprise/ main cd9dbbb0 bundle BGBDEn_P | verify-live PASS (artifactHash 766d9587..., 342 changed files byte-identical, liveManifest match, 0 mismatched / missing / wrong type); live smoke 35 steps OK, 0 console errors; re-run by the prep-delivery auditor this review: PASS. Index names assets/index-BGBDEn_P.js (3,677,988 bytes, application/ |
| CHK-018 | FAIL | yes | live FFX-2 Chapter XIII Trema, seeds 1 and 2, 2000x1012 | Variant-path grep is clean and 806 of 806 successfully loaded media references are in the manifest, but one computed reference (a Rikku Warrior painting sidecar) does not resolve on the live site in two runs. Harmless in play (Rikku's Trema change list shows only Gunner and Songstress, 21-change-ope |
| CHK-019 | PASS | yes | candidate cd9dbbb0 manifest, 1,716 files | Only the two intentional empty catchlight layers are flagged and they are listed as intentional with the reason in policy.json; no undecodable or blank-by-accident file. Audio: Audio half: every shipped MP3 decodes (28 of 28 in ffmpeg), none decodes to silence (qa strict, 0 SFX slices silent), artif |
| CHK-020 | FAIL | yes | battle HUD and options, both games | The same screen gets different work in the two games: TEXT SIZE grows the FFX battle HUD but nothing in the FFX-2 battle HUD (PR-0270, TEXT_SIZE_WIDE_SCOPE false), while both option pages show the same TEXT SIZE row. PR-0330's stub card appears in both games (FFX Ch III, VII, IX, XII; FFX-2 Ch IV at |
| CHK-021 | PASS | yes | both games; event logs, captures and code diff | Intended presence: reels, Dud and the Samurai payloads exist only in the FFX-2 data (src/data/ffx2) and the FFX-2 engine; overkill drop doubling only in src/battle/ffx/results.ts. Intended absence: 0 atb/spherechange/chain events in 12 FFX logs, 0 ctb/overdrive-gauge/turn-preview/switch in 14 FFX-2  |
| CHK-022 | UNVERIFIED | yes | live, 18 chapters, win, loss, retry, scene, results, board, reload | Two included chapters have no win on this build: XIII Trema (0 of 4 attempts) and XV Den of Woe (0 of 4 attempts, 19b won it), so their win aftermath, results rows and reload clear are UNVERIFIED. One first Leblanc run stalled (R20-PD-03). Phone win path for Flux not shown (R20-PD-04). Sin XVII and  |
| CHK-023 | PASS | yes | FFX Ch VII overkill drops on the live results screen; FFX-2 dressphere shot and both games' KO collapse and hurried entry through the live p | The real runtime calls the changed results code with the expected data and the player sees the sourced x4 (research 140, 224, 264: x2 on overkill). Closes PR-0258. Dressphere shot, KO collapse and the hurried entry were read through the real presenter path in the live bundle (per-frame shot/phase/ev |
| CHK-023 | FAIL | yes | Lady Luck reels, Dud and reel overlay: no shipped grid offers Lady Luck; the Change menu on live offers Gunner/Black Mage (Ch IV, V) and Son | The release-37 reel subsystem is wired to nothing a player can reach (AGENTS.md hard rule 4). PR-0340. |
| CHK-023 | UNVERIFIED | yes | Bulwark Break landings and the immune-status miss event in real play; audio routing while paused, Ch X results cue, Ch XIII phase 2; pause p | No real-key capture invoked any of them: 0 minigame-request, 0 reel or Trigger Happy ability starts, 0 'Dud!' messages and 0 immune-status miss events across the 14 FFX-2 battle logs (checked event by event). My engine probes and the repo's presenter-level tests pass (216 stops x 2 sets, Dud at 6 HP |
| CHK-024 | PASS | no | returning player: reload after every victory (17 of 17 keep the clear); upgrade matrix reused | Not exercised: a stored LIVING PAINTINGS OFF from an upgraded save against the new portrait path (listed in capturesNeeded). There is no reset or erase flow in the game, so that part is NOT APPLICABLE. Audio half: Audio half of save and settings: carried from round 19b (24 of 24 cases mixer volumes  |
| CHK-025 | NOT APPLICABLE | no | hidden FF7 experiment | critic-plan.mjs selects only CHK-016 and CHK-017 for this candidate and the release changes no FF7 or board file; the board still shows 18 tiles in every run (boardAtEntry.tiles 18, cleared 0 on a fresh profile) and the secret door was not exercised. |
| CHK-B1 | UNVERIFIED | yes | shipped music v2 and SFX v2, build cd9dbbb0 | Agents cannot hear. docs/audio/OWNER-VERDICT.md has no numeric verdict (unchanged since 2026-09-29); D-349 'no number given yet'; D-307 to D-309 unanswered. Owed to Bailey via docs/audio/audition.html. |
| CHK-B2 | UNVERIFIED | no | human judgment | Whether the input feels good (latency, snap, weight) cannot be judged by an agent; no timed input-to-response record exists for this build. Bailey's play verdict after the entry-pace and dressphere-shot changes is the material ask (CHK-B2 says ask after a material pacing or animation change). |
| CHK-B3 | UNVERIFIED | no | human judgment | Story read and taste judgments (tone, character voice) need Bailey; agents judged text, beats and tone against the writing-bible and research only; no natural-pace read of the scenes was measured. |

## Encounters (capture owner, live, real input)

- **seymour-flux**: win 73 turns 1600x900 seed 1; loss+retry 1600x900 and 2000x1012. title to board to prep to scene to fight to results to board. Post-scene shot UNVERIFIED (screen went to results; same as 19b). Phone 390x844 touch: defeat at 9, 31 and 11 turns in 3 attempts (intended Poison Fang unreachable on touch; same 9-turn defeat as 19b); phone win not shown, phone loss and retry reached.
- **yunalesca**: new route lib: defeat x2 (116, 121 turns) at 2000x1012; 19b route lib on live: victory 120 turns (yunalesca-win-r19route). difference is harness pick sequence (diverges at turn 4), not the build; the engine reproduces 19b's 120-turn win.
- **braskas-final-aeon**: win 1600x900. 24.9 min; real flow to results and board.
- **seymour-anima-macalania**: win 2000x1012. post-scene UNVERIFIED (results directly), as 19b.
- **evrae-airship**: win 1600x900. post-scene UNVERIFIED (results directly), as 19b.
- **yojimbo-cavern**: win 2000x1012. 
- **seymour-natus**: win 1600x900. 
- **seymour-omnis**: win 1600x900. Ch XII Auron Omnis line present in frames; not separately audited.
- **isaaru-via-purifico**: win 1600x900, 3 links. Ginnem post-scene captured at 30-post-scene.png; glow not separately measured live-on vs live-off.
- **sin-fins-core**: win 2000x1012. 
- **sin-face**: win 2000x1012. Bushido/Swordplay and the Ch XVII advisor were exercised by the route harness (PR-0261, PR-0269); no overlay defect observed.
- **ffx2-bahamut**: win 2000x1012 (7.5 min), loss+retry 1600x900, phone 390x844 touch win. spherechange shot held 1.42-1.47 s at 1600x900 (19b 0.5 s).
- **ffx2-vegnagun-shuyin**: win 1600x900. 
- **ffx2-leblanc**: first run STALLED at link 1 (957 s, 36 turns, command:rikku); rerun r2 win 76 turns. stall not reproduced; cause unestablished (host load of 5 parallel runs vs product). 19b round-19 had the same stall once at seed 1.
- **ffx2-fallen-aeons**: win 2000x1012. 
- **ffx2-trema**: seed 1 and seed 2: defeat then defeat (2 attempts each), same as 19b s1/s2; no win this round. win not shown (19b won only on seed 3, not re-run); loss, retry and board reached; 404 on rikku-warrior/idle.json. Win not shown for a third round (PR-0227).
- **ffx2-den-of-woe**: first fight defeat at 13 turns, retry victory 23 turns, in both route libs (19b: victory first attempt, 51 turns). ATB run timing is not seed-deterministic, so not attributable to the build. Win not shown on this build (prep-delivery: 0 of 4 attempts across two route libraries); PR-0353.
- **ffx2-ixion-djose**: win 51 turns 2000x1012 (after harness fix). first two runs failed to find the card: critic/runner/lib/route.mjs findCard walks 16 right presses, the board has 18 tiles (harness defect, not product).

## Coverage

**Tested**

- All 18 chapters by real keys on the live site from fresh profiles (31 route runs, 1600x900 / 2000x1012 / 390x844 touch, GPU headless, 4-5 lanes): 16 won through results, CONFIRM, aftermath, board and reload (Sin XVII and XVIII newly); loss and RETRY for Flux (both sizes and phone), Bahamut, Yunalesca, Trema, Den; retry 7.2-8.0 s
- Living pause portraits: Ch I (1600x900, normal and REDUCE MOTION) and Ch IV (2000x1012, 390x844 touch); frame differencing, part requests, console
- Dressphere shot (10 changes, 50 ms sampling), KO collapse (FFX and FFX-2, normal and REDUCE MOTION), hurried entry timing in 28 runs, Den link-2 seam
- Trigger Happy through the live menu with R (3, 12, fast 12) and Enter (3, 12); Lady Luck reachability via the live Change menu (Ch IV, V, VI) and all 21 build rows
- Combat: data audit of 432 reel stops and the new payloads, Bulwark immunities, 29 sampled boss values; 1,200-run A/B digests (10 FFX-2 families) and the FFX three-line bench vs 19b; 13 real-key FFX logs replayed; Ch XVII card 200 seeds on both trees; unit suite 11,273 tests
- Audio: qa --strict, ffmpeg decode 28/28, 29 files identical to release 36 and live, 193 routing samples in 27 runs
- Delivery: verify-live (342 files), manifest 1,716 files / 798,329,071 bytes, 3,951 media requests, 0 source maps
- Interface: 28 desktop runs of advisor picks vs keys, target cancel, 217,033 characters of player text, advisor size and overlap, 157 vitest
- Targets: 95 composites with end-state-board --pair; protected art verify-approved 586 + 48
- Chief: read the Ch IX sequence (vis/yoj-seq.jpg), the Trigger Happy gap logs, and traced src/ui/ffx2/TriggerHappy.ts input handling

**Reused (with the dependency argument)**

- CHK-024 save and settings upgrade matrix (24 cases), from critic/rounds/round-19b: No change to SaveData.ts or any src/app/*.ts outside screens/, no new storage write or fixture; 17 of 17 reloads this round keep the clear
- Audio half of the save matrix; pause cue hand-back; PR-0263 level estimate; PR-0220 pad unlock, from rounds 19b, 18, 17: Audio bytes sha-identical; pauseMusic.ts, PauseScreen.ts, saveSfxBalance.ts unchanged; AudioManager's +30 lines touch no volume
- Trema (XIII) and Den (XV) aftermath text, from rounds 19b / 18b: src/story unchanged c69de96a..cd9dbbb0; reachability itself NOT reused (UNVERIFIED)
- PR-0270 and PR-0032 code state; CHK-010 whole-party label, from rounds 18 / 19b: applyComfort.ts, hudTextSize.ts, options files and the targeting label DOM unchanged; rows re-read live
- Carried polish not re-observed (PR-0251, PR-0321, PR-0249, PR-0286, PR-0288, PR-0246, PR-0252, PR-0276, PR-0325 and the rest of 19b's list), from round 19b: Carried as open, not as confirmed: release 37 changed panel geometry, so none is claimed either way

**Not tested**

- Gamepad, Firefox, Safari, Edge, a real phone
- 4:3, 21:9 (PR-0300 wings, PR-0332 bands), 1440p and 4K shapes; CHK-002 at the three missing viewports
- TEXT SIZE at 115/130, EYE CANDY page (PR-0322/0323 repairs), HUD font-floor sweep
- Prep tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE (second round without them)
- Hidden FF7 fight (PR-0222, PR-0223)

**Required and not tested (keeps the deep obligation pending)**

- Single-lane frame time and load time for cd9dbbb0 (PR-0259; third review without it)
- FFX-2 Ch XIII Trema and Ch XV Den of Woe wins on this build (CHK-022)
- Trigger Happy on 390x844 touch and on an emulated pad (FOC37-02 acceptance)
- Living portraits: eyes following the highlighted row, LIVING PAINTINGS off, press state (D-321)
- Ch IX first menu recaptured on an idle host with an actor-visibility probe (PR-0341)
- Rest-gap measurement for Ch II, III, VIII (PR-0310)
- Release-37 named changes with no capture: Ch XII Auron disc line, Ch III Talk card at 0.6, FFX-2 end-of-fight banner, drift-driven plate defocus, Ginnem glow on/off, 35 boss keys seen in play
- CHK-002 at 4:3, wide and 4K
- CHK-B1 (Bailey's listening score, D-349)

## Issues, ranked (104 open)

Critical: none. Within each severity: Bailey's reported problems, frequency, player impact, coverage, effort; critic tooling last.

### major

**PR-0148** (audio; both) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0148 (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)

- Chapter / state: all
- Where: docs/audio/OWNER-VERDICT.md; shipped public/audio/music/*.mp3 and sfx sprites
- Expected: A numeric owner listening verdict recorded against the exact shipped cue set (CHK-B1, RUBRIC section 6).
- Observed: OWNER-VERDICT.md unchanged since 2026-09-29 (5e5ef411) and gives no number out of 10. D-349 (ask 14) is adopted as 'Bailey listens from docs/audio/audition.html when he has ten minutes; no number given yet'. D-307, D-308, D-309 still proposed. The latest ear words about shipped audio (2026-09-27, release 21) predate music v2 and SFX v2.
- Repro: Read docs/audio/OWNER-VERDICT.md and docs/target/decisions.json (D-307 to D-309, D-349). No seed needed.
- Evidence: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json
- Confidence: high
- Requirement: RUBRIC section 6 audio (Bailey's listening assessment); CHK-B1
- Smallest fix: Send Bailey docs/audio/audition.html with one question: a number out of 10 for the shipped battle, boss and scene cues, plus D-307 to D-309. Record the answer verbatim in OWNER-VERDICT.md.
- Acceptance: OWNER-VERDICT.md has a dated verbatim numeric verdict naming the shipped cue set.
- Round 20: No audio byte changed since release 36 (29 of 29 files sha-identical). OWNER-VERDICT.md unchanged since 2026-09-29; D-349 "no number given yet". A method check is due before another audio batch (RUBRIC section 8).

**FOC37-02** (interface; FFX-2 only) [introducedByCandidate true, regressionVsLive true, inNewFeature false]: FOC37-02 (widened from polish; regression against release 36): Trigger Happy now uses the press count, but the overlay says "MASH R1" and only keyboard R / PgDn count, so Enter, touch and pad players get one hit

- Chapter / state: IV Bahamut and V Vegnagun/Shuyin (Yuna is a Gunner by default; Trigger Happy is the first Skill row); any Gunner
- Where: src/ui/ffx2/TriggerHappy.ts:68 (subtitle "MASH R1") and :114-121 (a window keydown listener for KeyR / PageDown only; no pointer and no gamepad route); src/battle/ffx2/minigames.ts attachedResult now reads kind "ability" (release 37), so the count is honoured
- Expected: The faithful rule (research/ffx2-combat-core.md 3.1: one hit per press) with an input the player is told about and can reach on every supported input: keyboard, touch and pad (RUBRIC section 2 platform goals; CHK-015).
- Observed: Live 37, real keys, FFX-2 Ch V seed 1, 1600x900 (gap pass): with R pressed 3 and 12 times the battle log records trigger.hits 3 and 12 and that many damage events; with Enter pressed 3 and 12 times it records hits 0 and the shot lands once (118). The overlay reads "Trigger Happy MASH R1 0 HITS". Traced by the chief: the overlay has no pointer handler and listens to window keydown only, while a pad's R1 is read by Input.ts polling (button 5 -> r1) and dispatches no keydown, so a touch or pad player cannot add a hit. On release 36 every human Trigger Happy resolved as the engine roll (6 to 16; FOC37-02 measured 3 and 12 presses both giving 14), whatever was pressed. The overlay subtitle reads MASH R1 and only KeyR or PageDown count. Enter registers nothing: hits 0, so the shot does one 118 hit.
- Repro: Live site, PYREFLY_BROWSER=gpu, 1600x900, seed 1, FFX-2 Ch V: Change Yuna to Gunner, Skill > Trigger Happy, confirm the target, press Enter 3 times (critic/rounds/round-20/gapcap2/th.mjs); compare R 3 times (thR). For touch: 390x844 touch context, same path, tap the overlay (not captured; owed).
- Evidence: critic/rounds/round-20/evidence/gaps/th-ffx2-vegnagun-shuyin-3p-1600x900/run.json and -12p- (Enter: hits 0, one 118 hit), thR-ffx2-vegnagun-shuyin-3p-1600x900/run.json, thR-...-12p-, thRfast-...-12p- (R: hits 3 / 12 / 7); critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused.json FOC37-02 (release 36 behaviour); src/ui/ffx2/TriggerHappy.ts:114-121 (read)
- Confidence: high for keyboard (captured live); high by code trace, not captured, for touch and pad
- Requirement: CHK-015 (the player's own input, keyboard, pointer, controller or touch); RUBRIC section 2 platform goals; RUBRIC section 3 (a regression at major severity is a HOLD)
- Smallest fix: Smallest: listen for the abstract r1 button through Input (keyboard R / PgDn and pad R1) plus a tap target on the overlay, and print the bound key per input ("R", "R1", "TAP"). Until that ships, an input path that cannot press (touch, pad) should fall back to the release-36 roll rather than to 0. FFX-2 only. The faithful press-count rule itself stays.
- Acceptance: On live: keyboard R x3 gives 3 hits; pad R1 x3 (emulated pad) gives 3; 390x844 touch taps x3 gives 3; the overlay names the key for the active input; the Ch IV and V autopilot digests stay identical.
- Round 20: The combat auditor judges the press-count rule itself faithful and does not file it; this issue is the input path around it. The builder disclosed the side effect (docs/handoff/r37-lady-luck.md disclosure 2). Gap pass filed the keyboard half as minor; the chief widened it after tracing the touch and pad paths.
- Merged: gap-capture: Trigger Happy overlay says MASH R1 and Enter counts as 0 hits; FOC37-02 (focused review, polish)

**PR-0308** (combat; ffx) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0308 (carried, unchanged, STALLED): Bushido and Swordplay ignore the chosen Overdrive's input sequence, zone and speed

- Chapter / state: seymour-flux (Tidus Swordplay), yunalesca and later (Auron Bushido), every FFX chapter that opens the Overdrive picker
- Where: src/battle/ffx/overdrive.ts:311-316 (minigameParams: tidus-timing travelMs 1400 / zonePercent 22; auron-sequence inputs 7)
- Expected: Each Bushido and each Swordplay tier carries its own sourced input sequence, timer and zone (research/ffx-overdrive-input-rules-2026-09-30.md; Tornado 3 s, others 4 s is already modelled).
- Observed: critic/rounds/round-20/combat/od-params-probe.json is identical to round 19b's (only the build string differs): every Bushido still opens one invented 7-input sequence and every Swordplay tier the same zone and travel time. No file under src/battle/ffx/overdrive.ts or src/ui/ffx changed in release 37.
- Repro: Re-run critic/rounds/round-20/combat/od-params-probe.test.ts (vitest config critic/rounds/round-20/combat/vitest.critic.config.ts); or read overdrive.ts:311-316.
- Evidence: critic/rounds/round-20/combat/od-params-probe.json, od-rows-probe.json (both identical to critic/rounds/round-19b/combat/)
- Confidence: high
- Requirement: AGENTS.md rule 6 (never invent game data); RUBRIC combat; CHK-023
- Smallest fix: Feed the per-ability sequence, zone and speed from the sourced Overdrive rows into minigameParams; where a number is unsourced say so and keep the current default.
- Acceptance: od-params-probe shows a different sequence per Bushido and a different zone or speed per Swordplay tier, matching the research note, and the ffx-overdrive-* unit tests still pass.
- Confirmer: Confirmed from code (overdrive.ts minigameParams unchanged). The confirmer cautions that research/ffx-overdrive-input-rules-2026-09-30.md, as grepped, sources wrong-press and fail rules rather than a per-tier sequence, zone or speed table: the fix must use only what the research supports and say where a value is unsourced (rule 6).
- Merged: combat-encounter PR-0308; gap pass "Ch II Auron Dragon Fang shows 7 chips"; confirm: confirmed

**PR-0269** (combat; ffx) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0269 (carried, improved, still open): Chapter XVII's advisor card chain wins 48.5 percent (was 4.5); Genais's Sigh on link 3 is now the largest loss

- Chapter / state: sin-fins-core (Ch XVII), links 1 to 3 on the carried party
- Where: src/engine/tactics/sin-common.ts, sin-fins-core.ts (the card and the shipped tactic)
- Expected: A player following the card should clear the chain as one run on the project's own bar (the handoff cites 90 percent); D-282 (Sin difficulty) is undecided so the bar itself is Bailey's.
- Observed: Seeds 1 to 200, the v3 card with options {}, shipped switches, same driver on both trees: c69de96a 9/200 (4.5 percent), cd9dbbb0 97/200 (48.5 percent). Losses on cd9dbbb0: link 3 Genais's Sigh 60, Core Water 9, Blizzard 8, Fire 8, Thunder 4, link 2 Ram 7, Smack 5 (103 losses). The bench's sensible line is 51/200 and naive 0/200 on both trees. Round 19b's 40-seed read was 3/40; this round's 40-seed read is 16/40 (critic/rounds/round-20/combat/sin-fins-advisor-r20.json), the 200-seed read agrees within noise. Real-key Ch XVII win exists (252 turns, 19.3 min, 2000x1012).
- Repro: R20_ROOT=<tree> R20_TAG=<tag> npx vitest run --config critic/rounds/round-20/combat/vitest.critic.config.ts sin-ab (baseline tree = git archive c69de96a src tests/unit/helpers).
- Evidence: critic/rounds/round-20/combat/sin-ab-base.json, sin-ab-cand.json, sin-fins-advisor-r20.json
- Confidence: high
- Requirement: RUBRIC section 2 (the advisor offers legal, useful actions); AGENTS.md rule 10 (a data change needs Bailey's yes)
- Smallest fix: Not a code change I can recommend building: the remaining loss is Genais's Sigh on link 3, and the builder's own note is that Eye Drops or Esuna in the Sin preset is a data change that needs Bailey's explicit yes. Gain for the stall rule: measured (4.5 to 48.5 percent), so the area is not repeating.
- Acceptance: The same 200-seed chain read on the next candidate; Bailey decides whether 90 percent is still the bar given D-282.
- Confirmer: Not independently re-run by the confirmer (neither confirmed nor refuted). Kept on the combat auditor's seeded A/B (same driver on both trees, 200 seeds). A measured gain, so the stall rule does not trigger.
- Merged: combat-encounter PR-0269; gap pass "No real-key win path reached for Sin XVII"; confirm: confirmed

**PR-0311** (visual; FFX-2 only) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0311 (carried, widened): FFX-2 dresspheres without painted art: Yuna Thief is a grey mannequin, Rikku Warrior has no art at all and its idle.json 404s on live (Ch XIII)

- Chapter / state: Ch VI Leblanc (Yuna Thief), Ch XIII Trema (Rikku Warrior)
- Where: after a dressphere change on a pickable girl
- Expected: A painted figure for every dressphere a player can pick (CHK-012).
- Observed: Leblanc 1600x900 c1-seq f10 and f20: Yuna's Thief renders as a translucent grey-violet mannequin silhouette. Trema attempt 2: the engine logs Rikku songstress to warrior; art/characters/rikku-warrior/idle.json returns 404 and the run logs one console error; art/characters has no yuna-thief, rikku-warrior or paine-thief folder. The twirl keys for Thief now exist (all 77 keys in) so the twirl plays and lands on the placeholder. Delivery consequence (cross-referenced, not scored twice): one 404 and one console error per Trema run for art/characters/rikku-warrior/idle.json (CHK-018 FAIL; new against 19b's Trema runs because Rikku reached Warrior this time).
- Repro: FFX-2 Ch VI seed 1: first CHANGE for Yuna to Thief (route20.mjs ffx2-leblanc); Ch XIII: Rikku songstress to warrior via the grid.
- Evidence: critic/rounds/round-20/vis/sc2.jpg, critic/rounds/round-20/evidence/ffx2-trema-win/network-media.json and battle-log.json, critic/rounds/round-20/evidence/gaps/sc-ffx2-leblanc-1600x900-s1/run.json
- Confidence: high (file absence and 404 are direct; the mannequin is seen)
- Requirement: CHK-012; RUBRIC section 6 visual (consistency)
- Smallest fix: Install the held art for yuna-thief, rikku-warrior and paine-thief (candidates are in candidates/2026-10-03-overnight and await Bailey's picks) or, until then, hide those dresspheres from the pick list in Garment Grid and CHANGE; never ship the mannequin as a final face.
- Acceptance: For every dresshpere in the FFX-2 data a painted idle, hurt and KO exists and 0 art 404 in a run that visits each sphere.
- Confirmer: Confirmed on disk: public/art/characters has no yuna-thief, rikku-warrior or paine-thief folder.
- Merged: R20-PD-01 (rikku-warrior idle.json 404); capture owner: console 404 for rikku-warrior/idle.json

**PR-0341** (visual; FFX only) [introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false]: PR-0341 (new, unconfirmed single run): Ch IX Yojimbo and Daigoro are not drawn at the first command menu at 2000x1012 for about 4-6 s, while the HUD lists Yojimbo as the target

- Chapter / state: Chapter IX Yojimbo, Cavern of the Stolen Fayth
- Where: first command menu, 2000x1012, seed 1
- Expected: Every targetable enemy visible at the first menu (CHK-011: no targetable enemy more than about 25 percent occluded in the default framing).
- Observed: At the first menu (10-first-menu-coach, 11-advisor, 12-intent-E, spanning about 3.7 s, and the transition frames f07-f09) only Lady Ginnem stands on the platform; Yojimbo and Daigoro are missing although the HUD lists Yojimbo as a target and the boss plate is up. Both are drawn by 13-guide-G (about 6 s later) and in every later frame (16-target, 23-midfight, party actions). Round 19b's fm-yojimbo-cavern-2000x1012 at the same seed and size draws both. In the 13-guide frame a bright blue tree-like painting also bleeds into the cavern backdrop (see V20-02).
- Repro: Fresh profile, PYREFLY_BROWSER=gpu, 2000x1012, setSeed(1), real keys: title, chapter select to yojimbo-cavern, prep, skip scene, wait for the first menu (awaitingMenu true) and screenshot; critic/rounds/round-20/cap/route20.mjs yojimbo-cavern --size=2000x1012.
- Evidence: critic/rounds/round-20/evidence/yojimbo-cavern-win/10-first-menu-coach.png, 11-advisor.png, 12-intent-E.png, 13-guide-G.png; comparison critic/rounds/round-20/vis/yoj-seq.jpg and yoj-19b-2k.jpg; baseline critic/rounds/round-19b/evidence/gaps/fm-yojimbo-cavern-2000x1012/10-first-menu.png
- Confidence: medium: harness-verified frames (10, 11, 12 and transition f07-f09) show it, the chief read them (critic/rounds/round-20/vis/yoj-seq.jpg); one run on a host running 4-5 browser lanes; the confirmer did not reproduce it (no capture made) and did not refute it; cause not traced
- Requirement: CHK-011; RUBRIC section 2 (encounter visible and playable); AGENTS.md hard rule 4
- Smallest fix: Recapture Ch IX at 2000x1012 and 1600x900 on an idle host with an actor-visibility probe (each actor's quad alpha and projected box) at the first menu; if it reproduces, find what hides the boss quad until the first party action (suspected, untraced: the new Ginnem glow layer in src/scenes/cavern-stolen-fayth-glow.ts via PaintedActor.contentQuad, or the A-7 backdrop layer) and keep every enemy quad visible while a menu awaits.
- Acceptance: At 1600x900 and 2000x1012, seed 1, Yojimbo, Daigoro and Ginnem are all drawn in the first 3 frames after awaitingMenu is true and in 3 of 3 runs.
- Confirmer: Not reproduced and not refuted. Kept at major because a boss missing from its own first menu is a severe visual deviation if it reproduces; first step is the idle-host recapture in the fix.

**PR-0340** (combat; FFX-2) [introducedByCandidate false, regressionVsLive false, inNewFeature true]: PR-0340 (new; release 37 feature): Lady Luck's reels, Dud and overlay ship, but no shipped FFX-2 Garment Grid offers Lady Luck, so no player can reach them

- Chapter / state: IV, V, VI (all shipped chapters)
- Where: src/data/ffx2/builds/*.ts, gridNodeContents in src/battle/ffx2/setup.ts:46
- Observed: Release 37 ships Lady Luck's reels, the Dud and the reel overlay, but no shipped party build's Garment Grid offers the Lady Luck dressphere. The live Change menu offered only Gunner and Black Mage in Ch IV and V, and Songstress, Thief, Black Mage and White Mage in Ch VI. gap-grid.json shows no Lady Luck in any of the 21 build rows. The builder's note says the reels were only reachable through a scratch alias, so R37's Lady Luck work and FOC37-01 are invisible to players.
- Repro: FFX-2 Ch V (ffx2-vegnagun-shuyin), seed 1, Wait. Title, board, party prep, Enter. At the first menu choose Change and read the rows. Run gapcap2/chg.mjs <chapter>. For the engine view run gap-grid.test.ts with critic/rounds/round-20/combat/vitest.critic.config.ts.
- Evidence: evidence/gaps/ll0/change-dest-*.json, critic/rounds/round-20/combat/gap-grid.json
- Confidence: high for the live Ch IV, V and VI menus and the build data; the other chapters rest on the build data alone
- Requirement: AGENTS.md hard rule 4 (built but wired to nothing); CHK-023 (a subsystem is invoked through the real presentation path); RUBRIC section 2 (a feature counts only when the player can reach it)
- Smallest fix: Product decision for Bailey, not a defect to patch silently: either give Lady Luck a node on the chapter-appropriate grid for the girl who owns it (FFX-2 only, sourced from research/ffx2-combat-core.md), or record that the reels ship dormant. The critic does not choose.
- Acceptance: A real-key run in a shipped chapter reaches Lady Luck through Change and opens the reel overlay.
- Round 20: The release announcement listed "Lady Luck's sourced reels and the Dud (FFX-2)" as new. FOC37-01, PR-0349, PR-0350 and the reel half of the combat auditor's gain sit behind this. Product decision for Bailey (grid node or dormant); the critic does not choose.

**PR-0310** (visual; FFX only (Ch II, III, VIII); the fail-closed gate itself is both) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0310 (carried, not re-measured on this build): party and boss interpenetrate at rest in Ch II, III and VIII

- Chapter / state: yunalesca, braskas-final-aeon, evrae-airship, first menu at rest
- Where: chapter staging (party and boss slots), suspected; plate.restGap in critic/rounds/round-19b/evidence/gaps/plate/*.json
- Expected: At rest no party member stands inside a boss's painted silhouette (restGap >= 0).
- Observed: No gap measurement (fm-* runs) exists for this build and release 37 does not name the staging as changed, so I cannot close or re-open it; Ch III and Ch VIII frames read still show Tidus and Auron in front of the aeon and the serpent's coil as in 19b.
- Repro: Seed 1, board card by arrows, prep confirmed, scene held-skip, first menu at 1600x900: Ch II, III, VIII; read __pyrefly.fx.mix.snapshot().framing.plate.restGap (node critic/rounds/round-19b/gapcap/plateprobe.mjs <chapter> <sizes>).
- Evidence: critic/rounds/round-19b/evidence/gaps/plate/yunalesca.json, braskas-final-aeon.json, evrae-airship.json; critic/rounds/round-19b/visual/sheet-yuna-aspects.jpg, sheet-natus-evrae.jpg
- Confidence: high for the carried defect (19b measured it); low for any change since: no rest-gap measurement exists for cd9dbbb0 and release 37 changed clearance and framing code
- Requirement: VP-1001-02; approved targeting B; masters.ts contract
- Smallest fix: Separate the party and boss slots in these three scenes (a staging change, not a camera change). It changes how approved scenes look, so it needs Bailey's yes (rule 9) first.
- Acceptance: restGap >= 0 and no party member inside the boss silhouette at rest in Ch II, III and VIII at 1600x900, 2000x1012 and 2560x1440.
- Confirmer: Cannot be confirmed or refuted without a gap measurement; carried open, not closed.
- Merged: visual PR-0310; capture owner "PR-0310 residual" (polish); confirm: confirmed

**PR-0270** (onboarding; FFX-2 only) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0270 (carried, third review, STALLED): TEXT SIZE grows nothing in the FFX-2 battle HUD

- Chapter / state: IV Bahamut and every FFX-2 chapter; pause > OPTIONS > TEXT SIZE
- Where: src/app/applyComfort.ts:41 TEXT_SIZE_WIDE_SCOPE = false; src/ui/common/hudTextSize.ts header 'Game case: FFX only'
- Expected: A2 (D-285): TEXT SIZE grows the battle HUD, dialogue and menus in both games.
- Observed: The live OPTIONS page of the FFX-2 Ch IV run carries the same TEXT SIZE row as FFX; the switch is still off and the files are unchanged since round 18 (git diff c69de96a..cd9dbbb0 empty for them). No live text-size capture this round.
- Repro: Real keys P, OPTIONS, TEXT SIZE right in Ch IV at 1600x900 and 390x844, then read the HUD (cap/comfort2.mjs from round 18).
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/run.json pause.optionsText; src/app/applyComfort.ts:41; critic/rounds/round-18/evidence/gaps/textsize-ffx2-bahamut-1600x900/run.json (reused)
- Confidence: high (code state), medium (no fresh capture)
- Requirement: A2 (D-285); docs/handoff/r31-access.md
- Smallest fix: Before Bailey's D-220 Q4 pick: label the row honestly ('FFX battle HUD and dialogue'). After it: switch on TEXT_SIZE_WIDE_SCOPE with the FFX-2 intent-board solver slot. A method check is due before another batch (RUBRIC section 8).
- Acceptance: After Q4: FFX-2 command, party and advisor panels grow at 115 and 130 percent on desktop and phone with no overlaps, by the comfort probe.
- Merged: capture owner: TEXT SIZE does not grow the FFX-2 battle HUD; interface R17-ON-01

**PR-0099** (audio; both) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0099 (carried, STALLED): eleven chapter rows in THEMES.md still play a stand-in cue (XVII and XVIII among them)

- Chapter / state: VI, IX (scene), X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII
- Where: docs/audio/THEMES.md chapter cue map; src/data chapter music records
- Expected: D-209: every chapter gets its own composed cue; a stand-in never counts as finished.
- Observed: themes-audit this round marks the same rows '[borrowed; owed]': ffx2-leblanc, yojimbo-cavern, seymour-natus, ffx2-fallen-aeons, seymour-omnis, ffx2-trema, isaaru-via-purifico, ffx2-den-of-woe, ffx2-ixion-djose, sin-fins-core, sin-face. Runtime plays exactly those stand-ins (for example XVII and XVIII play scene-fahrenheit and boss-evrae). 0 chapters depart from the map.
- Repro: node tools/audio/themes-audit.mjs from D:/Final Fantasy (output in critic/rounds/round-20/audio/themes-audit.txt).
- Evidence: critic/rounds/round-20/audio/themes-audit.txt; critic/rounds/round-20/audio/routing.json
- Confidence: high
- Requirement: D-209; RUBRIC section 6 audio (thematic coherence)
- Smallest fix: Compose the owed cues in priority order (Sin assault and countdown, Omnis, Natus), each auditioned by Bailey before it ships.
- Acceptance: themes-audit shows no '[borrowed]' for the delivered chapters, with an ear verdict recorded per cue.
- Merged: audio PR-0099; confirm: confirmed

**PR-0222** (delivery; FF7 (hidden experiment)) [introducedByCandidate false, regressionVsLive false, inNewFeature false]: PR-0222 (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured

- Chapter / state: FF7 Guard Scorpion (unlisted)
- Where: secret door -> swirl -> field, cold cache
- Expected: No black hold: the swirl's last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- Observed: Not captured this round. No FF7 file and no shipped asset changed between 65152c1b and f302f163.
- Repro: Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears. Press Esc and arrows during the hold.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/prep-delivery/diff-vs-r18-candidate-65152c1b.txt
- Confidence: low (unverified either way)
- Requirement: CHK-017 / CHK-025; RUBRIC §5
- Smallest fix: None proposed until it is observed.
- Acceptance: No black sample longer than 1 s, the field arrives, and Esc and arrows during the hold neither lock nor start anything.
- Round 20: Not exercised in round 20 (hidden FF7 fight outside the release-37 change set); carried at major without new evidence.

### polish

**PR-0330** (interface; both (FFX Ch III, VII, IX, XII; FFX-2 Ch IV at 1600x900)): PR-0330 (carried, widened, regression against release 36 in Ch VII): the move-advisor card shrinks to a stub that drops cost, hit chance, effect and reason

- Chapter / state: seymour-anima-macalania (NEW at 2000x1012), braskas-final-aeon 1600x900, yojimbo-cavern 2000x1012, seymour-omnis 1600x900, ffx2-bahamut 1600x900; first menu / target step
- Where: advisor card fitting under the colossus clearance field (suspected: src/engine/fx/mix/clearance.ts, MaxMix.ts, framing.ts changed in release 37; not traced)
- Expected: The card keeps its cost, hit chance, effect and reason lines as on release 36 and live 35 (RUBRIC section 2: the advisor says what an action costs and does).
- Observed: Ch VII Anima, same seed 1 and 2000x1012: release 36 (round 19b) card 489x261, 265 characters ('Steal ... IN SPECIAL NO MP 3% CRIT Steal Take the pouch off Guado Guardian A: one successful Steal ends its 1,000 HP Auto-Potion counter...'); release 37 card 274x204, 69 characters ('NEXT BEST MOVE Rikku Steal -> Guado Guardian A GUIDE'S PICK IN SPECIAL'); the NEXT BEST MOVE chip wraps to two lines. Ch III 1600x900 unchanged stub (293x188, 68 characters, same as 19b); Ch IX 2000x1012 stub 273x228 whose pick (Fire Gem -> Yojimbo) differs from the guide rail's 'Defend -> Kimahri' with no reason line to say why; Ch XII 250x173; FFX-2 Ch IV 1600x900 loses '100% TO HIT', '+ SHELL' and the reason (identical to 19b; at 2000x1012 the card is full in both builds). The pick, target and submenu stay correct.
- Repro: Fresh profile, real keys title -> board -> Chapter VII -> prep -> scene -> first command menu, 2000x1012, seed 1 (setSeed(1) before the first key); compare advisorText and cardFirst.card in run.json against critic/rounds/round-19b/evidence/seymour-anima-macalania-win/run.json.
- Evidence: critic/rounds/round-20/evidence/seymour-anima-macalania-win/16-target-single.png and run.json vs critic/rounds/round-19b/evidence/seymour-anima-macalania-win/16-target-single.png; braskas-final-aeon-win/11-advisor.png; yojimbo-cavern-win/11-advisor.png; seymour-omnis-win/11-advisor.png; ffx2-bahamut-lose/11-advisor.png
- Confidence: high on the measurement (same seed, size, route in both builds); low on the cause
- Requirement: RUBRIC section 2 (advisor says what an action costs and does) and section 3 (no regression against live); CHK-004
- Smallest fix: Give the card its full variant whenever the clearance field would squeeze it (move it, as already done for Natus, or keep chip, one-line target, cost and the effect line in the compact variant); trace the Ch VII change first.
- Acceptance: cardrect probe at 1600x900 and 2000x1012 for Ch III, VII, IX, XII and FFX-2 Ch IV: cost, effect and reason lines present, advisorText length within 10 percent of release 36 for Ch VII.

**FOC37-03** (interface; FFX-2 only): FOC37-03 (carried from the focused review, not reproduced): the Ch IV first-run coach tag clips at 2000x1012 for some first actors

- Chapter / state: IV Bahamut, 2000x1012, seed 2 (focused review)
- Where: coach tag width (src/ui/coach, not traced)
- Expected: Coach and tag stay inside the viewport.
- Observed: Round 20 captured 2000x1012 coaches at seeds 1, 1001 and 1002 (Ch IV, Ch XIII, others): all inside the page (tag right edge near x 525 of 2000 in Ch IV). Seed 2 of Ch IV was not run, so the focused finding neither confirmed nor cleared.
- Repro: Chapter IV, seed 2, 2000x1012, first menu.
- Evidence: critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused.json FOC37-03; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: low (not reproduced)
- Requirement: CHK-003
- Smallest fix: Clamp the coach card and tag to the viewport width.
- Acceptance: Seed sweep 1-6 at 2000x1012 in Ch IV: tag right edge below the page width.

**PR-0326** (audio; both): PR-0326 (carried, half delivered; R20-AUD-01): the title's battle-start cue no longer plays via synth but now never plays at all, and the first UI sounds are still the procedural synth in 25 of 27 runs; music lags at pre-scene in 3 of 27

- Chapter / state: title, chapter select, pre-scene (seen in FFX Ch I, III and FFX-2 Ch XIII; first sounds in 25 of 27 runs of both games)
- Where: src/app/screens/TitleScreen.ts:195 (void audio.playSfxFromSprite('battle-start')); src/audio/AudioManager.ts:520-540 (playSfxFromSprite); src/audio/AudioManager.ts:466-490 (playSfx never waits for a sprite)
- Expected: CHK-001 step 3: no cue falls back to the synth path, so the first sound of a session is the sprite or nothing; PR-0326 acceptance: sfxLog shows no via:synth entry in a fresh-profile run. Whether the press-start cue should be audible when the sprite is late is a design question for Bailey; 'plays nothing' is the documented behaviour of playSfxFromSprite.
- Observed: Fresh profile, candidate cd9dbbb0, GPU mode, 27 runs. (1) 'battle-start' has 0 sfxLog entries in 27 of 27 runs (19b: 24 of 24 via synth), so the press-start cue is dropped. (2) sfxLog[0] is via synth in 25 of 27 runs: 'cursor-move' 82 and 'confirm' 8 synth entries (90 in total, 19b 24), at AudioContext time 1.9 to 5.2 s; in 19b the same board cursor-moves at 2.2 to 3.4 s were all via sprite. First sprite use now lands at 2.3 to 14.0 s (ffx2-bahamut-lose 13.95 s, ffx2-trema-win 11.52 s, braskas 9.15 s). (3) At the pre-scene sample the previous cue is still current in 3 runs (0 of 24 in 19b): seymour-flux-lose 'title' with chapter-select not cached at 16.0 s, braskas-final-aeon-win and ffx2-trema-win 'chapter-select'; the v2 sprite is still undecoded at pre-scene in seymour-flux-lose and ffx2-bahamut-lose. Later samples are the right cues. Pre-scene sample time matches 19b (median 15.1 s against 15.2 s), but 3 to 5 runs shared the host, so host load is a candidate; so is release 37's heavier early art traffic. The code diff does not touch the sprite's load order (warmSfx at context creation, both banks fetched together), so a product cause is not shown. Data read; nobody listened.
- Repro: Fresh profile, PYREFLY_BROWSER=gpu, 1600x900, seed 1 (window.__pyrefly.setSeed(1) before the first key): Enter on the title, walk the board, enter Chapter I, then read the audio debug sfxLog and the music sample at the pre-scene. Rerun alone on the host (nothing else running) and again on release 36 (c69de96a) on the same host to separate load from product.
- Evidence: critic/rounds/round-20/audio/routing.json; critic/rounds/round-20/evidence/seymour-flux-win/audio-debug.jsonl; critic/rounds/round-20/evidence/seymour-flux-lose/audio-debug.jsonl; critic/rounds/round-20/evidence/ffx2-bahamut-lose/audio-debug.jsonl; critic/rounds/round-19b/audio/routing.json
- Confidence: medium for the observation (data read, all 27 logs), low for the cause
- Requirement: CHK-001 step 3; PR-0326 acceptance; Bailey 2026-09-18 'audio is arcade-y'
- Smallest fix: First measure: one solo run of release 37 and one of release 36 on the same host. If solo release 37 is clean, record host load and close. If it still shows synth cursor-moves, start the sprite fetch at page load (before the first gesture, decode on unlock) or have the board's first menu sounds wait on whenFirstBankLoaded as the press-start does; and decide with Bailey whether the press-start cue should wait longer than 1.2 s.
- Acceptance: A solo fresh-profile run shows no via:synth entry in sfxLog, 'battle-start' plays via sprite or is absent by a recorded decision, and the pre-scene sample is silent or the scene's cue in 10 of 10 runs.

**PR-0342** (visual; FFX only): PR-0342 (new; V20-02): Ch IX: a foreign blue tree painting shows over the cavern backdrop for part of the fight

- Chapter / state: Chapter IX
- Where: 13-guide-G (clear), 16-target-single (faint), 2000x1012 seed 1
- Expected: The Cavern of the Stolen Fayth plate and its approved look only.
- Observed: A bright blue-white tree canopy with falling petals appears in the upper right of the cavern battle plate in 13-guide-G (about 5.7 s after the first menu) and faintly behind Yojimbo in 16-target-single; the cavern plate is otherwise a near-black platform. It looks like a crossfade or layer from another room (Macalania woods). Round 19b's Ch IX frames show no tree.
- Repro: As V20-01, then press G at the first menu and screenshot at 2000x1012.
- Evidence: critic/rounds/round-20/evidence/yojimbo-cavern-win/13-guide-G.png, critic/rounds/round-20/vis/yoj13-crop.jpg
- Confidence: medium-low (one run; cause unestablished)
- Requirement: CHK-013 (art judged in the running game); approved art identity
- Smallest fix: Identify which layer paints the tree (suspected A-7 living-backdrop sky layer or a plate crossfade) and restrict it to rooms that own it; the fix lives with V20-01.
- Acceptance: No tree or foreign painting at any point of a Ch IX fight in 3 of 3 runs at 1600x900 and 2000x1012.

**PR-0353** (delivery; FFX-2 only): PR-0353 (new; R20-PD-02, downgraded from major): FFX-2 Ch XV Den of Woe was lost in all four attempts on this build (19b won it first try); a build cause is not separated from size and ATB timing

- Chapter / state: XV Den of Woe (ffx2-den-of-woe), 3-link chain, seed 1, 1600x900
- Where: not traced; suspects are the release-37 FFX-2 changes (dressphere shot held 1.6 s and its clean-frame gating, resolve and execute changes, Lady Luck reels/minigame outcome) or a size-dependent timing difference (19b ran 2000x1012, this round 1600x900)
- Expected: A real-flow win for each included chapter on the build under review, with results rows, post-scene, board and a reload that keeps the clear (CHK-022).
- Observed: ffx2-den-of-woe-win and ffx2-den-of-woe-win-r19route (19b's route library) give identical results: attempt 1 defeated at 13 turns in link 2 (Gippal 14,800 untouched, party at 1 to 105 HP by turn 10), attempt 2 won link 1 and was defeated by Nooj in link 3 at 23 turns (Nooj 21,282 of 23,800). Results read 'Defeat TURNS 17 ATTEMPTS 2 BEST NEVER CLEARED'. In 19b the same chapter at 2000x1012 seed 1 won first time in 51 turns (473 s). The first 11 turns of the two builds are bit-identical in HP; they diverge at turn 12 (here Yuna 386 and Rikku 5,882, there 456 and 5,933), so the engine is deterministic for a given route and the difference lies in size, timing or build. The harness also logs the second attempt's step as outcome 'victory' (link 1's result) while the attempt record and the results screen say defeat (PR-0261, critic tooling).
- Repro: node critic/runner/lib/route.mjs ffx2-den-of-woe win --base=https://baileypillon.github.io/pyrefly-reprise/ with PYREFLY_BROWSER=gpu, seed 1, size 1600x900 (and then 2000x1012, alone on the host). Evidence index.json files ffx2-den-of-woe-win/ and ffx2-den-of-woe-win-r19route/.
- Evidence: critic/rounds/round-20/evidence/ffx2-den-of-woe-win/{run.json,turn-log.json,a2-turn-log.json,a2-battle-log.json,31-results.png,a2-31-results.png}, critic/rounds/round-20/evidence/ffx2-den-of-woe-win-r19route/, critic/rounds/round-19b/evidence/ffx2-den-of-woe-win/turn-log.json
- Confidence: medium that the losses are real at 1600x900; low on any build cause: the engine A/B digests for Den (intended and wrong, 120 seeds) are identical on c69de96a and cd9dbbb0, and 0 of 4 at the measured 24 percent first-try rate has probability about 0.33
- Requirement: CHK-022; RUBRIC section 5 (one continuous legal-input route per included chapter); balance belongs to combat and encounter, cross-referenced and not scored there from this delivery evidence
- Smallest fix: First separate size and timing from build: run the unchanged 19b route at 2000x1012 on live 37 and at 1600x900 on live 36 (or a candidate build of c69de96a) alone on the host. If the size alone flips the outcome, report that to the presenter owner (a presentation beat must not change an ATB outcome); if the build does, trace from turn 12 of a2-turn-log.json.
- Acceptance: Den of Woe win at 2000x1012 and 1600x900 on cd9dbbb0 through results, CONFIRM, board and reload, or a measured explanation of the loss.
- Severity change: The combat auditor's seeded A/B shows no engine change for Den, the result is within the known first-try rate (PR-0306), and the only build path left (presenter timing such as the 1.6 s dressphere hold while ATB gauges run) is a hypothesis. Kept open as the investigation; the missing Den win is recorded under CHK-022 and coverage.requiredNotTested.

**PR-0348** (delivery; ffx2): PR-0348 (new id; R20-CE-05 + R20-PD-03 + R20-FEEL-05 + capture owner): FFX-2 Ch VI Leblanc seed 1 run stalled 957 s at link 1 with Rikku's White Magic submenu open while the route wanted Item > Phoenix Down; rerun won

- Chapter / state: ffx2-leblanc (Ch VI), link 1 Ormi + goons, Wait default, 1600x900
- Where: critic/rounds/round-20/evidence/ffx2-leblanc-win (run.json stalledAt {link 1, phase command:rikku}); engine state frozen at 31,607 ms game time
- Expected: A run reaches an outcome, or a player at an open menu can always back out; Wait holds the clock under an open menu by design.
- Observed: Paine was KO'd at turn 11; from turn 12 the route wanted Item > Phoenix Down on Paine and could not find the row (took null, 'no target cursor', 25 empty picks, 24 repeats about 36 s apart) while the visible list was White Magic's submenu rows (Pray, Vigor, ... White Magic Lv. 3). The engine clock was frozen under the open menu (Wait), HP unchanged. The rerun (r2) took the same Phoenix Down at the same turn from an idle state and won in 76 turns. 30 s of game time elapsed in 17 minutes of wall time; no console error. Product (a menu that reopens inside the last submenu, or Esc not backing out) or route harness (it never presses Back) is not established; the rubric says to separate them before calling a game defect.
- Repro: Seed 1, chateau build, Wait, real keys, route with an Item > Phoenix Down want after a KO. Not reproduced on the rerun. On stall: dump the menu depth and top row labels, then press Esc and record what happens.
- Evidence: critic/rounds/round-20/evidence/ffx2-leblanc-win/run.json, turn-log.json (turns 12 to 35), battle-log.json (last atb snapshot at 30,498 / 31,607 ms); round 19 reported the same stall once at seed 1
- Confidence: low
- Requirement: CHK-022 (reaches its destination); RUBRIC section 5 (separate harness failures and product failures)
- Smallest fix: Three serial reruns of seed 1 on an idle host with a DOM dump at the stall and an Esc press; if Esc backs out, close this as a route fault (make the route press Back when its wanted row is absent).
- Acceptance: Three of three seed-1 runs reach victory or defeat, or the stall is shown to be the route's missing Back.
- Merged: R20-CE-05; R20-PD-03; R20-FEEL-05; capture owner: Leblanc route stalled once

**PR-0354** (interface; FFX only): PR-0354 (new; R20-IF-01, present since round 19): Ch XII intent card says "Deals no damage" above damage rows of 2,066-2,333, under a placeholder move name

- Chapter / state: XII Seymour Omnis, first menu with E open, 1600x900 seed 1
- Where: src/battle/ffx/intent.ts:315 (describeAbility prints 'Deals no damage' for a formula 'none' row with no statuses); src/data/ffx/enemies/seymour-omnis-abilities.ts:170 (omnisVolley name 'Mortiphasm Spells', commented PLACEHOLDER); traced
- Expected: The card names his volley honestly: it deals the damage the rows below it list ('four Firaga' as the ENEMY INTENT line says); no placeholder label.
- Observed: 'SEYMOUR OMNIS 3RD IN QUEUE / Mortiphasm Spells [SCRIPTED] / Deals no damage. / DAMAGE TIDUS 2,066-2,333 34% HP, AURON 2,066-2,333 34% HP'. The ENEMY INTENT slab below says 'four Firaga next', so the true information is on screen; the sentence under the move name is false. Graded polish: the damage rows and the slab carry the truth; a literal reading of 'wrong information' is major.
- Repro: Real keys to Chapter XII (seed 1, 1600x900), press E at the first command menu; read the intent card.
- Evidence: critic/rounds/round-20/evidence/seymour-omnis-win/12-intent-E.png and run.json intentText; identical text in critic/rounds/round-19b and round-19 evidence
- Confidence: high
- Requirement: RUBRIC section 2 (honest enemy intent); CHK-007 and CHK-012 (no placeholder in shipped copy)
- Smallest fix: Give the volley row an intent line from the planner (for example 'Four spells, one per disc: four Firaga') instead of describeAbility's inert sentence, and a real name.
- Acceptance: Chapter XII intent card never prints 'Deals no damage' while damage rows are shown; the move name has no placeholder.

**PR-0355** (interface; FFX-2 only): PR-0355 (new; R20-IF-02): FFX-2 Ch VI enemy list: Ormi's "STATUS 4" tag overprints the name "Dr. Goon"

- Chapter / state: VI Leblanc Syndicate, first link, Dr. Goon KO'd, Ormi with four statuses, 1600x900 seed 1
- Where: FFX-2 enemy list status tag placement (src/ui/ffx2, not traced)
- Expected: Every enemy name is readable (CHK-009).
- Observed: Ormi's 'STATUS [4]' tag sits on the 'Dr. Goon' row and covers the top half of the name; the frame is static (the run sat idle on it for minutes).
- Repro: Chapter VI at 1600x900, get Ormi to carry four statuses, open any Rikku or Yuna menu; read the enemy list at top left.
- Evidence: critic/rounds/round-20/evidence/ffx2-leblanc-win/27-no-choosable-row.png; crop critic/rounds/round-20/audit/zz-leblanc-status-crop.png
- Confidence: medium (one chapter and state; the first-run harness stalled in this state)
- Requirement: CHK-009
- Smallest fix: Reserve the tag's height in the row stack or draw the tag to the right of the name.
- Acceptance: label-fit probe: no enemy name box intersected by a status tag with 1 to 6 statuses on any enemy row, 1600x900 and 2000x1012.

**PR-0357** (interface; both (Ch I, Ch IV seen)): PR-0357 (new; R20-IF-04 + capture owner): the intent card's overflow/ALSO line is cut mid-sentence and ghosted behind the dashed footer rule (Ch I, Ch IV; 2000x1012)

- Chapter / state: I Seymour Flux, IV Bahamut, desktop
- Where: enemy intent card overflow fade with 'J HOLD +N MORE'
- Expected: A collapsed card ends on a whole line or a clearly dimmed 'more' cue.
- Observed: Ch IV: 'The Mega Flare countdown is an action counter, not a' then a ghost of the second line ('Slowing him slows it too') at 1.4:1 under the rule; Ch I: 'Lands on one of these, picked when it acts.' at 2.0:1. The cue 'J HOLD +1 MORE' is directly below, so this looks deliberate; the cut sentence hides the rule that matters in the Mega Flare fight. Capture owner: The ALSO block text 'The Mega Flare countdown is an action counter, not a clock. Slowing him down...' shows one line and its second line is struck through by the dashed footer line and J HOLD +1 MORE.
- Repro: Chapter IV, E open at the first menu, 1600x900 or 2000x1012.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/11-advisor.png; ffx2-bahamut-lose/11-advisor.png; audit/zz-contrast.tmp.mjs; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: medium
- Requirement: CHK-003; RUBRIC section 2
- Smallest fix: Clip at a line boundary, or put the consequence ('Slowing him slows it too') in the first visible line.
- Acceptance: No card line shown at under 3:1 and none cut mid-sentence in the collapsed state.
- Merged: R20-IF-04; capture owner: Intent card ALSO line is cut off under the footer at 2000x1012

**PR-0314** (feel; FFX-2 only): PR-0314 (carried, half fixed): the FFX-2 dressphere shot now holds 1.4-1.6 s where it plays, but it is absent in 5 of 10 captured changes (Leblanc at 2000x1012 "another actor is acting", Trema Paine, phone by design)

- Chapter / state: IV, VI, XIII, XVI
- Where: src/engine/fx/mix/heldShots.ts (sc minimum hold 1.6 s vs menu-open hand-back)
- Expected: When it fires, a held close shot of at least its 1.6 s minimum (D-316 spec), or no cut at all.
- Observed: Length fixed: 1.41-1.56 s (19b 0.48-0.57 s), no enemy action inside the shot and no menu during it in 10 of 10. Absent in 5 of 10: Of 10 captured changes, the shot played 5 times (1.41-1.56 s), skipped 5 times: Leblanc 1600x900 Yuna idle ('sc yuna skipped: another actor is acting'), Leblanc 2000x1012 Yuna idle and Rikku (same reason; the timeline shows only turn-start, spherechange, action-end, no enemy action), Paine at Trema 2000x1012 (strict gate), and Leblanc 390x844 touch (phone off by design). Both changes at Leblanc 2000x1012 got none.
- Repro: node critic/rounds/round-19/gapcap/sc.mjs <chapter> <size> 1
- Evidence: critic/rounds/round-20/evidence/gaps/sc-ffx2-leblanc-2000x1012-s1/run.json; critic/rounds/round-20/feel-narr/scsum.cjs; critic/rounds/round-20/evidence/gaps/sc-ffx2-leblanc-2000x1012-s1/run.json, sc-ffx2-trema-2000x1012-s1/run.json, sc-ffx2-leblanc-390x844-s1-touch/run.json
- Confidence: medium
- Requirement: D-316 DRESSPHERE SHOT; feel
- Smallest fix: Log which actor the gate sees at the decision frame and clear a stale actor flag when the turn-start has settled; do not widen the gate for a menu or an enemy action.
- Acceptance: Leblanc 2000x1012 seed 1, two changes: shot plays in both, enemyActionPlayedInsideShot [] and menuWhileSc false.
- Merged: R20-FEEL-02; V20-09

**PR-0320** (visual; FFX-2 only): PR-0320 (carried): the first-time Rikku coach line is still up over the girls' feet during the held dressphere shot (Ch XIII 2000x1012)

- Chapter / state: Ch XIII Trema
- Where: first CHANGE (Paine to Songstress), 2000x1012, seq-spherechange f02-f08
- Expected: The coach line hidden for the shot and back after it.
- Observed: While the shot label 'Paine Songstress' is up, the pink 'GAUGES RUNNING - A COMMAND HOLDS THEM' tag and the Rikku quote card sit across Paine's shins and feet. The builder's html.mix-held rule hides the coach but the disclosed evidence shows the rule, not the flow; in the natural run it does not hide it.
- Repro: FFX-2 Ch XIII seed 1: first CHANGE with the coach unseen; frames f02-f06.
- Evidence: critic/rounds/round-20/vis/trema-coach.jpg, critic/rounds/round-20/vis/trema-spc.jpg
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Apply the hide in the code path that raises the coach after the held shot starts (the coach registers its own listener after the shot's class is set).
- Acceptance: No coach-mark box intersects a girl's painted box in any frame of the shot in Ch IV, XIII at 1600x900 and 2000x1012.
- Round 20: The feel auditor saw the coach gone by the shot frame in another run; the visual auditor sees it in Trema f02-f08. Open until no frame shows it.

**PR-0334** (feel; FFX-2 only): PR-0334 (new, low confidence): the twirl-start key can read as a hard-edged white rectangle across the changing girl for 100-200 ms

- Chapter / state: Ch VI Leblanc, Ch XIII Trema
- Where: twirl-start key, 1600x900 and 2000x1012
- Expected: A soft-edged sphere flash, not a rectangular sprite.
- Observed: A hard-edged white rectangle with pink flecks stands where the changing girl was for about 100-200 ms (Leblanc c1-seq f10; Trema seq-spherechange f00).
- Repro: First CHANGE in Ch VI or Ch XIII.
- Evidence: critic/rounds/round-20/vis/sc2.jpg, critic/rounds/round-20/vis/trema-spc.jpg
- Confidence: high that it is seen; the artwork is approved, so the fix is in how the key is composed, not a repaint
- Requirement: RUBRIC feel: smooth transitions; approved art is not repainted
- Smallest fix: Feather or additively blend the twirl-start key's alpha edge in src/engine/fx/mix/twirl.ts (suspected).
- Acceptance: No rectangular edge visible in a 1:1 crop of every twirl-start frame.

**PR-0316** (visual; FFX-2 only): PR-0316 (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera

- Chapter / state: IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012
- Expected: The boss's face reads clearly in his signature framing.
- Observed: Re-observed, not re-measured: Bahamut's head is a bright blob at 1600x900 and 2000x1012.
- Repro: Candidate, seed 1, Ch IV, first menu.
- Evidence: critic/rounds/round-19b/visual/sheet-bahamut.jpg
- Confidence: medium
- Requirement: visual: recognisability, lighting
- Smallest fix: Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
- Acceptance: Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.
- Round 20: Re-observed at 2000x1012 (critic/rounds/round-20/vis/cmp-bah-first.jpg).

**PR-0333** (visual; FFX-2 only): PR-0333 (new): FFX-2 Bahamut at 390x844 has its head, neck and the top of its wings under the BAHAMUT ACTS NEXT intent strip

- Chapter / state: ffx2-bahamut (Ch IV), 390x844 touch, first menu
- Where: colossus master framing at the phone layout; the clearance field does not count the intent strip as a panel (suspected)
- Expected: The boss's head is whole between the intent strip and the party.
- Observed: Only wings and tail show; identical in round 19's candidate (so not an r36fix effect). The independent r36fix check of 2026-10-03 says live 35 shows the head whole; no live-35 phone frame exists in the critic's evidence (the gap pass did not capture it).
- Repro: Seed 1, Ch IV first menu at 390x844 touch.
- Evidence: critic/rounds/round-19b/evidence/gaps/fm-ffx2-bahamut-390x844/10-first-menu.png; critic/rounds/round-19b/visual/crop-bah-phone.png; critic/rounds/round-19b/audit/phone-bah-r19-r19b.png
- Confidence: medium; regression against live unknown
- Requirement: CHK-008; RUBRIC section 5 (accidental crop damage)
- Smallest fix: Count the intent strip in the clearance field on the phone, or fail the colossus master closed at 390 wide.
- Acceptance: Bahamut's head fully below the intent strip at 390x844 on three first menus, compared with a live-35 frame at the same seed.
- Round 20: Re-observed at 390x844 touch (critic/rounds/round-20/targets/sheets/s29.jpg).

**PR-0344** (visual; FFX-2 only): PR-0344 (new; V20-08, low-medium confidence): Ch IV Bahamut reads about 12 percent smaller at 2000x1012 than in 19b and a mirrored lantern glows at the left plate edge (plate wings, PR-0300)

- Chapter / state: Ch IV Bahamut
- Where: first menu, 2000x1012, seed 1
- Expected: The colossus master's scale (Bahamut 558 px) unchanged by the wings.
- Observed: Bahamut spans about 52 percent of the frame height against about 58 percent in round 19b's same-size frame; a bright orange lamp glow sits at the very left edge where 19b has none. Consistent with the PR-0300 plate wings mirroring a strip (the handoff discloses a doubled lantern in Ch IV) changing the plate fit; cause not traced.
- Repro: Ch IV 2000x1012 first menu, compare with critic/rounds/round-19b/evidence/ffx2-bahamut-win/11-advisor.png.
- Evidence: critic/rounds/round-20/vis/cmp-bah-first.jpg
- Confidence: low-medium (eyeball measure from two frames; not a plate-gate measurement)
- Requirement: RUBRIC visual and camera; disclosure in docs/handoff/release-37.md (scenes)
- Smallest fix: Measure the framing report for Ch IV at five aspects on this build and compare with 19b's; if the master shrank, hold it with the wings.
- Acceptance: Bahamut boss height at 2000x1012 within 3 percent of live 36.

**PR-0347** (feel; FFX-2 only): PR-0347 (new; R20-FEEL-03): at the Den of Woe link-2 seam the camera pushes Yuna out of the left edge by 2.5 s (also in 19b)

- Chapter / state: Ch XV Den of Woe, link 1 to 2 seam, 1600x900
- Expected: Camera keeps all three girls in frame or cuts away deliberately.
- Observed: seq-seam-2: frames f03-f05 hold the whole party; by f06 (2.18 s) Yuna is at the left edge and by f07 (2.51 s) only her staff and a sliver show while the Gippal line card is up. Same composition in round 19b f07 and in the r19route run, so it is not a regression.
- Repro: Route harness ffx2-den-of-woe seed 1, link 1 won, watch the seam to link 2; frames critic/rounds/round-20/evidence/ffx2-den-of-woe-win/seq-seam-2/f06.jpg and f07.jpg
- Evidence: critic/rounds/round-20/feel-narr/seam-den2.jpg; critic/rounds/round-20/feel-narr/seam-den19.jpg
- Confidence: medium
- Requirement: RUBRIC 6: coherent camera
- Smallest fix: Clamp the seam camera's end pose on the party's leftmost member for this chapter.
- Acceptance: Den link-2 seam at 1600x900 and 2000x1012: all three girls fully visible at every frame through the first menu.

**PR-0346** (feel; both): PR-0346 (new; R20-FEEL-01, low confidence): under a loaded host the chapter card stays up 3-4 s into the transition after a hurried scene entry

- Chapter / state: FFX Ch I, III; FFX-2 Ch IV, XIII, XV (observed slow); most other chapters show the fast path
- Where: src/ui/common/transitions/openingHurry.ts (suspected, not traced)
- Expected: Card 0.7 s after a hurried scene and first menu in about 3.2-4.8 s (docs/handoff/r37-scenes.md), at least on a single lane.
- Observed: The hurried entry (PR-0061) gives 3.4-5.2 s to first menu in 23 of 28 runs. In five runs the full chapter card is still on screen 2.75-4.08 s into the hand-over sequence (Flux win f09 at 2950 ms, Braska 3303 ms, Trema 4084 ms then gone at 4533, Bahamut lose 3777 ms, Den first run 2749 ms) and first menu was 5.4, 7.4, 6.3, 4.7 (lose) and 16.9 s. All five started in the first parallel burst (lanes A, B, C, D at 17:37:25Z) or the Den lane with 3 other lanes active; the Den first run alone cost 31 s wall against 19-20 s for the rest.
- Repro: Route harness, fresh profile, hold Enter through the pre-scene, then watch seq-transition-into-battle. Seed 1. Compare critic/rounds/round-20/feel-narr/trprof.py output (luminance 163-175 = card) for seymour-flux-win, braskas-final-aeon-win, ffx2-trema-win, ffx2-bahamut-lose against the fast runs.
- Evidence: critic/rounds/round-20/feel-narr/trprof.py; critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-20/evidence/seymour-flux-win/seq-transition-into-battle/f09.jpg
- Confidence: low (host load vs load-time wait not separated; no single-lane retime)
- Requirement: RUBRIC 4 and 9: a resource-contention timeout is investigated before it is called a game defect; PR-0061 closure needs the claim measured
- Smallest fix: Re-run Flux, Braska, Trema and Bahamut entry alone on one lane and log when the card is dismissed and what it waits on; if it waits on the battle load, nothing to change, otherwise cap the hurried card at 0.7 s.
- Acceptance: Single-lane entry for the four runs: card gone and first menu under 5.5 s in all four, 3 repeats.

**PR-0301** (feel; FFX-2 only): PR-0301 (new; R18B-GAP2-05): FFX-2 chain seams hand control back about 2.5-3 s later than live 32, because the battle-start moment now runs 2.9-3.1 s instead of 0.6-0.75 s

- Chapter / state: Ch VI Leblanc link 2, Ch XV Den link 2
- Where: not traced; suspected: the slide-in that the PR-0281 fix now lets finish, or the steady pacing / calm camera defaults of the release-33 line
- Expected: Control returns in about 0.6-0.75 s as at live 32.
- Observed: Leblanc seam 2 (1600x900): eight frames to 2.53 s show the push-in and a Logos plate but no command menu; Den seam 2 the same to 2.51 s. First-menu stills exist but no hand-back time was logged.
- Repro: Route harness, read seq-seam-2 of ffx2-leblanc-win-r2 and ffx2-den-of-woe-win.
- Evidence: critic/rounds/round-20/feel-narr/seam-leb.jpg
- Confidence: medium
- Requirement: RUBRIC 6: respectful transitions and dead waiting
- Smallest fix: Per the existing PR-0301 ticket: shorten the seam's battle-start moment for FFX-2.
- Acceptance: Seam to menu-up under 1.5 s on Leblanc and Den.

**PR-0104** (feel; FFX-2 only): PR-0104 (carried, 5th review, STALLED): in Wait a confirmed FFX-2 Shell shows only a cast pose, no name chip, menu back at about 2.6 s

- Chapter / state: Ch IV Bahamut, 2000x1012
- Expected: An action name chip like the other support casts.
- Observed: seq-party-action frames f00-f08 show Yuna's raised-staff cast and no Shell name chip; the command menu returns only at f09 (2.6 s).
- Repro: ffx2-bahamut-win seq-party-action (Shell).
- Evidence: critic/rounds/round-20/feel-narr/shell-bah.jpg
- Confidence: medium
- Requirement: RUBRIC 6: readable effects
- Smallest fix: Show the name chip for a confirmed support command in Wait.
- Acceptance: Shell in Wait at Ch IV shows a named chip before the menu returns.

**PR-0324** (interface; FFX only): PR-0324 (carried, half fixed): Ronso Rage no longer called timed in code (live card not captured); Yuna's Grand Summon is still called a "Timed input"

- Chapter / state: XIV Isaaru, first menu, 1600x900 seed 1
- Where: src/engine/tactics/advisor.ts:653 (the fix excludes only kimahri-rage); src/battle/ffx/overdrive.ts timerMsFor returns 0 for yuna-grand-summon
- Expected: No 'Timed input' on an untimed picker (project data: no timed input; a picker only).
- Observed: 'Yuna Grand Summon GUIDE'S PICK IN OVERDRIVE NO MP Timed input Yuna's gauge is full...'. The Ronso Rage half is fixed in the code of release 37 (not captured on a live card this round).
- Repro: Real keys to Chapter XIV, first menu, read the advisor card.
- Evidence: critic/rounds/round-20/evidence/isaaru-via-purifico-win/run.json advisorText
- Confidence: high
- Requirement: RUBRIC section 2; AGENTS.md rule 6
- Smallest fix: Add the phrase only when timerMsFor(def) is above 0 (Swordplay, Bushido, Lady Luck reels keep it).
- Acceptance: No 'Timed input' on Ronso Rage, Grand Summon or Mix rows; Bushido and reels keep it.

**PR-0356** (interface; both): PR-0356 (new; R20-IF-03, medium-low confidence): pause section labels read at about 2.1-2.8:1 contrast

- Chapter / state: pause: member tab, OPTIONS, phone header; 1600x900, 2000x1012, 390x844
- Where: src/ui/common/pause-screen.css label colour tokens (not traced)
- Expected: Text a player must read at 3:1 or better (the PR-0322 repair uses 3:1 for dimmed state text).
- Observed: Pixel estimates: BATTLE STATS 2.5:1, THIS ENCOUNTER 2.8:1, ABOUT 2.4:1 (1600x900 and 2000x1012), phone PYREFLY REPRISE header 2.1:1 and IN THIS FIGHT 2.2:1. The values and row labels beside them read at 11 to 14:1. Estimates over a busy painting, so the figure is approximate.
- Repro: Open the pause on Ch I or Ch IV; run critic/rounds/round-20/audit/zz-contrast.tmp.mjs.
- Evidence: critic/rounds/round-20/audit/zz-contrast.tmp.mjs; feat/ffx2-bahamut-pause-living-2000x1012/p05.png; seymour-flux-win/14-pause-options.png
- Confidence: medium-low
- Requirement: CHK-003
- Smallest fix: Lift the section-label token to 3:1 against the darkest and lightest part of the plate it sits on.
- Acceptance: Section labels at 3:1 or better on every plate at 1600x900 and 390x844.

**PR-0237** (interface; FFX-2 only): PR-0237 (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- Chapter / state: IV Bahamut, first menu, 390x844 touch
- Where: coach placement on the phone (src/ui/coach, not traced)
- Expected: The coach sits below the intent strip.
- Observed: The pink tag 'GAUGES RUNNING - A COMMAND HOLDS THEM' overprints the strip's third line, leaving 'PAINE 115-' and hiding '130'. The FFX phone coach (Ch I) is clear of the strip.
- Repro: Fresh profile, Chapter IV, 390x844 touch, first menu.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win-phone-touch/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Place the phone coach under the intent strip.
- Acceptance: 0 px2 between the coach and the intent strip at 390x844 in Ch IV, V, VI.

**PR-0248** (visual; FFX only): PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- Chapter / state: VII Seymour and Anima, single-target step, 2000x1012
- Where: Sensor card placement
- Expected: No panel over a painted figure the player may target next.
- Observed: The 'Guado Guardian A HP ???' Sensor card covers Guardian B's torso and robe while Guardian A is targeted.
- Repro: Chapter VII, Attack, step to Guado Guardian A.
- Evidence: critic/rounds/round-20/evidence/seymour-anima-macalania-win/16-target-single.png
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Add the projected enemy quads to the Sensor card's placement test.
- Acceptance: Sensor card clear of every enemy box except the target in Ch VII, X, XII.

**PR-0289** (onboarding; both): PR-0289 (new, first run O2): step 1 says 'Start with the first one' while the spot sits on another selected chapter

- Chapter / state: chapter select, first run, 2000x1012 and 390x844
- Where: first-run guide card (src/ui/coach/firstRunGuide.ts, not re-traced)
- Expected: Step 1's words match the highlighted chapter, or the highlight starts on Chapter I.
- Observed: With Chapter IV Bahamut selected the card still reads 'Start with the first one. Click its picture to begin.' and covers the VII-XII rows (desktop) and the I-VI rows (phone, 'Tap its picture').
- Repro: Fresh profile, move down to Bahamut on the board.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/03-card.png; ffx2-bahamut-win-phone-touch/03-card.png
- Confidence: high
- Requirement: RUBRIC section 6 (onboarding that teaches); CHK-008
- Smallest fix: Say 'Start here' for the selected chapter, or keep the card off the list.
- Acceptance: Step 1 copy true for every selected chapter; card clear of the list rows.
- Merged: R18-ON-03; R18-VIS-02

**PR-0032** (onboarding; both): PR-0032 (carried, weight up): no REDUCE FLASHES row and no key remapping, while the new default look adds ink impact frames and lens flares; the soft-flash path exists but reads a setting no row writes

- Chapter / state: pause > OPTIONS, both games
- Where: src/app/fxEnv.ts still reads a reduceFlashes flag no row writes
- Expected: A flash accommodation and input remap in OPTIONS (accessibility target).
- Observed: The live OPTIONS rows (FFX Ch I, FFX-2 Ch IV, FFX-2 phone) are MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE, REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP (plus X-2 BATTLE and ATB SPEED); no flash row, no remap row; the default look adds impact frames and lens flares.
- Repro: Esc, OPTIONS tab in any chapter.
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win/run.json pause.optionsText; critic/rounds/round-20/evidence/seymour-flux-win/14-pause-options.png
- Confidence: high
- Requirement: RUBRIC section 6 (motion and flash accommodations, input access)
- Smallest fix: Add a REDUCE FLASHES row that writes the existing fxEnv flag; list remapping as a question for Bailey.
- Acceptance: OPTIONS shows REDUCE FLASHES and toggling it removes impact frames and flares in a fight.

**PR-0259** (delivery; both): PR-0259 / PR-0240 (carried, third review without a measurement; a method check is due): no single-lane frame-time or load measurement for this build

- Chapter / state: all; new per-frame work in the pause (living portrait canvases), 8 more rooms with drift-driven plate defocus, plate wings, and about 5 MB of twirl keys at battle start (desktop full tier)
- Where: capture method (4 to 5 parallel lanes on one host)
- Expected: 60 fps at 1600x900 and a load under five seconds on named hardware, browser, network and cache, with frame-time spikes and first-ability stalls reported.
- Observed: logs/lanes.log shows lanes A to E running at once; no timing was recorded and none would be creditable. 19b's cold 10 Mbit entry (52.0 s) was on a 577 MB build; the build is now 798,329,071 bytes, 1,670,929 under the 800,000,000 line, with about 33 MB of adopted art waiting (D-332).
- Repro: one browser lane, nothing else running, named GPU and CPU: Chapter I and IV 1600x900 cold cache unthrottled and at 10 Mbit/s 40 ms; 60 s frame-time windows in Flux, Bahamut (with a dressphere change), Via Purifico or Zanarkand (defocus rooms) and in the pause with a living portrait.
- Evidence: critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-19b.json PR-0259, PR-0240
- Confidence: high that the evidence is missing
- Requirement: RUBRIC sections 2 and 6; CHK-017 load clause
- Smallest fix: Method check: the current route (shared host, parallel lanes) cannot produce timing, so make the performance run its own serial slot with a fixed protocol, and record p50, p95, p99 and spikes over 50 ms.
- Acceptance: A report with named hardware and the figures above for cd9dbbb0.
- Merged: prep-delivery R19B-PD-01

**FOC37-01** (interface; FFX-2 only (Lady Luck minigame)): FOC37-01 (carried from the focused review, downgraded major -> polish): the Lady Luck reel overlay is covered by the guide card; unreachable by players (PR-0340) and not reproduced live

- Chapter / state: not driven in round 20
- Where: minigame overlay z-order under the guide card at top left (not traced)
- Expected: The overlay sits above the guide card, or the guide hides while a minigame is open.
- Observed: Reported by the focused review's Lady Luck lane ('reel 1 and the DUD warning half hidden'); not re-reproduced by that review and not exercised in round 20 (no Lady Luck fight was driven).
- Repro: Open the Lady Luck reel overlay with the guide card on.
- Evidence: critic/reviews/cd9dbbb08-focused.json FOC37-01
- Confidence: unverified
- Requirement: CHK-006, CHK-008
- Smallest fix: Raise the overlay above the guide or hide the guide during a minigame.
- Acceptance: Reel 1 and the DUD warning fully visible with the guide on, 1600x900 and 390x844.
- Severity change: No player can open the overlay on any shipped grid (PR-0340, gap pass); not re-reproduced by the focused review or this round. Becomes major again the moment Lady Luck is made reachable.

**PR-0349** (combat; ffx2): PR-0349 (new; R20-CE-01, medium confidence): a human's reel stop is a uniform random draw, so about 74 percent of spins are a Dud and the player cannot aim; the handoff says "9 in 10"

- Chapter / state: ffx2-vegnagun-shuyin (Ch V) and Via Infinito builds, Yuna in Lady Luck, Attack Reels and Magic Reels
- Where: src/ui/ffx2/LadyLuckReels.ts:126 (stops[reelIndex] = symbols[floor(rng() * symbols.length)]); engine pay table src/data/ffx2/reels.ts
- Expected: ffx2-combat-core 3.12: the slots begin spinning in a random order and the player presses once per reel; the same note says the reels can be lined up by timing, so a press selects a visible symbol.
- Observed: The overlay draws each stop at random at the press (no spinning strip is rendered, cells show a fixed symbol until stopped), so a press has no skill. With 6 symbols a reel the table pays on 56 of 216 stops (26 percent) and Duds on 160 (74 percent); 120 unattended spins per set measured 94 Duds (78 percent). The builder's handoff says 'about 9 in 10 a Dud' for a blind roll, which does not match the measurement. A Dud takes about 75 percent of current HP off the whole party, so the new reel row is a gamble with a negative expected value. Not seen in a browser.
- Repro: critic/rounds/round-20/combat/r20-probes.test.ts ('unattended spins') for the rate; read LadyLuckReels.ts:118-130 for the draw. Real-key repro owed (capturesNeeded 1).
- Evidence: critic/rounds/round-20/combat/r20-probes.json (payTable, unattended)
- Confidence: medium
- Requirement: ffx2-combat-core 3.12; RUBRIC combat/feel
- Smallest fix: Question for Bailey, not a build request: should the overlay animate the strip so the stop symbol follows press timing (the sourced skill), or stay a pure chance roll as shipped? Either way correct the handoff's '9 in 10'.
- Acceptance: With a real-key run, two presses at different moments on the same seed stop on different symbols; or the handoff states the 74 percent figure.

**PR-0350** (combat; ffx2): PR-0350 (new; R20-CE-03, low confidence, suspected): the new immune-status miss event can pop twice for a two-status move and counts as "targeted" for the Fallen Aeons counter

- Chapter / state: Via Infinito (Bully Ghiki), ffx2-road-* (Fallen Aeons)
- Where: src/battle/ffx2/resolve-targets.ts:65-72 (one miss event per immune status application when formula is none); src/battle/ffx2/engineHooks.ts:177 (a miss from the actor counts as hostile aim)
- Expected: One 'IMMUNE' answer per target per action; an action that did nothing should not raise an enemy's attacked counter unless the source says so (ffx2-fallen-aeons: 'attacked' vs 'receives damage' is a recorded conflict, FA8).
- Observed: Traced, not seen live: Bully Ghiki (action-cancel + delay-effect) on a target immune to both emits two miss events; Trainer abilities with several statuses likewise. attackedHooks (ai/fallen-aeons.ts) adds +5 action count on onTargeted, now reachable by a status-only move against an immune aeon. Measured effect is nil: Fallen Aeons intended and wrong lines, 120 seeds each, have identical event-log digests on c69de96a and cd9dbbb0 (no such event occurs on those lines).
- Repro: Read the cited lines; A/B ab-cand.json vs ab-base.json for the null measurement.
- Evidence: critic/rounds/round-20/combat/ab-cand.json, ab-base.json, r20-probes2.json (the 11 formula-none abilities with 2 or more statuses)
- Confidence: low
- Requirement: RUBRIC combat; AGENTS.md rule 14 (FFX-2 only, correctly scoped)
- Smallest fix: Emit one immune miss per target per action; decide with a source whether an immune status-only move counts as 'attacked' for the aeons.
- Acceptance: A Bully Ghiki on an immune boss shows one IMMUNE numeral in a real-key run; the Fallen Aeons digests stay identical.

**PR-0351** (combat; ffx2): PR-0351 (new; R20-CE-04, low confidence): the Trigger Happy damage forecast floors at 6 hits while a human who presses fewer times now deals fewer

- Chapter / state: Gunner builds, Ch IV and Ch V
- Where: src/battle/ffx2/minigames.ts:31 (rollTriggerHappy = int(6,16)) used by simulate.ts expectedMinigameHits
- Expected: A printed range should span what a player can do (0 to 16 presses, sec 3.1) now that the human count is honoured.
- Observed: Measured in the engine: hits 3 gives 3 damage events, 12 gives 12, 16 gives 16, an unattended spin 14 (critic/rounds/round-20/combat/r20-probes.json triggerHappy). On c69de96a every use resolved as the engine's own roll whatever the player pressed. The forecast 'min' stays at 6. Not seen in the UI; I did not find a shipped row that lists it.
- Repro: r20-probes.test.ts 'Trigger Happy' block.
- Evidence: critic/rounds/round-20/combat/r20-probes.json
- Confidence: low
- Requirement: ffx2-combat-core 1.7, 3.1
- Smallest fix: Label the forecast as the headless roll or widen it to 0 to 16; no change to the faithful press-count rule, which I do not recommend touching.
- Acceptance: A Gunner row's preview text matches the real-key spread of hits.

**PR-0279** (encounter; ffx): PR-0279 (carried, a question for Bailey): Sin's difficulty is still undecided (D-282); nothing in the engine changed, so the r17 figures stand

- Chapter / state: sin-fins-core (Ch XVII), sin-face (Ch XVIII)
- Where: docs/target/decisions.json D-282
- Expected: Bailey's call on how hard the two Sin races should be.
- Observed: Ch XVIII bench rows byte-identical to round 19b (intended 12/40, advisor 15/40; large-seed 7 | 13). Ch XVII card chain 48.5 percent on 200 seeds (see PR-0269); the sensible bench line 25.5 percent. Real-key wins this round: XVII 252 turns, XVIII 64 turns.
- Repro: ffx-three-line-r20.json, sin-ab-cand.json
- Evidence: critic/rounds/round-20/combat/ffx-three-line-r20.json, sin-ab-cand.json
- Confidence: high
- Requirement: RUBRIC encounter; AGENTS.md rule 10
- Smallest fix: Decision, not a build.
- Acceptance: D-282 moves out of 'proposed'.

**PR-0257** (encounter; ffx): PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows (208 real-key turns this round, the same as round 17)

- Chapter / state: braskas-final-aeon (Ch III)
- Where: data/ffx/enemies/braskas-final-aeon.ts chain of 7 links
- Expected: The sourced aeon rows.
- Observed: Real-key win this round in 204 turns (24.9 min); round 19b 208. Replay of the live log is event-for-event identical on the engine (125 commands), so the length is the encounter data, not the presenter.
- Repro: critic/rounds/round-20/combat/ffx-replay.json row braskas-final-aeon-win.
- Evidence: critic/rounds/round-20/evidence/braskas-final-aeon-win/run.json, combat/ffx-replay.json
- Confidence: high
- Requirement: RUBRIC encounter
- Smallest fix: Unchanged: a question for Bailey whether the length is intended.
- Acceptance: Bailey's answer recorded.

**PR-0255** (narrative; FFX): PR-0255 (carried): Tromell's five aftermath lines in Chapter VII still have no speaker

- Chapter / state: VII aftermath (CONFIRM scene)
- Expected: The speaker 'Tromell' with a name plate.
- Observed: Re-observed in 19b: "Step away from Lord Seymour, Lady Summoner." and four more have speaker "" (388402-388551 ms).
- Repro: Ch VII win, CONFIRM on results.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: high
- Requirement: narrative: character voice
- Smallest fix: Add a 'tromell' speaker with a name plate and no portrait (like 'brother'), and move the lines to it.
- Acceptance: The dboxTimeline shows speaker 'Tromell' on the five lines.
- Round 20: Macalania run lines 42-48 ('Step away from Lord Seymour, Lady Summoner.' to 'Traitors, all of you. It will be announced.') speaker ''; Ixion r3: '(Whistle)' x4 with 'A small gold light answers.' and no mote in frames; Sin Fins: 'The Fahrenheit's cannon tears the fin away.' at 313585 ms and 637490 ms as a '' caption.

**PR-0256** (feel; FFX-2): PR-0256 (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- Chapter / state: XVI aftermath, whistles 1 to 4
- Expected: A visible light, nearer on each whistle.
- Observed: Re-observed in the 19b dboxTimeline at 429802-430000 ms; hold-skipped, so no plate frames.
- Repro: Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: medium
- Requirement: feel/narrative: shown, not told
- Smallest fix: A small gold mote fx step per whistle.
- Acceptance: A timed capture after each whistle shows the light, nearer each time.
- Round 20: Re-observed: Ixion whistles are captions with no mote shown in frames.

**PR-0272** (narrative; FFX): PR-0272 (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- Chapter / state: XVII sin-fins-core, seam 1 -> 2
- Expected: A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- Observed: "The Fahrenheit's cannon tears the fin away." at 679391 ms and 1774765 ms with no hit shown.
- Repro: Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: high
- Requirement: narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- Smallest fix: Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- Acceptance: A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- Round 20: Re-observed: the Fahrenheit cannon is still only a caption (313585 ms and 637490 ms).

**PR-0263** (audio; both): PR-0263 (carried, downgraded major -> polish; friends' "no attack SFX"): the fix is delivered by D-293 (SFX b, bus 0.70 in 185/185 samples; a hit's true peak now ~1.5 dB under the music's, was ~7.5 dB) but no ear has confirmed it

- Chapter / state: all battles
- Where: src/engine/BattlePresenterBeats.ts, BattlePresenterEvents.ts; sfxMix
- Expected: An owner or playtester ear note that attack SFX are audible at default settings.
- Observed: sfxMix {b, trim 1, bus 0.70} in 193 of 193 samples this round. A hit's true peak sits about 1.5 dB under the music's by estimate (round 17 numbers, sprite sha-identical); measured, not heard.
- Repro: Default profile, any chapter: land an attack and a miss; read the audio debug sfxMix.
- Evidence: critic/rounds/round-20/audio/routing.json; critic/rounds/round-17/audio-r17-sfx-vs-music.json (reused, sprite sha-identical)
- Confidence: medium
- Requirement: D-293; CHK-B1
- Smallest fix: Ask Bailey or the friends to confirm by ear; if the miss still disappears consider the miss cue's own volume.
- Acceptance: An ear note says the attack SFX are audible at default settings.

**PR-0220** (audio; both): PR-0220 (carried, downgraded major -> polish): an emulated pad-only run now unlocks audio on the first pad A (title, chapter-select, boss-seymour), but headless Chromium already had user activation, so a real Chrome with a real controller is not proven

- Chapter / state: all
- Where: src/audio/AudioManager.ts unlock path
- Expected: The first gamepad button unlocks the AudioContext and the title or chapter-select music starts.
- Observed: Not re-run. Round 18's emulated pad-only run unlocked audio on the first pad A, but headless Chromium already had user activation. The unlock code is untouched by release 37 (the +30 lines add playSfxFromSprite only).
- Repro: Fresh profile, press only gamepad buttons from the title into a battle; read the audio debug ready and playing.
- Evidence: critic/rounds/round-18/evidence/gaps/pad-only-seymour-flux-1600x900/run.json (reused)
- Confidence: low (unknown)
- Requirement: RUBRIC s2 platform goals (gamepad); CHK-023
- Smallest fix: Add one emulated-gamepad run asserting ready and a playing cue, with navigator.userActivation provably false before the press, or test on a real controller.
- Acceptance: A real controller on real Chrome reaches the title cue on the first pad button.

**PR-0039** (audio; both): PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- Chapter / state: I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- Expected: Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- Observed: themes-audit fails scene-gagazet, scene-dreams-end and scene-farplane, the same as round 17. Note: scene-farplane measures E minor against the map's E major.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Smallest fix: Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- Acceptance: themes-audit reports 0 departures for these cues.
- Round 20: themes-audit FAIL scene-gagazet, scene-dreams-end, scene-farplane (no tempo map on a lyrical cue; farplane measures E minor against the map's E major) and scene-macalania-temple (not in the bible's map). docs/audio is unchanged since 19b, so the XVII and XVIII rows still sit after the 'Owed cues' heading outside the table.

**PR-0260** (audio; ffx): PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- Chapter / state: VII
- Expected: Every shipped cue has a row in the bible's cue map.
- Observed: FAIL scene-macalania-temple: the cue is not in the bible's cue map.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Smallest fix: Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- Acceptance: themes-audit shows ok for scene-macalania-temple.
- Round 20: Carried; see PR-0039 note.

**PR-0278** (audio; both): PR-0278 (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- Chapter / state: docs
- Expected: One contiguous table of rows I to XVIII.
- Observed: Line 656 is '| ## Owed cues for chapters not yet listed'. Rows XVII and XVIII sit at lines 667 and 668, after a stray separator at line 666, outside the table. themes-audit still reads 18 of 18.
- Repro: Open D:/pyrefly-rel26c/docs/audio/THEMES.md at lines 638 to 668.
- Evidence: docs/audio/THEMES.md:656,666-668
- Confidence: high
- Requirement: docs hygiene
- Smallest fix: Move the XVII and XVIII rows up under XVI, and put a blank line before the '## Owed cues' heading.
- Acceptance: The rendered markdown shows one table of 18 rows, and themes-audit still passes.
- Round 20: Carried; see PR-0039 note.

**PR-0298** (audio; both): PR-0298 (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- Chapter / state: all
- Expected: D-292 as worded: the music grows from about 39 MB to about 73 MB.
- Observed: The music is 78.2 MB and the total 80.93 MB (qa). The AUDIO_BUDGET_BYTES constant went from 60 to 85 MB, and the D-292 note in manifest-io.mjs documents the gap. Each chapter's music download roughly doubled; for example III requests 12.7 MB of music, up from 6.5. Any effect on slow-link loading is the delivery category's call (PR-0240) and is not scored here. NOW.md already lists 'music 78 MB ok?' as open for Bailey.
- Repro: node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- Confidence: high
- Requirement: RUBRIC s7 (a pick approves what Bailey named)
- Smallest fix: Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- Acceptance: decisions.json records Bailey's answer on the 78 MB size.
- Round 20: qa: total shipped audio 88.49 MB of 90 MB; music about 78 MB. saveSfxBalance.ts is unchanged since 19b, so the rule's behaviour stands (28 of 28 cases in the older matrix).

**PR-0251** (interface; both): PR-0251 (carried, widened): HUD text floor is 12.25 px at 1600x900 (11.68 px for the FFX-2 command-info label) and 13.1-13.8 px at 2000x1012; 9.3-9.8 px at 1280x960 (round 19)

- Chapter / state: Ch I and Ch IV battle HUD; pause OPTIONS on a phone
- Expected: Zero text a player must read under 14 px effective at the CHK-002 viewports.
- Observed: fm run measures: 1600x900 minPx 12.25 (Yojimbo 12.22, FFX-2 Bahamut 11.68 on the "White Magic" ffx2-cmd-info__label), 2000x1012 13.13-13.77, 14 at 1920x1080, 2560x1080, 2560x1440. Live 35 Yojimbo at 1600x900 is 12.22, so not a regression.
- Repro: node critic/rounds/round-17/cap/gaps/sweep.mjs <chapter> <WxH> [touch]
- Evidence: critic/rounds/round-19b/evidence/gaps/fm-*/run.json
- Confidence: high
- Requirement: CHK-003; PR-0251 acceptance (text part)
- Smallest fix: Floor the stage-scaled HUD labels at 14 px effective (CTB names, badges, OD, FFX-2 job and max-HP spans), and raise the phone pause .pause__k / .pause__v / .pause__tab to 14 px.
- Acceptance: sweep.mjs reports under14 = 0 for the battle HUD at 1600x900, 1280x960 and 390x844, and for every pause tab at 390x844.
- Round 20: Carried, not re-observed in round 20; release 37 changed panel geometry (clearance, MaxMix, framing), so not confirmed either way.

**PR-0321** (interface; both): PR-0321 (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor

- Chapter / state: any (pause > OPTIONS > EYE CANDY) at 390x844
- Where: src/ui/common/pause-screen.css:824-825 (--pu-fs:12px; --pu-fs-v:13px, an authored phone exception)
- Expected: CHK-003: no player text under 14 css px at 390x844.
- Observed: 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
- Repro: 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
- Evidence: critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
- Confidence: high
- Requirement: CHK-003
- Smallest fix: Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
- Acceptance: ecfont at 390x844 in both games: under14 empty, no clipping.
- Round 20: Carried, not re-observed in round 20; release 37 changed panel geometry (clearance, MaxMix, framing), so not confirmed either way.

**PR-0249** (interface; FFX-2): PR-0249 (carried, re-observed by the chief): the FFX-2 intent card covers the girls at 1600x900; at the whole-party Shell target in Ch IV it stands over Rikku and Paine

- Chapter / state: IV Bahamut
- Expected: No panel over a face or a weapon.
- Observed: tgt-ffx2-bahamut-1600x900-shell/target.png (c69de96a, seed 1, real keys): the BAHAMUT ACTS NEXT card (x about 490-865, y about 185-500) covers Rikku and Paine almost to the feet while the target brackets frame them; Yuna stays clear. Under the colossus master the girls stand further back than in round 18b's frame, so the overlap reads larger; whether it differs from live 35 at this state is not captured.
- Repro: Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- Evidence: critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png
- Confidence: high for the observation; unknown against live
- Requirement: CHK-008
- Smallest fix: Add the projected party quads to the intent card's placement test while targeting.
- Acceptance: Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- Round 20: Carried, not re-observed in round 20; release 37 changed panel geometry (clearance, MaxMix, framing), so not confirmed either way.

**FOC28-P02** (interface; FFX): FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- Chapter / state: II and XIV Grand Summon picker, 390x844
- Expected: Legible and not clipped.
- Observed: Recorded by the focused review of this same build and still open.
- Repro: See critic/reviews/6ea8528f-focused.md.
- Evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
- Confidence: high
- Requirement: CHK-003
- Smallest fix: As proposed in the focused report.
- Acceptance: As proposed in the focused report.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0223** (delivery; FF7 (hidden experiment)): PR-0223 (carried): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- Chapter / state: FF7 Guard Scorpion
- Where: pause in the FF7 fight
- Expected: 0 requests >= 400 on the FF7 pause.
- Observed: Not captured in round 17. No FF7 file changed in this candidate.
- Repro: FF7 door, then battle, then Esc; record the network log.
- Evidence: absent; builder claim only (docs/handoff/r29-load.md)
- Confidence: low
- Requirement: CHK-017 / CHK-018
- Smallest fix: None until observed.
- Acceptance: FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0239** (interface; FFX-2 (the rail is shared)): PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- Chapter / state: XI Fallen Aeons, Rikku's Mega-Potion charging
- Expected: The two panels do not contradict each other about the same turn.
- Observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- Repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- Evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- Confidence: high
- Requirement: Interface: useful advice
- Smallest fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- Acceptance: In the same case, the rail and the card agree or the rail defers.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0246** (interface; FFX): PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- Chapter / state: Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- Expected: The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- Observed: 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- Repro: node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- Confidence: high
- Requirement: PR-0246 acceptance; CHK-009
- Smallest fix: Wrap the label to two lines, or drop the verb when the name is long.
- Acceptance: The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0247** (visual; FFX): PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- Chapter / state: VII, battle, Anima's arrival at 390x844 touch
- Expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- Observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- Repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- Confidence: high
- Requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- Smallest fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- Acceptance: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0250** (interface; FFX): PR-0250 (carried, confirmed): the phone results location caption is clipped

- Chapter / state: Ch XII
- Where: 390x844 results
- Expected: The full caption.
- Observed: 'INSIDE SIN — THE GARDEN C…'
- Repro: Lose or win Ch XII at 390x844.
- Evidence: round-18/evidence/seymour-omnis-win-touch/31-results.png
- Confidence: high
- Requirement: CHK-009
- Smallest fix: As in round 17.
- Acceptance: The caption's scrollHeight <= clientHeight + 1 at 390x844.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0252** (interface; FFX): PR-0252 (carried): the first-turn coach card overlaps the selected command row

- Chapter / state: X Seymour Natus at 2000x1012 (2560x1080 not captured)
- Expected: Coach clear of the command stack.
- Observed: Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- Repro: Fresh profile, 2000x1012, Ch X first menu.
- Evidence: critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Add the command stack to coachActorAvoid's rects at wide sizes.
- Acceptance: 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0254** (narrative; FFX): PR-0254 (carried, STALLED): Chapter VII Talk is still silent

- Chapter / state: VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- Expected: A Tidus line and Seymour's reply within 3 s of each Talk.
- Observed: The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- Repro: Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- Confidence: high
- Requirement: narrative: banter and reachable character voice
- Smallest fix: Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- Acceptance: The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0271** (visual; FFX only): PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- Chapter / state: XVIII Sin: the Face
- Where: Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- Expected: No HUD panel over a face, including during camera moves (CHK-008).
- Observed: When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- Repro: Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- Evidence: critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- Confidence: medium (observed; no live action-frame evidence to compare)
- Requirement: CHK-008
- Smallest fix: Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- Acceptance: XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0273** (combat; FFX): PR-0273 (new; gap pass): Ch XVII link 3 (on Sin's back) still lists disabled PULL BACK and CLOSE IN rows at the top of the command menu

- Chapter / state: Ch XVII sin-fins-core, link 3 (Sinspawn Genais + Sin's Core), every party menu
- Where: engine emits disabled 'pull-back'/'close-in' triggers in link 3 (in-process probe combat/gaplink3-out.json); AirshipOrders folds orders only when airship.range is set (src/ui/ffx/AirshipOrders.ts:137); file of the trigger source not traced
- Expected: research/ffx-sin.md §1 table, link 3: 'on Sin's back (the party jumps from the ship) ... no Trigger Command'. No order rows in link 3.
- Observed: In link 3 the menu reads PULL BACK / CLOSE IN / ATTACK / SPECIAL / WHITE MAGIC / ITEMS, and the engine marks both orders disabled. The stage also still shows the Fahrenheit deck.
- Repro: Real-key win seed 1 (gaproute.mjs sin-fins-core, POLICY=xvii): the first link-3 menu.
- Evidence: critic/rounds/round-19b/combat/link3-rows.json
- Confidence: high
- Requirement: research/ffx-sin.md §1 (link 3 has no Trigger Command); CHK-004
- Smallest fix: Drop the airship trigger commands from link 3's formation or triggers, or hide disabled trigger rows when no range state exists.
- Acceptance: The first link-3 menu lists no PULL BACK or CLOSE IN row, and in-process the link-3 decision carries no trigger commands.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0276** (interface; FFX-2): PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- Chapter / state: IV Bahamut
- Expected: Header visible, or scrolling inside the rows only.
- Observed: The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- Repro: Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- Evidence: critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- Confidence: high
- Requirement: CHK-009
- Smallest fix: Make the header sticky, or scroll the rows container only.
- Acceptance: Header box fully inside the list viewport after wheel up and down.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0277** (interface; FFX): PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- Chapter / state: I Seymour Flux
- Expected: The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- Observed: The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- Repro: Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- Evidence: critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- Confidence: low
- Requirement: CHK-005 (says in plain words what to spend the turn on)
- Smallest fix: Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- Acceptance: On the same board the card names the raise, then the cure, in that order.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0280** (encounter; FFX): PR-0280 (carried): the v3 card's Chapter XII rate is unchanged (bench identical); the live v4 card covers it

- Chapter / state: XII
- Expected: n/a
- Observed: ffx-three-line-r18.json XII rows are identical to round 17
- Repro: Run ffx-bench.test.ts
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- Confidence: high
- Requirement: advice usefulness
- Smallest fix: none needed now
- Acceptance: n/a
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0286** (interface; FFX): PR-0286 (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- Chapter / state: Ch I
- Where: 390x844, a status lands while a battle line is on screen
- Expected: The message and the dialogue text do not overlap.
- Observed: 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- Repro: 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- Confidence: medium
- Requirement: CHK-008
- Smallest fix: Offset the message line below the banner while a line is up, or queue it until the line ends.
- Acceptance: Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- Round 20: Carried from round 19b; not re-observed in round 20.
- Merged: capture-owner issue 4; R18-IF-05

**PR-0288** (interface; FFX): PR-0288 (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- Chapter / state: Ch I
- Where: 390x844 command menu, TALK disabled
- Expected: The full help sentence, wrapped if needed.
- Observed: 'TIDUS · Nothing left to say — A one-off action this enc…'
- Repro: 390x844 Ch I after Talk is used up, cursor on TALK.
- Evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- Confidence: high
- Requirement: CHK-009
- Smallest fix: Allow two lines, or shorten the copy for the phone.
- Acceptance: scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0291** (interface; FFX): PR-0291 (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- Chapter / state: I
- Where: 1600x900 Items list aimed at a Zombie
- Expected: As in the approved O3 target, both panels are readable.
- Observed: The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- Repro: Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- Confidence: high
- Requirement: approved target O3 / interface readability
- Smallest fix: Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- Acceptance: No overlap between .stwarn and the Guide card rect in that frame.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0292** (onboarding; FFX): PR-0292 (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- Chapter / state: I prep
- Where: Sphere Grid tab
- Expected: Every control has a key or pad route, and touch wording on touch screens.
- Observed: No key binding: Tab is WALK, A is Left. The phone explainer reads 'CLICK TWICE… press Enter… wheel to zoom' and 'Enter or click again'. On the phone the explainer's buttons start below the fold (one swipe reaches them).
- Repro: Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- Confidence: high
- Requirement: onboarding: input access
- Smallest fix: Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- Acceptance: A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0293** (visual; both): PR-0293 (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- Chapter / state: I, IV, VII, XVII, XVIII (every chapter checked)
- Where: pause layer at 4K (the 3360x1920 master is not scaled to cover)
- Expected: CHK-002: the pause painting covers the window at every supported size.
- Observed: Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- Repro: Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- Confidence: high
- Requirement: CHK-002
- Smallest fix: Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- Acceptance: pauseRect.full is true at 3840x2160 in both games.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0295** (prep; FFX): PR-0295 (new finding, outside the changed area): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed at 0.61 (tiny text), unlike CHAPTER and SPHERE GRID

- Chapter / state: party prep, any FFX chapter
- Where: 390x844 party prep tabs
- Expected: Every prep tab is usable at phone size (RUBRIC §6 device usability).
- Observed: Gap pass (sphere-phonetabs-390x844-touch): only CHAPTER and SPHERE GRID have a phone page; the other four tabs are the scaled desktop board.
- Repro: 390x844 touch, Ch I prep, swipe through the tabs.
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-phonetabs-390x844-touch/"]
- Confidence: high
- Requirement: RUBRIC §6 onboarding/prep device usability; CHK-003
- Smallest fix: Give the remaining prep tabs the phone page treatment Sphere Grid B introduced.
- Acceptance: CHK-003 sweep of each prep tab at 390x844: no player text under 14 px.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0296** (interface; FFX): PR-0296 (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- Chapter / state: XVII sin-fins-core, first decisions
- Where: 390x844 battle HUD
- Expected: CHK-008: plates never cover the intent text.
- Observed: Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- Repro: 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- Evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/"]
- Confidence: medium (frames only)
- Requirement: CHK-008
- Smallest fix: Reserve the intent line's band from the range plate on the phone layout.
- Acceptance: No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0302** (interface; both): PR-0302 (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- Chapter / state: I (Zombie), IV (Curse); any hinted status
- Where: src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- Expected: CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- Observed: Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- Repro: critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- Confidence: high (measured)
- Requirement: CHK-003; RUBRIC section 5 (effective text size)
- Smallest fix: Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- Acceptance: Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0303** (interface; FFX (FFX-2's shorter target card leaves room: 0 px2)): PR-0303 (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- Chapter / state: I seymour-flux, a target step with a hinted status (Zombie)
- Where: src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- Expected: The target-step instructions and the hint do not overlap (CHK-008).
- Observed: 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- Repro: Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- Confidence: high
- Requirement: CHK-008; PR-0282 acceptance (the hint never over the command surface)
- Smallest fix: Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- Acceptance: 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0304** (interface; FFX-2 (desktop, guide open)): PR-0304 (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- Chapter / state: IV ffx2-bahamut, the girls' menus after Curse lands
- Where: suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- Expected: While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- Observed: At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- Repro: Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- Confidence: medium (symptom high; cause suspected)
- Requirement: Status O3 target (the hint in the guide's slot); CHK-008
- Smallest fix: Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- Acceptance: 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0305** (onboarding; FFX-2 (the FFX help line follows each actor in both modes)): PR-0305 (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- Chapter / state: IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
- Where: suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- Expected: The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- Observed: Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- Repro: 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- Confidence: medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- Requirement: CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- Smallest fix: Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- Acceptance: BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0315** (feel; FFX-2 only): PR-0315 (carried, widened): the twirl crossfade double-exposes the neighbouring girl as well as the changer for about 0.2 s

- Chapter / state: ffx2-fallen-aeons, ffx2-trema (seq-spherechange f01)
- Where: src/engine/fx/mix/twirl.ts (key-to-key crossfade; suspected)
- Expected: Cuts on the beat or matched silhouettes between keys (as the 2026-10-01 visual pass recommended).
- Observed: Leblanc, Rikku to White Mage, 1600x900, f04 at 619 ms: Yuna, who is not changing, shows as two semi-transparent overlapping images while the camera blends in.
- Repro: Candidate, seed 1, Ch XI or XIII, CHANGE a dressphere.
- Evidence: critic/rounds/round-19b/visual/crop-f04.jpg; critic/rounds/round-19b/evidence/gaps/sc-rikku-ffx2-leblanc-1600x900-s1/c0-seq/f04.jpg
- Confidence: medium
- Requirement: feel: smooth transitions; VP-1001-20
- Smallest fix: Hold neighbours on one plate through the shot blend; cut the keys on the beat or crossfade in 60 ms or less.
- Acceptance: No frame of the 19-frame sequence shows two copies of any girl at partial opacity.
- Round 20: Release 37 claims work here (PR-0327 key prefetch; PR-0315 crossfade); not measured in round 20.
- Merged: visual PR-0315 (widened); feel PR-0315

**PR-0317** (visual; FFX only): PR-0317 (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900

- Chapter / state: I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03)
- Expected: A boss in action stays inside the frame (CHK-014).
- Observed: His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
- Repro: Candidate, seed 1, 1600x900, Ch I, let Seymour act.
- Evidence: critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
- Confidence: high
- Requirement: CHK-014; CHK-013
- Smallest fix: Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
- Acceptance: Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0319** (visual; FFX only): PR-0319 (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line

- Chapter / state: IX yojimbo-cavern, first menu 2000x1012
- Expected: Background staging reads as background.
- Observed: Under the colossus master the far-back figure stands on the party's line at party scale.
- Repro: Candidate, seed 1, Ch IX first menu.
- Evidence: critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
- Confidence: low
- Requirement: visual: composition
- Smallest fix: Push the prop deeper or dim it under the colossus master.
- Acceptance: In the first-menu frame Ginnem sits clearly behind the line or out of view.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0322** (onboarding; both): PR-0322 (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey

- Chapter / state: pause > OPTIONS > EYE CANDY
- Expected: Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
- Observed: FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
- Repro: Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
- Evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
- Confidence: high (contrast estimated from JPEG)
- Requirement: D-317; CHK-003
- Smallest fix: Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
- Acceptance: After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
- Round 20: Release 37 shipped a fix (4f5e11c6); no frame of the EYE CANDY page was captured this round, so it stays open and UNVERIFIED.

**PR-0323** (onboarding; both): PR-0323 (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")

- Chapter / state: pause > OPTIONS > EYE CANDY
- Expected: Copy a first-time player understands (CHK-007).
- Observed: CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
- Repro: Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
- Evidence: critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
- Confidence: high
- Requirement: CHK-007
- Smallest fix: Name the thing: "Off: the standard battle camera", "Off: the plain splash".
- Acceptance: No "today" in the page's help strings; capture at 1600x900.
- Round 20: Release 37 shipped a fix (4f5e11c6); no frame of the EYE CANDY page was captured this round, so it stays open and UNVERIFIED.

**PR-0325** (interface; FFX only): PR-0325 (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot

- Chapter / state: I seymour-flux, 1600x900
- Expected: The selected row is obvious (CHK-010).
- Observed: 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
- Repro: Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
- Evidence: critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
- Confidence: medium-low
- Requirement: CHK-010
- Smallest fix: If confirmed, give the selected row the filled slab of the main list.
- Acceptance: Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0327** (delivery; FFX-2 only): PR-0327 (new; R19-PD-01): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; on a cold or slow cache the outfit can land before the keys (builder-stated, not captured)

- Chapter / state: every FFX-2 chapter, first spherechange
- Expected: Keys present when the twirl plays, or a clean fallback.
- Observed: Den of Woe seed 3 requested 12 twirl-*.png only at Rikku's change; throttled behaviour not captured.
- Repro: Cold profile, 10 Mbit/s, Ch IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
- Evidence: critic/rounds/round-19/evidence/ffx2-den-of-woe-win-s3/network-media.json; D:/pyrefly-rel26c/docs/handoff/r36-art.md
- Confidence: medium
- Requirement: delivery: measured loading
- Smallest fix: Prefetch the party's twirl keys at battle start (idle priority).
- Acceptance: Throttled capture shows no outfit-before-keys pop.
- Round 20: Release 37 claims work here (PR-0327 key prefetch; PR-0315 crossfade); not measured in round 20.

**PR-0331** (visual; FFX only (Ch III, VIII, X)): PR-0331 (new, a question for Bailey): the fail-closed gates take the D-316 colossus master away from Natus, Braska's Final Aeon and Evrae; only Yojimbo and FFX-2 Bahamut keep it

- Chapter / state: seymour-natus, braskas-final-aeon, evrae-airship, 1600x900 to 2560x1440
- Where: src/engine/fx/mix/framing.ts, plate.ts (gates)
- Expected: D-316 lists colossus presence for the big bosses.
- Observed: At all five aspects Natus, BFA and Evrae render exactly as live 35 (pixel-mean difference 10, 22, 17, mostly HUD text): Natus about 160-190 px tall at 1600x900 against about 470 px in round 19's candidate. Not worse than live; narrower than round 19 promised.
- Repro: Seed 1, first menu of Ch X, III, VIII at 1600x900; compare with gaps/fm-*-live35.
- Evidence: critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/evidence/gaps/plate/seymour-natus.json
- Confidence: high
- Requirement: D-316 scope; RUBRIC visual and feel (boss presence)
- Smallest fix: Ask Bailey whether Natus should get its master back by steering the Sensor card off the boss (builder's proposal); list the three chapters as "today's framing" in the release notes.
- Acceptance: Bailey's decision recorded; if steered, Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0332** (visual; both (FFX measured in 6 chapters; FFX-2 Bahamut 9.4 percent)): PR-0332 (new, pre-existing): at 2560x1080 every measured chapter shows plate side bands; worst is Yunalesca (15.4 percent of the plate share, dark pillars and a tilted edge)

- Chapter / state: yunalesca, braskas-final-aeon, seymour-natus, yojimbo-cavern, evrae-airship, seymour-flux, ffx2-bahamut; 2560x1080 first menu
- Where: plate cover-fit for frames wider than 2:1 (suspected)
- Expected: The painted plate fills a 21:9 frame (platform goal 4:3 to 21:9), or the edge is dressed.
- Observed: plate share at 2560x1080, chosen = today: Yunalesca 0.154, BFA 0.103, Natus 0.094, Yojimbo 0.094, Evrae 0.085, Flux 0.034, Bahamut 0.094. No live-35 frame at this aspect; parity rests on the builder's chosen = today measurement.
- Repro: Seed 1, Ch II first menu at 2560x1080; gapcap/plateprobe.mjs.
- Evidence: critic/rounds/round-19b/evidence/gaps/fm-yunalesca-2560x1080/11-first-menu-N-G-hidden.png; critic/rounds/round-19b/evidence/gaps/plate/*.json
- Confidence: medium
- Requirement: RUBRIC section 2 platform goals; visual composition
- Smallest fix: Cover-scale the plate for frames wider than 2:1 (crop top and bottom) or extend the edge with the existing fog; never repaint approved plates.
- Acceptance: Plate share 0 at 2560x1080 in all seven chapters.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0261** (harness; both (tooling)): PR-0261 (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- Chapter / state: all phone routes
- Expected: contexts.touch.blocked names the element that intercepts the tap.
- Observed: The run.json files of ffx2-den-of-woe-win and -stall-{cand,fxoff,pacecurrent,confirmer} say outcome 'victory', although the chain never finished; runs-summary.json repeats it; only index.json's note says soft-lock. Round 17's reticle-interception-as-timeout part is unchanged.
- Repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- Confidence: high
- Requirement: CHK-016 evidence integrity
- Smallest fix: Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- Acceptance: A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- Round 20: Still true: the Den attempt-2 step logged outcome victory (link 1) while the attempt and results said defeat (R20-PD-02 evidence).
- Merged: R18-CE-02

**PR-0335** (harness; FFX only): PR-0335 (critic tooling, widened; R20-PD-04 + capture owner): the phone route never uses the FFX list's page buttons, so the intended Poison Fang and Holy Water lines are never taken by touch (Ch I phone defeat 3 of 3, as 19b), and non-battle screens are reached by keyboard

- Chapter / state: I Seymour Flux, 390x844 touch
- Where: critic/runner/lib/route-ui.mjs chooser.choose (taps visible rows only); product: src/ui/ffx/CommandMenuScroll.ts (6-row window, phone page buttons)
- Expected: A touch run reaches any item by the page buttons the phone shows.
- Observed: Three phone attempts end in defeat at 9, 11 and 31 turns; run.json misses list 'Poison Fang' and 'Holy Water' with only the first six rows (Potion to Mega Phoenix) of x27 exposed; the harness fell back to Attack. Product reachability by touch is not shown either way. Three phone attempts (seed 1 and seed 2001) ended in defeat at 9, 31 and 11 turns and 9 turns. The misses list turns 3-7 wanting Poison Fang and turns 1-2 wanting Holy Water; subRows show Potion, Hi-Potion, X-Potion, Mega-Potion, Phoenix Down, Mega Phoenix only, although the pause shows 27 items. Taps were 31 and 167; keyboard fallbacks 38 and 61 (START BATTLE, CONFIRM, RETRY and chapter select were pressed on the keyboard). Capture owner: Wanted Poison Fang, the route took Attack; Yuna down, defeat. Identical 9-turn defeat in round 19b; desktop wins in 73 turns.
- Repro: critic/rounds/round-20/cap/route20.mjs seymour-flux --size=390x844 --touch
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-touch/run.json misses; seymour-flux-win-phone-r2-touch/run.json
- Confidence: high for the harness limit; unknown for the product
- Requirement: CHK-015, CHK-022
- Smallest fix: Teach the touch chooser to tap the page buttons until the row shows.
- Acceptance: A touch run plays Holy Water and Poison Fang on the advisor's turn.
- Merged: R20-PD-04; capture owner: phone Ch I cannot play the intended line

**PR-0336** (harness; both): PR-0336 (carried from round 19 unnamed, critic tooling): the save matrix reports a false FAIL for the fresh-profile case

- Chapter / state: n/a
- Expected: The harness passes a correct default save.
- Observed: save-matrix.json says 23 of 24 and fails fresh-profile; its unexpectedDiffs (version, chapters {}, unlocked [], seenCoach [briefing], flags {}) are the normal default save; looks, parts, volumes, reload and errors are all correct.
- Repro: critic/rounds/round-19b/cap/save-matrix19.mjs
- Evidence: critic/rounds/round-19b/evidence/save-matrix/save-matrix.json
- Confidence: high
- Requirement: CHK-024 evidence quality
- Smallest fix: Make expected("{}") the default save shape.
- Acceptance: The matrix prints 24 of 24 on an unchanged build.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0337** (harness; both): PR-0337 (new, critic tooling): network and console are logged only for the 24 route runs; the 53 gap-pass sessions and the save-matrix boards carry no response log or verified stamp

- Chapter / state: n/a
- Expected: Every capture session records requests, status >= 400 and console errors.
- Observed: network-and-console-summary.json: 3,317 requests for 24 route runs and 0 for each of the 53 gap-pass sessions; the 36 save-matrix board shots carry an asserted screen but no verified stamp.
- Repro: critic/rounds/round-19b/gapcap/gaplib.mjs; critic/rounds/round-19b/cap/save-matrix19.mjs
- Evidence: critic/rounds/round-19b/evidence/network-and-console-summary.json
- Confidence: high
- Requirement: CHK-016, CHK-018
- Smallest fix: Record requests and console errors in gaplib.mjs and save-matrix19.mjs; stamp the matrix shots through the route runs' screen assertion.
- Acceptance: Every 19c session carries a network and console log.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0339** (harness; both): PR-0339 (critic tooling, carried pattern from rounds 17-19): the route harness never wins Ch XIII, XVII or XVIII, and stamps the post-scene capture before the results screen

- Chapter / state: ffx2-trema, sin-fins-core, sin-face; post-scene in I, II, VII, VIII, VI
- Expected: A recorded real-key win through results and back to the board for every included chapter (CHK-022).
- Observed: Trema 0 of 6 (0 of 14 over two rounds); Sin chapters defeated twice each; the gap pass Swordplay route hit its 81-turn cap. Five runs record 30-post-scene UNVERIFIED because the harness wants a cutscene while results is up (the scene follows CONFIRM and is captured as 33-after-confirm-scene). The harness enters no Overdrive input on the routes.
- Repro: cap/lanes.sh with ffx2-trema win --seed=1|2|3 --attempts=2; gapcap/swordplay.mjs sin-fins-core 1600x900 "" 1
- Evidence: critic/rounds/round-19b/evidence/ffx2-trema-win*/run.json; critic/rounds/round-19b/evidence/sin-*/run.json; critic/rounds/round-19b/evidence/gaps/swordplay-sin-fins-core-1600x900-s1/
- Confidence: high that it is not a product regression; unknown whether a better bot wins
- Requirement: CHK-022
- Smallest fix: Teach the route to enter the shown Overdrive input and a race-aware policy for the Sin chapters, raise the turn cap, and read the post-scene after CONFIRM (with PR-0261).
- Acceptance: A recorded win through results, CONFIRM, scene and board for XIII, XVII and XVIII.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0359** (harness; both (tooling)): PR-0359 (critic tooling, new; R20-PD-05 + capture owner): route.mjs findCard presses ArrowRight 16 times, so the 18th tile (Ixion) is unreachable; two Ixion runs aborted

- Chapter / state: XVI Ixion and Djose, board
- Where: critic/runner/lib/route.mjs:84-88
- Expected: The harness reaches any of the 18 tiles and labels an outcome from the final results screen.
- Observed: ffx2-ixion-djose-win and -r2 threw 'ASSERT-FAIL card ffx2-ixion-djose got seymour-flux' after 12 s; the walk reaches ffx2-den-of-woe and turns back. Run 3 reached the card and won. Not a product fault: the board has 18 tiles and the cursor moves tile by tile. Related: the route's 'fight' step still labels a chain link's win 'victory' when a later link is lost (PR-0261).
- Repro: node critic/runner/lib/route.mjs ffx2-ixion-djose win --base=<live>, size 2000x1012 (runs 1 and 2 of this round).
- Evidence: critic/rounds/round-20/evidence/ffx2-ixion-djose-win/run.json (boardWalk, error), critic/rounds/round-20/evidence/logs/ixion-win.log and ixion-win2.log
- Confidence: high
- Requirement: CHK-016 (a failed wait throws and never screenshots the wrong screen; it did throw)
- Smallest fix: Size the ArrowRight loop from boardAtEntry.tiles and derive the step outcome from the results text.
- Acceptance: All 18 chapters reach their card in one pass; a chain defeat reads 'defeat' in steps.
- Merged: R20-PD-05; capture owner: route.mjs cannot reach the last board card

### suggestion

**PR-0217** (combat; ffx): PR-0217 (carried): Zombie is kept across a KO (unsourced); the advisor top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- Chapter / state: Ch I, II
- Where: src/battle/ffx status handling
- Expected: A sourced rule or a labelled estimate.
- Observed: No status code changed in release 37 (git diff c69de96a..cd9dbbb0 for src/battle/ffx lists results.ts only) and the status suites pass; the advisor revive counts are unchanged because the 53 bench rows are identical. I did not re-measure the Zombie revive top rows.
- Repro: ffx-three-line-r20.json zombieReviveTopRows column.
- Evidence: critic/rounds/round-20/combat/ffx-three-line-r20.json
- Confidence: medium
- Requirement: AGENTS.md rule 6
- Smallest fix: Unchanged.
- Acceptance: Source found or the rule labelled an estimate.

**PR-0227** (encounter; ffx2): PR-0227 (carried, updated): Chapter XIII (Trema) is not won at human pace by real keys, now 0 of 14 across rounds 19 and 19b

- Chapter / state: ffx2-trema (Ch XIII), link 1 Oversoul Paragon
- Where: shipped chapter: Oversoul Paragon, Split_Infinity's kit, 3 s action time
- Expected: Intended play wins at a rate Bailey accepts.
- Observed: Real-key: defeat at link 1 on seeds 1, 1001, 2, 1002 (91, 77, 90, 75 turns). Repo shipped bench: Paragon link 26/200 (13 percent), Trema fresh 177/200, whole chapter 14/200 (7 percent) at bench speed and 13/200 (6.5 percent) at the live Wait split; P(0 of 18 at 7 percent) about 0.27, not significant. Round 19b's text quoted 13 to 14 percent for the chapter; this tree's table reads 6.5 to 7 percent for the chapter and 13 percent for link 1 alone.
- Repro: npx vitest run tests/unit/chapters/trema-shipped-bench.test.ts
- Evidence: critic/rounds/round-20/combat/vitest-full.txt (trema-shipped-bench table), evidence/ffx2-trema-win/run.json
- Confidence: medium
- Requirement: RUBRIC encounter (fair wins)
- Smallest fix: Question for Bailey, no tuning: is a chapter win rate of about 7 percent the intended difficulty for the Via Infinito boss run?
- Acceptance: Bailey's answer recorded.

**PR-0262** (narrative; FFX): PR-0262 (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four

- Chapter / state: results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
- Expected: No two chapters share a first-choice quip, and at most two use 'That's it?'.
- Observed: src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
- Repro: Win I, II and VIII and read the results quip.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/seymour-flux-win/run.json
- Confidence: high
- Requirement: narrative: character voice, no repetition across chapters
- Smallest fix: Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
- Acceptance: First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0297** (target-registry; both): R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- Chapter / state: docs/target/targets.json group picks-0929
- Expected: Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- Observed: All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- Repro: Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- Evidence: D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- Confidence: high
- Requirement: RUBRIC §7 (delivery field, required targets)
- Smallest fix: Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- Acceptance: node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0299** (audio; both): PR-0299 (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- Chapter / state: all
- Expected: RUBRIC s7: an inferred item is asked before it is built.
- Observed: src/app/saveSfxBalance.ts moves any 0.35 stored without the marker. The rule works exactly as stated (28 of 28 cases pass), but D-293 marks the existing-save half as inferred, and NOW.md lists it as open for Bailey. A pre-release player who picked 0.35 by hand cannot be told apart from an untouched one.
- Repro: Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- Confidence: high
- Requirement: RUBRIC s7 inferred items; D-293
- Smallest fix: Ask Bailey whether this is acceptable. No code change unless he says no.
- Acceptance: D-293's inferred note moves to named, or is reversed by Bailey.
- Round 20: Carried question; see PR-0298 note.

**PR-0306** (encounter; ffx2): PR-0306 (new, a question for Bailey; R18b-CE-01): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 7 real-key attempts this round (seeds 1, 1001, 2, 1002, 2002 and the gap pass's 1 / 1001; one Active-mode loss besides)

- Chapter / state: ffx2-den-of-woe (Ch XV), 3 links
- Where: data/ffx2/enemies/den-of-woe.ts shipped setting (3 Hero Drinks, +8 levels, prep off)
- Expected: Intended play wins at a rate Bailey accepts for a hard optional-feeling chapter; the shipped bench is the sourced estimate.
- Observed: Shipped bench (PYREFLY_MEASURE=1, 200 seeds): first try 48 (24 percent) at the live Wait split 1.5 s / 0.5 s, 127 within 3 tries, 162 within 5; Active 1.5 s 18. Real-key this round: 0 wins in 4 attempts (13 and 23 turns, seeds 1 and 1001, two runs), 1 of 11 over rounds 19b and 20, not significant against 24 percent (P about 0.22).
- Repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/den-of-woe-shipped-bench.test.ts.
- Evidence: critic/rounds/round-20/combat/den-shipped-bench.txt, evidence/ffx2-den-of-woe-win/run.json
- Confidence: medium
- Requirement: RUBRIC encounter (fair wins); AGENTS.md rule 10
- Smallest fix: A question for Bailey (no number is to be tuned): is 24 percent first try, 63 percent within three, the intended difficulty?
- Acceptance: Bailey's answer recorded in decisions.json.
- Round 20: See PR-0353 for this build's four Den losses.

**PR-0329** (interface; both): PR-0329 (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON

- Chapter / state: pause > EYE CANDY
- Expected: As adopted in D-317 ("players who had a look off keep the new parts off").
- Observed: A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
- Repro: Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
- Evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
- Confidence: high (behaviour); taste question
- Requirement: D-317; RUBRIC section 7 (inferred items never fail a build)
- Smallest fix: None unless Bailey wants it.
- Acceptance: Bailey's answer recorded.
- Round 20: Carried from round 19b; not re-observed in round 20.

**PR-0352** (prep; ffx): PR-0352 (new; R20-CE-06, FFX only): Natus ships no item drop although research sources Lv. 2 Key Sphere x2 (x4 on overkill)

- Chapter / state: seymour-natus (Ch X)
- Where: src/data/ffx/enemies/seymour-natus.ts:126 (drops: [] 'sourced but has no item record'); results.ts OVERKILL_DROP_MULTIPLIER doc and seymour-flux.ts comment
- Expected: research/ffx-seymour-natus-highbridge.md line 96: Lv. 2 Key Sphere x2 normal, x4 overkill [decompiled; the x4 is a single source].
- Observed: Natus's results screen has no item line; the new overkill multiplier has nothing to double there. The doc comment in results.ts and seymour-flux.ts still say overkill drops are not modelled. Pre-existing and disclosed by the builder; I could not find it on round 19b's issue list.
- Repro: Read seymour-natus.ts:126; replay seymour-natus-win (result.drops is empty).
- Evidence: critic/rounds/round-20/combat/ffx-replay.json (seymour-natus-win result), research/ffx-seymour-natus-highbridge.md:96
- Confidence: high
- Requirement: AGENTS.md rule 6 (do not invent data; this is the reverse, sourced data left unbuilt)
- Smallest fix: Add the item record for Lv. 2 Key Sphere and the sourced drop, then refresh the two comments; a data addition from a source, still Bailey's to confirm.
- Acceptance: seymour-natus-win result.drops shows Lv. 2 Key Sphere x2 (x4 on overkill) and the results screen lists it.

**PR-0358** (interface; both): PR-0358 (new; R20-IF-05, a question for Bailey): the phone advisor line names the menu but not the cost

- Chapter / state: I (FFX) and IV (FFX-2), 390x844
- Where: phone TIP line (covered by tests/unit/advisor-phone-tip-menu.test.ts, which asserts the menu only)
- Expected: RUBRIC section 2: the advisor says where an action is and what it costs.
- Observed: Desktop 'Hastega -> the party ... IN WHITE MAGIC 30 MP'; phone 'TIP Hastega -> the party - White Magic' with no 30 MP, and FFX-2 'Shell -> the party White Magic' with no 10 MP. Likely deliberate for space.
- Repro: First menu at 390x844 in Ch I or IV.
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-r2-touch/11-advisor.png; ffx2-bahamut-win-phone-touch/run.json advisorText
- Confidence: medium
- Requirement: RUBRIC section 2
- Smallest fix: Append the MP when it fits on the line; no change if Bailey prefers the shorter tip.
- Acceptance: Phone tip shows the MP cost for a spell at 390x844 without ellipsis.

**PR-0338** (harness; FFX-2): PR-0338 (new, test harness): tests/unit/strategy-ffx2-bahamut.test.ts "heal-only route" takes about 10.8 s against the 15 s limit and timed out once on a loaded machine

- Chapter / state: n/a (unit test)
- Expected: A unit test well inside its time limit.
- Observed: 324-file subset run: 1 failure, a timeout; re-run alone 19/19 pass in 11.8 s.
- Repro: npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts on a loaded host
- Evidence: critic/rounds/round-19b/combat/vitest-combat-subset.txt
- Confidence: high
- Requirement: test reliability
- Smallest fix: Give that case its own timeout or fewer seeds.
- Acceptance: The case passes inside the subset run under load.
- Round 20: Carried from round 19b; not re-observed in round 20.

## Resolved this round

- **PR-0258** (polish): Combat and prep auditors: Anima overkill gives Ability Sphere x4 on the live results screen (critic/rounds/round-20/evidence/seymour-anima-macalania-win/31-results.png), research 140/224/264 x2 on overkill; engine replay agrees.
- **PR-0318** (polish): Visual and feel auditors: Ch I Yuna's KO lies clear of the status rows at 1600x900 and FFX-2 Yuna clear of the intent card at 2000x1012 (gaps/ko-*).
- **PR-0061** (polish): Feel auditor: hold-skip to the first usable menu 3.4-5.2 s in 23 of 28 comparable runs (19b 6.6-12.1 s); slower entries only under the parallel-lane burst (PR-0346).
- **PR-0328** (suggestion): D-335 shipped: no source maps in the cd9dbbb0 manifest (0 .map files, 543,684 bytes smaller than c69de96a); the live .map URL is 404 as intended (prep-delivery auditor).
- **PR-0300** (polish): Feel auditor: the Den of Woe link-2 seam is full-bleed in 8 of 8 frames at 1600x900 (19b 21-25 percent black band). 21:9 not re-measured (coverage); the mirrored-lantern strip is filed as PR-0344.

## Merged and severity changes

- FOC37-02 <- gap pass "Trigger Happy overlay says MASH R1, Enter counts 0" (widened to major by the chief's trace of touch and pad)
- PR-0311 <- R20-PD-01 and the capture owner's rikku-warrior/idle.json 404 (same root: no painted Rikku Warrior)
- PR-0348 <- R20-CE-05, R20-PD-03, R20-FEEL-05 and the capture owner's Leblanc stall
- PR-0314 <- R20-FEEL-02 and V20-09 (shot absent in half the changes)
- PR-0357 <- R20-IF-04 and the capture owner's Ch IV ALSO-line clip
- PR-0335 <- R20-PD-04 and the capture owner's phone Ch I defeat
- PR-0359 <- R20-PD-05 and the capture owner's findCard finding
- PR-0259 <- PR-0240 (one performance-evidence gap)
- PR-0237 <- FOC37-04
- V20-07 -> kept as the two carried ids PR-0316 and PR-0333
- R20-FEEL-04 (row-follow not exercised) -> coverage, not an issue
- R20-NARR-02 (Trema and Den aftermath not reached) -> coverage and CHK-022
- PR-0353 (R20-PD-02) major -> polish: no engine change for Den on 120 seeds (A/B digests identical), 0 of 4 is within the known first-try rate, build cause only hypothesised
- FOC37-01 major -> polish: the overlay is unreachable by players (PR-0340) and was never reproduced
- FOC37-02 polish -> major (upgrade): Enter counts 0 live; touch and pad have no route

## What stands between this build and acceptance

- The FOC37-02 regression (HOLD) and ten more open majors: PR-0148 and PR-0099 (audio), PR-0308 and PR-0269 (combat), PR-0311, PR-0341 and PR-0310 (visual), PR-0340 (Lady Luck unreachable), PR-0270 (onboarding), PR-0222 (hidden FF7 fight).
- Audio has no number until Bailey gives a listening score (CHK-B1, PR-0148). Six categories sit under the 9.0 floor: encounter 8.9, visual 8.8, feel 8.6, interface 8.2, onboarding 8.6, delivery 8.4.
- Mandatory checks failing or unverified: CHK-001, 002, 003, 008, 009, 011, 012, 015, 018, 020, 022, 023, B1.
- Two included chapters without a win on this build (XIII Trema, XV Den of Woe); 18 targets unverified and 7 waiting on Bailey; no performance measurement for the third review running.
- Bailey's recorded judgments (the human-judgment list in the JSON), none recorded yet.

## What changed since round 19b (rubric v2 rounds only)

- Gains: hurried entry 3.4-5.2 s to the first menu (PR-0061 resolved); dressphere shot held 1.4-1.6 s (was 0.5 s); KO bodies clear of the status rows (PR-0318 resolved); sourced overkill drops (PR-0258 resolved); no source maps (PR-0328 resolved); Den seam full-bleed at 1600x900 (PR-0300 resolved there); living pause portraits move and stop under REDUCE MOTION; Ginnem's glow reads as unsent; Ch XVII card chain 4.5 -> 48.5 percent; Sin XVII and XVIII won by real keys for the first time in a deep round.
- Losses: Trigger Happy input regression (FOC37-02); PR-0330 widened to Ch VII; Yojimbo and Daigoro missing at one first menu (PR-0341, unconfirmed); Rikku Warrior has no art (PR-0311 widened, live 404); Den of Woe not won (PR-0353); the dressphere shot absent in half the changes (PR-0314).
- Category moves: combat 9.2 (held), encounter 8.9 (held), visual 8.9 -> 8.8, feel 8.2 -> 8.6, narrative 8.9 -> 9.0, audio UNVERIFIED (as 19b), interface 8.5 -> 8.2, onboarding 8.6 (held), prep 9.1 (held), delivery 8.5 -> 8.4. Rubric v1 rounds 02 and 03 are history under another rubric and are not compared.

## Proposals (nothing here is built without Bailey's yes)

Unscored.

- Lady Luck reachable (PR-0340): give Lady Luck a Garment Grid node for its owner in a chapter where FFX-2 sources it, or record that the reels ship dormant. Benefit: release 37's sourced reels become playable. Cost: one grid row plus a Ch V/VI balance read (the Dud costs about 75 percent party HP). Fit: FFX-2 only. Risk: the Dud as a trap for a casual player. Preview: a timed contact sheet of one Change to Lady Luck and one spin. Nothing is built without Bailey's yes.
- Timed reels (PR-0349): animate the strip so the stop symbol follows the press, as research/ffx2-combat-core.md 3.12 describes, instead of a uniform draw. Benefit: skill instead of a 74 percent Dud gamble. Cost: overlay animation and a seeded test. Fit: FFX-2 only. Risk: a timing mismatch at low frame rates. Preview: a 2-second clip. Nothing is built without Bailey's yes.
- Dressphere shot fallback (PR-0314): when no clean frame exists, a small push-in on the changing girl instead of no shot. Benefit: every change gets its beat. Cost: one framing candidate. Fit: FFX-2 only. Risk: the push-in must clear panels. Nothing is built without Bailey's yes.
- Re-stage Ch II, III and VIII so the party stands clear of the boss (PR-0310), and give Natus its colossus master back by steering the Sensor card off the boss (PR-0331). Fit: FFX only. Risk: changes approved compositions (rule 9), so 2-4 stills first. Nothing is built without Bailey's yes.
- Critic tooling (no product change): findCard walks the tile count (PR-0359); the route presses Back when its wanted row is absent and dumps the menu at a stall (PR-0348); keep battle logs for retry attempts; a dedicated single-lane performance capture before any parallel lanes (PR-0259); a phone route that uses the list page buttons (PR-0335).

## critic-clear (verbatim)

```text
still pending focused: mandatory checks are UNVERIFIED: CHK-002, CHK-015, CHK-022, CHK-023, CHK-B1
  still pending deep: required coverage was not tested: Single-lane frame time and load time for cd9dbbb0 (PR-0259; third review without it), FFX-2 Ch XIII Trema and Ch XV Den of Woe wins on this build (CHK-022), Trigger Happy on 390x844 touch and on an emulated pad (FOC37-02 acceptance), Living portraits: eyes following the highlighted row, LIVING PAINTINGS off, press state (D-321), Ch IX first menu recaptured on an idle host with an actor-visibility probe (PR-0341), Rest-gap measurement for Ch II, III, VIII (PR-0310), Release-37 named changes with no capture: Ch XII Auron disc line, Ch III Talk card at 0.6, FFX-2 end-of-fight banner, drift-driven plate defocus, Ginnem glow on/off, 35 boss keys seen in play, CHK-002 at 4:3, wide and 4K, CHK-B1 (Bailey's listening score, D-349)
```

