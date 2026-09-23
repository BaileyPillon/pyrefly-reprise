# Critic round 10 — deep review of the LIVE build (release 09)

```text
Build / artifact / target version: main 5ddfde3 (5ddfde3023d016e9e6a4f8b8a47577bd44b4fa66; review HEAD e9b9bed is the deploy record only), bundle Jw5R1yWQ, artifact 7093e5c3171d8cb8a1120bb75ca4be9b82710eb71f9a2722d344ca24d1436cd3, targets.json 705a67cfda05...
Review: deep (post-deploy, on the live URL; the build shipped under the owner override before its save-data deep review)
Deployment: PASS (CHK-017 verify-live 166 files, 0 mismatched; live manifest = critic/artifacts/5ddfde3.json; 0 console errors, 0 real 404s)
Changed area: FAIL (PR-0122 regression on the pause; new-chapter majors PR-0143, PR-0144, PR-0099, PR-0092, PR-0096)
Ship: HOLD by rule A (PR-0122 is a major regression against release 08); already live by Bailey's override, so no rollback recommended; the fix ships in the next release. Disclosed majors: see 'Disclosed' below
Milestone: not assessed
Quality: PROVISIONAL (audio UNVERIFIED); every other category below 9.0 (see the score output)
Targets: required 31 / matched 19 / failing 12 / unverified 0 / waiting on decision 5
Top issues: PR-0122 pause overlay (regression), PR-0148 score Bailey called SNES-like, PR-0142 FFX chip steals Enter, PR-0143 Steal inert, PR-0125 Doublecast on Lulu, PR-0082 no chapter 3 win, PR-0144 wrong guide reason, PR-0126 advisor drops menu path, PR-0124 MP over max, PR-0123 intent odds
Coverage: all six chapters on live with real keys (wins in 1, 2, 4, 5, 6; losses in all six); reused with dependency arguments on identical code; not tested: listening, chapter 3 win, same-origin save upgrade, touch/pad/other browsers
Next required review and why: focused review of the repair candidate before its deploy; the 5ddfde3 deep obligation stays pending (CHK-B1, CHK-022 ch3, CHK-024 UNVERIFIED)
Elapsed review time / repeated work avoided: ~330 min wall clock; chapter 6 benches, data audit, script reading and save matrix reused, not repeated
```

## Score (tools/critic-score.mjs, verbatim)

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
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is FAIL
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-005 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-007 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-010 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-012 is FAIL
  - mandatory check CHK-013 is FAIL
  - mandatory check CHK-014 is FAIL
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-021 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-024 is UNVERIFIED
  - mandatory check CHK-B1 is UNVERIFIED
  - 52 critical or major issue(s) remain open
  - encounter braskas-final-aeon has no complete real-input flow
  - 12 required target(s) failing
  - 5 required target(s) waiting
  - only 19 of 31 required targets matched
  - human judgment not recorded: Audio listening verdict on this mix (CHK-B1)
  - human judgment not recorded: Hands-on feel (CHK-B2) and chapter 6 voices (CHK-B3)
  - human judgment not recorded: Open questions only Bailey can answer
report: valid evidence
```

## Build identity

The task named the review HEAD e9b9bed. That commit only records the deploy (docs/deploys.log, critic files); git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty, docs/deploys.log records 'main=5ddfde3 bundle=Jw5R1yWQ', critic/artifacts/e9b9bed.json does not exist, and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json. The deployed build, and the build whose deep obligation this report addresses (critic/pending/5ddfde3.json), is therefore main 5ddfde3; the report is filed under that sha so it names the artifact actually reviewed.

## Verdicts

- **deployment**: PASS: CHK-017 verify-live PASS on 166 files against critic/artifacts/5ddfde3.json (0 mismatched, missing or wrong-type), the live manifest equals the recorded one (7093e5c3..., 896 files, decodeChecked, problems []), the index serves assets/index-Jw5R1yWQ.js, and 13 real-input routes plus the gap pass ran with 0 console errors and 0 real 404s (one transient Pages 503 re-fetched 200).
- **changedArea**: FAIL: the changed systems do not meet their targets without regression: PR-0122 is a regression against release 08 on the pause, and the new chapter carries open majors (PR-0143 Steal, PR-0144 guide, PR-0099 music, PR-0092, PR-0096).
- **milestone**: not assessed: a deep review does not assess the milestone.
- **ship**: HOLD by rule A: PR-0122 (major) is a regression against release 08. The build is already live under the owner override; HOLD records that it is not better than release 08 on the pause, not a call to roll back.

**Ship reasons**

- HOLD: PR-0122 (major) is a regression against release 08 (1b33971): the enemy-intent card now paints over the pause close-up, OPTIONS and THIS ENCOUNTER in every FFX-2 chapter and survives H, and the FFX chip shows through. Reproduced on live by the capture owner, the visual auditor and independently by the confirmer. Rule A makes a major regression a HOLD.
- This build is already public: it was deployed at 11:55 UTC under Bailey's override ('Work on pushing at least a live build with one new chapter'). HOLD therefore changes nothing that is live; it records the verdict. A rollback is NOT recommended: it would remove chapter 6, the Wait default and its save migration, and the production-build fix, which are the reasons the build went out.
- The next action is a repair release: hide the .eint layer while the pause is open (main 59b348a3 appears to do this, unverified), then a focused review of that candidate before its deploy.
- No critical defect was found: no crash, lock or lost progress in 13 capture routes and the gap pass; saves and settings behave on live (clears survive reload in five chapters; MUSIC/SFX survive reload; a real-key Active choice sticks); every chapter except chapter 3 completes its real flow on live.
- The other majors do not hold: not regressions (PR-0125, PR-0124, PR-0094, PR-0097, PR-0143, PR-0148 and the carried list), unknown on a major (PR-0126, PR-0128, PR-0142; unknown holds only a critical), or inside brand-new features (PR-0144, PR-0123, PR-0099, PR-0092, PR-0096, PR-0087). They are disclosed and carried.

**Disclosed majors (carried into the next batch)**

- PR-0148 (both): The shipped score is the one Bailey said sounds like SNES music (D-026, 'fixed very next build'); it ships unchanged, and OWNER-VERDICT.md does not record that verdict
- PR-0142 (FFX only (the FFX-2 chapter 6 matrix does not leak)): FFX: after one mouse click on the PAUSE chip, keyboard focus stays on the chip and every later Enter on the command menu re-opens the pause
- PR-0143 (FFX-2 only): FFX-2 Steal and Pilfer Gil are offered as enabled commands but do nothing and say nothing; chapter 6 hands Rikku both and its data says 'Steal them.'
- PR-0125 (FFX only (chapter 3; the dreams-end preset is the only one granting Doublecast)): FFX Doublecast entered through the real command menu asks for no spell or target and casts Firaga twice on Lulu herself, KOing her; the chapter 3 advisor recommends it about 25 times per attempt
- PR-0082 (both): Chapter 3 still has no real-input win (narrowed from three chapters to one): five attempts of about 24 minutes each, all defeats; suspected cause PR-0125 (Doublecast KOs Lulu)
- PR-0144 (FFX-2 only): Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the research
- PR-0126 (both (widened: round 09 saw it in FFX-2 chapter 5 only)): The advisor card drops its 'in <submenu>' directions whenever the lead suggestion renders at density 5 or 6, in both games and on every phone card (widened from chapter 5)
- PR-0124 (FFX-2 only (chapters 5 and 6, both chained)): FFX-2 chain seams carry MP above its maximum (Rikku 123/106) and silently revert a girl to her starting dressphere
- PR-0123 (both (shared src/ui/common/EnemyIntent.ts, src/battle/ffx2/intent.ts); observed in FFX-2): The enemy-intent headline pairs the rolled move with a different move's odds ("No action LIKELY 88%" above "Attack 88%"), prints "Likely" at 25 percent, and its odds sum to 101
- PR-0099 (ffx2): Chapter 6 borrows chapter 4's cues: the comedy entrance plays under 'The machine under the cathedral' and the Syndicate fight under Bahamut's aeon theme; no cue-map row exists for ch6
- PR-0094 (FFX-2): Chapter 5 chain-seam camera (narrowed): seams 2-4 now settle with the part fully in frame; at the seam into link 5 the camera holds a Shuyin close-up into the first command menu with Yuna and Rikku off-screen and Paine cut at the left edge
- PR-0097 (FFX-2): Bloom washes out the approved Yuna Gunner and White Mage paintings whenever Yuna is the ready girl in FFX-2
- PR-0096 (FFX-2): Chapter 6 pose art (narrowed, disclosed): Leblanc's idle still holds the fan shut, missing Bailey's named pose B; Ormi's attack, cast, hurt and ko show a different shield and costume from his idle
- PR-0092 (FFX-2): Chapter 6's Dr. Goon and Fem-Goon ship as the procedural boss-silhouette placeholder
- PR-0008 (ffx): Chapter 1's own intended strategy still wins only 26 of 40 seeds (carried, STALLED)
- PR-0007 (ffx): Zombie-to-Full-Life kills leave no counter-play window (carried, STALLED; evidence reused)
- PR-0087 (ffx2): Grenade deals 376-423 per enemy (always crit ×2 on base 200), matching neither source's printed figure
- PR-0061 (both): The wait from the scene skip to the first usable command menu is 8.5 to 11.3 s (carried, STALLED)
- PR-0021 (both): The banter bank is still not implemented (carried, re-confirmed on chapter 6)
- PR-0127 (both (shared prep card)): The party-prep CHAPTER card clips its own text: the TIP cut mid-sentence and the thumbnail row cut off at 1280x720 and 1280x960 in every chapter, chapter 6's captions at 1600x900, nearly everything at 390x844
- PR-0098 (both (FFX loses BATTLE HELP; FFX-2 loses ATB SPEED, STRATEGY GUIDE, BATTLE HELP)): On a phone the pause OPTIONS list draws five rows and no scroll cue; ATB SPEED (new), STRATEGY GUIDE and BATTLE HELP are not rendered, yet ArrowDown still selects them and ArrowRight would change a setting the player cannot see
- FOC-06 (FFX (phone card); both (1280x720)): Residue: the FFX advisor card is absent on a phone (an orphan "N HIDE MOVES" chip remains) and sheds 4 of its 12 rows at 1280x720; the 12 px desktop floor is met
- PR-0150 (FFX-2 only): Targeting s3 (FFX-2 single target with the ATB running) is far from its approved tile, and the party is framed out
- PR-0002 (FFX): The FFX command stack hides Yuna in Chapters 1 and 3 (carried)
- PR-0016 (both): The pause CHAPTER tab shows the last member's close-up (Paine), not the chapter's approved hero plate (carried, re-observed)
- PR-0079 (both (the side-choice rule is shared plumbing; observed on an FFX member)): The remade pause draws its meter columns across Kimahri's face, breaking the mirror rule Bailey named
- PR-0031 (both): Target selection lacks two named mustRemain properties, the ground ring under the selected figure and the quiet dim on non-targets (carried, narrowed)
- PR-0005 (both): The approved Turn cut-in is still never shown in play (carried)
- PR-0035 (FFX-2): The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile (carried)
- PR-0128 (FFX only): Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks
- PR-0017 (both): At phone width the party and most enemies are off-screen; in chapter 6 the camera never shows the party through menus or hits (carried, extended)
- PR-0001 (both): At 390x844 the battle HUD is illegible in both games (carried, re-observed)
- PR-0095 (FFX-2): Vegnagun's Bulwark, Redoubt and Node parts render as placeholder silhouettes
- PR-0058 (FFX-2): FFX-2 speakers without a portrait: Nooj opens chapter 5, and Brother speaks three lines in chapter 6 on a text-only card (carried, widened)
- PR-0012 (FFX-2 only): The FFX-2 command menu never says what the highlighted row does (carried, re-observed in the new chapter)
- PR-0010 (both (shared panel)): The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest
- PR-0011 (FFX (FFX-2 already shows it)): The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named
- PR-0018 (FFX (measured); FFX-2 not measured): The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)
- PR-0013 (FFX-2 only): FFX-2 letters a uniquely named enemy, now 'Dr. Goon B' in Chapter 6 (carried, awaiting Bailey)
- PR-0066 (both): The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor
- PR-0067 (both (the hidden group is FFX-2)): At 390x844 the FINAL FANTASY X-2 group sits below an unmarked clip, and every control hint on that screen names a key
- PR-0019 (both (shared help-slab composition); observed in FFX): The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending
- PR-0006 (both (shared advisor plumbing; AGENTS.md rule 14 case: BOTH, and CHK-020)): The move advisor repeats the chapter's own line whatever the board says: it told the player to recast an already-active Shell on all 13 of Yuna's turns, and the guided fight ran 9 minutes without resolving
- PR-0020 (both): The dialogue plate over-scales every portrait, so a speaker delivers the line with the top of the face cut off (merges PR-0056)
- PR-0065 (both): The chapter board paints letter tiles and unpainted cards on arrival; the approved board only appears seconds later
- PR-0063 (FFX-2): The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters
- PR-0057 (both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing)): At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line
- PR-0014 (both): HUD portrait chips crop through heads; the monogram half is repaired
- PR-0015 (FFX-2): Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5
- PR-0022 (FFX (observed); the treatment is shared, so it is expected in both): A KO'd character is the standing billboard rotated about its centre, floating off the ground away from her station
- PR-0060 (FFX only): The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce

## Categories

### combat — 8.4

Build main e9b9bed (deploy-record commit; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty, so the code is round 09's candidate 5ddfde3 and bundle Jw5R1yWQ). The capture owner found the live artifact identical to critic/artifacts/5ddfde3.json (7093e5c3..., 896 files). I opened no browser. I used the pure engines, fresh probes and the unit suite, run in D:/pyrefly-release at 5ddfde3 (src and tests clean against e9b9bed). FULL SUITE: 261 files, 5,807 passed, 2 skipped, exit 0 (critic/rounds/round-10/combat/unit-full.log). Mechanics suites pass: ffx-ctb 34, ffx-statuses 22, ffx-formulas 76, ffx-aeons 9, ffx-overdrive-menu-rows 16, ffx2-chain 12, ffx2-spherechange 22, ffx2-statuses 25, ffx2-formulas 29, ffx2-active-atb 23, ffx2-wait-mode 10+7, ffx2-atb-speed 10, leblanc-engine 26, leblanc-white-wind 12. DATA AUDIT of the newly reachable chapter 6 against research/ffx2-leblanc-syndicate.md: every Act III stat (§3.1-3.3) matches, as do the Act I and II pools (§2: Ormi 1640/Def120/MDef4, 1840/121/8; Logos 1432/Def4/Eva38), the goons' HP and MP (§4.6), immunities (Leblanc STR, DEF and LUCK Down immune; poison 100/40/30), gil, EXP, drops and steal tables. The chateau preset (Lv 20/21/22, Paine >= Rikku >= Yuna, no Dark Knight) matches §7.1-7.2. ATB speed quotients 0.53/0.71 and 0.53/0.42 match ffx2-combat-core §1.2. REAL RUNTIME (CHK-023), from the capture owner's live GPU event logs: Leblanc's turns run Guard, Fan Slap, Thundara, White Wind (Logos down), Guard, Flash Bomb, Fan Slap, Watera, Love Tap on Ormi, and so on. That is §5.3 verbatim. Ormi fires Supercollider on his 4th turn and Concussive Blast below 25 percent. Regen ticks 41, 40 and 29 (3 percent of 1380, 1344 and 989). White Wind heals Leblanc 175 and Ormi 164 and dispels Armor Break. Chain multipliers run x1.45 to x1.80 (§1.7). The Active flip reaches the engine (idle defeat, 0 turns). AGAINST, NEW, established on the engine: FFX-2 Steal and Pilfer Gil are offered as enabled rows, but Steal resolves with no event and no item, and Pilfer Gil deals 0 damage and takes no gil (R10-01). Chapter 6's Rikku starts as a Thief with both rows learned, and Dr. Goon's sensor line reads 'Carries grenades. Steal them.' AGAINST, CARRIED and re-proven on LIVE: Doublecast through the real menu targets Lulu. All 29 real-menu Doublecasts in the two chapter 3 attempts hit her, and she was KO'd 7 and 22 times (PR-0125; the fix c01742b is after this build and is not credited). Also carried: PR-0087 Grenade 376-423 (the chapter 6 real win opens with 5 Grenades), PR-0124 MP above max across chain seams (code unchanged), and a new polish, R10-03: all three girls petrified is not an immediate Game Over. Why 8.4 against round 09's 8.5 on the same code: a further major is now established on a command the new chapter hands the player and tells them to use. Nothing was fixed in between. CHIEF: the gap pass confirmed R10-01 (now PR-0143) on screen with real keys: Steal is silent and inert, and the sensor line telling the player to steal never shows. Score kept at 8.4.

### encounter — 8.8

Seeded engine benches were re-run fresh this round on the build's code (unit-full.log): ch1 26/40 (PR-0008, unchanged), ch2 39/40, ch3 39/40 + verifier 8/8, ch4 40/40, ch5 40/40 chains, ch6 three-act mission 40/40 at D=0 under Wait. Credible mistakes still lose: the Charon line wins 0/15, careless mashing of Act III alone wins 6/12, the lose verifier loses every seed, and out-damaging Yu Yevon wins only the slow way. Round 09's chapter 6 benches (Wait 40/40 and 39/40; boss-first 36/40; Huggles trap 40/40 and 39/40; attack-mash 3/40 and 2/40) are reused with a dependency argument (identical src). Player-chosen Active is still hard at human speed: ch6 wins 9/40 at 1.5 s and 4/40 at 4 s in the suite's own table (PR-0076, polish; Wait is the default under D-029). The approved whole-menu Wait hold differs from §1.5's top-level/submenu split, but it is D-029 follow-up 2 (deferred by Bailey) and is not penalised. REAL INPUT ON LIVE (capture owner): ch6 won through its full flow at 1600x900 and 2000x1012 (64 commands, 0 advisor misses, Logos then Ormi then Leblanc, No Love Lost correctly never armed). A separate ch6 loss after a real-key flip to Active reached results and RETRY. Ch1 won on the retry, ch2 won (two form changes), ch4 won. Ch3 had no win: Doublecast is the established cause and is scored in combat, not repeated here. Ch5 lost all 4 live attempts, but the final attempt's advisor-led route diverged from the card on 62 of 313 picks. 43 of those were 'Darkness' with no menu chip, and the harness fell back to Items or Attack (PR-0126 plus the harness), so the losses are not an encounter-balance finding. Round 09's real-key ch5 win on the same sha is carried, weakly. Still below 9: PR-0008 and PR-0007 are STALLED (a third review at the same severity; a §8 method check is owed). The chapter 6 intended lesson is soft: the Huggles trap still wins 39-40/40. The chapter's own taught item loop (§4.6: steal Dr. Goon's Grenades) cannot be performed because of R10-01 (scored in combat, cross-referenced here). CHIEF: the gap pass then WON chapter 5 on live with real keys on its first attempt (153 turns), confirming that the capture owner's four chapter 5 losses were an advisor-path and harness effect (PR-0126), not an encounter-balance finding. Chapter 3 now has seven advisor-following real-key defeats on live; the cause is not established (PR-0125 and PR-0126 suspected), so it is not scored twice here. Score kept at 8.8.

### visual — 7.5

Deep review round 10 of the LIVE build main 5ddfde3 (e9b9bed only records the deploy), bundle assets/index-Jw5R1yWQ.js, artifact 7093e5c3171d8cb8a1120bb75ca4be9b82710eb71f9a2722d344ca24d1436cd3 (896 files). Judged only from the capture owner's evidence, critic/rounds/round-10/evidence: PYREFLY_BROWSER=gpu, headless Chromium through Playwright, real keys, 1600x900, 2000x1012 and 390x844. I opened no browser. I read 34 target-versus-build composites (critic/rounds/round-10/targets/*.jpg) and 12 contact sheets and crops (critic/rounds/round-10/visual/). PROTECTION PASS: all 115 approved files in the live manifest are byte-identical and decode (critic/rounds/round-10/targets/hashcheck-live.json). GOOD: chapter 6 renders as a finished-looking room. The backdrop has the named magenta and cyan, the door and the heart panel. The Syndicate stands at party scale and faces across the field in all three links at 1600x900 and 2000x1012. Chapter 6's results, chapter card and FFX-2 portraits are clean. Chapters 1 to 3 backdrops, dialogue, battle-start banner, results and FFX pause close-ups match their tiles. In chapter 3, Braska's Final Aeon and both Yu Pagodas are visible. AGAINST, re-observed on live: in FFX-2 the intent card is drawn over the pause close-ups in chapters 4 and 6, including the H state and the phone (PR-0122). Bloom whites out Yuna's Gunner and White Mage paintings in chapters 4 to 6 (PR-0097). Bahamut has glowing matte holes (PR-0137). The goons are black hooded cones (PR-0092). Leblanc's idle holds the fan shut (PR-0096). Vegnagun's Bulwark, Redoubt and Node parts are cones (PR-0095). The FFX command stack covers Yuna in chapters 1 and 3 (PR-0002). The FFX-2 field is mirrored (PR-0035). No turn cut-in is shown (PR-0005). Targeting has no ground ring or dim (PR-0031). A KO'd Yuna floats as a rotated billboard (PR-0022). On a phone chapter 6 never shows the party (PR-0017). The hero plates are never shown (PR-0016). The chapter 5 tail tip sits on Rikku's arm, and Paine stands in the barrel (PR-0015, PR-0072). NEWLY ESTABLISHED on this build: (a) at Bailey's 2000x1012 the FFX-2 battle scene is a centred 16:9 box, leaving hard-edged dark 100 px strips at x<100 and x>1900 in chapters 4 and 6. It is also present in round 05 and 08 captures, so it is long-standing (R10-VIS-01, same root as PR-0135). (b) At chapter 5 link 3 the camera sometimes settles with Yuna half off the left edge (1 of 2 live arrivals). At link 4 the Redoubt cannon sits under the guide card and HP bars. This widens PR-0094. (c) On a cold first launch, 4 of 12 briefings showed no Auron painting at capture time, 1 more lacked the backdrop, and the chapter card and prep showed Y / W / L / R letter tiles on arrival. This widens PR-0065. Nothing visual changed since round 09 scored this same sha at 7.6. The 0.1 drop reflects defects newly established on the same code, not a regression. Anchor 7: functional with conspicuous weaknesses. Provisional: no 1280x720, 1440p, 4K or 4:3 capture this round, and no FFX chapter at 2000x1012. CHIEF: gap pass adds fresh live captures of PR-0016 (both games), PR-0079 and PR-0128, establishes the cause of PR-0005 (showTurnCutIn has no caller), turns Targeting s3 from UNVERIFIED into a FAIL (PR-0150), shows the 16:9 box is FFX-2 only, adds 1024x768, 1280x720, 2560x1440, 2560x1080, 1280x960 and 3840x2160 captures, and does NOT reproduce the cold-launch fallbacks in serial runs (PR-0065 widening withdrawn). Score kept at 7.5.

### feel — 7.9

Deep review round 10, LIVE build main 5ddfde3 (review HEAD e9b9bed is a deploy record only), bundle assets/index-Jw5R1yWQ.js, live artifact 7093e5c3. I judged it only from the capture owner's evidence in critic/rounds/round-10/evidence: PYREFLY_BROWSER=gpu, headless Chromium, real keyboard, no fallback. I opened no browser. I read contact sheets of 19 timed sequences (frames every 180 to 350 ms, with timestamps from index.jsonl). They are in critic/rounds/round-10/feel-narrative-scratch/.

IDENTITY: the live manifest matches the round-09 candidate manifest (critic/rounds/round-09/evidence/5ddfde3/build/artifact-manifest-dist-gate.json) except for one file, .nojekyll (896 vs 895 files). So this is the same code that round 09 scored 7.9.

CONFIRMED ON LIVE:
(1) Action and reaction read well in both games. In chapter 6 (seq-action-playing), 548 / 618 / 384 land with CHAIN 1 x1.45 and CHAIN 2 x1.50 inside about 1.0 s, then the intent panel moves on to Concussive Blast by 1.74 s. In chapter 1 (a2-seq-action-playing), 2000 lands on Seymour at 53 ms and the next menu is up by 751 ms.
(2) The spherechange lands fast in chapter 6: the light pillar is up at 46 ms, and Rikku stands as a White Mage with her name plate by about 0.6 s.
(3) Chain seams in chapters 6 and 5 push from a wide shot to the party inside about 0.75 s and show a name caption. The first menu after every seam frames the party and the incoming enemies.
(4) Skip and replay respect the player. One Enter hold skipped the pre-battle scene in all 11 runs, and Esc over a scene opened the pause in every run. RETRY reaches prep in about 3.1 s and prep reaches the battle in 1.7 to 1.8 s (ch1, ch3, ch5, ch6), without replaying the scene. Results to chapter select, with the epilogue hold-skipped, takes about 7.1 s in ch1, ch2, ch4 and ch6.
(5) Target cancel returns to the 4-row menu without pausing (ch6 afterTargetCancel).

COSTS:
(a) PR-0061 (major) is re-observed. The play clock at the first menu that accepts input is polled, so it is an upper bound: ch1 8.6 and 10.2 s, ch2 7.3, ch3 6.9, ch4 8.1, ch5 9.6 and 10.9, ch6 9.5, 9.6, 9.9 and 11.6 s. Chapter 6 still plays two enemy actions before Yuna's first menu. That is in the same band as round 09 (6.5 to 9.2 s, by a different probe), so it is not called a regression.
(b) PR-0104 is re-observed on live. In ch6 seq-party-action, Yuna is in her Grenade throw pose at 41 ms and the next girl's menu is up by 755 ms. Through 2.15 s no number lands and no enemy bar moves.
(c) NEW polish R10-FN-01: the enemy-intent panel, visible since PR-0090, appears before the intro sweep ends. In ch6 seq-transition-into-battle f06 (1.86 s), Dr. Goon's 'Strike · SCRIPTED' panel is drawn over the fading Ormi title card. In ch4 f04 (1.28 s), a 'Curse' panel is up on a dark stage before the boss caption.
(d) Cross-referenced, scored in visual: PR-0094. The chapter 5 seam-4 push crops the Head out of frame by 1.5 s. The first menu afterwards reframes it correctly (a3-24-seam-4-first-menu.png).

REUSED with a dependency argument: frame pacing from round 09's gap pass on 5ddfde3 (720 frames, p99 16.8 ms). The artifact is identical, and no presenter or renderer file changed.

Why 7.9 holds: nothing in feel changed between round 09 and this build, and every round-09 observation reproduces on live. The only new item is a small intro overlap. Bailey's hands-on check (CHK-B2) is still not collected. Stagnation: feel has now stayed at 7.9 across two reviews, and PR-0061 is STALLED. RUBRIC section 8 applies: the next feel batch starts with a method check. CHIEF: the gap pass re-measured PR-0061 serially at 8.5 to 11.3 s (hold-release to first usable menu), in round 09's band on the same code. Score kept at 7.9; STALLED (two reviews without a gain), so the next feel batch starts with a RUBRIC §8 method check.

### narrative — 7.7

Chapter 6 (FFX-2 only) story is src/story/scripts/ffx2-leblanc.ts at 5ddfde3. I read it against research/ffx2-leblanc-syndicate.md sections 2 and 9.1 to 9.4 and research/writing-bible.md. The story code is unchanged: git diff 5ddfde3..HEAD for src/story, CutsceneScreen.ts and DialogueBox.ts is empty. I ran tests/unit/story-ffx2-leblanc.test.ts, story-scripts and story-triggers today: 3 files, 120/120 passed, including the FFX-absence test.

SEEN ON LIVE in round 10:
- Pre-scene lines 1 to 4 of chapter 6 in all four ch6 runs. The rest was hold-skipped by design.
- Act III beats in the real-key battle log: first-not-so-mighty-guard (seq 18), logos-down (seq 170), ormi-down (seq 1835). The kill order was Logos, then Ormi, then Leblanc in both wins.
- The victory quip 'We got it back.', then after CONFIRM the epilogue opening 'That's for robbing our airship!', then chapter select. The clear survives a reload.
- The aftermath opening lines in chapters 1, 2 and 4: Seymour 'You can't send what…', Yunalesca 'There. Now no one can summon it.', and Rikku '...Yunie.' after the suppressed-victory 'Results' heading in chapter 4.

REUSED with a dependency argument, labelled carried: round 09's gap pass on 5ddfde3 read chapter 6 line by line on the identical artifact (only .nojekyll differs). It covered all 30+ pre-scene lines (massage, Brother blowing the cover), the act-one-cleared seam (Paine's 'Turn it off.') and the act-two-cleared seam, and all 32 epilogue lines (beat 14 Vegnagun reveal, beat 15 truce).

FOR: the script follows beats 3 to 15 in order. The farce is played straight and stops for beat 14. Leblanc's pet / dearie / lamb keeps the last word and she is never pathetic. Logos is dry and Ormi is aggrieved. There is exactly one sincere exchange, the lines are original, and the tone is right for FFX-2 as opposed to FFX.

AGAINST (all carried except two):
- PR-0133 is re-observed on live: the victory pose plays over an empty Chateau room (30-post-scene.png).
- PR-0021 (major, STALLED): prep and results carry only fixed quips.
- PR-0102: '*better*' prints its asterisks.
- PR-0103: not exercised again.
- PR-0134 is re-observed and widened: the chapter-VI title card also names 'Ormi'.
- PR-0037 is carried.
- NEW polish R10-FN-02: all three acts play in one painted room, and the seam ends '...Okay. Next room.' in that same room.
- NEW suggestion R10-FN-03: chapter VI is canonically the prequel to chapter IV's alliance.

Not reached on live: the chapter 3 and chapter 5 aftermaths (no real-key win). Chapter 5 is carried from round 09's 5ddfde3 win, which is a weak reuse because PR-0126 is open. Chapter 3's aftermath has never been reached with real input.

Cross-referenced, scored elsewhere: PR-0116 'Five fights' with six playable chapters (onboarding), PR-0058 Brother has no portrait (visual), PR-0099 borrowed cues (audio).

Score 7.7, unchanged: same story code, the same defects re-observed, and no gain. Bailey's voice judgement (CHK-B3) is still not collected. CHIEF: the gap pass read the chapter 5 aftermath on live line by line after a real-key win (Shuyin/Lenne, results, the Farplane coda) and confirmed PR-0103 with real keys (Ormi-first order). Score kept at 7.7; STALLED (PR-0021).

### audio — UNVERIFIED (no number)

No score. No agent can hear, and I did not listen to anything; every result below comes from reading data. The listening half has no numeric owner verdict for this mix. docs/audio/OWNER-VERDICT.md holds only 'Right direction, keep refining' (2026-09-19, explicitly not a number). docs/target/decisions.json D-026 (adopted 2026-09-21) records a NEGATIVE verdict on the same shipped cues: 'music is too reminsicent of snes music instead of the more modern final fantasy titles and clair obscur. all of these next to be fixed very next build.' On 2026-09-22 Bailey said about the audio score: '3. I'm at work so can't grade that yet' (NOW.md). So the category stays UNVERIFIED (RUBRIC §6, CHK-B1). TECHNICAL AND ROUTING HALF, on the LIVE build (main 5ddfde3, bundle Jw5R1yWQ, artifact 7093e5c3). (1) Bytes: I fetched all 21 music MP3s and the SFX sprite from the live URL with curl. Each returned 200 audio/mp3 and is byte-identical (sha256) to public/audio. Across the live artifact manifest, 68 of 70 audio entries hash-match locally. The other 2 are JSON files that differ only by CRLF line endings, proven by re-hashing with CRLF. The manifest says decodeChecked with problems []. (2) qa.mjs --strict: all 21 cues measure -15.97 to -16.20 LUFS integrated and -1.06 to -2.86 dBTP true peak, with 0 clipped samples and every loop seam ok. The SFX sprite has 134 cues, peak -1.13 dBTP. Per-cue findings 0, SFX findings 0. The tool still exits 1, on the 47 orphan audition files (PR-0100, which is live and publicly served). (3) My own ffmpeg ebur128 cross-check agrees: -15.8 to -16.1 LUFS, -1.1 to -2.9 dBTP. (4) themes-audit: 3 of 21 cues depart from the bible (PR-0039, carried). (5) Routing, from the capture owner's 12 real-input GPU runs on live: 93 audioDebug samples. Every one shows the prerendered manifest (21 cues) with the sprite decoded, so no synth fallback. Every battle-first-menu sample holds the right boss cue at gain 1: boss-seymour, boss-yunalesca, boss-jecht, boss-ffx2-aeon for ch4 and ch6, boss-vegnagun. Every pre-scene sample has the authored cue, or the authored silence in ch1. The chain seams at +0, +1.5 and +3 s hold gain 1 in ch5 (seams 2 to 4, two attempts) and ch6 (seams 2 and 3, two sizes). Victory cues are at gain 1 on results for ch1, ch2 and ch6. Ch4 has no fanfare by design. Stopped cues are gone by results. PR-0089 is FIXED on live. The FFX chapters request only FFX cues and the FFX-2 chapters only FFX-2 cues. (6) Weak points: chapter 6 borrows chapter 4's cues (PR-0099); an open owner verdict asks for the whole score to be re-rendered (D-026); PR-0129's false start is carried because ch5 link 5 was not reached on live this round; boss-yu-yevon, ending-ffx and ending-ffx2 were not reached on live. Evidence: D:/Final Fantasy/critic/rounds/round-10/audio/{qa.txt,qa.json,themes-audit.txt,ffmpeg-ebur128.txt,live-audio-check.txt,slots-live.txt,vitest-audio.txt}; D:/Final Fantasy/critic/rounds/round-10/evidence/*/run.json (audio[]) and network-media.json. CHIEF: the gap pass added live measurements (title cue under the briefing in 6 of 6 serial runs, pause in/out in both games, volumes surviving reload, PR-0129 unchanged at the chapter 5 link 5 seam, ending-ffx2 as scripted). The category stays UNVERIFIED with no number: no agent can hear, Bailey has not listened to this mix, and his latest verdict on these exact cues is negative (D-026, PR-0148).

### interface — 7.0

Deep review round 10 of the LIVE build: main 5ddfde3 (review HEAD e9b9bed only adds the deploy record), bundle assets/index-Jw5R1yWQ.js, artifact 7093e5c3 (896 files). I judged it only from the capture owner's evidence in critic/rounds/round-10/evidence/ (index.json, 445 items). Browser mode was gpu (PYREFLY_BROWSER=gpu, headless Chromium, no fallback needed). Input was real keys plus one mouse path. I opened no browser. Sizes captured this round: 1600x900, 2000x1012 and 390x844. The 4:3 and 21:9 layout evidence, the hi-res text sizes, the 1280x720 advisor evidence and the TALK contrast measurement are REUSED from round 09 (critic/rounds/round-09/evidence/5ddfde3 and gaps/). Dependency argument: the same main sha and the same bundle hash, and the artifact differs only by its manifest file; the reuse covers layout and contrast only, never the advisor path, because PR-0126 is open. No 4K, 1440p or 1280x720 capture was taken on live (see capturesNeeded).

GAINS confirmed on live (all were already credited in round 09, so none is new): PR-0090, the enemy-intent panel renders in both games and separates SCRIPTED from weighted moves and 'IF YOU ATTACK' conditionals (seymour-flux-win-r2/12-intent-E.png; ffx2-leblanc-win-1600/11-advisor.png; ffx2-vegnagun-shuyin-win-r2/24-seam-4-first-menu.png 'No action SCRIPTED'). PR-0091, the advisor card overlaps the party rows by 0 px at every chain seam: ch6 links 2-3 at 1600x900 and 2000x1012, ch6 link 2 at 390x844, ch5 links 2-4 on three attempts (run.json seamCard). Target cancel leaves 0 reticles in every run (afterTargetCancel). The FFX-2 single-target cue is strong: ring, lettered plate, dimmed party and the 'WAIT — ATB HELD' chip (ffx2-leblanc-win-1600/16-target-single.png). The advisor's menu path holds with real keys in ch1, ch2, ch4 and ch6 on desktop (ch6 63/63 and ch4 57/57 decisions with no miss). The ch4 route no longer repeats Shell (Yuna's picks vary; won in 57 commands).

AGAINST, re-observed on live: PR-0122 (MAJOR, a regression against release 08, now public). The intent card paints over the pause in FFX-2: over Yuna's eye on the member tab, over THIS ENCOUNTER and the settings values in OPTIONS, and over Paine's close-up after H (ffx2-leblanc-win-1600/14-pause-Esc.png, 14-pause-options.png, 14h-pause-H.png, ffx2-leblanc-lose/15-options-active.png). On the phone it covers the X-2 BATTLE value. In FFX an 'E ENEMY MOVE' chip shows through the pause. Also re-observed: PR-0123 ('Blizzard LIKELY 25%'); PR-0010 (the intent ODDS list is cut after its first row, and the FFX counter bullets stop at 'Reflect and'); PR-0011 (Lance of Atrophy with no Zombie); PR-0012 (no FFX-2 help line); PR-0013 ('Dr. Goon B'); PR-0127 (ch6 prep captions cut at 1600x900 and an unreadable card on the phone); FOC-06 (FFX phone card absent, orphan N chip); PR-0001, PR-0066, PR-0067 and PR-0113 (phone HUD and board); PR-0118 (the scene dialogue card and colliding headers over the pause); PR-0074 (broken advisor English); PR-0110, PR-0111, PR-0115 and PR-0130. The advisor sits at 12.2 px effective at every size: that meets FOC-06's 12 px and misses CHK-003's 14 px.

NEW this round: R10-INT-01 (MAJOR, FFX). After the player clicks the PAUSE chip and resumes with Esc, keyboard focus stays on the chip, so every later Enter on the command menu opens the pause again. Reproduced in two FFX runs; the keyboard-only control and FFX-2 ch6 do not leak (pause-matrix/seymour-flux-chip-focus.json, seymour-flux.json, seymour-flux-anim-nochip.json, ffx2-leblanc.json). PR-0126 is WIDER than round 09 said and now traced. The card drops its 'in <submenu>' chip whenever the lead suggestion renders at density 5 or 6 (MoveAdvisor.ts:581 and 591). Counts: ch3 FFX attempt 2 lost it on 31 of 309 decisions (Curaga x18, Doublecast, X-Potion, Al Bhed Potion); ch5 on 17 of 58 and 60 of 312; the phone on every card (ch6 8/11, ch1 4/11).

SCORE 7.1 (round 09 gave the same code 7.3). There is no code change since round 09, so there is no gain to credit. The drop records one additional major on the live build (R10-INT-01) and the wider reach of PR-0126 into FFX; the carried majors are unchanged. A gain for this category means a closed interface major with no new major opened. The anchor is 7: functional, with conspicuous weaknesses. CHIEF ADJUSTMENT 7.1 -> 7.0: two interface defects established this round were not in the interface auditor's score: PR-0144 (chapter 6's guide gives the dead Logos's evasion as the reason to attack Ormi, confirmed on screen with real keys, and hides the reason at the default fit) and PR-0126's reach into FFX chapter 3 captured on live. PR-0151 (OPTIONS ellipses at 1280x960) is polish. PR-0144 sits in a brand-new feature and PR-0126 was already open, so the adjustment is one tenth, not more.

### onboarding — 6.5

Newcomer walkthrough: SIMULATED, not real. Playwright used real keys on fresh profiles (seed 1) and followed the advisor, so it was not a cold start from the visible instructions alone. Touch, pointer (apart from the PAUSE chip click), gamepad and a real phone were not exercised. Sizes: 1600x900, 2000x1012 and 390x844, gpu mode.

HOLDS on live: Auron's briefing has the mode-aware Wait line 'In hers, the clock holds while you choose.' in every run at 1600x900, 2000x1012 and on the phone (run.json briefingText; ffx2-leblanc-win-1600/01-briefing.png). The line is inferred and awaits Bailey's verdict. The FFX-2 first-turn badge reads 'MENU'S UP · GAUGES HOLDING' (ffx2-leblanc-win-1600/10-first-menu-coach.png). X-2 BATTLE flips to ACTIVE with real keys (ffx2-leblanc-lose/15-options-active.png; settingsAfterFlip ffx2Atb active, ffx2AtbMigrated true). OPTIONS carries TEXT SPEED, X-2 BATTLE, ATB SPEED, STRATEGY GUIDE and BATTLE HELP at desktop sizes. REPLAY BRIEFING is reachable from the pause.

AGAINST, all carried and unchanged, because it is the same code as round 09: PR-0098 (major). On the phone, OPTIONS draws five rows with no scroll cue. In FFX-2 ATB SPEED, STRATEGY GUIDE and BATTLE HELP are not drawn; in FFX BATTLE HELP is not drawn. The intent card also covers the X-2 BATTLE value (ffx2-leblanc-win-look-phone/14-pause-options.png, seymour-flux-win-look-phone/14-pause-options.png). PR-0110: the advisor's N chip overprints Rikku's first coach line at 1600x900. PR-0032: there is no text-size, key-remapping, reduce-motion or flash row; reduceMotion and lowEffects exist in the save (settingsAfterFlip) with no row. PR-0033: the defeat card says nothing about why the party fell (ffx2-leblanc-lose/31-results.png). PR-0116: the briefing says 'Five fights.' with six playable chapters, awaiting Bailey. PR-0073: every phone briefing, board and scene hint names a key.

UNVERIFIED parts: the Active-mode branch of the first-turn badge (87b6277) and the Active mode chip after a mid-fight flip. The harness read the chip while the pause was still open, so its 'WAIT — ATB HELD' reading is not evidence of a defect.

SCORE 6.5, unchanged from round 09: the same code, and the same accessibility and phone-reach gaps. A gain here would be a closed onboarding major (PR-0098) or a new accommodation row.

### prep — 8.4

Prep/delivery auditor, round 10 deep review of the LIVE build (main 5ddfde3, deploy record e9b9bed, bundle Jw5R1yWQ, artifact 7093e5c3…). I opened no browser. I worked from critic/rounds/round-10/evidence/ (capture owner: PYREFLY_BROWSER=gpu, headless Chromium through Playwright, real keyboard, fresh profiles, seed 1). FOR: (1) Party prep was entered, tabbed with ArrowRight and left with Esc back to chapter select in all 13 live runs, in all six playable chapters (run.json prepEsc='chapter-select'). Chapter 6 prep carries three objectives, a tip and the DRESSPHERES card: Gunner 2/16 learned, 10 AP banked, next Potshot 20 AP, the Hour of Need grid, 8 other dresspheres owned (ffx2-leblanc-win-1600/04b-prep-next.png). (2) The chapter 6 victory rewards match research/ffx2-leblanc-syndicate.md §6.3 row for row: EXP 900 (380+260+260), AP 6, Gil 780, and drops Reassembled Sphere, Charm Bangle and Twist Headband. AP moves the same way in every run: Potshot 10/20 before the fight and on the defeat card, 16/20 after the win (ffx2-leblanc-win-1600/31-results.png; ffx2-leblanc-lose/31-results.png; identical at 2000x1012). Chapters 1, 2 and 4 show plausible victory spoils on live: ch1 AP 10,000, Gil 6,000, Lv 4 Key Sphere; ch2 AP 14,000, Gil 9,000; ch4 EXP 1,300, AP 15, Gil 1,000, Gris Gris Bag. (3) Retry works and counts attempts. RETRY went Defeat → results → party prep → battle in all 7 defeat routes on live: ch1 ×1, ch3 ×2, ch5 ×4 (one run with 3 attempts) and ch6 ×1. ATTEMPTS reads 2 in ch3 and 3 in ch5. RETRY reached prep inside the harness's fixed 3.0 s wait and the battle about 1.7 s after Enter. Retry to the first command took 9.8 to 15.1 s by harness clock, including a snapshot. That is the carried battle-entry wait (PR-0061 in feel, PR-0084 in delivery), cross-referenced here and not scored again. (4) Progress is reliable on live: after a real-input win, the clear survives a reload in ch1, ch2, ch4 and ch6 at 1600x900 and 2000x1012 (boardAfterReload.cleared), and NEW BEST shows on first clears. AGAINST: PR-0109 carried and re-observed: cardAfterBack='seymour-flux' in all 13 runs, so chapter select forgets the chosen chapter. PR-0138 carried: chapter 5's reward screen after a win was not re-read on live, because there was no live win this round. Chapter 3's victory rewards remain unread (PR-0082). The prep-card clipping (PR-0127) is scored in interface, and the defect that lets a loss screen give no reason (PR-0033) is scored in onboarding. Unapproved meta-systems cost nothing. The evidence is unchanged from round 09 on the same sha, and the live runs confirm it, so the score holds at 8.4. CHIEF: chapter 5 now has a live real-key win through results (gap pass); its results spoils were not re-read (PR-0138 carried). Score kept at 8.4.

### delivery — 8.0

Prep/delivery auditor, LIVE 5ddfde3 / Jw5R1yWQ / artifact 7093e5c3…. FOR: (1) CHK-017 exact artifact PASS. I ran it myself: 'node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/5ddfde3.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/1b33971.json' returned PASS, liveManifest 'match', 166 files checked (the files changed since release 08 plus a 40-file sample), 0 mismatched, 0 missing, 0 wrongType, 0 errors (critic/rounds/round-10/prep-delivery-scratch/verify-live-5ddfde3.json). The live index.html serves assets/index-Jw5R1yWQ.js (curl, 200 text/html in 0.30 s). The capture owner's copy of the live artifact-manifest.json equals critic/artifacts/5ddfde3.json: 896 files, 479,573,232 bytes, the same hash. (2) CHK-019: decodeChecked true, problems [], audioUnverified 0; 406 png, 22 webp, 46 ogg and 22 mp3 all decode 'ok', and the image check rejects a flat or blank frame. (3) Console and network: 0 console errors, 0 responses >= 400 and 0 images served as text/html in 12 of 13 live runs. The one exception is a transient 503 on art/characters/braskas-final-aeon-1/hurt.json at minute ~40 of the ch3 run. It is in the manifest (2,113 bytes), and my curl re-fetch returned 200 application/json, 2,113 bytes, so it was a GitHub Pages hiccup. No player-visible effect was captured (see the suggestion on sidecar retry). (4) Complete flows with real keys on live: wins through post-scene, results, CONFIRM, epilogue, chapter select and reload in ch1 (second attempt), ch2, ch4 (2000x1012) and ch6 (1600x900 and 2000x1012). Loss → RETRY → prep → battle works in ch1, ch3, ch5 and ch6, with the ch6 loss under a real-key flip to ACTIVE. The ch5 win route is reused from round 09 on the same sha (see CHK-022). The ch3 win route has never been observed (PR-0082). (5) Save data (save-data class): src/app/SaveData.ts and saveFfx2Atb.ts are byte-identical between 5ddfde3 and main HEAD c01742b. The migration and settings unit tests pass (save-ffx2-atb-migration 8/8, save-coach-migration 7/7, save-data-best-time-migration 5/5, pause-atb-mode 9/9, pause-atb-speed 7/7; run by me, vitest 5.0.1). Round 09's upgrade proxy is reused: a real release-08 save migrated to Wait with its progress kept, a real-key ACTIVE choice survived two reloads, mid-battle and results reloads were correct, and malformed storage never threw. Clears survive reload on live in four chapters. AGAINST: the same-origin upgrade on Pages (the round-09 'before' profile opened on live) was never run, so that half of CHK-024 stays UNVERIFIED. Load time was not measured on the live network this round. Round 09's candidate numbers on the same bytes (RTX 5070 Ti, ANGLE D3D11, Chromium) put card-to-first-menu at 10.1 s cold and 9.7 s warm unthrottled, and 20.5 s at 50 Mbps, with about 93 MB fetched before the first command, against the 5 s goal (PR-0084 carried; the measure includes held scene skips). Frame time was 60 fps, p99 16.8 ms, but only over 6 s idle at the first menu, and no frame times were captured during actions. PR-0100 is confirmed in the live manifest: 47 audition candidates, 27,481,452 bytes, under audio/candidates (scored in audio). Only headless Chromium ran. Firefox, Edge, Safari, a real phone, touch and a controller are UNVERIFIED. The release is better delivered than release 08 (a production build that builds, PR-0101 fixed, a new chapter shipped clean). The open gaps match round 09's, so the score holds at 8.0. CHIEF: the gap pass added a live chapter 5 win and chapter 2 and 4 loss routes, so every chapter except chapter 3 now completes its real flow on live. Score kept at 8.0; STALLED (two reviews without a gain).

## Target gate

required 31 / matched 19 / failing 12 / unverified 0 / waiting 5. The visual auditor counted required 31 / matched 19 / failing 11 / unverified 1 / waiting 5; its unverified tile was Targeting s3, which the gap pass captured on live and which FAILS (PR-0150). Failing tiles map to PR-0002 (Battle HUD FFX), PR-0035 (Battle HUD FFX-2), PR-0005 (Turn cut-in), PR-0031 (Targeting s2), PR-0150 (Targeting s3), PR-0016 (hero plates), PR-0079 and PR-0122 (the Until Dawn pause and Panels hidden (H)), PR-0096 (the Leblanc Syndicate), PR-0097 (Yuna's approved FFX-2 paintings under bloom), PR-0128 (Swordplay). Mapping by issue, not by tile name. Waiting: the five tiles listed as waiting in targets.json. Composites: critic/rounds/round-10/targets/. Approved art: 115 of 115 approved files byte-identical in the live manifest and decode (critic/rounds/round-10/targets/hashcheck-live.json).

## Encounters

- **seymour-flux** — real flow complete: True. victory on the retry (attempt 1 defeat, then RETRY, prep, battle, win); separate 1600x900 run lost and retried.
- **yunalesca** — real flow complete: True. victory.
- **braskas-final-aeon** — real flow complete: False. defeat in all seven advisor-following real-key attempts on live (capture owner 2, confirmer 1, gap pass 4); every loss reached results, RETRY, prep and battle.
- **ffx2-bahamut** — real flow complete: True. victory.
- **ffx2-vegnagun-shuyin** — real flow complete: True. victory with real keys on live (gap pass, attempt 1, seed 1, 153 turns, 24:02); plus 4 capture-owner defeats and a confirmer timeout, all reaching results or RETRY.
- **ffx2-leblanc** — real flow complete: True. victory at 1600x900 and at 2000x1012 (both 64 commands, 9:00 in-game); defeat plus RETRY at 1600x900.

## Checks

| Check | Chapter / state | Result | Mandatory |
|---|---|---|---|
| CHK-001 | all six chapters: pre-scene, first menu, seams, results, pause | FAIL | yes |
| CHK-002 | pause over battle (member tab, OPTIONS, after H) and pause over the pr | FAIL | yes |
| CHK-003 | command menu with the advisor card, every captured size | FAIL | yes |
| CHK-004 | every advisor decision on every real-key route | FAIL | yes |
| CHK-005 | degenerate boards met during real play; ch1 and ch3 | FAIL | yes |
| CHK-006 | target cancel, E toggle, pause over battle and over a scene | FAIL | yes |
| CHK-007 | advisor card, intent panel and guide text dumps, all chapters | FAIL | yes |
| CHK-009 | prep CHAPTER card, pause OPTIONS, phone board | FAIL | yes |
| CHK-020 | command menu, intent panel and pause chip in both games | FAIL | yes |
| CHK-008 | HUD panels against painted actors and pause close-ups, chapters 1-6 | FAIL | yes |
| CHK-010 | target selection, chapters 3, 5, 6 | FAIL | yes |
| CHK-011 | default framing per link: chapter 3 formation, chapter 5 links 1-4, ch | FAIL | yes |
| CHK-012 | roster art, portrait chips, speaker cards, first-launch screens, chapt | FAIL | yes |
| CHK-013 | approved art protection plus in-game rendering, chapters 1-6, battle,  | FAIL | yes |
| CHK-014 | staged boards in chapters 1-6: facing, scale, ground contact | FAIL | yes |
| CHK-015 | command menu, submenu, targeting, action animation, cutscene, pause, p | FAIL | yes |
| CHK-016 | every capture | PASS | yes |
| CHK-017 | the exact live artifact | PASS | yes |
| CHK-018 | source at 5ddfde3 and the 13 live runs | PASS | yes |
| CHK-019 | every shipped media file | PASS | yes |
| CHK-021 | all product commits 1b33971..e9b9bed (no src change 5ddfde3..e9b9bed) | FAIL | yes |
| CHK-022 | seymour-flux | PASS | yes |
| CHK-022 | yunalesca | PASS | yes |
| CHK-022 | braskas-final-aeon | UNVERIFIED | yes |
| CHK-022 | ffx2-bahamut | PASS | yes |
| CHK-022 | ffx2-vegnagun-shuyin | PASS | yes |
| CHK-022 | ffx2-leblanc | PASS | yes |
| CHK-023 | ffx: braskas-final-aeon, Lulu's turn, Special > Doublecast; ffx2: ffx2 | FAIL | yes |
| CHK-024 | save data and settings across an upgrade | UNVERIFIED | yes |
| CHK-B1 | the whole shipped score | UNVERIFIED | yes |
| CHK-B2 | owner's hands-on feel check of the live build | UNVERIFIED | no |
| CHK-B3 | owner's judgement of chapter 6 voice and pacing | UNVERIFIED | no |

Full reasons and evidence for every check are in round-10.json.

## Coverage matrix

**Tested**

- Identity: CHK-017 verify-live PASS (166 files) against critic/artifacts/5ddfde3.json; live manifest 7093e5c3 = recorded; 115 approved art hashes; full unit suite on the build's code (261 files, 5,807 passed, 2 skipped).
- All six included chapters from the title with real keys on fresh live profiles (13 capture routes, 445 asserted captures, gpu): wins in chapters 1, 2, 4, 5 (gap pass) and 6 through post scene, results, epilogue, chapter select and reload; loss plus RETRY in chapters 1, 2, 3, 4, 5 and 6; chapter 3 seven real-key defeats.
- Independent confirmation of the top issues: the pause overlay (Claude Browser pane), the FFX chip-focus leak (Playwright), chapter 3 and 5 routes, the Steal and guide probes.
- Combat: engine probes (Steal, guide hints, petrify), fresh seeded benches ch1-ch6, a data audit of chapter 6 against research, the live real-input event logs.
- Interface and onboarding: the pause matrix (Esc, P, chip, submenu, targeting, animation, cutscene) in both games; advisor paths over ~700 real-key decisions; target cancel; phone OPTIONS; captures at 1024x768, 1280x720, 1280x960, 2560x1080, 2560x1440 and 3840x2160.
- Feel: 19 timed sequences plus serial hold-release-to-first-menu frames in all six chapters; narrative: chapter 6 beats with 100 ms frames, Ormi-first order with real keys, the chapter 5 aftermath line by line.
- Audio: bytes, decode, qa.mjs, ebur128, themes-audit, audioDebug routing in real-input runs, pause cue, volumes across reload, the title cue in six serial cold runs, PR-0129 on the chapter 5 win.
- Targets: 34 composites against the approved tiles plus 12 contact sheets; Targeting s3 captured.

**Reused, with the reason**

- Round 09's CHK-024 upgrade proxy (a real release-08 save migrated to Wait with progress kept; Active sticking across reloads; mid-battle and results reloads; malformed storage) — from critic/rounds/round-09/evidence/gaps/chk024/, critic/rounds/round-09/gaps/reload.log — Same sha 5ddfde3; SaveData.ts and saveFfx2Atb.ts byte-identical; the migration unit tests were re-run and pass. The same-origin AFTER half on Pages is NOT covered by it and stays UNVERIFIED.
- Chapter 6 benches, Grenade / damage / White Wind / Doublecast probes — from critic/rounds/round-09/combat-5ddfde3/ — git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty and the live manifest equals the recorded 5ddfde3 manifest; Doublecast and Grenade stay open and were re-observed in live logs.
- PR-0007 Zombie window numbers — from critic/rounds/round-08.json — The Seymour Flux AI, status, CTB and data files are unchanged since round 08.
- Targeting s1 capture — from critic/rounds/round-09/evidence/gaps/targets/ch3-hastega-target.png — Same sha and bundle; TargetCursor.ts unchanged since e119552; the open PR-0031 concerns s2, not s1.
- Chapter 6 pre-scene, seams and epilogue read line by line; frame pacing (720 frames, p99 16.8 ms) — from critic/rounds/round-09/evidence/gaps/ffx2-leblanc-flow5dd-1600x900 and the round-09 gap pass — Identical artifact apart from .nojekyll; story, scene runner, presenter and renderer unchanged; no open defect on the scene runner.
- 4:3 and 21:9 layout, hi-res text sizes, TALK contrast, phone OPTIONS 0x0 rows — from critic/rounds/round-09/evidence/5ddfde3 and gaps/ — Same sha and colours; used for layout and contrast only, never for advisor paths (PR-0126 is open). Partly superseded by the gap pass's fresh live captures at those shapes.
- Carried issues not re-examined this round (each marked CARRIED in its round10 field) — from critic/rounds/round-09.json — Same code and bundle; no repair landed in this build.

**Not tested**

- Pointer beyond the pause chip, touch and gamepad input; Firefox, Edge and Safari; a real phone.
- Load time and frame time on the live network (PR-0084); frame times during actions.
- Panel-versus-sprite projected-quad measurement (eye judgement only at 1024x768, 1280x720 and 2560x1440).
- The Active branch of the FFX-2 first-turn badge and the Active mode chip after a mid-fight flip.
- Chapter 6 'attack' poses (never reported in 75 turns); chapter 5 results spoils (PR-0138); possessed Valefor, Yu Yevon, boss-yu-yevon and ending-ffx (chapter 3 never won).
- The pause on the results screen; Start/gamepad pause.

**Required and not tested (keeps the deep obligation pending)**

- CHK-B1: Bailey's listening verdict on this mix (he is away; no agent can hear).
- CHK-022 (braskas-final-aeon): a real-input win through the aftermath; seven advisor-following attempts on live were all defeats (PR-0082).
- CHK-024: the same-origin upgrade on GitHub Pages (the round-09 BEFORE profile opened on the live 5ddfde3 origin), never run.

**Human judgments**

- FFX-2 Wait as the default (D-029) and the one-time migration: recorded. Bailey, 2026-09-22; follow-ups adopted 2026-09-23.
- Config ATB SPEED row: recorded. Bailey: 'fine if it's faithful'.
- Shipping chapter 6 with candidate pose art: recorded. Bailey: 'please get to work on finishing the new chapter we cant delay any longer'. Disclosed as PR-0096 and PR-0092.
- Owner override for release 09: recorded. Bailey: 'Work on pushing at least a live build with one new chapter'. Settles no obligation and changes no verdict.
- The shipped score (D-026): recorded. Negative verdict on record, 2026-09-21: 'music is too reminsicent of snes music ... all of these next to be fixed very next build.' His pick among the audition sketches is NOT recorded (PR-0148).
- Audio listening verdict on this mix (CHK-B1): NOT recorded. Not obtained: 'I'm at work so can't grade that yet' (2026-09-22).
- Hands-on feel (CHK-B2) and chapter 6 voices (CHK-B3): NOT recorded. Bailey is away.
- Open questions only Bailey can answer: NOT recorded. The FFX-2 Wait wording of the briefing and coach badge (inferred copy); Grenade's band (PR-0087); whether a worn dressphere survives a chain seam (PR-0124); whether to build FFX-2 Steal/Pilfer Gil or hide the rows (PR-0143); whether the intent panel opens by default in FFX-2 but not in FFX (CHK-020); the silent Shuyin confrontation versus a continuous theme (PR-0129); 'Five fights' with six chapters (PR-0116); which 'title screen' his Leblanc-tile reaction meant (the chapter card or the game title); whether chapter VI, the prequel to chapter IV, should say so or move (proposal P-10-3).

## Ranked issue list (all open)

### Major (52)

1. **PR-0122** [interface; both (FFX-2: the full panel, on by default, chapters 4, 5 and 6; FFX: the "E ENEMY MOVE" chip, and the full panel after E)] · introducedByCandidate True · regressionVsLive True · inNewFeature False  
   The now-visible enemy-intent panel is drawn above the pause screen: it covers the pause close-up, the OPTIONS values and the THIS ENCOUNTER actions, and survives H (a regression against live)  
   Round 10: ROUND 10, LIVE: re-observed in every FFX-2 run (chapters 4, 5, 6) at 1600x900, 2000x1012 and 390x844, and the FFX 'E ENEMY MOVE' chip shows through the pause. Confirmed independently in the Claude Browser pane: after a real Esc, '.eint__panel' stays display:block, opacity 1, and elementFromPoint at its rect returns '.eint__enemy' over Yuna's painting; it stays topmost after H. Cause: BattleScreen.openPause (src/app/screens/BattleScreen.ts ~498-545) hides nothing from the intent layer. 624895d is not an ancestor of 1b33971, so this is a regression against release 08 that is now public. Main 59b348a3 (after this build) appears to address it; not verified here.  
   Fix: Hide the .eint layer (panel and chip) while the pause screen is open, from the same place the pause suspends the rest of the battle HUD, and restore it on resume; leave the player's E setting untouched. Alternatively give the pause root a stacking context above the overlay.  
   Acceptance: Real keys, chapters 1 (after E), 4, 5 and 6 at 1600x900, 2000x1012, 1280x960 and 390x844: Esc, every pause tab, H, H again, resume. No .eint pixel is visible while paused (rect, opacity, display; elementFromPoint at the last .eint__panel rect returns a pause node), and after resume the panel is back in its prior visible or hidden state.

2. **PR-0148** [audio; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The shipped score is the one Bailey said sounds like SNES music (D-026, 'fixed very next build'); it ships unchanged, and OWNER-VERDICT.md does not record that verdict  
   Round 10: NEW ticket this round for an owner-reported problem on record since 2026-09-21 (audio auditor).  
   Fix: Put the audition (today / A / B / C) in front of Bailey as phone-playable files and record his pick; re-render the cues in that sound (the D-026 delivery). Meanwhile record the 2026-09-21 verdict verbatim and dated in OWNER-VERDICT.md.  
   Acceptance: OWNER-VERDICT.md quotes the D-026 words with their date; Bailey's pick is recorded; qa.mjs and themes-audit are green on the re-rendered cues; his next verdict is recorded against the exact cue hashes.

3. **PR-0142** [interface; FFX only (the FFX-2 chapter 6 matrix does not leak)] · introducedByCandidate unknown · regressionVsLive unknown · inNewFeature False  
   FFX: after one mouse click on the PAUSE chip, keyboard focus stays on the chip and every later Enter on the command menu re-opens the pause  
   Round 10: NEW this round (capture owner R10 pause matrix; interface R10-INT-01). The chip dates from 2026-09-16/18 and a2fb6d0 in this build changed the pause click handling; release 08 cannot be compared, so both tags are unknown (unknown holds only a critical).  
   Fix: Make the chip unfocusable (tabIndex=-1 and preventDefault on mousedown) or blur it when it opens the pause; or have the FFX menu preventDefault the Enter it handles, as the FFX-2 menu appears to.  
   Acceptance: Chapter 1: click the chip, Esc, ArrowDown, Enter: the screen stays 'battle', the submenu opens, activeElement is not the chip. Repeat in chapters 2 and 3.

4. **PR-0143** [combat; FFX-2 only] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   FFX-2 Steal and Pilfer Gil are offered as enabled commands but do nothing and say nothing; chapter 6 hands Rikku both and its data says 'Steal them.'  
   Round 10: NEW this round (combat R10-01; gap pass on screen; confirmer re-ran the probe). Pre-existing engine gap: Thief is owned in the chapter 4 and 5 presets too, so it was reachable on release 08 through a spherechange; chapter 6 made it prominent by starting Rikku as a Thief. Not a regression.  
   Fix: Until Bailey rules on building FFX-2 stealing (already an open question on branch d57524a): hide or disable Steal and Pilfer Gil in the FFX-2 command builder and drop 'Steal them.' from Dr. Goon's sensorText. If he says yes: implement Steal per ffx2-combat-core §3.2 and add the x2-budget-grenade ItemDef.  
   Acceptance: probe-steal shows either no Steal or Pilfer row offered, or a steal event plus an inventory change on Dr. Goon, pinned by a test; no enabled FFX-2 command resolves with zero effect.

5. **PR-0125** [combat; FFX only (chapter 3; the dreams-end preset is the only one granting Doublecast)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   FFX Doublecast entered through the real command menu asks for no spell or target and casts Firaga twice on Lulu herself, KOing her; the chapter 3 advisor recommends it about 25 times per attempt  
   Round 10: ROUND 10, LIVE: re-proven with real keys. All 29 real-menu Doublecasts in the two chapter 3 attempts were logged 'Doublecast: Firaga' with targets ['lulu'] (26 and 38 self-damage events of about 2,800-3,200; Lulu KO'd 7 and 22 times). The fix c01742b landed on main after this build and is not credited.  
   Fix: After Doublecast, open Lulu's Black Magic list and then the chosen spell's enemy target step, and submit {id: "doublecast", wrappedId, targets}. Safety net: resolveDoublecast never aims an offensive spell at the caster's side when the targets are only the self placeholder.  
   Acceptance: probe-doublecast.test.ts: engine action-start targets are a subset of the enemy ids and selfDamage is [] for seeds 1, 7 and 42. A real-key chapter 3 run shows a spell and target step after Doublecast, 0 "lulu>lulu" casts, and reaches a win.

6. **PR-0082** [process; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Chapter 3 still has no real-input win (narrowed from three chapters to one): five attempts of about 24 minutes each, all defeats; suspected cause PR-0125 (Doublecast KOs Lulu)  
   Round 10: ROUND 10, LIVE: still no real-input win. Two advisor-led defeats by the capture owner (24:31 and a second long attrition, 41.8 min, 38 KOs, 29 revives), one by the confirmer (235 turns, 1,060 s), and four by the gap pass, all in the first link (115/52/87/267 turns). Seven advisor-following real-key losses on live in total; every one reached results, RETRY, prep and battle. Suspected cause remains PR-0125 (Doublecast on Lulu) plus PR-0126 (chipless Curaga cards in attempt 2); not established. The chapter's aftermath, possessed Valefor, Yu Yevon and ending-ffx have never been reached with real input.  
   Fix: Fix PR-0125 first, then one real-input chapter 3 run; the §8 method check stays owed. Never tune the boss.  
   Acceptance: One real-input win of chapter 3 from chapter select to results, CONFIRM and chapter select.

7. **PR-0144** [interface; FFX-2 only] · introducedByCandidate True · regressionVsLive False · inNewFeature True  
   Chapter 6's strategy guide keys its attack hints on a boss being in the fight, not on the target: after Logos falls every 'Attack -> Ormi' NEXT line gives Logos' evasion as the reason, and the latent Leblanc line contradicts the research  
   Round 10: NEW this round (combat R10-02, gap pass, confirmer).  
   Fix: Add a target condition to GuideHint (for example targetId) and use it on those two hints in place of bossId; reword the Leblanc hint to §3.4; correct or delete the unread FFX2_LEBLANC.sensorTexts.leblanc. Keep the NEXT reason visible at every fit rung, as the source intends.  
   Acceptance: probe-guide-hints shows the Logos line only on Attack -> Logos and a §3.4-consistent line on Attack -> Leblanc, pinned by a unit test; on screen the reason sits under its NEXT header at the default fit.

8. **PR-0126** [interface; both (widened: round 09 saw it in FFX-2 chapter 5 only)] · introducedByCandidate unknown · regressionVsLive unknown · inNewFeature False  
   The advisor card drops its 'in <submenu>' directions whenever the lead suggestion renders at density 5 or 6, in both games and on every phone card (widened from chapter 5)  
   Round 10: ROUND 10, LIVE, WIDENED to both games and traced. The card drops its 'in <submenu>' chip whenever the lead suggestion renders at density 5 or 6: src/ui/common/MoveAdvisor.ts:581 sets bare = density >= 6 || (!alt && density >= 5) and :591 then drops statsHtml, which carries the chip, against the function's own promise at line 490. Counts: chapter 3 FFX attempt 2, 31 of 309 decisions from turn 216 (Curaga x18, Doublecast, X-Potion, Al Bhed Potion; the harness then took Attack); chapter 5, 17 of 58 and 60 of 312; every phone card (ch6 8/11, ch1 4/11). The gap pass captured chipless FFX cards on live (Stamina Tonic, Phoenix Down, compact warning form). Consequence on route evidence: the capture owner's four chapter 5 attempts lost after the harness fell back on chipless 'Darkness' picks (62 of 313 diverged; the confirmer counted 62 of 213 'Darkness' picks in a 30-minute timeout). The gap pass, which read the chip-less card by name, WON chapter 5 on live on its first attempt (153 turns), so chapter 5 is winnable with real input; the losses are not an encounter finding.  
   Fix: In moveHtml keep the menu chip when bare: render the lead's menu chip at density 5 and 6 instead of ''. Shared plumbing, so both games.  
   Acceptance: The chapter 3 attempt-2 and chapter 5 routes on the fixed build show 0 decisions with no menu for any non-Attack move, and the 390x844 card in chapters 1 and 6 prints its 'in <menu>' chip.

9. **PR-0124** [combat; FFX-2 only (chapters 5 and 6, both chained)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   FFX-2 chain seams carry MP above its maximum (Rikku 123/106) and silently revert a girl to her starting dressphere  
   Round 10: ROUND 10: code identical (BattleScreenSetup.ts carryFfx2, ffx2/setup.ts). The live chapter 6 win repeats the Thief-to-White-Mage spherechange before seam 2. Evidence reused from round 09 with the dependency argument above.  
   Fix: Clamp the carried HP and MP to the derived maximums (in carryFfx2 or setup.ts). Separately ask Bailey or research whether the worn dressphere carries across a seam.  
   Acceptance: Engine test: a chain link ending with Rikku in White Mage above the Thief MP maximum starts the next link with mp <= stats.maxMp. On screen no party row ever shows mp > max.

10. **PR-0123** [interface; both (shared src/ui/common/EnemyIntent.ts, src/battle/ffx2/intent.ts); observed in FFX-2] · introducedByCandidate True · regressionVsLive False · inNewFeature True  
   The enemy-intent headline pairs the rolled move with a different move's odds ("No action LIKELY 88%" above "Attack 88%"), prints "Likely" at 25 percent, and its odds sum to 101  
   Round 10: ROUND 10, LIVE: re-observed: 'Blizzard LIKELY 25%' on the Fem-Goon card, and at the chapter 5 link 5 first menu 'No action LIKELY 88%' while the card's own odds list Attack 88% and no action 13%. Main 59b348a3 ('match its odds to the rolled move') appears to target it after this build; not verified.  
   Fix: Print the likelihood of the branch whose label equals moveName; word it "Most likely" only when it is the top branch and "Possible" below 50 percent; normalise the rounded odds.  
   Acceptance: Unit test: for every IntentView the chip percent equals branches.find(b => b.label === moveName).percent and the rows sum to 100 plus or minus 1. The chapter 5 link 3 capture shows Protect with 29 percent.

11. **PR-0099** [audio; ffx2] · introducedByCandidate True · regressionVsLive False · inNewFeature True  
   Chapter 6 borrows chapter 4's cues: the comedy entrance plays under 'The machine under the cathedral' and the Syndicate fight under Bahamut's aeon theme; no cue-map row exists for ch6  
   Round 10: ROUND 10, LIVE, RAISED TO MAJOR: missing required content in a shipped chapter, and the release announcement already discloses it as a carried major. On live chapter 6 requests scene-bevelle-underground for its comedy entrance, boss-ffx2-aeon (chapter 4's Bahamut theme) for the Syndicate fight, held through seams 2 and 3, and scene-farplane for the aftermath. THEMES.md has no chapter 6 row.  
   Fix: Disclose it in the release note. Add 'borrowed, pending' rows for ch6 to the THEMES.md cue map. Offer Bailey 2-3 short audio sketches for a Chateau Leblanc scene cue and boss cue (end state first), and build nothing until he picks.  
   Acceptance: THEMES.md has ch6 rows. themes-audit covers the ch6 cues. Bailey's pick is recorded in docs/audio/OWNER-VERDICT.md or decisions.json.

12. **PR-0094** [visual; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Chapter 5 chain-seam camera (narrowed): seams 2-4 now settle with the part fully in frame; at the seam into link 5 the camera holds a Shuyin close-up into the first command menu with Yuna and Rikku off-screen and Paine cut at the left edge  
   Round 10: ROUND 10, LIVE, WIDENED. Link 5 unchanged: the gap pass's real-key win shows the link 5 first menu and the frame 3 s later as a Shuyin close-up with his head under the HP slab, Yuna and Rikku off-frame, Paine cut at x~0. New: on 1 of 2 live arrivals at link 3 the camera settles with Yuna half off the left edge (round 09 framed her fully on the same code, so the settle is intermittent), and at link 4 the Redoubt cannon sits under the guide card and HP bars.  
   Fix: When the Shuyin arrival beat ends, return the camera to the link's idle rig before the first command menu opens.  
   Acceptance: At 1600x900 and 2000x1012 the link 5 first menu shows Shuyin and all three girls whole, Shuyin's head clear of the HP slab.

13. **PR-0097** [visual; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Bloom washes out the approved Yuna Gunner and White Mage paintings whenever Yuna is the ready girl in FFX-2  
   Round 10: ROUND 10, LIVE: re-observed in chapters 4, 5 and 6 at 1600x900 and 2000x1012 whenever Yuna is the ready girl.  
   Fix: Clamp the highlight or rim emissive on white-dominant paintings, or exclude party quads from the bloom threshold.  
   Acceptance: At the ch6 first menu, Yuna's torso mean luminance is within 10 percent of the idle PNG's, and her sash and belt stay legible.

14. **PR-0096** [visual; FFX-2] · introducedByCandidate True · regressionVsLive False · inNewFeature True  
   Chapter 6 pose art (narrowed, disclosed): Leblanc's idle still holds the fan shut, missing Bailey's named pose B; Ormi's attack, cast, hurt and ko show a different shield and costume from his idle  
   Round 10: ROUND 10, LIVE: at 2000x1012 link 3 Leblanc still holds the fan shut. The gap pass captured cast, hurt and ko for all three; no 'attack' pose was ever reported in 75 turns (UNVERIFIED); Leblanc's hurt is semi-transparent and ghosted; Ormi's hurt and ko are off-model. Within the disclosed 5-6/10 candidate set.  
   Fix: Already planned: replace it with the identity-LoRA render of pose B in the next release. Disclose it in this release note.  
   Acceptance: A composite against docs/concepts/chapters/leblanc/renders/leblanc-b.png shows the fan fully open and the warm magenta palette at 1600x900 in play.

15. **PR-0092** [visual; FFX-2] · introducedByCandidate True · regressionVsLive False · inNewFeature True  
   Chapter 6's Dr. Goon and Fem-Goon ship as the procedural boss-silhouette placeholder  
   Round 10: ROUND 10, LIVE: the two goons are black hooded cones with a cyan core in link 1 and in the target step at every size. Disclosed placeholder.  
   Fix: Add painted dr-goon and fem-goon subjects (idle as a minimum) under public/art/characters. Per AGENTS.md rule 9 this needs a quick options pick from Bailey first. Until then, disclose the placeholder in the release note.  
   Acceptance: At link 1, 1600x900, both goons render a painted idle. No paintBossSilhouette is staged in chapter 6 (a network log shows art/characters/<goon>/idle.png loaded and decoded).

16. **PR-0008** [encounter; ffx] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Chapter 1's own intended strategy still wins only 26 of 40 seeds (carried, STALLED)  
   Round 10: ROUND 10: re-measured fresh on the build's code: 26 of 40 seeds (unit-full.log line 1756); the live real-key route lost attempt 1 at 30 commands and won the retry. STALLED: RUBRIC §8 method check owed before any further batch.  
   Fix: Carry forward. The written method check required by §8 is owed before another batch in this area.  
   Acceptance: The same command prints at least 36/40, with no loss before player turn 10.

17. **PR-0007** [encounter; ffx] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Zombie-to-Full-Life kills leave no counter-play window (carried, STALLED; evidence reused)  
   Round 10: ROUND 10: not re-measured; the Seymour Flux AI, status, CTB and data are unchanged since round 08's measurement. The live win logged the first-zombie beat. STALLED: method check owed.  
   Fix: Carry forward, method check owed (§8).  
   Acceptance: Median Zombie-to-kill window of at least 1 player turn over seeds 1-30.

18. **PR-0087** [combat; ffx2] · introducedByCandidate True · regressionVsLive False · inNewFeature True  
   Grenade deals 376-423 per enemy (always crit ×2 on base 200), matching neither source's printed figure  
   Round 10: ROUND 10: code unchanged; the live chapter 6 win opens with 5 Grenades and the advisor card reads 1,150-1,268 over 3 hits. Sources conflict (ffx2-combat-core §5.5 vs leblanc-syndicate §4.6/§6.2); awaiting Bailey or research.  
   Fix: Settle the conflict from the sources: is the published band pre-crit or final, and is it 200 or 300? Record the ruling in both research files. Set the item so it lands in the chosen band (for example, drop bonusCrit or halve the base). Add a unit test that pins Grenade's per-enemy band. FFX-2 only; chapter 6 is the only build that carries Grenades.  
   Acceptance: The probe's unchained per-enemy Grenade damage falls inside the band the two research files now agree on, the advisor card shows the same band, and a test pins it.

19. **PR-0061** [feel; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The wait from the scene skip to the first usable command menu is 8.5 to 11.3 s (carried, STALLED)  
   Round 10: ROUND 10, LIVE, STALLED. Serial, fresh profile, no parallel load, from Enter keyup after the scene to the first menu with rows: ch1 10.95 s, ch2 9.20, ch3 8.48, ch4 9.54, ch5 10.92, ch6 11.31. Chapter 6: ~2.3 s transition, ~1.7 s title card, ~4 s camera intro with no HUD, the HUD at 8.6 s, then the enemies' opening actions before the first menu. A little worse than round 09's 8.3-9.1 s by the same kind of probe; same code, so read as measurement spread, not a regression. RUBRIC §8 method check owed.  
   Fix: As in round 08: record the intended length of the opening beat and let Confirm end the intro sweep, as the cutscene skip already does.  
   Acceptance: The same probe, per chapter: either the intended length is documented and met, or a Confirm press during the intro reaches the first menu within the chapter's ATB/CTB fill time.

20. **PR-0021** [narrative; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The banter bank is still not implemented (carried, re-confirmed on chapter 6)  
   Round 10: ROUND 10, LIVE: prep shows only dossier, objectives and tip; results show one fixed quip in every chapter. STALLED: method check owed (a minimal results exchange bank first, or Bailey rules banter out of this milestone).  
   Fix: As round 08; or Bailey rules that banter is out of this milestone's scope, and the issue drops to a suggestion.  
   Acceptance: As round 08.

21. **PR-0127** [interface; both (shared prep card)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The party-prep CHAPTER card clips its own text: the TIP cut mid-sentence and the thumbnail row cut off at 1280x720 and 1280x960 in every chapter, chapter 6's captions at 1600x900, nearly everything at 390x844  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: Let the CHAPTER card grow into the empty space below it or scroll its left column with a cue; at phone width stack the card above the party list instead of scaling the 16:9 layout.  
   Acceptance: At 1600x900, 1280x960, 1280x720 and 390x844 every text node in the card has scrollHeight <= clientHeight (or a visible scroll cue) and at least 12 px effective size, for chapters 1, 5 and 6.

22. **PR-0098** [onboarding; both (FFX loses BATTLE HELP; FFX-2 loses ATB SPEED, STRATEGY GUIDE, BATTLE HELP)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   On a phone the pause OPTIONS list draws five rows and no scroll cue; ATB SPEED (new), STRATEGY GUIDE and BATTLE HELP are not rendered, yet ArrowDown still selects them and ArrowRight would change a setting the player cannot see  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: In the narrow pause breakpoint, let the settings block size to its content (the encounter block can move below it), or make it an overflow container with a visible fade and scroll-into-view on the selected row.  
   Acceptance: At 390x844 in both games, arrowing through OPTIONS brings every settings row into view with its full label, and a touch drag or tap reaches ATB SPEED in FFX-2.

23. **FOC-06** [interface; FFX (phone card); both (1280x720)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Residue: the FFX advisor card is absent on a phone (an orphan "N HIDE MOVES" chip remains) and sheds 4 of its 12 rows at 1280x720; the 12 px desktop floor is met  
   Round 10: ROUND 10, LIVE: the FFX phone card is still absent with an orphan 'N HIDE MOVES' chip; at 1280x720 and 1024x768 text measures down to 7.8 and 6.2 px (gap pass, chapter 6), and at 1024x768 the guide shows 'NEXT / YUNA' with no move line.  
   Fix: On FFX phone, mount the same compact last rung FFX-2 uses (move and target only). Where no card is shown, label the chip 'N show moves' or hide it.  
   Acceptance: At 390x844 in Chapter 1 the card shows the move and target at 12 px or more, or no chip claims to hide it. At 1280x720 both games list which rows the card drops.

24. **PR-0150** [visual; FFX-2 only] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Targeting s3 (FFX-2 single target with the ATB running) is far from its approved tile, and the party is framed out  
   Round 10: NEW ticket: the tile was UNVERIFIED in round 09 and is now captured and failing (gap pass).  
   Fix: Add the TARGET plate, actor plate and controls hint to FFX-2 target select and keep the party in frame during targeting.  
   Acceptance: The same capture shows the three plates and all three girls whole; the composite against the s3 tile matches its named properties.

25. **PR-0002** [visual; FFX] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The FFX command stack hides Yuna in Chapters 1 and 3 (carried)  
   Round 10: ROUND 10, LIVE: re-observed in chapters 1 and 3 at the first menu and midfight at 1600x900.  
   Fix: Move party slot 0 right, or lower the stack's reach, per the round-08 ticket.  
   Acceptance: CHK-008: Yuna's projected quad is at most one-third covered at 1600x900 and 2000x1012.

26. **PR-0016** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The pause CHAPTER tab shows the last member's close-up (Paine), not the chapter's approved hero plate (carried, re-observed)  
   Round 10: ROUND 10, LIVE: fresh gap captures: the CHAPTER tab plate is kimahri.2x.webp in chapter 1 and paine.2x.webp in chapter 4 at 1600x900 and 2000x1012, never the approved hero plates.  
   Fix: Paint the chapter's pause plate behind the CHAPTER tab, or ask Bailey whether the member painting is intended there.  
   Acceptance: The pause-ch4 composite shows the approved Yuna and Bahamut plate behind the CHAPTER tab.

27. **PR-0079** [visual; both (the side-choice rule is shared plumbing; observed on an FFX member)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The remade pause draws its meter columns across Kimahri's face, breaking the mirror rule Bailey named  
   Round 10: ROUND 10, LIVE: fresh capture (no longer reused): the BATTLE STATS and IN THIS FIGHT columns run across Kimahri's muzzle and left eye.  
   Fix: Make the side choice read the same focal the stage already fetches (src/ui/common/chapterPanel.ts:252-266, applied at 342-345) and flip the chrome when the focal x falls on the chrome's side, rather than using a fixed or per-game side. Kimahri at 0.42 should put the block on the right.  
   Acceptance: For all three FFX and all three FFX-2 member tabs at 1600x900, assert the bounding box of the chrome block does not intersect the painting's focal point, and read the six composites against frames (a), (b) and (c) of the approved sheet.

28. **PR-0031** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Target selection lacks two named mustRemain properties, the ground ring under the selected figure and the quiet dim on non-targets (carried, narrowed)  
   Round 10: ROUND 10: Targeting s2 still fails the mustRemain ground ring and dim on non-targets; s1 matched on reused evidence.  
   Fix: Add the ring decal under the targeted figure's foot point and a 15-20 percent dim on untargeted actors while the cursor is live.  
   Acceptance: The s2 composite shows a ring under the Yu Pagoda and a visible dim on the Final Aeon and Pagoda B.

29. **PR-0005** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The approved Turn cut-in is still never shown in play (carried)  
   Round 10: ROUND 10, LIVE, CAUSE ESTABLISHED: a per-frame recorder watched for a visible .ig-cutin in every gap run in chapters 1 to 6 and none appeared. showTurnCutIn (src/ui/inkgold/cutin.ts:84) is exported from src/ui/inkgold/index.ts and has no caller in src/: built but wired to nothing (AGENTS.md hard rule 4).  
   Fix: Call showTurnCutIn from the presenter at turn start, or ask Bailey to withdraw the tile.  
   Acceptance: A timed sequence at a party turn start shows the cut-in slab.

30. **PR-0035** [visual; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile (carried)  
   Round 10: ROUND 10, LIVE: re-observed (party left, boss right, against the tile).  
   Fix: Carried from round 08: ask Bailey whether the mirrored field is an accepted adaptation, or re-stage it.  
   Acceptance: The composite matches, or the tile carries Bailey's recorded adaptation.

31. **PR-0128** [visual; FFX only] · introducedByCandidate unknown · regressionVsLive unknown · inNewFeature False  
   Swordplay Overdrive overlay: the strategy-guide card covers the overlay's "Tidus OVERDRIVE" name plate, and the timing bar lacks the approved HIT x2 / x4 / x6 ticks  
   Round 10: ROUND 10, LIVE: fresh capture (no longer reused): Slice & Dice, the G guide card covers the overlay's top-left where the name plate belongs; the bar carries only MISS and HIT with no HIT x2/x4/x6 ticks.  
   Fix: Hide the guide card, or move it below the overlay, while an Overdrive overlay is up; restore the tick labels from the tile.  
   Acceptance: The frame 0.5 s after Enter on Slice & Dice shows the name plate unobstructed and four tick labels.

32. **PR-0017** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   At phone width the party and most enemies are off-screen; in chapter 6 the camera never shows the party through menus or hits (carried, extended)  
   Round 10: ROUND 10, LIVE: at 390x844 in chapter 6 the neon heart fills the top half and the party is never on screen through the first menu, the target step and link 2.  
   Fix: Covered by the pending phone-layout options round.  
   Acceptance: Every combatant is in frame at 390x844 in chapters 1 to 6.

33. **PR-0001** [interface; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   At 390x844 the battle HUD is illegible in both games (carried, re-observed)  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: As round 08 says: give the battle HUD its own type floor in the narrow breakpoint and reflow the panels.  
   Acceptance: A leaf-text sweep at 390x844 in one FFX and one FFX-2 chapter finds zero elements under 14 effective px.

34. **PR-0095** [visual; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Vegnagun's Bulwark, Redoubt and Node parts render as placeholder silhouettes  
   Round 10: ROUND 10, LIVE: Bulwark, Redoubt and Node are still hooded cones.  
   Fix: Paint the three part subjects, after an options pick from Bailey (rule 9).  
   Acceptance: Links 2 to 4 stage painted parts, with no paintBossSilhouette in chapter 5.

35. **PR-0058** [visual; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   FFX-2 speakers without a portrait: Nooj opens chapter 5, and Brother speaks three lines in chapter 6 on a text-only card (carried, widened)  
   Round 10: ROUND 10, LIVE: Nooj's text-only speaker card in chapter 5 re-observed.  
   Fix: As in round 08: paint the FFX-2 speaker portraits after an options pick.  
   Acceptance: The capture shows a painted Nooj portrait.

36. **PR-0012** [interface; FFX-2 only] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The FFX-2 command menu never says what the highlighted row does (carried, re-observed in the new chapter)  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: As round 08: mount the info slab in FFX2BattleHud, fed from the FFX-2 CommandMenu selection.  
   Acceptance: Every reachable FFX-2 row prints a non-empty description in Chapters 4 to 6.

37. **PR-0010** [interface; both (shared panel)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.  
   Acceptance: At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.

38. **PR-0011** [interface; FFX (FFX-2 already shows it)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: Do not widen the FFX panel: keep the brief density that round 02 asked for, but promote a guaranteed or high-chance status into the brief body, either appended to the description line ('- inflicts Zombie') or as a chip beside SCRIPTED. A 100 percent status is not optional detail, it is the move. FFX only.  
   Acceptance: Chapter 1 turn 1 with Lance of Atrophy queued: the panel names Zombie with its chance, at brief density, without growing past its 30 percent cap; the FFX-2 panel is unchanged.

39. **PR-0018** [interface; FFX (measured); FFX-2 not measured] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The selected command label is still the least readable text on screen, 1.74:1 on the Chapter 3 TALK row (carried, re-measured)  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: As round 08: give selected-and-disabled rows their own token (near-black at reduced opacity, or an inverted slab).  
   Acceptance: A contrast sweep of every row state in both games is at 4.5:1 or better.

40. **PR-0013** [interface; FFX-2 only] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   FFX-2 letters a uniquely named enemy, now 'Dr. Goon B' in Chapter 6 (carried, awaiting Bailey)  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: Ask Bailey the narrow question recorded in round 08, then apply one rule.  
   Acceptance: A test over the Chapter 6 and Chapter 5 formations pins the chosen lettering.

41. **PR-0066** [interface; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.  
   Acceptance: In a fresh 390x844 context the leaf-text sweep over .fe on both the title and the chapter select returns zero elements under 14 effective px, documentElement.scrollWidth === clientWidth, and the re-shot capture shows no clipped or overlapping labels; the same sweep at 1600x900 and 2000x1012 is unchanged.

42. **PR-0067** [interface; both (the hidden group is FFX-2)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   At 390x844 the FINAL FANTASY X-2 group sits below an unmarked clip, and every control hint on that screen names a key  
   Round 10: ROUND 10, LIVE: re-observed unchanged by the interface auditor on the capture owner's live GPU captures (same code as round 09).  
   Fix: src/app/screens/frontend/frontend.css gives .fe-rail a fixed height with overflow-y:auto and nothing else in the narrow breakpoint. Smallest useful correction: add a bottom fade mask plus a persistent group indicator — for example pin the two game headings as a two-up switch above the rail, so both games are always visible even when their tiles are not — and add a pointer row to the hint bar. Game case: BOTH, one shared screen, though the group that disappears is the FFX-2 one.  
   Acceptance: At 390x844 in a touch context the FINAL FANTASY X-2 heading is visible in the first frame with no gesture; a touch drag on the rail brings IV and V into view; tapping the Bahamut card selects it and the plate then starts Chapter IV.

43. **PR-0019** [interface; both (shared help-slab composition); observed in FFX] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.  
   Acceptance: For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.

44. **PR-0006** [interface; both (shared advisor plumbing; AGENTS.md rule 14 case: BOTH, and CHK-020)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The move advisor repeats the chapter's own line whatever the board says: it told the player to recast an already-active Shell on all 13 of Yuna's turns, and the guided fight ran 9 minutes without resolving  
   Round 10: ROUND 10, LIVE: the chapter 4 route did not repeat Shell this round (Yuna's picks varied; won in 57 commands). Not closed: the original repro was not re-run.  
   Fix: Give the chapter-line branch the same state test the simulated ranking already applies: before recommendedCommand returns the tactic's pick, resolve it on the throwaway copy the advisor already builds and drop it when it changes nothing measurable — a buff whose status is already on every named target, a cure with nothing to cure. One guard in src/engine/tactics/advisor.ts, game-agnostic, and the same short-circuit round 05 traced for the revive branch, so one repair closes both halves.  
   Acceptance: Seeded engine test over chapters 1 and 4: run the advisor's own pick for 30 consecutive player turns and assert no suggestion is returned whose simulated resolution produces no status-add, no damage, no healing and no cure. Plus one real-keyboard capture of chapter 4 in which the pick changes away from Shell on Yuna's second turn, and the route reaches an outcome.

45. **PR-0020** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The dialogue plate over-scales every portrait, so a speaker delivers the line with the top of the face cut off (merges PR-0056)  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Already written in the tree after this build: commit 71059ae 'Dialogue card: fit every portrait to its slot, fix Jecht, fix phone width', with 8fe4f99 behind it. Nothing new to design — the next deploy should carry it, and this review should verify it there.  
   Acceptance: At 1600x900 and 2000x1012, in chapters 1, 4 and 5, the portrait element's bounding rect is fully inside the slab's rect and no pixel of the slot's fill colour is visible around the painting.

46. **PR-0065** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The chapter board paints letter tiles and unpainted cards on arrival; the approved board only appears seconds later  
   Round 10: ROUND 10, LIVE, WIDENING NOT CONFIRMED. The capture owner's parallel fresh-profile runs caught the briefing with no Auron painting in 4 of 12 frames, one without the backdrop, and letter tiles on the chapter card and prep on arrival. The gap pass's six SERIAL cold runs (nothing else running, 50-70 ms frames from Enter on the title) show no letter tiles and no stale screen through the briefing mount; the only lag is the painted backdrop arriving 0.4-1.1 s after the text. So the widening is attributed to host contention in the capture owner's parallel runs; the original board letter-tile finding stands, carried.  
   Fix: Suspected: the board renders synchronously and the letter or empty card is what paints until each <img> load event fires. Smallest useful correction: await img.decode() on the selected chapter's three dossier faces and on the visible rows' thumbnails before the board's first paint — they are already in the preload list, so this costs a wait, not a fetch — and hold the previous card's art on a selection change. Failing that, make the fallback the ink silhouette the locked cards already use, so no state of this screen ever shows a letter. Game case: BOTH — one shared screen.  
   Acceptance: Fresh cold-cache context at 1600x900 and again at 390x844: the chapter select captured on arrival and at +200 ms shows no letter tile, every unlocked row shows its thumbnail and every .fe-party__face img reports naturalWidth > 0 before the screen is visible; repeat after ArrowRight and ArrowDown.

47. **PR-0063** [game-awareness; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.  
   Acceptance: With an FFX-2 card selected the dossier face images are yuna-x2.png, rikku-x2.png and paine.png; with an FFX card selected they are tidus.png, yuna.png, kimahri.png (and auron.png on Chapter III).

48. **PR-0057** [visual; both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing)] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.  
   Acceptance: At 390x844 in chapters 1 and 5, with .dbox--visible asserted: the .chint rect does not intersect the .dbox__body or the speaker-plate rect, and .chint lies entirely within 0..viewportWidth.

49. **PR-0014** [visual; both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   HUD portrait chips crop through heads; the monogram half is repaired  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.  
   Acceptance: Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.

50. **PR-0015** [visual; FFX-2] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5  
   Round 10: ROUND 10, LIVE: re-observed in chapter 5.  
   Fix: Move the Chapter 5 battle-1 enemy slot right, or the party line left, so the tail's green tip clears the party quads. Do not repaint either approved plate.  
   Acceptance: Project the vegnagun-tail quad and each party quad through the Chapter 5 camera and assert zero intersection in the default framing, then re-shoot and confirm no saturated-green pixels (g>170, g-r>60, g-b>45) fall inside any party member's bounding box.

51. **PR-0022** [visual; FFX (observed); the treatment is shared, so it is expected in both] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   A KO'd character is the standing billboard rotated about its centre, floating off the ground away from her station  
   Round 10: ROUND 10, LIVE: in chapter 1 midfight the KO'd Yuna is the standing billboard rotated to horizontal, floating mid-frame.  
   Fix: Rotate the KO billboard about the actor's feet, not its centre, and keep it at the actor's own station on the ground plane; better, give the cast a dedicated downed pose. Game case: BOTH — one shared actor layer.  
   Acceptance: A KO in one FFX and one FFX-2 chapter leaves the character touching the ground plane at her own station, with no gap between the billboard and the floor, at 1600x900 and 2000x1012.

52. **PR-0060** [process; FFX only] · introducedByCandidate False · regressionVsLive False · inNewFeature False  
   The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.  
   Acceptance: Either a captured dialogue frame at 1600x900 shows speaker "Yu Yevon" with yu-yevon.png at naturalWidth > 0, or the tile in docs/target/targets.json carries a delivery state that does not require one.

### Polish (60)

53. **PR-0121** [visual; both]  
   At 3840x2160 the pause plate stops at 3380x1931 and leaves black bands  
   Round 10: ROUND 10, LIVE: re-measured in BOTH games by the gap pass: at 3840x2160 the plate is 3375x1929 at (-7,-4), leaving ~465 px dark on the right and ~231 px at the bottom; at 2560x1440 and below the plate covers the window. The gap pass rated it major; kept at polish for consistency with round 09 (a rare resolution, pre-existing, not a regression), noting that Bailey's own 2026-09-18 criticism named a pause that is not full-bleed.  
   Fix: Remove the plate's maximum size cap (it looks like it is the 2x master width) and let object-fit: cover scale it.  
   Acceptance: At 3840x2160 the img rect covers 0,0 to 3840,2160.

54. **PR-0115** [interface; both]  
   P opens the pause but does not close it  
   Round 10: ROUND 10, LIVE, WIDENED: pClose false in every run, and P also does not open the pause over a cutscene in either game (Esc does).  
   Fix: Treat KeyP as resume inside PauseScreen, the way the BattleScreen listener treats it as open.  
   Acceptance: P, then P returns to battle with the command menu intact, in both games.

55. **PR-0145** [combat; FFX-2 only]  
   All three girls petrified is not an immediate Game Over; the helpless party is beaten down over 23-60 s instead  
   Round 10: NEW (combat R10-03).  
   Fix: Treat a party whose every member is removed, KO'd or petrified as a defeat (FFX-2 only).  
   Acceptance: probe-petrify reports defeat within the tick the third girl is petrified.

56. **PR-0146** [feel; both (seen in chapters 4 and 6)]  
   The enemy-intent panel appears over the title-card crossfade, before the intro sweep has finished  
   Round 10: NEW (feel R10-FN-01); a side effect of PR-0090 making the panel visible.  
   Fix: Mount the intent panel with the HUD, after the intro sweep.  
   Acceptance: No .eint panel is visible before the HUD in the transition frames of chapters 4 and 6.

57. **PR-0147** [narrative; FFX-2 only]  
   All three Leblanc acts play in the one painted room, so the seam's '...Okay. Next room.' ends where it started  
   Round 10: NEW (feel R10-FN-02).  
   Fix: Either a per-act backdrop (a perceivable change: options to Bailey first) or reword the seam line.  
   Acceptance: The seam line and the next stage agree.

58. **PR-0151** [interface; both (seen in chapter 6)]  
   Pause OPTIONS labels are cut with ellipses at 1280x960 (MASTER VOL…, SOUND EFFE…, STRATEGY GU…)  
   Round 10: NEW (gap pass).  
   Fix: Widen the settings column or wrap the labels at 4:3.  
   Acceptance: No ellipsis at 1280x960 and 1024x768.

59. **PR-0129** [audio; both (FFX-2 ch5 observed; FFX ch3 observed by the gap pass; the chain-cue versus scene-cue plumbing is shared)]  
   Boss themes false-start at an entrance scene: chapter 5's chain starts boss-shuyin, the "shuyin-appears" scene cuts it to silence at the first hit, then restarts it from the top (chapter 3 does the same at possessed Valefor)  
   Round 10: ROUND 10, LIVE: re-measured on the gap pass's real-key chapter 5 win: boss-shuyin replaces boss-vegnagun at the link 5 seam (gain 1 by +0.5 s), fades to silence as shuyin-appears starts, and restarts from gain 0 after the beat's last line. ending-ffx2 behaves as scripted.  
   Fix: Remove the leading music(null, ...) from "shuyin-appears" and "valefor-enters" so the chain cue carries through, or give those formations no chain cue so the scene alone starts the theme (Bailey's pick).  
   Acceptance: audioDebug sampled every 500 ms from the link start to 10 s after the scene: exactly one boss-shuyin slot start and no stop before the fight ends (or, in the silence variant, no boss-shuyin before the scene's last line); the same at chapter 3's possessed-Valefor entrance.

60. **PR-0076** [encounter; ffx2]  
   PR-0076 narrowed: under a player-chosen Active, chapters 5 and 6 are rarely won at human decision speed in the bench (the default and every returning save are now Wait)  
   Round 10: ROUND 10: suite table: chapter 6 under player-chosen Active wins 9/40 at 1.5 s and 4/40 at 4 s. Wait is the default under D-029.  
   Fix: Measure Active with a harness that re-reads the decision instead of resubmitting; then ask Bailey for the target band.  
   Acceptance: A clean Active measure with 0 refused submits is recorded and Bailey rules on the band.

61. **PR-0130** [interface; FFX only]  
   FFX: opening the intent panel with E makes the advisor card decline and leaves its "N HIDE MOVES" chip floating alone  
   Round 10: ROUND 10, LIVE: re-observed.  
   Fix: Hide the chip with its card, or give the card a second slot while intent is open.  
   Acceptance: After E in chapters 1 to 3 no orphan N chip is on screen.

62. **PR-0131** [interface; FFX only]  
   The chapter 1 advisor chains Phoenix Downs into immediate re-KOs: Yuna revived 7 times, KO'd again before acting after 6 of them  
   Round 10: ROUND 10, LIVE: in the chapter 1 loss 9 of 30 commands were Phoenix Down on Yuna, repeating the re-KO chain.  
   Fix: Build the degenerate-board matrix CHK-005 asks for first; then weigh revive advice against the next enemy action the intent model already predicts.  
   Acceptance: advisor-degenerate-boards test covers the telegraphed re-kill case in chapter 1.

63. **PR-0132** [interface; FFX-2 only]  
   Chapter 5 lists two identical "BULWARK" rows with no letter, and the intent panel says "BULWARK acts next" without saying which  
   Round 10: ROUND 10, LIVE: re-observed as two identical unlettered REDOUBT rows.  
   Fix: Letter duplicate part names consistently in the header, the intent panel and the target plate.  
   Acceptance: Link 3 shows "BULWARK A" / "BULWARK B" in the header and the intent names one of them.

64. **PR-0133** [narrative; both (CutsceneScreen is shared)]  
   Post-battle scenes stage nothing: victory poses, camera moves, dissolves and fx run over an empty painted room, so chapter 6's beat 14 asks "What am I looking at?" with nothing to look at  
   Round 10: ROUND 10, LIVE: the victory pose plays over an empty Chateau room (30-post-scene.png).  
   Fix: A design decision first (see proposal P-09-7): stage aftermaths on the battle stage, or rewrite their steps for a still.  
   Acceptance: Chapter 6 beat 14 shows an image of what the line refers to, or its lines no longer point at one.

65. **PR-0134** [narrative; FFX-2 only]  
   Chapter select names chapter VI "Leblanc", but its BOSS row reads "Ormi + Dr. Goon + Fem-Goon" and the silhouette is Ormi  
   Round 10: ROUND 10, LIVE, WIDENED: the chapter VI battle title card also names 'Ormi'.  
   Fix: List the Syndicate (Leblanc, Ormi, Logos) or the three acts.  
   Acceptance: The VI card names Leblanc among its bosses.

66. **PR-0135** [visual; FFX-2 (seen in chapter 6; not in FFX chapter 1)]  
   At 4:3 a hard-edged dark 16:9 band cuts across the FFX-2 battle backdrop  
   Round 10: ROUND 10, LIVE, WIDENED (merges R10-VIS-01): at Bailey's 2000x1012 the FFX-2 battle scene is a centred 16:9 box with hard-edged dark 100 px strips at x<100 and x>1900 in chapters 4 and 6 (also present in round 05 and 08 captures), and at 1024x768 a dark band crosses y~96-672. FFX chapter 1 at 2000x1012 is smooth (column luminance 32.4->34.9), so FFX-2 only.  
   Fix: Remove the fill from the 16:9 HUD box or feather its edges.  
   Acceptance: At 1024x768 and 1280x960 in chapters 4 to 6 no luminance step at the 16:9 box edges.

67. **PR-0136** [visual; FFX-2 only]  
   At party scale the Syndicate and goons queue in one diagonal file right behind the party  
   Round 10: ROUND 10, LIVE: re-observed; Logos almost touches Paine.  
   Fix: Re-space the chapter 6 enemy slots toward stage right.  
   Acceptance: At 1600x900 no enemy within 150 px of a girl in the default framing; enemies in the right half.

68. **PR-0137** [visual; FFX-2 only]  
   Bahamut's painting has un-removed white matte holes between wings and body, which bloom turns into glowing blotches  
   Round 10: ROUND 10, LIVE: re-observed.  
   Fix: Re-matte the enclosed background regions of the Bahamut states; Bailey owns any art pick.  
   Acceptance: No near-white enclosed regions in the idle's alpha, no glowing blotches in play.

69. **PR-0138** [prep; both (FFX-2 ch5 observed; FFX ch3 and FFX-2 ch6 also chain)]  
   A chained chapter's results show only the last battle's spoils, so chapter 5 ends a 39-minute, five-battle route on "EXP 0 · GIL 0"  
   Round 10: ROUND 10: not re-read on live results.  
   Fix: Accumulate each link's spoils in runEncounterChain (src/app/screens/BattleEncounterChain.ts:122-126, suspected) and pass the sum or a per-link list to results.  
   Acceptance: After a real-input chapter 5 win the results equal the sum of the five links' sourced values; chapters 1, 2 and 4 unchanged.

70. **PR-0139** [interface; FFX-2 as observed (shared panel)]  
   The intent panel keeps naming a KO'd enemy for up to 4.5 s ("ORMI ACTS NEXT Concussive Blast" after Ormi falls)  
   Round 10: ROUND 10, LIVE, re-observed in a new state: during the logos-down beat the panel reads 'LOGOS ACTS NEXT Double Shot' while Logos's bar is empty; it corrects after the beat.  
   Fix: Recompute the intent on ko events and skip combatants at 0 HP.  
   Acceptance: Within one frame of Ormi's KO the panel names Leblanc or Logos.

71. **PR-0140** [process; both (FFX ch7 data, FFX-2 ch6 meta, shared results layout)]  
   Commit 0bd85cc states no game case (CHK-021)  
   Round 10: ROUND 10: still states no game case.  
   Fix: Add the per-part case (Seymour spriteKey FFX only; Leblanc heroArt FFX-2 only; results layout both) to the chapter handoffs.  
   Acceptance: A handoff line names 0bd85cc and its three cases.

72. **PR-0141** [process; FFX-2 only]  
   critic-plan --json omits chapter 6 from the chapters this review owes  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Derive the plan's chapter list from the registry (encounters.ts minus LOCKED_CHAPTER_IDS).  
   Acceptance: The plan output includes ffx2-leblanc for this change set.

73. **PR-0084** [delivery; both]  
   Entering a battle takes 7.7 seconds from the chapter card on the live build, against the five-second loading goal  
   Round 10: ROUND 10: not measured on the live network; round 09's numbers on the same bytes (10.1 s cold local, 20.5 s at 50 Mbps card-to-first-menu, ~93 MB before the first command) stand as information only.  
   Fix: Measure the split between asset fetch, scene build and the battle-entry beat (PR-0061 needs the same instrumentation), then move whatever is not needed for the first frame behind it.  
   Acceptance: Chapter card to the first interactive command menu is under five seconds on the named hardware, cold and warm, in all five chapters.

74. **PR-0117** [interface; FFX-2]  
   on a phone, Chapter 6's pause prints the three-line chapter eyebrow over the GARMENT GRID row  
   Round 10: ROUND 10, LIVE: the capture owner saw the phone pause chapter caption overlap the stat and option rows (merged here).  
   Fix: Stack the eyebrow below the FFX-2 meter rows, or clamp it to two lines.  
   Acceptance: A phone pause capture in chapter 6 shows no overlapping text boxes.

75. **PR-0103** [narrative; FFX-2 only]  
   Two Act III KO beats assume Logos falls before Ormi: kill Ormi first and a KO'd Ormi shouts, and Paine calls for the already-dead Ormi  
   Round 10: ROUND 10, LIVE, CONFIRMED WITH REAL KEYS: Ormi killed first; ormi-down plays while Logos lives, then logos-down has the KO'd Ormi shout 'Logos! Logos, get up!' and Paine say 'Ormi next.' The chapter still reaches results.  
   Fix: Give 'logos-down' an Ormi-already-down variant (Leblanc alone), or split the trigger with a condition on Ormi's state.  
   Acceptance: Kill Ormi first and then Logos: no KO'd speaker talks, and no line names a dead target as next.

76. **PR-0104** [feel; FFX-2 only]  
   Under Wait's whole-menu hold, a confirmed command does not visibly resolve before the next girl's menu opens (known; the faithful split is deferred by Bailey)  
   Round 10: ROUND 10, LIVE: Yuna is in her Grenade pose at 41 ms and the next girl's menu is up by 755 ms; through 2.15 s no number lands.  
   Fix: None in this release (Bailey deferred it). Build the faithful top-level/submenu split in the next release, as decided.  
   Acceptance: In Wait, a confirmed command's damage appears while the next girl's top-level menu is open, and time still freezes inside a submenu.

77. **PR-0102** [narrative; FFX-2 only]  
   Leblanc's line 'I had the *better* half, dearie.' will print its asterisks literally  
   Round 10: ROUND 10: the literal asterisks reach the screen (reused reading of the identical artifact).  
   Fix: Drop the asterisks ('I had the better half, dearie.'), or add emphasis support to DialogueBox for both games.  
   Acceptance: A capture of that line shows no asterisk characters.

78. **PR-0109** [prep; both]  
   Chapter select forgets the chapter you were on: backing out of prep, or returning after a clear, puts the cursor back on Chapter I  
   Round 10: ROUND 10, LIVE: cardAfterBack='seymour-flux' in all 13 runs.  
   Fix: Keep the last confirmed chapter id in the flow and pass its tile index as initialIndex when the board is rebuilt.  
   Acceptance: Real keys: Esc from ch.6 prep -> board selectedId 'ffx2-leblanc'; after a ch.6 result -> CONFIRM/CHAPTER SELECT -> selectedId 'ffx2-leblanc'.

79. **PR-0110** [interface; FFX-2 only]  
   the advisor's 'N HIDE MOVES' chip paints over the FFX-2 first-turn coach line  
   Round 10: ROUND 10, LIVE: re-observed at 1600x900.  
   Fix: While the coach mark hides the advisor card, hide the card's N toggle with it, or dock the toggle outside the coach rect.  
   Acceptance: At 1600x900, 2000x1012 and 390x844 in Chapters 4 and 6, the N chip does not intersect the coach mark while it is up.

80. **PR-0111** [interface; FFX-2 (seen in ch.6 with three enemy HP bars)]  
   in Chapter 6 the collapsed strategy guide card is empty, only its title and MORE  
   Round 10: ROUND 10, LIVE: re-observed.  
   Fix: Budget the guide card's height after the enemy header, or collapse the header to one line for three or more bars.  
   Acceptance: In Chapter 6 at 1600x900 and 2000x1012 the collapsed guide shows its NEXT move line.

81. **PR-0112** [interface; FFX-2 (FFX not captured)]  
   the FFX-2 pause CHAPTER tab truncates objectives, labels and captions mid-word  
   Round 10: ROUND 10, LIVE: re-observed with the chapter 6 prep and pause-over-scene captions cut at 1600x900.  
   Fix: Let the objective and label cells wrap (the column has vertical room), or widen the encounter column.  
   Acceptance: scrollWidth <= clientWidth + 1 for every label in the tab at 1280 and 3840, in both games.

82. **PR-0113** [interface; both]  
   the phone chapter board runs the party names together and slides BEST under the hint bar  
   Round 10: ROUND 10, LIVE: re-observed.  
   Fix: Size the name cell to the portrait's width, with a minimum gap, and pad the dossier bottom by the hint bar's height.  
   Acceptance: At 390x844, no party name box intersects its neighbour, and BEST's value is outside the hint bar's rect.

83. **PR-0116** [onboarding; both (shared briefing)]  
   the briefing opens 'Five fights' while six chapters are playable (question for Bailey: the words are his, tile C1)  
   Round 10: ROUND 10, LIVE: still 'Five fights.' with six playable chapters; question for Bailey.  
   Fix: Ask Bailey whether to change the number or drop it. Build nothing without his yes (rule 9).  
   Acceptance: The briefing matches whatever Bailey approves.

84. **PR-0118** [interface; both (ch.1, ch.4 and ch.6 observed)]  
   Pausing over a cutscene leaves the dialogue card and the scene eyebrow drawn over the pause, and the two headers collide (chapters 1, 4, 6)  
   Round 10: ROUND 10, LIVE: re-observed.  
   Fix: Hide or lower the cutscene's dialogue layer and eyebrow while the pause is open over a scene.  
   Acceptance: Esc over a scene in both games shows no cutscene text or portrait above the pause.

85. **PR-0100** [audio; both]  
   47 audition candidate files (27 MB) ship in the build under audio/candidates, and qa.mjs --strict exits 1 on them  
   Round 10: ROUND 10, LIVE: the 47 candidates (27,481,452 bytes) are publicly served under audio/candidates; qa.mjs --strict exits 1 on them only.  
   Fix: Move public/audio/candidates to docs/audio/audition/candidates and update the relative links in docs/audio/audition.html (its generator, audition-round1.mjs), or exclude audio/candidates from the build copy.  
   Acceptance: qa.mjs --strict exits 0, and a fresh vite build has no audio/candidates directory.

86. **PR-0039** [audio; both - scene-gagazet and scene-dreams-end are FFX cues, scene-farplane is FFX-2; the cause is shared renderer plumbing]  
   Three shipped cues depart from the THEMES bible: no tempo map on scene-gagazet, scene-dreams-end and scene-farplane, FAREWELL_RISE absent from scene-dreams-end, scene-farplane in E minor against the map's E major (carried, widened)  
   Round 10: ROUND 10: themes-audit still reports 3 of 21 cues departing from the bible.  
   Fix: Implement THEMES.md's requested Track.tempo?: Array<[beat, bpm]> with linear interpolation and give these three a written tempo curve; or, if an arranger judges a static pulse acceptable for one of them, add it to TEMPO_MAP_EXEMPT with a reason as boss-dread and scene-bevelle-underground already are.  
   Acceptance: themes-audit reports no tempo-map failure across the 21 cues, and Bailey signs off the re-rendered cues in an audition tour.

87. **PR-0074** [interface; both]  
   The advisor's composed explanation repeats itself and produces broken English (widened)  
   Round 10: ROUND 10, LIVE: re-observed.  
   Fix: Compose the effect and outcome clauses once. Write 'and about 1,207 to the others' (or similar). Label a target count as targets.  
   Acceptance: Across every advisable ability in all six chapters, no status is named twice and no clause lacks a verb.

88. **PR-0032** [onboarding; both]  
   No text size, no key remapping, no motion or flash accommodation (carried)  
   Round 10: ROUND 10: reduceMotion and lowEffects exist in the save with no OPTIONS row.  
   Fix: As round 08 (the end state needs Bailey's pick).  
   Acceptance: As round 08.

89. **PR-0033** [onboarding; both]  
   The defeat screen says nothing about why the party fell (carried)  
   Round 10: ROUND 10, LIVE: re-observed on the chapter 6 defeat card.  
   Fix: End-state options to Bailey first.  
   Acceptance: As round 08.

90. **PR-0073** [onboarding; both]  
   The title offers exactly one pointer target, labelled PRESS ENTER, with keyboard-only hints — a touch player is never invited to tap  
   Round 10: ROUND 10, LIVE: every phone briefing, board and scene hint names a key.  
   Fix: Give the chip a pointer-aware label (or a second line) and add a pointer row to the title's ControlsHint, the way the board carries its own hints; optionally accept a pointerdown anywhere on the title root. Game case: BOTH.  
   Acceptance: At 390x844 in a touch context the title names a tap as a way to start, and a tap anywhere on the title root reaches the chapter select.

91. **PR-0105** [combat; ffx2]  
   Under Active, an enemy hit keeps the chained girl's command menu open; §1.5 says the hit closes it and applies Delay, and the deviation is not recorded  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Add a decisions.json entry that puts the §1.5 departure to Bailey, with the measured cost of each option, or implement close plus Delay under Active only.  
   Acceptance: A decisions.json entry names §1.5 and Bailey's answer, or a unit test shows an Active menu closed by an enemy hit with Delay applied.

92. **PR-0106** [combat; ffx2]  
   The same 'After her [N] turn' wording is read two ways in Leblanc's script, and the failsafe reading is not labelled  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Label the failsafe reading AUTHORED in the comment and the test name, or make it fire on the single turn 25+uses.  
   Acceptance: The comment and the test name the reading and its source line.

93. **PR-0107** [combat; ffx2]  
   Acts II and III open with every ATB gauge at zero, although they are separate battles  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Let a group flag its link as a separate battle, so it gets 'normal' randomised gauges while keeping carried HP and MP. Chapter 6 only; the chapter 5 chain is out of scope.  
   Acceptance: Across seeds 1-20, the first actor of Acts II and III varies and opening fills are between 0 and 60% of required.

94. **PR-0108** [combat; ffx2]  
   The Fast-speed Sleep rule from §1.5 is neither built nor recorded as left out  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Implement the rule (Sleep has no timed expiry at Fast), or record the omission as a decision.  
   Acceptance: A unit test at Fast shows Sleep persisting past its Normal-speed duration, or a decisions.json entry records the omission.

95. **PR-0069** [combat; FFX]  
   The possessed-aeon mirror does not mirror affinities, although the source comment says it does  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.  
   Acceptance: The comment and the code agree, and a unit test asserts whichever behaviour is chosen for one possessed aeon.

96. **PR-0054** [combat; FFX-2]  
   The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.  
   Acceptance: The comment at src/battle/ffx2/ai/vegnagun.ts distinguishes the two sourced fallbacks from the inferred one, or a source line is cited for the Break case.

97. **PR-0053** [combat; FFX-2]  
   A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Recover or re-derive the record before the next batch; do not repair anything on this entry alone.  
   Acceptance: The issue is either restated with expected, observed, repro and evidence, or closed as withdrawn.

98. **PR-0081** [feel; FFX-2 only]  
   Chapter 5 is 250 actions and 6:21 at FAST; the 5.15 s per action of round 08 does not reproduce (1.52 s per action on the candidate)  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: As round 08.  
   Acceptance: As round 08.

99. **PR-0114** [interface; both (shared board; FFX tile)]  
   the 'Coming' badge on the Seymour and Anima tile is overdrawn by its silhouette  
   Round 10: ROUND 10: carried.  
   Fix: Draw the badge above the silhouette layer, or inset the silhouette on Coming tiles.  
   Acceptance: The badge is unobstructed on both Coming tiles at 1600x900 and 2000x1012.

100. **PR-0119** [onboarding; FFX-2 only]  
   The chain coach mark covers the act-one-cleared dialogue card for about 2 s  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Suppress or queue coach marks while the story card layer is visible.  
   Acceptance: No coach-mark rect intersects the dialogue card in the seam frame sequence.

101. **PR-0120** [visual; both (seen in FFX-2)]  
   Results painting stops 100 px short of the right edge at 2000x1012  
   Round 10: ROUND 10, LIVE: re-observed at 2000x1012 in chapter 4.  
   Fix: Extend the portrait panel to the viewport's right edge rather than the stage's  
   Acceptance: Pixel at (1995,500) belongs to the painting at 2000x1012

102. **PR-0026** [interface; FFX only]  
   The Chapter 1 guide still leads with 'Haste is ctb x 8/16' (carried)  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: As round 08.  
   Acceptance: As round 08.

103. **PR-0027** [interface; FFX for the string; the guard is shared]  
   Unrendered markdown reaches the screen: 'the target *she* last picked'  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Drop the asterisks and reword 'gate' to 'counter'; if emphasis is wanted, let the panel's plain() helper turn a paired asterisk run into a span, and assert no rendered intent line contains an unpaired asterisk.  
   Acceptance: A visible-text sweep of all five chapters' intent panels finds no asterisk, underscore pair or backtick, and no 'gate' meaning a counter rule.

104. **PR-0037** [narrative; FFX observed; the same shape exists in the other chapters' midScripts]  
   Mid-battle beats hard-code speakers who are not in the active formation  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.  
   Acceptance: Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.

105. **PR-0083** [process; both]  
   Four source files were pushed further past the 400-line house limit by this batch  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Split the four at the next change that touches them, rather than as a separate refactor.  
   Acceptance: No file the next batch touches is over 400 lines when the batch lands.

106. **PR-0071** [delivery; both]  
   Two debug-API traps cost this round a day of coverage: battleLog() empties at teardown and autoBattle() silently does nothing before the first menu  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Keep the last battle's log readable after teardown (or make battleLog() throw once the battle is gone rather than return an empty array), and make autoBattle() either wait for the first menu or return false when it cannot take over. Then add the sentence to docs/DEV.md. Game case: BOTH — shared debug API.  
   Acceptance: A capture that calls battleLog() after the results card either gets the fight's events or an error, never a silent empty array; autoBattle() called on entry to a battle drives it or reports that it did not.

107. **PR-0034** [visual; FFX]  
   The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.  
   Acceptance: Re-pair the tile from a battle frame: the moon and the lit snow are present and the backdrop patch's mean luminance is within about 10 percent of the source painting's.

108. **PR-0036** [visual; FFX-2]  
   The FFX-2 party crowds the left third of the stage while two thirds of it is empty  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.  
   Acceptance: Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.

109. **PR-0028** [interface; both]  
   H does not hide the panels it is labelled for during battle  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.  
   Acceptance: Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.

110. **PR-0029** [interface; FFX]  
   Yu Pagoda A and B carry no always-on field marker  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.  
   Acceptance: In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.

111. **PR-0041** [interface; FFX-2]  
   FFX-2 items were unreachable through the command menu for 17 and 12 consecutive turns in the review's harness  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: None proposed until reproduced by hand. Reproduce with real arrow keys first; if the submenu does open for a human, fix the harness and say so.  
   Acceptance: A hand or scripted real-key run uses an item from the FFX-2 ITEM submenu in both FFX-2 chapters, or the defect is reproduced and traced.

112. **PR-0062** [process; FFX-2]  
   The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.  
   Acceptance: A named seed makes the shipped chapter 5 link 2 land Berserk on Yuna in White Mage, and the resulting turn is captured at 1600x900.

### Suggestion (3)

113. **PR-0149** [delivery; both]  
   A transient 5xx on a pose sidecar is not retried: the pose silently loses its scale, anchor and facing metadata  
   Round 10: NEW (prep/delivery auditor).  
   Fix: Retry once after about 500 ms on a 5xx or a thrown fetch in tryLoadMeta and tryLoadTexture.  
   Acceptance: A unit test with a fetch stub answering 503 then 200 gets the sidecar.

114. **PR-0044** [visual; both (15 of the 16 are FFX-2 dresspheres)]  
   16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.  
   Acceptance: Every manifest subject carries a facing and the per-formation sign assertion runs green.

115. **PR-0072** [visual; FFX-2]  
   Vegnagun has no ground contact and Paine stands inside its cannon barrel  
   Round 10: ROUND 10: carried, not re-examined on live this round. Dependency argument: the live build is main 5ddfde3 (e9b9bed only adds the deploy record; git diff 5ddfde3..e9b9bed -- src research tests public index.html is empty) and the live artifact-manifest.json (7093e5c3..., 896 files) equals critic/artifacts/5ddfde3.json, so this is the code and bundle round 09 reviewed as a candidate. No repair has landed in this build, so the round-09 finding stands.  
   Fix: Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.  
   Acceptance: At 1600x900 a contact shadow is visible beneath Vegnagun and no party billboard intersects it, on the first command frame and at target selection.

## Resolved, re-verified on live

- PR-0085: Still fixed on live: the production artifact is live and byte-identical to its recorded manifest.
- PR-0091: Still fixed on live: overlap 0 px at every seam in chapters 5 and 6 at 1600x900, 2000x1012 and 390x844, including the confirmer's run.
- PR-0089: Still fixed on live: current.gain 1 at every pre-scene and battle-first-menu sample; fades in seconds.
- PR-0090: Still fixed on live: the intent panel shows by default in FFX-2 and as a chip in FFX (its side effects are PR-0122, PR-0123 and PR-0146).
- PR-0086: Still fixed on live: White Wind heals Leblanc 175 and Ormi 164 and dispels Armor Break in the real-input log.
- PR-0093: Still fixed on live: the Syndicate stands at party scale in all three links at 1600x900 and 2000x1012.

## What stands between this build and acceptance

- Every category is below 9.0, and audio has no verified score (Bailey's listening verdict, and his D-026 pick).
- 52 open majors, led by PR-0122 (the one regression), PR-0148, PR-0142, PR-0143, PR-0125 and PR-0082.
- Chapter 3 has no real-input win (PR-0082), so not every encounter completes its real flow.
- 12 required targets failing and 5 waiting on a decision.
- Mandatory checks failing (CHK-001 to CHK-015, CHK-020, CHK-021, CHK-023) or unverified (CHK-022 ch3, CHK-024, CHK-B1).
- STALLED areas owe a RUBRIC §8 method check first: PR-0007, PR-0008, PR-0021, PR-0061; categories feel, narrative, onboarding, prep and delivery (no gain across rounds 09 and 10).

## What changed since round 09

Round 09 reviewed the same code (5ddfde3, bundle Jw5R1yWQ) as a production candidate and held it on PR-0122. It then went live under the owner override. This round judged the live artifact: identical to the candidate but for .nojekyll. No repair landed, so no category could gain; interface drops 7.3 -> 7.0 and visual 7.6 -> 7.5 and combat 8.5 -> 8.4 because defects on the same code were newly established (PR-0142, PR-0143, PR-0144, PR-0150, PR-0126 widened), not because anything regressed. New since round 09: a live real-key chapter 5 win (replacing a weak reuse), loss routes in chapters 2 and 4, the cause of PR-0005 (turn cut-in has no caller), fresh captures at six more screen shapes, and PR-0065's cold-launch widening withdrawn after serial runs. Rounds 02 and 03 were scored under rubric v1 and are not compared.

## Proposals (nothing here is built without Bailey's yes)

- P-09-3 (carried): show Bailey 2 to 4 options for the Dr. Goon and Fem-Goon paintings and Brother's portrait, beside the identity-LoRA Leblanc pose B and an Ormi re-rendered from his idle (closes PR-0092, PR-0096, the Brother half of PR-0058).
- P-09-4 (carried, now tied to PR-0148): after Bailey picks the D-026 sound from the audition, 2 or 3 short sketches for a Chateau Leblanc scene cue and a Syndicate boss cue (PR-0099).
- P-09-5 (carried): stop listing 390x844 as supported until the phone layout has an approved target (PR-0001, PR-0017, PR-0098, FOC-06, PR-0113 wait on it).
- P-09-6 (carried): two mock frames asking whether the intent panel should open by default in FFX-2 while FFX starts collapsed (CHK-020 parity).
- P-09-7 (carried): two options for post-battle scenes (PR-0133): stage them on the battle stage, or one painted still per reveal beat; a faked frame of each first.
- P-10-1 (new): ask Bailey whether FFX-2 Steal and Pilfer Gil should be built per ffx2-combat-core §3.2 (chapter 6's Grenade loop) or hidden until a later season (PR-0143).
- P-10-2 (new): per-act backdrops for chapter 6 (three chateau rooms) versus rewording the seam line (PR-0147); options to Bailey before any art.
- P-10-3 (new, narrative R10-FN-03): chapter VI is the canonical prequel to chapter IV's alliance; offer a dossier tag such as 'Before chapter IV' or a reorder of the FFX-2 group. Bailey decides.

## Next review

The deep obligation of 5ddfde3 stays pending after this report: three mandatory items are UNVERIFIED (CHK-B1, CHK-022 for chapter 3, CHK-024's same-origin upgrade). It carries fd0ae96, 8f48237 and 1b33971, so the next deploy will again meet the deep-owed cap and need the owner's words or a settled deep review. Next: a repair candidate from main (c01742b Doublecast, 59b348a3 intent pause and odds, and whatever else lands) gets its focused review before its deploy, with a real-key re-run of the pause matrix in both games (Esc, every tab, H, resume, and the FFX chip then Enter) and a real-key chapter 3 route; then live verification, including the CHK-024 AFTER half on the staged profile. Ask Bailey for the D-026 audition pick and the CHK-B1 listen when he is home. RUBRIC §8 method checks are owed before further batches on PR-0007, PR-0008, PR-0021 and PR-0061, and for the feel, narrative, onboarding, prep and delivery categories (no gain across two reviews).

## Addendum (gap captures)

Written 2026-09-23 after the report above, on the same live build: main 5ddfde3, bundle `index-Jw5R1yWQ.js`, https://baileypillon.github.io/pyrefly-reprise/. Both captures ran in a GPU Chromium (`PYREFLY_BROWSER=gpu`, renderer "ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti ... Direct3D11)") with Playwright keyboard input. `window.__pyrefly` was used only to read state (screen, snapshotState, battleLog, seed, audioDebug). Nothing was injected and the seed was not pinned. Neither capture logged a console error or a 404. The evidence folders stay local, because `critic/rounds/*/` is gitignored.

### CHK-022, chapter 3 (braskas-final-aeon): PASS

- **Route.** On a fresh profile: title, chapter select (card III chosen with the arrow keys), party prep, the pre-battle scene (skipped by holding Enter), then the battle. The line was the guide's minus the menu Doublecast: when the card said Doublecast, Lulu cast Firaga once, directly on the boss (41 times). The run logged 0 Doublecast events and 0 self-casts. This route avoided PR-0125; it did not test it. PR-0125 stays open on live.
- **Attempt 1: defeat.** It ran 258 commands over 22.6 minutes, with Braska's Final Aeon at 13,882 HP. The defeat reached results (Defeat, NEVER CLEARED, attempts counted), and RETRY led to prep and then battle.
- **Attempt 2: victory.** The party cleared all seven links (Braska's Final Aeon, the five possessed aeons, Yu Yevon) in 284 commands, 21:11. Two Bushido and two Swordplay minigames were cleared with keys. The route after the win:
  - the post scene;
  - results (Victory, NEW BEST, 0 AP and 0 gil, which match the source);
  - CONFIRM;
  - the Auron sending and the Tidus epilogue, read line by line;
  - chapter select with the III check mark.
- **After a reload.** The save still holds `cleared: true`, `bestTimeMs` 1,271,844 and 2 attempts.
- **Evidence.** In `critic/rounds/round-10/evidence/gaps/chk-022-ch3-live/`: `run.json`, `run.log`, `a2-turn-log.json` (turn log), `a2-battle-log.json` (event log) and JPEGs of the win (`a2-40-link7-result.jpg`), the aftermath (`a2-50-post-scene.jpg`, `a2-70-epilogue.jpg`), the results (`a2-60-results-victory.jpg`) and the board after the reload (`a2-81-chapter-select-after-reload.jpg`). A harness bug named the link-result JPEGs `[object Object]`; they have been renamed, and `run.json` records the rename.
- **What it closes.** The chapter 3 remainder of PR-0082. Every included chapter now has a real-input win on live.
- **New observations, for the next batch (not yet filed as issues).**
  - The saved `bestTurns` is 15, which is the final link's count, not the 284 commands. `BattleScreenFlow` records `outcome.result.turns` from the last engine of the chain. Chained chapters (3, 5, 6) under-report best turns. Minor; it applies to both games.
  - After the win and the epilogue, chapter select highlights chapter I rather than the chapter just cleared.

### CHK-024, the save upgrade on the same origin: PASS

- **Part A: old-format save on a fresh profile.** A fresh profile on the Pages origin was given a save in release 08's format, with the fields and order of `git show 1b33971:src/app/SaveData.ts`. It held clears in chapters 1, 2 and 4, attempts in chapters 3 and 5, `ffx2Atb: 'active'`, volumes 60/30/50, text speed 1.5x and seven coach marks. After the reload:
  - every chapter record and setting was unchanged except the one-time flip to `wait` with `ffx2AtbMigrated: true`;
  - the mixer applied 0.6/0.3/0.5;
  - the board showed the clears and BEST 10:12;
  - the engine ran Wait.
  Boot alone leaves storage untouched. The marker reaches disk with the first save write. Setting X-2 BATTLE to ACTIVE in the pause with real keys held on disk, in memory and in the Options row through two reloads and a browser restart.
- **Part B: the real release-08 profile.** A copy of the round-09 profile, whose save the live release-08 build wrote itself, gave the same result: 0.8/0.7/0.9 kept, progress kept, one flip to Wait, and ACTIVE held.
- **Part C: truncated storage on live.** The game booted to the title and chapter select on defaults, with no page error.
- **Carried from round 09, as labelled.** Round 09 still covers reloads mid-battle and on results, and malformed types. The UI has no reset flow.
- **Evidence.** In `critic/rounds/round-10/evidence/gaps/chk-024-live/`: `part-A/`, `part-B/` and `part-C/` (`run.json`, `localStorage-*.json` snapshots, JPEGs), and `harness/chk024.mjs`.

### Effect on this report

- **round-10.json.** CHK-022 (braskas-final-aeon) and CHK-024 are now PASS, with the evidence above. The braskas-final-aeon encounter now reads `completedRealFlow: true`. Both items are gone from `coverage.requiredNotTested`, and **CHK-B1** (Bailey's listening verdict) is the only item left there. The verdicts do not change: deployment PASS, changed area FAIL, ship HOLD. `node tools/critic-score.mjs` still reports "valid evidence".
- **The deep obligation.** It stays pending on CHK-B1 alone. `critic-clear` refuses while a required item is untested and a mandatory check is UNVERIFIED. Its output is recorded below.

`node tools/critic-clear.mjs --report critic/rounds/round-10.json` (2026-09-23, exit 2, verbatim):

```
  still pending live: mandatory checks are UNVERIFIED: CHK-B1
  still pending focused: mandatory checks are UNVERIFIED: CHK-B1
  still pending deep: required coverage was not tested: CHK-B1: Bailey's listening verdict on this mix (he is away; no agent can hear).
```

Nothing was settled, and `critic/pending/5ddfde3.json` is unchanged. All three obligations of 5ddfde3 (live, focused, deep) now wait only on Bailey's CHK-B1 listen. Once he records it, re-running `critic-clear` on this report should settle them. The changed-area result would then be FAIL, recorded as FAIL.
