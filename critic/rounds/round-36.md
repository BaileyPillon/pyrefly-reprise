# Pyrefly Reprise critic, round 36 (deep review of releases 77 and 78)

```text
Build / artifact / target version: main cc0fea14a, bundle BAH_qvc7, artifact 8c31cde9e3e986fc5e4e3f593c25d6668e4922c5d99bbca62242831ea053446d, targets 1d05c392cb7a (live https://echoesofspira.com/, release 78 deployed 2026-11-09T05:54:49Z; also settles release 77, 6429ff15e)
Review: deep (live build; headless Chromium, PYREFLY_BROWSER=gpu, no black canvas)
Deployment: FAIL (exact artifact PASS: 1,190 files byte-equal, hash equal; FAIL only on CHK-017's zero-404 clause: two hidden chapters request a missing painting, PR-0664; cold load not measured)
Changed area: FAIL (mandatory CHK-011, 012, 017, 023, 026, 027 FAIL; two new majors in new features)
Ship: SHIP. No critical, no regression; both new majors sit in brand-new hidden chapters. Discloses 19 majors (PR-0667 and R78-1 new; the rest carried).
Milestone: not assessed
Quality: PROVISIONAL, no verified total (audio and onboarding UNVERIFIED, never averaged away). Scored: combat 9.4, encounter 9, visual 8.4, feel 7.6, narrative 8.3, audio UNVERIFIED, interface 7.5, onboarding UNVERIFIED, prep 9, delivery 8.3. Last full-score build: none under rubric v2 (policy: provisional while a category is UNVERIFIED).
Targets: required 32 / matched 25 / failing 0 / unverified 7 / waiting 14
Top issues: PR-0667 Youth League foes are placeholder cones (x2-yaibal art missing): new hidden feature, disclosed; R78-1 Jenova LIFE hurt/idle hard cuts, 27.6 snaps a minute, feet 48.4 px (and the Guard Scorpion): new hidden feature, disclosed; PR-0531 CHK-026 still fails in the same 7 of 19 chapters (Braska worst: head 57.9 percent, stance 254.8 px); PR-0380 CHK-027 fails in 7 of 19 chapters: 38 swap jerks of 40 px or more, worst 235.6 px; PR-0379 See-through second figures at swaps: 1,677 ms a minute over 19 chapters (fan: Kimahri revive, Ifrit hit); PR-0636 Farplane Cup duel 1 has no demonstrated sourced winning line (guard applied, remainder open); PR-0635 no natural win; PR-0613 Fallen Maesters floor 80 has no demonstrated winning line with the given party; PR-0672 FF7 Jenova LIFE has no advisor/intent/guide and E opens the pause; PR-0677 Lady Luck Change doubles gil, EXP and items with nothing learned (FFX-2); PR-0664 Youth League and Wendigo request missing painted idles: two 404s a run
Coverage: 8 tested blocks, 7 reused with reasons, 7 not-tested groups (below); requiredNotTested empty.
Next required review and why: If critic-clear accepts this report, the focused and deep obligations of releases 77 and 78 are settled and the next deep review is owed after the next deploy. It must start with the 19-chapter continuity run plus the readable hidden chapters registered (including Spherimorph, the Youth League and Omega Ruins, PR-0659), and owes: a read of the FF7 chapters with an FF7 route mode, the Jenova sensible-line win, a natural win of the Farplane Cup duels (or Bailey's answer to PR-0636), the Flooded Ways card and Dark Aeons link 4 on live, cold load and the phone profile, the accessibility rows on the new chapters, the battle screens at the wide shapes, and Bailey's listening and feel verdicts.
Elapsed review time / repeated work avoided: about 433 minutes; the engine probes and benches were compared to round 35b byte for byte instead of re-argued; the candidate continuity runs of the same bytes were reused for Jenova LIFE, Ifrit and the Guard Scorpion.
```

## Score output (verbatim from tools/critic-score.mjs)

```text
score: PROVISIONAL — no verified score for audio, onboarding (never averaged away, never zero)
below the 9 floor: visual, feel, narrative, interface, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio, onboarding
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-017 is FAIL
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - 19 critical or major issue(s) remain open
  - 7 required target(s) unverified
  - 14 required target(s) waiting
  - only 25 of 32 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148)
  - human judgment not recorded: Feel: the Tidus (Chapter I) and Rikku (Chapter IV) rigs judged in motion, the camera cuts of PR-0521, the fast-speed strike (CHK-B2, PR-0615)
  - human judgment not recorded: Encounter: is Farplane Cup duel 1 meant to be answered by the Special-dressphere Eject immunity (PR-0636), and are the Farplane duels 2 and 3, Penance and Maesters floor 80 meant to be this hard
  - human judgment not recorded: Combat: should changing into Lady Luck double gil, EXP and items with nothing learned (PR-0677)
  - human judgment not recorded: Art: the Youth League foes' painting (PR-0667), the Kilika plate (PR-0670) and the Chapter I Tidus rig look (PR-0671)
  - human judgment not recorded: Narrative and audio: should Jenova LIFE and Wendigo get scenes and music (PR-0684, PR-0676, J13, J14)
  - human judgment not recorded: Interface: should the FF7 chapter get an advisor, intent card and guide, and should Omega Ruins and Mirror Aeons get an enemy-move card (PR-0672, PR-0680, PR-0608)
  - live verification of the exact artifact is FAIL
report: valid evidence
```

## Verdicts

- **deployment** (FAIL): FAIL on one clause only. The exact artifact is verified (CHK-017 identity PASS: 1,190 files byte-equal, manifest hash 8c31cde9 equal, the live HTML names index-BAH_qvc7.js, re-checked by the chief) and the capture owner's 19 runs played clean except two hidden chapters that request a painting that is not shipped (HTTP 404, 4 console errors, PR-0664, minor, in the new chapters Youth League and Wendigo); the cold-load clause was not measured. The deployment is otherwise sound; this is a literal reading of CHK-017's zero-404 clause and is scored once, under delivery.
- **changedArea** (FAIL): FAIL: mandatory checks FAIL (CHK-011, CHK-012, CHK-017, CHK-023 audio routing of Jenova LIFE, CHK-026, CHK-027) and two new majors in new features (PR-0667, R78-1) plus the carried majors. Gains against round 35b: the Tidus and Rikku rigs are clean in their chapters and Chapter I's worst head and feet numbers fell sharply; PR-0594 and R77-4 closed on live; CHK-022 PASS for every included chapter; the Special Eject guard, the status bookkeeping fix and the cone marker are proved.
- **milestone** (not assessed): not assessed in a deep review.
- **ship** (SHIP): SHIP: this review judges the live build, so ship answers whether it should stay. No critical defect (crash, lock, lost progress, an encounter that cannot finish) was shown; no regression against release 76 was shown (the engine probes are byte-identical, the listed chapters' continuity numbers are equal or better); every new major sits in a brand-new hidden feature.

Ship reasons:
- No critical defect: all 19 listed chapters and all six new hidden chapters reach results and the board by real keys on live (Omega Ruins and Jenova LIFE after one labelled debug HP write each, precedent 34b and 35b), and every loss path offers RETRY and CHAPTER SELECT.
- No regression against the previous live build: the 20 engine probe files and the 41-cell FFX-2 hidden-chapter bench are byte-identical to round 35b, the listed chapters' CHK-026 and CHK-027 readings equal or beat round 35b (Chapter I head 93.2 to 10.8 percent), and the new rigs are clean in their chapters.
- The two new majors sit inside brand-new hidden features and do not hold the build: PR-0667 (Youth League foes drawn as placeholder cones, x2-yaibal art missing) and R78-1 (Jenova LIFE hurt/idle hard cuts, 27.6 snaps a minute); they are disclosed.
- The carried majors are not new and are disclosed: pose-swap continuity (PR-0531, PR-0584, PR-0459, PR-0380, PR-0379, PR-0570, PR-0517, PR-0660), PR-0614, PR-0603, the Farplane Cup and Maesters win gaps (PR-0613, PR-0635, PR-0636, PR-0637), PR-0148, PR-0295, PR-0567.
- The exact artifact equals the deploy manifest (verify-live PASS, hash equal); the only deployment finding is two 404s in two hidden chapters (PR-0664, minor).

## The ten categories

### combat: 9.4

Combat auditor, no browser, tree cc0fea14a (the live artifact equals the candidate byte for byte by the deploy's manifest check). Shared changes proved by running the engine: FFX default-attack id for a monster whose plain Attack is its forced action (Berserk), landed-Threaten decay and Nul-counter bookkeeping between the hits of one action, the Doublecast flag, owner-may-be-dead death handlers, the FFX-2 all-ko trigger, the FFX-2 Special-dressphere Eject guard, the FF7 reflect/statuses/perform changes. The round 35b probe suite re-run on this tree: kernel (478 checks, 0 mismatches), kernelx2 (68), immunefuzz (51,782 forks), ch3, ko, chain, aeonmenu, bahamut56, demoseeds, hidden-attack, keeperfuse, keeperautolife, maesters floors, keeperfuzz at 200 seeds, naive attack and random: all 20 result files BYTE-IDENTICAL to round 35b, so every shared change is inert for the 19 listed chapters and the earlier hidden ones. A new immunity fuzz over the three new FFX chapters (10,312 forks): 0 friendly-side immune misses, every foe-side immune miss equals the sourced status byte. The FFX-2 Farplane Cup, Bevelle Guardians and Yuna's Ballad benches (41 cells, 30 seeds, fresh seeds 1001) identical to 35b. DATA vs SOURCE: Wendigo, Spherimorph, Ifrit row 165, the Youth League eight rows (40,354 HP, 5,370 EXP, 2,760 gil, 22 AP), Omega Ruins and Jenova LIFE all equal research/*.md; data tests (57 files / 787 tests), the FF7 suite (42 files / 645 tests), the FFX status-chain and 140,000-draw sweep, the doublecast tests and the FFX-2 eject/Farplane/Ballad/Bevelle/reward/trigger tests (27 files / 491 tests) pass, 0 failures; the builder's full suite (2,161 files, 34,500 tests, 0 failed) is cited from the CHANGELOG, not re-run. Unchanged high-risk mechanic sampled: FF7 Guard Scorpion bench identical to the recorded tables. MECHANICS ON THE REAL ENGINE: a Berserk Wendigo threw only plain Attack in 2,980 of 2,980 actions; the first Guardian action is Berserk on Wendigo on 100 of 100 seeds; a Guardian killed (not Petrified) casts Protect/Shell on Wendigo from the dead on 60 of 60 seeds and never when Petrified (sourced). LIVE (gap pass, real keys): Guardians acting in a page (Auto-Potion x5, Berserk on Wendigo with banner and aura, Blizzara, Thundara), and with both Guardians set to 1 HP (one labelled write) Protect on Wendigo with Guardian A's figure gone. Jenova Reflect and a bounce shown in a page (Barret's Fire lands 128 and turns on Barret for 250). Results equal the rows (Ifrit 1,800/1,300/15, Wendigo AP 2,580 gil 3,960, Spherimorph AP 4,860 on an overkill, Omega 165,000 AP, Jenova 4,000/350/1,500). DEBITS (0.6): one new minor (PR-0677 the Lady Luck whole-ladder default doubles gil, EXP and items on a Change, reproduced, pre-existing), PR-0650 open, Special forms still have no abilities of their own so the sourced Eject immunity gives Farplane duel 1 no winning line (PR-0636 remainder). NOT SHOWN IN A PAGE: Nemesis's Armageddon and the Ultima counter on a special command, Omega Weapon's own turn (no enemy took a turn in two gap runs).

### encounter: 9

Encounter auditor, no browser: fresh seeds (2001 and up) on the real engines plus credible-wrong-line lines, all agreeing with the handoff tables. Spherimorph (100 seeds a line): advisor 100, brute siege 100, no-healing 41, careless 0, blind 2, no re-probe 0, the poison route 0. Wendigo: advisor 100, no-petrify 99, no-steal 32, no Power Break 6, front line only 0, plain 0, careless 0. Omega Ruins (40 seeds): acts I and II 40 of 40, Nemesis advisor 30 of 40 (inside the sampling band of the handoff's 68.5 percent), careless 0. Ifrit (100 seeds): advisor 97, naive 43. Youth League: acts 1 to 6 won by every informed line, defend loses every act, the whole chain 88 of 100 in one go. Jenova LIFE (200 seeds): sensible 198, sensible+Quake 199, distracted 164, attack-only 23, spam-magic 0. No boss number is disputed and nothing needs tuning; each hidden chapter has a fair informed line and a losing careless one. REAL FLOW (capture owner): Ifrit, Spherimorph, the Youth League and Wendigo won by real keys with no state write; Spherimorph, Ifrit lost by real keys with RETRY; Omega Ruins lost by real keys (68 percent chapter) and won by the accepted precedent; Jenova lost by real keys with attack only and won after one HP write. Gap pass: the Youth League RETRY returns to the act that was lost. Held at 9.0, unchanged: Farplane duel 1 about 10 percent with no demonstrated sourced answer (PR-0636 remainder, PR-0635), Fallen Maesters floor 80 (PR-0613), Trema about 60 percent at human pace (PR-0227), Mirror Aeons 74 percent (PR-0592): the code under those chapters is unchanged (probes identical), so they are carried, not re-measured. Small notes, none a defect: the Omega Zanmato lottery (36 percent for a careless opener, disclosed by the handoff), the Wendigo advisor's opening Petrify Grenade makes the Guardian half moot, the Youth League is a walkover for the informed line as the sources say.

### visual: 8.4

Live cc0fea14a / BAH_qvc7 (curl of the live index names assets/index-BAH_qvc7.js; artifact hash 8c31cde9e3e986fc5e4e3f593c25d6668e4922c5d99bbca62242831ea053446d). GPU headless Chromium (PYREFLY_BROWSER=gpu, no black canvas), seed 1, 1600x900, plus 2000x1012 and 390x844 touch. Scored from the capture owner's evidence, 25 target composites, crops and the continuity harness run on all 19 listed chapters (harness 73dc8de38682, 19 of 19 run, 10,986 s of battle, none UNVERIFIED). APPROVED ART INTACT: verify-approved with ROOT=D:/pyrefly-release55 = 1214 ok (approved 1166, judge-locked 48), 0 mismatched, 0 missing (without ROOT the tool reads the shared main tree and shows a false 19 mismatched / 47 missing, a tool default as in 34b and 35b). CREDITS: release 77's Tidus (Ch I) and Rikku Dark Knight (Ch IV) rigs hold size and feet across every swap (Tidus rig worst head 0.2 percent, feet 0 px over 8 swaps; Rikku rig head 0.3 percent over 59 swaps; Bahamut is PASS on both continuity checks) and Chapter I's worst numbers improved on 35b (head jump 93.2 to 10.8 percent, feet 14.1 to 4.9 px, now Auron's carried PR-0459); the new painted bosses are legible, grounded and face the party; the Wendigo 3D stage reads cleanly; the Mirror Aeons Sphere Level bar now reads S.LV 181 6,000/22,000 AP (PR-0594 repaired); results, title, board, prep, pause and phone surfaces match their approved tiles as adapted. DEBITS: PR-0667 (Youth League foes are procedural cone silhouettes, x2-yaibal art missing); CHK-026 still FAILS live in the same 7 of 19 chapters as 35b and CHK-027 in 7 (Leblanc joins on one jerk on a long frame, PR-0685); carried boss legibility and clumping (PR-0583, PR-0479, PR-0653); new in chapter 41 PR-0668 (Lulu in front of the boss, HP plate over her, the boss a teal boulder); PR-0670 (Ifrit stands on a plate named djose-chamber-provisional); PR-0671 (Chapter I Tidus rig reads softer in a still: a question, rigs are judged in motion); R78-1 (Jenova LIFE foot shift 48.4 px). Level with 35b: the rig and bar repairs balance the new chapters' placeholders and the unchanged continuity failures. Chapters 41, 42 and 43 were never run by the harness (PR-0659). SUB-SCORE NOTE (RUBRIC 6a, not part of this category): CHK-026 FAILS, so characterModels and animation stay capped at 7.0.

### feel: 7.6

Chief's score; the feel auditor's provisional 7.3 was written while the live 19-chapter run was unfinished and is revised now that it is complete. Live harness, 19 chapters, 10,986 s of battle, 55.5 to 59.9 fps: 0.00 snaps a minute in every chapter, 1,677 ms a minute of see-through (1,720 at 35b), CHK-027 FAIL in the same six chapters as 35b (38 swap jerks of 40 px or more, worst 235.6 px Braska) plus Leblanc on one jerk of 48.6 px on a frame over 34 ms (PR-0685). Ifrit at Kilika by the harness on the candidate: 0 snaps, 0 px worst jerk, 59.7 fps (CHK-027 PASS). Live real-key play of Ifrit (45 turns), Youth League (40 turns, 7 acts, 6 seams), Wendigo (52 turns) and all 19 listed chapters reached results with no stall. Held against that: Jenova LIFE (candidate run of the live bytes) has 45 hard cuts in 98 s, 27.58 snaps a minute against 0.25, every one an idle/hurt swap of an unregistered painted figure (R78-1), and the FF7 Guard Scorpion 2.11 a minute (36.5 px); Reflect has no on-screen mark (PR-0675); Wendigo's pre-scene is a black screen with an ENTER ADVANCE prompt for about 1.6 s (PR-0683); the first-time-fan lens kept: see-through second figures at swaps (PR-0379, Flux Kimahri revive, Ifrit Yuna hit), a camera that cuts from a close to a far shot in one frame in three chapters (PR-0521, a question for Bailey), the party pushed to the bottom edge (PR-0652). Not kept as a defect: the fan's Ifrit and Spherimorph teleports, which come from 10-frame timed sequences spaced about 180 ms apart; the frame-by-frame harness reads 0 px jerk and 0 dashes for Ifrit over 275 swaps, and the harness never ran Spherimorph (PR-0669, UNVERIFIED at frame level). The animation sub-score stays capped (RUBRIC 6a). 0.2 under 35b for the new chapters' defects.

### narrative: 8.3

Narrative auditor 8.2, +0.1 because the gap pass captured the Omega Ruins post scene (post-0..7) and the return to the board. Read the shipped scripts and the live captures. FFX-2 Ifrit at Kilika (FFX-2 only): pre and post scenes reached by real keys (Esc skip exercised); the bible's three-beat banter (Rikku sets up, Yuna reacts, Paine kills it), one sincere exchange the jokes restore ('Pest control, done! Do we get a certificate?' / 'No.'), two mid-battle callouts that name the answer without naming the button. Youth League (FFX-2 only): seven-act bracket, six barks and three callouts in the same voice, a post scene ending on Yaibal's potion callback. Spherimorph and Omega Ruins (FFX only): in character (Lulu on the element, Auron 'Go.', Yuna 'Thank you, all of you. For standing again.'). Jenova LIFE (FF7) and Wendigo (FFX) are silent by declared choice: nothing wrong or invented, but no context or aftermath for two new chapters (PR-0684). Small weaknesses: Wakka alone uses contractions, and an empty name-plate band above narration boxes. 8.7 at 35b: two of the six new chapters carry no scenes.

### audio: UNVERIFIED

UNVERIFIED, no number. No agent can hear (data only). There is no numeric owner listening verdict for the shipped mix (docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; D-804's 7/10 covers the generated music only; same as rounds 30b to 35b). The technical half PASSES on cc0fea14a / index-BAH_qvc7.js: tools/audio/qa.mjs --strict exit 0 (43 music cues -16.01 to -16.21 LUFS, worst true peak -1.48 dBTP, 0 clipped samples, every loop seam ok, SFX sprite peaks -1.11 to -1.13 dBTP, 0 findings); 319 mp3 decode with 0 errors; all 300 manifest audio files sha256- and byte-equal locally and on echoesofspira.com (285 audio/mpeg, 15 application/json); no audio file added, changed or removed between 36b6e851d and cc0fea14a so the 35 measurements carry; themes-audit.mjs exit 0; the 83 audio/music/sfx/voice/cue unit test files pass (1,306 tests). Routing from 94 snapshots in 17 capture-owner runs: 0 audio 404s, AudioContext running in all, SFX parity pack matches the game in all 17, prerendered tracks only, the right cue at the real moments (Ifrit, Youth League held through seven acts, Spherimorph, Wendigo, Omega Ruins with the Act III boss-yu-yevon crossfade, Mirror Aeons with the boss-yojimbo seam). Gaps that stop a number: Jenova LIFE is declared silent but the board's chapter-select bed plays through the fight and no victory cue plays (PR-0676); the new beds are flagged stand-ins nobody has heard (PR-0099); UI sounds in the first 2 to 13 s of a fresh profile fall back to the procedural synth in 8 of 17 runs (PR-0514, carried; 30 of 33 in round 35); sound-pass loudness unmeasured outside Chapters I and IV (PR-0588). No grade is given.

### interface: 7.5

Interface auditor, PROVISIONAL from the capture owner's evidence plus the gap pass. READ: about 60 frames and 17 run.json files at 1600x900, 2000x1012 and 390x844 touch. WORKS: 1,020 picks over 17 runs with 0 target mismatches and 0 cancel leftovers; advisor chips and cards name a legal, owned action with its menu path, cost and chance; intent cards separate SCRIPTED / MOST LIKELY / POSSIBLE with damage ranges and hit chances; the release-77 FFX cone marker reads clearly with a TARGET flag naming the figure (Wendigo, Seymour Flux, Mirror Aeons: cone and flag on the same figure); the phone target step shows a labelled BACK / ATTACK > IFRIT confirm; results counts (data-final) are internally consistent; advisor card text is 14.2 px at 1600 and 2000 and 15 px on the phone in all 14 runs. The gap pass settled the phone Spherimorph stall as a HARNESS limit: Black Magic is a paged list ('1-6 OF 8' with pager buttons) and Watera is one tap away. The DOM text floor at 1600x900 reads 14 px or more for Ifrit, Spherimorph, Omega Ruins, Youth League, Wendigo and Jenova; the phone Jenova first menu has six column labels at 9.6 px (PR-0674). PROBLEMS (minor or polish, none a regression): the FF7 chapter has no advisor, intent card or guide, its E key opens the pause and its pause is a bare window (PR-0672); the stray '()' under the Wizard Bracelet (PR-0673); Omega Ruins shows no enemy-move card and no enemy in the turn list (PR-0680); the Ifrit intent cards mix two HP bases and show a 50/50 tie as MOST LIKELY (PR-0678); the FFX-2 target ring covers the open E card (folded into PR-0502); CHK-006 FAILS again (PR-0598 at Mirror Aeons link 2). Carried and re-observed unchanged: PR-0598, PR-0518, PR-0541, PR-0516, PR-0502, PR-0644, PR-0608, PR-0543. NOT MEASURED: no 4:3, wide, 1440p or 4K shape, no FF7 target step on a phone, no touch pause walk on the new chapters. 7.6 at 35b.

### onboarding: UNVERIFIED

UNVERIFIED, no number, for the eleventh review running. The newcomer walkthrough is SIMULATED (scripted real-key and real-touch runs from a fresh profile; no human newcomer, no real phone, controller or Safari). SEEN: the title strip, Auron's skippable briefing (ENTER / ESC SKIP, D NEVER SHOW THIS AGAIN) teaching CTB versus ATB, the three-step party prep guide with ESC SKIP THE GUIDE, the first-turn coach (Rikku 'Bar's full, she's up!' in FFX-2; Auron 'He moves after you' at Wendigo), the pause OPTIONS pane, the X-2 BATTLE WAIT/ATB row flipped by real input, the typed hidden words. NOT SEEN: ACCESSIBILITY, CONTROLS and MUSIC were never opened; no TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS or COLOUR VISION row was set on the new chapters. The settings walk of 35b is REUSED (the release 77/78 source diff touches no settings, accessibility or pause file). The FF7 chapter has no prep, briefing or first-turn coach. Phone pause still hides ACCESSIBILITY behind a cut tab strip (PR-0518). Never averaged away; blocks any milestone claim.

### prep: 9

Live cc0fea14a, headless Chromium GPU. PROVED fresh on live: every results card in the 19 capture runs agrees with its sourced data (Ifrit 1,800 EXP / 1,300 gil / 15 AP / Angel Earrings at three sizes; Spherimorph gil 4,000, AP 4,860 on an Overkill, Lv.2 Key Sphere x2; Omega Ruins pooled gil 50,000, AP 165,000, Key Spheres; Wendigo AP 2,580, gil 3,960; Jenova EXP 4,000 / AP 350 / gil 1,500 / Wizard Bracelet; Youth League EXP 5,370 and AP 22). THE SPHERE LEVEL BAR (release 78 change, FFX only, declared) was recomputed from apForLevel (audit-delivery/ap-check.mjs) against six printed rows plus the Omega rows and every one agrees: Spherimorph S.LV 30 79/695, Wendigo Yuna S.LV 26 39/486, Mirror Aeons Tidus/Yuna/Lulu +1 S.Lv at 181/176/171 with 6,000/22,000, Omega 187/182/177 with 11,000/22,000 (release 77 printed 33,000/22,000). CLOSED on live: PR-0594 and R77-4 (the Omega bar over its cap). PR-0645 (Flooded Ways) is the same function: its repair is proved on two live pooled chains and by 105 unit tests, but the Flooded Ways card itself was not re-run, so it stays open, narrowed. Retry is fast: 7.3 s (Ifrit, through party prep), 7.3 s (Spherimorph), 6.1 s (Omega), 6.0 s (Jenova), inside 5.9 to 8.1 s of round 35. Loss cards are honest (Ifrit 'FELL, Defeat, TURNS 15, ATTEMPTS 1, BEST - NEVER CLEARED' with RETRY and CHAPTER SELECT). Progress is reliable: Flux, Bahamut and Mirror Aeons wins keep their clear after a real reload; the hidden wins leave the board at 19 tiles with 0 cleared; all six owed chapters carry experimental:true (ResultsScreen.ts line 171). The phone results card keeps every number readable. REUSED (third hop): prep agency (PR-0503) from 35b, no prep-tree file changed. NOT PROVED: the Flooded Ways card; an honest sensible-line Jenova win; why the Youth League prints gil 5,520 (twice its research pool of 2,760): the combat auditor traced it to a Lady Luck Change (PR-0677). Held at 9.0: +0.1 for the closures, held because prep agency is again reused.

### delivery: 8.3

Headless Chromium by Playwright from node, PYREFLY_BROWSER=gpu in all 417 capture records (no black canvas). CHK-017 exact artifact PROVED: node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/cc0fea14a.json --changed-from critic/artifacts/36b6e851d.json --sample 150 = PASS, 1,190 of 7,830 files byte-equal (every file changed since 35b plus a 150-file sample), 0 mismatched, 0 missing, 0 wrong type, the live artifact-manifest.json hash 8c31cde9e3e986fc5e4e3f593c25d6668e4922c5d99bbca62242831ea053446d equals the stored one, index.html equals the build once Cloudflare's 366-byte beacon is cut, the live HTML names index-BAH_qvc7.js (re-confirmed by the chief with curl). The full 7,830-file comparison was not run. Flows by real keys from the title on live: 8 wins in the capture owner's lane plus all 19 listed chapters in the continuity lane (every one victory, the board reached; Evrae's run continues into the following scene), 4 real losses reaching the defeat card and RETRY. 0 html-as-image in 3,561 media requests; 0 console errors anywhere except 4 on the two 404 URLs of PR-0664 (checked by the chief: both answer HTTP 404). CHK-019/018 REUSED from the focused review of the same bytes plus the stored manifest decode of 7,830 files. Frame times REUSED from the focused review (candidate = live bytes): Ifrit 59.7 fps p99 25.4 ms, Jenova LIFE 59.9 fps p99 19.0 ms, Wendigo 59.7 fps p99 16.8 ms; the live harness read 55.5 to 59.9 fps and Trema p99 96.7 ms (PR-0544). Persistence unchanged (SaveData.ts and experimentRecords.ts untouched: CHK-024 NOT APPLICABLE). DEDUCTIONS: PR-0664 -0.1; the phone profile and a browser cold load unmeasured for the seventh review (PR-0646, PR-0567); the phone Spherimorph run did not finish (harness limit, PR-0665 withdrawn); no frame time of Spherimorph, Youth League or Omega Ruins on any build; Firefox, WebKit gameplay, a real phone and a real controller not run. +0.1 for the broader real-key coverage. 8.3 at 35b, carried unchanged.

## Sub-scores (not part of the weighted score)

characterModels 7 (cap 7.0), enemyModels 7.9, animation 6.9 (cap 7.0), fidelity 8.4, camera 7.4. characterModels at its cap (seven chapters still fail CHK-026; the Tidus and Rikku rigs are measured clean); enemyModels 7.9 (the new bosses are legible; the Youth League foes are placeholders, PR-0667; Spherimorph reads as a blob, PR-0668); animation 6.9 unchanged (CHK-027 FAIL in seven chapters; Jenova LIFE's hard cuts); fidelity 8.4 unchanged; camera 7.4 unchanged (fan lens: the one-frame close-to-far cut and the party at the bottom edge, PR-0521, PR-0652). Carried by judgment, not re-derived; Bailey's calibration after he plays the release (D-426) is still planned.

Continuity: continuity harness (CHK-026/CHK-027): 19 chapter(s), 10986.1 s of battle, 55.5 to 59.9 fps, 19 of 19 run by the dedicated harness; CHK-026 FAIL (16 swap(s) change a head by more than the tolerance (worst 57.9 percent; 47.9 percent where the head is registered); 18 swap(s) of a standing figure move its feet more than the tolerance (worst 11.1 px at 1600 wide); 23 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.732 to 1.497; the bands are tools/posescale/pose-bands.mjs's); 62 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 254.8 px at 1600 wide), whatever stance the registration claims); CHK-027 FAIL (38 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 235.6 px)); 1,677 ms of see-through a minute (100.6 frames a minute at 60 Hz) Read by harness 73dc8de38682 (38 files; tree D:/pyrefly-release55 at bc93b1fdd; policy 5ef4a3ed; probe v3 2c2bfe73; pose table e38d3f0d (142 subjects); waivers a6c1b317 (102 rows)).

## Approved-target gate

required 32, matched 25, failing 0, unverified 7, waiting 14. Visual auditor's counts from critic/rounds/round-36/targets (25 in-game composites). The 7 unverified are surfaces with no r36 capture; the 14 waiting are hidden chapters with no tile and are outside the 32 required. None fails.

## Checks

| Check | Result | Mandatory | Scope | Reason (short) |
|---|---|---|---|---|
| CHK-001 | UNVERIFIED | no | audio, all chapters | Owner-only listening verdict (AGENTS.md rule 13); no agent heard the mix. mandatory:false UNVERIFIED per the precedent 30b to 35b. The technical half PASSED (qa --strict exit 0, 319 mp3 decode, 300 of 300 live audio files equal, themes-audit exit 0); item 3 (n... |
| CHK-B1 | UNVERIFIED | no | whether the music and effects are beautiful | Bailey's own listening and judgment verdict; no numeric owner verdict covers the shipped mix (D-804's 7/10 is for generated music only). The five new stand-in boss cues and the silent Jenova LIFE are owner items. |
| CHK-B2 | UNVERIFIED | no | human feel assessment | Bailey's feel verdict (the strike at fast speed PR-0615, the Tidus and Rikku rigs in motion, the camera cuts of PR-0521) is not an agent's to give; recorded false in humanJudgments. |
| CHK-002 | PASS | no | six-size pause matrix, Chapter I pause by real Escape |  |
| CHK-003 | FAIL | no | DOM text floor on the new chapters, 1600x900 and 390x844 | 1600x900 PASS: minimum 14 px and none under 14 for Ifrit (96 elements), Spherimorph (75, pause 118), Omega Ruins (83), Youth League (88), Wendigo (80), Jenova (24, minimum 16.5; pause 62); phone Ifrit, Spherimorph, Omega Ruins and Youth League minimum 14 px wi... |
| CHK-004 | PASS | no | 1,020 picks over 17 runs, desktop | Scope is legality, ownership and reachability on desktop; every card read names a move the actor has, with its menu (IN SKILL, IN ITEMS, IN SPECIAL) and cost; 0 target mismatches; the phone Spherimorph label differences came from the harness (PR-0539). FF7 Jen... |
| CHK-005 | UNVERIFIED | no | advisor on damaged or resource-starved boards, new chapters | No constructed degenerate boards (ally down, healer down, status lock, no MP) were captured for the new chapters' tactics files. Partial positives: Ifrit advises Cura to Yuna at 253/690 with Puts 437 HP back; the Spherimorph card is pinned by spherimorph-card.... |
| CHK-006 | FAIL | no | Mirror Aeons link 2 first menu | The key strip (Enter Select / G Intel / Q Defend / P Pause) is on screen at link 1 and gone at link 2 (PR-0598, carried). Target step cancel and the target overlay are clean (targets:0 in 17 of 17 runs). |
| CHK-007 | FAIL | no | polish level | The hidden-chapter tag EXP prints in player copy while EXP also means experience (PR-0681); the Jenova results item box prints an empty () (PR-0673); card copy points PR-0678 and PR-0679. No section signs, file stems, ids or debug text found in the advisor, in... |
| CHK-008 | FAIL | no | first menu and midfight of the 19 listed chapters, Spherimorph, Youth League, Omega Ruins, | Panels over painted actors and live information (PR-0502, PR-0516, PR-0552 families, carried) with new instances listed in PR-0502 and R78-4: the Ifrit intel card and Chain box over Ifrit, the guide card over Yuna in the Youth League, the bark box over the gui... |
| CHK-009 | FAIL | no | polish level | Names are whole at 1600 and 2000 in every new chapter. Phone CHANGE tiles still clip GUNNER to UNNER and GRANTS: BLUE to BLUI (PR-0518, PR-0541). New: the FF7 BARRIER header is half hidden (PR-0674). |
| CHK-010 | PASS | no | FFX and FFX-2 target steps; FF7 target step captured for Magic | Every captured FFX and FFX-2 target step shows a marker, a flag naming the target, dimmed non-targets and a visible confirm and back cue (the release 77 cone marker and TARGET flag point at the same figure in Wendigo, Flux and Mirror Aeons; phone BACK / ATTACK... |
| CHK-011 | FAIL | yes | midfight of the 19 listed chapters plus the new hidden chapters | Carried boss-legibility problems re-observed (PR-0583 Braska's Final Aeon a shoulder at the top right, Yunalesca a ghost behind the 1778 numeral, PR-0479 Flux's humanoid Seymour leaving the top edge). The new bosses are visible (Ifrit, Omega Weapon, Ultima, Ne... |
| CHK-012 | FAIL | yes | hidden chapter 42 midfight and its network log; turn strips and chips of all captured chap | The three Youth League foes draw as the presenter's procedural cone silhouettes (PR-0667); two 404s for art/characters/x2-yaibal/idle.png and no painted file in the tree. The Wendigo billboard idle.png also 404s (PR-0664; the 3D stage draws the creature). A fa... |
| CHK-013 | PASS | yes | candidate tree art against approved-hashes.json and judge-locked-hashes.json; 25 in-game c | verify-approved with ROOT=D:/pyrefly-release55: 1214 ok (approved 1166, judge-locked 48), 0 mismatched, 0 missing. Without ROOT the tool reads the shared tree (19 mismatched, 47 missing): a tool default, not a defect. The live art equals the build by the deplo... |
| CHK-014 | PASS | yes | midfight frames of the listed chapters and the new hidden chapters | The 2D party points across the field to the boss and attack and cast poses are aimed at the target; the Tidus and Rikku rigs face the boss; Wendigo's 3D party faces the creature. In Spherimorph Lulu turns toward the camera over the boss body (staging, PR-0668)... |
| CHK-015 | PASS | no | real input | Run logs show real key presses or taps (144 taps in the Ifrit phone run) for the typed hidden word, prep, scene Esc skip, N, E, G, Esc pause, tab change, target open and cancel, spherechange, results CONFIRM and RETRY; debug writes are labelled (setSeed; the O... |
| CHK-016 | PASS | yes | all 19+ run folders | Every one of the 417 capture records in evidence/index.json carries an asserted screen and state; none is verified:false; the 15 whose assertion failed are recorded UNVERIFIED and not passed (8 are the generic route's FF7 key handling in the two Jenova runs, 7... |
| CHK-017 | FAIL | yes | live build cc0fea14a | Artifact identity PASS: verify-live of critic/artifacts/cc0fea14a.json against https://echoesofspira.com/ = PASS, 1,190 files, 0 mismatched, 0 missing, 0 wrong type, manifest hash 8c31cde9... equal, the live HTML names index-BAH_qvc7.js (re-confirmed by the ch... |
| CHK-018 | PASS | yes | source and shipped build | The grep for .N.png and .raw.png in src finds one comment naming a docs concept file, no shipped path; tools/gen/manifest.mjs --check runs. The two 404 URLs are runtime-built, not hand-written. art-derive audit (0 dangling) REUSED from the focused review. |
| CHK-019 | PASS | yes | live build, all media | Stored manifest critic/artifacts/cc0fea14a.json: 7,830 files, decodeChecked true, 0 undecodable, problems only the two intentional flat paine eyeR-catch images; 3,561 media requests in the 19 round-36 runs, 0 html-as-image. Browser load of every shipped image ... |
| CHK-020 | FAIL | no | polish level, carried plus new | FFX target step prints no Enter/Esc strip while FFX-2 does (PR-0543); the FFX hidden F1-HUD chapters Wendigo and Omega Ruins show only Q DEFEND (PR-0644 family); Omega Ruins and Mirror Aeons (FFX) offer no enemy-move card while Ifrit and Youth League (FFX-2) d... |
| CHK-021 | PASS | yes | all changed systems | Every shared change has a written game case and the tests that pin it: FFX only (default-attack id, Threaten decay, Nul counters, Doublecast flag, death handlers, the Wendigo, Spherimorph and Omega Ruins rows); FFX-2 only (Special Eject guard, all-ko trigger, ... |
| CHK-022 | PASS | yes | win/loss/retry/post scene/board for chapters 41, 42, 43, 44, 46, 49 and the 19 listed chap | Every included chapter reached its destination by real keys from the title on live: the 19 listed chapters all won in the continuity lane (results and the board; Evrae continues into the following scene, its board leg carried from 35b); Ifrit (win, loss with R... |
| CHK-023 | FAIL | yes | hidden chapters 41 to 49: combat and presentation paths PASS, audio routing of Jenova LIFE | Combat and presentation: the normal runtime invokes each changed subsystem with the expected data: live logs show Spherimorph's four replies, Elemental Shift and counters, Wendigo's move list and below-half cycle, Nemesis's Cannon and Spark, Ifrit's gauge patt... |
| CHK-024 | NOT APPLICABLE | no | save and settings | Persistence did not change: git diff 36b6e851d..cc0fea14a shows src/app/SaveData.ts and src/app/experiments/experimentRecords.ts untouched, so the upgrade matrix is not owed. The lightweight reload smoke holds: the board after a real reload still lists 19 tile... |
| CHK-025 | UNVERIFIED | no | hidden chapters 41 to 49 | Hidden stays hidden: the board shows 19 tiles and no card before the words, and after every hidden win and a real reload the board reads 0 cleared; all six owed chapters are experimental:true and ResultsScreen.ts line 171 never records an experiment into the s... |
| CHK-026 | FAIL | yes | battle, every pose swap; 19 listed chapters live (win lines, seed 1, 1600x900); hidden 44, | FAIL. 19 listed chapters, fresh live runs, none UNVERIFIED: 16 swaps change a head over tolerance (worst 57.9 percent, 47.9 where registered), 18 swaps move a standing figure's feet over tolerance (worst 11.1 px), 23 swaps draw a pose outside its height band (... |
| CHK-027 | FAIL | yes | battle, every frame; 19 listed chapters live; hidden chapters from candidate runs | FAIL: 38 swap jerks of 40 px or more in one frame (worst 235.6 px, Braska); 22 of them on steady frames. Snaps 0.00 a minute in all 19 chapters (the 0.25 line does not bind there). See-through 1,677 ms a minute overall (Yunalesca 5,017, Ixion and Djose 4,943, ... |

## Encounters through their real flow

- **ffx2-ifrit-kilika** (real flow): WIN by real keys (route.mjs, 1600x900, seed 1): title, chapter select, typed word ifrit, prep, pre scene (skip via Esc exercised), fight 45 turns, results (KILIKA TEMPLE CLEARED 3:10, EXP 1,800 x3, gil 1,300, Angel Earrings), board. Also LOSS by real keys (FELL, Defeat, TURNS 15, RETRY and CHAPTER SELECT shown) and repeated win at 2000x1012 and at 390x844 touch (taps). Spherechange seen; advisor, E intent, G guide, Esc pause, target select and cancel captured. 0 console errors, 0 404. Note: Post-scene shot UNVERIFIED in the 2000 and phone runs (PR-0593).
- **spherimorph** (real flow): WIN by real keys at 1600x900 and 2000x1012 (21 turns, results CLEARED 2:10, Overkill x1, AP 4,860 x3, gil 4,000, Lv.2 Key Sphere x2, board). LOSS by real keys (FELL, Defeat, TURNS 18, RETRY shown). PHONE 390x844 touch stalled at the 900 s budget (175 turns): the gap pass showed the cause is the harness, not the product (Watera is one tap on the Black Magic pager). Note: Phone completion UNVERIFIED; PR-0665 withdrawn, PR-0539 widened.
- **omega-ruins** (real flow): Card-following route LOST in Act III, seed 1 (48 turns; the handoff bench puts the chapter at 68 percent). WIN via tools/omega-ruins-smoke.mjs against live (real keys for the board, word weapon, prep, pre scene and every command; INJECTED: party HP kept up in Act III and Nemesis HP set to 1 for the last blow, precedent 34b, 35b). Gap pass: two further real-key runs from the board to results, the post scene and back to chapter select (screen asserted; 0 of 19 beaten), one labelled Nemesis HP write each. Note: Armageddon, the Ultima counter and Omega Weapon's own turn were never reached (no enemy took a turn): UNVERIFIED in a page (PR-0686).
- **ffx2-youth-league** (real flow): WIN by real keys (40 turns, 7.28 min, seven-act flow to its end): results MUSHROOM ROCK ROAD CLEARED 6:25, EXP 5,370 x3, gil 5,520 (doubled by a Lady Luck Change, PR-0677), back to chapter select. Gap pass: a defeat in act 5 shows RETRY and CHAPTER SELECT and RETRY restores act 5, not act 1. 2 console errors = 2 requests 404 for art/characters/x2-yaibal/idle.png. Note: No lose-from-start run; the exact entry-state equality on RETRY is UNVERIFIED.
- **ff7-jenova-life** (real flow): The generic route cannot play FF7 (loses at turn 0). Dedicated real-key script: title, chapter select, typed word bluelight, first menu, N/E/G keys, Esc pause and resume; attempt 1 attack-only LOST (GAME OVER, RETRY); RETRY by Enter; attempt 2 INJECTED (one debug write: Jenova HP set to 700 at the first menu), final blows by real keys, VICTORY, results window 1 (EXP 4000, AP 350, LV38 +4000) and window 2 (GIL 1500, Wizard Bracelet), back to chapter select. 0 console errors, 0 404. Note: FF7 only. The honest win line (heals, Limits) was not played (PR-0686). Phone 390x844 not run for FF7.
- **wendigo** (real flow): WIN by real keys (route.mjs, desktop only, 52 turns, 5.08 min): 3D Meshy lake stage under aurora; results LAKE MACALANIA CLEARED 4:38, AP 2,580 x5, gil 3,960, Ability Sphere x2, Power Sphere; back to chapter select. Gap pass: a real-key attack-only run lost in 13 turns after the Guardians acted (Auto-Potion, Berserk, Blizzara, Thundara). 2 console errors = 2 requests 404 for art/characters/wendigo/idle.png. Note: Phone not applicable (desktop only by design). CHK-026 NOT APPLICABLE (3D rig).
- **seymour-flux** (real flow): FFX Chapter I (Tidus rig on by default, FFX cone marker) WIN by real keys, 53 turns, 8.62 min: results MT. GAGAZET THE PROMINENCE CLEARED 6:53 NEW BEST, AP 10,000 x4, gil 6,000, Lv.4 Key Sphere, S.Lv rows consistent, back to chapter select. Note: Rig look judged by the visual auditor from stills (PR-0671).
- **ffx2-bahamut** (real flow): FFX-2 Chapter IV (Rikku Dark Knight rig on by default) WIN by real keys, 56 turns, 7.31 min: results BEVELLE UNDERGROUND LIMBO CLEARED 5:59 NEW BEST, EXP 1,300 x3, gil 1,000, Gris Gris Bag, back to chapter select. 0 console errors, 0 404. Note: Rig look judged by the visual auditor.
- **mirror-aeons** (real flow): FFX Mirror Aeons (the listed chapter whose Sphere Level bar cap changed in release 78): the first run stalled at the default 900 s budget in link 2 (a harness budget, PR-0592); the rerun with --budget=3000000 WON by real keys in 20.12 min, 209 turns: results CLEARED 19:14 NEW BEST, AP 28,000 x3, Dark Matter x3, Tidus +1 S.Lv S.LV 181 6,000/22,000. The continuity lane also won it (209 turns). Note: PR-0594 closed on this evidence.
- **braskas-final-aeon** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 284 turns, 31.35 min; results DREAM'S END — INSIDE SIN · CLEARED RESULTS · 27:42 Victory NEW BEST AP 0 ×3 PARTY GIL 0 T Tidus S.LV 180 · 0/2; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/braskas-final-aeon-win-r36
- **evrae-airship** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 83 turns, 9.96 min; results DECK OF THE FAHRENHEIT — THE APPROACH TO BEVELLE · CLEARED RESULTS · 6:22 Victory NEW BEST Okay. Next one. AP ; the run continued into the following scene and chapter (results reached; the board leg for this chapter is carried from 35b).  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/evrae-airship-win-r36
- **ffx2-den-of-woe** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 27 turns, 6.01 min; results DEN OF WOE — UNDER MUSHROOM ROCK ROAD · CLEARED RESULTS · 4:36 Victory NEW BEST EXP 4,200 ×3 PARTY AP 20 PER D; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/ffx2-den-of-woe-win-r36
- **ffx2-fallen-aeons** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 55 turns, 8.52 min; results ROAD TO THE FARPLANE · CLEARED RESULTS · 7:03 Victory NEW BEST EXP 23,000 ×3 PARTY AP 54 PER DRESSPHERE GIL 7,; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/ffx2-fallen-aeons-win-r36
- **ffx2-ixion-djose** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 29 turns, 4.43 min; results DJOSE TEMPLE — CHAMBER OF THE FAYTH · CLEARED RESULTS · 2:30 Victory NEW BEST EXP 2,600 ×3 PARTY AP 15 PER DRE; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/ffx2-ixion-djose-win-r36
- **ffx2-leblanc** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 69 turns, 11.12 min; results CHATEAU LEBLANC, GUADOSALAM · CLEARED RESULTS · 8:57 Victory NEW BEST We got it back. EXP 1,620 ×3 PARTY AP 11; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/ffx2-leblanc-win-r36
- **ffx2-trema** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 226 turns, 23.95 min; results VIA INFINITO — CLOISTER 100 · CLEARED RESULTS · 21:50 Victory NEW BEST EXP 23,000 ×3 PARTY AP 52 PER DRESSPHER; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/ffx2-trema-win-r36
- **ffx2-vegnagun-shuyin** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 92 turns, 16.21 min; results HEART OF THE FARPLANE — VEGNAGUN’S CHAMBER · CLEARED RESULTS · 13:34 Victory NEW BEST ...Let's go home. EXP 18; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/ffx2-vegnagun-shuyin-win-r36
- **isaaru-via-purifico** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 38 turns, 5.81 min; results VIA PURIFICO — BENEATH BEVELLE · CLEARED RESULTS · 4:32 Victory NEW BEST ...I'm sorry, Isaaru. AP 5,000 ×1 PAR; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/isaaru-via-purifico-win-r36
- **seymour-anima-macalania** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 58 turns, 7.41 min; results MACALANIA TEMPLE — THE ANTECHAMBER · CLEARED RESULTS · 5:41 Victory NEW BEST ...We won, right? AP 5,080 ×4 PAR; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/seymour-anima-macalania-win-r36
- **seymour-natus** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 26 turns, 3.79 min; results HIGHBRIDGE OF BEVELLE — BEFORE THE MAIN GATE · CLEARED RESULTS · 2:40 Victory OVERKILL ×1 NEW BEST AP 9,450 ×5; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/seymour-natus-win-r36
- **seymour-omnis** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 92 turns, 10.54 min; results INSIDE SIN — THE GARDEN OF PAIN · CLEARED RESULTS · 8:57 Victory NEW BEST AP 24,000 ×4 PARTY GIL 12,000 ITEMS ; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/seymour-omnis-win-r36
- **sin-face** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 45 turns, 4.66 min; results DECK OF THE FAHRENHEIT — ABOVE BEVELLE · CLEARED RESULTS · 3:28 Victory NEW BEST ...Okay. Next one. AP 20,000 ; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/sin-face-win-r36
- **sin-fins-core** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 321 turns, 22.89 min; results DECK OF THE FAHRENHEIT, THEN SIN'S BACK — IN FLIGHT · CLEARED RESULTS · 20:43 Victory NEW BEST ...Okay. Next o; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/sin-fins-core-win-r36
- **yojimbo-cavern** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 14 turns, 3.41 min; results CAVERN OF THE STOLEN FAYTH — THE LAST CHAMBER · CLEARED RESULTS · 2:08 Victory NEW BEST AP 0 ×3 PARTY GIL 0 L ; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/yojimbo-cavern-win-r36
- **yunalesca** (real flow): WIN by real keys on live in the continuity lane (harness 73dc8de38682, seed 1, 1600x900): 138 turns, 14.57 min; results ZANARKAND DOME — THE GREAT HALL · CLEARED RESULTS · 12:27 Victory NEW BEST ...Okay. Next one. AP 14,000 ×4 PAR; back to chapter select, board 19 tiles.  console errors, 0 not-found. Note: Played for the continuity phase; evidence under critic/rounds/round-36/continuity/yunalesca-win-r36

## Coverage matrix

**Tested**
- Live exact artifact: verify-live PASS (1,190 of 7,830 files byte-equal, 0 mismatched, manifest hash equal), the index names index-BAH_qvc7.js (curl by the chief), 300 of 300 audio files equal.
- All 19 listed chapters won by real keys on live in the continuity lane (harness 73dc8de38682, 10,986 s of battle, 19 of 19 run); Seymour Flux, FFX-2 Bahamut and Mirror Aeons also in the capture owner's lane.
- Six new hidden chapters by real keys on live: Ifrit (win at 1600, 2000 and 390 touch; loss), Spherimorph (win at two sizes; loss), the Youth League (seven acts; a defeat in act 5 with RETRY to act 5), Wendigo (win; a real loss with the Guardians acting), Omega Ruins (a real-key loss, the one-write smoke, two further one-write runs through the post scene to the board), Jenova LIFE (a real-key loss, a one-write win).
- Engine: 20 probe files byte-identical to 35b, fresh-seed benches of the six new chapters, an immunity fuzz of the three new FFX chapters, data audits against research notes, the Wendigo Berserk and from-the-dead properties, the Lady Luck reward trace, 100+ audio and 250+ chapter unit test files.
- Audio technical half: qa --strict, decode of 319 mp3, live fetch of 300 files, themes-audit, routing from 94 snapshots in 17 runs, plus Jenova, pause and title snapshots in the gap pass.
- Interface: about 60 frames at three sizes, 1,020 picks, target cancel in 17 of 17 runs, the DOM text floor on six new chapters at two sizes, the Jenova Magic list and Reflect.
- Prep: every results card against its source row, the Sphere Level bar recomputed, retry timings, progress after a real reload.
- The first-time-fan lens over the sequence sheets (breakers turned into issues or noted as not kept).

**Reused (with the reason)**
- Farplane Cup duels, Fallen Maesters floor 80, Spectral Keeper, Penance, Trema and Mirror Aeons real-key outcomes (rounds 35 and 35b). From critic/rounds/round-35b.json. The code under those chapters is unchanged (the 20 byte-identical probe files and the identical 41-cell FFX-2 hidden-chapter bench), the Special Eject guard starts in no shipped build, settings and targets are unchanged; open related defects PR-0635, PR-0636, PR-0613, PR-0227, PR-0592, PR-0650 stay carried.
- Hidden Jenova LIFE, Ifrit at Kilika and FF7 Guard Scorpion continuity (CHK-026, CHK-027). From critic/reviews/cc0fea14a-focused/continuity. Candidate runs of the same bytes (verify-live PASS, hash equal), same harness id 73dc8de38682, GPU mode; no product commit since.
- Frame rates and p99 of Ifrit, Jenova LIFE and Wendigo. From critic/reviews/cc0fea14a-focused.json. Candidate bytes equal the live artifact; same headless GPU Chromium; labelled reused, not measured on live.
- art-derive verify and audit, art-browser-load (5,799 images in Chromium and WebKit), the stored manifest decode of 7,830 files. From critic/reviews/cc0fea14a-focused.json, critic/artifacts/cc0fea14a.json. Every file changed since the previous deep decode was compared byte-equal to the stored manifest; no art or src path literal changed after the focused review.
- Six-size pause matrix and the accessibility settings walk (CHK-002, onboarding). From critic/rounds/round-35b.json. git diff 36b6e851d cc0fea14a lists no pause, layout, settings or accessibility file.
- Prep agency (tab walk, Ink & Gold prep tabs, Yuna's Ballad one-girl party). From critic/rounds/round-35b.json. Third hop; no file under the prep tree changed (only results files did); PR-0503 stays open.
- FFX status bookkeeping sweep and the event-log hash replay of every chapter (r78-fix2). From the builder's handoff. Context only; the chief's confirmation is the byte-identical probe suite and the status-chain and 140,000-draw sweep tests passing on this tree.

**Not tested (owner-only items and gaps, each with its reason in the checks)**
- CHK-001 and CHK-B1: Bailey's listening verdict (owner-only; mandatory:false UNVERIFIED, precedent 30b to 35b). CHK-B2: Bailey's feel verdict.
- CHK-026 and CHK-027 for hidden chapters 41 Spherimorph, 42 Youth League and 43 Omega Ruins (never run by the harness, PR-0659) and the frame-difference read of the 3D chapters (Wendigo, yrp, waker, gear); CHK-026 is NOT APPLICABLE for painted pose swaps there.
- Cold load under 5 seconds and the phone-profile load (PR-0646, PR-0567, seventh review); Firefox, WebKit and Safari gameplay, a real phone, a real controller; a frame-time measure of Spherimorph, Youth League and Omega Ruins.
- The Farplane Cup natural wins, Penance, the Keeper and Maesters floor 80 at human pace (PR-0635); Dark Aeons link 4 (PR-0637) and the Flooded Ways results card (PR-0645) on live; Nemesis's Armageddon, the Ultima counter and Omega Weapon's own turn in a page.
- An honest sensible-line Jenova LIFE win; Jenova LIFE on a 390x844 phone; the FF7 Limit list; Spherimorph to results on a phone by touch.
- The accessibility rows (TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION) on the new chapters, CONTROLS and MUSIC panes; 4:3, wide, 1440p and 4K shapes; a localStorage dump for chapters 41, 42, 43 (CHK-025).
- Degenerate-board advisor cases for the new chapters (CHK-005); the fast-speed routes of PR-0614; the Youth League RETRY entry-state equality.

**requiredNotTested:** none (every owner-only or unrun item above is listed in notTested with its reason).

## Ranked issue list (178 open: 19 major, 105 minor, 54 polish; 26 new or renamed this round)

Ranking: critical, major, minor, polish; inside a severity the issues first seen or widened this round come first, then the carried ones. Each carries its tags (introducedByCandidate / regressionVsLive / inNewFeature) for the ship decision. Carried issues keep the full text and history in the JSON.

1. **PR-0667** [major, visual, FFX-2 only] Youth League (chapter 42): the three foes draw as procedural cone silhouettes because art/characters/x2-yaibal/idle.png does not exist
   - Chapter and state: 42 Youth League Tournament, act 1, midfight / hidden chapter 42 (word youth), midfight, seed 1, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Yaibal and the two League Warriors are dark cone silhouettes with a glowing eye and a ring, not painted figures. public/art/characters has no x2-yaibal folder and the live URL answers 404 for the idle (confirmed by the confirmer and again by the chief with curl, the .webp too). The handoff (docs/handoff/ch-youth-league.md) lists the art as optional, painted only if the art lane reads it.
   - Expected: Every foe of a shipped encounter has its painted idle (CHK-012: a fallback never ships as the final face).
   - Repro: https://echoesofspira.com/ , chapter select, type youth, play to the first act; seed 1, 1600x900. route.mjs ffx2-youth-league win.
   - Evidence: critic/rounds/round-36/evidence/ffx2-youth-league-win/ffx2-youth-league-win-r36/23-midfight.png; critic/rounds/round-36/evidence/ffx2-youth-league-win/ffx2-youth-league-win-r36/network-media.json
   - Requirement: CHK-012; RUBRIC section 6 milestone gate (no required final asset is missing); where: public/art/characters/x2-yaibal (missing); the presenter placeholder path
   - Smallest fix: Paint and register idle/attack/hurt/ko (and the 2x idle) for Yaibal and the League types, or keep the chapter off the door until they exist. New hidden feature: disclose rather than hold. Art is the driver's delegated pick; approved art is not touched.
   - Acceptance: A Youth League route run: zero 404s for art/characters/x2-*, the midfight frame shows painted foes; art-derive verify and audit pass.
2. **R78-1** [major, feel, FF7 only (hidden chapter 44, with the Guard Scorpion in the same family)] Jenova LIFE: the painted idle and hurt frames hard-cut with a 48.4 px foot shift, 27.6 snaps a minute (CHK-026 and CHK-027 FAIL)
   - Chapter and state: 44 Jenova LIFE (word bluelight); FF7 Guard Scorpion / candidate harness run of the live bytes (ff7-jenova-life-win-cc0fea14a), seed 1, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high on the measurement; reused, not re-measured on live.
   - Observed: 45 swaps in 97.9 s, 38 of them move a standing figure's feet over tolerance (worst 48.4 px, Barret idle to hurt), heads up to 11.9 percent (read by figure mass, FF7 frames carry no registration), 27.59 snaps a minute against the 0.25 line. The strip shows the hurt frame redrawn lower and larger with a colour flash and no in-between frame. The Guard Scorpion shows the same kind at 2.11 snaps a minute and a 36.5 px swap jerk, identical on live and on the candidate. Reused from the focused review under a written dependency argument (live bytes equal the candidate by the deploy manifest check; same harness id 73dc8de38682 and GPU mode; no product commit since); the confirmer re-read the stored s ...
   - Expected: Hurt and idle frames registered to one foot line with a short blend; snaps at most 0.25 a minute.
   - Repro: Chapter select, type bluelight, play to a first hit; node critic/runner/lib/continuity.mjs --chapters=ff7-jenova-life. Strips swap-004-barret-idle-hurt, swap-033-barret-hurt-idle, swap-005-tifa-hurt-idle.
   - Evidence: critic/reviews/cc0fea14a-focused/continuity/continuity-summary-ff7-jenova-life.json; critic/reviews/cc0fea14a-focused/continuity/ff7-jenova-life-win-cc0fea14a/continuity/strips/swap-004-barret-idle-hurt.jpg
   - Requirement: CHK-026, CHK-027, RUBRIC 6a
   - Smallest fix: Register the FF7 hurt frames to the idle feet, or hold the idle frame under the hurt flash, or give the swap a short crossfade.
   - Acceptance: Harness on ff7-jenova-life: CHK-026 and CHK-027 PASS, 0.25 or fewer snaps a minute.
3. **PR-0584** [major, visual, FFX] Chapter III Braska: pose swaps still change head, height and stance and Auron/Yuna/Tidus jerk up to 224.5 px at the victory cheer and the critical swaps (CHK-026 and CHK-027 FAIL; teleports repaired; the focused review's R72-2)
   - Chapter and state: Chapter III braskas-final-aeon / treated Chapter III, end of fight, harness swaps 1171, 1172 and 1767. Last seen: round 36. Tags: introduced false, regression false. Confidence: high for the measurement; medium for what the player sees at the cheer.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE (3 harness reads): Braska head 57.9 percent, 21 swaps out of the height band, stance 254.8 px, swap jerk 235.6 px, feet 11.1 px; still the worst chapter. Carried, not improved. FRESH (this review, harness 5e1bbdec47c9, seed 1, 1600x900, 1,661.9 s of battle, 1,425 swaps counted): CHK-026 FAIL: 58 head swaps over tolerance (worst 94.4 percent where registered; 762 of the swaps are across a recorded hold and read up to 95.1 percent from the idle), 8 feet moves over 2 px (worst 14.5 px), 21 swaps outside the height band (stature 0.732 to 1.499), 17 silhouette-stance misses (worst 270.6 px). CHK-027 FAIL: 9 swap jerks of 40 px or more (worst ...
   - Expected: Head within 3 percent where registered, feet within 2 px, no single-frame step of 40 px or more at a swap (CHK-026, CHK-027).
   - Repro: Chapter III to the end; harness swaps 1171, 1172, 1767; strip jerk-046-auron.
   - Evidence: critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/strips/swap-919-tidus-critical-idle.jpg; critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/strips/swap-1171-tidus-idle-victory.jpg
   - Requirement: CHK-026
   - Smallest fix: Register the Chapter III critical and victory paintings in docs/target/pose-measure.json, or decide with a probe whether swaps under the victory close-up are excused by a written rule (the question PR-0584 asked in round 32b); the method check of proposal 1 comes first.
   - Acceptance: Harness on braskas-final-aeon: CHK-026 and CHK-027 PASS, or a written rule excuses the swaps under the victory camera and the harness applies it.
4. **PR-0459** [major, visual, FFX only] Chapter I (FFX): Auron's head changes 9.3 percent at two swaps and one swap draws him at stature 0.765 (CHK-026 FAIL, still open, a fourth deep review)
   - Chapter and state: seymour-flux / Auron attack/follow/idle swaps, killing-blow close-up. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE: Chapter I head 10.8 percent, feet 4.9 px, one swap out of the band (stature 0.766); the Tidus rig is clean, what remains is Auron's carried swaps. Numbers better than 35b (93.2 percent, 14.1 px). Chapter I (FFX): Seymour Flux CHK-026 FAIL again (max head jump 10.8 percent, 1 stature miss); the strips were not re-read for Auron specifically this round. Carried; folded into PR-0531's numbers. ROUND 33: Fresh Flux harness: head worst 10.8 percent (9.4 where registered), 2 head swaps over tolerance, one swap outside the height band (stature 0.765): the same readings as round 32b. ROUND 34 (build 2342fe666): Chapter I fresh live harness run ...
   - Expected: Head within 3 percent at every swap (CHK-026).
   - Repro: Continuity harness, seymour-flux, seed 1, 1600x900; strips swap-265-auron-follow-idle.jpg and the Auron entries of continuity.json.
   - Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json; critic/rounds/round-34/continuity/seymour-flux-win-r34/continuity/continuity.json; critic/reviews/2342fe666-focused/continuity/c1-N/continuity-summary.json
   - Requirement: CHK-026
   - Smallest fix: Method check first (RUBRIC section 8; stalled since round 29): read the two strips, re-register Auron follow to the idle head, re-run Chapter I.
   - Acceptance: Chapter I harness: Auron worstHeadPct under 3 and heightOver 0.
5. **PR-0531** [major, visual, both] Figures still change head, height or feet at pose swaps: CHK-026 FAILS in 7 of the 19 chapters the harness read on this build (full 19-chapter read, round 34b; 12 of 19 in round 33b, 13 in round 32b); Lulu's rig head is repaired and Isaaru passes
   - Chapter and state: 7 of 19 chapters: seymour-flux, yunalesca, braskas-final-aeon, seymour-anima-macalania, ffx2-fallen-aeons, ffx2-trema, ffx2-ixion-djose / every pose swap of 19 chapters won by real keys, live, 1600x900, seed 1. Last seen: round 36. Tags: introduced false, regression false. Confidence: high (all 19 chapters read on this build, one run, one harness).
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE 19-chapter harness (73dc8de38682, 10,986 s of battle, none UNVERIFIED): CHK-026 FAIL in the same seven as 35b (Seymour Flux, Yunalesca, Braska, Anima/Macalania, Fallen Aeons, Trema, Ixion and Djose): 16 swaps change a head over tolerance (worst 57.9 percent, 47.9 where registered), 18 move a standing figure's feet over tolerance (worst 11.1 px), 23 draw a pose outside its height band (stature 0.732 to 1.497), 62 move the silhouette stance (worst 254.8 px). The Tidus and Rikku rigs add none (0.2 and 0.3 percent); Chapter I improved on 35b (head 93.2 to 10.8 percent, feet 14.1 to 4.9 px). The hidden Ifrit at Kilika adds R78-2 (band only). ...
   - Expected: Head within 3 percent, standing feet within 2 px at 1600 wide, stature inside the pose band at every swap (CHK-026).
   - Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); the 19-chapter run of this round is critic/rounds/round-31/continuity
   - Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-trema-win-r32/continuity/strips/swap-207-paragon-idle-cast.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/swap-1172-yuna-idle-victory.jpg
   - Requirement: CHK-026, RUBRIC 6a (Bailey 2026-10-04: "characters change size and height across poses ... ruins the immersion")
   - Smallest fix: Re-register the pose paintings the strips name to the idle head and ground line (registration, never a repaint on taste), refit the Den of Woe and Ixion poses outside their height band, and have the harness read the head from the part's own box for rig figures; do not loosen the tolerance. A written method check is owed before a third batch (RUBRIC section 8: open in rounds 29, 30, 30b, 31).
   - Acceptance: Harness on Chapters I, IV, VII, IX, XI, XII, XIII, XVI: feet, height and stance lists empty outside written waivers; the five named strips show one size.
6. **PR-0380** [major, feel, both] CHK-027 FAILS in 6 of the 19 chapters (full read, round 34b): Yunalesca 4 swap jerks of 40 px or more (worst 103.7 px), Braska 8 (224.5 px), Den of Woe 7 (169.8 px), Sin core 6 (172.0 px), Vegnagun 5 (201.6 px), Fallen Aeons 5 (48.2 px); 35 in all (round 33b: 54); 0 teleports; Anima, Isaaru and the rest pass
   - Chapter and state: II, III, V, XI, XII, XIV, XVII, XIX (yunalesca, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-fallen-aeons, ffx2-trema, ffx2-den-of-woe, sin-fins-core, mirror-aeons) / every frame of every fight, 19 chapters, live. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE: CHK-027 FAIL in 7 of 19 (Yunalesca 86.7 px, Braska 235.6, Vegnagun and Shuyin 200.4, Fallen Aeons 48.7, Den of Woe 168.1, Sin fins and core 172.1, and Leblanc 48.6 on a long frame, filed as PR-0685); 38 swap jerks of 40 px or more in all (22 on steady frames), snaps 0.00 a minute, 220 mid-move dashes of 40 px or more reported not gated (worst 272.5). Round 35b read 6 of 19. Harness: 34 swap jerks of 40 px or more (worst 227.3 px, Braska), 3 mid-move teleports of 300 px or more (340 px, Braska Tidus: PR-0581), 138 dashes over the fail line (worst 294.5 px), 175 jerks over the fail line; snaps 0.00 a minute (the 7.5 animation cap does no ...
   - Expected: No jump of 40 px or more in one frame at a pose swap, or a swap that happens under a cut with no ghost (CHK-027).
   - Repro: Continuity harness, ffx2-vegnagun-shuyin and sin-fins-core, seed 1, 1600x900 (strips under critic/rounds/round-31/continuity/<chapter>-win-r31/continuity/strips)
   - Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-den-of-woe-win-r32/continuity/strips/jerk-004-rikku.jpg; critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg
   - Requirement: CHK-027 (Bailey 2026-10-04)
   - Smallest fix: Start with the Sin fins/core and Vegnagun swap lists (the worst two); register Ixion hurt and KO to one feet anchor; extend the registered stance to the poses the lists name. Method check owed (RUBRIC section 8).
   - Acceptance: Harness on the eight chapters: swap jerks over the line under 10 in total.
7. **PR-0379** [major, feel, both] See-through cross-dissolves at pose swaps: 1,720 ms a minute over all 19 chapters (round 33b: 1,831), worst severity 0.381; Yunalesca 5,014, Ixion 4,757, Sin face 2,718 and Trema 2,701 ms a minute stay over
   - Chapter and state: worst: Yunalesca 5,014, Ixion 4,757, Sin face 2,718, Trema 2,701 ms a minute (14 of 19 chapters over 1,000) / all fights, live, ?swapscope=wide default in 13 chapters. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE: 1,677 ms a minute of see-through over 19 chapters (35b 1,720), worst Yunalesca 5,017, Ixion and Djose 4,943, Sin face 2,651, Trema 2,594, worst severity 0.381, none over the fail line. FIRST-TIME FAN, kept: a see-through second Kimahri over the solid knocked-out one at the Phoenix Down revive in Chapter I (seq-party-action f07), a doubled pink Yuna when Ifrit hits her (seq-transition-into-battle f08, polish), and a see-through Tidus run-in in Spherimorph (PR-0669). Not kept as defects: the fan's Ifrit teleports (timed-sequence frames about 180 ms apart; the frame-by-frame harness reads 0 px jerks and 0 dashes over 275 swaps). Harness:  ...
   - Expected: Under 1,000 ms a minute of see-through in every chapter (the issue's own line).
   - Repro: Continuity harness, any chapter, seed 1.
   - Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-33/evidence/ffx2-ixion-djose-win-r33/seq-spherechange/f03.jpg; critic/rounds/round-33/evidence/yunalesca-win-r33/seq-party-action/f01.jpg
   - Requirement: CHK-027 item 3
   - Smallest fix: Continue the planned list: Evrae head registration, Sin face lunge return, Yunalesca planned cuts over 120 px, then move each of the four exceptions to the wide scope when its blocker clears.
   - Acceptance: All 19 chapters under 1,000 ms a minute or named exceptions.
8. **PR-0570** [major, feel, FFX only (Chapter I Tidus; Chapter II Tidus peaks 39.3 px and Chapter IV Rikku 30.9 px, no step)] Chapter I Tidus's revive steps 89 px sideways in one frame at +117 ms (r68 removed the first-frame pop; the step moved later)
   - Chapter and state: seymour-flux / Tidus revived from knock-out, 60 Hz stepped frames, live. Last seen: round 36. Tags: introduced unknown, regression false. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE: Seymour Flux CHK-027 PASS, 0 swap jerks; the revive step was not isolated; the fan saw a see-through Kimahri at the revive (PR-0379). Release 69 fixed this: the revive slide target is read once at revive start (unit suite revive-follows-slide passes; Mega Phoenix and Phoenix Down revives resolve through the real menu in the Chapter I runs). The harness's Chapter I run lists no one-frame revive step of Tidus over the fail line (seymour-flux CHK-027 PASS, 0 swap jerks), but Tidus head moves of 80 to 162 px at swaps under a smear are present (frames 22585, 11541, 22705). The revive step itself was not isolated, so the fix is probable and  ...
   - Expected: No step over 40 px in one frame of a revive (CHK-027 item 4).
   - Repro: https://echoesofspira.com/?coach=off, Chapter I, seed 1: let Kimahri fall, revive him or Tidus (Mega Phoenix or Phoenix Down); record 60 Hz stepped frames and track the standing plane (probe D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/lib).
   - Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json; critic/rounds/round-32/evidence/seymour-flux-win-r32/turn-log.json; critic/rounds/round-33/continuity/yunalesca-win-r33/continuity/continuity.json
   - Requirement: CHK-027 item 4; parent PR-0473
   - Smallest fix: Isolate the Chapter I revive in the harness (Tidus after Phoenix Down at +117 ms) and read the plane step; close if under 40 px.
   - Acceptance: One revive strip of Tidus with a plane step under 40 px at +117 ms.
9. **PR-0517** [major, visual, FFX-2 only] FFX-2 Chapter IV: Rikku's and Paine's attack and ready poses still read as a different-sized figure from their idle (carried; r68's ready hold did not change it)
   - Chapter and state: ffx2-bahamut / Paine attack to follow, Rikku attack to follow and idle to attack. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium (one strip read in full by the chief; the others by their headers).
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): FRESH LIVE: FFX-2 Chapter IV with the Rikku Dark Knight rig on by default is PASS on both checks (head 0.6 percent over 290 swaps, feet 0.3 px, 0 swaps out of band); the Leblanc reading above is not re-observed in a still this round. Not closed: Leblanc and the painted Paine poses are not covered by the rig and the harness passes registered poses by construction (PR-0534). Carried. The fan strips show it again in Leblanc: Rikku grows to about 1.4 times when her ready stance starts (ffx2-leblanc seq-action-playing frames 6 to 9, seq-party-action frames 0 to 1), and Ormi's Shield Bash lunge is a pink ghost that pops back to its seat (a double-image  ...
   - Expected: A figure keeps one size across a pose change (CHK-026; Bailey 2026-10-04).
   - Repro: Continuity harness ffx2-bahamut, seed 1, 1600x900.
   - Evidence: critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-202-paine-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-207-rikku-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-267-rikku-idle-attack.jpg
   - Requirement: CHK-026, PR-0517 (ask Bailey: repaint or register only; human judgment unrecorded)
   - Smallest fix: Register the attack and follow paintings to the idle head and ground line (or give the swap a smear cut); Bailey decides whether the Dark Knight and Warrior ready poses are repainted.
   - Acceptance: Strip header real head within 3 percent for the named swaps; harness stays PASS.
10. **PR-0636** [major, combat, FFX-2] The sourced rule "a girl in a Special dressphere cannot be Ejected" is not applied by the FFX-2 engine, which leaves Farplane Cup duel 1 at about 10 percent
   - Chapter and state: 38 Farplane Cup (word duelist), duel 1; any FFX-2 chapter whose foe Ejects / engine probe and seeded benches, fresh seeds 1001 and up; the live autoplayer lost duel 1 on pinned seeds 1 to 5. Last seen: round 36. Tags: introduced false, regression false, new feature. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): ROUND 36: the release 77 Special-dressphere Eject guard is applied (12 tests, 9 fail without it, the Eject byte 255 for a Special wearer) and no shipped build starts in a Special; the remainder stands: Special forms still have no abilities of their own, so the sourced immunity gives Farplane duel 1 no winning line. Not re-run live. ROUND 35B: the Farplane Cup lane played the chapter by real keys on live with the curtains line (handoff 6): duel 1 (Auron) 0 natural wins in 8 fights (7 defeats, one more after a failed 15,000-HP write that Auron's heal under an eighth of his HP undid), duel 2 (the masked duelist) 0 in 6, duel 3 (Seymour) 0 in 3; each  ...
   - Expected: research/ffx2-combat-core.md sections 2.8 and 3.15 ([verified: 2 sources]): characters in a Special dressphere cannot be Ejected, so the sourced answer to Shooting Star (walk the grid to Special Dress Up) is a real tactic.
   - Repro: From critic/rounds/round-35/combat: node --no-warnings --experimental-transform-types p3.mjs (Floral Fallal on all three girls, 8 boss actions, seeds 2001 to 2020) prints specialWearersEjectedSomeone 16 and normalDressEjectedSomeone 16; bench-ffx2.mjs ONLY=cup N=30 seeds 1001 to 1030.
   - Evidence: critic/rounds/round-35/combat/p3.mjs; critic/rounds/round-35/combat/bench-ffx2.log; docs/handoff/ch-farplane-cup.md section 6
   - Requirement: Faithful FFX-2 mechanics from the sources (AGENTS.md rule 6); fair, answerable encounters
   - Smallest fix: Apply the sourced rule in the FFX-2 status resist read: a girl whose current dressphere is a Special has Eject resist 255 (the handoff names adapt/inputs.ts hitTarget and words.ts resistTables; not traced by the critic). Shared engine plumbing, so Bailey's call; the smaller alternative is to state the engine's behaviour on the duel 1 prep card.
   - Acceptance: p3.mjs reports 0 of 20 for the Special wearer and an unchanged 16 of 20 for the normal dress; the farplane-cup bench with Special-form girls wins near the Eject-proof row (95 of 100); the Leblanc Eject tests still pass.
11. **PR-0637** [major, interface, FFX] Dark Aeons link 4 (the second Dark Ixion) opens the strategy guide on Dark Valefor's card (HP 800,000, "She resists every element")
   - Chapter and state: 34 Dark Aeons (word darkaeon), link 4 first menu and seam / guide open at the first menu of link 4, seed 1, 1600x900, real keys; two independent frames agree. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high on the observation, traced on the cause.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Release 77 changed the Dark Aeons link-4 guide anchor; Dark Aeons was not played this round, so the repair is not verified live and the issue stays open. The card reads Dark Valefor, BOSS BATTLE, HP 800,000, WEAKNESSES None, while Ixion's painting is on screen and the advisor says "Quick Hit -> Dark Ixion". Links 2, 3, 5 and 6 show their own foe. Traced by the confirmation pass: in src/data/guides/docs/dark-aeons.ts the "dark-ixion" head is anchored only at "dark-ixion" and no block anchors "dark-ixion-2"; startBlockIndex (src/ui/common/guideDoc.ts) matches nothing and falls back to block 0, which is Valefor.
   - Expected: The guide names the foe on screen with its own HP and text (the guide id list has dark-ixion-2).
   - Repro: Chapter select, type darkaeon, Enter through prep and the scene, win links 1 to 3, leave the guide open at the link 4 first menu (critic/rounds/round-35/evidence/dark-aeons-win-r35/24-seam-4-first-menu.png).
   - Evidence: critic/rounds/round-35/evidence/dark-aeons-win-r35/20-link-4.png; critic/rounds/round-35/evidence/dark-aeons-win-r35/24-seam-4-first-menu.png; critic/rounds/round-35/interface-crops/dark-link345.png
   - Requirement: CHK-004, CHK-009: honest information in the strategy guide (RUBRIC section 6, interface)
   - Smallest fix: Add dark-ixion-2 to the Ixion head's anchors in src/data/guides/docs/dark-aeons.ts (or give it its own block).
   - Acceptance: A unit test opens the guide at each of the seven Dark Aeons links and asserts the card title equals the foe's name; the link 4 capture shows Dark Ixion.
12. **PR-0635** [major, process, FFX (Penance, Spectral Keeper) and FFX-2 (Farplane Cup, Maesters floor 80); the same gap for the release 75 Keeper and Maesters (PR-0613)] Penance, the Spectral Keeper, Fallen Maesters floor 80 and all three Farplane Cup duels have no real-key win without a recorded state write on live (was R76-2; Dark Aeons and the Bevelle Guardians are now won with no write)
   - Chapter and state: 29, 30, 35, 38 / live https://echoesofspira.com/, typed words darkaeon, judgment, drillshot, duelist, seed 1 (Farplane seeds 1 to 5), real keys, 1600x900. Last seen: round 36. Tags: introduced false, regression false, new feature. Confidence: high that the evidence is missing; no product defect is claimed.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Not re-run: no natural real-key win of the Farplane Cup, Penance, the Spectral Keeper or Maesters floor 80 was attempted this round. ROUND 35B (gap lane wins, live, real keys, seed 1, 1600x900): Dark Aeons all seven links won by real keys in 24.2 minutes and three route attempts (link 6 and link 7 each lost once and won on the retry; Yojimbo's Aeon > Pay ladder and Zanmato by the keys), no write: CLOSED. Bevelle Guardians all three acts won in 11.7 minutes, one attempt, no write: CLOSED. PENANCE: the guide line (handoff 5.1: Hyper NulAll Mix, Three Stars, an arm struck only when the turn list says so, Dispel, Curaga, X-Potions, Phoenix Downs; fast ...
   - Expected: Each new chapter played to its outcome by real keys with its own winning line from docs/handoff/ch-*.md (CHK-022, CHK-023).
   - Repro: node critic/runner/lib/route.mjs <penance|ffx2-farplane-cup|ffx2-bevelle-guardians|dark-aeons> win --base=https://echoesofspira.com/ --seed=1 (Dark Aeons --budget=3000000); see logs/dark-aeons-win-b50.log, penance-win.log, ffx2-bevelle-guardians-win.log, ffx2-farplane-cup-win.log.
   - Evidence: critic/rounds/round-35/evidence/penance-win-r35/run.json; critic/rounds/round-35/evidence/dark-aeons-win-r35b/run.json; critic/rounds/round-35/evidence/dark-aeons-win-r35b/27-no-choosable-row.png
   - Requirement: CHK-022, CHK-023; RUBRIC section 5 (one continuous legal-input route per included chapter)
   - Smallest fix: Bailey's call on PR-0636 first (the Farplane Cup duels are the only chapter with no natural win); then a human-paced Penance run (30 minutes and more) and a Keeper and Maesters floor 80 line that a player can win, or a plain label on their cards. The lane scripts that won Dark Aeons and the Bevelle Guardians are kept in critic/rounds/round-35/gaps-b/wins/ (win-*.mjs, penance-guide.mjs) and can be 
   - Acceptance: A run.json per chapter with outcome victory from the live site, an EMPTY stateWrites list, results and the scene after CONFIRM captured with asserted state, the board still 0 OF 19.
13. **PR-0567** [major, delivery, both] A phone on a 10 Mbit/s line waits 11.1 s (Chapter I) and 18.4 s (Chapter IV) on the loading card, 80.1 and 60.7 MB on the wire, before the first command (release 68: 19.8 s and 42.4 s, about 94 MB); the 8 s and 50 MB lines are still missed
   - Chapter and state: seymour-flux and ffx2-bahamut (measured); suspected for all / first-command job, phone10 profile (390x844, DPR 2, touch, CPU x4, 10 Mbit/s, 40 ms), real keys and taps, candidate bundle of the live artifact. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium (one run per chapter, host 28 to 32 percent busy).
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Phone-profile load still unmeasured; seventh review. Carried and unmeasured on the build: round 31 read 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card on a 10 Mbit/s phone profile. Release 69 added ?phonediet (CHANGELOG, the builder's own claim: 20.4 to 13.8 s and 42.3 to 23.7 s, with the 8 s budget still missed). No independent run measured the live build this round; PR-0573 (page memory per chapter change) is likewise not re-read after release 69's screen release and LeaveRelease.endFight. ROUND 32b ADDITION (G4 (4d) on the live release-70 bundle): phone10 profile (390x844, DPR 2, touch, CPU x4, 10 Mbit/s, 40 ms), pad route: Chap ...
   - Expected: A phone reaches the first command menu without a 20 to 40 s load card; the 5 s goal of BUDGETS B2a holds on the desktop line.
   - Repro: critic/reviews/2a9340249-focused/budgets jobs/first-command.mjs --profile=phone10 --mode=pad (emulation only; a desktop GPU is not a phone).
   - Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json; critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-r67.json; critic/reviews/2a9340249-focused/budgets/first-command-desk50-pad-cand68.json
   - Requirement: RUBRIC section 2 and 6 delivery; BUDGETS B2a, B3a (proposed)
   - Smallest fix: Measure the wire set before the first menu with ?loaddiet=off and on, find what is fetched before the opening poses need it (suspected: the whole chapter's 1x paintings plus board strips), defer the rest until after the first menu.
   - Acceptance: Three runs per chapter: phone10 wire bytes to the first menu at most 50 MB, load wait at most 8 s, desk50 Chapter I load card at most 5.0 s.
14. **PR-0660** [major, visual, FFX (Dark Aeons, Flooded Ways) and FFX-2 (Bevelle Guardians, Farplane Cup)] Pose-swap continuity fails in the hidden chapters the harness could read: CHK-026 FAILS in Dark Aeons, Flooded Ways and the Bevelle Guardians, CHK-027 in those three and the Farplane Cup (17 swap jerks of 40 px or more, worst 136.9 px)
   - Chapter and state: 34 Dark Aeons, 36 Flooded Ways, 37 Bevelle Guardians, 38 Farplane Cup / live https://echoesofspira.com/ 36b6e851d, real keys from the title with the door word, 1600x900, seed 1, headless GPU, continuity harness 4dfca89c6f21, pose table 70bb5a50. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high for the measurement (one run each, one harness, thin reads for Penance and the Farplane Cup); the cause is the same family as PR-0531 and PR-0380 (suspected).
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Not re-run this round (the seven hidden chapters of 35b were not selected); carried unchanged. Candidate-run reads of the live bytes this round add Jenova LIFE (R78-1), Ifrit at Kilika (R78-2) and the FF7 Guard Scorpion. Over the seven readable hidden chapters (2,029.6 s of battle, 2,500 swaps judged, 58.6 to 59.5 fps, snaps 0.00 a minute, 4,165 ms a minute of see-through): DARK AEONS (744 swaps, 690.7 s): Dark Valefor's feet move up to 4 px at 20 swaps and 3 swaps move a silhouette stance over the line (CHK-026); 12 swap jerks of 40 px or more, worst 103.1 px, 10 of them on steady frames, all Dark Ixion at 82 to 103 px (CHK-027). FLOODED WAYS (39 ...
   - Expected: A figure keeps its size and feet across a pose swap and moves continuously (CHK-026, CHK-027), as the 12 passing listed chapters do.
   - Repro: node critic/runner/lib/continuity.mjs for the chapter with the door word (critic/rounds/round-35/gaps-b/continuity/run-hidden.mjs and the run-*.log files); strips in each chapter's continuity/strips folder.
   - Evidence: critic/rounds/round-35/gaps-b/continuity/continuity-summary-hidden7.json; critic/rounds/round-35/gaps-b/continuity/continuity-summary-dark-aeons.json; critic/rounds/round-35/gaps-b/continuity/continuity-summary-flooded-ways.json
   - Requirement: CHK-026, CHK-027, RUBRIC section 6a (Bailey 2026-10-04: "characters change size and height across poses ... ruins the immersion")
   - Smallest fix: The same smallest fix as PR-0531 and PR-0380 (re-register the pose paintings the strips name to the idle head and ground line, never loosen the tolerance), applied to the Dark Ixion hurt and KO swaps, Georapella's feet and the Yuna and Rikku KO swaps; a written method check is already owed for the family (RUBRIC section 8).
   - Acceptance: A repeat of the seven-chapter read: CHK-026 and CHK-027 PASS in Dark Aeons, Flooded Ways, Bevelle Guardians and the Farplane Cup (from a win run), no swap jerk over 40 px on a steady frame.
15. **PR-0614** [major, feel, both (FFX Chapters I, VIII, XVII; FFX-2 Chapter IV)] At fast battle speed pose swaps and moves jump 100 to 407 px in one frame; the same routes at normal speed show far fewer (was R74-2)
   - Chapter and state: I, IV, VIII, XVII / battle speed Fast (the release 73 fast floor), seed 1, real keys, focused review routes c1-F, c4-F, c8-F, c17-F against c1-N, c4-N, c8-N, c17-N. Last seen: round 35. Tags: introduced false, regression false. Confidence: high on the numbers (reused under a written dependency argument), medium on the cause.
   - Observed: Same build and seed, fast against normal (analysis.json, re-read by the confirmation pass): worst jerk Ch I 407.3 against 240.3 px, Ch IV 289.5 against 32.1, Ch VIII 389.2 against 79, Ch XVII 275.5 against 172.5; hops over 100 px Ch I 7 against 1, Ch IV 27 against 0, Ch VIII 1 against 0, Ch XVII 5 against 3. Correction to the auditors' wording: normal speed is not always zero (Ch I shows 1 hop over 100 px and Ch XVII 3), but fast is clearly worse in all four, and Ch IV and VIII show 0 at normal. The strip swap-114 (Paine follow to idle, 3 ghost frames) and swap-010 (Rikku hurt to KO, IoU 0.004) show the jump. The strike's attack gap falls from a median 27 frames to 7 in Ch I, the likely caus ...
   - Expected: Fast speed shortens the animation; it does not add teleports. A figure should travel or blend across at least a few frames; no swap jerk over 40 px.
   - Repro: Continuity harness with fast speed forced, chapters 1, 4, 8, 17, seed 1, 1600x900.
   - Evidence: critic/reviews/2342fe666-focused/continuity/c1-F/analysis.json; critic/reviews/2342fe666-focused/continuity/c4-F/analysis.json; critic/reviews/2342fe666-focused/continuity/c8-F/analysis.json
   - Requirement: CHK-027; RUBRIC section 6a; where: suspected src/engine/motion/FastFloor.ts, StrikeCurve.ts, ReturnPace.ts (not traced)
   - Smallest fix: Give the strike and the ko/follow-to-idle swaps a minimum of a few drawn frames of travel or blend at fast speed; do not let the attack gap or the return flip collapse to one frame. A written method check first: the family has now stood across releases 73 and 74.
   - Acceptance: The four routes at fast speed show no mid-move teleport of 300 px or more and at most 3 hops over 100 px per chapter, and a strip of the swap shows an in-between frame.
16. **PR-0603** [major, interface, FFX] The Chapter XII intent card prints an impossible damage range: "TIDUS 4,132-2,333" (low end above the high end)
   - Chapter and state: XII seymour-omnis / seymour-omnis, seed 1, default 1600x900, first menu, key E, Mortiphasm Spells (second in the queue). Last seen: round 34. Tags: introduced false, regression false. Confidence: high that the numbers are shown; low on the cause.
   - Observed: The card reads "DAMAGE TIDUS 4,132-2,333 68% HP AURON 2,066-2,333 34% HP". Tidus's low bound is twice Auron's and above his own high bound. Round 32 printed the same text (run.json intentText) and nobody filed it. Confirmed by the confirmer from the stored round-33 run.json; the card was not re-rendered live by the confirmer, and the chief read the capture owner's run.json and frame. ROUND 34 (build 2342fe666): Still printed on the live Chapter XII card: "TIDUS 4,132-2,333 68% HP, AURON 2,066-2,333 34% HP" (run.json intentText of seymour-omnis-win-r34); 4,132 is exactly 2 x 2,066, suspected a multiplier on the low end only. Third consecutive review at major: a written method check is owed be ...
   - Expected: A range that reads low to high for every listed target (Tidus's low bound is probably 2,066, matching Auron), so the player can judge whether a Mortiphasm hit is survivable.
   - Repro: https://echoesofspira.com/, Chapter XII, setSeed(1) before the first key, play to the first menu, press E. Frame: evidence/seymour-omnis-win-r33/12-intent-E.png; text in seymour-omnis-win-r33/run.json intentText.
   - Evidence: critic/rounds/round-33/evidence/seymour-omnis-win-r33/12-intent-E.png; critic/rounds/round-33/evidence/seymour-omnis-win-r33/run.json; critic/rounds/round-34/evidence/seymour-omnis-win-r34/12-intent-E.png
   - Requirement: RUBRIC section 2 and CHK-004: enemy intent honest, certain separated from conditional (wrong information is major); where: Chapter XII FFX intent card (src/battle/ffx/intent.ts area); cause not traced
   - Smallest fix: Find where the card builds the per-target low bound for the Mortiphasm spells (suspected: a doubled or unclamped minimum for Tidus; not traced) and correct it; add a unit assertion that every intent range satisfies min <= max across all chapters' cards.
   - Acceptance: The Omnis E card on seed 1 reads low <= high for every row; the unit assertion over all chapters' cards passes.
17. **PR-0613** [major, encounter, FFX-2] Fallen Maesters floor 80 (Chac): no winning line is demonstrated with the party the chapter gives
   - Chapter and state: ffx2-fallen-maesters (hidden, typed word infinito), floor 80 (Chac) / hidden chapter 30, link 4. Last seen: round 35b. Tags: introduced true, regression false, new feature. Confidence: high for the measurement, low for whether a human line exists.
   - Observed: ROUND 35B (gap lane wins, live): the walk reached all four floors by real keys with no write on 20, 40 and 60 (Paine's four Change rows through the blue, yellow, green and red gates; Charon 21,420; "Concherer's shell breaks!" read from the log and shown on screen); floor 80 (Chac) was ended by Rikku's real Attack (2,456) after ONE recorded write (Chac 437,850 to 2,000) at its first menu, so no winning line for floor 80 is shown, as in 34b. New fact from two aborted runs: this build's items on these floors are only Megalixir, Light Curtain, Lunar Curtain and Remedy (no Phoenix Down), so nobody can raise a fallen girl and floor 60 became a one-girl finish after Charon (Rikku and Paine fell to  ...
   - Expected: A sourced optional fight (the delay-lock of research/re-ffx2-fallen-maesters.md) that a player can win with the party given, or an honest label that it cannot be.
   - Repro: critic/rounds/round-34/audit-combat/maestersfloors.probe.ts with PROBE_SEEDS=301-340 (fight(3, seed, line) from tests/unit/helpers/fallenMaestersDrive.ts); real route: type infinito on chapter select and play floors 20, 40, 60 by keys.
   - Evidence: critic/rounds/round-34/audit-combat/maestersfloors.json; critic/rounds/round-34/audit-combat/naivex2-maesters-attack-attack.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/run.json
   - Requirement: RUBRIC section 6 encounter: fair wins and losses, intended strategy reachable; section 8 critical class
   - Smallest fix: Bailey's call (AGENTS.md rule 6: no boss number is tuned): bench a measured kit for the sourced delay-lock or Gunner chain first, or state plainly on the chapter card and tip that floor 80 has no known win with this party. Smallest: the one-line honest label.
   - Acceptance: Either a scripted line with no rig wins floor 80 on at least 20 percent of 40 seeds with a real-key capture, or the card and tip say floor 80 is not winnable with this party.
18. **PR-0148** [major, audio, both] No numeric owner listening verdict covers the shipped mix (carried; an evidence gap, not a player defect)
   - Chapter and state: all / owner listening. Last seen: round 35. Tags: introduced false, regression false. Confidence: high.
   - Observed: Carried, an evidence gap and not a player defect: docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; the only number is 'I like all the music 7/10' (2026-10-13, D-804), music only, before the re-rendered victory cues, the SFX and voice passes and the conference sound pass. The technical half is clean (qa --strict 0 findings, 300 of 300 live files byte-equal, 0 synth fallbacks). ROUND 34 (build 2342fe666): Still no numeric listening verdict covering the shipped mix (D-804 is music only, 2026-10-13). Round 35: docs/audio/OWNER-VERDICT.md still has no entry after 2026-09-28; D-804 (7/10, music only) is the only number; D-1371 is proposed.
   - Expected: CHK-B1: a dated verbatim numeric verdict naming the build or cue set.
   - Repro: Read docs/target/decisions.json (D-804, D-1310, D-1371) and docs/audio/OWNER-VERDICT.md.
   - Evidence: critic/rounds/round-32/audio/qa.log; docs/audio/OWNER-VERDICT.md
   - Requirement: RUBRIC audio: Bailey's listening assessment; CHK-B1
   - Smallest fix: Bailey listens to docs/audio/audition.html and gives a 0 to 10 number for music, SFX and voice, recorded verbatim.
   - Acceptance: A dated verbatim numeric verdict naming the build or cue set is recorded.
19. **PR-0295** [major, interface, both] Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; not re-examined; the prep tab strip is cut at ACCESS on the 390x844 prep capture)
   - Chapter and state: prep, phone / carried. Last seen: round 35. Tags: introduced false, regression false. Confidence: low this round.
   - Observed: Carried, not re-walked: only the first prep tab was captured at 390x844 (the strip is cut at 'ACCESS' in Chapter IV). ROUND 32b ADDITION (G4 (4c) evidence, severity left to the driver): The phone prep tabs were walked by tap and swipe on the live bundle (FFX CHAPTER, STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; FFX-2 CHAPTER, DRESSPHERES, STATS, ACCESSORIES, ITEMS): the strip is cut at open (3 of 6 FFX tabs and 2 of 5 FFX-2 tabs off screen) and the tabs are 37 px tall, but a real swipe moves the strip, it follows the selected tab, and the tabs seen are phone layouts (stacked, foldable sections), so "a desktop frame squeezed onto a phone" is not what the tabs walked show. ROUND 34 (build  ...
   - Expected: A phone prep that is a phone layout.
   - Repro: 390x844 touch, any chapter, prep screen.
   - Evidence: critic/rounds/round-32/evidence/ffx2-bahamut-win-r32-phone-touch/04-prep.png; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx2/run.json
   - Requirement: RUBRIC section 6 prep and interface
   - Smallest fix: Walk it (PR-0503), then fix on what the walk shows.
   - Acceptance: Per tab at 390x844: opened by tap, readable, one change made, visible in the first menu.
20. **PR-0668** [minor, visual, FFX only] Spherimorph: Lulu stands over the boss, the HP plate covers her lower body and hem, and the boss reads as a plain teal gel boulder
   - Chapter and state: 41 Spherimorph, midfight / hidden chapter 41 (word spherimorph), first menu and midfight, 1600x900 and 2000x1012. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: Lulu's figure overlaps the boss body (under 25 percent of the quad) and the Tidus and Yuna plates cover her skirt and feet; the painted Spherimorph is a smooth teal blob with swirls and no spheres. The guide card fades to near invisibility.
   - Expected: Party clear of the boss with the feet visible; a boss recognisable as Spherimorph.
   - Repro: Chapter select, type spherimorph, first menu; seed 1.
   - Evidence: critic/rounds/round-36/crops/sph-boss.jpg; critic/rounds/round-36/evidence/spherimorph-win-s2000/spherimorph-win-s2000/23-midfight.png
   - Requirement: CHK-011, CHK-008 (PR-0653 and PR-0553 class); where: src/scenes/spherimorph.ts staging (suspected, not traced)
   - Smallest fix: Move the party slot or the boss slot apart (the handoff keeps the party on the Temple layout B). Do not restyle the approved painting.
   - Acceptance: Capture at 1600x900 and 2000x1012: no HP plate over Lulu's feet, boss overlap under 25 percent.
21. **PR-0669** [minor, feel, FFX only] Spherimorph: the first-time fan sees a see-through second Tidus and a position jump across the 10-frame timed sequence; the frame level is UNVERIFIED because the harness never ran chapter 41
   - Chapter and state: 41 Spherimorph, party-action (Tidus attack run-in) / seq-party-action f00 to f04 at 1600, 2000 and 390 touch. Last seen: round 36. Tags: introduced unknown, regression false, new feature. Confidence: low on the frame-level claim, medium that a double image shows.
   - Observed: A doubled Tidus plus a see-through Lulu under him at full size (f02), and Tidus standing beside Yuna at f00 and beside the boss at f01 then back at his seat by f04. The sheet frames are about 180 ms apart or more, so a lunge of that length can show as a jump; the see-through double is the cross-dissolve family of PR-0379. Not established as a one-frame teleport.
   - Expected: A run-in that blends or travels; no double image beyond the PR-0379 line.
   - Repro: Word spherimorph, first Attack; read seq-party-action. Run node critic/runner/lib/continuity.mjs --chapters=spherimorph for the frame-level read.
   - Evidence: critic/rounds/round-36/evidence/spherimorph-win/spherimorph-win-r36/seq-party-action/f02.jpg; critic/rounds/round-36/evidence/spherimorph-win-p390/spherimorph-win-p390-touch/seq-party-action/f00.jpg
   - Requirement: CHK-027 (UNVERIFIED for chapter 41), PR-0659
   - Smallest fix: First run the harness on the chapter; only then decide.
   - Acceptance: Harness summary lists spherimorph with CHK-026 and CHK-027 results.
22. **PR-0672** [minor, interface, FF7 only (declared FF7 engine gap)] Jenova LIFE: no advisor, enemy-move card, guide or key hints; E opens the pause; the pause is a bare window with an empty IN THIS FIGHT block and a doubled chapter name
   - Chapter and state: 44 Jenova LIFE / first command menu and pause, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: The first menu shows only Attack / Magic / Item. N and G change nothing; E opens the PAUSE (asserted screen=pause) where it opens the enemy-move card in FFX and FFX-2. No party prep, briefing or first-turn coach. The pause is a near-black window with no character close-up, an IN THIS FIGHT heading with nothing under it, and JENOVA LIFE in both the eyebrow and the title.
   - Expected: Shared help surfaces, or a statement that they are absent; a key that toggles intent elsewhere should not open the pause; the pause centres a character close-up (RUBRIC section 2).
   - Repro: Real keys: title, Enter, type bluelight, first menu, press N, E, G, then Esc.
   - Evidence: critic/rounds/round-36/evidence/ff7-jenova-life-real/03-key-E.png; critic/rounds/round-36/evidence/ff7-jenova-life-real/06-pause-Esc.png; critic/rounds/round-36/evidence/ff7-jenova-life-real/02-first-menu.png
   - Requirement: RUBRIC section 2; CHK-020; CHK-015; CHK-002 scope
   - Smallest fix: Bind E to nothing in the FF7 battle and show no hint for it, or add the cards for the FF7 engine; give the FF7 pause a plate and hide the empty heading.
   - Acceptance: bluelight: E at the first menu leaves screen=battle (or shows a card); the pause shows a painted plate and no empty heading.
23. **PR-0673** [minor, interface, FF7 only] FF7 results window 2 prints an empty "()" under the Wizard Bracelet
   - Chapter and state: 44 Jenova LIFE / results window 2 after a win. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high (traced).
   - Observed: The line under "Wizard Bracelet 1" reads "()". Traced by the chief: src/app/screens/Ff7ResultsScreen.ts itemRow, lines 44 to 50: for an armour drop `who` is undefined (it is looked up for weapons only) and `bits` is empty, so the line becomes "()".
   - Expected: No empty parenthetical: a blank line, or the armour's Def and MDef.
   - Repro: Word bluelight, win (the capture used Jenova HP 700), open results window 2.
   - Evidence: critic/rounds/round-36/evidence/ff7-jenova-life-real/14-results-2.png; critic/rounds/round-36/zz-ui/jen-b.jpg
   - Requirement: CHK-007; where: src/app/screens/Ff7ResultsScreen.ts:49
   - Smallest fix: In itemRow return line "" when both who and bits are empty, or add Def and MDef to bits.
   - Acceptance: The Wizard Bracelet row shows no "()".
24. **PR-0675** [minor, feel, FF7 only] Jenova LIFE: Reflect has no on-screen indicator, so the next Fire turns back on the caster without warning
   - Chapter and state: 44 Jenova LIFE / real keys, seed 1: Barret Fire at Jenova (lands), then Fire again. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: After Barret's first Fire lands (128, her HP 10,000 to 9,872) the engine shows Reflect on Jenova, but no shell, icon, status word or message is drawn in any frame; the next Fire turns on Barret (250, Barret 1,071 to 821, Jenova unchanged). In the target frame the top banner still reads Blue Light, the previous enemy move (cosmetic). Handoff ch-jenova-life.md section 9 item 9 already lists the drawing as owed.
   - Expected: The player can see that Reflect is up before casting into it (the in-game guide says Spells turn back on you).
   - Repro: Real keys, bluelight, seed 1: Cloud Barrier, Barret Magic Fire, Barret Magic Fire.
   - Evidence: critic/rounds/round-36/evidence/gaps/jenova-reflect/barret-Fire-2-05.png; critic/rounds/round-36/evidence/gaps/jenova-reflect/barret-Fire-3-02.png
   - Requirement: CHK-010 legibility of state
   - Smallest fix: Draw the Reflect shell or put a status mark on Jenova's row while the status is up.
   - Acceptance: After a landed magic hit a Reflect marker is visible on Jenova until the status ends.
25. **PR-0676** [minor, audio, FF7 only] Jenova LIFE is declared silent but the board's chapter-select bed plays through the whole fight, and no victory cue plays
   - Chapter and state: 44 Jenova LIFE / audio debug at the first menu and at results, two runs plus the gap pass, seed 1. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high for the carried cue; not heard.
   - Observed: audioDebug.playing is chapter-select at the first battle menu and the same cue is still fading at after-fight; at results nothing plays and the sfxLog has no victory cue. The chapter record sets music {scene: null, battle: null} and the handoff (J13, J14) says silent with an original take owed. Traced by the audio auditor: BattleEncounterChain.ts cueForGroup returns no track when both are null and leaves whatever is playing. Whether anything is audible is Bailey's listening verdict.
   - Expected: Silence under the altar fight as declared, or a cue chosen on purpose; a results cue.
   - Repro: Type bluelight, setSeed(1), read audioDebug() at the first menu and at results.
   - Evidence: critic/rounds/round-36/evidence/ff7-jenova-life-lose/ff7-jenova-life-lose-r36/audio-debug.jsonl; critic/rounds/round-36/evidence/gaps/jenova-audio/audio-first-menu.json; critic/rounds/round-36/evidence/gaps/jenova-audio/audio-results-t0.json
   - Requirement: CHK-023 (audio scope), CHK-001 item 3; where: src/app/screens/BattleEncounterChain.ts cueForGroup; src/data/chapter-ff7-jenova-life.ts:54
   - Smallest fix: When scene and battle cues are both null, stop the music at battle start with the 1.2 s chain fade, or give an explicit silent marker; the stand-in decision is Bailey's.
   - Acceptance: audio-debug at the first menu shows playing null in a loss and a win; results plays a cue or is silent on purpose.
26. **PR-0677** [minor, combat, FFX-2 only] Changing a girl into Lady Luck pays double gil, double EXP and double items with nothing learned
   - Chapter and state: any FFX-2 chapter whose build names no learned list for the dressphere a girl changes into (seen in 42 Youth League) / live Youth League win with a scripted Paine Dark Knight to Lady Luck Change; pure-engine replay. Last seen: round 36. Tags: introduced false, regression false. Confidence: high on observation and cause; medium on the verdict.
   - Observed: The live Youth League results print GIL 5,520 against 2,760 summed from the eight research rows; the engine pays exactly 2,760 per chain without the Change. Reproduced on the pure engine (seed 2001, act 1): no Change pays 340 gil and 640 EXP, the same act with one Paine Change to Lady Luck pays 680 gil and 1,280 EXP for her. Cause traced by the combat auditor: learnedOf (src/battle/ffx2/adapt/menu.ts lines 92 to 113) adds every pair of the worn dressphere's ladder as learned when the build names no learned list for it, and autoWordsOf (line 232) then reads Gillionaire, Double Items and Double EXP; the farplane build lists none for Lady Luck. The default is a recorded modelling choice (re-par ...
   - Expected: research/ffx2-combat-core.md line 3323 lists Double EXP, Gillionaire and Double Items as learned abilities, not innate: a girl who just changed into a dressphere she has learned nothing in should not double rewards, and the results page should equal the sourced row sum.
   - Repro: node --experimental-transform-types critic/rounds/round-36/audit-combat/yl-ladyluck.mjs (gil 340 / EXP 640 without, 680 / 1,280 with). Live: evidence/ffx2-youth-league-win run.json resultsText and scriptedChange.
   - Evidence: critic/rounds/round-36/audit-combat/yl-ladyluck.mjs; critic/rounds/round-36/audit-combat/yl-chain-gil.mjs; critic/rounds/round-36/evidence/ffx2-youth-league-win/ffx2-youth-league-win-r36/run.json
   - Requirement: AGENTS.md rule 6 (a free reward multiplier is unsourced); research/ffx2-combat-core.md line 3323
   - Smallest fix: Smallest: treat reward auto-abilities as unlearned unless the build names them, or list Lady Luck's learned abilities in the farplane and Den of Woe builds; the choice is Bailey's. No boss or reward row changes.
   - Acceptance: yl-ladyluck.mjs prints gil 340 and Paine EXP 640 after a Change to Lady Luck in act 1; the Youth League chain pays 2,760 gil and 5,370 EXP; parity-ffx2-menu-engine and ffx2-rewards tests still pass.
27. **PR-0678** [minor, interface, FFX-2 only] Ifrit intent cards print percent HP on two different bases, show a 50/50 tie as MOST LIKELY 50 percent, and leave the ODDS rows faded or empty
   - Chapter and state: 46 Ifrit at Kilika / E card, Attack (frame 11) and Firaga (frame 21), 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: Attack card with Yuna at 449/690 reads 235-265 = 36% HP (a share of maximum, 250/690). Firaga card with Yuna at 253/690 reads 174-196 = 73% HP, Rikku 17%, Paine 29%, matching current HP and not maximum (computed from the printed numbers, suspected, no source read). Attack and Firaga are each 50% yet the card is headed MOST LIKELY 50%; under ODDS only a faded Attack 50% shows, and on the Firaga card the ODDS header has no row (the PR-0540 pattern).
   - Expected: One stated basis; a tie shown as a tie; a heading not shown without its body.
   - Repro: Seed 1, win route; compare 11-advisor.png and 21-change-open.png.
   - Evidence: critic/rounds/round-36/evidence/ffx2-ifrit-kilika/ffx2-ifrit-kilika-win-r36/11-advisor.png; critic/rounds/round-36/evidence/ffx2-ifrit-kilika/ffx2-ifrit-kilika-win-r36/21-change-open.png
   - Requirement: RUBRIC section 2 (honest intent, certain separate from conditional)
   - Smallest fix: One base for the FFX-2 intent percentage or print of max / of current; print EVEN 50 / 50 for ties and show both rows.
   - Acceptance: Two cards with the same ally HP show the same basis; the Ifrit card shows both odds rows without holding J.
28. **PR-0680** [minor, interface, FFX only] Omega Ruins: E shows no enemy-move card and the turn list never shows Ultima Weapon or Nemesis
   - Chapter and state: 43 Omega Ruins / first menus of all three acts, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high on the absence, low on whether it is intended.
   - Observed: E changes nothing (intentText empty), and the turn list shows only Tidus, Yuna and Lulu although the guide says Nemesis acts every nine ticks and names Ethereal Cannon and Ultra Spark. Same family as PR-0608 (Mirror Aeons, a question for Bailey).
   - Expected: The player can see when the boss acts and what it may do (sourced moves only).
   - Repro: Seed 1: type weapon, play to act 3.
   - Evidence: critic/rounds/round-36/zz-ui/o1.jpg; critic/rounds/round-36/zz-ui/o2.jpg
   - Requirement: RUBRIC section 2 (enemy intent); CHK-020
   - Smallest fix: Add the boss to the CTB list and an intent card from the sourced fixed round, or state that none exists.
   - Acceptance: Act 3 first menu shows Nemesis in the turn list.
29. **PR-0683** [minor, feel, FFX only] Wendigo's pre-scene is a black screen with an ENTER ADVANCE prompt and no content for about 1.6 s
   - Chapter and state: 49 Wendigo / pre-scene, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: The scripted pre-scene has no lines; the capture shows the EXPERIMENTAL header, a black field and ENTER ADVANCE / HOLD ENTER SKIP before the title card. The first transition frame is fully black. By design (CW15), but the player is told to press a key with nothing to advance (the 05 frame may fall inside a fade).
   - Expected: Either the plate fades in at once or the prompt is hidden for a scene with no lines.
   - Repro: Word wendigo, desktop 1600x900.
   - Evidence: critic/rounds/round-36/evidence/wendigo-win/wendigo-win-r36/05-pre-scene.png; critic/rounds/round-36/evidence/wendigo-win/wendigo-win-r36/seq-transition-into-battle/f00.jpg
   - Requirement: respectful transitions (RUBRIC section 2)
   - Smallest fix: Hide the advance prompt while a scene has no say() lines, or start the fade-in at 0.
   - Acceptance: A timed sequence shows no empty prompted screen.
30. **PR-0685** [minor, feel, FFX-2 only] Leblanc: one swap jerk of 48.6 px on a frame over 34 ms (new against 35b, suspected host frame-clock load)
   - Chapter and state: 15 Chateau Leblanc / live harness run ffx2-leblanc-win-r36. Last seen: round 36. Tags: introduced unknown, regression unknown. Confidence: medium.
   - Observed: CHK-027 FAIL on a single swap jerk of 48.6 px on a long frame, not a steady-frame jerk; Leblanc passed in 35b. The continuity run was one of 19 on a shared host. Not repeated alone.
   - Expected: No swap jerk of 40 px or more on a steady frame.
   - Repro: node critic/runner/lib/continuity.mjs --chapters=ffx2-leblanc on a quiet host.
   - Evidence: critic/rounds/round-36/continuity/ffx2-leblanc-win-r36/continuity/continuity.json
   - Requirement: CHK-027
   - Smallest fix: Re-measure alone before opening any work; if it repeats on a steady frame treat it with PR-0380.
   - Acceptance: A quiet-host run reads 0 swap jerks over 40 px.
31. **PR-0686** [minor, prep, FF7 (Jenova LIFE), FFX (Omega Ruins)] Aftermath legs still not shown: a sensible-line Jenova win with no HP write, Omega Ruins' Armageddon, Ultima counter and Omega Weapon's own turn (narrowed from PR-0666)
   - Chapter and state: 43 Omega Ruins, 44 Jenova LIFE / gap pass, live, real keys. Last seen: round 36. Tags: introduced false, regression false, new feature. Confidence: high that the legs are missing.
   - Observed: The Omega return to the board IS now shown (two full real-key runs, results to the post scene to chapter select, one labelled Nemesis HP write each); in both runs no enemy took a turn, so Armageddon, the Ultima counter and Omega's cycle were never observed (proved on the real engine). Jenova: the generic route cannot play FF7, the attack-only run lost and the win followed one HP write (Jenova to 700) with the last blows by real keys (precedent 34b, 35b); the handoff's sensible player (heals under 45 percent, Limits when full, 99.5 percent bench) was not played. No game defect is claimed.
   - Expected: A continuous legal-input route per chapter (CHK-022), the handoffs' winning lines played.
   - Repro: Play the Jenova sensible line by real keys from bluelight; keep an Omega run alive into a Nemesis turn.
   - Evidence: critic/rounds/round-36/evidence/gaps/omega-real/board-after.png; critic/rounds/round-36/evidence/ff7-jenova-life-real/run.json
   - Requirement: CHK-022, CHK-023
   - Smallest fix: A sensible-line Jenova route and an Omega run that lets Nemesis act.
   - Acceptance: A Jenova win with no write; Armageddon seen once.
32. **PR-0664** [minor, delivery, FFX-2 (Youth League, ch 42) and FFX (Wendigo, ch 49)] Youth League and Wendigo request painted idle files that are not shipped: HTTP 404 and 2 console errors a run on live (the PR-0616 class again; LIVE-78-1 for Wendigo)
   - Chapter and state: ffx2-youth-league, wendigo / live, chapter load, seed 1, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: https://echoesofspira.com/art/characters/x2-yaibal/idle.png and https://echoesofspira.com/art/characters/wendigo/idle.png each answer 404 (true 404, no html body; re-checked by the chief with curl: HTTP 404) twice during the chapter load: 4 console errors across 19 run folders, 0 in every other chapter. The foes draw as stand-ins (the League foes as cone silhouettes, PR-0667; Wendigo as the Meshy 3D model); the fight is unaffected. Request built at runtime (art/characters/${id}/idle.png, src/engine/BattlePresenterArt.ts line 136).
   - Expected: No response of 400 or more and no console error in a normal play of a shipped chapter (CHK-017); a foe with no painting makes no request.
   - Repro: Open the live site headless, type youth (or wendigo), Enter through prep and the scene; read console and network.
   - Evidence: critic/rounds/round-36/evidence/ffx2-youth-league-win/ffx2-youth-league-win-r36/run.json; critic/rounds/round-36/evidence/wendigo-win/wendigo-win-r36/run.json; critic/reviews/cc0fea14a-live.json
   - Requirement: CHK-017; same class as closed PR-0616; where: suspected src/engine/BattlePresenterArt.ts:136 characterUrl (not traced beyond the line)
   - Smallest fix: Ask the art manifest before requesting a pose file (or flag the subject as procedural or 3D), as was done for the Keeper and Maesters; or ship a placeholder. One fix covers both chapters.
   - Acceptance: A route run of both chapters reports notFound [] and consoleErrors [].
33. **PR-0645** [minor, prep, FFX (pooled-chain results; chapter 36 and the older Sinspawn Gui chapter)] The Flooded Ways results card prints impossible AP rows: Wakka "S.LV 31 - 9,122/755 AP", Tidus +19 S.Lv for +12,900 AP
   - Chapter and state: 36 Flooded Ways, results after a win / win of both areas, seed 1, 52 turns. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high for the card, medium for the cause.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): NARROWED: PR-0594's repair is the same BattleChainSpoils pooling into sphereGridBar; it is proved on two live pooled chains (Mirror Aeons, Omega Ruins) and by 105 unit tests passing, but the Flooded Ways card itself was not re-run, so the issue stays open until it is. AP 12,900 x3 PARTY; Tidus +19 S.Lv, S.LV 43, 0/1,810 AP, +12,900 AP (19 levels from S.LV 24 cost 18,007 AP, and the 0 is a clamp); Wakka +7 S.Lv, S.LV 31, 9,122/755 AP (rest above the next level's cost). Suspected cause: BattleChainSpoils.ts:37 sums per-link Sphere Levels while resultsMath.ts:276 prints one party AP.
   - Expected: Each row's S.Lv gained, AP gained and rest/next agree with apForLevel.
   - Repro: Win geosgaeno and read the results card; recompute with critic/rounds/round-35/delivery-prep/chk.mjs.
   - Evidence: critic/rounds/round-35/evidence/flooded-ways-win-r35/31-results.png; critic/rounds/round-35/delivery-prep/chk.mjs
   - Requirement: RUBRIC prep: understandable results
   - Smallest fix: Carry the grid (S.LV and AP) from link to link, or print each member's own AP and compute the rest from it; clamp nothing silently.
   - Acceptance: For every row of a pooled chain card, applying the printed AP to the starting S.LV with apForLevel yields the printed S.LV and rest; a unit test over the Flooded Ways and Sinspawn Gui chains.
34. **PR-0646** [minor, delivery, both] First load is still not measured in a browser on this build (sixth review) and the main bundle grew 7.8 percent in brotli
   - Chapter and state: title, board, any chapter / live, node-side only. Last seen: round 36. Tags: introduced unknown, regression unknown. Confidence: high for the byte numbers, none for the browser time.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Cold load still not measured in a browser (coldload.mjs not run); seventh review. Index bundle 1,563,416 B brotli in 0.46 s, TTFB 0.17 s, against 1,450,107 B at release 74 (raw 5,128,275 to 5,300,035 B); the release added 355 files and 231 MB of lazily loaded art and models; the site is 7,651 files and 11.5 GB.
   - Expected: A cold title answers its first key under 5 s on a named profile (RUBRIC section 2); phone profile near the 8 s and 50 MB lines.
   - Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/coldload.mjs --base=https://echoesofspira.com/ --evidence=<dir>, and the phone10 first-command job.
   - Evidence: critic/rounds/round-35/delivery-prep/verify-live.json; critic/artifacts/36b6e851d.json
   - Requirement: CHK-017 cold-load clause; PR-0520, PR-0567
   - Smallest fix: Run coldload.mjs and the phone10 job on the live URL and record them.
   - Acceptance: coldload.mjs out.json shows the title answering its first key under 5 s unthrottled, with the host CPU named.
35. **PR-0652** [minor, visual, FFX] In Dark Aeons, Mirror Aeons and the Spectral Keeper the party is pushed to the bottom edge with the feet cut off and the HP panel on top of them during attacks
   - Chapter and state: 34 Dark Aeons, Mirror Aeons, hidden Spectral Keeper / party attack frames, 1600x900. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed in Mirror Aeons (party-action f05 to f09: Tidus and Yuna cut below the knees, Lulu half out of frame) and now in the new Omega Ruins (action-playing f01 to f03: Tidus, Yuna and Lulu cut at the waist behind the HUD). Tidus and Yuna sit at the bottom-left with their feet below the frame and the HP panel over their legs (dark-aeons seq-party-action f05 to f07; mirror-aeons f05 to f07; spectral-keeper f00 to f09, Tidus cropped behind the panel).
   - Expected: Party figures stay inside the frame with ground contact visible and clear of the HUD (CHK-008, CHK-011).
   - Repro: Attack with Tidus in any of the three chapters and read the sequence sheet.
   - Evidence: critic/rounds/round-35/fan-sheets/dark-aeons-win-r35__seq-party-action.jpg; critic/rounds/round-35/fan-sheets/mirror-aeons-win-r35__seq-party-action.jpg
   - Requirement: CHK-008, CHK-011
   - Smallest fix: Not traced; the camera framing for these formations puts the party row low. Move the row up or the camera down for these stages.
   - Acceptance: Feet inside the frame by at least 12 px and no HP panel over a figure in the attack sheet at 1600x900 and 2000x1012.
36. **PR-0638** [minor, harness, FFX] The continuity harness projects without clipping at a camera cut, so Seymour Flux's victory camera read as a 16,799 px and a 2,874 px jump on the candidate (was R76-1)
   - Chapter and state: seymour-flux, victory camera / candidate runs 1 and 2 of the focused review. Last seen: round 36. Tags: introduced unknown, regression false. Confidence: high that the number is not a player-visible jump (the fresh live run reads 0 swap jerks); the cause is the driver's finding, not traced here.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Relevant again: the fan's camera-cut readings cannot be told apart from the harness's no-clipping projection at a cut. Run 1: Tidus's feet moved 16,799.6 px in one frame near the end of the fight; run 2: Yuna idle to victory feet 2,874.5 px, stature 0.291. The fresh live run of this review reads CHK-026 FAIL (the standing 10.8 percent head) and CHK-027 PASS with 0 swap jerks and a worst dash of 235 px. The release 76 stage teardown (foot-occlusion dispose) is untouched by this reading. Per the owner brief the camera-cut reads are UNVERIFIED, not FAIL.
   - Expected: The harness reads a figure across a camera cut as a cut, not as a jump.
   - Repro: continuity harness --chapters=seymour-flux on the candidate twice, against live.
   - Evidence: critic/reviews/36b6e851d-focused/continuity-rerun/continuity-summary-seymour-flux.json; critic/rounds/round-35/continuity/seymour-flux-win-r35/continuity/continuity.json; D:/Tools/pyrefly-scratch/2026-11-07/r76-flux-check
   - Requirement: CHK-027; harness correctness
   - Smallest fix: Clip the projection at the cut or mark frames across a camera cut as a cut.
   - Acceptance: Three consecutive candidate runs of Seymour Flux read the same swap-jerk number as live within a few px.
37. **PR-0659** [minor, harness, both] The eight new hidden chapters are not in the continuity harness registry: round 35b read seven of them with a lane script, and the 3D anime chapter cannot be read by the harness at all
   - Chapter and state: 33 to 40 / harness plan lists the 19 registry chapters only. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): WIDENED: Spherimorph (41), the Youth League (42) and Omega Ruins (43) are in no continuity run in round 36 or in the release 77 focused review, so CHK-026 and CHK-027 are UNVERIFIED there; the harness cannot read the Wendigo 3D stage (R78-3 suggestion); Jenova LIFE needs a dedicated driver because the generic route reads FF7 menus as pause/battle mismatches and loses at turn 0; sweep.mjs cannot reach hidden chapters by their word. ROUND 35B (continuity lane, live): seven of the eight were read by critic/runner/lib/continuity.mjs on https://echoesofspira.com/ (real keys, the door word typed on the board, 1600x900, seed 1, headless GPU, one run each ...
   - Expected: Every chapter a player can reach is read by the harness (RUBRIC section 6a: UNVERIFIED with its cause, never dropped).
   - Repro: node tools/critic-plan.mjs --json (chapters list).
   - Evidence: critic/rounds/round-35/plan-deep.json; critic/rounds/round-35/gaps-b/continuity/continuity-summary-hidden7.json; critic/rounds/round-35/gaps-b/continuity/results.json
   - Requirement: CHK-026, CHK-027
   - Smallest fix: Register chapters 34 to 40 in the harness registry with the lane's winning lines (critic/rounds/round-35/gaps-b/wins/win-*.mjs) so the next 19-chapter run includes them; ask for a 3D-aware reader (or the rig lane) for Chapter 33.
   - Acceptance: continuity-summary.json of the standing run lists chapters 33 to 40 with a verdict or a stated cause, Penance and the Farplane Cup from a win run.
38. **PR-0592** [minor, harness, FFX] Mirror Aeons needs about 20 minutes of fight, above the route harness default budget of 15 minutes (the first run stalled at link 2; the 40-minute rerun won in 20.3 min)
   - Chapter and state: mirror-aeons / route.mjs mirror-aeons win --seed=1. Last seen: round 36. Tags: introduced -, regression -. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed: the first Mirror Aeons run stalled at the default 900 s budget in link 2; the rerun with --budget=3000000 won in 20.12 min (209 turns), and the continuity lane's own Mirror Aeons run won in 209 turns. A harness budget, not a game fault. First run stopped at the budget on link 2 (162 turns, 900 s); the rerun with --budget=2400000 won in 20.3 min. Round 31 measured 19.8 min. ROUND 33: Round 33: the first Mirror Aeons run again stopped at link 2 when the capture budget (901 s, 163 turns) ran out; the rerun with a 3,000 s budget won in 209 turns and 1,137 s (19 min 19 s). A harness budget, not a stall. ROUND 34 (build 2342fe666): Mirror A ...
   - Expected: The route budget covers the longest chapter.
   - Repro: route.mjs mirror-aeons win --seed=1, default budget, then with --budget=2400000.
   - Evidence: critic/rounds/round-32/evidence/mirror-aeons-win-r32/run.json; critic/rounds/round-32/evidence/mirror-aeons-win-r32b/run.json
   - Requirement: harness
   - Smallest fix: Add mirror-aeons to LONG_FIGHT_BUDGET_MS in critic/runner/lib/route-pure.mjs.
   - Acceptance: A default-budget run completes.
39. **PR-0539** [minor, harness, both] Critic harness limits (carried): the phone Items list is 6 rows of 27 for the route, timed sequences carry no frame timestamps, the capture owner's retry folder for Chapter IV mixes runs and its images are not indexed (R31-U1), and the cardFirst advisor measurement describes a card not on screen (R31-INT-09)
   - Chapter and state: critic runner / tools. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): WIDENED: the route reads only the visible rows of a paged sub-list and never taps the pager (the phone Spherimorph run stalled for 900 s over 175 turns; the gap pass showed Black Magic is a paged list, 1-6 OF 8, with Watera one tap on the down arrow, so the product is fine and PR-0665 is withdrawn); a touch swipe does not scroll the list (paging is the design, a minor discoverability note). The route also cannot play FF7 chapters. Carried and widened: the phone Items list is 6 rows of 27 for the route and the harness never taps the page button (PR-0483); the route budget misses Mirror Aeons (PR-0592); the post scene still is taken before the scene ...
   - Expected: One run per folder, every image indexed.
   - Repro: ls --time-style=full-iso on the folder against run.json.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
   - Requirement: CHK-016
   - Smallest fix: Re-run into a clean folder with the images indexed.
   - Acceptance: A folder whose run.json and images share one run and are in index.json with verified true.
40. **PR-0583** [minor, visual, FFX] Braska 23-midfight: at a command moment the aeon is mostly out of frame under the turn order and the red sky reads near black (CHK-011 FAIL)
   - Chapter and state: Chapter III braskas-final-aeon / treated Chapter III, real keys, seed 1, 1600x900, capture 23-midfight. Last seen: round 36. Tags: introduced true, regression true, new feature. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed live: Braska's Final Aeon is a shoulder at the top right of the frame under the turn order. Only the aeon's sword and shoulder show at the top right under the turn order; round 31's frame of the same capture step showed the whole aeon under a red sun. The other frames of the chapter (first menu, targeting, link seams) show the boss well. ROUND 34 (build 2342fe666): Visual auditor read the Braska midfight frame (aeon's shoulder and head only), Chapter I (small dim Seymour) and Chapter II (Yunalesca behind the HP plates) as in 33b; the confirmation pass did not independently reproduce it, so it stays minor. Round 35: re-observed (Braska  ...
   - Expected: The headline boss's head and torso are inside the frame at every command moment (CHK-011).
   - Repro: Chapter III, real keys, seed 1, 1600x900; capture 23-midfight.
   - Evidence: critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/23-midfight.png; critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg
   - Requirement: CHK-011
   - Smallest fix: Check the treated pro-camera shot for the second form against the form's height, or add a CHAPTER FRAMING row.
   - Acceptance: At every command moment of the chapter the boss's head and torso are inside the frame.
41. **PR-0479** [minor, visual, FFX only] Chapter I action shot: the humanoid Seymour's upper body leaves the top of the frame under the turn order (the creature's head is inside; the confirmer refuted the 'head cropped' wording)
   - Chapter and state: seymour-flux / mid-fight, 1600x900. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed live: the humanoid Seymour leaves the top edge under the turn order in Chapter I. In 23-midfight.png the Mortiorchis head with spines and jaw is wholly inside the frame (about y 20 to 300); the humanoid torso at the right runs off the top edge and the turn-order icons overlap it. In seq-party-action f02 the same figure is cropped at the top. Carried at minor since round 30; the auditor's raise to major is not supported. Round 35: re-observed at 1600x900 and 2000x1012 (humanoid Seymour leaves the top edge).
   - Expected: Outside an intended close-up the boss stays in frame.
   - Repro: Chapter I by real keys, seed 1, first attack.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/23-midfight.png; critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f02.jpg
   - Requirement: CHK-008
   - Smallest fix: Lower the action camera for this boss or move the turn order off the quad.
   - Acceptance: Same state: the torso is wholly inside the frame.
42. **PR-0516** [minor, interface, both] Panels over painted actors and live controls (CHK-008 FAIL, carried): the Chapter I E card covers the NOW tile of the turn order; the Vegnagun chain counter, panels and damage numbers stack; the 'Possessed ...' banner crosses the aeon's body
   - Chapter and state: Chapter I, Chapter V, Chapter III seams / E card open; chain fight; aeon seams. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed: the Chapter I E card covers the NOW tile (Seymour Flux E frame). At 1600 and 2000 the opened E card sits over the current actor's turn-order tile ('3RD IN QUEUE' over 'NOW') and Seymour's figure (R31-INT-02). The fan lists the same class: the Vegnagun chain box cut at the screen edge ('x1.9') with piled damage numbers, the Possessed Ixion/Valefor/Bahamut/Yu Yevon banner as a dark bar across the aeon, and the big turn cut-in covering the party at turn start (PR-0536). The 80-state sweep at 1280x720 and 2560x1440 was not re-run (PR-0552, PR-0553, PR-0560 carried). ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-04; FFX only, F1  ...
   - Expected: No panel hides the current actor's turn slot or a figure it should not (CHK-008).
   - Repro: Chapter I first menu, press E, screenshot.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing
   - Requirement: CHK-008, docs/ENGINE-API.md#hud-safe-area
   - Smallest fix: Anchor the intent card left of or below the turn order; move the possessed banner off the body.
   - Acceptance: Intersection of the card and the NOW tile is 0 at 1280x720, 1600x900, 2000x1012, 2560x1440 in Chapter I.
43. **PR-0502** [minor, interface, both] The boss's bark box, the opening quip banner and the turn-intro wipe cover the first command menu (carried, stalled, now also on retry)
   - Chapter and state: Chapter I first menu; Chapter I and IV retry / awaitingMenu true. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed with new instances: the Ifrit intel card, command menu and Chain panel sit over Ifrit (the Chain box hides CHANGE and ITEM, see PR-0552); the Youth League guide card covers Yuna's head and shoulders and the Rikku tip box the lower field; the FFX-2 target ring and petals overprint the open E card and the A of ATTACK at Ifrit; Rikku's bark box covers the lower lines of the guide card; the Wendigo HUD plate sits on Rikku's feet; on the phone the Armor Break tag is drawn over the damage numbers; a faint ghost of the guide card and enemy-move list stays over the painted scene in Spherimorph, Wendigo and Omega Ruins (first-time fan). The pho ...
   - Expected: The command rows are visible while the menu awaits input, or the menu does not await until they are.
   - Repro: Chapter I real keys, first menu, no key pressed; or lose and TRY AGAIN.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/10-first-menu-coach.png; critic/rounds/round-31/evidence/seymour-flux-lose-retry/3-retry-menu.jpg; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/3-retry-menu.jpg
   - Requirement: CHK-008, CHK-006
   - Smallest fix: Place the bark clear of the command stack or hold awaiting until it has cleared.
   - Acceptance: At awaitingMenu true the command rows are unobscured.
44. **PR-0541** [minor, interface, FFX-2 only] Chapter IV desktop CHANGE list: 'GRANTS: BLUE' is pink on cream and nearly invisible, and a grant is never explained (carried, stalled)
   - Chapter and state: ffx2-bahamut / CHANGE open at 1600 and 2000. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed at Ifrit 390x844 (GRANTS: BLUE clipped to BLUI). The unselected WARRIOR row's GRANTS: BLUE is nearly invisible; Gunner's GRANTS: GREEN on the selected row reads. ROUND 34 (build 2342fe666): Re-observed: WARRIOR GRANTS: BLUE is pink on cream. Round 35: re-observed with PR-0518 (phone CHANGE tiles).
   - Expected: Readable rows and one line saying what a grant is.
   - Repro: Chapter IV, ArrowDown to CHANGE, Enter.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/21-change-open.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/21-change-open.png
   - Requirement: CHK-003, CHK-007
   - Smallest fix: Use the row ink for unselected GRANTS and add one explanatory line.
   - Acceptance: GRANTS contrast at least 4.5:1 selected and unselected.
45. **PR-0518** [minor, interface, both] Phone 390x844: CHANGE tiles clip their text (UNNER, GRANTS: BLUI), the pause header wraps over the tab dots, the tab strip is cut at CHAPTER with no scroll cue (ACCESSIBILITY, CONTROLS and MUSIC are reached only by an unprompted swipe), the options pane stops at a half row, and the phone pause shows keyboard hints (carried, stalled; merges PR-0554, R31-ONB-01)
   - Chapter and state: Chapter I and IV phone / pause by the chip; CHANGE list. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed at Ifrit 390x844: GUNNER reads UNNER, GRANTS: BLUE reads BLUI, the pause header wraps over the tab dots, ACCESSIBILITY stays behind a cut tab strip. The pause chip is a 46x46 target and a tap opens the pause (gap pass). A real touch swipe on the strip scrolls it; nothing hints at it. Smallest visible text on the phone pause is 14 px; no horizontal page scroll (scrollWidth 390). ROUND 32b ADDITION (G2 layout sweep): At 390x844 (touch context, Escape) the pause on e3f51bf18 still draws the header 'ECHOES OF SPIRA - FINAL FANTASY X' wrapped onto two lines against the tab dots, the tab strip cut at CHAPTER with no scroll cue, and the keybo ...
   - Expected: Every tab reachable by sight; tiles whole; touch hints on a touch device.
   - Repro: 390x844 touch, Chapter I, tap the chip, read the strip.
   - Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause/phone-pause-0.png; critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause2/swipe1.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png
   - Requirement: CHK-003, CHK-009, onboarding (device usability)
   - Smallest fix: Fade the strip edge as a scroll cue; hide keyboard hints on touch; fit the tile text.
   - Acceptance: Strip shows an edge cue; no clipped tile text at 390x844.
46. **PR-0543** [minor, interface, FFX only] FFX target mode lacks the Enter/Esc strip FFX-2 shows, and the hint strip calls the guide 'Intel' (carried, stalled; CHK-020 polish difference)
   - Chapter and state: FFX target mode / target step. Last seen: round 36. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed: FFX target step prints no Enter/Esc strip while FFX-2 prints ENTER CONFIRM / ESC BACK. FFX-2 target frames show ENTER CONFIRM / ESC BACK; FFX frames do not; the hint strip labels the guide Intel while its panel says GUIDE. ROUND 32b ADDITION (G1 pairing (CHK-020)): Re-read on 64 round-32 frames in four chapter pairs: the FFX target step still has no ENTER CONFIRM / ESC BACK strip while src/ui/ffx2/TargetPlates.ts:28 draws one for FFX-2, and the hint strip still says Intel for the panel headed GUIDE. Same on the F1 HUD and the older HUD; present in release 69; not a regression. ROUND 34 (build 2342fe666): Re-observed unchanged: FFX tar ...
   - Expected: The same help in both, in one word.
   - Repro: Chapter I, Attack, target step.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/16-target-single.png; critic/rounds/round-32/gaps-G1-static/chk020-pairing.json
   - Requirement: CHK-020
   - Smallest fix: Add the strip and unify the word.
   - Acceptance: Both games print the strip; one word for the guide.
47. **PR-0521** [minor, feel, FFX-2 (Chapter IV)] Pro camera framing in the action stills: Bahamut zooms and shifts within a turn; the sphere change swings the scene sideways (carried; see PR-0530 for the question to Bailey)
   - Chapter and state: ffx2-bahamut / seq-action-playing and seq-spherechange at 250 ms steps. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): First-time fan re-observed in Seymour Flux (seq-action-playing f02 to f03: Yuna about 480 px then 220 px tall), Spherimorph and Mirror Aeons: the camera cuts from a close shot of the party to a far shot in one frame and the whole party shrinks by about half. Whether this is the intended camera grammar is not established (the harness projects without clipping at a camera cut, PR-0638); a question for Bailey, not a build. Carried and widened by the first-time fan: a hard camera cut mid-action in Seymour Flux (a boss framing flips to a wide shot, the party at about half size, frames 2 to 3 of seq-action-playing), in Braska (a tight dark close-up to a ...
   - Expected: A coherent camera (Bailey's judgment, PR-0530).
   - Repro: Chapter IV, Rikku WARRIOR change at 1600 and 2000.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/seq-spherechange
   - Requirement: CHK-B2
   - Smallest fix: Ask Bailey.
   - Acceptance: A recorded verdict.
48. **PR-0514** [minor, audio, both] The first UI sounds of a session fall back to the procedural synth, more often and for longer this round (7 of 11 logged runs, up to 14 sounds in the FFX-2 chapters; round 30: 2 of 17)
   - Chapter and state: title and chapter select, first 2 to 7 s of a fresh profile / cold profile, live network. Last seen: round 36. Tags: introduced unknown, regression unknown. Confidence: medium for the entries, none for the cause.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-measured: 8 of 17 capture runs log via=synth sounds in the first 2.2 to 12.8 s (35: 30 of 33); no Ifrit, Youth League, Jenova or Mirror Aeons run did; no 404s, so the sample is late rather than missing. ffx2-bahamut-win-2k 13 synth sounds 3.47 to 6.05 s; phone 9; vegnagun 14 (3.83 to 6.58 s); the Chapter I runs are clean. Cause not established (sprites 2.7 and 4.6 MB over the live network, host load, or the r68 load order). ROUND 34 (build 2342fe666): PREVALENCE UP: 22 of 31 runs log 1 to 20 procedural-synth UI sounds (cursor-move, confirm, menu-page) in the first 2.6 to 12 s of a fresh profile, against 1 of 28 in round 33. No desktop audio-loa ...
   - Expected: CHK-001 item 3: nothing falls back to synth.
   - Repro: Fresh profile, FFX-2 chapter select to Chapter IV; move and confirm within 3 to 6 s.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/audio-debug.jsonl; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/audio-debug.jsonl; critic/rounds/round-34/audio/synth.log
   - Requirement: CHK-001 item 3
   - Smallest fix: Gate the UI cue on the first sprite decode, or start its fetch ahead of art.
   - Acceptance: Ten cold runs log no synth entry in the first 7 s.
49. **PR-0099** [minor, audio, both] Stand-in or borrowed scene beds and battle cues in eleven chapters (carried; not re-judged by ear)
   - Chapter and state: eleven chapters / carried. Last seen: round 36. Tags: introduced -, regression -. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Five more stand-in beds, none heard: boss-ffx2-fallen-aeons for Ifrit and the Youth League; boss-challenge for Spherimorph, Wendigo and Omega Ruins; Jenova LIFE silent (PR-0676). Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 34 (build 2342fe666): Extended to the four hidden chapters: Keeper uses Yunalesca's boss-challenge and scene-zanarkand-dome; Maesters and waker use boss-ffx2-fallen-aeons and scene-bevelle-underground; yrp uses Chapter IV's cues. Routing equals the data; none heard. Round 35: all eight new hidden chapters borrow existing cues; only Dark Aeons has a row in docs/audio ...
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
50. **PR-0552** [minor, interface, FFX-2 only] FFX-2 Mega Flare telegraph: the CHAIN counter is drawn over the ATTACK row (carried; not re-observed)
   - Chapter and state: Chapter IV / carried. Last seen: round 36. Tags: introduced -, regression -. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed at Ifrit: the CHAIN x1.45 box overlaps the command menu and hides part of CHANGE and the whole ITEM row (seq-action-playing f09; one frame, duration not measured). The Ifrit Bahamut capture shows no such overlap. Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
51. **PR-0598** [minor, interface, both] The key prompt strip (Enter Select / G Intel / Q Defend / P Pause) is hidden from link 2 of an F1 chain: the victory-state class f1-over outlives its link
   - Chapter and state: F1 chains: Leblanc (FFX-2 VI), Trema (XIII), Den of Woe (XV), Isaaru (FFX XIV), Braska (FFX III), Fallen Aeons (FFX-2 XI) / first command menu of link 2 or later of a chained chapter that draws the F1 HUD, 1600x900, real keys, seed 1; link 1 and every retried link 1 show the strip. Last seen: round 36. Tags: introduced true, regression true, new feature. Confidence: high for the measurement and the cause (the class and the rule are in the source).
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed in Mirror Aeons: the key strip (Enter Select / G Intel / Q Defend / P Pause) is on screen at link 1 and gone at link 2's first menu. CHK-006 FAIL. ROUND 35B (misc lane, live 36b6e851d, seam.mjs, seed set before the first key, autoBattle('intended') between first menus and switched off the moment a link begins, so every first menu is read waiting for a player): MEASURED, CHK-006 FAIL. Link 1 passes everywhere (.f1-prompts opacity 1, no f1-over). From link 2 on the strip is opacity 0 and the HUD root carries f1-over in every chain read: Den of Woe links 2 and 3 of 3, Isaaru links 2 and 3 of 3, Leblanc links 2 and 3 of 3, Fallen Aeons (FF ...
   - Expected: The victory-state class lives only for the link that ended; each link's first menu shows the key help.
   - Repro: Real keys, Leblanc: win link 1, read .f1-prompts opacity at the link 2 first menu (0) and after a loss and RETRY at link 1 (1). Same in Isaaru link 3, Den of Woe link 3, Trema link 2, Braska link 3.
   - Evidence: critic/rounds/round-32/gaps-G3-chains-overlays/3c-isaaru/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3c-den-of-woe/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3b-trema/run.json
   - Requirement: CHK-006 (adjacent: a link-victory state outlives its owner), RUBRIC interface and onboarding (key help)
   - Smallest fix: Clear f1-over (and the other end-of-fight classes) when the next link begins, in the presenter's link seam (stageLinkBegins / the chain runner), not only in release().
   - Acceptance: At the first menu of every link of Leblanc, Braska, Isaaru, Trema and Den of Woe the .f1-prompts opacity is 1 and f1-over is absent from the HUD root.
52. **PR-0651** [minor, feel, FFX (Flooded Ways), FFX-2 (Bevelle Guardians)] Rikku and Paine double up or drop out of the picture for several frames during attacks in two new hidden chapters
   - Chapter and state: 36 Flooded Ways, 37 Bevelle Guardians / party action sequences, seed 1, 1600x900. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: medium (one sequence sheet each; a clip would settle it).
   - Observed: Flooded Ways: a second dim Rikku behind the standing one, then a red layered ghost body under the 921 number (seq-party-action f03, f07, f09; seq-action-playing f03 to f04). Bevelle Guardians: Paine is drawn twice at once on her sword attack, absent for f02 to f05, back standing in f06. The chapters are not in the continuity harness registry, so CHK-026 and CHK-027 are UNVERIFIED for them and the strips do not exist.
   - Expected: A figure stays on screen through its own attack; no double image over the line (CHK-027).
   - Repro: Type geosgaeno or drillshot, attack with Rikku or Paine at the first menu; read the sequence sheets in critic/rounds/round-35/fan-sheets.
   - Evidence: critic/rounds/round-35/fan-sheets/flooded-ways-win-r35__seq-party-action.jpg; critic/rounds/round-35/fan-sheets/ffx2-bevelle-guardians-win-r35__seq-party-action.jpg
   - Requirement: CHK-027 continuity of motion; first-time-fan lens (D-423)
   - Smallest fix: Register the two chapters in the harness, read the strips, and treat the swaps in the existing pose ledger; the cause is not traced.
   - Acceptance: The harness reads both chapters with no figure absent for more than one frame in an attack and no double over the line.
53. **PR-0641** [minor, interface, FFX] Flooded Ways advice and intent card are the generic ones: plain Attack is advised, the counter and the Open Lock route are not said
   - Chapter and state: 36 Flooded Ways (word geosgaeno), area 1 first menu / first menu, E and G, seed 1, 1600x900. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: medium (whether the card should list the counter is a design call the handoff leaves open).
   - Observed: The cursor sits on OPEN LOCK and the story line says "Open one of the gate locks. It costs the turn.", but the advisor says "Attack -> Evrae Altana 313-353, most damage on the board". The Stone Gaze card has no IF YOU ATTACK row and no J HOLD footer, although areas 1 and 2 answer a plain Attack with a counter that costs the attacker HP, and a Petrify that lands in the water shatters its victim; the card lists only PETRIFY 50 percent (the handoff also lists Sleep 50).
   - Expected: The conditional counter is separated from the certain Stone Gaze and the advice does not steer a newcomer into the counter (RUBRIC section 2).
   - Repro: Type geosgaeno, start the fight, read 12-intent-E.png and 13-guide-G.png.
   - Evidence: critic/rounds/round-35/evidence/flooded-ways-win-r35/12-intent-E.png; critic/rounds/round-35/evidence/flooded-ways-win-r35/13-guide-G.png; docs/handoff/ch-flooded-ways.md section 7 (advisor line not built)
   - Requirement: CHK-004, CHK-005
   - Smallest fix: Give the chapter its advisor line (Open Lock first in areas 1 and 2, no plain Attack until area 3) and an IF YOU ATTACK row, as the handoff proposes; it needs Bailey's yes on the plate.
   - Acceptance: Area 1 first menu: the chip names Open Lock; the E card shows IF YOU ATTACK with the counter.
54. **PR-0639** [minor, interface, FFX] Penance: the opened intent card stacks over the default-open guide panel and the two texts collide
   - Chapter and state: 35 Penance (word judgment), first menu with E pressed / 1600x900, seed 1, real keys. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: The Obliteration card (x 290 to 663) lands on the guide panel (x 55 to 383): the TIDUS, YUNA and RIKKU labels sit over the guide sentences and the guide's BOSS BATTLE tag is cut. Both texts are partly unreadable at the first menu a newcomer sees.
   - Expected: Panels keep their own space (CHK-008).
   - Repro: Type judgment, start, press E at the first menu with the guide open.
   - Evidence: critic/rounds/round-35/evidence/penance-win-r35/12-intent-E.png
   - Requirement: CHK-008
   - Smallest fix: Anchor the F1 intent card to the right of the guide column or fold the guide while the card is open.
   - Acceptance: A 1600x900 and 2000x1012 frame with guide and card open shows 0 px of text-box overlap.
55. **PR-0643** [minor, interface, FFX] Yojimbo's turn menu in Dark Aeons offers only AEON and DISMISS, with no advice, and his plate prints MP "0 /1"
   - Chapter and state: 34 Dark Aeons, link 6 (Dark Anima), Yojimbo's turn / 1600x900, seed 1, real keys. Last seen: round 35b. Tags: introduced true, regression false, new feature. Confidence: medium on the missing advice, low that it is unintended.
   - Observed: ROUND 35B: the Dark Aeons lane played links 6 and 7 by real keys: Yuna's advisor card calls Yojimbo in, and on each of his turns AEON opens a ladder of Pay rows (Aeon > Pay 100,000), so the two rows are the gate to the Pay ladder; link 6 lost once (two Pays rolled plain Wakizashi strokes) and link 7 once, and each won on the retry (Zanmato on the first Pay after the summon). Whether his turn menu says anything about Pay or the odds was not read separately; the missing-advice half stands as filed. Job-side finding: on a fodder aeon's turn the card named an Overdrive row (Ixion's Thor's Hammer) that the lane's generic opener could not reach, so the aeon was dismissed instead; the row path was  ...
   - Expected: The advisor says what to press (or that Yojimbo acts for himself) and what it costs; the plate prints a real MP.
   - Repro: Type darkaeon, reach link 6, summon Yojimbo.
   - Evidence: critic/rounds/round-35/evidence/dark-aeons-win-r35b/27-no-choosable-row.png; critic/rounds/round-35/gaps-b/wins/darkaeons/link06-first-menu.png; critic/rounds/round-35/gaps-b/wins/darkaeons/battle-log-dark-anima#1006.json
   - Requirement: CHK-004, CHK-005
   - Smallest fix: One advisor line on the Yojimbo turn (the handoff's Pay and Zanmato line) and a fixed MP readout.
   - Acceptance: At Yojimbo's turn the chip names the action and its cost; links 6 and 7 are played by real keys (PR-0635).
56. **PR-0647** [minor, visual, FFX-2] Yuna's Ballad: a hard vertical seam in the backdrop at the dress-change close-up
   - Chapter and state: 40 Yuna's Ballad (word wraith) / midfight and first dress change, 1600x900, seed 1. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: The left 125 to 165 px is a differently tinted strip with a hard vertical edge and floor lines that do not continue across it, while the opponent is almost out of frame.
   - Expected: The backdrop covers the whole view at every camera pose.
   - Repro: Type wraith, Change to Warrior or read 23-midfight.
   - Evidence: critic/rounds/round-35/evidence/ffx2-yunas-ballad-win-r35/23-midfight.png; critic/rounds/round-35/scratch/yb-edge.jpg
   - Requirement: Staging and consistent backdrop (CHK-011, CHK-013)
   - Smallest fix: Suspected: the plate is narrower than the dress-change camera's pan; widen it or clamp the close-up's lateral shift (not traced).
   - Acceptance: No luminance step above a few percent along any vertical line in the left 300 px at 1600x900 and 2000x1012.
57. **PR-0648** [minor, visual, FFX] Penance's disc and arms render soft and pixelated with a light fringe beside crisp party art
   - Chapter and state: 35 Penance / 23-midfight, 1600x900. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: Stair-stepped edges, mushy blade detail and a pale halo along the silhouettes in a zoomed crop.
   - Expected: The boss painting reads as sharp as the party at its on-screen size. Approved art is judged for how it renders, not replaced on taste.
   - Repro: Type judgment, first command, crop the disc edge.
   - Evidence: critic/rounds/round-35/evidence/penance-win-r35/23-midfight.png; critic/rounds/round-35/scratch/pen-zoom.jpg
   - Requirement: CHK-013
   - Smallest fix: Suspected: the source is smaller than its drawn size or the cut-out keeps a matte edge; compare pixel size with draw size (not traced).
   - Acceptance: A crop of the disc edge shows no stepped edge or halo; draw size within the other bosses' ratio of source size.
58. **PR-0650** [minor, combat, FFX-2] A Confused possessed Rikku takes the status and changes nothing: the engine leaves a Confused monster to its script
   - Chapter and state: 40 Yuna's Ballad duel 1 / engine; docs/handoff/ch-yunas-ballad.md section 4 N5, YB9. Last seen: round 35. Tags: introduced false, regression false, new feature. Confidence: medium (disclosed by the builder as a known gap).
   - Observed: Confuse lands (resist byte 0) but Rikku's weaker item list is unreachable; tests/unit/chapters/yunas-ballad-engine.test.ts pins it as a KNOWN GAP and the guide card leaves Confuse out.
   - Expected: The game's Confused Rikku uses her weaker item set (research/re-ffx2-yunas-ballad.md).
   - Repro: See the handoff and the KNOWN GAP test.
   - Evidence: docs/handoff/ch-yunas-ballad.md; tests/unit/chapters/yunas-ballad-engine.test.ts
   - Requirement: Faithful statuses (AGENTS.md rule 6)
   - Smallest fix: Wire monster confusion to the record's alternate list, or keep the guide card's statement.
   - Acceptance: A Confused possessed Rikku acts from her weak list on 10 of 10 seeds.
59. **PR-0656** [minor, delivery, both] Four door-interference tests take 222 to 281 seconds each and time out at 345 s under load; the cost grows with every new hidden word
   - Chapter and state: unit suite (windwaker-, valefor-, daigoro-, angra-door tests) / full vitest run, 32,625 tests. Last seen: round 35. Tags: introduced false, regression false. Confidence: high.
   - Observed: 32,493 passed, 125 skipped, 1 todo, 6 failed: four door-interference timeouts, one manifest-lock EPERM, one install test. All six files pass on re-run (122 tests, 304 s); no combat, data or parity test failed.
   - Expected: A release-gate test finishes in seconds so a loaded machine never turns it into a false failure.
   - Repro: node node_modules/vitest/vitest.mjs run tests/unit/windwaker-door.test.ts tests/unit/valefor-door.test.ts tests/unit/daigoro-door.test.ts tests/unit/angra-door.test.ts
   - Evidence: critic/rounds/round-35/combat/vitest-full.log; critic/rounds/round-35/combat/rerun6.log
   - Requirement: Reliable delivery gate
   - Smallest fix: Sample the word pairs or drive the matcher directly instead of mounting the board for every pair.
   - Acceptance: The four files finish in under 30 s each on a loaded machine.
60. **PR-0586** [minor, interface, FFX only] R32-INT-01: the F1 command row cuts the selected row's own label or hint ('SPECI...' on Isaaru, 'A one-off action this...' on Braska and Natus)
   - Chapter and state: Chapter XIV Isaaru (Yuna), Chapter III Braska, Chapter X Natus / F1 command row at 1600x900, real keys, seed 1, cursor on SPECIAL (Isaaru) or TALK (Braska, Natus). Last seen: round 34. Tags: introduced true, regression true, new feature. Confidence: high that it shows; medium on the cause.
   - Observed: With the cursor on SPECIAL the row prints 'SPECI... x2 Open the Special ...': the label loses its last letters before the hint does. On TALK the hint ends 'A one-off action this...'. In round 31 the Braska and Yuna rows (old HUD) printed TALK and SPECIAL whole. The builder traces it to the F1 row's label against its x2 badge and inline description (docs/handoff/booth-b3.md 12.4); I did not trace the CSS line. ROUND 32b ADDITION (G2 layout sweep): Instrument confirmation on the live bundle: sweep.mjs battle, Isaaru, 1600x900, first menu: .ffx-cmd__label 'Special' sw 53 / cw 47 on three surfaces (out-battle.json results['isaaru-via-purifico']); the four other FFX F1 chapters swept (Yunalesca,  ...
   - Expected: Every name that can be shown is shown in full; a hint may shorten, a label may not (CHK-009).
   - Repro: Real keys from the title: Chapter XIV, party prep, Start Battle, first menu, cursor on SPECIAL (1600x900, seed 1); Chapters III and X, TALK.
   - Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png; critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/seymour-natus-win-r32/12-intent-E.png
   - Requirement: CHK-009
   - Smallest fix: Let the label keep its width and truncate the inline description first.
   - Acceptance: The label prints whole on every selected row of the three chapters at 1600x900 and 2000x1012.
61. **PR-0585** [minor, visual, both] Approved backdrops are graded much darker in the treated chapters (Leblanc, Braska, Macalania, Natus, and now Yojimbo, treated in release 72): a question for Bailey, not a replacement
   - Chapter and state: treated chapters (Leblanc, Braska, Macalania, Natus and the other booth chapters) / battle arenas, releases 69 and 70, 1600x900. Last seen: round 34. Tags: introduced true, regression true, new feature. Confidence: medium.
   - Observed: The grade is the intended booth treatment, but Leblanc's backdrop C reads dark magenta, Braska's red sky near black and Macalania dim blue in battle. The handoff (booth-ffx-b3b J6) says a still beside Chapter I is owed before Bailey judges it. ROUND 33: Chapter IX Yojimbo (release 72): the approved cold grey-blue chamber with a shaft of daylight shows only a faint light shaft over a near-black void in the build (evidence/yojimbo-cavern-win-r33/23-midfight.png against targets/yojimbo-chamber.jpg); Yojimbo himself matches the approved boss A. Same family as the earlier four; Bailey still has not judged J6. ROUND 34 (build 2342fe666): Yojimbo's chamber is a near-black void against the approved  ...
   - Expected: Approved art stays recognisable in the running game; Bailey judges the grade.
   - Repro: Compare critic/rounds/round-32/targets/leblanc-backdrop.jpg and critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg.
   - Evidence: critic/rounds/round-32/targets/leblanc-backdrop.jpg; critic/rounds/round-32/targets/macalania-backdrop.jpg; critic/rounds/round-32/targets/natus.jpg
   - Requirement: approved-target gate; Bailey judgment
   - Smallest fix: Show Bailey the still beside Chapter I (job J6) and take his verdict. No change before that.
   - Acceptance: Bailey's recorded verdict on the arena grade.
62. **PR-0227** [minor, encounter, FFX-2] Trema's real route lost seed 1 twice this round (a win in round 32); the fight stays a coin-flip-plus at human pace (carried from rounds 25 to 27)
   - Chapter and state: XIII ffx2-trema / real keys, advisor's pick each turn, seed 1. Last seen: round 35. Tags: introduced -, regression -. Confidence: high.
   - Observed: Defeat at turn 217 with Trema at 24,313 of 999,999 HP, and a second defeat at turn 30 inside the Paragon link; seed 2 won in 229 turns (21:07). The engine measure is unchanged and md5-identical to round 32 (intended line 71 of 100 seeds). The pinned seed does not pin the outcome because FFX-2 plays in real-time ATB. Reached the pro-defeat screen both times. Round 35: Trema won by real keys in 22.7 minutes (seed 1); human-pace odds remain unmeasured.
   - Expected: A 999,999 HP superboss is allowed to be hard (research/ffx2-trema.md); the win rate for a competent human should sit where the sources put it. Round 32 recorded about 60 percent at human pace.
   - Repro: Chapter XIII, default party, advisor's NEXT BEST MOVE each turn, setSeed(1); bench: tests/unit/ffx2-parity-measure.test.ts with PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-100.
   - Evidence: critic/rounds/round-33/evidence/ffx2-trema-win-r33/run.json; critic/rounds/round-33/evidence/ffx2-trema-win-r33-s2/run.json; critic/rounds/round-33/audit-combat/ffx2-measure-cand-1-100.json
   - Requirement: encounter authenticity and balance; where: src/data/ffx2/enemies/trema.ts is sourced and correct; a balance question
   - Smallest fix: No change without Bailey's yes (boss-side numbers are never tuned without measured options); if he wants it gentler, build and measure the sourced alternatives and ask once.
   - Acceptance: ffx2-parity-measure seeds 1-100 for the chosen option, win rate named against the research.
63. **PR-0607** [minor, delivery, both] From the battle slate to the first command menu takes a median 9.5 s (8.2 to 16.5 s) on a desktop and 8.2 to 12.7 s on the phone: 15 of 19 chapters are over the builder's own 8 s budget; Chapter I 15.8 to 16.5 s at six sizes
   - Chapter and state: every chapter; Chapter I worst / unthrottled desktop, 1600x900 and five other sizes, seed 1, cache cold; host shared with other review lanes. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: slateToMenuMs from the capture owner's gap runs: Chapter I 16.2 s at 1600x900, 15.8 s at 2000x1012, 16.3 s at 1280x720 and 3840x2160; Anima 14.1 s; Bahamut 11.7 s; the rest 8.2 to 11.7 s. The wait contains the intro slate and, in Chapter I, Seymour's opening Lance of Atrophy, and no round-32 baseline exists for this number. The cold title load is fine (0.7 s, 3.1 MB). The sweeps shared the host, so the figures are upper bounds. The delivery auditor rated this major; the chief rates it minor because it is an upper bound on a shared host against the builder's own budget, not a rubric limit, and the confirmer would keep it major only if an idle-host remeasure also fails.
   - Expected: The builder's budget: 8 s and 50 MB on the phone profile; RUBRIC section 2 asks for a load under five seconds on named conditions.
   - Repro: Fresh headless Chromium (PYREFLY_BROWSER=gpu), https://echoesofspira.com/, Enter twice at the title, pick Chapter I, Enter through prep and scene, time screen=battle to awaitingMenu (critic/runner/lib/gap-boot.mjs, slateToMenuMs).
   - Evidence: critic/rounds/round-33/evidence/gaps/index.json; critic/rounds/round-33/evidence/gaps/coldload/out.json
   - Requirement: RUBRIC section 2 platform goals; delivery
   - Smallest fix: Re-measure on an idle host and on the phone10 profile for Chapters I and IV; split the slate from the opening action in the capture; if still over, trim what the first fight preloads before the first command (suspected, not traced). Related: PR-0481, PR-0567, PR-0572.
   - Acceptance: Median first-command wait at most 8 s on an idle host in every chapter, recorded with the host CPU busy percent.
64. **PR-0581** [minor, feel, FFX] R70-C1 Braska: the return-flip teleports are repaired (release 72 FlipFit: 3 teleports of 302 to 340 px to 0); mid-move dashes of 160.6 px remain over the 150 px acceptance line
   - Chapter and state: Chapter III braskas-final-aeon / treated Chapter III, win by real keys, seed 1, 1600x900 (the dedicated continuity harness) and the orchestrator live-gap lane on the same bundle UNVtEttT; absent at ?treated=pack. Last seen: round 34b. Tags: introduced false, regression false. Confidence: high for the measurement and the strip; the cause is suspected.
   - Observed: Round-32 harness (braskas-final-aeon-win-r32): 3 mid-move teleports of Tidus of 340, 312.8 and 302.1 px in one frame (no pose swap, not a camera cut: all other figures step 20 px or less in the same frame; Tidus's own move speed is about 45 px a frame), 138 dashes over the fail line (worst 294.5 px). The live-gap lane (live70, 1,696.7 s) reads four teleports of 306 to 417 px in Energy Rain (worst 416.6 px) and 26 plain-Attack hops of 254 to 290 px straight up in one frame, against a live-69 control of 116 px at most; the pack arm's worst dash is 116.2 px. Round 31 (release 68) Braska had 0 teleports and a worst dash of 153.6 px. The focused review of this build (critic/reviews/e3f51bf18-focu ...
   - Expected: A move may not move a figure faster than the move itself: no single-frame plane step above the policy limit (CHK-027 item 4) and no dash over 150 px.
   - Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=braskas-final-aeon --goal=win --size=1600x900 --seed=1 --tag=r32; read continuity.json jerks of kind teleport (figure tidus, about 1195 s, frame 69853); compare with ?treated=pack.
   - Evidence: critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/jerk-005-tidus.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/continuity.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-braska-live.json
   - Requirement: CHK-027 items 4 and 9, RUBRIC 6a; animation and camera sub-scores
   - Smallest fix: Suspected cause (not traced to a line): the treated Braska hold in src/engine/motion/PieceHolds.ts lets Tidus's return flip draw 1.66x larger, which the plane-step reads as a jump. Smallest correction: hold the flip at the idle's size for the treated chapter (or take the Braska row out of PIECE_HOLDS) until the curves lane re-measures it.
   - Acceptance: Harness on braskas-final-aeon, seeds 1 and 2: 0 teleports of 300 px or more, no dash over 150 px, CHK-027 PASS for Tidus.
65. **PR-0582** [minor, feel, FFX] R70-C2 KO floor slide: repaired in the two chapters re-measured on this build (Isaaru swap jerk 89.6 to 26.2 px, Anima/Macalania 80.3 to 0, release 72 SlideEase); Ixion (FFX-2 XVI) is now read: CHK-027 PASS, 0 swap jerks
   - Chapter and state: Chapter XIV isaaru-via-purifico and Chapter VII seymour-anima-macalania / treated Chapters XIV and VII, win by real keys, seed 1 (and seed 2 in XIV), 1600x900. Last seen: round 34b. Tags: introduced false, regression false. Confidence: high for the measurement; medium for the cause.
   - Observed: Harness: Ixion idle-to-KO feet jerk 89.6 px in Chapter XIV (frame 16224, about 274 s) and 80.3 px in Chapter VII (frame 14824, about 252 s); round 31 read 27.3 px and 0 px. The live-gap lane read 89.2 px (seed 1) and 90.8 px (seed 2) in XIV with the KO painting placed 355 px from the idle plane (ProneLay at its maximum) against minus 9 px at ?treated=pack. ?pro=off and ?pack=off do not remove it; ?hud=today shrinks the slide to 250 px and passes seed 1 but not seed 2 (86.4 px). Strip swap-233-ixion-idle-ko.jpg shows the lying body well to the right of the standing figure after a red blend. The finding is wider than the focused review's (Chapter XIV only). ROUND 33: Same-artifact focused run  ...
   - Expected: A KO lands where the figure fell; the KO swap moves the feet less than 40 px in one frame (CHK-027 item 9).
   - Repro: Harness --chapters=isaaru-via-purifico (and seymour-anima-macalania) --seed=1 or 2; read swap jerks for figure ixion; compare ?treated=pack.
   - Evidence: critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg; critic/rounds/round-32/continuity/seymour-anima-macalania-win-r32/continuity/strips/jerk-026-ixion.jpg; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s1.json
   - Requirement: CHK-027 item 9 (a jerk at a pose swap is gated), RUBRIC 6a
   - Smallest fix: Suspected: ProneLay (src/engine/motion) picks its maximum slide candidate under the treated holds' setProneAvoid areas. Smallest correction: cap the KO plane within 40 px of the standing plane, or ease it over the dissolve.
   - Acceptance: Harness on Chapters XIV (seeds 1 and 2) and VII: Ixion's swap jerk under 40 px.
66. **PR-0604** [minor, interface, FFX] "Deals no damage." heads intent cards that then list damage (Yojimbo's Daigoro, Omnis's Mortiphasm Spells)
   - Chapter and state: IX yojimbo-cavern, XII seymour-omnis / first menu, key E, seed 1. Last seen: round 34. Tags: introduced -, regression -. Confidence: high.
   - Observed: Yojimbo's card reads "Daigoro SCRIPTED Deals no damage." directly above "DAMAGE - RANDOM TARGET LULU 544-615 ... Lands on one of these, picked when it acts." The order itself deals none (research/ffx-yojimbo.md) and the dog's bite lands on one character, so each half is true and the card reads as a contradiction. Present in round 32. ROUND 34 (build 2342fe666): Re-observed in Yojimbo (Daigoro) and Omnis (Mortiphasm Spells): "Deals no damage." heads a card that then lists LULU 544-615 etc.
   - Expected: A lead that says what the player will see ("Orders the dog; its bite lands on one of these"), with no "Deals no damage" above a damage block.
   - Repro: Chapter IX, seed 1, first menu, press E: evidence/yojimbo-cavern-win-r33/12-intent-E.png.
   - Evidence: critic/rounds/round-33/evidence/yojimbo-cavern-win-r33/12-intent-E.png
   - Requirement: CHK-004; where: src/battle/ffx/intent.ts:330 (the string; the order-row branch is suspected)
   - Smallest fix: Suppress "Deals no damage" when the row carries a follow-up or per-target damage block; use an order-specific lead for dog and trigger orders.
   - Acceptance: Yojimbo and Omnis E cards no longer print "Deals no damage" above a damage block; Sin "Drawn to Sin" keeps it.
67. **PR-0605** [minor, interface, FFX] Evrae turns 68 to 80: the advisor wants "Potion -> Kimahri" nine times on a full-HP party and the played action is "Al Bhed Potion" on all three (suspected; no frame of the chip)
   - Chapter and state: VIII evrae-airship / seed 1, Chapter VIII from turn 66. Last seen: round 34. Tags: introduced -, regression -. Confidence: low to medium (data only).
   - Observed: turn-log entries 68 to 80 (identical in round 32): want {Potion, Kimahri, Items}, took "Al Bhed Potion"; battle-log seq 535 to 556 shows +1000 on Tidus, Wakka and Kimahri while all three are at full HP with no status. Either the chip names an item the list does not hold or the harness mapped the label; no frame of the chip at turn 68 exists. ROUND 34 (build 2342fe666): Re-observed: turns 68 to 80 want Potion for Kimahri (1250/1250) and play Al Bhed Potion; nine picks; still no frame of the chip.
   - Expected: A recommendation the actor can press as worded, on a target it helps; with nothing to heal the chip should offer the waiting move or a buff.
   - Repro: Chapter VIII Evrae, seed 1, follow the advisor from turn 66; data in evidence/evrae-airship-win-r33/turn-log.json 68 to 80 and battle-log.json seq 535 to 556.
   - Evidence: critic/rounds/round-33/evidence/evrae-airship-win-r33/turn-log.json; critic/rounds/round-33/evidence/evrae-airship-win-r33/battle-log.json
   - Requirement: CHK-004; where: src/engine/tactics (suspected, not traced)
   - Smallest fix: Capture the chip at turn 68 first; if it reads Potion, derive the label and target from the row the menu offers and add a no-op-heal guard (suspected: src/engine/tactics).
   - Acceptance: A frame of the Evrae chip at turn 68 shows an item that exists with the target it will hit; no heal is advised at full HP.
68. **PR-0606** [minor, interface, FFX-2] Vegnagun's Tail Beam card shows Yuna 1,126 and Paine 2,654 where the sourced rule is 31.25 percent of maximum HP (777 and 1,832); Rikku 1,766 matches (suspected; no played hit)
   - Chapter and state: V ffx2-vegnagun-shuyin / link 1, key E. Last seen: round 34. Tags: introduced -, regression -. Confidence: low (no engine run this round).
   - Observed: Card: YUNA 1,126, RIKKU 1,766, PAINE 2,654 (Yuna 1238/2488, Rikku 4402/5652, Paine 4612/5862). The G card and src/data/ffx2/enemies/vegnagun-abilities.ts say 31.25 percent of maximum HP: 777, 1,766, 1,832. Yuna and Paine read 1.449 times higher. The tail never acted in this run, so no played hit settles it. ROUND 34 (build 2342fe666): Re-observed: Tail Beam card Yuna 1,126, Rikku 1,766, Paine 2,654, the same figures as 33b; no played hit read.
   - Expected: Card figures equal what the engine deals and the rule the guide states.
   - Repro: Chapter V, seed 1, first menu, press E (ffx2-vegnagun-shuyin-win-r33/12-intent-E.png); run the engine's Tail Beam against the three targets.
   - Evidence: critic/rounds/round-33/evidence/ffx2-vegnagun-shuyin-win-r33/12-intent-E.png
   - Requirement: AGENTS.md rule 6 and CHK-004; where: src/battle/ffx2 intent estimate against abilities-vegnagun (not traced)
   - Smallest fix: Run the engine's Tail Beam on Yuna and Paine at those HP; correct whichever of card, engine or guide sentence is wrong.
   - Acceptance: Card, guide and engine agree for all three.
69. **PR-0610** [minor, feel, FFX-2] Phone: the first-time dress-change coach card covers the upper half of the fight, with the party and Bahamut behind it, while the gauges keep running, until it fades on its own
   - Chapter and state: IV ffx2-bahamut, 390x844 touch, first dress-sphere change / touch run, first Change command. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: The card ("Rikku: New dress, new moves ... pick the gate that pays.", FADES ON ITS OWN, FIRST TIME ONLY) sits over the battle in all ten sampled frames of the change sequence (seq-spherechange f00 to f09, f04 read by the chief) under the banner "GAUGES RUNNING - A COMMAND HOLDS THEM". The first-time fan rated it critical; the chief rates it minor: it appears once, fades by itself, hides no control and does not stop play. The Active-mode clock continues behind it, which is the reason it is worth a decision.
   - Expected: A first-time hint that does not hide the action it describes, or that holds the clock while it is up on a phone.
   - Repro: 390x844 touch, Chapter IV, seed 1, open CHANGE for the first time.
   - Evidence: critic/rounds/round-33/evidence/ffx2-bahamut-win-r33-phone-touch/seq-spherechange/f04.jpg
   - Requirement: CHK-008, first-time fan (D-423); where: phone coach card layout; not traced
   - Smallest fix: Dock the card at the bottom of the phone screen, or shorten it to one line; keep the fade.
   - Acceptance: The party and the boss are visible in every frame of the first Change sequence at 390x844.
70. **PR-0460** [minor, combat, FFX only] Chapter III possession links 3 to 6 Summon rows still not seen in a browser this round (carried; reused from round 30b under a written argument)
   - Chapter and state: braskas-final-aeon / links 3 to 6. Last seen: round 34. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Carried: the real-key Braska run (284 turns, 6 seams) used Summon once (Bahamut, link 1); links 3 to 6 never opened the Summon or Grand Summon rows. The engine probe ch3 shows every row enabled with a picker of five aeons (md5-identical to round 31). ROUND 33: Gap pass, browser read at Chapter III link 3 (possessed Ifrit; the link was reached with the labelled autoBattle and fast-speed hooks, switched off before the capture): Yuna's menu shows OVERDRIVE READY and no Summon row; opening it shows "GRAND SUMMON - NO AEON AVAILABLE - CANCEL TO GO BACK" with Ixion, Shiva and Bahamut as greyed empty bars, which matches scriptCommandDisables and research/ffx-bfa-yu-yevon.md section 7 (the roster is ...
   - Expected: Seen by real keys.
   - Repro: As round 30b.
   - Evidence: critic/rounds/round-30/gaps2; critic/rounds/round-33/evidence/gaps/braska-summon-rows3/07-yuna-down.png; critic/rounds/round-33/evidence/gaps/braska-summon-rows3/rows.json
   - Requirement: CHK-023
   - Smallest fix: As carried.
   - Acceptance: As carried.
71. **PR-0588** [minor, audio, both] The sound pass (+4 dB makeup, -14 dB voice duck, layered hits) now plays in ten chapters but its level was measured only in Chapters I and IV
   - Chapter and state: FFX II, III, VII, X, XIV; FFX-2 VI, XIII, XV (the treated chapters) / desktop, live, seed 1. Last seen: round 35. Tags: introduced true, regression unknown, new feature. Confidence: medium (reach proved from code, level unmeasured).
   - Observed: Releases 69 and 70 changed audioNewOn() to isTreatedChapter(run,'audio') (src/audio/pass/passSwitch.ts:72); no PIECE_HOLDS row holds 'audio', so the pass runs in every treated chapter. passMix.ts states its numbers came from Chapter I and IV recordings. The capture evidence holds no loudness, true-peak or voice-over-music reading for the other chapters. The safety shaper bounds the peak by design, but the live result is not shown. ROUND 34 (build 2342fe666): Still unmeasured: no loudness, true-peak or voice-over-music reading from the running game for the treated chapters, including Chapter XVII added in release 74. Round 35: still measured only in Chapters I and IV; the eight new hidden cha ...
   - Expected: Short-term loudness median about -16 to -14 LUFS, true peak at or under -1 dBTP and every voice line at least +6 dB over the music in the treated chapters too (passMix.ts targets).
   - Repro: Play Chapters II, III and VI with the master tapped (window.__pyrefly.audioPass() reports makeup and trim) and run the existing measure tools against a Chapter I fight.
   - Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-omnis-win-r32/audio-debug.jsonl
   - Requirement: CHK-001 (anything an agent cannot perceive gets a technical gate), CHK-023
   - Smallest fix: Record one fight each in Chapters II, III and VI and one more FFX-2 chapter, run tools/audio measure, and either confirm the targets or give the chapter its own makeup row. Measurement first; no change until read.
   - Acceptance: A measurement file per chapter in the review folder inside the targets.
72. **PR-0589** [minor, feel, FFX-2 only] First-time fan: Yuna's dress change is a one-frame swap of a small hooded figure for a taller Warrior under a flash and a label, with Ixion see-through and doubled in the same frames
   - Chapter and state: Chapters V, XV, XIII dressphere change (Yuna white mage to Warrior) / dressphere change during an enemy action, ATB, seed 1. Last seen: round 34. Tags: introduced unknown, regression unknown. Confidence: low to medium (strips read by a fan reviewer, not strip-by-strip by the chief).
   - Observed: Fan sheets of ffx2-vegnagun-shuyin, ffx2-ixion-djose and ffx2-den-of-woe spherechange: the white mage is replaced in one frame by the Warrior, who reads taller and a step forward; the 'Yuna Warrior GATE Blue' label sits on the guide text for a few frames; in the Ixion strip Ixion is a see-through double then jumps in front of the party. The harness counts four costume swaps (worst head 50.2 percent, feet 23.1 px) separately from same-art swaps. A dress change is a designed transformation, so the size change is partly intended; whether the pop is the look Bailey wants is his call. ROUND 34 (build 2342fe666): Fan lens, again: Yuna goes from a small white-mage figure to a bigger warrior figure  ...
   - Expected: A transformation reads as one continuous move; no label over readable text.
   - Repro: FFX-2 Chapter V or XV, Change to Warrior on Yuna; read seq-spherechange.
   - Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-ixion-djose-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-den-of-woe-win-r32__seq-spherechange.jpg
   - Requirement: CHK-026 (costume swaps), CHK-027 item 6; first-time-fan lens (D-423)
   - Smallest fix: Ask Bailey whether the dress change should be a blended or held transformation; no change until he answers.
   - Acceptance: Bailey's verdict on the Yuna dress-change strip.
73. **PR-0590** [minor, delivery, both] Chapter I retry reaches the first menu in 9.7 s, double round 31's 4.9 s (one noisy lane; Chapter IV 9.9 s against 10.2 s)
   - Chapter and state: Chapter I and IV retry / seymour-flux-lose-retry, real keys, 1600x900. Last seen: . Tags: introduced -, regression -. Confidence: low.
   - Observed: TRY AGAIN to first menu 9,747 ms (pro-defeat, party-prep, battle), defeat panel 974 ms after the last KO. The capture shared the machine with other lanes, so this is low confidence.
   - Expected: Retry no slower than the previous live build.
   - Repro: Lose Chapter I on seed 1, press Enter on TRY AGAIN, time to the first command menu on a quiet machine.
   - Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json
   - Requirement: respectful skip and replay pacing
   - Smallest fix: Re-measure on a single quiet lane; if it holds, look at release 69's load order for the party-prep step on a retry.
   - Acceptance: Single-lane real-key retry of Chapter I in 6 s or less to the first menu.
74. **PR-0571** [minor, interface, FFX-2 only] Phone FFX-2 enemy-move line abbreviates the party to 'Yun / Rik / Pai' (new in r68; trades round 30's split figure for abbreviated names)
   - Chapter and state: Chapter IV, 390x844 touch / first menu and CHANGE list. Last seen: . Tags: introduced true, regression true. Confidence: high.
   - Observed: Round 30 (r66) printed 'YUNA 168-190 / RIKKU 92-104 / PAINE 115-' with the last range broken over two lines; r68 prints 'Yun 168-190 / Rik 92-104 / Pai 115-130' on two rows and 'ACTS NEXT' became 'NEXT'. The figures are whole now; the names are abbreviated although the row has room (about 100 px free). The FFX line keeps full names. Chief read scratch/phone-intent-cmp.png.
   - Expected: Names whole where they fit (CHK-009), figures not split.
   - Repro: 390x844 touch, Chapter IV, first menu.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-31/scratch/phone-intent-cmp.png
   - Requirement: CHK-009, CHK-020
   - Smallest fix: Keep full names and wrap by pair, or abbreviate only when a name does not fit its slot.
   - Acceptance: Yuna, Rikku and Paine whole at 390x844 with no figure split.
75. **PR-0572** [minor, delivery, both] Release 68's load-diet claim is not shown by the first-command job (bytes and wait equal release 67's within noise)
   - Chapter and state: seymour-flux, ffx2-bahamut / desk50 and phone10. Last seen: . Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: Wire bytes to the first menu 110.31 / 112.03 MB against 110.34 / 111.89 (desk50) and 93.56 / 94.04 against 93.65 / 92.19 (phone10); load wait 5.92 / 4.44 s against 6.03 / 4.53 and 19.8 / 42.4 against 20.1 / 39.2. The release note says the first menu no longer waits for every pose; the handoff says it changes what the menu waits for, not what is fetched.
   - Expected: The measured wait or bytes fall, or the note does not claim it.
   - Repro: critic/reviews/2a9340249-focused/budgets first-command-*-cand68.json against *-r67.json; also with ?loaddiet=off.
   - Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json
   - Requirement: RUBRIC section 5 (match proof to the claim)
   - Smallest fix: Run the pair default vs ?loaddiet=off on phone10 and say which is which, or reword the player note.
   - Acceptance: Paired run shows the stated difference or the note is changed.
76. **PR-0573** [minor, delivery, both] Page memory climbs 60 to 110 MB with every chapter change, no plateau in five visits (434 to 700 MB at the board; tree peak 3,225 MB); the focused review rated it major
   - Chapter and state: seymour-flux and ffx2-bahamut / five visits with the board between, desk50. Last seen: . Tags: introduced false, regression false. Confidence: medium.
   - Observed: chapter-memory job: 434, 440, 511, 624, 700 MB at the board; JS heap flat (24.7 to 31.4 MB); growth 74 percent against a proposed 10 percent budget (r67: 321 to 642, 85 percent). DOM at the board is flat from the third visit (r67 rose), but the gap pass still reads CDP nodes +485 a visit (223 detached, no HUD classes). No failure observed; the budget is proposed, not owner-approved, so the chief rates it minor.
   - Expected: Memory settles (cache caps 96 paintings / 900 MB; texture governor 2,600 MB).
   - Repro: critic/reviews/2a9340249-focused/budgets chapter-memory job; run to eight or more visits.
   - Evidence: critic/reviews/2a9340249-focused/budgets/chapter-memory-desk50-cand68.json
   - Requirement: RUBRIC section 2 and 6 (stability)
   - Smallest fix: Extend the job to eight changes and trace which cache holds the growth (the JS heap is not it).
   - Acceptance: Growth between visit 4 and 8 within 10 percent, tree peak at most 3,500 MB.
77. **PR-0580** [minor, delivery, both] Frame-time outliers: Chapter I worsens for the third build running (p99 32.5 to 35.9 to 41.2 ms) with a 4.7 s frame at the first Yuna cast; Yunalesca one 5,610 ms frame in round 33b (extends PR-0566, PR-0544)
   - Chapter and state: yunalesca, mirror-aeons, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-trema / continuity probe, 1600x900, GPU. Last seen: round 34. Tags: introduced false, regression false. Confidence: medium for the numbers, low for cause.
   - Observed: frameTime.maxMs 5,609.7 (Yunalesca, longFramePct 2.6, fps 56.2), 1,026.2 (Mirror Aeons), 704.5 (Braska), 481.5 (Vegnagun; r66 446); Trema p99 74.7 ms, 2.3 percent over 34 ms, 56.7 fps (r66 71.2 ms, same). Other chapters 59.5 to 60 fps with p99 19 to 39 ms. The combat auditor's unit suite ran on the same host during the harness, so a host stall is possible for the 5.6 s frame: not shown either way (harness frameP99MsIsPacing false). ROUND 33: Fresh harness frame times: Yunalesca 55.6 fps, p99 64.3 ms and one 12,140 ms frame (32b: 5,610 ms, 56.9 fps, p99 41.7 ms); Flux 58.2 fps and a 1,419.5 ms frame; Braska 59.0 fps, p99 36.0 ms, max 677.6 ms (focused run on the same bundle: 722.9 ms); Bahamu ...
   - Expected: BUDGETS B4a to B4c: at least 59.5 fps, p99 at most 25 ms, at most 0.5 percent over 34 ms in every chapter.
   - Repro: Continuity harness, Yunalesca and Trema, seed 1, host idle.
   - Evidence: critic/rounds/round-31/continuity/yunalesca-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/continuity-summary.json
   - Requirement: RUBRIC section 2 (60 fps, report spikes)
   - Smallest fix: Re-run Yunalesca on an idle host to settle the 5.6 s frame; per-frame trace of Trema against battle clock and phase (PR-0544).
   - Acceptance: Yunalesca max frame under 500 ms on an idle host; Trema p99 at most 25 ms.
78. **PR-0565** [minor, delivery, FFX-2] A renderer crash again: the chief's Chapter VI gap run (Leblanc) ended in "Page crashed" after about seven minutes of polling an empty menu (extends PR-0565)
   - Chapter and state: ffx2-leblanc / headless Chromium gpu, live, enemy turns with the command menu closed. Last seen: round 35. Tags: introduced unknown, regression unknown. Confidence: low.
   - Observed: r31: the chief's Chapter VI gap run ended in 'Page crashed' once. Round 32 added 3 full Leblanc fights at 2560x1440 (seeds 1, 2 and 3, GPU mode, crash, pageerror and console-error listeners on): all reached results in 305 to 319 s with 0 crashes and 0 console errors. Together with the 0 of 21 earlier runs the crash is unreproduced in 0 of 24. That is not proof of absence; the first-menu command row at 2560x1440 was captured but not judged separately. Round 35 adds the focused review's R76-3: the headless page crashed about 25 minutes into Braska three times (candidate twice, live release 75 once). The capture owner's real-key Braska run on live won in 284 turns and 29 minutes with no crash a ...
   - Expected: No renderer crash in a long session.
   - Repro: critic/rounds/round-31/gaps-chief/th-probe.mjs ffx2-leblanc with the Defend branch removed (the menu never reopens).
   - Evidence: critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-probe.json; critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-s1
   - Requirement: RUBRIC section 2 (stability)
   - Smallest fix: Capture the renderer's crash dump on the next occurrence; the long-session memory growth (PR-0573) is a suspect.
   - Acceptance: No crash across ten 10-minute idle runs.
79. **PR-0530** [minor, feel, both] Question for Bailey: hard cuts rose from 75 to 3,864 (22 a minute) because ?swapscope=wide turned the planned smear cuts on in 13 more chapters; the fan reads them as camera jerks and pops (Chapter I battle start, the Chapter IV sphere change, Braska seams)
   - Chapter and state: all; fan captures in seymour-flux, ffx2-bahamut, braskas-final-aeon / continuity run and the fan's strips. Last seen: round 33b. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Unchanged: 3,990 planned hard cuts in 10,638.5 s (22.5 a minute), 4,772 smears planned, 4,606 swaps smeared. Awaiting Bailey's verdict on the look. ROUND 33B: the full run reads 3,939 hard cuts in 11,220.8 s (21.1 a minute), 4,674 smears planned and 4,556 swaps smeared.
   - Expected: Bailey's judgment of the planned smear cuts and the pro camera shots (PR-0530, PR-0521).
   - Repro: Chapter I and IV by real keys; see the fan's captures seq-transition-into-battle and seq-spherechange.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/continuity/continuity-summary.json
   - Requirement: RUBRIC 6a (the definition of a jerk is Bailey's, D-420 to D-426)
   - Smallest fix: Show Bailey the strips and ask; build nothing until he answers.
   - Acceptance: A recorded verbatim judgment.
80. **PR-0529** [minor, visual, FFX-2 only] FFX-2 Chapter XII (Trema): Paragon's feet move 10.5 px at the cast-to-idle swap with nine see-through frames and height x1.13 (carried)
   - Chapter and state: ffx2-trema / Paragon cast to idle. Last seen: round 34b. Tags: introduced false, regression false. Confidence: high.
   - Observed: strip swap-147: two overlapped Paragons for nine frames, feet 10.5 px apart (22.2 px from the pixels); the only feet-over fail of the 19 chapters at that size. ROUND 33B: the full harness reads 16 Paragon feet moves over the 2 px line, worst 10.3 px (cast to hurt 5, hurt to cast 5, idle to cast 3, cast to idle 3); it is the only feet-over-tolerance figure outside Chapter III and the Chapter I victory-cheer swaps, and Trema's CHK-026 FAIL rests on it alone. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Trema CHK-026 FAIL on 16 Paragon feet moves (idle to cast 3, cast to hurt 5, hurt to cast 5, cast to idle 3), worst 10.4 px (33b: 16, 10.3); CHK-027 PASS (worst swap je ...
   - Expected: Feet within 2 px, a cut or a short blend.
   - Repro: Continuity harness ffx2-trema, seed 1.
   - Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/strips/swap-147-paragon-cast-idle.jpg; critic/rounds/round-33/continuity/ffx2-trema-win-r33/continuity/strips/swap-131-paragon-cast-hurt.jpg; critic/rounds/round-34/continuity/ffx2-trema-win-r34/continuity/continuity.json
   - Requirement: CHK-026, CHK-027
   - Smallest fix: Register Paragon cast and idle feet; shorten the blend on this boss.
   - Acceptance: Paragon swaps have 3 or fewer ghost frames, feet within 2 px.
81. **PR-0540** [minor, interface, both] Chapter I intent card shows the IF YOU ATTACK header with no body (carried, stalled; third review at the same severity)
   - Chapter and state: Chapter I / E card at 1600 and 2000. Last seen: round 35. Tags: introduced false, regression false. Confidence: high.
   - Observed: The conditional body (Delay Attack or Buster punished with party-wide Slowga; Protect under 75 percent; Reflect and phase 2 under 50 percent) is in the DOM but the card height clips it until J is held. Chapter II shows its body. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-02; both games, no longer Chapter I only): Chapter I: the 'IF YOU ATTACK' header is shown with no body and 'J HOLD +3 MORE' under it (1600 and 2000). Den of Woe: the IF YOU ATTACK text is cut mid-sentence ('Counts every result the party applies to him (each landing strike, a miss or a no-effect hit once): at 8'), '+1 MORE'. Leblanc: a whole-party Thunder lists Yuna and a half-faded Rikku, Paine is not shown, '+1 ...
   - Expected: The conditional half is readable by default or the header is not drawn without a body.
   - Repro: Chapter I, seed 1, first menu, press E.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-den-of-woe-win-r32/12-intent-E.png
   - Requirement: RUBRIC section 2 (enemy intent separates certain from conditional)
   - Smallest fix: Let the card grow to its content as Chapter II's does.
   - Acceptance: E shows a non-empty IF YOU ATTACK body without J; scrollHeight equals clientHeight.
82. **PR-0542** [minor, interface, both] Pause chrome labels are low contrast, about 1.9 to 3.5:1 by pixel sampling (carried, stalled)
   - Chapter and state: pause / pause at 1600 and 2000. Last seen: . Tags: introduced false, regression false. Confidence: medium.
   - Observed: header 1.88:1, BATTLE STATS 2.37, H PAINTING ONLY 2.83, inactive tab 3.49, options section titles 2.38 (thin antialiased text, rough figure).
   - Expected: At least 4.5:1 for small text.
   - Repro: Pause screenshot, sample.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/14-pause-Esc.png
   - Requirement: CHK-003
   - Smallest fix: Raise the label tokens.
   - Acceptance: Sampled contrast at least 4.5:1.
83. **PR-0483** [minor, interface, FFX (Chapter I phone)] A touch player's route to Poison Fang and Holy Water in the 27-item Chapter I list: the pager, both target steps and the Holy Water confirm work by real taps (round 32b); a Poison Fang confirm tap on an enemy plate was not made
   - Chapter and state: seymour-flux / 390x844 touch. Last seen: round 34. Tags: introduced unknown, regression unknown. Confidence: high that the harness caused the defeats; medium that the player path is whole.
   - Observed: The phone Chapter I routes were lost at seeds 1 and 2 (23 of 35 and 20 of 39 picks wanted Poison Fang or Holy Water and took Attack; desktop 2 of 53, with no Attack substitutions; Bahamut at 390x844 touch 0 mismatches). The chief's gap pass opened ITEMS by real taps ('1-6 OF 27', the previous button disabled), tapped the 44x44 next button ('7-12 OF 27') and tapped HOLY WATER, which opened its target step ('HOLY WATER -> TIDUS', help text 'Tap another ally to switch'). The route harness (critic/runner/lib/route-fight.mjs lines 229 to 238) reads only the six visible rows and falls back to Attack, which is how the run lost; CommandMenuPaging.ts and its unit test pass. The first draft of this fi ...
   - Expected: A touch player can reach every row the advisor names and aim an ally.
   - Repro: 390x844 touch, Chapter I, Items, swipe to Holy Water, Yuna as target.
   - Evidence: critic/rounds/round-32/evidence/gaps/phone-items-pager/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-s2-touch/turn-log.json
   - Requirement: CHK-015, CHK-004
   - Smallest fix: Teach the route harness to tap the page button when the wanted row is not among the six visible rows (PR-0539); then tap Poison Fang and a target plate with real touch events.
   - Acceptance: A 390x844 touch run of Chapter I takes Holy Water and Poison Fang as named (want equals took on every row).
84. **PR-0558** [minor, interface, both (F1 HUD: Chapters I and IV)] At TEXT SIZE 115 and 130 the desktop F1 HUD overlaps: the boss ribbon over the guide chip and the intent panel over the turn strip; the Chapter IV help band sat under the PAUSE chip (merges R68-P1)
   - Chapter and state: Chapter I, IV / TEXT SIZE 115 and 130. Last seen: round 32b. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Focused review R68-P1 (candidate bundle, 1280x720 and 1600x900). The gap pass set TEXT SIZE 100 to 115 to 130 on the live pause and saw data-text-size set and the tab strip larger; it did not capture the battle HUD at 130 (r68 now scales the desktop HUD, so PR-0559 is probably fixed, not re-verified). ROUND 32b ADDITION (G4 (4a, 4f), sized on the live bundle): Chapter I: the E card covers the turn strip, 80 x 111 px at TEXT SIZE 100 (that is PR-0516), 137 x 128 at 115 and 221 x 145 at 130, with the folded Sensor tab also under it by 6, 10 and 14 px. Chapter IV at 130: the guide chips (G HIDE GUIDE and [ ] SCROLL) overlap the boss ribbon by 14 px and hide the HP SCAN chip; at 100 and 115 they ...
   - Expected: No overlap at any text size.
   - Repro: Pause, ACCESSIBILITY, TEXT SIZE 130, resume, open E and G.
   - Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y-keys/a11y-after-changes.png; critic/rounds/round-32/gaps-G4-walks-optional/crops/ch4-guide-vs-ribbon-100-115-130.png
   - Requirement: CHK-008, onboarding (text size)
   - Smallest fix: Reflow the ribbon and the intent panel under the larger scale.
   - Acceptance: Rect intersections 0 at 130 in Chapters I and IV.
85. **PR-0549** [minor, visual, both] Party figures stack on each other in staging: Auron is almost wholly behind Tidus in Chapter III; the party reads as toys against Vegnagun and Bahamut (carried)
   - Chapter and state: braskas-final-aeon, ffx2-vegnagun-shuyin / mid-fight. Last seen: round 34. Tags: introduced false, regression false. Confidence: high.
   - Observed: Only Auron's coat edge shows behind Tidus in 23-midfight (two figures read). The fan also lists Ixion's body sitting through Yu Yevon. ROUND 34 (build 2342fe666): Re-observed; fan lens adds Tidus/Auron and Kimahri/Yuna stacked in Flux, Yunalesca and Braska action montages.
   - Expected: Three readable figures.
   - Repro: Chapter III by real keys, seed 1, 23-midfight.
   - Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/23-midfight.png
   - Requirement: CHK-008
   - Smallest fix: Offset Auron's slot in this chapter's layout.
   - Acceptance: All three heroes visible at the first menu.
86. **PR-0481** [minor, feel, both] Time to the first command: about 42 s in Chapter I and 21 to 23 s in Chapter IV from picking the chapter (pre-scene read included); the retry is now 4.9 s (Chapter I) and 10.2 s (Chapter IV)
   - Chapter and state: Chapters I and IV / real keys, desktop line. Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: Round 30b: 43.2 s and 26.6 s; retry 16.5 s and 9.9 s. The chained chapters retry in 9.6 to 13.6 s (this round's gap runs).
   - Expected: A short wait to the first command.
   - Repro: Chapter select to awaitingMenu with a timer.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/run.json; critic/rounds/round-31/gaps-chief/lose-braskas-final-aeon.log
   - Requirement: RUBRIC section 2 (pace)
   - Smallest fix: See PR-0567.
   - Acceptance: As PR-0567.
87. **PR-0532** [minor, audio, FFX only] Chapter I's win fanfare is cut at the results swap and restarted from its first note (carried; contradicts D-1295 'one fanfare')
   - Chapter and state: seymour-flux / results swap. Last seen: round 35. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Carried and reached further: the early victory cue (FFX only) is in the fading list at gain 0.64 and 0.002 with no current track 4.0 s (Anima) and 17.4 s (Natus) before the results panel, and the results snapshot then shows victory-ffx current at gain 1: the same cut-and-restart round 31 read in Chapter I, now in two more chapters. Two snapshots, not a dense timeline; a fade could also be the cue ending. ROUND 34 (build 2342fe666): Seen again in four runs (Flux 2000x1012, Anima, Natus, Yojimbo): after-fight snapshot lists victory-ffx as fading with no current track, then the results snapshot shows victory-ffx current at full gain. Two snapshots per run, not a dense timeline. Round 35: re-obs ...
   - Expected: D-1295: one fanfare.
   - Repro: Chapter I win, dense audioDebug timeline from the last blow.
   - Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-natus-win-r32/audio-debug.jsonl
   - Requirement: AUDIO phase transitions; D-1295
   - Smallest fix: Skip the exit's stopMusic for a win when the results cue is already current.
   - Acceptance: A 100 ms timeline shows victory-ffx continuous.
88. **PR-0504** [minor, audio, FFX-2 only] Chapter IV win results are silent on the default desktop build, by a release 62 pick nobody has heard (carried question for Bailey; re-observed at 1600 and 2000)
   - Chapter and state: ffx2-bahamut / results. Last seen: round 35. Tags: introduced false, regression false. Confidence: high.
   - Observed: Carried and re-observed in round 32: Chapter IV desktop wins (1600x900, 2000x1012) end with music.current null at results; the 390x844 touch win plays 'pause' at results because the pass is off on phone class. D-1352 keeps silence until Bailey has listened. ROUND 34 (build 2342fe666): Chapter IV desktop wins end silent (passSilentWin); the hidden 3D Bahamut (same fight) plays the quiet "pause" cue at its results because QUIET_RESULTS lists exp-yrp-3d and PASS_SILENT_WIN lists only ffx2-bahamut. Follows the code's intent; still the same unheard two-way pick for Bailey. Round 35: re-observed (Chapter IV desktop wins end with music.current null; the 390x844 touch win plays the pause cue).
   - Expected: Bailey's decision.
   - Repro: Chapter IV win.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/audio-debug.jsonl
   - Requirement: AUDIO
   - Smallest fix: Ask Bailey.
   - Acceptance: A recorded verdict.
89. **PR-0523** [minor, interface, both] Esc from the command menu closes an open guide panel first, so the pause seems ignored (carried; re-observed in Den of Woe, Trema and Via Purifico; a gap-pass Esc after ACCESSIBILITY row changes took more than 1.2 s to close, not reproduced as a defect)
   - Chapter and state: ffx2-den-of-woe, ffx2-trema, isaaru-via-purifico / guide panel open. Last seen: round 32b. Tags: introduced false, regression false. Confidence: medium.
   - Observed: pOpens and resumedByEsc are true; three pause captures read screen battle. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-13; FFX only, Chapter I phone): Both FFX phone runs: Esc at the command menu returned the plain menu and the pause frames are UNVERIFIED; the FFX-2 phone run (no coach at that moment) paused normally. The pause chip works (r31).
   - Expected: The first Esc pauses or the panel says it closed first.
   - Repro: Open the guide, press Esc.
   - Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/14-pause-Esc.png; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/14-pause-Esc.png
   - Requirement: CHK-015
   - Smallest fix: As carried.
   - Acceptance: As carried.
90. **PR-0550** [minor, interface, FFX only] Gamepad: the A that confirms the target also stops Wakka's first reel as the overlay opens (carried; the pad evidence is reused from round 30b under a written argument)
   - Chapter and state: Wakka Overdrive / virtual pad. Last seen: . Tags: introduced false, regression false. Confidence: medium.
   - Observed: Not re-driven this round (reused from round 30b).
   - Expected: The first reel runs until pressed.
   - Repro: As in round 30b.
   - Evidence: critic/rounds/round-30/gaps2/g2
   - Requirement: CHK-023
   - Smallest fix: As carried.
   - Acceptance: As carried.
91. **PR-0503** [minor, process, both] Prep agency (STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; DRESSSPHERES, ACCESSORIES) and the r68 prep tab roles were never walked by key or touch (carried, the fourteenth review; the pause ACCESSIBILITY tab was walked by round 31's gap pass, not by round 32's (PR-0597))
   - Chapter and state: all / prep. Last seen: round 32b. Tags: introduced false, regression false. Confidence: high.
   - Observed: 291 entries, 11 of them prep first tab; none opens another tab or changes a value. ROUND 31's gap pass walked pause E (Tidus, Yuna, Kimahri, Chapter, Guide, Options, Accessibility, Controls, Music), TEXT SIZE 100 to 115 to 130 (data-text-size), REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS toggles. Not done: COLOUR VISION on a frame, key remap, prep tabs, hold-Home reset. RUBRIC section 8 requires the method check before another attempt; none is written. ROUND 32b ADDITION (G4 (4c) walked the prep tabs, and 4a/4b the pause tabs, in round 32b): Every prep tab of both games was opened by key and by tap on the live bundle (see PR-0295 for the list); the FFX Sphere Grid and Overdrive controls were  ...
   - Expected: Per game and input: each prep tab opened, one change made, visible in the first menu.
   - Repro: Add one scripted real-input walk to the capture owner.
   - Evidence: critic/rounds/round-31/evidence/index.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json
   - Requirement: RUBRIC section 6 and 8
   - Smallest fix: Write the method check; assign the walk to the capture owner's script.
   - Acceptance: A run.json with the walks and the changed value in the first menu, both games, both sizes.
92. **PR-0544** [minor, delivery, FFX-2] FFX-2 Trema 56.7 fps, p99 74.7 ms, 2.3 percent over 34 ms (carried since round 30; see PR-0580 for the other outliers)
   - Chapter and state: ffx2-trema / continuity probe. Last seen: round 33b. Tags: introduced false, regression false. Confidence: high for numbers.
   - Observed: Live run: 56.7 fps, 1,588 of 67,748 frames over 34 ms, max 158 ms. ROUND 33B: Trema is now read by the full harness: 56.1 fps, p99 89.1 ms, 1,795 of 70,968 frames over 34 ms (2.5 percent), max 169.4 ms; the same shape as the round 30 reading (56.7 fps, p99 74.7 ms) with a longer tail. The other FFX-2 chapters read 59.1 to 59.8 fps.
   - Expected: B4a to B4c.
   - Repro: Trema continuity.
   - Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-33/continuity/ffx2-trema-win-r33/continuity/continuity.json
   - Requirement: RUBRIC section 2
   - Smallest fix: Per-frame trace first.
   - Acceptance: p99 at most 25 ms.
93. **PR-0547** [minor, interface, FFX-2 only] FFX-2 results ledger names the dressphere Rikku started in, not the one she finished in (carried, re-observed)
   - Chapter and state: ffx2-bahamut / results. Last seen: . Tags: introduced false, regression false. Confidence: medium.
   - Observed: As round 30b.
   - Expected: The finishing dress.
   - Repro: Chapter IV win, change Rikku, results.
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/31-results.png
   - Requirement: RUBRIC prep (understandable results)
   - Smallest fix: As carried.
   - Acceptance: As carried.
94. **PR-0515** [minor, interface, FFX-2 only] Doublecast advice says NO MP while the spell picker shows the MP cost (carried, not re-examined)
   - Chapter and state: doublecast / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
95. **PR-0485** [minor, narrative, both] Portrait expression never follows the line; 46 emotion tags are read by nothing (carried; no story file changed)
   - Chapter and state: all / carried. Last seen: round 32. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried: dboxTimeline shows one portrait file per speaker for the whole scene (Leblanc: rikku-x2.webp, paine.webp); no expression change on grief lines. Awaits Bailey.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
96. **PR-0537** [minor, visual, FFX only] The live Chapter I boss card has no approved target (carried, not re-examined)
   - Chapter and state: Chapter I / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
97. **PR-0555** [minor, prep, FFX only] The prep STATS tab keeps the pre-spend value after a Sphere Grid activation (carried; not walked)
   - Chapter and state: prep / carried. Last seen: round 32b. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c)): Confirmed by tap with numbers: after WALK AND ACTIVATE the grid says Strength +2 activated and STR is now 33, Power 12 to 11 and the roster S.LV 30 to 28, while the STATS tab still shows S.LV 30 and STRENGTH 31.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-stats-1-after-spend.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-grid-1-after.jpg
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
98. **PR-0556** [minor, onboarding, FFX only] The Sphere Grid card says Enter acts, but Enter after the card starts the battle (carried; not walked)
   - Chapter and state: prep / carried. Last seen: round 32b. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c, 4h), reworded): The stated sequence (Enter after the card starts the battle) was not reproduced. Seen instead: while WALKING the shell hint under the grid says ENTER BEGINS THE BATTLE - ESC BACK while the canvas footer says ENTER ACTS - ESC RELEASES, and the first Esc while WALKING left WALKING lit (the second released it); in one run Esc left the prep for the chapter board.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4h-grid-keys/run.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
99. **PR-0557** [minor, prep, FFX only] OVERDRIVE modes on the prep tab have no keyboard route (carried; not walked)
   - Chapter and state: prep / carried. Last seen: round 32b. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c)): Confirmed by key on the live bundle: the desktop OVERDRIVE mode rows (STOIC, WARRIOR) have no tabindex, no role and no key route; the phone rows have tabindex 0 and role button and a tap moves EQUIPPED from WARRIOR to STOIC.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-key-od-0.jpg
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
100. **PR-0560** [minor, interface, FFX only] Chapter I ally target with the Items list open: rows cover the TARGET plate and hand (carried; not re-observed)
   - Chapter and state: Chapter I / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
101. **PR-0561** [minor, prep, FFX-2 only] The FFX-2 prep STATS tab does not say it leaves accessories and the Garment Grid out (carried; not walked)
   - Chapter and state: prep / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
102. **PR-0562** [minor, onboarding, both] On the phone the first-run guide step 3 pointer covers part of the TIP text (carried; not re-observed)
   - Chapter and state: phone / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
103. **PR-0563** [minor, delivery, both] WebKit 26.6: party-plate portraits draw as noise at the first menu (carried; Chromium only this round)
   - Chapter and state: Chapter I / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
104. **PR-0564** [minor, delivery, both] WebKit 26.6 holds 12 to 26 fps at the first menu (carried; Chromium only this round)
   - Chapter and state: all / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
105. **PR-0566** [minor, feel, both] First sight still stalls: the first 0.1 to 4.1 s of every battle carry 5 to 9 frames over 100 ms (carried; the live run records the worst frames, not when they fall)
   - Chapter and state: all / carried. Last seen: round 34. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 34 (build 2342fe666): Mirror Aeons chain seam 1 to 2 shows a 1.4 to 1.5 s gap between two timed frames in both runs (samples at 767 then 2,156 ms; 412 then 1,940 ms) while every other seam is a steady 300 to 370 ms: stall or a held card, unproven (evidence/mirror-aeons-win-r34b/seq-seam-2).
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
106. **PR-0568** [minor, feel, both] hz-matrix: chained beats differ 25 to 30 ms between 60 and 120 or 144 Hz (carried; not re-run)
   - Chapter and state: Chapter IV / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
107. **PR-0596** [minor, onboarding, both] Key remapping is not built: CONTROLS is a read-only list
   - Chapter and state: Pause CONTROLS tab / pause CONTROLS tab, e3f51bf18 (frame of round 31, source read at e3f51bf18). Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: The CONTROLS tab lists G/X, N/RT, E/RS, J/LT, Q/Y, F/LB, Esc/Menu, H/Y, Enter/Z/A and so on and offers no way to change any binding.
   - Expected: The rubric's onboarding category names remapping among the accommodations.
   - Repro: Esc, then tab to CONTROLS (round-31 frame pause-E7.png).
   - Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/pause-E7.png
   - Requirement: RUBRIC section 6 onboarding (text and input access)
   - Smallest fix: Question for Bailey, not a proposal to build: the mock shows it, the code says it is not built, and no issue tracked it. Decide build or drop the line from the rubric reading.
   - Acceptance: A decision recorded in decisions.json; if built, rebinding one key persists across reload and shows in the hint strip.
108. **PR-0597** [minor, process, both] The capture owner's route still never opens ACCESSIBILITY, CONTROLS or MUSIC, so onboarding has had no number for six reviews
   - Chapter and state: Pause / round-32 capture-owner route: run.json pause.tabs and the 14-pause frames of every run. Last seen: round 35b. Tags: introduced false, regression false. Confidence: high.
   - Observed: ROUND 35B (misc lane): the settings were walked by real input in four runs (Chapter I FFX and Chapter IV FFX-2, each at 1600x900 by keys and at 390x844 by touch taps on the pause chip, the tab and the rows; 56 to 58 checks each, 0 failed in desk-ffx-ch1-v2, desk-ffx2-ch4-v2 and phone-ffx-ch1-v2; phone-ffx2-ch4 has 2 harness-spec misses, the lane's own tab-strip test, wrong for a strip that scrolls). TEXT SIZE 100 to 115 to 130, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS and COLOUR VISION (OFF, RED-GREEN, BLUE-YELLOW) one at a time: each row says it, <html> carries it, and a first-menu screenshot sits behind each pause. Measured effect: TEXT SIZE scales the live HUD type by 1.15 and 1.30 (FFX ...
   - Expected: A deep review shows text size, motion, flash and colour-vision settings on frames, on desktop and phone.
   - Repro: Read run.json pause.tabs and index.json state of the 14-pause frames in any r32 run.
   - Evidence: critic/rounds/round-32/auditors/audit_interface-onboarding.md; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json
   - Requirement: RUBRIC section 5 (match proof to the claim); CHK-003 scope
   - Smallest fix: Fold critic/rounds/round-35/gaps-b/misc/a11y.mjs into the capture owner's route (open the pause, step to ACCESSIBILITY, set the five settings one at a time, screenshot each with the first menu behind it, desktop and phone, in one F1 chapter of each game); add a flash event for REDUCE FLASHES and a target step for COLOUR VISION on the phone FFX-2 and FFX desktop.
   - Acceptance: The next index.json has one verified frame per setting per game and per size.
109. **PR-0599** [minor, delivery, FFX-2 only] Retry from link 5 of Chapter V takes 38.6 s from the key to the first menu; every other retry took 9.5 to 16.5 s
   - Chapter and state: Chapter V Vegnagun and Shuyin, link 5 / live bundle, 1600x900, real Enter on RETRY after a loss at link 5 (Shuyin); the earlier links by the labelled hook. Last seen: . Tags: introduced unknown, regression unknown. Confidence: low to medium (one run, cause not traced).
   - Observed: The results card names Defeat (turns 7, attempts 1); Enter on RETRY reached the battle (screens results, battle: no cutscene screen) and the first menu 38.55 s later, with Shuyin, boss-shuyin at gain 1 and resumeAt 5. The 9 other retries read in the same pass took 9.5 to 16.5 s (Fallen Aeons 16.5 s and 10.4 s, Trema 13.8 s, Sin core 11.1 s, Mirror Aeons 10.6 s, Isaaru 11.6 s, Den of Woe 10.6 s, Leblanc 9.5 s and 9.7 s, Braska 11.3 s). G4 (4e) saw the same link-5 entrance hold the music in silence from 26.4 to 40.8 s on the first visit, which is the likely share. Not traced: whether the retried link replays that entrance inside the battle and whether Enter skips it.
   - Expected: A retry of a link the player has seen returns to the first menu in about 10 s (PR-0587 acceptance); an entrance already seen is skippable.
   - Repro: Chapter V, hook to link 5, lose, Enter on RETRY, time to the first menu (3g-shuyin).
   - Evidence: critic/rounds/round-32/gaps-G3-chains-overlays/3g-shuyin/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4e-audio/run.json
   - Requirement: respectful skip and replay pacing
   - Smallest fix: Read the retried link 5 start in the presenter; if the entrance replays, let a held Enter skip it as the first visit does.
   - Acceptance: Retry of Chapter V link 5 reaches the first menu in 15 s or less, or the entrance is skippable by the same key as on the first visit.
110. **PR-0600** [minor, onboarding, both] Phone pause touch targets: every ACCESSIBILITY row is 350 x 20 px and RESUME is 156 x 22 px, below 44 px and below the 24 px WCAG 2.2 AA minimum
   - Chapter and state: Phone pause (Chapters I and IV) / 390x844, DPR 2, touch, pause opened by the PAUSE chip, Chapter I (FFX) and Chapter IV (FFX-2). Last seen: round 33. Tags: introduced false, regression false. Confidence: high.
   - Observed: G4 (4b): the tab buttons are 47 px tall, but the five ACCESSIBILITY rows (TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION) are 350 x 20 px and the RESUME control is 156 x 22 px; all are tappable (data-action pause:row:<id>). Related to PR-0578 (board chips). ROUND 33: Fresh gap-pass measure on the live bundle (390x844 touch, Chapters I and IV): the PAUSE chip is 46 x 46 px and opens the pause by a real tap; the RESUME control .pause__back is 142 x 22 px, below the 44 px minimum; it works by tap.
   - Expected: A touch target of at least 44 px (24 px is the WCAG 2.2 AA floor) for the controls a player with a motor or vision need reaches for.
   - Repro: Phone, Esc or the PAUSE chip, ACCESSIBILITY tab, read the row rects.
   - Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/p1-accessibility.jpg
   - Requirement: RUBRIC section 6 onboarding (text and input access)
   - Smallest fix: Give the pause rows and RESUME a 44 px minimum height on the phone class.
   - Acceptance: Every pause row and RESUME at 390x844 is at least 44 px tall.
111. **PR-0601** [minor, interface, FFX only] Phone Items list: three of the six tiles on page 1 cut their names (MEGA-POTI..., PHOENIX DO..., MEGA PHOE...) and the pager's next button covers the left edge of the GUIDE chip
   - Chapter and state: Chapter I phone Items list / 390x844, Chapter I first menu, ITEMS, page 1 of 27. Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: G4 (4b): MEGA-POTION, PHOENIX DOWN and MEGA PHOENIX are ellipsized in their tiles; the next-page button (44 x 44) sits on the left edge of the GUIDE chip (same family as PR-0518 CHANGE tiles).
   - Expected: Every name that can be shown is shown in full (CHK-009).
   - Repro: Phone, Chapter I, ITEMS, read page 1.
   - Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b2-items-page1.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
   - Requirement: CHK-009
   - Smallest fix: Let the item tile wrap to two lines or shrink the count badge; move the pager clear of the guide chip.
   - Acceptance: Page 1 of the phone Items list prints all six names whole and the pager does not overlap a chip.
112. **PR-0602** [minor, onboarding, both] Phone prep: the first-run Auron guide box and the START BATTLE spotlight sit over the Sphere Grid first-time card and cover part of its text and its SHOW ME ON THE GRID button
   - Chapter and state: Phone party prep, first visit to SPHERE GRID / 390x844, Chapter I party prep, first visit to the SPHERE GRID tab (FFX card; the guide overlay is both games). Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: G4 (4c): the Auron box ("Tabs are for later. Tap START BATTLE.") and the spotlight cover the card's text and its SHOW ME ON THE GRID button; GOT IT (102 x 44) is reachable.
   - Expected: A first-time card and the guide box do not compete for the same space; both stay readable.
   - Repro: Phone, fresh profile, Chapter I, party prep, tap SPHERE GRID.
   - Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-tab_SPHERE_GRID-card.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json
   - Requirement: RUBRIC section 6 onboarding
   - Smallest fix: Dismiss or move the Auron box while a first-time card is up.
   - Acceptance: The card's text and both of its buttons are uncovered on a fresh profile at 390x844.
113. **R72-1** [minor, interface, FFX] Chapter XII: the TARGET flag lands on the Sensor card at alternate cursor stops (the focused review's R72-1, rated major there; the chief rates it minor after reading both frames)
   - Chapter and state: XII seymour-omnis (F1 HUD held) / ?coach=off, seed 1, G (Intel), Enter on Attack, ArrowRight. Last seen: round 34. Tags: introduced true, regression false. Confidence: medium.
   - Observed: At cursor stops 1, 3 and 5 the flag overlaps the Sensor card by 98 x 79 px at 1600x900 and 80 x 85 at 2000x1012, the card title text colliding. The live build shows the flag over the disc strip text at the same stop, a different overlap of the same class. The chief read hud-xii-cand2-1600-cursor1.png and hud-xii-live2-1600-cursor1.png: both collide, the candidate's hides part of the Sensor card's title ("Seymour Omnis") and the live one hides "FACING HIM"; neither hides a control that is needed, and the Sensor card is information, so this is polish-grade overlap (CHK-008) and not wrong information. ROUND 34 (build 2342fe666): Release 74's Sensor steer: one production stop captured, the Senso ...
   - Expected: The flag and the Sensor card never overlap while the target cursor moves.
   - Repro: ?coach=off seed 1: Chapter XII, G, Enter on Attack, ArrowRight.
   - Evidence: critic/reviews/01a767770-focused/play/hud-xii-cand2.json; critic/reviews/01a767770-focused/play/hud-xii-cand2-1600-cursor1.png; critic/reviews/01a767770-focused/play/hud-xii-live2-1600-cursor1.png
   - Requirement: CHK-003 / CHK-008 / CHK-009; where: src/ui/ffx/hudAvoidSelectors.ts, flag placement (suspected)
   - Smallest fix: Steer the flag clear of the Sensor card as well as the advisor card, or fold the Sensor card while the cursor is up.
   - Acceptance: hudcheck cursor walk reads 0 pairs at 1600 and 2000 wide.
114. **PR-0615** [minor, feel, both (revive cross; FFX read on a strip, FFX-2 read by sampler and by real keys)] The revive rise: counted as a 172.5 px jerk by CHK-027 in Chapter XVII, and read as a pop in one coarse Chapter I montage (question for Bailey)
   - Chapter and state: XVII Sin fins and core; I Mega Phoenix (fan lens) / Tidus ko to idle under the green revive ring; Kimahri after a party Mega Phoenix. Last seen: round 35. Tags: introduced true, regression false. Confidence: medium.
   - Observed: XVII: the strip swap-1134 shows Tidus lying under the green ring rising into a standing sword pose with the guide lines following; it is the designed rise of release 74, but the harness counts it as a 172.5 px jerk, which is why XVII fails CHK-027. FFX-2 half measured smooth (483 ms rise, 183 ms crossfade, max fade step 0.15 a frame; real-key Chapter X read: Paine standing within about 1.3 to 1.7 s of the key). The first-time fan's montage of the Chapter I Mega Phoenix (seq-party-action f07 to f08, 330 ms apart) shows a KO gap then a standing figure with no rise visible between frames; the sampling is coarser than the 0.5 s rise, so this is not shown to be a pop. Closes PR-0473 (revive as di ...
   - Expected: Either a recorded rule excusing a revive rise from the jerk definition or a rise with no step over the limit; the definition of a jerk is Bailey's (D-420 to D-426).
   - Repro: Chapter XVII, Phoenix Down on a KO Tidus; Chapter I Mega Phoenix; strips c17-N/swap-1134.
   - Evidence: critic/reviews/2342fe666-focused/continuity/c17-N/strips/swap-1134-tidus-ko-idle.jpg; critic/rounds/round-34/evidence/revive-ffx2/frames.json; critic/rounds/round-34/evidence/gaps/revive-real/montage.jpg
   - Requirement: CHK-027
   - Smallest fix: Bailey decides whether a revive rise is a jerk; if not, tag revive swaps in the harness; if yes, shorten the lateral slide. No change without his word. Related: PR-0570.
   - Acceptance: A written rule or harness tag for revive rises, and Chapter XVII CHK-027 PASS or an owner-accepted exception.
115. **PR-0617** [minor, visual, FFX] Sin face: the hit flash blows the left third of the frame to white and the party reads as silhouettes
   - Chapter and state: XVIII Sin face / turn 11, mouth shut, the 993 hit. Last seen: round 34. Tags: introduced true, regression unknown. Confidence: medium (one frame).
   - Observed: The bloom fills the left 40 percent of the frame with white, Tidus and Yuna read dark and the shrine backdrop is gone; the approved mouth-open tile keeps painted detail in its glare. One flash moment, not sustained.
   - Expected: Party and floor keep painted detail through the flash.
   - Repro: Chapter XVIII, seed 1, 1600x900, harness midfight step; compare targets/sin-face.jpg.
   - Evidence: critic/rounds/round-34/evidence/sin-face-win-r34/23-midfight.png; critic/rounds/round-34/targets/sin-face.jpg
   - Requirement: Approved-target gate, tile Sin: the Face; CHK-013
   - Smallest fix: Cap the bloom in the treated Sin face scene (suspected the shared Overdrive flash; not traced).
   - Acceptance: A frame sequence across the flash shows faces and floor legible at the peak.
116. **PR-0620** [minor, delivery, FFX-2] Hidden 3D Bahamut leaks about 34 textures per lose-and-retry (was R74-5; focused lane only, not repeated here)
   - Chapter and state: exp-yrp-3d (hidden) / five retries in one page. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: Texture count 100, 137, 171, 205, 239, 273 over five retries with the JS heap flat at 290 MB (focused review lane YR-11). Rated minor by the chief: hidden, desktop-only, heap flat, and not reproduced in this review. Round 35: the texture leak was not measured; the new 3D cel-shaded anime chapter (word gear) adds a second 3D chapter whose frame times and texture counts are also unmeasured.
   - Expected: Texture count flat across retries.
   - Repro: Retry five times in one page of the yrp chapter.
   - Evidence: critic/reviews/2342fe666-focused/hidden/yrp-run.log
   - Requirement: CHK-019
   - Smallest fix: Dispose textures on teardown.
   - Acceptance: Textures flat over five retries.
117. **PR-0621** [minor, narrative, both (FFX Keeper, FFX-2 Maesters)] The hidden Keeper and Maesters were never won by a player route, so their aftermath and the Maesters' later floor beats are unread
   - Chapter and state: spectral-keeper, ffx2-fallen-maesters (hidden) / hidden chapters 29 and 30, win route. Last seen: round 34b. Tags: introduced true, regression false, new feature. Confidence: high that it was not reached.
   - Observed: Keeper: defeat at turn 5 to 10 (the harness line; the handoff documents about 3 wins in 100 with a scripted line). Maesters: defeat on floor 40 in 10 and 18 turns, and 103 turns over three attempts at seed 2004; floor 20 and 40 clear and floor 60 was reached in play. The entry scenes, the defeat card and RETRY read well. Whether the generic route loses because the fights are hard or because of tuning is not established. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Still true for the aftermath, and narrower than stated: the Keeper was played by real keys to a defeat twice (seed 1, 24 decisions, 3.27 min; seed 2 with Bahamut, 7 decisions, 1.44 min) and never won; the  ...
   - Expected: A hidden chapter plays to its aftermath by legitimate input (CHK-022).
   - Repro: Type keeper or infinito, play by the generic route, seeds 1 and 2004.
   - Evidence: critic/rounds/round-34/evidence/spectral-keeper-win-r34/run.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34/run.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/run.json
   - Requirement: CHK-022
   - Smallest fix: A real-key winning route for each (an advisor-aware route using Move and aeons for the Keeper; Darkness line and Paine walk for the Maesters) read to its last line.
   - Acceptance: Both reach results, CONFIRM and the post scene by keys with the lines read.
118. **PR-0628** [minor, feel, both] Fan lens: a fighter is missing for a stretch and then appears in the last frame (Tidus on the Omnis stage for 9 frames, Rikku in the first Ixion frames)
   - Chapter and state: seymour-omnis, ffx2-ixion-djose (fan lens) / idle to action montages. Last seen: round 34. Tags: introduced unknown, regression unknown. Confidence: low to medium.
   - Observed: seymour-omnis seq-party-action f09 and ffx2-ixion-djose seq-action-playing f00 to f01. Read from 330 ms-spaced montages, not harness-measured; the cause (staging hold, camera crop, or a real pop) is not established.
   - Expected: A fighter stays on the stage or leaves with a motion.
   - Repro: Chapter XII or XVI, the first action montage, seed 1.
   - Evidence: critic/rounds/round-34/evidence/seymour-omnis-win-r34/seq-party-action; critic/rounds/round-34/evidence/ffx2-ixion-djose-win-r34/seq-action-playing
   - Requirement: First-time-fan lens (D-423)
   - Smallest fix: Read the swaps at those frames in the continuity harness (Omnis and Ixion) before any change.
   - Acceptance: The harness reads Omnis and Ixion and the montage shows the figure present.
119. **PR-0631** [minor, feel, both (FFX Keeper, FFX-2 Maesters; hidden)] The hidden Keeper and Maesters are the only chapters over the see-through line: pose swaps show a double image of severity 0.42 (CHK-027 FAIL there; the 19 listed chapters stay under 0.381)
   - Chapter and state: spectral-keeper, ffx2-fallen-maesters (hidden) / hidden chapters 29 and 30, continuity probe, 1600x900, seed 1, live. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: high for the measurement; the cause is read from source, not proven.
   - Observed: Maesters (dedicated harness, 94.8 s of battle): 45 of 119 swaps show a double image of severity 0.4 or more, worst 0.426; 1 swap jerk of 33.3 px; 0 snaps. Keeper (the probe attached to the live ring job, 176.5 s; the three dedicated harness routes ended under 60 s and read UNVERIFIED): 69 of 232 swaps over the line, worst 0.423; 0 swap jerks; 0 snaps; the short routes show the same (23, 22 and 7 swaps over). The 19 listed chapters read 0 swaps over the line, worst 0.381. Likely cause, read from the source and not traced further: SwapSwitch.WIDE_CHAPTERS names the 19 listed chapters only, so the hidden chapters are not on the wide swap scope and their swaps play as plain dissolves. Round 35:  ...
   - Expected: Under 0.4 at every swap (CHK-027 item 3).
   - Repro: Type keeper or infinito on the board; node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=ffx2-fallen-maesters --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); see the ghost strips.
   - Evidence: critic/rounds/round-34/hidden/continuity/ffx2-fallen-maesters-win-r34/continuity/strips/ghost-012-x2-aranea-idle-hurt.jpg; critic/rounds/round-34/hidden/continuity/ffx2-fallen-maesters-win-r34/continuity/strips/swap-117-yuna-follow-critical.jpg; critic/rounds/round-34/hidden/continuity/spectral-keeper-win-r34/continuity/strips/ghost-002-spectral-keeper-idle-hurt.jpg
   - Requirement: CHK-027
   - Smallest fix: Put the two hidden chapters through the same swap scope as the listed ones if the cause is the scope (SwapSwitch.WIDE_CHAPTERS is one list), or shorten their blends; do not loosen the 0.4 line.
   - Acceptance: Harness on both hidden chapters (the Keeper with a route that lasts 60 s): ghost swaps over the line 0.
120. **PR-0632** [minor, feel, FFX only] Spectral Keeper: Move changes the glyph flag, the banner and the cursor, but the figure does not walk to the glyph (no presenter hop for the platform event); Tidus stays among the party while the log says glyph 5
   - Chapter and state: spectral-keeper (hidden) / hidden chapter 29, first Move, 1600x900. Last seen: round 34b. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Five Moves by real keys each produced an action-start move event, a platform event, the banner "steps to glyph N" and plat.at.<id> equal to N, but the figure did not move across the stage (the figure rect before and after the first Move: 699,525 291x330 to 661,475 254x382, the camera's push-in, not a walk to the glyph). Known: the lane handoff discloses that this build has no presenter hop for the platform event.
   - Expected: The stepping figure is seen to stand on its new glyph.
   - Repro: Type keeper, choose Move for Tidus, pick Glyph 5; compare m-01-after-move.png with the opening frame.
   - Evidence: critic/rounds/round-34/hidden/keeper-ring-r2/m-01-after-move.png; critic/rounds/round-34/hidden/keeper-ring-r2/m-02-after-move.png; critic/rounds/round-34/hidden/keeper-ring-r2/battle-log.json
   - Requirement: CHK-023, CHK-020
   - Smallest fix: A presenter hop (or a pose and slide) for the platform event, once Bailey picks how the party should read its glyph.
   - Acceptance: After a Move the figure stands on the chosen glyph in the next frame.
121. **PR-0633** [minor, interface, FFX only] Spectral Keeper: Yuna's advisor card forecasts "Glyph 2 uses Glyph Mine before Auron can act", naming an idle Circle as the user of Glyph Mine; the user is the Spectral Keeper
   - Chapter and state: spectral-keeper (hidden) / hidden chapter 29, Yuna's menu at decision 10, 1600x900. Last seen: round 34b. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: The forecast line names Glyph 2; the log says spectral-keeper:keeper-glyph-mine (seq 120). The same card names "Next best move Life -> Auron" correctly.
   - Expected: The forecast names the Spectral Keeper as the user.
   - Repro: Type keeper, play to the first lay (count 4 or more), open the advisor on Yuna's menu.
   - Evidence: critic/rounds/round-34/hidden/keeper-ring-r2/m-10-lit-glyphs.png
   - Requirement: CHK-023
   - Smallest fix: Name the actor of the forecast move from its owner, not from the Circle it lights.
   - Acceptance: The card reads "Spectral Keeper uses Glyph Mine".
122. **PR-0634** [minor, interface, FFX-2 only] Fallen Maesters shell break: the boss strip keeps its Shell and Protect icons although DEF and MDEF read 1, and the banner is headed by the name of whoever was acting in that frame (Yuna) instead of Concherer or Paine
   - Chapter and state: ffx2-fallen-maesters (hidden) / hidden chapter 30, floor 60, 1600x900. Last seen: round 34b. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: After Paine's Charon (21,420) the message "Concherer's shell breaks!" came once and the banner CONCHERER'S SHELL BREAKS! was on screen with the damage number, and DEF and MDEF read 1, but the boss strip still showed two status icons (Shell and Protect), so the HUD has no picture of the break beyond the banner; the banner carried the name of the acting girl in that frame (Yuna, whose Darkness was on screen).
   - Expected: The icons drop or a break marker shows on the strip; the banner is headed by its subject.
   - Repro: Type infinito, reach floor 60 with Paine's four Change rows, land one 10,000-plus result.
   - Evidence: critic/rounds/round-34/hidden/maesters-walk-s1d/f3-03-shell-banner-0.jpg; critic/rounds/round-34/hidden/maesters-walk-s1d/f3-02-shell-broken.png
   - Requirement: CHK-023
   - Smallest fix: Clear the two status icons with the break (or draw a break tag) and head the banner with the boss.
   - Acceptance: The strip shows the break and the banner names Concherer.
123. **PR-0661** [minor, visual, FFX-2] Chapter 33 (anime): the three girls change shape and position in one frame at about 4.7 to 4.8 s, before the first command, with no in-between frame (CHK-027 FAIL by frame difference)
   - Chapter and state: 33 exp-anime (word gear), 3D cel-shaded stage / live, real keys from the title, the word gear on the board, 1600x900, seed 1, two 60 s captures (3,579 and 3,688 frames at 59.6 fps), 10 real decisions each; frame difference of the canvas at 192x108 luma, not the painted-plane harness. Last seen: round 35b. Tags: introduced true, regression false, new feature. Confidence: medium that the event is real and repeatable (two captures, same moment); low for the cause.
   - Observed: In both captures, at the same moment (4.7 to 4.8 s, about a second before the first decision is logged), the three girls change shape and position in a single frame while the camera and Valefor do not move: the edge map of each girl correlates 0.26 to 0.52 with the frame before (a quiet pair reads 0.96 to 0.99), the best matching shift is 67 to 92 px at 1600 wide (low confidence), and the next frame matches the one after it, so it is a persistent change with no in-between frame. It repeats exactly, so it is the game and not the sampler. A whole-picture change at about 17.2 to 17.5 s is read as a camera cut and not counted. The instrument cannot see a double image, cannot size a jerk in head  ...
   - Expected: A 3D figure changes pose by an animation blend (CHK-027), or the instant change is a designed beat.
   - Repro: Type gear on the chapter select board, start, record the canvas from the first frame; see critic/rounds/round-35/gaps-b/continuity/gear-capture.mjs and gear-event-readings.txt.
   - Evidence: critic/rounds/round-35/gaps-b/continuity/gear/gear-framediff.json; critic/rounds/round-35/gaps-b/continuity/gear2/gear-framediff.json; critic/rounds/round-35/gaps-b/continuity/gear-event-readings.txt
   - Requirement: CHK-027 item 1 (a snap); first-time-fan lens
   - Smallest fix: Look at the first turn at full resolution (the rig lane or the first-time-fan lens) to say whether the step is a designed stance change; if a pop, blend it. A 3D-aware reader for the harness is PR-0659's second half.
   - Acceptance: The two 60 s captures show no party-wide step over 40 px, or Bailey names the beat as designed.
124. **PR-0662** [minor, interface, FFX-2 (shared FFX-2 boss-head element, seen in Chapter 38; it appears wherever an FFX-2 boss carries a status)] The FFX-2 boss-head STATUS tab label (.ststab__label) reads 12 css px at 1600x900 in the Farplane Cup first menu, under the 14 px floor (4.8 px in the 640x360 stage, smaller in a smaller window)
   - Chapter and state: 38 ffx2-farplane-cup first menu / live, 1600x900, font size times every ancestor transform, scale and zoom (the CHK-003 numeric floor), text-floor-sweep hidden-floor lane. Last seen: round 35b. Tags: introduced false, regression false. Confidence: high.
   - Observed: The only element under 14 css px found in the eight new hidden chapters (seven are clean). It is shared FFX-2 code: src/ui/common/status-rows.css has not changed since release 75 (diff against f91ff81d0 is empty), so release 76 neither introduced nor fixed it.
   - Expected: Nothing a player must read falls below 14 css px (CHK-003).
   - Repro: Chapter 38 first menu at 1600x900; read the computed size of .ststab__label times the stage scale.
   - Evidence: critic/rounds/round-35/gaps-b/misc/hidden-floor/ffx2-farplane-cup/01-battle-menu.png; critic/rounds/round-35/gaps-b/misc/hidden-floor/hidden-floor.json
   - Requirement: CHK-003
   - Smallest fix: Floor .ststab__label with max(size, var(--stage-floor)) as the other sheets do (src/ui/common/status-rows.css line 33), or drop the label as the phone does.
   - Acceptance: The Farplane Cup first menu reads a minimum of 14 css px in the numeric sweep.
125. **PR-0670** [polish, visual, FFX-2 only] Ifrit at Kilika stands on a backdrop requested as djose-chamber-provisional
   - Chapter and state: 46 Ifrit at Kilika / network-media.json of the Ifrit win run. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: The run requests art/backdrops/djose-chamber-provisional.webp for the Kilika Temple fight; the floor is dark blue cracked stone with a large dark glyph, not a recognisable Kilika Temple. The file name says provisional (cause read from the request name, not from the code).
   - Expected: A Kilika plate or a stated stand-in.
   - Repro: Type ifrit; read network-media.json.
   - Evidence: critic/rounds/round-36/evidence/ffx2-ifrit-kilika/ffx2-ifrit-kilika-win-r36/network-media.json; critic/rounds/round-36/evidence/ffx2-ifrit-kilika/ffx2-ifrit-kilika-win-r36/23-midfight.png
   - Requirement: CHK-013
   - Smallest fix: Disclose it as a stand-in, or paint a Kilika plate (art is the driver's delegated pick).
   - Acceptance: Request log shows the Kilika plate; the stage reads as the temple.
126. **PR-0671** [polish, visual, FFX only] Question for Bailey: the Chapter I Tidus rig reads softer, darker and fringed in a still beside the crisp painted Yuna and Kimahri, and stands on a disc
   - Chapter and state: 1 Seymour Flux / 23-midfight, 1600x900. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium (still frame only).
   - Observed: The rig Tidus is darker and lower resolution with a red and blue edge fringe and a tile disc under his feet. Size and feet are stable at every swap (CHK-026 clean for him, head 0.2 percent over 8 swaps).
   - Expected: A figure of the same finish as its neighbours; rigs are judged in motion (Bailey, 2026-10-19).
   - Repro: Chapter I first menu and midfight, 1600x900.
   - Evidence: critic/rounds/round-36/crops/flux-party.jpg
   - Requirement: CHK-013 (in-game read), CHK-B3
   - Smallest fix: Not a build: a motion clip of Tidus attack, hurt and idle for Bailey to judge before anything changes. Do not replace approved art.
   - Acceptance: A motion clip Bailey judges.
127. **PR-0674** [polish, interface, FF7 only] FF7 first-menu HUD: the BARRIER column header is half hidden behind the command window, and on a phone six column labels read 9.6 px
   - Chapter and state: 44 Jenova LIFE / first menu, 1600x900 and 390x844. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Header row NAME, BARRIER (cut by the command window), HP, MP, LIMIT, TIME with no barrier value visible; at 390x844 the labels BARRIER, HP, MP, LIMIT, TIME, NAME measure 9.6 px while every number is larger. At 1600x900 the DOM floor reads 14 px or more (minimum 16.5 px).
   - Expected: A header that names a column shows it; labels at 14 px or more (CHK-003).
   - Repro: bluelight, first menu; sweep floor script in evidence/gaps.
   - Evidence: critic/rounds/round-36/zz-ui/jen-cmd-zoom.png; critic/rounds/round-36/evidence/gaps/floor-summary.json; critic/rounds/round-36/evidence/gaps/floor-ff7-jenova-life-390/menu.png
   - Requirement: CHK-009, CHK-003
   - Smallest fix: Move the command window or drop the header when no barrier is up; raise the phone label size or record a waiver for a decorative header.
   - Acceptance: First-menu frame shows no cut header; the phone sweep reports nothing under 14 px.
128. **PR-0679** [polish, interface, FFX-2 (Youth League) and FFX (Mirror Aeons)] Card copy polish: the Youth League Paine row has no "to hit" chance where the other two have one; a Mirror Aeons advisor note prints 67364 beside a ranged 63,154-71,311
   - Chapter and state: 42 Youth League; Mirror Aeons / E card link 1 and Mirror Aeons first menu, 1600x900. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Yuna 95-107 4% HP 81% to hit, Rikku 49-56 1% HP 82% to hit, Paine 72-82 1% HP with nothing after (low confidence, may be a hidden 100 percent). The Mirror Aeons note says Most damage on the board - 67364 to Dark Sandy next to ranges with separators.
   - Expected: Same fields per row; one number format.
   - Repro: Youth League first menu E; Mirror Aeons first menu.
   - Evidence: critic/rounds/round-36/zz-ui/y2.jpg; critic/rounds/round-36/evidence/mirror-aeons-win-r36b/mirror-aeons-win-r36b/run.json
   - Requirement: CHK-007
   - Smallest fix: Print the chance in every row; format the note's figure with the same locale call.
   - Acceptance: Three rows with three chances; the note shows 67,364.
129. **PR-0681** [polish, interface, both] The hidden-chapter tag "EXP" collides with EXP as experience on the results screen
   - Chapter and state: hidden chapters (prep header, pause) / prep and pause, 1600x900. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium.
   - Observed: FFX-2 . EXP Ifrit, EXP . IFRIT - KILIKA TEMPLE, CHAPTER EXP . KILIKA TEMPLE, while the Ifrit results screen shows EXP 1,800 x3 PARTY.
   - Expected: Different words for different things.
   - Repro: Type ifrit; prep and pause.
   - Evidence: critic/rounds/round-36/zz-ui/on2.jpg
   - Requirement: CHK-007
   - Smallest fix: Print EXPERIMENTAL or a symbol for the chapter tag.
   - Acceptance: No screen prints EXP for both meanings.
130. **PR-0682** [polish, visual, FFX only] Wendigo guide card and enemy-move column are low contrast over the bright ice stage
   - Chapter and state: 49 Wendigo / 23-midfight, 1600x900. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: The guide text and the E ENEMY MOVE column are translucent grey on pale ice and hard to read; the Wendigo label overlaps a crystal.
   - Expected: Legible HUD text on the 3D stage.
   - Repro: Real-key wendigo route, 23-midfight.png.
   - Evidence: critic/rounds/round-36/evidence/wendigo-win/wendigo-win-r36/23-midfight.png
   - Requirement: CHK-008
   - Smallest fix: Give the 3D-stage guide panel a darker backing as the painted chapters have.
   - Acceptance: Guide text reaches the contrast of the Spherimorph guide card at the same step.
131. **PR-0684** [polish, narrative, FF7 (Jenova LIFE) and FFX (Wendigo)] Jenova LIFE and Wendigo are silent by declared choice: no pre scene, post scene or mid-battle beats
   - Chapter and state: 44 Jenova LIFE, 49 Wendigo / shipped scripts read. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Nothing wrong or invented, but two of the six new chapters give the player no context or aftermath; Wendigo opens on a black screen (PR-0683).
   - Expected: Context, banter, climax and aftermath alongside the fight (RUBRIC section 2).
   - Repro: Read the shipped scripts; play both chapters.
   - Evidence: critic/rounds/round-36/evidence/wendigo-win/wendigo-win-r36/05-pre-scene.png
   - Requirement: RUBRIC section 2 narrative
   - Smallest fix: A question for Bailey: write the scenes (needs his yes) or leave them silent.
   - Acceptance: Both chapters have a pre and a post scene, or Bailey confirms silence.
132. **R78-2** [polish, visual, FFX-2 only] Ifrit at Kilika: 5 of 275 swaps of the girls' arms-up poses leave the height band (stature 0.879 to 1.079)
   - Chapter and state: 46 Ifrit at Kilika / candidate harness run of the live bytes. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Paine item to ready draws x1.152 on the swap; the same family as the live Djose chapter (so not new to this chapter). Head 0.1 percent and feet 0.7 px; CHK-026 FAIL on the band alone, CHK-027 PASS.
   - Expected: Poses stay in the height band.
   - Repro: Harness strips swap-106-paine-item-ready and swap-059-paine-od-x2-warrior-power-break-ready.
   - Evidence: critic/reviews/cc0fea14a-focused/continuity/continuity-summary-ffx2-ifrit-kilika.json; critic/reviews/cc0fea14a-focused/continuity/ffx2-ifrit-kilika-win-cc0fea14a/continuity/strips/swap-106-paine-item-ready.jpg
   - Requirement: CHK-026 (PR-0531 family)
   - Smallest fix: A pose-band waiver or the measured painting repair already owed for the live chapters.
   - Acceptance: Harness reports 0 swaps out of band for ffx2-ifrit-kilika.
133. **R78-4** [polish, interface, FFX-2 only] Ifrit: the first-time coach card (Gauges running) covers the advisor's damage numbers at 2000x1012 and sits over the scene at 390x844
   - Chapter and state: 46 Ifrit at Kilika / first menu with the coach card, 2000x1012 and 390x844. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Carried from the focused review; the coach card ("E HIDE", "ACTS NEXT" cut) covers the E card header at 1600x900 as well (PR-0502 family).
   - Expected: The card is placed clear of the advisor card.
   - Repro: Word ifrit, first menu.
   - Evidence: critic/rounds/round-36/evidence/ffx2-ifrit-kilika/ffx2-ifrit-kilika-win-r36/10-first-menu-coach.png
   - Requirement: CHK-008
   - Smallest fix: Place the card clear of the advisor card.
   - Acceptance: The first menu shows the advisor damage numbers uncovered at 2000x1012.
134. **PR-0644** [polish, interface, FFX] The four FFX F1-HUD hidden chapters (Penance, Dark Aeons, Flooded Ways, Sanctuary Keeper) carry no Enter, G or P key strip at the first menu, only "Q DEFEND"
   - Chapter and state: 34, 35, 36, 39 / first menu at link 1, DOM text of run.json. Last seen: round 36. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed: Wendigo and Omega Ruins show only Q DEFEND where Mirror Aeons and Seymour Flux show the full strip. "Enter Select" and "G Intel" are in the DOM of Seymour Flux, Yunalesca, Braska, Anima and Mirror Aeons and absent in the four hidden chapters.
   - Expected: The same screen in the same game gets the same work (CHK-020).
   - Repro: Compare run.json firstState and pause.esc.text across the nine runs.
   - Evidence: critic/rounds/round-35/evidence/penance-win-r35/run.json; critic/rounds/round-35/evidence/sanctuary-keeper-win-r35/run.json; critic/rounds/round-35/evidence/seymour-flux-win-r35/run.json
   - Requirement: CHK-020; related PR-0598, PR-0543
   - Smallest fix: Show the same key strip at every first menu, closing PR-0598 together.
   - Acceptance: Every FFX chapter's first menu text contains the confirm and guide hints; a unit test over the chapter list.
135. **PR-0653** [polish, visual, FFX] Party figures overlap into one clump in several chapters (Tidus and Yuna fused in Dark Aeons and Mirror Aeons; Yuna and Kimahri stacked in Seymour Flux; Tidus, Rikku and Auron in Anima)
   - Chapter and state: dark-aeons, mirror-aeons, seymour-flux, seymour-anima-macalania / idle and turn frames, 1600x900. Last seen: round 36. Tags: introduced false, regression false. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed: Lulu stands in front of the Spherimorph (PR-0668). In the action sheets Yuna is drawn behind Tidus so that they read as one body, and Kimahri towers over Yuna in the same spot.
   - Expected: Each figure readable (CHK-011).
   - Repro: Read the action-playing sheets.
   - Evidence: critic/rounds/round-35/fan-sheets/dark-aeons-win-r35__seq-action-playing.jpg; critic/rounds/round-35/fan-sheets/mirror-aeons-win-r35__seq-action-playing.jpg
   - Requirement: CHK-011
   - Smallest fix: Not traced; spread the party slots for these formations.
   - Acceptance: No two party figures overlap by more than a quarter of the narrower silhouette at idle.
136. **PR-0593** [polish, harness, both] 30-post-scene.png is taken before the post scene (it plays after CONFIRM): eight runs log 'screen wanted cutscene got results' and the scene still is missing
   - Chapter and state: six chapters / any win run of seymour-flux, evrae-airship, ffx2-leblanc and three more. Last seen: round 36. Tags: introduced -, regression -. Confidence: high.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Re-observed: seven runs take 30-post-scene before the post scene plays (recorded UNVERIFIED, never passed). The scene is reachable and its lines were read after CONFIRM (33-after-confirm-scene.png, Leblanc: Rikku, "That's for robbing our airship!"), but the 30 capture reads results. ROUND 34 (build 2342fe666): Six 30-post-scene frames are again taken while the scene plays after CONFIRM; afterConfirmScenes carries the lines.
   - Expected: The post-scene frame is asserted where the scene is.
   - Repro: Read run.json fails of the six runs.
   - Evidence: critic/rounds/round-32/evidence/ffx2-leblanc-win-r32/run.json
   - Requirement: CHK-016
   - Smallest fix: Assert 33-after-confirm-scene.png as the post-scene capture.
   - Acceptance: No UNVERIFIED on the post-scene frame.
137. **PR-0608** [polish, interface, FFX] Mirror Aeons offers no enemy-move card (E shows nothing, no E label): a question for Bailey, not a build
   - Chapter and state: XXVII mirror-aeons / first menu, key E, seed 1. Last seen: round 36. Tags: introduced -, regression -. Confidence: medium.
   - Observed: ROUND 36 (build cc0fea14a, bundle BAH_qvc7): Omega Ruins has the same absence (PR-0680); Mirror Aeons unchanged. run.json intentText is empty, the turn strip carries no "E ENEMY MOVE" label and the key strip lacks E. Same in round 32. Consistent (no false promise) but the only chapter without enemy intent; intent data exists for Yojimbo (yojimbo-rules.ts). ROUND 34 (build 2342fe666): Re-observed: Mirror Aeons E shows nothing (intentText empty in both runs).
   - Expected: Either an intent card for Dark Sandy, Dark Mindy and Dark Yojimbo or a written reason.
   - Repro: Chapter XXVII, seed 1, first menu, press E: evidence/mirror-aeons-win-r33b/12-intent-E.png.
   - Evidence: critic/rounds/round-33/evidence/mirror-aeons-win-r33b/12-intent-E.png
   - Requirement: honest intent (a question, not a proposal to build); where: intent data coverage
   - Smallest fix: Decide whether the Mirror Aeons get cards (needs Bailey's yes).
   - Acceptance: A decision is recorded.
138. **PR-0640** [polish, visual, FFX] Penance: the turbine hides part of Tidus in the first menu frame (was R76-5)
   - Chapter and state: 35 Penance / first menu, 1600x900. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: Tidus is partly covered by the disc.
   - Expected: All three party members clear of the disc.
   - Repro: Type judgment, first menu.
   - Evidence: critic/reviews/36b6e851d-focused/shots/judgment-1600-05-menu.png
   - Requirement: CHK-008
   - Smallest fix: Move the party or the disc.
   - Acceptance: All three members clear of the disc at 1600x900 and 2000x1012.
139. **PR-0642** [polish, interface, FFX] Penance target step does not read as one target: hand on the left arm, brackets on the body, flag "TARGET Penance"
   - Chapter and state: 35 Penance, Attack target step / single frame, 1600x900. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: low (one frame, possibly mid-animation).
   - Observed: The pointing hand sits at the left arm with a small bracket set, a large bracket set frames the body, both flags read "Penance", and the advisor chip says "Attack -> Right Arm". No walk through the three targets exists.
   - Expected: One marker and one flag naming the selected part.
   - Repro: Type judgment, Attack at the first menu.
   - Evidence: critic/rounds/round-35/evidence/penance-win-r35/16-target-single.png; critic/rounds/round-35/interface-crops/penance-target.png
   - Requirement: CHK-010, CHK-011
   - Smallest fix: If the frame is steady state, name the part in the flag and draw one bracket set.
   - Acceptance: Three frames, one per target, each with a single bracket set and a flag naming that part.
140. **PR-0649** [polish, visual, FFX-2] Chapter 33 (anime): Yuna is drawn about twice Paine's height and is cut by the left edge in action frames
   - Chapter and state: 33 anime (word gear) / action frames, 1600x900, seed 1. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: low to medium (stills only; facing needs a clip); a question for Bailey as much as a fix.
   - Observed: The foreground Yuna stands about 700 px against Paine's about 350 px, her boots and arm touch the left edge and she points front-left rather than toward Valefor.
   - Expected: The three-girl line reads as one party at the stage's depth, uncropped, aimed at the boss. The depth stagger may be intended.
   - Repro: Type gear and watch any attack turn.
   - Evidence: critic/rounds/round-35/evidence/exp-anime-win-r35/23-midfight.png; critic/rounds/round-35/scratch/anime.jpg
   - Requirement: CHK-011, CHK-014
   - Smallest fix: If it is not the intent, move the leftmost slot in and turn her toward the target (src/engine/ww3d/animeLayout.ts, not traced).
   - Acceptance: Left figure inside the frame by 12 px, height within 1.5x of the others, feet toward the boss in a clip.
141. **PR-0654** [polish, interface, both] Damage numbers, MISS and the full-screen portrait cut-in sit on top of the actors: a 4,732 on Paine, a MISS on Yuna's face for three frames, the cut-in over 40 percent of the screen for about three frames
   - Chapter and state: penance, ffx2-den-of-woe, ffx2-vegnagun-shuyin, seymour-flux and most sheets / action sheets. Last seen: round 35. Tags: introduced false, regression false. Confidence: medium.
   - Observed: A damage number lands on the attacker or target; the cut-in portrait hides the whole party for about three frames.
   - Expected: Readable but impactful effects (RUBRIC section 6, feel).
   - Repro: Read the action sheets.
   - Evidence: critic/rounds/round-35/fan-sheets/penance-win-r35__seq-action-playing.jpg; critic/rounds/round-35/fan-sheets/seymour-flux-win-r35__seq-party-action.jpg
   - Requirement: CHK-008
   - Smallest fix: A question for Bailey (the cut-in may be the approved direction); otherwise offset popups from the face.
   - Acceptance: No popup over a face in a sampled sheet.
142. **PR-0655** [polish, narrative, FFX (Flooded Ways); FFX-2 (Bevelle, Maesters, Farplane Cup)] Stock lines repeat across the new hidden scripts ("Free refills!" in three FFX-2 chapters; "The pyreflies close every wound" twice in Bevelle) and Flooded Ways carries about six light lines
   - Chapter and state: 36, 37, 38 and the release 75 Maesters / script text. Last seen: round 35. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: Rikku's "Free refills!" is verbatim in Bevelle Guardians, Fallen Maesters and Farplane Cup; Flooded Ways has "Okay okay okay" three times across a pre and post scene against the bible's one tension-release joke per FFX scene; a few lines pass 12 words.
   - Expected: research/writing-bible.md 2.1 and 2.2: one joke per FFX scene, FFX-2 banter varied.
   - Repro: Read src/story/scripts/flooded-ways.ts 59 to 84, ffx2-bevelle-guardians.ts 59 to 68, ffx2-farplane-cup.ts 53, ffx2-fallen-maesters.ts 64.
   - Evidence: src/story/scripts/flooded-ways.ts; critic/rounds/round-35/evidence/flooded-ways-win-r35/30-post-scene.png
   - Requirement: Writing bible 2.1, 2.2
   - Smallest fix: Vary the three "Free refills" lines and cut two of Flooded Ways' light lines.
   - Acceptance: No verbatim Rikku line shared by two chapters; at most one joke in each Flooded Ways scene.
143. **PR-0657** [polish, harness, FFX-2] The evidence index labels the FFX-2 anime chapter as game "ffx"
   - Chapter and state: 33 anime (exp-anime) / evidence/index.json and exp-anime-win-r35/run.json. Last seen: round 35. Tags: introduced false, regression false, new feature. Confidence: high.
   - Observed: The index records game ffx; the chapter's own log is ATB (x2-valefor) and the audio pack is v2.game ffx2.
   - Expected: Evidence carries the chapter's real game (CHK-020, CHK-021).
   - Repro: grep exp-anime critic/rounds/round-35/evidence/index.json
   - Evidence: critic/rounds/round-35/evidence/index.json
   - Requirement: CHK-016 evidence integrity
   - Smallest fix: Set the harness game for exp-anime to ffx2.
   - Acceptance: index.json shows ffx2 for every exp-anime entry.
144. **PR-0658** [polish, harness, both] A bare touchscreen tap at (195,600) on the 390x844 title did not leave the title in one gap-pass probe
   - Chapter and state: title, phone / fresh profile, hasTouch, live. Last seen: round 35. Tags: introduced false, regression false. Confidence: low (the same build's 390x844 touch runs reached battle).
   - Observed: screen() still read title after 2.5 s although the page says TAP TO BEGIN. Likely the tap point, not the game: the touch Seymour Flux and Bahamut runs of this round started from the title and reached battle.
   - Expected: A tap on the title advances.
   - Repro: critic/rounds/round-35/evidence/gaps/gaps-a.mjs, block phone-pause-touch.
   - Evidence: critic/rounds/round-35/evidence/gaps/phone-after-title-tap.png; critic/rounds/round-35/evidence/gaps/gaps-a.json
   - Requirement: Touch reachability of the phone pause
   - Smallest fix: Tap the TAP TO BEGIN element by selector and repeat; if a tap on the element does not advance, fix the title handler, otherwise close this.
   - Acceptance: A touch-only run reaches the battle and the PAUSE chip opens the pause screen at 390x844.
145. **PR-0591** [polish, interface, FFX-2 only] First-time fan: the CHAIN counter box changes place from frame to frame (right edge, under the tail, mid-screen) and is clipped at the right edge
   - Chapter and state: Chapter V Vegnagun / chain attack, 1600x900. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: In seq-action-playing the CHAIN box moves in the 10 frames and is cut off at the screen edge in several; the guide and intent cards also sit over Shiva (Fallen Aeons) and the tail (Vegnagun).
   - Expected: A counter sits still and inside the screen.
   - Repro: Chapter V chain attack; fan sheet ffx2-vegnagun-shuyin-win-r32__seq-action-playing.
   - Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-action-playing.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-fallen-aeons-win-r32__seq-party-action.jpg
   - Requirement: CHK-008
   - Smallest fix: Anchor the counter to one slot.
   - Acceptance: The CHAIN box does not move between consecutive frames and is not clipped.
146. **PR-0577** [polish, interface, FFX-2 only] FFX-2 target flag plate overlaps the command panel edge and clips the status tag ("Curse") at 1280 to 2000 wide (new in r68)
   - Chapter and state: Chapter IV / target step. Last seen: . Tags: introduced true, regression unknown. Confidence: medium (focused review; not re-observed live by the chief).
   - Observed: Focused review R68-P2, candidate bundle (same artifact as live).
   - Expected: No overlap and no clipped tag.
   - Repro: Chapter IV, Attack, target step, 1280 to 2000 wide.
   - Evidence: critic/reviews/2a9340249-focused.json
   - Requirement: CHK-008
   - Smallest fix: Offset the flag clear of the panel edge.
   - Acceptance: Flag and panel rects do not intersect at five widths.
147. **PR-0578** [polish, interface, both] Phone board: three text chips under 44 px (skip the guide 18 px, two hint chips) (R68-P3)
   - Chapter and state: phone board / 390x844. Last seen: . Tags: introduced false, regression false. Confidence: medium.
   - Observed: Focused review R68-P3; the chief's phone sweep read 14 px type, none under 14 px, on the battle menu, first menu and pause (separate from touch-target size).
   - Expected: 44 px touch targets.
   - Repro: tools/text-floor-sweep.mjs --touch=1 --targets=1 --sizes=390x844.
   - Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/gaps-chief/gaps/sweep/out-phone.json
   - Requirement: RUBRIC onboarding (device usability)
   - Smallest fix: Pad the chips to 44 px.
   - Acceptance: Touch-target probe lists no control under 44 px on the board.
148. **PR-0579** [polish, visual, FFX-2 only] Magic Break caption box sits over its own pink tag and clips it (FFX-2 Chapter IV, 2000x1012; one capture)
   - Chapter and state: ffx2-bahamut / mid-fight. Last seen: . Tags: introduced unknown, regression unknown. Confidence: low.
   - Observed: The caption box overlaps the MAGIC BREAK tag so the tag text is half hidden. On the phone the same two labels sit side by side without clipping (23-midfight).
   - Expected: One readable label.
   - Repro: node critic/runner/lib/route.mjs ffx2-bahamut win --size=2000x1012 --seed=1; open 23-midfight.png (moment dependent).
   - Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/23-midfight.png
   - Requirement: CHK-011
   - Smallest fix: Offset the tag or drop the duplicate while the caption shows.
   - Acceptance: A Magic Break capture shows one readable label.
149. **PR-0553** [polish, interface, FFX only] Chapter II: Tidus's HP plate covers Yunalesca's lower body in the hit frame; the party panel crosses Auron's boots (carried)
   - Chapter and state: yunalesca / first hit, 1600x900. Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: The plate sits over her legs and feet during the damage burst.
   - Expected: HUD off the boss body or faded over it.
   - Repro: Chapter II, seed 3, first hit, 23-midfight.
   - Evidence: critic/rounds/round-31/evidence/yunalesca-win/23-midfight.png
   - Requirement: CHK-008
   - Smallest fix: Move the plates down or fade over a boss quad.
   - Acceptance: No plate over the boss body at that moment.
150. **PR-0548** [polish, feel, both] Hit flashes, whiteouts and glow edges wash out the figure for a frame or more (carried): Braska's Final Aeon is a white blob for five frames on a heal, Vegnagun flickers copper for a frame, Rikku glows double at the sphere change
   - Chapter and state: braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-bahamut / effect frames. Last seen: round 33. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Fan strips: braska seq-action-playing f02-f06; vegnagun seq-action-playing f04 and f09; bahamut seq-spherechange f01-f02. ROUND 33: The fan again: a red see-through aeon over Yuna in the Isaaru summon, a translucent purple Bahamut with a smear over its wings, and Wakka smeared orange by Firaga in Omnis (single captures).
   - Expected: A flash that stays readable.
   - Repro: Chapter III Power Wave heal; Chapter V chain; Chapter IV change.
   - Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-action-playing; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing
   - Requirement: CHK-027 (flicker)
   - Smallest fix: Cap the heal wash and the glow on the figure's alpha.
   - Acceptance: The figure outline stays readable in the named frames.
151. **PR-0574** [polish, feel, FFX only] A boss or aeon and its pagodas appear in one frame (Braska battle start and aeon swaps); the party flashes from faded to full in one frame at the seams (first-time fan; the feel auditor read seams 3 and 5 as readable and paced)
   - Chapter and state: braskas-final-aeon / seq-transition-into-battle f02 to f03; seq-seam-2/4/6/7. Last seen: round 34. Tags: introduced false, regression false. Confidence: low.
   - Observed: See captures; the arena is empty for about 1.1 s, then a flash and the possessed aeon with a name banner. ROUND 33: The fan counts the same class in four more chapters: the arena opens with the party alone and the boss appears a frame later (Yojimbo f03 to f04, Flux, Isaaru Grothia, Trema Paragon), and Paragon arrives painted gold like its title card and re-tints to cold blue over the next few frames. It sits inside the battle-intro slate; polish. ROUND 34 (build 2342fe666): Fan lens: a fight opens with the party alone on an empty stage and no HUD or boss, which appear on the next frame (Flux seq-transition-into-battle f08 to f09; Braska seam 4 f00 and f04 to f05).
   - Expected: A readable arrival.
   - Repro: Chapter III by real keys.
   - Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-transition-into-battle; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
   - Requirement: CHK-027 (popping)
   - Smallest fix: None until Bailey judges the seam look (PR-0530).
   - Acceptance: A recorded verdict.
152. **PR-0575** [polish, feel, FFX only] MISS pops over healthy allies when a party-wide Mega Phoenix is used with one ally down (unsourced; do not change without a source)
   - Chapter and state: seymour-flux / turn 3 Mega Phoenix. Last seen: . Tags: introduced false, regression false. Confidence: low.
   - Observed: The engine logs miss reason wrong-state for tidus and yuna while Kimahri's revive resolves; it reads as if the item failed. Round 30b saw the same.
   - Expected: Unknown: no source says what the original draws.
   - Repro: Chapter I seed 1 turn 3.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f04.jpg; critic/rounds/round-31/evidence/seymour-flux-win/battle-log.json
   - Requirement: AGENTS rule 6
   - Smallest fix: Source the original, or ask Bailey.
   - Acceptance: A sourced statement then the same repro.
153. **PR-0576** [polish, feel, FFX only] UNVERIFIED observation: a blank cream cutscene frame between the Yunalesca victory and the results card
   - Chapter and state: yunalesca / victory to results. Last seen: . Tags: introduced unknown, regression unknown. Confidence: low.
   - Observed: yunalesca-win/30-post-scene.png: flat cream with the chapter eyebrow and the advance strip and no painting; the harness read the screen as results (UNVERIFIED capture). Chapter I shows a washed painting.
   - Expected: The painting under the wash, or a few frames only.
   - Repro: Chapter II seed 3, capture at the end of the fight (timed sequence needed).
   - Evidence: critic/rounds/round-31/evidence/yunalesca-win/30-post-scene.png
   - Requirement: CHK-022
   - Smallest fix: None until measured.
   - Acceptance: A timed sequence shows under 500 ms of a painting-less frame.
154. **PR-0536** [polish, feel, both] The turn cut-in (MF-16) covers nearly half the stage for several frames at every turn start in every chapter the fan looked at; the first-time fan rated it major
   - Chapter and state: all / turn start. Last seen: round 34. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Carried; the first-time fan counted the turn-start cut-in covering most of the stage for about three frames in 11 chapters of both games (Trema, Den of Woe, Fallen Aeons, Bahamut, Yojimbo, Sin face, Evrae, Yunalesca, Natus, Mirror Aeons) and a giant damage number over the boss. A design choice awaiting Bailey's look (PR-0530). ROUND 33: The fan again: the big turn-start portrait slides over the left third or half of the stage for about 3 of every 10 sampled frames in 14 chapters of both games (40 sequences). A design choice awaiting Bailey (PR-0530); nothing new. ROUND 34 (build 2342fe666): Fan lens: a full-screen portrait cut-in covers most of the screen for two to four frames while an acti ...
   - Expected: Bailey's judgment.
   - Repro: Any chapter, turn start.
   - Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-transition
   - Requirement: RUBRIC feel (readable effects)
   - Smallest fix: Ask Bailey.
   - Acceptance: A recorded verdict.
155. **PR-0528** [polish, visual, both] First-time fan polish breakers kept: attacks that do not visibly connect (a Yunalesca slash arc around Tidus while she stands at the right edge; a Bahamut hit that arrives as a purple streak from off-screen), one empty-stage frame as Bahamut fades in, a monster vanishing for a frame (Mortiorchis)
   - Chapter and state: yunalesca, ffx2-bahamut, seymour-flux / effects. Last seen: round 34. Tags: introduced false, regression false. Confidence: low.
   - Observed: Carried; round 32 adds two fan readings: Vegnagun's Tail Beam damage number (1766) and a pink ring appear on Rikku but the tail does not visibly fire toward her (seq-party-action frames 4 to 8), and Ormi's Shield Bash lunge returns in one frame with a MISS floating in the gap. ROUND 34 (build 2342fe666): Fan lens: Tidus swings at the spot where Auron stands and the damage numeral appears over Auron, not Yunalesca (yunalesca seq-party-action f00 to f04); in Sin face the "30" hit lands on empty air in front of Sin.
   - Expected: Effects aimed at their target.
   - Repro: see captures
   - Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange
   - Requirement: CHK-027
   - Smallest fix: Aim the slash and the streak from the actor.
   - Acceptance: Frames show origin at the actor.
156. **PR-0524** [polish, encounter, FFX-2 only] research/ffx2-bahamut.md still carries the superseded Mega Flare constant 24 and the 614 to 1,165 damage with no banner (carried)
   - Chapter and state: ffx2-bahamut / docs. Last seen: round 32. Tags: introduced false, regression false. Confidence: high.
   - Observed: Carried: research/ffx2-bahamut.md still carries the superseded Mega Flare constant and damage range with no banner (git diff 2a9340249 e3f51bf18 -- research is empty).
   - Expected: A superseded banner.
   - Repro: head and section 2.3 of research/ffx2-bahamut.md against re-ffx2-ai-bahamut-vegnagun.md section 2.3.
   - Evidence: research/ffx2-bahamut.md
   - Requirement: AGENTS rule 6
   - Smallest fix: Add the banner.
   - Acceptance: The banner exists.
157. **PR-0533** [polish, test-coverage, both (tooling)] The 15 s default test timeout fails 27 CPU-bound suites when the suite shares the host with browser jobs (extends PR-0533; the 13 files pass 239 of 239 serially)
   - Chapter and state: advisor, strategy-chapter2, door tests, ui-ffx2-atbmode, audio-manifest-io / full suite 27,254 tests. Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: 28 failed in 27 suites, all 15 s timeouts (one EPERM on a lock file) while the harness ran.
   - Expected: A green full suite on a loaded host.
   - Repro: npm test while a capture runs.
   - Evidence: critic/rounds/round-31/audit-combat/full-suite.json
   - Requirement: AGENTS Done means
   - Smallest fix: Give the fuzz-style files a 60 s timeout; retry the lock open on EPERM.
   - Acceptance: npm test passes while one browser job runs.
158. **PR-0519** [polish, interface, both] Question for Bailey (carried): the default F1 HUD shows the advisor as a one-row chip; the reason, benefit and CURES KO tag live only in the G card
   - Chapter and state: Chapters I and IV / first menu. Last seen: . Tags: introduced false, regression false. Confidence: high.
   - Observed: Advice itself is right: 784 of 784 picks found their row; the reason is one key away.
   - Expected: Bailey's decision.
   - Repro: Chapter I first menu.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-win/11-advisor.png
   - Requirement: RUBRIC interface
   - Smallest fix: Ask Bailey.
   - Acceptance: A recorded verdict.
159. **PR-0546** [polish, prep, both] The pro-defeat card now names its cause at normal speed ('Felled by Attack, turn 4, attempt 1' ) after r67's repair; the SKIP-speed wording was not re-run
   - Chapter and state: Chapters I and IV / defeat card. Last seen: . Tags: introduced false, regression false. Confidence: medium.
   - Observed: Seen at normal speed in both chapters; SKIP not re-run.
   - Expected: A cause at every speed.
   - Repro: Lose with battle speed SKIP.
   - Evidence: critic/rounds/round-31/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
   - Requirement: RUBRIC prep (understandable defeat)
   - Smallest fix: Run it at SKIP.
   - Acceptance: The card names a cause at SKIP.
160. **PR-0487** [polish, onboarding, FFX only] 'He strikes first' coach against a turn order that puts Seymour third (carried; not reproduced in seed 1 where Seymour does strike first)
   - Chapter and state: Chapter I phone / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
161. **PR-0508** [polish, onboarding, both] VISUAL STYLE and PRESENTATION 'THE ECHO - B' are unexplained and the FFX options pane shows no focused row (carried)
   - Chapter and state: options / carried. Last seen: round 35. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 34 (build 2342fe666): Re-observed: VISUAL STYLE HD-2D and PRESENTATION THE ECHO - B are unexplained. Round 35: re-observed.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
162. **PR-0569** [polish, delivery, both] Firefox console font warnings for Rajdhani and Chakra (carried; Chromium only this round)
   - Chapter and state: all / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
163. **PR-0526** [polish, interface, both] Small copy and fit points in the booth and phone surfaces (carried, not re-examined)
   - Chapter and state: booth, phone / carried. Last seen: round 33. Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 33: The fan adds: two banners stack, "Strike" over "Shield Bash", in the first Ormi action of Leblanc (seq-transition-into-battle f05 to f07).
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
164. **PR-0527** [polish, delivery, both] UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 runs in round 29 (carried; none seen in the 19 live runs, but see the 5.6 s frame in PR-0580)
   - Chapter and state: harness / carried. Last seen: . Tags: introduced -, regression -. Confidence: medium.
   - Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
   - Expected: as in the earlier rounds that opened it
   - Repro: as in the entry of critic/rounds/round-30b.json
   - Evidence: critic/rounds/round-30b.json
   - Requirement: see the round 30b entry
   - Smallest fix: unchanged from round 30b
   - Acceptance: unchanged from round 30b
165. **PR-0595** [polish, interface, FFX only] A ready Overdrive sits as the fifth row inside the bottom fade; the advisor's star is the only cue
   - Chapter and state: Chapter XIV Isaaru / Chapter XIV Isaaru, F1 command menu, Yuna, 1600x900. Last seen: . Tags: introduced true, regression unknown, new feature. Confidence: medium (contrast not measured).
   - Observed: 'OVERDRIVE (star) READY' is drawn at roughly a quarter strength under the scroll fade with a down arrow; the advisor's pick (Grand Summon: Shiva, IN OVERDRIVE) lives in that row while the cursor starts on SPECIAL.
   - Expected: A ready Overdrive reads as ready without scrolling.
   - Repro: Chapter XIV first menu, Yuna, 1600x900.
   - Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png
   - Requirement: RUBRIC interface (legible values)
   - Smallest fix: Float a ready Overdrive row to the top slot or exempt it from the fade.
   - Acceptance: At 1600 the OVERDRIVE row's text contrast is at least 4.5:1 whenever the gauge is full.
166. **PR-0609** [polish, interface, both] At 3840x2160 with a device pixel ratio of 1 the pause text does not grow with the screen (about 0.8 percent of height against 1.6 percent at 1600x900)
   - Chapter and state: I seymour-flux at 3840x2160 DPR 1 / sweep matrix. Last seen: . Tags: introduced -, regression -. Confidence: low on player impact.
   - Observed: Battle HUD minimum 25.2 css px at 4K, pause minimum 17 px; in the frame the pause stats and tab strip are small on a 2160 px canvas. DPR 1 at 4K is the harsh case; a real 4K screen is usually run at 150 to 200 percent.
   - Expected: The pause scales like the battle HUD, or the size is known to be reached only with OS scaling.
   - Repro: evidence/gaps/sweep-matrix-3840x2160/02-pause.png and out-matrix.json.
   - Evidence: critic/rounds/round-33/evidence/gaps/sweep-matrix-3840x2160/02-pause.png; critic/rounds/round-33/evidence/gaps/sweep/out-matrix.json
   - Requirement: CHK-003; where: pause CSS; not traced
   - Smallest fix: Scale the pause text with the viewport above 2560 wide, or confirm real 4K screens run scaled.
   - Acceptance: Pause minimum effective size at 4K DPR 1 at least 22 px, or recorded as accepted.
167. **PR-0611** [polish, visual, FFX] Possessed Ifrit and Possessed Shiva seam scenes frame Auron from the chest down for the whole seam, with no face: a question whether that framing is the intent
   - Chapter and state: III braskas-final-aeon, seams 3 and 5 / seq-seam-3 and seq-seam-5, f00 to f09. Last seen: round 35. Tags: introduced -, regression -. Confidence: low.
   - Observed: A low close-up of Auron's coat, sword and legs on a near-black ground; the first frame is nearly black. It reads as a deliberate stylised shot (a detail shot of the coat), and no defect is established. Seams 4, 6 and 7 were not opened by the fan. Round 35: re-observed in Braska seam 5 (Possessed Shiva): Auron is framed from the coat down for seven frames (braskas-final-aeon-win-r35/seq-seam-5 f01 to f07); in seam 2 the party is absent for one frame and then pops in (seq-seam-2 f00 to f01).
   - Expected: The seam shot shows what the story beat needs; if the face is meant to be out of frame this is intended.
   - Repro: Chapter III, seed 1, reach seam 3 and 5.
   - Evidence: critic/rounds/round-33/evidence/braskas-final-aeon-win-r33/seq-seam-3/f03.jpg
   - Requirement: cinematic direction; a question for Bailey; where: seam scene camera
   - Smallest fix: None until Bailey says whether the framing is wanted.
   - Acceptance: Bailey's answer recorded.
168. **PR-0612** [polish, harness, both] The capture route and the harness leave gaps this round: no ACCESSIBILITY, CONTROLS or MUSIC frames and no TEXT SIZE 115/130 on the new F1 chapters (seventh review), the continuity harness took 3 hours 48 minutes for 19 chapters (02:31 to 06:19 EST) and finished after round 33 was first written, and the desktop lose runs end at the defeat state with no retry step
   - Chapter and state: critic capture route / critic capture owner and gap pass. Last seen: round 34. Tags: introduced -, regression -. Confidence: high.
   - Observed: run.json pause.tabs lists only the character tabs, Chapter, Guide and Options; the harness had read 4 of 19 chapters after 73 minutes and all 19 by 06:19 (round 33b); the FFX-2 Chapter IV retry was added by the gap pass (retry-ffx2-bahamut, 9.3 s from TRY AGAIN to the first menu) but the FFX Chapter I desktop retry has no timed file. ROUND 34 (build 2342fe666): Added this round: the 19-chapter continuity run did not finish (PR-0627); the capture route still never opens ACCESSIBILITY, CONTROLS or MUSIC; the continuity pass read no hidden chapter.
   - Expected: An accessibility leg in the route, a harness run that finishes inside the review, and a retry step in every lose run.
   - Repro: evidence/*/run.json.
   - Evidence: critic/rounds/round-33/continuity/run.log; critic/rounds/round-33/evidence/gaps/retry-ffx2-bahamut/timed.json
   - Requirement: RUBRIC section 6 onboarding; CHK-026/027 required evidence; where: critic/runner
   - Smallest fix: Add the accessibility leg and the retry step to the route; start the continuity harness first in the next deep review, in two halves on two profiles, so it finishes. Critic tooling only.
   - Acceptance: Frames exist for each listed state and the harness summary is written before the report.
169. **R72-3** [polish, feel, FFX] Chapter XII real-clip dashes up to 84.1 px against 0 on the control (carried from the focused review)
   - Chapter and state: XII seymour-omnis / continuity harness, seed 1, same-artifact focused run. Last seen: round 33b. Tags: introduced true, regression false. Confidence: high.
   - Observed: Dashes worst 84.1 px (under the 100 px bar); swap jerk 30 px; CHK-026 and CHK-027 PASS. The control build has 0 dashes. ROUND 33B: the full run reads the same Omnis numbers (23 dashes over 40 px, worst 84.1 px; 30 swap jerks, worst 29.9 px; CHK-026 and CHK-027 PASS).
   - Expected: No new dashes from the real clips.
   - Repro: Continuity harness on seymour-omnis, seed 1.
   - Evidence: critic/reviews/01a767770-focused/continuity/continuity-summary-seymour-omnis.json
   - Requirement: CHK-027
   - Smallest fix: Review the XII dash strips and ease the clip entry.
   - Acceptance: Dashes under 60 px on XII.
170. **PR-0618** [polish, interface, FFX-2 (hidden 3D chapters yrp and waker, desktop-only)] In the hidden 3D chapters the HUD panels sit over the boss and Wind Waker shows an orphan "E HIDE" tag (was R34-INT-02)
   - Chapter and state: exp-yrp-3d, exp-windwaker / 1600x900 first menu, E and target frames. Last seen: round 34. Tags: introduced true, regression false, new feature. Confidence: medium-high (eye reading).
   - Observed: 3D Bahamut: the guide panel opens over the model's torso, in the target step the lotus ring lands on the guide text and the WAIT-ATB HELD chip sits on the boss ribbon (Wind Waker already starts its guide folded, the 3D Bahamut does not). Wind Waker: the command rows stand over Valefor and the target line crosses the E card text; a dark "E HIDE" tag hangs at top centre with no card beneath. Also open for Bailey: the Wind Waker cast is Meshy toon models, and he rejected the same kind of AI-made 3D cast for yrp (D-1130); the frame otherwise matches target C-3.
   - Expected: Panels leave the boss clear; no label without its card; an owner verdict on the models.
   - Repro: Type yrp or waker, play to the first menu, press E then Enter on ATTACK.
   - Evidence: critic/rounds/round-34/evidence/exp-yrp-3d-win-r34/12-intent-E.png; critic/rounds/round-34/evidence/exp-yrp-3d-win-r34/16-target-single.png; critic/rounds/round-34/evidence/exp-windwaker-win-r34/16-target-single.png
   - Requirement: CHK-008
   - Smallest fix: Start the 3D Bahamut's guide folded as the Wind Waker's is, drop the guide while a target cursor is up, hide the tag with its card; ask Bailey to judge the toon models.
   - Acceptance: No panel over the model's torso in the first menu, E and target frames; no orphan tag.
171. **PR-0622** [polish, encounter, FFX] Spectral Keeper difficulty for a person is unmeasured: the best crude bot wins 7 of 200 and no human-paced run used Move or aeons
   - Chapter and state: spectral-keeper (hidden) / hidden chapter 29. Last seen: round 34. Tags: introduced true, regression false, new feature. Confidence: low.
   - Observed: Attack-only 0/200, random 0/200, every bot line that skips aeons 0/200; aeons plus dodge plus heal 7/200 at party HP x1 (median 26,165 of 52,000 dealt), 39/200 at x2. The capture's real keys attacked and healed and lost in 5 turns (the first sweep hits all three front-liners for about 2,400 each). Winnable by a bot; whether a person finds the Move-and-aeon line is unverified. No sourced number is disputed.
   - Expected: A sourced boss that is hard but fair with a findable answer.
   - Repro: KEEPER_MEASURE=200 npx vitest run tests/unit/chapters/spectral-keeper-measure.test.ts.
   - Evidence: critic/rounds/round-34/audit-combat/keeper-measure-200.log; critic/rounds/round-34/audit-combat/keeperfuzz-cand.json
   - Requirement: RUBRIC section 6 encounter
   - Smallest fix: Nothing to change now: one real-key run that wins using Move and an aeon, then Bailey's call on whether the tip says enough about stepping off the front trio.
   - Acceptance: One real-key win with the Move row, a lit mine and its blast on screen.
172. **PR-0623** [polish, combat, both (one reading in each hidden chapter)] Two source conflicts were resolved by the builder's own reading and are not recorded as decisions (Keeper aeon-mode counter on a miss; Spider Bite damage class)
   - Chapter and state: spectral-keeper under an aeon; ffx2-fallen-maesters floor 20 / hidden chapters. Last seen: round 34. Tags: introduced true, regression false, new feature. Confidence: medium.
   - Observed: (1) RE 4.5 lists the aeon extra +1 after the damaging-hit step so the code adds it on any HP-class hit including a miss, while RE 4.4 and section 6 say +2 per damaging hit (src/battle/ffx/ai/spectral-keeper.ts keeperOnHit). (2) RE section 8 calls Spider Bite physical but its appendix row has damage flags 0x0; the code follows the row (src/data/ffx2/enemies/fallen-maesters-abilities.ts). Both are commented in code. Small effect.
   - Expected: Where research contradicts itself the conflict is reported and the choice recorded as the owner's or the driver's.
   - Repro: Read the cited sections.
   - Evidence: research/re-ffx-spectral-keeper.md; research/re-ffx2-fallen-maesters.md
   - Requirement: RUBRIC section 2: conflicting evidence is reported, never invented
   - Smallest fix: Record both as driver picks in the handoffs and the decisions ledger.
   - Acceptance: Each reading has a ledger row naming the conflict.
173. **PR-0624** [polish, combat, FFX-2] The Black Elemental's Reflect is data only: floor 40 is easier than the game, and a code comment says the opposite of the pinned test
   - Chapter and state: ffx2-fallen-maesters floor 40 / hidden chapter 30. Last seen: round 34. Tags: introduced true, regression false, new feature. Confidence: high.
   - Observed: The engine has no monster-side Reflect redirect; tests/unit/chapters/fallen-maesters-engine.test.ts line 136 (KNOWN GAP) pins that a reflectable spell lands, while the comment above x2BlackElemental in src/data/ffx2/enemies/fallen-maesters.ts claims the redirect. Scan text implies a bounce that does not happen. Floor 40 won 31 of 40 on the Darkness line.
   - Expected: Comment and test agree; the redirect is ported when the engine gets it.
   - Repro: Run the engine test (T0), or cast Drain at the Black Elemental.
   - Evidence: tests/unit/chapters/fallen-maesters-engine.test.ts; critic/rounds/round-34/audit-combat/maestersfloors.json
   - Requirement: AGENTS.md rule 6; honesty of in-game text
   - Smallest fix: Correct the comment now; port the redirect later and re-measure floor 40.
   - Acceptance: The comment matches the test; after a port T0 expects a bounce.
174. **PR-0625** [polish, interface, FFX-2] The one-row advisor chip says "no MP" for Darkness while the HP cost lives only in the card (was R34-INT-03)
   - Chapter and state: IV Bahamut (chip), XV, XI, XVI (card) / Dark Knight dressphere. Last seen: round 34. Tags: introduced false, regression false. Confidence: medium.
   - Observed: Chip: "Darkness -> all enemies . no MP"; the card in Chapters XV, XI and XVI says "Costs Paine 12.5% of max HP". The 12.5 percent is the card's statement, not re-checked against research.
   - Expected: The cost beside the action names every cost.
   - Repro: Chapter IV CHANGE with Rikku in Dark Knight against the Den of Woe advisor text.
   - Evidence: critic/rounds/round-34/evidence/ffx2-bahamut-win-r34/21-change-open.png; critic/rounds/round-34/evidence/ffx2-den-of-woe-win-r34/run.json
   - Requirement: CHK-004
   - Smallest fix: Print the HP cost in the chip's cost slot.
   - Acceptance: Chip and card carry the same cost for Darkness.
175. **PR-0626** [polish, interface, FFX] The FFX phone target card's element chips touch the hint line (was R34-INT-04)
   - Chapter and state: I seymour-flux 390x844 / phone ATTACK target step. Last seen: round 35. Tags: introduced false, regression false. Confidence: medium.
   - Observed: The WATER / HOLY / GRAV chip row sits against "Tap another enemy to switch . swipe"; descenders touch in a 3x zoom. Round 35: re-confirmed on a 2x crop (critic/rounds/round-35/interface-crops/phone-target-panel.png).
   - Expected: Chips and hint do not touch.
   - Repro: Chapter I on a phone, aim ATTACK.
   - Evidence: critic/rounds/round-34/evidence/seymour-flux-win-r34-phone-touch/16-target-single.png; critic/rounds/round-34/scratch/int-phone-target-zoom.png
   - Requirement: CHK-008
   - Smallest fix: Add 6 px between the chip row and the hint.
   - Acceptance: Chip row bottom is at least 4 px above the hint.
176. **PR-0629** [polish, feel, both] Fan lens: damage and heal numbers hang 6 to 10 frames, drift with the camera and sometimes overlap (445 over 7573)
   - Chapter and state: Flux, Evrae, Braska, Fallen Aeons, Vegnagun, Yojimbo / damage numbers in action montages. Last seen: round 34. Tags: introduced false, regression false. Confidence: medium.
   - Observed: The same number sits over a different spot as the shot changes (1968, 1329, 3023, +1500, 2450, 7573). Two numerals stack in one frame.
   - Expected: A numeral holds its anchor on the struck figure and does not overlap.
   - Repro: The action-playing montages of the six chapters.
   - Evidence: critic/rounds/round-34/evidence/seymour-flux-win-r34/seq-action-playing; critic/rounds/round-34/evidence/evrae-airship-win-r34/seq-action-playing
   - Requirement: First-time-fan lens (D-423)
   - Smallest fix: Anchor numerals in the figure's space during camera moves and stagger simultaneous numerals.
   - Acceptance: A montage shows each numeral on its figure through the camera move.
177. **PR-0630** [polish, feel, both] Fan lens: party figures slide sideways between frames while a move plays, and Dark Mindy hangs in mid-air
   - Chapter and state: Flux, Bahamut, Mirror Aeons / party action montages. Last seen: round 34. Tags: introduced false, regression false. Confidence: low to medium.
   - Observed: Tidus and Yuna glide left across the floor in the Mega Phoenix move (Flux seq-party-action f00 to f03); Rikku and Paine shift when the camera moves (Bahamut f03 to f04); Dark Mindy and her sisters hang at the top of the stage (Mirror Aeons seq-action-playing f00 to f09). The fan's list was cut off in the task text after this entry.
   - Expected: Feet stay planted unless the move travels; floating is a designed hover.
   - Repro: The three montages.
   - Evidence: critic/rounds/round-34/evidence/seymour-flux-win-r34/seq-party-action; critic/rounds/round-34/evidence/mirror-aeons-win-r34/seq-action-playing
   - Requirement: First-time-fan lens (D-423); CHK-027 feet
   - Smallest fix: Confirm with the harness feet reading before changing any motion.
   - Acceptance: Feet shift under the CHK-026 line in the three chapters.
178. **PR-0663** [polish, interface, both] Party prep polaroid captions (.cpanel__snap-cap) read 13.95 to 14.0 px, a hair under the 14 px floor (12 elements on 6 of 28 prep surfaces)
   - Chapter and state: party prep, Chapter tab (FFX tab 1, FFX-2 tabs 1 and 6) / live, 1600x900 and 390x844, numeric floor sweep of 28 prep surfaces. Last seen: round 35b. Tags: introduced false, regression false. Confidence: high.
   - Observed: The captions of the polaroid snapshots in the party prep Chapter tab compute to 13.95 to 14.0 px after the ancestor transforms. Polish level.
   - Expected: At least 14 css px.
   - Repro: Open party prep on any chapter, Chapter tab, read the computed size of .cpanel__snap-cap.
   - Evidence: critic/rounds/round-35/gaps-b/misc/sweep-prep/gaps/sweep/out-prep.json
   - Requirement: CHK-003
   - Smallest fix: Raise the caption size by 0.1 px or floor it with the stage floor variable.
   - Acceptance: The prep sweep reads 0 elements under 14.

### Closed or withdrawn this round

- **PR-0594** (fixed-verified): Mirror Aeons results row prints 'S.LV 180 - 28,000/22,000 AP' with no Sphere Level gain
- **PR-0665** (withdrawn: harness limit, not a product defect): Spherimorph on a 390x844 touch run did not finish in 900 s (175 turns): WITHDRAWN, the route could not page the Black Magic list
- **PR-0666** (withdrawn: superseded by PR-0686 (the Omega return to the board is now shown)): Omega Ruins aftermath and an honest Jenova win not shown (delivery auditor, first draft)
- PR-0594: FIXED, verified on live: the Mirror Aeons results now read Tidus +1 S.Lv, S.LV 181 6,000/22,000 AP (release 78 Sphere Level bar cap, FFX only, declared); recomputed from apForLevel against the printed rows (audit-delivery/ap-check.mjs). The pooled-bar class is closed on live; Omega Ruins reads 11,000/22,000 where release 77 printed 33,000/22,000 (R77-4 closed with it).
- R77-4: The Omega Ruins Sphere Level bar over its cap (release 77 printed 33,000/22,000) now reads 11,000/22,000 on live (Tidus S.LV 187, Yuna 182, Lulu 177), recomputed from apForLevel (audit-delivery/ap-check.mjs).
- PR-0665: Withdrawn: the phone Spherimorph stall was the route's inability to page the Black Magic list; Watera is one tap on the pager (gap pass phone-sph-watera2).
- PR-0666: Narrowed into PR-0686: the Omega return to the board is now shown by two real-key runs.
- fan-teleports: Not kept as defects: the fan's Ifrit teleports (transition-into-battle f06 to f09) come from a timed sequence of 10 frames about 180 ms apart or more; the frame-by-frame harness reads 0 px swap jerk and 0 dashes over 275 swaps. The fan's Spherimorph teleport is kept as an UNVERIFIED minor (PR-0669) until the harness runs that chapter.

## What stands between this build and acceptance

This is a deep review, so the milestone is not assessed; for the finished standard (9.60 unrounded, every category 9.0 or more, nothing UNVERIFIED, no open critical or major, every encounter through its real flow, every target matched, the exact artifact verified) the following stand open:
- Two categories have no number: audio (needs Bailey's listening verdict) and onboarding (a simulated newcomer; the accessibility rows were not walked on the new chapters).
- Five categories sit under the 9.0 floor: visual 8.4, feel 7.6, narrative 8.3, interface 7.5, delivery 8.3.
- 19 major issues are open: the pose-swap continuity family (CHK-026 in 7 of 19 chapters, CHK-027 in 7 of 19, see-through swaps), the new hidden-chapter majors PR-0667 and R78-1, the unproven wins (Farplane Cup, Maesters floor 80, Penance, Keeper), the Chapter XII intent range, and the carried audio, phone-prep and load-time majors.
- Seven required targets are unverified and fourteen waiting; seven human judgments are unrecorded.
- The deploy is clean on identity but not on CHK-017's zero-404 clause (PR-0664) and the cold-load clause is unmeasured (PR-0646).

## What changed since the previous round (35b, build 36b6e851d; no comparison with rubric v1 rounds 02 and 03)

- Better: the Tidus (Chapter I) and Rikku Dark Knight (Chapter IV) rigs are on by default and measured clean (head 0.2 and 0.3 percent, feet 0 px); Chapter I's worst head jump fell from 93.2 to 10.8 percent and its feet shift from 14.1 to 4.9 px; PR-0594 and R77-4 (the Sphere Level bar over its cap) are closed on live; the FFX cone marker reads clearly; CHK-022 now PASSES for every included chapter, including the Omega Ruins return to the board and the Youth League RETRY; the 19 listed chapters were all won by real keys on live.
- Unchanged: the same seven chapters fail CHK-026 and CHK-027 (Braska worst); the 20 engine probe files are byte-identical to 35b; combat 9.4 (up 0.2), encounter 9.0, prep 9.0 (up 0.1), delivery 8.3, visual 8.4, interface 7.5 (down 0.1).
- Worse or new: feel 7.6 (down 0.2) and narrative 8.3 (down 0.4) because of the new hidden chapters (Jenova LIFE hard cuts, silent Jenova and Wendigo, Wendigo's black pre-scene); 26 new or renamed issues, 2 of them major in new features; two 404s a run in two hidden chapters; Leblanc joins CHK-027 on one jerk of 48.6 px on a long frame (PR-0685, to be re-measured alone).
- Settled by the gap pass: the phone Spherimorph stall was the route, not the product (Watera is one tap on the pager); Wendigo's Guardians act and Protect from the dead; Jenova's Reflect and bounce are real but have no mark.

## Proposals (nothing here is built without Bailey's yes)

- Bailey's call (PR-0636, carried): apply the Special-dressphere Eject immunity to a winning line for Farplane duel 1, or print the engine's behaviour on the prep card; benefit: duel 1 from about 10 percent to a sourced answer; cost: shared FFX-2 plumbing with a Leblanc regression test.
- Paint the Youth League foes (Yaibal and the League types) so the chapter stops drawing cones and stops requesting a missing file (PR-0667, PR-0664); benefit: removes the largest visual placeholder in a hidden chapter; cost: art-lane work; a preview frame first.
- Register the FF7 hurt frames to the idle feet or hold the idle under the hurt flash (R78-1); benefit: Jenova LIFE and the Guard Scorpion stop snapping; cost: a registration table for the FF7 kit.
- Bailey's call (PR-0677): treat reward auto-abilities (Gillionaire, Double Items, Double EXP) as unlearned unless the build names them, or list Lady Luck's learned abilities; benefit: results equal the sourced rows; cost: a small FFX-2 adapter change with the existing reward tests.
- Critic plumbing: add an FF7 mode to route.mjs, register chapters 41, 42, 43 in the continuity harness, give sweep.mjs the door words, teach the route to tap the sub-list pager (PR-0539, PR-0659); benefit: the next review replays every hidden chapter without hand-built scripts; cost: critic plumbing only.
- Give Jenova LIFE a deliberate silent start (stop the board bed at battle start) and decide the stand-in cue (PR-0676, J13, J14); and draw a Reflect shell on Jenova (PR-0675).
- Stop the presenter requesting a painted idle for a foe with no painting (PR-0664); benefit: zero 404s and zero console errors in all hidden chapters, which CHK-017 asks for; cost: a manifest check before the request.
- Wendigo pre-scene: hide the ENTER ADVANCE prompt while a scene has no lines (PR-0683); and darken the 3D-stage guide backing (PR-0682).
- A motion clip of the Chapter I Tidus rig and the Chapter IV Rikku rig for Bailey to judge (PR-0671), and a burst capture at frame cadence for the first-time-fan lens so its teleport claims can be checked against the harness.

## Human judgments owed

- Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148): not recorded
- Feel: the Tidus (Chapter I) and Rikku (Chapter IV) rigs judged in motion, the camera cuts of PR-0521, the fast-speed strike (CHK-B2, PR-0615): not recorded
- Encounter: is Farplane Cup duel 1 meant to be answered by the Special-dressphere Eject immunity (PR-0636), and are the Farplane duels 2 and 3, Penance and Maesters floor 80 meant to be this hard: not recorded
- Combat: should changing into Lady Luck double gil, EXP and items with nothing learned (PR-0677): not recorded
- Art: the Youth League foes' painting (PR-0667), the Kilika plate (PR-0670) and the Chapter I Tidus rig look (PR-0671): not recorded
- Narrative and audio: should Jenova LIFE and Wendigo get scenes and music (PR-0684, PR-0676, J13, J14): not recorded
- Interface: should the FF7 chapter get an advisor, intent card and guide, and should Omega Ruins and Mirror Aeons get an enemy-move card (PR-0672, PR-0680, PR-0608): not recorded

Server hygiene: No dev or preview server was started by the chief; the lane browsers were headless Chromium launched from node scripts. The chief ran only curl and node reads.
