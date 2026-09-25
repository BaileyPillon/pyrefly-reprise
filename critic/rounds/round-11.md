# Critic round 11: deep review of the live build 76f587c3

```text
Build / artifact / target version: main 76f587c3, bundle 81kxOXnv, artifact b1924762cdc2ab44... (894 files, critic/artifacts/76f587c3.json) / targets.json c17c6fec2951... (working tree; the 76f587c3 blob is 7399d767...)
Review: deep (post-deploy, on the live site while it served 76f587c3, 05:36Z-17:52Z on 2026-09-24; later runs and the gap pass saw newer builds, labelled below)
Deployment: PASS (exact artifact verified live in its window; 0 console errors, 0 responses >= 400 in 17 real-key runs)
Changed area: FAIL (chapter 3 has no real-input win; four approved targets of the changed area fail; open majors in combat, intent and the advisor)
Ship: SHIP (historical: no open critical after the confirmer refuted R11-UI-00, no major is a regression against d9decadb); discloses 44 majors, led by PR-0148, PR-0152, PR-0082, PR-0153, PR-0154, PR-0155
Milestone: not assessed
Quality: PROVISIONAL, no verified audio score (see the score output); every scored category is below 9.0
Targets: required 54 / matched 33 / failing 9 / unverified 12 / waiting on decision 9
Top issues: PR-0148, PR-0152, PR-0082, PR-0153, PR-0154, PR-0155, PR-0143, PR-0156, PR-0123, PR-0126 (ranked list below, with impact, evidence and next correction)
Coverage: 7 playable chapters by real keys (6 won, 3 lost and retried); engine benches and data audit; audio read not heard; see the coverage matrix
Next required review and why: deep review of a999d133, which now carries the deep obligation (critic/pending/a999d133.json); this report cannot settle it
Elapsed review time / repeated work avoided: about 565 min wall clock; no second full capture, 10 unchanged observations reused under dependency arguments
```

## Score output (tools/critic-score.mjs, verbatim)

```text
score: PROVISIONAL — no verified score for audio (never averaged away, never zero)
below the 9 floor: combat, encounter, visual, feel, narrative, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio
  - category combat is below the 9 floor
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category prep is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-022 is FAIL
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-022 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-013 is FAIL
  - mandatory check CHK-014 is FAIL
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-007 is FAIL
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-005 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-007 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-010 is UNVERIFIED
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-004 is FAIL
  - 44 critical or major issue(s) remain open
  - encounter braskas-final-aeon has no complete real-input flow
  - 9 required target(s) failing
  - 12 required target(s) unverified
  - 9 required target(s) waiting
  - only 33 of 54 required targets matched
  - human judgment not recorded: Audio listening verdict for the shipped mix (CHK-B1)
  - human judgment not recorded: Bailey's negative verdict on the score, 2026-09-21 ('music is too reminsicent of snes music ...')
  - human judgment not recorded: Chapter VIII feel after a play session (CHK-B2)
  - human judgment not recorded: PR-0008 re-baseline of chapter 1 (method check option c) and whether a fresh profile keeps seed 1
  - human judgment not recorded: Whether the FFX-2 turn cut-in (shipped in 6d6ab7e3) should stay, and its target
  - human judgment not recorded: Whether a girl's dressphere should revert at an FFX-2 chain seam
  - human judgment not recorded: Marking the v5 pause and v6 phone pause tiles superseded by the Until Dawn remake
  - human judgment not recorded: Banter bank in or out of this milestone
  - human judgment not recorded: Briefing line 'Five fights' with seven chapters playable (Bailey's words)
report: valid evidence
```

The chief does not compute the total. Audio has no numeric owner verdict, so the score is provisional and no weighted total exists for this build. Two auditor numbers were adjusted by the chief, each with its reason in the category evidence: combat 8.6 to 8.5 (PR-0155), interface 7.2 to 7.0 (PR-0143 narrowed, PR-0156).

## Verdicts

- **deployment: PASS.** PASS for the window 76f587c3 was live (05:36Z-17:52Z): critic/reviews/76f587c3-live.json verify-live PASS, and the capture owner's live artifact-manifest.json (fetched 16:28Z) equals critic/artifacts/76f587c3.json (b1924762..., 894 files, problems []); 0 console errors and 0 responses >= 400 over 17 real-key runs. The site no longer serves this build.
- **changedArea: FAIL.** FAIL: chapter 3 has no real-input win (CHK-022), and the changed systems miss approved targets (Battle HUD FFX, Turn cut-in, Leblanc, Vegnagun parts) with open majors in combat (PR-0154, PR-0155), intent (PR-0153, PR-0123) and the advisor (PR-0082).
- **milestone: not assessed.** Not assessed in a deep review; the score is provisional (audio UNVERIFIED) and well below 9.60.
- **ship: SHIP.** SHIP by the owner's rule A: no open critical (R11-UI-00 was refuted), and no major is a regression against d9decadb. This is a historical verdict: 76f587c3 went out under an owner override without a focused report and has since been replaced.

Ship reasons:
- No open critical defect: the only critical reported (R11-UI-00, Escape early in an FFX battle) was refuted by the confirmer on the exact bundle, 10 of 10 real Escapes clean; it is kept as polish PR-0158.
- No major is a regression against d9decadb, the live build 76f587c3 replaced: every open major was traced to code or data unchanged in d9decadb..76f587c3 or was already observed in round 10; PR-0156 carries unknown tags, which do not hold a major (only a critical).
- Against d9decadb the increment added fixes (painted goons, FFX-2 help band, pause face framing, Nooj and Brother portraits) and introduced no critical.
- The verdict is history: the build was deployed under Bailey's override ("You have my go ahead! Let's do it.") before any review and has been replaced four times since.
- Its 44 open majors are disclosed and carried into the next batch (see disclosed).

Tag frame for every critical and major: Tags use the release frame: candidate 76f587c3 against d9decadb (release 11), the live build it replaced on 2026-09-24T05:36Z. The deep scope itself is 7191674..76f587c3 (releases 08-12); round 10 (5ddfde3) is the previous deep report.

## Categories

| Category | Weight | Score | Status |
|---|---:|---:|---|
| combat | 20 | 8.5 | scored |
| encounter | 10 | 8.9 | scored |
| visual | 15 | 7.6 | scored |
| feel | 10 | 7.9 | scored |
| narrative | 10 | 7.7 | scored |
| audio | 10 | none | UNVERIFIED |
| interface | 10 | 7 | scored |
| onboarding | 5 | 6.6 | scored |
| prep | 5 | 8.4 | scored |
| delivery | 5 | 7.9 | scored |

### combat (8.5)

BUILD: main 76f587c3, bundle 81kxOXnv, live artifact b1924762 (capture owner's CHK-017 record). I opened no browser. Engine work ran on an exact `git archive 76f587c3` copy (src, tests, research, tools, critic, public, learn; node_modules and public/art junctioned from the main tree, unlinked and deleted afterwards). Browser evidence is the capture owner's: PYREFLY_BROWSER=gpu, headless Chromium, real keys. UNIT SUITE: 299 files. First pass: 276 passed, 5,435 tests passed. The 23 failing files were all harness errors from my partial tree (ENOENT on docs/, critic/, public/art). After adding critic/ and public/, 18 of those 23 pass (518/520 tests). The last 5 still miss docs/audio/THEMES.md, docs/target/targets.json and docs/concepts renders. None of the 23 is a combat or encounter test (critic/rounds/round-11/combat/unit-full.log, unit-rerun-env.log). MECHANICS SUITES re-run separately: 26 files, 404/404 (mechanics-suites.log). They cover ffx-ctb 34, ffx-ctb-locks, ffx-statuses 22, ffx-doublecast-aim 9, ffx-overdrive-menu-rows 16, ffx2-active-atb, ffx2-atb-golden 6 (Wait and Active goldens byte-identical), ffx2-atb-speed, ffx2-chain 12, ffx2-grenade, ffx2-steal, ffx2-status-locks, ffx2-statuses, ffx2-vegnagun-reflect-immunity 6, data-ffx2-vegnagun-chain 16, ffx2-ai-vegnagun 16, evrae-engine / evrae-script 34 / evrae-breath-hold, leblanc-engine, leblanc-white-wind, flow-encounter-chain 41 and enemy-intent 30 (a dry run leaves RNG and state untouched). CHANGED DATA SINCE ROUND 10 (5ddfde3..76f587c3), audited against research: (1) Grenade base 200 with no guaranteed crit, Budget Grenade 0.4 / 12 gil: matches ffx2-combat-core §2.9.3, §5.5 and §8.1 and the C18.1 correction. (2) Steal byte /255 with a 1-in-8 rare slot and one steal per enemy; Pilfer Gil 2 MP, once per enemy, no damage: matches ffx2-bahamut §1.6 and ffx2-combat-core §3.2 / §8.3. (3) Stolen gil and steal tables, spot-checked line by line: Leblanc 1,500 / Logos 640 / Ormi 600 at 192/255; Bahamut 2,200 at 128; Vegnagun Tail 3,000 with X-Potion x4/x6; Leg 4,000; Nodes 10,000; Redoubts 350 with PD/Mega Phoenix at 128; Bulwarks 300; Mythril Bangle drop id. All match ffx2-vegnagun-shuyin §3.1-§3.5 and §13.2 S1-S3. (4) Evrae (Chapter VIII, new to deep review), all against ffx-evrae-airship §1-§5 and §9. Stats: HP 32,000, Def/MDef 0, Agi 20, all four elements halved. Immunities: Slow 50, Dark 50, Poison 255 and the rest. Rewards. Eight action rows with base, hits, accuracy, shatter and dark flags. Cid Guided Missiles: Fixed 4 x12, three volleys. Haste threshold 10,667. Stone Gaze aggro 6 (+1 / +2). Delay allowed. The preset is labelled [estimate] as §9.3 says. PASS. LIVE RUNTIME CONFIRMATIONS (capture event logs): PR-0125 is repaired. Seventeen Doublecast: Firaga cast through the real menu each hit Braska's Final Aeon twice (1,460-4,031), and none hit Lulu (braskas-final-aeon-win-r2/battle-log.json). The MP half of PR-0124 is repaired. No HP or MP above its maximum appears in 1,168 HUD rows, including six chain seams. Rikku's row goes from WM 113/123 to TH 106/106 at the ch6 Act II seam (turn-log turns 20-22), and from BM to DK in ch5 (turns 53-55). The Evrae range loop works: Inhale, then Pull back, then 'Out of Breath Range'; 36 missile hits at 187-211 each (§2.2 range 187-211); 'out of missiles' after three volleys; threshold Haste at about 10,6xx HP; Swooping Scythe counter at FAR; Haste recast when Slow lands. Photon Spray hits 8 times with random targets at 82-106 (§7.2). Overdrives and triggers are live (Mega Flare, Energy Ray, Shooting Star, Grand Summon, Spiral Cut, aeon Overdrives, Kimahri Talk). FFX-2 spherechanges and 291 chain events are logged. PR-0143 is repaired at engine level: the round-10 probe re-run on this build steals a Budget Grenade on 5/5 seeds (probe-steal.json). It is still NOT exercised in any live run (UNVERIFIED at runtime). The same holds for the Grenade. AGAINST (the score): NEW MAJOR PR-R11-C01. Vegnagun's and Shuyin's magical attacks roll the §2.6 evasion race because the engine fallback tables lack canMiss:false. The live ch5 run shows Paine evading Nemo Ante Mortem Beatus three times. A 40-seed probe shows about 8% of Nemo / Mors Certa target-hits and the Nodes' -aga spells evaded. Carried polish, all with unchanged code: PR-0145 (still a slow defeat, 23-60 s, re-probed), PR-0105, PR-0106, PR-0107, PR-0108, PR-0069, PR-0054, PR-0053. PR-0124's dressphere revert is a sourcing gap (ffx2-combat-core §8.2), asked as a question, not scored. GAIN VERSUS ROUND 10 (8.4): three combat majors closed with live proof (PR-0125, and PR-0124's MP half) or engine proof (PR-0143, PR-0087). One pre-existing major newly found. Net +0.2.



CHIEF ADJUSTMENT 8.6 -> 8.5: the auditor's number did not include PR-0155 (FFX aeons offered and using the party's Items), a confirmed major on the FFX command sets (engine output plus code trace at 76f587c3). One confirmed major, one tenth.

### encounter (8.9)

Fresh 40-seed engine benches on 76f587c3 (probe-ffx-bench.json/.log). Each chapter was driven two ways: by the shipped intended line, and by the advisor's top row with engine target ids. Results: Evrae 40/40 and 40/40. Seymour Flux 26/40 and 27/40, where seed 1 loses for both (PR-0008). Yunalesca 39/40 and 38/40. Braska's Final Aeon (link 1) 39/40 and 39/40. The unit suite's chain runs win BFA through Yu Yevon on seeds 1, 7, 42 and 20260916, 39/40 contiguous, verifier 8/8. FFX-2 under the default Wait (bench-ffx2-wait.log, PYREFLY_MEASURE=1): ch4, ch5 and ch6 are 40/40 at 0, 1,500 and 4,000 ms of decision time. Under the opt-in Active at 1,500 / 4,000 ms: ch4 40/40 and 40/40, ch5 5/40 and 0/40, ch6 5/40 and 0/40 (PR-0076, polish, opt-in only). CREDIBLE MISTAKES STILL LOSE. Attack-mash under Wait: ch4 0/40, ch5 0/40, ch6 3/40 (probe-ffx2-mash-wait.log). Bahamut without mitigation 0/30, mash 0/30, Charon 0/15. Evrae naive melee 0/20 (strategy-evrae). Careless mashing of Act III from full wins 6/12. Out-damaging Yu Yevon wins only the slow way (turn 477 or later). CANONICAL TACTICS WORK: Bahamut Shell route 30/30; Evrae Pull back to dodge the breath, missiles, Slow and Reflect; BFA Zombiestrike plus Power Wave; Doublecast. REAL FLOW (capture owner): six of seven chapters reached their outcome with real keys, and ch1 and ch6 reached defeat and retry too. Chapter 3 lost twice (25.2 and 22.2 min). I established the cause from the logs. The advisor card said 'Slow -> Yu Pagoda' with no A/B letter. The run slowed the already-Slowed Pagoda A (43 no-op casts per attempt; round 10's evidence shows the identical pattern). Pagoda B was never Slowed: 91-98 Power Waves, 103,500-127,500 HP healed into BFA, gauge +20 each, 18-25 Triumphant Grasps. Tidus was pinned to Slow, so Talk was never offered. At engine level the same advisor wins 39/40, so the encounter is sound. The defect is the card-to-cursor naming, filed once under PR-0082 (interface root; not deducted here). PR-0007 (Zombie then Full-Life with no window) is sourced CTB math: ffx-seymour-flux line 279 says both actors have Agility 38, and line 655 says 'Requires beating it on CTB'. The docs/plans/pr-0007-method-check.md re-scopes it to information, so I recommend polish/information. DEDUCTIONS: PR-0008 (ch1 intended line at a measured 65% ceiling; re-baseline awaits Bailey; the production default seed 1 is a losing seed for both lines, and the live capture lost it). Chapter 3 has still never been won through real play (PR-0082, cross-ref). Active-mode human-speed rates (PR-0076). GAIN VERSUS ROUND 10 (8.8): a new chapter (Evrae) is authentic and fair, and the chapter 3 blocker now has an established, cheap cause.

### visual (7.6)

Deep review, round 11. Build: the LIVE site at main 76f587c3, bundle assets/index-81kxOXnv.js, artifact b1924762cdc2ab4467d61b6f39c97f26cc37ac1f28e8fd59787ee2824ecd6a2a (894 files). I judged it only from the capture owner's evidence (critic/rounds/round-11/evidence, taken with PYREFLY_BROWSER=gpu in headless Chromium through Playwright, with real keys, at 1600x900, 2000x1012 and 390x844). I opened no browser. I read 55 target-versus-build composites (critic/rounds/round-11/targets/*.jpg) and 20 contact sheets and 2x crops (critic/rounds/round-11/visual/).



EVIDENCE IDENTITY: the live site was redeployed to bcbdb483 at 17:52Z. Several runs started after that time: both chapter 3 runs, all four scene walks and the pause matrix, plus the final reload in chapter 5. They are still labelled 76f587c3, so they most likely show bcbdb483. The dependency argument: git diff 76f587c3..bcbdb483 touches only the pause snap markup and the portrait crop adoption (src/app/screens/pause/markup.ts, src/ui/common/portrait.ts, portraitHost.ts). The only art that differs belongs to locked Chapter VII and unregistered Chapter IX. So battle staging, scene art and dialogue portraits in chapters 1-6 and 8 are unaffected. I use those captures for the battle scene and for portrait identity, and I label them as such.



PROTECTION PASS: all 126 in-scope approved files are byte-identical in the live manifest (targets/hashcheck-live.json). The 7 files that are absent belong to locked Chapter VII and unregistered Chapter IX.



GOOD:

- Chapter VIII: the backdrop shows the hull from the rail, per pick B. Evrae renders in the teal and gold palette and faces the party. The chapter card, results and pre-scene are clean. Speaker portraits load for eight speakers, and Brother's FFX line correctly keeps the text card.

- Chapter VI goons are now painted exactly as picked. Dr. Goon has a domino mask and his face shown; Fem-Goon has a pink domino mask and a brown bob. This fixes PR-0092.

- The Nooj portrait (repaired option C, neutral mouth) and the Brother portrait (option A) render in dialogue.

- The FFX-2 command-help band matches option A at 1600x900 and 2000x1012.

- The Until Dawn pause frames a, c, d, e and f match at every captured size in both games, with faces clear of the stat columns. The FFX-2 intent card no longer covers the pause (PR-0122 not reproduced).

- Yuna's Gunner and White Mage paintings read cleanly (PR-0097 not reproduced). The chapter 5 tail tip reads steel, not green (PR-0015 not reproduced).

- The Chapter 3 Final Aeon and both Yu Pagodas are visible.

- Enemies face the party in every chapter.



AGAINST:

- New, major (R11-VIS-01): in Chapter VIII the command stack covers Tidus and Wakka is cut by the left edge on the first menu. In the action frames Tidus and Wakka are off-frame.

- Newly filed, long-standing, major (R11-VIS-02): in FFX the action camera puts the acting party member under the enemy info card and the party panel (chapters 1 and 3). The chapter 1 frame is identical in round 10.

- Polish (R11-VIS-03): the hair in Yunalesca's approved attack painting is cut by the canvas edge, which shows as hard straight lines on the field.

- Carried: PR-0002 (Yuna under the stack) and PR-0005 (the cut-in now plays but covers the FFX command menu and Auron's coach line). PR-0022 (a KO'd character floats), PR-0031 (no dim or ground ring) and PR-0035 (the FFX-2 field is mirrored). PR-0094, widened: at chapter 5 link 3 the intent card covers most of Vegnagun's body. PR-0095 (cone parts), PR-0096 (Leblanc's fan is shut) and PR-0137 (Bahamut matte holes). PR-0135/R10-VIS-01 (dark side strips in FFX-2 at 2000x1012). PR-0017, widened: on a phone, chapters 4 and 8 barely show the party. PR-0065 (cold-launch briefing and card fallbacks, now also in chapter 8).



COVERAGE GAP: the 4:3, 21:9, 1440p and 4K shapes were not captured this round.



NET: several fixes (goons, bloom, tail tip, pause intent card) and a new chapter with finished-looking art, set against a new staging defect in that chapter and an action-camera defect I had not filed before. Anchor 7 means functional with conspicuous weaknesses. Round 10 scored this category 7.5 on 5ddfde3. The +0.1 is the net visual gain: PR-0092, PR-0097 and PR-0015 are cleared, against R11-VIS-01 and R11-VIS-02.

### feel (7.9)

Deep review round 11, LIVE build main 76f587c3, bundle index-81kxOXnv.js, artifact b1924762 (894 files). I judged only the capture owner's evidence in critic/rounds/round-11/evidence (PYREFLY_BROWSER=gpu, headless Chromium, real keyboard, no black-canvas fallback). I opened no browser. I built contact sheets of 16 timed sequences, with frames every 180 to 390 ms and timestamps from index.jsonl. They are in critic/rounds/round-11/feel-narr/*.jpg (the script is sheet.py). I also read the pacing data in the 16 run.json files.



FOR:

(1) Action and reaction read well. Ch8 seq-party-action: Rikku's 161 lands at 36 ms. Evrae's counter of 1283 lands at 1.21 s, and Tidus is visibly down by 1.45 s. Ch2 Reflect: Yuna's cast pose runs from 0.4 to 1.5 s, then the next actor's cut-in. Ch6 spherechange: the light pillar is up at 62 ms, and Rikku stands as a White Mage by about 0.86 s, with a first-time coach card. Ch6 action-playing: 190, 196 and 189 land inside about 0.7 s.

(2) The battle-entry card works the same way in both games, with the game's accent colour (gold for ch8, pink for ch4). It holds about 1.3 to 1.8 s, then dissolves in about 0.3 s into the stage, and the boss caption arrives by 2.8 s.

(3) Chain seams (ch5 links 2 and 5, ch6 link 2) push from a wide shot to the party or boss in about 0.8 to 1.2 s and settle. After seam 5, the first menu frames all three girls and Shuyin (the PR-0094 framing looks repaired; that is the visual auditor's call).

(4) Skip and replay respect the player. One Enter hold skipped the pre-battle scene in all 12 runs (preSceneSkippedWithHolds=1), and Esc over a scene opened the pause every time. RETRY reaches prep, and prep reaches the battle in about 2.1 s without replaying the scene (seymour-flux-lose-2000 steps 103.7 s to 105.8 s). Each turn cut-in plays only on a member's first turn (engine/BattlePresenter.ts:65) and Confirm ends it.

(5) Mid-battle beats fire in the real-key battle logs of ch1, 2, 4, 5 and 8 (for example evrae-first-inhale, evrae-out-of-breath, cid-first-volley, evrae-haste-phase).



AGAINST:

(a) PR-0061 (major, STALLED) is re-measured. The play clock at the first menu that accepts input reads 7.0 to 7.2 s in ch3 and ch8, 7.6 s in ch2, 8.2 s in ch4, 8.6 to 8.7 s in ch1, and 9.5 s in ch5 and ch6. That is the same band as round 10, so it is not a regression.

(b) PR-0104 is re-observed in ch6 seq-party-action. After Grenade is confirmed, Paine's cut-in begins at 0.57 s and her menu is up by 1.26 s, and no Grenade impact shows through 2.19 s.

(c) Motion NOT evidenced this round: summon entries, the Mega Flare and Energy Ray Overdrives, Evrae's new fall departure, the NEAR/FAR range change and the chain-seam dialogue have no clips. Input-to-response latency cannot be measured at 180 to 390 ms sampling.

(d) One unexplained 134.5 s gap in ch5 link 1 (turn 42 to 43, 271 s to 405 s) moved Tail HP only 4576 to 4403. The suspected cause is the harness (it failed twice to find Pray just before). It is not scored as a game defect and is listed in capturesNeeded.



The score holds at round 10's 7.9. The seam framing gained, the carried costs are unchanged, and the new chapter's motion is untested.

### narrative (7.7)

SOURCES: src/story/scripts at the reviewed build; git diff 76f587c3..HEAD touches only additive lines in src/story/dsl.ts. I read them against research/writing-bible.md sections 1, 2 and 5.4 and E7, research/ffx-evrae-airship.md sections 9.1 and 12.4 to 12.5, and research/ffx2-leblanc-syndicate.md section 9. Story unit tests on the working tree (evrae-script, story-ffx2-leblanc, story-scripts, story-triggers): 4 files, 154/154 passed (D:/Tools/pyrefly-scratch/deep11/fn-vitest.log).



SEEN ON LIVE: every line of the pre-battle scenes of ch3, ch5, ch6 and ch8 through the new scenewalk (run.json lines plus one screenshot per speaker). The first aftermath line of ch1, 2, 4, 6 and 8, plus ch5's 'Listen to me. She asked me to—'. Victory quips on results: the grim '...Okay. Next one.' for ch1 and ch2 matches section 5.4. Ch4 correctly has no quip and a 'Results' heading. Ch5 shows '...Let's go home.'



FOR:

- Chapter VIII (new, FFX only) hits beats 1 to 11 in order. The thesis (no summoner, no healing) is stated once, by Lulu. Auron's canonical wyrm remark is reworked in register only. Cid's mechanic is delivered as characterisation. The victory is revoked by Bevelle's guns. The climax rule holds ('Hey. Brudda.' ... '...Go get her.'). The wedding is told as Tidus's past-tense narration, as section 2.1 prescribes.

- Ch5 Act 1 matches writing-bible E7 lines 2 to 15 beat for beat, and the Nooj portrait now shows.

- Ch6 keeps the farce straight, stops for beat 14, and gives Leblanc the last word.

- Seymour Flux's Talk, Yunalesca's form beats and Jecht's pre-scene carry the FFX elegiac tone. FFX-2 chapters stay buoyant.



AGAINST:

- PR-0021 (major, carried, STALLED): no banter bank. Ch8 prep and results carry only fixed quips.

- NEW R11-FN-01: all 47 Chapter VIII lines use no contractions ('That is it? We just won?', 'You are welcome'), against the casual Tidus and Rikku voices of section 1.1 and 1.8. The older FFX scripts use contractions in 24 to 42 percent of lines.

- NEW R11-FN-02: Brother's Al Bhed line prints as English, then Rikku 'translates' it.

- NEW R11-FN-03: the Farplane voices (Braska, Auron) are staged as present speakers.

- Carried: PR-0133 (the ch5 aftermath is a bare backdrop), PR-0102 ('*better*', src/story/scripts/ffx2-leblanc.ts:260), PR-0134 (the ch6 card's BOSS row), PR-0147 (one room for all three acts; seq-seam-2), PR-0103 and PR-0037.



NOT REACHED: the ch3 aftermath (Yu Yevon ending, PR-0082); the ch6 and ch5 seam scenes and every aftermath past its first line were not read on screen. The ch6 seam and aftermath text is reused from round 09 (text unchanged; only the speaker id changed).

### audio (UNVERIFIED)

NO SCORE. No agent can hear, and I listened to nothing: every result below comes from reading data (ffmpeg, qa.mjs, themes-audit, vitest, the capture owner's audioDebug samples and network logs). The listening half has no numeric owner verdict for this mix. docs/audio/OWNER-VERDICT.md holds 'Right direction, keep refining' (2026-09-19, explicitly not a number) plus three 'accepted on recommendation, not by ear' entries (Evrae D-039, Macalania D-048, Yojimbo D-063). targets.json tile 'Score and sound effects' approves a direction only ('No score out of 10 is on record'). NOW.md line 15 records Bailey on the audio score, 2026-09-22: '3. I'm at work so can't grade that yet', and NOW.md line 45 records his latest ear verdict on these same cues as negative ('music is too reminsicent of snes music ...'). So the category stays UNVERIFIED (RUBRIC section 6, CHK-B1). This is the fourth deep round in a row without a number.



TECHNICAL AND ROUTING HALF, build main 76f587c3, bundle 81kxOXnv, artifact b1924762.

(1) Bytes. I fetched all 24 music MP3s, the SFX sprite, audio/manifest.json and the 52 audio/candidates files from the live URL with curl, not a browser. All 78 sha256 hashes match critic/artifacts/76f587c3.json. The live site now serves bcbdb483 (D_Y69PMP, deployed 17:52Z today), but its audio/ entries are identical to 76f587c3's: 0 differences. All music came back 200 audio/mp3, and the manifest is decodeChecked with problems [].

(2) The 21 cues that shipped before are byte-identical to round 10 (5ddfde3) and to release 08. Contrary to the 'audio re-renders' headline, nothing was re-rendered. Three new cues were added: scene-fahrenheit and boss-evrae (Chapter VIII, FFX only), and boss-seymour-macalania (Chapter VII, locked, so unreachable).

(3) qa.mjs from 76f587c3, run on the live bytes: 24 cues at -15.97 to -16.20 LUFS integrated and -1.06 to -2.86 dBTP, 0 clipped samples, every loop seam ok. The SFX sprite has 134 cues, peak -1.13 dBTP. Findings 0. With the 52 publicly served candidates in place, --strict exits 1 on 52 orphans (PR-0100).

(4) An independent ffmpeg ebur128 run agrees: I -16.1 to -15.8 LUFS, TP -1.1 to -2.9 dBFS.

(5) themes-audit: 3 of 24 cues depart from the bible. They are the same three as before (PR-0039), and the three new cues pass.

(6) vitest, 19 audio test files at 76f587c3: 434/434 pass.

(7) Routing, from 66 audioDebug samples in 12 real-input GPU runs. Every sample has the prerendered manifest (24 cues) with the sprite decoded. The playing cue's source field is readable in 11 samples and says 'prerendered' in all 11; the harness cuts the string at 4000 chars, which hides it in 35 more. Every cue sampled as playing had its MP3 requested with 0 not-found and 0 console errors. Every pre-scene holds its authored cue: scene-fahrenheit, scene-zanarkand-dome, scene-dreams-end, scene-bevelle-underground and scene-farplane, with chapter 1's authored opening silence. Every battle's first menu holds the right boss cue at gain 1, including boss-evrae in the new chapter. Seams hold gain 1 in chapter 6 (2 and 3) and chapter 5 (2 to 4). Victory results are at gain 1 for chapters 1, 2 and 8 (victory-ffx) and 5 and 6 (victory-ffx2). Chapter 4 is silent by design. Defeat results are silent: no defeat cue exists in the cue map. FFX chapters request only FFX and shared cues, FFX-2 chapters only FFX-2 and shared cues.

(8) Weak points: chapter 6 still borrows chapter 4's cues (PR-0099, major); the whole score is still the sound Bailey called SNES-like (PR-0148, major); the chain-cue versus scene-cue false starts in chapters 5 and 3 (PR-0129); 52 audition files are publicly served (PR-0100); 3 cues are off the bible (PR-0039).

(9) Not reached on live this round: boss-yu-yevon and ending-ffx (chapter 3 was lost twice). The fanfare cut after results in chapters 1, 2 and 8 was not sampled; only its unit test was run (flow-post-music.test.ts passes).



The category's gain for this round is judged on routing correctness and owner-verdict progress. Neither moved: the new chapter's routing is correct, and the carried issues are unchanged.



Evidence: D:/Final Fantasy/critic/rounds/round-11/audio/{live-audio-check.txt, qa-live.txt, qa-live.json, qa-live-with-candidates.txt, ffmpeg-ebur128-live.txt, loop-seams-live.txt, themes-audit-76f587c3.txt, vitest-audio-76f587c3.txt, slots-live.txt}; D:/Final Fantasy/critic/rounds/round-11/evidence/*/run.json (audio[]) and */network-media.json.

### interface (7)

Round 11 deep review, live build main 76f587c3 / bundle 81kxOXnv (artifact b1924762...), capture owner's GPU Playwright evidence (PYREFLY_BROWSER=gpu, no fallback), real keyboard and mouse, at 1600x900, 2000x1012 and 390x844; seed 1 on fresh profiles. Repaired since round 10 (5ddfde3), seen in this evidence: PR-0122 (intent no longer drawn over the pause: ffx2-leblanc-win/14-pause-Esc.png, ffx2-leblanc-lose-2000/15-options-active.png), PR-0142 (Enter after a PAUSE-chip click reaches the menu: pause-matrix/*.json), PR-0012 (FFX-2 help band at 1600, 2000 and 390), PR-0011 (Lance of Atrophy names ZOMBIE 50%, the Ward-adjusted rate), PR-0013 and PR-0132 (Dr. Goon, Right/Left Bulwark), PR-0018 (selected rows now read clearly by eye, not measured), PR-0118 (no dialogue card over a pause opened during a scene, ch1/4/6/8), PR-0111, PR-0006 (the advisor varies: 10 to 29 distinct picks per chapter), PR-0041 (FFX-2 items reachable). Still open or new majors: FFX intent names one damage target for a random-target move and got it wrong in 2 of 3 samples, including a hidden lethal hit (R11-UI-01); the advisor told Tidus to cast Slow on an already-Slowed Yu Pagoda 43 of 44 times in each Braska's Final Aeon attempt (R11-UI-02); Chapter II's pause CHAPTER tab covered by a blown-up Auron snapshot (R11-UI-03, repaired later in bcbdb483); PR-0123 intent headline contradicts its own odds; PR-0126 advisor drops the 'in <menu>' chip (all 19 phone cards in ch4, several desktop cards); PR-0001 phone battle HUD illegible; FOC-06 advisor chips at 12.2 effective px on desktop and an orphan chip on the phone; PR-0127 prep captions clipped at 1600 in ch6. Desktop targeting, pause member tabs, prep and results are polished. Provisional: 1280x720, 4:3, 21:9, 1440p and 4K shapes, gamepad and touch were not captured (see capturesNeeded).



CHIEF ADJUSTMENT 7.2 -> 7.0: two confirmed interface majors reached the chief after the auditor scored: PR-0143 narrowed (FFX-2 battle messages never drawn, so Steal and Pilfer Gil say nothing; traced by the gap pass) and PR-0156 (FFX HUD shows HP above maximum after a revive plus a heal). Both are readable-value and information defects in this category. R11-UI-00 was refuted as a player path and costs nothing here.

### onboarding (6.6)

The newcomer walkthrough was SIMULATED (a paper cold-start read of the capture sequence title > Auron's briefing > board > prep > pre-scene > first menu, at 1600x900 and 390x844). No real newcomer took part. Gains: the FFX-2 command help band now says what each highlighted row does (1600/2000/390); the FFX-2 first-turn coach line (Rikku, Wait mode) is clear and readable (ffx2-leblanc-win/10-first-menu-coach.png); the options include X-2 BATTLE Wait/Active and ATB SPEED, flipped with real keys (ffx2-leblanc-lose-2000/15-options-active.png); the phone OPTIONS column now scrolls; statuses and elements carry text as well as colour (CRS, PRO, FIRE/ICE labels). Still open: no text-size, key-remap or flash setting, and reduceMotion is honoured only through the OS setting with no in-game row (PR-0032; pause OPTIONS in every capture); the defeat screen says nothing about why the party fell (PR-0033; seymour-flux-win/31-results.png; the 'Defeat screen' target tile is a gap); phone and touch players see keyboard-only hints (PR-0073; ffx2-bahamut-win-look-phone/01-briefing.png, 03-card.png); the briefing says 'Five fights' while seven chapters are playable (PR-0116, a question for Bailey); the FFX first-turn coach mark sits under the turn cut-in slab (seymour-flux-win/10-first-menu-coach.png; cross-reference PR-0005); the phone battle is unusable (cross-reference PR-0001, scored under interface). Gamepad, touch and a real phone were not tested.

### prep (8.4)

Prep/delivery auditor, round 11 deep review, subject main 76f587c3 / bundle 81kxOXnv / artifact b1924762. No browser opened. I worked from the capture owner's evidence at critic/rounds/round-11/evidence/: Playwright headless Chromium with PYREFLY_BROWSER=gpu, real keyboard input, fresh profiles, seed 1 on every first attempt. FOR: (1) Party prep was entered, tabbed with ArrowRight and left with Esc back to chapter select (prepEsc='chapter-select') in all 12 route runs, in all 7 playable chapters. It carries sourced objectives and a tip per chapter: Evrae has 'Survive Poison Breath / Cure a petrified ally / Defeat Evrae' plus the Pull back tip (evrae-airship-win/run.json prepText). FFX prep has SPHERE GRID/EQUIPMENT/OVERDRIVE tabs, and FFX-2 prep has DRESSPHERES/ACCESSORIES tabs, each in its own game. (2) The rewards match research and the engine's actual outcome. Evrae victory: AP 5,400, Gil 2,600, Blk Magic Sphere, which is research/ffx-evrae-airship.md §1.4 and lines 63-65 exactly (evrae-airship-win/31-results.png). AP went to the 5 characters who acted (Tidus 22 commands, Wakka 22, Rikku 8, Lulu 6, Kimahri 8, from the picks); Auron never entered and got none. In the Seymour Flux win, Kimahri was KO'd by Full-Life at seq 10-11 and never revived (a2-battle-log.json), and the results correctly give him +0 AP while Tidus and Yuna get 10,000. The Leblanc spoils are 900 EXP / 6 AP / 780 gil plus Reassembled Sphere, Charm Bangle and Twist Headband (= research §6.3). The Vegnagun final-battle row 0/20/0 with no drop matches research line 435. (3) Retry is fast and honest. Defeat card, then RETRY, then prep, then battle took 4.8-7.0 s by the harness clock, including its fixed 3 s wait (ch1 5.2 s, ch3 4.9 and 4.8 s, ch6 5.8 s). The pre-battle scene is not replayed (BattleScreenFlow.ts:333), a retry reseeds (:340), and the Defeat card shows TURNS, ATTEMPTS, BEST and 'NEVER CLEARED' (seymour-flux-win/31-results.png). (4) Progress is reliable. After real-key wins in ch1, ch2, ch4, ch5, ch6 and ch8, boardAfterReload.cleared keeps the clear, and NEW BEST shows on every first clear. AGAINST: PR-0109 is re-observed in all 12 runs: cardAfterBack and every boardAfter/boardAfterReload select Chapter I. This is the third review with it open, so STALLED. PR-0138 is re-observed on the live chapter 5 win ('EXP 0 x3 PARTY AP 20 PER DRESSPHERE GIL 0' after a 33:41 five-link route). PR-0082: chapter 3's victory results are still unread. New R11-PD-03 (polish, FFX only): Rikku's Evrae preset is S.Lv 53, against 40 at Macalania before it and 42 at Gagazet after it. Prep has no build-changing choices: the party, equipment and items are fixed presets. RUBRIC §2 treats a preset as a justified authored approximation, so there is no deduction. The phone prep card fix (PR-0127, commit 56122e30) is not in this build and is scored in interface. The score holds at round 10's 8.4. The rewards audit is stronger this round (Evrae fully sourced, PR-0138's numbers confirmed on live), but the stalled cursor defect and the new preset inconsistency offset it.

### delivery (7.9)

Prep/delivery auditor, subject LIVE 76f587c3 / 81kxOXnv / artifact b1924762cdc2ab44... FOR: (1) CHK-017: exact artifact on this build. critic/reviews/76f587c3-live.json recorded verify-live PASS (64 files, changed-from d9decadb, 0 mismatched/missing/wrongType/errors), and the capture owner's copy of the live artifact-manifest.json (evidence/logs/live-artifact-manifest.json, fetched 16:28Z) has artifactHash b1924762, equal to critic/artifacts/76f587c3.json (894 files). (2) CHK-019: the deploy decode-checked every shipped file, with decodeChecked true, problems [] and audioUnverified 0. (3) CHK-018: git grep at 76f587c3 finds no shipped path on a .N.png or .raw.png variant (only a doc comment in titleMarkup.ts:11). All 37 art path literals in src resolve in the shipped manifest, and all 25 files in public/audio/manifest.json ship. (4) Console and network over 17 runs and about 3.2 h of real-key play: 0 console errors, 0 responses with status >= 400 (the harness listens to every response, cap/lib.mjs:29-34), and 0 media served as text/html. Round 10's transient 503 did not recur. (5) Complete flows: real-key wins through the post scene, results, CONFIRM, epilogue, chapter select and a reload in ch1, ch2, ch4, ch5, ch6 and the new ch8. Loss, RETRY, prep and battle in ch1 (twice), ch3 (twice) and ch6 (under ACTIVE). (6) The save code is byte-identical between 76f587c3 and HEAD. I ran save-two-tabs, save-ffx2-atb-migration, save-coach-migration and save-data-best-time-migration: 30/30 pass (vitest). AGAINST: Chapter 3 still has no win (PR-0082), and the ch2, ch4, ch5 and ch8 losses were not run on this build, so CHK-022 is UNVERIFIED for 5 of 7 chapters. CHK-024: persistence changed after the last full matrix (saveMerge.ts, c784e553, the fix for the major CHK-024-LIVE-1 settings-revert defect). The only live check on this build reloaded an unchanged save and exercised a runtime-only mute flag, so a changed saved setting surviving a reload has never been shown on the player path: UNVERIFIED. Load time and frame time were not measured on this build. The presenter, asset loader and audio routing all changed since round 09's measurement, so PR-0084's 10.1 s card-to-first-menu cannot be reused: UNVERIFIED. Only headless Chromium ran; Firefox, Edge, Safari, a real phone, touch and a controller are UNVERIFIED. New R11-PD-01: the chapter-select party slots show a grey placeholder in 5 of 13 board captures at 1600x900, each slot fetching a 1.1-1.4 MB portrait PNG. New R11-PD-02: 239 unreferenced art variant files (126 MB) ship and are never requested, plus the audio candidates of PR-0100 (now 52 files, 34.2 MB), which audio scores. Together about 34 percent of the 467 MB artifact is dead payload. New R11-PD-04 (evidence): live was replaced by bcbdb483 at 17:52Z mid-capture and the harness hard-codes its build label, so the runs started after that (BFA x2, the scenewalks, the pause matrix) have no established build identity. My own verify-live today: live = bcbdb483 PASS; against 76f587c3 FAIL (index.html mismatch, index-81kxOXnv.js 404). Score 7.9 (round 10: 8.0, STALLED). Clean network and media, and a new chapter delivered clean, are offset by an unverified save matrix after a save change, no performance numbers for this build, and two new payload/loading findings.

## Target gate

Required 54, matched 33, failing 9, unverified 12, waiting on a decision 9. Rule: required = matched + failing + unverified; waiting counted separately. Excluded: rejected tiles, audio and key-art tiles, locked Chapter VII, unregistered Chapters IX-XI, the living portrait (not in the build). Detail per tile: critic/rounds/round-11/targets/tiles.json.

Failing tiles: presentation/Battle HUD, FFX (PR-0002); presentation/Turn cut-in (PR-0005); presentation/Battle HUD, FFX-2 (PR-0035); fight/Targeting s2 (PR-0031); fight/PR-0002 sheet (D-041 A not built); fight/PR-0005-ffx sheet (D-042 B not built); cast/Yuna (PR-0022); chapters/Leblanc Syndicate (PR-0096); chapters/Vegnagun's parts (PR-0095).

Protected art: 126 of 126 in-scope approved files byte-identical in the live manifest (critic/rounds/round-11/targets/hashcheck-live.json); 7 absent files belong to locked Chapter VII and unregistered Chapter IX.

Later builds (not counted): On later builds (not counted here) the gap pass saw 9 of the 12 unverified tiles match: Targeting s1 (with minor distance, PR-0178), Onboarding C2, the three pause hero-plate tiles, Shiva, the Shuyin / Young Auron / Fayth portraits, and the Evrae order widget. Swordplay Overdrive and Targeting s3 stay unverified.

## Encounters (real input, capture owner)

| Chapter | Completed real flow | Outcome | Note |
|---|---|---|---|
| seymour-flux | yes | defeat then victory | 1600x900: fresh profile, title > Auron's briefing > board > prep (Esc back and re-enter) > pre-scene (Esc pause, Enter, hold-skip) > fight lost (seed 1, 64 turns) > Defeat results > RETRY > prep > fight won (35 turns) > aftermath scene > results > board > reload keeps the clear. 2000x1012 loss run (Defend only) reached Defeat and RETRY into a new fight. Summons and Overdrives (Mega Flare, Energy Ray) played. Evidence: seymour-flux-win/, seymour-flux-lose-2000/. |
| yunalesca | yes | victory | 2000x1012, one continuous real-key route, 147 commands, both Metamorphosis form changes (form-change events 543 and 979), aftermath, results, board, reload. No loss run for this chapter; the FFX loss path is covered by chapter 1. Evidence: yunalesca-win-2000/. |
| braskas-final-aeon | NO | defeat (twice) | Two full real-key attempts following the advisor: 25.2 min / 326 commands and 22.2 min / 251 commands. Both lost, then RETRY reached a new fight. Attempt 2 carried out 17 Doublecast: Firaga through Special > Doublecast > Firaga, and each one hit the boss twice (1723 and 1575), so PR-0125 looks repaired. At the loss the BFA was in form 2 at 75,510/120,000 and all five aeons were KO'd. The aftermath scene and the victory results were never reached, so PR-0082 is still open. Evidence: braskas-final-aeon-win/, braskas-final-aeon-win-r2/, braskas-final-aeon-scenewalk/. LATER BUILD: Won with real keys on a999d133 (20.7 min, 213 commands, links 1-7, results, post scene, Yu Yevon ending), with the harness choosing the unslowed Pagoda; not this build. |
| ffx2-bahamut | yes | victory | 2000x1012, WAIT mode (the default by D-029, which superseded Active-only D-009). A spherechange was made with real keys (Rikku Dark Knight > Black Mage, seq-spherechange/). 57 commands, then aftermath, results, board and reload. A 390x844 look run was also captured (ffx2-bahamut-win-look-phone/). |
| ffx2-vegnagun-shuyin | yes | victory | 1600x900, first attempt, 34.6 min, 206 commands, all 4 chain seams (links 2-5) captured as frame sequences plus the first menu after each seam. 26 part-destroyed events. Aftermath, results, board and reload all reached. The pre-scene walk (scenewalk) confirms the Nooj speaker portrait is now shown. |
| ffx2-leblanc | yes | victory; separate defeat and retry | Win at 1600x900: spherechange (Thief > White Mage), seams into links 2 and 3, 97 commands, then aftermath, results, board and reload. Loss at 2000x1012: X-2 BATTLE flipped to ACTIVE in pause OPTIONS with real keys, then idled to Defeat; RETRY went to prep and a new fight. The music is still the chapter 4/5 cues (PR-0099). |
| evrae-airship | yes | victory | New chapter VIII. 1600x900, seed 1: board > prep > pre-scene > fight, 66 commands in 4:21 of game time, including Pull back orders, Cid's Guided Missiles, and the Water Shot and Spiral Cut Overdrives. Then a short victory beat, results, the post scene (Wakka: 'It just... dropped.'), the board, and a reload that keeps the clear. There was no loss run for this chapter. A 390x844 look run was also captured. |

Chapter VII (seymour-anima-macalania) is locked and out of scope: real-key board navigation never lands on its COMING card (PR-0165).

## Checks

| Check | Result | Mandatory | By | Build | State | Reason |
|---|---|---|---|---|---|---|
| CHK-015 | FAIL | yes | capture owner | 76f587c3 |  | Esc, P, H, N, E, G, target cancel and the PAUSE chip (mouse) all behaved correctly in 12 routes and 2 pause matrices. Two gaps remain. P opens the pause but never closes it (pCloses=false in every route; Esc does close it). P over a pre-battle cutscene does nothing, while Esc opens the pause there (pause-matrix/*.json step 'P over pre-battle cutscene' => screen=cutscene). Repairs confirmed: PR-014 |
| CHK-016 | PASS | yes | capture owner | 76f587c3 |  | Every capture passed a state assertion first: screen name, awaitingMenu, and the assertNoStaleRoots root list. The index holds 427 items with 0 stale-root problems and 0 failed waits (fails [] in every run.json), and no capture shows the wrong screen. Supplementary scene walks assert screen=cutscene and the speaker before each capture. No debug hook was used to change state: window.__pyrefly was o |
| CHK-022 | FAIL | yes | capture owner | 76f587c3 |  | 6 of the 7 playable chapters (1, 2, 4, 5, 6, 8) ran one continuous legal real-key route from the title through the board, prep and pre-scene (skip, cancel and back exercised) to a win, then the aftermath, results, board, and a reload that keeps the clear. Each game was also lost at least once and retried through RETRY > prep > a new fight: chapters 1 and 3 for FFX, chapter 6 in ACTIVE mode for FFX |
| CHK-017 | PASS | yes | capture owner | 76f587c3 |  | Served index = assets/index-81kxOXnv.js. The live artifact-manifest.json (artifactHash b1924762cdc2ab44..., 894 files, 489,437,558 bytes, decodeChecked, problems []) equals critic/artifacts/76f587c3.json. All media requests in all runs returned status <400: 0 404s, 0 html-typed media, 223 distinct art/audio URLs. A byte-for-byte re-hash of every file was not repeated here. |
| CHK-021 | PASS | yes | combat-encounter | 76f587c3 | every combat/data change 5ddfde3..76f587c3 | Each change states its case and is present only where it belongs. FFX only: c01742b9 Doublecast (src/battle/ffx/doublecast.ts; live in ch3 only) and the 0ca82930..9980f41f sphere rows, whose commit body says 'FFX only'. FFX-2 only: a752322b Steal/Pilfer (src/battle/ffx2/steal.ts, which imports nothing from ffx/steal.ts), 3648ba68 Grenade, 8b2ff513 seam clamp, 697c0380 / 5a5099bd / 10750586 Vegnagu |
| CHK-023 | PASS | yes | combat-encounter | 76f587c3 | ch3 BFA, Lulu Doublecast via Special > Doublecast > Firaga, live 76f587c3 | 17 of 17 Doublecast actions carried wrappedId Firaga and aimed at braskas-final-aeon. Each made 2 damage events on the boss (1,460-4,031) and paid MP 1 x2 (One MP Cost, sourced in dreams-end §4.4). No Lulu self-hit. PR-0125 repaired. |
| CHK-023 | PASS | yes | combat-encounter | 76f587c3 | FFX-2 chain seams: ch6 links 2-3 after a Thief > White Mage spherechange; ch5 links 2-5 after a Dark Knight > Black Mage spherechange | No party HP or MP above its maximum in 1,168 HUD rows. Rikku reads WM 113/123 and then TH 106/106 at the Act II seam. The MP half of PR-0124 is repaired on live. |
| CHK-023 | UNVERIFIED | yes | combat-encounter | 76f587c3 | ch6 FFX-2 Steal / Pilfer Gil / stolen Grenade throw | No live run used Steal, Pilfer Gil or a Grenade (Rikku changed out of Thief in the win run). Engine: the round-10 probe re-run on 76f587c3 steals a Budget Grenade on 5/5 seeds; ffx2-steal and ffx2-grenade pass. A runtime capture is needed. |
| CHK-023 | PASS | yes | combat-encounter | 76f587c3 | ch8 Evrae, seed 1, real keys: range orders, missiles, breath whiff, Haste phase | Inhale, then Tidus Pull back, then 'Out of Breath Range'. 3 volleys of 12 hits at 187-211 each, then 'Cid is out of missiles'. Threshold Haste plus Swooping Scythe counter at about 10,6xx HP. Haste recast after Slow. Photon Spray: 8 random-target hits at 82-106. All match ffx-evrae-airship §2.2, §4.4, §5.4, §5.5 and §7.2. |
| CHK-023 | PASS | yes | combat-encounter | 76f587c3 | FFX Overdrive input windows and trigger commands, ch1/ch2/ch8 | A minigame-request is followed by a resolved Overdrive (Mega Flare, Energy Ray, Shooting Star, Grand Summon, Diamond Dust, Thor's Hammer, Hellfire, Spiral Cut, Mighty Guard). Kimahri's Talk fired in ch1. |
| CHK-023 | UNVERIFIED | yes | combat-encounter | 76f587c3 | ch3 Tidus 'Talk' trigger on Braska's Final Aeon | Talk was never offered or used in 577 turns over two attempts. The cause is the PR-0082 cascade (Tidus pinned to Slow). The engine path is covered by unit tests only. |
| CHK-009 | FAIL | yes | combat-encounter | 76f587c3 | ch3 advisor card while Yu Pagoda A is Slowed and B is not | The card names 'Yu Pagoda' (turn-log want.target) while the target cursor letters them A/B. advisor.ts:1070 uses target.name without the letterTag from turnQueue.ts:268-292. Filed once as PR-0082 (cause). |
| CHK-022 | FAIL | yes | combat-encounter | 76f587c3 | encounter-facing half: each included chapter reaches its outcome by real input | ch1 (defeat, retry, victory), ch2, ch4, ch5, ch6 and ch8 reached victory with real keys. ch3 lost twice and never reached the aftermath (PR-0082). The cause is established in this report. |
| CHK-005 | PASS | yes | combat-encounter | 76f587c3 | advisor top-row driver on engine boards, ch1/ch2/ch3/ch8, 40 seeds each | With engine target ids, the advisor's first suggestion wins Evrae 40/40, Yunalesca 38/40 and BFA 39/40, and matches the intended line on ch1 (27/40 against 26/40). No declines. This is the scorer on real boards; the presentation naming defect is separate (CHK-009). |
| CHK-008 | FAIL | yes | visual-targets | 76f587c3 | all 7 playable chapters (1-6, 8): first menu, target selection, party action and enemy action sequences, pause; 1600x900, 2000x1012, 390x844 | Panels intersect painted actors' faces and weapons. (1) Ch1 and ch3: the FFX enemy info card and the party panel cover the acting party member during their own action. Ch1 seq-party-action f01-f07 and seq-action-playing f00-f03 show Tidus's face under the Seymour Flux card (R11-VIS-02). (2) The FFX command stack covers Yuna in ch1 and ch3 (PR-0002) and Tidus in ch8 (R11-VIS-01). (3) At ch5 link 3  |
| CHK-011 | FAIL | yes | visual-targets | 76f587c3 | default framings and action frames, chapters 1-6 and 8 | Every targetable enemy is identifiable in the default framing: the ch3 Final Aeon plus Yu Pagodas A and B, all three ch6 links including both goons, the ch5 parts (still as cones) and Evrae. The rule that also covers party members fails. In ch8, Tidus is under the command stack and Wakka is cut by the left edge on the first menu, and both are off-frame in the transition f09, target and party-actio |
| CHK-012 | FAIL | yes | visual-targets | 76f587c3 | chapter card, prep, HUD chips, turn list, dialogue speakers, pause, results; all runs | Every chip in battle, prep, results and dialogue shows its painted portrait, including the eight ch8 speakers, Nooj, Brother-x2, Logos, Ormi, Leblanc and Jecht. Gippal (ch5) and Brother's FFX line use the text card on purpose. Cold-launch fallbacks persist (PR-0065). On the fresh 1600x900 profile the ch8 chapter card shows grey silhouettes for Wakka and Rikku; the phone run shows all three faces.  |
| CHK-013 | FAIL | yes | visual-targets | 76f587c3 | approved art rendered in battle, dialogue and pause at 1600x900, 2000x1012 and 390x844 | Protection holds: 126 of 126 in-scope approved files are byte-identical (targets/hashcheck-live.json). The failure is in how some approved art renders or is staged. Leblanc's idle holds the fan shut, while Bailey's pick B is the fan open (PR-0096). Vegnagun's Nodes, Bulwarks and Redoubts are still cones (PR-0095). Bahamut shows white matte holes (PR-0137). Yunalesca's approved attack painting has  |
| CHK-014 | FAIL | yes | visual-targets | 76f587c3 | all chapters, battle stage | Facing passes. The FFX party faces right toward the enemies, and the ch6 Syndicate, Shuyin and Evrae face left toward the party. FFX-2 party idles are the approved frontal paintings. The wider class of this check fails. In the ch1 Overdrive camera, KO'd Yuna floats sideways in the foreground as a rotated billboard, consistent with PR-0022 (medium confidence, one frame). Fem-Goon's shadow sits slig |
| CHK-016 | FAIL | yes | visual-targets | 76f587c3 | capture owner's evidence index, round 11 | Two problems, both with the harness, not the product. (1) Identity: docs/deploys.log records bcbdb483 going live at 17:52:00Z. The harness (cap/lib.mjs BASE) reloads the live URL, and route.mjs hard-codes 'bundle 81kxOXnv (main 76f587c3)'. Runs started after that point (braskas-final-aeon-win 18:09Z, the four scene walks 18:35Z, pause-matrix 18:39Z, braskas-final-aeon-win-r2 18:39Z, the ch5 final  |
| CHK-022 | PASS | yes | feel-narrative | 76f587c3 | seymour-flux: win, loss, retry, aftermath, results, board, reload | FFX ch1. Loss (seed 1) led to RETRY, prep and a new fight; the win (35 turns) led to the aftermath ('You can't send what…'), Victory results, board and a reload that keeps the clear. Scene skip and Esc were exercised. |
| CHK-022 | UNVERIFIED | yes | feel-narrative | 76f587c3 | yunalesca: win path complete, loss path not run | Win PASS: 147 commands, both Metamorphosis changes, aftermath ('There. Now no one can summon it.'), results, board, reload. The chapter's loss and retry path was not run this round, and CHK-022's scope is win and loss per chapter. |
| CHK-022 | UNVERIFIED | yes | feel-narrative | 76f587c3 | braskas-final-aeon: loss and retry reached; win, aftermath and victory results never reached | Two real-key attempts (25.2 and 22.2 min) both lost. The chapter's emotional payoff (E3/E4 post-battle, Yu Yevon) is unproven reachable by legal input. This is PR-0082, carried under category process. Not called FAIL because no product defect blocking the win is established. |
| CHK-022 | UNVERIFIED | yes | feel-narrative | 76f587c3 | ffx2-bahamut: win path complete, loss path not run | Win PASS: 58 turns, then the suppressed-victory 'Results' and the aftermath ('...Yunie.'), board and reload. No loss and retry run this round. |
| CHK-022 | UNVERIFIED | yes | feel-narrative | 76f587c3 | ffx2-vegnagun-shuyin: win path complete through 4 seams; loss/timer path and seam scenes not captured | Win PASS: 206 commands, 4 seams, aftermath, results, board, reload. Two things were not captured. The Head-timer bad ending and the wipe loss path were not run. The inter-battle scenes (writing-bible E7 Acts 2 to 4) happen before the harness detects the link change, so no frame or text of them exists. |
| CHK-022 | PASS | yes | feel-narrative | 76f587c3 | ffx2-leblanc: win with two seams, then aftermath, results, board, reload; separate Active-mode defeat and retry | Both destinations were reached with real keys. Seam-scene reading is not part of this pass; see CHK-023. |
| CHK-022 | UNVERIFIED | yes | feel-narrative | 76f587c3 | evrae-airship (new ch8): win path complete; loss and retry not run by the critic capture | Win PASS: 66 commands, 4:21, results, aftermath ('It just... dropped.'), board, reload. The builder's own loss evidence (commit 7119762f) is not critic evidence, and the 390x844 look run ended undecided. |
| CHK-015 | PASS | yes | feel-narrative | 76f587c3 | all chapters: scene hold-skip, Esc over a pre-battle scene, RETRY | Feel-side skip and replay only: one Enter hold skips, Esc opens the pause (screen=pause asserted), and RETRY reaches prep and then the battle in about 2.1 s. The pause-matrix keys are the interface auditor's. |
| CHK-023 | PASS | yes | feel-narrative | 76f587c3 | mid-battle story beats fired through the real presenter path in real-key runs | The script-trigger events are present in the engine logs of real-key play. The battle log keeps only the final link, so the ch6 seam triggers (act-one-cleared, act-two-cleared) and ch5's links 1 to 4 are not proven this way. That gap is listed in capturesNeeded. |
| CHK-007 | FAIL | yes | feel-narrative | 76f587c3 | player-facing copy: ch8 strategy guide, ch6 aftermath | A template inserts the actor name into 'the {actor}'s ship'. The markdown asterisks (PR-0102) are still in the source line; they were traced, not captured on screen this round. |
| CHK-021 | PASS | yes | feel-narrative | 76f587c3 | narrative game split: FFX Brother vs FFX-2 brother-x2; Evrae script FFX-only | The FFX-2 portrait no longer lands on FFX Evrae lines. The battle-entry card and turn cut-in are recorded as 'both' with a per-game accent, and they are seen that way in ch4 and ch8. |
| CHK-016 | PASS | yes | feel-narrative | 76f587c3 | integrity of the sequences and stills used for feel and narrative | Every sequence asserts screen=battle and every still asserts its screen. Three scenewalk entries with no speaker are harness boundary samples, not game lines. |
| CHK-B2 | UNVERIFIED |  | feel-narrative | 76f587c3 | human feel judgment of ch8 and the pacing changes | No play session by Bailey is recorded for 76f587c3. Agents measure timing, not feel. |
| CHK-001 | FAIL | yes | audio | 76f587c3 | audio technical and routing half, all 7 reachable chapters: pre-scene, first menu, seams, after-fight, results; game both | Technical and routing half only; the listening half is CHK-B1. PASS parts: all 78 live audio files hash-match the 76f587c3 manifest and decode. qa.mjs measures the 24 cues at -15.97 to -16.20 LUFS and -1.06 to -2.86 dBTP, with 0 clipped samples and every seam ok, and an independent ffmpeg ebur128 run agrees. 66/66 audioDebug samples show the prerendered manifest with the sprite decoded, and 11/11  |
| CHK-B1 | UNVERIFIED | yes | audio | 76f587c3 | the whole shipped score plus the two new Chapter VIII cues; game both | No agent can hear. There is no numeric owner verdict for this mix. The Evrae cues were 'accepted on the driver's recommendation, not judged by ear' (OWNER-VERDICT.md 2026-09-23, D-039). Bailey's latest by-ear words on the shipped sound are negative ('too reminsicent of snes music', NOW.md line 45), and his answer on the score was 'I'm at work so can't grade that yet' (NOW.md line 15). Approving a  |
| CHK-023 | FAIL | yes | audio | 76f587c3 | AUDIO PORTION ONLY: music selection and crossfade driven by real input; ffx ch3 chain links; ffx2 ch5 link 5 | Invocation is proven: real input drives every cue change sampled, and the cue is at gain 1 at every first menu and seam. It does NOT survive the next seconds at two chain entrances, because two owners set the music. Chapter 5, live 76f587c3: boss-shuyin plays at gain 1 at 1791.1 s and 1792.6 s. At 1794.1 s the music is null with no fading slot, right as Shuyin takes his first damage (turn 189, 238 |
| CHK-019 | PASS | yes | audio | 76f587c3 | AUDIO PORTION: every shipped audio file (24 music, SFX sprite, manifest, 52 candidates) | All 78 audio files fetched from live hash-match critic/artifacts/76f587c3.json. The manifest is decodeChecked with audioUnverified 0 and problems []. qa.mjs decodes all 24 cues and the sprite with nothing silent and no clipped samples. The run logs show 0 not-found and 0 html-typed media. |
| CHK-017 | PASS | yes | audio | 76f587c3 | AUDIO PORTION of the exact artifact | The audio bytes are exactly 76f587c3's: 78/78 sha256 match. Caveat for the orchestrator: the live URL now serves bcbdb483 (index-D_Y69PMP.js, artifact 7265cb2b, deploys.log 2026-09-24T17:52:00Z). Its audio/ set is identical to 76f587c3's, so the audio result holds for 76f587c3. The full-artifact check belongs to the delivery auditor. |
| CHK-021 | PASS | yes | audio | 76f587c3 | AUDIO PORTION: cue presence and absence per game | FFX chapters 1, 2, 3 and 8 request only FFX cues plus the shared title, chapter-select, pause and sprite. FFX-2 chapters 4, 5 and 6 request only FFX-2 cues plus the shared ones. Chapter 4's victory silence is FFX-2 only, by design (encounters.ts FFX2_BAHAMUT has no victory entry). The new Evrae cues are FFX only (D-039). |
| CHK-016 | PASS | yes | audio | 76f587c3 | AUDIO evidence validity | The audio samples are state reads taken on labelled screens, so they are valid for audio. Caveat, not a product defect: route.mjs:23 writes the build label as a hard-coded string, and the harness never asserts the bundle. Runs that began after bcbdb483 went live at 17:52:00Z most likely loaded bcbdb483: braskas-final-aeon-win at 18:09Z, the four scenewalks at 18:35Z, pause-matrix at 18:39Z and bra |
| CHK-001 | PASS | yes | audio | 76f587c3 | pause cue in and out, both games; title cue under the briefing on a cold start | Reused, not re-measured. This round's network logs show pause.mp3 requested in all 12 routes after the Esc pause, and title.mp3 in all 12, which is consistent with the reused result. |
| CHK-024 | PASS |  | audio | 76f587c3 | saved audio volumes survive reload and a second tab | Reused, not re-measured by me. Every sample this round reads the default volumes (master 0.8, music 0.7, sfx 0.9) on fresh profiles, as expected. |
| CHK-002 | UNVERIFIED | yes | interface-onboarding | 76f587c3 | pause over battle and over a pre-battle scene, ch1/2/4/6/8, 1600x900, 2000x1012, 390x844 | By eye, the pause plate fills the window at the three captured sizes (seymour-flux-win/14-pause-Esc.png, ffx2-leblanc-lose-2000/15-options-active.png, ffx2-bahamut-win-look-phone/14-pause-Esc.png). But there was no measurement: no getBoundingClientRect equal to the viewport, no currentSrc tier, no scrollWidth check. The 1280x720, 2560x1080 and 3840x2160 fresh contexts were not captured, so the che |
| CHK-003 | FAIL | yes | interface-onboarding | 76f587c3 | first command menu, FFX chapters 1/2/3/8, 1600x900 and 2000x1012; phone HUD ch4/ch8 | The measured effective size, with transforms included, of the advisor card's 'Next best move', 'Guide's pick', 'in White Magic' and '30 MP' is 12.2 px, under the 14 px floor, at both 1600x900 and 2000x1012 (run.json focFirst.advisorMinEffPx = 12.2 in seymour-flux, yunalesca, braskas, evrae). At 390x844 the battle HUD rows render at a few px (PR-0001). No sweep of every text node was run, so the ot |
| CHK-004 | FAIL | yes | interface-onboarding | 76f587c3 | every advisor decision on the guided real-key routes, 7 chapters | Ownership holds: every named row was a real, enabled row for the acting character, and the route executed 35 to 326 picks per chapter through the named menus. The 'says where' half fails: the card printed no submenu for Shell, Magic Break and Darkness on every phone decision in ch4 (19/19), for Al Bhed Potion and Slow on the ch8 phone, and on desktop for Pray, Darkness and Mega Phoenix (ch5, turns |
| CHK-005 | FAIL | yes | interface-onboarding | 76f587c3 | Braska's Final Aeon, both real-key attempts, 1600x900 | On a live board the advisor proposed a no-op: Slow on a Yu Pagoda that already had Slow, 43 of 44 times in each attempt. The Pagoda was never KO'd and there was no status-remove, per the engine battle log. Both attempts that followed the advisor were lost. The constructed degenerate-board matrix of CHK-005 was not run this round. |
| CHK-006 | FAIL | yes | interface-onboarding | 76f587c3 | FFX first menu after E; FFX-2 first-turn coach; target cancel; pause over a cutscene | FFX: after E the advisor card folds and its 'N HIDE MOVES' chip floats alone (PR-0130; seymour-flux-win/12-intent-E.png, yunalesca-win-2000/12-intent-E.png). FFX-2: the chip's text still shows through the first-turn coach card (PR-0110 residual). Passing parts: the reticle is gone after Esc from target selection (afterTargetCancel targets 0), and no dialogue card is left over a pause opened during |
| CHK-007 | FAIL | yes | interface-onboarding | 76f587c3 | pause CHAPTER tab over a pre-battle scene; intent counters; strategy guide | The pause SCENE row prints the internal scene key with its dashes replaced by spaces: 'LEBLANC LAST ROOM', 'EVRAE AIRSHIP DECK', 'BEVELLE UN...' (src/app/screens/pause/panels.ts:247, ctx.sceneKey.replace(/-/g,' ')). Literal asterisks '*she*' appear in the Yunalesca intent (PR-0027). 'Haste is ctb x 8/16' leads the ch1 guide (PR-0026). 'Max Hp X2' appears in the ch3 advisor. |
| CHK-008 | FAIL | yes | interface-onboarding | 76f587c3 | FFX first command menu, ch8 and ch1, 1600x900 | Judged by eye: in Evrae the acting Tidus is almost wholly hidden behind the ORDERS-to-ITEMS cascade, with only the sword tip and hair showing, and in ch1 Yuna is hidden behind TALK/ATTACK. This is PR-0002, whose repair is approved but not scheduled; it is scored under visual. No sprite-projection intersection data was captured this round. |
| CHK-009 | FAIL | yes | interface-onboarding | 76f587c3 | prep CHAPTER card ch6 1600x900; phone pause ch4 | The ch6 prep polaroid captions are cut at the card edge at 1600x900 ('the Syndicate's', 'beaten, never', 'loses again, shows'; PR-0127). On the phone pause: 'PROTECTION ...' (garment grid), 'MASTER VOLUM...' and 'BEVELLE UN...'. The CTB list shows 'Seymour Flux' and 'Braska's Final Aeon' in full, wrapped onto two lines, which passes. |
| CHK-010 | UNVERIFIED | yes | interface-onboarding | 76f587c3 | single-target Attack targeting, ch1 and ch3, 1600x900 | The single-target cue reads well at 1600x900: brackets, a name plate with its letter tag (Yu Pagoda A), the pointing hand, the CTB row highlighted, and the party panel yielding (seymour-flux-win/16-target-single.png, braskas-final-aeon-win/16-target-single.png). Not captured: a multi-target command with its ALL ENEMIES / ALL ALLIES label, an all-party command, the FFX-2 flower reticle, and the 128 |
| CHK-015 | FAIL | yes | interface-onboarding | 76f587c3 | real keys and mouse on the live bundle, all chapters | Working with real input: Esc opens and resumes the pause at the command menu, over a scene and during an action animation; P opens it; the PAUSE chip click works, and Enter afterwards reaches the menu (PR-0142 repaired); Q/E tabs, H, E, G and N work; the X-2 BATTLE row flips with arrows and Enter. Failing: P never closes the pause (pClose false in every run, PR-0115). Not exercised: pause from ins |
| CHK-020 | PASS | yes | interface-onboarding | 76f587c3 | prep, pause, command menu, intent, advisor, guide, results in FFX ch1/2/3/8 and FFX-2 ch4/5/6 | The screens have the same structure in both games: prep tabs differ only where the games differ (Sphere Grid, Equipment, Overdrive vs Dresspheres, Accessories); pause tabs, OPTIONS and hide behaviour match; the advisor, guide and intent share one layout. The remaining differences are written, deliberate exceptions: FFX folds the intent panel by default (FFXBattleHud.ts comment, game-aware), and th |
| CHK-017 | PASS | yes | prep-delivery | 76f587c3 | live URL, whole artifact, 2026-09-24 05:36Z-17:52Z (76f587c3 live window) | The exact artifact was verified on the live URL while it was live. It can no longer be re-verified there because bcbdb483 replaced it at 17:52:00Z (docs/deploys.log). First-load time is not part of this record; see the delivery category and capturesNeeded. |
| CHK-018 | PASS | yes | prep-delivery | 76f587c3 | source at 76f587c3 vs shipped manifest |  |
| CHK-019 | PASS | yes | prep-delivery | 76f587c3 | every shipped file at deploy | Undecodable or blank media would be listed in problems; none are. Silence in audio belongs to the audio auditor. |
| CHK-022 | PASS | yes | prep-delivery | 76f587c3 | FFX ch I seymour-flux: loss -> RETRY -> win -> post scene -> results -> CONFIRM -> epilogue -> board -> reload; plus 2000x1012 loss -> RETRY |  |
| CHK-022 | UNVERIFIED | yes | prep-delivery | 76f587c3 | FFX ch II yunalesca | The win half passes. The loss half (Defeat, results, RETRY) was not run on this build, and round 10's loss on 5ddfde3 cannot be reused because ResultsScreen and the presenter changed since. |
| CHK-022 | UNVERIFIED | yes | prep-delivery | 76f587c3 | FFX ch III braskas-final-aeon | The loss half passes. No victory, aftermath or victory results were ever reached (PR-0082). Both runs started after 17:52Z, so their build identity (76f587c3 or bcbdb483) is not established; see R11-PD-04 for the dependency argument. |
| CHK-022 | UNVERIFIED | yes | prep-delivery | 76f587c3 | FFX-2 ch IV ffx2-bahamut | The win half passes. The loss half was not run on this build. |
| CHK-022 | UNVERIFIED | yes | prep-delivery | 76f587c3 | FFX-2 ch V ffx2-vegnagun-shuyin | The win half passes. The run was loaded at 17:35Z, before the replacement, so its bundle is 81kxOXnv. The loss half was not run on this build. |
| CHK-022 | PASS | yes | prep-delivery | 76f587c3 | FFX-2 ch VI ffx2-leblanc: win at 1600x900; loss under ACTIVE at 2000x1012 -> RETRY -> prep -> battle |  |
| CHK-022 | UNVERIFIED | yes | prep-delivery | 76f587c3 | FFX ch VIII evrae-airship (new chapter) | The win half passes. The new chapter's loss, results and RETRY route was never exercised (the phone look run stopped undecided after 2 minutes). CHK-022 SCOPE requires both halves for a new chapter. |
| CHK-024 | UNVERIFIED |  | prep-delivery | 76f587c3 | save and settings upgrade matrix after a persistence change | Persistence changed, so the full matrix is owed. No player-path evidence shows a changed saved setting (OPTIONS volume or X-2 BATTLE) surviving a reload, two open tabs, an upgrade from the previous release's save, invalid storage, or a reload mid-battle or on results. The ch6 lose run flipped ACTIVE but never reloaded. A pass from a clean profile is not a pass (CHK-024). |
| CHK-023 | PASS | yes | prep-delivery | 76f587c3 | results and rewards produced by the real battle outcome (both games) |  |
| CHK-021 | PASS | yes | prep-delivery | 76f587c3 | prep and results screens, presence and absence per game | Scoped to prep and results only; other screens belong to other auditors. |
| CHK-015 | PASS | yes | prep-delivery | 76f587c3 | prep enter / Esc back / re-enter, results RETRY and CONFIRM, board after reload | Scoped to the prep, results and retry flows. |
| CHK-023 | FAIL |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | ch6 Steal on the Dr. Goon, Pilfer Gil on Leblanc, stolen Grenade and Budget Grenade thrown | Mechanics PASS: Steal by real keys on the Dr. Goon logs 'Rikku stole Budget Grenade!' and sets inventory:x2-budget-grenade 1; the Budget Grenade appears in Items and hits 19/19/20 (sourced 18-22); a Grenade hits 211/196/203 before chain (sourced 187-211; the Fem-Goon's 147 HP delta is her remaining HP); Pilfer Gil logs 'Rikku pilfered 1,500 gil!' and results show GIL 2,280 = Act III base 780 (300+ |
| CHK-009 | FAIL |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | ch3 advisor card with one Yu Pagoda Slowed; card-following and harness-steered real-key runs | Both runs: the card reads 'Slow -> Yu Pagoda' with no A/B letter while one Pagoda is already Slowed. r1 (bcbdb483): the cursor opened on Yu Pagoda A, the one already Slowed (yu-pagoda-left). r2 (a999d133): Pagoda B was Slowed and the cursor sat on A, but the card still does not name it. The real-key run WON (r2, 20.7 min, 213 commands, 27 Doublecasts, 2 Talks, links 1-7, victory results, the post  |
| CHK-008 | FAIL |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | shape rotation: first menu and party action in ch1, ch4, ch8 at 1280x960, 2560x1080, 2560x1440, 3840x2160 | No document overflow at any size, and HUD text stays inside the viewport. FAIL at 1280x960 in Ch8: the command menu covers the acting Tidus completely and the rest of the party is off-frame left (issue). 21:9 and 4K are clean. |
| CHK-010 | PASS |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | ch3 Tidus > White Magic > Hastega with the party targeted (Targeting s1) | Brackets on Tidus, Yuna and Auron, all three party rows and CTB tiles lit green, 'ALL ALLIES' chip. The engine then applied Haste to all three. Minor distance from target s1: no 'TARGET Tidus, Yuna & Auron' plate, and two brackets are drawn across the HASTEGA/SLOW rows (see issues). |
| CHK-012 | PASS |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | dialogue lines for Shuyin, Young Auron and the Fayth boy with portraits | All three show the approved portrait at 315x333 with name and role chips. The Shuyin frame also shows the stray raw-id reticle (issue). |
| CHK-002 | PASS |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | pause CHAPTER tab hero plates ch1/ch2/ch4 and the Kimahri stats tab | The hero plates render full-bleed and dimmed as approved. Ch2's Auron snapshot sits in its thumbnail, so the bcbdb483 repair holds. One minor: FFX-2 party labels truncate to 'DRESSPHE...' at 2000x1012 (issue). / Face on the left, IN THIS FIGHT and BATTLE STATS on the right, eyes and snout clear of text. |
| CHK-016 | PASS |  | gap pass | a later live build (bcbdb483 / dc2669ac / e3b8c2a3 / a999d133), NOT 76f587c3 | rerun of the ch3 route and the four scene walks with the loaded bundle recorded | Each record now carries its bundle. They are attributable to a999d133, not to 76f587c3 (see the build note in issues). |
| CHK-015 | PASS |  | confirmer | 76f587c3 (local git-archive build, bundle 81kxOXnv, port 5741) | real Escape 0.5, 1, 2, 3 and 4 s after battle mount, ch1 and ch6 | 10 of 10 with 0 console or page errors; the reported syncHud crash needs a racing debug call (refutes R11-UI-00 as a player path). |
| CHK-004 | FAIL | yes | confirmer | 76f587c3 (local git-archive build, bundle 81kxOXnv) | ch8 first menu, E, seed 1 | Reproduced: the intent card names Wakka as the single damage target of Evrae's random-target Attack with a SCRIPTED tag and never flags that the range can KO Tidus (PR-0153). |

## Coverage matrix

### Tested

- Identity: CHK-017 PASS for the live window (76f587c3-live.json; live manifest = critic/artifacts/76f587c3.json, 894 files); 126/126 approved art hashes; unit suite 299 files on a git-archive copy (all combat and encounter files pass; 23 harness errors from the partial tree), 26 mechanics suites 404/404, 19 audio test files 434/434, story tests 154/154, save tests 30/30.
- Real-key routes on the live site (gpu, 17 runs, 427 asserted captures, 0 console errors, 0 responses >= 400): wins with aftermath, results, board and reload in chapters 1, 2, 4, 5, 6 and 8; losses and RETRY in chapters 1 (twice), 3 (twice) and 6 (Active mode); pause matrices in both games; four scene walks; 390x844 once per game.
- Combat: data audit of every changed value 5ddfde3..76f587c3 against research (Grenade, Steal / Pilfer tables, Evrae stats, actions, missiles, thresholds); 40-seed benches for chapters 1, 2, 3 and 8 (intended line and advisor top row) and FFX-2 chapters 4-6 under Wait and Active at 0 / 1,500 / 4,000 ms; attack-mash and naive-melee probes; a 40-seed FFX-2 evasion probe; Steal and petrify probes.
- Visual: 55 target-versus-build composites, 20 contact sheets and 2x crops; hash check of approved art.
- Feel and narrative: 16 timed sequences as contact sheets; pacing from 16 run.json files; every pre-battle line of ch3, 5, 6 and 8 and the first aftermath line of ch1, 2, 4, 6 and 8 read against the writing bible.
- Audio (read, not heard): all 24 music files, the SFX sprite and 52 candidates fetched and hashed; qa.mjs, ffmpeg ebur128, loop seams, themes-audit; routing from 66 audioDebug samples and the network logs.
- Confirmer on a local git-archive build of 76f587c3 (bundle 81kxOXnv, port 5741, gpu): early-Escape matrix in ch1 and ch6; the Evrae intent card at the first menu.
- Gap pass (real keys, gpu, on LATER builds, used as supplementary evidence only): ch6 Steal / Pilfer / Grenade, a ch3 real-key win, the Hastega party target, pause hero plates, Kimahri tab, Shiva, portraits, the Evrae order widget, latency, Evrae's fall and range change, the shape rotation, ch3 music sampling.

### Reused, with the dependency argument

- From critic/rounds/round-10.json or round 09 benches: PR-0105, PR-0106, PR-0107, PR-0108, PR-0069, PR-0054, PR-0053 observations from critic/rounds/round-10.json. Dependency argument: git diff 5ddfde3..76f587c3 changes in src/battle/ffx2 are only steal.ts (new, theft abilities only), setup.ts (the seam clamp), results.ts (stolen gil), execute.ts (theft hook), intent.ts and internal.ts. No FFX AI, CTB, status or formula file changed. None of those paths is on the observed behaviour. No related defect was opened since.
- From critic/rounds/round-10.json or round 09 benches: PR-0007 evidence from round 10 plus docs/plans/pr-0007-method-check.md. Same dependency: FFX CTB, AI and Seymour Flux data unchanged since 5ddfde3. The canon sourcing was re-read today (research/ffx-seymour-flux lines 279, 655).
- From critic/rounds/round-10.json or round 09 benches: Round 09 chapter 6 boss-first (36/40) and Huggles-trap (40/40) benches, not re-run. Dependency: Leblanc Syndicate AI and act stats unchanged except the rewards / steal / stolenGil fields, which those drivers never exercise. Fresh Wait 40/40 and mash 3/40 were re-measured today.
- From round 10 / round 09 / release 11 live check / post-17:52Z runs: round-10 gap pass (live 5ddfde3): pause cue in and out in both games, and title.mp3 under the briefing 6/6. Dependency: pauseMusic.ts, PauseScreen.ts, CutsceneScreen.ts, TitleScreen.ts, AudioManager.ts, pause.mp3 and title.mp3 unchanged 5ddfde3..76f587c3; BattleScreen.ts's diff does not touch the pause music.
- From round 10 / round 09 / release 11 live check / post-17:52Z runs: round-09 gap run audio-braskas-final-aeon-5ddfde3: the chapter 3 music timeline, boss-jecht to boss-yu-yevon to boss-jecht to boss-yu-yevon to victory-ffx to ending-ffx. Dependency: braskas-final-aeon.ts data and script, BattleEncounterChain.ts, BattleScreenCutscenes.ts, AudioManager.ts and the two MP3s unchanged 5ddfde3..76f587c3.
- From round 10 / round 09 / release 11 live check / post-17:52Z runs: release 11 live check d9decadb: volumes survive the two-tab merge and reload, and the release-08 save keeps its volume. Dependency: SaveData.ts, saveMerge.ts and AudioManager.ts unchanged d9decadb..76f587c3.
- From round 10 / round 09 / release 11 live check / post-17:52Z runs: capture owner round 11 runs that began after 17:52Z (likely bcbdb483): used for audio only. Dependency: bcbdb483 differs from 76f587c3 only in src/ui/common/portrait*.ts, and the audio/ artifact entries are identical.
- From round 09 gap pass / round 10: Chapter VI seam-scene and aftermath TEXT, read line by line by round 09's gap pass on 5ddfde3. Dependency argument: git diff 5ddfde3 76f587c3 -- src/story/scripts/ffx2-leblanc.ts changes only the speaker id brother to brother-x2 (a portrait source), and no wording. The reuse covers the text only. Whether the seam scenes play on this build is UNVERIFIED, because the presenter changed (departures, PR-0150).
- From round 09 gap pass / round 10: Carried issue IDs and their history from critic/rounds/round-10.json (PR-0061, PR-0021, PR-0104, PR-0133, PR-0102, PR-0134, PR-0147), each re-observed or re-traced on 76f587c3 as stated in the issue.
- From round 10 evidence / post-17:52Z runs: No evidence reused as proof. critic/rounds/round-10/evidence/seymour-flux-win/{seq-party-action/f02.jpg,11-advisor.png} (5ddfde3) was read only to set regressionVsLive=false for R11-VIS-02 (critic/rounds/round-11/visual/r10-vs-r11-ch1-action.jpg).
- From round 10 evidence / post-17:52Z runs: Round-11 captures probably served by bcbdb483 (braskas-final-aeon-win, braskas-final-aeon-win-r2, the 4 scene walks, pause-matrix) are used for battle staging and portrait identity only. Dependency argument: git diff 76f587c3..bcbdb483 -- src changes only src/app/screens/pause/markup.ts (the pause snap img gains data-face-crop-manual), src/ui/common/portrait.ts and the new portraitHost.ts (crop adoption skipped for imgs whose parent is position:static). The artifact manifests differ only in Chapter VII (locked) and Chapter IX (unregistered) art, art/manifest.json, index.html and the bundle. No chapter 1-6 or 8 battle code, scene art or portrait file changed. The ch3 pause frames from those runs are not used for any pause judgement.
- From critic/rounds/round-10.json: Carried as open, never as passes: nothing in them is counted as verified for 76f587c3.

### Not tested

- Loss and retry in chapters 2, 4, 5 (Head timer) and 8 on this build.
- Chapter 3 victory, aftermath, Yu Yevon ending and victory results on this build (lost twice).
- The 1280x720, 4:3, 21:9, 1440p and 4K shapes on this build (only the gap pass, on later builds).
- Load time, battle-entry time and frame time (PR-0084): not measured on this build.
- The CHK-024 save and settings upgrade matrix after the saveMerge change: only a reload of an unchanged save.
- Firefox, Edge, Safari, a real phone, touch and a gamepad.
- Summon entries and Overdrive motion clips, Evrae's special attacks in isolation, the chain-seam dialogue scenes and every aftermath past its first line.
- Steal, Pilfer Gil and Grenade in a live run on this build (engine only here; live on later builds).
- The Swordplay Overdrive overlay (PR-0128) and Targeting s3 with the ATB running (PR-0150).
- Listening: no agent can hear; Bailey has not graded this mix.

### Required and not tested

- CHK-022 chapter 3 win through its real flow on 76f587c3 (two advisor-following defeats; PR-0082).
- CHK-B1 owner listening verdict (audio category UNVERIFIED).
- CHK-002 pause fill measured at the rotated shapes (1280x720, 2560x1080, 3840x2160).
- CHK-010 multi-target and all-party targeting labels and the FFX-2 reticle on this build.
- CHK-023 FFX-2 Steal / Pilfer Gil / stolen Grenade by real input on this build.
- CHK-008 / CHK-011 deep shape rotation on this build (4:3, 21:9, 1440p, 4K).
- CHK-024 save and settings upgrade matrix after the persistence change (c784e553).
- Performance on named hardware (load under five seconds, 60 fps at 1600x900, frame-time spikes).

## Ranked issue list (all open)

126 issues: 44 major, 78 polish, 4 suggestions, no critical. Ranking within a severity: Bailey's reported problems first, then frequency, player impact, coverage and effort. Issues marked "Carried from round 10: not re-tested" were not observed on this build either way and are kept open, never counted as passes.

### 1. PR-0148 (major, audio): The shipped score is still the sound Bailey called SNES-like: none of the 21 existing cues was re-rendered, the 3 new cues use the same pipeline, and his verdict is still not in OWNER-VERDICT.md or decisions.json

- **Game / chapter:** both / all chapters (the whole score)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Owner-reported:** Bailey, 2026-09-21 (NOW.md line 45)
- **Expected:** Bailey, 2026-09-21 (NOW.md line 45, verbatim): 'music is too reminsicent of snes music instead of the more modern final fantasy titles and clair obscur. all of these next to be fixed very next build.' The shipped cues move to the sound he picks from the audition, and his words are recorded verbatim and dated in OWNER-VERDICT.md and as a decision.
- **Observed:** All 21 cues that shipped before (music) and the SFX sprite are byte-identical to round 10 (5ddfde3) and release 08 (sha256 of the live bytes against git blobs). The three new cues were rendered in the same pipeline. The modern-renderer versions of the Evrae cues (sketch A: sfizz, VSCO, hall IR; docs/audio/evrae-modern-report.json) exist only as publicly served candidates (audio/candidates/modern-boss-evrae.mp3, modern-scene-fahrenheit.mp3) and differ from the shipped files. docs/audio/OWNER-VERDICT.md still names 2026-09-19 'Right direction, keep refining' as the current verdict and does not record the 2026-09-21 words. CORRECTION to round 10: the 'D-026' record that round 10 cited does not exist in docs/target/decisions.json at any commit (git log -S finds nothing; the ids jump from D-021 to D-029). The verdict's only record is NOW.md line 45.
- **Repro:** sha256 of https://baileypillon.github.io/pyrefly-reprise/audio/music/*.mp3 against git show 5ddfde3:public/audio/music/<cue>.mp3. Then grep -c 'D-026' docs/target/decisions.json (0) and grep -n snes docs/handoff/NOW.md.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/audio/live-audio-check.txt; D:/Final Fantasy/docs/audio/OWNER-VERDICT.md; D:/Final Fantasy/docs/handoff/NOW.md:45; git show 76f587c3:docs/audio/evrae-modern-report.json
- **Confidence:** high on the facts; no agent heard the sound
- **Requirement:** RUBRIC section 6 audio (Bailey's listening assessment); CHK-B1; RUBRIC section 8 (owner-reported problems rank first within a severity); OWNER-VERDICT.md's own recording rule
- **Where (traced):** public/audio/music/*.mp3; docs/audio/OWNER-VERDICT.md; docs/target/decisions.json
- **Fix:** Record the 2026-09-21 words verbatim and dated in OWNER-VERDICT.md, and as a decision in decisions.json. Put the level-matched today / A / B / C audition in front of Bailey as phone-playable files and record his pick. Re-render the cues in that sound.
- **Acceptance check:** OWNER-VERDICT.md and decisions.json carry the 2026-09-21 words. Bailey's pick is recorded. The re-rendered cues pass qa.mjs and themes-audit, and his next verdict (ideally a number) is recorded against the exact cue hashes.
- **Merged from:** audio auditor

### 2. PR-0152 (major, interface, was R11-UI-03): Chapter II pause CHAPTER tab: Auron's snapshot is drawn about 1900 px wide over the objectives and the hero plate (Bailey found it on live)

- **Game / chapter:** FFX (shared pause plumbing; FFX-2 captures were clean) / yunalesca (2)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Traced: src/ui/common/portrait.ts, the pause snap markup and the chapter-meta snapshot entry (portraits/auron.png) are identical on d9decadb, and Auron's face crop did not change, so the defect was already on the build this one replaced. Not observed on d9decadb itself.
- **Owner-reported:** Bailey's screenshot of live 76f587c3 (commit bcbdb483 message)
- **Round 11:** Repaired in bcbdb483 (hotfix 12.1). The gap pass saw the CHAPTER tab hero plates and the Auron snapshot correct on a later build (gaps/, bundle D_Y69PMP or newer); that is not evidence for 76f587c3.
- **Expected:** The CHAPTER tab shows the chapter's hero plate, legible objectives and the snapshot at its 4:3 size.
- **Observed:** Esc over the pre-battle scene at 2000x1012 opens the CHAPTER tab with a giant Auron close-up over THIS ENCOUNTER, covering the objectives ('1. REACH ...', '2. DISPEL ...'), with the plate area black. Bailey found the same on the live build; bcbdb483 (hotfix 12.1) says the portrait adopter wrote a 125%-wide face crop into a static .pause__snap. The CHAPTER tab was reworked in this batch (93a2dab0), while portrait.ts is unchanged since 5ddfde3.
- **Repro:** Fresh profile, live 76f587c3, 2000x1012: board > Lady Yunalesca > prep > Enter > Esc during the first scene line.
- **Evidence:** critic/rounds/round-11/evidence/yunalesca-win-2000/05b-scene-esc.png; commit bcbdb483 message
- **Confidence:** high (captured; cause stated by the repairing commit)
- **Requirement:** Task brief: pause usability; RUBRIC §2 pause with usable controls
- **Where (traced):** src/ui/common/portrait.ts, src/ui/common/portraitHost.ts, src/app/screens/pause/markup.ts (per bcbdb483)
- **Fix:** Already repaired in bcbdb483 (data-face-crop-manual on the pause snapshots, and the adopter refuses static parents); needs verification on the current live build.
- **Acceptance check:** On the live build, the ch2 CHAPTER tab over the scene and in battle at 1600x900, 2000x1012 and 390x844: the snapshot box is at most its column width and the objectives are unobstructed; repeat for all seven chapters.
- **Merged from:** interface R11-UI-03; gap pass (later build, PASS)

### 3. PR-0082 (major, encounter): Chapter 3 still has no real-input win on this build: the advisor card says 'Slow -> Yu Pagoda' without saying which Pagoda, so following it re-Slows the Slowed one while the other feeds Braska's Final Aeon

- **Game / chapter:** FFX only / braskas-final-aeon, link 1 (BFA form 1 and form 2)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** The card names the exact target it means ('Yu Pagoda B', the letter the CTB tile and target cursor already show), so a player who follows it Slows both Pagodas, as the engine-level advisor does. research/ffx-bfa-yu-yevon §6.4 line 665: 'differentiate them'.
- **Observed:** In both live attempts the card asked for Slow on 'Yu Pagoda' 44 times, and every cast landed on yu-pagoda-left. The first cast Slowed it; the other 43 did nothing (no event between action-start and action-end). yu-pagoda-right was never Slowed. It used Power Wave 91-98 times, healing BFA 103,500-127,500 HP (1,500 each) and adding +20 gauge each time. BFA made 18-25 Triumphant Grasps and 2 Ultimate Jecht Shots. Tidus was pinned to the Slow branch, so Talk was never offered. Both runs were lost: 25.2 min / 326 commands, and 22.2 min / 251 commands. Round 10's two ch3 runs show the identical 43-no-op pattern, so PR-0125 was not the cause. The same advisor, given engine target ids, wins 39/40 seeds.
- **Repro:** Live 76f587c3, Chapter III, fresh profile, seed 1, 1600x900. Follow the advisor card. On Tidus's turn 7 or later the card reads 'Slow -> Yu Pagoda' while one Pagoda is already Slowed. The card gives no way to tell which Pagoda it means. The capture harness matched by name prefix and picked A every time.
- **Evidence:** critic/rounds/round-11/evidence/braskas-final-aeon-win-r2/turn-log.json (want.target 'Yu Pagoda', 44 rows); braskas-final-aeon-win*/battle-log.json; critic/rounds/round-11/combat/battle-summary.txt; critic/rounds/round-11/combat/probe-ffx-bench.json (advisor top-row 39/40); critic/rounds/round-10/evidence/braskas-final-aeon-win/battle-log.json (same pattern)
- **Confidence:** high for the observation, the card text and the code path. The harness's prefix pick is one of two equally uninformed choices a player could make.
- **Requirement:** RUBRIC §2 (the advisor offers legal, useful actions and says where they are); §6 interface; CHK-009; CHK-022 (every included encounter completes through its real flow)
- **Where (traced):** src/engine/tactics/advisor.ts:1070 (targetName: scoped ?? target?.name, no letter); letter source src/battle/ffx/turnQueue.ts:268-292 (letterTags)
- **Fix:** Make the card name the exact target when two combatants share a name (the letter the CTB tile and cursor already show, or left/right), and open the target cursor on the card's aimed id. Separately, extend the already-active guard to enemy debuffs (the PR-0006 class) so the card never proposes Slow on a Slowed target. FFX only.
- **Acceptance check:** In ch3, the card shows 'Slow -> Yu Pagoda B' while A is Slowed. A real-key run that follows the card by letter Slows both Pagodas, Talk is offered in form 2, and the run reaches the aftermath and victory results (closes PR-0082). Unit test: advisor targetName includes the letter when two enemies share a name.
- **Confirmer:** The harness steerTarget matches the slug yu-pagoda and always stops at the left Pagoda; the advisor drops moves that change nothing, so it most likely meant the unslowed right one. A human meets the same ambiguity (two identical names, no cue). FFX does not letter duplicate enemies in canon, so A/B is one possible fix; naming by position or pointing the cursor at the recommended target also works. FFX only.
- **Gap pass:** On a999d133 (Ji5E4fD0) a real-key run won chapter 3 in 20.7 min / 213 commands through links 1-7, victory results, the post scene and the Yu Yevon ending, but only because the harness picked the unslowed Pagoda itself (SMART_SLOW). A run on bcbdb483 that followed the card lost at 30:00. Neither is on 76f587c3.
- **Merged from:** capture owner (two defeats); combat-encounter (cause); interface R11-UI-02; prep-delivery; gap pass (card still unlettered on bcbdb483 and a999d133); confirmer: CONFIRMED with a qualification

### 4. PR-0153 (major, interface, was R11-UI-01): FFX enemy intent names one party member as the damage target of a random-target move and marks it SCRIPTED; it was wrong in 2 of 3 samples, once hiding a lethal hit (Evrae's Attack KO'd Tidus)

- **Game / chapter:** FFX (FFX-2 was correct in its one sample, ch4) / seymour-flux (1), evrae-airship (8); yunalesca (2) was correct
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. src/battle/ffx/intent.ts and src/ui/common/EnemyIntent.ts are unchanged d9decadb..76f587c3; chapter VIII was already live on d9decadb.
- **Expected:** An honest read-out that separates the certain part (the move) from the random part (who it hits): every possible target with its damage range, lethal members flagged, labelled as a random pick.
- **Observed:** Ch1, seed 1, first menu: the panel said 'Lance of Atrophy SCRIPTED, DAMAGE: TIDUS 707-799 31% HP'; the engine log shows Lance hit YUNA for 789. Ch8, seed 1: 'Evrae Attack SCRIPTED, Physical damage to a random character, DAMAGE: WAKKA 1,262-1,425 94% HP'; Evrae's attack hit TIDUS for 1283 and KO'd him (Tidus had 1265 HP), and the panel never showed that risk. The SCRIPTED tag and the single damage row read as certain. In code, predictEnemyIntent's branchKey ignores targets (src/battle/ffx/intent.ts:257-264), so a move is called 'scripted' while its target is whatever the dry run rolled at the current RNG position. The party's own actions then move the RNG before the enemy acts.
- **Repro:** Fresh profile, seed 1, live. Ch1: first menu, press E, read the panel, then play Hastega; compare with battle-log seq 10 (Lance to yuna). Ch8: first menu, press E, then Attack, Rikku Attack; compare with battle-log (Evrae Attack to tidus 1283, KO).
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/12-intent-E.png + battle-log.json; evrae-airship-win/12-intent-E.png + battle-log.json; yunalesca-win-2000/12-intent-E.png + battle-log.json
- **Confidence:** high for the two observed mismatches; the code cause is traced
- **Requirement:** Task brief: honest enemy intent that separates certain from conditional; RUBRIC §2 (the advisor and intent separate certainty from random outcomes); CHK-004 scope (the intent panel)
- **Where (traced):** src/battle/ffx/intent.ts:257-264 (branchKey), 595-624 (estimate on first.command); src/ui/common/EnemyIntent.ts:765-795 (damageHtml)
- **Fix:** When sampled runs disagree on the target, or the ability's targeting is random, estimate against every candidate and render all rows under a 'random target' label with lethal flags. Keep SCRIPTED for the move only.
- **Acceptance check:** Ch8 first menu shows Tidus, Wakka and Rikku rows with Tidus flagged lethal. Ch1 Lance lists all three members with their own Zombie odds (Ward 50%, no Ward 100%). Over a logged full FFX run, no random-target move shows one named target.
- **Merged from:** interface R11-UI-01; capture owner (Evrae intent card); confirmer: REPRODUCED on a local 76f587c3 build (critic/rounds/round-11/confirm/intent76-evrae-airship-intent.png)

### 5. PR-0154 (major, combat, was PR-R11-C01): Vegnagun's and Shuyin's magical attacks can be evaded (Nemo Ante Mortem Beatus, Mors Certa, Odi Et Amo, Vita Brevis, the Nodes' -aga spells), against hard rule 5

- **Game / chapter:** FFX-2 only / ffx2-vegnagun-shuyin, all links
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** Magic always hits, and only physical attacks roll (AGENTS.md hard rule 5). The research types these moves as Magic: ffx2-vegnagun-shuyin §3.4 lines 399-401; Node spells 'Magic (elemental)' at §3.2 line 290. src/battle/ffx2/abilities-core.ts already applies canMiss:false to Bahamut's party-wide magic for the same reason.
- **Observed:** Live ch5 run: Paine 'evaded' Nemo Ante Mortem Beatus three times (battle-log seq 1035, 1386, 3797; reason 'evaded'). 40-seed engine probe under Wait, counted per target-hit: Nemo 39/465, Mors Certa 23/290, Odi Et Amo 17/816, Vita Brevis 1/30, Node Firaga/Blizzaga/Thundaga/Waterga 12 of about 156. Fractional moves also roll: Tail Beam 62/731, Bulwark 'Hostile activity detected' 23/210, 'Magical attack detected' 9/9. In ch4, after the earlier Impulse fix, only Bahamut's physical Attack is evaded. In ch6, only physical moves are evaded.
- **Repro:** Engine: critic/rounds/round-11/combat/r11x2/bench.test.ts, 'r11 evasion probe', PYREFLY_MEASURE unset, Wait, D=0, seeds 1-40. Live: Chapter V, seed 1, 1600x900; watch Paine (Dark Knight) at any Nemo Ante Mortem Beatus.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/battle-log.json; critic/rounds/round-11/combat/probe-ffx2-evasion.log
- **Confidence:** High for the observation and the code path. Medium for canon on the fractional moves: FFX-2 §2.6 writes one hit race and does not exempt magic in words; the project rule and the ffx2-bahamut §1.1/§2.2 precedent do. Whether fractional or percent moves are evadable is unsourced, so that part is a question.
- **Requirement:** AGENTS.md hard rule 5; RUBRIC §6 combat; research ffx2-vegnagun-shuyin §3.2, §3.4
- **Where (traced):** src/battle/ffx2/abilities-shuyin.ts:31,40,61,74,173 and src/battle/ffx2/abilities-vegnagun.ts:43,115,122,165: damageType 'magical' defs without canMiss:false. They roll through resolve.ts:278 into hit.ts:38-40. The AI submits these engine-side ids, so the data records in src/data/ffx2/enemies/shuyin-abilities.ts are not consulted (the same trap the Bahamut Impulse fix documents).
- **Fix:** Add canMiss: false to every damageType 'magical' enemy def in abilities-shuyin.ts and abilities-vegnagun.ts, and add a guard test like the Bahamut one. Put the fractional / percent-total moves to research or Bailey rather than guessing.
- **Acceptance check:** The r11x2 probe reports zero 'evaded' on any magical Vegnagun, Node or Shuyin ability over 40 seeds. ch5 still wins 40/40 under Wait, and the ffx2-atb-golden tests are regenerated with the change named.
- **Gap pass:** A frame of the MISS was not captured (the autoBattle route stalled on the Tail link twice); the live event log shows Paine evading Nemo at seq 995 / 1035, 1386 and 3755 / 3797.

### 6. PR-0155 (major, combat): FFX aeons are offered and can use the party's Items (Ifrit, Ixion and Shiva threw Fire Gem and Ice Gem)

- **Game / chapter:** FFX (all FFX chapters with summons) / 1 Seymour Flux (seen); applies to 2 and 3
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. src/battle/ffx/commands.ts is unchanged d9decadb..76f587c3.
- **Expected:** An aeon's command set is Attack, its Special/Magic, Overdrive, Shield, Boost and Dismiss (research/ffx-combat-core.md §6.2 and §6.3, from ffx_command.csv), with no Item row. The research does not state 'aeons cannot use items' in words, so the source needs confirming before the fix.
- **Observed:** In the real-key win (seed from the retry), the advisor recommended 'Fire Gem in Items' for Ifrit, Ixion and Shiva, and the engine carried them out: action-start actorId=ifrit command.kind=item id=fire-gem (a2-battle-log seq 65), ixion seq 202, shiva seq 222 and 239 (ice-gem).
- **Repro:** LIVE site, fresh profile, chapter I, real keys, follow the advisor; after a loss RETRY; summon Ifrit; open ITEMS on the aeon's turn. Evidence run: seymour-flux-win attempt 2.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/a2-battle-log.json; a2-turn-log.json (turns 7, 20, 22, 23)
- **Confidence:** medium-high (engine output observed; the source table lists no aeon Item command, but no line says it outright)
- **Requirement:** Hard rule 6 / combat category: faithful FFX command sets
- **Where (traced):** src/battle/ffx/commands.ts lines 178-205: the Items loop builds item rows for any user and has no aeon-side guard (the Summon and Switch rows have one)
- **Fix:** In the Items loop, skip when user.side === 'aeon', and stop the advisor from proposing items for aeons. FFX only.
- **Acceptance check:** Seeded engine test: a summoned aeon's available commands contain no kind 'item'. A real-key run shows no ITEMS row on an aeon turn.
- **Merged from:** capture owner; confirmer: CONFIRMED (engine output and code trace at 76f587c3)

### 7. PR-0143 (major, interface): FFX-2 Steal and Pilfer Gil now work, but say nothing: the FFX-2 HUD drops every battle message, so the player never learns what was stolen (PR-0143, narrowed)

- **Game / chapter:** FFX-2 only / Ch VI ffx2-leblanc (and every FFX-2 chapter with a Thief or a system message)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Steal and Pilfer Gil shipped in a752322b, which is already in d9decadb, so the silent result was live before this build.
- **Round 11:** The mechanical half of PR-0143 is repaired: engine probe on 76f587c3 steals a Budget Grenade on 5/5 seeds (critic/rounds/round-11/combat/probe-steal.json), and the gap pass stole, pilfered 1,500 gil and threw Grenade / Budget Grenade with real keys (in range) on later builds. The message half stays open; the gap pass traced it and saw it identical on 76f587c3 source.
- **Expected:** After Steal the player reads 'Rikku stole Budget Grenade!' (and 'Rikku pilfered 1,500 gil!'), as FFX does via FFXBattleHud.ts:566 setMessage
- **Observed:** The engine logs the message events, but no text appears on screen: a DOM poll for 9 s after the steal found none, and a 100 ms frame sequence shows none. The player learns what was stolen only by opening Items.
- **Repro:** Live, fresh profile, seed 1, 1600x900, gpu. Chapter VI Act I, Wait mode. Rikku: Skill > Steal > Dr. Goon > Enter. Watch the screen for 10 s.
- **Evidence:** critic/rounds/round-11/evidence/gaps/ch6-steal-v5/run.json (stealVisible=null, stealEvents has the message); gaps/ch6-steal-v4/02-steal-seq/; gaps/ch6-steal-v2/04-after-steal.png
- **Confidence:** high (code path traced and observed; identical on 76f587c3, dc2669ac, e3b8c2a3, HEAD)
- **Requirement:** CHK-023 (feature acceptance), PR-0143/PR-0087; combat readability
- **Where (traced):** src/ui/ffx2/FFX2BattleHud.ts:847-891 (onEvent has no 'message' case); src/app/screens/BattleScreen.ts:275,287 (messageBar is null when the HUD exists and no factory is registered); src/engine/BattlePresenterFallbacks.ts:33 (setMessageBarFactory has no production caller)
- **Fix:** Add case 'message' to FFX2BattleHud.onEvent and route it to the command help band or a short banner, mirroring FFXBattleHud.ts:566.
- **Acceptance check:** Steal on the Dr. Goon shows 'Rikku stole Budget Grenade!' on screen within 1 s of the action and it is readable in a screenshot; Pilfer Gil likewise; a unit test asserts that FFX2BattleHud renders a 'message' event.
- **Merged from:** gap pass (FFX-2 message drop); combat-encounter CHK-023 UNVERIFIED (steal never exercised live); round 10 PR-0143

### 8. PR-0156 (major, interface): FFX HUD shows HP above maximum (Tidus 1632/1265) after a revive plus a party heal, while the engine caps it

- **Game / chapter:** ffx / evrae-airship (seen); other FFX chapters untested
- **Tags:** introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- **Expected:** The HUD shows HP clamped at max (1265/1265), matching the engine.
- **Observed:** The engine log shows revive hp 632, then an Al Bhed Potion heal of 1000 (damage -1000), then Evrae's 1357-damage attack KOs Tidus. That KO is only consistent with HP at or below 1357, i.e. capped at 1265. The HUD row in 23-midfight.png reads 'Tidus 1632 /1265'.
- **Repro:** Chapter VIII, seed 1: Evrae KOs Tidus, Wakka uses Phoenix Down, Rikku uses Al Bhed Potion on the party. Read the Tidus row.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/23-midfight.png; critic/rounds/round-11/evidence/evrae-airship-win/battle-log.json seq 18, 24, 31-32
- **Confidence:** medium-high (suspected cause: the HUD adds the heal amount without clamping to maxHp after a revive; not traced)
- **Requirement:** RUBRIC section 6 interface (readable, honest values); CHK-023 (the result survives the next frames)
- **Where (traced):** battle HUD party row
- **Fix:** Clamp the HUD's HP display to maxHp on heal events (or read HP from the engine snapshot rather than accumulating deltas).
- **Acceptance check:** The same seeded sequence shows 1265/1265 on the HUD. A unit test drives revive then an over-max heal through the HUD port and asserts that the displayed HP is at most maxHp in both games.
- **Merged from:** feel-narrative (cross-ref to interface); capture owner (minor: HP above maximum after a party heal)

### 9. PR-0123 (major, interface): The enemy-intent headline still pairs the rolled move with the top branch's odds: 'No action MOST LIKELY 88%' above 'Attack 88%, no action 12%'

- **Game / chapter:** FFX-2 (the FFX panel builds its label the same way; not observed there) / ffx2-vegnagun-shuyin (5), link 5
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** The headline names the most likely branch with its own percentage, or labels the rolled move with its true share.
- **Observed:** At the first menu of link 5 (Shuyin), the headline says 'No action, MOST LIKELY 88%, Spends the turn and does nothing.' while ODDS lists Attack 88% and no action 12%. The link-3 Bulwark headline is honest ('Protect POSSIBLE 29%' with Regen 38%, Shell 33%, Protect 29%).
- **Repro:** Live, ch5, 1600x900: play to link 5 and read the intent panel at the first menu.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/24-seam-5-first-menu.png; 24-seam-3-first-menu.png
- **Confidence:** high
- **Requirement:** Honest intent that separates certain from conditional
- **Where (traced):** not traced this round (FFX-2 intent headline composition)
- **Fix:** Take the headline's percentage from the branch actually named (moveName), or name the top branch.
- **Acceptance check:** At the ch5 link-5 first menu the headline percentage equals that move's ODDS row; a unit test pairs the headline and branch for every sampled report.
- **Merged from:** interface; feel-narrative (link 5 headline)

### 10. PR-0126 (major, interface): The advisor card still drops its 'in <menu>' directions: every phone card in ch4 and several desktop cards

- **Game / chapter:** both / ffx2-bahamut (4) phone; evrae-airship (8) phone; ffx2-vegnagun-shuyin (5), seymour-flux (1), braskas-final-aeon (3) desktop
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** Every suggestion names the submenu it lives in, at every density.
- **Observed:** Phone, ch4: 19 of 19 suggestions (Shell, Magic Break, Darkness) had no menu chip and the harness could not act on any of them. Phone, ch8: Al Bhed Potion and Slow had none. Desktop 1600x900: Pray x2, Darkness and Mega Phoenix (ch5), Fire Gem (ch1 turn 13), and Switch rows shown as bare names ('Tidus', 'Lulu', 'Auron') in ch3.
- **Repro:** Live, 390x844, ch4, fresh profile: read the card at each decision; compare with run.json picks[].want.menu.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/run.json + 11-advisor.png; ffx2-vegnagun-shuyin-win/run.json; seymour-flux-win/run.json; braskas-final-aeon-win-r2/run.json
- **Confidence:** high
- **Requirement:** CHK-004 (says where)
- **Where (traced):** src/ui/common/MoveAdvisor.ts:588-596 (the bare rung at MAX_DENSITY drops the stats line that carries the menu chip)
- **Fix:** Keep the menu chip at every density: move it onto the label line in the bare rung.
- **Acceptance check:** Every run.json pick at 390x844 and 1600x900 carries a non-null want.menu for submenu rows; the phone card screenshot shows 'in White Magic'.

### 11. FOC-06 (major, interface): The FFX advisor card is absent on a phone, leaving an orphan 'N HIDE MOVES' chip over the guide card; the desktop card's chips are 12.2 effective px

- **Game / chapter:** FFX / evrae-airship (8) phone; chapters 1/2/3/8 desktop
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** The card shows on a phone at a legible size, or the chip is hidden with it; no text under 14 px.
- **Observed:** At 390x844 the harness found no visible .mad__card (focFirst.adv []), although its text exists in the DOM; the screenshot shows a large 'N HIDE MOVES' chip over the strategy guide card. At 1600x900 and 2000x1012 the card's labels measure 12.2 effective px.
- **Repro:** Live, 390x844, ch8 first menu; and at 1600x900, ch1 first menu, measure .mad__card text.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win-look-phone/run.json + 11-advisor.png; seymour-flux-win/run.json focFirst
- **Confidence:** high
- **Requirement:** CHK-003, CHK-006
- **Where (traced):** src/ui/common/MoveAdvisor.ts / advisor placement (not traced)
- **Fix:** Raise the chip and stat type tokens to 14 px or more; hide the chip whenever the card declines.
- **Acceptance check:** advisorMinEffPx is 14 or more at 1600x900 and 2000x1012; at 390x844 either the card or no chip is present.

### 12. PR-0001 (major, interface): At 390x844 the battle HUD is still illegible in both games

- **Game / chapter:** both / evrae-airship (8), ffx2-bahamut (4)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** A readable phone battle layout, or a stated unsupported-device message.
- **Observed:** The command rows, party rows, CTB list, intent panel and guide render at a few px in the letterboxed battle stage; the FFX-2 help band is the only readable line. The phone target tile 'Every screen except pause' is still a gap awaiting a layout decision.
- **Repro:** Live, 390x844, fresh profile, ch8 or ch4 first menu.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win-look-phone/11-advisor.png; ffx2-bahamut-win-look-phone/11-advisor.png
- **Confidence:** high
- **Requirement:** CHK-003; platform goal (phone)
- **Where (traced):** layout gap (docs/target/targets.json group phone)
- **Fix:** Options round for the phone battle layout (tile gap), then build; until then show a 'best on a wider screen' notice.
- **Acceptance check:** At 390x844, every battle text node is 14 px or larger in effective size, and one real-key or touch turn completes.
- **Merged from:** interface; capture owner (phone battle, carried re-observation); confirmer: CONFIRMED (ch8 phone frame)

### 13. PR-0127 (major, interface): The party-prep CHAPTER card clips chapter 6's polaroid captions at 1600x900, and the phone prep is a microscopic letterboxed strip

- **Game / chapter:** both / ffx2-leblanc (6) at 1600x900; every chapter at 390x844
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** Captions complete at every supported size; the phone prep is the approved stacked page.
- **Observed:** At 1600x900 the ch6 captions are cut at the card's bottom edge. At 390x844 the whole prep screen renders as a tiny strip with overlapping 'FFX-2 ·IV OBJECT…' and cut 'Somethi…' / 'Survive a Mega'. The approved phone option A (56122e30) is not in 76f587c3.
- **Repro:** Live, ch6 prep at 1600x900; ch4 or ch8 prep at 390x844.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/04-prep.png; ffx2-bahamut-win-look-phone/04-prep.png; evrae-airship-win-look-phone/04-prep.png
- **Confidence:** high
- **Requirement:** CHK-009; approved tile 'PR-0127 phone party-prep CHAPTER card'
- **Where (traced):** shared chapter panel (src/ui/common chapter card; party-prep-phone.css)
- **Fix:** Ship 56122e30 (phone option A) and let the desktop caption wrap or shrink its line within the card.
- **Acceptance check:** On the next live build, ch6 captions are complete at 1280x720, 1600x900 and 2000x1012, and the phone prep matches the approved sheet.

### 14. PR-0002 (major, visual): The FFX command stack hides the acting party: Yuna in chapters 1 and 3, Tidus in chapter VIII, where Wakka is also cut by the left edge and both leave the frame during actions

- **Game / chapter:** FFX only / seymour-flux, braskas-final-aeon, evrae-airship
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false. Party slot data (src/scenes) is unchanged d9decadb..76f587c3 and chapter VIII was live on d9decadb.
- **Expected:** D-041 option A.
- **Observed:** Ch1 and ch3 first menu at 1600x900: only Yuna's hair and ribbon show at the left of the cascade. Ch8 first menu (11-advisor.png): the ORDERS-to-FLEE cascade covers Tidus, the acting character (only his sword tip at x~480); Wakka is cut by the left screen edge and partly under ORDERS and ATTACK; only Rikku is clear. In ch8 seq-transition-into-battle/f09 Wakka sits at x=0, and in 16-target-single.png, seq-party-action f02-f03 and seq-action-playing f03 only Rikku is in frame. At 4:3 (1280x960, gap pass, later build) the ch8 menu covers the acting party. At 390x844 the ch8 menu shows no party member (see PR-0017).
- **Repro:** Chapter I first menu.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/seymour-flux-win/11-advisor.png
- **Confidence:** high
- **Requirement:** Approved target Battle HUD FFX; D-041
- **Where (traced):** first menu, 1600x900
- **Fix:** Build D-041 option A (per-chapter party slot data, stack proportions untouched) and include chapter VIII: move the three ch8 slots inward and right so every quad clears the stack footprint and the left edge, and keep the action camera inside the slot span.
- **Acceptance check:** Ch1, ch3 and ch8 at 1600x900, 2000x1012 and 1280x960, first menu: every projected party quad is inside the viewport and no head or weapon is more than 10% under any HUD panel; in ch8 seq-party-action and seq-action-playing every party member stays in frame f00-f09.
- **Merged from:** visual PR-0002; visual R11-VIS-01 (chapter VIII); interface PR-0002 (ch8 instance); gap pass (ch8 at 4:3)

### 15. PR-0157 (major, visual, was R11-VIS-02): R11-VIS-02: FFX action camera frames the acting party member under the enemy info card and party panel

- **Game / chapter:** FFX only / seymour-flux (I), braskas-final-aeon (III)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** CHK-008: no panel intersects a face or a weapon, and the player sees their own character's action play out.
- **Observed:** Ch1: for most of Tidus's Attack (seq-party-action f01-f07), his face and torso are under the Seymour Flux info card (HP, weakness row, 'I HIDE') and his legs are under the party panel. The same holds during Seymour's action on Yuna (seq-action-playing f00-f03). Ch3: during the party action (f02, f04), the actor is reduced to a sword tip under the Final Aeon info card and the party rows. Round 10 has the identical ch1 frame (critic/rounds/round-10/evidence/seymour-flux-win/seq-party-action/f02.jpg), so this is long-standing and not a regression. The FFX-2 frames in ch4 and ch6 are clear.
- **Repro:** Live site, fresh profile, 1600x900, seed 1. Chapter I > first menu > Attack > Seymour Flux > Enter. Watch the 10-frame action sequence.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/visual/ch1-seq-party-action.jpg; D:/Final Fantasy/critic/rounds/round-11/visual/ch1-seq-action-playing.jpg; D:/Final Fantasy/critic/rounds/round-11/visual/actions-other.jpg; D:/Final Fantasy/critic/rounds/round-11/visual/r10-vs-r11-ch1-action.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §6 visual (composition, staging) and feel (readable action); CHK-008; CHK-006 (a transient overlay belongs to the menu, not to the action)
- **Where (traced):** battle, party action and enemy action playback, 1600x900
- **Fix:** Fade the FFX enemy info card while an action plays out, and restore it at the next menu (the transient-overlay rule, CHK-006). Optionally lower the party panel's opacity for the same span. Game case: FFX only. The FFX-2 intent card sits top-right and is clear.
- **Acceptance check:** Ch1 and ch3 at 1600x900 and 2000x1012, seq-party-action and seq-action-playing: no HUD panel covers the acting party member's head or weapon in any frame f00-f09, and the info card is back on the next menu.

### 16. PR-0005 (major, visual): PR-0005 (updated): the turn cut-in now plays, but it covers the FFX command menu and Auron's first-use coach line; D-042 option B is not built

- **Game / chapter:** both (the cut-in plays in both games; the covering defect is FFX, D-042 is FFX only) / all; observed in ch1, ch4, ch6 and ch8
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** The Turn cut-in tile, plus D-042 option B: the live FFX command cascade draws above the full-size slab.
- **Observed:** seymour-flux-win/10-first-menu-coach.png: the Tidus slab covers the left third of the screen, including the command menu and Auron's coach line. The FFX-2 version (Yuna, pink accent) plays in ch4, and Paine's in ch6. The PR-0005-ffx tile says the FFX-2 cut-in 'has no approved mockup and is unbuilt', but commit 6d6ab7e3 ships it for both games.
- **Repro:** Any chapter, first turn of each party member, 1600x900.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/targets/fight-onboarding-c2.jpg; D:/Final Fantasy/critic/rounds/round-11/targets/fight-onboarding-c3.jpg; D:/Final Fantasy/critic/rounds/round-11/visual/actions-other.jpg
- **Confidence:** high
- **Requirement:** Approved target Turn cut-in; D-042; CHK-021 (FFX-2 presence needs its own approval)
- **Where (traced):** each party member's first turn
- **Fix:** Build D-042 option B, a stacking-order change only: raise the FFX command cascade above the slab. Ask Bailey whether the FFX-2 cut-in should stay; if it stays, record an FFX-2 target for it.
- **Acceptance check:** Ch1 at 1600x900, first turn: while the slab is up, the cascade rows and Auron's coach line are drawn above it and readable. targets.json records a decision on the FFX-2 cut-in.
- **Merged from:** visual PR-0005 (updated); onboarding PR-0005 (cut-in over the first-use coach mark)

### 17. PR-0094 (major, visual): PR-0094 (widened): at Chapter 5 link 3 the intent card covers most of Vegnagun's body painting

- **Game / chapter:** FFX-2 only / ffx2-vegnagun-shuyin, link 3 (Bulwarks)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** CHK-008: the boss's painted body is not hidden by a HUD panel.
- **Observed:** The 'RIGHT BULWARK / Protect' intent card (x 958-1330, y 75-397) covers Vegnagun's body painting (x 860-1230, y 170-480) except its left ring and the lower legs.
- **Repro:** Live, 1600x900, seed 1. Chapter V, win links 1 and 2 > seam into link 3 > first menu.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/20-link-3.png
- **Confidence:** high
- **Requirement:** CHK-008; RUBRIC §6 visual composition
- **Where (traced):** first menu after the seam into link 3, 1600x900
- **Fix:** Frame link 3 so that the body clears the intent card's zone, or give the intent card a per-link alternative anchor away from the body. The rest of PR-0094 carries.
- **Acceptance check:** Link 3 first menu at 1600x900 and 2000x1012: less than 15% of the body painting is under any panel.

### 18. PR-0096 (major, visual): PR-0096 (carried): Leblanc's idle still holds the fan shut; Bailey's named pick is B, fan fully open

- **Game / chapter:** FFX-2 only / ffx2-leblanc, link 3
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** Leblanc pick B: fan fully open (targets.json, chapters/The Leblanc Syndicate, mustChange).
- **Observed:** The fan is closed against her lips in the idle.
- **Repro:** Chapter VI, link 3 first menu.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/visual/ch6-link3-left-crop.png; D:/Final Fantasy/critic/rounds/round-11/targets/chapters-leblanc-link3.jpg
- **Confidence:** high
- **Requirement:** Approved target (mustChange)
- **Where (traced):** battle, 1600x900
- **Fix:** Install the pick-B open-fan idle, as already decided (D-018/D-036).
- **Acceptance check:** Link 3 at 1600x900: Leblanc's idle shows the fan open.

### 19. PR-0095 (major, visual): PR-0095 (carried): Vegnagun's Nodes, Bulwarks and Redoubts still render as hooded cones; the D-044 C/C* wiring is not built

- **Game / chapter:** FFX-2 only / ffx2-vegnagun-shuyin, links 2-4
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** D-044: Bulwark C*, Redoubt C* and Node C (no separate figures).
- **Observed:** Three cones in link 2, two in link 3 and two in link 4 (black hoods with cyan eyes). Tail A (the steel tip) does look installed: PR-0015 is not reproduced.
- **Repro:** Chapter V, links 2-4.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/visual/ch5-links.jpg
- **Confidence:** high
- **Requirement:** Approved target Vegnagun's parts; CHK-012
- **Where (traced):** battle, 1600x900
- **Fix:** Carry out docs/plans/vegnagun-parts-wiring.md as planned.
- **Acceptance check:** Links 2-4 show no cone figures; the part rings sit on the body and head paintings.
- **Merged from:** visual; capture owner (Redoubt silhouettes); confirmer: CONFIRMED

### 20. PR-0017 (major, visual): PR-0017 (widened): at phone width, chapters 4 and 8 barely show the party

- **Game / chapter:** both / ffx2-bahamut, evrae-airship (plus ch6 from round 10)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** The acting party member is visible on the menu.
- **Observed:** Ch4: only Paine is visible; Yuna and Rikku are off the left, and the help band sits mid-screen across Bahamut. Ch8 menu: no party member visible.
- **Repro:** 390x844, first menu in ch4 and ch8.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/visual/phone-frames.jpg; D:/Final Fantasy/critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/11-advisor.png
- **Confidence:** high
- **Requirement:** CHK-011 (party rule); RUBRIC §5 phone
- **Where (traced):** 390x844 battle
- **Fix:** A portrait-orientation camera rig that frames the party and the boss in one column.
- **Acceptance check:** At 390x844 in ch4, ch6 and ch8, the acting member and the boss are both in frame on the first menu.
- **Merged from:** visual; capture owner (phone battle shows no party); confirmer: CONFIRMED

### 21. PR-0065 (major, visual): Cold-launch fallbacks: the briefing arrives without Auron or its backdrop, and the chapter board shows grey placeholder busts (now also on chapter VIII) while 1.1-1.4 MB portrait PNGs load

- **Game / chapter:** both / board, briefing
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** CHK-012: no fallback face and no unpainted screen on arrival.
- **Observed:** seymour-flux-lose-2000/01-briefing.png has no Auron and no backdrop. 2 more of the 12 briefings lack the backdrop. On the fresh 1600 profile the ch8 card shows grey silhouettes for Wakka and Rikku, while the phone run shows the faces.
- **Repro:** Fresh profile, load the live URL, capture the briefing and chapter select within about 6 s.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/visual/briefings.jpg; D:/Final Fantasy/critic/rounds/round-11/visual/ch8-card-crop.png
- **Confidence:** high
- **Requirement:** CHK-012
- **Where (traced):** fresh profile, 1600x900 and 2000x1012
- **Fix:** Preload and decode the briefing painting, the backdrop and the board's party portraits before revealing each screen.
- **Acceptance check:** 12 of 12 fresh-profile runs show Auron, the backdrop and every card portrait at their first capture.
- **Merged from:** visual PR-0065; capture owner (Evrae board card placeholders); prep-delivery R11-PD-01 (grey slots in 5 of 13 board captures, 1.1-1.4 MB each)

### 22. PR-0035 (major, visual): The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile (carried)

- **Game / chapter:** FFX-2 / ffx2-bahamut
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Re-observed in round 11: the FFX-2 party stands left and the boss right in chapters 4-6, as in round 10 (critic/rounds/round-11/targets/presentation-battle-hud-ffx2.jpg).
- **Expected:** The A-ffx2-battle composition.
- **Observed:** ON 5ddfde3: Re-observed: the FFX-2 field is mirrored against its approved tile.
- **Repro:** Chapter 4 first menu, 2000x1012.
- **Evidence:** critic/rounds/round-09/targets/5ddfde3/presentation-battle-hud-ffx2.jpg; critic/rounds/round-09/targets/presentation-battle-hud-ffx2.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §7 target gate
- **Fix:** Carried from round 08: ask Bailey whether the mirrored field is an accepted adaptation, or re-stage it.
- **Acceptance check:** The composite matches, or the tile carries Bailey's recorded adaptation.
- **Last observed:** 76f587c3 (round 11)

### 23. PR-0031 (major, visual): Target selection lacks two named mustRemain properties, the ground ring under the selected figure and the quiet dim on non-targets (carried, narrowed)

- **Game / chapter:** both / braskas-final-aeon (Yu Pagoda A); ffx2-leblanc (Dr. Goon)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Re-observed in round 11: chapter 3 Attack targeting shows brackets, pointer and label but no dim and no ground ring (critic/rounds/round-11/targets/fight-targeting-s2.jpg).
- **Expected:** Targeting tile reaction.mustRemain: 'the soft ground ring under every selected figure', 'the quiet dim on everyone who is not a target'.
- **Observed:** ON 5ddfde3: Re-observed: no ground ring under the selected Yu Pagoda or Dr. Goon and no dim on non-targets (the gap pass saw a ring plus dimmed party on the single-target cue; the tile's named ring under the selected figure and the quiet dim of the other enemies are the missing mustRemain items).
- **Repro:** Seed 1, 1600x900. Choose ATTACK at the first menu.
- **Evidence:** critic/rounds/round-09/targets/5ddfde3/fight-targeting-s2.jpg; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/targets/fight-targeting-s2.jpg; fight-targeting-s3-ch6-proxy.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §7 target gate
- **Fix:** Add the ring decal under the targeted figure's foot point and a 15-20 percent dim on untargeted actors while the cursor is live.
- **Acceptance check:** The s2 composite shows a ring under the Yu Pagoda and a visible dim on the Final Aeon and Pagoda B.
- **Last observed:** 76f587c3 (round 11)

### 24. PR-0022 (major, visual): A KO'd character is the standing billboard rotated about its centre, floating off the ground away from her station

- **Game / chapter:** FFX (observed); the treatment is shared, so it is expected in both / 1 (Seymour Flux)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Re-observed in round 11 at medium confidence: in chapter 1 a KO'd Yuna floats sideways in the foreground of the Overdrive camera (critic/rounds/round-11/evidence/seymour-flux-win/23-midfight.png, one frame).
- **Expected:** A downed character reads as down on the ground at her own station, the way FFX stages a KO. Ground contact is a named visual criterion in RUBRIC §6 and in CHK-014.
- **Observed:** RAISED FROM POLISH TO MAJOR this round, on direct observation rather than a synthesized state: in a real-input capture of Chapter 1, after Yuna is KO'd (her party row reads 0/1500 and is greyed), she is drawn lying horizontally in mid-air at about the other actors' chest height, displaced far left of the party group into empty backdrop, with no ground contact and a white bloom over her torso. It is the most conspicuous wrong thing on screen in that frame, and a KO is a routine event in every chapter. Round 06 filed the same root as polish from a smaller sample; the severity is raised for visibility and frequency, not because the defect changed.
- **Repro:** Chapter I from the board with real keys; play until Yuna is KO'd, then open target selection and capture at 1600x900 (route as in evidence/ch1/run.json).
- **Evidence:** critic/rounds/round-07/evidence/ch1/09-targeting.png
- **Confidence:** high
- **Requirement:** RUBRIC section 6 visual (poses, ground contact); the approved 'Yuna, battle poses' tile.
- **Fix:** Rotate the KO billboard about the actor's feet, not its centre, and keep it at the actor's own station on the ground plane; better, give the cast a dedicated downed pose. Game case: BOTH — one shared actor layer.
- **Acceptance check:** A KO in one FFX and one FFX-2 chapter leaves the character touching the ground plane at her own station, with no gap between the billboard and the floor, at 1600x900 and 2000x1012.
- **Last observed:** 76f587c3 (round 11)

### 25. PR-0129 (major, audio): Chain entrances score the same moment twice: chapter 3 plays the whole possessed-aeon gauntlet (links 3-6) under boss-jecht instead of boss-yu-yevon, and chapter 5 cuts boss-shuyin to silence at Shuyin's first damage and restarts it (raised to major)

- **Game / chapter:** both (FFX-2 ch5 re-observed live this round; FFX ch3 from reused evidence; the chain-cue versus scene-cue plumbing is shared) / ffx2-vegnagun-shuyin link 5; braskas-final-aeon possessed-aeon gauntlet
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** One owner decides the music at each chain entrance. Either the chain cue carries through the entrance scene, or the scene alone starts the theme and the next links do not override it. In chapter 3, the gauntlet keeps the cue the 'valefor-enters' scene chose, unless Bailey decides otherwise.
- **Observed:** CHAPTER 5, live 76f587c3, 1600x900, real keys. boss-shuyin plays at gain 1 at 1791.1 s and 1792.6 s, while the party has already fought Shuyin for five turns without damaging him. At 1794.1 s current is null with no fading slot. Turn 189 shows Shuyin's HP go 23850 to 18918, and his first damage triggers 'shuyin-appears' (when: hp-below fraction 1), whose first step is music(null, 900). By after-fight (2054.2 s) a boss-shuyin fading slot at 0.85 shows the theme was started again. CHAPTER 3, reused from round 09 (5ddfde3, data unchanged): boss-jecht restarts at possessed Valefor (376.3 s) and is silenced 4 s later by 'valefor-enters'. That scene ends on music('boss-yu-yevon') at 405.5 s. At 414.2 s the possessed-Ifrit link's chain cue (braskas-final-aeon.ts:365, boss-jecht) replaces it, so the rest of the gauntlet plays under Jecht's theme, and boss-yu-yevon returns only at Yu Yevon (658.4 s). NEW this round: the chapter 3 yu-yevon-to-jecht swap was not in the round 10 ticket.
- **Repro:** Chapter 5: seed 1, 1600x900, Wait mode, real keys to link 5. Sample window.__pyrefly audioDebug().music every 500 ms from the link 4-to-5 seam until 10 s after 'shuyin-appears' ends. Chapter 3: win to the possessed aeons and sample every 500 ms from the BFA KO to Yu Yevon.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/run.json (audio[] seam-5*, after-fight); ffx2-vegnagun-shuyin-win/turn-log.json; D:/Final Fantasy/critic/rounds/round-09/evidence/gaps/audio-braskas-final-aeon-5ddfde3/run.json (reused); git show 76f587c3:src/story/scripts/ffx2-vegnagun-shuyin.ts:273-277,354-381; git show 76f587c3:src/story/scripts/braskas-final-aeon.ts:280-306; git show 76f587c3:src/data/ffx/enemies/braskas-final-aeon.ts:247,365,481
- **Confidence:** high on the chapter 5 routing state (read from audioDebug, not heard; samples 1.5 s apart); medium-high on chapter 3 (reused, with the dependency argument recorded in CHK-023)
- **Requirement:** RUBRIC section 6 audio (routing, phase transitions); CHK-023 (the result survives the next frames); THEMES.md cue map rows 8, 9 and 19
- **Where (traced):** src/app/screens/BattleEncounterChain.ts:188-189 (the chain cue at link start); src/story/scripts/ffx2-vegnagun-shuyin.ts:355; src/data/ffx/enemies/braskas-final-aeon.ts:365
- **Fix:** Chapter 5: drop the leading music(null, 900) from 'shuyin-appears' so the chain cue carries through, or give Shuyin's formation no chain cue so the scene starts it. Chapter 3: set the possessed-aeon formations' musicCues to boss-yu-yevon (or remove them) so the cue 'valefor-enters' starts is not overridden. Ask Bailey which way when the sources do not say.
- **Acceptance check:** audioDebug sampled every 500 ms: chapter 5 has exactly one boss-shuyin start from the seam to the end of the fight, or none before the scene's last line in the silence variant. Chapter 3 has no boss-jecht between 'valefor-enters' ending and the Yu Yevon link, or the owner-chosen equivalent.
- **Severity note:** Raised from polish: the gap pass sampled a real-key chapter 3 win every 500 ms and heard (read) boss-jecht from link 3 through link 6, several minutes of the wrong theme, not a transient false start. Cause traced to braskas-final-aeon.ts:365 (possessedAeonBattle musicCues boss-jecht), which is identical on 76f587c3.
- **Merged from:** audio PR-0129; gap pass (ch3 possessed-aeon links, a999d133, 500 ms samples)

### 26. PR-0099 (major, audio): Chapter 6 still borrows chapter 4's cues: the comedy entrance under 'The machine under the cathedral', the Syndicate fight under Bahamut's aeon theme, and the aftermath under scene-farplane; THEMES.md still has no chapter 6 row

- **Game / chapter:** ffx2 / ffx2-leblanc (chapter VI): pre-scene, battle across links 1-3, aftermath
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** Every chapter moment has a cue whose 'one emotion' fits it (THEMES.md cue map). Chapter 6's comedy entrance and its Syndicate fight get their own rows and cues, picked by Bailey from sketches (end state first).
- **Observed:** Live 76f587c3, real input. Win at 1600x900: pre-scene scene-bevelle-underground at gain 1 (24.6 s); first menu boss-ffx2-aeon at gain 1; seams 2 and 3 at +0, +1.5 and +3 s all boss-ffx2-aeon at gain 1; results victory-ffx2; the aftermath requests scene-farplane. The loss at 2000x1012 shows the same scene and battle cues. src/data/encounters.ts FFX2_LEBLANC.music still says 'Fallback to Chapter 4's cues', and THEMES.md at 76f587c3 has no Leblanc row.
- **Repro:** Fresh profile, seed 1, 1600x900: title > chapter select > Chapter VI > prep > pre-scene > fight. Read window.__pyrefly audioDebug() at the pre-scene, the first menu and each seam, or read network-media.json.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/ffx2-leblanc-win/run.json (audio[]); ffx2-leblanc-win/network-media.json; ffx2-leblanc-lose-2000/run.json; D:/Final Fantasy/critic/rounds/round-11/audio/slots-live.txt
- **Confidence:** high on the routing (read, not heard); medium on emotional fit (judged from each cue's documented intent)
- **Requirement:** CHK-001 (the right cue at the real moment); docs/audio/THEMES.md cue map; AGENTS.md rule 10 (new content needs Bailey's yes)
- **Where (traced):** src/data/encounters.ts FFX2_LEBLANC.music; src/story/scripts/ffx2-leblanc.ts:178, 235, 268
- **Fix:** Disclose it in the release note. Add 'borrowed, pending' chapter 6 rows to THEMES.md. Offer Bailey two or three short sketches for a Chateau Leblanc scene cue and boss cue, as was done for Macalania and Yojimbo, and build only his pick.
- **Acceptance check:** THEMES.md has chapter 6 rows, themes-audit covers them, Bailey's pick is recorded in decisions.json or OWNER-VERDICT.md, and a live chapter 6 run's audioDebug shows the new keys at the pre-scene, the first menu and the seams.
- **Merged from:** audio; capture owner; confirmer: CONFIRMED (musicKeys at src/data/chapter-meta-ffx2-leblanc.ts:84)

### 27. PR-0008 (major, encounter): PR-0008 (carried, STALLED): Chapter 1's intended line wins 26 of 40, and seed 1, which every fresh profile gets, loses for both the intended line and the advisor

- **Game / chapter:** FFX only / seymour-flux
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** A decision from Bailey on the re-baseline (the method check's option c). No boss numbers change.
- **Observed:** Fresh bench on 76f587c3: intended line 26/40, advisor top row 27/40; seed 1 loses in both. Live: the capture owner's first fight, seed 1, following the advisor, lost in 64 turns; the retry (seed 1 + 1000) won. BattleScreen.ts:194 and :388 default the seed to 1, and BattleScreenFlow.ts:341 adds attempt x 1000. docs/plans/pr-0008-method-check.md measures a local ceiling (100 of 160 over four windows) and proposes re-baselining with Bailey.
- **Repro:** critic/rounds/round-11/combat/r11/bench.test.ts, seymour-flux, seeds 1-40, intended and advisor-top-row.
- **Evidence:** critic/rounds/round-11/combat/probe-ffx-bench.json; critic/rounds/round-11/evidence/logs/ch1-win.log
- **Confidence:** high
- **Requirement:** RUBRIC §6 encounter (fair wins and losses, correct difficulty); product brief 'Mechanics never bend'
- **Fix:** Put the method check's re-baseline to Bailey, and add one question: should the first attempt on a fresh profile keep the fixed seed 1 (a losing seed for the advised line), or take a varying seed? No boss change.
- **Acceptance check:** Bailey's recorded decision in docs/target/decisions.json, and the bench measured against the adopted bar.
- **Stalled:** yes: a method check is owed before the next attempt (RUBRIC section 8)

### 28. PR-0061 (major, feel): PR-0061 (carried, STALLED): 7.0 to 9.5 s from the scene skip to the first usable command menu

- **Game / chapter:** both / all seven playable chapters
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** The opening beat reads as deliberate, and a returning player can shorten it (RUBRIC section 6 feel: respectful skip and replay).
- **Observed:** The play clock at the first menu is 7.0 s in ch8 and ch3, 7.6 s in ch2, 8.2 s in ch4, 8.6 to 8.7 s in ch1, and 9.5 s in ch5 and ch6. From the skip step to the menu step takes 5.6 to 10.5 s. The transition sequences show the card, the dissolve and the boss caption done by about 2.8 s, and the rest is the intro sweep plus enemy actions.
- **Repro:** Fresh profile, seed 1, any chapter. Hold Enter to skip the pre-scene, then read window.__pyrefly state playTimeMs when awaitingMenu first turns true.
- **Evidence:** critic/rounds/round-11/evidence/*/run.json firstState.playTimeMs; critic/rounds/round-11/feel-narr/evrae-airship-win__seq-transition-into-battle.jpg
- **Confidence:** high
- **Requirement:** RUBRIC section 6 feel; the stagnation rule of section 8 applies (third review open at major)
- **Where (traced):** battle entry, before the first interactive menu
- **Fix:** Method check first, because the issue is STALLED. Then let Confirm end the intro sweep the way the cutscene skip already does, and record each chapter's intended opening length.
- **Acceptance check:** With a hold-Enter skip followed by Confirm presses, the first usable menu arrives at or below the recorded intended length (for example 4 s) in both games. The play clock is measured through the same probe.
- **Stalled:** yes: a method check is owed before the next attempt (RUBRIC section 8)

### 29. PR-0021 (major, narrative): PR-0021 (carried, STALLED): no banter bank; prep and results carry only fixed quips, now also in Chapter VIII

- **Game / chapter:** both / all, re-confirmed on evrae-airship
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Expected:** writing-bible section 4 banter exchanges, matched to slot, suitability and mood, on the formation and victory screens; or a recorded ruling by Bailey that banter is out of scope.
- **Observed:** Ch8 prepText has the chapter summary and objectives only. Results show one quip ('Okay. Next one.').
- **Repro:** Chapter select, arrow to VIII, Enter to prep; win and read the results.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/run.json prepText, resultsText
- **Confidence:** high
- **Requirement:** writing-bible section 4; RUBRIC section 6 narrative (banter)
- **Where (traced):** party prep and victory results
- **Fix:** As in round 10: implement section 4 for both games, or ask Bailey to rule it out of this milestone.
- **Acceptance check:** Prep and results in one FFX and one FFX-2 chapter show a mood-matched exchange drawn from section 4, or the decision appears in docs/target/decisions.json.
- **Stalled:** yes: a method check is owed before the next attempt (RUBRIC section 8)

### 30. PR-0144 (major, interface): Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the research

- **Game / chapter:** FFX-2 only / ffx2-leblanc Act III (Last Room)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The hint describes the command's actual target. For Leblanc, research §3.4: 'Hit her with a sword, not a spell' (Def 10, MDef 62), which her own sensorText repeats.
- **Observed:** Engine probe, Act III, seeds 1-20: all 11 'Attack -> Ormi' and 4 'Attack -> Logos' NEXT lines read 'Logos' Evasion 40 is the highest in the fight — a plain swing misses him more than it hits', including rows where only Ormi is alive. On LIVE with real keys (gap pass): Logos KO, NEXT 'RIKKU Attack -> Ormi'; the reason line is hidden at the default fit and, after a real click on MORE, prints the Logos evasion line detached from its NEXT header. The Leblanc hint ('she wants spells, not swords') can never print because the Logos hint matches first, and it inverts §3.4.
- **Repro:** cd 'D:/Final Fantasy/critic/rounds/round-10/combat'; R10_FILE=probe-guide-hints.test.ts node D:/pyrefly-release/node_modules/vitest/vitest.mjs run --config vitest.config.ts. Game: chapter 6 Act III after Logos falls, press G on a turn whose NEXT is Attack, click MORE. Seed 1.
- **Evidence:** critic/rounds/round-10/combat/probe-guide-hints.json; critic/rounds/round-10/evidence/gaps/ch6-guide/guide3-open-0.png; critic/rounds/round-10/evidence/gaps/ch6-guide/guide3-more-0.png; critic/rounds/round-10/confirm/probe-guide-hints.orig.json
- **Confidence:** high (code path, probe re-run by the confirmer, on screen with real keys)
- **Requirement:** RUBRIC §2 (the guide gives legal, useful and honest advice); research ffx2-leblanc-syndicate §3.2, §3.4; AGENTS.md rule 6
- **Where (traced):** src/data/guides/ffx2-leblanc.ts:111-118; src/engine/tactics/guide.ts:275 (bossId tests only state.combatants[bossId] !== undefined)
- **Fix:** Add a target condition to GuideHint (for example targetId) and use it on those two hints in place of bossId; reword the Leblanc hint to §3.4; correct or delete the unread FFX2_LEBLANC.sensorTexts.leblanc. Keep the NEXT reason visible at every fit rung, as the source intends.
- **Acceptance check:** probe-guide-hints shows the Logos line only on Attack -> Logos and a §3.4-consistent line on Attack -> Leblanc, pinned by a unit test; on screen the reason sits under its NEXT header at the default fit.
- **Last observed:** 5ddfde3 (round 10)

### 31. PR-0150 (major, visual): Targeting s3 (FFX-2 single target with the ATB running) is far from its approved tile, and the party is framed out

- **Game / chapter:** FFX-2 only / ffx2-vegnagun-shuyin link 1
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed. The round-11 capture of Targeting s3 shows the White Magic list, not a targeted part; the gap pass captured the part cursor on a later build in Wait mode (ATB held), so "ATB running" is still unproven. Repair afb1657a/56fecba9 is in this build.
- **Expected:** Approved tile Targeting s3: a TARGET part plate, the actor and dressphere plate, the reticle on the part, all three girls in frame and the controls hint.
- **Observed:** On LIVE (gap pass): X-2 BATTLE set to ACTIVE with real keys (engine ticks 14542 -> 14982 in 0.6 s, chip 'ACTIVE — ATB RUNNING'), then Paine ATTACK -> vegnagun-tail. Present: the ATB chip, a reticle ring and a small part label. Missing: the TARGET plate, the actor/dressphere plate and the 'ENTER CONFIRM / <- -> CHANGE TARGET / ESC BACK' hint. Only Paine is on screen, cut at the left edge; the reticle petals overlap the guide rail.
- **Repro:** Fresh profile, 1600x900, chapter 5; on Paine's first turn set X-2 BATTLE to Active in pause OPTIONS, resume, ATTACK.
- **Evidence:** critic/rounds/round-10/evidence/gaps/ch5-win/targeting-s3-attack-single.png; critic/rounds/round-10/evidence/gaps/ch5-win/targeting-s3-attack-single-b.png; critic/rounds/round-10/targets/fight-targeting-s3.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §7 approved-target gate (docs/target/targets.json, Targeting s3); CHK-010
- **Fix:** Add the TARGET plate, actor plate and controls hint to FFX-2 target select and keep the party in frame during targeting.
- **Acceptance check:** The same capture shows the three plates and all three girls whole; the composite against the s3 tile matches its named properties.
- **Last observed:** 5ddfde3 (round 10)

### 32. PR-0016 (major, visual): The pause CHAPTER tab shows the last member's close-up (Paine), not the chapter's approved hero plate (carried, re-observed)

- **Game / chapter:** both / ffx2-bahamut and ffx2-leblanc, pause CHAPTER tab
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed. Repair 93a2dab0 is in this build (and in d9decadb). No CHAPTER tab hero plate was captured on 76f587c3; the gap pass saw them correct on a later build.
- **Expected:** Hero plate chapter 4 tile note: 'The Until Dawn remake moves it to the CHAPTER tab.'
- **Observed:** ON 5ddfde3: Re-observed on 5ddfde3 (no longer reused): the CHAPTER tab keeps the last member's plate (ch1 kimahri.2x.webp, ch4/5/6 paine.2x.webp) at 1600x900, 2000x1012 and 390x844; in ch4 the intent panel also sits over the tab (PR-0122).
- **Repro:** In battle press Esc, then ArrowRight to CHAPTER (1600x900).
- **Evidence:** critic/rounds/round-09/evidence/gaps/pause/seymour-flux-1600x900-5ddfde3-02-tab3-Chapter.png; critic/rounds/round-09/evidence/gaps/pause/ffx2-bahamut-1600x900-5ddfde3-02-tab3-Chapter.png; critic/rounds/round-09/targets/pause-hero-plate-ch4.jpg; critic/rounds/round-09/evidence/e119552/pause/ffx2-bahamut-chapter-tab.png; critic/rounds/round-09/evidence/e119552/live-1b33971/pause/ffx2-bahamut-chapter-tab.png; critic/rounds/round-09/evidence/gaps/targets/ch1-pause-chapter.png, targets-live/ch1-pause-chapter.png; critic/rounds/round-10/evidence/gaps/ch1-pause-1600/pause-chapter-tab.png; critic/rounds/round-10/evidence/gaps/ch4-pause-1600/pause-chapter-tab.png
- **Confidence:** medium: the tile note is an agent's record, not Bailey's words
- **Requirement:** RUBRIC §7 target gate
- **Fix:** Paint the chapter's pause plate behind the CHAPTER tab, or ask Bailey whether the member painting is intended there.
- **Acceptance check:** The pause-ch4 composite shows the approved Yuna and Bahamut plate behind the CHAPTER tab.
- **Last observed:** 5ddfde3 (round 10)

### 33. PR-0079 (major, visual): The remade pause draws its meter columns across Kimahri's face, breaking the mirror rule Bailey named

- **Game / chapter:** both (the side-choice rule is shared plumbing; observed on an FFX member) / 1 (member:kimahri tab)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed. Repair 47149574/1016011a is in this build. The Kimahri stats tab was captured correct only on a later build (gap pass).
- **Expected:** For each member the chrome moves to the empty side of that member's painting, as frame (b) of docs/concepts/pause-until-dawn/sheet.png mocks for Yuna.
- **Observed:** ON 5ddfde3: Re-observed on 5ddfde3: the stats and chapter heading sit over Kimahri's mane and muzzle; the intent chip also covers part of the tab strip (PR-0122). Medium confidence on the mustRemain reading.
- **Repro:** Live site at 1600x900. Chapter 1, battle, Escape, arrow to the KIMAHRI tab. Deterministic, no seed.
- **Evidence:** critic/rounds/round-09/evidence/gaps/pause/seymour-flux-1600x900-5ddfde3-02-tab2-Kimahri.png; critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-02-member-kimahri.png,critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-00-member-tidus.png and critic/rounds/round-08/evidence/ch4/09-pause-Esc.png (the control cases),public/art/pause/kimahri.json focal {x:0.42,y:0.44},critic/rounds/round-08/targets/pause-until-dawn-sheet.jpg; critic/rounds/round-09/evidence/gaps/targets/ch1-pause-kimahri.png; targets-live/ch1-pause-kimahri.png; critic/rounds/round-10/evidence/gaps/ch1-pause-1600/pause-kimahri-tab.png
- **Confidence:** high for the observation; medium for the cause — the side-choice input was not traced past the focal sidecar
- **Requirement:** docs/target/targets.json, tile "Pause remade on the Until Dawn character screen", reaction.mustRemain: "the text block sits on whichever side of THIS painting is empty" (Bailey, 2026-09-21, "B, yes, yes, yes."). RUBRIC section 7: acceptance cases come from mustRemain.
- **Fix:** Make the side choice read the same focal the stage already fetches (src/ui/common/chapterPanel.ts:252-266, applied at 342-345) and flip the chrome when the focal x falls on the chrome's side, rather than using a fixed or per-game side. Kimahri at 0.42 should put the block on the right.
- **Acceptance check:** For all three FFX and all three FFX-2 member tabs at 1600x900, assert the bounding box of the chrome block does not intersect the painting's focal point, and read the six composites against frames (a), (b) and (c) of the approved sheet.
- **Last observed:** 5ddfde3 (round 10)

### 34. PR-0128 (major, visual): Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks

- **Game / chapter:** FFX only / yunalesca (ch2; Tidus's gauge never filled in ch1)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed. Not captured: seed 1 in chapter 1 wipes any line but the chapter's own before Tidus's gauge fills (gap pass).
- **Expected:** The approved tile: a name plate above the panel and tick labels MISS / HIT x2 / HIT x4 / HIT x6.
- **Observed:** The overlay works ("Slice & Dice · SWORDPLAY · CONFIRM IN THE GOLD ZONE", a 1.8 s ring and gold zone; Enter resolved to Spiral Cut). The "G HIDE GUIDE · Yunalesca · NEXT · Waiting for your turn · MORE" card sits over the top-left of the overlay where the name plate belongs, and the bar shows only MISS...HIT.
- **Repro:** Seed 1, chapter 2: play until Tidus's menu shows "Overdrive▸READY" (the gap pass used autoBattle, injected, only to fill the gauge), then ArrowDown to it and Enter.
- **Evidence:** critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/01-tidus-menu.png; critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/02-overdrive-submenu.png; critic/rounds/round-09/evidence/gaps/swordplay-yunalesca-5ddfde3/overlay/f00-f23.jpg; docs/screenshots/mockups/A-swordplay-overlay.jpg; critic/rounds/round-10/evidence/gaps/ch2-win/swordplay-overlay-sheet.jpg
- **Confidence:** medium (one capture; live not captured)
- **Requirement:** RUBRIC §7 target gate (tile "Swordplay Overdrive", docs/screenshots/mockups/A-swordplay-overlay.jpg)
- **Fix:** Hide the guide card, or move it below the overlay, while an Overdrive overlay is up; restore the tick labels from the tile.
- **Acceptance check:** The frame 0.5 s after Enter on Slice & Dice shows the name plate unobstructed and four tick labels.
- **Merged from:** gap capture (visual-targets request)
- **Last observed:** 5ddfde3 (round 10)

### 35. PR-0010 (major, interface): The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest

- **Game / chapter:** both (shared panel) / 1 and 2 shown; anywhere the body overflows
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Either the whole counter list is legible, or the hidden part is signposted and reachable with the keyboard and pad the game is played with - the treatment the strategy guide gets with its MORE chip.
- **Observed:** ON 5ddfde3: Widened: now visible in both games, the intent ODDS list and the FFX counter bullets are cut mid-glyph with no way to read the rest.
- **Repro:** Chapter 2, first player turn, press E, 1600x900, read the IF YOU ATTACK list; repeat at Chapter 1.
- **Evidence:** critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/12-intent-E.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/11-advisor.png; critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png, ch1-07-enemy-intent.png
- **Confidence:** high - visible in two chapters and traced to the cap and the clipped class in the shipped CSS
- **Requirement:** RUBRIC section 6 interface (honest intent that separates certain from conditional); CHK-003 (zero clipped).
- **Fix:** Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.
- **Acceptance check:** At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.
- **Last observed:** 5ddfde3 (round 10)

### 36. PR-0066 (major, interface): The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor

- **Game / chapter:** both / title and chapter select (gates all eight tiles)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** CHK-003 and the change's own acceptance: no text a player must read falls below 14 effective css px, and the title still composes at 390x844.
- **Observed:** ON 5ddfde3: Re-observed on the phone title and board.
- **Repro:** Fresh browser context at 390x844 with no resize down from a larger size. Load the live site, press Enter (or tap the chip) to reach the chapter select, walk every leaf text node under .fe and multiply getComputedStyle(el).fontSize by the accumulated transform scale. No seed involved.
- **Evidence:** critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/03-card.png; critic/rounds/round-07/evidence/gaps/pause/390x844/run.json (titleEff.min 9.54, boardEff.min 9.54, 25 nodes listed); critic/rounds/round-07/evidence/fe/frontend.json; critic/rounds/round-07/evidence/fe/16-title-390x844.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/shapes/390x844/run.json (partyPanelEff)
- **Confidence:** high — measured on the live bundle, and the mechanism is traced in the shipped CSS
- **Requirement:** critic/CHECKS.md CHK-003 pass/fail "zero elements under 14px"; RUBRIC §2 platform goals (phone is a supported shape).
- **Fix:** src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.
- **Acceptance check:** In a fresh 390x844 context the leaf-text sweep over .fe on both the title and the chapter select returns zero elements under 14 effective px, documentElement.scrollWidth === clientWidth, and the re-shot capture shows no clipped or overlapping labels; the same sweep at 1600x900 and 2000x1012 is unchanged.
- **Last observed:** 5ddfde3 (round 10)

### 37. PR-0067 (major, interface): At 390x844 the FINAL FANTASY X-2 group sits below an unmarked clip, and every control hint on that screen names a key

- **Game / chapter:** both (the hidden group is FFX-2) / chapter select; hides ffx2-bahamut, ffx2-vegnagun-shuyin and the Leblanc coming card
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** All eight tiles in both game groups are discoverable at phone size, or the frame says plainly that there is more, in a way a touch player can act on.
- **Observed:** ON 5ddfde3: Re-observed on the phone board.
- **Repro:** Fresh context at 390x844 with touch and mobile emulation. Load the live site, reach the chapter select, screenshot; enumerate [data-action^=fe-card] and compare each getBoundingClientRect().y with .fe-rail's own rect and scrollHeight.
- **Evidence:** critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win-look-phone/03-card.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/board/board-title.json (phoneTop: pageScrollable 0, innerScroller .fe-rail over 158; phoneDown: Down moves the selection to ffx2-bahamut); critic/rounds/round-07/evidence/gaps/board/phone-00-top.png; critic/rounds/round-07/evidence/gaps/board/phone-01-scrolled-bottom.png; critic/rounds/round-07/evidence/gaps/board/phone-03-ffx2-card.png; critic/rounds/round-07/evidence/fe/mouse-start.json (phoneActions: fe-card-5 @ y585, fe-card-6 @ y633)
- **Confidence:** high that the group is off-frame and unannounced and that the hints are keyboard-only; medium that a player fails to find it, because a touch drag was not tried
- **Requirement:** The change's acceptance that every one of the five existing chapters starts from the new chapter select with keyboard, mouse and touch; CHK-010 scope; CHK-020 (chapters 4 and 5 are reviewed first, precisely because they are always reviewed last).
- **Fix:** src/app/screens/frontend/frontend.css gives .fe-rail a fixed height with overflow-y:auto and nothing else in the narrow breakpoint. Smallest useful correction: add a bottom fade mask plus a persistent group indicator — for example pin the two game headings as a two-up switch above the rail, so both games are always visible even when their tiles are not — and add a pointer row to the hint bar. Game case: BOTH, one shared screen, though the group that disappears is the FFX-2 one.
- **Acceptance check:** At 390x844 in a touch context the FINAL FANTASY X-2 heading is visible in the first frame with no gesture; a touch drag on the rail brings IV and V into view; tapping the Bahamut card selects it and the plate then starts Chapter IV.
- **Last observed:** 5ddfde3 (round 10)

### 38. PR-0019 (major, interface): The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending

- **Game / chapter:** both (shared help-slab composition); observed in FFX / 1 (Seymour Flux)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed. Repair b2a66dc4 (FFX only) is in this build; not re-measured.
- **Expected:** 'Inflicts Cheer. Hits the whole party.' with the ALL ALLIES chip clear of the text.
- **Observed:** ON 5ddfde3: Partly re-observed (ch3, 1600x900): with Al Bhed Potion on the party the "ALL ALLIES" chip (13 px) is attached to the top row of the list (HI-POTION), not the selected item, and the item list covers Yuna's bracket.
- **Repro:** 1600x900: Chapter 1, first player turn, Right into SPECIAL, cursor on CHEER, confirm to raise the group target frame, read the help slab.
- **Evidence:** critic/rounds/round-09/evidence/gaps/multitarget/braskas-final-aeon-1600x900-5ddfde3-item-party.png; critic/rounds/round-04/crops/ch1-help-clip.png; evidence/shots/ch1-13-target-all.png
- **Confidence:** high
- **Requirement:** critic/CHECKS.md CHK-009 (every name that can be shown is shown in full) and CHK-010's all-target label. This build also claims every command's help sentence matches its real targeting.
- **Fix:** Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.
- **Acceptance check:** For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.
- **Last observed:** 5ddfde3 (round 10)

### 39. PR-0020 (major, visual): The dialogue plate over-scales every portrait, so a speaker delivers the line with the top of the face cut off (merges PR-0056)

- **Game / chapter:** both / all five
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The portrait fills its slot, cropped to the head, contained by the card frame.
- **Observed:** Confirmed on this build, and PR-0056 (Jecht framed off his face) is merged in as the same root: the portrait image is taller than the plate it sits in and is clipped at the top. Measured overflow: Jecht 398 px, Kimahri 231 px, Braska 176 px, Rikku 24 px. The worst player-visible case is the mid-battle beat in Chapter 1, where Seymour says his line with everything above his nose cut away, which removes the expression the line is carrying.
- **Repro:** Production candidate c71cd82 from D:/pyrefly-release/dist-gate, vite preview, fresh profile, 1600x900, PYREFLY_BROWSER=gpu. Enter each chapter's pre-battle scene and advance line by line with Enter taps, reading .dbox__portrait and the slab rect per line. critic/rounds/round-06/gap-scenes.mjs.
- **Evidence:** critic/rounds/round-07/evidence/ch1/run.json, ch2/run.json, ch3/run.json, ch4/run.json sceneSpeakers overflowPx 231 / 176 / 398 / 24; critic/rounds/round-07/zz-dlg-ffx.jpg; critic/rounds/round-07/zz-dlg-ch1.jpg; critic/rounds/round-07/evidence/frames-ffx/
- **Confidence:** High — measured rects on 48 chapter 1 lines and every chapter 2 line, plus two frames.
- **Requirement:** CHK-012 (the actual crop in its destination), CHK-014 and RUBRIC section 6 visual - this judges the rendering, not the artwork.
- **Fix:** Already written in the tree after this build: commit 71059ae 'Dialogue card: fit every portrait to its slot, fix Jecht, fix phone width', with 8fe4f99 behind it. Nothing new to design — the next deploy should carry it, and this review should verify it there.
- **Acceptance check:** At 1600x900 and 2000x1012, in chapters 1, 4 and 5, the portrait element's bounding rect is fully inside the slab's rect and no pixel of the slot's fill colour is visible around the painting.
- **Last observed:** 5ddfde3 (round 10)

### 40. PR-0063 (major, game-awareness): The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters

- **Game / chapter:** FFX-2 / ffx2-bahamut and ffx2-vegnagun-shuyin (chapter board dossier)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The dossier's faces for an FFX-2 chapter use yuna-x2.png and rikku-x2.png, as the FFX-2 battle HUD in the same session does.
- **Observed:** The dossier renders art/portraits/yuna.png and art/portraits/rikku.png — Yuna in her X summoner look, Rikku in her X Al Bhed goggles — beside Paine, who is X-2 only, so the row is visibly two games at once. The correct assets ship and resolve: public/art/portraits/yuna-x2.png and rikku-x2.png exist and the same live session's Chapter 4 battle requests them. The FFX cards are correct (tidus/yuna/kimahri, tidus/yuna/auron), so the fault is FFX-2-only.
- **Repro:** Title, Enter, ArrowRight until snapshotState().screenState.selectedId === 'ffx2-bahamut', wait for the faces to load, read the .fe-party__face img sources. No seed involved.
- **Evidence:** critic/rounds/round-07/evidence/fe/faces.json (ffx2 block: yuna.png, rikku.png); critic/rounds/round-07/evidence/fe/53-party-row-zoom-ffx2.png; critic/rounds/round-07/evidence/confirm/c2-faces-and-rim.json (per-card faces for all five chapters; all six portraits complete, naturalWidth 832); critic/rounds/round-07/evidence/confirm/c8-ffx2-party-zoom.png; critic/rounds/round-07/evidence/ch4/run.json battleImgs (portraits/yuna-x2.png, portraits/rikku-x2.png)
- **Confidence:** high — independently reproduced by the confirmation pass
- **Requirement:** AGENTS.md hard rule 14 and CHK-021: a change true to FFX does not apply to FFX-2.
- **Fix:** The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.
- **Acceptance check:** With an FFX-2 card selected the dossier face images are yuna-x2.png, rikku-x2.png and paine.png; with an FFX card selected they are tidus.png, yuna.png, kimahri.png (and auron.png on Chapter III).
- **Last observed:** 5ddfde3 (round 10)

### 41. PR-0057 (major, visual): At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line

- **Game / chapter:** both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing) / reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** At phone width the speaker name, the faction plate and the line are readable, and the persistent key-hint bar does not overlap them or overflow the viewport.
- **Observed:** The whole card is compressed into a roughly 60 px strip at the bottom of the 844 px viewport (slot 77x81 at y=747). The .chint bar renders over it: in chapter 5 "ENTER ADVANCE - HOLD ENTER SKIP - ESC MENU" sits across Nooj's name, his YOUTH LEAGUE plate and his line "Baralai carries him."; in chapter 1 the same bar sits across Kimahri's name and line and his portrait is reduced to a sliver. The hint bar is 443 px wide inside a 390 px viewport (x = -27, overflowing 27 px past each edge). Kimahri's image is 94x137 at y=716 against a 77x81 slot at y=747 — larger than its slot in both axes, PR-0020 again at this size. NOT RE-VERIFIED THIS ROUND; commit 71059ae in the tree claims the phone-width half.
- **Repro:** Serve the candidate (D:/pyrefly-release/dist-gate, vite preview). Viewport 390x844, PYREFLY_BROWSER=gpu. Real keys: Enter at the title, ArrowRight x4 for chapter 5 (none for chapter 1), Enter, Enter at party prep. Wait for screen()=="cutscene" AND .dbox--visible AND computed opacity > 0.5 (an earlier capture shows a mid-fade card and must be discarded). Read the .dbox, .dbox__portrait and .chint rects. Deterministic, no seed.
- **Evidence:** critic/rounds/round-06/evidence/gaps/escape/phone-v2.json; critic/rounds/round-06/evidence/gaps/escape/ch5-nooj-no-portrait-390x844-v2.png; critic/rounds/round-06/evidence/gaps/escape/ch1-kimahri-painted-390x844-v2.png; critic/rounds/round-06/gap-phone.mjs
- **Confidence:** High — measured rects plus two frames, reproduced in both games.
- **Requirement:** RUBRIC §5 legibility and CHK-003; the Ink & Gold spec docs/handoff/presentation-ink-and-gold.md — the dialogue card is the primary narrative surface.
- **Fix:** Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.
- **Acceptance check:** At 390x844 in chapters 1 and 5, with .dbox--visible asserted: the .chint rect does not intersect the .dbox__body or the speaker-plate rect, and .chint lies entirely within 0..viewportWidth.
- **Last observed:** 5ddfde3 (round 10)

### 42. PR-0014 (major, visual): HUD portrait chips crop through heads; the monogram half is repaired

- **Game / chapter:** both / 1 to 5
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Every portrait chip shows the whole head with air above the hair and below the chin, consistently framed across the set, and no monogram stands in for a shipped character.
- **Observed:** Half repaired, and that half is verified. Paine is now a painted face everywhere she was a letter monogram: party prep (left list and bottom bar, read at 4x), the pause party bar, the battle HUD chip and results — ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits, and the face is recognisable at chip scale (silver-and-red hair, red eyes, studded collar). The crop half is unchanged: the chips still cut the top of the head on Yuna, Rikku and Paine. PARTIALLY REPAIRED IN THIS BUILD: both Paine idles were replaced and src/ui/common/face-crops.json was re-measured, and Paine's HUD chip now crops her face (portraits/paine.png at 48x70, a 0.684 source aspect into a 0.686 slot, so no distortion either). The FFX half and the rest of the FFX-2 cast were not re-swept, so the ticket stays open.
- **Repro:** 1600x900: Chapter 1 battle, read the CTB list and the party rows; Chapter 3 battle, read Auron's row; Chapter 4, read Paine's battle row, then lose and read her results row, then RETRY and read the prep roster, then Esc and read the pause chips.
- **Evidence:** critic/rounds/round-07/evidence/gaps/art/spotcheck.json (chips); critic/rounds/round-07/evidence/gaps/art/paine-chip-zoom.png; critic/rounds/round-07/targets/zoom-ch4-chips.jpg
- **Confidence:** high
- **Requirement:** critic/CHECKS.md CHK-012 (the visible crop contains the whole head; a fallback never ships as the final face) and CHK-020 (consistent portrait treatment across shared screens). Owner-reported 2026-09-18 ('Auron's HUD portrait is cropped through the chin').
- **Fix:** Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.
- **Acceptance check:** Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.
- **Last observed:** 5ddfde3 (round 10)

### 43. PR-0060 (major, process): The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce

- **Game / chapter:** FFX only / ch.3 (braskas-final-aeon)
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The tile's stated acceptance case, "A dialogue line spoken by Yu Yevon with the portrait showing (public/art/portraits/yu-yevon.png)", is producible from play so the tile can be verified.
- **Observed:** No shipped script gives yu-yevon a say() line. grep -rn "say('yu-yevon'" over src/story/ returns nothing, and a full trace of every say() id in every shipped script does not list it. yu-yevon is declared as a SpeakerId (src/story/dsl.ts:45) and exists as a combatant id, an AI script id and a music/sfx key, but its only story-layer uses are a trigger condition (braskas-final-aeon.ts:221, when: { type: "hp-below", who: "yu-yevon" }) and an fx call (line 349); the lines over his on-field reveal belong to Tidus and then Auron (lines 350-352). public/art/portraits/yu-yevon.png ships at 1.56 MB and can never be displayed as a speaker portrait. The tile's own note already records that the file is a safety net against a 404 rather than a face, which contradicts the acceptance case as written.
- **Repro:** In D:/pyrefly-release: grep -rn "say('yu-yevon'" src/story/ (no matches); grep -rn "yu-yevon" src/story/ (only dsl.ts:45 and braskas-final-aeon.ts 220/221/223/285/305/347/349). Then play chapter 3 to the yu-yevon-arrives trigger and observe the speaker is Tidus, then Auron.
- **Evidence:** critic/rounds/round-06/evidence/gaps/yu-yevon/trace.txt (full grep transcript and the tile record); critic/rounds/round-06/evidence/gaps/audio/ch3-phase-7.png (the arrival itself)
- **Confidence:** High — traced in source, and the tile's own note corroborates it.
- **Requirement:** CHK-012 and RUBRIC §7's approved-target gate — every required tile in docs/target/targets.json must be matched from the build.
- **Fix:** An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.
- **Acceptance check:** Either a captured dialogue frame at 1600x900 shows speaker "Yu Yevon" with yu-yevon.png at naturalWidth > 0, or the tile in docs/target/targets.json carries a delivery state that does not require one.
- **Last observed:** 5ddfde3 (round 10)

### 44. PR-0018 (major, interface): The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)

- **Game / chapter:** FFX (measured); FFX-2 not measured / braskas-final-aeon
- **Tags:** introducedByCandidate false, regressionVsLive false, inNewFeature false
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed. The interface auditor judged the selected rows readable by eye in round 11, but contrast was not measured, so the closure is unproven.
- **Expected:** Every command label at 4.5:1 or better against its own slab.
- **Observed:** ON 5ddfde3: Re-measured on 5ddfde3 (no longer reused): TALK text rgb(184,134,42) is 1.74:1 on the selected gold row and 2.87:1 on the unselected cream row, both under 3:1; ATTACK scores 10.6-17.4:1.
- **Repro:** 1600x900, Chapter 3, first command menu.
- **Evidence:** critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/01-talk-selected.png; critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/02-talk-unselected.png; critic/rounds/round-09/evidence/gaps/talk-contrast-5ddfde3/run.json; critic/rounds/round-09/evidence/e119552/braskas-final-aeon-win/10-first-menu-coach.png
- **Confidence:** high
- **Requirement:** CHK-010.
- **Fix:** As round 08: give selected-and-disabled rows their own token (near-black at reduced opacity, or an inverted slab).
- **Acceptance check:** A contrast sweep of every row state in both games is at 4.5:1 or better.
- **Last observed:** 5ddfde3 (round 10)

### 45. PR-0158 (polish, delivery, was R11-UI-00): Downgraded from critical: a racing debug harness (not a player) can tear an FFX battle down with 'Cannot read properties of null (reading syncHud)'; a real Escape at 0.5-4 s after battle mount is handled correctly

- **Game / chapter:** both-unknown (reproduced in FFX ch1 only) / seymour-flux (reported); others unknown
- **Expected:** Escape at any moment of a battle either opens the pause or is ignored; it never ends the encounter.
- **Observed:** The confirmer built 76f587c3 from git archive (bundle 81kxOXnv), fresh profile, seed 1, real keys only, and pressed Escape 0.5, 1, 2, 3 and 4 s after battle mount in chapters 1 and 6: 10 of 10 with 0 console or page errors (the early presses dismissed the battle-start banner, the later ones opened and closed the pause). The original control script reproduced the TypeError only because it presses KeyZ on the title and then calls __pyrefly.gotoChapter, so two flows race (NOW.md reached the same conclusion, "HARNESS ARTIFACT"). The remaining teardown weakness is hardened in hotfix 12.3 (e11fcdf, b0dd23c), after this build.
- **Repro:** Fresh profile, seed 1, live site: title > board > Seymour Flux > prep > Enter > hold Enter through the scene > press Escape about 0.5 to 3 s after the battle screen appears, before the first command menu. Watch the console and the screen.
- **Evidence:** critic/rounds/round-11/confirm/esc76-ch1.json, esc76-ch6.json and the per-delay JPEGs; critic/rounds/round-11/confirm/control76.mjs; critic/reviews/bcbdb483-live.md lines 88-104
- **Confidence:** high (refuted as a player path by the confirmer on the exact bundle)
- **Requirement:** RUBRIC §3 critical class (an encounter that cannot finish / lost progress); CHK-015 every state where the player can press the key
- **Where (traced):** src/engine/BattlePresenter.ts syncHud call path (suspected; not traced here). Scored under delivery; listed here because it is an input path.
- **Fix:** Guard the pause-open path while the presenter is not yet bound: the hotfix 12.3 worktree already targets this, per NOW.md.
- **Acceptance check:** Real Escape at 0.5, 1, 2, 3 and 4 s after battle mount in ch1 and ch6, on the live build: no console error, pause opens or the key is ignored, and the battle continues.
- **Merged from:** interface R11-UI-00 (critical); confirmer: NOT REPRODUCED through the real flow; refuted as critical

### 46. PR-0162 (polish, interface): Chapter VIII strategy guide reads 'Cid pulls the Tidus's ship out of reach' (the actor substituted into a possessive)

- **Game / chapter:** ffx / evrae-airship
- **Expected:** 'Cid pulls the ship out of reach' (or 'Tidus orders Cid to pull back', as the battle message already says).
- **Observed:** The actor name is templated into 'the {actor}'s ship'.
- **Repro:** Chapter VIII, first menu, press G.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/run.json guideText; 13-guide-G.png
- **Confidence:** high
- **Requirement:** CHK-007; RUBRIC section 6 interface
- **Where (traced):** G guide, Next row for Pull back
- **Fix:** Fix the Pull back and Close in guide template string.
- **Acceptance check:** The guide text for both orders reads grammatically for every actor. A unit test covers the rendered string.
- **Merged from:** feel-narrative; capture owner

### 47. PR-0163 (polish, interface, was R11-UI-08): Evrae's Pull back order is shown as 'Pull back → Tidus', naming the actor as its target

- **Game / chapter:** FFX / evrae-airship (8)
- **Expected:** 'Pull back' with no target, or '→ the ship'.
- **Observed:** The guide and the advisor both print 'Pull back → Tidus', and 'Pull back → Rikku' on Rikku's turn, although the order moves the ship.
- **Repro:** Live, ch8 first menu.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/11-advisor.png
- **Confidence:** medium
- **Requirement:** Readable, legal advice
- **Where (traced):** advisor/guide target naming for the trigger kind (not traced)
- **Fix:** Suppress targetName for self-only trigger rows.
- **Acceptance check:** The ch8 card reads 'Pull back' with no arrow.
- **Merged from:** interface R11-UI-08; capture owner

### 48. PR-0159 (polish, narrative): Chapter VIII dialogue has no contractions in any of its 47 lines, so Tidus, Rikku, Wakka and Cid all sound stilted and alike

- **Game / chapter:** ffx / evrae-airship
- **Expected:** writing-bible section 1.1: Tidus is 'contemporary, casual' (gonna, c'mon). Section 1.8: Rikku is fast and youth-casual. Section 1.5: Wakka ('ya', 'brudda'). The FFX register of chapters 1 to 3.
- **Observed:** 'That is it? We just won?' (Tidus), 'You are welcome.' and 'We are not going in?' (Rikku), 'It is faster. Why is it faster?' (Tidus), 'That is the city shooting at us!' (Cid). There are 0 contractions in 47 says. The other FFX scripts use them in 19 of 57, 14 of 59 and 32 of 76 lines.
- **Repro:** Read src/story/scripts/evrae-airship.ts, or play Chapter VIII's pre-scene.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-scenewalk/run.json; src/story/scripts/evrae-airship.ts (say lines)
- **Confidence:** high
- **Requirement:** RUBRIC section 6 narrative (character voice); writing-bible section 1
- **Where (traced):** pre-scene, mid-battle callouts, aftermath
- **Fix:** A voice pass on the Chapter VIII lines only: restore natural contractions and each speaker's tics. Keep the beats and the line count.
- **Acceptance check:** A re-read against writing-bible section 1 finds Tidus, Rikku and Wakka distinguishable by voice with names hidden. Story tests still pass.

### 49. PR-0160 (polish, narrative): Brother's Al Bhed line prints as plain English, then Rikku 'translates' what the player just read

- **Game / chapter:** ffx / evrae-airship
- **Expected:** writing-bible section 1.8: FFX Al Bhed is shown as untranslated cipher text. Write the line in English, tag it [ALBHED] and encipher it, so Rikku's translation carries the meaning.
- **Observed:** Brother: 'YUNA! Bevelle! They are marrying her to that man!', then Rikku: 'He says Bevelle. He says within the hour.' The script comment flags this as 'uncertain line 1'.
- **Repro:** Chapter VIII pre-scene, lines 5 and 6.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-scenewalk/sp-06-Brother.png; src/story/scripts/evrae-airship.ts (beat 2)
- **Confidence:** high
- **Requirement:** RUBRIC section 6 narrative (faithful beats); writing-bible section 1.8 implementation note
- **Where (traced):** pre-scene beat 2
- **Fix:** Encipher Brother's FFX lines (a DialogueBox or say option) and let Rikku's line carry the content, or have Brother speak in a mix of Al Bhed and English.
- **Acceptance check:** The Chapter VIII pre-scene shows Brother's beat-2 line as Al Bhed cipher, and Rikku's next line conveys Bevelle and 'within the hour'. FFX-2 brother-x2 lines are unchanged.

### 50. PR-0161 (polish, narrative): Chapter 5's Farplane voices (Braska, Auron) are staged as present speakers with full portraits and role plates

- **Game / chapter:** ffx2 / ffx2-vegnagun-shuyin
- **Expected:** writing-bible E7 line 8: 'no visual source — audio only. Two voices out of the Farplane.' The player should read these as voices.
- **Observed:** 'That's my daughter.' shows Braska's full portrait and a HIGH SUMMONER plate, the same card a speaker standing in the room gets. Nothing marks it as a voice from the Farplane.
- **Repro:** Chapter V pre-scene, advance to line 10.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-scenewalk/sp-10-Braska.png, sp-11-Auron.png
- **Confidence:** medium (a staging choice; the approved portrait itself is not in question)
- **Requirement:** RUBRIC section 6 narrative (faithful beats); writing-bible E7 Act 1
- **Where (traced):** pre-scene Act 1, lines 9 and 10
- **Fix:** This is a perceivable change, so it needs options for Bailey first. For example: an off-screen voice treatment (italic text, a 'from the Farplane' plate, a faded or pyrefly-veiled portrait).
- **Acceptance check:** Bailey picks a treatment. Lines 9 and 10 then read as voices, and every other speaker's card is unchanged.

### 51. PR-0164 (polish, visual, was R11-VIS-03): Yunalesca's approved painting edges show as hard straight lines in battle: the attack pose's hair is cut by its canvas edge, and a pale hard-edged rectangle shows over her quad at the hit moment

- **Game / chapter:** FFX only (defect case); a render-side fix would be shared plumbing (both) / yunalesca (II)
- **Expected:** CHK-013: approved art renders without visible artefacts.
- **Observed:** Vertical cut at the left and horizontal cut at the top of her hair (crop visual/ch2-yunalesca-hurt-crop.png). public/art/characters/yunalesca-1/attack.png has opaque hair pixels touching x=0 and the top edge. The file matches its approved hash, so this is not a regression.
- **Repro:** Chapter II at 2000x1012 (seed 1): wait for Yunalesca's attack.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/yunalesca-win-2000/23-midfight.png; D:/Final Fantasy/critic/rounds/round-11/visual/yunalesca-1-attack-on-magenta.png
- **Confidence:** high
- **Requirement:** CHK-013; approved art protection (do not regenerate)
- **Where (traced):** battle, Yunalesca's attack pose, 2000x1012
- **Fix:** Do not replace the painting. Either feather alpha within a few pixels of each character quad's border in the sprite shader, or put an outpainted edge extension to Bailey as an explicit revision.
- **Acceptance check:** Ch2 attack frame at 2000x1012: no straight hard edge through the hair; the approved file stays byte-identical, or Bailey records a revision.
- **Merged from:** visual R11-VIS-03; capture owner (pale rectangle at the hit moment)

### 52. PR-0135 (polish, visual): Hard side strips beside the 16:9 battle view at 2000x1012: dark in FFX-2, a flat purple strip in chapter 2 (FFX)

- **Game / chapter:** FFX-2 only / ffx2-bahamut (and ch5, ch6 for the strips)
- **Expected:** Clean painting; full-bleed field.
- **Observed:** White blotches in Bahamut's wings. The field and the help band stop at x=100 and x=1900.
- **Repro:** Ch4 at 2000x1012.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/evidence/ffx2-bahamut-win-2000/16b-after-cancel.png
- **Confidence:** high
- **Requirement:** CHK-013; RUBRIC §5 layout shapes
- **Where (traced):** battle at 2000x1012
- **Fix:** As filed in round 10.
- **Acceptance check:** As filed in round 10.
- **Merged from:** visual PR-0135/R10-VIS-01; capture owner (chapter 2 pillarbox)

### 53. PR-0137 (polish, visual): Bahamut's painting has un-removed white matte holes between wings and body, which bloom turns into glowing blotches

- **Game / chapter:** FFX-2 only / ffx2-bahamut
- **Round 11:** Re-observed in round 11: Bahamut shows white matte holes (critic/rounds/round-11/evidence/ffx2-bahamut-win-2000/16b-after-cancel.png).
- **Expected:** A clean cutout.
- **Observed:** Enclosed near-white regions in art/characters/ffx2-bahamut/idle.png (not an approved file) glow in play.
- **Repro:** 2000x1012, chapter 4, first menu.
- **Evidence:** critic/rounds/round-09/targets/5ddfde3/crop-ch4-bahamut.png; critic/rounds/round-09/targets/5ddfde3/src-ffx2-bahamut-idle.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §6 visual craft
- **Fix:** Re-matte the enclosed background regions of the Bahamut states; Bailey owns any art pick.
- **Acceptance check:** No near-white enclosed regions in the idle's alpha, no glowing blotches in play.
- **Merged from:** visual R09b-VIS-04
- **Last observed:** 76f587c3 (round 11)

### 54. PR-0058 (polish, narrative): Some speakers still talk on a portrait-less card (PR-0058 family): Brother in Evrae, Gippal and Shinra in chapter 5

- **Game / chapter:** both / 8 (Brother), 5 (Gippal pre-scene, Shinra at the seam into link 5)
- **Round 11:** The visual auditor judged the Gippal (chapter 5) and FFX Brother text cards intentional; Shinra's is not accounted for. Question for Bailey or the portrait records, not a build defect until one says it should have a portrait.
- **Expected:** Every speaking character has an approved portrait, or the card is designed for a voice-only line
- **Observed:** The dbox__portrait element is empty for these speakers. Nooj (ch5) and Brother (ch6, FFX-2 art) now have portraits, so those parts are repaired.
- **Repro:** LIVE, walk the pre-scenes line by line
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-scenewalk/run.json; ffx2-vegnagun-shuyin-scenewalk/run.json; ffx2-vegnagun-shuyin-win/20-link-5.png
- **Confidence:** high
- **Fix:** Add portraits through the options process, or give the portrait-less card a deliberate layout.
- **Acceptance check:** The scenewalk reports a portrait for every speaker.

### 55. PR-0115 (polish, interface): P opens the pause but does not close it, and P over a pre-battle cutscene does nothing (Esc works in both)

- **Game / chapter:** both / all runs
- **Expected:** P toggles, like Esc.
- **Observed:** pClose false in every route run (both games, all three sizes).
- **Repro:** Live, any chapter: P, then P.
- **Evidence:** critic/rounds/round-11/evidence/*/run.json steps[k=pause].v.pClose
- **Confidence:** high
- **Requirement:** CHK-015
- **Where (traced):** pause input handling (not traced)
- **Fix:** Treat P as a toggle in the pause screen's key handler.
- **Acceptance check:** Real P twice returns screen=battle in both games.
- **Merged from:** interface; capture owner CHK-015

### 56. PR-0165 (polish, interface): The chapter board lists VIII above the COMING VII card, and the COMING card cannot be focused

- **Game / chapter:** FFX / board
- **Expected:** Numeric order (VII before VIII), or an explicit design decision
- **Observed:** Order in the FFX group: I, II, III, VIII, then 'Seymour and Anima — Coming'. Real-key walks never land on the COMING card.
- **Repro:** LIVE, board
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/a2-35-board-reload.png
- **Confidence:** high
- **Fix:** Sort COMING rows by chapter number.
- **Acceptance check:** The board shows VII before VIII.

### 57. PR-0007 (polish, encounter): PR-0007 (carried, recommend reclassify to information): Zombie then Full-Life leaves no counter-play window because of sourced CTB math, not a mechanics defect

- **Game / chapter:** FFX only / seymour-flux
- **Expected:** The guide or intent tells the player that the answer is getting ahead on CTB (Haste, pre-emptive Holy Water), not reacting afterwards.
- **Observed:** The FFX CTB and AI code is unchanged since round 10. research/ffx-seymour-flux line 279 gives both actors Agility 38, and line 655 says 'Requires beating it on CTB — high Agility or Haste'. docs/plans/pr-0007-method-check.md re-scopes the fix to information.
- **Repro:** Chapter I, any seed; Lance of Atrophy lands Zombie and the mount's Full-Life follows with no party turn between.
- **Evidence:** reused: critic/rounds/round-10.json PR-0007; docs/plans/pr-0007-method-check.md; research/ffx-seymour-flux.md lines 279, 655
- **Confidence:** high on the sourcing
- **Requirement:** RUBRIC §5 (never penalise canon); §6 interface (honest information)
- **Fix:** Close as a combat/encounter defect. Carry the wording change to the interface/onboarding batch, with options shown to Bailey (hard rule 9).
- **Acceptance check:** Bailey picks a wording, and the guide shows it in Chapter 1.

### 58. PR-0124 (polish, combat): PR-0124 (narrowed): the MP overflow is fixed on live; the dressphere a girl wears still reverts at a chain seam, and whether it should is unsourced

- **Game / chapter:** FFX-2 only / ffx2-leblanc links 2-3; ffx2-vegnagun-shuyin links 2-5
- **Expected:** A decision: Bailey, or a one-battle check on a real copy (§8.2).
- **Observed:** Rikku ends link 1 of ch6 as White Mage and starts Act II as Thief at 106/106 MP (clamped). In ch5 she ends link 1 as Black Mage at 1,250/1,250 HP and starts link 2 as Dark Knight at 1,250/5,652 HP, because HP carries by value into a dressphere with a larger bar. research/ffx2-combat-core §8.2 records the carry as a [gap] after searching more than 16 sources.
- **Repro:** Chapter VI, Wait, seed 1: CHANGE Rikku Thief to White Mage in Act I, win Act I, read her row at the Act II first menu.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/turn-log.json turns 20-22; ffx2-vegnagun-shuyin-win/turn-log.json turns 53-55
- **Confidence:** high on the observation; the requirement is unsourced
- **Requirement:** AGENTS.md hard rule 6 (unsourced goes to Bailey)
- **Fix:** Ask Bailey or check on a real copy. If the dressphere should carry, carry currentDressphere in BattleScreenSetup.carryFfx2.
- **Acceptance check:** A recorded decision; then a seam test for the chosen behaviour.

### 59. PR-0145 (polish, combat): PR-0145 (carried, re-probed): all three girls petrified is not an immediate Game Over; the helpless party is beaten down over 23-60 s

- **Game / chapter:** FFX-2 only / ffx2-leblanc logos/last room; ffx2-vegnagun-shuyin tail
- **Expected:** Immediate Game Over when every party member is Petrified (ffx2-combat-core §2.8, [verified: 2 sources]).
- **Observed:** The round-10 probe re-run on 76f587c3 gives defeat after 40, 48, 60 and 23 game seconds, with 11-27 enemy actions against a fully petrified party.
- **Repro:** critic/rounds/round-11/combat/r11p/probe-petrify.test.ts (set-up via engine internals)
- **Evidence:** critic/rounds/round-11/combat/probe-petrify.json
- **Confidence:** high
- **Requirement:** research ffx2-combat-core §2.8
- **Fix:** End the battle as a defeat when no living party member is free of Petrify.
- **Acceptance check:** The probe reports defeat with 0 enemy actions after all three are petrified.

### 60. PR-0076 (polish, encounter): PR-0076 (carried): under the opt-in Active mode, chapters 5 and 6 are rarely won at human decision speed

- **Game / chapter:** FFX-2 only / ffx2-vegnagun-shuyin, ffx2-leblanc
- **Expected:** Disclosed, as Bailey chose Wait as the default; Active stays the other setting.
- **Observed:** Fresh bench: Active at 1,500 / 4,000 ms wins ch5 5/40 and 0/40, and ch6 5/40 and 0/40. Wait, the default by D-029, wins 40/40 at every decision time.
- **Repro:** critic bench ffx2-wait with PYREFLY_MEASURE=1
- **Evidence:** critic/rounds/round-11/combat/bench-ffx2-wait.log
- **Confidence:** high
- **Requirement:** D-029
- **Fix:** No change without Bailey. Optionally, a line in the X-2 BATTLE option's help saying Active is the harder setting.
- **Acceptance check:** Bailey's wording decision

### 61. PR-0105 (polish, combat): Under Active, an enemy hit keeps the chained girl's command menu open; §1.5 says the hit closes it and applies Delay, and the deviation is not recorded

- **Game / chapter:** ffx2 / All FFX-2 chapters with Config = Active
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** research/ffx2-combat-core.md §1.5 [single source: Split Infinity G0913]: under Active, 'an enemy hit landing while a menu is open closes the menu and applies Delay effect' to that character. Either build that, or record the departure as an owner decision.
- **Observed:** ON 5ddfde3: Code unchanged e119552..5ddfde3 (git diff src/battle/ffx2 touches only formulas.ts step 20).
- **Repro:** Read §1.5 against src/battle/ffx2/active.ts ownsInput() (line 94) and the preflight.
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; git show 15385ab; docs/plans/ffx2-active-menu-review.md line 16
- **Confidence:** medium
- **Requirement:** AGENTS.md hard rule 6 / RUBRIC §2 (a departure from a source is written down, not silent)
- **Fix:** Add a decisions.json entry that puts the §1.5 departure to Bailey, with the measured cost of each option, or implement close plus Delay under Active only.
- **Acceptance check:** A decisions.json entry names §1.5 and Bailey's answer, or a unit test shows an Active menu closed by an enemy hit with Delay applied.
- **Last observed:** 5ddfde3 (round 10), reused

### 62. PR-0106 (polish, combat): The same 'After her [N] turn' wording is read two ways in Leblanc's script, and the failsafe reading is not labelled

- **Game / chapter:** ffx2 / ffx2-leblanc Act III
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** One reading of the source phrase, or the second reading labelled AUTHORED with its reason (§5.3 does not say which).
- **Observed:** ON 5ddfde3: Code unchanged.
- **Repro:** src/battle/ffx2/ai/leblanc-syndicate.ts:180 against :166; tests/unit/chapters/leblanc-engine.test.ts:256.
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; source trace
- **Confidence:** medium
- **Requirement:** AGENTS.md hard rule 6 (label authored readings)
- **Fix:** Label the failsafe reading AUTHORED in the comment and the test name, or make it fire on the single turn 25+uses.
- **Acceptance check:** The comment and the test name the reading and its source line.
- **Last observed:** 5ddfde3 (round 10), reused

### 63. PR-0107 (polish, combat): Acts II and III open with every ATB gauge at zero, although they are separate battles

- **Game / chapter:** ffx2 / ffx2-leblanc Acts II and III
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** §2 makes the three Chateau fights separate battles (puzzles and scenes in between). §1.6 [single source]: a normal battle starts every bar at a randomised level.
- **Observed:** ON 5ddfde3: Code unchanged.
- **Repro:** src/battle/ffx2/setup.ts:171; src/app/screens/BattleScreenSetup.ts:92; capture battle-log.json seq 0.
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/battle-log.json (first atb snapshot, all fill 0)
- **Confidence:** high for the behaviour; low impact
- **Requirement:** research §1.6
- **Fix:** Let a group flag its link as a separate battle, so it gets 'normal' randomised gauges while keeping carried HP and MP. Chapter 6 only; the chapter 5 chain is out of scope.
- **Acceptance check:** Across seeds 1-20, the first actor of Acts II and III varies and opening fills are between 0 and 60% of required.
- **Last observed:** 5ddfde3 (round 10), reused

### 64. PR-0108 (polish, combat): The Fast-speed Sleep rule from §1.5 is neither built nor recorded as left out

- **Game / chapter:** ffx2 / All FFX-2 chapters, Config ATB SPEED = FAST
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** §1.5 [single source: Split Infinity G1004]: at Fast, units put to Sleep never wake on their own. Bailey approved the row as 'fine if it's faithful'.
- **Observed:** ON 5ddfde3: Code unchanged.
- **Repro:** grep for sleep/fast in src/battle/ffx2 (no handling).
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; source trace
- **Confidence:** medium (low reachability in chapters 4-6)
- **Requirement:** Bailey's approval condition for the ATB SPEED row; AGENTS.md hard rule 6
- **Fix:** Implement the rule (Sleep has no timed expiry at Fast), or record the omission as a decision.
- **Acceptance check:** A unit test at Fast shows Sleep persisting past its Normal-speed duration, or a decisions.json entry records the omission.
- **Last observed:** 5ddfde3 (round 10), reused

### 65. PR-0069 (polish, combat): The possessed-aeon mirror does not mirror affinities, although the source comment says it does

- **Game / chapter:** FFX / 3 (Braska's Final Aeon, the possessed-aeon links)
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** The shipped code and the comment above it describe the same behaviour.
- **Observed:** ON 5ddfde3: Code unchanged.
- **Repro:** Read src/battle/ffx/setup.ts:235-253 and src/battle/common/types.ts:2353-2372 at 8f48237.
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx; src/battle/ffx/setup.ts:235 (the comment) and :247 (c.affinities = { ...c.affinities }); src/battle/common/types.ts:2353-2372 (AeonBuild has no affinities field)
- **Confidence:** high for the trace; the player impact is none observed
- **Requirement:** AGENTS.md hard rule 6 (never invent game data) and RUBRIC §5 (a claim is matched to its proof).
- **Fix:** Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.
- **Acceptance check:** The comment and the code agree, and a unit test asserts whichever behaviour is chosen for one possessed aeon.
- **Last observed:** 5ddfde3 (round 10), reused

### 66. PR-0054 (polish, combat): The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference

- **Game / chapter:** FFX-2 / ffx2-vegnagun-shuyin, link 2
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** Each of the three Action1 branches behaves as its source line states, and anything extrapolated is marked as an inference.
- **Observed:** ON 5ddfde3: Code unchanged.
- **Repro:** Read research/ffx2-vegnagun-shuyin.md lines 708-711 against src/battle/ffx2/ai/vegnagun.ts legAction1 (lines 72-87).
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx2; research/ffx2-vegnagun-shuyin.md:708-711; src/battle/ffx2/ai/vegnagun.ts:72-87
- **Confidence:** High on the divergence (both texts read directly). Low player impact: reaching the state needs all three girls already Petrified.
- **Requirement:** AGENTS.md hard rule 6: numbers and behaviour come from research/*.md with their source notes; unsourced behaviour is left alone and said so.
- **Fix:** Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.
- **Acceptance check:** The comment at src/battle/ffx2/ai/vegnagun.ts distinguishes the two sourced fallbacks from the inferred one, or a source line is cited for the Break case.
- **Last observed:** 5ddfde3 (round 10), reused

### 67. PR-0053 (polish, combat): A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation

- **Game / chapter:** FFX-2 / ffx2-vegnagun-shuyin
- **Round 11:** Carried, code unchanged since round 10 (combat auditor dependency argument: git diff 5ddfde3..76f587c3 touches none of the code this depends on).
- **Expected:** Every issue the round raised reaches the report with its full record.
- **Observed:** ON 5ddfde3: Code unchanged.
- **Repro:** n/a — the record is missing, not the behaviour.
- **Evidence:** git diff e119552 5ddfde3 -- src/battle/ffx; critic/rounds/round-06/bench/out/z06-all.txt; the combat-encounter auditor's category evidence in this report
- **Confidence:** UNVERIFIED as a product defect. The ID is reserved and open so it is not silently lost; recover the record from the combat auditor's evidence before any repair, and close it as withdrawn if it cannot be restated.
- **Requirement:** RUBRIC §8: every finding carries expected versus observed, repro, evidence and a fix. This one does not, and is recorded as a tracked gap rather than written up from guesswork.
- **Fix:** Recover or re-derive the record before the next batch; do not repair anything on this entry alone.
- **Acceptance check:** The issue is either restated with expected, observed, repro and evidence, or closed as withdrawn.
- **Last observed:** 5ddfde3 (round 10), reused

### 68. PR-0104 (polish, feel): PR-0104 (carried): under Wait, a confirmed FFX-2 command does not visibly resolve before the next girl's cut-in and menu

- **Game / chapter:** ffx2 / ffx2-leblanc (re-observed); same mechanism in ch4 and ch5
- **Expected:** The action lands before the next menu (the faithful top-level/submenu split, deferred by Bailey).
- **Observed:** Grenade is confirmed. Paine's first-turn cut-in starts at 0.57 s and her menu is up at 1.26 s, and no Grenade impact is visible through 2.19 s.
- **Repro:** Chapter VI, seed 1, Wait mode: confirm Grenade with Yuna and record 200 ms frames.
- **Evidence:** critic/rounds/round-11/feel-narr/ffx2-leblanc-win__seq-party-action.jpg
- **Confidence:** high
- **Requirement:** RUBRIC section 6 feel (action and reaction timing)
- **Where (traced):** battle, party command confirm
- **Fix:** As decided: build the deferred faithful split in the release that takes it.
- **Acceptance check:** A frame sequence shows the confirmed action's number before the next girl's menu opens.

### 69. PR-0133 (polish, narrative): PR-0133 (carried): aftermath scenes stage nothing but the backdrop

- **Game / chapter:** both / ffx2-vegnagun-shuyin (re-observed); all aftermaths
- **Expected:** The aftermath shows what its script stages, or the script is written for a still.
- **Observed:** 30-post-scene.png and 33-after-confirm-scene.png of ch5 show only the Farplane glen and the prompt bar. The E5 post beats play over an empty painting.
- **Repro:** Win Chapter V, then watch the post scene.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/30-post-scene.png, 33-after-confirm-scene.png
- **Confidence:** high
- **Requirement:** RUBRIC section 6 narrative (a satisfying aftermath)
- **Where (traced):** post-battle scene
- **Fix:** As round 10: a design decision (proposal P-09-7) first.
- **Acceptance check:** The chosen staging is visible in the ch5 and ch6 aftermath captures.

### 70. PR-0102 (polish, narrative): PR-0102 (carried): '*better*' asterisks are still in Leblanc's aftermath line

- **Game / chapter:** ffx2 / ffx2-leblanc
- **Expected:** No literal markup on screen.
- **Observed:** src/story/scripts/ffx2-leblanc.ts:260 still reads "I had the *better* half, dearie." (traced; not captured on screen this round).
- **Repro:** Win Chapter VI, advance the aftermath to beat 13.
- **Evidence:** src/story/scripts/ffx2-leblanc.ts:260
- **Confidence:** high
- **Requirement:** CHK-007; RUBRIC section 6 narrative
- **Where (traced):** post-battle scene, beat 13
- **Fix:** Drop the asterisks.
- **Acceptance check:** The line renders without asterisks in an aftermath scenewalk.

### 71. PR-0134 (polish, narrative): PR-0134 (carried): the Chapter VI card's BOSS row reads 'Ormi + Dr. Goon + Fem-Goon'

- **Game / chapter:** ffx2 / ffx2-leblanc
- **Expected:** The card names the Syndicate or the three acts.
- **Observed:** dossier: 'BOSS Ormi + Dr. Goon + Fem-Goon' on a card titled 'Leblanc'.
- **Repro:** Chapter select, arrow to VI.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/run.json dossier; 03-card.png
- **Confidence:** high
- **Requirement:** RUBRIC section 6 narrative (context)
- **Where (traced):** chapter select card
- **Fix:** List Leblanc, Logos and Ormi (or the three acts).
- **Acceptance check:** The VI card's BOSS row names Leblanc.

### 72. PR-0147 (polish, narrative): PR-0147 (carried): all three Leblanc acts play in the one heart room, after the seam line '...Okay. Next room.'

- **Game / chapter:** ffx2 / ffx2-leblanc
- **Expected:** Each act reads as a new room, or the line does not promise one.
- **Observed:** seq-seam-2 settles in the same heart-sign room as Act I.
- **Repro:** Chapter VI, clear Act I.
- **Evidence:** critic/rounds/round-11/feel-narr/ffx2-leblanc-win__seq-seam-2.jpg
- **Confidence:** high
- **Requirement:** RUBRIC section 6 narrative
- **Where (traced):** chain seams 1->2 and 2->3
- **Fix:** Reword the seam line (the cheap fix), or offer Bailey per-act backdrop options.
- **Acceptance check:** The line and the stage agree in a seam capture.

### 73. PR-0100 (polish, audio): 52 audition candidate files (34.2 MB) are publicly served under audio/candidates, 5 more than last round (the Evrae range and modern-renderer sketches), and qa.mjs --strict exits 1 on them

- **Game / chapter:** both / n/a (artifact hygiene)
- **Expected:** Only manifest cues ship, and the strict audio gate (CHK-001 step 1) is green on the shipped artifact.
- **Observed:** The live artifact lists 52 audio/candidates files (34,231,056 bytes); I fetched all 52 and all match their sha256. With them in place, qa.mjs (76f587c3) --strict reports 52 orphans and exits 1; without them it exits 0 with 0 findings. Shipped audio/ totals 73.5 MB, of which the game uses 39.2 MB. The 5 new files are evrae-far, evrae-near, evrae-range-crossfade, modern-boss-evrae and modern-scene-fahrenheit.
- **Repro:** List the audio/candidates entries in critic/artifacts/76f587c3.json; then run node tools/audio/qa.mjs --strict against a public/audio holding the live files; echo $? prints 1.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/audio/qa-live-with-candidates.txt; D:/Final Fantasy/critic/rounds/round-11/audio/qa-live.txt; D:/Final Fantasy/critic/rounds/round-11/evidence/logs/live-artifact-manifest.json
- **Confidence:** high
- **Requirement:** CHK-001 step 1 (qa --strict green); CHK-017 artifact contents
- **Where (traced):** public/audio/candidates/
- **Fix:** Move public/audio/candidates to docs/audio/audition/candidates and update docs/audio/audition.html's relative links (and its generator), or exclude audio/candidates from the build copy.
- **Acceptance check:** A fresh vite build has no audio/candidates directory, and qa.mjs --strict exits 0 against it.

### 74. PR-0039 (polish, audio): Three shipped cues still depart from the THEMES bible: no tempo map on scene-gagazet, scene-dreams-end and scene-farplane; FAREWELL_RISE absent from scene-dreams-end; scene-farplane in E minor against the map's E major (carried; the 3 new cues pass)

- **Game / chapter:** both (scene-gagazet and scene-dreams-end are FFX cues; scene-farplane is FFX-2; the cause is shared renderer plumbing) / pre-battle scenes of chapters 1, 3 and 5 (and chapter 6's borrowed aftermath)
- **Expected:** docs/audio/THEMES.md: a lyrical cue carries a tempo map, or is listed in TEMPO_MAP_EXEMPT with a reason, and each cue matches its cue-map key and themes.
- **Observed:** themes-audit.mjs at 76f587c3 reports '3 of 24 cue(s) depart from the bible'. These are the same three as rounds 09 and 10, with byte-identical MP3s. scene-fahrenheit, boss-evrae and boss-seymour-macalania pass.
- **Repro:** node tools/audio/themes-audit.mjs on a 76f587c3 checkout.
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/audio/themes-audit-76f587c3.txt
- **Confidence:** high on the technical finding; whether it matters musically is Bailey's ear (CHK-B1)
- **Requirement:** docs/audio/THEMES.md (Renderer requests #1, cue map rows 10, 12, 14)
- **Where (traced):** src/audio/tracks/scene-gagazet.ts, scene-dreams-end.ts, scene-farplane.ts
- **Fix:** Implement the requested Track.tempo curve for these three, or exempt any cue an arranger judges fine with a static pulse, with a reason. Fold this into the PR-0148 re-render so nothing is re-rendered twice.
- **Acceptance check:** themes-audit reports 0 of 24 departing, and Bailey signs off the re-rendered cues.

### 75. PR-0117 (polish, interface): Phone pause: the chapter eyebrow is printed over the GARMENT GRID row, and the grid name is cut ('PROTECTION ...')

- **Game / chapter:** FFX-2 / ffx2-bahamut (4) (previously ch6)
- **Expected:** The eyebrow sits below the stats with no overlap.
- **Observed:** At 390x844 the 'CHAPTER IV · BEVELLE UNDERGROUND — SOMETHING SHE NAMED' eyebrow overlaps the DRESSPHERE/GARMENT GRID rows.
- **Repro:** Live, 390x844, ch4 first menu, Esc.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/14-pause-Esc.png
- **Confidence:** high
- **Requirement:** CHK-008/CHK-009 on the pause
- **Where (traced):** pause phone layout (not traced)
- **Fix:** Reserve the eyebrow's height in the phone stats column, or let the stats scroll.
- **Acceptance check:** At 390x844 in ch4 and ch6, no rect overlap between the eyebrow and any stat row, and no ellipsis on the grid name.

### 76. PR-0130 (polish, interface): After E, the FFX advisor card folds but its 'N HIDE MOVES' chip stays alone mid-screen, and the chip still says HIDE

- **Game / chapter:** FFX / seymour-flux (1), yunalesca (2)
- **Expected:** The chip goes with the card, or reads SHOW.
- **Observed:** With the intent open, the card is gone and the chip floats (bottom centre in ch1, mid-top in ch2).
- **Repro:** Live, ch1 first menu, press E.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/12-intent-E.png; yunalesca-win-2000/12-intent-E.png
- **Confidence:** high
- **Requirement:** CHK-006
- **Where (traced):** FFX HUD advisor placement (not traced)
- **Fix:** Hide the chip whenever the card declines placement.
- **Acceptance check:** After E in ch1 and ch2, no visible .mad chip without its card.

### 77. PR-0168 (polish, interface, was R11-UI-04): The pause CHAPTER tab's SCENE row prints the internal scene key ('LEBLANC LAST ROOM', 'EVRAE AIRSHIP DECK', 'BEVELLE UN...')

- **Game / chapter:** both / all (seen in ch1, 4, 6, 8)
- **Expected:** Player-facing names only, or no row.
- **Observed:** The SCENE value is ctx.sceneKey with dashes turned into spaces, so it shows developer ids that repeat the location heading.
- **Repro:** Live, any chapter: Esc during the pre-battle scene, CHAPTER tab.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/05b-scene-esc.png; evrae-airship-win/05b-scene-esc.png; ffx2-bahamut-win-look-phone/05b-scene-esc.png
- **Confidence:** high
- **Requirement:** CHK-007
- **Where (traced):** src/app/screens/pause/panels.ts:247
- **Fix:** Drop the Scene row, or map the key to the chapter's location title.
- **Acceptance check:** No pause text matches a scenes/index.ts key with its dashes spaced out.

### 78. PR-0169 (polish, interface, was R11-UI-05): The advisor badges a move 'GUIDE'S PICK' while the guide card beside it names a different move

- **Game / chapter:** FFX-2 / ffx2-vegnagun-shuyin (5), link 1 first menu
- **Expected:** One 'guide' voice, or a badge whose wording does not claim the guide's endorsement when the guide disagrees.
- **Observed:** The guide card says 'NEXT YUNA Pray → the party'; the advisor card says 'Light Curtain → the party GUIDE'S PICK'. The badge comes from the chapter tactic (source 'tactic'), not from the guide the player is reading.
- **Repro:** Live, ch5, seed 1, first menu at 1600x900.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/11-advisor.png; run.json guideText/advisorText
- **Confidence:** high (observed); impact medium
- **Requirement:** Legal and useful advice (RUBRIC §2: guide and advisor are separate capabilities)
- **Where (traced):** src/ui/common/MoveAdvisor.ts:591
- **Fix:** Show the badge only when the suggestion equals the guide's NEXT row, or rename it (for example 'Chapter plan').
- **Acceptance check:** Over a ch5 route, no frame shows the badge on a move that differs from the guide card's NEXT.

### 79. PR-0170 (polish, interface, was R11-UI-07): A command with one valid target fires at once, with no target step and no way to back out

- **Game / chapter:** both / evrae-airship (8), yunalesca (2), ffx2-bahamut (4)
- **Expected:** A target confirmation with cancel, even for one target (whether FFX/FFX-2 do this is not in research/, so this is a usability finding, not a fidelity claim).
- **Observed:** Choosing ATTACK against a lone enemy commits immediately (ch8: damage 386 already on screen, targets 0), and the Escape meant as a cancel opens the pause instead (afterTargetCancel paused true in ch2 and ch8).
- **Repro:** Live, ch8 first menu: ATTACK, Enter.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/16-target-single.png; logs/ch8-win.log afterTargetCancel
- **Confidence:** high (observed); FFX/FFX-2 canon unsourced
- **Requirement:** Reliable input (interface)
- **Where (traced):** src/ui/ffx/CommandMenuLogic.ts:176 (mode 'auto'), shared by src/ui/ffx2/CommandMenu.ts:535
- **Fix:** Open the single target step with the one target preselected (Enter still confirms at once).
- **Acceptance check:** In ch8, ATTACK then Escape returns to the command rows with no action taken; ATTACK, Enter, Enter attacks.

### 80. PR-0171 (polish, interface, was R11-UI-06): Pause CHAPTER tab over a scene: an empty 'THE PARTY' heading, and the text column crosses the hero plate's face

- **Game / chapter:** both / seymour-flux (1), ffx2-leblanc (6), ffx2-bahamut (4), evrae-airship (8)
- **Expected:** Headings only with content; the plate's face clear of the text column (the pause-faces tile applies the clearance rule to member tabs).
- **Observed:** The 'THE PARTY' heading has nothing under it in every pre-battle pause. In ch1 the quote and thumbnails sit across Tidus's eyes and mouth; in ch6 the caption lies over Leblanc's eye.
- **Repro:** Live, Esc during the ch1 or ch6 pre-battle scene at 1600x900.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/05b-scene-esc.png; ffx2-leblanc-win/05b-scene-esc.png
- **Confidence:** medium (the face-over-text judgment depends on the approved CHAPTER tab layout)
- **Requirement:** Pause usability; pause-faces tile
- **Where (traced):** src/app/screens/pause (CHAPTER tab markup; not traced)
- **Fix:** Hide the empty section; extend the face-clearance framing to the CHAPTER tab's hero plate.
- **Acceptance check:** Pre-battle CHAPTER tab in all seven chapters: no empty headings and no face box under the text column.

### 81. PR-0074 (polish, interface): The advisor's composed sentences are still broken or repetitive English

- **Game / chapter:** both / ffx2-leblanc (6), braskas-final-aeon (3), ffx2-bahamut (4)
- **Expected:** One plain sentence per reason.
- **Observed:** 'It finishes Fem-Goon, and 565 damage.'; 'It puts Max Hp X2 on the party, and Left-Arm Strike is worth about 2490.'; 'Inflicts Shell / It puts Shell on the party.'
- **Repro:** Live first menus of ch6, ch3 and ch4.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/11-advisor.png; braskas-final-aeon-win/16-target-single.png; ffx2-bahamut-win-2000/11-advisor.png
- **Confidence:** high
- **Requirement:** CHK-007
- **Where (traced):** advisor reason composer (not traced)
- **Fix:** Template per effect kind; drop the duplicated effect line.
- **Acceptance check:** A copy sweep over 300 advisor cards finds no 'and N damage' or duplicated status sentence.

### 82. PR-0027 (polish, interface): Literal asterisks in the Yunalesca intent counter: 'the target *she* last picked'

- **Game / chapter:** FFX / yunalesca (2)
- **Expected:** Plain or emphasised text without asterisks.
- **Observed:** Unrendered markdown in the IF YOU ATTACK list.
- **Repro:** Live, ch2 first menu, E.
- **Evidence:** critic/rounds/round-11/evidence/yunalesca-win-2000/12-intent-E.png
- **Confidence:** high
- **Requirement:** CHK-007
- **Where (traced):** src/battle/ffx/intent.ts:355
- **Fix:** Remove the asterisks from the string.
- **Acceptance check:** No '*' in any visible intent text.

### 83. PR-0026 (polish, interface): The chapter 1 guide still leads with 'Haste is ctb x 8/16'

- **Game / chapter:** FFX / seymour-flux (1)
- **Expected:** Player language ('Haste roughly doubles your turns').
- **Observed:** The guideText opens its reason with engine notation.
- **Repro:** Live, ch1 first menu, G then MORE.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/run.json guideText
- **Confidence:** high
- **Requirement:** CHK-007
- **Where (traced):** src/data/guides (ch1; not traced)
- **Fix:** Reword the line.
- **Acceptance check:** Guide text has no 'ctb x'.

### 84. PR-0112 (polish, interface): Phone pause labels are still cut with ellipses ('MASTER VOLUM...', 'BEVELLE UN...'), and the CHAPTER tab objectives wrap in a narrow column

- **Game / chapter:** both / ffx2-bahamut (4) phone; ffx2-leblanc (6) 1600x900
- **Round 11:** Widened by the gap pass: the pause CHAPTER tab truncates FFX-2 labels to 'DRESSPHE…' at 2000x1012 (later build).
- **Expected:** Full labels, and objectives laid out at a readable measure.
- **Observed:** On the phone, settings and scene values are ellipsised. At 1600x900 the ch6 objectives wrap one or two words per line ('2. DISPEL / LEBLANC'S NOT- / SO-MIGHTY / GUARD').
- **Repro:** Live, 390x844 ch4 pause OPTIONS and CHAPTER; 1600x900 ch6 Esc over the scene.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/14-pause-options.png; ffx2-leblanc-win/05b-scene-esc.png
- **Confidence:** high
- **Requirement:** CHK-009
- **Where (traced):** pause CSS (not traced)
- **Fix:** Widen the objective column; let settings labels wrap on the phone.
- **Acceptance check:** No engaged text-overflow in the pause at 390x844 and 1600x900.

### 85. PR-0113 (polish, interface): The phone chapter board runs the party names together ('YUNARIKKUPAINE'), and BEST slides under the hint bar

- **Game / chapter:** both / board, ffx2-bahamut selected
- **Expected:** Separated names; BEST visible.
- **Observed:** As in round 10.
- **Repro:** Live, 390x844, chapter select.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/03-card.png
- **Confidence:** high
- **Requirement:** CHK-009
- **Where (traced):** frontend board phone CSS (not traced)
- **Fix:** Add a gap between names; reserve the hint bar's height.
- **Acceptance check:** At 390x844 the name boxes do not touch and BEST sits above the hint bar.

### 86. PR-0114 (polish, interface): The Seymour and Anima silhouette still draws through the 'Coming' badge

- **Game / chapter:** FFX / board
- **Expected:** The badge sits above the silhouette.
- **Observed:** The silhouette line crosses 'Coming'.
- **Repro:** Live, chapter select at 1600x900.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/03-card.png
- **Confidence:** high
- **Requirement:** Legibility
- **Where (traced):** board tile z-order (not traced)
- **Fix:** Raise the badge's z-index.
- **Acceptance check:** The badge text is unobstructed.

### 87. PR-0110 (polish, interface): Residual: the 'N HIDE MOVES' chip text shows through the FFX-2 first-turn coach card

- **Game / chapter:** FFX-2 / ffx2-leblanc (6)
- **Expected:** The coach card is opaque over the chip, or the chip waits.
- **Observed:** '…IDE MOVES' is visible behind the coach's RIKKU header.
- **Repro:** Live, ch6 fresh profile, first menu.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-leblanc-win/10-first-menu-coach.png
- **Confidence:** medium
- **Requirement:** CHK-006
- **Where (traced):** FFX-2 coach layer (not traced)
- **Fix:** Hide the chip while the coach mark shows.
- **Acceptance check:** No chip text inside the coach card rect.

### 88. PR-0033 (polish, onboarding): The defeat screen still says nothing about why the party fell

- **Game / chapter:** both / seymour-flux (1)
- **Expected:** A plain-words reason and a fast way back in (product brief).
- **Observed:** Defeat shows turns, attempts, BEST and the party AP only; the 'Defeat screen' target tile is a gap.
- **Repro:** Live, lose ch1.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/31-results.png
- **Confidence:** high
- **Requirement:** Onboarding: help that teaches; target tile gap
- **Where (traced):** results screen
- **Fix:** Options round for the defeat tile, then one line from the battle log (the killing blow and its counter).
- **Acceptance check:** A defeat in ch1 names the move that finished the party.

### 89. PR-0032 (polish, onboarding): No text size, key remapping or flash setting; reduce-motion follows the OS preference only

- **Game / chapter:** both / all
- **Expected:** Text scale, remap, and motion/flash rows.
- **Observed:** The pause OPTIONS in every capture lists volume, text speed, X-2 BATTLE, ATB SPEED, STRATEGY GUIDE and BATTLE HELP only. Settings.reduceMotion exists in the save and is read (TitleScreen.ts:85) but has no row.
- **Repro:** Live, any pause, OPTIONS.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/14-pause-options.png; ffx2-leblanc-lose-2000/15-options-active.png
- **Confidence:** high
- **Requirement:** Onboarding category: text and input access, motion and flash accommodations
- **Where (traced):** src/app/screens/pause OPTIONS
- **Fix:** Expose the existing reduceMotion as a row first (cheapest), then text scale.
- **Acceptance check:** OPTIONS shows REDUCE MOTION, and toggling it with real keys persists across a reload.

### 90. PR-0073 (polish, onboarding): Phone and touch players still see only key names ('ENTER / ESC SKIP', 'D NEVER SHOW THIS AGAIN', 'LEFT/RIGHT CHOOSE')

- **Game / chapter:** both / title, briefing, board
- **Expected:** Touch wording on touch devices.
- **Observed:** Every phone hint names a key; there is no tap wording.
- **Repro:** Live, 390x844, fresh profile.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-bahamut-win-look-phone/01-briefing.png; 03-card.png
- **Confidence:** high
- **Requirement:** Device usability
- **Where (traced):** frontend hint bars (not traced)
- **Fix:** Swap the hint text on pointer:coarse.
- **Acceptance check:** Under touch emulation the briefing and board hints say 'Tap'.

### 91. PR-0116 (polish, onboarding): The briefing still opens with 'Five fights' while seven chapters are playable (a question for Bailey: the words are his)

- **Game / chapter:** both / briefing
- **Expected:** Bailey decides the wording.
- **Observed:** briefingText is unchanged; the board lists 7 playable chapters and 1 coming.
- **Repro:** Live, fresh profile, title > briefing.
- **Evidence:** critic/rounds/round-11/evidence/seymour-flux-win/01-briefing.png; run.json boardAtEntry
- **Confidence:** high
- **Requirement:** Onboarding C1 tile (Bailey's words)
- **Where (traced):** briefing copy
- **Fix:** Ask Bailey; no change without his words.
- **Acceptance check:** Bailey's answer recorded in decisions.json.

### 92. PR-0172 (polish, layout): Defeat results: the vertical chapter title runs into the CHAPTER SELECT button

- **Game / chapter:** both (seen Ch8 FFX) / Ch VIII defeat results
- **Expected:** Vertical title ends above the buttons
- **Observed:** '... · FELL' overlaps the CHAPTER SELECT button's right edge
- **Repro:** Lose Chapter VIII at 1600x900.
- **Evidence:** critic/rounds/round-11/evidence/gaps/evrae-airship-lose-r1/results.png
- **Confidence:** high
- **Requirement:** Results layout
- **Where (traced):** results vertical eyebrow
- **Fix:** Cap the vertical title height above the button row, or shorten it.
- **Acceptance check:** No overlap for the longest chapter title at 1600x900.

### 93. PR-0109 (polish, prep): PR-0109 (carried, STALLED): chapter select forgets the chapter you were on

- **Game / chapter:** both / all
- **Expected:** Backing out of prep, or returning after results, keeps the cursor on the chapter just played.
- **Observed:** cardAfterBack = 'seymour-flux' in all 12 route runs, even after choosing Evrae, Leblanc or another chapter and pressing Esc in prep. boardAfter and boardAfterReload select Chapter I after clears of ch2, ch4, ch5, ch6 and ch8.
- **Repro:** Fresh profile > board > ArrowRight to VIII Evrae > Enter > prep > Esc. The cursor is on I Seymour Flux.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/run.json (cardAfterBack, boardAfter, boardAfterReload), evrae-airship-win/35-board-reload.png
- **Confidence:** high
- **Requirement:** prep category: fast retry and replay
- **Fix:** Remember the last selected chapter id in the board state (and optionally in the save) and restore it when the board is re-entered.
- **Acceptance check:** After Esc from prep on card VIII, and after the VIII results, the board opens with VIII selected (selectedId 'evrae-airship'), in both games.
- **Stalled:** yes: a method check is owed before the next attempt (RUBRIC section 8)

### 94. PR-0138 (polish, prep): PR-0138 (carried): a chained chapter's results show only the last battle's spoils

- **Game / chapter:** FFX-2 / V ffx2-vegnagun-shuyin
- **Expected:** Owner decision needed: either a chain total, or a labelled last-battle ledger. The numbers themselves are sourced.
- **Observed:** After the 33:41, five-link live win the results read 'EXP 0 ×3 PARTY · AP 20 PER DRESSPHERE · GIL 0' with no items. That is exactly the research row for the final battle (research/ffx2-vegnagun-shuyin.md:435), while earlier links are worth 5,000-8,000 EXP and 3,000 gil each (lines 203-309). Chapter 6's 900/6/780 is likewise the final battle only (§6.3).
- **Repro:** Win chapter V with real keys and read results.
- **Evidence:** critic/rounds/round-11/evidence/ffx2-vegnagun-shuyin-win/run.json resultsText
- **Confidence:** high
- **Requirement:** prep: understandable results
- **Fix:** Ask Bailey which reading is wanted. If the chain total, sum the per-link spoils in the chain flow before ResultsScreen. If last battle only, label the ledger 'final battle'.
- **Acceptance check:** The chapter V results either total the sourced link spoils or say which battle they cover.

### 95. PR-0084 (polish, delivery): PR-0084 (carried, now UNVERIFIED on this build): load and battle-entry time not measured

- **Game / chapter:** both / all
- **Expected:** Named hardware, browser, network and cache conditions; first load under 5 s; frame-time p99 and spikes during actions.
- **Observed:** No load, card-to-first-menu or frame-time measurement exists for 76f587c3. The harness clock shows 5.8-10.5 s from the pre-scene skip to the first menu across chapters, but that includes harness waits and is not a load metric. Round 09's 10.1 s cold is not reusable because the asset loader, presenter and audio routing changed.
- **Repro:** See capturesNeeded #5.
- **Evidence:** critic/rounds/round-11/evidence/*/run.json steps (preSceneSkippedWithHolds -> battleSeed timestamps)
- **Confidence:** n/a (unmeasured)
- **Requirement:** RUBRIC §2 platform goals: 60 fps at 1600x900, load under five seconds
- **Fix:** Run the timing probe from round 09 against this build's artifact.
- **Acceptance check:** A timing report with GPU string, cold and warm, unthrottled and 50 Mbps, and p50/p95/p99 plus the maximum frame time during an action sequence.

### 96. PR-0173 (polish, delivery): R11-PD-02: 239 unreferenced art variant files (126 MB) ship in every build

- **Game / chapter:** both / n/a (artifact)
- **Expected:** Only the files the game can request ship to Pages.
- **Observed:** critic/artifacts/76f587c3.json lists 36 *.raw.png (40.5 MB) and 203 numbered variants *.N.png/json (85.1 MB), for example art/portraits/f4blulu.1.raw.png and f4lulu.3.png. None is named in src (CHK-018 grep), none is in the art manifest (0 numbered or raw entries), and none was requested in any of the 17 runs (logs/network-media-all.json: 203 art files requested, 0 variants). With the 52 audio candidates of PR-0100 (34.2 MB, up from 47 / 27.5 MB in round 10), about 160 MB of the 467 MB artifact is never used.
- **Repro:** node -e over critic/artifacts/76f587c3.json filtering /\.raw\.png$/ and /\.[0-9]+\.(png|json)$/.
- **Evidence:** critic/artifacts/76f587c3.json; critic/rounds/round-11/evidence/logs/network-media-all.json
- **Confidence:** high
- **Requirement:** delivery: valid, lean media and deploy hygiene (the GitHub Pages site-size limit is 1 GB)
- **Fix:** Exclude *.raw.png and numbered variant files (plus audio/candidates, PR-0100) from the dist copy in the build or deploy step. They stay on disk and in D:\Tools\pyrefly-art-backup.
- **Acceptance check:** The next artifact manifest has 0 files matching \.raw\.png or \.[0-9]+\.(png|json) under art/, and 0 under audio/candidates; a full route still shows 0 404s.

### 97. PR-0174 (polish, prep): R11-PD-03: Rikku's Evrae preset is S.Lv 53, out of line with the chapters on either side (40 at Macalania, 42 at Gagazet)

- **Game / chapter:** FFX / VIII evrae-airship, party prep and results
- **Expected:** One offset convention across the FFX presets, so Rikku's sphere level does not drop by 11 between Evrae and Mt. Gagazet. The research values are all [estimate].
- **Observed:** The prep shows Rikku S.LV 53 (Tidus 24, Wakka 24, Lulu 24, Auron 26, Kimahri 22). The results show 'Rikku +1 S.Lv S.LV 54 · 2,153/3,424 AP' against +9 for the others. src/data/ffx/builds/fahrenheit.ts:212 folds research §9.3's ~28 plus the +25 offset into 53. macalania.ts:209 (earlier in the story) says 40 and gagazet.ts:358 (later) says 42, each claiming the same +25 offset.
- **Repro:** Board > VIII > prep; compare with I > prep.
- **Evidence:** critic/rounds/round-11/evidence/evrae-airship-win/run.json prepText and resultsText; evrae-airship-win/31-results.png; research/ffx-evrae-airship.md §9.3; research/ffx-seymour-flux.md:725
- **Confidence:** medium (internal inconsistency is certain; which value is right is unsourced)
- **Requirement:** AGENTS.md rule 6 (no invented numbers) and prep: meaningful sourced preparation. FFX only: S.Lv does not exist in FFX-2.
- **Where (traced):** src/data/ffx/builds/fahrenheit.ts:212 (traced)
- **Fix:** Do not guess. Have the data owner state the offset convention in the research docs, then align fahrenheit.ts:212 or the other two presets with it.
- **Acceptance check:** Rikku's preset S.Lv rises monotonically along the story order Macalania < Evrae < Gagazet <= Zanarkand, with a source note on each.

### 98. PR-0175 (polish, targeting): Ch5 link 5: a stray reticle labelled with raw ids 'vegnagun-leg' / 'vegnagun-head' at the top-left corner

- **Game / chapter:** FFX-2 only / Ch V ffx2-vegnagun-shuyin, link 5 opening dialogue
- **Expected:** No reticle for parts that are gone; plates never show internal ids
- **Observed:** Throughout the link-5 dialogue a ring sits at (0,0), plated 'vegnagun-leg' then 'vegnagun-head', over the boss bar
- **Repro:** Live dc2669ac, seed 1, 1600x900. Links 2-4 fast-forwarded by autoBattle to under 12% HP, then real keys; walk the link-5 dialogue with Enter.
- **Evidence:** critic/rounds/round-11/evidence/gaps/ffx2-vegnagun-shuyin-seams-r1/speaker-Shuyin.png, scene-28-in-battle-link5/
- **Confidence:** medium (seen once; the dedicated probe could not reach link 5 because autoBattle stalled on the Tail)
- **Requirement:** Targeting s3 / HUD hygiene
- **Where (traced):** target reticle/plate for departed parts (not traced)
- **Fix:** Drop reticles and plates for combatants not in the current link, and fall back to the display name, never the id.
- **Acceptance check:** A real-key pass through the link 4-to-5 seam shows no reticle in the corner, and no plate text matches /^[a-z]+-[a-z-]+$/.

### 99. PR-0176 (polish, visual): Aeon CTB tiles show letter chips ('B', 'S') instead of the approved portraits

- **Game / chapter:** FFX only / any FFX chapter with a summon (seen in Ch III)
- **Expected:** portraits/bahamut.png and shiva.png (present live, listed in the manifest) on the CTB
- **Observed:** Ink letter chips 'B' and 'S'
- **Repro:** Live a999d133, Chapter III, seed 1: Yuna > Summon > Shiva (or Bahamut) and look at the CTB.
- **Evidence:** critic/rounds/round-11/evidence/gaps/summons-braskas-final-aeon/summon-Shiva-field.png, summon-Bahamut-field.png
- **Confidence:** high
- **Requirement:** Shiva/aeon approved tiles (HUD portrait)
- **Where (traced):** src/battle/ffx/setup.ts:~141-160 aeonToCombatant (no portraitKey); src/ui/ffx/CtbList.ts:139 (party branch uses row.portraitKey only)
- **Fix:** Set portraitKey from the aeon build in aeonToCombatant, or fall back to resolvePortraitKey(actorId) in the CtbList party branch.
- **Acceptance check:** After summoning each aeon, its CTB tile shows the portrait image, with no letter chip.

### 100. PR-0177 (polish, visual-target): Ch8 FAR range: Evrae shrinks to a thin streak, further than approved option A

- **Game / chapter:** FFX only / Ch VIII after Pull back
- **Expected:** Target A: a ghosted but readable serpent at FAR
- **Observed:** Only a small curl of tail in the sky
- **Repro:** Chapter VIII, Orders > Pull back, wait for Cid's turn.
- **Evidence:** critic/rounds/round-11/evidence/gaps/ch8-evrae-v2/pullback-seq/f080-f093
- **Confidence:** medium
- **Requirement:** Evrae order/range widget tile (option A)
- **Where (traced):** FAR staging
- **Fix:** Raise Evrae's FAR scale and opacity toward the target frame.
- **Acceptance check:** Side-by-side with sheet.png A-FAR shows a comparably sized ghosted Evrae.

### 101. PR-0178 (polish, visual-target): Targeting s1: ally brackets cross the command menu; no TARGET plate

- **Game / chapter:** FFX only / Ch III (any FFX all-ally spell)
- **Expected:** Target s1: brackets around the three allies clear of the menu, plus a 'TARGET Tidus, Yuna & Auron' plate
- **Observed:** The lower bracket corners draw across the HASTEGA/SLOW rows; only an 'ALL ALLIES' chip
- **Repro:** Chapter III, Tidus > White Magic > Hastega > Enter.
- **Evidence:** critic/rounds/round-11/evidence/gaps/ch3-hastega/hastega-party-targeted.png
- **Confidence:** high
- **Requirement:** Targeting s1 tile
- **Where (traced):** ally bracket placement
- **Fix:** Clip brackets behind the command stack (z-order) and add the target plate.
- **Acceptance check:** No bracket line intersects a command row; the plate lists the three names.

### 102. PR-0071 (polish, tooling): autoBattle('intended') loses Ch1 seed 1 and stalls on the Ch5 Tail link on the newest builds

- **Game / chapter:** both / Ch I, Ch V
- **Round 11:** Tooling, not product: the autoBattle traps of round 10 recur on newer builds.
- **Expected:** The chapter's own line wins, as the tactic docs measure
- **Observed:** Ch1: Defeat in 47 turns (CXcGU7y1). Ch5: no progress past the Tail in 15-25 min ('intended' fast and 'attack' skip; CzzK-khs, Ji5E4fD0). Ch6: 'attack' lost Act II (Ji5E4fD0).
- **Repro:** window.__pyrefly.gotoChapter('seymour-flux',{seed:1, auto:'intended', speed:'fast'})
- **Evidence:** critic/rounds/round-11/evidence/gaps/seymour-flux-seams-r1/run.json; gaps/ch5-link5-target/run.json; gaps/ch5-nemo-miss/run.json
- **Confidence:** medium (might be a real balance shift after 6debabd9 or only the tactic)
- **Requirement:** Evidence tooling; CHK-016 routes
- **Where (traced):** debug strategy (engine or tactic, not traced)
- **Fix:** Re-measure the intended lines on the current tree (40 seeds) and repair the tactic, or record why they changed.
- **Acceptance check:** gotoChapter auto 'intended' wins Ch1 and passes the Ch5 Tail on seed 1.

### 103. PR-0166 (polish, process): Review evidence identity: the capture harness hard-codes 'bundle 81kxOXnv (main 76f587c3)', and the live site was replaced mid-capture (bcbdb483 at 17:52Z, then dc2669ac, e3b8c2a3, a999d133), so later runs carry a label they cannot prove; four captures also do not show their labelled state

- **Game / chapter:** both / review tooling
- **Expected:** Every capture records the bundle it actually loaded (document script src) and the state it asserts; a deep review of a live build pins that build (a local git-archive build of the sha, or a pause on deploys during capture).
- **Observed:** Runs started after 17:52Z (braskas-final-aeon-win 18:09Z, the four scene walks 18:35Z, pause-matrix 18:39Z, braskas-final-aeon-win-r2 18:39Z, the ch5 final reload) most likely captured bcbdb483. None of the gap-pass evidence is on 76f587c3. Mislabelled states: ffx2-vegnagun-shuyin-win/16-target-single.png (White Magic list, not a targeted part), yunalesca-win-2000/16b-after-cancel.png (the pause), evrae-airship-win/30-post-scene.png (blank card mid-transition), seymour-flux-win/10-first-menu-coach.png (under the turn cut-in).
- **Repro:** Compare docs/deploys.log with the run start times in critic/rounds/round-11/evidence/index.jsonl; read route.mjs for the hard-coded label.
- **Evidence:** docs/deploys.log; critic/rounds/round-11/cap/lib.mjs, route.mjs; critic/rounds/round-11/evidence/index.json
- **Confidence:** high
- **Requirement:** RUBRIC section 5 (record the artifact); CHK-016
- **Fix:** Record the loaded bundle from the page in every run.json and refuse to label otherwise; for a deep review of a sha that may be replaced, capture against a local build of that sha.
- **Acceptance check:** Every run.json of the next deep review carries the bundle name read from the page, and it matches the reviewed sha's artifact record.
- **Merged from:** visual R11-EVD-01; prep-delivery R11-PD-04; audio R11-AUD-EV1; gap pass (build attribution)

### 104. PR-0121 (polish, visual): At 3840x2160 the pause plate stops at 3380x1931 and leaves black bands

- **Game / chapter:** both / all
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Full-bleed at every size (CHK-002).
- **Observed:** ON 5ddfde3: Re-observed at 3840x2160 on 5ddfde3: the pause img is drawn at 3380x1931 from (-10,-5), leaving about 470 px dark on the right and 235 px at the bottom; live is identical. The gap pass rated it major; kept at polish (a rare resolution, pre-existing, not a regression).
- **Repro:** node gaps/firstmenu.mjs seymour-flux 3840x2160 pause
- **Evidence:** critic/rounds/round-09/evidence/gaps/firstmenu/seymour-flux-3840x2160-5ddfde3-04-pause-small.jpg; critic/rounds/round-09/evidence/gaps/firstmenu/seymour-flux-3840x2160-live.json; evidence/gaps/firstmenu/seymour-flux-3840x2160-04-pause-small.jpg; live: firstmenu-live/seymour-flux-3840x2160.json
- **Confidence:** high
- **Requirement:** CHK-002
- **Fix:** Remove the plate's maximum size cap (it looks like it is the 2x master width) and let object-fit: cover scale it.
- **Acceptance check:** At 3840x2160 the img rect covers 0,0 to 3840,2160.
- **Last observed:** 5ddfde3 (round 10)

### 105. PR-0146 (polish, feel): The enemy-intent panel appears over the title-card crossfade, before the intro sweep has finished

- **Game / chapter:** both (seen in chapters 4 and 6) / ffx2-leblanc, ffx2-bahamut
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Battle panels arrive after the intro sweep, with the HUD.
- **Observed:** Chapter 6 seq-transition-into-battle f06 (1.86 s): Dr. Goon's 'Strike · SCRIPTED' panel over the fading Ormi title card. Chapter 4 f04 (1.28 s): a 'Curse' panel on a dark stage before the boss caption.
- **Repro:** Fresh profile, seed 1, chapter 6 or 4: skip the scene and record 100-300 ms frames through the transition.
- **Evidence:** critic/rounds/round-10/feel-narrative-scratch/ffx2-leblanc-win-1600__seq-transition-into-battle.jpg; critic/rounds/round-10/feel-narrative-scratch/ffx2-bahamut-win__seq-transition-into-battle.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §6 feel (smooth transitions)
- **Fix:** Mount the intent panel with the HUD, after the intro sweep.
- **Acceptance check:** No .eint panel is visible before the HUD in the transition frames of chapters 4 and 6.
- **Last observed:** 5ddfde3 (round 10)

### 106. PR-0151 (polish, interface): Pause OPTIONS labels are cut with ellipses at 1280x960 (MASTER VOL…, SOUND EFFE…, STRATEGY GU…)

- **Game / chapter:** both (seen in chapter 6) / ffx2-leblanc
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Full labels at 4:3 (CHK-003/CHK-009).
- **Observed:** At 1280x960 the settings names end in ellipses; at 2560x1080 the same screen lays out cleanly.
- **Repro:** Chapter 6 at 1280x960, Esc, OPTIONS.
- **Evidence:** critic/rounds/round-10/evidence/gaps/ch6-tour-1280x960/pause-options.png
- **Confidence:** high
- **Requirement:** CHK-003, CHK-009
- **Fix:** Widen the settings column or wrap the labels at 4:3.
- **Acceptance check:** No ellipsis at 1280x960 and 1024x768.
- **Last observed:** 5ddfde3 (round 10)

### 107. PR-0131 (polish, interface): The chapter 1 advisor chains Phoenix Downs into immediate re-KOs: Yuna revived 7 times, KO'd again before acting after 6 of them

- **Game / chapter:** FFX only / seymour-flux attempt 1
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Revive advice accounts for a telegraphed re-kill or recommends the recovery that survives it.
- **Observed:** battle-log seq 258-376: 7 Phoenix Downs on Yuna (750 HP); 6 re-KOs before she acted.
- **Repro:** Chapter 1, seed 1, advisor-followed real keys.
- **Evidence:** critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/turn-log.json; critic/rounds/round-09/evidence/5ddfde3/seymour-flux-win/battle-log.json
- **Confidence:** medium (one route)
- **Requirement:** CHK-005 (advice stays useful on damaged boards)
- **Fix:** Build the degenerate-board matrix CHK-005 asks for first; then weigh revive advice against the next enemy action the intent model already predicts.
- **Acceptance check:** advisor-degenerate-boards test covers the telegraphed re-kill case in chapter 1.
- **Merged from:** interface R09B-INT-05
- **Last observed:** 5ddfde3 (round 10)

### 108. PR-0136 (polish, visual): At party scale the Syndicate and goons queue in one diagonal file right behind the party

- **Game / chapter:** FFX-2 only / ffx2-leblanc links 1-3
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Opposing sides separated across the floor.
- **Observed:** Dr. Goon then Logos stand about 70 px from Paine; the enemies occupy the centre third; the slots were authored for boss scale and only the heights changed (9ba0b71).
- **Repro:** Seed 1, 1600x900, chapter 6 links 1-3.
- **Evidence:** critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/20-link-3.png; critic/rounds/round-09/evidence/5ddfde3/ffx2-leblanc-win/16-target-single.png; critic/rounds/round-09/targets/5ddfde3/ch6-seam3.jpg
- **Confidence:** medium
- **Requirement:** RUBRIC §6 visual (composition, staging)
- **Fix:** Re-space the chapter 6 enemy slots toward stage right.
- **Acceptance check:** At 1600x900 no enemy within 150 px of a girl in the default framing; enemies in the right half.
- **Merged from:** visual R09b-VIS-03
- **Last observed:** 5ddfde3 (round 10)

### 109. PR-0139 (polish, interface): The intent panel keeps naming a KO'd enemy for up to 4.5 s ("ORMI ACTS NEXT Concussive Blast" after Ormi falls)

- **Game / chapter:** FFX-2 as observed (shared panel) / ffx2-leblanc Act III, Ormi killed first
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** A KO'd combatant is dropped from the read-out within a frame.
- **Observed:** 0 to 4.5 s after Ormi's KO the panel still reads "ORMI ACTS NEXT Concussive Blast" with damage ranges.
- **Repro:** Chapter 6 Act III with Ormi targeted first (the gap pass used an injected retarget wrapper).
- **Evidence:** critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/20-after-ormi-ko-0..3.png; critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/run.json
- **Confidence:** medium
- **Requirement:** Honest intent (RUBRIC §2)
- **Fix:** Recompute the intent on ko events and skip combatants at 0 HP.
- **Acceptance check:** Within one frame of Ormi's KO the panel names Leblanc or Logos.
- **Merged from:** gap capture (second half of its intent issue)
- **Last observed:** 5ddfde3 (round 10)

### 110. PR-0140 (polish, process): Commit 0bd85cc states no game case (CHK-021)

- **Game / chapter:** both (FFX ch7 data, FFX-2 ch6 meta, shared results layout) / 6, 7, 8
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Every change records FFX only / FFX-2 only / both with its source.
- **Observed:** "Chapters 6 to 8: pause hero art paths, Seymour's sprite key, results drop list fits four drops" has no case line and no handoff references it.
- **Repro:** git log -1 --format=%B 0bd85cc
- **Evidence:** git history (D:/pyrefly-release at 5ddfde3)
- **Confidence:** high
- **Requirement:** AGENTS.md rule 14; CHK-021
- **Fix:** Add the per-part case (Seymour spriteKey FFX only; Leblanc heroArt FFX-2 only; results layout both) to the chapter handoffs.
- **Acceptance check:** A handoff line names 0bd85cc and its three cases.
- **Merged from:** combat-encounter
- **Last observed:** 5ddfde3 (round 10)

### 111. PR-0141 (polish, process): critic-plan --json omits chapter 6 from the chapters this review owes

- **Game / chapter:** FFX-2 only / ffx2-leblanc
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The plan lists every registered, unlocked chapter the change set touches.
- **Observed:** node tools/critic-plan.mjs --json on 5ddfde3 lists five chapters and omits ffx2-leblanc, the main change of the release. This review covered chapter 6 anyway.
- **Repro:** cd D:/pyrefly-release && node tools/critic-plan.mjs --json
- **Evidence:** critic/rounds/round-09/chief-5ddfde3/plan.json
- **Confidence:** high
- **Requirement:** RUBRIC §4 (the plan is the coverage this review owes)
- **Fix:** Derive the plan's chapter list from the registry (encounters.ts minus LOCKED_CHAPTER_IDS).
- **Acceptance check:** The plan output includes ffx2-leblanc for this change set.
- **Merged from:** combat-encounter
- **Last observed:** 5ddfde3 (round 10)

### 112. PR-0103 (polish, narrative): Two Act III KO beats assume Logos falls before Ormi: kill Ormi first and a KO'd Ormi shouts, and Paine calls for the already-dead Ormi

- **Game / chapter:** FFX-2 only / ffx2-leblanc, Act III
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Beats that name the living or the dead stay true in either kill order (research section 5.4 treats both orders as live options).
- **Observed:** ON 5ddfde3: Exercised on 5ddfde3 with Ormi forced first (injected retarget): Ormi's KO bark "Boss... I held the door." and Leblanc's "You did, lamb. Badly. But you did." play, the run reaches results with no stall. Whether the remaining beats read correctly in that order was not settled; left open.
- **Repro:** Chapter 6, Act III: focus Ormi until KO, then KO Logos, and read the beat.
- **Evidence:** critic/rounds/round-09/evidence/gaps/ch6-ormi-first-5ddfde3-r2/run.json; src/story/scripts/ffx2-leblanc.ts (mid 'logos-down' / 'ormi-down', midScripts) @ e119552; D:/Final Fantasy/critic/rounds/round-09/evidence/e119552/ffx2-leblanc-win/battle-log.json
- **Confidence:** medium-high (the logic is certain from the source; the branch is not captured)
- **Requirement:** RUBRIC section 6 narrative (faithful beats, character voice); round 07 PR-0037 is the same class (speakers who are not on the field).
- **Fix:** Give 'logos-down' an Ormi-already-down variant (Leblanc alone), or split the trigger with a condition on Ormi's state.
- **Acceptance check:** Kill Ormi first and then Logos: no KO'd speaker talks, and no line names a dead target as next.
- **Last observed:** 5ddfde3 (round 10)

### 113. PR-0081 (polish, feel): Chapter 5 is 250 actions and 6:21 at FAST; the 5.15 s per action of round 08 does not reproduce (1.52 s per action on the candidate)

- **Game / chapter:** FFX-2 only / ffx2-vegnagun-shuyin
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** As round 08.
- **Observed:** Gap capture on the candidate, FAST, intended auto-player: fight 381.2 s across 5 links with 250 action-starts, 1.52 s per action, in line with other chapters (critic/rounds/round-09/evidence/gaps/ch5-fast-cand-1600x900/run.json, gaps/ch5-fast.log). The per-action cost that made this a major does not reproduce; what remains is the chapter's length, which follows its sourced HP and chain.
- **Repro:** As round 08, at FAST speed with the intended auto-player on the candidate.
- **Evidence:** critic/rounds/round-09/evidence/gaps/ch5-fast-cand-1600x900/run.json; critic/rounds/round-09/gaps/ch5-fast.log
- **Confidence:** medium (one run; the auto-player, not a human)
- **Requirement:** RUBRIC section 6 feel: dead waiting.
- **Fix:** As round 08.
- **Acceptance check:** As round 08.
- **Last observed:** 5ddfde3 (round 10)

### 114. PR-0119 (polish, onboarding): The chain coach mark covers the act-one-cleared dialogue card for about 2 s

- **Game / chapter:** FFX-2 only / ffx2-leblanc seam 1->2
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Coach marks hold off while a seam dialogue card is up.
- **Observed:** The 'Keep hitting the same one!' coach card sits over Rikku's speaker tag and line.
- **Repro:** Fresh profile; ch6 link 1 chained kills into the seam
- **Evidence:** evidence/gaps/ffx2-leblanc-flow-1600x900/seam-1-to-2/f005-f010.jpg (f008)
- **Confidence:** medium (fight played by autoBattle)
- **Requirement:** FOC-05; CHK-022
- **Fix:** Suppress or queue coach marks while the story card layer is visible.
- **Acceptance check:** No coach-mark rect intersects the dialogue card in the seam frame sequence.
- **Last observed:** 5ddfde3 (round 10)

### 115. PR-0120 (polish, visual): Results painting stops 100 px short of the right edge at 2000x1012

- **Game / chapter:** both (seen in FFX-2) / 4
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** A full-bleed painting on wide viewports
- **Observed:** The cream page background shows from x=1900 to x=2000 on the results screen at 2000x1012. The painting panel ends at the 16:9 stage edge.
- **Repro:** 2000x1012, win chapter 4, results
- **Evidence:** e119552/ffx2-bahamut-win/31-results.png (pixel samples x>=1900 = 244,241,232)
- **Confidence:** medium
- **Fix:** Extend the portrait panel to the viewport's right edge rather than the stage's
- **Acceptance check:** Pixel at (1995,500) belongs to the painting at 2000x1012
- **Last observed:** 5ddfde3 (round 10)

### 116. PR-0037 (polish, narrative): Mid-battle beats hard-code speakers who are not in the active formation

- **Game / chapter:** FFX observed; the same shape exists in the other chapters' midScripts / 1, beat 'first-zombie'
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The characters on the field speak.
- **Observed:** The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.
- **Repro:** Chapter 1: play until a party member is Zombied and read the speaker card.
- **Evidence:** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png; src/story/scripts/seymour-flux.ts:278-281; src/data/ffx/builds/gagazet.ts:424-425
- **Confidence:** high
- **Requirement:** RUBRIC section 6 narrative (character voice, reachable scenes).
- **Fix:** Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.
- **Acceptance check:** Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.
- **Last observed:** 5ddfde3 (round 10)

### 117. PR-0083 (polish, process): Four source files were pushed further past the 400-line house limit by this batch

- **Game / chapter:** both / n/a (house style)
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** A batch that touches a long file leaves it shorter, or splits it.
- **Observed:** Reported by the combat auditor from the candidate's own diff: four files already over the limit grew further in this batch. No player effect; it is the kind of drift that makes the next engine change more expensive and it is named here so it is not rediscovered as a surprise.
- **Repro:** node tools/orphans.mjs is unrelated; count lines over src/battle and src/engine at 1b33971.
- **Evidence:** combat auditor, round 08 (the four files are named in the diff at 1b33971)
- **Confidence:** medium — reported, not re-counted by the chief critic
- **Requirement:** AGENTS.md hard rule 7 and docs/DEV.md "House rules": every source file under 400 lines.
- **Fix:** Split the four at the next change that touches them, rather than as a separate refactor.
- **Acceptance check:** No file the next batch touches is over 400 lines when the batch lands.
- **Last observed:** 5ddfde3 (round 10)

### 118. PR-0034 (polish, visual): The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow

- **Game / chapter:** FFX / 1 (Mt. Gagazet)
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The moonlit canyon of the approved tile.
- **Observed:** The shipped gagazet.png is byte-identical to the approved copy and renders faithfully under the pre-battle scene camera, where the composite is a close match. Under the battle camera the same painting is darkened and desaturated to a flat navy wall: the moon and the lit snow floor are gone, and a backdrop-only patch measures mean luminance 70 against the source painting's 114, so the arena reads as a dark cave.
- **Repro:** Capture Chapter 1's pre-battle scene and its battle at 1600x900 and pair both with docs/screenshots/concept-gagazet.png.
- **Evidence:** critic/rounds/round-04/targets/presentation-dialogue.jpg (scene camera, faithful); targets/scene-ch1-gagazet.jpg (battle camera, flattened)
- **Confidence:** high for Chapter 1, the only scene with the same painting under both cameras
- **Requirement:** The approved scene tile 'Ch.1 Mt. Gagazet'; CHK-013 judges art inside the running game.
- **Fix:** Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.
- **Acceptance check:** Re-pair the tile from a battle frame: the moon and the lit snow are present and the backdrop patch's mean luminance is within about 10 percent of the source painting's.
- **Last observed:** 5ddfde3 (round 10)

### 119. PR-0036 (polish, visual): The FFX-2 party crowds the left third of the stage while two thirds of it is empty

- **Game / chapter:** FFX-2 / 4
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** A composition comparable to the FFX chapters, which stage their party noticeably larger and further apart.
- **Observed:** Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.
- **Repro:** Chapter 4, first ATB turn, 1600x900.
- **Evidence:** critic/rounds/round-04/evidence/shots/ffx2-bahamut-04-enemy-intent.png, ffx2-bahamut-03-battle-menu.png
- **Confidence:** high
- **Requirement:** RUBRIC section 6 visual (composition, staging, ground contact).
- **Fix:** Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.
- **Acceptance check:** Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.
- **Last observed:** 5ddfde3 (round 10)

### 120. PR-0028 (polish, interface): H does not hide the panels it is labelled for during battle

- **Game / chapter:** both / 1 to 5
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Either H hides every optional panel in battle, or its legend says what it actually hides.
- **Observed:** In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.
- **Repro:** Any chapter, battle, press H, 1600x900; then Esc and press H on the pause screen and compare.
- **Evidence:** critic/rounds/round-04/evidence/shots/ch1-07-hide-panels.png, ffx2-bahamut-04-hide-panels.png, ffx2-vegnagun-shuyin-04-hide-panels.png; gaps/g-ch1-backdrop-panels-off.png
- **Confidence:** medium - the observation is certain; whether the narrower scope is intended is not stated anywhere
- **Requirement:** RUBRIC section 6 interface (pause and prep usability, cleanup); it also blocks CHK-013's scene-tile evidence.
- **Fix:** Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.
- **Acceptance check:** Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.
- **Last observed:** 5ddfde3 (round 10)

### 121. PR-0029 (polish, interface): Yu Pagoda A and B carry no always-on field marker

- **Game / chapter:** FFX / 3, battle 1 of 7
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The CTB's A and B can be mapped to the painted enemies without opening the picker.
- **Observed:** The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter. PARTIALLY ANSWERED THIS ROUND: the Chapter 3 CTB column does letter the two pagodas A and B and the target chip carries the letter, but there is still no always-on marker on the field itself.
- **Repro:** Chapter 3, first player turn, 1600x900: compare the CTB tiles with the field.
- **Evidence:** critic/rounds/round-04/evidence/shots/braskas-final-aeon-03-battle-menu.png; crops/ch3-pagodas.png
- **Confidence:** high
- **Requirement:** critic/CHECKS.md CHK-011 (every targetable enemy has an always-on marker).
- **Fix:** Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.
- **Acceptance check:** In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.
- **Last observed:** 5ddfde3 (round 10)

### 122. PR-0062 (polish, process): The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody

- **Game / chapter:** FFX-2 / ffx2-vegnagun-shuyin, link 2
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** A seed that makes the bench land Berserk makes the shipped chapter land it, so the player-facing half of PR-0052 can be captured.
- **Observed:** Two facts block that capture and both belong in the record. (1) z06-passes and z06-berserk construct an isolated vegnagun-leg battle with engine.setSeed(n), while in shipped play each link is seeded from the chapter run (docs/DEV.md: engines are seeded per battle via BattleSetup.seed), so __pyrefly.setSeed(13) before chapter 5 is not the bench's seed 13. The seed-finder confirms the bench-side hits (seeds 3, 13, 27, 36, 38 put Yuna in White Mage under Berserk, earliest at turn 8) but they address the fixture, not the game. (2) Twenty in-game seeds (1-20) were swept, skipping link 1 and watching link 2 at normal speed, polling battleState about every 300 ms. The Leg link was reached in all 20 runs and Berserk was applied to nobody in any of them, although the AI path is live (src/battle/ffx2/ai/vegnagun.ts:72-87 rolls 1-in-3 Berserk / Break / Slow, and Slow was observed landing on Yuna on link 2 in a diagnostic run) and the bench predicts Berserk on a party member in about 6 of 24 isolated Leg battles. A false hypothesis was chased and discarded: legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", but re-running z06-legai proves the unprefixed ids do fire (19 leg-berserk casts over 24 seeds), so there is no id-resolution bug.
- **Repro:** critic/rounds/round-06/gap-berserk.mjs and gap-berserk2.mjs (in-game sweep); critic/rounds/round-06/bench/z06-gap-seeds.test.ts (seed finder).
- **Evidence:** critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep2.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-seed13.json; critic/rounds/round-06/bench/out/z06-gap-seeds.txt
- **Confidence:** High on both measurements. The discrepancy between 6-in-24 predicted and 0-in-20 observed is unexplained and is the thing to reconcile; it may be the harness's sampling, the chapter seeding, or a real difference between the fixture and the shipped link.
- **Requirement:** RUBRIC §5: match proof to the claim — a seeded engine fixture cannot stand in for the shipped seeding.
- **Fix:** Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.
- **Acceptance check:** A named seed makes the shipped chapter 5 link 2 land Berserk on Yuna in White Mage, and the resulting turn is captured at 1600x900.
- **Last observed:** 5ddfde3 (round 10)

### 123. PR-0167 (suggestion, visual): Records question for Bailey: mark the v5 pause (2000x1012, party panel) and v6 phone pause tiles as superseded by the approved Until Dawn remake

- **Game / chapter:** both / pause
- **Expected:** One approved target per state.
- **Observed:** The build follows the remake, which matches its frames at every captured size. The older v5/v6 tiles are still marked approved.
- **Repro:** n/a
- **Evidence:** D:/Final Fantasy/critic/rounds/round-11/targets/pause-rebuilt-2000.jpg; D:/Final Fantasy/critic/rounds/round-11/targets/pause-party-panel.jpg; D:/Final Fantasy/critic/rounds/round-11/targets/phone-pause.jpg
- **Confidence:** high
- **Requirement:** RUBRIC §7 (latest explicit owner decision)
- **Where (traced):** docs/target/targets.json
- **Fix:** Ask Bailey. Until he answers, these 3 tiles are counted as waiting.
- **Acceptance check:** targets.json records superseded, or still-required, on each tile.

### 124. PR-0149 (suggestion, delivery): A transient 5xx on a pose sidecar is not retried: the pose silently loses its scale, anchor and facing metadata

- **Game / chapter:** both / braskas-final-aeon (observed 503)
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** A transient host error on a shipped file is retried once before falling back.
- **Observed:** art/characters/braskas-final-aeon-1/hurt.json returned 503 once on live (the file exists, 2,113 bytes; a curl re-fetch returned 200 application/json). tryLoadMeta returns null on !res.ok. No visual consequence captured.
- **Repro:** Not reproducible on demand (a GitHub Pages hiccup at about minute 40 of the chapter 3 run).
- **Evidence:** critic/rounds/round-10/evidence/braskas-final-aeon-win/network-media.json
- **Confidence:** low for player impact (traced in code, not observed)
- **Requirement:** delivery: valid media under real hosting
- **Where (traced):** src/engine/PaintedArt.ts:133-139
- **Fix:** Retry once after about 500 ms on a 5xx or a thrown fetch in tryLoadMeta and tryLoadTexture.
- **Acceptance check:** A unit test with a fetch stub answering 503 then 200 gets the sidecar.
- **Last observed:** 5ddfde3 (round 10)

### 125. PR-0044 (suggestion, visual): 16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them

- **Game / chapter:** both (15 of the 16 are FFX-2 dresspheres) / n/a
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** Every subject declares its facing so the sign assertion can run per chapter formation.
- **Observed:** paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.
- **Repro:** Read D:/pyrefly-release/public/art/manifest.json.
- **Evidence:** D:/pyrefly-release/public/art/manifest.json
- **Confidence:** high
- **Requirement:** critic/CHECKS.md CHK-014.
- **Fix:** Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.
- **Acceptance check:** Every manifest subject carries a facing and the per-formation sign assertion runs green.
- **Last observed:** 5ddfde3 (round 10)

### 126. PR-0072 (suggestion, visual): Vegnagun has no ground contact and Paine stands inside its cannon barrel

- **Game / chapter:** FFX-2 / 5 (Vegnagun and Shuyin)
- **Round 11:** Carried from round 10: not re-tested or re-observed in round 11 (no capture of this state on 76f587c3). Status on this build unknown; stays open until a report shows it closed.
- **Expected:** The boss is planted on the Farplane floor with the same contact treatment the party actors get, and clearly behind the party in depth.
- **Observed:** Two of the three things reported during this round hold and one does not. Vegnagun's underside ends in a hard edge above the plain with no cast shadow or contact pool, while all three girls sit on visible contact rings; and Paine's billboard intersects the green cannon barrel so she reads as embedded in the machine rather than standing in front of it. The third claim, that Vegnagun is undersized and reads as a prop, is NOT supported by the capture: it dominates the frame horizontally and stands well above the party. Filed as a suggestion rather than a defect because the approved tile does not settle the depth staging and Bailey has not reacted to this frame.
- **Repro:** Chapter V from the board with real keys, Enter through the scene, capture the first command menu at 1600x900.
- **Evidence:** critic/rounds/round-07/evidence/ch5/04-first-menu.png; critic/rounds/round-07/targets/fight-targeting-s3.jpg
- **Confidence:** high for the ground contact and the overlap; the scale claim is refuted
- **Requirement:** CHK-014 (contact fits the shot); RUBRIC §6 visual (ground contact).
- **Fix:** Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.
- **Acceptance check:** At 1600x900 a contact shadow is visible beneath Vegnagun and no party billboard intersects it, on the first command frame and at target selection.
- **Last observed:** 5ddfde3 (round 10)

## Resolved this round (evidence on this build unless stated)

- PR-0125: live: 17 of 17 Doublecast: Firaga through the real menu hit the boss twice, none hit Lulu (braskas-final-aeon-win-r2/battle-log.json)
- PR-0122: live: the intent panel no longer paints over the pause (ffx2-leblanc-win/14-pause-Esc.png, ffx2-leblanc-lose-2000/15-options-active.png)
- PR-0142: live: Enter after a PAUSE-chip click opens targeting in both games (pause-matrix/*.json)
- PR-0092: live: the goons render the approved painted idles
- PR-0097: live: Yuna's Gunner and White Mage paintings read cleanly
- PR-0015: live: the chapter 5 tail tip reads steel
- PR-0012: live: the FFX-2 help band matches option A at 1600x900, 2000x1012 and 390x844
- PR-0011: live: Lance of Atrophy names ZOMBIE 50% (Ward-adjusted)
- PR-0013: live: Dr. Goon no longer lettered
- PR-0132: live: Right / Left Bulwark named
- PR-0118: live: no dialogue card over a pause opened during a scene (ch1/4/6/8)
- PR-0111: live: the chapter 6 collapsed guide card has content
- PR-0006: live: the advisor varies (10 to 29 distinct picks per chapter); the enemy-debuff half is filed under PR-0082
- PR-0041: live: FFX-2 items reachable through the command menu
- PR-0098: live: the phone OPTIONS column scrolls (onboarding auditor)
- PR-0087: engine at 76f587c3: Grenade base 200, no guaranteed crit (ffx2-grenade tests; data audit); thrown live in range on a later build
- PR-0124 (MP half): live: no HP or MP above maximum in 1,168 FFX-2 HUD rows across six chain seams; the dressphere-revert half remains as polish PR-0124

## What stands between this build and acceptance

- A numeric owner listening verdict (CHK-B1): without it the score stays provisional. Bailey's last words on the score were negative (PR-0148).
- Every category at 9.0 or more: all nine scored categories are below it, the lowest onboarding 6.6, interface 7.0 and visual 7.6.
- No open critical or major: 44 majors are open, 15 of them carried from round 10 without a re-test.
- Every included encounter through its real flow: chapter 3 has no real-input win on this build (PR-0082).
- Every required target matched: 33 of 54; 9 failing, 12 unverified, 9 waiting on a decision.
- Mandatory checks PASS: many are FAIL or UNVERIFIED (see the score output), including CHK-022, CHK-008, CHK-004 and CHK-B1.
- The human judgments listed as not recorded (audio grade, the SNES verdict in the records, the chapter 1 re-baseline, the FFX-2 cut-in, dressphere revert, superseded pause tiles, banter scope, the briefing line).
- Evidence identity: the next deep review must pin its build (PR-0166); a milestone claim also needs the exact artifact verified live.

## What changed since the previous round

Round 10 was a deep review of 5ddfde3 (release 09). Since then 76f587c3 shipped releases 10-12: chapter VIII unlocked (release 11, d9decadb) and this build (release 12). Compared with round 10's evidence, on this build:

- Closed with live evidence: PR-0125 (Doublecast), PR-0122 (intent over the pause, the regression round 10 held on), PR-0142 (chip focus), PR-0092 (painted goons), PR-0097, PR-0015, PR-0012 (help band), PR-0011, PR-0013, PR-0132, PR-0118, PR-0111, PR-0006, PR-0041, PR-0098, and the MP half of PR-0124; PR-0087 closed on engine evidence.
- Narrowed: PR-0143 (Steal and Pilfer work; the result is never shown), PR-0124 (only the unsourced dressphere revert remains).
- New this round: PR-0152 (Bailey's pause snapshot find), PR-0153 (random-target intent), PR-0154 (magic evaded in chapter 5), PR-0155 (aeons use Items), PR-0156 (HUD HP above maximum), PR-0157 (FFX action camera under the info card), and polish PR-0158 to PR-0178. PR-0082's cause is now established.
- Widened: PR-0002 (chapter VIII), PR-0017 (chapters 4 and 8 on a phone), PR-0065 (chapter VIII card), PR-0094 (link 3), PR-0129 raised to major (chapter 3 gauntlet under the wrong theme).
- Category movement against round 10 (both rubric v2): combat 8.4 to 8.5, encounter 8.8 to 8.9, visual 7.5 to 7.6, feel 7.9 held, narrative 7.7 held, interface 7.0 held (repairs offset by new majors), onboarding 6.5 to 6.6, prep 8.4 held, delivery 8.0 to 7.9; audio still UNVERIFIED. Rounds 02 and 03 were scored under rubric v1 and are not compared.

## Proposals (nothing here is built without Bailey's yes)

Unscored. Each needs Bailey's explicit yes, and anything he will see or hear gets options first (end state first).

- Pin the reviewed build during capture: serve a local git-archive build of the reviewed sha for deep reviews, and record the page's loaded bundle in every run.json (process; costs one build per review; removes the identity doubt of this round).
- Letter or position-name duplicate enemies wherever the advisor or guide names a target, and let the card open the target cursor on its aimed id (FFX only; canon does not letter duplicates, so show Bailey the options: A/B letters, left/right, or a pointer).
- A "can KO" flag on every intent damage row, and a separate "random target" layout that lists every party member (both games, checked per game; preview as a mockup first).
- A short in-battle message banner for FFX-2 (Steal, Pilfer, system messages), matched to the FFX-2 command-help band style (FFX-2 only; mockup first).
- A defeat-screen line that says why the party fell (PR-0033; both games; needs a target tile).
- Ship chapter 6 with its own two cues, sketched as audition options for Bailey (FFX-2 only; new content under rule 10).
- A phone battle layout options round (the "Every screen except pause" gap), or a "best on a wider screen" notice until then.

## Report files

- JSON: critic/rounds/round-11.json (valid evidence per tools/critic-score.mjs).
- Evidence: critic/rounds/round-11/ (evidence/, combat/, visual/, targets/, audio/, feel-narr/, confirm/, delivery/).

## critic-clear output (verbatim)

```text
critic:clear no pending marker for build 76f587c3: kept as candidate evidence
```

The deep obligation for this line of builds sits on critic/pending/a999d133.json; this report, filed under the build it reviewed, settles nothing there.
