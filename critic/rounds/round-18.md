# Critic round 18: deep review of the release 33 candidate (65152c1b)

```text
Build / artifact / target version: main 65152c1b (65152c1b318f), bundle index-DP4ruBbc.js, artifactHash 446ef3af85dffd82205140a18fbdcf157b47a62f206cc31676c5876282e6415b (dist-gate, 1,013 files), targets.json sha256 36693f81...ef07
Review: deep (save-data class: settings.fxLight/fxLiving/fxSpectacle and settings.sfxBalanceMigrated with the SFX default 0.35 -> 0.70; deep before deploy)
Deployment: NOT APPLICABLE (candidate not deployed; live is release 32, 1a6fd3cc)
Changed area: FAIL (status O3's FFX-2 Stop freeze locks Chapter XV, PR-0281; the O3 hint card covers commands, PR-0282; the save change itself passes 28/28)
Ship: HOLD. PR-0281 is a critical lock this candidate introduced and a regression against live. Once fixed, the release would disclose 15 majors: PR-0264, PR-0148, PR-0099, PR-0282, PR-0265, PR-0283, PR-0269, PR-0268, PR-0267, PR-0244, PR-0266, PR-0270, PR-0284, PR-0240, PR-0222
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED: no numeric owner listening score); combat 9.2, encounter 8.8, visual 8.9, feel 8.4, narrative 8.8, audio UNVERIFIED, interface 7.8, onboarding 8.4, prep 9.0, delivery 7.8
Targets: required 86 / matched 65 / failing 1 / unverified 20 / waiting on decision 6
Top issues: PR-0281 XV locks at link 2 with a carried Stop (fix the O3 freeze); PR-0264 phone tap commits a heal on a Zombie; PR-0148 no owner music score; PR-0099 borrowed cues; PR-0282 O3 hint over the phone commands; PR-0265 ESC RESUME dead to tap/click; PR-0283 title over a restarted fight (details below)
Coverage: tested = 18/18 chapters to a player turn, 15 full wins + aftermath, losses + RETRY, save matrix 28/28 with old-build saves, fx rows by keys/mouse/touch, engine replay, O3/O2/Sphere Grid by real input, 4:3 to 4K sweeps, audio tech/routing, perf; reused = r17 Sin benches and audit, Bushido input log, r17 SFX-vs-music level (arguments below); not tested = XV beyond the lock, XVII/XVIII wins, real phone/controller, Firefox/WebKit, 10 Mbit/s, FF7
Next required review and why: after the PR-0281 fix, a deep report for the NEW commit before deploy (still save-data class; reuse CHK-024 with a dependency argument), then the live review
Elapsed review time / repeated work avoided: about 690 min wall clock (capture 410 min under GPU contention until 07:30 EDT); no won chapter replayed; the gap pass chased only named captures
```

## Score (tools/critic-score.mjs, verbatim)

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
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-022 is FAIL
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 16 critical or major issue(s) remain open
  - encounter ffx2-den-of-woe has no complete real-input flow
  - 1 required target(s) failing
  - 20 required target(s) unverified
  - 6 required target(s) waiting
  - only 65 of 86 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix at V0 (CHK-B1, PR-0148)
  - human judgment not recorded: Audio: are attack and miss SFX audible at the new default (SFX b, D-293; PR-0263)
  - human judgment not recorded: Audio: 78.2 MB of music instead of the recommended ~73 MB (PR-0298)
  - human judgment not recorded: Save: moving a deliberate pre-release 0.35 SFX level to 0.70 (PR-0299, D-293 inferred half)
  - human judgment not recorded: Feel: steady pacing and the calm camera as defaults, and the +2.7 s they add to a hold-skip (CHK-B2, PR-0061)
  - human judgment not recorded: Visual: eye candy D in the running game against the D stills Bailey picked
  - human judgment not recorded: Onboarding: first-run step 1 wording when another chapter is selected (PR-0289)
  - human judgment not recorded: Narrative: Bailey's story read of the Sin chapters and the Ch VII aftermath (CHK-B3)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279) and the Chapter III gauntlet length (PR-0257)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## Verdicts

- **deployment**: NOT APPLICABLE. The candidate is not deployed; the live check (CHK-017) is owed after any deploy.
- **changedArea**: FAIL. FAIL: the changed status-O3 subsystem locks Chapter XV (PR-0281, critical) and its hint card covers commands (PR-0282); the save-data change itself PASSES (CHK-024, 28/28), and eye candy D, the calm camera, steady pacing, O2 and the Sphere Grid work to their targets.
- **milestone**: not assessed. not assessed: a deep review cannot accept a milestone.
- **ship**: HOLD. HOLD: a critical lock this change introduced, which is also a regression against live.

**Ship reasons**

- HOLD: PR-0281 is a critical lock introduced by this candidate: the new status-O3 FFX-2 Stop freeze (statusFigureTint.ts, absent from live 1a6fd3cc) stalls Chapter XV at the link-2 opening whenever a girl carries Stop across the seam (5 of 5 stalls on two paths; 11-15 % of sourced-line runs, nearly every no-Remedy mistake).
- HOLD: PR-0281 is also a regression against live: live 31a crosses the identical engine state and live 32 has no freeze, so Chapter XV finishes live and cannot finish on the candidate. It is not inside a brand-new feature in the sense of the rule: it breaks an existing chapter, and O3 has no switch it could ship behind.
- Not a reason to hold: the save-data change is safe (CHK-024 28/28 with saves written by releases 29, 30, 31a and the 32 candidate; the SFX rule holds exactly as stated; the three fx rows default on and keep a player's choice).
- Smallest path to SHIP: fix PR-0281 as proposed (freeze only the idle/life clock, or treat the party as acting during moment:* phases), or turn the FFX-2 stop freeze off at statusLooks.ts:79; then re-review that commit (the deep evidence for the unchanged save code can be reused with a dependency argument) with Chapter XV to its outcome and every FFX-2 seam with a carried Stop.
- Majors that would be disclosed once PR-0281 is fixed (none holds on its own): PR-0282 (inside new O3), and the pre-existing PR-0264, PR-0148, PR-0099, PR-0265, PR-0283, PR-0269, PR-0268, PR-0267, PR-0244, PR-0266, PR-0270, PR-0284, PR-0240, PR-0222.

Tag cross-check: `shipVerdict` in tools/critic-policy.mjs, run on this report, returns HOLD with the reason "PR-0281 (critical) is a regression against the live build"; every major is in the disclose list.

## Categories

| Category | Weight | Score |
|---|---:|---:|
| combat | 20 | 9.2 |
| encounter | 10 | 8.8 |
| visual | 15 | 8.9 |
| feel | 10 | 8.4 |
| narrative | 10 | 8.8 |
| audio | 10 | UNVERIFIED |
| interface | 10 | 7.8 |
| onboarding | 5 | 8.4 |
| prep | 5 | 9.0 |
| delivery | 5 | 7.8 |

Chief adjustments after the gap pass (reasons in each category's evidence): onboarding 8.3 -> 8.4 (O2 step 3 now captured in FFX by keys and taps and proven absent in FFX-2); prep 8.9 -> 9.0 (the Sphere Grid A/C/B, withheld only because unobserved, now driven by real input on desktop and phone). Every other score is the auditor's own.

### combat: 9.2

[combat and encounter auditor, deep round 18. PRODUCTION CANDIDATE main 65152c1b, source D:/pyrefly-rel26c. No browser opened and no server started, so there was nothing to stop and no port to close. The only processes I started were vitest runs in D:/pyrefly-rel26c, and every one has exited. Scratch: D:/Final Fantasy/critic/rounds/round-18/combat/.]

WHAT CHANGED IN COMBAT. git diff 1a6fd3cc..65152c1b is EMPTY for src/battle, src/data, src/engine/tactics, src/story, BattlePresenterActive.ts, BattlePresenterEvents.ts, BattleScreenSetup.ts and BattleScreenCarry.ts. Against live 31a (52a431d0), src/battle differs by one line: the ICON_PRIORITY export in turnQueue.ts. So no game-data value changed and there was nothing new to audit against research/. Presenter changes are timing only: pace.ts, fx C hit-stop in BattlePresenterBeats.ts, and the miss SFX fallback.

PACING: presentation only. pace.ts scales presenter sleeps and actor tweens. The FFX-2 Active pump waits on the unscaled baseSleep, and BattlePresenterActive.ts property 5 says 'an animation does not pay the clock'. tests/unit/pace-option.test.ts plays real chapters through the real presenter on both games and passes. The capture owner's ?pace=current control on Trema seed 1 lost too (81 turns). So steady pacing changes no outcome.

O3 STATUS INFORMATION matches the sources and the engine:
- FFX Zombie hint (statusWords.ts:122-124) against ffx-combat-core §4.2 l.560 and the cure table l.599-605: Holy Water and Remedy cure it, Esuna does not, a revive KOs a living Zombie.
- The engine data agrees: holy-water removesStatuses [zombie, curse] and remedy includes zombie (src/data/ffx/items/cures-utility-1.ts:135-181). ffx-statuses.test.ts pins that ESUNA_CURES excludes zombie. fb0929-zombie-warning.test.ts pins that Phoenix Down on a living Zombie KOs.
- FFX-2 hints match ffx2-combat-core §2.8 (l.497, 513, 514, 516).
- Stop's freeze is FFX-2 only: status-display.md l.109 says 'not an FFX status', l.155 gives the freeze [verified: 2 sources]. Zombie is FFX only.
- At runtime the hint was shown on the real-key Seymour Flux probe (probe-seymour-flux-1600x900-cand/run.json, 'GUIDE ZOMBIE Healing turns into damage...').

TESTS. Full unit suite on the candidate:
- 697 files, 10,476 tests passed, 40 skipped, 1 failed (vitest-full.json, 138 s).
- The failure is strategy-ffx2-bahamut.test.ts 'heal-only route' timing out at 15 s under host load: ComfyUI was on the GPU and the suite ran in parallel. Re-run alone it passes 19/19 in 7.3 s, so it is saturation, not product.
- The suite includes ffx-engine-golden, ffx2-atb-golden, ffx-ctb, ffx-ctb-locks, ffx-statuses, ffx-formulas, ffx2-chain, ffx2-atb-speed, ffx2-status-locks, the status-o3-* tests, pace-option and every den-of-woe, trema and sin chapter test.

RUNTIME = ENGINE (CHK-023, ffx-replay.json). 16 of 16 applicable real-key FFX logs from this round's captures replay event for event through the pure candidate engine at their recorded seeds, with identical outcomes:
- II 1,167 events; III 1,292; VII 599; VIII win 606 and loss 119; IX 191; X 346; XII x4 (587, 1,093, 560, 572); XVII link 1 at seeds 1 and 1001 (996, 1,068); XVIII at 1 and 1001 (434, 406); Chapter I 671 (full this time).
- Isaaru's log is last-link only, so replay does not apply to it.

CARRIED DEFECT RE-VERIFIED. PR-0267 is still present with identical numbers (bushido-fail-bonus.json, a fresh fork on this engine): canon fail 2,432; wrong press at 3.9 s 3,617; success at 2.5 s 3,192.

The Den of Woe soft-lock (R18-CE-01) is NOT an engine defect. The engine enters Gippal with the carried Stop and advances: Grinder on Yuna first, the same as live 31a's log (den-stop-seam.json). It is scored in delivery and cross-referenced here, not deducted. No canonical tactic is penalised. The score equals round 17 because the engine, data and advisor are byte-identical and every re-run matched.

### encounter: 8.8

SEEDED THREE-LINE BENCH, re-run fresh on the candidate (ffx-three-line-r18.json: intended, advisor and mash lines; seeds 1-40 plus 40 large seeds; 9 FFX chapters). All 53 of 53 rows are byte-identical to round 17, which is what identical engine, data and tactics should give. The v4 card lift on XII and the v3 figures therefore carry unchanged (PR-0280).

REAL-KEY OUTCOMES this round (runs-summary.json):
- Won: I, II, III (208 turns, the same as r17), VII, VIII, IX, X, XIV Isaaru, FFX-2 Bahamut, Fallen Aeons, Ixion (desktop and phone), Leblanc, Vegnagun.
- Won on a retry: XII (lost on seed 1, won on 1001; the phone lost twice, as in r17) and XIII Trema (the seed-2 route won on 1002; seed 1 lost on 1 and 1001).
- Lost: XVII and XVIII, both attempts, the advisor-following Sin races (PR-0269, carried).
- Losses and retries by real keys: VIII and Bahamut.

DEN OF WOE (XV): the Stop-at-seam bench (den-stop-frequency.json, the builder's own lines, shipped kit, seeds 1-200).
- Share of runs that enter link 2 with a living girl in Stop: sourced intended line 22/200 (11%) at Wait with 0 ms decisions, 30/199 (15%) at Active with 2.5 s decisions; credible no-Remedy mistakes 56/57 and 126/136.
- On the candidate every one of those runs soft-locks at link 2's opening (R18-CE-01, scored in delivery).
- Link 1 plays as sourced, and Baralai's Looming Glacier Stop at 254 is as researched.

Sin difficulty (PR-0279) and Chapter III's gauntlet length (PR-0257) are unchanged questions for Bailey. SIN_LINK3_CHECKPOINT is still false (sin-genais-core.ts:199; PR-0268, prep owns it).

Steady pacing does not move any outcome: FFX is event-deterministic, FFX-2 animations never pay the ATB clock, and the capture owner's ?pace=current Trema control lost the same way. The score is unchanged from round 17: no encounter data, AI or tactic changed, and the benches reproduce exactly.

### visual: 8.9

[visual-targets auditor, deep round 18, PRODUCTION CANDIDATE main 65152c1b, D:/pyrefly-rel26c/dist-gate, bundle index-DP4ruBbc.js, artifact 446ef3af85dffd82205140a18fbdcf157b47a62f206cc31676c5876282e6415b (1013 files; manifest I built: critic/rounds/round-18/visual/artifact-manifest-dist-gate.json). Not deployed, so the deployment verdict is NOT APPLICABLE.] I opened no browser and started no server, so no port needed closing. I judged only the capture owner's evidence: headless Chromium, PYREFLY_BROWSER=gpu, at 1600x900, 2000x1012 and 390x844. I left out the 4 frames marked verified=false (the 30-post-scene frames of I, II, VI and VIII, which landed on results). WORK: 105 target-vs-build composites (critic/rounds/round-18/targets/*.jpg; pairs in critic/rounds/round-18/visual/pairs.mjs and targets/pairs.json; grids in visual/grids/g00-g45 and p0-p20). Contact sheets: visual/st-midfight-all.jpg (all 16 capture chapters mid-fight), st-ixion-edge.jpg, st-phone-backdrops.jpg, st-leblanc-r17-r18.jpg, st-veg-r17-r18.jpg, st-firstrun-step3.jpg, st-isaaru-seq.jpg. PROTECTION: approved art 290/290 and judge-locked 48/48 byte-identical in the dist-gate manifest (visual/hashcheck-candidate.json). verify-approved with ROOT=D:/pyrefly-rel26c: 338 ok, 0 mismatched, 0 missing. FOR: (1) Eye candy D (golden-hour grade, living paintings, glow and floor reflection) renders to its approved D rest frames. In Ch I, IV, VII and XVI at 1600x900 the build is near-identical in composition and grade to d/stills/*-rest-on.jpg. On the phone (Ch I, IV, XVI), layout and grade match d/phone/*.jpg. Each game keeps its own skin: gold for FFX, pink for FFX-2. Spectacle hits read, e.g. Yunalesca's 1807 spark burst and BFA's 1710 slash in 23-midfight. (2) The calm camera matches ch1-calm-a and ch4-calm-a. (3) Status marks follow the sources. Zombie is a green body with black smoke (research/status-display.md §2); Curse has its own chip and message line in both games. (4) Mid-fight frames of all 16 capture chapters: facing, ground contact and scale hold, and every targetable enemy is identifiable (the Ch III Pagodas, Vegnagun's parts on links 2-4, the Leblanc trio, the Magus Sisters, Sin's fins and head). (5) All portraits, speaker plates, pause close-ups, results paintings and hero plates are painted, and none shows a monogram fallback. (6) First run O2 steps 1 and 2 match o2-step1/step2 at 1600x900 and 390x844 in anchor, slab, chevron, words and pips. AGAINST: (a) New major inside the new feature (R18-VIS-01): the status-O3 cure hint collides with other panels. At 1600x900 in Ch I it sits over the NEXT BEST MOVE card and hides that card's header and first line. On the phone it covers 60% (Ch IV) to 87% (Ch I) of the top command row. The O3 target shows neither overlap. (b) Polish (R18-VIS-02): the O2 step-1 spot follows a later selected card. On the phone Ch XII run it says 'Start with the first one' over Seymour Omnis. (c) Step 3 of O2 never appears in this evidence, because the harness pressed Esc at prep, which skips the guide by design. It is UNVERIFIED, not failed. (d) One Ch XIV mid-fight frame is a full-screen grey wash, probably a summon transition caught mid-fade; this is not established as a defect. NOT CAPTURED: 2560x1440, 4K, 4:3 and 21:9 (so CHK-013 stays UNVERIFIED); Sphere Grid A, C and B; targeting s1 multi-target; the FFX-2 desktop O3 marks without the turn cut-in over them (the probe frame caught Yuna's cut-in); eye-candy impact, splash and lance moments against their D stills. GAIN vs round 17 (8.9): a real look gain, eye candy D and the calm camera delivered on target. It is offset by the new O3 collision major, so the score is held at 8.9.

[chief, after the gap pass] Held at 8.9. The gap pass answered most of this auditor's missing captures: 2560x1440 in-game frames of I, IV, VII, XVII and XVIII render correctly at rest and in action (the chief viewed gaps/contact-2560.jpg), eye-candy D hit, splash, impact and spell moments were caught in I, IV, VII and XVI and the Aerospark lance is visible on the phone tier, the X-2 O3 marks read with no cut-in, and the Ch XIV grey wash was a transition (a clean rest frame exists). Against: the 4K pause painting is not full-bleed (PR-0293). Net unchanged.

### feel: 8.4

[feel auditor, deep round 18, PRODUCTION CANDIDATE main 65152c1b from D:/pyrefly-rel26c, not deployed. I worked only from the capture owner's evidence in critic/rounds/round-18/evidence: headless Chromium, PYREFLY_BROWSER=gpu. Most runs were captured between 08:18Z and 11:30Z, while ComfyUI was rendering on the GPU. The Ch VII run was captured at 11:55Z, after the GPU went idle. I opened no browser and started no server, so no port was left open and nothing needed stopping. I ran only node tools/critic-plan.mjs --json in the worktree. The worktree status was the same before and after: M docs/deploys.log and ?? dist-gate/ were already there. Scratch is in critic/rounds/round-18/feel-narr/: 134 contact sheets from sheet.py, dbox-all.txt, critic-plan.json and a few crops.] WHAT COUNTS AS A GAIN HERE: an owner-reported feel problem that has an approved remedy with measured evidence. New effects alone do not count. GAINS: (1) Friends' 'too fast' complaint, addressed by steady pacing (D-294). Measured on this build with identical seeds and identical turn counts, wall time per turn against round 17 grew by x1.14 in Ch I, x1.17 in II, x1.16 in III, x1.16 in VII, x1.15 in X and x1.10 in IX, all FFX. It grew by x1.11 in IV (FFX-2). That matches the per-game table (FFX 1.2 / FFX-2 1.1; CHK-021). (2) Friends' dizziness complaint, addressed by the calm camera (D-291). At BFA seam 1->2, round 17 dollied into a tight Valefor close-up that dropped the party out of frame. Round 18 makes a small push and keeps the party in frame (braskas-final-aeon-win__seq-seam-2 in both rounds). The Ch II entry move is gentler in the same way. (3) Spectacle C reads: Lance of Atrophy gets an impact flash at about 40 ms, and the 799 numeral holds about 0.75 s. Yuna turns Zombie-green on the hit (seymour-flux-win seq-action-playing). The FFX-2 chain chip and Trema's 9999 read clearly (ffx2-trema-win-s2 a2-seq-action-playing). (4) Skip and pause are still respected: in 28 of 28 runs, Esc over the pre-scene opens pause and one hold skips (runs-summary.json). (5) Comfort, FFX-2 Ch XVI: REDUCE MOTION gives rm=true, drift 0 and no new hit-stop, and this survives a reload. LOW EFFECTS gives the low tier with half drift (fxcomfort-ffx2-ixion-djose run.json). The FFX comfort run toggled the rows out of order (rmRow null, rmRow3 OFF), so its p2 and p5 phases are harness artefacts and not evidence either way. LOSSES AND OPEN: (a) Entry to the first usable menu is longer. From the end of the transition sequence to the first-menu capture took 1.3-2.5 s in round 17 and 4.5-5.8 s in round 18 (index timestamps; I, II, IV and VII). The VII run was captured after the GPU was idle, so GPU contention does not explain it. The boss caption now lands at 2.36 s in Ch II against 1.29 s. PR-0061 is therefore very likely worse, but it was not measured directly. (b) New: the status message line lags the action and splits one Hastega into three lines. 'Kimahri was hasted.' appears during Seymour's next action, and Yuna's Zombie line is not shown within 2.2 s (R18-FN-02). (c) PR-0104 is open for a 4th review (STALLED). In Ch IV, 2.3 s now pass from the Shell confirm to Rikku's menu with no Shell visual; round 17 measured 1.8 s. (d) PR-0244 (major): Ch VII's kneel and fall narration still plays over the standing Seymour. (e) The Ch XV seam freeze is scored under delivery (R18-FN-01), but it is the worst feel moment in the build: a frozen frame with Yuna missing and a black band on the right, for 44 minutes. NOT MEASURED (no credit given): input latency, hold-skip to first menu, REDUCE MOTION over an actual crit or finishing blow in motion, the phone Aerospark lance, and Bailey's own feel verdict (CHK-B2). Net: the owner-reported feel problems have measured, approved remedies, offset by a longer entry and a new message-timing defect. 8.3 -> 8.4.

[chief, after the gap pass] Held at 8.4. The gap pass measured what the auditor could only infer: the hold-skip to the first menu is ~2.7 s longer at the new defaults (PR-0061), the status line trails by 1.6-2.5 s (PR-0285), the Shell dead window is 2.27 s (PR-0104), and the Ch VII kneel/fall still plays over a standing Seymour (PR-0244, silent-plate half now passing). On the plus side REDUCE MOTION removes every impact frame and hit-stop in motion (Ch I 34 hits, Ch XVI 53 hits, 0 impact frames) and the phone Aerospark lance reads. The auditor had already priced these in.

### narrative: 8.8

[narrative auditor, deep round 18, candidate 65152c1b] Dialogue timelines come from the dboxTimeline in the run.json of 59 runs (feel-narr/dbox-all.txt). src/story has no diff between 1a6fd3cc and 65152c1b (git diff --stat is empty), so the scripts are the ones round 17 reviewed. research/ changed only in camera docs. GAINS: (1) The CHK-022 debt is closed by real input on this build. Aftermath III: 7 links, then 'Rikku: Is that it? Did we-' ... 'I left in the part where she kept walking.', results, CONFIRM, board and reload. Aftermath XII: lost on seed 1, RETRY, won on 1001, then Seymour 'So. This is how it ends for me' through Auron 'Then don't keep him waiting.'. Aftermath XIII (seed-2 route): Trema 'Why do you fight, if not to forget?', Yuna 'For what I made with them. Every day of it.' and the narrated exit. The VIII loss + RETRY reaches prep and then battle, and the FFX-2 loss + RETRY is shown in IV. (2) With XIII, 15 chapters reach their aftermath by real input: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII, XIV and XVI, in both games. Tone per game holds: FFX is elegiac with short lines (Lulu and Ginnem in IX, Isaaru in XIV). FFX-2 is quick and warm with banter (Leblanc's Syndicate lines, 'We don't hover.' in XI). Chapter X Talk still gets answers ('Stop talking. You never say anything.'). Auron's first-run lines are in his terse register ('Eighteen fights. That is all this is.'). (3) PR-0161 is resolved. The Chapter V Farplane voices carry the plate 'Farplane' (Braska, Auron, Jecht) in both round 18 and round 17 evidence, so round 17's 'Final Aeon / High Summoner' observation was stale. The status message words are sourced per game (FFX-2 Itchy matches ffx2-combat-core.md l.504). LOSSES AND OPEN: (a) Chapter XV cannot pass link 2 on the candidate (R18-FN-01, scored in delivery). Its link-2 and link-3 banter ('Gippal? He'd never pick a fight with me.', 'Nooj too. All three of them.') and its aftermath are unreachable when Yuna carries Stop into the seam. Live 31a reaches those beats. This is a separate, demonstrated consequence (reachable scenes), so it is cross-referenced here. (b) XVII and XVIII were lost again (both 2 attempts, the same turn counts as round 17), so the Sinfall and XVIII aftermaths remain UNVERIFIED. (c) Still open with unchanged scripts: PR-0254 (Ch VII Talk silent: Talk at fight ms 4304 and 22350 produces no line), PR-0255 (Tromell's 5 lines have speaker ''), PR-0272 (XVII cannon beat is a caption only; the seam frames show no hit), PR-0256 (the XVI whistles are told, not shown) and PR-0262 (widened: '...Okay. Next one.' is the first-choice quip in I, II, VIII, XVII and XVIII). The harness hold-skips after 2-4 lines, so staging is judged from timelines and scripts. Bailey's own story read is not recorded (CHK-B3). 8.9 -> 8.8.

### audio: UNVERIFIED

[Audio auditor, deep round 18. Production candidate: main 65152c1b, D:/pyrefly-rel26c/dist-gate, not deployed. Live is release 32 (1a6fd3cc, bundle ChAAAZ-I), deployed 2026-09-30T08:39:30Z per docs/deploys.log.] I cannot hear, and I listened to nothing. Every result below comes from reading data and from offline decoding. No score is given because none can be given. docs/audio/OWNER-VERDICT.md is unchanged since round 17: the newest entry is 2026-09-28, and it matches the main tree byte for byte, apart from line endings. docs/target/decisions.json holds no numeric owner verdict either. D-292 (music O1, the V0 re-encode) and D-293 (SFX balance b) were adopted on the driver's recommendation; neither is an ear score. The latest owner-side ear verdicts are unnumbered and negative or partial: 'still sounds like snes music' (09-27), 'tinny and hollow ... close to good' (09-28), and the friends' 'music bad' (09-29), which Bailey concurred with. Under RUBRIC section 6 the category is UNVERIFIED: it is neither averaged away nor zero.

WHAT CHANGED against live 1a6fd3cc, measured against critic/artifacts/1a6fd3cc.json:
- All 26 music files and audio/manifest.json differ. They are the same R1 masters re-encoded at LAME V0: 218 to 283 kbps VBR, 44.1 kHz.
- The SFX sprite is sha256-identical to live (baa3288e...).
- Audio code: src/audio/sfxMix.ts (the default is now b, trim 1; a is re-based to trim 0.5, c to 1.581), src/audio/AudioManager.ts (default SFX_DEFAULT_VOLUME 0.70), src/app/SaveData.ts and src/app/saveSfxBalance.ts (the one-time D-293 migration), and five new sphere-grid UI SFX calls (cursor-move, confirm, cancel), all present in the sprite.
- The music budget constant was raised from 60 to 85 MB in tools/audio/manifest-io.mjs, with D-292 cited.
- dist-gate/audio is byte-identical to public/audio: 28 of 28 files. dist-gate/audio/candidates holds only empty folders, so no candidate audio ships.

TECHNICAL: PASS.
- `node tools/audio/qa.mjs --strict` in D:/pyrefly-rel26c exits 0 with 0 cue findings, 0 SFX findings and 0 manifest problems.
- The 26 cues measure -15.98 to -16.21 LUFS and -1.34 to -1.64 dBTP, with 0 clipped samples. Every loop seam, every flux gate and every tilt gate passes.
- Against round 17 the V0 encode changed nothing that matters: durations and loop points are identical, loudness moved by at most 0.02 LU, and true peak moved by -0.31 to +0.21 dB.
- Total shipped audio is 80.93 MB of the 85 MB budget; the music alone is 78.2 MB.
- An independent ffmpeg decode of all 27 media files gave 0 errors.
- ebur128 spot checks (title, boss-yu-yevon, victory-ffx2, boss-shuyin, pause) all read -16.0 LUFS and -1.4 to -1.6 dBFS peak.
- Stereo: L/R correlation is 0.655 to 0.837 and mono-sum loss is -0.37 to -0.88 dB on all 26 cues, matching round 17 to within 0.003. The 'hollow' fix survives the re-encode.
- Data: critic/rounds/round-18/audio/qa-strict.json, qa-strict.txt and audio-r18-decode-stereo.json.

THEMES: themes-audit agrees with all 18 rows of the chapter cue map. The same 4 cues depart from the bible as in round 17: scene-gagazet, scene-dreams-end and scene-farplane have no tempo map (PR-0039), and scene-macalania-temple is not in the bible's cue map (PR-0260). 11 of 18 chapters still borrow stand-in cues (PR-0099). The THEMES.md table still breaks after the XVI row (PR-0278).

ROUTING: PASS, from the capture owner's runtime evidence.
- 195 AudioManager samples from 28 real-input runs (keyboard at 1600x900 and 2000x1012, touch at 390x844), GPU mode.
- 147 of 147 playing cues come from source 'prerendered'. The sprite decoded in every sample. There is no synth fallback anywhere. Every run has 0 console errors and 0 not-found.
- Scene beds, battle cues and chain seams match each chapter's music record in all 18 chapters, including VI Leblanc, which had network evidence only in round 17.
- Wins: victory-ffx on every FFX win and victory-ffx2 on every FFX-2 win, with no crossing. Chapter IV's results are silent, as authored (encounters.ts: no victory field). ending-ffx is requested after III and ending-ffx2 after V.
- Losses: results are silent on all of them, since the cue map has no defeat cue.
- Authored silences confirmed in code: Chapter I's wind-only opening, and Chapter III's Valefor link (braskas-final-aeon.ts:365, track null until valefor-enters).
- SFX mix: all 185 candidate samples read {option b, trim 1, busGain 0.70, sfx 0.70}. The 10 live-31a samples read sfx 0.35.
- Hit SFX fire before the new hit-stop hold (BattlePresenterBeats.ts:130, then 145), so the new eye candy does not delay the impact sound.

SAVE (audio half of CHK-024): PASS.
- 28 of 28 save-matrix cases pass. Saves written by releases 29, 30, 31a and 32-candidate, plus fixtures from releases 20 to 31a, all load.
- The rule holds exactly as stated: an untouched 0.35 without the marker plays 0.70; 0.35 with the marker is kept; 0.45, 0.7, 0 and every player-set value are kept; a missing or non-finite level plays 0.9 (D-210's pre-existing rule); a fresh or truncated save gets 0.70 with the marker.
- The mixer equals settings in every case.
- sfxwrite: real keys on the OPTIONS row step 70 to 80 to 90. The stored value, the mixer and the marker follow, and the level survives a reload.

OPEN:
- No sample was taken while the pause, title or chapter-select cues were playing. They are proven only at request level, plus the battle cue's hand-back after an Esc pause.
- There is no pad-only evidence (PR-0220).
- There is no runtime log of which SFX keys fired at bus 0.70.
- XV Den of Woe's results cue cannot be reached because of the soft-lock at link 2, which is not an audio defect: boss-shuyin keeps playing through the stall.

Measured, not heard: at the new default a hit's true peak sits about 1.5 dB under the music's true peak (it was about 7.5 dB under). The miss whiff's 400 ms momentary sits about 7.5 dB under the battle music's median (it was about 13.5 dB under).

I started no server and opened no browser. dist-gate was not rebuilt. Get-NetTCPConnection shows no listener on ports 5400 to 5990.

[chief] UNVERIFIED stays UNVERIFIED with no number (RUBRIC §6): no numeric owner listening verdict exists for this mix or its V0 encode (CHK-B1). The gap pass added: pause cue playing 'pause' in both games and handing back to the battle cue; title after the first key and chapter-select sampled; an emulated pad-only run unlocks audio (PR-0220, emulation caveat); runtime SFX log at bus 0.70 with hit and miss cues fired (crit not reached).

### interface: 7.8

Deep review round 18 of the production candidate main 65152c1b (dist-gate from D:/pyrefly-rel26c). I judged only the capture owner's evidence in D:/Final Fantasy/critic/rounds/round-18/evidence: index.json, runs-summary.json, each run.json and turn-log, the logs, and the screenshots I opened. The captures were headless Playwright with PYREFLY_BROWSER=gpu at 1600x900, 2000x1012 and 390x844 (touch). There are no 1280x960, 2560x1080 or 3840x2160 captures. I opened no browser and started no server, so I had no port to close.

WHAT HOLDS OR IMPROVED:
- Advice is legal and reachable. There were 0 target mismatches in all 28 chapter runs, and the card-vs-rows overlap was 0 px² at every first menu. On desktop every advised row was found and taken, except the known 'last aeon Summon' harness cases. The phone Ch XII runs had 3+3 advised rows the tap harness fell back from (NulTide, Elixir, Stamina Tonic). That points at paging but does not prove a product defect.
- The advisor text floor holds: 14.2 px effective on desktop and 15 px on the phone, with 0 clipped rows.
- Esc and P open and close the pause in all 28 runs, both games. N hides the advisor, E the intent and G the guide. Target Escape returns to the menu with 0 targets left.
- X-2 BATTLE flips to ACTIVE by real keys (ffx2-bahamut-lose/15-options-active.png).
- Intent stays honest: SCRIPTED, RANDOM TARGET, 'Lands on one of these, picked when it acts', MOST LIKELY 83% (ffx2-bahamut-win/11-advisor.png).
- The new status display O3 adds non-colour information: glyph icons on the plates and turn list, 'Paine was cursed.' message lines, and cure hints written per game.
- The three new OPTIONS rows work by keys and mouse in both games: 6/6 toggles, and the live look flips in the same frame (fxrows-seymour-flux-1600x900, fxrows-ffx2-bahamut-2000x1012). They also work by real touch drags plus taps on the phone (probe3b-*: 3/3 in each game).
- CHK-007: a grep of the captured briefing, dossier, prep, advisor, intent and results text found no developer vocabulary.

WHAT HOLDS IT DOWN:
- R18-IF-01 (major, newly found, also on live 31a): after RESTART ENCOUNTER, the title screen stays composited under the restarted fight in both games, and the actors render as silhouettes.
- R18-IF-02 (major, new feature): on the phone, the O3 cure hint covers 60-87% of the top two command buttons.
- PR-0265 (major, carried): tapping ESC RESUME was not retested, and PauseView.ts is unchanged.
- R18-IF-03: on desktop FFX with the guide off, the hint covers the advisor header.
- R18-IF-04: the FFX-2 settings column now overflows (STRATEGY GUIDE cut in half, BATTLE HELP below the fold).
- R18-IF-05: the phone status message is drawn over the dialogue text.
- R18-IF-06: the phone help line is ellipsised.
- Carried and confirmed still present: PR-0275 (board truncation and clipped numerals at 1600 and 2000), PR-0250 (phone results caption), PR-0237 (phone coach over the FFX-2 intent line), PR-0274 (no advisor card at the first Sin menu).
- CHK-002, CHK-003 and the rotation shapes are UNVERIFIED.

WHY 7.8 (8.2 in r17): the new features work and add real information. But one pre-existing major that r17 missed (the restart composite) and one new phone major hide what the player must read. This category's gain criterion is fewer open majors than r17; there are more.

[chief, after the gap pass] Held at 7.8. Confirmed worse: ESC RESUME fails 0/32 by click and tap (PR-0265); the phone hint card covers the command row at every decision and ignores BATTLE HELP OFF (PR-0282); a phone tap on another ally still commits a heal with no Zombie forecast (PR-0264); 4:3 HUD text at 9.3-9.8 px (PR-0251). Confirmed better: multi-target ALL ALLIES reads in both games, the desktop Zombie forecast matches the O3 target, and the FFX-2 OPTIONS column is fully reachable by keys and wheel (PR-0287 downgraded to cosmetic). Net unchanged.

### onboarding: 8.4

GAINS:
- Guided first run O2, steps 1 and 2, verified on fresh profiles in both games:
  - 1600x900 keys: seymour-flux-win/03-card.png 'AURON · 1 OF 3', 04-prep.png '2 OF 3'.
  - 390x844 touch: ffx2-ixion-djose-win-touch/03-card.png and 04-prep.png, with TAP wording.
  - The skip path works: Esc at step 2 keeps party prep and ends the guide in all 27 candidate runs (prepEsc=party-prep). Live 31a goes back to the board.
- The three eye-candy rows default ON, are reachable by keys, mouse and real touch drags plus taps, and persist across a reload (afterReload fxLiving=false kept).
- REDUCE MOTION and LOW EFFECTS reach the new looks, and both persist across a reload:
  - FFX-2 Ch XVI: REDUCE MOTION holds drift at 0. LOW EFFECTS gives tier low, 2 to 1 lamps, about 30 % particles and haze 0.
  - FFX Ch I: tier low, 4 to 2 lamps, haze 0, drift 0.
  - Source: fxcomfort-*/run.json. The FFX run's REDUCE MOTION phase labels are one step off (rmRow null), so FFX motion evidence rests on phases p3 to p5.
- Settings survive the upgrade in 28 of 28 save cases (save-matrix-verdict.json), including handmade textSize, reduceMotion and fx values.
- Status cues are glyphs plus words, not colour alone.

WEAK OR MISSING:
- R18-ON-01 (major, newly found, same on live 31a): clicking REPLAY BRIEFING in the pause shows nothing. The briefing is live in the DOM but not drawn, 8 clicks do not clear it, and the first Esc is swallowed. This holds in both games.
- PR-0266 and PR-0270 (TEXT SIZE collisions at 130 %; FFX-2 HUD and pause do not grow) are carried. hudTextSize.ts is unchanged since r17, and nothing was re-measured.
- PR-0032 (no REDUCE FLASHES, no remap) matters more now:
  - Spectacle ON by default adds ink impact frames (budget 3 per rolling second) and lens flares.
  - A soft-flash path exists (SpectacleRules.impactFrame 'soft', LensFlare peak 0.35), but it reads a 'reduceFlashes' setting that no row writes.
- R18-ON-02: the phone OPTIONS list is a scroll window about 100 px tall (4 of 10 rows visible).
- R18-ON-03: step 1 says 'Start with the first one' while another chapter is selected.
- R18-ON-04: the phone Curse hint drops Esuna and Remedy.
- None of the three new rows has help text. It follows the approved A2 frame, so this is a question for Bailey.
- UNVERIFIED this round:
  - O2 step 3: the harness pressed Esc at step 2 in every run.
  - The Sphere Grid A explainer and C AUTO-LEARN.
  - The O3 Zombie heal forecast (PR-0264).
  - The status marks held still under REDUCE MOTION.
  - Gamepad.

NEWCOMER WALKTHROUGH: simulated, not real. A scripted harness used only visible prompts, with ordinary keys at 1600x900 and 2000x1012 and taps with keyboard fallbacks at 390x844 (75 fallbacks in the Ixion phone run).

WHY 8.3 (8.2 in r17): O2 and the comfort reach are real gains. They are offset by the broken replay, the missing flash setting next to a flashier default, and the unverified step 3.

[chief, after the gap pass] 8.3 -> 8.4. The auditor withheld credit for O2 step 3 only because it was unobserved; the gap pass captured it on fresh profiles by keys at 1600x900 and by taps at 390x844 (ring over ATTACK, 'Pick/Tap ATTACK, then pick/tap who it hits.', the guide ends after the target) and proved its absence in FFX-2 Ch IV; the Sphere Grid A explainer works by keys and taps; REDUCE MOTION holds in motion. Still against: REPLAY BRIEFING invisible (PR-0284), TEXT SIZE 130 % re-measured failing in both games (PR-0266, PR-0270), no REDUCE FLASHES (PR-0032), AUTO-LEARN has no key route (PR-0292).

### prep: 9.0

Candidate main 65152c1b (D:/pyrefly-rel26c/dist-gate, bundle index-DP4ruBbc.js). The capture owner used headless Chromium from node with PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti). I opened no browser and started no server. My work: the capture owner's evidence (critic/rounds/round-18/evidence: index.json with 1,111 entries, runs-summary.json, 28 run.json files, save-matrix/, perf/, logs/) plus one vitest run on D:/pyrefly-rel26c: 29 files, 434 tests passed (critic/rounds/round-18/prep-delivery/vitest-prep-delivery.txt).

PREP AGENCY: every one of the 18 chapters reached party prep by real keys, and Esc from prep behaves as before. FFX-2 dressphere changes were played by real input in V, VI, XI, XIII, XV and XVI (seq-spherechange). The Sphere Grid is FFX only. Its A (explainer card), C (AUTO-LEARN with undo) and B (bigger grid, preview and route, walk and activate, phone page) are all new, and no capture of them exists. sphere-grid-autolearn, -b, -help, -model, -fb0929 and save-sphere-card pass on the candidate, but the in-game interaction is UNVERIFIED (see capturesNeeded) and gets no credit here.

RESULTS AND REWARDS: unchanged. AP/EXP, GIL, ITEMS and per-member lines show. 'no full turn taken · no AP' still appears (Omnis, Tidus). PR-0258 is re-confirmed: Ch VII shows OVERKILL x1 with 'Ability Sphere x3'.

RETRY: every loss reached RETRY, then prep, then a new battle: VIII, IV (Active by real keys), XII desktop and phone, XIII, XVII x2 and XVIII x2. From the end of the fight to the next battle took 7.3 to 7.8 s including harness waits (round 17: 6.0 to 7.3 s; steady pacing is Bailey's pick). flow-checkpoint-retry and pause-restart-checkpoint pass for all 18 chapters.

PROGRESS: every win's clear survived a real reload (15 wins). The upgrade matrix passed 28/28 (see delivery, CHK-024).

DEDUCTIONS:
- PR-0268 (major, carried): SIN_LINK3_CHECKPOINT is still false at sin-genais-core.ts:199.
- PR-0258 (polish, carried).

The Chapter XV lock also blocks that chapter's clear. It is scored once, in delivery (R18-DEL-01).

No change from round 17 (8.9). The score is provisional while the Sphere Grid remains unobserved.

[chief, after the gap pass] 8.9 -> 9.0. The auditor called the score provisional only while the Sphere Grid was unobserved. The gap pass drove it by real input on the candidate: A appears on the first open (Left/Right/Enter, ? reopens), C AUTO-LEARN took Tidus S.LV 30 -> 23 over 4 nodes and UNDO restored 30 on desktop keys and phone taps, B shows gain, sphere, path cost and S.Lv after, routes read in words, WALK + arrows + Enter walks and activates, the phone page works, and FFX-2 prep has no Sphere Grid tab. This answers the friends' 'sphere grid confusing/buggy' with a measured, approved remedy. Against: PR-0268 (major), PR-0292, PR-0295 and PR-0258 (polish).

### delivery: 7.8

CANDIDATE IDENTITY: I built a decode-checked manifest of D:/pyrefly-rel26c/dist-gate:
- 1,013 files, 550.4 MB;
- artifactHash 446ef3af85dffd82205140a18fbdcf157b47a62f206cc31676c5876282e6415b;
- decodeChecked true, problems [], audioUnverified 0.
File: critic/rounds/round-18/prep-delivery/artifact-manifest-dist-gate.json.

Against release 32's candidate (round 17 manifest), the diff is exactly: the new bundle, css and map; 8 depth-map files under fx/ (4 rooms); index.html; and 27 re-encoded music files. Music grew from 43.0 to 81.0 MB (V0; each cue about 1.9x). No art changed (prep-delivery/diff-vs-r17-candidate-1a6fd3cc.json). fx-assets verify on dist-gate/fx: PASS. Main's history holds no public/fx files.

FLOWS (CHK-022): 28 runs, 0 console errors, 0 responses >= 400, 0 images served as text/html (network-and-console-summary.json, every run.json).
- Won by real keys through results, board and a reload that keeps the clear:
  - FFX: I, II, III (aftermath III debt settled), VII, VIII, IX, X, XII (loss, RETRY, win; debt settled) and XIV;
  - FFX-2: IV, V, VI, XI, XIII (aftermath via the seed-2 route; debt settled) and XVI (desktop and 390x844 touch).
- Losses: VIII and IV reached Defeat, RETRY and a new battle.
- CRITICAL R18-DEL-01: Chapter XV locks at the link 1->2 seam when Yuna carries Stop. It happened 4 of 4 times on the candidate, including ?fx=off and ?pace=current. Release 31a's artifact played the identical state on through link 3.
- XVII and XVIII were not won on this build (advisor-following harness, 2 losses each; the known PR-0269). Those wins are UNVERIFIED.

SAVE (CHK-024, the save-data class), by running (save-matrix/save-matrix-verdict.json, sfxwrite-seymour-flux-1600x900/run.json):
- Saves written by the release 29, 30, 31a and 32-candidate artifacts themselves (bundles C73AJ1Ds, B0cfXTil, C_4T6wOX, ChAAAZ-I), fixtures from releases 20/25/28/29/30/31a, and edge cases all passed: 28/28.
- Every clear, best time, attempt, flag, coach id and unlock is kept, and every case survives a reload.
- SFX rule exactly as stated: an untouched 0.35 without the marker plays 0.70; 0.35 with the marker, 0.45, 0.7 and 0 are kept; a missing or non-numeric level plays 0.9 (D-210's own rule, saveSfxBalance.ts). The first real write stores 0.70 with sfxBalanceMigrated=true.
- fxLight, fxLiving and fxSpectacle default true; all-false and mixed values are kept; non-boolean values coerce to on; the live switches match.
- The three OPTIONS rows flip, persist and apply live by keys and by mouse (1600x900 FFX, 2000x1012 FFX-2), and by taps at 390x844 in both games after a swipe (probe3b).
- REDUCE MOTION and LOW EFFECTS cut drift and tier and persist through a reload (fxcomfort-*).

LOAD AND FRAME TIME: headless Chromium, cold profile and cache, localhost vite preview, RTX 5070 Ti. Measured 10:44-10:54 EDT, after the ComfyUI window: GPU at 21 % before and 8 % after (logs/gpu-state-*.txt).
- Title 0.24-0.26 s; board 0.91-0.94 s after the title.
- Loading card 0-0.15 s unthrottled and 2.3 s at 50 Mbit/s (Ch I).
- Frames: average 59.1-60 fps, p95 16.7-16.8 ms. Maximum spikes 116.7 ms (Sin Face fight) and 83 ms (Flux), with fx on and fx off alike.
- Phone tier (390x844 viewport on the desktop GPU): p95 16.7-16.8 ms, ON versus OFF within noise. This is a pass on this host only; a real phone GPU is UNVERIFIED.
- 10 Mbit/s was not measured, although music bytes doubled (PR-0240).

NEVER RUN (UNVERIFIED): Firefox, WebKit and Edge; a real phone; a controller; the live artifact (not deployed).

SERVERS: I started none. At 11:04 EDT Get-NetTCPConnection showed no listener on ports 5400-5990.

From 8.7 to 7.8: a new critical lock that regresses against live outweighs the stronger save coverage and the smaller spikes.

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | PASS | yes | Technical and routing half only: qa --strict 0 findings, 26 cues -15.98 to -16.21 LUFS, 0 clips, loop seams pass, ffmpeg decode 0 errors, stereo correlation unchanged; 147/147 playing cues prerendered, no synth fallback. The ear half is CHK-B1 (UNVERIFIED). |
| CHK-002 | FAIL | yes | At 3840x2160 the pause painting covers only 3369x1925 of the window in all five chapters measured (PR-0293). 1600x900, 2000x1012, 2560x1440, 2560x1080 and 390x844 are full-bleed. Separately the restarted fight keeps the title layer mounted (PR-0283). |
| CHK-003 | FAIL | yes | At 1280x960 the battle HUD has 32 (FFX) and 35 (FFX-2) visible elements under 14 px, minimum 9.8 and 9.3 px (PR-0251). 2560x1080: 3-7 under 14 (13.6-13.9 px). The advisor floor holds at 1600x900 (14.2 px) and 390x844 (15 px); the new OPTIONS rows are at least 14 px at 2560x1080 and 4K. |
| CHK-004 | PASS | yes | Desktop: every advised row was found and taken in the menu it names, card-vs-rows overlap 0 px² in all 28 runs. The only exceptions are the 'last aeon' Summon cases, where the engine did summon, and one FFX-2 Mega Phoenix at Vegnagun turn 144 (no target cursor, cause not established). Phone: 6 advised submenu rows were not reached by the tap harness in Ch XII. That is recorded as a harness gap, not a product result. The gap pass adds: the desktop Zombie forecast is honest (-1000 KO); the phone tap-commit is filed as PR-0264 (input, not advice). |
| CHK-006 | FAIL | yes | RESTART ENCOUNTER leaves the title root mounted and visible over the restarted fight until results in both games (PR-0283); REPLAY BRIEFING mounts under the pause and swallows the next Esc (PR-0284). Both reproduce on live 32. Target cancel (0 targets left) and coach dismissal pass. |
| CHK-007 | PASS | yes | A grep of the captured briefing, dossier, prep, advisor, intent, seam and results text in all run.json files found no §, file stems, row/step numbering, debug, TODO or placeholder. The new guide slabs, status messages and hint cards read as plain player copy in the screenshots I opened. |
| CHK-008 | FAIL | yes | The status-O3 hint card covers the phone command row (FFX 87 %, FFX-2 60 %, at every decision, BATTLE HELP OFF too) and the desktop NEXT BEST MOVE header (PR-0282); the Zombie warning slab overprints the Guide card (PR-0291); the phone status line overprints the dialogue (PR-0286); the phone coach covers the FFX-2 intent line (PR-0237); the Sin XVII phone FAR plate crosses the intent line (PR-0296). Panels at rest without the hint are unchanged against the actors. |
| CHK-009 | FAIL | yes | The board still truncates 'Sin: the Fins and the ...' and clips the Roman-numeral strip at 1600x900 and 2000x1012 (PR-0275). The phone results caption is clipped (PR-0250). The phone help line is ellipsised (R18-IF-06). The FFX-2 settings column cuts STRATEGY GUIDE in half (R18-IF-04). No 1280 or 3840 measurement. Gap pass: the board clips 'Sin: the Fins and the Core' at every size from 1280x960 to 3840x2160. |
| CHK-010 | PASS | yes | Single target (bracket, name tag, TARGET plate, turn-list highlight) at 2000x1012 and on the phone confirm button. Multi-target re-captured by the gap pass (not reused): Ch I Hastega on the party shows brackets on all three, ALL ALLIES and 'TARGET Tidus · Yuna · Kimahri'; Ch IV Yuna Shell shows 'TARGET All allies' and all three rows lit. Escape from targeting leaves 0 targets. |
| CHK-011 | PASS | yes | Every targetable enemy is identifiable in its default framing. The Pagodas and Vegnagun's parts carry markers and name tags. |
| CHK-012 | PASS | yes | No monogram fallback seen. Every portrait chip, speaker plate, results painting, pause close-up and hero plate is painted. Hero plates ch1 and ch4 are byte-identical to their approved files. |
| CHK-013 | PASS | yes | No art file changed in this candidate (approved 290/290 and judge-locked 48/48 byte-identical; verify-approved 338 ok), but eye candy D re-lights every painting, so it was judged in game again: 1600x900 frames of all 16 capture chapters against the D rest stills, and the gap pass's 2560x1440 frames of I, IV, VII, XVII and XVIII at rest and in action, which render correctly with no bars and a sharp HUD (the chief viewed gaps/contact-2560.jpg). The 4K pause fill is filed under CHK-002. |
| CHK-014 | PASS | yes | The party faces across the field toward the enemies and the enemies face back. Cast and attack poses aim at their targets, no neighbouring actors mirror into each other, and feet sit on the ground plane with contact rings. |
| CHK-015 | FAIL | yes | Most controls pass by real keys, mouse and taps on the production bundle (Esc/P/chip pause in 28/28 runs, N/E/G, target cancel, X-2 BATTLE, the three eye-candy rows 12/12 by keys and mouse and 6/6 by raw touch, REDUCE MOTION and LOW EFFECTS, first-run steps 1-3, Sphere Grid A/B/C by keys and taps, an emulated pad from title to battle). FAIL because real clicks and taps on ESC RESUME never resume (0/32, PR-0265), REPLAY BRIEFING by click does nothing visible (PR-0284), and AUTO-LEARN and ? have no key or pad route (PR-0292). H was not pressed; prep Esc-back on a returning profile was not re-run (the fresh-profile guide absorbs it by design). |
| CHK-016 | PASS | yes | 1111 index items. route-index.mjs acceptance: 0 asserted-screen mismatches and 4 UNVERIFIED captures. All 4 are 30-post-scene.png in I, VII, VIII and IV-LeBlanc: the screen was already results. This is the same harness timing as round 17, and the post scene itself was recorded as cutscene. Every custom-probe shot records screen and roots. Harness caveat filed as PR-0261: the stall runs record link 1's victory as the outcome; every reviewer read the finalState instead. |
| CHK-017 | NOT APPLICABLE | yes | The candidate is not deployed, so the exact-artifact live check does not apply; it is owed after the deploy against artifactHash 446ef3af85dffd82205140a18fbdcf157b47a62f206cc31676c5876282e6415b (1,013 files). Load and frame time were measured on the candidate (title 0.24-0.26 s, board 0.91-0.94 s, 59-60 fps, p95 16.7-16.8 ms, spikes to 117 ms; phone tier on the desktop GPU p95 16.7-16.8 ms, fx on vs off within 0.1 ms) at 14:44-14:54 UTC with the GPU at 21 % then 8 % after the ComfyUI window. A real phone GPU and 10 Mbit/s are UNVERIFIED. |
| CHK-018 | PASS | yes | grep for '.[0-9].png' and '.raw.png' in src/*.ts finds only a comment (titleMarkup.ts:11). There were 0 responses of 404 or above and 0 images served as text/html across 28 runs and 400 distinct art requests, including the four fx/<room>/depth.png maps. fx-assets verify of dist-gate/fx: PASS. |
| CHK-019 | PASS | yes | tools/artifact-manifest.mjs over dist-gate: 1,013 files, decodeChecked true, problems [], audioUnverified 0; all 27 audio media decode under ffmpeg with 0 errors and none is silent; the SFX sprite is sha-identical to live 1a6fd3cc. |
| CHK-020 | PASS | yes | Parity: the three eye-candy rows, guide steps 1-2, status icons, messages and hints, pause tabs and Esc handling behave the same in both games; SFX b (a 'both' change) is live in runs of both games (bus 0.70). Differences are written game cases (O2 step 3 and the Sphere Grid FFX only; X-2 BATTLE and ATB SPEED FFX-2 only) or state-driven. |
| CHK-021 | PASS | yes | Presence and absence both proven. Combat side (pinned by tests and sources): the Stop freeze and STOPPED caption are FFX-2 only (status-display.md l.109, l.155), Zombie tag/hints/plate FFX only, cure hints per each game's table, pacing presets separate per game (FFX x1.10-1.17, FFX-2 x1.11 measured wall time per turn) and never FF7. Interface side, settled by the gap pass: O2 step 3 is present in FFX Ch I (desktop and phone) and absent in FFX-2 Ch IV (.frg null); the Sphere Grid tab is absent from FFX-2 prep; audio cues never cross games. |
| CHK-022 | FAIL | yes | FAIL: Chapter XV (Den of Woe) cannot reach its outcome once a girl carries Stop into link 2 (PR-0281; 5/5 stalls). PASS for the rest of the owed coverage: 15 wins by real input through post scene, results, CONFIRM scene, board and a reload that keeps the clear (I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII via the seed-2 route, XIV, XVI desktop and phone), which settles the round-15/16/17 aftermath debts for III, XII and XIII; losses reach RETRY, prep and battle in VIII, IV (FFX-2), XII, XIII, XVII and XVIII. XVII and XVIII were not won (advisor-following harness, PR-0269), so their win paths and aftermaths remain UNVERIFIED. |
| CHK-023 | FAIL | yes | The combat runtime equals the engine (16/16 applicable real-key FFX logs replay event for event), every saved setting reaches its runtime effect (eye-candy rows flip the live look in the same frame, LOW EFFECTS and REDUCE MOTION act live and after a reload, the SFX level reaches the mixer, the pause cue plays), and the status line and marks appear in real fights. FAIL because the changed O3 subsystem's FFX-2 Stop freeze, when invoked on a carried Stop, stops the presenter's own staging and the flow never continues (PR-0281). |
| CHK-024 | PASS | yes | The save-data class of this candidate, proven by running: 28 of 28 cases pass (save-matrix-verdict.json): saves written by the release 29, 30, 31a and 32-candidate artifacts themselves (bundles C73AJ1Ds, B0cfXTil, C_4T6wOX, ChAAAZ-I), checked-in fixtures from releases 20-31a, the SFX edge cases, fx-field edge cases, a fresh profile and truncated storage. Every clear, best, attempt, flag, pick, coach id, unlock and option is kept and survives a reload. fxLight/fxLiving/fxSpectacle default true, a stored false is kept, non-booleans coerce to on. SFX rule exactly as stated: an untouched 0.35 without the marker plays 0.70; 0.35 with the marker, 0.45, 0.7, 0 and every player-set value are kept; a missing or non-finite level plays 0.9 (D-210's pre-existing rule); the first real write stores 0.70 with sfxBalanceMigrated=true (sfxwrite: real keys step 70 -> 80 -> 90, kept across a reload). The three rows flip and persist by keys, mouse and taps in both games. There is no player-facing save-reset flow (NOT APPLICABLE); reload mid-battle not exercised (checkpoint code unchanged, unit tests pass). |
| CHK-B1 | UNVERIFIED | yes | No numeric owner listening verdict exists for the shipped mix or its V0 encode; OWNER-VERDICT.md's newest entry is 2026-09-28 and the latest ear verdicts are negative or partial. Agents cannot hear; D-292 and D-293 are adoptions, not ear scores. |
| CHK-B2 | UNVERIFIED | no | Bailey is asleep; his feel verdict on steady pacing and the calm camera as defaults is not collected. |
| CHK-B3 | UNVERIFIED | no | Bailey's story read is not collected on this build. |

## Encounters (capture owner, real input)

| Chapter | Real flow complete | Outcome | Note |
|---|---|---|---|
| seymour-flux | yes | victory | 1600x900 keys, fresh profile with first-run guide O2: title, briefing, board, prep, scene (Esc pause, hold skip), fight, post scene, results, CONFIRM scene, board, reload keeps clear. 73 turns, seed 1. Also fx rows, comfort and probes run here. |
| yunalesca | yes | victory | 1600x900, seed 1, board after reload keeps the clear. |
| braskas-final-aeon | yes | victory | Aftermath III (CHK-022 debt) closed: 7 links, post scene, results, CONFIRM scene, board, reload. 208 turns, same as round 17. |
| ffx2-bahamut | yes | victory; loss + RETRY | Win at 1600x900. Loss at 2000x1012: X-2 BATTLE flipped to ACTIVE by real keys, defeat, RETRY reaches prep and then battle (FFX-2 loss/retry owed). |
| ffx2-vegnagun-shuyin | yes | victory | 4 seams, 168 turns, 27 min. |
| ffx2-leblanc | yes | victory | 2000x1012. |
| seymour-anima-macalania | yes | victory | 1600x900. |
| evrae-airship | yes | victory; loss + RETRY | VIII loss + RETRY (CHK-022 debt) closed: defeat, RETRY, prep, battle on seed 1001. Win at 2000x1012. |
| yojimbo-cavern | yes | victory | 1600x900. |
| seymour-natus | yes | victory | 2000x1012. |
| ffx2-fallen-aeons | yes | victory | 1600x900. |
| seymour-omnis | yes | victory (attempt 2); phone: defeat x2 + retry | Aftermath XII (CHK-022 debt) closed at 2000x1012: lost on seed 1, RETRY, won on 1001. Same outcomes as round 17. Phone 390x844 by taps: lost twice with retry each time, same as round 17. |
| ffx2-trema | yes | victory (seed-2 route, attempt 2) | Aftermath XIII (CHK-022 debt) closed by ffx2-trema-win-s2: post scene, results, CONFIRM scene, board, reload keeps the clear. The seed-1 route lost on 1 and 1001, and a ?pace=current control on seed 1 also lost (81 turns). So steady pacing does not cause the split from round 17. FFX-2 Active is timing-sensitive, so the paths differ. |
| isaaru-via-purifico | yes | victory | 1600x900. |
| ffx2-den-of-woe | **no** | soft-lock at link 2 | Link 1 (Shade Baralai) won in 9 turns. At link 2 (Shade Gippal) the presenter stays in moment:battle-start with awaitingMenu false and ATB elapsedMs 0, for 44 minutes. Yuna carried Stop into the link. Happened 4 of 4 times on the candidate, including ?fx=off and ?pace=current. See issue 1. Confirmed independently by the confirmer on a different path (16 link-1 turns, Yuna at 2057 HP with Stop); PR-0281. |
| ffx2-ixion-djose | yes | victory | 2000x1012 keys; phone 390x844 by taps also won (96 taps, board after). |
| sin-fins-core | yes | defeat x2 + retry | 2000x1012. Lost on 1 and 1001, same as round 17; the retry reaches battle. Player turns and a seam reached. The outcome reached is a defeat with RETRY; a win path and the aftermath are UNVERIFIED on this build (also lost again in the gap pass). |
| sin-face | yes | defeat x2 + retry | 1600x900. Lost on 1 and 1001, same as round 17; the retry reaches battle. The outcome reached is a defeat with RETRY; a win path and the aftermath are UNVERIFIED on this build (also lost again in the gap pass). |

## Approved-target gate

required 86 / matched 65 / failing 1 / unverified 20 / waiting 6. The visual auditor's tile tally against targets.json at the candidate (sha256 36693f81bb9c60aed0fdcccbb540f00fc235f6ea5facb9524100984f7610ef07). The one failing tile is Status display O3 (PR-0282 hint placement). The gap pass later verified behaviour behind several unverified tiles (O2 step 3, targeting s1 multi-target, Sphere Grid A/C/B, X-2 O3 marks, eye-candy D moments) but no tile-by-tile composite was made for them, so the tally is not changed by the chief; the next review should pair them. Protected art: approved 290/290 and judge-locked 48/48 byte-identical in the dist-gate manifest; verify-approved (ROOT=D:/pyrefly-rel26c) 338 ok, 0 mismatched, 0 missing. not assessed as a milestone; 1 failing, 20 unverified and 6 waiting tiles would block one.

## Coverage

**Tested**

- All 18 chapters by real input to at least a player turn with the new default look (capture owner, 28 runs, 1600x900 / 2000x1012 keys, 390x844 taps); 15 wins through aftermath, results, CONFIRM, board and reload; losses + RETRY in VIII, IV, XII, XIII, XVII, XVIII
- The owed CHK-022 debt: aftermath III, XII and XIII, the VIII loss + RETRY, an FFX-2 loss + RETRY
- Chapter XV to the link-2 seam (5 stalls on the candidate, a pass on live 31a from the identical engine state, a live-32 comparison)
- Save data (CHK-024): 28 cases incl. saves written by releases 29, 30, 31a and the 32 candidate; the SFX rule; fx fields; sfxwrite by real keys
- Three eye-candy rows by keys, mouse and raw touch in both games; REDUCE MOTION and LOW EFFECTS live, after a reload and over hits in motion
- Engine replay 16/16 FFX real-key logs; three-line bench 53/53 identical; Bushido fork; full unit suite 10,476 passed (1 host-saturation timeout, passes alone)
- Status O3 at runtime (Zombie, Curse, messages, hints, forecast) at 1600x900 and 390x844; first run O2 steps 1-3 and its FFX-2 absence; Sphere Grid A/B/C by keys and taps and its FFX-2 absence
- Eye candy D rest frames and moments (hit, splash, impact, spell) in I, IV, VII, XVI; Aerospark lance on the phone tier; calm camera frames
- Pause: Esc/P/chip, ESC RESUME click/tap, REPLAY BRIEFING, RESTART ENCOUNTER, OPTIONS scroll, TEXT SIZE 130 %
- Legibility and fill sweeps at 1280x960, 2560x1080, 2560x1440, 3840x2160; approved art hashes 338/338
- Audio: qa --strict, decode, stereo, routing in 28 runs, pause/title/chapter-select cues, emulated pad-only unlock, runtime SFX log (hit and miss)
- Load and frame time on the candidate with the GPU mostly idle (desktop and phone-tier viewport); artifact manifest 1,013 files decode-checked
- Hold-skip to first menu, status line timing, Shell confirm, Ch VII CONFIRM staging (timed captures)

**Reused, with the dependency argument**

- Round 17 Sin data audit (sin-dump.txt) and 200-seed Sin benches (from critic/rounds/round-17/combat/): git diff 1a6fd3cc..65152c1b is empty for src/battle, src/data, src/engine/tactics and src/story; every bench re-run this round (three-line 53/53, Bushido fork) reproduced round 17 exactly; related open defects PR-0269, PR-0279, PR-0268 are carried open, not passed.
- Round 17 input log sin-face-win-cand2/battle-log.json as the command stream for the Bushido fork (from critic/rounds/round-17/evidence/): Used only as input; the engine run is fresh on 65152c1b.
- Round 17 SFX-vs-music level estimate for PR-0263 (from critic/rounds/round-17/audio-r17-sfx-vs-music.json): The SFX sprite is sha-identical to live and the music loudness moved at most 0.02 LU; only the bus gain changed, which was read at runtime.

**Not tested**

- Firefox, WebKit/Safari and Edge; a real phone; a real controller (only an emulated pad)
- The live artifact (not deployed)
- Cold 10 Mbit/s chapter entry with the doubled music bytes (PR-0240)
- H (painting only); prep Esc-back on a returning profile; reload mid-battle; the save reset flow (no UI caller)
- A critical hit's SFX; the Sleep O3 mark; victory moments in I, IV and VII; the XV results cue
- The hidden FF7 fight (PR-0222, PR-0223, CHK-025)
- Carried polish not re-tested: PR-0271, PR-0248, PR-0246, PR-0249, PR-0252, PR-0276, PR-0277, PR-0239, PR-0273, FOC28-P02; PR-0247 attempted, Anima never arrived
- Tile-by-tile target composites for the behaviours the gap pass verified (O2 step 3, targeting s1, Sphere Grid A/C/B, X-2 O3 marks, eye-candy moments)

**Required and not tested**

- Chapter XV outcome, aftermath and results: blocked by PR-0281 on the candidate (tested to the lock, not beyond)
- XVII and XVIII win paths and aftermaths (the advisor-following harness loses; PR-0269)
- The eye-candy phone-tier performance gate on a real phone GPU (measured only at a phone viewport on the desktop RTX 5070 Ti, GPU mostly idle)
- Bailey's listening verdict (CHK-B1)
- Cold 10 Mbit/s entry after the music doubled (PR-0240)

## Issues, ranked (critical, then major, then polish, then suggestions)

Within a severity: the owner's and the friends' reported problems first, then frequency, player impact, coverage and effort. One root defect is one ticket; merges are listed under "What changed since round 17".

### 1. PR-0281 [critical] delivery

**PR-0281 (new): FFX-2 Chapter XV (Den of Woe) soft-locks at the link-2 opening when a girl carries Stop across the seam; status O3's Stop freeze stops her tween clock and the opening slide-in waits on it forever**

- Build: 65152c1b; game: FFX-2 (the freeze look exists only for FFX-2, statusLooks.ts:79; any FFX-2 chain or phase moment with a Stopped girl is exposed); chapter and state: XV ffx2-den-of-woe, seam link 1 (Shade Baralai) -> link 2 (Shade Gippal); link 3 the same whenever Stop is carried in
- Where: Traced and proven by test: src/ui/common/statusLooks.ts:79 (FFX-2 stop: { freeze: true }); src/ui/common/statusFigureTint.ts:204-220 (the wrapper runs figure.update(0) while frozen and not acting, so PaintedActor.update never advances its TweenGroup); src/engine/BattlePresenter.ts:326, :437 -> src/engine/BattleMoments.ts:277, :302-315 (slidePartyIn awaits actor.moveTo(home) for every party member outside any action). BattleScreenStall only resolves battles the engine has already decided, so nothing recovers.
- Expected: The seam plays its opening and hands back to the ATB within about 2.5 s, as live 31a does from the identical engine state (caption at 1114 ms, Yuna's bar in state stop, Gippal's Grinder at seq 7, then link 3). Yuna stands frozen in her idle (research/status-display.md l.155), but the presenter's own staging moves still finish, as statusFigureTint.ts's own header promises.
- Observed: After link 1 is won, playback.phase stays moment:battle-start, awaitingMenu stays false, the engine ATB elapsedMs stays 0, there is no HUD and no command menu, and there are no console errors. The frame shows Rikku and Paine only, Yuna absent, a black band on the right. It lasted 44 minutes in the full route. 5 of 5 on the candidate: the capture owner's 4 (plain, ?fx=off, ?pace=current, 2000x1012; Yuna at 7 HP with Protect + Stop) and the confirmer's independent run on a different path (16 link-1 turns, Yuna at 2057 HP with Stop; stalled ~103 s until the budget). The engine itself carries Stop into Gippal and advances in both Wait and Active (Grinder on Yuna first). Mechanism test with the real StatusFigureTint and TweenGroup: an unstopped girl's 520 ms slide completes at 0.53 s, a stopped girl's never completes in 60 s of frames, and completes as soon as she is marked acting. Frequency (den-stop-frequency.json, seeds 1-200, shipped kit): 11 % of sourced-line runs at Wait and 15 % at Active with 2.5 s decisions enter link 2 with a living girl in Stop; 56/57 and 126/136 of credible no-Remedy mistakes do. Each of those locks.
- Repro: Production candidate 65152c1b (D:/pyrefly-rel26c/dist-gate, index-DP4ruBbc.js), fresh profile, 1600x900, headless Chromium PYREFLY_BROWSER=gpu, window.__pyrefly.setSeed(1) before the first key; real keys: title, board, Ch XV, prep, hold Enter over the scene, play the advisor's picks; let Baralai's Looming Glacier Stop land on Yuna and do not cure it; win link 1. Script: node critic/rounds/round-18/cap/route18d.mjs ffx2-den-of-woe win --seed=1 --budget=360000. Headless proof: vitest with critic/rounds/round-18/combat/vitest.critic.config.ts, filter den-stop-seam, from D:/pyrefly-rel26c.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-cand/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-cand/98-final-state.png; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-fxoff/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-pacecurrent/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-confirmer/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-confirmer/20-link-2.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/ffx2-den-of-woe-win-stall-live31a/battle-log.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/ffx2-den-of-woe-win-stall-live32/run.json; D:/Final Fantasy/critic/rounds/round-18/combat/den-stop-seam.json; D:/Final Fantasy/critic/rounds/round-18/combat/den-stop-frequency.json
- Confidence: high: deterministic stall 5/5 on two different paths, engine run, a mechanism test on the real classes (re-run by the confirmer, 1/1 pass), and a live-31a pass from the identical engine state; the chief looked at the confirmer's 20-link-2.jpg (no HUD, Yuna absent, black band); requirement: RUBRIC §3 (a lock: an encounter that cannot finish; regression vs live); CHK-022; CHK-023; AGENTS.md hard rule 1
- Smallest fix: Smallest: StatusFigureTint's freeze holds only the figure's idle/life clock, never the TweenGroup the presenter uses for one-shot moves; equivalently treat every party figure as acting during BattleMoments.slidePartyIn and any moment:* phase. Keep the sourced FFX-2 Stop look. If the fix cannot land, ship with the FFX-2 stop freeze off (statusLooks.ts:79) and re-run XV.
- Acceptance check: 1. Unit: with StatusFigureTint synced to a stopped FFX-2 girl, actor.moveTo(home, 520) resolves within about 0.6 s of frames while her idle stays frozen. 2. Real keys at 1600x900 on the fixed candidate, XV seed 1 stall route: Yuna enters link 2 in Stop, the first command menu opens within 30 s, and the chain reaches Nooj, outcome, post scene, results, CONFIRM scene, board and reload. 3. Neighbours: every other FFX-2 chain seam or phase moment with a carried Stop (Vegnagun, Fallen Aeons) and Trema's mid-battle Beguiling Mire Stop still play.
- introducedByCandidate: true; regressionVsLive: true; inNewFeature: false
- Note: Merged from the capture owner's issue 1, R18-CE-01 (combat), R18-FN-01 (feel-narrative) and R18-DEL-01 (prep-delivery): one root, scored once in delivery, cross-referenced in narrative (XV link-2/3 banter and aftermath unreachable) and feel. regressionVsLive: live is release 32 (1a6fd3cc, deployed 08:39Z), which has no statusFigureTint.ts (the file is new in 39c56e10/2540ae13); live 31a crossed the identical engine state; the gap pass's live-32 run on the same seed reached link 2 with Yuna Stopped AND KO'd, was revived and played on to a normal defeat and RETRY, so live 32 carries Stop across the seam without locking, though the exact alive-and-Stopped state did not recur there. inNewFeature false: the lock breaks an existing chapter that finishes on live, and status O3 has no switch it could ship behind (BATTLE HELP OFF does not remove O3).

### 2. PR-0264 [major, STALLED] interface

**PR-0264 (carried, narrowed; friends' playtest "Hi-Potion killed Kimahri"): the desktop O3 Zombie forecast now works, but on the phone one tap on another ally's figure commits the heal at once, with no forecast, slab or rim**

- Build: 65152c1b; game: FFX (confirm-on-tap is shared target code); chapter and state: I Seymour Flux
- Where: 390x844 target step: TargetCursor figure tap -> confirmTarget (src/ui/ffx/TargetCursor.ts onClick path; traced by the gap pass)
- Expected: A tap on another ally moves the aim, as the hint says; a second tap or CONFIRM commits, and the Zombie forecast shows before anything lands.
- Observed: Desktop 1600x900 by keys PASSES the O3 target: 'HI-POTION ON A ZOMBIE -1000 KO' forecast, the red slab 'Yuna is a Zombie. A Hi-Potion hurts her for 1000...', 'x HURTS' on the row and the ZOMBIE plate tag. Phone with a swipe aim: forecast, slab and red rim all PASS. Phone with a tap: after Items > Hi-Potion the aim sits on Tidus and the hint says 'Tap another ally to switch · swipe'; one tap on Yuna's figure used the Hi-Potion on the Zombie Yuna immediately (-1000, KO) with no forecast.
- Repro: 390x844 touch, seed 1, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; next turn Items > Hi-Potion, then tap Yuna's figure once.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/flux-zombie-390x844-touch/04p-after-hipotion-tap.png; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/flux-zombie-390x844-touch/05s-swipe-aim-yuna.png; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png
- Confidence: high; requirement: interface: reliable input and honest information; friends' playtest 2026-09-29; CHK-004
- Smallest fix: On touch, a tap on a non-aimed candidate figure moves the aim instead of confirming; only a tap on the aimed figure or the CONFIRM button commits.
- Acceptance check: Same repro: the first tap on Yuna shows the -1000 KO forecast, the red slab and the rim on HI-POTION -> YUNA, and her HP is unchanged until CONFIRM; the desktop key path stays as it is.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false
- Note: The 11 px desktop part of round 17 is resolved by O3 (forecast measured at 46 css px). The remaining defect is the tap-commit, which predates the candidate.

### 3. PR-0148 [major, STALLED] audio

**PR-0148 (carried, owner-reported, STALLED): still no numeric owner verdict on the shipped mix, now re-encoded at V0 (D-292); the latest owner-side verdicts are negative**

- Build: 65152c1b; game: both; chapter and state: all
- Where: docs/audio/OWNER-VERDICT.md; shipped public/audio/music/*.mp3 (R1)
- Expected: A numeric owner listening verdict recorded against the exact shipped cues (CHK-B1, RUBRIC section 6).
- Observed: All 26 cues ship re-encoded at LAME V0 (218-283 kbps). The technical checks pass (qa --strict 0 findings, -16 LUFS, 0 clips, loudness within 0.02 LU of r17). No ear verdict exists: OWNER-VERDICT.md's newest entry is 2026-09-28; the latest are 'still sounds like snes music' (09-27), 'tinny and hollow ... close to good' (09-28) and the friends' 'music bad' (09-29), which Bailey concurred with. D-292 and D-293 are adoptions, not ear scores.
- Repro: Read docs/audio/OWNER-VERDICT.md and decisions.json D-253, D-283 and D-292. No entry gives a score out of 10 for the R1 mix. No seed is needed.
- Evidence: D:/pyrefly-rel26c/docs/audio/OWNER-VERDICT.md; D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.json; D:/Final Fantasy/critic/rounds/round-18/audio/audio-r18-decode-stereo.json
- Confidence: high; requirement: RUBRIC section 6 audio: 'Bailey's listening assessment'; CHK-B1
- Smallest fix: When D-292's O1 (V0 re-encode) lands, send Bailey the audition page with one question: a number out of 10 for the shipped battle, boss and scene cues. Record it verbatim in OWNER-VERDICT.md.
- Acceptance check: OWNER-VERDICT.md has a dated verbatim numeric verdict naming the exact shipped build or cue set.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false
- Note: Owner-reported. Open at major in rounds 15, 16 and 17: STALLED; the next audio batch starts with a method check (RUBRIC section 8).

### 4. PR-0099 [major, STALLED] audio

**PR-0099 (carried, STALLED): 11 of 18 listed chapters still play at least one borrowed stand-in cue**

- Build: 65152c1b; game: both; chapter and state: VI, IX (scene), X, XI, XII, XIII, XIV, XV, XVI (field bed), XVII, XVIII
- Where: docs/audio/THEMES.md chapter cue map; src/data chapter music records
- Expected: D-209: every chapter gets its own composed cue, and a stand-in never counts as finished.
- Observed: themes-audit (round 18 run in D:/pyrefly-rel26c) still marks VI and IX-XVIII as [borrowed]; the routing matches the data, so this is a content gap, not wiring. The V0 re-encode did not change it.
- Repro: node tools/audio/themes-audit.mjs in D:/pyrefly-rel28 lists the '[borrowed; owed]' rows.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json; node tools/audio/themes-audit.mjs in D:/pyrefly-rel26c
- Confidence: high; requirement: D-209; RUBRIC section 6 audio (thematic coherence)
- Smallest fix: After D-292's newer-model test settles the render path, compose the owed cues in priority order (Sin assault and countdown, Omnis, Natus), each auditioned by Bailey before it ships.
- Acceptance check: themes-audit shows no '[borrowed]' for the chapters delivered, with an ear verdict recorded per cue.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 5. PR-0282 [major] interface

**PR-0282 (new, inside status O3): the cure-hint card covers the top command row on phones in both games at every decision, and BATTLE HELP OFF does not remove it; on desktop FFX with the guide folded it covers the NEXT BEST MOVE header**

- Build: 65152c1b; game: both; chapter and state: I (Zombie) and IV (Curse); any chapter where a hinted status is on the party
- Where: src/ui/common/statusHintCard.ts placement (.sthint, z 40, pointer-events none); 390x844 command grid; 1600x900 advisor column
- Expected: As in the approved O3 frames: the hint sits in the guide's slot, never over a command label or the advisor's pick, and it follows BATTLE HELP like the other coaching surfaces.
- Observed: Phone FFX-2 Ch IV (Paine Cursed): 'GUIDE CURSE Paine is cursed: Holy Water cures it.' sits at [8,632,374x44] over the first command row at all 8 decisions across ~42 s; ATTACK is hidden entirely and SKILL ghosted (coveredFrac 0.6). With OPTIONS > BATTLE HELP OFF (battleHelp=false saved) it is identical. Phone FFX Ch I: TALK and ATTACK 87 % covered while ATTACK is the highlighted default. Taps pass through. Desktop 1600x900 FFX with the guide folded: the hint box (53,78 340x103) hides the NEXT BEST MOVE card's header and the first line of its reason.
- Repro: 390x844 touch, seed 1, fresh or release-31a save, Ch IV: Bahamut Curses Paine at seq 4; look at any command menu; repeat with BATTLE HELP OFF. Ch I: play until a living ally is a Zombie. Desktop: Ch I at 1600x900 with the guide folded (cap/probe.mjs).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-x2-phone-hint.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/probe-seymour-flux-390x844-touch-cand/10-status-hint-over-commands.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/probe-ffx2-bahamut-390x844-touch-cand/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/probe-seymour-flux-1600x900-cand/10-status-hint-over-commands.jpg; D:/Final Fantasy/critic/rounds/round-18/visual/zoom-ffx-o3-hint-desk.jpg; D:/Final Fantasy/critic/rounds/round-18/targets/picks-status-o3-x2-phone.jpg
- Confidence: high (DOM boxes, elementFromPoint and frames); requirement: Approved target 'Status display O3' (D-288); CHK-008; CHK-003; RUBRIC §6 interface (readable controls)
- Smallest fix: Phone: dock the card in the TIP/guide band above the command grid (or below it) instead of over the first row, and hide it when battleHelp is false. Desktop: stack it in the guide / NEXT BEST MOVE column so the advisor card moves down.
- Acceptance check: cap/probe.mjs in Ch I and IV at 390x844, 1600x900 and 2000x1012: coveredFrac 0 on every command row, 0 px2 overlap with .mad__card, the hint text fully visible; with BATTLE HELP OFF no .sthint is visible; the same at TEXT SIZE 115 and 130 %.
- introducedByCandidate: true; regressionVsLive: true; inNewFeature: true
- Note: Merged: capture owner issue 2, R18-IF-02, R18-IF-03 (desktop), R18-VIS-01, gap issue 'FFX-2 phone hint at every decision'. The commands are readable on live, so it is a regression of existing information, but it is inside the brand-new O3 hint card; under the rules it is disclosed, not held. Note for the builder: O3 has no switch, so "ship it switched off" is not available today without one.

### 6. PR-0265 [major, STALLED] interface

**PR-0265 (carried, re-verified): clicking or tapping ESC RESUME in the pause does nothing (0 of 32, both games, every tab)**

- Build: 65152c1b; game: both; chapter and state: any battle (proved in Ch I and Ch IV); pause open
- Where: src/app/screens/PauseScreen.ts:260 (traced: the 'cancel' data-action is handled only when panelsHidden; Input.onClick queues the action string and never presses the cancel button)
- Expected: One tap or click on RESUME closes the pause and returns to the battle, as Esc does.
- Observed: Gap pass: all 8 tabs in each game at 390x844 (tap) and 1600x900 (click). The button is on top (elementFromPoint) and receives the event, and the screen stays 'pause' every time: 0 of 32 resume. Keyboard Esc resumes.
- Repro: Candidate dist-gate, fresh profile, setSeed(1). Ch I, first menu. Tap .battle-pause-chip, then tap .pause__back and read __pyrefly.screen(). Script: node critic/rounds/round-17/cap/gaps/resume-taps.mjs seymour-flux 390x844 touch (BASE=<url>).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-resume-seymour-flux-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-resume-ffx2-bahamut-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-resume-seymour-flux-1600x900/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-resume-ffx2-bahamut-1600x900/run.json
- Confidence: high; requirement: CHK-015 (every input a player can use works); RUBRIC §8 major: unusable controls
- Smallest fix: Wire .pause__back[data-action=cancel] click and touch to the same onResume path as Esc.
- Acceptance check: resume-taps.mjs at 390x844 touch and 1600x900 mouse: the step 'RESUME, focus on tabs' ends with screen=battle, and so does 'RESUME #1 after a row tap' (or #2 at most), in Ch I and Ch IV.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false
- Note: Traced by the chief in D:/pyrefly-rel28/src/app/screens/PauseScreen.ts:260: handleAction closes on the cancel action only when panelsHidden. Same on live 31a (resume-taps-seymour-flux-390x844-live31a), so it is carried, not introduced. A phone player has no Esc key: the only touch way out is H painting only, then RESUME. Both games (shared pause).

### 7. PR-0283 [major] interface

**PR-0283 (new finding, pre-existing on live 31a and 32): after RESTART ENCOUNTER the title screen stays mounted and visible over the whole restarted fight, both games**

- Build: 65152c1b; game: both; chapter and state: I and IV (any chapter; restart is shared)
- Where: pause > OPTIONS > RESTART ENCOUNTER -> src/app/screens/BattleScreen.ts:630-647 requestExit('restart') -> app.runChapter(..., {restart: true}); the title root is not removed on that path (suspected, partly traced)
- Expected: Only the battle screen is mounted after a restart and the chapter's own stage is drawn.
- Observed: App roots read ['title','battle']. The 'Pyrefly Reprise / PRESS ENTER' card, the title footer and the title's sky replace the battle backdrop, the party renders as black silhouettes, and the HUD and menu play on top until results (44 s FFX, 106 s FFX-2). By keys and by click. Live 31a and live 32 are identical.
- Repro: 1600x900, any save, Ch I or IV, first menu: Esc, Right to OPTIONS, Down to RESTART ENCOUNTER, Enter (and confirm). Wait 2 s and read #ui > [data-screen]; play one turn.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-restart-seymour-flux-1600x900/r06-18s.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-restart-ffx2-bahamut-1600x900/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-restart-seymour-flux-1600x900-live32/r06-17s.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/probe2-seymour-flux-1600x900-kbd-cand/29-after-restart-one-turn.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/probe2-seymour-flux-1600x900-kbd-live31a/29-after-restart-one-turn.jpg
- Confidence: high; requirement: CHK-006 and CHK-002 (a full-screen layer is torn down with its screen); CHK-015; RUBRIC §2 retry
- Smallest fix: Make runChapter(restart) replace the screen stack the way the board entry does, or unmount any title root before pushing the restarted battle.
- Acceptance check: Real-key and real-click RESTART ENCOUNTER in one FFX and one FFX-2 chapter at 1600x900 and 390x844: roots ['battle'] only and no 'PRESS ENTER' text 2 s, 6 s and one turn after the restart, through to results.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false
- Note: Merged: capture owner issue 3, R18-IF-01, gap 'RESTART ENCOUNTER'. Round 09/10 had restart passing by real keys, so this regressed before 31a and was missed by rounds 16-17.

### 8. PR-0269 [major, STALLED] combat

**PR-0269 (carried): following the advisor card every turn still loses the Sin races; XVII and XVIII lost on both seeds by real keys again, also in the gap pass (XVII 253/255 turns on link 2; XVIII 73/63 turns)**

- Build: 65152c1b; game: FFX; chapter and state: XVII Sin Fins/Core and XVIII Sin Face; seeds 1 and 1001
- Where: the advisor (src/engine/tactics), unchanged since round 17
- Expected: A card that follows sourced play wins a fair share, as the sensible line does (r17: XVIII 31%, XVII 25.5%).
- Observed: sin-fins-core-win: defeat at seed 1 and at 1001 (each lost on link 2). sin-face-win: defeat at seed 1 and at 1001. Each link-1 and XVIII log replays exactly through the candidate engine (ffx-replay.json). The three-line bench is 53/53 identical to round 17.
- Repro: Capture owner routes sin-face-win and sin-fins-core-win, 1600x900 and 2000x1012, seeds 1 and 1001.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json; D:/Final Fantasy/critic/rounds/round-18/combat/ffx-replay.json; D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sin-fins-core-win-gap/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sin-face-win-gap/run.json
- Confidence: high; requirement: encounter: fair wins; interface: legal and useful advice
- Smallest fix: As round 17: give the Sin tactics the race priorities of the sensible line (damage over top-ups while the timer runs).
- Acceptance check: The advisor-card chain wins at least the sensible line's rate minus a small margin on the 200-seed Sin benches, and one real-key XVIII win on the card.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 9. PR-0268 [major, STALLED] prep

**PR-0268 (carried): Bailey adopted the Sin link-3 retry checkpoint (D-284), but SIN_LINK3_CHECKPOINT is still false (sin-genais-core.ts:199)**

- Build: 65152c1b; game: ffx; chapter and state: sin-fins-core
- Where: Link 3 loss -> RETRY; src/data/ffx/enemies/sin-genais-core.ts:199
- Expected: Per Bailey's adoption of D-284, a link-3 loss retries from link 3.
- Observed: SIN_LINK3_CHECKPOINT = false on 65152c1b, so a link-3 loss restarts from the Left Fin.
- Repro: Read the constant in D:/pyrefly-rel26c. The behaviour is the same as round 17.
- Evidence: D:/pyrefly-rel26c/src/data/ffx/enemies/sin-genais-core.ts:199; critic/rounds/round-17.json PR-0268
- Confidence: high; requirement: docs/target/decisions.json D-284; RUBRIC §6 prep (fast retry)
- Smallest fix: Turn the checkpoint on as adopted (or record Bailey's deferral in decisions.json).
- Acceptance check: A real-key loss at XVII link 3 followed by RETRY lands at link 3; flow-checkpoint-retry covers it.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 10. PR-0267 [major, STALLED] combat

**PR-0267 (carried, re-verified): a failed Bushido keeps its time remaining and earns the timing bonus, so a wrong first press out-damages a correct fast sequence**

- Build: 65152c1b; game: FFX; chapter and state: every FFX chapter where Auron has an Overdrive (forked at XVIII sin-face, seed 1, Auron's first Dragon Fang)
- Where: src/battle/ffx/overdrive.ts:457-458; src/ui/ffx/minigames/logic.ts:53, 59-72 (traced in r17; the code is unchanged)
- Expected: research/ffx-combat-core.md §5.5: a failure resolves the Fail row with no time bonus; the §5.2 bonus is for completing early.
- Observed: The fork on the candidate engine gives numbers identical to round 17: canon fail at expiry 2,432; wrong press at 3.9 s left 3,617; success at 2.5 s left 3,192.
- Repro: Run D:/Final Fantasy/critic/rounds/round-18/combat/bushido-fail-bonus.test.ts with vitest.critic.config.ts in D:/pyrefly-rel26c. Input log: round-17 evidence sin-face-win-cand2, seed 1.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/bushido-fail-bonus.json
- Confidence: high (deterministic); requirement: combat correctness; ffx-combat-core §5.2, §5.5
- Smallest fix: Credit timeRemainingMs only when sequence.success is true.
- Acceptance check: On the same forked board, a failed sequence deals the same damage whether 3,900 ms or 0 ms remain, and a success beats every failure. FFX goldens stay unchanged.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 11. PR-0244 [major, STALLED] feel

**PR-0244 (carried, STALLED, partly improved): the Ch VII CONFIRM scene narrates the kneel and the fall over a standing Seymour; the silent plate part now passes**

- Build: 65152c1b; game: FFX; chapter and state: Ch VII seymour-anima-macalania, after the killing blow and after CONFIRM on the victory results
- Where: post scene staging (src/story scripts unchanged since live 31a; the file was not traced)
- Expected: Seymour kneeling, then KO'd, and Yuna's sending are visible in the frames, or the standing figure is removed. No run of plate without actor and dialogue longer than about 1 s (the PR-0244 acceptance).
- Observed: Gap pass, Ch VII won by real keys (seed 1, 52 turns), CONFIRM scene at 250 ms for 13.6 s: 'He went down on one knee. The hall was very quiet.' and 'Then he fell, and he just stopped.' play over Seymour upright in every frame. The first line now arrives at about 0.33 s, so the silent-plate half of the acceptance passes.
- Repro: node critic/rounds/round-17/cap/gaps/ch7-17.mjs --base=<url> --evidence=<dir> --size=1600x900, seed 1, keyboard, advisor route.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/seymour-anima-macalania-win-confirm250/contact-confirm.jpg; D:/Final Fantasy/critic/rounds/round-18/feel-narr/vii-post-vs-confirm.jpg; D:/Final Fantasy/critic/rounds/round-18/feel-narr/dbox-all.txt
- Confidence: high; requirement: PR-0244 acceptance; CHK-022 aftermath
- Smallest fix: During the kneel/fall/sending beats, hide Seymour's standing figure on the plate or swap in kneel/KO poses, and cut or caption the 1.7 s silent plate before results.
- Acceptance check: Same repro, 250 ms frames: no frame shows the standing Seymour while 'He went down on one knee' or 'Then he fell' is on screen, and no silent plate interval is over 1 s.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false
- Note: Kept at major by the chief: the gap pass timed sequences (250-300 ms frames) FAIL the round-16 acceptance on both halves: 1.7 s of plate with no actor or line before results, and the kneel / fall narration over the standing painting. The feel auditor's downgrade rested on stills. Open at major in rounds 16 and 17: STALLED. FFX only.

### 12. PR-0266 [major, STALLED] interface

**PR-0266 (carried, re-measured): at TEXT SIZE 130 % the FFX help slab covers the TALK row**

- Build: 65152c1b; game: FFX; chapter and state: I Seymour Flux, Tidus's command menu after changing TEXT SIZE in OPTIONS
- Where: src/ui/ffx/CommandMenu.ts:692/697 (commandRowsCap is applied only when rows are rendered; nothing re-renders when data-text-size changes while the list is open; traced by the confirmer); hudTextSize avoid list (suspected) for the key chips and the party panel
- Expected: Per text-size.css and hudTextSize.ts (target desk-hud-130.jpg): 4 rows at 130 % that scroll with the marks, and no panel or key label over another.
- Observed: Gap pass, set by keys: FFX command labels grow 24.5 -> 31.8 px, but the 'Physical damage' help slab covers the TALK row, whose label is hidden.
- Repro: Candidate 1a6fd3cc, 1600x900, a release-31a save with comfort flags off (cap/comfort-seed.json), Chapter I by keys to Tidus's first menu, then P, OPTIONS, TEXT SIZE Right x2 to 130 %, Esc back to battle. Script: critic/rounds/round-17/cap/comfort.mjs seymour-flux --size=1600x900.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-seymour-flux-1600x900/03-130.png; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-seymour-flux-1600x900/run.json
- Confidence: high for the symptom. Medium for the cause: probably the row cap is applied only when the menu is rebuilt, not when TEXT SIZE changes while the list is open (not traced). The next actor's menu was not captured.; requirement: CHK-008 / CHK-003 (panels measured against each other and against the actors, nothing a player must read hidden); A2 target desk-hud-130.jpg
- Smallest fix: Re-run the command-row cap and the panel solver when data-text-size changes (on pause close or on attribute change), or rebuild the open menu then. Keep the PAUSE chip clear of the grown advisor key strip.
- Acceptance check: FFX Ch I, IX and XII at 1600x900, 1280x720 and 2000x1012, TEXT SIZE 115 and 130 % set mid-turn by real keys: the same-turn and next-turn menus show the capped rows plus the scroll mark, TALK fully visible, the acting character's head and torso visible, and 0 intersections among the PAUSE / N / G chips, the help slab, the rows, the party panel and the projected actor quads.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false
- Note: hudTextSize.ts is unchanged since round 17. The new O3 hint card and icon rows are not in the growth/collision solver either (see PR-0282).

### 13. PR-0270 [major, STALLED] onboarding

**PR-0270 (carried, re-measured): TEXT SIZE grows nothing in the FFX-2 battle HUD (commands 24.5, names 23.8, advisor 20.3 px at 100 and 130 %)**

- Build: 65152c1b; game: FFX-2; chapter and state: IV Bahamut
- Where: app/applyComfort.ts TEXT_SIZE_WIDE_SCOPE=false; text-size-wide.css not active
- Expected: A2 says TEXT SIZE grows the battle HUD, dialogue and menus in both games; the FFX-2 pass waits on Bailey's D-220 Q4 pick.
- Observed: At 1600x900, the FFX-2 command menu scale is 2.514 at 100 % and 2.502 at 115 and 130 %. On phone the row font stays 16 px at every size. The frames at 100 and 130 % look the same. Only the dialogue grows.
- Repro: cap/comfort2.mjs ffx2-bahamut --size=1600x900 and --size=390x844 --phone (real keys: P, OPTIONS, TEXT SIZE Right).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/textsize-ffx2-bahamut-1600x900/run.json
- Confidence: high; requirement: A2 (D-285); docs/handoff/r31-access.md CHECK major 2 (disclosed)
- Smallest fix: Before Q4: label the row honestly (for example "FFX battle HUD and dialogue"). After Bailey's Q4 pick: switch on TEXT_SIZE_WIDE_SCOPE with the FFX-2 intent-board solver slot.
- Acceptance check: After Q4: the FFX-2 command, party and advisor panels grow at 115/130 % on desktop and phone with no overlaps, measured by the comfort probe.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 14. PR-0284 [major] onboarding

**PR-0284 (new finding, pre-existing on live 31a and 32): REPLAY BRIEFING in the pause opens underneath the pause UI: nothing is visible, and the next Esc is spent closing it**

- Build: 65152c1b; game: both; chapter and state: I and IV (any chapter)
- Where: pause > OPTIONS > REPLAY BRIEFING; .coach-brief mounts full-viewport inside the battle root (z 90 inside z 10) beneath pause__ui
- Expected: The briefing is drawn over the pause, a click, tap or Enter advances or closes it, and the next Esc returns to the pause and then the fight.
- Observed: In all 6 gap cases (Enter, click and tap; both games; 1600x900 and 390x844) elementFromPoint returns pause__ui and the 0.5 s and 2 s frames show only the unchanged OPTIONS page. Eight clicks do not clear it. The first Esc silently removes the invisible briefing and the pause stays; a second Esc resumes. The fight clock does not move (correct).
- Repro: Any chapter, first menu, Esc, OPTIONS, REPLAY BRIEFING by Enter, click or tap; screenshot at 0.5 s and 2 s; press Esc.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-brief-seymour-flux-1600x900/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-brief-ffx2-bahamut-1600x900/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-brief-seymour-flux-390x844-touch/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-brief-ffx2-bahamut-390x844-touch/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-brief-seymour-flux-1600x900-live32/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/probe-seymour-flux-1600x900-cand/21-briefing-replayed.jpg
- Confidence: high; requirement: RUBRIC §6 onboarding (optional help reachable); CHK-006; CHK-015
- Smallest fix: Mount the replayed briefing above the pause layer (or close the pause while it plays) and let a click or tap advance it.
- Acceptance check: By Enter, click and tap in both games at 1600x900 and 390x844: the briefing text is on top (elementFromPoint inside .coach-brief) 0.5 s after activation; a click/tap advances it; one Esc after it closes returns to the pause and one more to the battle.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 15. PR-0240 [major, STALLED] delivery

**PR-0240 (carried, STALLED, not re-measured): cold 10 Mbit/s chapter entry; this candidate roughly doubles every music cue's bytes (43.0 -> 81.0 MB of music)**

- Build: 65152c1b; game: both; chapter and state: all
- Where: chapter entry on a cold cache
- Expected: A first battle within the load goal on named slow-network conditions (RUBRIC §2: a load under 5 s is the platform goal).
- Observed: Not measured on this build. Round 17 measured about 19 s behind the loading card at 10 Mbit/s. This candidate re-encodes all 27 music cues at V0: 43.0 -> 81.0 MB total, each cue about 1.9x, for example boss-yu-yevon 3.23 -> 6.31 MB. At 50 Mbit/s the Ch I loading card showed for 2.3 s.
- Repro: perf18.mjs at net=10mbps, cold profile, Ch I and XVIII, on dist-gate.
- Evidence: critic/rounds/round-18/prep-delivery/diff-vs-r17-candidate-1a6fd3cc.json; critic/rounds/round-18/evidence/perf/perf-seymour-flux-50mbps-1600x900.json
- Confidence: medium (the byte growth is certain; the effect on the wait is unmeasured); requirement: RUBRIC §2 platform goals; §6 delivery (measured loading)
- Smallest fix: Measure first. If the card now waits longer, start the battle on the SFX sprite and stream or defer the boss cue, or ship a lighter first-play encode.
- Acceptance check: A named 10 Mbit/s cold run records the loading-card time at or below round 17's 18.6 s (and ideally near 5 s).
- introducedByCandidate: false; regressionVsLive: unknown; inNewFeature: false

### 16. PR-0222 [major, STALLED] delivery

**PR-0222 (carried): the fix for the hidden FF7 fight's black hold on a cold cache is still not captured**

- Build: 65152c1b; game: FF7 (hidden experiment); chapter and state: FF7 Guard Scorpion (unlisted)
- Where: secret door -> swirl -> field, cold cache
- Expected: No black hold: the swirl's last frame holds until the art settles, and Esc or keys during the hold do nothing harmful.
- Observed: Not captured this round either (the hidden FF7 fight was outside every lane). No FF7 file changed between 1a6fd3cc and 65152c1b per the prep-delivery diff (only the bundle, css, map, index.html, 8 fx depth maps and 27 music files differ).
- Repro: Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears. Press Esc and arrows during the hold.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/prep-delivery/diff-vs-r17-candidate-1a6fd3cc.json; D:/Final Fantasy/critic/rounds/round-17.json PR-0222
- Confidence: low (unverified either way); requirement: CHK-017 / CHK-025; RUBRIC §5
- Smallest fix: None proposed until it is observed.
- Acceptance check: No black sample longer than 1 s, the field arrives, and Esc and arrows during the hold neither lock nor start anything.
- introducedByCandidate: false; regressionVsLive: false; inNewFeature: false

### 17. PR-0263 [polish] audio

**PR-0263 (carried, downgraded major -> polish; friends' "no attack SFX"): the fix is delivered by D-293 (SFX b, bus 0.70 in 185/185 samples; a hit's true peak now ~1.5 dB under the music's, was ~7.5 dB) but no ear has confirmed it**

- Build: 65152c1b; game: both; chapter and state: all battles
- Expected: D-293 balance b: effects +6 dB against D-210, so a hit lands about level with the music's peaks.
- Observed: The runtime SFX bus is 0.70 in 185 of 185 candidate samples. Measured, not heard: a hit's true peak now sits about 1.5 dB under the music's true peak (hit-1 at -1.02 dBTP x0.7 bus x0.8 cue volume, against music at -1.5 dBTP x0.7). It was about 7.5 dB under. The whiff's 400 ms momentary sits about 7.5 dB under the battle music's median (it was about 13.5 dB under). The two estimates use different windows, so they do not compare directly.
- Repro: Default profile, any chapter: land an attack and a miss. Read the audio debug sfxMix, and see src/engine/BattlePresenterBeats.ts:130 and BattlePresenterEvents.ts:229.
- Evidence: evidence/*/audio-debug.jsonl; critic/rounds/round-17/audio-r17-sfx-vs-music.json (reused, dependency: the sprite is sha-identical and the music loudness is within 0.02 LU)
- Confidence: medium; requirement: D-293; CHK-B1
- Smallest fix: None in code. Ask Bailey or the friends to confirm by ear that hits now read over the music. If the miss still disappears, consider the miss cue's own volume of 0.5.
- Acceptance check: An owner or playtester ear note says the attack SFX are audible at the default settings.
- Note: Downgraded: the measured cause is corrected as adopted; what remains is the owner-side ear confirmation (CHK-B1).

### 18. PR-0061 [polish, STALLED] feel

**PR-0061 (carried, STALLED, now worse): hold-skip to the first usable menu takes 11.4-12.4 s at the new defaults, about 2.7 s longer than ?pace=current&cam=current (8.7-9.7 s)**

- Build: 65152c1b; game: both; chapter and state: Ch I, IV, VII at 1600x900
- Expected: Under 3 s.
- Observed: Gap pass, GPU idle (5 %), 3 runs each: default (steady pace, calm camera) Ch I 11406/11484/11497 ms, Ch IV 12157/11962/12368, Ch VII 11516/11608/11648; ?pace=current&cam=current Ch I 8681/8852/8999, IV 9686/9567/9600, VII 8781/8758/8763. The scene itself ends 1.1-1.5 s into the hold, so the rest is intro dolly and enemy-intro beats.
- Repro: node critic/rounds/round-17/cap/gaps/latency17.mjs <chapter> --base=<url> --evidence=<dir>
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/logs/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/hold-seymour-flux-default-r1/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/hold-seymour-flux-current-r1/run.json
- Confidence: high; requirement: PR-0061 acceptance
- Smallest fix: After a hold-skip, skip or compress the intro dolly and enemy-intro beats regardless of the pace preset.
- Acceptance check: holdToFirstMenuMs < 3000 in I, IV and VII at the default settings.
- Note: The +2.7 s comes from Bailey's chosen defaults (D-291 calm camera, D-294 steady pacing); the fix is to make a hold-skip bypass them, not to change the defaults. A polish regression does not hold the build.

### 19. PR-0285 [polish] feel

**PR-0285 (new, status O3): the status message line trails the event it names by 1.6-2.5 s and splits one Hastega into three lines**

- Build: 65152c1b; game: both (message line); seen in FFX Ch I; chapter and state: I Seymour Flux, seed 1
- Where: status message line (stmsg) queue
- Expected: The line appears with the event it names; one multi-target cast reads as one line.
- Observed: 100 ms frames from the Hastega confirm: 'Tidus was hasted.' 1.29 s, 'Tidus and Yuna were hasted.' 1.5 s, 'Kimahri was hasted.' 3.27-5.2 s, while Lance of Atrophy hits Yuna at ~2.8 s and she is visibly green by ~3.7 s; 'Yuna became a Zombie.' appears only at 5.32 s, under Seymour's 'Let it in.'.
- Repro: Seed 1, Ch I, 1600x900: Tidus White Magic > Hastega > confirm; capture 100 ms frames for 6 s.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/flux-zombie-1600x900/seq-hastega-to-lance/frames.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/flux-zombie-1600x900/contact-hastega-lance.jpg; D:/Final Fantasy/critic/rounds/round-18/feel-narr/flux-msgline-crop.jpg
- Confidence: high; requirement: feel: action and reaction timing
- Smallest fix: Collapse lines from one action into one, and drop or replace stale queued lines when a newer status event arrives (or shorten the per-line hold).
- Acceptance check: The same run shows 'Yuna became a Zombie.' within 500 ms of her Zombie tint and one haste line for the one Hastega.

### 20. PR-0286 [polish] interface

**PR-0286 (new, status O3): on the phone the status message is drawn over the dialogue banner's text**

- Build: 65152c1b; game: FFX; chapter and state: Ch I
- Where: 390x844, a status lands while a battle line is on screen
- Expected: The message and the dialogue text do not overlap.
- Observed: 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- Repro: 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- Evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/10-status-hint-over-commands.jpg
- Confidence: medium; requirement: CHK-008
- Smallest fix: Offset the message line below the banner while a line is up, or queue it until the line ends.
- Acceptance check: Message box ∩ dialogue text box = 0 at 390x844 in both games.

### 21. PR-0291 [polish] interface

**PR-0291 (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)**

- Build: 65152c1b; game: FFX; chapter and state: I
- Where: 1600x900 Items list aimed at a Zombie
- Expected: As in the approved O3 target, both panels are readable.
- Observed: The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- Repro: Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png vs docs/concepts/status-display-0929/final/o3-vs-build-ffx-desktop.jpg
- Confidence: high; requirement: approved target O3 / interface readability
- Smallest fix: Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- Acceptance check: No overlap between .stwarn and the Guide card rect in that frame.

### 22. PR-0104 [polish, STALLED] feel

**PR-0104 (carried, 4th review, STALLED): under Wait, a confirmed FFX-2 support command (Shell) shows nothing but a cast pose; the next menu opens at 2.27 s**

- Build: 65152c1b; game: FFX-2; chapter and state: IV ffx2-bahamut (1600x900) and VI ffx2-leblanc (2000x1012); XVI on 390x844 shows only a help line
- Expected: A confirmed command gets immediate visible acknowledgement, such as its name chip over the actor or a charge cue, while it waits for its turn.
- Observed: Gap pass, 100 ms frames from White Magic > Shell > All allies (Wait, keys): no frame from 0 to 2.2 s shows 'Shell' anywhere; Yuna takes her cast pose; the next menu opens at 2.27 s (round 17: 1.8 s).
- Repro: Candidate 1a6fd3cc, Ch IV at 1600x900, seed 1: Yuna, White Magic, Shell, All allies.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/contact-shell.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/shell-confirm-ffx2-bahamut-1600x900/seq-shell-confirm-100ms/
- Confidence: high on what is shown; FFX-2 charge time itself is canon; requirement: RUBRIC §6 feel (input-to-response)
- Smallest fix: Under Wait, show the queued command's name chip over the actor at confirm (FFX-2 only), kept until the action starts.
- Acceptance check: A frame within 300 ms of the confirm shows the command name on or next to the actor, at 1600x900 and 390x844.

### 23. PR-0290 [polish] onboarding

**PR-0290 (new, status O3): the phone Curse hint drops Esuna and Remedy ('Paine is cursed: Holy Water cures it.') that the desktop hint lists**

- Build: 65152c1b; game: FFX-2; chapter and state: Ch IV
- Where: 390x844 cure hint
- Expected: The same cure list at every size.
- Observed: Phone: 'Paine is cursed: Holy Water cures it.' Desktop: '… Holy Water, Esuna or a Remedy cures it.'
- Repro: FFX-2 Ch IV with Curse on Paine, desktop and phone.
- Evidence: round-18/evidence/probe-ffx2-bahamut-390x844-touch-cand/10-status-hint-over-commands.jpg; ffx2-bahamut-win/12-intent-E.png
- Confidence: high (seen again in the gap pass at every phone decision); requirement: RUBRIC §6 onboarding (help that teaches the faithful rules)
- Smallest fix: Use the full sourced cure list on the phone as well, wrapped to two lines.
- Acceptance check: The phone and desktop hint texts name the same cures for every status in both games.

### 24. PR-0289 [polish] onboarding

**PR-0289 (new, first run O2): step 1 says 'Start with the first one' while the spot sits on another selected chapter**

- Build: 65152c1b; game: both; chapter and state: chapter select, first run
- Where: 390x844 and desktop board, guide step 1, a chapter other than I selected
- Expected: The words match the picture the spot points at, or the spot stays on Chapter I.
- Observed: The plate shows CHAPTER XVI Ixion while the slab reads 'Start with the first one. Tap its picture to begin.' This is a documented open item in firstrun-o2.md.
- Repro: Fresh profile, 390x844. Choose Ixion on the board before tapping the plate.
- Evidence: round-18/evidence/ffx2-ixion-djose-win-touch/03-card.png
- Confidence: high; requirement: RUBRIC §6 onboarding; approved O2 target (only Chapter I drawn)
- Smallest fix: Ask Bailey which: keep the spot on Chapter I, or reword to 'Tap its picture to begin.' without 'the first one'.
- Acceptance check: With a non-first chapter selected, the slab never says 'the first one'.
- Note: A question of wording for Bailey is part of the fix (keep the spot on Chapter I, or drop 'the first one').

### 25. PR-0292 [polish] onboarding

**PR-0292 (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold**

- Build: 65152c1b; game: FFX; chapter and state: I prep
- Where: Sphere Grid tab
- Expected: Every control has a key or pad route, and touch wording on touch screens.
- Observed: No key binding: Tab is WALK, A is Left. The phone explainer reads 'CLICK TWICE… press Enter… wheel to zoom' and 'Enter or click again'. On the phone the explainer's buttons start below the fold (one swipe reaches them).
- Repro: Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- Confidence: high; requirement: onboarding: input access
- Smallest fix: Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- Acceptance check: A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.

### 26. PR-0287 [polish] interface

**PR-0287 (new): the FFX-2 OPTIONS settings column overflows at rest (STRATEGY GUIDE cut through the middle, BATTLE HELP below the fold); keyboard and wheel still reach every row**

- Build: 65152c1b; game: FFX-2; chapter and state: Ch IV
- Where: pause OPTIONS at 1600x900 and 2000x1012
- Expected: Every settings row is visible, or a clear scroll cue is shown.
- Observed: With 3 more rows, the column scrolls (scrollHeight 423 against clientHeight 378). STRATEGY GUIDE is cut through its middle above the chapter caption, and BATTLE HELP is hidden. On live 31a all rows fit (249 px). FFX fits.
- Repro: FFX-2 chapter, Esc, OPTIONS tab, at 1600x900 or 2000x1012.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/probe2-ffx2-bahamut-1600x900-cand/10-options-at-rest.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-scroll-ffx2-bahamut-1600x900/; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pause-scroll-ffx2-bahamut-1600x900-wheel/
- Confidence: high; requirement: CHK-009, CHK-002
- Smallest fix: Give the FFX-2 settings column the height it needs (the caption can move down), or add a visible more-below cue. Keyboard focus must scroll the row into view.
- Acceptance check: All 15 FFX-2 rows are fully visible (or reachable with a visible cue) at 1600x900 and 2000x1012, and ArrowDown reaches BATTLE HELP with it on screen.
- Note: Gap pass: ArrowDown walks MASTER VOLUME to BATTLE HELP in 14 steps with each selected row kept in view, and one wheel step brings BATTLE HELP into view, so this is a cosmetic at-rest cut with no scroll cue, not an unreachable row.

### 27. PR-0288 [polish] interface

**PR-0288 (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')**

- Build: 65152c1b; game: FFX; chapter and state: Ch I
- Where: 390x844 command menu, TALK disabled
- Expected: The full help sentence, wrapped if needed.
- Observed: 'TIDUS · Nothing left to say — A one-off action this enc…'
- Repro: 390x844 Ch I after Talk is used up, cursor on TALK.
- Evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- Confidence: high; requirement: CHK-009
- Smallest fix: Allow two lines, or shorten the copy for the phone.
- Acceptance check: scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.

### 28. PR-0294 [polish] onboarding

**PR-0294 (new finding): the phone OPTIONS settings list is a ~100 px scroll window (4 of 10-12 rows visible), so the three new eye-candy rows need scrolling with little cue**

- Build: 65152c1b; game: both; chapter and state: all
- Where: 390x844 pause OPTIONS
- Expected: The rows are discoverable and reachable by a thumb.
- Observed: 4 of 10 (FFX) or 12 (FFX-2) rows show in a 100 px scroller (top 439, bottom 539). The only cue is a faded partial row. Raw touch drags do reach and flip all three new rows (probe3b), but synthesized scroll gestures did not move the tab strip (probe3).
- Repro: 390x844: tap the pause chip, swipe the tab strip to OPTIONS, look at SETTINGS.
- Evidence: round-18/evidence/probe3b-seymour-flux-390x844-cand/11-options-by-tap.jpg, 23-fxSpectacle.jpg; logs/probe3b-*.log
- Confidence: high; requirement: RUBRIC §6 onboarding (device usability); CHK-015
- Smallest fix: Let the phone OPTIONS page scroll as one page, or give the settings list more height and a visible more-below cue.
- Acceptance check: At 390x844 every settings row can be seen by scrolling the page, with a visible cue, in both games.

### 29. PR-0293 [polish] visual

**PR-0293 (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)**

- Build: 65152c1b; game: both; chapter and state: I, IV, VII, XVII, XVIII (every chapter checked)
- Where: pause layer at 4K (the 3360x1920 master is not scaled to cover)
- Expected: CHK-002: the pause painting covers the window at every supported size.
- Observed: Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- Repro: Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-3840x2160/03-pause-options-small.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- Confidence: high; requirement: CHK-002
- Smallest fix: Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- Acceptance check: pauseRect.full is true at 3840x2160 in both games.
- Note: No earlier round measured 4K, so whether this is new is unknown.

### 30. PR-0251 [polish, STALLED] interface

**PR-0251 (carried, re-measured at 4:3): at 1280x960 the battle HUD falls to 9.3-9.8 px effective with 32-35 visible elements under the 14 px floor**

- Build: 65152c1b; game: both; chapter and state: Ch I and Ch IV battle HUD; pause OPTIONS on a phone
- Expected: Zero text a player must read under 14 px effective at the CHK-002 viewports.
- Observed: Gap pass, fresh context at 1280x960: FFX min 9.8 px (32 elements under 14), FFX-2 min 9.3 px (35 under 14): CTB names 10.8 px, item badges 12.9 px, HP denominators 12.4 px, OD 9.8 px. At 2560x1080 the minimum is 13.6-13.9 px with 3-7 elements under 14; 2560x1440 menus 13.8 px with 2 under 14 (the coach footer).
- Repro: node critic/rounds/round-17/cap/gaps/sweep.mjs <chapter> <WxH> [touch]
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-ffx2-bahamut-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/res-seymour-flux-2560x1080/run.json
- Confidence: high; requirement: CHK-003; PR-0251 acceptance (text part)
- Smallest fix: Floor the stage-scaled HUD labels at 14 px effective (CTB names, badges, OD, FFX-2 job and max-HP spans), and raise the phone pause .pause__k / .pause__v / .pause__tab to 14 px.
- Acceptance check: sweep.mjs reports under14 = 0 for the battle HUD at 1600x900, 1280x960 and 390x844, and for every pause tab at 390x844.
- Note: Part 1 (the active phone pause tab off screen) passes this round: the active tab is inside 0..390 on every tab.

### 31. PR-0032 [polish, STALLED] onboarding

**PR-0032 (carried, weight up): no REDUCE FLASHES row and no key remapping, while the new default look adds ink impact frames and lens flares; the soft-flash path exists but reads a setting no row writes**

- Build: 65152c1b; game: both; chapter and state: all
- Where: pause OPTIONS; battle with BATTLE SPECTACLE and CINEMA LIGHT on (default)
- Expected: A player-reachable flash reduction when the default look flashes. Remapping stays a Bailey decision.
- Observed: The spectacle defaults on:
- Up to 3 ink impact frames per rolling second (SpectacleRules FlashBudget).
- Lens flares (LensFlare).

A 'soft' impact frame and a 0.35 flare peak exist behind eyeCandy.reduceFlashes, but fxEnv reads a 'reduceFlashes' setting that no row writes (settingsAtBoard has no such key). The workarounds are REDUCE MOTION (removes impact frames) or turning off BATTLE SPECTACLE and CINEMA LIGHT, and none of those rows mentions flashes. Remapping is still absent.
- Repro: Pause OPTIONS in either game: there is no flash row.
- Evidence: D:/pyrefly-rel26c/src/engine/fx/c/SpectacleRules.ts:43,181,201; src/app/fxEnv.ts:41; round-18/evidence/fxrows-*/run.json settingsAtBoard
- Confidence: high; requirement: RUBRIC §6 onboarding (motion and flash accommodations); D-220 Q7 undecided
- Smallest fix: Ask Bailey (D-220 Q7). If yes, add a REDUCE FLASHES row writing settings.reduceFlashes. Until then, name the flash in the BATTLE SPECTACLE row's help.
- Acceptance check: A row toggles reduceFlashes by keys, mouse and taps. With it on, impactFrame is 'soft' and the flare peak is 0.35. It persists across a reload.

### 32. PR-0237 [polish, STALLED] interface

**PR-0237 (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate**

- Build: 65152c1b; game: FFX-2; chapter and state: Ch XVI, Ch IV
- Where: 390x844 first command menu
- Expected: The intent line stays readable.
- Observed: Rikku's line lies over 'IXION ACTS NEXT … MOST LIKELY 83%' and the random-target list, and over 'BAHAMUT ACTS NEXT … SCRIPTED'.
- Repro: Fresh profile at 390x844, FFX-2 chapter, first menu.
- Evidence: round-18/evidence/ffx2-ixion-djose-win-touch/10-first-menu-coach.png; probe-ffx2-bahamut-390x844-touch-cand/10-status-hint-over-commands.jpg
- Confidence: high; requirement: CHK-008
- Smallest fix: As in round 17.
- Acceptance check: Coach box ∩ intent box = 0 at 390x844.
- Note: Also seen in the gap pass on the Sin XVII/XVIII phone frames (the first-turn coach card covers the field).

### 33. PR-0275 [polish, STALLED] interface

**PR-0275 (carried, confirmed): the board truncates 'Sin: the Fins and the …' and clips the Roman-numeral strip**

- Build: 65152c1b; game: both; chapter and state: chapter select
- Where: 1600x900 and 2000x1012
- Expected: Full names, and whole numerals.
- Observed: Unchanged: 'Sin: the Fins and the …', and 'VII'', 'KIV', 'KVII'' in the strip.
- Repro: Open the board at 1600x900 or 2000x1012.
- Evidence: round-18/evidence/seymour-natus-win/35-board-reload.png; seymour-flux-win/03-card.png
- Confidence: high; requirement: CHK-009
- Smallest fix: As in round 17.
- Acceptance check: scrollWidth <= clientWidth + 1 on every board row and numeral chip at 1280, 1600, 2000 and 3840.
- Note: Gap pass: the board clips 'Sin: the Fins and the Core' at every size measured, 1280x960 to 3840x2160.

### 34. PR-0250 [polish, STALLED] interface

**PR-0250 (carried, confirmed): the phone results location caption is clipped**

- Build: 65152c1b; game: FFX; chapter and state: Ch XII
- Where: 390x844 results
- Expected: The full caption.
- Observed: 'INSIDE SIN — THE GARDEN C…'
- Repro: Lose or win Ch XII at 390x844.
- Evidence: round-18/evidence/seymour-omnis-win-touch/31-results.png
- Confidence: high; requirement: CHK-009
- Smallest fix: As in round 17.
- Acceptance check: The caption's scrollHeight <= clientHeight + 1 at 390x844.

### 35. PR-0274 [polish, STALLED] interface

**PR-0274 (carried, confirmed): no advisor card at the first command menu of either Sin chapter**

- Build: 65152c1b; game: FFX; chapter and state: XVII, XVIII
- Where: first command menu
- Expected: The advisor card is shown by default, as in every other chapter.
- Observed: cardFirst.card is null in sin-face-win (1600x900) and sin-fins-core-win (2000x1012), although cardText exists in the DOM.
- Repro: Enter Ch XVII or XVIII and reach the first menu.
- Evidence: round-18/evidence/sin-face-win/run.json cardFirst; sin-fins-core-win/run.json cardFirst
- Confidence: high; requirement: CHK-004
- Smallest fix: As in round 17.
- Acceptance check: The card is visible (non-null box) at the first menu of both Sin chapters.

### 36. PR-0296 [polish] interface

**PR-0296 (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line**

- Build: 65152c1b; game: FFX; chapter and state: XVII sin-fins-core, first decisions
- Where: 390x844 battle HUD
- Expected: CHK-008: plates never cover the intent text.
- Observed: Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- Repro: 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/
- Confidence: medium (frames only); requirement: CHK-008
- Smallest fix: Reserve the intent line's band from the range plate on the phone layout.
- Acceptance check: No overlap between the FAR plate and the intent card rect at 390x844 in XVII.

### 37. PR-0295 [polish] prep

**PR-0295 (new finding, outside the changed area): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed at 0.61 (tiny text), unlike CHAPTER and SPHERE GRID**

- Build: 65152c1b; game: FFX; chapter and state: party prep, any FFX chapter
- Where: 390x844 party prep tabs
- Expected: Every prep tab is usable at phone size (RUBRIC §6 device usability).
- Observed: Gap pass (sphere-phonetabs-390x844-touch): only CHAPTER and SPHERE GRID have a phone page; the other four tabs are the scaled desktop board.
- Repro: 390x844 touch, Ch I prep, swipe through the tabs.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-phonetabs-390x844-touch/
- Confidence: high; requirement: RUBRIC §6 onboarding/prep device usability; CHK-003
- Smallest fix: Give the remaining prep tabs the phone page treatment Sphere Grid B introduced.
- Acceptance check: CHK-003 sweep of each prep tab at 390x844: no player text under 14 px.

### 38. PR-0259 [polish, STALLED] delivery

**PR-0259 (carried, improved): isolated frame-time spikes of 66-117 ms in fights**

- Build: 65152c1b; game: both; chapter and state: sin-face, seymour-flux, ffx2-ixion-djose
- Where: fight playing, 20 s windows
- Expected: No visible hitch in the fight.
- Observed: Maximum spikes of 116.7 ms (XVIII, 4 frames over 50 ms), 83 ms (I) and 66.5 ms (XVI phone tier), with fx on and off alike. Average 59-60 fps, p95 16.7-16.8 ms. Round 17 measured 150-217 ms.
- Repro: critic/rounds/round-18/cap/perf18.mjs, cold profile, GPU mostly idle (21 % / 8 %).
- Evidence: critic/rounds/round-18/evidence/perf/*.json
- Confidence: medium; requirement: RUBRIC §2 (report spikes)
- Smallest fix: Profile the spike frames (likely first-use shader compiles or texture uploads) and pre-warm them.
- Acceptance check: Maximum frame time under 50 ms in the same windows.

### 39. PR-0258 [polish, STALLED] prep

**PR-0258 (carried, re-confirmed): FFX victory spoils ignore the sourced x2-on-overkill drop quantity**

- Build: 65152c1b; game: ffx; chapter and state: seymour-anima-macalania
- Where: results after an OVERKILL win
- Expected: The sourced overkill quantity (4), per round 17.
- Observed: OVERKILL x1 with 'ITEMS Ability Sphere ×3, Blk Magic Sphere'.
- Repro: seymour-anima-macalania-win, seed 1, 1600x900, real keys.
- Evidence: critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json (resultsText)
- Confidence: high; requirement: AGENTS.md rule 6; RUBRIC §6 prep
- Smallest fix: Apply the sourced overkill drop multiplier in the results spoils.
- Acceptance check: The same run shows the sourced overkill quantity.

### 40. PR-0254 [polish, STALLED] narrative

**PR-0254 (carried, STALLED): Chapter VII Talk is still silent**

- Build: 65152c1b; game: FFX; chapter and state: VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- Expected: A Tidus line and Seymour's reply within 3 s of each Talk.
- Observed: The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- Repro: Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- Confidence: high; requirement: narrative: banter and reachable character voice
- Smallest fix: Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- Acceptance check: The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.

### 41. PR-0255 [polish, STALLED] narrative

**PR-0255 (carried): Tromell's five aftermath lines in Chapter VII still have no speaker**

- Build: 65152c1b; game: FFX; chapter and state: VII aftermath (CONFIRM scene)
- Expected: The speaker 'Tromell' with a name plate.
- Observed: 'Step away from Lord Seymour, Lady Summoner.' and four more lines have speaker '' (dbox 376877-377023 ms).
- Repro: Ch VII win, CONFIRM on results.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt
- Confidence: high; requirement: narrative: character voice
- Smallest fix: Add a 'tromell' speaker with a name plate and no portrait (like 'brother'), and move the lines to it.
- Acceptance check: The dboxTimeline shows speaker 'Tromell' on the five lines.

### 42. PR-0272 [polish, STALLED] narrative

**PR-0272 (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate**

- Build: 65152c1b; game: FFX; chapter and state: XVII sin-fins-core, seam 1 -> 2
- Expected: A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- Observed: The line 'The Fahrenheit's cannon tears the fin away.' plays (567826 ms), then the seam shows an empty sky (46 ms), Sin fading in (410 ms) and 'Right Fin' at 1496 ms. There is no hit and no fin separation (2000x1012).
- Repro: Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- Evidence: critic/rounds/round-18/feel-narr/sin-fins-core-win__seq-seam-2.jpg; dbox-all.txt
- Confidence: high; requirement: narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- Smallest fix: Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- Acceptance check: A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.

### 43. PR-0256 [polish, STALLED] feel

**PR-0256 (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it**

- Build: 65152c1b; game: FFX-2; chapter and state: XVI aftermath, whistles 1 to 4
- Expected: A visible light, nearer on each whistle.
- Observed: The lines are unchanged ('A small gold light answers.' ... 'It runs ahead, over a bridge of light.'). The harness hold-skipped them 50 ms apart, so no plate frames exist for this build. Carried on the unchanged script and scene.
- Repro: Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt (ffx2-ixion-djose-win)
- Confidence: medium; requirement: feel/narrative: shown, not told
- Smallest fix: A small gold mote fx step per whistle.
- Acceptance check: A timed capture after each whistle shows the light, nearer each time.

### 44. PR-0279 [polish, STALLED] encounter

**PR-0279 (carried, a question for Bailey): Sin's difficulty is still undecided (D-282); nothing in the engine changed, so the r17 figures stand**

- Build: 65152c1b; game: FFX; chapter and state: XVII, XVIII
- Expected: Bailey's call on D-282
- Observed: Unchanged data and AI. Real keys lost 2/2 in each chapter this round.
- Repro: r17 sin benches (reused, see reused)
- Evidence: D:/Final Fantasy/critic/rounds/round-17/combat/sin-bench-out.txt
- Confidence: high; requirement: encounter: correct difficulty
- Smallest fix: Ask Bailey
- Acceptance check: A decision is recorded in decisions.json

### 45. PR-0257 [polish, STALLED] encounter

**PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer on the sourced rows (208 real-key turns this round, the same as round 17)**

- Build: 65152c1b; game: FFX; chapter and state: III
- Expected: The release note figure matches the measured length
- Observed: braskas-final-aeon-win: 208 turns, 24.3 min; the replay matches all 1,292 events
- Repro: runs-summary.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-replay.json
- Confidence: high; requirement: encounter pacing
- Smallest fix: Correct the note or ask Bailey
- Acceptance check: The note matches the bench

### 46. PR-0280 [polish, STALLED] encounter

**PR-0280 (carried): the v3 card's Chapter XII rate is unchanged (bench identical); the live v4 card covers it**

- Build: 65152c1b; game: FFX; chapter and state: XII
- Expected: n/a
- Observed: ffx-three-line-r18.json XII rows are identical to round 17
- Repro: Run ffx-bench.test.ts
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- Confidence: high; requirement: advice usefulness
- Smallest fix: none needed now
- Acceptance check: n/a

### 47. PR-0220 [polish] audio

**PR-0220 (carried, downgraded major -> polish): an emulated pad-only run now unlocks audio on the first pad A (title, chapter-select, boss-seymour), but headless Chromium already had user activation, so a real Chrome with a real controller is not proven**

- Build: 65152c1b; game: both; chapter and state: all
- Expected: The first gamepad button unlocks the AudioContext, and the title or chapter-select music starts.
- Observed: Gap pass pad-only-seymour-flux-1600x900: standard-mapping virtual pad, no keyboard/pointer/touch events; after the first pad A ready:true, playing:'title'; board 'chapter-select'; first battle menu 'boss-seymour'. navigator.userActivation was already active in headless Chromium, so the run cannot tell a pad gesture from none.
- Repro: From a fresh profile, press only gamepad buttons from the title into a battle, then read __pyrefly audio debug: ready and playing.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/pad-only-seymour-flux-1600x900/run.json
- Confidence: low (unknown); requirement: RUBRIC s2 platform goals (gamepad); CHK-023
- Smallest fix: Add one emulated-gamepad Playwright run that asserts audio ready and a playing cue.
- Acceptance check: A real controller on real Chrome (or a headed browser with userActivation provably false before the pad press) reaches the title cue on the first pad button.
- Note: The written round-17 acceptance (one emulated-gamepad run asserting audio ready and a playing cue) now passes; the residual doubt is the emulation, so it stays open at polish.

### 48. PR-0039 [polish, STALLED] audio

**PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)**

- Build: 65152c1b; game: both; chapter and state: I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- Expected: Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- Observed: themes-audit fails scene-gagazet, scene-dreams-end and scene-farplane, the same as round 17. Note: scene-farplane measures E minor against the map's E major.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high; requirement: docs/audio/THEMES.md
- Smallest fix: Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- Acceptance check: themes-audit reports 0 departures for these cues.

### 49. PR-0260 [polish, STALLED] audio

**PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple**

- Build: 65152c1b; game: ffx; chapter and state: VII
- Expected: Every shipped cue has a row in the bible's cue map.
- Observed: FAIL scene-macalania-temple: the cue is not in the bible's cue map.
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high; requirement: docs/audio/THEMES.md
- Smallest fix: Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- Acceptance check: themes-audit shows ok for scene-macalania-temple.

### 50. PR-0278 [polish, STALLED] audio

**PR-0278 (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row**

- Build: 65152c1b; game: both; chapter and state: docs
- Expected: One contiguous table of rows I to XVIII.
- Observed: Line 656 is '| ## Owed cues for chapters not yet listed'. Rows XVII and XVIII sit at lines 667 and 668, after a stray separator at line 666, outside the table. themes-audit still reads 18 of 18.
- Repro: Open D:/pyrefly-rel26c/docs/audio/THEMES.md at lines 638 to 668.
- Evidence: docs/audio/THEMES.md:656,666-668
- Confidence: high; requirement: docs hygiene
- Smallest fix: Move the XVII and XVIII rows up under XVI, and put a blank line before the '## Owed cues' heading.
- Acceptance check: The rendered markdown shows one table of 18 rows, and themes-audit still passes.

### 51. PR-0298 [polish] audio

**PR-0298 (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB**

- Build: 65152c1b; game: both; chapter and state: all
- Expected: D-292 as worded: the music grows from about 39 MB to about 73 MB.
- Observed: The music is 78.2 MB and the total 80.93 MB (qa). The AUDIO_BUDGET_BYTES constant went from 60 to 85 MB, and the D-292 note in manifest-io.mjs documents the gap. Each chapter's music download roughly doubled; for example III requests 12.7 MB of music, up from 6.5. Any effect on slow-link loading is the delivery category's call (PR-0240) and is not scored here. NOW.md already lists 'music 78 MB ok?' as open for Bailey.
- Repro: node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- Confidence: high; requirement: RUBRIC s7 (a pick approves what Bailey named)
- Smallest fix: Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- Acceptance check: decisions.json records Bailey's answer on the 78 MB size.

### 52. PR-0271 [polish, STALLED] visual

**PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s**

- Build: 65152c1b; game: FFX only; chapter and state: XVIII Sin: the Face
- Where: Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- Expected: No HUD panel over a face, including during camera moves (CHK-008).
- Observed: When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- Repro: Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- Evidence: critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- Confidence: medium (observed; no live action-frame evidence to compare); requirement: CHK-008
- Smallest fix: Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- Acceptance check: XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 53. PR-0248 [polish, STALLED] visual

**PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe**

- Build: 65152c1b; game: FFX only; chapter and state: VII Seymour and Anima
- Where: Sensor card placement (not traced)
- Expected: The Sensor card placed clear of the fiends' projected quads.
- Observed: The card spans Guardian B from shoulders to knees; only his head shows above it.
- Repro: Seed 1, Ch VII, 1600x900. Target by real keys, then cancel.
- Evidence: critic/rounds/round-17/evidence/seymour-anima-macalania-win/16b-after-cancel.png; 16-target-single.png
- Confidence: high; requirement: CHK-008
- Smallest fix: Use the line-card free-slot picker for the Sensor card, or dismiss it on cancel.
- Acceptance check: Ch VII 16b-after-cancel at 1600x900 and 2000x1012: no enemy torso under the card.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 54. PR-0246 [polish, STALLED] interface

**PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'**

- Build: 65152c1b; game: FFX; chapter and state: Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- Expected: The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- Observed: 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- Repro: node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- Confidence: high; requirement: PR-0246 acceptance; CHK-009
- Smallest fix: Wrap the label to two lines, or drop the verb when the name is long.
- Acceptance check: The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 55. PR-0249 [polish, STALLED] interface

**PR-0249 (carried, refined): FFX-2 multi-target, the intent card covers Yuna's lower body and staff tip at 1600x900**

- Build: 65152c1b; game: FFX-2; chapter and state: IV Bahamut
- Expected: No panel over a face or a weapon.
- Observed: Heads are now clear. The intent card (x 10 to 385, y 560 to 880) sits over the White Mage's skirt and the end of her staff.
- Repro: Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- Evidence: critic/rounds/round-17/evidence/extras-ffx2-bahamut-1600x900/52-target-all.jpg
- Confidence: low; requirement: CHK-008
- Smallest fix: Add the projected party quads to the intent card's placement test while targeting.
- Acceptance check: 0 intent/actor-quad intersections in Ch IV to VI multi-target at 1600x900 and 2000x1012.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged). Related, gap pass: in Ch IV the ALL ALLIES tag sits against the intent card's ALSO line.

### 56. PR-0252 [polish, STALLED] interface

**PR-0252 (carried): the first-turn coach card overlaps the selected command row**

- Build: 65152c1b; game: FFX; chapter and state: X Seymour Natus at 2000x1012 (2560x1080 not captured)
- Expected: Coach clear of the command stack.
- Observed: Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
- Repro: Fresh profile, 2000x1012, Ch X first menu.
- Evidence: critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
- Confidence: high; requirement: CHK-008
- Smallest fix: Add the command stack to coachActorAvoid's rects at wide sizes.
- Acceptance check: 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
- Note: Narrowed: the gap pass fresh-context sweeps at 1280x960, 2560x1080 and 3840x2160 record coach overlaps [] in Ch I (evidence/gaps/sweep-*/run.json focFirst). Still seen at 2000x1012 in Ch X. Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 57. PR-0276 [polish, STALLED] interface

**PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header**

- Build: 65152c1b; game: FFX-2; chapter and state: IV Bahamut
- Expected: Header visible, or scrolling inside the rows only.
- Observed: The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- Repro: Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- Evidence: critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- Confidence: high; requirement: CHK-009
- Smallest fix: Make the header sticky, or scroll the rows container only.
- Acceptance check: Header box fully inside the list viewport after wheel up and down.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 58. PR-0277 [polish, STALLED] interface

**PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board**

- Build: 65152c1b; game: FFX; chapter and state: I Seymour Flux
- Expected: The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- Observed: The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- Repro: Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- Evidence: critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- Confidence: low; requirement: CHK-005 (says in plain words what to spend the turn on)
- Smallest fix: Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- Acceptance check: On the same board the card names the raise, then the cure, in that order.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 59. PR-0239 [polish, STALLED] interface

**PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3**

- Build: 65152c1b; game: FFX-2 (the rail is shared); chapter and state: XI Fallen Aeons, Rikku's Mega-Potion charging
- Expected: The two panels do not contradict each other about the same turn.
- Observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- Repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- Evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- Confidence: high; requirement: Interface: useful advice
- Smallest fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- Acceptance check: In the same case, the rail and the card agree or the rail defers.
- Note: Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes. Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 60. PR-0273 [polish, STALLED] combat

**PR-0273 (new; gap pass): Ch XVII link 3 (on Sin's back) still lists disabled PULL BACK and CLOSE IN rows at the top of the command menu**

- Build: 65152c1b; game: FFX; chapter and state: Ch XVII sin-fins-core, link 3 (Sinspawn Genais + Sin's Core), every party menu
- Where: engine emits disabled 'pull-back'/'close-in' triggers in link 3 (in-process probe combat/gaplink3-out.json); AirshipOrders folds orders only when airship.range is set (src/ui/ffx/AirshipOrders.ts:137); file of the trigger source not traced
- Expected: research/ffx-sin.md §1 table, link 3: 'on Sin's back (the party jumps from the ship) ... no Trigger Command'. No order rows in link 3.
- Observed: In link 3 the menu reads PULL BACK / CLOSE IN / ATTACK / SPECIAL / WHITE MAGIC / ITEMS, and the engine marks both orders disabled. The stage also still shows the Fahrenheit deck.
- Repro: Real-key win seed 1 (gaproute.mjs sin-fins-core, POLICY=xvii): the first link-3 menu.
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/sin-fins-core-win-r17gap-s1/seq-seam-3/f20.jpg; D:/Final Fantasy/critic/rounds/round-17/combat/gaplink3-out.json
- Confidence: high; requirement: research/ffx-sin.md §1 (link 3 has no Trigger Command); CHK-004
- Smallest fix: Drop the airship trigger commands from link 3's formation or triggers, or hide disabled trigger rows when no range state exists.
- Acceptance check: The first link-3 menu lists no PULL BACK or CLOSE IN row, and in-process the link-3 decision carries no trigger commands.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 61. FOC28-P02 [polish, STALLED] interface

**FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone**

- Build: 65152c1b; game: FFX; chapter and state: II and XIV Grand Summon picker, 390x844
- Expected: Legible and not clipped.
- Observed: Recorded by the focused review of this same build and still open.
- Repro: See critic/reviews/6ea8528f-focused.md.
- Evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
- Confidence: high; requirement: CHK-003
- Smallest fix: As proposed in the focused report.
- Acceptance check: As proposed in the focused report.
- Note: Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes. Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 62. PR-0223 [polish, STALLED] delivery

**PR-0223 (carried): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured**

- Build: 65152c1b; game: FF7 (hidden experiment); chapter and state: FF7 Guard Scorpion
- Where: pause in the FF7 fight
- Expected: 0 requests >= 400 on the FF7 pause.
- Observed: Not captured in round 17. No FF7 file changed in this candidate.
- Repro: FF7 door, then battle, then Esc; record the network log.
- Evidence: absent; builder claim only (docs/handoff/r29-load.md)
- Confidence: low; requirement: CHK-017 / CHK-018
- Smallest fix: None until observed.
- Acceptance check: FF7 pause at 1600x900: 0 responses >= 400 and no text/html image.
- Note: Round 18: not re-tested (no candidate commit addresses it; the interface auditor carried it unchanged).

### 63. PR-0247 [polish, STALLED] visual

**PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s**

- Build: 65152c1b; game: FFX; chapter and state: VII, battle, Anima's arrival at 390x844 touch
- Expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- Observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- Repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- Confidence: high; requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- Smallest fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- Acceptance check: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- Note: Round 18 gap pass tried at 390x844 by taps: Anima never arrived within 31 advisor-led decisions (560 s), so the 18 s acceptance could not be run. Still UNVERIFIED.

### 64. PR-0261 [polish, STALLED] harness

**PR-0261 (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []**

- Build: 65152c1b; game: both (tooling); chapter and state: all phone routes
- Expected: contexts.touch.blocked names the element that intercepts the tap.
- Observed: The run.json files of ffx2-den-of-woe-win and -stall-{cand,fxoff,pacecurrent,confirmer} say outcome 'victory', although the chain never finished; runs-summary.json repeats it; only index.json's note says soft-lock. Round 17's reticle-interception-as-timeout part is unchanged.
- Repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json
- Confidence: high; requirement: CHK-016 evidence integrity
- Smallest fix: Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- Acceptance check: A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- Note: Carried from round 16 and not re-tested on 1a6fd3cc; its state on this build is unknown. No file it depends on is shown fixed by the candidate's handoff notes.

### 65. PR-0299 [suggestion] audio

**PR-0299 (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred**

- Build: 65152c1b; game: both; chapter and state: all
- Expected: RUBRIC s7: an inferred item is asked before it is built.
- Observed: src/app/saveSfxBalance.ts moves any 0.35 stored without the marker. The rule works exactly as stated (28 of 28 cases pass), but D-293 marks the existing-save half as inferred, and NOW.md lists it as open for Bailey. A pre-release player who picked 0.35 by hand cannot be told apart from an untouched one.
- Repro: Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- Confidence: high; requirement: RUBRIC s7 inferred items; D-293
- Smallest fix: Ask Bailey whether this is acceptable. No code change unless he says no.
- Acceptance check: D-293's inferred note moves to named, or is reversed by Bailey.

### 66. PR-0297 [suggestion] target-registry

**R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships**

- Build: 65152c1b; game: both; chapter and state: docs/target/targets.json group picks-0929
- Expected: Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- Observed: All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- Repro: Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- Evidence: D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- Confidence: high; requirement: RUBRIC §7 (delivery field, required targets)
- Smallest fix: Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- Acceptance check: node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.

### 67. PR-0217 [suggestion, STALLED] combat

**PR-0217 (carried): Zombie is kept across a KO (unsourced); the advisor top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged**

- Build: 65152c1b; game: FFX; chapter and state: I, II
- Expected: A sourced rule, or the rule labelled as an assumption
- Observed: The three-line bench is identical to round 17, zombieReviveTopRows included
- Repro: ffx-bench.test.ts
- Evidence: D:/Final Fantasy/critic/rounds/round-18/combat/ffx-three-line-r18.json
- Confidence: medium; requirement: AGENTS.md rule 6
- Smallest fix: Source the rule or label it
- Acceptance check: A written source

### 68. PR-0227 [suggestion, STALLED] encounter

**PR-0227 (carried, information): Chapter XIII is rarely won at human pace. Seed 1 lost on 1 and 1001 (and on ?pace=current); the seed-2 route won on 1002**

- Build: 65152c1b; game: FFX-2; chapter and state: XIII Trema
- Expected: Information for Bailey
- Observed: ffx2-trema-win: defeat@1, defeat@1001. ffx2-trema-win-s2: defeat@2, victory@1002 (333 turns). ffx2-trema-win-pacecurrent: defeat@1.
- Repro: runs-summary.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/runs-summary.json
- Confidence: medium (Active ATB is wall-clock sensitive); requirement: encounter: fair difficulty
- Smallest fix: none (a question)
- Acceptance check: n/a

### 69. PR-0262 [suggestion, STALLED] narrative

**PR-0262 (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four**

- Build: 65152c1b; game: FFX; chapter and state: results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
- Expected: No two chapters share a first-choice quip, and at most two use 'That's it?'.
- Observed: src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
- Repro: Win I, II and VIII and read the results quip.
- Evidence: results text in critic/rounds/round-18/feel-narr/dbox-all.txt; grep of D:/pyrefly-rel26c/src/story
- Confidence: high; requirement: narrative: character voice, no repetition across chapters
- Smallest fix: Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
- Acceptance check: First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.

## What stands between this build and acceptance

1. **PR-0281 must be fixed before any deploy**: it is a critical lock introduced by this candidate and a regression against live. The build cannot ship as it is.
2. Audio has no verified score until Bailey gives a numeric listening verdict (CHK-B1, PR-0148); the score stays provisional until then.
3. Seven categories sit below the 9.0 floor (encounter, visual, feel, narrative, interface, onboarding, delivery).
4. Mandatory checks fail: CHK-002 (4K pause), CHK-003 (4:3 text), CHK-006 (restart and replay layers), CHK-008 (O3 hint collisions), CHK-009 (clipping), CHK-015 (ESC RESUME, REPLAY BRIEFING, AUTO-LEARN key route), CHK-022 (Chapter XV), CHK-023 (the O3 freeze). CHK-B1 is UNVERIFIED.
5. 16 critical or major issues are open; Chapter XV has no complete real-input flow; XVII and XVIII have never been won on this build by the advisor-following route.
6. The target gate: 1 failing (Status display O3), 20 unverified, 6 waiting on a decision; nine human judgments are unrecorded; the exact artifact has not been verified live.

## What changed since round 17

- **Build**: release 32's candidate 1a6fd3cc (round 17, SHIP; since deployed and verified live) -> release 33's candidate 65152c1b: eye candy D as the default, status display O3, first run O2 and the calm camera, Sphere Grid A/B/C, V0 music, SFX b with a save migration, steady pacing. src/battle, src/data, src/engine/tactics and src/story are byte-identical.
- **Ship**: SHIP -> HOLD. New critical PR-0281 (status O3's FFX-2 Stop freeze locks Chapter XV at the link-2 opening).
- **Closed debts**: the CHK-022 aftermath debts for III, XII and XIII and the VIII loss + RETRY are settled by real input; the Sphere Grid is proven by real input; 2560x1440, 2560x1080, 1280x960 and 3840x2160 were captured; an emulated pad run exists.
- **Categories**: combat 9.2 (=), encounter 8.8 (=), visual 8.9 (=), feel 8.3 -> 8.4 (steady pacing and the calm camera answer the friends' "too fast" and dizziness, measured), narrative 8.9 -> 8.8 (XV's link-2/3 banter and aftermath unreachable), audio UNVERIFIED (=), interface 8.2 -> 7.8 (O3 hint over commands; the restart layer defect found), onboarding 8.2 -> 8.4 (O2, comfort reach; REPLAY BRIEFING found broken), prep 8.9 -> 9.0 (Sphere Grid A/B/C working), delivery 8.7 -> 7.8 (the new critical lock).
- **Resolved**: PR-0161 (stale observation). **Downgraded**: PR-0263 and PR-0220 (major -> polish), PR-0287 (cosmetic). **New IDs**: PR-0281 to PR-0299.
- **Merged this round**: PR-0281 <- capture-owner issue 1, R18-CE-01, R18-FN-01, R18-DEL-01; PR-0282 <- capture-owner issue 2, R18-IF-02, R18-IF-03, R18-VIS-01, gap: FFX-2 phone hint card; PR-0283 <- capture-owner issue 3, R18-IF-01, gap: RESTART ENCOUNTER; PR-0284 <- R18-ON-01, gap: REPLAY BRIEFING; PR-0286 <- capture-owner issue 4, R18-IF-05; PR-0285 <- R18-FN-02, gap: status line lag; PR-0289 <- R18-ON-03, R18-VIS-02; PR-0264 <- gap: phone tap commits the heal; PR-0265 <- gap: ESC RESUME 0/32; PR-0244 <- gap: Ch VII CONFIRM 250 ms; PR-0266 and PR-0270 <- interface PR-0266/PR-0270 bundle, gap: TEXT SIZE 130 %; PR-0061 <- gap: hold-skip +2.7 s; PR-0104 <- gap: Shell confirm; PR-0251 and PR-0293 <- gap: 4:3 HUD text and 4K pause; PR-0261 <- R18-CE-02; PR-0268 <- combat cross-reference PR-0268.
- **STALLED** (open at the same severity in rounds 17 and 18; the next batch in each area starts with a method check): PR-0264, PR-0148, PR-0099, PR-0265, PR-0269, PR-0268, PR-0267, PR-0244, PR-0266, PR-0270, PR-0240, PR-0222, PR-0061, PR-0104, PR-0251, PR-0032, PR-0237, PR-0275, PR-0250, PR-0274, PR-0259, PR-0258, PR-0254, PR-0255, PR-0272, PR-0256, PR-0279, PR-0257, PR-0280, PR-0039, PR-0260, PR-0278, PR-0271, PR-0248, PR-0246, PR-0249, PR-0252, PR-0276, PR-0277, PR-0239, PR-0273, FOC28-P02, PR-0223, PR-0247, PR-0261, PR-0217, PR-0227, PR-0262.
- **Confirmation**: the top critical was re-run independently on a different path (16 link-1 turns, Yuna at 2057 HP): the same stall; the mechanism test was re-run and passes. Nothing was refuted.

## Proposals (nothing here is built without Bailey's yes; unscored)

- A presenter stall watchdog: when playback has not advanced for 45 s while the engine is undecided and no menu is awaited, log a console error and (optionally) release the waiting moment. Benefit: a PR-0281-class lock becomes visible and recoverable instead of a 44-minute frozen frame. Cost: small, presenter-side. Fit: neutral to both games. Risk: masking a real bug if it silently releases; logging-only first. Nothing is built without Bailey's yes.
- One short help line under each of the three new eye-candy rows (what the row changes, e.g. 'Moving backgrounds, weather and reflections'). The approved A2 frame has none, so this is a question for Bailey. Cost: copy plus layout at phone size.
- A standing regression lane that crosses every FFX-2 chain seam and phase moment with each carried status (Stop, Sleep, Curse, KO) through the real presenter, headless. Benefit: catches the next PR-0281 before a capture pass. Cost: test time only.

## Server hygiene and scope

The chief started no server and opened no browser. The capture owner stopped vite preview 5810 (PID 35928) and the old-build servers 5811-5814 by PID; the confirmer stopped its preview on 5931 (PID 25964) by PID and confirmed the port closed. The chief's own check of ports 5400-5990 is recorded in the prose report. D:/pyrefly-rel28 was never touched. Chief check at 15:18 EDT: Get-NetTCPConnection shows no LISTEN socket on ports 5400-5990.

Bailey's latest chat lines ('all your recommendations, godspeed') were not treated as a task or as approval; this review follows the brief and his quoted standing rules.

Scratch for this report: critic/rounds/round-18/chief/ (the agents' results extracted from the workflow journal, build-report.mjs, build-md.mjs).

## critic-clear output (verbatim)

```text
critic:clear no pending marker for build 65152c1b: kept as candidate evidence
```
