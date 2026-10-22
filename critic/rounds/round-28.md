# Round 28: deep review of release 61 candidate 660c19bbd (the conference demo build)

```text
Build / artifact / target version: main 660c19bbd, bundle index-DwMQUoVh.js, artifact 6234643353f6dad6116eee64f535082d7c154e12da966b3b7fc57a2e61400a1c (6,242 files, candidate dist-gate, not deployed); targets ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98
Review: deep (candidate, before the deploy; save-data class)
Deployment: NOT APPLICABLE (the candidate is not deployed)
Changed area: FAIL
Ship: SHIP, and why: no critical defect, no confirmed regression against live r60, the new-feature majors do not block, the unknown-regression majors are disclosed. Majors disclosed: PR-0478, PR-0380, PR-0379, PR-0459, PR-0504, PR-0481, PR-0148, PR-0099, PR-0295, PR-0461, PR-0460
Milestone: not assessed
Quality: PROVISIONAL, no verified score for audio, onboarding, prep and delivery (r27 was also provisional)
Targets: required 8 / matched 8 / failing 0 / unverified 0 / waiting on decision 1
Top issues: PR-0478 rig head size and the remaining two-body frame, PR-0380 swap jerks and the Mortiorchis dissolve, PR-0379 see-through pose changes, PR-0459 size across poses, PR-0504 demo wins play no results music, PR-0481 demo battle start 12 to 14 s
Coverage: 5 chapters by real input of the 19 planned (both demo chapters in full); 14 chapters, the pad Overdrive windows, accessibility, and booth-hardware timing not tested (below)
Next required review and why: the live review and the deep review on the live build after the deploy, with the other 14 chapters and Bailey's listening and feel judgments
Elapsed review time / repeated work avoided: about 95 minutes in all; the capture owner's evidence and three confirming continuity runs were reused by reference, not rerun
```

## Score output (verbatim from node tools/critic-score.mjs)

```text
score: PROVISIONAL â€” no verified score for audio, onboarding, prep, delivery (never averaged away, never zero)
below the 9 floor: encounter, visual, feel, narrative, interface
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for audio, onboarding, prep, delivery
  - category encounter is below the 9 floor
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - category narrative is below the 9 floor
  - category interface is below the 9 floor
  - mandatory check CHK-001 is FAIL
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-026 is UNVERIFIED
  - mandatory check CHK-027 is FAIL
  - 11 critical or major issue(s) remain open
  - 1 required target(s) waiting
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix (CHK-B1, PR-0148, PR-0099)
  - human judgment not recorded: Visual and feel: are the two boss rigs acceptable in play for the demo (the Bahamut idle-to-attack frame, the Mortiorchis dissolve; PR-0478, PR-0380; CHK-B2)
  - human judgment not recorded: Demo: approval of the picker, QR plate, reset ring and attract reel as surfaces (PR-0505), and whether the reset should restore default settings (PR-0509)
  - human judgment not recorded: Narrative: the Chapter IV wedge and Rikku's grin (PR-0485)
  - human judgment not recorded: Accessibility: COLOUR VISION and whether the HD-2D look needs a scope note or setting (PR-0508)
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

## Verdicts and the ship decision

- **deployment**: NOT APPLICABLE
- **changedArea**: FAIL
- **milestone**: not assessed
- **ship**: SHIP

- No critical defect was found and none is introduced or left reachable: both demo chapters were won and lost-and-retried by real pad and keyboard input, every state read matched, 0 console errors, and the save-data class passed on 12 shipped release fixtures with nothing lost (CHK-024).
- PR-0504 (demo wins have no results music, major) and PR-0481 (demo battle start of 12 to 14 s, major) are inside the brand-new demo mode, which does not exist live: by the owner's rule A they are disclosed and do not block.
- PR-0478 and PR-0380 (major) carry regressionVsLive unknown: the independent 1600x900 runs on the candidate table show the swap jerks at live levels (Chapter I 4 against 2, Chapter IV 1 against 3) and Mortiorchis jerks only in 2 of 4 runs, so a regression is possible but unproven; a major with an unknown tag does not hold (only a critical does) and both are disclosed. If Bailey sees the Mortiorchis or Bahamut dissolve and dislikes it, the rigs can be left off for the demo.
- PR-0379, PR-0459, PR-0148, PR-0099, PR-0295, PR-0461 and PR-0460 (major, carried) are neither introduced by this change nor regressions; they are disclosed and carried into the next batch.
- Because this review is of a candidate that is not yet deployed, the exact-artifact comparison and the live verification remain the deploy's and the next review's; this candidate saves data differently (Settings gained titleArtPicked and visualStyle) and CHK-024 passed on it before going public.

### Disclosed in the release announcement

- PR-0478 (major): the two boss rigs' head-size fix is not independently proven and one two-body frame remains at the Bahamut idle-to-attack swap; the two harness trees disagree.
- PR-0380 (major): swap jerks of 40 to 48 px on party figures and, in 2 of 4 runs, Mortiorchis dissolving with a 60 to 68 px shift.
- PR-0379 (major): every pose change is a see-through dissolve with a double image for 2 to 4 frames.
- PR-0459 (major): size continuity across poses is open on Yunalesca and Leblanc (not validly run on the candidate).
- PR-0504 (major, new in the demo): demo wins play no results music.
- PR-0481 (major): demo battle start takes 12 to 14 s to the first command, with frames up to 1 s (headless GPU; measure on the booth machine).
- PR-0148, PR-0099, PR-0295, PR-0461, PR-0460 (major, carried): no owner listening score, stand-in audio in eleven chapters, phone party-prep layout, chapters without a real-key flow, Chapter III greyed Summon rows.

## The ten categories

### combat: 9.5

Combat auditor, round 28 on candidate 660c19bbd. No combat engine or game-data change: git diff 1cea6e937 660c19bbd touches nothing under src/battle, src/data (bar src/data/art/rigTypes.ts), research/ or BattlePresenter*. Full unit suite on the candidate tree with 180 s timeouts: 24,273 passed, 0 failed, 112 skipped (a first 15 s-timeout run under load had 41 timeouts and no assertion failures). Seeded benches with the shipped line: Chapter I 100/100 (seeds 1 to 100, avg 52 turns); other FFX chapters 31 to 40 of 40 (Mirror Aeons 31, Yunalesca 37, Braska 39, Anima 39, Evrae 39, Yojimbo 39, Natus 38, Omnis 38, Via Purifico 40, Sin core 40, Sin face 40); FFX-2 Bahamut 40/40 at Wait and 40/40 at Active; Vegnagun, Leblanc, Fallen Aeons, Den of Woe, Ixion 15/15; Trema 8/15. Wrong lines lose (Chapter I attack-only, defend-only, random 0/90). Demo logs agree with the sources (Seymour Flux 70,000 HP with Mortiorchis 4,000 and the Mortibsorption cycle; Lance of Atrophy then Full-Life; Bahamut Curse / Attack / Impulse / Mega Flare). Held at r27's 9.5: no engine change; deducted for the pad-driven Overdrive windows never being captured (CHK-023) and PR-0460 unchanged and UNVERIFIED.

### encounter: 8.9

Encounter data, AI scripts, phases and party builds are byte-identical to live r60. Demo seeds 7, 10 and 12 open with the party menu; the real-input demo win (seed 7, 55 turns) shows the sourced behaviour; Bahamut seed 56 won (42 turns); defeat and retry reach battle in both demo fights. Chapter I wrong lines 0/90. One new minor, PR-0487 (the Auron tip is false at the first menu of six FFX chapters). The auditor proposed 9.4; I hold r27's 8.9 because the reasons for 8.9 are unchanged and not re-tested (Trema about 60 percent and Den of Woe 95 percent at human pace, PR-0227 and PR-0498; hidden chapters that do not punish credible mistakes, PR-0447; and 16 of 19 chapters have no real-key flow on this candidate), and nothing in the candidate changes an encounter. No gain is claimed.

### visual: 8.4

Provisional 8.4 against r27's 8.5, from stills and the continuity strips of the candidate (bundle index-DwMQUoVh.js) at 2560x1440, 2000x1012, 1600x900 and 390x844. Credits: the Echo title is a clean composition; HD-2D reads as a deliberate lit stage and CLASSIC visibly differs; both demo bosses read as large recognisable painted figures with the party whole at booth size; results, pause and phone match their tiles. Debits: PR-0479, PR-0421, PR-0486 re-observed; PR-0507 (rim and shards; the rig lighting is barely perceptible); PR-0478 and PR-0459 still open (CHK-026 UNVERIFIED, the two harnesses disagree); one double-body frame remains at the Bahamut idle-to-attack swap. Static pose census (no browser): 1106 paintings, 829 pass, 79 waived, 0 fail, 198 exempt, 0 rigged (the rigs are outside it). verify-approved on the candidate tree: 917 ok, 0 mismatched, 0 missing.

### feel: 8.2

Build 660c19bbd, candidate, GPU headless Playwright, no black canvas. Candidate-table harness runs alone at 58.7 to 59.8 fps: 0 snaps per minute; Chapter I 4 swap jerks of 40 px or more (worst 47.6) against 2 on live; Chapter IV 1 (47.9) against 3; Mortiorchis jerks of 60 to 68 px in 2 of 4 runs (PR-0380); ghost severity worst 0.365, 0.326 (PR-0379); KO has no fall (PR-0473). The auditor proposed 8.2 and I keep it: the demo flow is responsive (title to first menu in 1.3 to 3.9 s of screen time, but 12 to 14 s to the first command, PR-0481), R3 opens the slab, the reset and attract behave as claimed, and the Escape/B card absorb works. No gain claimed on r27's 8.3 because the one headline motion fix (the 40 ms rig fade) trades one double image for a shorter dissolve that jerks on Mortiorchis in some runs.

### narrative: 8.7

Held at r27's 8.7. src/story is unchanged between 1cea6e937 and 660c19bbd (git diff --stat empty), so round 27's reading of the script text stands by that dependency. New this round: the demo skips the story by design, so no new aftermath was read; Chapter IV results are calm as in r27. Carried polish: the Chapter I and II quip, the smiling wedge and Rikku's grin on the sorrowful line (PR-0485). Not re-read this round: the other chapters' scenes.

### audio: UNVERIFIED (no number)

No number: there is no numeric owner listening score for this mix (docs/audio/OWNER-VERDICT.md; PR-0148, CHK-B1) and agents cannot hear. Technical health passes (audio/qa.json 0 failures; 71.6 MB; the sample files are unchanged apart from MusicLoader.ts), and routing fails at one real moment: demo wins have no results music (PR-0504, CHK-001 FAIL). Nothing is averaged or zeroed.

### interface: 8.2

Held at r27's 8.2 with the new surface added. The pad glyphs, the R3 and Y slabs, the picker, the QR plate and the reset ring work by real input at 2560x1440. New polish: PR-0506 (two confirm prompts), PR-0511 (PRESENTATION value), PR-0508 (VISUAL STYLE scope is onboarding). No approved target exists for the picker, QR plate, reset ring or attract reel (PR-0505). Carried and re-observed: PR-0502, PR-0456, PR-0488. No critical or major interface defect found; PR-0295 (phone prep) is carried and was not re-observed.

### onboarding: UNVERIFIED (no number)

No number: no frame of the pause ACCESSIBILITY tab, TEXT SIZE, REDUCE FLASHES, COLOUR VISION or CONTROLS remapping, and no written accessibility walk (PR-0503). Seen this round: the Escape/B card absorb works (esc-probe), VISUAL STYLE is flippable by pad and kept after reload (PR-0508 on its scope), PR-0487 on the Auron tip.

### prep: UNVERIFIED (no number)

No number (ninth review with the same open half): the demo has no prep by design, the non-demo prep screens were captured but there is no written prep walk (PR-0503). New: the reset keeps settings (PR-0509).

### delivery: UNVERIFIED (no number)

No number: first-load time and frame stability were not measured on the booth machine; the demo battle start takes 12 to 14 s to the first command with 0.8 to 1.0 s frames in headless GPU mode (PR-0481), max frame 305 and 351 ms (PR-0480); no Firefox, WebKit-play, Safari or real-pad evidence. Identity and media: 6,242 files, 0 undecodable (CHK-018, CHK-019), save migration PASS (CHK-024), 0 console errors in the capture.

### Bailey's five visual sub-scores (not weighted)

characterModels 7.0, enemyModels 7.8, animation 7.0, fidelity 8.6, camera 7.5 (previous: {"characterModels": 7, "enemyModels": 8.0, "animation": 7, "fidelity": 8.6, "camera": 7.5}). enemyModels 8.0 to 7.8: the rigs read as large, sharp, recognisable bosses, but Mortiorchis dissolves through a see-through frame with a 60 to 68 px shift in some runs and Bahamut keeps one two-body frame at idle-to-attack. characterModels and animation stay where they were (7.0) until the candidate-table run of the other chapters and an independent head measure exist; fidelity and camera are carried (PR-0421, PR-0479 minors).

## Continuity (CHK-026 and CHK-027)

Harness aggregate recorded in the report: CHK-026 UNVERIFIED, CHK-027 FAIL, snaps per minute 0.

The runs, and how I weighed them (the evidence disagreed, and this is the main finding of the review):

- confirm-cont (candidate table, alone, seed 1, 1600x900): chapter seymour-flux; CHK026 PASS; CHK027 FAIL; jerksOver40 4; worstJerkPx 47.6; worstGhost 0.364; fps 59.8; summary critic/rounds/round-28/confirm/confirm-cont/continuity-summary.json
- confirm-cont2 (same): chapter seymour-flux; CHK026 PASS; CHK027 FAIL; jerksOver40 4; worstJerkPx 47.1; worstGhost 0.365; fps 58.7; summary critic/rounds/round-28/confirm/confirm-cont2/continuity-summary.json
- confirm-cont3 (same): chapter ffx2-bahamut; CHK026 PASS; CHK027 FAIL; swapJerksOver40 1; worstSwapJerkPx 47.9; worstGhost 0.326; fps 59.1; summary critic/rounds/round-28/confirm/confirm-cont3/continuity-summary.json
- capture owner cont2 (candidate table, alone): chapter seymour-flux and ffx2-bahamut; CHK026 PASS; CHK027 FAIL; note Chapter I 14 jerks over 40 px of which 8 Mortiorchis (worst 68.2), Chapter IV 1 (48.1, Rikku); summary critic/rounds/round-28/evidence/seymour-flux-win-cont2/continuity/continuity.json
- gap pass cont-a to cont-d (review tree table 78 subjects, two runs concurrent, NOT USED for the verdict): CHK026 FAIL; CHK027 FAIL; note Seymour 24.2 percent head and 10 jerks (worst 73), Bahamut 39.1 and 4 (51.4), Yunalesca 32.6 and 56 (149.7), Leblanc 37.6 and 8 (162.2); zero snaps; ghost worst 0.307 to 0.356; summary critic/rounds/round-28/evidence/gaps/cont-a/continuity-summary.json

The official continuity folder holds one finished chapter (seymour-flux: CHK-026 PASS, CHK-027 FAIL on 61 swaps at ghost severity 0.4 or more, worst 0.468, 349 swaps, 59 fps); ffx2-bahamut, yunalesca and ffx2-leblanc are UNVERIFIED there because that run was cut short.

Why the verdicts are what they are: the candidate's own harness and table read the rig heads by mesh (0.5 and 0.6 percent), which passes by construction; the review tree's harness with its older 78-subject table fails every chapter; the official continuity folder was cut short. CHK-026 therefore stays UNVERIFIED and is not passed, with no cap applied and none lifted. CHK-027 fails on the candidate-table runs in both demo chapters.

## Checks

| Check | Result | Mandatory | Reason |
|---|---|---|---|
| CHK-001 | FAIL | yes | Technical audio is valid (audio/qa.json: 0 failures, loop seams ok). Routing fails at one real moment: demo wins reach the results screen with no music (PR-0504, confirmed in a browser once and read in three runs). Defeats and non-demo wins route correctly. Nobody listened (CHK-B1 stays human). |
| CHK-008 | FAIL | yes | Panels over painted actors re-observed at 2560x1440: the Mortiorchis info slab over Seymour's lower legs, the turn plate over the left 42 percent with the menu live (PR-0502), LS HIDE over Tidus's plate. Duration of the plate unmeasured. |
| CHK-011 | PASS |  | verify-approved ROOT=D:/pyrefly-release55: 917 ok, 0 mismatched, 0 missing; every enemy in the sampled captures visible. The first run on the default root was the wrong tree and is not used. |
| CHK-012 | PASS |  | No letter-tile or monogram fallback in any HUD, picker, results or phone capture; the demo title paints its art about 1.0 s after navigation (pre-paint fade, timed). |
| CHK-013 | PASS |  | Approved paintings render as their masters at 2560x1440, 2000x1012, 1600x900 and 390x844; minors read in context (PR-0479, PR-0421, PR-0486, PR-0507). Rendering only; no replacement proposed. |
| CHK-014 | PASS |  | Battle-facing rules applied to battle figures only; facing reads correctly in the demo chapters and the regression chapters. |
| CHK-015 | PASS | yes | Every flow ran by Playwright keyboard, mouse, touch and a virtual standard-mapping pad on navigator.getGamepads. The only injections were setSeed(1) in the non-demo route and gotoChapter in the phone and Auron-pad probes; demo runs used none. |
| CHK-016 | PASS | yes | Every capture asserts screen, awaitingMenu and targeting from a state read; 18 of 412 index entries are recorded UNVERIFIED with a cause and none is passed as evidence (14 Esc shots where the first Escape closes the Auron card by design, 3 stale first-attempt entries, 1 post-scene shot already past). |
| CHK-017 | NOT APPLICABLE | yes | The candidate 660c19bbd is not deployed; the exact-artifact comparison is the deploy's. The build identity is recorded: bundle index-DwMQUoVh.js, artifactHash 6234643353f6dad6116eee64f535082d7c154e12da966b3b7fc57a2e61400a1c (6,242 files, 88 added, 7 removed, 13 changed against live r60; no approved painting changed). |
| CHK-018 | PASS | yes | art-derive verify and audit PASS on dist-gate: 4,504 masters, 0 problems; every art name in the bundle is a shipped file or a derived master, 0 dangling. |
| CHK-019 | PASS | yes | The manifest decodes every shipped image; the two flat-colour findings (Paine eyeR-catch 1x and 2x) are listed in policy intentionalFlatImages. |
| CHK-020 | PASS |  | Shared plumbing (pad map, demo flow, Escape card absorb, results) applies to both games; no game-only change was applied to the wrong game. |
| CHK-021 | PASS |  | Each changed combat-adjacent item holds its game case in code and captures: R3 enemy-move slab FFX only (FFX-2 slab chip stays Y), Auron tip in FFX_MARKS only (but see PR-0487), quiet results keyed to ffx2-bahamut only. |
| CHK-022 | PASS | yes | Both demo chapters ran by real input from title to results and back to the picker, win and lose with retry, in demo and default mode; Isaaru via Purifico won; Yunalesca lost on a route limit (PR-0397) and phone Chapter I was not completed (PR-0483): neither counted as a pass. The other 16 planned chapters were not run on this candidate (coverage.requiredNotTested). |
| CHK-023 | UNVERIFIED |  | Kimahri Rage, Auron Shooting Star (Xbox pad, chips drawn as pad glyphs, 7/7 correct, damage followed), Spherechange and the R3 / Y slab toggle were exercised by real input. Not captured: the PlayStation glyph family, Dragon Fang by pad, and Tidus, Wakka, Lulu or Rikku Overdrive windows by pad (rawInput.ts and overlayInput.ts were rewritten for the pad this release). |
| CHK-024 | PASS | yes | Save-data class: 12 shipped fixtures (release 20 to 37.1) loaded into a fresh browser before boot, 0 console errors; every chapter record, unlock, flag, seenCoach and setting preserved (chapters 4/3/4/3/3/3/3/3/3/3/2/5 in and out); titleArt reads echo with titleArtPicked false and visualStyle hd2d. The one value that moved is sfxVolume 0.35 to 0.7 in release-31a-sfx-b, the earlier sfx-balance migration. Variants: farplane with no flag becomes echo/unpicked (by design), echo with no flag stays, farplane with picked true stays, a bogus titleArt or visualStyle falls back, classic is kept. Unit suites for save and demo pass. |
| CHK-026 | UNVERIFIED | yes | Chapter I: 126 rig swaps worst 0.5 percent, 0 over tolerance, feet 0 to 0.8 px; Chapter IV: 107 rig swaps worst 0.6 percent, 0 over (confirm-cont, -cont2, -cont3, the capture owner's cont2). The rig head comes from the builder's mesh measure, so it passes by construction; the strips are the independent look (PR-0478). The review tree's harness with its older table FAILED all four chapters (24.2, 39.1, 32.6, 37.6 percent), which I do not use (PR-0512), and Yunalesca and Leblanc have no run on the candidate table, so the check cannot be passed for the chapters the plan lists. UNVERIFIED puts no cap on the sub-scores, but I do not lift them either. |
| CHK-027 | FAIL | yes | Candidate table, run alone: Chapter I 4 swap jerks of 40 px or more (worst 47.6), Chapter IV 1 (47.9 px); Mortiorchis jerks of 60 to 68 px in 2 of 4 runs; ghost severity worst 0.365 (below 0.4) in three runs and 0.468 (61 swaps at or over 0.4) in the official partial run; 0 snaps per minute. Live r60: FAIL as well (PR-0380, PR-0379). |
| CHK-B1 | UNVERIFIED |  | Bailey has recorded no listening score for this mix; agents read data and heard nothing. |
| CHK-B2 | UNVERIFIED |  | Bailey's play of the rig swaps, the demo flow and the battle-start wait is not recorded. |

## Target gate

Composites read from tools/end-state-board.mjs --pair in critic/rounds/round-28/targets: A-title (matched as a responsive adaptation; the painting is The Echo by Bailey's decision D-548/D-561), A-ink-and-gold-battle, A-ffx2-battle, A-results, pause-until-dawn (Chapter I and IV), seymour-flux-body (a model sheet, hash intact), phone-pr0001 and phone-pr0201. Waiting: the demo-only surfaces (picker, QR plate, reset ring, attract reel) have no tile in targets.json (PR-0505, hard rule 9). Audio and key-art tiles are not screenshot matches and are excluded.

## Coverage matrix

**Tested**

- Both demo chapters end to end by simulated Xbox, PlayStation and Switch pads plus keyboard at 2560x1440: picker, win, results, picker cursor, loss and retry, reset by Home and by Back+Start, attract loop and wake, title art cycle, OPTIONS VISUAL STYLE, keyboard-only flow.
- Non-demo Chapter I and Chapter IV by real keys at 1600x900, 2000x1012 and (Chapter IV) 390x844 touch; Isaaru via Purifico; Yunalesca (lost on a route limit).
- Save-data class: 12 shipped release fixtures and the titleArt and visualStyle variants (CHK-024).
- Engine benches on the real engines for every FFX and FFX-2 chapter in the plan; the full unit suite; orphans (24, all old).
- Static: artifact manifest (6,242 files), art-derive verify and audit, verify-approved, pose census.
- Audio technical QA of every cue and SFX; routing of the results cue in demo and non-demo wins.
- Continuity harness: Chapter I and IV with the candidate table (four runs), the review tree table (four chapters, not used), timed title, cut-in and battle-start sequences, Chapter I stage motion HD-2D versus CLASSIC versus reduce motion.
- Target composites for 8 required tiles (A-title, A-ink-and-gold-battle, A-ffx2-battle, A-results, pause until dawn Ch I and IV, seymour-flux-body, phone tiles).

**Reused, with the reason**

- Round-27 captures of live r60 (from critic/rounds/round-27): Used only as a side-by-side baseline to decide that PR-0421, PR-0479 and the Bahamut wing shapes are carried and not regressions; not counted as evidence for this build.
- Engine and data identity with r60 (from git diff 1cea6e937 660c19bbd): No diff under src/battle, src/data (bar rigTypes.ts), research/ or BattlePresenter*; all benches were nevertheless re-run in this round.
- Story text (from critic/rounds/round-27.json narrative): src/story has no diff between 1cea6e937 and 660c19bbd; the narrative score is held, labelled as reused.

**Not tested**

- Phone 390x844 touch Chapter I win (harness limit, PR-0483).
- PlayStation glyph family on the Overdrive windows, Dragon Fang and the Tidus, Wakka, Lulu and Rikku Overdrive windows by pad (CHK-023).
- Pause ACCESSIBILITY tab, TEXT SIZE, REDUCE FLASHES, COLOUR VISION, CONTROLS remapping (onboarding).
- First load time and frame stability on the booth machine; Firefox, WebKit play, Safari, a real controller and a real phone.
- The 1440p hint strip on a real 1440p monitor was read from 2560x1440 headless frames only.
- Carried r27 minors not re-read this round: PR-0430, PR-0357, PR-0366, PR-0356, PR-0372, PR-0386, PR-0387, PR-0388, PR-0324, PR-0453, PR-0454, PR-0468, PR-0469 and the other carried audio, combat and harness items in round-27.json; their status is unchanged.

**Required and not tested**

- CHK-026 and CHK-027 for Yunalesca and Leblanc with the candidate's pose-measure table (the only runs used the stale table).
- Real-key flows and continuity for 14 of the 19 planned chapters: braskas-final-aeon, ffx2-vegnagun-shuyin, seymour-anima-macalania, evrae-airship, yojimbo-cavern, seymour-natus, ffx2-fallen-aeons, seymour-omnis, ffx2-trema, ffx2-den-of-woe, ffx2-ixion-djose, sin-fins-core, sin-face, mirror-aeons (the plan lists 19; this review ran 5).
- A listening verdict (CHK-B1) and Bailey's feel judgment of the rigs (CHK-B2).
- A written prep and accessibility walk (prep and onboarding categories).
- Live verification of the exact artifact (the candidate is not deployed).

## Encounters through the real flow

- **demo-seymour-flux-win**: victory. demo=1, simulated Xbox pad plus keyboard, 2560x1440, seed 7: title, Start, 2-card picker, A, battle in 3 s with no prep or scene, victory in 55 turns, results, A, picker cursor on Bahamut. Evidence demo-full-pad-xbox/seymour-flux-win.
- **demo-ffx2-bahamut-win**: victory. Same session, seed 56, victory in 42 turns, results, A, picker cursor back on Seymour Flux.
- **demo-seymour-flux-lose-retry**: defeat, retry reached battle. PS-family pad. Defeat at 14 turns, A = RETRY goes straight to battle on the next demo seed (10).
- **demo-ffx2-bahamut-lose-retry**: defeat, retry reached battle. Switch-family pad. X-2 BATTLE flipped to ACTIVE by real input. Defeat at 23 turns, retry straight to battle (seed 56, the only seed). run.json labels the fight undecided because the route read the screen before results; the results text says Defeat.
- **demo-reset-attract-title-visualstyle-keyboard**: pass. Home brush does nothing, Home held 2.4 s reloads to the title with demo on, saved chapters cleared, settings kept (PR-0509); Back+Start 2.2 s also resets. Attract starts at 64.6 s, plays Seymour then Bahamut, writes no storage key, swallows the waking press. T and pad Y cycle the title art. VISUAL STYLE CLASSIC by pad, kept after reload, stage visibly differs. Keyboard-only picker flow works; the typed-word door is shut.
- **seymour-flux**: victory (1600x900 three times incl. continuity, 2000x1012); defeat and retry; phone 390x844 touch not completed. Non-demo, real keys, seed 1. Win in 53 turns, loss at 7 turns then retry reaches battle. Phone touch route lost on a harness limit (PR-0483), UNVERIFIED not a product fault.
- **ffx2-bahamut**: victory (1600x900 three times, 2000x1012, 390x844 touch); defeat and retry. Non-demo, real keys, seed 1. Spherechange exercised, win in 60 turns, loss and retry reached battle.
- **isaaru-via-purifico**: victory. Sample non-demo regression chapter, 6.1 minutes, real keys.
- **yunalesca**: defeat (218 turns, retry reached battle). Sample regression. Seed 1 stock route lost; known route limit (PR-0397), no changed file touches Chapter II. UNVERIFIED as a win, not a product finding.

## Issues, ranked (31)

### PR-0478 (major, visual)  The two boss rigs (Seymour Flux, Bahamut): the head-size fix is applied but not independently proven, and a double-body frame remains at idle-to-attack swaps

- Game, chapter, state: both (shared rig plumbing; Seymour Flux is FFX Chapter I, Bahamut is FFX-2 Chapter IV); seymour-flux, ffx2-bahamut; battle, rig pose swaps
- Observed: Two harnesses disagree. With the candidate tree's own harness and pose-measure table (114 subjects), three runs alone on an idle host (confirm-cont, confirm-cont2, confirm-cont3, plus the capture owner's cont2) judge the rig swaps by mesh head: Seymour 126 rig swaps, worst 0.5 percent; Bahamut 107 rig swaps, worst 0.6 percent, CHK-026 PASS on both demo chapters (live r60 under the r27 harness: head 8 and 18 percent, FAIL). That measure is the builder's own (the rig mesh head), so it passes by construction (RUBRIC 6a). The independent evidence is the strips, and the Bahamut idle-to-attack strip (confirm-cont3 jerk-000-bahamut.jpg) still shows one frame at -1 with two half-faded bodies and then an 88.8 px head move, as the builder's own strip docs/screenshots/r61-rigs/ch4-idle-to-attack-fade-strip-A-F-B.jpg does. A third run on the review tree's harness with the review tree's older table (78 subjects) read the same rigs as FAIL (Seymour 24.2 percent, Bahamut 39.1 percent); I treat that run as a configuration error (see PR-0512), not as a product reading, but it shows the verdict depends on which table the harness reads.
- Expected: CHK-026: a figure's head changes by at most 3 percent across a pose swap; CHK-027: a swap reads as one figure (RUBRIC 6a).
- Repro: node critic/runner/lib/route.mjs seymour-flux win --continuity --pose-measure=D:/pyrefly-release55/docs/target/pose-measure.json against the candidate, seed 1, 1600x900, run alone; same for ffx2-bahamut. Strip: critic/rounds/round-28/confirm/confirm-cont3/ffx2-bahamut-win/continuity/strips/jerk-000-bahamut.jpg
- Evidence: critic/rounds/round-28/confirm/confirm-cont/continuity-summary.json, critic/rounds/round-28/confirm/confirm-cont2/continuity-summary.json, critic/rounds/round-28/confirm/confirm-cont3/continuity-summary.json, critic/rounds/round-28/confirm/confirm-cont3/ffx2-bahamut-win/continuity/strips/jerk-000-bahamut.jpg, critic/rounds/round-28/evidence/gaps/cont-a/continuity-summary.json, critic/rounds/round-28/evidence/gaps/cont-b/continuity-summary.json
- Confidence: high that the two harnesses disagree; medium on the residual double-body frame (one strip plus the builder's strip). Requirement: CHK-026, CHK-027, RUBRIC 6a; carried PR-0478 of rounds 26 and 27.
- Smallest fix: Bailey looks at the Bahamut and Seymour idle-to-attack strips and decides for Monday (proposal 1). If the frame is not acceptable: give whole-figure swaps with a large silhouette change a longer or cut-based swap, and keep 40 ms only for near-identical variants.
- Acceptance check: Idle-to-attack strips show no frame with two bodies both above half opacity; the harness run with the candidate table passes CHK-026 and CHK-027 on both demo chapters and a second, independent head measure (silhouette, not the rig mesh) agrees within 3 percent.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature False

### PR-0380 (major, feel)  Pose swaps still jump: party heads and feet at 40 to 48 px in Chapter I, Rikku's dressphase change in Chapter IV, and Mortiorchis dissolving through a see-through frame with a 60 to 68 px shift in some runs

- Game, chapter, state: both (Mortiorchis is FFX Chapter I; Rikku is FFX-2 Chapter IV; the rest is shared); seymour-flux, ffx2-bahamut; battle, pose swaps
- Observed: Candidate tree harness with the candidate table, run alone at 58.7 to 59.8 fps: Chapter I, 4 swap jerks of 40 px or more in each of two confirming runs (worst 47.6 and 47.1 px, Kimahri, Tidus; live r60: 2 over, worst 46.9); Chapter IV, 1 swap jerk over the line (47.9 px, Rikku's feet; live: 3). The capture owner's own run (seed 1, a different 244-swap path) additionally counted 8 Mortiorchis feet jerks of 60.4 to 68.2 px at idle, cast and attack swaps, and the gap pass (seed 7, 2560x1440) counted 5 (44.7 to 64.4 px); the strip jerk-000-mortiorchis.jpg shows the creature dissolving through a mostly transparent frame over about 5 frames while the silhouette moves (idle-to-cast is a 312 px feet shift by design). The two confirming runs (352 swaps each, 43 Mortiorchis swaps) had none, so this is path- or timing-dependent: seen in 2 of 4 candidate runs, 0 in the r27 live run. Rikku's costume change is a one-frame hard cut to a different dress, size and stance (fan; jerk-000-rikku). Snaps per minute are 0.
- Expected: CHK-027: no one-frame jump of 40 px or more at a swap; a swap reads as one figure.
- Repro: Chapter I seed 1 and seed 7 (demo), real keys, 1600x900 and 2560x1440, candidate harness with its pose-measure table; play to Mortiorchis's first cast (about 28 s) and its Full-Life cycles.
- Evidence: critic/rounds/round-28/evidence/seymour-flux-win-cont2/continuity/strips/jerk-000-mortiorchis.jpg, critic/rounds/round-28/evidence/gaps/cont-a/seymour-flux-win-g/continuity/continuity.json, critic/rounds/round-28/confirm/confirm-cont2/continuity-summary.json, critic/rounds/round-28/confirm/confirm-cont3/continuity-summary.json, critic/rounds/round-28/evidence/ffx2-bahamut-win-cont2/continuity/strips/jerk-000-rikku.jpg
- Confidence: medium: the measurement is firm in 2 runs, absent in 2; the cause (the 40 ms whole-figure fade of PR-0478, src/engine/rig/RigFade.ts) is suspected, not traced. Requirement: CHK-027, RUBRIC 6a; carried PR-0380.
- Where: src/engine/rig/RigFade.ts (suspected, not traced)
- Smallest fix: Hold the fade longer, or register the feet, for rig variants whose centroid moves more than about 100 px between poses; make Rikku's dressphase change a short blend with a held size.
- Acceptance check: Three consecutive candidate-table runs on Chapter I report 0 Mortiorchis jerks and no jerk of 40 px or more at a swap; Chapter IV at most 1; worst ghost severity under 0.4.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature False

### PR-0379 (major, feel)  Every pose change on a painted figure is a see-through cross-dissolve: two Kimahris, two Aurons, two Paines for 2 to 4 frames (first-time fan, 75 instances), with a one-frame negative flash on Paine

- Game, chapter, state: both; seymour-flux, ffx2-bahamut, isaaru, yunalesca; battle, any pose swap
- Observed: The fan reads ghost frames in every earlier strip set (ghost-042 Kimahri, ghost-045 Yuna, swap-158 Auron, ghost-271 Paine, jerk-000 Rikku, and a single inverted Paine frame in ghost-257). Measured in the confirming runs: worst ghost severity 0.364 and 0.365 in Chapter I and 0.326 in Chapter IV (below the 0.4 line, 0 swaps over); the capture owner's run reads 0.365 and 0.327. The official continuity run of this review (r28, 349 swaps, only Seymour Flux completed) reads 61 swaps at 0.4 or more (worst 0.468) with a different pose-measure, so the double-image measure is itself not stable between harness runs.
- Expected: CHK-027: double-image frames per swap under the 0.4 severity line; a pose change reads as one figure.
- Repro: Chapter I or IV, real keys, continuity harness; read strips ghost-*.jpg
- Evidence: critic/rounds/round-28/continuity/continuity-summary.json, critic/rounds/round-28/confirm/confirm-cont3/ffx2-bahamut-win/continuity/strips/ghost-194-paine-hurt-idle.jpg, critic/rounds/round-28/evidence/seymour-flux-win-cont2/continuity/strips/ghost-042-kimahri-idle-ready.jpg, critic/rounds/round-28/evidence/ffx2-bahamut-win-cont2/continuity/strips/ghost-257-paine-ready-attack.jpg
- Confidence: high that the dissolve exists; medium on severity (the measure varies run to run). Requirement: CHK-027; carried PR-0379 (raised to major by the fan lens in round 26).
- Smallest fix: Use a hold-then-cut for painted swaps whose overlap is low (the DemoMotion overlap rule), keep the blend only for near-identical paintings.
- Acceptance check: Ghost frames per swap at most 1 above 0.3 severity in three consecutive runs; fan strips show no second body.
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0459 (major, visual)  Painted figures change size across pose swaps (Bailey's "characters change size across poses"): not re-measured validly on the candidate for Yunalesca and Leblanc, and carried open

- Game, chapter, state: both; yunalesca (FFX), ffx2-leblanc (FFX-2), plus the demo chapters' painted party
- Observed: On the candidate table the demo chapters' painted heads judge 0 swaps over tolerance (Seymour 176 registered, Bahamut 284 registered). Yunalesca and Leblanc were run only by the gap pass on the review tree's stale table (78 subjects against the candidate's 114): FAIL with 708 and 454 swaps over tolerance (32.6 and 37.6 percent), which I do not accept as a reading of the candidate (PR-0512) and do not reuse as a pass either. Live r60 and the r55 candidate failed the same four chapters. The first-time fan lists size jumps (Kimahri shrinking, Auron hunching at critical, Yuna swelling, Paine shrinking) from the runs made without the candidate table.
- Expected: CHK-026: at most 3 percent head change and 2 px feet change across a swap on registered figures.
- Repro: critic/runner/lib/continuity.mjs with --pose-measure=D:/pyrefly-release55/docs/target/pose-measure.json on yunalesca and ffx2-leblanc at 1600x900.
- Evidence: critic/rounds/round-28/evidence/gaps/cont-c/continuity-summary.json, critic/rounds/round-28/evidence/gaps/cont-d/continuity-summary.json, critic/rounds/round-28/static/pose-census.json
- Confidence: high that it is open; unknown how far it has moved. Requirement: CHK-026; carried PR-0459.
- Smallest fix: Rerun the two chapters with the candidate table before the deploy; if still over, the registration values for Kimahri, Auron, Yuna and Paine (FFX only per figure) need the next pose batch.
- Acceptance check: continuity-summary.json lists Yunalesca and Leblanc as run with the candidate table and CHK-026 PASS.
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0504 (major, audio)  Demo (?demo=1) wins play no music on the results screen: the victory cue is started and then stopped by the battle screen's exit

- Game, chapter, state: both (Chapter I victory-ffx, Chapter IV the quiet pause cue); demo Seymour Flux and demo Bahamut, results after a win
- Observed: The AudioManager snapshot at the results screen reads playing=null, music.current=null, fading empty on both demo wins, although held earlier listed victory-ffx (Seymour) and pause (Bahamut). Two independent runs (the audio auditor and the gap pass at 250 ms for 7 s) agree, and the confirmer reproduced it on the Seymour demo win and traced it: BattleScreenFlow.showResults (about line 522) starts the cue before the swap on the assumption that the post scene has already replaced the battle screen; demo defaults skip the post scene, so the swap runs BattleScreen.exit(), whose audio.stopMusic(0.6) (BattleScreen.ts:1013) kills it. Defeat avoids this because its cue starts after the swap. Non-demo wins show the cue. A booth visitor wins and hears silence.
- Expected: The results screen of a win loops the chapter's results cue (resultsMusic.ts), in demo mode as everywhere.
- Repro: ?demo=1, simulated pad, A on Seymour Flux (seed 7) or Bahamut (seed 56), win, read audioDebug when results is up.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/audio-debug.jsonl, critic/rounds/round-28/evidence/gaps/g-demo-win/audio-debug.jsonl, critic/rounds/round-28/evidence/gaps/g6/g6.json, critic/rounds/round-28/confirm/confirm-audio.mjs, critic/rounds/round-28/evidence/seymour-flux-win/audio-debug.jsonl
- Confidence: high that the cue is gone (three runs); medium-high on the cause (traced by reading, reproduced once in a browser). Nobody listened.. Requirement: CHK-001 / CHK-023: the right cue at each real moment; resultsMusic.ts contract.
- Where: src/app/screens/BattleScreenFlow.ts showResults; src/app/screens/BattleScreen.ts exit() line 1013
- Smallest fix: In showResults, start the victory cue after the swap when the post scene was skipped (opts.skipCutscenes); or have BattleScreen.exit not stop music when results is its successor.
- Acceptance check: Demo win of each fight: results snapshot shows playing victory-ffx (Chapter I) and pause (Chapter IV) for 5 s; defeat and non-demo wins unchanged; a unit test in tests/unit/results-music.test.ts.
- Ship tags: introducedByCandidate True, regressionVsLive unknown, inNewFeature True

### PR-0481 (major, delivery)  Demo battle start: 12 to 14 s from the picker A press to the first command, with frames of 0.8 to 1.0 s (PR-0481, raised from minor on the measurement)

- Game, chapter, state: both; demo Seymour Flux and demo Bahamut, 2560x1440
- Observed: Idle machine: Chapter I 12.9 s cold and 12.2 s warm, Chapter IV 14.1 s and 13.0 s from A to the first command menu; the screen reads battle after 1.3 to 3.9 s, then about 4 s of idle phase and the boss name plate. In the first 5 s 7 to 13 frames exceed 100 ms (worst 0.82 to 1.0 s) and only 57 to 121 frames are drawn. Run-wide max frame time 305 and 351 ms (r27 live: 153 and 137). The in-game stall work (GpuSettle, probe moved behind prep) is not visibly effective here; headless gpu mode, not the booth monitor, and no live baseline for the demo flow.
- Expected: A booth visitor reaches control in a few seconds with steady frames.
- Repro: node critic/rounds/round-28/cap/gaps1.mjs and gaps7.mjs, PYREFLY_BROWSER=gpu, ?demo=1.
- Evidence: critic/rounds/round-28/evidence/gaps/g1/g1.json, critic/rounds/round-28/evidence/gaps/g7/, critic/rounds/round-28/evidence/seymour-flux-win-cont2/continuity/continuity.json
- Confidence: medium (headless GPU, not the booth hardware). Requirement: PR-0481, feel and delivery: dead waiting at battle start.
- Smallest fix: Measure on the booth machine; shorten the demo battle-start moment or warm the stage behind the picker.
- Acceptance check: A press to first menu under 6 s with no frame over 250 ms in the first 5 s, on the booth hardware.
- Ship tags: introducedByCandidate unknown, regressionVsLive unknown, inNewFeature True

### PR-0148 (major, audio)  No numeric owner listening score for the shipped mix (carried, eleventh review)

- Game, chapter, state: both; carried
- Observed: docs/audio/OWNER-VERDICT.md has no scored entry; agents cannot hear. Audio files are unchanged except the loader tweak; technical gates pass (audio/qa.json: no failures). Not re-observed as a change.
- Expected: See round-27.json for the requirement and expected behaviour.
- Repro: See round-27.json
- Evidence: critic/rounds/round-28/audio/qa.json
- Confidence: carried from round 27 (status unchanged, not re-tested here). Requirement: carried.
- Smallest fix: As in round-27.json
- Acceptance check: As in round-27.json
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0099 (major, audio)  Eleven chapters still play borrowed or stand-in scene beds or battle cues (carried)

- Game, chapter, state: both; carried
- Observed: Unchanged since round 27: no new cue shipped in this candidate. Not re-observed as a change.
- Expected: See round-27.json for the requirement and expected behaviour.
- Repro: See round-27.json
- Evidence: critic/rounds/round-28/audio/qa.json
- Confidence: carried from round 27 (status unchanged, not re-tested here). Requirement: carried.
- Smallest fix: As in round-27.json
- Acceptance check: As in round-27.json
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0295 (major, interface)  Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried)

- Game, chapter, state: both; carried
- Observed: Not re-observed this round (non-demo prep captured at 1600x900 only). Not re-observed as a change.
- Expected: See round-27.json for the requirement and expected behaviour.
- Repro: See round-27.json
- Evidence: critic/rounds/round-28/evidence/seymour-flux-win/04-prep.png
- Confidence: carried from round 27 (status unchanged, not re-tested here). Requirement: carried.
- Smallest fix: As in round-27.json
- Acceptance check: As in round-27.json
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0461 (major, coverage)  Chapters and typed-word doors that no real-key flow reaches (carried class)

- Game, chapter, state: both; carried
- Observed: This round sampled Yunalesca and Isaaru only for the non-demo set; 16 of the 19 planned chapters have no flow on this candidate. Not re-observed as a change.
- Expected: See round-27.json for the requirement and expected behaviour.
- Repro: See round-27.json
- Evidence: critic/rounds/round-28/plan.json
- Confidence: carried from round 27 (status unchanged, not re-tested here). Requirement: carried.
- Smallest fix: As in round-27.json
- Acceptance check: As in round-27.json
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0460 (major, combat)  Chapter III possession links 3 to 6 draw inert greyed Summon rows (carried, FFX only, UNVERIFIED on this build)

- Game, chapter, state: ffx; carried
- Observed: Not re-run in a browser; files unchanged since r55. Not re-observed as a change.
- Expected: See round-27.json for the requirement and expected behaviour.
- Repro: See round-27.json
- Evidence: critic/rounds/round-28/plan.json
- Confidence: carried from round 27 (status unchanged, not re-tested here). Requirement: carried.
- Smallest fix: As in round-27.json
- Acceptance check: As in round-27.json
- Ship tags: introducedByCandidate False, regressionVsLive False, inNewFeature False

### PR-0487 (minor, onboarding)  Auron's reworded first-run tip "He strikes first" is chapter-agnostic: true at the Chapter I first menu in 75 of 100 seeds, false at the first menu of several FFX chapters

- Game, chapter, state: ffx; seymour-flux (mostly right); evrae-airship, seymour-natus, seymour-omnis, sin-fins-core, mirror-aeons, yunalesca (wrong at the first menu)
- Observed: src/ui/coach/coachCopy.ts:265 now reads "He strikes first. Weather it, then hit back." It shows once, at the first command menu of the first FFX battle, whichever chapter. Engine, shipped line: an enemy acts before the first menu in 75 of 100 Chapter I seeds (first turn is an enemy's in 177 of 200, 88.5 percent); Braska 37/40; Anima, Yojimbo, Via Purifico, Sin Face 40/40; Yunalesca 13/40; Evrae, Natus, Omnis, Sin Fins core and Mirror Aeons 0/40, where the party opens and the old line was the true one. Whether a first-time player can reach those chapters first depends on the board, which was not exercised.
- Expected: A tip that is true at the menu it appears at, or keyed to the chapter.
- Repro: Engine bench critic/rounds/round-28/combat/ffx.bench.test.ts (IDS=<chapter>, STRATS=intended, N=40).
- Evidence: critic/rounds/round-28/combat/ffx-others.json, critic/rounds/round-28/combat/c1-intended.json, critic/rounds/round-28/combat/first-out.json
- Confidence: medium. Requirement: Encounter authenticity; CHK-020/CHK-021.
- Where: src/ui/coach/coachCopy.ts:265
- Smallest fix: Reword to hold either way, or key by chapter (one string in coachCopy.ts).
- Acceptance check: In every FFX chapter the tip is true in all 40 seeds or not shown.

### PR-0479 (minor, visual)  Seymour Flux's hair crest touches or is cut by the top edge in mid-fight, and he rises off the frame on Lance of Atrophy (7 captures; carried, re-observed at 2560x1440 and in the attract reel)

- Game, chapter, state: ffx; seymour-flux
- Observed: The crest is cropped by about half in the 2560x1440 mid-fight frame; the same at 1600x900 and 2000x1012; the Lance of Atrophy lunge loses his head and shoulders off the top (seq-transition-into-battle f05, seq-action-playing f08 and f09, attract f05).
- Expected: Crest clear of the top edge in idle, hurt and attack.
- Repro: ?demo=1 at 2560x1440, three commands, screenshot.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/seymour-flux-win/23-midfight.png, critic/rounds/round-28/crops/sey-crest.png
- Confidence: high. Requirement: CHK-013 framing.
- Smallest fix: Lower Seymour's stage anchor or the Chapter I framing by 4 to 6 percent of frame height.
- Acceptance check: Crest at least 10 px inside the top edge at three sizes.

### PR-0421 (minor, visual)  Chapter IV backdrop plate ends in a hard vertical edge about 130 px (5 percent) short of the right edge at 2560x1440 (carried, re-observed)

- Game, chapter, state: ffx2; ffx2-bahamut
- Observed: Luminance falls from 28 to 14 over about 40 px at x of about 2430 in every Bahamut frame and the attract reel; Chapter I is full-bleed.
- Expected: Plate fills the frame or fades into the vignette.
- Repro: ?demo=1 at 2560x1440, pick Bahamut, any battle frame.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/ffx2-bahamut-win/23-midfight.png, critic/rounds/round-28/crops/bah-right-edge.png
- Confidence: high. Requirement: CHK-013.
- Smallest fix: Extend or mirror the plate to the frame width for wide aspects.
- Acceptance check: No 30 px column darker than the vignette by more than 8 levels between x 2300 and 2560.

### PR-0486 (minor, visual)  Kimahri is mostly hidden behind Tidus at the Chapter I first menu and mid-fight (carried, re-observed)

- Game, chapter, state: ffx; seymour-flux
- Observed: Only Kimahri's head and shoulders show at the 2560x1440 first menu; nearly covered at 2000x1012; a ghost overlap at 1600x900.
- Expected: At least two thirds of his idle area visible.
- Repro: Chapter I first menu or any Tidus attack.
- Evidence: critic/rounds/round-28/evidence/demo-style/visual-style/90-hd2d-first-menu.png, critic/rounds/round-28/evidence/seymour-flux-win-s2000/23-midfight.png
- Confidence: high. Requirement: CHK-014.
- Smallest fix: Offset Kimahri's party slot about 0.25 body widths left and back.
- Acceptance check: Visible area at least two thirds at three sizes.

### PR-0509 (minor, prep)  The booth reset keeps the previous visitor's settings (volume, X-2 BATTLE ACTIVE, VISUAL STYLE CLASSIC)

- Game, chapter, state: both; demo reset
- Observed: run.json resetKey.settingsAfter shows settings kept and saved chapters cleared; the captures flipped VISUAL STYLE to CLASSIC and X-2 BATTLE to ACTIVE and the style survived the reload. A visitor who sets volume to 0 leaves it for the next one, and the reset, the only recovery, does not undo it. Source reading plus stored values, not a played case.
- Expected: A reset hands the next visitor the demo's default state.
- Repro: Demo: set a setting, hold Home 1.5 s, read settings.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/run.json
- Confidence: medium. Requirement: Booth plan (decision 169c reads "return to the title").
- Where: src/app/demo/demoReset.ts
- Smallest fix: A question for Bailey (proposal 4); if yes, the reset restores the demo defaults.
- Acceptance check: After a reset the settings equal the demo defaults.

### PR-0505 (minor, visual)  Demo picker: the Bahamut card is mostly black plate with only the dragon's head, next to a bright Seymour card, and no approved tile exists for the picker, QR plate, reset ring or attract reel (hard rule 9)

- Game, chapter, state: both (the Chapter IV card FFX-2); demo picker, 2560x1440
- Observed: The Chapter IV card reads unlit or unfinished beside the Chapter I card. Bailey's picks for these demo surfaces are words (r61-flow.md); targets.json has no tile for them, so the target gate counts them as waiting.
- Expected: Both cards show a lit full-height boss; Bailey approves the surface from a faked screenshot.
- Repro: ?demo=1, title, Start, screenshot the picker.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/seymour-flux-win/03-picker.png, critic/rounds/round-28/evidence/demo-full-pad-xbox/ffx2-bahamut-win/34-picker-after.png
- Confidence: medium (a taste call). Requirement: AGENTS.md hard rule 9.
- Smallest fix: Show Bailey two framings of the Bahamut card as a faked screenshot (proposal 3).
- Acceptance check: Bailey picks; the pick is saved as a tile.

### PR-0494 (minor, prep)  Demo fights take 5 to 7.5 minutes by the scripted advisor line, longer than the "2 to 3 minute" booth claim

- Game, chapter, state: both; demo Seymour Flux and Bahamut
- Observed: Seymour seed 7: 55 turns, 454 s; Bahamut seed 56: 42 turns, 302 s (results show 5:35 and 8:05). The route presses with 90 ms delays and menu waits, so a person may be faster; unproven either way.
- Expected: The booth script's time claim matches play.
- Repro: critic/rounds/round-28/cap/demo.mjs plan.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/run.json
- Confidence: low to medium. Requirement: Booth plan (decision 169).
- Smallest fix: Say 5 to 8 minutes in the booth script unless a human run is shorter.
- Acceptance check: Two human timings recorded.

### PR-0483 (minor, harness)  Phone Chapter I touch route cannot aim an ally (UNVERIFIED, no product fault found)

- Game, chapter, state: ffx; seymour-flux 390x844 touch
- Observed: The route lost at turn 35 because its reticle resolver could not map the advisor's ally target "Yuna" (unresolved) and aimed Seymour; a separate probe shows Haste's ally reticles at 74 x 94 px, tappable.
- Expected: A real-input win.
- Repro: route.mjs seymour-flux win --size=390x844 --touch
- Evidence: critic/rounds/round-28/evidence/seymour-flux-win-phone-touch/run.json, critic/rounds/round-28/evidence/esc-probe/heal-2-target-step.png
- Confidence: high that it is a harness limit. Requirement: CHK-022.
- Smallest fix: Harness: resolve ally targets for touch.
- Acceptance check: A phone Chapter I win by touch.

### PR-0473 (minor, feel)  A knock-out has no fall and a revive has no rise (carried)

- Game, chapter, state: both; seymour-flux, Kimahri
- Observed: Kimahri's KO is an idle dissolving to a heap and the revive a heap dissolving to a ghost of the standing pose, with nothing in between; unchanged.
- Expected: A short fall and rise over at least 6 frames.
- Repro: Chapter I seed 1, Mega Phoenix on the first menu.
- Evidence: critic/rounds/round-28/evidence/seymour-flux-win-cont2/continuity/strips/swap-003-kimahri-idle-ko.jpg
- Confidence: high. Requirement: CHK-027 reaction readability.
- Smallest fix: A hold frame plus a translate (needs Bailey's yes).
- Acceptance check: KO and revive strips show movement across at least 6 frames.

### PR-0502 (minor, interface)  Turn-intro portrait wipe covers the left 42 percent of the screen at the first menu with the command list already live; "LS HIDE" overlaps Tidus's plate; the caption is under FLEE / ESCAPE (PR-0502, PR-0366 re-observed at 1440p)

- Game, chapter, state: both; Chapter I and IV first menu, demo 2560x1440
- Observed: In both first-menu captures the plate covers two party members and the caption ("YOUR TURN") is cut by the rows or gold on cream. How long it stays is not measured: the capture of a Normal Attack showed no such plate and a steady frame of the same moment has none.
- Expected: Caption legible; no actor hidden while the menu is live.
- Repro: ?demo=1, A on either card, first-menu frame.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/seymour-flux-win/10-first-menu.png, critic/rounds/round-28/evidence/demo-full-pad-xbox/ffx2-bahamut-win/10-first-menu.png, critic/rounds/round-28/evidence/gaps/g1/
- Confidence: medium (duration unmeasured). Requirement: CHK-008, CHK-003.
- Smallest fix: Time the plate; keep the caption on a dark plate on the portrait side or shorten the wipe once the menu is live.
- Acceptance check: Caption readable with no row over it at 2560x1440 and 1600x900.

### PR-0480 (minor, delivery)  Run-wide max frame time rose to 305 ms (Chapter I) and 351 ms (Chapter IV) from 153 and 137 ms (carried; Chapter IV 601 slow frames, 2.6 percent)

- Game, chapter, state: both; seymour-flux, ffx2-bahamut
- Observed: Probe maxDtMs 305.2 with 165 slow frames and 351 with 601. The start-of-battle record shows where part of it sits (PR-0481).
- Expected: No frame over 250 ms in steady play.
- Repro: Continuity harness runs.
- Evidence: critic/rounds/round-28/evidence/seymour-flux-win-cont2/continuity/continuity.json, critic/rounds/round-28/evidence/ffx2-bahamut-win-cont2/continuity/continuity.json
- Confidence: medium. Requirement: Stability and performance.
- Smallest fix: Separate the start-of-battle frames from steady play, then trace.
- Acceptance check: No steady-play frame over 250 ms.

### PR-0512 (minor, harness)  Critic tooling: the gap pass's continuity runs read the review tree's pose-measure.json (78 subjects) instead of the candidate's (114) and failed CHK-026 on four chapters

- Game, chapter, state: both; critic harness
- Observed: cont-a to cont-d record poseMeasure D:/pyrefly-r39-int/docs/target/pose-measure.json (sha f0f895...) against the candidate's f25cbb.... The same chapters pass the rig head check with the candidate table. The harness should take the table that ships with the candidate by default, and the review tree's harness lacks the rig head measure of the candidate's harness, so the two trees also judge differently.
- Expected: The harness reads the candidate's table and records which.
- Repro: critic/runner/lib/continuity.mjs without --pose-measure on a candidate.
- Evidence: critic/rounds/round-28/evidence/gaps/cont-a/seymour-flux-win-g/continuity/continuity.json
- Confidence: high. Requirement: CHK-026 evidence rules.
- Smallest fix: Default --pose-measure to <candidate>/docs/target/pose-measure.json and print its subject count; merge the two harness trees.
- Acceptance check: The recorded table path is the candidate's.

### PR-0397 (minor, harness)  Yunalesca seed 1 stock route lost at 218 turns (carried route limit; UNVERIFIED as a win, not a product finding)

- Game, chapter, state: ffx; yunalesca
- Observed: Lost four times in r26 and won once in r27 on the same route; no changed file touches Chapter II.
- Expected: A real-input win.
- Repro: route.mjs yunalesca win --budget=2700000
- Evidence: critic/rounds/round-28/evidence/yunalesca-win/run.json
- Confidence: high that it is a route limit. Requirement: CHK-022.
- Smallest fix: Route improvement.
- Acceptance check: Two consecutive wins.

### PR-0506 (polish, interface)  With a pad, the victory results screen shows the same action twice: "A CONTINUE" at the bottom and "A CONFIRM" on the panel button

- Game, chapter, state: both; demo results after a win, 2560x1440
- Observed: Both prompts are bound to the same button; the non-demo keyboard frames at 1600x900 show only CONFIRM.
- Expected: One prompt per action.
- Repro: ?demo=1, Xbox pad, win either fight.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/seymour-flux-win/31-results.png, critic/rounds/round-28/evidence/demo-full-pad-xbox/ffx2-bahamut-win/31-results.png
- Confidence: high that it is drawn twice; cause suspected. Requirement: Interface: no duplicate prompts.
- Smallest fix: Draw the pad hint only where the panel has no button.
- Acceptance check: Exactly one confirm prompt with pad, keyboard and touch.

### PR-0507 (polish, visual)  Bahamut's wings carry a bright cyan rim, a torn right-wing edge and loose grey shards (carried class); the new rig lighting is barely perceptible

- Game, chapter, state: ffx2; ffx2-bahamut
- Observed: The shapes are pixel-identical to the r27 live frame; the builder's before, stripped and after pairs differ by a faint contrast change, so "Bahamut is lit by the room" is hard to see. Approved art: judged as rendering only.
- Expected: Rim at most 2 px, no detached fragment; lighting visible if it is a headline claim.
- Repro: ?demo=1 at 2560x1440, crop x 1500 to 2000, y 500 to 1000.
- Evidence: critic/rounds/round-28/crops/bah-body.png, critic/rounds/round-28/crops/bah-r27-vs-r28-midfight.png
- Confidence: medium (cause suspected: rig mesh margin). Requirement: CHK-013.
- Smallest fix: Trim the transparent mesh margin; raise the lighting gain on wing and robe pieces a step. Do not repaint.
- Acceptance check: 1:1 wing crop shows no fragment.

### PR-0508 (polish, onboarding)  The VISUAL STYLE row appears in every chapter's OPTIONS but only changes Chapters I and IV, and says nothing about what HD-2D or CLASSIC mean

- Game, chapter, state: both (the look is Ch I FFX and Ch IV FFX-2); pause OPTIONS
- Observed: By code the look applies only in Chapters I and IV (PauseScreenPanels.ts line 83; SaveData.ts line 192); the effect elsewhere is code reading, not a capture.
- Expected: The row states its scope.
- Repro: Pause, OPTIONS, flip the row in any other chapter.
- Evidence: critic/rounds/round-28/evidence/demo-style/visual-style/92-options-style-flipped.png
- Confidence: medium. Requirement: Onboarding: usable settings.
- Smallest fix: One help line under the row.
- Acceptance check: The row states its scope in Chapter II and Chapter I.

### PR-0511 (polish, interface)  The PRESENTATION row reads "THE ECHO - B"; the "B" (chapter-select music take) cannot be read without opening the page

- Game, chapter, state: both; pause OPTIONS
- Observed: Value comes from saveFrontend.ts presentationSummary.
- Expected: A value naming both halves.
- Repro: Pause, OPTIONS.
- Evidence: critic/rounds/round-28/evidence/demo-full-pad-xbox/seymour-flux-win/14b-pause-options.png
- Confidence: medium. Requirement: Readable values.
- Smallest fix: Print "THE ECHO / MUSIC B".
- Acceptance check: Row text names both settings.

### PR-0456 (polish, interface)  Carried and re-observed: the FFX-2 target ring overprints the intent card (PR-0456); the Chapter I intent chip reads ZOMBIE 99 percent on the demo board and 50 percent on the default board (PR-0488)

- Game, chapter, state: ffx2 (PR-0456); ffx (PR-0488); Chapter IV target step; Chapter I intent
- Observed: Ring and nodes cross "ACTS NEXT"; the zombie odds differ by seed for the same attack and the chip does not say whose odds.
- Expected: Ring clear of text; chip says whose odds.
- Repro: Chapter IV ATTACK target step; Chapter I R3.
- Evidence: critic/rounds/round-28/evidence/ffx2-bahamut-win/16-target-single.png, critic/rounds/round-28/evidence/demo-full-pad-xbox/seymour-flux-win/12-enemy-slab-pad.png
- Confidence: high that both are drawn. Requirement: CHK-008.
- Smallest fix: As listed under PR-0456 and PR-0488.
- Acceptance check: As before.

### PR-0485 (polish, narrative)  A question for Bailey (carried): Yuna's smiling wedge on the silent Chapter IV results, Rikku's wide grin on "...Yunie.", and the Chapter I and II results quip "...Okay. Next one."

- Game, chapter, state: ffx2 (portraits); ffx (the quip); ffx2-bahamut, seymour-flux
- Observed: Chapter IV results are calmer by design (cue pause, no quip, Rikku's calm tile); the wedge and the dialogue plate are not. Bailey's pick covered the tile only.
- Expected: The right tone for each game.
- Repro: Chapter IV non-demo win, Confirm.
- Evidence: critic/rounds/round-28/evidence/ffx2-bahamut-win-cont2/33-after-confirm-scene.png
- Confidence: medium. Requirement: Narrative tone.
- Smallest fix: Ask Bailey whether the wedge and plate use sombre variants.
- Acceptance check: Bailey's decision recorded.

### PR-0503 (polish, process)  Prep and onboarding have no number again (ninth review): there is no written prep or accessibility walk, and the demo skips prep by design

- Game, chapter, state: both; review process
- Observed: No frame of the pause ACCESSIBILITY tab, TEXT SIZE, REDUCE FLASHES, COLOUR VISION or CONTROLS remapping in this capture; the non-demo prep screens were captured but not judged as a prep walk.
- Expected: A number for each category.
- Repro: n/a
- Evidence: critic/rounds/round-28/plan.json
- Confidence: high. Requirement: RUBRIC 6.
- Smallest fix: Schedule a written prep and accessibility walk.
- Acceptance check: Both categories scored.

## What stands between this build and acceptance

This is a candidate review, so nothing here is a milestone claim. For the milestone: a verified number for audio, onboarding, prep and delivery; every category at 9.0 or more (encounter, visual, feel, narrative and interface are below it); no open major (11 are open); CHK-026 passed on an independent head measure for the chapters in the plan and CHK-027 passed; the demo surfaces matched to approved tiles; Bailey's five judgments recorded; and the exact artifact verified live.

## What changed since round 27 (live r60)

- The candidate adds the demo mode, the full pad, the Echo default title with title-art cycling, VISUAL STYLE, the Escape/B card absorb, and the rig normal pieces and 40 ms fade. The engines, data and story are unchanged.
- Rig heads: PR-0478 moved from a measured 8 and 18 percent FAIL to a measured 0.5 and 0.6 percent PASS on the candidate's own mesh measure; the strips still show one two-body frame and, in some runs, a Mortiorchis dissolve that jerks. Chapter I swap jerks of 40 px or more: 2 to 4; Chapter IV: 3 to 1; snaps per minute stay 0.
- New defects are all inside the new demo mode or its surfaces (PR-0504, PR-0481, PR-0505, PR-0506, PR-0509) plus the Auron tip (PR-0487); no carried defect is fixed by evidence.
- Scores: combat 9.5 held, encounter 8.9 held (the auditor proposed 9.4; I did not accept a gain with the engine unchanged), visual 8.5 to 8.4, feel 8.3 to 8.2, narrative 8.7 held, interface 8.2 held; the other four stay unscored.

## Proposals (nothing here is built without Bailey's yes)

- Demo rigs for Monday (needs Bailey's yes): look at critic/rounds/round-28/confirm/confirm-cont3/ffx2-bahamut-win/continuity/strips/jerk-000-bahamut.jpg and evidence/seymour-flux-win-cont2/continuity/strips/jerk-000-mortiorchis.jpg and decide whether the rigs stay on; if not, run the demo with the painted figures (both games, one switch each).
- Start the victory cue after the screen swap in showResults when the post scene is skipped (a fix for PR-0504; both games). Preview: audio snapshot at results reads playing victory-ffx.
- Show Bailey two framings of the demo picker's Bahamut card (a lit full-height dragon and the current crop) as a faked screenshot before any change (hard rule 9; PR-0505).
- Question for Bailey (PR-0509): should the booth reset also restore the demo's default settings (volume, X-2 BATTLE, VISUAL STYLE)? Fit: both games, demo only.
- Warm the boss stage behind the picker and measure the A-to-first-menu time on the booth monitor before Monday (PR-0481; both games).
- Key the Auron first-turn tip by chapter, or word it so it is true either way (PR-0487; FFX only).
- Run the continuity harness for Yunalesca and Leblanc with the candidate's pose-measure table, and merge the two harness trees so the rig head measure and the table come from one place (PR-0512; both games, tooling).

## Server hygiene

The chief started no server and no browser. The capture owner, harness and confirmer servers (ports 5523 and 5871, pid 59352) were stopped by PID; a check of ports 5400 to 5990 at 15:36 local time found no listener.

Scratch and evidence: critic/rounds/round-28/ (confirm/ holds the three confirming continuity runs copied from D:/pyrefly-release55/critic/rounds/round-28; build-report.py and build-md.py regenerate this report).
