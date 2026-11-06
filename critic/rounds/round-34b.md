# Round 34b - re-issue of the deep review of the live build 2342fe666 (release 74, bundle eSs6-WR_); supersedes round 34

```text
Build / artifact / target version: main 2342fe666 / eSs6-WR_ / artifact e0cb661928f6... (critic/artifacts/2342fe666.json, 7,265 files) / targets 1b09ad4e5a03...
Review: deep (live site https://echoesofspira.com/, the deep obligation of releases 73 and 74). Round 34b re-issues round 34 with the stamped 19-chapter continuity aggregate (harness 683a773fead4) and the hidden lane (real-key play of the Keeper and the Maesters).
Deployment: PASS
Changed area: FAIL
Ship: SHIP. No critical defect and no regression against the live predecessor shown by the full harness; the new-feature major PR-0613 and the hidden-chapter minors (PR-0616, PR-0631 to PR-0634) do not hold the build. Discloses: PR-0614, PR-0584, PR-0459, PR-0531, PR-0380, PR-0379, PR-0570, PR-0517, PR-0603, PR-0613, PR-0148, PR-0295, PR-0567
Milestone: not assessed
Quality: PROVISIONAL, no verified score for audio and onboarding; last full score round 33b on 01a767770 (2026-11-02). This round (unchanged from round 34): combat 9.4, encounter 9.2, visual 8.5, feel 7.8, narrative 8.8, interface 7.7, prep 9.0, delivery 8.4
Targets: required 34 / matched 27 / failing 0 / unverified 4 / waiting 3
Top issues: PR-0614 fast-speed jumps of 100 to 407 px; PR-0584/0459/0531 pose-swap size continuity (CHK-026 FAILS in 7 of 19 chapters, round 33b 12); PR-0380/0379 swap jerks and see-through (CHK-027 FAILS in the same 6 chapters as 33b, 35 swap jerks against 54); PR-0603 impossible Chapter XII range; PR-0613 Maesters floor 80; PR-0148 no listening verdict
Coverage: tested = live artifact, 19 chapters by real keys, the continuity harness on all 19 (CHK-026, CHK-027), 4 hidden chapters incl. the Keeper and Maesters mechanics in a page (CHK-023), engines, FFX-2 revive twice; reused = fast-speed focused-run continuity (I, IV, VIII, XVII), 33b pause matrix, prep agency; not tested = a second seed or size, Gooey End in a page, accessibility settings, Bailey's verdicts (owner-only), hardware
Next required review and why: after the next deploy; it must open with the stamped 19-chapter continuity run and the pose-swap method check, and owes a real-key win of the Keeper and of floor 80 (or Bailey's answer on PR-0613)
Elapsed review time / repeated work avoided: round 34 about 150 min, round 34b about 45 min more / 13 carried round-33b readings reused under written arguments, 16 engine outputs proven byte-identical instead of re-derived
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
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-006 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - 13 critical or major issue(s) remain open
  - encounter spectral-keeper has no complete real-input flow
  - encounter ffx2-fallen-maesters has no complete real-input flow
  - 4 required target(s) unverified
  - 3 required target(s) waiting
  - only 27 of 34 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148)
  - human judgment not recorded: Feel: the smooth strike at fast speed, the return pace and the revive cross (CHK-B2); whether a revive rise counts as a jerk (PR-0615, D-420 to D-426)
  - human judgment not recorded: Art: the grade of the treated arenas (Yojimbo, Leblanc, Macalania; PR-0585)
  - human judgment not recorded: Art: whether the Wind Waker Meshy toon models pass the eye that rejected the yrp cast (PR-0618, D-1130)
  - human judgment not recorded: Encounter: is Fallen Maesters floor 80 meant to be winnable with this party, and does the Keeper tip say enough (PR-0613, PR-0622)
  - human judgment not recorded: Interface: show or hide the Mix row while it is off (PR-0619)
  - human judgment not recorded: Audio: keep or change the silent Chapter IV results screen and the quiet cue in the 3D Bahamut (PR-0504)
  - human judgment not recorded: Narrative: portrait expression on grief lines in both games (PR-0485)
report: valid evidence
```

## Verdicts

- **deployment**: PASS. PASS: CHK-017 PASS (verify-live 234 files, 0 mismatched; the live index names index-eSs6-WR_.js; the release live review compared 7,265 files) plus the capture owner's clean runs: 0 console errors, 0 not-found in the 19 listed chapters, 31 runs, 8,070 media requests; the hidden chapters' four missing paintings 404 (PR-0616).
- **changedArea**: FAIL. FAIL: CHK-003, CHK-006, CHK-008, CHK-009, CHK-011, CHK-020 (all carried) and, new in this re-issue, CHK-026 (FAILS in 7 of the 19 chapters: Flux, Yunalesca, Braska, Anima, Fallen Aeons, Trema, Ixion; round 33b 12) and CHK-027 (FAILS in 6: Yunalesca, Braska, Vegnagun, Fallen Aeons, Den of Woe, Sin core; round 33b the same six), plus fast-speed jumps (PR-0614). CHK-023 is PASS now (the hidden Keeper and Maesters mechanics were played by real keys in a page). Gains against 33b: Lulu's rig head repaired (the five chapters that failed CHK-026 on it alone, Evrae, Yojimbo, Sin core, Sin face and the Mirror Aeons, pass), head swaps over tolerance 415 to 16, swap jerks 54 to 35, XVII and XVIII treated with a legible HUD, the revive rise in both games, CHK-021 PASS.
- **milestone**: not assessed. not assessed (deep review of a live build).
- **ship**: SHIP
  - This review judges the live build, so ship answers whether it should stay: no critical defect (crash, lock, lost progress or an encounter that cannot finish) was found in the 19 listed chapters; all 19 were won by real keys with 0 console errors and 0 not-found, loss then retry reached battle in Chapters I and IV, and the exact artifact equals the deploy manifest.
  - No regression against the live predecessor was shown. Round 34b: the full 19-chapter harness (the only full baseline is round 33b, release 72; release 73 has no full-run reading, and the one comparison on record, Chapter III's worst swap jerk, is 222.8 px there and 224.5 px here) shows CHK-026 FAIL in 7 chapters against 12 and CHK-027 FAIL in the same six chapters as before; no chapter passes less than it did; head swaps over tolerance 415 to 16, swap jerks of 40 px or more 54 to 35, see-through 1,831 to 1,720 ms a minute, worst severity 0.381 with 0 swaps over the 0.4 line, 0 teleports, 0 snaps. Four numbers sit a little above 33b and are not regressions: Braska's worst head reading (94.4 to 1,506.1 percent: the projected head under the victory close-up, class camera, with the painting's registered head box unchanged; PR-0584), Fallen Aeons' swap jerks (4, 44.6 px to 5, 48.2 px), Anima's single stance miss (15.1 to 15.7 px) and Braska's feet (14.5 to 14.7 px). Fast-speed jumps (PR-0614) were already on release 73. The one measured worsening, Chapter I frame time (PR-0580), is minor and one occurrence.
  - The two new-feature majors do not hold the build: PR-0613 (Maesters floor 80, no winning line shown, hidden chapter typed behind a word, unproven impossibility) and the hidden chapters' missing paintings (PR-0616) are inside features that did not exist live before release 74.
  - The remaining majors are carried, not new: pose-swap continuity (PR-0584, PR-0459, PR-0531, PR-0380, PR-0379, PR-0570, PR-0517), PR-0603, PR-0148, PR-0295, PR-0567; they are disclosed. CHK-026 and CHK-027 are now recorded from the complete 19-chapter harness (FAIL, which is what the carried majors already said); the evidence gap round 34 filed as PR-0627 is closed.
  - The hidden chapters' new findings (both hidden chapters read over the see-through line, PR-0631; the Keeper's Move does not walk the figure, PR-0632; two label defects, PR-0633 and PR-0634) are minor, sit inside features that did not exist live before release 74, and do not hold the build.

## What changed from round 34 to round 34b

- CHK-026 and CHK-027: UNVERIFIED (the harness was still running) to FAIL and FAIL, from the complete 19-chapter run (11,131.9 s of battle, 10,849 swaps judged, stamped aggregate embedded unchanged in `continuity`). CHK-026 FAILS in 7 chapters (round 33b: 12), CHK-027 in 6 (the same six as 33b). No chapter that passed in 33b fails now.
- CHK-023: UNVERIFIED to PASS. The hidden lane played the Spectral Keeper (9 of 9 mechanics) and the Fallen Maesters (4 of 4) by real keys in a page; the Keeper's live logs equal the engine dry runs event for event. Gooey End stays engine-only and is listed under notTested.
- `coverage.requiredNotTested` is empty. The owner-only items (Bailey's listening and feel verdicts) and the hardware items (WebKit, Firefox, a real phone or controller) are under notTested with their reasons; CHK-001, CHK-B1 and CHK-B2 stay mandatory:false UNVERIFIED (precedent 30b, 32b, 33b).
- Verdicts unchanged: deployment PASS, changedArea FAIL, milestone not assessed, ship SHIP. Category scores and sub-scores unchanged; their evidence text no longer says the harness was unfinished.
- Corrected: round 34's credit "Braska head 94.4 to 58.2 percent" is withdrawn. 58.2 was the focused run's reading of a camera-dependent number; the full run reads 14 head swaps over tolerance (58 in 33b) with a worst of 1,506.1 percent that is the projected head under the victory close-up (class camera; the registered head box is 0.1459 and 0.1458 world units on both paintings). Same swap class as 33b's 94.4, not a regression (PR-0584).
- Issues closed: PR-0627 (the harness finished) and PR-0534 (Lulu's rig head verified repaired: 861 rig-head readings, none over tolerance). Updated with the full-run numbers, severity unchanged: PR-0584, PR-0459, PR-0531, PR-0380, PR-0379, PR-0529, PR-0581, PR-0582, PR-0613, PR-0616, PR-0621. New, all minor and inside the hidden chapters: PR-0631 (the Keeper and Maesters read over the see-through line, severity 0.42), PR-0632 (Move does not walk the figure), PR-0633 (advisor names an idle Circle as the user of Glyph Mine), PR-0634 (shell break leaves the Shell and Protect icons; banner headed by the acting girl).

## CHK-026 and CHK-027 per chapter (the full run, harness 683a773fead4)

| Chapter | Game | CHK-026 | CHK-027 | Head % | Worst swap jerk px | Stature min | Ghost ms/min | p99 ms |
|---|---|---|---|---|---|---|---|---|
| seymour-flux | ffx | FAIL | PASS | 10.8 | 37.8 | 0.766 | 469 | 41.2 |
| yunalesca | ffx | FAIL | FAIL | 10.7 | 103.7 | 0.781 | 5014 | 41.3 |
| braskas-final-aeon | ffx | FAIL | FAIL | 1506.1 | 224.5 | 0.732 | 1408 | 30.6 |
| ffx2-bahamut | ffx2 | PASS | PASS | 0.7 | 0 | 0.898 | 579 | 44.1 |
| ffx2-vegnagun-shuyin | ffx2 | PASS | FAIL | 9.4 | 201.6 | 0.876 | 749 | 29.1 |
| ffx2-leblanc | ffx2 | PASS | PASS | 28.8 | 28.9 | 0.769 | 1639 | 37.8 |
| seymour-anima-macalania | ffx | FAIL | PASS | 22.1 | 0 | 0.787 | 1031 | 25.2 |
| evrae-airship | ffx | PASS | PASS | 0.1 | 0 | 0.785 | 1532 | 25.3 |
| yojimbo-cavern | ffx | PASS | PASS | 4.9 | 0 | 0.809 | 635 | 20.5 |
| seymour-natus | ffx | PASS | PASS | 13.5 | 0 | 0.781 | 1544 | 23.9 |
| ffx2-fallen-aeons | ffx2 | FAIL | FAIL | 15.6 | 48.2 | 0.767 | 1136 | 29.6 |
| seymour-omnis | ffx | PASS | PASS | 8.7 | 30 | 0.781 | 1390 | 25.2 |
| ffx2-trema | ffx2 | FAIL | PASS | 2.5 | 28.4 | 0.895 | 2701 | 89.7 |
| isaaru-via-purifico | ffx | PASS | PASS | 22 | 26.3 | 0.801 | 463 | 20.1 |
| ffx2-den-of-woe | ffx2 | PASS | FAIL | 2.8 | 169.8 | 0.872 | 1057 | 22.9 |
| ffx2-ixion-djose | ffx2 | FAIL | PASS | 18.9 | 0 | 0.876 | 4757 | 27.6 |
| sin-fins-core | ffx | PASS | FAIL | 6.1 | 172 | 0.779 | 1464 | 23.8 |
| sin-face | ffx | PASS | PASS | 3.6 | 0 | 0.9 | 2718 | 23.2 |
| mirror-aeons | ffx | PASS | PASS | 7.9 | 29.9 | 0.809 | 1258 | 29.3 |

Hidden chapters (the same harness; informational, the checks are scoped to the 19 listed chapters):

| Chapter | CHK-026 | CHK-027 | Note |
|---|---|---|---|
| spectral-keeper | UNVERIFIED by the dedicated harness (54.3, 52 and 41.8 s, under 60 s); PASS on the probe of the live job (176.5 s) | UNVERIFIED by the dedicated harness; FAIL on the probe (69 of 232 swaps with a double image of severity up to 0.423) | head 0.1 percent, feet 0.7 px, 0 swap jerks, 0 snaps |
| ffx2-fallen-maesters | PASS | FAIL (45 of 119 swaps with a double image of severity 0.4 or more, worst 0.426) | 94.8 s, head 0.1 percent, feet 0.7 px, 1 swap jerk of 33.3 px, 0 snaps |
| exp-yrp-3d | NOT APPLICABLE (3D rigs; the rig read is PASS) | PASS | 330.2 s, no one-frame jump over 100 px, worst dash 81.1 px |
| exp-windwaker | NOT APPLICABLE (3D models) | harness UNVERIFIED (its probe saw no battle); a frame-difference read of the autoBattle fight is PASS | 45.9 s at 60 fps, no one-frame jump over 100 px, worst 41.3 px |

### CHK-026 in full

FAIL. The continuity harness (harness 683a773fead4, release tree D:/pyrefly-release55 at fc3326153, live URL, GPU, seed 1, 1600x900, pose table b8cead6d) read ALL 19 listed chapters fresh on this build in one run (11,131.9 s of battle, 10,849 swaps judged, finished 02:16 EST); the stamped aggregate is embedded unchanged. FAIL in 7 chapters: Seymour Flux (2 Auron head swaps, worst 10.8 percent, 9.4 where registered; 1 height-band miss, stature 0.766), Yunalesca (37 silhouette-stance misses, worst 13.3 px: 33 of them the boss idle to hurt and back, 4 Shiva), Braska (14 head swaps over tolerance, worst 1,506.1 percent; 8 feet moves, worst 14.7 px; 21 height-band misses, stature 0.732 to 1.479; 16 stance misses up to 247.2 px), Anima (1 stance miss, the boss idle to KO, 15.7 px), Fallen Aeons (4 stance misses up to 18.1 px: 3 X-2 Shiva idle to attack, 1 Anima hurt to KO), Trema (16 Paragon feet moves, worst 10.4 px) and Ixion (1 height-band miss, Yuna idle to hurt). PASS in 12: Bahamut, Vegnagun, Leblanc, Evrae, Yojimbo, Natus, Omnis, Isaaru, Den of Woe, Sin core, Sin face and the Mirror Aeons. Totals against round 33b (release 72): 16 head swaps over tolerance (415), 24 feet moves over 2 px (24), 23 height-band misses (23), 58 stance misses (59). The drop in heads is Lulu's rig head repaired (release 74 RigHeadHold): 861 swaps read from a rig's own head mesh, none over tolerance (worst 0.7 percent); Evrae, Yojimbo, Sin core, Sin face and the Mirror Aeons, which failed on her head alone in 33b, now pass. No chapter that passed in 33b fails now. The one number larger than in 33b is Braska's worst head reading (94.4 to 1,506.1 percent): it is Tidus critical to victory at the end of the fight (swap 1673, projected head 2,144 px to 34,437 px) where the registered head box is the same on both paintings (0.1459 and 0.1458 world units, class camera): the victory close-up moving at the swap, not a painting change; the page kept no strip for that swap, so it is read from the numbers and not from a picture (PR-0584). HIDDEN CHAPTERS (new in release 74, same harness; informational because the check is scoped to the 19 listed chapters): Fallen Maesters PASS (94.8 s of battle, head 0.1 percent, feet 0.7 px, stature 0.898 to 1.151); Spectral Keeper UNVERIFIED by the dedicated harness (its three routes ended under the 60 s minimum: 54.3, 52 and 41.8 s) and PASS on the probe attached to the live job (176.5 s, head 0.1 percent, feet 0.7 px, stature 0.781 to 1.057); the 3D Bahamut and the Wind Waker are rigs, not pose swaps (NOT APPLICABLE; the harness's rig read of the Bahamut is PASS, head 0.6 percent, feet 0 px).

### CHK-027 in full

FAIL. The same full run, 19 of 19 chapters. FAIL in 6, the same six as in round 33b: Yunalesca (4 swap jerks of 40 px or more, worst 103.7 px; 33b: 21, 153.5), Braska (8, worst 224.5 px; 9, 232.6), Vegnagun (5, 201.6 px, the tail; 5, 202.9), Fallen Aeons (5, 48.2 px; 4, 44.6), Den of Woe (7, 169.8 px, Rikku; 7, 169.4) and Sin core (6, 172.0 px; 8, 255.2). PASS in 13: Flux, Bahamut, Leblanc, Anima, Evrae, Yojimbo, Natus, Omnis, Trema, Isaaru, Ixion, Sin face and the Mirror Aeons. Totals: 35 swap jerks (33b: 54; 32b: 34), 0 mid-move teleports, snaps 0.00 a minute in every chapter (the 0.25 cap is not reached), see-through 1,720 ms a minute (1,831), worst severity 0.381 under the 0.4 line with 0 swaps over it; 176 mid-move dashes of 40 px or more are reported, not gated (189; worst 270.8 px, Chapter I); frame times 56 to 59.9 fps, p99 20.1 to 89.7 ms (Trema). Chapter II is the one that moved most: 21 swap jerks to 4. At FAST speed (reused from the focused review, same artifact and harness id): a 407.3 px teleport in Chapter I, 27 hops over 100 px in IV (worst 289.5), 389.2 px in VIII, 5 hops in XVII (worst 275.5) (PR-0614). HIDDEN CHAPTERS (informational; the check is scoped to the 19 listed chapters): Fallen Maesters FAIL on the see-through line (45 of 119 swaps show a double image of severity 0.4 or more, worst 0.426; 1 swap jerk of 33.3 px; 0 snaps); Spectral Keeper UNVERIFIED by the dedicated harness (under 60 s of battle in three routes) and FAIL on the probe attached to the live job (69 of 232 swaps, worst 0.423; 0 swap jerks; 0 snaps); 3D Bahamut PASS (rig probe, 330.2 s, no one-frame jump over 100 px, worst dash 81.1 px); Wind Waker: the harness is UNVERIFIED (its probe saw no battle: 0 figures over 14,742 frames) and a frame-difference read of the autoBattle fight (not the harness) is PASS (45.9 s at 60 fps, no one-frame jump over 100 px, worst 41.3 px, Paine's steady run). PR-0631 files the hidden chapters' see-through.

### CHK-023 in full

PASS in round 34b. Round 34 had shown in a page the shared CTB clock in all 14 FFX runs (streams equal round 33), the Keeper's Attack All and Berserk Tail from real keys, the Black Elemental's Berserk and Aranea, Concherer's Gunk and Megaton Press, the FFX-2 revive and the battle music routing and phone warm gate, and had left the rest UNVERIFIED. The hidden lane then played both hidden chapters by real key presses (headless Chromium on the GPU, 1600x900; the engine, the battle log and the three.js scene were only READ through window.__pyrefly; the one engine write was a labelled debug setup after the shell break had been read). SPECTRAL KEEPER (FFX only; seed 1, 24 decisions, 307 events, and seed 2, 7 decisions, 131 events; both ended in a defeat, no win): 9 of 9 mechanics PASS: the typed word reached party prep with no card and seven violet floor rings were read from the scene (0xc8a0ff, opacity 0.62); the menu (Tidus: Move, Attack, Special, White Magic, Items, Flee greyed; Auron's Guard and Sentinel greyed); five Moves by real keys (Tidus 1 to 5, Yuna 2 to 4, Auron 3 to 6, Tidus 5 to 2, Auron 6 to 3), each an action-start move at spectral-circle-N, a platform event, the banner and plat.at.<id> equal to N, the cursor on the Circle with the plate TARGET Glyph N; 11 of 11 Attack All sweeps (and 3 of 3 in the aeon run) named exactly the living members in the zone; the hit counter equal to the model at 31 of 31 menus (lays at counts 5 and 4); mine arming (glyphs 3+4, then 4+6, "Glyph N flares" twice each, rings amber 0xffa23a at 0.95 while armed and violet after, Glyph tiles on the turn list); Glyph 4 blasted Yuna twice (63 and 24 ticks after its lay), glyphs 3 and 6 fizzled (69 and 70 ticks; Auron had stepped off 6), all within the base-84 estimate; aeon mode (Bahamut out: only keeper-aeon-attack, 3 times, no sweep, no tail; they came back after he fell); aeon counter (1 to 4 at the lay) and one mine on the rock, whose Circle blasted Bahamut 40 ticks later. FALLEN MAESTERS (FFX-2 only; run maesters-walk-s1d, replicated by s1c): 4 of 4 PASS: four floors in order by the game's own seams (Aranea, Black Elemental, Concherer, Chac; engine seeds 1 to 4; the pause screen reads BATTLE 1 OF 4 to 4 OF 4); Paine's walk by four real Change rows (Warrior, Gunner, Thief, Dark Knight through the blue, yellow, green and red gates); the shell break (results 6,688, 6,539, 6,290, then Charon 21,420; the message once; the banner CONCHERER'S SHELL BREAKS! on screen; DEF and MDEF 122 to 1; only Attack afterwards); Chac's floor reached (Stony Glare petrified Paine, Chac's Attack destroyed her, Heaven's Cataract put ten stat-downs on Yuna and Rikku; a plain line lost there in 4:19 and 4:52). Still engine-only, and listed under notTested: Gooey End (Aranea fell in two Attacks, before her fifth poll), the Black Elemental's Reflect (data only, PR-0624) and the live-game questions the repo engine cannot answer (the fuse base).

## The ten categories

### combat - 9.4

Combat auditor (engines and seeded probes, no browser; tree HEAD fc3326153 equals 2342fe666 for src, tests, research). The one shared changed path is the FFX CTB advanceClock (idle-Circle hooks for the hidden Keeper): inert without a Circle, shown by re-running 16 round-33 probe outputs, which are byte-identical (kernel 478 and 68 checks, 0 mismatches), and seven FFX CTB event streams equal to round 33 for their whole length (five more diverge at the same index as round 33 after a player-timed Overdrive). Unit suite 30,285 tests: 30,147 passed, 120 skipped by env gates, 17 failed in three tooling files that fail only because the harness set TEMP inside the repo (same 17 as round 33; with TEMP outside the repo 64 of 64 pass); 0 real failures. Spectral Keeper (FFX only) data equal to research/re-ffx-spectral-keeper.md; 600 fuzzed fights, 0 invariant violations; 1,266 mine lays measured (fuse base 84 is the driver estimate). Fallen Maesters (FFX-2 only) data and AI scripts equal to research/re-ffx2-fallen-maesters.md; floors 20/40/60 winnable, floor 80 no winning line shown (PR-0613). Real runtime: 0 non-finite amounts. ROUND 34B: the Keeper's Move, its mines (lay, blast, fizzle), counter and aeon mode and the Maesters' Paine walk, shell break and Chac were played by real keys in a page and the live logs equal the engine dry runs event for event (307 and 131 events; CHK-023 PASS); Gooey End stays engine-only. Score unchanged. Held back from higher: Gooey End and the Black Elemental's Reflect not shown in a page; Items-list touch path (PR-0483), Chapter III links 3 to 6 in a browser (PR-0460), 2560x1440 crash unproven (PR-0565). Unchanged from round 33b.

### encounter - 9.2

Encounter auditor (no browser). The 19 listed chapters are untouched in data, AI scripts and rewards, and all engine benches re-ran byte-identical, so the win rates are the round 29 to 33 numbers re-measured on this tree: FFX 200 seeds Flux 200, Yunalesca 180, Braska 197, Anima 189, Evrae 194, Yojimbo 196, Natus 190, Omnis 174, Via Purifico 180, Sin core 178, Sin face 200, Mirror Aeons 148; FFX-2 100 seeds Bahamut 100, Vegnagun 99, Leblanc 100, Fallen Aeons 100, Trema 71, Den of Woe 100, Ixion 100. Credible wrong lines lose (attack-only 0/40 in 12 of 12 FFX chapters). All 19 chapters were won from the title by real keys (Mirror Aeons needed the 50-minute budget again). New hidden chapters (outside the 19 and the milestone): Spectral Keeper is hard (attack-only 0/200, random 0/200, aeon+dodge+heal bot 7/200) and its human-paced difficulty is unmeasured (PR-0622); Fallen Maesters floors 20/40 easy, floor 60 needs Paine's limit break, floor 80 has no demonstrated winning line (PR-0613). Nothing was tuned and no boss number is disputed. Held back from higher: Trema about 60 percent at human pace (PR-0227), Mirror Aeons 74 percent and about 20 minutes (PR-0592), Omnis 87 percent, Den of Woe 95 percent at human pace, the Last Summoning attack-only 60 of 60. Unchanged from round 33b.

### visual - 8.5

ROUND 34B (re-issue with the full 19-chapter harness; the score is unchanged). Visual auditor, build 2342fe666 / eSs6-WR_ live: 23 midfight frames (19 listed plus four hidden chapters), first menus, 31 in-game target composites plus the Wind Waker one. Approved art intact: verify-approved at ROOT=D:/pyrefly-release55 917 ok, 0 mismatched, 0 missing (run without ROOT it reads the main tree and shows a false 19 and 47: a tool default, not a defect). CREDITS against round 33b: Lulu's rig head repaired in all 19 chapters (Evrae, Yojimbo, Sin core, Sin face and the Mirror Aeons failed CHK-026 on her head alone in 33b and pass now); head swaps over tolerance 415 to 16 and Braska's 58 to 14 (its single worst reading, 1,506.1 percent, is the camera at the victory close-up, PR-0584); Sin XVII fins and core and XVIII face are treated and read as one painted whale and one dragon head with a legible held HUD matching the approved first-menu tile; every listed first menu shows its boss and a painted portrait per chip; facing correct in all 23 frames; FFX-2 revive cross measured smooth. DEBITS: CHK-026 still FAILS in 7 of the 19 chapters (round 33b: 12): Flux (Auron head 10.8 percent), Yunalesca (37 stance misses, worst 13.3 px), Braska (14 head swaps, 8 feet moves, 21 height-band misses, 16 stance misses), Anima (1 stance miss), Fallen Aeons (4), Trema (16 Paragon feet moves, 10.4 px) and Ixion (1 height-band miss); Braska and Flux midfight frames hide or shrink the boss (CHK-011, carried); Yojimbo/Leblanc/Macalania arenas read darker than the approved tiles (PR-0585, Bailey's call); Sin face hit flash blows the left third to white (PR-0617). Hidden chapters are new, not scored against the 19-chapter milestone; Keeper and Maesters fiends are disclosed stand-ins. characterModels and animation stay at most 7.0 while CHK-026 fails (RUBRIC 6a). 8.5 against 8.4 in round 33b.

### feel - 7.8

ROUND 34B (re-issue): the continuity harness read all 19 listed chapters fresh on this build and the four hidden chapters separately; the score is unchanged. Real-key play of all 19 listed chapters plus the hidden Keeper, Infinito, 3D Bahamut and Wind Waker, GPU headless Chromium, seed 1; 0 console errors on the 19. Esc opens the pause over the pre-scene and a held Enter skips it in 23 of 23 runs. 135 timed sequences: battle entry 2.6 to 3.7 s at steady steps, command and action sequences 2.2 s, chain seams 2.5 to 2.9 s; the one exception is Mirror Aeons seam 1 to 2 with a 1.4 to 1.5 s gap in both runs (PR-0566). Revive: the FFX revive now reads as a rise (c17-N strip 1134) and the FFX-2 half was read in a page for the first time (183 ms crossfade, then 0.5 s rotating from -76 degrees to upright; a second real-key read in Chapter X had the key-to-rise at about 1.3 to 1.7 s). FULL RUN (harness 683a773fead4, 19 of 19 chapters, 11,131.9 s of battle, 10,849 swaps): snaps 0.00 a minute in every chapter (the 7.5 animation cap does not bind); CHK-027 FAILS in six chapters, the same six as in 33b (Yunalesca 4 swap jerks of 40 px or more, worst 103.7 px against 153.5; Braska 8, 224.5; Den of Woe 7, 169.8; Vegnagun 5, 201.6; Sin core 6, 172.0 against 255.2; Fallen Aeons 5, 48.2): 35 swap jerks against 54, 0 teleports, see-through 1,720 ms a minute against 1,831 with a worst severity of 0.381 and 0 swaps over the 0.4 line; the hidden Keeper and Maesters do read over it (0.42, PR-0631). AT FAST SPEED (the focused review's read of Chapters I, IV, VIII, XVII, same artifact and harness id, reused) it is clearly worse than at normal (PR-0614, the new feel defect of releases 73 and 74). Chapter I fresh: CHK-026 FAIL, CHK-027 PASS, worst swap jerk 37.8 px, p99 41.2 ms. Not measured: Bailey's feel verdict (CHK-B2), frame-level seam timing. Held at 7.8, 0.1 below 33b: the revive rise is a gain, offset by fast-speed jumps; the full run supplies the measurement that was missing in round 34 and shows no regression. Animation sub-score capped at 7.0 while CHK-026 FAILS (it does, RUBRIC 6a).

### narrative - 8.8

Text judgement REUSED from rounds 33 and 32 (8.8): git diff 01a767770..2342fe666 over src/story, research/writing-bible.md and src/data/encounters.ts adds only two hidden scripts and registers four hidden chapters; no line of any listed chapter changed; only PR-0485 is related and open. FRESH: all 19 listed chapters were played by keyboard to results and their aftermath read from the DOM timeline (every one reaches results, CONFIRM, the post scene and chapter select; losses reach the defeat card and RETRY in Chapters I and IV). Hidden Keeper and Infinito scripts are original and in the bible voices; the Wind Waker chapter reads in tone. The aftermath of Keeper and Infinito was NOT read (both fights lost by the generic route; PR-0621). Held under 9.0 by PR-0485 (portrait expression never follows the line), no recorded human judgement on the grief lines, and no phone reading of the Chapter I scenes (PR-0483).

### audio - UNVERIFIED (no number)

UNVERIFIED, no number: no agent can hear and there is no numeric owner listening verdict for this mix (only "I like all the music 7/10", D-804, music only, before the SFX, voice and sound passes; docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; D-1371: it cannot be delegated). Technical half re-run on 2342fe666: qa --strict exit 0 (43 cues, 0 findings, -16.21 to -16.01 LUFS, worst true peak -1.48 dBTP, loop seams 43 of 43), 319 mp3 decode with 0 errors, 300 of 300 audio files on echoesofspira.com sha256-equal to the manifest and byte-identical to round 33, themes-audit exit 0, 103 of 104 audio vitest files pass (the failure is a Windows lock-file EPERM that passes 25 of 25 in isolation). Routing from 209 snapshots in 31 runs: 285 of 285 cached tracks prerendered, 0 audio 404s, cue timelines equal to round 33. One technical regression in prevalence: the first UI sounds of a fresh session fall back to the procedural synth in 22 of 31 runs against 1 of 28 in round 33 (PR-0514). Not evidenced: sound-pass loudness in the treated chapters (PR-0588), a dense last-blow-to-results timeline (PR-0532), the Keeper and Maesters victory cue, and Bailey's ears (PR-0148).

### interface - 7.7

PROVISIONAL. Interface auditor, evidence read only (about 75 frames at 1600x900, 2000x1012 and 390x844 touch, plus the machine-read data of 31 runs and 2,482 picks). WORKS: 0 target mismatches in 2,482 picks; 27 of 27 target steps cancel to the same menu with 0 leftover targets; 0 stale roots; advisor text 14.2 px desktop and 15 px phone minimum with 0 coach overlaps; the new Chapter XVII F1 HUD draws the Fin plate clear of the turn strip; the Chapter XII target flag is clear of the Sensor card at the one production stop captured. PROBLEMS: PR-0603 (major, still prints TIDUS 4,132-2,333), PR-0586 (selected row cut, third review), PR-0604, PR-0540, PR-0516, PR-0502, PR-0598, PR-0543, PR-0541, PR-0518, PR-0295 re-observed unchanged; new: a greyed MIX NOT BUILT row in the hidden Maesters (PR-0619), the hidden 3D chapters' HUD over the boss (PR-0618), the Darkness chip hiding its HP cost (PR-0625). NOT MEASURED: no DOM text-floor sweep, no six-size or phone matrix, no wide or 4K shape, no TEXT SIZE 115/130 frame of Chapter XVII, no Chapter XII 29-stop flag walk on production. Moves 7.8 to 7.7 (no gain on the stalled set, two small defects in new features, coverage lower than 33b).

### onboarding - UNVERIFIED (no number)

UNVERIFIED, no number, for the ninth review running. The newcomer walkthrough is SIMULATED (scripted real-input runs from a fresh profile; no human newcomer, real phone or controller). Seen: the title strip, Auron's skippable briefing teaching CTB versus ATB, the three-step board and party-prep guides, the first-turn coach marks (0 overlaps), the FFX-2 ACTIVE/WAIT option flipped by real input. The route again never opens ACCESSIBILITY, CONTROLS or MUSIC and sets no TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS or COLOUR VISION (PR-0597), so text scale, non-colour cues, motion and flash accommodations and remapping are unjudged; release 74's Chapter XVII Fin-plate rules for TEXT SIZE 115 show in no production frame. Re-observed: phone pause hides ACCESSIBILITY behind a cut tab strip (PR-0518), phone prep tab strip cut at ACCES (PR-0295), VISUAL STYLE and PRESENTATION unexplained (PR-0508), key remapping not built (PR-0596, a question for Bailey). Never averaged away; blocks any milestone claim.

### prep - 9

Prep auditor. PROVED fresh: results and rewards of 18 of 18 listed-chapter runs are text-identical to round 33 after stripping the clock (sourced AP, gil, items, EXP); the hidden 3D Bahamut and Wind Waker cards carry sourced values; progress is reliable (22 of 22 victory runs keep the clear after a real reload; hidden wins write no progress, board stays 0 OF 19 BEATEN); retry is fast and read on a desktop in both games (Keeper defeat card to party prep in 7.8 s, Maesters card to the next fight in 5.8 to 6.1 s on four retries; phone Chapter I defeat to prep in 7.2 s). REUSED (no prep file changed 01a767770..2342fe666): prep agency (Sphere Grid, Overdrive equip, FFX-2 read-only tabs). Weaknesses carried: phone prep strip cut and the guide card over the objectives (PR-0295, PR-0518, PR-0602), PR-0594, PR-0555, PR-0557, Chapter IV desktop lose-then-retry not read (PR-0587, PR-0612). 9.0, up 0.1 because the desktop retry-with-frames gap is now read in both games; agency is a second-hop reuse.

### delivery - 8.4

Delivery auditor. PROVED: exact artifact (verify-live against critic/artifacts/2342fe666.json: PASS, 234 files compared, 0 mismatched; the live review already compared all 7,265 files); 19 of 19 listed chapters won by real input from the title with the clear kept after reload; 0 console errors, 0 not-found and 0 html-as-image in all 19 listed chapters (31 runs, 8,070 media requests); the only errors are the hidden chapters' missing paintings (PR-0616). Live title payload 20 files, 3.18 MB, 0 non-200, TTFB 0.12 to 0.14 s. Media: art-derive audit and verify PASS (5,404 masters, 0 problems), manifest decode of 7,266 files, yrp-models-verify and ww-models verify PASS. MEASURED WEAKNESS: frame times read in one chapter only: Chapter I dedicated run 57.4 fps, p99 41.2 ms, one 4,695 ms frame at the first Yuna cast, against p99 35.9 (round 33) and 32.5 (round 32): a three-build worsening in the same chapter (PR-0580). Round 34b: the full harness read frame times in all 19 chapters (56 to 59.9 fps, p99 20.1 to 89.7 ms, the worst Trema, PR-0544; 0.9 percent of frames over 34 ms); the phone entry cut (PR-0567) was not measured on a phone profile; Chromium only (PR-0563, PR-0564). 8.4, 0.1 under round 33 for the frame-time trend and the hidden chapters' 404s.

## Visual sub-scores (not part of the weighted score)

characterModels 7, enemyModels 7.9, animation 6.9, fidelity 8.5, camera 7.4. Bailey's five visual sub-scores (provisional; not part of the weighted score). Round 34b: CHK-026 is recorded FAIL from the full 19-chapter run, so characterModels and animation are capped at 7.0 (RUBRIC 6a) and sit at 7 and 6.9; snaps are 0.00 a minute in every chapter, so the 7.5 snap cap does not bind. characterModels at its cap (Lulu's head repaired everywhere, but seven chapters still fail CHK-026); enemyModels 7.9 (Sin fins and face treated and legible; Keeper and Maesters stand-ins are hidden-chapter); animation 6.9, 0.1 down for the fast-speed jumps (PR-0614) against the revive rise gain; fidelity 8.5 (Sin treated, Yojimbo arena still dark, PR-0585); camera 7.4 unchanged (fan lens: five close-to-wide cuts, PR-0521).

Continuity: The aggregate in "continuity" is the stamped summary of the FULL 19-chapter run (critic/rounds/round-34/continuity/continuity-summary.json: live URL, GPU, seed 1, 1600x900, 11,131.9 s of battle, finished 02:16 EST), embedded unchanged by node tools/continuity-id.mjs --embed; harness 683a773fead4 equals the release tree's (checked with --check before the embed and by critic-score and critic-clear after it). It replaces round 34's record of two finished chapters (Seymour Flux and Yunalesca, whose readings it contains unchanged) and its UNVERIFIED verdicts; the reused focused-run readings of Chapters III, IV, VIII, XII and XVII are no longer used as evidence for the check (Chapter III: 14 head swaps and a worst swap jerk of 224.5 px here, 7 jerks and 226.3 px there). The four hidden chapters were read by the same harness in critic/rounds/round-34/hidden/continuity (their numbers are in CHK-026 and CHK-027 and are informational: the checks are scoped to the 19 listed chapters).

Server hygiene: This re-issue started no dev server, preview server or browser and left nothing running. The continuity harness (node pid 59260) had exited at 02:16:53 EST before the hidden lane ran any browser job; each hidden job took D:/Tools/pyrefly-scratch/RIG-RECORD per job.

## Target gate

Required 34, matched 27, failing 0, unverified 4, waiting on a decision 3. Visual auditor's counts from critic/rounds/round-34/targets (31 in-game composites plus the Wind Waker one). The four unverified and three waiting are surfaces with no tile or no settled frame; none fails. Not captured for lack of a free browser: the all-party spell frame, the Fallen Aeons Magus frame, the Sin face mouth-open frame, yrp frame A (no src in the repo).

## Checks

| Check | Result | Mandatory | Why |
|---|---|---|---|
| CHK-001 | UNVERIFIED | no | Needs Bailey's own listening verdict (AGENTS.md rule 13); no agent can hear. Filed mandatory:false UNVERIFIED by instruction (precedent 30b, 32b, 33b; decision 212l). The technical half PASSED: qa --strict exit 0, 319 mp3 decode, 300 of 300 live audio files equal; item 3 (nothing falls back to synth) is partly met: music 285 of 285 prerendered, but UI sounds fall back to synth in 22 of 31 runs (PR-0514). |
| CHK-B1 | UNVERIFIED | no | Bailey's numeric listening verdict on the shipped mix does not exist (only D-804 music 7/10, 2026-10-13; D-1371 says it cannot be delegated). Filed mandatory:false UNVERIFIED by instruction. |
| CHK-B2 | UNVERIFIED | no | Bailey's feel verdict on the smooth strike at fast speed, the return pace and the revive cross is not recorded; it is owed on his next session with the fast-speed Chapter IV and I strips. |
| CHK-002 | PASS | no | Full-bleed pause plate and no bars in the 1600x900 and 2000x1012 frames; a real tap on the phone PAUSE chip opens the pause in Chapter I and Chapter IV at 390x844 (gap pass). |
| CHK-003 | FAIL | yes | The selected F1 row's own label or hint is cut: Isaaru (XIV) "SPECI..." and Braska (III) TALK "A one-off action this..." (PR-0586, third review, stalled). The numeric floor is only partly measured (advisor rows 14.2 px desktop, 15 px phone, 0 coach overlaps); no element-level sweep for Chapters XII and XVII or the hidden chapters, so those parts are UNVERIFIED. |
| CHK-004 | UNVERIFIED | no | 0 target and 0 label mismatches in 2,450 desktop and touch-win picks; still open: Evrae turns 68 to 80 want Potion for a full-HP Kimahri and play Al Bhed Potion (PR-0605), no frame of the chip at turn 68, so a legal-but-useless chip cannot be separated from a harness mapping; the Darkness chip omits its HP cost (PR-0625). |
| CHK-005 | PASS | no | Chapter I with Kimahri KO proposes Mega Phoenix with the Lance of Atrophy warning; Chapter IV with Yuna cursed shows the Holy Water/Esuna/Remedy advice; Chapter XII advises the switch; the FFX-2 revive board offers legal items. |
| CHK-006 | FAIL | yes | Target reticle/flag cancels to the same menu with 0 leftover targets in 27 of 27 runs and retry clears the old intent (Chapter I phone, Keeper, Maesters). One stale state remains: the key prompt strip is missing from link 2 onwards of the F1 chains (Braska link 4, Leblanc link 2; PR-0598). |
| CHK-007 | FAIL | no | 0 hits for section signs, ids, TODO, placeholder or debug in captured card text, but the hidden Fallen Maesters command list prints a greyed "MIX NOT BUILT" row (src/battle/ffx2/constants.ts MIX_PICKER_REASON; PR-0619). |
| CHK-008 | FAIL | yes | Polish-level overlaps, carried: Omnis F1 guide/hide/intent/coach cards stack over the boss and legs; Yunalesca behind Auron and the HP plates; Sin core guide card and move column over sky and whale; Maesters figures stack at centre with the damage numeral; the hidden 3D chapters' guide and command rows over the model (PR-0618). No panel covers a face or a command; none new except in hidden chapters. |
| CHK-009 | FAIL | yes | Names of enemies, allies and abilities are whole in every frame read; the selected F1 row's text is cut on Isaaru and Braska at 1600x900 (PR-0586) and on the phone the CHANGE tiles clip "UNNER" and "GRANTS: BLU" (PR-0518). |
| CHK-010 | PASS | no | Every target frame shows the pointing hand (FFX) or lotus ring (FFX-2), a TARGET flag naming the target with its damage type, dimmed party rows; on the phone a labelled confirm button with BACK. The release 74 claims (Chapter XII steer over the whole cursor walk; Chapter XVII fins HUD at TEXT SIZE 115) rest on one production stop and are not claimed closed (R72-1 stays open). |
| CHK-011 | FAIL | yes | Carried from round 33 (PR-0583): Braska's midfight frame shows only the aeon's shoulder and head; Chapter I Seymour is small and dim behind the flare; Yunalesca is small behind the HP plates. The bosses are targetable and visible in the target frames, so the default midfight framing is the defect. (Visual auditor's reading; the confirmation pass could not reproduce it independently.) |
| CHK-012 | PASS | yes | No fallback monogram or letter tile in any midfight frame, first menu or turn strip: every chip is a painted portrait. The hidden Keeper (cloak silhouette) and Maesters fiends (stand-ins) are disclosed, not part of the milestone set; recorded so it is not read as a pass for them. |
| CHK-013 | PASS | yes | verify-approved with ROOT=D:/pyrefly-release55: 917 ok (approved 869, judge-locked 48), 0 mismatched, 0 missing; 31 in-game composites plus Wind Waker judged against their tiles. Darkness of Yojimbo, Leblanc and Macalania is a question for Bailey (PR-0585), not a replacement proposal. |
| CHK-014 | PASS | yes | Facing read in the midfight frame of every chapter: the party points across the field to the boss; attack and cast poses are aimed at the target; the 3D chapters face the boss too. |
| CHK-015 | PASS | yes | Every route set only window.__pyrefly.setSeed(1) (seed 2 for the Maesters second run), recorded in run.json hooks and battleSeeds; the hidden chapters were opened by typing their words with real keys; the FFX-2 revive supplement (setSeed, gotoChapter, hp 1, forceCommand) is labelled injected:true and the second revive read (gap pass, Chapter X) used only setSeed and gotoChapter with real menu keys. Chapter I phone to... |
| CHK-016 | PASS | yes | index.json: 839 entries, 822 asserted and verified, 17 flagged UNVERIFIED by the harness and none used as proof (six 30-post-scene frames taken while the scene plays, waker 35-board-reload, two phone 14-pause frames, seven revive-ffx2 injected frames); 0 captures with a title root; 833 recorded mode gpu; no black-canvas fallback was needed. |
| CHK-017 | PASS | yes | verify-live --manifest critic/artifacts/2342fe666.json --changed-from critic/artifacts/01a767770.json --sample 120: PASS, checked 234, mismatched 0, missing 0, wrongType 0; the live HTML names assets/index-eSs6-WR_.js; the release live review already compared all 7,265 files. |
| CHK-018 | PASS | yes | art-derive audit PASS: 1,419 text files, 1,372 literal art names, 0 dangling, 38 of 38 thumbnails. The four paintings that 404 on live are runtime-built names of two hidden chapters whose handoffs record that no painting exists (PR-0616). The real-play and browser-load halves were not run (UNVERIFIED for this round). |
| CHK-019 | PASS | yes | art-derive verify exact PASS (5,404 masters, 5,052 pixel-compared, 0 problems); artifact manifest decodes 7,266 files; yrp-models-verify PASS (43 files, 141.3 MiB); ww-models verify PASS; 0 html-as-image in 31 runs. WebKit/Chromium image-load not run. |
| CHK-020 | FAIL | yes | Polish-level and unchanged (PR-0543): the FFX target step shows "Enter Select / G Intel / Q Defend / P Pause" with no ENTER CONFIRM / ESC BACK strip that FFX-2 draws. Every release 74 change carries a written game case; the revive cross's FFX-2 half is now read on production, the FFX half not re-read by the interface auditor. |
| CHK-021 | PASS | yes | Keeper (FFX only) behind platformRing/frontLineFirstStrike flags only its formation sets (spectral-keeper-absence.test.ts 3 of 3); Maesters (FFX-2 only) are x2-prefixed rows registered in the FFX-2 engine only; FastFloor, ReviveCross, FastForwardHold both; RigHeadHold FFX only (lulu); Sin treatments and HUD holds FFX; the shared advanceClock path is inert without idle Circles (16 byte-identical re-runs, seven identic... |
| CHK-022 | PASS | yes | All 19 listed chapters reached results by real input (Mirror Aeons on its second run at a 50-minute budget: the first stalled at the 15-minute default, PR-0592); afterResults is chapter-select in every run and the clear is kept after a real reload in 22 of 22 victory runs; the post scene plays after CONFIRM (the 30-post-scene frame is early in six runs, PR-0593). Chapter IV's desktop lose-then-retry has no card captu... |
| CHK-023 | PASS | yes | PASS in round 34b. Round 34 had shown in a page the shared CTB clock in all 14 FFX runs (streams equal round 33), the Keeper's Attack All and Berserk Tail from real keys, the Black Elemental's Berserk and Aranea, Concherer's Gunk and Megaton Press, the FFX-2 revive and the battle music routing and phone warm gate, and had left the rest UNVERIFIED. The hidden lane then played both hidden chapters by real key presses (... |
| CHK-024 | NOT APPLICABLE | no | Persistence did not change between 01a767770 and 2342fe666: no added or removed localStorage/sessionStorage/indexedDB line, SaveData.ts untouched; the reload check (22 of 22 clears kept) is recorded under CHK-022. |
| CHK-025 | PASS | no | After a real win in yrp and in waker the board reads cleared [] and 0 OF 19 BEATEN, no NEW BEST, and the tile count stays 19. keeper and infinito were not won, so their win case is UNVERIFIED; localStorage keys were not dumped. |
| CHK-026 | FAIL | yes | FAIL. The continuity harness (harness 683a773fead4, release tree D:/pyrefly-release55 at fc3326153, live URL, GPU, seed 1, 1600x900, pose table b8cead6d) read ALL 19 listed chapters fresh on this build in one run (11,131.9 s of battle, 10,849 swaps judged, finished 02:16 EST); the stamped aggregate is embedded unchanged. FAIL in 7 chapters: Seymour Flux (2 Auron head swaps, worst 10.8 percent, 9.4 where registered; 1... |
| CHK-027 | FAIL | yes | FAIL. The same full run, 19 of 19 chapters. FAIL in 6, the same six as in round 33b: Yunalesca (4 swap jerks of 40 px or more, worst 103.7 px; 33b: 21, 153.5), Braska (8, worst 224.5 px; 9, 232.6), Vegnagun (5, 201.6 px, the tail; 5, 202.9), Fallen Aeons (5, 48.2 px; 4, 44.6), Den of Woe (7, 169.8 px, Rikku; 7, 169.4) and Sin core (6, 172.0 px; 8, 255.2). PASS in 13: Flux, Bahamut, Leblanc, Anima, Evrae, Yojimbo, Nat... |

## Coverage matrix

**Tested**
- Live exact artifact: verify-live PASS (234 files, 0 mismatched), index names index-eSs6-WR_.js, 300 of 300 audio files equal, art-derive audit and verify PASS.
- All 19 listed chapters won by real keys from the title with the clear kept after reload; 839 captures (822 asserted), 0 console errors and 0 not-found in the 19 listed chapters; 270 minutes of play, no crash.
- Engine: 16 probe outputs byte-identical to round 33, 600 fuzzed Keeper fights, Maesters per-floor lines at seeds 301 to 340, full unit suite (30,285 tests), data audits against the two RE notes.
- FFX-2 revive read in a page twice (injected sampler and a real-key Chapter X read); phone pause opened by a real tap in Chapters I and IV.
- Audio technical half: qa --strict, decode of 319 mp3, live fetch of 300 files, themes-audit, routing from 209 snapshots.
- Continuity harness (CHK-026 and CHK-027) on all 19 listed chapters fresh on live in one run: 11,131.9 s of battle, 10,849 swaps judged, harness 683a773fead4, GPU, seed 1, 1600x900; stamped aggregate embedded; frame times read in all 19.
- Four hidden chapters opened by typed word: yrp and waker won; keeper and infinito lost with results and retry read; in round 34b the Keeper (seeds 1 and 2) and the Maesters (floors 20, 40, 60 won, floor 80 lost) were played again by real keys with their signature mechanics read in a page (CHK-023), and the four hidden chapters were read by the continuity harness.

**Reused (with the reason)**
- Fast-speed continuity readings of Chapters I, IV, VIII and XVII (PR-0614) - from critic/reviews/2342fe666-focused/continuity (c*-F). Why: the candidate dist equals the deployed bytes (CHK-017), same harness id 683a773fead4, seed 1, 1600x900; the full run read normal speed only, and nothing between the runs changed. The normal-speed focused readings are no longer used: the full run replaces them.
- Pause six-size matrix (CHK-002) and numeric text floor for unchanged chapters (CHK-003) - from critic/rounds/round-33b.json. Why: no pause file changed; HUD files other than Chapters XII and XVII unchanged between 01a767770 and 2342fe666
- Prep agency (Sphere Grid, Overdrive equip, FFX-2 read-only tabs) - from critic/rounds/round-33.json (round 32 G4 walks). Why: no prep tab, PartyPrep screen or save code changed; results texts of 18 of 18 listed chapters equal round 33
- Narrative text judgement for the 19 listed chapters - from critic/rounds/round-33b.json and 32. Why: no listed story line changed; only two hidden scripts were added
- Full 7,265-file byte comparison of the live site - from critic/reviews/2342fe666-live.json. Why: same artifact hash

**Not tested**
- Continuity harness on a second seed or another size in any chapter; the dedicated harness on the Keeper (its three routes lasted under the 60 s minimum) and on the Wind Waker (its probe saw no figures); CHK-026 and CHK-027 on WebKit, Firefox or a phone (the harness is Chromium on the GPU at 1600x900).
- Gooey End (Aranea's fifth poll; she fell in two Attacks before it) and the Black Elemental's Reflect (data only, PR-0624) in a page; the Keeper live-game questions Q1 to Q11 that ask what the original game does (the page runs the repo engine, so the fuse base 84 against 45 cannot be settled there).
- Fallen Maesters and Keeper wins and aftermath; Waker board reload.
- Fast-speed pair on the other 15 chapters; Mirror Aeons seam frame times.
- ACCESSIBILITY, CONTROLS and MUSIC tabs and every accessibility setting; Chapter XVII at TEXT SIZE 115 and 130; the Chapter XII 29-stop flag walk; wide and 4K shapes.
- The phone entry cost on a phone profile; WebKit, Firefox, Safari, a real phone or controller (hardware not available to the headless review).
- Bailey's listening and feel verdicts (owner-only: no agent can hear, AGENTS.md rule 13; CHK-001, CHK-B1, CHK-B2 filed mandatory:false UNVERIFIED); ten cold-profile sound-start runs; sound-pass loudness in treated chapters.

**Required and not tested**
- none

## Encounters through their real flow

- seymour-flux: real flow complete - victory seed 1 at 1600x900 (53 turns, 8.5 min) and 2000x1012; 390x844 touch ended in defeat at turn 35 (harness limit PR-0483) and the retry reached battle; a separate lose run defeated at turn 4. Title to board by real keys; post-scene not reachable (results straight away), as r33.
- yunalesca: real flow complete - victory seed 1, 193 turns, 19.6 min. Full route; no post-scene captured.
- braskas-final-aeon: real flow complete - victory seed 1, 284 turns, 28.9 min. Full route.
- seymour-anima-macalania: real flow complete - victory, 58 turns. Full route.
- evrae-airship: real flow complete - victory, 83 turns. Full route.
- yojimbo-cavern: real flow complete - victory, 14 turns. Full route.
- seymour-natus: real flow complete - victory, 26 turns. Full route.
- seymour-omnis: real flow complete - victory, 92 turns, 10 min. Full route.
- isaaru-via-purifico: real flow complete - victory, 38 turns. Full route.
- sin-fins-core: real flow complete - victory, 299 turns, 20.9 min. Full route with the held battle HUD of release 74.
- sin-face: real flow complete - victory, 45 turns. Full route.
- mirror-aeons: real flow complete - victory on the second run (50-minute budget, 209 turns, 20.1 min); the first run stalled at link 2 at the 15-minute default. The default budget is the cause, not a lock (PR-0592).
- ffx2-bahamut: real flow complete - victory seed 1 at 1600x900, 2000x1012 and 390x844 touch (60 to 61 turns); a separate lose run defeated. Phone touch wins with 0 mismatches.
- ffx2-vegnagun-shuyin: real flow complete - victory, 85 turns, 15 min. Full route.
- ffx2-leblanc: real flow complete - victory, 90 turns. Full route including the minigame requests.
- ffx2-fallen-aeons: real flow complete - victory, 55 turns. Full route.
- ffx2-trema: real flow complete - victory, 229 turns, 22.7 min. Full route.
- ffx2-den-of-woe: real flow complete - victory, 27 turns. Full route.
- ffx2-ixion-djose: real flow complete - victory, 33 turns. Full route; also the chapter of the injected revive read.
- spectral-keeper: NOT complete - defeat by real keys in both runs (seed 1: 24 decisions, 3.27 min; seed 2 with Bahamut: 7 decisions, 1.44 min); results screen and retry reached; win UNVERIFIED. HIDDEN FFX chapter 29 (word keeper); outside the 19 and the milestone; documented as winnable about 3 in 100 with a scripted line. Round 34b: its nine signature mechanics were played by real keys in a page (CHK-023 PASS); the Keeper itself was not beaten.
- ffx2-fallen-maesters: NOT complete - floors 20, 40 and 60 won by real keys (floor 60 after Paine's walk and the shell break), floor 80 (Chac) reached through the seam and lost in 4:19 and 4:52 on a plain line; earlier route defeats on floor 40 and 60 as recorded in round 34; win UNVERIFIED. HIDDEN FFX-2 chapter 30 (word infinito); outside the 19 and the milestone (PR-0613, PR-0621). Round 34b: the four mechanics were played by real keys in a page (CHK-023 PASS); one debug write set Concherer's HP to 15,000 after the shell break was read so that a real Charon could end the floor (disclosed in the hidden results).
- exp-yrp-3d: real flow complete - victory seed 1, 47 turns, 7.1 min. HIDDEN FFX-2 chapter 31, desktop with the 3D Bahamut, 0 console errors, 0 404s.
- exp-windwaker: real flow complete - victory seed 1, 44 turns, 5.5 min. HIDDEN FFX-2 chapter 32, desktop; the reload capture landed on a Chapter I cutscene (harness step).

## Ranked issues (full list; critical none)

### PR-0614 [major] feel - At fast battle speed pose swaps and moves jump 100 to 407 px in one frame; the same routes at normal speed show far fewer (was R74-2)

- Status: open
- Game / chapter / state: both (FFX Chapters I, VIII, XVII; FFX-2 Chapter IV) / I, IV, VIII, XVII / battle speed Fast (the release 73 fast floor), seed 1, real keys, focused review routes c1-F, c4-F, c8-F, c17-F against c1-N, c4-N, c8-N, c17-N
- Expected: Fast speed shortens the animation; it does not add teleports. A figure should travel or blend across at least a few frames; no swap jerk over 40 px.
- Observed: Same build and seed, fast against normal (analysis.json, re-read by the confirmation pass): worst jerk Ch I 407.3 against 240.3 px, Ch IV 289.5 against 32.1, Ch VIII 389.2 against 79, Ch XVII 275.5 against 172.5; hops over 100 px Ch I 7 against 1, Ch IV 27 against 0, Ch VIII 1 against 0, Ch XVII 5 against 3. Correction to the auditors' wording: normal speed is not always zero (Ch I shows 1 hop over 100 px and Ch XVII 3), but fast is clearly worse in all four, and Ch IV and VIII show 0 at normal. The strip swap-114 (Paine follow to idle, 3 ghost frames) and swap-010 (Rikku hurt to KO, IoU 0.004) show the jump. The strike's attack gap falls from a median 27 frames to 7 in Ch I, the likely cause (suspected, not proven). The same family was recorded on the release 73 candidate (R73-1, R73-3), and round 33b noted fast-speed strike hops as fixed only on the unreleased r73-fast branch.
- Repro: Continuity harness with fast speed forced, chapters 1, 4, 8, 17, seed 1, 1600x900.
- Evidence: critic/reviews/2342fe666-focused/continuity/c1-F/analysis.json; critic/reviews/2342fe666-focused/continuity/c4-F/analysis.json; critic/reviews/2342fe666-focused/continuity/c8-F/analysis.json; critic/reviews/2342fe666-focused/continuity/c17-F/analysis.json; critic/reviews/2342fe666-focused/continuity/c4-F/strips/swap-114-paine-follow-idle.jpg; critic/reviews/2342fe666-focused/continuity/c8-F/strips/swap-010-rikku-hurt-ko.jpg
- Confidence: high on the numbers (reused under a written dependency argument), medium on the cause
- Requirement: CHK-027; RUBRIC section 6a
- Where (only if traced): suspected src/engine/motion/FastFloor.ts, StrikeCurve.ts, ReturnPace.ts (not traced)
- Smallest fix: Give the strike and the ko/follow-to-idle swaps a minimum of a few drawn frames of travel or blend at fast speed; do not let the attack gap or the return flip collapse to one frame. A written method check first: the family has now stood across releases 73 and 74.
- Acceptance check: The four routes at fast speed show no mid-move teleport of 300 px or more and at most 3 hops over 100 px per chapter, and a strip of the swap shows an in-between frame.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: new this round; last seen round 34

### PR-0584 [major] visual - Chapter III Braska: pose swaps still change head, height and stance and Auron/Yuna/Tidus jerk up to 224.5 px at the victory cheer and the critical swaps (CHK-026 and CHK-027 FAIL; teleports repaired; the focused review's R72-2)

- Status: open
- Game / chapter / state: FFX / Chapter III braskas-final-aeon / treated Chapter III, end of fight, harness swaps 1171, 1172 and 1767
- Expected: Head within 3 percent where registered, feet within 2 px, no single-frame step of 40 px or more at a swap (CHK-026, CHK-027).
- Observed: FRESH (this review, harness 5e1bbdec47c9, seed 1, 1600x900, 1,661.9 s of battle, 1,425 swaps counted): CHK-026 FAIL: 58 head swaps over tolerance (worst 94.4 percent where registered; 762 of the swaps are across a recorded hold and read up to 95.1 percent from the idle), 8 feet moves over 2 px (worst 14.5 px), 21 swaps outside the height band (stature 0.732 to 1.499), 17 silhouette-stance misses (worst 270.6 px). CHK-027 FAIL: 9 swap jerks of 40 px or more (worst 232.6 px), 0 teleports (round 32b: 3 of 306 to 340 px), 42 mid-move dashes over 40 px (worst 160.6 px, reported not gated). Same-artifact focused run read 58.1 percent / 229.5 px / 8 jerks, the same class. Most of the numbers sit at the victory cheer and the critical idles, where the camera cuts to a close-up of one figure a few frames earlier, so what the player sees at the swap is not settled by the numbers (strips swap-919-tidus-critical-idle, swap-1171-tidus-idle-victory, swap-031-yuna-critical-idle in the fresh run). Better than round 32b (head 97.1 percent, swap jerk 227.3 px, 3 teleports): the teleports are gone and the jerk count fell from 34 to 9; the head, height and stance numbers did not move. ROUND 34 (build 2342fe666): Chapter III harness (reused from the same-artifact focused run c3-N, harness 683a773fead4): CHK-026 FAIL head up to 58.2 percent (94.4 in 33b), 18 swaps outside the height band, feet 10.8 px; CHK-027 FAIL 7 swap jerks, worst 226.3 px (Tidus critical to idle, frame 918; live release 73 read 222.8 px). The strip swap-918 shows a small dark figure with no visible change over 20 frames, so the number is not confirmed visible. Confirmation pass re-read c3-N: numbers match. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Chapter III read fresh (1,652.8 s of battle, 1,425 swaps counted): CHK-026 FAIL: 14 head swaps over tolerance (round 33b: 58), worst 1,506.1 percent; 8 feet moves over 2 px (worst 14.7 px; 14.5); 21 swaps outside the height band (stature 0.732 to 1.479; 21); 16 silhouette-stance misses (worst 247.2 px; 17, 270.6). CHK-027 FAIL: 8 swap jerks of 40 px or more (worst 224.5 px; 33b 9, 232.6; the focused run read 226.3 and live release 73 222.8), 0 teleports, 40 mid-move dashes (worst 162.8 px, reported not gated). The 1,506.1 percent is swap 1673, Tidus critical to victory at the end of the fight: the projected head runs from 2,144 px to 34,437 px while the registered head box is the same on both paintings (0.1459 and 0.1458 world units, the harness's class camera), so it is the victory close-up moving at the swap, not the painting; two more Tidus critical-to-victory swaps read 150.5 percent (swap 1291, under a camera cut and not counted) and 49.3 percent (swap 1767) for the same reason. The page kept no strip for swap 1673, so this is read from the numbers, not from a picture. It is the same swap class as 33b's 94.4 percent (the victory cheer) and not a regression: the painting's head did not change. Round 34's credit "Braska head 94.4 to 58.2 percent" is withdrawn: 58.2 was a different run's reading of a camera-dependent number.
- Repro: Chapter III to the end; harness swaps 1171, 1172, 1767; strip jerk-046-auron.
- Evidence: critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/strips/swap-919-tidus-critical-idle.jpg; critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/strips/swap-1171-tidus-idle-victory.jpg; critic/reviews/01a767770-focused/continuity/continuity-summary-braskas-final-aeon.json; critic/reviews/01a767770-focused/continuity/braskas-final-aeon-win-01a767770/continuity/strips/jerk-008-auron.jpg; critic/reviews/2342fe666-focused/continuity/c3-N/continuity-summary.json; critic/reviews/2342fe666-focused/continuity/c3-N/strips/swap-918-tidus-critical-idle.jpg; critic/rounds/round-34/continuity/braskas-final-aeon-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/braskas-final-aeon-win-r34/continuity/strips/swap-919-tidus-critical-idle.jpg
- Confidence: high for the measurement; medium for what the player sees at the cheer
- Requirement: CHK-026
- Smallest fix: Register the Chapter III critical and victory paintings in docs/target/pose-measure.json, or decide with a probe whether swaps under the victory close-up are excused by a written rule (the question PR-0584 asked in round 32b); the method check of proposal 1 comes first.
- Acceptance check: Harness on braskas-final-aeon: CHK-026 and CHK-027 PASS, or a written rule excuses the swaps under the victory camera and the harness applies it.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34b

### PR-0459 [major] visual - Chapter I (FFX): Auron's head changes 9.3 percent at two swaps and one swap draws him at stature 0.765 (CHK-026 FAIL, still open, a fourth deep review)

- Status: open
- Game / chapter / state: FFX only / seymour-flux / Auron attack/follow/idle swaps, killing-blow close-up
- Expected: Head within 3 percent at every swap (CHK-026).
- Observed: Chapter I (FFX): Seymour Flux CHK-026 FAIL again (max head jump 10.8 percent, 1 stature miss); the strips were not re-read for Auron specifically this round. Carried; folded into PR-0531's numbers. ROUND 33: Fresh Flux harness: head worst 10.8 percent (9.4 where registered), 2 head swaps over tolerance, one swap outside the height band (stature 0.765): the same readings as round 32b. ROUND 34 (build 2342fe666): Chapter I fresh live harness run (this review, 462.7 s of battle): CHK-026 FAIL, 2 head swaps over tolerance, worst 10.8 percent (9.4 percent where registered), 1 pose outside the height band (stature 0.766), feet 4.9 px; CHK-027 PASS (worst swap jerk 37.8 px). The strips name Kimahri idle to hurt/ready/ko; the 9.3 to 10.8 percent subject is not re-identified (read continuity.json perFigure). Identical to the release 73 candidate, so not a regression. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Chapter I is part of this run and reads as in round 34: CHK-026 FAIL, 2 head swaps (Auron attack to follow and follow to idle, worst 10.8 percent, 9.4 where registered), 1 swap outside the height band (stature 0.766), feet 4.9 px; CHK-027 PASS (worst swap jerk 37.8 px). Unchanged.
- Repro: Continuity harness, seymour-flux, seed 1, 1600x900; strips swap-265-auron-follow-idle.jpg and the Auron entries of continuity.json.
- Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json; critic/rounds/round-34/continuity/seymour-flux-win-r34/continuity/continuity.json; critic/reviews/2342fe666-focused/continuity/c1-N/continuity-summary.json
- Confidence: high
- Requirement: CHK-026
- Smallest fix: Method check first (RUBRIC section 8; stalled since round 29): read the two strips, re-register Auron follow to the idle head, re-run Chapter I.
- Acceptance check: Chapter I harness: Auron worstHeadPct under 3 and heightOver 0.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34b

### PR-0531 [major] visual - Figures still change head, height or feet at pose swaps: CHK-026 FAILS in 7 of the 19 chapters the harness read on this build (full 19-chapter read, round 34b; 12 of 19 in round 33b, 13 in round 32b); Lulu's rig head is repaired and Isaaru passes

- Status: open
- Game / chapter / state: both / 7 of 19 chapters: seymour-flux, yunalesca, braskas-final-aeon, seymour-anima-macalania, ffx2-fallen-aeons, ffx2-trema, ffx2-ixion-djose / every pose swap of 19 chapters won by real keys, live, 1600x900, seed 1
- Expected: Head within 3 percent, standing feet within 2 px at 1600 wide, stature inside the pose band at every swap (CHK-026).
- Observed: Harness (10,638.5 s of battle, 11,649 swaps, harness 5e1bbdec47c9, pose table b8cead6d): 445 head swaps over tolerance (worst 97.1 percent at Braska's victory cheer; 15.5 percent is Lulu's rig head), 26 feet moves over 2 px (worst 18 px, Braska; Trema Paragon 10.4 px), 25 swaps outside the height band (round 31: 5; 23 of them in Braska), 54 silhouette-stance misses (23). FAIL in 13 of 19: Seymour Flux, Yunalesca, Braska, Anima, Evrae, Yojimbo, Fallen Aeons, Trema, Isaaru, Ixion, Sin core, Sin face, Mirror Aeons. PASS: Bahamut, Vegnagun, Leblanc, Natus, Omnis, Den of Woe. Leblanc, new in r69, is PASS on CHK-026 and CHK-027. Braska is worse than round 31 (PR-0584). ROUND 33B: Full harness (harness 5e1bbdec47c9, GPU, seed 1, 1600x900, 19 of 19 chapters, 11,220.8 s of battle, 11,176 swaps judged): 415 head swaps over tolerance (round 32b: 445; worst 94.4 percent at Braska's cheer), 24 feet moves over 2 px (26; worst 14.5 px in Braska; Trema's Paragon 10.3 px), 23 swaps outside the height band (25; 21 in Braska, one in Flux, one in Ixion), 59 silhouette-stance misses (54: Yunalesca 37, Braska 17, Fallen Aeons 4, Anima 1). FAIL in 12 chapters, PASS in 7 (Bahamut, Vegnagun, Leblanc, Natus, Omnis, Den of Woe and Isaaru, repaired since 32b by the KO-slide ease). By root cause: (1) Lulu's rig head is 397 of the 415 head fails (PR-0534): Evrae, Yojimbo, Sin core, Sin face and the Mirror Aeons fail CHK-026 on that reading alone; (2) Chapter III, PR-0584: 58 heads, 8 feet, 21 heights, 17 stances; (3) Yunalesca's boss idle to hurt and back, 34 of its 37 stance misses, up to 14.7 px; (4) Trema's Paragon feet, PR-0529: 16 swaps, 10.3 px; (5) singles: Anima's boss idle to KO (15.1 px), Ixion's Yuna idle to hurt (height), Fallen Aeons' X-2 Shiva idle to attack (3 stance misses up to 18 px), Flux's Auron (2 heads, 1 height). No chapter that passed in 32b fails now. Correction to round 33's focused-run line 'Anima FAIL 22.2 percent': Anima fails CHK-026 on one stance miss, not on a head (the 22 percent ratio in its summary is not a counted fail). ROUND 34 (build 2342fe666): Fresh and reused readings: Chapter I FAIL (10.8 percent), Chapter II FAIL (10.7 percent head, stance misses), III FAIL (58.2 percent); IV, VIII, XII, XVII PASS (Lulu's rig head fixed in release 74: VIII 0.1, XII 8.7 registered, XVII 6.1 percent, which failed in 33b on her head alone). Twelve chapters unread on this build. The family has stood open at the same severity in rounds 29 to 34: the method check owed since 33b is still unwritten. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Full harness, 19 of 19 chapters, 11,131.9 s of battle, 10,849 swaps judged: 16 head swaps over tolerance (round 33b: 415; 14 are Braska's, 2 are Flux's Auron), 24 feet moves over 2 px (24; 8 Braska, 16 Trema), 23 swaps outside the height band (23; 21 Braska, 1 Flux, 1 Ixion), 58 silhouette-stance misses (59; Yunalesca 37, Braska 16, Fallen Aeons 4, Anima 1). FAIL in 7 chapters (12 in 33b), PASS in 12; no chapter that passed in 33b fails now. By root cause: (1) Chapter III, PR-0584: 14 heads, 8 feet, 21 heights, 16 stances; (2) Yunalesca's boss idle to hurt and back (33 of its 37 stance misses, up to 13.3 px) and Shiva (4); (3) Trema's Paragon feet, PR-0529: 16 swaps, 10.4 px; (4) singles: Flux's Auron (2 heads, 1 height), Anima's boss idle to KO (15.7 px), Ixion's Yuna idle to hurt (height), Fallen Aeons' X-2 Shiva idle to attack (3) and Anima hurt to KO (1) (up to 18.1 px). Lulu's rig head is no longer a cause: 861 rig-head readings, none over tolerance, and the five chapters that failed on it alone (Evrae, Yojimbo, Sin core, Sin face, Mirror Aeons) pass (PR-0534 closed). Round 34's line "twelve chapters unread" is closed. The family has stood open at the same severity in rounds 29 to 34b: the method check owed since 33b is still unwritten.
- Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); the 19-chapter run of this round is critic/rounds/round-31/continuity
- Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-trema-win-r32/continuity/strips/swap-207-paragon-idle-cast.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/swap-1172-yuna-idle-victory.jpg; critic/reviews/01a767770-focused/continuity/continuity-summary-yojimbo-cavern.json; critic/reviews/01a767770-focused/continuity/continuity-summary-isaaru-via-purifico.json; critic/rounds/round-33/continuity/continuity-summary.json; critic/rounds/round-33/continuity/yojimbo-cavern-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/seymour-anima-macalania-win-r33/continuity/continuity.json; critic/rounds/round-34/continuity/continuity-summary.json; critic/rounds/round-34/continuity/seymour-flux-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/yunalesca-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/braskas-final-aeon-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/seymour-anima-macalania-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/ffx2-fallen-aeons-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/ffx2-trema-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/ffx2-ixion-djose-win-r34/continuity/continuity.json
- Confidence: high (all 19 chapters read on this build, one run, one harness)
- Requirement: CHK-026, RUBRIC 6a (Bailey 2026-10-04: "characters change size and height across poses ... ruins the immersion")
- Smallest fix: Re-register the pose paintings the strips name to the idle head and ground line (registration, never a repaint on taste), refit the Den of Woe and Ixion poses outside their height band, and have the harness read the head from the part's own box for rig figures; do not loosen the tolerance. A written method check is owed before a third batch (RUBRIC section 8: open in rounds 29, 30, 30b, 31).
- Acceptance check: Harness on Chapters I, IV, VII, IX, XI, XII, XIII, XVI: feet, height and stance lists empty outside written waivers; the five named strips show one size.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34b

### PR-0380 [major] feel - CHK-027 FAILS in 6 of the 19 chapters (full read, round 34b): Yunalesca 4 swap jerks of 40 px or more (worst 103.7 px), Braska 8 (224.5 px), Den of Woe 7 (169.8 px), Sin core 6 (172.0 px), Vegnagun 5 (201.6 px), Fallen Aeons 5 (48.2 px); 35 in all (round 33b: 54); 0 teleports; Anima, Isaaru and the rest pass

- Status: open
- Game / chapter / state: both / II, III, V, XI, XII, XIV, XVII, XIX (yunalesca, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-fallen-aeons, ffx2-trema, ffx2-den-of-woe, sin-fins-core, mirror-aeons) / every frame of every fight, 19 chapters, live
- Expected: No jump of 40 px or more in one frame at a pose swap, or a swap that happens under a cut with no ghost (CHK-027).
- Observed: Harness: 34 swap jerks of 40 px or more (worst 227.3 px, Braska), 3 mid-move teleports of 300 px or more (340 px, Braska Tidus: PR-0581), 138 dashes over the fail line (worst 294.5 px), 175 jerks over the fail line; snaps 0.00 a minute (the 7.5 animation cap does not bind). FAIL: Yunalesca, Braska, Vegnagun (tail 201.6 px), Anima (Ixion 80.3 px: PR-0582), Fallen Aeons (45.5 px), Isaaru (89.6 px: PR-0582), Den of Woe (Rikku 139.9 px stand-to-kneel drop), Sin core (left fin 169.3 px). Better than round 31 at swaps (66 to 34); worse in Braska, Anima and Isaaru, which the booth treatment first reached in release 70. ROUND 33B: Full harness, 19 of 19 chapters: 54 swap jerks of 40 px or more (32b: 34; worst 255.2 px in Sin core's left fin, 232.6 px in Braska), 0 mid-move teleports (32b: 3 of 302 to 340 px in Braska), 189 dashes over the fail line (138; reported, not gated; worst 252.8 px), snaps 0.00 a minute in every chapter. FAIL: Yunalesca 21, Braska 9, Sin core 8, Den of Woe 7 (Rikku critical to hurt 169.4 px), Vegnagun 5 (tail 202.9 px), Fallen Aeons 4. PASS: Flux, Bahamut, Leblanc, Anima (80.3 px to 0, repaired), Evrae, Yojimbo, Natus, Omnis (30 swap jerks, all under 30 px), Trema, Isaaru (89.6 to 26.4 px, repaired), Ixion, Sin face and the Mirror Aeons. The rise from 34 to 54 is one chapter: Yunalesca 3 to 21 on a fight 2.6 times as long (1,294.8 s against 491.8 s, 14 revives against none), and 7 of its 14 revive swaps step 50 to 131 px in one frame (Wakka 131, 125, 94, 94; Yuna 65, 53; Auron 50) where live release 69 read 3 of 8 up to 89 px and release 70's candidate 1 revive with no step; this is the revive-step class of PR-0570. The other 18 chapters go from 31 to 33 over the line. The repeated events are the same swaps: the harness lists 322 swap-kind jerks of 40 px or more in Sin core against 321 in 32b and 45 against 43 in Den of Woe; where a chapter's worst single event moved up (Sin core 169.3 to 255.2 px, Den of Woe 139.9 to 169.4 px) it is a different frame of the same class, and Chapter XVII is not a treated chapter. Not shown to be a regression of release 71 or 72; the cause of Yunalesca's step is not traced (suspect, not proven: the eased KO slide of release 72 eases the fall but not the way back up). ROUND 34 (build 2342fe666): Chapter II fresh: swap jerk 103.7 px, mid-move dash 167.8 px (33b: 153.5 and 252.8); III 7 swap jerks worst 226.3 px; XVII 13 swap jerks worst 172.5 px (33b Sin core worst 255.2; the XVII figure is largely the revive rise, PR-0615). All equal to or better than live release 73. Twelve chapters unread on this build. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Full harness, 19 of 19 chapters: 35 swap jerks of 40 px or more (33b: 54; 32b: 34; worst 224.5 px in Braska), 0 mid-move teleports, 176 dashes over the fail line (189; reported, not gated; worst 270.8 px in Chapter I), snaps 0.00 a minute in every chapter. FAIL in the same six chapters as in 33b: Yunalesca 4 (21; 103.7 px against 153.5; the fall from 21 is the largest single improvement of the run), Braska 8 (9), Den of Woe 7 (7; Rikku, 169.8 px), Sin core 6 (8; 172.0 px against 255.2; the focused run counted the revive rise, PR-0615, among its 13), Vegnagun 5 (5; the tail, 201.6 px), Fallen Aeons 5 (4; 48.2 px against 44.6, one more jerk and 3.6 px more: the only chapter whose swap-jerk count rose). PASS in 13: Flux, Bahamut, Leblanc, Anima, Evrae, Yojimbo, Natus, Omnis (30 px), Trema, Isaaru (26.3 px), Ixion, Sin face and the Mirror Aeons. Round 34's Chapter III and XVII lines (7 jerks, 226.3 px; 13 jerks, 172.5 px) were the focused run's; this run reads 8 and 6. Not a regression of release 74: no chapter passes less than in 33b.
- Repro: Continuity harness, ffx2-vegnagun-shuyin and sin-fins-core, seed 1, 1600x900 (strips under critic/rounds/round-31/continuity/<chapter>-win-r31/continuity/strips)
- Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-den-of-woe-win-r32/continuity/strips/jerk-004-rikku.jpg; critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg; critic/rounds/round-33/continuity/yunalesca-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/braskas-final-aeon-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/continuity-summary.json; critic/rounds/round-33/continuity/sin-fins-core-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/ffx2-den-of-woe-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/ffx2-vegnagun-shuyin-win-r33/continuity/continuity.json; critic/rounds/round-34/continuity/continuity-summary.json; critic/rounds/round-34/continuity/yunalesca-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/braskas-final-aeon-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/ffx2-vegnagun-shuyin-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/ffx2-fallen-aeons-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/ffx2-den-of-woe-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/sin-fins-core-win-r34/continuity/continuity.json; critic/rounds/round-34/continuity/yunalesca-win-r34/continuity/strips/jerk-000-tidus.jpg; critic/rounds/round-34/continuity/braskas-final-aeon-win-r34/continuity/strips/jerk-389-lulu.jpg; critic/rounds/round-34/continuity/ffx2-vegnagun-shuyin-win-r34/continuity/strips/jerk-000-vegnagun-tail.jpg; critic/rounds/round-34/continuity/ffx2-fallen-aeons-win-r34/continuity/strips/jerk-023-yuna.jpg; critic/rounds/round-34/continuity/ffx2-den-of-woe-win-r34/continuity/strips/jerk-004-rikku.jpg; critic/rounds/round-34/continuity/sin-fins-core-win-r34/continuity/strips/jerk-000-left-fin.jpg
- Confidence: high
- Requirement: CHK-027 (Bailey 2026-10-04)
- Smallest fix: Start with the Sin fins/core and Vegnagun swap lists (the worst two); register Ixion hurt and KO to one feet anchor; extend the registered stance to the poses the lists name. Method check owed (RUBRIC section 8).
- Acceptance check: Harness on the eight chapters: swap jerks over the line under 10 in total.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34b

### PR-0379 [major] feel - See-through cross-dissolves at pose swaps: 1,720 ms a minute over all 19 chapters (round 33b: 1,831), worst severity 0.381; Yunalesca 5,014, Ixion 4,757, Sin face 2,718 and Trema 2,701 ms a minute stay over

- Status: open
- Game / chapter / state: both / worst: Yunalesca 5,014, Ixion 4,757, Sin face 2,718, Trema 2,701 ms a minute (14 of 19 chapters over 1,000) / all fights, live, ?swapscope=wide default in 13 chapters
- Expected: Under 1,000 ms a minute of see-through in every chapter (the issue's own line).
- Observed: Harness: 1,623 ms a minute of see-through frames (97.4 frames a minute at 60 Hz), worst severity 0.367 under the 0.4 line, 0 over the fail line. Yunalesca 5,611 ms a minute (strip ghost-233), Ixion 3,444, Trema 2,644, Sin face 2,548 remain the worst. Gated swap jerks 66 to 34. ROUND 33B: Full harness, 19 of 19 chapters: 1,831 ms a minute of see-through (105.4 frames a minute, 109.9 at 60 Hz; 32b: 1,623 and 97.4), worst severity 0.374 under the 0.4 line, 0 over the fail line. 14 chapters sit over the 1,000 line: Ixion 4,729 (32b: 3,444), Yunalesca 4,632 (5,611), Trema 2,730, Sin face 2,576, Leblanc 1,739, Natus 1,534, Evrae 1,507, Braska 1,417, Omnis 1,391, Sin core 1,362, Mirror Aeons 1,234, Fallen Aeons 1,215, Den of Woe 1,068, Anima 1,025; under it: Bahamut 649, Vegnagun 726, Yojimbo 632, Flux 512, Isaaru 487. Ixion is the one that got worse (+1,285), read on a fight half as long (149.4 s against 304.7 s). The first-time fan shows the same class on screen: Ixion drawn as a double outline before its leap (evidence/ffx2-ixion-djose-win-r33/seq-spherechange/f03.jpg, read by the chief), Tidus as two overlapped poses in Yunalesca (seq-party-action/f01.jpg) and in the Mirror Aeons. ROUND 34 (build 2342fe666): First-time fan lens (330 ms-spaced montages, not harness-measured): a boss drawn see-through with a second faint copy of body or wings for a frame or two in Evrae (seq-action-playing f05), Ixion (f05) and Bahamut (seq-spherechange f07 to f08); two party members drawn on top of each other in Flux, Yunalesca, Braska and Anima (Tidus/Auron, Kimahri/Yuna). ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Full harness, 19 of 19 chapters: 1,720 ms a minute of see-through frames (101.4 frames a minute, 103.2 at 60 Hz; 33b: 1,831 and 105.4), worst severity 0.381 under the 0.4 line, 0 swaps over it. 14 chapters sit over the 1,000 line (as in 33b): Yunalesca 5,014 (4,632), Ixion 4,757 (4,729), Sin face 2,718, Trema 2,701, Leblanc 1,639, Natus 1,544, Evrae 1,532, Sin core 1,464, Braska 1,408, Omnis 1,390, Mirror Aeons 1,258, Fallen Aeons 1,136, Den of Woe 1,057, Anima 1,031; under it: Vegnagun 749, Yojimbo 635, Bahamut 579, Flux 469, Isaaru 463. The hidden Keeper and Maesters, which are not on the wide swap scope, read over the 0.4 line (PR-0631).
- Repro: Continuity harness, any chapter, seed 1.
- Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-33/evidence/ffx2-ixion-djose-win-r33/seq-spherechange/f03.jpg; critic/rounds/round-33/evidence/yunalesca-win-r33/seq-party-action/f01.jpg; critic/rounds/round-33/continuity/continuity-summary.json; critic/rounds/round-34/evidence/evrae-airship-win-r34/seq-action-playing; critic/rounds/round-34/evidence/ffx2-bahamut-win-r34/seq-spherechange; critic/rounds/round-34/continuity/continuity-summary.json
- Confidence: high
- Requirement: CHK-027 item 3
- Smallest fix: Continue the planned list: Evrae head registration, Sin face lunge return, Yunalesca planned cuts over 120 px, then move each of the four exceptions to the wide scope when its blocker clears.
- Acceptance check: All 19 chapters under 1,000 ms a minute or named exceptions.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34b

### PR-0570 [major] feel - Chapter I Tidus's revive steps 89 px sideways in one frame at +117 ms (r68 removed the first-frame pop; the step moved later)

- Status: open
- Game / chapter / state: FFX only (Chapter I Tidus; Chapter II Tidus peaks 39.3 px and Chapter IV Rikku 30.9 px, no step) / seymour-flux / Tidus revived from knock-out, 60 Hz stepped frames, live
- Expected: No step over 40 px in one frame of a revive (CHK-027 item 4).
- Observed: Release 69 fixed this: the revive slide target is read once at revive start (unit suite revive-follows-slide passes; Mega Phoenix and Phoenix Down revives resolve through the real menu in the Chapter I runs). The harness's Chapter I run lists no one-frame revive step of Tidus over the fail line (seymour-flux CHK-027 PASS, 0 swap jerks), but Tidus head moves of 80 to 162 px at swaps under a smear are present (frames 22585, 11541, 22705). The revive step itself was not isolated, so the fix is probable and not closed. ROUND 33: Fresh Flux harness: 0 swap jerks, 8 dashes over 40 px (worst 240.6 px; 32b 241.2 px). The Tidus revive step is not isolated by the harness summary; carried unchanged. ROUND 33B: the full harness finds the same revive-step class in Yunalesca: 14 revives, 7 of them step 50 to 131 px in one frame at the swap from knock-out to idle (Wakka 131, 125, 94, 94; Yuna 65, 53; Auron 50), against 3 of 8 (to 89 px) on live release 69 and 1 revive with no step on release 70's candidate. Chapter I reads 7 revives and 1 step (58 px) as in 32b; the Mirror Aeons 18 revives and none, Leblanc 3 and none, Sin core 5 and one (166 px; 40 px in 32b). So the step is not only Tidus's in Chapter I: it belongs to the revive swap, cause not traced. Tags unchanged.
- Repro: https://echoesofspira.com/?coach=off, Chapter I, seed 1: let Kimahri fall, revive him or Tidus (Mega Phoenix or Phoenix Down); record 60 Hz stepped frames and track the standing plane (probe D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/lib).
- Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json; critic/rounds/round-32/evidence/seymour-flux-win-r32/turn-log.json; critic/rounds/round-33/continuity/yunalesca-win-r33/continuity/continuity.json; critic/rounds/round-33/continuity/sin-fins-core-win-r33/continuity/continuity.json
- Confidence: medium
- Requirement: CHK-027 item 4; parent PR-0473
- Smallest fix: Isolate the Chapter I revive in the harness (Tidus after Phoenix Down at +117 ms) and read the plane step; close if under 40 px.
- Acceptance check: One revive strip of Tidus with a plane step under 40 px at +117 ms.
- Ship tags: introducedByCandidate unknown, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 33b

### PR-0517 [major] visual - FFX-2 Chapter IV: Rikku's and Paine's attack and ready poses still read as a different-sized figure from their idle (carried; r68's ready hold did not change it)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-bahamut / Paine attack to follow, Rikku attack to follow and idle to attack
- Expected: A figure keeps one size across a pose change (CHK-026; Bailey 2026-10-04).
- Observed: Carried. The fan strips show it again in Leblanc: Rikku grows to about 1.4 times when her ready stance starts (ffx2-leblanc seq-action-playing frames 6 to 9, seq-party-action frames 0 to 1), and Ormi's Shield Bash lunge is a pink ghost that pops back to its seat (a double-image read, folded here and into PR-0379). The harness CHK-026 reads Leblanc and Bahamut as PASS, because the head control passes a registered pose by construction (PR-0534).
- Repro: Continuity harness ffx2-bahamut, seed 1, 1600x900.
- Evidence: critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-202-paine-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-207-rikku-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-267-rikku-idle-attack.jpg
- Confidence: medium (one strip read in full by the chief; the others by their headers)
- Requirement: CHK-026, PR-0517 (ask Bailey: repaint or register only; human judgment unrecorded)
- Smallest fix: Register the attack and follow paintings to the idle head and ground line (or give the swap a smear cut); Bailey decides whether the Dark Knight and Warrior ready poses are repainted.
- Acceptance check: Strip header real head within 3 percent for the named swaps; harness stays PASS.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 32

### PR-0603 [major] interface - The Chapter XII intent card prints an impossible damage range: "TIDUS 4,132-2,333" (low end above the high end)

- Status: open
- Game / chapter / state: FFX / XII seymour-omnis / seymour-omnis, seed 1, default 1600x900, first menu, key E, Mortiphasm Spells (second in the queue)
- Expected: A range that reads low to high for every listed target (Tidus's low bound is probably 2,066, matching Auron), so the player can judge whether a Mortiphasm hit is survivable.
- Observed: The card reads "DAMAGE  TIDUS 4,132-2,333  68% HP  AURON 2,066-2,333  34% HP". Tidus's low bound is twice Auron's and above his own high bound. Round 32 printed the same text (run.json intentText) and nobody filed it. Confirmed by the confirmer from the stored round-33 run.json; the card was not re-rendered live by the confirmer, and the chief read the capture owner's run.json and frame. ROUND 34 (build 2342fe666): Still printed on the live Chapter XII card: "TIDUS 4,132-2,333 68% HP, AURON 2,066-2,333 34% HP" (run.json intentText of seymour-omnis-win-r34); 4,132 is exactly 2 x 2,066, suspected a multiplier on the low end only. Third consecutive review at major: a written method check is owed before another fix attempt.
- Repro: https://echoesofspira.com/, Chapter XII, setSeed(1) before the first key, play to the first menu, press E. Frame: evidence/seymour-omnis-win-r33/12-intent-E.png; text in seymour-omnis-win-r33/run.json intentText.
- Evidence: critic/rounds/round-33/evidence/seymour-omnis-win-r33/12-intent-E.png; critic/rounds/round-33/evidence/seymour-omnis-win-r33/run.json; critic/rounds/round-34/evidence/seymour-omnis-win-r34/12-intent-E.png; critic/rounds/round-34/evidence/seymour-omnis-win-r34/run.json
- Confidence: high that the numbers are shown; low on the cause
- Requirement: RUBRIC section 2 and CHK-004: enemy intent honest, certain separated from conditional (wrong information is major)
- Where (only if traced): Chapter XII FFX intent card (src/battle/ffx/intent.ts area); cause not traced
- Smallest fix: Find where the card builds the per-target low bound for the Mortiphasm spells (suspected: a doubled or unclamped minimum for Tidus; not traced) and correct it; add a unit assertion that every intent range satisfies min <= max across all chapters' cards.
- Acceptance check: The Omnis E card on seed 1 reads low <= high for every row; the unit assertion over all chapters' cards passes.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: new this round; last seen round 34

### PR-0613 [major] encounter - Fallen Maesters floor 80 (Chac): no winning line is demonstrated with the party the chapter gives

- Status: open
- Game / chapter / state: FFX-2 / ffx2-fallen-maesters (hidden, typed word infinito), floor 80 (Chac) / hidden chapter 30, link 4
- Expected: A sourced optional fight (the delay-lock of research/re-ffx2-fallen-maesters.md) that a player can win with the party given, or an honest label that it cannot be.
- Observed: Engine bench on fresh seeds 301 to 340: six driven lines (defend, Darkness, walk, Gunner chain, Charon with Break Damage Limit rigged, Remedy plus Charon rigged) all win 0 of 40; the party is gone in 0.27 to 0.56 game minutes (2.4 to 3.0 girl KOs a fight); the builder's own bench reports 0 of 30 on every line; the real-key route never reached floor 80 (seed 1 stopped after floor 40; seed 2 lost to Concherer three times). The fight always ends, so it is no hang. Not shown: that it cannot be won. The builder discloses it as "a hard optional fight". If it is in fact unwinnable it is critical-class (an encounter that cannot finish); that is unproven either way. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Hidden lane, real keys, seed 1 (run maesters-walk-s1d, replicated by s1c): floors 20 and 40 fell to a plain line; on floor 60 Paine's walk by four Change rows (Warrior, Gunner, Thief, Dark Knight: blue, yellow, green, red gates) broke her damage limit, Charon dealt 21,420 in one result and Concherer's shell broke (the message once, the banner on screen, DEF and MDEF 122 to 1); one debug write then set Concherer's HP to 15,000 so that a real key could end the floor (disclosed). Floor 80 (Chac) was reached through the seam and a plain line lost there in 4:19 (4:52 in s1c): Stony Glare petrified Paine, Chac's Attack destroyed her, Heaven's Cataract put ten stat-downs on Yuna and Rikku. No winning line for floor 80 is shown, so the issue stands; what is new is that the floor-60 route and Chac's signature moves are demonstrated in a page.
- Repro: critic/rounds/round-34/audit-combat/maestersfloors.probe.ts with PROBE_SEEDS=301-340 (fight(3, seed, line) from tests/unit/helpers/fallenMaestersDrive.ts); real route: type infinito on chapter select and play floors 20, 40, 60 by keys.
- Evidence: critic/rounds/round-34/audit-combat/maestersfloors.json; critic/rounds/round-34/audit-combat/naivex2-maesters-attack-attack.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/run.json; docs/handoff/ch-maesters.md; critic/rounds/round-34/hidden/maesters-walk-s1d/trace.json; critic/rounds/round-34/hidden/maesters-walk-s1d/battle-log-chac.json; critic/rounds/round-34/hidden/maesters-walk-s1d/w-chac-076-x2-chac-heavens-cataract.jpg
- Confidence: high for the measurement, low for whether a human line exists
- Requirement: RUBRIC section 6 encounter: fair wins and losses, intended strategy reachable; section 8 critical class
- Smallest fix: Bailey's call (AGENTS.md rule 6: no boss number is tuned): bench a measured kit for the sourced delay-lock or Gunner chain first, or state plainly on the chapter card and tip that floor 80 has no known win with this party. Smallest: the one-line honest label.
- Acceptance check: Either a scripted line with no rig wins floor 80 on at least 20 percent of 40 seeds with a real-key capture, or the card and tip say floor 80 is not winnable with this party.
- Ship tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Carried from: new this round; last seen round 34b

### PR-0148 [major] audio - No numeric owner listening verdict covers the shipped mix (carried; an evidence gap, not a player defect)

- Status: open
- Game / chapter / state: both / all / owner listening
- Expected: CHK-B1: a dated verbatim numeric verdict naming the build or cue set.
- Observed: Carried, an evidence gap and not a player defect: docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; the only number is 'I like all the music 7/10' (2026-10-13, D-804), music only, before the re-rendered victory cues, the SFX and voice passes and the conference sound pass. The technical half is clean (qa --strict 0 findings, 300 of 300 live files byte-equal, 0 synth fallbacks). ROUND 34 (build 2342fe666): Still no numeric listening verdict covering the shipped mix (D-804 is music only, 2026-10-13).
- Repro: Read docs/target/decisions.json (D-804, D-1310, D-1371) and docs/audio/OWNER-VERDICT.md.
- Evidence: critic/rounds/round-32/audio/qa.log; docs/audio/OWNER-VERDICT.md
- Confidence: high
- Requirement: RUBRIC audio: Bailey's listening assessment; CHK-B1
- Smallest fix: Bailey listens to docs/audio/audition.html and gives a 0 to 10 number for music, SFX and voice, recorded verbatim.
- Acceptance check: A dated verbatim numeric verdict naming the build or cue set is recorded.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34

### PR-0295 [major] interface - Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; not re-examined; the prep tab strip is cut at ACCESS on the 390x844 prep capture)

- Status: open
- Game / chapter / state: both / prep, phone / carried
- Expected: A phone prep that is a phone layout.
- Observed: Carried, not re-walked: only the first prep tab was captured at 390x844 (the strip is cut at 'ACCESS' in Chapter IV). ROUND 32b ADDITION (G4 (4c) evidence, severity left to the driver): The phone prep tabs were walked by tap and swipe on the live bundle (FFX CHAPTER, STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; FFX-2 CHAPTER, DRESSPHERES, STATS, ACCESSORIES, ITEMS): the strip is cut at open (3 of 6 FFX tabs and 2 of 5 FFX-2 tabs off screen) and the tabs are 37 px tall, but a real swipe moves the strip, it follows the selected tab, and the tabs seen are phone layouts (stacked, foldable sections), so "a desktop frame squeezed onto a phone" is not what the tabs walked show. ROUND 34 (build 2342fe666): Re-observed: the phone prep tab strip is cut at ACCES. Only the first prep tab was framed.
- Repro: 390x844 touch, any chapter, prep screen.
- Evidence: critic/rounds/round-32/evidence/ffx2-bahamut-win-r32-phone-touch/04-prep.png; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx2/run.json
- Confidence: low this round
- Requirement: RUBRIC section 6 prep and interface
- Smallest fix: Walk it (PR-0503), then fix on what the walk shows.
- Acceptance check: Per tab at 390x844: opened by tap, readable, one change made, visible in the first menu.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34

### PR-0567 [major] delivery - A phone on a 10 Mbit/s line waits 11.1 s (Chapter I) and 18.4 s (Chapter IV) on the loading card, 80.1 and 60.7 MB on the wire, before the first command (release 68: 19.8 s and 42.4 s, about 94 MB); the 8 s and 50 MB lines are still missed

- Status: open
- Game / chapter / state: both / seymour-flux and ffx2-bahamut (measured); suspected for all / first-command job, phone10 profile (390x844, DPR 2, touch, CPU x4, 10 Mbit/s, 40 ms), real keys and taps, candidate bundle of the live artifact
- Expected: A phone reaches the first command menu without a 20 to 40 s load card; the 5 s goal of BUDGETS B2a holds on the desktop line.
- Observed: Carried and unmeasured on the build: round 31 read 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card on a 10 Mbit/s phone profile. Release 69 added ?phonediet (CHANGELOG, the builder's own claim: 20.4 to 13.8 s and 42.3 to 23.7 s, with the 8 s budget still missed). No independent run measured the live build this round; PR-0573 (page memory per chapter change) is likewise not re-read after release 69's screen release and LeaveRelease.endFight. ROUND 32b ADDITION (G4 (4d) on the live release-70 bundle): phone10 profile (390x844, DPR 2, touch, CPU x4, 10 Mbit/s, 40 ms), pad route: Chapter I load wait 11.1 s (card 10.5 s, total 61.0 s, 80.1 MB to the menu), Chapter IV load wait 18.4 s (card 18.3 s, total 49.1 s, 60.7 MB). The release 68 candidate read 19.8 s and 93.6 MB (Chapter I) and 42.4 s and 94.0 MB (Chapter IV), so the load order of release 69 helps (about 9 s and 24 s less) but the 8 s budget and the 50 MB acceptance line are still missed (+3.1 s and +10.4 s). The host was 28 to 32 percent busy (the release 71 build), so these numbers are upper bounds. Three runs per chapter were not made. ROUND 34 (build 2342fe666): Not re-measured on a phone profile this round; the focused review found the first-load cost small (+1.18 percent gzip, cold title 0.4 s).
- Repro: critic/reviews/2a9340249-focused/budgets jobs/first-command.mjs --profile=phone10 --mode=pad (emulation only; a desktop GPU is not a phone).
- Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json; critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-r67.json; critic/reviews/2a9340249-focused/budgets/first-command-desk50-pad-cand68.json; critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/phone10/first-command-phone10-pad-r32-g4-live.json
- Confidence: medium (one run per chapter, host 28 to 32 percent busy)
- Requirement: RUBRIC section 2 and 6 delivery; BUDGETS B2a, B3a (proposed)
- Smallest fix: Measure the wire set before the first menu with ?loaddiet=off and on, find what is fetched before the opening poses need it (suspected: the whole chapter's 1x paintings plus board strips), defer the rest until after the first menu.
- Acceptance check: Three runs per chapter: phone10 wire bytes to the first menu at most 50 MB, load wait at most 8 s, desk50 Chapter I load card at most 5.0 s.
- Ship tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Carried from: round-32b; last seen round 34

### PR-0586 [minor] interface - R32-INT-01: the F1 command row cuts the selected row's own label or hint ('SPECI...' on Isaaru, 'A one-off action this...' on Braska and Natus)

- Status: open
- Game / chapter / state: FFX only / Chapter XIV Isaaru (Yuna), Chapter III Braska, Chapter X Natus / F1 command row at 1600x900, real keys, seed 1, cursor on SPECIAL (Isaaru) or TALK (Braska, Natus)
- Expected: Every name that can be shown is shown in full; a hint may shorten, a label may not (CHK-009).
- Observed: With the cursor on SPECIAL the row prints 'SPECI...  x2  Open the Special ...': the label loses its last letters before the hint does. On TALK the hint ends 'A one-off action this...'. In round 31 the Braska and Yuna rows (old HUD) printed TALK and SPECIAL whole. The builder traces it to the F1 row's label against its x2 badge and inline description (docs/handoff/booth-b3.md 12.4); I did not trace the CSS line. ROUND 32b ADDITION (G2 layout sweep): Instrument confirmation on the live bundle: sweep.mjs battle, Isaaru, 1600x900, first menu: .ffx-cmd__label 'Special' sw 53 / cw 47 on three surfaces (out-battle.json results['isaaru-via-purifico']); the four other FFX F1 chapters swept (Yunalesca, Braska, Anima, Natus) and the four FFX-2 chapters (Bahamut, Leblanc, Trema, Den of Woe) cut no label at the first-menu cursor state. The TALK-row hint cut on Braska and Natus is a different cursor state and was not reproduced by this sweep (kept as filed). ROUND 32b ADDITION (G4): The same cut is on Chapter I (FFX, F1 since earlier releases) at every TEXT SIZE: SPECIAL (x4) reads 53 px of text in a 47 px box, SWITCH (x4) 49 in 40, and the inline description is cut as well; the F1 CSS did not change between releases 69 and 70, so in Chapter I the cut is older than the candidate. The candidate tags below are right for the chapters the F1 HUD newly reached (Isaaru, Braska, Natus); they do not describe Chapter I. ROUND 33: Still open and now seen in a chapter release 71 newly treated: Evrae ORDERS prints "A one-off action this..." cut; Braska TALK the same; Isaaru "Special" label 53 px of text in a 47 px box on three sweep surfaces (the only clipped visible label of 57 surfaces and 4,507 elements). Second review at this severity with no change. ROUND 34 (build 2342fe666): Re-observed: Isaaru (XIV) "SPECI..." / "Open the Special ..." and Braska (III) TALK "A one-off action this..." at 1600x900. Chapter XVII's selected-row hint is whole because it draws in its own banner. Third review at the same severity: stalled.
- Repro: Real keys from the title: Chapter XIV, party prep, Start Battle, first menu, cursor on SPECIAL (1600x900, seed 1); Chapters III and X, TALK.
- Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png; critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/seymour-natus-win-r32/12-intent-E.png; critic/rounds/round-32/gaps-G2-layout/battle-a/gaps/sweep/out-battle.json; critic/rounds/round-32/gaps-G2-layout/battle-a/gaps/sweep-battle-isaaru-via-purifico/01-battle-menu.png; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-33/evidence/gaps/sweep/out-battle.json; critic/rounds/round-33/evidence/evrae-airship-win-r33/12-intent-E.png; critic/rounds/round-33/evidence/braskas-final-aeon-win-r33/12-intent-E.png
- Confidence: high that it shows; medium on the cause
- Requirement: CHK-009
- Smallest fix: Let the label keep its width and truncate the inline description first.
- Acceptance check: The label prints whole on every selected row of the three chapters at 1600x900 and 2000x1012.
- Carried from: round-32b; last seen round 34

### PR-0585 [minor] visual - Approved backdrops are graded much darker in the treated chapters (Leblanc, Braska, Macalania, Natus, and now Yojimbo, treated in release 72): a question for Bailey, not a replacement

- Status: open
- Game / chapter / state: both / treated chapters (Leblanc, Braska, Macalania, Natus and the other booth chapters) / battle arenas, releases 69 and 70, 1600x900
- Expected: Approved art stays recognisable in the running game; Bailey judges the grade.
- Observed: The grade is the intended booth treatment, but Leblanc's backdrop C reads dark magenta, Braska's red sky near black and Macalania dim blue in battle. The handoff (booth-ffx-b3b J6) says a still beside Chapter I is owed before Bailey judges it. ROUND 33: Chapter IX Yojimbo (release 72): the approved cold grey-blue chamber with a shaft of daylight shows only a faint light shaft over a near-black void in the build (evidence/yojimbo-cavern-win-r33/23-midfight.png against targets/yojimbo-chamber.jpg); Yojimbo himself matches the approved boss A. Same family as the earlier four; Bailey still has not judged J6. ROUND 34 (build 2342fe666): Yojimbo's chamber is a near-black void against the approved cold grey-blue chamber, Leblanc's hall reads dark magenta against backdrop C, Macalania a dim teal; Yojimbo himself matches. Bailey's call; no replacement proposed.
- Repro: Compare critic/rounds/round-32/targets/leblanc-backdrop.jpg and critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg.
- Evidence: critic/rounds/round-32/targets/leblanc-backdrop.jpg; critic/rounds/round-32/targets/macalania-backdrop.jpg; critic/rounds/round-32/targets/natus.jpg; critic/rounds/round-33/targets/yojimbo-chamber.jpg; critic/rounds/round-33/evidence/yojimbo-cavern-win-r33/23-midfight.png
- Confidence: medium
- Requirement: approved-target gate; Bailey judgment
- Smallest fix: Show Bailey the still beside Chapter I (job J6) and take his verdict. No change before that.
- Acceptance check: Bailey's recorded verdict on the arena grade.
- Carried from: round-32b; last seen round 34

### PR-0227 [minor] encounter - Trema's real route lost seed 1 twice this round (a win in round 32); the fight stays a coin-flip-plus at human pace (carried from rounds 25 to 27)

- Status: open
- Game / chapter / state: FFX-2 / XIII ffx2-trema / real keys, advisor's pick each turn, seed 1
- Expected: A 999,999 HP superboss is allowed to be hard (research/ffx2-trema.md); the win rate for a competent human should sit where the sources put it. Round 32 recorded about 60 percent at human pace.
- Observed: Defeat at turn 217 with Trema at 24,313 of 999,999 HP, and a second defeat at turn 30 inside the Paragon link; seed 2 won in 229 turns (21:07). The engine measure is unchanged and md5-identical to round 32 (intended line 71 of 100 seeds). The pinned seed does not pin the outcome because FFX-2 plays in real-time ATB. Reached the pro-defeat screen both times.
- Repro: Chapter XIII, default party, advisor's NEXT BEST MOVE each turn, setSeed(1); bench: tests/unit/ffx2-parity-measure.test.ts with PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-100.
- Evidence: critic/rounds/round-33/evidence/ffx2-trema-win-r33/run.json; critic/rounds/round-33/evidence/ffx2-trema-win-r33-s2/run.json; critic/rounds/round-33/audit-combat/ffx2-measure-cand-1-100.json
- Confidence: high
- Requirement: encounter authenticity and balance
- Where (only if traced): src/data/ffx2/enemies/trema.ts is sourced and correct; a balance question
- Smallest fix: No change without Bailey's yes (boss-side numbers are never tuned without measured options); if he wants it gentler, build and measure the sourced alternatives and ask once.
- Acceptance check: ffx2-parity-measure seeds 1-100 for the chosen option, win rate named against the research.
- Carried from: new this round; last seen undefined

### PR-0592 [minor] harness - Mirror Aeons needs about 20 minutes of fight, above the route harness default budget of 15 minutes (the first run stalled at link 2; the 40-minute rerun won in 20.3 min)

- Status: open
- Game / chapter / state: FFX / mirror-aeons / route.mjs mirror-aeons win --seed=1
- Expected: The route budget covers the longest chapter.
- Observed: First run stopped at the budget on link 2 (162 turns, 900 s); the rerun with --budget=2400000 won in 20.3 min. Round 31 measured 19.8 min. ROUND 33: Round 33: the first Mirror Aeons run again stopped at link 2 when the capture budget (901 s, 163 turns) ran out; the rerun with a 3,000 s budget won in 209 turns and 1,137 s (19 min 19 s). A harness budget, not a stall. ROUND 34 (build 2342fe666): Mirror Aeons stalled at link 2 at the 15-minute harness default again (164 turns) and won at a 50-minute budget (209 turns, 20.1 min).
- Repro: route.mjs mirror-aeons win --seed=1, default budget, then with --budget=2400000.
- Evidence: critic/rounds/round-32/evidence/mirror-aeons-win-r32/run.json; critic/rounds/round-32/evidence/mirror-aeons-win-r32b/run.json
- Confidence: high
- Requirement: harness
- Smallest fix: Add mirror-aeons to LONG_FIGHT_BUDGET_MS in critic/runner/lib/route-pure.mjs.
- Acceptance check: A default-budget run completes.
- Carried from: round-32b; last seen round 34

### PR-0607 [minor] delivery - From the battle slate to the first command menu takes a median 9.5 s (8.2 to 16.5 s) on a desktop and 8.2 to 12.7 s on the phone: 15 of 19 chapters are over the builder's own 8 s budget; Chapter I 15.8 to 16.5 s at six sizes

- Status: open
- Game / chapter / state: both / every chapter; Chapter I worst / unthrottled desktop, 1600x900 and five other sizes, seed 1, cache cold; host shared with other review lanes
- Expected: The builder's budget: 8 s and 50 MB on the phone profile; RUBRIC section 2 asks for a load under five seconds on named conditions.
- Observed: slateToMenuMs from the capture owner's gap runs: Chapter I 16.2 s at 1600x900, 15.8 s at 2000x1012, 16.3 s at 1280x720 and 3840x2160; Anima 14.1 s; Bahamut 11.7 s; the rest 8.2 to 11.7 s. The wait contains the intro slate and, in Chapter I, Seymour's opening Lance of Atrophy, and no round-32 baseline exists for this number. The cold title load is fine (0.7 s, 3.1 MB). The sweeps shared the host, so the figures are upper bounds. The delivery auditor rated this major; the chief rates it minor because it is an upper bound on a shared host against the builder's own budget, not a rubric limit, and the confirmer would keep it major only if an idle-host remeasure also fails.
- Repro: Fresh headless Chromium (PYREFLY_BROWSER=gpu), https://echoesofspira.com/, Enter twice at the title, pick Chapter I, Enter through prep and scene, time screen=battle to awaitingMenu (critic/runner/lib/gap-boot.mjs, slateToMenuMs).
- Evidence: critic/rounds/round-33/evidence/gaps/index.json; critic/rounds/round-33/evidence/gaps/coldload/out.json
- Confidence: medium
- Requirement: RUBRIC section 2 platform goals; delivery
- Smallest fix: Re-measure on an idle host and on the phone10 profile for Chapters I and IV; split the slate from the opening action in the capture; if still over, trim what the first fight preloads before the first command (suspected, not traced). Related: PR-0481, PR-0567, PR-0572.
- Acceptance check: Median first-command wait at most 8 s on an idle host in every chapter, recorded with the host CPU busy percent.
- Carried from: new this round; last seen undefined

### PR-0581 [minor] feel - R70-C1 Braska: the return-flip teleports are repaired (release 72 FlipFit: 3 teleports of 302 to 340 px to 0); mid-move dashes of 160.6 px remain over the 150 px acceptance line

- Status: open
- Game / chapter / state: FFX / Chapter III braskas-final-aeon / treated Chapter III, win by real keys, seed 1, 1600x900 (the dedicated continuity harness) and the orchestrator live-gap lane on the same bundle UNVtEttT; absent at ?treated=pack
- Expected: A move may not move a figure faster than the move itself: no single-frame plane step above the policy limit (CHK-027 item 4) and no dash over 150 px.
- Observed: Round-32 harness (braskas-final-aeon-win-r32): 3 mid-move teleports of Tidus of 340, 312.8 and 302.1 px in one frame (no pose swap, not a camera cut: all other figures step 20 px or less in the same frame; Tidus's own move speed is about 45 px a frame), 138 dashes over the fail line (worst 294.5 px). The live-gap lane (live70, 1,696.7 s) reads four teleports of 306 to 417 px in Energy Rain (worst 416.6 px) and 26 plain-Attack hops of 254 to 290 px straight up in one frame, against a live-69 control of 116 px at most; the pack arm's worst dash is 116.2 px. Round 31 (release 68) Braska had 0 teleports and a worst dash of 153.6 px. The focused review of this build (critic/reviews/e3f51bf18-focused.json) rated this polish from a three-seed read; the deep review reads the whole run, finds the player-visible size of it (a main character crossing a third of the screen in one frame, twice a fight, in the third chapter) and rates it major. ROUND 33: Fresh harness, Chapter III: 0 teleports (32b: 3), 42 dashes over 40 px, worst 160.6 px (32b: 294.5 px; acceptance line 150 px; seed 2 not run). The teleport half is verified fixed on this build; the dash remainder is carried under PR-0380 and this ticket stays open at minor until a second seed reads under 150 px. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Braska 0 mid-move teleports; 8 swap jerks of 40 px or more (worst 224.5 px); 40 mid-move dashes of 40 px or more, worst 162.8 px (reported, not gated).
- Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=braskas-final-aeon --goal=win --size=1600x900 --seed=1 --tag=r32; read continuity.json jerks of kind teleport (figure tidus, about 1195 s, frame 69853); compare with ?treated=pack.
- Evidence: critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/jerk-005-tidus.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/continuity.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-braska-live.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/braskas-final-aeon-win-live70/continuity/strips/jerk-000-tidus.jpg; critic/rounds/round-34/continuity/braskas-final-aeon-win-r34/continuity/continuity.json
- Confidence: high for the measurement and the strip; the cause is suspected
- Requirement: CHK-027 items 4 and 9, RUBRIC 6a; animation and camera sub-scores
- Smallest fix: Suspected cause (not traced to a line): the treated Braska hold in src/engine/motion/PieceHolds.ts lets Tidus's return flip draw 1.66x larger, which the plane-step reads as a jump. Smallest correction: hold the flip at the idle's size for the treated chapter (or take the Braska row out of PIECE_HOLDS) until the curves lane re-measures it.
- Acceptance check: Harness on braskas-final-aeon, seeds 1 and 2: 0 teleports of 300 px or more, no dash over 150 px, CHK-027 PASS for Tidus.
- Carried from: round-32b; last seen round 34b

### PR-0582 [minor] feel - R70-C2 KO floor slide: repaired in the two chapters re-measured on this build (Isaaru swap jerk 89.6 to 26.2 px, Anima/Macalania 80.3 to 0, release 72 SlideEase); Ixion (FFX-2 XVI) is now read: CHK-027 PASS, 0 swap jerks

- Status: open
- Game / chapter / state: FFX / Chapter XIV isaaru-via-purifico and Chapter VII seymour-anima-macalania / treated Chapters XIV and VII, win by real keys, seed 1 (and seed 2 in XIV), 1600x900
- Expected: A KO lands where the figure fell; the KO swap moves the feet less than 40 px in one frame (CHK-027 item 9).
- Observed: Harness: Ixion idle-to-KO feet jerk 89.6 px in Chapter XIV (frame 16224, about 274 s) and 80.3 px in Chapter VII (frame 14824, about 252 s); round 31 read 27.3 px and 0 px. The live-gap lane read 89.2 px (seed 1) and 90.8 px (seed 2) in XIV with the KO painting placed 355 px from the idle plane (ProneLay at its maximum) against minus 9 px at ?treated=pack. ?pro=off and ?pack=off do not remove it; ?hud=today shrinks the slide to 250 px and passes seed 1 but not seed 2 (86.4 px). Strip swap-233-ixion-idle-ko.jpg shows the lying body well to the right of the standing figure after a red blend. The finding is wider than the focused review's (Chapter XIV only). ROUND 33: Same-artifact focused run (reused: the bundle is byte-identical to live): Isaaru CHK-027 PASS at 26.2 px, Macalania 0 px. Round 33b: Ixion itself (ffx2-ixion-djose) is now read on this build by the full harness: CHK-027 PASS, 0 swap jerks (one KO swap, no step), 3 dashes over 40 px (worst 133.7 px, reported); so Isaaru, Anima and Ixion all read clean on swap jerks; the fan read of Ixion in the sphere-change sequence shows a leap and return with a see-through double outline (PR-0379) and no measurable hop (the sequence frames are not one frame apart; a one-frame teleport is NOT established and is withdrawn). ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Anima CHK-027 PASS (0 swap jerks), Isaaru PASS (worst 26.3 px), Ixion PASS (0 swap jerks); the KO slide repair holds in all three.
- Repro: Harness --chapters=isaaru-via-purifico (and seymour-anima-macalania) --seed=1 or 2; read swap jerks for figure ixion; compare ?treated=pack.
- Evidence: critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg; critic/rounds/round-32/continuity/seymour-anima-macalania-win-r32/continuity/strips/jerk-026-ixion.jpg; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s1.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s2.json
- Confidence: high for the measurement; medium for the cause
- Requirement: CHK-027 item 9 (a jerk at a pose swap is gated), RUBRIC 6a
- Smallest fix: Suspected: ProneLay (src/engine/motion) picks its maximum slide candidate under the treated holds' setProneAvoid areas. Smallest correction: cap the KO plane within 40 px of the standing plane, or ease it over the dissolve.
- Acceptance check: Harness on Chapters XIV (seeds 1 and 2) and VII: Ixion's swap jerk under 40 px.
- Carried from: round-32b; last seen round 34b

### PR-0604 [minor] interface - "Deals no damage." heads intent cards that then list damage (Yojimbo's Daigoro, Omnis's Mortiphasm Spells)

- Status: open
- Game / chapter / state: FFX / IX yojimbo-cavern, XII seymour-omnis / first menu, key E, seed 1
- Expected: A lead that says what the player will see ("Orders the dog; its bite lands on one of these"), with no "Deals no damage" above a damage block.
- Observed: Yojimbo's card reads "Daigoro SCRIPTED Deals no damage." directly above "DAMAGE - RANDOM TARGET LULU 544-615 ... Lands on one of these, picked when it acts." The order itself deals none (research/ffx-yojimbo.md) and the dog's bite lands on one character, so each half is true and the card reads as a contradiction. Present in round 32. ROUND 34 (build 2342fe666): Re-observed in Yojimbo (Daigoro) and Omnis (Mortiphasm Spells): "Deals no damage." heads a card that then lists LULU 544-615 etc.
- Repro: Chapter IX, seed 1, first menu, press E: evidence/yojimbo-cavern-win-r33/12-intent-E.png.
- Evidence: critic/rounds/round-33/evidence/yojimbo-cavern-win-r33/12-intent-E.png
- Confidence: high
- Requirement: CHK-004
- Where (only if traced): src/battle/ffx/intent.ts:330 (the string; the order-row branch is suspected)
- Smallest fix: Suppress "Deals no damage" when the row carries a follow-up or per-target damage block; use an order-specific lead for dog and trigger orders.
- Acceptance check: Yojimbo and Omnis E cards no longer print "Deals no damage" above a damage block; Sin "Drawn to Sin" keeps it.
- Carried from: new this round; last seen round 34

### PR-0605 [minor] interface - Evrae turns 68 to 80: the advisor wants "Potion -> Kimahri" nine times on a full-HP party and the played action is "Al Bhed Potion" on all three (suspected; no frame of the chip)

- Status: open
- Game / chapter / state: FFX / VIII evrae-airship / seed 1, Chapter VIII from turn 66
- Expected: A recommendation the actor can press as worded, on a target it helps; with nothing to heal the chip should offer the waiting move or a buff.
- Observed: turn-log entries 68 to 80 (identical in round 32): want {Potion, Kimahri, Items}, took "Al Bhed Potion"; battle-log seq 535 to 556 shows +1000 on Tidus, Wakka and Kimahri while all three are at full HP with no status. Either the chip names an item the list does not hold or the harness mapped the label; no frame of the chip at turn 68 exists. ROUND 34 (build 2342fe666): Re-observed: turns 68 to 80 want Potion for Kimahri (1250/1250) and play Al Bhed Potion; nine picks; still no frame of the chip.
- Repro: Chapter VIII Evrae, seed 1, follow the advisor from turn 66; data in evidence/evrae-airship-win-r33/turn-log.json 68 to 80 and battle-log.json seq 535 to 556.
- Evidence: critic/rounds/round-33/evidence/evrae-airship-win-r33/turn-log.json; critic/rounds/round-33/evidence/evrae-airship-win-r33/battle-log.json
- Confidence: low to medium (data only)
- Requirement: CHK-004
- Where (only if traced): src/engine/tactics (suspected, not traced)
- Smallest fix: Capture the chip at turn 68 first; if it reads Potion, derive the label and target from the row the menu offers and add a no-op-heal guard (suspected: src/engine/tactics).
- Acceptance check: A frame of the Evrae chip at turn 68 shows an item that exists with the target it will hit; no heal is advised at full HP.
- Carried from: new this round; last seen round 34

### PR-0606 [minor] interface - Vegnagun's Tail Beam card shows Yuna 1,126 and Paine 2,654 where the sourced rule is 31.25 percent of maximum HP (777 and 1,832); Rikku 1,766 matches (suspected; no played hit)

- Status: open
- Game / chapter / state: FFX-2 / V ffx2-vegnagun-shuyin / link 1, key E
- Expected: Card figures equal what the engine deals and the rule the guide states.
- Observed: Card: YUNA 1,126, RIKKU 1,766, PAINE 2,654 (Yuna 1238/2488, Rikku 4402/5652, Paine 4612/5862). The G card and src/data/ffx2/enemies/vegnagun-abilities.ts say 31.25 percent of maximum HP: 777, 1,766, 1,832. Yuna and Paine read 1.449 times higher. The tail never acted in this run, so no played hit settles it. ROUND 34 (build 2342fe666): Re-observed: Tail Beam card Yuna 1,126, Rikku 1,766, Paine 2,654, the same figures as 33b; no played hit read.
- Repro: Chapter V, seed 1, first menu, press E (ffx2-vegnagun-shuyin-win-r33/12-intent-E.png); run the engine's Tail Beam against the three targets.
- Evidence: critic/rounds/round-33/evidence/ffx2-vegnagun-shuyin-win-r33/12-intent-E.png
- Confidence: low (no engine run this round)
- Requirement: AGENTS.md rule 6 and CHK-004
- Where (only if traced): src/battle/ffx2 intent estimate against abilities-vegnagun (not traced)
- Smallest fix: Run the engine's Tail Beam on Yuna and Paine at those HP; correct whichever of card, engine or guide sentence is wrong.
- Acceptance check: Card, guide and engine agree for all three.
- Carried from: new this round; last seen round 34

### PR-0610 [minor] feel - Phone: the first-time dress-change coach card covers the upper half of the fight, with the party and Bahamut behind it, while the gauges keep running, until it fades on its own

- Status: open
- Game / chapter / state: FFX-2 / IV ffx2-bahamut, 390x844 touch, first dress-sphere change / touch run, first Change command
- Expected: A first-time hint that does not hide the action it describes, or that holds the clock while it is up on a phone.
- Observed: The card ("Rikku: New dress, new moves ... pick the gate that pays.", FADES ON ITS OWN, FIRST TIME ONLY) sits over the battle in all ten sampled frames of the change sequence (seq-spherechange f00 to f09, f04 read by the chief) under the banner "GAUGES RUNNING - A COMMAND HOLDS THEM". The first-time fan rated it critical; the chief rates it minor: it appears once, fades by itself, hides no control and does not stop play. The Active-mode clock continues behind it, which is the reason it is worth a decision.
- Repro: 390x844 touch, Chapter IV, seed 1, open CHANGE for the first time.
- Evidence: critic/rounds/round-33/evidence/ffx2-bahamut-win-r33-phone-touch/seq-spherechange/f04.jpg
- Confidence: medium
- Requirement: CHK-008, first-time fan (D-423)
- Where (only if traced): phone coach card layout; not traced
- Smallest fix: Dock the card at the bottom of the phone screen, or shorten it to one line; keep the fade.
- Acceptance check: The party and the boss are visible in every frame of the first Change sequence at 390x844.
- Carried from: new this round; last seen undefined

### PR-0460 [minor] combat - Chapter III possession links 3 to 6 Summon rows still not seen in a browser this round (carried; reused from round 30b under a written argument)

- Status: open
- Game / chapter / state: FFX only / braskas-final-aeon / links 3 to 6
- Expected: Seen by real keys.
- Observed: Carried: the real-key Braska run (284 turns, 6 seams) used Summon once (Bahamut, link 1); links 3 to 6 never opened the Summon or Grand Summon rows. The engine probe ch3 shows every row enabled with a picker of five aeons (md5-identical to round 31). ROUND 33: Gap pass, browser read at Chapter III link 3 (possessed Ifrit; the link was reached with the labelled autoBattle and fast-speed hooks, switched off before the capture): Yuna's menu shows OVERDRIVE READY and no Summon row; opening it shows "GRAND SUMMON - NO AEON AVAILABLE - CANCEL TO GO BACK" with Ixion, Shiva and Bahamut as greyed empty bars, which matches scriptCommandDisables and research/ffx-bfa-yu-yevon.md section 7 (the roster is exhausted during the possessed-aeon links). The engine probe ch3 of this round reports every row enabled for links 3 to 6, so probe and browser disagree and nobody has reconciled them. Links 4 to 6 were not reached in a browser. Not a player-facing defect as far as read; the evidence gap stays open. ROUND 34 (build 2342fe666): Unchanged and not re-tested in a browser.
- Repro: As round 30b.
- Evidence: critic/rounds/round-30/gaps2; critic/rounds/round-33/evidence/gaps/braska-summon-rows3/07-yuna-down.png; critic/rounds/round-33/evidence/gaps/braska-summon-rows3/rows.json
- Confidence: medium
- Requirement: CHK-023
- Smallest fix: As carried.
- Acceptance check: As carried.
- Carried from: round-32b; last seen round 34

### PR-0539 [minor] harness - Critic harness limits (carried): the phone Items list is 6 rows of 27 for the route, timed sequences carry no frame timestamps, the capture owner's retry folder for Chapter IV mixes runs and its images are not indexed (R31-U1), and the cardFirst advisor measurement describes a card not on screen (R31-INT-09)

- Status: open
- Game / chapter / state: both / critic runner / tools
- Expected: One run per folder, every image indexed.
- Observed: Carried and widened: the phone Items list is 6 rows of 27 for the route and the harness never taps the page button (PR-0483); the route budget misses Mirror Aeons (PR-0592); the post scene still is taken before the scene (PR-0593); the engine logs of Vegnagun, Ixion, Sin core and Sin face end before the final victory event and the run.json fight step reads 'undecided' (those four victories rest on the results screen text, which reads Victory with the clear time). ROUND 33: Round 33 again: the 390x844 Chapter I touch run lost at turn 35 where the desktop run wins at 53 (identical to round 32); the touch bot took Attack because it could not reach Poison Fang. The route reached the defeat results, RETRY, party prep and a second battle on touch. Chapter IV on touch wins in 60 turns.
- Repro: ls --time-style=full-iso on the folder against run.json.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
- Confidence: high
- Requirement: CHK-016
- Smallest fix: Re-run into a clean folder with the images indexed.
- Acceptance check: A folder whose run.json and images share one run and are in index.json with verified true.
- Carried from: round-32b; last seen round 33

### PR-0594 [minor] prep - Mirror Aeons results row prints 'S.LV 180 - 28,000/22,000 AP' with no Sphere Level gain

- Status: open
- Game / chapter / state: FFX only / mirror-aeons / Mirror Aeons (Chapter XII) win by real keys, seed 1, 1600x900, results screen
- Expected: Either a +S.Lv badge with a remainder under the threshold, or an AP figure that matches the level maths; never a bar above its own limit. Which number is the game's is for the sources to settle (research/ffx-mirror-aeons.md lists the sisters at 10,000 AP each, 12,000 on Overkill); not invented here.
- Observed: After a won Mirror Aeons run (FFX, 209 turns) the results card shows AP 28,000 x3 party and each row 'S.LV 180 / 175 / 170 - 28,000/22,000 AP +28,000 AP' with no '+1 S.Lv' badge. A progress readout above its own threshold contradicts itself: the rule in src/battle/ffx/results.ts (apForLevel capped at 22,000, levels gained while banked is at least the cost) would give a level, and Omnis, the same game and the same rule, shows 24,000 AP as '+1 S.Lv, 2,000/22,000'. The battle log's link-1 result carries sphereLevelsGained 0 for all three with ap 20,000 while the displayed AP is 28,000 (the chain's two links paid 20,000 and 8,000); suspected cause: the level count is made from the last link's own AP while the screen shows the pooled total. The same string is in the round 30 and round 31 continuity runs, so it is old, not new. ROUND 33: Confirmed on the live bundle again (Mirror Aeons results resultsText: "S.LV 180 - 28,000/22,000 AP" with no Sphere Level gain).
- Repro: Real keys from the title: chapter select to Mirror Aeons (Chapter XII), seed 1, win both links (about 20 minutes), read the results card (critic/rounds/round-32/evidence/mirror-aeons-win-r32b/31-results.png, run.json resultsText).
- Evidence: critic/rounds/round-32/evidence/mirror-aeons-win-r32b/31-results.png
- Confidence: medium (the display is observed; the cause is suspected, not traced)
- Requirement: RUBRIC section 6 prep: understandable results
- Smallest fix: Make the level count and the displayed AP come from the same total in a pooled or chained FFX result (src/battle/ffx/results.ts sphereLevels against src/ui/common/resultsMath.ts sphereGridDetail), then re-read against the research rows.
- Acceptance check: Mirror Aeons win: every member row has remainder below its threshold or a +S.Lv badge; Omnis and Sin core rows unchanged.
- Carried from: round-32b; last seen round 33

### PR-0583 [minor] visual - Braska 23-midfight: at a command moment the aeon is mostly out of frame under the turn order and the red sky reads near black (CHK-011 FAIL)

- Status: open
- Game / chapter / state: FFX / Chapter III braskas-final-aeon / treated Chapter III, real keys, seed 1, 1600x900, capture 23-midfight
- Expected: The headline boss's head and torso are inside the frame at every command moment (CHK-011).
- Observed: Only the aeon's sword and shoulder show at the top right under the turn order; round 31's frame of the same capture step showed the whole aeon under a red sun. The other frames of the chapter (first menu, targeting, link seams) show the boss well. ROUND 34 (build 2342fe666): Visual auditor read the Braska midfight frame (aeon's shoulder and head only), Chapter I (small dim Seymour) and Chapter II (Yunalesca behind the HP plates) as in 33b; the confirmation pass did not independently reproduce it, so it stays minor.
- Repro: Chapter III, real keys, seed 1, 1600x900; capture 23-midfight.
- Evidence: critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/23-midfight.png; critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg
- Confidence: medium
- Requirement: CHK-011
- Smallest fix: Check the treated pro-camera shot for the second form against the form's height, or add a CHAPTER FRAMING row.
- Acceptance check: At every command moment of the chapter the boss's head and torso are inside the frame.
- Carried from: round-32b; last seen round 34

### PR-0587 [minor] delivery - Retry after a loss inside a later link of a chained chapter is UNVERIFIED on the release 69 and 70 build

- Status: fixed (verified round 32b)
- Game / chapter / state: both / Chapter VI Leblanc (new), Chapter III Braska link 3 and later, Vegnagun, Trema, Sin core, Mirror Aeons / lose then TRY AGAIN in a chain on e3f51bf18
- Expected: The retried link starts at the checkpoint with its own boss in the ribbon, a clear staging layer, music, a first menu, and the earlier links' rewards summed (PR-0138).
- Observed: Releases 69 and 70 changed the chain runner (setHeadlineBoss per link), the presenter's run (stageLinkBegins clears the staging layer from link 2) and BattleScreen.releaseParts. Loss and TRY AGAIN was re-shown on this build only in single-link Chapters I and IV. No capture lost link 2 or later of a chained chapter and pressed TRY AGAIN. Nothing observed failing; unit tests booth-leblanc-chain and chain-checkpoint pass. ROUND 34 (build 2342fe666): The Keeper and Maesters retries were read on a desktop in both games (7.8 s and 5.8 to 6.1 s), which closes the mechanism gap; a listed FFX-2 chapter (Chapter IV) desktop lose-then-retry with card frames is still not read.
- Repro: Real keys, Chapter VI Leblanc: win link 1, lose link 2 (idle), CONFIRM, TRY AGAIN; read the ribbon, the first menu and the results sum. Repeat in Chapter III link 3 or later.
- Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-32/evidence/ffx2-bahamut-lose-retry/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/g3-summary.json; critic/rounds/round-32/gaps-G3-chains-overlays/g3-extension-summary.json
- Confidence: medium
- Requirement: CHK-022
- Smallest fix: Add a lose-and-retry capture in Leblanc and Braska link 3 to the next review.
- Acceptance check: Retry reaches a first menu of the retried link in about 10 s, the ribbon names that link, 0 console errors, the results sum the earlier links.
- Carried from: round-32b; last seen round 34

### PR-0588 [minor] audio - The sound pass (+4 dB makeup, -14 dB voice duck, layered hits) now plays in ten chapters but its level was measured only in Chapters I and IV

- Status: open
- Game / chapter / state: both / FFX II, III, VII, X, XIV; FFX-2 VI, XIII, XV (the treated chapters) / desktop, live, seed 1
- Expected: Short-term loudness median about -16 to -14 LUFS, true peak at or under -1 dBTP and every voice line at least +6 dB over the music in the treated chapters too (passMix.ts targets).
- Observed: Releases 69 and 70 changed audioNewOn() to isTreatedChapter(run,'audio') (src/audio/pass/passSwitch.ts:72); no PIECE_HOLDS row holds 'audio', so the pass runs in every treated chapter. passMix.ts states its numbers came from Chapter I and IV recordings. The capture evidence holds no loudness, true-peak or voice-over-music reading for the other chapters. The safety shaper bounds the peak by design, but the live result is not shown. ROUND 34 (build 2342fe666): Still unmeasured: no loudness, true-peak or voice-over-music reading from the running game for the treated chapters, including Chapter XVII added in release 74.
- Repro: Play Chapters II, III and VI with the master tapped (window.__pyrefly.audioPass() reports makeup and trim) and run the existing measure tools against a Chapter I fight.
- Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-omnis-win-r32/audio-debug.jsonl
- Confidence: medium (reach proved from code, level unmeasured)
- Requirement: CHK-001 (anything an agent cannot perceive gets a technical gate), CHK-023
- Smallest fix: Record one fight each in Chapters II, III and VI and one more FFX-2 chapter, run tools/audio measure, and either confirm the targets or give the chapter its own makeup row. Measurement first; no change until read.
- Acceptance check: A measurement file per chapter in the review folder inside the targets.
- Carried from: round-32b; last seen round 34

### PR-0589 [minor] feel - First-time fan: Yuna's dress change is a one-frame swap of a small hooded figure for a taller Warrior under a flash and a label, with Ixion see-through and doubled in the same frames

- Status: open
- Game / chapter / state: FFX-2 only / Chapters V, XV, XIII dressphere change (Yuna white mage to Warrior) / dressphere change during an enemy action, ATB, seed 1
- Expected: A transformation reads as one continuous move; no label over readable text.
- Observed: Fan sheets of ffx2-vegnagun-shuyin, ffx2-ixion-djose and ffx2-den-of-woe spherechange: the white mage is replaced in one frame by the Warrior, who reads taller and a step forward; the 'Yuna Warrior GATE Blue' label sits on the guide text for a few frames; in the Ixion strip Ixion is a see-through double then jumps in front of the party. The harness counts four costume swaps (worst head 50.2 percent, feet 23.1 px) separately from same-art swaps. A dress change is a designed transformation, so the size change is partly intended; whether the pop is the look Bailey wants is his call. ROUND 34 (build 2342fe666): Fan lens, again: Yuna goes from a small white-mage figure to a bigger warrior figure in one frame (Vegnagun seq-spherechange f02 to f03); Rikku changes in Ixion (f04 to f06) and Leblanc (f05 to f06).
- Repro: FFX-2 Chapter V or XV, Change to Warrior on Yuna; read seq-spherechange.
- Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-ixion-djose-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-den-of-woe-win-r32__seq-spherechange.jpg
- Confidence: low to medium (strips read by a fan reviewer, not strip-by-strip by the chief)
- Requirement: CHK-026 (costume swaps), CHK-027 item 6; first-time-fan lens (D-423)
- Smallest fix: Ask Bailey whether the dress change should be a blended or held transformation; no change until he answers.
- Acceptance check: Bailey's verdict on the Yuna dress-change strip.
- Carried from: round-32b; last seen round 34

### PR-0590 [minor] delivery - Chapter I retry reaches the first menu in 9.7 s, double round 31's 4.9 s (one noisy lane; Chapter IV 9.9 s against 10.2 s)

- Status: open
- Game / chapter / state: both / Chapter I and IV retry / seymour-flux-lose-retry, real keys, 1600x900
- Expected: Retry no slower than the previous live build.
- Observed: TRY AGAIN to first menu 9,747 ms (pro-defeat, party-prep, battle), defeat panel 974 ms after the last KO. The capture shared the machine with other lanes, so this is low confidence.
- Repro: Lose Chapter I on seed 1, press Enter on TRY AGAIN, time to the first command menu on a quiet machine.
- Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json
- Confidence: low
- Requirement: respectful skip and replay pacing
- Smallest fix: Re-measure on a single quiet lane; if it holds, look at release 69's load order for the party-prep step on a retry.
- Acceptance check: Single-lane real-key retry of Chapter I in 6 s or less to the first menu.
- Carried from: round-32b; last seen undefined

### PR-0571 [minor] interface - Phone FFX-2 enemy-move line abbreviates the party to 'Yun / Rik / Pai' (new in r68; trades round 30's split figure for abbreviated names)

- Status: open
- Game / chapter / state: FFX-2 only / Chapter IV, 390x844 touch / first menu and CHANGE list
- Expected: Names whole where they fit (CHK-009), figures not split.
- Observed: Round 30 (r66) printed 'YUNA 168-190 / RIKKU 92-104 / PAINE 115-' with the last range broken over two lines; r68 prints 'Yun 168-190 / Rik 92-104 / Pai 115-130' on two rows and 'ACTS NEXT' became 'NEXT'. The figures are whole now; the names are abbreviated although the row has room (about 100 px free). The FFX line keeps full names. Chief read scratch/phone-intent-cmp.png.
- Repro: 390x844 touch, Chapter IV, first menu.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-31/scratch/phone-intent-cmp.png
- Confidence: high
- Requirement: CHK-009, CHK-020
- Smallest fix: Keep full names and wrap by pair, or abbreviate only when a name does not fit its slot.
- Acceptance check: Yuna, Rikku and Paine whole at 390x844 with no figure split.
- Carried from: round-32b; last seen undefined

### PR-0572 [minor] delivery - Release 68's load-diet claim is not shown by the first-command job (bytes and wait equal release 67's within noise)

- Status: open
- Game / chapter / state: both / seymour-flux, ffx2-bahamut / desk50 and phone10
- Expected: The measured wait or bytes fall, or the note does not claim it.
- Observed: Wire bytes to the first menu 110.31 / 112.03 MB against 110.34 / 111.89 (desk50) and 93.56 / 94.04 against 93.65 / 92.19 (phone10); load wait 5.92 / 4.44 s against 6.03 / 4.53 and 19.8 / 42.4 against 20.1 / 39.2. The release note says the first menu no longer waits for every pose; the handoff says it changes what the menu waits for, not what is fetched.
- Repro: critic/reviews/2a9340249-focused/budgets first-command-*-cand68.json against *-r67.json; also with ?loaddiet=off.
- Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json
- Confidence: medium
- Requirement: RUBRIC section 5 (match proof to the claim)
- Smallest fix: Run the pair default vs ?loaddiet=off on phone10 and say which is which, or reword the player note.
- Acceptance check: Paired run shows the stated difference or the note is changed.
- Carried from: round-32b; last seen undefined

### PR-0573 [minor] delivery - Page memory climbs 60 to 110 MB with every chapter change, no plateau in five visits (434 to 700 MB at the board; tree peak 3,225 MB); the focused review rated it major

- Status: open
- Game / chapter / state: both / seymour-flux and ffx2-bahamut / five visits with the board between, desk50
- Expected: Memory settles (cache caps 96 paintings / 900 MB; texture governor 2,600 MB).
- Observed: chapter-memory job: 434, 440, 511, 624, 700 MB at the board; JS heap flat (24.7 to 31.4 MB); growth 74 percent against a proposed 10 percent budget (r67: 321 to 642, 85 percent). DOM at the board is flat from the third visit (r67 rose), but the gap pass still reads CDP nodes +485 a visit (223 detached, no HUD classes). No failure observed; the budget is proposed, not owner-approved, so the chief rates it minor.
- Repro: critic/reviews/2a9340249-focused/budgets chapter-memory job; run to eight or more visits.
- Evidence: critic/reviews/2a9340249-focused/budgets/chapter-memory-desk50-cand68.json
- Confidence: medium
- Requirement: RUBRIC section 2 and 6 (stability)
- Smallest fix: Extend the job to eight changes and trace which cache holds the growth (the JS heap is not it).
- Acceptance check: Growth between visit 4 and 8 within 10 percent, tree peak at most 3,500 MB.
- Carried from: round-32b; last seen undefined

### PR-0580 [minor] delivery - Frame-time outliers: Chapter I worsens for the third build running (p99 32.5 to 35.9 to 41.2 ms) with a 4.7 s frame at the first Yuna cast; Yunalesca one 5,610 ms frame in round 33b (extends PR-0566, PR-0544)

- Status: open
- Game / chapter / state: both / yunalesca, mirror-aeons, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-trema / continuity probe, 1600x900, GPU
- Expected: BUDGETS B4a to B4c: at least 59.5 fps, p99 at most 25 ms, at most 0.5 percent over 34 ms in every chapter.
- Observed: frameTime.maxMs 5,609.7 (Yunalesca, longFramePct 2.6, fps 56.2), 1,026.2 (Mirror Aeons), 704.5 (Braska), 481.5 (Vegnagun; r66 446); Trema p99 74.7 ms, 2.3 percent over 34 ms, 56.7 fps (r66 71.2 ms, same). Other chapters 59.5 to 60 fps with p99 19 to 39 ms. The combat auditor's unit suite ran on the same host during the harness, so a host stall is possible for the 5.6 s frame: not shown either way (harness frameP99MsIsPacing false). ROUND 33: Fresh harness frame times: Yunalesca 55.6 fps, p99 64.3 ms and one 12,140 ms frame (32b: 5,610 ms, 56.9 fps, p99 41.7 ms); Flux 58.2 fps and a 1,419.5 ms frame; Braska 59.0 fps, p99 36.0 ms, max 677.6 ms (focused run on the same bundle: 722.9 ms); Bahamut 59.1 fps, max 168.2 ms. The host was shared with other review lanes (Mirror Aeons rerun, Trema seed 2) while the harness ran, so the 12.1 s frame may be host contention; it is not proven to be the game. ROUND 33B: Full harness frame times, 19 of 19 chapters: 55.6 to 59.9 fps. The tails: Trema 56.1 fps, p99 89.1 ms, 2.5 percent of frames over 34 ms; Yunalesca 55.6 fps, p99 64.3 ms, 3.6 percent; Bahamut 59.1 fps, p99 43.4 ms; Leblanc 59.3 fps, p99 39.0 ms; Braska 59.0 fps, p99 36.0 ms; Flux 58.2 fps, p99 35.9 ms. The longest frames: Yunalesca 12,140.1 ms, Flux 1,419.5, Mirror Aeons 943.4, Braska 677.6, Vegnagun 645.9. The other 13 chapters read 59.5 to 59.9 fps with p99 19.6 to 29.4 ms. ROUND 34 (build 2342fe666): Chapter I dedicated live run: 57.4 fps, p50 16.7, p90 20.8, p99 41.2 ms, 460 frames over 34 ms (1.7 percent) and a 4,695 ms frame at t = 91.7 s on Yuna's first cast (idle to cast swap, camera cut), against p99 35.9 ms, 1.2 percent, longest 1,420 ms in round 33 and p99 32.5 ms, 0.8 percent, longest 382 ms in round 32: a three-build worsening in the same chapter on a dedicated host. One occurrence, repeat rate unknown; cause suspected in releases 73 and 74 strike/hold code, not traced. The other 18 chapters have no round-34 frame data.
- Repro: Continuity harness, Yunalesca and Trema, seed 1, host idle.
- Evidence: critic/rounds/round-31/continuity/yunalesca-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/continuity-summary.json; critic/rounds/round-33/continuity/continuity-summary.json; critic/rounds/round-34/continuity/seymour-flux-win-r34/continuity/continuity.json
- Confidence: medium for the numbers, low for cause
- Requirement: RUBRIC section 2 (60 fps, report spikes)
- Smallest fix: Re-run Yunalesca on an idle host to settle the 5.6 s frame; per-frame trace of Trema against battle clock and phase (PR-0544).
- Acceptance check: Yunalesca max frame under 500 ms on an idle host; Trema p99 at most 25 ms.
- Carried from: round-32b; last seen round 34

### PR-0565 [minor] delivery - A renderer crash again: the chief's Chapter VI gap run (Leblanc) ended in "Page crashed" after about seven minutes of polling an empty menu (extends PR-0565)

- Status: open
- Game / chapter / state: FFX-2 / ffx2-leblanc / headless Chromium gpu, live, enemy turns with the command menu closed
- Expected: No renderer crash in a long session.
- Observed: r31: the chief's Chapter VI gap run ended in 'Page crashed' once. Round 32 added 3 full Leblanc fights at 2560x1440 (seeds 1, 2 and 3, GPU mode, crash, pageerror and console-error listeners on): all reached results in 305 to 319 s with 0 crashes and 0 console errors. Together with the 0 of 21 earlier runs the crash is unreproduced in 0 of 24. That is not proof of absence; the first-menu command row at 2560x1440 was captured but not judged separately.
- Repro: critic/rounds/round-31/gaps-chief/th-probe.mjs ffx2-leblanc with the Defend branch removed (the menu never reopens).
- Evidence: critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-probe.json; critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-s1
- Confidence: low
- Requirement: RUBRIC section 2 (stability)
- Smallest fix: Capture the renderer's crash dump on the next occurrence; the long-session memory growth (PR-0573) is a suspect.
- Acceptance check: No crash across ten 10-minute idle runs.
- Carried from: round-32b; last seen round 32

### PR-0479 [minor] visual - Chapter I action shot: the humanoid Seymour's upper body leaves the top of the frame under the turn order (the creature's head is inside; the confirmer refuted the 'head cropped' wording)

- Status: open
- Game / chapter / state: FFX only / seymour-flux / mid-fight, 1600x900
- Expected: Outside an intended close-up the boss stays in frame.
- Observed: In 23-midfight.png the Mortiorchis head with spines and jaw is wholly inside the frame (about y 20 to 300); the humanoid torso at the right runs off the top edge and the turn-order icons overlap it. In seq-party-action f02 the same figure is cropped at the top. Carried at minor since round 30; the auditor's raise to major is not supported.
- Repro: Chapter I by real keys, seed 1, first attack.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/23-midfight.png; critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f02.jpg
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Lower the action camera for this boss or move the turn order off the quad.
- Acceptance check: Same state: the torso is wholly inside the frame.
- Carried from: round-32b; last seen undefined

### PR-0530 [minor] feel - Question for Bailey: hard cuts rose from 75 to 3,864 (22 a minute) because ?swapscope=wide turned the planned smear cuts on in 13 more chapters; the fan reads them as camera jerks and pops (Chapter I battle start, the Chapter IV sphere change, Braska seams)

- Status: open
- Game / chapter / state: both / all; fan captures in seymour-flux, ffx2-bahamut, braskas-final-aeon / continuity run and the fan's strips
- Expected: Bailey's judgment of the planned smear cuts and the pro camera shots (PR-0530, PR-0521).
- Observed: Unchanged: 3,990 planned hard cuts in 10,638.5 s (22.5 a minute), 4,772 smears planned, 4,606 swaps smeared. Awaiting Bailey's verdict on the look. ROUND 33B: the full run reads 3,939 hard cuts in 11,220.8 s (21.1 a minute), 4,674 smears planned and 4,556 swaps smeared.
- Repro: Chapter I and IV by real keys; see the fan's captures seq-transition-into-battle and seq-spherechange.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/continuity/continuity-summary.json
- Confidence: medium
- Requirement: RUBRIC 6a (the definition of a jerk is Bailey's, D-420 to D-426)
- Smallest fix: Show Bailey the strips and ask; build nothing until he answers.
- Acceptance check: A recorded verbatim judgment.
- Carried from: round-32b; last seen round 33b

### PR-0534 [minor] visual - Lulu's rig head reads 5 to 20 percent different at ready, cast and idle in the FFX chapters (397 of the 415 CHK-026 head fails in the full round 33b read; about 470 of 476 in round 31; likely the head part's box, not a visible jump)

- Status: fixed (verified round 34b)
- Game / chapter / state: FFX only / Chapters II, III, VII to XIX with Lulu / continuity harness
- Expected: The harness reads the head from the part's own box.
- Observed: headRig 920 swaps read from the rig's own head mesh; the chapter strips show no visible jump. Harness head fails 476 (round 30b 489). ROUND 33B: headRig 916 swaps read from the rig's own head mesh in the full run; 397 of the 415 head fails are Lulu (Mirror Aeons 164, Sin core 113, Sin face 46, Braska 42, Evrae 19, Yojimbo 13), 15.5 to 19.7 percent against 0.1 to 0.2 percent where the head is registered. Evrae, Yojimbo, Sin core, Sin face and the Mirror Aeons have no other CHK-026 reason. The strips still show no visible jump. Still a suspected measurement artifact; severity unchanged. ROUND 34 (build 2342fe666): Release 74 RigHeadHold: repaired where re-read (Evrae 0.1 percent, Omnis, Sin core CHK-026 PASS 6.1 percent). Not re-read in Yojimbo, Sin face or the Mirror Aeons (no harness reading on this build); stays open at minor for those. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Lulu's rig head is repaired and verified: 861 swaps were read from a rig's own head mesh in 19 chapters and none is over tolerance (the worst is 0.7 percent against the 3 percent tolerance); the 16 head swaps over tolerance are Braska's 14 (the boss's mass reading and the victory close-ups) and Flux's 2 (Auron). Evrae, Yojimbo, Sin core, Sin face and the Mirror Aeons, which failed CHK-026 on her head alone in 33b, pass. Closed.
- Repro: Continuity harness, braskas-final-aeon, strip swap-172-lulu-ready-item.jpg (round 30b path).
- Evidence: critic/rounds/round-31/continuity/continuity-summary.json; critic/rounds/round-33/continuity/continuity-summary.json; critic/rounds/round-34/continuity/continuity-summary.json
- Confidence: medium
- Requirement: CHK-026
- Smallest fix: Read the rig head with its own box in critic/runner/lib/continuity-rig.mjs, or show the strips are not visible.
- Acceptance check: Lulu rig head swaps under 5 percent or shown not visible.
- Carried from: round-32b; last seen round 34b

### PR-0529 [minor] visual - FFX-2 Chapter XII (Trema): Paragon's feet move 10.5 px at the cast-to-idle swap with nine see-through frames and height x1.13 (carried)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-trema / Paragon cast to idle
- Expected: Feet within 2 px, a cut or a short blend.
- Observed: strip swap-147: two overlapped Paragons for nine frames, feet 10.5 px apart (22.2 px from the pixels); the only feet-over fail of the 19 chapters at that size. ROUND 33B: the full harness reads 16 Paragon feet moves over the 2 px line, worst 10.3 px (cast to hurt 5, hurt to cast 5, idle to cast 3, cast to idle 3); it is the only feet-over-tolerance figure outside Chapter III and the Chapter I victory-cheer swaps, and Trema's CHK-026 FAIL rests on it alone. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Trema CHK-026 FAIL on 16 Paragon feet moves (idle to cast 3, cast to hurt 5, hurt to cast 5, cast to idle 3), worst 10.4 px (33b: 16, 10.3); CHK-027 PASS (worst swap jerk 28.4 px); see-through 2,701 ms a minute.
- Repro: Continuity harness ffx2-trema, seed 1.
- Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/strips/swap-147-paragon-cast-idle.jpg; critic/rounds/round-33/continuity/ffx2-trema-win-r33/continuity/strips/swap-131-paragon-cast-hurt.jpg; critic/rounds/round-34/continuity/ffx2-trema-win-r34/continuity/continuity.json
- Confidence: high
- Requirement: CHK-026, CHK-027
- Smallest fix: Register Paragon cast and idle feet; shorten the blend on this boss.
- Acceptance check: Paragon swaps have 3 or fewer ghost frames, feet within 2 px.
- Carried from: round-32b; last seen round 34b

### PR-0516 [minor] interface - Panels over painted actors and live controls (CHK-008 FAIL, carried): the Chapter I E card covers the NOW tile of the turn order; the Vegnagun chain counter, panels and damage numbers stack; the 'Possessed ...' banner crosses the aeon's body

- Status: open
- Game / chapter / state: both / Chapter I, Chapter V, Chapter III seams / E card open; chain fight; aeon seams
- Expected: No panel hides the current actor's turn slot or a figure it should not (CHK-008).
- Observed: At 1600 and 2000 the opened E card sits over the current actor's turn-order tile ('3RD IN QUEUE' over 'NOW') and Seymour's figure (R31-INT-02). The fan lists the same class: the Vegnagun chain box cut at the screen edge ('x1.9') with piled damage numbers, the Possessed Ixion/Valefor/Bahamut/Yu Yevon banner as a dark bar across the aeon, and the big turn cut-in covering the party at turn start (PR-0536). The 80-state sweep at 1280x720 and 2560x1440 was not re-run (PR-0552, PR-0553, PR-0560 carried). ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-04; FFX only, F1 Chapter VII): At 1600 and 2000 the Chapter I card sits over the NOW tile and the acting hero's portrait. In Chapter VII the card starts at x about 353 and hides the right part of the 'Seymour' ribbon and its HP bar. ROUND 32 AUDITOR ADDITION (visual-targets "Carried framing and overlap polish", the Omnis item; FFX only): Omnis's advisor text lies over the boss and the party's legs (the Flux and Yunalesca items of the same issue are PR-0479 and PR-0553). ROUND 33: The fan and the sweep add: the F1 guide and advisor text over the boss and the party in Omnis and the Sin chapters, the dress-change plate over the next figure's head (Ixion, Leblanc, Bahamut), Braska's dialogue card over the party health panel (Vegnagun seam), Ixion's painted body under the command rows, the Omnis intent card over its own guide card, and Yuna's dialogue card over her own HP row in Trema. All polish; no needed control is hidden. ROUND 34 (build 2342fe666): Re-observed in every chapter on 2342fe666, plus the Omnis intent card over its own guide card, and in the hidden Spectral Keeper the HP plates cover Auron and Yuna while the dark Keeper hides behind Auron (fan lens).
- Repro: Chapter I first menu, press E, screenshot.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2; critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/12-intent-E.png
- Confidence: high
- Requirement: CHK-008, docs/ENGINE-API.md#hud-safe-area
- Smallest fix: Anchor the intent card left of or below the turn order; move the possessed banner off the body.
- Acceptance check: Intersection of the card and the NOW tile is 0 at 1280x720, 1600x900, 2000x1012, 2560x1440 in Chapter I.
- Carried from: round-32b; last seen round 34

### PR-0502 [minor] interface - The boss's bark box, the opening quip banner and the turn-intro wipe cover the first command menu (carried, stalled, now also on retry)

- Status: open
- Game / chapter / state: both / Chapter I first menu; Chapter I and IV retry / awaitingMenu true
- Expected: The command rows are visible while the menu awaits input, or the menu does not await until they are.
- Observed: Seymour's line 'It's quieter on the other side.' covers SPECIAL, WHITE MAGIC and ITEMS at 1600, 2000 and the phone while the menu is awaiting input; the banner lasts under 1 s (gap pass); on both retries the first menu is under the actor's full-height portrait wipe. Seymour's banter card hides Skills and Magic rows and Tidus's plate (visual auditor, 10-first-menu-coach). ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-03; both games, the newly treated chapters): Chapter I: Seymour's line covers SPECIAL, WHITE MAGIC and ITEMS at 1600, 2000 and 390, and again on the retry. Isaaru: Yuna's line covers the boss ribbon. Trema: Yuna's line covers her party plate and the command menu's lower edge. Den of Woe: Paine's line covers the ribbon and Baralai's intent card. Anima: the Rikku turn-intro wipe covers the whole menu at the frame asserted awaitingMenu=true. ROUND 34 (build 2342fe666): Re-observed: the boss bark box and turn-intro wipe cover the first command menu (Chapter I desktop and phone, IV phone over Yuna's card, Keeper, Maesters).
- Repro: Chapter I real keys, first menu, no key pressed; or lose and TRY AGAIN.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/10-first-menu-coach.png; critic/rounds/round-31/evidence/seymour-flux-lose-retry/3-retry-menu.jpg; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/3-retry-menu.jpg; critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-trema-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-den-of-woe-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-008, CHK-006
- Smallest fix: Place the bark clear of the command stack or hold awaiting until it has cleared.
- Acceptance check: At awaitingMenu true the command rows are unobscured.
- Carried from: round-32b; last seen round 34

### PR-0540 [minor] interface - Chapter I intent card shows the IF YOU ATTACK header with no body (carried, stalled; third review at the same severity)

- Status: open
- Game / chapter / state: both / Chapter I / E card at 1600 and 2000
- Expected: The conditional half is readable by default or the header is not drawn without a body.
- Observed: The conditional body (Delay Attack or Buster punished with party-wide Slowga; Protect under 75 percent; Reflect and phase 2 under 50 percent) is in the DOM but the card height clips it until J is held. Chapter II shows its body. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-02; both games, no longer Chapter I only): Chapter I: the 'IF YOU ATTACK' header is shown with no body and 'J HOLD +3 MORE' under it (1600 and 2000). Den of Woe: the IF YOU ATTACK text is cut mid-sentence ('Counts every result the party applies to him (each landing strike, a miss or a no-effect hit once): at 8'), '+1 MORE'. Leblanc: a whole-party Thunder lists Yuna and a half-faded Rikku, Paine is not shown, '+11 MORE'. The cue to read more exists; the default state hides the conditional rule. ROUND 34 (build 2342fe666): Re-observed on the Chapter I E card (red IF YOU ATTACK bar struck by the dashed rule; body held back, J HOLD +4 MORE).
- Repro: Chapter I, seed 1, first menu, press E.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-den-of-woe-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/ffx2-leblanc-win-r32/12-intent-E.png
- Confidence: high
- Requirement: RUBRIC section 2 (enemy intent separates certain from conditional)
- Smallest fix: Let the card grow to its content as Chapter II's does.
- Acceptance check: E shows a non-empty IF YOU ATTACK body without J; scrollHeight equals clientHeight.
- Carried from: round-32b; last seen round 34

### PR-0541 [minor] interface - Chapter IV desktop CHANGE list: 'GRANTS: BLUE' is pink on cream and nearly invisible, and a grant is never explained (carried, stalled)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-bahamut / CHANGE open at 1600 and 2000
- Expected: Readable rows and one line saying what a grant is.
- Observed: The unselected WARRIOR row's GRANTS: BLUE is nearly invisible; Gunner's GRANTS: GREEN on the selected row reads. ROUND 34 (build 2342fe666): Re-observed: WARRIOR GRANTS: BLUE is pink on cream.
- Repro: Chapter IV, ArrowDown to CHANGE, Enter.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/21-change-open.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/21-change-open.png
- Confidence: high
- Requirement: CHK-003, CHK-007
- Smallest fix: Use the row ink for unselected GRANTS and add one explanatory line.
- Acceptance check: GRANTS contrast at least 4.5:1 selected and unselected.
- Carried from: round-32b; last seen round 34

### PR-0518 [minor] interface - Phone 390x844: CHANGE tiles clip their text (UNNER, GRANTS: BLUI), the pause header wraps over the tab dots, the tab strip is cut at CHAPTER with no scroll cue (ACCESSIBILITY, CONTROLS and MUSIC are reached only by an unprompted swipe), the options pane stops at a half row, and the phone pause shows keyboard hints (carried, stalled; merges PR-0554, R31-ONB-01)

- Status: open
- Game / chapter / state: both / Chapter I and IV phone / pause by the chip; CHANGE list
- Expected: Every tab reachable by sight; tiles whole; touch hints on a touch device.
- Observed: The pause chip is a 46x46 target and a tap opens the pause (gap pass). A real touch swipe on the strip scrolls it; nothing hints at it. Smallest visible text on the phone pause is 14 px; no horizontal page scroll (scrollWidth 390). ROUND 32b ADDITION (G2 layout sweep): At 390x844 (touch context, Escape) the pause on e3f51bf18 still draws the header 'ECHOES OF SPIRA - FINAL FANTASY X' wrapped onto two lines against the tab dots, the tab strip cut at CHAPTER with no scroll cue, and the keyboard hints 'ESC RESUME' and 'H PAINTING ONLY'; the plate itself covers the window (-489.1,-2.4, 1486.7x849.6) and the face is partly under the stat block. Not a new defect. ROUND 32b ADDITION (G4 (4b)): Phone pause: GUIDE to MUSIC are off screen at open; a real swipe scrolls the strip (0, 275, 550) and tapping ACCESSIBILITY, CONTROLS and MUSIC makes each the active tab; nothing hints at the strip. ROUND 34 (build 2342fe666): Re-observed on the 390x844 FFX-2 Chapter IV capture: pause tab strip cut at ACCESSIBI, header wrapped over the tab dots, CHANGE tiles clip UNNER and GRANTS: BLU, keyboard hints shown.
- Repro: 390x844 touch, Chapter I, tap the chip, read the strip.
- Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause/phone-pause-0.png; critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause2/swipe1.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-32/gaps-G2-layout/matrix/gaps/sweep-matrix-390x844/02-pause.png; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
- Confidence: high
- Requirement: CHK-003, CHK-009, onboarding (device usability)
- Smallest fix: Fade the strip edge as a scroll cue; hide keyboard hints on touch; fit the tile text.
- Acceptance check: Strip shows an edge cue; no clipped tile text at 390x844.
- Carried from: round-32b; last seen round 34

### PR-0542 [minor] interface - Pause chrome labels are low contrast, about 1.9 to 3.5:1 by pixel sampling (carried, stalled)

- Status: open
- Game / chapter / state: both / pause / pause at 1600 and 2000
- Expected: At least 4.5:1 for small text.
- Observed: header 1.88:1, BATTLE STATS 2.37, H PAINTING ONLY 2.83, inactive tab 3.49, options section titles 2.38 (thin antialiased text, rough figure).
- Repro: Pause screenshot, sample.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/14-pause-Esc.png
- Confidence: medium
- Requirement: CHK-003
- Smallest fix: Raise the label tokens.
- Acceptance check: Sampled contrast at least 4.5:1.
- Carried from: round-32b; last seen undefined

### PR-0543 [minor] interface - FFX target mode lacks the Enter/Esc strip FFX-2 shows, and the hint strip calls the guide 'Intel' (carried, stalled; CHK-020 polish difference)

- Status: open
- Game / chapter / state: FFX only / FFX target mode / target step
- Expected: The same help in both, in one word.
- Observed: FFX-2 target frames show ENTER CONFIRM / ESC BACK; FFX frames do not; the hint strip labels the guide Intel while its panel says GUIDE. ROUND 32b ADDITION (G1 pairing (CHK-020)): Re-read on 64 round-32 frames in four chapter pairs: the FFX target step still has no ENTER CONFIRM / ESC BACK strip while src/ui/ffx2/TargetPlates.ts:28 draws one for FFX-2, and the hint strip still says Intel for the panel headed GUIDE. Same on the F1 HUD and the older HUD; present in release 69; not a regression. ROUND 34 (build 2342fe666): Re-observed unchanged: FFX target step prints Enter Select / G Intel / Q Defend / P Pause.
- Repro: Chapter I, Attack, target step.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/16-target-single.png; critic/rounds/round-32/gaps-G1-static/chk020-pairing.json
- Confidence: high
- Requirement: CHK-020
- Smallest fix: Add the strip and unify the word.
- Acceptance check: Both games print the strip; one word for the guide.
- Carried from: round-32b; last seen round 34

### PR-0483 [minor] interface - A touch player's route to Poison Fang and Holy Water in the 27-item Chapter I list: the pager, both target steps and the Holy Water confirm work by real taps (round 32b); a Poison Fang confirm tap on an enemy plate was not made

- Status: open
- Game / chapter / state: FFX (Chapter I phone) / seymour-flux / 390x844 touch
- Expected: A touch player can reach every row the advisor names and aim an ally.
- Observed: The phone Chapter I routes were lost at seeds 1 and 2 (23 of 35 and 20 of 39 picks wanted Poison Fang or Holy Water and took Attack; desktop 2 of 53, with no Attack substitutions; Bahamut at 390x844 touch 0 mismatches). The chief's gap pass opened ITEMS by real taps ('1-6 OF 27', the previous button disabled), tapped the 44x44 next button ('7-12 OF 27') and tapped HOLY WATER, which opened its target step ('HOLY WATER -> TIDUS', help text 'Tap another ally to switch'). The route harness (critic/runner/lib/route-fight.mjs lines 229 to 238) reads only the six visible rows and falls back to Attack, which is how the run lost; CommandMenuPaging.ts and its unit test pass. The first draft of this finding was a major phone defect with low confidence on cause; the gap pass refutes it as a product defect, and it is filed minor for what stays unproven. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-10; FFX-2 Chapter IV phone, low confidence; would be major only if a touch-only probe shows no route): Chapter I phone, two seeds: only the first six of 27 Items rows were found (Mega Phoenix applied; Poison Fang, Holy Water, X-Potion not: 23 and 20 picks 'want != took', Attack taken) and both runs were defeated (turn 35 and 39). Chapter IV phone: 5 of 5 taps on the Rikku plate for Cure/Cura were 'tap blocked' and finished by a key fallback. I cannot tell a harness limit from a product defect on these frames. ROUND 32b ADDITION (G4 (4b) on the live bundle): Chapter I at 390x844: the Items pager (44 x 44 buttons, 1-6 OF 27) reaches Holy Water on page 2 and Poison Fang on page 4 by real taps; Poison Fang opens an enemy target step (plates mortiorchis, seymour-flux) and BACK works by tap; Holy Water opens the ally step with plates yuna 75 x 96 and tidus 95 x 103, elementFromPoint at each plate centre is that plate, the first tap on another ally switches the target (HOLY WATER to YUNA) and a second tap on the same plate confirms (awaitingMenu drops at once). The route exists; the acceptance wording (want equals took on every row) is met for Holy Water; a Poison Fang confirm tap on an enemy plate was not made, so the issue stays open as a minor until the next touch run. ROUND 34 (build 2342fe666): Chapter I phone touch lost at turn 35 again (100 taps, 59 keyboard fallbacks), identical to round 33: the harness cannot resolve Yuna on touch, Holy Water aimed at the boss.
- Repro: 390x844 touch, Chapter I, Items, swipe to Holy Water, Yuna as target.
- Evidence: critic/rounds/round-32/evidence/gaps/phone-items-pager/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-s2-touch/turn-log.json; critic/rounds/round-32/evidence/ffx2-bahamut-win-r32-phone-touch/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b3-poison-fang-target.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b4-holy-water-target.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b5-after-confirm.jpg
- Confidence: high that the harness caused the defeats; medium that the player path is whole
- Requirement: CHK-015, CHK-004
- Smallest fix: Teach the route harness to tap the page button when the wanted row is not among the six visible rows (PR-0539); then tap Poison Fang and a target plate with real touch events.
- Acceptance check: A 390x844 touch run of Chapter I takes Holy Water and Poison Fang as named (want equals took on every row).
- Carried from: round-32b; last seen round 34

### PR-0558 [minor] interface - At TEXT SIZE 115 and 130 the desktop F1 HUD overlaps: the boss ribbon over the guide chip and the intent panel over the turn strip; the Chapter IV help band sat under the PAUSE chip (merges R68-P1)

- Status: open
- Game / chapter / state: both (F1 HUD: Chapters I and IV) / Chapter I, IV / TEXT SIZE 115 and 130
- Expected: No overlap at any text size.
- Observed: Focused review R68-P1 (candidate bundle, 1280x720 and 1600x900). The gap pass set TEXT SIZE 100 to 115 to 130 on the live pause and saw data-text-size set and the tab strip larger; it did not capture the battle HUD at 130 (r68 now scales the desktop HUD, so PR-0559 is probably fixed, not re-verified). ROUND 32b ADDITION (G4 (4a, 4f), sized on the live bundle): Chapter I: the E card covers the turn strip, 80 x 111 px at TEXT SIZE 100 (that is PR-0516), 137 x 128 at 115 and 221 x 145 at 130, with the folded Sensor tab also under it by 6, 10 and 14 px. Chapter IV at 130: the guide chips (G HIDE GUIDE and [ ] SCROLL) overlap the boss ribbon by 14 px and hide the HP SCAN chip; at 100 and 115 they clear it. The help band under the PAUSE chip was not seen (the F1 HUD has no PAUSE chip on the desktop).
- Repro: Pause, ACCESSIBILITY, TEXT SIZE 130, resume, open E and G.
- Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y-keys/a11y-after-changes.png; critic/rounds/round-32/gaps-G4-walks-optional/crops/ch4-guide-vs-ribbon-100-115-130.png; critic/rounds/round-32/gaps-G4-walks-optional/4f-ffx2-panels/ts130-again-g-plus1500.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json
- Confidence: medium
- Requirement: CHK-008, onboarding (text size)
- Smallest fix: Reflow the ribbon and the intent panel under the larger scale.
- Acceptance check: Rect intersections 0 at 130 in Chapters I and IV.
- Carried from: round-32b; last seen round 32b

### PR-0549 [minor] visual - Party figures stack on each other in staging: Auron is almost wholly behind Tidus in Chapter III; the party reads as toys against Vegnagun and Bahamut (carried)

- Status: open
- Game / chapter / state: both / braskas-final-aeon, ffx2-vegnagun-shuyin / mid-fight
- Expected: Three readable figures.
- Observed: Only Auron's coat edge shows behind Tidus in 23-midfight (two figures read). The fan also lists Ixion's body sitting through Yu Yevon. ROUND 34 (build 2342fe666): Re-observed; fan lens adds Tidus/Auron and Kimahri/Yuna stacked in Flux, Yunalesca and Braska action montages.
- Repro: Chapter III by real keys, seed 1, 23-midfight.
- Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/23-midfight.png
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Offset Auron's slot in this chapter's layout.
- Acceptance check: All three heroes visible at the first menu.
- Carried from: round-32b; last seen round 34

### PR-0521 [minor] feel - Pro camera framing in the action stills: Bahamut zooms and shifts within a turn; the sphere change swings the scene sideways (carried; see PR-0530 for the question to Bailey)

- Status: open
- Game / chapter / state: FFX-2 (Chapter IV) / ffx2-bahamut / seq-action-playing and seq-spherechange at 250 ms steps
- Expected: A coherent camera (Bailey's judgment, PR-0530).
- Observed: Carried and widened by the first-time fan: a hard camera cut mid-action in Seymour Flux (a boss framing flips to a wide shot, the party at about half size, frames 2 to 3 of seq-action-playing), in Braska (a tight dark close-up to a wide shot, party about two thirds), in the Den of Woe seams (the party jumps about 1.8 times closer; seam 3's first frame has no party), and in Sin (the head about 1.4 times larger after the Yuna cut-in). 22.5 hard cuts a minute (3,990 in 10,638 s) are the planned smear cuts (PR-0530) awaiting Bailey. ROUND 33: The fan adds three camera readings: Flux (party big on the left to half the size in the centre in one frame, boss jumps), Braska midfight (a close dark view with the boss out of frame cuts to a wide view) and Bahamut at the sphere change (Bahamut leaps to the top-left corner and shrinks). Pro camera cuts, not new. ROUND 34 (build 2342fe666): Fan lens: the camera jumps from a close framing to a wide one in a single frame in Flux (seq-action-playing f02 to f03), Braska (seq-party-action f07 to f08) and Bahamut (seq-party-action f03 to f04): five instances.
- Repro: Chapter IV, Rikku WARRIOR change at 1600 and 2000.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/seq-spherechange
- Confidence: medium
- Requirement: CHK-B2
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- Carried from: round-32b; last seen round 34

### PR-0481 [minor] feel - Time to the first command: about 42 s in Chapter I and 21 to 23 s in Chapter IV from picking the chapter (pre-scene read included); the retry is now 4.9 s (Chapter I) and 10.2 s (Chapter IV)

- Status: open
- Game / chapter / state: both / Chapters I and IV / real keys, desktop line
- Expected: A short wait to the first command.
- Observed: Round 30b: 43.2 s and 26.6 s; retry 16.5 s and 9.9 s. The chained chapters retry in 9.6 to 13.6 s (this round's gap runs).
- Repro: Chapter select to awaitingMenu with a timer.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/run.json; critic/rounds/round-31/gaps-chief/lose-braskas-final-aeon.log
- Confidence: high
- Requirement: RUBRIC section 2 (pace)
- Smallest fix: See PR-0567.
- Acceptance check: As PR-0567.
- Carried from: round-32b; last seen undefined

### PR-0532 [minor] audio - Chapter I's win fanfare is cut at the results swap and restarted from its first note (carried; contradicts D-1295 'one fanfare')

- Status: open
- Game / chapter / state: FFX only / seymour-flux / results swap
- Expected: D-1295: one fanfare.
- Observed: Carried and reached further: the early victory cue (FFX only) is in the fading list at gain 0.64 and 0.002 with no current track 4.0 s (Anima) and 17.4 s (Natus) before the results panel, and the results snapshot then shows victory-ffx current at gain 1: the same cut-and-restart round 31 read in Chapter I, now in two more chapters. Two snapshots, not a dense timeline; a fade could also be the cue ending. ROUND 34 (build 2342fe666): Seen again in four runs (Flux 2000x1012, Anima, Natus, Yojimbo): after-fight snapshot lists victory-ffx as fading with no current track, then the results snapshot shows victory-ffx current at full gain. Two snapshots per run, not a dense timeline.
- Repro: Chapter I win, dense audioDebug timeline from the last blow.
- Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-natus-win-r32/audio-debug.jsonl
- Confidence: medium
- Requirement: AUDIO phase transitions; D-1295
- Smallest fix: Skip the exit's stopMusic for a win when the results cue is already current.
- Acceptance check: A 100 ms timeline shows victory-ffx continuous.
- Carried from: round-32b; last seen round 34

### PR-0514 [minor] audio - The first UI sounds of a session fall back to the procedural synth, more often and for longer this round (7 of 11 logged runs, up to 14 sounds in the FFX-2 chapters; round 30: 2 of 17)

- Status: open
- Game / chapter / state: both / title and chapter select, first 2 to 7 s of a fresh profile / cold profile, live network
- Expected: CHK-001 item 3: nothing falls back to synth.
- Observed: ffx2-bahamut-win-2k 13 synth sounds 3.47 to 6.05 s; phone 9; vegnagun 14 (3.83 to 6.58 s); the Chapter I runs are clean. Cause not established (sprites 2.7 and 4.6 MB over the live network, host load, or the r68 load order). ROUND 34 (build 2342fe666): PREVALENCE UP: 22 of 31 runs log 1 to 20 procedural-synth UI sounds (cursor-move, confirm, menu-page) in the first 2.6 to 12 s of a fresh profile, against 1 of 28 in round 33. No desktop audio-load code changed in releases 73 and 74 (WarmGate is phone-only), so six parallel capture lanes on one machine or a cold CDN is likely but not established; ten cold runs on an idle machine would separate load from a regression.
- Repro: Fresh profile, FFX-2 chapter select to Chapter IV; move and confirm within 3 to 6 s.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/audio-debug.jsonl; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/audio-debug.jsonl; critic/rounds/round-34/audio/synth.log; critic/rounds/round-34/audio/synth33.log
- Confidence: medium for the entries, none for the cause
- Requirement: CHK-001 item 3
- Smallest fix: Gate the UI cue on the first sprite decode, or start its fetch ahead of art.
- Acceptance check: Ten cold runs log no synth entry in the first 7 s.
- Carried from: round-32b; last seen round 34

### PR-0504 [minor] audio - Chapter IV win results are silent on the default desktop build, by a release 62 pick nobody has heard (carried question for Bailey; re-observed at 1600 and 2000)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-bahamut / results
- Expected: Bailey's decision.
- Observed: Carried and re-observed in round 32: Chapter IV desktop wins (1600x900, 2000x1012) end with music.current null at results; the 390x844 touch win plays 'pause' at results because the pass is off on phone class. D-1352 keeps silence until Bailey has listened. ROUND 34 (build 2342fe666): Chapter IV desktop wins end silent (passSilentWin); the hidden 3D Bahamut (same fight) plays the quiet "pause" cue at its results because QUIET_RESULTS lists exp-yrp-3d and PASS_SILENT_WIN lists only ffx2-bahamut. Follows the code's intent; still the same unheard two-way pick for Bailey.
- Repro: Chapter IV win.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/audio-debug.jsonl
- Confidence: high
- Requirement: AUDIO
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- Carried from: round-32b; last seen round 34

### PR-0523 [minor] interface - Esc from the command menu closes an open guide panel first, so the pause seems ignored (carried; re-observed in Den of Woe, Trema and Via Purifico; a gap-pass Esc after ACCESSIBILITY row changes took more than 1.2 s to close, not reproduced as a defect)

- Status: open
- Game / chapter / state: both / ffx2-den-of-woe, ffx2-trema, isaaru-via-purifico / guide panel open
- Expected: The first Esc pauses or the panel says it closed first.
- Observed: pOpens and resumedByEsc are true; three pause captures read screen battle. ROUND 32 AUDITOR ADDITION (interface-onboarding R32-INT-13; FFX only, Chapter I phone): Both FFX phone runs: Esc at the command menu returned the plain menu and the pause frames are UNVERIFIED; the FFX-2 phone run (no coach at that moment) paused normally. The pause chip works (r31).
- Repro: Open the guide, press Esc.
- Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/14-pause-Esc.png; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/14-pause-Esc.png
- Confidence: medium
- Requirement: CHK-015
- Smallest fix: As carried.
- Acceptance check: As carried.
- Carried from: round-32b; last seen round 32b

### PR-0550 [minor] interface - Gamepad: the A that confirms the target also stops Wakka's first reel as the overlay opens (carried; the pad evidence is reused from round 30b under a written argument)

- Status: open
- Game / chapter / state: FFX only / Wakka Overdrive / virtual pad
- Expected: The first reel runs until pressed.
- Observed: Not re-driven this round (reused from round 30b).
- Repro: As in round 30b.
- Evidence: critic/rounds/round-30/gaps2/g2
- Confidence: medium
- Requirement: CHK-023
- Smallest fix: As carried.
- Acceptance check: As carried.
- Carried from: round-32b; last seen undefined

### PR-0503 [minor] process - Prep agency (STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; DRESSSPHERES, ACCESSORIES) and the r68 prep tab roles were never walked by key or touch (carried, the fourteenth review; the pause ACCESSIBILITY tab was walked by round 31's gap pass, not by round 32's (PR-0597))

- Status: open
- Game / chapter / state: both / all / prep
- Expected: Per game and input: each prep tab opened, one change made, visible in the first menu.
- Observed: 291 entries, 11 of them prep first tab; none opens another tab or changes a value. ROUND 31's gap pass walked pause E (Tidus, Yuna, Kimahri, Chapter, Guide, Options, Accessibility, Controls, Music), TEXT SIZE 100 to 115 to 130 (data-text-size), REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS toggles. Not done: COLOUR VISION on a frame, key remap, prep tabs, hold-Home reset. RUBRIC section 8 requires the method check before another attempt; none is written. ROUND 32b ADDITION (G4 (4c) walked the prep tabs, and 4a/4b the pause tabs, in round 32b): Every prep tab of both games was opened by key and by tap on the live bundle (see PR-0295 for the list); the FFX Sphere Grid and Overdrive controls were exercised; FFX-2 prep exposes no value-changing control. The acceptance wording (the changed value shown in the first menu) is not met: a STR node and an Overdrive mode do not appear on the first command menu. The pause ACCESSIBILITY, CONTROLS and MUSIC tabs were walked by key at 1600x900 and by tap at 390x844 in Chapters I and IV (PR-0597).
- Repro: Add one scripted real-input walk to the capture owner.
- Evidence: critic/rounds/round-31/evidence/index.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx2/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
- Confidence: high
- Requirement: RUBRIC section 6 and 8
- Smallest fix: Write the method check; assign the walk to the capture owner's script.
- Acceptance check: A run.json with the walks and the changed value in the first menu, both games, both sizes.
- Carried from: round-32b; last seen round 32b

### PR-0520 [minor] delivery - First-load time on the live URL still not measured in a browser (carried, the fourth review)

- Status: fixed (verified round 32b)
- Game / chapter / state: both / title / cold edge
- Expected: Title usable under 5 s cold on a named profile.
- Observed: Node-side arithmetic: cold title about 3.1 MB on the wire (bundle 1,450,107 B brotli in 0.47 s), inside the proposed 4 MB. No browser timing.
- Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/coldload.mjs --base=https://echoesofspira.com/
- Evidence: critic/reviews/2a9340249-focused/cold-cand/gaps/coldload/out.json; critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/gaps/coldload/out.json; critic/rounds/round-32/gaps-G4-walks-optional/4i-title-enter/run.json
- Confidence: high that it is unmeasured
- Requirement: CHK-017 cold-load clause
- Smallest fix: Run coldload.mjs against the live URL.
- Acceptance check: A report line with the median and the throttled load.
- Carried from: round-32b; last seen round 32b

### PR-0544 [minor] delivery - FFX-2 Trema 56.7 fps, p99 74.7 ms, 2.3 percent over 34 ms (carried since round 30; see PR-0580 for the other outliers)

- Status: open
- Game / chapter / state: FFX-2 / ffx2-trema / continuity probe
- Expected: B4a to B4c.
- Observed: Live run: 56.7 fps, 1,588 of 67,748 frames over 34 ms, max 158 ms. ROUND 33B: Trema is now read by the full harness: 56.1 fps, p99 89.1 ms, 1,795 of 70,968 frames over 34 ms (2.5 percent), max 169.4 ms; the same shape as the round 30 reading (56.7 fps, p99 74.7 ms) with a longer tail. The other FFX-2 chapters read 59.1 to 59.8 fps.
- Repro: Trema continuity.
- Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-33/continuity/ffx2-trema-win-r33/continuity/continuity.json
- Confidence: high for numbers
- Requirement: RUBRIC section 2
- Smallest fix: Per-frame trace first.
- Acceptance check: p99 at most 25 ms.
- Carried from: round-32b; last seen round 33b

### PR-0547 [minor] interface - FFX-2 results ledger names the dressphere Rikku started in, not the one she finished in (carried, re-observed)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-bahamut / results
- Expected: The finishing dress.
- Observed: As round 30b.
- Repro: Chapter IV win, change Rikku, results.
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/31-results.png
- Confidence: medium
- Requirement: RUBRIC prep (understandable results)
- Smallest fix: As carried.
- Acceptance check: As carried.
- Carried from: round-32b; last seen undefined

### PR-0099 [minor] audio - Stand-in or borrowed scene beds and battle cues in eleven chapters (carried; not re-judged by ear)

- Status: open
- Game / chapter / state: both / eleven chapters / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 34 (build 2342fe666): Extended to the four hidden chapters: Keeper uses Yunalesca's boss-challenge and scene-zanarkand-dome; Maesters and waker use boss-ffx2-fallen-aeons and scene-bevelle-underground; yrp uses Chapter IV's cues. Routing equals the data; none heard.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 34

### PR-0515 [minor] interface - Doublecast advice says NO MP while the spell picker shows the MP cost (carried, not re-examined)

- Status: open
- Game / chapter / state: FFX-2 only / doublecast / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0485 [minor] narrative - Portrait expression never follows the line; 46 emotion tags are read by nothing (carried; no story file changed)

- Status: open
- Game / chapter / state: both / all / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried: dboxTimeline shows one portrait file per speaker for the whole scene (Leblanc: rikku-x2.webp, paine.webp); no expression change on grief lines. Awaits Bailey.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 32

### PR-0537 [minor] visual - The live Chapter I boss card has no approved target (carried, not re-examined)

- Status: open
- Game / chapter / state: FFX only / Chapter I / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0552 [minor] interface - FFX-2 Mega Flare telegraph: the CHAIN counter is drawn over the ATTACK row (carried; not re-observed)

- Status: open
- Game / chapter / state: FFX-2 only / Chapter IV / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0555 [minor] prep - The prep STATS tab keeps the pre-spend value after a Sphere Grid activation (carried; not walked)

- Status: open
- Game / chapter / state: FFX only / prep / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c)): Confirmed by tap with numbers: after WALK AND ACTIVATE the grid says Strength +2 activated and STR is now 33, Power 12 to 11 and the roster S.LV 30 to 28, while the STATS tab still shows S.LV 30 and STRENGTH 31.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-stats-1-after-spend.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-grid-1-after.jpg
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 32b

### PR-0556 [minor] onboarding - The Sphere Grid card says Enter acts, but Enter after the card starts the battle (carried; not walked)

- Status: open
- Game / chapter / state: FFX only / prep / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c, 4h), reworded): The stated sequence (Enter after the card starts the battle) was not reproduced. Seen instead: while WALKING the shell hint under the grid says ENTER BEGINS THE BATTLE - ESC BACK while the canvas footer says ENTER ACTS - ESC RELEASES, and the first Esc while WALKING left WALKING lit (the second released it); in one run Esc left the prep for the chapter board.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4h-grid-keys/run.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 32b

### PR-0557 [minor] prep - OVERDRIVE modes on the prep tab have no keyboard route (carried; not walked)

- Status: open
- Game / chapter / state: FFX only / prep / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 32b ADDITION (G4 (4c)): Confirmed by key on the live bundle: the desktop OVERDRIVE mode rows (STOIC, WARRIOR) have no tabindex, no role and no key route; the phone rows have tabindex 0 and role button and a tap moves EQUIPPED from WARRIOR to STOIC.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-key-od-0.jpg
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 32b

### PR-0559 [minor] onboarding - TEXT SIZE scaled the pause and the phone command menu but not the desktop battle HUD (r68 a11y-text now scales it per the focused review; not re-verified live)

- Status: fixed (verified round 32b)
- Game / chapter / state: both / all / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b1-phone-textsize-130-menu.jpg
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 32b

### PR-0560 [minor] interface - Chapter I ally target with the Items list open: rows cover the TARGET plate and hand (carried; not re-observed)

- Status: open
- Game / chapter / state: FFX only / Chapter I / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0561 [minor] prep - The FFX-2 prep STATS tab does not say it leaves accessories and the Garment Grid out (carried; not walked)

- Status: open
- Game / chapter / state: FFX-2 only / prep / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0562 [minor] onboarding - On the phone the first-run guide step 3 pointer covers part of the TIP text (carried; not re-observed)

- Status: open
- Game / chapter / state: both / phone / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0563 [minor] delivery - WebKit 26.6: party-plate portraits draw as noise at the first menu (carried; Chromium only this round)

- Status: open
- Game / chapter / state: both / Chapter I / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0564 [minor] delivery - WebKit 26.6 holds 12 to 26 fps at the first menu (carried; Chromium only this round)

- Status: open
- Game / chapter / state: both / all / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0566 [minor] feel - First sight still stalls: the first 0.1 to 4.1 s of every battle carry 5 to 9 frames over 100 ms (carried; the live run records the worst frames, not when they fall)

- Status: open
- Game / chapter / state: both / all / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 34 (build 2342fe666): Mirror Aeons chain seam 1 to 2 shows a 1.4 to 1.5 s gap between two timed frames in both runs (samples at 767 then 2,156 ms; 412 then 1,940 ms) while every other seam is a steady 300 to 370 ms: stall or a held card, unproven (evidence/mirror-aeons-win-r34b/seq-seam-2).
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 34

### PR-0568 [minor] feel - hz-matrix: chained beats differ 25 to 30 ms between 60 and 120 or 144 Hz (carried; not re-run)

- Status: open
- Game / chapter / state: both / Chapter IV / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0596 [minor] onboarding - Key remapping is not built: CONTROLS is a read-only list

- Status: open
- Game / chapter / state: both / Pause CONTROLS tab / pause CONTROLS tab, e3f51bf18 (frame of round 31, source read at e3f51bf18)
- Expected: The rubric's onboarding category names remapping among the accommodations.
- Observed: The CONTROLS tab lists G/X, N/RT, E/RS, J/LT, Q/Y, F/LB, Esc/Menu, H/Y, Enter/Z/A and so on and offers no way to change any binding.
- Repro: Esc, then tab to CONTROLS (round-31 frame pause-E7.png).
- Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/pause-E7.png
- Confidence: high
- Requirement: RUBRIC section 6 onboarding (text and input access)
- Smallest fix: Question for Bailey, not a proposal to build: the mock shows it, the code says it is not built, and no issue tracked it. Decide build or drop the line from the rubric reading.
- Acceptance check: A decision recorded in decisions.json; if built, rebinding one key persists across reload and shows in the hint strip.
- Carried from: round-32b; last seen undefined

### PR-0597 [minor] process - The capture owner's route still never opens ACCESSIBILITY, CONTROLS or MUSIC, so onboarding has had no number for six reviews

- Status: open
- Game / chapter / state: both / Pause / round-32 capture-owner route: run.json pause.tabs and the 14-pause frames of every run
- Expected: A deep review shows text size, motion, flash and colour-vision settings on frames, on desktop and phone.
- Observed: run.json pause.tabs lists six tabs in every run and the 14-pause frames stop at OPTIONS; the three tabs appear only as labels. The phone FFX pause frames are UNVERIFIED in both seeds. ROUND 32b ADDITION (G4 (4a, 4b)): The gap groups walked ACCESSIBILITY, CONTROLS and MUSIC by key (1600x900) and by tap (390x844) in Chapters I and IV and measured TEXT SIZE 100/115/130 on the first menus, so this round has the frames; the capture owner's route itself still does not open the tabs, so the issue stays for the next index.
- Repro: Read run.json pause.tabs and index.json state of the 14-pause frames in any r32 run.
- Evidence: critic/rounds/round-32/auditors/audit_interface-onboarding.md; critic/rounds/round-32/gaps-G4-walks-optional/4a-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4a-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-ffx2-bahamut/run.json
- Confidence: high
- Requirement: RUBRIC section 5 (match proof to the claim); CHK-003 scope
- Smallest fix: Add to the route: open the pause, step to ACCESSIBILITY, set TEXT SIZE 130, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS and COLOUR VISION one at a time, screenshot each with the first menu behind it, on desktop and phone, in one F1 chapter of each game.
- Acceptance check: The next index.json has one verified frame per setting per game and per size.
- Carried from: round-32b; last seen round 32b

### PR-0598 [minor] interface - The key prompt strip (Enter Select / G Intel / Q Defend / P Pause) is hidden from link 2 of an F1 chain: the victory-state class f1-over outlives its link

- Status: open
- Game / chapter / state: both / F1 chains: Leblanc (FFX-2 VI), Trema (XIII), Den of Woe (XV), Isaaru (FFX XIV), Braska (FFX III) / first command menu of link 2 or later of a chained chapter that draws the F1 HUD, 1600x900, real keys, seed 1; link 1 and every retried link 1 show the strip
- Expected: The victory-state class lives only for the link that ended; each link's first menu shows the key help.
- Observed: G3 read .f1-prompts at every first menu: at the link 2 and link 3 seam menus of Isaaru, Den of Woe, Trema, Leblanc (links 2 and 3) and Braska (link 3) the strip has opacity 0 and the HUD root carries f1-over (seamPrompts 0, seamF1OverOnHudRoot true, the rule 'hud-f1 f1-over f1-prompts' matches); at link 1 and at every retried link 1 (a new BattleScreen and HUD) it is 1. Cause read in the source at e3f51bf18: HudF1.onEvent (src/ui/hudf1/HudF1.ts:250) adds f1-over on every victory or defeat event, only release() removes it (lines 164 and 194), and hudf1-act.css line 30 hides .f1-prompts under it; a chain's link victory is a victory event. The strip is the on-screen key help, so a player who reaches link 2 loses it exactly when a new boss arrives. Fallen Aeons (old HUD) keeps its prompts at links 2 and 3. ROUND 34 (build 2342fe666): Re-observed: no key prompt strip at Braska link 4 and Leblanc link 2 first menus.
- Repro: Real keys, Leblanc: win link 1, read .f1-prompts opacity at the link 2 first menu (0) and after a loss and RETRY at link 1 (1). Same in Isaaru link 3, Den of Woe link 3, Trema link 2, Braska link 3.
- Evidence: critic/rounds/round-32/gaps-G3-chains-overlays/3c-isaaru/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3c-den-of-woe/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3b-trema/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3d-leblanc/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3e-leblanc/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/3f-braska/run.json; critic/rounds/round-32/gaps-G3-chains-overlays/g3-summary.json
- Confidence: high for the measurement and the cause (the class and the rule are in the source)
- Requirement: CHK-006 (adjacent: a link-victory state outlives its owner), RUBRIC interface and onboarding (key help)
- Smallest fix: Clear f1-over (and the other end-of-fight classes) when the next link begins, in the presenter's link seam (stageLinkBegins / the chain runner), not only in release().
- Acceptance check: At the first menu of every link of Leblanc, Braska, Isaaru, Trema and Den of Woe the .f1-prompts opacity is 1 and f1-over is absent from the HUD root.
- Carried from: round-32b; last seen round 34

### PR-0599 [minor] delivery - Retry from link 5 of Chapter V takes 38.6 s from the key to the first menu; every other retry took 9.5 to 16.5 s

- Status: open
- Game / chapter / state: FFX-2 only / Chapter V Vegnagun and Shuyin, link 5 / live bundle, 1600x900, real Enter on RETRY after a loss at link 5 (Shuyin); the earlier links by the labelled hook
- Expected: A retry of a link the player has seen returns to the first menu in about 10 s (PR-0587 acceptance); an entrance already seen is skippable.
- Observed: The results card names Defeat (turns 7, attempts 1); Enter on RETRY reached the battle (screens results, battle: no cutscene screen) and the first menu 38.55 s later, with Shuyin, boss-shuyin at gain 1 and resumeAt 5. The 9 other retries read in the same pass took 9.5 to 16.5 s (Fallen Aeons 16.5 s and 10.4 s, Trema 13.8 s, Sin core 11.1 s, Mirror Aeons 10.6 s, Isaaru 11.6 s, Den of Woe 10.6 s, Leblanc 9.5 s and 9.7 s, Braska 11.3 s). G4 (4e) saw the same link-5 entrance hold the music in silence from 26.4 to 40.8 s on the first visit, which is the likely share. Not traced: whether the retried link replays that entrance inside the battle and whether Enter skips it.
- Repro: Chapter V, hook to link 5, lose, Enter on RETRY, time to the first menu (3g-shuyin).
- Evidence: critic/rounds/round-32/gaps-G3-chains-overlays/3g-shuyin/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4e-audio/run.json
- Confidence: low to medium (one run, cause not traced)
- Requirement: respectful skip and replay pacing
- Smallest fix: Read the retried link 5 start in the presenter; if the entrance replays, let a held Enter skip it as the first visit does.
- Acceptance check: Retry of Chapter V link 5 reaches the first menu in 15 s or less, or the entrance is skippable by the same key as on the first visit.
- Carried from: round-32b; last seen undefined

### PR-0600 [minor] onboarding - Phone pause touch targets: every ACCESSIBILITY row is 350 x 20 px and RESUME is 156 x 22 px, below 44 px and below the 24 px WCAG 2.2 AA minimum

- Status: open
- Game / chapter / state: both / Phone pause (Chapters I and IV) / 390x844, DPR 2, touch, pause opened by the PAUSE chip, Chapter I (FFX) and Chapter IV (FFX-2)
- Expected: A touch target of at least 44 px (24 px is the WCAG 2.2 AA floor) for the controls a player with a motor or vision need reaches for.
- Observed: G4 (4b): the tab buttons are 47 px tall, but the five ACCESSIBILITY rows (TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION) are 350 x 20 px and the RESUME control is 156 x 22 px; all are tappable (data-action pause:row:<id>). Related to PR-0578 (board chips). ROUND 33: Fresh gap-pass measure on the live bundle (390x844 touch, Chapters I and IV): the PAUSE chip is 46 x 46 px and opens the pause by a real tap; the RESUME control .pause__back is 142 x 22 px, below the 44 px minimum; it works by tap.
- Repro: Phone, Esc or the PAUSE chip, ACCESSIBILITY tab, read the row rects.
- Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-ffx2-bahamut/run.json; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/p1-accessibility.jpg; critic/rounds/round-33/evidence/gaps/phonepause-ch1b/phonepause.json; critic/rounds/round-33/evidence/gaps/phonepause-ch1b/02-pause-tap.png
- Confidence: high
- Requirement: RUBRIC section 6 onboarding (text and input access)
- Smallest fix: Give the pause rows and RESUME a 44 px minimum height on the phone class.
- Acceptance check: Every pause row and RESUME at 390x844 is at least 44 px tall.
- Carried from: round-32b; last seen round 33

### PR-0601 [minor] interface - Phone Items list: three of the six tiles on page 1 cut their names (MEGA-POTI..., PHOENIX DO..., MEGA PHOE...) and the pager's next button covers the left edge of the GUIDE chip

- Status: open
- Game / chapter / state: FFX only / Chapter I phone Items list / 390x844, Chapter I first menu, ITEMS, page 1 of 27
- Expected: Every name that can be shown is shown in full (CHK-009).
- Observed: G4 (4b): MEGA-POTION, PHOENIX DOWN and MEGA PHOENIX are ellipsized in their tiles; the next-page button (44 x 44) sits on the left edge of the GUIDE chip (same family as PR-0518 CHANGE tiles).
- Repro: Phone, Chapter I, ITEMS, read page 1.
- Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/b2-items-page1.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4b-seymour-flux/run.json
- Confidence: high
- Requirement: CHK-009
- Smallest fix: Let the item tile wrap to two lines or shrink the count badge; move the pager clear of the guide chip.
- Acceptance check: Page 1 of the phone Items list prints all six names whole and the pager does not overlap a chip.
- Carried from: round-32b; last seen undefined

### PR-0602 [minor] onboarding - Phone prep: the first-run Auron guide box and the START BATTLE spotlight sit over the Sphere Grid first-time card and cover part of its text and its SHOW ME ON THE GRID button

- Status: open
- Game / chapter / state: both / Phone party prep, first visit to SPHERE GRID / 390x844, Chapter I party prep, first visit to the SPHERE GRID tab (FFX card; the guide overlay is both games)
- Expected: A first-time card and the guide box do not compete for the same space; both stay readable.
- Observed: G4 (4c): the Auron box ("Tabs are for later. Tap START BATTLE.") and the spotlight cover the card's text and its SHOW ME ON THE GRID button; GOT IT (102 x 44) is reachable.
- Repro: Phone, fresh profile, Chapter I, party prep, tap SPHERE GRID.
- Evidence: critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/seymour-flux-tap-tab_SPHERE_GRID-card.jpg; critic/rounds/round-32/gaps-G4-walks-optional/4c-ffx/run.json
- Confidence: high
- Requirement: RUBRIC section 6 onboarding
- Smallest fix: Dismiss or move the Auron box while a first-time card is up.
- Acceptance check: The card's text and both of its buttons are uncovered on a fresh profile at 390x844.
- Carried from: round-32b; last seen undefined

### R72-1 [minor] interface - Chapter XII: the TARGET flag lands on the Sensor card at alternate cursor stops (the focused review's R72-1, rated major there; the chief rates it minor after reading both frames)

- Status: open
- Game / chapter / state: FFX / XII seymour-omnis (F1 HUD held) / ?coach=off, seed 1, G (Intel), Enter on Attack, ArrowRight
- Expected: The flag and the Sensor card never overlap while the target cursor moves.
- Observed: At cursor stops 1, 3 and 5 the flag overlaps the Sensor card by 98 x 79 px at 1600x900 and 80 x 85 at 2000x1012, the card title text colliding. The live build shows the flag over the disc strip text at the same stop, a different overlap of the same class. The chief read hud-xii-cand2-1600-cursor1.png and hud-xii-live2-1600-cursor1.png: both collide, the candidate's hides part of the Sensor card's title ("Seymour Omnis") and the live one hides "FACING HIM"; neither hides a control that is needed, and the Sensor card is information, so this is polish-grade overlap (CHK-008) and not wrong information. ROUND 34 (build 2342fe666): Release 74's Sensor steer: one production stop captured, the Sensor card is clear of the flag; the 29-stop walk was not captured, so it is not claimed closed. (Focused-lane dev-server read: 5 of 29 stops with a pair against 26 on live.)
- Repro: ?coach=off seed 1: Chapter XII, G, Enter on Attack, ArrowRight.
- Evidence: critic/reviews/01a767770-focused/play/hud-xii-cand2.json; critic/reviews/01a767770-focused/play/hud-xii-cand2-1600-cursor1.png; critic/reviews/01a767770-focused/play/hud-xii-live2-1600-cursor1.png
- Confidence: medium
- Requirement: CHK-003 / CHK-008 / CHK-009
- Where (only if traced): src/ui/ffx/hudAvoidSelectors.ts, flag placement (suspected)
- Smallest fix: Steer the flag clear of the Sensor card as well as the advisor card, or fold the Sensor card while the cursor is up.
- Acceptance check: hudcheck cursor walk reads 0 pairs at 1600 and 2000 wide.
- Carried from: new this round; last seen round 34

### PR-0615 [minor] feel - The revive rise: counted as a 172.5 px jerk by CHK-027 in Chapter XVII, and read as a pop in one coarse Chapter I montage (question for Bailey)

- Status: open
- Game / chapter / state: both (revive cross; FFX read on a strip, FFX-2 read by sampler and by real keys) / XVII Sin fins and core; I Mega Phoenix (fan lens) / Tidus ko to idle under the green revive ring; Kimahri after a party Mega Phoenix
- Expected: Either a recorded rule excusing a revive rise from the jerk definition or a rise with no step over the limit; the definition of a jerk is Bailey's (D-420 to D-426).
- Observed: XVII: the strip swap-1134 shows Tidus lying under the green ring rising into a standing sword pose with the guide lines following; it is the designed rise of release 74, but the harness counts it as a 172.5 px jerk, which is why XVII fails CHK-027. FFX-2 half measured smooth (483 ms rise, 183 ms crossfade, max fade step 0.15 a frame; real-key Chapter X read: Paine standing within about 1.3 to 1.7 s of the key). The first-time fan's montage of the Chapter I Mega Phoenix (seq-party-action f07 to f08, 330 ms apart) shows a KO gap then a standing figure with no rise visible between frames; the sampling is coarser than the 0.5 s rise, so this is not shown to be a pop. Closes PR-0473 (revive as dissolve with no rise) for the FFX strip and the FFX-2 page read.
- Repro: Chapter XVII, Phoenix Down on a KO Tidus; Chapter I Mega Phoenix; strips c17-N/swap-1134.
- Evidence: critic/reviews/2342fe666-focused/continuity/c17-N/strips/swap-1134-tidus-ko-idle.jpg; critic/rounds/round-34/evidence/revive-ffx2/frames.json; critic/rounds/round-34/evidence/gaps/revive-real/montage.jpg; critic/rounds/round-34/evidence/seymour-flux-win-r34/seq-party-action
- Confidence: medium
- Requirement: CHK-027
- Smallest fix: Bailey decides whether a revive rise is a jerk; if not, tag revive swaps in the harness; if yes, shorten the lateral slide. No change without his word. Related: PR-0570.
- Acceptance check: A written rule or harness tag for revive rises, and Chapter XVII CHK-027 PASS or an owner-accepted exception.
- Carried from: new this round; last seen round 34

### PR-0616 [minor] delivery - The hidden Keeper and Maesters chapters request painted idle files that are not shipped: 4 to 8 console 404s a run and procedural placeholders on screen (was R34-D2, R74-6)

- Status: open
- Game / chapter / state: FFX (keeper) and FFX-2 (infinito) / spectral-keeper, ffx2-fallen-maesters / hidden chapters 29 and 30
- Expected: No failed requests on the live site; a placeholder shipped on purpose is not requested as a file.
- Observed: Console 404s for characters/spectral-keeper/idle.png (4), x2-aranea (8 on the seed-2004 run), x2-concherer (3), x2-black-elemental (1), x2-chac not reached; curl on live returns 404. The loader draws a procedural stand-in (white glow silhouette for Aranea, dark cloaked shape with rune arcs for the Keeper). The listed 19 chapters, yrp and waker log 0. The handoffs (ch-keeper, ch-maesters) record that no painting exists, so this is a known state with a console side effect. R74-6 also notes the Maesters prep tip is clipped at 1600x900 until PgDn (focused lane, not repeated here). ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Re-confirmed by the hidden lane's runs: art/characters/spectral-keeper/idle.png answers 404 (two console errors per Keeper run) and the Maesters' four fiends have no painted idle either.
- Repro: Type keeper (or infinito) on chapter select, play to the first fight, open the console; seed 1, 1600x900.
- Evidence: critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34/run.json; critic/rounds/round-34/evidence/spectral-keeper-win-r34/run.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/run.json; critic/rounds/round-34/hidden/keeper-ring-r2/trace.json
- Confidence: high
- Requirement: CHK-016 clean console, CHK-018 every delivery file present, CHK-012
- Smallest fix: Register the four keys as no-painting-yet so the loader draws the placeholder without requesting a file, or install the approved paintings through the art route (Bailey alone approves a painting).
- Acceptance check: A real-key run of keeper and infinito logs 0 console errors and 0 not-found requests.
- Carried from: new this round; last seen round 34b

### PR-0617 [minor] visual - Sin face: the hit flash blows the left third of the frame to white and the party reads as silhouettes

- Status: open
- Game / chapter / state: FFX / XVIII Sin face / turn 11, mouth shut, the 993 hit
- Expected: Party and floor keep painted detail through the flash.
- Observed: The bloom fills the left 40 percent of the frame with white, Tidus and Yuna read dark and the shrine backdrop is gone; the approved mouth-open tile keeps painted detail in its glare. One flash moment, not sustained.
- Repro: Chapter XVIII, seed 1, 1600x900, harness midfight step; compare targets/sin-face.jpg.
- Evidence: critic/rounds/round-34/evidence/sin-face-win-r34/23-midfight.png; critic/rounds/round-34/targets/sin-face.jpg
- Confidence: medium (one frame)
- Requirement: Approved-target gate, tile Sin: the Face; CHK-013
- Smallest fix: Cap the bloom in the treated Sin face scene (suspected the shared Overdrive flash; not traced).
- Acceptance check: A frame sequence across the flash shows faces and floor legible at the peak.
- Carried from: new this round; last seen round 34

### PR-0619 [minor] interface - The hidden Fallen Maesters command list prints a greyed "MIX NOT BUILT" row (was R34-INT-01)

- Status: open
- Game / chapter / state: FFX-2 / ffx2-fallen-maesters (hidden), Rikku as Alchemist / first menu and retry, seeds 1 and 2004
- Expected: A shipped command list shows no development vocabulary.
- Observed: The row reads "MIX  NOT BUILT" between ATTACK and ITEM. Traced: src/battle/ffx2/constants.ts:307 MIX_PICKER_REASON = "Not built", used by src/battle/ffx2/menu.ts:56 (a choice recorded at the r51 merge review, so also a question for Bailey). It first reaches a player in this new chapter.
- Repro: Type infinito, Enter through briefing and prep, look at Rikku's first menu; 33-retry-battle.png.
- Evidence: critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/10-first-menu-coach.png; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/33-retry-battle.png
- Confidence: high
- Requirement: CHK-007
- Smallest fix: Hide the Mix row while MIX_PICKER is off, or reword the reason in player language.
- Acceptance check: No captured card or command text contains "not built".
- Carried from: new this round; last seen round 34

### PR-0620 [minor] delivery - Hidden 3D Bahamut leaks about 34 textures per lose-and-retry (was R74-5; focused lane only, not repeated here)

- Status: open
- Game / chapter / state: FFX-2 / exp-yrp-3d (hidden) / five retries in one page
- Expected: Texture count flat across retries.
- Observed: Texture count 100, 137, 171, 205, 239, 273 over five retries with the JS heap flat at 290 MB (focused review lane YR-11). Rated minor by the chief: hidden, desktop-only, heap flat, and not reproduced in this review.
- Repro: Retry five times in one page of the yrp chapter.
- Evidence: critic/reviews/2342fe666-focused/hidden/yrp-run.log
- Confidence: medium
- Requirement: CHK-019
- Smallest fix: Dispose textures on teardown.
- Acceptance check: Textures flat over five retries.
- Carried from: new this round; last seen round 34

### PR-0621 [minor] narrative - The hidden Keeper and Maesters were never won by a player route, so their aftermath and the Maesters' later floor beats are unread

- Status: open
- Game / chapter / state: both (FFX Keeper, FFX-2 Maesters) / spectral-keeper, ffx2-fallen-maesters (hidden) / hidden chapters 29 and 30, win route
- Expected: A hidden chapter plays to its aftermath by legitimate input (CHK-022).
- Observed: Keeper: defeat at turn 5 to 10 (the harness line; the handoff documents about 3 wins in 100 with a scripted line). Maesters: defeat on floor 40 in 10 and 18 turns, and 103 turns over three attempts at seed 2004; floor 20 and 40 clear and floor 60 was reached in play. The entry scenes, the defeat card and RETRY read well. Whether the generic route loses because the fights are hard or because of tuning is not established. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): Still true for the aftermath, and narrower than stated: the Keeper was played by real keys to a defeat twice (seed 1, 24 decisions, 3.27 min; seed 2 with Bahamut, 7 decisions, 1.44 min) and never won; the Maesters' floors 20, 40 and 60 were won by real keys and floor 80 was lost, so no win of the Keeper or of floor 80 exists and their aftermath stays unread.
- Repro: Type keeper or infinito, play by the generic route, seeds 1 and 2004.
- Evidence: critic/rounds/round-34/evidence/spectral-keeper-win-r34/run.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34/run.json; critic/rounds/round-34/evidence/ffx2-fallen-maesters-win-r34-s2/run.json; critic/rounds/round-34/hidden/results.json
- Confidence: high that it was not reached
- Requirement: CHK-022
- Smallest fix: A real-key winning route for each (an advisor-aware route using Move and aeons for the Keeper; Darkness line and Paine walk for the Maesters) read to its last line.
- Acceptance check: Both reach results, CONFIRM and the post scene by keys with the lines read.
- Carried from: new this round; last seen round 34b

### PR-0627 [minor] harness - The 19-chapter continuity run did not finish inside the review window, so CHK-026 and CHK-027 have no stamped aggregate and 17 chapters have no fresh reading

- Status: fixed (verified round 34b)
- Game / chapter / state: both / all 19 listed chapters / critic/rounds/round-34/continuity
- Expected: A deep review ends with the stamped aggregate for all 19 chapters.
- Observed: The harness (critic/runner/lib/continuity.mjs, live URL, GPU, seed 1) finished Seymour Flux (462.7 s of battle) and Yunalesca (816.7 s) and was on Braska when the report was written; no continuity-summary.json exists, no strips beyond those two chapters. Round 33b ran all 19 in one 3 h 48 min run. The process was left running by the orchestrator; this critic neither started nor stopped it. The first-time fan therefore judged montages only. ROUND 34B (build 2342fe666, the full 19-chapter harness 683a773fead4): The harness finished (node pid 59260 exited 02:16:53 EST): 19 of 19 chapters, 11,131.9 s of battle, 10,849 swaps judged, the stamped aggregate embedded in this re-issue with node tools/continuity-id.mjs --embed. Closed.
- Repro: See run.log in the folder.
- Evidence: critic/rounds/round-34/continuity/run.log; critic/rounds/round-34/continuity/index.json; critic/rounds/round-34/continuity/continuity-summary.json
- Confidence: high
- Requirement: RUBRIC 6a: the harness is a required evidence step of every deep review
- Smallest fix: Start the 19-chapter harness as its own job at the start of the next deep review (about 3 h 50 min), and let its summary be embedded when it lands; if it finishes later, settle CHK-026 and CHK-027 with a re-issue of this report.
- Acceptance check: continuity-summary.json for 19 of 19 chapters embedded with node tools/continuity-id.mjs --embed.
- Carried from: new this round; last seen round 34b

### PR-0628 [minor] feel - Fan lens: a fighter is missing for a stretch and then appears in the last frame (Tidus on the Omnis stage for 9 frames, Rikku in the first Ixion frames)

- Status: open
- Game / chapter / state: both / seymour-omnis, ffx2-ixion-djose (fan lens) / idle to action montages
- Expected: A fighter stays on the stage or leaves with a motion.
- Observed: seymour-omnis seq-party-action f09 and ffx2-ixion-djose seq-action-playing f00 to f01. Read from 330 ms-spaced montages, not harness-measured; the cause (staging hold, camera crop, or a real pop) is not established.
- Repro: Chapter XII or XVI, the first action montage, seed 1.
- Evidence: critic/rounds/round-34/evidence/seymour-omnis-win-r34/seq-party-action; critic/rounds/round-34/evidence/ffx2-ixion-djose-win-r34/seq-action-playing
- Confidence: low to medium
- Requirement: First-time-fan lens (D-423)
- Smallest fix: Read the swaps at those frames in the continuity harness (Omnis and Ixion) before any change.
- Acceptance check: The harness reads Omnis and Ixion and the montage shows the figure present.
- Carried from: new this round; last seen round 34

### PR-0631 [minor] feel - The hidden Keeper and Maesters are the only chapters over the see-through line: pose swaps show a double image of severity 0.42 (CHK-027 FAIL there; the 19 listed chapters stay under 0.381)

- Status: open
- Game / chapter / state: both (FFX Keeper, FFX-2 Maesters; hidden) / spectral-keeper, ffx2-fallen-maesters (hidden) / hidden chapters 29 and 30, continuity probe, 1600x900, seed 1, live
- Expected: Under 0.4 at every swap (CHK-027 item 3).
- Observed: Maesters (dedicated harness, 94.8 s of battle): 45 of 119 swaps show a double image of severity 0.4 or more, worst 0.426; 1 swap jerk of 33.3 px; 0 snaps. Keeper (the probe attached to the live ring job, 176.5 s; the three dedicated harness routes ended under 60 s and read UNVERIFIED): 69 of 232 swaps over the line, worst 0.423; 0 swap jerks; 0 snaps; the short routes show the same (23, 22 and 7 swaps over). The 19 listed chapters read 0 swaps over the line, worst 0.381. Likely cause, read from the source and not traced further: SwapSwitch.WIDE_CHAPTERS names the 19 listed chapters only, so the hidden chapters are not on the wide swap scope and their swaps play as plain dissolves.
- Repro: Type keeper or infinito on the board; node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=ffx2-fallen-maesters --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); see the ghost strips.
- Evidence: critic/rounds/round-34/hidden/continuity/ffx2-fallen-maesters-win-r34/continuity/strips/ghost-012-x2-aranea-idle-hurt.jpg; critic/rounds/round-34/hidden/continuity/ffx2-fallen-maesters-win-r34/continuity/strips/swap-117-yuna-follow-critical.jpg; critic/rounds/round-34/hidden/continuity/spectral-keeper-win-r34/continuity/strips/ghost-002-spectral-keeper-idle-hurt.jpg; critic/rounds/round-34/hidden/keeper-ring-probe/continuity/strips/ghost-013-spectral-keeper-idle-hurt.jpg
- Confidence: high for the measurement; the cause is read from source, not proven
- Requirement: CHK-027
- Smallest fix: Put the two hidden chapters through the same swap scope as the listed ones if the cause is the scope (SwapSwitch.WIDE_CHAPTERS is one list), or shorten their blends; do not loosen the 0.4 line.
- Acceptance check: Harness on both hidden chapters (the Keeper with a route that lasts 60 s): ghost swaps over the line 0.
- Carried from: new this round; last seen round 34b

### PR-0632 [minor] feel - Spectral Keeper: Move changes the glyph flag, the banner and the cursor, but the figure does not walk to the glyph (no presenter hop for the platform event); Tidus stays among the party while the log says glyph 5

- Status: open
- Game / chapter / state: FFX only / spectral-keeper (hidden) / hidden chapter 29, first Move, 1600x900
- Expected: The stepping figure is seen to stand on its new glyph.
- Observed: Five Moves by real keys each produced an action-start move event, a platform event, the banner "steps to glyph N" and plat.at.<id> equal to N, but the figure did not move across the stage (the figure rect before and after the first Move: 699,525 291x330 to 661,475 254x382, the camera's push-in, not a walk to the glyph). Known: the lane handoff discloses that this build has no presenter hop for the platform event.
- Repro: Type keeper, choose Move for Tidus, pick Glyph 5; compare m-01-after-move.png with the opening frame.
- Evidence: critic/rounds/round-34/hidden/keeper-ring-r2/m-01-after-move.png; critic/rounds/round-34/hidden/keeper-ring-r2/m-02-after-move.png; critic/rounds/round-34/hidden/keeper-ring-r2/battle-log.json
- Confidence: high
- Requirement: CHK-023, CHK-020
- Smallest fix: A presenter hop (or a pose and slide) for the platform event, once Bailey picks how the party should read its glyph.
- Acceptance check: After a Move the figure stands on the chosen glyph in the next frame.
- Carried from: new this round; last seen round 34b

### PR-0633 [minor] interface - Spectral Keeper: Yuna's advisor card forecasts "Glyph 2 uses Glyph Mine before Auron can act", naming an idle Circle as the user of Glyph Mine; the user is the Spectral Keeper

- Status: open
- Game / chapter / state: FFX only / spectral-keeper (hidden) / hidden chapter 29, Yuna's menu at decision 10, 1600x900
- Expected: The forecast names the Spectral Keeper as the user.
- Observed: The forecast line names Glyph 2; the log says spectral-keeper:keeper-glyph-mine (seq 120). The same card names "Next best move Life -> Auron" correctly.
- Repro: Type keeper, play to the first lay (count 4 or more), open the advisor on Yuna's menu.
- Evidence: critic/rounds/round-34/hidden/keeper-ring-r2/m-10-lit-glyphs.png
- Confidence: high
- Requirement: CHK-023
- Smallest fix: Name the actor of the forecast move from its owner, not from the Circle it lights.
- Acceptance check: The card reads "Spectral Keeper uses Glyph Mine".
- Carried from: new this round; last seen round 34b

### PR-0634 [minor] interface - Fallen Maesters shell break: the boss strip keeps its Shell and Protect icons although DEF and MDEF read 1, and the banner is headed by the name of whoever was acting in that frame (Yuna) instead of Concherer or Paine

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-fallen-maesters (hidden) / hidden chapter 30, floor 60, 1600x900
- Expected: The icons drop or a break marker shows on the strip; the banner is headed by its subject.
- Observed: After Paine's Charon (21,420) the message "Concherer's shell breaks!" came once and the banner CONCHERER'S SHELL BREAKS! was on screen with the damage number, and DEF and MDEF read 1, but the boss strip still showed two status icons (Shell and Protect), so the HUD has no picture of the break beyond the banner; the banner carried the name of the acting girl in that frame (Yuna, whose Darkness was on screen).
- Repro: Type infinito, reach floor 60 with Paine's four Change rows, land one 10,000-plus result.
- Evidence: critic/rounds/round-34/hidden/maesters-walk-s1d/f3-03-shell-banner-0.jpg; critic/rounds/round-34/hidden/maesters-walk-s1d/f3-02-shell-broken.png
- Confidence: high
- Requirement: CHK-023
- Smallest fix: Clear the two status icons with the break (or draw a break tag) and head the banner with the boss.
- Acceptance check: The strip shows the break and the banner names Concherer.
- Carried from: new this round; last seen round 34b

### PR-0591 [polish] interface - First-time fan: the CHAIN counter box changes place from frame to frame (right edge, under the tail, mid-screen) and is clipped at the right edge

- Status: open
- Game / chapter / state: FFX-2 only / Chapter V Vegnagun / chain attack, 1600x900
- Expected: A counter sits still and inside the screen.
- Observed: In seq-action-playing the CHAIN box moves in the 10 frames and is cut off at the screen edge in several; the guide and intent cards also sit over Shiva (Fallen Aeons) and the tail (Vegnagun).
- Repro: Chapter V chain attack; fan sheet ffx2-vegnagun-shuyin-win-r32__seq-action-playing.
- Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-action-playing.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-fallen-aeons-win-r32__seq-party-action.jpg
- Confidence: medium
- Requirement: CHK-008
- Smallest fix: Anchor the counter to one slot.
- Acceptance check: The CHAIN box does not move between consecutive frames and is not clipped.
- Carried from: round-32b; last seen undefined

### PR-0593 [polish] harness - 30-post-scene.png is taken before the post scene (it plays after CONFIRM): eight runs log 'screen wanted cutscene got results' and the scene still is missing

- Status: open
- Game / chapter / state: both / six chapters / any win run of seymour-flux, evrae-airship, ffx2-leblanc and three more
- Expected: The post-scene frame is asserted where the scene is.
- Observed: The scene is reachable and its lines were read after CONFIRM (33-after-confirm-scene.png, Leblanc: Rikku, "That's for robbing our airship!"), but the 30 capture reads results. ROUND 34 (build 2342fe666): Six 30-post-scene frames are again taken while the scene plays after CONFIRM; afterConfirmScenes carries the lines.
- Repro: Read run.json fails of the six runs.
- Evidence: critic/rounds/round-32/evidence/ffx2-leblanc-win-r32/run.json
- Confidence: high
- Requirement: CHK-016
- Smallest fix: Assert 33-after-confirm-scene.png as the post-scene capture.
- Acceptance check: No UNVERIFIED on the post-scene frame.
- Carried from: round-32b; last seen round 34

### PR-0577 [polish] interface - FFX-2 target flag plate overlaps the command panel edge and clips the status tag ("Curse") at 1280 to 2000 wide (new in r68)

- Status: open
- Game / chapter / state: FFX-2 only / Chapter IV / target step
- Expected: No overlap and no clipped tag.
- Observed: Focused review R68-P2, candidate bundle (same artifact as live).
- Repro: Chapter IV, Attack, target step, 1280 to 2000 wide.
- Evidence: critic/reviews/2a9340249-focused.json
- Confidence: medium (focused review; not re-observed live by the chief)
- Requirement: CHK-008
- Smallest fix: Offset the flag clear of the panel edge.
- Acceptance check: Flag and panel rects do not intersect at five widths.
- Carried from: round-32b; last seen undefined

### PR-0578 [polish] interface - Phone board: three text chips under 44 px (skip the guide 18 px, two hint chips) (R68-P3)

- Status: open
- Game / chapter / state: both / phone board / 390x844
- Expected: 44 px touch targets.
- Observed: Focused review R68-P3; the chief's phone sweep read 14 px type, none under 14 px, on the battle menu, first menu and pause (separate from touch-target size).
- Repro: tools/text-floor-sweep.mjs --touch=1 --targets=1 --sizes=390x844.
- Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/gaps-chief/gaps/sweep/out-phone.json
- Confidence: medium
- Requirement: RUBRIC onboarding (device usability)
- Smallest fix: Pad the chips to 44 px.
- Acceptance check: Touch-target probe lists no control under 44 px on the board.
- Carried from: round-32b; last seen undefined

### PR-0579 [polish] visual - Magic Break caption box sits over its own pink tag and clips it (FFX-2 Chapter IV, 2000x1012; one capture)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-bahamut / mid-fight
- Expected: One readable label.
- Observed: The caption box overlaps the MAGIC BREAK tag so the tag text is half hidden. On the phone the same two labels sit side by side without clipping (23-midfight).
- Repro: node critic/runner/lib/route.mjs ffx2-bahamut win --size=2000x1012 --seed=1; open 23-midfight.png (moment dependent).
- Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/23-midfight.png
- Confidence: low
- Requirement: CHK-011
- Smallest fix: Offset the tag or drop the duplicate while the caption shows.
- Acceptance check: A Magic Break capture shows one readable label.
- Carried from: round-32b; last seen undefined

### PR-0553 [polish] interface - Chapter II: Tidus's HP plate covers Yunalesca's lower body in the hit frame; the party panel crosses Auron's boots (carried)

- Status: open
- Game / chapter / state: FFX only / yunalesca / first hit, 1600x900
- Expected: HUD off the boss body or faded over it.
- Observed: The plate sits over her legs and feet during the damage burst.
- Repro: Chapter II, seed 3, first hit, 23-midfight.
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/23-midfight.png
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Move the plates down or fade over a boss quad.
- Acceptance check: No plate over the boss body at that moment.
- Carried from: round-32b; last seen undefined

### PR-0548 [polish] feel - Hit flashes, whiteouts and glow edges wash out the figure for a frame or more (carried): Braska's Final Aeon is a white blob for five frames on a heal, Vegnagun flickers copper for a frame, Rikku glows double at the sphere change

- Status: open
- Game / chapter / state: both / braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-bahamut / effect frames
- Expected: A flash that stays readable.
- Observed: Fan strips: braska seq-action-playing f02-f06; vegnagun seq-action-playing f04 and f09; bahamut seq-spherechange f01-f02. ROUND 33: The fan again: a red see-through aeon over Yuna in the Isaaru summon, a translucent purple Bahamut with a smear over its wings, and Wakka smeared orange by Firaga in Omnis (single captures).
- Repro: Chapter III Power Wave heal; Chapter V chain; Chapter IV change.
- Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-action-playing; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing
- Confidence: medium
- Requirement: CHK-027 (flicker)
- Smallest fix: Cap the heal wash and the glow on the figure's alpha.
- Acceptance check: The figure outline stays readable in the named frames.
- Carried from: round-32b; last seen round 33

### PR-0574 [polish] feel - A boss or aeon and its pagodas appear in one frame (Braska battle start and aeon swaps); the party flashes from faded to full in one frame at the seams (first-time fan; the feel auditor read seams 3 and 5 as readable and paced)

- Status: open
- Game / chapter / state: FFX only / braskas-final-aeon / seq-transition-into-battle f02 to f03; seq-seam-2/4/6/7
- Expected: A readable arrival.
- Observed: See captures; the arena is empty for about 1.1 s, then a flash and the possessed aeon with a name banner. ROUND 33: The fan counts the same class in four more chapters: the arena opens with the party alone and the boss appears a frame later (Yojimbo f03 to f04, Flux, Isaaru Grothia, Trema Paragon), and Paragon arrives painted gold like its title card and re-tints to cold blue over the next few frames. It sits inside the battle-intro slate; polish. ROUND 34 (build 2342fe666): Fan lens: a fight opens with the party alone on an empty stage and no HUD or boss, which appear on the next frame (Flux seq-transition-into-battle f08 to f09; Braska seam 4 f00 and f04 to f05).
- Repro: Chapter III by real keys.
- Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-transition-into-battle; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
- Confidence: low
- Requirement: CHK-027 (popping)
- Smallest fix: None until Bailey judges the seam look (PR-0530).
- Acceptance check: A recorded verdict.
- Carried from: round-32b; last seen round 34

### PR-0575 [polish] feel - MISS pops over healthy allies when a party-wide Mega Phoenix is used with one ally down (unsourced; do not change without a source)

- Status: open
- Game / chapter / state: FFX only / seymour-flux / turn 3 Mega Phoenix
- Expected: Unknown: no source says what the original draws.
- Observed: The engine logs miss reason wrong-state for tidus and yuna while Kimahri's revive resolves; it reads as if the item failed. Round 30b saw the same.
- Repro: Chapter I seed 1 turn 3.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f04.jpg; critic/rounds/round-31/evidence/seymour-flux-win/battle-log.json
- Confidence: low
- Requirement: AGENTS rule 6
- Smallest fix: Source the original, or ask Bailey.
- Acceptance check: A sourced statement then the same repro.
- Carried from: round-32b; last seen undefined

### PR-0576 [polish] feel - UNVERIFIED observation: a blank cream cutscene frame between the Yunalesca victory and the results card

- Status: open
- Game / chapter / state: FFX only / yunalesca / victory to results
- Expected: The painting under the wash, or a few frames only.
- Observed: yunalesca-win/30-post-scene.png: flat cream with the chapter eyebrow and the advance strip and no painting; the harness read the screen as results (UNVERIFIED capture). Chapter I shows a washed painting.
- Repro: Chapter II seed 3, capture at the end of the fight (timed sequence needed).
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/30-post-scene.png
- Confidence: low
- Requirement: CHK-022
- Smallest fix: None until measured.
- Acceptance check: A timed sequence shows under 500 ms of a painting-less frame.
- Carried from: round-32b; last seen undefined

### PR-0536 [polish] feel - The turn cut-in (MF-16) covers nearly half the stage for several frames at every turn start in every chapter the fan looked at; the first-time fan rated it major

- Status: open
- Game / chapter / state: both / all / turn start
- Expected: Bailey's judgment.
- Observed: Carried; the first-time fan counted the turn-start cut-in covering most of the stage for about three frames in 11 chapters of both games (Trema, Den of Woe, Fallen Aeons, Bahamut, Yojimbo, Sin face, Evrae, Yunalesca, Natus, Mirror Aeons) and a giant damage number over the boss. A design choice awaiting Bailey's look (PR-0530). ROUND 33: The fan again: the big turn-start portrait slides over the left third or half of the stage for about 3 of every 10 sampled frames in 14 chapters of both games (40 sequences). A design choice awaiting Bailey (PR-0530); nothing new. ROUND 34 (build 2342fe666): Fan lens: a full-screen portrait cut-in covers most of the screen for two to four frames while an action plays out in Bahamut, Yojimbo, Evrae, Natus, Fallen Aeons and Braska.
- Repro: Any chapter, turn start.
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-transition
- Confidence: medium
- Requirement: RUBRIC feel (readable effects)
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- Carried from: round-32b; last seen round 34

### PR-0528 [polish] visual - First-time fan polish breakers kept: attacks that do not visibly connect (a Yunalesca slash arc around Tidus while she stands at the right edge; a Bahamut hit that arrives as a purple streak from off-screen), one empty-stage frame as Bahamut fades in, a monster vanishing for a frame (Mortiorchis)

- Status: open
- Game / chapter / state: both / yunalesca, ffx2-bahamut, seymour-flux / effects
- Expected: Effects aimed at their target.
- Observed: Carried; round 32 adds two fan readings: Vegnagun's Tail Beam damage number (1766) and a pink ring appear on Rikku but the tail does not visibly fire toward her (seq-party-action frames 4 to 8), and Ormi's Shield Bash lunge returns in one frame with a MISS floating in the gap. ROUND 34 (build 2342fe666): Fan lens: Tidus swings at the spot where Auron stands and the damage numeral appears over Auron, not Yunalesca (yunalesca seq-party-action f00 to f04); in Sin face the "30" hit lands on empty air in front of Sin.
- Repro: see captures
- Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange
- Confidence: low
- Requirement: CHK-027
- Smallest fix: Aim the slash and the streak from the actor.
- Acceptance check: Frames show origin at the actor.
- Carried from: round-32b; last seen round 34

### PR-0524 [polish] encounter - research/ffx2-bahamut.md still carries the superseded Mega Flare constant 24 and the 614 to 1,165 damage with no banner (carried)

- Status: open
- Game / chapter / state: FFX-2 only / ffx2-bahamut / docs
- Expected: A superseded banner.
- Observed: Carried: research/ffx2-bahamut.md still carries the superseded Mega Flare constant and damage range with no banner (git diff 2a9340249 e3f51bf18 -- research is empty).
- Repro: head and section 2.3 of research/ffx2-bahamut.md against re-ffx2-ai-bahamut-vegnagun.md section 2.3.
- Evidence: research/ffx2-bahamut.md
- Confidence: high
- Requirement: AGENTS rule 6
- Smallest fix: Add the banner.
- Acceptance check: The banner exists.
- Carried from: round-32b; last seen round 32

### PR-0533 [polish] test-coverage - The 15 s default test timeout fails 27 CPU-bound suites when the suite shares the host with browser jobs (extends PR-0533; the 13 files pass 239 of 239 serially)

- Status: open
- Game / chapter / state: both (tooling) / advisor, strategy-chapter2, door tests, ui-ffx2-atbmode, audio-manifest-io / full suite 27,254 tests
- Expected: A green full suite on a loaded host.
- Observed: 28 failed in 27 suites, all 15 s timeouts (one EPERM on a lock file) while the harness ran.
- Repro: npm test while a capture runs.
- Evidence: critic/rounds/round-31/audit-combat/full-suite.json
- Confidence: high
- Requirement: AGENTS Done means
- Smallest fix: Give the fuzz-style files a 60 s timeout; retry the lock open on EPERM.
- Acceptance check: npm test passes while one browser job runs.
- Carried from: round-32b; last seen undefined

### PR-0519 [polish] interface - Question for Bailey (carried): the default F1 HUD shows the advisor as a one-row chip; the reason, benefit and CURES KO tag live only in the G card

- Status: open
- Game / chapter / state: both / Chapters I and IV / first menu
- Expected: Bailey's decision.
- Observed: Advice itself is right: 784 of 784 picks found their row; the reason is one key away.
- Repro: Chapter I first menu.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-win/11-advisor.png
- Confidence: high
- Requirement: RUBRIC interface
- Smallest fix: Ask Bailey.
- Acceptance check: A recorded verdict.
- Carried from: round-32b; last seen undefined

### PR-0546 [polish] prep - The pro-defeat card now names its cause at normal speed ('Felled by Attack, turn 4, attempt 1' ) after r67's repair; the SKIP-speed wording was not re-run

- Status: open
- Game / chapter / state: both / Chapters I and IV / defeat card
- Expected: A cause at every speed.
- Observed: Seen at normal speed in both chapters; SKIP not re-run.
- Repro: Lose with battle speed SKIP.
- Evidence: critic/rounds/round-31/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
- Confidence: medium
- Requirement: RUBRIC prep (understandable defeat)
- Smallest fix: Run it at SKIP.
- Acceptance check: The card names a cause at SKIP.
- Carried from: round-32b; last seen undefined

### PR-0487 [polish] onboarding - 'He strikes first' coach against a turn order that puts Seymour third (carried; not reproduced in seed 1 where Seymour does strike first)

- Status: open
- Game / chapter / state: FFX only / Chapter I phone / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0508 [polish] onboarding - VISUAL STYLE and PRESENTATION 'THE ECHO - B' are unexplained and the FFX options pane shows no focused row (carried)

- Status: open
- Game / chapter / state: both / options / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 34 (build 2342fe666): Re-observed: VISUAL STYLE HD-2D and PRESENTATION THE ECHO - B are unexplained.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 34

### PR-0569 [polish] delivery - Firefox console font warnings for Rajdhani and Chakra (carried; Chromium only this round)

- Status: open
- Game / chapter / state: both / all / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0526 [polish] interface - Small copy and fit points in the booth and phone surfaces (carried, not re-examined)

- Status: open
- Game / chapter / state: both / booth, phone / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title. ROUND 33: The fan adds: two banners stack, "Strike" over "Shield Bash", in the first Ormi action of Leblanc (seq-transition-into-battle f05 to f07).
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen round 33

### PR-0527 [polish] delivery - UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 runs in round 29 (carried; none seen in the 19 live runs, but see the 5.6 s frame in PR-0580)

- Status: open
- Game / chapter / state: both / harness / carried
- Expected: as in the earlier rounds that opened it
- Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
- Repro: as in the entry of critic/rounds/round-30b.json
- Evidence: critic/rounds/round-30b.json
- Confidence: medium
- Requirement: see the round 30b entry
- Smallest fix: unchanged from round 30b
- Acceptance check: unchanged from round 30b
- Carried from: round-32b; last seen undefined

### PR-0595 [polish] interface - A ready Overdrive sits as the fifth row inside the bottom fade; the advisor's star is the only cue

- Status: open
- Game / chapter / state: FFX only / Chapter XIV Isaaru / Chapter XIV Isaaru, F1 command menu, Yuna, 1600x900
- Expected: A ready Overdrive reads as ready without scrolling.
- Observed: 'OVERDRIVE (star) READY' is drawn at roughly a quarter strength under the scroll fade with a down arrow; the advisor's pick (Grand Summon: Shiva, IN OVERDRIVE) lives in that row while the cursor starts on SPECIAL.
- Repro: Chapter XIV first menu, Yuna, 1600x900.
- Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png
- Confidence: medium (contrast not measured)
- Requirement: RUBRIC interface (legible values)
- Smallest fix: Float a ready Overdrive row to the top slot or exempt it from the fade.
- Acceptance check: At 1600 the OVERDRIVE row's text contrast is at least 4.5:1 whenever the gauge is full.
- Carried from: round-32b; last seen undefined

### PR-0608 [polish] interface - Mirror Aeons offers no enemy-move card (E shows nothing, no E label): a question for Bailey, not a build

- Status: open
- Game / chapter / state: FFX / XXVII mirror-aeons / first menu, key E, seed 1
- Expected: Either an intent card for Dark Sandy, Dark Mindy and Dark Yojimbo or a written reason.
- Observed: run.json intentText is empty, the turn strip carries no "E ENEMY MOVE" label and the key strip lacks E. Same in round 32. Consistent (no false promise) but the only chapter without enemy intent; intent data exists for Yojimbo (yojimbo-rules.ts). ROUND 34 (build 2342fe666): Re-observed: Mirror Aeons E shows nothing (intentText empty in both runs).
- Repro: Chapter XXVII, seed 1, first menu, press E: evidence/mirror-aeons-win-r33b/12-intent-E.png.
- Evidence: critic/rounds/round-33/evidence/mirror-aeons-win-r33b/12-intent-E.png
- Confidence: medium
- Requirement: honest intent (a question, not a proposal to build)
- Where (only if traced): intent data coverage
- Smallest fix: Decide whether the Mirror Aeons get cards (needs Bailey's yes).
- Acceptance check: A decision is recorded.
- Carried from: new this round; last seen round 34

### PR-0609 [polish] interface - At 3840x2160 with a device pixel ratio of 1 the pause text does not grow with the screen (about 0.8 percent of height against 1.6 percent at 1600x900)

- Status: open
- Game / chapter / state: both / I seymour-flux at 3840x2160 DPR 1 / sweep matrix
- Expected: The pause scales like the battle HUD, or the size is known to be reached only with OS scaling.
- Observed: Battle HUD minimum 25.2 css px at 4K, pause minimum 17 px; in the frame the pause stats and tab strip are small on a 2160 px canvas. DPR 1 at 4K is the harsh case; a real 4K screen is usually run at 150 to 200 percent.
- Repro: evidence/gaps/sweep-matrix-3840x2160/02-pause.png and out-matrix.json.
- Evidence: critic/rounds/round-33/evidence/gaps/sweep-matrix-3840x2160/02-pause.png; critic/rounds/round-33/evidence/gaps/sweep/out-matrix.json
- Confidence: low on player impact
- Requirement: CHK-003
- Where (only if traced): pause CSS; not traced
- Smallest fix: Scale the pause text with the viewport above 2560 wide, or confirm real 4K screens run scaled.
- Acceptance check: Pause minimum effective size at 4K DPR 1 at least 22 px, or recorded as accepted.
- Carried from: new this round; last seen undefined

### PR-0611 [polish] visual - Possessed Ifrit and Possessed Shiva seam scenes frame Auron from the chest down for the whole seam, with no face: a question whether that framing is the intent

- Status: open
- Game / chapter / state: FFX / III braskas-final-aeon, seams 3 and 5 / seq-seam-3 and seq-seam-5, f00 to f09
- Expected: The seam shot shows what the story beat needs; if the face is meant to be out of frame this is intended.
- Observed: A low close-up of Auron's coat, sword and legs on a near-black ground; the first frame is nearly black. It reads as a deliberate stylised shot (a detail shot of the coat), and no defect is established. Seams 4, 6 and 7 were not opened by the fan.
- Repro: Chapter III, seed 1, reach seam 3 and 5.
- Evidence: critic/rounds/round-33/evidence/braskas-final-aeon-win-r33/seq-seam-3/f03.jpg
- Confidence: low
- Requirement: cinematic direction; a question for Bailey
- Where (only if traced): seam scene camera
- Smallest fix: None until Bailey says whether the framing is wanted.
- Acceptance check: Bailey's answer recorded.
- Carried from: new this round; last seen undefined

### PR-0612 [polish] harness - The capture route and the harness leave gaps this round: no ACCESSIBILITY, CONTROLS or MUSIC frames and no TEXT SIZE 115/130 on the new F1 chapters (seventh review), the continuity harness took 3 hours 48 minutes for 19 chapters (02:31 to 06:19 EST) and finished after round 33 was first written, and the desktop lose runs end at the defeat state with no retry step

- Status: open
- Game / chapter / state: both / critic capture route / critic capture owner and gap pass
- Expected: An accessibility leg in the route, a harness run that finishes inside the review, and a retry step in every lose run.
- Observed: run.json pause.tabs lists only the character tabs, Chapter, Guide and Options; the harness had read 4 of 19 chapters after 73 minutes and all 19 by 06:19 (round 33b); the FFX-2 Chapter IV retry was added by the gap pass (retry-ffx2-bahamut, 9.3 s from TRY AGAIN to the first menu) but the FFX Chapter I desktop retry has no timed file. ROUND 34 (build 2342fe666): Added this round: the 19-chapter continuity run did not finish (PR-0627); the capture route still never opens ACCESSIBILITY, CONTROLS or MUSIC; the continuity pass read no hidden chapter.
- Repro: evidence/*/run.json.
- Evidence: critic/rounds/round-33/continuity/run.log; critic/rounds/round-33/evidence/gaps/retry-ffx2-bahamut/timed.json
- Confidence: high
- Requirement: RUBRIC section 6 onboarding; CHK-026/027 required evidence
- Where (only if traced): critic/runner
- Smallest fix: Add the accessibility leg and the retry step to the route; start the continuity harness first in the next deep review, in two halves on two profiles, so it finishes. Critic tooling only.
- Acceptance check: Frames exist for each listed state and the harness summary is written before the report.
- Carried from: new this round; last seen round 34

### R72-3 [polish] feel - Chapter XII real-clip dashes up to 84.1 px against 0 on the control (carried from the focused review)

- Status: open
- Game / chapter / state: FFX / XII seymour-omnis / continuity harness, seed 1, same-artifact focused run
- Expected: No new dashes from the real clips.
- Observed: Dashes worst 84.1 px (under the 100 px bar); swap jerk 30 px; CHK-026 and CHK-027 PASS. The control build has 0 dashes. ROUND 33B: the full run reads the same Omnis numbers (23 dashes over 40 px, worst 84.1 px; 30 swap jerks, worst 29.9 px; CHK-026 and CHK-027 PASS).
- Repro: Continuity harness on seymour-omnis, seed 1.
- Evidence: critic/reviews/01a767770-focused/continuity/continuity-summary-seymour-omnis.json
- Confidence: high
- Requirement: CHK-027
- Smallest fix: Review the XII dash strips and ease the clip entry.
- Acceptance check: Dashes under 60 px on XII.
- Carried from: new this round; last seen round 33b

### PR-0618 [polish] interface - In the hidden 3D chapters the HUD panels sit over the boss and Wind Waker shows an orphan "E HIDE" tag (was R34-INT-02)

- Status: open
- Game / chapter / state: FFX-2 (hidden 3D chapters yrp and waker, desktop-only) / exp-yrp-3d, exp-windwaker / 1600x900 first menu, E and target frames
- Expected: Panels leave the boss clear; no label without its card; an owner verdict on the models.
- Observed: 3D Bahamut: the guide panel opens over the model's torso, in the target step the lotus ring lands on the guide text and the WAIT-ATB HELD chip sits on the boss ribbon (Wind Waker already starts its guide folded, the 3D Bahamut does not). Wind Waker: the command rows stand over Valefor and the target line crosses the E card text; a dark "E HIDE" tag hangs at top centre with no card beneath. Also open for Bailey: the Wind Waker cast is Meshy toon models, and he rejected the same kind of AI-made 3D cast for yrp (D-1130); the frame otherwise matches target C-3.
- Repro: Type yrp or waker, play to the first menu, press E then Enter on ATTACK.
- Evidence: critic/rounds/round-34/evidence/exp-yrp-3d-win-r34/12-intent-E.png; critic/rounds/round-34/evidence/exp-yrp-3d-win-r34/16-target-single.png; critic/rounds/round-34/evidence/exp-windwaker-win-r34/16-target-single.png; critic/rounds/round-34/evidence/exp-windwaker-win-r34/23-midfight.png
- Confidence: medium-high (eye reading)
- Requirement: CHK-008
- Smallest fix: Start the 3D Bahamut's guide folded as the Wind Waker's is, drop the guide while a target cursor is up, hide the tag with its card; ask Bailey to judge the toon models.
- Acceptance check: No panel over the model's torso in the first menu, E and target frames; no orphan tag.
- Carried from: new this round; last seen round 34

### PR-0622 [polish] encounter - Spectral Keeper difficulty for a person is unmeasured: the best crude bot wins 7 of 200 and no human-paced run used Move or aeons

- Status: open
- Game / chapter / state: FFX / spectral-keeper (hidden) / hidden chapter 29
- Expected: A sourced boss that is hard but fair with a findable answer.
- Observed: Attack-only 0/200, random 0/200, every bot line that skips aeons 0/200; aeons plus dodge plus heal 7/200 at party HP x1 (median 26,165 of 52,000 dealt), 39/200 at x2. The capture's real keys attacked and healed and lost in 5 turns (the first sweep hits all three front-liners for about 2,400 each). Winnable by a bot; whether a person finds the Move-and-aeon line is unverified. No sourced number is disputed.
- Repro: KEEPER_MEASURE=200 npx vitest run tests/unit/chapters/spectral-keeper-measure.test.ts.
- Evidence: critic/rounds/round-34/audit-combat/keeper-measure-200.log; critic/rounds/round-34/audit-combat/keeperfuzz-cand.json
- Confidence: low
- Requirement: RUBRIC section 6 encounter
- Smallest fix: Nothing to change now: one real-key run that wins using Move and an aeon, then Bailey's call on whether the tip says enough about stepping off the front trio.
- Acceptance check: One real-key win with the Move row, a lit mine and its blast on screen.
- Carried from: new this round; last seen round 34

### PR-0623 [polish] combat - Two source conflicts were resolved by the builder's own reading and are not recorded as decisions (Keeper aeon-mode counter on a miss; Spider Bite damage class)

- Status: open
- Game / chapter / state: both (one reading in each hidden chapter) / spectral-keeper under an aeon; ffx2-fallen-maesters floor 20 / hidden chapters
- Expected: Where research contradicts itself the conflict is reported and the choice recorded as the owner's or the driver's.
- Observed: (1) RE 4.5 lists the aeon extra +1 after the damaging-hit step so the code adds it on any HP-class hit including a miss, while RE 4.4 and section 6 say +2 per damaging hit (src/battle/ffx/ai/spectral-keeper.ts keeperOnHit). (2) RE section 8 calls Spider Bite physical but its appendix row has damage flags 0x0; the code follows the row (src/data/ffx2/enemies/fallen-maesters-abilities.ts). Both are commented in code. Small effect.
- Repro: Read the cited sections.
- Evidence: research/re-ffx-spectral-keeper.md; research/re-ffx2-fallen-maesters.md
- Confidence: medium
- Requirement: RUBRIC section 2: conflicting evidence is reported, never invented
- Smallest fix: Record both as driver picks in the handoffs and the decisions ledger.
- Acceptance check: Each reading has a ledger row naming the conflict.
- Carried from: new this round; last seen round 34

### PR-0624 [polish] combat - The Black Elemental's Reflect is data only: floor 40 is easier than the game, and a code comment says the opposite of the pinned test

- Status: open
- Game / chapter / state: FFX-2 / ffx2-fallen-maesters floor 40 / hidden chapter 30
- Expected: Comment and test agree; the redirect is ported when the engine gets it.
- Observed: The engine has no monster-side Reflect redirect; tests/unit/chapters/fallen-maesters-engine.test.ts line 136 (KNOWN GAP) pins that a reflectable spell lands, while the comment above x2BlackElemental in src/data/ffx2/enemies/fallen-maesters.ts claims the redirect. Scan text implies a bounce that does not happen. Floor 40 won 31 of 40 on the Darkness line.
- Repro: Run the engine test (T0), or cast Drain at the Black Elemental.
- Evidence: tests/unit/chapters/fallen-maesters-engine.test.ts; critic/rounds/round-34/audit-combat/maestersfloors.json
- Confidence: high
- Requirement: AGENTS.md rule 6; honesty of in-game text
- Smallest fix: Correct the comment now; port the redirect later and re-measure floor 40.
- Acceptance check: The comment matches the test; after a port T0 expects a bounce.
- Carried from: new this round; last seen round 34

### PR-0625 [polish] interface - The one-row advisor chip says "no MP" for Darkness while the HP cost lives only in the card (was R34-INT-03)

- Status: open
- Game / chapter / state: FFX-2 / IV Bahamut (chip), XV, XI, XVI (card) / Dark Knight dressphere
- Expected: The cost beside the action names every cost.
- Observed: Chip: "Darkness -> all enemies . no MP"; the card in Chapters XV, XI and XVI says "Costs Paine 12.5% of max HP". The 12.5 percent is the card's statement, not re-checked against research.
- Repro: Chapter IV CHANGE with Rikku in Dark Knight against the Den of Woe advisor text.
- Evidence: critic/rounds/round-34/evidence/ffx2-bahamut-win-r34/21-change-open.png; critic/rounds/round-34/evidence/ffx2-den-of-woe-win-r34/run.json
- Confidence: medium
- Requirement: CHK-004
- Smallest fix: Print the HP cost in the chip's cost slot.
- Acceptance check: Chip and card carry the same cost for Darkness.
- Carried from: new this round; last seen round 34

### PR-0626 [polish] interface - The FFX phone target card's element chips touch the hint line (was R34-INT-04)

- Status: open
- Game / chapter / state: FFX / I seymour-flux 390x844 / phone ATTACK target step
- Expected: Chips and hint do not touch.
- Observed: The WATER / HOLY / GRAV chip row sits against "Tap another enemy to switch . swipe"; descenders touch in a 3x zoom.
- Repro: Chapter I on a phone, aim ATTACK.
- Evidence: critic/rounds/round-34/evidence/seymour-flux-win-r34-phone-touch/16-target-single.png; critic/rounds/round-34/scratch/int-phone-target-zoom.png
- Confidence: medium
- Requirement: CHK-008
- Smallest fix: Add 6 px between the chip row and the hint.
- Acceptance check: Chip row bottom is at least 4 px above the hint.
- Carried from: new this round; last seen round 34

### PR-0629 [polish] feel - Fan lens: damage and heal numbers hang 6 to 10 frames, drift with the camera and sometimes overlap (445 over 7573)

- Status: open
- Game / chapter / state: both / Flux, Evrae, Braska, Fallen Aeons, Vegnagun, Yojimbo / damage numbers in action montages
- Expected: A numeral holds its anchor on the struck figure and does not overlap.
- Observed: The same number sits over a different spot as the shot changes (1968, 1329, 3023, +1500, 2450, 7573). Two numerals stack in one frame.
- Repro: The action-playing montages of the six chapters.
- Evidence: critic/rounds/round-34/evidence/seymour-flux-win-r34/seq-action-playing; critic/rounds/round-34/evidence/evrae-airship-win-r34/seq-action-playing
- Confidence: medium
- Requirement: First-time-fan lens (D-423)
- Smallest fix: Anchor numerals in the figure's space during camera moves and stagger simultaneous numerals.
- Acceptance check: A montage shows each numeral on its figure through the camera move.
- Carried from: new this round; last seen round 34

### PR-0630 [polish] feel - Fan lens: party figures slide sideways between frames while a move plays, and Dark Mindy hangs in mid-air

- Status: open
- Game / chapter / state: both / Flux, Bahamut, Mirror Aeons / party action montages
- Expected: Feet stay planted unless the move travels; floating is a designed hover.
- Observed: Tidus and Yuna glide left across the floor in the Mega Phoenix move (Flux seq-party-action f00 to f03); Rikku and Paine shift when the camera moves (Bahamut f03 to f04); Dark Mindy and her sisters hang at the top of the stage (Mirror Aeons seq-action-playing f00 to f09). The fan's list was cut off in the task text after this entry.
- Repro: The three montages.
- Evidence: critic/rounds/round-34/evidence/seymour-flux-win-r34/seq-party-action; critic/rounds/round-34/evidence/mirror-aeons-win-r34/seq-action-playing
- Confidence: low to medium
- Requirement: First-time-fan lens (D-423); CHK-027 feet
- Smallest fix: Confirm with the harness feet reading before changing any motion.
- Acceptance check: Feet shift under the CHK-026 line in the three chapters.
- Carried from: new this round; last seen round 34

## Closed this round

- PR-0473: Revive as a dissolve with no rise: verified repaired by release 74 in the FFX strip (c17-N swap-1134: lying Tidus, green ring, 7 ghost frames, he rises) and in the FFX-2 page (183 ms crossfade, 0.5 s rotation, no one-frame swap; two reads, one injected and one by real keys). What remains is PR-0615.
- R74-1: Merged into PR-0584 (Chapter III).
- R74-2: Now PR-0614.
- R74-3: Merged into PR-0459 (Chapter I).
- R74-4: The FFX-2 revive half is read (PR-0473 closed); the Chapter XII walk and Chapter XVII TEXT SIZE 115 remain under R72-1 and PR-0558.
- R74-5: Now PR-0620 (minor).
- R74-6: Now PR-0616.
- PR-0627: The 19-chapter continuity run finished (pid 59260 exited 02:16:53 EST); its stamped aggregate is embedded in this re-issue and CHK-026 and CHK-027 are recorded from it (FAIL, FAIL).
- PR-0534: Lulu's rig head verified repaired by the full run: 861 rig-head readings, none over tolerance; the five chapters that failed CHK-026 on it alone pass.

## What stands between this build and acceptance

- A deep review cannot accept a milestone; this one is PROVISIONAL because audio and onboarding are UNVERIFIED.
- Five categories under the 9.0 floor (visual 8.5, feel 7.8, narrative 8.8, interface 7.7, delivery 8.4); 13 critical or major issues open; mandatory checks CHK-003, 006, 008, 009, 011, 020, 026 and 027 FAIL.
- Four required targets unverified and three waiting; eight human judgments not recorded (Bailey's listening and feel verdicts first); the Keeper and the Maesters' floor 80 have never been won.
- The pose-swap family (PR-0531, PR-0380, PR-0379, PR-0584, now PR-0614) is the largest single block and needs its written method check before another batch.

## What changed since round 33b (01a767770, release 72), without comparing to rubric v1

- Credits: Lulu's rig head repaired in every chapter (five chapters that failed CHK-026 on it alone pass); head swaps over tolerance 415 to 16; swap jerks of 40 px or more 54 to 35 (Yunalesca 21 to 4, 153.5 to 103.7 px; Sin core 8 to 6, 255.2 to 172.0 px); see-through 1,831 to 1,720 ms a minute; Sin fins and core and Sin face treated with a legible held HUD (19 of 19 listed chapters treated); the revive reads as a rise in FFX and in FFX-2 (PR-0473 closed); desktop retry read in both games; four hidden chapters open by typed word and play to results or a defeat card with retry.
- Debits: fast-speed jumps remain (PR-0614); Chapter I frame time worsens a third build running (PR-0580); first UI sounds fall back to synth in 22 of 31 runs (PR-0514); hidden chapters 404 four painted idle files (PR-0616) and read over the see-through line (PR-0631); Maesters floor 80 unwon so far (PR-0613); Fallen Aeons has one more swap jerk than in 33b (5, 48.2 px against 4, 44.6 px).
- Scores: combat 9.4 and encounter 9.2 unchanged; visual 8.4 to 8.5; feel 7.9 to 7.8; narrative 8.8 unchanged; interface 7.8 to 7.7; prep 8.9 to 9.0; delivery 8.5 to 8.4; audio and onboarding UNVERIFIED as before.

## Proposals (nothing here is built without Bailey's yes)

- Written method check for the pose-swap family before any further batch (RUBRIC section 8): PR-0531, PR-0380, PR-0379 and PR-0584 have stood open at the same severity since round 29 and PR-0614 now joins them; read the worst strip per class, decide whether swaps under a close-up camera are excused, and settle the revive-rise rule with Bailey (PR-0615).
- Keep the 19-chapter continuity harness as its own first job of every deep review (it finished this time and is embedded; about 3 h 45 min) and give the Keeper a route that lasts 60 s so its CHK-026 and CHK-027 can be read by the dedicated harness.
- Fast speed: give the strike and ko/follow-to-idle swaps a minimum of drawn frames at fast speed (PR-0614) and keep the planned-smear window honest.
- Fallen Maesters floor 80: either bench a sourced delay-lock kit first or print the honest one-line label on the card (PR-0613); Bailey decides.
- Hidden chapters: register the four no-painting keys so the console stays clean (PR-0616), hide the Mix row (PR-0619), fold the 3D guide by default (PR-0618).
- Chapter I frame-time bisect across 01a767770, d5049f686 and 2342fe666 with the first Yuna cast (PR-0580).
- Ten cold-profile sound-start runs on an idle machine to separate capture load from a real regression in the synth fallback (PR-0514).
- Add a unit sweep over every intent card asserting low <= high (PR-0603) after the written method check.
- Hidden chapters: look at the two ghost strips per chapter and decide whether the Keeper and the Maesters join SwapSwitch.WIDE_CHAPTERS (PR-0631); give the Keeper's Move a presenter hop (PR-0632) once Bailey picks how a glyph should read.
