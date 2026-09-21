# Critic round 06 — deep review of the Build A.2 candidate (main c71cd82)

```text
Build / artifact / target version: main c71cd8223adf2a4ee546d8298c3e8f6d141620d8 · bundle index-BscpFDXN.js · artifact d7138a1ece5caf5a… (735 files) · targets a086d8bf39f1b76c…
Review: deep
Deployment: NOT APPLICABLE — the candidate is not deployed under its own sha
Changed area: FAIL — every planned repair holds; the same change introduced PR-0052
Milestone: not assessed
Quality: PROVISIONAL (no verified score for audio). Nine categories scored: combat 8.8, encounter 8.9, visual 7.6, feel 8.0, narrative 7.6, interface 7.3, onboarding 4.6, prep 8.0, delivery 8.9
Targets: required 46 / matched 27 / failing 9 / unverified 10 / waiting on a decision 8
Top issues: PR-0052 (a Berserked no-Attack turn passes in silence, 21 of 28 such turns in ch.5 link 2), PR-0006 (the advisor repeats the chapter line; a guided ch.4 route ran 9:05 without resolving), PR-0001 (the HUD outside the guide column is still under 14 px, 3.47 px on a phone), PR-0020 (the dialogue card draws every portrait larger than its slot), PR-0058 (ten FFX-2 speakers have no face, including Lenne at the climax)
Coverage: tested — the whole changed area, all five chapters on real input, two FFX-2 victories with their aftermath, frame time on named hardware; reused — every unchanged FFX mechanic, boss values, staging and facing, under a written dependency argument; not tested — Firefox / Safari / Edge / gamepad / physical device, load time, any listening or human feel judgment, CHK-024
Next required review and why: a LIVE check of fd0ae96 (this candidate's product code, already deployed under the owner override with live, focused and deep all pending), then a paper preflight for the FFX-2 Active ATB candidate before it is built
Elapsed review time / repeated work avoided: 148 minutes (round 05 took 380) / 24 of 44 issue records and every unchanged system carried instead of re-measured
```

## Score

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
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-012 is FAIL
  - 26 critical or major issue(s) remain open
  - 9 required target(s) failing
  - 10 required target(s) unverified
  - 8 required target(s) waiting
  - only 27 of 46 required targets matched
  - human judgment not recorded: An audio listening score out of ten (CHK-B1)
  - human judgment not recorded: A human feel assessment (CHK-B2)
  - human judgment not recorded: Options rounds for the phone layout, the move advisor, the enemy next-move panel and the defeat screen
  - human judgment not recorded: A decision on the ten portrait-less FFX-2 speakers (Lenne, Nooj, Leblanc, Logos, Ormi, Brother, Buddy, Shinra, Baralai, Gippal)
  - human judgment not recorded: Bailey yes on docs/PRODUCT-BRIEF.md
  - human judgment not recorded: Braska's headdress repaint
  - live verification of the exact artifact is NOT APPLICABLE
report: valid evidence
```

`tools/critic-score.mjs` computes this, not the reviewer. The score is provisional because audio has no verified number, and a provisional assessment is never averaged away and never scored zero (RUBRIC §6).

## The one thing to know about this build

The live build `fd0ae96` is this candidate plus exactly one commit, and that commit touches only `tools/deploy-pages.mjs`: `git diff --stat c71cd82 fd0ae96 -- src/` is **empty**, and both produce bundle `index-BscpFDXN.js`. So every product finding below applies unchanged to what is live right now. This report is the deep evidence `critic/pending/fd0ae96.json` is still owed — but it cannot settle that marker, because the marker names `fd0ae96` and the report names `c71cd82`. The live obligation (CHK-017 at the real URL) is separate and still owed by someone.

## The ten categories

| Category | Weight | Score | One line |
|---|---:|---:|---|
| `combat` | 20 | 8.8 | PR-0045 (round 05's critical) repaired and re-proved three ways; held by the new PR-0052 in the same branch. |
| `encounter` | 10 | 8.9 | FFX-2 intended line 120/120 across six links; held by two chapter 1 majors open for three rounds. |
| `visual` | 15 | 7.6 | 102/102 approved files intact, seven new portraits rendering, Paine painted everywhere; no staging or cropping defect repaired. |
| `feel` | 10 | 8.0 | First measured frame time: 60 fps, p99 16.8 ms, 0 frames over 33 ms; held by a 6-10 s wait to the first menu and PR-0006's dead time. |
| `narrative` | 10 | 7.6 | The aftermath was reached for the first time in six rounds; held by a faceless Lenne at the climax and no FFX aftermath at all. |
| `audio` | 10 | **UNVERIFIED** | Technical health and phase routing verified; nobody has listened (AGENTS.md rule 13), so no number. |
| `interface` | 10 | 7.3 | The guide chip and column are repaired and PR-0055 was refuted; the advisor and the type floor are untouched. |
| `onboarding` | 5 | 4.6 | The feature is repaired and ships switched off, so the player meets a game with no help at all. |
| `prep` | 5 | 8.0 | Unchanged and carried; the ledger and the return paths work in both games. |
| `delivery` | 5 | 8.9 | 4455/4455 tests green, 735 files decode-checked, 0 console errors and 0 404s across 108 captures; the live artifact is unverified for this sha. |

### `combat` — 8.8

Combat-encounter auditor's number, adopted. npx tsc --noEmit exit 0; full suite 176 files, 4455/4455 green in 25.2 s (round 05: 162 / 4290). PR-0045, round 05's critical, is REPAIRED and re-proved three independent ways rather than taken from the builder's tests: (1) the menu invariant — all 14 shipped dresspheres, Berserked and clean, yield at least one row, and the three no-Attack spheres yield exactly one row labelled "Wait"; (2) the engine invariant — across all 14 dresspheres with every party girl forced Berserked and 400 decisions drained each, nextDecision NEVER returned player-input for a Berserked actor; (3) the reachable case — chapter 5 link 2 through the real BattlePresenter on the intended line, seeds 1-48, 48 W / 0 L / 0 unresolved, 0 zero-row stalls, against round 05's 2 stalls in 24 seeds. Complete changed-value audit (the change set touches exactly two engine files): BERSERK_MULTIPLIER 1.25 correctly not FFX's 1.5; leg-berserk chance 75 and duration 133 = 70.49 s reproducing §2.8's 70.5 s to the decimal; hasAttack === false for exactly black-mage, songstress and white-mage; Berserk correctly absent from canAct and correctly closing abilities, spherechange and items. CHK-021 traced both ways: the intended ABSENCE in FFX is verified (src/battle/ffx/engine.ts:240 already resolved a Berserked FFX actor in-engine and src/battle/ffx/commands.ts:92 always returns the Attack row, so FFX could never produce zero rows). CHK-023: the branch is reached by ordinary play — 28 Berserked party turns over 921 in 48 real presenter runs. Held at 8.8, not higher, by PR-0052, which lives in this engine and is 21 of those 28 turns, plus PR-0054 and the unconsolidated PR-0053. Unchanged FFX mechanics reused from round 05 under a dependency argument the auditor verified itself.

### `encounter` — 8.9

Combat-encounter auditor's number, adopted. Win rates RE-MEASURED on this candidate because the ATB decision loop changed: the intended line through the real presenter wins 20/20 on every FFX-2 link — ch4 bahamut (median 76 turns), ch5 L1 tail (45), L2 leg (40), L3 body (39), L4 head (131, range 61-197), L5 shuyin (44). 120/120, no regression, and the encounter consequence of PR-0045 (a chapter 5 link that could not be finished on 2 of 24 seeds) is gone. The Vegnagun Leg's §5.2 26-step table is transcribed exactly (LEG_TABLE matches steps 1-24 position for position; LEG_LOOP_FROM 20 reproduces "25 goto 21"), and its three-way Action1 fires all three branches in real play — 139 Leg turns over 24 seeds: leg-break 27, leg-berserk 19, leg-slow 15, vita-brevis 6, statuses landing on all three girls. Counter-play for the changed mechanic is sourced and reachable: every shipped remover of Berserk is §2.8's Esuna / Remedy list, and both chapter parties carry Remedy in the reachable inventory (8 in the Bevelle build, 15 in the Farplane build). Boss HP, immunities and rewards reused from round 05 under the verified dependency argument, with the Leg's own record re-read directly (hp 18,220, level 38, gravity immune). Held at 8.9 by two carried majors that are both in chapter 1 and both now open for three consecutive reviews: PR-0008 (re-measured on this candidate at 26 wins in 40 seeds) and PR-0007. Chapter 5's length is now sized: a median of about 299 turns across the five links.

### `visual` — 7.6

Visual-targets auditor's number, adopted. PROTECTED ART INTACT, re-verified on THIS candidate: sha256 over every file named by the 32 approved sets in docs/target/approved-hashes.json against dist-gate gives 102 match, 0 different, 0 missing — round 05's 94 plus the eight speaker portraits whose sets did not exist at 740ab21. No approved painting was regenerated, re-judged or proposed for replacement. Improved this round: PR-0014's monogram half is repaired (Paine is a painted, recognisable face on prep, pause, the battle HUD chip and results); seven of the eight new portraits are captured rendering for their own speakers at naturalWidth 832 (yuna-x2 and rikku-x2 and paine in chapter 4, braska and young-auron in chapter 2, paine and braska in chapter 5, shuyin and the fayth boy in chapter 5's post-victory scenes), and a pixel signature confirms the shipped chapter 4 card is the approved rikku-x2 (meanAbsDiff 59.9) and not FFX Rikku (78.5); PR-0050's collision is gone (overlaps [] on both FFX-2 boss plates at both desktop sizes); the FFX pause screen remains the strongest composition in the build and now carries no onboarding rows, which is the intended dark behaviour. Against that, nothing in the seven open staging, cropping and composition defects was repaired, and PR-0020 now damages owner-approved art: the dialogue slot is a fixed 315x333 box and almost every portrait is drawn 350-500 px wide above it, with Jecht (PR-0056) framed off his face entirely. New this round: ten recurring FFX-2 speakers have no portrait and the empty slot renders as a grey rectangle at chapter 5's climax (PR-0058), and at phone width the dialogue card is crushed under its own hint bar (PR-0057). 7.4 to 7.6: a real delivery inside the same anchor band.

### `feel` — 8.0

Scored by the chief critic from this round's own motion and timing evidence; round 05 had none and was UNVERIFIED, so this is a first number rather than a movement. Frame pacing is excellent and measured on named hardware: 1,919 frames over 31.98 s at mean 16.67 ms, median 16.7, p95 16.8, p99 16.8, max 16.8, 0 frames over 33 ms, 0 over 100 ms, approximately 60 fps, captured on the chapter 5 head link (three enemies) under ANGLE / RTX 5070 Ti / D3D11. Three motion clips were recorded with real keyboard input (ffx, ffx2 and ffx2 auto) with per-event phase and event-queue state at 250 ms resolution, showing command-menu input accepted at 1 ms and the auto path advancing to play:action-start within 260 ms. Screen transitions are fast in every chapter: title to chapter select 252-290 ms, chapter select to prep 1-76 ms, prep to scene 62-152 ms, skip release to battle 1-657 ms; the cutscene hold-Enter skip, Escape to pause over a scene and in battle, resume, retry and return to chapter select all work on real keys in all five chapters. Held at 8.0 by two measured costs: the 6.3 to 9.9 second wait from the battle screen to the first interactive command menu in every chapter (PR-0061), and the dead-time consequence of PR-0006 (a guided chapter 4 route that ran 9 minutes 5 seconds without resolving against 2 minutes 22 for the blind route). Not covered this round and disclosed: camera composition and effect readability were not separately audited, and CHK-B2 (a human feel assessment) is not recorded.

### `narrative` — 7.6

Scored by the chief critic; round 05 was UNVERIFIED because defect-finding is not coverage. This round the aftermath was REACHED for the first time in six rounds and can therefore be judged: chapter 4 played sixteen aftermath lines through to "BEVELLE UNDERGROUND - LIMBO - CLEARED" and back to chapter select; chapter 5 played thirty-four, through Shuyin's recognition of Lenne, the Lenne release with the writing bible's marked [ICONIC QUOTE] "This moment's enough.", and the Farplane coda, to a "Victory" results card and back. Pre-battle scripts are strong and in each game's register, and the speaker plates carry faction lines (Guardian, Maester, High Summoner, Sphere Hunter, Youth League, Unsent, Songstress). Held at 7.6 by four things a player meets: the climax of chapter 5 is delivered by a speaker with no face (PR-0058 — Lenne over five consecutive lines, Nooj, Leblanc, Logos), the authored banter bank is still not implemented in either game (PR-0021, second consecutive round), mid-battle beats still hard-code speakers who are not in the active formation (PR-0037), and no FFX chapter has ever reached its aftermath (PR-0043), so Jecht's death scene, the aeon grief beats, Yu Yevon's arrival and Yunalesca's thinning remain source text rather than something a player has seen. The two FFX-2 aftermaths were reached with real keys for entry and every transition but with the battle turns taken by the debug auto-battle, which under RUBRIC §5 proves reachability of the scene and not the player's ability to win it.

### `audio` — UNVERIFIED

No number, and it is not averaged away. Nothing in 740ab21..c71cd82 touches src/audio, public/audio or tools/audio, so there is no changed audio to audit. What this round did establish is technical and routing health, not beauty: audioDebug on the running candidate reports ready true, sampleRate 48000, prerendered manifest true with 21 cues, sprite decoded true, volumes master 0.8 / music 0.7 / sfx 0.9, muted false, and the correct cue is playing at each phase — chapter 3 requested and played title, chapter-select, scene-dreams-end, boss-jecht, boss-yu-yevon and victory-ffx; chapter 5 requested scene-farplane, boss-vegnagun, boss-shuyin and victory-ffx2, each fetched as a decoding mp3 with 0 404s. That is CHK-001's technical and routing half. The category also requires thematic coherence, phase transitions judged by ear, mix and Bailey's listening assessment (CHK-B1), and AGENTS.md rule 13 is explicit that agents cannot hear; Bailey has not judged docs/audio/audition.html. UNVERIFIED is the honest state, as in round 05. One carried polish defect stands: PR-0039, 3 of 21 shipped cues have no tempo map.

### `interface` — 7.3

Scored by the chief critic; round 05 was 7.0. Gains that hold on this candidate: the collapsed G GUIDE chip keeps a measured, per-game anchor and covers nothing on the FFX-2 boss plate (FFX inlineTop 33 px, FFX-2 inlineTop 77 px, overlaps [] at 1600x900 and 2000x1012 in both chapters, confirmed in the frame below Bahamut's nameplate, HP bar and SCAN label), and the guide column clears the legibility floor at 14.25 effective px at 1600x900 and 16.02 at 2000x1012 with 0 strings under 14 and 0 clipped. One suspected defect was REFUTED rather than carried: the advisor card does track the acting girl — 24 consecutive turns in one probe and 18 distinct decisions in another, both with visibility asserted before each read, give mismatchCount 0, and the named move always belongs to the open menu's own skillset. Against that, the interface's two worst standing problems are untouched and one is now measured in consequence: PR-0006, the advisor repeating the chapter line on all 301 samples of a route that ran 9 minutes without resolving, and PR-0001, the HUD outside the guide column still under 14 px and 3.47 px at phone width. PR-0012 (the FFX-2 menu still never says what the highlighted row does, where FFX does) keeps CHK-020 at FAIL, and PR-0010, PR-0011, PR-0013, PR-0018 and PR-0019 are unchanged.

### `onboarding` — 4.6

Scored on what ships, which is the rule, and it is a deliberate step backwards. ONBOARDING_LIVE = false in this candidate: a fresh profile sees no briefing, no first-use lines, no onboarding rows in pause and no BRIEFING chip on the title, verified on a fresh profile at 1600x900 and 390x844. So the player meets the same game round 04 scored 4.2 for having no onboarding at all. The four round 05 onboarding repairs are real and were verified with the feature forced on via __pyrefly.setCoaching(true) — PR-0047 (Rikku's dressphere line no longer teaches the opposite of the sourced rule), PR-0048 (the 390x844 briefing no longer prints gold type over Auron's coat), PR-0049 (the permanent opt-out no longer fires on Tab or Q, and the frame's D is honoured: real Tab / Q / Shift / D presses now distinguish skip from permanent opt-out), PR-0051 (the FFX-2 first-use line claims the confirm key) — and every such capture is labelled injected. The decision to go dark is documented and correct on its own terms: the approved briefing line about the FFX-2 clock becomes true only with Active ATB, which Bailey chose on 2026-09-21. But a repaired feature nobody can reach is not onboarding delivered, and the accessibility half is unchanged and now unmitigated: no text size control, no key remapping, no motion or flash accommodation (PR-0032), and no defeat-screen explanation (PR-0033). 4.6 rather than 4.2 because the copy, the state, the option and the veteran migration all exist and are repaired, and the switch is one line. This is not a regression against the live build, which is the same code with the same switch.

### `prep` — 8.0

Carried from round 05's 8.0 under a dependency argument, with one small gain observed and not scored here. Nothing in 740ab21..c71cd82 touches the prep screen, the results ledger, src/ui/common/resultsMath.ts or the reward data. Re-observed on this candidate: the FFX-2 results ledger prints every member with dressphere, ability, AP and EXP (chapter 4 "EXP 1,300 x3 PARTY / AP 15 PER DRESSPHERE / GIL 1,000 / ITEMS Gris Gris Bag", chapter 5 "AP 20 PER DRESSPHERE" with all three MASTERED), results is reached and returns to chapter select on Enter in all five chapters, and Escape from prep returns to chapter select. The gain not scored here is visual and is counted under visual: Paine's painted chip now appears on prep, pause and results. Open and carried: PR-0033 (the defeat screen tells the player nothing about why they lost and has no approved target) and PR-0041 (FFX-2 items unreachable through the command menu for long stretches in the review's harness).

### `delivery` — 8.9

Scored by the chief critic; round 05 was 8.8. The candidate builds and runs clean: npx tsc --noEmit exit 0; 176 test files, 4455/4455 green in 25.2 s (up from round 05's 162 / 4290). Artifact identity is complete and frozen: 735 shipped files hashed and decode-checked, decodeChecked true, audioUnverified 0, problems []. Across 108 indexed captures in five chapters at three sizes, 0 console errors, 0 404s and 0 HTML-for-image responses; the gap pass adds a further 57 victory frames, 24 advisor frames and the motion and timing runs with the same clean result. Flows complete: all five chapters run title to chapter select to prep to pre-battle scene to battle to outcome to results and back on real keys, and two of them now run through victory, the post-battle script and back to chapter select. Frame time is measured for the first time on named hardware: 60 fps, p99 16.8 ms, 0 frames over 33 ms. Held below 9 by three things: the exact live artifact is not verified for this sha (CHK-017 NOT APPLICABLE, and the live build fd0ae96 still owes its own live check), load time on named hardware is still not measured, and no Firefox, Safari, Edge, gamepad or physical-device evidence exists. The round's own evidence-integrity failure (PR-0059, CHK-016) is a reviewer-harness defect, not a product one, and is scored nowhere.

## The approved-target gate

**Required 46 · matched 27 · failing 9 · unverified 10 · waiting on a decision 8.**

Round 05's required set of 38 (every approved tile of docs/target/targets.json this release must deliver: the presentation, scenes, cast, pause and "how a fight plays" groups, excluding the twelve polish ideas, the three unbuilt chapters, the audio-direction tile and the phone group) plus the eight speaker-portrait tiles Bailey approved on 2026-09-21, which did not exist at 740ab21. 46 = 27 + 9 + 10. The per-tile board was NOT re-walked this round; the counts are round 05's, moved only by what this round measured, and the arithmetic is stated so it can be audited. Matched 20 + 7 (the seven new portrait tiles captured rendering for their own speakers). Failing 8 + Yu Yevon (approved, shipped, no producible acceptance case — PR-0060) + Onboarding C2, which round 05 matched and which this candidate no longer delivers because the feature ships dark, minus the battle-HUD tile whose chip collision (PR-0050) is repaired and measured clear. Unverified 10, carried unchanged. Waiting on a decision 8, carried, and counted separately from the required set as in round 05.

**Protected art.** INTACT and re-verified on this candidate rather than carried: sha256 over every file named by the 32 approved sets in docs/target/approved-hashes.json against dist-gate gives 102 match, 0 different, 0 missing, 0 changed since last seen. No approved painting was regenerated, re-judged or proposed for replacement.

New this round:

- **Speaker portraits (eight tiles, Bailey 2026-09-21)** — SEVEN MATCHED, ONE FAILING. yuna-x2, rikku-x2, paine, braska, young-auron, shuyin and fayth-boy are each captured rendering for their own speaker at naturalWidth 832, byte-identical to the approved files, and a pixel signature confirms the chapter 4 card is the approved rikku-x2 (meanAbsDiff 59.9) over FFX Rikku (78.5). Yu Yevon fails: no shipped script gives him a line, so the tile's own acceptance case cannot be produced from play (PR-0060). Note that all seven render inside a container that overhangs its slot (PR-0020), which is a separate presentation tile, not a fault in the approved art.
- **Onboarding C1, C2, C3** — ALL FAILING in this candidate, because the feature ships switched off. C1 was already failing in round 05; C2 was matched and is no longer delivered; C3 likewise. The tiles are not withdrawn and the copy is repaired — this is a delivery state, not a design change.
- **Battle HUD (FFX-2), collapsed guide chip** — MATCHED. The chip keeps a measured per-game anchor and overlaps nothing on the boss plate at 1600x900 or 2000x1012 in either FFX-2 chapter.

## Coverage matrix

**Tested**

- All five chapters entered, played and exited on real keyboard input on the production candidate, at 1600x900, 2000x1012 and 390x844, PYREFLY_BROWSER=gpu, 108 indexed captures with 0 console errors and 0 404s.
- Two FFX-2 victories through the post-battle script, results and return to chapter select — the first aftermath evidence in six rounds (entry and transitions on real keys; battle turns by the shipped intended strategy).
- The whole Berserk change set: all 14 dresspheres, 400 drained decisions each, 48 real-presenter runs of the reachable chapter 5 link 2, and a complete changed-value audit against research/ffx2-combat-core.md §2.2, §2.8 and §3.4-3.6 and research/ffx2-vegnagun-shuyin.md §5.2.
- FFX-2 win rates re-measured on this candidate for all six links, 20 seeds each, 120/120.
- The strategy-guide chip anchor and the guide column type, measured per game at three sizes.
- The eight new portraits: bytes against approved-hashes.json (102/102 approved files), and seven of eight captured rendering for their own speakers.
- The dialogue card's slot geometry, measured line by line across 48 chapter 1 lines and every chapter 2 line.
- The onboarding dark launch on a fresh profile, and the four onboarding repairs with the feature forced on (labelled injected).
- Frame time on named hardware (1,919 frames, 60 fps, p99 16.8 ms), three motion clips and per-chapter screen-transition timings.
- Audio technical health and phase routing in chapters 3 and 5 through the running candidate.
- The artifact: 735 files hashed and decode-checked, 0 problems.

**Reused, with its reason**

- **Round 05's FFX combat evidence: the 42 exact ICV_BASE / agility lookups across all 19 §1.2 breakpoints and the above-170 clamp, the Haste measurement on the CTB forecast, Slow correctly doing nothing to Yunalesca at immunity 255, and Yunalesca's measured 21-tick cadence.**
  - *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits under public/art/portraits, docs, critic files and critic/runner/release.js. Nothing under src/battle/ffx, src/battle/common, src/data/**, research/**, src/engine or src/audio moved; the shipped approved art is hash-identical on this candidate (102/102); and no open defect relates to the reused area.
- **Round 05's FFX-2 chain and tick constants: CHAIN_BASE 1.4, CHAIN_STEP 0.05, CHAIN_MAX 99, TICK_RATE_BASE 3000 and the 2 s / 3 s chain windows.**
  - *Dependency argument:* src/battle/ffx2/constants.ts and chain.ts are untouched between 740ab21 and c71cd82.
- **Round 05's boss HP, immunity and reward values for all five chapters against their research citations.**
  - *Dependency argument:* src/data/** and research/** are byte-identical between the two commits. The vegnagun-leg record was re-read directly anyway, because that is the boss the change touches.
- **Round 05's enemy-visibility and staging pass (CHK-011) and its facing audit (CHK-014).**
  - *Dependency argument:* No scene staging, camera, enemy placement, presenter, sprite manifest, rig or facing field changed, and the shipped art is hash-identical on this candidate.
- **Round 05's records for every carried issue that this round did not re-measure (PR-0002, PR-0005, PR-0007, PR-0010, PR-0011, PR-0013, PR-0015, PR-0016, PR-0017, PR-0018, PR-0019, PR-0022, PR-0026 to PR-0029, PR-0031 to PR-0037, PR-0039, PR-0041, PR-0044).**
  - *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits under public/art/portraits, docs, critic files and critic/runner/release.js. Nothing under src/battle/ffx, src/battle/common, src/data/**, research/**, src/engine or src/audio moved; the shipped approved art is hash-identical on this candidate (102/102); and no open defect relates to the reused area. Each carried record states its own argument in the issue list and is labelled carried forward.

**Deliberately not reused**

- FFX-2 win rates: re-measured rather than carried, because the ATB decision loop itself changed.
- PR-0008: re-measured on this candidate (26 wins in 40 seeds) rather than carried, because it is the stalled issue driving RUBRIC §8's method check.
- The approved-art hashes: re-verified on this candidate's dist-gate rather than carried, because eight new approved files entered the set.

**Not tested**

- Firefox, Safari, Edge; gamepad; a physical touch device.
- 4:3, 21:9, 1440p and 4K shapes.
- Load time on named hardware and network, and cold-cache first paint.
- Camera composition and effect readability as their own study (the feel score says so).
- Any audio listening judgment (CHK-B1) and any human feel judgment (CHK-B2).
- Save and settings survival across an actual upgrade (CHK-024) — not re-run this round.
- A cold-start walkthrough with only visible instructions: not applicable in the usual sense, because the onboarding is switched off, but the newcomer's experience of a game with no help at all was not separately studied.

**Required and not tested**

- CHK-017: the exact live artifact. NOT APPLICABLE for this sha, but the live build fd0ae96 carries this candidate's product code and its live obligation is still owed. Someone must run the live check against https://baileypillon.github.io/pyrefly-reprise/ before that marker can be settled.
- CHK-024 (saves and settings survive an actual upgrade): not run this round. policy.json still names save-schema as the one class needing deep evidence BEFORE a deploy, so this is the check most worth adding to the next round even though nothing in this change set touches SaveData.ts.
- The player-facing half of PR-0052: no in-game capture of a Berserked no-Attack turn exists, because Berserk landed on nobody in 20 in-game seeds (PR-0062). The mechanic is proved through the real presenter; what the player sees at that moment is not.
- PR-0053: an issue the combat auditor raised whose record did not reach consolidation. Tracked as an open polish issue so it is not lost, and explicitly not written up from guesswork.

## Checks

| Check | Result | Mandatory | Mode | Min | Why |
|---|---|---|---|---:|---|
| CHK-015 | **PASS** | yes | manual | 22 | Debug hooks were used only to force the dark-launched onboarding on and to take the battle turns in the two victory routes; every such capture is labelled injected or noted, and the shipped dark behaviour and the real-input routes were judged separately. |
| CHK-016 | **FAIL** | yes | manual | 9 | Three recorded claims are contradicted by the round's own data files, and a fourth harness field was mis-read without publishing a false claim. See PR-0059. The assertion machinery itself is sound — lib.mjs assertScreen() throws ASSERT-FAIL rather than shooting the wrong screen, no failed wait occurred, and all 108 index entries carry {file, game, chapter, state, size, input, injected, asserted, mode, ts} — but th… |
| CHK-017 | **NOT APPLICABLE** | yes | n/a | 3 | The candidate c71cd82 is not deployed under its own sha, so there is no live URL to verify. Artifact identity was frozen for the later live check: critic/rounds/round-06/evidence/artifact-manifest-candidate.json, 735 files, artifactHash d7138a1ece5caf5a0d37ba459672cbbe0e87efe60de0726aec75b6f40b85aaad. The live build fd0ae96 carries the same product code and a different artifact hash; its live obligation is still p… |
| CHK-019 | **PASS** | no | automated | 3 | Passed on: critic/rounds/round-06/evidence/artifact-manifest-candidate.json (decodeChecked true, audioUnverified 0, problems []) |
| CHK-001 | **PASS** | no | automated | 6 | The technical and routing half only: files decode, the right cue plays at each phase change, volumes and mute state are sane. Whether it sounds right is CHK-B1 and is not recorded — agents cannot hear (AGENTS.md rule 13). |
| CHK-B1 | **UNVERIFIED** | no | human | 0 | Bailey has not judged docs/audio/audition.html. No agent claims to have listened; the audio category stays UNVERIFIED because of this. |
| CHK-B2 | **UNVERIFIED** | no | human | 0 | No human feel assessment is recorded for this candidate. The feel score rests on measured frame time, motion clips and transition timings, and says so. |
| CHK-020 | **FAIL** | yes | manual | 8 | Both shared-plumbing repairs in this candidate PASS on their own: the guide chip and the guide type were measured in both games with a per-game anchor (FFX inlineTop 33 px, FFX-2 77 px, zero overlaps in both), and the correct game-specific absence was confirmed (the zero-row hazard is structurally impossible in FFX, so no matching FFX change was made and the exception is explicit in the code and in docs/handoff/bu… |
| CHK-021 | **PASS** | yes | automated | 9 | Both halves verified: the PRESENCE (FFX-2 nextDecision resolves a Berserked party turn itself, measured over all 14 dresspheres) and the intended ABSENCE (FFX needed nothing and got nothing). The sourced numbers are correctly split by game: x1.25 in FFX-2 against x1.5 in FFX. The handoff states the game case with its sources. |
| CHK-022 | **PASS** | yes | manual + automated | 12 | Every transition reaches its real destination. The milestone-grade form of this check is NOT met and is recorded as PR-0043: the two victories used real keys for entry and every screen transition but took the battle turns with the debug auto-battle, and no FFX chapter has reached a victory at all. |
| CHK-023 | **PASS** | no | automated | 8 | 48 real BattlePresenter runs of the shipped chapter 5 link 2 produced 921 party turns of which 28 were Berserked, all resolved by the engine without a player decision. Chapter 4 produced 0, which is correct rather than a gap: Bahamut is immune to Berserk and casts none. |
| CHK-004 | **PASS** | no | manual | 11 | The card names a legal action belonging to the acting girl's own open menu on every decision: Yuna Shell in White Magic, Paine Magic Break, Rikku Darkness. This check was suspected FAIL earlier in the round on 301 identical samples; that reading was of a hidden, auto-collapsed .mad__card retaining stale DOM (offsetParent null) and is not reported as a defect. See the refuted list. |
| CHK-005 | **FAIL** | no | automated + manual | 11 | Advice does not stay useful on a board that has changed. The ranked branch is sound — over a whole chapter 4 battle buildAdvisorView gave three different, legal, actor-appropriate lines and recommended Shell on zero turns where every living active already had it — but the chapter-line branch re-recommends an active party buff regardless, and following it cost 9 minutes 5 seconds without resolving the encounter. PR… |
| CHK-003 | **FAIL** | no | automated | 7 | The guide column now clears the floor in both games at both desktop sizes, which was this candidate's scope and which passes. The rest of the HUD does not: the advisor stat chips render at roughly 10 px, and at 390x844 the stage scale of 0.609 puts the whole interface in a 3.47 to 5.48 px band. PR-0001. |
| CHK-008 | **FAIL** | no | manual | 8 | Half repaired. The collapsed guide chip is measured against the painted boss plate and clears it (overlaps [] at both desktop sizes in both FFX-2 chapters; PR-0050 repaired). But PR-0002 is untouched — the FFX command menu still covers a party member head to feet — and the dialogue card's portrait slot is smaller than the image it holds in almost every line of every chapter, so the new approved portraits overhang … |
| CHK-012 | **FAIL** | yes | manual | 18 | Seven of the eight new owner-picked portraits are proved rendering for their own speakers at naturalWidth 832, byte-identical to the approved files, and Paine is painted on four HUD surfaces — that half passes, and the gap pass closed the six subjects that were unverified mid-round. The check still FAILS on two counts: the eighth tile, Yu Yevon, has no acceptance case play can produce because no shipped script giv… |
| CHK-013 | **PASS** | no | manual | 6 | Every visual judgment was made on a frame from the running production candidate at actual display size against docs/handoff/presentation-ink-and-gold.md and the tile properties in docs/target/targets.json, not on a source asset. Approved paintings were judged on how they render; none was proposed for replacement. |
| CHK-011 | **PASS** | no | manual | 3 | Carried forward: both Yu Pagodas visible and tagged A and B in chapter 3, every staged actor recognisable and correctly scaled. Desktop sizes only; PR-0017 (one of chapter 1's two enemies entirely off-screen at 390x844) stays open and is disclosed. |
| CHK-014 | **UNVERIFIED** | no | manual | 3 | 16 of 51 manifest subjects carry no facing value (PR-0044), so the numeric cross-check cannot run for them. Nothing in this change set adds or corrects a facing. The new speaker portraits are intentional viewer-facing poses, to which the battle-facing rules do not apply. |
| CHK-018 | **PASS** | no | automated | 2 | Passed on: 0 404s and 0 HTML-for-image responses across 108 indexed captures plus the gap pass's 57 victory, 24 advisor, motion, timing and phone runs |
| CHK-024 | **UNVERIFIED** | no | n/a | 1 | The save schema and the veteran migration were last exercised in round 05 on 740ab21. This candidate does not change src/app/SaveData.ts, but no upgrade-from-an-older-save run was made this round, so the check is unknown rather than passed. It matters more than usual now: policy.json release.deepBeforeDeployClasses still holds save-schema as the one class needing deep evidence BEFORE a deploy. |

## Repaired and verified this round

- **PR-0045** (critical, fixed) — A Berserked girl wearing White Mage, Black Mage or Songstress is offered no command at all. Repaired in da83511 (FFX-2 only) and re-proved three independent ways rather than accepted from the builder's tests: all 14 shipped dresspheres yield at least one row Berserked and clean, with the three no-Attack spheres yielding exactly one row labelled "Wait"; across all 14 dresspheres with every party girl forced Berserked and 400 decisions drained each, nextDecision never returned player-input for a Berserked actor (0 occurrences); and chapter 5 link 2 through the real BattlePresenter on the intended line, seeds 1-48, gives 48 W / 0 L / 0 unresolved and 0 zero-row stalls, against round 05's 2 stalls in 24 seeds. The shipped bundle's own 901-event runtime log confirms the menu side: 301 player decisions, row count never below 3, zeroRow 0. A defensive guard in FFX2BattleHud logs and passes instead of awaiting an unanswerable menu. The related PR-0052 is a NEW and separate defect in the same branch, not a failure of this repair.
- **PR-0050** (major, fixed) — The collapsed strategy-guide toggle is drawn on top of the FFX-2 boss nameplate, HP bar and SCAN label. Repaired in 2c7b147 (both games, per-game measured anchor). Confirmed on the candidate: chip rect y=193 h=26 at 1600x900 and y=216 h=30 at 2000x1012 with overlaps [] on both FFX-2 boss plates, and the frame read confirms it sits clear below Bahamut's nameplate, HP bar and SCAN label. FFX inlineTop 33 px, FFX-2 inlineTop 77 px — the anchor is measured per game rather than shared.
- **PR-0001 (guide column only)** (major, partly fixed) — The strategy guide column renders below the 14 px legibility floor. Repaired in 2c7b147 for the guide column in both games and verified: minimum 14.25 effective px at 1600x900 and 16.02 at 2000x1012, 0 strings under 14, 0 clipped. The rest of PR-0001 is outside this change and stays open at major.
- **PR-0014 (monogram half)** (major, partly fixed) — Paine is a painted face in battle and a letter monogram on results. Repaired by the new paine.png and its measured face crop. Paine is a painted, recognisable face on party prep (left list and bottom bar), the pause party bar, the battle HUD chip and results; ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits. The crop half (chips cutting the top of the head) stays open at major.
- **PR-0047** (major, fixed (not shipped)) — Rikku's dressphere first-use line teaches the opposite of the project's own sourced rule. Repaired in 98aa12f and verified with the feature forced on via __pyrefly.setCoaching(true); every such capture is labelled injected. Nobody sees it in this candidate: ONBOARDING_LIVE = false.
- **PR-0048** (major, fixed (not shipped)) — At 390x844 the briefing prints its text straight over Auron's painting. Repaired in 98aa12f and verified forced-on at 390x844. Not shipped: the feature is dark.
- **PR-0049** (major, fixed (not shipped)) — The briefing's permanent opt-out fires on Tab and Q as well as Shift, and the approved frame names D. Repaired in 98aa12f and verified with real Tab / Q / Shift / D presses distinguishing skip from permanent opt-out (critic/rounds/round-06/evidence/coach/probe-q-vs-d.json). Not shipped: the feature is dark.
- **PR-0051** (polish, fixed (not shipped)) — The FFX-2 first-use line does not claim the confirm key, so the Enter that dismisses it falls through. Repaired in 98aa12f and verified forced-on (critic/rounds/round-06/evidence/coach/probe-0051.json). Not shipped: the feature is dark.
- **PR-0046** (major, not shipped in this candidate) — The build tells the player the FFX-2 clock is running while it is standing still. The briefing claim does not ship, because the briefing does not ship. The live ACTIVE badge on the FFX-2 HUD predates this release line, is on the live build, is disclosed, and is resolved by Active ATB in the next candidate — which is exactly why the onboarding went dark rather than shipping a line that is not yet true. Not closed: it returns with the Active ATB candidate and must be re-checked there.

## Refuted — not carried, not scored

- **The move-advisor card does not refresh per actor: it was read 301 times in a row as Yuna's Shell while Paine and Rikku were taking the turns (raised mid-round as PR-0055, major, interface, chapter 4)** → REFUTED, twice, independently, and withdrawn rather than carried. Two probes that assert visibility (rect, display, visibility, opacity, offsetParent) before each read find no defect: 24 consecutive player turns on seed 3 covering all three girls give mismatchCount 0, with the engine's open decision (presenter.pendingMenu.actorId) equal to the rendered .mad__actor on every turn and the first .mad__label always that actor's own move (Yuna Shell, Paine Magic Break, Rikku Darkness); a second probe over 18 distinct decisions agrees, and adv2-3.png shows the card headed PAINE while Paine's menu is open. The original 301 identical records were a harness artefact: the panel had auto-collapsed to the "N BEST MOVE" chip and the harness was reading a hidden .mad__card retaining stale DOM, then falling back to a blind Enter when it could not find the path in the open menu. src/ui/ffx2/FFX2BattleHud.ts:736-740 calls advisor.showDecision on every chooseCommand and MoveAdvisor.showDecision re-renders unconditionally. The separate, real defect the same route exposed is PR-0006, which is not this.
- **legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", so the Leg's Berserk never fires** → REFUTED and discarded before it was filed. Re-running bench/z06-legai proves the unprefixed ids do fire: 19 leg-berserk casts over 24 seeds. There is no id-resolution bug. Recorded so the hypothesis is not chased again.
- **The mid-encounter music never changes: audioDebug reports music null at every phase change in chapters 3 and 5** → REFUTED — a reviewer-harness field-name error, not a product defect. gap-audio.mjs reads d.music ?? d.currentTrack ?? d.track; the debug API returns playing. The same records' audioRaw shows playing:"boss-jecht" with the manifest loaded, 21 cues and the sprite decoded, and the per-chapter file lists show exactly the right cues fetched at the right phases. Recorded as the fourth instance in PR-0059.

## Encounters

- **seymour-flux** (ffx) — real flow completed, outcome *defeat*. Two independent real-input routes. Blind route: title > chapter select > prep (Esc back to chapter select and re-entered) > pre-battle scene (Enter advance, Esc pause over the scene, hold-Enter skip) > battle (advisor N, intent E/I, guide G, pause Esc and resume, targeting) > defeat at 9 engine turns / 0:42 > results > Enter > party prep. Guided route following the advisor's own GUIDE'S PICK by keyboard: defeat at 10 turns / 0:49, results > chapter select reached. 0 console errors, 0 404s. No victory has ever been reached in this chapter (PR-0008: the intended line wins 26 of 40 seeds).
- **yunalesca** (ffx) — real flow completed, outcome *defeat*. title > chapter select > prep > pre-battle scene (Braska, Jecht and young Auron all render with the new portraits, captured line by line by the gap pass) > battle with advisor, intent, guide and pause exercised > defeat at 34 turns / 1:14 > results > party prep. Guide column minimum effective type 14.25 px, 0 strings under 14. 0 console errors, 0 404s.
- **braskas-final-aeon** (ffx) — real flow completed, outcome *defeat*. Full route to defeat at 40 turns / 1:26, results reached and returned. Scene speaker Jecht renders but is framed off his face (PR-0056). Guide minimum 14.25 px, 0 under 14. 0 console errors, 0 404s. The seven-link chain was also ridden to the Yu Yevon arrival by the audio probe, which confirms boss-jecht, boss-yu-yevon and victory-ffx all play at their phase changes.
- **ffx2-bahamut** (ffx2) — real flow completed, outcome *defeat and victory*. Blind real-input route: defeat at 66 turns / 2:22, results > party prep. A separate guided keyboard route ran 301 player turns / 61 engine turns over 9:05 without resolving (PR-0006) and produced the 901-event engine log: Yuna in White Mage correctly shows no Attack row, the menu never fell below 3 rows and never opened empty. A third route reached VICTORY with real keys for entry and every transition and the battle turns taken by the shipped intended strategy: sixteen aftermath lines, results 1:36, back to chapter select. Paine's painted chip present on prep, pause, battle HUD and results. 0 console errors, 0 404s.
- **ffx2-vegnagun-shuyin** (ffx2) — real flow completed, outcome *defeat and victory*. Full real-input route to defeat at 30 turns / 1:15, results > party prep. A victory route (real keys for entry and transitions, shipped intended strategy for the turns) played all five links, then thirty-four aftermath lines through Shuyin's recognition of Lenne and the Farplane coda, results 6:06 "Victory", back to chapter select — the first time this aftermath has been reached in six rounds, and the only evidence that shuyin.png and fayth-boy.png render. Pause and results carry painted Yuna / Rikku / Paine chips; the collapsed guide chip is measured clear of the boss plate. Berserk did not occur in any of 20 in-game seeds (PR-0062), so the Berserked-turn behaviour is proved by the seeded presenter bench rather than by a browser capture. 0 console errors, 0 404s.

## Ranked issues (44: 26 major, 17 polish, 1 suggestion; no critical open)

Ranked critical, then major, then polish, then suggestions; within a severity by Bailey's reported problems, frequency, player impact, coverage and effort — never by what most cheaply lifts a decimal (RUBRIC §8). Round 05's critical PR-0045 is closed. IDs are stable across rounds.

### 1. PR-0052 — MAJOR · `combat` · FFX-2

**A Berserked girl on a dressphere with no Attack spends her turn on nothing at all, with no action and no line — 3 of every 4 Berserked turns in Chapter 5 link 2**

- **Chapter / state:** ffx2-vegnagun-shuyin, link 2 (the Vegnagun Leg) · battle, a party girl Berserked while wearing White Mage, Black Mage or Songstress
- **Requirement:** research/ffx2-combat-core.md:491 (§2.8): Berserk means she "can only use the basic Attack command; player loses control". CHK-007: player-facing copy conveys player meaning — whichever way the §2.8 / §3.4-3.6 conflict is settled, the player has to be able to tell why the turn produced nothing.
- **Expected:** The Berserked turn either swings (the §2.8 reading) or passes visibly, naming itself, so a turn that produces no damage is legible.
- **Observed:** src/battle/ffx2/targeting.ts:394-398 berserkCommand returns { kind: "defend", targets: [] } when buildCommands yields no attack row. src/battle/ffx2/execute.ts:149-155 finds no ability for that kind and calls finishAction, which (execute.ts:114-119) emits only action-end plus an atb snapshot and never an action-start — so no ability name, no target and no message reach the presentation layer. Berserk then runs 211,470 ticks (70.49 s), so the same empty turn repeats for over a minute. Measured on the intended line, seeds 1-48, through the real BattlePresenter: 921 party turns, 28 Berserked, 21 of those (75 percent) on a no-Attack dressphere. The confirmer reproduced the figure verbatim and made two corrections that narrow but do not remove the finding: src/ui/ffx2/statusChips.ts:31 does render a BSK chip, so she is visibly Berserked — what is missing is the per-turn line explaining that this turn produced nothing; and src/battle/ffx2/targeting.ts:368-378 already carries the right wording for a player-facing empty menu, a row labelled "Wait" with the help "No command is available; the turn passes."
- **Repro:** npx vitest run --config critic/rounds/round-06/bench/vitest.bench.config.ts critic/rounds/round-06/bench/z06-passes.test.ts — chapter 5 link 2, farplaneBuild, intendedStrategy, seeds 1-48, real BattlePresenter. Prints: party turns 921; Berserked turns 28; of those on a NO-ATTACK dressphere 21; unresolved battles 0.
- **Evidence:** critic/rounds/round-06/bench/out/z06-all.txt; critic/rounds/round-06/bench/z06-passes.test.ts; critic/rounds/round-06/bench/z06-berserk.test.ts (per-dressphere table: songstress / white-mage / black-mage resolve to defend); src/battle/ffx2/execute.ts:114-119,149-155; src/battle/ffx2/targeting.ts:368-378,394-398
- **Confidence:** High on the mechanic and the frequency: measured through the real presenter on the candidate's own code and independently reproduced by the confirmer. The player-facing half is partly proved (the BSK chip is rendered; no per-turn line is emitted) and was not reached in play — 20 in-game seeds of chapter 5 link 2 landed Berserk on nobody (see PR-0062).
- **Smallest fix:** (a) Emit an action-start for the Berserked pass carrying the "Wait" row's own wording, so the log and the message bar name the turn the way a missed action is named; the vocabulary already exists at targeting.ts:368-378, which makes this cheaper than a new string. (b) Put the source conflict to Bailey rather than guessing: §2.8 says only Attack, §3.4-3.6 say those three dresspheres have no Attack command, and research/ does not settle it. The builder was right not to invent a damage row (AGENTS.md hard rule 6); only berserkCommand changes if the answer is "she swings anyway".
- **Acceptance check:** On a seed where the Leg lands Berserk on Yuna in White Mage, the battle event log contains a named action for that turn and a 1600x900 capture shows the player is told why nothing happened; the round 06 invariants still hold (14/14 dresspheres >= 1 row, 0 player-input decisions while Berserked, 48/48 seeds resolving).
- **Repair attempts so far:** 0

### 2. PR-0006 — MAJOR · `interface` · both (shared advisor plumbing; AGENTS.md rule 14 case: BOTH, and CHK-020)

**The move advisor repeats the chapter's own line whatever the board says: it told the player to recast an already-active Shell on all 13 of Yuna's turns, and the guided fight ran 9 minutes without resolving**

- **Chapter / state:** measured in ffx2-bahamut (ch.4); the same shape measured in seymour-flux (ch.1); round 05 filed the KO/Zombie half in ch.1 · battle, advisor open (N), following GUIDE'S PICK by keyboard
- **Requirement:** CHK-005 (advice stays useful on damaged or resource-starved boards) and RUBRIC §2 ("the advisor offers legal, useful actions"). Bailey's own reported shape of this defect: "im controlling tidus but the advisor is telling me to use poison fang?"
- **Expected:** Once Shell is on every party member with about 165 seconds left, the advisor moves on to the next useful move — Magic Break, which its own guide column calls the strongest opening in the fight, or Darkness, the damage route. A player who follows GUIDE'S PICK every turn should make progress.
- **Observed:** Over one guided real-keyboard route of chapter 4 the card printed the identical row on all 301 samples: "Shell -> the party - GUIDE'S PICK - IN WHITE MAGIC - 10 MP - 100% TO HIT - + SHELL"; distinct picks 1. Yuna cast Shell on every one of her 13 turns while the only Shell that ever landed was the first, at seq 19-21 on engine turn 2 with ticksRemaining 165634 on all three members; the whole 901-event log contains 4 status-add events. The party dealt 4,489 of Bahamut's sourced 8,400 HP in 61 engine turns over 9 minutes 5 seconds and the battle never resolved (endScreen "battle"). The blind route that ignored the advisor resolved the same encounter in 2:22. Chapter 1 shows the same shape: 6 of 6 picks were "Hastega -> the party". The advice is otherwise correct and actor-bound — buildAdvisorView returns Magic Break / Mental Break / Armor Break / Attack for Paine, Darkness for Rikku, Shell > Protect > Cure/Cura for Yuna, and never names Shell on a turn where every living active already has it; the repetition is the chapter-line branch, not the ranked branch.
- **Repro:** node -e over critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json: picks.length 301, distinct 1; battleLog action-start yuna:Shell 13; steps[1].v {screen:"battle", turns:301, ms:545528}. Chapter 1: ch1/supp-win-1600x900.json, six Hastega. Engine-side: npx vitest run --config critic/rounds/round-06/bench/vitest.bench.config.ts critic/rounds/round-06/bench/z06-encounter.test.ts.
- **Evidence:** critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json; critic/rounds/round-06/evidence/ch1/supp-win-1600x900.json; critic/rounds/round-06/evidence/ch4/L-1600x900-guide-open.png; critic/rounds/round-06/bench/out/z06-all.txt; src/engine/tactics/advisor.ts recommendedCommand; src/engine/tactics/ffx2-bahamut.ts
- **Confidence:** High. The repetition and its consequence come from the engine log, not from inference. The actor-binding half that round 06 first suspected is REFUTED (see PR-0055) and is not part of this finding.
- **Smallest fix:** Give the chapter-line branch the same state test the simulated ranking already applies: before recommendedCommand returns the tactic's pick, resolve it on the throwaway copy the advisor already builds and drop it when it changes nothing measurable — a buff whose status is already on every named target, a cure with nothing to cure. One guard in src/engine/tactics/advisor.ts, game-agnostic, and the same short-circuit round 05 traced for the revive branch, so one repair closes both halves.
- **Acceptance check:** Seeded engine test over chapters 1 and 4: run the advisor's own pick for 30 consecutive player turns and assert no suggestion is returned whose simulated resolution produces no status-add, no damage, no healing and no cure. Plus one real-keyboard capture of chapter 4 in which the pick changes away from Shell on Yuna's second turn, and the route reaches an outcome.
- **Note:** Round 05 filed this FFX-only (advisor recommends offence while a member lies KO'd and Zombied). This round widens it to BOTH games with a measured FFX-2 case; one root defect, one ticket.
- **Repair attempts so far:** 0

### 3. PR-0001 — MAJOR · `interface` · both

**Outside the guide column the HUD is still under the 14 px floor, and at phone width the whole interface is a 3-6 px band**

- **Chapter / state:** all five · battle, command menu open, 1600x900 / 2000x1012 / 390x844
- **Requirement:** critic/CHECKS.md CHK-003 (pass bar is zero elements under 14 px); RUBRIC section 6 interface and onboarding. Open since round 03 and unchanged by this build.
- **Expected:** Every string a player must read measures at least 14 effective px (computed font-size times the stage transform scale) at every supported size.
- **Observed:** Half repaired, and the repaired half holds. Inside the guide column: minimum 14.25 effective px at 1600x900 and 16.02 px at 2000x1012, 0 strings under 14, 0 clipped, in both games. Outside it, unchanged: the advisor stat chips still render at roughly 10 px ("IN WHITE MAGIC - 10 MP - 100% TO HIT") and the rest of the HUD is as round 05 measured it. At 390x844 the stage scale is 0.609, so the authored 5.7 grid px land at 3.47 effective px: chapter 1's guide measures 3.47-5.48 px across all six strings, the collapsed chip is a 25x6 px target, chapter 4's guide prints one line, and the HUD is squeezed into a band about a quarter of the viewport height with the party column cut off. strategy-guide.css discloses that 1280x720 is not cleared either (5.7 grid px = 11.4 there); phone is not disclosed in that comment.
- **Repro:** Candidate c71cd82, fresh context per size (390x844 with hasTouch), battle at the first awaiting turn; walk every leaf text node under the HUD and multiply computed font-size by the accumulated transform scale. critic/rounds/round-06/supp.mjs `layout <idx> <w> <h>`.
- **Evidence:** critic/rounds/round-06/evidence/ch1/supp-layout-390x844.json (minEff 3.47, six strings); critic/rounds/round-06/evidence/ch4/supp-layout-390x844.json (minEff 4.88, n 1); critic/rounds/round-06/evidence/ch1/supp-layout-2000x1012.json; critic/rounds/round-06/evidence/ch1..ch5/run.json guideMetrics; critic/rounds/round-06/evidence/ch4/L-390x844-guide-open.png
- **Confidence:** high
- **Smallest fix:** Apply the floor the guide now has to the remaining shared Ink & Gold type tokens (advisor chips, intent labels, CTB name plates, party rows), and treat the phone layout as its own end state rather than a scaled-down desktop stage — the phone HUD is an approved gap awaiting Bailey's options, so it needs a pick before it is built (AGENTS.md rule 9).
- **Acceptance check:** The CHK-003 walk reports zero strings under 14 effective px at 1600x900 and 2000x1012 on every screen, and the phone layout is judged against whichever end state Bailey picks.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* The guide-column half was repaired in 2c7b147 and is verified repaired on this candidate. The remainder depends on shared type tokens and the stage scale, neither of which 740ab21..c71cd82 touches.
- **Repair attempts so far:** 1

### 4. PR-0020 — MAJOR · `visual` · both (shared DialogueBox; AGENTS.md rule 14 case: BOTH, shared plumbing)

**The dialogue card draws every speaker portrait larger than its slot: heads overhang the slab, a grey filler block shows below, and it now damages owner-approved art**

- **Chapter / state:** measured in ch.1, ch.2, ch.4 and ch.5; the card is chapter-independent · battle, a story beat playing, 1600x900
- **Requirement:** CHK-012 (the actual crop in its destination), CHK-014 and RUBRIC section 6 visual - this judges the rendering, not the artwork.
- **Expected:** The portrait fills its slot, cropped to the head, contained by the card frame.
- **Observed:** Systemic, not one portrait. At 1600x900 the slot is a fixed 315x333 box at (96,500) and almost every portrait is drawn above and outside it: Seymour imgRect 421x616 at y=349 (top overhang 151 px, right 121 px), Kimahri 386x564 at y=376 (top 124, left 64), Yuna 364x532 (top 112), Tidus 355x519 (top 111), Lulu 351x513 (top 128), Braska 349x509 (top 128). Only Young Auron (244x357 at y=500) sits inside. In chapter 4 the approved rikku-x2 card runs from about y=495 to y=798 against a slab from y=605 to y=818, overhanging by roughly 110 px, cutting her hair and bandana flat, with a grey filler block below the painting inside the slot and a grey column between the card's pink edge and the painting. The approved paintings themselves are faithful; the damage is entirely in the container.
- **Repro:** Production candidate c71cd82 from D:/pyrefly-release/dist-gate, vite preview, fresh profile, 1600x900, PYREFLY_BROWSER=gpu. Enter each chapter's pre-battle scene and advance line by line with Enter taps, reading .dbox__portrait and the slab rect per line. critic/rounds/round-06/gap-scenes.mjs.
- **Evidence:** critic/rounds/round-06/evidence/gaps/scenes/ch1-1600x900.json (per-line slotRect / imgRect / overhang for 48 lines); critic/rounds/round-06/evidence/gaps/scenes/ch2-1600x900.json; critic/rounds/round-06/evidence/ch4/03-pre-scene.png; critic/rounds/round-06/crops/ch4-dialogue-card.png; critic/rounds/round-06/targets/speaker-rikku-x2.jpg
- **Confidence:** High — measured rects on 48 chapter 1 lines and every chapter 2 line, plus two frames.
- **Smallest fix:** Give the portrait slot in src/ui/common/DialogueBox.ts a fixed box with overflow hidden and object-fit cover so the painting is cropped to the slot instead of overflowing it, and remove the placeholder fill behind it. Line not traced.
- **Acceptance check:** At 1600x900 and 2000x1012, in chapters 1, 4 and 5, the portrait element's bounding rect is fully inside the slab's rect and no pixel of the slot's fill colour is visible around the painting.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 5. PR-0056 — MAJOR · `visual` · FFX only (Jecht speaks in the FFX chapters)

**Jecht's dialogue portrait is framed off his face — the slot shows hair and shoulder, no eyes**

- **Chapter / state:** reproduced in ch.2 (yunalesca pre-scene, line 1) and ch.3 (braskas-final-aeon pre-scene, line 2) · pre-battle cutscene, speaker card
- **Requirement:** CHK-012; the face-crops contract in src/ui/common/face-crops.json, whose own comment states the row targets eyeY 0.42 and ipd 0.30 and that a wrong row is exactly how Auron once shipped cropped through the chin.
- **Expected:** Like every other speaker, Jecht's eyes land near the target eye line and his head fills the slot at the roster's scale.
- **Observed:** The slot shows the top of his head, his hair and his shoulder plate; his eyes are cut off above the slot's top edge and no face is visible. His measured geometry is an order of magnitude off every other speaker: imgRect x=-134, w=500, h=731 against a 315x333 slot at (96,500) — overhang left 229 px, bottom 271 px, and 44 px SHORT of the slot's right edge. Every other FFX speaker measures 244-421 px wide. His face-crops row is fx 0.7428, fy 0.2673, ipd 0.1466 for a 832x1216 source, against the file's own stated targets of eyeY 0.42 and ipd 0.30.
- **Repro:** Candidate c71cd82, 1600x900, gpu, fresh profile. Chapter 2: Enter at title, Enter at chapter select on chapter 2, Enter at party prep, then one Enter tap — line 1 is Jecht. Same for chapter 3, line 2. Read .dbox__portrait's rect against the slab's.
- **Evidence:** critic/rounds/round-06/evidence/gaps/scenes/ch2-1600x900.json (lines 1, 5, 6, 7, 8); critic/rounds/round-06/evidence/gaps/scenes/ch2-1600x900/; src/ui/common/face-crops.json (jecht row)
- **Confidence:** High — the rects are measured on eight lines across two chapters and the crop row's own numbers are far from the file's stated targets.
- **Smallest fix:** Re-measure the jecht row in src/ui/common/face-crops.json against the same eyeY 0.42 / ipd 0.30 targets the other rows use. No painting changes: jecht.png is approved art and is only being framed wrongly (RUBRIC §7).
- **Acceptance check:** At 1600x900 in chapters 2 and 3, Jecht's portrait rect sits inside the slab like the other speakers, his eyes are visible, and his rendered width falls in the 244-421 px band the rest of the FFX roster occupies.
- **Repair attempts so far:** 0

### 6. PR-0057 — MAJOR · `visual` · both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing)

**At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line**

- **Chapter / state:** reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent · pre-battle cutscene at 390x844
- **Requirement:** RUBRIC §5 legibility and CHK-003; the Ink & Gold spec docs/handoff/presentation-ink-and-gold.md — the dialogue card is the primary narrative surface.
- **Expected:** At phone width the speaker name, the faction plate and the line are readable, and the persistent key-hint bar does not overlap them or overflow the viewport.
- **Observed:** The whole card is compressed into a roughly 60 px strip at the bottom of the 844 px viewport (slot 77x81 at y=747). The .chint bar renders over it: in chapter 5 "ENTER ADVANCE - HOLD ENTER SKIP - ESC MENU" sits across Nooj's name, his YOUTH LEAGUE plate and his line "Baralai carries him."; in chapter 1 the same bar sits across Kimahri's name and line and his portrait is reduced to a sliver. The hint bar is 443 px wide inside a 390 px viewport (x = -27, overflowing 27 px past each edge). Kimahri's image is 94x137 at y=716 against a 77x81 slot at y=747 — larger than its slot in both axes, PR-0020 again at this size.
- **Repro:** Serve the candidate (D:/pyrefly-release/dist-gate, vite preview). Viewport 390x844, PYREFLY_BROWSER=gpu. Real keys: Enter at the title, ArrowRight x4 for chapter 5 (none for chapter 1), Enter, Enter at party prep. Wait for screen()=="cutscene" AND .dbox--visible AND computed opacity > 0.5 (an earlier capture shows a mid-fade card and must be discarded). Read the .dbox, .dbox__portrait and .chint rects. Deterministic, no seed.
- **Evidence:** critic/rounds/round-06/evidence/gaps/escape/phone-v2.json; critic/rounds/round-06/evidence/gaps/escape/ch5-nooj-no-portrait-390x844-v2.png; critic/rounds/round-06/evidence/gaps/escape/ch1-kimahri-painted-390x844-v2.png; critic/rounds/round-06/gap-phone.mjs
- **Confidence:** High — measured rects plus two frames, reproduced in both games.
- **Smallest fix:** Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.
- **Acceptance check:** At 390x844 in chapters 1 and 5, with .dbox--visible asserted: the .chint rect does not intersect the .dbox__body or the speaker-plate rect, and .chint lies entirely within 0..viewportWidth.
- **Note:** Distinct from the disclosed PR-0017, which is an enemy off-screen in a chapter 1 BATTLE at phone width.
- **Repair attempts so far:** 0

### 7. PR-0058 — MAJOR · `visual` · FFX-2 only (every FFX script speaker is covered)

**Ten recurring FFX-2 speakers have no portrait, and the empty slot renders as a plain grey rectangle — including Lenne across five lines of Chapter 5's climax**

- **Chapter / state:** ch.5 (Nooj in the pre-battle scene, Lenne over five post-victory lines); ch.4 has the same gap for Leblanc, Logos, Ormi and Brother · pre-battle and post-victory cutscenes, speaker card
- **Requirement:** CHK-012 (approved final faces load instead of accidental placeholders); presentation tile A-dialogue (the card has a painted speaker); AGENTS.md rule 9 — anything Bailey sees needs an approved end state, and a blank slot is not one.
- **Expected:** Every speaker a shipped script gives a line to has a face on the card, or the card has a deliberate faceless treatment that reads as designed.
- **Observed:** The roughly 250x210 slot draws a flat grey vertical gradient rectangle inside the cream card — no ink line, no gold, no silhouette, no initial. It reads as a failed image load. Captured with img null and naturalWidth 0 for Nooj (ch.5 pre-scene line 1, at both 1600x900 and 2000x1012) and for Lenne on five consecutive post-victory lines including the writing bible's marked [ICONIC QUOTE] "This moment's enough." and "Rest with me."; also for Leblanc (three lines) and Logos (two) in chapter 4's aftermath. No 404 is raised, so the slot is simply empty rather than broken. Confirmed absent from disk: public/art/portraits holds no file for nooj, lenne, baralai, gippal, brother, buddy, shinra, leblanc, ormi or logos, while the shipped scripts give those ids about 23 lines in chapter 5 and 7 in chapter 4.
- **Repro:** Nooj: chapter 5, real keys to the pre-battle scene, one Enter tap. Lenne: chapter 5 carried to victory (entry by real keys, turns by the shipped intended strategy), then Enter-tap through the post script; lines 3, 4, 8, 9 and 10 are hers. Deterministic — the scripts are fixed. Cross-check: ls public/art/portraits against the say() ids in src/story/scripts/ffx2-vegnagun-shuyin.ts.
- **Evidence:** critic/rounds/round-06/evidence/gaps/victory/ch5.json (34 sampled lines with img / nw / slotEmpty); critic/rounds/round-06/evidence/gaps/victory/ch4.json; critic/rounds/round-06/evidence/gaps/victory/ch5-post-03-lennesongstress.png (+ post-04, 08, 09, 10); critic/rounds/round-06/evidence/gaps/scenes/ch5-1600x900/line01-noojyouth-league.png; critic/rounds/round-06/evidence/gaps/yu-yevon/trace.txt (every say() speaker id in every shipped script)
- **Confidence:** High — the files are absent from disk and the render is captured at two sizes in two chapters.
- **Smallest fix:** Needs Bailey's yes before anything is built (AGENTS.md rules 9 and 10). Two options to put to him: commission portraits for the recurring FFX-2 speakers (Lenne first — she carries the climax), or author a portrait-less card variant in the Ink & Gold language. The smallest code-only correction, if the art is not commissioned, is to collapse the slot and let the body span the full card when the speaker has no portrait, so nothing looks broken.
- **Acceptance check:** For every speaker id any shipped script passes to say(), either public/art/portraits/<id>.png exists and the img reports naturalWidth > 0 in a captured dialogue frame, or the card renders with no portrait slot at all (slot rect width 0).
- **Repair attempts so far:** 0

### 8. PR-0014 — MAJOR · `visual` · both

**HUD portrait chips crop through heads; the monogram half is repaired**

- **Chapter / state:** 1 to 5 · CTB list, party status rows, prep roster, results rows and pause dossier, 1600x900
- **Requirement:** critic/CHECKS.md CHK-012 (the visible crop contains the whole head; a fallback never ships as the final face) and CHK-020 (consistent portrait treatment across shared screens). Owner-reported 2026-09-18 ('Auron's HUD portrait is cropped through the chin').
- **Expected:** Every portrait chip shows the whole head with air above the hair and below the chin, consistently framed across the set, and no monogram stands in for a shipped character.
- **Observed:** Half repaired, and that half is verified. Paine is now a painted face everywhere she was a letter monogram: party prep (left list and bottom bar, read at 4x), the pause party bar, the battle HUD chip and results — ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits, and the face is recognisable at chip scale (silver-and-red hair, red eyes, studded collar). The crop half is unchanged: the chips still cut the top of the head on Yuna, Rikku and Paine.
- **Repro:** 1600x900: Chapter 1 battle, read the CTB list and the party rows; Chapter 3 battle, read Auron's row; Chapter 4, read Paine's battle row, then lose and read her results row, then RETRY and read the prep roster, then Esc and read the pause chips.
- **Evidence:** critic/rounds/round-06/crops/chip-paine.png; critic/rounds/round-06/crops/chip-yuna.png; critic/rounds/round-06/crops/chip-rikku.png; critic/rounds/round-06/evidence/ch4/L-1600x900-chip-collapsed.png; critic/rounds/round-06/evidence/ch4/run.json; critic/rounds/round-06/evidence/ch5/run.json
- **Confidence:** high
- **Smallest fix:** Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.
- **Acceptance check:** Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* The monogram half was repaired by the eight new portraits and face-crops.json at 1d4a4cc / this candidate, and is verified repaired here. The crop half depends on the chip crop rule, which 740ab21..c71cd82 does not change.
- **Repair attempts so far:** 1

### 9. PR-0012 — MAJOR · `interface` · FFX-2

**The FFX-2 command menu, unlike the FFX one, never tells the player what the highlighted row does**

- **Chapter / state:** 4 and 5 · battle, command menu open, any row
- **Requirement:** critic/CHECKS.md CHK-020, which names both command menus explicitly.
- **Expected:** CHK-020: the same screen in both games gets the same work, and any FFX-2 difference is deliberate and written. The FFX menu prints one line saying what the highlighted command does ('Physical damage', 'Speeds the target's turn up - inflicts Haste').
- **Observed:** Unchanged and re-observed on this candidate. At the first command menu of chapter 4 the rows read WHITE MAGIC / CHANGE / ITEM with nothing anywhere on screen saying what the highlighted row does; FFX in the same state prints a help slab above the stack. The only FFX2BattleHud change in this build is the 15-line zero-row guard.
- **Repro:** Open Chapter 4 to the first ATB turn with real keys and press ArrowDown/ArrowUp across the rows, reading .ig-cutin__info and the whole HUD text; run the same probe on Chapter 1. Harnesses: critic/rounds/round-04/p14-ffx2menu.mjs and confirm/x1-menu-help.mjs.
- **Evidence:** critic/rounds/round-06/evidence/ch4/L-1600x900-guide-open.png; critic/rounds/round-06/evidence/ch4/04-first-menu.png
- **Confidence:** high
- **Smallest fix:** Mount the same info slab in FFX2BattleHud and feed it from the FFX-2 CommandMenu's selection, reusing commandHelpText's FFX-2 registry lookup.
- **Acceptance check:** In Chapter 4, moving the cursor over each command prints its description, and a Playwright case asserts a non-empty description for every reachable FFX-2 row.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 10. PR-0008 — MAJOR · `encounter` · FFX

**Chapter 1's own intended strategy wins only 26 of 40 seeds while every other chapter's intended line wins 95 to 100 percent**

- **Chapter / state:** 1 (Seymour Flux) · whole encounter
- **Requirement:** RUBRIC section 6 encounter (correct difficulty, fair wins and losses). Round 03 recorded this as a blocker; this build changed no data, no AI and no party preset, and the release manifest lists Chapter 1 difficulty as known and unchanged.
- **Expected:** The first encounter a player meets is winnable by the line the game itself recommends, at a rate at least comparable to the later chapters.
- **Observed:** CARRIED AND STALLED. Re-measured on this candidate rather than reused: npx vitest run tests/unit/strategy-seymour-flux.test.ts in D:/pyrefly-release at c71cd82 prints "seeds 1-40: 26 wins" (65 percent), against every other chapter's intended line at 95-100 percent — FFX-2 measured this round at 120/120 across all six links. Open at the same severity in rounds 04, 05 and 06, as is its neighbour PR-0007 in the same chapter.
- **Repro:** npx vitest run tests/unit/strategy-seymour-flux.test.ts in D:/pyrefly-release prints 'seeds 1-40: 26 wins' with the losing seeds and turns; compare with strategy-ffx2-bahamut.test.ts and strategy-ffx2-vegnagun-shuyin.test.ts, both 40/40.
- **Evidence:** tests/unit/strategy-seymour-flux.test.ts run at c71cd82 in D:/pyrefly-release; critic/rounds/round-05.json (PR-0008)
- **Confidence:** high - two independent measurements on this exact build, one seeded bench and one real-input capture
- **Smallest fix:** Not proposed here. Under RUBRIC §8 the next batch in chapter 1 starts with a written method check instead of a third similar repair attempt: the current route and why it stalled, up to two alternatives, the smallest test that tells them apart, and one choice of continue / change method / small probe / defer / ask Bailey.
- **Acceptance check:** After whichever answer Bailey picks, the Chapter 1 forty-seed sweep wins at a rate within a few points of Chapter 2's 39/40, with no defeat before turn 25, and a real-input capture reaches victory at least once.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 2

### 11. PR-0007 — MAJOR · `encounter` · FFX

**Chapter 1's signature mechanic has no counter-play: 37 of 44 Zombie kills give the player zero turns in between**

- **Chapter / state:** 1 (Seymour Flux) · battle, Zombie applied then Full-Life
- **Requirement:** RUBRIC section 6 encounter (signature mechanics, fair losses); research/ffx-seymour-flux.md documents the answer as Holy Water or Remedy, which presumes a turn in which to use it.
- **Expected:** A player who is paying attention gets at least one turn between a Zombie landing and the Full-Life that converts it into a kill, so the documented answer (Holy Water, Remedy) is playable.
- **Observed:** CARRIED AND STALLED, and disclosed in this candidate's brief. Not re-measured: git diff --stat 740ab21..c71cd82 -- src/battle src/data research lists only the two FFX-2 files, so nothing that decides this moved. Open at the same severity for three consecutive reviews.
- **Repro:** Node/vitest, no browser: drive ENEMY_GROUPS_BY_ID['seymour-flux'] with gagazetBuild and intendedStrategy over seeds 1..30, recording player-input turns and the zombie status-add / ko events. Output: 'zombie->KO events: 44; zero player turns in between: 37'.
- **Evidence:** critic/rounds/round-04/bench/zz-critic04-ch1.test.ts; critic/rounds/round-03.json rankedIssues (same finding, prior build)
- **Confidence:** high - measured directly off the engine's own event stream on this build
- **Smallest fix:** A proposal, not a repair to apply unasked (AGENTS.md rule 10). The smallest sourced-looking lever is the scheduling of the Full-Life follow-up relative to the Zombie in src/battle/ffx/ai/seymour-flux.ts: if the research supports the two landing on separate scheduled turns rather than inside one AI step, separating them restores the window at no cost to the boss's numbers. If the sources do not settle it, say so and ask Bailey rather than tuning.
- **Acceptance check:** Re-run the seeds 1-30 instrumentation: the median window between a Zombie landing and the Full-Life kill is at least one player turn and the zero-window share falls below roughly 10 percent, with Seymour Flux's stat block and ability data unchanged.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 2

### 12. PR-0043 — MAJOR · `process` · both

**No victory has been reached on fully real input, and no FFX chapter has reached victory at all — but the aftermath is reachable and was captured for the first time this round**

- **Chapter / state:** all five · victory, post-battle script, results, return
- **Requirement:** CHK-022 and RUBRIC §5: a scene counts only when the player can reach it; milestone acceptance needs, per included chapter, one continuous legal-input route from normal entry to outcome, reachable aftermath and results, and retry / return. RUBRIC §5 also holds that a debug hook may set up a state but cannot prove a player can win it.
- **Expected:** At least one chapter per game played through a real-input victory into its post-battle script.
- **Observed:** Substantially improved and not yet closed. For five rounds no victory had ever been reached; this round the gap pass reached victory in both FFX-2 chapters, played their post-battle scripts to completion, reached results and returned to chapter select — chapter 4 sixteen aftermath lines, "BEVELLE UNDERGROUND - LIMBO - CLEARED", results 1:36, endScreen chapter-select; chapter 5 thirty-four lines through the Lenne release and the Farplane coda, "Victory", results 6:06, endScreen chapter-select, 0 console errors. Three of the eight portraits Bailey picked on 2026-09-21 (shuyin.png, fayth-boy.png and, earlier, paine.png) are proved rendering only because of these routes. What remains: entry and every screen transition were real key presses, but the battle turns themselves were taken by window.__pyrefly.autoBattle("intended") at speed "fast", so the win is not player-proved; and no FFX chapter (1, 2 or 3) has reached a victory by any route — every FFX outcome captured in six rounds is a defeat.
- **Repro:** critic/rounds/round-06/gap-victory.mjs (chapters 4 and 5); records at evidence/gaps/victory/ch4.json and ch5.json with 57 frames.
- **Evidence:** critic/rounds/round-06/evidence/gaps/victory/ch4.json; critic/rounds/round-06/evidence/gaps/victory/ch5.json; critic/rounds/round-06/evidence/gaps/victory/; critic/rounds/round-06/evidence/ch1/supp-win-1600x900.json (a win-intent route that ended "Defeat / TURNS 10 / 0:49"); critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json (endScreen "battle" after 545,528 ms)
- **Confidence:** High — the reach is measured both ways: the aftermath now has evidence, and the absence of a real-input win is visible in every route record.
- **Smallest fix:** Add one scripted real-input victory route per game to the capture harness, driving the win with real keys and continuing through the post block to results and back. Chapter 3 (median 9 player turns on the sourced Candle of Life exit) and chapter 4 (8/8 seeds on the intended line) are the cheapest. Chapter 1 cannot be the FFX route while PR-0008 stands at 26/40.
- **Acceptance check:** One continuous real-keyboard route in each game reaches victory, plays its post-battle script to completion, reaches results and returns to chapter select, with the dialogue text captured.
- **Repair attempts so far:** 1

### 13. PR-0059 — MAJOR · `process` · both

**Evidence integrity: three of this round's recorded claims are contradicted by its own data files (CHK-016 FAIL)**

- **Chapter / state:** all five, plus the dark probe · the round's evidence index and two harness scripts
- **Requirement:** critic/CHECKS.md CHK-016 (mandatory on every deployment); RUBRIC §5, "confirm screen, chapter, phase, actor and state before each capture".
- **Expected:** Every narrative claim in the evidence index is readable back out of a recorded measurement, and every capture's asserted state was proved by the harness.
- **Observed:** (1) index.json notes say chapter 2's scene shows Braska, Jecht and young Auron with the new portraits; ch2/run.json sceneSpeakers holds one entry, Jecht/jecht.png — play.mjs pushes one sample and then holds Enter for 1300 ms, which skips the scene, so only one speaker is ever sampled per chapter. (The claim happens to be true: the gap pass later captured all three. It was still unsupported when it was written.) (2) The notes say the menu-row invariant held at 6 rows minimum and never zero; menuRowSamples reads n:0, first:null in every sample of every chapter and zeroRowMenus is 3, 22, 12, 52 and 24, because the DOM selector matches no node — the capture proves neither the invariant nor its breach, and the invariant is in fact proved by the engine bench and by the 301-turn runtime log, not by this capture. (3) dark/01-pause-1600x900.png asserts screen=pause but supp.mjs never reads screen() after the Escape, and the frame shows no pause screen. A fourth, harmless instance: gap-audio.mjs reads d.music ?? d.currentTrack ?? d.track and records music:null for every sample, while the same file's audioRaw shows playing:"boss-jecht" — the raw field kept the truth, so no false claim was published.
- **Repro:** Read evidence/index.json against ch2/run.json, ch4/run.json and ch1/supp-dark-1600x900.json, and read critic/rounds/round-06/play.mjs lines 64-73 and 92-97, supp.mjs lines 88-108, gap-audio.mjs line 29.
- **Evidence:** critic/rounds/round-06/evidence/index.json; critic/rounds/round-06/evidence/ch2/run.json; critic/rounds/round-06/evidence/ch4/run.json; critic/rounds/round-06/evidence/ch1/supp-dark-1600x900.json; critic/rounds/round-06/evidence/gaps/audio/ch3.json; critic/rounds/round-06/play.mjs; critic/rounds/round-06/supp.mjs; critic/rounds/round-06/gap-audio.mjs
- **Confidence:** High.
- **Smallest fix:** In play.mjs sample the speaker before every advance and advance with a tap rather than a 1300 ms hold; replace the command-row selector with the one the HUD actually emits and fail loudly when it matches nothing; in supp.mjs assert screen() after the Escape before shooting dark/01; in gap-audio.mjs read the audioDebug field that exists (playing). Then restate the three claims from the new data. This is the second consecutive round with an evidence-integrity finding (round 05 PR-0042), so the harness, not the reviewer, is the thing to fix.
- **Acceptance check:** Each chapter's run.json lists every speaker its script contains, menuRowSamples reports a non-zero row count on a turn the player was asked to act, and every capture's asserted field names a state the harness read back.
- **Repair attempts so far:** 0

### 14. PR-0060 — MAJOR · `process` · FFX only

**The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce**

- **Chapter / state:** ch.3 (braskas-final-aeon) · the yu-yevon-arrives trigger
- **Requirement:** CHK-012 and RUBRIC §7's approved-target gate — every required tile in docs/target/targets.json must be matched from the build.
- **Expected:** The tile's stated acceptance case, "A dialogue line spoken by Yu Yevon with the portrait showing (public/art/portraits/yu-yevon.png)", is producible from play so the tile can be verified.
- **Observed:** No shipped script gives yu-yevon a say() line. grep -rn "say('yu-yevon'" over src/story/ returns nothing, and a full trace of every say() id in every shipped script does not list it. yu-yevon is declared as a SpeakerId (src/story/dsl.ts:45) and exists as a combatant id, an AI script id and a music/sfx key, but its only story-layer uses are a trigger condition (braskas-final-aeon.ts:221, when: { type: "hp-below", who: "yu-yevon" }) and an fx call (line 349); the lines over his on-field reveal belong to Tidus and then Auron (lines 350-352). public/art/portraits/yu-yevon.png ships at 1.56 MB and can never be displayed as a speaker portrait. The tile's own note already records that the file is a safety net against a 404 rather than a face, which contradicts the acceptance case as written.
- **Repro:** In D:/pyrefly-release: grep -rn "say('yu-yevon'" src/story/ (no matches); grep -rn "yu-yevon" src/story/ (only dsl.ts:45 and braskas-final-aeon.ts 220/221/223/285/305/347/349). Then play chapter 3 to the yu-yevon-arrives trigger and observe the speaker is Tidus, then Auron.
- **Evidence:** critic/rounds/round-06/evidence/gaps/yu-yevon/trace.txt (full grep transcript and the tile record); critic/rounds/round-06/evidence/gaps/audio/ch3-phase-7.png (the arrival itself)
- **Confidence:** High — traced in source, and the tile's own note corroborates it.
- **Smallest fix:** An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.
- **Acceptance check:** Either a captured dialogue frame at 1600x900 shows speaker "Yu Yevon" with yu-yevon.png at naturalWidth > 0, or the tile in docs/target/targets.json carries a delivery state that does not require one.
- **Repair attempts so far:** 0

### 15. PR-0002 — MAJOR · `visual` · FFX observed; the safe-zone solver is shared plumbing

**The FFX command menu covers a whole party member head to feet, and the submenu breadcrumb draws under an actor**

- **Chapter / state:** 1, 2 and 3 · battle, top-level command menu open, 1600x900 and 2000x1012
- **Requirement:** critic/CHECKS.md CHK-008 and docs/ENGINE-API.md#hud-safe-area (the only permitted overlap is the command stack over the party's lower third). Owner-reported 2026-09-18 and disclosed as known; the head-to-foot occlusion is past the declared exception.
- **Expected:** The command stack clears the painted party quads except for the declared lower-third overlap, as the approved Battle HUD FFX tile shows with all three members clear of the menu; a disabled row is still legible.
- **Observed:** Re-observed on this candidate's own captures. The command stack intersects a painted party member over her whole height, not only the party's lower third. In chapter 3 the third member (Yuna, present in the status rows at 5130/5130 HP) is visible only as a pale sliver at the left screen edge behind the TALK / ATTACK / SPECIAL / WHITE MAGIC / ITEMS / FLEE slabs; the same figure is behind the ATTACK / SPECIAL rows in chapter 1. The two permitted overlaps of docs/ENGINE-API.md#hud-safe-area are the command stack over the party's LOWER THIRD and the strategy guide's soft rail; what is observed exceeds the first.
- **Repro:** Candidate at http://localhost:5433/pyrefly-reprise/, 1600x900, PYREFLY_BROWSER=gpu. Title, Enter, chapter select, Chapter 1, party prep, skip the scene, first player turn: look at the left party slot behind the command list, then press Right/Enter into SPECIAL and look at the breadcrumb.
- **Evidence:** critic/rounds/round-05/evidence/ch3/04-first-menu.png; critic/rounds/round-05/evidence/ch1/04-first-menu.png; critic/rounds/round-05/targets/battle-hud-ffx.jpg
- **Confidence:** high
- **Smallest fix:** Give the FFX command stack the treatment FFX-2 already has: move it off the party's horizontal band, or shift the FFX party formation so the leftmost slot starts outside the stack's projected box. Then put both HUD text layers, breadcrumb and command slabs, on the same side of the actor layer so z-order is consistent, and give the disabled row the same opaque plate the enabled rows have.
- **Acceptance check:** At 1280x720, 1600x900, 2000x1012 and 2560x1440 in chapters 1-3, project each party quad through the render camera and intersect it with the command-stack and breadcrumb boxes in the painted frame: no intersection above each actor's lower third, and the breadcrumb is never covered by an actor. Promote the scratch matrix to tests/e2e/hud-collision.spec.ts.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 16. PR-0016 — MAJOR · `visual` · FFX-2 as observed; the framing rule is shared and should be checked for all five plates

**The Chapter 4 pause plate is cropped past its approved framing and loses Bahamut entirely**

- **Chapter / state:** 4 (Bahamut) · pause (Esc) during battle, 1600x900
- **Requirement:** The approved-target gate, RUBRIC section 7, tile 'Hero plate, chapter 4'. An approved close-up may crop a head on purpose; accidental crop damage is the defect.
- **Expected:** The approved painting - Yuna looking at the viewer with Bahamut's head at her shoulder against a bright sky - presented full-bleed, the way the Chapter 1 plate is (docs/screenshots/concept/pause-ch4.png, 'the chapter 4 pause painting, full-bleed').
- **Observed:** Re-confirmed on this candidate's own capture. The chapter 4 pause plate is scaled to a face-only close-up: the eyes and cheek fill the frame and the character with Bahamut, the scarf, the costume and the sky that the approved painting composed around are outside the viewport. Chapter 1's plate, by contrast, holds its approved full-bleed framing at both sizes.
- **Repro:** 1600x900: Title, Chapter 4, party prep, Enter, skip the scene, battle, Esc. Compare with docs/screenshots/concept/pause-ch4.png.
- **Evidence:** critic/rounds/round-05/evidence/onboarding/pause-rows-ffx2.png; critic/rounds/round-05/targets/C3.jpg (build panel); critic/rounds/round-05/targets/pause-2000x1012.jpg (chapter 1, for contrast)
- **Confidence:** high
- **Smallest fix:** Give the Chapter 4 pause plate the same cover-fit rule the Chapter 1 plate uses, or a focal box that keeps Bahamut's head inside the frame at 16:9, instead of the current zoom.
- **Acceptance check:** Re-pair the tile at 1600x900 and 2000x1012 and confirm the composite shows both Yuna's whole head and Bahamut's head inside the frame; repeat for every chapter's pause plate so the set is framed by one rule.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 17. PR-0005 — MAJOR · `visual` · both (the tile names chapter 1)

**The approved Turn cut-in never appears in play: showTurnCutIn has no production call site**

- **Chapter / state:** observed in 1 · battle, every party turn-start, and the whole battle entry
- **Requirement:** The approved-target gate (RUBRIC section 7): every required target in targets.json must match. AGENTS.md hard rule 4 and CHK-023: a complete, unit-tested subsystem with zero runtime callers.
- **Expected:** When a party member's turn begins, the Ink & Gold portrait cut-in plays. docs/target/targets.json, group presentation, tile 'Turn cut-in', status approved.
- **Observed:** Re-traced on the candidate: no cut-in appears on any turn in any of this round's five real-input routes. showTurnCutIn is defined at src/ui/inkgold/cutin.ts:84 and re-exported at src/ui/inkgold/index.ts:17, and a grep over src/ finds no other reference — it has no production call site, so the approved target cannot be delivered. This is the "built but wired to nothing" class of AGENTS.md hard rule 4.
- **Repro:** node critic/rounds/round-04/g2-ch1-win.mjs against dist-gate; read the cutin field of every sampled state in g-ch1-entry-timeline.json and the 'cut-ins observed at a player turn' line in g2-ch1-log.json.
- **Evidence:** src/ui/inkgold/cutin.ts:84 and src/ui/inkgold/index.ts:17 (traced in D:/pyrefly-release at 740ab21); critic/rounds/round-05/evidence/ch1/04-first-menu.png and the ch1-ch3 run records
- **Confidence:** high
- **Smallest fix:** Either wire the cut-in into the turn-start path of the presenter and HUD, at the same place the CTB list marks the new actor, or, if the direction has changed since the tile was approved, take it back to Bailey as an end-state question. This is the owner's decision, not a builder's silent one.
- **Acceptance check:** A real-input run of Chapter 1 records at least one frame where .ig-cutin is visible with the acting member's name at a party turn-start, and node tools/orphans.mjs plus a call-site check show showTurnCutIn has a production importer.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 18. PR-0031 — MAJOR · `visual` · FFX-2 for the observation. The approved frames cover both games; the FFX side was not re-measured against the frame this round, so this ticket claims only the FFX-2 half.

**FFX-2 target selection is missing four elements the approved targeting frame shows**

- **Chapter / state:** 5 (also seen in 4) · FFX-2 battle, single-target selection
- **Requirement:** docs/target/targets.json, "How a fight plays" group, targeting look B approved by Bailey 2026-09-19; AGENTS.md hard rule 9; RUBRIC §7.
- **Expected:** The approved tile "fight / Targeting in FFX-2" (docs/concepts/targeting/b-ring-and-dim/s3.png) carries a top "TARGET  Vegnagun — Head [PART]" plate, an actor chip ("Yuna [GUNNER]"), a letter tag on the plate under the reticle ("Vegnagun — Head [H]") and a footer hint "ENTER CONFIRM  ←→ CHANGE TARGET  ESC BACK". Bailey picked targeting look B on 2026-09-19 ("B: hand, ring and a quiet dim") and AGENTS.md rule 9 holds the build to it.
- **Observed:** The build draws the ring and the ellipse markers and a bare name plate under the reticle reading only "Vegnagun" (chapter 5) or "Bahamut" (chapter 4). None of the four listed elements is present: no top TARGET plate, no PART pill, no actor chip, no letter tag, no confirm/change/back hint. A player in target selection is told what is highlighted but not who is acting, that the thing is a part, which part it is, or that the arrows change target.
- **Repro:** Real keys, fresh profile, 1600x900, PYREFLY_BROWSER=gpu: enter chapter 5 (ArrowRight x4 at chapter select), skip the scene, at a command menu select ATTACK and press Enter, then capture the target-selection state. Same in chapter 4.
- **Evidence:** critic/rounds/round-05/evidence/gaps/targeting/ffx2-vegnagun-shuyin-single-target-plate.png; ffx2-bahamut-single-target-plate.png; --pair composite critic/rounds/round-05/targets/fight-s3.jpg
- **Confidence:** high — captured in both FFX-2 chapters and compared against the approved frame in a composite.
- **Smallest fix:** Draw the four missing elements from data the presenter already has: the acting unit, the target's display name, its part flag and its letter tag, plus a static footer hint. Note for the builder: the leader-line marker in the same tile is recorded as `undecided` in the tile's reaction block and must NOT be built without Bailey's yes.
- **Acceptance check:** A --pair composite of docs/concepts/targeting/b-ring-and-dim/s3.png against a fresh FFX-2 single-target capture shows the TARGET plate, the actor chip, the part pill, the letter tag and the footer hint at 1600x900 and 2000x1012.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 19. PR-0015 — MAJOR · `visual` · FFX-2

**Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5**

- **Chapter / state:** 5, battle 1 of 5 · battle, default framing, 1600x900
- **Requirement:** CHK-014's wider class (art correct in isolation can still be wrong once staged) and CHK-011 (a targetable enemy's readable features are not occluded by the party).
- **Expected:** The party line and the enemy's painted extent do not intersect in a way that makes either look broken.
- **Observed:** Re-observed on this candidate: Vegnagun's green tail tip still reads as an un-keyed green shard stuck to Rikku's forearm through all of chapter 5.
- **Repro:** 1600x900, PYREFLY_BROWSER=gpu. Title, Chapter 5, party prep, Enter, skip the scene, first player turn: look between Rikku's raised right gauntlet and the hilt of her sword.
- **Evidence:** critic/rounds/round-05/evidence/ch5/04-first-menu.png and the ch5 capture set
- **Confidence:** high
- **Smallest fix:** Move the Chapter 5 battle-1 enemy slot right, or the party line left, so the tail's green tip clears the party quads. Do not repaint either approved plate.
- **Acceptance check:** Project the vegnagun-tail quad and each party quad through the Chapter 5 camera and assert zero intersection in the default framing, then re-shoot and confirm no saturated-green pixels (g>170, g-r>60, g-b>45) fall inside any party member's bounding box.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 20. PR-0017 — MAJOR · `visual` · both (shared camera fitting); observed in FFX chapter 1

**At phone width one of Chapter 1's two enemies is entirely off-screen**

- **Chapter / state:** 1 (Seymour Flux) · battle, command menu open, 390x844
- **Requirement:** critic/CHECKS.md CHK-011 (no targetable enemy more than about 25 percent occluded in the default framing).
- **Expected:** Both Seymour Flux and Mortiorchis are visible and identifiable in the default framing at every supported shape.
- **Observed:** At 390x844 the camera zooms to preserve Seymour Flux's height and pushes Mortiorchis more than 95 percent outside the viewport - only a few pixels of green tentacle remain at x 376-390. The enemy is still in the CTB list, still in the enemy card and still targetable, but the player cannot see what they are aiming at. The lower 40 percent of the screen is empty backdrop at the same time, so the space exists.
- **Repro:** Emulate 390x844, reload, PYREFLY_BROWSER=gpu. Title, Chapter 1, party prep, Enter, skip the scene, first player turn; compare the field with the 1600x900 capture, where Mortiorchis sits at 62-76 percent across.
- **Evidence:** critic/rounds/round-04/evidence/shots/seymour-flux-legibility-390x844.png; crops/phone-enemies.png
- **Confidence:** high
- **Smallest fix:** Fit the camera to the enemy formation's bounding box rather than to the lead enemy's height, using the empty lower band. The phone layout is an approved gap awaiting Bailey's options, so this belongs with that decision rather than as a standalone tweak.
- **Acceptance check:** Add tests/e2e/enemy-visibility.spec.ts with the per-chapter, per-form matrix and the 25 percent rule, run at 390x844 as well as the desktop shapes.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 21. PR-0010 — MAJOR · `interface` · both (shared panel)

**The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest**

- **Chapter / state:** 1 and 2 shown; anywhere the body overflows · battle, intent panel showing (E), IF YOU ATTACK list
- **Requirement:** RUBRIC section 6 interface (honest intent that separates certain from conditional); CHK-003 (zero clipped).
- **Expected:** Either the whole counter list is legible, or the hidden part is signposted and reachable with the keyboard and pad the game is played with - the treatment the strategy guide gets with its MORE chip.
- **Observed:** The body is capped at 30 percent of the frame (src/ui/common/EnemyIntent.ts:214, 459-462) and overflows with only a 6 px mask fade, no scrollbar, no chip and no key. At Yunalesca turn 1 the third bullet, 'and the Blind counter never fires' - the rule that decides whether the fight is winnable - is sliced through the middle of its glyphs at the panel edge. At Seymour Flux turn 1 the third bullet reads 'Below 50% HP Seymour answers with Reflect and' with 'phase 2 opens' cut off. The only way to reach the hidden text is a mouse wheel over the panel.
- **Repro:** Chapter 2, first player turn, press E, 1600x900, read the IF YOU ATTACK list; repeat at Chapter 1.
- **Evidence:** critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png, ch1-07-enemy-intent.png
- **Confidence:** high - visible in two chapters and traced to the cap and the clipped class in the shipped CSS
- **Smallest fix:** Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.
- **Acceptance check:** At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 22. PR-0011 — MAJOR · `interface` · FFX (FFX-2 already shows it)

**The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named**

- **Chapter / state:** 1 (Seymour Flux) · battle, intent panel showing, Lance of Atrophy queued
- **Requirement:** RUBRIC section 2 (the enemy-intent display separates certainty from conditional outcomes); CHK-004.
- **Expected:** The panel that exists to say what is about to happen names the Zombie that Lance of Atrophy lands with certainty - the status the whole chapter turns on, because the mount answers a living Zombie with Full-Life for 100 percent of max HP plus a guaranteed Death.
- **Observed:** The panel reads 'Lance of Atrophy / SCRIPTED / Physical non-elemental damage to one character - never misses' with a DAMAGE block (TIDUS 707-799, 31% HP) and then the counter list. Zombie is not mentioned anywhere. The Statuses block that would carry it renders only at density 'full' (EnemyIntent.ts:785) and FFX deliberately mounts the panel at density 'brief' (FFXBattleHud.ts:431). The data is there: lanceOfAtrophy carries statusEffects zombie chance 100 (src/data/ffx/enemies/seymour-flux-abilities.ts:88).
- **Repro:** Chapter 1, first player turn, press E and read the panel while Lance of Atrophy is queued.
- **Evidence:** critic/rounds/round-04/evidence/shots/ch1-07-enemy-intent.png; the same panel in FFX-2 (ffx2-bahamut-03-battle-menu.png) renders its ALSO block because it mounts at full
- **Confidence:** high for the omission on screen; the density split is the established cause, traced in code
- **Smallest fix:** Do not widen the FFX panel: keep the brief density that round 02 asked for, but promote a guaranteed or high-chance status into the brief body, either appended to the description line ('- inflicts Zombie') or as a chip beside SCRIPTED. A 100 percent status is not optional detail, it is the move. FFX only.
- **Acceptance check:** Chapter 1 turn 1 with Lance of Atrophy queued: the panel names Zombie with its chance, at brief density, without growing past its 30 percent cap; the FFX-2 panel is unchanged.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 23. PR-0013 — MAJOR · `interface` · FFX-2

**FFX-2 letters enemies by formation position, so a unique boss is lettered A and its identical sub-parts become B, C and D**

- **Chapter / state:** 5 (Vegnagun and Shuyin), links 2 to 4 · battle, any formation with two or more enemies
- **Requirement:** critic/CHECKS.md CHK-020; AGENTS.md hard rule 14 - the decision must come from the sources, and research/ffx2-combat-core.md is silent on the convention.
- **Expected:** A letter distinguishes duplicates. A formation of one Vegnagun part plus three identical Nodes should leave the part plain and letter the Nodes A, B and C, exactly as FFX now behaves after this build's turnQueue.ts fix.
- **Observed:** src/ui/ffx2/FFX2BattleHud.ts:827-834 letterTagOf() returns String.fromCharCode(65 + enemies.indexOf(id)) whenever the live enemy count is two or more, with no grouping by name. Driven live with real keys to Chapter 5 link 2, the engine enemy list is [vegnagun-leg 'Vegnagun', node-a 'Node', node-b 'Node', node-c 'Node'], so the unique Vegnagun is lettered A and the three identical Nodes become B, C and D - the opposite of what src/battle/ffx/turnQueue.ts:256-265 now does. vegnagun-body (Bulwark x2) and vegnagun-head (Redoubt x2) hit the same case. The player-facing cost photographed today: three identical NODE boss gauges with nothing to tell them apart and an intent panel reading 'NODE - Dies Irae - ACTS NEXT' with no way to know which Node.
- **Repro:** Drive Chapter 5 with real keys, hand link 1 to the repo's own intended strategy and stop at link 2: read the ATB tiles, the boss gauges and the intent panel. Harness: critic/rounds/round-04/confirm/x4 series.
- **Evidence:** critic/rounds/round-04/evidence/logs/confirm-ffx2-letters.json, confirm-ffx2-enemy-target.json; shots/confirm-ffx2-multienemy-letters.png
- **Confidence:** high on the mechanism and on the indistinguishable gauges; medium on the exact string letterTagOf writes on a name plate, which is code-traced rather than photographed
- **Smallest fix:** Do not copy the FFX rule across on a reviewer's say-so. Ask Bailey the narrow question - for a boss plus its same-named sub-parts, does FFX-2 letter from A per name group, and is a lone fiend plain? - then apply the same display-name grouping turnQueue.ts letterTagFor() now uses.
- **Acceptance check:** With one Vegnagun part and three Nodes on the field, the ATB tiles, boss gauges and targeting plates show whatever Bailey decides, a lone fiend is plain, and a test over the real Chapter 5 link-2 formation pins it.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 24. PR-0018 — MAJOR · `interface` · both (shared Ink & Gold command-row tokens); observed in FFX chapter 3

**The selected command label is the least readable text on screen, at 1.53:1**

- **Chapter / state:** 3 (Braska's Final Aeon) · battle, first player turn, cursor on the default row, 1600x900
- **Requirement:** RUBRIC section 6 interface (readable names and values); CHK-003's contrast half.
- **Expected:** The highlighted row is at least as legible as the unselected rows.
- **Observed:** The cursor opens on TALK, which is disabled, and its label renders in a muted brown on the gold selection slab. Measured glyph #C39432 against slab #E4BC4D gives a contrast ratio of 1.53:1, below the 3:1 floor for large text; the unselected ATTACK row directly beneath measures 15.44:1. The player's current selection is the hardest thing on the screen to read.
- **Repro:** 1600x900: Title, Chapter 3, party prep, Enter, skip the scene, first player turn. Do not move the cursor. Sample the TALK glyph and slab pixels at (148,446) and (300,446).
- **Evidence:** critic/rounds/round-04/crops/ch3-talk-row.png; evidence/shots/braskas-final-aeon-03-battle-menu.png
- **Confidence:** high
- **Smallest fix:** Give the selected-and-disabled state its own token: keep the gold slab but use the normal near-black label at reduced opacity, or invert the slab, so selection never reduces contrast below 4.5:1.
- **Acceptance check:** Assert computed contrast of at least 4.5:1 for every command row label against its own background in every combination of selected/unselected and enabled/disabled, in both games.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 25. PR-0019 — MAJOR · `interface` · both (shared help-slab composition); observed in FFX

**The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending**

- **Chapter / state:** 1 (Seymour Flux) · battle, SPECIAL > CHEER with the group target frame live, 1600x900
- **Requirement:** critic/CHECKS.md CHK-009 (every name that can be shown is shown in full) and CHK-010's all-target label. This build also claims every command's help sentence matches its real targeting.
- **Expected:** 'Inflicts Cheer. Hits the whole party.' with the ALL ALLIES chip clear of the text.
- **Observed:** The slab reads 'Inflicts Cheer Hits the whole par' with the green ALL ALLIES chip drawn over the final word - a hard overlap, not an ellipsis - because the chip is drawn inside the slab's own box rather than beside it, and there is no punctuation between the two clauses.
- **Repro:** 1600x900: Chapter 1, first player turn, Right into SPECIAL, cursor on CHEER, confirm to raise the group target frame, read the help slab.
- **Evidence:** critic/rounds/round-04/crops/ch1-help-clip.png; evidence/shots/ch1-13-target-all.png
- **Confidence:** high
- **Smallest fix:** Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.
- **Acceptance check:** For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 26. PR-0021 — MAJOR · `narrative` · both

**The banter bank is authored but not implemented: no formation-screen or victory-screen exchanges exist in either game**

- **Chapter / state:** party prep and results, all five · party prep and results screens
- **Requirement:** research/writing-bible.md section 4, the governing doc AGENTS.md maps src/story to; RUBRIC section 6 names banter as a scored element of narrative.
- **Expected:** research/writing-bible.md section 4 BANTER BANK: two-to-four-line exchanges for the party formation screen and the victory screen - 32 FFX exchanges plus the FFX-2 set, each tagged Suitability, Slot (Form/Win/Both) and Mood. The formation screen and the victory screen each play a suitability- and mood-matched exchange.
- **Observed:** Confirmed still open and unchanged. git diff 740ab21..c71cd82 -- src/ touches no file that could feed a banter slot, and chapter 4's and chapter 5's prep and results captures show no exchange. Second consecutive review leaving it open at the same severity, so RUBRIC §8's method check applies to the next batch in this area.
- **Repro:** Open any chapter's party prep with real keys and look for an exchange; grep -rn 'banter' D:/pyrefly-release/src.
- **Evidence:** critic/rounds/round-06/evidence/ch4/02-prep.png; critic/rounds/round-06/evidence/ch4/11-results.png; critic/rounds/round-06/evidence/ch5/02-prep.png; critic/rounds/round-06/evidence/ch5/11-results.png
- **Confidence:** high on the absence
- **Smallest fix:** Add a banter table beside the writing bible's own tags and a picker that matches slot, suitability and mood to the current formation and outcome, then host it on the prep screen and the victory results screen.
- **Acceptance check:** Open party prep in each of the five chapters and win one: each shows a two-to-four-line exchange whose speakers are in the active formation and whose mood matches the outcome.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 27. PR-0061 — POLISH · `feel` · both

**The player waits 6.3 to 9.9 seconds after the battle screen appears before the first command menu accepts input, in every chapter**

- **Chapter / state:** all five · battle entry, before the first interactive command menu
- **Requirement:** RUBRIC §6 feel: responsive input, action and reaction timing, respectful skip.
- **Expected:** The opening moment reads as a deliberate beat and a player who has seen it can shorten it.
- **Observed:** Measured on the candidate with real keys: battle screen to first interactive command menu is 9,887 ms in chapter 1, 6,260 ms in chapter 2, 6,317 ms in chapter 3, 7,340 ms in chapter 4 and 8,631 ms in chapter 5. Every other transition is fast (title to chapter select 252-290 ms, chapter select to prep 1-76 ms, prep to scene 62-152 ms, skip release to battle 1-657 ms). No key press was found that shortens the opening beat. Frame pacing during this window is not the cause: the trace records 1,919 frames over 31.98 s at mean 16.67 ms, p99 16.8 ms, 0 frames over 33 ms, approximately 60 fps.
- **Repro:** critic/rounds/round-06/gap-timing.mjs per chapter; records at evidence/gaps/timing/ch1..ch5.json, field transitions.
- **Evidence:** critic/rounds/round-06/evidence/gaps/timing/ch1.json; critic/rounds/round-06/evidence/gaps/timing/ch2.json; critic/rounds/round-06/evidence/gaps/timing/ch3.json; critic/rounds/round-06/evidence/gaps/timing/ch4.json; critic/rounds/round-06/evidence/gaps/timing/ch5.json; critic/rounds/round-06/evidence/gaps/motion/trace.json
- **Confidence:** Medium. The measurement is exact and repeated in all five chapters; whether ten seconds is the intended length of the battle-start moment plus the first CTB/ATB fill is a design question I did not find answered in the handoff notes, so this is raised as a question with a number attached rather than asserted as a defect.
- **Smallest fix:** Confirm the intended length with the presenter's owner; if it is not intended, let a confirm press end the battle-start moment the way the cutscene skip already works.
- **Acceptance check:** Either the handoff records the opening beat's intended length and the measurement matches it, or a confirm press during the battle-start moment brings the first command menu forward, measured in all five chapters.
- **Repair attempts so far:** 0

### 28. PR-0062 — POLISH · `process` · FFX-2

**The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody**

- **Chapter / state:** ffx2-vegnagun-shuyin, link 2 · the reviewer's own instrumentation, not the product
- **Requirement:** RUBRIC §5: match proof to the claim — a seeded engine fixture cannot stand in for the shipped seeding.
- **Expected:** A seed that makes the bench land Berserk makes the shipped chapter land it, so the player-facing half of PR-0052 can be captured.
- **Observed:** Two facts block that capture and both belong in the record. (1) z06-passes and z06-berserk construct an isolated vegnagun-leg battle with engine.setSeed(n), while in shipped play each link is seeded from the chapter run (docs/DEV.md: engines are seeded per battle via BattleSetup.seed), so __pyrefly.setSeed(13) before chapter 5 is not the bench's seed 13. The seed-finder confirms the bench-side hits (seeds 3, 13, 27, 36, 38 put Yuna in White Mage under Berserk, earliest at turn 8) but they address the fixture, not the game. (2) Twenty in-game seeds (1-20) were swept, skipping link 1 and watching link 2 at normal speed, polling battleState about every 300 ms. The Leg link was reached in all 20 runs and Berserk was applied to nobody in any of them, although the AI path is live (src/battle/ffx2/ai/vegnagun.ts:72-87 rolls 1-in-3 Berserk / Break / Slow, and Slow was observed landing on Yuna on link 2 in a diagnostic run) and the bench predicts Berserk on a party member in about 6 of 24 isolated Leg battles. A false hypothesis was chased and discarded: legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", but re-running z06-legai proves the unprefixed ids do fire (19 leg-berserk casts over 24 seeds), so there is no id-resolution bug.
- **Repro:** critic/rounds/round-06/gap-berserk.mjs and gap-berserk2.mjs (in-game sweep); critic/rounds/round-06/bench/z06-gap-seeds.test.ts (seed finder).
- **Evidence:** critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep2.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-seed13.json; critic/rounds/round-06/bench/out/z06-gap-seeds.txt
- **Confidence:** High on both measurements. The discrepancy between 6-in-24 predicted and 0-in-20 observed is unexplained and is the thing to reconcile; it may be the harness's sampling, the chapter seeding, or a real difference between the fixture and the shipped link.
- **Smallest fix:** Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.
- **Acceptance check:** A named seed makes the shipped chapter 5 link 2 land Berserk on Yuna in White Mage, and the resulting turn is captured at 1600x900.
- **Repair attempts so far:** 0

### 29. PR-0054 — POLISH · `combat` · FFX-2

**The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference**

- **Chapter / state:** ffx2-vegnagun-shuyin, link 2 · the Leg's Action1 when every party member already carries the rolled status
- **Requirement:** AGENTS.md hard rule 6: numbers and behaviour come from research/*.md with their source notes; unsourced behaviour is left alone and said so.
- **Expected:** Each of the three Action1 branches behaves as its source line states, and anything extrapolated is marked as an inference.
- **Observed:** research/ffx2-vegnagun-shuyin.md:708-711 gives the Absorb fallback explicitly for two of the three branches — "1/3: Berserk on a non-Berserked char (if all Berserked -> Absorb)" and "1/3: Slow on a non-Slowed char (if all Slowed -> Absorb)" — and gives no fallback for "1/3: Break on a non-Petrified char". src/battle/ffx2/ai/vegnagun.ts:82-85 applies the same Absorb fallback to all three, and the function's doc comment cites §5.2 for the whole rule including the Break case. The extrapolation is reasonable and probably right; it is not marked as one.
- **Repro:** Read research/ffx2-vegnagun-shuyin.md lines 708-711 against src/battle/ffx2/ai/vegnagun.ts legAction1 (lines 72-87).
- **Evidence:** research/ffx2-vegnagun-shuyin.md:708-711; src/battle/ffx2/ai/vegnagun.ts:72-87
- **Confidence:** High on the divergence (both texts read directly). Low player impact: reaching the state needs all three girls already Petrified.
- **Smallest fix:** Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.
- **Acceptance check:** The comment at src/battle/ffx2/ai/vegnagun.ts distinguishes the two sourced fallbacks from the inferred one, or a source line is cited for the Break case.
- **Repair attempts so far:** 0

### 30. PR-0053 — POLISH · `combat` · FFX-2

**A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation**

- **Chapter / state:** ffx2-vegnagun-shuyin · not consolidated
- **Requirement:** RUBRIC §8: every finding carries expected versus observed, repro, evidence and a fix. This one does not, and is recorded as a tracked gap rather than written up from guesswork.
- **Expected:** Every issue the round raised reaches the report with its full record.
- **Observed:** The combat auditor's category evidence names "the polish-level data divergence PR-0053" beside PR-0052 and PR-0054, but the detailed record did not survive consolidation and nothing in critic/rounds/round-06/bench/ or its output restates it. The changed values that WERE re-audited all match their sources: BERSERK_MULTIPLIER 1.25 (correctly not FFX's 1.5), leg-berserk chance 75, duration 133 ticks = 211,470 = 70.49 s against §2.8's stated 70.5 s, and hasAttack === false for exactly black-mage, songstress and white-mage. So whatever the divergence is, it is not among those.
- **Repro:** n/a — the record is missing, not the behaviour.
- **Evidence:** critic/rounds/round-06/bench/out/z06-all.txt; the combat-encounter auditor's category evidence in this report
- **Confidence:** UNVERIFIED as a product defect. The ID is reserved and open so it is not silently lost; recover the record from the combat auditor's evidence before any repair, and close it as withdrawn if it cannot be restated.
- **Smallest fix:** Recover or re-derive the record before the next batch; do not repair anything on this entry alone.
- **Acceptance check:** The issue is either restated with expected, observed, repro and evidence, or closed as withdrawn.
- **Repair attempts so far:** 0

### 31. PR-0022 — POLISH · `visual` · FFX observed; FFX-2 unverified

**A KO'd party member rests as a 90-degree rotated billboard floating at torso height**

- **Chapter / state:** 1 · battle, Yuna at 0/1500
- **Requirement:** RUBRIC section 6 visual (poses, ground contact); the approved 'Yuna, battle poses' tile.
- **Expected:** A downed character lies on the ground plane with her ground decal, reading as 'down'.
- **Observed:** Yuna at 0 HP is drawn horizontally, rotated about 90 degrees, hovering at roughly the standing characters' torso height, well above the snow, and held in that pose across two frames 4.0 s apart, so it is the resting KO state and not a transient fall frame. It reads as 'falling forever'.
- **Repro:** Chapter 1, 1600x900, GPU: play until a party member is KO'd and capture two frames several seconds apart.
- **Evidence:** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-03.png (t=0) and -07.png (t=4048 ms); the same character upright and grounded at 711 HP in clips/seymour-flux-player-attack-06.png
- **Confidence:** high
- **Smallest fix:** Land the KO billboard on the ground plane - drop its anchor to the feet line and keep its ground decal - instead of rotating it in place about its centre.
- **Acceptance check:** In both games, a KO'd member's quad has its feet on the ground plane with its decal present, at 1600x900 and 2000x1012.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 32. PR-0034 — POLISH · `visual` · FFX

**The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow**

- **Chapter / state:** 1 (Mt. Gagazet) · battle versus the pre-battle scene, 1600x900
- **Requirement:** The approved scene tile 'Ch.1 Mt. Gagazet'; CHK-013 judges art inside the running game.
- **Expected:** The moonlit canyon of the approved tile.
- **Observed:** The shipped gagazet.png is byte-identical to the approved copy and renders faithfully under the pre-battle scene camera, where the composite is a close match. Under the battle camera the same painting is darkened and desaturated to a flat navy wall: the moon and the lit snow floor are gone, and a backdrop-only patch measures mean luminance 70 against the source painting's 114, so the arena reads as a dark cave.
- **Repro:** Capture Chapter 1's pre-battle scene and its battle at 1600x900 and pair both with docs/screenshots/concept-gagazet.png.
- **Evidence:** critic/rounds/round-04/targets/presentation-dialogue.jpg (scene camera, faithful); targets/scene-ch1-gagazet.jpg (battle camera, flattened)
- **Confidence:** high for Chapter 1, the only scene with the same painting under both cameras
- **Smallest fix:** Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.
- **Acceptance check:** Re-pair the tile from a battle frame: the moon and the lit snow are present and the backdrop patch's mean luminance is within about 10 percent of the source painting's.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 33. PR-0035 — POLISH · `visual` · FFX-2

**The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile, and Bahamut is under-lit**

- **Chapter / state:** 4 · battle, command menu open, 1600x900
- **Requirement:** RUBRIC section 7; AGENTS.md rule 14 (decide from the sources, and if they do not say, ask).
- **Expected:** Either the approved tile's composition, or a recorded decision that the mirror is intentional.
- **Observed:** The field is mirrored - Bahamut sits right of centre and the party stand left - and Bahamut is rendered much darker and lower-contrast than in the approved tile, where his red wings and purple armour carry the left third. Neither docs/handoff/presentation-ink-and-gold.md nor research/ffx-vs-ffx2-presentation.md states a party/enemy side convention, so whether the mirror is intended cannot be decided from the sources.
- **Repro:** Pair the Chapter 4 battle capture with the approved tile.
- **Evidence:** critic/rounds/round-04/targets/presentation-battle-ffx2.jpg
- **Confidence:** high on the observation; the intent is unknown
- **Smallest fix:** Ask Bailey once whether the FFX-2 field keeps the approved left-enemy composition or the mirrored one and record the answer against the tile. Either way, raise Bahamut's key light so he reads against the dark Bevelle backdrop as he does in the tile.
- **Acceptance check:** The tile carries a recorded decision and the composite matches it.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 34. PR-0036 — POLISH · `visual` · FFX-2

**The FFX-2 party crowds the left third of the stage while two thirds of it is empty**

- **Chapter / state:** 4 · battle staging, 1600x900
- **Requirement:** RUBRIC section 6 visual (composition, staging, ground contact).
- **Expected:** A composition comparable to the FFX chapters, which stage their party noticeably larger and further apart.
- **Observed:** Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.
- **Repro:** Chapter 4, first ATB turn, 1600x900.
- **Evidence:** critic/rounds/round-04/evidence/shots/ffx2-bahamut-04-enemy-intent.png, ffx2-bahamut-03-battle-menu.png
- **Confidence:** high
- **Smallest fix:** Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.
- **Acceptance check:** Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 35. PR-0026 — POLISH · `interface` · FFX (the string); sweep the other four guides

**Developer vocabulary on screen: 'Haste is ctb x 8/16'**

- **Chapter / state:** 1 · strategy guide NEXT blurb, any size
- **Requirement:** critic/CHECKS.md CHK-007. Same class as the section marks and row numbers Bailey reported on 2026-09-18.
- **Expected:** A sentence a player who has never opened the repo understands.
- **Observed:** The guide prints 'Haste is ctb x 8/16 - roughly double the party's share of the clock, and the CTB margin the Holy Water rhythm needs to beat the mount's Full-Life'. The tick notation is the first thing in the sentence and the literal is in the shipped bundle.
- **Repro:** Chapter 1, first player turn, guide showing, any size: read the NEXT blurb.
- **Evidence:** critic/rounds/round-04/evidence/shots/seymour-flux-legibility-2000x1012.png; src/data/guides/seymour-flux.ts:58; the string is present in dist-gate/assets/index-TzQM1lX4.js
- **Confidence:** high
- **Smallest fix:** Reword the opening clause in plain English ('Haste halves the time between his turns') and keep the tick arithmetic in the tactics file's own comment; sweep the other four guide files for the same class.
- **Acceptance check:** A visible-text sweep over all five chapters' guide panels finds no 'ctb', no bare multiplier, no section mark and no file stem.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 36. PR-0027 — POLISH · `interface` · FFX for the string; the guard is shared

**Unrendered markdown reaches the screen: 'the target *she* last picked'**

- **Chapter / state:** 2 · enemy-intent panel, IF YOU ATTACK list
- **Requirement:** critic/CHECKS.md CHK-007.
- **Expected:** Emphasis rendered, or the asterisks removed.
- **Observed:** The bullet prints the literal asterisks: 'Her Blind/Silence gate reads the target *she* last picked, not your attacker'. 'gate' is also engine-speak in a sentence otherwise written for players. The research citation on the same string is correctly stripped, so only the emphasis markup leaks.
- **Repro:** Chapter 2, first player turn, press E, 1600x900, read the second bullet.
- **Evidence:** critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png; src/battle/ffx/intent.ts:355
- **Confidence:** high
- **Smallest fix:** Drop the asterisks and reword 'gate' to 'counter'; if emphasis is wanted, let the panel's plain() helper turn a paired asterisk run into a span, and assert no rendered intent line contains an unpaired asterisk.
- **Acceptance check:** A visible-text sweep of all five chapters' intent panels finds no asterisk, underscore pair or backtick, and no 'gate' meaning a counter rule.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 37. PR-0028 — POLISH · `interface` · both

**H does not hide the panels it is labelled for during battle**

- **Chapter / state:** 1 to 5 · battle, after pressing H, 1600x900
- **Requirement:** RUBRIC section 6 interface (pause and prep usability, cleanup); it also blocks CHK-013's scene-tile evidence.
- **Expected:** Either H hides every optional panel in battle, or its legend says what it actually hides.
- **Observed:** In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.
- **Repro:** Any chapter, battle, press H, 1600x900; then Esc and press H on the pause screen and compare.
- **Evidence:** critic/rounds/round-04/evidence/shots/ch1-07-hide-panels.png, ffx2-bahamut-04-hide-panels.png, ffx2-vegnagun-shuyin-04-hide-panels.png; gaps/g-ch1-backdrop-panels-off.png
- **Confidence:** medium - the observation is certain; whether the narrower scope is intended is not stated anywhere
- **Smallest fix:** Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.
- **Acceptance check:** Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 38. PR-0029 — POLISH · `interface` · FFX

**Yu Pagoda A and B carry no always-on field marker**

- **Chapter / state:** 3, battle 1 of 7 · battle, first player turn, 1600x900
- **Requirement:** critic/CHECKS.md CHK-011 (every targetable enemy has an always-on marker).
- **Expected:** The CTB's A and B can be mapped to the painted enemies without opening the picker.
- **Observed:** The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter.
- **Repro:** Chapter 3, first player turn, 1600x900: compare the CTB tiles with the field.
- **Evidence:** critic/rounds/round-04/evidence/shots/braskas-final-aeon-03-battle-menu.png; crops/ch3-pagodas.png
- **Confidence:** high
- **Smallest fix:** Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.
- **Acceptance check:** In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 39. PR-0041 — POLISH · `interface` · FFX-2

**FFX-2 items were unreachable through the command menu for 17 and 12 consecutive turns in the review's harness**

- **Chapter / state:** 4 and 5 · battle, ITEM submenu
- **Requirement:** CHK-015 (a player-facing behaviour is proved with the player's own input) and CHK-020.
- **Expected:** The ITEM row opens its submenu and a Potion or Phoenix Down can be used, as it can in FFX.
- **Observed:** logs/ffx2-bahamut-run.log records 'revive with a Phoenix Down failed (unreachable); rows=ATTACK|SKILL|CHANGE|ITEM' on every turn from 22 to 38, and ffx2-vegnagun-shuyin-run.log records 'heal with a potion failed (unreachable)' on every turn from 3 to 13. The ITEM row is present in both. In FFX the same harness used Potion, Hi-Potion, X-Potion, Phoenix Down and Eye Drops successfully. The asymmetry is what makes it worth checking rather than dismissing.
- **Repro:** Not reproduced by hand. Open Chapter 4's ITEM submenu with real arrow keys and try to use a Phoenix Down.
- **Evidence:** critic/rounds/round-04/evidence/logs/ffx2-bahamut-run.log, ffx2-vegnagun-shuyin-run.log, yunalesca-eventlog.json
- **Confidence:** low - a harness observation with a plausible harness explanation
- **Smallest fix:** None proposed until reproduced by hand. Reproduce with real arrow keys first; if the submenu does open for a human, fix the harness and say so.
- **Acceptance check:** A hand or scripted real-key run uses an item from the FFX-2 ITEM submenu in both FFX-2 chapters, or the defect is reproduced and traced.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 40. PR-0037 — POLISH · `narrative` · FFX observed; the same shape exists in the other chapters' midScripts

**Mid-battle beats hard-code speakers who are not in the active formation**

- **Chapter / state:** 1, beat 'first-zombie' · battle, story beat playing
- **Requirement:** RUBRIC section 6 narrative (character voice, reachable scenes).
- **Expected:** The characters on the field speak.
- **Observed:** The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.
- **Repro:** Chapter 1: play until a party member is Zombied and read the speaker card.
- **Evidence:** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png; src/story/scripts/seymour-flux.ts:278-281; src/data/ffx/builds/gagazet.ts:424-425
- **Confidence:** high
- **Smallest fix:** Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.
- **Acceptance check:** Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 41. PR-0039 — POLISH · `audio` · both - scene-gagazet and scene-dreams-end are FFX cues, scene-farplane is FFX-2; the cause is shared renderer plumbing

**3 of 21 shipped cues have no tempo map, so written rubato cannot bend the pulse**

- **Chapter / state:** the pre-battle scenes of chapters 1, 3 and 5 · shipped audio
- **Requirement:** docs/audio/THEMES.md.
- **Expected:** docs/audio/THEMES.md's renderer request #1: a lyrical cue carries a tempo map so rubato can move the pulse, or it is listed in TEMPO_MAP_EXEMPT with a stated reason.
- **Observed:** node tools/audio/themes-audit.mjs scene-gagazet scene-dreams-end scene-farplane --verbose marks all three FAIL, in each case solely on 'no tempo map on a lyrical cue'. Every other check for the three is a note or expected. Predates Build A.1 and is not a regression.
- **Repro:** Run the command above in D:/pyrefly-release.
- **Evidence:** themes-audit output captured this session; git log 7191674..HEAD -- src/audio tools/audio public/audio confirms these tracks and the tool are unchanged since the round-03 baseline
- **Confidence:** high on the technical finding; whether it matters musically is Bailey's ear (CHK-B1)
- **Smallest fix:** Implement THEMES.md's requested Track.tempo?: Array<[beat, bpm]> with linear interpolation and give these three a written tempo curve; or, if an arranger judges a static pulse acceptable for one of them, add it to TEMPO_MAP_EXEMPT with a reason as boss-dread and scene-bevelle-underground already are.
- **Acceptance check:** themes-audit reports no tempo-map failure across the 21 cues, and Bailey signs off the re-rendered cues in an audition tour.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 42. PR-0032 — POLISH · `onboarding` · both

**No text size, no key remapping, and no in-game motion or flash accommodation**

- **Chapter / state:** all · pause > OPTIONS
- **Requirement:** RUBRIC section 6 onboarding (usable settings, text and input access, motion and flash accommodations). Open since round 03.
- **Expected:** A player can enlarge the interface text, rebind the keys, and turn motion and flashing down from inside the game.
- **Observed:** Unchanged, and this candidate widens it: with ONBOARDING_LIVE = false there is no in-game help at all, on top of the accessibility gaps round 05 recorded. No text size control, no key remapping, no motion or flash accommodation.
- **Repro:** Chapter 1, Esc, OPTIONS, read the rows. Source- and bundle-level this round; the rendered panel was not captured.
- **Evidence:** src/app/screens/PauseScreenPanels.ts:198-220; src/app/SaveData.ts:63-64,175,182-185; critic/rounds/round-04/evidence/shots/ch1-08-pause-esc.png
- **Confidence:** high for what the build contains; the rendered OPTIONS panel is unverified this round
- **Smallest fix:** Needs an end state from Bailey before it is built, because it changes a screen he will see (AGENTS.md rule 9). The cheapest step that needs no new decision is to surface the reduceMotion flag the game already reads as a seventh OPTIONS row, since the behaviour behind it already ships.
- **Acceptance check:** Open OPTIONS in both games at 1600x900 and 2000x1012, move to the motion row with real arrows and toggle it, and assert from the game's own snapshot that reduceMotion flipped and the transition CSS stops animating on the next screen change.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 43. PR-0033 — POLISH · `onboarding` · both

**The defeat screen has no approved target and tells the player nothing about why they lost**

- **Chapter / state:** all · results screen, Defeat variant
- **Requirement:** docs/target/targets.json lists 'Defeat screen' as a gap awaiting a decision; AGENTS.md rule 9.
- **Expected:** targets.json's own gap entry: 'the pull to play again comes from the fight itself, so a loss says why in plain words'.
- **Observed:** After a loss the screen shows the word Defeat, TURNS, ATTEMPTS, BEST / NEVER CLEARED and RETRY / CHAPTER SELECT; in FFX the right half is empty black (PR-0003). It never names what killed the party, which objective went unmet, or what to try differently - and in this review the party lost eleven times across four chapters with no guidance between attempts.
- **Repro:** Lose any chapter and read the screen.
- **Evidence:** critic/rounds/round-04/evidence/shots/ch1-16-results.png, ffx2-bahamut-09-results.png
- **Confidence:** high
- **Smallest fix:** Take the defeat screen through the standing end-state process: two to four options for Bailey before anything is built. Nothing here should be implemented without that pick.
- **Acceptance check:** An approved defeat-screen tile exists in targets.json and the build matches it.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

### 44. PR-0044 — SUGGESTION · `visual` · both (15 of the 16 are FFX-2 dresspheres)

**16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them**

- **Chapter / state:** n/a · public/art/manifest.json
- **Requirement:** critic/CHECKS.md CHK-014.
- **Expected:** Every subject declares its facing so the sign assertion can run per chapter formation.
- **Observed:** paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.
- **Repro:** Read D:/pyrefly-release/public/art/manifest.json.
- **Evidence:** D:/pyrefly-release/public/art/manifest.json
- **Confidence:** high
- **Smallest fix:** Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.
- **Acceptance check:** Every manifest subject carries a facing and the per-formation sign assertion runs green.
- **Carried forward from** round-05.json @ 740ab21. *Dependency argument:* git diff --stat 740ab21..c71cd82 lists only src/battle/ffx2/{engine,targeting}.ts, src/ui/ffx2/FFX2BattleHud.ts, src/ui/coach/**, src/ui/common/{StrategyGuide.ts,strategy-guide.css,DialogueBox.ts,face-crops.json}, src/app/screens/{PauseScreen,TitleScreen}.ts, the eight new portraits, docs, critic files and critic/runner/release.js. Nothing this finding depends on changed, and the shipped art is hash-identical (102/102 approved files verified on this candidate).
- **Repair attempts so far:** 0

## What stands between this build and acceptance

The 9.60 bar needs every category at 9.0 or better, no UNVERIFIED category or mandatory check, no open critical or major defect, every encounter through its real flow, and every required target matched. This build is a long way from all five, and the distance is honest rather than surprising:

1. **Nine categories sit below the 9.0 floor**, and one (`audio`) has no number at all. `onboarding` at 4.6 is the widest gap, and it closes in one commit: the feature exists and is repaired, it is switched off pending Active ATB.
2. **Twenty-six major defects are open.** Two of them (PR-0007, PR-0008) have been open at the same severity for three consecutive reviews and now owe a written method check under RUBRIC §8 instead of a third repair attempt; PR-0021 owes one after two.
3. **Three mandatory checks FAIL** — CHK-012 (an approved tile with no producible acceptance case, and ten speakers with no face), CHK-016 (the review's own harness wrote three claims its data does not support), CHK-020 (the FFX-2 menu still has no help slab).
4. **Nineteen of 46 required targets are not matched**, and eight more wait on a decision Bailey has not been asked for.
5. **No victory has been reached on fully real input**, and no FFX chapter has reached a victory at all — so the FFX aftermath, four narration interludes and 33 victory quips remain unjudged as things a player experiences.
6. **Six human judgments are not recorded**, including the two that no agent can supply: an audio listening score and a feel assessment.

None of that blocks *this* build from shipping. It already has: `fd0ae96` carries this product code and went live under Bailey's own override. Under the release rules he approved on 2026-09-21 the question for a candidate is narrower — is it better than what is live? On this evidence it is: it closes a critical, repairs a chip collision and a legibility floor, and adds eight approved portraits, against one new major inside a brand-new engine branch. The changed-area verdict is FAIL because a change that repairs a critical and introduces a major in the same subsystem has not met its target, and that is a different question from whether it ships.

## What changed since round 05

Round 05 judged `740ab21` and failed the changed area on new defects. This round judges `c71cd82`, five commits later, and the comparison is like-for-like under rubric v2. (Rounds 02 and 03 were scored under rubric v1 and their A/B/C numbers are history under another rubric; nothing here is compared with them.)

- **Round 05's critical is closed.** PR-0045 is repaired and re-proved three independent ways, including 48 runs of the reachable chapter 5 link that round 05 could not finish on 2 of 24 seeds.
- **Three of round 05's four onboarding defects and its chip collision are repaired** — and the onboarding ones ship switched off, so the player sees none of it.
- **The guide column cleared the 14 px floor** in both games at both desktop sizes, which was the scope of that repair.
- **Eight owner-picked portraits shipped**, hash-correct, seven of them captured rendering for their own speakers, and Paine stopped being a letter.
- **Two categories got their first numbers**: `feel` (round 05 had no motion evidence at all; this round has 60 fps on named hardware, three clips and per-chapter transition timings) and `narrative` (round 05 had no reachable aftermath; this round has two).
- **One suspected major was refuted rather than carried.** The advisor card does track the acting girl; the 301 identical samples were a hidden, stale DOM node.
- **One new major landed in the repaired branch**: PR-0052, the silent Berserked turn.
- **`onboarding` fell from 7.2 to 4.6**, because the score follows what ships, not what compiles.

## Proposals (nothing here is built without Bailey's yes)

Unscored. Each is an idea with its benefit, cost, source-game fit and risk; none is a finding and none affects the score above.

- Give the advisor one state guard, in src/engine/tactics/advisor.ts, that drops any recommendation whose simulated resolution changes nothing measurable — no status-add, no damage, no healing, no cure. It closes both halves of PR-0006 (the KO/Zombie case round 05 traced and the already-active-buff case this round measured) with one change, is game-agnostic so it satisfies AGENTS.md rule 14 as "both", and needs no new data. Cost: small. Risk: it changes advice the player sees, so it needs one real-keyboard route per game to confirm the new picks are better, not merely different.
- Make the class of defect behind PR-0045 and PR-0052 impossible rather than fixing instances: a shipped invariant that a living, non-removed unit always receives at least one submittable row AND that every resolved turn emits a named action. Carried from round 05 and now better argued — round 05 saw the empty menu, round 06 saw the silent turn, and both come from the same missing rule. Cost: small. Needs Bailey's yes only because it adds an engine-level rule.
- Put the §2.8 / §3.4-3.6 Berserk conflict to Bailey once, with the two readings written out: §2.8 says a Berserked character can only use the basic Attack command, and §3.4-3.6 say White Mage, Black Mage and Songstress have no Attack command at all. research/ does not settle it. The builder was right to refuse to invent a damage row; this is the owner's call and it decides what PR-0052's fix does.
- Put the ten portrait-less FFX-2 speakers to Bailey as an options round at the mockup rung: (a) portraits for the recurring cast, Lenne first because she carries chapter 5's climax, or (b) an authored faceless card variant in the Ink & Gold language. Today the slot draws a grey rectangle across the game's most emotional scene. Nothing is built until he picks (AGENTS.md rules 9 and 10).
- Budget one scripted real-input VICTORY per game in the next review — chapter 3 (median 9 player turns on the sourced Candle of Life exit) and chapter 4 (8/8 seeds on the intended line). Two routes would close PR-0043, put the FFX aftermath in front of a player for the first time, and give the reward and retry paths their first real-input evidence. Carried from round 05 and half-delivered this round by the gap pass.
- Fix the review harness rather than the reviewer: play.mjs samples one speaker per chapter and then skips, the command-row selector matches nothing, supp.mjs asserts a state it never reads, and gap-audio.mjs reads a field the debug API does not return. This is the second consecutive round with an evidence-integrity finding. A half-hour on lib.mjs would stop it recurring and would shorten every future round.
- Expose the per-link seed a chapter actually used through the debug API, so a bench seed can be reproduced in play (PR-0062). Without it, any engine finding that needs a browser capture to complete it stalls, as PR-0052 did.
- Re-word or retire the Yu Yevon speaker-portrait tile (PR-0060). As written it can never be matched, so it will keep failing the target gate for a file that exists and works as a 404 safety net. This is an owner decision about the board, not a code change.

## Next required review

Two things are owed immediately and they are not the same thing. (1) A LIVE review (CHK-017) of https://baileypillon.github.io/pyrefly-reprise/ against the fd0ae96 artifact manifest, plus a real-input smoke of the changed flow: fd0ae96 went live under Bailey's owner override with its live, focused and deep obligations all pending, and this report is the deep evidence for its product code but cannot settle a marker for a different sha. (2) A paper preflight for the FFX-2 Active ATB candidate before it is built (RUBRIC §4: node tools/critic-plan.mjs --paths will class a combat-core change as deep), then a focused review of that candidate and its deep review after the deploy under release rule B. The Active ATB build is also what un-darkens the onboarding, so it carries PR-0046 and the three onboarding tiles with it. Separately, under RUBRIC §8, the next batch in chapter 1 starts with a written method check, not a third repair attempt, because PR-0007 and PR-0008 have now been open at the same severity across rounds 04, 05 and 06; the same applies to PR-0021 after two rounds.

---

*Written by the chief critic from this round's evidence under `critic/rounds/round-06/`. Category numbers for `combat`, `encounter` and `visual` are the specialist auditors' and are adopted as given; the other seven are the chief critic's, set from the round's evidence and the deduplicated issue list, and each says what it rests on. Round 05 took 380 minutes; the brief asked for about a third of that. 148 minutes is the sum of the per-check minutes recorded above plus each agent's own estimate: capture owner about 62, combat-encounter auditor 38, visual-targets auditor 34 (overlapping, run in parallel), gap pass about 30, confirmation pass about 12, chief critic about 40. Repeated work avoided: every unchanged FFX mechanic, every boss value, the staging and facing passes and 24 of the 44 issue records were carried under a written dependency argument instead of re-measured, and the five unchanged chapters were not re-audited beyond the changed flows.*
