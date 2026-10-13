# Critic round 24: deep review of live main 72973096 (bundle CECt6LNe, release 39.4.4)

```text
Build / artifact / target version: main 72973096, bundle CECt6LNe, artifactHash 9c54b0964c6bd4d4778c605849d69efb0568871cd232e596c6a92efa4c4c14db, targets ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98
Review: deep (chief critic; live site https://echoesofspira.com/, headless Playwright, PYREFLY_BROWSER=gpu, no black-canvas fallback needed)
Deployment: PASS
Changed area: FAIL
Ship: SHIP, and why: no critical defect was found and none is introduced or left reachable by this change: every one of the 18 listed chapters and the three hidden chapters was played by real keys to an outcome and results with no lock, crash or lost progress; the one stall (Yojimbo) was host load and re-ran clean; no save path changed (SaveData.ts and the schema are identical to 931613a8). (majors disclosed: see the list below)
Milestone: not assessed
Quality: PROVISIONAL, no total: visual, audio, prep and delivery carry no number (UNVERIFIED). Scored: combat 9.4, encounter 8.5, feel 7.7, narrative 8.7, interface 8.4, onboarding 8.3. Last full score: none under rubric v2 (round 23, d3fe9fe5, was also provisional).
Targets: required 51 / matched 14 / failing 0 / unverified 36 / waiting on decision 1
Top issues: PR-0378, PR-0379, PR-0380, PR-0421, PR-0333, PR-0279, PR-0353, PR-0148, PR-0407, PR-0269 (see the ranked list)
Coverage: tested, reused and not tested are in the coverage matrix below; required-not-tested items keep their checks UNVERIFIED
Next required review and why: the deep obligation of 72973096 stays pending (mandatory checks FAIL or UNVERIFIED, four categories unnumbered); next batch is critic tooling first, then the Ch IV camera and phone view and the docs and stereo choice
Elapsed review time / repeated work avoided: about 215 minutes wall clock; CHK-025 and the Ch I harness reused with dependency arguments; no browser opened by the chief
```

## Score output (critic-score, verbatim)

```text
score: PROVISIONAL — no verified score for visual, audio, prep, delivery (never averaged away, never zero)
below the 9 floor: encounter, feel, narrative, interface, onboarding
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for visual, audio, prep, delivery
  - category encounter is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is UNVERIFIED
  - mandatory check CHK-005 is UNVERIFIED
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-007 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is UNVERIFIED
  - mandatory check CHK-013 is UNVERIFIED
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 12 critical or major issue(s) remain open
  - encounter yunalesca has no complete real-input flow
  - encounter ffx2-trema has no complete real-input flow
  - encounter ffx2-den-of-woe has no complete real-input flow
  - encounter sin-face has no complete real-input flow
  - 36 required target(s) unverified
  - 1 required target(s) waiting
  - only 14 of 51 required targets matched
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
  - human judgment not recorded: Audio: boss-bahamut and boss-leblanc by ear, and wide versus narrow stereo (PR-0425; the D-582 class)
  - human judgment not recorded: Visual: Bahamut at 0.66 in Ch IV and the approved A-ffx2-battle tile's composition; which governs (PR-0421 context)
  - human judgment not recorded: Feel: Bailey's play of release 39.4.4 (CHK-B2), and calibration of the five sub-scores (D-426)
report: valid evidence
```

## Verdicts

- **deployment**: PASS: the exact artifact is live (the live review compared all 5,162 files, 10.3 GB, 0 mismatched; artifactHash 9c54b096...c14db) and the capture owner's runs were clean: 0 console errors and 0 responses of 404 or above in every run of this round. The first-load-time clause is not covered.
- **changedArea**: FAIL: the W2 engine met its targets (979 of 979 records equal, win rates equal inside noise, fanfare rule works in both games, art identity intact, Yuna Wedding-Mage hurt and KO render as one painting each), but the changed Ch IV camera shows the backdrop plate edges (PR-0421), the phone view hides Bahamut (PR-0333), the two new cues fail the stereo gate and THEMES.md was not updated (PR-0424, PR-0425), and CHK-026 and CHK-027 still FAIL on the changed presentation.
- **milestone**: not assessed (a deep review cannot accept a milestone)
- **ship**: SHIP: see shipReasons.

### Ship reasons

- SHIP: no critical defect was found and none is introduced or left reachable by this change: every one of the 18 listed chapters and the three hidden chapters was played by real keys to an outcome and results with no lock, crash or lost progress; the one stall (Yojimbo) was host load and re-ran clean; no save path changed (SaveData.ts and the schema are identical to 931613a8).
- No regression against live 931613a8 is established. Ch II: the route's loss is a harness fault (revives aimed at Yunalesca, PR-0397) and the engine's intended line wins 100 of 100; the W2 data audit reads 979 of 979 command records equal to the game's own tables; win rates equal the builder's RC1 and W2 tables inside noise (Chapter X fell 77 to 60 percent because Flare now costs the game's rank 3, still winnable, PR-0426).
- Every major is carried at the same level or not a regression: motion continuity (snaps 0.60 against 0.58, jerks 1,043 against 1,092; the 253 double images against 161 are flagged with the regression question open), Trema, Sin Face (the 12-turn rule is live since 39.4.3), the owner verdict, the stand-in cues.
- The majors inside the new camera and phone views (PR-0421, PR-0333) are defects in a changed feature and do not block; they are disclosed. The fanfare rule works (one fanfare at the end of the last link, none at any seam, both games) and the exact artifact is live (5,162 of 5,162 files, 0 console errors, 0 responses of 404).

### Majors this release discloses

- PR-0378, PR-0379, PR-0380 (owner-reported, CHK-027 FAIL, carried): KOs are one-frame cuts, most pose changes show two copies of a figure and large figures jump (0.60 snaps a minute against 0.25, 1,043 one-frame jerks over 40 px, 253 double-image swaps at 0.4 or more, up from 161 in round 23, Leblanc 20 to 77; regression against live unknown)
- PR-0421 (new view, FFX-2 Ch IV): the wide camera pull shows the backdrop plate edges at 1600x900 and 2000x1012; and PR-0333: on a 390x844 phone the first menu hides Bahamut behind the strip, banner and coach
- PR-0279 (carried, a question for Bailey): Chapter XVIII wins almost never under the 12-turn rule (shipped line 0 of 100, advisor card 3 percent on the bench), no real-input win in any round
- PR-0353 and PR-0407 (carried): Chapter XIII Trema has no real-key victory in seven reviews (the engine now wins it 22 of 60) and a link-2 retry can start from one survivor
- PR-0148 (carried): no numeric owner listening verdict; boss-bahamut and boss-leblanc were chosen by delegation, not by ear, and both fail the stereo gate (PR-0425)
- PR-0269, PR-0099 (partly addressed) and PR-0222 (carried, not re-tested): the Ch XVII card chain rate, stand-in cues for the other chapters, the hidden FF7 cold-cache hold
- WITHDRAWN: the focused review's disclosed major F7297-02 (Ch II advisor route loses at seed 1) is a harness fault (PR-0397), not a product defect

## The ten categories

### combat: 9.4

CHIEF: kept at 9.4 as audited (round 23: 9.4). The engine changed a lot (W2: FFX turn order, status step, per-turn ticks) and the proof is strong, so the score holds, but two small player-visible regressions and one old mechanics gap keep it from rising. AUDITOR (combat, round 24, live main 72973096 bundle CECt6LNe; no browser; tree D:/pyrefly-r39-int at 72973096): tsc clean; full vitest on the exact tree 1,037 files, 16,105 of 16,176 tests pass; six failures are 15 s timeouts under full-suite load (advisor-floor, sin-fins-core-bench, sinspawn-gui-bench: all pass alone), three are real and not combat (themes-chapter-cue-map, PR-0424). DATA AUDIT independent of the builder: the game's four command tables (item, command, monmagic1, monmagic2: 979 records) re-read from the raw jppc .bin files with the auditor's own reader and compared with tests/fixtures/parity/ffx/command_status.json: 979 of 979 equal, 0 differences (Flare is rank 3 in record 0x6079, so Natus's Flare at rank 3 is the game's). Sinspawn Gui and Experiment rows match research/re-ffx-ai-gui.md and re-ffx2-experiment.md. BOUNDARY CASES: CTB kernel table (AGI 10 tick 14, rank 3 = 42, Haste 21, Slow 84, AGI 255 tick 3, rank 0 pays rank 1) equals research/re-ffx-ctb-status.md; live event logs show per-actor turn intervals equal tick speed x rank; Zombie, Regen, Poison, Haste/Slow, Petrify and Double HP tests pass. WIN RATES on fresh seeds 1001-1100 (intended line) reproduce the builder's 500-seed table inside noise: I 99, II 100, III 98, VII 93, VIII 93, IX 96, X 62, XII 85, XIV 81, XVII 86, XVIII 0 of 100 (the builder's own harness has XVIII at 117 of 500); FFX-2 IV 60/60, V 50/60, VI 59/60, XI 59/60, XIII 22/60, XV 24/60, XVI 60/60. Credibly wrong lines (attack only, defend only, random) win 0 of 40 in Ch I, II, III and X. Findings: aeon menu offers a Defend that does nothing (PR-0383), reactions ignore the can-act gate (PR-0427), Natus guide line loses (PR-0426). NOT SHOWN: no Overdrive window, Trigger Command or dresssphere change was played by real input in the capture owner's runs; the gap pass played them (Auron Bushido, Tidus Swordplay and Talk, Yuna Gunner change) and found no defect. 28 parity kernels (FFX Overdrive gauge, AP, drops, steals; the whole FFX-2 ATB clock) remain unwired by design (scope, not a defect).

### encounter: 8.5

CHIEF: kept at 8.5 as audited (round 23: 8.7), with one correction: the capture owner's and the gap pass's "Chapter II route loses" is NOT counted against this category, because the route aimed fifteen Phoenix Downs at Yunalesca instead of Yuna (PR-0397, traced by the chief in run.json picks[54..72]: want "Yuna" resolved to engine id yunalesca, mismatch false); the engine's intended line wins 100 of 100 fresh seeds. AUDITOR (encounter, round 24): down 0.2. Gains: FFX-2 Chapter XIII Trema is winnable by the shipped line at the engine (22/60 here, W3 500-seed 43 percent; round 23: 5 percent), Chapter I 99 percent with the game's script (round 23: 18/40), Omnis 85 percent, both new hidden chapters are built on the game's own rows. Losses: Chapter XVIII (Sin: Face) wins 0 of 100 fresh seeds for the shipped line and 1 of 200 (0.5 percent) at the shipped 12-turn rule on the sin-bench (33 of 200 at 13 turns); the 12-turn rule is the game's and Bailey chose it (CHANGELOG 39.4.3, F931-02), W2 did not change it (builder harness 124 to 117 of 500, noise), so it is carried, not a regression (PR-0279, raised to major: no real-input win exists in any round for a required milestone chapter). Chapter X (Natus) fell from 77 to 60 percent because Flare costs the game's rank 3 (read from the raw record): still winnable, but the guide's drain-slices line now loses (PR-0426). FFX-2 Chapter V at the human pace is 43 to 53 percent (round 23: 91; carried from RC1, disclosed 430 of 500 at zero delay). Advisor-card follower, 30 seeds each: Yunalesca 77 percent (intended line 97), Isaaru 63, Natus 83, Vegnagun 53, Trema 27, Flux 100, Omnis 100 (PR-0422). HIDDEN CHAPTERS (switched off from the board): Sinspawn Gui advisor line 197/200, without Power Break 125/200, attack-only 0/200; The Experiment Act I 40/40, Act II 35/40 at the Wait clock. Real-input flows: all 18 listed chapters and the three hidden doors were played by real keys in this round (gap pass); wins by real keys in 14 listed chapters and the 3 hidden chapters; Ch II, XIII, XV and XVIII ended in defeat on the win route at seed 1.

### visual: UNVERIFIED (no number)

No number: the visual auditor left the category UNVERIFIED because its evidence (capture owner's six chapters, 1600x900) did not cover it, and the later gap pass supplied captures but no reader judged the 12 other chapters tile by tile. PROVISIONAL READING for the sampled scope only, not to be averaged: about 8.4 (round 23: 8.3). (1) Approved art intact: verify-approved.mjs 916 ok, 0 mismatched, 0 missing (868 approved, 48 judge-locked); live artifact proved identical (CHK-017). (2) Size and feet continuity holds: across the 18-chapter live harness 1 of 9,355 judged swaps is over the head tolerance (Isaaru Pterya KO to idle, 33.6 percent by mass, 0.1 percent where registered), 0 feet swaps over 2 px (max 1.5 px); round 23 had 5 and 1. (3) Rendering at gameplay scale reads well in the six captured chapters; Yuna White Mage hurt and KO (the restored paintings) render as one painted figure each (gap pass, Ch IV). (4) Held down by: the Ch IV wide camera pull shows the backdrop plate edges at 1600x900 and 2000x1012 (PR-0421, new view), a pale rim and loose chips on Bahamut's wing edges (PR-0423, cause not established), the phone view hides Bahamut at the first menu (PR-0333), double images and one-frame KO snaps (PR-0378, PR-0379). Hidden chapters read as the painted house look at 1600x900 (first menu, mid-fight, seam); no 2000x1012 or KO sequence for them. Targets: 51 required, 14 matched, 0 failing, 36 unverified, 1 waiting.

### feel: 7.7

CHIEF: 7.7 (feel auditor 7.2 on six chapters; round 23: 8.0). The auditor scored before the continuity harness and the gap pass existed; with the 18-chapter live harness the motion numbers are equal to round 23 and the other new evidence is mixed, so the chief sets 8.0 less 0.3: the double-image count rose from 161 to 253 swaps at severity 0.4 or more (Leblanc 20 in round 23, 59 in the focused harness of this same build and 77 on live; Trema 1 to 26; Fallen Aeons 1 to 19; cause not established, partly host load, PR-0379), and the new Ch IV camera pull shows the backdrop edge (PR-0421; scored under visual). HARNESS (live, 18 chapters, 8,908 s of battle, 10,453 swaps; Ch I reused from the focused harness of the same commit): 0.60 snaps per minute against the 0.25 limit (round 23: 0.58), 94 hard cuts, 1,043 jerks of 40 px or more (round 23: 1,092; worst 966 px on the Fallen Aeons boss swap, host load inflated part of it), 253 double-image swaps. CHK-027 FAILS in every chapter; CHK-026 FAILS in one swap of 9,355. Strips read by the auditors and the chief: Yuna hurt to KO (Ch IV, VI) stands then lies in one frame; Ifrit hurt to KO a hard cut; Auron attack to follow shows a translucent second figure for 10 frames; Pterya KO to idle under a bloom. GOOD: every route reached results; no stall (one Yojimbo stall under 100 percent host CPU re-ran clean); scene to battle in about 3 s; Esc during a scene opens the pause, a hold skips; chain seams hand over within about 2.5 s with a name plate; the victory fanfare plays once at the end of the last link only (continuous 100 ms logs: Ch III 6 seams, Ch V 4, Ch VI 2, hidden Leblanc 2: none at a seam; the Experiment and Gui were sampled only); Bahamut now fits the stage beside the party; summon (about 3.6 s cast, Valefor cross-fades in) and the dresssphere change read clearly (event-locked clips at 59 fps). NOT SHOWN: no Overdrive or chain-seam clip; the mid-battle callouts (Zombie, Full-Life, Banish, Flare) did not occur; no Bailey play judgment (CHK-B2).

### narrative: 8.7

CHIEF: kept at 8.7 as audited (round 23: 9.0): scoped to the six played chapters plus the two hidden chapters; the unread chapters are carried, not re-graded. AUDITOR: text actually shown in the real flows. Ch I matches the writing-bible beat map almost line for line; Ch III Jecht's goodbyes and the Yu Yevon beat read in character, epilogue reachable after results; Ch IV keeps the rule that Bahamut is not celebrated (no fanfare, Paine's "That's a timer"); Ch VI keeps FFX-2's three-beat banter with one sincere beat; Ch V has the Farplane voices, Shuyin and Lenne and the Fayth Boy coda. FFX elegiac, FFX-2 buoyant: game-aware tone holds. Gap pass: hidden Gui (FFX tone: Seymour's cage plan, "The head is shaking! Hit it now!", a post scene with Seymour) and the Experiment (FFX-2 tone: three-way banter, a technician's "it gets stronger", a Paine and Al Bhed coda, no separate post-scene screen) match their games. Reachability (CHK-022): the post-battle scene plays after the results Confirm in Ch I, III, IV, V and VI; the harness's 30-post-scene miss is its own expectation of an earlier slot (PR-0431). Gaps: Ch II victory aftermath not seen (harness route could not win, PR-0397), Ch V fourth-fight defeat text, 12 other chapters unread this round, mid-battle callouts not triggered. One polish defect: Shuyin's taunt repeats three times in about 90 s (PR-0429).

### audio: UNVERIFIED (no number)

No number, sixth review in a row: no numeric owner listening verdict exists for this mix (CHK-B1, PR-0148), and no agent can hear. Bailey picked the two new cues (boss-bahamut, boss-leblanc) by delegation to the driver's recommendation on 2026-10-10, not by ear. TECHNICAL HEALTH, measured by the auditor with ffmpeg and tools/audio/qa.mjs on dist-release/audio (hash-matches critic/artifacts/72973096.json 31 of 31): 28 music cues plus 2 sprites decode, none silent, none clip; every cue -16.0 to -16.2 LUFS, true peak -1.08 to -4.03 dBTP; loop seams OK; total audio 90.0 MB of the 100 MB budget; qa 0 findings. boss-bahamut 78.8 s, boss-leblanc 79.1 s. ROUTING (continuous 100 ms logs, gap pass): Ch IV plays scene-bevelle-underground then boss-bahamut, results silent by design; Ch VI plays boss-leblanc across both seams then victory-ffx2 once; Ch III boss-jecht, scripted silence, boss-yu-yevon, one victory-ffx at results; Ch V boss-vegnagun, silence, boss-shuyin once, victory-ffx2 once; hidden Leblanc boss-leblanc throughout. Pause cue plays at gain 1 and the battle cue returns within 1.6 s after Esc. Findings: the two new cues fail the project's stereo gate (PR-0425; the cues they replace pass), THEMES.md rows IV and VI are stale so themes-audit and a unit test fail (PR-0424), the title cue starts about 6 s after the first gesture in a cold session (PR-0373), the first UI sounds are the synth fallback (PR-0326). Not covered: ear verdicts, phone first-gesture unlock, console decode errors.

### interface: 8.4

CHIEF: kept at 8.4 as audited (round 23: 8.7). PROVISIONAL, from six chapters (FFX I, II, III; FFX-2 IV, V, VI) at 1600x900 by real keys, plus Ch I and Ch IV lose-and-retry; no 2000x1012, 390x844, wide or 4K interface set. HOLDS: about 570 real-key decisions in seven runs where the advisor line's named move was found in the submenu its card names (labelMismatch 0, menuMismatch 0); targeting obvious at a glance in FFX Ch I to III and FFX-2 Ch VI, reticle gone after cancel (targets 0); enemy intent separates SCRIPTED / MOST LIKELY / POSSIBLE with per-target damage and hit chance, "KO" shown when the hit kills; names wrap rather than truncate; Esc and P open and close the pause, G, N, E, J work; FFX and FFX-2 carry the same shared screens with the deliberate differences only (CHK-020 PASS). DEDUCTIONS: CHK-003 FAILS (results sub-lines, prep key strip and pause stat labels about 11 to 12 px at 3.0 to 3.9:1, measured from screenshot pixels; the advisor card is 14.2 px, PR-0356); the Ch I intent card ends a sentence mid-way (PR-0430); the intent card fades the certain-versus-random line (PR-0357); panels cover figures (PR-0366: the chain popup over the advisor header, the E card over Braska's Final Aeon's face, the coach over the party's feet); the Ch III Talk row help falls back to a generic line (PR-0288); the first view of the Ch V card shows pending art (PR-0384). NOT JUDGED: CHK-005 broken boards, CHK-006 beyond target cancel, multi- and all-party target labels. REFUTED: the auditor's F24-INT-06 (TEXT SIZE does not reach the FFX-2 HUD) is stale: TEXT_SIZE_WIDE_SCOPE is true at 72973096 (src/app/applyComfort.ts:43, on since release 39, D-414) and the live CSS carries text-size-wide; no 130 percent frame was captured, so the effect itself is not shown.

### onboarding: 8.3

CHIEF: 8.3 (auditor 7.2, round 23: 8.6). The auditor's number rests partly on a claim the chief refuted (TEXT SIZE not reaching the FFX-2 HUD: the wide scope is ON, PR-0389 is the real residual) and on accommodations that were equally absent in round 23 (PR-0032, a proposal for Bailey, never a defect to fix unasked), so the chief starts from 8.6 and takes 0.3 for evidence this round did not have: no phone, no pad, no TEXT SIZE capture and no newcomer read (the walkthrough is simulated, a scripted route from a fresh profile). SEEN AND GOOD: Auron's one-time briefing (20 s, ENTER/ESC skip, D never show again; CTB versus ATB in four lines, replayable from Options), the three-step chapter-select and prep coach with "ESC SKIP THE GUIDE", the first-battle coach marked FIRST TIME ONLY / FADES ON ITS OWN, key hints on every screen, Battle Help and Strategy Guide switches, TEXT SPEED, TEXT SIZE (100/115/130), REDUCE MOTION, LOW EFFECTS, EYE CANDY, X-2 BATTLE Wait/Active and ATB SPEED in FFX-2, H painting-only, Overdrive overlays with controller glyphs and a MISS/HIT bar (a non-colour cue). GAPS verified absent on the live Options page in both games: no REDUCE FLASHES, no colour-vision option, no visible key remap (Controls tab not captured; PR-0032). Coach copy: "Click its picture to begin" while the footer says ENTER, the coach plate translucent over the board, and "He moves after you. Not before. Use it." never names what "it" is (PR-0386). Not evidenced: phone, gamepad, touch, reduce-motion emulation, 4:3, wide, 4K.

### prep: UNVERIFIED (no number)

No number: the prep auditor offered none because the captured evidence supports the results, retry and progress parts but not the preparation part. SEEN on live: rewards are sourced (Ch I AP 10,000 x4, 6,000 gil, Lv.4 Key Sphere = research/ffx-seymour-flux.md; Ch IV 1,300 EXP and a Gris-Gris Bag; Ch VI 1,640 EXP, 1,590 gil, Twist Headband x3, Charm Bangle x2, Reassembled Sphere; Ch III correctly 0 AP and 0 gil); results screens are readable with a Confirm path; defeat screens give Retry and Chapter Select, with Retry in about 7.6 to 10.2 s; progress persisted in five wins (cleared, best-time ribbon, same state after reload). NOT SEEN: the prep tabs after the first (Stats, Sphere Grid, Equipment, Items, Overdrive; Dresspheres, Accessories, Items), a retry from a chained-fight checkpoint, a Ch II win and its reward, the other chapters. Observed subset reads sound; the unknowns are not averaged in.

### delivery: UNVERIFIED (no number)

No number: load time, frame-time spikes and browser and device coverage were not measured. PROVED on the exact live build: CHK-017 identity (the live review compared all 5,162 files, 10.3 GB, byte for byte: 0 mismatched, 0 missing, 0 wrong content types; artifactHash 9c54b096...c14db); 0 console errors and 0 responses of 404 or above in every capture, continuity and gap run of this round; 1,240 media requests (529 unique) all resolve to files in the manifest; CHK-019 manifest decodeChecked true, audioUnverified 0, the only problems are the two intentional flat Paine eyeR-catch layers; the two new themes decode; audio 90.0 MB under the 100 MB budget; SaveData.ts and the save schema are unchanged between 931613a8 and 72973096 (the upgrade matrix does not apply; reload smoke held in five wins); hidden chapters write only the experiments key (reused from the focused review). Real-key flows reach results, board and reload in 14 listed chapters; Ch II, XIII, XV, XVIII ended in defeat on the win route at seed 1 with results and Retry proved. NOT PROVED: first load under 5 s on any named hardware, any frame-time or first-ability-stall measurement, Firefox, Safari, a phone or a gamepad, 2000x1012 and 390x844 beyond Ch IV and VI.

## Sub-scores (Bailey's five visual sub-scores; not part of the weighted score)

characterModels 7, enemyModels 8.4, animation 7, fidelity 8.6, camera 7.5. Previous (round 23): 7, 8.4, 7, 8.6, 7.8.

characterModels 7.0 (capped by one CHK-026 FAIL swap; uncapped reading about 8.5: 1 of 9,355 swaps over tolerance, feet within 1.5 px). enemyModels 8.4 carried and provisional (boss painting swaps still jump, PR-0380; Bahamut's wing rim PR-0423). animation 7.0 (capped; uncapped about 7.2: KO cuts, double images and boss jerks measured unchanged, PR-0378 to PR-0380). fidelity 8.6 carried, not re-graded (approved art proved intact; the 2x wing fringe is unexplained). camera 7.5 (7.8 carried less 0.3: the new Ch IV wide pull shows the plate edges at two sizes and the phone view hides the boss).

## Continuity harness (CHK-026, CHK-027)

critic/rounds/round-24/continuity/continuity-summary.json (18 chapters: 17 played live in this round, tag r24, Yojimbo from the clean rerun r24c; Ch I reused from the focused harness of the same commit 72973096; real keys, PYREFLY_BROWSER=gpu, 1600x900; part of the runs shared a saturated host, 53 to 58 fps, which inflates jerks and double images)

| Chapter | CHK-026 | CHK-027 | Snaps per minute | Max head jump % | Max feet px | Worst jerk px |
|---|---|---|---:|---:|---:|---:|
| seymour-flux | PASS | FAIL | 0.29 | 12.1 | 0.8 | 153.7 |
| yunalesca | PASS | FAIL | 0.77 | 2.4 | 0.9 | 269.8 |
| braskas-final-aeon | PASS | FAIL | 0.55 | 25.6 | 1.4 | 284.3 |
| seymour-anima-macalania | PASS | FAIL | 1.08 | 25.7 | 1.1 | 167.9 |
| evrae-airship | PASS | FAIL | 0 | 0.1 | 1.1 | 121.6 |
| yojimbo-cavern | PASS | FAIL | 0 | 4.8 | 0.8 | 53.5 |
| seymour-natus | PASS | FAIL | 1.07 | 16.2 | 0.8 | 126.8 |
| seymour-omnis | PASS | FAIL | 0 | 8.7 | 1.5 | 101.6 |
| isaaru-via-purifico | FAIL | FAIL | 1.18 | 33.6 | 1.3 | 249 |
| sin-fins-core | PASS | FAIL | 0.89 | 24.2 | 1.5 | 333.7 |
| sin-face | PASS | FAIL | 0.81 | 0.2 | 1 | 303.6 |
| ffx2-bahamut | PASS | FAIL | 0.2 | 9.6 | 0.6 | 182 |
| ffx2-vegnagun-shuyin | PASS | FAIL | 0.57 | 9.1 | 0.7 | 806.8 |
| ffx2-leblanc | PASS | FAIL | 0.82 | 20.6 | 0.7 | 275.9 |
| ffx2-fallen-aeons | PASS | FAIL | 0.45 | 15.6 | 1.2 | 965.9 |
| ffx2-trema | PASS | FAIL | 1.41 | 2.7 | 0.3 | 171.7 |
| ffx2-den-of-woe | PASS | FAIL | 1.05 | 2.8 | 1.2 | 244.9 |
| ffx2-ixion-djose | PASS | FAIL | 0.13 | 16.5 | 0.7 | 76.2 |

- **CHK-026** FAIL: 1 swap(s) change a head by more than the tolerance (worst 33.6 percent; 0.3 percent where the head is registered)
- **CHK-027** FAIL: 0.6 snaps per minute is over 0.25; 1043 jerk(s) of 40 px or more in one frame (worst 965.9 px); 253 swap(s) show a double image of severity 0.4 or more (worst 0.465)

## Target gate

51 required, 14 matched, 0 failing, 36 unverified, 1 waiting. Visual auditor's count from composites made with end-state-board.mjs --pair (the copy under D:/Final Fantasy, because tools/end-state-board.mjs is absent from the D:/pyrefly-r39-int tree): 51 approved tiles in scope (delivery verified 15, implemented 24, in progress 12); 14 matched from live captures, 0 failing, 1 waiting (the Leblanc backdrop tile: the picture and the written pick disagree, PR-0399), 36 unverified for want of tile-level matching on the live build (the gap pass took mid-fight frames of Ch VII to XVIII, the battle-start slate and the pause party panel, but no one matched them tile by tile). Round 23 counted 50 required and 34 matched on a wider capture; the lower matched count here is less captured, not new failures. The Ch IV tile A-ffx2-battle-bahamut differs from the build in composition (a very large Bahamut at the left against the owner-chosen 0.66 size at right of centre); a decision for Bailey. Frozen art: verify-approved 916 ok, 0 mismatched, 0 missing.

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | FAIL | yes | Technical half: qa.mjs 0 findings, all 28 cues and both sprites decode, routing right in 8 runs. But step 2 fails: node tools/audio/themes-audit.mjs reports 2 chapters departing from the cue map (Ch IV and VI, THEMES.md rows not updated, PR-0424), step 4 (owner sign-off by ear for boss-bahamut and boss-leblanc) is not on record (delegation only, PR-0148), and both new cues fail the stereo gate (PR-0425). Console decode errors were not captured. |
| CHK-002 | UNVERIFIED | yes | Pause fills the window with no bars at 1600x900 in every run, but the check needs six fresh-context viewports and a rect, currentSrc and scrollWidth measurement; only 1600x900 (and 2000x1012, 390x844 for Ch IV and VI first menus) were captured and no geometry was read. |
| CHK-003 | FAIL | yes | Results sub-lines, the prep key strip and pause stat labels are about 11 to 12 px at 3.0 to 3.9:1 (PR-0356); the advisor card measures 14.2 px and passes. Measured from 1600x900 screenshot pixels, not computed style; the rest of the check (DOM sweep, other sizes) is unknown. |
| CHK-004 | UNVERIFIED | yes | Strong partial pass, not a closure: across seven runs (about 570 decisions) the named move was found enabled in the named submenu and executed by real keys. Not done: every party member's card in one frame, and a forced board where the line's move belongs to another character. |
| CHK-005 | UNVERIFIED | yes | No broken-board matrix was run in the browser. Engine data only: the card follower misses the revive in 5 to 6 percent of losing runs in Yunalesca and Sin Fins, 18 percent Natus, 42 percent Omnis, 100 percent Sin Face (8 of 8); lethal threats missed 38 of 189 in Vegnagun, 56 of 160 in Leblanc, 19 of 68 in Den of Woe (critic/rounds/round-24/combat/scorecard-r24-deep.json). The Ch II route mis-aimed its revives (PR-0397). |
| CHK-006 | UNVERIFIED | yes | Only the target-reticle cancel exit was recorded (targets 0 in Ch I, II, III, VI) and results screens carry no stale overlay. Not exercised: confirm, turn-passing and battle-end exits for the Overdrive picker, spherechange wheel, submenu slab, message bar and sensor card. |
| CHK-007 | UNVERIFIED | yes | Captured text of six chapters carries no section signs, file stems, row numbers, ids or debug words; the Ch I intent card ends a sentence mid-way (PR-0430). Twelve chapters and both hidden chapters were not read for this. |
| CHK-008 | FAIL | yes | Three minor overlaps of the kind the check forbids at 1600x900: the CHAIN x1.45 popup covers the advisor card header (FFX-2 Ch VI after a target cancel), the FFX intent card covers Braska's Final Aeon's face (Ch III), the first-time coach covers Tidus's and Yuna's feet (Ch I). The visual auditor read the same six chapters as PASS with the coach over Yuna's feet and the guide over Bahamut's wing tip as small covers; the chief records the overlaps as FAIL (polish, PR-0366). |
| CHK-009 | UNVERIFIED | yes | No label was truncated in any screenshot (Seymour Flux, Braska's Final Aeon, Mortiorchis, Possessed Ixion, Yu Pagoda A/B wrap or fit) but no scrollWidth/clientWidth or ellipsis check was run, and 1280 and 3840 were not captured. |
| CHK-010 | UNVERIFIED | no | Single-target selection is obvious in four chapters; multi-target and all-party commands were not captured at the target step, and FFX-2 Ch IV and V have no target capture. |
| CHK-011 | PASS | yes | Every enemy that should be on screen was visible in the sampled frames of Ch I to VI (Seymour Flux with Mortiorchis, Bahamut, Ormi, Braska's Final Aeon with the Yu Pagodas, the Vegnagun tail). 6 of 20 chapters read closely. |
| CHK-012 | PASS | yes | No fallback or placeholder face in any of the six captured chapters or the hidden chapters' first menus; art identity proved by verify-approved (916 ok, 0 mismatched, 0 missing) and the live review's exact-artifact check. |
| CHK-013 | UNVERIFIED | yes | New art of this release was only partly judged on live: Yuna White Mage hurt and KO render as one painted figure each (gap pass, PASS), the hidden chapters' first menus read as the house look, but Bahamut's wing edges carry a pale rim and chips whose cause (painting or cutout) is not established (PR-0423), the Ch IV wide camera shows the backdrop plate edges (PR-0421), and the Sinspawn Gui parts, the Experiment and the guest Seymour were not judged against the written rubric. The approved masters are hash-intact. |
| CHK-014 | PASS | yes | In the sampled battle frames the party faces the enemy and the enemies face the party, and the casts are posed for the shot (attack, cast, ready, KO lying on the floor in Ch V). |
| CHK-015 | UNVERIFIED | yes | Real keys proved in 6 chapters (title, board, prep, scene skip with Esc, pause with Esc and P, options, advisor, E, G, N, J, single-target select and cancel) and the hidden doors by typed words. Not run: Esc or P inside a submenu, while targeting, during an animation or on results; gamepad (a virtual pad shim ran in round 23 only) and touch beyond the 390x844 first menus. |
| CHK-016 | FAIL | yes | The capture owner's index is clean (222 items, 0 screen or stale-root mismatches, 2 flagged UNVERIFIED), but the interface auditor found three named captures that do not show the named state (Ch I 10-first-menu-coach and 11-advisor show the Tidus turn cut-in; Ch IV 12-intent-E shows the card closed; Ch IV lose 33-retry-battle is a cut-in frame; PR-0415 recurs), and the route's "wanted" id for Yuna was wrong while its mismatch flag read false, so a clean assertion did not prove the intended action (PR-0397). The state was proved from run.json text and neighbouring frames, nothing was graded from the wrong frame. |
| CHK-017 | PASS | yes | The exact live artifact: the live review compared all 5,162 files (10.3 GB) with critic/artifacts/72973096.json (artifactHash 9c54b096...c14db) byte for byte, 0 mismatched, 0 missing, 0 wrong types; a 309-file sample re-run by the delivery auditor agrees, index.html equal once Cloudflare's beacon is cut; bundle CECt6LNe served with must-revalidate. 0 console errors, 0 responses of 404 or above, 0 HTML-as-image in every run of this round. The first-load-under-5-s clause was never measured and is carried in the delivery category (UNVERIFIED), not claimed here. |
| CHK-018 | PASS | yes | No hand-written variant paths: every art and audio path the live game requested in the runs (529 unique) exists in the artifact manifest; the focused review's art-derive audit (0 dangling names) is reused. |
| CHK-019 | PASS | yes | Manifest decodeChecked true, audioUnverified 0; the only flat decodes are the two Paine eyeR-catch layers listed in intentionalFlatImages; all 28 music cues and both sprites decode and none is silent or clips; the two new themes decode. The browser decode gate (tools/art-browser-load.mjs) is run by the deploy and its output is not in this review's evidence. |
| CHK-020 | PASS | yes | Prep, pause, Options, results, chapter select, advisor, guide, intent and command menu compared across FFX Ch I to III and FFX-2 Ch IV to VI: same panels, tabs, keys and cancel behaviour; the differences are the written FFX-2 ones. Residual TEXT SIZE question refuted (wide scope on). |
| CHK-021 | PASS | yes | git diff 931613a8..72973096 --stat over src/battle/ffx2: only ai/experiment.ts (new, FFX-2) and 3 lines in ai/index.ts; nothing in ffx2 imports ffx and the reverse, so W2 is FFX only as written; the FFX-only additions are read only in src/battle/ffx; noSaveSphereCard is FFX-2 only; common/types.ts changes are additive optional members. Only two audio files were added (boss-bahamut, boss-leblanc), FFX-2 only; every FFX cue is byte-identical. The fanfare change is both games and was observed in FFX Ch III and FFX-2 Ch VI. Absence seen: FFX-2 Ch IV plays no victory cue by design. |
| CHK-022 | UNVERIFIED | yes | Real keys from title to an outcome, results and the board in all 18 chapters: wins with results, board and reload in I, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIV, XVI and XVII; the three hidden chapters (Gui, Experiment, hidden Leblanc) won with lose-and-retry for the first two. NOT shown: a real-key win in Ch II (the route's revives were mis-aimed, PR-0397), XIII (PR-0353), XV (PR-0306) and XVIII (PR-0279), each of which reached its defeat, results and Retry; Ch XIII link-2 retry state (PR-0407); Ch V fourth-fight defeat; Ch XIII post scene. The Experiment has no post-battle screen (its coda plays in the battle dialogue). |
| CHK-023 | UNVERIFIED | yes | PASS for the parts exercised through the real presentation path: W2 CTB clock (turn-start.elapsedTicks on every FFX turn, per-actor intervals equal tick speed x rank), status-add/remove/tick events (haste, reflect, regen, zombie, darkness, petrify, slow, poison, max-hp-x2, eject), aeon summon, Bushido and Swordplay windows, Talk triggers, a dresssphere change, and the chained-fight fanfare at 100 ms resolution. UNVERIFIED parts: Seymour's Requiem and the Experiment's Annihilator never fired in the hidden-chapter logs, the Gui head relay was not identifiable, the Ch X Haste-two line was not found, no Overdrive or chain-seam clip. |
| CHK-024 | NOT APPLICABLE | no | SaveData.ts and the save schema are unchanged between 931613a8 and 72973096 (git diff --name-only empty), no new storage key; the upgrade matrix is owed only when persistence changes. A lightweight reload smoke held in five wins (cleared, best time, selected chapter). |
| CHK-025 | PASS | no | The typed words limit, leblanc, experiment and mushroom open the right chapters, a wrong word does nothing, the board lists 18 cards and the two new chapters write only pyrefly-reprise:experiments:v1 (focused review); this review also opened them by typed words and real keys on live and played Gui, the Experiment and hidden Leblanc through to results. |
| CHK-026 | FAIL | yes | Live harness, 18 chapters (17 played in this round, Ch I reused from the focused harness of the same commit): 1 of 9,355 judged swaps is over the head tolerance (Isaaru, Pterya KO to idle under a light bloom, 33.6 percent by mass, 0.3 percent worst where the head is registered); 0 standing swaps over the 2 px feet tolerance (max 1.5 px). Round 23: 5 swaps and 1 feet swap over. The head is registered at 6,702 swaps and read by mass at 2,653. |
| CHK-027 | FAIL | yes | Live harness, 18 chapters: 0.60 snaps per minute (limit 0.25; round 23 0.58), 94 hard cuts, 1,043 jerks of 40 px or more in one frame (round 23 1,092; worst 966 px Fallen Aeons boss swap, 807 px Vegnagun tail), 253 swaps with a double image of severity 0.4 or more (round 23 161; worst 0.465). FAIL in every chapter (snaps per minute 0 in Evrae, Yojimbo and Omnis up to 1.41 in Trema; the jerk and double-image counts were inflated by a saturated host in part of the runs). The same commit measured 0.48 snaps per minute on five chapters in the focused review, against 1.39 (Ch I) on 931613a8 there. KO cuts remain hard cuts (Yuna hurt to KO: feet shift 54 px). |
| CHK-B1 | UNVERIFIED | yes | No agent can hear. No numeric owner verdict exists for this mix; boss-bahamut and boss-leblanc were accepted by delegation to the driver's recommendation, not by ear. Bailey judges them on docs/audio/audition.html. |
| CHK-B2 | UNVERIFIED | no | Bailey's own play judgment of feel and animation is not recorded for this build. |

## Encounters through their real flow

| Chapter | Game | Real flow complete | Outcome | Note |
|---|---|---|---|---|
| seymour-flux (I) | FFX | yes | victory (52 turns, seed 1) | Real keys, title to results; lose-and-retry exercised; post scene plays after the results Confirm. |
| yunalesca (II) | FFX | NO | defeat at seed 1 on the route meant to win (and seeds 2 to 5) | The route's revives were aimed at Yunalesca instead of Yuna (PR-0397); the engine intended line wins 100 of 100. Defeat, results and Retry reached; a real-key win is not shown this round (round 23 won seed 2). |
| braskas-final-aeon (III) | FFX | yes | victory (seed 1, about 25.6 min) | 6 seams, one fanfare at the last link. |
| ffx2-bahamut (IV) | FFX-2 | yes | victory, and a lose route ending in defeat with Retry (seed 1) | New smaller Bahamut and boss-bahamut theme; no victory cue by design. |
| ffx2-vegnagun-shuyin (V) | FFX-2 | yes | victory (seed 1, about 23 min); lose-and-retry reached battle | Fourth-fight defeat text not reached. |
| ffx2-leblanc (VI) | FFX-2 | yes | victory (70 turns, seed 1); lose-and-retry reached battle | Chained fight: one fanfare at the end of the chain. |
| seymour-anima-macalania (VII) | FFX | yes | victory with results (seed 1) | Gap pass, real keys. |
| evrae-airship (VIII) | FFX | yes | victory with results (seed 1) | Gap pass, real keys. |
| yojimbo-cavern (IX) | FFX | yes | victory with results (seed 1, rerun alone) | First run stalled under 100 percent host CPU; treated as load, not a defect. |
| seymour-natus (X) | FFX | yes | victory with results (seed 1) | The Ch X Haste-two line was not found in any message timeline. |
| ffx2-fallen-aeons (XI) | FFX-2 | yes | victory with results (seed 1) | Gap pass, real keys. |
| seymour-omnis (XII) | FFX | yes | victory with results (seed 1) | Gap pass, real keys. |
| ffx2-trema (XIII) | FFX-2 | NO | defeat at seed 1 on the win route (97 events lost at link 1); results and Retry reached | PR-0353 (seventh review) and PR-0407; the engine wins it 22 of 60. |
| isaaru-via-purifico (XIV) | FFX | yes | victory with results (seed 1) | CHK-026 FAIL in one swap (PR-0377). |
| ffx2-den-of-woe (XV) | FFX-2 | NO | defeat at seed 1 on the win route; results and Retry reached | PR-0306 (a question for Bailey). |
| ffx2-ixion-djose (XVI) | FFX-2 | yes | victory with results (seed 1) | Gap pass, real keys. |
| sin-fins-core (XVII) | FFX | yes | victory with results (seed 1, about 20 min) | Gap pass, real keys. |
| sin-face (XVIII) | FFX | NO | defeat at the Giga-Graviton turn limit at seed 1; results and Retry reached | PR-0279; no real-input win in any round. |
| sinspawn-gui (hidden: mushroom) (XXI (hidden)) | FFX | yes | victory (94 turns, 2 links, post scene, results, board) and lose-and-retry | Typed word, real keys, 1600x900; Requiem never fired in the log. |
| ffx2-masterpiece-theatre (hidden: experiment) (XX (hidden)) | FFX-2 | yes | victory (33 turns, seam, results) and lose-and-retry | Annihilator never fired in the log; coda plays in battle dialogue, no separate post screen. |
| ffx2-leblanc (hidden: leblanc) (hidden) | FFX-2 | yes | victory (60 turns, 2 seams, one fanfare) | boss-leblanc across both seams. |

## Coverage matrix

### Tested
- Live artifact: the live review compared all 5,162 files byte for byte; 309-file sample re-checked; 0 console errors and 0 responses of 404 or above in every capture, continuity and gap run (about 80 runs).
- All 18 listed chapters by real keys at 1600x900 (GPU, seed 1): wins with results in 14, defeat with results and Retry in Ch II, XIII, XV, XVIII; lose-and-retry in Ch I, III, IV, V, VI; hidden Gui, Experiment and hidden Leblanc won and (Gui, Experiment) lost and retried.
- Continuity harness over all 18 chapters: 8,908 s of battle, 10,453 swaps, 0 probe errors (17 chapters live in this round, Ch I reused from the same commit).
- Engine: tsc clean; vitest 16,105 of 16,176 (failures are load timeouts that pass alone, and the PR-0424 docs test); 979 of 979 command records re-read from the raw game tables; fresh-seed win rates for 11 FFX and 7 FFX-2 chapters; advisor-card follower 30 seeds; boundary cases (CTB kernel, statuses, double HP); hidden-chapter benches (Gui 197/200, Experiment Act II 35/40).
- Audio: ffmpeg and qa.mjs on 28 cues and 2 sprites, stereo gate on the two new cues, themes-audit; 100 ms continuous music logs across Ch III, V, VI and hidden Leblanc seams; pause hand-back; defeat and retry audio in Ch III, V, VI.
- Camera and layout: Ch IV and VI at 2000x1012 and 390x844 touch; the Ch IV entry screencast at 1600x900 and 2000x1012; battle-start slate and pause panel in Ch I; Ch VII to XVIII mid-fight frames; Sin clock; aeon Defend tab at 1600x900 and 2000x1012; Yuna White Mage hurt and KO frames.
- Interface, narrative, prep and delivery: six chapters read closely (I, II, III, IV, V, VI) from the capture owner's run.json, dbox timelines and results text.

### Reused, with the reason
- Ch I continuity (CHK-026, CHK-027) and the Ch I, II, III, IV, VI figures in the focused harness comparison: from critic/reviews/72973096-focused/continuity (same commit; dist-gate bundle index-CEdItQg_ with /pyrefly-reprise/ replaced by / is byte-identical to the live bundle CECt6LNe; the art file lists are identical, 5,078 files). Same bytes live; the live review proved the live artifact equals the deploy build. Applies to Ch I only in the aggregate; the other chapters ran live in this round.
- CHK-025 (typed words, 18 cards, experiments key only): from critic/reviews/72973096-focused.json. Same commit; no code, art or setting changed after it.
- Hidden-chapter routing at the seam (the Experiment and Gui) as sampled snapshots: from critic/reviews/72973096-focused/audio. Same commit and bundle; debug-assisted runs, used as corroboration only.
- fidelity 8.6 and the five-sub-score readings other than camera: from critic/rounds/round-23.json. Not re-graded; carried.
- The 120 or so open polish and suggestion issues of round 23: from critic/rounds/round-23.json. Carried open, unchanged and not re-observed unless a note says RE-OBSERVED; nothing in them is claimed fixed.

### Not tested
- Real controller, real phone, Firefox and Safari (emulation only; UNVERIFIED by rule).
- The prep tabs after the first (Stats, Sphere Grid, Equipment, Items, Overdrive; Dresspheres, Accessories) and any retry from a chained-fight checkpoint.
- Cold-cache first load under 5 s and frame-time traces on named hardware.
- Ear verdicts, Overdrive and chain-seam clips, mid-battle callouts (Zombie, Full-Life, Banish, Flare), the Ch X Haste-two line, Seymour's Requiem and the Experiment's Annihilator in a real-key log.
- Hidden chapters at 2000x1012 and 390x844, and their KO sequences.
- TEXT SIZE 115 and 130 percent, Controls tab, REDUCE MOTION emulation, the full CHK-005 broken-board matrix and CHK-006 overlay exits.
- Tile-by-tile target matching for Ch VII to XVIII and the hidden chapters.

### Required and not tested
- CHK-022: a real-key win in Ch II (PR-0397: the route cannot revive Yuna), Ch XIII (PR-0353, seventh review), Ch XV (PR-0306) and Ch XVIII (PR-0279); Ch XIII link-2 retry; Ch V fourth-fight defeat.
- CHK-002: the six-viewport pause matrix with rect, currentSrc and scrollWidth measurement.
- CHK-003 and CHK-009: a DOM font-size and ellipsis sweep at 1280, 1600, 2000, 2560 and 3840 and on the phone.
- CHK-004, CHK-005, CHK-006, CHK-010: the full advisor, broken-board, overlay-exit and multi-target proofs in the browser.
- CHK-013: the new art (Gui parts, Experiment, guest Seymour) judged against the written rubric; the Bahamut wing rim traced to the painting or the matte.
- CHK-015: Esc and P inside a submenu, while targeting and during an animation; a real gamepad and touch paths.
- CHK-023: Seymour's Requiem, the Experiment's Annihilator and an Overdrive or chain-seam clip.
- CHK-B1 and CHK-B2: Bailey's ear and play judgments.
- Delivery: first-load time and frame-time measurement; prep: the preparation tabs.

## Human judgments

- [open] Audio: Bailey's numeric listening score for the shipped music v2 and SFX v2, with D-307 to D-309 (CHK-B1, PR-0148)
- [open] Narrative: Bailey's story read (CHK-B3); scripts unchanged this release
- [open] Visual: should Natus, Braska's Final Aeon and Evrae get the colossus master back by steering cards off the boss, and should Yunalesca be a colossus at all (D-316, PR-0331)
- [open] Visual: may the party and boss slots move in Ch II, III and VIII so no one stands inside the boss (changes approved scenes; PR-0310)
- [open] Encounter: Sin difficulty (D-282, PR-0279), the Ch III gauntlet length (PR-0257), Ch XV and XIII at human pace (PR-0306, PR-0227)
- [open] Settings: should a look turned back ON bring its upgraded parts back ON (PR-0329)
- [recorded] Onboarding: first-run step 1 wording when another chapter is selected (PR-0289); the FFX-2 TEXT SIZE owner gate (PR-0270) (D-416 and D-414 (adopted): "Start with this one." and TEXT SIZE in FFX-2)
- [open] Overdrive inputs: which button order to use for the Bushido sequences, given 5.5 marks HD orders as conflicting (PR-0308; GameFAQs is Bailey's stated preference)
- [open] Feel: the release-37 entry pace, the 1.6 s dressphere shot and the living pause portraits in play (CHK-B2)
- [recorded] Combat (FFX-2): should Lady Luck be reachable (a grid node for its owner) or ship dormant (PR-0340); should the reels be timed by the press (PR-0349) (D-361, D-417 and D-428 (adopted): Lady Luck selectable where the guides allow it, reels timed by the press)
- [recorded] Swordplay: yes to the estimates in research/ffx-combat-core.md 5.3 (zone 22/16/12/9 percent, marker 1,400/1,150/900/700 ms), or wait for sourced numbers (a four-row edit, PR-0308) (D-413 (adopted 2026-10-04))
- [open] Overdrive inputs: check the Bushido order against the Steam HD copy (D:/Tools/ffx-hd) so the "our estimate" label can go (PR-0308); and how a phone player answers a Bushido or Swordplay (PR-0360, PR-0361)
- [open] Encounter: is Trema (6.5 percent per attempt) and Den of Woe (24 percent first try) the intended difficulty at human pace (PR-0227, PR-0306, PR-0353)
- [open] Feel: is a plain FFX-2 Attack of 1.2-1.7 s with the run-in the rhythm he wants; do the telegraph hold (1.14 s, paintings not yet installed) and the 1.22x dressphere push-in read as enough (PR-0368, PR-0314; CHK-B2)
- [open] Visual: taste on the new paintings (Evrae E1-H, the plate wings, the Yuna, Rikku and Paine dresspheres) and the Echoes of Spira wordmark (CHK-B3)
- [open] Feel: is the one-frame KO cut wanted (EC-1001-09), or should a KO travel (PR-0378)
- [open] Visual: calibrate the five sub-scores against Bailey's own ratings after he plays release 39 (D-426)
- [open] Visual: which Leblanc backdrop is approved, the tile's picture or its text (PR-0399)
- [open] Narrative: may FFX-2 Ch XIII and XV open with a third-person narrator, or should Yuna narrate (PR-0390)
- [open] Combat (FFX): do aeons have a Defend command in the Steam HD copy (PR-0383)
- [open] Audio: should a defeat play a cue (THEMES.md has no defeat row; every defeat is silent)
- [recorded] Visual: the new Gullwings title key art (the FFX-2 trio under the shared title) (D-458 to D-460 (approved 2026-10-05); this review judged how it renders, not taste)
- [open] Encounter: what a lost Ch XIII link-2 Retry should do when the carried Paragon end state has one or no survivor (restore the girls as the Ch XI Save Sphere checkpoint does, fall back to Paragon, or say so on the defeat card; TR5 b, D-146; PR-0407)
- [open] Audio: whether the Ch II epilogue, the Ch III link-2 seam (scripted silence), every defeat and the Ch IV victory should play a cue (PR-0410)
- [open] Visual: lunge reach for targets above or below the attacker is a known limit (D-461); does Bailey accept it
- [open] Onboarding: key remapping, REDUCE FLASHES row and a colour-vision option (PR-0032, a proposal)
- [open] Audio: boss-bahamut and boss-leblanc by ear, and wide versus narrow stereo (PR-0425; the D-582 class)
- [open] Visual: Bahamut at 0.66 in Ch IV and the approved A-ffx2-battle tile's composition; which governs (PR-0421 context)
- [open] Feel: Bailey's play of release 39.4.4 (CHK-B2), and calibration of the five sub-scores (D-426)

## What stands between this build and acceptance

- A milestone needs a milestone review; this deep review cannot accept one.
- Four categories carry no number: visual (tile-level target matching and a reader for Ch VII to XVIII), audio (Bailey's ear verdict), prep (the preparation tabs and checkpoint retry) and delivery (first-load time and frame-time).
- Every scored category except combat is under the 9.0 floor; the weighted total cannot be computed while four categories are unnumbered.
- Mandatory checks CHK-001, CHK-003, CHK-008, CHK-016, CHK-026 and CHK-027 FAIL and CHK-002, CHK-004 to CHK-007, CHK-009, CHK-013, CHK-015, CHK-022, CHK-023 and CHK-B1 are UNVERIFIED.
- 12 major issues are open; four chapters (II, XIII, XV, XVIII) have no real-key win; 36 required targets are unverified.

## What changed since round 23 (d3fe9fe5), without comparing against rubric v1 rounds 02 and 03

- Engine: W2 decompiled FFX mechanics are in (979 of 979 command records equal the game's own tables); Natus fell from 77 to 60 percent because Flare now costs rank 3; Trema is winnable at the engine (22 of 60, was 5 percent); Chapter I wins 99 percent (was 18 of 40); Sin: Face is at 0 to 3 percent under the 12-turn rule that arrived with 39.4.3.
- Presentation: the size-and-feet complaint stays fixed (1 swap of 9,355 over tolerance, 0 feet swaps over 2 px); motion continuity is unchanged (0.60 snaps a minute against 0.58) with a larger double-image count (253 against 161, cause open); Bahamut is smaller and the Ch IV wide pull shows the plate edges.
- Audio: Ch IV and Ch VI have their own cues (both fail the stereo gate; THEMES.md not updated); one victory fanfare at the end of the last link in both games.
- Evidence: the Ch II "route loses" disclosure is withdrawn (PR-0397); a live continuity run covers all 18 chapters for the first time since round 23.

## Proposals (nothing here is built without Bailey's yes)

- Ch IV camera and phone (PR-0421, PR-0333): clamp the wide pull or extend the plate under the backdrop, and on narrow screens collapse the acts-next strip and coach so Bahamut stays in view. Benefit: removes the two new-view defects. Cost: a camera preset edit and a phone layout rule. Fit: FFX-2 only. Preview: the s180 frame and the 390x844 first-menu capture. Nothing is built without Bailey's yes.
- New boss cues (PR-0425): stage narrow-width variants of boss-bahamut and boss-leblanc as was done for the earlier ElevenLabs cues, add the measured stereo numbers to THEMES.md, and let Bailey choose wide or narrow by ear on docs/audio/audition.html. Cost: a local variant render, no spend. Fit: FFX-2 only. Nothing is built without Bailey's yes.
- Sin: Face (PR-0279): measured options for Bailey, none a boss tune: (a) keep the game's 12 turns and rework the shipped line or party (advisor line 3 percent today), (b) lengthen the clock to 13 turns (advisor 20 percent, shipped line 16 percent on the bench), (c) leave it and say so on the guide. Preview: the sin-bench table. Fit: FFX only. Nothing is built without Bailey's yes.
- KO transition (PR-0378, carried): a 6 to 8 frame matched dissolve anchored at the feet, or one painted fall frame per member. Benefit: snaps fall from 0.60 toward 0.03 a minute. Fit: both games. Risk: a dissolve can read as ghosting (PR-0379). Needs Bailey's yes (EC-1001-09).
- Ghosting count (PR-0379): run Leblanc alone on 931613a8 and on 72973096 with the continuity harness to learn whether the 20-to-77 rise moved with the build; if it did, shorten the attack-to-follow crossfade. No product change needed to find out.
- Critic tooling (no product change, no Bailey decision): fix whole-label target matching in the route (PR-0397) and rerun Ch II seeds 1 to 5; take the post scene from the after-Confirm capture, add typed-word entry for hidden chapters and run the continuity harness detached (PR-0431); a human-paced Ch XIII route (PR-0353).
- Docs (PR-0424, PR-0426): update THEMES.md rows IV and VI, the Natus research line (Flare rank 3, record 0x6079) and the Natus guide wording (Bailey approves wording).

## Merged, downgraded and refuted this round

- merged: PR-0397 <- F24-INT-01 + the capture owner's and the gap pass's "Ch II route loses" (major) + the focused review's F7297-02; refuted as a product defect
- merged: PR-0378, PR-0379, PR-0380 <- F7297-01, the visual-targets and feel-narrative umbrella issues ("Motion continuity still fails" x3), the gap pass's "CHK-027 fails in all 18 chapters" and the fan's snapping, half-motion, popping, size-jump and jerk breakers
- merged: PR-0421 <- the visual auditor's "backdrop panel edge in one wide frame" (polish, low confidence) + the gap pass's "wide camera move shows the plate edges" (major)
- merged: PR-0423 <- the visual auditor's wing rim polish + the gap pass's wing fringe minor
- merged: PR-0424 <- AUD-2 (themes-audit) + R24-DEL-01 (unit test)
- merged: PR-0383 <- R24-CMB-01 (combat auditor) + the gap pass's aeon Defend tab (re-observed on screen)
- merged: PR-0422 <- the combat auditor's "advisor top row trails the intended line"
- merged: PR-0431 <- the delivery auditor's harness-order suggestion + the capture owner's post-scene note + the unfinished first continuity run
- merged: PR-0373 <- the gap pass's title music late; PR-0326 <- AUD-3; PR-0356 <- F24-INT-02; PR-0357 <- F24-INT-04; PR-0366 <- F24-INT-05 and the fan's UI-covering breakers; PR-0386 <- F24-INT-08; PR-0288 <- F24-INT-09; PR-0384 + PR-0387 <- F24-INT-10; PR-0032 <- F24-INT-07; PR-0430 <- F24-INT-03; PR-0279 <- R24-ENC-01; PR-0426 <- R24-ENC-02; PR-0333 <- the gap pass's phone rig issue
- downgraded: F7297-02 / "Ch II lost on five seeds" major -> PR-0397 minor harness (the revives were aimed at Yunalesca; engine 100 of 100)
- downgraded: F24-INT-07 (interface auditor: major) -> PR-0032 suggestion, as in round 23: an unbuilt set of accommodations awaiting Bailey's decision (hard rule 10)
- downgraded: fan "UI covering the action" major -> folded into PR-0366 polish (no face or weapon covered, panels hideable), as in round 23
- downgraded: fan "attacks that do not connect" (Ormi Shield Bash, Vegnagun tail) major/polish -> PR-0402 polish
- downgraded: R24 gap pass "CHK-026 FAIL in XIV" -> PR-0377 polish (one swap of 9,355, 0.1 percent where registered)
- refuted: F24-INT-06 (TEXT SIZE does not reach the FFX-2 HUD and the pause): Stale: TEXT_SIZE_WIDE_SCOPE is true (src/app/applyComfort.ts:43, on since release 39, D-414) and the live CSS bundle carries text-size-wide; docs/handoff/r31-access.md is superseded. No 130 percent frame was captured, so the effect is not shown; PR-0389 stays the carried residual.
- refuted: capture owner: "Chapter II advisor route loses at seed 1 on the live build" as a product defect (and F7297-02): The route aimed fifteen Phoenix Downs at Yunalesca (PR-0397, traced by the chief in run.json). The engine intended line wins 100 of 100 fresh seeds.
- refuted: gap pass: "Ch II Yunalesca lost on five real-key seeds; possible regression": Same harness fault; the card follower at the engine wins 77 percent (23 of 30), the intended line 97 to 100 percent. A possible W2 shift of the advisor rate is carried as PR-0422 (minor, unknown).
- refuted: capture owner: "no post-battle scene reached in Ch I and Ch VI": The scene plays after the results Confirm in Ch I, III, IV, V and VI (afterConfirmScenes 6 to 42 lines); the harness looked before results (PR-0431).
- resolved: PR-0377 (part): the feet-shift half of the size complaint: The live harness reads 0 standing swaps over 2 px (max 1.5 px) across 9,355 judged swaps; round 23 had one at 4.2 px (Yuna hurt to idle, Ch I). Seen on the live build in 18 chapters.
- resolved: PR-0099 (part): Ch IV and Ch VI stand-in cue: boss-bahamut and boss-leblanc ship and play in Ch IV, Ch VI and hidden Leblanc (routing logs); the other rows stand.

## First-time fan

The fan saw only the capture owner's 300 ms sequences (the first continuity run left no strips) and many image reads were cut by a request limit, so its counts are lower bounds; its breakers are merged into PR-0378 to PR-0380, PR-0366, PR-0402, PR-0419, PR-0334 and PR-0432.

- (major, UI covering the action, ffx seymour-flux; yunalesca) The party HP panels sit on top of the fight: a knocked-back Yuna (FFX Seymour) and Auron (Yunalesca) are cut off by the Tidus/Yuna HP panels, and in the Seymour fight the HP panel and 'Mortiorchis HP' box overlap the hit figure and the damage number.
- (major, half-motion or ghosting, ffx seymour-flux) Two Seymours at once for a moment: Seymour crossfades from his crouched pose to another one and you see a double image of him, plus a see-through copy of Yuna behind her hit pose.
- (major, popping, ffx seymour-flux) Seymour jumps around the arena as the camera pushes in: his head is cut off by the top of the screen in some frames and he is in a different place and size in the next.
- (major, size jumps, ffx seymour-flux) Mortiorchis changes into a different pose and size: first a big crouched shape, then a smaller see-through skeleton that fades, then a new, smaller walking skeleton on the left of the arena.
- (major, snapping, ffx seymour-flux) Yuna snaps into a different-looking figure when hit: she goes from her blue kimono to an orange/pink silhouette, then a turned-around pose with a ragged white fringe, then a hunched pose, with no in-between.
- (polish, outfit fringe, ffx seymour-flux) A hard white fringe and jagged edge around Yuna's hit pose, like a cut-out that does not match the painting.
- (polish, half-motion or ghosting, ffx seymour-flux) During the heal the aeon-like Kimahri shows as a see-through white-glowing ghost on top of Tidus and Yuna, so you see several bodies at once.
- (polish, camera jerks, ffx seymour-flux) The screen drops in black bars (a letterbox) that grow and shrink while the picture re-zooms, then settles with a new framing; the black bars shrink from about 100px to 40px to none across three frames.
- (major, half-motion or ghosting, ffx yunalesca) Auron turns into a see-through orange slab when Yunalesca slaps him; you see Yunalesca at a different place in the next frame, so it looks like a double image.
- (polish, UI covering the action, ffx and ffx2 yunalesca, seymour-flux, vegnagun, leblanc) Whole-screen cut-ins cover the fight: the big face portrait (Yuna, Tidus, Kimahri, Rikku) takes the left third and covers the characters, and a tutorial coach box hides the enemy and the party's lower half at the start of the first turns.
- (major, UI covering the action, ffx2 vegnagun-shuyin) Vegnagun: a big Braska dialogue box sits over the left of the screen during the fight and the enemy-info panel plus command menu sit over the tail and head, so the guide, speech, damage preview and menu are all stacked on the fight.
- (major, snapping, ffx2 vegnagun-shuyin) Yuna goes from a standing white-mage pose to a different outfit/pose in one frame; in the party-action sequence her robes and hair change from a lilac-headed pose to a hooded white pose to a racket-holding pose with nothing in between.
- (major, size jumps, ffx2 vegnagun-shuyin) The three girls are tiny next to Vegnagun's tail and their size changes between frames: in the first three frames of the turn they are small, then the menu opens and they are about 15 to 20 percent larger and shifted left.
- (major, half-motion or ghosting, ffx2 vegnagun-shuyin) When the tail hits, the girls turn into a white flash with ghosts: Yuna becomes a white blob, Rikku a faint see-through shape, and the damage number floats on empty air.
- (polish, attacks that do not connect, ffx2 vegnagun-shuyin) Vegnagun's tail never moves toward the girls: the beam and its flash happen at the tip next to the party but the head and tail stay still, and the 1250s float over the tail and the girls while the tail is nowhere near them.
- (polish, popping, ffx2 vegnagun-shuyin) Rikku changes outfit and is gone from the line-up in one frame: yellow Thief in one sequence, dark-armoured Dark Knight in the next, and the two figures differ in size and position at the same marker.
- (major, snapping, ffx2 leblanc) After a dressphere change Paine goes from a white-clad glow to a Songstress with a hard flash; the figure is a bright white silhouette first, then a full pose with nothing in between, and the circle ring and Grenade tags float around.
- (polish, half-motion or ghosting, ffx2 leblanc) The enemy line-up is not stable: Logos and Leblanc nameplates slide across while the figures in the background are faint ghosts in the first frame, then solid.
- (polish, UI covering the action, ffx2 leblanc) Banner text (a name bar saying Logos / Leblanc) slides across the right of the screen and cuts through the enemy figures, and a tutorial coach box overlaps the hit effect while the damage numbers are being drawn.
- (major, attacks that do not connect, ffx2 leblanc) Ormi's Shield Bash: the damage numbers (194, 192, 207) float at three different places, one on empty space to the right of the enemy and the beam ends short of its target; the bubble sits over the wrong figures.
- (major, UI covering the action, ffx2 leblanc) The left panels (boss bars, guide text) and the right panel (next-move, damage preview) cover about half of the arena in Leblanc's fight, with the bubble hint box hiding the lower party.
- (polish, half-motion or ghosting, ffx seymour-flux) At the Seymour opening the battle intro card (Seymour Flux title) fades into the battle with the first frame showing the card and the arena at once, a double scene.
- (major, other, both all) The continuity harness left no transition strips at all: the continuity folder holds only the title, briefing, card, prep and pre-scene screenshots of Seymour, so the sizes, feet and double images could only be judged from the capture owner's 10-frame sequences, which are too far apart in time (about 300 ms) to see a one-frame pop.

## Ranked issue list (critical, then major, then minor, polish, suggestion)

### 1. PR-0378 [major, feel] PR-0378 (owner-reported, CHK-027 FAIL, carried, STALLED): a KO is a one-frame cut from the standing painting to the lying one

- Game / chapter: both / every chapter with a KO; status open; build 72973096 (bundle CECt6LNe)
- Expected: A figure hit to KO folds in motion (a blend or an in-between) so the snaps per minute stay under 0.25 (RUBRIC 6a); the scripted KO cut is the owner's decision (EC-1001-09) but the owner complained of snapping.
- Observed: 89 snaps in 8,908 s of live battle over 18 chapters (0.60 per minute, round 23 0.58), 94 hard cuts, lowest silhouette overlap 0.03. Strips: Yuna hurt to KO (Ch IV swap-071, Ch VI swap-268) stands then lies flat in one frame; Fem-Goon hurt to KO under a white flash; Ifrit hurt to KO (Ch III) overlap 0.11; the Isaaru Pterya KO to idle. Chapters over the limit: all but Evrae, Yojimbo and Omnis (0) and Ixion (0.13) and Bahamut (0.2, 0.17 earlier).
- Repro: Play Ch IV or Ch VI (seed 1, real keys, PYREFLY_BROWSER=gpu) until a girl is KO'd; or open the strips named in evidence. Whole run: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<18 ids> --tag=r24.
- Evidence: critic/rounds/round-24/continuity/continuity-summary.json; continuity/ffx2-bahamut-lose-r24/continuity/strips/swap-071-yuna-hurt-ko.jpg; critic/reviews/72973096-focused/continuity/ffx2-leblanc-win-72973096/continuity/strips/swap-268-yuna-hurt-ko.jpg; braskas-final-aeon-win-72973096/continuity/strips/swap-155-ifrit-hurt-ko.jpg
- Confidence: high
- Requirement: CHK-027, RUBRIC 6a
- Smallest fix: Blend the KO collapse into the lying painting instead of cutting (a 6 to 8 frame matched dissolve anchored at the feet, or one fall frame per member); Bailey's yes first (EC-1001-09).
- Acceptance check: Continuity harness on the live build: snaps per minute at or under 0.25 in every chapter.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 2. PR-0379 [major, feel] PR-0379 (owner-reported, CHK-027 FAIL, carried; count up, cause unknown): most pose changes show two copies of the figure at once

- Game / chapter: both / every chapter; worst Ch VI, XV, XVII, XIII, XI; status open; build 72973096 (bundle CECt6LNe)
- Expected: A pose change shows one figure at a time or a deliberate blend that keeps head and feet in place (CHK-027).
- Observed: 253 swaps at double-image severity 0.4 or more (worst 0.465) in the live 18-chapter run, against 161 in round 23 (d3fe9fe5). Per chapter: Leblanc 77 (round 23: 20; 59 in the focused harness of this same build), Sin Fins 48, Trema 26 (1), Vegnagun 23 (12), Fallen Aeons 19 (1), Bahamut 15, Braska 11, Natus 10, Yunalesca 9. A live Ch I mid-hit frame shows two Seymour heads; the fan saw a see-through Yuna copy and a double Seymour (crouch to attack-reaction). Part of the rise may be host load (53 to 58 fps in some runs); the same-commit Leblanc agrees across two runs (59, 77), so the rise against d3fe9fe5 is not noise. The previous live build 931613a8 was not measured for Leblanc, so regression against live is unknown.
- Repro: Continuity harness, ffx2-leblanc win, seed 1; strips ghost-*.jpg; critic/rounds/round-24/continuity/ffx2-leblanc-win-r24/continuity/. Compare 931613a8 to settle the regression question (not built here).
- Evidence: critic/rounds/round-24/continuity/continuity-summary.json; critic/rounds/round-24/evidence/seymour-flux-win/23-midfight.png; critic/reviews/72973096-focused/continuity/braskas-final-aeon-win-72973096/continuity/strips/ghost-922-auron-attack-follow.jpg
- Confidence: high for the counts, low for the cause of the rise
- Requirement: CHK-027
- Smallest fix: Shorten the attack-to-follow crossfade or cut it where the silhouettes share under a fifth of their outline; hold one pose for the hit flash; first run Leblanc alone on 931613a8 and 72973096 to see whether the count moved with the build.
- Acceptance check: No swap at double-image severity 0.40 or more in Ch I, IV, VI; the Leblanc count at or under round 23's 20.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false

### 3. PR-0380 [major, feel] PR-0380 (CHK-027 FAIL, carried): large figures jump sideways in one frame when a pose changes

- Game / chapter: both / worst Fallen Aeons, Vegnagun, Sin Fins, Braska, Sin Face, Yunalesca, Isaaru; status open; build 72973096 (bundle CECt6LNe)
- Expected: No one-frame jump of 40 px or more outside a camera cut.
- Observed: 1,043 jerks of 40 px or more (round 23: 1,092), worst 966 px (Fallen Aeons boss painting swap), 807 px (Vegnagun tail), 334 px (Sin Fins), 304 px (Sin Face), 284 px (Braska), 270 px (Yunalesca), 249 px (Isaaru); Bahamut 182 px (the focused harness read 255.7 px, a whole-frame pose and framing change). Some magnitudes are inflated by host saturation (a Yojimbo rerun alone read 53 px against 108 px under load). The fan saw Seymour's head cut off by the top of the frame and Mortiorchis change size and pose at the Full-Life turn.
- Repro: Continuity harness, any chapter above; strips jerk-000-*.jpg.
- Evidence: critic/rounds/round-24/continuity/continuity-summary.json; critic/rounds/round-24/continuity/ffx2-fallen-aeons-win-r24/continuity/strips/
- Confidence: high for the KO and boss swaps, medium for magnitudes
- Requirement: CHK-027
- Smallest fix: Anchor the boss painting swaps at the feet and cross-fade them; bound the hurt recoil step per frame.
- Acceptance check: No jerk over 40 px outside a camera cut in Ch I, IV, VI and the Fallen Aeons boss swap.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 4. PR-0421 [major, visual] PR-0421 (new): the Ch IV wide camera pull shows the backdrop plate edges

- Game / chapter: FFX-2 / IV (ffx2-bahamut); status open; build 72973096 (bundle CECt6LNe)
- Expected: The backdrop fills the frame through the whole camera move.
- Observed: About 3.9 to 6 s after the battle slate the camera pulls wide and the painted backdrop does not fill the frame: dark vertical bands show at left and right and a lit bottom edge, at 1600x900 and at 2000x1012 (chief read the 1600x900 frame s180: bands at x 0 to 190 and x 1350 to 1470, bottom edge near y 640). The first-menu and sequence frames do not show it. 931613a8 was not captured for comparison.
- Repro: Live site, Ch IV by real keys at seed 1, CDP screencast from the battle slate; frames s150 to s300.
- Evidence: critic/rounds/round-24/evidence/gaps/cast-ffx2-bahamut-1600x900/seq-screencast/s180.jpg; cast-ffx2-bahamut-2000x1012/seq-screencast/s210.jpg
- Confidence: high
- Requirement: CHK-013, CHK-002 (edge or void), RUBRIC 7 composition
- Where: Ch IV camera presets for Bahamut (new close and wide views, giants share 0.66)
- Smallest fix: Extend or enlarge the plate to cover the widest camera frustum, or clamp the wide view (shipped derivative or camera preset only; the approved painting is not replaced).
- Acceptance check: Screencast of the Ch IV entry at 1600x900 and 2000x1012: no dark band or edge in any frame of the move.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature true

### 5. PR-0333 [major, visual] PR-0333 (carried from round 20, WORSE and raised from polish; inNewFeature: the phone rig): at 390x844 the first menu hides Bahamut

- Game / chapter: FFX-2 / IV (also VI); status open; build 72973096 (bundle CECt6LNe)
- Expected: The boss is visible at the first menu on a phone.
- Observed: At 390x844 touch the enemy-acts-next strip, the Curse banner and the Rikku coach card cover the stage band and leave a sliver of Bahamut; the stage is about 390 px tall and the command stack takes the lower 230 px (chief read 10-first-menu.png: the boss is not identifiable). Round 23 recorded the head, neck and wing tops under the strip at the larger size. Emulated viewport, not a real phone.
- Repro: Fresh profile, 390x844 touch context, Ch IV, first menu, seed 1.
- Evidence: critic/rounds/round-24/evidence/gaps/cam-ffx2-bahamut-390x844-touch/10-first-menu.png and 11-guide-open.png
- Confidence: high (emulation)
- Requirement: Phone layout of the new rig for the smaller Bahamut; PR-0333
- Smallest fix: Collapse the acts-next strip and the coach card on narrow screens, or move them into the stack band so the boss stays in view.
- Acceptance check: 390x844 first menu in Ch IV shows at least half of Bahamut's body with the coach open.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature true

### 6. PR-0279 [major, encounter] PR-0279 (carried, RAISED from polish; a question for Bailey, D-282): Chapter XVIII wins almost never under the shipped 12-turn Giga-Graviton rule

- Game / chapter: FFX / XVIII Sin: Face; status open; build 72973096 (bundle CECt6LNe)
- Expected: A documented line wins at a rate Bailey names (fair wins, RUBRIC 2).
- Observed: Shipped line 0 of 100 on fresh seeds 1001-1100 and 0 of 30 on seeds 1-30; the advisor card 1 of 30; the sin-bench (200 seeds) gives the sensible line 1 of 200 (0.5 percent) and the advisor line 6 of 200 (3 percent) at 12 turns, 33 of 200 and 40 of 200 at 13 turns; the builder's own harness has 117 of 500 (23 percent), 124 before W2 (noise). Round 23 measured 12 of 40 on d3fe9fe5, before RC1 added the 12-turn rule (39.4.3, live). Real keys: the ring reads 11, 3, 2, 1, Giga-Graviton fires, the party is KO'd, results and Retry work; no win exists by real input in any round. W2 did not move it, so it is not a regression.
- Repro: PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-bench.test.ts --disableConsoleIntercept; PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1001-1100 PYREFLY_MEASURE_CHAPTERS=sin-face npx vitest run tests/unit/ffx-parity-measure.test.ts
- Evidence: critic/rounds/round-24/combat/ffx-measure-1001-1100.json; scorecard-r24-deep.json; evidence/gaps/sin-face-win-clock2/
- Confidence: high (engine); no real-input win
- Requirement: Fair wins; every included encounter completes through its real flow (milestone gate); rule 6 (never tune a boss)
- Smallest fix: Bailey's decision: keep the game's 12 turns and rework the line, preset or party for it, or name the target rate. Not a boss tune.
- Acceptance check: A documented line wins at the rate Bailey names on the bench and in one real-input run to results.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 7. PR-0353 [major, encounter] PR-0353 (carried, STALLED, seventh review): Ch XIII Trema still has no real-key victory

- Game / chapter: FFX-2 only / XIII Trema; status open; build 72973096 (bundle CECt6LNe)
- Expected: A real-input win of Ch XIII with its post scene, results and board (CHK-022).
- Observed: This round the win route ended in defeat at seed 1 (97 events lost in link 1, Retry reached battle). The engine now wins it: the shipped line 22 of 60 fresh seeds (W3 500-seed 43 percent; round 23: 5 percent), so the wall is a harness and human-pace question rather than an unwinnable fight. The link-2 retry state was not exercised (PR-0407).
- Repro: route.mjs ffx2-trema win, seed 1.
- Evidence: critic/rounds/round-24/continuity/ffx2-trema-win-r24/; critic/rounds/round-24/combat/ffx2-measure-1001-1060.json
- Confidence: high
- Requirement: CHK-022; RUBRIC section 5
- Smallest fix: A longer budget or a human-paced Trema route (critic tooling), then the RUBRIC section 8 method check this issue has owed since round 21.
- Acceptance check: One real-key win with results and board.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 8. PR-0148 [major, audio] PR-0148 (carried, sixth review): no numeric owner listening verdict for the shipped mix, and the two new cues were chosen by delegation, not by ear

- Game / chapter: both / all; status open; build 72973096 (bundle CECt6LNe)
- Expected: Bailey's numeric listening verdict (CHK-B1) so audio can be scored.
- Observed: docs/audio/OWNER-VERDICT.md has no number; the last ear words are 2026-09-27. boss-bahamut and boss-leblanc were accepted on 2026-10-10 by delegation to the driver's recommendation. No agent can hear.
- Repro: Bailey opens docs/audio/audition.html.
- Evidence: docs/audio/OWNER-VERDICT.md; docs/audio/music-elevenlabs-2026-10-10.json
- Confidence: high
- Requirement: RUBRIC section 6 audio; CHK-B1
- Smallest fix: Bailey listens and gives a number; nothing to build.
- Acceptance check: A numeric verdict recorded.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 9. PR-0407 [major, encounter] PR-0407 (carried, not re-tested): a loss in link 2 retries from Paragon's end state, which can leave one survivor

- Game / chapter: FFX-2 only / XIII Trema link 2; status open; build 72973096 (bundle CECt6LNe)
- Expected: A Retry that can be won.
- Observed: Round 23: one living girl wins 0 of 200 retries (a question for Bailey, TR5 b, D-146). The retry was exercised in this round only from a link-1 loss; the link-2 carried state was not.
- Repro: critic/rounds/round-23/ trema-link2-probe.json.
- Evidence: critic/rounds/round-23.json PR-0407
- Confidence: high (round 23)
- Requirement: Retry
- Smallest fix: Three measured options for Bailey, see round 23 proposals.
- Acceptance check: Per the chosen option.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 10. PR-0269 [major, combat] PR-0269 (carried, not re-measured): the advisor card chain clears 97 of 200 seeds in Ch XVII

- Game / chapter: FFX / XVII Sin Fins and Core; status open; build 72973096 (bundle CECt6LNe)
- Expected: A card line that clears the chapter at a rate Bailey accepts.
- Observed: Not re-measured this round. W2 moved the engine; the intended line clears Ch XVII 86 of 100 fresh seeds.
- Repro: critic/rounds/round-23 sin-ab-cand.json method.
- Evidence: critic/rounds/round-24/combat/ffx-measure-1001-1100.json (intended line only)
- Confidence: medium
- Requirement: RUBRIC section 2 advisor
- Smallest fix: Re-run the card chain bench on 72973096.
- Acceptance check: Card chain rate recorded.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 11. PR-0099 [major, audio] PR-0099 (carried, STALLED; PARTLY addressed by 39.4.4): chapter rows in THEMES.md still play a stand-in cue

- Game / chapter: both / IX, X, XI to XVIII (Ch IV and VI now have their own cues); status open; build 72973096 (bundle CECt6LNe)
- Expected: Each chapter plays a cue of its own.
- Observed: Release 39.4.4 gave Ch IV (boss-bahamut) and Ch VI (boss-leblanc) cues of their own, FFX-2 only. public/audio gained only those two files, so the other rows named in round 23 (IX, X, XI to XVIII) are unchanged. The Experiment plays boss-ffx2-aeon then boss-vegnagun and Gui plays boss-dread then boss-seymour (stand-ins).
- Repro: node tools/audio/themes-audit.mjs.
- Evidence: critic/rounds/round-24/audio-qa.json; critic/rounds/round-24/evidence/gaps/exp-leblanc-win-hidden/audio-events.jsonl
- Confidence: high
- Requirement: THEMES.md cue map
- Smallest fix: Bailey's call per chapter (new cues cost money and need ear approval).
- Acceptance check: themes-audit lists no borrowed row Bailey wants replaced.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 12. PR-0222 [major, delivery] PR-0222 (carried, unchanged, not captured): the fix for the hidden FF7 fight's black hold on a cold cache is still not observed

- Game / chapter: FF7 experiment (hidden) / FF7 Guard Scorpion; status open; build 72973096 (bundle CECt6LNe)
- Expected: No black hold on a cold cache.
- Observed: Not exercised in round 24; no FF7 product file is in this release's changed set.
- Repro: Cold-cache FF7 door.
- Evidence: critic/rounds/round-23.json PR-0222
- Confidence: low
- Requirement: CHK-025
- Smallest fix: A cold-cache capture.
- Acceptance check: Capture shows no black hold.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### 13. PR-0397 [minor, harness] PR-0397 (critic tooling, carried from round 23 and RE-FIRED: it made a false disclosed major): the route's target matcher resolves "Yuna" to "Yunalesca"

- Game / chapter: both / II (yunalesca); critic tooling; status open; build 72973096 (bundle CECt6LNe)
- Expected: A wanted ally named "Yuna" resolves to the ally id yuna; a revive reaches her.
- Observed: In yunalesca-win/run.json fifteen picks (turn 55 to 72) carry want "Yuna" while the engine record says the Phoenix Down went to yunalesca (target yunalesca, wanted yunalesca, mismatch false); Yuna stays at 0 HP and the route loses at turn 73. Same on the 931613a8 route. resolveTargetId (critic/runner/lib/route-pure.mjs) falls through to the slug-prefix test and matches yunalesca for "yuna"; the roster-name step only reads enemy ids. The focused review disclosed this loss as F7297-02 (a major) and the gap pass reported five straight route losses (seeds 1 to 5) as a possible regression; both are the same harness fault. The engine's intended line wins 100 of 100 fresh seeds. (The gap pass's injected autoBattle bench crashed the page ("Target crashed"): a harness crash, not a product finding.)
- Repro: node critic/runner/lib/route.mjs yunalesca win --base=https://echoesofspira.com/ --evidence=<dir> --seed=1; read picks[54..72].
- Evidence: critic/rounds/round-24/evidence/yunalesca-win/run.json (picks, engineDid); critic/rounds/round-24/chief/res-19.json (F24-INT-01)
- Confidence: high
- Requirement: RUBRIC section 5: separate harness failures from product failures
- Smallest fix: Resolve exact id or display name across allies and enemies first, use the prefix only when exactly one id matches, record unresolved when two do; rerun Ch II at seed 1 to 5.
- Acceptance check: Every pick wanting Yuna shows engineDid targets ["yuna"]; Ch II is won by real keys or lost for a product reason.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: WITHDRAWS the focused review's disclosed major F7297-02 and the gap pass's "Ch II lost on five seeds" as product defects.

### 14. PR-0422 [minor, interface] PR-0422 (new): the advisor card's top row trails the intended line in several chapters after the rule changes

- Game / chapter: both / II, X, XIV, V (advisor card); status open; build 72973096 (bundle CECt6LNe)
- Expected: Card rate within the noise of the 2026-09-27 baseline or an explained reason.
- Observed: Advisor-card follower, 30 seeds: Yunalesca 77 percent (intended 97; baseline 92), Isaaru 63 (90; 88), Natus 83 (63; 95), Vegnagun 53 (43; 90), Trema 27, Flux 100, Omnis 100. Part of the move is RC1 (live since 39.4.3), part W2; the split is not measured. Cross-reference only; scored under interface.
- Repro: SCORECARD_SEEDS=30 SCORECARD_DRIVERS=card,intended npx vitest run --config critic/bench/advisor-v3/vitest.config.ts
- Evidence: critic/rounds/round-24/combat/scorecard-r24-deep.json
- Confidence: medium
- Requirement: Legal, useful advice
- Smallest fix: Re-run the card scorecard on 931613a8 to split the cause, then repair the card's rules for the changed engine.
- Acceptance check: Card rate within noise of the baseline or an explained reason.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined

### 15. PR-0423 [minor, visual] PR-0423 (new, cause not established): Bahamut's wing and spine edges carry a pale-cyan rim and loose chips at gameplay scale

- Game / chapter: FFX-2 / IV Bahamut; status open; build 72973096 (bundle CECt6LNe)
- Expected: The torn wing edge reads as part of the painting with no halo and no floating pieces.
- Observed: At 2x display the wing and spine edges carry a chunky pale-cyan fringe with detached chips on the right wing, visible as a bright outline at 1x (chief read the 1600x900 frame: a light rim around both wings and the tail). Whether the rim is in the approved painting or comes from the cutout matte is not established.
- Repro: Ch IV wide shot, 1600x900, frame s180 of the screencast; crop at 2x.
- Evidence: critic/rounds/round-24/evidence/gaps/cast-ffx2-bahamut-1600x900/bahamut-crop-2x-s180.png; critic/rounds/round-24/targets/crop-bahamut-wing.png
- Confidence: medium
- Requirement: CHK-013; approved art is protected (judge only how it renders)
- Smallest fix: If the rim is a render or matte artefact fix the shipped derivative only; do not repaint.
- Acceptance check: 2x crop shows no detached chips; verify-approved still 0 mismatched.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined

### 16. PR-0424 [minor, delivery] PR-0424 (new): THEMES.md rows IV and VI still name boss-ffx2-aeon, so themes-audit and tests/unit/themes-chapter-cue-map.test.ts fail on the release tree

- Game / chapter: FFX-2 only / IV, VI; status open; build 72973096 (bundle CECt6LNe)
- Expected: Row IV lists boss-bahamut and row VI boss-leblanc; a green suite before a push (AGENTS.md).
- Observed: themes-audit prints FAIL for ffx2-bahamut and ffx2-leblanc ("map says boss-ffx2-aeon, the chapter plays ...") and the unit test has 3 failures; docs/audio/THEMES.md lines 653 and 655 were not updated by 72973096. Docs and audit only: no player-facing change.
- Repro: npx vitest run tests/unit/themes-chapter-cue-map.test.ts; node tools/audio/themes-audit.mjs
- Evidence: critic/rounds/round-24/combat/vitest-full.log; critic/rounds/round-24/chief/res-18.json
- Confidence: high
- Requirement: CHK-001 step 2; done means a green suite
- Smallest fix: Update the two rows (Battle cell, Status, Owed cue).
- Acceptance check: themes-audit reports 0 chapters departing from the cue map; the test passes.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true

### 17. PR-0425 [minor, audio] PR-0425 (new, new feature): the two new ElevenLabs boss cues fail the stereo gate that the cues they replace pass

- Game / chapter: FFX-2 only / IV, VI, hidden Leblanc; status open; build 72973096 (bundle CECt6LNe)
- Expected: A shipped cue passes the three stereo measures (L/R correlation 0.60 to 0.85, side-to-mid -10 to -6 dB, mono-sum loss no worse than -1 dB), or Bailey has chosen "as heard" by ear (the D-582 class).
- Observed: boss-bahamut corr 0.408, side-to-mid -3.72 dB, mono loss -1.54 dB; boss-leblanc 0.257, -2.28, -2.02; boss-ffx2-aeon 0.643, -6.59, -0.86 passes. The release record says the gate was not measured. Audibility is an ear question.
- Repro: node critic/rounds/round-24/stereo-gate.mjs boss-bahamut boss-leblanc boss-ffx2-aeon
- Evidence: critic/rounds/round-24/stereo-gate.mjs; critic/rounds/round-24/audio-qa.json
- Confidence: high on the measurement, low on audibility
- Requirement: THEMES.md stereo gate
- Smallest fix: Stage narrow-width variants as for the earlier ElevenLabs cues, write the numbers into THEMES.md and let Bailey pick by ear; do not swap on a reviewer's taste.
- Acceptance check: THEMES.md rows carry measured values and either pass or a decision row records Bailey choosing the wide version.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature true

### 18. PR-0426 [minor, encounter] PR-0426 (new): the Natus guide still teaches a drain-slices line the engine now loses every time, and the research line says Flare is rank 5

- Game / chapter: FFX only / X Seymour Natus; status open; build 72973096 (bundle CECt6LNe)
- Expected: Guide text matches a measured line; research cites record 0x6079 rank 3.
- Observed: Natus's Flare is the game's rank 3 (raw monmagic2 record 0x6079); the data comment natusFlare keeps 5 and the data layer overrides. Shipped line 60 to 62 percent (was 77), guide strategy 6 (drain slices, "still beats dealing with his Flare", src/data/guides/docs/seymour-natus.ts:82) wins 0 of 200 on the bench; research/ffx-seymour-natus-highbridge.md section 3.1 still says rank 5.
- Repro: npx vitest run tests/unit/chapters/natus-bench.test.ts tests/unit/chapters/natus-shipped-bench.test.ts --disableConsoleIntercept
- Evidence: critic/rounds/round-24/combat/recheck-records.mjs output
- Confidence: high (rank), medium (guide effect)
- Requirement: Rule 6; the guide follows Jegged with citations
- Smallest fix: Correct the research line and the guide wording (Bailey approves wording); leave the engine at the game's rank.
- Acceptance check: Guide matches a measured line; research cites rank 3.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature undefined

### 19. PR-0427 [minor, combat] PR-0427 (new, pre-existing, disclosed by the builder): Counterattack, Auto-Potion, Auto-Med and Auto-Phoenix fire for a sleeping or Threatened wearer

- Game / chapter: FFX only / any with Counterattack or Auto-abilities; status open; build 72973096 (bundle CECt6LNe)
- Expected: A sleeper does not react (pp_BtlCanAct with the not-Threatened flag, W2 handoff M.7).
- Observed: collectReactions returns a counter for an awake, an asleep and an asleep-plus-Threatened wearer alike (1, 1, 1). Kept out of this release to avoid moving seeds.
- Repro: critic/rounds/round-24/combat/react.probe.ts
- Evidence: critic/rounds/round-24/combat/react.probe.ts
- Confidence: high
- Requirement: Rule 6, 1:1 parity
- Smallest fix: Gate the four reactions on canQueueAction (src/battle/ffx/ticks.ts:135-188) as a batch of its own with the benches re-measured.
- Acceptance check: The probe prints 1, 0, 0.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined

### 20. PR-0383 [minor, combat] PR-0383 (carried, re-observed, now a no-op): an aeon's menu offers Defend (the Q DEFEND tab) and it applies no status

- Game / chapter: FFX only / II, III, VII, VIII, X, XIV (any chapter with a summon); status open; build 72973096 (bundle CECt6LNe)
- Expected: No offered command that does nothing; the game's aeons have no Defend (a question for Bailey whether the Steam HD copy offers it).
- Observed: Ch II, Valefor summoned by real keys at 1600x900 and 2000x1012: the aeon's rows are Attack, Aeon, Dismiss and the "Q DEFEND" tab is visible; Q spends the turn and the log shows no status-add (W2 made the extra-status step honour the aeon's innate Defend immunity). Aeon rows read Attack | Sonic Wings | Shield | Boost | Defend | Dismiss in the engine.
- Repro: critic/rounds/round-24/combat/aeon.probe.ts; evidence/gaps/aeon-defend-yunalesca-2000x1012/
- Evidence: critic/rounds/round-24/evidence/gaps/aeon-defend-yunalesca-2000x1012/30-aeon-menu-defend-tab.png, 31-after-defend-q.png
- Confidence: high (engine and screen)
- Requirement: CHK-004 spirit
- Smallest fix: Do not build the Defend row for user.side aeon (src/battle/ffx/commands.ts:234).
- Acceptance check: No Defend tab on an aeon's turn.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature undefined

### 21. PR-0430 [minor, interface] PR-0430 (new): the Ch I intent card ends a sentence mid-way ("...; no other delay is")

- Game / chapter: FFX only / I Seymour Flux; status open; build 72973096 (bundle CECt6LNe)
- Expected: A finished sentence.
- Observed: "Delay Attack or Delay Buster on the Mortiorchis is punished with party-wide Slowga; no other delay is" and then the next line; the source string lacks its last word before the citation tag.
- Repro: Ch I first menu, press E, hold J, read IF YOU ATTACK.
- Evidence: critic/rounds/round-24/evidence/seymour-flux-win/run.json intentText; src/battle/ffx/intent.ts:379
- Confidence: high (traced)
- Requirement: CHK-007; rule 6
- Where: src/battle/ffx/intent.ts:379 (commit 053a9a503, in 931613a8 too)
- Smallest fix: Complete the sentence from research/re-ffx-ai-seymour.md section 2.5 / D-05 and add a test that no bullet ends in a stop word.
- Acceptance check: Every bullet ends in a complete clause.

### 22. PR-0428 [polish, feel] PR-0428 (new): the Sin clock reads "1 TURNS LEFT" and Giga-Graviton fires while it still shows 1

- Game / chapter: FFX only / XVIII Sin: Face; status open; build 72973096 (bundle CECt6LNe)
- Expected: "1 TURN LEFT"; the numeral and the event agree.
- Observed: The ring reads 11, 3, 2, 1; at 1 the banner shows; grammar plural.
- Repro: sin-face win route, seed 1.
- Evidence: critic/rounds/round-24/evidence/gaps/sin-face-win-clock2/sinclock-1-1.png and sinclock-1-6.png
- Confidence: high
- Requirement: HUD wording
- Smallest fix: Singular label at 1; confirm what the numeral reads at the cast.
- Acceptance check: Capture at numeral 1 and at the cast.

### 23. PR-0429 [polish, narrative] PR-0429 (new): Shuyin's taunt repeats three times in about 90 seconds

- Game / chapter: FFX-2 only / V; status open; build 72973096 (bundle CECt6LNe)
- Expected: No taunt twice within 60 s (writing bible 1.21).
- Observed: "You fight like someone who still wants something." at 946.7 s, 959.8 s and 1038.8 s; the source comment says the pool is one line until the presenter can vary on the event payload.
- Repro: Ch V seed 1, dboxTimeline in run.json.
- Evidence: critic/rounds/round-24/evidence/ffx2-vegnagun-shuyin-win/run.json
- Confidence: high
- Requirement: Banter variety
- Smallest fix: Two or three authored variants picked by the payload index (src/story/scripts/ffx2-vegnagun-shuyin.ts around line 473); FFX-2 only.
- Acceptance check: A full Shuyin link shows no taunt twice within 60 s.

### 24. PR-0431 [polish, harness] PR-0431 (critic tooling, new): the route expects the post-battle scene before results (30-post-scene always UNVERIFIED), cannot open typed-word chapters, and the first live continuity run ended with its agent's turn

- Game / chapter: both / critic tooling; status open; build 72973096 (bundle CECt6LNe)
- Expected: The route finds the scene after the results Confirm; hidden chapters open by typed words; a long harness run survives its launcher.
- Observed: The scene plays after the results Confirm (afterConfirmScenes 6 to 42 lines in five wins); 30-post-scene.png fails its assertion in Ch I and VI. route.mjs finds chapters from board cards, so the hidden chapters were never opened by the capture owner. The first continuity run stopped after one chapter and wrote no summary; the gap pass reran 17 chapters in four shards (cs-s1..s4) and the chief aggregated them (critic/rounds/round-24/chief/aggregate.mjs).
- Repro: route.mjs seymour-flux win; continuity.mjs launched from a sub-agent that returns.
- Evidence: critic/rounds/round-24/evidence/seymour-flux-win/run.json; critic/rounds/round-24/continuity/index.json
- Confidence: high
- Requirement: CHK-016, CHK-022
- Smallest fix: Take 30-post-scene from the after-Confirm capture, add a typed-word entry to route.mjs, and run continuity.mjs detached with a durable log.
- Acceptance check: A win run's post-scene frame passes; hidden chapters open from the route.

### 25. PR-0432 [polish, visual] PR-0432 (new, fan, low confidence): Yuna's hit pose carries a hard white fringe like a cut-out

- Game / chapter: FFX / I Seymour Flux; status open; build 72973096 (bundle CECt6LNe)
- Expected: The hit pose edge blends with the painting.
- Observed: A hard white jagged fringe around Yuna's hit pose in the Lance of Atrophy frames (fan crop).
- Repro: Ch I opening turn.
- Evidence: critic/rounds/round-24/evidence/seymour-flux-win/seq-transition-into-battle/f07.jpg
- Confidence: low
- Requirement: Outline fringe (fan list)
- Smallest fix: Check the matte on the hurt derivative; do not repaint.
- Acceptance check: Crop shows no fringe.

### 26. PR-0377 [polish, visual] PR-0377 (owner-reported, CHK-026 FAIL, further NARROWED): one swap of 9,355 is over the head tolerance (Pterya KO to idle under a light bloom)

- Game / chapter: FFX / XIV Isaaru; status open; build 72973096 (bundle CECt6LNe)
- Expected: Head within 3 percent across a pose swap.
- Observed: Isaaru: Pterya KO to idle changes the mass by 33.6 percent (0.1 to 0.3 percent where registered); round 23 had 5 swaps and one 4.2 px feet shift, now 0 feet swaps (max 1.5 px).
- Repro: continuity isaaru-via-purifico win r24; strip swap-099-pterya-ko-idle.jpg.
- Evidence: critic/rounds/round-24/continuity/isaaru-via-purifico-win-r24/continuity/strips/swap-099-pterya-ko-idle.jpg
- Confidence: medium
- Requirement: CHK-026
- Smallest fix: Register Pterya's KO pose.
- Acceptance check: CHK-026 PASS in all 18 chapters.

### 27. PR-0408 [polish, feel] PR-0408 (new, FFX-2 only; merges R23-HARNESS-01): Ch XIII dressphere changes and 14 idle-to-idle swaps at turn start are hard cuts, Paine and Rikku change size and outfit in one frame, and the harness may be counting a staged change as a snap

- Game / chapter: FFX-2 only / Ch XIII Trema, 20 of the chapter's 24 snaps; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A dressphere change plays the staged spherechange twirl or a blend; if the change is a link or Lady Luck forced change, the figure still blends.
- Observed: Ch XIII measures 2.66 snaps per minute, the highest of the 18: 20 of its 24 snaps are idle-to-idle cuts at turn start (Paine Dark Knight to Lady Luck, Yuna, Rikku; IoU 0.28 to 0.42, 44 to 85 px, 0 blend frames; strip swap-019 feet 13 px; swap-546 feet 45.5 px). The capture owner's seq-spherechange shows a light column and a name chip over the same change, so some of these are the staged dressphere change that the harness did not classify as a costume swap (CHK-026 note 7); the strips show the figure changing size and outfit in one frame.
- Repro: ffx2-trema real-key run, any attempt that reaches link 2; strip critic/rounds/round-23/continuity/ffx2-trema-win-r23/continuity/strips/swap-019-paine-idle-idle.jpg.
- Evidence: critic/rounds/round-23/continuity/ffx2-trema-win-r23/continuity/continuity.json
- Confidence: medium-low (cause not traced)
- Requirement: CHK-027 item 1
- Where: src/engine presenter dressphere change; critic/runner/lib/continuity-pure.mjs costume detection (suspected, not traced)
- Smallest fix: Suspected: route the turn-start costume change through the spherechange sequence or a crossfade; confirm first which event triggers it.
- Acceptance check: The Trema chapter's idle to idle swaps no longer count as snaps.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 28. PR-0355 [polish, visual] Magus Sisters bars: status chips overprint the names Cindy and Mindy (carried from round 22)

- Game / chapter: FFX-2 only / Ch XI Fallen Aeons link 2 first menu; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Names whole and readable (CHK-009).
- Observed: The STATUS chip rows sit over the names Cindy and Mindy so only 'Sandy' reads cleanly (re-seen in 24-seam-2-first-menu).
- Repro: ffx2-fallen-aeons seed 2, first menu of link 2.
- Evidence: critic/rounds/round-23/evidence/ffx2-fallen-aeons-win-r2/24-seam-2-first-menu.png
- Confidence: high
- Requirement: CHK-009
- Where: FFX-2 enemy bar stack, not traced
- Smallest fix: Move the chips to the right of the HP bar or stack them under the bar.
- Acceptance check: All three names legible with a status present.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 29. PR-0384 [polish, visual] Chapter-select hero card paints without the boss layer on arrival (carried PR-0384)

- Game / chapter: both / Ch VIII card at first arrival and on returning from results; status open; build 72973096 (bundle CECt6LNe)
- Expected: Boss on its scene (tile Chapter select v2).
- Observed: 03-card and 34-board-after show the hero card with no Evrae painting (a dark card, then clouds only); after a reload the boss is there.
- Repro: Fresh profile, chapter select, Ch VIII; and win Ch VIII, confirm results.
- Evidence: critic/rounds/round-23/scratch/cs.jpg
- Confidence: medium
- Requirement: approved tile Chapter select v2
- Where: not traced
- Smallest fix: Preload the selected card's boss and scene layers before showing the card.
- Acceptance check: The boss is painted in the first frame the card is shown.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24: first view of the Ch V card shows an empty or dark card and the party portraits as grey silhouettes with alt text; the harness does not assert img.complete. Evidence: evidence/ffx2-vegnagun-shuyin-win/03-card.png, 34-board-after.png, 35-board-reload.png.

### 30. PR-0366 [polish, visual] HUD panels stand over painted figures (carried PR-0366)

- Game / chapter: both / Ch II, XII, XVIII at 1600x900; Ch I and IV at 1280x720; status open; build 72973096 (bundle CECt6LNe)
- Expected: Only the two declared overlaps.
- Observed: Party plates cover the lower legs of Wakka (Ch XVIII), the Omnis enemy-intent text runs across Omnis's lower body (Ch XII), the Mortiorchis Sensor card covers Seymour's lower legs and the Bahamut intent card his right wing at 1280x720. No face or weapon is crossed. First-time fan, from the sequences: the hero portrait covers the left half of the screen with the party at every menu opening, and the guide and next-move panels cover the right side of Bahamut (Ch IV), Paragon (Ch XIII), Vegnagun and Sin's fin while a move plays; they rated it major. The chief keeps polish: the panels are the approved Ink and Gold chrome, no face or weapon is crossed in the captures read, and the player can hide them (G, E, H).
- Repro: Real-key first menu in those chapters; evidence 23-midfight and 11-advisor.
- Evidence: critic/rounds/round-23/evidence/sin-face-win/23-midfight.png; seymour-omnis-win-r2/11-advisor.png; seymour-flux-win-1280/11-advisor.png
- Confidence: high
- Requirement: CHK-008
- Where: HUD safe zones, not traced
- Smallest fix: Shift the intent text and Sensor card off the boss's body or let them fade when they overlap.
- Acceptance check: CHK-008 over the matrix.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24 (widened, polish as in round 23): the chain popup over the advisor card header (Ch VI after a target cancel), the E card over Braska's Final Aeon's face (Ch III), the coach over Tidus's and Yuna's feet (Ch I), HP panels over a knocked-back Yuna and Auron, the Braska dialogue box and stacked panels over the Vegnagun fight, the left and right panels over about half the arena in Leblanc's fight (fan, 1600x900). Evidence: evidence/ffx2-leblanc-win/16b-after-cancel.png, braskas-final-aeon-win/12-intent-E.png, seymour-flux-win/12-intent-E.png.

### 31. PR-0403 [polish, visual] Ch XIV mid-fight frame washed grey with only Yuna in colour (carried PR-0403, low confidence)

- Game / chapter: FFX only / Ch XIV Isaaru, 23-midfight; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A summon moment shows its own effect, not a grey frame.
- Observed: The whole frame including the HUD is under a pale grey wash, Yuna and Grothia are in colour and a figure is cut off at the right edge. The following action sequence frames are normal, so it is a transient (suspected summon or dismiss fade).
- Repro: isaaru-via-purifico real-key run seed 1, the 23-midfight capture.
- Evidence: critic/rounds/round-23/evidence/isaaru-via-purifico-win/23-midfight.png; scratch/isaaru-seq.jpg
- Confidence: low
- Requirement: CHK-016 plus visual staging
- Where: not traced
- Smallest fix: Check the aeon summon and dismiss fade layer.
- Acceptance check: 23-midfight in Ch XIV shows the normal battle.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 32. PR-0409 [polish, delivery] PR-0409 (new; merges R23-XREF-01): the shared tree's public/art disagrees with the approved hashes (19 mismatched, 47 missing) and two pose-art unit tests fail on this disk, although the live site is pixel-identical to the approved art

- Game / chapter: both / not a chapter (art delivery); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: 0 mismatched, 0 missing against the tree a release is cut from.
- Observed: node D:/Tools/pyrefly-lora/tools/verify-approved.mjs on D:/Final Fantasy reports 19 mismatched and 47 missing. The 19 are the pre-D-380 Tidus and Bahamut files and the pre-D-458 title key art; the 47 are the 45 Lady Luck paintings and two @2x masters. Live is pixel-identical to the approved versions in every case sampled. The combat auditor saw the same root as test failures: tests/unit/engine/pose-scale-art.test.ts (16 "painting changed since it was measured") and pose-install-0930.test.ts (tidus/critical sha f4d96576 against the locked 672f798d), plus the three Lady Luck face-crop failures (PNGs absent from this checkout). The visual auditor traced the 19 to the shared tree still holding the pre-D-380 Tidus and Bahamut originals and the pre-D-458 title painting, the 47 to the 45 Lady Luck paintings and two @2x masters that exist only in the release tree. Live was proved pixel-identical for the shipped tidus attack, ffx2-bahamut idle, tidus ready, 14 sampled PNG masters and all 47 Lady Luck and @2x files.
- Repro: Run verify-approved.mjs in D:/Final Fantasy; compare the recorded sha256 with D:/Tools/pyrefly-art-backup/candidates/2026-10-04/trapped-white/install-ready.
- Evidence: critic/rounds/round-23/scratch/verify-approved.txt; va-detail.mjs; va-detail2.mjs; ll.py; cmp.py
- Confidence: high
- Requirement: RUBRIC section 2, approved artwork is protected
- Where: public/art in D:/Final Fantasy (gitignored)
- Smallest fix: Copy the approved install-ready files into the shared tree (or always verify against the release tree) so a build cut from the shared tree cannot ship stale approved art.
- Acceptance check: verify-approved on the tree the next release is cut from: 0 mismatched, 0 missing.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 33. PR-0348 [polish, feel] PR-0348 (critic tooling, re-observed): the Ch VI route idles about 3 minutes at turns 12 to 16 inside Rikku's White Magic submenu while ordering a Potion; round 22's R22-FEEL-05 was this route stall, not a game stall

- Game / chapter: FFX-2 / Ch VI Leblanc; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The route cancels back and chooses the Item row, or records a stall with the menu it was in.
- Observed: turn-log turns 12-16 of ffx2-leblanc-win are 'idle' with target 'no target cursor', 36 s apart, with the route's menu rows showing White Magic (Pray, Vigor, Shell...) for the Potion order; the sixth try at 235 s succeeds. The fight then won in 592 s. No game lock was shown.
- Repro: Ch VI seed 1 route; turn-log.json turns 12-17.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/evidence/ffx2-leblanc-win/turn-log.json; run.json misses[0]
- Confidence: medium (the route, not the engine, is shown; a capture of the menu state would prove it)
- Requirement: CHECKS CHK-016
- Where: critic/runner/lib/route.mjs (not traced)
- Smallest fix: Critic route: after 'no target cursor' press Back twice and re-enter the Item list; count the retry as a miss.
- Acceptance check: Ch VI route without an 'idle' turn longer than 15 s.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 34. PR-0395 [polish, delivery] PR-0395 (carried, widened; merges R23-DELIV-01 and R23-PD-03, low confidence): FFX-2 chapters carry 1.05 to 1.92 percent of battle frames over 34 ms (FFX 0.05 to 0.26), and the 39.1 upload-stall fix is visible in Ch I, Anima and Trema (worst frame 533 to 114 ms, 455 to 100, 461 to 161) but not in FFX-2 generally (Vegnagun worst frame 474 to 580 ms; Fallen Aeons 0.62 to 1.05 percent)

- Game / chapter: FFX-2 / Ch IV, V, XI, XIII, XVI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A measured gain after 'upload stalls fixed' in every chapter, or the cause named.
- Observed: Slow frames per chapter: Ixion 1.79 percent, Trema 1.66, Bahamut 1.25, Vegnagun 1.25, Fallen Aeons 1.05 (round 22: 0.62), against 0.05-0.26 percent in the FFX chapters; worst frame 580 ms in Ch V (round 22: 474 ms) while Ch I's worst fell 533 to 114 ms. Maximum frame time is lower in 8 chapters and higher in 9. Serial continuity set, 1600x900, RTX 5070 Ti: IV 1.35, V 1.28, XI 1.09, XIII 1.77, XVI 1.92 percent; all FFX chapters 0.09 to 0.24; VI 0.14, XV 0.09; whole set 0.59 percent (round 22: 0.40; IV 1.15, V 1.04, XIII 1.52 then). Worst single frame: Vegnagun 580 ms (round 22 474), Sin Fins 343, Braska 234; Flux fell from 533 to 114 ms, Anima 455 to 100, Trema 461 to 161. Average fps 59.3 to 60 everywhere.
- Repro: Run the continuity harness on Ch IV and Ch V and read probe.slowFrames and maxDtMs.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/continuity.json (probe)
- Confidence: low (host load differs between rounds; belongs to the delivery auditor)
- Requirement: RUBRIC category delivery: stable frame times
- Where: src/engine/TextureStager.ts (suspected, not traced)
- Smallest fix: Compare the FFX-2 texture uploads with Ch I's fix.
- Acceptance check: FFX-2 chapters under 0.5 percent slow frames on the same host.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 35. PR-0381 [polish, feel] PR-0381 (carried, widened by the fan): camera framing: Ch VII framing alternation (round 22), and in this round the fan saw Vegnagun fill the screen with the three girls as dots in the corner during the tail action (Ch V), Rikku at the very bottom edge in the Macalania victory pose (swap-383), and Ormi and Rikku jumping to a different scale in Ch VI (jerk-000, jerk-001)

- Game / chapter: both / Ch V, VI, VII; status open; build 72973096 (bundle CECt6LNe)
- Expected: A dressphere change is staged and recorded as a costume swap (CHK-026 item 7); if it is not staged, it is a snap.
- Observed: Fan breakers (rated major by the fan): Ch V seq-action-playing frames 1 to 10 (party tiny against the Vegnagun tail), Ch VII swap-383-rikku-idle-victory (Rikku at the frame bottom), Ch VI jerk-000-ormi and jerk-001-rikku (a change of scale in one frame). The harness counts 1,157 camera cuts or whips in 9,949 s (7.0 a minute), a cut per action by design, so a cut is not the defect; a framing that loses the party is. Round 22's Ch VII alternation was not re-seen in the strips and captures read.
- Repro: Ch V seed 3 tail action (seq-action-playing); Ch VII victory pose; Ch VI Rikku close-up.
- Evidence: critic/rounds/round-23/scratch/crit-fan/ffx2-vegnagun-shuyin-seq-action-playing.jpg,critic/rounds/round-23/continuity/seymour-anima-macalania-win-r23/continuity/strips/swap-383-rikku-idle-victory.jpg,critic/rounds/round-23/continuity/ffx2-leblanc-win-r23/continuity/strips/jerk-001-rikku.jpg
- Confidence: medium
- Requirement: RUBRIC feel (coherent camera); camera grammar D-316/D-317
- Where: not traced
- Smallest fix: Frame the party with the boss when a boss move plays (keep the boss and the target inside the safe area); do not close on a victory pose below the HUD line.
- Acceptance check: Ch V tail action and Ch VII victory: all three girls fill at least the lower-left quarter, nothing at the frame edge.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24 (fan): the letterbox bars at the Ch I heal cut-in grow and shrink while the picture re-zooms.

### 36. PR-0418 [polish, feel] PR-0418 (new, fan, FFX only): one frame of a figure drawn as a gold or black-and-white negative of itself at a pose swap in the middle of an attack or flash (Seymour Natus, Auron in Sin Face, Tidus in Ch I)

- Game / chapter: FFX only / Ch I, X, XVIII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: No single-frame inversion.
- Observed: seymour-natus jerk-002-seymour-natus (one gold negative frame), sin-face jerk-004-auron (one inverted black-and-white frame), seymour-flux jerk-013-tidus (figure dark for a frame at the swap). 3 seen by the fan in about 120 of 340 strips.
- Repro: Strips named; real keys, seed 1, Ch I, X, XVIII.
- Evidence: critic/rounds/round-23/continuity/seymour-natus-win-r23/continuity/strips/jerk-002-seymour-natus.jpg,critic/rounds/round-23/continuity/sin-face-win-r23/continuity/strips/jerk-004-auron.jpg,critic/rounds/round-23/continuity/seymour-flux-win-r23/continuity/strips/jerk-013-tidus.jpg
- Confidence: medium (strip frames, a single frame each; may be an intended flash layer)
- Requirement: CHK-027 (flicker), first-time-fan lens D-423
- Where: not traced
- Smallest fix: Find which layer draws the negative (suspected: a flash or bloom pass on the swap frame) and hold the blend on that frame.
- Acceptance check: The three strips show no inverted frame.
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 37. PR-0419 [polish, feel] PR-0419 (new, fan, low confidence): the party arrives as faint see-through ghosts for the first frames of a battle seam before turning solid (Ch VI, III, XI seam 2) and a figure pops in beside another (Tidus beside Rikku, Ch VII jerk-002)

- Game / chapter: both / Ch III, VI, VII, XI; status open; build 72973096 (bundle CECt6LNe)
- Expected: A deliberate fade-in or a solid first frame.
- Observed: The capture owner's seq-seam-2 sequences of ffx2-leblanc, braskas-final-aeon and ffx2-fallen-aeons: frame 1 shows the party as faint ghosts; seymour-anima jerk-002-rikku: Tidus appears at the swap frame.
- Repro: seq-seam-2 folders; Ch VII jerk-002-rikku.
- Evidence: critic/rounds/round-23/scratch/crit-fan/leblanc-seam2.jpg,critic/rounds/round-23/scratch/crit-fan/braska-seam2.jpg,critic/rounds/round-23/scratch/crit-fan/fallen-seam2.jpg
- Confidence: low (may be the intended entrance fade)
- Requirement: CHK-027 popping; first-time-fan lens
- Where: not traced
- Smallest fix: Say whether the entrance fade is designed; if not, load the party before the plate lifts.
- Acceptance check: Seam sequences frame 1 show solid figures or a labelled fade.
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: RE-OBSERVED round 24 (fan): the party shows as faint ghosts at the Ch VI seams 2 and 3 before turning solid. Evidence: evidence/ffx2-leblanc-win/seq-seam-2/f00.jpg.

### 38. PR-0420 [polish, visual] PR-0420 (new, fan, low confidence, FFX-2 only): the FFX-2 hurt and KO paintings read as a different outfit to the idle, ready and cast paintings (Yuna white coat when hurt against white mage robe standing; Rikku pale and blonde hurt against dark armour ready)

- Game / chapter: FFX-2 only / Ch V, VI, XI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: One costume per dressphere across its poses; a change of dressphere is a staged Change.
- Observed: swap-1085-yuna-hurt-ko, swap-1109-yuna-ko-idle, swap-1132-rikku-hurt-cast, swap-1175-rikku-idle-hurt (Ch V), swap-400-rikku-ready-hurt, ghost-291-rikku-hurt-idle (Ch XI), jerk-001-rikku (Ch VI). The chief read swap-1085 (Yuna in white robe standing, a lying figure in a white coat after the cut) and swap-1175 (Rikku in dark armour under a bloom flash): the difference is not established from the strips, because the dressphere at the swap is not shown and some are costume swaps the check excludes.
- Repro: Ch V seed 3: Yuna hurt to KO; Rikku hurt to cast.
- Evidence: critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/strips/swap-1085-yuna-hurt-ko.jpg,critic/rounds/round-23/continuity/ffx2-vegnagun-shuyin-win-r23/continuity/strips/swap-1175-rikku-idle-hurt.jpg,critic/rounds/round-23/continuity/ffx2-fallen-aeons-win-r23/continuity/strips/swap-400-rikku-ready-hurt.jpg
- Confidence: low (a harness-level question: which dressphere was active at each swap)
- Requirement: RUBRIC visual (costume consistency); approved art is protected, so this is a question about which painting plays, never a replacement
- Where: src/data/art pose tables (suspected, not traced)
- Smallest fix: Print the active dressphere on each strip and compare the hurt and KO paintings with the idle of the same dressphere; fix only a wrong pairing in the pose table.
- Acceptance check: Strips for hurt, KO and idle of one dressphere show one costume.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 39. PR-0382 [polish, visual] PR-0382 (DOWNGRADED from major, narrowed): Ch XII first menu no longer heaps the party; an attack playing behind another party member (Ch I, X) and Yuna or Auron hidden behind Wakka or ice spires are still seen by the fan

- Game / chapter: FFX / XII (worst), I, X; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Each party member reads as a separate figure in its own slot, as in the approved battle targets.
- Observed: Interface and visual auditors: Ch XII party spread in the first menu (not reproduced). Not re-checked: attacks playing behind another member in Ch I and X. Fan: Yuna in front of Tidus and Auron behind Wakka's body (braskas swap-984, omnis swap-772), Yuna behind ice spires (anima swap-007, swap-008).
- Repro: Live, seed 1, 1600x900, real keys: Chapter XII, the 23-midfight capture; Chapter I, Auron's attack (strip ghost-386).
- Evidence: critic/rounds/round-22/evidence/seymour-omnis-win/23-midfight.png,critic/rounds/round-22/continuity/seymour-flux-win-r22/continuity/strips/ghost-386-auron-attack-follow.jpg,critic/rounds/round-22/continuity/seymour-natus-win-r22/continuity/strips/ghost-208-tidus-attack-follow.jpg
- Confidence: medium (seen in single frames; formation versus transient not separated)
- Requirement: RUBRIC 6 visual (staging, composition); approved battle targets
- Where: suspected: Ch XII formation slots or the attack travel path (targeting, formation and camera changed in release 39); not traced
- Smallest fix: Measure the three slot positions in Ch XII at the first menu and during an attack; if the formation overlaps, spread the slots; if the attacker travels across allies, route the travel in front.
- Acceptance check: Ch XII first menu and mid-action captures at 1600x900 and 2560x1440: party figures overlap by under 15 percent of the smaller figure's box.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Downgraded because the case that made it major (the Ch XII heap in front of the discs) is repaired and live-seen in four chapters; the remainder is occlusion by design of the painted staging, a polish question.

### 40. PR-0401 [polish, visual] PR-0401 (new): a Yu Pagoda appears out of a white flash with no fade (Ch III) and Overdrive Sin is absent for three frames and then pops in (Ch XVIII)

- Game / chapter: FFX / III, XVIII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: An entrance fades or is covered by a deliberate beat.
- Observed: Strip jerk-005-yu-pagoda-right shows the pagoda present after a flash with no fade-in; strip jerk-000-overdrive-sin shows frames -6 to -4 with no Sin, then Sin's head in place.
- Repro: Live, seed 1, 1600x900: Chapter III (link 3), Chapter XVIII battle start.
- Evidence: critic/rounds/round-22/continuity/braskas-final-aeon-win-r22/continuity/strips/jerk-005-yu-pagoda-right.jpg,critic/rounds/round-22/continuity/sin-face-win-r22/continuity/strips/jerk-000-overdrive-sin.jpg
- Confidence: medium
- Requirement: CHK-027 (popping); RUBRIC 6 feel
- Smallest fix: Fade the pagoda in under the flash tail; hold the battle reveal until Sin's painting is decoded.
- Acceptance check: Strips at those two moments show a fade or no empty frames.
- Note: Carried from round 23, not re-observed in round 24.

### 41. PR-0402 [polish, feel] PR-0402 (new): two boss physical attacks land from across the field (Braska's Left-Arm Strike on Yuna for 2,402; Paragon on Yuna for 1,561) with no travel or reach

- Game / chapter: both / III (FFX), XIII (FFX-2); status open; build 72973096 (bundle CECt6LNe)
- Expected: A physical strike reads as reaching its target (a lunge, a projectile or a cut to contact).
- Observed: Timed sequences show the damage numeral on Yuna while the boss stays on its side of the field.
- Repro: Live, seed 1: Chapter III seq-action-playing f00; Chapter XIII seq-action-playing f03-f05.
- Evidence: critic/rounds/round-22/evidence/braskas-final-aeon-win/seq-action-playing/f00.jpg,critic/rounds/round-22/evidence/ffx2-trema-win/seq-action-playing
- Confidence: medium (stills at 250 ms; no continuous clip)
- Requirement: RUBRIC 6 feel (action and reaction timing)
- Smallest fix: Give large-boss physical moves a reach beat (lunge or contact cut); release 39 already did this for the party's strike on Braska.
- Acceptance check: A clip of each move shows contact before the numeral.
- Note: RE-OBSERVED round 24 (fan): Vegnagun's tail beam and flash happen at the tip next to the party while head and tail stay still; Ormi's Shield Bash numbers (194, 192, 207) float at three places. Evidence: evidence/ffx2-vegnagun-shuyin-win/seq-transition-into-battle/f06-f08.jpg, ffx2-leblanc-win/seq-spherechange/f06-f09.jpg.

### 42. PR-0390 [polish, narrative] PR-0390 (re-observed and widened, FFX-2 only): Ch XIII and XV open in third person, and Ch XVI mixes third-person captions with Yuna's first-person narration

- Game / chapter: FFX-2 / Ch XIII, XV, XVI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: FFX-2 chapters are narrated in Yuna's voice (writing bible line 512).
- Observed: Ch XIII opens 'Under Bevelle, a dungeon goes down a hundred floors.'; Ch XV 'Ten old spheres. Paine's recordings, every one.'; Ch XVI has both 'At the top of the stairs, the aeon turns on them.' (third person, speaker blank) and 'I fell a long way.' (Yuna).
- Repro: Ch XIII, XV and XVI pre-battle and post-battle scenes.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/evidence/ffx2-ixion-djose-win/run.json (dboxTimeline 3, 8, 10); ffx2-den-of-woe-win-r2/run.json (0-3); ffx2-trema-win-r4/run.json (0-3)
- Confidence: high
- Requirement: research/writing-bible.md line 512
- Where: src/story/scripts/ffx2-trema.ts, ffx2-den-of-woe.ts, ffx2-ixion-djose.ts
- Smallest fix: Put the captions into Yuna's first person, or mark them as stage text.
- Acceptance check: No unattributed third-person line in FFX-2 openers.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 43. PR-0262 [polish, narrative] PR-0262 (carried, widened with PR-0255 and PR-0254 re-observed): the results quip "...Okay. Next one." is the first quip in five chapters; Tromell's five Ch VII lines have no speaker; Ch VII Talk is silent

- Game / chapter: both / Ch I, II, VIII, XVII, XVIII (quip); Ch VII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Distinct quips; every spoken line attributed.
- Observed: '...Okay. Next one.' is the first quip in five chapters; Ch VII aftermath lines 40, 41, 43, 44, 46 have speaker ''; Talk in Ch VII still silent (not re-played).
- Repro: Ch I, II, VIII results text; Ch VII dboxTimeline 40-46.
- Evidence: D:/Final Fantasy/critic/rounds/round-23/evidence/seymour-anima-macalania-win/run.json; resultsText of seymour-flux-win and yunalesca-win-r2
- Confidence: high
- Requirement: writing bible 5.4
- Where: src/story/scripts/seymour-anima-macalania.ts say('none', ...) lines 248-261
- Smallest fix: Vary the quip bank per chapter; give Tromell a name and role.
- Acceptance check: No quip repeated across five chapters; every line has a speaker.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 44. PR-0255 [polish, narrative] PR-0255 (carried, re-observed): Tromell's five Chapter VII aftermath lines have speaker ''

- Game / chapter: FFX only / Ch VII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A named speaker (Tromell) or an intentional crowd tag.
- Observed: dbox lines 42-48 of seymour-anima-macalania-win: 'Step away from Lord Seymour, Lady Summoner.', 'You will not put hands on him again.', 'He will be cared for. By his own people.', 'And this. This was never yours.', 'Traitors, all of you. It will be announced.' with an empty speaker.
- Repro: critic/rounds/round-21/evidence/seymour-anima-macalania-win/run.json dboxTimeline.
- Evidence: critic/rounds/round-21/feel-narr/dbox21-all.txt
- Confidence: high
- Requirement: writing-bible voice
- Smallest fix: Set the speaker in the Chapter VII script.
- Acceptance check: No empty-speaker line in the Chapter VII aftermath.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Re-observed: speaker '' on Tromell's five lines (src/story/scripts/seymour-anima-macalania.ts lines 248-261).

### 45. PR-0254 [polish, narrative] PR-0254 (carried, STALLED): Chapter VII Talk is still silent

- Game / chapter: FFX / VII act one, Tidus Talk (fight ms 4304) and Yuna Talk (22350); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A Tidus line and Seymour's reply within 3 s of each Talk.
- Observed: The dboxTimeline has no line near either Talk. The first battle line is Yuna's 'An aeon. He is summoning an aeon.' src/story is unchanged since round 17.
- Repro: Ch VII seed 1, 1600x900, real keys, the route's Talk on turns 1 and 5.
- Evidence: critic/rounds/round-18/feel-narr/dbox-all.txt; critic/rounds/round-18/evidence/seymour-anima-macalania-win/run.json picks
- Confidence: high
- Requirement: narrative: banter and reachable character voice
- Smallest fix: Add mac-talk-tidus and mac-talk-yuna mid triggers (ability 'talk', once), following Ch X.
- Acceptance check: The Ch VII seed-1 dboxTimeline shows a Tidus line and a Seymour reply within 3 s of Tidus's Talk, and the same for Yuna.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 46. PR-0257 [polish, encounter] PR-0257 (carried): the Chapter III possessed-aeon gauntlet is about 2.3x longer than the sourced rows (204 and 220 real-key turns this round)

- Game / chapter: FFX / Ch III Braska's Final Aeon; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Length near the sourced rows.
- Observed: Ch III won by real keys on seed 3 in about 261 to 289 turns and 30:47 of play; seeds 1 and 2 stalled at the 15 and 25 minute budgets (the fight is 244+ turns, 2.3 times the sourced rows). Not a lock.
- Repro: critic/rounds/round-21/evidence/braskas-final-aeon-win-long*/run.json
- Evidence: critic/rounds/round-21/evidence/braskas-final-aeon-win-long/run.json
- Confidence: high
- Requirement: RUBRIC 6 encounter
- Where: src/data/chapter-braska.ts
- Smallest fix: Bailey's call on the gauntlet's length.
- Acceptance check: Real-key turn count near the sourced total.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Re-observed: link 1 alone took 125 real-key turns and the 700 s budget; engine intended 39 of 40.

### 47. PR-0326 [polish, audio] The first UI sounds of a cold session are the procedural synth (PR-0326, fourth consecutive review)

- Game / chapter: both / title, board, Ch I to XVIII (first seconds of a session); status open; build 72973096 (bundle CECt6LNe)
- Observed: On a fresh profile the first logged effect is the synth path in 53 of 63 runs (sfxLog[0] cursor-move or confirm); 216 synth entries in all (cursor-move 181, confirm 25, menu-page 4, cancel 4, wind-high-altitude 2); the recorded sprite or v2 bank takes over from 2.2 to 34.2 s (median 2.7 s; latest synth entries at 16.4, 15.2, 15.1 and 13.8 s in four loaded runs). 'battle-start' (TitleScreen.ts line 203, void audio.playSfxFromSprite('battle-start')) appears in 0 of 63 sfxLogs, so the title's press-start cue is silent. Round 22 measured 34 of 39 and 0 of 39; the pattern is unchanged by 39.1 (the audio code is byte-identical).
- Repro: Fresh profile, headless Chromium PYREFLY_BROWSER=gpu, https://echoesofspira.com/, press Enter at the title (real key), then move the board cursor; read the AudioManager debug sfxLog; e.g. critic/rounds/round-23/evidence/seymour-flux-win/audio-debug.jsonl, last row: first entries 'confirm' via sprite at 2.5 s then v2 at 6.2 s; critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl has synth entries up to 16.4 s. No seed involved.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/audio-debug.jsonl; critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl; critic/rounds/round-22/evidence/seymour-flux-lose/audio-debug.jsonl
- Confidence: high for the pattern, medium for the cause (not traced)
- Requirement: CHK-001 step 3 (nothing falls back to the synth path), CHK-023
- Where: src/app/screens/TitleScreen.ts:203; src/audio/AudioManager.ts around line 524 (suspected, not traced at run time)
- Smallest fix: Smallest probe first, no product change yet: on a quiet host log the return value and branch taken by AudioManager.playSfxFromSprite('battle-start') (ctx null, no manifest sfx, sprite not decoded within waitMs, or no slice). Then either warm the SFX sprite decode at boot or gate the first UI sounds on it.
- Acceptance check: On 20 fresh-profile runs the first logged effect is via sprite or v2 in at least 19, and 'battle-start' appears in sfxLog after the title Enter.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: RE-OBSERVED round 24 (fifth consecutive review): in all 8 runs the first 1 to 9 UI sounds at 2.3 to 5.4 s after load are logged "via synth"; the sprite first appears at 3.1 to 9.4 s. Evidence: evidence/*/audio-debug.jsonl sfxLog.

### 48. PR-0373 [polish, audio] Music cues are fetched at the moment of use: the scene cue is not playing at the first line in 5 of 55 non-Ch-I runs (PR-0373)

- Game / chapter: both / II, III, V, XIII (retry runs); victory jingle in all chapters; status open; build 72973096 (bundle CECt6LNe)
- Observed: At the pre-scene sample the chapter's scene cue was not yet playing in 5 of 55 non-Ch-I runs: yunalesca-win-r2, ffx2-vegnagun-shuyin-win-r3 and ffx2-trema-win-r2 still on chapter-select, braskas-final-aeon-win-r2 and ffx2-trema-win-r3 on no music; in each the scene track reads cached false at that moment (a late fetch and decode, with the first spoken line already on screen). Also victory-ffx or victory-ffx2 is not cached at the after-fight sample in about 70 of 75 post-fight samples (the cue is requested only at the results screen), so the jingle's start can lag; at the results sample the right victory cue was playing in 24 of 24 won fights, so the lag, if any, was not measured. All five late-scene runs were second-or-later seed runs of a chapter, so load on the capture host is a candidate cause (round 22 saw 1 of 39 plus Ch IV 2 of 3).
- Repro: critic/rounds/round-23/evidence/yunalesca-win-r2/audio-debug.jsonl row pre-scene (15 s: playing chapter-select, scene-zanarkand-dome cached false); compare yunalesca-win-pm (pre-scene: scene-zanarkand-dome). Seeds in run.json.
- Evidence: critic/rounds/round-23/evidence/yunalesca-win-r2/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-vegnagun-shuyin-win-r3/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-trema-win-r2/audio-debug.jsonl; critic/rounds/round-23/evidence/braskas-final-aeon-win-r2/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-trema-win-r3/audio-debug.jsonl
- Confidence: medium (the late scene cue is observed 5 times; the victory-jingle lag is inferred from cached false and not measured; low load dependence untested)
- Requirement: CHK-023 (the right cue at the real moment, no silent unintended gap); RUBRIC section 6 audio (phase transitions)
- Where: src/audio/MusicLoader.ts and the board confirm path (suspected, not traced)
- Smallest fix: Warm the chapter's scene and boss cues and its victory cue when the player confirms the chapter on the board (the cue list is the chapter's musicKeys), so the first line and the jingle never wait on a fetch.
- Acceptance check: On 20 runs with the chapter chosen by real input, the scene cue is playing at the first line in 20 of 20 and the victory cue is cached before the after-fight sample.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: RE-OBSERVED round 24: in a cold session the title cue plays only about 6 s after the first gesture (cue fetched on use). Evidence: evidence/gaps/title-audio/title-audio.json.

### 49. PR-0386 [polish, onboarding] PR-0386 (carried, unrepaired): the board's first card says 'Click its picture to begin' to keyboard and pad players

- Game / chapter: both / board (all); status open; build 72973096 (bundle CECt6LNe)
- Expected: Device-aware copy: 'Press Enter to begin' (keyboard), the pad's confirm glyph, 'Tap its picture' (touch).
- Observed: Auron's board card reads 'Click its picture to begin. The others wait on the board.' in 61 of 63 runs (keyboard and virtual pad); only the touch runs say 'Tap'. The card also covers chapter rows VII to XII and part of the location panel while the footer already says ENTER BEGIN / CROSS BEGIN.
- Repro: Fresh profile, headless Chromium 1600x900, seed 1, press Enter from the title to the board; screenshot 03-card. Pad: same with the virtual pad shim.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/03-card.png; run.json dossier in seymour-flux-win-pad
- Confidence: high (seen in 61 runs)
- Requirement: Onboarding teaches with the device's own controls; CHK-015
- Where: chapter select first-run coach, step 1 of 3
- Smallest fix: Pick the sentence by last input device as the touch build already does; move the coach card clear of the rows.
- Acceptance check: dossier text contains no 'Click' under keyboard or pad, and the card box does not intersect the chapter list
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24: the chapter-select coach says "Click its picture to begin" while the footer says ENTER BEGIN and the coach plate is translucent over rows VII to XI; the Ch I battle coach "He moves after you. Not before. Use it." never says what "it" is. Evidence: evidence/seymour-flux-win/03-card.png, 12-intent-E.png.

### 50. PR-0411 [polish, onboarding] PR-0411 (new; merges R23-ON-01 and the capture owner's pad-B item): party prep and its coach print keyboard words to a pad player, and pad B on the first party prep leaves the screen while keyboard Esc only skips the guide

- Game / chapter: both (confirmed in Ch I) / party prep; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Prep hint strip and coach name the pad's buttons; one button skips the guide or the label says what B does.
- Observed: With the virtual pad, party prep prints 'ENTER BEGINS THE BATTLE', 'ESC BACK' and the coach 'ESC SKIP THE GUIDE', while the board footer ('CROSS BEGIN', 'CIRCLE BACK'), pre-scene hints ('HOLD CROSS SKIP') and the battle HUD are pad-aware. B on prep goes straight back to the board and does not skip the guide, although the coach says Esc skips it (keyboard Esc skips the coach and stays on prep). Fresh profile, Ch I party prep, the footer reads 'ESC SKIP THE GUIDE'. Keyboard Esc stays on party-prep (the first Esc skips the guide, the second goes back). Pad B (button 1) goes straight back to chapter-select and a second B goes to the title. A pad player has no way to skip the guide.
- Repro: Virtual pad, fresh profile, Cross from the title to the board, Cross on the Ch I card, screenshot party prep; press B.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win-pad/04-prep.png; critic/rounds/round-23/scratch/prepesc-pad.png; index.json entry 'CHK-015 party prep B on the virtual pad: goes back to chapter-select (no coach skip)',critic/rounds/round-23/scratch/prepesc-keyboard.png, prepesc-pad.png
- Confidence: high
- Requirement: CHK-015, CHK-020, onboarding device usability
- Where: party prep hint strip and coach card
- Smallest fix: Reuse the pad glyph table the board footer already uses for the prep hint strip and the coach footer; decide whether B skips the guide or goes back and label it.
- Acceptance check: with a pad shim, the prep screen text contains no ENTER or ESC and the coach names a pad button
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 51. PR-0356 [polish, interface] PR-0356 (carried, re-measured): pause section headers, the 'H PAINTING ONLY' hint and the title tagline are low contrast

- Game / chapter: both / pause, title; status open; build 72973096 (bundle CECt6LNe)
- Expected: At least 3 : 1 against the darkest and lightest part of the plate behind the label.
- Observed: Sampled from rendered pixels: pause headers BATTLE STATS 2.3 : 1, IN THIS FIGHT 2.5 : 1, THIS ENCOUNTER 2.5 : 1, SETTINGS 2.3 : 1, the ECHOES OF SPIRA header 1.9 : 1, 'H PAINTING ONLY' 2.7 : 1, the title's vertical 'FINAL FANTASY X AND X-2' about 1.9 : 1 (approximate: 98th percentile text against median background).
- Repro: Esc from the first menu in Ch I at 1600x900; sample pause-open.png.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-pausekeys/pause-open.png; critic/rounds/round-23/evidence/seymour-flux-win/00-title.png
- Confidence: medium (pixel sampling, not a DOM colour read)
- Requirement: CHK-003, RUBRIC section 5 effective contrast
- Where: pause tab content labels and hint
- Smallest fix: Lift the section-label and hint tokens to a 3:1 floor against a worst-case plate region.
- Acceptance check: sampled contrast of each label at least 3.0 over 3 plates
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24 (widened): results sub-lines (S.LV / AP, dressphere AP) 10 to 11 px ink at about 3.9:1 (Victory) and 3.0:1 (Defeat), the prep key strip and pause stat labels about 11 to 12 px, the gold "YOUR TURN . CTB 1 OF 3" caption on the cream cut-in nearly lost; measured from 1600x900 pixels (CHK-003 FAIL). Evidence: evidence/seymour-flux-win/31-results.png, yunalesca-win/31-results.png, seymour-flux-win/04-prep.png, 14-pause-Esc.png.

### 52. PR-0387 [polish, interface] PR-0387 (carried): the cleared-tile best-time ribbon on the board is clipped

- Game / chapter: both / board; status open; build 72973096 (bundle CECt6LNe)
- Expected: The whole time is readable.
- Observed: On a cleared row the small rotated ribbon reads '8:11' cut at the row's right edge; r22 saw '8:0' and '5:4'.
- Repro: Win Ch I, return to the board, screenshot 34-board-after.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/34-board-after.png
- Confidence: high
- Requirement: CHK-009
- Where: chapter list row ribbon
- Smallest fix: Re-seat the ribbon text so its right edge clears the clip.
- Acceptance check: ribbon scrollWidth <= clientWidth for 9:59 at 1280 and 3840
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24: the rotated "21:12" best-time ribbon is cut by the row edge on the selected row (Ch V board).

### 53. PR-0354 [polish, interface] PR-0354 (carried): the intent card says 'Deals no damage' above damage rows

- Game / chapter: FFX / Ch IX, XII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: No 'Deals no damage' line when the ability has damage rows, or the rows are labelled as the spell's effect.
- Observed: Ch IX Yojimbo (Daigoro) and Ch XII Omnis (Mortiphasm Spells) show 'Deals no damage.' followed by a DAMAGE table (Lulu 544-615, Tidus 2,066-2,333); 5 of 5 runs.
- Repro: Ch IX or XII first menu, press E; read intentText.
- Evidence: critic/rounds/round-23/evidence/yojimbo-cavern-win/run.json; critic/rounds/round-23/evidence/seymour-omnis-win/run.json
- Confidence: high
- Requirement: honest enemy intent
- Where: enemy intent card
- Smallest fix: Suppress the line when damage rows exist (suspected: describeAbility in src/battle/ffx/intent.ts, untraced).
- Acceptance check: no intent text contains both 'Deals no damage' and a damage row in any chapter
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 54. PR-0372 [polish, interface] PR-0372 / PR-0321 (carried, re-observed): phone pause OPTIONS clips its tabs and shows 4 of 10 settings, text under 14 px

- Game / chapter: both / Ch IV (and the same pause in Ch I); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Tabs fit or scroll visibly; accessibility settings reachable without hunting.
- Observed: At 390x844 (Ch IV) the tab strip is cut at both edges ('ER GUIDE OPTIONS CONTROLS'), the 'ECHOES OF SPIRA - FINAL FANTASY X-2' header wraps over the tabs, and the SETTINGS list is a short scroll box showing MASTER VOLUME to a half-cut TEXT SPEED with no scroll cue. Gap pass with real touch events in Ch IV: the list scrolls (scrollTop 65, 130, 153) and TEXT SIZE and REDUCE MOTION come into view; tapping TEXT SIZE cycles 100 to 115 percent; the window is 100 px of 217 to 253 px, about four rows.
- Repro: 390x844 touch emulation, FFX-2 Ch IV, open pause, Options tab.
- Evidence: critic/rounds/round-23/evidence/ffx2-bahamut-win-touch/14-pause-options.png
- Confidence: high (emulation, no real phone)
- Requirement: CHK-003, onboarding device usability
- Where: pause OPTIONS on a phone
- Smallest fix: Show a scroll affordance, move TEXT SIZE and REDUCE MOTION first on the phone, wrap or scroll the tab strip.
- Acceptance check: at 390x844 every tab label is whole and all settings reachable by touch scroll with a visible cue
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 55. PR-0321 [polish, interface] PR-0321 (new; R19-IF-02 + capture owner): on a phone the pause, including the new EYE CANDY page, draws its text at 12-13 px, under the 14 px floor

- Game / chapter: both / any (pause > OPTIONS > EYE CANDY) at 390x844; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: CHK-003: no player text under 14 css px at 390x844.
- Observed: 34-35 nodes on the EYE CANDY page (labels, values, help, "Tap a row to flip it") at 12 px; the OPTIONS list at 12-13 px.
- Repro: 390x844 touch, any chapter: open the pause, OPTIONS, EYE CANDY; measure computed font sizes.
- Evidence: critic/rounds/round-19/evidence/ecfont2-seymour-flux-390x844-touch/run.json; critic/rounds/round-19/evidence/ecfont-ffx2-bahamut-390x844-touch/run.json; critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/17-ec-phone-notes.jpg
- Confidence: high
- Requirement: CHK-003
- Where: src/ui/common/pause-screen.css:824-825 (--pu-fs:12px; --pu-fs-v:13px, an authored phone exception)
- Smallest fix: Raise the phone tokens to 14/15 px and tighten letter-spacing on .pause__k, or record a written owner exception.
- Acceptance check: ecfont at 390x844 in both games: under14 empty, no clipping.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: The new page inherits the pre-existing phone pause floor; the capture owner filed it as minor/new, the interface auditor as a pre-existing exception. One issue.

### 56. PR-0412 [polish, interface] PR-0412 (new, FFX-2 only; R23-IF-01): the intent card stands over the enemies' upper bodies at the target step and over the Garment Grid in Ch VI at 1280x720 and 1600x900

- Game / chapter: FFX-2 / Ch VI Leblanc; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The card never covers a targetable enemy at the target step.
- Observed: At 1280x720 and 1600x900 the Fem-Goon intent card's lower edge covers Dr. Goon and Fem-Goon's upper bodies while the reticle is on them (and the 'ODDS' header and 'J HOLD' strip sit on a figure); at 2560x1080 it moves to the left and is clear.
- Repro: FFX-2 Ch VI, seed 1, first command menu, E, choose Attack; or open Change.
- Evidence: critic/rounds/round-23/evidence/ffx2-leblanc-win/16-target-single.png; ffx2-leblanc-win-1280/16-target-single.png; ffx2-leblanc-win/21-change-open.png
- Confidence: medium-high
- Requirement: CHK-008, PR-0249 family
- Where: intent card placement while targeting
- Smallest fix: Add the enemy quads to the intent card's placement test while targeting (as PR-0249 suggested for the party).
- Acceptance check: card box does not intersect any enemy quad at 1280, 1600, 2560 in Ch VI target and Change states
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 57. PR-0413 [polish, interface] PR-0413 (new, FFX-2 only, 21:9; R23-IF-02): the CHAIN counter lies over the advisor card at 2560x1080 at the target step in Ch VI

- Game / chapter: FFX-2 / Ch VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The chain counter and the card do not overlap.
- Observed: The 'CHAIN x1.45' box lies over the left half of the NEXT BEST MOVE card; only fragments ('N', 'G', 'LLS NO MP 100% TO HIT 3% CRIT') remain readable.
- Repro: FFX-2 Ch VI at 2560x1080, first menu, Attack, read the target step.
- Evidence: critic/rounds/round-23/evidence/ffx2-leblanc-win-2560/16-target-single.png
- Confidence: high for that state
- Requirement: CHK-008
- Where: chain counter versus advisor at ultrawide
- Smallest fix: Anchor the advisor card to the counter's right edge, or the counter below the card, at wide aspect ratios.
- Acceptance check: panel boxes disjoint at 2560x1080 in the chain-counter state
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 58. PR-0414 [polish, interface] PR-0414 (new, FFX-2 only, medium confidence; R23-IF-03): Ch VI mid-fight shows the guide's chips with no guide sheet at three sizes

- Game / chapter: FFX-2 (Ch IV midfight shows the sheet) / Ch VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Chips only when a sheet is shown; or the sheet stays.
- Observed: In 23-midfight at 1280, 1600 and 2560 the 'G HIDE GUIDE' and '[ ] SCROLL' chips are drawn but the guide sheet under them is absent (the sheet is present in the first-menu and seam captures of the same chapter).
- Repro: FFX-2 Ch VI, play three real commands, screenshot.
- Evidence: critic/rounds/round-23/evidence/ffx2-leblanc-win/23-midfight.png; ffx2-leblanc-win-1280/23-midfight.png; ffx2-leblanc-win-2560/23-midfight.png
- Confidence: medium (may be a fade state; three sizes agree)
- Requirement: CHK-006 overlay lifetime
- Where: strategy guide mid-fight
- Smallest fix: Hide the chips with the sheet, or find why the sheet is dropped at this link.
- Acceptance check: no chip is visible without its sheet in any state
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 59. PR-0330 [polish, interface] PR-0330 (carried, mostly repaired; residual widened by the capture owner): some advisor cards carry no or a one-word effect (Ch XVII "Close in", Ch VII Steal), and at 1280x720 in Ch I the advisor effect line and the guide are cut mid-line

- Game / chapter: FFX / Ch VII, XVII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A one-line effect for every suggestion.
- Observed: Ch XVII 'Close in' shows only name, 'IN ORDERS' and 'NO MP' with no effect sentence; Ch VII 'Steal' shows the effect line 'Steal'. Ellipsis is gone in Ch VII, XII and XVIII (repaired). Capture owner, Ch I first menu at 1280x720: the advisor card ends at "Speeds the party's turns up" with the effect line gone and the guide text cut after four lines; at 2560x1080 both show a further line. PR-0385 (the guide's scroll chip) is repaired and live-seen.
- Repro: Ch XVII and Ch VII first menu at 1600x900.
- Evidence: critic/rounds/round-23/evidence/sin-fins-core-win/11-advisor.png; seymour-anima-macalania-win/11-advisor.png,critic/rounds/round-23/evidence/seymour-flux-win-1280/11-advisor.png
- Confidence: high
- Requirement: advisor says what the move does
- Where: advisor card effect line
- Smallest fix: Author short effect lines for Orders and Steal.
- Acceptance check: every captured advisor card has an effect line
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 60. PR-0370 [polish, onboarding] PR-0370 (carried): a story box covers the guide and the first-run tip at the first menu in Ch XI and others

- Game / chapter: FFX-2 / Ch XI, XIII, XIV, XV; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The tip or box is deferred, not lost, and nothing covers the guide.
- Observed: In Ch XI a dialogue box covers the guide header at the first menu; the first-run tip was absent in Ch XI, XIII, XIV and XV primary runs.
- Repro: Fresh profile, Ch XI, first menu.
- Evidence: critic/rounds/round-23/evidence/ffx2-fallen-aeons-win/10-first-menu-coach.png
- Confidence: medium
- Requirement: onboarding reaches every first-time player
- Where: first menu
- Smallest fix: Hold the menu until the dialogue ends or move the box clear; show the tip afterwards.
- Acceptance check: tip visible within one turn on every chapter
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 61. PR-0252 [polish, interface] PR-0252 (carried, seen on a pad): the first-turn coach covers the command stack and two party figures

- Game / chapter: FFX / Ch I; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Coach clear of the commands and the party.
- Observed: Ch I pad run: the coach overlaps the commands by 3,384 px and hides Yuna and Kimahri; the keyboard coach sits lower and does not.
- Repro: Virtual pad, Ch I first menu.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win-pad/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-008
- Where: first-turn coach, pad layout
- Smallest fix: Add the command stack to coachActorAvoid for the pad layout.
- Acceptance check: overlaps [] in focFirst for the pad run
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 62. PR-0415 [polish, harness] PR-0415 (critic tooling, new; R23-HX-01): the Ch I 2000x1012 first-menu capture is asserted awaitingMenu but shows the hero cut-in transition, so that cell is not read as a layout

- Game / chapter: FFX / Ch I; status open; build 72973096 (bundle CECt6LNe)
- Expected: The capture waits for the cut-in to finish.
- Observed: seymour-flux-win-2000/10-first-menu-coach.png is asserted awaitingMenu=true but shows Tidus's close-in cut-in over the HUD, so no 2000x1012 Ch I first-menu layout was read.
- Repro: Route at 2000x1012, Ch I.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win-2000/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-016
- Where: critic/runner/lib/route.mjs snap
- Smallest fix: Wait for no cut-in layer before shooting.
- Acceptance check: no capture shows a cut-in overlay
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24: Ch I 10-first-menu-coach and 11-advisor show the Tidus turn cut-in, Ch IV 12-intent-E shows the card closed, Ch IV lose 33-retry-battle is a cut-in frame.

### 63. PR-0416 [polish, interface] PR-0416 (new, FFX only): at 2560x1440 the five element chips of the Mortibody card (FIRE, ICE, THUNDER, WATER, HOLY) overlap and GRAV wraps; at 2560x1080 the card is clean

- Game / chapter: FFX only / Ch X; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Chips readable without overlap
- Observed: In the Ch X first menu at 2560x1440 the five element chips FIRE, ICE, THUNDER, WATER and HOLY overlap each other and GRAV wraps to a second row. DOM read: every chip box is 61 px wide, so THUNDER (about 80 px) overflows into the next chip. At 2560x1080 the same card lays out cleanly.
- Repro: Live, seed 1, PYREFLY_BROWSER=gpu, 2560x1440: seymour-natus win route to the first menu, with the Mortibody card up. Persisted over 3 s.
- Evidence: critic/rounds/round-23/evidence/gaps/seymour-natus-win-hires-2560x1440/10-first-menu-coach.png, crop-mortibody-card.png, chips-2560x1440 run
- Confidence: high (DOM and image)
- Where: ffx-sensor__chips
- Smallest fix: Let chips size to their content (auto width with a gap) in .ffx-sensor__chips at 16:9 1440p.
- Acceptance check: Repeat at 2560x1440 and 2560x1080: no chip text intersects another.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 64. PR-0389 [polish, interface] PR-0389 (R39F-08, reused): at TEXT SIZE 115 and 130 the in-battle guide disappears in FFX-2 Ch IV and VI and G does nothing

- Game / chapter: FFX-2 / IV, VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A designed give-way tells the player where the guide went.
- Observed: Reused: the guide panel is 0x0 at 115 and 130 percent in Ch IV and VI, and G toggles a flag with nothing shown; the pause GUIDE tab still shows the page. Round 23 gap pass: TEXT SIZE 115 renders cleanly in Ch I and Ch IV and 130 in Ch I; at 130 in FFX-2 Ch IV the enemy-move card truncates names (YU..., RIKK...), wraps damage ranges and shows two of three girls (+2 MORE). The guide at 115 and 130 was shot but its overflow numbers were scroll-area false positives, so whether the guide still vanishes (the round 22 finding) is not re-established.
- Repro: Pause, OPTIONS, TEXT SIZE 130, back to the first menu, press G.
- Evidence: critic/reviews/c7135bec-focused/results/textsize-ffx2-bahamut-1600x900-130-pause.json (reused)
- Confidence: medium (reused evidence)
- Requirement: CHK-003, CHK-015
- Where: src/ui/common/StrategyGuide.ts (sgd--squeezed)
- Smallest fix: Show a one-line 'GUIDE: pause menu' chip while the sheet is squeezed.
- Acceptance check: At TEXT SIZE 115 and 130 in Ch IV and VI, G shows the guide or a chip that says where it went.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 65. PR-0363 [polish, interface] PR-0363 (new; R21-IF-04 + R21-FEEL-02, emulated pad only): a pad's Circle that resumes from the pause also cancels the menu level or the target cursor underneath, where keyboard P keeps both

- Game / chapter: both (pad Circle; FFX Ch I and FFX-2 Ch IV) / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Resume restores the exact state, as the keyboard does.
- Observed: Pause matrices: pad Circle resume from a Special submenu returns to the top row (rows 4 to 6) and from targeting returns with targets 0; keyboard P keeps both (rows 4, targets 2). FFX-2 pad White Magic: rows 7 to 3. Merged with R21-FEEL-02: FFX Flux pad matrix row 10, pause opened with Start while targeting (targets 2); Circle resumes with targets 0, where keyboard P resumes with targets 2. FFX-2 pad White Magic: rows 7 to 3. Emulated standard-mapping pad, not real hardware; one run each (the FFX matrix was shifted by PR-0362).
- Repro: seymour-flux-pausematrix-1600x900-pad cases 8, 10; ffx2-bahamut-pausematrix-1600x900-pad case 8.
- Evidence: critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900-pad/run.json; critic/rounds/round-21/evidence/ffx2-bahamut-pausematrix-1600x900-pad/run.json
- Confidence: medium-low
- Requirement: CHK-015, CHK-006
- Smallest fix: Consume the Circle edge in the pause handler so the menu does not also see it.
- Acceptance check: Pad matrix: after resume rows and targets equal their pre-pause values.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 66. PR-0251 [polish, interface] PR-0251 (carried, narrowed): battle labels keep the 14 px floor at 1600x900 (advisor 14.2 px minimum), but the strategy guide's labels draw at 11.4 px at 1280x720 and 9.1 px at 1024x768 (R39F-05, reused)

- Game / chapter: both / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: 14 px floor on desktop.
- Observed: 1600x900: FFX 12.25 px (OD, Overdrive, key labels), colour-order note 12 px; FFX-2 command-info label 11.68 px, max-HP/MP numbers 12.5 px; dialogue role chip 8.51 px. 2000x1012: 13.77 px (FFX), 13.13 px (FFX-2). 1440x900: 11.03 px; 1024x768: 7.84 px with 27 distinct elements under 14. 2560 and 4K pass (14 px).
- Repro: textSweep fields of the first-menu runs.
- Evidence: critic/rounds/round-21/audit-if1.tmp.mjs output; evidence/seymour-flux-first-1024x768/run.json
- Confidence: high
- Requirement: CHK-003
- Smallest fix: Raise the HUD key labels and label classes to a floor in CSS.
- Acceptance check: textSweep minEffPx >= 14 at 1600x900 and 2000x1012.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 67. PR-0259 [polish, delivery] PR-0259 (carried, sixth review, widened; merges R23-PD-04 and keeps PR-0394 and PR-0404): load time is unmeasured and a session requests 62 to 231 MiB at 1600x900 (median 138; round 22 median 119) and 337 MiB at 2560x1080 Ch X; the CHK-017 five-second clause stays UNVERIFIED

- Game / chapter: both / all; measured at the board and in ch I, IV, V, III, X; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A measured load under five seconds on named hardware, network and cache conditions (RUBRIC section 2).
- Observed: No cold-cache, throttled, weaker-GPU, non-Chromium or phone timing was captured, so first load under five seconds is UNVERIFIED for the sixth review. Per-session media from the manifest sizes: 62 to 231 MiB (median 138; round 22 median 119), Braska 171 to 231 MiB, Natus at 2560x1080 337 MiB with two 14 MB 2x backdrops; the same 2560 run of Flux requested 183 MiB, so the 2x backdrops depend on the browser's link estimate (PR-0404). Round 22's slow-4G arrival (8.3 s to ready, 14 to 24 s to the board, a 36 s reload in 3 of 4 runs) is not re-measured. Over HTTP from this machine: index.html 3.5 KB, bundle 1.1 MB br, key art 0.75 MB, title music 2.9 MB each in 0.2 to 0.6 s.
- Repro: Playwright from node, PYREFLY_BROWSER=gpu, fresh context, cold cache, load https://echoesofspira.com/ unthrottled and with Fast and Slow 4G emulation, 3 runs each; record DOMContentLoaded, the first interactive title and the board.
- Evidence: critic/rounds/round-23/evidence/*/network-media.json summed against critic/artifacts/d3fe9fe5.json; no timing file exists
- Confidence: high that the measurement is missing; sizes are exact, effect on a real player unmeasured
- Requirement: CHK-017 five-second clause; RUBRIC section 2
- Smallest fix: Run the capture above on the live build and record the numbers; the smallest code step, if the title proves slow, is PR-0405's pre-input fetches (58 art files in round 22).
- Acceptance check: Cold-cache first load to an interactive title under 5 s unthrottled, the board under 15 s on Fast 4G, and a reload at the board no longer than the first load.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 68. PR-0394 [polish, delivery] PR-0394 (new, low confidence): on emulated slow 4G a reload at the board took 36 s to DOMContentLoaded in 3 of 4 runs (first load 8.3 s); the first Enter stays on the title at least 3.6 s

- Game / chapter: both / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: Reload after reaching the board under 1.6 Mbit/s took 36 s in 3 of 4 runs against 8.3 s for the first load; 8-9 requests were pending when it started. Cause not established.
- Repro: critic/rounds/round-22/scratch/arrival.mjs 4
- Confidence: low
- Requirement: CHK-017 load clause; RUBRIC 2 platform goals (load under five seconds)
- Where: evidence/gaps/arrival/arrival.json
- Smallest fix: Establish whether background preloads starve the reload; defer them on slow links.
- Acceptance check: reload on throttled network no slower than the first load
- Note: Carried from round 23, not re-observed in round 24.

### 69. PR-0404 [polish, delivery] PR-0404 (R39F-07, carried from the focused review, not re-measured): the 2x backdrop masters depend on the browser's link estimate; below 10 Mbps six un-held backdrops stay 1x

- Game / chapter: both / all; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The art tier follows the window and GPU as the changelog says, or the link rule is stated.
- Observed: Recorded by critic/reviews/c7135bec-focused.json; this round saw 2x masters requested at 2000x1012 and 2560x1440 and 3x at 3840x2160 on this machine's link, and did not test a slow link for art tier.
- Repro: As in the focused review.
- Evidence: critic/reviews/c7135bec-focused.json,critic/rounds/round-22/evidence/gaps/seymour-flux-win-hires-2560x1440/network-media.json
- Confidence: medium
- Requirement: CHK-013; release 39 claim
- Smallest fix: State the link rule in the changelog or drop it for held backdrops.
- Acceptance check: At 2560x1440 with a throttled link the documented tier loads.
- Note: Carried from round 23, not re-observed in round 24.

### 70. PR-0295 [polish, prep] PR-0295 (carried, not re-captured; fifth round the prep tabs are unproved by input): at 390x844 the heavy prep tabs showed the 640x360 desktop board letterboxed in round 22; no tab but CHAPTER was opened this round at any size

- Game / chapter: both (FFX tabs STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; FFX-2 DRESSPHERES, STATS, ACCESSORIES) / party prep, all chapters; phone; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A prep choice reachable by input that changes the fight with a sourced consequence, on desktop and phone.
- Observed: The 04-prep captures in all 63 capture runs are the CHAPTER tab at 1600x900, 1280x720, 2000x1012, 2560x1080 and 390x844; no tab key or click opened another tab. At 390x844 (ffx2-bahamut-win-touch/04-prep.png) the CHAPTER tab fits and Auron's guide card overlaps the objectives list.
- Repro: Real keys or taps: chapter select, chapter, party prep, press the tab keys through every tab and change a value.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/04-prep.png, ffx2-bahamut-win-touch/04-prep.png; round 22 PR-0295
- Confidence: medium (not re-captured)
- Requirement: RUBRIC section 6 prep agency; CHK-015
- Smallest fix: Capture every prep tab by input at 1600x900 and 390x844 once, with one changed value reflected in the first battle menu.
- Acceptance check: A run that opens each tab, changes a value and shows it in the fight, at both sizes.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 71. PR-0352 [polish, prep] PR-0352 (carried, unchanged): Natus ships no item drop although the research sources a Lv. 2 Key Sphere x2

- Game / chapter: FFX only / seymour-natus (X); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The sourced drop shown on the results panel (AGENTS.md hard rule 6: numbers come from research with their source notes).
- Observed: The Natus victory panel has AP 6,300 and GIL 3,500 and no ITEMS row in all four runs; src/data/ffx/enemies/seymour-natus.ts line 126 sets drops: [] with the comment 'sourced but has no item record'.
- Repro: Real-key win of Ch X, read the results panel.
- Evidence: critic/rounds/round-23/evidence/seymour-natus-win/31-results.png; src/data/ffx/enemies/seymour-natus.ts
- Confidence: high
- Requirement: Sourced rewards (RUBRIC section 6 prep)
- Smallest fix: Give the Key Sphere an item record and list it in drops with its source, or state in the file why it is left out.
- Acceptance check: The Natus panel shows the Lv. 2 Key Sphere with the sourced quantity.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 72. PR-0388 [polish, interface] PR-0388 (new): guide copy tells the player to reload a save and level up, which this chapter-based game has no screen for

- Game / chapter: both / V (FFX-2), IX and I (FFX); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Guide copy is meaningful in this game's flow (labelled adaptations).
- Observed: FFX-2 Ch V Vegnagun Tail guide: 'If its attacks are too much for you to survive, reload an earlier save and level up a little first.' (the game is chapter-based with retry; there is no save to reload and no levelling between fights). FFX Ch IX Yojimbo guide: 'In the next area an unsent summoner, Lady Ginnem, waits...' and Ch I prep text 'Get ready before the next area' read as walkthrough prose. These are adapted from the Jegged guides (standing rule 2026-10-03).
- Repro: Chapter V first menu, read the top-left guide.
- Evidence: critic/rounds/round-22/evidence/ffx2-vegnagun-shuyin-win/12-intent-E.png; src/data/guides/docs/ffx2-vegnagun-shuyin.ts:36; src/data/guides/docs/seymour-flux.ts:19
- Confidence: high
- Requirement: CHK-007 (player-facing copy fits the game); docs: guide follows Jegged in our words, adaptations labelled
- Where: src/data/guides/docs/ffx2-vegnagun-shuyin.ts:36
- Smallest fix: Replace those sentences with the game's own equivalent ('lose and retry, or revisit Party Prep') or drop them.
- Acceptance check: No guide sentence tells the player to reload a save, level up or walk to a next area.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 73. PR-0391 [polish, interface] PR-0391 (new, 4K): at 3840x2160 the enemy affinity row's labels run into each other and the coach mark and PAUSE label draw much smaller than the menu

- Game / chapter: FFX / X (seen); other chapters not checked at 4K; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: At 3840x2160 in Ch X (first menu) the Mortibody panel's affinity row prints overlapping labels (FIR/THU/WAT/HOLY/GRAV run into each other) and the Auron coach mark and PAUSE label render at a much smaller size than the command menu and party plates.
- Repro: PYREFLY_BROWSER=gpu, route seymour-natus, size 3840x2160, seed 1, look at 10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-009, CHK-003 at 4K (RUBRIC 5 deep size rotation)
- Where: evidence/gaps/seymour-natus-win-hires-3840x2160/10-first-menu-coach.png
- Smallest fix: Scale the enemy affinity row and coach mark with the same HUD scale as the command menu, or cap the row to fit its panel at large viewports.
- Acceptance check: 4K first menu shows non-overlapping affinity labels and coach text of comparable size to the menu
- Note: Carried from round 23, not re-observed in round 24.

### 74. PR-0392 [polish, interface] PR-0392 (new, FFX-2): a Phoenix Down's target cursor opens on a living ally, so Enter on the default wastes it; the revive itself was not read back

- Game / chapter: FFX-2 / VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: With Paine KO'd in Ch VI, choosing Phoenix Down puts the cursor on Yuna (alive); Paine needs two Right presses; Enter on the default would waste the item.
- Repro: Ch VI, seed 1, real keys: Rikku Item > Phoenix Down while Paine is KO'd; evidence/gaps/ffx2-leblanc-pd3/52-phoenix-target.png and leblanc-log.json (pd-trail yuna, rikku, paine)
- Confidence: medium
- Requirement: CHK-004 (advice reachable and executed), CHK-015
- Where: FFX-2 item target step
- Smallest fix: Default a revive item's cursor to the first KO'd ally when one exists (check against the FFX-2 source before changing).
- Acceptance check: cursor opens on the KO'd ally
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Esc out of the White Magic submenu and Item are reachable by real keys (gap pass), so the Ch VI 12-minute stall of the capture run was the route, not the game (see PR-0348). What the original FFX-2 does with a revive cursor was not checked against a source.

### 75. PR-0393 [polish, interface] PR-0393 (new, FFX-2): at the target step the reticle ovals draw over the command list and the enemy-move text

- Game / chapter: FFX-2 / V, XVI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: In the Vegnagun Tail and Ixion target steps the pink reticle ovals draw over the command list and the enemy-move panel text.
- Repro: Ch V Yuna as Lady Luck, Skill > Attack Reels target step; evidence/gaps/ffx2-vegnagun-shuyin-luck/30-reel-attack-reels-a.png
- Confidence: medium
- Requirement: CHK-008, CHK-010
- Where: FFX-2 target step
- Smallest fix: Dim or hide the command list during the target step, or draw the reticles under the HUD.
- Acceptance check: labels readable during the target step
- Note: Carried from round 23, not re-observed in round 24.

### 76. PR-0398 [polish, harness] PR-0398 (critic tooling, new): a continuity retry overwrites the whole review's continuity-summary.json (the chief recovered the 17-chapter aggregate from run.log into continuity-summary-r22-17ch.json)

- Game / chapter: both / all; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: One summary of the 17 measured chapters, as validateReport requires for the report's continuity field.
- Observed: critic/rounds/round-22/continuity/continuity-summary.json has 0 s of battle and UNVERIFIED for both checks (the r22b Ixion rerun overwrote it); the aggregate exists in the task brief and in each chapter's continuity.json.
- Repro: Open the file.
- Evidence: critic/rounds/round-22/continuity/continuity-summary.json,critic/rounds/round-22/continuity/continuity-summary-r22-17ch.json,critic/rounds/round-22/continuity/run.log
- Confidence: high
- Requirement: RUBRIC 6a: deep report carries the harness aggregate
- Smallest fix: Merge the 17 per-chapter files into one summary before the report is validated; I checked the sums (head over 1688, feet over 1749).
- Acceptance check: critic-clear accepts the report.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 77. PR-0334 [polish, feel] PR-0334 (confirmed, was low confidence): the twirl start draws a hard-edged white rectangle over the changing girl in every dressphere change

- Game / chapter: FFX-2 only / Ch V, VI, XI, XV; status open; build 72973096 (bundle CECt6LNe)
- Expected: A soft twirl-in (the ribbon aura seen in the close-up) with no block shape.
- Observed: A white slab about 60 by 110 px at 1600x900 sits over the girl for 150 to 450 ms (300 to 600 ms in Den of Woe) at the start of the twirl in 7 of 7 captured changes (Leblanc 1,500 ms; Vegnagun 1,350-1,650 ms; Fallen Aeons 1,350-1,500 ms and 1,500-1,800 ms; Den 1,800-2,100 ms and 1,500 ms; Vegnagun #2 1,500-1,800 ms), before the dress swaps. Merged with the visual auditor's re-observation (four chapters: Leblanc Paine Warrior to Songstress, Den of Woe Yuna White to Black Mage, Trema Paine Dark Knight to Songstress, Vegnagun Paine Dark Knight to White Mage; evidence critic/rounds/round-21/vis/leb-pair.jpg, sph-ffx2-den-of-woe-win.jpg, sph-ffx2-vegnagun-shuyin-win.jpg, trema-sph.jpg). Confidence is now high (7 of 7 clipped changes); it persists after the 119 new paintings and the 25 held 2x masters; the correction is in the key's alpha edge, never a repaint of approved art.
- Repro: Any FFX-2 Garment Grid change at 1600x900, seed 1; frames in critic/rounds/round-21/feel-narr/spheres4.jpg.
- Evidence: critic/rounds/round-21/feel-narr/spheres4.jpg
- Confidence: high
- Requirement: RUBRIC 6 animation and readable effects
- Smallest fix: Suspected: the first key of the twirl set is drawn unmasked or at the wrong alpha box; check the key's alpha edge and ease it in. Visual and animation auditors to cross-check the master.
- Acceptance check: Read 7 consecutive changes at 50 ms steps: no flat white rectangle with straight edges at any frame.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24 (fan): after a dressphere change Paine is a bright white silhouette for a frame, then the Songstress pose (Ch VI seq-spherechange).

### 78. PR-0314 [polish, feel] PR-0314 (carried, STALLED: open in 19b, 20 and 21): the FFX-2 dressphere shot is absent in 6 of 7 captured changes and the new push-in is not seen in any of them

- Game / chapter: FFX-2 only / Ch V, VI, XI, XV; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Every dressphere change gets a held close shot or, where none is clean, the push-in (D-346).
- Observed: Seven clipped changes: Vegnagun Paine dark knight to white mage (first change) plays the close-up from 3.15 s to about 4.6 s (1.45 s hold, ribbon aura then the new dress); the other six (Leblanc Paine, Vegnagun Paine #2, Fallen Aeons Paine #1 and #2, Den of Woe Yuna #1 and #2) show the girl's small-frame twirl and nothing else: the framing at the start and end is the same (Leblanc 900 vs 2,700 ms, Fallen Aeons 1,650 vs 2,550 ms), so neither the close-up nor the 1.22x push-in of D-346 plays. In every absent case an enemy turn starts 0.9 to 4.3 s after the change (meta.json events), the likely gate. Round 20: 5 of 10 absent.
- Repro: critic/rounds/round-21/evidence/ffx2-leblanc-win, ffx2-vegnagun-shuyin-win, ffx2-fallen-aeons-win, ffx2-den-of-woe-win clips/spherechange and spherechange-2; read with critic/rounds/round-21/feel-narr/strip.py (seed 1, 1600x900, Active, real keys).
- Evidence: critic/rounds/round-21/feel-narr/spheres4.jpg, veg-sphere.jpg, veg-sphere2.jpg, leb-sphere.jpg, fa-sphere.jpg
- Confidence: medium (clips and meta events; gate not traced)
- Requirement: RUBRIC 6 feel: coherent camera, impactful but readable effects; D-346
- Smallest fix: Per the stalled-area rule, a written method check before a third attempt: log which gate (another actor acting, no clean frame, menu up) refused each shot, then decide whether the push-in may start at the hand-back after the enemy action, or whether an enemy action should queue behind a dressphere shot in Active mode. No Wait-mode change without Bailey.
- Acceptance check: In Leblanc, Vegnagun and Fallen Aeons at 1600x900 seed 1, at least 5 of 6 changes show a shot or a measurable camera push for at least 1.4 s, with no enemy action inside it and the command menu closed.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Release 39 says the close-up on a change now starts with it; not graded this round.

### 79. PR-0301 [polish, feel] PR-0301 (carried, re-observed): FFX-2 chain seams still hand control back later than 2.5 s

- Game / chapter: FFX-2 only / Ch V link 2, Ch VI link 2; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Control returns in about 0.6-0.75 s as at live 32, or the longer opening is Bailey's choice.
- Observed: Leblanc link 2 and Vegnagun link 2 (seq-seam-2, eight frames from 45 ms to 2,513 ms) show the new arena, the party and a name plate (Logos, Vegnagun at about 1.4 s) but no command menu by 2.51 s. Same as round 20.
- Repro: critic/rounds/round-21/evidence/ffx2-leblanc-win/seq-seam-2 and ffx2-vegnagun-shuyin-win-again/seq-seam-2 (sheet critic/rounds/round-21/feel-narr/seams2.jpg).
- Evidence: critic/rounds/round-21/feel-narr/seams2.jpg
- Confidence: medium
- Requirement: RUBRIC 6: transitions and dead waiting
- Smallest fix: Per the existing ticket: shorten the seam's battle-start moment for FFX-2, or ask Bailey whether the longer opening is intended.
- Acceptance check: Seam to menu-up under 1.5 s on Leblanc and Vegnagun.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 80. PR-0364 [polish, visual] PR-0364 (new; V21-VIS-01): in the FFX-2 run-in the camera pans and Yuna is cut off at the left frame edge for about 1 s

- Game / chapter: FFX-2 only / Ch VI (any FFX-2 chapter with a run-in); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: Leblanc 1600x900, Rikku Thief's Attack run-in at about t=1.5-1.9 s of the attack clip: the shot follows Rikku toward Ormi and Yuna stands half, then almost fully, outside the left edge while the white Paine stays in view.
- Repro: FFX-2 Ch VI Leblanc seed 1, party order Yuna, Rikku, Paine, Rikku Attack on Ormi; extract frames from ffx2-leblanc-win/clips/attack/attack.mp4 at 1.5 s and 1.9 s.
- Evidence: critic/rounds/round-21/vis/leb-att-pair.jpg
- Confidence: medium (one clip, one state; other chapters not checked)
- Requirement: RUBRIC feel: coherent camera; CHK-014
- Where: run-in follow camera (D-354)
- Smallest fix: Clamp the run-in follow so every party member stays inside the frame (or limit the pan to the actor's own span) and check at 1600x900 and 2000x1012.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Release 39 says the camera keeps every girl in the frame on a run-in; not graded this round.

### 81. PR-0344 [polish, visual] PR-0344 (updated): the painted plate wings fill the 21:9 void with no mirrored lantern, but each meets the plate at a hard tilted seam with a bright lantern at the very edge; the r20 "Bahamut reads about 12 percent smaller at 2000x1012" half was not re-measured

- Game / chapter: FFX-2 only / Ch IV, XV; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: Ch IV Bahamut 2560x1080: left and right wing strips cover the former void with no mirrored lantern, but each meets the plate at a vertical, slightly tilted seam with a brighter lantern at the edge. Ch XV was viewed at 2560x1080 with the same two-wing layout. The round-20 text of this id covered the mirrored lantern and a 12 percent smaller Bahamut at 2000x1012 (low-medium confidence). Release 38's painted wings (D-343) removed the mirrored lantern at 2560x1080 (Ch IV and XV); the seam is the remaining defect; the 2000x1012 framing was not captured (CHK-014 reads 1024x768, 2560x1080, 2560x1440 only).
- Repro: FFX-2 Ch IV, 2560x1080 first menu; crop vis/bah-wings.jpg.
- Evidence: critic/rounds/round-21/vis/bah-wings.jpg
- Confidence: high
- Requirement: RUBRIC visual: composition, consistency
- Where: plate wings at 21:9
- Smallest fix: Blend the strip into the plate over 40-80 px (a soft mask) and darken the edge lantern; approved painting unchanged.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Release 39 says the pipe slabs at Bevelle's plate edges in wide windows are gone; 21:9 was not captured this round.

### 82. PR-0365 [polish, visual] PR-0365 (new; V21-VIS-02): Ch XII first menu hides one Mortiphasm disc behind Yuna and Auron (5.8 percent visible at 2560x1440, 4.4 percent at 2000x1012)

- Game / chapter: FFX only / Ch XII Seymour Omnis; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: seymour-omnis first menu, seed 1: the rect-visibility readout for the four discs is 0.558, 0.058, 0.699 and 0.804 at 2560x1440 (0.531, 0.044, 0.709, 0.828 at 2000x1012); the lower-left disc is covered by the two girls' bodies in the frame. The other three discs are visible. The round-20 1600x900 reading of this state was not measured, so whether release 38 changed it is unknown (the capture owner's first-menu frames were retaken with the top row asserted).
- Repro: FFX Ch XII seed 1, open the first menu, read run.json rects or the crop vis/omnis-discs.jpg.
- Evidence: critic/rounds/round-21/evidence/seymour-omnis-first-2560x1440/run.json; critic/rounds/round-21/vis/omnis-discs.jpg
- Confidence: high for the frame; unknown whether new
- Requirement: CHK-011 no targetable enemy more than about 25 percent occluded in the default framing
- Where: first command menu
- Smallest fix: Offset the disc formation or stage the party so no disc is under 75 percent visible (the round-20 reading at 1600x900 was not measured, so whether release 38 changed it is unknown).
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: See PR-0382: the Ch XII party heap stands in front of the discs.

### 83. PR-0310 [polish, visual] PR-0310 (carried, narrowed): Braska's Final Aeon now stands clear of the party with both Yu Pagodas visible; with Yuna first her staff keeps a sliver of overlap with the aeon through the menu (R39F-10)

- Game / chapter: FFX only / Ch III Braska's Final Aeon; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: Ch II: Yunalesca stands clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012. Ch VIII: Rikku stands beside the coil without overlap in every window shape. Ch III (staging switched off by decision): Auron stands in front of the Yu Pagoda base and the party's weapons reach the boss's sword. Downgrade reason: release 38 restaged Ch II (Yunalesca clear of Auron, Tidus and Yuna at 2560x1440 and 2000x1012) and Ch VIII (Rikku beside the coil with no overlap at 2560x1440, 2560x1080, 1440x900 and 1024x768); the Ch III table is written and switched off by Bailey's pick (CHAPTER_III_STAGED = false), so what remains is a known and chosen state at polish severity.
- Repro: FFX Ch III first menu, seed 1, 2560x1440 (braskas-final-aeon-first-2560x1440/11-first-menu-clean.png).
- Evidence: critic/rounds/round-21/vis/yuna-gap.jpg; vis/braska-gap.jpg
- Confidence: high
- Requirement: CHK-014 / ground contact and scale
- Where: first menu
- Smallest fix: Enable the written Chapter III table (CHAPTER_III_STAGED) when Bailey picks the 'another way' round; nothing to do for II and VIII.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 84. PR-0308 [polish, combat] PR-0308 (carried, narrowed): the Swordplay tiers now differ and carry Bailey's adoption of the estimates (D-413, verified live for Spiral Cut, jsdom for the other three); open: the Bushido button order is still our estimate

- Game / chapter: FFX / Ch II, XII, XVII, XVIII (Auron's Bushido, Tidus's Swordplay); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The sourced ordering of Swordplay difficulty across tiers, and a sourced order for every Bushido button.
- Observed: FIXED: each Bushido now plays its own sourced length and order (Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6; the 7-chip default is gone), typed by real keys in six live runs. STILL OPEN: (1) all four Swordplay tiers play one zone and speed (12.22 percent, 1,059 ms) although the sourced ordering says stronger tiers get a narrower zone and a faster marker (ffx-combat-core 5.3 rule 2, verified 2 sources); the values are unpublished, so rule 6 forbids inventing them. (2) The button order is the GameFAQs order and labelled 'our estimate'; research D3 records that GF-KB's Shooting Star order (two Circles) matches no other source and the International table in 5.5 disagrees; the Steam HD copy would settle it. (3) Square is keyboard K / pad 2 with no on-screen key hint beyond the chip. (4) Banishing Blade and Tornado have not been seen in a real run. GAP PASS update (real keys, Ch VII Macalania, 1600x900, seed 1, Auron/Tidus gauge forced to 100: a labelled hook): Banishing Blade (7 chips, correctInputs 7, success, damage 4605) and Tornado (6 chips, correctInputs 6, success) play their own sequence, and Slice and Dice (timer 3000), Energy Rain (2600) and Blitz Ace (2200) each resolved success with travelMs 1059 and zonePercent 12.22. So the "never seen in a real run" half of this ticket is closed; the Swordplay tier numbers (no source) and the button-order estimate remain. The miss path was not exercised.
- Repro: od-params-probe.json (params per ability); bushido-oracle.json; yunalesca-win/run.json minigames; sin-fins-core-win-long/run.json.
- Evidence: critic/rounds/round-21/combat/od-params-probe.json, bushido-oracle.json; critic/rounds/round-21/evidence/*/run.json minigames
- Confidence: high
- Requirement: AGENTS rule 6 and 14; ffx-combat-core 5.3 and 5.5
- Where: src/data/ffx/overdrives/inputs.ts
- Smallest fix: Bailey's yes to the 5.3 estimates (22/16/12/9 percent, 1,400/1,150/900/700 ms) or sourced values makes it a four-row edit in inputs.ts; check the Steam HD copy for the Bushido order; add a key legend for the Square chip.
- Acceptance check: Swordplay zone width decreases and speed increases from Spiral Cut to Blitz Ace in od-params-probe.json; the Steam copy's Bushido order matches inputs.ts.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 85. PR-0369 [polish, interface] PR-0369 (new; R21-IF-02): in Ch XII target mode the TARGET plate lies over the disc panel's "FACING HIM" label

- Game / chapter: FFX only / Ch XII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Overlays do not overprint each other's labels.
- Observed: At 1600x900, 2000x1012 and 2560x1440 the 'TARGET Seymour Omnis' plate cuts the 'FACING HIM' label in half; the Sensor card also stands over the boss torso (PR-0248 pattern).
- Repro: Ch XII, seed 1, first menu, Attack.
- Evidence: critic/rounds/round-21/evidence/seymour-omnis-win/16-target-single.png; seymour-omnis-first-2560x1440-targetopen/11-first-menu-clean.png
- Confidence: high
- Requirement: CHK-008
- Smallest fix: Move the target plate below the disc panel or shift the disc panel one row.
- Acceptance check: 16-target-single frame at three sizes shows 'FACING HIM' whole.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 86. PR-0371 [polish, interface] PR-0371 (new, low confidence; R21-IF-05): the guide rail's NEXT and the advisor card name different actions at the same first menu (Ch IX, Ch XI)

- Game / chapter: FFX Ch IX, FFX-2 Ch XI / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Two 'next' prompts on one screen either agree or say why they differ (PR-0239 family).
- Observed: Ch IX: guide 'Kimahri Defend -> Kimahri', advisor 'Fire Gem -> Yojimbo'. Ch XI: guide 'Yuna X-Potion -> Yuna', advisor 'Shell -> the party'. The other 16 chapters agree.
- Repro: First menu of Ch IX and Ch XI, seed 1.
- Evidence: critic/rounds/round-21/evidence/yojimbo-cavern-win/11-advisor.png; ffx2-fallen-aeons-win/run.json pause.esc.text
- Confidence: low
- Requirement: RUBRIC: advisor and strategy guide are separate capabilities
- Smallest fix: Label the guide as the designed line, or reconcile with the advisor.
- Acceptance check: No unexplained disagreement in the 18-chapter first-menu sweep.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 87. PR-0374 [polish, audio] PR-0374 (new; R21-AUD-02): FFX Ch I pause cue starts 0.5-1.0 s late and without a crossfade; FFX-2 Ch IV switches within 0.5 s

- Game / chapter: FFX only (FFX-2 behaves as expected) / Ch I; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Both games duck the battle cue on opening pause with the same timing.
- Observed: Esc in FFX Ch I: boss-seymour is still current at gain 1 at +0.5 s and the pause cue is current at gain 1 by +1.0 s (150 ms sampling). FFX-2 Ch IV at +0.5 s already has the pause cue current with the boss cue fading. Gap pass PASS on the pause hand-back itself in both games (resume restores the battle cue); this is only the open-side difference.
- Repro: toBattle seymour-flux then ffx2-bahamut, setSeed(1), real Esc, sample audioDebug every 150 ms.
- Evidence: critic/rounds/round-21/evidence/gaps/pause-audio/seymour-flux-fine.json, audio-debug-seymour-flux.jsonl
- Confidence: medium (one lane, host not otherwise idle)
- Requirement: CHK-023
- Where: pause open audio path
- Smallest fix: Check why the FFX pause cue is requested later than the FFX-2 one; make the duck on open the same in both.
- Acceptance check: At +0.5 s after Esc the pause cue is current or the boss cue is below gain 0.5 in Ch I.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 88. PR-0104 [polish, feel] PR-0104 (carried, 6th review, STALLED, not re-observed): a confirmed FFX-2 Shell in Wait shows only a cast pose, no name chip

- Game / chapter: FFX-2 only / Ch IV; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A name chip in Wait as in Active.
- Observed: No Bahamut clip was recorded (clips 0 in all four Bahamut lanes), so the item could not be re-read; carried unchanged, UNVERIFIED this round.
- Repro: Bahamut Wait mode, Yuna Shell; needs a clip.
- Evidence: none this round
- Confidence: low (carried)
- Requirement: RUBRIC 6
- Smallest fix: Per the method check already owed for this stalled issue.
- Acceptance check: Name chip visible during the cast in Wait.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 89. PR-0315 [polish, feel] PR-0315 (carried, not re-observed): the twirl crossfade may double-expose the neighbouring girl as well as the changer for about 0.2 s

- Game / chapter: FFX-2 only / Ch IV-XV; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A clean crossfade of the changing girl only.
- Observed: Not measured at the 150-300 ms steps used here; frames at 1,500-1,800 ms in the Den clips show the party blended with the changer but the double image could not be separated from the white slab (PR-0334).
- Repro: Garment Grid change at 50 ms steps.
- Evidence: critic/rounds/round-21/feel-narr/spheres4.jpg
- Confidence: low
- Requirement: RUBRIC 6
- Smallest fix: Re-measure after PR-0334 is repaired.
- Acceptance check: No second figure's alpha changes during a change.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 90. PR-0316 [polish, visual] PR-0316 (new; R19-VIS-04): FFX-2 Bahamut's head is washed out by the backdrop lamp's bloom under the low colossus camera

- Game / chapter: FFX-2 only / IV ffx2-bahamut, first menu and mid-fight, 1600x900 and 2000x1012; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The boss's face reads clearly in his signature framing.
- Observed: Bahamut's head is readable (not blown out) at 2560x1440 and 2560x1080 this round; the 2000x1012 frame that the ticket names was not captured (PR-0316 stays open until it is). Cyan rim fringe on the wing cut-outs is visible in the 2560x1440 boss crop.
- Repro: Candidate, seed 1, Ch IV, first menu.
- Evidence: critic/rounds/round-21/evidence/ffx2-bahamut-first-2560x1440/13-crop-boss.png
- Confidence: medium
- Requirement: visual: recognisability, lighting
- Smallest fix: Shift the Bahamut master a few degrees so the lamp sits beside the head, or damp bloom behind colossus heads.
- Acceptance check: Head crop at 1600x900 and 2000x1012 shows eye, jaw and crest with no clipped white.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 91. PR-0341 [polish, visual] PR-0341 (downgraded major to polish, not reproduced): Ch IX Yojimbo and Daigoro drawn in every round-21 capture

- Game / chapter: FFX only / Ch IX Yojimbo; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: Yojimbo and Daigoro are visible 1.0 at the 2000x1012 ui first menu and the 1600x900 route frame, and 1.0 / 0.751 at 2560x1440. Round 20's single missing-boss frame (same state at 2000x1012) is not seen again. Downgrade reason: the round-20 single-frame observation (an unconfirmed single run on a loaded host) did not recur in the 2000x1012 UI first menu, the 2560x1440 first menu or the 1600x900 route; the cause was never established. Not reproduced is not proven absent: keep the portraitTimeline readout and close after one more clean quiet-host run.
- Repro: FFX Ch IX seed 1 first menu at 2000x1012 on a fresh profile; repeat several times.
- Evidence: critic/rounds/round-21/evidence/yojimbo-cavern-first-2000x1012-ui/run.json; vis/yoj-r20-r21.jpg
- Confidence: medium (not reproduced is not proven absent)
- Requirement: CHK-011
- Where: first menu
- Smallest fix: Keep the portraitTimeline readout and rerun once on a quiet machine; close if clean.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 92. PR-0256 [polish, feel] PR-0256 (carried, not re-observed visually): the Chapter XVI whistles still tell 'A small gold light answers' without showing it

- Game / chapter: FFX-2 / XVI aftermath, whistles 1 to 4; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A visible light, nearer on each whistle.
- Observed: Chapter XVI: "(Whistle)", "A small gold light answers.", "The light comes nearer." and the like have an empty speaker and no mote was captured in the scene frames (re-observed in the dbox timelines).
- Repro: Ch XVI win, CONFIRM on results, advance the whistles by Enter.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: medium
- Requirement: feel/narrative: shown, not told
- Smallest fix: A small gold mote fx step per whistle.
- Acceptance check: A timed capture after each whistle shows the light, nearer each time.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 93. PR-0272 [polish, narrative] PR-0272 (carried): Chapter XVII's cannon beat is still a caption on the unchanged deck plate

- Game / chapter: FFX / XVII sin-fins-core, seam 1 -> 2; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A hit effect on the Left Fin and the fin leaving before the 'Right Fin' caption.
- Observed: Chapter XVII: "The Fahrenheit's cannon tears the fin away." (battle, 368,321 ms) is still a caption on the unchanged deck plate.
- Repro: Ch XVII, 2000x1012, seed 1, real keys to the first fin kill.
- Evidence: critic/rounds/round-19b/feel-narr/dbox-all.txt
- Confidence: high
- Requirement: narrative: faithful beats shown, not told (research/ffx-sin.md §9.2)
- Smallest fix: Unchanged: an existing flash and burst on the Left Fin painting, then fade the fin, with no new art.
- Acceptance check: A timed seam 1->2 capture shows a hit effect on the Left Fin and the fin leaving before the caption.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 94. PR-0350 [polish, combat] PR-0350 (carried, unchanged, low confidence, suspected): the immune-status miss event can pop twice for a two-status move and counts as 'targeted' for the Fallen Aeons counter

- Game / chapter: FFX-2 / status-only actions on immune targets, Ch XI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: One miss pop per action.
- Observed: r21-probes2.json identical to round 20 (abilities with formula none and two or more hostile statuses listed).
- Repro: r20-probes2.test.ts
- Evidence: critic/rounds/round-21/combat/r21-probes2.json
- Confidence: low
- Requirement: Presentation parity of misses
- Where: src/battle/ffx2 (immune miss event)
- Smallest fix: Collapse to one miss event per target per action.
- Acceptance check: A two-status move on an immune boss emits one miss event.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 95. PR-0351 [polish, combat] PR-0351 (carried, unchanged, low confidence): the Trigger Happy damage forecast floors at 6 hits while a human who presses fewer times now deals fewer

- Game / chapter: FFX-2 / Gunner Trigger Happy, Ch VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Forecast agrees with the honoured human count.
- Observed: Live matrix: 3 presses give 3 damage events (12,17,17) on all five input devices; the forecast copy is unchanged from round 20.
- Repro: critic/rounds/round-21/evidence/feat/th-*/run.json
- Evidence: critic/rounds/round-21/evidence/feat/th-ffx2-leblanc-kbd-r-3p-1600x900/run.json
- Confidence: low
- Requirement: Honest intent display
- Where: FFX-2 forecast text
- Smallest fix: Show the forecast as a range from the honoured count.
- Acceptance check: Forecast copy names the pressed-count rule.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 96. PR-0273 [polish, combat] PR-0273 (carried, unchanged): Ch XVII link 3 (on Sin's back) still lists disabled ESCAPE, PULL BACK and CLOSE IN rows at the top of the command menu

- Game / chapter: FFX / Ch XVII link 3; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Rows that can never be used on this link are hidden.
- Observed: link3-rows.json identical to round 20: attack, abilities, then escape(disabled), trigger:pull-back(disabled), trigger:close-in(disabled) before items.
- Repro: link3-rows.test.ts
- Evidence: critic/rounds/round-21/combat/link3-rows.json
- Confidence: high
- Requirement: Honest command lists
- Where: Ch XVII link-3 setup
- Smallest fix: Hide the three rows on link 3.
- Acceptance check: link3-rows.json has no disabled rows for Tidus.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 97. PR-0280 [polish, encounter] PR-0280 (carried): the v3 card's Chapter XII rate is unchanged (Omnis intended 27/40, advisor 24/40); the live v4 card covers it

- Game / chapter: FFX / Ch XII Seymour Omnis; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: n/a
- Observed: Three-line bench row identical to round 20.
- Repro: ffx-bench.test.ts seymour-omnis
- Evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
- Confidence: high
- Requirement: RUBRIC 6
- Where: src/engine/tactics
- Smallest fix: None needed beyond the live card.
- Acceptance check: Row stable.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 98. PR-0263 [polish, audio] PR-0263 (carried, polish): the SFX level fix (D-293, bus 0.70, mix b) is delivered but no ear has confirmed it

- Game / chapter: both / all; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: sfxMix {option b, trim 1, bus 0.70} and volumes 0.8/0.7/0.7 in 307 of 307 samples; both sprites are byte-identical to round 20. Whether the attack sounds now read as present against the music is an ear question.
- Repro: critic/rounds/round-21/audio/routing.txt (problems=0 on every run).
- Evidence: critic/rounds/round-21/audio/routing.json
- Confidence: high (measurement), unverified (listening)
- Requirement: CHK-B1
- Where: src/audio/AudioManager.ts sfxBusGain; src/app/saveSfxBalance.ts
- Smallest fix: Bailey's ear on the audition page (part of the PR-0148 verdict).
- Acceptance check: Bailey's recorded reaction to the SFX level.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 99. PR-0220 [polish, audio] PR-0220 (carried, polish): a real controller on a real Chrome is not proven to unlock audio

- Game / chapter: both / title; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: Emulated pad-only runs (seymour-flux-win-pad, ffx2-bahamut-win-pad) reached the boss cue at the first menu, and audio-pad-unlock unit tests pass (2 of 2), but headless Chromium already has user activation, so a real pad and a real browser are untested.
- Repro: critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl; npx vitest run tests/unit/audio-pad-unlock.test.ts.
- Evidence: critic/rounds/round-21/evidence/seymour-flux-win-pad/audio-debug.jsonl
- Confidence: medium
- Requirement: CHK-001 / platform goals (real controller evidence is UNVERIFIED, not a pass)
- Where: src/audio/padUnlock.ts
- Smallest fix: A real-controller check in desktop Chrome (hardware), Bailey or a tester.
- Acceptance check: A pad-only fresh session in real Chrome plays the title or board cue after the first pad A.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 100. PR-0039 [polish, audio] PR-0039 (carried, STALLED): three shipped cues still depart from the THEMES.md bible (no tempo map)

- Game / chapter: both / I/IX/X/XIV (scene-gagazet), III/XII (scene-dreams-end), V/XI (scene-farplane); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Lyrical cues carry a tempo map (THEMES.md, Renderer requests #1).
- Observed: themes-audit output is byte-identical to round 20's: 4 of 26 cues depart (scene-gagazet, scene-dreams-end, scene-farplane with no tempo map; scene-macalania-temple is 'not in the bible's cue map').
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Smallest fix: Fold the fix into the owed re-composition (PR-0099), or record a documented exception.
- Acceptance check: themes-audit reports 0 departures for these cues.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 101. PR-0260 [polish, audio] PR-0260 (carried): themes-audit cannot check the Chapter VII scene cue scene-macalania-temple

- Game / chapter: ffx / VII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Every shipped cue has a row in the bible's cue map.
- Observed: themes-audit cannot check the Chapter VII scene cue scene-macalania-temple: it is "not in the bible's cue map" (output byte-identical to round 20).
- Repro: node tools/audio/themes-audit.mjs
- Evidence: themes-audit output, round 18
- Confidence: high
- Requirement: docs/audio/THEMES.md
- Smallest fix: Add the cue's row (key, BPM, themes) to the THEMES.md cue map.
- Acceptance check: themes-audit shows ok for scene-macalania-temple.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 102. PR-0278 [polish, audio] PR-0278 (carried, docs only): the THEMES.md chapter cue-map table still breaks after the XVI Ixion row

- Game / chapter: FFX-2 (the Ixion row), docs / XVI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: The Ixion row's last cell is cut off mid-sentence and the 'Owed cues for chapters not yet listed' heading is glued into the table as a row; the Sin rows then follow a stray '99).' line.
- Repro: Read docs/audio/THEMES.md from the line '| XVI | `ffx2-ixion-djose` Ixion'.
- Evidence: docs/audio/THEMES.md (cue map section)
- Confidence: high
- Requirement: docs accuracy
- Where: docs/audio/THEMES.md
- Smallest fix: Repair the table text (documentation only).
- Acceptance check: The table renders as one table; themes-audit still reads 18 chapters.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 103. PR-0298 [polish, audio] PR-0298 (new, a question for Bailey): the music O1 encode ships 78.2 MB of music (80.9 MB of audio), not the 'about 73 MB' in the accepted recommendation; the budget constant went 60 -> 85 MB

- Game / chapter: both / all; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: D-292 as worded: the music grows from about 39 MB to about 73 MB.
- Observed: qa.mjs total shipped audio is 88.49 MB of the 90 MB budget (D-306 raised the cap from 85 MB; the accepted recommendation said about 73 MB of music). A question for Bailey, nothing changed in this build.
- Repro: node tools/audio/qa.mjs in D:/pyrefly-rel26c, then read the last line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/audio/qa-strict.txt
- Confidence: high
- Requirement: RUBRIC s7 (a pick approves what Bailey named)
- Smallest fix: Put the 78 MB figure in the morning brief and get a yes or no. Nothing is rebuilt unless he declines.
- Acceptance check: decisions.json records Bailey's answer on the 78 MB size.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 104. PR-0237 [polish, interface] PR-0237 (carried, confirmed): on the phone the first-time coach covers the FFX-2 intent line and boss plate

- Game / chapter: FFX-2 only / IV Bahamut, first menu, 390x844 touch; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The coach sits below the intent strip.
- Observed: Re-observed: the phone first-time coach tag overprints the FFX-2 intent third line ("115-" cut), Ch IV.
- Repro: Fresh profile, Chapter IV, 390x844 touch, first menu.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win-phone-touch/10-first-menu-coach.png
- Confidence: high
- Requirement: CHK-008
- Where: coach placement on the phone (src/ui/coach, not traced)
- Smallest fix: Place the phone coach under the intent strip.
- Acceptance check: 0 px2 between the coach and the intent strip at 390x844 in Ch IV, V, VI.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 105. PR-0357 [polish, interface] PR-0357 (new; R20-IF-04 + capture owner): the intent card's overflow/ALSO line is cut mid-sentence and ghosted behind the dashed footer rule (Ch I, Ch IV; 2000x1012)

- Game / chapter: both (Ch I, Ch IV seen) / I Seymour Flux, IV Bahamut, desktop; status open; build 72973096 (bundle CECt6LNe)
- Expected: A collapsed card ends on a whole line or a clearly dimmed 'more' cue.
- Observed: Re-observed: the Leblanc intent odds list is ghosted behind the dashed rule at 2000x1012.
- Repro: Chapter IV, E open at the first menu, 1600x900 or 2000x1012.
- Evidence: critic/rounds/round-20/evidence/ffx2-bahamut-win/11-advisor.png; ffx2-bahamut-lose/11-advisor.png; audit/zz-contrast.tmp.mjs; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: medium
- Requirement: CHK-003; RUBRIC section 2
- Where: enemy intent card overflow fade with 'J HOLD +N MORE'
- Smallest fix: Clip at a line boundary, or put the consequence ('Slowing him slows it too') in the first visible line.
- Acceptance check: No card line shown at under 3:1 and none cut mid-sentence in the collapsed state.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24: FFX-2 Ch VI Fem-Goon "Blizzard, possible 25%" shows two of three party rows with the second half-faded ("J HOLD . +11 MORE"); Ch IV's "ALSO: the Mega Flare countdown is an action counter, not a clock" sits in the fade at about 2.9:1; Ch I "Lands on one of these, picked when it acts." at about 2.1:1. Evidence: evidence/ffx2-leblanc-win/16-target-single.png, ffx2-bahamut-win/13-guide-G.png, seymour-flux-win/12-intent-E.png.

### 106. PR-0324 [polish, interface] PR-0324 (carried, half fixed): Ronso Rage no longer called timed in code (live card not captured); Yuna's Grand Summon is still called a "Timed input"

- Game / chapter: FFX only / XIV Isaaru, first menu, 1600x900 seed 1; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: No 'Timed input' on an untimed picker (project data: no timed input; a picker only).
- Observed: Re-observed: Yuna's Grand Summon still reads "Timed input" (Ch XIV); the Ronso Rage live card was not captured.
- Repro: Real keys to Chapter XIV, first menu, read the advisor card.
- Evidence: critic/rounds/round-20/evidence/isaaru-via-purifico-win/run.json advisorText
- Confidence: high
- Requirement: RUBRIC section 2; AGENTS.md rule 6
- Where: src/engine/tactics/advisor.ts:653 (the fix excludes only kimahri-rage); src/battle/ffx/overdrive.ts timerMsFor returns 0 for yuna-grand-summon
- Smallest fix: Add the phrase only when timerMsFor(def) is above 0 (Swordplay, Bushido, Lady Luck reels keep it).
- Acceptance check: No 'Timed input' on Ronso Rage, Grand Summon or Mix rows; Bushido and reels keep it.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 107. PR-0292 [polish, onboarding] PR-0292 (new, Sphere Grid A/C, FFX only): AUTO-LEARN and ? have no key or pad route; the phone explainer says Click/Enter/wheel and its buttons start below the fold

- Game / chapter: FFX / I prep; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Every control has a key or pad route, and touch wording on touch screens.
- Observed: Carried, not captured (the prep tabs were not opened by input at any size; third round without them). Prep code untouched in release 38.
- Repro: Prep > Sphere Grid tab at 1600x900 keys only; the same at 390x844.
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/sphere-seymour-flux-1600x900/run.json autoByKeys; sphere-seymour-flux-390x844-touch/02-A-explainer.png
- Confidence: high
- Requirement: onboarding: input access
- Where: Sphere Grid tab
- Smallest fix: Bind AUTO-LEARN (and ?) to a free key/pad button, and swap in the touch wording under pointer: coarse.
- Acceptance check: A keyboard-only run opens AUTO-LEARN and its UNDO; the phone copy reads Tap.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 108. PR-0327 [polish, delivery] PR-0327 (carried, not captured): the first dressphere change of a battle fetches about 2 MB of twirl keys on demand; cold or throttled behaviour still unobserved

- Game / chapter: FFX-2 only / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Keys present when the twirl plays, or a clean fallback.
- Observed: Trema runs request paine-warrior, paine-thief and yuna-warrior twirl-forming and twirl-end files during play; no timing of key arrival against the outfit frame exists on a throttled cache.
- Repro: Cold profile, 10 Mbit, Chapter IV seed 1: first Change to Black Mage; compare key response ends with the outfit frame.
- Evidence: critic/rounds/round-21/evidence/ffx2-trema-win/network-media.json (twirl requests present, no timing)
- Confidence: low (builder-stated, never captured)
- Requirement: RUBRIC section 2 measured loading
- Smallest fix: Prefetch the party's twirl keys at battle start at idle priority, after the throttled capture shows a gap.
- Acceptance check: A throttled capture where every twirl key response ends before the outfit frame.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 109. PR-0223 [polish, delivery] PR-0223 (carried, unchanged): the FF7 pause's three missing Cloud files are fixed per the builder; still not captured

- Game / chapter: FF7 experiment (hidden) / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: 0 requests >= 400 on the FF7 pause.
- Observed: Not captured in round 21; no FF7 file changed.
- Repro: FF7 door, then battle, then Esc; record the network log.
- Evidence: critic/rounds/round-20.json PR-0223
- Confidence: low
- Requirement: CHK-017 and CHK-018
- Smallest fix: None until observed.
- Acceptance check: A network log of the FF7 pause with no 4xx.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 110. PR-0339 [polish, harness] PR-0339 (critic tooling, carried, widened): the route's 700 s fight budget ends Ch III, V, XI and XVII mid-fight (XI needed 13 minutes on seed 2), and it expects a post-battle scene before results where four chapters play it after Confirm

- Game / chapter: both / ffx2-trema, sin-fins-core, sin-face; post-scene in I, II, VII, VIII, VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A recorded real-key win through results and back to the board for every included chapter (CHK-022).
- Observed: The route bot loses at human pace: Yunalesca lost on seeds 1, 1001 and three more attempts (116-121 turns, 643-720 s per fight) and won only on seed 4001 after 58 minutes; Trema lost 5 of 5 (81-98 turns); Den of Woe lost 4 of 4 plus one chain-link win, then defeat. Braska and Sin Fins Core stalled at link 3 on the short budget and won on the long re-runs. No victory results screen was captured for Trema or Den of Woe (product cause not established; see PR-0227 and PR-0306).
- Repro: cap/lanes.sh with ffx2-trema win --seed=1|2|3 --attempts=2; gapcap/swordplay.mjs sin-fins-core 1600x900 "" 1
- Evidence: critic/rounds/round-21/evidence/ffx2-trema-win-r2/run.json, ffx2-den-of-woe-win-r2/run.json, yunalesca-win-r2/run.json
- Confidence: high that it is not a product regression; unknown whether a better bot wins
- Requirement: CHK-022
- Smallest fix: Teach the route to enter the shown Overdrive input and a race-aware policy for the Sin chapters, raise the turn cap, and read the post-scene after CONFIRM (with PR-0261).
- Acceptance check: A recorded win through results, CONFIRM, scene and board for XIII, XVII and XVIII.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 111. PR-0261 [polish, harness] PR-0261 (critic tooling, widened with R18-CE-02): the route harness records a stalled chain as outcome 'victory' (link 1's result) with fails []

- Game / chapter: both (tooling) / all phone routes; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: contexts.touch.blocked names the element that intercepts the tap.
- Observed: Pattern persists: Braska and Sin Fins Core short runs stalled at link 3 and read as outcome "victory" in the collation; seven victories carry an unverified 30-post-scene frame (the screen wanted a cutscene and got results, PR-0339 pattern).
- Repro: Compare seymour-omnis-win-touch run.json blocked entries with diag-tap/seymour-omnis-yuna.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/logs/den-win-realkeys.log; D:/Final Fantasy/critic/rounds/round-18b/evidence/ffx2-den-of-woe-win/a2-battle-log.json
- Confidence: high
- Requirement: CHK-016 evidence integrity
- Smallest fix: Derive the outcome from the final screen and the engine result at the end, and record 'stalled at link N, <phase>'.
- Acceptance check: A re-run of the stall route records 'stalled at link 2, moment:battle-start'.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 112. PR-0375 [polish, harness] PR-0375 (critic tooling, new; R21-PD-02): the pause matrix assumes a plain top row at the FFX first menu, so four FFX rows fail on a shifted state

- Game / chapter: FFX only (FFX-2 first menus open on a row that is not Attack at the coach) / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A row fails only when the game's response differs from the rule from the stated state.
- Observed: seymour-flux-pausematrix-1600x900 row 4 starts with targets 2 (the target cursor open) because the last coach card's Enter also chose Attack (OBS-03); Esc therefore closes the cursor instead of opening pause, and rows 5 to 7 run one state out of step and read FAIL. The pad run's row 11 (targeting Esc) starts with targets 0 and rows 12 and 13 follow. Every row after the shift behaves as the rules say. The report would read 14 pass 4 fail and 10 pass 3 fail as a product failure.
- Repro: node critic/rounds/round-21/cap/pausematrix21.mjs seymour-flux and read run.json rows 4 to 7 (before.targets).
- Evidence: critic/rounds/round-21/evidence/seymour-flux-pausematrix-1600x900/run.json, -pad, -390x844-touch
- Confidence: high
- Requirement: CHK-015 and CHK-016 (state asserted before a row counts)
- Smallest fix: Assert the precondition of each row from the game snapshot (top row, targets 0) and press Esc once to close a stray cursor before the row, or stamp the row UNVERIFIED instead of FAIL; keep OBS-03 itself with the onboarding and interface auditors.
- Acceptance check: Flux matrix reads 18 of 18 on a rerun from the same build.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 113. PR-0376 [polish, harness] PR-0376 (critic tooling, new; R21-PD-03 + gap-pass bug): clip21.mjs threw ReferenceError (Cannot access "path" before initialization) in 21 run.json files, so most clip routes recorded no clips

- Game / chapter: both / ; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Every run started with clips leaves its clip folders.
- Observed: clipError appears 9 to 20 times in 21 run.json files (Flux win, pad, reduce-motion, phone clips, lose-clips, Bahamut win, pad and phone, Sin Fins long, Braska long r2, Evrae, Natus, Omnis, Anima, Ixion, Isaaru, Sin Face and others); clips exist for only nine runs (135 clips, 38 transitions: Braska, Yojimbo, Leblanc, Fallen Aeons, Vegnagun, Den, Yunalesca, Sin Fins), and the runs asked for clips with --clips (Bahamut phone clips, Flux phone clips, lose-clips) hold none. Auditors judging motion or transitions must not count these runs. Merged with the gap pass's own diagnosis: in finish() a local "let path" (the actor's path samples) shadowed the node:path import; renamed to samplePath in the scratch copy (cap/clip21.mjs lines 138-152, not re-run for the phone, pad, reduce-motion and lose routes). The gap pass re-recorded the Flux and Braska telegraph-hold clips and the Bahamut attack and skill-travel clips with it.
- Repro: grep clipError critic/rounds/round-21/evidence/ffx2-bahamut-win/run.json; ls evidence/ffx2-bahamut-win/clips (empty).
- Evidence: critic/rounds/round-21/evidence/*/run.json steps k=clipError; critic/rounds/round-21/evidence/*/clips
- Confidence: high
- Requirement: CHK-016 (evidence the harness proved)
- Smallest fix: Move the path import or declaration ahead of its first use in critic/rounds/round-21/cap/clip21.mjs and re-record the missing clips (a capture-owner step; no product change).
- Acceptance check: A repeat of ffx2-bahamut-lose-clips leaves its clips and no clipError step.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 114. FOC37-03 [polish, interface] FOC37-03 (carried from the focused review, not reproduced): the Ch IV first-run coach tag clips at 2000x1012 for some first actors

- Game / chapter: FFX-2 only / IV Bahamut, 2000x1012, seed 2 (focused review); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Coach and tag stay inside the viewport.
- Observed: Round 20 captured 2000x1012 coaches at seeds 1, 1001 and 1002 (Ch IV, Ch XIII, others): all inside the page (tag right edge near x 525 of 2000 in Ch IV). Seed 2 of Ch IV was not run, so the focused finding neither confirmed nor cleared.
- Repro: Chapter IV, seed 2, 2000x1012, first menu.
- Evidence: critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused.json FOC37-03; critic/rounds/round-20/evidence/ffx2-bahamut-win/10-first-menu-coach.png
- Confidence: low (not reproduced)
- Requirement: CHK-003
- Where: coach tag width (src/ui/coach, not traced)
- Smallest fix: Clamp the coach card and tag to the viewport width.
- Acceptance check: Seed sweep 1-6 at 2000x1012 in Ch IV: tag right edge below the page width.
- Tags: introducedByCandidate true, regressionVsLive true, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 115. PR-0342 [polish, visual] PR-0342 (new; V20-02): Ch IX: a foreign blue tree painting shows over the cavern backdrop for part of the fight

- Game / chapter: FFX only / Chapter IX; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The Cavern of the Stolen Fayth plate and its approved look only.
- Observed: A bright blue-white tree canopy with falling petals appears in the upper right of the cavern battle plate in 13-guide-G (about 5.7 s after the first menu) and faintly behind Yojimbo in 16-target-single; the cavern plate is otherwise a near-black platform. It looks like a crossfade or layer from another room (Macalania woods). Round 19b's Ch IX frames show no tree.
- Repro: As V20-01, then press G at the first menu and screenshot at 2000x1012.
- Evidence: critic/rounds/round-20/evidence/yojimbo-cavern-win/13-guide-G.png, critic/rounds/round-20/vis/yoj13-crop.jpg
- Confidence: medium-low (one run; cause unestablished)
- Requirement: CHK-013 (art judged in the running game); approved art identity
- Where: 13-guide-G (clear), 16-target-single (faint), 2000x1012 seed 1
- Smallest fix: Identify which layer paints the tree (suspected A-7 living-backdrop sky layer or a plate crossfade) and restrict it to rooms that own it; the fix lives with V20-01.
- Acceptance check: No tree or foreign painting at any point of a Ch IX fight in 3 of 3 runs at 1600x900 and 2000x1012.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 116. PR-0320 [polish, visual] PR-0320 (carried): the first-time Rikku coach line is still up over the girls' feet during the held dressphere shot (Ch XIII 2000x1012)

- Game / chapter: FFX-2 only / Ch XIII Trema; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The coach line hidden for the shot and back after it.
- Observed: While the shot label 'Paine Songstress' is up, the pink 'GAUGES RUNNING - A COMMAND HOLDS THEM' tag and the Rikku quote card sit across Paine's shins and feet. The builder's html.mix-held rule hides the coach but the disclosed evidence shows the rule, not the flow; in the natural run it does not hide it.
- Repro: FFX-2 Ch XIII seed 1: first CHANGE with the coach unseen; frames f02-f06.
- Evidence: critic/rounds/round-20/vis/trema-coach.jpg, critic/rounds/round-20/vis/trema-spc.jpg
- Confidence: high
- Requirement: CHK-008
- Where: first CHANGE (Paine to Songstress), 2000x1012, seq-spherechange f02-f08
- Smallest fix: Apply the hide in the code path that raises the coach after the held shot starts (the coach registers its own listener after the shot's class is set).
- Acceptance check: No coach-mark box intersects a girl's painted box in any frame of the shot in Ch IV, XIII at 1600x900 and 2000x1012.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 117. PR-0347 [polish, feel] PR-0347 (new; R20-FEEL-03): at the Den of Woe link-2 seam the camera pushes Yuna out of the left edge by 2.5 s (also in 19b)

- Game / chapter: FFX-2 only / Ch XV Den of Woe, link 1 to 2 seam, 1600x900; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Camera keeps all three girls in frame or cuts away deliberately.
- Observed: seq-seam-2: frames f03-f05 hold the whole party; by f06 (2.18 s) Yuna is at the left edge and by f07 (2.51 s) only her staff and a sliver show while the Gippal line card is up. Same composition in round 19b f07 and in the r19route run, so it is not a regression.
- Repro: Route harness ffx2-den-of-woe seed 1, link 1 won, watch the seam to link 2; frames critic/rounds/round-20/evidence/ffx2-den-of-woe-win/seq-seam-2/f06.jpg and f07.jpg
- Evidence: critic/rounds/round-20/feel-narr/seam-den2.jpg; critic/rounds/round-20/feel-narr/seam-den19.jpg
- Confidence: medium
- Requirement: RUBRIC 6: coherent camera
- Smallest fix: Clamp the seam camera's end pose on the party's leftmost member for this chapter.
- Acceptance check: Den link-2 seam at 1600x900 and 2000x1012: all three girls fully visible at every frame through the first menu.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 118. PR-0346 [polish, feel] PR-0346 (new; R20-FEEL-01, low confidence): under a loaded host the chapter card stays up 3-4 s into the transition after a hurried scene entry

- Game / chapter: both / FFX Ch I, III; FFX-2 Ch IV, XIII, XV (observed slow); most other chapters show the fast path; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Card 0.7 s after a hurried scene and first menu in about 3.2-4.8 s (docs/handoff/r37-scenes.md), at least on a single lane.
- Observed: The hurried entry (PR-0061) gives 3.4-5.2 s to first menu in 23 of 28 runs. In five runs the full chapter card is still on screen 2.75-4.08 s into the hand-over sequence (Flux win f09 at 2950 ms, Braska 3303 ms, Trema 4084 ms then gone at 4533, Bahamut lose 3777 ms, Den first run 2749 ms) and first menu was 5.4, 7.4, 6.3, 4.7 (lose) and 16.9 s. All five started in the first parallel burst (lanes A, B, C, D at 17:37:25Z) or the Den lane with 3 other lanes active; the Den first run alone cost 31 s wall against 19-20 s for the rest.
- Repro: Route harness, fresh profile, hold Enter through the pre-scene, then watch seq-transition-into-battle. Seed 1. Compare critic/rounds/round-20/feel-narr/trprof.py output (luminance 163-175 = card) for seymour-flux-win, braskas-final-aeon-win, ffx2-trema-win, ffx2-bahamut-lose against the fast runs.
- Evidence: critic/rounds/round-20/feel-narr/trprof.py; critic/rounds/round-20/evidence/logs/lanes.log; critic/rounds/round-20/evidence/seymour-flux-win/seq-transition-into-battle/f09.jpg
- Confidence: low (host load vs load-time wait not separated; no single-lane retime)
- Requirement: RUBRIC 4 and 9: a resource-contention timeout is investigated before it is called a game defect; PR-0061 closure needs the claim measured
- Where: src/ui/common/transitions/openingHurry.ts (suspected, not traced)
- Smallest fix: Re-run Flux, Braska, Trema and Bahamut entry alone on one lane and log when the card is dismissed and what it waits on; if it waits on the battle load, nothing to change, otherwise cap the hurried card at 0.7 s.
- Acceptance check: Single-lane entry for the four runs: card gone and first menu under 5.5 s in all four, 3 repeats.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 119. PR-0248 [polish, visual] PR-0248 (carried, not fixed): after a target cancel in Ch VII the Seymour Sensor card sits over Guardian B's torso and robe

- Game / chapter: FFX only / VII Seymour and Anima, single-target step, 2000x1012; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: No panel over a painted figure the player may target next.
- Observed: The 'Guado Guardian A HP ???' Sensor card covers Guardian B's torso and robe while Guardian A is targeted.
- Repro: Chapter VII, Attack, step to Guado Guardian A.
- Evidence: critic/rounds/round-20/evidence/seymour-anima-macalania-win/16-target-single.png
- Confidence: high
- Requirement: CHK-008
- Where: Sensor card placement
- Smallest fix: Add the projected enemy quads to the Sensor card's placement test.
- Acceptance check: Sensor card clear of every enemy box except the target in Ch VII, X, XII.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 120. FOC37-01 [polish, interface] FOC37-01 (carried from the focused review, downgraded major -> polish): the Lady Luck reel overlay is covered by the guide card; unreachable by players (PR-0340) and not reproduced live

- Game / chapter: FFX-2 only (Lady Luck minigame) / not driven in round 20; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The overlay sits above the guide card, or the guide hides while a minigame is open.
- Observed: Reported by the focused review's Lady Luck lane ('reel 1 and the DUD warning half hidden'); not re-reproduced by that review and not exercised in round 20 (no Lady Luck fight was driven).
- Repro: Open the Lady Luck reel overlay with the guide card on.
- Evidence: critic/reviews/cd9dbbb08-focused.json FOC37-01
- Confidence: unverified
- Requirement: CHK-006, CHK-008
- Where: minigame overlay z-order under the guide card at top left (not traced)
- Smallest fix: Raise the overlay above the guide or hide the guide during a minigame.
- Acceptance check: Reel 1 and the DUD warning fully visible with the guide on, 1600x900 and 390x844.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 121. PR-0249 [polish, interface] PR-0249 (carried, re-observed by the chief): the FFX-2 intent card covers the girls at 1600x900; at the whole-party Shell target in Ch IV it stands over Rikku and Paine

- Game / chapter: FFX-2 / IV Bahamut; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: No panel over a face or a weapon.
- Observed: tgt-ffx2-bahamut-1600x900-shell/target.png (c69de96a, seed 1, real keys): the BAHAMUT ACTS NEXT card (x about 490-865, y about 185-500) covers Rikku and Paine almost to the feet while the target brackets frame them; Yuna stays clear. Under the colossus master the girls stand further back than in round 18b's frame, so the overlap reads larger; whether it differs from live 35 at this state is not captured.
- Repro: Seed 1. Ch IV. Yuna White Magic, Shell, target the party.
- Evidence: critic/rounds/round-19b/evidence/gaps/tgt-ffx2-bahamut-1600x900-shell/target.png
- Confidence: high for the observation; unknown against live
- Requirement: CHK-008
- Smallest fix: Add the projected party quads to the intent card's placement test while targeting.
- Acceptance check: Ch IV to VI at 1600x900 and 2000x1012, multi-target and at Yuna's WHITE MAGIC list with E on: 0 px2 between the intent card and any girl's projected head or torso box.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Widened (merged R18b-VIS-01): in Ch IV at 1600x900 the default intent card also covers Rikku's head and Paine's head and torso while Yuna's WHITE MAGIC list is open, which hides Paine's Cursed darkening; the same with REDUCE MOTION on. Intent and camera code are unchanged in this diff.

### 122. FOC28-P02 [polish, interface] FOC28-P02 (carried): The Grand Summon subtitle runs past the panel and is sub-legible on a phone

- Game / chapter: FFX / II and XIV Grand Summon picker, 390x844; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Legible and not clipped.
- Observed: Recorded by the focused review of this same build and still open.
- Repro: See critic/reviews/6ea8528f-focused.md.
- Evidence: critic/reviews/6ea8528f-focused.json (reused, same sha)
- Confidence: high
- Requirement: CHK-003
- Smallest fix: As proposed in the focused report.
- Acceptance check: As proposed in the focused report.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 123. PR-0239 [polish, interface] PR-0239 (carried; R15-IF-09): while a party heal charges, the guide rail's NEXT pick ignores it and disagrees with advisor v3

- Game / chapter: FFX-2 (the rail is shared) / XI Fallen Aeons, Rikku's Mega-Potion charging; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The two panels do not contradict each other about the same turn.
- Observed: The rail says 'Yuna Cura -> Paine' while the advisor card says 'Pray -> the party'. The rail is not in-flight aware.
- Repro: FFX-2 Ch XI, seed 1. Rikku uses Mega-Potion, then Yuna's menu opens.
- Evidence: critic/rounds/round-15/evidence/extras-advisor/run.json cases[1]; extras-advisor-v3-megapotion/02b-next-card-while-Mega-Potion-charges.png
- Confidence: high
- Requirement: Interface: useful advice
- Smallest fix: Feed the rail the same in-flight projection as advisor v3, or hide NEXT while a party heal charges.
- Acceptance check: In the same case, the rail and the card agree or the rail defers.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 124. PR-0246 [polish, interface] PR-0246 (carried): the phone target-confirm button clips 'Attack -> Guado Guardian A'

- Game / chapter: FFX / Ch VII, 390x844 touch, Rikku's first turn, Attack, cursor on Guado Guardian A; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The label fits with no glyph cut (scrollWidth <= clientWidth + 1).
- Observed: 278 px of text in a 270 px skewed button; the element shot reads 'TTACK -> GUADO GUARDIAN'.
- Repro: node critic/rounds/round-17/cap/gaps/ch7-phone.mjs (r2).
- Evidence: D:/Final Fantasy/critic/rounds/round-17/evidence/gaps/ch7-phone-items-confirm-390x844-r2/04-confirm-button-zoom.png, run.json confirm
- Confidence: high
- Requirement: PR-0246 acceptance; CHK-009
- Smallest fix: Wrap the label to two lines, or drop the verb when the name is long.
- Acceptance check: The same repro shows the full 'Guado Guardian A' with the text rect inside the button rect.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 125. PR-0247 [polish, visual] PR-0247 (new; gap pass): at 390x844 Anima's arrival pushes her, her gold 'Anima' tag and Seymour's 'CANNOT BE TARGETED' label past the right edge for about 1 s

- Game / chapter: FFX / VII, battle, Anima's arrival at 390x844 touch; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The approved 'Anima's arrival' tile (A then B) with the name tag and the Seymour label fully on screen, as at 1600x900.
- Observed: At 390x844, for about 1 s of the rise (seq-anima-arrivalr2 f33-f36), Anima sits mostly past the right edge. 'CANNOT BE TARGETED' is clipped to 'CANNOT BE TARGET', and the 'Anima' tag is cut to 'Anim'. By about f40 the framing recentres.
- Repro: Candidate dist-gate, 390x844 touch context (hasTouch, isMobile), setSeed(1), real taps through Chapter VII until the mac-anima-summon trigger; frames every 250 ms.
- Evidence: D:/Final Fantasy/critic/rounds/round-16/evidence/gaps/ch7-390x844-touch-r2/seq-anima-arrivalr2/f33.jpg-f36.jpg
- Confidence: high
- Requirement: visual-targets tile 'Anima's arrival, Macalania Temple (FFX)'; phone framing
- Smallest fix: Clamp the name tag and the 'Cannot be targeted' label inside the viewport on phone, and bias the arrival camera or the phone crop toward Anima's x during the rise.
- Acceptance check: The same capture: every frame from the trigger to +18 s shows both labels unclipped inside 0..390 px.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 126. PR-0250 [polish, interface] PR-0250 (carried, confirmed): the phone results location caption is clipped

- Game / chapter: FFX / Ch XII; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The full caption.
- Observed: 'INSIDE SIN — THE GARDEN C…'
- Repro: Lose or win Ch XII at 390x844.
- Evidence: round-18/evidence/seymour-omnis-win-touch/31-results.png
- Confidence: high
- Requirement: CHK-009
- Where: 390x844 results
- Smallest fix: As in round 17.
- Acceptance check: The caption's scrollHeight <= clientHeight + 1 at 390x844.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 127. PR-0271 [polish, visual] PR-0271 (new; R17-VIS-02): in Ch XVIII, during party actions, the Sin clock note covers Yuna's face and staff for about 1 s

- Game / chapter: FFX only / XVIII Sin: the Face; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: No HUD panel over a face, including during camera moves (CHK-008).
- Observed: When the camera pushes in on a party action, Yuna's head and staff sit under the clock note in 6 of 10 sequence frames (f01-f07) and in 23-midfight at 2000x1012. At rest (1600x900) she is clear, identical to live 31a.
- Repro: Seed 1, XVIII at 2000x1012, fight by real keys. Watch any party command resolve. Frames: sin-face-lose/seq-party-action/f01-f07.jpg, sin-face-lose/23-midfight.png.
- Evidence: critic/rounds/round-17/visual/st-sinface-seq.jpg; critic/rounds/round-17/evidence/sin-face-lose/23-midfight.png; critic/rounds/round-17/evidence/sin-face-win-live31a/23-midfight.png
- Confidence: medium (observed; no live action-frame evidence to compare)
- Requirement: CHK-008
- Where: Sin HUD clock slab (held still while the battle camera moves: commit ffaaa91a, suspected, not traced)
- Smallest fix: Let the Sin clock note fade or shift up while the action camera is pushed in, or anchor it to the head's side of the frame.
- Acceptance check: XVIII at 1600x900 and 2000x1012: a party-action sequence with no frame in which a HUD panel intersects a party member's head.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 128. PR-0276 [polish, interface] PR-0276 (new; R17-IF-05): after a wheel scroll the FFX-2 Item list clips its 'ITEM' header

- Game / chapter: FFX-2 / IV Bahamut; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Header visible, or scrolling inside the rows only.
- Observed: The wheel scrolls the 8-item list by 6 px, and the list header above POTION is cut to its lower edge.
- Repro: Seed 1. Ch IV. Item list by keys, then a mouse wheel of 100 px over the list.
- Evidence: critic/rounds/round-17/evidence/friends-wheelx2-1600x900/02-after-wheel.jpg
- Confidence: high
- Requirement: CHK-009
- Smallest fix: Make the header sticky, or scroll the rows container only.
- Acceptance check: Header box fully inside the list viewport after wheel up and down.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 129. PR-0277 [polish, interface] PR-0277 (new; R17-IF-06, low confidence): the Ch I advisor note reads as contradicting its own pick on a KO'd-Zombie Yuna board

- Game / chapter: FFX / I Seymour Flux; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The order of actions stated plainly (raise, then Holy Water before Mortiorchis's Full-Life). The mechanics belong to the combat auditor.
- Observed: The card reads 'Phoenix Down → Yuna, GUIDE'S PICK … Yuna is still a Zombie — the next Full-Life would kill Yuna again, so cure the Zombie first.' A player reads 'first' as 'before this raise'.
- Repro: Seed 1. Ch I, play until Yuna and Kimahri are KO'd with Yuna zombified, then Tidus's menu.
- Evidence: critic/rounds/round-17/evidence/comfort-seymour-flux-1600x900/11-hud-text-115.jpg
- Confidence: low
- Requirement: CHK-005 (says in plain words what to spend the turn on)
- Smallest fix: Reword the warning: 'then Holy Water her before Mortiorchis's Full-Life'.
- Acceptance check: On the same board the card names the raise, then the cure, in that order.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 130. PR-0286 [polish, interface] PR-0286 (carried, widened): the FFX status message line is drawn over the dialogue banner's text, on the phone (round 18) and at 1280x960 desktop (this round)

- Game / chapter: FFX / Ch I; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The message and the dialogue text do not overlap.
- Observed: 'Tidus became a Zombie.' is printed across the banner line ('Yu… Do not heal him.'), so both are unreadable for the roughly 2 s the message shows.
- Repro: 390x844 touch, Ch I. Play until Zombie lands during a banter line.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json
- Confidence: medium
- Requirement: CHK-008
- Where: 390x844, a status lands while a battle line is on screen
- Smallest fix: Offset the message line below the banner while a line is up, or queue it until the line ends.
- Acceptance check: Message box ∩ dialogue text box = 0 in every 200 ms sample through the Ch I Lance turn at 390x844 and 1280x960, in both games.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Widened by the gap pass (merged R18B-GAP2-06): at 1280x960 FFX desktop, "Kimahri was hasted." (371 px2) and then "Yuna became a Zombie." (568 px2) overlap the visible dialogue text for about 2.5 s (13 samples at 200 ms); no overlap at 1600x900, 2000x1012, 2560x1080 or 3840x2160. On the FFX-2 phone the new floor (withStatusLooks.ts) moves the message clear of the docked hint within one 200 ms sample. The FFX phone had 0 px2 of message over dialogue in 15 samples.

### 131. PR-0288 [polish, interface] PR-0288 (new): the phone help line under the command grid is ellipsised ('TIDUS · Nothing left to say — A one-off action this enc...')

- Game / chapter: FFX / Ch I; status open; build 72973096 (bundle CECt6LNe)
- Expected: The full help sentence, wrapped if needed.
- Observed: 'TIDUS · Nothing left to say — A one-off action this enc…'
- Repro: 390x844 Ch I after Talk is used up, cursor on TALK.
- Evidence: round-18/evidence/probe-seymour-flux-390x844-touch-cand/11-after-tap-on-covered-button.jpg
- Confidence: high
- Requirement: CHK-009
- Where: 390x844 command menu, TALK disabled
- Smallest fix: Allow two lines, or shorten the copy for the phone.
- Acceptance check: scrollWidth <= clientWidth + 1 on the help line for every command row in both games at 390x844.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: RE-OBSERVED round 24 on desktop: with Talk highlighted in Ch III the help slab reads "A one-off action this encounter offers" (src/ui/ffx/commandHelp.ts:101 fallback). Evidence: evidence/braskas-final-aeon-win/25-doublecast.png.

### 132. PR-0291 [polish, interface] PR-0291 (new, status O3): at 1600x900 the red Zombie warning slab overprints the Guide card ('Holy Water -> Yuna' over its first words)

- Game / chapter: FFX / I; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: As in the approved O3 target, both panels are readable.
- Observed: The red slab at y 335 collides with the Guide card's NEXT line ('Holy Water → Yuna' over 'Yuna is a Zombie. A Hi-Potion…').
- Repro: Seed 1 Ch I: Hastega, Phoenix Down on Yuna, then Items > Hi-Potion aimed at Yuna.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/visual/zoom-flux-osrm-d06-guide.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/flux-zombie-1600x900/05-hipotion-aim-zombie-yuna.png; D:/Final Fantasy/critic/rounds/round-18b/visual/cmp-flux-third-menu-r18-vs-r18b.jpg
- Confidence: high
- Requirement: approved target O3 / interface readability
- Where: 1600x900 Items list aimed at a Zombie
- Smallest fix: Anchor the slab below the Guide card's box, or collapse the guide's NEXT block while the warning shows.
- Acceptance check: No overlap between .stwarn and the Guide card rect in that frame.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Re-observed on f302f163 and widened (visual auditor): at 1600x900 with the guide open, the red Zombie warning slab and also the grey TALK help slab ("A one-off action this encounter offers") overprint the Guide card's NEXT "Holy Water -> Yuna" line. Round 18's frame is identical.

### 133. PR-0293 [polish, visual] PR-0293 (new finding): at 3840x2160 the pause painting is not full-bleed (3369x1925 in the 3840x2160 window, dark falloff right and bottom)

- Game / chapter: both / I, IV, VII, XVII, XVIII (every chapter checked); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: CHK-002: the pause painting covers the window at every supported size.
- Observed: Gap pass, fresh context at 3840x2160, all five chapters: pauseRect 3369x1925, CHK-002 rect check fails. 2560x1440 and 2560x1080 are full-bleed.
- Repro: Fresh context at 3840x2160, any chapter, first menu, Esc (gaps res-*-3840x2160 run.json pauseRect).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-seymour-flux-3840x2160/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/res-ffx2-bahamut-3840x2160/run.json
- Confidence: high
- Requirement: CHK-002
- Where: pause layer at 4K (the 3360x1920 master is not scaled to cover)
- Smallest fix: Scale the pause plate with object-fit: cover (or its WebGL equivalent) to the window rect at every size.
- Acceptance check: pauseRect.full is true at 3840x2160 in both games.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: 4K pause not re-graded; see PR-0391 for the 4K battle HUD.

### 134. PR-0296 [polish, interface] PR-0296 (new finding): at 390x844 in Sin XVII the Left Fin FAR plate overlaps the intent line

- Game / chapter: FFX / XVII sin-fins-core, first decisions; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: CHK-008: plates never cover the intent text.
- Observed: Gap pass phone frames by taps: the Left Fin 'FAR' range plate is drawn across the intent card's line.
- Repro: 390x844 touch, Ch XVII, first command menu (gaps/play-sin-fins-core-390x844-touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/contact-phone-sin-anima.jpg,D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-sin-fins-core-390x844-touch/
- Confidence: medium (frames only)
- Requirement: CHK-008
- Where: 390x844 battle HUD
- Smallest fix: Reserve the intent line's band from the range plate on the phone layout.
- Acceptance check: No overlap between the FAR plate and the intent card rect at 390x844 in XVII.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 135. PR-0302 [polish, interface] PR-0302 (new; R18B-IF-01 + R18B-GAP2-02): the cure-hint text falls below the 14 px floor on the phone (head 9 px, body 10.9 px, both games, at every TEXT SIZE), at 1280x960 (10.2 / 12.1 px) and in the 1600x900 head (12.8 px)

- Game / chapter: both / I (Zombie), IV (Curse); any hinted status; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: CHK-003: nothing a player must read under 14 css px at any supported viewport; this card carries "Healing hurts a Zombie" and the cure.
- Observed: Computed effective px (head/body): 390x844 both games 9.0 / 10.9 at TEXT SIZE 100, 115 and 130 %; FFX 1280x960 10.2 / 12.1; 1600x900 12.8 / 15.2; 2000x1012 14.4 / 17.1; 2560x1080 15.3 / 18.2. The FFX desktop hint follows TEXT SIZE (17.5, 19.7 px), the phone hint does not. The frame agrees (a 20-image-px glyph span at DPR 2).
- Repro: critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch [--ts=130]; sO3b.mjs x2 --touch; sO3b.mjs ffx --size=1280x960; read run.json menu.hint.headPx / bodyPx.
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-390x844-touch/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch-ts130/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-1280x960/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch/d02.jpg
- Confidence: high (measured)
- Requirement: CHK-003; RUBRIC section 5 (effective text size)
- Where: src/ui/common/status-o3.css .sthint--phone { font-size: 11px } and .sthint--phone .sthint__head { font-size: 9px } (read; not changed by this candidate)
- Smallest fix: Floor .sthint__head and the body at 14 css px effective (clamp on the stage scale), let the card wrap to two or three lines in the new dock, and let the FFX phone hint follow data-text-size (FFX-2 stays behind the D-220 switch, rule 14).
- Acceptance check: Effective px of the hint head and body at least 14 at 390x844, 1280x960 and 1600x900 in both games, still with coveredFrac 0 on every command row and no overlap with the TIP line or the party chips.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 136. PR-0303 [polish, interface] PR-0303 (new; R18B-GAP2-01): at the FFX phone target step the docked cure hint covers the "Tap another ally to switch · swipe" line (about 98 %)

- Game / chapter: FFX (FFX-2's shorter target card leaves room: 0 px2) / I seymour-flux, a target step with a hinted status (Zombie); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The target-step instructions and the hint do not overlap (CHK-008).
- Observed: 390x844 touch: target card [8,558,374x123], hint [8,685,374x59], tap line [8,727,374x17]: 6,241 px2 of overlap; the instruction ghosts through the translucent card. Same at TEXT SIZE 115 and 130 %. Round 18 saw the same line clipped at this step.
- Repro: Seed 1, 390x844 touch, Ch I: Tidus White Magic > Hastega; Kimahri Items > Phoenix Down > Yuna; decision 3 Items > Hi-Potion; swipe the aim to Yuna (critic/rounds/round-18b/cap/gaps/sO3b.mjs ffx --touch).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/20b-zoom.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-ffx-390x844-touch/run.json (target.phoneTapLine.overHintPx 6241)
- Confidence: high
- Requirement: CHK-008; PR-0282 acceptance (the hint never over the command surface)
- Where: src/ui/common/statusHintCard.ts dockPhone (top = target card bottom + 4), traced by the gap pass
- Smallest fix: Dock below the tap line (top = max(card bottom, tap-line bottom) + gap), or move the tap line above the card while a hint is up.
- Acceptance check: 390x844 FFX Ch I target step with a Zombie ally: hint ∩ tap line = 0 and hint ∩ confirm button = 0 at TEXT SIZE 100, 115 and 130 %.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 137. PR-0304 [polish, interface] PR-0304 (new; R18B-GAP2-03): on the FFX-2 desktop HUD with the guide open, the cure hint disappears at Rikku's and Paine's ATTACK menus while Paine is still Cursed; the guide shows only its "G HIDE GUIDE" chip

- Game / chapter: FFX-2 (desktop, guide open) / IV ffx2-bahamut, the girls' menus after Curse lands; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: While a hinted status is on the party, the hint shows at every open decision, standing alone when the guide panel has nothing to show.
- Observed: At Paine's and Rikku's ATTACK menus the guide panel is blank and .sthint is not visible though Paine carries curse; at Yuna's menus the hint shows inside the guide. On the phone and with the guide folded the hint shows at every decision. The FFX-2 desktop count in the capture owner's run (7 of 10 decisions) agrees.
- Repro: Seed 1, 1600x900 keys, Ch IV: follow the advisor until Paine is Cursed, then keep playing and look at Rikku's and Paine's menus (sO3b.mjs x2 --play --playms=60000 --actorshots --tag=actors).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/40-menu-rikku.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-actors/run.json; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-ts130/15-attack-menu.png
- Confidence: medium (symptom high; cause suspected)
- Requirement: Status O3 target (the hint in the guide's slot); CHK-008
- Where: suspected: src/ui/common/statusHintCard.ts:78-88 puts the card in .sgd__panel whenever the guide is not hidden, even when the panel is collapsed or empty (not traced to the guide's collapse state)
- Smallest fix: Choose the guide slot only when the guide panel is rendered with a size above zero; otherwise use the standalone stage slot.
- Acceptance check: 1600x900 and 2000x1012 Ch IV, guide open: the hint is visible at every open decision while any girl is Cursed.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 138. PR-0305 [polish, onboarding] PR-0305 (new; R18B-IF-02 + R18B-GAP2-07): with BATTLE HELP OFF the FFX-2 command help line goes stale: on the phone it keeps "Open the White Magic menu." for Rikku and Paine, and on desktop the band of the menu open at the switch stays until the highlight moves

- Game / chapter: FFX-2 (the FFX help line follows each actor in both modes) / IV ffx2-bahamut, 390x844 and 1600x900, BATTLE HELP OFF; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The help line describes the acting character's highlighted row, or is hidden at once when BATTLE HELP is off; it never names a menu that character does not have.
- Observed: Phone: in 10 of 10 decisions of play-ffx2-bahamut-390x844-touch-nohelp the line reads "<NAME> · Open the White Magic menu.", including RIKKU and PAINE while ATTACK is highlighted; with help on the same decisions read "Physical damage". Round 18's nohelp frames show the same, so this candidate did not introduce it. Desktop: after BATTLE HELP OFF from the pause, "WHITE MAGIC Open the White Magic menu." stays at the top of the resumed menu until the highlight moves; 8 of 8 later menus show no band.
- Repro: 390x844 touch, seed 1, fresh profile, Ch IV: pause chip, OPTIONS, BATTLE HELP OFF by taps, resume; read the line at Rikku's and Paine's menus. Desktop: 1600x900, at the first menu Esc > OPTIONS > BATTLE HELP OFF > Esc (sO3b.mjs x2 --nohelp).
- Evidence: D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18/evidence/gaps/play-ffx2-bahamut-390x844-touch-nohelp/d02.jpg; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp/10-menu-hint.png; D:/Final Fantasy/critic/rounds/round-18b/evidence/gaps/o3-x2-1600x900-nohelp-actors/run.json
- Confidence: medium (the symptoms are in 20+ frames across two rounds; the cause is suspected)
- Requirement: CHK-004 (a panel that names an action proves the actor has it); CHK-020 (paired flows); RUBRIC onboarding (usable settings)
- Where: suspected: setCommandHelp runs only on a highlight change (src/ui/ffx2/FFX2BattleHud.ts:891-893)
- Smallest fix: Re-run the FFX-2 command help on actor change, on pause close and when battleHelp changes, regardless of the highlight; or hide it when help is off, as FFX does.
- Acceptance check: BATTLE HELP OFF at 390x844 and 1600x900 in Ch IV: the help line matches the acting girl's highlighted row or is absent at 10 of 10 decisions, and no band remains one frame after the pause closes.
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 139. PR-0317 [polish, visual] PR-0317 (new; R19-VIS-05): Seymour Flux's new cast and attack keys (D-328) clip his crown at the frame top at 1600x900

- Game / chapter: FFX only / I seymour-flux, Lance of Atrophy (seq-action-playing f00-f03); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A boss in action stays inside the frame (CHK-014).
- Observed: His hair is cut at y=0 in the action keys; at idle he has about 20 px of headroom and the ENEMY MOVE label sits at his chin.
- Repro: Candidate, seed 1, 1600x900, Ch I, let Seymour act.
- Evidence: critic/rounds/round-19/evidence/seymour-flux-win/seq-action-playing/f03.jpg; critic/rounds/round-19/visual/st-flux-action.jpg
- Confidence: high
- Requirement: CHK-014; CHK-013
- Smallest fix: Fit Ch I framing to the tallest action key, or anchor action keys to the idle's top.
- Acceptance check: Every Flux action frame at 1600x900 and 2000x1012 keeps the crown >= 8 px inside the frame.
- Note: Carried from round 23, not re-observed in round 24.

### 140. PR-0319 [polish, visual] PR-0319 (new; R19-VIS-08, low confidence): Lady Ginnem's background figure now reads as standing in Yojimbo's battle line

- Game / chapter: FFX only / IX yojimbo-cavern, first menu 2000x1012; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Background staging reads as background.
- Observed: Under the colossus master the far-back figure stands on the party's line at party scale.
- Repro: Candidate, seed 1, Ch IX first menu.
- Evidence: critic/rounds/round-19/visual/zoom-yojimbo-small-figure.jpg
- Confidence: low
- Requirement: visual: composition
- Smallest fix: Push the prop deeper or dim it under the colossus master.
- Acceptance check: In the first-menu frame Ginnem sits clearly behind the line or out of view.
- Note: Carried from round 23, not re-observed in round 24.

### 141. PR-0322 [polish, onboarding] PR-0322 (new; R19-ON-01): after ALL OFF the EYE CANDY page heads "0 OF 11 ON" while seven part rows still read ON in about 2:1 grey

- Game / chapter: both / pause > OPTIONS > EYE CANDY; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Rows readable (>= 3:1 for dimmed state text) and not contradicting the head.
- Observed: FOG, SMOOTH EDGES, BREATHING, KO COLLAPSE, CHAPTER FRAMING, OVERDRIVE SHOT and SPLASH ART print ON under dim labels (~2:1); DEPTH OF FIELD OFF + dim ~1.5:1. The battle seam confirms all parts are off.
- Repro: Candidate, 1600x900, Ch I: Esc > OPTIONS > EYE CANDY > ALL LOOKS > Left.
- Evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/14-ec-all-off.jpg; critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900/run.json
- Confidence: high (contrast estimated from JPEG)
- Requirement: D-317; CHK-003
- Smallest fix: Under an OFF look print the part's value as "ON · LOOK OFF" and keep dim text >= 3:1.
- Acceptance check: After ALL OFF at three sizes every row >= 3:1 and no part row claims plain ON.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 142. PR-0323 [polish, onboarding] PR-0323 (new; R19-ON-02): EYE CANDY help lines speak relative to an earlier build ("today's calm camera", "today's splash", "keep today's size")

- Game / chapter: both / pause > OPTIONS > EYE CANDY; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Copy a first-time player understands (CHK-007).
- Observed: CHAPTER FRAMING: "Off: today's calm camera."; SPLASH ART: "Off: today's splash."
- Repro: Open EYE CANDY; move to CHAPTER FRAMING and SPLASH ART.
- Evidence: critic/rounds/round-19/evidence/ecpage-ffx2-bahamut-390x844-touch/run.json (walk[].help)
- Confidence: high
- Requirement: CHK-007
- Smallest fix: Name the thing: "Off: the standard battle camera", "Off: the plain splash".
- Acceptance check: No "today" in the page's help strings; capture at 1600x900.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 143. PR-0325 [polish, interface] PR-0325 (new, medium-low confidence; R19-IF-04): no row of Kimahri's OVERDRIVE submenu reads as selected during the held shot

- Game / chapter: FFX only / I seymour-flux, 1600x900; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The selected row is obvious (CHK-010).
- Observed: 24 still frames: JUMP, MIGHTY GUARD and WHITE WIND are identical gold-bordered slabs; no key was pressed during the sequence.
- Repro: Ch I seed 1: Kimahri Overdrive, press Down twice, capture each step; repeat on live 35.
- Evidence: critic/rounds/round-19/evidence/vis-seymour-flux-1600x900/seq-overdrive-held-shot/f00.jpg..f23.jpg
- Confidence: medium-low
- Requirement: CHK-010
- Smallest fix: If confirmed, give the selected row the filled slab of the main list.
- Acceptance check: Down twice at 1600x900 and 2560x1440 moves a visible highlight (>= 3:1).
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 144. PR-0331 [polish, visual] PR-0331 (new, a question for Bailey): the fail-closed gates take the D-316 colossus master away from Natus, Braska's Final Aeon and Evrae; only Yojimbo and FFX-2 Bahamut keep it

- Game / chapter: FFX only (Ch III, VIII, X) / seymour-natus, braskas-final-aeon, evrae-airship, 1600x900 to 2560x1440; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: D-316 lists colossus presence for the big bosses.
- Observed: At all five aspects Natus, BFA and Evrae render exactly as live 35 (pixel-mean difference 10, 22, 17, mostly HUD text): Natus about 160-190 px tall at 1600x900 against about 470 px in round 19's candidate. Not worse than live; narrower than round 19 promised.
- Repro: Seed 1, first menu of Ch X, III, VIII at 1600x900; compare with gaps/fm-*-live35.
- Evidence: critic/rounds/round-19b/visual/sheet-natus-evrae.jpg; critic/rounds/round-19b/evidence/gaps/plate/seymour-natus.json
- Confidence: high
- Requirement: D-316 scope; RUBRIC visual and feel (boss presence)
- Where: src/engine/fx/mix/framing.ts, plate.ts (gates)
- Smallest fix: Ask Bailey whether Natus should get its master back by steering the Sensor card off the boss (builder's proposal); list the three chapters as "today's framing" in the release notes.
- Acceptance check: Bailey's decision recorded; if steered, Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Natus now stands 346 px tall and clear of his card (D-427); the question for Braska's Final Aeon, Evrae and Yunalesca stays.

### 145. PR-0332 [polish, visual] PR-0332 (new, pre-existing): at 2560x1080 every measured chapter shows plate side bands; worst is Yunalesca (15.4 percent of the plate share, dark pillars and a tilted edge)

- Game / chapter: both (FFX measured in 6 chapters; FFX-2 Bahamut 9.4 percent) / yunalesca, braskas-final-aeon, seymour-natus, yojimbo-cavern, evrae-airship, seymour-flux, ffx2-bahamut; 2560x1080 first menu; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The painted plate fills a 21:9 frame (platform goal 4:3 to 21:9), or the edge is dressed.
- Observed: plate share at 2560x1080, chosen = today: Yunalesca 0.154, BFA 0.103, Natus 0.094, Yojimbo 0.094, Evrae 0.085, Flux 0.034, Bahamut 0.094. No live-35 frame at this aspect; parity rests on the builder's chosen = today measurement.
- Repro: Seed 1, Ch II first menu at 2560x1080; gapcap/plateprobe.mjs.
- Evidence: critic/rounds/round-19b/evidence/gaps/fm-yunalesca-2560x1080/11-first-menu-N-G-hidden.png; critic/rounds/round-19b/evidence/gaps/plate/*.json
- Confidence: medium
- Requirement: RUBRIC section 2 platform goals; visual composition
- Where: plate cover-fit for frames wider than 2:1 (suspected)
- Smallest fix: Cover-scale the plate for frames wider than 2:1 (crop top and bottom) or extend the edge with the existing fog; never repaint approved plates.
- Acceptance check: Plate share 0 at 2560x1080 in all seven chapters.
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 146. PR-0335 [polish, harness] PR-0335 (critic tooling, widened; R20-PD-04 + capture owner): the phone route never uses the FFX list's page buttons, so the intended Poison Fang and Holy Water lines are never taken by touch (Ch I phone defeat 3 of 3, as 19b), and non-battle screens are reached by keyboard

- Game / chapter: FFX only / I Seymour Flux, 390x844 touch; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A touch run reaches any item by the page buttons the phone shows.
- Observed: Three phone attempts end in defeat at 9, 11 and 31 turns; run.json misses list 'Poison Fang' and 'Holy Water' with only the first six rows (Potion to Mega Phoenix) of x27 exposed; the harness fell back to Attack. Product reachability by touch is not shown either way. Three phone attempts (seed 1 and seed 2001) ended in defeat at 9, 31 and 11 turns and 9 turns. The misses list turns 3-7 wanting Poison Fang and turns 1-2 wanting Holy Water; subRows show Potion, Hi-Potion, X-Potion, Mega-Potion, Phoenix Down, Mega Phoenix only, although the pause shows 27 items. Taps were 31 and 167; keyboard fallbacks 38 and 61 (START BATTLE, CONFIRM, RETRY and chapter select were pressed on the keyboard). Capture owner: Wanted Poison Fang, the route took Attack; Yuna down, defeat. Identical 9-turn defeat in round 19b; desktop wins in 73 turns.
- Repro: critic/rounds/round-20/cap/route20.mjs seymour-flux --size=390x844 --touch
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-touch/run.json misses; seymour-flux-win-phone-r2-touch/run.json
- Confidence: high for the harness limit; unknown for the product
- Requirement: CHK-015, CHK-022
- Where: critic/runner/lib/route-ui.mjs chooser.choose (taps visible rows only); product: src/ui/ffx/CommandMenuScroll.ts (6-row window, phone page buttons)
- Smallest fix: Teach the touch chooser to tap the page buttons until the row shows.
- Acceptance check: A touch run plays Holy Water and Poison Fang on the advisor's turn.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 147. PR-0336 [polish, harness] PR-0336 (carried from round 19 unnamed, critic tooling): the save matrix reports a false FAIL for the fresh-profile case

- Game / chapter: both / n/a; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The harness passes a correct default save.
- Observed: save-matrix.json says 23 of 24 and fails fresh-profile; its unexpectedDiffs (version, chapters {}, unlocked [], seenCoach [briefing], flags {}) are the normal default save; looks, parts, volumes, reload and errors are all correct.
- Repro: critic/rounds/round-19b/cap/save-matrix19.mjs
- Evidence: critic/rounds/round-19b/evidence/save-matrix/save-matrix.json
- Confidence: high
- Requirement: CHK-024 evidence quality
- Smallest fix: Make expected("{}") the default save shape.
- Acceptance check: The matrix prints 24 of 24 on an unchanged build.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 148. PR-0337 [polish, harness] PR-0337 (critic tooling, carried): network and console logging gaps; the one console error of the round (net::ERR_CONNECTION_CLOSED, Ch I win) was logged with no URL; the Ch I re-run read 0

- Game / chapter: both / n/a; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Every capture session records requests, status >= 400 and console errors.
- Observed: network-and-console-summary.json: 3,317 requests for 24 route runs and 0 for each of the 53 gap-pass sessions; the 36 save-matrix board shots carry an asserted screen but no verified stamp.
- Repro: critic/rounds/round-19b/gapcap/gaplib.mjs; critic/rounds/round-19b/cap/save-matrix19.mjs
- Evidence: critic/rounds/round-19b/evidence/network-and-console-summary.json
- Confidence: high
- Requirement: CHK-016, CHK-018
- Smallest fix: Record requests and console errors in gaplib.mjs and save-matrix19.mjs; stamp the matrix shots through the route runs' screen assertion.
- Acceptance check: Every 19c session carries a network and console log.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 149. PR-0359 [polish, harness] PR-0359 (critic tooling, carried, cause proved): route.mjs findCard presses ArrowRight at most 16 times, so the 18th tile (Ch XVI Ixion) is never selected; the gap pass reached and won it with 18 presses, so the board is keyboard-reachable

- Game / chapter: both (tooling) / XVI Ixion and Djose, board; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: The harness reaches any of the 18 tiles and labels an outcome from the final results screen.
- Observed: ffx2-ixion-djose-win and -r2 threw 'ASSERT-FAIL card ffx2-ixion-djose got seymour-flux' after 12 s; the walk reaches ffx2-den-of-woe and turns back. Run 3 reached the card and won. Not a product fault: the board has 18 tiles and the cursor moves tile by tile. Related: the route's 'fight' step still labels a chain link's win 'victory' when a later link is lost (PR-0261).
- Repro: node critic/runner/lib/route.mjs ffx2-ixion-djose win --base=<live>, size 2000x1012 (runs 1 and 2 of this round).
- Evidence: critic/rounds/round-22/evidence/ffx2-ixion-djose-win/run.json,critic/rounds/round-22/evidence/ffx2-ixion-djose-win/99-error.png,critic/rounds/round-22/evidence/gaps/ffx2-ixion-djose-win-gap/run.json
- Confidence: high
- Requirement: CHK-016 (a failed wait throws and never screenshots the wrong screen; it did throw)
- Where: critic/runner/lib/route.mjs:84-88
- Smallest fix: Press up to the tile count, and fail loudly when the walk does not find the card.
- Acceptance check: All 18 chapters reach their card in one pass; a chain defeat reads 'defeat' in steps.
- Note: Carried from round 23, not re-observed in round 24.

### 150. PR-0227 [suggestion, encounter] PR-0227 (carried, a question for Bailey, updated): Ch XIII Trema is 0 wins in 26 real-key attempts this round; the shipped bench says 6.5 percent, so the record agrees with it

- Game / chapter: FFX-2 only / Ch XIII Trema; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Bailey's decision whether about 1 win in 15 tries is the intended difficulty, with a shown win flow.
- Observed: Real keys: 4 runs (seeds 1, 2, 3 and drawn), 26 attempts, one link-1 win (attempt 12 of the longest run) and then a loss in link 2; one injected autoBattle run lost. Bench re-run this round: link 1 28/200, Trema fresh 170/200, chapter 13/200 (Wait split), 14/200 (D=0). Nothing here separates the harness from the encounter. Research says every guide calls the Oversoul form easier than the normal Paragon (research/ffx2-trema.md section 4.1); the shipped Oversoul keeps the harder readings of its estimates (OVERSOUL_ESTIMATES defaults), which Bailey chose with 'Trema: 1 and 3 at 3 s'. A first win flow (post scene, reward row, results-to-board) is still unseen on any build.
- Repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/trema-shipped-bench.test.ts; critic/rounds/round-23/evidence/ffx2-trema-win-r4/run.json
- Evidence: critic/rounds/round-23/combat/trema-shipped-bench.log; critic/rounds/round-23/evidence/ffx2-trema-win-r4/run.json
- Confidence: high on the numbers; the difficulty intent is Bailey's
- Requirement: RUBRIC 6 encounter; CHK-022
- Where: src/data/chapter-ffx2-trema.ts, src/data/ffx2/enemies/paragon-oversoul.ts
- Smallest fix: Bailey's call (together with R23-ENC-01). Measure options, never weaken a boss by tuning.
- Acceptance check: A recorded decision, and one real-key victory with results, post scene and board for Ch XIII.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Merged: narrative auditor PR-0227 (Ch XIII victory unreached, STALLED). The bench (13/200, 6.5 percent) and the live record agree; the difficulty intent is Bailey's. Evidence status is PR-0353; the unwinnable retry is PR-0407.

### 151. PR-0306 [suggestion, encounter] PR-0306 (carried, STALLED, a question for Bailey): Chapter XV (Den of Woe) is rarely won at human pace on the advisor route: 1 win in 18 real-key attempts over rounds 20-21 (0 of 7 this round)

- Game / chapter: FFX-2 / Ch XV Den of Woe (Baralai, Gippal, Nooj chain); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Real-key wins in the neighbourhood of the shipped bench, or a recorded reason why not.
- Observed: Shipped bench re-run: first try 48/200 at the live Wait split, within 3 tries 127, within 5 tries 162, Active 1.5 s 18/200 (identical to round 20). Real keys this round: seeds 1 and 1001 plus five attempts (1 to 4001): 7 defeats, some with a link won first (the chain ended in defeat each time). Over rounds 20-21: 1 of 18 against 24 percent first try, P(1 or fewer) about 0.05, a mild shortfall that harness pace may explain; no engine change in release 38 (A/B digests 0 of 120 differ). The gap pass completed the Den of Woe victory flow once under the autoBattle('intended') hook (not human-paced, labelled): win on the third link, post-battle scene, Results (Victory, EXP/AP/Gil, NEW BEST, 2:34), Confirm, scene, back on the board. So the flow works and the results screen reads well; strict CHK-022 still wants a human-paced win.
- Repro: PYREFLY_MEASURE=1 npx vitest run tests/unit/chapters/den-of-woe-shipped-bench.test.ts; critic/rounds/round-21/logs/ffx2-den-of-woe-r2.log
- Evidence: critic/rounds/round-21/evidence/ffx2-den-of-woe-win-r2/run.json
- Confidence: medium
- Requirement: RUBRIC 6 encounter; CHK-022
- Where: src/data/chapter-ffx2-den-of-woe.ts
- Smallest fix: Method check per RUBRIC 8 (same issue open at the same severity for two reviews); a quiet-host human-paced run to separate harness pace from difficulty.
- Acceptance check: A real-key victory with its results screen, or Bailey's note that the difficulty is intended.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Ch XV was won once by real keys this round (seed 2, 5:16); the bench at the human Wait split is 20 of 100. Still a question for Bailey.

### 152. PR-0410 [suggestion, audio] PR-0410 (new, a question for Bailey; merges the gap pass's silent-seam item, which is refuted as a defect): every defeat is silent and Chapter IV's victory results are silent; the Ch III link-2 seam and the Ch II epilogue are silent by script

- Game / chapter: both / all defeats; FFX-2 IV victory; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Observed: No defeat cue exists (THEMES.md has no defeat row; showResults plays music only on a victory): all 9 defeats captured (Ch I lose and touch, Ch II, Ch IV lose, Ch XIII x20 or more, Ch XV) end with playing null at after-fight and results. Chapter IV's victory results are also silent by design (cue map 'none'). The 39.1 title, figure and lunge work did not change this. Gap pass: nothing playing for 3 s at the Ch III link-2 seam and 1 to 3 s after CONFIRM in the Ch II epilogue. The chief read the scripts: src/story/scripts/braskas-final-aeon.ts lines 251 and 280 are music(null, ...) at the "valefor-enters" and "jecht-falls" beats (script-owned silence, the audio auditor cited the same lines), and yunalesca.ts lines 137 to 149 cut the music on purpose before the epilogue. Those two observations are by design and not defects.
- Repro: critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl rows after-fight and results (playing null); ffx2-bahamut-win/audio-debug.jsonl results (playing null).
- Evidence: critic/rounds/round-23/evidence/seymour-flux-lose/audio-debug.jsonl; critic/rounds/round-23/evidence/ffx2-bahamut-win/audio-debug.jsonl
- Confidence: high (the state); the preference is the owner's
- Requirement: CHK-001 scope (defeat jingles); question only, no score penalty
- Where: docs/audio/THEMES.md cue map
- Smallest fix: Ask Bailey whether a defeat should have a cue and whether the Chapter IV victory should play victory-ffx2; build neither without his yes (AGENTS.md rule 10).
- Acceptance check: Bailey's recorded answer in decisions.json; if yes, an audition by ear before it ships (rule 13).
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: REFUTED as a defect: the gap pass's "Silent seam at Ch III link 2 and silent Ch II epilogue" (minor, medium confidence) is scripted silence. What stays is Bailey's question: should a defeat or the Ch IV victory play a cue (THEMES.md has no defeat row).

### 153. PR-0032 [suggestion, onboarding] PR-0032 (carried, a proposal for Bailey): no key remapping, no REDUCE FLASHES row, no colour-vision option

- Game / chapter: both / pause; status open; build 72973096 (bundle CECt6LNe)
- Expected: Optional accommodations.
- Observed: OPTIONS lists no flash reduction, remapping or colour-vision setting; CONTROLS lists keys only.
- Repro: Pause, Options.
- Evidence: critic/rounds/round-23/evidence/seymour-flux-win/14-pause-options.png
- Confidence: high
- Requirement: RUBRIC row 'Onboarding, accessibility and options'
- Where: OPTIONS
- Smallest fix: Expose the existing reduceFlashes flag; ask Bailey about remapping.
- Acceptance check: a REDUCE FLASHES row writes the flag
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: RE-OBSERVED round 24: the live Options page in both games still has no REDUCE FLASHES row, no colour-vision option and no visible remap row (Controls tab not captured). The interface auditor rated this major; the chief keeps it a proposal for Bailey as in round 23 (unbuilt, awaiting his decision, hard rule 10). Evidence: evidence/seymour-flux-win/14-pause-options.png, ffx2-bahamut-win/14-pause-options.png.

### 154. PR-0417 [suggestion, harness] PR-0417 (critic tooling, new; R23-PD-05): concurrent capture lanes inflate frame-time readings (Flux 96 against 26 slow frames, worst 812 ms in the 3-wide queue) and the renderer string is not recorded in the runs

- Game / chapter: both / capture harness; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: RUBRIC section 9: one process owns capture; contention investigated before a spike is called a game defect; frame time on named hardware.
- Observed: runq.sh and runq2.sh ran three jobs and runq8.sh four lanes at once on one GPU; the same chapters read 1.5 to 4 times more slow frames in the queue than in the serial continuity set (Flux 96 versus 26 frames over 34 ms, worst 812 versus 114 ms; Bahamut 2.40 versus 1.35 percent, worst 747 versus 120 ms). run.json records mode gpu but not the WebGL renderer string nor the host load.
- Repro: Compare evidence/<chapter>-win/continuity/continuity.json with continuity/<chapter>-win-r23/continuity/continuity.json, field probe.
- Evidence: critic/rounds/round-23/runq.sh, runq2.sh, runq8.sh; the two probe sets
- Confidence: high
- Requirement: RUBRIC section 9; CHK-016
- Smallest fix: Record WEBGL_debug_renderer_info and a CPU and GPU load sample in each run.json, and take frame-time numbers only from a serial run.
- Acceptance check: Every run.json names the renderer and the load; the report cites only serial frame times.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 155. PR-0396 [suggestion, delivery] PR-0396 (carried, re-measured): the content-hashed bundle is served public, max-age=0, must-revalidate, so a return visit revalidates every file

- Game / chapter: both / hosting; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A hashed asset can be cached for a long time; a question for Bailey.
- Observed: curl of assets/index-B6DQPYhY.js: 200, Content-Encoding br, CF-Cache-Status HIT, Cache-Control public, max-age=0, must-revalidate (same on css, worker, key art, music).
- Repro: curl -I https://echoesofspira.com/assets/index-B6DQPYhY.js
- Evidence: verify-live assetCacheControl field, today 14:41Z
- Confidence: high
- Requirement: CHK-017 hosting
- Smallest fix: Set a long max-age with immutable on /assets/* in public/_headers if Bailey wants return visits to skip revalidation; art and audio need their own policy.
- Acceptance check: A repeat load sends no conditional requests for hashed assets.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 156. PR-0399 [suggestion, visual] PR-0399 (a question for Bailey): the approved Leblanc backdrop tile's picture (crate warehouse, teal door) and its written pick (magenta/cyan, door and heart panel) disagree; the build follows the text

- Game / chapter: FFX-2 / ffx2-leblanc; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: One reference.
- Observed: The approved tile 'The Leblanc Syndicate (FFX-2)' shows a crate warehouse with a teal door; its own text says 'mixed magenta/cyan, visible door and heart panel'. The build (neon heart over a blue door) matches the text, not the picture. Delivery is 'in-progress'.
- Repro: node tools/end-state-board.mjs --pair docs/concepts/chapters/leblanc/renders/backdrop-c.png critic/rounds/round-22/evidence/ffx2-leblanc-win/23-midfight.png
- Evidence: critic/rounds/round-22/targets/leblanc.jpg
- Confidence: medium
- Requirement: RUBRIC 7: waiting on a decision
- Smallest fix: Ask Bailey which of the two he approved; no art change proposed.
- Acceptance check: Bailey's answer recorded in the tile's reaction.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24.

### 157. PR-0400 [suggestion, combat] PR-0400 (new, FFX only): research/ffx-seymour-flux.md row 13 and the Jegged notes still recommend Defend before Total Annihilation while the shipped guide and the engine say Defend halves physical hits only

- Game / chapter: FFX / I; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A labelled conflict in research so the next guide edit does not restore it.
- Observed: research/ffx-seymour-flux.md section 6 row 13 and research/jegged-encounter-guides-ffx-a.md row 1 name 'Shell + Defend'; the shipped guide and WATCH rail now say Defend only halves physical hits, matching research/ffx-combat-core.md 5.1 and the engine (3,855 plain, 3,855 with Defend, 1,925 with Shell).
- Repro: read the two research files against tests/unit/guide-seymour-defend-magic.test.ts
- Evidence: critic/rounds/round-22/combat (source reads)
- Confidence: high
- Requirement: AGENTS rule 6 (sources and their conflicts recorded)
- Where: research/ffx-seymour-flux.md
- Smallest fix: Add a one-line conflict note to ffx-seymour-flux.md row 13 and, if Bailey wishes, check Defend against Total Annihilation in the Steam HD copy.
- Acceptance check: research/ffx-seymour-flux.md row 13 carries a conflict note.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 158. PR-0405 [suggestion, delivery] PR-0405 (R39F-09, carried from the focused review): the title fetches 58 art files before input (live 38: 27); the board alone had requested 96 MiB in the Ixion run

- Game / chapter: both / title, board; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A first screen that asks only for what it draws.
- Observed: Focused review count; this round's Ixion run requested 64 files and 96 MiB before leaving the board.
- Repro: Fresh profile, title, network log.
- Evidence: critic/reviews/c7135bec-focused.json,critic/rounds/round-22/evidence/ffx2-ixion-djose-win/network-media.json
- Confidence: medium
- Requirement: RUBRIC 2 load goal
- Smallest fix: Defer prefetch until the first input.
- Acceptance check: Title requests at most the files it draws.
- Note: Carried from round 23, not re-observed in round 24.

### 159. PR-0299 [suggestion, audio] PR-0299 (new, a question for Bailey): the one-time move of an untouched 0.35 SFX level to 0.70 also moves a player who deliberately picked 0.35 before this release (they cannot be told apart); D-293 marks this half as inferred

- Game / chapter: both / all; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: RUBRIC s7: an inferred item is asked before it is built.
- Observed: The save migration moves an untouched 0.35 SFX level to 0.70, which cannot tell a deliberate 0.35 from the old default (D-293 marks this half as inferred). A question for Bailey, nothing changed in this build.
- Repro: Case sfx-0.35-no-marker-moves in evidence/save-matrix/save-matrix-verdict.json
- Evidence: D:/Final Fantasy/critic/rounds/round-18/evidence/save-matrix/save-matrix-verdict.json
- Confidence: high
- Requirement: RUBRIC s7 inferred items; D-293
- Smallest fix: Ask Bailey whether this is acceptable. No code change unless he says no.
- Acceptance check: D-293's inferred note moves to named, or is reversed by Bailey.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 160. PR-0358 [suggestion, interface] PR-0358 (new; R20-IF-05, a question for Bailey): the phone advisor line names the menu but not the cost

- Game / chapter: both / I (FFX) and IV (FFX-2), 390x844; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: RUBRIC section 2: the advisor says where an action is and what it costs.
- Observed: Re-observed: the phone advisor line names the menu but not the cost.
- Repro: First menu at 390x844 in Ch I or IV.
- Evidence: critic/rounds/round-20/evidence/seymour-flux-win-phone-r2-touch/11-advisor.png; ffx2-bahamut-win-phone-touch/run.json advisorText
- Confidence: medium
- Requirement: RUBRIC section 2
- Where: phone TIP line (covered by tests/unit/advisor-phone-tip-menu.test.ts, which asserts the menu only)
- Smallest fix: Append the MP when it fits on the line; no change if Bailey prefers the shorter tip.
- Acceptance check: Phone tip shows the MP cost for a spell at 390x844 without ellipsis.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 161. PR-0217 [suggestion, combat] PR-0217 (carried): Zombie is kept across a KO (unsourced); the advisor's top-row counts for reviving a KO'd Zombie in Chapters I and II are unchanged

- Game / chapter: FFX / Ch I, II; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A sourced rule.
- Observed: Three-line bench zombie rows unchanged and no status code changed in release 38.
- Repro: ffx-bench.test.ts zombieHealTopRows, zombieReviveTopRows
- Evidence: critic/rounds/round-21/combat/ffx-three-line-r20.json
- Confidence: medium
- Requirement: AGENTS rule 6
- Where: src/battle/ffx status handling
- Smallest fix: Source or label the rule.
- Acceptance check: Research entry exists.
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false
- Note: Carried from round 23, not re-observed in round 24.

### 162. PR-0368 [suggestion, feel] PR-0368 (new, a question for Bailey; R21-FEEL-03, the builder's own): the FFX-2 run-in makes a plain Attack about 1.2-1.7 s long; is that the rhythm he wants

- Game / chapter: FFX-2 only / Ch V, VI; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A judgment, not a defect against any source.
- Observed: Rikku's plain Attack at Vegnagun: menu closes 1.2 s, numeral 2.0 s, home by 2.4 s; engine hold to the next event 1,622 and 1,690 ms for Rikku, 598-984 ms for Paine; FFX-2 turn medians moved -0.4 to +1.4 s against round 20 (Fallen Aeons 7.1 to 8.5). The ATB clock keeps running during it in Active.
- Repro: critic/rounds/round-21/evidence/ffx2-vegnagun-shuyin-win/clips/attack-2, ffx2-leblanc-win/clips/attack.
- Evidence: critic/rounds/round-21/feel-narr/veg-attack.jpg
- Confidence: high on the numbers
- Requirement: AGENTS rule 10 (ideas need a yes)
- Smallest fix: None until Bailey answers (D-354 ask 5 leaves the run home, 0.27-0.39 s of it, open). Nothing to build without his yes.
- Acceptance check: Bailey's reaction recorded in the tile.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 163. PR-0297 [suggestion, target-registry] R18-TGT-01: the picks-0929 tiles are stale against what the candidate ships

- Game / chapter: both / docs/target/targets.json group picks-0929; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: Each tile names its target frames and delivery state, and every adopted perceivable pick has a tile (RUBRIC §7).
- Observed: All five tiles still say delivery 'in-progress' and 'not built yet', although decisions.json marks D-287..D-291 implemented. The eye-candy D tile has no src (its frames are now on main in docs/concepts/eye-candy-2026-09-29/d/stills and d/phone). The Sphere Grid tile says 'Not B' and has no companion tile for D-295 (B adopted and shipped).
- Repro: Read docs/target/targets.json group picks-0929 against docs/target/decisions.json D-287..D-296.
- Evidence: D:/pyrefly-rel26c/docs/target/targets.json (git diff 1a6fd3cc..65152c1b); docs/target/decisions.json D-295
- Confidence: high
- Requirement: RUBRIC §7 (delivery field, required targets)
- Smallest fix: Give the eye-candy tile src d/stills/ch1-seymour-flux-rest-on.jpg, set each tile's delivery to implemented, and add a Sphere Grid B tile (option-b-layout.jpg, option-b-phone.jpg).
- Acceptance check: node tools/end-state-board.mjs renders a tile with a src for every picks-0929 pick, including Sphere Grid B.
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature undefined
- Note: Carried from round 23, not re-observed in round 24. Round 23 note: Carried from round 18, not re-tested on f302f163: the code, data and assets it depends on are unchanged in 65152c1b..f302f163, so round 18's observation stands.

### 164. PR-0329 [suggestion, interface] PR-0329 (question for Bailey): an upgraded save that had a look OFF keeps all its new parts OFF when the look is turned back ON

- Game / chapter: both / pause > EYE CANDY; status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: As adopted in D-317 ("players who had a look off keep the new parts off").
- Observed: A release-35 save with CINEMA LIGHT off: turning it ON shows DEPTH OF FIELD, FOG and SMOOTH EDGES all OFF. Matches the rule; listed because a player may expect the look to come back whole (inferred, undecided).
- Repro: Seed the r35 slot (release-35-handmade-light-living-off), Ch I, Esc > OPTIONS > EYE CANDY > CINEMA LIGHT > Right.
- Evidence: critic/rounds/round-19/evidence/ecpage-seymour-flux-1600x900-upgraded-r35/12c-ec-upgraded-look-turned-on.jpg
- Confidence: high (behaviour); taste question
- Requirement: D-317; RUBRIC section 7 (inferred items never fail a build)
- Smallest fix: None unless Bailey wants it.
- Acceptance check: Bailey's answer recorded.
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true
- Note: Carried from round 23, not re-observed in round 24.

### 165. PR-0338 [suggestion, harness] PR-0338 (new, test harness): tests/unit/strategy-ffx2-bahamut.test.ts "heal-only route" takes about 10.8 s against the 15 s limit and timed out once on a loaded machine

- Game / chapter: FFX-2 / n/a (unit test); status open; build carried (last observed d3fe9fe5 (bundle B6DQPYhY))
- Expected: A unit test well inside its time limit.
- Observed: 324-file subset run: 1 failure, a timeout; re-run alone 19/19 pass in 11.8 s.
- Repro: npx vitest run tests/unit/strategy-ffx2-bahamut.test.ts on a loaded host
- Evidence: critic/rounds/round-19b/combat/vitest-combat-subset.txt
- Confidence: high
- Requirement: test reliability
- Smallest fix: Give that case its own timeout or fewer seeds.
- Acceptance check: The case passes inside the subset run under load.
- Note: Carried from round 23, not re-observed in round 24.

## Next review

The deep obligation of 72973096 stays pending: mandatory checks CHK-001, CHK-003, CHK-008, CHK-016, CHK-026 and CHK-027 FAIL, CHK-002, CHK-004, CHK-005, CHK-006, CHK-007, CHK-009, CHK-013, CHK-015, CHK-022, CHK-023 and CHK-B1 are UNVERIFIED, four categories carry no number and the required coverage above was not all tested, so critic-clear settles nothing and the debt moves to the next build. Next batch, critic tooling first (no Bailey decision): fix whole-label target matching in the route and rerun Ch II seeds 1 to 5 (PR-0397); a detached continuity run and typed-word entry (PR-0431); run Leblanc alone on 931613a8 and 72973096 to answer the PR-0379 regression question. Product batch, after Bailey's answers: PR-0421 and PR-0333 (the Ch IV camera and phone view), PR-0424 and PR-0425 (docs and the stereo choice), PR-0279 (Sin: Face), then PR-0378 to PR-0380.

## Hygiene

The chief opened no browser and started no server and no long-lived process. The PAUSE file D:/Tools/pyrefly-overnight/PAUSE was absent when the chief looked (06:19), so the overnight art runner is not held. Another review (focused 2ae1a9e4) is running its own vite preview on port 5471 and continuity harness from D:/pyrefly-r3945: not the chief's, left alone.

Wall clock from the first PAUSE file (02:56 local) to the report (about 06:25): capture owner about 85 minutes, the continuity shards and the gap pass about 4 hours of serial browser time in the background, the six auditors and the fan in parallel (45 to 150 minutes each), then the chief about 55 minutes. The chief recovered the auditors' full records from the workflow journal because the prompt carried them truncated (critic/rounds/round-24/chief/res-*.json), re-ran the continuity aggregate from the 18 per-chapter continuity.json files (no browser), traced PR-0397 in run.json and read the Ch IV camera and phone frames. Repeated work avoided: CHK-025 and the Ch I harness reused with dependency arguments.

## Clear output (critic-clear, verbatim)

```text
  still pending focused: mandatory checks are UNVERIFIED: CHK-002, CHK-004, CHK-005, CHK-006, CHK-007, CHK-009, CHK-013, CHK-015, CHK-022, CHK-023, CHK-B1
  still pending deep: required coverage was not tested: CHK-022: a real-key win in Ch II (PR-0397: the route cannot revive Yuna), Ch XIII (PR-0353, seventh review), Ch XV (PR-0306) and Ch XVIII (PR-0279); Ch XIII link-2 retry; Ch V fourth-fight defeat., CHK-002: the six-viewport pause matrix with rect, currentSrc and scrollWidth measurement., CHK-003 and CHK-009: a DOM font-size and ellipsis sweep at 1280, 1600, 2000, 2560 and 3840 and on the phone., CHK-004, CHK-005, CHK-006, CHK-010: the full advisor, broken-board, overlay-exit and multi-target proofs in the browser., CHK-013: the new art (Gui parts, Experiment, guest Seymour) judged against the written rubric; the Bahamut wing rim traced to the painting or the matte., CHK-015: Esc and P inside a submenu, while targeting and during an animation; a real gamepad and touch paths., CHK-023: Seymour's Requiem, the Experiment's Annihilator and an Overdrive or chain-seam clip., CHK-B1 and CHK-B2: Bailey's ear and play judgments., Delivery: first-load time and frame-time measurement; prep: the preparation tabs.
```
