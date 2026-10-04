# Round 21: deep review of the live build 6461999e (release 38)

```text
Build / artifact / target version: main 6461999e, bundle DHaa2xD1, artifact eca5b98a7062... (critic/artifacts/6461999e.json (1933 files, 797683098 bytes, decodeChecked true)); targets.json sha256 b5933731...
Review: deep (round 21; rubric v2; headless Playwright PYREFLY_BROWSER=gpu, ANGLE RTX 5070 Ti, no fallback needed; judged on the LIVE site)
Deployment: PASS (exact artifact verified live, verify-live PASS at 46 and 1,053 files; 0 console errors and 0 non-2xx in 97 of 98 capture jobs)
Changed area: FAIL (release 38's changed systems did not all meet their targets: advisor card only in Ch III and FFX-2 Ch IV, dressphere push-in never seen, new overlays have no phone or key legend)
Ship: SHIP, no critical defect and no major regression against live 37.1; round 20's HOLD cause (Trigger Happy) fixed on five devices. Majors this release discloses: PR-0148, PR-0269, PR-0360, PR-0340, PR-0270, PR-0099, PR-0361, PR-0222
Milestone: not assessed
Quality: PROVISIONAL, no verified weighted score: the audio category is UNVERIFIED (no numeric owner listening verdict, CHK-B1) and is never averaged away or scored zero; nine categories scored (see below); no earlier rubric-v2 round has a full verified score either
Targets: required 89 / matched 70 / failing 0 / unverified 19 / waiting on decision 7
Top issues: PR-0148 (owner listening verdict), PR-0269 (Ch XVII card 48.5 percent), PR-0360 (phone cannot answer Bushido or Swordplay), PR-0340 (Lady Luck unreachable), PR-0270 (TEXT SIZE FFX-2), PR-0099 (stand-in music cues), PR-0361 (Bushido keys unnamed), PR-0222 (FF7 hold); next correction for each is in the issue list
Coverage: tested 10 groups; reused 8 with written dependency arguments; not tested and required: 13 items (listed below)
Next required review and why: a focused review of the next candidate (phone Overdrive capture, Paine Thief and push-in capture, human-paced Trema and Den); the live build 6461999e still owes the required coverage below, so its deep obligation stays pending (see Score and settlement)
Elapsed review time / repeated work avoided: about 273 minutes wall clock from the capture owner's start; no round-20 frame reused as evidence; CHK-024 matrix and the audio save half reused with dependency arguments
```

## Verdict notes

- **deployment**: PASS: the exact artifact (eca5b98a..., bundle DHaa2xD1) is what is live (verify-live PASS, 46 and 1,053 files, 0 mismatched, run by the live check and again by the prep-delivery auditor), and 98 capture jobs plus 3 re-runs loaded and played it with 0 console errors and 0 non-2xx in 97 of 98 (the one exception, the Braska long run's two connection resets and a 30 s reload timeout on a saturated host, was re-run clean).
- **changedArea**: FAIL: release 38's changed systems did not all meet their targets. Met: the Trigger Happy fix on five devices (round 20's HOLD cause), Bushido plays the chosen Overdrive (six live runs and the gap pass), skill travel, the FFX-2 run-in, the Flux and Braska telegraph holds, Chapter II and VIII restaging, Evrae E1-H, painted wings (with a seam), the title rename and key art, the GUIDE'S PICK tag removal, exact lossless-WebP shipping, Rikku Warrior and Yuna Thief art. Not met or not seen: the advisor card keeps its lines only in Ch III and FFX-2 Ch IV (PR-0330), the D-346 dressphere push-in was never seen in 7 captured changes (PR-0314), Paine Thief and the Ch IX hurried arrival were not captured, and the new overlays have no phone or keyboard legend (PR-0360, PR-0361).
- **ship**: SHIP under RUBRIC section 3: no critical defect was found; no critical or major issue is a regression against live 37.1 (the two new majors, PR-0360 and PR-0361, are gaps that 37.1 shared, and PR-0361 sits inside the new chosen-Overdrive feature); and round 20's HOLD cause, FOC37-02, is fixed and verified on five devices. The build is already live, so this verdict says it is better than release 37.1, which it replaced.
- **milestone**: not assessed (deep review)

Ship reasons:
- SHIP: no critical defect found (every encounter reached an outcome through real input, the exact artifact is live, no save path changed) and no critical or major issue is introduced-and-regressing against live 37.1.
- Round 20's HOLD cause is gone: Trigger Happy (FOC37-02) registers 3 of 3 presses on keyboard R, PageDown, mouse click, touch tap and pad R1 with the overlay naming the device (MASH R, CLICK, TAP, R1); Enter honestly counts 0 and the overlay never offers it.
- Measured gains against 37.1: Bushido and Swordplay play the chosen Overdrive (PR-0308 content half), skill travel lands the numeral with the hit, the FFX-2 run-in plays, Chapter II and VIII staging, Rikku Warrior and Yuna Thief painted with 0 art 404, Evrae painted, painted wings, the title rename, exact lossless-WebP shipping, 1,253 A/B and bench comparisons with 0 differences.
- New majors are gaps, not regressions: PR-0360 (a phone player cannot answer a Bushido or Swordplay; 37.1 had no touch path either) and PR-0361 (glyph-only legend on the Bushido overlay, plus one unlabelled new key, K for Square; inside the new feature). Both disclosed and carried into the next batch.
- Disclosed majors that are not regressions: PR-0148, PR-0269, PR-0340, PR-0270, PR-0099, PR-0222 (carried and stalled, see the list); changedArea FAIL and ship SHIP are separate verdicts.

Disclosed in the release announcement (critical and major, none is a regression):
- PR-0148 (major): (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)
- PR-0269 (major): (carried, unchanged, still open): Chapter XVII's advisor card chain wins 48.5 percent; Genais's Sigh on link 3 is the largest loss
- PR-0360 (major): (new; R21-CE-01, confirmed): the FFX timed Overdrive overlays (Bushido, Swordplay) have no touch or pointer path, so a phone player can only ever resolve them as the Fail row
- PR-0340 (major): (carried, unchanged): Lady Luck's reels, Dud and the Samurai payload records ship but no shipped FFX-2 Garment Grid or dressphere list offers them, so no player can reach them
- PR-0270 (major): (carried, FOURTH review, STALLED): TEXT SIZE grows nothing in the FFX-2 battle HUD
- PR-0099 (major): (carried, STALLED): chapter rows in THEMES.md still play a stand-in cue (VI, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII)
- PR-0361 (major): (new; R21-IF-01, confirmed): the Bushido sequence overlay names PlayStation glyphs only, so keyboard and touch players are never told which key is which, and release 38 adds a Square chip (key K) that is named nowhere
- PR-0222 (major): (carried, unchanged, not captured): the fix for the hidden FF7 fight's black hold on a cold cache is still not observed

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
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-016 is UNVERIFIED
  - mandatory check CHK-023 is FAIL
  - mandatory check CHK-015 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-012 is UNVERIFIED
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-B1 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - 8 critical or major issue(s) remain open
  - encounter ffx2-ch13-trema has no complete real-input flow
  - encounter ffx2-ch15-den-of-woe has no complete real-input flow
  - 19 required target(s) unverified
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
  - human judgment not recorded: Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
  - human judgment not recorded: Combat (FFX-2): should Lady Luck be reachable (a grid node for its owner) or ship dormant (PR-0340); should the reels be timed by the press (PR-0349)
  - human judgment not recorded: Swordplay: yes to the estimates in research/ffx-combat-core.md 5.3 (zone 22/16/12/9 percent, marker 1,400/1,150/900/700 ms), or wait for sourced numbers (a four-row edit, PR-0308)
  - human judgment not recorded: Overdrive inputs: check the Bushido order against the Steam HD copy (D:/Tools/ffx-hd) so the "our estimate" label can go (PR-0308); and how a phone player answers a Bushido or Swordplay (PR-0360, PR-0361)
  - human judgment not recorded: Encounter: is Trema (6.5 percent per attempt) and Den of Woe (24 percent first try) the intended difficulty at human pace (PR-0227, PR-0306, PR-0353)
  - human judgment not recorded: Feel: is a plain FFX-2 Attack of 1.2-1.7 s with the run-in the rhythm he wants; do the telegraph hold (1.14 s, paintings not yet installed) and the 1.22x dressphere push-in read as enough (PR-0368, PR-0314; CHK-B2)
  - human judgment not recorded: Visual: taste on the new paintings (Evrae E1-H, the plate wings, the Yuna, Rikku and Paine dresspheres) and the Echoes of Spira wordmark (CHK-B3)
report: valid evidence
```

The code, not the chief critic, computes the total and the gates. With the audio category UNVERIFIED the score is provisional and no number is printed; no category is at or above the 9.60 target and six are below the 9.0 floor.

## The ten categories (round 20 -> round 21)

| Category | Weight | Round 20 | Round 21 | Status |
|---|---:|---:|---:|---|
| combat | 20 | 9.2 | 9.3 | scored |
| encounter | 10 | 8.9 | 8.9 | scored |
| visual | 15 | 8.8 | 8.9 | scored |
| feel | 10 | 8.6 | 8.7 | scored |
| narrative | 10 | 9 | 9 | scored |
| audio | 10 | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| interface | 10 | 8.2 | 8.3 | scored |
| onboarding | 5 | 8.6 | 8.5 | scored |
| prep | 5 | 9.1 | 9.1 | scored |
| delivery | 5 | 8.4 | 8.7 | scored |

### combat: 9.2 -> 9.3 (scored)

CHIEF (round 20: 9.2): 9.3 (+0.1), accepts the combat auditor. The gain is player-facing and now verified by real input: each Bushido plays its own sourced length and order (the gap pass typed Banishing Blade 7 and Tornado 6 through the live OVERDRIVE menu; Shooting Star 7 and Dragon Fang 8 were typed in six capture runs), Swordplay reads its params, and Trigger Happy delivers the human press count through all five advertised devices (3 hits on R, PageDown, mouse, touch tap and pad R1). 1,253 A/B and bench comparisons and 15 full replays show no regression; the unit suite passes (798 files, 11,754 tests). Held below 9.5 by PR-0340 (major, Lady Luck still reachable by no player, stalled), PR-0269 (major, Ch XVII card 48.5 percent, stalled), the Swordplay tier numbers still unsourced, and a Fail-row-only path for phone players (scored under interface as PR-0360, not deducted here).

AUDITOR EVIDENCE: Round 21 combat auditor, build main 6461999e (bundle DHaa2xD1); src byte-identical to 6461999e (git diff 6461999e..HEAD -- src is empty). NO BROWSER (pure engines, seeded benches, unit suite, capture owner's battle logs and run.json). Scratch and outputs: critic/rounds/round-21/combat/. SCORE 9.3 (round 20: 9.2; gain +0.1). WHAT CHANGED IN COMBAT (git diff cd9dbbb0..6461999e, src/battle + src/data + research): exactly four code/data files, all FFX only: src/data/ffx/overdrives/inputs.ts (new: BUSHIDO_SEQUENCES, SWORDPLAY_TUNING), overdrive-auron.ts and overdrive-tidus.ts (each ability now publishes extra.minigameParams), src/battle/ffx/overdrive.ts (minigameParams no longer hard-codes 7 inputs / travel 1400 / zone 22; rollDefaultMinigame draws within the Overdrive's own length). Everything else in release 38 is presentation (skill travel, run-in, PlaceOwner, restaging, telegraph hold, push-in, art) and touches no engine state. DATA AUDIT AGAINST research/ (typed my own oracle in physical-button words, did not read src/data): Dragon Fang 8 inputs ending Circle, Cross (D2 verified 4 sources, D3 NA/JP order); Shooting Star 7 = Triangle, Circle, Square, Circle, Left, Right, Cross (GF-KB as recorded in D3); Banishing Blade 7 = Up, L1, Down, R1, Right, Left, Triangle (every source agrees); Tornado 6 = Cross, Right, R1, Left, L1, Triangle (NA/JP; GF-KB's 5 is the recorded dissent) with the 3,000 ms timer (D-312). All four match what the research says; the ORDER is labelled 'our estimate' in code, research note and handoff (Bailey's 'all your recommendations', GameFAQs preferred), consistent with AGENTS rule 6. Swordplay: every tier keeps today's pair (12.22 percent zone, 1,059 ms crossing = 22 px on 360 px at 340 px/s, equal to what the overlay always drew), the sourced ordering (stronger tier, narrower zone, faster marker, shorter timer) is NOT built because no source publishes the numbers; timers 3000/3000/2600/2200 already follow the ordering. Row data unchanged and re-checked: od-rows-probe byte-identical to round 20 (fail rows 16/24/28/15, immune rows 19/27/30, Tornado success row 20x2, Blitz Ace 4x8 + 24 finisher, immunity per boss). DEPENDENT TESTS: full unit suite on this tree: 798 files passed, 5 skipped, 11,754 tests passed, 46 skipped, 1 todo, 0 failed, exit 0, 781 s (critic/rounds/round-21/combat/vitest-full.txt), including ffx-overdrive-inputs, ffx-overdrive-overlay-title, ui-ffx2-trigger-happy-input and zz-ctb-sourced equivalents. OWN ORACLE (bushido-oracle.test.ts, 16 tests, real overlay, real KeyboardEvents and a polled standard-mapping pad): each Bushido shows its sourced chip count and completes with its research order on keyboard and pad; the International order from the baseline table does NOT complete the shipped Dragon Fang, Shooting Star or Tornado; a wrong press starts over and a full re-entry still succeeds inside the timer; auto-resolve draws 0..len-1 on failure and len on success for every Bushido. REAL-KEY RUNTIME (CHK-023, capture owner run.json minigames, chips read off the screen and typed): Shooting Star played in Yunalesca (x2 per run), Omnis, Sin Face and both Sin Fins runs with the new 7-chip order (correctInputs 7, success, engine received it); Dragon Fang (8 chips) in Sin Face and Sin Fins long; Swordplay Spiral Cut with zoneWidth 12.22 and 1,059 ms params in the Sin Fins runs. Banishing Blade, Tornado, Slice and Dice, Energy Rain and Blitz Ace were never played in any capture (UNVERIFIED in the real flow; covered by the oracle on the real overlays). TRIGGER HAPPY (FFX-2, the 37.1 fix, never captured in round 20): th21 matrix on live, real input, Chapter VI Yuna Gunner, 3 presses: keyboard R, PageDown, mouse click, touch tap and pad R1 each deliver {hits:3} to the engine and produce exactly 3 damage events (12,17,17 / 7,11,11 as the chain climbs, research 2.9.1/1151); Enter delivers hits 0 and one shot (Enter is not the bound button and the overlay names the right one: MASH R / CLICK / R1 / TAP). This closes the engine half of R20's FOC37-02. NO REGRESSION, MEASURED: (a) A/B digests, same driver on cd9dbbb0 (git archive) and 6461999e, 120 seeds, sha256 of every link's event log: FFX-2 Ch IV, V, VI (Wait, D=0), Ch XI intended and wrong, Ch XV intended and wrong, Ch XIV sensible and naive, Ch XIII intended = 10 families, 1,200 runs, 0 digest differences. (b) FFX three-line bench (intended / advisor card / mash, 9 chapters, seeds 1-40 plus 40 large seeds, autoResolve on, so Bushido and Swordplay are drawn through the changed rollDefaultMinigame): all 53 rows byte-identical to round 20, so the changed draw does not move the RNG stream. (c) Ch XVII card chain A/B on 200 seeds: 97/200 on both trees (PR-0269 unchanged). (d) Replay of this round's real-key FFX command streams through the pure engine at the recorded seed with autoResolveMinigames false: 15 of 17 identical event for event with the same outcome (Flux win x3 incl. gamepad and reduce-motion runs, Flux loss x2, Flux phone defeat x2, Yunalesca defeat x2 incl. Shooting Star twice, Anima, Evrae x2, Yojimbo, Natus, Omnis incl. Shooting Star); 2 are identical to the end of the live log, which the capture cut early (Flux lose-clips 42 of 48 events; Sin Face 426 of 427 with Dragon Fang and Shooting Star inside); retry attempts 2+ are not logged (UNVERIFIED). (e) Own probes re-run: Lady Luck pay table (216 stops x 2 sets), Dud boundaries, payload constants, Bulwark immunities, link-3 rows, gap grid: byte-identical to round 20. (f) CTB sourced test (ICV table, Haste floors, Slow doubles, MITIGATION chain vs BigInt) passes. CHK-021 game separation: 0 atb / spherechange events in 23 FFX logs and 0 ctb / overdrive-gauge / minigame events in 16 FFX-2 logs; BUSHIDO_SEQUENCES and SWORDPLAY_TUNING are imported only by the two FFX ability files. WHY NOT HIGHER: PR-0269 (major, Ch XVII card chain 48.5 percent, Genais's Sigh 60/200 losses on link 3) and PR-0340 (major, Lady Luck reels and the Samurai payloads still on no shipped grid: gap-grid.json shows no grid or dressphere list offering them, 0 reel events in 16 FFX-2 logs; the r38-lady-luck-grid lane is not in this build) are unchanged; Swordplay's tier numbers are still owed (no source); Banishing Blade and Tornado have never been seen in a real run; a suspected touch gap in the FFX timed overlays (R21-CE-01, scored under interface, cross-reference only); polish carried (PR-0349, PR-0350, PR-0351, PR-0273, PR-0217). WHY +0.1: PR-0308's content half is fixed and verified live by real keys (four Bushidos play their own length and order, Swordplay reads its params), the Trigger Happy human count is proved through every input device, and 1,253 A/B and bench comparisons plus 15 full replays show no regression.

### encounter: 8.9 -> 8.9 (scored)

CHIEF (round 20: 8.9): 8.9, held. No encounter data, AI script, phase rule or party preset changed in release 38; the fresh 26-value HP sample matches research/*.md; the three-line bench is byte-identical to round 20. Trema (0 of 25 over rounds 19-21 against a shipped 6.5 percent per attempt) and Den of Woe (1 of 18 against 24 percent first try) are questions for Bailey and a harness limit (PR-0227, PR-0306), not engine defects; the Chapter III gauntlet length (PR-0257), Sin's undecided difficulty (PR-0279) and the Chapter XVII card (PR-0269) stand. Victory flows for Ch XIII and XV are UNVERIFIED for the fourth and third round (CHK-022): evidence-incomplete for the milestone gate, not a deduction here.

AUDITOR EVIDENCE: Held at 8.9. NO BROWSER; seeded benches, shipped-chapter benches, capture owner's real-key outcomes. No encounter data, AI script, phase rule or party preset changed in release 38 (git diff cd9dbbb0..6461999e -- src/data src/battle shows only the four Bushido/Swordplay files; Chapter II restaging is presentation only, Chapter III staging stays off). Fresh sample of 26 boss and add HP values from the data dump against research/*.md (Flux 70,000, Yunalesca 24,000 of 132,000 split 24/48/60, Braska 60,000, Evrae 32,000, Yojimbo 33,000, Natus 36,000, Omnis 80,000 [GameFAQs' 60,000 is the recorded conflict], Sin fin 65,000 / Sin 140,000, Grothia 8,000 and the rest): all present with their source notes; round 20's 29-value sample is not reused. THREE-LINE BENCH, wins / 40 intended | advisor | mash (53 rows, byte-identical to round 20): Flux 18|19|0, Yunalesca 40|38|0, Braska 39|39|0, Macalania 38|37|0, Evrae 40|40|0, Yojimbo 33|40|0, Natus 31|38|0, Omnis 27|24|0, Isaaru 40|40|0 (mash 0/40), Sin Face 12|15|0; so canonical tactics win and credibly wrong play loses, nothing is penalised for being strong. FFX-2 A/B families on 6461999e, 120 seeds, bench speed (autopilot ceiling): Bahamut 120, Vegnagun 112, Leblanc 120, Fallen Aeons intended 105 vs wrong 74, Ixion sensible 119 vs naive 51, Den intended 9 vs wrong 0, Trema intended 0 (digest-identical to cd9dbbb0). Shipped-chapter benches re-run now (PYREFLY_MEASURE=1, 200 seeds): Ch XV Den of Woe as shipped, live Wait split 1.5/0.5 s: first try 48/200 (24 percent), within 3 tries 127, within 5 tries 162, Active 1.5 s 18/200 (identical to round 20); Ch XIII Trema as shipped: Paragon link 28/200 (human split) / 26/200 (bench), Trema fresh 170/200, whole chapter 13/200 (6.5 percent) human split, 14/200 bench (identical). Sin: card 97/200, sensible 51/200, naive 0/200 on both trees. REAL-KEY OUTCOMES this round (index.json, run.json): victory in Ch I (seed 1; also gamepad and reduce-motion), VII, VIII (x2), IX, X, XII, XIV, XVIII, FFX-2 IV (also phone and gamepad), V (on the quiet re-run, 144 turns; the first run lost on a saturated host, OBS-05), VI, XI, XVI, and Ch II (seed 4001 after five defeats, 58 min), Ch III and Ch XVII on the long-budget re-runs (the short budget stalled at link 3, the PR-0339 harness pattern). Losses: Trema 0 of 7 attempts this round (seeds 1, 1001 and the five-attempt run), 0 of 25 over rounds 19-21 against a shipped bench of 6.5 percent per attempt (P(0 of 25) about 0.19: consistent with the design, so a question for Bailey, not a defect); Den of Woe 0 of 7 this round, 1 of 18 over rounds 20-21 against 24 percent first try (P(1 or fewer) about 0.05: a mild shortfall that the route's pace may explain). WHY HELD: nothing improved or regressed here; the Chapter III gauntlet (220 and 204 real-key turns, about 2.3x the sourced rows), Sin's undecided difficulty (D-282) and the Trema and Den human-pace questions are carried unchanged. Victory flows for Ch XIII and Ch XV are UNVERIFIED for the fourth and third round in a row (CHK-022); that is evidence-incomplete for the milestone gate, not a score deduction here. Scored on what ran; Bailey's call on Trema's and Den's intended pace remains the open human judgment.

### visual: 8.8 -> 8.9 (scored)

CHIEF (round 20: 8.8): 8.9 (+0.1), accepts the visual auditor, now supported by the confirmer: Rikku Warrior and Yuna Thief both render as painted figures with 0 art 404 (PR-0311 resolved; Paine Thief's live look is a coverage gap, not a defect); Chapter II and VIII staging closed; Evrae E1-H reads as a painted serpent in every window shape; painted wings fill the 21:9 void. Held below 9.0 by PR-0334 (white twirl-start rectangle in 7 of 7 changes), PR-0364 (run-in crop), PR-0365 (hidden Omnis disc), PR-0366 (HUD slabs over actors), the Ch III crowding (PR-0310 polish) and the wing seam (PR-0344). No defect found is critical. Protected art: approved 711 ok, judge-locked 48 ok, 0 mismatched, 0 missing (verify-approved).

AUDITOR EVIDENCE: Visual and targets auditor, deep round 21, LIVE build main 6461999e bundle DHaa2xD1. I opened no browser and started no server; every judgment is from the capture owner's round-21 evidence (critic/rounds/round-21/evidence, mode gpu = PYREFLY_BROWSER=gpu headless Chromium on the RTX 5070 Ti, HeadlessChrome 153; 98 jobs, 0 console errors, 0 404s on every completed job), plus ffmpeg frame extraction from the saved clips and PIL crops, all under critic/rounds/round-21/vis/.

PROTECTED ART. node D:/Tools/pyrefly-lora/tools/verify-approved.mjs: approved ok 711, mismatched 0, missing 0; judge-locked ok 48, mismatched 0, missing 0 (round 20: 586 / 48). The 125 additional approved files are the new paintings; none differs from its hash.

WHAT I READ: all 18 chapters' clean first menus at 2560x1440 (18 frames, tiled 4-up at 1100 px, plus full-size reads of Flux, Evrae, Yunalesca, Braska, Yojimbo, Bahamut, Leblanc and Omnis crops), the window shapes 2560x1080 (Ch IV, XV, VIII, II), 1440x900, 1024x768 (Ch I, VIII, IV) and 4K (Ch IV, I), phone 390x844 touch (Ch I, IV), the Leblanc, Den of Woe, Vegnagun and Trema spherechange clips and sequences, the Leblanc attack clip (FFX-2 run-in), Yunalesca attack and overdrive clips, the Yojimbo ability-travel and boss-special clips, the Evrae mid-fight sequences, and 98 target composites (94 remade from the round-20 pairing with the round-21 captures plus the 4 Vegnagun and board pairs remade from the again run; critic/rounds/round-21/targets/pairs.json, 16 contact sheets read).

RELEASE 38 FINDINGS. (1) Chapter II restaging (PR-0310, FFX only): Yunalesca and the party are now clearly separated at rest, 2560x1440 and 2000x1012; Chapter VIII is also clear (Rikku stands next to the coil, no interpenetration, at 2560x1440, 2560x1080, 1440x900 and 1024x768). Chapter III (staging deliberately off, Bailey's pick) still crowds Auron in front of the Yu Pagoda base and the party against the boss's sword: carried. (2) Evrae E1-H paintings and stand-back (D-360): the coil reads as a painted serpent in every shape from 1024x768 to 2560x1080, no rail clipping seen; one hurt crossfade frame shows Evrae as a two-head ghost (low-confidence polish). (3) Skill travel: Lulu's Fira is a bolt that crosses the field and the number waits for the landing (Yojimbo clip); Yojimbo's Kozuka dash and the FFX-2 run-in with a motion trail are readable. (4) FFX-2 Rikku Warrior is painted (Trema first menu 2560x1440; rikku-warrior idle, ready, attack, cast, item and hurt all load, 0 404): the round-20 major's Rikku half is fixed. Yuna Thief and Paine Thief in battle were never exercised by any route, so PR-0311's Yuna half is UNVERIFIED, not closed. (5) Painted plate wings (D-343, FFX-2 Ch IV, XV): no void and no mirrored lantern at 2560x1080, but the strips meet the plate at a hard, slightly tilted vertical seam on both sides and carry a bright lantern at the very edge (polish). (6) Bahamut's head reads (not blown out) at 2560x1440 and 2560x1080; the cyan rim fringe on the wing cut-outs is visible in the 2560x1440 boss crop. (7) Dressphere shot: Vegnagun Paine plays the full push-in close-up with the HUD hidden; Leblanc Paine (1600x900), Den of Woe Yuna and Trema Paine stay on the wide frame, and the PR-0334 hard-edged white rectangle with pink flecks is still at the twirl start in all four (Leblanc, Den, Trema, Vegnagun). (8) New: during Rikku's run-in at Leblanc 1600x900 the camera follows her and Yuna is cut off at the left frame edge for about 1 s. (9) New: Ch XII at the first menu, one Mortiphasm disc is 4-6 percent visible behind Yuna and Auron at 2560x1440 and 2000x1012 (CHK-011). (10) Ch IX Yojimbo and Daigoro are drawn in every round-21 capture (2000x1012 and 2560x1440 first menus, 1600x900 route): PR-0341 is not reproduced. (11) HUD over actors (CHK-008): at 1024x768 the Bahamut intent card covers the boss torso and Paine and truncates 'YU...' and 'RIKK...'; at 2560x1080 Den of Woe the CHAIN slab stands over Rikku's and Paine's legs; at 2560x1440 Leblanc the guide card overlaps Yuna's raised pistol.

Facing, ground contact, scale and on-model look hold in all 18 first menus (party faces the enemies, contact rings under every actor; Flux, Yunalesca, BFA, Evrae, Natus, Yojimbo, Shiva, Ixion, Bahamut, Vegnagun parts, Leblanc trio, Sin fins, Fallen Aeons and Den shades).

NOT SEEN (UNVERIFIED, see capturesNeeded): Yuna Thief and Paine Thief in battle, Lulu's Fury, the wind-up and telegraph paintings playing (Seymour Flux and Braska's Final Aeon telegraph hold: the Flux route has no clips), the Chapter IX night-sakura arrival at a hurried opening, the Ch IV phone Bahamut head under the intent strip (PR-0333), living pause portraits (blink and row-follow).

SCORE 8.9 against round 20's 8.8. Gains: PR-0310 closed for II and VIII, Rikku Warrior painted, PR-0341 not reproduced, Evrae painted and staged, painted wings, Bahamut head readable. Held below 9.0 by the carried PR-0311 Yuna half (unverified), the persistent PR-0334 white rectangle (four chapters), the run-in crop, the hidden Omnis disc and the new HUD-over-actor cases. No defect I found is critical.

### feel: 8.6 -> 8.7 (scored)

CHIEF (round 20: 8.6): 8.7 (+0.1), accepts the feel auditor. Skill travel lands the numeral with the hit in both games, the FFX-2 run-in is a clean approach-hit-return, the Braska telegraph hold plays (about 1.4 s) and the gap pass confirmed the Flux hold and banner on clips, entry to the first menu holds (median 4.2 s) and frame times are 59.7-60 fps with 0 frames over 50 ms. Held down by the dressphere shot absent in 6 of 7 changes with the push-in never seen (PR-0314, stalled), the white twirl rectangle (PR-0334), the 2.5 s seam hand-back (PR-0301), the unmeasured per-press latency and no human feel verdict (CHK-B2).

AUDITOR EVIDENCE: Feel + cinematic direction, deep round 21, live main 6461999e bundle DHaa2xD1 (release 38) against round 20 (8.6, cd9dbbb0). No browser opened, no server started; every judgment is from the capture owner's evidence (index.json 1,816 records, all mode=gpu = PYREFLY_BROWSER=gpu headless, harness-verified flags read; ability, attack and telegraph clips, 7 dressphere-change clips and 4 seam sequences were decoded with ffmpeg and read frame by frame at 100-300 ms steps; scratch in critic/rounds/round-21/feel-narr/: strip.py, hold.py, pace21.cjs, gaps21.cjs, clipev21.cjs, yoj-fira2.jpg, veg-attack.jpg, bra-tel2.jpg, bra-atk.jpg, leb-cheap.jpg, veg-sphere*.jpg, spheres4.jpg, seams2.jpg).

MEASURED GAINS (why 8.6 -> 8.7):
(1) SKILL TRAVEL (both games, D-354, new in 38). FFX Ch IX Lulu Fira on Yojimbo (yojimbo-cavern-win/clips/ability-travel, 100 ms frames): menu closes about 1.2 s, the gold orb leaves the caster at about 2.5 s, crosses in about 0.3-0.4 s, impact starburst at 2.9-3.0 s and the numeral 2115 first appears in the 3.0 s frame, the same frame as the impact (earlier builds showed the numeral 0.4-0.5 s before the bolt). FFX Ch III Tidus Attack on Braska's Final Aeon: lunge at 1.4-1.6 s, numeral 1106 at the strike (1.6-1.8 s). FFX-2 Ch VI Yuna Cheap Shot at Ormi (leblanc ability-travel-2): menu closes 1.4 s, burst and numeral 107 at 2.4 s, next command menu 3.2 s. The effect is readable (single numeral, one starburst, no wash). PASS on 'numeral lands with the hit' in both games.
(2) FFX-2 RUN-IN (FFX-2 only, D-354 ask 5). Ch V Rikku Attack at Vegnagun (vegnagun attack-2, 200 ms): menu closes about 1.2 s, run with translucent afterimages 1.4-1.6 s, numeral 1818 at about 2.0 s with a bright impact at 2.2 s, home and settled by 2.4 s: menu-close to numeral 0.8 s, whole move about 1.2-1.7 s (engine hold to next event: Rikku 1,622 and 1,690 ms, Paine 598-984 ms). The rhythm is coherent (approach, hit, return, no stall). Cost: a plain FFX-2 Attack is longer, which shows in per-turn pace (below). FFX (Auron/Tidus attack clips) shows the old lunge and no run: the case split holds, CHK-021 PASS.
(3) TELEGRAPH HOLD (FFX only, D-355). Braska's Final Aeon form 2, Ultimate Jecht Shot (braskas-final-aeon-win-long/clips/telegraph-hold, frame difference of the boss box every 100 ms): near-static from about 3.1 s to 4.5 s (mean grey difference 0.0-5 per step against 13-25 around the cast) then the blow at 4.6 s (difference 38.7): a hold of about 1.4 s counted from the settle, consistent with the builder's 1.14 s plus the status banner. Plays on both Ultimate Jecht Shots in the clip pair. Seymour Flux's hold could not be seen: every Flux clip lane recorded clips 0, so the Flux half rests on the builder's own 1,133 ms overlay measure, not on this round's evidence (UNVERIFIED, listed in capturesNeeded).
(4) HURRIED ENTRY held (BOTH games, PR-0061). In-game time to first usable menu after a hold-skip (firstState.playTimeMs, 39 win/lose runs): median 4.2 s, minimum 3.32 s, 33 of 39 at or under 5.2 s (round 20: 3.4-5.2 s in 23 of 28). The six slower runs are all loaded-host runs: Braska long r2 53.9 s (the capture owner's 30 s reload timeout), Natus 10.43, Evrae 7.85, Den r2 6.85, Sin Face 6.05, Flux 2k lose 5.57. Retry from a defeat to the next battle 7.6-8.3 s (round 20: 7.6-7.8), 10.75 s on the 2k Flux run under load.
(5) FRAME TIMES (live, cold cache, 1600x900, shared machine, GPU): Flux, Bahamut, Sin Fins idle first menu 59.9-60 fps, p99 16.8 ms, max 33.4 ms, 0 frames over 33 ms; whole action window 59.7-60 fps, max 33.4 ms. No first-ability stall appeared at this sampling.
(6) INPUT. Trigger Happy (the 37.1 fix) registers 3 of 3 presses on R, PgDn, mouse click, touch tap and the gamepad (pressMs 155, 169, 198, 344, 464 for the three presses on the overlay counter; Enter correctly counts 0 because the overlay says MASH R). Pause: FFX-2 Ch IV pausematrix 11/11 keyboard, 8/8 pad, 11/11 touch; FFX Ch I 14 of 18 keyboard and touch, 10 of 13 pad with the fails explained below. Hold-skip of a scene = 1 hold everywhere; Esc and P over a pre-scene pass.
(7) Pace per turn, same route, r20 -> r21 (s per turn): Flux 6.53 -> 6.71, Natus 4.63 -> 4.75, Omnis 5.97 -> 6.21, Macalania 6.26 -> 6.40, Yunalesca 5.18/5.30 -> 5.59/5.87, Sin Fins 4.28 -> 4.47-4.53, Braska 6.77 -> 6.82-7.42, Yojimbo 6.62 -> 6.85 (FFX: +0.1 to +0.4 s, the skill-travel orb); FFX-2 turn medians Bahamut 6.8 -> 6.4, Vegnagun 6.0 -> 6.4, Leblanc 4.2 -> 4.5, Trema 3.7 -> 4.3, Fallen Aeons 7.1 -> 8.5 (FFX-2: -0.4 to +1.4 s; the run-in's 0.6-0.9 s per plain Attack is spread over picks that are mostly not Attacks). No doubling of turn time. Reduce motion shortens a turn (Flux rm 6.39 vs 6.71).

STILL OPEN / LOSSES: PR-0314 the dressphere shot is absent in 6 of the 7 FFX-2 changes captured in clips (Leblanc Paine; Vegnagun Paine x2 with the first one playing; Fallen Aeons Paine x2; Den Yuna x2): it played once (Vegnagun Paine dark knight -> white mage: close-up from 3.15 s to about 4.6 s, 1.45 s hold, ribbon aura then the new dress, as in round 20 where it held 1.4-1.6 s), and no frame of the other six shows the 1.22x push-in that D-346 added to cover this case; round 20 had 5 of 10 absent. In each absent case an enemy turn started within 0.9-4.3 s of the change (events), the likely gate. PR-0334 now confirmed: the twirl start draws a hard-edged white rectangle over the changing girl for 150-450 ms (300-600 ms at Den) in 7 of 7 changes. PR-0301: the seam hand-back is unchanged, Leblanc link 2 and Vegnagun link 2 show eight frames to 2.51 s with a name plate at about 1.4 s and no command menu. New: the last first-turn coach card's Enter also confirms Attack and opens the target cursor in FFX chapters whose first row is Attack (R21-FEEL-01), and leaving the pause with the pad Circle from the targeting state drops the target cursor where P/Start keeps it (R21-FEEL-02, low confidence). Isaaru turns 8 and 9 show 57 s and 55 s gaps (round 20: 29 s and 5 s) with no engine timestamp to say why: harness or host, not charged to the product (capturesNeeded).

NOT MEASURED, NO CREDIT: per-press input-to-response latency (pressMs is a total), Seymour Flux's telegraph hold, Shell in Wait (PR-0104), the twirl crossfade double exposure (PR-0315), a tapped-through scene's reading pace (the harness always hold-skips), real controller and phone feel, and Bailey's play verdict (CHK-B2 still owed). Score: +0.1 for skill travel and the telegraph hold measured in motion in both games and an unchanged fast entry and 60 fps, held down by the dressphere shot being absent in 6 of 7 with the new push-in never seen, the white twirl rectangle in every change, the unchanged 2.5 s seam hand-back and the unmeasured latency.

### narrative: 9 -> 9 (scored)

CHIEF (round 20: 9): 9.0, held. No script changed (git log over src/story and the writing bible is empty); every dbox timeline is line-for-line identical to round 20; the title rename is clean and consistent. Held below 9.5 by the unchanged caption and speaker issues (PR-0255, PR-0256, PR-0272), the Trema and Den aftermaths not reached for another round and no human story read (CHK-B3).

AUDITOR EVIDENCE: Narrative, emotion and character voice, deep round 21, live main 6461999e. No browser opened; judged from the capture owner's dboxTimeline text (39 run.json with a timeline, GPU headless) and post-scene frames. git log cd9dbbb0..6461999e -- src/story research/writing-bible.md shows no script change; the only text-bearing change is the player-facing title (ee98d4d1, fcc43ba4), checked on the title and briefing frames at 1600x900 ('Echoes of Spira', 'AN UNOFFICIAL FAN TRIBUTE', 'FINAL FANTASY X AND X-2', Auron's briefing with the FFX / FFX-2 clock rule; the key art loads, the base-path fix holds). No player-visible 'Pyrefly' in any scene text; the remaining mentions are the in-world pyrefly glow and internal names.

WHAT I CHECKED: every r21 timeline against round 20 by speaker and text with the final period normalised (critic/rounds/round-21/feel-narr/dbox21.cjs, ddiff21.cjs, dbox21-all.txt). Line-for-line identical to round 20: Braska (78 lines, 18 aftermath), Evrae (47, 16), Bahamut win (30, 12) and its input variants, Macalania (55), Natus, Omnis, Isaaru, Flux win/pad/rm (61), Yojimbo, Fallen Aeons, Leblanc (86 against r20's win-r2), Ixion (38), Vegnagun win-again (96), Sin Face and Sin Fins long. Only random battle banter differs: Den of Woe (Rikku 'He's counting us! One more and...' and 'Big light! Big, big light! Hold on!' instead of one Paine line) and Yunalesca seed 4001 (a longer fight, 95 lines). Tone holds per game: FFX elegiac and short (Yunalesca: 'There. Now no one can summon it. Not ever again.'; Wakka 'So that's it. Sin's still out there. And we got nothing.' / Rikku 'We got a no. That's not nothing.' / Yuna 'It's a start.'), FFX-2 warm and quick (Ixion's Farplane arc; Bahamut results silent per the writing-bible). Beats inside research/ffx-sin.md and the bible.

REACHED BY REAL INPUT (CHK-022), aftermath played and results shown: FFX I, II (seed 4001 after 58 min), III, VII, VIII, IX, X, XII, XIV, XVII, XVIII; FFX-2 IV, V (win-again), VI, XI, XVI = 16 of 18. NOT REACHED: XIII Trema (defeat on seeds 1, 1001, 4001; 4th consecutive round, PR-0227) and XV Den of Woe (defeat on seeds 1, 1001, 4001; PR-0306/PR-0353): their victory aftermath is UNVERIFIED (scripts unchanged in git). Both are encounter-side problems owned by other auditors.

STILL OPEN, UNCHANGED SCRIPTS, RE-OBSERVED: PR-0255 (Tromell's five Chapter VII lines have speaker ''), PR-0256 (Ixion whistles are captions with no mote shown), PR-0272 (Chapter XVII: 'The Fahrenheit's cannon tears the fin away.' is still a caption), PR-0254 (Chapter VII Talk, not re-probed), PR-0262 (repeated reactions, not re-probed). The harness hold-skips every scene, so natural reading pace is unmeasured and Bailey's story read (CHK-B3) is not recorded. Score held 9.0: nothing in the scripts moved, the title rename is clean and consistent, and the aftermath reach is the same 16 of 18; held below 9.5 by the unchanged caption and speaker issues, Trema and Den aftermath not reached for another round and no human story read.

### audio: UNVERIFIED -> UNVERIFIED (UNVERIFIED)

CHIEF (round 20: UNVERIFIED): UNVERIFIED, no number: there is no numeric owner listening verdict for the shipped music v2 and SFX v2 (docs/audio/OWNER-VERDICT.md unchanged since 2026-09-29; D-349 reads "no number given yet"), and an agent never invents it (AGENTS rule 13). Technical and routing health holds and no audio byte changed (29 of 29 files sha-identical to round 20, round 19b and live); the gap pass added: the pause hand-back works in both games, the ending cues play at Ch III and Ch V, and the title first press asks for no sound in 7 of 7 runs (PR-0326).

AUDITOR EVIDENCE: Technical and routing audit: PASS with one carried routing finding. No numeric owner listening verdict exists, so the category is UNVERIFIED with no number (RUBRIC section 6, CHK-B1); it is not averaged away and not zero. I cannot hear and listened to nothing. I opened no browser and started no server. Everything is offline decoding, the repo's audio tools, and the capture owner's AudioManager and network evidence (critic/rounds/round-21/evidence, headless Playwright, PYREFLY_BROWSER=gpu as the capture owner recorded it; 39 runs with an audio-debug log, 307 AudioManager samples, 39 network files). Scratch and outputs are in critic/rounds/round-21/audio/.

OWNER VERDICT: docs/audio/OWNER-VERDICT.md is unchanged since 2026-09-29 (5e5ef411) and gives no number out of 10. The latest ear words about the shipped mix are 2026-09-27 'still sounds like snes music' (release 21), before music v2 and SFX v2. decisions.json D-349 (adopted on 'all your recommendations, godspeed', 2026-10-03) records 'no number given yet'. D-302/D-303/D-306 (music v2, SFX v2, budget) were adopted on recommendation, not by ear. D-307, D-308 and D-309 are still proposed and unanswered. D-371 to D-382 (e2e33e0b, 2026-10-04) contain no audio score. Approving a direction is not a numeric score (RUBRIC section 5).

WHAT CHANGED IN AUDIO SINCE ROUND 20 (cd9dbbb0 to 6461999e, 415 changed files): no audio byte and no audio code. `git diff` over public/audio, docs/audio, src/audio and tools/audio is empty; the only src lines that mention sfx are the FFX-2 RunInMotion wiring (it passes the existing sfxVoice, nothing audio is added) and the title-markup, key-art and pause-brand text edits. All 29 shipped audio files (26 music cues, 2 SFX sprites, manifest.json) are sha256-identical to the 6461999e artifact manifest (critic/artifacts/6461999e.json, artifactHash eca5b98a...), to the cd9dbbb0 (round 20) manifest, to round 19b's candidate and to the working tree; and 29 of 29 are byte-identical on the live site (content types audio/mp3 and application/json; charset=utf-8 for manifest.json, 0 errors).

TECHNICAL: PASS. `node tools/audio/qa.mjs --strict` exit 0, 0 cue findings and 0 SFX findings, output identical to round 20: 26 music cues -16.00 to -16.21 LUFS, -1.08 to -3.06 dBTP, 0 clipped samples, every loop seam ok; v1 sprite 134 cues peak -1.13 dBTP; v2 sprite 100 cues peak -1.12 dBTP; total shipped audio 88.49 MB of the 90 MB budget. Independent ffmpeg 9.0.1 decode: 28 of 28 shipped MP3s and 62 of 62 files including unshipped candidates, 0 errors. ebur128 spot checks (title, chapter-select, pause, boss-yu-yevon, boss-shuyin, boss-ffx2-aeon, victory-ffx2): -15.8 to -16.0 LUFS, true peak -1.1 to -1.7 dBFS; sprite-v2 -18.5 LUFS at -1.1. Stereo, 26 cues: L/R correlation 0.643 to 0.796, mono-sum loss -0.49 to -0.91 dB (no hollow-phase signature, the PR-0148 'hollow' cause measured on 2026-09-29). themes-audit: 0 chapters depart from the chapter cue map; the same four cues depart from the bible as in round 20 (PR-0039 scene-gagazet, scene-dreams-end, scene-farplane; PR-0260 scene-macalania-temple); output is byte-identical to round 20's.

ROUTING (CHK-023), from 307 AudioManager samples in 39 runs, FFX and FFX-2: ready true and not muted in 307 of 307; volumes 0.8/0.7/0.7 and sfxMix {option b, trim 1, bus 0.70} in 307 of 307; v1 and v2 sprites decoded at the first sample in 39 of 39 runs (round 20 had two lose runs undecoded); 198 music samples, all source 'prerendered' (none from the synth path), each matching music.current; the v2 sprite 'game' is ffx in every FFX chapter and ffx2 in every FFX-2 chapter (39 of 39). The right cue at the real moments: boss cue at the first menu in every chapter that reached it (boss-seymour, boss-yunalesca, boss-jecht then a silent seam then boss-yu-yevon x15, boss-ffx2-aeon for IV, VI, XI, XVI, boss-vegnagun, boss-shuyin for V and XV, boss-seymour-macalania for VII and X, boss-evrae for VIII, XVII, XVIII, boss-yojimbo for IX and XIV, boss-seymour for XII); scene cues at the pre-scene sample (scene-zanarkand-dome, scene-dreams-end for III and XII, scene-bevelle-underground for IV, VI, XIII, XV, XVI, scene-farplane for V and XI, scene-macalania-temple for VII, scene-fahrenheit for VIII, XVII, XVIII, scene-gagazet for IX, X, XIV); victory-ffx playing at the results sample in 14 FFX wins (I x4 runs, II, III x2, VII, VIII, IX, X, XII, XIV, XVII, XVIII) and victory-ffx2 in 4 FFX-2 wins (V, VI, XI, XVI); Chapter IV wins are silent at results by design (cue map 'none'). Chapter I's pre-scene sample is silent in 9 of 9 runs because the script opens with music(null, 600) and brings scene-gagazet in at the reveal (src/story/scripts/seymour-flux.ts:69,105), the same as round 20; the sting itself is not sampled. Network: 299 audio requests, 26 distinct URLs (24 music cues, sprite.mp3, sprite-v2.mp3), 0 not found, 0 audio console errors, 0 console errors in all 44 runs (summary.json); pause.mp3 was requested in 39 of 39 runs; ending-ffx was requested in both Braska long runs and ending-ffx2 in the Vegnagun win-again run (requested, not sampled playing). The shipped battle-ffx and boss-dread cues were requested by none of these chapters (same as round 20). Unit and routing tests run now: 15 audio files, 130 tests, all pass (audio-shipped-files, audio-cue-reachability 47, audio-pause-race, pause-music-silence, flow-post-music, audio-boot-settings, audio-pad-unlock, audio-sprite-only-cue, audio-sfx-mix, audio-story-cues, themes-chapter-cue-map, audio-music-slot, audio-music-v2, audio-sfx-v2, audio-chain-entrance-owner).

THE ROUTING FINDING THAT PERSISTS (R20-AUD-01 / PR-0326, polish, second consecutive review): the first UI sounds of a session are still the procedural synth. sfxLog[0] is synth in 34 of 39 runs (87 percent; round 20: 25 of 27), 109 synth entries (cursor-move 98, confirm 11), the last synth entry at 2.7 to 6.4 s of context time, and the v1/v2 sprite takes over from 2.1 to 6.9 s (median 3.1 s; 4 of 39 later: 8.5, 13.6 and 36.3 s under host load). 'battle-start' never plays: 0 of 39 sfxLogs contain it (it was synth in 24 of 24 before PR-0326, now not at all). The cause is unestablished (the sprite is not decoded yet at the first sounds; playSfxFromSprite returns early or the call lands before anything it can play; a solo run with the call traced is the smallest test). The music lag half improved: 1 of 39 runs shows the previous cue still current at the pre-scene sample (braskas-final-aeon-win-long-r2: chapter-select), against 3 of 27.

ONE NEW OBSERVATION (R21-AUD-01, polish, low confidence): the victory fanfare is fetched at the win, not before: victory-ffx or victory-ffx2 was not decoded at the after-fight sample in 18 of 18 wins where it later played, while the boss cue is cached by the first menu. In one of 19 victory results (evrae-airship-win, host at 100 percent CPU) the results sample 4.2 s after the fight still showed no cue and the cue not decoded, although victory-ffx.mp3 had been requested; the repeat run played it. Whether a real player on a slow link hears a late fanfare is not measured.

NOT VERIFIED THIS ROUND (listed in capturesNeeded; none is a found defect): no AudioManager sample while paused (pause.mp3 was requested in every run, but 'playing: pause' and the hand-back to the battle cue were never sampled); Chapter XIII Trema phase 2 (boss-ffx2-aeon replacing the scene bed) and victory-ffx2 (defeats on seeds 1, 1001 and in the 5-attempt run, fourth consecutive round) and the Den of Woe victory; the Chapter III and V ending cues playing (requested only); the Chapter I scene-gagazet sting; and the sync of sound to the new motion (FFX-2 run-in, skill travel, dressphere push-in, Flux and BFA telegraph holds), which needs ears and a time-aligned log. Defeat is silent by design as far as the record shows (no defeat row in THEMES.md; after-fight and results samples show no cue in 20 of 20 defeats), a question for Bailey and not scored. REUSED (labelled): the audio half of the save matrix (volumes applied from storage after reload) from round 20, itself from round 19b: SaveData.ts, saveSfxBalance.ts, every settings file and src/audio are unchanged between cd9dbbb0 and 6461999e (git diff empty), no open related defect.

SERVERS: I started none; I used no browser.

### interface: 8.2 -> 8.3 (scored)

CHIEF (round 20: 8.2): 8.3 (+0.1 on round 20), chief adjustment of the interface auditor's 8.4 by minus 0.1. The auditor's gains stand (Trigger Happy names the device that counts and works on five devices; the GUIDE'S PICK tag is gone; the card repair in Ch III and FFX-2 Ch IV; the rename is clean). The adjustment is for PR-0360, which the combat auditor filed under this category after the interface auditor had scored: the gap pass proved that a phone player cannot answer a Bushido or Swordplay overlay at all (seven taps, correctInputs 0, auto-fail), a confirmed major in the unusable-controls class that the 8.4 did not weigh. Held below 9.0 by PR-0330 (card still a stub in five chapters), PR-0354, PR-0361 (Bushido keys unnamed), PR-0251, and the long carried polish list.

AUDITOR EVIDENCE: Round 21 deep review, interface auditor, live main 6461999e (bundle DHaa2xD1). I opened no browser and started no server. I judged the capture owner's evidence in critic/rounds/round-21/evidence: 1816 index records, 114 run.json, headless Playwright PYREFLY_BROWSER=gpu (RTX 5070 Ti ANGLE) at 1600x900, 2000x1012, 390x844 touch, 2560x1440, 2560x1080, 1440x900, 1024x768 and 3840x2160. Mechanical re-runs of mine on HEAD (src/public/tools identical to 6461999e): 8 vitest files (advisor-ownership 18 chapters x 300+ decisions, advisor-degenerate-boards, advisor-copy-sweep, enemy-intent, advisor-phone-tip-menu, advisor-card-css-type-floor, ui-ffx-advisor-roomy, player-facing-title): 109 passed, 3 skipped, 0 failed. My own scripts: critic/rounds/round-21/audit-if1.tmp.mjs plus inline node over run.json.

GAINS vs round 20 (8.2): (1) FOC37-02 is fixed: the Trigger Happy overlay now names the device that counts (MASH R, MASH CLICK, MASH R1, MASH TAP) and the six-device matrix (feat/th-ffx2-leblanc-*) gives 3 hits for R, PgDn, mouse, touch and pad; Enter gives 0 hits and the overlay never claims Enter. (2) The GUIDE'S PICK tag is gone from every captured card (0 hits in all advisorText fields). (3) PR-0330 is fixed in the named chapters: Ch III at 1600x900 prints the full card (214 chars, 383x196; r20 had 68 chars, 293x188) and at 2000x1012; FFX-2 Ch IV prints 106 chars with '100% TO HIT' and 'SHELL'. The Ch VII 2000x1012 regression of r20 is gone (483x233, 252 chars vs 274x204/69). (4) Advisor minimum effective size 14.2 px desktop, 15 px phone, 16.8 px at 1440p, 25.2 px at 4K; 0 clipped rows in every run except one 2560x1440 target-open Sin Face card ('in White Magic' flagged by the sweep). (5) Title rename: pause header reads 'ECHOES OF SPIRA - FINAL FANTASY X / X-2' in both games and on the phone, title frames at 1600x900 and 390x844 read 'Echoes of Spira', 0 occurrences of the old name in 1.77 M characters of captured text; developer-vocabulary sweep of 269,121 characters of briefing, board, prep, advisor, intent, pause, results and dialogue text: 0 hits. (6) Overlay cleanup holds: afterTargetCancel shows 0 target cursors in every run with a cancel frame; Esc/P pause and resume matrices pass in FFX-2 keyboard, pad and touch (11/11, 8/8, 11/11).

STILL WRONG: PR-0330 persists outside Ch III, Ch IV: at 1600x900 the card drops cost, hit chance and reason in Ch VII (56 chars: 'Steal -> Guado Guardian A IN SPECIAL'), Ch IX (69 chars, no NO MP or hit line, same as r20) and Ch XII (54 chars), and Ch XVII and XVIII show the one-line strip at every desktop size ('Tidus Close in IN ORDERS', 24 chars, no cost, no reason; r20 had a 144-char card for Ch XVII at 1600x900, this run 24; Ch XVIII 'Hastega -> the party IN WHITE MAGIC' names no MP cost). Release 38's 'keeps its lines' therefore holds for Ch III and FFX-2 Ch IV only. PR-0354 persists and widened (Ch XII 'Mortiphasm Spells SCRIPTED Deals no damage.' above 2,066-2,333 rows; Ch IX 'Daigoro SCRIPTED Deals no damage.' above 517-624 rows; the code is unchanged since cd9dbbb0). New: the Bushido overlay is glyph-only (R21-IF-01, major but inside a new feature), the TARGET plate lies over 'FACING HIM' in Ch XII target mode (R21-IF-02), the Ch XV dialogue banner covers the intent card at the first menu (R21-IF-03), a pad's Circle that resumes the pause also backs the menu out one level (R21-IF-04), guide rail and advisor name different moves in Ch IX and Ch XI (R21-IF-05). Carried and re-observed: PR-0237 (phone coach tag overprints the intent third line, '115-' cut, Ch IV), PR-0357 (Leblanc 2000x1012 intent odds list ghosted behind the dashed rule), PR-0358, PR-0324 (Yuna's Grand Summon still 'Timed input', Ch XIV), PR-0251 (HUD text floor 12.25 px FFX, 11.68 px FFX-2 command label, 12.5 px max-HP numbers at 1600x900; 13.77 px at 2000x1012; 7.84 px at 1024x768 with 31 elements under 14; 8.51 px dialogue role chip). Carried, not re-observed: PR-0248, PR-0249, PR-0286, PR-0288, PR-0291, PR-0296, PR-0302, PR-0303, PR-0304, PR-0321, PR-0325.

NOT COVERED (UNVERIFIED, listed in capturesNeeded): multi-target and all-party target frames, TEXT SIZE at 115 and 130 percent, the CONTROLS tab, the EYE CANDY page, the Ch II (Yunalesca) and Ch III first-menu card across repeat runs (r38 check measured Ch III as probabilistic, about 93 percent), real gamepad, Safari. The score is provisional on those. Score 8.4 (r20 8.2): the Trigger Happy reliability fix and the Ch III/IV card repair are real gains; held below 9 by the five-chapter card shortfall, the false 'Deals no damage' sentence, the unlabeled Bushido keys and the long carried polish list.

### onboarding: 8.6 -> 8.5 (scored)

CHIEF (round 20: 8.6): 8.5 (-0.1), accepts the onboarding auditor. The newcomer walkthrough was SIMULATED (fresh profile, visible instructions, real keys and emulated pad and touch), not a human newcomer. The briefing, guide, options and motion accommodations remain strong and the device-named mash label helps; lowered a tenth for PR-0362 (the coach Enter confirms Attack) and the phone options window (PR-0372); held below 9.0 by PR-0270 (major, TEXT SIZE grows nothing in the FFX-2 HUD, stalled, fourth review) and PR-0032; the EYE CANDY page, the CONTROLS tab and TEXT SIZE at 115/130 percent were not captured.

AUDITOR EVIDENCE: Round 21 deep review, onboarding auditor, same evidence base as interface. NEWCOMER WALKTHROUGH: SIMULATED, not real. Every route run starts on a fresh profile and walks only visible instructions with real keys (touch taps on the phone, a synthetic standard-mapping pad in the pad runs); no human newcomer played this build.

What held: title ('Echoes of Spira', PRESS ENTER / TAP TO BEGIN, 'B BRIEFING'); Auron's briefing at 1600x900 and 390x844 ('In the FFX fights, nothing moves until you act... In the FFX-2 fights, the clock keeps running until you pick a command. Then it waits while you choose.', 'ENTER / ESC SKIP - 20 SECONDS, ONCE', 'D NEVER SHOW THIS AGAIN'; phone 'TAP SKIP' and 'TAP HERE NEVER SHOW THIS AGAIN'); guide steps 1 to 3 (board, prep 'Your party is ready', first-turn coach 'He moves after you. Not before. Use it.' with ENTER CONTINUE / FIRST TIME ONLY; FFX-2 'Bar's full, she's up!... GAUGES RUNNING / FADES ON ITS OWN'); prepEsc returns to party-prep then the board; results, retry and reload keep the clear (boardAfterReload cleared in the win runs). Pause OPTIONS rows at 1600x900: MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE, REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP (+ X-2 BATTLE and ATB SPEED in FFX-2); the Trigger Happy overlay now names the input of the device in use (R, CLICK, R1, TAP), which is a real accessibility gain over r20. Reduce-motion route (seymour-flux-win-rm) and gamepad routes (seymour-flux-win-pad, ffx2-bahamut-win-pad) won with 0 console errors. Non-colour cues hold (CURSE chip with written cure, ZOMBIE 100% tag, SCRIPTED/POSSIBLE tags, glyph status icons).

NEW: R21-ON-01 (FFX only, polish): one Enter on the last first-turn coach card also confirms the highlighted Attack and opens the target cursor in the chapters whose first row is Attack (I, II, VII, IX, XII); confirmed by the capture owner's single-press probe at 1600x900 (seymour-flux-coachprobe-1600x900: card gone and targets 2, selecting true within 100 ms of one Enter). It also put the FFX pause matrix off by one step, which is why 4 FFX matrix rows read FAIL (rows 4 to 7 are inverted consistently; the pause itself behaves). R21-IF-01 (Bushido's keys are never named for keyboard or touch, new Square on K is listed nowhere, CONTROLS tab lists menu keys only) is scored in interface and cross-referenced here once. R21-ON-02 (phone options show four of ten rows in the window with a faint fade; the tab strip clips CHAPTER to 'TER'; present in round 20 frames too, not filed then). STILL OPEN: PR-0270 (major, FOURTH review, STALLED: TEXT_SIZE_WIDE_SCOPE is still false at src/app/applyComfort.ts:41; applyComfort, hudTextSize and the options files are untouched between cd9dbbb0 and 6461999e, which is the dependency argument), PR-0032 (no REDUCE FLASHES row, no remapping: the CONTROLS tab is read-only), PR-0289 re-observed on the phone and in FFX-2 (step 1 says 'Start with the first one' while Chapter IV is selected and the card covers rows I to VII), PR-0322/PR-0323/PR-0305 not re-captured. NOT VERIFIED: the EYE CANDY page (its help text for the dressphere push-in changed in 38 and no frame shows the page), TEXT SIZE at 115/130, gamepad on real hardware, Safari. A method check is owed before a fifth review on PR-0270 (RUBRIC section 8). Score 8.5 (r20 8.6): the briefing, guide, options and motion accommodation remain strong and the device-named mash label helps; lowered a tenth for the coach-Enter double press and the phone options window, held below 9 by PR-0270, PR-0032 and the unverified pages.

### prep: 9.1 -> 9.1 (scored)

CHIEF (round 20: 9.1): 9.1, held. Every comparable results panel matches round 20 (no reward value changed), 24 retries (median 8.4 s; 7.3-8.9 s when the host was quiet), 21 of 21 victory runs keep the clear through a real reload. The prep tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSPHERES and ACCESSORIES were not opened by input at any size for the third round; their code was untouched, so nothing is marked failing, and no win or reward row exists for Ch XIII and XV.

AUDITOR EVIDENCE: Prep and delivery auditor, round 21 deep review of live main 6461999e (bundle DHaa2xD1). I opened no browser and started no server except two read-only artifact-manifest verify-live runs and curl probes. Worked from critic/rounds/round-21/evidence (index.json 1,816 entries, 1,747 verified, 54 relabelled target-open frames, 15 unverified; all headless Chromium from node, PYREFLY_BROWSER=gpu, ANGLE D3D11 RTX 5070 Ti, no injected input) plus git diff cd9dbbb0..6461999e.

PREP AGENCY. All 18 board chapters were reached through the real board and party prep by keys in every route run (boardAtEntry 18 tiles, prepText 840 to 1,200 chars). Prep screen read in 04-prep.png (seymour-flux-win): party list, six tabs (CHAPTER, STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE for FFX; CHAPTER, DRESSPHERES, STATS, ACCESSORIES, ITEMS for FFX-2), objectives and a TIP, START BATTLE, Auron's three-step guide. src/app/screens has no PartyPrep, Results or Board file in the release 38 diff (only battle-flow, cutscene, title markup and pause files), so r20's prep reading is carried (reused, dependency: code and data under prep unchanged). The first Esc on a fresh profile dismisses Auron's guide and the second goes back to the board (33 of 33 keyboard runs; the label says ESC SKIP THE GUIDE), as in r20.

RESULTS AND REWARDS (sourced). I diffed every comparable results panel against round 20 with the clock removed: identical for Flux (AP 10,000 x4, GIL 6,000, Lv. 4 Key Sphere), Braska (AP 0, GIL 0), Evrae (AP 5,400, GIL 2,600, Blk Magic Sphere), Anima (OVERKILL x1, Ability Sphere x4, Blk Magic Sphere, GIL 8,600), Natus, Omnis (AP 24,000, GIL 12,000, Lv. 3 Key Sphere), Isaaru, Yojimbo, Yunalesca (AP 14,000, GIL 9,000), Sin Fins and Core (AP 19,800 x4, GIL 20,000, Return and MP Sphere), Sin Face (AP 20,000 x5, GIL 12,000, Lv. 3 Key Sphere; the party rows differ only by who was KO'd in this run), Bahamut (EXP 1,300, GIL 1,000, Gris Gris Bag), Leblanc (EXP 1,640, AP 14, GIL 1,590), Fallen Aeons (EXP 23,000, AP 54, GIL 7,000), Ixion (EXP 2,600, GIL 1,800), Vegnagun (EXP 42,400, AP 120, GIL 18,300). No reward value changed. The phone, gamepad and reduce-motion wins show the same rows. Defeat cards show TURNS, ATTEMPTS and BEST NEVER CLEARED with RETRY and CHAPTER SELECT (seen for Flux, Bahamut, Yunalesca, Vegnagun, Trema, Den of Woe), counting attempts across RETRY (ATTEMPTS 5 in the five-attempt runs).

RETRY. 24 retries measured from the fight-end step to the retried battle reached (steps ms): 7.3 to 17.0 s, median 8.4 s, mean 9.5 s (r20: 16 retries, 7.2 to 8.0 s, mean 7.5 s). The unloaded runs sit at 7.3 to 8.9 s (Flux and Bahamut at 1600x900 and 2000x1012, the phone four times); the six slow ones (10.3 to 17.0 s: Yunalesca 17.0, Trema 16.1 and 10.3, Den 14.2, Flux 2000x1012 10.8) are all long runs with host CPU at 90 to 100 percent, so I class them as host load, not a regression.

PROGRESS. 21 victory runs across 16 chapters all keep the clear through a real page reload (boardAfterReload.cleared names the chapter, 21 of 21); the results screen, CONFIRM, the after-confirm scene and the board were reached each time. No settings or save code changed (CHK-024 record under delivery).

NOT SHOWN: no win and so no reward row for XIII Trema (0 of 7 attempts this round, 0 of 4 in r20, never won in four rounds) or XV Den of Woe (0 of 7 this round, 0 of 4 in r20, against one win in 19b); the prep tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSPHERES and ACCESSORIES were not opened by input at any size (third round without them; PR-0292 and PR-0295 stay carried with no credit). Their code and data were not touched by this release, so I do not mark them failing. Gain for prep: none that moves the category (results identical, retry steady when unloaded, progress 21 of 21, same coverage gaps). Score 9.1, equal to round 20.

### delivery: 8.4 -> 8.7 (scored)

CHIEF (round 20: 8.4): 8.7 (+0.3), accepts the prep-delivery auditor. The exact artifact is live (verify-live PASS, 46 and 1,053 files, 0 mismatched); round 20's 404 and console error on Trema are gone; the first single-lane measurement since round 18b exists (title ready 623-810 ms, 59.7-60 fps, 0 frames over 50 ms; hardware and load named); 0 console errors in 97 of 98 capture jobs (the Braska long run's connection reset was re-run clean). Held below 9.0 by the shipped byte headroom of only 2.3 MB under the 800,000,000-byte line, no throttled-network, weaker-GPU or non-Chromium evidence (PR-0259), the Trema and Den victories never seen, the hidden FF7 hold not captured (PR-0222) and the CHK-024 full upgrade matrix reused rather than re-run.

AUDITOR EVIDENCE: Prep and delivery auditor, round 21. Hardware and conditions named for every timing: AMD Ryzen 7 7800X3D, RTX 5070 Ti, Windows 11, headless Chromium 153.0.8010.12 on ANGLE D3D11 (PYREFLY_BROWSER=gpu, no black canvas, no fallback), the live GitHub Pages site over this machine's own connection (speed not recorded), a fresh profile and an empty HTTP cache per run. The host was SHARED: the perf runs logged CPU 65 to 97 percent and GPU up to 99 percent at the samples (lane E ran alone with the quiet marker, but other agents still built and tested), so every figure is conditional on that load and conservative for frame time.

EXACT ARTIFACT (CHK-017, mine). node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/6461999e.json against the live URL: PASS, artifactHash eca5b98a7062d26144f92c70ca484158778816d2abdc8262ae784b84cffe38dc, liveManifest match, 46 files checked in the plain run and 1,053 checked with --changed-from critic/artifacts/f4244e1f.json (release 37.1), 0 mismatched, 0 missing, 0 wrongType, 0 errors (outputs under critic/rounds/round-21/audit/). Independent probes: live index.html names assets/index-DHaa2xD1.js (200, application/javascript); its .map is 404 (intended, no maps ship); art/title/keyart.2x.webp is 200 image/webp and the title preload is base-relative (/pyrefly-reprise/art/title/keyart.webp), so the key-art base-path fix holds live; art/characters/rikku-warrior/idle.json and idle.webp are 200 and yuna-thief/idle.webp is 200 (round 20's 404 is gone); <title> is Echoes of Spira. Manifest: 1,933 files, 797,683,098 bytes, decodeChecked true, audioUnverified 0; the only problems are Paine's two intentional flat eyeR-catch layers (policy intentionalFlatImages). Headroom under the 800,000,000-byte line is 2,316,902 bytes (0.29 percent), so the next art batch needs the planned lossless-WebP room.

NETWORK AND CONSOLE. 39 network-media files hold 6,427 media requests (896 unique: 477 WebP, 393 PNG, 26 MP3); every requested path is in the 6461999e manifest, 0 not found, 0 image responses served as text/html. Console errors: 0 in every one of the 98 jobs except one, the Braska long run (win-long), which logged two net::ERR_CONNECTION_RESET and a 30 s page.reload timeout after its win at 29.96 min on a saturated host; its re-run (win-long-r2, 27.95 min) is clean and keeps the clear through reload, and no other of 20 other reloads failed, so I class it as network or host, not product. Round 20's console error and 404 on Trema (rikku-warrior/idle.json) does not recur: Trema seeds 1, 1001 and the five-attempt run request rikku-warrior files with 0 errors.

LOAD AND FRAME TIME (new: the first single-lane measurement since round 18b; closes the evidence half of PR-0259). Title cold load, nine fresh-profile loads over three chapters: navigation to ready 623 to 810 ms, 5 requests, 1,485 KB transferred, first contentful paint 188 to 340 ms. Frame times (rAF) at 1600x900: Flux idle first menu 720 frames mean 60.0 fps p99 16.8 ms max 16.8 ms, whole action window 930 frames 59.7 fps max 33.4 ms; Bahamut idle 59.9 fps max 33.4 ms, action window 1,002 frames 59.9 fps max 33.3 ms; Sin Fins and Core idle 60.0 fps and action window 1,070 frames 60.0 fps max 16.8 ms; frames over 33 ms: 0 of every window, over 50 ms: 0. First-ability window (3 s from action-start): Flux 59.7 fps max 33.2 ms, Bahamut 60.0 fps max 16.8 ms; Sin's first ability window was not measured (command not confirmed in 15 s). Chapter entry: Enter on the card to the first command menu took 9.9 to 12.2 s unthrottled, of which the scene skip hold is a part; screen=battle to first menu took 1.2 to 3.7 s. Bytes fetched before the first menu: 166 to 192 requests, 82.7 to 88.0 MB art plus 17.9 to 20.1 MB audio (about 100 MB). NOT measured: any throttled network (round 18b's 52.0 s at 10 Mbit was a 577 MB build; the build is now 798 MB and the pre-menu fetch is about 100 MB), a mid-range or integrated GPU, Firefox, Safari or Edge, 3840x2160 or 2560x1080 timings (frames exist, untimed), the pause with a living portrait, the first dressphere change (PR-0327).

FLOWS (CHK-022). Won by real keys through results, CONFIRM, the after-scene, the board and a reload that keeps the clear: 16 of 18 chapters (21 runs): FFX I (also gamepad and reduce-motion), II (Yunalesca won only on seed 4001 after four defeats, 58 min), III (long budget; the 15-minute run stalled at link 3), VII, VIII, IX, X, XII, XIV, XVII (long budget; the short run stalled at link 3), XVIII; FFX-2 IV (keyboard, gamepad, 390x844 touch twice), V (defeats on seeds 1 and 1001, then victory on the again run), VI (won first try in 70 turns; round 20's 957 s stall did not recur), XI, XVI (Ixion reached with the 40-card search). Not won: XIII Trema (0 of 7 this round, fourth round with no win; loss and retry reached) and XV Den of Woe (0 of 7; 19b won it once). Loss and RETRY reached through real input for Flux (1600x900, 2000x1012, 390x844 four times), Bahamut (1600x900, 2000x1012), Yunalesca, Vegnagun, Trema, Den. The phone never won Chapter I (defeat 4 of 4 over two rounds; PR-0335 tooling) so FFX touch is proved at battle taps only; FFX-2 touch won Bahamut with 135 taps.

INPUT (CHK-015). Pause matrix with real keys, pad and touch: FFX-2 Bahamut 11 of 11 (keyboard), 8 of 8 (pad), 11 of 11 (touch) pass. FFX Flux shows 14 pass 4 fail (keyboard and touch) and 10 pass 3 fail (pad), but the failing rows are a cascade from one shifted precondition (the last coach card's Enter also chose Attack and opened the target cursor, so row 4 started in targeting; later rows then ran one state out of step, see OBS-03 and R21-PD-02); the game's responses are consistent with the rules in every row. Trigger Happy: R, PgDn, mouse click, touch tap and pad R1 each register 3 of 3 presses with a prompt naming the device (MASH R, CLICK, TAP, R1); Enter (not the prompted key) registers 0.

SAVE (CHK-024). No persistence change between c69de96a (the last full matrix) and 6461999e: git diff shows no change to SaveData.ts or any settings file and no added localStorage or sessionStorage write (the new PHONE_FIT, STAGE_HOLD and openingHurried keys are in-memory userData). 21 of 21 victory runs reload with the clear kept. Not exercised: a stored LIVING PAINTINGS OFF from an upgraded save.

What moved against round 20: the 404 and its console error are gone; a performance measurement now exists and is clean on the named conditions; Leblanc's stall did not recur; two reviews of exact-artifact identity pass at 1,053 files. What holds the score: Trema and Den of Woe unproven again, a throttled entry never measured on a build with about 100 MB before the first menu, one host-load connection reset on the live site, 2.3 MB of byte headroom, and no non-Chromium play evidence of any kind (Playwright WebKit was used only for the build's image load gate; Firefox will not start on this machine). Score 8.7, up 0.3 from 8.4, provisional on the unmeasured conditions above.

## Bailey's five visual sub-scores (provisional, not part of the weighted score)

| Sub-score | Round 20 | Round 21 | Change |
|---|---:|---:|---:|
| Character models | 8 | 8.2 | +0.2 |
| Enemy models | 7.5 | 7.8 | +0.3 |
| Animation | 7.1 | 7.4 | +0.3 |
| Visual fidelity | 8.1 | 8.2 | +0.1 |
| Camera perspective | 7.9 | 7.9 | +0.0 |

Chief's reconciliation. Inputs: capture owner 8.1 / 7.7 / 7.2 / 8.2 / 8.0; visual auditor 8.2 / 7.8 / 7.4 / 8.2 / 7.8; feel auditor animation 7.5 and camera 7.9. Character models 8.2 (+0.2; median of 8.1 and 8.2, the confirmer's live run supports the higher): Rikku Warrior is painted and loads clean, Yuna Thief was exercised by the confirmer and is a painted figure with 0 art 404; the round-20 grey mannequin is gone; held below 8.5 because Paine Thief's look is unseen and the white twirl rectangle lands the girl on the new painting. Enemy models 7.8 (+0.3; median of 7.7, 7.8): Evrae E1-H reads as a painted serpent in every window shape, Yojimbo and Daigoro drawn in every capture, the Flux and Braska telegraph holds play (gap pass); held by one hidden Mortiphasm disc, one Evrae two-head ghost frame and Bahamut's rim fringe. Animation 7.4 (+0.3; median of 7.2, 7.4, 7.5): skill travel, the run-in with afterimages, the Braska and Flux telegraph holds and the Vegnagun close-up play; held below 7.5 by the white twirl-start rectangle in 7 of 7 changes and the dressphere shot absent in 6 of 7. Fidelity 8.2 (+0.1; capture owner and auditor agree): painted wings fill 21:9 and lossless WebP renders identically; held by the tilted wing seam, the rim fringe and the 3x tier not seen. Camera 7.9 (unchanged; median of 8.0, 7.8, 7.9): Chapter II, VIII and Evrae staging compose across four aspect ratios, against the run-in pan cutting Yuna off, the dressphere push-in never seen, the 2.5 s seam hand-back and the Bahamut intent card over the boss at 1024x768.

## Approved-target gate

Required 89; matched 70; failing 0; unverified 19; waiting on a decision 7.

Visual auditor's tally against docs/target/targets.json (sha256 b5933731): the structure and the 70 matched base carried from round 20 (dependency argument: targets.json changed only by the Camera Lab verdict tile, which is not required, and recorded decisions; approved 711 of 711 and judge-locked 48 of 48 byte-identical by verify-approved), 98 composites re-made with tools/end-state-board.mjs --pair from round-21 captures (critic/rounds/round-21/targets/pairs.json, 16 contact sheets read); 7 pairs with no round-19b source stay unverified as in round 20. Unverified rose by one (19): the Evrae E1-H order widget was read at 1600x900 by the gap pass but the living pause portraits (blink, row-follow) were again not captured.

Gate: UNVERIFIED: 19 required tiles are not verified on this build; 7 wait on a decision. A deep review does not accept the milestone in any case.

Human judgments (none recorded; they block a milestone, not a ship):
- [owed] Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
- [owed] Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
- [owed] Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
- [owed] Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
- [owed] Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
- [owed] Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
- [owed] Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270)
- [owed] Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
- [owed] Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
- [owed] Combat (FFX-2): should Lady Luck be reachable (a grid node for its owner) or ship dormant (PR-0340); should the reels be timed by the press (PR-0349)
- [owed] Swordplay: yes to the estimates in research/ffx-combat-core.md 5.3 (zone 22/16/12/9 percent, marker 1,400/1,150/900/700 ms), or wait for sourced numbers (a four-row edit, PR-0308)
- [owed] Overdrive inputs: check the Bushido order against the Steam HD copy (D:/Tools/ffx-hd) so the "our estimate" label can go (PR-0308); and how a phone player answers a Bushido or Swordplay (PR-0360, PR-0361)
- [owed] Encounter: is Trema (6.5 percent per attempt) and Den of Woe (24 percent first try) the intended difficulty at human pace (PR-0227, PR-0306, PR-0353)
- [owed] Feel: is a plain FFX-2 Attack of 1.2-1.7 s with the run-in the rhythm he wants; do the telegraph hold (1.14 s, paintings not yet installed) and the 1.22x dressphere push-in read as enough (PR-0368, PR-0314; CHK-B2)
- [owed] Visual: taste on the new paintings (Evrae E1-H, the plate wings, the Yuna, Rikku and Paine dresspheres) and the Echoes of Spira wordmark (CHK-B3)

## Encounters through their real flow

| Chapter | Real flow | Outcome | Note |
|---|---|---|---|
| ch01-seymour-flux | yes | victory seed 1 (1600x900 keyboard, pad, reduce-motion); loss+retry 1600x900 and 2000x1012; phone: defeat on seeds 1 and 1001 (bot weakness, PR-0335) | first menu 2560x1440 and 2000x1012 UI set; the post-scene stamp fires at results (PR-0339 tooling) |
| ch02-yunalesca | yes | defeat seeds 1, 1001; 4 more defeats; victory on seed 4001 after 58 min (r2 run) | second 2560x1080 hero frame captured |
| ch03-braskas-final-aeon | yes | stalled seed 1 on the short budget; victory on the long budget re-runs (win-long, win-long-r2) | r2 had 6 awaitingMenu/screen assertion UNVERIFIED frames (host saturation); win-long is clean |
| ch07-seymour-anima-macalania | yes | victory seed 1 | post-scene frame stamp fires at results |
| ch08-evrae-airship | yes | victory seed 1 (r2 repeat had two 30 s screenshot timeouts at prep, host load) | hero 2560x1440, 2560x1080, 1440x900, 1024x768 frames |
| ch09-yojimbo-cavern | yes | victory seed 1 with 10 clips | first menu at 2000x1012 captured twice (ui and ui-r2 for Evrae; Yojimbo ui) to check PR-0341; Yojimbo and Daigoro drawn in the 2560x1440 first menu |
| ch10-seymour-natus | yes | victory seed 1 |  |
| ch12-seymour-omnis | yes | victory seed 1 |  |
| ch14-isaaru-via-purifico | yes | victory seed 1 |  |
| ch17-sin-fins-core | yes | stalled seed 1 (link 3, command:yuna); victory on the long-budget re-run | PR-0339 pattern |
| ch18-sin-face | yes | victory seed 1 |  |
| ffx2-ch04-bahamut | yes | victory seed 1 at 1600x900, phone touch (clips), pad; loss+retry at 1600x900, 2000x1012 and with clips | Rikku Warrior now draws painted art at the first menu 2560x1440 (PR-0311 re-check) |
| ffx2-ch05-vegnagun-shuyin | yes | defeat seeds 1, 1001; victory on the again run | clips incl. spherechange |
| ffx2-ch06-leblanc | yes | victory seed 1, 14 clips | also the Trigger Happy device matrix chapter |
| ffx2-ch11-fallen-aeons | yes | victory seed 1 |  |
| ffx2-ch13-trema | NO | defeat on seeds 1, 1001 and in the 5-attempt r2 run (seed 4001 last): no victory, no post-battle scene, results of a win never shown (4th consecutive round, PR-0227) | loss and retry real flow completed; victory flow UNVERIFIED |
| ffx2-ch15-den-of-woe | NO | defeat on seeds 1, 1001; r2 run won one chain link fight but the chain ended defeat on seed 4001: results of a win never shown | victory flow UNVERIFIED this round (PR-0306/PR-0353) |
| ffx2-ch16-ixion-djose | yes | victory seed 1 | reachable now (Ixion tile) with the 40-card search |

## Checks

| Check | Result | Mandatory | State | Source |
|---|---|---|---|---|
| CHK-015 | PASS | yes | complete | capture owner |
| CHK-016 | PASS | yes | complete | capture owner |
| CHK-015 | UNVERIFIED | yes | FFX Flux pause matrix (keyboard 14/4, pad 10/3, touch 14/4) and FFX-2 Bahamut (11, 8, 11 pass, 0 fail) | capture owner |
| CHK-015 | PASS | yes | FFX-2 Ch VI Trigger Happy, 3 presses on R, PageDown, mouse, touch tap, pad R1 (Enter 0 by design) | capture owner |
| CHK-016 | UNVERIFIED | yes | clips for the phone, pad, reduce-motion and lose routes | capture owner |
| CHK-021 | PASS | yes | FFX only: Bushido sequences and Swordplay tuning (release 38, PR-0308); FFX-2 absent | combat auditor |
| CHK-023 | PASS | yes | FFX Ch II, XII, XVII, XVIII: Shooting Star, Dragon Fang, Spiral Cut; FFX-2 Ch VI Trigger Happy on five input devices | combat auditor |
| CHK-023 | PASS | yes | FFX Banishing Blade, Tornado (Ch VII Macalania) and Slice and Dice, Energy Rain, Blitz Ace (Swordplay), 1600x900, seed 1, real keys | combat auditor + gap pass |
| CHK-023 | FAIL | yes | FFX-2: Lady Luck reels, Dud and Samurai payloads on every shipped grid | combat auditor |
| CHK-015 | FAIL | yes | FFX Overdrive overlays (Bushido; Swordplay shares the overlay) answered by touch, 390x844 | combat auditor + gap pass + confirmer |
| CHK-008 | FAIL | yes | FFX-2 Ch IV 1024x768 first menu; FFX-2 Ch XV 2560x1080 first menu after a chain hit; FFX-2 Ch VI 2560x1440 first menu | visual auditor |
| CHK-010 | PASS | yes | FFX Ch VIII target single and Ch II target (Auron attack clip), 1600x900 | visual auditor |
| CHK-011 | FAIL | yes | FFX Ch XII first menu, 2560x1440 and 2000x1012, seed 1 | visual auditor |
| CHK-012 | UNVERIFIED | yes | all 18 chapters' chips (painted portraits loaded 2.2-3.3 s after first menu, 0 letter monograms afterwards); FFX-2 Yuna Thief and Paine Thief in battle never exercised | visual auditor |
| CHK-013 | PASS | yes | approved and judge-locked art, in-game at 2560x1440 and 1600x900 | visual auditor |
| CHK-014 | PASS | yes | all 18 first menus 2560x1440, plus 1024x768, 2560x1080 and phone | visual auditor |
| CHK-B3 | UNVERIFIED | no | human judgment | visual auditor |
| CHK-015 | UNVERIFIED | yes | FFX Ch I Seymour Flux 1600x900 keyboard and pad, 390x844 touch; FFX-2 Ch IV Bahamut 1600x900 keyboard, pad, 390x844 touch | feel auditor |
| CHK-016 | PASS | yes | all clips and seq-* sequences used by this audit | feel auditor |
| CHK-021 | PASS | yes | FFX Ch III, IX; FFX-2 Ch V, VI | feel auditor |
| CHK-023 | PASS | yes | FFX Ch III, IX; FFX-2 Ch V, VI, XI | feel auditor |
| CHK-014 | PASS | yes | FFX-2 Ch V Paine dark knight to white mage; FFX Ch III Braska form 2 | feel auditor |
| CHK-B2 | UNVERIFIED | no | owner judgment owed | feel auditor |
| CHK-B3 | UNVERIFIED | no | owner judgment owed | feel auditor |
| CHK-001 | FAIL | no | 6461999e live, 39 fresh-profile route and first-menu runs, FFX and FFX-2 | audio auditor |
| CHK-023 | PASS | yes | audio scope only: title/board/scene/boss/seam/results moments of 18 chapters, FFX and FFX-2, keyboard, pad, touch and reduce-motion runs | audio auditor |
| CHK-023 | PASS | yes | pause hand-back (FFX Ch I, FFX-2 Ch IV) and the ending cues at Ch III (FFX) and Ch V (FFX-2), 1600x900, real keys | audio auditor + gap pass |
| CHK-023 | UNVERIFIED | yes | Chapter XIII Trema victory cue, victory-cue timing on a slow link, Chapter I scene sting, sound-to-motion sync | audio auditor + gap pass |
| CHK-017 | PASS | yes | audio files of the live artifact eca5b98a (main 6461999e, bundle DHaa2xD1), https://baileypillon.github.io/pyrefly-reprise/ | audio auditor |
| CHK-019 | PASS | yes | every shipped audio file, decoded | audio auditor |
| CHK-021 | PASS | yes | audio voicing per game, 39 runs | audio auditor |
| CHK-024 | PASS | no | saved audio settings applied after reload (fixtures 31a, 33, 34, 35) | audio auditor |
| CHK-B1 | UNVERIFIED | yes | shipped music v2 and SFX v2, build 6461999e (audio bytes identical to cd9dbbb0) | audio auditor |
| CHK-002 | PASS | yes | pause full-bleed, FFX Ch I and FFX-2 Ch IV | interface-onboarding auditor |
| CHK-003 | FAIL | yes | first menu, 1600x900 / 2000x1012 / 1440x900 / 1024x768 / 390x844 / 2560 / 4K | interface-onboarding auditor |
| CHK-004 | FAIL | yes | first menu advice card, all chapters, three sizes | interface-onboarding auditor |
| CHK-005 | PASS | no | degenerate boards, engine level | interface-onboarding auditor |
| CHK-006 | PASS | yes | target cancel, pause, results, retry | interface-onboarding auditor |
| CHK-007 | PASS | yes | briefing, board, prep, advisor, intent, pause, results, dialogue | interface-onboarding auditor |
| CHK-008 | FAIL | yes | first menu and target mode | interface-onboarding auditor |
| CHK-009 | PASS | yes | names and values at 1600x900, 2000x1012, phone | interface-onboarding auditor |
| CHK-010 | PASS | yes | selected row and target | interface-onboarding auditor |
| CHK-015 | PASS | yes | Trigger Happy matrix, pause matrices, routes | interface-onboarding auditor |
| CHK-020 | PASS | yes | both games | interface-onboarding auditor |
| CHK-016 | PASS | yes | capture integrity | interface-onboarding auditor |
| CHK-021 | PASS | yes | game scoping of findings | interface-onboarding auditor |
| CHK-017 | PASS | yes | title rename on the live artifact | interface-onboarding auditor |
| CHK-017 | PASS | yes | live main 6461999e, bundle DHaa2xD1; both games; artifact eca5b98a (critic/artifacts/6461999e.json); target version n/a | prep-delivery auditor |
| CHK-016 | PASS | yes | all chapters, both games, 1,816 captures | prep-delivery auditor |
| CHK-018 | PASS | yes | live build, both games, every chapter run | prep-delivery auditor |
| CHK-019 | PASS | yes | live build, both games | prep-delivery auditor |
| CHK-015 | PASS | yes | FFX I Flux and FFX-2 IV Bahamut, 1600x900 keyboard and pad, 390x844 touch; FFX-2 VI Leblanc Trigger Happy 1600x900 and 390x844 | prep-delivery auditor |
| CHK-015 | UNVERIFIED | yes | results screen; physical devices; non-Chromium browsers | prep-delivery auditor |
| CHK-024 | PASS | no | both games; fresh profile per run; reload after every win | prep-delivery auditor |
| CHK-025 | NOT APPLICABLE | no | board, both games | prep-delivery auditor |
| CHK-022 | PASS | yes | FFX I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII; FFX-2 IV, V, VI, XI, XVI: title to board to prep to scene to fight to results to board, victory by real keys, 16  | chief (from capture owner and prep-delivery auditor) |
| CHK-022 | UNVERIFIED | yes | Ch XIII Trema and Ch XV Den of Woe: win, post-battle scene, results, saved reward, human-paced | chief |
| CHK-001 | FAIL | no | title first press and first UI sounds, fresh profile, 1600x900, five runs plus two at 4x CPU throttle | gap pass |
| CHK-017 | PASS | yes | live site, main 6461999e, bundle DHaa2xD1, artifact eca5b98a (1,933 files, 797,683,098 bytes) | chief (from the prep-delivery auditor and the live check) |

Reasons (checks that are not a plain PASS):
- **CHK-015 UNVERIFIED** (FFX Flux pause matrix (keyboard 14/4, pad 10/3, touch 14/4) and FFX-2 Bahamut (11, 8, 11 p): FFX-2 Bahamut kbd, pad and touch: 11, 8, 11 pass, 0 fail. FFX Flux kbd 14/4 fail, pad 10/3 fail, touch 14/4 fail: in every failing run the first menu was entered with the target cursor already open (before.targets 2) so the Esc/P at row 4 closed the cursor and every following row ran one step out of phase; the later rows of the same runs (submenu Esc, targeting Start/Circle) pass. Harness desync, not a product pause bug, but the Esc/P top-row cases for FFX were not cleanly exercised: UNVERIFIED. A separate player-facing question remains (see issue).
- **CHK-016 UNVERIFIED** (clips for the phone, pad, reduce-motion and lose routes): Clip folders exist for the 12 winning routes at 1600x900 (attack, ability-travel, boss-special 1-3, summon, form-change, spherechange, victory, transition clips). The long, phone-clips, lose-clips, pad and reduce-motion routes report 'clips 0' in PROGRESS.md (the lane D/F jobs did not pass --clips or the CDP screencast was off in those contexts), so no clip of the FFX-2 run-in on the phone or a pad-driven clip exists; per game one physical attack, spell with skill travel, boss special, Overdrive/spherechange and victory clip do exist (FFX: Braska, Yojimbo; FFX-2: Vegnagun, Leblanc). Cause: critic tooling bug PR-0376 (clip21.mjs TDZ); the gap pass re-recorded the Flux, Braska and Bahamut clips.
- **CHK-023 FAIL** (FFX-2: Lady Luck reels, Dud and Samurai payloads on every shipped grid): Still wired to nothing a player can reach (AGENTS hard rule 4): critic/rounds/round-21/combat/gap-grid.json (default, Bevelle and Chateau builds) lists no grid or dressphere offering Lady Luck or the Samurai records; r38-lady-luck-grid is not in release 38. Carried as PR-0340, unchanged from round 20.
- **CHK-015 FAIL** (FFX Overdrive overlays (Bushido; Swordplay shares the overlay) answered by touch, 390x844): The auditor's UNVERIFIED was answered by the gap pass and the confirmer: seven taps gave success false, correctInputs 0; the overlay has no tap target (PR-0360). Spiral Cut was not run on a phone.
- **CHK-008 FAIL** (FFX-2 Ch IV 1024x768 first menu; FFX-2 Ch XV 2560x1080 first menu after a chain hit; FFX-2): Three polish-level panel-over-actor cases (the Bahamut intent card over boss torso and Paine at 4:3 with truncated 'YU...'/'RIKK...' names; the CHAIN slab over Rikku and Paine's legs at 2560x1080; the guide card over Yuna's raised pistol at 2560x1440). No panel covers a face. Not re-measured with the 108-state matrix (harness not run).
- **CHK-011 FAIL** (FFX Ch XII first menu, 2560x1440 and 2000x1012, seed 1): One of four Mortiphasm discs is 5.8 percent visible (4.4 at 2000x1012), hidden behind Yuna and Auron; CHK-011 allows about 25 percent. Other measured under-0.75 values (Ch VII Seymour 0.40, Guado Guardian A 0.49) are rect-overlap artefacts: both read clearly in the frame. Ch IX Yojimbo and Daigoro visible 1.0 in the 2000x1012 ui run and 2560x1440 (PR-0341 not reproduced).
- **CHK-012 UNVERIFIED** (all 18 chapters' chips (painted portraits loaded 2.2-3.3 s after first menu, 0 letter mono): Rikku Warrior and Paine Songstress/Rikku Thief render painted and 0 art 404s anywhere; but Yuna Thief and Paine Thief were not worn in any round-21 run (no yuna-thief or paine-thief idle request in any network-media.json), so the placeholder question for Yuna Thief cannot be answered. The 1.2-4 s window with letter tiles (OBS-04, Ch VII Guado chips) is load timing on a saturated host, not a shipped fallback.
- **CHK-B3 UNVERIFIED** (human judgment): Taste judgments on the new paintings (Evrae E1-H, wings, Yuna/Rikku/Paine dressphere paintings) need Bailey; the auditor judged rendering and consistency only.
- **CHK-015 UNVERIFIED** (FFX Ch I Seymour Flux 1600x900 keyboard and pad, 390x844 touch; FFX-2 Ch IV Bahamut 1600x9): Real keyboard, pad and touch events were used and FFX-2 Ch IV passes 11/11, 8/8 and 11/11, but FFX Ch I rows 4-7 (top-row Esc / P opens pause and resumes) were driven from a state with the target cursor open (before targets=2, caused by the coach-card Enter), so the top row on FFX is not proved on keyboard or touch; on the pad, rows 10-13 diverge (Circle from pause-in-targeting also drops the target cursor, R21-FEEL-02). Needs a re-run from a profile that has dismissed the coach cards.
- **CHK-B2 UNVERIFIED** (owner judgment owed): Bailey's play verdict on input and animation feel after release 38 is not recorded; the harness has no per-press latency and no real controller or phone.
- **CHK-B3 UNVERIFIED** (owner judgment owed): No human story read is recorded; the harness hold-skips every scene so reading pace is unmeasured; the title rename's tone is a taste call for Bailey.
- **CHK-001 FAIL** (6461999e live, 39 fresh-profile route and first-menu runs, FFX and FFX-2): Technical half PASS: qa --strict exit 0 (0 cue findings, 0 SFX findings; 26 cues -16.00 to -16.21 LUFS, max true peak -1.08 dBTP, 0 clipped, every loop seam ok), ffmpeg decode 62 of 62 files with 0 errors (28 of 28 shipped MP3s), 29 of 29 shipped files byte-identical live. Routing half FAIL, as round 20: step 3 (nothing falls back to the synth path) is not met: 109 synth SFX entries in 34 of 39 runs (cursor-move 98, confirm 11), sfxLog[0] synth in 34 of 39, last synth at 2.7 to 6.4 s; 'battle-start' plays in 0 of 39 (PR-0326's acceptance check, no via:synth entry in a fresh-profile run, is not met). Cause unestablished (R20-AUD-01). Heard-and-approved half is CHK-B1 (owed). Game: both.
- **CHK-023 UNVERIFIED** (Chapter XIII Trema victory cue, victory-cue timing on a slow link, Chapter I scene sting, ): No Trema victory in 13 gap-pass attempts, so victory-ffx2 at a Trema results screen was not sampled (phase 2 boss-ffx2-aeon was seen); the victory-cue timing series, the Ch I scene sting and the sound-to-motion sync (needs ears and a time-aligned log) were not run.
- **CHK-B1 UNVERIFIED** (shipped music v2 and SFX v2, build 6461999e (audio bytes identical to cd9dbbb0)): Agents cannot hear. docs/audio/OWNER-VERDICT.md has no numeric verdict (unchanged since 2026-09-29); the latest ear words about the shipped mix are 2026-09-27 'still sounds like snes music' (release 21, before music v2); D-349 'no number given yet'; D-307 to D-309 unanswered. Owed to Bailey via docs/audio/audition.html.
- **CHK-003 FAIL** (first menu, 1600x900 / 2000x1012 / 1440x900 / 1024x768 / 390x844 / 2560 / 4K): Floor 14 px: advisor card 14.2 px everywhere and phone 14 px pass; HUD labels 12.25 px (FFX) and 11.68 px (FFX-2 command label), max-HP numbers 12.5 px, dialogue role chip 8.51 px at 1600x900, 7.84 px at 1024x768 (PR-0251, widened). Polish.
- **CHK-004 FAIL** (first menu advice card, all chapters, three sizes): Legality holds (advisor-ownership 18 chapters, 0 illegal; 0 target mismatches in all desktop routes) but menu path and cost are dropped by the stub card in Ch VII, IX, XII at 1600x900 and Ch XVII, XVIII at all desktop sizes (PR-0330 widened). Ch III and FFX-2 Ch IV pass.
- **CHK-008 FAIL** (first menu and target mode): Panels over actors or each other: TARGET plate over 'FACING HIM' (Ch XII), dialogue banner over the intent card (Ch XV), phone coach tag over intent line (PR-0237). All polish.
- **CHK-015 UNVERIFIED** (results screen; physical devices; non-Chromium browsers): Not exercised with real input: pause on the results screen, the keys G, N, E and F outside the first-turn probes, a real physical controller, a real phone, Safari and Firefox; FFX touch was proved at battle taps only (Chapter I phone lost 4 of 4, PR-0335).
- **CHK-025 NOT APPLICABLE** (board, both games): No FF7 experiment file changed (the only FF7 path in git diff cd9dbbb0..6461999e is tests/unit/ff7-repair.test.ts) and every board capture lists 18 tiles with no FF7 card.
- **CHK-022 UNVERIFIED** (Ch XIII Trema and Ch XV Den of Woe: win, post-battle scene, results, saved reward, human-p): Trema 0 of 7 attempts in the capture runs and 0 of 13 in the gap pass (12 defeats, one link won), Den of Woe 0 of 7 in the capture runs; loss, retry and board reached. Den of Woe's flow (win on the third link, scene, Results with NEW BEST, Confirm, scene, board) was seen once under a labelled autoBattle hook, which is not a human-paced run. Carried PR-0227, PR-0306, PR-0353.
- **CHK-001 FAIL** (title first press and first UI sounds, fresh profile, 1600x900, five runs plus two at 4x C): The title Enter asks for no sound in 7 of 7 runs, unthrottled and throttled alike (PR-0326); TitleScreen.advance plays the battle-start cue from the sprite only if it is decoded. Consistent with the audio auditor's CHK-001 routing FAIL (first UI sounds synth in 34 of 39 runs).

## Coverage matrix

### Tested
- All 18 chapters on the live site by real keys from fresh profiles (98 capture jobs plus 3 extra long win re-runs, 1,816 index records, headless Chromium PYREFLY_BROWSER=gpu): 16 won through results, CONFIRM, aftermath, board and a reload that keeps the clear (21 winning runs); loss and retry for Flux (1600x900, 2000x1012, phone), Bahamut, Yunalesca, Vegnagun, Trema, Den; retry 7.3-8.9 s when the host was quiet
- Window shapes: first menus at 1600x900, 2000x1012, 2560x1440 (all 18, top row asserted), 2560x1080 (Ch II, IV, VIII, XV), 1440x900, 1024x768, 3840x2160 (Ch I, IV), phone 390x844 touch
- Release 38 changes: Trigger Happy on five devices; Bushido sequences (Shooting Star, Dragon Fang, Banishing Blade, Tornado) and Swordplay params by real keys; skill travel and the FFX-2 run-in in clips; Flux and Braska telegraph holds in clips; Ch II and VIII restaging; Evrae E1-H and its order widget; painted wings; Rikku Warrior and Yuna Thief art; the title rename; exact lossless-WebP shipping through the exact-artifact check
- Combat: data audit of changed values against research/, own Bushido oracle on the real overlays, 1,200-run A/B digests across 10 FFX-2 families, the FFX three-line bench (53 rows), Ch XVII card 200 seeds on both trees, replay of 17 real-key FFX command streams, unit suite 798 files and 11,754 tests
- Visual and targets: verify-approved 711 and 48, 98 target composites, facing and ground contact in all 18 first menus
- Feel: skill-travel, run-in, telegraph-hold, dressphere (7 changes) and seam clips and sequences read frame by frame; entry timing in 39 runs; frame times from the single-lane perf jobs
- Audio: qa --strict, ffmpeg decode 62 of 62, 29 of 29 files identical to the manifest and live, 307 AudioManager samples in 39 runs, pause hand-back, endings, title first sounds
- Interface and onboarding: 269,121 characters of player text swept, advisor card size and clearance, 109 vitest, simulated newcomer walkthrough
- Delivery: verify-live (46 and 1,053 files), 6,427 media requests, 0 console errors in 97 of 98 jobs, single-lane load and frame-time measurement
- Gap pass (real input, labelled hooks): phone Overdrive by touch, Banishing Blade, Tornado, Slice and Dice, Energy Rain, Blitz Ace, Flux and Braska clips, Evrae order widget, pause audio, endings, title sounds, one Den of Woe victory flow under autoBattle; confirmer live run of Yuna Thief and Ch XVII bench

### Reused, with the dependency argument
- **CHK-024 save and settings upgrade matrix (24 cases)** (from critic/rounds/round-19b): No change to SaveData.ts or any settings file between c69de96a and 6461999e (git diff empty), no added localStorage or sessionStorage write; 21 of 21 victory runs this round reload with the clear kept; no open related defect. Not exercised: a stored LIVING PAINTINGS OFF from an upgraded save
- **Audio half of the save matrix (volumes applied from storage after reload) and the pause cue hand-back as a static argument** (from critic/rounds/round-20/audio/routing.json (itself from 19b, 18)): src/audio, SaveData.ts, saveSfxBalance.ts and every settings file are unchanged and no audio byte changed (29 of 29 files sha-identical); volumes 0.8/0.7/0.7 and sfxMix b/1/0.70 re-observed in 307 of 307 samples; the live pause sample is NOT reused: the gap pass took it fresh
- **CHK-019 Chromium and WebKit full-set image load (941 of 941)** (from docs/handoff/release-38.md gate row (art-browser-load, Chromium 153 and WebKit 26.6)): verify-live shows the served files equal the build byte for byte, so the gate applies to the served files; labelled reused
- **Prep, results and board code and data reading** (from critic/rounds/round-20): src/app prep, results and board files are untouched in release 38 (only battle-flow, cutscene, title markup and pause files change); every comparable results panel was re-compared against round 20 and found identical, so only the prep tabs not opened by input are carried
- **Approved-target tally base (70 matched, 18 unverified)** (from critic/rounds/round-20.json targets (sha 83bef3ea)): targets.json changed only by the Camera Lab verdict tile (not required) and recorded decisions; approved 711 of 711 and judge-locked 48 of 48 verified byte-identical on this tree; 98 composites re-made from round-21 captures
- **PR-0349, PR-0350, PR-0351, PR-0273, PR-0217 (combat polish)** (from critic/rounds/round-20 evidence): git diff cd9dbbb0..6461999e touches src/battle and src/data in four FFX files only (overdrive.ts, overdrive-auron.ts, overdrive-tidus.ts, overdrive/inputs.ts), none of which FFX-2 or the status code imports; the round-20 probes (pay table, Dud, payloads, Bulwark, link-3 rows, gap grid, immune-miss list, CTB rows) were RE-RUN fresh and are byte-identical
- **PR-0270 and the carried-without-re-observation interface items (PR-0248, PR-0249, PR-0286, PR-0288, PR-0291, PR-0296, PR-0302, PR-0303, PR-0304, PR-0321, PR-0325)** (from critic/rounds/round-20): applyComfort.ts, hudTextSize.ts and the options files are unchanged between cd9dbbb0 and 6461999e; EnemyIntent, the cure hint and the phone pause layout are unchanged apart from MoveAdvisor.ts, advisorRoomy.ts, advisorLane.ts, TriggerHappy.ts and minigames.css; no frame at the relevant state was captured, so these are carried open, not verified
- **CHK-017 title rename on the live URL** (from critic/reviews/6461999e-live.json): same build and bundle; this round's frames and text sweep (1.77 M characters, 0 occurrences of the old name) confirm the rename in title, briefing and pause header

### Not tested
- Firefox, Safari, Edge, iOS Safari, a physical phone, a physical gamepad (pad events were emulated), a throttled network entry, a weaker GPU
- Trema and Den of Woe human-paced victory; Paine Thief in battle; the dressphere push-in; the Ch IX hurried-opening arrival; Lulu's Fury and wind-up paintings; living pause portraits; TEXT SIZE 115 and 130; CONTROLS and EYE CANDY pages; prep tabs by input; Lady Luck by a human path

### Required and not tested (these keep the deep obligation pending)
- FFX-2 Ch XIII Trema and Ch XV Den of Woe: a human-paced win with post-battle scene, results and saved reward (CHK-022; PR-0227, PR-0306, PR-0353)
- Bailey's numeric listening verdict for the shipped mix (CHK-B1, PR-0148), his play verdict on feel (CHK-B2) and his story read (CHK-B3)
- FFX-2 Paine Thief dressphere in battle after the twirl (CHK-012) and the D-346 dressphere push-in where no clean close shot exists (PR-0314)
- FFX-2 Ch IV Bahamut at 2000x1012 and at 390x844 after the coach card is dismissed (PR-0316, PR-0333, PR-0344)
- FFX Ch IX night-sakura arrival at a hurried opening and the PR-0342 blue-tree check (FOC371-01)
- Lulu's Fury and a wind-up painting playing; the living pause portraits (blink, smile, press, row-follow)
- FFX Ch XII first menu at 1600x900 with the four Mortiphasm visibilities; FFX-2 Ch XV 21:9 and the 3x tier (PR-0365)
- TEXT SIZE at 115 and 130 percent, the CONTROLS tab and the EYE CANDY page (PR-0270, PR-0322, PR-0323); multi-target and all-party target frames
- FFX-2 Lady Luck by a human path (PR-0340, unreachable on every shipped grid) and the Swordplay miss path; Spiral Cut on a phone
- Prep tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSPHERES, ACCESSORIES by real input at three sizes (PR-0292, PR-0295)
- Throttled cold entry, a weaker GPU and frame time at 2560x1080 and 3840x2160 and across the first dressphere change (PR-0259, PR-0327); real controller, Firefox, Safari, Edge and a physical phone
- Audio: victory-cue timing on a slow link, the Ch I scene sting, sound-to-motion sync and the Trema victory cue (CHK-023)
- Retry attempts 2 and later: battle logs for replay against the engine

## Gap pass and confirmation

- **PASS**: combat-encounter: Auron Banishing Blade and Tornado from the OVERDRIVE menu, real keys, chips typed, log kept (CHK-023, PR-0308) Note: FFX only. Chapter was seymour-anima-macalania, 1600x900, seed 1, keys from title. Only hook: Auron's overdrive gauge forced to 100 (labelled). Not Ch XVII/XVIII: Auron there has only Dragon Fang and Shooting Star, and a gauge-hook cannot add moves because the menu is built from the build. Banishing Blade chips read BUSHIDO · ENTER THE SEQUENCE ↑ L1 ↓ R1 → ← △; typed ↑ F ↓ R → ← Shift. Log: minigame-request, action-st
- **PASS**: combat-encounter: Tidus Slice and Dice, Energy Rain, Blitz Ace through the Swordplay bar with zoneWidth and engine timing read back Note: FFX only, 1600x900, seed 1, real keys, Tidus gauge forced to 100 (labelled hook). minigame-request params: slice-and-dice timerMs 3000, energy-rain 2600, blitz-ace 2200; travelMs 1059 and zonePercent 12.22 for all three. One real Enter at about 0.9 s resolved each as tidus-timing success true (timeRemaining 399, 951, 584 ms). Overlay reads SWORDPLAY · CONFIRM IN THE GOLD ZONE. Miss path not exercised. The ability is 
- **FAIL**: combat-encounter: FFX at 390x844 touch, full Overdrive, Shooting Star, answer by tapping (R21-CE-01) Note: Touch context at 390x844, Auron gauge forced to 100 (labelled). The BUSHIDO overlay opens as a slab of seven tiny PlayStation glyph chips with a 3.4 s ring and offers no tap target: the overlay has no button, role=button or touch element, and no touch chrome appeared. Seven taps on the overlay gave success false, correctInputs 0, timeRemaining 0; the move then auto-resolved for 1451 damage. A phone player cannot answ
- **UNVERIFIED**: combat-encounter: FFX-2 Ch XIII Trema and Ch XV Den of Woe human-paced run to victory with post-battle scene and results (CHK-022) Note: Not human-paced: the fight was handed to autoBattle('intended') at speed fast (labelled hook) after real keys reached the first menu. Den of Woe: victory on the 3rd link, post-battle scene, Results (Victory, EXP/AP/Gil, NEW BEST, 2:34), Confirm, scene, back on the board: the flow works and the results screen reads well. Trema: link 1 won, phase 2 reached (see audio), then 12 defeats in 13 attempts in 20 minutes, neve
- **UNVERIFIED**: combat-encounter: FFX-2 Lady Luck human path / reel overlay (PR-0340) Note: Not attempted: no grid in this build reaches Lady Luck by a human path (PR-0340 still open) and no equivalent lane has landed.
- **UNVERIFIED**: combat-encounter: Retry attempts 2+ battle-log retention (1001, 2001, 3001, 4001 replays) Note: Not done. The Trema run made 13 attempts but battleLog was not saved per attempt, so retry-seed replays cannot be checked against the engine.
- **UNVERIFIED**: visual-targets: FFX-2 Ch VI Leblanc / Ch XIII Trema Yuna and Paine changing to Thief, frames after the twirl; dressphere push-in Note: Not captured. The intended autoplay in the Bahamut clip run made no spherechange, so no dressphere shot was recorded.
- **PASS**: visual-targets: FFX Ch I Seymour Flux and Ch III Braska's Final Aeon boss telegraph hold (D-355) with clips Note: FFX only, 1600x900, seed 1, autoBattle('intended') at normal speed after real keys (labelled hook). Flux Lance of Atrophy: the move-name banner sits over a still tableau with a red edge tint for roughly 1.5 s before the hit lands (damage 789 on Yuna). Braska Ultimate Jecht Shot: banner and hold before the 3170 hit. Hold timing and the heartbeat tint are in motion; the held telegraph painting itself is not separately 
- **UNVERIFIED**: visual-targets: FFX Ch IX hurried opening night-sakura arrival and PR-0342 blue tree Note: Not captured in this pass.
- **UNVERIFIED**: visual-targets: FFX-2 Ch IV Bahamut at 2000x1012 and 390x844 after the coach card (PR-0316, PR-0333) Note: Not captured. Only 1600x900 clips of Bahamut attack and skill travel were recorded.
- **UNVERIFIED**: visual-targets: Lulu's Fury and a wind-up painting Note: Not captured.
- **UNVERIFIED**: visual-targets: Living pause portraits (blink, smile, press, eyes following) Note: Not captured.
- **PASS**: visual-targets: FFX Ch VIII Evrae order widget (E1-H) at 1600x900 and 2560x1080 Note: FFX only, seed 1, real keys. At 1600x900 the PULL BACK / CLOSE IN stack (x76 y608 448x227) and the 'This order costs' slab (y748 to 835, 87 px) are clear of each other and of the rail, readable, with 'Already near' on Close in and three volley pips. At 2560x1080 the widget scales (537x273 plus 550x105 slab), no overlap. Frames seen: 1600x900 viewed; 2560x1080 judged from geometry only.
- **UNVERIFIED**: visual-targets: FFX Ch XII first menu with four Mortiphasm rect visibilities; FFX-2 Ch XV 21:9 and 3x tier Note: Not captured in this pass.
- **PASS**: feel-narrative: Flux ability-travel, boss-special and telegraph-hold clips (Flux half of D-355) Note: Same run as the telegraph item: clips recorded and in the index. Autoplay hook labelled. Not a human win route: the run ended in a defeat.
- **UNVERIFIED**: feel-narrative: FFX-2 Ch IV Bahamut clips: attack, spherechange, Shell in Wait Note: Attack and skill-travel clips recorded at 1600x900 only. No spherechange or Shell-in-Wait clip: the intended autoplay never changes dressphere. 2000x1012 not run.
- **UNVERIFIED**: feel-narrative: dressphere changes in Wait and Active at 50 ms sampling (PR-0314, PR-0334, PR-0315) Note: Not done.
- **UNVERIFIED**: feel-narrative: pause matrix re-run from a coach-dismissed profile, pad targeting row (CHK-015 rows 4-7, R21-FEEL-02) Note: Not done in this pass.
- **UNVERIFIED**: feel-narrative: Isaaru Via Purifico Bahamut summon turn on a quiet machine Note: Not done. The host also ran other lanes during my captures, so none of my timings are quiet-host timings.
- **UNVERIFIED**: feel-narrative: per-press input latency record, human-pace scene reading Note: Not done.
- **UNVERIFIED**: feel-narrative: FFX-2 Trema and Den of Woe victory flow to results (CHK-022) Note: Den of Woe flow completed under the autoplay hook (see the combat item); Trema did not reach a win. Same limits.
- **UNVERIFIED**: feel-narrative: Bailey's play verdict and human story read (CHK-B2, CHK-B3) Note: Needs the owner; an agent cannot supply it.
- **PASS**: audio: PAUSE (CHK-023) FFX Ch I and FFX-2 Ch IV at 1600x900, real Esc, samples +0.5 s and +3 s Note: Real Esc, seed 1, no hooks beyond setSeed; host was otherwise quiet for these runs. FFX-2 Ch IV: +0.5 s pause cue already current at gain 0.0006 with the boss cue fading (0.17); +3 s playing pause; after resume +0.5 s boss-ffx2-aeon current, pause fading; +3 s boss cue back at gain 1, music.current equals it. FFX Ch I: +0.5 s still boss-seymour at gain 1 (not yet ducked); +3 s playing pause; resume restores boss-seym
- **UNVERIFIED**: audio: CHAPTER XIII TREMA phase 2 and victory samples (scene-bevelle-underground, boss-ffx2-aeon, victory-ffx2) Note: Real phase swap seen under the autoplay hook (labelled): first menu current scene-bevelle-underground (15 s); link 1 victory at 139 s still scene-bevelle-underground; phase 2 begins and boss-ffx2-aeon replaces it at 169 s. No Trema victory in 13 attempts, so victory-ffx2 at a Trema results screen was not sampled (victory-ffx2 did play at the Den of Woe and Vegnagun results).
- **PASS**: audio: ENDING CUES Chapter III (FFX) and Chapter V (FFX-2) after the results confirm Note: Hook (labelled): autoBattle('intended'), speed fast, after real keys to the first menu; results and scenes by real Enter. Ch III: results victory-ffx playing, post-scene/ending scene music.current ending-ffx (620 s run clock), then the board. Ch V: results victory-ffx2, post-scene ending-ffx2 as playing and music.current, then the board. Played on 1600x900.
- **FAIL**: audio: TITLE AND FIRST SOUNDS (R20-AUD-01 / PR-0326) sfxLog every 250 ms, 5 repeats plus throttled Note: Fresh profile, real keys, 1600x900, gpu mode. In 7 of 7 runs the title Enter at about 0.9 s asked for no sound: the log contains only the first board cursor-move (via sprite, audio time 2.9 s unthrottled / 3.5 s throttled, 3.8-4.4 s after load). TitleScreen.advance calls playSfxFromSprite('battle-start') and by design plays nothing if the v1 sprite is not decoded yet, so the first press is silent, and was silent ever
- **UNVERIFIED**: audio: VICTORY CUE TIMING (R21-AUD-01) FFX Ch VIII, Ch I, FFX-2 Ch XI wins; Slow 4G Note: Not run as specified. Incidental: victory-ffx playing at the Ch III results (about 3 s after battle-over) and victory-ffx2 at Ch V and Ch XV results; not a timed series.
- **UNVERIFIED**: audio: CHAPTER I SCENE STING (scene-gagazet then boss-seymour) Note: Not sampled inside the pre-battle scene; the pause run only showed boss-seymour at the first menu.
- **UNVERIFIED**: audio: SOUND-TO-MOTION SYNC Note: Needs ears and a time-aligned log; not done.
- **UNVERIFIED**: audio: OWNER EARS (CHK-B1) Note: Owner only.
- **UNVERIFIED**: interface-onboarding: TEXT SIZE 115/130, Pause CONTROLS and EYE CANDY pages, touch and pad Bushido keys, multi-target frames, Ch III first menu x10, phone pause scroll, real gamepad / WebKit, human newcomer Note: Not captured in this pass. One related fact for R21-IF-01: on the phone the Bushido overlay shows PlayStation glyph chips (△ ○ □ ← → ✕) with no tap targets, and the Swordplay overlay (Spiral Cut / Slice & Dice / Energy Rain / Blitz Ace) shows 'CONFIRM IN THE GOLD ZONE' with MISS/HIT, also with no phone control observed.

- **confirmed**: PR-0269 (carried, unchanged, still open): Chapter XVII's advisor card chain wins 48.5 percent; Genais's Sigh on link 3 is the largest loss
- **confirmed**: PR-0340 (carried, unchanged): Lady Luck's reels, Dud and the Samurai payload records ship but no shipped FFX-2 Garment Grid or dressphere list offers them, so n
- **confirmed**: R21-CE-01 (new, PLAUSIBLE, found by the combat auditor, scored under interface): the FFX timed Overdrive overlays (Bushido, Swordplay, Slots) have no touch or p
- **REFUTED**: PR-0311 (carried, narrowed): Yuna Thief and Paine Thief dresspheres were not exercised, so the grey-mannequin question stays open; Rikku Warrior is fixed
- **confirmed**: PR-0148 (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)
- **confirmed**: PR-0099 (carried, STALLED): chapter rows in THEMES.md still play a stand-in cue (VI, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII)
- **confirmed**: R21-IF-01 (new; FFX only): the Bushido sequence overlay shows PlayStation glyphs only; keyboard and touch players are never told which key is which, and the new

## Ranked issue list (every issue, most severe first)

119 issues: 0 critical, 8 major, 100 polish, 11 suggestions. Ranking inside a severity: the owner's reported problems, frequency, player impact, coverage, effort. Issues marked "carried, not re-examined" had no evidence this round.

### Major (8)

1. **PR-0148** [audio] PR-0148 (carried, owner-reported, STALLED): no numeric owner listening verdict for the shipped mix (music v2, SFX v2)
  - game / chapter: both / all
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - observed: RUBRIC section 6 includes Bailey's listening assessment in the audio category and no numeric owner verdict exists for the shipped mix. The last ear words on shipped audio are 2026-09-27 'still sounds like snes music' (release 21); music v2 and SFX v2 (D-302, D-303, D-306) were adopted on recommendation without listening; D-349 records 'no number given yet'; D-307, D-308 and D-309 are unanswered. OWNER-VERDICT.md is unchanged since 2026-09-29. Audio bytes in build 6461999e are identical to round 20's, so nothing has changed that would answer this.
  - repro: Read docs/audio/OWNER-VERDICT.md, docs/target/decisions.json (D-302, D-303, D-307 to D-309, D-349) and docs/target/targets.json (audio tile): no number from 0 to 10 for the shipped mix.
  - evidence: docs/audio/OWNER-VERDICT.md; docs/target/decisions.json D-349; critic/rounds/round-20.json R20 audio category (same state); git diff cd9dbbb0..6461999e over public/audio and src/audio is empty
  - confidence: high
  - requirement: RUBRIC section 6 (audio: Bailey's listening assessment), CHK-B1, AGENTS.md hard rule 13
  - fix: Bailey listens from docs/audio/audition.html (ten minutes) and gives one number from 0 to 10 for the shipped music v2 and SFX v2, plus an answer to D-307, D-308 and D-309. The critic then scores the category; an agent never invents the number.
  - acceptance check: A dated, verbatim numeric verdict in OWNER-VERDICT.md tied to a named build and cue set; the audio category moves from UNVERIFIED to scored.
  - status: open (STALLED: method check owed), owner-reported, round 20 (cd9dbbb0)
2. **PR-0269** [combat] PR-0269 (carried, unchanged, still open): Chapter XVII's advisor card chain wins 48.5 percent; Genais's Sigh on link 3 is the largest loss
  - game / chapter: FFX / Ch XVII Sin: the Fins and the Core (sin-fins-core), link 3
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - expected: The advisor's first-ranked line should be a competitive route through the chain on a clear majority of seeds (round 19b/20 bar).
  - observed: Card-following chain (v3 card, shipped options {}, seeds 1-200): 97/200 on cd9dbbb0 and on 6461999e (identical); sensible line 51/200, naive 0/200 (escape at link 1). Losses: link3 Sin Genais's Sigh 60, link 3 core elements 29, link 2 fins 12. Real keys this round: victory on the long-budget re-run (234 turns), stalled at link 3 on the short budget. The confirmer re-ran sin-ab.test.ts on the current tree (critic/rounds/round-21/combat/sin-ab-confirm.json) and got the same 97/200, sensible 51/200, naive 0/200. Open at major in rounds 19b, 20 and 21 (stalled by the two-review rule: a written method check is owed before another batch).
  - repro: critic/rounds/round-21/combat/sin-ab.test.ts with R21_ROOT=D:/Final Fantasy (and the cd9dbbb0 export for A/B); sin-ab-cand.json equals sin-ab-base.json and round 20's.
  - evidence: critic/rounds/round-21/combat/sin-ab-cand.json, sin-ab-base.json; critic/rounds/round-21/evidence/sin-fins-core-win-long/run.json
  - confidence: high
  - requirement: Encounter and advisor fairness (RUBRIC 6 combat; CHK-005)
  - fix: Teach the Ch XVII card a Genais's Sigh answer for link 3 (Genais's Sigh is the single largest loss) and re-measure on 200 seeds; do not change boss numbers.
  - acceptance check: Card chain wins at least 70/100 on 200 seeds with Genais's Sigh no longer the largest loss; Ch XVIII rows unchanged.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
3. **PR-0360** [interface] PR-0360 (new; R21-CE-01, confirmed): the FFX timed Overdrive overlays (Bushido, Swordplay) have no touch or pointer path, so a phone player can only ever resolve them as the Fail row
  - game / chapter: FFX / Any FFX chapter at 390x844 touch when Tidus's Swordplay or Auron's Bushido is chosen (Ch I, II, X, XII, XVII, XVIII)
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - expected: Every timed input the game asks for is answerable on every supported device (RUBRIC section 2: keyboard, mouse, gamepad and touch), or the phone resolves it by a stated, honest rule.
  - observed: AuronSequence.ts, TidusTiming.ts and WakkaReels.ts read input only through RawInputWatcher (keyboard and gamepad); only LuluFury has click handling. touch-probe.json: 60 pointerdown, pointerup, touchstart, touchend and click events per overlay on the real Dragon Fang, Shooting Star, Banishing Blade, Tornado, Spiral Cut and Blitz Ace overlays answer none of them, and each resolves success:false only when its 2.2 to 4 s timer expires. Release 38 adds a Square (K, pad 2) requirement to Shooting Star, which touch cannot press either. The phone HUD plan names Overdrive minigames 'keep today's layout' (out of scope), not their input; no phone capture reached an FFX Overdrive, so the real phone path is not seen. GAP PASS (real 390x844 touch on the live site, seed 1, Auron gauge forced to 100: a labelled hook): the BUSHIDO overlay is a slab of seven tiny PlayStation glyph chips with a 3.4 s ring, with no button, no role=button and no touch chrome; seven taps gave success false, correctInputs 0, timeRemaining 0 and the move auto-resolved for 1451 damage. The confirmer read the code: RawInputWatcher attaches only keydown and the gamepad poll and the phone HUD sendKey bar covers the target step only. Not blocking: the fight continues on the Fail row. Not a regression: git diff f4244e1f..6461999e over src/ui/ffx/minigames and rawInput.ts adds no touch route and removes none (release 38 touched AuronSequence.ts, TidusTiming.ts and rawInput.ts by 5 to 6 lines each, the Square key and the params), so live 37.1 Bushido and Swordplay were equally unanswerable by touch. Spiral Cut shares the Swordplay overlay and was not run on a phone.
  - repro: critic/rounds/round-21/combat/touch-probe.test.ts (jsdom, fake timers, params from the real engine). Real repro to capture: 390x844 touch, an FFX chapter, give Auron a full gauge, choose Shooting Star, tap the chips and the screen.
  - evidence: critic/rounds/round-21/combat/touch-probe.json; critic/rounds/round-21/evidence/gaps/phone-od/seymour-anima-macalania-shooting-star.json, seymour-anima-macalania-shooting-star-overlay.png and ...-after-taps.png; src/ui/ffx/minigames/*.ts (RawInputWatcher only); docs/handoff/phone-battle-hud.md line 116
  - confidence: high (overlay proven in jsdom, device path captured live by the gap pass, code read by the confirmer)
  - requirement: RUBRIC 2 platform goals; CHK-015 (touch positive path)
  - fix: Give the Bushido chips and the Swordplay bar tap targets (a tap on the next expected chip; a tap on the bar), or an on-screen pad on touch devices, FFX only; keep keyboard and pad as they are.
  - acceptance check: A touch capture at 390x844 completes Shooting Star and Spiral Cut by tapping and the engine receives success:true with the full correctInputs.
  - status: open
4. **PR-0340** [combat] PR-0340 (carried, unchanged): Lady Luck's reels, Dud and the Samurai payload records ship but no shipped FFX-2 Garment Grid or dressphere list offers them, so no player can reach them
  - game / chapter: FFX-2 / Ch IV, V, VI and every FFX-2 chapter (shipped grids)
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - expected: A shipped subsystem with a unit suite and a pay table is reachable through a normal grid (AGENTS hard rule 4, CHK-023).
  - observed: gap-grid.json: the default, Bevelle and Chateau builds list Gunner, Thief, Warrior, Black Mage, White Mage, Songstress, Dark Knight, Alchemist and no Samurai or Lady Luck row; 0 reel, Dud or lady-luck events in 16 FFX-2 real-key battle logs; r38-lady-luck-grid is not merged into release 38.
  - repro: npx vitest run --config critic/rounds/round-21/combat/vitest.critic.config.ts gap-grid; read gap-grid.json; grep separation.json 'll'.
  - evidence: critic/rounds/round-21/combat/gap-grid.json, separation.json
  - confidence: high
  - requirement: CHK-023 / hard rule 4
  - fix: Land the r38-lady-luck-grid lane (a grid or dressphere that offers Lady Luck) or switch the reel subsystem off by design and say so; the lane's reel-over-numeral z-index question must be settled first.
  - acceptance check: A real-key route spins Lady Luck on a shipped grid and the engine receives the reel result (reel event, Dud or payload) in the battle log.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
5. **PR-0270** [onboarding] PR-0270 (carried, FOURTH review, STALLED): TEXT SIZE grows nothing in the FFX-2 battle HUD
  - game / chapter: FFX-2 only
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - expected: The TEXT SIZE row covers both battle HUDs or says it covers FFX only.
  - observed: TEXT_SIZE_WIDE_SCOPE is still false at src/app/applyComfort.ts:41; applyComfort, hudTextSize and the options files are unchanged between cd9dbbb0 and 6461999e. No frame at 115/130 this round (UNVERIFIED visually).
  - repro: FFX-2 Ch IV, TEXT SIZE 130%.
  - evidence: git diff cd9dbbb0 6461999e over src/app (no change); src/app/applyComfort.ts:41
  - confidence: high
  - requirement: RUBRIC onboarding: text access; section 8 stagnation rule
  - fix: Flip the scope with the FFX-2 HUD measured, or relabel the row; a written method check is owed first.
  - acceptance check: textSweep at 130% grows in FFX-2 and stays inside the card clearances.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
6. **PR-0099** [audio] PR-0099 (carried, STALLED): chapter rows in THEMES.md still play a stand-in cue (VI, IX, X, XI, XII, XIII, XIV, XV, XVI, XVII, XVIII)
  - game / chapter: both (FFX: IX, X, XII, XIV, XVII, XVIII; FFX-2: VI, XI, XIII, XV, XVI) / VI, IX to XIII (FFX-2: VI, XI, XIII, XV, XVI), XIV, XVII, XVIII
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - observed: The chapter cue map marks these chapters 'stand-in' or 'borrowed' (themes-audit prints 'borrowed; owed' on VI, IX, X, XI, XIII, XIV, XV, XVI, XVII, XVIII; XII is a stand-in in the table). Round 21's routing confirms what plays: Ch VI, XI, XVI and XIII phase 2 on boss-ffx2-aeon; Ch IX and XIV on boss-yojimbo; Ch X on boss-seymour-macalania; Ch XII on boss-seymour with scene-dreams-end; Ch XV on boss-shuyin; Ch XVII and XVIII on scene-fahrenheit and boss-evrae. D-209 says a stand-in never counts as finished. Nothing changed in this build.
  - repro: node tools/audio/themes-audit.mjs (cue-map section), then read critic/rounds/round-21/audio/routing.json for the cues actually playing per chapter.
  - evidence: critic/rounds/round-21/audio/themes-audit.txt; critic/rounds/round-21/audio/routing.json
  - confidence: high
  - requirement: docs/audio/THEMES.md chapter cue map; D-209
  - fix: Compose and ship the owed cues in D-209's list after the audio direction pick (boss-leblanc, boss-trema, boss-den-of-woe, the Natus and Omnis cues, the Sin assault and countdown cues, and the rest), each auditioned by Bailey before it ships (rules 8 and 13).
  - acceptance check: The row's Status changes from stand-in to own, themes-audit shows the new cue against the bible, and routing evidence shows the new key at that chapter's boss moment.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
7. **PR-0361** [interface] PR-0361 (new; R21-IF-01, confirmed): the Bushido sequence overlay names PlayStation glyphs only, so keyboard and touch players are never told which key is which, and release 38 adds a Square chip (key K) that is named nowhere
  - game / chapter: FFX only / Ch XVII (and any Auron Overdrive)
  - ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
  - expected: An input prompt names the control of the device in use (as the Trigger Happy overlay now does: R, CLICK, R1, TAP) or the CONTROLS tab lists the Overdrive keys.
  - observed: Auron's Overdrive overlay 'Shooting Star - BUSHIDO - ENTER THE SEQUENCE' shows chips triangle, circle, square, circle, left, right, cross. No keyboard or touch mapping is printed on it. The CONTROLS tab (src/app/screens/pause/panels.ts:157-180) lists menu navigation only (Confirm, Back, H/Triangle, F, P); battle controls and the Overdrive keys are not listed. Release 38 added KeyK/pad button 2 as 'square' (src/ui/ffx/rawInput.ts) so Shooting Star's square chip is reachable only by guessing K; circle is Esc, triangle Q or Shift, cross Enter. Failure is the timer running out (no bonus), so the fight is not blocked. Confirmed by the confirmer from the live overlay text (evidence/gaps/phone-od) and the source: GLYPH map in AuronSequence.ts is PlayStation symbols; KEY_MAP in rawInput.ts maps Enter, Space and Z to the cross, Esc, X and Backspace to the circle, Q and Shift to the triangle and K to the square (K new in 38); controlsColumns() in src/app/screens/pause/panels.ts lists menu and pause keys only. The glyph-only overlay existed on live 37.1 as well (AuronSequence.ts at f4244e1f has the same GLYPH map, and no Square), so a keyboard player on 37.1 also had to guess Enter, Esc and Q; what release 38 adds is one more unlabelled key (Shooting Star now needs K). The chief tags it introducedByCandidate true (the Square binding and the longer chosen sequences) and regressionVsLive false: no input that completed a Bushido on 37.1 stopped working, and a missed sequence only loses the bonus. It sits inside the new chosen-Overdrive feature (inNewFeature true).
  - repro: Real keys from the title: chapter XVII (sin-fins-core), seed 1, Auron Overdrive > Bushido > Shooting Star; read the overlay (frame 28-bushido-overlay.png).
  - evidence: critic/rounds/round-21/evidence/sin-fins-core-win/28-bushido-overlay.png; src/ui/ffx/minigames/AuronSequence.ts:7-18; src/app/screens/pause/panels.ts:157-180
  - confidence: medium
  - requirement: CHK-015, CHK-004, onboarding: input access and device usability
  - fix: Print the device's key under each chip (Q/Shift, Esc, K, Enter) in AuronSequence, or add a 'In battle' column (Overdrive keys) to controlsColumns; add touch buttons or a note for phones.
  - acceptance check: Keyboard, touch and pad frames of the Bushido overlay each show a label for every chip; a real-key run completes Shooting Star using only what the overlay says.
  - status: open
8. **PR-0222** [delivery] PR-0222 (carried, unchanged, not captured): the fix for the hidden FF7 fight's black hold on a cold cache is still not observed
  - game / chapter: FF7 experiment (hidden)
  - ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
  - expected: No black hold: the swirl's last frame holds until the art settles.
  - observed: Not captured in round 21. No FF7 product file changed in release 38 (only tests/unit/ff7-repair.test.ts), so the carried state stands, with no credit and no fresh evidence.
  - repro: Cold profile, 1600x900, 25 and 10 Mbit/s: open the secret door and sample frames every 200 ms until the field appears; press Esc and arrows during the hold.
  - evidence: critic/rounds/round-20.json PR-0222
  - confidence: low (not observed)
  - requirement: CHK-017 and CHK-025; RUBRIC section 5
  - fix: None proposed until observed.
  - acceptance check: Frames every 200 ms on a cold throttled load with no black frame after the swirl.
  - status: open, round 20 (cd9dbbb0)

### Polish (100)

9. **PR-0334** [feel] PR-0334 (confirmed, was low confidence): the twirl start draws a hard-edged white rectangle over the changing girl in every dressphere change
  - game / chapter: FFX-2 only / Ch V, VI, XI, XV
  - expected: A soft twirl-in (the ribbon aura seen in the close-up) with no block shape.
  - observed: A white slab about 60 by 110 px at 1600x900 sits over the girl for 150 to 450 ms (300 to 600 ms in Den of Woe) at the start of the twirl in 7 of 7 captured changes (Leblanc 1,500 ms; Vegnagun 1,350-1,650 ms; Fallen Aeons 1,350-1,500 ms and 1,500-1,800 ms; Den 1,800-2,100 ms and 1,500 ms; Vegnagun #2 1,500-1,800 ms), before the dress swaps. Merged with the visual auditor's re-observation (four chapters: Leblanc Paine Warrior to Songstress, Den of Woe Yuna White to Black Mage, Trema Paine Dark Knight to Songstress, Vegnagun Paine Dark Knight to White Mage; evidence critic/rounds/round-21/vis/leb-pair.jpg, sph-ffx2-den-of-woe-win.jpg, sph-ffx2-vegnagun-shuyin-win.jpg, trema-sph.jpg). Confidence is now high (7 of 7 clipped changes); it persists after the 119 new paintings and the 25 held 2x masters; the correction is in the key's alpha edge, never a repaint of approved art.
  - repro: Any FFX-2 Garment Grid change at 1600x900, seed 1; frames in critic/rounds/round-21/feel-narr/spheres4.jpg.
  - evidence: critic/rounds/round-21/feel-narr/spheres4.jpg
  - confidence: high
  - requirement: RUBRIC 6 animation and readable effects
  - fix: Suspected: the first key of the twirl set is drawn unmasked or at the wrong alpha box; check the key's alpha edge and ease it in. Visual and animation auditors to cross-check the master.
  - acceptance check: Read 7 consecutive changes at 50 ms steps: no flat white rectangle with straight edges at any frame.
  - status: open, round 20 (cd9dbbb0)
10. **PR-0314** [feel] PR-0314 (carried, STALLED: open in 19b, 20 and 21): the FFX-2 dressphere shot is absent in 6 of 7 captured changes and the new push-in is not seen in any of them
  - game / chapter: FFX-2 only / Ch V, VI, XI, XV
  - expected: Every dressphere change gets a held close shot or, where none is clean, the push-in (D-346).
  - observed: Seven clipped changes: Vegnagun Paine dark knight to white mage (first change) plays the close-up from 3.15 s to about 4.6 s (1.45 s hold, ribbon aura then the new dress); the other six (Leblanc Paine, Vegnagun Paine #2, Fallen Aeons Paine #1 and #2, Den of Woe Yuna #1 and #2) show the girl's small-frame twirl and nothing else: the framing at the start and end is the same (Leblanc 900 vs 2,700 ms, Fallen Aeons 1,650 vs 2,550 ms), so neither the close-up nor the 1.22x push-in of D-346 plays. In every absent case an enemy turn starts 0.9 to 4.3 s after the change (meta.json events), the likely gate. Round 20: 5 of 10 absent.
  - repro: critic/rounds/round-21/evidence/ffx2-leblanc-win, ffx2-vegnagun-shuyin-win, ffx2-fallen-aeons-win, ffx2-den-of-woe-win clips/spherechange and spherechange-2; read with critic/rounds/round-21/feel-narr/strip.py (seed 1, 1600x900, Active, real keys).
  - evidence: critic/rounds/round-21/feel-narr/spheres4.jpg, veg-sphere.jpg, veg-sphere2.jpg, leb-sphere.jpg, fa-sphere.jpg
  - confidence: medium (clips and meta events; gate not traced)
  - requirement: RUBRIC 6 feel: coherent camera, impactful but readable effects; D-346
  - fix: Per the stalled-area rule, a written method check before a third attempt: log which gate (another actor acting, no clean frame, menu up) refused each shot, then decide whether the push-in may start at the hand-back after the enemy action, or whether an enemy action should queue behind a dressphere shot in Active mode. No Wait-mode change without Bailey.
  - acceptance check: In Leblanc, Vegnagun and Fallen Aeons at 1600x900 seed 1, at least 5 of 6 changes show a shot or a measurable camera push for at least 1.4 s, with no enemy action inside it and the command menu closed.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
11. **PR-0362** [onboarding] PR-0362 (new; R21-FEEL-01 + R21-ON-01 + capture owner): the Enter that dismisses the last first-turn coach card also confirms the highlighted Attack and opens the target cursor (FFX chapters whose first row is Attack)
  - game / chapter: FFX only (FFX-2 chapters did not show it) / Ch I, II, VII, IX, XII (first row Attack); not Ch III, VIII, X, XIV, XVII, XVIII (first row Talk, Orders or Special)
  - expected: The key that dismisses the card does nothing else.
  - observed: seymour-flux-coachprobe-1600x900: card 3 OF 3 gone and targets 2, selecting true within 100 ms of ONE Enter. Seen in the chapters whose first row is Attack (I, II, VII, IX, XII) and not in Talk/Orders/Special-first chapters or FFX-2. It also pushed the FFX pause matrix one step out of line (rows 4 to 7 read FAIL). Merged: the capture owner's first-menu observation, the feel auditor's R21-FEEL-01 and the onboarding auditor's R21-ON-01 are one root defect. The capture owner notes that the earlier rounds' helper library already worked around it (gaplib.mjs comment), so it is not new in release 38. It cost the first 18 hero frames (taken with the target cursor open; relabelled -targetopen, plain first menus re-shot) and put four FFX pause-matrix rows off by one (PR-0375).
  - repro: Fresh profile, Ch I, first menu, press Enter once.
  - evidence: critic/rounds/round-21/evidence/seymour-flux-coachprobe-1600x900/run.json; critic/rounds/round-21/evidence/OBSERVATIONS.md (OBS-03); coachEnterOpened in the 2560x1440 hero run.json files; seymour-flux-pausematrix-1600x900/run.json rows 4-7
  - confidence: high
  - requirement: onboarding: first-run guidance
  - fix: Swallow the Enter keydown/keyup that closes the coach card.
  - acceptance check: After one Enter, coach gone and targets 0.
  - status: open
12. **PR-0330** [interface] PR-0330 (carried, improved; release 38 "keeps its lines" holds for Ch III and FFX-2 Ch IV only): the move-advisor card still shrinks to a stub in Ch VII, IX, XII, XVII and XVIII
  - game / chapter: FFX only (FFX-2 cards are full) / Ch VII, IX, XII, XVII, XVIII
  - expected: Every card prints the move, target, menu path, cost and a reason (r38's own acceptance).
  - observed: Ch III 1600x900 now 214 chars (r20 68) and Ch IV prints '100% TO HIT'. Still short: Ch VII 1600x900 56 chars 'Steal -> Guado Guardian A IN SPECIAL' (2560x1440 too; 2000x1012 is full, 252 chars); Ch IX 69 chars at 1600x900 and 2000x1012 (no NO MP/ALWAYS HITS/reason); Ch XII 54 chars at 1600x900 (full at 2000 and 2560); Ch XVII 'Tidus Close in IN ORDERS' 24 chars and Ch XVIII 'Hastega -> the party IN WHITE MAGIC' (no MP cost) at every desktop size; phone tip names the menu only (PR-0358). Release 38 repaired it in the named chapters: Ch III at 1600x900 prints 214 chars (r20: 68) and FFX-2 Ch IV prints 106 chars with 100% TO HIT and SHELL; the r20 Ch VII 2000x1012 regression is gone (252 chars). The builder's own disclosure says Ch III is probabilistic (about 93 percent of runs).
  - repro: Fresh profile, seed 1, real keys to the first menu of Ch VII, IX, XII, XVII, XVIII at 1600x900.
  - evidence: critic/rounds/round-21/evidence/yojimbo-cavern-win/11-advisor.png; seymour-anima-macalania-win/11-advisor.png; sin-fins-core-win/11-advisor.png
  - confidence: high
  - requirement: RUBRIC section 2 (advisor says where and what it costs), CHK-004
  - fix: Extend FULL_CARD_HEIGHT/advisorRoomy to measure the card's printed lines in the HUD, and give the Sin strip pass a cost token.
  - acceptance check: cardrect at 1600x900 and 2000x1012 for those chapters: at least the NO MP/MP token and the effect line, 0 overlap with boss and party.
  - status: open, round 20 (cd9dbbb0)
13. **PR-0354** [interface] PR-0354 (carried, widened to Ch IX): the intent card says 'Deals no damage' above damage rows
  - game / chapter: FFX only / Ch IX, Ch XII
  - expected: Honest intent: either the damage sentence or the rows, never both contradictory.
  - observed: Ch XII: 'Mortiphasm Spells SCRIPTED Deals no damage.' then DAMAGE Tidus 2,066-2,333 34% HP, Auron 2,066-2,333. Ch IX: 'Daigoro SCRIPTED Deals no damage.' above DAMAGE Lulu 544-615 42%, Kimahri 517-584, Yuna 553-624 (identical text in round 20; intent code unchanged).
  - repro: Fresh profile, real keys to the first menu of Ch XII and Ch IX, press E.
  - evidence: critic/rounds/round-21/evidence/seymour-omnis-win/12-intent-E.png; yojimbo-cavern-win/run.json intentText
  - confidence: high
  - requirement: RUBRIC: honest enemy intent
  - fix: Suppress the 'Deals no damage' line when the ability has damage rows or fix the 'none' formula rows (suspected: src/battle/ffx/intent.ts describeAbility on placeholder rows).
  - acceptance check: Intent text of both fights has no 'Deals no damage' beside a DAMAGE block.
  - status: open, round 20 (cd9dbbb0)
14. **PR-0326** [audio] R20-AUD-01 / PR-0326 (carried, second review, stalled by the two-review rule): the first UI sounds are still the procedural synth in 34 of 39 runs, and the title's battle-start cue never plays
  - game / chapter: both / title, chapter select, all
  - observed: On a fresh profile, sfxLog[0] is synth in 34 of 39 runs (cursor-move 98 and confirm 11 of 109 synth entries), at AudioContext time 1.8 to 3.7 s; the sprite or v2 bank takes over from 2.1 to 6.9 s (median 3.1 s; 8.5, 13.6 and 36.3 s in three loaded runs). 'battle-start' (TitleScreen.ts:196, void audio.playSfxFromSprite('battle-start')) appears in 0 of 39 sfxLogs; before PR-0326 it was synth in 24 of 24, so the title's press-start cue is now silent where it was the arcade synth. Round 20 measured 25 of 27 and 0 of 27. The music half improved: the previous cue was still current at the pre-scene sample in 1 of 39 runs (3 of 27 before). Capture ran 3 to 5 lanes on one host, so load is a candidate cause, but the pattern did not change. GAP PASS addendum (real keys, fresh profile, 1600x900 gpu, five runs plus two at 4x CPU throttle): the title Enter at about 0.9 s asked for no sound in 7 of 7 runs; the first sound is the first board cursor-move through the sprite at 3.8-4.4 s after load. TitleScreen.advance calls playSfxFromSprite('battle-start') and plays nothing if the v1 sprite is not decoded yet; unthrottled and throttled behave the same, so it is not a load effect (the sprite decode time was not measured directly). Suggested smallest fix: warm the SFX sprite decode at boot, or gate the press on it. Evidence: critic/rounds/round-21/evidence/gaps/title-sfx/runs-thr1.json and runs-thr4.json.
  - repro: Fresh profile, headless Chromium PYREFLY_BROWSER=gpu, live URL, press Enter at the title (real key), then move the board cursor; read window.__pyrefly audio debug sfxLog (e.g. critic/rounds/round-21/evidence/seymour-flux-win/audio-debug.jsonl, last row: first entry 'confirm' via synth at 2.752 s, no 'battle-start'). Seeds are not involved.
  - evidence: critic/rounds/round-21/audio/routing.txt (synth plays by cue, first synth entries); critic/rounds/round-21/audio/routing.json; critic/rounds/round-20/audio/routing.txt (same finding)
  - confidence: medium (the observation is firm; the cause is unestablished)
  - requirement: CHK-001 step 3 (nothing falls back to the synth path), PR-0326
  - fix: Smallest probe first, no product change yet: on a quiet host, log the return value and the branch taken by AudioManager.playSfxFromSprite('battle-start') (src/audio/AudioManager.ts:524: ctx null, no manifest sfx, sprite not decoded within waitMs, or no slice) to say whether this is load or a branch. Then either preload the v1 sprite before the title's first press or let the first UI sounds wait for it (PR-0326's own intent: the cue plays from its sprite or not at all).
  - acceptance check: A fresh-profile run on a quiet host shows 0 via:synth entries in sfxLog and one 'battle-start' via sprite at the title press (PR-0326's acceptance check), repeated in at least 5 runs.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
15. **PR-0301** [feel] PR-0301 (carried, re-observed): FFX-2 chain seams still hand control back later than 2.5 s
  - game / chapter: FFX-2 only / Ch V link 2, Ch VI link 2
  - expected: Control returns in about 0.6-0.75 s as at live 32, or the longer opening is Bailey's choice.
  - observed: Leblanc link 2 and Vegnagun link 2 (seq-seam-2, eight frames from 45 ms to 2,513 ms) show the new arena, the party and a name plate (Logos, Vegnagun at about 1.4 s) but no command menu by 2.51 s. Same as round 20.
  - repro: critic/rounds/round-21/evidence/ffx2-leblanc-win/seq-seam-2 and ffx2-vegnagun-shuyin-win-again/seq-seam-2 (sheet critic/rounds/round-21/feel-narr/seams2.jpg).
  - evidence: critic/rounds/round-21/feel-narr/seams2.jpg
  - confidence: medium
  - requirement: RUBRIC 6: transitions and dead waiting
  - fix: Per the existing ticket: shorten the seam's battle-start moment for FFX-2, or ask Bailey whether the longer opening is intended.
  - acceptance check: Seam to menu-up under 1.5 s on Leblanc and Vegnagun.
  - status: open, round 20 (cd9dbbb0)
16. **PR-0363** [interface] PR-0363 (new; R21-IF-04 + R21-FEEL-02, emulated pad only): a pad's Circle that resumes from the pause also cancels the menu level or the target cursor underneath, where keyboard P keeps both
  - game / chapter: both (pad Circle; FFX Ch I and FFX-2 Ch IV)
  - expected: Resume restores the exact state, as the keyboard does.
  - observed: Pause matrices: pad Circle resume from a Special submenu returns to the top row (rows 4 to 6) and from targeting returns with targets 0; keyboard P keeps both (rows 4, targets 2). FFX-2 pad White Magic: rows 7 to 3. Merged with R21-FEEL-02: FFX Flux pad matrix row 10, pause opened with Start while targeting (targets 2); Circle resumes with targets 0, where keyboard P resumes with targets 2. FFX-2 pad White Magic: rows 7 to 3. Emulated standard-mapping pad, not real hardware; one run each (the FFX matrix was shifted by PR-0362).
  - repro: seymour-flux-pausematrix-1600x900-pad cases 8, 10; ffx2-bahamut-pausematrix-1600x900-pad case 8.
  - evidence: critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900-pad/run.json; critic/rounds/round-21/evidence/ffx2-bahamut-pausematrix-1600x900-pad/run.json
  - confidence: medium-low
  - requirement: CHK-015, CHK-006
  - fix: Consume the Circle edge in the pause handler so the menu does not also see it.
  - acceptance check: Pad matrix: after resume rows and targets equal their pre-pause values.
  - status: open
17. **PR-0251** [interface] PR-0251 (carried, widened): HUD text under the 14 px floor
  - game / chapter: both
  - expected: 14 px floor on desktop.
  - observed: 1600x900: FFX 12.25 px (OD, Overdrive, key labels), colour-order note 12 px; FFX-2 command-info label 11.68 px, max-HP/MP numbers 12.5 px; dialogue role chip 8.51 px. 2000x1012: 13.77 px (FFX), 13.13 px (FFX-2). 1440x900: 11.03 px; 1024x768: 7.84 px with 27 distinct elements under 14. 2560 and 4K pass (14 px).
  - repro: textSweep fields of the first-menu runs.
  - evidence: critic/rounds/round-21/audit-if1.tmp.mjs output; evidence/seymour-flux-first-1024x768/run.json
  - confidence: high
  - requirement: CHK-003
  - fix: Raise the HUD key labels and label classes to a floor in CSS.
  - acceptance check: textSweep minEffPx >= 14 at 1600x900 and 2000x1012.
  - status: open, round 20 (cd9dbbb0)
18. **PR-0366** [visual] PR-0366 (new; V21-VIS-03): HUD slabs stand over painted actors in three captured FFX-2 states (Ch IV at 1024x768, Ch XV at 2560x1080, Ch VI at 2560x1440)
  - game / chapter: FFX-2 only / Ch IV, VI, XV
  - observed: (a) Ch IV Bahamut 1024x768 first menu: the ACTS NEXT intent card covers Bahamut's torso and Paine, and its damage table truncates names to 'YU...' and 'RIKK...'. (b) Ch XV Den of Woe 2560x1080 after a chain hit: the CHAIN x1.45 slab covers Rikku's and Paine's legs. (c) Ch VI Leblanc 2560x1440: the guide card's MORE row overlaps Yuna's raised pistol.
  - repro: FFX-2 Ch IV at 1024x768; Ch XV at 2560x1080 after the first chain hit; Ch VI at 2560x1440 first menu, seed 1.
  - evidence: critic/rounds/round-21/vis/shapes.jpg; evidence/ffx2-den-of-woe-first-2560x1080/11-first-menu-clean.png; evidence/ffx2-leblanc-first-2560x1440/12-crop-party.png
  - confidence: high that they are seen; the 4:3 and ultrawide shapes were not captured in round 20
  - requirement: CHK-008 no panel intersects a face or a weapon
  - fix: Put the 4:3 intent card in the HUD-free zone (or shrink to the strip form below 1100 px wide), lift the chain slab above the girls' feet at ultrawide, keep the guide card clear of the gunner's raised arm; measure each with the CHK-008 matrix.
  - status: open
19. **PR-0364** [visual] PR-0364 (new; V21-VIS-01): in the FFX-2 run-in the camera pans and Yuna is cut off at the left frame edge for about 1 s
  - game / chapter: FFX-2 only / Ch VI (any FFX-2 chapter with a run-in)
  - observed: Leblanc 1600x900, Rikku Thief's Attack run-in at about t=1.5-1.9 s of the attack clip: the shot follows Rikku toward Ormi and Yuna stands half, then almost fully, outside the left edge while the white Paine stays in view.
  - repro: FFX-2 Ch VI Leblanc seed 1, party order Yuna, Rikku, Paine, Rikku Attack on Ormi; extract frames from ffx2-leblanc-win/clips/attack/attack.mp4 at 1.5 s and 1.9 s.
  - evidence: critic/rounds/round-21/vis/leb-att-pair.jpg
  - confidence: medium (one clip, one state; other chapters not checked)
  - requirement: RUBRIC feel: coherent camera; CHK-014
  - fix: Clamp the run-in follow so every party member stays inside the frame (or limit the pan to the actor's own span) and check at 1600x900 and 2000x1012.
  - status: open
20. **PR-0344** [visual] PR-0344 (updated): the painted plate wings fill the 21:9 void with no mirrored lantern, but each meets the plate at a hard tilted seam with a bright lantern at the very edge; the r20 "Bahamut reads about 12 percent smaller at 2000x1012" half was not re-measured
  - game / chapter: FFX-2 only / Ch IV, XV
  - observed: Ch IV Bahamut 2560x1080: left and right wing strips cover the former void with no mirrored lantern, but each meets the plate at a vertical, slightly tilted seam with a brighter lantern at the edge. Ch XV was viewed at 2560x1080 with the same two-wing layout. The round-20 text of this id covered the mirrored lantern and a 12 percent smaller Bahamut at 2000x1012 (low-medium confidence). Release 38's painted wings (D-343) removed the mirrored lantern at 2560x1080 (Ch IV and XV); the seam is the remaining defect; the 2000x1012 framing was not captured (CHK-014 reads 1024x768, 2560x1080, 2560x1440 only).
  - repro: FFX-2 Ch IV, 2560x1080 first menu; crop vis/bah-wings.jpg.
  - evidence: critic/rounds/round-21/vis/bah-wings.jpg
  - confidence: high
  - requirement: RUBRIC visual: composition, consistency
  - fix: Blend the strip into the plate over 40-80 px (a soft mask) and darken the edge lantern; approved painting unchanged.
  - status: open, round 20 (cd9dbbb0)
21. **PR-0365** [visual] PR-0365 (new; V21-VIS-02): Ch XII first menu hides one Mortiphasm disc behind Yuna and Auron (5.8 percent visible at 2560x1440, 4.4 percent at 2000x1012)
  - game / chapter: FFX only / Ch XII Seymour Omnis
  - observed: seymour-omnis first menu, seed 1: the rect-visibility readout for the four discs is 0.558, 0.058, 0.699 and 0.804 at 2560x1440 (0.531, 0.044, 0.709, 0.828 at 2000x1012); the lower-left disc is covered by the two girls' bodies in the frame. The other three discs are visible. The round-20 1600x900 reading of this state was not measured, so whether release 38 changed it is unknown (the capture owner's first-menu frames were retaken with the top row asserted).
  - repro: FFX Ch XII seed 1, open the first menu, read run.json rects or the crop vis/omnis-discs.jpg.
  - evidence: critic/rounds/round-21/evidence/seymour-omnis-first-2560x1440/run.json; critic/rounds/round-21/vis/omnis-discs.jpg
  - confidence: high for the frame; unknown whether new
  - requirement: CHK-011 no targetable enemy more than about 25 percent occluded in the default framing
  - fix: Offset the disc formation or stage the party so no disc is under 75 percent visible (the round-20 reading at 1600x900 was not measured, so whether release 38 changed it is unknown).
  - status: open
22. **PR-0310** [visual] PR-0310 (carried, narrowed to Chapter III; downgraded major to polish): Chapters II and VIII no longer interpenetrate; Chapter III, staged off by decision, still crowds Auron in front of the Yu Pagoda base and the party against the boss's sword
  - game / chapter: FFX only / Ch III Braska's Final Aeon
  - observed: Ch II: Yunalesca stands clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012. Ch VIII: Rikku stands beside the coil without overlap in every window shape. Ch III (staging switched off by decision): Auron stands in front of the Yu Pagoda base and the party's weapons reach the boss's sword. Downgrade reason: release 38 restaged Ch II (Yunalesca clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012) and Ch VIII (Rikku beside the coil with no overlap at 2560x1440, 2560x1080, 1440x900 and 1024x768); the Ch III table is written and switched off by Bailey's pick (CHAPTER_III_STAGED = false), so what remains is a known and chosen state at polish severity.
  - repro: FFX Ch III first menu, seed 1, 2560x1440 (braskas-final-aeon-first-2560x1440/11-first-menu-clean.png).
  - evidence: critic/rounds/round-21/vis/yuna-gap.jpg; vis/braska-gap.jpg
  - confidence: high
  - requirement: CHK-014 / ground contact and scale
  - fix: Enable the written Chapter III table (CHAPTER_III_STAGED) when Bailey picks the 'another way' round; nothing to do for II and VIII.
  - status: open, round 20 (cd9dbbb0)
23. **PR-0308** [combat] PR-0308 (carried; downgraded from major because its Bushido half is fixed and verified in release 38; the Swordplay tiers and the button-order estimate stay open)
  - game / chapter: FFX / Ch II, XII, XVII, XVIII (Auron's Bushido, Tidus's Swordplay)
  - expected: The sourced ordering of Swordplay difficulty across tiers, and a sourced order for every Bushido button.
  - observed: FIXED: each Bushido now plays its own sourced length and order (Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6; the 7-chip default is gone), typed by real keys in six live runs. STILL OPEN: (1) all four Swordplay tiers play one zone and speed (12.22 percent, 1,059 ms) although the sourced ordering says stronger tiers get a narrower zone and a faster marker (ffx-combat-core 5.3 rule 2, verified 2 sources); the values are unpublished, so rule 6 forbids inventing them. (2) The button order is the GameFAQs order and labelled 'our estimate'; research D3 records that GF-KB's Shooting Star order (two Circles) matches no other source and the International table in 5.5 disagrees; the Steam HD copy would settle it. (3) Square is keyboard K / pad 2 with no on-screen key hint beyond the chip. (4) Banishing Blade and Tornado have not been seen in a real run. GAP PASS update (real keys, Ch VII Macalania, 1600x900, seed 1, Auron/Tidus gauge forced to 100: a labelled hook): Banishing Blade (7 chips, correctInputs 7, success, damage 4605) and Tornado (6 chips, correctInputs 6, success) play their own sequence, and Slice and Dice (timer 3000), Energy Rain (2600) and Blitz Ace (2200) each resolved success with travelMs 1059 and zonePercent 12.22. So the "never seen in a real run" half of this ticket is closed; the Swordplay tier numbers (no source) and the button-order estimate remain. The miss path was not exercised.
  - repro: od-params-probe.json (params per ability); bushido-oracle.json; yunalesca-win/run.json minigames; sin-fins-core-win-long/run.json.
  - evidence: critic/rounds/round-21/combat/od-params-probe.json, bushido-oracle.json; critic/rounds/round-21/evidence/*/run.json minigames
  - confidence: high
  - requirement: AGENTS rule 6 and 14; ffx-combat-core 5.3 and 5.5
  - fix: Bailey's yes to the 5.3 estimates (22/16/12/9 percent, 1,400/1,150/900/700 ms) or sourced values makes it a four-row edit in inputs.ts; check the Steam HD copy for the Bushido order; add a key legend for the Square chip.
  - acceptance check: Swordplay zone width decreases and speed increases from Spiral Cut to Blitz Ace in od-params-probe.json; the Steam copy's Bushido order matches inputs.ts.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
24. **PR-0369** [interface] PR-0369 (new; R21-IF-02): in Ch XII target mode the TARGET plate lies over the disc panel's "FACING HIM" label
  - game / chapter: FFX only / Ch XII
  - expected: Overlays do not overprint each other's labels.
  - observed: At 1600x900, 2000x1012 and 2560x1440 the 'TARGET Seymour Omnis' plate cuts the 'FACING HIM' label in half; the Sensor card also stands over the boss torso (PR-0248 pattern).
  - repro: Ch XII, seed 1, first menu, Attack.
  - evidence: critic/rounds/round-21/evidence/seymour-omnis-win/16-target-single.png; seymour-omnis-first-2560x1440-targetopen/11-first-menu-clean.png
  - confidence: high
  - requirement: CHK-008
  - fix: Move the target plate below the disc panel or shift the disc panel one row.
  - acceptance check: 16-target-single frame at three sizes shows 'FACING HIM' whole.
  - status: open
25. **PR-0370** [interface] PR-0370 (new; R21-IF-03): a mid-fight dialogue banner covers the intent card and the guide while the first command menu is open (Ch XV)
  - game / chapter: FFX-2 only / Ch XV
  - expected: Banter must not hide the information the player needs for the turn they are choosing, or the menu waits for it.
  - observed: At 1600x900 the Rikku/'Sphere Hunter' banner ('That's Baralai! Isn't it...?') covers the top of the intent card (name, SCRIPTED tag, damage header) and the guide's NEXT label while Yuna's menu is up; its role chip measures 8.51 px effective.
  - repro: FFX-2 Ch XV, seed 1, first menu at about 3.7 s.
  - evidence: critic/rounds/round-21/evidence/ffx2-den-of-woe-win/10-first-menu-coach.png
  - confidence: medium
  - requirement: CHK-002, CHK-003, CHK-008
  - fix: Hold the command menu or move the banner clear of the intent card; raise the role chip to the floor.
  - acceptance check: Frame at first menu shows intent card whole.
  - status: open
26. **PR-0371** [interface] PR-0371 (new, low confidence; R21-IF-05): the guide rail's NEXT and the advisor card name different actions at the same first menu (Ch IX, Ch XI)
  - game / chapter: FFX Ch IX, FFX-2 Ch XI
  - expected: Two 'next' prompts on one screen either agree or say why they differ (PR-0239 family).
  - observed: Ch IX: guide 'Kimahri Defend -> Kimahri', advisor 'Fire Gem -> Yojimbo'. Ch XI: guide 'Yuna X-Potion -> Yuna', advisor 'Shell -> the party'. The other 16 chapters agree.
  - repro: First menu of Ch IX and Ch XI, seed 1.
  - evidence: critic/rounds/round-21/evidence/yojimbo-cavern-win/11-advisor.png; ffx2-fallen-aeons-win/run.json pause.esc.text
  - confidence: low
  - requirement: RUBRIC: advisor and strategy guide are separate capabilities
  - fix: Label the guide as the designed line, or reconcile with the advisor.
  - acceptance check: No unexplained disagreement in the 18-chapter first-menu sweep.
  - status: open
27. **PR-0372** [onboarding] PR-0372 (new, medium-low confidence; R21-ON-02): on a phone the pause OPTIONS list shows four rows and REDUCE MOTION and TEXT SIZE sit below a fade with no scroll cue; the tab strip clips CHAPTER to "TER"
  - game / chapter: both
  - expected: Accessibility rows reachable and discoverable on touch.
  - observed: 390x844: MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED visible, a ghost row, then THIS ENCOUNTER; the tab strip starts at 'TER' (CHAPTER) with the first tabs off screen; brand line wraps and clips on its left edge.
  - repro: Phone viewport, pause, Options.
  - evidence: critic/rounds/round-21/evidence/ffx2-bahamut-win-touch/14-pause-options.png; seymour-flux-win-touch/14-pause-options.png
  - confidence: low
  - requirement: onboarding: settings and device usability
  - fix: Show a scroll affordance or move accessibility rows first; verify the list scrolls by touch.
  - acceptance check: Touch frame sequence reaches REDUCE MOTION and TEXT SIZE.
  - status: open
28. **PR-0367** [visual] PR-0367 (new, low confidence; V21-VIS-04): Evrae shows two head copies on one hurt-crossfade frame
  - game / chapter: FFX only / Ch VIII Evrae
  - observed: Ch VIII 1600x900 seq-action-playing f02: after Rikku's hit the coil is a pale dissolve with the head drawn at two positions for one frame; the next frame is clean.
  - repro: FFX Ch VIII seed 1, Rikku Attack on Evrae; read seq-action-playing f01 to f03.
  - evidence: critic/rounds/round-21/vis/evrae-seq.jpg
  - confidence: low (one frame, a dissolve may be intended)
  - requirement: RUBRIC feel: readable effects
  - fix: Shorten or mask the pose crossfade, or hold the hurt key as an instant swap.
  - status: open
29. **PR-0373** [audio] PR-0373 (new, low confidence; R21-AUD-01): the victory fanfare is fetched at the win, not before; one results screen showed no cue 4.2 s after the fight
  - game / chapter: both / all chapters with a victory cue (not IV)
  - observed: In 18 of 18 wins where the cue later played, victory-ffx or victory-ffx2 was not decoded at the after-fight sample (the boss cue is decoded by the first menu). In 1 of 19 victory results (evrae-airship-win, host at 100 percent CPU) the results sample 4.2 s after the fight still showed playing null and the cue undecoded although victory-ffx.mp3 had been requested; the repeat (evrae-airship-win-r2) played it. Round 20 noted the same at Chapter X ('victory-ffx not cached at the results sample'). It is unknown whether a real player on a slow connection hears a late fanfare.
  - repro: critic/rounds/round-21/evidence/evrae-airship-win/audio-debug.jsonl, rows after-fight (384,963 ms) and results (389,167 ms): playing null, victory-ffx cached false; compare evrae-airship-win-r2 (results: victory-ffx).
  - evidence: critic/rounds/round-21/evidence/evrae-airship-win/audio-debug.jsonl; critic/rounds/round-21/evidence/evrae-airship-win-r2/audio-debug.jsonl; critic/rounds/round-21/audio/routing.json
  - confidence: low
  - requirement: CHK-023 (the right cue at the real moment, no silent unintended gap); RUBRIC section 6 audio (phase transitions)
  - fix: Suggestion only: request the chapter's victory cue with the boss cue at the first menu (the same prefetch the boss cue gets), then measure the fight-end to fanfare delay on a throttled connection before changing anything; if the measured delay is under about half a second on a slow link, close it.
  - acceptance check: At the after-fight sample the victory cue is cached in a fresh-profile run, and the results sample shows it playing in 10 of 10 wins; a throttled-network run shows the fanfare starting within the results screen's first second.
  - status: open
30. **PR-0374** [audio] PR-0374 (new; R21-AUD-02): FFX Ch I pause cue starts 0.5-1.0 s late and without a crossfade; FFX-2 Ch IV switches within 0.5 s
  - game / chapter: FFX only (FFX-2 behaves as expected) / Ch I
  - expected: Both games duck the battle cue on opening pause with the same timing.
  - observed: Esc in FFX Ch I: boss-seymour is still current at gain 1 at +0.5 s and the pause cue is current at gain 1 by +1.0 s (150 ms sampling). FFX-2 Ch IV at +0.5 s already has the pause cue current with the boss cue fading. Gap pass PASS on the pause hand-back itself in both games (resume restores the battle cue); this is only the open-side difference.
  - repro: toBattle seymour-flux then ffx2-bahamut, setSeed(1), real Esc, sample audioDebug every 150 ms.
  - evidence: critic/rounds/round-21/evidence/gaps/pause-audio/seymour-flux-fine.json, audio-debug-seymour-flux.jsonl
  - confidence: medium (one lane, host not otherwise idle)
  - requirement: CHK-023
  - fix: Check why the FFX pause cue is requested later than the FFX-2 one; make the duck on open the same in both.
  - acceptance check: At +0.5 s after Esc the pause cue is current or the boss cue is below gain 0.5 in Ch I.
  - status: open
31. **PR-0104** [feel] PR-0104 (carried, 6th review, STALLED, not re-observed): a confirmed FFX-2 Shell in Wait shows only a cast pose, no name chip
  - game / chapter: FFX-2 only / Ch IV
  - expected: A name chip in Wait as in Active.
  - observed: No Bahamut clip was recorded (clips 0 in all four Bahamut lanes), so the item could not be re-read; carried unchanged, UNVERIFIED this round.
  - repro: Bahamut Wait mode, Yuna Shell; needs a clip.
  - evidence: none this round
  - confidence: low (carried)
  - requirement: RUBRIC 6
  - fix: Per the method check already owed for this stalled issue.
  - acceptance check: Name chip visible during the cast in Wait.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
32. **PR-0315** [feel] PR-0315 (carried, not re-observed): the twirl crossfade may double-expose the neighbouring girl as well as the changer for about 0.2 s
  - game / chapter: FFX-2 only / Ch IV-XV
  - expected: A clean crossfade of the changing girl only.
  - observed: Not measured at the 150-300 ms steps used here; frames at 1,500-1,800 ms in the Den clips show the party blended with the changer but the double image could not be separated from the white slab (PR-0334).
  - repro: Garment Grid change at 50 ms steps.
  - evidence: critic/rounds/round-21/feel-narr/spheres4.jpg
  - confidence: low
  - requirement: RUBRIC 6
  - fix: Re-measure after PR-0334 is repaired.
  - acceptance check: No second figure's alpha changes during a change.
  - status: open, round 20 (cd9dbbb0)
33. **PR-0316** [visual] PR-0316 (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera
  - game / chapter: FFX-2 only / IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012
  - expected: The boss's face reads clearly in his signature framing.
  - observed: Bahamut's head is readable (not blown out) at 2560x1440 and 2560x1080 this round; the 2000x1012 frame that the ticket names was not captured (PR-0316 stays open until it is). Cyan rim fringe on the wing cut-outs is visible in the 2560x1440 boss crop.
  - repro: Candidate, seed 1, Ch IV, first menu.
  - evidence: critic/rounds/round-21/evidence/ffx2-bahamut-first-2560x1440/13-crop-boss.png
  - confidence: medium
  - requirement: visual: recognisability, lighting
  - fix: Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
  - acceptance check: Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.
  - status: open, round 20 (cd9dbbb0)
34. **PR-0333** [visual] PR-0333 (new): FFX-2 Bahamut at 390x844 has its head, neck and the top of its wings under the BAHAMUT ACTS NEXT intent strip
  - game / chapter: FFX-2 only / ffx2-bahamut (Ch IV), 390x844 touch, first menu
  - expected: The boss's head is whole between the intent strip and the party.
  - observed: At 390x844 the first-menu frame is covered by the coach card, so the head-under-intent-strip question cannot be read; the mid-fight phone frame shows the head clear with the strip hidden (critic/rounds/round-21/vis/phone.jpg). Not captured after the coach card is dismissed.
  - repro: Seed 1, Ch IV first menu at 390x844 touch.
  - evidence: critic/rounds/round-19b/evidence/gaps/fm-ffx2-bahamut-390x844/10-first-menu.png; critic/rounds/round-19b/visual/crop-bah-phone.png; critic/rounds/round-19b/audit/phone-bah-r19-r19b.png
  - confidence: medium
  - requirement: CHK-008; RUBRIC section 5 (accidental crop damage)
  - fix: Count the intent strip in the clearance field on the phone, or fail the colossus master closed at 390 wide.
  - acceptance check: Bahamut's head fully below the intent strip at 390x844 on three first menus, compared with a live-35 frame at the same seed.
  - status: open, round 20 (cd9dbbb0)
35. **PR-0341** [visual] PR-0341 (downgraded major to polish, not reproduced): Ch IX Yojimbo and Daigoro drawn in every round-21 capture
  - game / chapter: FFX only / Ch IX Yojimbo
  - observed: Yojimbo and Daigoro are visible 1.0 at the 2000x1012 ui first menu and the 1600x900 route frame, and 1.0 / 0.751 at 2560x1440. Round 20's single missing-boss frame (same state at 2000x1012) is not seen again. Downgrade reason: the round-20 single-frame observation (an unconfirmed single run on a loaded host) did not recur in the 2000x1012 UI first menu, the 2560x1440 first menu or the 1600x900 route; the cause was never established. Not reproduced is not proven absent: keep the portraitTimeline readout and close after one more clean quiet-host run.
  - repro: FFX Ch IX seed 1 first menu at 2000x1012 on a fresh profile; repeat several times.
  - evidence: critic/rounds/round-21/evidence/yojimbo-cavern-first-2000x1012-ui/run.json; vis/yoj-r20-r21.jpg
  - confidence: medium (not reproduced is not proven absent)
  - requirement: CHK-011
  - fix: Keep the portraitTimeline readout and rerun once on a quiet machine; close if clean.
  - status: open, round 20 (cd9dbbb0)
36. **PR-0255** [narrative] PR-0255 (carried, re-observed): Tromell's five Chapter VII aftermath lines have speaker ''
  - game / chapter: FFX only / Ch VII
  - expected: A named speaker (Tromell) or an intentional crowd tag.
  - observed: dbox lines 42-48 of seymour-anima-macalania-win: 'Step away from Lord Seymour, Lady Summoner.', 'You will not put hands on him again.', 'He will be cared for. By his own people.', 'And this. This was never yours.', 'Traitors, all of you. It will be announced.' with an empty speaker.
  - repro: critic/rounds/round-21/evidence/seymour-anima-macalania-win/run.json dboxTimeline.
  - evidence: critic/rounds/round-21/feel-narr/dbox21-all.txt
  - confidence: high
  - requirement: writing-bible voice
  - fix: Set the speaker in the Chapter VII script.
  - acceptance check: No empty-speaker line in the Chapter VII aftermath.
  - status: open, round 20 (cd9dbbb0)
37. **PR-0256** [feel] PR-0256 (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it
  - game / chapter: FFX-2 / XVI aftermath, whistles 1 to 4
  - expected: A visible light, nearer on each whistle.
  - observed: Chapter XVI: "(Whistle)", "A small gold light answers.", "The light comes nearer." and the like have an empty speaker and no mote was captured in the scene frames (re-observed in the dbox timelines).
  - repro: Ch XVI win, CONFIRM on results, advance the whistles by Enter.
  - evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
  - confidence: medium
  - requirement: feel/narrative: shown, not told
  - fix: A small gold mote fx step per whistle.
  - acceptance check: A timed capture after each whistle shows the light, nearer each time.
  - status: open, round 20 (cd9dbbb0)
38. **PR-0272** [narrative] PR-0272 (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate
  - game / chapter: FFX / XVII sin-fins-core, seam 1 -> 2
  - expected: A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
  - observed: Chapter XVII: "The Fahrenheit's cannon tears the fin away." (battle, 368,321 ms) is still a caption on the unchanged deck plate.
  - repro: Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
  - evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
  - confidence: high
  - requirement: narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
  - fix: Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
  - acceptance check: A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
  - status: open, round 20 (cd9dbbb0)
39. **PR-0349** [combat] PR-0349 (carried, unchanged, medium confidence): a human's reel stop is a uniform random draw, so about 74 percent of Lady Luck spins are a Dud and the player cannot aim
  - game / chapter: FFX-2 / Lady Luck reels (unreachable today, PR-0340)
  - expected: Handoff said 9 in 10 pay; the sourced table is the 56/216 pay map.
  - observed: r21-probes.json: 56 paying stops and 160 Dud stops of 216 per set (74 percent), identical to round 20.
  - repro: r20-probes.test.ts pay-table test.
  - evidence: critic/rounds/round-21/combat/r21-probes.json
  - confidence: medium
  - requirement: ffx2-combat-core 3.12
  - fix: State the 26 percent pay rate in the handoff or let the human aim the stop.
  - acceptance check: Handoff and overlay agree with the measured rate.
  - status: open, round 20 (cd9dbbb0)
40. **PR-0350** [combat] PR-0350 (carried, unchanged, low confidence, suspected): the immune-status miss event can pop twice for a two-status move and counts as 'targeted' for the Fallen Aeons counter
  - game / chapter: FFX-2 / status-only actions on immune targets, Ch XI
  - expected: One miss pop per action.
  - observed: r21-probes2.json identical to round 20 (abilities with formula none and two or more hostile statuses listed).
  - repro: r20-probes2.test.ts
  - evidence: critic/rounds/round-21/combat/r21-probes2.json
  - confidence: low
  - requirement: Presentation parity of misses
  - fix: Collapse to one miss event per target per action.
  - acceptance check: A two-status move on an immune boss emits one miss event.
  - status: open, round 20 (cd9dbbb0)
41. **PR-0351** [combat] PR-0351 (carried, unchanged, low confidence): the Trigger Happy damage forecast floors at 6 hits while a human who presses fewer times now deals fewer
  - game / chapter: FFX-2 / Gunner Trigger Happy, Ch VI
  - expected: Forecast agrees with the honoured human count.
  - observed: Live matrix: 3 presses give 3 damage events (12,17,17) on all five input devices; the forecast copy is unchanged from round 20.
  - repro: critic/rounds/round-21/evidence/feat/th-*/run.json
  - evidence: critic/rounds/round-21/evidence/feat/th-ffx2-leblanc-kbd-r-3p-1600x900/run.json
  - confidence: low
  - requirement: Honest intent display
  - fix: Show the forecast as a range from the honoured count.
  - acceptance check: Forecast copy names the pressed-count rule.
  - status: open, round 20 (cd9dbbb0)
42. **PR-0273** [combat] PR-0273 (carried, unchanged): Ch XVII link 3 (on Sin's back) still lists disabled ESCAPE, PULL BACK and CLOSE IN rows at the top of the command menu
  - game / chapter: FFX / Ch XVII link 3
  - expected: Rows that can never be used on this link are hidden.
  - observed: link3-rows.json identical to round 20: attack, abilities, then escape(disabled), trigger:pull-back(disabled), trigger:close-in(disabled) before items.
  - repro: link3-rows.test.ts
  - evidence: critic/rounds/round-21/combat/link3-rows.json
  - confidence: high
  - requirement: Honest command lists
  - fix: Hide the three rows on link 3.
  - acceptance check: link3-rows.json has no disabled rows for Tidus.
  - status: open, round 20 (cd9dbbb0)
43. **PR-0257** [encounter] PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer than the sourced rows (204 and 220 real-key turns this round)
  - game / chapter: FFX / Ch III Braska's Final Aeon
  - expected: Length near the sourced rows.
  - observed: Victory on the long-budget re-runs in 220 turns and 204 turns (r2); the short budget stalled at link 3. Bench intended 39/40.
  - repro: critic/rounds/round-21/evidence/braskas-final-aeon-win-long*/run.json
  - evidence: critic/rounds/round-21/evidence/braskas-final-aeon-win-long/run.json
  - confidence: high
  - requirement: RUBRIC 6 encounter
  - fix: Bailey's call on the gauntlet's length.
  - acceptance check: Real-key turn count near the sourced total.
  - status: open, round 20 (cd9dbbb0)
44. **PR-0279** [encounter] PR-0279 (carried, a question for Bailey): Sin's difficulty is undecided (D-282); nothing changed, so the Ch XVII and XVIII figures stand
  - game / chapter: FFX / Ch XVII and XVIII Sin
  - expected: Bailey's difficulty decision.
  - observed: Ch XVII card 97/200, sensible 51/200; Ch XVIII intended 12/40, advisor 15/40, mash 0/40 (byte-identical to round 20).
  - repro: ffx-bench.test.ts sin-face rows; sin-ab-cand.json
  - evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
  - confidence: high
  - requirement: D-282
  - fix: Bailey's decision.
  - acceptance check: Recorded decision.
  - status: open, round 20 (cd9dbbb0)
45. **PR-0280** [encounter] PR-0280 (carried): the v3 card's Chapter XII rate is unchanged (Omnis intended 27/40, advisor 24/40); the live v4 card covers it
  - game / chapter: FFX / Ch XII Seymour Omnis
  - expected: n/a
  - observed: Three-line bench row identical to round 20.
  - repro: ffx-bench.test.ts seymour-omnis
  - evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
  - confidence: high
  - requirement: RUBRIC 6
  - fix: None needed beyond the live card.
  - acceptance check: Row stable.
  - status: open, round 20 (cd9dbbb0)
46. **PR-0263** [audio] PR-0263 (carried, polish): the SFX level fix (D-293, bus 0.70, mix b) is delivered but no ear has confirmed it
  - game / chapter: both / all
  - observed: sfxMix {option b, trim 1, bus 0.70} and volumes 0.8/0.7/0.7 in 307 of 307 samples; both sprites are byte-identical to round 20. Whether the attack sounds now read as present against the music is an ear question.
  - repro: critic/rounds/round-21/audio/routing.txt (problems=0 on every run).
  - evidence: critic/rounds/round-21/audio/routing.json
  - confidence: high (measurement), unverified (listening)
  - requirement: CHK-B1
  - fix: Bailey's ear on the audition page (part of the PR-0148 verdict).
  - acceptance check: Bailey's recorded reaction to the SFX level.
  - status: open, round 20 (cd9dbbb0)
47. **PR-0220** [audio] PR-0220 (carried, polish): a real controller on a real Chrome is not proven to unlock audio
  - game / chapter: both / title
  - observed: Emulated pad-only runs (seymour-flux-win-pad, ffx2-bahamut-win-pad) reached the boss cue at the first menu, and audio-pad-unlock unit tests pass (2 of 2), but headless Chromium already has user activation, so a real pad and a real browser are untested.
  - repro: critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl; npx vitest run tests/unit/audio-pad-unlock.test.ts.
  - evidence: critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl
  - confidence: medium
  - requirement: CHK-001 / platform goals (real controller evidence is UNVERIFIED, not a pass)
  - fix: A real-controller check in desktop Chrome (hardware), Bailey or a tester.
  - acceptance check: A pad-only fresh session in real Chrome plays the title or board cue after the first pad A.
  - status: open, round 20 (cd9dbbb0)
48. **PR-0039** [audio] PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)
  - game / chapter: both / I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane)
  - expected: Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
  - observed: themes-audit output is byte-identical to round 20's: 4 of 26 cues depart (scene-gagazet, scene-dreams-end, scene-farplane with no tempo map; scene-macalania-temple is 'not in the bible's cue map').
  - repro: node tools/audio/themes-audit.mjs
  - evidence: themes-audit output, round 18
  - confidence: high
  - requirement: docs/audio/THEMES.md
  - fix: Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
  - acceptance check: themes-audit reports 0 departures for these cues.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
49. **PR-0260** [audio] PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple
  - game / chapter: ffx / VII
  - expected: Every shipped cue has a row in the bible's cue map.
  - observed: themes-audit cannot check the Chapter VII scene cue scene-macalania-temple: it is "not in the bible's cue map" (output byte-identical to round 20).
  - repro: node tools/audio/themes-audit.mjs
  - evidence: themes-audit output, round 18
  - confidence: high
  - requirement: docs/audio/THEMES.md
  - fix: Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
  - acceptance check: themes-audit shows ok for scene-macalania-temple.
  - status: open, round 20 (cd9dbbb0)
50. **PR-0278** [audio] PR-0278 (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row
  - game / chapter: FFX-2 (the Ixion row), docs / XVI
  - observed: The Ixion row's last cell is cut off mid-sentence and the 'Owed cues for chapters not yet listed' heading is glued into the table as a row; the Sin rows then follow a stray '99).' line.
  - repro: Read docs/audio/THEMES.md from the line '| XVI | `ffx2-ixion-djose` Ixion'.
  - evidence: docs/audio/THEMES.md (cue map section)
  - confidence: high
  - requirement: docs accuracy
  - fix: Repair the table text (documentation only).
  - acceptance check: The table renders as one table; themes-audit still reads 18 chapters.
  - status: open, round 20 (cd9dbbb0)
51. **PR-0298** [audio] PR-0298 (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB
  - game / chapter: both / all
  - expected: D-292 as worded: the music grows from about 39 MB to about 73 MB.
  - observed: qa.mjs total shipped audio is 88.49 MB of the 90 MB budget (D-306 raised the cap from 85 MB; the accepted recommendation said about 73 MB of music). A question for Bailey, nothing changed in this build.
  - repro: node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
  - evidence: D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
  - confidence: high
  - requirement: RUBRIC s7 (a pick approves what Bailey named)
  - fix: Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
  - acceptance check: decisions.json records Bailey's answer on the 78 MB size.
  - status: open, round 20 (cd9dbbb0)
52. **PR-0032** [onboarding] PR-0032 (carried, weight up): no REDUCE FLASHES row and no key remapping, while the new default look adds ink impact frames and lens flares; the soft-flash path exists but reads a setting no row writes
  - game / chapter: both / pause > OPTIONS, both games
  - expected: A flash accommodation and input remap in OPTIONS (accessibility target).
  - observed: Re-observed: no REDUCE FLASHES row and no key remapping (the CONTROLS tab is read-only).
  - repro: Esc, OPTIONS tab in any chapter.
  - evidence: critic/rounds/round-20/evidence/seymour-flux-win/run.json pause.optionsText; critic/rounds/round-20/evidence/seymour-flux-win/14-pause-options.png
  - confidence: high
  - requirement: RUBRIC section 6 (motion and flash accommodations, input access)
  - fix: Add a REDUCE FLASHES row that writes the existing fxEnv flag; list remapping as a question for Bailey.
  - acceptance check: OPTIONS shows REDUCE FLASHES and toggling it removes impact frames and flares in a fight.
  - status: open, round 20 (cd9dbbb0)
53. **PR-0289** [onboarding] PR-0289 (new, first run O2): step 1 says 'Start with the first one' while the spot sits on another selected chapter
  - game / chapter: both / chapter select, first run, 2000x1012 and 390x844
  - expected: Step 1's words match the highlighted chapter, or the highlight starts on Chapter I.
  - observed: Re-observed on the phone and in FFX-2: step 1 says "Start with the first one" while Chapter IV is selected and the card covers rows I to VII.
  - repro: Fresh profile, move down to Bahamut on the board.
  - evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/03-card.png; ffx2-bahamut-win-phone-touch/03-card.png
  - confidence: high
  - requirement: RUBRIC section 6 (onboarding that teaches); CHK-008
  - fix: Say 'Start here' for the selected chapter, or keep the card off the list.
  - acceptance check: Step 1 copy true for every selected chapter; card clear of the list rows.
  - status: open, round 20 (cd9dbbb0)
54. **PR-0237** [interface] PR-0237 (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate
  - game / chapter: FFX-2 only / IV Bahamut, first menu, 390x844 touch
  - expected: The coach sits below the intent strip.
  - observed: Re-observed: the phone first-time coach tag overprints the FFX-2 intent third line ("115-" cut), Ch IV.
  - repro: Fresh profile, Chapter IV, 390x844 touch, first menu.
  - evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win-phone-touch/10-first-menu-coach.png
  - confidence: high
  - requirement: CHK-008
  - fix: Place the phone coach under the intent strip.
  - acceptance check: 0 px2 between the coach and the intent strip at 390x844 in Ch IV, V, VI.
  - status: open, round 20 (cd9dbbb0)
55. **PR-0357** [interface] PR-0357 (new; R20-IF-04 + capture owner): the intent card's overflow/ALSO line is cut mid-sentence and ghosted behind the dashed footer rule (Ch I, Ch IV; 2000x1012)
  - game / chapter: both (Ch I, Ch IV seen) / I Seymour Flux, IV Bahamut, desktop
  - expected: A collapsed card ends on a whole line or a clearly dimmed 'more' cue.
  - observed: Re-observed: the Leblanc intent odds list is ghosted behind the dashed rule at 2000x1012.
  - repro: Chapter IV, E open at the first menu, 1600x900 or 2000x1012.
  - evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/11-advisor.png; ffx2-bahamut-lose/11-advisor.png; audit/zz-contrast.tmp.mjs; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
  - confidence: medium
  - requirement: CHK-003; RUBRIC section 2
  - fix: Clip at a line boundary, or put the consequence ('Slowing him slows it too') in the first visible line.
  - acceptance check: No card line shown at under 3:1 and none cut mid-sentence in the collapsed state.
  - status: open, round 20 (cd9dbbb0)
56. **PR-0324** [interface] PR-0324 (carried, half fixed): Ronso Rage no longer called timed in code (live card not captured); Yuna's Grand Summon is still called a "Timed input"
  - game / chapter: FFX only / XIV Isaaru, first menu, 1600x900 seed 1
  - expected: No 'Timed input' on an untimed picker (project data: no timed input; a picker only).
  - observed: Re-observed: Yuna's Grand Summon still reads "Timed input" (Ch XIV); the Ronso Rage live card was not captured.
  - repro: Real keys to Chapter XIV, first menu, read the advisor card.
  - evidence: critic/rounds/round-20/evidence/isaaru-via-purifico-win/run.json advisorText
  - confidence: high
  - requirement: RUBRIC section 2; AGENTS.md rule 6
  - fix: Add the phrase only when timerMsFor(def) is above 0 (Swordplay, Bushido, Lady Luck reels keep it).
  - acceptance check: No 'Timed input' on Ronso Rage, Grand Summon or Mix rows; Bushido and reels keep it.
  - status: open, round 20 (cd9dbbb0)
57. **PR-0259** [delivery] PR-0259 (carried, narrowed: the first single-lane measurement now exists; fourth review): no throttled-network, weaker-GPU or non-Chromium load and frame evidence, with about 100 MB fetched before the first menu
  - game / chapter: both / all; new per-frame work in the pause (living portrait canvases), 8 more rooms with drift-driven plate defocus, plate wings, and about 5 MB of twirl keys at battle start (desktop full tier)
  - expected: 60 fps at 1600x900 and a load under five seconds on named hardware, browser, network and cache, with frame-time spikes and first-ability stalls reported.
  - observed: Measured live, cold cache, 1600x900, Ryzen 7 7800X3D, RTX 5070 Ti, headless Chromium 153, shared host (CPU 65 to 97 percent): title ready in 623 to 810 ms (1,485 KB, 5 requests, FCP 188 to 340 ms); 59.7 to 60.0 fps over 12 s idle and 15 to 18 s action windows in Flux, Bahamut and Sin Fins and Core, p99 16.8 ms, max 33.4 ms, 0 frames over 50 ms; first-ability windows max 33.2 and 16.8 ms. Before the first command menu the page fetches 166 to 192 requests, 82.7 to 88.0 MB art and 17.9 to 20.1 MB audio; card Enter to first menu 9.9 to 12.2 s unthrottled including the scene-skip hold. Never measured: 10 Mbit with 40 ms latency (round 18b measured 52.0 s on a 577 MB build; this is 798 MB), a mid-range GPU, Firefox, Safari, Edge, 3840x2160 and 2560x1080 timings, the pause with a living portrait, the first dressphere change, Sin's first ability window. PR-0240 (no non-Chromium play evidence: Playwright WebKit ran only the build image-load gate; Firefox will not start on this machine) is carried inside this ticket.
  - repro: one browser lane, nothing else running, named GPU and CPU: Chapter I and IV 1600x900 cold cache unthrottled and at 10 Mbit/s 40 ms; 60 s frame-time windows in Flux, Bahamut (with a dressphere change), Via Purifico or Zanarkand (defocus rooms) and in the pause with a living portrait.
  - evidence: critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-19b.json PR-0259, PR-0240
  - confidence: high for the measured figures; the throttled and weaker-hardware outcomes are unknown
  - requirement: RUBRIC sections 2 and 6; CHK-017 load clause
  - fix: Add a throttled-entry and low-GPU slot to the perf protocol (the single-lane protocol itself worked) and decide with Bailey whether a lighter pre-menu payload is wanted if the 10 Mbit entry exceeds the target; no product change proposed until measured.
  - acceptance check: A report with named hardware and the figures above for cd9dbbb0.
  - status: open, round 20 (cd9dbbb0)
58. **PR-0353** [delivery] PR-0353 (carried, STALLED: same id open at the same severity for two reviews; method check owed; widened with PR-0227 Trema): FFX-2 XV Den of Woe won 0 of 7 attempts and XIII Trema 0 of 7 this round (0 of 4 each in round 20)
  - game / chapter: FFX-2 only / XIII and XV
  - expected: A real-flow win for each included chapter, with results rows, post-scene, board and a reload that keeps the clear (CHK-022).
  - observed: Den of Woe: defeats at 10 and 33 picks (two attempts) and 11, 20, 62, 18, 15 (five attempts), the second run's cards read TURNS 4 ATTEMPTS 5; 19b won it first try on the same chapter. Trema: defeats at 95, 81 (two attempts) and 97, 82, 83, 95, 98 (five), results TURNS 275 and 363, never cleared in four rounds. Loss, results, RETRY and chapter select work in both. No victory flow, post-battle scene or reward row for either chapter exists on this build. Round 20's engine A/B (identical digests on 120 seeds) says the engine did not change for Den; this evidence cannot separate encounter tuning, the route's policy or timing, so the cause is not established.
  - repro: node critic/rounds/round-21/cap/route21.mjs ffx2-den-of-woe win --base=https://baileypillon.github.io/pyrefly-reprise/ --attempts=5 and the same for ffx2-trema; PYREFLY_BROWSER=gpu, seeds 1, 1001, 2001, 3001, 4001.
  - evidence: critic/rounds/round-21/evidence/ffx2-trema-win, ffx2-trema-win-r2, ffx2-den-of-woe-win, ffx2-den-of-woe-win-r2 (run.json attempts, 31-results.png)
  - confidence: high that no win is recorded; low on cause
  - requirement: CHK-022; RUBRIC section 5 and the milestone gate; balance itself belongs to the combat and encounter auditors and is not scored twice
  - fix: Write the method check RUBRIC section 8 asks for before a third batch: either a hand-played or strategy-guide route (Jegged) for each chapter on an idle host, or a seeded engine run of the sourced intended strategy, to decide route fault versus tuning; whichever shows a legitimate win through the real flow settles CHK-022 for the chapter. No tuning proposed by this auditor.
  - acceptance check: One recorded win per chapter through results, CONFIRM, scene, board and reload, with the reward row read against the research docs.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
59. **PR-0348** [delivery] PR-0348 (carried, not reproduced once): FFX-2 VI Leblanc seed 1 stalled 957 s at link 1 in round 20; round 21's run won in 70 turns
  - game / chapter: FFX-2 only / VI
  - expected: A run reaches an outcome, or a player at an open menu can always back out.
  - observed: ffx2-leblanc-win: victory seed 1 attempt 1, 70 turns, 446 s fight, 9.9 min, 0 console errors; the stalled-run DOM dump and Esc probe the issue asked for were never taken, so the cause (menu reopening in a submenu, or the route not pressing Back) is still not established.
  - repro: Three serial seed 1 runs of route21.mjs ffx2-leblanc win on an idle host; on a stall dump the menu depth and top-row labels, then press Esc and record the result.
  - evidence: critic/rounds/round-21/evidence/ffx2-leblanc-win/run.json
  - confidence: medium
  - requirement: CHK-022; RUBRIC section 5 (separate harness failures and product failures)
  - fix: Close as a route fault after two further clean runs, or keep the stall dump in the route so a recurrence is diagnosed.
  - acceptance check: Two further consecutive wins with no stall, or a captured stall with its Esc result.
  - status: open, round 20 (cd9dbbb0)
60. **PR-0295** [prep] PR-0295 (carried, not re-captured): at 390x844 the STATS, EQUIPMENT, ITEMS and OVERDRIVE prep tabs show the 640x360 desktop board letterboxed (tiny text); no prep tab other than CHAPTER was opened this round at any size (third round; also PR-0292)
  - game / chapter: both
  - expected: Every prep tab usable at phone size (RUBRIC section 6).
  - observed: The capture opened prep only on the CHAPTER tab (04-prep.png) and returned; no tab key, pad or tap was sent. The release did not touch PartyPrep, so round 20's finding is carried, unrechecked.
  - repro: 390x844 touch, Chapter I prep, swipe through the tabs.
  - evidence: critic/rounds/round-20.json PR-0295; no round 21 capture
  - confidence: medium (carried)
  - requirement: RUBRIC section 6 onboarding and prep device usability; CHK-003
  - fix: Give the remaining prep tabs the phone page treatment Sphere Grid B introduced, after a capture confirms the state.
  - acceptance check: A phone capture of every prep tab at 390x844 with readable text.
  - status: open, round 20 (cd9dbbb0)
61. **PR-0292** [onboarding] PR-0292 (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold
  - game / chapter: FFX / I prep
  - expected: Every control has a key or pad route, and touch wording on touch screens.
  - observed: Carried, not captured (the prep tabs were not opened by input at any size; third round without them). Prep code untouched in release 38.
  - repro: Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
  - evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
  - confidence: high
  - requirement: onboarding: input access
  - fix: Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
  - acceptance check: A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
  - status: open, round 20 (cd9dbbb0)
62. **PR-0327** [delivery] PR-0327 (carried, not captured): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; cold or throttled behaviour still unobserved
  - game / chapter: FFX-2 only
  - expected: Keys present when the twirl plays, or a clean fallback.
  - observed: Trema runs request paine-warrior, paine-thief and yuna-warrior twirl-forming and twirl-end files during play; no timing of key arrival against the outfit frame exists on a throttled cache.
  - repro: Cold profile, 10 Mbit, Chapter IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
  - evidence: critic/rounds/round-21/evidence/ffx2-trema-win/network-media.json (twirl requests present, no timing)
  - confidence: low (builder-stated, never captured)
  - requirement: RUBRIC section 2 measured loading
  - fix: Prefetch the party's twirl keys at battle start at idle priority, after the throttled capture shows a gap.
  - acceptance check: A throttled capture where every twirl key response ends before the outfit frame.
  - status: open, round 20 (cd9dbbb0)
63. **PR-0223** [delivery] PR-0223 (carried, unchanged): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured
  - game / chapter: FF7 experiment (hidden)
  - expected: 0 requests >= 400 on the FF7 pause.
  - observed: Not captured in round 21; no FF7 file changed.
  - repro: FF7 door, then battle, then Esc; record the network log.
  - evidence: critic/rounds/round-20.json PR-0223
  - confidence: low
  - requirement: CHK-017 and CHK-018
  - fix: None until observed.
  - acceptance check: A network log of the FF7 pause with no 4xx.
  - status: open, round 20 (cd9dbbb0)
64. **PR-0339** [harness] PR-0339 (critic tooling, carried pattern from rounds 17-19): the route harness never wins Ch XIII, XVII or XVIII, and stamps the post-scene capture before the results screen
  - game / chapter: both / ffx2-trema, sin-fins-core, sin-face; post-scene in I, II, VII, VIII, VI
  - expected: A recorded real-key win through results and back to the board for every included chapter (CHK-022).
  - observed: The route bot loses at human pace: Yunalesca lost on seeds 1, 1001 and three more attempts (116-121 turns, 643-720 s per fight) and won only on seed 4001 after 58 minutes; Trema lost 5 of 5 (81-98 turns); Den of Woe lost 4 of 4 plus one chain-link win, then defeat. Braska and Sin Fins Core stalled at link 3 on the short budget and won on the long re-runs. No victory results screen was captured for Trema or Den of Woe (product cause not established; see PR-0227 and PR-0306).
  - repro: cap/lanes.sh with ffx2-trema win --seed=1|2|3 --attempts=2; gapcap/swordplay.mjs sin-fins-core 1600x900 "" 1
  - evidence: critic/rounds/round-21/evidence/ffx2-trema-win-r2/run.json, ffx2-den-of-woe-win-r2/run.json, yunalesca-win-r2/run.json
  - confidence: high that it is not a product regression; unknown whether a better bot wins
  - requirement: CHK-022
  - fix: Teach the route to enter the shown Overdrive input and a race-aware policy for the Sin chapters, raise the turn cap, and read the post-scene after CONFIRM (with PR-0261).
  - acceptance check: A recorded win through results, CONFIRM, scene and board for XIII, XVII and XVIII.
  - status: open, round 20 (cd9dbbb0)
65. **PR-0261** [harness] PR-0261 (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []
  - game / chapter: both (tooling) / all phone routes
  - expected: contexts.touch.blocked names the element that intercepts the tap.
  - observed: Pattern persists: Braska and Sin Fins Core short runs stalled at link 3 and read as outcome "victory" in the collation; seven victories carry an unverified 30-post-scene frame (the screen wanted a cutscene and got results, PR-0339 pattern).
  - repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
  - confidence: high
  - requirement: CHK-016 evidence integrity
  - fix: Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
  - acceptance check: A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
  - status: open, round 20 (cd9dbbb0)
66. **PR-0375** [harness] PR-0375 (critic tooling, new; R21-PD-02): the pause matrix assumes a plain top row at the FFX first menu, so four FFX rows fail on a shifted state
  - game / chapter: FFX only (FFX-2 first menus open on a row that is not Attack at the coach)
  - expected: A row fails only when the game's response differs from the rule from the stated state.
  - observed: seymour-flux-pausematrix-1600x900 row 4 starts with targets 2 (the target cursor open) because the last coach card's Enter also chose Attack (OBS-03); Esc therefore closes the cursor instead of opening pause, and rows 5 to 7 run one state out of step and read FAIL. The pad run's row 11 (targeting Esc) starts with targets 0 and rows 12 and 13 follow. Every row after the shift behaves as the rules say. The report would read 14 pass 4 fail and 10 pass 3 fail as a product failure.
  - repro: node critic/rounds/round-21/cap/pausematrix21.mjs seymour-flux and read run.json rows 4 to 7 (before.targets).
  - evidence: critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900/run.json, -pad, -390x844-touch
  - confidence: high
  - requirement: CHK-015 and CHK-016 (state asserted before a row counts)
  - fix: Assert the precondition of each row from the game snapshot (top row, targets 0) and press Esc once to close a stray cursor before the row, or stamp the row UNVERIFIED instead of FAIL; keep OBS-03 itself with the onboarding and interface auditors.
  - acceptance check: Flux matrix reads 18 of 18 on a rerun from the same build.
  - status: open
67. **PR-0376** [harness] PR-0376 (critic tooling, new; R21-PD-03 + gap-pass bug): clip21.mjs threw ReferenceError (Cannot access "path" before initialization) in 21 run.json files, so most clip routes recorded no clips
  - game / chapter: both
  - expected: Every run started with clips leaves its clip folders.
  - observed: clipError appears 9 to 20 times in 21 run.json files (Flux win, pad, reduce-motion, phone clips, lose-clips, Bahamut win, pad and phone, Sin Fins long, Braska long r2, Evrae, Natus, Omnis, Anima, Ixion, Isaaru, Sin Face and others); clips exist for only nine runs (135 clips, 38 transitions: Braska, Yojimbo, Leblanc, Fallen Aeons, Vegnagun, Den, Yunalesca, Sin Fins), and the runs asked for clips with --clips (Bahamut phone clips, Flux phone clips, lose-clips) hold none. Auditors judging motion or transitions must not count these runs. Merged with the gap pass's own diagnosis: in finish() a local "let path" (the actor's path samples) shadowed the node:path import; renamed to samplePath in the scratch copy (cap/clip21.mjs lines 138-152, not re-run for the phone, pad, reduce-motion and lose routes). The gap pass re-recorded the Flux and Braska telegraph-hold clips and the Bahamut attack and skill-travel clips with it.
  - repro: grep clipError critic/rounds/round-21/evidence/ffx2-bahamut-win/run.json; ls evidence/ffx2-bahamut-win/clips (empty).
  - evidence: critic/rounds/round-21/evidence/*/run.json steps k=clipError; critic/rounds/round-21/evidence/*/clips
  - confidence: high
  - requirement: CHK-016 (evidence the harness proved)
  - fix: Move the path import or declaration ahead of its first use in critic/rounds/round-21/cap/clip21.mjs and re-record the missing clips (a capture-owner step; no product change).
  - acceptance check: A repeat of ffx2-bahamut-lose-clips leaves its clips and no clipError step.
  - status: open
68. **FOC37-03** [interface] FOC37-03 (carried from the focused review, not reproduced): the Ch IV first-run coach tag clips at 2000x1012 for some first actors
  - game / chapter: FFX-2 only / IV Bahamut, 2000x1012, seed 2 (focused review)
  - expected: Coach and tag stay inside the viewport.
  - observed: Round 20 captured 2000x1012 coaches at seeds 1, 1001 and 1002 (Ch IV, Ch XIII, others): all inside the page (tag right edge near x 525 of 2000 in Ch IV). Seed 2 of Ch IV was not run, so the focused finding neither confirmed nor cleared.
  - repro: Chapter IV, seed 2, 2000x1012, first menu.
  - evidence: critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused.json FOC37-03; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
  - confidence: low (not reproduced)
  - requirement: CHK-003
  - fix: Clamp the coach card and tag to the viewport width.
  - acceptance check: Seed sweep 1-6 at 2000x1012 in Ch IV: tag right edge below the page width.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. Release 38's coach-tag and floor changes (r38-polish) may have changed it.
69. **PR-0342** [visual] PR-0342 (new; V20-02): Ch IX: a foreign blue tree painting shows over the cavern backdrop for part of the fight
  - game / chapter: FFX only / Chapter IX
  - expected: The Cavern of the Stolen Fayth plate and its approved look only.
  - observed: A bright blue-white tree canopy with falling petals appears in the upper right of the cavern battle plate in 13-guide-G (about 5.7 s after the first menu) and faintly behind Yojimbo in 16-target-single; the cavern plate is otherwise a near-black platform. It looks like a crossfade or layer from another room (Macalania woods). Round 19b's Ch IX frames show no tree.
  - repro: As V20-01, then press G at the first menu and screenshot at 2000x1012.
  - evidence: critic/rounds/round-20/evidence/yojimbo-cavern-win/13-guide-G.png, critic/rounds/round-20/vis/yoj13-crop.jpg
  - confidence: medium-low (one run; cause unestablished)
  - requirement: CHK-013 (art judged in the running game); approved art identity
  - fix: Identify which layer paints the tree (suspected A-7 living-backdrop sky layer or a plate crossfade) and restrict it to rooms that own it; the fix lives with V20-01.
  - acceptance check: No tree or foreign painting at any point of a Ch IX fight in 3 of 3 runs at 1600x900 and 2000x1012.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. Release 38 changed the Ch IX night-sakura arrival (FOC371-01); the hurried-opening arrival and the blue-tree check were not captured (gap pass UNVERIFIED), so this id neither closes nor re-scopes yet.
70. **PR-0355** [interface] PR-0355 (new; R20-IF-02): FFX-2 Ch VI enemy list: Ormi's "STATUS 4" tag overprints the name "Dr. Goon"
  - game / chapter: FFX-2 only / VI Leblanc Syndicate, first link, Dr. Goon KO'd, Ormi with four statuses, 1600x900 seed 1
  - expected: Every enemy name is readable (CHK-009).
  - observed: Ormi's 'STATUS [4]' tag sits on the 'Dr. Goon' row and covers the top half of the name; the frame is static (the run sat idle on it for minutes).
  - repro: Chapter VI at 1600x900, get Ormi to carry four statuses, open any Rikku or Yuna menu; read the enemy list at top left.
  - evidence: critic/rounds/round-20/evidence/ffx2-leblanc-win/27-no-choosable-row.png; crop critic/rounds/round-20/audit/zz-leblanc-status-crop.png
  - confidence: medium (one chapter and state; the first-run harness stalled in this state)
  - requirement: CHK-009
  - fix: Reserve the tag's height in the row stack or draw the tag to the right of the name.
  - acceptance check: label-fit probe: no enemy name box intersected by a status tag with 1 to 6 statuses on any enemy row, 1600x900 and 2000x1012.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
71. **PR-0320** [visual] PR-0320 (carried): the first-time Rikku coach line is still up over the girls' feet during the held dressphere shot (Ch XIII 2000x1012)
  - game / chapter: FFX-2 only / Ch XIII Trema
  - expected: The coach line hidden for the shot and back after it.
  - observed: While the shot label 'Paine Songstress' is up, the pink 'GAUGES RUNNING - A COMMAND HOLDS THEM' tag and the Rikku quote card sit across Paine's shins and feet. The builder's html.mix-held rule hides the coach but the disclosed evidence shows the rule, not the flow; in the natural run it does not hide it.
  - repro: FFX-2 Ch XIII seed 1: first CHANGE with the coach unseen; frames f02-f06.
  - evidence: critic/rounds/round-20/vis/trema-coach.jpg, critic/rounds/round-20/vis/trema-spc.jpg
  - confidence: high
  - requirement: CHK-008
  - fix: Apply the hide in the code path that raises the coach after the held shot starts (the coach registers its own listener after the shot's class is set).
  - acceptance check: No coach-mark box intersects a girl's painted box in any frame of the shot in Ch IV, XIII at 1600x900 and 2000x1012.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
72. **PR-0347** [feel] PR-0347 (new; R20-FEEL-03): at the Den of Woe link-2 seam the camera pushes Yuna out of the left edge by 2.5 s (also in 19b)
  - game / chapter: FFX-2 only / Ch XV Den of Woe, link 1 to 2 seam, 1600x900
  - expected: Camera keeps all three girls in frame or cuts away deliberately.
  - observed: seq-seam-2: frames f03-f05 hold the whole party; by f06 (2.18 s) Yuna is at the left edge and by f07 (2.51 s) only her staff and a sliver show while the Gippal line card is up. Same composition in round 19b f07 and in the r19route run, so it is not a regression.
  - repro: Route harness ffx2-den-of-woe seed 1, link 1 won, watch the seam to link 2; frames critic/rounds/round-20/evidence/ffx2-den-of-woe-win/seq-seam-2/f06.jpg and f07.jpg
  - evidence: critic/rounds/round-20/feel-narr/seam-den2.jpg; critic/rounds/round-20/feel-narr/seam-den19.jpg
  - confidence: medium
  - requirement: RUBRIC 6: coherent camera
  - fix: Clamp the seam camera's end pose on the party's leftmost member for this chapter.
  - acceptance check: Den link-2 seam at 1600x900 and 2000x1012: all three girls fully visible at every frame through the first menu.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. The Den link-2 seam crop was not re-measured.
73. **PR-0346** [feel] PR-0346 (new; R20-FEEL-01, low confidence): under a loaded host the chapter card stays up 3-4 s into the transition after a hurried scene entry
  - game / chapter: both / FFX Ch I, III; FFX-2 Ch IV, XIII, XV (observed slow); most other chapters show the fast path
  - expected: Card 0.7 s after a hurried scene and first menu in about 3.2-4.8 s (docs/handoff/r37-scenes.md), at least on a single lane.
  - observed: The hurried entry (PR-0061) gives 3.4-5.2 s to first menu in 23 of 28 runs. In five runs the full chapter card is still on screen 2.75-4.08 s into the hand-over sequence (Flux win f09 at 2950 ms, Braska 3303 ms, Trema 4084 ms then gone at 4533, Bahamut lose 3777 ms, Den first run 2749 ms) and first menu was 5.4, 7.4, 6.3, 4.7 (lose) and 16.9 s. All five started in the first parallel burst (lanes A, B, C, D at 17:37:25Z) or the Den lane with 3 other lanes active; the Den first run alone cost 31 s wall against 19-20 s for the rest.
  - repro: Route harness, fresh profile, hold Enter through the pre-scene, then watch seq-transition-into-battle. Seed 1. Compare critic/rounds/round-20/feel-narr/trprof.py output (luminance 163-175 = card) for seymour-flux-win, braskas-final-aeon-win, ffx2-trema-win, ffx2-bahamut-lose against the fast runs.
  - evidence: critic/rounds/round-20/feel-narr/trprof.py; critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-20/evidence/seymour-flux-win/seq-transition-into-battle/f09.jpg
  - confidence: low (host load vs load-time wait not separated; no single-lane retime)
  - requirement: RUBRIC 4 and 9: a resource-contention timeout is investigated before it is called a game defect; PR-0061 closure needs the claim measured
  - fix: Re-run Flux, Braska, Trema and Bahamut entry alone on one lane and log when the card is dismissed and what it waits on; if it waits on the battle load, nothing to change, otherwise cap the hurried card at 0.7 s.
  - acceptance check: Single-lane entry for the four runs: card gone and first menu under 5.5 s in all four, 3 repeats.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
74. **PR-0356** [interface] PR-0356 (new; R20-IF-03, medium-low confidence): pause section labels read at about 2.1-2.8:1 contrast
  - game / chapter: both / pause: member tab, OPTIONS, phone header; 1600x900, 2000x1012, 390x844
  - expected: Text a player must read at 3:1 or better (the PR-0322 repair uses 3:1 for dimmed state text).
  - observed: Pixel estimates: BATTLE STATS 2.5:1, THIS ENCOUNTER 2.8:1, ABOUT 2.4:1 (1600x900 and 2000x1012), phone PYREFLY REPRISE header 2.1:1 and IN THIS FIGHT 2.2:1. The values and row labels beside them read at 11 to 14:1. Estimates over a busy painting, so the figure is approximate.
  - repro: Open the pause on Ch I or Ch IV; run critic/rounds/round-20/audit/zz-contrast.tmp.mjs.
  - evidence: critic/rounds/round-20/audit/zz-contrast.tmp.mjs; feat/ffx2-bahamut-pause-living-2000x1012/p05.png; seymour-flux-win/14-pause-options.png
  - confidence: medium-low
  - requirement: CHK-003
  - fix: Lift the section-label token to 3:1 against the darkest and lightest part of the plate it sits on.
  - acceptance check: Section labels at 3:1 or better on every plate at 1600x900 and 390x844.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
75. **PR-0248** [visual] PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe
  - game / chapter: FFX only / VII Seymour and Anima, single-target step, 2000x1012
  - expected: No panel over a painted figure the player may target next.
  - observed: The 'Guado Guardian A HP ???' Sensor card covers Guardian B's torso and robe while Guardian A is targeted.
  - repro: Chapter VII, Attack, step to Guado Guardian A.
  - evidence: critic/rounds/round-20/evidence/seymour-anima-macalania-win/16-target-single.png
  - confidence: high
  - requirement: CHK-008
  - fix: Add the projected enemy quads to the Sensor card's placement test.
  - acceptance check: Sensor card clear of every enemy box except the target in Ch VII, X, XII.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. (the interface auditor lists it as carried, not re-observed; the Ch VII advisor code is changed only in MoveAdvisor.ts, advisorRoomy.ts, advisorLane.ts).
76. **FOC37-01** [interface] FOC37-01 (carried from the focused review, downgraded major -> polish): the Lady Luck reel overlay is covered by the guide card; unreachable by players (PR-0340) and not reproduced live
  - game / chapter: FFX-2 only (Lady Luck minigame) / not driven in round 20
  - expected: The overlay sits above the guide card, or the guide hides while a minigame is open.
  - observed: Reported by the focused review's Lady Luck lane ('reel 1 and the DUD warning half hidden'); not re-reproduced by that review and not exercised in round 20 (no Lady Luck fight was driven).
  - repro: Open the Lady Luck reel overlay with the guide card on.
  - evidence: critic/reviews/cd9dbbb08-focused.json FOC37-01
  - confidence: unverified
  - requirement: CHK-006, CHK-008
  - fix: Raise the overlay above the guide or hide the guide during a minigame.
  - acceptance check: Reel 1 and the DUD warning fully visible with the guide on, 1600x900 and 390x844.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. Release 38 raised the minigame layer above the intent card (r38-polish FOC371-02, z-index 15) and Lady Luck is still reachable by no player (PR-0340), so the reel overlay cannot be re-read.
77. **PR-0321** [interface] PR-0321 (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor
  - game / chapter: both / any (pause > OPTIONS > EYE CANDY) at 390x844
  - expected: CHK-003: no player text under 14 css px at 390x844.
  - observed: 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
  - repro: 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
  - evidence: critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
  - confidence: high
  - requirement: CHK-003
  - fix: Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
  - acceptance check: ecfont at 390x844 in both games: under14 empty, no clipping.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
78. **PR-0249** [interface] PR-0249 (carried, re-observed by the chief): the FFX-2 intent card covers the girls at 1600x900; at the whole-party Shell target in Ch IV it stands over Rikku and Paine
  - game / chapter: FFX-2 / IV Bahamut
  - expected: No panel over a face or a weapon.
  - observed: tgt-ffx2-bahamut-1600x900-shell/target.png (c69de96a, seed 1, real keys): the BAHAMUT ACTS NEXT card (x about 490-865, y about 185-500) covers Rikku and Paine almost to the feet while the target brackets frame them; Yuna stays clear. Under the colossus master the girls stand further back than in round 18b's frame, so the overlap reads larger; whether it differs from live 35 at this state is not captured.
  - repro: Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
  - evidence: critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png
  - confidence: high for the observation; unknown against live
  - requirement: CHK-008
  - fix: Add the projected party quads to the intent card's placement test while targeting.
  - acceptance check: Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
79. **FOC28-P02** [interface] FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone
  - game / chapter: FFX / II and XIV Grand Summon picker, 390x844
  - expected: Legible and not clipped.
  - observed: Recorded by the focused review of this same build and still open.
  - repro: See critic/reviews/6ea8528f-focused.md.
  - evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
  - confidence: high
  - requirement: CHK-003
  - fix: As proposed in the focused report.
  - acceptance check: As proposed in the focused report.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
80. **PR-0239** [interface] PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3
  - game / chapter: FFX-2 (the rail is shared) / XI Fallen Aeons, Rikku's Mega-Potion charging
  - expected: The two panels do not contradict each other about the same turn.
  - observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
  - repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
  - evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
  - confidence: high
  - requirement: Interface: useful advice
  - fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
  - acceptance check: In the same case, the rail and the card agree or the rail defers.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
81. **PR-0246** [interface] PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'
  - game / chapter: FFX / Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A
  - expected: The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
  - observed: 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
  - repro: node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
  - evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
  - confidence: high
  - requirement: PR-0246 acceptance; CHK-009
  - fix: Wrap the label to two lines, or drop the verb when the name is long.
  - acceptance check: The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
82. **PR-0247** [visual] PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s
  - game / chapter: FFX / VII, battle, Anima's arrival at 390x844 touch
  - expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
  - observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
  - repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
  - evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
  - confidence: high
  - requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
  - fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
  - acceptance check: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
83. **PR-0250** [interface] PR-0250 (carried, confirmed): the phone results location caption is clipped
  - game / chapter: FFX / Ch XII
  - expected: The full caption.
  - observed: 'INSIDE SIN — THE GARDEN C…'
  - repro: Lose or win Ch XII at 390x844.
  - evidence: round-18/evidence/seymour-omnis-win-touch/31-results.png
  - confidence: high
  - requirement: CHK-009
  - fix: As in round 17.
  - acceptance check: The caption's scrollHeight <= clientHeight + 1 at 390x844.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
84. **PR-0252** [interface] PR-0252 (carried): the first-turn coach card overlaps the selected command row
  - game / chapter: FFX / X Seymour Natus at 2000x1012 (2560x1080 not captured)
  - expected: Coach clear of the command stack.
  - observed: Auron's line overlaps the right end of the selected TALK row by 3,496 px² at the first menu.
  - repro: Fresh profile, 2000x1012, Ch X first menu.
  - evidence: critic/rounds/round-17/evidence/seymour-natus-win/10-first-menu-coach.png; run.json focFirst
  - confidence: high
  - requirement: CHK-008
  - fix: Add the command stack to coachActorAvoid's rects at wide sizes.
  - acceptance check: 0 coach/command overlap at 2000x1012 and 2560x1080 in Ch I, X and XII.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
85. **PR-0254** [narrative] PR-0254 (carried, STALLED): Chapter VII Talk is still silent
  - game / chapter: FFX / VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350)
  - expected: A Tidus line and Seymour's reply within 3 s of each Talk.
  - observed: The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
  - repro: Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
  - evidence: critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
  - confidence: high
  - requirement: narrative: banter and reachable character voice
  - fix: Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
  - acceptance check: The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. (the narrative auditor did not re-probe Chapter VII Talk).
86. **PR-0271** [visual] PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s
  - game / chapter: FFX only / XVIII Sin: the Face
  - expected: No HUD panel over a face, including during camera moves (CHK-008).
  - observed: When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
  - repro: Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
  - evidence: critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
  - confidence: medium (observed; no live action-frame evidence to compare)
  - requirement: CHK-008
  - fix: Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
  - acceptance check: XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
87. **PR-0276** [interface] PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header
  - game / chapter: FFX-2 / IV Bahamut
  - expected: Header visible, or scrolling inside the rows only.
  - observed: The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
  - repro: Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
  - evidence: critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
  - confidence: high
  - requirement: CHK-009
  - fix: Make the header sticky, or scroll the rows container only.
  - acceptance check: Header box fully inside the list viewport after wheel up and down.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
88. **PR-0277** [interface] PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board
  - game / chapter: FFX / I Seymour Flux
  - expected: The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
  - observed: The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
  - repro: Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
  - evidence: critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
  - confidence: low
  - requirement: CHK-005 (says in plain words what to spend the turn on)
  - fix: Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
  - acceptance check: On the same board the card names the raise, then the cure, in that order.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
89. **PR-0286** [interface] PR-0286 (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)
  - game / chapter: FFX / Ch I
  - expected: The message and the dialogue text do not overlap.
  - observed: 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
  - repro: 390x844 touch, Ch I. Play until Zombie lands during a banter line.
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
  - confidence: medium
  - requirement: CHK-008
  - fix: Offset the message line below the banner while a line is up, or queue it until the line ends.
  - acceptance check: Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
90. **PR-0288** [interface] PR-0288 (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')
  - game / chapter: FFX / Ch I
  - expected: The full help sentence, wrapped if needed.
  - observed: 'TIDUS · Nothing left to say — A one-off action this enc…'
  - repro: 390x844 Ch I after Talk is used up, cursor on TALK.
  - evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
  - confidence: high
  - requirement: CHK-009
  - fix: Allow two lines, or shorten the copy for the phone.
  - acceptance check: scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
91. **PR-0291** [interface] PR-0291 (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)
  - game / chapter: FFX / I
  - expected: As in the approved O3 target, both panels are readable.
  - observed: The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
  - repro: Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
  - confidence: high
  - requirement: approved target O3 / interface readability
  - fix: Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
  - acceptance check: No overlap between .stwarn and the Guide card rect in that frame.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
92. **PR-0293** [visual] PR-0293 (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)
  - game / chapter: both / I, IV, VII, XVII, XVIII (every chapter checked)
  - expected: CHK-002: the pause painting covers the window at every supported size.
  - observed: Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
  - repro: Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
  - confidence: high
  - requirement: CHK-002
  - fix: Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
  - acceptance check: pauseRect.full is true at 3840x2160 in both games.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. The 3840x2160 Ch IV and Ch I frames exist; the pause painting at 4K was not read.
93. **PR-0296** [interface] PR-0296 (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line
  - game / chapter: FFX / XVII sin-fins-core, first decisions
  - expected: CHK-008: plates never cover the intent text.
  - observed: Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
  - repro: 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
  - evidence: ["D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg","D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/"]
  - confidence: medium (frames only)
  - requirement: CHK-008
  - fix: Reserve the intent line's band from the range plate on the phone layout.
  - acceptance check: No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
94. **PR-0302** [interface] PR-0302 (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)
  - game / chapter: both / I (Zombie), IV (Curse); any hinted status
  - expected: CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
  - observed: Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
  - repro: critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
  - confidence: high (measured)
  - requirement: CHK-003; RUBRIC section 5 (effective text size)
  - fix: Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
  - acceptance check: Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
95. **PR-0303** [interface] PR-0303 (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)
  - game / chapter: FFX (FFX-2's shorter target card leaves room: 0 px2) / I seymour-flux, a target step with a hinted status (Zombie)
  - expected: The target-step instructions and the hint do not overlap (CHK-008).
  - observed: 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
  - repro: Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
  - confidence: high
  - requirement: CHK-008; PR-0282 acceptance (the hint never over the command surface)
  - fix: Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
  - acceptance check: 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
96. **PR-0304** [interface] PR-0304 (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip
  - game / chapter: FFX-2 (desktop, guide open) / IV ffx2-bahamut, the girls' menus after Curse lands
  - expected: While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
  - observed: At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
  - repro: Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
  - confidence: medium (symptom high; cause suspected)
  - requirement: Status O3 target (the hint in the guide's slot); CHK-008
  - fix: Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
  - acceptance check: 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
97. **PR-0305** [onboarding] PR-0305 (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves
  - game / chapter: FFX-2 (the FFX help line follows each actor in both modes) / IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF
  - expected: The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
  - observed: Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
  - repro: 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
  - confidence: medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
  - requirement: CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
  - fix: Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
  - acceptance check: BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
98. **PR-0317** [visual] PR-0317 (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900
  - game / chapter: FFX only / I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03)
  - expected: A boss in action stays inside the frame (CHK-014).
  - observed: His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
  - repro: Candidate, seed 1, 1600x900, Ch I, let Seymour act.
  - evidence: critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
  - confidence: high
  - requirement: CHK-014; CHK-013
  - fix: Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
  - acceptance check: Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
99. **PR-0319** [visual] PR-0319 (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line
  - game / chapter: FFX only / IX yojimbo-cavern, first menu 2000x1012
  - expected: Background staging reads as background.
  - observed: Under the colossus master the far-back figure stands on the party's line at party scale.
  - repro: Candidate, seed 1, Ch IX first menu.
  - evidence: critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
  - confidence: low
  - requirement: visual: composition
  - fix: Push the prop deeper or dim it under the colossus master.
  - acceptance check: In the first-menu frame Ginnem sits clearly behind the line or out of view.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
100. **PR-0322** [onboarding] PR-0322 (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey
  - game / chapter: both / pause > OPTIONS > EYE CANDY
  - expected: Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
  - observed: FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
  - repro: Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
  - evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
  - confidence: high (contrast estimated from JPEG)
  - requirement: D-317; CHK-003
  - fix: Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
  - acceptance check: After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. The EYE CANDY page was not captured; its help text for the dressphere push-in changed in release 38.
101. **PR-0323** [onboarding] PR-0323 (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")
  - game / chapter: both / pause > OPTIONS > EYE CANDY
  - expected: Copy a first-time player understands (CHK-007).
  - observed: CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
  - repro: Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
  - evidence: critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
  - confidence: high
  - requirement: CHK-007
  - fix: Name the thing: "Off: the standard battle camera", "Off: the plain splash".
  - acceptance check: No "today" in the page's help strings; capture at 1600x900.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. The EYE CANDY page was not captured.
102. **PR-0325** [interface] PR-0325 (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot
  - game / chapter: FFX only / I seymour-flux, 1600x900
  - expected: The selected row is obvious (CHK-010).
  - observed: 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
  - repro: Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
  - evidence: critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
  - confidence: medium-low
  - requirement: CHK-010
  - fix: If confirmed, give the selected row the filled slab of the main list.
  - acceptance check: Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
103. **PR-0331** [visual] PR-0331 (new, a question for Bailey): the fail-closed gates take the D-316 colossus master away from Natus, Braska's Final Aeon and Evrae; only Yojimbo and FFX-2 Bahamut keep it
  - game / chapter: FFX only (Ch III, VIII, X) / seymour-natus, braskas-final-aeon, evrae-airship, 1600x900 to 2560x1440
  - expected: D-316 lists colossus presence for the big bosses.
  - observed: At all five aspects Natus, BFA and Evrae render exactly as live 35 (pixel-mean difference 10, 22, 17, mostly HUD text): Natus about 160-190 px tall at 1600x900 against about 470 px in round 19's candidate. Not worse than live; narrower than round 19 promised.
  - repro: Seed 1, first menu of Ch X, III, VIII at 1600x900; compare with gaps/fm-*-live35.
  - evidence: critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/evidence/gaps/plate/seymour-natus.json
  - confidence: high
  - requirement: D-316 scope; RUBRIC visual and feel (boss presence)
  - fix: Ask Bailey whether Natus should get its master back by steering the Sensor card off the boss (builder's proposal); list the three chapters as "today's framing" in the release notes.
  - acceptance check: Bailey's decision recorded; if steered, Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. A question for Bailey (D-316); the first menus show the colossus framings unchanged.
104. **PR-0332** [visual] PR-0332 (new, pre-existing): at 2560x1080 every measured chapter shows plate side bands; worst is Yunalesca (15.4 percent of the plate share, dark pillars and a tilted edge)
  - game / chapter: both (FFX measured in 6 chapters; FFX-2 Bahamut 9.4 percent) / yunalesca, braskas-final-aeon, seymour-natus, yojimbo-cavern, evrae-airship, seymour-flux, ffx2-bahamut; 2560x1080 first menu
  - expected: The painted plate fills a 21:9 frame (platform goal 4:3 to 21:9), or the edge is dressed.
  - observed: plate share at 2560x1080, chosen = today: Yunalesca 0.154, BFA 0.103, Natus 0.094, Yojimbo 0.094, Evrae 0.085, Flux 0.034, Bahamut 0.094. No live-35 frame at this aspect; parity rests on the builder's chosen = today measurement.
  - repro: Seed 1, Ch II first menu at 2560x1080; gapcap/plateprobe.mjs.
  - evidence: critic/rounds/round-19b/evidence/gaps/fm-yunalesca-2560x1080/11-first-menu-N-G-hidden.png; critic/rounds/round-19b/evidence/gaps/plate/*.json
  - confidence: medium
  - requirement: RUBRIC section 2 platform goals; visual composition
  - fix: Cover-scale the plate for frames wider than 2:1 (crop top and bottom) or extend the edge with the existing fog; never repaint approved plates.
  - acceptance check: Plate share 0 at 2560x1080 in all seven chapters.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. Narrowed by evidence: at 2560x1080 the painted wings cover the side bands in Ch IV and XV (PR-0344); the other chapters' bands were not re-measured.
105. **PR-0335** [harness] PR-0335 (critic tooling, widened; R20-PD-04 + capture owner): the phone route never uses the FFX list's page buttons, so the intended Poison Fang and Holy Water lines are never taken by touch (Ch I phone defeat 3 of 3, as 19b), and non-battle screens are reached by keyboard
  - game / chapter: FFX only / I Seymour Flux, 390x844 touch
  - expected: A touch run reaches any item by the page buttons the phone shows.
  - observed: Three phone attempts end in defeat at 9, 11 and 31 turns; run.json misses list 'Poison Fang' and 'Holy Water' with only the first six rows (Potion to Mega Phoenix) of x27 exposed; the harness fell back to Attack. Product reachability by touch is not shown either way. Three phone attempts (seed 1 and seed 2001) ended in defeat at 9, 31 and 11 turns and 9 turns. The misses list turns 3-7 wanting Poison Fang and turns 1-2 wanting Holy Water; subRows show Potion, Hi-Potion, X-Potion, Mega-Potion, Phoenix Down, Mega Phoenix only, although the pause shows 27 items. Taps were 31 and 167; keyboard fallbacks 38 and 61 (START BATTLE, CONFIRM, RETRY and chapter select were pressed on the keyboard). Capture owner: Wanted Poison Fang, the route took Attack; Yuna down, defeat. Identical 9-turn defeat in round 19b; desktop wins in 73 turns.
  - repro: critic/rounds/round-20/cap/route20.mjs seymour-flux --size=390x844 --touch
  - evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-touch/run.json misses; seymour-flux-win-phone-r2-touch/run.json
  - confidence: high for the harness limit; unknown for the product
  - requirement: CHK-015, CHK-022
  - fix: Teach the touch chooser to tap the page buttons until the row shows.
  - acceptance check: A touch run plays Holy Water and Poison Fang on the advisor's turn.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it. The phone route again never won Chapter I (defeat 4 of 4 over two rounds).
106. **PR-0336** [harness] PR-0336 (carried from round 19 unnamed, critic tooling): the save matrix reports a false FAIL for the fresh-profile case
  - game / chapter: both / n/a
  - expected: The harness passes a correct default save.
  - observed: save-matrix.json says 23 of 24 and fails fresh-profile; its unexpectedDiffs (version, chapters {}, unlocked [], seenCoach [briefing], flags {}) are the normal default save; looks, parts, volumes, reload and errors are all correct.
  - repro: critic/rounds/round-19b/cap/save-matrix19.mjs
  - evidence: critic/rounds/round-19b/evidence/save-matrix/save-matrix.json
  - confidence: high
  - requirement: CHK-024 evidence quality
  - fix: Make expected("{}") the default save shape.
  - acceptance check: The matrix prints 24 of 24 on an unchanged build.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
107. **PR-0337** [harness] PR-0337 (new, critic tooling): network and console are logged only for the 24 route runs; the 53 gap-pass sessions and the save-matrix boards carry no response log or verified stamp
  - game / chapter: both / n/a
  - expected: Every capture session records requests, status >= 400 and console errors.
  - observed: network-and-console-summary.json: 3,317 requests for 24 route runs and 0 for each of the 53 gap-pass sessions; the 36 save-matrix board shots carry an asserted screen but no verified stamp.
  - repro: critic/rounds/round-19b/gapcap/gaplib.mjs; critic/rounds/round-19b/cap/save-matrix19.mjs
  - evidence: critic/rounds/round-19b/evidence/network-and-console-summary.json
  - confidence: high
  - requirement: CHK-016, CHK-018
  - fix: Record requests and console errors in gaplib.mjs and save-matrix19.mjs; stamp the matrix shots through the route runs' screen assertion.
  - acceptance check: Every 19c session carries a network and console log.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
108. **PR-0359** [harness] PR-0359 (critic tooling, new; R20-PD-05 + capture owner): route.mjs findCard presses ArrowRight 16 times, so the 18th tile (Ixion) is unreachable; two Ixion runs aborted
  - game / chapter: both (tooling) / XVI Ixion and Djose, board
  - expected: The harness reaches any of the 18 tiles and labels an outcome from the final results screen.
  - observed: ffx2-ixion-djose-win and -r2 threw 'ASSERT-FAIL card ffx2-ixion-djose got seymour-flux' after 12 s; the walk reaches ffx2-den-of-woe and turns back. Run 3 reached the card and won. Not a product fault: the board has 18 tiles and the cursor moves tile by tile. Related: the route's 'fight' step still labels a chain link's win 'victory' when a later link is lost (PR-0261).
  - repro: node critic/runner/lib/route.mjs ffx2-ixion-djose win --base=<live>, size 2000x1012 (runs 1 and 2 of this round).
  - evidence: critic/rounds/round-20/evidence/ffx2-ixion-djose-win/run.json (boardWalk, error), critic/rounds/round-20/evidence/logs/ixion-win.log and ixion-win2.log
  - confidence: high
  - requirement: CHK-016 (a failed wait throws and never screenshots the wrong screen; it did throw)
  - fix: Size the ArrowRight loop from boardAtEntry.tiles and derive the step outcome from the results text.
  - acceptance check: All 18 chapters reach their card in one pass; a chain defeat reads 'defeat' in steps.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.

### Suggestion (11)

109. **PR-0299** [audio] PR-0299 (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred
  - game / chapter: both / all
  - expected: RUBRIC s7: an inferred item is asked before it is built.
  - observed: The save migration moves an untouched 0.35 SFX level to 0.70, which cannot tell a deliberate 0.35 from the old default (D-293 marks this half as inferred). A question for Bailey, nothing changed in this build.
  - repro: Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
  - evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
  - confidence: high
  - requirement: RUBRIC s7 inferred items; D-293
  - fix: Ask Bailey whether this is acceptable. No code change unless he says no.
  - acceptance check: D-293's inferred note moves to named, or is reversed by Bailey.
  - status: open, round 20 (cd9dbbb0)
110. **PR-0358** [interface] PR-0358 (new; R20-IF-05, a question for Bailey): the phone advisor line names the menu but not the cost
  - game / chapter: both / I (FFX) and IV (FFX-2), 390x844
  - expected: RUBRIC section 2: the advisor says where an action is and what it costs.
  - observed: Re-observed: the phone advisor line names the menu but not the cost.
  - repro: First menu at 390x844 in Ch I or IV.
  - evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-r2-touch/11-advisor.png; ffx2-bahamut-win-phone-touch/run.json advisorText
  - confidence: medium
  - requirement: RUBRIC section 2
  - fix: Append the MP when it fits on the line; no change if Bailey prefers the shorter tip.
  - acceptance check: Phone tip shows the MP cost for a spell at 390x844 without ellipsis.
  - status: open, round 20 (cd9dbbb0)
111. **PR-0227** [encounter] PR-0227 (carried, STALLED, a question for Bailey): Chapter XIII (Trema) is not won at human pace by real keys, now 0 of 25 across rounds 19-21 (0 of 7 this round)
  - game / chapter: FFX-2 / Ch XIII Trema (Oversoul Paragon link, then Trema)
  - expected: Bailey's decision whether roughly 1 win in 15 tries is the intended difficulty; if yes, the chapter needs its win flow shown by a long human run.
  - observed: Shipped bench (D-151 options 1 and 3, 200 seeds): chapter 13/200 at the human Wait split (6.5 percent), 14/200 bench; Paragon link 28/200, Trema alone 170/200. Real keys this round: seeds 1 and 1001, plus five attempts on seeds 1 to 4001: 7 defeats at link 1. P(0 of 25 | 6.5 percent) is about 0.19, so the real-key record agrees with the shipped bench: the wall is the authored Paragon link, not the route. No victory flow has been shown for four rounds. Merged: the gap pass ran Trema under the labelled autoBattle('intended') hook at fast speed: link 1 won once (phase 2 reached, boss-ffx2-aeon replaces the scene bed at 169 s), then 12 defeats in 13 attempts in 20 minutes, never a win (a bot result, not a human one); the narrative auditor's R21-NARR-01 (the Trema and Den aftermath have no real-flow evidence for the 4th and 3rd round) is a cross-reference, not a separate ticket. Bench: Trema whole chapter 13/200 (6.5 percent) human split.
  - repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/trema-shipped-bench.test.ts; critic/rounds/round-21/logs/ffx2-trema-r2.log
  - evidence: critic/rounds/round-21/evidence/ffx2-trema-win-r2/run.json; ffx2-trema-win/run.json
  - confidence: high on the numbers; the difficulty intent is Bailey's
  - requirement: RUBRIC 6 encounter (correct difficulty); CHK-022 (milestone)
  - fix: Run the RUBRIC 8 method check (route, why it stalled, two alternatives, the smallest test, one choice) and put the difficulty question to Bailey; do not tune boss numbers unasked (boss-side fix needs measured options).
  - acceptance check: Bailey's recorded pick; a real-key victory with its results screen on the live build.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
112. **PR-0306** [encounter] PR-0306 (carried, STALLED, a question for Bailey): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 18 real-key attempts over rounds 20-21 (0 of 7 this round)
  - game / chapter: FFX-2 / Ch XV Den of Woe (Baralai, Gippal, Nooj chain)
  - expected: Real-key wins in the neighbourhood of the shipped bench, or a recorded reason why not.
  - observed: Shipped bench re-run: first try 48/200 at the live Wait split, within 3 tries 127, within 5 tries 162, Active 1.5 s 18/200 (identical to round 20). Real keys this round: seeds 1 and 1001 plus five attempts (1 to 4001): 7 defeats, some with a link won first (the chain ended in defeat each time). Over rounds 20-21: 1 of 18 against 24 percent first try, P(1 or fewer) about 0.05, a mild shortfall that harness pace may explain; no engine change in release 38 (A/B digests 0 of 120 differ). The gap pass completed the Den of Woe victory flow once under the autoBattle('intended') hook (not human-paced, labelled): win on the third link, post-battle scene, Results (Victory, EXP/AP/Gil, NEW BEST, 2:34), Confirm, scene, back on the board. So the flow works and the results screen reads well; strict CHK-022 still wants a human-paced win.
  - repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/den-of-woe-shipped-bench.test.ts; critic/rounds/round-21/logs/ffx2-den-of-woe-r2.log
  - evidence: critic/rounds/round-21/evidence/ffx2-den-of-woe-win-r2/run.json
  - confidence: medium
  - requirement: RUBRIC 6 encounter; CHK-022
  - fix: Method check per RUBRIC 8 (same issue open at the same severity for two reviews); a quiet-host human-paced run to separate harness pace from difficulty.
  - acceptance check: A real-key victory with its results screen, or Bailey's note that the difficulty is intended.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
113. **PR-0217** [combat] PR-0217 (carried): Zombie is kept across a KO (unsourced); the advisor's top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged
  - game / chapter: FFX / Ch I, II
  - expected: A sourced rule.
  - observed: Three-line bench zombie rows unchanged and no status code changed in release 38.
  - repro: ffx-bench.test.ts zombieHealTopRows, zombieReviveTopRows
  - evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
  - confidence: medium
  - requirement: AGENTS rule 6
  - fix: Source or label the rule.
  - acceptance check: Research entry exists.
  - status: open, round 20 (cd9dbbb0)
114. **PR-0352** [prep] PR-0352 (carried, FFX only): Natus ships no item drop although research sources Lv. 2 Key Sphere x2 (x4 on overkill)
  - game / chapter: FFX only / X
  - expected: research/ffx-seymour-natus-highbridge.md line 96: Lv. 2 Key Sphere x2, x4 on overkill.
  - observed: Natus's results panel in round 21 again has no ITEMS row (AP 6,300 x4, GIL 3,500); no Natus data changed in release 38.
  - repro: Read the results text of evidence/seymour-natus-win/run.json.
  - evidence: critic/rounds/round-21/evidence/seymour-natus-win/run.json resultsText
  - confidence: high
  - requirement: AGENTS.md rule 6
  - fix: Add the item record from research/ffx-seymour-natus-highbridge.md line 96, still Bailey's to confirm.
  - acceptance check: Natus results show the sourced Lv. 2 Key Sphere line.
  - status: open, round 20 (cd9dbbb0)
115. **PR-0368** [feel] PR-0368 (new, a question for Bailey; R21-FEEL-03, the builder's own): the FFX-2 run-in makes a plain Attack about 1.2-1.7 s long; is that the rhythm he wants
  - game / chapter: FFX-2 only / Ch V, VI
  - expected: A judgment, not a defect against any source.
  - observed: Rikku's plain Attack at Vegnagun: menu closes 1.2 s, numeral 2.0 s, home by 2.4 s; engine hold to the next event 1,622 and 1,690 ms for Rikku, 598-984 ms for Paine; FFX-2 turn medians moved -0.4 to +1.4 s against round 20 (Fallen Aeons 7.1 to 8.5). The ATB clock keeps running during it in Active.
  - repro: critic/rounds/round-21/evidence/ffx2-vegnagun-shuyin-win/clips/attack-2, ffx2-leblanc-win/clips/attack.
  - evidence: critic/rounds/round-21/feel-narr/veg-attack.jpg
  - confidence: high on the numbers
  - requirement: AGENTS rule 10 (ideas need a yes)
  - fix: None until Bailey answers (D-354 ask 5 leaves the run home, 0.27-0.39 s of it, open). Nothing to build without his yes.
  - acceptance check: Bailey's reaction recorded in the tile.
  - status: open
116. **PR-0262** [narrative] PR-0262 (carried, widened): repeated reactions. '...Okay. Next one.' is the first-choice results quip in five chapters, and 'That's it?' appears in four
  - game / chapter: FFX / results quips I, II, VIII, XVII, XVIII; lines in I, III, VII, VIII
  - expected: No two chapters share a first-choice quip, and at most two use 'That's it?'.
  - observed: src/story/scripts: seymour-flux.ts:236, yunalesca.ts:188, evrae-airship.ts:220, sin-fins-core.ts:138 and sin-face.ts:107 all lead with 'Okay. Next one.'. 'That's it?' is in seymour-flux.ts:185, braskas-final-aeon.ts:346, seymour-anima-macalania.ts:232 and evrae-airship.ts:168. The results of I, II and VIII show it on this build.
  - repro: Win I, II and VIII and read the results quip.
  - evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/seymour-flux-win/run.json
  - confidence: high
  - requirement: narrative: character voice, no repetition across chapters
  - fix: Promote each chapter's second option (for example 'That didn't feel like winning.', 'So what do we do now?', 'We're in. Now it starts.') and reword two of the 'That's it?' lines.
  - acceptance check: First-choice quips are unique per chapter, and at most two chapters use 'That's it?'.
  - status: open (STALLED: method check owed), round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
117. **PR-0297** [target-registry] R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships
  - game / chapter: both / docs/target/targets.json group picks-0929
  - expected: Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
  - observed: All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
  - repro: Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
  - evidence: D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
  - confidence: high
  - requirement: RUBRIC §7 (delivery field, required targets)
  - fix: Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
  - acceptance check: node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
118. **PR-0329** [interface] PR-0329 (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON
  - game / chapter: both / pause > EYE CANDY
  - expected: As adopted in D-317 ("players who had a look off keep the new parts off").
  - observed: A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
  - repro: Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
  - evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
  - confidence: high (behaviour); taste question
  - requirement: D-317; RUBRIC section 7 (inferred items never fail a build)
  - fix: None unless Bailey wants it.
  - acceptance check: Bailey's answer recorded.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.
119. **PR-0338** [harness] PR-0338 (new, test harness): tests/unit/strategy-ffx2-bahamut.test.ts "heal-only route" takes about 10.8 s against the 15 s limit and timed out once on a loaded machine
  - game / chapter: FFX-2 / n/a (unit test)
  - expected: A unit test well inside its time limit.
  - observed: 324-file subset run: 1 failure, a timeout; re-run alone 19/19 pass in 11.8 s.
  - repro: npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts on a loaded host
  - evidence: critic/rounds/round-19b/combat/vitest-combat-subset.txt
  - confidence: high
  - requirement: test reliability
  - fix: Give that case its own timeout or fewer seeds.
  - acceptance check: The case passes inside the subset run under load.
  - status: open, round 20 (cd9dbbb0)
  - round 21 note: Not re-observed in round 21: no auditor held evidence for this state. Carried open from round 20 with its dependency unchecked; a focused re-check owes it.

### Resolved this round
- **FOC37-02** (major): Release 38 (37.1 fix) verified by real input on the live build: Ch VI at 1600x900, 3 presses each: keyboard R 3 hits, PageDown 3, mouse click 3, touch tap 3, pad R1 3, each with exactly 3 damage events (12, 17, 17 as the chain climbs); Enter alone scores 0 hits and the overlay says MASH R, not Enter. Evidence critic/rounds/round-21/evidence/feat/th-ffx2-leblanc-*/run.json; the combat auditor's engine half (th21 matrix) and the interface auditor agree.
- **PR-0311** (major): Rikku Warrior now loads rikku-warrior idle, ready, attack, cast, item and hurt with 0 art 404 and is painted at the Trema first menu; the confirmer wore Yuna Thief live (Ch VI, 1600x900, seed 1, real keys) and she is a painted figure with twin daggers, all yuna-thief keys 200; the live site serves yuna-thief, paine-thief and rikku-warrior idle.webp and idle.json with 200. CAVEAT: Paine Thief was not worn in any run, so its live look is a coverage gap recorded in CHK-012 (UNVERIFIED) and coverage.requiredNotTested, not an open defect.

### Merged, downgraded and refuted
- Merged: PR-0362 <- R21-FEEL-01 (feel auditor) + R21-ON-01 (onboarding auditor) + the capture owner's first-menu cursor-open observation (one root defect: the coach card's Enter also confirms Attack)
- Merged: PR-0363 <- R21-IF-04 (interface auditor, pad Circle resumes and cancels a menu level) + R21-FEEL-02 (feel auditor, pad Circle drops the target cursor)
- Merged: PR-0360 <- R21-CE-01 (combat auditor, plausible) + the gap pass's phone Overdrive failure (one ticket, filed under interface)
- Merged: PR-0334 <- the visual auditor's re-observation in four chapters + the feel auditor's confirmation in 7 of 7 changes
- Merged: PR-0326 <- R20-AUD-01 + the audio auditor's 34 of 39 synth-first runs + the gap pass's 7 of 7 silent title presses
- Merged: PR-0376 <- R21-PD-03 (prep-delivery auditor) + the gap pass's own diagnosis of the same clip21.mjs bug
- Merged: PR-0339 <- the capture owner's harness note (win routes end in defeat); PR-0261 <- the capture owner's stalled-chain-stamped-as-victory note
- Merged: PR-0227 <- the gap pass's Trema phase-2 autoplay result + R21-NARR-01; PR-0306 <- R21-NARR-01 for Den of Woe
- Merged: Multi-id auditor entries split back into their stable ids: PR-0316 / PR-0333, PR-0039 / PR-0260, PR-0298 / PR-0299, PR-0256 / PR-0272, PR-0259 / PR-0240, and the six of the onboarding auditor's carried list (PR-0032, PR-0289, PR-0237, PR-0357, PR-0358, PR-0324)
- Downgraded or held: PR-0308 major -> polish: the Bushido half is fixed and verified by real input (Shooting Star, Dragon Fang, Banishing Blade, Tornado, plus Swordplay params); what stays open (Swordplay tier numbers with no source, the button-order estimate, the Square hint) is polish
- Downgraded or held: PR-0310 major -> polish: Chapter II and VIII staging fixed; Chapter III is staged off by Bailey's pick
- Downgraded or held: PR-0341 major -> polish: not reproduced in any round-21 capture (the round-20 observation was one unconfirmed frame on a loaded host)
- Downgraded or held: PR-0306 and PR-0227 stay suggestions (questions for Bailey) and PR-0353 stays polish; none is raised by the 0-of-25 and 1-of-18 results because the shipped benches (6.5 and 24 percent) make them probable
- Refuted: PR-0311 (residual claim): The visual auditor left "Yuna Thief and Paine Thief not exercised, grey-mannequin question open" at major. The confirmer exercised Yuna Thief live: painted, not a mannequin, 0 art 404. The major is refuted for Yuna Thief; Paine Thief stays UNVERIFIED as a coverage gap.

## What stands between this build and acceptance

A deep review cannot accept a milestone, and the gates read, for this build:
- the weighted score is provisional (audio UNVERIFIED); Bailey's numeric listening verdict (CHK-B1, PR-0148) is the one input no agent can supply;
- six categories are under the 9.0 floor: encounter 8.9, visual 8.9, feel 8.7, interface 8.3, onboarding 8.5, delivery 8.7;
- eight major issues are open (PR-0148, PR-0269, PR-0360, PR-0340, PR-0270, PR-0099, PR-0361, PR-0222); six of them are stalled (open in rounds 20 and 21) and each needs a written method check before another batch (RUBRIC section 8);
- mandatory checks that are FAIL or UNVERIFIED: CHK-001 (title and first UI sounds), CHK-003, CHK-004, CHK-008, CHK-011, CHK-012 (Paine Thief unseen), CHK-015 (touch Overdrive, FFX pause-matrix preconditions), CHK-016 (clips), CHK-022 (Ch XIII and XV victory never seen), CHK-023 (Lady Luck unreachable), CHK-B1;
- Ch XIII Trema and Ch XV Den of Woe have never completed a victory flow through real human-paced input (fourth and third round);
- 19 required targets are unverified and 7 wait on Bailey; only 70 of 89 are matched;
- 15 human judgments are owed;
  Among them: the largest are the listening number, the Trema and Den pace, Lady Luck reachable or dormant, and the Swordplay and Bushido estimates.

## What changed since round 20 (release 38 against release 37)

Fixed and verified this round: the Trigger Happy input (FOC37-02, round 20's HOLD), the Rikku Warrior and Yuna Thief art (PR-0311, with Paine Thief unseen), Chapter II and VIII staging (PR-0310 narrowed to Chapter III), Bushido plays the chosen Overdrive (PR-0308, content half), skill travel and the FFX-2 run-in, the Braska and Flux telegraph holds, the GUIDE'S PICK tag, the title rename and key art, painted wings (with a seam), Evrae E1-H, exact lossless-WebP shipping, the Ch III and FFX-2 Ch IV advisor card.

Not changed or still open: the dressphere push-in was never seen (PR-0314), the white twirl-start rectangle persists in all four chapters checked (PR-0334), the seam hand-back is unchanged (PR-0301), Lady Luck is reachable by no player (PR-0340), the Chapter XVII card is 48.5 percent (PR-0269), TEXT SIZE still skips the FFX-2 HUD (PR-0270), the stand-in music cues (PR-0099) and the missing owner listening number (PR-0148).

New this round: PR-0360 and PR-0361 (the timed Overdrive overlays have no phone path and no key legend), PR-0362 (the coach Enter also confirms Attack), PR-0363 to PR-0374 (pad Circle, run-in crop, hidden Omnis disc, HUD slabs over actors, Evrae ghost frame, three interface polish items, two audio polish items, the run-in rhythm question) and two critic-tooling bugs (PR-0375, PR-0376).

Relayed chat message: The chat message relayed with this task ("republish all artifacts here") was already answered by the orchestrator; it is not part of this review, nothing was republished, and the task here was carried out in full.

## Proposals (nothing here is built without Bailey's yes)

- Phone input for the FFX timed Overdrives (PR-0360, PR-0361): tappable chips for Bushido and a tap target on the Swordplay bar, with the device's key printed under each chip (Q/Shift, Esc, K, Enter; face buttons on a pad). Benefit: a phone player can answer an Overdrive and every player is told the keys. Cost: overlay input plus a seeded test. Fit: FFX only (FFX-2 Trigger Happy already names the device). Risk: tap targets inside a 3.4 s window must be large; start with a mockup of the phone overlay. Nothing is built without Bailey's yes.
- Dressphere shot method check (PR-0314, stalled in 19b, 20 and 21): log which gate (an enemy acting, no clean frame, a menu up) refused each shot in 7 changes, then decide whether the push-in may start at the hand-back after an enemy action or whether an enemy action should queue behind a dressphere shot in Active mode (no Wait-mode change without Bailey). Fit: FFX-2 only.
- Twirl-start key edge (PR-0334): feather or additively blend the first key of the twirl set instead of drawing it as a hard rectangle; the approved art is untouched. Fit: FFX-2 only. Preview: a 1:1 crop of seven twirl starts before and after.
- Lady Luck reachable or dormant (PR-0340, carried from round 20): give Lady Luck a Garment Grid node for its owner where FFX-2 sources it, or record that the reels ship dormant; and time the reels by the press (PR-0349). Fit: FFX-2 only. Risk: the Dud costs about 75 percent party HP; a mockup of one Change to Lady Luck first.
- Swordplay tiers (PR-0308): Bailey's yes to the estimates in ffx-combat-core.md 5.3 (22/16/12/9 percent zone, 1,400/1,150/900/700 ms) makes it a four-row edit; or check the numbers in the Steam HD copy. Fit: FFX only.
- Critic tooling (no product change): fix clip21 (PR-0376), assert each pause-matrix row's precondition and close a stray cursor first (PR-0375), keep battle logs for retry attempts, pass --clips in the phone, pad and lose routes, stamp the post scene only after the screen asserts a cutscene (PR-0261), and run the performance lane alone before the other lanes start.
- Byte headroom: the live artifact is 797,683,098 bytes, 2.3 MB under the 800,000,000-byte line; the next art batch needs the planned Cloudflare Pages move (D-369) or another lossless-WebP pass first.

## Next review

The live build 6461999e still owes the items in coverage.requiredNotTested; critic-clear decides what this report settles (a deep review with required coverage untested and mandatory checks UNVERIFIED settles nothing, as in round 20). Next batch, in order: PR-0360 and PR-0361 (the new majors: a phone and key legend for the timed Overdrives), PR-0362 (the coach Enter, a one-line swallow in the card input), a written method check for the stalled areas before any further attempt (PR-0148, PR-0269, PR-0270, PR-0314, PR-0334, PR-0340, PR-0099, PR-0222), PR-0330 in the remaining five chapters, then a focused review of that candidate with a phone Overdrive capture, a Paine Thief and dressphere push-in capture, a human-paced Trema and Den attempt on an idle host and a throttled-entry lane. Decisions for Bailey: PR-0340 (Lady Luck), CHK-B1 listening number, D-282, PR-0227 and PR-0306 (Trema and Den pace), PR-0308 (Swordplay tiers, Bushido order), PR-0368 (run-in rhythm).

Wall clock of the deep workflow from the capture owner's start (about 13:02 local) to this report; agent minutes reported: capture owner 230, audio 55, combat-encounter 62, feel-narrative 95, interface-onboarding 75, prep-delivery 45, visual-targets 95, gap pass about 75, confirmer about 10. Repeated work avoided: no round-20 frame reused as evidence; the CHK-024 matrix and the audio save half are reused with dependency arguments.

Server hygiene: The chief started no browser and no server. The capture owner stopped its logging process by PID (loadlog21.mjs, 36784) and reports no lane, route, server or Playwright process of round 21 remaining; the auditors report starting none; the gap pass and the confirmer ran headless Playwright from node scripts (PYREFLY_BROWSER=gpu) against the live site and closed their browsers. No process was stopped by this review.

## Settlement (tools/critic-clear.mjs, verbatim)

```text
  still pending focused: mandatory checks are UNVERIFIED: CHK-015, CHK-016, CHK-012, CHK-015, CHK-023, CHK-B1, CHK-015, CHK-022
  still pending deep: required coverage was not tested: FFX-2 Ch XIII Trema and Ch XV Den of Woe: a human-paced win with post-battle scene, results and saved reward (CHK-022; PR-0227, PR-0306, PR-0353), Bailey's numeric listening verdict for the shipped mix (CHK-B1, PR-0148), his play verdict on feel (CHK-B2) and his story read (CHK-B3), FFX-2 Paine Thief dressphere in battle after the twirl (CHK-012) and the D-346 dressphere push-in where no clean close shot exists (PR-0314), FFX-2 Ch IV Bahamut at 2000x1012 and at 390x844 after the coach card is dismissed (PR-0316, PR-0333, PR-0344), FFX Ch IX night-sakura arrival at a hurried opening and the PR-0342 blue-tree check (FOC371-01), Lulu's Fury and a wind-up painting playing; the living pause portraits (blink, smile, press, row-follow), FFX Ch XII first menu at 1600x900 with the four Mortiphasm visibilities; FFX-2 Ch XV 21:9 and the 3x tier (PR-0365), TEXT SIZE at 115 and 130 percent, the CONTROLS tab and the EYE CANDY page (PR-0270, PR-0322, PR-0323); multi-target and all-party target frames, FFX-2 Lady Luck by a human path (PR-0340, unreachable on every shipped grid) and the Swordplay miss path; Spiral Cut on a phone, Prep tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE, DRESSPHERES, ACCESSORIES by real input at three sizes (PR-0292, PR-0295), Throttled cold entry, a weaker GPU and frame time at 2560x1080 and 3840x2160 and across the first dressphere change (PR-0259, PR-0327); real controller, Firefox, Safari, Edge and a physical phone, Audio: victory-cue timing on a slow link, the Ch I scene sting, sound-to-motion sync and the Trema victory cue (CHK-023), Retry attempts 2 and later: battle logs for replay against the engine
```
