# Round 26: deep review of candidate b24614c05 (release 55, before deploy), against live r54 4f4dc77bc

```text
Build / artifact / target version: b24614c05 (candidate, bundle index-DyWSjMya.js, manifest hash 9df74a5d2c79c176..., 5,657 files) / not yet deployed / targets ba8a7e74a9d6
Review: deep (save-data class, before deploy)
Deployment: NOT APPLICABLE (candidate not deployed)
Changed area: FAIL (CHK-026 and CHK-027 FAIL on measured evidence; PR-0460 confirmed in a new feature; save class, titles, voice routing and the Grand Summon fix met their targets)
Ship: SHIP. No critical defect was found and none is introduced or left reachable by this change; no issue is a regression against live r54 (the three-chapter live comparison has the candidate better on CHK-027, 4 swap jerks against 10; the possession-link Summon rows draw an inert menu where live drew a Switch row, so nothing that worked live stopped working). Majors this release discloses: PR-0380, PR-0379, PR-0459, PR-0460, PR-0295, PR-0148, PR-0099, PR-0461, PR-0421
Milestone: not assessed
Quality: provisional, no weighted total (audio, onboarding, prep, delivery UNVERIFIED); scored: combat 9.5, encounter 8.9, visual 8.6, feel 8.3, narrative 8.7, interface 8.2; last full score: round 24/25 history, not comparable here
Targets: required 51 / matched 35 / failing 0 / unverified 15 / waiting 1
Top issues: PR-0380, PR-0379, PR-0459, PR-0460, PR-0295, PR-0148 (see the ranked list)
Coverage: see the matrix below; required work not done is listed under "What stands between this build and acceptance"
Next required review and why: deep settlement after the deploy on the live build (this report cannot settle it: mandatory checks UNVERIFIED and required coverage not done)
Elapsed review time / repeated work avoided: see the final message; the specialists' captures and audits were reused as the review's evidence, nothing from the 2026-10-14 build was reused without a dependency argument
```

## Score output (verbatim)
```text
score: PROVISIONAL — no verified score for audio, onboarding, prep, delivery (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, narrative, interface
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio, onboarding, prep, delivery
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - mandatory check CHK-001 is UNVERIFIED
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-015 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-023 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 9 critical or major issue(s) remain open
  - encounter braskas-final-aeon has no complete real-input flow
  - encounter isaaru-via-purifico has no complete real-input flow
  - encounter sin-face has no complete real-input flow
  - encounter mirror-aeons has no complete real-input flow
  - encounter last-summoning has no complete real-input flow
  - encounter pilgrimage-prototype has no complete real-input flow
  - 15 required target(s) unverified
  - 1 required target(s) waiting
  - only 35 of 51 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix, the two chapter-select alternates and the 222 voice lines (CHK-B1, PR-0148, PR-0099, PR-0470)
  - human judgment not recorded: Voice: does the cloned cast read right under the music at default sliders, and is three speakers voiced enough (PR-0470)
  - human judgment not recorded: Voice provenance: a decision row for the Fish clones and Bailey's statement of permission (PR-0472)
  - human judgment not recorded: Visual: is the Rikku colour correction acceptable in play across all eight dresspheres (the delegated strength pick)
  - human judgment not recorded: Feel: Bailey's play of the KO dissolve, recoil, blends and camera cuts (CHK-B2, PR-0437, PR-0473)
  - human judgment not recorded: Accessibility: does COLOUR VISION help a player with a colour weakness (CHK-B3 style judgment)
  - human judgment not recorded: Encounter: human-pace target for FFX-2 V, XIII, XV, the Chapter IX random-play question and whether hidden chapters should punish credible mistakes (PR-0227, PR-0447)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

`critic-clear` output (verbatim):
```text
critic:clear no pending marker for build b24614c05: kept as candidate evidence
```

## Ship decision
**SHIP.**
- No critical defect was found and none is introduced or left reachable by this change; no issue is a regression against live r54 (the three-chapter live comparison has the candidate better on CHK-027, 4 swap jerks against 10; the possession-link Summon rows draw an inert menu where live drew a Switch row, so nothing that worked live stopped working).
- The save-data class passed in a browser: 14 older saves and the save live r54 wrote load with the four new settings at their defaults, keep every chapter, best time, unlock and setting, and keep the new choices through a reload and a second tab; garbage, truncated and blocked storage boot cleanly (CHK-024).
- Grand Summon naming a KO'd aeon was a live trap (the whole Overdrive spent, the turn lost); the candidate refuses it: a fixed defect, and the engine benches (2,400 FFX and 700 FFX-2 plays) are identical to live in outcome and turns.
- PR-0459 (CHK-026 FAIL) is carried, not new: the chief's own live r54 run of Macalania, Leblanc, Fallen Aeons and Yunalesca gives the same FAIL with the same sizes; Braska, Isaaru and Trema were not measured on live, so its tags stay unknown, and unknown holds only a critical.
- PR-0460 sits inside the RE parity switches that Bailey turned ON for this release (menu draw, roster removal); the repository rule treats a new-feature defect as non-blocking, and Bailey may switch those items off if he prefers the live menu (a Switch row and no Summon row) in the possession links.
- PR-0380 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0379 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0459 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0460 (major) is inside a brand-new feature: it does not block, and that feature ships switched off
- PR-0295 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0148 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0099 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0461 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced
- PR-0421 (major) is disclosed in the release announcement and carried into the next batch: it is neither a regression nor a critical this change introduced

Majors the release announcement must disclose (not regressions; carried into the next batch):
- PR-0380 (major, feel): figures and some bosses jump 40 px or more in one frame at pose swaps and entrances
- PR-0379 (major, feel): every pose change is a dissolve, for 3 to 8 frames two poses of one figure are drawn at once
- PR-0459 (major, visual): the continuity harness finds a painted figure moving its own stance or drawing outside its height band at pose swaps in several chapters
- PR-0460 (major, combat): Chapter III possession links 3 to 6 draw every remaining aeon as a greyed Summon row, and Enter on one does nothing
- PR-0295 (major, interface): heavy party-prep tabs are a desktop frame shrunk onto a 390x844 phone, text about 3 px
- PR-0148 (major, audio): no numeric owner listening score for the shipped mix, and now none for the two chapter-select alternates or the 222 voice lines
- PR-0099 (major, audio): eleven chapters still play borrowed or stand-in scene beds or battle cues
- PR-0461 (major, coverage): four chapters have no real-key victory in this review, so the milestone gate CHK-022 stays open
- PR-0421 (major, visual): the Ch IV wide camera pull may show the backdrop plate edge

Verdict notes:
- **changedArea**: FAIL, not UNVERIFIED: two mandatory checks of the changed area FAIL on measured evidence (CHK-026, CHK-027) and one new-feature menu defect is confirmed (PR-0460). The save-data class, the title and PRESENTATION screens, the voice routing and the Grand Summon fix met their targets. A FAIL here does not hold the build: see shipReasons.
- **deployment**: The candidate is not deployed. After the deploy: node tools/artifact-manifest.mjs verify-live must equal artifactHash 9df74a5d...; the deploy runs tools/art-browser-load.mjs.
- **obligation**: This report cannot settle the deep obligation: mandatory checks CHK-001, 002, 006, 015, 022, 023 and B1 are UNVERIFIED and the coverage block lists required work not done, so critic-clear will refuse to settle it. It is valid evidence for the ship decision.

## How the evidence was gathered, and its limits
- Browsers: headless Playwright from node scripts, `PYREFLY_BROWSER=gpu` (real GPU, no black canvas, no fallback) for the capture owner, the continuity harness and the chief's own save runs; no Claude-in-Chrome and no built-in browser pane was used by the chief.
- The candidate was built from `D:/pyrefly-release55` into `dist-gate` with `BASE_PATH=/` and served by `vite preview` (127.0.0.1:5611 by the capture owner, 5731 by the orchestrator). The chief started no preview server; it used 5731 read-only and ran the live comparison against https://echoesofspira.com/ (live r54).
- Evidence of 2026-10-14 (build b8aa6f96) sits beside this round's in `critic/rounds/round-26/` (the root `evidence/*` folders, `gaps/`, `gates/`, `pd/`, `audio/`, `audit-combat/`); the specialists did not use it except where the report labels it reused. The continuity harness writes folders named `<chapter>-win-r26`, the same names as the old run, so a strip folder can hold the old build's strips: the dedicated run of this review overwrites them chapter by chapter, and `fallen-aeons` was refreshed only late. The first-time fan read some strips before they were refreshed; its breakers are labelled carried (PR-0379, PR-0473).
- Injected state is labelled wherever it was used: `setSeed`, the Chapter III KO and gauge injection, `autoBattle` for the Pilgrimage stop-1 fight, `markCoachSeen` on the phone Pilgrimage run, `gotoChapter`/`trigger` in the chief's reload-in-battle and results cases.
- The chief's own runs: the save-class edge cases (`chief/save-edge.mjs`, `save-edge2.mjs`), the live r54 continuity baseline (`continuity-live-r54/`), the continuity aggregate (`chief/aggregate.mjs`, the harness's own `--only-aggregate`), and the pause-shape matrix (`chief/pause-matrix.mjs`).

## The ten categories
### combat: 9.5
Auditor combat, round 26 re-run on candidate b24614c05 (r55) against live r54 4f4dc77bc; no browser, no server started. EVIDENCE NOTE: the index named in the brief (critic/rounds/round-26/evidence/index.json) is the stale 2026-10-14 capture of an older build; the r55 capture is evidence/r55/index.json (ts 2026-10-18) and is what I read. The old audit-combat/ folder (r47 trees) was NOT used. WHAT CHANGED IN MY AREA: code-only diff of the 60 modified src/battle + src/data files vs live: 42 comment-only (every FFX-2 file, every kernel file), 18 code changes all FFX-only (commands.ts, formation-commands.ts, aeons.ts, aeon-duel.ts, pickerParams.ts, engine.ts, hit-apply.ts, ai/index.ts, ai/seymour-flux.ts, types.ts additive optional fields, 3 Chapter III/Last Summoning/Biran data files, 3 guide texts) plus 8 new FFX-only modules (menu-draw-parity, roster-removal, submit-guard, target-step-parity, grand-summon-ko, immune-status-miss, kernel/target-words, possessed-script-locks); tsc --noEmit exit 0; orphans: 24 pre-existing, none new; all 8 modules have importers; CONTRACT-CHANGES entries exist for the types.ts fields. DATA AUDIT (every changed value r54->r55): TARGET_WORDS 339/339 equal an independent read of the game's own raw item and command tables (D:/Tools/rea jppc kernel item.bin and command.bin, record stride 96, u16 at +0x1A; rawtargetwords.mjs) and equal the two in-repo tables; Biran and Yenke Kimahri Switch (0x3002) and the possessed-aeon slot ids 8 to 17 equal the formation fixture and research/re-ffx-biran-yenke.md line 104 and re-ffx-last-summoning.md section 2; Yu Yevon HP 99,999 / MP 1 per research; Chapter III rosterRemoved model (link N loses aeons 1..N, Yu Yevon all five) equals the field-event description (removePartyMember before each link); the FFX-2 side of the release has no value change (Angra and Valefor fixtures only dropped raw bytes, decoded values untouched). Independent re-derivation of unchanged high-risk mechanics from research/ffx-combat-core.md: 478 checks, 0 mismatches (CTB tick for all 255 Agility values, Haste/Slow and rank linearity, the 14-point mitigation table, 21 physical-damage cells, 17 magic-damage cells, kernel.probe.ts, run on candidate and live); FFX-2 ATB speeds (Normal 95 -> Haste 99 / Slow 47, Slow 70 -> 73/35, Fast 120 -> 126/60, hit reaction halves, stop states) and recovery cost*10000/(AGI+1): 68 checks, 0 mismatches; 206 FFX-2 command rows (2,884 fields) in the parity fixture equal the raw tables, 0 differences; 32 of 43 Rikku Mix example pairs from research 5.9 resolve to the named result in the engine's chart, 0 mismatches (11 not testable, items not shipped). BENCHES vs LIVE: 12 FFX chapters x 200 fresh seeds (5001-5200) on the shipped intended line: 2,400 of 2,400 plays identical in outcome, turns and KOs; FFX-2 7 chapters x 100 seeds: result JSON byte-identical; per-link chain probe (120 seeds, Chapters III, XIV, XVII, XXVII): identical in every field, 0 refused submits, 0 stuck; hidden chapters (Sinspawn Gui, Biran and Yenke, Last Summoning, Evrae fayth) x 60 seeds x intended/random/attack: identical; credible mistakes (attack-only and random, 12 chapters x 40 seeds): identical to live, 0 throws, 0 invariant breaks, 0 rejected picks, wins only in Yojimbo random (10/40, as live). THE ONE BEHAVIOUR CHANGE THAT MOVES PLAY, proved by running both trees: Grand Summon naming a KO'd aeon: live spends the whole Overdrive gauge (100 -> 0), emits 3 events and loses Yuna's turn; candidate refuses (0 events, gauge 100, turn kept), the picker draws the aeon greyed and another aeon still comes (5 events): a live trap fixed. Roster removal: candidate lists Ifrit/Ixion/Shiva/Bahamut in link 2 down to none in link 5 and Yu Yevon with Grand Summon greyed; live lists all five everywhere. Immune-status miss: only adds `miss reason immune` events (the four goldens return to their r54 digests with the switch off; I saw 14 in the real Yunalesca log, 1 in Macalania); a fuzz of 51,782 forked row submissions over 15 FFX chapters found it on friendly targets only for an aeon's Defend row (see issue). Suites: full unit suite on the candidate 1,481 files: 1,455 passed, 25 skipped, 1 failed = advisor-floor 'holds across 3. Braska' timing out at the 15 s limit under load, passes alone in 9.5 s (23/23); 23,358 tests pass; 13 targeted r55 files 254/254; ffx-engine-golden, ffx2-atb-golden, ff7-golden green. Real-input evidence read: Yunalesca first menu (Flee and Escape greyed, no Talk), Chapter III Tidus keeps Talk, FFX-2 menu has none of the FFX-only rows (CHK-021 absence), KO'd Valefor greyed and refused by real keys (gauge stays 100, Ifrit comes). WHY NOT HIGHER: PR-0383 (aeon Defend row, carried; now shows IMMUNE over the player's own aeon), PR-0452 stale comment (types.ts:207), PR-0451 (boss Silence enforcement) still has no balance measurement; roster removal in links 2 to 7 and the Last Summoning taken-aeon rows have no real-key capture (CHK-023 gap; the route bot loses Chapter III link 1 on both builds, FOC54-007). PR-0427 (reactions for a sleeping holder) appears fixed by the counter chain (counter-chain.ts reactionCanAct, pinned by parity-ffx-engine-counters) and can be closed. No critical or major defect introduced or left reachable; no regression vs live. [Chief: held at 9.5. The combat auditor re-derived 478 + 68 mechanic checks and 2,400 paired plays with 0 differences; the chief confirmed the one behaviour that moves play (Grand Summon naming a KO'd aeon is now refused, a live trap fixed) in the owner's real-key capture, and adds PR-0460 (the possession-link Summon rows) as a new-feature defect that does not change what the player can do.]

### encounter: 8.9
Auditor encounter, round 26 re-run on b24614c05 vs live r54. No enemy stat, AI script, phase rule, party preset or chapter definition changed in r55 (diff over src/data/encounters.ts and src/data/ffx2 is comment-only; FFX data changes are the Biran/Yenke Switch lock, Chapter III rosterRemoved and the Last Summoning removed flag, all sourced). Boss stat spot-check against research (Flux 70,000, Yunalesca 24,000, Braska 60,000, Natus 36,000, Isaaru's Grothia 8,000, Pterya 12,000, Spathi 20,000, Yu Yevon 99,999): consistent. Win rates of the shipped intended line over 200 fresh seeds, identical on live and candidate: Flux 200, Yunalesca 180, Braska's Final Aeon 197, Macalania 189, Evrae 194, Yojimbo 196, Natus 190, Omnis 174, Isaaru 180, Sin Fins and Core 178, Sin Face 200, Mirror Aeons 148 (74 percent); FFX-2 (100 seeds) Bahamut 100, Vegnagun and Shuyin 93, Leblanc 100, Fallen Aeons 100, Trema 58, Den of Woe 100, Ixion 100 (identical JSON). Credibly wrong lines (40 seeds): attack-only 0 wins in every FFX chapter (Sin Fins stalls, as live), random 0 except Yojimbo 10/40. NEW OBSERVATIONS on hidden chapters, identical to live: the Last Summoning is won 60/60 by the intended line, by random legal play and by attack-only; Biran and Yenke is won 54/60 by random play (attack-only 0/60); Sinspawn Gui and the Evrae fayth chapter lose to random and attack-only. Chapter III under a credible alternative tactic (hold the aeons in link 1, then call any aeon the menu offers, 150 seeds): same 137/150 wins on both trees; the removal makes the possessed-Bahamut link 20.4 -> 47.7 turns and Yu Yevon 5.9 -> 8.4, whole chapter +14 percent (195 -> 224), matching the release note's 'about a tenth' at chapter level. Real-key wins in the capture: 13 of 18 chapters; none for Chapter III, XIV (Isaaru), XVIII (Sin Face), XXVII (Mirror Aeons) (route bot cannot drive the r54 two-pick Doublecast, FOC54-007; live identical) and Chapter XIII (Trema, route lost seed 1, bench 58/100, PR-0227); the engine line wins those chapters, so this is a harness and Bailey-decision limit, not a candidate regression. Carried and unchanged: PR-0227/PR-0407 (FFX-2 V, XIII, XV at human pace, Bailey decides), PR-0447 (random wins Yojimbo), PR-0257, PR-0448. Held at 8.9: five chapters without a real-key win, the hidden chapters that do not punish credible mistakes (question for Bailey), the unchanged FFX-2 difficulty questions.

### visual: 8.6
Provisional 8.6 for the tested scope; I opened no browser (read only the capture owner's evidence under critic/rounds/round-26/evidence/r55, PYREFLY_BROWSER=gpu is the owner's mode). Scope read: all 19 chapters at 1600x900 (title, board, prep, first menu, mid-fight frames), Ch I and Ch IV at 2000x1012 and 390x844, the new front-end screens (both titles, CHANGELOG, PRESENTATION page) at 1600x900 and 390x844, Pilgrimage screens at 1600x900, the Kimahri nine-pose contact sheet, the Kimahri and Lulu rig first-menu frames, and the continuity harness on the three chapters it finished for this build (biran-yenke, sinspawn-gui, seymour-flux; candidate base 127.0.0.1:5611) with the live r54 harness as comparison. (1) Approved art intact: verify-approved.mjs with ROOT=D:/pyrefly-release55 reads 917 ok (approved plus judge-locked), 0 mismatched, 0 missing (the default root D:/Final Fantasy is a stale tree: 741 ok, 19 mismatched, 47 missing, not the shipped source); art-derive verify and audit PASS (gates/art-verify.log, art-audit.log). (2) Target gate: 51 required, 35 matched, 0 failing, 15 unverified, 1 waiting; composites in critic/rounds/round-26/targets/ (made from r55 captures; the 2026-10-14 composites are kept in targets-stale-1014 and were not used). (3) New in this build and judged by what the player sees: The Farplane title renders the approved Gullwings painting with the ink slab and the build number correctly; The Echo title (Yuna kneeling in water) renders cleanly at both sizes with the slab hiding the in-painting lettering only in the sense of its own wordmark; CHANGELOG and PRESENTATION panels are legible with no clipping at 1600x900 and wrap acceptably at 390x844. Kimahri (Ch I Biran and Yenke, Seymour Flux) and Lulu (Sinspawn Gui) are recognisable in every pose read, stand on the ground in idle and ready, and their KO collapses in place; the harness shows the rig REMOVED the pose-swap jerks that live r54 had for these two figures (live: Kimahri feet 63.4 and 59 px, Lulu head 48.3 and feet 42 px; candidate: none for Kimahri or Lulu; swap jerks over 40 px fell from 10 to 4 across the two comparable chapters, snaps 0 per minute in both). CHK-026 PASS on the three chapters it ran (0 swaps over tolerance, worst registered head 0.2 percent, worst feet 0.9 px). (4) What holds the score below 9: CHK-027 still FAILS on every chapter it ran (4 swap jerks of 40 px or more in Sinspawn and Flux: Auron 194 px on a 238 ms frame hitch at the link seam, Tidus head 41.7 and 52.9 px inside the Overdrive flash, Gui feet 40.6 px in a crossfade; the same classes as live r54, none introduced); the continuity harness did not run for 16 of 19 chapters on this build, so size and motion continuity there are UNVERIFIED, not passed; carried polish from round 25 is still visible (first-time cards and the coach slab stand over painted figures in Ch XVII and the Biran and Yenke first menu, PR-0366; Bahamut wing rim PR-0423 still reads at 2000x1012; Leblanc backdrop disagrees with the written pick, tile 35 waiting). Rig frames are not measured by CHK-026 because a rigged figure has no swaps: Kimahri's rig measure shows frame-to-frame feet moves up to 6.8 percent of idle height inside the ready key and a settled follow stature of 1.29, which the harness reports but does not gate and which I could not judge without strips (capturesNeeded). Sub-score caps (RUBRIC 6a): CHK-026 not FAILING so none on characterModels or animation; snaps per minute 0 so none on animation; an UNVERIFIED check puts no cap. Not scored down: the approved paintings. [Chief: held at 8.6, the auditor's number, although the continuity run that finished after the auditor returned adds CHK-026 FAIL in Yunalesca, Braska's Final Aeon, Macalania, Leblanc and Fallen Aeons (PR-0459). The chief did not lower the score on that alone because the live r54 baseline decides whether it is new (measured on live r54: the same four chapters FAIL there too, so carried); the finding is carried as a major issue and drives the sub-score caps.]

### feel: 8.3
Candidate b24614c05, GPU headless Playwright (PYREFLY_BROWSER=gpu), real keys. Scored from partial evidence, see the gaps. MEASURED: continuity harness on the candidate for 3 chapters (Seymour Flux, Sinspawn Gui 'mushroom', Biran and Yenke 'gagazet'), 913 s of battle, 1,022 swaps, 59.7 to 59.8 fps, p99 frame 21 to 23 ms, 0 snaps per minute (so no animation cap; CHK-026 PASS, 0 of 803 judged swaps over tolerance, feet within 0.9 px). CHK-027 FAIL on the sample, but better than live r54 run the same way on the same two chapters: swap jerks of 40 px or more 4 (candidate) vs 10 (live); Kimahri's 63.4 and 59 px swap jerks (Flux) and Lulu's 42 to 48 px ones (Sinspawn Gui) in live are gone in the candidate; Biran and Yenke 0 jerks. The worst jerk is Auron's Bushido cut-in (Sinspawn Gui, 194.4 px candidate vs 151 px live: the same scripted teleport to the Overdrive stance, strip jerk-000-auron). Transition strips read: Yuna critical to hurt crossfades under a hit flash, Biran/Yenke idle to cast/hurt/KO blend cleanly with no double image (0 ghost frames), the Sinspawn arm KO is a deliberate collapse cut. Timed 10-frame sequences (seq-transition-into-battle, seq-party-action, seq-action-playing) for Chapter I and IV read as before: title card dissolves into the battle in about 2 s, a hit lands with its damage number and the next command menu is back about 1 s later, no dead waiting. Pacing: 28 real-input runs, a victory in every chapter that the route can win; turn pace 5 to 7 s a turn including the harness. Skip/pause: Esc opens the pause menu in every pre-scene, hold-Enter skips (holdsToSkip 1), a voiced line is stopped when the player advances (voicecheck plays state 'stopped'). One 1.1 s frame stall in Sinspawn Gui (1113.5 ms candidate, 1195.2 ms live, so carried, not new, cause not located). NOT MEASURED: the 16 other listed chapters on this build (all 7 FFX-2 included), rig-driven motion of Kimahri and Lulu (the harness tracks painted planes; the rig meshes have no swaps, so their absence from the jerk list is weak evidence; the owner's own rigmeasure shows Kimahri single-frame stature steps up to 0.073 and feet steps up to 0.068 in rig units, Lulu feet steps under 0.011, units not convertible to px), and input-to-response latency (the only attack/special/summon clips are from the previous round 26 build b8aa6f96, not reused). Open and carried: PR-0380 (jerks), PR-0379 (ghosting), PR-0437, PR-0438 (flash). Grand Summon picker refuses a greyed aeon silently (new, polish). Score 8.3: held near round 25/26 value 8.5, minus 0.2 because the rigs' motion and the FFX-2 chapters are unobserved on this build. [Chief: held at 8.3. Fourteen more chapters now carry the same CHK-027 class of swap jerk (worst 268.9 px at a Vegnagun swap, 161 px Leblanc, 158.8 px Braska, 147.6 px Yunalesca); the class and the sizes match the previous round (141 jerks, worst 195 px), 0 snaps a minute everywhere, so no lower number is earned and none is higher.]

### narrative: 8.7
Round 25 value 8.7 held (round 26's was UNVERIFIED); this build changes src/story only by the voice plumbing (registry deadline now costs a voiced line at its recording length, capped) and one authored line. Real-input flows reached the story beats: pre-scenes in all 28 runs (Esc opens pause, hold-Enter skips); results then the post-battle scene reached by real keys and read in full for Seymour Flux, Yunalesca, Anima/Macalania, Evrae, FFX-2 Bahamut, Vegnagun/Shuyin, Leblanc, Fallen Aeons, Den of Woe, Ixion/Djose; Natus, Omnis, Fins/Core and Yojimbo play their scene before results (also reached). Tone fits each game: FFX scenes grave (Flux 'You can't send what refuses to go.' to 'You are a dream.'), FFX-2 lighter with banter (Den of Woe 'Okay. Team hug. Paine, you're in the middle.' / 'No.'). FIX VERIFIED: Isaaru's first duel callout now reads 'His aeon is ready. Shield first.' in the battle dialogue box, spoken by Yuna as the authored fallback because Lulu is not in the party (run.json dboxTimeline 28911 ms; voiced file isaaru-via-purifico.mid-grothia-ready.002.fb1 played). VOICE-OVER (FFX, Tidus/Yuna/Auron only; agents cannot hear, so only routing is judged): in Yunalesca's pre-scene 4 of 17 lines asked and started (Tidus, ids yunalesca.pre.006/007/008/015), each held until its audio ends ('stopped' when the player advances), 13 voice files requested, 0 errors, 0 404s; with VOICE-OVER OFF 0 voice requests started over all 17 lines, the pause toggle reads VOICE-OVER ON to OFF; credits line names the three cast members and Fish Audio. Whether the voices sound like the cast is Bailey's ear (CHK-B1/B3), not scored. Carried polish, not introduced: PR-0262 the results quip '...Okay. Next one.' on Chapters I, II and XVII; PR-0455 blank speakers (Ixion/Djose '(Whistle)' x4, Fins/Core and Mirror Aeons narration lines in battle); Omnis' Ultima callout 'Rest now. All of you, together.' 5 times in 8.7 min (4 in the previous round). Voiced and unvoiced speakers mix inside one scene (Braska, Jecht, Young Auron's 'My lord...' line show no voice) by design. NOT VERIFIED on this build: win-path aftermath for Isaaru, Trema, Sin Face, Mirror Aeons, Braska's Final Aeon (the route loses or stalls identically on live r54; CHK-022 stays open for them), Pilgrimage stop results scenes (stop 1 fight was an injected autoBattle), voice on the phone layout.

### audio: UNVERIFIED (no number)
No numeric owner verdict exists for this mix (docs/audio/OWNER-VERDICT.md: every entry says 'no score given'; docs/target/targets.json still lists 'A score out of ten for the audio' as waiting), so no number is given and nothing is averaged or zeroed. I cannot hear; everything below was read from files, ffmpeg and logs. TECHNICAL HEALTH, no defect found on the candidate: (1) node tools/audio/qa.mjs --strict on the b24614c05 tree, 43 music cues, all -16.0 LUFS +/-0.2, true peak -1.5 to -5.3 dBTP, 0 clipped samples, 0 failures, manifest problems [], sprite/v2/9 parity packs 0 failures, 71.6 MB (music+sfx) plus 4.04 MB voice, inside the 90 MB / 20 MB lines. (2) All 290 shipped audio files in dist-gate/audio are byte-identical to public/audio (sha256; the 83 not shipped are audition candidates). (3) Loop seams of all 43 cues, independent scratch check: no click (largest jump 0.05 of full scale, same as live), new cues chapter-select-a (27.02-69.83 s, jump 0.0011) and chapter-select-c (22.77-77.31 s, jump 0.0046) clean. (4) 222 new FFX voice lines (Tidus 81, Yuna 70, Auron 71): all decode, 0 errors, 0 orphans, 0 missing, byte counts equal the manifests, durations within 150 ms of the manifests, no silent file, lead silence 0, trail <=0.23 s, longest inner pause 0.49 s, peaks <= -1.7 dBTP, -21.1 to -22.4 LUFS as ffmpeg measures the mono file = about -19 LUFS dual-mono as the shipping gate states. (5) 71 audio/voice vitest files, 1136 tests pass. ROUTING from real-flow captures (r55, headless Playwright GPU, seed 1): the right scene, battle and result cue played at pre-scene, first menu, mid-fight seams and results in 21 chapter runs (Seymour Flux boss-seymour/victory-ffx/defeat-ffx; Yunalesca scene-zanarkand-dome/boss-challenge/victory-ffx; Braska scene-dreams-end/boss-jecht/defeat-ffx; Bahamut scene-bevelle-underground/boss-bahamut/victory-bahamut and defeat-ffx2; Vegnagun scene-farplane/boss-vegnagun; Leblanc, Den of Woe, Fallen Aeons, Ixion, Macalania, Evrae, Yojimbo, Natus, Omnis, Isaaru, both Sin chapters, Mirror Aeons incl. link-2 boss-yojimbo; Trema phase 1 on the scene bed as THEMES maps it), every cue the THEMES chapter cue map names (themes-audit: 0 chapters depart), no audio 404, no audio console error (one unrelated net::ERR_NO_BUFFER_SPACE in the Fallen Aeons run), the SFX sprite, sprite-v2 and the right parity packs decoded in every run, no silent fallback. FFX-2 runs fetch no voice and report voice null (game-aware: voice is FFX only). VOICE: with VOICE-OVER on, Chapter II lines yunalesca.pre.006/007/008/015 started on a running AudioContext (heard true); with VOICE-OVER toggled off by real keys in pause the bus reads 0, asked 0, started 0 over the same 17 steps, and toggling back on restores 0.9; mid-battle and result lines play in Flux, Omnis, Sin Fins, Isaaru, Mirror Aeons, Braska. SETTINGS (CHK-024): all 13 fixture saves (releases 20 to 37.1) and the live r54 save migrate to voiceOn true / voiceVolume 0.9 / titleArt farplane / chapterSelectMusic b, their saved master/music/sfx volumes are applied at boot, changing VOICE, VOICE-OVER and CHAPTER MUSIC A then reload keeps them, and the board then plays chapter-select-a; cross-tab merge kept voiceOn false/chapterSelectMusic a. NOT PROVEN, hence UNVERIFIED rather than a number: whether any of it sounds good; Bailey has not heard the new alternates' or the 222 Fish lines' mix by ear (his r395 voice handoff lists the level, 64 kbps encode and take as his call). Reused, labelled: Chapter III link-2 boss-yu-yevon, Chapter XIII phase-2 boss-trema and the pause crossfade come from the 10-14 captures (see reused). Listed as not captured: Chapter V link-5 boss-shuyin after 'shuyin-appears', Chapter I scene-gagazet entry under the reveal line, chapter-select-c playing, the title cue per title art, iOS voice playback. Provenance note, not scored: the voices are Fish Audio Drama 3 clones of the original cast on Bailey's stated permission, which I cannot verify and which the ledger does not yet record.

### interface: 8.2
Scored on candidate b24614c05 evidence at 1600x900 (29 real-key routes, 18 chapters plus pilgrim/ch3/ch28/voice/credits probes), 2000x1012 and 390x844 (touch+keys); the wide, 1440p and 4K shapes were NOT captured on the candidate (UNVERIFIED), so treat as provisional on those. Verified good: advisor effective type >=14.2 px (15 on phone) with 0 clipped and 0 overlaps in 29 runs (run.json focFirst/focAfterCoach); 0 advisor/target mismatches; Esc from target mode returns to the menu with 0 targets in every captured chapter; intent cards separate certain from conditional ('Lands on one of these, picked when it acts', 'Most likely 83%', 'IF YOU ATTACK'); Orders widget prints its true cost; Ch III and Ch XXVIII summon lists grey the KO'd aeon and drop the taken one; VOICE and VOICE-OVER rows FFX only, PRESENTATION in both. No new critical or major; no regression against live r54 found. Carried and re-observed, no gain since round 25 (8.2): PR-0295 (major), PR-0356, PR-0434, PR-0354, PR-0456, PR-0366, PR-0386, PR-0330. New minors: Doublecast card prints NO MP, Doublecast slab ~1.3:1 contrast on the bright Sin backdrop, Grand Summon picker caption overflow.

### onboarding: UNVERIFIED (no number)
UNVERIFIED: the candidate has no capture of the ACCESSIBILITY tab, TEXT SIZE 115/130, REDUCE MOTION/FLASHES, COLOUR VISION or the CONTROLS tab, and earlier evidence cannot be reused because PR-0453 and PR-0454 are open related defects. Round 25 value 8.3 is reference only, not carried. What the candidate does prove: the fresh-profile cold start by real keys (Auron's briefing with a skip-once and never-again path, a 3-step board coach, a 2-step prep coach 'The tabs are for later', the first-turn coach 'He moves after you. Not before. Use it.', battle-help, G/E/N toggles) is clear and progressive in both games and at 390x844; the new CHANGELOG panel (L, 'Release 55', every paragraph tagged BOTH/FFX, build chip b24614c0) and the PRESENTATION page (TITLE SCREEN, CHAPTER MUSIC, each with a plain description, 'Both games', 'It shows the next time the title is drawn') are readable at 1600 and 390; 14 real saves keep every setting and take the new defaults. Open: PR-0386, PR-0372 widened, phone options clipping, no key remapping (suggestion). The newcomer walkthrough was SIMULATED (harness, fresh profile, real keys, plus my own cold read of each screen); no real newcomer.

### prep: UNVERIFIED (no number)
No number (seventh review with the same open half). PROVED/SEEN on candidate b24614c05 (bundle index-DyWSjMya.js, dist-gate; capture owner's evidence in critic/rounds/round-26/evidence/r55; headless Chromium via Playwright, PYREFLY_BROWSER=gpu, ANGLE D3D11, Windows 11, Ryzen 7 7800X3D, RTX 5070 Ti, 64 GB; I opened no browser): (1) RESULTS and REWARDS: 16 victories and 13 defeats read through the results screen. Ch I AP 10,000 x4, gil 6,000, Lv. 4 Key Sphere (research/ffx-combat-core.md:2331 names Seymour Flux as the Lv. 4 Key Sphere source); Ch X now lists Lv. 2 Key Sphere x4 on OVERKILL x1 (research/ffx-seymour-natus-highbridge.md:96: x2 normal, x4 on overkill, decompiled, single source for x4), so round 25's PR-0352 (Natus lists no item) is RESOLVED on this build; Ch IV EXP 1,300, gil 1,000, Gris Gris Bag; Ch XIII row, Ch XI, Ch XVI, Ch VI, Ch V reward lines present; Ch IX still 0 AP and 0 gil (carried from round 25). Reward values were read, not source-audited this round. (2) RETRY SPEED: defeat to a playable retry battle took 7.2 to 9.4 s in 9 measured retries (Flux 7.5, Flux 390x844 touch 7.2, Flux gamepad 8.2, Bahamut 7.3, Bahamut 390x844 7.3, Vegnagun 7.7, Trema 8.3, Braska's Final Aeon 8.9 and 9.4; run.json steps, includes the route's own waits); every retry returns to party prep first (afterRetry=party-prep) and the defeat screen offers RETRY and CHAPTER SELECT at 1600x900 and 390x844. (3) PROGRESS RELIABILITY: 16 of 16 victories (incl. 2000x1012) go results -> confirm -> post scene -> chapter select with exactly that tile cleared (beaten 1) and the same after a page reload; 12 old-release saves + the live r54 save keep every cleared tile, best time, attempts and unlock through a settings change and reload (see delivery). (4) PILGRIMAGE prototype (FFX only, hidden): the word 'pilgrim' typed on the board by real keys opens the route (four stops, two forks, six chapter nodes), a PILGRIM RUN prep tab, fight 1 (stop-1 fight played by autoBattle, INJECTED and labelled), the boon screen (three offers, 'take a boon first' gate), the road choice and the stop-2 party prep (Evrae), at 1600x900 and 390x844; the board shows no sign of it (boardTextHasPilgrim false); keys written: save:v1, pilgrim:v1, experiments:v1; the stop-1 chapter got no record in the main save. (5) Chapter 28 (word 'summon'): Yuna's Summon list is Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo with no row for a taken aeon; Chapter III Grand Summon refused a KO'd Valefor (INJECTED engine state, labelled; combat auditor owns the verdict). Observed subset reads about 8.9; that is not a score. STILL UNSEEN: any prep tab past CHAPTER on this build (Stats, Sphere Grid, Equipment, Items, Overdrive; Dresspheres, Accessories) at either size, a changed value (equipment swap, item, sphere) reaching the first battle menu, whether a Pilgrimage boon (Healing Spring x2) reaches the stop-2 fight, and the win path of Braska's Final Aeon, Isaaru, Sin Face, Mirror Aeons and Trema by real keys (all five identical to live r54 on the same route, so no regression is possible from this evidence). The r54 to r55 diff touches no prep-tab or results file (git diff 4f4dc77bc b24614c05 over src/app/screens and src/ui/common/results*), but 764 commits lie between the last prep-tab walk (round 25 on fcecfa74) and this build, so that evidence is not reused. Cross-reference: PD-02 (gamepad and the first-prep guide).

### delivery: UNVERIFIED (no number)
No number (the first-load-under-five-seconds clause was not measured on this build by anyone, and no Firefox, Safari, real phone or real pad exists). Observed subset reads about 8.7. DEPLOYMENT verdict: NOT APPLICABLE (candidate, not deployed). PROVED: (A) CANDIDATE IDENTITY, built by me with node tools/artifact-manifest.mjs build --dir dist-gate (no browser): 5,657 files, 10,830,753,653 bytes, artifactHash 9df74a5d2c79c1762f06bec6e3e576e272539776b94f28e831fad94470b19644, manifest at critic/rounds/round-26/r55/delivery/cand-manifest-b24614c05.json; the bundle and the title screens carry b24614c0. Against live r54 4f4dc77bc (5,310 files, f94803ed...2224c) the diff is exactly the declared change: 352 added (235 voice files, 104 rig files for Kimahri and Lulu, 2 chapter-select cues, 11 bundle files incl. PilgrimFlow and RigActor chunks), 5 removed (the five old hashed bundles), 4 changed (art/derived.json, art/manifest.json, audio/manifest.json, index.html); no painting changed (0 art files differ byte for byte). Bundle: index JS 4,587,490 vs 4,959,515 bytes (-7.5 percent), all assets 7.40 vs 7.24 MB (+2.2 percent); _headers makes /assets/* immutable (round 25's PR-0396 resolved in the artifact, effect on the live host only after the deploy). (B) MEDIA: manifest decodeChecked true, audioUnverified 0, only the two listed intentional flat Paine eyeR-catch layers flagged; art-derive verify (exact) PASS 3,923 masters, 3,578 pixel-compared, 0 problems, 278 s; art-derive audit PASS (608 literal names, 0 dangling, 38 strip thumbnails); tools/gen/manifest.mjs --check exit 0; all 6,865 media requests (1,267 unique, %40 decoded) of 29 candidate route runs resolve to files in the 5,657-file manifest; 0 images served as text/html. (C) ERRORS: 0 console errors and 0 responses >= 400 in 28 of 29 route runs and in all 14 save-class runs, the crosstab run, 3 voice runs, credits, 2 pilgrimage runs, 3 rig runs, Ch III and Ch 28 probes; one console error in Fallen Aeons, 'Failed to load resource: net::ERR_NO_BUFFER_SPACE' (a Windows socket-buffer exhaustion, four browsers were running; no URL, status or 404; the run won and every media request it made is in the manifest): attributed to the host, not called a game defect, unattributed resource not identified. (D) SAVE CLASS (CHK-024 changed fields voiceOn, voiceVolume, titleArt, chapterSelectMusic; SAVE_VERSION stays 1): real keys, 12 fixtures (releases 20, 25-main, 28-main, 29, 30, 30-sfx-b, 31a, 31a-sfx-b, 33, 34, 35, 37.1) plus the save the live r54 build wrote plus 390x844 touch on 37.1: each loads with the four defaults (voiceOn true, 0.9, farplane, b), pause OPTIONS by keys, VOICE 90 -> 70, VOICE-OVER ON -> OFF, PRESENTATION: THE ECHO and CHAPTER MUSIC A, resume, reload: the choices persist, the Echo title hides the HTML wordmark, the board plays chapter-select-a, no chapter record, best time, attempt count, unlock, seenCoach, flag or other setting changed (31a-sfx-b shows D-293's one-time 0.35 to 0.7 SFX migration, by design, present live); two tabs of one profile (stale tab B changes only VOICE-OVER while tab A changed title and music): all three kept after B's flush and A's reload, cleared chapters kept. My first-run FAIL entries in saveall.log were harness (a pause that opens panel-hidden, an unreached VOICE row) and the 31a-sfx-b assertion that predates D-293; the reruns pass. (E) FLOWS: 14 of 19 chapters won by real keys to results, post scene (via the confirm), board and reload (Flux, Yunalesca, Anima, Evrae, Yojimbo, Natus, Omnis, Fins and Core, Bahamut, Vegnagun, Leblanc, Fallen Aeons, Den of Woe, Ixion), plus defeat then retry in Flux, Bahamut, Vegnagun, Trema and Braska, Flux and Bahamut at 390x844 touch and Flux with the gamepad; Flux and Bahamut won at 2000x1012. (F) FRAME TIME (continuity harness, one chapter at a time, 1600x900, headless Chromium GPU on the host above, battle frames only): Flux 59.8 fps, p99 23.4 ms, 37 of 21,834 frames over 34 ms (0.2 percent), worst 129.8 ms (live r54: 59.9, 23.4, 0.2 percent, 130.2); Biran and Yenke 59.8 fps, p99 21.2, worst 132.9; Sinspawn Gui 59.7 fps, p99 23.3, 0.1 percent, worst 1,113.5 ms (live 1,195.2 ms): PD-01. VOICE: with VOICE-OVER ON four Yunalesca lines were asked, started and heard through a running AudioContext (voice cache 12 buffers, 5.47 MB decoded, 13 requests, 0 failed); with it OFF from the pause, 16 lines of the same scene asked 0, started 0. NOT PROVED: cold-cache first load on named hardware or a throttled link (the round-25 delivery.mjs clock is wrong; use the chief's cold-load recipe), frame time of the other 16 chapters on this build, Firefox, WebKit or Safari, a real phone, a real controller (the pad run is emulated), storage blocked or truncated and the reset flow on this build, reload in every allowed state, the live artifact. Evidence NOT used: evidence/index.json (809 captures, 2026-10-14) and the root evidence/gaps, gates, pd, savecheck belong to an earlier build; the current index is evidence/r55/index.json (879 captures, 873 verified, 6 labelled UNVERIFIED post-scene captures). Hygiene: I started no browser and no server; the capture owner's vite preview of dist-gate on 127.0.0.1:5731 (PID 55972) was still listening at 22:02 EDT and is not mine: the driver must stop it by PID before the release cut. [Chief: the save class half of delivery was completed by the chief in a browser: see CHK-024.]

## Approved-target gate
Required 51, matched 35, failing 0, unverified 15, waiting on a decision 1. Visual auditor's count on the composites in critic/rounds/round-26/targets made from r55 captures. The gap pass captured tile 06 (BATTLE START slab) and tile 20 (panels hidden at 2000x1012) by real keys and found them structurally matching, but no composite was read for them, so they stay unverified here. Tile 35 (Leblanc backdrop) waits on a decision (PR-0399). Approved art intact: verify-approved 917 ok, 0 mismatched, 0 missing.

## Checks
| Check | Result | Mandatory | State and reason |
|---|---|---|---|
| CHK-001 | UNVERIFIED | yes | candidate b24614c05: 43 music cues, 3 SFX sprites and packs, 222 voice lines: Technical half PASS (audio qa --strict green: 43 cues at -16.0 LUFS, 0 clipped, 0 failures; all 290 shipped audio files equal public/audio; loop seams clean; 222 voice lines decode, none silent). The listening half is absent: no owner verdict exists for the two new chapter-select alternates as mixed or for the 222 Fish voice lines at about -19 LUFS / 64 kbps, and no numeric audio score exists (PR-0148). Approving a direction approves neither every cue nor a score. |
| CHK-002 | UNVERIFIED | yes | FFX Ch I pause, FFX-2 Ch IV pause, title, changelog, PRESENTATION: The specialists captured 1600x900, 2000x1012 and 390x844 on the candidate. The chief then ran fresh browsers at 1280x720, 2560x1080 and 3840x2160 for the FFX Chapter I battle menu and pause: the pause plate fills the viewport at all three (the 3840 painting fades into the dark vignette at the right and bottom edge, as designed), no page scroll (scrollW = clientW), 0 text under 11 px effective and 0 truncated text on the battle menu and the pause. Still missing at those shapes: the FFX-2 Chapter IV pause, the title, the CHANGELOG panel and the PRESENTATION page; the 2026-10-14 matrix belongs to b8aa6f96 and is not reused because pause CSS and rows changed. |
| CHK-003 | FAIL | yes | FFX Ch I and II pause OPTIONS, credits, prep CHAPTER tab: Carried PR-0356, now also in release 55's own screens: glyph-band heights on candidate captures at 1600x900: PRESENTATION description about 12-13 px, BOTH GAMES about 11 px at 2.8 to 1, credits descriptions 10-12 px, party-prep body 13 px. The advisor card passes (14.2 px effective, 15 on phone, 0 clipped). Estimated from pixels, not a DOM sweep. |
| CHK-004 | PASS | yes | FFX and FFX-2, 18 chapters at 1600x900, Flux and Bahamut at 390x844 and 2000x1012: Ownership and menu path hold for the first actor per chapter plus the route's own picks; the cost line of a Doublecast is a separate defect (PR-0468). |
| CHK-005 | UNVERIFIED |  | FFX Ch I and Ch III injected: The broken-board matrix was not run on the candidate; two broken boards seen (Ch I Kimahri KO, Ch III KO'd Valefor), one ally down only. |
| CHK-006 | UNVERIFIED | yes | Doublecast, Orders and Grand Summon not exited: Target-mode cancel is clean in 18 chapters (0 targets after cancel, rows restored, both games). Not captured: Doublecast back/cancel from cast 1 or 2, Orders cancel, Grand Summon Esc, an actor dying mid-decision, a battle ending with an overlay open. |
| CHK-007 | PASS | yes | both games, 18 chapters plus front-end screens: Sampled copy has no developer vocabulary (advisor and intent text of 18 chapters, title, changelog, PRESENTATION, credits, Pilgrimage, Grand Summon, Orders). |
| CHK-008 | FAIL | yes | FFX-2 Ch IV target step; FFX Ch IX and XII intent open; FFX Ch I phone first turn; first-time cards in Ch XVII and Biran and Yenke: Panels overprint each other or the picture (PR-0456 ring over the ALSO paragraph, PR-0366 intent card over guide text and first-time cards over the party, the phone first-turn dialogue over the command rows). No battle panel covers the command point of an actor in the 19 mid-fight and 19 first-menu frames read by the visual auditor. Not new in this build. |
| CHK-009 | FAIL | yes | FFX Pilgrimage route at 390x844 (a new hidden feature): Location lines end in an ellipsis and the ELITE tag is cut (PR-0465). At 1600x900 every sampled name is whole; the main game's screens are whole at 390x844. |
| CHK-010 | PASS | yes | FFX Ch I target step, Ch III summon list, FFX-2 Ch IV target, Pilgrimage boons: Selection reads at a glance: gold row cursor, target reticle with name plate and hand, highlighted CTB portrait, dark greyed rows; checked at 1600, 2000 and 390. |
| CHK-011 | PASS |  | 19 chapters, mid-fight: Every targetable enemy was visible in the 19 mid-fight frames read. |
| CHK-012 | PASS | yes | candidate build, art mirror D:/pyrefly-art-r55: No fallback face: Kimahri and Lulu rigs report gate ok with all keys; art-derive verify PASS (3,923 masters, 0 problems) and audit PASS (0 dangling names). |
| CHK-013 | PASS | yes | 19 chapters at 1600x900 against 35 composites: Approved art renders as approved: 0 art files differ byte for byte from live r54 (the diff against live is 352 added, 5 removed, 4 changed), verify-approved on the release tree 917 ok / 0 mismatched / 0 missing. Tile 35 (Leblanc backdrop) waits on Bailey. |
| CHK-014 | PASS | yes | 19 chapters: Figures face the shot the player sees; the rigged Kimahri and Lulu face frame-right as the party does. |
| CHK-015 | UNVERIFIED | yes | all captured flows: Esc, P, N, E, G, H, target and cancel, retry and board work by real keys in 29 routes and the front-end screens (pass), 390x844 by touch for Flux, Bahamut and the Pilgrimage, and a gamepad run for Flux (pass as far as it goes). Touch was real only for 12 menu and target taps (34 keyboard fallbacks); the phone PRESENTATION and CHANGELOG were reached by keys; the gamepad is a shim, not a controller, and no FFX-2 pad run exists. Emulation is not proof of a real phone or pad (RUBRIC section 5). |
| CHK-016 | PASS | yes | every capture of evidence/r55/index.json: Each capture asserts its screen, chapter and state; 6 of the 857 indexed captures (the 30-post-scene ones) are recorded UNVERIFIED because the harness read the cutscene before results; none is a shot of the wrong screen presented as right. |
| CHK-017 | NOT APPLICABLE | yes | candidate b24614c05, not deployed: The deployment verdict is not applicable until the deploy. Candidate half recorded: manifest 5,657 files, 10,830,753,653 bytes, artifactHash 9df74a5d... (r55/delivery/cand-manifest-b24614c05.json); against live r54 the diff is 352 added, 5 removed, 4 changed and no painting changed. After the deploy, critic/artifacts/<sha>.json must carry the same hash. |
| CHK-018 | PASS | yes | dist-gate and src of b24614c05: art-derive audit: 608 literal art names, 0 dangling, 38 strip thumbnails each shipped; tools/gen/manifest.mjs --check exit 0; every one of the 1,267 media URLs requested in play is in the manifest. |
| CHK-019 | PASS | yes | every shipped image and audio file of dist-gate (5,657): Manifest decodeChecked true, audioUnverified 0, the only flat-colour problems are the two listed intentionalFlatImages (Paine eyeR-catch 1x and 2x); art-derive verify exact PASS (3,923 masters, 3,578 pixel-compared). The in-browser image-load audit (tools/art-browser-load.mjs) is run by the deploy and was not run here. |
| CHK-020 | PASS | yes | FFX Ch I vs FFX-2 Ch IV: Changed shared screens are consistent across games (title, changelog, pause OPTIONS with PRESENTATION, advisor and intent cards, target and results frames); FFX-only VOICE rows are absent in FFX-2 by rule 14. |
| CHK-021 | PASS | yes | FFX-only changes land only in FFX: Every FFX-2 file in the src diff is comment-only by a code-only comparison and the FFX-2 chapter bench is byte-identical to live; the FFX-2 first menu has none of the FFX-only rows; voice-over is FFX only (all 11 FFX-2 runs request zero voice files); the VOICE rows and credits line appear only in FFX; PRESENTATION and CHANGELOG appear in both and are tagged. |
| CHK-022 | UNVERIFIED | yes | 19 listed chapters, real-key route from normal entry to outcome: Results, post scene, board and reload by real input in 14 chapters (win) and defeat then retry in Flux, Bahamut (also 390x844), Vegnagun, Trema and Braska. No winning real-key run for Braska's Final Aeon (defeat twice, 357 and 370 turns), Isaaru (defeat, 42 turns), Sin Face (stalled at the two-pick Doublecast) and Mirror Aeons (defeat at turn 178, not finished by the dedicated continuity run); live r54 behaves identically (PR-0461), so no regression, and the engine's intended line wins all four over 100 to 200 seeds. FFX-2 Trema, lost at 32 turns by the capture owner, was won by real keys in the orchestrator's continuity run (224 turns, 21 min, results, post scene via the confirm, board, reload with the tile cleared). |
| CHK-023 | UNVERIFIED | yes | reachable changed subsystems through the normal runtime: PASS for what was reached: immune-status misses in the real Yunalesca and Macalania logs; greyed and refused Grand Summon of a KO'd aeon by real keys (gauge stays 100, no event); Talk gating (absent in Yunalesca, present for Tidus in Braska's); Isaaru "Shield first" in the dialogue box, voiced; the right music at 21 sampled chapter moments; a Silenced caster's greyed Black Magic and a Cursed Tidus's greyed Overdrive row. UNVERIFIED: Chapter III links 2 to 7 and the Last Summoning after link 1 as one real-key chain (the possession-link menus were listed per link, see PR-0460, but the chain was never won by key), the Yu Yevon Sensor plate in the live last link (reused producer screenshot only), the Aeon-Defend IMMUNE label over the player's own aeon (no capture, PR-0383), chapter-select-c and the title cue per title art in all states, and the music at the Chapter V link 5 and Chapter I scene-gagazet seams (PR-0471). |
| CHK-024 | PASS | yes | saves and settings survive an actual upgrade (src/app/SaveData.ts: voiceOn, voiceVolume, titleArt, chapterSelectMusic; SAVE_VERSION stays 1): Real keys in a browser on the candidate: 12 repo fixtures (releases 20 to 37.1), the save the live r54 build wrote itself and a 390x844 touch run all load with the four defaults (voiceOn true, 0.9, farplane, b) and keep every other setting, chapter record, best time, attempt count, unlock and coach flag; VOICE, VOICE-OVER, TITLE SCREEN and CHAPTER MUSIC changed by keys survive the reload (The Echo title with no HTML lettering, the board plays chapter-select-a); a second tab holding stale values merged without loss. The chief then ran the cases the delivery auditor left open: garbage values (titleArt nope, chapterSelectMusic z, voiceOn "yes") read the defaults and wrong types (null, "loud", an object) read the defaults, with no console error (one exception, PR-0477: voiceVolume 7 is kept as 7 and only the audio bus clamps it); a truncated blob and a storage that throws on every call both boot to the title and the board with the defaults and no error (a truncated blob resets progress to an empty save, the behaviour the file documents: "a corrupt or absent blob" reads empty); a save with version 2 loads; reload in the middle of a scene and in a battle (a dedicated results-screen reload case was started twice and killed unfinished under host  |
| CHK-025 | NOT APPLICABLE |  | no audio or art asset replaced: Not in the plan; no painting changed (0 art files differ from live). |
| CHK-026 | FAIL | yes | continuity harness, real keys, 1600x900, seed 1, 18 chapters on the candidate (dedicated runs, 57 to 60 fps): FAILS in 7 of 18 chapters (yunalesca, braskas-final-aeon, ffx2-leblanc, seymour-anima-macalania, ffx2-fallen-aeons, ffx2-trema, isaaru-via-purifico): a standing figure moves its own stance by up to 22.3 px, or a pose is drawn outside its height band (Leblanc stature 0.769 to 1.261), read from the pixels; the registered head reading is a control and reads 0.2 percent everywhere. PASS in seymour-flux, ffx2-bahamut, ffx2-vegnagun-shuyin, evrae-airship, yojimbo-cavern, seymour-natus, seymour-omnis, ffx2-den-of-woe, ffx2-ixion-djose, sin-fins-core, sin-face, and in the earlier three-chapter run of Flux, Biran and Yenke and Sinspawn Gui (0 of 803 judged swaps over tolerance). 1 listed chapters had not finished when the chief wrote this (mirror-aeons); they are UNVERIFIED, never passed. The rigged Kimahri and Lulu have no swaps and no instrument (PR-0462). The chief ran the same harness on live r54 for Macalania, Leblanc, Fallen Aeons and Yunalesca and got the same CHK-026 FAIL (feet 14.8, 15.9 and 12.7 px; Leblanc stature 0.768 to 1.261), so those four are carried, not regressions; Braska's Final Aeon, Isaaru and Trema also FAIL on the candidate and were not measured on live. |
| CHK-027 | FAIL | yes | continuity harness, 18 chapters on the candidate: FAILS in 16 of 18 chapters; PASS only in yojimbo-cavern, sin-face. 0 snaps a minute everywhere; swap jerks of 40 px or more at a pose swap in every failing chapter (worst 268.9 px; the Overdrive cut-in of Auron 194.4 px on a 238 ms frame in Sinspawn Gui, 268.9 px in Vegnagun/Shuyin); double images of severity 0.4 or more in Bahamut, Vegnagun/Shuyin and Leblanc. Live r54 on the three chapters the owner compared: 10 such jerks against the candidate's 4, and the Kimahri and Lulu jerks are gone because of the rigs. Same class and sizes as the previous round, so carried (PR-0380, PR-0379). |
| CHK-B1 | UNVERIFIED | yes | whether the music, the two alternates and the 222 voices are beautiful: No agent can hear and the owner has recorded no verdict or number for this mix (PR-0148). |
| CHK-B2 | UNVERIFIED |  | input latency and the weight of confirm: Bailey's to judge after play; the only latency clips are FFX-2 Chapter IV (Attack key to menu closed 11 ms, attack pose 805 ms, menu back 1,632 ms) and the FFX clips recorded no events (harness fault, cause not established). |
| CHK-B3 | UNVERIFIED |  | taste judgments: the voice cast, KO dissolve, colour vision: Not collected. |

## Continuity harness (CHK-026, CHK-027)
Aggregate of the 18 chapters the orchestrator's dedicated run had finished on the candidate when the chief wrote this (the harness's own aggregator, `--only-aggregate`), 1600x900, GPU, seed 1, real keys.
| Chapter | CHK-026 | CHK-027 | battle s | head max % (registered) | feet px (pixels) | worst jerk px |
|---|---|---|---|---|---|---|
| seymour-flux | PASS | FAIL | 365.6 | 12.1 | 0.9 | 61.8 |
| yunalesca | FAIL | FAIL | 806.8 | 26.8 | 1 | 149.4 |
| braskas-final-aeon | FAIL | FAIL | 1982.3 | 23.6 | 1.1 | 158.8 |
| ffx2-bahamut | PASS | FAIL | 307.5 | 9.4 | 0.3 | 48.4 |
| ffx2-vegnagun-shuyin | PASS | FAIL | 775.1 | 9.1 | 0.7 | 268.9 |
| ffx2-leblanc | FAIL | FAIL | 424.1 | 22.4 | 1 | 161.3 |
| seymour-anima-macalania | FAIL | FAIL | 330.7 | 25.7 | 0.9 | 126.2 |
| evrae-airship | PASS | FAIL | 366 | 0.2 | 0.9 | 55.9 |
| yojimbo-cavern | PASS | PASS | 113.7 | 4.8 | 0.4 | 25.3 |
| seymour-natus | PASS | FAIL | 147.9 | 13.5 | 0.8 | 40.8 |
| ffx2-fallen-aeons | FAIL | FAIL | 360 | 15.6 | 1.2 | 69.2 |
| seymour-omnis | PASS | FAIL | 512.3 | 8.7 | 1.5 | 50.2 |
| ffx2-trema | FAIL | FAIL | 1138.5 | 2.7 | 10.4 | 119.2 |
| isaaru-via-purifico | FAIL | FAIL | 273.3 | 25.6 | 0.7 | 117.4 |
| ffx2-den-of-woe | PASS | FAIL | 236.3 | 2.9 | 0.7 | 88.3 |
| ffx2-ixion-djose | PASS | FAIL | 178.6 | 18.9 | 0.6 | 48.5 |
| sin-fins-core | PASS | FAIL | 923.6 | 5.8 | 1.3 | 171.4 |
| sin-face | PASS | PASS | 185.4 | 0.1 | 0.5 | 0 |

Not finished at the time of writing (UNVERIFIED, never passed): mirror-aeons. The earlier three-chapter run by the capture owner (Flux, Biran and Yenke, Sinspawn Gui, with live r54 run the same way) is in `evidence/r55-continuity` and `evidence/r55-live-continuity`: CHK-026 PASS on all three, CHK-027 FAIL on two with 4 swap jerks against live's 10. Snaps per minute: 0 over 9427.7 s of battle.

Live r54 baseline run by the chief for the chapters that failed CHK-026:
| Chapter | live r54 CHK-026 | candidate CHK-026 | live worst feet px | candidate worst feet px | live worst jerk px | candidate worst jerk px |
|---|---|---|---|---|---|---|
| seymour-anima-macalania | FAIL | FAIL | 14.8 | 14 | 71.7 | 72 |
| ffx2-leblanc | FAIL (stature 0.768-1.261) | FAIL (0.769-1.261) | 3.5 | 3.5 | 150.9 | 161.3 |
| ffx2-fallen-aeons | FAIL | FAIL | 15.9 | 16.6 | 68.5 | 69.2 |
| yunalesca | FAIL | FAIL | 12.7 | 12.8 | 122.8 | 147.6 |
The chief ran the same harness on live r54 for Macalania, Leblanc, Fallen Aeons and Yunalesca and got the same CHK-026 FAIL (feet 14.8, 15.9 and 12.7 px; Leblanc stature 0.768 to 1.261), so those four are carried, not regressions; Braska's Final Aeon, Isaaru and Trema also FAIL on the candidate and were not measured on live.

## Coverage matrix
**Tested**
- save-data class in a browser on the candidate: 12 fixtures of releases 20 to 37.1, the live r54 save, a 390x844 run, a two-tab merge, plus the chief's garbage-value, wrong-type, truncated-blob, blocked-storage, future-version and reload-in-scene/battle cases (CHK-024)
- 19 listed chapters plus 4 hidden ones: 14 won by real keys to results, scene, board and reload; defeat and retry in both games; 2000x1012 and 390x844 touch; one gamepad run (CHK-022 in part)
- combat: code-only diff of 60 files, 478 + 68 re-derived mechanics checks, 339/339 target words and 206 FFX-2 rows against the raw game tables, 2,400 paired FFX plays and 700 FFX-2 plays against live r54, credible-mistake lines, chain probes, hidden chapters, goldens, full unit suite
- front end: both titles, PRESENTATION, CHANGELOG, credits at 1600x900 and 390x844; voice routing on and off at 1600 and 390; Pilgrimage word to stop 2 at 1600 and 390
- rigs: gate state, per-key stature and feet readings for Kimahri and Lulu, first-menu frames; Chapter III Grand Summon refusal; Chapter III Summon list per link; Isaaru "Shield first"
- continuity harness on 18 chapters of the candidate (CHK-026, CHK-027) and a live r54 baseline for the failing chapters (measured on live r54: the same four chapters FAIL there too, so carried)
- audio: qa strict on 43 cues, loop seams, voice file health, routing in 21 chapter runs, themes audit, stereo gate, vitest 1,136 audio tests
- delivery: manifest of 5,657 files, diff against live (352 added, 5 removed, 4 changed), art-derive verify and audit, 0 console errors and 0 responses >= 400 except one ERR_NO_BUFFER_SPACE under host saturation

**Reused (with its reason)**
- Chapter III link-2 boss-yu-yevon, Chapter XIII phase-2 boss-trema and the pause crossfade audio routing: from critic/rounds/round-26/evidence/braskas-final-aeon-win-b45 and gaps/pausetabs-* (2026-10-14, b8aa6f96); chain loop and cue data and the AudioManager music path unchanged except the voice bus; labelled partial by the audio auditor
- Yu Yevon Sensor plate reading 99,999 / 99,999 and MP 1 / 1: from producer screenshot docs/screenshots/r55/sensor-yu-yevon-1600x900-aimed-scan.jpg; reused, not independently reproduced; MV-yu-yevon-sensor-plate stays UNVERIFIED
- Live r54 behaviour on the shipped line, comparisons of route outcomes and the frame-time baseline: from evidence/r55-live-r54 and the combat auditor's own runs of M:/pyrefly-r54; same seeds and routes run on the live artifact in this round
- First-time fan lens: from continuity strips and seq frames that include folders written by the previous candidate b8aa6f96; the fan read strips whose folder names are shared (--tag=r26); the painted pose-swap path (src/sprites) is unchanged in r55, but those breakers are labelled carried and not tied to this build

**Not tested**
- Firefox, WebKit/Safari, a real phone, a real controller, 4K/1440p/21:9 pause shapes on the candidate
- cold-cache first load under five seconds on named hardware and a throttled link
- the heavy party-prep tabs on the candidate at either size
- ACCESSIBILITY tab, TEXT SIZE 115/130, REDUCE MOTION/FLASHES and COLOUR VISION on the candidate

**Required and not tested**
- continuity harness (CHK-026, CHK-027) for 1 listed chapters that had not finished when the chief wrote this: mirror-aeons
- real-key winning runs for Braska's Final Aeon, Isaaru, Sin Face, Mirror Aeons (CHK-022)
- Chapter III links 2 to 7 and the Last Summoning after link 1 as a real-key chain (CHK-023)
- the owner's listening verdict and number (CHK-B1) and the touch/pad/other-browser coverage of CHK-015
- CHK-002 shapes (1280x720, 2560x1080, 3840x2160) for the FFX-2 pause, the title, the CHANGELOG panel and the PRESENTATION page (the FFX Chapter I pause was done by the chief)

## Encounters by real flow
| Chapter | Real flow completed | Outcome |
|---|---|---|
| seymour-flux | yes | victory (seed 1, 8.1 min) and defeat then retry reached battle (2.2 min); also 390x844 touch defeat, 2000x1012 victory, gamepad defeat. Title, board, prep (Esc back), pre scene (Esc pause, hold skip), first menu, N, E, G, Esc/P pause, target and cancel, Overdrive, results, post scene, board, reload all by real input. The 30-post-scene capture is UNVERIFIED (harness read cutscene then results; the real order is results then scene, 33-after-confirm-scene proves the scene). |
| yunalesca | yes | victory (21.6 min, attempts up to 3). Real flow to the board. Voice-over check ran in this pre scene. |
| braskas-final-aeon | no | defeat twice (357 and 370 turns, still in link 1, 62 min); win path UNVERIFIED. Loss path real to results and retry. Live r54 gives the identical 370 turns on attempt 1 and defeat on attempt 2, so not a regression. Grand Summon with a KO aeon, Summon list and menu rows were exercised separately (ch3-grand-summon, INJECTED state). |
| seymour-anima-macalania | yes | victory (7.0 min). 30-post-scene capture UNVERIFIED (same harness race). |
| evrae-airship | yes | victory (7.7 min). 30-post-scene capture UNVERIFIED (same harness race). |
| yojimbo-cavern | yes | victory (3.1 min) |
| seymour-natus | yes | victory (3.4 min) |
| seymour-omnis | yes | victory (9.8 min) |
| isaaru-via-purifico | no | defeat (42 turns, 5.4 min); win path UNVERIFIED. Live r54 loses the same way (defeat, 5.6 min), so a harness strategy limit carried, not a regression. 'His aeon is ready. Shield first.' appeared in the battle dialogue box (Yuna, voiced, isaaru-via-purifico.mid-grothia-ready.002.fb1 played 9 times in the audio log). |
| sin-fins-core | yes | victory (19 min) |
| sin-face | no | stalled at link 1, Lulu's command (30 turns, 25 empty picks); win path UNVERIFIED. The route cannot drive the r54 two-pick Doublecast flow (DOUBLECAST 1 OF 2 is on screen and playable). Live r54 stalls identically at command:lulu. A harness gap, not a hang. |
| mirror-aeons | no | 15 min budget cut (stalled) then, with a 50 min budget, defeat at turn 178 (results Defeat after link 2's logged victory; link 3 lost); win path UNVERIFIED. Candidate and live r54 are identical (178 turns, 68 turns on the results screen). |
| ffx2-bahamut | yes | victory (6.4 min) and defeat then retry reached battle (3.9 min); also 390x844 touch defeat and 2000x1012 victory. No voice request in the network log (FFX-only voice confirmed). |
| ffx2-vegnagun-shuyin | yes | victory (15 min) and defeat |
| ffx2-leblanc | yes | victory (10.8 min). 30-post-scene capture UNVERIFIED (same harness race). |
| ffx2-fallen-aeons | yes | victory (7.1 min). One console error: net::ERR_NO_BUFFER_SPACE on a resource load while 5 browsers ran (host saturation, not a 404). |
| ffx2-den-of-woe | yes | victory (4.9 min) |
| ffx2-ixion-djose | yes | victory (4.3 min) |
| ffx2-trema | yes | victory by real keys in the orchestrator's continuity run (224 turns, 21 min, seed 1, results, post scene via the confirm, board and reload with the tile cleared); the capture owner's shorter run lost at 32 turns, live r54 with 2 attempts also lost. evidence: critic/rounds/round-26/continuity/ffx2-trema-win-r26/run.json; bench 58/100 on the intended line (PR-0227) |
| biran-yenke | yes | victory (3.7 min, door word gagazet, run by the continuity harness). Kimahri rig on (rigs(): gate ok, 15 parts, 32 bones, 13 keys). |
| sinspawn-gui | yes | victory (6.4 min, door word mushroom, run by the continuity harness). Lulu rig on (gate ok, 11 parts, 25 bones, 13 keys). |
| last-summoning | no | menus only (door word summon, party prep, first menu to Yuna's Summon list). Yuna's Summon list: Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo; no greyed TAKEN row and no 'taken' wording on screen. Fight not played. |
| pilgrimage-prototype | no | word 'pilgrim' typed on the board opened the road (6 stops); stop 1 fought, boon picked, stop 2 party prep reached (evrae-airship) at 1600x900 and 390x844 touch. INJECTED: setSeed(7), the stop-1 fight by autoBattle('intended') at skip speed, markCoachSeen on the phone run. The run kept its own keys (pilgrim:v1, experiments:v1); no chapter record written. |

## Issues, ranked
Critical: none. Within a severity the order is the owner's reported problems first, then frequency, player impact, coverage, effort. Tags are `introducedByCandidate` / `regressionVsLive` / `inNewFeature`.

### 1. PR-0380 [major, feel, open] figures and some bosses jump 40 px or more in one frame at pose swaps and entrances
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false; owner-reported. Game: both. Chapter/state: every chapter the harness ran on b24614c05; worst Vegnagun/Shuyin 268.9 px, Leblanc 161.3, Braska 158.8, Yunalesca 147.6; Auron's Bushido cut-in 194.4 px (Sinspawn Gui).
- Expected: No jerk of 40 px or more in one frame outside a camera cut; entrances fade or move in.
- Observed: CHK-027 FAILS in 16 of 18 chapters the harness finished (swap jerks of 40 px or more at a pose swap; the three-chapter comparison with live r54 gives 4 on the candidate and 10 on live, so the class is carried and smaller); 0 snaps a minute. The worst events are entrances, fade-ins and the Overdrive cut-in (a scripted teleport to the Overdrive stance); the fan also named x2-Shiva and Anima see-through entrances. 4 of the 28 Vegnagun jerks fell on frames over 34 ms, the 194 px Auron jerk on a 238 ms host hitch.
- Repro and seed: cd D:/pyrefly-release55 && PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<candidate> --evidence=<dir> --chapters=<id> --tag=r26 (seed 1); strips in continuity/<chapter>-win-r26/continuity/strips/jerk-*.jpg
- Evidence: critic/rounds/round-26/continuity/continuity-summary-chief.json; critic/rounds/round-26/evidence/r55-continuity/sinspawn-gui-win/continuity/strips/jerk-000-auron.jpg; critic/rounds/round-26/evidence/r55-continuity/seymour-flux-win/continuity/strips/jerk-000-tidus.jpg; critic/rounds/round-26/evidence/r55-live-continuity/sinspawn-gui-win/continuity/continuity.json. Confidence: high that the jerks exist; medium that the Auron one is the scripted cut-in and not a bug. Requirement: CHK-027; RUBRIC section 6 feel; D-420 to D-426.
- Smallest fix: Give entrances and fade-ins an in-between (a short fade or slide) instead of a one-frame appearance; start with the entrance of x2-Shiva and the Kimahri fade-in, then Anima, Overdrive Sin and Paragon (round 25 list).
- Acceptance check: The harness over the chapters reports no jerk of 150 px or more outside a staged entrance flagged as such, entrances show at least a 3-frame fade, and jerks of 40 px or more fall under 100 in total.

### 2. PR-0379 [major, feel, open] every pose change is a dissolve, for 3 to 8 frames two poses of one figure are drawn at once
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false; owner-reported. Game: both. Chapter/state: FFX I, II; FFX-2 IV.
- Expected: A pose change blends without two bodies at once.
- Observed: The first-time fan counted a crossfade in about 80 of the 86 strips it read (Kimahri, Paine, Rikku, Yuna, Auron, Mortiorchis, Bahamut), 14 of them between very different stances (wide crouch to sword overhead, kneeling to standing) with nothing in between. The harness agrees at the margin: swaps with a double image of severity 0.4 or more in FFX-2 Bahamut (0.408), Vegnagun/Shuyin (0.414) and Leblanc, none in the three-chapter run (worst 0.348). Caveat: most strips the fan read sit in folders shared with the previous candidate's run (--tag=r26 reuses folder names), so they are b8aa6f96 strips; the painted pose swap path is unchanged in r55, but they were not all re-read on this build.
- Repro and seed: ffx2-bahamut-win-r26 swap-020, 024, 058; seymour-flux-win-r26 swap-021
- Evidence: critic/rounds/round-26/chief/in-first-time-fan.json; critic/rounds/round-26/continuity/ffx2-bahamut-win-r26/continuity/continuity.json; critic/rounds/round-26/continuity/ffx2-vegnagun-shuyin-win-r26/continuity/continuity.json. Confidence: medium. Requirement: CHK-027.
- Smallest fix: Shorten the blend or cut on large silhouette changes (round 25 advice).
- Acceptance check: Severe double images under the round 25 count of 44.

### 3. PR-0459 [major, visual, open] the continuity harness finds a painted figure moving its own stance or drawing outside its height band at pose swaps in several chapters
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false; owner-reported. Game: both (painted pose swaps are shared plumbing). Chapter/state: FFX II Yunalesca, III Braska's Final Aeon, VII Macalania, XIV Isaaru; FFX-2 VI Leblanc, XI Fallen Aeons, XIII Trema (harness, seed 1).
- Expected: At every pose swap a standing figure's head changes by at most 3 percent and its feet by at most 2 px at 1600 wide, and every pose draws inside its height band (RUBRIC 6a, CHK-026).
- Observed: On the candidate the dedicated harness FAILS CHK-026 in Yunalesca (35 standing-figure swaps move the silhouette's own stance, worst 12.8 px), Braska's Final Aeon (1 swap, 22.3 px), Seymour and Anima at Macalania (1 swap, 14 px), Leblanc (7 swaps outside the height band, stature 0.769 to 1.261) Fallen Aeons (stance 16.6 px), Trema (8 standing-figure swaps move the feet, worst 10.4 px) and Isaaru (9 swaps, worst 11.6 px). It PASSES in Flux, Natus, Omnis, Yojimbo, Evrae, Den of Woe, Ixion/Djose, Fins/Core, Sin Face, FFX-2 Bahamut and Vegnagun/Shuyin, in Biran and Yenke and in Sinspawn Gui. The registered head reading is a control and reads 0.2 percent everywhere. THE SAME RESULT ON LIVE r54 for Macalania, Leblanc, Fallen Aeons and Yunalesca (chief's own baseline: feet 14.8 / 15.9 / 12.7 px, Leblanc stature 0.768 to 1.261), so the defect is carried by the unchanged painted pose-swap path (src/sprites is untouched in r55). Braska, Isaaru and Trema were not measured on live (Braska is a 33-minute fight; Isaaru and Trema finished after the baseline was set).
- Repro and seed: cd D:/pyrefly-release55 && PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<candidate preview, BASE_PATH=/> --evidence=<dir> --chapters=yunalesca,ffx2-leblanc,seymour-anima-macalania --tag=r26 (seed 1, win); read continuity/continuity.json checks.CHK-026.reasons and the strips
- Evidence: critic/rounds/round-26/continuity/yunalesca-win-r26/continuity/continuity.json; critic/rounds/round-26/continuity/ffx2-leblanc-win-r26/continuity/continuity.json; critic/rounds/round-26/continuity/seymour-anima-macalania-win-r26/continuity/continuity.json; critic/rounds/round-26/continuity/braskas-final-aeon-win-r26/continuity/continuity.json; critic/rounds/round-26/continuity/ffx2-fallen-aeons-win-r26/continuity/continuity.json; critic/rounds/round-26/continuity-live-r54/. Confidence: high that the harness reports it; high that it is carried for Yunalesca, Macalania, Leblanc and Fallen Aeons (measured on both builds); Braska, Isaaru and Trema (1, 9 and 8 swaps) were not measured on live, so the tags stay unknown. Requirement: CHK-026; RUBRIC 6a; Bailey 2026-10-04 (D-420).
- Smallest fix: Read the worst strips for Yunalesca and Leblanc (they carry head and feet guide lines); register the poses that fail (tools/posescale) or correct the painting's ground line; the head reading is a control and will not move.
- Acceptance check: Harness CHK-026 PASS on Yunalesca, Braska's Final Aeon, Macalania and Leblanc with the strips read.

### 4. PR-0460 [major, combat, open] Chapter III possession links 3 to 6 draw every remaining aeon as a greyed Summon row, and Enter on one does nothing
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: III Braska's Final Aeon, links 3 to 6 (possessed Valefor, Ifrit, Ixion, Shiva).
- Expected: Rows that cannot be used say why, or are not drawn; if the original lets the party call the other aeons in a possession link they are enabled, if not they are absent (research/ffx-bfa-yu-yevon.md section 2: each destroyed aeon is gone). possessed-script-locks.ts says only the copy's own aeon is locked.
- Observed: Candidate, real keys, seed 1, menus per link (gaps/t10-ch3-cand): link 3 Summon lists Ifrit, Ixion, Shiva, Bahamut all dark and greyed, link 4 Ixion, Shiva, Bahamut, link 5 Shiva, Bahamut, link 6 Bahamut; Enter on Ifrit raised no battle event (t10-ch3-try). The chief's confirmer reproduced the greyed rows on a second run. Live r54 draws "Switch" in that slot and no Summon row at all, so summoning was impossible there too: nothing that worked live stopped working. The engine probe (audit-combat-r55/ch3-cand.json) reports the same rows ENABLED at menu build, so the lock is applied on the way to the screen, not by the roster removal itself. Links 7 and 8 correctly show no Summon row.
- Repro and seed: Candidate, Chapter III, seed 1, win link 1 and link 2, open Yuna > Summon in the possessed Valefor link (script evidence/gaps/scripts/t10-ch3.mjs, TAG=cand or TRYSUMMON=1 TAG=try)
- Evidence: critic/rounds/round-26/evidence/gaps/t10-ch3-cand/link-possessed_valefor-summon-list.png; critic/rounds/round-26/evidence/gaps/t10-ch3-try/out.json; critic/rounds/round-26/evidence/gaps/t10-ch3-live/out.json; critic/rounds/round-26/audit-combat-r55/ch3-cand.json. Confidence: high that the rows are greyed and inert; low that the original allows summoning in these links (research does not say, hard rule 6). Requirement: RE menu-draw parity (Bailey 2026-10-18 switches ON); AGENTS.md hard rule 6. Where: src/battle/ffx/formation-commands.ts, roster-removal.ts, menu-draw-parity.ts (suspected, traced).
- Smallest fix: Settle from research/re-ffx-last-summoning.md and the Chapter III field notes whether other aeons are callable in a possession link. If not, drop the rows as the roster removal intends; if so, find the lock that greys them (formation-commands.ts, roster-removal.ts, menu-draw-parity.ts) and release it.
- Acceptance check: Same script: either no Summon row in links 3 to 6, or enabled rows whose Enter raises a summon event.

### 5. PR-0295 [major, interface, open] heavy party-prep tabs are a desktop frame shrunk onto a 390x844 phone, text about 3 px
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX and FFX-2 prep tabs at 390x844.
- Expected: A phone-first prep list readable at about 14 px.
- Observed: Re-observed in the new Pilgrimage party prep at 390x844 (tab RUN and the stop-2 prep: letterboxed desktop frame, 3 to 4 px type, a tiny START BATTLE chip in the middle of a blank screen) and confirmed by the chief's confirmer. The ordinary FFX prep CHAPTER tab at 390 is phone-sized and readable; the FFX-2 Stats tab at 390 is phone-sized. The heavy FFX tabs (Stats, Sphere Grid, Equipment, Items, Overdrive) and the FFX-2 Dresspheres and Accessories tabs were not re-captured on the candidate. No prep file differs from live r54 (git diff over src/app/screens and results).
- Repro and seed: Fresh profile, 390x844 touch, Chapter IV or I prep, open the tabs
- Evidence: critic/rounds/round-26/evidence/gaps/index.json. Confidence: medium (carried). Requirement: RUBRIC section 6 interface and prep.
- Smallest fix: One shared single-column list per tab at 14 px (needs Bailey mockup pick first, hard rule 9).
- Acceptance check: The tab-3 EQUIPMENT capture on a phone shows 14 px rows and no horizontal scroll.

### 6. PR-0148 [major, audio, open] no numeric owner listening score for the shipped mix, and now none for the two chapter-select alternates or the 222 voice lines
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false; owner-reported. Game: both. Chapter/state: all.
- Expected: A recorded owner listening score or per-cue ear verdict (RUBRIC section 6 audio, CHK-B1).
- Observed: docs/audio/OWNER-VERDICT.md has no scored entry; the targets file still lists "A score out of ten for the audio" as waiting. The audio auditor read decoded files, ffmpeg and logs; nothing was heard. The cues and the music mix are byte-identical to live except two new alternates and 222 voice files (both new).
- Repro and seed: Read docs/audio/OWNER-VERDICT.md and grep docs/target/decisions.json for audio after 2026-10-12
- Evidence: critic/rounds/round-26/audio-r55/qa.txt; docs/audio/OWNER-VERDICT.md; docs/target/targets.json. Confidence: high (confirmed by the confirmer). Requirement: RUBRIC section 6 audio; CHK-001, CHK-B1.
- Smallest fix: Bailey plays the Owner Checks session or docs/audio/audition.html and gives one 0-to-10 number for music and one for SFX. No agent infers a number.
- Acceptance check: A dated verbatim entry with a number, paired with the build.

### 7. PR-0099 [major, audio, open] eleven chapters still play borrowed or stand-in scene beds or battle cues
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX IX, X, XII, XIV, XVII, XVIII; FFX-2 XIII, XV, XVI.
- Expected: Each chapter plays its own composed cue (D-209).
- Observed: themes-audit on the candidate: 0 chapters depart from the chapter cue map, but eleven rows are marked "borrowed; owed" (Yojimbo, Natus, Fallen Aeons, Omnis, Trema, Isaaru, Den of Woe, Ixion/Djose, Fins/Core, Sin Face, Mirror Aeons), and 4 of 26 composed cues depart from the bible (PR-0374).
- Repro and seed: node tools/audio/themes-audit.mjs, read the chapter cue map; docs/audio/THEMES.md
- Evidence: critic/rounds/round-26/audio-r55/themes-audit.txt. Confidence: high (confirmed by the confirmer). Requirement: D-209; RUBRIC section 6 audio.
- Smallest fix: Ship music batch 2 (D-785) and have Bailey hear it; nothing to change in this candidate.
- Acceptance check: themes-audit lists those rows as own and the routing samples show the new cue.

### 8. PR-0461 [major, coverage, open] four chapters have no real-key victory in this review, so the milestone gate CHK-022 stays open
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only (III, XIV, XVIII, XXVII). Chapter/state: braskas-final-aeon, isaaru-via-purifico, sin-face, mirror-aeons.
- Expected: Each included chapter reaches its outcome, results, aftermath and retry by one continuous legal-input route (CHK-022).
- Observed: Candidate: Braska's Final Aeon defeat in 357 and 370 turns (still link 1), Isaaru defeat at 42 turns, Sin Face stalled at link 1 command:lulu with 25 empty picks (the route cannot drive the two-pick Doublecast although DOUBLECAST 1 OF 2 is on screen and playable), Mirror Aeons defeat at turn 178 with a 50 min budget (the dedicated continuity run did not finish it). The capture owner's Trema run lost at 32 turns, but the orchestrator's continuity run with a 100 min budget WON Trema by real keys (224 turns, 21 min, results, post scene, board and reload with the tile cleared), so FFX-2 Trema is no longer in this list. Live r54 gives the same outcome as the candidate on the four. The engine's intended line wins all four on 100 to 200 seeds (200/200 Sin Face, 197/200 Braska, 180/200 Isaaru, 148/200 Mirror), so the product is not shown broken; the gate needs a winning real-key run or a human pass.
- Repro and seed: critic/runner/lib/route.mjs <chapter> win --base=<url> (budget 3000000 for Mirror Aeons); live comparison in evidence/r55-live-r54
- Evidence: critic/rounds/round-26/evidence/r55/braskas-final-aeon-win/run.json; critic/rounds/round-26/evidence/r55/isaaru-via-purifico-win/run.json; critic/rounds/round-26/evidence/r55/sin-face-win/run.json; critic/rounds/round-26/evidence/r55/mirror-aeons-win-b50/run.json; critic/rounds/round-26/continuity/ffx2-trema-win-r26/run.json; critic/rounds/round-26/evidence/r55-live-r54/. Confidence: high. Requirement: CHK-022 (milestone gate).
- Smallest fix: Teach route-ui's chooser the DOUBLECAST 1 OF 2 / 2 OF 2 flow and a link-2-capable Chapter III line; or a human pass of the four chapters.
- Acceptance check: CHK-022 PASS for the four chapters by real keys, results, scene, board and reload.

### 9. PR-0421 [major, visual, open] the Ch IV wide camera pull may show the backdrop plate edge
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false. Game: FFX-2. Chapter/state: Ch IV Bahamut.
- Expected: No plate edge or blank margin at any camera pull.
- Observed: Not re-judged this round; the visual auditor still sees Bahamut's wing rim (PR-0423) at 2000x1012 in the same chapter, but no plate edge was measured. ffxcam/solver.ts and extents.ts changed since r54 (FFX), not the FFX-2 camera.
- Repro and seed: Round 25 note; Ch IV change clip
- Evidence: critic/rounds/round-26/evidence/gaps/clip-change. Confidence: low (carried, unverified). Requirement: CHK-008, CHK-011.
- Smallest fix: Re-capture the wide pull at 1600x900 and 2000x1012 and read the edges.
- Acceptance check: Frames at the widest pull show full plate coverage.

### 10. PR-0356 [minor, interface, open] / PR-0391 (carried, widened to release 55's new screens; CHK-003 FAIL): reading text under the 14 px floor and low contrast on the PRESENTATION page, credits and prep
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: pause at 4K; prep tabs.
- Expected: At least 14 css px equivalent at 2160 tall; the coach card does not cover what it teaches.
- Observed: At 1600x900 the PRESENTATION description is about 12-13 px, BOTH GAMES about 11 px at 2.8 to 1, credits descriptions 10-12 px, prep body 13 px (glyph-band measurement on the candidate captures, not a DOM sweep). The advisor card passes.
- Repro and seed: Fresh profile at 3840x2160; Esc from the first menu
- Evidence: critic/rounds/round-26/evidence/r55/savecheck/live-r54/11-presentation-open.png; critic/rounds/round-26/evidence/r55/credits/00-credits.png. Confidence: high. Requirement: CHK-003, CHK-008.
- Smallest fix: Scale pause type with the screen height; place the coach card clear of the active section.
- Acceptance check: Strip text at least 14 css px equivalent at 2160 tall.

### 11. PR-0462 [minor, visual, open] the Kimahri and Lulu rigs sit outside every continuity gate, and the owner's page-side reading shows a Kimahri follow key 1.29 times the idle height that no pixel strip has confirmed
- Tags: introducedByCandidate true, regressionVsLive unknown, inNewFeature true. Game: FFX only. Chapter/state: I Seymour Flux (Kimahri), Biran and Yenke 'gagazet', Sinspawn Gui 'mushroom' (Lulu).
- Expected: A rigged figure keeps its size and feet across a key change as a painted one must, and a gate says so (CHK-026, CHK-027).
- Observed: continuity.json lists no Kimahri in Flux or Biran and Yenke and Lulu has 0 swaps, so the PASS covers painted figures only. Page-side reading of the rig meshes (evidence/r55/rigmeasure): Lulu 0.81 to 1.03 of idle with feet within 0.9 percent (KO 2.7); Kimahri hurt 0.933, cast 0.961, ready 0.984, attack 0.907, critical 0.986, item 1.049 and follow 1.293, item feet 7.7 percent of the plane below idle, feet steps of 0.068 inside the ready key. The follow screenshot is a close-up cinematic push with letterbox bars, so the larger measure may be the camera or the raised spear: the gap pass' own strip attempt discarded its crops and the confirmer could not establish a visible size step. The rigs removed the pose-swap jerks live r54 had for these two figures (Kimahri 63.4 and 59 px, Lulu 48.3 and 42 px). The full rig gate refuses both on this base (release 53 sizing rule), disclosed by the builder; deploy --verify passes.
- Repro and seed: PYREFLY_BROWSER=gpu node critic/rounds/round-26/r55/scripts/rigmeasure.mjs kimahri gagazet (and lulu mushroom); evidence/gaps/t9-rigstrip-kimahri/raw.json
- Evidence: critic/rounds/round-26/evidence/r55/rigmeasure/kimahri-rigmeasure.json; critic/rounds/round-26/evidence/r55/rigmeasure/lulu-rigmeasure.json; critic/rounds/round-26/evidence/r55/rigs-1600x900/rigs.json; critic/rounds/round-26/evidence/gaps/t9-rigstrip-kimahri/raw.json. Confidence: low to medium (a measurement, no strip). Requirement: CHK-026 and CHK-027 intent; release 53 rig sizing rule.
- Smallest fix: Add rig actors to the continuity probe (part vertex bounds and the lowest foot part per frame, per key) with a verdict, and read camera-normalised strips of Kimahri ready to attack to follow to item.
- Acceptance check: continuity.json lists kimahri and lulu with measured key changes and a verdict; strips with head and feet guides show no step.

### 12. PR-0465 [minor, interface, open] at 390x844 the road truncates location names, the ELITE tag runs past the card, begin sits below the fold and the party prep is a shrunk desktop frame
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: Pilgrimage prototype (word 'pilgrim').
- Expected: Names whole, tags inside their card, a reachable begin control, prep at phone size (CHK-009, PR-0295 class).
- Observed: Location lines end in an ellipsis (THE DECK OF THE FA..., CAVERN OF THE STOL..., MUSHROOM ROCK RO...); the red ELITE tag on the Mirror Aeons card is cut by the screen edge; begin needed a scroll into view before a tap landed; the stop-2 prep shows about 3 to 4 px type and a tiny START BATTLE chip on a blank screen. At 1600x900 every sampled name is whole. A Grand Summon aeon gauge with no label is also drawn (interface auditor).
- Repro and seed: 390x844 touch, type pilgrim on the board, BEGIN THE PILGRIMAGE; evidence/r55/pilgrim-390x844/1-route.png, 2-prep-first.png, 5-stop-2-prep.png
- Evidence: critic/rounds/round-26/evidence/r55/pilgrim-390x844/1-route.png; critic/rounds/round-26/evidence/r55/pilgrim-390x844/2-prep-first.png; critic/rounds/round-26/evidence/r55/pilgrim-390x844/5-stop-2-prep.png. Confidence: high. Requirement: CHK-009, CHK-003; RUBRIC section 5 device usability.
- Smallest fix: Wrap or shorten the names and tag, pin begin, and give the Pilgrimage prep the phone view the CHAPTER tab already has.
- Acceptance check: At 390x844 names whole, nothing cut, begin reachable without scrolling, prep type >= 14 css px.

### 13. PR-0468 [minor, interface, open] the advisor card prints NO MP for Lulu's Doublecast of Firaga + Firaga, which spends both spells' MP
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: XVIII Sin: the Face, any Lulu Doublecast.
- Expected: The cost chip shows the pair's summed MP.
- Observed: Card reads "Doublecast: Firaga + Firaga -> Sin / IN SPECIAL / NO MP"; the open list shows Firaga 16 MP, so the pair costs 32 of Lulu's 300. Identical on live r54.
- Repro and seed: FFX Chapter XVIII, Lulu's turn, Special, Doublecast; evidence/r55/sin-face-win/25-doublecast.png
- Evidence: critic/rounds/round-26/evidence/r55/sin-face-win/25-doublecast.png; critic/rounds/round-26/evidence/r55-live-r54/sin-face-win/25-doublecast.png. Confidence: high. Requirement: RUBRIC section 2 (advisor says what it costs); CHK-004.
- Smallest fix: Make the Doublecast suggestion's mpCost the sum of its two casts (MoveAdvisor costChip reads s.mpCost, src/ui/common/MoveAdvisor.ts about line 688, not traced further).
- Acceptance check: A Doublecast suggestion shows N MP equal to the two spells' total.

### 14. PR-0469 [minor, interface, open] the DOUBLECAST - 1 OF 2 title slab is gold on a pale cloud, about 1.3 to 1
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: XVIII Sin: the Face.
- Expected: The list-title slab keeps at least 4.5 to 1 on every backdrop.
- Observed: On the bright sunset the slab above the Doublecast list is close to invisible and "which cast am I on" is its main job; same on live r54.
- Repro and seed: Lulu, Special, Doublecast; evidence/r55/sin-face-win/25-doublecast.png
- Evidence: critic/rounds/round-26/evidence/r55/sin-face-win/25-doublecast.png. Confidence: high. Requirement: CHK-003 contrast.
- Smallest fix: A dark plate or text shadow like the CTB name plates.
- Acceptance check: Slab text over each chapter backdrop >= 4.5 to 1.

### 15. PR-0471 [minor, audio, open] music onsets late or absent at three seams: Chapter V link 5 (about 25 s of silence), Chapter I pre-scene (scene-gagazet only from the next line) and Chapter III link 1 to 2 (about 54 s without a cue)
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false. Game: both (FFX I and III, FFX-2 V). Chapter/state: FFX I pre-scene, FFX III links 1 to 2, FFX-2 V link 5.
- Expected: The cue the THEMES chapter cue map names plays within a few seconds of the scene or link it belongs to.
- Observed: Vegnagun/Shuyin at fast speed: link 5 starts at 220 s with boss-vegnagun, playing goes null at 226 s, boss-shuyin only at 251 s. Chapter I real taps: playing is null for lines 0 to 15 and 3 s after "You talk about him when you think no one listens", scene-gagazet starts on the next line (the silent opening may be intended; cause not traced). Chapter III: boss-jecht in link 1, null at the seam (243 s) and still null when possessed-valefor starts (266 s), boss-yu-yevon from 297 s, as in earlier rounds. Normal-speed timing was not measured and there is no live comparison.
- Repro and seed: evidence/gaps/t12-audio-ffx2-vegnagun-shuyin, t7-audio-scene/out.json, t12-audio-braskas-final-aeon
- Evidence: critic/rounds/round-26/evidence/gaps/t7-audio-scene/out.json; critic/rounds/round-26/evidence/gaps/t12-audio-braskas-final-aeon/. Confidence: low. Requirement: CHK-023, THEMES chapter cue map.
- Smallest fix: Sample the audio log at normal speed on live r54 and the candidate at the same seams before changing anything.
- Acceptance check: At normal speed the named cue is playing within 5 s of the seam on both builds.

### 16. PR-0473 [minor, feel, open] a knock-out has no fall: the figure dissolves and a flat heap fades up in the same spot, and some KO and get-up poses hang above the floor line
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX I, II, VIII; FFX-2 IV, XI (strips of the previous candidate b8aa6f96 and r55 Flux).
- Expected: A knock-out reads as a fall; a KO or get-up pose has floor contact.
- Observed: The fan counted 11 KO swaps that cut or dissolve with no in-between (Kimahri, Rikku, Auron, Shiva, Sandy, Mindy, Cindy) and 4 where Auron, Rikku or Mindy hang in the air before or after the swap. Caveat: most of the strips the fan read lay in directories shared with the previous candidate's run (--tag=r26 reuses the folder names), so their build is b8aa6f96, whose painted pose swap path is unchanged in r55 (src/sprites untouched); the Kimahri KO of Flux is now a rig. The KO dissolve and the camera cuts are Bailey's CHK-B2 judgement (PR-0437).
- Repro and seed: continuity strips swap-006-kimahri-idle-ko, swap-426 (Auron), swap-205 (Mindy); first-time-fan notes
- Evidence: critic/rounds/round-26/chief/in-first-time-fan.json; critic/rounds/round-26/continuity/. Confidence: medium. Requirement: RUBRIC section 6 feel; fan lens D-423.
- Smallest fix: A two or three frame drop for KO poses and a ground-line check on KO and get-up registrations (Bailey decides how much motion a painted KO needs).
- Acceptance check: Fan lens: no KO swap reads as a cut; floating-pose strips gone.

### 17. PR-0474 [minor, harness, open] the 30-post-scene capture waits for a cutscene but the real order is results then scene; and the 10-first-menu-coach / 11-advisor captures of every FFX run show the turn cut-in over the menu
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: six runs (Flux x2, Yunalesca, Macalania, Evrae, Leblanc).
- Expected: Captures show the state they assert.
- Observed: Six 30-post-scene captures are recorded UNVERIFIED (wanted cutscene, got results; the scene itself is shown in 33-after-confirm-scene). The FFX menu captures show the turn cut-in over the menu (R26-HX-01).
- Repro and seed: route.mjs seymour-flux win
- Evidence: critic/rounds/round-26/evidence/r55/index.json. Confidence: high. Requirement: CHK-016.
- Smallest fix: Expect results before the post scene in route.mjs and shoot the menu after the cut-in.
- Acceptance check: No UNVERIFIED 30-post-scene capture.

### 18. FOC54-007 [minor, harness, open] FOC54-007 (critic tooling, carried): the route cannot drive the two-pick Doublecast, so Sin Face stalls at Lulu
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: XVIII Sin: the Face.
- Expected: The route finishes the chapter by real input.
- Observed: sin-face win stalls at link 1 command:lulu after 30 turns and 25 empty picks while DOUBLECAST 1 OF 2 is on screen and every row is choosable; live r54 stalls identically; avoiding Doublecast (sin-face-win-avoid-dc) stalls too.
- Repro and seed: node critic/runner/lib/route.mjs sin-face win --base=<url>
- Evidence: critic/rounds/round-26/evidence/r55/sin-face-win/27-no-choosable-row.png; critic/rounds/round-26/evidence/r55/sin-face-win/25-doublecast.png. Confidence: high. Requirement: CHK-022.
- Smallest fix: Teach route-ui's chooser the DOUBLECAST 1 OF 2 / 2 OF 2 flow (or fall back to Attack after two failed picks).
- Acceptance check: sin-face win reaches results by real input.

### 19. PR-0383 [minor, combat, open] an aeon's Defend row is enabled and inert, and the new immune-status miss now prints IMMUNE over the player's own aeon
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: aeon fights.
- Expected: No inert enabled row.
- Observed: Candidate: Yuna summons Valefor; on the aeon's turn Defend is an enabled row and confirming it emits action-start, miss{targetId valefor, sourceId valefor, reason immune}, action-end (aeonmenu-cand.json). Live r54 emits action-start, action-end only. A fuzz of 51,782 forked row submissions over 15 chapters found exactly 10 friendly-target immune misses, all aeons' Defend. The chief's gap pass pressed Defend by real keys and a 6 s DOM watch found no IMMUNE label (so the label was not reproduced on screen).
- Repro and seed: probe aeonmenu.probe.ts on D:/pyrefly-release55 and M:/pyrefly-r54 (seed 3); hit-apply.ts:337-342
- Evidence: critic/rounds/round-26/audit-combat-r55/aeonmenu-cand.json; critic/rounds/round-26/audit-combat-r55/aeonmenu-live.json; critic/rounds/round-26/audit-combat-r55/immunefuzz-cand.json; critic/rounds/round-26/evidence/gaps/t10-ch3-cand/out.json. Confidence: high (carried, not re-run). Requirement: CHK-004.
- Smallest fix: Hide or grey the aeon's Defend row (research/ffx-combat-core.md 6.2 lists only Shield, Boost and Dismiss) or skip the immune miss when the source is the target and the command is Defend.
- Acceptance check: immunefuzz.probe.ts reports zero friendly immune misses and the aeon menu shows no enabled Defend row.

### 20. PR-0454 [minor, onboarding, open] the COLOUR VISION rows carry no explanation and no preview
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: pause ACCESSIBILITY tab.
- Expected: A player who does not know the terms can pick the right mode and see what changes (RUBRIC section 6 onboarding).
- Observed: Carried; not re-observed on b24614c05 unless the observed text says so. The candidate has no capture of the ACCESSIBILITY tab, TEXT SIZE 115/130, REDUCE MOTION/FLASHES, COLOUR VISION or CONTROLS, and the previous captures cannot be reused (PR-0453 and PR-0454 are open related defects).
- Repro and seed: Esc from the first menu, E to ACCESSIBILITY, step COLOUR VISION
- Evidence: critic/rounds/round-26/evidence/savecheck/02-set-on-red-green.png. Confidence: high. Requirement: RUBRIC section 6 onboarding.
- Smallest fix: A one-line hint under the selected row and ideally a swatch of the four groups.
- Acceptance check: Selecting COLOUR VISION shows a hint readable at 390x844 and at 130 percent TEXT SIZE.

### 21. PR-0453 [minor, interface, open] at 130 percent TEXT SIZE the FFX command-list scroll arrow and the THUNDER sensor chip clip
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: Ch I Seymour Flux first command menu (arrow also on the 390x844 phone).
- Expected: No readable element is cut off at any TEXT SIZE step.
- Observed: accessibility-a2.spec.ts 130 percent tests fail at 1600x900, 2000x1012 and 390x844 naming ffx-cmd-more--down and ffx-sensor__chip. The chief ran the same three tests against live ca9fd0b4 (config copy aimed at echoesofspira.com): the same three fail with the same elements. Not a regression.
- Repro and seed: PYREFLY_BROWSER=gpu, BASE_PATH=/, tests/e2e/accessibility-a2.spec.ts -g 130 from D:/pyrefly-r47 on the candidate and with baseURL https://echoesofspira.com/
- Evidence: D:/Tools/pyrefly-scratch/tmp/pwo-cand; D:/Tools/pyrefly-scratch/tmp/pwo-live. Confidence: high. Requirement: CHK-003, CHK-009.
- Smallest fix: Give the arrow and the chip room (min-width or no overflow clip) at the 130 percent step.
- Acceptance check: The three 130 percent tests pass on the candidate.

### 22. PR-0456 [minor, interface, open] the FFX-2 target-step reticle ring overprints the intent card text
- Tags: introducedByCandidate false, regressionVsLive unknown, inNewFeature false. Game: FFX-2 only. Chapter/state: Ch IV Bahamut, Attack target step, 1600x900.
- Expected: The intent card stays readable while a target is chosen (CHK-008).
- Observed: Re-observed: FFX-2 Ch IV target ring covers the intent card ALSO paragraph. Three pink ellipses of the ring lie over the card and hide part of the ALSO paragraph, E HIDE, NEXT and N HIDE MOVES (viewed by the chief). No live comparison was run.
- Repro and seed: Seed 1, real keys: Ch IV, prep, first menu, Attack
- Evidence: critic/rounds/round-26/evidence/gaps/target-ffx2-bahamut/t1-single.png. Confidence: high. Requirement: CHK-008.
- Smallest fix: Draw the ring under the HUD layer or move the card while the ring is up.
- Acceptance check: The same shot shows the ALSO line and both key hints unobstructed.

### 23. PR-0436 [minor, visual, open] Kimahri and Auron change colour between painted poses
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX I, II (Kimahri, Auron).
- Expected: A figure reads in one colour set across its pose paintings.
- Observed: Kimahri is now a rig in his chapters (one body colour); Auron's coat olive-to-brown change (item to critical) remains for the painted poses. Rikku FFX-2 dresspheres are corrected (CHK-013 PASS). The fan still saw Kimahri blue with an orange sash in one pose and greyish in the next, and Auron coat olive then brown (item to critical).
- Repro and seed: seymour-flux swap-046 Kimahri ready/follow; yunalesca swap-805/807 Auron
- Evidence: critic/rounds/round-26/continuity/seymour-flux-win-r26/continuity/strips; critic/rounds/round-26/continuity/yunalesca-win-r26/continuity/strips. Confidence: medium. Requirement: RUBRIC section 6 visual.
- Smallest fix: The same colour pass as Rikku for Kimahri and Auron, with Bailey strength pick.
- Acceptance check: Strips show one colour set across poses.

### 24. PR-0427 [minor, combat, open] Carried from round 25, not introduced by this change. PR-0427 (FFX only): Counterattack and the Auto-* reactions fire for a sleeping or Threatened wearer
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: reactions.
- Expected: Reactions respect the can-act gate.
- Observed: The combat auditor believes it is fixed by the counter chain (counter-chain.ts reactionCanAct, pinned by parity-ffx-engine-counters) and can be closed; it is left open until a paired probe shows it. Reaction code is unchanged against live; the RC7 gates only add a refund path for a prepaid reaction item.
- Repro and seed: as round 25
- Evidence: critic/rounds/round-25.json. Confidence: medium (carried). Requirement: research/re-ffx-ctb-status.md.
- Smallest fix: Gate reactions on the can-act flag.
- Acceptance check: A sleeping wearer does not trigger a reaction.

### 25. PR-0227 [minor, encounter, open] Carried from round 25, not introduced by this change. PR-0227 / PR-0407 (FFX-2 only, a question for Bailey): Chapters V, XIII and XV are won about half or less at human pace; Chapter XIII retry restores the party
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX-2 only. Chapter/state: V, XIII, XV.
- Expected: A target for difficulty chosen by Bailey.
- Observed: FFX-2 engine and data are identical to live (per-seed W/L identical on 60 seeds; zero-delay Trema 43 of 60, Vegnagun 57 of 60).
- Repro and seed: audit-combat/ffx2-measure-cand.json
- Evidence: critic/rounds/round-26/audit-combat/ffx2-measure-cand.json. Confidence: high. Requirement: RUBRIC section 6 encounter.
- Smallest fix: Bailey decides (method check owed).
- Acceptance check: Bailey's decision.

### 26. PR-0395 [minor, delivery, open] frame stalls; this build shows one 1.1 s frame in Sinspawn Gui, on live r54 too
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: Flux, Bahamut, Yunalesca.
- Expected: Max frame under 800 ms at 58.5 fps or better.
- Observed: Continuity harness, one chapter at a time, 1600x900: Sinspawn Gui worst frame 1,113.5 ms of 22,797 battle frames (p99 23.3 ms; live r54 1,195.2 ms); Flux worst 129.8 ms (live 130.2), Biran and Yenke 132.9 ms. The other chapters' p99 is 21 to 64 ms (Braska 64 ms over a 33-minute fight). Cause not located (the Bushido minigame confirm at about 291 s and the link-2 seam at 312 s are the nearest events).
- Repro and seed: compare serial candidate and live probes
- Evidence: critic/rounds/round-26/continuity/continuity-summary.json. Confidence: low. Requirement: RUBRIC section 2.
- Smallest fix: Record the timestamp and frame index of the longest frame beside the battle log; a first-draw warm-up is the usual remedy.
- Acceptance check: maxDtMs under 250 ms in Sinspawn Gui on the same host.

### 27. PR-0397 [minor, harness, open] the stock route Phoenix-Downs Yunalesca, so Chapter II has no real-key win on this candidate
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX. Chapter/state: Ch II Yunalesca.
- Expected: One real-key Chapter II win with post scene and results.
- Observed: Five stock-route attempts over two runs: defeats of 139, 139, 121 and 124 turns and one stall (14 Phoenix Down picks aimed at Yunalesca per run.json). The engine intended line wins seeds 1, 1001 and 2001 and 180 of 200 fresh seeds; attack-only and random win 0 of 60. No product fault found.
- Repro and seed: node critic/runner/lib/route.mjs yunalesca win --attempts=3 --budget=2700000, seed 1
- Evidence: critic/rounds/round-26/evidence/yunalesca-win-b45/run.json; critic/rounds/round-26/audit-combat/yuna-routeseeds.json. Confidence: high on the harness limit. Requirement: CHK-022.
- Smallest fix: In critic/runner/lib/route-pure.mjs resolveTargetId return the exact-id match before any prefix match (fold in the round 25 patch), then rerun Chapter II at seeds 1 to 5.
- Acceptance check: Chapter II stock route wins with 0 target mismatches.

### 28. PR-0450 [minor, harness, open] 
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: critic harness.
- Expected: A harness fails fast with a clear cause and captures the move it names.
- Observed: A preview started without BASE_PATH=/ answers 200 for / but 404 for assets and every route times out at 120 s with no message (first continuity run, 0 s of battle); queue.mjs ran the continuity probe with no pose registration, so its CHK-026 FAIL up to 69.6 percent is an instrument artefact (the dedicated run PASSES on registered heads); the attack and special clips open the target step and press Defend, so no strike or special resolves in them (the fan UI-covering-the-action breaker rests on these and is dropped).
- Repro and seed: continuity/run.failed-localhost.err; gaps/clips2.mjs
- Evidence: critic/rounds/round-26/continuity/run.failed-localhost.err; critic/rounds/round-26/gaps/clips2.mjs. Confidence: high. Requirement: RUBRIC section 5 (separate harness from product failures).
- Smallest fix: route-evidence.mjs checks the first script URL and says wrong base path within 10 s; clips press Enter twice and wait for the enemy turn.
- Acceptance check: A wrong-base preview prints the message within 10 s; clip.json marks an action-start within 2 s.

### 29. PR-0458 [minor, delivery, open] the owner first name ships in the JS bundle through 11 face-crops notes
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: production bundle.
- Expected: No personal name in player-visible code (public repo, no PII).
- Observed: index-DA6NOD0r.js carries notes like Bailey pick 2026-09-24 from src/ui/common/face-crops.json (11 occurrences). The live source ca9fd0b4 has the same 11 (verified by the chief). dist-local-paths passes because it checks paths, links and sidecar keys only.
- Repro and seed: grep -o Bailey in M:/pyrefly-builds/r47-deep/dist-gate/assets/index-DA6NOD0r.js
- Evidence: critic/rounds/round-26/gates/dist-local-paths.log. Confidence: high. Requirement: public-repo no-PII standing rule.
- Smallest fix: Strip the note fields from the shipped projection of face-crops.json, as was done for the art sidecars.
- Acceptance check: 0 hits for Bailey in the built assets.

### 30. PR-0366 [minor, interface, open] first-time cards, the coach slab and HUD panels stand over the painted figures and each other
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX I (Biran and Yenke first menu), IX, XII, XVII; FFX-2 IV; fan: FFX-2 V, VI, XV, XVI, XI, XIII.
- Expected: No panel covers the party or the picture of an active fight.
- Observed: Re-observed on the candidate: the Auron coach card covers the party in Ch XVII, the coach card covers the Ronso brothers' legs in the Kimahri chapter, the intent card cuts the guide text in IX and XII and the first-turn dialogue covers the command rows at 390x844. The fan also read the chain counter box over the first letters of CHANGE/ITEM/SKILL and the guide panel over Paragon in the previous candidate's FFX-2 frames (8 frames); those were not re-seen on r55. First-time-only and dismissable.
- Repro and seed: evidence/r55/sin-fins-core-win/10-first-menu-coach.png, evidence/r55/rigs-1600x900/biran-yenke-first-menu.png
- Evidence: critic/rounds/round-26/targets/40-sin-fins.jpg; critic/rounds/round-26/evidence/r55/rigs-1600x900/biran-yenke-first-menu.png. Confidence: high. Requirement: CHK-008.
- Smallest fix: Dock the first-time card to a free corner and keep the chain box clear of the menu.
- Acceptance check: No panel overprints the party in the first-menu frames.

### 31. PR-0372 [minor, onboarding, open] at 390x844 the pause OPTIONS settings window shows about 3 to 4 of 10 settings and cuts its tab strip
- Tags: introducedByCandidate unknown, regressionVsLive false, inNewFeature false. Game: both (PRESENTATION); FFX (VOICE, VOICE-OVER). Chapter/state: pause OPTIONS at 390x844.
- Expected: A phone player can scroll to PRESENTATION and tap it; the cut row reads as scrollable.
- Observed: The settings block is a short window: MASTER VOLUME, MUSIC, SOUND EFFECTS and a VOICE row cut across its middle; VOICE-OVER, TEXT SPEED, EYE CANDY, STRATEGY GUIDE, BATTLE HELP and PRESENTATION are below it. The window cuts TEXT SPEED on the 2026-10-14 build, so the window is not new, but release 55 adds three rows under it. The 390x844 save run reached PRESENTATION by ArrowDown; a touch scroll and tap was not captured.
- Repro and seed: 390x844 touch, Chapter I, pause (Esc), OPTIONS; try to scroll the settings block with a finger and tap PRESENTATION
- Evidence: critic/rounds/round-26/evidence/r55/seymour-flux-lose-p390-touch/14-pause-options.png; critic/rounds/round-26/evidence/r55/savecheck/release-37.1-p390/10-options-before.png. Confidence: medium. Requirement: RUBRIC section 5 device usability.
- Smallest fix: Capture the touch scroll first; if unreachable, a visible scroll cue or a taller window (pause-phone.css, not traced).
- Acceptance check: By touch alone PRESENTATION opens at 390x844 and the cut row shows a scroll cue.

### 32. PR-0434 [minor, interface, open] / PR-0354 (carried, re-observed): Seymour Omnis intent prints an inverted range and two cards say "Deals no damage" above a damage table
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: XII Seymour Omnis.
- Expected: Ranges read low to high; a card with a damage table does not say it deals none.
- Observed: Re-observed by the interface auditor on the candidate; unchanged from round 25.
- Repro and seed: Seymour Omnis, E for the enemy move panel
- Evidence: critic/rounds/round-26/evidence/r55/seymour-omnis-win/run.json. Confidence: medium. Requirement: CHK-004, honest intent.
- Smallest fix: Sort the range and drop the contradicting line.
- Acceptance check: No inverted range and no contradiction on the Omnis cards.

### 33. PR-0457 [minor, visual, merged into PR-0459] figures change apparent size and stance at pose swaps
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX-2 IV, FFX II.
- Expected: A figure keeps its height across poses except where the painting differs by design.
- Observed: The harness now reports the same class as CHK-026 FAIL on named chapters (PR-0459).
- Repro and seed: Strips swap-020, 024, 058, 164, 264 in ffx2-bahamut-win-r26 and swap-022 in yunalesca-win-r26
- Evidence: critic/rounds/round-26/continuity/ffx2-bahamut-win-r26/continuity/strips; critic/rounds/round-26/continuity/yunalesca-win-r26/continuity/strips. Confidence: low to medium. Requirement: CHK-026 (registration limit, RUBRIC 6a); D-420.
- Smallest fix: Register the heads of the 737 mass-read swaps so CHK-026 judges them on the 3 percent line; Bailey eye is the independent check (CHK-B3).
- Acceptance check: measuredWithRegistration covers Paine, Rikku, Auron and Kimahri and none is over 3 percent.

### 34. PR-0451 [polish, combat, open] bosses obey Silence since r48 and no measurement of a Silence line exists
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: Seymour Flux phase 2, Macalania, Natus, Omnis, Sin Genais, Evrae, Yunalesca counters.
- Expected: A behaviour change that moves a canonical tactic is disclosed and captured once.
- Observed: No balance measurement of a Silence line was made by the builder or this round; the intended-line bench never casts Silence, so 2,400 of 2,400 identical plays say nothing about it. The release note covers Silenced Yuna; no sentence says bosses lose Silence-flagged spells.
- Repro and seed: Compare blockedBySilence callers at ca9fd0b4 and b8aa6f96; critic/rounds/round-26/audit-combat/gated.out; tests/unit/parity-ffx-engine-command.test.ts enemySilenced cases
- Evidence: critic/rounds/round-26/audit-combat/gated.out; src/battle/ffx/command-start.ts; src/battle/ffx/execute.ts. Confidence: high on the code and flags, medium on the player-visible effect (not captured). Requirement: AGENTS.md rule 14, CHK-021, CHK-023.
- Smallest fix: One sentence in the release note and CHANGELOG (bosses obey Silence now); capture one Silenced Seymour turn by real keys; measure a Flux Silence line over 40 seeds before and after. Any on-screen cue is a proposal needing Bailey yes.
- Acceptance check: Release note names the rule; a real-key capture of a Silenced boss turn exists.

### 35. PR-0437 [polish, feel, open] the Change clip pushes the camera in hard and shoves the party to the frame edge
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX-2. Chapter/state: Ch IV change clip.
- Expected: A coherent camera at a dressphere change.
- Observed: Sampled frames show a tight framing with Yuna, Rikku and Paine about 1.3 times larger and the dragon moved.
- Repro and seed: clip-change screencast
- Evidence: critic/rounds/round-26/evidence/gaps/clip-change. Confidence: low to medium. Requirement: RUBRIC section 6 feel.
- Smallest fix: None proposed; Bailey decides.
- Acceptance check: Bailey's verdict.

### 36. PR-0438 [polish, feel, open] a white flash swamps the figure or the whole screen for a frame or several
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX II summon; FFX-2 IV hits.
- Expected: A flash builds up and the pose stays readable.
- Observed: The summon clip goes pure white in one frame (c0400 to c0401, mean brightness 84 to 254) and fades over ten; Paine and Rikku hits blow out for 3 to 5 frames. REDUCE FLASHES (new) softens these but was not captured.
- Repro and seed: gaps/clip-summon screencast frames c0400 to c0411; ffx2-bahamut jerk-009
- Evidence: critic/rounds/round-26/evidence/gaps/clip-summon. Confidence: medium. Requirement: RUBRIC section 6 feel.
- Smallest fix: Ease the summon flash in over two frames.
- Acceptance check: No frame-to-frame brightness jump over 100 in the summon clip.

### 37. PR-0374 [polish, audio, open] themes-audit FAILs 4 of 26 composed cues against the bible (scene-gagazet, scene-dreams-end, scene-farplane, scene-macalania-temple)
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX I, III, V, VII, IX to XII, XIV; FFX-2 V, XI.
- Expected: The bible and the cues agree or an exception is recorded.
- Observed: themes-audit on the candidate: 4 of 26 cues depart from the bible; 0 chapters depart from the chapter cue map. Same output as round 25.
- Repro and seed: node tools/audio/themes-audit.mjs
- Evidence: critic/rounds/round-26/audio/themes-audit.txt. Confidence: high. Requirement: CHK-001.
- Smallest fix: Record the four as accepted exceptions or fix the bible rows.
- Acceptance check: themes-audit reports 0 of 26 depart.

### 38. PR-0326 [polish, audio, open] the first SFX of a cold session fell back to the synth in 1 of 27 runs
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX. Chapter/state: Ch III first run (loaded host).
- Expected: No synth fallback for a UI cue once the sprite is requested.
- Observed: Cursor-move x2 and confirm played via synth 2.3 to 2.95 s in; the rerun was clean; 26 of 27 runs clean.
- Repro and seed: evidence/braskas-final-aeon-win/audio-debug.jsonl first row
- Evidence: critic/rounds/round-26/evidence/braskas-final-aeon-win/audio-debug.jsonl. Confidence: medium. Requirement: CHK-001, CHK-023.
- Smallest fix: Queue the first tick until the sprite has decoded.
- Acceptance check: Five cold loads on a throttled CPU show no synth row.

### 39. PR-0466 [polish, audio, open] its screens always play chapter-select B, ignoring CHAPTER MUSIC A or C
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: Pilgrimage route and prep screens.
- Expected: The track follows OPTIONS > PRESENTATION > CHAPTER MUSIC like the board.
- Observed: src/app/pilgrim/PilgrimScreens.ts:64 calls audio.playMusic('chapter-select'); the board uses chapterSelectCue(readSetting('chapterSelectMusic')) (BattleScreenFlow.ts:300). Traced in code, not heard.
- Repro and seed: Set CHAPTER MUSIC to A, open the board, type pilgrim, read audio.debug().playing
- Evidence: src/app/pilgrim/PilgrimScreens.ts:64; src/app/screens/BattleScreenFlow.ts:300. Confidence: medium. Requirement: CHK-023.
- Smallest fix: Use chapterSelectCue(readSetting('chapterSelectMusic')) there.
- Acceptance check: With A chosen, playing stays chapter-select-a on the route screen.

### 40. PR-0470 [polish, audio, open] at default sliders the voice sits only about 3 dB above ducked music, and mid-battle lines do not duck the effects bus (computed, not heard)
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: any voiced scene or mid-battle beat.
- Expected: Spoken lines intelligible over score and effects (THEMES: duck, do not fight).
- Observed: Music -16 LUFS file x 0.7 slider (-3.1 dB) x duck 0.668 (-3.5 dB) is about -22.6 LUFS; the voice is about -19.7 LUFS dual-mono at 0.9: a margin near 2.9 dB, a 24 kHz mono 64 kbps voice against a full-band score; SFX are +6 dB against the old default (D-293) and are not ducked. Arithmetic from AudioManager.ts constants and the measured file levels; no agent can hear.
- Repro and seed: Arithmetic in audio-r55/voice-measure.json; listen in Chapter II pre-scene and a Flux mid-battle callout at default sliders
- Evidence: critic/rounds/round-26/audio-r55/voice-measure.json; src/audio/AudioManager.ts; src/audio/voice/VoiceDirector.ts. Confidence: low (computed; needs Bailey's ear). Requirement: CHK-B1 owner listening.
- Smallest fix: Only if Bailey finds lines masked: deepen the duck (VOICE_DUCK_GAIN toward 0.5) or lift the voice target; one constant each.
- Acceptance check: Bailey's ear on a voiced scene and a voiced mid-battle beat at default sliders.

### 41. PR-0472 [polish, process, open] the voices are Fish Audio Drama 3 clones of the original cast, and the decision ledger still says "never a clone" (D-521, D-554) with no row for the change
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: all 12 voiced FFX chapters.
- Expected: A change to what Bailey approved is a decision row before it ships (AGENTS.md); hard rule 8 "original assets only" is answered by a recorded permission.
- Observed: The 222 recordings are clones of the original cast (commit a771af83a: Bailey "i'll go with the fish clone for all characters"). A search of docs/target/decisions.json and DECISIONS.md finds no Fish, clone or Drama 3 row. The brief states Bailey holds the cast's and Square Enix's permission; the critic cannot verify that and does not judge it. The credits line and AI disclosure are present (credits capture hasFish true).
- Repro and seed: grep -in "fish\|clone\|drama" docs/target/decisions.json DECISIONS.md
- Evidence: critic/rounds/round-26/evidence/r55/credits/credits.json; docs/target/decisions.json. Confidence: high that the record is missing; the permission itself is unverifiable. Requirement: AGENTS.md ledger rule and hard rule 8.
- Smallest fix: Add a decision row superseding the "never a clone" clause with Bailey's words and his statement of permission; rerun tools/decisions-ledger.mjs.
- Acceptance check: decisions-ledger --check passes and the row names D-521/D-554.

### 42. PR-0386 [polish, onboarding, open] the board's first coach says "Click its picture to begin" to keyboard and pad players
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: chapter select.
- Expected: The coach names the input in use.
- Observed: Seen in the fresh-profile keyboard and pad runs (board text: AURON 1 OF 3 "Start with the first one." Click its picture to begin).
- Repro and seed: fresh profile, title, board
- Evidence: critic/rounds/round-26/chief/save-edge/3-truncated-blob.png. Confidence: high. Requirement: RUBRIC section 6 onboarding.
- Smallest fix: Say "Press Enter" for keys and pad.
- Acceptance check: The coach names the active input.

### 43. PR-0330 [polish, interface, open] some advisor cards carry no effect line
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: sampled chapters.
- Expected: Every advisor card has an effect line.
- Observed: Re-observed by the interface auditor; unchanged.
- Repro and seed: the advisor card in the 18 chapter routes
- Evidence: critic/rounds/round-26/evidence/r55/index.json. Confidence: medium. Requirement: CHK-004.
- Smallest fix: Fill the missing effect lines.
- Acceptance check: No card without an effect line.

### 44. PR-0467 [polish, feel, open] the Grand Summon picker refuses a greyed aeon with no cue, and its header text is clipped behind Braska's art
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only. Chapter/state: III Braska's Final Aeon (injected KO state).
- Expected: A refused confirm shakes and plays the error cue like the command menu does; the caption is readable.
- Observed: Confirming the KO'd Valefor in Yuna's Grand Summon picker produces no events and no shake or cue (ch3.json afterConfirmValefor newEvents []; the picker's confirm branch has no cue call). In the Summon list the help line under a greyed Valefor still reads "Calls Valefor onto the field". The caption AEON ARRIVES WITH A FULL OVERDRIVE is clipped behind Braska's art at 1600x900. Bahamut (fifth row) is reachable with Down and fully visible (gap pass), so the earlier "fifth aeon below the fold" worry is not confirmed.
- Repro and seed: Chapter III link 1 with Valefor KO'd and Yuna's gauge full; Overdrive, Grand Summon, click Valefor; evidence/r55/ch3-grand-summon/05-grand-summon-valefor-clicked.png
- Evidence: critic/rounds/round-26/evidence/r55/ch3-grand-summon/ch3.json; critic/rounds/round-26/evidence/r55/ch3-grand-summon/05-grand-summon-valefor-clicked.png; critic/rounds/round-26/evidence/gaps/t10-ch3-cand/link1-turn1-grand-open.png. Confidence: medium (state injected; behaviour clear from the result and the traced code). Requirement: RUBRIC section 6 feel (responsive input).
- Smallest fix: Call the same shake and refusal cue from the picker's refused confirm; hide the help line of a greyed row; give the caption room.
- Acceptance check: Confirm on a greyed row plays the shake and cue; the caption reads whole.

### 45. PR-0463 [polish, visual, open] a knocked-out Kimahri collapses behind Tidus and the two overlap into a tangle of limbs
- Tags: introducedByCandidate true, regressionVsLive unknown, inNewFeature true. Game: FFX only. Chapter/state: I Seymour Flux.
- Expected: A KO'd party member lies clear of the active member at the idle stage points.
- Observed: Seed 1, Kimahri at 0 HP: the rig KO pose (tail up, boots and spear head out to the left) sits at Tidus's ground point, so his legs and sword read over a grey heap. Live r54 laid the painted KO figure to the right of Tidus.
- Repro and seed: Seymour Flux seed 1; let Lance of Atrophy zombify then KO Kimahri; evidence/r55/seymour-flux-win/16-target-single.png (crop vis/kko.jpg)
- Evidence: critic/rounds/round-26/vis/kko.jpg; critic/rounds/round-26/evidence/r55/seymour-flux-win/16-target-single.png. Confidence: medium. Requirement: CHK-014 shot composition.
- Smallest fix: Offset the rig KO pose a few units along the ground line, or draw it behind Tidus with the dissolve the painted KO had.
- Acceptance check: Tidus and a KO'd Kimahri overlap by no more than a hand's width at the idle stage points.

### 46. PR-0464 [polish, visual, open] The Echo title leaves an empty band in the ink slab where the wordmark was hidden
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: both (the title is shared). Chapter/state: title.
- Expected: The slab closes up when the wordmark is hidden, as it does for the key-art title.
- Observed: With TITLE SCREEN set to THE ECHO the slab shows AN UNOFFICIAL FAN TRIBUTE, an empty strip and the rule, then PRESS ENTER; the painted lettering, the reflection and the painting render cleanly at 1600x900 and 390x844 and nothing clips.
- Repro and seed: A save with titleArt echo (PRESENTATION, TITLE SCREEN, THE ECHO), reload; evidence/r55/savecheck/release-37.1/20-title-echo-after-reload.png
- Evidence: critic/rounds/round-26/evidence/r55/savecheck/release-37.1/20-title-echo-after-reload.png; critic/rounds/round-26/evidence/r55/savecheck/release-37.1-p390/20-title-echo-after-reload.png. Confidence: high. Requirement: Ink and Gold slab rules.
- Smallest fix: Collapse the title block of the slab when the wordmark is hidden.
- Acceptance check: No empty band at either size.

### 47. PR-0455 [polish, narrative, open] unattributed lines (five Guado guard lines in Ch VII, the four (Whistle) lines with blank speakers)
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: FFX VII Macalania; FFX-2 VII-adjacent whistle lines.
- Expected: A speaker on every spoken line.
- Observed: dboxTimeline shows blank speakers on those lines. Not changed by this build (src/story unchanged).
- Repro and seed: Play the chapter by real keys; run.json dboxTimeline
- Evidence: critic/rounds/round-26/evidence/seymour-anima-macalania-win/run.json. Confidence: high. Requirement: RUBRIC section 6 narrative.
- Smallest fix: Give the Guado lines a speaker tag.
- Acceptance check: dboxTimeline shows a speaker on every line.

### 48. PR-0262 [polish, narrative, open] Carried from round 25, not introduced by this change. PR-0262 / PR-0390 / PR-0429 (narrative polish): the results quip ...Okay. Next one. on four chapters, FFX-2 XIII, XV and XVI opening in unattributed third person, Shuyin line repeating three times in about 48 s
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: I, V, VIII, IX, XIII, XV, XVI, XVIII.
- Expected: Attributed lines and no repeated quip.
- Observed: Re-observed on the candidate: results quip "...Okay. Next one." on Chapters I, II and XVII; Omnis says "Rest now. All of you, together." 5 times in 8.7 min; Shuyin's line repeats 3 times in 48 s. src/story changed only for the voice plumbing and the Isaaru line. dboxTimeline shows them; src/story is unchanged by this build.
- Repro and seed: run.json dboxTimeline
- Evidence: critic/rounds/round-26/evidence/ffx2-vegnagun-shuyin-win/run.json. Confidence: high. Requirement: RUBRIC section 6 narrative.
- Smallest fix: Vary the quip, attribute the openers, cap Shuyin line at two uses.
- Acceptance check: No line repeated more than twice in a fight.

### 49. PR-0452 [polish, combat, open] the shared StatusId comment still says Silence blocks Summon
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: src/battle/common/types.ts:207.
- Expected: The comment states per game what Silence gates.
- Observed: Line 207 says it blocks White and Black Magic and Summon; RC7 proved FFX Silence does not gate Summon. The card, the Studio row, commands.ts and the status data were corrected, this comment was not.
- Repro and seed: Read src/battle/common/types.ts:207
- Evidence: src/battle/common/types.ts. Confidence: high. Requirement: AGENTS.md rule 14.
- Smallest fix: Reword the comment: FFX gates the commands whose record carries the Silence flag (Scan included), not Summon.
- Acceptance check: No FFX claim of Summon near the Silence comment.

### 50. PR-0475 [polish, onboarding, open] with a gamepad the first party-prep guide says ESC SKIP THE GUIDE, and the pad's cancel leaves to the board instead
- Tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature false. Game: both (seen in FFX Chapter I). Chapter/state: I Seymour Flux, first party prep, fresh profile, gamepad.
- Expected: The hint names the pad's own button and that button dismisses the guide as Esc does.
- Observed: Gamepad run: prep text reads ESC SKIP THE GUIDE; the first cancel went to chapter-select where the keyboard run stays on party-prep (the pad is emulated by the harness; its cutscene footer shows pad glyphs).
- Repro and seed: Fresh profile, gamepad: title, board, Enter on Seymour Flux, cancel on the first prep with the Auron 2 OF 3 guide
- Evidence: critic/rounds/round-26/evidence/r55/seymour-flux-lose-pad-pad/run.json. Confidence: medium. Requirement: RUBRIC section 6 onboarding and controls.
- Smallest fix: Give the prep coach the pad glyph and make the pad's cancel dismiss the guide first.
- Acceptance check: With the pad the first cancel dismisses the guide and stays on prep.

### 51. PR-0476 [polish, delivery, open] tests/unit/advisor-floor.test.ts "holds across 3. Braska's Final Aeon" has a 15 s limit and needs 9.5 s alone, so it times out under load
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: unit suite.
- Expected: The full suite is green on a loaded host.
- Observed: Full unit suite on the candidate: 1,481 files, 1,455 passed, 25 skipped, 1 failed (this test, timeout); alone it passes 23 of 23 in 9.5 s.
- Repro and seed: npm test while other agents run browsers; audit-combat-r55/full-unit-cand.out
- Evidence: critic/rounds/round-26/audit-combat-r55/full-unit-cand.out; critic/rounds/round-26/audit-combat-r55/advisor-floor-cand.out. Confidence: high. Requirement: AGENTS.md "Done means".
- Smallest fix: Raise that test's timeout or split the chapter loop.
- Acceptance check: The full suite passes under load.

### 52. PR-0477 [polish, delivery, open] a hand-edited saved voiceVolume above 1 is kept as it is (the audio clamps it), where the four other new fields are normalised
- Tags: introducedByCandidate true, regressionVsLive false, inNewFeature true. Game: FFX only (VOICE row). Chapter/state: save load.
- Expected: migrate clamps a volume to 0..1 like the audio bus does.
- Observed: Browser run with settings {titleArt: nope, voiceVolume: 7, chapterSelectMusic: z, voiceOn: "yes"}: titleArt reads farplane, chapterSelectMusic b, voiceOn true (the defaults) and the page runs with no console error, but snapshotState reports voiceVolume 7. AudioManager.setVoiceVolume clamps to 1, so only the pause row (pct of the stored value) could read wrong; not captured. Reachable only by editing storage by hand.
- Repro and seed: chief/save-edge.mjs case 1-garbage-values
- Evidence: critic/rounds/round-26/chief/save-edge/results.json; src/app/SaveData.ts:302; src/audio/AudioManager.ts:710. Confidence: high for the stored value; the displayed row was not captured. Requirement: CHK-024 invalid storage.
- Smallest fix: Clamp voiceVolume to 0..1 in migrate (one line next to the finite check).
- Acceptance check: The garbage case reports voiceVolume 1.

### 53. PR-0447 [suggestion, encounter, open] random legal play wins Chapter IX (Yojimbo) 16 of 60 seeds
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: FFX only. Chapter/state: yojimbo-cavern.
- Expected: Bailey's difficulty call.
- Observed: Unchanged and identical to live: random legal play wins Yojimbo 10 of 40; the hidden Last Summoning is won 60 of 60 by attack-only and by random play, Biran and Yenke 54 of 60 by random play (a question for Bailey, see proposals). Identical per seed on live and candidate; every other FFX chapter 0 of 60.
- Repro and seed: audit-combat/naive.probe.ts PROBE_POLICY=random
- Evidence: critic/rounds/round-26/audit-combat/naive-cand-random.json. Confidence: high. Requirement: RUBRIC section 6 encounter.
- Smallest fix: None proposed.
- Acceptance check: Bailey's decision.

### 54. PR-0446 [suggestion, audio, open] boss-seymour and chapter-select fail the stereo gate, and the new alternate chapter-select-a does too
- Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false. Game: both. Chapter/state: Ch I, XII; chapter select.
- Expected: Bailey picks the as-heard or the narrowed variant by ear.
- Observed: tools/audio stereo gate on the shipped files: chapter-select-a corr 0.529, side/mid -5.08 dB, mono-sum loss -1.17 dB (fails all three; new and never the default); boss-seymour 0.293 / -2.62 / -1.89 and chapter-select 0.431 / -4.00 / -1.46 fail on the live build too. THEMES records all three as known. Bailey's 2026-09-28 "tinny and hollow" verdict named this decorrelation as the measured cause of hollowness.
- Repro and seed: node stereo-gate.mjs
- Evidence: critic/rounds/round-26/audio-r55/stereo-gate.txt; docs/audio/THEMES.md. Confidence: high. Requirement: D-582.
- Smallest fix: Ask Bailey once.
- Acceptance check: Bailey's pick.

## First-time fan breakers and where they went
The fan lens (D-423) lists what would break a watching player's immersion; each root defect is one issue.
- Half-motion, ghosting, crossfade between very different stances (about 80 of 86 strips; 14 of them big stance changes): PR-0379.
- KO with no fall, KO and get-up poses off the floor (11 and 4): PR-0473.
- Jerks, entrances and see-through entrances, camera cuts in a move, size jumps in one frame (Rikku 80 px, Yuna 195 px at a dress sphere change; FFX-2 Fallen Aeons and Bahamut strips): PR-0380 for the jerk class; the size-jump instances are the same class as PR-0459, and the Fallen Aeons strips were the previous candidate's.
- White blooms that hide the figure for about 10 frames (Sandy, Rikku, Paine): PR-0438 (carried).
- Panels over the action (chain counter over CHANGE/ITEM, guide panel over Paragon, intent card over Shiva): PR-0366.
- Kimahri's KO "tiny pale lump": the figure is now a rig; the placement against Tidus is PR-0463.

## What stands between this build and acceptance
A deep review cannot accept a milestone. For the finished-milestone gate (9.60 unrounded, every category at least 9.0, nothing UNVERIFIED, no open critical or major issue, every encounter through its real flow, every required target matched, human judgments recorded, the exact artifact verified live) the open work is:
- PR-0380: figures and some bosses jump 40 px or more in one frame at pose swaps and entrances
- PR-0379: every pose change is a dissolve, for 3 to 8 frames two poses of one figure are drawn at once
- PR-0459: the continuity harness finds a painted figure moving its own stance or drawing outside its height band at pose swaps in several chapters
- PR-0460: Chapter III possession links 3 to 6 draw every remaining aeon as a greyed Summon row, and Enter on one does nothing
- PR-0295: heavy party-prep tabs are a desktop frame shrunk onto a 390x844 phone, text about 3 px
- PR-0148: no numeric owner listening score for the shipped mix, and now none for the two chapter-select alternates or the 222 voice lines
- PR-0099: eleven chapters still play borrowed or stand-in scene beds or battle cues
- PR-0461: four chapters have no real-key victory in this review, so the milestone gate CHK-022 stays open
- PR-0421: the Ch IV wide camera pull may show the backdrop plate edge
- Unscored categories: audio (needs Bailey's listening), onboarding (ACCESSIBILITY tab, text size, colour vision on the candidate), prep (every prep tab past CHAPTER), delivery (cold load on named hardware, other browsers and a real phone and pad).
- continuity harness (CHK-026, CHK-027) for 1 listed chapters that had not finished when the chief wrote this: mirror-aeons; real-key winning runs for Braska's Final Aeon, Isaaru, Sin Face, Mirror Aeons (CHK-022); Chapter III links 2 to 7 and the Last Summoning after link 1 as a real-key chain (CHK-023); the owner's listening verdict and number (CHK-B1) and the touch/pad/other-browser coverage of CHK-015; CHK-002 shapes (1280x720, 2560x1080, 3840x2160) for the FFX-2 pause, the title, the CHANGELOG panel and the PRESENTATION page (the FFX Chapter I pause was done by the chief).
- Scores under the 9.0 floor: encounter 8.9, visual 8.6, feel 8.3, narrative 8.7, interface 8.2.
- 15 unverified targets and 1 waiting (tile 35); seven human judgments unrecorded.

## What changed since the previous round 26 (b8aa6f96, 2026-10-14)
No score is compared with rubric v1 rounds 02 and 03. Against the 2026-10-14 report of this round: combat 9.5 and encounter 8.9 are unchanged (no enemy, AI or boss number changed; the one play-moving change is the Grand Summon fix); visual 8.7 to 8.6 and feel 8.5 to 8.3 on the specialists' reading (the rig motion and 16 of 19 chapters were unobserved at the time they scored); narrative 8.7 and interface 8.2 are scored again (they were UNVERIFIED last time); audio, onboarding, prep and delivery remain UNVERIFIED. CHK-024 is PASS with the edge cases run in a browser; CHK-001 moved from FAIL to UNVERIFIED because the old failure was the technical half, which now passes. CHK-026 moved from PASS (5 chapters) to FAIL (7 of 18 chapters) because the harness now finishes more chapters; whether that is a change in the build is what the live baseline answers. The new work of release 55 (titles, PRESENTATION, CHANGELOG, voice-over, the Kimahri and Lulu rigs, the RE parity switches, the Pilgrimage prototype) is judged above; the rigs removed the Kimahri and Lulu swap jerks that live r54 has.

## Proposals (nothing here is built without Bailey's yes)
- Give the Pilgrimage prototype a phone layout pass before it leaves "hidden" (PR-0465), and have it follow CHAPTER MUSIC (PR-0466). Fit: FFX only. Needs Bailey's yes; a mockup first (hard rule 9).
- Question for Bailey: should the other aeons be callable during a Chapter III possession link (PR-0460)? The sources do not say; the answer decides whether the rows are enabled or removed. Fit: FFX only.
- Question for Bailey: voice-over covers Tidus, Yuna and Auron only, so voiced and unvoiced lines alternate inside one scene (Jecht, Braska, Yunalesca, young Auron are text only). Voice more speakers or leave it. Fit: FFX only.
- Question for Bailey: the hidden Last Summoning is won 60 of 60 by attack-only and random play and Biran and Yenke 54 of 60 by random play. Should hidden chapters punish credible mistakes? Fit: FFX only.
- Question for Bailey (R26-IF-05): rows greyed by the new menu-draw parity carry no reason line; the original game shows none either. Add a one-line reason or keep faithful? Fit: FFX only.
- Question for Bailey (R26-ON-01, low confidence): CONTROLS is a reference list with no key remapping. Fit: both.
- Fade or slide boss and aeon entrances and the Overdrive cut-in over 3 frames (PR-0380); give KO poses a short drop (PR-0473). Fit: both. Needs Bailey's yes.
- Tooling, no Bailey decision: add rig actors to the continuity probe (PR-0462), teach the route the Doublecast (FOC54-007), expect results before the post scene (PR-0474), raise the advisor-floor test timeout (PR-0476), and give the continuity runner distinct folder tags per build so a fan never reads another build's strips.

## Server hygiene
The chief started no vite preview and no long-lived server. Servers seen: the orchestrator's vite preview of dist-gate on 127.0.0.1:5731 (listening PID 55972, parent npx PID 45232) and its continuity harness (PID 54076) are not the chief's; the chief used port 5731 read-only for the save-class runs and the live baseline ran against https://echoesofspira.com/. The driver must stop those by PID and confirm the port is closed before the release cut.
