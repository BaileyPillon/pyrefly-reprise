# Round 30: deep review of the live build 2b48cee95 (release 66)

```text
Build / artifact / target version: main 2b48cee95, bundle BwPs1UaV, artifactHash c4bb4251f0a4e73606e26e0cb5757df0f4eabe2a5daa94a7f4fd6f4ce89e21a3, targets 1b09ad4e5a0315f4233b38cdaccc5a6ce2c3854fe9d5a6f21db39145ad6ca5b2
Review: deep (the live build https://echoesofspira.com/, owed since earlier builds; carries the obligations of 76 builds)
Deployment: PASS
Changed area: FAIL
Ship: SHIP (interim build under rule A, no regression, no critical; majors disclosed below)
Milestone: not assessed
Quality: provisional, no full score (no verified number for audio, onboarding, prep, delivery); scored categories: combat 9.5, encounter 9.2, visual 8.3, feel 8.2, narrative 8.8, interface 8
Targets: required 13 / matched 9 / failing 0 / unverified 2 / waiting 2
Top issues: PR-0459 (Auron head in the close-up, open two reviews), PR-0380 (115 swap jerks outside the pack chapters), PR-0379 (81 percent see-through swaps), PR-0531 (Paine, Rikku, Yuna size jumps), PR-0517 (Rikku and Paine ready poses)
Coverage: all 19 chapters won by real keys on the live site; engines re-run identical; see the matrix
Next required review and why: The deep obligation of 2b48cee95 is settled by this report except the unverified categories. The next candidate that touches the pose swap, blend or registration needs a focused review with CHK-026 and CHK-027 on Chapters I and IV plus the Vegnagun, Trema, Braska and Yunalesca chapters; the next deep review owes Bailey's listening verdict (CHK-B1), the prep and accessibility walk (PR-0503), first-load timing, and the strip reads named in PR-0380 and PR-0531.
Elapsed review time / repeated work avoided: about 35 minutes of chief work on top of the capture owner and harness runs; the 15 combat probe outputs were re-run and compared by md5, the unchanged story, audio and save paths were reused with dependency arguments
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
  - mandatory check CHK-001 is UNVERIFIED
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 7 critical or major issue(s) remain open
  - 2 required target(s) unverified
  - 2 required target(s) waiting
  - only 9 of 13 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148; a music-only 7/10 of 2026-10-13 is on record)
  - human judgment not recorded: Feel: are the planned smear hard cuts, the one-frame impact inversion and the pro camera shots the look he wants (PR-0530, PR-0548, PR-0521; CHK-B2)
  - human judgment not recorded: Art: should the Rikku Dark Knight and Paine Warrior ready poses be repainted or only registered (PR-0517)
  - human judgment not recorded: Audio: keep or change the silent Chapter IV results screen (PR-0504)
  - human judgment not recorded: Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
  - human judgment not recorded: Narrative: portrait expression on grief lines in both games (PR-0485)
  - human judgment not recorded: Accessibility: COLOUR VISION, TEXT SIZE, REDUCE FLASHES, REDUCE MOTION and key remapping never walked (PR-0503)
report: valid evidence
```

## Verdicts

- **deployment**: PASS: CHK-017 (the live page serves index-BwPs1UaV.js; verify-live 77 files 0 mismatched, the live review compared 7,169 files) and the capture owner's runs were clean: 0 console errors and 0 not-found requests in all 33 run files. First-load time is not measured (PR-0520).
- **changedArea**: FAIL: CHK-026 and CHK-027 FAIL (size, stance, jerks and ghosting outside the two pack chapters), CHK-008, CHK-009 and CHK-020 FAIL, and CHK-001, CHK-002, CHK-003, CHK-005, CHK-023 and CHK-B1 are UNVERIFIED. No regression against live; release 66's own targets (MF-01, MF-08, the pack chapters' jerks) were met where measured, MF-09 and MF-02 are not shown in a valid capture.
- **ship**: SHIP: no critical defect; every critical or major issue is tagged introducedByCandidate false and regressionVsLive false; combat, data, story and save paths are byte-identical to the build live before it.

Ship reasons:

- No critical defect was found or left reachable: all 19 chapters were won by real keys on the live site with 0 console errors and 0 not-found requests, the save-data class is untouched (SaveData.ts byte-identical, reload keeps the clear in 19 of 19), and the live page serves the build under review byte for byte (CHK-017).
- No regression against live: git diff e9907cad8 and eaf599d0c against 2b48cee95 is empty for src/battle, src/data, src/engine/tactics, src/story and research/, all 15 combat probes are byte-identical, and every critical or major issue below is tagged introducedByCandidate false and regressionVsLive false.
- Release 66 is better than release 65 on its own target: the two pack chapters are clean on swap jerks (Chapter I worst 32.8 px against 1,275 px, Chapter IV 45 px against 79 px), Chapter IV see-through frames fall 147.9 to 90.0 a minute with 0 interlude blips, no presenter stalled in 10,454 s of battle, and the 4 to 12 percent frame-spike improvements hold.
- The changed area FAILS CHK-026 and CHK-027 and the quality score is provisional (audio, onboarding, prep and delivery have no verified number), so this is an interim build under rule A, not a milestone; the majors are disclosed and carried.

Disclosed in the release announcement:

- PR-0459 (major): Auron's head changes 7 and 9 percent at two swaps in the Chapter I killing-blow close-up (open across two deep reviews; method check owed).
- PR-0380 (major): outside the two pack chapters 115 pose swaps jump 40 px or more in one frame (15 of 19 chapters; worst 200.5 px, a boss tail that may be designed).
- PR-0379 (major): 81 percent of pose swaps are see-through dissolves, 3.5 seconds of ghosting a minute (Chapter I 1.7 s, Chapter IV 1.5 s a minute).
- PR-0531 (major): Paine, Rikku and Yuna change height or head size 10 to 18 percent at some swaps (CHK-026 FAIL on height, stance and feet).
- PR-0517 (major, carried): Rikku Dark Knight and Paine Warrior ready poses read as different figures from their attack poses.
- PR-0148 (major, carried, evidence gap): no numeric owner listening verdict covers the shipped mix, so audio has no score.
- PR-0295 (major, carried, not re-examined): the party-prep tabs on a phone.

## The ten categories

### combat: 9.5

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Auditor reading adopted (engine and data byte-identical to round 29, all 15 probe outputs identical). Combat auditor, round 30, live build 2b48cee95 (bundle BwPs1UaV, release 66), engine run from D:/pyrefly-release55. IDENTITY: git diff e9907cad8 (round 29 build) and eaf599d0c (r65) against 2b48cee95 is EMPTY for src/battle, src/data, src/engine/tactics, src/story and research/. The 84 changed src files in r66 are presenter, camera, HUD, rig and measuring code (BeatClock, KeyPoses, StanceSwap, HitReaction, KoFall, AtbLive, CtbSlide, cutin, etc.), so no game-data value changed and none needs a source audit. RE-RUN, NOT ASSUMED (critic/rounds/round-30/audit-combat): the whole round-29 probe toolkit (aeonmenu, bahamut56, ch3, chain, demoseeds, hidden, immunefuzz 51,782 forks, kernel 478 checks 0 mismatches, kernelx2 68 checks 0 mismatches, naive attack and random FFX 40 seeds x 12 chapters, naivex2 FFX-2 7 chapters x2 arms) plus ffx-parity-measure (seeds 5001-5200 x 12 FFX chapters) and ffx2-parity-measure (seeds 1-100 x 7 chapters): all 15 outputs are byte-identical (md5) to round 29, which also proves determinism. Boundary and high-risk sample (kernel/kernelx2 cover CTB ticks and ranks, Haste/Slow, Zombie, Breaks, Overdrive modes, ATB speeds, chains, dressphere and Garment Grid gates): zero mismatches. Intended-line win rates (engine, 200 seeds): Seymour Flux 200/200, Yunalesca 180, Braska 197, Anima 189, Evrae 194, Yojimbo 196, Natus 190, Omnis 174, Via Purifico 180, Sin core 178, Sin face 200, Mirror Aeons 148; FFX-2 Bahamut 100/100, Vegnagun 99, Leblanc 100, Fallen Aeons 100, Trema 71, Den of Woe 100, Ixion 100; Bahamut seed 1-60 wins with exactly one Mega Flare and 0 KOs. Credible wrong lines: attack-only and random lose 40/40 in 10 of 12 FFX chapters (Sin core attack-only never ends; random wins Yojimbo 10/40). UNIT SUITE on this tree: 26,710 tests, 26,596 passed, 112 skipped, 1 failed: tests/unit/advisor-floor.test.ts 'Mirror Aeons' hit its 15 s timeout while the suite ran beside other jobs; the file alone passes 23/23 (Mirror Aeons 6.5 s). The 56 test files r66 touched (662 tests) pass on their own. CHK-023 (real runtime invokes the changed subsystems, owner and continuity event logs): Chapter I real-key win logs show Lance of Atrophy, Banish, Protect/Reflect/Dispel/Flare, Mortiorchis Full-Life x3 with Mortibsorption heals 4000,3000,2000,1000,1000,1000 (research floor 1,000), seymour-lance, seymour-half and mortiorchis-first-charge triggers, Zombie applied x3 (Holy Water objective), Bushido Dragon Fang; Yunalesca logs show form-2, first-zombie, form-3 and mega-death triggers in order with Mega Death x3 and Osmose/Absorb; Chapter IV logs show Curse once, Attack, Impulse, first-mega-flare-countdown then one Mega Flare (power 14 from the game's own row, research/re-ffx2-ai-bahamut-vegnagun.md), bahamut-half and bahamut-low triggers, a Rikku Dark Knight to Warrior spherechange through the blue gate, 105 chain events. MF-01 (FFX-2 only): in the Chapter IV continuity run 0 ready>idle>cast/item interludes inside 300 ms remain (34 direct ready>cast, 3 ready>item), the FFX Chapter I run is untouched by the change (isFfx2 guard in KeyPoses.ownNextAction). MF-08 beat clock: 19 of 19 chapters ran 10,454 s of battle with no stalled presenter; hidden-tab pass is CLEAN for Chapter I and the ATB pump keeps its 250 ms MAX_STEP_MS clamp so a throttled tab cannot wipe an FFX-2 party. Held at round 29's 9.5, not raised: no engine change, nothing regressed. Deductions that stand: (1) the pad-driven Overdrive input windows (Tidus/Wakka/Lulu/Kimahri minigames) were again not captured in a browser by the owner (CHK-023, fourth review running); (2) PR-0460: the Braska real-key run now reaches links 2 to 7 but wins them with Attack, Pray and Energy Rain only, so Yuna's Summon rows in links 3 to 6 are still unproven in a browser; (3) an FFX-2 hidden-tab capture in Active mode does not exist (only the clamp and unit tests).

### encounter: 9.2

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Auditor reading adopted. Encounter auditor, round 30, live build 2b48cee95 (bundle BwPs1UaV; the bundle is the one in docs/deploys.log, no later deploy exists, and the r66 gap pass stamped it at 08:30Z). Encounter data, AI scripts, phases, party builds, rewards and the chapter registry are byte-identical to round 29 (empty git diff, see combat); all engine benches re-run and identical. REAL FLOWS (the gain over round 29): the owner's evidence index covers Chapter I (win at 1600x900 and 2000x1012, loss and TRY AGAIN, phone loss then retry), Chapter II (seed 3 win in 130 turns with R held, seed 2 loss then retry), Chapter IV (win at 1600, 2000, 390 touch; loss then retry to a first menu in 9.9 s) and says Braska is stalled and Mirror Aeons absent. The continuity harness folder in the same round (critic/rounds/round-30/continuity, 522 index entries, injected 0, gpu mode, keyboard from the title with only setSeed(1) as the labelled setup hook) won ALL 19 chapters to the results screen, confirm and chapter select on the live site: Seymour Flux 53 turns, Yunalesca 138, Braska's Final Aeon 284 turns over seven links (27:27, 6 phase seams, all five summons fired, Pray and Energy Rain in the possession links), Anima 59, Evrae 83, Yojimbo 14, Natus 26, Omnis 92, Via Purifico 38, Sin core 317, Sin face 45, Mirror Aeons 209, FFX-2 Bahamut 61, Vegnagun 88, Leblanc 88, Fallen Aeons 52, Trema 227, Den of Woe 30, Ixion 28. This removes the three chapters that had no complete real-input flow in round 29 (Yunalesca, Braska, Mirror Aeons) and supersedes the owner note that Braska is UNVERIFIED. Source checks on what the logs show: Braska's final results read AP 0 and gil 0, which matches the sourced all-zero records m163-m169/m176/m178-m180 noted in src/data/encounters.ts; Mirror Aeons results (Dark Matter, 28,000 AP on maxed S.LV) match the registry; Chapter I rewards (AP 10,000 x4, 6,000 gil, Lv. 4 Key Sphere) and Chapter II (AP 14,000, 9,000 gil, Lv. 3 Key Sphere) match round 29. Win rates across seeds: see combat (Mirror Aeons 148/200 and Trema 71/100 are the hard ends and both were won by real keys). Credible wrong lines lose or stall: attack-only and random 0/40 in 10 of 12 FFX chapters; FFX-2 attack-only 0/40 in Vegnagun, Leblanc, Fallen Aeons, Trema, Den of Woe. Observation (not a defect, sourced): FFX-2 Bahamut attack-only wins 37/40 with the per-command span on and 40/40 off, because the re-parity Mega Flare is table power 14 (146 damage), not the old 614-1,165 estimate; round 29's prose said this line 'never wins or loses' but the underlying file is byte-identical, so that sentence was a reading error. Held back from 9.5 and why: Trema about 60 percent at human pace (PR-0227; engine 71/100), Den of Woe 95 percent (PR-0498), hidden chapters that do not punish credible mistakes (PR-0447, last-summoning still 60/60 with attack only), demo mode's 50 percent Overdrive gauges (PR-0525, owner decision 173c), the stale research/ffx2-bahamut.md (PR-0524, no superseded banner yet), and the second loss of the Bahamut retry never reaching a defeat panel in the owner's window (harness limit, UNVERIFIED). Score +0.2 from 9.0 only for the added real-flow coverage; no encounter content changed.

### visual: 8.3

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Auditor reading adopted; the chief reads the height and head strips as a harder miss than the auditor (PR-0531), so the score is held at round 29's 8.3, not raised. Round 30, live build 2b48cee95 (bundle BwPs1UaV), https://echoesofspira.com/. I opened no browser; I read the capture owner's headless-GPU evidence (PYREFLY_BROWSER=gpu, 427 index entries) and the continuity harness output (19 chapters, 12,903 swaps, 10,454 s). Release 66 changed no painting, so the visual score is carried at round 29's 8.3, not raised: release 66's gains are in motion, which belongs to feel and animation. CREDITS: approved art is intact (verify-approved with ROOT=D:/pyrefly-release55: 917 ok, 0 mismatched, 0 missing; approved list 869, judge-locked 48; round 29 had 89 mismatched, so the protected-art ledger finding PR-0513 is closed). Chapter IV reads as a finished lit stage: Bahamut is a clean cut-out and the party is whole, well sized and grounded. Chapter I's Kimahri/Yuna/Seymour Flux and Chapter II's Yunalesca arena render cleanly. The title painting, chapter select, dialogue, results and pause match their tiles. The phone defeat page follows PR-0001 option B. DEBITS: (1) Chapter I action shot crops Seymour Flux's head out of the frame at the top right under the turn order (23-midfight, carried PR-0479). (2) Chapter III 1600x900 mid-fight: Tidus's HP plate covers Yuna's lower skirt and feet, and Auron is drawn almost entirely behind Tidus (braskas-final-aeon-win-ff/23-midfight). (3) CHK-026 FAILS in 14 of 19 chapters, but 470 of the 489 head fails are one cause, Lulu's rig head read at 5 to 15 percent of a roughly 35 px head (2 to 5 px; the strip shows no visible size jump). The remainder are Chapter I Auron's killing-blow close-up (head x0.9238 and x1.0933, same as round 29, so open for two reviews), Trema Paragon feet 10 px, and Rikku/Yuna height at 0.879 to 0.896 against a 0.9 band. (4) Crossfade ghosting is still large: 3,474 ms of see-through a minute across the harness runs, worst severity 0.366, under the 0.4 fail line; the Chapter IV Paine attack-to-follow strip loses her for 3 frames under a hit flash. (5) Rikku's ready pose reads smaller and darker than her attack pose (carried PR-0517). NOT SEEN: Chapter III and Chapter II were not won in the capture window, so their post-fight stages are unseen; Chapters VII to XXVII are judged only from the continuity strips. BAILEY'S FIVE SUB-SCORES (provisional, outside the weighted score): characterModels 7.0 (capped at 7.0 while CHK-026 FAILS, RUBRIC 6a), enemyModels 7.9 (carried; the Seymour/Bahamut cut-outs are clean, Mortiorchis still dissolves through a see-through frame), animation 7.0 (CHK-026 cap; the 0.25 snaps-per-minute cap no longer binds, because snaps are 0 against 4.67 and 7.51), fidelity 8.6 (carried), camera 7.5 (carried; the boss is still cropped in action shots).

### feel: 8.2

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Auditor reading adopted. Chief-critic input from the feel and narrative auditor, round 30, LIVE build 2b48cee95 (bundle BwPs1UaV). I opened no browser; judged from the capture owner's GPU headless evidence (index mode gpu, no black canvas), the 19-chapter continuity run (all 19 run by the dedicated harness, 10,453.9 s of battle, 57.4 to 60 fps, 0 probe errors) and its strips. WHAT I SAW. Input to response: real-key Chapter I reaches the first command 43.2 s after the chapter is chosen (pre-scene read included) and Chapter IV 26.6 s; the defeat panel is up 0.9 s after the last KO (Chapter I) and TRY AGAIN is back at a first menu 16.5 s (Ch I) and 9.9 s (Ch IV) after the press; OTHER FIGHT returns to chapter select in 2 s (seymour-flux-lose-retry/run.json, ffx2-bahamut-lose-retry/run.json). Transitions: the boss card dissolves into the stage with the HUD down under it (Ch I seq-transition-into-battle f05-f07; Ch IV same), no pose pop at the hand-over; Ch IV still shows one empty stage and Bahamut fading in half see-through before the first turn (carried PR-0528). Action and reaction, Ch I Mega Phoenix (seq-party-action) and Poison Fang/damage (seq-action-playing): command card, item glow, MISS/number, revive, then the menu returns; the 1968 damage number sits on Seymour's face for 5 of 10 sampled frames. Ch IV Magic Break (seq-party-action, seq-action-playing): name banner, Rikku/Paine hit smear with a 161 number in about 4 frames, the turn-intro portrait cut-in covers a third of the screen for 3 sampled frames; the spherechange sequence reads cleanly (Gate: Blue banner, flare, Warrior costume, then Rikku attacks). Camera: pro-camera framing on mid-fight Ch I and Ch IV is coherent and the other chapters hold the wide shot; the F1 HUD steps back during actions. Panels over the stage in other chapters (guide plus intent card over Vegnagun) are filed under interface (PR-0516, cross-reference only). MOTION, the harness (judged, not re-measured): snaps 0 per minute, but this is a classification, not a change: 75 hard cuts (0.43 a minute overall) are all in the two pack chapters, Chapter I 32 (4.94 a minute) and Chapter IV 42 (6.87 a minute), and the release tree excuses 73 of them as planned smear cuts (policy smear.excuse true, Bailey 2026-10-22 'cut on the motion peak with a smear'); round 29's 4.67 and 7.51 were the same cuts counted by an older tree, so the visible rate is unchanged. See-through cross-dissolves: 10,283 of 12,623 counted swaps (81.5 percent) are ghosts, 3,474 ms a minute (5.8 percent of battle time), worst 5,497 ms a minute (Trema), 4,982 (Omnis), 4,942 (Ixion); Ch I 1,689, Ch IV 1,505. Jerks: 1,091 jerks, 288 over 40 px, 115 at a pose swap (worst 200.5 px, the Vegnagun tail under a white flash, ffx2-vegnagun-shuyin strip jerk-000; next 171.5 Sin core, 117 Trema, 104 Braska, 102 Yunalesca); the two pack chapters are the clean ones (Ch I worst swap jerk 32.8 px, CHK-027 PASS; Ch IV 45 px, 1 over the line). CHK-026 FAIL (489 head over tolerance, mostly the control reading; independent readings: 15 swaps outside the height band, stature 0.765 to 1.261, 39 silhouette-stance swaps over, 12 feet, worst registered feet 10.5 px in Trema); CHK-027 FAIL in 15 of 19 chapters. Release 66's A items, measured on the same harness: MF-01 works on the live build, Chapter IV has 34 ready-to-cast and 3 ready-to-item swaps with 0 idle blip between ready and cast (idle then cast/item inside 300 ms: 0), ready-idle-ready flickers 0, and see-through frames fall from 147.9 a minute (release 64, CHANGELOG) to 90.0 (focused review r65 to r66: 637 to 534 frames); Chapter I is unchanged at 101.5 against 101.7. Frame pacing: p99 17 to 28 ms in 15 chapters, Ch IV p99 35.3 ms with 255 slow frames (1.2 percent, round 29: 338), Trema p99 71.2 ms and 57.4 fps with 2.3 percent slow frames (shared host during the card-filming lock, not called a regression), worst single frames Mirror Aeons 763 ms, Vegnagun 446, Trema 367, Ch I 283 (round 29: 353). GAIN CLAIMED: +0.2 over round 29's 8.0, defined as the measured removal of about 40 percent of Chapter IV's see-through frames and the ready flicker on the live build, Ch I swap jerks 4 to 2 (focused, same harness), the real-time shake and impact frame, and a lost fight that returns to play in 10 to 16 s by real keys. NOT CLAIMED, UNVERIFIED: the Mega Flare detonation and the physical attack cycle are in no clip again (round 29's gap), the MF-09 knock-out landing has no valid strip (the Chapter I strip swap-006 follows Seymour, not Kimahri), MF-02's first-sight freeze has no cold-session frame times, and no timed sequence carries frame timestamps, so absolute timing between sampled frames is not read. Held under 8.5 because CHK-027 still FAILS in 15 chapters, the dissolves and jerks persist outside the two pack chapters, the KO has no fall and the revive is a dissolve (PR-0473), and the headline motion is not captured. Caps (chief to apply, RUBRIC 6a): CHK-026 FAIL keeps characterModels and animation at 7.0; snaps are 0, so the 7.5 snap cap is not triggered.

### narrative: 8.8

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Auditor reading adopted. Chief-critic input from the feel and narrative auditor, round 30, LIVE build 2b48cee95 (bundle BwPs1UaV). Dependency argument for the reused readings: git diff e9907cad8..2b48cee95 is EMPTY for src/story and research/writing-bible.md (checked this round), so every script is byte-identical to the one round 29 read in full (seymour-flux.ts and its pass script, ffx2-bahamut.ts). Read fresh this round: yunalesca.ts pre and post against writing-bible E2 (the pyrefly memory, empty statue and herald, the price, Wakka's offer, 'Hope is comforting', Auron's confession, Yuna's inverted 'No.', 'She does not fall. She thins', Wakka/Rikku/Lulu 'a no is not nothing', the unanswered Tidus/Auron exchange, the black-screen narration: all present, Yunalesca never taunts, as the bible requires), braskas-final-aeon.ts pre and post against E3 (Jecht's failed joke at Yuna, 'Beat me properly', 'You always cry', 'Not today, old man', Auron's sending, Tidus fading, the 'end of my story' narration: present, Chapter III's grim list returns no victory quip as PR-0187 says), the victory-quip tables against bible 5.4 (Chapter I and II use the grim column; Chapter IV's results carry no quip, as E6 requires). REAL-KEY AFTERMATH, which round 29 could not see: the harness won Yunalesca (138 turns), Braska's Final Aeon (284 turns, 27 min, 6 chain seams) and Mirror Aeons (209 turns) by real keys; results, then Confirm, then the aftermath scene was reached and shown in Yunalesca ('There. Now no one can summon it.'), Braska ('Is that it? Did we—'), Chapter IV ('...Yunie.', 'Hole in the floor. Out.' for Trema), and the post-scene frames of all 19 chapters exist: Vegnagun ('Listen to me. She asked me to—'), Anima (kneeling Seymour narration), Evrae ('It just... dropped.'), Yojimbo ('She's gone. Truly, this time.'), Natus and Omnis (narration over black), Fallen Aeons (Leblanc, 'Took you long enough, Gullwings'), Omnis ('So. This is how it ends for me.'), Via Purifico (Isaaru), Den of Woe (Paine 'No.'), Ixion ('Where the fayth stood, there's only a hole.'), Sin core ('Sin plows into the outskirts of Bevelle...'), Mirror Aeons ('Rest now. All of you.', two-act scene in the sources). Tone follows each game: elegiac and sparse in FFX, quick and rationed-sincere in FFX-2; the FFX-2 chapters keep the single-beat sincerity. Not read in full this round: ffx2-vegnagun-shuyin.ts and the scripts of Chapters VI to XVIII beyond their first and last frames (reused unchanged from round 29's frames and rounds 27 and 28). DEBITS: (a) the dialogue portrait never changes expression: 46 'emotion:' tags in src/story/scripts are read by nothing (grep of src/story/runner, src/ui and src/app finds no reader; the DSL says it falls back to neutral), and each speaker has one painted portrait, so Rikku grins on '...Yunie.', Yuna smiles on a line tagged sad ('She's gone. Truly, this time.') and on the Ixion hole line, and on the silent Chapter IV results (PR-0485, now with a cause and wider than one chapter, both games); (b) pre-scene reading time cannot be judged because the harness hammers Enter, so each line's on-screen time without input is unmeasured; (c) Chapter V's script was read only through its frames. GAIN CLAIMED: +0.1 over round 29's 8.7, defined as three aftermaths (Chapters II, III and the Mirror Aeons pair) moving from not seen to seen through real keys with the sources matched; the text itself did not change. Held under 9.0 for the portrait expression mismatch on grief lines in both games and the unmeasured pacing of the scenes.

### audio: UNVERIFIED (no number)

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). No number: the listening half cannot be had without ears. No number. I cannot hear, and no agent heard anything: every line below is read from ffmpeg and node measurements, the shipped files, the capture owner's AudioManager snapshots and the network lists. TECHNICAL (my own run, round 30, no browser): tools/audio/qa.mjs --strict on the shipped files = 43 music cues, 0 cues with findings, 0 sfx findings; integrated -16.21 to -16.01 LUFS; worst true peak -1.48 dBTP; 0 clipped samples; loop seams 43 of 43 ok on step and spectral flux; octave balance ok; SFX sprite, v2 and the 9 parity packs 0 findings; 222 voice lines (4.04 MB) and 9 voice-pass lines; 71.61 of 105 MB budget (critic/rounds/round-30/audio/qa.json, qa.log). All 319 mp3 under public/audio decode with 0 ffmpeg errors (decode-all.log). All 300 audio entries of the artifact manifest critic/artifacts/2b48cee95.json are sha256-equal to public/audio (the live byte comparison of 7,169 files is the live review's, PASS). themes-audit: every chapter ok, 11 chapters flagged borrowed-with-owed-row (carried PR-0099); chapter-cue-map-report: 0 chapters depart from the cue map. No file under public/audio or src/audio changed between r29's build e9907cad8 and this one (git diff empty), so r29's cue-set findings carry with that argument. ROUTING (audio-debug snapshots, 17 runs of the capture owner, live echoesofspira.com, PYREFLY_BROWSER=gpu, plus the music-file request lists of the 20 continuity runs, which show the right cue files loaded per chapter): 0 audio requests missing or not shipped, 0 not-found, 0 console errors, voice cache failed=0 and every one of the 94 snapshots' voice duck flag equals 'a line is playing' (94 of 94), every voice line started was heard and ended. Cues at the real moments: FFX pre-scene scene-dreams-end (Braska) and scene-zanarkand-dome (Yunalesca) correct; Chapter I's first line is silent by script (music(null) at the head of seymour-flux.ts, scene-gagazet comes later in the scene); battle first menu = chapter data cue in every run (boss-seymour, boss-challenge, boss-jecht, boss-bahamut, boss-vegnagun); Chapter V keeps boss-vegnagun across links 2 to 5 and boss-shuyin plays after the Shuyin entrance (ff run, after-fight); losses play defeat-ffx (Chapter I, Chapter II seed 2, phone Chapter I) and defeat-ffx2 (Bahamut) and the battle theme is faded; wins play victory-ffx (Chapter I, Chapter II seed 3) and victory-ffx2 (Chapter V) on the results screen; Chapter IV's win is silent on desktop (current null in 2 of 2 desktop wins) by D-1294 and D-1352 (pack on by default on desktop, passSilentWin) and 'pause' on phone, the owner's open call, not a routing fault. One suspect, minor: Chapter I's fanfare started at the last blow is cut by the battle screen's exit and restarted at the results panel (issue AUD-R30-01). One carried minor: a UI cue fell to the synth in the first 3 s of one session (phone Bahamut, t=2.76 s, cursor-move; 1 of 12 runs with a log; PR-0514). NOT EVIDENCED THIS ROUND (UNVERIFIED, listed in capturesNeeded): title and FFX chapter-select cue, pause-menu cue mid-battle, the retried fight's theme after a loss, scene-gagazet under Chapter I's voiced scene, boss-yu-yevon after the Valefor entrance (Braska stalled at the lock window), mid-fight phase seams of Chapter I, Chapter III results. OWNER VERDICT: the only number is 'I like all the music 7/10' (2026-10-13, D-804, music only, predates three re-rendered victory cues, five SFX files, 245 voice lines and the conference sound pass); SFX, voice and the pass have none (D-1310: no listening score is made without ears). docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28. Approving a direction is not a numeric score, so the category is UNVERIFIED, not a guess, and nothing is averaged or zeroed. Technical health and routing would support a high reading; the listening half decides the number.

### interface: 8

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Auditor reading adopted. Round 30, live build 2b48cee95 (bundle BwPs1UaV), release 66. Read from the capture owner's stills only (PYREFLY_BROWSER=gpu, as recorded in index.json); I opened no browser. Sizes seen: 1600x900, 2000x1012 (Ch I and Ch IV) and 390x844 touch (Ch I lost run, Ch IV won run); Ch II and Ch III at 1600 only. Not seen: 4:3, ultrawide, 1440p, 4K (listed in capturesNeeded). Down 0.1 from round 29's 8.1. Nothing in release 66 changed the screens I audit (the flags ?fluidui and the rest are off by default, so no gain to credit), and the same minor defects are re-observed, plus two new ones. WORKS: target selection is clear in both games (pointing hand or lotus ring, TARGET flag with damage type, brackets; Esc returns to the same menu with 0 targets, run.json afterTargetCancel, every chapter; FFX-2 also shows an ENTER CONFIRM / ESC BACK strip). The enemy-intent card separates SCRIPTED from conditional: Ch I shows the ZOMBIE 50% chip, 'DAMAGE · RANDOM TARGET', per-ally ranges with % HP, and 'Lands on one of these, picked when it acts'. Ch II shows an IF YOU ATTACK block with the miss rule. The Ch IV Bahamut card states the Mega Flare wait honestly ('about 25 seconds on the game's own clock; Slow, Haste and a fallen girl do not change it'). The advisor names a legal action with target and MP cost, and its star marks the owning submenu row. On broken boards the advice stays legal: Mega Phoenix with Kimahri KO in Ch I, and Rikku's change blocked by the Curse notice in Ch IV. KO is shown by a KO tag and a strike-through name as well as colour. Defeat panel (THE PARTY HAS FALLEN, turn, attempt, time, TRY AGAIN / OTHER FIGHT) is readable and the default button moves to OTHER FIGHT after a second loss. Pause plates are full-bleed at 1600, 2000 and 390 with Esc to resume. Real-key flows reached results, confirm, board and reload in every chapter run. PROBLEMS (all minor or polish, none critical or major): (1) Ch I intent card, 1600 and 2000: the card sits over the NOW slot of the turn order ('3RD IN QUEUE' collides with 'NOW', Tidus's portrait ghosts through; PR-0516 re-observed). (2) NEW: on the same card the 'IF YOU ATTACK' header is faded with no body. run.json intentText shows the body is in the DOM (Delay Attack on the Mortiorchis is punished with party-wide Slowga; Protect under 75 percent; Reflect and phase 2 under 50 percent) but it is clipped by the card height until J is held. The conditional half of the intent is therefore invisible by default in Ch I, while Ch II shows its body. (3) NEW: Ch IV CHANGE list on desktop (1600): the unselected row's 'GRANTS: BLUE' is pink on cream and unreadable, and 'GRANTS: GREEN/BLUE' is never explained to a newcomer. (4) Ch I first menu and the retry menu: Seymour's bark box covers SPECIAL, WHITE MAGIC and ITEMS (1600 and phone); in Ch IV the Yuna turn-intro wipe hides the menu on the retry (PR-0502 re-observed). (5) Phone 390x844: the Ch IV CHANGE tiles clip their text ('UNNER' for Gunner, 'GRANTS: BLU'); the pause header wraps into the tab strip, the tab strip is cut ('ACCESSIBI'), and the OPTIONS pane stops at a half row of TEXT SPEED so the later rows, X-2 BATTLE among them, are not visible and there is no scroll cue (PR-0518 re-observed; whether the pane scrolls is not shown). (6) Pause chrome contrast: pixel sampling of the stills gives about 1.9:1 for the 'ECHOES OF SPIRA · FINAL FANTASY X' header, 2.4 to 2.8:1 for BATTLE STATS, SETTINGS, THIS ENCOUNTER and 'H PAINTING ONLY', and 3.5:1 for inactive tabs. The figures are rough because they sample antialiased small text. (7) The default advisor is a one-row chip; the reason, benefit and CURES KO tag live only in the G-folded card (PR-0519, a question for Bailey, carried). run.json cardFirst and advisorMinEffPx (14.2) still describe a card that is not on screen in the default frames. (8) FFX target mode shows no Enter/Esc strip, though FFX-2 does (CHK-020 polish), and the hint strip says 'G Intel' while the panel it opens says GUIDE. (9) The target flag overprints the start of the advisor chip (FFX-2 at 1600 and 2000, PR-0516). The Ch II target card's brackets cross its HIDE text. (10) Intent and guide body text reads about 12 to 13 px at 1600 and about 11 px in the phone intent bar, under the 14 px floor by visual estimate; no DOM sweep exists, so CHK-003 is UNVERIFIED. Carried and not re-measured: PR-0295 (phone prep tabs), PR-0515 (Doublecast says NO MP). Real touch on an ally target is still unaimed (PR-0483, harness).

### onboarding: UNVERIFIED (no number)

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Round 30, live build 2b48cee95. No number, for the fourth review running. The pause ACCESSIBILITY tab (REDUCE FLASHES, COLOUR VISION), the CONTROLS tab and key remapping, the MUSIC tab, text scale and any motion accommodation have no frame in the round-30 evidence. The tabs appear only as labels in the strip, and on the phone the strip is clipped at 'ACCESSIBI', so reaching the tab by touch is unproven. No written accessibility walk exists (PR-0503, carried). Newcomer walkthrough: SIMULATED only, never real. Every route is a scripted real-input run from a fresh profile (Playwright keyboard, plus touch taps on 390x844); no human newcomer, real phone or real controller. WHAT THE STILLS SHOW. The guide teaches the rules of each game: the title strip lists controls; Auron's briefing says 'nothing moves until you act' for FFX and 'the clock keeps running until you pick a command, then it waits' for FFX-2, with ENTER/ESC skip and D never show again, and the briefing reads correctly at 1600, 2000 and on the phone. The coach is three steps (chapter card, 'Your party is ready', start battle) with ESC SKIP THE GUIDE. The FFX-2 first-menu coach ('GAUGES RUNNING · A COMMAND HOLDS THEM', Rikku's line) matches the default WAIT mode, shown as 'WAIT — ATB HELD'. Non-colour cues hold in these frames: KO tag and strike-through, status band words (CURSE ... Holy Water, Esuna, Remedy), dressphere letter badges, key-glyph chips in the Bushido and Swordplay cards, and the pointing hand plus TARGET text. Defects seen: the phone coach 'He strikes first' sits beside a turn-order bar that says Seymour is 3RD IN QUEUE (PR-0487, re-observed on the phone), and on the phone the coach card holds the screen so the E, G and Esc probes did nothing (harness limit, not scored); the keyboard-only hints ESC RESUME and H PAINTING ONLY show on the phone pause (carried); VISUAL STYLE and PRESENTATION 'THE ECHO · B' are unexplained and the FFX options list gives no visible focus row (PR-0508 and PR-0511, carried). Because motion and flash accommodations, text scaling, remapping and colour-vision options cannot be judged, the category stays UNVERIFIED.

### prep: UNVERIFIED (no number)

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Round 30 deep review, live build main 2b48cee95, bundle BwPs1UaV (release 66), https://echoesofspira.com/. I opened no browser; I read the capture owner's evidence (critic/rounds/round-30/evidence, 427 index entries, all mode gpu, 1600x900 / 2000x1012 / 390x844) and the continuity harness's 19 chapter runs (critic/rounds/round-30/continuity, 522 entries) and ran tools only.

SEEN AND PROVED. (1) Results and rewards are understandable and match the sources: Chapter I victory shows AP 10,000 x4 party, gil 6,000, Lv. 4 Key Sphere, per-character S.Lv gains, NEW BEST and CONFIRM (research/ffx-seymour-flux.md section 2: 10,000 AP; the Key Sphere slot is in src/data/ffx/enemies/seymour-flux.ts); Chapter IV shows EXP 1,300, AP 15 per dresssphere, gil 1,000, Gris Gris Bag, per-dresssphere AP progress (src/data/ffx2/enemies/bahamut.ts: EXP 1300, AP 15, gil 1000). (2) A natural defeat is understood and recoverable: Yunalesca seed 2 (138 route turns, 193 engine turns) ends on a Defeat results screen (TURNS, ATTEMPTS, BEST NEVER CLEARED, RETRY, CHAPTER SELECT); a real Enter on RETRY reached party-prep and the retried first menu in about 7 s (index 10:34:22 to 10:34:29). Injected losses (hp 1) in Chapter I and Chapter IV show the pro-defeat card with TRY AGAIN / OTHER FIGHT; TRY AGAIN reached a first menu in 16.5 s (Chapter I, round 66 gap pass 16.2 s) and 9.9 s (Chapter IV, 8.6 s); OTHER FIGHT returned to chapter select (Chapter I). The demo path is 1.7 to 3.2 s (round 66 gap pass). (3) Progress is reliable: after a win the board shows the clear and the same state after a real reload in 19 of 19 chapter runs (continuity) plus 31 of 31 reload captures in the capture owner's runs; the save matrix is unchanged (see CHK-024). (4) Pre-fight CHAPTER tab shows objectives and a sourced TIP per chapter with Auron's coach (17 prep captures).

NOT SEEN, so no number: the prep agency itself. No run opened STATS, SPHERE GRID, EQUIPMENT, ITEMS or OVERDRIVE (FFX) or DRESSSPHERES, ACCESSORIES, ITEMS (FFX-2), changed a value there and showed the change in the first menu; Auron's own line is 'The tabs are for later' and every route skips them. This is the eleventh review with the same open half (PR-0503). The release 62 repair of the booth hold-Home settings reset (PR-0509) was not exercised, and no phone prep walk exists (PR-0295). Meaningful, sourced prep cannot be judged from results screens alone, so I give no number. Cross-references, scored elsewhere: Chapter IV win results silent on the default desktop (PR-0504, audio); the pro-defeat card names no cause at SKIP speed (R30-P2 below, minor). Capture needed is listed in capturesNeeded.

### delivery: UNVERIFIED (no number)

Chief critic, round 30, live build 2b48cee95 (bundle BwPs1UaV). Round 30 deep review, live build main 2b48cee95, bundle BwPs1UaV, artifact hash c4bb4251f0a4e73606e26e0cb5757df0f4eabe2a5daa94a7f4fd6f4ce89e21a3, https://echoesofspira.com/. I opened no browser. Host named: AMD Ryzen 7 7800X3D, NVIDIA GeForce RTX 5070 Ti, 64 GB (confirmed by me on this PC), headless Chromium, PYREFLY_BROWSER=gpu (ANGLE D3D11), 1600x900, warm cache, real network to Cloudflare.

PROVED. (1) Exact artifact (CHK-017): my own verify-live against critic/artifacts/2b48cee95.json (changed-from eaf599d0c, sample 60) = PASS, liveManifest match, 77 files checked, 0 mismatched, 0 missing, 0 wrong type, 0 errors, index.html identical once the Cloudflare analytics beacon is cut out; the live review's full verify-live (7,169 files, 0 mismatched) stands beside it; the live HTML serves index-BwPs1UaV.js and so does dist-release. (2) Shipping references and media (CHK-018, CHK-019): art-derive audit PASS (1,371 literal art names in the bundle, 0 dangling; 38 of 38 strip thumbnails); art-derive verify PASS (5,404 masters, 5,052 pixel-compared); manifest decodeChecked true, audioUnverified 0, 2 flat-colour files both on the intentional list; the diff from release 64 to 66 adds 7 JS chunks and changes index.html only, no art or audio file (bundle 5,043,734 bytes raw, +15,842 vs release 64, 1,445,213 bytes brotli). (3) Console and network: 0 console or page errors and 0 not-found requests in all 33 run.json files (14 capture owner, 19 continuity) and in the round 66 gap runs; /press and the hidden-tab, phone and switch gap runs clean. (4) Complete flows by real input (CHK-022): all 19 chapters won at 1600x900 from the title to results, CONFIRM, post scene where one exists, board, and a real reload that keeps the clear (continuity harness, 0 injected inputs; includes Yunalesca 138 turns, Braska's Final Aeon 284 turns / 27 min, Mirror Aeons 209 turns, Trema 227 turns); Chapters I and IV also at 2000x1012; Chapter IV won on the 390x844 touch run (62 turns, 0 fails). (5) Frame times, 19 chapters, 10,454 s of battle, 1600x900: 57.4 to 60 fps; p99 18.6 to 35.3 ms in 18 chapters; Chapter I 59.8 fps, 0.2 percent frames over 34 ms, max 283 ms (release 64 live round: 321 to 381 ms); Chapter IV 59.8 fps, 1.2 percent, p99 35.3 ms, max 126.5 ms (release 64: 125 to 136 ms); no regression against release 64. Outliers: FFX-2 Trema 57.4 fps, p99 71.2 ms, 2.3 percent slow, max 366.7 ms; single frames of 763 ms (Mirror Aeons), 446 ms (Vegnagun and Shuyin), 367 ms (Trema), 283 ms (Chapter I), 251 ms (Sin core): issues R30-D1 and R30-D2. (6) Saves (CHK-024): SaveData.ts, settings and every storage call are untouched since release 64 (git diff e9907cad8 2b48cee95 shows no persistence file and no new storage call); the round 29 upgrade matrix (12 release fixtures, 20 to 37.1, plus 7 titleArt and visualStyle variants) is reused with that argument; the real-reload board check passes in 19 of 19.

NOT PROVED, so no number. (a) First-load time: no run recorded navigation timing, cold or warm, or on a limited network; CHK-017 asks for under 5 s. My node-side transfer probe (not a browser load) saw the 1.4 MB brotli bundle in 1.5 to 2.7 s from a warm Cloudflare edge and 5.35 s with a 3.5 s time to first byte once on an edge MISS (R30-D3). (b) Browsers and devices: Chromium only; no Firefox, WebKit or Safari play, no real controller, no real phone; the Chapter I phone win was not reached (harness limit PR-0483). (c) First-ability stalls: the probe keeps only the worst frame, not when it happened, so the release 66 claim that first-sight freezes are gone is not shown. (d) A second consecutive Chapter IV loss after TRY AGAIN produced no defeat panel within 40 s in the capture owner's run (harness window, listed in capturesNeeded). Cause list in capturesNeeded.

## Bailey's five visual sub-scores (provisional, outside the weighted score)

characterModels 7 (capped at 7.0 while CHK-026 FAILS), enemyModels 7.9, animation 7 (capped at 7.0), fidelity 8.6, camera 7.5. All five carried: nothing in release 66 changed a painting or a pose registration, so the visual sub-scores do not move; its gains are in motion (animation sits at its cap). enemyModels 7.9: Seymour Flux and Bahamut cut-outs are clean, Mortiorchis still dissolves through a see-through frame. camera 7.5: the boss is still cropped in the Chapter I action shot (PR-0479).

## Target gate

Required 13, matched 9, failing 0, unverified 2, waiting 2. Visual auditor's counts, taken from tools/end-state-board.mjs pair composites in critic/rounds/round-30/targets (title, battle, FFX-2 battle, results, party prep, dialogue, pause, chapter select, boss body, phone defeat). Unverified: the Chapter III settled mid-fight and results, the Chapter XI phone results (tile PR-0201), settled party prep. Waiting: surfaces with no tile in targets.json (the live boss card, PR-0537; demo-only surfaces). Audio and key-art tiles are not screenshot matches.

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | UNVERIFIED | yes | Technical half PASS (qa --strict 43 cues, 0 findings, -16.21 to -16.01 LUFS, worst true peak -1.48 dBTP, loop seams 43 of 43; 319 mp3 decode clean; 300 of 300 audio files hash-equal to the manifest; 0 audio 404s and 0 console errors in 17 snapshot runs). Routing PASS at every sampled moment (title, chapter select and the Chapter I pause cue added by the gap pass). Two minor findings (PR-0532 fanfare restart, PR-0514 synth fallback). The listening half is absent for this mix (PR-0148), so this is not a pass. |
| CHK-002 | UNVERIFIED | yes | Pause full-bleed at 1600, 2000 and 390; 4:3, ultrawide, 1440p and 4K not captured; no getBoundingClientRect figures. |
| CHK-003 | UNVERIFIED | yes | No computed-font-size or clipping DOM sweep exists; intent and guide text reads about 12 to 13 px by eye (about 11 px in the phone intent bar), under the 14 px floor; the pause chrome samples 1.9 to 2.8:1 (PR-0542). The gap pass found a TEXT SIZE slider (115% drew correctly). Not a pass. |
| CHK-004 | PASS | yes | The panel that names an action gives target, location and cost in the five captured first menus; the advisor stays legal on broken boards (Mega Phoenix with Kimahri KO, Chapter IV change blocked by Curse). |
| CHK-005 | UNVERIFIED | no | Two broken boards seen and held up; PR-0515 (Doublecast says NO MP) could not be re-examined. |
| CHK-006 | PASS | yes | Across loss, defeat panel, TRY AGAIN, party prep and the retried first menu no overlay from the lost fight survived; target cancel leaves 0 targets and the same menu. |
| CHK-007 | PASS | yes | No raw ids or debug strings in the frames seen; GRANTS: GREEN/BLUE and THE ECHO - B are unexplained game text (PR-0541, PR-0508). |
| CHK-008 | FAIL | yes | The E intent card covers the current actor's turn-order slot at 1600 and 2000 (Chapter I), the target flag overprints the advisor chip in FFX-2, the Chapter III HP plate covers Yuna's feet (PR-0516). The sweep owes 1280, 1600, 2000 and 2560 across five chapters and nine HUD states and only 1600, 2000 and 390 exist. |
| CHK-009 | FAIL | yes | Phone Chapter IV CHANGE tiles show UNNER for Gunner and GRANTS: BLU; the desktop GRANTS: BLUE row is unreadable (PR-0518, PR-0541). Names elsewhere are shown in full. |
| CHK-010 | PASS | yes | Selected row and target are obvious in every captured menu and target frame (gold or pink fill, pointing hand or lotus ring, TARGET flag, brackets). |
| CHK-011 | PASS | yes | Every targetable enemy visible in the five sampled chapters (Chapter III shows one Yu Pagoda fully and the second partly behind the aeon). Chapters VII to XXVII not sampled. |
| CHK-012 | PASS | no | No fallback or placeholder face on a party member or boss in any sampled still; approved art hashes 917 ok, 0 mismatched. |
| CHK-013 | PASS | yes | Sampled scenes and figures hold at actual size; the other 14 chapters are read from continuity strips only. |
| CHK-014 | PASS | yes | Poses and facing read correctly for the shots sampled; carried polish: the Rikku ready pose (PR-0517) and Tidus's cast pose at the left edge with the damage numeral on his face. |
| CHK-015 | PASS | yes | Real Enter, Esc, arrows, Tab, N, E, G, P, H and R presses drove title to results in Chapters I, II, IV and V and the 19-chapter harness by keyboard; touch Chapter IV passed with the pause chip. Exception stated, not claimed as a defect: in the touch Chapter I run the Esc fallback did not open the pause (P did); a phone has no Esc key and the cause is not established. |
| CHK-016 | PASS | yes | route-index.mjs over the 427-entry index: 0 mismatches between asserted and stale-root screen; the 522-entry continuity index is gpu, injected 0, verified. Five harness-recorded UNVERIFIED entries each carry a cause (three 30-post-scene shots whose scene follows CONFIRM, two touch Esc shots). No wrong-screen shot is used as evidence. |
| CHK-017 | PASS | yes | Chief spot check this review: the live page serves assets/index-BwPs1UaV.js. verify-live against critic/artifacts/2b48cee95.json (changed-from eaf599d0c, sample 60): 77 files, 0 mismatched, 0 missing, 0 wrong type; the live review's full compare of 7,169 files is PASS. Artifact hash c4bb4251f0a4e73606e26e0cb5757df0f4eabe2a5daa94a7f4fd6f4ce89e21a3. First-load time under 5 s is not measured (PR-0520), so the load clause is UNVERIFIED while identity is proved. |
| CHK-018 | PASS | no | art-derive audit: 1,371 literal art names, 0 dangling, 38 of 38 strip thumbnails; verify: 5,404 masters, 5,052 pixel-compared. |
| CHK-019 | PASS | yes | Manifest decodeChecked true, audioUnverified 0, the two flat-colour files (Paine eyeR-catch 1x and 2x) are on the intentional list; 319 mp3 decode with 0 ffmpeg errors (this round); the 2b48cee95 diff adds 7 JS chunks and changes index.html only. |
| CHK-020 | FAIL | yes | Polish: FFX target frames lack the Enter/Esc strip FFX-2 shows and the hint strip calls the guide "Intel" while its panel says GUIDE (PR-0543). Other paired flows match. |
| CHK-021 | PASS | yes | Release note 66 reads Both, Both, Both, Both, FFX-2; MF-01 is guarded by isFfx2 in KeyPoses.ownNextAction and the Chapter I run keeps its own swaps; the eased ATB and Trigger Happy are FFX-2 words off by default (release66-defaults.test.ts, release-notes.test.ts pass). Read from code, tests and swap logs. |
| CHK-022 | PASS | no | All 19 chapters won from the title by real keys to results, CONFIRM, post scene and chapter select with a reload that keeps the clear (continuity harness, injected 0, only setSeed(1) labelled); lose and TRY AGAIN by real keys in Chapter I (first menu in 16.5 s), Chapter IV (9.9 s) and Chapter II seed 2 (natural defeat, about 7 s). The loss flow is shared plumbing exercised in both games; a loss in each of the other 16 chapters, the second consecutive loss in a Chapter IV retry (no defeat panel in 40 s, harness window) and the capture owner's own Braska route (lock window) are not shown, and are listed under requiredNotTested. |
| CHK-023 | UNVERIFIED | yes | PASS half: event logs show the normal runtime invoking boss scripts, Mortibsorption heals, Mega Flare countdown then cast, spherechange through the gate, five Braska summons and the beat clock, KO landing and interlude without changing the event stream or stalling any of 19 chapters. UNVERIFIED half (fourth review running): pad-driven Overdrive input windows (Tidus, Wakka, Lulu, Kimahri) and Yuna's Summon rows in Braska links 3 to 6 (PR-0460) were not exercised in a browser. |
| CHK-024 | PASS | no | SaveData.ts, settings and every storage call are untouched since release 64 (git diff empty); the real-reload board check passes 19 of 19. |
| CHK-025 | NOT APPLICABLE | no | No hidden experiment is in scope and no save write path changed. |
| CHK-026 | FAIL | yes | 489 swap(s) change a head by more than the tolerance (worst 28.8 percent; 9.3 percent where the head is registered); 12 swap(s) of a standing figure move its feet more than the tolerance (worst 10.5 px at 1600 wide); 15 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.765 to 1.261; the bands are tools/posescale/pose-bands.mjs's); 39 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 49.6 px at 1600 wide), whatever stance the registration claims. Strips read: Chapter I Auron follow to idle, Kimahri KO to idle, Chapter IV Rikku ready to attack and Paine attack to follow (read by the chief), Paragon idle to cast, Braska Lulu ready to cast. PASS in Vegnagun, Natus, Omnis, Isaaru and Den of Woe. The harness cannot tell a rig-bone head read on a 35 px head from a visible size change. |
| CHK-027 | FAIL | yes | 115 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 200.5 px). Snaps 0 a minute (a classification: 73 of 75 hard cuts excused as planned smears, PR-0530); 3,474 ms of see-through a minute (PR-0379). Chapter I and Yojimbo, Natus and Omnis PASS. |
| CHK-B1 | UNVERIFIED | yes | Only music has an owner number (7/10, 2026-10-13, D-804), older than three re-rendered victory cues, five SFX files, 245 voice lines and the conference sound pass; D-1310 forbids a score without ears. |
| CHK-B2 | UNVERIFIED | no | Bailey's verdict on the hard-cut hit poses, the pro camera shots, the one-frame impact inversion and the Mega Flare detonation is not recorded (PR-0530, PR-0548). |

## Continuity harness (CHK-026, CHK-027)

Harness 9cc8f27cd66e, run from the release tree D:/pyrefly-release55 (head e50a2b22d, records only since 2b48cee95; pose table unchanged), PYREFLY_BROWSER=gpu, 19 chapters, 10453.9 s of battle. continuity harness (CHK-026/CHK-027): 19 chapter(s), 10453.9 s of battle, 57.4 to 60 fps, 19 of 19 run by the dedicated harness; CHK-026 FAIL (489 swap(s) change a head by more than the tolerance (worst 28.8 percent; 9.3 percent where the head is registered); 12 swap(s) of a standing figure move its feet more than the tolerance (worst 10.5 px at 1600 wide); 15 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.765 to 1.261; the bands are tools/posescale/pose-bands.mjs's); 39 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 49.6 px at 1600 wide), whatever stance the registration claims); CHK-027 FAIL (115 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 200.5 px)); 3,474 ms of see-through a minute (208.5 frames a minute at 60 Hz) Read by harness 9cc8f27cd66e (35 files; tree D:/pyrefly-release55 at e50a2b22d; policy 70ab3c4d; probe v2 fb288c17; pose table 9f168c0f (114 subjects); waivers bf0731fb (79 rows)).

## Encounters

- **seymour-flux**: real flow complete; victory (53 and 54 turns at 1600x900 and 2000x1012 by the capture owner; 53 turns in the continuity harness); lose and TRY AGAIN by real keys. Chapter I FFX, live build index-BwPs1UaV, seed 1, 1600x900 (and again at 2000x1012, both victories, 53 and 54 turns). Title -> chapter select -> prep -> pre-scene (Esc over scene) -> fight (advisor N, intent E, guide G, pause Esc/Tab/options, single target and cancel, Bushido) -> results -> confirm -> post scene -> chapter select -> reload keeps the clear. Lose and TRY AGAIN by real keys (lose injected via hp 1): defeat panel -> Try again -> party-prep -> battle first menu in 16.5 s -> second loss -> OTHER FIGHT -> chapter select. Evidence: seymour-flux-win, seymour-flux-win-2k, seymour-flux-lose, seymour-flux-lose-retry. The 390x844 touch run (seymour-flux-win-phone-touch) lost the fight (the route could not reach Poison Fang in the phone Items list and fell back to Attack; harness limit, not claimed as a product defect) and then retried to a first menu. Mortiorchis phase seams covered by the continuity sequences.
- **yunalesca**: real flow complete; victory (138 turns, continuity harness; 130 turns with R held by the capture owner, seed 3); a natural defeat at seed 2 and a real retry. Won by real keys in both the harness and the capture owner's run; results, confirm, post scene (There. Now no one can summon it.), chapter select, reload. Seed 1 of the owner route stalled at its window (harness).
- **braskas-final-aeon**: real flow complete; victory (284 turns, 27:27, seven links, six seams, all five summons fired, Pray and Energy Rain in the possession links; continuity harness). The capture owner's three attempts stalled at the 9 min 10 s lock window (UNVERIFIED there; the turn count rises steadily); the continuity harness won the chapter by real keys to results, confirm and chapter select. Results AP 0 and gil 0 match the sourced all-zero records noted in src/data/encounters.ts. Yuna's Summon rows in links 3 to 6 are not shown (PR-0460).
- **ffx2-bahamut**: real flow complete; victory at 1600x900, 2000x1012 and 390x844 touch; loss and TRY AGAIN to a first menu in 9.9 s. Chapter IV FFX-2, seed 1: victory at 1600x900 (61 turns, plain route), 2000x1012 (R held, 61 turns) and 390x844 touch (62 turns, pause chip path fine, fails 0). Scripted spherechange Rikku Dark Knight -> Warrior at seq 24 and the spherechange frame sequence captured. Results -> confirm -> scene -> chapter select -> reload. Lose and TRY AGAIN: hp 1 / mp 0 with ATB Active fast, defeat panel after 20 s, Try again -> party-prep -> battle first menu in 9.9 s (boss bahamut, new seed 1486389935). The second loss in the retry did not produce a defeat panel within 40 s (harness window: UNVERIFIED, not a defect; r66 gap pass covered the second slab).
- **ffx2-vegnagun-shuyin**: real flow complete; victory (104 turns with R held; 88 turns in the continuity harness), five links, post scene, chapter select. Chapter V FFX-2, five-link chain. Seed 2 with R held: victory in 104 turns (365 s fight), 4 seams, post scene (23 taps, 'Listen to me. She asked me to') -> chapter select (ffx2-vegnagun-shuyin-win-ffb). Seed 1 plain route stalled at link 4 at the 8 min budget (UNVERIFIED, harness budget), seed 1 with R stalled at link 5 at 8.3 min (UNVERIFIED, harness budget). Not played at 2000 or 390 wide.

## Coverage matrix

Tested:

- Live exact artifact (verify-live sample, the live review's full compare, chief curl of the bundle), art-derive audit and verify, manifest decode, 0 console errors and 0 not-found in 33 run files.
- All 19 chapters won by real keys from the title to results, CONFIRM, post scene and a reload that keeps the clear (continuity harness, injected 0, 10,454 s of battle, 57.4 to 60 fps); Chapters I, II, IV and V also by the capture owner; Chapters I and IV at 2000x1012 and 390x844 touch.
- Loss and TRY AGAIN by real keys in Chapters I, II (seed 2), IV and the phone Chapter I; defeat card, OTHER FIGHT, reload.
- Engines: 15 probe and measure outputs re-run and byte-identical to round 29; full unit suite; Chapters I to V first menus, intent, guide, target, pause, results.
- Audio: qa --strict, decode of 319 mp3, manifest hashes, themes audit, 17 snapshot runs, title, chapter-select and pause cue by the gap pass.
- Strips and frame sequences read by the continuity harness, the first-time fan (about 35 strips, 11 frame sets) and the chief (Rikku ready to attack, Paine attack to follow).

Reused (with the dependency argument):

- Save migration matrix (CHK-024): from critic/rounds/round-29.json. No persistence file or storage call changed since e9907cad8; fresh 19-of-19 reload check.
- PR-0148, PR-0099, PR-0504 (audio), PR-0295, PR-0515, PR-0523, PR-0526, PR-0527 (carried, not re-examined): from critic/rounds/round-29.json. Dependency arguments on each entry: no audio, HUD, prep or phone layout file changed between e9907cad8 and 2b48cee95; labelled reused and never used for a PASS.
- Story text of Chapters VI to XVIII and Chapter V's script: from critic/rounds/round-29.json and 27/28. git diff of src/story and research/writing-bible.md empty; frames of all 19 post scenes seen this round.

Not tested:

- Firefox, WebKit and Safari play, a physical controller, a real phone, 4K, 4:3 and ultrawide, booth-PC timing and human-paced play.
- Pad-driven Overdrive input windows, Yuna's Summon rows in Braska links 3 to 6, the Mega Flare detonation and the physical attack cycle as 60 fps clips, MF-09 knock-out landing and MF-02 first-sight freezes in a valid capture, FFX-2 Active mode with a hidden tab.
- Prep tabs, pause ACCESSIBILITY, CONTROLS and MUSIC tabs, remapping, text scale and flash options by real input; phone prep tabs; the booth reset.
- First-load navigation timing, cold cache.
- Bailey's listening and feel judgments.

Required and not tested:

- CHK-023 pad-driven Overdrive windows and Braska links 3 to 6 Summon rows (UNVERIFIED mandatory).
- CHK-003 computed font-size and clipping sweep; CHK-008 panel-against-sprite sweep at 1280x720 and 2560x1440; CHK-002 other viewports.
- CHK-B1 owner listening verdict.
- Onboarding, prep and delivery category evidence (accessibility and prep walks, first-load time, other browsers).
- Loss and retry in the 16 chapters other than I, II, IV; the second consecutive loss of a Chapter IV retry.
- Capture-owner gap items not captured this pass: Chapter III settled mid-fight at 2000x1012, Chapter XI phone results, 144 Hz cut-in settle and awaitingMenu, Vegnagun swap-099 strip (lunge or pop), CHK-008 sweep.

## Ranked issue list (50 entries, 48 open)

### PR-0459 [major, visual, open] Chapter I (FFX): Auron's head changes 7 and 9 percent at two swaps in the killing-blow close-up (CHK-026 FAIL, still open)

- Game / chapter / state: FFX only (Chapter I); seymour-flux; Chapter I killing-blow close-up, Auron attack, follow and idle poses
- Observed: Auron attack to follow head x0.9238 and follow to idle head x1.0933 (registration), height x0.9537, at the Seymour Flux killing blow with the pro camera. Round 29 read x0.9295 and x1.0948 at the same swaps, so the issue stays open at the same severity across two reviews. The rendered strip shows a close-up with a bright flash.
- Expected: Head within 3 percent at a pose swap
- Repro: https://echoesofspira.com/, Chapter I, play to the killing blow by real keys, seed 1; the harness run is critic/rounds/round-30/continuity/seymour-flux-win-r30, swaps 367 and 369.
- Evidence: critic/rounds/round-30/continuity/seymour-flux-win-r30/continuity/strips/swap-369-auron-follow-idle.jpg
- Confidence: high
- Requirement: CHK-026, RUBRIC 6a
- Smallest fix: Method check first (RUBRIC section 8: the same issue is open after two reviews). Register Auron's follow painting so its head matches idle at the close-up, or hold the pose swap until the camera cut frame.
- Acceptance check: Harness run of Chapter I: CHK-026 PASS, with Auron's two swaps within 3 percent.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Same swaps, same values as round 29 (x0.9295 and x1.0948 then, x0.9238 and x1.0933 now): open across two deep reviews, so the stagnation rule (RUBRIC section 8) asks for a written method check before a third try.

### PR-0380 [major, feel, open] CHK-027 still FAILS in 15 of 19 chapters: 115 pose swaps jump 40 px or more in one frame (96 on steady frames, worst 200.5 px), outside the two conference-pack chapters

- Game / chapter / state: both (FFX: Yunalesca, Braska, Anima, Evrae, Sin core; FFX-2: Vegnagun and Shuyin, Leblanc, Trema, Fallen Aeons, Ixion); 15 of 19; worst Vegnagun 200.5 px (boss tail), Sin core 171.5, Trema 117, Braska 103.7, Yunalesca 102.3; attack to follow, KO and hurt swaps; critic/rounds/round-30/continuity/continuity-summary.json motion.swapJerksOverFail 115, jerksOverFail 288, dashes 173 (reported, not gated)
- Observed: Whole-fight harness on the live build, seed 1, 1600x900, 57.4 to 60 fps, 19 chapters, 10,454 s: snaps 0 a minute (round 29: 4.67 in Chapter I and 7.51 in Chapter IV; the same cuts counted by an older tree, see PR-0530), 288 jerks over the 40 px line, 115 of them at a pose swap (96 on steady frames, 19 on slow frames). The two pack chapters are the clean ones (Chapter I worst swap jerk 32.8 px against 1,275 px in round 29, Chapter IV 45 px against 79 px). The first-time fan opened strips for the worst ones: Auron zips 112.8 px sideways and shrinks (Chapter I jerk-009), Tidus 125.7 px with an extra Rikku appearing (Anima jerk-000), Leblanc breaks into four see-through copies (jerk-003), x2 Ixion into three, a Sin fin 171.5 px. The 200.5 px Vegnagun step is a tail crossing the frame inside a white bloom, so it may be a designed whip: the harness cannot tell and no one read the strip as a lunge or a pop.
- Expected: CHK-027: a pose swap moves the weighted point no more than 40 px in a frame unless the camera cuts (RUBRIC 6a).
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/continuity-summary.json; critic/rounds/round-30/continuity/fails.json; critic/rounds/round-30/continuity/ffx2-vegnagun-shuyin-win-r30/continuity/strips/jerk-000-vegnagun-tail.jpg; critic/rounds/round-30/continuity/seymour-flux-win-r30/continuity/strips/jerk-009-auron.jpg; critic/rounds/round-30/continuity/ffx2-leblanc-win-r30/continuity/strips/jerk-003-leblanc.jpg
- Confidence: high on the counts (summary and strips agree); medium on whether the 200 px tail step is designed
- Requirement: CHK-027, RUBRIC 6a (Bailey, 2026-10-04: pose changes "snapping around in a discontinuous half motion")
- Smallest fix: Read the worst strip per chapter first to split designed lunges and whips from pops (the Vegnagun tail first); for pops give the swap the pack's treatment (cut on the motion peak with a smear, or a one-frame hold); list designed whips in the pose waivers with their reason.
- Acceptance check: Harness, all 19 chapters: swapJerksOverFail 0 outside waived rows; strips of the old worst five show no body jump.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merges the visual auditor's CHK-027 entry, the feel auditor's R30-F2 and the first-time fan's jerks-and-teleports breaker (8 chapters). Release 66 made the two pack chapters clean on this measure.

### PR-0379 [major, feel, open] 81 percent of pose swaps are see-through cross-dissolves: 3,474 ms of ghosting a minute, worst 5.5 s in Trema; the fan saw two bodies on screen in every chapter it opened

- Game / chapter / state: both; all 19 (worst Trema 5,497, Omnis 4,982, Ixion 4,942 ms a minute; Chapter I 1,689; Chapter IV 1,505); continuity-summary.json motion.ghostSwaps 10,283 of 12,623, ghostFrames 36,338, ghostMsPerMinute 3,474, worstGhostSeverity 0.366, ghostOverFail 0
- Observed: Strips show the outgoing and incoming pose both drawn for 3 to 5 frames: Kimahri KO to idle, Paine hurt to cast and cast to hurt (10 pairs in one Chapter IV fight: a hard cut under the flash, then a 3-frame ghost back 0.4 s later), Rikku and Paine attack to follow, Yunalesca cast to idle (her whole picture shifts, head real x0.89), Mortiorchis idle to attack (shrinks to x0.92 and changes body), Anima, Yojimbo (8 ghost frames). The fan counted this on 27 of about 35 strips in every chapter it opened. Release 66's MF-01 removed the girls' ready, idle, cast blip (Chapter IV see-through frames 147.9 to 90.0 a minute; 0 idle blips between ready and cast) and moved nothing for the other swap classes: Chapter I is 101.5 frames a minute (release 64: 101.7). No single swap crosses the 0.4 fail line.
- Expected: A pose change reads as one figure moving; no frame shows two figures (RUBRIC 6a, first-time-fan lens).
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/continuity-summary.json; critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/ghost-268-paine-attack-follow.jpg; critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/swap-051-paine-cast-hurt.jpg; critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/swap-053-paine-hurt-cast.jpg; critic/rounds/round-30/continuity/seymour-flux-win-r30/continuity/strips/swap-010-kimahri-ko-idle.jpg; critic/rounds/round-30/continuity/yunalesca-win-r30/continuity/strips/ghost-133-yunalesca-cast-idle.jpg
- Confidence: high (harness numbers and strips agree; I read two Chapter IV strips myself)
- Requirement: RUBRIC 6a CHK-027; Bailey 2026-10-04 on discontinuous pose changes
- Smallest fix: Use release 66's own B switches (?swapcause, ?swapclass, ?stance, ?hurtstring) on the hurt, cast, follow and revive classes, show Bailey the pairs, and give the chosen class a cut-or-short-blend in the 17 chapters outside the pack.
- Acceptance check: Harness ghostMsPerMinute under 1,000 in every chapter, ghostOverFail 0; strips of the worst five swaps show one figure in every frame; Chapter IV cast, hurt, cast pairs under 3 a fight with no ghost on the return.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merges PR-0379, the feel auditor's R30-F4 (cast to hurt and back), and the fan's ghosting, boss-popping (Yunalesca, Mortiorchis, Anima) breakers. One root: the swap blend.

### PR-0531 [major, visual, open] Beyond Auron: figures change height or head size 10 to 18 percent at some pose swaps (Paine, Rikku, Yuna; CHK-026 FAIL on height, stance and rig head)

- Game / chapter / state: both (FFX: Yuna; FFX-2: Paine, Rikku); ffx2-bahamut (swap-211, swap-128), ffx2-leblanc (swap-551), ffx2-vegnagun-shuyin (swap-099), ffx2-trema (swap-356), yunalesca (swap-843); Paine attack to follow, ready to item; Rikku attack to follow, hurt; Yuna hurt to critical, idle after cast
- Observed: Harness: 15 swaps outside the height band read from pixels (Rikku hurt x0.879, 9 swaps in Leblanc; Yuna idle after cast x0.883 to x0.896, 6 swaps in Chapters IV, XI and XVI), 39 swaps move the silhouette's own stance more than the tolerance (worst 49.6 px), 12 move the feet. Strip I read myself: Paine attack to follow in Chapter IV reads real head x0.8172, height x1.0763, three ghost frames under a flash. The fan read the same class in five strips: Paine ready to item x0.87 (real head x1.29, the figure changes stance and costume palette over the dissolve), Paine attack to follow x1.08 (head x0.82), Rikku attack to follow x1.16 (Vegnagun) and x0.98 with head x1.09 (Trema), Yuna hurt to critical x1.14. The registered-head metric passes these by construction (control x0.9999), which is why the harness's 489 head fails are mostly a different thing (PR-0534).
- Expected: A figure keeps its size across a pose change: head within 3 percent, height inside the band, feet within 2 px at 1600 wide (CHK-026).
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/swap-211-paine-attack-follow.jpg; critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/swap-128-paine-cast-od-x2-warrior-armor-break.jpg; critic/rounds/round-30/continuity/ffx2-leblanc-win-r30/continuity/strips/swap-551-paine-ready-item.jpg; critic/rounds/round-30/continuity/ffx2-vegnagun-shuyin-win-r30/continuity/strips/swap-099-rikku-attack-follow.jpg; critic/rounds/round-30/continuity/fails.json
- Confidence: medium (independent pixel readings and the fan's strips agree; whether some of these rows are in the 242 waived stature swaps was not checked)
- Requirement: CHK-026, RUBRIC 6a (Bailey 2026-10-04: "characters change size and height across poses ... ruins the immersion")
- Smallest fix: List the failing swaps with their waiver status first; for the rest re-register the pose painting to the idle's head and ground line (or give the swap a cut) and re-run the harness; the fix is registration, never a repaint on taste.
- Acceptance check: Harness: height, stance and feet fails 0 outside written waivers on Chapters IV, V, VII, IX, XI, XVI and Yunalesca; strips of the five named swaps show one size.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merges the visual auditor's height-band entry (minor) and the fan's size-jump breakers; raised to major because it is the owner's own named complaint and the mandatory check CHK-026 fails on three independent readings.

### PR-0517 [major, visual, open] FFX-2 Chapter IV: Rikku Dark Knight's and Paine Warrior's ready poses read as different figures from their attack and idle poses (colour, size, costume), and Paine's ready pose floats (carried)

- Game / chapter / state: FFX-2 only; ffx2-bahamut; 
- Observed: Re-observed in the strip I read: Rikku ready to attack (swap-131) shows a pale, dim figure standing small on the left for the 10 frames before the swap, then a bright, saturated, lunging figure; the visual auditor also records the Rikku ready pose smaller and darker than her attack pose (CHK-014). The harness sees head x0.9993 and feet 0 px, which is why this is a visual judgment, not a harness fail. Paine's ready strip (swap-286) was not re-read.
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/swap-131-rikku-ready-attack.jpg
- Confidence: medium (one strip read by me, the visual auditor agrees; Paine's half not re-read)
- Requirement: RUBRIC 6 visual: costume and pose consistency; approved art protected: judge how it renders
- Smallest fix: Ask Bailey whether he wants the ready poses repainted or a registration/lighting match on the existing paintings (hard rule 10: no build without his yes). Never replace approved art on taste.
- Acceptance check: Ready to attack strips for Rikku and Paine show one costume colour and size; Bailey's yes recorded.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json PR-0517: No painting or pose file changed since e9907cad8 (git diff public/art-bearing code empty; verify-approved 917 ok); re-observed in a fresh strip, so partly fresh.

### PR-0148 [major, audio, open] No numeric owner listening verdict covers the shipped mix (carried PR-0148; an evidence gap, not a player defect)

- Game / chapter / state: both; all; 
- Observed: The only number is the music's 7/10 of 2026-10-13 (D-804). It predates three re-rendered victory cues, five SFX files, 245 voice lines and the conference sound pass; SFX, voice and the pass have no score; D-1310 forbids a score without ears. docs/audio/OWNER-VERDICT.md has nothing after 2026-09-28.
- Expected: RUBRIC audio: Bailey's listening assessment; CHK-B1
- Repro: Read docs/target/decisions.json D-804, D-809, D-1310 and docs/audio/OWNER-VERDICT.md.
- Evidence: docs/target/decisions.json (D-804, D-1310); docs/audio/OWNER-VERDICT.md
- Confidence: high
- Requirement: RUBRIC audio: Bailey's listening assessment; CHK-B1
- Smallest fix: Bailey listens to docs/audio/audition.html (delegated picks, sound pass, victory cues) and gives a 0-to-10 number for music, SFX and voice, recorded verbatim in OWNER-VERDICT.md.
- Acceptance check: A dated verbatim numeric verdict that names the build or cue set it covers is recorded; the category then scores.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried, thirteenth review. An evidence gap (agents cannot hear, rule 13), not a player defect; it keeps audio UNVERIFIED.
- Reused: critic/rounds/round-29.json PR-0148: git diff e9907cad8 2b48cee95 -- public/audio src/audio is empty and docs/audio/OWNER-VERDICT.md and decisions.json carry no newer numeric verdict.

### PR-0295 [major, interface, open] Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; the phone prep tabs were not captured again)

- Game / chapter / state: both; party-prep on 390x844; 
- Observed: No phone prep-tab capture exists in 949 index entries; every route skips the tabs. The finding stands from round 29 on unchanged prep code (r66 changed no HUD, prep or pause file).
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/evidence/index.json
- Confidence: low (not re-examined)
- Requirement: RUBRIC 6 interface and onboarding: device usability
- Smallest fix: As in the round-29 entry.
- Acceptance check: As in the round-29 entry.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json: No code, asset or setting this item depends on changed between e9907cad8 and 2b48cee95 (r66 touched presenter, camera, rig and measuring code only); labelled reused, not a fresh observation.

### PR-0473 [minor, feel, open] PR-0473 (carried, re-observed) and MF-09 unverified: a revive is a dissolve with no rise, and the new knock-out landing has no valid strip

- Game / chapter / state: both; Chapter I Kimahri revive (swap-010); knock-out landing unseen; seymour-flux-win-r30/continuity/strips/swap-010-kimahri-ko-idle.jpg; swap-006-kimahri-idle-ko.jpg
- Observed: The lying Kimahri dissolves through 3 ghost frames and a standing figure rises through the ghost; the KO swap strip tracks Seymour (camera on the boss) so the landing is unseen. The release note's claim that the thud and squash land on the arrival frame is therefore unverified in a frame sequence on the live build.
- Expected: A body falls onto the cut and rises on a revive (release 66 MF-09).
- Repro: Chapter I, seed 1: Kimahri is down on turn 0 (Mega Phoenix revives him); harness frame 1972 and 3202.
- Evidence: critic/rounds/round-30/continuity/seymour-flux-win-r30/continuity/strips/swap-010-kimahri-ko-idle.jpg; critic/rounds/round-30/continuity/yunalesca-win-r30/continuity/strips/swap-896-wakka-ko-idle.jpg; critic/rounds/round-30/continuity/mirror-aeons-win-r30/continuity/strips/swap-137-lulu-ko-idle.jpg; critic/rounds/round-30/continuity/braskas-final-aeon-win-r30/continuity/strips/swap-172-ixion-hurt-ko.jpg
- Confidence: medium
- Requirement: release 66 MF-09; PR-0473
- Smallest fix: Capture a Tidus or Rikku KO at 60 fps with the right figure tracked; give the revive a rise key or a cut.
- Acceptance check: A strip of a KO and of a revive with one figure in each frame and the landing on the arrival frame.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Extended with the fan: a knock-out and a revive swap between a lying and a standing painting, so the size changes 2 to 3 times (Kimahri x2.09, Wakka x2.62, Auron x3.30, Lulu x3.16 on revive; Ixion x0.66 and a Leblanc goon x0.39 going down) with a dissolve and no get-up or fall motion; and the Chapter I Mega Phoenix pop (the KO tag leaves, a see-through Kimahri is solid one frame later). Lying-versus-standing size is natural; the missing rise and fall is the defect.

### PR-0481 [minor, feel, open] Time to the first command: 43 s in Chapter I and 27 s in Chapter IV from picking the chapter (pre-scene read included); a retry takes 16.5 s and 9.9 s, with no split of load, card and opening (carried, re-measured; downgraded from major)

- Game / chapter / state: both; seymour-flux, ffx2-bahamut; critic/rounds/round-30/evidence/seymour-flux-lose-retry/run.json (first menu 43,230 ms, retry 16,480 ms), ffx2-bahamut-lose-retry/run.json (26,595 ms, 9,924 ms)
- Observed: Public-path retry is 10 to 16 s; the run keeps only the screens seen (pro-defeat, party-prep, battle), so the dead part cannot be separated from the card hold (2.7 s), the opening enemy action and the real key at party prep.
- Expected: A retry reaches the next decision in a few seconds (RUBRIC feel: respectful replay); round 29 read 3 to 4 s on the demo path.
- Repro: Lose Chapter I with hp 1 injection, press TRY AGAIN, read pressToMenuMs.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-30/evidence/ffx2-bahamut-lose-retry/run.json; D:/Tools/pyrefly-scratch/2026-10-28/r66/gaps/defeat/ch1-public.json
- Confidence: medium
- Requirement: RUBRIC feel and prep; PR-0481
- Smallest fix: Record a timestamped step list for retry (prep shown, card up, card leaving, first menu); then decide whether prep or the card is skippable on a retry.
- Acceptance check: Retry to first menu under 8 s in both games on the public path, with the split recorded.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merges the delivery auditor's R30-P1 (Chapter I TRY AGAIN 16.5 s, 16.2 s, 16.1 s against 1.7 s in the demo and 9.9 s in Chapter IV). Downgraded from round 29's major: the demo path it described is now 1.7 to 3.2 s, and the public figures include scene reading time; nothing here fails a flow. Needs Bailey's yes before any build (hard rule 10): on attempt 2 and later let Enter skip the voiced Chapter I opening.

### PR-0479 [minor, visual, open] Chapter I action shot crops Seymour Flux's head out of the frame (carried PR-0479)

- Game / chapter / state: FFX only; seymour-flux; mid-fight camera
- Observed: In the mid-fight still, the boss's head is above the top edge under the turn order; the settled menu shots frame him whole.
- Expected: The boss's head in frame
- Repro: Chapter I mid-fight, 1600x900, seed 1.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/23-midfight.png
- Confidence: high
- Requirement: CHK-013, CHK-014
- Smallest fix: Frame the pro camera's action shot for the boss's full height.
- Acceptance check: A mid-fight capture of Chapter I with Seymour's head in frame.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0516 [minor, visual, open] Panels over painted actors and live controls (CHK-008 FAIL; carried): the E intent card over the current actor's turn-order slot, the target flag over the advisor chip, the Chapter III HP plate over Yuna's feet, and the Guide, intent and advisor panels together over two thirds of the stage in Yunalesca, Braska and Vegnagun

- Game / chapter / state: both; seymour-flux, yunalesca, braskas-final-aeon, ffx2-bahamut, ffx2-vegnagun-shuyin; party staging versus the HUD plates
- Observed: Interface auditor: the Chapter I E card covers the NOW slot at 1600 and 2000 (3RD IN QUEUE collides with NOW), the target flag overprints the advisor chip in FFX-2, the Chapter II target card's brackets cross its HIDE text. Visual auditor: in Chapter III at 1600x900 Tidus's HP plate covers Yuna's lower skirt and feet (one capture, not at 2000x1012). First-time fan: with the Guide, Next Best Move, Physical damage, Enemy Move queue and menu open the boss is small in its target box in Yunalesca and Braska and the Vegnagun tail sits behind the Acts-next panel; the capture owner notes these panels were opened by the harness (E, G), while the Guide opens by default in a few chapters (PR-0523), so the fan's severity (major) is not adopted: player toggles, not the default frame.
- Expected: No panel over a party member's feet
- Repro: Chapter III, seed 1 to the first mid-fight state at 1600x900; evidence braskas-final-aeon-win-ff/23-midfight.png. One capture; not seen at 2000x1012.
- Evidence: critic/rounds/round-30/evidence/braskas-final-aeon-win-ff/23-midfight.png; critic/rounds/round-30/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-30/evidence/yunalesca-win-ff/16-target-single.png; critic/rounds/round-30/evidence/ffx2-vegnagun-shuyin-win/23-midfight.png
- Confidence: medium
- Requirement: CHK-008
- Smallest fix: Run the CHK-008 panel-against-sprite sweep at 1280, 1600, 2000 and 2560 for Chapters I to V; move the Chapter III party slot or cut the plate where a sprite overlaps; keep the intent card off the turn-order slot.
- Acceptance check: CHK-008 sweep reports 0 panel-over-sprite hits in the five chapters and nine HUD states.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Merges R30 visual (Chapter III plate), interface (PR-0516 re-observed) and the fan's UI-covering breakers.

### PR-0502 [minor, interface, open] PR-0502 (carried, re-observed, now also on retry): bark boxes and turn-intro wipes cover the first menu

- Game / chapter / state: both (the shared first-menu surface); seymour-flux, ffx2-bahamut; 
- Observed: Seymour's 'It's quieter on the other side.' box hides SPECIAL, WHITE MAGIC and ITEMS at the first menu at 1600 and on the phone, and again at the retry's first menu. The Ch IV retry's first menu is under Yuna's full-height portrait wipe.
- Expected: The first menu is usable while barks and wipes play, or the menu waits for them.
- Repro: Live build, Ch I seed 1, 1600x900: reach the first menu; also the Try again route.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/10-first-menu-coach.png; critic/rounds/round-30/evidence/seymour-flux-lose-retry/3-retry-menu.jpg; critic/rounds/round-30/evidence/ffx2-bahamut-lose-retry/3-retry-menu.jpg
- Confidence: high that it covers rows, not measured for how long
- Requirement: CHK-008
- Smallest fix: Place barks above the command rows, or hold the cursor until the box clears.
- Acceptance check: A frame-timed first menu where every command row is visible while a bark plays.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0518 [minor, interface, open] PR-0518 (carried, re-observed): phone 390x844 CHANGE tiles clip their text and the pause options pane is cut

- Game / chapter / state: both (shared pause, FFX-2 CHANGE); ffx2-bahamut; 
- Observed: Ch IV CHANGE: 'UNNER' and 'WARRIOR GRANTS: BLU' cut at the tile edges, with the tile bodies empty. Pause: the title wraps into the tab strip, tabs read 'ER GUIDE OPTIONS ACCESSIBI', and the OPTIONS pane shows three rows and a half row of TEXT SPEED, hiding the rest (EYE CANDY, VISUAL STYLE, X-2 BATTLE, ATB SPEED, STRATEGY GUIDE, BATTLE HELP, PRESENTATION) with no scroll cue.
- Expected: Names and values in full on a phone; every setting reachable.
- Repro: Live build, Ch IV, 390x844 touch: CHANGE; Esc then the OPTIONS tab.
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-30/evidence/ffx2-bahamut-win-phone-touch/14-pause-options.png
- Confidence: high for the clipping; medium that the pane does not scroll (scroll was not exercised)
- Requirement: CHK-009, CHK-003, CHK-002
- Smallest fix: Wrap tile text inside the tile, and give the options pane a visible scroll cue or a taller area.
- Acceptance check: A 390x844 capture of CHANGE with full names and of OPTIONS with a visible scroll cue; scrolling shows every row.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: The fan adds that on a 390x844 screen the battle picture is about a third of the screen and in target mode the boss card hides the party (phone captures 23-midfight and 16-target-single).

### PR-0487 [minor, onboarding, open] PR-0487 (carried, re-observed on the phone): 'He strikes first' coach against a turn order that puts Seymour third

- Game / chapter / state: FFX only (Chapter I); seymour-flux; 
- Observed: At the Ch I phone first menu the coach says 'He strikes first. Weather it, then hit back.' while the intent bar says SEYMOUR FLUX 3RD IN QUEUE and Tidus acts first. The tip was false in 25 of 100 seeds in round 29.
- Expected: The coach agrees with the turn order shown.
- Repro: Live build, Ch I, seed 1, 390x844 touch, first menu.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win-phone-touch/12-intent-E.png
- Confidence: high
- Requirement: Rubric 6: optional help teaches faithful, accurate rules
- Smallest fix: Choose the line from the actual first-actor result.
- Acceptance check: Across 100 seeds, the line appears only when the first actor is Seymour.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0503 [minor, process, open] Prep, accessibility and onboarding have no number and were never walked (carried, twelfth review): the prep tabs (STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSSPHERES, ACCESSORIES, phone tabs, hold-Home reset) and the pause ACCESSIBILITY, CONTROLS and MUSIC tabs, remapping, text scale and motion and flash options

- Game / chapter / state: both; all; party-prep and pause; 
- Observed: No capture in 949 index entries opens a prep tab other than CHAPTER; the round-30 gap pass saw the pause tab strip (TIDUS ... ACCESSIBILITY, CONTROLS, MUSIC) and changed only TEXT SIZE (1 to 1.15) by real keys: its later key script missed the other rows, so no fault is shown. On the phone the tab strip is cut at ACCESSIBI. The release 62 booth reset (PR-0509) was not exercised. The stagnation rule is tripped (open in more than two reviews).
- Expected: Each tab is walked at 1600 and on the phone and its settings are shown changed by real input.
- Repro: Live build, any chapter, Esc, then the ACCESSIBILITY, CONTROLS and MUSIC tabs at 1600 and 390.
- Evidence: critic/rounds/round-30/evidence/gaps/desk-access-after.jpg; critic/rounds/round-30/evidence/gaps/desk-pause-5-Options.jpg; critic/rounds/round-30/evidence/index.json
- Confidence: high that the evidence is absent
- Requirement: Rubric 6 onboarding, CHK-015
- Smallest fix: Method check before a third try (RUBRIC section 8): add one prep-walk capture per game (desktop and phone) that opens each tab, makes one change, starts the fight and reads the effect, then hold-Home reset; and one pause walk that sets REDUCE FLASHES, COLOUR VISION, REDUCE MOTION and a key remap by real input.
- Acceptance check: A run.json with the prep and accessibility walks and the changes visible in the next frames.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merges the interface auditor's PR-0503, the delivery auditor's R30-P3 (PR-0509, PR-0295 half-evidence) and the gap pass.

### PR-0540 [minor, interface, open] R30-INT-01: Chapter I intent card shows the IF YOU ATTACK header with no body (the conditional half is clipped until J is held)

- Game / chapter / state: FFX (Chapter I; the FFX-2 Bahamut card is unaffected); seymour-flux; 
- Observed: At 1600x900 and 2000x1012 in Ch I the E card shows the certain part (Lance of Atrophy, SCRIPTED, ZOMBIE 50%, random-target ranges). Below it, a faded 'IF YOU ATTACK' header with no text, a dashed rule and 'J HOLD · +4 MORE' (+3 at 2000). run.json intentText shows the DOM holds the body: Delay Attack on the Mortiorchis is punished with party-wide Slowga; under 75 percent Seymour answers with Protect; under 50 percent Reflect and phase 2. Ch II shows its IF YOU ATTACK body on the same card.
- Expected: The conditional section shows its first line, or no empty header, so conditional intent is visibly separate from certain intent.
- Repro: Live build, Chapter I (seymour-flux), seed 1, 1600x900 or 2000x1012: first command menu, press E.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-30/evidence/seymour-flux-win-2k/12-intent-E.png; run.json intentText
- Confidence: medium: the DOM text is read, the clipping or fade mask is inferred from the stills
- Requirement: Rubric 2: the enemy-intent display separates certainty from conditional outcomes (CHK-004, CHK-008)
- Smallest fix: Give the card enough height for one conditional line, or hide the header when its body is clipped; keep J for the rest.
- Acceptance check: A 1600 and 2000 capture of the Ch I E card shows the first conditional line or no empty header, with 0 clipped boxes.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0541 [minor, interface, open] R30-INT-02: Desktop Chapter IV CHANGE list: 'GRANTS: BLUE' is unreadable and 'GRANTS: GREEN/BLUE' is unexplained

- Game / chapter / state: FFX-2 only (Garment Grid); ffx2-bahamut; 
- Observed: At 1600x900 the CHANGE list shows Gunner (GRANTS: GREEN, legible on pink) and Warrior with 'GRANTS: BLUE' in pink on cream, which is nearly invisible. Nothing says what a grant is or why it matters. The explanation line ('Changes into another dressphere; the destination spends the turn') shows on the phone but not in the desktop capture.
- Expected: Every row's secondary text meets legibility and contrast, and the grant colour is explained or replaced by the ability the player gains.
- Repro: Live build, Ch IV (ffx2-bahamut), seed 1, 1600x900, Rikku's turn: choose CHANGE.
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win/21-change-open.png
- Confidence: high for the contrast, medium for the missing explanation
- Requirement: CHK-003 and CHK-009, legible values; CHK-004, useful advice
- Smallest fix: Use the dark text colour on unselected cream rows; add a one-line explanation of the grants.
- Acceptance check: A 1600 capture of the CHANGE list in which every row's second line is readable; contrast at least 4.5:1 sampled.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### PR-0542 [minor, interface, open] R30-INT-03: Pause chrome labels are low contrast, about 1.9 to 2.8:1 by pixel sampling

- Game / chapter / state: both; all; 
- Observed: On the pause screens at 1600: the 'ECHOES OF SPIRA · FINAL FANTASY X' header samples about 1.9:1, BATTLE STATS, SETTINGS and THIS ENCOUNTER about 2.4 to 2.8:1, 'H PAINTING ONLY' about 2.8:1, and inactive tabs about 3.5:1. The measure samples antialiased small text, so it may understate.
- Expected: Labels the player must read reach at least 4.5:1 (3:1 for large text); purely decorative text is excluded.
- Repro: Live build, any chapter, Esc from the command menu, 1600x900.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/14-pause-Esc.png; critic/rounds/round-30/evidence/seymour-flux-win/14-pause-options.png
- Confidence: low to medium: sampled estimate, no DOM contrast sweep
- Requirement: CHK-003 legibility and contrast
- Smallest fix: Run the CHK-003 sweep with contrast; lift the section labels and the hint line.
- Acceptance check: A DOM sweep reports 0 text under the floor and every functional label at or above 4.5:1.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0543 [minor, interface, open] R30-INT-04: FFX target mode lacks the Enter/Esc strip FFX-2 shows, and the hint strip calls the guide 'Intel'

- Game / chapter / state: both (shared target mode; the FFX side lacks it); seymour-flux, yunalesca, ffx2-bahamut; 
- Observed: FFX-2 target frames carry 'ENTER CONFIRM · ESC BACK'. The FFX target frames (Ch I, Ch II) keep the menu hints 'Enter Select · G Intel · Q Defend · P Pause'. The G key is labelled 'Intel' in the hint strip but opens a panel headed 'GUIDE', and E is 'ENEMY MOVE' (which the hint strip omits).
- Expected: The same screen in both games gets the same work, and one name per function.
- Repro: Live build, Ch I and Ch IV, choose ATTACK, 1600x900.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/16-target-single.png; critic/rounds/round-30/evidence/ffx2-bahamut-win/16-target-single.png; critic/rounds/round-30/evidence/seymour-flux-win/13-guide-G.png
- Confidence: medium
- Requirement: CHK-020
- Smallest fix: Show the same confirm and back strip in FFX target mode; use one word for G.
- Acceptance check: FFX target captures show the confirm and back strip; the hint strip and the panel use the same word.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0547 [minor, interface, open] FFX-2 results ledger names the dressphere Rikku started in, not the one she finished in

- Game / chapter / state: FFX-2 only; ffx2-bahamut; src/ui/common/resultsMath.ts:301-312 (read, not run)
- Observed: Chapter IV, seed 1: battle log shows a spherechange Rikku dark-knight -> warrior at seq 24 and the plate reads WR for the rest of the fight (turns up to 61), but the results row reads 'Rikku DARK KNIGHT . CONFUSE 30/30 AP' while Paine (never changed) reads 'WARRIOR . FLAMETONGUE 20/20 AP'. ResultsScreen's own comment says AP goes to the dressphere she is wearing [ffx2-combat-core 3.0].
- Expected: The AP row names the dressphere that earned it (the worn one at the end, or whichever the sources say), or the comment is the wrong rule.
- Repro: https://echoesofspira.com/ , Chapter IV by keys, seed 1, change Rikku to Warrior in battle (the route's scripted change does it), win, read the results page. Evidence: ffx2-bahamut-win/31-results.png and battle-log.json (type spherechange who rikku seq 24).
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win/31-results.png; battle-log.json
- Confidence: low
- Requirement: FFX-2 AP goes to the worn dressphere (ffx2-combat-core 3.0, as the ResultsScreen comment states)
- Smallest fix: Read the party member's dress from the battle's end state in buildMemberRows (src/ui/common/resultsMath.ts, member.currentDressphere) if the engine credited the worn dress; if the engine credits the start dress, confirm against research/ffx2 and fix the engine instead. Not traced past reading resultsMath.ts lines 256-312.
- Acceptance check: Change Rikku mid-fight, win, and the results row names the same dressphere the engine paid the AP to (compare to the saved abilitiesLearned progress).
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### PR-0515 [minor, interface, open] Doublecast advice says NO MP while the spell picker shows the MP cost (carried, not re-examined)

- Game / chapter / state: FFX; seymour-flux, yunalesca; 
- Observed: Not re-examined this round.
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/continuity/index.json
- Confidence: low (carried)
- Requirement: see round-29 entry
- Smallest fix: As in the round-29 entry.
- Acceptance check: As in the round-29 entry.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json: No code, asset or setting this item depends on changed between e9907cad8 and 2b48cee95 (r66 touched presenter, camera, rig and measuring code only); labelled reused, not a fresh observation.

### PR-0532 [minor, audio, open] Chapter I's win fanfare is cut at the results swap and restarted from its first note (contradicts D-1295 "one fanfare")

- Game / chapter / state: FFX only (Chapter I, the pass is on for Chapter I and Chapter IV only; Chapter IV's win is silent); seymour-flux, win, results swap; src/app/screens/BattleScreen.ts:1057, src/app/screens/BattleScreenFlow.ts:619, src/audio/AudioManager.ts:379 (traced by reading)
- Observed: With the pack on by default on desktop, Chapter I's last blow starts victory-ffx in place of the sting (passEarlyVictory, BattlePresenterBeats.ts:347). The battle screen's exit then calls audio.stopMusic(0.6) unconditionally (BattleScreen.ts:1057) when the results panel replaces it; the panel asks for victory-ffx again after that swap (BattleScreenFlow.ts:619, PR-0504), and AudioManager.playMusic starts it from the top because current is null (AudioManager.ts:379) and cutFading clears the fading copy. Snapshots agree: after-fight shows current null with victory-ffx fading (gain 0.0001 in seymour-flux-win, 0.195 in seymour-flux-win-2k), then results shows victory-ffx current at gain 1 about 4 s later. Traced by reading code and four snapshots per run; I did not hear it and the exact gap or overlap is not measured (snapshots are seconds apart).
- Expected: AUDIO: phase transitions and routing; D-1295 (Chapter I's win is one fanfare)
- Repro: Live https://echoesofspira.com/ desktop 1600x900, seed 1: title, chapter select, Chapter I, win the fight by real keys, and listen from the last blow to the results panel. Evidence: critic/rounds/round-30/evidence/seymour-flux-win/audio-debug.jsonl (after-fight at 423614 ms, results at 427721 ms) and seymour-flux-win-2k (after-fight 318116 ms, results 322379 ms).
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/audio-debug.jsonl; critic/rounds/round-30/evidence/seymour-flux-win-2k/audio-debug.jsonl
- Confidence: medium (code and snapshots agree; not heard; timing not measured)
- Requirement: AUDIO: phase transitions and routing; D-1295 (Chapter I's win is one fanfare)
- Smallest fix: Skip the exit's stopMusic(0.6) for a win when the chapter's results cue is already the current cue (or have the flow not re-ask for a cue that is current, leaving it running across the wipe, which is what passEarlyVictory's comment says should happen). One conditional in BattleScreen.exit or showResults.
- Acceptance check: A dense audio timeline (every 100 ms, current and fading) from the last blow through the results panel shows victory-ffx as current continuously with one start time and no fading entry; the r62 results-music test and the PR-0504 silent-panel case still pass; Bailey's ear confirms one fanfare.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0514 [minor, audio, open] A UI sound falls back to the procedural synth in the first seconds of a session (carried PR-0514)

- Game / chapter / state: both (shared plumbing); ffx2-bahamut, first seconds, phone; 
- Observed: In ffx2-bahamut-win-phone-touch the sfxLog's first entry is cursor-move via synth at t=2.76 s; the 11 other runs with a log start via sprite or parity (first entry at about 2.98 s). One of twelve this round.
- Expected: CHK-001 item 3: nothing falls back to the synth path
- Repro: Live, 390x844 touch, fresh profile, Chapter IV: press the first cursor key within about 3 s of the first input. Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win-phone-touch/audio-debug.jsonl (sfxLog, via synth).
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win-phone-touch/audio-debug.jsonl
- Confidence: medium (single occurrence this round; the class is established in round 29)
- Requirement: CHK-001 item 3: nothing falls back to the synth path
- Smallest fix: As in the earlier ticket: gate the UI cue on the sprite being decoded, or play nothing until it is.
- Acceptance check: A cold-profile run on phone and desktop logs no via synth entry in the first 5 s over 10 runs.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0099 [minor, audio, open] Stand-in or borrowed scene beds and battle cues in eleven chapters (carried PR-0099; not re-judged by ear)

- Game / chapter / state: both; yojimbo-cavern, seymour-natus, ffx2-fallen-aeons, seymour-omnis, ffx2-trema, isaaru-via-purifico, ffx2-den-of-woe, ffx2-ixion-djose, sin-fins-core, sin-face, mirror-aeons; 
- Observed: themes-audit marks chapters 9 to 18 and 27 as borrowed with an owed row; the chapter-cue-map matches the data (0 departures). Whether a borrowed cue is acceptable is an ear and sourcing call nobody made; no audio file changed since e9907cad8. D-1308 defers the stand-in beds until after the conference.
- Expected: RUBRIC audio: thematic coherence
- Repro: node tools/audio/themes-audit.mjs in the release tree.
- Evidence: critic/rounds/round-30 audio checks (AUD-THEMES)
- Confidence: high on the fact, none on the quality
- Requirement: RUBRIC audio: thematic coherence
- Smallest fix: Owner decision per chapter after listening; no agent change.
- Acceptance check: Each borrowed row is settled by the owner or replaced under his pick.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Downgraded from round 29's major: nothing here is a measured player problem; whether a borrowed cue is acceptable is an ear and sourcing call that only Bailey can make (D-1308 defers the stand-in beds until after the conference).
- Reused: critic/rounds/round-29.json PR-0099: No file under public/audio or src/audio changed (git diff e9907cad8 2b48cee95 empty); themes-audit re-run fresh.

### PR-0504 [minor, audio, open] Chapter IV win results are silent on the default desktop build, by a release 62 pick that nobody has heard (carried question for Bailey)

- Game / chapter / state: FFX-2 only; ffx2-bahamut; 
- Observed: current is null in 2 of 2 desktop wins and "pause" on the phone win; D-1294 and D-1352 make it design on the pack build, so the audio auditor reads it as the owner's open call, not a routing fault.
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win/audio-debug.jsonl
- Confidence: medium
- Requirement: AUDIO: results cue; D-1294, D-1352
- Smallest fix: Bailey listens and decides keep or play victory-ffx2.
- Acceptance check: His decision recorded.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json PR-0504: No audio, results or pack code changed; two fresh desktop snapshots agree.

### PR-0460 [minor, combat, open] PR-0460 carried: Chapter III possession links 3 to 6 Summon rows still not seen in a browser

- Game / chapter / state: FFX only; braskas-final-aeon links 3 to 6; critic/rounds/round-30/audit-combat/ch3-cand.json
- Observed: Round 29 said no real-key run left link 1. This round's continuity run wins all seven links (284 turns, 27:27) but uses only Attack, Pray, Energy Rain and Candle of Life in links 2 to 7; its five Summon picks are all in link 1. The engine probe (ch3-cand.json) is byte-identical to round 29: possessed-ifrit lists Ixion, Shiva and Bahamut as enabled, possessed-bahamut and Yu Yevon list none with Grand Summon grey. So the 'never reached' half is closed and the 'rows match the original' half is still unproven.
- Expected: The Summon area in links 3 to 6 matches the recorded original behaviour (research/re-ffx-last-summoning.md).
- Repro: Live site, Chapter III, seed 1, real keys to link 3; open Yuna's Summon row at her first menu in links 3, 4, 5 and 6 and press Enter.
- Evidence: critic/rounds/round-30/audit-combat/ch3-cand.json; critic/rounds/round-30/continuity/braskas-final-aeon-win-r30/turn-log.json
- Confidence: UNVERIFIED; high that engine code is unchanged
- Requirement: RE menu-draw parity; AGENTS.md rule 6
- Smallest fix: Capture the link 3 to 6 Summon menu once with the existing route (add one Summon pick in each link to route-fight.mjs) and record the original's behaviour in research.
- Acceptance check: real-key run of links 3 to 6 with a Summon pick in each, matching the recorded original
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0534 [minor, visual, open] Lulu's rig head reads 5 to 15 percent different at ready, cast and idle in 7 FFX chapters (470 of the 489 CHK-026 head fails; likely the measurement, not the build)

- Game / chapter / state: FFX only (Lulu is an FFX party member); braskas-final-aeon, mirror-aeons, sin-fins-core, sin-face, evrae-airship, yojimbo-cavern; Lulu rig, idle, ready, cast, item, critical
- Observed: Lulu idle to ready x0.95, ready to cast x1.1543, cast to idle x0.9119, as rig-bone head pixels (38.2 to 34.9 px, about 2 to 5 px). The Braska ready-to-cast strip shows no visible size jump, only the arms and hair raising. Counts: Mirror Aeons 164, Sin Fins and Core 143, Braska 103, Sin Face 46, Evrae 19, Yojimbo 14. Round 29 did not report this class; this harness now reads rig heads, so the cause may be the measurement, not the build.
- Expected: No visible head resize at a swap
- Repro: Harness run of any Lulu chapter, for example critic/rounds/round-30/continuity/mirror-aeons-win-r30, swap rows with figure lulu and failHead true.
- Evidence: critic/rounds/round-30/continuity/fails.json
- Confidence: low (measurement versus product undecided)
- Requirement: CHK-026
- Smallest fix: Decide whether a 3 percent tolerance applies to a 35 px rig head; if yes, compare Lulu's rig head to her painted head and fix the rig key, if no, give the head check an absolute pixel floor. One ticket for all chapters.
- Acceptance check: A written decision on the metric, then a harness run of Chapter III with the Lulu swaps inside tolerance.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### PR-0529 [minor, visual, open] FFX-2 Chapter XIII (Trema): Paragon's feet move about 10 px at 12 pose swaps (idle to cast, cast to hurt; carried, 16 swaps in round 29)

- Game / chapter / state: FFX-2 only (Chapter XIII); ffx2-trema; Paragon boss, idle, cast, hurt
- Observed: feet dy 9.6 to 10.5 px at 12 swaps, against a 2 px tolerance at 1600 wide; height x1.13 and x0.88. Carried from PR-0529 (round 29: 10.4 px); no change.
- Expected: Feet within 2 px
- Repro: Harness run critic/rounds/round-30/continuity/ffx2-trema-win-r30, swaps 122 to 234.
- Evidence: critic/rounds/round-30/continuity/ffx2-trema-win-r30/continuity/strips/swap-148-paragon-idle-cast.jpg
- Confidence: high
- Requirement: CHK-026
- Smallest fix: Re-register Paragon's cast painting to the idle ground line.
- Acceptance check: Trema harness run: CHK-026 PASS on feet.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0537 [minor, visual, open] The live Chapter I boss card has no approved target: the full-bleed painted card differs from the Battle start mockup

- Game / chapter / state: both (the card is shared); seymour-flux; boss card, fight opening
- Observed: The live card is a bright full-bleed painting with the boss on the right and the title bottom left; the approved Battle start tile shows a cream slab, a boss cut-out and a Battle start strip. No tile in targets.json records a later decision.
- Expected: A recorded approval for the shipped card
- Repro: Chapter I fight start, frame f02 of seq-transition-into-battle at 1600x900.
- Evidence: critic/rounds/round-30/targets/A-battle-start-card.jpg
- Confidence: medium
- Requirement: RUBRIC section 7, AGENTS.md hard rule 9
- Smallest fix: Ask Bailey for a verdict on the current card, or record the decision that made it.
- Acceptance check: A tile or decision row for the card, then a pair composite.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0521 [minor, feel, open] Pro camera framing in the action stills: Bahamut zooms from half the frame to nearly all of it within ten frames while the party stays put, the turn cut-in covers the left third for three frames (carried; re-observed by the fan, one capture)

- Game / chapter / state: both; ffx2-bahamut, seymour-flux; 
- Observed: First-time fan, seq-party-action f00 to f09 and seq-action-playing f01 to f03 in Chapter IV. The feel auditor reads the same framing as coherent, so confidence is low and the cut-in half is the new MF-16 timing (PR-0536).
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win/seq-party-action
- Confidence: low (fan reading against the feel auditor's; no frame timestamps)
- Requirement: CHK-013, CHK-014 camera
- Smallest fix: Frame the action shot for the boss at one scale; show Bailey the camera clip pair (CHK-B2).
- Acceptance check: A timed sequence with stable boss scale across the move.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json PR-0521: Camera code changed in r66 only for real-time shake and impact frame; framing unchanged.

### PR-0485 [minor, narrative, open] PR-0485 (extended, cause traced): portrait expression never follows the line; 46 'emotion' tags are read by nothing and every speaker has one neutral, smiling portrait

- Game / chapter / state: both (Chapter IV Rikku '...Yunie.', Chapter IX Yuna 'She's gone. Truly, this time.' tagged sad, Chapter XVI Yuna 'Where the fayth stood, there's only a hole.', Chapter V Yuna 'Listen to me. She asked me to—'); ffx2-bahamut, yojimbo-cavern, ffx2-ixion-djose, ffx2-vegnagun-shuyin; src/story/dsl.ts 122 and 474 (Emotion type and say option); no reader in src/story/runner, src/ui or src/app (search for 'emotion'); critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/33-after-confirm-scene.png, yojimbo-cavern-win-r30/30-post-scene.png, ffx2-ixion-djose-win-r30/30-post-scene.png
- Observed: A wide grin on the sorrowful FFX-2 beats and a smile on a grief line tagged sad; the same smiling plate is used for every line.
- Expected: Writing-bible E6: Rikku may be scared but not funny on '...Yunie.'; a line tagged sad shows a sad or neutral-grave face.
- Repro: Play Chapter IV to a win and Confirm (Rikku '...Yunie.'); Chapter IX post-scene.
- Evidence: src/story/dsl.ts 122 and 474 (Emotion type and say option); no reader in src/story/runner, src/ui or src/app (search for 'emotion'); critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/33-after-confirm-scene.png, yojimbo-cavern-win-r30/30-post-scene.png, ffx2-ixion-djose-win-r30/30-post-scene.png
- Confidence: high (frames plus a search finding no reader; a reader reached through object spread would not appear in a text search, so the frames are the proof)
- Requirement: research/writing-bible.md E6 and section 1.15; tonal contract 2.3
- Smallest fix: Nothing may replace the approved portraits on taste. Smallest presentation-only change: when a line carries sad, pained or afraid, dim and desaturate the existing portrait or show the speaker plate without the face; needs Bailey's yes (rule 10) because it is a new treatment; or ask him whether alternate expressions should be painted.
- Acceptance check: A grief line renders without a smiling face in both games; the portrait art hash is unchanged.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0544 [minor, delivery, open] FFX-2 Chapter VII (Trema) runs below 60 fps with sustained slow frames; every other chapter runs at 59.8 to 60

- Game / chapter / state: ffx2; ffx2-trema, state: fight, links 1 and 2, 1169 s of battle; unknown cause; suspected something specific to Trema's long chained fight (not traced)
- Observed: Continuity probe, release 66 live, 1600x900, Ryzen 7 7800X3D / RTX 5070 Ti, headless Chromium gpu: 57.4 fps, p99 71.2 ms (other chapters 18.6 to 35.3 ms), 1,533 of 67,129 battle frames (2.3 percent) over 34 ms, max 366.7 ms. Chapters of similar length are clean in the same review: Braska's Final Aeon 1640 s at 59.9 fps p99 22.4 ms, Mirror Aeons 1146 s at 60 fps p99 23.0 ms, so duration alone does not explain it. Round 26 measured Trema at 54.1 fps, p99 103.3 ms, max 737.9 ms on an earlier build: improved, not regressed.
- Expected: 60 fps at 1600x900 on the named PC with spikes reported (RUBRIC section 2); 59.8 to 60 fps as in the other 18 chapters
- Repro: node critic/runner continuity harness (PYREFLY_BROWSER=gpu), chapter ffx2-trema, seed 1, default settings, 1600x900; read summary.frameTime in critic/rounds/round-30/continuity/ffx2-trema-win-r30/continuity/continuity.json
- Evidence: critic/rounds/round-30/continuity/ffx2-trema-win-r30/continuity/continuity.json (frameTime, probe), critic/rounds/round-30/continuity/continuity-summary.json; round 26 comparison critic/rounds/round-26/continuity/ffx2-trema-win-r26/continuity/continuity.json
- Confidence: medium: one run this round and one in round 26 agree; host contention is not fully excluded but the browser lock serialises capture and the two other 19 to 27 minute chapters ran clean
- Requirement: RUBRIC section 2 platform goals (60 fps at 1600x900, frame-time spikes reported); category delivery
- Smallest fix: Record a per-frame trace of the Trema chapter (frame time against the battle clock and phase, JS heap, draw calls and live sprite count) to find what sustains the cost, then correct that one cost. This is a measurement first, not a guess at a cause.
- Acceptance check: Trema continuity run at 1600x900 on the same PC: at least 59.5 fps, p99 at most 25 ms, at most 0.5 percent of frames over 34 ms.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0480 [minor, delivery, open] Single frames of 250 to 763 ms remain in 5 of 19 chapters (Mirror Aeons 763, Vegnagun 446, Trema 367, Chapter I 283, Sin core 251); the release 66 claim that first-sight freezes are gone is not shown (carried PR-0480)

- Game / chapter / state: both (FFX: Mirror Aeons, Chapter I, Sin core; FFX-2: Vegnagun and Shuyin, Trema); mirror-aeons, ffx2-vegnagun-shuyin, ffx2-trema, seymour-flux, sin-fins-core; unknown; the probe stores the worst frame only, with no time or phase
- Observed: Max frame per run at 1600x900: Mirror Aeons 762.9 ms (round 26: 1151 ms), Vegnagun and Shuyin 446.2 ms (round 26: 664.7), Trema 366.7 ms (737.9), Chapter I 283.1 ms (release 64 live: 321 to 381 ms), Sin core 251.0 ms, Isaaru 199.7 ms; the other 12 are 116 to 145 ms. Chapter IV is unchanged at 126.5 ms (release 64: 125 to 136 ms). Chapter I improved by about 12 to 25 percent; nothing shows whether the remaining spikes are first uses or something else, so the lane's claim is neither confirmed nor refuted.
- Expected: Release 66 (MF-02, MF-28) removes first-sight freezes: no frame far above the p99 once an ability or asset has been seen; frame-time spikes are reported with when they happen
- Repro: continuity harness, each chapter, seed 1, 1600x900; read summary.frameTime.maxMs per chapter in critic/rounds/round-30/continuity/*/continuity/continuity.json
- Evidence: critic/rounds/round-30/continuity/*-r30/continuity/continuity.json (frameTime.maxMs, longFrames)
- Confidence: high for the numbers, low for the cause
- Requirement: RUBRIC section 2: report frame-time spikes and first-ability stalls as well as the average; category delivery
- Smallest fix: Make the probe write the battle clock, phase and acting ability beside every frame over 100 ms; then tie each spike to a first use, a scene seam or a garbage collection and correct the first-use ones (the lane's own claim) with a pre-warm.
- Acceptance check: For each chapter the probe lists every frame over 100 ms with its phase; none over 150 ms after the first three uses of an ability; Mirror Aeons and Vegnagun max under 200 ms.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0520 [minor, delivery, open] First-load time never measured (one cold-edge fetch of the 1.4 MB bundle took 5.4 s) and a cold first visit showed partly loaded art in round 29 (carried PR-0520)

- Game / chapter / state: both; title screen, cold cache and cold edge; hosting and bundle size, not traced
- Observed: No run recorded navigation timing. My node-side probe (not a browser load, curl with br,gzip) on this PC: bundle assets/index-BwPs1UaV.js is 1,445,213 bytes brotli (5,043,734 raw); warm Cloudflare edge: total 1.5 to 2.7 s, time to first byte 0.6 to 2.0 s (4 fetches, CF-Cache-Status HIT); one fetch on an edge MISS: time to first byte 3.47 s, total 5.35 s; the title art echo.webp 1.36 MB: 1.3 s; index.html 0.5 to 1.3 s. The page needs the bundle and the title art before the title is usable, so a first visit on a cold edge or a slower link may pass 5 s; whether it does in a browser is unknown. The bundle grew 15,842 bytes (0.3 percent) over release 64, so this build adds nothing material.
- Expected: A load under 5 seconds measured on named hardware, browser, network and cache conditions (RUBRIC section 2, CHK-017)
- Repro: curl -s -o /dev/null -H 'Accept-Encoding: br,gzip' -w '%{time_starttransfer} %{time_total}' https://echoesofspira.com/assets/index-BwPs1UaV.js
- Evidence: transfer probe run in this review (output in the review transcript); critic/artifacts/2b48cee95.json for sizes
- Confidence: low: one MISS sample, a network client and not a browser
- Requirement: CHK-017 load under five seconds; category delivery
- Smallest fix: Have one run record performance.getEntriesByType('navigation') and the title-ready time with a cold cache, a warm cache and a throttled network (Fast 4G) in the capture harness; only then decide whether the bundle needs splitting.
- Acceptance check: Title usable (screen=title with input accepted) under 5 s cold cache on a named network profile, recorded in the report.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0539 [minor, harness, open] Critic harness limits: timed sequences carry no frame timestamps, one strip tracks the wrong figure, labels are wrong, the owner route cannot finish Braska inside the 10-minute lock window, and the phone touch route cannot reach Poison Fang or aim an ally (carries PR-0483, PR-0397)

- Game / chapter / state: both; capture owner and harness; critic/rounds/round-30/evidence/*/seq-*/f00..f09.jpg; continuity strips swap-006-kimahri-idle-ko.jpg; evidence/index.json
- Observed: The ten frames of each seq-* folder have no dt (swap-006 follows Seymour, not Kimahri); "after a undecided" is printed for won fights; the Chapter I 30-post-scene capture is marked UNVERIFIED because its scene follows the results; the dialogue timeline logs lines at 0 to 17 ms because the harness taps Enter. The capture owner's Braska attempts (seeds 1, 2, 3 with R held) were still fighting at 137 to 140 turns when the 9 min 10 s lock window ended; the continuity harness won it in 284 turns and 27 min (no product fault). The phone Chapter I route lost the fight because its chooser could not reach Poison Fang in the 27-item list, and its Esc fallback did not open the pause while P did (UNVERIFIED, no product fault). Not product defects.
- Expected: A timed sequence states its frame spacing; a strip follows the named figure.
- Repro: Open any seq-* folder and index.json.
- Evidence: critic/rounds/round-30/evidence/*/seq-*/f00..f09.jpg; continuity strips swap-006-kimahri-idle-ko.jpg; evidence/index.json
- Confidence: high
- Requirement: CHK-016
- Smallest fix: Write dt per frame into each sequence; track the swap's named figure through camera cuts; fix the outcome label and the Chapter I post-scene expectation; record an unhurried run with auto-advance only.
- Acceptance check: Sequences with per-frame ms; strips with the right figure; reading time per line measured.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0523 [minor, interface, open] Esc from the command menu closes an open guide panel first, so the pause seems ignored (carried; Den of Woe and Isaaru via Purifico where the guide is open by default)

- Game / chapter / state: both; yojimbo/isaaru/den-of-woe; 
- Observed: Not re-examined this round; the gap pass saw Esc from the Accessibility tab need two presses once and one press once in Chapter I.
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/continuity/index.json
- Confidence: low (carried)
- Requirement: see round-29 entry
- Smallest fix: As in the round-29 entry.
- Acceptance check: As in the round-29 entry.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json: No code, asset or setting this item depends on changed between e9907cad8 and 2b48cee95 (r66 touched presenter, camera, rig and measuring code only); labelled reused, not a fresh observation.

### PR-0527 [minor, delivery, open] UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 continuity runs in round 29 (carried; none seen in the 19 runs of round 30)

- Game / chapter / state: both; seymour-flux; 
- Observed: 19 of 19 round-30 runs completed with 57.4 to 60 fps and no probe error; the round-29 gap is not reproduced.
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/continuity/index.json
- Confidence: low
- Requirement: see round-29 entry
- Smallest fix: As in the round-29 entry.
- Acceptance check: As in the round-29 entry.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json: No code, asset or setting this item depends on changed between e9907cad8 and 2b48cee95 (r66 touched presenter, camera, rig and measuring code only); labelled reused, not a fresh observation.

### PR-0530 [polish, feel, open] Question for Bailey: the harness reports 0 snaps because 73 of 75 hard cuts are excused as planned smear cuts; a player still sees a hard cut about 4.9 times a minute in Chapter I and 6.9 in Chapter IV

- Game / chapter / state: both (Chapter I FFX, Chapter IV FFX-2); seymour-flux, ffx2-bahamut; continuity-summary.json motion.hardCuts 75, smear excusal (policy continuity.smear.excuse true; Bailey 2026-10-22 "cut on the motion peak with a smear")
- Observed: Round 29's 4.67 and 7.51 snaps a minute and this round's 0 are the same cuts counted by two harness trees (an older tree could not see the engine's planned smears; this release tree can). The cuts are by Bailey's 2026-10-22 pick; whether they read as snaps is a judgment of his eye on the hit cut, not a measurement.
- Expected: The gate and the viewer agree about what a snap is.
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/continuity-summary.json
- Confidence: high on the counts, none on the verdict
- Requirement: RUBRIC 6a; CHK-B2
- Smallest fix: None required: show Bailey the Chapter I and IV hit cuts as a short clip pair and record liked or disliked in the tile reaction; the excusal stays or is switched off in policy.json by his word.
- Acceptance check: His verdict recorded (CHK-B2).
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0519 [polish, interface, open] PR-0519 (carried question for Bailey): the default HUD no longer shows the advisor's reason, benefit or CURES KO tag

- Game / chapter / state: both; seymour-flux, ffx2-bahamut; 
- Observed: The default Ch I and Ch IV frame shows a one-row advisor chip. The reason, '+2,310', CURES KO and the Lance-of-Atrophy warning appear only in the G-folded card. run.json cardFirst and advisorMinEffPx still describe that hidden card.
- Expected: Bailey confirms the one-row default against the F1 target, and the harness measures the node that is visible.
- Repro: Live build, Ch I seed 1, 1600x900: first menu without G.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/11-advisor.png; critic/rounds/round-30/evidence/seymour-flux-win/run.json
- Confidence: high
- Requirement: Rubric 2 advisor; CHK-003 evidence integrity
- Smallest fix: Ask Bailey; retarget the harness at the visible chip.
- Acceptance check: Owner decision recorded; run.json measures the chip as shown.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0508 [polish, onboarding, open] PR-0508 and PR-0511 (carried): VISUAL STYLE and PRESENTATION 'THE ECHO · B' are unexplained, and the FFX options pane shows no focused row

- Game / chapter / state: both; all; 
- Observed: The OPTIONS rows read 'HD-2D' and 'THE ECHO · B' with no description. In the FFX capture no row looks focused (only arrow markers); the FFX-2 capture after the X-2 BATTLE flip shows a small square marker.
- Expected: Each option states what it does, and the focused row is evident.
- Repro: Live build, Esc, OPTIONS, 1600x900.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/14-pause-options.png; critic/rounds/round-30/evidence/ffx2-bahamut-lose/15-options-active.png
- Confidence: high
- Requirement: Rubric 6 usable settings; CHK-010
- Smallest fix: Add one-line descriptions and a clear focus bar.
- Acceptance check: Each option row shows a description when focused; the focus bar passes CHK-010.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0524 [polish, encounter, open] research/ffx2-bahamut.md still carries the superseded Mega Flare and script sections with no banner (PR-0524 carried)

- Game / chapter / state: FFX-2 only; ffx2-bahamut; research/ffx2-bahamut.md
- Observed: The document's first lines and sections 2.1 to 2.4 still say Mega Flare is 614-1,165 and 'the entire party dies unless healed', while the engine and research/re-ffx2-ai-bahamut-vegnagun.md use table power 14 (about 146 damage). A reader of the older doc would expect attack-only to lose; the engine bench shows attack-only winning 37/40 (span on) and 40/40 (span off), which is the faithful result of the re-parity numbers, not an engine defect.
- Expected: A superseded banner at the top of research/ffx2-bahamut.md pointing to re-ffx2-ai-bahamut-vegnagun.md, so the next reader does not 'fix' the engine toward the old numbers (AGENTS.md rule 6).
- Repro: Read research/ffx2-bahamut.md section 0 and 2.1; run critic/rounds/round-30/audit-combat/run-naivex2.sh and read naivex2-x2-attack-attack.json.
- Evidence: critic/rounds/round-30/audit-combat/naivex2-x2-attack-attack.json; research/re-ffx2-ai-bahamut-vegnagun.md lines 34 and 229
- Confidence: high
- Requirement: AGENTS.md rule 6 (never invent game data), research hygiene
- Smallest fix: Add a one-paragraph superseded note at the top of research/ffx2-bahamut.md.
- Acceptance check: banner present; test or review reads it
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0533 [polish, test-coverage, open] advisor-floor 'Mirror Aeons' test times out under full-suite load

- Game / chapter / state: FFX only (Mirror Aeons); mirror-aeons; tests/unit/advisor-floor.test.ts
- Observed: In a full run beside other jobs, tests/unit/advisor-floor.test.ts 'holds across 27. Mirror Aeons' hit its 15 s timeout (1 failure in 26,710 tests). Alone the same file passes 23/23 and Mirror Aeons takes 6.5 s.
- Expected: A deterministic engine sweep that finishes well inside its timeout on a loaded machine.
- Repro: cd D:/pyrefly-release55; run the full vitest suite while another browser or probe job is running; then run the file alone.
- Evidence: critic/rounds/round-30/audit-combat/full-suite.json
- Confidence: high
- Requirement: release gate hygiene
- Smallest fix: Give that test an explicit longer timeout (for example 60 s) like the other long sweeps, or reduce its seed count.
- Acceptance check: full npm test green on repeated runs
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0536 [polish, feel, open] FFX-2 first menu: the MF-16 turn cut-in is still at full opacity over the left of the stage at the instant the menu is flagged awaiting (settles 0.37 s later)

- Game / chapter / state: FFX-2 only (the cut-in on the ATB menu); ffx2-bahamut; turn cut-in over the command menu
- Observed: The capture asserted awaitingMenu true while Paine's cut-in portrait was at full opacity with the dimmed menu behind it; 0.37 s later (11-advisor) the cut-in was gone. The cut-in is the new MF-16 Web Animation, so this is in a new feature.
- Expected: The menu shown clean when it takes input
- Repro: Chapter IV, seed 1, first command menu, capture 10-first-menu-coach at 1600x900.
- Evidence: critic/rounds/round-30/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: medium
- Requirement: CHK-016
- Smallest fix: Set the awaiting-menu flag when the cut-in settles, or leave it and accept 0.4 s of input over the cut-in.
- Acceptance check: A frame series at the flag showing the cut-in gone or under 20 percent.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature true

### PR-0528 [polish, visual, open] First-time fan polish breakers kept: one empty-stage frame as Bahamut fades in half see-through before the first turn, and damage numbers sit on the boss's face for 5 of 10 sampled frames (carried)

- Game / chapter / state: both; ffx2-bahamut, seymour-flux; 
- Observed: Re-observed in seq-transition-into-battle (Chapter IV) and seq-action-playing (Chapter I, the 1968 on Seymour's face).
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/evidence/seymour-flux-win/seq-action-playing
- Confidence: medium
- Requirement: see round-29 entry
- Smallest fix: As in the round-29 entry.
- Acceptance check: As in the round-29 entry.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json PR-0528: Unchanged presenter staging; fresh frames agree.

### PR-0548 [polish, feel, open] Hit flashes, whiteouts and glow edges wash out the figure for a frame or more: an inverted white and black frame at the swap of a big move, Yojimbo an orange blob for 18 frames, white slabs over the Braska pagoda

- Game / chapter / state: both; ffx2-trema, ffx2-bahamut, sin-face, yojimbo-cavern, evrae-airship, braskas-final-aeon; strips swap-356, jerk-037, jerk-002 (sin-face), jerk-000 (yojimbo), swap-345, braska seq-action-playing f01 to f07
- Observed: First-time fan: 3 one-frame full inverted white and black frames at the swap of a big move (Rikku/Paine, Bahamut, Sin), Yojimbo covered in fire glow for all 18 frames of its strip, Tidus and Rikku white out at the swap, flat white rectangles over the pagoda and a hard white edge on the aeon during a heal. Whether the one-frame inversion is a designed impact frame (r65 impact frame on real time) was not established.
- Expected: Impact effects read as impact and leave the pose readable (RUBRIC feel: impactful but readable effects).
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/ffx2-trema-win-r30/continuity/strips/swap-356-rikku-attack-follow.jpg; critic/rounds/round-30/continuity/ffx2-bahamut-win-r30/continuity/strips/jerk-037-bahamut.jpg; critic/rounds/round-30/continuity/yojimbo-cavern-win-r30/continuity/strips/jerk-000-yojimbo.jpg
- Confidence: low to medium (one reader, strips cropped on one figure)
- Requirement: RUBRIC 6 feel; CHK-B2
- Smallest fix: Ask Bailey whether the one-frame inversion is the impact look he picked; if not, shorten or tint it; check Yojimbo's glow strength.
- Acceptance check: Bailey's verdict recorded; a strip shows the pose under the effect.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0549 [polish, visual, open] Party figures stack on each other in staging: Kimahri stands in front of Yuna in Chapter I, Auron stands almost fully behind Tidus in Chapter III, Paine overlaps a teammate in a Leblanc strip

- Game / chapter / state: FFX (Chapters I and III) and FFX-2 (Leblanc strip); seymour-flux, braskas-final-aeon, ffx2-leblanc; party formation at 1600x900
- Observed: Chapter I seq-action-playing f00 to f02: Kimahri overlaps Yuna while a 1968 number floats over Seymour; Chapter III 23-midfight: Auron is drawn almost entirely behind Tidus; Leblanc swap-551: Paine and a teammate overlap at the left edge. Carried from round 29 (Kimahri and Auron partly behind Tidus).
- Expected: Each party member readable (CHK-014 poses and facing, CHK-011).
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/evidence/braskas-final-aeon-win-ff/23-midfight.png; critic/rounds/round-30/evidence/seymour-flux-win/seq-action-playing
- Confidence: medium
- Requirement: CHK-013, CHK-014
- Smallest fix: Spread the formation slots by a figure width where figures overlap; re-check at 1600 and 2000.
- Acceptance check: Mid-fight stills at 1600 and 2000 in Chapters I and III with no figure more than 30 percent hidden by another.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0546 [polish, prep, open] The pro-defeat card says 'The party has fallen' and names no cause when the battle speed is SKIP

- Game / chapter / state: both (presenter staging, shared plumbing); seymour-flux and ffx2-bahamut losses, demo and public; src/engine/BattlePresenterStaging.ts: stagingPort() returns null at speed 'skip', so noteFoeMove() (line 184) records nothing and stageFall() (line 245) writes no defeat note (suspected from reading the code; not reproduced at another speed this round)
- Observed: 7 of 7 losses this round and in the round 66 gap pass (all run at battle speed SKIP, the harness setting) show 'The party has fallen' with no cause, although the battle log names the killing move (Seymour Flux: Mortiorchis, Cross Cleave, 2,667 on Yuna; Chapter IV: Bahamut's last attack). The code for the cause is unchanged since release 64.
- Expected: The defeat card names what felled the party (ProDefeatScreen prints 'Felled by <move>' when a cause exists); round 29 recorded the demo card reading 'FELLED BY MEGA FLARE, TURN 23 / ATTEMPT 1 / 3:56'
- Repro: Set battle speed to SKIP in the pause OPTIONS, lose Chapter I (for example hp 1 injected), read the card
- Evidence: critic/rounds/round-30/evidence/seymour-flux-lose-retry/2-defeat-panel.jpg; critic/rounds/round-30/evidence/ffx2-bahamut-lose-retry/2-defeat-panel.jpg; critic/rounds/round-30/evidence/seymour-flux-lose/battle-log.json; D:/Tools/pyrefly-scratch/2026-10-28/r66/gaps/defeat/*.json (cause field)
- Confidence: medium for the observation, low-to-medium for the cause until a non-SKIP loss is read
- Requirement: RUBRIC section 6 prep: understandable results; the defeat is understood
- Smallest fix: Record the foe move in noteFoeMove() before the stagingPort test so it is kept at every speed; leave the staging itself switched off at SKIP.
- Acceptance check: A loss at SKIP speed shows 'Felled by <move>' on the card; unit test on noteFoeMove with speed 'skip'.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0526 [polish, interface, open] Small copy and fit points in the booth and phone surfaces (carried, not re-examined)

- Game / chapter / state: both; booth and phone; 
- Observed: Not re-examined this round.
- Expected: No such defect (the requirement named).
- Repro: See critic/rounds/round-29.json for the id.
- Evidence: critic/rounds/round-30/continuity/index.json
- Confidence: low (carried)
- Requirement: see round-29 entry
- Smallest fix: As in the round-29 entry.
- Acceptance check: As in the round-29 entry.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Reused: critic/rounds/round-29.json: No code, asset or setting this item depends on changed between e9907cad8 and 2b48cee95 (r66 touched presenter, camera, rig and measuring code only); labelled reused, not a fresh observation.

### PR-0522 [minor, harness, fixed (verified round 30)] The review's own 19-chapter continuity run died (round 29): CLOSED, the dedicated harness ran all 19 chapters, 0 probe errors

- Game / chapter / state: both; all; 
- Observed: 19 of 19 chapters measured, harness stamp present, run from the release tree.
- Expected: A full 19-chapter run.
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/continuity-summary.json
- Confidence: high
- Requirement: CHK-026, CHK-027
- Smallest fix: None.
- Acceptance check: Same.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0461 [minor, coverage, fixed (verified round 30)] Three of 19 chapters had no demonstrated real-key win (Yunalesca, Braska, Mirror Aeons): CLOSED, all 19 won by real keys in the continuity harness

- Game / chapter / state: both; all; 
- Observed: Yunalesca 138 turns, Braska 284 turns (27:27, seven links), Mirror Aeons 209 turns, all to results, confirm and chapter select, 0 injected.
- Expected: A real-key win for every chapter.
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); strips under critic/rounds/round-30/continuity/<chapter>-win-r30/continuity/strips/
- Evidence: critic/rounds/round-30/continuity/index.json
- Confidence: high
- Requirement: CHK-022
- Smallest fix: None.
- Acceptance check: Same.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

## What stands between this build and acceptance

A deep review cannot accept a milestone. For the finished-game standard: a verified number for audio (Bailey's ears), onboarding and prep (the accessibility and prep walks), and delivery (first-load time, other browsers); every category at least 9.0 (visual 8.3, feel 8.2, narrative 8.8 and interface 8.0 are below it); CHK-026, CHK-027, CHK-008, CHK-009 and CHK-020 passing; CHK-001, CHK-002, CHK-003, CHK-023 and CHK-B1 settled; the seven open majors closed; 13 of 13 required targets matched; and Bailey's seven human judgments recorded.

## What changed since round 29 (build e9907cad8, release 64)

- Release 65 and 66 only: presenter, camera, HUD, rig and measuring code; combat, data, story, research and save files byte-identical, every probe output identical.
- Motion: the two pack chapters moved from 58 and 20 swap jerks over the line to clean (worst 32.8 and 45 px); Chapter IV see-through frames 147.9 to 90.0 a minute; no presenter stalled in 10,454 s; the planned smear cuts are now excused by the release tree's own harness (round 29's 4.67 and 7.51 snaps were counted by an older tree), so snaps read 0.
- Evidence: the harness now covers all 19 chapters (PR-0522, PR-0461 closed: Yunalesca, Braska and Mirror Aeons won by real keys); the protected-art ledger is clean (917 ok, 0 mismatched; PR-0513 closed).
- Still open at the same severity from round 29: PR-0459, PR-0379, PR-0517, PR-0148, PR-0295 (the stagnation rule applies to PR-0459, PR-0379 and PR-0503); PR-0481 and PR-0099 downgraded to minor with reasons; PR-0531 is new at major (a re-read of the CHK-026 height and stance fails with the fan's strips).
- Scores: combat 9.5 (unchanged), encounter 9.2 (+0.2 for the added real-flow coverage), visual 8.3 (held), feel 8.2 (+0.2 for the measured MF-01 and pack-chapter gains), narrative 8.8 (+0.1 for three aftermaths now seen), interface 8.0 (-0.1, two new minor defects).

## Proposals (nothing here is built without Bailey's yes)

- Pose-swap method check (needs Bailey's yes; RUBRIC section 8 asks for it before a third try on PR-0459, PR-0380, PR-0379): read the worst strip per class (Vegnagun tail, Auron follow, Paine attack to follow, Kimahri revive), then trial release 66's B switches (?swapcause, ?swapclass, ?stance, ?hurtstring) on those classes and show Bailey the clip pairs. Benefit: ends the standing CHK-026 and CHK-027 FAIL; cost small to medium; risk: more hard cuts if the blend is shortened (PR-0530); source-game fit: both.
- Retry from the fight itself (needs Bailey's yes, hard rule 10): on attempt 2 and later Enter skips the voiced Chapter I opening, as the demo does (PR-0481: 16.5 s to 1.7 s); FFX only for the voiced opening.
- Defeat card names its cause at every battle speed (needs Bailey's yes): record the killing move before the SKIP early return (PR-0546); both games.
- Listening session (needs Bailey's ears): docs/audio/audition.html for music, SFX, voice and the conference pass, plus keep or change the silent Chapter IV results and the Chapter I fanfare restart (PR-0148, PR-0504, PR-0532); both games.
- Prep and accessibility walk (needs Bailey's yes to spend the time): one desktop and one phone capture that opens each prep tab and each pause accessibility tab by real input (PR-0503), plus first-load timing on a throttled link (PR-0520); both games.
- Portrait expression on grief lines (needs Bailey's yes): dim or desaturate the existing portrait, or paint alternates; the 46 emotion tags are read by nothing (PR-0485); both games.
- Frame trace of the Trema chapter and of every frame over 100 ms with its phase (PR-0544, PR-0480); FFX-2 for Trema, both for the rest.
