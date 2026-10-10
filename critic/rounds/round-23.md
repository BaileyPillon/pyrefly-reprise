# Round 23 (deep review): live main d3fe9fe5, bundle B6DQPYhY

```text
Build / artifact / target version: main d3fe9fe5 (d3fe9fe523aa), bundle B6DQPYhY, artifactHash 769a43ed69b4fdb2640e2a9918b2c2b6d94615d2f176b3f456562ebe327eea15, targets 83e7d58a (live at https://echoesofspira.com/)
Review: deep (rubric v2; the deep obligation of 816d80f9 and 39 earlier builds moved here)
Deployment: PASS (3,848 of 3,848 files byte-identical; 81 runs, 0 responses of 404 or above, 0 console errors; the five-second load clause UNVERIFIED)
Changed area: FAIL (registration and the title work; CHK-026 and CHK-027 still FAIL; D-461 reach for FFX-2 and the mark key unproven)
Ship: SHIP: no critical defect, no major regression against live 39; discloses PR-0378, PR-0379, PR-0380, PR-0407, PR-0353, PR-0269, PR-0148, PR-0099, PR-0222
Milestone: not assessed (a deep review)
Quality: PROVISIONAL, audio UNVERIFIED (weighted score of the nine scored categories only, see below); last full score under rubric v2: none; round 22 was provisional too
Targets: 50 required / 34 matched / 0 failing / 15 unverified / 1 waiting on a decision
Top issues: PR-0378 (KO cut), PR-0379 (double images), PR-0380 (boss jumps), PR-0407 (Ch XIII retry trap), PR-0353 (Ch XIII victory unseen), PR-0269 (Sin card chain 48.5 percent), PR-0148 (no listening verdict)
Coverage: 17 of 18 chapters by real keys; reused and not tested listed below
Next required review and why: another deep review on the next build; mandatory CHK-002, 015, 022, 023 UNVERIFIED keep this obligation pending
Elapsed review time / repeated work avoided: about 600 minutes of workflow wall clock; round 22 text, audio and byte-comparison evidence reused with arguments
```

## Score (code output, verbatim)

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
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - 9 critical or major issue(s) remain open
  - encounter ffx2-trema has no complete real-input flow
  - 15 required target(s) unverified
  - 1 required target(s) waiting
  - only 34 of 50 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
  - human judgment not recorded: Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
  - human judgment not recorded: Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
  - human judgment not recorded: Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
  - human judgment not recorded: Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
  - human judgment not recorded: Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
  - human judgment not recorded: Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
  - human judgment not recorded: Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
  - human judgment not recorded: Overdrive inputs: check the Bushido order against the Steam HD copy (D:/Tools/ffx-hd) so the "our estimate" label can go (PR-0308); and how a phone player answers a Bushido or Swordplay (PR-0360, PR-0361)
  - human judgment not recorded: Encounter: is Trema (6.5 percent per attempt) and Den of Woe (24 percent first try) the intended difficulty at human pace (PR-0227, PR-0306, PR-0353)
  - human judgment not recorded: Feel: is a plain FFX-2 Attack of 1.2-1.7 s with the run-in the rhythm he wants; do the telegraph hold (1.14 s, paintings not yet installed) and the 1.22x dressphere push-in read as enough (PR-0368, PR-0314; CHK-B2)
  - human judgment not recorded: Visual: taste on the new paintings (Evrae E1-H, the plate wings, the Yuna, Rikku and Paine dresspheres) and the Echoes of Spira wordmark (CHK-B3)
  - human judgment not recorded: Feel: is the one-frame KO cut wanted (EC-1001-09), or should a KO travel (PR-0378)
  - human judgment not recorded: Visual: calibrate the five sub-scores against Bailey's own ratings after he plays release 39 (D-426)
  - human judgment not recorded: Visual: which Leblanc backdrop is approved, the tile's picture or its text (PR-0399)
  - human judgment not recorded: Narrative: may FFX-2 Ch XIII and XV open with a third-person narrator, or should Yuna narrate (PR-0390)
  - human judgment not recorded: Combat (FFX): do aeons have a Defend command in the Steam HD copy (PR-0383)
  - human judgment not recorded: Audio: should a defeat play a cue (THEMES.md has no defeat row; every defeat is silent)
  - human judgment not recorded: Encounter: what a lost Ch XIII link-2 Retry should do when the carried Paragon end state has one or no survivor (restore the girls as the Ch XI Save Sphere checkpoint does, fall back to Paragon, or say so on the defeat card; TR5 b, D-146; PR-0407)
  - human judgment not recorded: Audio: whether the Ch II epilogue, the Ch III link-2 seam (scripted silence), every defeat and the Ch IV victory should play a cue (PR-0410)
  - human judgment not recorded: Visual: lunge reach for targets above or below the attacker is a known limit (D-461); does Bailey accept it
  - human judgment not recorded: Onboarding: key remapping, REDUCE FLASHES row and a colour-vision option (PR-0032, a proposal)
report: valid evidence
```

Chief's arithmetic is not the verdict; for reference only, the nine scored categories weight to 8.76 of 10 over 90 weight points (audio's 10 points are UNVERIFIED and never averaged away or zeroed).

## Verdicts

- deployment: PASS — PASS: the exact artifact is live (verify-live --full 3,848 of 3,848, hash 769a43ed69b4fdb2), 81 capture and continuity runs loaded and played it with 0 responses of 404 or above and 0 console errors; the first-load time clause is not covered.
- changedArea: FAIL — FAIL: release 39.1's changed systems did not all meet their targets or were not shown to. Met: per-pose registration (1,688 to 5 head swaps over tolerance); the Gullwings title; PR-0385, PR-0406 and PR-0382 repairs; the 39.1 upload-stall fix in Ch I, Anima and Trema; the Tidus lunge reach. Not met or not shown: CHK-026 and CHK-027 still FAIL; the D-461 reach for FFX-2 fiends and girls is UNVERIFIED; the FFX-2 slow frames did not fall in Vegnagun and Fallen Aeons; PR-0389 and N1 (the mark key) are unproven; the floor-lift poses (Lulu critical, Rikku Berserker) were not individually captured.
- milestone: not assessed — not assessed (a deep review).
- ship: SHIP

### Ship reasons

- SHIP: no critical defect was found: every chapter that ran reached an outcome by real input, the one chapter without a victory (Ch XIII) is an evidence gap with the loss, results and Retry paths proved, the exact artifact is live (3,848 of 3,848 files), and no save path changed.
- No critical or major issue is a regression against live release 39 (816d80f9): every major is carried at the same or a lower rate (snaps 0.56 to 0.58, double images 158 to 161, worst jerk 815 to 807 px) or is new but not introduced by this change (PR-0407 is the authored carry-over of TR5 b, present on the previous build).
- The release's headline fix works: head swaps over tolerance fell from 1,688 to 5 and feet slides from 1,749 to 1 of 10,500; PR-0385 and PR-0406 are repaired; PR-0382's Ch XII heap is not reproduced.
- Regressions found are polish and unproven: FFX-2 slow frames did not fall in Fallen Aeons, Vegnagun (PR-0395, low confidence), and two small layout items at 2560 (PR-0413, PR-0416) with no baseline.
- Majors disclosed and carried into the next batch: PR-0378, PR-0379, PR-0380, PR-0407, PR-0353, PR-0269, PR-0148, PR-0099, PR-0222.

## The ten categories

### combat: 9.4

CHIEF: score kept at 9.4 as audited (no engine, data or tactics change; 1,600 A/B runs identical; real-key turn counts reproduce round 22). | AUDITOR (combat, round 23, live main d3fe9fe5 bundle B6DQPYhY, no browser; working tree e6eb4c49 has no src change over d3fe9fe5). Held at 9.4 (round 22: 9.4). Engine unchanged by construction and by running code. `git diff 816d80f9 d3fe9fe5` over src/battle, src/engine/tactics, src/data excluding art and src/ui/ffx and src/ui/ffx2 is EMPTY; the only changed data files are the three art registration tables (poseRegistrationFfx/Ffx2/Foes.ts: per-pose scale, stance, upright; not game data). So there is NO changed game-data value to audit against research/. The presenter changes (BattlePresenterBeats/Events/Motion/Ports/Stage/Actors, motion/StrikeReach.ts, StandReach.ts, Silhouette.ts, PaintedActor.lunge/poseShape) are read as presentation only: the lunge keeps its 440 ms and its 0.58 apex, `reachOffset` rides only the extra distance beyond the house lunge, ctx.burst is set per event and cleared in finally, and nothing touches engine state, RNG or tick budgets (FFX-2 Active ATB clock included, since the lunge duration did not change). PROOF BY RUNNING CODE (critic/rounds/round-23/combat/): (1) A/B event-log hashes against round 22's saved hashes (b1-hash.json, built on 816d80f9): tests/unit/iter2-b1-bench.test.ts, FFX-2 chains IV, V, VI, V and VI change-once, XI, XIII, XV at the human Wait split and Active 1.5 s, 100 seeds each = 1,600 runs: 0 of 1,600 logs moved (also 800 new bench-D=0 rows with no base). Win rates identical to round 22: IV 100/100, V 91 (Wait) and 44 (Active), VI 83 and 24, XI 81 and 57, XIII 5 and 4, XV 20 and 6. (2) FFX three-line bench (intended, advisor top row, mash), 53 rows over seeds 1-40 plus 40 large seeds: the rows JSON is byte-identical to round 22's (ffx-three-line-r22-cand.json). (3) Chapter XVII card chain 200 seeds: card 97/200, sensible 51/200, naive 0/200, losses identical to round 22 (sin-ab-cand.json equals round 22's). (4) Advisor-card follower on all 7 FFX-2 chapters through setupForChapter/setupForNextLink, 25 seeds: file identical to round 22; 0 recommendations of a Change into Lady Luck or her reels. (5) Round 22's probes re-run and byte-identical: aeon Defend rows, Bushido/Swordplay overlay params (Swordplay zones 22/16/12/9 percent, timers 1,400/1,150/900/700 ms = research/ffx-combat-core.md 5.3), Lady Luck Garment Grid layouts (equal research/ffx2-lady-luck-availability.md), Leblanc Rikku White Mage. (6) Unit suite `npm test`: 897 files, 887 pass, 5 skipped, 5 fail; 13,212 tests pass, 10 fail. The 5 failing files are not combat: strategy-ffx2-bahamut heal-only (a 15 s timeout under a loaded host; passes alone in 8.8 s, 19/19), live-url-follows-host (scratch scan), and three art-on-disk files (ui-portrait-face-crop: Lady Luck PNGs absent from this checkout; pose-install-0930 and pose-scale-art: masters on this disk differ from the recorded hashes, see the cross-reference issue). npx tsc --noEmit clean; node tools/orphans.mjs 24 orphans, none from release 39.1 (StrikeReach, Silhouette and the r391 modules all have importers). SAMPLED UNCHANGED MECHANICS (sourced tests pass in the suite): CTB rank linear and Haste floor(recovery/2), Slow x2, Haste halves pending wait (ffx-ctb.test.ts, research ffx-combat-core 1.4); Zombie, Regen floor(elapsed*maxHP/256)+100, DURATION_STATUSES (ffx-statuses.test.ts); ffx2 ATB goldens, chain, spherechange, status locks; Overdrive inputs and pickers; hit rule (magic and Overdrives never miss) in ffx2-magic-never-misses. REAL KEYS (capture owner, seed 1 pinned unless noted, headless GPU Chromium): turn counts reproduce round 22 exactly where the fight is deterministic by seed (Flux v73, Anima v52, Natus v45, Isaaru v32, Yojimbo v17, Sin Face v64, Yunalesca d116), which is a live confirmation that the engine did not move; cross-game leakage check over 63 battle logs: 0 FFX logs contain atb, spherechange or chain events, 0 FFX-2 logs contain overdrive-gauge. Mechanics seen live this round: summons and Bahamut/Ifrit/Ixion/Shiva in Ch III, Kimahri rage minigame (Ch I), Wakka element reels (Ch VIII), Auron Bushido and Swordplay orders 8 to 12 per fight in Ch XVII, Lady Luck Change in and out in Ch XIII, dressphere changes and chains in FFX-2 IV, V, VI, XI. Boss HP seen in the live logs equals research: Flux 70,000, Evrae 32,000, Braska 60,000 then pagodas 5,000, Yunalesca 48,000 form, Bahamut 8,400, Fallen Aeons Shiva 14,800, Ixion 12,380, Vegnagun Tail 34,200, Baralai shade 12,220, Paragon Oversoul 210,000, Trema 999,999. Held below 9.5 by: PR-0269 (Ch XVII card chain 97/200, unchanged, now four reviews open); the Lady Luck reels and Swordplay numbers remaining labelled estimates; and evidence that is thinner than a full round on two points: no Lady Luck reel throw and no Swordplay tier were captured this round (reused from round 22 with a dependency argument, see checks) and the changed lunge reach has no impact-frame capture in my evidence (CHK-023 UNVERIFIED for that one subsystem). Cross-reference, not scored here: Ch VI showed a 145 s quiet stretch with the White Magic list open (run.json stallRecovery, Wait holds the clock by design; cause not established, R22-FEEL-05).

### encounter: 8.7

CHIEF: score kept at 8.7: 0.2 below round 22 for PR-0407 (re-read by the chief from trema-link2-probe.json). PR-0353 is an evidence gap on a required chapter, scored under delivery, not here. | AUDITOR (encounter, round 23, live main d3fe9fe5). 8.7 (round 22: 8.9): down 0.2 for one newly measured major in a shipped chapter (the Chapter XIII retry state below); everything else is unchanged by construction. No enemy, AI script, phase rule, party preset, chapter file or story file changed between 816d80f9 and d3fe9fe5 (diff over src/data excluding art, src/battle, src/story empty). Win rates re-measured and equal to round 22: FFX intended-line wins over seeds 1-40: Ch I 18/40, II 40/40, III 39/40, X-anima 38/40, VIII 40/40, Yojimbo 33/40, Natus 31/40, Omnis 27/40, Isaaru 40/40, Sin Face 12/40 (advisor 15/40), mash 0/40 everywhere; FFX-2 at the human Wait split, 100 seeds: IV 100, V 91, VI 83, XI 81, XIII 5, XV 20; Active 1.5 s: IV 100, V 44, VI 24, XI 57, XIII 4, XV 6; Ch XVII card 97/200. Canonical tactics were not penalised. REAL-KEY FLOWS (CHK-022 coverage gaps of round 22): Ch II Yunalesca WON (seed 2, 118 turns, results ZANARKAND DOME CLEARED AP 14,000 x3 GIL 9,000 Lv. 3 Key Sphere = research ffx-yunalesca rewards; board and reload kept the clear; seed 1 was a defeat and the harness line is the known Zombie Curaga loss, engine intended 40/40); Ch III Braska WON (seed 3, 289 turns, 30:47, AP 0 GIL 0 = research ffx-bfa-yu-yevon rewards 0/0; seeds 1 and 2 stalled at the 15 and 25 minute budgets, the fight is 244+ turns, PR-0257); Ch V Vegnagun WON (seed 3, 138 turns, EXP 42,400 AP 120 GIL 18,300, aftermath Shuyin and Lenne; seeds 1 and 2 stalled at budget); also Ch I, IV (win, lose and retry), VI, VII, VIII, IX, X, XI (seed 2, 117 turns), XII (seed 2, AP 24,000 GIL 12,000), XIV, XV (seed 2, 38 turns), XVI (Ixion, 55 turns), XVII (seed 2, 249 turns), XVIII (64 turns). 17 of 18 chapters reached a real-key victory, results, Confirm, board and reload. NOT REACHED: Ch XIII (Trema): 0 wins in 26 real-key attempts over 4 runs (seeds 1, 2, 3 and drawn), plus one injected autoBattle run that lost; the victory, post-battle scene and results-to-board path stay UNVERIFIED for XIII (loss, results and retry are proved). WHAT THE XIII DATA SAYS (new this round, engine probes, critic/rounds/round-23/combat/trema-link2-probe*.json): the shipped chapter is Oversoul Paragon (210,000, link 1) then Trema (999,999, link 2) in Paragon's end state, and a defeat in link 2 RETRIES link 2 from that same carried state (TR5 b, in memory, restartCarry/BattleScreenFlow). Bench: link 1 28/200 at the human Wait split (real keys: won once in 12 attempts, run r4 attempt 12, which agrees); chapter 13/200 (6.5 percent), as round 22. From the 28 link-1 wins at 20 retries each (560 link-2 runs, kit-intended line): 321 won (57 percent) overall, but by the number of party members alive at the seam: 3 alive 301/340 (88.5 percent), 2 alive 20/20, ONE alive 0/200, and 107 of those 200 lose within two player decisions (6 before the first). 10 of the 28 link-1 wins (36 percent) end with one survivor. Active ATB, 27 wins: one alive 0/240 (152 lost within two decisions), two alive 35/80, three alive 167/220. The live run shows exactly this: run r4 attempt 12 won link 1, then link 2 was entered with Yuna and Rikku KO and Paine at 4,269 of 9,999 against Trema 999,999, and attempts 13 and 14 lost in 2 and 1 turns to Dying Star and Flare as Trema's first action (engineHp in picks[0]; battleSeeds 'link 2' and 'retry after attempt 12/13'). Retry re-enters that state with no prep, so a player who beat Paragon with one survivor sits in a loop of near-instant losses; only leaving to chapter select restarts Paragon. See issue R23-ENC-01. Also held: PR-0269 (Sin), PR-0257 (Braska length 2.3x the sourced rows: 289 turns this round), PR-0279 (Sin difficulty, Bailey's question D-282), PR-0227 and PR-0306 (Bailey's difficulty questions for XIII and XV; XV intended bench 20/100 Wait and 6/100 Active, real keys won it on seed 2). Release 39.1 adds no new encounter content; per-pose registration and stance tables and the lunge reach do not change any fight, rule or reward.

### visual: 8.3

CHIEF: kept at 8.3 (round 22 7.8): the owner's size and feet complaint is measurably fixed (1,688 to 5 head swaps; strips read by the chief), motion continuity is not. | Round 23 visual audit of live main d3fe9fe5 (bundle B6DQPYhY, echoesofspira.com), judged from the capture owner's PYREFLY_BROWSER=gpu headless Playwright evidence (I opened no browser) and the continuity harness output. Round 22 was 7.8 on 816d80f9. STRENGTHS: (1) Approved art is intact on the LIVE site. verify-approved on the shared tree reads 741 ok, 19 mismatched, 47 missing (judge-locked 48/0/0), but I traced all 66: the 19 mismatches are the shared tree still holding the pre-D-380 originals and the pre-D-458 title painting (recorded hashes are Bailey's authorised replacements, replacedBy D-380 and the 2026-10-05 title approval) and the 47 missing are the 45 Lady Luck paintings and two @2x masters that exist only in the release tree. Live check: the shipped tidus attack, ffx2-bahamut idle and tidus ready WebPs decode pixel-identical to the D-380 install-ready PNGs (0 differing pixels; the originals differ in 3257, 354 and 168 pixels), 14 live PNG masters sampled (seymour-flux-body, yunalesca-1, leblanc, x2-ixion, sin-core, auron critical, tidus/yuna/rikku @2x, ff7-cloud, trema hurt, sin-core portrait, vegnagun-head ko, x2-shiva ko) are pixel-identical to the approved masters, and all 47 Lady Luck/@2x files are pixel-identical to the approved backups with the backup hash equal to the recorded hash. Live shipped keyart.2x.webp sha 58a13dd7 equals the recorded approved hash. (2) The release's headline fix works: pose registration took CHK-026 from 1688 head swaps over tolerance of 10479 (round 22) to 5 of 10500 and feet from 1749 to 1, so a figure no longer changes size or slides at a swap; chapters IV, V, VI, VIII to XVI and XVIII pass CHK-026 and Ixion (XVI, the round 22 gap) passes. D-457 floor lifts and the D-461 lunge solve show no visible regression in any capture I read. (3) Every one of the 18 chapters reads as one painted 2.5D look: figures face the foe (Paine, Yuna Gunner, Rikku Lady Luck and the Dark Knight set checked), feet sit on their ground ring, rim light and backdrop depth hold, both Yu Pagodas stand clear of Braska's aeon, Natus is large and clear of his Sensor card even at 1280x720 (PR-0406 not reproduced), Dr. Goon and Fem-Goon are visible beside Ormi at 2560x1080, the four Omnis discs are visible, the Magus Sisters (Sandy, Cindy, Mindy) read as three distinct figures, and the Ch XII party no longer stands in one heap (PR-0382 not reproduced in the first menu). (4) The new Gullwings title key art renders as approved at 1600x900 with the ink slab, PRESS ENTER and vertical legend kept. WEAKNESSES: (1) CHK-027 still FAILS and is unchanged from live 39: 0.58 snaps per minute (limit 0.25; round 22 0.56), 78 of the 102 hard cuts are the KO swap (a standing figure cut to the lying one in one frame: Ch I Yuna idle to ko strip), 161 swaps with a double figure at severity 0.40 or more (round 22 158; Auron and Tidus attack to follow show 7 to 8 ghost frames of two figures, Rikku's rise from KO shows a lying and a standing Rikku together for 4 frames), 1092 jerks of 40 px or more (round 22 979; mostly boss painting swaps such as the Vegnagun tail 807 px under a bloom flash). (2) CHK-026 still formally FAILS on 5 head swaps (3.1 to 5.2 percent against 3) and 1 feet swap (4.2 px against 2, Ch I Yuna hurt to idle): invisible to the eye, but a FAIL and a cap. 3313 of 10500 swaps are read only by mass at a 30 percent tolerance (worst 28.7 percent, Leblanc's logos-room hurt to cast, no strip generated) so unregistered figures can still jump without failing. 17 dressphere and form (costume) swaps are outside the judgement (worst 51.3 percent head, 45.6 px feet); Ch XIII's Paine Dark Knight to Lady Luck swap is a hard cut with no in-between (strip swap-019). (3) Carried polish seen again: Cindy and Mindy bar names overprinted by status chips (Ch XI link 2), the chapter-select hero card paints with no boss layer at arrival (03-card and 34-board-after in Ch VIII; present after reload), party plates over the lower legs of figures standing at right (Ch II, XII, XVIII Wakka), the Omnis intent text over Omnis's lower body, the Sensor card over Seymour's lower legs at 1280x720, a washed-out grey mid-fight frame in Ch XIV (PR-0403, low confidence). (4) NOT SEEN, so the score is provisional: 2560x1440 (2560x1080 and 2000x1012 were captured; 2x masters were requested at every size), Ch XI at 390x844, the pause CHAPTER tab hero plates, Sin Face mouth-open, Vegnagun links 3 and 4, and the Ch XIII victory (0 wins in 26 attempts, so the state after a win is unseen). BAILEY'S FIVE SUB-SCORES (provisional, RUBRIC 6a caps applied): characterModels 7.0 (capped by CHK-026 FAIL; uncapped reading 8.8 because the size problem is essentially fixed), enemyModels 8.4, animation 7.0 (capped by CHK-026 FAIL and by snaps 0.58 over 0.25; uncapped reading 7.4), fidelity 8.6 (live art pixel-proved, 1600x900 judged in game, 2560x1440 unseen), camera not judged by this auditor. Reason for the gain over 7.8: the headline size and feet defect is fixed and live-verified; reason it stays below 9: motion continuity (hard KO cuts, double figures, boss painting jerks) is unfixed and visible every fight.

### feel: 8

CHIEF: kept at 8.0 (round 22 7.8): same reasoning; CHK-027 FAILS in all 18 chapters and caps the animation sub-score. | FEEL AUDITOR, deep round 23, live main d3fe9fe5 bundle B6DQPYhY, https://echoesofspira.com/, headless Playwright from node, PYREFLY_BROWSER=gpu (no black canvas, no fallback). I opened no browser; everything is read from critic/rounds/round-23/continuity/ (18 chapters, 9,949 s of battle, 625,187 rendered frames, about 59.5-60 fps, 0 probe errors, 75 jerk strips, up to 10 swap strips and 5 ghost strips per chapter) and critic/rounds/round-23/evidence/ (timed sequences seq-transition-into-battle / seq-party-action / seq-action-playing / seq-spherechange, turn-log.json, run.json, 1,830 index entries of which 8 are UNVERIFIED and all 8 are the 30-post-scene frame where the scene comes after results). No continuous video exists: motion is judged from the harness numbers, strips and 230-300 ms sequences, which cannot show timing between sequence frames.

WHAT IMPROVED (the owner's size complaint, measured): CHK-026 went from round 22's 1,688 of 10,479 swaps over the head tolerance and 1,749 standing swaps over 2 px of feet slide to 5 head swaps and 1 feet swap over tolerance in 10,500 judged swaps. Where a head is registered the worst is 5.2 percent (Yuna idle to victory, Macalania, 3 percent allowed); the one registered feet miss is 4.2 px (Yuna hurt to idle, Ch I). Strips swap-984-tidus-attack-follow, swap-234-tidus-attack-follow, swap-132-auron-attack-follow and swap-517-rikku-ready-attack show the head on the green line and the feet on the orange line across the swap (feet 0 px, head x0.98-1.00). FFX-2 is no longer the exception (round 22: Yuna idle to ready x1.38 with registration; now worst FFX-2 registered head 9.4 percent only where a silhouette read is used, registered 2.5 percent in Ch XV). The 5 remaining FAILs are mostly the silhouette reading (Leblanc fem-goon 28.7 percent, Sin fins Yuna KO rise feet 39 px read from a lying figure's silhouette, probably a reading artefact), so CHK-026 stays formally FAIL but is close to a pass; the formal FAIL still caps characterModels and animation at 7.0.

WHAT DID NOT IMPROVE (CHK-027 FAIL in all 18 chapters, nothing in release 39.1 targeted it): 96 snaps in 9,949 s = 0.58 per minute against 0.25 (round 22 0.56, release 38 0.53); 78 of the 96 are the KO collapse (standing painting cut to the lying one in one frame, strip swap-289-yuna-idle-ko, jerk-000-yuna in Fallen Aeons: IoU 0.03, 0 blend frames; this one scripted beat alone is 0.47 per minute, still over the limit), 15 are idle-to-idle cuts (14 in Ch XIII, see R23-HARNESS-01) and 3 are Sin fin cast cuts. 9,858 of 11,547 counted swaps (85 percent, round 22 85 percent) show a double image, 161 at or over the fail severity 0.40 (round 22 158; Sin fins 61, Yunalesca 22, Leblanc 20, Bahamut 14, Vegnagun 12), worst 0.446; the attack-to-follow strips show two Tidus/Auron silhouettes (IoU 0.14-0.20) for 8 frames. 3,158 jerks (19.0 per minute, round 22 18.2), 1,092 of 40 px or more (6.6 per minute, round 22 6.7), of which 610 (3.7 per minute) are not at a swap; worst 807 px (Vegnagun tail pose swap, partly under a white flash), 550 px (Braska's two Yu Pagoda hands in one frame), 513 px (Sin overdrive), 340 px (Sin right fin, 4 non-KO snaps IoU 0.10). Unchanged from round 22 within noise: this is a continuing, owner-reported break, not a regression and not a pass.

WHAT HOLDS (input, pacing, handover): (1) Turn cadence: median gap between commands 2.4-8.1 s in every chapter that was played by the route (Ch I 5.5 s, Ch IV 6.1 s, Ch VIII 3.4 s, Ch XVIII 2.4 s, Ch XVI 8.1 s); long gaps (30-61 s in Ch V, XI, III, VI) are ATB gauge waits or route retries (see R23-HARNESS-02), not shown to be dead air for a player. (2) seq-transition-into-battle (Ch I, Ch IV): BATTLE START plate at 119 ms, the fight at 524 ms, the hero cut-in wipe by 1.1 s, first menu with its coach card by 1.4 s: no dead air. (3) seq-party-action Ch I: Hastega resolves in about 2.2 s with a banner per haste, the menu back inside 2.3 s. seq-action-playing Ch I: Lance of Atrophy telegraph, hit ring with the 799 numeral, 'Yuna became a Zombie' banner, Seymour's 'Let it in.' about 1.8 s later, readable. Ch IV: Magic Break arc and 157 numeral and Mega Flare intent card read; two translucent Bahamuts overlap for about 0.5 s (PR-0379). (4) seq-spherechange Ch XIII: Paine's Lady Luck change is a light column plus the name chip and is settled in about 0.6 s; the PR-0314 push-in is not visible. (5) Skip and replay: Esc over the pre-battle scene opens pause (05b every chapter), 1 hold of Enter skips; Retry reaches party prep then the battle in Ch I, IV, II, XV, XIII (retry seeds 1001; Ch XIII 14 attempts in one run); the clear survives a reload in all 17 victories. (6) The pad shim route (virtual pad plus keyboard, Ch I and Ch IV) reaches victory, results, board and reload in 9.7 and 6.7 minutes against 7.8 and 6.2 minutes on keys: the pad path works to the end; it is an emulation, not a real controller. (7) Camera: 1,157 camera cuts or whips in 9,949 s (7.0 per minute, a cut per action as the camera grammar intends); no new framing alternation was seen in the strips and the Ch VII captures.

FRAME TIME: 3,482 of 625,187 frames (0.56 percent) over the slow line against 0.38 percent in round 22; worst single frame 580 ms (Ch V, round 22 474 ms). FFX chapters stay at 0.05-0.26 percent and Ch I's worst frame fell from 533 ms to 114 ms, but the FFX-2 chapters carry 1.05-1.79 percent (Bahamut 1.25, Vegnagun 1.25, Fallen Aeons 1.05 (was 0.62), Trema 1.66, Ixion 1.79) and the maximum is lower in 8 chapters and higher in 9, so the 'upload stalls fixed' note is visible in Ch I and not shown elsewhere; host load differs between rounds, so confidence is low (R23-DELIV-01, cross-reference only).

IXION CONTINUITY (round 22 gap): closed. Ch XVI: 407.5 s, 400 swaps, CHK-026 PASS (head 0 over, feet 0 over), snaps 1 (a KO) = 0.15 per minute, 0 double images at fail severity, 23 jerks of 40 px or more, worst 124 px; CHK-027 still FAIL on those jerks.

FIRST-TIME-FAN LENS (from the strips, no score): what would still pull a watching player out is, in order, the KO cut (a figure is standing, then lying, in one frame), the two overlapping bodies on every attack-to-follow, big bosses jumping to a new pose at once (Vegnagun tail, Sin fins, Braska's hands), and 1-2 percent slow frames in the FFX-2 chapters. Not seen: sliding feet, size jumps on the FFX party, or outline fringe.

SCORE 8.0 (anchor: 7 conspicuous weaknesses, 9 polished with minor issues). Round 22 was 7.8. What counts as a gain: the owner's own size and feet complaint dropped by two orders of magnitude and the strips confirm it by eye, which is a real gain in how the figures move; the other half of the complaint (snapping, half-motion, jerks) is measured unchanged, so the gain is 0.2, not more. Input, pacing, handover, skip and retry are polished. SUB-SCORES for the chief (Bailey's five, advisory, not in the weighted score): characterModels capped at 7.0 by CHK-026 FAIL (uncapped about 8.6), animation capped at 7.0 (uncapped about 7.3: KO cut, double images and boss jumps unchanged), camera about 7.8 (not re-graded: no camera change judged beyond the strips). Not covered: motion in cutscenes and on the pause screen, effects drawn by no plane, whether the registered table is right (the strips agree with it for the 8 swaps I read), a physical lunge reaching its painted target (D-461) and its stated limit for targets above or below the attacker: the harness does not measure reach, and no sequence of a lunge was captured in this round (capturesNeeded).

### narrative: 9

NARRATIVE AUDITOR, deep round 23, live main d3fe9fe5. No browser opened. Read from the capture owner's dboxTimeline text in 61 run.json files, the results text, and the scene, results and board frames (31-results, 33-after-confirm-scene, 34-board-after, 35-board-reload) of the 17 victory runs.

REUSE, WITH DEPENDENCY ARGUMENT: git diff --stat 816d80f9 e6eb4c49 over src/story, research/writing-bible.md and src/data shows only src/data/art/poseRegistration*.ts; src/story and the writing bible are unchanged, so no script changed since round 22 (and round 21). Compared against round 22's timelines, 9 of the 17 chapters are line-for-line identical in speaker and text (Ch I 61 lines, IV 30, VII 55, VIII 47, IX 33, X 35, XIV 31, XVIII 23 plus Ch XII with one added Auron line), so the reading of voice, beats and tone from rounds 21-22 carries for those chapters. Labelled reused. It does not carry for scene staging: src/scenes changed (cavern-stolen-fayth-arrival, cavern-sakura-timeline, bevelle-underground, garden-of-pain, plateDim) and the presenter changed; I re-checked reach on this build instead (below). What was NEW to read this round, because the route finally reached it: Ch II Yunalesca's ending (63 lines), Ch III Braska (78), Ch V Vegnagun and Shuyin (98), Ch VI Leblanc (86), Ch XI Fallen Aeons (25), Ch XV Den of Woe (25), Ch XVI Ixion (38 lines), Ch XVII (51).

BEATS AND VOICE, re-read: FFX stays elegiac and short. Ch II: Yunalesca 'There. Now no one can summon it.' then 'I hope you find something better. I never could.'; Wakka/Rikku/Lulu/Yuna trade 'We got a no. That's not nothing.' / 'It's very close to nothing.' / 'It's a start.', Kimahri third person, Tidus asks Auron the right question and gets 'Now you're asking the right questions.', then Tidus's retrospective narration. Ch III: Yuna thanks each aeon by name ('Shiva. You always came quietly.'), Auron 'That's all done ever sounds like.', 'Overdue. By ten years.', Tidus 'Then don't say goodbye. Say the other thing.' and the narration 'I left in the part where she kept walking.', matching the bible's one permitted sincere beat (bible lines 731 and 864). FFX-2 stays buoyant with one held beat: Ch V Paine 'It's encouraged.', Brother and Buddy's 'Give 'em a minute', the Fayth Boy's yes/no choice and 'Rikku talked the whole way. I let her.'; Ch XVI keeps Rikku's 'Don't lean over it. Please don't lean over it.' beside the Farplane scene and the whistle-and-light beat. Each game's tone is right for itself (CHK-021).

REACH BY REAL INPUT (CHK-022), round 22's gap closed: 17 of 18 chapters reached victory, aftermath scene (before or after results as the chapter defines it), results, CONFIRM, the chapter-select board with the clear, and the clear kept after a reload: Ch I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIV, XV, XVI, XVII, XVIII (index and run.json boardAfter / boardAfterReload: cleared contains the chapter in all 17). Ch II (seed 2, 10:49), III (seed 3, 30:47, 261 turns), V (seed 3, 20:00) and XVI (8:26) were the round-22 gaps and are now reached. Defeat, results and retry reached battle again in Ch I, IV, II, XV, XIII and the touch run. NOT reached: Ch XIII Trema's victory, post-battle scene and results-to-board (0 wins in 26 real-key attempts over 4 runs, best left Paragon at 27,009 of 210,000), the sixth consecutive round (PR-0227, an encounter question); its opening scenes and defeat path were read.

OPEN POLISH, re-observed: PR-0254 (Ch VII Talk silent) and PR-0255 (five Tromell lines with speaker '' in the Ch VII aftermath: 'Step away from Lord Seymour, Lady Summoner.' etc.); PR-0262 ('...Okay. Next one.' is the first quip in Ch I, II, VIII, XVII, XVIII; Ch V now adds '...Let's go home.' and the rest are distinct); PR-0390 re-observed and widened: Ch XIII ('Under Bevelle, a dungeon goes down a hundred floors.') and Ch XV ('Ten old spheres. Paine's recordings, every one.') open in third person, and Ch XVI mixes third-person captions ('At the top of the stairs, the aeon turns on them.', 'Ixion rises and charges.') with Yuna's first-person narration ('I fell a long way.') inside one chapter.

SCORE 9.0, held (round 22: 9.0). The text did not move, reach is now 17 of 18 (round 22: 9 of 18; round 21: 16 of 18), and the new endings read in voice, but the ceiling stays where it was: the same open polish, the unreached Trema ending, and the two checks only the owner can close, a natural-pace read (the route taps Enter every 1.5 s, so dwell times such as 'Ixion' lines at 1.5 s each say nothing about reading pace) and taste (CHK-B3). Not scored: the new Gullwings title key art (approved by owner decision, D-458 to D-460; the title shows only the FFX-2 trio under the shared title, noted for the visual auditor).

### audio: UNVERIFIED

CHIEF: UNVERIFIED, no number, fifth review in a row: Bailey's numeric listening verdict (CHK-B1, PR-0148) does not exist, and no agent can hear. | UNVERIFIED, no number: docs/audio/OWNER-VERDICT.md (last entry 2026-09-28; file unchanged since 2026-09-29), docs/target/targets.json and docs/target/decisions.json hold no numeric owner listening score for the shipped music v2 and SFX v2 (D-349 'no number given yet'; D-404 and D-307 to D-309 adopted on recommendation with 'I'll listen later'; NOW.md 2026-10-04 'his listening number is STILL OWED'). Approving a direction is not a numeric score (RUBRIC sections 5 and 6). I cannot hear and listened to nothing; every judgement is decoding, ffmpeg measurement and the capture owner's AudioManager debug rows and network lists. I opened no browser and started no server (the capture owner's runs record mode gpu in run.json). TECHNICAL: PASS. Audio is unchanged since round 22: git diff 816d80f9..d3fe9fe5 over src/audio, public/audio, docs/audio, tools/audio, src/story and src/data/encounters is empty (only the pose-registration data files under src/data/art differ); all 29 shipped audio files (26 music, 2 SFX sprites, manifest.json) have identical sha256 in critic/artifacts/816d80f9.json and critic/artifacts/d3fe9fe5.json, equal public/audio on disk, and equal the LIVE https://echoesofspira.com/ bytes (fetched and hashed today: 29 of 29 HTTP 200, audio/mpeg for the 28 MP3s, sha256 and byte count equal to the manifest). ffmpeg 9.0.1 ebur128 on 28 of 28 MP3s decodes with no errors: music -15.8 to -16.0 LUFS integrated, true peak -1.1 to -3.1 dBTP; sprite.mp3 -19.4 and sprite-v2.mp3 -18.5 LUFS, peaks -1.1 dBTP. node tools/audio/qa.mjs --strict: exit 0, 0 cue findings, 0 SFX findings, 0 clipped samples, every loop seam ok; 134-cue v1 and 100-cue v2 sprites peak -1.13 and -1.12 dBTP; total 88.49 MB of the 90 MB budget (1.5 MB headroom: any owed new cue needs a budget decision). 35 audio vitest files, 536 tests pass. themes-audit: 0 of 18 chapters depart from the chapter cue map; the same four SOURCE cues depart from the bible as in rounds 20 to 22 (scene-gagazet, scene-dreams-end, scene-farplane lack a tempo map, scene-dreams-end FAREWELL_RISE absent, scene-macalania-temple not in the bible's cue map; PR-0039, PR-0260); not player-observable. ROUTING (CHK-023): 81 audio-debug files (63 evidence runs plus 18 continuity runs, 622 samples, 476 with a cue): music.current matched playing in 622 of 622; every cue sample was source 'prerendered' (476 of 476, 0 synth music); ready true, not muted, volumes 0.8/0.7/0.7, sfxMix option b bus 0.70 in every sample; v2 sprite game equal to the chapter's game in 622 of 622 (ffx in FFX runs, ffx2 in FFX-2 runs); no music gain anomalies (472 of 476 at gain 1, the other four mid-fade); 0 console errors in 69 run.json files; network: 0 not found in every run, every music key the chapter needs was requested. The right cue at the real moments, matched to THEMES.md 'The chapter cue map': battle cue at the first menu in 18 of 18 chapters (boss-seymour I and XII, boss-yunalesca II, boss-jecht III, boss-ffx2-aeon IV, VI, XI, XVI, boss-vegnagun V, boss-seymour-macalania VII and X, boss-evrae VIII, XVII, XVIII, boss-yojimbo IX and XIV, boss-shuyin XV, XIII on its labelled scene-bed stand-in scene-bevelle-underground); scene cue at the pre-scene sample in 50 of 55 non-Ch-I runs (the 5 misses are PR-0373, below), Ch I silent by script (seymour-flux.ts opens music(null,600), the sting enters at line 105; 9 of 9 runs, as rounds 20 to 22); victory cue at results in every winning run: victory-ffx in I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII and victory-ffx2 in V, VI, XI, XV, XVI, every one on the right game's cue (24 of 24 results samples of won fights), Ch IV win silent by design (cue map 'none'); NEW this round: Ch XIII phase 2 routing PASS (ffx2-trema-win-r4 seam-2 samples at 4,260, 4,295 and 4,333 s all boss-ffx2-aeon at gain 1 after the scene-bed link 1), Ch XV Den of Woe victory-ffx2 at results (r2 and pm), Ch V Vegnagun links boss-vegnagun across seams 2 to 5 then victory-ffx2 at results (pm and r3; boss-shuyin requested in 3 runs and playing at the r2 after-fight sample), Ch XVI Ixion scene-bevelle-underground to boss-ffx2-aeon to victory-ffx2 (and scene-farplane fetched for the Abyss), the cue held across seams with no gain dip in Fallen Aeons links 2 and 3, Den of Woe, Isaaru, Sin I to III, Ch III boss-jecht then a script-owned silent link 2 (braskas-final-aeon.ts 251 and 280) then boss-yu-yevon at links 3 to 7; keyboard, gamepad (seymour-flux-win-pad, ffx2-bahamut-win-pad: AudioContext ready and the right cue at the first menu and at results, so the pad unlock works), touch 390x844, and 1280, 2000 and 2560 widths all route identically. OPEN: PR-0326 (the first UI sounds of a cold session are the procedural synth, fourth consecutive review: 53 of 63 runs), PR-0373 (music cues fetched at the moment of use: 5 of 55 non-Ch-I runs had no scene cue at the first line), PR-0099 stand-in cues (a design disclosure, not a routing defect). NOT VERIFIED THIS ROUND: AudioManager while paused (reused from round 21 with a dependency argument), the ending cues actually playing (ending-ffx and ending-ffx2 were requested in 2 runs each but the post-confirm scene was never sampled), the title cue playing at the title screen (title.mp3 requested and 200 in 69 of 69 runs, never sampled), Ch XIII victory (0 of 26 real-key attempts won; victory-ffx2 never requested for XIII). Score: none; the unknown stays unknown and is never averaged away or zeroed.

### interface: 8.7

AUDITOR (interface, deep round 23, live main d3fe9fe5 bundle B6DQPYhY; no browser opened by me; judged from the capture owner's evidence, PYREFLY_BROWSER=gpu headless Playwright, real keys, seed 1). Seen first-hand: Ch I at 1600x900, 1280x720, 2560x1080 and the 2000x1012 cell; Ch IV at the same shapes plus 390x844 touch and a virtual pad; Ch VI at 1280/1600/2560; Ch X at 1280/1600/2560; Ch VII, XII, XVII at 1600x900; 483 run.json text fields swept. WHAT HOLDS: (1) honest enemy intent separates certain from conditional on every card read (SCRIPTED, MOST LIKELY 58/62/83/92%, POSSIBLE 25/21%, RANDOM TARGET with per-target ranges, 'picked when it acts', IF YOU ATTACK conditionals, 'COLOUR ORDER: OUR ESTIMATE' on Omnis, STATUSES with percentages on Leblanc); (2) the advisor names the move, its menu path ('IN WHITE MAGIC', 'IN ITEMS', 'IN SWITCH', 'IN ORDERS') and cost in every chapter captured, and Ch XII shows a two-step ladder; advisor text effective size 14.2 px minimum (15 px phone) at 1280, 1600, 2000, 2560 and 390 with 0 clipped lines and no advisor/coach/command overlap on the keyboard runs; (3) the target step shows ground ring, corner brackets, name tag, TARGET slab, a lit turn-list portrait and a hand cursor in Ch I and VI at three sizes, and Cancel returns to battle with 0 target elements in every run that opened a cursor (about 40 runs, real Esc/Circle); (4) release 39.1 repairs seen live: PR-0385 (the guide now carries a '[ ] SCROLL' chip and a down arrow, so the cut sheet has a cue), PR-0330 (effect text present and unellipsised in Ch VII, XII, XVIII; the card keeps cost+effect at 1280), PR-0406 (Natus's Sensor card stands clear of his wings at 1280x720 and 2560x1080), PR-0382 (Ch XII party is spread, not heaped); (5) pause is full-bleed at 1280, 1600 and 2560x1080 (no bars), Esc, P, Start and the chip open it, H hides panels, Esc/B resume it; (6) names are whole (Seymour Natus, Braska's Final Aeon wrap, none ellipsised); pad glyphs are used in the battle HUD (SQUARE HIDE GUIDE, R-STICK SCROLL, R2 HIDE MOVES, TRIANGLE DEFEND); no developer vocabulary in any captured string. WHAT HOLDS IT BELOW 9: no critical or major defect, but a dozen open polish items: pause section headers and the H PAINTING ONLY hint measure 2.3 to 2.7 : 1 and the title tagline about 1.9 : 1 from rendered pixels (PR-0356, carried); the best-time ribbon on a cleared tile is still clipped ('8:11' cut at the row edge, PR-0387); the intent card still says 'Deals no damage' above damage rows in Ch IX and XII (PR-0354, 5 of 5 runs); the FFX-2 intent card stands over the enemies' heads at the target step and the Garment Grid in Ch VI at 1280 and 1600 (R23-IF-01); at 2560x1080 the CHAIN counter lies over the advisor card in Ch VI (R23-IF-02); Ch VI mid-fight draws the guide chips with no sheet at all three sizes (R23-IF-03); Ch XVII 'Close in' has no effect line and Ch VII Steal's effect line is only 'Steal' (PR-0330 residual); the pad first-turn coach covers the command stack and two party figures (PR-0252); a story box covers the guide header at the first menu in Ch XI (PR-0370); the phone pause OPTIONS window clips its tab strip and shows 4 of 10 settings (PR-0372, PR-0321). NOT FRESHLY EVIDENCED: TEXT SIZE 115/130 (so PR-0389 cannot be called repaired), the guide's label size below 1600 wide (PR-0251), 4K and 4:3, multi-target/all-enemy/aeon cursors in FFX, broken-board advisor matrix (CHK-005), a real controller. Against round 22 (8.6): four items repaired (PR-0385, PR-0330, PR-0382, PR-0406), 1280 and 2560x1080 now seen for two or three chapters, four new polish items found, none critical: +0.1. Mode: GPU capture, desktop Chromium, virtual pad, touch emulation.

### onboarding: 8.6

AUDITOR (onboarding, accessibility and options, deep round 23, live main d3fe9fe5). NEWCOMER WALKTHROUGH: SIMULATED only (a scripted Playwright route from a fresh profile that follows the visible prompts with real Enter/Esc/arrow keys, a virtual pad and touch emulation); the driver knows the game, so it is not a real newcomer, not a cold read, no real phone and no real controller. VERIFIED THIS ROUND: Auron's briefing on a fresh profile (eighteen fights, CTB waits, ATB clock runs; 'ENTER / ESC SKIP, 20 SECONDS, ONCE', 'D NEVER SHOW THIS AGAIN') and the new Gullwings title with 'PRESS ENTER' and a key-hint strip; the three-step coach (board 1 of 3, prep 2 of 3, first menu 3 of 3, 'FIRST TIME ONLY', skippable); FFX-2 first tip says 'a command holds them, take your time, nobody moves', matching the X-2 BATTLE: WAIT default shown in OPTIONS; the first-menu tip's closing Enter no longer picks Attack (the first engine action was the advisor's move in the runs read); OPTIONS lists MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE 100%, REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP, plus REPLAY BRIEFING and RESTART ENCOUNTER; Esc in a scene opens pause on the CHAPTER tab with the objectives; non-colour cues hold (targets use ring, brackets and a name tag; elements carry words and WEAK/ABSORBS labels with icons; KO is strike-through; FFX-2 shows 'WAIT, ATB HELD' text; status chips carry icons); a virtual pad drove Ch I and Ch IV from title to victory and the HUD prints pad glyphs in battle. HELD BELOW 9: (1) the board's first card still says 'Click its picture to begin' to keyboard and pad players in 61 of 63 runs (PR-0386, carried and unrepaired; the same card covers rows VII to XII and part of the location panel); (2) NEW on the pad: the party-prep screen and its coach print keyboard vocabulary ('ENTER BEGINS THE BATTLE', 'ESC BACK', 'ESC SKIP THE GUIDE') although the board footer and pre-scene hints are pad-aware, and B on prep goes back to the board while the coach label promises a skip (R23-ON-01); (3) no key remapping, no REDUCE FLASHES row and no colour-vision option (PR-0032, a proposal for Bailey, not a defect to fix unasked); (4) the phone OPTIONS window (390x844) clips the tab strip, overprints the header on the tabs and shows 4 of 10 settings in a roughly 100 px scroll box (PR-0372, PR-0321: sub-14 px text); (5) the first-run tip did not show at the first menu in Ch XI, XIII, XIV, XV (a story box or cut-in was up; whether it is only deferred is unverified); (6) pause section labels 2.3 to 2.7 : 1 contrast (PR-0356). NOT CAPTURED: TEXT SIZE 115/130 live, the CONTROLS and EYE CANDY pages, REDUCE MOTION actually switched on, any real remap flow, a cold read by a person. Against round 22 (8.7): nothing repaired in this category and one new pad-vocabulary item; -0.1.

### prep: 9

PREP AND DELIVERY AUDITOR, round 23 deep review of live main d3fe9fe5 (bundle B6DQPYhY). Score 9.0, held from round 22 (9.0). I opened no browser; I ran only HTTP reads (verify-live, curl). Source: critic/rounds/round-23 (1,830 indexed captures, 1,822 verified, all headless Chromium with PYREFLY_BROWSER=gpu, keyboard unless stated; 63 capture runs and 18 continuity runs).

RESULTS AND REWARDS (sourced). Victory panels were read in all 18 chapters except XIII. Values equal the code and its research citations where I traced them: Flux AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere; Yunalesca AP 14,000 x3, GIL 9,000, Lv. 3 Key Sphere (src/data/ffx/enemies/yunalesca.ts and research/ffx-yunalesca.md section 2.6, 'verified: 4 sources'); Braska AP 0 / GIL 0 / no items (braskas-final-aeon.ts rewards zero, 'no AP/gil for these'); Ixion EXP 2,600, AP 15 per dressphere, GIL 1,800, Soul of Thamasa (ixion-djose.ts 'verified: 6 sources'; research/ffx2-ixion-djose.md); Evrae 5,400 / 2,600; Anima 6,330 + OVERKILL x1 / 8,600; Natus 6,300 / 3,500; Omnis 24,000 / 12,000; Isaaru 5,000; Sin Face 20,000 / 12,000; Sin Fins 19,800 / 20,000; Yojimbo 0 / 0; FFX-2 IV EXP 1,300, AP 15, GIL 1,000, Gris Gris Bag; VI EXP 1,640, GIL 1,590; XI EXP 23,000, AP 54, GIL 7,000; XV EXP 4,200, GIL 35,200; V EXP 42,400, AP 120, GIL 18,300 (the sum of the part entries in vegnagun-*.ts; I did NOT recompute that sum, so it is carried unaudited). Rows identical to round 22 where seen then (no src/data, results or prep file changed between 816d80f9 and d3fe9fe5: git diff lists only art registration tables in src/data). The results panel also says why a member earned nothing ('no full turn taken - no AP' for Kimahri in Natus, Yuna in Sin Face; resultsMath.ts), and a silent victory (Ch IV) is titled 'Results' on purpose (resultsPage.ts silent flag), not a defect.

RETRY AND PROGRESS. 25 real-key retries measured (defeat panel to the retried battle's first menu): 6.1 to 9.2 s, median 7.9 s (round 22: 7.4 to 7.6 s; round 21 median 8.4 s). Defeat panel in all four chapters tried (I, II, IV, XV) shows turns, attempts and 'NEVER CLEARED' with RETRY and CHAPTER SELECT. All 39 victory runs (17 chapters, I to XVIII except XIII) keep the cleared tile, best time and '1 of 18' through a real reload (boardAfterReload equals boardAfter), including the five chapters round 22 could not show a win for (II, III, V, XVI) and XI and XV. SaveData.ts and saveComfort.ts are unchanged since round 21's build.

NEW FINDING (R23-PD-01, FFX-2 XIII only, polish): a retry after a loss at Trema replays Paragon's end state. In the 14-attempt run, attempt 12 beat Paragon and lost to Trema; attempts 13 and 14 started with Yuna 0/9999 and Rikku 0/9999 (KO) and Paine 4,269/9999 and were lost in 2 turns (23 s) and 1 turn (15 s). This is the adopted TR5 = b (D-146) working as designed; the observed consequence is a retry that cannot be won, with CHAPTER SELECT the only way back to Paragon.

PREP AGENCY. All 18 tiles are on the board; party prep was read on its CHAPTER tab in both games at 1600x900, 1280x720, 2000x1012, 2560x1080 and 390x844 (objectives, a sourced TIP, party list, tab row, START BATTLE, Auron's three-step guide). The tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE (FFX) and DRESSPHERES, ACCESSORIES (FFX-2) were again never opened by input at any size (fifth round), so 'a prep choice changes the fight, with a sourced consequence' is CARRIED from rounds 20 to 22 for desktop on a dependency argument (see reused) and is NOT carried for the phone (PR-0295 open).

NOT SHOWN: no win and so no reward row, post-battle scene or results-to-board path for XIII Trema (0 of 26 real-key attempts across 4 runs; one injected autoBattle(intended) run also lost). Gains over round 22: five more chapters (II, III, V, XI, XVI) now have a reward row and a clean board-and-reload, retry speed is measured over 25 samples. Not enough to raise the score: the prep tabs are still unproved by input, XIII is unseen, and the new retry trap sits beside PR-0352 (Natus sourced item drop still missing) and PR-0295. A gain for this category would be one real-key run that opens the tabs and changes the fight with a sourced consequence.

### delivery: 8.7

Score 8.7 (round 22: 8.5). Auditor: prep and delivery, round 23, live main d3fe9fe5 (bundle B6DQPYhY, artifactHash 769a43ed69b4fdb2640e2a9918b2c2b6d94615d2f176b3f456562ebe327eea15). No browser opened by me.

EXACT ARTIFACT (CHK-017). node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/d3fe9fe5.json against https://echoesofspira.com/ (14:41Z today): PASS, liveManifest match, 46 files checked (sample plus changed files), 0 mismatched, 0 missing, 0 wrongType, 0 errors; index.html equals the artifact once Cloudflare's Web Analytics beacon (366 bytes and the line feed) is cut out; the content-hashed bundle assets/index-B6DQPYhY.js is served max-age=0, must-revalidate (unchanged, PR-0396). The full 3,848-of-3,848 byte comparison was run earlier today by the live review (critic/reviews/d3fe9fe5-live.json, same artifactHash) and is reused: docs/deploys.log shows no deploy after d3fe9fe5 (06:39Z). curl of the bundle, css, worker, key art and title music: 200, right content types, br on text files, CF-Cache-Status HIT; the bundle is 3.9 MB raw, 1.1 MB br.

CLEAN LOADS. 81 runs (63 capture runs and 18 continuity runs): 13,706 media requests, 0 responses of 404 or above, 0 images answered as text/html, 0 requests naming a file the shipped manifest lacks (all decode to manifest keys), 0 console errors in any run (round 22: 1 transport reset). Media decode (CHK-019): the manifest was built with decode checks (3,848 files, decodeChecked true); its only problems are the two Paine eyeR-catch.png files already listed in policy.json intentionalFlatImages.

FLOWS (CHK-022). Real-key victory to results, post-battle scene where one exists, return to the board and a real reload in 17 of 18 chapters: I, II (seed 2), III (seed 3, also seed 1 in the continuity run), IV, V (seed 3), VI, VII, VIII, IX, X, XI (seed 2), XII (seed 2), XIV, XV (seed 2), XVI (Ixion, closes D22-01), XVII, XVIII. Real loss then retry: I, IV, II, XV, XIII. Also full wins at 1280x720 (I, IV, VI, X), 2000x1012 (I, IV), 2560x1080 (I, IV, VI, X), a virtual gamepad (I, IV) and 390x844 touch emulation (IV). XIII Trema has no win (0 of 26; the best left Paragon at 27,009 of 210,000, one attempt beat Paragon and lost to Trema), so its victory, post-battle scene and board path are UNVERIFIED for the fifth review (PR-0353, STALLED); that alone keeps CHK-022 UNVERIFIED and bars the milestone gate 'every encounter through its real flow'. Seeds 1 and 2 stalled on 15 and 25 minute budgets in III, V, XI, XII, XVII and the long fights are 100 to 290 turns: route slowness, not a lock (seed 3 or 55-minute budgets won).

FRAME TIME (named hardware): AMD Ryzen 7 7800X3D, NVIDIA GeForce RTX 5070 Ti driver 32.0.16.1047, Windows 11, headless Chromium (mode gpu, no black canvas, no fallback; renderer string not recorded in this round's runs), 1600x900, this machine's connection, fresh profile, empty cache. Serial continuity set, 18 chapters: 9,949 s and 595,169 battle frames, 59.3 to 60 fps in every chapter, 3,482 frames over 34 ms (0.59 percent; round 22: 0.40). FFX chapters 0.09 to 0.24 percent; FFX-2 VI 0.14 and XV 0.09, but IV 1.35, V 1.28, XI 1.09, XIII 1.77, XVI 1.92 percent (R23-PD-03). Worst single frame fell in Flux 533 to 114 ms, Anima 455 to 100 ms, Trema 461 to 161 ms (the release 39.1 upload-stall fix shows there) and rose in Vegnagun 474 to 580 ms. The same chapters measured in the 3-wide capture queue read 1.5 to 4 times more slow frames (Flux 96 versus 26, worst 812 ms), so the queue figures are contended and not used (R23-PD-05).

BYTES. Media requested per session at 1600x900: 62 to 231 MiB, median 138 (round 22: 61 to 160, median 119); Braska 171 to 231 MiB; at 2560x1080 Natus requested 337 MiB (two 14 MB 2x backdrops). The site is 8,324,636,783 bytes, 7.72 GiB, largest file 15.5 MB. No cold-cache, throttled-network, weaker-GPU, non-Chromium, real phone or real controller timing exists in this round, so load time under five seconds (CHK-017) stays UNVERIFIED (sixth review; PR-0259, PR-0394).

PERSISTENCE (CHK-024). SaveData.ts, saveComfort.ts and every existing storage key are untouched (git diff 816d80f9..d3fe9fe5 over src/app); the full upgrade matrix is NOT APPLICABLE. The release adds one separate key, pyrefly-reprise:mark:v1, for the hidden mark key (N1); that key was not exercised on live this round. Reload smoke passed 39 of 39 victory runs.

Why 8.7 and not higher: load time unmeasured, one chapter never finished, FFX-2 sustained slow frames in five chapters, Chromium-only and emulated devices only. Gains over 8.5: five more chapters finished by real keys, zero console errors, and spike reductions in three chapters.

## Bailey's five visual sub-scores (provisional, not in the weighted score)

characterModels 7 (capped), enemyModels 8.4, animation 7 (capped), fidelity 8.6, camera 7.8 (carried). characterModels 7.0 (capped; uncapped reading about 8.6 to 8.8: the size problem is essentially fixed). enemyModels 8.4 (Natus, Braska, Omnis discs and the Magus Sisters read clearly; boss painting swaps still jump, PR-0380). animation 7.0 (capped; uncapped about 7.3: the KO cut, double images and boss jerks are measured unchanged). fidelity 8.6 (live art proved pixel-identical to the approved masters; 2560x1440 seen in four chapters; 4K and 4:3 not seen). camera 7.8 carried: not re-graded this round, and the fan saw framing that loses the party in Ch V (PR-0381).

## Continuity harness (CHK-026 and CHK-027)

```json
{
 "checks": {
  "CHK-026": {
   "result": "FAIL",
   "reasons": [
    "5 swap(s) change a head by more than the tolerance (worst 28.7 percent; 5.2 percent where the head is registered)",
    "1 swap(s) of a standing figure move its feet more than the tolerance (worst 4.2 px at 1600 wide)"
   ],
   "note": "7187 of 10500 measured swaps had a registered head (tolerance 3 percent); 3313 were read by the figure's mass (tolerance 30 percent, whole-figure jumps only); 0 had no reading"
  },
  "CHK-027": {
   "result": "FAIL",
   "reasons": [
    "0.58 snaps per minute is over 0.25",
    "1092 jerk(s) of 40 px or more in one frame (worst 807 px)",
    "161 swap(s) show a double image of severity 0.4 or more (worst 0.446)"
   ]
  }
 },
 "size": {
  "judged": 10500,
  "costumeSwaps": 17,
  "sameArtSwaps": 1030,
  "costumeWorstHeadPct": 51.3,
  "costumeWorstFeetPx": 45.6,
  "maxHeadJumpPct": 28.7,
  "maxHeadJumpPctRegistration": 5.2,
  "headOverTolerance": 5,
  "maxFeetShiftPx": 4.2,
  "feetOverTolerance": 1,
  "headMeasured": 10500,
  "headRegistration": 7187,
  "headSilhouette": 3313,
  "headUnmeasured": 0
 },
 "motion": {
  "snaps": 96,
  "snapsPerMinute": 0.58,
  "hardCuts": 102,
  "hardCutsPerMinute": 0.62,
  "ghostSwaps": 9858,
  "ghostFrames": 41502,
  "worstGhostSeverity": 0.446,
  "ghostOverFail": 161,
  "jerks": 3158,
  "worstJerkPx": 807,
  "jerksOverFail": 1092,
  "lowestIou": 0.006,
  "maxCentroidShiftPx": 361.9
 }
}
```

Per chapter: seymour-flux 026 FAIL 027 FAIL (1.01/min, jerk 349.5); yunalesca 026 PASS 027 FAIL (0.48/min, jerk 320); braskas-final-aeon 026 PASS 027 FAIL (0.62/min, jerk 549.5); ffx2-bahamut 026 PASS 027 FAIL (0.17/min, jerk 172.5); ffx2-vegnagun-shuyin 026 PASS 027 FAIL (0.25/min, jerk 807); ffx2-leblanc 026 PASS 027 FAIL (0.28/min, jerk 259.9); seymour-anima-macalania 026 FAIL 027 FAIL (1.08/min, jerk 215); evrae-airship 026 PASS 027 FAIL (0.36/min, jerk 264.8); yojimbo-cavern 026 PASS 027 FAIL (0.48/min, jerk 72.2); seymour-natus 026 PASS 027 FAIL (0.28/min, jerk 96.6); ffx2-fallen-aeons 026 PASS 027 FAIL (0.38/min, jerk 280.6); seymour-omnis 026 PASS 027 FAIL (0.08/min, jerk 104.7); ffx2-trema 026 PASS 027 FAIL (2.66/min, jerk 360.6); isaaru-via-purifico 026 PASS 027 FAIL (1.39/min, jerk 190.3); ffx2-den-of-woe 026 PASS 027 FAIL (0.97/min, jerk 225.5); ffx2-ixion-djose 026 PASS 027 FAIL (0.15/min, jerk 123.7); sin-fins-core 026 FAIL 027 FAIL (0.72/min, jerk 332.5); sin-face 026 PASS 027 FAIL (0.3/min, jerk 513.1)

## Target gate

Visual auditor's count from composites in critic/rounds/round-23/targets/ (approved tiles whose delivery is verified, implemented or in progress, rejected ones excluded). Round 22 counted 44 required and 33 matched; the larger required count is the auditor's wider reading of the registry, not new tiles failing. Failing 0. Unverified 15: Ch XIII victory, Vegnagun links 3 and 4, Sin Face mouth open, Yunalesca form 1 idle, Nooj and Brother portraits, Anima's arrival at 1600x900, title parallax, living portrait feel, Sphere Grid explainer, battle camera preset, Ch XI phone framing, 2560x1440 beyond four chapters and the pause party panel. Waiting: the Leblanc backdrop tile (PR-0399, the picture and the written pick disagree). The Gullwings title key art was judged as approved (D-458 to D-460) and not scored as a screenshot match. Approved art identity: live hashes equal the approved masters.

required 50, matched 34, failing 0, unverified 15, waiting 1

## Checks

- CHK-001 FAIL: Polish-level FAIL, unchanged: steps 1 and 2 PASS (qa --strict exit 0, 28 of 28 MP3 decode, 0 chapters depart from the cue map, 35 audio vitest files pass); step 3 fails on UI sounds (the procedural synth is the first effect in 53 of 63 runs, "battle-start" never asked, PR-0326, fourth review); step 4 needs Bailey (CHK-B1).
- CHK-002 UNVERIFIED (mandatory): Pause reads full-bleed at 1280x720, 1600x900 and 2560x1080 and fits 390x844 by screenshot judgement, but no rect, currentSrc, scrollWidth or transform measurement was taken and 3840x2160 and 4:3 were not captured.
- CHK-003 FAIL (mandatory): Polish. Advisor text measures 14.2 px (15 px phone) at 1280, 1600, 2000, 2560 and 390 with 0 clipped lines, but the phone pause OPTIONS draws sub-14 px text with a clipped tab strip (PR-0372, PR-0321), pause headers are 2.3 to 2.7 : 1 (PR-0356), and the guide label size below 1600 wide was not measured (PR-0251).
- CHK-004 PASS: The advisor card names the move, its menu path and its cost in every chapter captured (17 chapters read); no foreign move seen. Residual polish: Ch XVII "Close in" has no effect line, Ch VII Steal reads only "Steal" (PR-0330).
- CHK-005 UNVERIFIED: Engine half PASS (combat auditor: advisor-card follower on all 7 FFX-2 chapters x 25 seeds identical to round 22, 0 Lady Luck recommendations; Ch XVII chain 97/200; FFX three-line bench identical). The live card-reading half (two down, healer down, status lock, no MP, no revive stock) was not captured.
- CHK-006 PASS (mandatory): After a target cursor and Escape or Circle the screen returns to battle with 0 target elements and the command rows restored in every run that opened a cursor (Ch I, II, III, VI, VII, VIII, IX, X, XII; keyboard and pad).
- CHK-007 PASS: A regex sweep of 483 text fields in 63 run.json files found no section sign, file stem, row number, debug, TODO or placeholder copy.
- CHK-008 FAIL (mandatory): Polish. FFX-2 Ch VI: the intent card stands over the enemies and the Garment Grid at 1280x720 and 1600x900 (PR-0412); at 2560x1080 the CHAIN counter lies over the advisor card (PR-0413); the pad first-turn coach covers the command stack and two figures (PR-0252); a story box covers the guide in Ch XI (PR-0370); at 1280x720 the Sensor card covers Seymour's lower legs (PR-0366). FFX Ch I and X panels are clear of faces and weapons at 1280, 1600 and 2560x1080; Natus's card is clear (PR-0406 repaired). The 108-state matrix was not run (four chapters at three sizes), so this is a FAIL on what was seen and not a full pass either way.
- CHK-009 FAIL (mandatory): Polish. Names are whole at every size seen, but the cleared-tile best-time ribbon is still clipped (PR-0387) and Cindy and Mindy are overprinted by status chips in Ch XI link 2 (PR-0355, re-seen in 24-seam-2-first-menu).
- CHK-010 UNVERIFIED: Single-target cue (ring, brackets, name tag, TARGET slab, lit turn-list portrait, hand cursor) is strong and identical at 1280, 1600 and 2560x1080 in Ch I and VI; all-enemies, all-allies, aeon and Overdrive target sets were not captured in FFX (the Bahamut route never opened a single-target cursor).
- CHK-011 PASS: Every targetable enemy that matters is visible and at least three quarters clear: both Yu Pagodas beside Braska, Mortibody and Natus, the four Omnis discs, Dr. Goon and Fem-Goon beside Ormi (2560x1080), Sandy, Cindy, Mindy, Grothia, the Vegnagun tail. Not seen: Vegnagun links 3 and 4.
- CHK-012 PASS: Every roster chip and party plate shows a painted face, no monogram or letter tile, no art 404 in the network logs read (seen again by the chief on the 2560x1440 Ch IV frame).
- CHK-013 PASS (mandatory): Art reads as approved at 1600x900 in all 18 chapters, at 1280x720 and 2560x1080 in four, and (gap pass, round 22's gap closed) at 2560x1440 in Ch I, IV, VIII and X, where the chief looked at the Ch IV mid-fight frame: the three girls and Bahamut sit clean on their rings at 1440p. The new Gullwings title key art renders as approved at 1600x900 (chief read 00-title.png). Live files are pixel-identical to the approved masters (61 sampled files plus all 45 Lady Luck paintings and the title key art, hash equal). Scope note: the Ch X Mortibody chip overlap at 1440p is a HUD item (PR-0416), not an art item.
- CHK-014 PASS: Figures face across the field toward the foe and cast and attack poses aim at the target. Gap pass on the D-461 reach: Tidus's lunge reaches Mortiorchis at the impact frame (PASS); Kimahri (target floats above) strikes from below, the stated limit. Fiend reach on a girl and the Gunner no-close case are UNVERIFIED (screencast about 8 fps, no event-locked frames).
- CHK-015 UNVERIFIED (mandatory): A virtual standard-mapping pad (navigator.getGamepads shim) drove Ch I and Ch IV from title to victory and the retry; Start opened and B closed pause; targeting, cancel and pad glyphs work; Esc, P, H and the chip were proved in both games. UNVERIFIED because an emulated pad is not a real controller (RUBRIC section 5), the pad ran in two chapters, and PR-0363 was not probed. Found on this path: PR-0411.
- CHK-016 PASS (mandatory): Every capture carries its read-back screen: 1,822 of 1,830 index entries verified (route-index over 1,825 found 0 mismatches); the 8 UNVERIFIED are 30-post-scene shots where the scene comes after results (a harness timing expectation). Injected captures are labelled INJECTED.
- CHK-017 PASS (mandatory): verify-live --full: 3,848 of 3,848 files byte-identical, artifactHash 769a43ed matches the stored manifest and the marker (live review, critic/reviews/d3fe9fe5-live.json, PASS); a fresh 46-file verify-live today matches; 0 responses of 404 or above in 81 runs. The first-load-under-5-seconds clause is NOT covered (UNVERIFIED, PR-0259).
- CHK-018 PASS (mandatory): No hand-written variant path; 13,706 of 13,706 media requests from 81 runs resolve to keys of the shipped manifest.
- CHK-019 PASS (mandatory): Every shipped image and audio file was decode-checked at build (3,848 files); the only findings are the two listed intentional flats (Paine eyeR-catch).
- CHK-020 PASS (mandatory): The same screens carry the same work in both games, each in its own vocabulary (advisor, intent, guide with scroll chip, pause with panel hiding, results, board); the DEFEND tab is FFX only.
- CHK-021 PASS (mandatory): Game case is written for every changed item (lunge reach both games with a per-game gate; the stature-floor lift Lulu critical FFX and Rikku Berserker ready FFX-2 only; N1 and the B items shared plumbing); 0 FFX logs carry atb, spherechange or chain events and 0 FFX-2 logs carry overdrive-gauge over 63 live logs; tone is right per game.
- CHK-022 UNVERIFIED (mandatory): 17 of 18 chapters reached a victory by real keys, then the scene where one exists, results, CONFIRM, chapter select with the clear and a reload: closed this round for Ch II (seed 2), III (seed 3, 30:47), V (seed 3) and XVI. Ch XIII (Trema) has no victory in 26 real-key attempts plus the 28 and 70 minute gap runs, so the check cannot pass (PR-0353). Lose and retry proved in Ch I, IV, II, XV and XIII. The 30-post-scene frame is UNVERIFIED where results come first (Ch II confirmed: no scene before results).
- CHK-023 UNVERIFIED (mandatory): Unchanged subsystems PASS through the real runtime (Bushido and Swordplay orders, Kimahri rage, Wakka reels, summons, Lady Luck Change, chains; key-chosen label equals the engine action in all 5,504 picks); Lady Luck reel throws and Swordplay tiers reused from round 22 with a dependency argument. The one changed subsystem, the D-461 strike reach, is traced as presentation only and its 39 unit tests pass, but only Tidus on Mortiorchis was seen reaching its target; fiend reach on a girl and the Gunner no-close case are UNVERIFIED.
- CHK-024 PASS: Reload smoke on a fresh profile: boardAfterReload equals boardAfter in 39 of 39 victory runs. SaveData.ts, saveComfort.ts and every storage key are untouched (git diff 816d80f9..d3fe9fe5 over src/app), so the upgrade matrix is NOT APPLICABLE; the one new key pyrefly-reprise:mark:v1 was not exercised.
- CHK-025 UNVERIFIED: The hidden mark key (Backquote, N1) and its key pyrefly-reprise:mark:v1 ship in this build but no capture pressed it; its console line, clipboard write, bounded history and "writes nothing to the save" are unseen on live. Source read only.
- CHK-026 FAIL (mandatory): 5 head swaps and 1 feet swap over tolerance of 10,500 judged (round 22: 1,688 and 1,749 of 10,479): Ch VII Yuna idle to victory 5.2 and Rikku 3.3 percent, Ch XVII Yuna ko to idle 3.1 twice and hurt to ko 3.3, Ch I Yuna hurt to idle feet 4.2 px; fails in Ch I, VII and XVII, passes in the other 15 including Ixion (XVI, round 22's gap). 7,187 swaps read from the registration, 3,313 by mass at 30 percent (worst 28.7, Leblanc); 17 costume swaps (worst 51.3 percent) excluded by the check. The capture owner's own CHK-026 record (FAIL in Vegnagun, Macalania, Fins and Core, Yunalesca from the -pm runs) is superseded by this harness aggregate.
- CHK-027 FAIL (mandatory): 0.58 snaps per minute (limit 0.25; round 22 0.56, release 38 0.53); 78 of 96 snaps are the KO collapse cut; 161 swaps at double-image severity 0.40 or more (worst 0.446); 1,092 jerks of 40 px or more (worst 807 px, Vegnagun tail). FAIL in all 18 chapters; Ixion alone passes the snap limit (0.15 a minute) and fails on 23 jerks. Strips read by the chief: swap-289 and swap-1085 (bare KO cut), swap-1175 (hit flash covering the pose swap). Equal to round 22 within noise: no regression, no gain.
- CHK-B1 UNVERIFIED: No agent can hear and no numeric owner listening verdict exists for the shipped music v2 and SFX v2 (D-349 "no number given yet"; D-404 and D-307 to D-309 adopted by default).
- CHK-B2 UNVERIFIED: Needs Bailey's own short play session (feel, weight, stickiness); PR-0368 (run-in rhythm) is still his question.

## Encounters

- I seymour-flux (FFX): victory. Ch I. Real keys title to board; seymour-flux-win (also 1280, 2000, 2560, pad, pm). Loss and retry in seymour-flux-lose. Touch 390x844 run was a defeat.
- II yunalesca (FFX): victory. Ch II. Seed 1 was a defeat. Seed 2 won (yunalesca-win-r2, yunalesca-win-pm) with results, return to chapter select and reload. The 30-post-scene shot is UNVERIFIED: no cutscene before results.
- III braskas-final-aeon (FFX): victory. Ch III. Seeds 1 and 2 stalled on the 15 and 25 minute budgets: the fight is 244+ turns and the route was slow, not a lock. Seed 3 with a 55 minute budget won (braskas-final-aeon-win-r3, -pm), about 261 turns, 32 minutes.
- IV ffx2-bahamut (FFX-2): victory. Ch IV. Win plus real lose and retry (ffx2-bahamut-lose). Also 1280, 2000, 2560, pad, touch 390x844 and pm. Single-target cursor did not open in the route (PR-0213 rule), so no 16 or 16b capture.
- V ffx2-vegnagun-shuyin (FFX-2): victory. Ch V. Seeds 1 and 2 stalled at the 15 and 25 minute budgets. Seed 3 won (-r3, -pm), 137-178 turns.
- VI ffx2-leblanc (FFX-2): victory. Ch VI. Win, plus 1280 and 2560 and pm.
- VII seymour-anima-macalania (FFX): victory. Ch VII. Win, plus pm.
- VIII evrae-airship (FFX): victory. Ch VIII. Win, plus pm.
- IX yojimbo-cavern (FFX): victory. Ch IX. Win, plus pm.
- X seymour-natus (FFX): victory. Ch X. Win, plus 1280, 2560 and pm.
- XI ffx2-fallen-aeons (FFX-2): victory. Ch XI. Seed 1 stalled at 15 minutes. Seed 2 won (-r2, -pm), 99-117 turns.
- XII seymour-omnis (FFX): victory. Ch XII. Seed 1 stalled at 15 minutes. Seed 2 won (-r2, -pm).
- XIII ffx2-trema (FFX-2): defeat — NO complete real flow. Ch XIII. 0 wins in 26 real-key attempts across 4 runs (seeds 1, 2, 3 and drawn). Best attempt left Paragon at 27,009 of 210,000. Attempts 13 and 14 of the last run were lost in link 1 (Trema, Paine alone). One injected autoBattle(intended) run also lost. The loss, results and retry paths are proved. The victory, post-battle scene and results-to-board path is UNVERIFIED for XIII. Gap pass: seed 3 for 28 minutes stalled at link 2 (Trema 122,279 of 999,999, party healthy, 332 turns); a 70 minute run lost at turn 307; defeat card, Retry and the retried battle seen live.
- XIV isaaru-via-purifico (FFX): victory. Ch XIV. Win, plus pm.
- XV ffx2-den-of-woe (FFX-2): victory. Ch XV. Seed 1 was a defeat. Seed 2 won (-r2, -pm).
- XVI ffx2-ixion-djose (FFX-2): victory. Ch XVI. Win plus pm: Ixion continuity closed (CHK-026 PASS, CHK-027 FAIL).
- XVII sin-fins-core (FFX): victory. Ch XVII. Seed 1 stalled at 15 minutes. Seed 2 won (-r2, -pm), 252 turns.
- XVIII sin-face (FFX): victory. Ch XVIII. Win, plus pm.

## Coverage matrix

### Tested
- All 18 chapters on the live site by real keys at 1600x900 (GPU, seed 1 pinned unless stated): victory with results, CONFIRM, board and reload in 17; Ch XIII lost.
- Continuity harness over all 18 chapters: 9,949 s of battle, 625,187 frames, 0 probe errors; strips read by the feel and visual auditors, the first-time fan (about 120 of 340) and the chief (swap-289, swap-1085, swap-1175).
- Round 22 coverage gaps closed: Ch II, III, V victories by real keys (II seed 2, III seed 3 30:47, V seed 3); Ixion continuity (CHK-026 PASS, CHK-027 FAIL on jerks); CHK-008/002/010 at 1280x720 and 2560x1080 in Ch I, IV, VI, X; 2560x1440 in Ch I, IV, VIII, X; virtual pad in Ch I and IV; touch 390x844 in Ch IV (win) and I (defeat).
- Exact artifact: verify-live 3,848 of 3,848 byte-identical (live review) and a fresh 46-file check; 81 runs, 13,706 media requests, 0 404, 0 console errors; 29 of 29 audio files hashed live.
- Engine: FFX-2 A/B 1,600 runs and FFX three-line bench identical to round 22 (0 of 1,600 logs moved); Ch XVII 200 seeds; advisor-card follower 7 chapters x 25 seeds; Trema link-2 probes (560 Wait and 540 Active runs); npm test 897 files, 887 pass, 5 fail (not combat: a loaded-host timeout, a scratch scan, three art-on-disk files, see PR-0409); tsc clean; orphans 24, none from 39.1.
- Audio: ffmpeg ebur128 on 28 of 28 MP3s, qa --strict, themes-audit, 35 vitest files (536 tests), routing in 81 runs and 622 samples; title cue after the Gullwings key art plays.
- Lose and Retry in Ch I, IV, II, XV, XIII (25 retries 6.1 to 9.2 s, median 7.9 s).
- Release 39.1 repairs seen live: PR-0385, PR-0330 (mostly), PR-0382 (Ch XII first menu), PR-0406; the figure registration; the 39.1 upload-stall fix in Ch I, Anima and Trema; the Gullwings title.

### Reused (labelled, with the dependency argument)
- Combat: Lady Luck reel throws and Swordplay tiers by real keys (from critic/rounds/round-22.json CHK-023): git diff 816d80f9 d3fe9fe5 over src/battle, src/data excluding art, src/engine/tactics, src/ui/ffx and ffx2 is empty; the overlays live in unchanged files; od-params-probe, lady-layout, aeon-defend and leblanc-rikku-wm re-run byte-identical. Labelled reused.
- Narrative text and beats for Ch I, IV, VII, VIII, IX, X, XII, XIV, XVIII (from critic/rounds/round-22.json): src/story and research/writing-bible.md unchanged (816d80f9..e6eb4c49); the dboxTimelines are line for line identical (Ch XII one added Auron line). Scene staging did change, so reach was re-checked on this build.
- Audio pause hand-back (Ch I, IV) and stereo image (from critic/rounds/round-21 (pause-audio, stereo)): All 29 audio files sha256-identical across 6461999e, 816d80f9 and d3fe9fe5; no audio call in the src diff; the gap pass re-sampled the hand-back (single points 2.5 s apart; PR-0374 timing not measured). PR-0374 stays open.
- CHK-017 full byte comparison and reward rows for chapters whose rows equal round 22 (from critic/reviews/d3fe9fe5-live.json; critic/rounds/round-22.json): Same artifactHash and no deploy since 06:39Z; src/data untouched except art tables. Vegnagun's summed reward row and the Den of Woe and Fallen Aeons item lists were not re-audited to research.
- Prep agency on desktop (a prep choice changes the fight) (from critic/rounds/round-20 to 22): No prep, results, reward, save or data file changed; not carried for the phone (PR-0295). The prep tabs were again never opened by input (fifth round).

### Not tested
- Real controller, Safari, Firefox, a real phone, a weaker GPU; load time on a cold cache (five-second clause).
- Ch XI at 390x844 touch (run stalled), 3840x2160 and 4:3, the pause character tabs.
- Vegnagun links 3 and 4, Sin Face mouth open, Yunalesca form 1 idle, Nooj and Brother portraits, Anima's arrival, title parallax, living portrait, Sphere Grid explainer, camera preset.
- TEXT SIZE 115/130 guide state, REDUCE MOTION switched on, CONTROLS and EYE CANDY pages.
- Motion in cutscenes and on the pause screen; continuous video of a KO or crossfade at 60 fps.
- The hidden mark key (N1) on live.

### Required and not tested
- CHK-022: a real-key victory for Ch XIII Trema with post-battle scene, results and board (0 of 26 real attempts plus a 28 and a 70 minute run; sixth review).
- CHK-015: a real controller (only a virtual pad shim ran), the pause from a submenu and during an animation, PR-0363.
- CHK-023: the D-461 strike reach for fiends on a girl and the Gunner no-close case at event-locked timing (only Tidus on Mortiorchis and the Kimahri limit were seen).
- CHK-008, CHK-002, CHK-010: the full 108-state matrix, pause rect measurement, 3840x2160 and 4:3, all-enemies, all-allies and aeon target sets in FFX.
- CHK-025: the mark key N1.
- CHK-B1, CHK-B2, CHK-B3: Bailey's listening score, play verdict on feel and story read for release 39.1.
- The CHK-017 five-second load clause (cold cache, throttled network).

## Gap pass

- Strike-reach strips: FFX Ch I Tidus Attack on Seymour Flux; FFX-2 Ch IV fiend strike on a girl, girl run-in Attack, Gunner must not close; target above/below = limit => UNVERIFIED (partial PASS). Real keys, live site, PYREFLY_BROWSER=gpu, CDP screencast. Ch I default target was Mortiorchis, not Seymour Flux. Tidus's lunge reaches Mortiorchis at the 153 impact (PASS). Kimahri (target floats above) strikes from below with the spear at the target, the stated limit. Bahamut on Yuna: only about 8 fps under parallel load, impact 170 shown on Yuna but the dragon is not seen closing the distance, so reach is not judged. The Gunner clip caught the next target menu, so no-closing is UNVERIFIED. The girl run-in Attack (Paine or Rikku) was captured in clips 1 and 2 of the gunner run but not judged. Not a 16 ms event-locked sequence; screencast gave about 8 to 20 fps.
- Ch XIII Trema real-key victory (post scene, results, Confirm, board, reload) and a real-key link-2 defeat then Retry for R23-ENC-01 => UNVERIFIED (victory); PASS (defeat and Retry reached). Still no Trema win, a seventh round without one. A 28-minute run stalled with the party healthy and about 88 percent of Trema's HP gone, so a real-key win needs well over 30 minutes at route pace (the 70-minute run lost). The defeat card shows TURNS 307, ATTEMPTS 1 and BEST never cleared, with RETRY and CHAPTER SELECT; Retry reaches the party prep and then the battle. R23-ENC-01 itself was not identified or judged because the defeat was not a one-survivor state.
- Ch II Yunalesca 30-post-scene capture => PASS (with note). Real keys, live, victory at seed 2. There is no scene between the fight and the results (screen was results, so 30-post-scene.png is correctly UNVERIFIED as a wanted state). The results show Victory, AP, gil and items. CONFIRM leads to an epilogue scene, then the board, and the clear survives a reload. Audio at results was victory-ffx but nothing was playing 1 s and 3 s after CONFIRM during the Ch II epilogue (music null). Whether that is by design for Zanarkand is not established.
- Lady Luck reel throw and Swordplay tier by real keys => UNVERIFIED. Not captured this round. Round 22 evidence cannot be reused without the dependency argument.
- Ch I, IV, VIII, X first menu and mid-fight at 2560x1440 on the GPU => PASS with one defect. Ch I, IV and VIII are clean and legible at 16:9 1440p. In Ch X the Mortibody target card's element chips overlap (see issues). Ch X is not at a mid-fight state in the capture set.
- Ch XI Fallen Aeons at 390x844 touch, all three links => UNVERIFIED. The run stalled before all three links; the shots were not reviewed in depth, so link 3 is not shown.
- Pause CHAPTER tab in Ch I and Ch IV at 1600x900 (hero plate tiles) and the pause PARTY panel => PASS. The CHAPTER tab shows This Encounter, The Party and the scene plate with three tiles in both chapters, with a hero portrait behind. Text is legible. The tab was judged for the party panel text. The individual character tabs were not shot.
- Sin Face mouth open; Vegnagun links 3 and 4; Yunalesca form 1 idle; Nooj and Brother portraits; Anima's arrival; title parallax clip; Living portrait; Sphere Grid explainer; camera preset => UNVERIFIED. Not captured this round. The Vegnagun run stalled at 30 minutes before links 3 and 4.
- Audio: title idle and after title Enter with the Gullwings key art => PASS. The title cue plays after the first key (silent before, ready false until a key, which is browser autoplay). Idle playing=title; the second Enter reaches chapter-select, then playing=chapter-select at 0.5, 1.5, 3 and 5 s.
- Audio: Ch III ending-ffx and Ch V ending-ffx2 sampled after CONFIRM => PASS (Ch III); UNVERIFIED (Ch V). Ch III ending-ffx is playing 3 s after CONFIRM. The same file shows silence (playing null) at the link-2 seam, at 0, 1.5 and 3 s, so a gap of at least 3 s of no music at that seam; cause not established. Ch V did not finish in 30 minutes.
- Audio: pause in battle, Ch I and Ch IV, sampled across open and close (PR-0374) => PASS (hand-back), PR-0374 not re-measured. Real Esc. Before pause boss-seymour, paused pause, after Esc boss-seymour (Ch I). The same for Ch IV with boss-ffx2-aeon. The samples are single points about 2.5 s apart, not the requested 150 ms series, so PR-0374 timing is not measured.
- Interface: TEXT SIZE 115 and 130 in Ch I and Ch IV at 1600x900 (guide G, advisor, pause) => PASS at 115 and in Ch I at 130; FAIL (minor) in Ch IV at 130. Pause OPTIONS and the Ch I menu render cleanly at 130. The Ch IV enemy-move card at 130 truncates names and wraps the damage range (see issues). The G-guide shots at 130 were taken, but guide-text overflow numbers from the harness are scroll-area false positives and are not used.
- Phone 390x844 pause OPTIONS scrolled by touch, Ch I and Ch IV, TEXT SIZE and REDUCE MOTION reachable (PR-0372) => PASS (reachable), with a note. Real CDP touch events scroll the settings list (scrollTop 65, 130, 153) and TEXT SIZE and REDUCE MOTION come into view. Tapping the TEXT SIZE row cycles 100 to 115 percent. The list window is only 100 px tall of 217 to 253 px, about 4 rows under a large portrait. Run on Ch IV; Ch I used the same layout (first pass) but the touch swipe was only repeated for Ch IV.
- 4:3 and 3840x2160, All-enemies and aeon target steps, broken-board advisor readings, Ixion continuity, controllers and Safari, owner listening, Ch VI Rikku menu, Ch XIII dressphere sequence, KO and crossfade video, natural-pace scene read => UNVERIFIED. Not captured in this pass.

## First-time fan (D-423; findings are issues, never scores)

- [major] snapping (both; all 18 chapters (FFX and FFX-2); count 31): A fighter or aeon is standing, then in one frame is lying flat on the floor, with no fall in between (Tidus, Yuna, Auron, Lulu, Rikku, Paine, Shiva, Valefor, Ifrit, Spathi, Natus, the Goons, Sandy, Mindy and more).
- [major] half-motion or ghosting (both; all chapters; count 45): When a figure changes pose, two or three copies of the same figure are drawn on top of each other for a few frames (a see-through twin, a body with a second body half inside it), most visibly when Yuna, Rikku, Paine, Kimahri and Lulu go between ready, idle, hurt, critical and cast.
- [major] half-motion or ghosting (FFX only (the same in all FFX chapters with Tidus or Auron); seymour-flux, yunalesca, braskas-final-aeon, seymour-natus, sin-fins-core, sin-face; count 8): Auron and Tidus: when the attack ends the figure is drawn twice, a faded old pose and the new one, for 8 to 10 frames (a long see-through twin), so the swing looks smeared.
- [polish] half-motion or ghosting (both; seymour-flux, ffx2-vegnagun-shuyin, ffx2-trema, yunalesca; count 5): A fallen fighter standing back up shows the lying body and the standing body together for several frames, the standing one fading in through the flat one.
- [major] popping (FFX only; sin-fins-core, sin-face; count 5): Sin's fins and body jump: the whole Sin whale is on screen, then in one frame it is replaced by a huge fin or slab close to the camera, or the whale appears from empty sky between two frames.
- [major] popping (FFX-2 only; ffx2-vegnagun-shuyin; count 2): Vegnagun's tail and head jump to a new place in one frame: the tail goes from standing up to lying across the screen, the cannon head jumps up and left, with no motion between.
- [major] size jumps (both; yunalesca, braskas-final-aeon, ffx2-bahamut, ffx2-trema; count 5): A boss or aeon is a different size and shape after a pose change: Ifrit is smaller and lower when he falls, Valefor shrinks into a flat shape, Yunalesca drops from a big floating pose to a smaller standing one, Bahamut grows and moves in one frame.
- [major] other (FFX-2 only; ffx2-vegnagun-shuyin, ffx2-fallen-aeons, ffx2-leblanc; count 7): The same girl wears a different outfit or colour depending on her pose: Yuna in FFX-2 is in a white coat when hurt, in a pale blue outfit when down and in a white mage robe when standing; Rikku is pale and blonde when hurt and dark-armoured with orange hair when ready; Rikku in Leblanc swaps from a white-and-red outfit to green-and-orange in one frame.
- [major] other (FFX-2 only; ffx2-trema; count 2): Paine turns into a different character in one frame: from an armoured fighter with a huge sword to someone in a blue dress with arms in the air, and she looks smaller in her new outfit beside Rikku and Yuna.
- [major] camera jerks (FFX-2 only; ffx2-trema, ffx2-leblanc; count 4): The camera cuts in or out when a figure changes pose, and everyone becomes much bigger or smaller at once; tiny figures suddenly become tall ones.
- [major] camera jerks (both; ffx2-vegnagun-shuyin, seymour-anima-macalania; count 2): The camera loses the fight: Vegnagun fills the whole screen and the three girls are tiny dots in the bottom corner; at the end of the Macalania fight Rikku crouches at the very bottom edge of the frame.
- [major] UI covering the action (both; seymour-flux, ffx2-bahamut, sin-fins-core, ffx2-leblanc, ffx2-trema, ffx2-vegnagun-shuyin; count 6): The big face portrait of the hero whose turn it is covers the left half of the screen, including the party, every time the command menu opens; the guide panel and the next-move panel cover the boss (Bahamut, Paragon, Vegnagun, Sin's fin) while the fight is going on.
- [polish] flicker (FFX only; seymour-natus, sin-face, seymour-flux; count 3): For one frame a figure is drawn as a gold or black-and-white negative of itself, then comes back in colour.
- [polish] popping (both; seymour-anima-macalania, ffx2-leblanc, braskas-final-aeon, ffx2-fallen-aeons; count 4): A figure appears in one frame at the side of another: Tidus pops in next to Rikku with nothing before; the party also arrives as see-through ghosts for the first frames of the battle before turning solid.
- [polish] other (FFX only; braskas-final-aeon, seymour-omnis, seymour-anima-macalania; count 5): Figures hide each other or the effects cover them: Yuna stands in front of Tidus, Auron is hidden behind Wakka's big body, and Yuna vanishes behind a field of ice spires in the Anima fight.
- [polish] other (both; seymour-flux, yunalesca, braskas-final-aeon, seymour-anima-macalania, isaaru-via-purifico, ffx2-vegnagun-shuyin, ffx2-bahamut; count 8): A hit flash whites out the figure for four or five frames, so the fighter disappears inside a burst of light and comes back in a new pose.
- [polish] jerks or teleports in a move (both; seymour-flux, ffx2-bahamut; count 3): Kimahri jumps from a standing pose to a crouched, lunging pose with his head and body in a new place in one frame; Yuna and Rikku change to a red or orange tint in one frame at the swap.

Browser: none used; I looked only at the harness pictures and capture frames (the harness ran in gpu mode per the continuity.json). I did not look at yunalesca, yojimbo, omnis, natus, isaaru, evrae, den-of-woe, ixion or sin-face seq-* clips, the 1280, 2000, 2560, pad and touch variants, the lose runs, the INJECTED clips, the full-resolution screenshots 10 to 35 in each evidence folder, or the pause screens, so nothing is said about those. The counts are what I saw in the strips I opened, not totals; the harness lists more of every kind (for example 61 double images in sin-fins-core). I saw no attack that clearly ends short of its target and no texture pop-in or stand-in painting in the strips; I did not look for those in the full-resolution evidence frames. Sliding feet were not visible in any strip: feet stay on the orange line except in ffx2-trema swap-019 and swap-546 (13 and 45 px). I saw outlines on the figures only as the harness drew them; no halo or hard-edged fringe was noticeable in the strips I viewed. Two things in the evidence that a harness cannot know: the party figures on the first frames of the seam sequences are see-through ghosts, and Paine and Rikku change outfits between poses in FFX-2.

## Confirmation, merges, downgrades, refutations, repairs

- Ch XIII Trema was never won in 26 real-key attempts: confirmed. Evidence from the round-23 live runs (ffx2-trema-win, -r2, -r3, -r4 and INJECTED) is on disk, and run.json shows many attempts with retries. I read the stored evidence and did not re-run the 26 attempts. The Paragon wall is already tracked as PR-0227 and is a difficulty question for Bailey. It is a major finding about the evaluator route, not a product defect. (The confirmer re-read stored evidence and did not re-run the live attempts or benches; only 4 of the 9 top issues came back.)
- R23-ENC-01: link 2 retry from a one-survivor carried state cannot be won: confirmed. The stored engine probe trema-link2-probe.json byAlive shows 1 alive: 0 wins of 200 runs, 107 of them lost quickly. 2 alive: 20 of 20 won. 3 alive: 301 of 340 won. This matches the claim. The live run r4 evidence is consistent with it. I did not re-run the probe. The severity question (the TR5 b pick was Bailey's) is a policy call, not a reproduction problem. The fix stays Bailey's decision, with no change to Trema's numbers. (The confirmer re-read stored evidence and did not re-run the live attempts or benches; only 4 of the 9 top issues came back.)
- PR-0269: Ch XVII advisor card chain clears 97 of 200 seeds; Genais's Sigh is 60 of 103 losses: confirmed. sin-ab-cand.json gives card 97 of 200 (48.5 percent), sensible 51 of 200, and link3 sin-genais-sigh as 60 of the 103 losses. This matches the claim exactly. The file is a stored bench result and I did not re-run it. The issue is carried from earlier rounds and is not a regression. (The confirmer re-read stored evidence and did not re-run the live attempts or benches; only 4 of the 9 top issues came back.)
- Motion continuity still fails (CHK-027): KO swaps are bare cuts, attack-to-follow shows two figures, boss paintings teleport: confirmed. continuity-summary.json reports 0.58 snaps per minute against the 0.25 limit, 102 hard cuts, 161 ghost swaps over the severity limit (worst 0.446), and a worst jerk of 807 px. CHK-027 fails on 18 of 18 chapters. This matches the claim. I read the stored summary and did not re-run the harness or inspect the strips. The finding is carried from earlier rounds, not introduced by this candidate. (The confirmer re-read stored evidence and did not re-run the live attempts or benches; only 4 of the 9 top issues came back.)
- Chief, own checks: confirmed. The chief re-read trema-link2-probe.json and -active.json byAlive (matches PR-0407), the Ch III and Ch II scripts for the "silent seam" gap issue (REFUTED: music(null) is scripted, braskas-final-aeon.ts 251 and 280, yunalesca.ts 137 to 149), and the strips swap-289, swap-1085 and swap-1175 (KO cut and hit-flash-covered swap confirmed). The visual and feel auditors' CHK-026 record was reconciled with the capture owner's (the harness aggregate is authoritative).

### Refuted
- gap pass: Silent seam at Ch III link 2 and silent Ch II epilogue: Scripted silence (braskas-final-aeon.ts 251 and 280; yunalesca.ts 137 to 149); folded into the PR-0410 question, not a defect.
- capture owner: Ch XIII never won (major): Kept as an evidence gap (PR-0353), not as a product defect; the fight is winnable by the bench (6.5 percent) and a 28 minute run reached 88 percent of Trema's HP.

### Downgraded
- PR-0377 major -> polish (narrowed: 5 and 1 swaps over tolerance of 10,500)
- PR-0382 major -> polish (Ch XII heap not reproduced, four chapters read)
- fan "UI covering the action" major -> folded into PR-0366 polish (no face or weapon covered, panels hideable)
- fan "camera jerks" major -> PR-0381 polish (a cut per action is by design)
- fan "outfit changes by pose" major -> PR-0420 polish low confidence (dressphere at the swap not shown)
- fan "snapping", "half-motion", "popping" stay major as the existing owner-reported PR-0378, PR-0379, PR-0380

### Merged
- PR-0407 <- R23-ENC-01 + R23-PD-01
- PR-0353 <- capture owner "Ch XIII never won" + gap pass "victory unreached" + R23-PD-02
- PR-0227 <- narrative auditor PR-0227 + encounter auditor PR-0227
- PR-0378, PR-0379, PR-0380 <- visual-targets "Motion continuity still fails" umbrella + the fan's snapping, half-motion, popping, size-jump and jerk breakers
- PR-0377 <- visual-targets size continuity issue
- PR-0408 <- visual-targets Ch XIII dressphere cut + R23-HARNESS-01 + fan Paine and Rikku
- PR-0409 <- R23-XREF-01 + visual-targets shared-tree art issue
- PR-0395 <- R23-DELIV-01 + R23-PD-03
- PR-0259 <- R23-PD-04
- PR-0348 <- R23-HARNESS-02 (R22-FEEL-05)
- PR-0411 <- R23-ON-01 + capture owner pad-B item
- PR-0330 <- capture owner 1280x720 advisor cut
- PR-0372 <- gap pass phone OPTIONS
- PR-0389 <- gap pass TEXT SIZE 130 enemy-move card
- PR-0410 <- audio defeat-silence question + gap pass silent seams (refuted as a defect)
- PR-0366 <- fan UI covering the action
- PR-0382 <- fan figures hiding each other

### Resolved this round
- PR-0385 (polish): the guide sheet is cut mid-line at its foot with no visible scroll cue. Release 39.1: the guide now carries a "[ ] SCROLL" chip and a down arrow (seen live by the interface auditor and by the chief on the 2560x1440 Ch IV frame).
- PR-0406 (polish): at 1280x720 the Sensor card touches Natus. Natus's Sensor card stands clear of his wings at 1280x720 and 2560x1080 (interface and visual auditors, seymour-natus-win-1280 and -2560).

## Ranked issue list (153: 9 major, 128 polish, 16 suggestions; none critical)

### 1. PR-0378 [major, feel] PR-0378 (owner-reported, CHK-027 FAIL, carried, STALLED): a KO is a one-frame cut from the standing painting to the lying one

- Game / chapter: both / every chapter with a KO; worst Ch I, VII, XV, XVII
- Expected: A figure that is hit to KO folds in motion (a blend or an in-between), so that the snaps per minute stay under 0.25 (RUBRIC 6a); the scripted KO cut is the owner's decision (EC-1001-09) but the owner complained of snapping.
- Observed: 78 of the 96 snaps in 9,949 s of battle are the KO collapse: the standing painting is cut to the lying one in one frame (IoU 0.03, 0 blend frames, head moves about 280-365 px). Alone it is 0.47 snaps per minute against the 0.25 limit; all 18 chapters FAIL CHK-027.
- Repro: Play Ch I (seed 1, real keys) until Yuna or Tidus is KO'd; strip seymour-flux-win-r23/continuity/strips/swap-289-yuna-idle-ko.jpg, swap-240-tidus-hurt-ko.jpg; Fallen Aeons jerk-000-yuna.jpg.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/continuity/seymour-flux-win-r23/continuity/strips/swap-289-yuna-idle-ko.jpg; continuity-summary.json (snapsByToPose ko 78)
- Confidence: high (measured by the harness, confirmed on the strips)
- Requirement: RUBRIC 6a, CHECKS CHK-027 item 1
- Where: KO pose swap in the presenter (not traced to a line)
- Fix: Blend the standing-to-lying KO swap over 6 to 10 frames at the same feet point (the harness predicts about 0.03 snaps per minute), or bring it to the owner with the strip as a keep-or-blend decision.
- Acceptance: Re-run the continuity harness on Ch I, VII and XV: KO snaps 0 and snaps per minute at or under 0.25.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Chief read swap-289-yuna-idle-ko and swap-1085-yuna-hurt-ko: the standing painting is replaced by the lying one in one frame, 0 blend frames. Not a regression: 76 of 81 snaps in round 22, 78 of 96 now. Nothing in release 39.1 targeted it.

### 2. PR-0379 [major, feel] PR-0379 (owner-reported, CHK-027 FAIL, carried): most pose changes show two copies of the figure at once

- Game / chapter: both / every chapter; worst Ch XVII Sin fins (61 swaps), Ch II (22), Ch VI (20), Ch IV (14)
- Expected: A pose change reads as one figure moving, not two bodies side by side; under 0.40 severity for every swap.
- Observed: 9,858 of 11,547 counted swaps (85 percent) show a double image and 161 reach severity 0.40 or more (worst 0.446). Attack-to-follow shows two Tidus or Auron silhouettes (IoU 0.14-0.20) for 8 frames; Bahamut's translucent double is visible in the Ch IV seq-action-playing frames 1-3.
- Repro: Ch I seed 1 real keys: Tidus attack to follow (swap-984 in Ch III, swap-234 in Ch II); Ch IV seq-action-playing f01-f03; Ch XVII right fin cast to idle.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/continuity/braskas-final-aeon-win-r23/continuity/strips/swap-984-tidus-attack-follow.jpg; D:/Final Fantasy/critic/rounds/round-23/evidence/ffx2-bahamut-win/seq-action-playing/f02.jpg
- Confidence: high
- Requirement: CHECKS CHK-027 item 3
- Where: pose crossfade in the stage figure planes (not traced)
- Fix: Cut or shorten the crossfade where the two silhouettes share under a fifth of their outline, and keep it for poses whose outline overlaps (same approach the 2026-10-01 advice named in reverse).
- Acceptance: Harness: swaps at or over 0.40 severity are 0 in Ch IV, VI, XI and XVII; strips show one figure.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 3. PR-0148 [major, audio] No numeric owner listening verdict for the shipped mix (PR-0148, CHK-B1): audio cannot be scored

- Game / chapter: both / all
- Observed: RUBRIC section 6 includes Bailey's listening assessment in the audio category. OWNER-VERDICT.md's newest entry is 2026-09-28 (about older sketches), the last ear words on a shipped mix are 2026-09-27 'still sounds like snes music' (release 21), and music v2 and SFX v2 were adopted without listening (D-302, D-303, D-306; D-307 to D-309 and D-404 by default 'I'll listen later'; D-349 'no number given yet'). Audio bytes are identical to rounds 20 to 22, so nothing has answered it. This is the fifth review in a row with audio UNVERIFIED for the same reason.
- Repro: Read docs/audio/OWNER-VERDICT.md, docs/target/decisions.json (D-349, D-404) and docs/target/targets.json; no 0 to 10 number for the shipped music v2 and SFX v2 exists.
- Evidence: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json D-349 and D-404; git diff 816d80f9..d3fe9fe5 over src/audio public/audio docs/audio is empty; critic/rounds/round-23/audio/live-hash.json
- Confidence: high (absence of a record; the state of the files is checkable)
- Requirement: RUBRIC section 6 (audio: Bailey's listening assessment), CHK-B1, AGENTS.md hard rule 13
- Where: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json D-349
- Fix: Bailey listens from docs/audio/audition.html (about ten minutes) and gives one number from 0 to 10 for the shipped music v2 and SFX v2, plus an answer to D-307, D-308 and D-309. The critic then scores the category; an agent never invents the number.
- Acceptance: A dated, verbatim numeric verdict in OWNER-VERDICT.md tied to a named build and cue set; the audio category moves from UNVERIFIED to scored.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 4. PR-0380 [major, feel] PR-0380 (CHK-027 FAIL, carried): large figures jump sideways in one frame when a pose changes

- Game / chapter: both / Ch V Vegnagun tail, Ch XVII Sin fins and Sin overdrive, Ch III Yu Pagoda hands
- Expected: Boss parts change pose without a jump that is over 40 px; where a jump is hidden by a flash, the flash must cover the swap.
- Observed: Vegnagun tail pose swap 807 px in one frame, Sin overdrive 513 px, Sin right fin cast to idle and idle to cast 340 px (IoU 0.10, 0 blend frames, 4 snaps), Braska's two Yu Pagoda hands about 550 px in one frame mid-move (head, move speed 2 px).
- Repro: Ch V seed 3: tail attack (jerk-000-vegnagun-tail); Ch XVII seed 2: right fin gathers (swap-504-right-fin-cast-idle, swap-525-right-fin-idle-cast); Ch XVII overdrive (jerk-000-overdrive-sin).
- Evidence: D:/Final Fantasy/critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/strips/jerk-000-vegnagun-tail.jpg; D:/Final Fantasy/critic/rounds/round-23/continuity/sin-fins-core-win-r23/continuity/strips/swap-504-right-fin-cast-idle.jpg
- Confidence: high for the numbers, medium for the cause (the painting boxes differ in the swap; the Sin fin strip may also be a registration artefact)
- Requirement: CHECKS CHK-027 item 4
- Where: boss pose registration (src/data/art/poseRegistrationFoes.ts, not traced)
- Fix: Register the bosses' poses to a shared anchor as was done for the party (D-457 covered 42 foes only in scale and stance) and verify the strips.
- Acceptance: Harness worst jerk under 40 px for Vegnagun, Sin fins and Yu Pagoda at swaps.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Release 39.1 registered 42 foes in scale, stance and upright (D-457); the boss jerks and painting-swap jumps are unchanged in size (worst 807 px against 815 px), because registration fixes a figure's size at a swap, not a painting that is replaced under a flash. Fan evidence adds Sin fins and whale pop-in (swap-821, swap-411, jerk-000-right-fin), Vegnagun tail and head (jerk-000, jerk-010), Ifrit, Valefor and Yunalesca size changes at hurt-to-ko and cast-to-idle (swap-237, swap-652, ghost-095), Bahamut and Paragon (jerk-000, jerk-022).

### 5. PR-0269 [major, combat] PR-0269 (carried, unchanged, re-measured): Chapter XVII's advisor card chain clears 97 of 200 seeds (48.5 percent); Genais's Sigh on link 3 is 60 of the 103 losses

- Game / chapter: FFX / Ch XVII Sin: the Fins and the Core (sin-fins-core), link 3
- Expected: The advisor's first-ranked line should be a competitive route through the chain on a clear majority of seeds.
- Observed: Card chain 97/200, sensible line 51/200, naive 0/200; losses link3 Genais's Sigh 60, link 3 core elements 29, link 2 fins 12: JSON identical to rounds 19b to 22 (sin-ab-cand.json equals round 22's). Real keys this round: won on seed 2 (249 and 252 turns), stalled at link 3 at the 15 minute budget on seed 1 (217 turns).
- Repro: npx vitest run --config critic/rounds/round-23/combat/vitest.r23.config.ts critic/rounds/round-23/combat/sin-ab.test.ts (R22_TAG=cand)
- Evidence: critic/rounds/round-23/combat/sin-ab-cand.json; critic/rounds/round-23/evidence/sin-fins-core-win-r2/run.json
- Confidence: high
- Requirement: Encounter and advisor fairness (RUBRIC 6 combat; CHK-005); RUBRIC 8 method check owed (same issue open at the same severity for several reviews)
- Where: src/engine/tactics (sin-common, sin-fins-core)
- Fix: Teach the Ch XVII card a Genais's Sigh answer for link 3 and re-measure on 200 seeds; do not change boss numbers; the written method check is owed before another attempt.
- Acceptance: Card chain at least 70 of 100 on 200 seeds with Genais's Sigh no longer the largest loss.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 6. PR-0407 [major, encounter] PR-0407 (new, FFX-2 only; R23-ENC-01 and R23-PD-01 merged): in Ch XIII a loss in link 2 (Trema) retries from Paragon's end state, and when only one girl survived link 1 that retry cannot be won

- Game / chapter: FFX-2 only / Ch XIII Trema (Oversoul Paragon, link 1, then Trema, link 2), defeat then Retry
- Expected: Retrying a lost fight should offer a fair attempt: either the retry state can be won, or the player is not held in a loop of unwinnable retries with no signal (a faithful carry-over is sourced, research/ffx2-trema.md 1.1: HP, MP, KO and status go from Paragon into Trema; the plan's TR5 b chose a Trema-only checkpoint so a 30-minute fight does not replay Paragon).
- Observed: Engine probe (kit-intended line, shipped options, 200 seeds): 28 of 200 seeds win link 1 at the human Wait split; 10 of those 28 (36 percent) end with ONE living girl. Link 2 from the carried state, 20 retry seeds per carried state (560 runs): three girls alive 301/340 wins (88.5 percent), two alive 20/20, ONE alive 0/200, with 107 of those 200 lost within two player decisions and 6 before the first. Active ATB (27 link-1 wins, 540 runs): one alive 0/240 (152 lost within two decisions), two alive 35/80, three alive 167/220. Live, the same thing happened by real keys: run r4 won link 1 on attempt 12, entered link 2 with Yuna and Rikku KO and Paine at 4,269 of 9,999, and attempts 13 and 14 lost in 2 and 1 turns to Trema's opening Dying Star and Flare (battleSeeds 'link 2' and 'retry after attempt 12' and 'retry after attempt 13', picks[0] engineHp, attempts 13 and 14). Retry re-enters the same carried state with no prep (BattleScreenFlow: no prep when carry.resumeAt), so each retry repeats it; only leaving to chapter select restarts Paragon. This is a second wall behind the known Paragon wall (PR-0227), and it is invisible to the player.
- Repro: 1) npx vitest run --config critic/rounds/round-23/combat/vitest.r23.config.ts critic/rounds/round-23/combat/trema-link2-probe.test.ts (Wait split) and trema-link2-probe-active.test.ts (Active); read byAlive in trema-link2-probe.json and trema-link2-probe-active.json. 2) Live: critic/rounds/round-23/evidence/ffx2-trema-win-r4 (seed drawn, 14 attempts; attempt 12 wins link 1, 13 and 14 are link-2 retries).
- Evidence: critic/rounds/round-23/combat/trema-link2-probe.json; critic/rounds/round-23/combat/trema-link2-probe-active.json; critic/rounds/round-23/evidence/ffx2-trema-win-r4/run.json; critic/rounds/round-23/evidence/ffx2-trema-win-r4/battle-log.json; src/app/screens/pause/restartCarry.ts; docs/plans/chapter-trema-review.md TR5
- Confidence: high on the engine numbers and on the live loss; medium on severity, because TR5 b was Bailey's adopted pick and Trema's 999,999 HP, MP-drain rules and carry-over are sourced (never tune boss numbers)
- Requirement: RUBRIC 6 encounter (fair wins and losses, correct difficulty); AGENTS.md hard rule 6 (do not tune sourced numbers); critic/CHECKS.md CHK-022 (retry reaches a fair fight)
- Where: src/app/screens/pause/restartCarry.ts and BattleScreenFlow.ts (checkpoint retry, TR5 b), src/data/chapter-ffx2-trema.ts (carriesPartyState)
- Fix: Do not touch Trema's numbers. Smallest correction, Bailey's call (a question on TR5): when link 2 is lost, offer a retry that restores the girls as the Chapter XI Save Sphere checkpoint does (the BattleChainCheckpoint carry that restores the party), or fall back to Paragon (TR5 a) when the carried state has one or no survivor, or say on the defeat card that the retry carries Paragon's end state. Measure each answer first (as the plan's method says) and show Bailey the numbers.
- Acceptance: For every reachable carried state the link-2 retry is winnable at a recorded rate (rerun trema-link2-probe: no byAlive row at 0 wins with 100 or more runs), or a retry from a hopeless state starts Paragon again; one real-key run reaching link 2 with one survivor then Retry no longer loses within two turns by construction.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Chief re-read critic/rounds/round-23/combat/trema-link2-probe.json byAlive: Wait split 3 alive 301/340, 2 alive 20/20, 1 alive 0/200 (107 lost within two decisions); trema-link2-probe-active.json: 1 alive 0/240 (152 within two decisions), 2 alive 35/80, 3 alive 167/220. The retry carry is real (restartCarry.ts and BattleChainCheckpoint carry, TR5 b, D-146). The gap pass reached a live defeat and Retry in Ch XIII, but not from a one-survivor state, so the live loop was seen once (run r4, attempts 13 and 14) and the numbers come from the engine probe. The kind of fix is Bailey's call (boss numbers are sourced and untouched). Rated major by the encounter auditor and kept: an unwinnable retry with no signal is a fairness defect, not a lock, because chapter select restarts Paragon.

### 7. PR-0353 [major, encounter] PR-0353 (carried, STALLED, widened: raised from polish): Ch XIII Trema has no real-key victory in 26 attempts over four runs plus a 28 and a 70 minute run, so its victory, post-battle scene, reward row and results-to-board path are unseen for the sixth review (CHK-022 UNVERIFIED)

- Game / chapter: FFX-2 only / Ch XIII Trema (Oversoul Paragon, then Trema)
- Expected: A real-key win with results, CONFIRM, scene, board and a reload that keeps the clear (CHK-022), or Bailey's decision that the difficulty is intended.
- Observed: 0 of 26 real-key attempts won (4 runs, seeds 1, 2, 3 and drawn; best left Paragon at 27,009 of 210,000); one injected autoBattle(intended) run lost; link 1 won once (run r4 attempt 12), then link 2 lost in 2 and 1 turns (PR-0407). The gap pass ran seed 3 for 28 minutes: stalled at link 2 with Trema at 122,279 of 999,999 after 332 turns and the party healthy (a real-key win needs well over 30 minutes at route pace); a 70 minute run was defeated at turn 307. The defeat card (TURNS 307, ATTEMPTS 1, never cleared, RETRY and CHAPTER SELECT) and Retry to party prep and battle were seen live. The shipped bench is 13/200 (6.5 percent) for the chapter at the human Wait split, which agrees with the record, so the wall is the authored fight, not the route.
- Repro: node critic/runner/lib/route.mjs ffx2-trema win --base=https://echoesofspira.com/ --attempts=14 --seed=drawn; critic/rounds/round-23/scratch/gaps/route-r22b.mjs ffx2-trema win seed 3 (28 and 70 minute budgets).
- Evidence: critic/rounds/round-23/evidence/ffx2-trema-win-r4/run.json; critic/rounds/round-23/evidence/ffx2-trema-win-r3/run.json; critic/rounds/round-23/evidence/gaps/ffx2-trema-win-long/; critic/rounds/round-23/evidence/gaps/ffx2-trema-win-vlong/; critic/rounds/round-23/evidence/ffx2-trema-INJECTED-win/run.json
- Confidence: high that no victory is recorded; medium on cause (route pace against authored difficulty is not separated)
- Requirement: CHK-022 (mandatory, UNVERIFIED); RUBRIC section 5 (a debug hook never proves a win); the milestone gate "every encounter through its real flow"
- Where: FFX-2 Ch XIII, the Paragon link
- Fix: The method check of RUBRIC section 8 is owed (this is the sixth review): a human-paced or Jegged-guided run of at least 40 minutes on an idle host to record one real victory flow, or Bailey's answer to the difficulty question (PR-0227); no tuning of sourced numbers.
- Acceptance: One recorded win through results, CONFIRM, scene, board and reload with the reward row read against research/ffx2-trema.md.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Severity raised from polish (rounds 20 to 22) because the evidence gap is now seven runs deep on a mandatory check and keeps a required chapter outside the milestone; it is an evidence gap, not a demonstrated product defect, and it does not hold the build.

### 8. PR-0099 [major, audio] PR-0099 (carried, STALLED): chapter rows in THEMES.md still play a stand-in cue (VI, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII)

- Game / chapter: both (FFX: IX, X, XII, XIV, XVII, XVIII; FFX-2: VI, XI, XIII, XV, XVI) / VI, IX to XIII (FFX-2: VI, XI, XIII, XV, XVI), XIV, XVII, XVIII
- Observed: The chapter cue map marks these chapters 'stand-in' or 'borrowed' (themes-audit prints 'borrowed; owed' on VI, IX, X, XI, XIII, XIV, XV, XVI, XVII, XVIII; XII is a stand-in in the table). Round 21's routing confirms what plays: Ch VI, XI, XVI and XIII phase 2 on boss-ffx2-aeon; Ch IX and XIV on boss-yojimbo; Ch X on boss-seymour-macalania; Ch XII on boss-seymour with scene-dreams-end; Ch XV on boss-shuyin; Ch XVII and XVIII on scene-fahrenheit and boss-evrae. D-209 says a stand-in never counts as finished. Nothing changed in this build.
- Repro: node tools/audio/themes-audit.mjs (cue-map section), then read critic/rounds/round-21/audio/routing.json for the cues actually playing per chapter.
- Evidence: critic/rounds/round-21/audio/themes-audit.txt; critic/rounds/round-21/audio/routing.json
- Confidence: high
- Requirement: docs/audio/THEMES.md chapter cue map; D-209
- Where: docs/audio/THEMES.md 'The chapter cue map'; src/data/encounters.ts music records
- Fix: Compose and ship the owed cues in D-209's list after the audio direction pick (boss-leblanc, boss-trema, boss-den-of-woe, the Natus and Omnis cues, the Sin assault and countdown cues, and the rest), each auditioned by Bailey before it ships (rules 8 and 13).
- Acceptance: The row's Status changes from stand-in to own, themes-audit shows the new cue against the bible, and routing evidence shows the new key at that chapter's boss moment.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried; the audio auditor's cue-map sweep shows the same stand-ins (boss-ffx2-aeon for IV, VI, XI; boss-evrae for VIII, XVII, XVIII; boss-yojimbo for IX and XIV; XIII on a labelled scene bed). Audio unchanged since round 21.

### 9. PR-0222 [major, delivery] PR-0222 (carried, unchanged, not captured): the fix for the hidden FF7 fight's black hold on a cold cache is still not observed

- Game / chapter: FF7 experiment (hidden)
- Expected: No black hold: the swirl's last frame holds until the art settles.
- Observed: Not captured in round 21. No FF7 product file changed in release 38 (only tests/unit/ff7-repair.test.ts), so the carried state stands, with no credit and no fresh evidence.
- Repro: Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears; press Esc and arrows during the hold.
- Evidence: critic/rounds/round-20.json PR-0222
- Confidence: low (not observed)
- Requirement: CHK-017 and CHK-025; RUBRIC section 5
- Fix: None proposed until observed.
- Acceptance: Frames every 200 ms on a cold throttled load with no black frame after the swirl.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried, not captured: the hidden FF7 fight is outside this round's scope (CHK-025 NOT APPLICABLE).

### 10. PR-0377 [polish, visual] PR-0377 (owner-reported, CHK-026 FAIL, DOWNGRADED from major to polish and narrowed): the size and feet complaint is fixed to within 5.2 percent and 4.2 px; five registered head swaps and one feet swap still miss the tolerance, and 3,313 swaps are read only by mass at 30 percent

- Game / chapter: both (FFX Ch I, VII, XVII) / Ch VII Macalania Yuna and Rikku idle to victory; Ch XVII Yuna ko to idle and hurt to ko; Ch I Yuna hurt to idle
- Expected: Every swap within 3 percent head and 2 px feet.
- Observed: Registered heads move 5.2 and 3.3 percent (Ch VII idle to victory), 3.1 to 3.3 percent (Ch XVII Yuna ko and hurt swaps) against a 3 percent tolerance, and Ch I Yuna hurt to idle moves her feet 4.2 px against 2. All of the other 10495 judged swaps are within tolerance. 3313 swaps are read only by mass at 30 percent (worst 28.7 percent, Leblanc logos-room hurt to cast), so an unregistered boss or goon can still jump up to 30 percent without failing.
- Repro: Continuity harness, chapters seymour-flux, seymour-anima-macalania, sin-fins-core; swap ids 288, 382, 383, 1389, 1481, 1490.
- Evidence: critic/rounds/round-23/continuity/seymour-anima-macalania-win-r23/continuity/continuity.json; sin-fins-core-win-r23; seymour-flux-win-r23
- Confidence: high on the numbers, low that a player can see 3 to 5 percent
- Requirement: CHK-026
- Where: suspected src/data/art/poseRegistration*.ts for these poses; not traced
- Fix: Re-measure those poses in tools/posescale (Yuna victory and ko, Rikku victory, Yuna hurt stance) and add registrations for the unregistered foes the mass reading covers (Leblanc logos-room first).
- Acceptance: CHK-026 PASS in Ch I, VII and XVII and no mass-read swap above 15 percent.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Round 22: 1,688 head and 1,749 feet swaps over tolerance of 10,479. Round 23: 5 and 1 of 10,500. The chief read swap-1085, swap-289 and swap-1175: head and feet stay on the guide lines. CHK-026 still records FAIL and the sub-score caps hold. 17 costume swaps (worst 51.3 percent head, 45.6 px feet) are outside the check by definition (see PR-0408). The capture owner's per-chapter CHK-026 list (Vegnagun, Macalania, Fins and Core, Yunalesca) was read from the -pm runs and is superseded by the harness aggregate used here (FAIL in Ch I, VII and XVII only). Whether the registered tables are right is not proved by the harness (CHK-026 note 6); the strips agree for the swaps read.

### 11. PR-0408 [polish, feel] PR-0408 (new, FFX-2 only; merges R23-HARNESS-01): Ch XIII dressphere changes and 14 idle-to-idle swaps at turn start are hard cuts, Paine and Rikku change size and outfit in one frame, and the harness may be counting a staged change as a snap

- Game / chapter: FFX-2 only / Ch XIII Trema, 20 of the chapter's 24 snaps
- Expected: A dressphere change plays the staged spherechange twirl or a blend; if the change is a link or Lady Luck forced change, the figure still blends.
- Observed: Ch XIII measures 2.66 snaps per minute, the highest of the 18: 20 of its 24 snaps are idle-to-idle cuts at turn start (Paine Dark Knight to Lady Luck, Yuna, Rikku; IoU 0.28 to 0.42, 44 to 85 px, 0 blend frames; strip swap-019 feet 13 px; swap-546 feet 45.5 px). The capture owner's seq-spherechange shows a light column and a name chip over the same change, so some of these are the staged dressphere change that the harness did not classify as a costume swap (CHK-026 note 7); the strips show the figure changing size and outfit in one frame.
- Repro: ffx2-trema real-key run, any attempt that reaches link 2; strip critic/rounds/round-23/continuity/ffx2-trema-win-r23/continuity/strips/swap-019-paine-idle-idle.jpg.
- Evidence: critic/rounds/round-23/continuity/ffx2-trema-win-r23/continuity/continuity.json
- Confidence: medium-low (cause not traced)
- Requirement: CHK-027 item 1
- Where: src/engine presenter dressphere change; critic/runner/lib/continuity-pure.mjs costume detection (suspected, not traced)
- Fix: Suspected: route the turn-start costume change through the spherechange sequence or a crossfade; confirm first which event triggers it.
- Acceptance: The Trema chapter's idle to idle swaps no longer count as snaps.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 12. PR-0355 [polish, visual] Magus Sisters bars: status chips overprint the names Cindy and Mindy (carried from round 22)

- Game / chapter: FFX-2 only / Ch XI Fallen Aeons link 2 first menu
- Expected: Names whole and readable (CHK-009).
- Observed: The STATUS chip rows sit over the names Cindy and Mindy so only 'Sandy' reads cleanly (re-seen in 24-seam-2-first-menu).
- Repro: ffx2-fallen-aeons seed 2, first menu of link 2.
- Evidence: critic/rounds/round-23/evidence/ffx2-fallen-aeons-win-r2/24-seam-2-first-menu.png
- Confidence: high
- Requirement: CHK-009
- Where: FFX-2 enemy bar stack, not traced
- Fix: Move the chips to the right of the HP bar or stack them under the bar.
- Acceptance: All three names legible with a status present.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 13. PR-0384 [polish, visual] Chapter-select hero card paints without the boss layer on arrival (carried PR-0384)

- Game / chapter: both / Ch VIII card at first arrival and on returning from results
- Expected: Boss on its scene (tile Chapter select v2).
- Observed: 03-card and 34-board-after show the hero card with no Evrae painting (a dark card, then clouds only); after a reload the boss is there.
- Repro: Fresh profile, chapter select, Ch VIII; and win Ch VIII, confirm results.
- Evidence: critic/rounds/round-23/scratch/cs.jpg
- Confidence: medium
- Requirement: approved tile Chapter select v2
- Where: not traced
- Fix: Preload the selected card's boss and scene layers before showing the card.
- Acceptance: The boss is painted in the first frame the card is shown.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 14. PR-0366 [polish, visual] HUD panels stand over painted figures (carried PR-0366)

- Game / chapter: both / Ch II, XII, XVIII at 1600x900; Ch I and IV at 1280x720
- Expected: Only the two declared overlaps.
- Observed: Party plates cover the lower legs of Wakka (Ch XVIII), the Omnis enemy-intent text runs across Omnis's lower body (Ch XII), the Mortiorchis Sensor card covers Seymour's lower legs and the Bahamut intent card his right wing at 1280x720. No face or weapon is crossed. First-time fan, from the sequences: the hero portrait covers the left half of the screen with the party at every menu opening, and the guide and next-move panels cover the right side of Bahamut (Ch IV), Paragon (Ch XIII), Vegnagun and Sin's fin while a move plays; they rated it major. The chief keeps polish: the panels are the approved Ink and Gold chrome, no face or weapon is crossed in the captures read, and the player can hide them (G, E, H).
- Repro: Real-key first menu in those chapters; evidence 23-midfight and 11-advisor.
- Evidence: critic/rounds/round-23/evidence/sin-face-win/23-midfight.png; seymour-omnis-win-r2/11-advisor.png; seymour-flux-win-1280/11-advisor.png
- Confidence: high
- Requirement: CHK-008
- Where: HUD safe zones, not traced
- Fix: Shift the intent text and Sensor card off the boss's body or let them fade when they overlap.
- Acceptance: CHK-008 over the matrix.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 15. PR-0403 [polish, visual] Ch XIV mid-fight frame washed grey with only Yuna in colour (carried PR-0403, low confidence)

- Game / chapter: FFX only / Ch XIV Isaaru, 23-midfight
- Expected: A summon moment shows its own effect, not a grey frame.
- Observed: The whole frame including the HUD is under a pale grey wash, Yuna and Grothia are in colour and a figure is cut off at the right edge. The following action sequence frames are normal, so it is a transient (suspected summon or dismiss fade).
- Repro: isaaru-via-purifico real-key run seed 1, the 23-midfight capture.
- Evidence: critic/rounds/round-23/evidence/isaaru-via-purifico-win/23-midfight.png; scratch/isaaru-seq.jpg
- Confidence: low
- Requirement: CHK-016 plus visual staging
- Where: not traced
- Fix: Check the aeon summon and dismiss fade layer.
- Acceptance: 23-midfight in Ch XIV shows the normal battle.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 16. PR-0409 [polish, delivery] PR-0409 (new; merges R23-XREF-01): the shared tree's public/art disagrees with the approved hashes (19 mismatched, 47 missing) and two pose-art unit tests fail on this disk, although the live site is pixel-identical to the approved art

- Game / chapter: both / not a chapter (art delivery)
- Expected: 0 mismatched, 0 missing against the tree a release is cut from.
- Observed: node D:/Tools/pyrefly-lora/tools/verify-approved.mjs on D:/Final Fantasy reports 19 mismatched and 47 missing. The 19 are the pre-D-380 Tidus and Bahamut files and the pre-D-458 title key art; the 47 are the 45 Lady Luck paintings and two @2x masters. Live is pixel-identical to the approved versions in every case sampled. The combat auditor saw the same root as test failures: tests/unit/engine/pose-scale-art.test.ts (16 "painting changed since it was measured") and pose-install-0930.test.ts (tidus/critical sha f4d96576 against the locked 672f798d), plus the three Lady Luck face-crop failures (PNGs absent from this checkout). The visual auditor traced the 19 to the shared tree still holding the pre-D-380 Tidus and Bahamut originals and the pre-D-458 title painting, the 47 to the 45 Lady Luck paintings and two @2x masters that exist only in the release tree. Live was proved pixel-identical for the shipped tidus attack, ffx2-bahamut idle, tidus ready, 14 sampled PNG masters and all 47 Lady Luck and @2x files.
- Repro: Run verify-approved.mjs in D:/Final Fantasy; compare the recorded sha256 with D:/Tools/pyrefly-art-backup/candidates/2026-10-04/trapped-white/install-ready.
- Evidence: critic/rounds/round-23/scratch/verify-approved.txt; va-detail.mjs; va-detail2.mjs; ll.py; cmp.py
- Confidence: high
- Requirement: RUBRIC section 2, approved artwork is protected
- Where: public/art in D:/Final Fantasy (gitignored)
- Fix: Copy the approved install-ready files into the shared tree (or always verify against the release tree) so a build cut from the shared tree cannot ship stale approved art.
- Acceptance: verify-approved on the tree the next release is cut from: 0 mismatched, 0 missing.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 17. PR-0348 [polish, feel] PR-0348 (critic tooling, re-observed): the Ch VI route idles about 3 minutes at turns 12 to 16 inside Rikku's White Magic submenu while ordering a Potion; round 22's R22-FEEL-05 was this route stall, not a game stall

- Game / chapter: FFX-2 / Ch VI Leblanc
- Expected: The route cancels back and chooses the Item row, or records a stall with the menu it was in.
- Observed: turn-log turns 12-16 of ffx2-leblanc-win are 'idle' with target 'no target cursor', 36 s apart, with the route's menu rows showing White Magic (Pray, Vigor, Shell...) for the Potion order; the sixth try at 235 s succeeds. The fight then won in 592 s. No game lock was shown.
- Repro: Ch VI seed 1 route; turn-log.json turns 12-17.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/evidence/ffx2-leblanc-win/turn-log.json; run.json misses[0]
- Confidence: medium (the route, not the engine, is shown; a capture of the menu state would prove it)
- Requirement: CHECKS CHK-016
- Where: critic/runner/lib/route.mjs (not traced)
- Fix: Critic route: after 'no target cursor' press Back twice and re-enter the Item list; count the retry as a miss.
- Acceptance: Ch VI route without an 'idle' turn longer than 15 s.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 18. PR-0395 [polish, delivery] PR-0395 (carried, widened; merges R23-DELIV-01 and R23-PD-03, low confidence): FFX-2 chapters carry 1.05 to 1.92 percent of battle frames over 34 ms (FFX 0.05 to 0.26), and the 39.1 upload-stall fix is visible in Ch I, Anima and Trema (worst frame 533 to 114 ms, 455 to 100, 461 to 161) but not in FFX-2 generally (Vegnagun worst frame 474 to 580 ms; Fallen Aeons 0.62 to 1.05 percent)

- Game / chapter: FFX-2 / Ch IV, V, XI, XIII, XVI
- Expected: A measured gain after 'upload stalls fixed' in every chapter, or the cause named.
- Observed: Slow frames per chapter: Ixion 1.79 percent, Trema 1.66, Bahamut 1.25, Vegnagun 1.25, Fallen Aeons 1.05 (round 22: 0.62), against 0.05-0.26 percent in the FFX chapters; worst frame 580 ms in Ch V (round 22: 474 ms) while Ch I's worst fell 533 to 114 ms. Maximum frame time is lower in 8 chapters and higher in 9. Serial continuity set, 1600x900, RTX 5070 Ti: IV 1.35, V 1.28, XI 1.09, XIII 1.77, XVI 1.92 percent; all FFX chapters 0.09 to 0.24; VI 0.14, XV 0.09; whole set 0.59 percent (round 22: 0.40; IV 1.15, V 1.04, XIII 1.52 then). Worst single frame: Vegnagun 580 ms (round 22 474), Sin Fins 343, Braska 234; Flux fell from 533 to 114 ms, Anima 455 to 100, Trema 461 to 161. Average fps 59.3 to 60 everywhere.
- Repro: Run the continuity harness on Ch IV and Ch V and read probe.slowFrames and maxDtMs.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/continuity.json (probe)
- Confidence: low (host load differs between rounds; belongs to the delivery auditor)
- Requirement: RUBRIC category delivery: stable frame times
- Where: src/engine/TextureStager.ts (suspected, not traced)
- Fix: Compare the FFX-2 texture uploads with Ch I's fix.
- Acceptance: FFX-2 chapters under 0.5 percent slow frames on the same host.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 19. PR-0381 [polish, feel] PR-0381 (carried, widened by the fan): camera framing: Ch VII framing alternation (round 22), and in this round the fan saw Vegnagun fill the screen with the three girls as dots in the corner during the tail action (Ch V), Rikku at the very bottom edge in the Macalania victory pose (swap-383), and Ormi and Rikku jumping to a different scale in Ch VI (jerk-000, jerk-001)

- Game / chapter: both / Ch V, VI, VII
- Expected: A dressphere change is staged and recorded as a costume swap (CHK-026 item 7); if it is not staged, it is a snap.
- Observed: Fan breakers (rated major by the fan): Ch V seq-action-playing frames 1 to 10 (party tiny against the Vegnagun tail), Ch VII swap-383-rikku-idle-victory (Rikku at the frame bottom), Ch VI jerk-000-ormi and jerk-001-rikku (a change of scale in one frame). The harness counts 1,157 camera cuts or whips in 9,949 s (7.0 a minute), a cut per action by design, so a cut is not the defect; a framing that loses the party is. Round 22's Ch VII alternation was not re-seen in the strips and captures read.
- Repro: Ch V seed 3 tail action (seq-action-playing); Ch VII victory pose; Ch VI Rikku close-up.
- Evidence: critic/rounds/round-23/scratch/crit-fan/ffx2-vegnagun-shuyin-seq-action-playing.jpg; critic/rounds/round-23/continuity/seymour-anima-macalania-win-r23/continuity/strips/swap-383-rikku-idle-victory.jpg; critic/rounds/round-23/continuity/ffx2-leblanc-win-r23/continuity/strips/jerk-001-rikku.jpg
- Confidence: medium
- Requirement: RUBRIC feel (coherent camera); camera grammar D-316/D-317
- Where: not traced
- Fix: Frame the party with the boss when a boss move plays (keep the boss and the target inside the safe area); do not close on a victory pose below the HUD line.
- Acceptance: Ch V tail action and Ch VII victory: all three girls fill at least the lower-left quarter, nothing at the frame edge.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 20. PR-0418 [polish, feel] PR-0418 (new, fan, FFX only): one frame of a figure drawn as a gold or black-and-white negative of itself at a pose swap in the middle of an attack or flash (Seymour Natus, Auron in Sin Face, Tidus in Ch I)

- Game / chapter: FFX only / Ch I, X, XVIII
- Expected: No single-frame inversion.
- Observed: seymour-natus jerk-002-seymour-natus (one gold negative frame), sin-face jerk-004-auron (one inverted black-and-white frame), seymour-flux jerk-013-tidus (figure dark for a frame at the swap). 3 seen by the fan in about 120 of 340 strips.
- Repro: Strips named; real keys, seed 1, Ch I, X, XVIII.
- Evidence: critic/rounds/round-23/continuity/seymour-natus-win-r23/continuity/strips/jerk-002-seymour-natus.jpg; critic/rounds/round-23/continuity/sin-face-win-r23/continuity/strips/jerk-004-auron.jpg; critic/rounds/round-23/continuity/seymour-flux-win-r23/continuity/strips/jerk-013-tidus.jpg
- Confidence: medium (strip frames, a single frame each; may be an intended flash layer)
- Requirement: CHK-027 (flicker), first-time-fan lens D-423
- Where: not traced
- Fix: Find which layer draws the negative (suspected: a flash or bloom pass on the swap frame) and hold the blend on that frame.
- Acceptance: The three strips show no inverted frame.
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 21. PR-0419 [polish, feel] PR-0419 (new, fan, low confidence): the party arrives as faint see-through ghosts for the first frames of a battle seam before turning solid (Ch VI, III, XI seam 2) and a figure pops in beside another (Tidus beside Rikku, Ch VII jerk-002)

- Game / chapter: both / Ch III, VI, VII, XI
- Expected: A deliberate fade-in or a solid first frame.
- Observed: The capture owner's seq-seam-2 sequences of ffx2-leblanc, braskas-final-aeon and ffx2-fallen-aeons: frame 1 shows the party as faint ghosts; seymour-anima jerk-002-rikku: Tidus appears at the swap frame.
- Repro: seq-seam-2 folders; Ch VII jerk-002-rikku.
- Evidence: critic/rounds/round-23/scratch/crit-fan/leblanc-seam2.jpg; critic/rounds/round-23/scratch/crit-fan/braska-seam2.jpg; critic/rounds/round-23/scratch/crit-fan/fallen-seam2.jpg
- Confidence: low (may be the intended entrance fade)
- Requirement: CHK-027 popping; first-time-fan lens
- Where: not traced
- Fix: Say whether the entrance fade is designed; if not, load the party before the plate lifts.
- Acceptance: Seam sequences frame 1 show solid figures or a labelled fade.
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 22. PR-0420 [polish, visual] PR-0420 (new, fan, low confidence, FFX-2 only): the FFX-2 hurt and KO paintings read as a different outfit to the idle, ready and cast paintings (Yuna white coat when hurt against white mage robe standing; Rikku pale and blonde hurt against dark armour ready)

- Game / chapter: FFX-2 only / Ch V, VI, XI
- Expected: One costume per dressphere across its poses; a change of dressphere is a staged Change.
- Observed: swap-1085-yuna-hurt-ko, swap-1109-yuna-ko-idle, swap-1132-rikku-hurt-cast, swap-1175-rikku-idle-hurt (Ch V), swap-400-rikku-ready-hurt, ghost-291-rikku-hurt-idle (Ch XI), jerk-001-rikku (Ch VI). The chief read swap-1085 (Yuna in white robe standing, a lying figure in a white coat after the cut) and swap-1175 (Rikku in dark armour under a bloom flash): the difference is not established from the strips, because the dressphere at the swap is not shown and some are costume swaps the check excludes.
- Repro: Ch V seed 3: Yuna hurt to KO; Rikku hurt to cast.
- Evidence: critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/strips/swap-1085-yuna-hurt-ko.jpg; critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/strips/swap-1175-rikku-idle-hurt.jpg; critic/rounds/round-23/continuity/ffx2-fallen-aeons-win-r23/continuity/strips/swap-400-rikku-ready-hurt.jpg
- Confidence: low (a harness-level question: which dressphere was active at each swap)
- Requirement: RUBRIC visual (costume consistency); approved art is protected, so this is a question about which painting plays, never a replacement
- Where: src/data/art pose tables (suspected, not traced)
- Fix: Print the active dressphere on each strip and compare the hurt and KO paintings with the idle of the same dressphere; fix only a wrong pairing in the pose table.
- Acceptance: Strips for hurt, KO and idle of one dressphere show one costume.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 23. PR-0382 [polish, visual] PR-0382 (DOWNGRADED from major, narrowed): Ch XII first menu no longer heaps the party; an attack playing behind another party member (Ch I, X) and Yuna or Auron hidden behind Wakka or ice spires are still seen by the fan

- Game / chapter: FFX / XII (worst), I, X
- Expected: Each party member reads as a separate figure in its own slot, as in the approved battle targets.
- Observed: Interface and visual auditors: Ch XII party spread in the first menu (not reproduced). Not re-checked: attacks playing behind another member in Ch I and X. Fan: Yuna in front of Tidus and Auron behind Wakka's body (braskas swap-984, omnis swap-772), Yuna behind ice spires (anima swap-007, swap-008).
- Repro: Live, seed 1, 1600x900, real keys: Chapter XII, the 23-midfight capture; Chapter I, Auron's attack (strip ghost-386).
- Evidence: critic/rounds/round-22/evidence/seymour-omnis-win/23-midfight.png; critic/rounds/round-22/continuity/seymour-flux-win-r22/continuity/strips/ghost-386-auron-attack-follow.jpg; critic/rounds/round-22/continuity/seymour-natus-win-r22/continuity/strips/ghost-208-tidus-attack-follow.jpg
- Confidence: medium (seen in single frames; formation versus transient not separated)
- Requirement: RUBRIC 6 visual (staging, composition); approved battle targets
- Where: suspected: Ch XII formation slots or the attack travel path (targeting, formation and camera changed in release 39); not traced
- Fix: Measure the three slot positions in Ch XII at the first menu and during an attack; if the formation overlaps, spread the slots; if the attacker travels across allies, route the travel in front.
- Acceptance: Ch XII first menu and mid-action captures at 1600x900 and 2560x1440: party figures overlap by under 15 percent of the smaller figure's box.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Downgraded because the case that made it major (the Ch XII heap in front of the discs) is repaired and live-seen in four chapters; the remainder is occlusion by design of the painted staging, a polish question.

### 24. PR-0401 [polish, visual] PR-0401 (new): a Yu Pagoda appears out of a white flash with no fade (Ch III) and Overdrive Sin is absent for three frames and then pops in (Ch XVIII)

- Game / chapter: FFX / III, XVIII
- Expected: An entrance fades or is covered by a deliberate beat.
- Observed: Strip jerk-005-yu-pagoda-right shows the pagoda present after a flash with no fade-in; strip jerk-000-overdrive-sin shows frames -6 to -4 with no Sin, then Sin's head in place.
- Repro: Live, seed 1, 1600x900: Chapter III (link 3), Chapter XVIII battle start.
- Evidence: critic/rounds/round-22/continuity/braskas-final-aeon-win-r22/continuity/strips/jerk-005-yu-pagoda-right.jpg; critic/rounds/round-22/continuity/sin-face-win-r22/continuity/strips/jerk-000-overdrive-sin.jpg
- Confidence: medium
- Requirement: CHK-027 (popping); RUBRIC 6 feel
- Fix: Fade the pagoda in under the flash tail; hold the battle reveal until Sin's painting is decoded.
- Acceptance: Strips at those two moments show a fade or no empty frames.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 25. PR-0402 [polish, feel] PR-0402 (new): two boss physical attacks land from across the field (Braska's Left-Arm Strike on Yuna for 2,402; Paragon on Yuna for 1,561) with no travel or reach

- Game / chapter: both / III (FFX), XIII (FFX-2)
- Expected: A physical strike reads as reaching its target (a lunge, a projectile or a cut to contact).
- Observed: Timed sequences show the damage numeral on Yuna while the boss stays on its side of the field.
- Repro: Live, seed 1: Chapter III seq-action-playing f00; Chapter XIII seq-action-playing f03-f05.
- Evidence: critic/rounds/round-22/evidence/braskas-final-aeon-win/seq-action-playing/f00.jpg; critic/rounds/round-22/evidence/ffx2-trema-win/seq-action-playing
- Confidence: medium (stills at 250 ms; no continuous clip)
- Requirement: RUBRIC 6 feel (action and reaction timing)
- Fix: Give large-boss physical moves a reach beat (lunge or contact cut); release 39 already did this for the party's strike on Braska.
- Acceptance: A clip of each move shows contact before the numeral.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 26. PR-0390 [polish, narrative] PR-0390 (re-observed and widened, FFX-2 only): Ch XIII and XV open in third person, and Ch XVI mixes third-person captions with Yuna's first-person narration

- Game / chapter: FFX-2 / Ch XIII, XV, XVI
- Expected: FFX-2 chapters are narrated in Yuna's voice (writing bible line 512).
- Observed: Ch XIII opens 'Under Bevelle, a dungeon goes down a hundred floors.'; Ch XV 'Ten old spheres. Paine's recordings, every one.'; Ch XVI has both 'At the top of the stairs, the aeon turns on them.' (third person, speaker blank) and 'I fell a long way.' (Yuna).
- Repro: Ch XIII, XV and XVI pre-battle and post-battle scenes.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/evidence/ffx2-ixion-djose-win/run.json (dboxTimeline 3, 8, 10); ffx2-den-of-woe-win-r2/run.json (0-3); ffx2-trema-win-r4/run.json (0-3)
- Confidence: high
- Requirement: research/writing-bible.md line 512
- Where: src/story/scripts/ffx2-trema.ts, ffx2-den-of-woe.ts, ffx2-ixion-djose.ts
- Fix: Put the captions into Yuna's first person, or mark them as stage text.
- Acceptance: No unattributed third-person line in FFX-2 openers.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 27. PR-0262 [polish, narrative] PR-0262 (carried, widened with PR-0255 and PR-0254 re-observed): the results quip "...Okay. Next one." is the first quip in five chapters; Tromell's five Ch VII lines have no speaker; Ch VII Talk is silent

- Game / chapter: both / Ch I, II, VIII, XVII, XVIII (quip); Ch VII
- Expected: Distinct quips; every spoken line attributed.
- Observed: '...Okay. Next one.' is the first quip in five chapters; Ch VII aftermath lines 40, 41, 43, 44, 46 have speaker ''; Talk in Ch VII still silent (not re-played).
- Repro: Ch I, II, VIII results text; Ch VII dboxTimeline 40-46.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/evidence/seymour-anima-macalania-win/run.json; resultsText of seymour-flux-win and yunalesca-win-r2
- Confidence: high
- Requirement: writing bible 5.4
- Where: src/story/scripts/seymour-anima-macalania.ts say('none', ...) lines 248-261
- Fix: Vary the quip bank per chapter; give Tromell a name and role.
- Acceptance: No quip repeated across five chapters; every line has a speaker.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 28. PR-0255 [polish, narrative] PR-0255 (carried, re-observed): Tromell's five Chapter VII aftermath lines have speaker ''

- Game / chapter: FFX only / Ch VII
- Expected: A named speaker (Tromell) or an intentional crowd tag.
- Observed: dbox lines 42-48 of seymour-anima-macalania-win: 'Step away from Lord Seymour, Lady Summoner.', 'You will not put hands on him again.', 'He will be cared for. By his own people.', 'And this. This was never yours.', 'Traitors, all of you. It will be announced.' with an empty speaker.
- Repro: critic/rounds/round-21/evidence/seymour-anima-macalania-win/run.json dboxTimeline.
- Evidence: critic/rounds/round-21/feel-narr/dbox21-all.txt
- Confidence: high
- Requirement: writing-bible voice
- Fix: Set the speaker in the Chapter VII script.
- Acceptance: No empty-speaker line in the Chapter VII aftermath.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Re-observed: speaker '' on Tromell's five lines (src/story/scripts/seymour-anima-macalania.ts lines 248-261).

### 29. PR-0254 [polish, narrative] PR-0254 (carried, STALLED): Chapter VII Talk is still silent

- Game / chapter: FFX / VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
- Expected: A Tidus line and Seymour's reply within 3 s of each Talk.
- Observed: The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- Repro: Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- Confidence: high
- Requirement: narrative: banter and reachable character voice
- Fix: Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- Acceptance: The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 30. PR-0257 [polish, encounter] PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer than the sourced rows (204 and 220 real-key turns this round)

- Game / chapter: FFX / Ch III Braska's Final Aeon
- Expected: Length near the sourced rows.
- Observed: Ch III won by real keys on seed 3 in about 261 to 289 turns and 30:47 of play; seeds 1 and 2 stalled at the 15 and 25 minute budgets (the fight is 244+ turns, 2.3 times the sourced rows). Not a lock.
- Repro: critic/rounds/round-21/evidence/braskas-final-aeon-win-long*/run.json
- Evidence: critic/rounds/round-21/evidence/braskas-final-aeon-win-long/run.json
- Confidence: high
- Requirement: RUBRIC 6 encounter
- Where: src/data/chapter-braska.ts
- Fix: Bailey's call on the gauntlet's length.
- Acceptance: Real-key turn count near the sourced total.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Re-observed: link 1 alone took 125 real-key turns and the 700 s budget; engine intended 39 of 40.

### 31. PR-0279 [polish, encounter] PR-0279 (carried, a question for Bailey): Sin's difficulty is undecided (D-282); nothing changed, so the Ch XVII and XVIII figures stand

- Game / chapter: FFX / Ch XVII and XVIII Sin
- Expected: Bailey's difficulty decision.
- Observed: Ch XVII card 97/200, sensible 51/200; Ch XVIII intended 12/40, advisor 15/40, mash 0/40 (byte-identical to round 20).
- Repro: ffx-bench.test.ts sin-face rows; sin-ab-cand.json
- Evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
- Confidence: high
- Requirement: D-282
- Where: src/data (Sin)
- Fix: Bailey's decision.
- Acceptance: Recorded decision.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 32. PR-0326 [polish, audio] The first UI sounds of a cold session are the procedural synth (PR-0326, fourth consecutive review)

- Game / chapter: both / title, board, Ch I to XVIII (first seconds of a session)
- Observed: On a fresh profile the first logged effect is the synth path in 53 of 63 runs (sfxLog[0] cursor-move or confirm); 216 synth entries in all (cursor-move 181, confirm 25, menu-page 4, cancel 4, wind-high-altitude 2); the recorded sprite or v2 bank takes over from 2.2 to 34.2 s (median 2.7 s; latest synth entries at 16.4, 15.2, 15.1 and 13.8 s in four loaded runs). 'battle-start' (TitleScreen.ts line 203, void audio.playSfxFromSprite('battle-start')) appears in 0 of 63 sfxLogs, so the title's press-start cue is silent. Round 22 measured 34 of 39 and 0 of 39; the pattern is unchanged by 39.1 (the audio code is byte-identical).
- Repro: Fresh profile, headless Chromium PYREFLY_BROWSER=gpu, https://echoesofspira.com/, press Enter at the title (real key), then move the board cursor; read the AudioManager debug sfxLog; e.g. critic/rounds/round-23/evidence/seymour-flux-win/audio-debug.jsonl, last row: first entries 'confirm' via sprite at 2.5 s then v2 at 6.2 s; critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl has synth entries up to 16.4 s. No seed involved.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/audio-debug.jsonl; critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl; critic/rounds/round-22/evidence/seymour-flux-lose/audio-debug.jsonl
- Confidence: high for the pattern, medium for the cause (not traced)
- Requirement: CHK-001 step 3 (nothing falls back to the synth path), CHK-023
- Where: src/app/screens/TitleScreen.ts:203; src/audio/AudioManager.ts around line 524 (suspected, not traced at run time)
- Fix: Smallest probe first, no product change yet: on a quiet host log the return value and branch taken by AudioManager.playSfxFromSprite('battle-start') (ctx null, no manifest sfx, sprite not decoded within waitMs, or no slice). Then either warm the SFX sprite decode at boot or gate the first UI sounds on it.
- Acceptance: On 20 fresh-profile runs the first logged effect is via sprite or v2 in at least 19, and 'battle-start' appears in sfxLog after the title Enter.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 33. PR-0373 [polish, audio] Music cues are fetched at the moment of use: the scene cue is not playing at the first line in 5 of 55 non-Ch-I runs (PR-0373)

- Game / chapter: both / II, III, V, XIII (retry runs); victory jingle in all chapters
- Observed: At the pre-scene sample the chapter's scene cue was not yet playing in 5 of 55 non-Ch-I runs: yunalesca-win-r2, ffx2-vegnagun-shuyin-win-r3 and ffx2-trema-win-r2 still on chapter-select, braskas-final-aeon-win-r2 and ffx2-trema-win-r3 on no music; in each the scene track reads cached false at that moment (a late fetch and decode, with the first spoken line already on screen). Also victory-ffx or victory-ffx2 is not cached at the after-fight sample in about 70 of 75 post-fight samples (the cue is requested only at the results screen), so the jingle's start can lag; at the results sample the right victory cue was playing in 24 of 24 won fights, so the lag, if any, was not measured. All five late-scene runs were second-or-later seed runs of a chapter, so load on the capture host is a candidate cause (round 22 saw 1 of 39 plus Ch IV 2 of 3).
- Repro: critic/rounds/round-23/evidence/yunalesca-win-r2/audio-debug.jsonl row pre-scene (15 s: playing chapter-select, scene-zanarkand-dome cached false); compare yunalesca-win-pm (pre-scene: scene-zanarkand-dome). Seeds in run.json.
- Evidence: critic/rounds/round-23/evidence/yunalesca-win-r2/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-vegnagun-shuyin-win-r3/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-trema-win-r2/audio-debug.jsonl; critic/rounds/round-23/evidence/braskas-final-aeon-win-r2/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-trema-win-r3/audio-debug.jsonl
- Confidence: medium (the late scene cue is observed 5 times; the victory-jingle lag is inferred from cached false and not measured; low load dependence untested)
- Requirement: CHK-023 (the right cue at the real moment, no silent unintended gap); RUBRIC section 6 audio (phase transitions)
- Where: src/audio/MusicLoader.ts and the board confirm path (suspected, not traced)
- Fix: Warm the chapter's scene and boss cues and its victory cue when the player confirms the chapter on the board (the cue list is the chapter's musicKeys), so the first line and the jingle never wait on a fetch.
- Acceptance: On 20 runs with the chapter chosen by real input, the scene cue is playing at the first line in 20 of 20 and the victory cue is cached before the after-fight sample.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 34. PR-0386 [polish, onboarding] PR-0386 (carried, unrepaired): the board's first card says 'Click its picture to begin' to keyboard and pad players

- Game / chapter: both / board (all)
- Expected: Device-aware copy: 'Press Enter to begin' (keyboard), the pad's confirm glyph, 'Tap its picture' (touch).
- Observed: Auron's board card reads 'Click its picture to begin. The others wait on the board.' in 61 of 63 runs (keyboard and virtual pad); only the touch runs say 'Tap'. The card also covers chapter rows VII to XII and part of the location panel while the footer already says ENTER BEGIN / CROSS BEGIN.
- Repro: Fresh profile, headless Chromium 1600x900, seed 1, press Enter from the title to the board; screenshot 03-card. Pad: same with the virtual pad shim.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/03-card.png; run.json dossier in seymour-flux-win-pad
- Confidence: high (seen in 61 runs)
- Requirement: Onboarding teaches with the device's own controls; CHK-015
- Where: chapter select first-run coach, step 1 of 3
- Fix: Pick the sentence by last input device as the touch build already does; move the coach card clear of the rows.
- Acceptance: dossier text contains no 'Click' under keyboard or pad, and the card box does not intersect the chapter list
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 35. PR-0411 [polish, onboarding] PR-0411 (new; merges R23-ON-01 and the capture owner's pad-B item): party prep and its coach print keyboard words to a pad player, and pad B on the first party prep leaves the screen while keyboard Esc only skips the guide

- Game / chapter: both (confirmed in Ch I) / party prep
- Expected: Prep hint strip and coach name the pad's buttons; one button skips the guide or the label says what B does.
- Observed: With the virtual pad, party prep prints 'ENTER BEGINS THE BATTLE', 'ESC BACK' and the coach 'ESC SKIP THE GUIDE', while the board footer ('CROSS BEGIN', 'CIRCLE BACK'), pre-scene hints ('HOLD CROSS SKIP') and the battle HUD are pad-aware. B on prep goes straight back to the board and does not skip the guide, although the coach says Esc skips it (keyboard Esc skips the coach and stays on prep). Fresh profile, Ch I party prep, the footer reads 'ESC SKIP THE GUIDE'. Keyboard Esc stays on party-prep (the first Esc skips the guide, the second goes back). Pad B (button 1) goes straight back to chapter-select and a second B goes to the title. A pad player has no way to skip the guide.
- Repro: Virtual pad, fresh profile, Cross from the title to the board, Cross on the Ch I card, screenshot party prep; press B.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win-pad/04-prep.png; critic/rounds/round-23/scratch/prepesc-pad.png; index.json entry 'CHK-015 party prep B on the virtual pad: goes back to chapter-select (no coach skip)'; critic/rounds/round-23/scratch/prepesc-keyboard.png, prepesc-pad.png
- Confidence: high
- Requirement: CHK-015, CHK-020, onboarding device usability
- Where: party prep hint strip and coach card
- Fix: Reuse the pad glyph table the board footer already uses for the prep hint strip and the coach footer; decide whether B skips the guide or goes back and label it.
- Acceptance: with a pad shim, the prep screen text contains no ENTER or ESC and the coach names a pad button
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 36. PR-0356 [polish, interface] PR-0356 (carried, re-measured): pause section headers, the 'H PAINTING ONLY' hint and the title tagline are low contrast

- Game / chapter: both / pause, title
- Expected: At least 3 : 1 against the darkest and lightest part of the plate behind the label.
- Observed: Sampled from rendered pixels: pause headers BATTLE STATS 2.3 : 1, IN THIS FIGHT 2.5 : 1, THIS ENCOUNTER 2.5 : 1, SETTINGS 2.3 : 1, the ECHOES OF SPIRA header 1.9 : 1, 'H PAINTING ONLY' 2.7 : 1, the title's vertical 'FINAL FANTASY X AND X-2' about 1.9 : 1 (approximate: 98th percentile text against median background).
- Repro: Esc from the first menu in Ch I at 1600x900; sample pause-open.png.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-pausekeys/pause-open.png; critic/rounds/round-23/evidence/seymour-flux-win/00-title.png
- Confidence: medium (pixel sampling, not a DOM colour read)
- Requirement: CHK-003, RUBRIC section 5 effective contrast
- Where: pause tab content labels and hint
- Fix: Lift the section-label and hint tokens to a 3:1 floor against a worst-case plate region.
- Acceptance: sampled contrast of each label at least 3.0 over 3 plates
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 37. PR-0387 [polish, interface] PR-0387 (carried): the cleared-tile best-time ribbon on the board is clipped

- Game / chapter: both / board
- Expected: The whole time is readable.
- Observed: On a cleared row the small rotated ribbon reads '8:11' cut at the row's right edge; r22 saw '8:0' and '5:4'.
- Repro: Win Ch I, return to the board, screenshot 34-board-after.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/34-board-after.png
- Confidence: high
- Requirement: CHK-009
- Where: chapter list row ribbon
- Fix: Re-seat the ribbon text so its right edge clears the clip.
- Acceptance: ribbon scrollWidth <= clientWidth for 9:59 at 1280 and 3840
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 38. PR-0354 [polish, interface] PR-0354 (carried): the intent card says 'Deals no damage' above damage rows

- Game / chapter: FFX / Ch IX, XII
- Expected: No 'Deals no damage' line when the ability has damage rows, or the rows are labelled as the spell's effect.
- Observed: Ch IX Yojimbo (Daigoro) and Ch XII Omnis (Mortiphasm Spells) show 'Deals no damage.' followed by a DAMAGE table (Lulu 544-615, Tidus 2,066-2,333); 5 of 5 runs.
- Repro: Ch IX or XII first menu, press E; read intentText.
- Evidence: critic/rounds/round-23/evidence/yojimbo-cavern-win/run.json; critic/rounds/round-23/evidence/seymour-omnis-win/run.json
- Confidence: high
- Requirement: honest enemy intent
- Where: enemy intent card
- Fix: Suppress the line when damage rows exist (suspected: describeAbility in src/battle/ffx/intent.ts, untraced).
- Acceptance: no intent text contains both 'Deals no damage' and a damage row in any chapter
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 39. PR-0372 [polish, interface] PR-0372 / PR-0321 (carried, re-observed): phone pause OPTIONS clips its tabs and shows 4 of 10 settings, text under 14 px

- Game / chapter: both / Ch IV (and the same pause in Ch I)
- Expected: Tabs fit or scroll visibly; accessibility settings reachable without hunting.
- Observed: At 390x844 (Ch IV) the tab strip is cut at both edges ('ER GUIDE OPTIONS CONTROLS'), the 'ECHOES OF SPIRA - FINAL FANTASY X-2' header wraps over the tabs, and the SETTINGS list is a short scroll box showing MASTER VOLUME to a half-cut TEXT SPEED with no scroll cue. Gap pass with real touch events in Ch IV: the list scrolls (scrollTop 65, 130, 153) and TEXT SIZE and REDUCE MOTION come into view; tapping TEXT SIZE cycles 100 to 115 percent; the window is 100 px of 217 to 253 px, about four rows.
- Repro: 390x844 touch emulation, FFX-2 Ch IV, open pause, Options tab.
- Evidence: critic/rounds/round-23/evidence/ffx2-bahamut-win-touch/14-pause-options.png
- Confidence: high (emulation, no real phone)
- Requirement: CHK-003, onboarding device usability
- Where: pause OPTIONS on a phone
- Fix: Show a scroll affordance, move TEXT SIZE and REDUCE MOTION first on the phone, wrap or scroll the tab strip.
- Acceptance: at 390x844 every tab label is whole and all settings reachable by touch scroll with a visible cue
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 40. PR-0321 [polish, interface] PR-0321 (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor

- Game / chapter: both / any (pause > OPTIONS > EYE CANDY) at 390x844
- Expected: CHK-003: no player text under 14 css px at 390x844.
- Observed: 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
- Repro: 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
- Evidence: critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
- Confidence: high
- Requirement: CHK-003
- Where: src/ui/common/pause-screen.css:824-825 (--pu-fs:12px; --pu-fs-v:13px, an authored phone exception)
- Fix: Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
- Acceptance: ecfont at 390x844 in both games: under14 empty, no clipping.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: The new page inherits the pre-existing phone pause floor; the capture owner filed it as minor/new, the interface auditor as a pre-existing exception. One issue.

### 41. PR-0412 [polish, interface] PR-0412 (new, FFX-2 only; R23-IF-01): the intent card stands over the enemies' upper bodies at the target step and over the Garment Grid in Ch VI at 1280x720 and 1600x900

- Game / chapter: FFX-2 / Ch VI Leblanc
- Expected: The card never covers a targetable enemy at the target step.
- Observed: At 1280x720 and 1600x900 the Fem-Goon intent card's lower edge covers Dr. Goon and Fem-Goon's upper bodies while the reticle is on them (and the 'ODDS' header and 'J HOLD' strip sit on a figure); at 2560x1080 it moves to the left and is clear.
- Repro: FFX-2 Ch VI, seed 1, first command menu, E, choose Attack; or open Change.
- Evidence: critic/rounds/round-23/evidence/ffx2-leblanc-win/16-target-single.png; ffx2-leblanc-win-1280/16-target-single.png; ffx2-leblanc-win/21-change-open.png
- Confidence: medium-high
- Requirement: CHK-008, PR-0249 family
- Where: intent card placement while targeting
- Fix: Add the enemy quads to the intent card's placement test while targeting (as PR-0249 suggested for the party).
- Acceptance: card box does not intersect any enemy quad at 1280, 1600, 2560 in Ch VI target and Change states
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 42. PR-0413 [polish, interface] PR-0413 (new, FFX-2 only, 21:9; R23-IF-02): the CHAIN counter lies over the advisor card at 2560x1080 at the target step in Ch VI

- Game / chapter: FFX-2 / Ch VI
- Expected: The chain counter and the card do not overlap.
- Observed: The 'CHAIN x1.45' box lies over the left half of the NEXT BEST MOVE card; only fragments ('N', 'G', 'LLS NO MP 100% TO HIT 3% CRIT') remain readable.
- Repro: FFX-2 Ch VI at 2560x1080, first menu, Attack, read the target step.
- Evidence: critic/rounds/round-23/evidence/ffx2-leblanc-win-2560/16-target-single.png
- Confidence: high for that state
- Requirement: CHK-008
- Where: chain counter versus advisor at ultrawide
- Fix: Anchor the advisor card to the counter's right edge, or the counter below the card, at wide aspect ratios.
- Acceptance: panel boxes disjoint at 2560x1080 in the chain-counter state
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 43. PR-0414 [polish, interface] PR-0414 (new, FFX-2 only, medium confidence; R23-IF-03): Ch VI mid-fight shows the guide's chips with no guide sheet at three sizes

- Game / chapter: FFX-2 (Ch IV midfight shows the sheet) / Ch VI
- Expected: Chips only when a sheet is shown; or the sheet stays.
- Observed: In 23-midfight at 1280, 1600 and 2560 the 'G HIDE GUIDE' and '[ ] SCROLL' chips are drawn but the guide sheet under them is absent (the sheet is present in the first-menu and seam captures of the same chapter).
- Repro: FFX-2 Ch VI, play three real commands, screenshot.
- Evidence: critic/rounds/round-23/evidence/ffx2-leblanc-win/23-midfight.png; ffx2-leblanc-win-1280/23-midfight.png; ffx2-leblanc-win-2560/23-midfight.png
- Confidence: medium (may be a fade state; three sizes agree)
- Requirement: CHK-006 overlay lifetime
- Where: strategy guide mid-fight
- Fix: Hide the chips with the sheet, or find why the sheet is dropped at this link.
- Acceptance: no chip is visible without its sheet in any state
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 44. PR-0330 [polish, interface] PR-0330 (carried, mostly repaired; residual widened by the capture owner): some advisor cards carry no or a one-word effect (Ch XVII "Close in", Ch VII Steal), and at 1280x720 in Ch I the advisor effect line and the guide are cut mid-line

- Game / chapter: FFX / Ch VII, XVII
- Expected: A one-line effect for every suggestion.
- Observed: Ch XVII 'Close in' shows only name, 'IN ORDERS' and 'NO MP' with no effect sentence; Ch VII 'Steal' shows the effect line 'Steal'. Ellipsis is gone in Ch VII, XII and XVIII (repaired). Capture owner, Ch I first menu at 1280x720: the advisor card ends at "Speeds the party's turns up" with the effect line gone and the guide text cut after four lines; at 2560x1080 both show a further line. PR-0385 (the guide's scroll chip) is repaired and live-seen.
- Repro: Ch XVII and Ch VII first menu at 1600x900.
- Evidence: critic/rounds/round-23/evidence/sin-fins-core-win/11-advisor.png; seymour-anima-macalania-win/11-advisor.png; critic/rounds/round-23/evidence/seymour-flux-win-1280/11-advisor.png
- Confidence: high
- Requirement: advisor says what the move does
- Where: advisor card effect line
- Fix: Author short effect lines for Orders and Steal.
- Acceptance: every captured advisor card has an effect line
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 45. PR-0370 [polish, onboarding] PR-0370 (carried): a story box covers the guide and the first-run tip at the first menu in Ch XI and others

- Game / chapter: FFX-2 / Ch XI, XIII, XIV, XV
- Expected: The tip or box is deferred, not lost, and nothing covers the guide.
- Observed: In Ch XI a dialogue box covers the guide header at the first menu; the first-run tip was absent in Ch XI, XIII, XIV and XV primary runs.
- Repro: Fresh profile, Ch XI, first menu.
- Evidence: critic/rounds/round-23/evidence/ffx2-fallen-aeons-win/10-first-menu-coach.png
- Confidence: medium
- Requirement: onboarding reaches every first-time player
- Where: first menu
- Fix: Hold the menu until the dialogue ends or move the box clear; show the tip afterwards.
- Acceptance: tip visible within one turn on every chapter
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 46. PR-0252 [polish, interface] PR-0252 (carried, seen on a pad): the first-turn coach covers the command stack and two party figures

- Game / chapter: FFX / Ch I
- Expected: Coach clear of the commands and the party.
- Observed: Ch I pad run: the coach overlaps the commands by 3,384 px and hides Yuna and Kimahri; the keyboard coach sits lower and does not.
- Repro: Virtual pad, Ch I first menu.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win-pad/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-008
- Where: first-turn coach, pad layout
- Fix: Add the command stack to coachActorAvoid for the pad layout.
- Acceptance: overlaps [] in focFirst for the pad run
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false

### 47. PR-0415 [polish, harness] PR-0415 (critic tooling, new; R23-HX-01): the Ch I 2000x1012 first-menu capture is asserted awaitingMenu but shows the hero cut-in transition, so that cell is not read as a layout

- Game / chapter: FFX / Ch I
- Expected: The capture waits for the cut-in to finish.
- Observed: seymour-flux-win-2000/10-first-menu-coach.png is asserted awaitingMenu=true but shows Tidus's close-in cut-in over the HUD, so no 2000x1012 Ch I first-menu layout was read.
- Repro: Route at 2000x1012, Ch I.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win-2000/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-016
- Where: critic/runner/lib/route.mjs snap
- Fix: Wait for no cut-in layer before shooting.
- Acceptance: no capture shows a cut-in overlay
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 48. PR-0416 [polish, interface] PR-0416 (new, FFX only): at 2560x1440 the five element chips of the Mortibody card (FIRE, ICE, THUNDER, WATER, HOLY) overlap and GRAV wraps; at 2560x1080 the card is clean

- Game / chapter: FFX only / Ch X
- Expected: Chips readable without overlap
- Observed: In the Ch X first menu at 2560x1440 the five element chips FIRE, ICE, THUNDER, WATER and HOLY overlap each other and GRAV wraps to a second row. DOM read: every chip box is 61 px wide, so THUNDER (about 80 px) overflows into the next chip. At 2560x1080 the same card lays out cleanly.
- Repro: Live, seed 1, PYREFLY_BROWSER=gpu, 2560x1440: seymour-natus win route to the first menu, with the Mortibody card up. Persisted over 3 s.
- Evidence: critic/rounds/round-23/evidence/gaps/seymour-natus-win-hires-2560x1440/10-first-menu-coach.png, crop-mortibody-card.png, chips-2560x1440 run
- Confidence: high (DOM and image)
- Where: ffx-sensor__chips
- Fix: Let chips size to their content (auto width with a gap) in .ffx-sensor__chips at 16:9 1440p.
- Acceptance: Repeat at 2560x1440 and 2560x1080: no chip text intersects another.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 49. PR-0389 [polish, interface] PR-0389 (R39F-08, reused): at TEXT SIZE 115 and 130 the in-battle guide disappears in FFX-2 Ch IV and VI and G does nothing

- Game / chapter: FFX-2 / IV, VI
- Expected: A designed give-way tells the player where the guide went.
- Observed: Reused: the guide panel is 0x0 at 115 and 130 percent in Ch IV and VI, and G toggles a flag with nothing shown; the pause GUIDE tab still shows the page. Round 23 gap pass: TEXT SIZE 115 renders cleanly in Ch I and Ch IV and 130 in Ch I; at 130 in FFX-2 Ch IV the enemy-move card truncates names (YU..., RIKK...), wraps damage ranges and shows two of three girls (+2 MORE). The guide at 115 and 130 was shot but its overflow numbers were scroll-area false positives, so whether the guide still vanishes (the round 22 finding) is not re-established.
- Repro: Pause, OPTIONS, TEXT SIZE 130, back to the first menu, press G.
- Evidence: critic/reviews/c7135bec-focused/results/textsize-ffx2-bahamut-1600x900-130-pause.json (reused)
- Confidence: medium (reused evidence)
- Requirement: CHK-003, CHK-015
- Where: src/ui/common/StrategyGuide.ts (sgd--squeezed)
- Fix: Show a one-line 'GUIDE: pause menu' chip while the sheet is squeezed.
- Acceptance: At TEXT SIZE 115 and 130 in Ch IV and VI, G shows the guide or a chip that says where it went.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried; one new facet seen (enemy-move card at TEXT SIZE 130), the guide facet unresolved

### 50. PR-0363 [polish, interface] PR-0363 (new; R21-IF-04 + R21-FEEL-02, emulated pad only): a pad's Circle that resumes from the pause also cancels the menu level or the target cursor underneath, where keyboard P keeps both

- Game / chapter: both (pad Circle; FFX Ch I and FFX-2 Ch IV)
- Expected: Resume restores the exact state, as the keyboard does.
- Observed: Pause matrices: pad Circle resume from a Special submenu returns to the top row (rows 4 to 6) and from targeting returns with targets 0; keyboard P keeps both (rows 4, targets 2). FFX-2 pad White Magic: rows 7 to 3. Merged with R21-FEEL-02: FFX Flux pad matrix row 10, pause opened with Start while targeting (targets 2); Circle resumes with targets 0, where keyboard P resumes with targets 2. FFX-2 pad White Magic: rows 7 to 3. Emulated standard-mapping pad, not real hardware; one run each (the FFX matrix was shifted by PR-0362).
- Repro: seymour-flux-pausematrix-1600x900-pad cases 8, 10; ffx2-bahamut-pausematrix-1600x900-pad case 8.
- Evidence: critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900-pad/run.json; critic/rounds/round-21/evidence/ffx2-bahamut-pausematrix-1600x900-pad/run.json
- Confidence: medium-low
- Requirement: CHK-015, CHK-006
- Fix: Consume the Circle edge in the pause handler so the menu does not also see it.
- Acceptance: Pad matrix: after resume rows and targets equal their pre-pause values.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried, UNVERIFIED (nothing this round exercises the pad Circle resume)

### 51. PR-0251 [polish, interface] PR-0251 (carried, narrowed): battle labels keep the 14 px floor at 1600x900 (advisor 14.2 px minimum), but the strategy guide's labels draw at 11.4 px at 1280x720 and 9.1 px at 1024x768 (R39F-05, reused)

- Game / chapter: both
- Expected: 14 px floor on desktop.
- Observed: 1600x900: FFX 12.25 px (OD, Overdrive, key labels), colour-order note 12 px; FFX-2 command-info label 11.68 px, max-HP/MP numbers 12.5 px; dialogue role chip 8.51 px. 2000x1012: 13.77 px (FFX), 13.13 px (FFX-2). 1440x900: 11.03 px; 1024x768: 7.84 px with 27 distinct elements under 14. 2560 and 4K pass (14 px).
- Repro: textSweep fields of the first-menu runs.
- Evidence: critic/rounds/round-21/audit-if1.tmp.mjs output; evidence/seymour-flux-first-1024x768/run.json
- Confidence: high
- Requirement: CHK-003
- Fix: Raise the HUD key labels and label classes to a floor in CSS.
- Acceptance: textSweep minEffPx >= 14 at 1600x900 and 2000x1012.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried, UNVERIFIED (the guide label size below 1600 wide was not measured)

### 52. PR-0259 [polish, delivery] PR-0259 (carried, sixth review, widened; merges R23-PD-04 and keeps PR-0394 and PR-0404): load time is unmeasured and a session requests 62 to 231 MiB at 1600x900 (median 138; round 22 median 119) and 337 MiB at 2560x1080 Ch X; the CHK-017 five-second clause stays UNVERIFIED

- Game / chapter: both / all; measured at the board and in ch I, IV, V, III, X
- Expected: A measured load under five seconds on named hardware, network and cache conditions (RUBRIC section 2).
- Observed: No cold-cache, throttled, weaker-GPU, non-Chromium or phone timing was captured, so first load under five seconds is UNVERIFIED for the sixth review. Per-session media from the manifest sizes: 62 to 231 MiB (median 138; round 22 median 119), Braska 171 to 231 MiB, Natus at 2560x1080 337 MiB with two 14 MB 2x backdrops; the same 2560 run of Flux requested 183 MiB, so the 2x backdrops depend on the browser's link estimate (PR-0404). Round 22's slow-4G arrival (8.3 s to ready, 14 to 24 s to the board, a 36 s reload in 3 of 4 runs) is not re-measured. Over HTTP from this machine: index.html 3.5 KB, bundle 1.1 MB br, key art 0.75 MB, title music 2.9 MB each in 0.2 to 0.6 s.
- Repro: Playwright from node, PYREFLY_BROWSER=gpu, fresh context, cold cache, load https://echoesofspira.com/ unthrottled and with Fast and Slow 4G emulation, 3 runs each; record DOMContentLoaded, the first interactive title and the board.
- Evidence: critic/rounds/round-23/evidence/*/network-media.json summed against critic/artifacts/d3fe9fe5.json; no timing file exists
- Confidence: high that the measurement is missing; sizes are exact, effect on a real player unmeasured
- Requirement: CHK-017 five-second clause; RUBRIC section 2
- Fix: Run the capture above on the live build and record the numbers; the smallest code step, if the title proves slow, is PR-0405's pre-input fetches (58 art files in round 22).
- Acceptance: Cold-cache first load to an interactive title under 5 s unthrottled, the board under 15 s on Fast 4G, and a reload at the board no longer than the first load.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 53. PR-0394 [polish, delivery] PR-0394 (new, low confidence): on emulated slow 4G a reload at the board took 36 s to DOMContentLoaded in 3 of 4 runs (first load 8.3 s); the first Enter stays on the title at least 3.6 s

- Game / chapter: both
- Observed: Reload after reaching the board under 1.6 Mbit/s took 36 s in 3 of 4 runs against 8.3 s for the first load; 8-9 requests were pending when it started. Cause not established.
- Repro: critic/rounds/round-22/scratch/arrival.mjs 4
- Confidence: low
- Requirement: CHK-017 load clause; RUBRIC 2 platform goals (load under five seconds)
- Where: evidence/gaps/arrival/arrival.json
- Fix: Establish whether background preloads starve the reload; defer them on slow links.
- Acceptance: reload on throttled network no slower than the first load
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 54. PR-0404 [polish, delivery] PR-0404 (R39F-07, carried from the focused review, not re-measured): the 2x backdrop masters depend on the browser's link estimate; below 10 Mbps six un-held backdrops stay 1x

- Game / chapter: both / all
- Expected: The art tier follows the window and GPU as the changelog says, or the link rule is stated.
- Observed: Recorded by critic/reviews/c7135bec-focused.json; this round saw 2x masters requested at 2000x1012 and 2560x1440 and 3x at 3840x2160 on this machine's link, and did not test a slow link for art tier.
- Repro: As in the focused review.
- Evidence: critic/reviews/c7135bec-focused.json; critic/rounds/round-22/evidence/gaps/seymour-flux-win-hires-2560x1440/network-media.json
- Confidence: medium
- Requirement: CHK-013; release 39 claim
- Fix: State the link rule in the changelog or drop it for held backdrops.
- Acceptance: At 2560x1440 with a throttled link the documented tier loads.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 55. PR-0295 [polish, prep] PR-0295 (carried, not re-captured; fifth round the prep tabs are unproved by input): at 390x844 the heavy prep tabs showed the 640x360 desktop board letterboxed in round 22; no tab but CHAPTER was opened this round at any size

- Game / chapter: both (FFX tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; FFX-2 DRESSPHERES, STATS, ACCESSORIES) / party prep, all chapters; phone
- Expected: A prep choice reachable by input that changes the fight with a sourced consequence, on desktop and phone.
- Observed: The 04-prep captures in all 63 capture runs are the CHAPTER tab at 1600x900, 1280x720, 2000x1012, 2560x1080 and 390x844; no tab key or click opened another tab. At 390x844 (ffx2-bahamut-win-touch/04-prep.png) the CHAPTER tab fits and Auron's guide card overlaps the objectives list.
- Repro: Real keys or taps: chapter select, chapter, party prep, press the tab keys through every tab and change a value.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/04-prep.png, ffx2-bahamut-win-touch/04-prep.png; round 22 PR-0295
- Confidence: medium (not re-captured)
- Requirement: RUBRIC section 6 prep agency; CHK-015
- Fix: Capture every prep tab by input at 1600x900 and 390x844 once, with one changed value reflected in the first battle menu.
- Acceptance: A run that opens each tab, changes a value and shows it in the fight, at both sizes.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 56. PR-0352 [polish, prep] PR-0352 (carried, unchanged): Natus ships no item drop although the research sources a Lv. 2 Key Sphere x2

- Game / chapter: FFX only / seymour-natus (X)
- Expected: The sourced drop shown on the results panel (AGENTS.md hard rule 6: numbers come from research with their source notes).
- Observed: The Natus victory panel has AP 6,300 and GIL 3,500 and no ITEMS row in all four runs; src/data/ffx/enemies/seymour-natus.ts line 126 sets drops: [] with the comment 'sourced but has no item record'.
- Repro: Real-key win of Ch X, read the results panel.
- Evidence: critic/rounds/round-23/evidence/seymour-natus-win/31-results.png; src/data/ffx/enemies/seymour-natus.ts
- Confidence: high
- Requirement: Sourced rewards (RUBRIC section 6 prep)
- Fix: Give the Key Sphere an item record and list it in drops with its source, or state in the file why it is left out.
- Acceptance: The Natus panel shows the Lv. 2 Key Sphere with the sourced quantity.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 57. PR-0383 [polish, combat] PR-0383 (new, FFX only): the new DEFEND tab, and the engine row behind it, is offered on a summoned aeon's turn

- Game / chapter: FFX / any FFX chapter with a summon (seen in Ch II)
- Expected: An aeon's menu in FFX uses Shield and Boost; no source read here gives aeons a Defend command. Not checked against the Steam HD copy.
- Observed: Live (gap pass): in Ch II, Yuna Summon > Valefor by real keys; on Valefor's turn the rows are Attack / Aeon / Dismiss and the "Q triangle DEFEND" tab is at the bottom left. Engine probe: Valefor's list holds Defend (enabled) and submitting it adds the defend status. research/ffx-combat-core.md line 1118 and ffx-seymour-flux.md line 867 list Defend among the statuses aeons are immune to. Not checked in the Steam HD copy.
- Repro: tests: critic/rounds/round-22/combat/aeon-defend.test.ts (summon Valefor in the Yunalesca chapter, list d.commands at the aeon's turn); in game, summon an aeon and look at the bottom-left tab
- Evidence: critic/rounds/round-22/evidence/gaps/yunalesca-aeon/40-aeon-menu-0.png; critic/rounds/round-22/combat/aeon-defend.json
- Confidence: medium (engine behaviour proved; the original game's aeon menu not verified)
- Requirement: AGENTS rule 6 (never invent game data), CHK-021
- Where: src/ui/ffx/defendControl.ts defendCommandOf; src/ui/ffx/CommandMenu.ts:268
- Fix: Hide the tab and the engine row for aeon actors, or confirm in the Steam HD copy that aeons can Defend and say so in research.
- Acceptance: On an aeon's turn the command list has no enabled defend row and the tab is absent; a character's turn still shows it
- Ship tags: introducedByCandidate true, regressionVsLive true, inNewFeature true
- Note: The tab is new in release 39; release 38 hid the row. Polish: a legal-looking extra command, no wrong result shown.

### 58. PR-0388 [polish, interface] PR-0388 (new): guide copy tells the player to reload a save and level up, which this chapter-based game has no screen for

- Game / chapter: both / V (FFX-2), IX and I (FFX)
- Expected: Guide copy is meaningful in this game's flow (labelled adaptations).
- Observed: FFX-2 Ch V Vegnagun Tail guide: 'If its attacks are too much for you to survive, reload an earlier save and level up a little first.' (the game is chapter-based with retry; there is no save to reload and no levelling between fights). FFX Ch IX Yojimbo guide: 'In the next area an unsent summoner, Lady Ginnem, waits...' and Ch I prep text 'Get ready before the next area' read as walkthrough prose. These are adapted from the Jegged guides (standing rule 2026-10-03).
- Repro: Chapter V first menu, read the top-left guide.
- Evidence: critic/rounds/round-22/evidence/ffx2-vegnagun-shuyin-win/12-intent-E.png; src/data/guides/docs/ffx2-vegnagun-shuyin.ts:36; src/data/guides/docs/seymour-flux.ts:19
- Confidence: high
- Requirement: CHK-007 (player-facing copy fits the game); docs: guide follows Jegged in our words, adaptations labelled
- Where: src/data/guides/docs/ffx2-vegnagun-shuyin.ts:36
- Fix: Replace those sentences with the game's own equivalent ('lose and retry, or revisit Party Prep') or drop them.
- Acceptance: No guide sentence tells the player to reload a save, level up or walk to a next area.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 59. PR-0391 [polish, interface] PR-0391 (new, 4K): at 3840x2160 the enemy affinity row's labels run into each other and the coach mark and PAUSE label draw much smaller than the menu

- Game / chapter: FFX / X (seen); other chapters not checked at 4K
- Observed: At 3840x2160 in Ch X (first menu) the Mortibody panel's affinity row prints overlapping labels (FIR/THU/WAT/HOLY/GRAV run into each other) and the Auron coach mark and PAUSE label render at a much smaller size than the command menu and party plates.
- Repro: PYREFLY_BROWSER=gpu, route seymour-natus, size 3840x2160, seed 1, look at 10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-009, CHK-003 at 4K (RUBRIC 5 deep size rotation)
- Where: evidence/gaps/seymour-natus-win-hires-3840x2160/10-first-menu-coach.png
- Fix: Scale the enemy affinity row and coach mark with the same HUD scale as the command menu, or cap the row to fit its panel at large viewports.
- Acceptance: 4K first menu shows non-overlapping affinity labels and coach text of comparable size to the menu
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 60. PR-0392 [polish, interface] PR-0392 (new, FFX-2): a Phoenix Down's target cursor opens on a living ally, so Enter on the default wastes it; the revive itself was not read back

- Game / chapter: FFX-2 / VI
- Observed: With Paine KO'd in Ch VI, choosing Phoenix Down puts the cursor on Yuna (alive); Paine needs two Right presses; Enter on the default would waste the item.
- Repro: Ch VI, seed 1, real keys: Rikku Item > Phoenix Down while Paine is KO'd; evidence/gaps/ffx2-leblanc-pd3/52-phoenix-target.png and leblanc-log.json (pd-trail yuna, rikku, paine)
- Confidence: medium
- Requirement: CHK-004 (advice reachable and executed), CHK-015
- Where: FFX-2 item target step
- Fix: Default a revive item's cursor to the first KO'd ally when one exists (check against the FFX-2 source before changing).
- Acceptance: cursor opens on the KO'd ally
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: Esc out of the White Magic submenu and Item are reachable by real keys (gap pass), so the Ch VI 12-minute stall of the capture run was the route, not the game (see PR-0348). What the original FFX-2 does with a revive cursor was not checked against a source.

### 61. PR-0393 [polish, interface] PR-0393 (new, FFX-2): at the target step the reticle ovals draw over the command list and the enemy-move text

- Game / chapter: FFX-2 / V, XVI
- Observed: In the Vegnagun Tail and Ixion target steps the pink reticle ovals draw over the command list and the enemy-move panel text.
- Repro: Ch V Yuna as Lady Luck, Skill > Attack Reels target step; evidence/gaps/ffx2-vegnagun-shuyin-luck/30-reel-attack-reels-a.png
- Confidence: medium
- Requirement: CHK-008, CHK-010
- Where: FFX-2 target step
- Fix: Dim or hide the command list during the target step, or draw the reticles under the HUD.
- Acceptance: labels readable during the target step
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 62. PR-0397 [polish, harness] PR-0397 (critic tooling, new): the route's target matcher resolves "Yuna" to "Yunalesca" and "Potion" to "Al Bhed Potion", which cost the Ch II run

- Game / chapter: both / II, VIII
- Expected: The matcher uses exact labels, so the evidence shows the advice executed or flags a mismatch.
- Observed: Ch II Yunalesca: the advice 'Phoenix Down -> Yuna' was confirmed on 'yunalesca' with mismatch:false for turns 95 to 112 (engineDid targets [yunalesca], her HP unchanged at 41,735), so Yuna stayed at 0/2450 and the route ended in a defeat at 10:28. Ch VIII Evrae turns 62, 64, 67: advice 'Potion' pressed 'Al Bhed Potion'. Four runs read Summon rows as took:null although the engine summoned.
- Repro: critic/rounds/round-22/evidence/yunalesca-win/run.json picks 95-112; evrae-airship-win picks 62, 64, 67.
- Evidence: critic/rounds/round-22/evidence/yunalesca-win/run.json
- Confidence: high
- Requirement: RUBRIC 5 (separate harness failures from product failures)
- Where: critic/runner/lib/route-fight.mjs (suspected)
- Fix: Match on the whole label, case-insensitively, before any substring.
- Acceptance: A rerun of Ch II seed 1 throws its Phoenix Downs at Yuna.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 63. PR-0398 [polish, harness] PR-0398 (critic tooling, new): a continuity retry overwrites the whole review's continuity-summary.json (the chief recovered the 17-chapter aggregate from run.log into continuity-summary-r22-17ch.json)

- Game / chapter: both / all
- Expected: One summary of the 17 measured chapters, as validateReport requires for the report's continuity field.
- Observed: critic/rounds/round-22/continuity/continuity-summary.json has 0 s of battle and UNVERIFIED for both checks (the r22b Ixion rerun overwrote it); the aggregate exists in the task brief and in each chapter's continuity.json.
- Repro: Open the file.
- Evidence: critic/rounds/round-22/continuity/continuity-summary.json; critic/rounds/round-22/continuity/continuity-summary-r22-17ch.json; critic/rounds/round-22/continuity/run.log
- Confidence: high
- Requirement: RUBRIC 6a: deep report carries the harness aggregate
- Fix: Merge the 17 per-chapter files into one summary before the report is validated; I checked the sums (head over 1688, feet over 1749).
- Acceptance: critic-clear accepts the report.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 64. PR-0334 [polish, feel] PR-0334 (confirmed, was low confidence): the twirl start draws a hard-edged white rectangle over the changing girl in every dressphere change

- Game / chapter: FFX-2 only / Ch V, VI, XI, XV
- Expected: A soft twirl-in (the ribbon aura seen in the close-up) with no block shape.
- Observed: A white slab about 60 by 110 px at 1600x900 sits over the girl for 150 to 450 ms (300 to 600 ms in Den of Woe) at the start of the twirl in 7 of 7 captured changes (Leblanc 1,500 ms; Vegnagun 1,350-1,650 ms; Fallen Aeons 1,350-1,500 ms and 1,500-1,800 ms; Den 1,800-2,100 ms and 1,500 ms; Vegnagun #2 1,500-1,800 ms), before the dress swaps. Merged with the visual auditor's re-observation (four chapters: Leblanc Paine Warrior to Songstress, Den of Woe Yuna White to Black Mage, Trema Paine Dark Knight to Songstress, Vegnagun Paine Dark Knight to White Mage; evidence critic/rounds/round-21/vis/leb-pair.jpg, sph-ffx2-den-of-woe-win.jpg, sph-ffx2-vegnagun-shuyin-win.jpg, trema-sph.jpg). Confidence is now high (7 of 7 clipped changes); it persists after the 119 new paintings and the 25 held 2x masters; the correction is in the key's alpha edge, never a repaint of approved art.
- Repro: Any FFX-2 Garment Grid change at 1600x900, seed 1; frames in critic/rounds/round-21/feel-narr/spheres4.jpg.
- Evidence: critic/rounds/round-21/feel-narr/spheres4.jpg
- Confidence: high
- Requirement: RUBRIC 6 animation and readable effects
- Fix: Suspected: the first key of the twirl set is drawn unmasked or at the wrong alpha box; check the key's alpha edge and ease it in. Visual and animation auditors to cross-check the master.
- Acceptance: Read 7 consecutive changes at 50 ms steps: no flat white rectangle with straight edges at any frame.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Release 39 says the white rectangle at the start of an outfit change is gone; this round did not grade a twirl, so the fix is not verified.

### 65. PR-0314 [polish, feel] PR-0314 (carried, STALLED: open in 19b, 20 and 21): the FFX-2 dressphere shot is absent in 6 of 7 captured changes and the new push-in is not seen in any of them

- Game / chapter: FFX-2 only / Ch V, VI, XI, XV
- Expected: Every dressphere change gets a held close shot or, where none is clean, the push-in (D-346).
- Observed: Seven clipped changes: Vegnagun Paine dark knight to white mage (first change) plays the close-up from 3.15 s to about 4.6 s (1.45 s hold, ribbon aura then the new dress); the other six (Leblanc Paine, Vegnagun Paine #2, Fallen Aeons Paine #1 and #2, Den of Woe Yuna #1 and #2) show the girl's small-frame twirl and nothing else: the framing at the start and end is the same (Leblanc 900 vs 2,700 ms, Fallen Aeons 1,650 vs 2,550 ms), so neither the close-up nor the 1.22x push-in of D-346 plays. In every absent case an enemy turn starts 0.9 to 4.3 s after the change (meta.json events), the likely gate. Round 20: 5 of 10 absent.
- Repro: critic/rounds/round-21/evidence/ffx2-leblanc-win, ffx2-vegnagun-shuyin-win, ffx2-fallen-aeons-win, ffx2-den-of-woe-win clips/spherechange and spherechange-2; read with critic/rounds/round-21/feel-narr/strip.py (seed 1, 1600x900, Active, real keys).
- Evidence: critic/rounds/round-21/feel-narr/spheres4.jpg, veg-sphere.jpg, veg-sphere2.jpg, leb-sphere.jpg, fa-sphere.jpg
- Confidence: medium (clips and meta events; gate not traced)
- Requirement: RUBRIC 6 feel: coherent camera, impactful but readable effects; D-346
- Fix: Per the stalled-area rule, a written method check before a third attempt: log which gate (another actor acting, no clean frame, menu up) refused each shot, then decide whether the push-in may start at the hand-back after the enemy action, or whether an enemy action should queue behind a dressphere shot in Active mode. No Wait-mode change without Bailey.
- Acceptance: In Leblanc, Vegnagun and Fallen Aeons at 1600x900 seed 1, at least 5 of 6 changes show a shot or a measurable camera push for at least 1.4 s, with no enemy action inside it and the command menu closed.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature true
- Note: Release 39 says the close-up on a change now starts with it; not graded this round.

### 66. PR-0301 [polish, feel] PR-0301 (carried, re-observed): FFX-2 chain seams still hand control back later than 2.5 s

- Game / chapter: FFX-2 only / Ch V link 2, Ch VI link 2
- Expected: Control returns in about 0.6-0.75 s as at live 32, or the longer opening is Bailey's choice.
- Observed: Leblanc link 2 and Vegnagun link 2 (seq-seam-2, eight frames from 45 ms to 2,513 ms) show the new arena, the party and a name plate (Logos, Vegnagun at about 1.4 s) but no command menu by 2.51 s. Same as round 20.
- Repro: critic/rounds/round-21/evidence/ffx2-leblanc-win/seq-seam-2 and ffx2-vegnagun-shuyin-win-again/seq-seam-2 (sheet critic/rounds/round-21/feel-narr/seams2.jpg).
- Evidence: critic/rounds/round-21/feel-narr/seams2.jpg
- Confidence: medium
- Requirement: RUBRIC 6: transitions and dead waiting
- Fix: Per the existing ticket: shorten the seam's battle-start moment for FFX-2, or ask Bailey whether the longer opening is intended.
- Acceptance: Seam to menu-up under 1.5 s on Leblanc and Vegnagun.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 67. PR-0364 [polish, visual] PR-0364 (new; V21-VIS-01): in the FFX-2 run-in the camera pans and Yuna is cut off at the left frame edge for about 1 s

- Game / chapter: FFX-2 only / Ch VI (any FFX-2 chapter with a run-in)
- Observed: Leblanc 1600x900, Rikku Thief's Attack run-in at about t=1.5-1.9 s of the attack clip: the shot follows Rikku toward Ormi and Yuna stands half, then almost fully, outside the left edge while the white Paine stays in view.
- Repro: FFX-2 Ch VI Leblanc seed 1, party order Yuna, Rikku, Paine, Rikku Attack on Ormi; extract frames from ffx2-leblanc-win/clips/attack/attack.mp4 at 1.5 s and 1.9 s.
- Evidence: critic/rounds/round-21/vis/leb-att-pair.jpg
- Confidence: medium (one clip, one state; other chapters not checked)
- Requirement: RUBRIC feel: coherent camera; CHK-014
- Where: run-in follow camera (D-354)
- Fix: Clamp the run-in follow so every party member stays inside the frame (or limit the pan to the actor's own span) and check at 1600x900 and 2000x1012.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Release 39 says the camera keeps every girl in the frame on a run-in; not graded this round.

### 68. PR-0344 [polish, visual] PR-0344 (updated): the painted plate wings fill the 21:9 void with no mirrored lantern, but each meets the plate at a hard tilted seam with a bright lantern at the very edge; the r20 "Bahamut reads about 12 percent smaller at 2000x1012" half was not re-measured

- Game / chapter: FFX-2 only / Ch IV, XV
- Observed: Ch IV Bahamut 2560x1080: left and right wing strips cover the former void with no mirrored lantern, but each meets the plate at a vertical, slightly tilted seam with a brighter lantern at the edge. Ch XV was viewed at 2560x1080 with the same two-wing layout. The round-20 text of this id covered the mirrored lantern and a 12 percent smaller Bahamut at 2000x1012 (low-medium confidence). Release 38's painted wings (D-343) removed the mirrored lantern at 2560x1080 (Ch IV and XV); the seam is the remaining defect; the 2000x1012 framing was not captured (CHK-014 reads 1024x768, 2560x1080, 2560x1440 only).
- Repro: FFX-2 Ch IV, 2560x1080 first menu; crop vis/bah-wings.jpg.
- Evidence: critic/rounds/round-21/vis/bah-wings.jpg
- Confidence: high
- Requirement: RUBRIC visual: composition, consistency
- Where: plate wings at 21:9
- Fix: Blend the strip into the plate over 40-80 px (a soft mask) and darken the edge lantern; approved painting unchanged.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Release 39 says the pipe slabs at Bevelle's plate edges in wide windows are gone; 21:9 was not captured this round.

### 69. PR-0365 [polish, visual] PR-0365 (new; V21-VIS-02): Ch XII first menu hides one Mortiphasm disc behind Yuna and Auron (5.8 percent visible at 2560x1440, 4.4 percent at 2000x1012)

- Game / chapter: FFX only / Ch XII Seymour Omnis
- Observed: seymour-omnis first menu, seed 1: the rect-visibility readout for the four discs is 0.558, 0.058, 0.699 and 0.804 at 2560x1440 (0.531, 0.044, 0.709, 0.828 at 2000x1012); the lower-left disc is covered by the two girls' bodies in the frame. The other three discs are visible. The round-20 1600x900 reading of this state was not measured, so whether release 38 changed it is unknown (the capture owner's first-menu frames were retaken with the top row asserted).
- Repro: FFX Ch XII seed 1, open the first menu, read run.json rects or the crop vis/omnis-discs.jpg.
- Evidence: critic/rounds/round-21/evidence/seymour-omnis-first-2560x1440/run.json; critic/rounds/round-21/vis/omnis-discs.jpg
- Confidence: high for the frame; unknown whether new
- Requirement: CHK-011 no targetable enemy more than about 25 percent occluded in the default framing
- Where: first command menu
- Fix: Offset the disc formation or stage the party so no disc is under 75 percent visible (the round-20 reading at 1600x900 was not measured, so whether release 38 changed it is unknown).
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: See PR-0382: the Ch XII party heap stands in front of the discs.

### 70. PR-0310 [polish, visual] PR-0310 (carried, narrowed): Braska's Final Aeon now stands clear of the party with both Yu Pagodas visible; with Yuna first her staff keeps a sliver of overlap with the aeon through the menu (R39F-10)

- Game / chapter: FFX only / Ch III Braska's Final Aeon
- Observed: Ch II: Yunalesca stands clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012. Ch VIII: Rikku stands beside the coil without overlap in every window shape. Ch III (staging switched off by decision): Auron stands in front of the Yu Pagoda base and the party's weapons reach the boss's sword. Downgrade reason: release 38 restaged Ch II (Yunalesca clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012) and Ch VIII (Rikku beside the coil with no overlap at 2560x1440, 2560x1080, 1440x900 and 1024x768); the Ch III table is written and switched off by Bailey's pick (CHAPTER_III_STAGED = false), so what remains is a known and chosen state at polish severity.
- Repro: FFX Ch III first menu, seed 1, 2560x1440 (braskas-final-aeon-first-2560x1440/11-first-menu-clean.png).
- Evidence: critic/rounds/round-21/vis/yuna-gap.jpg; vis/braska-gap.jpg
- Confidence: high
- Requirement: CHK-014 / ground contact and scale
- Where: first menu
- Fix: Enable the written Chapter III table (CHAPTER_III_STAGED) when Bailey picks the 'another way' round; nothing to do for II and VIII.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 71. PR-0308 [polish, combat] PR-0308 (carried, narrowed): the Swordplay tiers now differ and carry Bailey's adoption of the estimates (D-413, verified live for Spiral Cut, jsdom for the other three); open: the Bushido button order is still our estimate

- Game / chapter: FFX / Ch II, XII, XVII, XVIII (Auron's Bushido, Tidus's Swordplay)
- Expected: The sourced ordering of Swordplay difficulty across tiers, and a sourced order for every Bushido button.
- Observed: FIXED: each Bushido now plays its own sourced length and order (Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6; the 7-chip default is gone), typed by real keys in six live runs. STILL OPEN: (1) all four Swordplay tiers play one zone and speed (12.22 percent, 1,059 ms) although the sourced ordering says stronger tiers get a narrower zone and a faster marker (ffx-combat-core 5.3 rule 2, verified 2 sources); the values are unpublished, so rule 6 forbids inventing them. (2) The button order is the GameFAQs order and labelled 'our estimate'; research D3 records that GF-KB's Shooting Star order (two Circles) matches no other source and the International table in 5.5 disagrees; the Steam HD copy would settle it. (3) Square is keyboard K / pad 2 with no on-screen key hint beyond the chip. (4) Banishing Blade and Tornado have not been seen in a real run. GAP PASS update (real keys, Ch VII Macalania, 1600x900, seed 1, Auron/Tidus gauge forced to 100: a labelled hook): Banishing Blade (7 chips, correctInputs 7, success, damage 4605) and Tornado (6 chips, correctInputs 6, success) play their own sequence, and Slice and Dice (timer 3000), Energy Rain (2600) and Blitz Ace (2200) each resolved success with travelMs 1059 and zonePercent 12.22. So the "never seen in a real run" half of this ticket is closed; the Swordplay tier numbers (no source) and the button-order estimate remain. The miss path was not exercised.
- Repro: od-params-probe.json (params per ability); bushido-oracle.json; yunalesca-win/run.json minigames; sin-fins-core-win-long/run.json.
- Evidence: critic/rounds/round-21/combat/od-params-probe.json, bushido-oracle.json; critic/rounds/round-21/evidence/*/run.json minigames
- Confidence: high
- Requirement: AGENTS rule 6 and 14; ffx-combat-core 5.3 and 5.5
- Where: src/data/ffx/overdrives/inputs.ts
- Fix: Bailey's yes to the 5.3 estimates (22/16/12/9 percent, 1,400/1,150/900/700 ms) or sourced values makes it a four-row edit in inputs.ts; check the Steam HD copy for the Bushido order; add a key legend for the Square chip.
- Acceptance: Swordplay zone width decreases and speed increases from Spiral Cut to Blitz Ace in od-params-probe.json; the Steam copy's Bushido order matches inputs.ts.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 72. PR-0369 [polish, interface] PR-0369 (new; R21-IF-02): in Ch XII target mode the TARGET plate lies over the disc panel's "FACING HIM" label

- Game / chapter: FFX only / Ch XII
- Expected: Overlays do not overprint each other's labels.
- Observed: At 1600x900, 2000x1012 and 2560x1440 the 'TARGET Seymour Omnis' plate cuts the 'FACING HIM' label in half; the Sensor card also stands over the boss torso (PR-0248 pattern).
- Repro: Ch XII, seed 1, first menu, Attack.
- Evidence: critic/rounds/round-21/evidence/seymour-omnis-win/16-target-single.png; seymour-omnis-first-2560x1440-targetopen/11-first-menu-clean.png
- Confidence: high
- Requirement: CHK-008
- Fix: Move the target plate below the disc panel or shift the disc panel one row.
- Acceptance: 16-target-single frame at three sizes shows 'FACING HIM' whole.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 73. PR-0371 [polish, interface] PR-0371 (new, low confidence; R21-IF-05): the guide rail's NEXT and the advisor card name different actions at the same first menu (Ch IX, Ch XI)

- Game / chapter: FFX Ch IX, FFX-2 Ch XI
- Expected: Two 'next' prompts on one screen either agree or say why they differ (PR-0239 family).
- Observed: Ch IX: guide 'Kimahri Defend -> Kimahri', advisor 'Fire Gem -> Yojimbo'. Ch XI: guide 'Yuna X-Potion -> Yuna', advisor 'Shell -> the party'. The other 16 chapters agree.
- Repro: First menu of Ch IX and Ch XI, seed 1.
- Evidence: critic/rounds/round-21/evidence/yojimbo-cavern-win/11-advisor.png; ffx2-fallen-aeons-win/run.json pause.esc.text
- Confidence: low
- Requirement: RUBRIC: advisor and strategy guide are separate capabilities
- Fix: Label the guide as the designed line, or reconcile with the advisor.
- Acceptance: No unexplained disagreement in the 18-chapter first-menu sweep.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 74. PR-0374 [polish, audio] PR-0374 (new; R21-AUD-02): FFX Ch I pause cue starts 0.5-1.0 s late and without a crossfade; FFX-2 Ch IV switches within 0.5 s

- Game / chapter: FFX only (FFX-2 behaves as expected) / Ch I
- Expected: Both games duck the battle cue on opening pause with the same timing.
- Observed: Esc in FFX Ch I: boss-seymour is still current at gain 1 at +0.5 s and the pause cue is current at gain 1 by +1.0 s (150 ms sampling). FFX-2 Ch IV at +0.5 s already has the pause cue current with the boss cue fading. Gap pass PASS on the pause hand-back itself in both games (resume restores the battle cue); this is only the open-side difference.
- Repro: toBattle seymour-flux then ffx2-bahamut, setSeed(1), real Esc, sample audioDebug every 150 ms.
- Evidence: critic/rounds/round-21/evidence/gaps/pause-audio/seymour-flux-fine.json, audio-debug-seymour-flux.jsonl
- Confidence: medium (one lane, host not otherwise idle)
- Requirement: CHK-023
- Where: pause open audio path
- Fix: Check why the FFX pause cue is requested later than the FFX-2 one; make the duck on open the same in both.
- Acceptance: At +0.5 s after Esc the pause cue is current or the boss cue is below gain 0.5 in Ch I.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 75. PR-0104 [polish, feel] PR-0104 (carried, 6th review, STALLED, not re-observed): a confirmed FFX-2 Shell in Wait shows only a cast pose, no name chip

- Game / chapter: FFX-2 only / Ch IV
- Expected: A name chip in Wait as in Active.
- Observed: No Bahamut clip was recorded (clips 0 in all four Bahamut lanes), so the item could not be re-read; carried unchanged, UNVERIFIED this round.
- Repro: Bahamut Wait mode, Yuna Shell; needs a clip.
- Evidence: none this round
- Confidence: low (carried)
- Requirement: RUBRIC 6
- Fix: Per the method check already owed for this stalled issue.
- Acceptance: Name chip visible during the cast in Wait.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 76. PR-0315 [polish, feel] PR-0315 (carried, not re-observed): the twirl crossfade may double-expose the neighbouring girl as well as the changer for about 0.2 s

- Game / chapter: FFX-2 only / Ch IV-XV
- Expected: A clean crossfade of the changing girl only.
- Observed: Not measured at the 150-300 ms steps used here; frames at 1,500-1,800 ms in the Den clips show the party blended with the changer but the double image could not be separated from the white slab (PR-0334).
- Repro: Garment Grid change at 50 ms steps.
- Evidence: critic/rounds/round-21/feel-narr/spheres4.jpg
- Confidence: low
- Requirement: RUBRIC 6
- Fix: Re-measure after PR-0334 is repaired.
- Acceptance: No second figure's alpha changes during a change.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 77. PR-0316 [polish, visual] PR-0316 (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera

- Game / chapter: FFX-2 only / IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012
- Expected: The boss's face reads clearly in his signature framing.
- Observed: Bahamut's head is readable (not blown out) at 2560x1440 and 2560x1080 this round; the 2000x1012 frame that the ticket names was not captured (PR-0316 stays open until it is). Cyan rim fringe on the wing cut-outs is visible in the 2560x1440 boss crop.
- Repro: Candidate, seed 1, Ch IV, first menu.
- Evidence: critic/rounds/round-21/evidence/ffx2-bahamut-first-2560x1440/13-crop-boss.png
- Confidence: medium
- Requirement: visual: recognisability, lighting
- Fix: Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
- Acceptance: Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 78. PR-0333 [polish, visual] PR-0333 (new): FFX-2 Bahamut at 390x844 has its head, neck and the top of its wings under the BAHAMUT ACTS NEXT intent strip

- Game / chapter: FFX-2 only / ffx2-bahamut (Ch IV), 390x844 touch, first menu
- Expected: The boss's head is whole between the intent strip and the party.
- Observed: At 390x844 the first-menu frame is covered by the coach card, so the head-under-intent-strip question cannot be read; the mid-fight phone frame shows the head clear with the strip hidden (critic/rounds/round-21/vis/phone.jpg). Not captured after the coach card is dismissed.
- Repro: Seed 1, Ch IV first menu at 390x844 touch.
- Evidence: critic/rounds/round-19b/evidence/gaps/fm-ffx2-bahamut-390x844/10-first-menu.png; critic/rounds/round-19b/visual/crop-bah-phone.png; critic/rounds/round-19b/audit/phone-bah-r19-r19b.png
- Confidence: medium
- Requirement: CHK-008; RUBRIC section 5 (accidental crop damage)
- Where: colossus master framing at the phone layout; the clearance field does not count the intent strip as a panel (suspected)
- Fix: Count the intent strip in the clearance field on the phone, or fail the colossus master closed at 390 wide.
- Acceptance: Bahamut's head fully below the intent strip at 390x844 on three first menus, compared with a live-35 frame at the same seed.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 79. PR-0341 [polish, visual] PR-0341 (downgraded major to polish, not reproduced): Ch IX Yojimbo and Daigoro drawn in every round-21 capture

- Game / chapter: FFX only / Ch IX Yojimbo
- Observed: Yojimbo and Daigoro are visible 1.0 at the 2000x1012 ui first menu and the 1600x900 route frame, and 1.0 / 0.751 at 2560x1440. Round 20's single missing-boss frame (same state at 2000x1012) is not seen again. Downgrade reason: the round-20 single-frame observation (an unconfirmed single run on a loaded host) did not recur in the 2000x1012 UI first menu, the 2560x1440 first menu or the 1600x900 route; the cause was never established. Not reproduced is not proven absent: keep the portraitTimeline readout and close after one more clean quiet-host run.
- Repro: FFX Ch IX seed 1 first menu at 2000x1012 on a fresh profile; repeat several times.
- Evidence: critic/rounds/round-21/evidence/yojimbo-cavern-first-2000x1012-ui/run.json; vis/yoj-r20-r21.jpg
- Confidence: medium (not reproduced is not proven absent)
- Requirement: CHK-011
- Where: first menu
- Fix: Keep the portraitTimeline readout and rerun once on a quiet machine; close if clean.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 80. PR-0256 [polish, feel] PR-0256 (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- Game / chapter: FFX-2 / XVI aftermath, whistles 1 to 4
- Expected: A visible light, nearer on each whistle.
- Observed: Chapter XVI: "(Whistle)", "A small gold light answers.", "The light comes nearer." and the like have an empty speaker and no mote was captured in the scene frames (re-observed in the dbox timelines).
- Repro: Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: medium
- Requirement: feel/narrative: shown, not told
- Fix: A small gold mote fx step per whistle.
- Acceptance: A timed capture after each whistle shows the light, nearer each time.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 81. PR-0272 [polish, narrative] PR-0272 (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- Game / chapter: FFX / XVII sin-fins-core, seam 1 -> 2
- Expected: A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- Observed: Chapter XVII: "The Fahrenheit's cannon tears the fin away." (battle, 368,321 ms) is still a caption on the unchanged deck plate.
- Repro: Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: high
- Requirement: narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- Fix: Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- Acceptance: A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 82. PR-0350 [polish, combat] PR-0350 (carried, unchanged, low confidence, suspected): the immune-status miss event can pop twice for a two-status move and counts as 'targeted' for the Fallen Aeons counter

- Game / chapter: FFX-2 / status-only actions on immune targets, Ch XI
- Expected: One miss pop per action.
- Observed: r21-probes2.json identical to round 20 (abilities with formula none and two or more hostile statuses listed).
- Repro: r20-probes2.test.ts
- Evidence: critic/rounds/round-21/combat/r21-probes2.json
- Confidence: low
- Requirement: Presentation parity of misses
- Where: src/battle/ffx2 (immune miss event)
- Fix: Collapse to one miss event per target per action.
- Acceptance: A two-status move on an immune boss emits one miss event.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 83. PR-0351 [polish, combat] PR-0351 (carried, unchanged, low confidence): the Trigger Happy damage forecast floors at 6 hits while a human who presses fewer times now deals fewer

- Game / chapter: FFX-2 / Gunner Trigger Happy, Ch VI
- Expected: Forecast agrees with the honoured human count.
- Observed: Live matrix: 3 presses give 3 damage events (12,17,17) on all five input devices; the forecast copy is unchanged from round 20.
- Repro: critic/rounds/round-21/evidence/feat/th-*/run.json
- Evidence: critic/rounds/round-21/evidence/feat/th-ffx2-leblanc-kbd-r-3p-1600x900/run.json
- Confidence: low
- Requirement: Honest intent display
- Where: FFX-2 forecast text
- Fix: Show the forecast as a range from the honoured count.
- Acceptance: Forecast copy names the pressed-count rule.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 84. PR-0273 [polish, combat] PR-0273 (carried, unchanged): Ch XVII link 3 (on Sin's back) still lists disabled ESCAPE, PULL BACK and CLOSE IN rows at the top of the command menu

- Game / chapter: FFX / Ch XVII link 3
- Expected: Rows that can never be used on this link are hidden.
- Observed: link3-rows.json identical to round 20: attack, abilities, then escape(disabled), trigger:pull-back(disabled), trigger:close-in(disabled) before items.
- Repro: link3-rows.test.ts
- Evidence: critic/rounds/round-21/combat/link3-rows.json
- Confidence: high
- Requirement: Honest command lists
- Where: Ch XVII link-3 setup
- Fix: Hide the three rows on link 3.
- Acceptance: link3-rows.json has no disabled rows for Tidus.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 85. PR-0280 [polish, encounter] PR-0280 (carried): the v3 card's Chapter XII rate is unchanged (Omnis intended 27/40, advisor 24/40); the live v4 card covers it

- Game / chapter: FFX / Ch XII Seymour Omnis
- Expected: n/a
- Observed: Three-line bench row identical to round 20.
- Repro: ffx-bench.test.ts seymour-omnis
- Evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
- Confidence: high
- Requirement: RUBRIC 6
- Where: src/engine/tactics
- Fix: None needed beyond the live card.
- Acceptance: Row stable.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 86. PR-0263 [polish, audio] PR-0263 (carried, polish): the SFX level fix (D-293, bus 0.70, mix b) is delivered but no ear has confirmed it

- Game / chapter: both / all
- Observed: sfxMix {option b, trim 1, bus 0.70} and volumes 0.8/0.7/0.7 in 307 of 307 samples; both sprites are byte-identical to round 20. Whether the attack sounds now read as present against the music is an ear question.
- Repro: critic/rounds/round-21/audio/routing.txt (problems=0 on every run).
- Evidence: critic/rounds/round-21/audio/routing.json
- Confidence: high (measurement), unverified (listening)
- Requirement: CHK-B1
- Where: src/audio/AudioManager.ts sfxBusGain; src/app/saveSfxBalance.ts
- Fix: Bailey's ear on the audition page (part of the PR-0148 verdict).
- Acceptance: Bailey's recorded reaction to the SFX level.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 87. PR-0220 [polish, audio] PR-0220 (carried, polish): a real controller on a real Chrome is not proven to unlock audio

- Game / chapter: both / title
- Observed: Emulated pad-only runs (seymour-flux-win-pad, ffx2-bahamut-win-pad) reached the boss cue at the first menu, and audio-pad-unlock unit tests pass (2 of 2), but headless Chromium already has user activation, so a real pad and a real browser are untested.
- Repro: critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl; npx vitest run tests/unit/audio-pad-unlock.test.ts.
- Evidence: critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl
- Confidence: medium
- Requirement: CHK-001 / platform goals (real controller evidence is UNVERIFIED, not a pass)
- Where: src/audio/padUnlock.ts
- Fix: A real-controller check in desktop Chrome (hardware), Bailey or a tester.
- Acceptance: A pad-only fresh session in real Chrome plays the title or board cue after the first pad A.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 88. PR-0039 [polish, audio] PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- Game / chapter: both / I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
- Expected: Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- Observed: themes-audit output is byte-identical to round 20's: 4 of 26 cues depart (scene-gagazet, scene-dreams-end, scene-farplane with no tempo map; scene-macalania-temple is 'not in the bible's cue map').
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Fix: Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- Acceptance: themes-audit reports 0 departures for these cues.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 89. PR-0260 [polish, audio] PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- Game / chapter: ffx / VII
- Expected: Every shipped cue has a row in the bible's cue map.
- Observed: themes-audit cannot check the Chapter VII scene cue scene-macalania-temple: it is "not in the bible's cue map" (output byte-identical to round 20).
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Fix: Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- Acceptance: themes-audit shows ok for scene-macalania-temple.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 90. PR-0278 [polish, audio] PR-0278 (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- Game / chapter: FFX-2 (the Ixion row), docs / XVI
- Observed: The Ixion row's last cell is cut off mid-sentence and the 'Owed cues for chapters not yet listed' heading is glued into the table as a row; the Sin rows then follow a stray '99).' line.
- Repro: Read docs/audio/THEMES.md from the line '| XVI | `ffx2-ixion-djose` Ixion'.
- Evidence: docs/audio/THEMES.md (cue map section)
- Confidence: high
- Requirement: docs accuracy
- Where: docs/audio/THEMES.md
- Fix: Repair the table text (documentation only).
- Acceptance: The table renders as one table; themes-audit still reads 18 chapters.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 91. PR-0298 [polish, audio] PR-0298 (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- Game / chapter: both / all
- Expected: D-292 as worded: the music grows from about 39 MB to about 73 MB.
- Observed: qa.mjs total shipped audio is 88.49 MB of the 90 MB budget (D-306 raised the cap from 85 MB; the accepted recommendation said about 73 MB of music). A question for Bailey, nothing changed in this build.
- Repro: node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- Confidence: high
- Requirement: RUBRIC s7 (a pick approves what Bailey named)
- Fix: Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- Acceptance: decisions.json records Bailey's answer on the 78 MB size.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 92. PR-0237 [polish, interface] PR-0237 (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- Game / chapter: FFX-2 only / IV Bahamut, first menu, 390x844 touch
- Expected: The coach sits below the intent strip.
- Observed: Re-observed: the phone first-time coach tag overprints the FFX-2 intent third line ("115-" cut), Ch IV.
- Repro: Fresh profile, Chapter IV, 390x844 touch, first menu.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win-phone-touch/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-008
- Where: coach placement on the phone (src/ui/coach, not traced)
- Fix: Place the phone coach under the intent strip.
- Acceptance: 0 px2 between the coach and the intent strip at 390x844 in Ch IV, V, VI.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 93. PR-0357 [polish, interface] PR-0357 (new; R20-IF-04 + capture owner): the intent card's overflow/ALSO line is cut mid-sentence and ghosted behind the dashed footer rule (Ch I, Ch IV; 2000x1012)

- Game / chapter: both (Ch I, Ch IV seen) / I Seymour Flux, IV Bahamut, desktop
- Expected: A collapsed card ends on a whole line or a clearly dimmed 'more' cue.
- Observed: Re-observed: the Leblanc intent odds list is ghosted behind the dashed rule at 2000x1012.
- Repro: Chapter IV, E open at the first menu, 1600x900 or 2000x1012.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/11-advisor.png; ffx2-bahamut-lose/11-advisor.png; audit/zz-contrast.tmp.mjs; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: medium
- Requirement: CHK-003; RUBRIC section 2
- Where: enemy intent card overflow fade with 'J HOLD +N MORE'
- Fix: Clip at a line boundary, or put the consequence ('Slowing him slows it too') in the first visible line.
- Acceptance: No card line shown at under 3:1 and none cut mid-sentence in the collapsed state.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 94. PR-0324 [polish, interface] PR-0324 (carried, half fixed): Ronso Rage no longer called timed in code (live card not captured); Yuna's Grand Summon is still called a "Timed input"

- Game / chapter: FFX only / XIV Isaaru, first menu, 1600x900 seed 1
- Expected: No 'Timed input' on an untimed picker (project data: no timed input; a picker only).
- Observed: Re-observed: Yuna's Grand Summon still reads "Timed input" (Ch XIV); the Ronso Rage live card was not captured.
- Repro: Real keys to Chapter XIV, first menu, read the advisor card.
- Evidence: critic/rounds/round-20/evidence/isaaru-via-purifico-win/run.json advisorText
- Confidence: high
- Requirement: RUBRIC section 2; AGENTS.md rule 6
- Where: src/engine/tactics/advisor.ts:653 (the fix excludes only kimahri-rage); src/battle/ffx/overdrive.ts timerMsFor returns 0 for yuna-grand-summon
- Fix: Add the phrase only when timerMsFor(def) is above 0 (Swordplay, Bushido, Lady Luck reels keep it).
- Acceptance: No 'Timed input' on Ronso Rage, Grand Summon or Mix rows; Bushido and reels keep it.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 95. PR-0292 [polish, onboarding] PR-0292 (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- Game / chapter: FFX / I prep
- Expected: Every control has a key or pad route, and touch wording on touch screens.
- Observed: Carried, not captured (the prep tabs were not opened by input at any size; third round without them). Prep code untouched in release 38.
- Repro: Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- Confidence: high
- Requirement: onboarding: input access
- Where: Sphere Grid tab
- Fix: Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- Acceptance: A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 96. PR-0327 [polish, delivery] PR-0327 (carried, not captured): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; cold or throttled behaviour still unobserved

- Game / chapter: FFX-2 only
- Expected: Keys present when the twirl plays, or a clean fallback.
- Observed: Trema runs request paine-warrior, paine-thief and yuna-warrior twirl-forming and twirl-end files during play; no timing of key arrival against the outfit frame exists on a throttled cache.
- Repro: Cold profile, 10 Mbit, Chapter IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
- Evidence: critic/rounds/round-21/evidence/ffx2-trema-win/network-media.json (twirl requests present, no timing)
- Confidence: low (builder-stated, never captured)
- Requirement: RUBRIC section 2 measured loading
- Fix: Prefetch the party's twirl keys at battle start at idle priority, after the throttled capture shows a gap.
- Acceptance: A throttled capture where every twirl key response ends before the outfit frame.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 97. PR-0223 [polish, delivery] PR-0223 (carried, unchanged): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- Game / chapter: FF7 experiment (hidden)
- Expected: 0 requests >= 400 on the FF7 pause.
- Observed: Not captured in round 21; no FF7 file changed.
- Repro: FF7 door, then battle, then Esc; record the network log.
- Evidence: critic/rounds/round-20.json PR-0223
- Confidence: low
- Requirement: CHK-017 and CHK-018
- Fix: None until observed.
- Acceptance: A network log of the FF7 pause with no 4xx.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 98. PR-0339 [polish, harness] PR-0339 (critic tooling, carried, widened): the route's 700 s fight budget ends Ch III, V, XI and XVII mid-fight (XI needed 13 minutes on seed 2), and it expects a post-battle scene before results where four chapters play it after Confirm

- Game / chapter: both / ffx2-trema, sin-fins-core, sin-face; post-scene in I, II, VII, VIII, VI
- Expected: A recorded real-key win through results and back to the board for every included chapter (CHK-022).
- Observed: The route bot loses at human pace: Yunalesca lost on seeds 1, 1001 and three more attempts (116-121 turns, 643-720 s per fight) and won only on seed 4001 after 58 minutes; Trema lost 5 of 5 (81-98 turns); Den of Woe lost 4 of 4 plus one chain-link win, then defeat. Braska and Sin Fins Core stalled at link 3 on the short budget and won on the long re-runs. No victory results screen was captured for Trema or Den of Woe (product cause not established; see PR-0227 and PR-0306).
- Repro: cap/lanes.sh with ffx2-trema win --seed=1|2|3 --attempts=2; gapcap/swordplay.mjs sin-fins-core 1600x900 "" 1
- Evidence: critic/rounds/round-21/evidence/ffx2-trema-win-r2/run.json, ffx2-den-of-woe-win-r2/run.json, yunalesca-win-r2/run.json
- Confidence: high that it is not a product regression; unknown whether a better bot wins
- Requirement: CHK-022
- Fix: Teach the route to enter the shown Overdrive input and a race-aware policy for the Sin chapters, raise the turn cap, and read the post-scene after CONFIRM (with PR-0261).
- Acceptance: A recorded win through results, CONFIRM, scene and board for XIII, XVII and XVIII.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 99. PR-0261 [polish, harness] PR-0261 (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- Game / chapter: both (tooling) / all phone routes
- Expected: contexts.touch.blocked names the element that intercepts the tap.
- Observed: Pattern persists: Braska and Sin Fins Core short runs stalled at link 3 and read as outcome "victory" in the collation; seven victories carry an unverified 30-post-scene frame (the screen wanted a cutscene and got results, PR-0339 pattern).
- Repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- Confidence: high
- Requirement: CHK-016 evidence integrity
- Fix: Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- Acceptance: A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 100. PR-0375 [polish, harness] PR-0375 (critic tooling, new; R21-PD-02): the pause matrix assumes a plain top row at the FFX first menu, so four FFX rows fail on a shifted state

- Game / chapter: FFX only (FFX-2 first menus open on a row that is not Attack at the coach)
- Expected: A row fails only when the game's response differs from the rule from the stated state.
- Observed: seymour-flux-pausematrix-1600x900 row 4 starts with targets 2 (the target cursor open) because the last coach card's Enter also chose Attack (OBS-03); Esc therefore closes the cursor instead of opening pause, and rows 5 to 7 run one state out of step and read FAIL. The pad run's row 11 (targeting Esc) starts with targets 0 and rows 12 and 13 follow. Every row after the shift behaves as the rules say. The report would read 14 pass 4 fail and 10 pass 3 fail as a product failure.
- Repro: node critic/rounds/round-21/cap/pausematrix21.mjs seymour-flux and read run.json rows 4 to 7 (before.targets).
- Evidence: critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900/run.json, -pad, -390x844-touch
- Confidence: high
- Requirement: CHK-015 and CHK-016 (state asserted before a row counts)
- Fix: Assert the precondition of each row from the game snapshot (top row, targets 0) and press Esc once to close a stray cursor before the row, or stamp the row UNVERIFIED instead of FAIL; keep OBS-03 itself with the onboarding and interface auditors.
- Acceptance: Flux matrix reads 18 of 18 on a rerun from the same build.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 101. PR-0376 [polish, harness] PR-0376 (critic tooling, new; R21-PD-03 + gap-pass bug): clip21.mjs threw ReferenceError (Cannot access "path" before initialization) in 21 run.json files, so most clip routes recorded no clips

- Game / chapter: both
- Expected: Every run started with clips leaves its clip folders.
- Observed: clipError appears 9 to 20 times in 21 run.json files (Flux win, pad, reduce-motion, phone clips, lose-clips, Bahamut win, pad and phone, Sin Fins long, Braska long r2, Evrae, Natus, Omnis, Anima, Ixion, Isaaru, Sin Face and others); clips exist for only nine runs (135 clips, 38 transitions: Braska, Yojimbo, Leblanc, Fallen Aeons, Vegnagun, Den, Yunalesca, Sin Fins), and the runs asked for clips with --clips (Bahamut phone clips, Flux phone clips, lose-clips) hold none. Auditors judging motion or transitions must not count these runs. Merged with the gap pass's own diagnosis: in finish() a local "let path" (the actor's path samples) shadowed the node:path import; renamed to samplePath in the scratch copy (cap/clip21.mjs lines 138-152, not re-run for the phone, pad, reduce-motion and lose routes). The gap pass re-recorded the Flux and Braska telegraph-hold clips and the Bahamut attack and skill-travel clips with it.
- Repro: grep clipError critic/rounds/round-21/evidence/ffx2-bahamut-win/run.json; ls evidence/ffx2-bahamut-win/clips (empty).
- Evidence: critic/rounds/round-21/evidence/*/run.json steps k=clipError; critic/rounds/round-21/evidence/*/clips
- Confidence: high
- Requirement: CHK-016 (evidence the harness proved)
- Fix: Move the path import or declaration ahead of its first use in critic/rounds/round-21/cap/clip21.mjs and re-record the missing clips (a capture-owner step; no product change).
- Acceptance: A repeat of ffx2-bahamut-lose-clips leaves its clips and no clipError step.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 102. FOC37-03 [polish, interface] FOC37-03 (carried from the focused review, not reproduced): the Ch IV first-run coach tag clips at 2000x1012 for some first actors

- Game / chapter: FFX-2 only / IV Bahamut, 2000x1012, seed 2 (focused review)
- Expected: Coach and tag stay inside the viewport.
- Observed: Round 20 captured 2000x1012 coaches at seeds 1, 1001 and 1002 (Ch IV, Ch XIII, others): all inside the page (tag right edge near x 525 of 2000 in Ch IV). Seed 2 of Ch IV was not run, so the focused finding neither confirmed nor cleared.
- Repro: Chapter IV, seed 2, 2000x1012, first menu.
- Evidence: critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused.json FOC37-03; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: low (not reproduced)
- Requirement: CHK-003
- Where: coach tag width (src/ui/coach, not traced)
- Fix: Clamp the coach card and tag to the viewport width.
- Acceptance: Seed sweep 1-6 at 2000x1012 in Ch IV: tag right edge below the page width.
- Ship tags: introducedByCandidate true, regressionVsLive true, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 103. PR-0342 [polish, visual] PR-0342 (new; V20-02): Ch IX: a foreign blue tree painting shows over the cavern backdrop for part of the fight

- Game / chapter: FFX only / Chapter IX
- Expected: The Cavern of the Stolen Fayth plate and its approved look only.
- Observed: A bright blue-white tree canopy with falling petals appears in the upper right of the cavern battle plate in 13-guide-G (about 5.7 s after the first menu) and faintly behind Yojimbo in 16-target-single; the cavern plate is otherwise a near-black platform. It looks like a crossfade or layer from another room (Macalania woods). Round 19b's Ch IX frames show no tree.
- Repro: As V20-01, then press G at the first menu and screenshot at 2000x1012.
- Evidence: critic/rounds/round-20/evidence/yojimbo-cavern-win/13-guide-G.png, critic/rounds/round-20/vis/yoj13-crop.jpg
- Confidence: medium-low (one run; cause unestablished)
- Requirement: CHK-013 (art judged in the running game); approved art identity
- Where: 13-guide-G (clear), 16-target-single (faint), 2000x1012 seed 1
- Fix: Identify which layer paints the tree (suspected A-7 living-backdrop sky layer or a plate crossfade) and restrict it to rooms that own it; the fix lives with V20-01.
- Acceptance: No tree or foreign painting at any point of a Ch IX fight in 3 of 3 runs at 1600x900 and 2000x1012.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 104. PR-0320 [polish, visual] PR-0320 (carried): the first-time Rikku coach line is still up over the girls' feet during the held dressphere shot (Ch XIII 2000x1012)

- Game / chapter: FFX-2 only / Ch XIII Trema
- Expected: The coach line hidden for the shot and back after it.
- Observed: While the shot label 'Paine Songstress' is up, the pink 'GAUGES RUNNING - A COMMAND HOLDS THEM' tag and the Rikku quote card sit across Paine's shins and feet. The builder's html.mix-held rule hides the coach but the disclosed evidence shows the rule, not the flow; in the natural run it does not hide it.
- Repro: FFX-2 Ch XIII seed 1: first CHANGE with the coach unseen; frames f02-f06.
- Evidence: critic/rounds/round-20/vis/trema-coach.jpg, critic/rounds/round-20/vis/trema-spc.jpg
- Confidence: high
- Requirement: CHK-008
- Where: first CHANGE (Paine to Songstress), 2000x1012, seq-spherechange f02-f08
- Fix: Apply the hide in the code path that raises the coach after the held shot starts (the coach registers its own listener after the shot's class is set).
- Acceptance: No coach-mark box intersects a girl's painted box in any frame of the shot in Ch IV, XIII at 1600x900 and 2000x1012.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 105. PR-0347 [polish, feel] PR-0347 (new; R20-FEEL-03): at the Den of Woe link-2 seam the camera pushes Yuna out of the left edge by 2.5 s (also in 19b)

- Game / chapter: FFX-2 only / Ch XV Den of Woe, link 1 to 2 seam, 1600x900
- Expected: Camera keeps all three girls in frame or cuts away deliberately.
- Observed: seq-seam-2: frames f03-f05 hold the whole party; by f06 (2.18 s) Yuna is at the left edge and by f07 (2.51 s) only her staff and a sliver show while the Gippal line card is up. Same composition in round 19b f07 and in the r19route run, so it is not a regression.
- Repro: Route harness ffx2-den-of-woe seed 1, link 1 won, watch the seam to link 2; frames critic/rounds/round-20/evidence/ffx2-den-of-woe-win/seq-seam-2/f06.jpg and f07.jpg
- Evidence: critic/rounds/round-20/feel-narr/seam-den2.jpg; critic/rounds/round-20/feel-narr/seam-den19.jpg
- Confidence: medium
- Requirement: RUBRIC 6: coherent camera
- Fix: Clamp the seam camera's end pose on the party's leftmost member for this chapter.
- Acceptance: Den link-2 seam at 1600x900 and 2000x1012: all three girls fully visible at every frame through the first menu.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 106. PR-0346 [polish, feel] PR-0346 (new; R20-FEEL-01, low confidence): under a loaded host the chapter card stays up 3-4 s into the transition after a hurried scene entry

- Game / chapter: both / FFX Ch I, III; FFX-2 Ch IV, XIII, XV (observed slow); most other chapters show the fast path
- Expected: Card 0.7 s after a hurried scene and first menu in about 3.2-4.8 s (docs/handoff/r37-scenes.md), at least on a single lane.
- Observed: The hurried entry (PR-0061) gives 3.4-5.2 s to first menu in 23 of 28 runs. In five runs the full chapter card is still on screen 2.75-4.08 s into the hand-over sequence (Flux win f09 at 2950 ms, Braska 3303 ms, Trema 4084 ms then gone at 4533, Bahamut lose 3777 ms, Den first run 2749 ms) and first menu was 5.4, 7.4, 6.3, 4.7 (lose) and 16.9 s. All five started in the first parallel burst (lanes A, B, C, D at 17:37:25Z) or the Den lane with 3 other lanes active; the Den first run alone cost 31 s wall against 19-20 s for the rest.
- Repro: Route harness, fresh profile, hold Enter through the pre-scene, then watch seq-transition-into-battle. Seed 1. Compare critic/rounds/round-20/feel-narr/trprof.py output (luminance 163-175 = card) for seymour-flux-win, braskas-final-aeon-win, ffx2-trema-win, ffx2-bahamut-lose against the fast runs.
- Evidence: critic/rounds/round-20/feel-narr/trprof.py; critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-20/evidence/seymour-flux-win/seq-transition-into-battle/f09.jpg
- Confidence: low (host load vs load-time wait not separated; no single-lane retime)
- Requirement: RUBRIC 4 and 9: a resource-contention timeout is investigated before it is called a game defect; PR-0061 closure needs the claim measured
- Where: src/ui/common/transitions/openingHurry.ts (suspected, not traced)
- Fix: Re-run Flux, Braska, Trema and Bahamut entry alone on one lane and log when the card is dismissed and what it waits on; if it waits on the battle load, nothing to change, otherwise cap the hurried card at 0.7 s.
- Acceptance: Single-lane entry for the four runs: card gone and first menu under 5.5 s in all four, 3 repeats.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 107. PR-0248 [polish, visual] PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- Game / chapter: FFX only / VII Seymour and Anima, single-target step, 2000x1012
- Expected: No panel over a painted figure the player may target next.
- Observed: The 'Guado Guardian A HP ???' Sensor card covers Guardian B's torso and robe while Guardian A is targeted.
- Repro: Chapter VII, Attack, step to Guado Guardian A.
- Evidence: critic/rounds/round-20/evidence/seymour-anima-macalania-win/16-target-single.png
- Confidence: high
- Requirement: CHK-008
- Where: Sensor card placement
- Fix: Add the projected enemy quads to the Sensor card's placement test.
- Acceptance: Sensor card clear of every enemy box except the target in Ch VII, X, XII.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 108. FOC37-01 [polish, interface] FOC37-01 (carried from the focused review, downgraded major -> polish): the Lady Luck reel overlay is covered by the guide card; unreachable by players (PR-0340) and not reproduced live

- Game / chapter: FFX-2 only (Lady Luck minigame) / not driven in round 20
- Expected: The overlay sits above the guide card, or the guide hides while a minigame is open.
- Observed: Reported by the focused review's Lady Luck lane ('reel 1 and the DUD warning half hidden'); not re-reproduced by that review and not exercised in round 20 (no Lady Luck fight was driven).
- Repro: Open the Lady Luck reel overlay with the guide card on.
- Evidence: critic/reviews/cd9dbbb08-focused.json FOC37-01
- Confidence: unverified
- Requirement: CHK-006, CHK-008
- Where: minigame overlay z-order under the guide card at top left (not traced)
- Fix: Raise the overlay above the guide or hide the guide during a minigame.
- Acceptance: Reel 1 and the DUD warning fully visible with the guide on, 1600x900 and 390x844.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 109. PR-0249 [polish, interface] PR-0249 (carried, re-observed by the chief): the FFX-2 intent card covers the girls at 1600x900; at the whole-party Shell target in Ch IV it stands over Rikku and Paine

- Game / chapter: FFX-2 / IV Bahamut
- Expected: No panel over a face or a weapon.
- Observed: tgt-ffx2-bahamut-1600x900-shell/target.png (c69de96a, seed 1, real keys): the BAHAMUT ACTS NEXT card (x about 490-865, y about 185-500) covers Rikku and Paine almost to the feet while the target brackets frame them; Yuna stays clear. Under the colossus master the girls stand further back than in round 18b's frame, so the overlap reads larger; whether it differs from live 35 at this state is not captured.
- Repro: Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- Evidence: critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png
- Confidence: high for the observation; unknown against live
- Requirement: CHK-008
- Fix: Add the projected party quads to the intent card's placement test while targeting.
- Acceptance: Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Widened (merged R18b-VIS-01): in Ch IV at 1600x900 the default intent card also covers Rikku's head and Paine's head and torso while Yuna's WHITE MAGIC list is open, which hides Paine's Cursed darkening; the same with REDUCE MOTION on. Intent and camera code are unchanged in this diff.

### 110. FOC28-P02 [polish, interface] FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- Game / chapter: FFX / II and XIV Grand Summon picker, 390x844
- Expected: Legible and not clipped.
- Observed: Recorded by the focused review of this same build and still open.
- Repro: See critic/reviews/6ea8528f-focused.md.
- Evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
- Confidence: high
- Requirement: CHK-003
- Fix: As proposed in the focused report.
- Acceptance: As proposed in the focused report.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 111. PR-0239 [polish, interface] PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- Game / chapter: FFX-2 (the rail is shared) / XI Fallen Aeons, Rikku's Mega-Potion charging
- Expected: The two panels do not contradict each other about the same turn.
- Observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- Repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- Evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- Confidence: high
- Requirement: Interface: useful advice
- Fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- Acceptance: In the same case, the rail and the card agree or the rail defers.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 112. PR-0246 [polish, interface] PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- Game / chapter: FFX / Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
- Expected: The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- Observed: 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- Repro: node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- Confidence: high
- Requirement: PR-0246 acceptance; CHK-009
- Fix: Wrap the label to two lines, or drop the verb when the name is long.
- Acceptance: The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 113. PR-0247 [polish, visual] PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- Game / chapter: FFX / VII, battle, Anima's arrival at 390x844 touch
- Expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- Observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- Repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- Confidence: high
- Requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- Fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- Acceptance: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 114. PR-0250 [polish, interface] PR-0250 (carried, confirmed): the phone results location caption is clipped

- Game / chapter: FFX / Ch XII
- Expected: The full caption.
- Observed: 'INSIDE SIN — THE GARDEN C…'
- Repro: Lose or win Ch XII at 390x844.
- Evidence: round-18/evidence/seymour-omnis-win-touch/31-results.png
- Confidence: high
- Requirement: CHK-009
- Where: 390x844 results
- Fix: As in round 17.
- Acceptance: The caption's scrollHeight <= clientHeight + 1 at 390x844.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 115. PR-0271 [polish, visual] PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- Game / chapter: FFX only / XVIII Sin: the Face
- Expected: No HUD panel over a face, including during camera moves (CHK-008).
- Observed: When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- Repro: Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- Evidence: critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- Confidence: medium (observed; no live action-frame evidence to compare)
- Requirement: CHK-008
- Where: Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- Fix: Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- Acceptance: XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 116. PR-0276 [polish, interface] PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- Game / chapter: FFX-2 / IV Bahamut
- Expected: Header visible, or scrolling inside the rows only.
- Observed: The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- Repro: Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- Evidence: critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- Confidence: high
- Requirement: CHK-009
- Fix: Make the header sticky, or scroll the rows container only.
- Acceptance: Header box fully inside the list viewport after wheel up and down.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 117. PR-0277 [polish, interface] PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- Game / chapter: FFX / I Seymour Flux
- Expected: The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- Observed: The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- Repro: Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- Evidence: critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- Confidence: low
- Requirement: CHK-005 (says in plain words what to spend the turn on)
- Fix: Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- Acceptance: On the same board the card names the raise, then the cure, in that order.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 118. PR-0286 [polish, interface] PR-0286 (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- Game / chapter: FFX / Ch I
- Expected: The message and the dialogue text do not overlap.
- Observed: 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- Repro: 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- Confidence: medium
- Requirement: CHK-008
- Where: 390x844, a status lands while a battle line is on screen
- Fix: Offset the message line below the banner while a line is up, or queue it until the line ends.
- Acceptance: Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Widened by the gap pass (merged R18B-GAP2-06): at 1280x960 FFX desktop, "Kimahri was hasted." (371 px2) and then "Yuna became a Zombie." (568 px2) overlap the visible dialogue text for about 2.5 s (13 samples at 200 ms); no overlap at 1600x900, 2000x1012, 2560x1080 or 3840x2160. On the FFX-2 phone the new floor (withStatusLooks.ts) moves the message clear of the docked hint within one 200 ms sample. The FFX phone had 0 px2 of message over dialogue in 15 samples.

### 119. PR-0288 [polish, interface] PR-0288 (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- Game / chapter: FFX / Ch I
- Expected: The full help sentence, wrapped if needed.
- Observed: 'TIDUS · Nothing left to say — A one-off action this enc…'
- Repro: 390x844 Ch I after Talk is used up, cursor on TALK.
- Evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- Confidence: high
- Requirement: CHK-009
- Where: 390x844 command menu, TALK disabled
- Fix: Allow two lines, or shorten the copy for the phone.
- Acceptance: scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 120. PR-0291 [polish, interface] PR-0291 (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- Game / chapter: FFX / I
- Expected: As in the approved O3 target, both panels are readable.
- Observed: The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- Repro: Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- Confidence: high
- Requirement: approved target O3 / interface readability
- Where: 1600x900 Items list aimed at a Zombie
- Fix: Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- Acceptance: No overlap between .stwarn and the Guide card rect in that frame.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Re-observed on f302f163 and widened (visual auditor): at 1600x900 with the guide open, the red Zombie warning slab and also the grey TALK help slab ("A one-off action this encounter offers") overprint the Guide card's NEXT "Holy Water -> Yuna" line. Round 18's frame is identical.

### 121. PR-0293 [polish, visual] PR-0293 (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- Game / chapter: both / I, IV, VII, XVII, XVIII (every chapter checked)
- Expected: CHK-002: the pause painting covers the window at every supported size.
- Observed: Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- Repro: Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- Confidence: high
- Requirement: CHK-002
- Where: pause layer at 4K (the 3360x1920 master is not scaled to cover)
- Fix: Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- Acceptance: pauseRect.full is true at 3840x2160 in both games.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: 4K pause not re-graded; see PR-0391 for the 4K battle HUD.

### 122. PR-0296 [polish, interface] PR-0296 (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- Game / chapter: FFX / XVII sin-fins-core, first decisions
- Expected: CHK-008: plates never cover the intent text.
- Observed: Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- Repro: 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/
- Confidence: medium (frames only)
- Requirement: CHK-008
- Where: 390x844 battle HUD
- Fix: Reserve the intent line's band from the range plate on the phone layout.
- Acceptance: No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 123. PR-0302 [polish, interface] PR-0302 (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- Game / chapter: both / I (Zombie), IV (Curse); any hinted status
- Expected: CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- Observed: Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- Repro: critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- Confidence: high (measured)
- Requirement: CHK-003; RUBRIC section 5 (effective text size)
- Where: src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- Fix: Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- Acceptance: Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 124. PR-0303 [polish, interface] PR-0303 (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- Game / chapter: FFX (FFX-2's shorter target card leaves room: 0 px2) / I seymour-flux, a target step with a hinted status (Zombie)
- Expected: The target-step instructions and the hint do not overlap (CHK-008).
- Observed: 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- Repro: Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- Confidence: high
- Requirement: CHK-008; PR-0282 acceptance (the hint never over the command surface)
- Where: src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- Fix: Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- Acceptance: 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 125. PR-0304 [polish, interface] PR-0304 (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- Game / chapter: FFX-2 (desktop, guide open) / IV ffx2-bahamut, the girls' menus after Curse lands
- Expected: While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- Observed: At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- Repro: Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- Confidence: medium (symptom high; cause suspected)
- Requirement: Status O3 target (the hint in the guide's slot); CHK-008
- Where: suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- Fix: Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- Acceptance: 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 126. PR-0305 [polish, onboarding] PR-0305 (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- Game / chapter: FFX-2 (the FFX help line follows each actor in both modes) / IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
- Expected: The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- Observed: Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- Repro: 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- Confidence: medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- Requirement: CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- Where: suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- Fix: Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- Acceptance: BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 127. PR-0317 [polish, visual] PR-0317 (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900

- Game / chapter: FFX only / I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03)
- Expected: A boss in action stays inside the frame (CHK-014).
- Observed: His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
- Repro: Candidate, seed 1, 1600x900, Ch I, let Seymour act.
- Evidence: critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
- Confidence: high
- Requirement: CHK-014; CHK-013
- Fix: Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
- Acceptance: Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 128. PR-0319 [polish, visual] PR-0319 (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line

- Game / chapter: FFX only / IX yojimbo-cavern, first menu 2000x1012
- Expected: Background staging reads as background.
- Observed: Under the colossus master the far-back figure stands on the party's line at party scale.
- Repro: Candidate, seed 1, Ch IX first menu.
- Evidence: critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
- Confidence: low
- Requirement: visual: composition
- Fix: Push the prop deeper or dim it under the colossus master.
- Acceptance: In the first-menu frame Ginnem sits clearly behind the line or out of view.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 129. PR-0322 [polish, onboarding] PR-0322 (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey

- Game / chapter: both / pause > OPTIONS > EYE CANDY
- Expected: Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
- Observed: FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
- Repro: Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
- Evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
- Confidence: high (contrast estimated from JPEG)
- Requirement: D-317; CHK-003
- Fix: Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
- Acceptance: After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 130. PR-0323 [polish, onboarding] PR-0323 (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")

- Game / chapter: both / pause > OPTIONS > EYE CANDY
- Expected: Copy a first-time player understands (CHK-007).
- Observed: CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
- Repro: Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
- Evidence: critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
- Confidence: high
- Requirement: CHK-007
- Fix: Name the thing: "Off: the standard battle camera", "Off: the plain splash".
- Acceptance: No "today" in the page's help strings; capture at 1600x900.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 131. PR-0325 [polish, interface] PR-0325 (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot

- Game / chapter: FFX only / I seymour-flux, 1600x900
- Expected: The selected row is obvious (CHK-010).
- Observed: 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
- Repro: Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
- Evidence: critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
- Confidence: medium-low
- Requirement: CHK-010
- Fix: If confirmed, give the selected row the filled slab of the main list.
- Acceptance: Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 132. PR-0331 [polish, visual] PR-0331 (new, a question for Bailey): the fail-closed gates take the D-316 colossus master away from Natus, Braska's Final Aeon and Evrae; only Yojimbo and FFX-2 Bahamut keep it

- Game / chapter: FFX only (Ch III, VIII, X) / seymour-natus, braskas-final-aeon, evrae-airship, 1600x900 to 2560x1440
- Expected: D-316 lists colossus presence for the big bosses.
- Observed: At all five aspects Natus, BFA and Evrae render exactly as live 35 (pixel-mean difference 10, 22, 17, mostly HUD text): Natus about 160-190 px tall at 1600x900 against about 470 px in round 19's candidate. Not worse than live; narrower than round 19 promised.
- Repro: Seed 1, first menu of Ch X, III, VIII at 1600x900; compare with gaps/fm-*-live35.
- Evidence: critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/evidence/gaps/plate/seymour-natus.json
- Confidence: high
- Requirement: D-316 scope; RUBRIC visual and feel (boss presence)
- Where: src/engine/fx/mix/framing.ts, plate.ts (gates)
- Fix: Ask Bailey whether Natus should get its master back by steering the Sensor card off the boss (builder's proposal); list the three chapters as "today's framing" in the release notes.
- Acceptance: Bailey's decision recorded; if steered, Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Natus now stands 346 px tall and clear of his card (D-427); the question for Braska's Final Aeon, Evrae and Yunalesca stays.

### 133. PR-0332 [polish, visual] PR-0332 (new, pre-existing): at 2560x1080 every measured chapter shows plate side bands; worst is Yunalesca (15.4 percent of the plate share, dark pillars and a tilted edge)

- Game / chapter: both (FFX measured in 6 chapters; FFX-2 Bahamut 9.4 percent) / yunalesca, braskas-final-aeon, seymour-natus, yojimbo-cavern, evrae-airship, seymour-flux, ffx2-bahamut; 2560x1080 first menu
- Expected: The painted plate fills a 21:9 frame (platform goal 4:3 to 21:9), or the edge is dressed.
- Observed: plate share at 2560x1080, chosen = today: Yunalesca 0.154, BFA 0.103, Natus 0.094, Yojimbo 0.094, Evrae 0.085, Flux 0.034, Bahamut 0.094. No live-35 frame at this aspect; parity rests on the builder's chosen = today measurement.
- Repro: Seed 1, Ch II first menu at 2560x1080; gapcap/plateprobe.mjs.
- Evidence: critic/rounds/round-19b/evidence/gaps/fm-yunalesca-2560x1080/11-first-menu-N-G-hidden.png; critic/rounds/round-19b/evidence/gaps/plate/*.json
- Confidence: medium
- Requirement: RUBRIC section 2 platform goals; visual composition
- Where: plate cover-fit for frames wider than 2:1 (suspected)
- Fix: Cover-scale the plate for frames wider than 2:1 (crop top and bottom) or extend the edge with the existing fog; never repaint approved plates.
- Acceptance: Plate share 0 at 2560x1080 in all seven chapters.
- Ship tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 134. PR-0335 [polish, harness] PR-0335 (critic tooling, widened; R20-PD-04 + capture owner): the phone route never uses the FFX list's page buttons, so the intended Poison Fang and Holy Water lines are never taken by touch (Ch I phone defeat 3 of 3, as 19b), and non-battle screens are reached by keyboard

- Game / chapter: FFX only / I Seymour Flux, 390x844 touch
- Expected: A touch run reaches any item by the page buttons the phone shows.
- Observed: Three phone attempts end in defeat at 9, 11 and 31 turns; run.json misses list 'Poison Fang' and 'Holy Water' with only the first six rows (Potion to Mega Phoenix) of x27 exposed; the harness fell back to Attack. Product reachability by touch is not shown either way. Three phone attempts (seed 1 and seed 2001) ended in defeat at 9, 31 and 11 turns and 9 turns. The misses list turns 3-7 wanting Poison Fang and turns 1-2 wanting Holy Water; subRows show Potion, Hi-Potion, X-Potion, Mega-Potion, Phoenix Down, Mega Phoenix only, although the pause shows 27 items. Taps were 31 and 167; keyboard fallbacks 38 and 61 (START BATTLE, CONFIRM, RETRY and chapter select were pressed on the keyboard). Capture owner: Wanted Poison Fang, the route took Attack; Yuna down, defeat. Identical 9-turn defeat in round 19b; desktop wins in 73 turns.
- Repro: critic/rounds/round-20/cap/route20.mjs seymour-flux --size=390x844 --touch
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-touch/run.json misses; seymour-flux-win-phone-r2-touch/run.json
- Confidence: high for the harness limit; unknown for the product
- Requirement: CHK-015, CHK-022
- Where: critic/runner/lib/route-ui.mjs chooser.choose (taps visible rows only); product: src/ui/ffx/CommandMenuScroll.ts (6-row window, phone page buttons)
- Fix: Teach the touch chooser to tap the page buttons until the row shows.
- Acceptance: A touch run plays Holy Water and Poison Fang on the advisor's turn.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 135. PR-0336 [polish, harness] PR-0336 (carried from round 19 unnamed, critic tooling): the save matrix reports a false FAIL for the fresh-profile case

- Game / chapter: both / n/a
- Expected: The harness passes a correct default save.
- Observed: save-matrix.json says 23 of 24 and fails fresh-profile; its unexpectedDiffs (version, chapters {}, unlocked [], seenCoach [briefing], flags {}) are the normal default save; looks, parts, volumes, reload and errors are all correct.
- Repro: critic/rounds/round-19b/cap/save-matrix19.mjs
- Evidence: critic/rounds/round-19b/evidence/save-matrix/save-matrix.json
- Confidence: high
- Requirement: CHK-024 evidence quality
- Fix: Make expected("{}") the default save shape.
- Acceptance: The matrix prints 24 of 24 on an unchanged build.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 136. PR-0337 [polish, harness] PR-0337 (critic tooling, carried): network and console logging gaps; the one console error of the round (net::ERR_CONNECTION_CLOSED, Ch I win) was logged with no URL; the Ch I re-run read 0

- Game / chapter: both / n/a
- Expected: Every capture session records requests, status >= 400 and console errors.
- Observed: network-and-console-summary.json: 3,317 requests for 24 route runs and 0 for each of the 53 gap-pass sessions; the 36 save-matrix board shots carry an asserted screen but no verified stamp.
- Repro: critic/rounds/round-19b/gapcap/gaplib.mjs; critic/rounds/round-19b/cap/save-matrix19.mjs
- Evidence: critic/rounds/round-19b/evidence/network-and-console-summary.json
- Confidence: high
- Requirement: CHK-016, CHK-018
- Fix: Record requests and console errors in gaplib.mjs and save-matrix19.mjs; stamp the matrix shots through the route runs' screen assertion.
- Acceptance: Every 19c session carries a network and console log.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 137. PR-0359 [polish, harness] PR-0359 (critic tooling, carried, cause proved): route.mjs findCard presses ArrowRight at most 16 times, so the 18th tile (Ch XVI Ixion) is never selected; the gap pass reached and won it with 18 presses, so the board is keyboard-reachable

- Game / chapter: both (tooling) / XVI Ixion and Djose, board
- Expected: The harness reaches any of the 18 tiles and labels an outcome from the final results screen.
- Observed: ffx2-ixion-djose-win and -r2 threw 'ASSERT-FAIL card ffx2-ixion-djose got seymour-flux' after 12 s; the walk reaches ffx2-den-of-woe and turns back. Run 3 reached the card and won. Not a product fault: the board has 18 tiles and the cursor moves tile by tile. Related: the route's 'fight' step still labels a chain link's win 'victory' when a later link is lost (PR-0261).
- Repro: node critic/runner/lib/route.mjs ffx2-ixion-djose win --base=<live>, size 2000x1012 (runs 1 and 2 of this round).
- Evidence: critic/rounds/round-22/evidence/ffx2-ixion-djose-win/run.json; critic/rounds/round-22/evidence/ffx2-ixion-djose-win/99-error.png; critic/rounds/round-22/evidence/gaps/ffx2-ixion-djose-win-gap/run.json
- Confidence: high
- Requirement: CHK-016 (a failed wait throws and never screenshots the wrong screen; it did throw)
- Where: critic/runner/lib/route.mjs:84-88
- Fix: Press up to the tile count, and fail loudly when the walk does not find the card.
- Acceptance: All 18 chapters reach their card in one pass; a chain defeat reads 'defeat' in steps.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 138. PR-0227 [suggestion, encounter] PR-0227 (carried, a question for Bailey, updated): Ch XIII Trema is 0 wins in 26 real-key attempts this round; the shipped bench says 6.5 percent, so the record agrees with it

- Game / chapter: FFX-2 only / Ch XIII Trema
- Expected: Bailey's decision whether about 1 win in 15 tries is the intended difficulty, with a shown win flow.
- Observed: Real keys: 4 runs (seeds 1, 2, 3 and drawn), 26 attempts, one link-1 win (attempt 12 of the longest run) and then a loss in link 2; one injected autoBattle run lost. Bench re-run this round: link 1 28/200, Trema fresh 170/200, chapter 13/200 (Wait split), 14/200 (D=0). Nothing here separates the harness from the encounter. Research says every guide calls the Oversoul form easier than the normal Paragon (research/ffx2-trema.md section 4.1); the shipped Oversoul keeps the harder readings of its estimates (OVERSOUL_ESTIMATES defaults), which Bailey chose with 'Trema: 1 and 3 at 3 s'. A first win flow (post scene, reward row, results-to-board) is still unseen on any build.
- Repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/trema-shipped-bench.test.ts; critic/rounds/round-23/evidence/ffx2-trema-win-r4/run.json
- Evidence: critic/rounds/round-23/combat/trema-shipped-bench.log; critic/rounds/round-23/evidence/ffx2-trema-win-r4/run.json
- Confidence: high on the numbers; the difficulty intent is Bailey's
- Requirement: RUBRIC 6 encounter; CHK-022
- Where: src/data/chapter-ffx2-trema.ts, src/data/ffx2/enemies/paragon-oversoul.ts
- Fix: Bailey's call (together with R23-ENC-01). Measure options, never weaken a boss by tuning.
- Acceptance: A recorded decision, and one real-key victory with results, post scene and board for Ch XIII.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Merged: narrative auditor PR-0227 (Ch XIII victory unreached, STALLED). The bench (13/200, 6.5 percent) and the live record agree; the difficulty intent is Bailey's. Evidence status is PR-0353; the unwinnable retry is PR-0407.

### 139. PR-0306 [suggestion, encounter] PR-0306 (carried, STALLED, a question for Bailey): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 18 real-key attempts over rounds 20-21 (0 of 7 this round)

- Game / chapter: FFX-2 / Ch XV Den of Woe (Baralai, Gippal, Nooj chain)
- Expected: Real-key wins in the neighbourhood of the shipped bench, or a recorded reason why not.
- Observed: Shipped bench re-run: first try 48/200 at the live Wait split, within 3 tries 127, within 5 tries 162, Active 1.5 s 18/200 (identical to round 20). Real keys this round: seeds 1 and 1001 plus five attempts (1 to 4001): 7 defeats, some with a link won first (the chain ended in defeat each time). Over rounds 20-21: 1 of 18 against 24 percent first try, P(1 or fewer) about 0.05, a mild shortfall that harness pace may explain; no engine change in release 38 (A/B digests 0 of 120 differ). The gap pass completed the Den of Woe victory flow once under the autoBattle('intended') hook (not human-paced, labelled): win on the third link, post-battle scene, Results (Victory, EXP/AP/Gil, NEW BEST, 2:34), Confirm, scene, back on the board. So the flow works and the results screen reads well; strict CHK-022 still wants a human-paced win.
- Repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/den-of-woe-shipped-bench.test.ts; critic/rounds/round-21/logs/ffx2-den-of-woe-r2.log
- Evidence: critic/rounds/round-21/evidence/ffx2-den-of-woe-win-r2/run.json
- Confidence: medium
- Requirement: RUBRIC 6 encounter; CHK-022
- Where: src/data/chapter-ffx2-den-of-woe.ts
- Fix: Method check per RUBRIC 8 (same issue open at the same severity for two reviews); a quiet-host human-paced run to separate harness pace from difficulty.
- Acceptance: A real-key victory with its results screen, or Bailey's note that the difficulty is intended.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Ch XV was won once by real keys this round (seed 2, 5:16); the bench at the human Wait split is 20 of 100. Still a question for Bailey.

### 140. PR-0410 [suggestion, audio] PR-0410 (new, a question for Bailey; merges the gap pass's silent-seam item, which is refuted as a defect): every defeat is silent and Chapter IV's victory results are silent; the Ch III link-2 seam and the Ch II epilogue are silent by script

- Game / chapter: both / all defeats; FFX-2 IV victory
- Observed: No defeat cue exists (THEMES.md has no defeat row; showResults plays music only on a victory): all 9 defeats captured (Ch I lose and touch, Ch II, Ch IV lose, Ch XIII x20 or more, Ch XV) end with playing null at after-fight and results. Chapter IV's victory results are also silent by design (cue map 'none'). The 39.1 title, figure and lunge work did not change this. Gap pass: nothing playing for 3 s at the Ch III link-2 seam and 1 to 3 s after CONFIRM in the Ch II epilogue. The chief read the scripts: src/story/scripts/braskas-final-aeon.ts lines 251 and 280 are music(null, ...) at the "valefor-enters" and "jecht-falls" beats (script-owned silence, the audio auditor cited the same lines), and yunalesca.ts lines 137 to 149 cut the music on purpose before the epilogue. Those two observations are by design and not defects.
- Repro: critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl rows after-fight and results (playing null); ffx2-bahamut-win/audio-debug.jsonl results (playing null).
- Evidence: critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-bahamut-win/audio-debug.jsonl
- Confidence: high (the state); the preference is the owner's
- Requirement: CHK-001 scope (defeat jingles); question only, no score penalty
- Where: docs/audio/THEMES.md cue map
- Fix: Ask Bailey whether a defeat should have a cue and whether the Chapter IV victory should play victory-ffx2; build neither without his yes (AGENTS.md rule 10).
- Acceptance: Bailey's recorded answer in decisions.json; if yes, an audition by ear before it ships (rule 13).
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: REFUTED as a defect: the gap pass's "Silent seam at Ch III link 2 and silent Ch II epilogue" (minor, medium confidence) is scripted silence. What stays is Bailey's question: should a defeat or the Ch IV victory play a cue (THEMES.md has no defeat row).

### 141. PR-0032 [suggestion, onboarding] PR-0032 (carried, a proposal for Bailey): no key remapping, no REDUCE FLASHES row, no colour-vision option

- Game / chapter: both / pause
- Expected: Optional accommodations.
- Observed: OPTIONS lists no flash reduction, remapping or colour-vision setting; CONTROLS lists keys only.
- Repro: Pause, Options.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/14-pause-options.png
- Confidence: high
- Requirement: RUBRIC row 'Onboarding, accessibility and options'
- Where: OPTIONS
- Fix: Expose the existing reduceFlashes flag; ask Bailey about remapping.
- Acceptance: a REDUCE FLASHES row writes the flag
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 142. PR-0417 [suggestion, harness] PR-0417 (critic tooling, new; R23-PD-05): concurrent capture lanes inflate frame-time readings (Flux 96 against 26 slow frames, worst 812 ms in the 3-wide queue) and the renderer string is not recorded in the runs

- Game / chapter: both / capture harness
- Expected: RUBRIC section 9: one process owns capture; contention investigated before a spike is called a game defect; frame time on named hardware.
- Observed: runq.sh and runq2.sh ran three jobs and runq8.sh four lanes at once on one GPU; the same chapters read 1.5 to 4 times more slow frames in the queue than in the serial continuity set (Flux 96 versus 26 frames over 34 ms, worst 812 versus 114 ms; Bahamut 2.40 versus 1.35 percent, worst 747 versus 120 ms). run.json records mode gpu but not the WebGL renderer string nor the host load.
- Repro: Compare evidence/<chapter>-win/continuity/continuity.json with continuity/<chapter>-win-r23/continuity/continuity.json, field probe.
- Evidence: critic/rounds/round-23/runq.sh, runq2.sh, runq8.sh; the two probe sets
- Confidence: high
- Requirement: RUBRIC section 9; CHK-016
- Fix: Record WEBGL_debug_renderer_info and a CPU and GPU load sample in each run.json, and take frame-time numbers only from a serial run.
- Acceptance: Every run.json names the renderer and the load; the report cites only serial frame times.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 143. PR-0396 [suggestion, delivery] PR-0396 (carried, re-measured): the content-hashed bundle is served public, max-age=0, must-revalidate, so a return visit revalidates every file

- Game / chapter: both / hosting
- Expected: A hashed asset can be cached for a long time; a question for Bailey.
- Observed: curl of assets/index-B6DQPYhY.js: 200, Content-Encoding br, CF-Cache-Status HIT, Cache-Control public, max-age=0, must-revalidate (same on css, worker, key art, music).
- Repro: curl -I https://echoesofspira.com/assets/index-B6DQPYhY.js
- Evidence: verify-live assetCacheControl field, today 14:41Z
- Confidence: high
- Requirement: CHK-017 hosting
- Fix: Set a long max-age with immutable on /assets/* in public/_headers if Bailey wants return visits to skip revalidation; art and audio need their own policy.
- Acceptance: A repeat load sends no conditional requests for hashed assets.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 144. PR-0399 [suggestion, visual] PR-0399 (a question for Bailey): the approved Leblanc backdrop tile's picture (crate warehouse, teal door) and its written pick (magenta/cyan, door and heart panel) disagree; the build follows the text

- Game / chapter: FFX-2 / ffx2-leblanc
- Expected: One reference.
- Observed: The approved tile 'The Leblanc Syndicate (FFX-2)' shows a crate warehouse with a teal door; its own text says 'mixed magenta/cyan, visible door and heart panel'. The build (neon heart over a blue door) matches the text, not the picture. Delivery is 'in-progress'.
- Repro: node tools/end-state-board.mjs --pair docs/concepts/chapters/leblanc/renders/backdrop-c.png critic/rounds/round-22/evidence/ffx2-leblanc-win/23-midfight.png
- Evidence: critic/rounds/round-22/targets/leblanc.jpg
- Confidence: medium
- Requirement: RUBRIC 7: waiting on a decision
- Fix: Ask Bailey which of the two he approved; no art change proposed.
- Acceptance: Bailey's answer recorded in the tile's reaction.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 145. PR-0400 [suggestion, combat] PR-0400 (new, FFX only): research/ffx-seymour-flux.md row 13 and the Jegged notes still recommend Defend before Total Annihilation while the shipped guide and the engine say Defend halves physical hits only

- Game / chapter: FFX / I
- Expected: A labelled conflict in research so the next guide edit does not restore it.
- Observed: research/ffx-seymour-flux.md section 6 row 13 and research/jegged-encounter-guides-ffx-a.md row 1 name 'Shell + Defend'; the shipped guide and WATCH rail now say Defend only halves physical hits, matching research/ffx-combat-core.md 5.1 and the engine (3,855 plain, 3,855 with Defend, 1,925 with Shell).
- Repro: read the two research files against tests/unit/guide-seymour-defend-magic.test.ts
- Evidence: critic/rounds/round-22/combat (source reads)
- Confidence: high
- Requirement: AGENTS rule 6 (sources and their conflicts recorded)
- Where: research/ffx-seymour-flux.md
- Fix: Add a one-line conflict note to ffx-seymour-flux.md row 13 and, if Bailey wishes, check Defend against Total Annihilation in the Steam HD copy.
- Acceptance: research/ffx-seymour-flux.md row 13 carries a conflict note.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 146. PR-0405 [suggestion, delivery] PR-0405 (R39F-09, carried from the focused review): the title fetches 58 art files before input (live 38: 27); the board alone had requested 96 MiB in the Ixion run

- Game / chapter: both / title, board
- Expected: A first screen that asks only for what it draws.
- Observed: Focused review count; this round's Ixion run requested 64 files and 96 MiB before leaving the board.
- Repro: Fresh profile, title, network log.
- Evidence: critic/reviews/c7135bec-focused.json; critic/rounds/round-22/evidence/ffx2-ixion-djose-win/network-media.json
- Confidence: medium
- Requirement: RUBRIC 2 load goal
- Fix: Defer prefetch until the first input.
- Acceptance: Title requests at most the files it draws.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 147. PR-0299 [suggestion, audio] PR-0299 (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- Game / chapter: both / all
- Expected: RUBRIC s7: an inferred item is asked before it is built.
- Observed: The save migration moves an untouched 0.35 SFX level to 0.70, which cannot tell a deliberate 0.35 from the old default (D-293 marks this half as inferred). A question for Bailey, nothing changed in this build.
- Repro: Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- Confidence: high
- Requirement: RUBRIC s7 inferred items; D-293
- Fix: Ask Bailey whether this is acceptable. No code change unless he says no.
- Acceptance: D-293's inferred note moves to named, or is reversed by Bailey.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 148. PR-0358 [suggestion, interface] PR-0358 (new; R20-IF-05, a question for Bailey): the phone advisor line names the menu but not the cost

- Game / chapter: both / I (FFX) and IV (FFX-2), 390x844
- Expected: RUBRIC section 2: the advisor says where an action is and what it costs.
- Observed: Re-observed: the phone advisor line names the menu but not the cost.
- Repro: First menu at 390x844 in Ch I or IV.
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-r2-touch/11-advisor.png; ffx2-bahamut-win-phone-touch/run.json advisorText
- Confidence: medium
- Requirement: RUBRIC section 2
- Where: phone TIP line (covered by tests/unit/advisor-phone-tip-menu.test.ts, which asserts the menu only)
- Fix: Append the MP when it fits on the line; no change if Bailey prefers the shorter tip.
- Acceptance: Phone tip shows the MP cost for a spell at 390x844 without ellipsis.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 149. PR-0217 [suggestion, combat] PR-0217 (carried): Zombie is kept across a KO (unsourced); the advisor's top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- Game / chapter: FFX / Ch I, II
- Expected: A sourced rule.
- Observed: Three-line bench zombie rows unchanged and no status code changed in release 38.
- Repro: ffx-bench.test.ts zombieHealTopRows, zombieReviveTopRows
- Evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
- Confidence: medium
- Requirement: AGENTS rule 6
- Where: src/battle/ffx status handling
- Fix: Source or label the rule.
- Acceptance: Research entry exists.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 150. PR-0368 [suggestion, feel] PR-0368 (new, a question for Bailey; R21-FEEL-03, the builder's own): the FFX-2 run-in makes a plain Attack about 1.2-1.7 s long; is that the rhythm he wants

- Game / chapter: FFX-2 only / Ch V, VI
- Expected: A judgment, not a defect against any source.
- Observed: Rikku's plain Attack at Vegnagun: menu closes 1.2 s, numeral 2.0 s, home by 2.4 s; engine hold to the next event 1,622 and 1,690 ms for Rikku, 598-984 ms for Paine; FFX-2 turn medians moved -0.4 to +1.4 s against round 20 (Fallen Aeons 7.1 to 8.5). The ATB clock keeps running during it in Active.
- Repro: critic/rounds/round-21/evidence/ffx2-vegnagun-shuyin-win/clips/attack-2, ffx2-leblanc-win/clips/attack.
- Evidence: critic/rounds/round-21/feel-narr/veg-attack.jpg
- Confidence: high on the numbers
- Requirement: AGENTS rule 10 (ideas need a yes)
- Fix: None until Bailey answers (D-354 ask 5 leaves the run home, 0.27-0.39 s of it, open). Nothing to build without his yes.
- Acceptance: Bailey's reaction recorded in the tile.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 151. PR-0297 [suggestion, target-registry] R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- Game / chapter: both / docs/target/targets.json group picks-0929
- Expected: Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- Observed: All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- Repro: Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- Evidence: D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- Confidence: high
- Requirement: RUBRIC §7 (delivery field, required targets)
- Fix: Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- Acceptance: node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 152. PR-0329 [suggestion, interface] PR-0329 (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON

- Game / chapter: both / pause > EYE CANDY
- Expected: As adopted in D-317 ("players who had a look off keep the new parts off").
- Observed: A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
- Repro: Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
- Evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
- Confidence: high (behaviour); taste question
- Requirement: D-317; RUBRIC section 7 (inferred items never fail a build)
- Fix: None unless Bailey wants it.
- Acceptance: Bailey's answer recorded.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

### 153. PR-0338 [suggestion, harness] PR-0338 (new, test harness): tests/unit/strategy-ffx2-bahamut.test.ts "heal-only route" takes about 10.8 s against the 15 s limit and timed out once on a loaded machine

- Game / chapter: FFX-2 / n/a (unit test)
- Expected: A unit test well inside its time limit.
- Observed: 324-file subset run: 1 failure, a timeout; re-run alone 19/19 pass in 11.8 s.
- Repro: npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts on a loaded host
- Evidence: critic/rounds/round-19b/combat/vitest-combat-subset.txt
- Confidence: high
- Requirement: test reliability
- Fix: Give that case its own timeout or fewer seeds.
- Acceptance: The case passes inside the subset run under load.
- Ship tags: introducedByCandidate undefined, regressionVsLive undefined, inNewFeature undefined
- Note: carried from round 22; not re-observed in round 23 (no evidence either way; nothing in the affected code changed in 816d80f9..d3fe9fe5 unless said)

## What stands between this build and acceptance

- The deep review cannot accept a milestone. For one: audio needs Bailey's number (PR-0148); every category at or above 9.0 (encounter 8.7, visual 8.3, feel 8.0, interface 8.7, onboarding 8.6, delivery 8.7 today); CHK-026 and CHK-027 must PASS (PR-0378, PR-0379, PR-0380); Ch XIII needs a real-key victory flow (PR-0353) and a fair Retry (PR-0407); PR-0269 and PR-0099 closed; mandatory UNVERIFIED checks (CHK-002, 015, 022, 023) evidenced; the human judgments recorded; the targets unverified and waiting settled.

## What changed since round 22 (816d80f9), no comparison with rubric v1 numbers

- Head swaps over tolerance 1,688 to 5 and feet slides 1,749 to 1 (of about 10,500); Ixion measured (CHK-026 PASS); the PR-0377 major is narrowed to polish.
- Snaps 0.56 to 0.58 a minute, double images 158 to 161, jerks 979 to 1,092 at 40 px or more: unchanged within noise; CHK-027 still FAILS in all 18 chapters.
- Real-key victories 14 of 18 to 17 of 18 (Ch II, III, V, XVI added); Ch XIII still unseen; a new fairness finding on its Retry (PR-0407).
- Repaired: PR-0385, PR-0406; PR-0382 narrowed; the title has the Gullwings key art; the 1280x720, 2560x1080 and 2560x1440 and pad gaps are closed or narrowed.
- Scores: visual 7.8 to 8.3, feel 7.8 to 8.0, interface 8.6 to 8.7, onboarding 8.7 to 8.6, delivery 8.5 to 8.7, encounter 8.9 to 8.7, combat and narrative and prep unchanged; audio still UNVERIFIED.

## Proposals (nothing here is built without Bailey's yes)

- Ch XIII Retry (PR-0407): three measured options for Bailey, none touching Trema's numbers: (a) restore the girls when a link-2 Retry starts, as the Ch XI Save Sphere checkpoint does; (b) fall back to Paragon when the carried state has one or no survivor (TR5 a); (c) leave it and say on the defeat card that Retry carries Paragon's end state. Preview: the defeat card mockup and the trema-link2-probe table (1 alive 0 of 200). Nothing is built without Bailey's yes.
- KO transition (PR-0378): if Bailey does not want the one-frame KO cut, a 6 to 8 frame matched dissolve anchored at the feet, or one painted fall frame per member. Benefit: snaps fall from 0.58 to about 0.03 a minute and CHK-027's main contributor goes. Cost: a presenter change plus a test, or 9 to 12 new paintings (art pipeline, mockup first). Fit: both games. Risk: a dissolve can read as ghosting (PR-0379). Nothing is built without Bailey's yes.
- Attack-to-follow ghosting (PR-0379): shorten the crossfade where the two silhouettes share under a fifth of their outline. Benefit: the 8-frame two-Tidus and two-Auron strips go. Fit: both. Needs Bailey's yes before the change.
- Accessibility (PR-0032): a REDUCE FLASHES row (the engine already reads a reduceFlashes flag), key remapping and a colour-vision option. Benefit: flashes hide many pose swaps and some players cannot take them. Nothing is built without Bailey's yes.
- Defeat and Ch IV victory cue (PR-0410): a short sting per game from each game's own conventions, auditioned in docs/audio/audition.html. Nothing is built without Bailey's yes.
- Critic tooling (no product change, no Bailey decision): a Ch XIII dressphere classifier in the harness (PR-0408), whole-label target matching and Esc out of submenus in the route (PR-0397, PR-0348), a longer Ch XIII budget or a human-paced run (PR-0353), print the active dressphere on each strip (PR-0420), record the renderer string and serial frame-time runs (PR-0417).

## Next review

The deep obligation stays pending: mandatory checks CHK-002, CHK-015, CHK-022 and CHK-023 are UNVERIFIED and the required coverage above was not all tested, so critic-clear settles nothing for d3fe9fe5 and the debt moves to the next build. Next batch, critic tooling first: a human-paced or 40-minute-budget Ch XIII run and the RUBRIC section 8 method check for PR-0353 and PR-0269; a Ch XIII dressphere classifier (PR-0408); the route and strip tooling items in the proposals. Product batch, in this order after Bailey's answers: PR-0407 (Retry state, his pick among three measured options), PR-0378 (KO transition, his yes), PR-0379 and PR-0380 (crossfade and boss anchors), then the polish set (PR-0411, PR-0412, PR-0413, PR-0416, PR-0386, PR-0387, PR-0354). Bailey's own work: the listening number (PR-0148, CHK-B1), a play session (CHK-B2) and the story read (CHK-B3). STALLED with a written method check owed before another attempt: PR-0148, PR-0269, PR-0353, PR-0326, PR-0099, PR-0378.

Elapsed: Wall clock of the deep workflow wf_99a69f4f-627 from the capture owner's start (about 03:08 local) to the report (about 12:45): the capture owner and the continuity harness ran about 7 hours serially, the six auditors and the fan in parallel, then the gap pass and the confirmer; the chief's own share was about 45 minutes. Repeated work avoided: round 22 narrative text, stereo image, audio pause hand-back, the full byte comparison and reward rows were reused with dependency arguments. The chief recovered the auditors' full records from the workflow journal because the prompt carried only two of six (the others were cut at 24,000 characters); every number here comes from those records or from the chief's own re-reads.

## critic-clear output (verbatim)

```text
still pending focused: mandatory checks are UNVERIFIED: CHK-002, CHK-015, CHK-022, CHK-023
  still pending deep: required coverage was not tested: CHK-022: a real-key victory for Ch XIII Trema with post-battle scene, results and board (0 of 26 real attempts plus a 28 and a 70 minute run; sixth review)., CHK-015: a real controller (only a virtual pad shim ran), the pause from a submenu and during an animation, PR-0363., CHK-023: the D-461 strike reach for fiends on a girl and the Gunner no-close case at event-locked timing (only Tidus on Mortiorchis and the Kimahri limit were seen)., CHK-008, CHK-002, CHK-010: the full 108-state matrix, pause rect measurement, 3840x2160 and 4:3, all-enemies, all-allies and aeon target sets in FFX., CHK-025: the mark key N1., CHK-B1, CHK-B2, CHK-B3: Bailey's listening score, play verdict on feel and story read for release 39.1., The CHK-017 five-second load clause (cold cache, throttled network).
```
