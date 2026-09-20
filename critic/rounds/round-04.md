# Critic round 04 — deep review of Build A.1 (candidate `bc2571c`)

```text
Build / artifact / target version: main bc2571cc384f1f24280e94d01594f455a0b14876 · bundle index-TzQM1lX4.js (dist-gate production candidate, never deployed, so no published artifact manifest) · targets.json sha256 25ed43d6…f1ec
Review: deep
Deployment: NOT APPLICABLE — the build is not deployed; the subject was the immutable candidate served at the production base path
Changed area: FAIL
Milestone: not assessed
Quality: PROVISIONAL — feel, narrative and audio have no verified score, so there is no weighted total for this build. The last full score belongs to build 7191674 under rubric v1 (round 03, 2026-09-19) and is not comparable to anything here.
Targets: 35 required / 18 matched / 7 failing / 10 unverified / 8 waiting on a decision
Top issues: PR-0001 HUD text under the 14 px floor · PR-0002 command menu covers a whole party member · PR-0003 FFX results ledger drops members (regression from this build) · PR-0004 a Threatened enemy still counterattacks · PR-0005 the approved Turn cut-in is never drawn
Coverage: five chapters entered with real keys and four driven to an outcome; engines, art hashes, media decode, audio routing and the save-upgrade matrix all exercised; NOT tested — any victory, chapter 5's outcome, Yu Yevon link 7, gamepad, touch, Safari, real hardware frame time
Next required review and why: this candidate cannot deploy on this report (changed area FAIL, and the deploy refuses a shared-system change without a passing deep report). A repair batch, then a re-run deep review of the changed area plus one real-input victory per chapter.
Elapsed review time / repeated work avoided: 566 reviewer-minutes over about 205 minutes of wall clock; one browser owner's 246 indexed captures served six auditors without a single replay, and the audio direction verdict was reused rather than re-collected.
```

## The score, as the code computed it

`node tools/critic-score.mjs --report critic/rounds/round-04.json`

```text
score: PROVISIONAL — no verified score for feel, narrative, audio (never averaged away, never zero)
below the 9 floor: combat, encounter, visual, interface, onboarding, prep, delivery
milestone: not accepted
  - a deep review cannot accept a milestone
  - build identity is incomplete (main sha, bundle and artifact hash are all required)
  - score is provisional: no verified score for feel, narrative, audio
  - category combat is below the 9 floor
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category interface is below the 9 floor
  - category onboarding is below the 9 floor
  - category prep is below the 9 floor
  - category delivery is below the 9 floor
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - 21 critical or major issue(s) remain open
  - encounter ffx2-vegnagun-shuyin has no complete real-input flow
  - 7 required target(s) failing
  - 10 required target(s) unverified
  - 8 required target(s) waiting
  - only 18 of 35 required targets matched
  - human judgment not recorded: Audio: a score out of ten for this mix. Only a direction verdict exists ('Right direction, keep refining', 2026-09-19). targets.json itself lists the number as still owed, and without it the audio category cannot be scored
  - human judgment not recorded: Phone layout (390x844): an options round for every screen except pause
  - human judgment not recorded: Defeat screen: an options round (targets.json lists it as a gap)
  - human judgment not recorded: Move advisor card and enemy next-move panel: one mockup each (targets.json lists both as gaps)
  - human judgment not recorded: FFX-2 enemy-letter convention for a boss plus its same-named sub-parts (research/ffx2-combat-core.md is silent; AGENTS.md rule 14 says ask)
  - human judgment not recorded: Whether the FFX-2 battle field keeps the approved tile's left-enemy composition or the shipped mirror
  - human judgment not recorded: Whether the TARGET header slab and key-hint bar in the three approved targeting frames are part of what was approved
  - human judgment not recorded: Whether the approved 'Turn cut-in' tile still stands, now that it has never been wired
  - human judgment not recorded: CHK-B2 (whether the input feels good) and CHK-B3 (taste): no owner play session on this candidate
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

The chief critic writes the category scores; the arithmetic, the floor and every acceptance gate are decided by `tools/critic-policy.mjs`. Three categories carry no number, so there is no weighted total: an unknown is never averaged away and never scored zero.

## The ten categories

### combat — 8.5 / 10

Seeded pure-engine benches on the candidate source tree at bc2571c (critic/rounds/round-04/bench/*.test.ts), npx tsc --noEmit clean, npx vitest run 154 files / 4193 tests green. VERIFIED AGAINST SOURCE: CTB queue membership is now exactly research/ffx-combat-core.md 1.1's living, non-Eject, non-Petrify set, so a Threatened or slept actor keeps its counter and loses the turn; Threaten releases at the start of the user's next turn with the target scheduled immediately after (measured order on seeds 1/2/3: tidus > yunalesca > yuna > auron > released > yunalesca), which the gap pass then reproduced in a browser with real keys (gaps/g-ch2-threaten-landed.json, g-ch2-threaten-release.json); Threaten infliction decay reproduces 4.4 digit for digit (100,70,49,34,23,16,11,7,4,2,1; Yunalesca 25,17,11,7,4,2,1); a 3-turn Sleep costs exactly 3 own turns with poison still ticking on the sleeper (1,623 = maxHp//4 per denied turn) and physical damage waking the victim; Yu Yevon's Curaga answers player actions only (a defend-only line over 668 turns produced 56 Gravijas, 170 Power Waves and zero Curagas); Gravija reaches the whole field (yu-yevon 9,999 clipped by the 2.13 cap, each Yu Pagoda 3,750, all three party members); and the 3.5 attrition route is reachable - the shipped Chapter 3 chain reaches link 7 victory on turn 478 on seeds 1 and 42, parking at 6,001 HP exactly where the 0.75*HP = 3*1,500 Power-Wave equilibrium predicts. Unchanged high-risk sampling: all 19 ICV_BASE breakpoints and their predecessors match 1.2, 17 sampled command ranks match 1.3, and FFX-2's ATB runs at 3,000 ticks/s (303,964 ticks over 101,321 ms, measured live). No game-data value changed in this build, so the changed-value audit is vacuous rather than skipped. HELD DOWN BY: a major, sourced, runtime-observed defect in the very subsystem this build rewrote - a Threatened enemy still counterattacks twice in one run, because the canCounter guard that encodes 'cannot act or counterattack' has no call site anywhere (PR-0004); the FFX-2 command fix filtering by category rather than by identity, which is latently over-broad (PR-0024); an unsourced rank-3 recovery constant carrying a citation that does not state it, plus a results.ts citation pointing at 1.7 for a 10.1 rule (PR-0025); and CHK-023 UNVERIFIED for three of the four changed engine subsystems, because no browser run has invoked Yu Yevon's counter guard, Gravija, or a denied sleeper turn. The combat auditor scored this 9 before the gap pass found the counterattack defect; a confirmed wrong-mechanics defect is not the 'minor issues' the 9 anchor describes.

### encounter — 7 / 10

Seeded win-rate benches over the SHIPPED intended strategies, re-measured this round on the candidate: Chapter 1 26/40 seeds, Chapter 2 39/40, Chapter 3 39/40 over the full seven-link chain (8/8 on the verifier seeds), Chapter 4 40/40, Chapter 5 40/40. Credibly wrong tactics stay punished and were re-measured: node-first on Chapter 5 loses with the Leg on 18,220 and the Nodes barely dented; Chapter 4 without mitigation is 0 of 30 and mashing is 0 of 30; swinging at Yu Yevon instead of waiting still wins, but only the slow way (227 swings, link 7 ending on turn 477), which is the researched shape rather than a punished canon tactic. Boss data spot-checked against research and correct: Seymour Flux 70,000 with Mortiorchis 4,000 and the 4,000/3,000/2,000/1,000-floor Mortibsorption ladder, Braska's Final Aeon 120,000 in form 2, Yu Pagoda 5,000 with the 63/72-tick revive split, Yu Yevon 99,999 with the 3.2 immunity split shipped verbatim, FFX-2 Bahamut 8,400, Vegnagun Nodes 300,000 each. AI rotations, phase rules and counters fire in the captured event logs (Yunalesca's blind counters, Braska's Final Aeon's Holy Water counter) and this build's counter guard does not suppress them. The confirmer separately drove all five chapters to victory through the shipped presenter and HUD with the repo's own intended strategy (15 of 15 on seeds 2/4/7 for chapters 2 to 5, and 5 of 6 tried on chapter 1), so the encounters are completable - the reviewers simply never demonstrated it with real keys. HELD DOWN BY two round-03 blockers that are open and unchanged, both re-measured here rather than carried: Chapter 1 loses 14 of 40 seeds with the intended line while chapters 4 and 5 lose none, so the difficulty curve runs backwards on the first encounter a player meets (PR-0008); and Chapter 1's signature Zombie to Full-Life kill gives the player ZERO turns in between in 37 of 44 measured kills across seeds 1-30, so the chapter's headline mechanic still has no counter-play (PR-0007). 'Functional with conspicuous weaknesses' is the 7 anchor.

### visual — 7.4 / 10

Judged from GPU (ANGLE d3d11) captures of the production candidate at 1600x900, 2000x1012 and 390x844, plus 18 target composites built with tools/end-state-board.mjs --pair and 12 crops. STRONG: all 94 files behind the approved cast, scene, portrait and pause hash sets ship byte-identical into dist-gate (94 match, 0 different, 0 missing, no set changedSinceSeen); all 362 shipped images decode and none is blank or flat; every staged character and boss is recognisable and stylistically coherent; painted facing is correct in both games where staged, and the 2026-09-15/16 'characters face the camera' defect is not reproducible; ground decals and feet planes are correct for the FFX party and Braska's Final Aeon; CHK-011 is repaired in Chapter 3 (both Yu Pagodas fully visible) and the Yu Pagoda letter-tile regression is gone; the pause layout matches the approved v5 target closely at 2000x1012 and holds together at 390x844. WEAK, and three of these are repeats of what Bailey reported on 2026-09-18: the FFX command stack still covers a whole party member head to foot in chapters 1 to 3, beyond the declared hud-safe-area exception, with an inverted z-order for the submenu breadcrumb (PR-0002); HUD portrait chips crop through heads for Auron, Kimahri, Tidus, Yuna-WM, Rikku and Paine, and Paine's pause and results chips are still a 'P' monogram (PR-0014); Vegnagun's green tail tip reads as an un-keyed green artefact stuck to Rikku's arm for all of Chapter 5 (PR-0015); the Chapter 4 pause plate is cropped past its approved framing with Bahamut entirely out of frame (PR-0016); at 390x844 one of Chapter 1's two enemies is more than 95 percent off-screen (PR-0017); the mid-battle speaker card draws its portrait larger than its slot with a grey filler block below (PR-0020); and a KO'd Yuna rests as a rotated billboard floating at torso height (PR-0022). Craft is at the 9 level; the conspicuous, owner-reported staging and cropping defects put the category at 'functional with conspicuous weaknesses'. None of them was caused by Build A.1.

### feel — UNVERIFIED (no number)

Scorable only in part, and the part that is missing is most of the category. VERIFIED: the Build A.1 per-blow vitals change works in FFX - a 40-frame film at about 557 ms cadence shows the engine HP change at frame 2 reflected in the party row at frame 3 and the KO at frame 11 reflected at frame 13 with the numeral appearing on the same frame, so rows and numerals move with each blow rather than after the burst. VERIFIED: scene skip is discoverable and real (ENTER ADVANCE / HOLD ENTER SKIP / ESC MENU, and Esc opens the dossier mid-scene with a SKIP SCENE row and returns). VERIFIED: retry does not replay the pre-battle scene (three attempts at 4:59, 0:26, 0:28). VERIFIED in the gap pass: one plain FFX Attack filmed at 100 ms from key-down puts the numeral on screen from 427 ms to 1180 ms, about a 750 ms feedback window, though it drifts and re-projects between frames rather than sitting still; the FFX-2 numeral appears about 900 ms after the engine resolved the hit. NOT VERIFIED: input-to-response latency is unmeasured in both games; the FFX-2 half of the per-blow claim is still unproven because in the one filmed FFX-2 exchange Bahamut missed, so the party rows read one distinct state across all 170 frames; there is no camera evidence at all although camera('action') and camera('idle') calls exist in the scripts; there is no transition timing beyond Chapter 1's battle-entry card; no chapter was seen through a victory, so the climax, the aftermath and the return are unfelt; and CHK-B2 (whether the input feels good) needs Bailey's hands and has not been collected on this build. Per RUBRIC section 6 an unknown is never averaged away and never scored zero: this category has no number.

### narrative — UNVERIFIED (no number)

The reachable half looks right and the decisive half was never reached. VERIFIED: Chapter 1's pre-battle scene runs 63 lines, 62 of them with a named speaker and a painted portrait, and the dialogue box, the skip affordance and the Esc round-trip all behave; mid-battle beats fire on their triggers (first-zombie, seymour-lance); the pause dossier carries its chapter framing. OBSERVED PROBLEMS: the banter bank of research/writing-bible.md section 4 - 32 FFX exchanges plus the FFX-2 set, each tagged Suitability / Slot / Mood for the formation screen and the victory screen - has no consumer anywhere in src/, so neither screen plays an exchange and the only character voice outside a cutscene is a single victoryQuips line (PR-0021); and mid-battle beats hard-code speakers who are not in the active formation, so Rikku and Lulu speak in a Tidus / Yuna / Kimahri fight while Yuna, who is present and being addressed, says nothing (PR-0037). NOT VERIFIED, and it is the heart of the category: no chapter was won, so no post-battle scene, no victory quip, no aftermath and no return has been seen on this build at all; the defeat screen says nothing about why the party lost, eleven times across four chapters; and CHK-B3 (whether the writing sounds like the characters) needs Bailey. With the climax and aftermath of every one of the five chapters unseen, there is no honest number.

### audio — UNVERIFIED (no number)

The technical gate is clean and was independently re-verified on the exact candidate: node tools/audio/qa.mjs --strict reports 0 findings across all 21 music cues and the 134-cue SFX sprite - integrated loudness -15.97 to -16.20 LUFS against a -16 +/-2 spec, true peak -1.06 to -2.86 dBTP, 0 clipped samples, every loop seam ok - and an independent ffmpeg decode pass on all 22 shipped mp3 files found zero warnings. The capture owner's network logs across all five chapters show every audio/manifest.json, music mp3 and the sfx sprite returning 200 with the correct MIME type, no synth fallback, and the right cue at each real moment reached (title, chapter select, each chapter's pre-battle cue, each boss cue, pause), matching docs/audio/THEMES.md. This build's own audio change is fixed and verified live: saved master / music / sfx volumes are applied at boot and on unlock across a fresh profile, a returning save, an old save missing the fields and truncated storage, closing round 03's blocker. Open craft debt: 3 of 21 cues have no tempo map, so written rubato cannot bend the pulse (PR-0039), and the 'mute is applied at boot' claim is wider than the code, which has no muted setting at all (PR-0038). WHY THERE IS NO NUMBER: no agent can hear, and CHK-001's bar is a green technical gate AND the owner's listening sign-off. The only verdict on record is Bailey's 2026-09-19 'Right direction, keep refining' about this same byte-identical score, and docs/target/targets.json itself still lists 'a score out of ten for the audio, next time you listen' as owed. RUBRIC section 5 forbids an agent claiming to have listened when it read data, so the category stays UNVERIFIED rather than being guessed.

### interface — 6.6 / 10

Judged at 100 percent from asserted GPU captures of the candidate, whose bytes were re-hashed (index.html 8f6da3bbfd3e87eb, index-TzQM1lX4.js ac178158d7174507, index-ChPWVjLR.css 30f61092b9f31917). STRONG: the advisor card carries actor, submenu path, cost, certainty, status and a plain-English why, and every move it named was a present, enabled row in the same frame; the intent panel separates SCRIPTED / LIKELY 92% / 2ND IN QUEUE / ACTS NEXT with a damage range, percent of HP and percent to hit; no name ellipsises at 1600x900 or 2000x1012; Esc and P both pause from the top of the FFX command menu with real keys, and arrows, Enter and Escape drive the windowed command stack, its submenus, the single-target picker and the group frame; FFX-2 party prep now has the same shape as FFX, closing round 03's CHK-020 gap; BATTLE 1 OF 7 and the Yu Pagoda A/B tags are confirmed in play. AGAINST: 27 to 44 of roughly 70 visible strings render under the 14 px effective floor at 1600x900 in each game, still 22 to 26 at 2000x1012, and 2.3 to 5 px at 390x844 - independently reproduced by a second measurement method (PR-0001); the FFX results screen after a defeat is half an empty black frame with no member rows and no figure (PR-0003); the advisor recommends offence for five straight turns while a party member lies KO'd and Zombied, and the party wipes (PR-0006); the strategy guide slices its last line and prints MORE over its own text (PR-0009); the intent panel slices its counter rules mid-glyph with no keyboard way to read the rest (PR-0010) and never names Lance of Atrophy's guaranteed 100 percent Zombie, the status the whole chapter turns on (PR-0011); the FFX-2 command menu never says what the highlighted row does, where FFX does (PR-0012); FFX-2 letters a unique boss 'A' and its identical sub-parts B/C/D, the defect just repaired on the FFX side (PR-0013); the selected command label measures 1.53:1 against its own slab (PR-0018); and the help sentence is truncated mid-word with the ALL ALLIES chip over its ending and no sentence break (PR-0019). Eleven open interface defects, several of them the owner's own 2026-09-18 reports, sit below 'functional with conspicuous weaknesses'.

### onboarding — 4.2 / 10

No onboarding exists in this candidate: src/ui/coach and src/app/screens/raiseBriefing.ts are absent from tree bc2571c and the shipped bundle contains no 'coach' or 'briefing' string - Bailey's approved option C lands in commits after this one and is not under review. OPTIONS is six rows: master, music and sfx volume, text speed, X-2 Active/Wait, strategy guide on/off. There is no text or UI scale, no key remapping anywhere in src/, no in-game motion toggle and no flash or photosensitivity accommodation, although Settings already carries reduceMotion and lowEffects whose own comment says they belong to a settings screen that does not exist. Text access fails outright: a third to two thirds of battle-HUD strings are under the 14 px floor at every desktop size measured and 2.29 to 5 px at 390x844, where the whole HUD is unreadable and untappable. The defeat screen, which eleven losses in this round landed on, names nothing about why the party lost. CREDITS: prefers-reduced-motion is honoured in ten shipped stylesheets and seeded into Settings at boot, so an OS-level preference is respected; non-colour cues are consistently good; the strategy guide and the advisor do teach the faithful rules when they can be read. No cold-start walkthrough was run this round, simulated or real, so the newcomer's actual experience is unmeasured beyond the source and the captures. 'Substantial gaps or placeholder delivery' is the 5 anchor; this sits below it because the whole category's surface is missing and the accessibility floor is failed at every size.

### prep — 7.5 / 10

STRONG: four of five chapters show a complete real-keyboard route from party prep through an outcome to a legible results card (TURNS / ATTEMPTS / BEST / NEVER CLEARED, RETRY / CHAPTER SELECT) and a correct RETRY to party prep; Seymour Flux was replayed three times for real at 4:59, 0:26 and 0:28, so retry is fast and carries no state incorrectly; the advisor and guide carry sourced, consequence-bearing tactical text ('Shell halves Impulse and Mega Flare, stacks multiplicatively with Magic Break down to x0.083'); prep exposes real choices whose consequences are sourced; and this build's AP-eligibility rule itself is correct and proved by a reproduction unit test against a real FFXEngine. AGAINST, and it is why this is not the 9 the prep auditor first gave: the same commit that fixed the AP rule made the results ledger derive its ROW SET from AP eligibility, so the FFX results screen shows no member rows at all after a defeat and silently deletes a KO'd member's row after a victory - measured over Chapter 1 seeds 1-12 (seed 1 defeat 0 rows, seed 3 defeat 1 row and it is the benched Kimahri, seed 2 victory with Kimahri KO'd 2 rows) and hit in every one of the six FFX defeats captured in play, while FFX-2's screen still prints all three girls (PR-0003). A results screen that omits a character the player just watched fight is a worse truth problem than the row it replaced, and 'understandable results, reliable progress' is exactly this category. The reward path itself is still untested on screen because no chapter was won.

### delivery — 8.8 / 10

Complete flows: four of five chapters reached a real outcome through real-keyboard input with correct results and retry; Chapter 5's outcome, results and retry are unverified this round, and the mid-battle capture shows a normally rendered, functioning battle rather than a broken state, so the gap is the harness's throughput and not an observed product failure. Media and network: all five chapters' network logs carry no 4xx or 5xx and no wrong content type; 0 console errors and 0 not-found across the whole capture set; all 362 shipped images decode with none blank or flat; no hand-written shipped path (CHK-018). Persistence, which this build changed: a fresh profile, a returning player's saved volumes, an old save missing the volume fields and truncated localStorage all resolve to the correct volumes at both the pre-keypress and post-unlock steps (CHK-024). The candidate builds clean and its bytes were hashed by two reviewers independently. AGAINST: frame time and load time on named hardware were not measured at all, and no browser other than Chromium and no physical device was exercised, so two named elements of this category are disclosed coverage gaps rather than passes; the exact-artifact check is not applicable because nothing is deployed; and the release note's 'mute is applied at boot' is wider than the code, which has no muted setting (PR-0038).

## The approved-target gate

**Required 35 · matched 18 · failing 7 · unverified 10 · waiting on a decision 8.**

The required set is every approved tile of docs/target/targets.json that this release manifest ships: presentation 11, scenes 5, cast 10, pause 6 and the three approved targeting frames. The three approved onboarding tiles and the twelve approved polish tiles are approved decisions for work this build does not ship, and the audio tile and the key-art tile are not screenshot matches; none of them is counted here. 'Waiting' is the eight tiles targets.json itself marks as gaps awaiting a decision (move advisor card, defeat screen, enemy next-move panel, phone layout, three chapter concept sheets, the whole-game gap).

| Status | Tile and what the build does |
|---|---|
| matched | presentation / Style board: the Ink & Gold chrome is consistent across both games' palettes (CHK-013) |
| matched | presentation / Title: gaps/g-title-settled.png, captured after the fade settled (max channel 255) |
| matched | presentation / Chapter select: gaps/g-chapter-select-ch1.png, asserted and settled |
| matched | presentation / Party prep: shots/ch1-02-prep.png, ch1-03-prep-tab2.png, ffx2-bahamut-01-prep.png; no deviation reported |
| matched | presentation / Cutscene dialogue: gaps/g-ch1-dialogue-portrait.png; 62 of 63 lines carry a speaker and a painted portrait |
| matched | presentation / Battle start: gaps/g-ch1-battle-start-card.png, settled (.bstart opacity 1.00), 1900 ms hold |
| matched | cast / Tidus, battle poses: staged, recognisable, facing screen-right (CHK-014) |
| matched | cast / Auron, battle poses: staged and facing correctly (the chip crop is counted against the portraits tile) |
| matched | cast / Seymour Flux: staged, facing screen-left |
| matched | cast / Yunalesca, first form: staged, facing screen-left |
| matched | cast / Braska's Final Aeon: staged with both Yu Pagodas visible (crops/ch3-pagodas.png) |
| matched | cast / Yuna, Gunner (FFX-2): gaps/g-ch4-yuna-gunner.png, reached with the real CHANGE row |
| matched | pause / Rebuilt pause 2000x1012: gaps/g-pause-2000x1012-panels-shown.png |
| matched | pause / Panels hidden (H): gaps/g-pause-2000x1012-panels-hidden.png, 0 of 10 rows visible |
| matched | pause / Party panel: gaps/g-pause-2000x1012-panel-party.png, reached by walking the rail with real arrows |
| matched | pause / Hero plate, chapter 1: full-bleed, approved framing kept |
| matched | fight / Targeting: a spell on the whole party (s1): gaps/g-target-s1.png; 3 ally brackets, none dimmed, ALL ALLIES plate |
| matched | fight / Targeting: one Yu Pagoda, every enemy visible (s2): gaps/g-target-s2.png; corner brackets, pointing hand, plate 'Yu Pagoda [A]' |
| **failing** | presentation / Battle HUD, FFX: the command stack covers a whole party member head to foot and the submenu breadcrumb draws under an actor (PR-0002) |
| **failing** | presentation / Turn cut-in: never drawn in play; showTurnCutIn has no production call site (PR-0005) |
| **failing** | scenes / Ch.1 Mt. Gagazet: the battle camera's grade drops the approved moon and lit snow; backdrop mean luminance 70 against the painting's 114 (PR-0034) |
| **failing** | cast / FFX party portraits: the shipped chip crops cut through Auron's forehead and jaw, Tidus's hair and all of Kimahri's face (PR-0014) |
| **failing** | cast / Yuna, battle poses: her KO state rests as a 90-degree rotated billboard floating at torso height with no ground contact (PR-0022) |
| **failing** | pause / Hero plate, chapter 4: cropped past the approved framing; Bahamut, the scarf, the costume and the sky are all out of frame (PR-0016) |
| **failing** | fight / Targeting in FFX-2 (s3): the tile's named 'name plate with the letter tag' is not delivered - the plate reads only 'Vegnagun' where the approved frame reads 'Vegnagun - Head [H]' (PR-0030) |
| unverified | presentation / Swordplay Overdrive: no Overdrive was ever executed to completion, so the timing overlay was never opened |
| unverified | presentation / Battle HUD, FFX-2: the shipped field is mirrored against the approved tile and Bahamut is under-lit; no source states a party/enemy side convention, so this needs Bailey's word before it is called matched or failing (PR-0035) |
| unverified | presentation / Results: no chapter was won, so the approved Results tile has no build state to compare |
| unverified | scenes / Ch.2 Zanarkand Dome: an unobstructed backdrop frame is not obtainable through the real flow (the battle-start card covers the first framing and H does not drop the battle panels) |
| unverified | scenes / Ch.3 Dream's End: as above |
| unverified | scenes / Ch.4 Bevelle Underground: as above |
| unverified | scenes / Ch.5 Farplane: as above |
| unverified | cast / Shiva: never summoned; no SUMMON row was offered on any walked turn |
| unverified | cast / Shuyin: Chapter 5 never reached the link where he appears |
| unverified | pause / All hero plates (38 files): only Chapter 1's plate was reached in play; the set needs a gallery capture this pass did not build |

Protected artwork is intact: all 94 files behind the approved hash sets ship byte-identical into the candidate (94 match, 0 different, 0 missing). Nothing approved was regenerated or replaced, and every failing tile above is a rendering, staging or wiring defect, never a request to repaint.

## Checks

| Check | Result | Mandatory | State |
|---|---|---|---|
| CHK-016 | FAIL | yes | the round-04 evidence set itself, all chapters |
| CHK-017 | NOT APPLICABLE | yes | n/a |
| CHK-020 | FAIL | yes | results screen and battle command menu, both games |
| CHK-022 | UNVERIFIED | yes | all five chapters |
| CHK-021 | PASS | — | FFX chapters 1-3 and FFX-2 chapters 4-5, engine and UI level |
| CHK-023 | UNVERIFIED | — | FFX chapters 1-3 battle; FFX-2 chapter 4 battle |
| CHK-015 | PASS | — | title to battle to results, both games |
| CHK-001 | UNVERIFIED | — | all shipped cues, candidate build |
| CHK-002 | UNVERIFIED | — | pause, results and prep, five chapters, 1600x900 and 2000x1012 |
| CHK-003 | FAIL | — | battle, both games, 1600x900 / 2000x1012 / 390x844 |
| CHK-004 | PASS | — | battle, command menu open, FFX chapters 1 and 3, FFX-2 chapter 4 |
| CHK-005 | FAIL | — | FFX chapter 1, Yuna KO'd and Zombied from turn 1 |
| CHK-006 | UNVERIFIED | — | FFX chapter 1, the turn after a White Magic cast |
| CHK-007 | FAIL | — | battle, FFX chapters 1 and 2, 1600x900 and 2000x1012 |
| CHK-008 | FAIL | — | FFX battle, top-level command menu open, chapters 1, 2 and 3 at 1600x900 and 2000x1012 |
| CHK-009 | FAIL | — | FFX chapter 1, SPECIAL > CHEER with the group target frame live, 1600x900 |
| CHK-010 | FAIL | — | single-target and group pickers, FFX chapters 1 and 3, FFX-2 chapter 5, 1600x900 |
| CHK-011 | FAIL | — | chapter 1 at 390x844 (fail); chapters 1-5 at 1600x900 (pass) |
| CHK-012 | FAIL | — | CTB list, party status rows, prep roster, results rows and pause dossier, both games |
| CHK-013 | PASS | — | dist-gate/art against docs/target/approved-hashes.json, plus in-game frames at 1600x900 |
| CHK-014 | PASS | — | chapters 1-5, idle staging at 1600x900 |
| CHK-018 | PASS | — | the whole shipped candidate |
| CHK-019 | PASS | — | D:/pyrefly-release/dist-gate |
| CHK-024 | PASS | — | boot and first keypress, both games, 1600x900 |
| CHK-B1 | UNVERIFIED | — | all shipped cues |
| CHK-B2 | UNVERIFIED | — | the candidate build |
| CHK-B3 | UNVERIFIED | — | the candidate build |

Mandatory is what `node tools/critic-plan.mjs` selected for this change set (CHK-016, CHK-017, CHK-020, CHK-022). Reasons and evidence for every line are in `critic/rounds/round-04.json`. Seven further checks reviewers ran are not in the library and are recorded separately in the JSON (`checksNotInTheLibrary`), including the cold-start walkthrough, which was not run.

## Coverage matrix

**Tested**

- Five chapters entered through the real flow (title, chapter select, party prep, pre-battle scene, battle) with Playwright keyboard input on the production candidate; four driven to an outcome, results and retry
- 246 indexed captures at 1600x900, 2000x1012 and 390x844, each asserting screen, chapter and state before shooting, plus clips and timed frame sequences for one FFX attack, one FFX-2 attack and Chapter 1's battle-entry transition
- Seeded pure-engine benches: CTB queue membership, Threaten release order and infliction decay, Sleep turn cost and wake-on-damage, Yu Yevon's Curaga guard over 668 turns, Gravija's reach, the Chapter 3 attrition route to link 7, 19 ICV breakpoints, 17 command ranks, FFX-2 ATB tick rate
- Seeded win rates for the shipped intended strategy in all five chapters, plus credibly wrong tactics in chapters 3, 4 and 5
- npx tsc --noEmit clean and the full unit suite (154 files, 4,191 shipped tests) green on the candidate tree
- All 94 approved-artwork files hash-compared against docs/target/approved-hashes.json; all 362 shipped images decode-checked
- node tools/audio/qa.mjs --strict over 21 cues and the SFX sprite, an ffmpeg decode pass over 22 mp3s, and the live cue-at-each-moment routing from five chapters' network logs
- Save and settings upgrade matrix: fresh profile, returning save, old schema, truncated storage, before and after audio unlock
- Effective text size measured two independent ways by two reviewers, and command-row contrast sampled from the painted frame
- 18 approved-target composites built with tools/end-state-board.mjs --pair and read, plus 12 crops at up to 7x
- An adversarial confirmer retested the five most important findings on its own harnesses, refuting one and correcting the framing of two

**Reused, with its dependency argument**

- *Bailey's audio direction verdict, 'Right direction, keep refining' (docs/audio/OWNER-VERDICT.md, 2026-09-19)* — from round 03, build 7191674. git log 7191674..HEAD -- src/audio public/audio tools/audio shows the audio assets, tracks and tooling are byte-identical except the unrelated boot-settings commit ba0a5e4, and no audio-content defect has been opened since. It is reused as a direction check only and is explicitly not a score, so the category stays UNVERIFIED regardless.

**Not tested**

- Gamepad, touch and mouse-only input paths
- Firefox, Safari and Edge; any physical device; any real controller
- 4:3, 21:9, 1440p and 4K shapes (the deep-review rotation)
- Measured frame time, frame-time spikes, first-ability stall and load time on named hardware, browser, network and cache conditions
- The rendered OPTIONS panel itself (read from source and the bundle, not captured)
- Camera behaviour: the camera('action') and camera('idle') calls in the scripts were never filmed
- Aeon summoning (Shiva never reached the field) and any Overdrive executed to completion
- The 38-file pause hero-plate set beyond Chapter 1's plate
- CHK-B1, CHK-B2 and CHK-B4: the owner's ear, hands and approval, none collected on this build

**Required, and not tested** (this review owed it and did not deliver it)

- CHK-022 for ffx2-vegnagun-shuyin: the chapter never reached an outcome, post-battle scene, results or retry
- CHK-022's victory half for every chapter: no chapter was won through real input, so no victory scene, no victory results card and no reward banking has been seen on this build
- CHK-023 for three of the four changed engine subsystems: Yu Yevon's Curaga guard and Gravija (no run reached Chapter 3 link 7), and Sleep's denied turns (the sleeper was always woken by damage first)
- CHK-023 for the FFX-2 half of the presenter's per-blow vitals claim: the one filmed FFX-2 enemy action was a miss, so no party row ever changed
- CHK-001's listening half: no numeric owner verdict exists for this mix
- CHK-002 (a full-screen layer owns the window) across pause, results and prep at all reviewed sizes
- CHK-006 (a transient overlay dies with what it belonged to) for the FFX case the interface auditor named
- A cold-start walkthrough with only the visible instructions (owed because this is a deep review and onboarding is a declared gap)
- The five approved scene backdrops judged on their own terms, unobstructed
- The approved Swordplay Overdrive overlay and the approved Results tile

## Ranked issues

One deduplicated list with stable IDs, critical first, then major, then polish, then suggestions; within a severity, Bailey's own reported problems first, then frequency, player impact, coverage and effort. One root defect across several chapters is one ticket. No critical defect was found.

### Major (21)

#### PR-0001 — Most of the battle HUD renders below the 14 px legibility floor, and 2.3 px on a phone

*interface · both · chapter all five · battle, command menu open, 1600x900 / 2000x1012 / 390x844 · confidence: high*

**Expected.** Every string a player must read measures at least 14 effective px (computed font-size times the stage transform scale) at every supported size.

**Observed.** At 1600x900, 27 to 31 of 69 FFX strings and 40 to 44 of 66 FFX-2 strings fall under 14 effective px; at 2000x1012, 22 and 26 are still under. Smallest measured: 9.39-9.75 px ('Scripted', "Guide's pick", '95% to hit'), 10.5 px for the advisor's stat chips, 11.8 px for 'E / enemy move', 13.25 px for the guide's rule lines, 13.54 px for the CTB name plates. At 390x844 everything collapses to 2.3-5 px and the whole HUD is unreadable and untappable. Confirmed independently by a second reviewer using a different measurement method (the product of every ancestor's CSS transform scale rather than rect.height/offsetHeight); the two agree within about 1 px per row.

**Repro.** Build the candidate into dist-gate, serve it with vite preview, open Chapter 1 and Chapter 4 to the first command menu with real keys, then measure each leaf text node. Harnesses: critic/rounds/round-04/m1-legibility.mjs and, independently, critic/rounds/round-04/confirm/x2-legibility.mjs. PYREFLY_BROWSER=gpu, default seed.

**Evidence.** critic/rounds/round-04/evidence/logs/seymour-flux-legibility.json, ffx2-bahamut-legibility.json, confirm-seymour-flux-legibility.json, confirm-ffx2-bahamut-legibility.json; shots/seymour-flux-legibility-390x844.png

**Requirement.** critic/CHECKS.md CHK-003 (pass bar is zero elements under 14 px); RUBRIC section 6 interface and onboarding. Open since round 03 and unchanged by this build.

**Smallest fix.** Floor the shared Ink & Gold type tokens (chips, stat chips, guide headings and rule lines) so the stage scale cannot take any player-facing string under 14 effective px at 1600x900 and 2000x1012. That needs no new design decision and fixes the desktop half. The 390x844 column is a separate, already-declared gap: targets.json lists 'Phone layout, 390x844, every screen except pause' as awaiting an options round, so it needs Bailey's pick, not a patch.

**Acceptance check.** Re-run both legibility harnesses for one FFX and one FFX-2 chapter: the under-14 list is empty at 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160. 390x844 is retested only once an approved phone target exists.

#### PR-0002 — The FFX command menu covers a whole party member head to feet, and the submenu breadcrumb draws under an actor

*visual · FFX observed; the safe-zone solver is shared plumbing · chapter 1, 2 and 3 · battle, top-level command menu open, 1600x900 and 2000x1012 · confidence: high*

**Expected.** The command stack clears the painted party quads except for the declared lower-third overlap, as the approved Battle HUD FFX tile shows with all three members clear of the menu; a disabled row is still legible.

**Observed.** Yuna is drawn behind the command stack and is almost entirely occluded: TALK, ATTACK, SPECIAL, WHITE MAGIC, ITEMS and FLEE cover her from the crown of her head to her feet, and only her face and the head of her staff show through the semi-transparent TALK row, whose grey label reads across her hair and eye and is effectively illegible. The same collision occurs in Chapter 3 and, less severely, in Chapter 2. In the submenu the breadcrumb 'SPECIAL' is drawn UNDER her plate, so her sash blanks out two of its letters: HUD text and actors trade z-order between two states of the same menu.

**Repro.** Candidate at http://localhost:5433/pyrefly-reprise/, 1600x900, PYREFLY_BROWSER=gpu. Title, Enter, chapter select, Chapter 1, party prep, skip the scene, first player turn: look at the left party slot behind the command list, then press Right/Enter into SPECIAL and look at the breadcrumb.

**Evidence.** critic/rounds/round-04/evidence/shots/ch1-06-battle-menu.png; crops/ch1-yuna-behind-menu.png; crops/ch1-zorder.png; evidence/shots/braskas-final-aeon-03-battle-menu.png

**Requirement.** critic/CHECKS.md CHK-008 and docs/ENGINE-API.md#hud-safe-area (the only permitted overlap is the command stack over the party's lower third). Owner-reported 2026-09-18 and disclosed as known; the head-to-foot occlusion is past the declared exception.

**Smallest fix.** Give the FFX command stack the treatment FFX-2 already has: move it off the party's horizontal band, or shift the FFX party formation so the leftmost slot starts outside the stack's projected box. Then put both HUD text layers, breadcrumb and command slabs, on the same side of the actor layer so z-order is consistent, and give the disabled row the same opaque plate the enabled rows have.

**Acceptance check.** At 1280x720, 1600x900, 2000x1012 and 2560x1440 in chapters 1-3, project each party quad through the render camera and intersect it with the command-stack and breadcrumb boxes in the painted frame: no intersection above each actor's lower third, and the breadcrumb is never covered by an actor. Promote the scratch matrix to tests/e2e/hud-collision.spec.ts.

#### PR-0003 — The FFX results screen drops party members from the ledger: none at all on a defeat, and a KO'd member vanishes on a victory

*prep · FFX (the FFX-2 branch is untouched and still correct) · chapter 1, 2 and 3 · results screen, after any defeat and after a victory with a member KO'd at the end · confidence: high - traced in code, reproduced in the engine on twelve seeds, corroborated by six captured defeats, and independently confirmed as a regression introduced by commit 67e0a41*

**Expected.** The results screen lists the members who fought and shows 0 AP and no Sphere Level for anyone the sourced eligibility rule excludes, as FFX itself does and as the FFX-2 branch already does.

**Observed.** src/ui/common/resultsMath.ts now derives the FFX row set from Object.keys(result.sphereLevelsGained), and src/battle/ffx/results.ts writes a key only for a member who is alive, not petrified and has turnsTaken > 0. A defeat means the whole active party is KO'd, so the map is empty and the screen shows zero member rows and no figure - the right half of the 1600x900 frame is flat black. Measured over Chapter 1 seeds 1-12: seed 1 defeat 0 rows; seed 10 defeat 0 rows; seed 3 defeat 1 row and it is the BENCHED Kimahri at 0 AP; seed 2 victory with Kimahri KO'd 2 rows; seed 8 victory with Auron KO'd 3 rows. Every one of the six FFX defeats captured in play hit the empty case, while FFX-2's defeat in the same session still printed Yuna, Rikku and Paine.

**Repro.** Node/vitest, no browser: build the FFX engine over ENEMY_GROUPS_BY_ID['seymour-flux'] with gagazetBuild, drive it with intendedStrategy to battle-over, then call buildMemberRows(getChapter('seymour-flux'), result) on seeds 1, 2, 3, 8, 10. In the browser: lose Chapter 1 and read the results screen.

**Evidence.** critic/rounds/round-04/bench/zz-critic04-rows.test.ts; confirm/x7-results-ledger.test.ts; evidence/logs/ch1-notes.json, braskas-final-aeon-notes.json, yunalesca-notes.json (sphereLevelsGained {} and no member rows) against ffx2-bahamut-notes.json; shots/ch1-16-results.png against ffx2-bahamut-09-results.png

**Requirement.** research/ffx-combat-core.md section 10.1 governs who EARNS AP; it says nothing about who is LISTED. RUBRIC section 6 prep (understandable results, reliable progress) and CHK-020 (the same screen in both games gets the same work).

**Smallest fix.** Keep the sourced eligibility rule and stop using it as the row set. Build the FFX rows from the roster - active slots, plus reserve members who took a turn, union the sphereLevelsGained keys - and keep reading result.sphereLevelsGained[id] ?? 0 for the Sphere Level and earnedAp for the AP, so an ineligible member shows a row with 0 AP and no level instead of disappearing. Then let ResultsScreen.heroHtml take the leader from the chapter build rather than rows[0], so the fallen pose it already codes for can render.

**Acceptance check.** Re-run the Chapter 1 seed sweep: every finished battle, win or lose, returns a row for each member who was in an active slot at the start plus any reserve member who took a turn; the KO'd member on seeds 2 and 8 shows 0 AP with no Sphere Level badge; seeds 1, 3, 10 and 12 return three rows, not zero or one. Add the FFX/FFX-2 parity assertion to tests/unit/ffx-results-ap.test.ts, and capture one FFX defeat and one FFX-2 defeat in the same session.

#### PR-0004 — A Threatened enemy still counterattacks: the guard that encodes the rule has no call site

*combat · FFX (FFX-2 not applicable: Threaten is an FFX ability and the ATB engine has no equivalent status) · chapter 2 (Lady Yunalesca); the reaction path is shared by every FFX chapter · battle, threaten on the boss, a landed party hit · confidence: high - observed twice at runtime with real keys and traced to the missing call site*

**Expected.** While threaten is on an enemy, a landed party hit draws no counter. research/ffx-combat-core.md section 4.2, marked verified by two sources, says the target cannot act OR COUNTERATTACK, and src/data/ffx/statuses/core.ts:270 ships that same sentence as the status text a player reads.

**Observed.** Yunalesca counterattacked while Threatened, twice in one run. Engine reading immediately before the hit: statuses ['threaten']. Event delta for the single action: action-start(Yuna), damage->Yunalesca=101, action-end(Yuna), counter(Yunalesca)->Yuna, action-start(Yunalesca), action-end(Yunalesca), turn-start(Yunalesca), turn-start(Tidus). Reading immediately after: still ['threaten']. Reproduced a second time with the Darkness counter (counter(Yunalesca)->Tidus then status-add:darkness->Tidus) while threaten was continuously present. The turn-denial half of the same rule works correctly in the same frames, so this is specifically the counterattack clause.

**Repro.** node critic/rounds/round-04/g7-threaten-counter.mjs against the dist-gate preview, PYREFLY_BROWSER=gpu, default seed: Enter at the title, cursor right once to Chapter II, Enter, Enter through party prep and the pre-battle scene, then on each Auron turn take SPECIAL > THREATEN on Yunalesca until it lands (25 percent tier), and on the next party turn take ATTACK and read window.__pyrefly.battleState().log.

**Evidence.** critic/rounds/round-04/evidence/gaps/g-ch2-threatened-boss-countered.png, g-ch2-threaten-counter-trials.json, g7-log.json; corroborated by g6-threaten-log.json

**Requirement.** research/ffx-combat-core.md section 4.2; AGENTS.md hard rule 4 (built but wired to nothing) and CHK-023.

**Smallest fix.** Call the guard that already exists. canCounter(ctx, id) at src/battle/ffx/ai/reactions.ts:119 encodes exactly this rule and has no call site anywhere in src/ or tests/. Gate the per-enemy branch of collectBossCounters (the loop at reactions.ts:60) on canCounter(ctx, enemy.id) before building a counter command.

**Acceptance check.** Re-run g7-threaten-counter.mjs: with threaten on the boss, the event delta for a landed physical hit contains damage-> and no counter(...) entry. Add a unit test that lands Threaten then a party hit and asserts zero counter events, and a call-site check that fails if canCounter has no importer.

#### PR-0005 — The approved Turn cut-in never appears in play: showTurnCutIn has no production call site

*visual · both (the tile names chapter 1) · chapter observed in 1 · battle, every party turn-start, and the whole battle entry · confidence: high*

**Expected.** When a party member's turn begins, the Ink & Gold portrait cut-in plays. docs/target/targets.json, group presentation, tile 'Turn cut-in', status approved.

**Observed.** .ig-cutin was never visible in any sampled frame: across Chapter 1's whole battle entry (90 samples at about 150 ms) and across every player turn of two full runs, the cut-in count was 0. showTurnCutIn (src/ui/inkgold/cutin.ts:84) is referenced only by its own module, the inkgold barrel and tests/unit/inkgold.test.ts; no runtime code calls it. The only ig-cutin class present in play is ig-cutin__info, which FFXBattleHud reuses for the command help slab.

**Repro.** node critic/rounds/round-04/g2-ch1-win.mjs against dist-gate; read the cutin field of every sampled state in g-ch1-entry-timeline.json and the 'cut-ins observed at a player turn' line in g2-ch1-log.json.

**Evidence.** critic/rounds/round-04/evidence/gaps/g-ch1-entry-timeline.json, g2-ch1-log.json, g1-notes.json; the approved tile in docs/target/targets.json

**Requirement.** The approved-target gate (RUBRIC section 7): every required target in targets.json must match. AGENTS.md hard rule 4 and CHK-023: a complete, unit-tested subsystem with zero runtime callers.

**Smallest fix.** Either wire the cut-in into the turn-start path of the presenter and HUD, at the same place the CTB list marks the new actor, or, if the direction has changed since the tile was approved, take it back to Bailey as an end-state question. This is the owner's decision, not a builder's silent one.

**Acceptance check.** A real-input run of Chapter 1 records at least one frame where .ig-cutin is visible with the acting member's name at a party turn-start, and node tools/orphans.mjs plus a call-site check show showTurnCutIn has a production importer.

#### PR-0006 — The move advisor recommends offence for five straight turns while a party member lies KO'd and Zombied

*interface · FFX (measured in chapter 1; not asserted of FFX-2) · chapter 1 (Seymour Flux) · battle, Yuna at 0 HP with [zombie, ko] from turn 1 · confidence: high on the observation; medium on how much of the loss the advisor explains, since the same seed is a documented loss for the intended strategy too*

**Expected.** The NEXT BEST MOVE card offers the action a good player would take. With a member down and the boss above 94 percent, that is a revive, not a fifth Poison Fang. The revive branch exists in intendedStrategy ('Someone is down') and the chapter's own guide names the Holy Water rhythm.

**Observed.** Two real-input runs, both total wipes with the boss still above 94 percent. Run 2 turn by turn: turn 1 Yuna goes to 0 HP with [zombie, ko]; turns 2 to 6 the advisor recommends 'Poison Fang -> Seymour Flux' every single turn while she stays down and is never revived; the boss moves 70,000 to 66,000 over the whole run; the party wipes on turn 15 (run 1: turn 10). Kimahri spends his opening 100 Overdrive with no change to the boss's HP. No offered turn in either run closed the damage race.

**Repro.** node critic/rounds/round-04/g2-ch1-win.mjs against the dist-gate preview, PYREFLY_BROWSER=gpu, default seed (the engine reported seed 1, which tests/unit/strategy-seymour-flux.test.ts documents as a KNOWN_LOSS seed): enter Chapter 1 through the normal flow and take the advisor's own pick every turn.

**Evidence.** critic/rounds/round-04/evidence/gaps/g-ch1-turns.json, g2-ch1-log.json, g-ch1-results-DEFEAT.png; critic/rounds/round-04/confirm/x6-advisor-vs-intended.mjs (defeat at turn 15, 66,000/70,000, 0 advisor misses)

**Requirement.** RUBRIC section 2 (the advisor offers legal, useful actions and handles recovery) and CHK-005 (a recommendation is tested on the broken board, not only the healthy one).

**Smallest fix.** Make the encounter tactic defer to the revive branch instead of short-circuiting it - an encounter tactic that returns a pick currently prevents the 'someone is down' step from ever running - or give the tactic its own recovery step. Measure before and after: run a pure advisor-only policy over seeds 1-40 in both games and compare with the intended strategy's own rate, which this review never did.

**Acceptance check.** On a board with a KO'd member the advisor's pick is a revive or a heal, in both games; and an advisor-only policy over Chapter 1 seeds 1-40 wins at a rate comparable to intendedStrategy's rather than losing every run.

#### PR-0007 — Chapter 1's signature mechanic has no counter-play: 37 of 44 Zombie kills give the player zero turns in between

*encounter · FFX · chapter 1 (Seymour Flux) · battle, Zombie applied then Full-Life · confidence: high - measured directly off the engine's own event stream on this build*

**Expected.** A player who is paying attention gets at least one turn between a Zombie landing and the Full-Life that converts it into a kill, so the documented answer (Holy Water, Remedy) is playable.

**Observed.** Instrumented seeds 1-30 under the shipped intended strategy, counting player input turns between each status-add zombie and the ko on that actor: 44 Zombie-to-KO events, 37 of them with a window of exactly ZERO player turns. The seven non-zero windows were 4, 12, 17, 19, 28 and 33 turns, so it is either instant or it never happens, never a tight but answerable window. Unchanged from round 03's measurement on the previous build.

**Repro.** Node/vitest, no browser: drive ENEMY_GROUPS_BY_ID['seymour-flux'] with gagazetBuild and intendedStrategy over seeds 1..30, recording player-input turns and the zombie status-add / ko events. Output: 'zombie->KO events: 44; zero player turns in between: 37'.

**Evidence.** critic/rounds/round-04/bench/zz-critic04-ch1.test.ts; critic/rounds/round-03.json rankedIssues (same finding, prior build)

**Requirement.** RUBRIC section 6 encounter (signature mechanics, fair losses); research/ffx-seymour-flux.md documents the answer as Holy Water or Remedy, which presumes a turn in which to use it.

**Smallest fix.** A proposal, not a repair to apply unasked (AGENTS.md rule 10). The smallest sourced-looking lever is the scheduling of the Full-Life follow-up relative to the Zombie in src/battle/ffx/ai/seymour-flux.ts: if the research supports the two landing on separate scheduled turns rather than inside one AI step, separating them restores the window at no cost to the boss's numbers. If the sources do not settle it, say so and ask Bailey rather than tuning.

**Acceptance check.** Re-run the seeds 1-30 instrumentation: the median window between a Zombie landing and the Full-Life kill is at least one player turn and the zero-window share falls below roughly 10 percent, with Seymour Flux's stat block and ability data unchanged.

#### PR-0008 — Chapter 1 wins 26 of 40 seeds with its own intended strategy while chapters 2 to 5 win 39 or 40: the difficulty curve runs backwards on the first fight

*encounter · FFX · chapter 1 (Seymour Flux) · whole encounter · confidence: high - two independent measurements on this exact build, one seeded bench and one real-input capture*

**Expected.** The first encounter a player meets is winnable by the line the game itself recommends, at a rate at least comparable to the later chapters.

**Observed.** Re-measured this round on the candidate: intendedStrategy wins 26 of seeds 1-40 in Chapter 1, with several very fast losses (seed 20 at turn 8 with 65,193 HP still on the boss, seed 18 at turn 14, seed 10 at turn 11, seed 15 at turn 15). Against that, Chapter 2 wins 39/40, Chapter 3 39/40 across the whole seven-link chain, Chapter 4 40/40 and Chapter 5 40/40. Real play matched the bench: five real-input attempts, five defeats, at turns 16, 9, 8, 10 and 15. tests/unit/strategy-seymour-flux.test.ts itself documents the chapter at 26 of 40 and 100 of 160 with KNOWN_LOSSES = [1, 42, 20260916], and seed 1 is the default, so a defeat on a fresh load is documented expected behaviour.

**Repro.** npx vitest run tests/unit/strategy-seymour-flux.test.ts in D:/pyrefly-release prints 'seeds 1-40: 26 wins' with the losing seeds and turns; compare with strategy-ffx2-bahamut.test.ts and strategy-ffx2-vegnagun-shuyin.test.ts, both 40/40.

**Evidence.** tests/unit/strategy-seymour-flux.test.ts console output (this round); critic/rounds/round-04/evidence/logs/ch1-notes.json; critic/rounds/round-04/evidence/gaps/g-ch1-turns.json; critic/rounds/round-03.json rankedIssues

**Requirement.** RUBRIC section 6 encounter (correct difficulty, fair wins and losses). Round 03 recorded this as a blocker; this build changed no data, no AI and no party preset, and the release manifest lists Chapter 1 difficulty as known and unchanged.

**Smallest fix.** Not a numbers-tuning job and not the critic's to choose: per the owner's standing rule a boss-side answer is built and measured, then put to Bailey. The two candidates worth pricing are (a) give the party the sourced preparation the research says an average Gagazet party has and re-measure, and (b) fix the counter-play hole in PR-0007, which is what converts most of the fast losses. Neither should change Seymour Flux's own stat block.

**Acceptance check.** After whichever answer Bailey picks, the Chapter 1 forty-seed sweep wins at a rate within a few points of Chapter 2's 39/40, with no defeat before turn 25, and a real-input capture reaches victory at least once.

#### PR-0009 — The strategy guide still slices its last line and prints the MORE chip over its own text

*interface · both (shared panel) · chapter 1 observed; any chapter whose guide blurb runs long · battle, strategy guide open, 1600x900 and 2000x1012 · confidence: high on the observation; the cause below is traced in source but was not executed, so it is a suspected root cause*

**Expected.** This build's own claim: 'the strategy guide ends on a whole line with a real fade and a readable MORE chip'. The panel's bottom edge coincides with the bottom of a whole rendered line and the chip occupies blank space below it.

**Observed.** At 1600x900 with the command menu open the panel ends part-way through the line 'PHASE 1' - the glyphs' lower portion is clipped by the panel border - and the MORE chip is drawn on the same baseline with its chevron overlapping the cut text; confirmed at two independent moments of the same run. At 2000x1012, Bailey's own size, the gold chip has no backing plate and lands directly on the second body line, overprinting 'and the CTB margin' so the line reads 'share of the clock, and th[MORE] margin the Holy'. The fade gradient and the chip's own legibility did land; the whole-line clamp is the part that does not hold.

**Repro.** Candidate at 1600x900 and again at 2000x1012, PYREFLY_BROWSER=gpu. Chapter 1, enter battle, press G so the guide shows with the command menu open, and crop the panel at (40,90)-(460,280).

**Evidence.** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-03.png, clips/seymour-flux-player-attack-06.png, scratch-feel/guide-crop.png; evidence/shots/seymour-flux-legibility-2000x1012.png

**Requirement.** docs/handoff/builda1-boot-and-menus.md section 2 ('MORE occupies blank ink below a complete line, never printed over one' / 'No sliced line'); round 03 #36; CHK-003.

**Smallest fix.** Suspected unit mismatch: measureLineBottoms() (src/ui/common/StrategyGuide.ts:465-470) derives line bottoms from Range.getClientRects() and getBoundingClientRect(), which are in transformed screen pixels because LetterboxStage.ts:54 scales the stage, while budget, available and MORE_HEIGHT come from unscaled 640x360 stage pixels that a transform does not affect. Divide the measured rects by the stage's current scale, or measure with the offsetTop of a per-line wrapper, before handing them to lastWholeLineBelow. That also explains why the builder's own verification at Chapter 2 passed: when the content fits, the chip is hidden and the inflated numbers are never binding. Reserve the chip's height in the body's max-height instead of overlaying it.

**Acceptance check.** At 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160, in FFX Chapter 1 and Chapter 3 and FFX-2 Chapter 4, with the command menu open so MORE shows: the panel's bottom edge equals a measured line bottom to within 1 px and the chip's box intersects no glyph. Add a regression case that runs lastWholeLineBelow against scaled rects.

#### PR-0010 — The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest

*interface · both (shared panel) · chapter 1 and 2 shown; anywhere the body overflows · battle, intent panel showing (E), IF YOU ATTACK list · confidence: high - visible in two chapters and traced to the cap and the clipped class in the shipped CSS*

**Expected.** Either the whole counter list is legible, or the hidden part is signposted and reachable with the keyboard and pad the game is played with - the treatment the strategy guide gets with its MORE chip.

**Observed.** The body is capped at 30 percent of the frame (src/ui/common/EnemyIntent.ts:214, 459-462) and overflows with only a 6 px mask fade, no scrollbar, no chip and no key. At Yunalesca turn 1 the third bullet, 'and the Blind counter never fires' - the rule that decides whether the fight is winnable - is sliced through the middle of its glyphs at the panel edge. At Seymour Flux turn 1 the third bullet reads 'Below 50% HP Seymour answers with Reflect and' with 'phase 2 opens' cut off. The only way to reach the hidden text is a mouse wheel over the panel.

**Repro.** Chapter 2, first player turn, press E, 1600x900, read the IF YOU ATTACK list; repeat at Chapter 1.

**Evidence.** critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png, ch1-07-enemy-intent.png

**Requirement.** RUBRIC section 6 interface (honest intent that separates certain from conditional); CHK-003 (zero clipped).

**Smallest fix.** Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.

**Acceptance check.** At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.

#### PR-0011 — The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named

*interface · FFX (FFX-2 already shows it) · chapter 1 (Seymour Flux) · battle, intent panel showing, Lance of Atrophy queued · confidence: high for the omission on screen; the density split is the established cause, traced in code*

**Expected.** The panel that exists to say what is about to happen names the Zombie that Lance of Atrophy lands with certainty - the status the whole chapter turns on, because the mount answers a living Zombie with Full-Life for 100 percent of max HP plus a guaranteed Death.

**Observed.** The panel reads 'Lance of Atrophy / SCRIPTED / Physical non-elemental damage to one character - never misses' with a DAMAGE block (TIDUS 707-799, 31% HP) and then the counter list. Zombie is not mentioned anywhere. The Statuses block that would carry it renders only at density 'full' (EnemyIntent.ts:785) and FFX deliberately mounts the panel at density 'brief' (FFXBattleHud.ts:431). The data is there: lanceOfAtrophy carries statusEffects zombie chance 100 (src/data/ffx/enemies/seymour-flux-abilities.ts:88).

**Repro.** Chapter 1, first player turn, press E and read the panel while Lance of Atrophy is queued.

**Evidence.** critic/rounds/round-04/evidence/shots/ch1-07-enemy-intent.png; the same panel in FFX-2 (ffx2-bahamut-03-battle-menu.png) renders its ALSO block because it mounts at full

**Requirement.** RUBRIC section 2 (the enemy-intent display separates certainty from conditional outcomes); CHK-004.

**Smallest fix.** Do not widen the FFX panel: keep the brief density that round 02 asked for, but promote a guaranteed or high-chance status into the brief body, either appended to the description line ('- inflicts Zombie') or as a chip beside SCRIPTED. A 100 percent status is not optional detail, it is the move. FFX only.

**Acceptance check.** Chapter 1 turn 1 with Lance of Atrophy queued: the panel names Zombie with its chance, at brief density, without growing past its 30 percent cap; the FFX-2 panel is unchanged.

#### PR-0012 — The FFX-2 command menu, unlike the FFX one, never tells the player what the highlighted row does

*interface · FFX-2 · chapter 4 and 5 · battle, command menu open, any row · confidence: high*

**Expected.** CHK-020: the same screen in both games gets the same work, and any FFX-2 difference is deliberate and written. The FFX menu prints one line saying what the highlighted command does ('Physical damage', 'Speeds the target's turn up - inflicts Haste').

**Observed.** Highlighting any FFX-2 command prints no description anywhere: .ig-cutin__info is absent from the FFX-2 DOM and hud.help is null on every top-level row (WHITE MAGIC, CHANGE, ITEM) and on every leaf inside White Magic (CURE, SHELL, PROTECT); Chapter 5's White Magic list is the same. src/ui/ffx2/FFX2BattleHud.ts defines no setHelp and src/ui/ffx2/CommandMenu.ts has no description concept. The only description an FFX-2 player sees is on the advisor card, which describes the advisor's own pick rather than the row the cursor is on. No written FFX-2 difference exists for this.

**Repro.** Open Chapter 4 to the first ATB turn with real keys and press ArrowDown/ArrowUp across the rows, reading .ig-cutin__info and the whole HUD text; run the same probe on Chapter 1. Harnesses: critic/rounds/round-04/p14-ffx2menu.mjs and confirm/x1-menu-help.mjs.

**Evidence.** critic/rounds/round-04/evidence/logs/confirm-ffx2-bahamut-menuhelp.json, confirm-seymour-flux-menuhelp.json, ffx2-bahamut-rows.json (help null on every row); shots/confirm-ffx2-multienemy-letters.png

**Requirement.** critic/CHECKS.md CHK-020, which names both command menus explicitly.

**Smallest fix.** Mount the same info slab in FFX2BattleHud and feed it from the FFX-2 CommandMenu's selection, reusing commandHelpText's FFX-2 registry lookup.

**Acceptance check.** In Chapter 4, moving the cursor over each command prints its description, and a Playwright case asserts a non-empty description for every reachable FFX-2 row.

**Corrected by the confirmer.** The confirmer reproduced the defect but refuted two claims in the original write-up, and both were struck: this is NOT introduced or worsened by Build A.1 (git log -S "ig-cutin__info" -- src/ui/ffx2/ is empty; the slab has never existed on the FFX-2 side, it arrived on the FFX side in round 02), and it is NOT true that this build's corrected help sentences have no surface in FFX-2 - describeAbility renders on the FFX-2 advisor card ('Inflicts Shell', 'Restores HP to the party') and EnemyIntent renders in FFX-2 too, while FFX-2 ships no formula:'ctb' ability, so the corrected Haste sentence has no FFX-2 instance by design. The finding stands on CHK-020 alone, as a pre-existing parity gap.

#### PR-0013 — FFX-2 letters enemies by formation position, so a unique boss is lettered A and its identical sub-parts become B, C and D

*interface · FFX-2 · chapter 5 (Vegnagun and Shuyin), links 2 to 4 · battle, any formation with two or more enemies · confidence: high on the mechanism and on the indistinguishable gauges; medium on the exact string letterTagOf writes on a name plate, which is code-traced rather than photographed*

**Expected.** A letter distinguishes duplicates. A formation of one Vegnagun part plus three identical Nodes should leave the part plain and letter the Nodes A, B and C, exactly as FFX now behaves after this build's turnQueue.ts fix.

**Observed.** src/ui/ffx2/FFX2BattleHud.ts:827-834 letterTagOf() returns String.fromCharCode(65 + enemies.indexOf(id)) whenever the live enemy count is two or more, with no grouping by name. Driven live with real keys to Chapter 5 link 2, the engine enemy list is [vegnagun-leg 'Vegnagun', node-a 'Node', node-b 'Node', node-c 'Node'], so the unique Vegnagun is lettered A and the three identical Nodes become B, C and D - the opposite of what src/battle/ffx/turnQueue.ts:256-265 now does. vegnagun-body (Bulwark x2) and vegnagun-head (Redoubt x2) hit the same case. The player-facing cost photographed today: three identical NODE boss gauges with nothing to tell them apart and an intent panel reading 'NODE - Dies Irae - ACTS NEXT' with no way to know which Node.

**Repro.** Drive Chapter 5 with real keys, hand link 1 to the repo's own intended strategy and stop at link 2: read the ATB tiles, the boss gauges and the intent panel. Harness: critic/rounds/round-04/confirm/x4 series.

**Evidence.** critic/rounds/round-04/evidence/logs/confirm-ffx2-letters.json, confirm-ffx2-enemy-target.json; shots/confirm-ffx2-multienemy-letters.png

**Requirement.** critic/CHECKS.md CHK-020; AGENTS.md hard rule 14 - the decision must come from the sources, and research/ffx2-combat-core.md is silent on the convention.

**Smallest fix.** Do not copy the FFX rule across on a reviewer's say-so. Ask Bailey the narrow question - for a boss plus its same-named sub-parts, does FFX-2 letter from A per name group, and is a lone fiend plain? - then apply the same display-name grouping turnQueue.ts letterTagFor() now uses.

**Acceptance check.** With one Vegnagun part and three Nodes on the field, the ATB tiles, boss gauges and targeting plates show whatever Bailey decides, a lone fiend is plain, and a test over the real Chapter 5 link-2 formation pins it.

**Corrected by the confirmer.** The confirmer struck the original scenario: the four Vegnagun parts are four sequential linked battles chained by nextGroupId, never on the field together, so 'every part will be lettered A/B/C/D' cannot occur. The real and reachable case is a boss plus its same-named sub-parts, which is what is reported here.

#### PR-0014 — HUD portrait chips crop through heads, and Paine is a painted face in battle and a letter monogram on results, prep and pause

*visual · both · chapter 1 to 5 · CTB list, party status rows, prep roster, results rows and pause dossier, 1600x900 · confidence: high*

**Expected.** Every portrait chip shows the whole head with air above the hair and below the chin, consistently framed across the set, and no monogram stands in for a shipped character.

**Observed.** Auron's party-row chip is cut through the forehead and again through the jaw; Kimahri's contains no face at all, only chest and mane; Tidus's CTB chip cuts the crown of his hair; in FFX-2 Yuna-WM, Rikku and Paine are cut at the top of the head and Yuna and Paine again at the chin. Framing is inconsistent within one set - Tidus a dramatic half-face, Yuna a full face, Kimahri a partial profile. Separately, the FFX-2 battle party row draws a real painted head for Paine while the results screen, both prep surfaces and the Chapter 4 pause dossier draw a flat 'P' monogram in the same session, because those surfaces read art/portraits/paine.png, which is absent, while the HUD reads a different source.

**Repro.** 1600x900: Chapter 1 battle, read the CTB list and the party rows; Chapter 3 battle, read Auron's row; Chapter 4, read Paine's battle row, then lose and read her results row, then RETRY and read the prep roster, then Esc and read the pause chips.

**Evidence.** critic/rounds/round-04/crops/ch1-ctb-list.png, ch1-party-rows.png, ch3-party-rows.png, ch4-party-rows.png; targets/pause-plate-ch4.jpg; evidence/shots/ffx2-bahamut-09-results.png, ffx2-bahamut-01-prep.png

**Requirement.** critic/CHECKS.md CHK-012 (the visible crop contains the whole head; a fallback never ships as the final face) and CHK-020 (consistent portrait treatment across shared screens). Owner-reported 2026-09-18 ('Auron's HUD portrait is cropped through the chin').

**Smallest fix.** Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.

**Acceptance check.** Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.

#### PR-0015 — Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5

*visual · FFX-2 · chapter 5, battle 1 of 5 · battle, default framing, 1600x900 · confidence: high*

**Expected.** The party line and the enemy's painted extent do not intersect in a way that makes either look broken.

**Observed.** A hard-edged saturated spring-green blob sits between Rikku's raised gauntlet and her sword hilt, reading unmistakably as an un-keyed cutout artefact on a hero character. Traced: the rikku-dark-knight plate is clean and renders clean in Chapter 4, while public/art/characters/vegnagun-tail/idle.png ends in a bright green energy blade at its far left; Chapter 5's staging runs that green tip behind Rikku, so the player sees green growing out of her arm and the tail's most distinctive feature is itself hidden behind a party member. Measured: about 350 saturated-green pixels in a box at x 508-558, y 415-546 in both Chapter 5 battle captures; 0 equivalent in Chapter 4.

**Repro.** 1600x900, PYREFLY_BROWSER=gpu. Title, Chapter 5, party prep, Enter, skip the scene, first player turn: look between Rikku's raised right gauntlet and the hilt of her sword.

**Evidence.** critic/rounds/round-04/crops/ch5-green-zoom.png (in-game, 7x); crops/ch4-green-zoom.png (same plate, clean); crops/src-idle.png; crops/src-rikku-dark-knight.png

**Requirement.** CHK-014's wider class (art correct in isolation can still be wrong once staged) and CHK-011 (a targetable enemy's readable features are not occluded by the party).

**Smallest fix.** Move the Chapter 5 battle-1 enemy slot right, or the party line left, so the tail's green tip clears the party quads. Do not repaint either approved plate.

**Acceptance check.** Project the vegnagun-tail quad and each party quad through the Chapter 5 camera and assert zero intersection in the default framing, then re-shoot and confirm no saturated-green pixels (g>170, g-r>60, g-b>45) fall inside any party member's bounding box.

#### PR-0016 — The Chapter 4 pause plate is cropped past its approved framing and loses Bahamut entirely

*visual · FFX-2 as observed; the framing rule is shared and should be checked for all five plates · chapter 4 (Bahamut) · pause (Esc) during battle, 1600x900 · confidence: high*

**Expected.** The approved painting - Yuna looking at the viewer with Bahamut's head at her shoulder against a bright sky - presented full-bleed, the way the Chapter 1 plate is (docs/screenshots/concept/pause-ch4.png, 'the chapter 4 pause painting, full-bleed').

**Observed.** The plate is zoomed so far in that only Yuna's face from forehead to chin survives. The crown of her head is cut off, and Bahamut, the pink scarf, the Gunner costume and the sky are all outside the frame. The emotional pairing the approved painting is built on - Yuna and the aeon she has to face - is not on screen at all. Chapter 1's plate keeps its approved framing.

**Repro.** 1600x900: Title, Chapter 4, party prep, Enter, skip the scene, battle, Esc. Compare with docs/screenshots/concept/pause-ch4.png.

**Evidence.** critic/rounds/round-04/targets/pause-plate-ch4.jpg (target/build composite); evidence/shots/ffx2-bahamut-05-pause.png; contrast with targets/pause-plate-ch1.jpg

**Requirement.** The approved-target gate, RUBRIC section 7, tile 'Hero plate, chapter 4'. An approved close-up may crop a head on purpose; accidental crop damage is the defect.

**Smallest fix.** Give the Chapter 4 pause plate the same cover-fit rule the Chapter 1 plate uses, or a focal box that keeps Bahamut's head inside the frame at 16:9, instead of the current zoom.

**Acceptance check.** Re-pair the tile at 1600x900 and 2000x1012 and confirm the composite shows both Yuna's whole head and Bahamut's head inside the frame; repeat for every chapter's pause plate so the set is framed by one rule.

#### PR-0017 — At phone width one of Chapter 1's two enemies is entirely off-screen

*visual · both (shared camera fitting); observed in FFX chapter 1 · chapter 1 (Seymour Flux) · battle, command menu open, 390x844 · confidence: high*

**Expected.** Both Seymour Flux and Mortiorchis are visible and identifiable in the default framing at every supported shape.

**Observed.** At 390x844 the camera zooms to preserve Seymour Flux's height and pushes Mortiorchis more than 95 percent outside the viewport - only a few pixels of green tentacle remain at x 376-390. The enemy is still in the CTB list, still in the enemy card and still targetable, but the player cannot see what they are aiming at. The lower 40 percent of the screen is empty backdrop at the same time, so the space exists.

**Repro.** Emulate 390x844, reload, PYREFLY_BROWSER=gpu. Title, Chapter 1, party prep, Enter, skip the scene, first player turn; compare the field with the 1600x900 capture, where Mortiorchis sits at 62-76 percent across.

**Evidence.** critic/rounds/round-04/evidence/shots/seymour-flux-legibility-390x844.png; crops/phone-enemies.png

**Requirement.** critic/CHECKS.md CHK-011 (no targetable enemy more than about 25 percent occluded in the default framing).

**Smallest fix.** Fit the camera to the enemy formation's bounding box rather than to the lead enemy's height, using the empty lower band. The phone layout is an approved gap awaiting Bailey's options, so this belongs with that decision rather than as a standalone tweak.

**Acceptance check.** Add tests/e2e/enemy-visibility.spec.ts with the per-chapter, per-form matrix and the 25 percent rule, run at 390x844 as well as the desktop shapes.

#### PR-0018 — The selected command label is the least readable text on screen, at 1.53:1

*interface · both (shared Ink & Gold command-row tokens); observed in FFX chapter 3 · chapter 3 (Braska's Final Aeon) · battle, first player turn, cursor on the default row, 1600x900 · confidence: high*

**Expected.** The highlighted row is at least as legible as the unselected rows.

**Observed.** The cursor opens on TALK, which is disabled, and its label renders in a muted brown on the gold selection slab. Measured glyph #C39432 against slab #E4BC4D gives a contrast ratio of 1.53:1, below the 3:1 floor for large text; the unselected ATTACK row directly beneath measures 15.44:1. The player's current selection is the hardest thing on the screen to read.

**Repro.** 1600x900: Title, Chapter 3, party prep, Enter, skip the scene, first player turn. Do not move the cursor. Sample the TALK glyph and slab pixels at (148,446) and (300,446).

**Evidence.** critic/rounds/round-04/crops/ch3-talk-row.png; evidence/shots/braskas-final-aeon-03-battle-menu.png

**Requirement.** RUBRIC section 6 interface (readable names and values); CHK-003's contrast half.

**Smallest fix.** Give the selected-and-disabled state its own token: keep the gold slab but use the normal near-black label at reduced opacity, or invert the slab, so selection never reduces contrast below 4.5:1.

**Acceptance check.** Assert computed contrast of at least 4.5:1 for every command row label against its own background in every combination of selected/unselected and enabled/disabled, in both games.

#### PR-0019 — The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending

*interface · both (shared help-slab composition); observed in FFX · chapter 1 (Seymour Flux) · battle, SPECIAL > CHEER with the group target frame live, 1600x900 · confidence: high*

**Expected.** 'Inflicts Cheer. Hits the whole party.' with the ALL ALLIES chip clear of the text.

**Observed.** The slab reads 'Inflicts Cheer Hits the whole par' with the green ALL ALLIES chip drawn over the final word - a hard overlap, not an ellipsis - because the chip is drawn inside the slab's own box rather than beside it, and there is no punctuation between the two clauses.

**Repro.** 1600x900: Chapter 1, first player turn, Right into SPECIAL, cursor on CHEER, confirm to raise the group target frame, read the help slab.

**Evidence.** critic/rounds/round-04/crops/ch1-help-clip.png; evidence/shots/ch1-13-target-all.png

**Requirement.** critic/CHECKS.md CHK-009 (every name that can be shown is shown in full) and CHK-010's all-target label. This build also claims every command's help sentence matches its real targeting.

**Smallest fix.** Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.

**Acceptance check.** For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.

#### PR-0020 — The mid-battle dialogue card draws its speaker portrait larger than its slot with a grey filler block below

*visual · both (the card is shared); observed in FFX chapter 1 · chapter 1, mid-battle beats 'first-zombie' and 'seymour-lance' · battle, a story beat playing, 1600x900 · confidence: high*

**Expected.** The portrait fills its slot, cropped to the head, contained by the card frame.

**Observed.** The portrait image is drawn larger than its slot and bleeds above the card's top edge and past its left and right borders, while the image's own bottom stops short and leaves a flat grey rectangle occupying roughly the lower third of the slot. Two different characters show it (Rikku, Seymour), so it is systemic rather than one bad asset, and it lands on the surface that delivers the game's mid-battle story beats.

**Repro.** Chapter 1, 1600x900, GPU mode: play until Lance of Atrophy is cast (fires 'seymour-lance') or Tidus is Zombied (fires 'first-zombie'), then capture the speaker card region, about (0,460)-(460,860).

**Evidence.** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png, clips/seymour-flux-player-attack-06.png; scratch-feel/speaker-crop.png

**Requirement.** CHK-012 (the actual crop in its destination), CHK-014 and RUBRIC section 6 visual - this judges the rendering, not the artwork.

**Smallest fix.** Give the portrait slot overflow:hidden and the image object-fit:cover with object-position anchored near the top of the head, sized to the slot rather than to the source image. Do not re-crop or regenerate the approved portraits.

**Acceptance check.** For each of the seven FFX speakers and the FFX-2 cast, a capture of the speaker card at 1280x720, 1600x900 and 2000x1012 shows the portrait contained by the frame with no grey filler and no bleed past any border.

#### PR-0021 — The banter bank is authored but not implemented: no formation-screen or victory-screen exchanges exist in either game

*narrative · both · chapter party prep and results, all five · party prep and results screens · confidence: high on the absence*

**Expected.** research/writing-bible.md section 4 BANTER BANK: two-to-four-line exchanges for the party formation screen and the victory screen - 32 FFX exchanges plus the FFX-2 set, each tagged Suitability, Slot (Form/Win/Both) and Mood. The formation screen and the victory screen each play a suitability- and mood-matched exchange.

**Observed.** Nothing. A grep of src/ for 'banter' returns three comments and one unrelated SaveData field. No data table, no picker, no host component; src/app/screens/PartyPrepScreen.ts and PartyPrepContent.ts carry no dialogue. The party-prep captures for all five chapters show no exchange. The only character voice outside a cutscene is the single-speaker victoryQuips line at ResultsScreen.ts:130, and even that was never seen because no chapter was won.

**Repro.** Open any chapter's party prep with real keys and look for an exchange; grep -rn 'banter' D:/pyrefly-release/src.

**Evidence.** critic/rounds/round-04/evidence/shots/ch1-02-prep.png, ch1-03-prep-tab2.png, ffx2-bahamut-01-prep.png; research/writing-bible.md sections 4.1-4.2; src/app/screens/PartyPrepContent.ts; src/app/screens/ResultsScreen.ts:130

**Requirement.** research/writing-bible.md section 4, the governing doc AGENTS.md maps src/story to; RUBRIC section 6 names banter as a scored element of narrative.

**Smallest fix.** Add a banter table beside the writing bible's own tags and a picker that matches slot, suitability and mood to the current formation and outcome, then host it on the prep screen and the victory results screen.

**Acceptance check.** Open party prep in each of the five chapters and win one: each shows a two-to-four-line exchange whose speakers are in the active formation and whose mood matches the outcome.

**Scope caveat.** No tile in docs/target/targets.json requires banter. If Bailey has not asked for it in this milestone, this drops to a suggestion - but the writing bible is the governing doc for src/story and the rubric scores banter explicitly, so it is filed as major until the owner says otherwise.

### Polish (22)

#### PR-0022 — A KO'd party member rests as a 90-degree rotated billboard floating at torso height

*visual · FFX observed; FFX-2 unverified · chapter 1 · battle, Yuna at 0/1500 · confidence: high*

**Expected.** A downed character lies on the ground plane with her ground decal, reading as 'down'.

**Observed.** Yuna at 0 HP is drawn horizontally, rotated about 90 degrees, hovering at roughly the standing characters' torso height, well above the snow, and held in that pose across two frames 4.0 s apart, so it is the resting KO state and not a transient fall frame. It reads as 'falling forever'.

**Repro.** Chapter 1, 1600x900, GPU: play until a party member is KO'd and capture two frames several seconds apart.

**Evidence.** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-03.png (t=0) and -07.png (t=4048 ms); the same character upright and grounded at 711 HP in clips/seymour-flux-player-attack-06.png

**Requirement.** RUBRIC section 6 visual (poses, ground contact); the approved 'Yuna, battle poses' tile.

**Smallest fix.** Land the KO billboard on the ground plane - drop its anchor to the feet line and keep its ground decal - instead of rotating it in place about its centre.

**Acceptance check.** In both games, a KO'd member's quad has its feet on the ground plane with its decal present, at 1600x900 and 2000x1012.

#### PR-0023 — An enemy's letter tag disappears while its twin is down, so the same enemy is renamed mid-battle

*interface · FFX · chapter 3 and every formation with duplicates · battle, one of a pair dead · confidence: high*

**Expected.** An enemy keeps the same name for the whole fight.

**Observed.** letterTagFor recomputes the name group from the enemies currently on the field and returns undefined when fewer than two remain. Driving Chapter 3 to the point where the left Pagoda dies, the CTB forecast goes from 'A | B' to no letters at all - the survivor silently becomes plain 'Yu Pagoda' - and the letters come back 63/72 ticks later when the twin revives. In Chapter 3 the Pagodas die and revive repeatedly, so the tile relabels repeatedly. The change still improved the old behaviour, which lettered Braska's Final Aeon itself.

**Repro.** Bench: critic/rounds/round-04/bench/zz-critic04-locks.test.ts drives Chapter 3 past a Pagoda's death and reads the forecast.

**Evidence.** critic/rounds/round-04/bench/zz-critic04-locks.test.ts; the in-play A/B labels in evidence/shots/braskas-final-aeon-03-battle-menu.png

**Requirement.** This build's own letter-tag track; CHK-009.

**Smallest fix.** Compute the letter once from the formation's roster at battle start, or from every enemy record sharing the display name whether on-field or not, and store it on the runtime actor instead of recomputing from the live set each read.

**Acceptance check.** Drive Chapter 3 through a Pagoda death and revival: the surviving Pagoda keeps its letter throughout, and a unique enemy never gains one.

#### PR-0024 — The duplicate-Attack fix filters by category, so it would drop every attack-category ability a dressphere owns

*combat · FFX-2 · chapter 4 and 5 (latent; no shipped chapter reaches it today) · battle command build · confidence: high*

**Expected.** The fix removes the duplicate generic Attack row and nothing else.

**Observed.** src/battle/ffx2/targeting.ts buildCommands runs `if (ability.category === 'attack') continue;`, which removes any attack-category entry from the offered list. Auditing the shipped tables: Lady Luck loses Tantalize; Trainer loses its entire pet kit (Kogoro Blaze, Doom Kogoro, Pound!, Sneaky Ghiki, Ghiki Gouge, Bully Ghiki, Maulwings!) although Trainer ships no x2-trainer-attack and so never had a duplicate to fix; Floral Fallal's Stigmas and Machina Maw's Howitzer and Blind Shell would go the same way if the specials are ever wired to this loop. Player impact today is nil, because no shipped chapter offers those dresspheres.

**Repro.** Read src/battle/ffx2/targeting.ts buildCommands against src/data/ffx2/abilities/trainer.ts and lady-luck.ts.

**Evidence.** src/battle/ffx2/targeting.ts; src/data/ffx2/abilities/trainer.ts L22,60,98,118,138,157,297; lady-luck.ts L160

**Requirement.** AGENTS.md hard rule 3 and the build's own FFX-2-only menu track.

**Smallest fix.** Filter by identity rather than by category: skip the entry only when it is this dressphere's own generic attack (id === `x2-${sphereId}-attack`, or the record the generic row above already pushed). One line, identical behaviour for every shipped chapter, and Trainer, Lady Luck and the specials keep their kits.

**Acceptance check.** A test over every shipped dressphere asserts exactly one generic Attack row and that no other attack-category ability is removed.

#### PR-0025 — The recovery a denied turn costs is an unsourced constant carrying a citation that does not state it

*combat · FFX · chapter all FFX · engine, denied-turn branch · confidence: high*

**Expected.** Numbers come from research with their source notes (AGENTS.md hard rule 6), and an estimate is labelled as one.

**Observed.** The new branch runs runTurn(actor, null), which charges chargeForAction(ctx, actor.id, 3) - a full rank-3 recovery - and the comment above it cites ffx-combat-core sections 1.1, 4.1 and 4.2. None of those says what a skipped turn costs; 1.1's rank-3 fallback is about an action whose raw rank byte is 0, a different rule. The constant is load-bearing: it sets how long a 3-turn Sleep locks a target out in ticks, and therefore how strong Sleep and Threaten are as tempo tools. Separately src/battle/ffx/results.ts cites the AP rule to section 1.7, while the quoted sentence is at section 10.1 (1.7 is Switch and carries only the narrower switched-out line).

**Repro.** Read src/battle/ffx/engine.ts's denied-turn branch and runTurn's null path against research/ffx-combat-core.md sections 1.1, 4.1, 4.2 and 10.1.

**Evidence.** src/battle/ffx/engine.ts; src/battle/ffx/results.ts; research/ffx-combat-core.md:1755

**Requirement.** AGENTS.md hard rule 6.

**Smallest fix.** Leave the value alone and label it honestly: mark the rank-3 skip recovery [estimate] with its reason (it matches the engine's own default action rank), raise it with Bailey, and correct the results.ts citation from 1.7 to 10.1.

**Acceptance check.** Every load-bearing constant in the changed branch either cites a section that states it or is marked [estimate] with a reason, and the citation audit passes.

#### PR-0026 — Developer vocabulary on screen: 'Haste is ctb x 8/16'

*interface · FFX (the string); sweep the other four guides · chapter 1 · strategy guide NEXT blurb, any size · confidence: high*

**Expected.** A sentence a player who has never opened the repo understands.

**Observed.** The guide prints 'Haste is ctb x 8/16 - roughly double the party's share of the clock, and the CTB margin the Holy Water rhythm needs to beat the mount's Full-Life'. The tick notation is the first thing in the sentence and the literal is in the shipped bundle.

**Repro.** Chapter 1, first player turn, guide showing, any size: read the NEXT blurb.

**Evidence.** critic/rounds/round-04/evidence/shots/seymour-flux-legibility-2000x1012.png; src/data/guides/seymour-flux.ts:58; the string is present in dist-gate/assets/index-TzQM1lX4.js

**Requirement.** critic/CHECKS.md CHK-007. Same class as the section marks and row numbers Bailey reported on 2026-09-18.

**Smallest fix.** Reword the opening clause in plain English ('Haste halves the time between his turns') and keep the tick arithmetic in the tactics file's own comment; sweep the other four guide files for the same class.

**Acceptance check.** A visible-text sweep over all five chapters' guide panels finds no 'ctb', no bare multiplier, no section mark and no file stem.

#### PR-0027 — Unrendered markdown reaches the screen: 'the target *she* last picked'

*interface · FFX for the string; the guard is shared · chapter 2 · enemy-intent panel, IF YOU ATTACK list · confidence: high*

**Expected.** Emphasis rendered, or the asterisks removed.

**Observed.** The bullet prints the literal asterisks: 'Her Blind/Silence gate reads the target *she* last picked, not your attacker'. 'gate' is also engine-speak in a sentence otherwise written for players. The research citation on the same string is correctly stripped, so only the emphasis markup leaks.

**Repro.** Chapter 2, first player turn, press E, 1600x900, read the second bullet.

**Evidence.** critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png; src/battle/ffx/intent.ts:355

**Requirement.** critic/CHECKS.md CHK-007.

**Smallest fix.** Drop the asterisks and reword 'gate' to 'counter'; if emphasis is wanted, let the panel's plain() helper turn a paired asterisk run into a span, and assert no rendered intent line contains an unpaired asterisk.

**Acceptance check.** A visible-text sweep of all five chapters' intent panels finds no asterisk, underscore pair or backtick, and no 'gate' meaning a counter rule.

#### PR-0028 — H does not hide the panels it is labelled for during battle

*interface · both · chapter 1 to 5 · battle, after pressing H, 1600x900 · confidence: medium - the observation is certain; whether the narrower scope is intended is not stated anywhere*

**Expected.** Either H hides every optional panel in battle, or its legend says what it actually hides.

**Observed.** In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.

**Repro.** Any chapter, battle, press H, 1600x900; then Esc and press H on the pause screen and compare.

**Evidence.** critic/rounds/round-04/evidence/shots/ch1-07-hide-panels.png, ffx2-bahamut-04-hide-panels.png, ffx2-vegnagun-shuyin-04-hide-panels.png; gaps/g-ch1-backdrop-panels-off.png

**Requirement.** RUBRIC section 6 interface (pause and prep usability, cleanup); it also blocks CHK-013's scene-tile evidence.

**Smallest fix.** Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.

**Acceptance check.** Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.

#### PR-0029 — Yu Pagoda A and B carry no always-on field marker

*interface · FFX · chapter 3, battle 1 of 7 · battle, first player turn, 1600x900 · confidence: high*

**Expected.** The CTB's A and B can be mapped to the painted enemies without opening the picker.

**Observed.** The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter.

**Repro.** Chapter 3, first player turn, 1600x900: compare the CTB tiles with the field.

**Evidence.** critic/rounds/round-04/evidence/shots/braskas-final-aeon-03-battle-menu.png; crops/ch3-pagodas.png

**Requirement.** critic/CHECKS.md CHK-011 (every targetable enemy has an always-on marker).

**Smallest fix.** Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.

**Acceptance check.** In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.

#### PR-0030 — The FFX-2 target plate names the enemy but not the part being aimed at

*interface · FFX-2 (FFX names its parts correctly, 'Yu Pagoda [A]') · chapter 5 · targeting, cursor on vegnagun-tail · confidence: high*

**Expected.** The approved s3 frame reads 'Vegnagun - Head [H]': the plate names the part and its tag.

**Observed.** With the cursor on vegnagun-tail the on-field plate reads only 'Vegnagun'. The engine knows the part (combatant id vegnagun-tail) and the FFX side of the same feature prints a per-part name and letter chip, so with more than one part or sub-part targetable the player cannot tell what they are about to hit.

**Repro.** Chapter 5 link 1, open the enemy picker with real keys and read the plate; compare with docs/concepts/targeting/b-ring-and-dim/s3.png.

**Evidence.** critic/rounds/round-04/evidence/gaps/g-target-s3.png, g-target-s3.json, gaps/thumb/APPROVED-s3.jpg

**Requirement.** The approved targeting tile s3 names 'name plate with the letter tag' as one of its properties; CHK-010.

**Smallest fix.** Feed the part's display name, and its letter if FFX-2 adopts one (see PR-0013), into the FFX-2 target plate the way the FFX TargetCursor already does.

**Acceptance check.** Re-pair the s3 composite: the plate names the part, and every targetable part or sub-part is distinguishable from the others.

#### PR-0031 — All three approved targeting frames show a TARGET header slab and a key-hint bar that the build does not draw

*visual · both (s1 and s2 FFX, s3 FFX-2) · chapter 3 and 5 · targeting layer, 1600x900 · confidence: high on the observation; medium on severity, because how much of the header the pick was approving is unclear*

**Expected.** Whatever Bailey approved when he picked look B on 2026-09-19.

**Observed.** Neither element is present in any of the three captured frames. The actor's name survives only as small type inside the advisor card, the target's name only on the in-world plate, and nothing on screen says that left and right change the target. In s1 the build also draws the WHITE MAGIC breadcrumb behind the party figures, where it reads as a partly occluded 'W...E MAGIC'. The approved frames additionally keep the field clear of guide slabs during targeting, where the build leaves the advisor card, the strategy guide and the sensor panel over the scene.

**Repro.** Reproduce the three approved acceptance cases and pair each with its tile using tools/end-state-board.mjs --pair.

**Evidence.** critic/rounds/round-04/evidence/gaps/g-target-s1.png, g-target-s2.png, g-target-s3.png and thumb/APPROVED-s1.jpg, APPROVED-s2.jpg, APPROVED-s3.jpg

**Requirement.** RUBRIC section 7 and the standing rule that a pick approves only the properties Bailey names.

**Smallest fix.** A judgement for the owner, not a silent build: either add the header slab and hint bar the approved frames carry, or take the difference back to Bailey as a change to the approved target.

**Acceptance check.** Whatever Bailey decides is recorded against the tile in targets.json, and the three composites match it.

#### PR-0032 — No text size, no key remapping, and no in-game motion or flash accommodation

*onboarding · both · chapter all · pause > OPTIONS · confidence: high for what the build contains; the rendered OPTIONS panel is unverified this round*

**Expected.** A player can enlarge the interface text, rebind the keys, and turn motion and flashing down from inside the game.

**Observed.** OPTIONS carries six rows: master, music and sfx volume, text speed, X-2 Active/Wait, strategy guide on/off. There is no text or UI scale, no remapping anywhere in src/, no motion toggle and no flash or photosensitivity setting. Settings already carries reduceMotion and lowEffects, but the code comment says they belong to a settings screen that does not exist. What does work: prefers-reduced-motion is honoured in ten shipped stylesheets and seeded at boot, so an OS-level preference is respected.

**Repro.** Chapter 1, Esc, OPTIONS, read the rows. Source- and bundle-level this round; the rendered panel was not captured.

**Evidence.** src/app/screens/PauseScreenPanels.ts:198-220; src/app/SaveData.ts:63-64,175,182-185; critic/rounds/round-04/evidence/shots/ch1-08-pause-esc.png

**Requirement.** RUBRIC section 6 onboarding (usable settings, text and input access, motion and flash accommodations). Open since round 03.

**Smallest fix.** Needs an end state from Bailey before it is built, because it changes a screen he will see (AGENTS.md rule 9). The cheapest step that needs no new decision is to surface the reduceMotion flag the game already reads as a seventh OPTIONS row, since the behaviour behind it already ships.

**Acceptance check.** Open OPTIONS in both games at 1600x900 and 2000x1012, move to the motion row with real arrows and toggle it, and assert from the game's own snapshot that reduceMotion flipped and the transition CSS stops animating on the next screen change.

#### PR-0033 — The defeat screen has no approved target and tells the player nothing about why they lost

*onboarding · both · chapter all · results screen, Defeat variant · confidence: high*

**Expected.** targets.json's own gap entry: 'the pull to play again comes from the fight itself, so a loss says why in plain words'.

**Observed.** After a loss the screen shows the word Defeat, TURNS, ATTEMPTS, BEST / NEVER CLEARED and RETRY / CHAPTER SELECT; in FFX the right half is empty black (PR-0003). It never names what killed the party, which objective went unmet, or what to try differently - and in this review the party lost eleven times across four chapters with no guidance between attempts.

**Repro.** Lose any chapter and read the screen.

**Evidence.** critic/rounds/round-04/evidence/shots/ch1-16-results.png, ffx2-bahamut-09-results.png

**Requirement.** docs/target/targets.json lists 'Defeat screen' as a gap awaiting a decision; AGENTS.md rule 9.

**Smallest fix.** Take the defeat screen through the standing end-state process: two to four options for Bailey before anything is built. Nothing here should be implemented without that pick.

**Acceptance check.** An approved defeat-screen tile exists in targets.json and the build matches it.

#### PR-0034 — The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow

*visual · FFX · chapter 1 (Mt. Gagazet) · battle versus the pre-battle scene, 1600x900 · confidence: high for Chapter 1, the only scene with the same painting under both cameras*

**Expected.** The moonlit canyon of the approved tile.

**Observed.** The shipped gagazet.png is byte-identical to the approved copy and renders faithfully under the pre-battle scene camera, where the composite is a close match. Under the battle camera the same painting is darkened and desaturated to a flat navy wall: the moon and the lit snow floor are gone, and a backdrop-only patch measures mean luminance 70 against the source painting's 114, so the arena reads as a dark cave.

**Repro.** Capture Chapter 1's pre-battle scene and its battle at 1600x900 and pair both with docs/screenshots/concept-gagazet.png.

**Evidence.** critic/rounds/round-04/targets/presentation-dialogue.jpg (scene camera, faithful); targets/scene-ch1-gagazet.jpg (battle camera, flattened)

**Requirement.** The approved scene tile 'Ch.1 Mt. Gagazet'; CHK-013 judges art inside the running game.

**Smallest fix.** Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.

**Acceptance check.** Re-pair the tile from a battle frame: the moon and the lit snow are present and the backdrop patch's mean luminance is within about 10 percent of the source painting's.

#### PR-0035 — The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile, and Bahamut is under-lit

*visual · FFX-2 · chapter 4 · battle, command menu open, 1600x900 · confidence: high on the observation; the intent is unknown*

**Expected.** Either the approved tile's composition, or a recorded decision that the mirror is intentional.

**Observed.** The field is mirrored - Bahamut sits right of centre and the party stand left - and Bahamut is rendered much darker and lower-contrast than in the approved tile, where his red wings and purple armour carry the left third. Neither docs/handoff/presentation-ink-and-gold.md nor research/ffx-vs-ffx2-presentation.md states a party/enemy side convention, so whether the mirror is intended cannot be decided from the sources.

**Repro.** Pair the Chapter 4 battle capture with the approved tile.

**Evidence.** critic/rounds/round-04/targets/presentation-battle-ffx2.jpg

**Requirement.** RUBRIC section 7; AGENTS.md rule 14 (decide from the sources, and if they do not say, ask).

**Smallest fix.** Ask Bailey once whether the FFX-2 field keeps the approved left-enemy composition or the mirrored one and record the answer against the tile. Either way, raise Bahamut's key light so he reads against the dark Bevelle backdrop as he does in the tile.

**Acceptance check.** The tile carries a recorded decision and the composite matches it.

#### PR-0036 — The FFX-2 party crowds the left third of the stage while two thirds of it is empty

*visual · FFX-2 · chapter 4 · battle staging, 1600x900 · confidence: high*

**Expected.** A composition comparable to the FFX chapters, which stage their party noticeably larger and further apart.

**Observed.** Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.

**Repro.** Chapter 4, first ATB turn, 1600x900.

**Evidence.** critic/rounds/round-04/evidence/shots/ffx2-bahamut-04-enemy-intent.png, ffx2-bahamut-03-battle-menu.png

**Requirement.** RUBRIC section 6 visual (composition, staging, ground contact).

**Smallest fix.** Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.

**Acceptance check.** Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.

#### PR-0037 — Mid-battle beats hard-code speakers who are not in the active formation

*narrative · FFX observed; the same shape exists in the other chapters' midScripts · chapter 1, beat 'first-zombie' · battle, story beat playing · confidence: high*

**Expected.** The characters on the field speak.

**Observed.** The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.

**Repro.** Chapter 1: play until a party member is Zombied and read the speaker card.

**Evidence.** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png; src/story/scripts/seymour-flux.ts:278-281; src/data/ffx/builds/gagazet.ts:424-425

**Requirement.** RUBRIC section 6 narrative (character voice, reachable scenes).

**Smallest fix.** Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.

**Acceptance check.** Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.

#### PR-0038 — 'Mute is applied at boot' is claimed, but mute is never persisted at all

*delivery · both · chapter n/a · boot and audio unlock · confidence: high*

**Expected.** The release note and the handoff describe what the code does.

**Observed.** The three volumes are applied at boot and survive the unlock - verified across four save shapes. Mute is not: Settings has no muted member, applySettings (src/audio/AudioManager.ts:534) touches three volumes only, and nothing in the pause screen calls setMuted. A save written with muted true reads back unmuted. There is no player-facing mute control today, so no player currently loses a setting; the claim is simply wider than the code.

**Repro.** Read src/app/SaveData.ts defaultSettings() and AudioManager.applySettings; the boot matrix is in evidence/logs/chk024.json (muted false in every case).

**Evidence.** critic/rounds/round-04/evidence/logs/chk024.json

**Requirement.** CHK-024 and the changed-area claim in the release manifest.

**Smallest fix.** Either drop 'and mute' from the release note and the handoff, or add muted to Settings and push it through applySettings. Giving OPTIONS a mute row is a new control and needs Bailey's yes (AGENTS.md rule 10).

**Acceptance check.** The written claim and the boot matrix agree, whichever way it is settled.

#### PR-0039 — 3 of 21 shipped cues have no tempo map, so written rubato cannot bend the pulse

*audio · both - scene-gagazet and scene-dreams-end are FFX cues, scene-farplane is FFX-2; the cause is shared renderer plumbing · chapter the pre-battle scenes of chapters 1, 3 and 5 · shipped audio · confidence: high on the technical finding; whether it matters musically is Bailey's ear (CHK-B1)*

**Expected.** docs/audio/THEMES.md's renderer request #1: a lyrical cue carries a tempo map so rubato can move the pulse, or it is listed in TEMPO_MAP_EXEMPT with a stated reason.

**Observed.** node tools/audio/themes-audit.mjs scene-gagazet scene-dreams-end scene-farplane --verbose marks all three FAIL, in each case solely on 'no tempo map on a lyrical cue'. Every other check for the three is a note or expected. Predates Build A.1 and is not a regression.

**Repro.** Run the command above in D:/pyrefly-release.

**Evidence.** themes-audit output captured this session; git log 7191674..HEAD -- src/audio tools/audio public/audio confirms these tracks and the tool are unchanged since the round-03 baseline

**Requirement.** docs/audio/THEMES.md.

**Smallest fix.** Implement THEMES.md's requested Track.tempo?: Array<[beat, bpm]> with linear interpolation and give these three a written tempo curve; or, if an arranger judges a static pulse acceptable for one of them, add it to TEMPO_MAP_EXEMPT with a reason as boss-dread and scene-bevelle-underground already are.

**Acceptance check.** themes-audit reports no tempo-map failure across the 21 cues, and Bailey signs off the re-rendered cues in an audition tour.

#### PR-0040 — src/battle/ffx/state.ts crossed the 400-line house limit in this build

*delivery · FFX · chapter n/a · source · confidence: high*

**Expected.** AGENTS.md hard rule 7: every source file under 400 lines.

**Observed.** The Threaten/Sleep repair added inTurnQueue() and its documentation, taking state.ts from 384 lines at 7191674 to 415 at bc2571c. Twenty other files under src/ are already over the limit, so this is a widely breached rule rather than a new one, but this build is the change that pushed this file over.

**Repro.** Count the lines at both commits.

**Evidence.** measured in the repo at bc2571c (415) against 7191674 (384)

**Requirement.** AGENTS.md hard rule 7.

**Smallest fix.** Split the queue-membership predicates out of state.ts, or record an explicit exemption for the engine files so the rule stops being decorative.

**Acceptance check.** Either state.ts is under 400 lines, or docs/DEV.md records the exemption and the list of exempt files.

#### PR-0041 — FFX-2 items were unreachable through the command menu for 17 and 12 consecutive turns in the review's harness

*interface · FFX-2 · chapter 4 and 5 · battle, ITEM submenu · confidence: low - a harness observation with a plausible harness explanation*

**Expected.** The ITEM row opens its submenu and a Potion or Phoenix Down can be used, as it can in FFX.

**Observed.** logs/ffx2-bahamut-run.log records 'revive with a Phoenix Down failed (unreachable); rows=ATTACK|SKILL|CHANGE|ITEM' on every turn from 22 to 38, and ffx2-vegnagun-shuyin-run.log records 'heal with a potion failed (unreachable)' on every turn from 3 to 13. The ITEM row is present in both. In FFX the same harness used Potion, Hi-Potion, X-Potion, Phoenix Down and Eye Drops successfully. The asymmetry is what makes it worth checking rather than dismissing.

**Repro.** Not reproduced by hand. Open Chapter 4's ITEM submenu with real arrow keys and try to use a Phoenix Down.

**Evidence.** critic/rounds/round-04/evidence/logs/ffx2-bahamut-run.log, ffx2-vegnagun-shuyin-run.log, yunalesca-eventlog.json

**Requirement.** CHK-015 (a player-facing behaviour is proved with the player's own input) and CHK-020.

**Smallest fix.** None proposed until reproduced by hand. Reproduce with real arrow keys first; if the submenu does open for a human, fix the harness and say so.

**Acceptance check.** A hand or scripted real-key run uses an item from the FFX-2 ITEM submenu in both FFX-2 chapters, or the defect is reproduced and traced.

#### PR-0042 — Round-04 evidence integrity: three captures cannot support their claims and three index rows contradict the run log

*process · n/a - the critic's own evidence · chapter n/a · critic/rounds/round-04/evidence/ · confidence: high*

**Expected.** CHK-016: a screenshot is evidence only when the harness proved what is in it, and the recorded state is part of that proof.

**Observed.** shots/ch1-01-title.png has a maximum channel value of 84/255 frame-wide (a fade-in frame at about 31 percent opacity) and shots/save-04-broken-storage.png is the same screen at about 6 percent, max 15/255; index.json records shots/ch1-16-results.png three times as 'results screen after victory' while the image is the Defeat card and the run notes record three defeats. Three further rows carry asserted:false although their harness calls the asserting shoot(), most likely a lost read-modify-write on a shared index.json. All were treated as non-evidence; the gap pass re-shot the title after polling for a settled frame.

**Repro.** Compare index.json's state strings against logs/ch1-notes.json, and measure the max channel of the two named PNGs.

**Evidence.** critic/rounds/round-04/evidence/index.json; evidence/shots/ch1-01-title.png; evidence/shots/save-04-broken-storage.png; evidence/gaps/g-title-settled.png

**Requirement.** critic/CHECKS.md CHK-016.

**Smallest fix.** Add a settle assertion to the capture harness - after the state assertion, wait until two consecutive frames differ by less than a threshold and the frame's max channel exceeds a floor, then shoot - derive the index state from the observed outcome rather than from the script's intent, and make addIndex append through a lock or a per-process shard merged at the end.

**Acceptance check.** Run any two harnesses concurrently: every shot appears in index.json with asserted:true and a state whose outcome matches the run log, and no capture in the set has a max channel below the settle floor.

#### PR-0043 — Coverage debt: Chapter 5 never reached an outcome and no chapter was captured through a victory

*process · both · chapter all five · review coverage · confidence: high*

**Expected.** CHK-022 for every included chapter: one continuous legal-input route from normal entry to outcome, reachable aftermath and results, and retry or return.

**Observed.** Chapter 5's capture stopped at turn 13 of link 1 because the menu-walk cost about 90 s per turn in that formation, and the gap pass reached only the link 1 command menu. No chapter was won through real input in any pass, so the victory scene, the victory results card, the reward path and the AP/Sphere-Level crediting fix have never been seen on screen. The confirmer's scripted intended-strategy runs show the encounters are completable, which is why this is coverage debt rather than a product defect.

**Repro.** n/a

**Evidence.** critic/rounds/round-04/evidence/index.json; evidence/logs/confirm-intended-outcomes.json; evidence/gaps/g-ch1-postbattle-lines.json (0 lines)

**Requirement.** RUBRIC section 5 and CHK-022.

**Smallest fix.** No product change indicated. Re-run the capture with a faster policy - a scripted move list driven through real key events rather than a full menu walk per turn - and budget one victory per chapter as the first thing the next round captures.

**Acceptance check.** The next deep review's index carries, per chapter, a victory, its post-battle scene, its results card and the return, all from real key events.

### Suggestion (1)

#### PR-0044 — 16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them

*visual · both (15 of the 16 are FFX-2 dresspheres) · chapter n/a · public/art/manifest.json · confidence: high*

**Expected.** Every subject declares its facing so the sign assertion can run per chapter formation.

**Observed.** paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.

**Repro.** Read D:/pyrefly-release/public/art/manifest.json.

**Evidence.** D:/pyrefly-release/public/art/manifest.json

**Requirement.** critic/CHECKS.md CHK-014.

**Smallest fix.** Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.

**Acceptance check.** Every manifest subject carries a facing and the per-formation sign assertion runs green.

### Dropped after adversarial retest

- **No chapter could be won through real input; four of five encounters ended in defeat (filed as a major encounter defect by the capture owner)** — DROPPED as filed, re-filed at its true scope as PR-0006 and PR-0008. The confirmer drove all five chapters through the shipped presenter and HUD with the repo's own intended strategy and won 15 of 15 attempts on seeds 2/4/7 for chapters 2 to 5, plus 5 of 6 tried on chapter 1, so the encounters are completable on this build. Two supporting claims were also wrong: the 39/40 figure belongs to chapters 2 and 3, not chapter 1, whose own test file documents 26 of 40 with seed 1 as a known loss; and the review's own triage policy overrode the advisor on nearly every turn (Chapter 2 spent 71 of 85 turns on potions, Chapter 3 one advisor turn of 24, Chapter 4 eight of 39), which is a reviewer-authored healing loop rather than the game's guidance. What survives is the advisor's behaviour on a broken board (PR-0006) and Chapter 1's documented win rate (PR-0008). CHK-022 still cannot pass, because a scripted policy is not a player's own input.

## What stands between this build and acceptance

The code answered this and the answer is long, so it is worth separating the three kinds of blocker.

**1. Evidence that does not exist yet.** Three categories (feel, narrative, audio — 30 of the 100 weight) have no number, and none of them can get one from more agent effort alone. Audio needs Bailey's score out of ten, which `targets.json` already lists as owed. Feel and narrative need something simpler: *one win*. No chapter was won through real input in any pass of this round, so the climax, the post-battle scene, the victory results card, the reward path and the aftermath of all five chapters are unseen. CHK-022 is UNVERIFIED for that reason and CHK-023 is UNVERIFIED for three of the four subsystems this build changed, because no browser run reached Yu Yevon at Chapter 3 link 7, no sleeper ever lost a turn before being woken, and the one filmed FFX-2 enemy action was a miss.

**2. Defects the build owns.** Twenty-one major issues are open, and three of them are the changed area's own: the results ledger regression (PR-0003), the guide's whole-line clamp that does not hold at either reviewed size (PR-0009), and a sourced rule left unimplemented because its guard has no call site (PR-0004). Every category sits below the 9.0 floor, most conspicuously onboarding at 4.2, where the whole surface is absent, and interface at 6.6, where a third to two thirds of the text is under the legibility floor.

**3. Decisions only Bailey can make.** Seventeen of the thirty-five required tiles are not matched, and several cannot be by building: the phone layout, the defeat screen, the advisor card and the enemy next-move panel are gaps awaiting an options round; the FFX-2 letter convention and the FFX-2 field mirror have no source to decide them; and the approved Turn cut-in has never been wired, so the owner has to say whether the tile stands. Nine of the thirteen recorded human judgments are not collected.

None of this stops an interim release on its own terms — the rubric allows one below 9.6 when its release checks pass and it adds no unaccepted major regression. This build does add one (PR-0003), which is why the changed area is FAIL and why the deploy script will refuse it until a deep report for the commit passes.

## What changed since the previous round

Round 03 was scored under rubric v1 and its numbers stay with build 7191674; nothing here is compared with them. What can honestly be said is which of its findings this build closed, and what is new.

**Closed and verified on this candidate.** Threaten no longer deletes an enemy from the CTB queue and Sleep no longer lasts forever — the queue behaviour is now exactly the sourced rule, proved in the engine and, for Threaten, in a browser with real keys. Yu Yevon's Curaga no longer answers his own Pagodas' Power Wave and Gravija now reaches the whole field, which makes the researched attrition route reachable (engine-proved; no runtime evidence yet). Single-target Haste no longer describes itself as party-wide. The pause dossier says BATTLE rather than the internal LINK. Duplicate enemies are lettered within their own name group and a unique enemy carries none — confirmed in play. Saved master, music and sfx volumes are applied at boot and on audio unlock across four save shapes, closing round 03's audio-settings blocker. Party rows and damage numerals move with each blow rather than after the burst, filmed at 100 ms in FFX. FFX-2 party prep now has the same shape as FFX.

**Claimed but not holding.** The strategy guide's whole-line clamp (PR-0009) and the release note's "mute is applied at boot" (PR-0038).

**New in this build.** One regression, PR-0003, from the same commit that correctly fixed AP eligibility.

**Carried, re-measured rather than inherited.** Chapter 1's 26-of-40 win rate and its zero-turn Zombie window were both re-measured on this candidate rather than carried forward, as were the HUD legibility numbers, the command-stack occlusion and the portrait crops.

**New findings this round owes to call-site tracing.** Two complete, unit-tested subsystems have no production caller: `canCounter` (PR-0004) and `showTurnCutIn` (PR-0005). That is AGENTS.md hard rule 4 happening for the third time, and it is what CHK-023 exists to catch.

## Proposals (nothing here is built without Bailey's yes)

Unscored. These are questions and options, not work in progress.

- Ask Bailey the FFX-2 enemy-letter question once, narrowly: for a boss plus its same-named sub-parts (Vegnagun and three Nodes), does FFX-2 letter from A per name group, and is a lone fiend plain? research/ffx2-combat-core.md is silent, so rule 14 says ask rather than copy the FFX rule across. Cost: one answer, then a one-function change and a test. Risk: none if asked; a fidelity error if guessed.
- Run the phone-layout options round that targets.json already lists as a gap. At 390x844 a third to two thirds of the HUD is 2.3-5 px and one of Chapter 1's two enemies is off-screen, so the phone column cannot be repaired without a target. Two to four mockups at real resolution; cost is one options round, and it unblocks PR-0001's phone half and PR-0017.
- Run the defeat-screen options round (also an existing gap). The party lost eleven times in this review and the screen never said why; the product brief's own line is that the pull to play again comes from the fight itself. Two to four options, then one build.
- Run the options round for the move advisor card and the enemy next-move panel, the two remaining fight gaps. Both exist only in words today, which is why PR-0006, PR-0010 and PR-0011 are argued from first principles rather than against a target.
- Decide whether the approved 'Turn cut-in' tile still stands. It has never been wired and nobody noticed until a call-site trace, so either it is built or the tile is retired with a note. Cheap either way; leaving it approved-and-absent blocks the milestone gate.
- Settle whether the FFX-2 battle field keeps the approved tile's left-enemy composition or the shipped mirror, and record the answer against the tile. It also decides whether PR-0036's party spacing is a reframing or a rebuild.
- Settle whether the TARGET header slab and the key-hint bar in the three approved targeting frames were part of what was approved on 2026-09-19. A pick approves only the properties Bailey names, so this is a one-line clarification that turns three ambiguous composites into three clean ones.
- Give the audio a score out of ten at the next listen. targets.json already asks for it; without a number the audio category (weight 10) can never be scored and the milestone can never be accepted, however clean the technical gate is.
- Surface the reduceMotion flag the game already reads as a seventh OPTIONS row - the behaviour ships, only the control is missing - as the cheapest accessibility step that needs no new art decision. Anything beyond it (text scale, remapping) needs its own options round.
- Decide whether reserve members may speak in mid-battle beats (PR-0037). Today Rikku and Lulu speak in a fight neither is in; the alternative is authored fallbacks drawn from the active formation, which costs writing time per beat.
- Record an explicit house-rule exemption for the engine files over 400 lines, or split them. Twenty-one files are already over, so the rule currently teaches agents to ignore it.
- Budget the next capture pass around one victory per chapter, scripted through real key events rather than a full menu walk. Everything this round could not judge - the victory scene, the victory results card, the reward path, Yu Yevon's link-7 behaviour, the Overdrive overlay, Shiva and Shuyin - is downstream of that one missing route.

---

*Round 04, 2026-09-20T18:20:00-04:00. Report JSON: `critic/rounds/round-04.json`. Evidence: `critic/rounds/round-04/evidence/` (246 indexed captures, logs, clips and gap captures), composites in `critic/rounds/round-04/targets/`, crops in `critic/rounds/round-04/crops/`, benches in `critic/rounds/round-04/bench/`, confirmation harnesses in `critic/rounds/round-04/confirm/`. All browser work used PYREFLY_BROWSER=gpu with no fallback.*
