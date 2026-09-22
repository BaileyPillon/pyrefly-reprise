# Critic round 08 — deep review of the live build (rubric v2)

```text
Build / artifact / target version: main 1b33971 · bundle BvhtVfzJ · artifact f29a55dfea95b61e35a26c0a676790d40bf778a90937361de1976271350621bf · targets 68cc931043ce814d
Review: deep (of the LIVE build, https://baileypillon.github.io/pyrefly-reprise/)
Deployment: PASS
Changed area: FAIL
Ship: HOLD — PR-0076 and PR-0080 are regressions against the live build at major severity, both from the Active ATB change. Disclosed: PR-0077, FOC-05, FOC-06, PR-0075, PR-0078, PR-0079, PR-0081, PR-0082 and 32 carried majors.
Milestone: not assessed
Quality: PROVISIONAL — 8.05 over the 90 weight that is scored; audio is UNVERIFIED for a third round and is never averaged away.
Targets: required 30 / matched 13 / failing 7 / unverified 10 / waiting on a decision 5
Top issues: PR-0076, PR-0080, PR-0077, PR-0075, PR-0078, PR-0079, FOC-05, FOC-06, PR-0006, PR-0008
Coverage: all five chapters entered and finished with real input on the live bundle (235 entries, 209 injected:false); the unit suite and four front-end findings reused with a written dependency argument; audio, chapter 3 appearance, the advisor on-screen half and every non-Chromium platform not tested.
Next required review and why: the next deploy owes live + focused, and its focused review must carry the ship verdict for PR-0076 and PR-0080. Release 09 (Leblanc) is a new chapter and is deep by rule, after its deploy.
Elapsed review time / repeated work avoided: 165 minutes across the capture owner, three auditors, a gap pass and an independent confirmer. Avoided: a second full playthrough per auditor — one capture session owned the browser and every other reviewer read its validated evidence.
```

## Score

`node tools/critic-score.mjs --report critic/rounds/round-08.json`, verbatim:

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
  - mandatory check CHK-B1 is UNVERIFIED
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is FAIL
  - mandatory check CHK-004 is UNVERIFIED
  - mandatory check CHK-005 is UNVERIFIED
  - mandatory check CHK-007 is UNVERIFIED
  - mandatory check CHK-008 is FAIL
  - mandatory check CHK-009 is UNVERIFIED
  - mandatory check CHK-011 is FAIL
  - mandatory check CHK-016 is FAIL
  - mandatory check CHK-020 is FAIL
  - mandatory check CHK-022 is UNVERIFIED
  - 40 critical or major issue(s) remain open
  - 7 required target(s) failing
  - 10 required target(s) unverified
  - 5 required target(s) waiting
  - only 13 of 30 required targets matched
  - human judgment not recorded: Audio for build 1b33971
  - human judgment not recorded: Whether the Active trade is worth its price in chapter 5
  - human judgment not recorded: The KO treatment, the phone layout, the defeat screen and the chapter 1 difficulty
report: valid evidence
```

The tool publishes no total while a category is unverified, and it is right not to. For orientation only, and not as acceptance: the nine scored categories carry 90 of the 100 weight and sum to 724.5, i.e. **8.05 provisional**. The gap to the 9.60 finished-milestone standard is not a decimal problem — it is 40 open majors, seven failing targets and a category nobody but Bailey can score.

## The ten categories

### combat — **8.9**

Scored on the live build's own code, re-run rather than reused: src/battle is byte-identical between main 1b33971 and the tree the auditor ran (git diff --stat 1b33971 HEAD -- src/battle is empty), so the full suite transfers — 225 files / 5,355 tests passing, 2 skipped, 50.3 s, exit 0. GAINS, all independently verified. (1) Active ATB is proved RUNNING on the live artifact for the first time in any round: chapter 5's real-input log carries 88 atb snapshots whose engine elapsedMs runs 0 -> 36,030 ms across 35,610 ms of hand play, ratio 1.012, including under an open menu — that settles round 07's PR-0068. (2) The measurement carries its own regression control (PYREFLY_MEASURE=1 ffx2-active-measure reproduced the handoff table exactly, D=0 with zero invalidations and zero refusals). (3) A silent critical the builder's own verifier found — a command executing as a different girl when its owner was KO'd in the same pump step — is closed at two levels with a mutation check. (4) The FFX Nul change is properly sourced (research section 7.5.1, two structured sources with access dates) and party-wide spells correctly never bounce. (5) eject now actually removes a girl from the field. (6) Hard rule 5 observed in play, not in a unit test: 85 miss events across three FFX chapters at three seeds, none after a non-physical action. (7) FFX-2 ATB constants match research/ffx2-combat-core.md value for value. (8) PR-0052 is genuinely fixed, and the new damage-cap / hpFloor / onTargeted runtime fields are set only by the Macalania and Evrae scripts, so chapters 1-5 cannot reach them. AGAINST: one newly proved major in a core path (PR-0075, FFX-2 ally-targeted healing and items roll the enemy hit check and miss on the ally's own Evasion, with the item spent anyway — 96 % for Yuna healing herself, observed on two live event streams); PR-0069 re-confirmed open and now shown unimplementable as documented; PR-0054 unchanged; the Automatic Wait alignment is structural rather than sourced; and four files pushed further past the 400-line house limit. 8.9, one tenth above round 07 on an unchanged engine: the Active work is high quality, measured and proved live, and PR-0052 is closed, but a wrong-mechanic major in the healing path and two carried combat defects keep it well short of 9.0.

### encounter — **8.6**

Win rates re-measured on this build's code, seeded, 40 contiguous seeds per chapter: chapter 1 26/40 (65.0 %), chapter 2 39/40, chapter 3 39/40, chapter 4 40/40, chapter 5 40/40 at D=0. Credible mistakes still lose and canonical tactics are not punished for being strong: killing the Mortiorchis first loses on all four canonical seeds; curing Zombie at Yunalesca loses to Mega Death; mashing Attack into Bahamut's Defense 160 wins 0/30 and no-mitigation Darkness 0/30; attacking the Nodes instead of the Leg leaves 18,220 HP on the Leg and 898,229 of 900,000 Node HP standing; the three researched Bahamut survival routes behave as researched. Rewards audited against the data and the research rather than assumed, including the two that look wrong and are right (Shuyin EXP 0 / AP 20 / Gil 0; Braska's Final Aeon 0 AP / 0 gil). The three approved-but-unreleased encounters' data was audited value by value against its research and is exemplary, and their absence from the chapter registry is deliberate and written down at the point of absence, so hard rule 4 is answered rather than tripped. AGAINST: PR-0076, new and introduced by this candidate — chapter 5's shipped intended line goes 40/40 -> 0/40 the moment the player takes any decision time, with 948 menus invalidated across 40 chains at D=1500 and 75 % of them section 1.7 chain locks; and PR-0008 and PR-0007 unmoved for a fifth consecutive review, both re-measured (26/40 against a stated 34/40; 37 of 37 Zombie deaths giving the victim zero turns in between), both STALLED under RUBRIC section 8. Down from 8.9, and the tenth is specifically PR-0076: a shipped chapter whose intended strategy is no longer winnable at human decision speed is an encounter-balance failure, however faithfully it follows Bailey's D-009 pick.

### visual — **7.7**

Judged from validated in-game captures on the live build, PYREFLY_BROWSER=gpu throughout, bundle index-BvhtVfzJ.js confirmed; eighteen target-versus-build composites read at critic/rounds/round-08/targets/. Real gains: the remade Until Dawn pause reproduces its approved sheet (warm grade B, tab strip, two hairline meter columns, objective line, ESC/H hints) across all eight tabs with zero broken images on the member, guide, options, controls and music tabs; every painted actor in chapters 1, 2, 4 and 5 renders recognisably at gameplay scale; protected art is intact (115/115 approved files match). Against: one regression the candidate introduced (PR-0077, three broken image slots on the new pause Chapter tab, which rendered at 8f48237), one newly measured major that predates the candidate (PR-0078, the results hero portrait enlarged to a single eye in both games), a named mustRemain acceptance case missed (PR-0079, pause chrome drawn across Kimahri's face), and eight carried visual majors still reachable on live (PR-0002, PR-0015, PR-0017, PR-0020, PR-0031, PR-0034, PR-0058, PR-0065). Essentially flat against round 07's 7.8: the pause remake and the restored art round 4 are a real gain, cancelled by a shipped regression, and the two newly measured defects were already present at 8f48237 and are not double-counted as a drop. Anchor 7 (functional with conspicuous weaknesses) with polish above it; not 9, because conspicuous weaknesses are visible on the first screen of every chapter and on every results screen. Chapter 3 carries no usable in-battle or post-scene capture this round, so part of the tested scope is unknown and the number is provisional to that extent.

### feel — **7.8**

Scored by the chief critic on this round's own measurements; no separate feel auditor ran. Frame pacing on named hardware is healthy and is now on record (RTX 5070 Ti, ANGLE / D3D11, live build): 59.67 fps at the title, 59.50 at chapter select, 59.63 in a chapter 1 battle, mean 16.8 ms, p50 16.7, p95 16.7 to 16.8, p99 16.8, one frame over 50 ms per six-second window and a 66.7 ms worst frame on the two idle screens. That closes round 07's named-hardware performance gap. Active ATB genuinely adds the pressure the mode is for, and it is the first time the FFX-2 clock has been felt rather than asserted. Against that, three measured costs, two of them sharpened this round: PR-0061, 6.8 to 8.1 seconds per fight before the first command menu accepts input with nothing the presenter logs happening in it, read off the product's own play clock in four chapters and paid again on every retry; PR-0081, chapter 5 at 6:11 of fight at FAST speed with the game's own optimal auto-player, 5.15 s per action against 1.2 to 1.5 s elsewhere; and PR-0080, an open command menu that changes owner in place in 262 ms with no keypress, which is a feel problem as much as an interface one. 7.8, a tenth below round 07: the performance evidence is a real gain and Active is a real gain, outweighed by the two waiting defects now being measured rather than estimated and by the menu swap being new.

### narrative — **7.6**

Scored by the chief critic; no separate narrative auditor ran, and the number is carried from round 07 with a dependency argument plus this round's scene evidence. Dependency argument: the only story-path files in this candidate's diff are src/story/dsl.ts, src/story/registry.ts and src/story/scripts/ffx2-leblanc.ts, and the last two serve the unregistered Leblanc chapter, so the five shipped chapters' scripts are unchanged. This round's own evidence: the pre-battle scenes of chapters 1, 2, 4 and 5 were played with real Enter presses and advance correctly, Escape pauses over a running cutscene, and chapter 4's post-battle scene and its deliberately silent results card were reached and confirmed AUTHORED rather than defective (src/ui/common/resultsMath.ts isSilentResultsChapter, writing-bible section 5.4). Against: PR-0058 (chapter 5 opens with a faceless Nooj) re-confirmed on live, PR-0021 (the authored banter bank has no implementation in either game), PR-0037 and PR-0070 carried and not re-tested. 7.6, unchanged, and explicitly provisional: no narrative-specific auditing was done this round.

### audio — **UNVERIFIED**

No agent can hear (AGENTS.md hard rule 13) and Bailey has not auditioned this build: there is no verdict for 1b33971 in docs/audio/ or in NOW.md, and docs/target/targets.json's waiting list still asks him for a score out of ten. The technical half is clean as far as it goes — all 863 shipped files hash and decode, audioUnverified 0, problems [] — but that proves the files decode, not that they sound right, and it cannot be turned into a category score. Third consecutive round unverified. NOW.md also records Bailey's open complaint that the music is "too reminiscent of snes music instead of the more modern final fantasy titles and clair obscur", which is an owner-reported problem against this build and is NOT answered by anything in it. CHK-001 and CHK-B1 UNVERIFIED.

### interface — **7.6**

Scored by the chief critic from the focused review's re-checks on live plus this round's measurements. GAINS, all verified on the live artifact: FOC-01 to FOC-04 are fixed and re-measured with real input (the FFX first-turn coach mark keeps the command menu, advisor card and a truthful intent panel in one frame; the phone pause tab strip scrolls the selected tab into view; the phone tab tap target is 44 px; the FFX HUD OD label and hide chip clear the 12 px floor). The FE-001 / FE-002 front-end type floor landed. Move advisor v2 landed and its model half is proved at 300+ seeded decisions per chapter in both engines, including Bailey's own reported chapter 1 board. AGAINST: FOC-05 (the coach mark over 67.6 % of the advisor card) and FOC-06 (9.75 px effective advisor type, 2.38 px on a phone) were re-checked on live this round and are both still open, measured twice by two reviewers; PR-0080 is new and serious — the open command menu changes owner in place in 262 ms with no keypress, and the guide and advisor cards were captured naming Rikku while Yuna's list was on screen; and the carried interface majors PR-0001, PR-0006, PR-0010 to PR-0013, PR-0018 and PR-0019 are unmoved. CHK-004 and CHK-005 are both UNVERIFIED, so the advisor's on-screen half is unproved and PR-0006 cannot be closed. 7.6, up three tenths from 7.3 on FOC-01 to FOC-04 and the advisor's model half, held there by two disclosed majors that survived the release and one new one.

### onboarding — **6.4**

Scored by the chief critic. The single largest gap round 07 named is closed: Auron's briefing is switched on and reachable on live (65b57bd, 56011e4) and was captured on a fresh profile, and the FFX first-turn coach mark appears over a live command menu and is dismissed by the one key its own prompt names, leaving the menu unleaked. Approved tiles C1, C2 and C3 all have shipped implementations where round 07 had none. Against: FOC-05 damages the very first turn the onboarding creates, which is the worst possible place for it; the C3 FFX-2 first-use line was not captured this round so its tile is unverified; and the accessibility half is untouched — no text-size control, no key remapping, no motion or flash accommodation (PR-0032), a defeat screen that tells the player nothing about why they lost and has no approved target (PR-0033), and a title that offers exactly one pointer target with keyboard-only hints so a touch player is never invited to tap (PR-0073). 6.4, up from 4.6: a large, real gain on the teaching half, with the accessibility and options half still close to absent.

### prep — **8.4**

Scored by the chief critic on this round's own evidence. Party prep was entered, tabbed, left with Escape and re-entered with real input in every chapter. Four results screens were reached and read at 1600x900 and every row is legible: the chapter 2 defeat card reads RESULTS 0:33, Defeat, TURNS 34, ATTEMPTS 1, BEST — NEVER CLEARED with a per-member AP row (Tidus S.LV 46 - 0/2,181 AP; Yuna S.LV 44 - 0/1,928 AP; Auron S.LV 48 - 0/2,456 AP), and confirming Enter on RETRY reaches party-prep in 3.0 s, so the "one more try from the fight itself" loop works. Rewards are correct and sourced on every victory card audited, including the two that look wrong and are right. Chapter 4's CLEARED banner was reached through real input and the cleared state read back. Against: PR-0078 makes every victory card visually wrong (scored in visual, cross-referenced here), PR-0033 leaves the defeat card explaining nothing, and no upgrade or save-migration path was exercised (CHK-024 not applicable this candidate). 8.4, two tenths above round 07 on the first fully read results screens and the measured retry.

### delivery — **8.2**

Scored by the chief critic. STRONG: the exact artifact is verified live — artifactHash f29a55dfea95b61e35a26c0a676790d40bf778a90937361de1976271350621bf, liveManifest "match", 863 files checked, zero mismatched, missing, wrong-type or errored; every shipped file decode-checked at deploy with problems [] and audioUnverified 0; all five chapters reached and completed through their real flows; named-hardware frame times recorded for the first time (RTX 5070 Ti, 59.5 to 59.7 fps, p99 16.8 ms). AGAINST: the shipped build logs 84 console errors and 84 HTTP 404s in an ordinary review session, three every time a player opens the pause Chapter tab, from a hand-written path that CHK-018 exists to catch (PR-0077); chapter-card to battle is 7.7 s against the stated five-second loading goal (PR-0084); the debug API still empties battleLog() at teardown and still lets autoBattle() no-op before the first menu, which cost this round a gap pass to work around (PR-0071); and the platform line still claims 390x844 with emulated touch while the phone HUD is unreadable and no real phone, real controller, Safari, Firefox or Edge evidence exists. 8.2, down from 8.9: a build that is byte-perfect on the wire and throws 404s on a screen every player opens is not an 8.9 delivery.

## Target gate

| | count |
|---|---:|
| required | 30 |
| matched | 13 |
| failing | 7 |
| unverified | 10 |
| waiting on a decision | 5 |

Scope: the six target groups the plan named (presentation 11 approved tiles, scenes 5, pause 7, fight 6, phone 1). The three approved chapter tiles (Macalania, Evrae, Leblanc) are approved-but-unreleased and locked as Coming, so they are not required by this release and are not counted. MATCHED (13): Style board (reused, no style change), Title (the gold rim is present on live, closing PR-0064), Party prep, Battle start, the four scene tiles for chapters 1, 2, 4 and 5, Panels hidden (H), Party panel, Hero plate chapter 1, Hero plate chapter 4, Onboarding C1 Auron's briefing. FAILING (7): Cutscene dialogue (PR-0020), Battle HUD FFX (PR-0002), Results (PR-0078), Turn cut-in (PR-0005, approved and still unreachable in play), Pause remade on the Until Dawn character screen (PR-0079 mustRemain and PR-0077 broken images), Targeting a spell on the whole party (PR-0031), Onboarding C2 FFX first-use line (FOC-05). UNVERIFIED (10): Chapter select, Swordplay Overdrive, Battle HUD FFX-2, the chapter 3 scene tile, Rebuilt pause 2000x1012, All hero plates, Targeting one Yu Pagoda, Targeting in FFX-2 a Vegnagun part (this round's capture shows the spell list, not the target cursor — CHK-016), Onboarding C3 FFX-2 first-use line, Pause on a phone. WAITING ON A DECISION (5): the five items in docs/target/targets.json's own waiting list — the phone layout, mockups for the move advisor / enemy next-move panel / defeat screen, the three new chapters' concept sheets, a score out of ten for the audio, and the product brief. Comparison method: node tools/end-state-board.mjs --pair, read as composites at critic/rounds/round-08/targets/ (18 pairs).

_No tile is moved to verified by this report. Tiles whose delivery field reads implemented and which this round FAILS (Battle HUD FFX, the Until Dawn pause, Onboarding C2) keep that field; only a passing acceptance case moves one to verified, and this report supplies none._

## Coverage matrix

**Tested**

- All five shipped chapters entered from the title with real keyboard input on the live bundle, and all five reached an outcome, an aftermath and a results screen (235 evidence entries, 209 of them injected:false).
- Real-input coverage of every screen in the flow: title, chapter board, party prep and its tabs, prep-back to the board, pre-battle cutscene and its advance and pause, the battle command menu, submenus, target selection and cancel, the pause screen and all eight tabs, panel hiding with H, the advisor toggle with N, the guide with G, the intent panel with E, the results screen and RETRY.
- Active ATB proved running on the live artifact (88 atb snapshots, engine 0 -> 36,030 ms across 35,610 ms of hand play), plus a headless 40-seed x 3-arm decision-time measurement with D=0 as the regression control.
- Win rates re-measured on this build's code over 40 contiguous seeds per chapter, plus credible-mistake routes and the three researched Bahamut survival routes.
- FFX hit rule verified in play: 85 miss events across three chapters at three seeds, none after a non-physical action.
- FFX-2 ally-target hit path probed over 175 healer-to-ally pairings and 40 battles/chains, and corroborated on two live event streams.
- Exact-artifact verification on the live URL: 863 files, hash match, decode-checked, zero mismatches.
- Named-hardware performance: RTX 5070 Ti, ANGLE / D3D11, three six-to-eight-second frame-time windows with p50/p95/p99 and long-frame counts.
- Approved-art integrity: 115 files across 26 approved sets, 115/115 match.
- Layout measurement at 1600x900, 2000x1012 and 390x844 in both games, through every ancestor transform.
- Eighteen target-versus-build composites read as pairs.
- The full unit suite (225 files, 5,355 tests, 2 skipped, exit 0) plus the four batch-specific test files and the two absence tests.

**Reused, with the dependency argument**

- **The full unit suite result (225 files, 5,355 tests, 2 skipped, exit 0)** — from run in the working tree at 8c646c4 rather than at main 1b33971. git diff --stat 1b33971 HEAD -- src/battle is empty, so both combat engines are byte-identical to the live build's. The only differing product files are the unregistered Leblanc data, chapter-meta, encounters, guides/index, ScenePalettes and tactics/index, none of which is on the import path of chapters 1-5's combat. Settings, seeds and test assumptions unchanged; no related defect open. Labelled as carried forward. Every measurement quoted as this round's own — win rates, the Zombie window, the hit-rule sweep, the ally-heal table, the Active ATB arms — was re-run in this round.
- **Round 07's front-end findings PR-0063, PR-0065, PR-0066 and PR-0067** — from critic/rounds/round-07.json on build 8f48237. The front-end type and first-paint paths are unchanged between 8f48237 and 1b33971. They carry at round 07's severity on round 07's evidence and are labelled NOT RE-MEASURED in each record; they are not counted as this round's own measurements.
- **The narrative category number (7.6)** — from round 07. The only story-path files in this candidate's diff are src/story/dsl.ts plus the unregistered Leblanc script and registry entry, so the five shipped chapters' scripts are unchanged. This round adds real-input scene playback in four chapters and the chapter 4 aftermath, but no narrative-specific auditing; the number is explicitly provisional.
- **Round 07's carried polish and suggestion issues (PR-0026 to PR-0044, PR-0053, PR-0060, PR-0062, PR-0070, PR-0073, PR-0074)** — from critic/rounds/round-07.json. Each is marked NOT RE-TESTED in its record. Carried at the same severity; none is claimed as verified this round.

**Not tested**

- Audio of any kind: no agent can hear and no owner audition is on file (CHK-001, CHK-B1).
- Chapter 3 in-battle and post-scene appearance: no usable capture this round, so part of the visual scope is unknown.
- The FFX-2 target-cursor step: the capture labelled for it shows the spell list instead (CHK-016), so the FFX-2 targeting tile is unanswered.
- The advisor on degenerate boards (CHK-005) and the advisor card cross-read against the open menu (CHK-004): the matrix test does not exist and no browser run covered it.
- Developer vocabulary and name truncation sweeps (CHK-007, CHK-009, CHK-010): not re-run.
- The six-viewport full-screen-layer sweep (CHK-002).
- Overdrives and the Swordplay Overdrive tile; the Turn cut-in, which has no production call site.
- Real phone, real controller, Safari, Firefox, Edge; 4:3, 21:9, 1440p and 4K shapes; cold-cache loading.
- Save upgrade and migration (CHK-024, not owed by this candidate).
- The on-screen half of PR-0075: two live runs produced no heal-then-MISS caption, so whether the player sees it is unknown.

**Required and not tested** — this review owed these and did not close them

- CHK-001 and CHK-B1 (audio) — owed by this review and not closable by an agent. Third consecutive round. It needs Bailey's audition verdict in docs/audio/ or NOW.md, and the brief asked for it again.
- CHK-022 win half for seymour-flux, braskas-final-aeon and ffx2-vegnagun-shuyin — the brief asked this round to win them with real input or with the hook labelled injected. They were won and labelled injected, which closes the aftermath and reward questions but not the check: three of five chapters have still never been won by a player's own commands, and chapter 2's victory results screen was not reached. PR-0082.
- CHK-004 and CHK-005 — both selected by the plan and both UNVERIFIED, so the move advisor v2 this release is built around has its model half proved and its on-screen half unproved, and PR-0006 cannot be closed.
- CHK-002, CHK-007, CHK-009 — selected by the plan and not run.
- Chapter 3's visual scope.

## Checks

| Check | Result | Mandatory | Min | Why (abridged; full reasons and evidence paths in the JSON) |
|---|---|---|---:|---|
| CHK-001 | **UNVERIFIED** | no | 4 | Agents cannot hear (AGENTS.md hard rule 13). The check passes only with Bailey's own audition verdict on file in docs/audio/ or NOW.md, and there is none for 1b33971: docs/handoff/NOW.md records the audio track as still owed ("music is too reminiscent of snes music instead of the more modern final fantasy titles ... al … |
| CHK-B1 | **UNVERIFIED** | yes | 1 | Whether the music and effects are beautiful is Bailey's judgment alone. No verdict is on file for this build. The audio category is therefore UNVERIFIED and carries no number. |
| CHK-002 | **UNVERIFIED** | yes | 4 | The pause layer was proved to own the window in two states with real input — Escape over a running cutscene and Escape / P over the open command menu, then H to hide the panels and arrows to move between tabs — but the six-viewport sweep this check asks for was not run. Recorded as unknown, not as a pass. |
| CHK-003 | **FAIL** | yes | 12 | The bar is zero elements under the floor. At 390x844, 55 leaf elements in the FFX battle HUD and 41 in the FFX-2 HUD render below 12 effective px, minimum 2.38 px — and CHK-003's own floor is 14 px, so the 12 px sweep is a lower bound on the failure. At 1600x900 the advisor card's smallest effective type is 9.75 px wit … |
| CHK-004 | **UNVERIFIED** | yes | 2 | The model half is green: tests/unit/advisor-ownership.test.ts asserts every suggestion passes ownedRow against that decision's own command list and that the card's actor id and name match. The on-screen cross-read and the submenu-chip match need a browser and no auditor opened one for this check. Recorded as unknown, n … |
| CHK-005 | **UNVERIFIED** | yes | 3 | The standing matrix this check asks for (one ally down, two down, healer down, whole party critical, a status lock, no revive items, no MP, a telegraphed re-kill) does not exist as a test file and no browser run exercised it. What is green is the subset CHECKS.md names: advisor-ownership replays all five chapters at 30 … |
| CHK-006 | **PASS** | no | 9 | Closed this round for the two transient overlays the build actually has. (1) The targeting reticle dies with the target step: Escape from target selection returns to the command menu with reticle count 0, captured in chapters 3, 4 and 5 and in the chapter 2 cancel probe, and the build's own snapshotState carries canPau … |
| CHK-007 | **UNVERIFIED** | yes | 2 | Not re-swept this round. Two issues inside its scope are open and carried without re-measurement — PR-0026 ("Haste is ctb x 8/16" on screen) and PR-0027 (unrendered markdown, "the target *she* last picked") — so the check cannot be called a pass, and nothing this round observed either string, so it cannot be called a f … |
| CHK-008 | **FAIL** | yes | 7 | Panels are still placed against each other rather than against the painted actors, in three independent places on the live build. (1) The FFX command plate at 1600x900 covers Yuna head to feet — only her head, one shoulder and a staff tip read through a translucent gap, and the greyed TALK row sits across her face (PR- … |
| CHK-009 | **UNVERIFIED** | yes | 1 | Not re-measured. PR-0019 (the command help sentence truncated mid-word with the ALL ALLIES chip over its ending) is open and carried on round 07's evidence. |
| CHK-010 | **UNVERIFIED** | no | 1 | Not re-measured. PR-0018 (the selected command label at 1.53:1 contrast) is open and carried on round 07's evidence. |
| CHK-011 | **FAIL** | yes | 5 | At 1600x900 every targetable enemy is visible — chapter 1 shows both Seymour Flux and the Mortiorchis in frame, chapters 2, 4 and 5 show their single boss body. At 390x844 the chapter 1 stage is crushed into the upper half with roughly 40 % dead backdrop below and only one of the two enemies reads in frame; PR-0017 is  … |
| CHK-012 | **FAIL** | no | 9 | Three image slots on the remade pause screen's Chapter tab ship as empty 104x78 boxes with naturalWidth 0 and naturalHeight 0, and the same three URLs return HTTP 404 from the live host in every chapter — fifteen distinct paths, 84 failed requests and 84 console errors across the round. Their subjects rendered correctl … |
| CHK-013 | **PASS** | yes | 6 | Approved artwork is protected and was judged inside the running game rather than as files. sha256 over every file named by the 26 approved sets in docs/target/approved-hashes.json gives 115 match, 0 different, 0 missing — no approved painting was regenerated, re-judged or proposed for replacement this round. Each paint … |
| CHK-014 | **FAIL** | no | 11 | The results screen's hero figure is posed and framed for a slot it does not occupy: a victory puts the leader's square head portrait into .rres__hero, which results.css sizes at the full stage height with object-fit: cover and object-position 50% 0, so the head is scaled far past the wedge and the player sees one eye a … |
| CHK-015 | **PASS** | yes | 95 | Every player-facing behaviour claimed this round was produced by a real Playwright key or click on the live bundle and asserted from the game's own snapshot: title Enter (accepted 759-967 ms after ready), board ArrowRight to a named card, prep Enter, prep tab ArrowRight, prep Escape back to the board and in again, cuts … |
| CHK-016 | **FAIL** | yes | 8 | Most captures carry a per-shot stale-root check and a state assertion and are sound — across 235 entries there are zero off-title .ig-title-screen roots, every wait loop ends in a thrown ASSERT-FAIL rather than falling through, and the one run that failed an assertion recorded the failure and the screen it was actually … |
| CHK-017 | **PASS** | yes | 5 | The exact artifact was verified on the live site: artifactHash f29a55dfea95b61e35a26c0a676790d40bf778a90937361de1976271350621bf, liveManifest "match", 863 files checked, zero mismatched, zero missing, zero wrong type, zero errors. The capture sessions independently read index.html (200, 2,521 bytes, version 0.1.0) and  … |
| CHK-018 | **FAIL** | no | 4 | A shipped path is hand-written and wrong. The eighteen snapshot image values in src/data/chapter-meta.ts (lines 145-147, 193-195, 242-244, 297-299, 346-348) and src/data/chapter-meta-ffx2-leblanc.ts:72 are hand-written strings without the art/ segment, and src/app/screens/pause/markup.ts:130 passes them straight to art … |
| CHK-019 | **PASS** | no | 2 | Every one of the 863 shipped files was hashed and decode-checked by tools/artifact-manifest.mjs at deploy: decodeChecked true, problems [], audioUnverified 0. No shipped image is blank or undecodable. The near-flat frames found this round are capture-timing artefacts of the review harness, not shipped media, and are re … |
| CHK-020 | **FAIL** | yes | 6 | One undeclared asymmetry between the two engines, and it is a defect rather than a written FFX-2 difference: FFX's accuracy.ts returns null (always hits) for any non-physical action, with the rule spelled out in the code ("a Cure or a Phoenix Down never whiffs [section 2.11]"), while FFX-2's formulas.ts hitPercent has  … |
| CHK-021 | **PASS** | yes | 8 | Every changed subsystem in this candidate carries a written game case in its commit and handoff, and each one is proved by an absence test rather than argued: Active ATB is FFX-2 only (activeClockEngine() returns null for FFX so neither new gate is reachable; tests/unit/ffx-no-active-clock.test.ts, 3 tests green), the  … |
| CHK-022 | **UNVERIFIED** | yes | 120 | Real and substantial progress, and a precise remainder. PASS for ffx2-bahamut on both halves: victory through the FULL real-input route in 1:43, post-battle scene, results and the CLEARED banner, and again through the hook in 1:36. The defeat half plus the results screen is proved by real input for seymour-flux (9 turn … |
| CHK-023 | **PASS** | yes | 12 | The normal runtime really does invoke the changed subsystems with the expected data, traced from the live build's own ordered event stream rather than from a unit test. Active clock: chapter 5's real-input log carries 88 atb snapshots whose engine elapsedMs runs 0 -> 36,030 ms across 35,610 ms of wall-clock hand play ( … |
| CHK-024 | **NOT APPLICABLE** | no | 1 | No save-schema or migration change is in this candidate: src/app/SaveData.ts is not in the changed set for 1b33971, which is why the plan classed this as deepAfterDeploy rather than deepBeforeDeploy. The cleared-state read-back was exercised incidentally (the chapter 4 CLEARED banner survived the run) but no upgrade pa … |
| CHK-B2 | **UNVERIFIED** | no | 1 | Whether the input feels good is Bailey's judgment. What an agent can supply is the number beside it, and this round supplies three: 7.7 s from the chapter card to the battle screen, 6.8 to 8.1 s of unaccounted wait before the first command menu accepts input, and 59.5 to 59.7 fps with p99 16.8 ms once in the fight. |
| CHK-B3 | **UNVERIFIED** | no | 1 | Art direction and whether a face is the character are Bailey's. This report judges only how approved art renders (CHK-013 PASS) and never proposes replacing any of it. |

## Encounters

### seymour-flux

**Outcome.** both halves: defeat by hand (9 turns, 0:49, results screen reached), then victory (1:17, AP 10,000 / Gil 6,000 / Lv 4 Key Sphere, victory scene and results)

FIRST WIN IN ANY ROUND. Real-input route title -> board -> prep -> prep-back -> prep -> pre-battle scene (Kimahri, Seymour) -> fight, in evidence/ch1/. The WIN used gotoChapter(auto:"intended") on seed 2 and is labelled injected, so the win half stays UNVERIFIED under CHK-022. Rewards match src/data/ffx/enemies/seymour-flux.ts exactly; Kimahri's +0 AP is correct, he was KO'd at the end.

### yunalesca

**Outcome.** fight resolved by hand and left the battle screen into the post-battle cutscene; a second hand-played run (15 turns, 213 events, seed 1) reached a legible defeat results screen; the VICTORY results screen was not reached inside the run budget

evidence/ch2/ and gaps/ch2-35-results.png. Real-input route complete through title, board, prep, prep-back, pre-battle scene (Braska, Auron), scene pause, hand-played turns, Escape/P pause, pause arrows, G, N, E, target confirm and cancel. Also the CHK-015 cancel probe (cancel/yunalesca.json). Enter on RETRY reached party-prep in 3.0 s.

### braskas-final-aeon

**Outcome.** defeat through the real-input route (seed 1, 254 events), then victory (5:17, 1,319 events, victory scene, results and CLEARED banner)

FIRST WIN IN ANY ROUND, injected. AP 0 / Gil 0 on the results screen is CORRECT and sourced: src/data/ffx/enemies/braskas-final-aeon.ts line 336, "rewards: { ap: 0, apOverkill: 0, gil: 0 } // section 2.3 — no AP/gil for these". Two of this chapter's win captures were taken inside a transition fade and are discounted (CHK-016).

### ffx2-bahamut

**Outcome.** VICTORY through the FULL real-input route (1:43) and again through the hook (1:36); post-battle scene, results and CLEARED banner all reached

The only chapter in any round to pass both halves of CHK-022. The results headline reading "Results" rather than "Victory", with grey chrome and no closing line, is AUTHORED and not a defect (src/ui/common/resultsMath.ts isSilentResultsChapter, writing-bible section 5.4). Yuna's White Mage command plate having no Attack row is also correct and sourced (research/ffx2-combat-core.md section 3.5; research/visual-bible.md: render the missing row as an absent row, not a greyed one).

### ffx2-vegnagun-shuyin

**Outcome.** VICTORY (6:11, 2,256 events, victory scene and results, EXP 0 / AP 20 per dressphere / Gil 0); separately a real-input route reached the fight and played 6 turns by hand, and the fight was still running after 300 s of auto at "fast"

FIRST WIN IN ANY ROUND, injected. The fight alone ran 31.9 s to 402.5 s = 370 s at FAST speed with an optimal auto-player: that is the measured size of PR-0081. The pre-battle speaker Nooj still has no portrait (img null, PR-0058). This chapter is where PR-0076 and PR-0080 were measured.

## Fixed and verified this round

- **PR-0052** — A Berserked girl on a dressphere with no Attack spends her turn on nothing at all, with no action and no line — 3 of every 4 Berserked turns in Chapter 5 link 2

  FIXED. src/battle/ffx2/engine.ts runBerserkTurn now names the Berserked turn through the ordinary banner and message path (55540b9 batch); the combat auditor re-read it and re-ran the FFX-2 suite on byte-identical src/battle. A Berserked girl on a dressphere with no Attack no longer spends her turn silently.

- **PR-0068** — The FFX-2 HUD says "ACTIVE — ATB RUNNING" while the engine clock is frozen, and it can never say anything else

  FIXED and proved on the live artifact. Chapter 5's real-input event log carries 88 atb snapshots whose engine elapsedMs runs 0 -> 36,030 ms across 35,610 ms of hand play (ratio 1.012), including under an open menu, so the HUD's "ACTIVE — ATB RUNNING" chip is now true. Evidence: critic/rounds/round-08/evidence/ch5/battle-log.json, critic/rounds/round-08/evidence/ch5/run.json.

- **PR-0064** — The title's two figures have no perceptible gold rim, so they read as flat black cut-outs instead of the approved gold-rimmed ink silhouettes

  FIXED. The title plate's gold rim is present on the live build: fresh profile, 2.5 s idle after __pyreflyReady, screen=title asserted, gold rim on the angled right edge and a gold rule under the footer bar. Evidence: critic/rounds/round-08/evidence/gaps/t01-title-1600x900.png, critic/rounds/round-08/evidence/gaps/gap-a.json.

- **PR-0043** — No chapter has been won by real input alone: the two victories on record had the route walked with keys and the fight handed to the game's own strategy

  CLOSED on its own terms. ffx2-bahamut was won through the full real-input route in 1:43 — title, board, prep, pre-battle scene, hand-played commands, victory, post-battle scene, results and the CLEARED banner. The remaining "never won" chapters are tracked by CHK-022 and by PR-0082, not by this process ticket. Evidence: critic/rounds/round-08/evidence/ch4/, critic/rounds/round-08/evidence/win-ffx2-bahamut/run.json.

## Ranked issues

63 deduplicated issues: 0 critical, 40 major, 21 polish, 2 suggestions. Ranked critical first, then major, then polish, then suggestions; within a severity by the owner’s own reported problems, then regressions, then frequency, player impact, coverage and effort — never by what most cheaply lifts a decimal. One root defect across several chapters is one ticket: PR-0077 merges the asset-loading and visual filings of the same wrong URL builder across five chapters and two games, and FOC-05 and FOC-06 each merge two auditors’ filings of the same measurement.

### 1. PR-0076 — Chapter 5's shipped intended line drops from 40/40 to 0/40 once the player takes any decision time, because Active ATB now runs the clock under the menu

- **Severity** major · **category** encounter · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 only (AGENTS.md rule 14 case: FFX-2 only — activeClockEngine() returns null for FFX and tests/unit/ffx-no-active-clock.test.ts proves the absence) · ffx2-vegnagun-shuyin · battle, Active ATB, the shipped intendedStrategy line
- **Ship tags** introducedByCandidate: true · regressionVsLive: true · inNewFeature: false
- **Requirement** RUBRIC section 6, encounter authenticity and balance: intended strategy, fair wins and losses, correct difficulty. The shipped intendedStrategy is the chapter's declared canonical clear (research/ffx2-vegnagun-shuyin.md section 7.1, two Dark Knights on Darkness and one White Mage healing, [verified: 2 sources]).
- **Expected** A chapter that ships with a declared intended line stays winnable on that line by a human who reads the menu.
- **Observed** Reproduced by the encounter auditor on this build: PYREFLY_MEASURE=1 tests/unit/ffx2-active-measure.test.ts gives chapter 5 40/40 wins at D=0 (median 373.0 s) and 0/40 at both D=1500 ms and D=4000 ms. The party goes from roughly three turns per two enemy actions to one per two, and loses faster (median 373 s -> 142 s). 948 command menus were invalidated across the 40 chains at D=1500, about 0.7 tear-downs for every command the player actually completes, and the builder's own breakdown over five chains attributes 75 % of them to section 1.7's rule that a chained target cannot start a new action. Chapter 4 is unaffected (40/40 at all three arms). Corroborating from the player's seat on the live build: the real-input chapter 5 route played six turns by hand and the fight was still running after 300 s of auto at "fast". The D arms are an upper bound — the harness charges the full decision time at every re-offer as well as every command.
- **Repro** PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts (40 contiguous seeds per arm, fake clock, no browser).
- **Evidence** critic/rounds/round-08/probe-combat/RESULTS.txt; docs/handoff/ffx2-active-atb.md section 2 and section 7; critic/rounds/round-08/evidence/ch5/run.json (afterBattle ms 300505)
- **Confidence** high — reproduced independently of the builder, with the D=0 arm as the regression control
- **Smallest fix** Nothing on the boss side: the encounter data is sourced and a boss is never weakened (AGENTS.md hard rule 6 and the standing rule). This is a decision for Bailey between the player-side options the builder already measured in docs/handoff/ffx2-active-atb.md section 7, and the largest single lever is named and measured: four in five lost menus are chain locks, so letting a chain-locked girl keep her queued command — re-offer with the command pre-selected, or hold the choice and fire it when the lock lifts — recovers most of the loss without touching Vegnagun.
- **Acceptance check** Re-run the same 40-seed arms: chapter 5 at D=1500 ms clears on a majority of seeds with the shipped intended line, while the D=0 arm still reproduces 40/40 at median 373 s so no existing replay moved.
- **Note** This is the one HOLD in the report. It implements Bailey's D-009 pick ("For ffx-2 I choose active") faithfully — the fidelity is right and the balance consequence is the defect. It is NOT tagged inNewFeature because Active did not ship alongside the old behaviour: it replaced Wait in both shipped FFX-2 chapters and the player cannot opt out, which is the definition of a regression rather than a new feature that can ship switched off. On the previous verified build 8f48237 the clock stood still under an open menu (round 05 PR-0046 measured ticks 8189 -> 8189 over 2013 ms).

### 2. PR-0080 — Under Active ATB the open command menu changes owner in place with no keypress: the row under the cursor becomes a different girl's command in 262 ms

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 only (Active clock; FFX has no active clock path) · ffx2-vegnagun-shuyin (measured), ffx2-bahamut (same path) · battle, command menu open and awaiting input
- **Ship tags** introducedByCandidate: true · regressionVsLive: true · inNewFeature: false
- **Requirement** RUBRIC section 6, interface: reliable input, clear target sets. A player must not commit a command to a different actor than the one they were reading.
- **Expected** While the player is reading an open command menu, the menu either stays the menu they opened or visibly hands over, with the cursor re-seated and the change announced.
- **Observed** Sampled on the live build at 250 ms and at 500 ms. The [data-idx] row count never went to 0 in 40 consecutive 500 ms samples, so the menu is not torn down — it is REPLACED IN PLACE, which is worse for the player. With NO keypress between two samples the on-screen list changed from Yuna's [White Magic, Change, Item] to Rikku's [Attack, Skill, Change, Item] in 262 ms, playback.phase going play:damage -> command:rikku. The row under the cursor changes both owner and meaning. The mismatch is visible in the HUD at the same instant: x5-20-ffx2-target-cursor.png shows Yuna's WHITE MAGIC list on screen while both the guide card and the advisor card print RIKKU and "Black Sky -> all enemies".
- **Repro** Live site at 1600x900, PYREFLY_BROWSER=gpu, chapter 5, open any command menu and sample the .cmd row list and playback.phase every 250 ms without pressing a key. critic/rounds/round-08/gap-p76.mjs and gap-x2.mjs.
- **Evidence** critic/rounds/round-08/evidence/gaps/x5-10-atb-menu-open.png (frame 1), gaps/p76-f2-menu-after-swap.png (frame 2), gaps/p76-f3-menu-500ms-later.png (frame 3); critic/rounds/round-08/evidence/gaps/p76-samples.json and gaps/x5-atb-strip.json (raw samples); critic/rounds/round-08/evidence/gaps/gap-p76.json and gaps/gap-x5.json (run records); critic/rounds/round-08/evidence/gaps/x5-20-ffx2-target-cursor.png (guide and advisor naming Rikku over Yuna's open list)
- **Confidence** high — three consecutive captured frames plus 40 timed samples, on the live bundle
- **Smallest fix** Two separable corrections, smallest first. (1) When the active-clock pump hands the menu to a different actor, re-seat the cursor to that actor's first row and mark the handover, rather than swapping the rows under a cursor that has not moved. (2) Keep the guide and advisor cards bound to the actor whose list is actually on screen, so the three panels cannot disagree. The underlying balance consequence is PR-0076 and is Bailey's decision, but (1) and (2) are correctness, not balance.
- **Acceptance check** In chapters 4 and 5 at 1600x900, sample the open command menu every 250 ms for 30 s without input: every change of the row list is accompanied by the cursor moving to index 0 of the new owner and by the guide and advisor cards naming that same owner in the same frame.
- **Note** Filed separately from PR-0076: that one is the balance consequence and is Bailey's decision, this one is a presentation and input-safety defect that can be corrected without touching balance. Tagged the same way as PR-0076 for the same reason — Active replaced Wait in the shipped chapters and cannot be switched off by the player.

### 3. PR-0077 — The remade pause screen's Chapter tab ships three broken image slots in every chapter, and the live build logs 84 404s because of it

- **Severity** major · **category** delivery · **status** open · **attempts** 0
- **Game / chapter / state** both (shared pause plumbing; AGENTS.md rule 14 case: BOTH) · all five (directly confirmed in 1, 2, 4 and 5) · pause screen, CHAPTER tab, snapshot strip, 1600x900 and 2000x1012
- **Ship tags** introducedByCandidate: true · regressionVsLive: true · inNewFeature: true
- **Requirement** RUBRIC section 5 (a load succeeded when the file decodes, not when the server answered), CHK-012 and CHK-019; the approved tile "Pause remade on the Until Dawn character screen" ships enabled.
- **Expected** The chapter's three snapshot thumbnails paint, as the same three subjects did in the previous live build's pause dossier, and the page logs no failed requests.
- **Observed** Three <img> elements in .pause__snaps have naturalWidth 0 and naturalHeight 0 and render as empty 104x78 white-bordered boxes under their captions. The live host returns HTTP 404 for fifteen distinct paths, three per chapter, each of them the correct file with the art/ segment missing: backdrops/gagazet.png, characters/seymour-flux/idle.png, characters/mortiorchis/idle.png (ch1); backdrops/zanarkand-dome.png, characters/yunalesca-3/idle.png, portraits/auron.png (ch2); backdrops/dreams-end.png and both braskas-final-aeon idles (ch3); backdrops/bevelle-underground.png, characters/ffx2-bahamut/idle.png, characters/paine-warrior/idle.png (ch4); backdrops/farplane.png, characters/vegnagun-head/idle.png, characters/lenne/idle.png (ch5). Across this round the live build produced 84 console errors and 84 failed requests, every one of them on these paths. The art/-prefixed copies of the same files load 200 in the same session, so the art exists and only the URL is wrong. An independent confirmer reproduced chapter 1 twice (1600x900 and 2000x1012): 3 imgs on the tab, 3 with naturalWidth 0, exactly 3 console errors and 3 responses with status 404 on precisely those paths.
- **Repro** Live https://baileypillon.github.io/pyrefly-reprise/, fresh profile, PYREFLY_BROWSER=gpu, 1600x900. Enter at the title, ArrowRight to any chapter, Enter, Enter through prep, skip the pre-battle scene, wait for the command menu, Enter to dismiss the coach mark, Escape to pause, ArrowRight to the CHAPTER tab. Three placeholder boxes appear in the snapshot strip and three 404s appear in the network log. No seed dependency.
- **Evidence** critic/rounds/round-08/evidence/pause/seymour-flux-1600x900.json (tab "chapter": imgs 15, broken 3, the three paths named); critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-03-chapter.png; critic/rounds/round-08/evidence/confirm/seymour-flux-1600x900.json and /confirm/seymour-flux-2000x1012.json (independent reproduction); critic/rounds/round-08/evidence/ch1/run.json, ch2/run.json, ch4/run.json, ch5/run.json (notFound lists); critic/rounds/round-07/evidence/ch1/08-pause-Esc.png (the same three thumbnails painting at 8f48237)
- **Confidence** high — traced to source, reproduced independently, and the 404 list, the zero-naturalWidth probe and the previous build's capture all agree
- **Smallest fix** src/app/screens/pause/markup.ts:130 passes the raw snapshot value to artUrl(s.image), while every other artUrl call site in src/ passes an art/-prefixed path (ChapterSelectScreen.ts:234, CutsceneScreen.ts:156, frontend/chapterCards.ts:47 and 58, titleMarkup.ts:59, PartyPrepScreen.ts:152, pause/PortraitStage.ts:266-267, ResultsScreen.ts:276-277, BattlePresenterArt.ts:92-102, PaintedArt.ts:700-705). The eighteen snapshot image values live in src/data/chapter-meta.ts (lines 145-147, 193-195, 242-244, 297-299, 346-348) and src/data/chapter-meta-ffx2-leblanc.ts:72. Smallest correction: one line, markup.ts:130 -> artUrl(`art/${s.image}`), matching the other call sites. CORRECTION TO THE FIRST PROPOSAL, from the confirmer: do NOT add the art/ prefix to heroArtFallback. Those values are documented as relative to public/art/ (src/data/chapter-meta.ts:76) and their only consumer, src/ui/common/chapterPanel.ts:50, already writes artUrl(`art/${meta.heroArtFallback}`); prefixing them would break the chapter panel's hero art in all five chapters.
- **Acceptance check** Open pause and the CHAPTER tab in all five chapters on the built bundle at 1600x900; assert every .pause__snap img has naturalWidth > 0 and that the page logged zero responses with status >= 400 and zero console errors.
- **Note** Tagged inNewFeature because the Chapter tab is part of the pause remake and does not exist on the previous live build at all; under RUBRIC section 3 that means it is disclosed rather than a hold, even though the same three subjects rendered in the old pause dossier. Merged: the asset-loading and the visual auditors filed this separately and it is one root defect (one wrong URL builder) across five chapters and two games.

### 4. PR-0075 — FFX-2 healing and recovery items roll the enemy hit check and MISS on an ally's own Evasion, and the item is spent anyway

- **Severity** major · **category** combat · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 only (AGENTS.md rule 14 case: FFX-2 only — FFX's own accuracy.ts already carries the carve-out FFX-2 lacks) · ffx2-bahamut and ffx2-vegnagun-shuyin (both shipped FFX-2 chapters) · battle, any ally-targeted heal, revive or recovery item
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-020: a difference between the two engines must be deliberate and written. research/ffx2-combat-core.md section 2.6 describes the hit check as an attacker-versus-defender points race and applies it to attacks; no source applies it to a friendly target. src/battle/ffx/accuracy.ts:35-39 states the project's own rule: "Magic, items, healing, revival and Overdrives use ALWAYS; a Cure or a Phoenix Down never whiffs [section 2.11]".
- **Expected** A Cure, Cura, Curaga, Life, Full-Life, Full-Cure, Pray, White Wind or a Potion aimed at a party member always lands.
- **Observed** src/battle/ffx2/formulas.ts:352 hitPercent has no ally carve-out: an ability with no explicit accuracy, no canMiss: false and any formula other than "none" falls through to clamp(0, 100, attackerAcc + attackerLuck - targetEva - targetLuck). Only one ability in the whole FFX-2 data set sets canMiss at all. Over the two shipped FFX-2 party builds, 175 healer-to-ally pairings return 96-99 %: Yuna healing HERSELF is 96 %, so one self-heal in twenty-five simply fails. On the live build's own event stream Yuna's party-wide Pray heals Yuna for 25 and Paine for 25 and emits {"type":"miss","targetId":"rikku","sourceId":"yuna","reason":"evaded"} between them; Cura does the same to Rikku in chapter 4. Recovery items are worse: src/battle/ffx2/execute.ts:191-195 decrements the inventory BEFORE the ability resolves, so a Megalixir or an X-Potion that "evades" is consumed and lost. Over 20 chapter-5 chains and 20 chapter-4 battles the probe counted 88 and 17 ally-on-ally evaded misses. LIMITATION, recorded rather than implied: the gap pass could not produce the on-screen half — over a full chapter-5 fight of 1,137 events exactly 2 miss events occurred, both enemy attacks that missed an ally, and a 200 s watch sampling .dnum every 120 ms saw no MISS numeral anchored on a party member after a heal. The engine-level defect is CONFIRMED; whether the player sees a MISS caption painted over the ally is UNVERIFIED.
- **Repro** Headless: npx vitest run --config critic/rounds/round-08/probe-combat/vitest.config.ts. On the live build: critic/rounds/round-08/evidence/win-ffx2-vegnagun-shuyin/battle-log.json seq 1442-1447 (Pray), critic/rounds/round-08/evidence/win-ffx2-bahamut/battle-log.json seq 286 (Cura).
- **Evidence** critic/rounds/round-08/probe-combat/ally-heal-miss.probe.ts and probe-combat/RESULTS.txt; critic/rounds/round-08/evidence/win-ffx2-vegnagun-shuyin/battle-log.json; critic/rounds/round-08/evidence/win-ffx2-bahamut/battle-log.json; critic/rounds/round-08/evidence/gaps/gap-miss2-ffx2-vegnagun-shuyin.json and gaps/miss-events.json (the on-screen half, not reproduced); src/battle/ffx/accuracy.ts:35-39 (the FFX carve-out) against src/battle/ffx2/formulas.ts:352-383
- **Confidence** high on the engine behaviour (probe plus two live event streams); the on-screen caption is unverified
- **Smallest fix** In src/battle/ffx2/formulas.ts hitPercent, return 100 before the points race when the ability's targeting is ally-side ("single-ally" / "all-allies" / "self") or the ability carries the heals flag — the same single carve-out src/battle/ffx/accuracy.ts already makes for FFX. One guard, no data change, no balance change to any enemy action.
- **Acceptance check** A probe over 20 chapter-4 battles and 20 chapter-5 chains emits zero miss/"evaded" events whose sourceId and targetId are both party members; tests/unit/ffx2-*.test.ts and the D=0 arm of ffx2-active-measure stay byte-identical, since D=0 is the declared regression control.
- **Note** Pre-existing: the hit check at src/battle/ffx2/resolve.ts:277 is untouched by this candidate's diff. It is filed now because this is the first review that probed the ally-target path.

### 5. PR-0078 — Every results screen enlarges the leader's head portrait past its frame, so a victory is celebrated with a single eye

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both (shared results plumbing; AGENTS.md rule 14 case: BOTH) · all (captured in FFX 1 and 3 and FFX-2 5; also reproduced on the previous build in FFX 2) · results screen after a victory, the painted wedge on the right
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** Approved target tile "Results" (docs/screenshots/mockups/A-results.jpg), which shows a head-and-shoulders portrait beside the figures. RUBRIC section 5: an approved close-up may crop a head on purpose; accidental crop damage is the defect. CHK-014.
- **Expected** The leader stands in the wedge recognisably, as the approved Results tile shows and as the defeat path already does with the full-body hurt sprite.
- **Observed** The wedge is filled by one eye, a cheek and hair strands. Tidus is unrecognisable on the chapter 1 and chapter 3 victory screens and Yuna on the chapter 5 one; the same framing appears on round 07's chapter 2 victory, so it predates this candidate. Traced: heroHtml() puts portraitImgHtml(leader) — the square face portrait art/portraits/<id>.png — into .rres__hero, which results.css sizes at the full stage height with object-fit: cover and object-position 50% 0, so a 1:1 image is scaled to roughly 900 x 900 inside a wedge a fraction of that wide. The defeat path uses the full-body hurt/ko sprite and frames correctly, which is the control case.
- **Repro** Live site at 1600x900. Win any chapter and read the results screen. Seeds 1, 2 and the chapter 5 run all show it; no seed dependency.
- **Evidence** critic/rounds/round-08/evidence/win-seymour-flux/21-results.png; critic/rounds/round-08/evidence/win-braskas-final-aeon/21-results.png; critic/rounds/round-08/evidence/win-ffx2-vegnagun-shuyin/21-results.png; critic/rounds/round-08/targets/presentation-results.jpg (target beside build); critic/rounds/round-07/evidence/gaps/win-ch2/21-results-victory.png (same framing on the previous live build); src/app/screens/ResultsScreen.ts:270-278 and src/ui/common/results.css:76-86
- **Confidence** high — three captures this round, one on the previous build, and the rule traced in source
- **Smallest fix** Either point the victory wedge at the same full-body art the defeat path uses (ResultsScreen.ts:276-277 already resolves art/characters/<leader>/hurt.png and ko.png, and a victory.png ships for the party — it is requested in ch1/network-media.json), or, if the head portrait is intended, size .rres__hero to the wedge instead of the stage and honour the portrait's focal sidecar the way the pause stage does.
- **Acceptance check** Win one FFX chapter and one FFX-2 chapter at 1600x900 and 2000x1012; assert the leader's whole head is inside the wedge (eyes, mouth and chin all present) in the capture, and compare against docs/screenshots/mockups/A-results.jpg with node tools/end-state-board.mjs --pair.
- **Note** First measured this round only because this is the first round that reached three victory results screens.

### 6. PR-0079 — The remade pause draws its meter columns across Kimahri's face, breaking the mirror rule Bailey named

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both (the side-choice rule is shared plumbing; observed on an FFX member) · 1 (member:kimahri tab) · pause screen, member tab, 1600x900
- **Ship tags** introducedByCandidate: true · regressionVsLive: false · inNewFeature: true
- **Requirement** docs/target/targets.json, tile "Pause remade on the Until Dawn character screen", reaction.mustRemain: "the text block sits on whichever side of THIS painting is empty" (Bailey, 2026-09-21, "B, yes, yes, yes."). RUBRIC section 7: acceptance cases come from mustRemain.
- **Expected** For each member the chrome moves to the empty side of that member's painting, as frame (b) of docs/concepts/pause-until-dawn/sheet.png mocks for Yuna.
- **Observed** On the Kimahri tab the IN THIS FIGHT column and the OVERDRIVE meter run straight across his muzzle and left eye, and the objective line sits on his mane and chest. The painting's own focal point is x 0.42 (public/art/pause/kimahri.json), left of centre, so the left-hand chrome lands on him rather than beside him. The Tidus and chapter-4 Yuna tabs place the chrome correctly on empty ground, so the rule is implemented but is not choosing the right side for every painting.
- **Repro** Live site at 1600x900. Chapter 1, battle, Escape, arrow to the KIMAHRI tab. Deterministic, no seed.
- **Evidence** critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-02-member-kimahri.png; critic/rounds/round-08/evidence/pause/seymour-flux-1600x900-00-member-tidus.png and critic/rounds/round-08/evidence/ch4/09-pause-Esc.png (the control cases); public/art/pause/kimahri.json focal {x:0.42,y:0.44}; critic/rounds/round-08/targets/pause-until-dawn-sheet.jpg
- **Confidence** high for the observation; medium for the cause — the side-choice input was not traced past the focal sidecar
- **Smallest fix** Make the side choice read the same focal the stage already fetches (src/ui/common/chapterPanel.ts:252-266, applied at 342-345) and flip the chrome when the focal x falls on the chrome's side, rather than using a fixed or per-game side. Kimahri at 0.42 should put the block on the right.
- **Acceptance check** For all three FFX and all three FFX-2 member tabs at 1600x900, assert the bounding box of the chrome block does not intersect the painting's focal point, and read the six composites against frames (a), (b) and (c) of the approved sheet.

### 7. FOC-05 — Auron's first-turn coach mark paints over 67.6 per cent of the move-advisor card (FFX only)

- **Severity** major · **category** interface · **status** open · **attempts** 1
- **Game / chapter / state** FFX only (FFX-2 solves the same collision by a different route and must not be changed) · seymour-flux, yunalesca, braskas-final-aeon · battle, first command menu of an FFX chapter on a fresh profile
- **Ship tags** introducedByCandidate: true · regressionVsLive: false · inNewFeature: true
- **Requirement** src/ui/coach/coach.css lines 120-128 states that the approved target tile c2-first-use-ffx "pictures Auron's line BESIDE a populated advisor card, not standing alone over an empty one". The build stops FFX hiding the card but never moves the line beside it.
- **Expected** Auron's line sits beside the advisor card, both readable at once, as the approved tile pictures.
- **Observed** Measured and then independently reproduced to the pixel. At 1600x900 .coach-mark is 400x146 at (448,99) and .mad__card is 370x189 at (402,98); the intersection is 324x146 = 47,304 px2 = 67.6 % of the card, and document.elementFromPoint inside the intersection returns DIV.coach-mark__body, so the line is painted on top. The card's live recommendation — "NEXT BEST MOVE / Tidus / Hastega / the party / GUIDE'S PICK / IN WHITE MAGIC / 30 MP / ALWAYS HITS / + HASTE" — is visible only as ghosted text behind Auron's line. At 2000x1012 the intersection is 58,400 px2 (65.3 to 65.9 % of the card, the spread being rounding of the card rect). In chapter 2 it is 46,238 px2. One Enter restores the card intact, so the collision lasts exactly the one turn a first-time player meets both features. Game scoping verified: in both FFX-2 chapters the intersection is null because [data-coach-mark-game="ffx2"] .mad__card { opacity: 0 }.
- **Repro** Live site, fresh profile (localStorage cleared), PYREFLY_BROWSER=gpu, 1600x900. Enter at the title, ArrowRight to Chapter I, Enter, Enter through prep, skip the scene, wait for awaitingMenu true, then measure the rects of .coach-mark and .mad__card.
- **Evidence** critic/rounds/round-08/evidence/foc/seymour-flux-1600x900-first-turn.png and foc/seymour-flux-1600x900-after-coach.png; critic/rounds/round-08/evidence/foc/seymour-flux-1600x900.json, foc/seymour-flux-2000x1012.json, ch2/run.json; critic/rounds/round-08/evidence/confirm/seymour-flux-1600x900.json and confirm/seymour-flux-2000x1012.json (independent reproduction); critic/rounds/round-08/targets/fight-onboarding-c2.jpg
- **Confidence** high — measured twice by two reviewers, not eyeballed
- **Smallest fix** Give .coach-mark[data-game="ffx"] an anchor that clears the advisor card's band. Placing the FFX line to the left of or above .mad__card's rect is what the approved tile shows. Do not touch the FFX-2 route, which is correct.
- **Acceptance check** On the first FFX turn at 1600x900, 2000x1012 and 390x844, the intersection area of .coach-mark and .mad__card is 0, and both elements' text is legible in the capture.
- **Note** Disclosed in the release announcement for 1b33971 and re-checked on live this round as the brief required. The onboarding being switched on in 65b57bd / 56011e4 is what makes it reachable by a player for the first time.
- **Carried forward** critic/reviews/1b339718e023d4dd8a5868901d55ba000a9e59a9-focused.json FOC-05

### 8. FOC-06 — The move-advisor card's smallest effective type is 9.75 px at 1600x900 and 2.38 px on a phone

- **Severity** major · **category** interface · **status** open · **attempts** 1
- **Game / chapter / state** both · all five · battle, move-advisor card
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** The disclosed FOC-06 bar and the front-end type floor FE-001 / FE-002 that landed in this release (e6aee37): no advisor-card type under 12 px effective after the card's own skew transform.
- **Expected** Every row in the advisor card renders at 12 px effective or larger.
- **Observed** Measured through every ancestor transform (computed fontSize multiplied by sqrt(|det|) of each ancestor's DOMMatrix), so this is what a player's eye gets, not the CSS value. At 1600x900 the smallest effective size inside .mad__card is 9.75 px with six rows under 12: "Guide's pick" 9.75, "in White Magic" 10.5, "30 MP" 10.5, "always hits" 10.5, "+ Haste" 10.5, "Next best move" 11.5. At 2000x1012 it is 10.96 px with five rows under 12. At 390x844 it collapses to 2.38 px with twelve rows under 12. FFX-2 is the same card and measures 10.5 px in chapter 5. The same six rows are under the floor on every pause tab probe as well, with "N" and "hide moves" at 11.0.
- **Repro** Live site, fresh profile, PYREFLY_BROWSER=gpu. Route into any chapter's first command menu, dismiss the coach mark with Enter, then measure the effective font size of every leaf node inside .mad__card.
- **Evidence** critic/rounds/round-08/evidence/foc/seymour-flux-1600x900.json, foc/seymour-flux-2000x1012.json, foc/seymour-flux-390x844.json, foc/ffx2-bahamut-390x844.json (measure.cardUnder12, measure.cardMinEff); critic/rounds/round-08/evidence/pause/seymour-flux-1600x900.json (tinyType on all eight tabs); critic/rounds/round-08/evidence/confirm/seymour-flux-1600x900.json (independent reproduction in both games)
- **Confidence** high — measured twice by two reviewers
- **Smallest fix** Raise the floor on the small rows in src/ui/common/move-advisor.css so that, after the card's skew, no descendant resolves below 12 px; the card already scales with the stage, so the floor has to be applied to the computed result rather than to the authored rem value.
- **Acceptance check** At 1600x900 and 2000x1012, the minimum effective font size of any leaf inside .mad__card is >= 12 px in both games, and the pause probe's tinyType list is empty.
- **Note** Disclosed in the release announcement for 1b33971 and re-checked on live this round as the brief required. It is the same defect class as PR-0001 at a different viewport; kept separate because FE-001/002 named this card specifically and missed it.
- **Carried forward** critic/reviews/1b339718e023d4dd8a5868901d55ba000a9e59a9-focused.json FOC-06

### 9. PR-0006 — The move advisor repeats the chapter's own line whatever the board says: it told the player to recast an already-active Shell on all 13 of Yuna's turns, and the guided fight ran 9 minutes without resolving

- **Severity** major · **category** interface · **status** open · **attempts** 1
- **Game / chapter / state** both (shared advisor plumbing; AGENTS.md rule 14 case: BOTH, and CHK-020) · measured in ffx2-bahamut (ch.4); the same shape measured in seymour-flux (ch.1); round 05 filed the KO/Zombie half in ch.1 · battle, advisor open (N), following GUIDE'S PICK by keyboard
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-005 (advice stays useful on damaged or resource-starved boards) and RUBRIC §2 ("the advisor offers legal, useful actions"). Bailey's own reported shape of this defect: "im controlling tidus but the advisor is telling me to use poison fang?"
- **Expected** Once Shell is on every party member with about 165 seconds left, the advisor moves on to the next useful move — Magic Break, which its own guide column calls the strongest opening in the fight, or Darkness, the damage route. A player who follows GUIDE'S PICK every turn should make progress.
- **Observed** Over one guided real-keyboard route of chapter 4 the card printed the identical row on all 301 samples: "Shell -> the party - GUIDE'S PICK - IN WHITE MAGIC - 10 MP - 100% TO HIT - + SHELL"; distinct picks 1. Yuna cast Shell on every one of her 13 turns while the only Shell that ever landed was the first, at seq 19-21 on engine turn 2 with ticksRemaining 165634 on all three members; the whole 901-event log contains 4 status-add events. The party dealt 4,489 of Bahamut's sourced 8,400 HP in 61 engine turns over 9 minutes 5 seconds and the battle never resolved (endScreen "battle"). The blind route that ignored the advisor resolved the same encounter in 2:22. Chapter 1 shows the same shape: 6 of 6 picks were "Hastega -> the party". The advice is otherwise correct and actor-bound — buildAdvisorView returns Magic Break / Mental Break / Armor Break / Attack for Paine, Darkness for Rikku, Shell > Protect > Cure/Cura for Yuna, and never names Shell on a turn where every living active already has it; the repetition is the chapter-line branch, not the ranked branch. NOT RE-MEASURED THIS ROUND: the advisor was exercised (63 commands read off it and driven through the real menu in Chapter 3, 51 of 52 taken exactly as advised) but the repetition claim was not re-benched, so this carries at round 06's severity on round 06's evidence.
- **Repro** node -e over critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json: picks.length 301, distinct 1; battleLog action-start yuna:Shell 13; steps[1].v {screen:"battle", turns:301, ms:545528}. Chapter 1: ch1/supp-win-1600x900.json, six Hastega. Engine-side: npx vitest run --config critic/rounds/round-06/bench/vitest.bench.config.ts critic/rounds/round-06/bench/z06-encounter.test.ts.
- **Evidence** critic/rounds/round-06/evidence/ch4/supp-win-1600x900.json; critic/rounds/round-06/evidence/ch1/supp-win-1600x900.json; critic/rounds/round-06/evidence/ch4/L-1600x900-guide-open.png; critic/rounds/round-06/bench/out/z06-all.txt; src/engine/tactics/advisor.ts recommendedCommand; src/engine/tactics/ffx2-bahamut.ts
- **Confidence** High. The repetition and its consequence come from the engine log, not from inference. The actor-binding half that round 06 first suspected is REFUTED (see PR-0055) and is not part of this finding.
- **Smallest fix** Give the chapter-line branch the same state test the simulated ranking already applies: before recommendedCommand returns the tactic's pick, resolve it on the throwaway copy the advisor already builds and drop it when it changes nothing measurable — a buff whose status is already on every named target, a cure with nothing to cure. One guard in src/engine/tactics/advisor.ts, game-agnostic, and the same short-circuit round 05 traced for the revive branch, so one repair closes both halves.
- **Acceptance check** Seeded engine test over chapters 1 and 4: run the advisor's own pick for 30 consecutive player turns and assert no suggestion is returned whose simulated resolution produces no status-add, no damage, no healing and no cure. Plus one real-keyboard capture of chapter 4 in which the pick changes away from Shell on Yuna's second turn, and the route reaches an outcome.
- **This round** PARTLY REPAIRED, NOT CLOSED. Move advisor v2 landed (55540b9, f0ff68a, 4dbcb8c) and tests/unit/advisor-ownership.test.ts replays all five chapters at 300+ seeded decisions per chapter in both engines, including Bailey's exact chapter 1 board and the telegraphed-Lance wait case, 15 tests green. That is the model half. The on-screen half is UNVERIFIED this round (CHK-004 and CHK-005 both unverified: no browser cross-read of the card against the open command menu, and the degenerate-board matrix does not exist as a test), and the repetition claim was not re-benched in play. It cannot be closed on a green unit test.
- **Note** Round 05 filed this FFX-only (advisor recommends offence while a member lies KO'd and Zombied). This round widens it to BOTH games with a measured FFX-2 case; one root defect, one ticket.
- **Carried forward** round-07 PR-0006

### 10. PR-0008 — Chapter 1's own intended strategy wins 26 of 40 seeds, and five of the fourteen losses are over within two to six player turns

- **Severity** major · **category** encounter · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 1 (Seymour Flux) · whole encounter
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 6 encounter (correct difficulty, fair wins and losses). Round 03 recorded this as a blocker; this build changed no data, no AI and no party preset, and the release manifest lists Chapter 1 difficulty as known and unchanged.
- **Expected** The first encounter a player meets is winnable by the line the game itself recommends, at a rate at least comparable to the later chapters.
- **Observed** CARRIED AND STALLED — open at the same severity in rounds 04, 05, 06 and 07, so RUBRIC §8's stagnation rule applies and a written method check is owed before another batch in this area. Re-measured on this build, not reused: npx vitest run tests/unit/strategy-seymour-flux.test.ts in D:/pyrefly-release at 8f48237 prints 'seeds 1-40: 26 wins' (65 %) against Chapter 2's 39/40, Chapter 3's 39/40, Chapter 4's 40/40 and Chapter 5's 40/40. New this round: an independent bench over the same forty seeds reproduces the same fourteen losing seeds and times each in PLAYER turns — seeds 20, 10, 29, 15 and 18 end at player turns 2, 5, 5, 6 and 6, with Seymour still above 63,000 HP on four of them, and each of those five was then replayed through the real entry route on the live site. The live build corroborates it twice from the player's seat: the first legal route through Chapter 1 ended '0:43 Defeat' after three command-menu presses, and handing the fight to the game's own 'intended' strategy through the documented hook, after walking the route with real keys, still ended '0:48 Defeat' at 47 turns.
- **Repro** npx vitest run tests/unit/strategy-seymour-flux.test.ts in D:/pyrefly-release prints 'seeds 1-40: 26 wins' with the losing seeds and turns; compare with strategy-ffx2-bahamut.test.ts and strategy-ffx2-vegnagun-shuyin.test.ts, both 40/40.
- **Evidence** D:/pyrefly-release at 8f48237: npx vitest run tests/unit/strategy-seymour-flux.test.ts ("seeds 1-40: 26 wins"); critic/rounds/round-07/evidence/ch1/run.json (turnsPressed 3, battleMs 43898, resultsText "0:43 Defeat TURNS 9"); critic/rounds/round-07/evidence/ch1/11-results.png; critic/rounds/round-07/evidence/gaps/win-ch1/run.json (autoBattle 'intended' on the live build: "0:48 Defeat TURNS 47"); critic/rounds/round-07/evidence/gaps/ch1-seeds/seed-20/, seed-10/, seed-29/, seed-15/, seed-18/ (run.json with seedSet, hpTrail, results text, plus 00-party-falling.png and 01-results.png each); critic/rounds/round-07/evidence/confirm/c12-ch1-losses-player-turns.txt; critic/rounds/round-07/evidence/diag/balance-intended.json
- **Confidence** high - two independent measurements on this exact build, one seeded bench and one real-input capture
- **Smallest fix** Not proposed here. Under RUBRIC §8 the next batch in chapter 1 starts with a written method check instead of a third similar repair attempt: the current route and why it stalled, up to two alternatives, the smallest test that tells them apart, and one choice of continue / change method / small probe / defer / ask Bailey.
- **Acceptance check** After whichever answer Bailey picks, the Chapter 1 forty-seed sweep wins at a rate within a few points of Chapter 2's 39/40, with no defeat before turn 25, and a real-input capture reaches victory at least once.
- **This round** RE-MEASURED by the encounter auditor on this build's code: 26/40 (65.0 %), identical to rounds 06 and 07, against the tactic file's own target of 34/40; losses end at player turns 8, 11, 13, 14, 15, 22, 27, 28, 31, 33, 35, 47, 53 and 96. STALLED under RUBRIC section 8 — fifth consecutive review at the same severity.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0008

### 11. PR-0007 — Chapter 1's signature mechanic has no counter-play: 37 of 44 Zombie kills give the player zero turns in between

- **Severity** major · **category** encounter · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 1 (Seymour Flux) · battle, Zombie applied then Full-Life
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 6 encounter (signature mechanics, fair losses); research/ffx-seymour-flux.md documents the answer as Holy Water or Remedy, which presumes a turn in which to use it.
- **Expected** A player who is paying attention gets at least one turn between a Zombie landing and the Full-Life that converts it into a kill, so the documented answer (Holy Water, Remedy) is playable.
- **Observed** CARRIED AND STALLED — fourth consecutive review at the same severity. Re-measured on this build rather than reused: over seeds 1-30 there are 44 Zombie-to-KO events, 37 of them (84.1 %) with ZERO player turns between the Zombie landing and the kill, and the median window is 0. The seven non-zero windows are 12, 19, 4, 17, 33 and 28 turns, so the mechanic is either instant or nearly irrelevant with almost nothing in between. The number is bit-for-bit round 04's, which is expected: git diff --name-only fd0ae96 8f48237 -- src/battle src/data research returns nothing.
- **Repro** Node/vitest, no browser: drive ENEMY_GROUPS_BY_ID['seymour-flux'] with gagazetBuild and intendedStrategy over seeds 1..30, recording player-input turns and the zombie status-add / ko events. Output: 'zombie->KO events: 44; zero player turns in between: 37'.
- **Evidence** critic/rounds/round-04/bench/zz-critic04-ch1.test.ts; critic/rounds/round-03.json rankedIssues (same finding, prior build)
- **Confidence** high - measured directly off the engine's own event stream on this build
- **Smallest fix** A proposal, not a repair to apply unasked (AGENTS.md rule 10). The smallest sourced-looking lever is the scheduling of the Full-Life follow-up relative to the Zombie in src/battle/ffx/ai/seymour-flux.ts: if the research supports the two landing on separate scheduled turns rather than inside one AI step, separating them restores the window at no cost to the boss's numbers. If the sources do not settle it, say so and ask Bailey rather than tuning.
- **Acceptance check** Re-run the seeds 1-30 instrumentation: the median window between a Zombie landing and the Full-Life kill is at least one player turn and the zero-window share falls below roughly 10 percent, with Seymour Flux's stat block and ability data unchanged.
- **This round** RE-MEASURED by the encounter auditor: over seeds 1-30, 60 Zombie applications on party members, 37 ended in that member's KO before the Zombie was cleared, and 37 of 37 (100 %) gave the victim zero turns of her own in between. STALLED under RUBRIC section 8.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0007

### 12. PR-0002 — The FFX command plate covers a whole party member: Yuna is a staff tip above the menu in Chapter 1 and is not on stage at all in Chapter 3

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 1 (Seymour Flux) and 3 (Braska's Final Aeon) · battle, top-level command menu open, 1600x900 and 2000x1012
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-008 and docs/ENGINE-API.md#hud-safe-area (the only permitted overlap is the command stack over the party's lower third). Owner-reported 2026-09-18 and disclosed as known; the head-to-foot occlusion is past the declared exception.
- **Expected** The command stack clears the painted party quads except for the declared lower-third overlap, as the approved Battle HUD FFX tile shows with all three members clear of the menu; a disabled row is still legible.
- **Observed** Confirmed on this build by direct reading of the first command frame. In Chapter 1 the TALK / ATTACK / SPECIAL / WHITE MAGIC / ITEMS / FLEE plate sits over the left party station: Yuna's painting shows only as a ghost behind the translucent TALK row and as a staff tip above it, while Tidus and Kimahri stand clear. In Chapter 3 Yuna is not visible on stage at all and the CTB portrait column clips the right edge of Braska's Final Aeon. FFX-2 Chapter 4 and Chapter 5 are framed correctly, so this is an FFX stage-layout fault and not a shared one. What round 07 does NOT confirm is the stronger claim that Seymour Flux is reduced to a sliver at the first command frame: he reads clearly from the waist up, and only his right side is clipped by the column — the sliver appears at target selection, which is PR-0031's frame.
- **Repro** Candidate at http://localhost:5433/pyrefly-reprise/, 1600x900, PYREFLY_BROWSER=gpu. Title, Enter, chapter select, Chapter 1, party prep, skip the scene, first player turn: look at the left party slot behind the command list, then press Right/Enter into SPECIAL and look at the breadcrumb.
- **Evidence** critic/rounds/round-07/evidence/ch1/04-first-menu.png; critic/rounds/round-07/evidence/ch3/04-first-menu.png; critic/rounds/round-07/evidence/ch5/04-first-menu.png (the FFX-2 contrast); critic/rounds/round-07/targets/presentation-battle-hud-ffx.jpg; critic/rounds/round-07/targets/zoom-ch2-ch3-battle.jpg
- **Confidence** high
- **Smallest fix** Give the FFX stage a reserved gutter on both sides: inset the left party station so it clears the command plate's rectangle and the right enemy station so it clears the CTB column, measured from the panels' actual bounding boxes rather than by eye. Game case: FFX only — the FFX-2 stations already clear their panels.
- **Acceptance check** At 1600x900 and 2000x1012, in chapters 1, 2 and 3, the head and torso of every living party member and the full boss silhouette fall outside the command plate and CTB column rectangles on the first command frame.
- **This round** RE-CONFIRMED on live at 1600x900 in chapters 1 and 2: Yuna is behind the command plate head to feet, with the greyed TALK row across her face. New fact for the next batch: the plate now competes with the guide and advisor cards on the same side, so moving the plate alone will not clear the left third. STALLED under RUBRIC section 8.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0002

### 13. PR-0031 — Target selection names the target but never says who is acting, that the arrows change it, or how to go back — and in two chapters the target itself is behind the HUD

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both · 1, 3, 4 and 5 · FFX-2 battle, single-target selection
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** docs/target/targets.json, "How a fight plays" group, targeting look B approved by Bailey 2026-09-19; AGENTS.md hard rule 9; RUBRIC §7.
- **Expected** The approved tile "fight / Targeting in FFX-2" (docs/concepts/targeting/b-ring-and-dim/s3.png) carries a top "TARGET  Vegnagun — Head [PART]" plate, an actor chip ("Yuna [GUNNER]"), a letter tag on the plate under the reticle ("Vegnagun — Head [H]") and a footer hint "ENTER CONFIRM  ←→ CHANGE TARGET  ESC BACK". Bailey picked targeting look B on 2026-09-19 ("B: hand, ring and a quiet dim") and AGENTS.md rule 9 holds the build to it.
- **Observed** Re-measured this round, and one claim made during this round was REFUTED by the primary capture: the build does draw a target treatment. In Chapter 3 at 1600x900 a corner-bracket reticle, a gold pointer hand and an anchored name chip ("Yu Pagoda B") sit on the selected Yu Pagoda, the command list stays on screen and the Sensor panel reads its HP. What is still missing everywhere is the rest of the approved frame: no top TARGET plate, no actor chip saying who is acting, no PART pill or letter tag on the plate, no dimming of non-targets and no ENTER CONFIRM / arrows CHANGE TARGET / ESC BACK hint bar. Separately, in Chapter 1 the chip floats over empty ground because the enemy station sits under the CTB portrait column, and in Chapter 5 the target is at the right frame edge — those two are the staging fault of PR-0002 showing through this frame.
- **Repro** Real keys, fresh profile, 1600x900, PYREFLY_BROWSER=gpu: enter chapter 5 (ArrowRight x4 at chapter select), skip the scene, at a command menu select ATTACK and press Enter, then capture the target-selection state. Same in chapter 4.
- **Evidence** critic/rounds/round-07/evidence/gaps/ch3-target/1600x900/step-0-ONE-YU-PAGODA.png (bracket, pointer and anchored chip present); critic/rounds/round-07/evidence/gaps/ch3-target/1600x900/run.json (targetingClass true, lit ['yu-pagoda-right'], command rows still listed); critic/rounds/round-07/evidence/ch1/09-targeting.png; critic/rounds/round-07/evidence/ch4/09-targeting.png; critic/rounds/round-07/evidence/ch5/09-targeting.png; critic/rounds/round-07/targets/fight-targeting-s1.jpg; critic/rounds/round-07/targets/fight-targeting-s3.jpg
- **Confidence** high — captured in both FFX-2 chapters and compared against the approved frame in a composite.
- **Smallest fix** Smallest useful step, in this order: restore the ENTER / arrows / ESC hint bar and the actor chip, then the PART pill and letter tag, then the dim. The anchoring failure in chapters 1 and 5 is fixed by PR-0002, not here. Game case: BOTH — the approved frames cover both games and the elements are missing in both.
- **Acceptance check** Entering target selection in each of the five chapters shows the target name, who is acting, a reticle on the target actor and the change / confirm / back hints, with the target inside the frame, at 1600x900 and 2000x1012.
- **This round** RE-CONFIRMED on live: only the dim half of the approved ring-and-dim direction ships. No actor plate, no pyrefly ring, no hint row. STALLED under RUBRIC section 8.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0031

### 14. PR-0020 — The dialogue plate over-scales every portrait, so a speaker delivers the line with the top of the face cut off (merges PR-0056)

- **Severity** major · **category** visual · **status** open · **attempts** 1
- **Game / chapter / state** both · all five · battle, a story beat playing, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-012 (the actual crop in its destination), CHK-014 and RUBRIC section 6 visual - this judges the rendering, not the artwork.
- **Expected** The portrait fills its slot, cropped to the head, contained by the card frame.
- **Observed** Confirmed on this build, and PR-0056 (Jecht framed off his face) is merged in as the same root: the portrait image is taller than the plate it sits in and is clipped at the top. Measured overflow: Jecht 398 px, Kimahri 231 px, Braska 176 px, Rikku 24 px. The worst player-visible case is the mid-battle beat in Chapter 1, where Seymour says his line with everything above his nose cut away, which removes the expression the line is carrying.
- **Repro** Production candidate c71cd82 from D:/pyrefly-release/dist-gate, vite preview, fresh profile, 1600x900, PYREFLY_BROWSER=gpu. Enter each chapter's pre-battle scene and advance line by line with Enter taps, reading .dbox__portrait and the slab rect per line. critic/rounds/round-06/gap-scenes.mjs.
- **Evidence** critic/rounds/round-07/evidence/ch1/run.json, ch2/run.json, ch3/run.json, ch4/run.json sceneSpeakers overflowPx 231 / 176 / 398 / 24; critic/rounds/round-07/zz-dlg-ffx.jpg; critic/rounds/round-07/zz-dlg-ch1.jpg; critic/rounds/round-07/evidence/frames-ffx/
- **Confidence** High — measured rects on 48 chapter 1 lines and every chapter 2 line, plus two frames.
- **Smallest fix** Already written in the tree after this build: commit 71059ae 'Dialogue card: fit every portrait to its slot, fix Jecht, fix phone width', with 8fe4f99 behind it. Nothing new to design — the next deploy should carry it, and this review should verify it there.
- **Acceptance check** At 1600x900 and 2000x1012, in chapters 1, 4 and 5, the portrait element's bounding rect is fully inside the slab's rect and no pixel of the slot's fill colour is visible around the painting.
- **This round** RE-CONFIRMED on live in chapter 1: Kimahri's mane spills past the gold rule and the top of his head is cut by the frame edge, while the backdrop in the same capture matches its approved scene concept — which isolates the fault to the plate, not the art.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0020

### 15. PR-0058 — Chapter 5 opens with a speaker who has no face: Nooj's portrait is absent, not merely mis-cropped (ten FFX-2 speakers, one ticket)

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 only (every FFX script speaker is covered) · ch.5 (Nooj in the pre-battle scene, Lenne over five post-victory lines); ch.4 has the same gap for Leblanc, Logos, Ormi and Brother · pre-battle and post-victory cutscenes, speaker card
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-012 (approved final faces load instead of accidental placeholders); presentation tile A-dialogue (the card has a painted speaker); AGENTS.md rule 9 — anything Bailey sees needs an approved end state, and a blank slot is not one.
- **Expected** Every speaker a shipped script gives a line to has a face on the card, or the card has a deliberate faceless treatment that reads as designed.
- **Observed** Confirmed on this build through the real entry route. The dialogue card renders with the name plate 'Nooj' and no image at all: the portrait element resolves to img null with naturalWidth 0, so the plate is an empty frame. This is the first speaker a player meets in Chapter 5, the game's climax chapter. The other four chapters' first speakers (Kimahri, Braska, Jecht, Rikku) do render a painting.
- **Repro** Nooj: chapter 5, real keys to the pre-battle scene, one Enter tap. Lenne: chapter 5 carried to victory (entry by real keys, turns by the shipped intended strategy), then Enter-tap through the post script; lines 3, 4, 8, 9 and 10 are hers. Deterministic — the scripts are fixed. Cross-check: ls public/art/portraits against the say() ids in src/story/scripts/ffx2-vegnagun-shuyin.ts.
- **Evidence** critic/rounds/round-07/evidence/ch5/run.json sceneSpeakers [{who:'Nooj', img:null, nw:0}]; critic/rounds/round-07/evidence/ch5/03-pre-scene.png; critic/rounds/round-07/zz-scenes.jpg (panel 5)
- **Confidence** High — the files are absent from disk and the render is captured at two sizes in two chapters.
- **Smallest fix** Supply or alias a portrait for Nooj in the portrait resolver, or, until the painting exists, let the card fall back to the ink-silhouette treatment the new chapter board already uses for an unpainted card, rather than an empty frame. The ten FFX-2 speakers with no portrait are one ticket, not ten. Game case: FFX-2 only — every FFX speaker reached this round has a painting.
- **Acceptance check** For every speaker id any shipped script passes to say(), either public/art/portraits/<id>.png exists and the img reports naturalWidth > 0 in a captured dialogue frame, or the card renders with no portrait slot at all (slot rect width 0).
- **This round** RE-CONFIRMED on live: chapter 5's opening speaker Nooj still has img null.
- **Carried forward** round-07 PR-0058

### 16. PR-0061 — The player waits 6.3 to 9.9 seconds after the battle screen appears before the first command menu accepts input, in every chapter

- **Severity** major · **category** feel · **status** open · **attempts** 0
- **Game / chapter / state** both · all five · battle entry, before the first interactive command menu
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC §6 feel: responsive input, action and reaction timing, respectful skip.
- **Expected** The opening moment reads as a deliberate beat and a player who has seen it can shorten it.
- **Observed** Measured on the candidate with real keys: battle screen to first interactive command menu is 9,887 ms in chapter 1, 6,260 ms in chapter 2, 6,317 ms in chapter 3, 7,340 ms in chapter 4 and 8,631 ms in chapter 5. Every other transition is fast (title to chapter select 252-290 ms, chapter select to prep 1-76 ms, prep to scene 62-152 ms, skip release to battle 1-657 ms). No key press was found that shortens the opening beat. Frame pacing during this window is not the cause: the trace records 1,919 frames over 31.98 s at mean 16.67 ms, p99 16.8 ms, 0 frames over 33 ms, approximately 60 fps.
- **Repro** critic/rounds/round-06/gap-timing.mjs per chapter; records at evidence/gaps/timing/ch1..ch5.json, field transitions.
- **Evidence** critic/rounds/round-06/evidence/gaps/timing/ch1.json; critic/rounds/round-06/evidence/gaps/timing/ch2.json; critic/rounds/round-06/evidence/gaps/timing/ch3.json; critic/rounds/round-06/evidence/gaps/timing/ch4.json; critic/rounds/round-06/evidence/gaps/timing/ch5.json; critic/rounds/round-06/evidence/gaps/motion/trace.json
- **Confidence** Medium. The measurement is exact and repeated in all five chapters; whether ten seconds is the intended length of the battle-start moment plus the first CTB/ATB fill is a design question I did not find answered in the handoff notes, so this is raised as a question with a number attached rather than asserted as a defect.
- **Smallest fix** Confirm the intended length with the presenter's owner; if it is not intended, let a confirm press end the battle-start moment the way the cutscene skip already works.
- **Acceptance check** Either the handoff records the opening beat's intended length and the measurement matches it, or a confirm press during the battle-start moment brings the first command menu forward, measured in all five chapters.
- **Severity changed** Raised from polish to major on a better measurement: the wait is now read off the product's own play clock in four chapters and 6.8 to 8.1 seconds of it is unaccounted for by any event the presenter logs.
- **Carried forward** round-07 PR-0061

### 17. PR-0081 — Chapter 5 takes 6 minutes 11 seconds of fight at FAST speed with the game's own optimal auto-player, at 5.15 s per action against 1.2 to 1.5 s everywhere else

- **Severity** major · **category** feel · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 only · ffx2-vegnagun-shuyin · battle entry to the victory event
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 6 feel: action and reaction timing, dead waiting. Disclosed as "chapter 5 length" since round 06 and carried into this release.
- **Expected** The longest encounter in the collection is long because it is eventful, not because each action costs four times what it costs elsewhere.
- **Observed** Measured on the live build: the fight alone ran from 31.9 s to 402.5 s, 370 s at FAST speed with an optimal auto-player, across 2,256 events. That is the measured size of the disclosed "chapter 5 length" major, and it is now a number rather than an impression. The encounter auditor's headless measurement agrees: median 373.0 s at D=0 over 40 seeds.
- **Repro** Live site at 1600x900, PYREFLY_BROWSER=gpu, chapter 5, speed FAST, __pyrefly.gotoChapter(auto:"intended"). Headless control: PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts.
- **Evidence** critic/rounds/round-08/evidence/win-ffx2-vegnagun-shuyin/run.json (6:11, 2,256 events); critic/rounds/round-08/evidence/gaps/time-ffx2-vegnagun-shuyin-fast.json; critic/rounds/round-08/probe-combat/RESULTS.txt (median 373.0 s at D=0)
- **Confidence** high — measured live and headless, and the two agree within 1 %
- **Smallest fix** Not a balance change: the HP pools are sourced. The lever is presentation timing — the per-action cost, not the number of actions. Instrument where the 5.15 s per action goes in chapter 5 against the 1.2 to 1.5 s in chapters 1 to 4, and shorten whatever is specific to the Vegnagun parts (part-destroyed sequences, multi-target ladders). PR-0061 is the same class of problem at battle entry and the same instrumentation answers both.
- **Acceptance check** At FAST speed with the intended auto-player, chapter 5's seconds-per-action falls within twice the collection's median, with the event count and the outcome unchanged on the same seed.
- **Note** Given its own ID this round; it was carried as an un-numbered "known defect" in rounds 06 and 07.

### 18. PR-0001 — Phone width renders the battle HUD at 2.7 to 4.0 effective px: two thirds of the in-battle text is illegible

- **Severity** major · **category** interface · **status** open · **attempts** 1
- **Game / chapter / state** both · all five (measured in 1, Seymour Flux) · battle, first command frame and pause, 390x844
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-003 (pass bar is zero elements under 14 px); RUBRIC section 6 interface and onboarding. Open since round 03 and unchanged by this build.
- **Expected** CHK-003: nothing a player must read falls below 14 effective css px at any of the six CHK-002 viewports, 390x844 included.
- **Observed** RE-MEASURED ON THIS BUILD, not reused. At 390x844 the first command frame reports 25 of 56 visible leaf text nodes under the floor, minimum 2.68 effective px: the two OD labels and "Overdrive" at 2.68, the whole CTB portrait column (Tidus, Seymour Flux, Mortiorchis, Kimahri, Yuna) at 3.41, the advisor header and "hide guide" at 3.47, the submenu counts x4 / x3 / x27 at 3.90 and every "/maxHP" and "/maxMP" at 4.02. Pausing over that frame keeps them: 25 of 113 nodes under the floor with the same 2.68 minimum. This is a different root from the new front end (PR-0066): the battle HUD scales its own type, the front end scales through --fe-k.
- **Repro** Fresh context at 390x844 (do not resize down from a larger window). Live site, Enter past the title, Enter into Chapter I, Enter through the pre-battle scene to the first command menu; walk every leaf text node under the HUD root and multiply getComputedStyle(el).fontSize by the accumulated transform scale. No seed involved.
- **Evidence** critic/rounds/round-07/evidence/gaps/shapes/390x844/run.json (battleEff.min 2.68, 25 under 14; pauseEff.min 2.68, 25 of 113); critic/rounds/round-07/evidence/gaps/pause/390x844/run.json
- **Confidence** high — measured on the live bundle in gpu mode
- **Smallest fix** Give the battle HUD its own type floor the way the front end needs one: clamp the HUD type tokens at 14px inside the narrow breakpoint and let the panels reflow or stack, rather than letting one scalar shrink type and layout together. Game case: BOTH — one shared battle HUD shell, measured in FFX and reported on the FFX-2 side of the same sweep.
- **Acceptance check** At 390x844 in a fresh context, in one FFX and one FFX-2 chapter, the leaf-text sweep over the battle HUD returns zero elements under 14 effective px, and the same sweep at 1600x900 and 2000x1012 is unchanged.
- **This round** RE-MEASURED on the live build this round with a different floor and a worse picture: 55 leaf elements in the FFX battle HUD and 41 in the FFX-2 HUD render below 12 effective px at 390x844, minimum 2.38 px, and the command plate is drawn twice at two different scales. CHK-003's own bar is 14 px, so the 12 px sweep is a lower bound on the failure. See critic/rounds/round-08/evidence/foc/seymour-flux-390x844.json and ffx2-bahamut-390x844.json.
- **Carried forward** round-06 PR-0001; round-07 PR-0001

### 19. PR-0066 — The new front end renders at 9.54 effective px at 390x844: every label, key and hint on the title and the chapter board is below the floor

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both · title and chapter select (gates all eight tiles) · title and chapter select, 390x844, fresh context
- **Ship tags** introducedByCandidate: true · regressionVsLive: false · inNewFeature: true
- **Requirement** critic/CHECKS.md CHK-003 pass/fail "zero elements under 14px"; RUBRIC §2 platform goals (phone is a supported shape).
- **Expected** CHK-003 and the change's own acceptance: no text a player must read falls below 14 effective css px, and the title still composes at 390x844.
- **Observed** At 390x844 the chapter board reports 22 visible leaf text nodes at 9.54 effective px — the three party names, the LOCATION / BOSS / PARTY / BEST keys, the chapter numerals, the CTB badge, both visible "Coming" badges and all four control hints — with the chapter numeral at 10.27 and the chapter prose and boss line at 11.74. The title reports 9.54 for the eyebrow "An unofficial fan tribute" and for "Arrows / WASD", "Enter" and "Esc". At 1600x900 the same sweep has a minimum of 14.44 and at 2000x1012 of 16.24, so only the narrow breakpoint fails. Explicitly NOT a defect: fe-title__strap reports -14.44 / -16.24 because the measuring helper multiplies by matrix.a = -1 on the rotated vertical rail; the rail reads correctly at |eff| 14.44.
- **Repro** Fresh browser context at 390x844 with no resize down from a larger size. Load the live site, press Enter (or tap the chip) to reach the chapter select, walk every leaf text node under .fe and multiply getComputedStyle(el).fontSize by the accumulated transform scale. No seed involved.
- **Evidence** critic/rounds/round-07/evidence/gaps/pause/390x844/run.json (titleEff.min 9.54, boardEff.min 9.54, 25 nodes listed); critic/rounds/round-07/evidence/fe/frontend.json; critic/rounds/round-07/evidence/fe/16-title-390x844.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/shapes/390x844/run.json (partyPanelEff)
- **Confidence** high — measured on the live bundle, and the mechanism is traced in the shipped CSS
- **Smallest fix** src/app/screens/frontend/frontend.css:779 re-bases --fe-k to max(0.5px, min(100vw/430, 100vh/1150)) = 0.7339 at 390x844, and the smallest declared token is 13, so the floor is 13 x 0.7339 = 9.54. Smallest useful correction: stop letting --fe-k drive TYPE below the floor while it still drives layout — give the type tokens their own clamp inside the narrow media query, e.g. font-size: max(14px, calc(13 * var(--fe-k))), and let the phone column reflow rather than shrink. Do not raise --fe-k globally: the slab and rail geometry in the same block depend on it. Game case: BOTH — one shared front end.
- **Acceptance check** In a fresh 390x844 context the leaf-text sweep over .fe on both the title and the chapter select returns zero elements under 14 effective px, documentElement.scrollWidth === clientWidth, and the re-shot capture shows no clipped or overlapping labels; the same sweep at 1600x900 and 2000x1012 is unchanged.
- **This round** NOT RE-MEASURED this round; the front end is unchanged between 8f48237 and 1b33971 on the type path, so it carries at round 07's severity on round 07's evidence.
- **Carried forward** round-07 PR-0066

### 20. PR-0067 — At 390x844 the FINAL FANTASY X-2 group sits below an unmarked clip, and every control hint on that screen names a key

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both (the hidden group is FFX-2) · chapter select; hides ffx2-bahamut, ffx2-vegnagun-shuyin and the Leblanc coming card · chapter select, 390x844, first frame
- **Ship tags** introducedByCandidate: true · regressionVsLive: false · inNewFeature: true
- **Requirement** The change's acceptance that every one of the five existing chapters starts from the new chapter select with keyboard, mouse and touch; CHK-010 scope; CHK-020 (chapters 4 and 5 are reviewed first, precisely because they are always reviewed last).
- **Expected** All eight tiles in both game groups are discoverable at phone size, or the frame says plainly that there is more, in a way a touch player can act on.
- **Observed** The phone board shows the hero, the prose slab, the FINAL FANTASY X heading and four tiles, then the dossier keys and the hints. The FINAL FANTASY X-2 heading and its three tiles are below .fe-rail's clip: the rail has 158 px of overflow and the page itself does not scroll (pageScrollable 0). There is no scrollbar, fade, chevron or count. The four control hints read "LEFT/RIGHT CHOOSE · UP/DOWN GAME · ENTER BEGIN · ESC BACK" — all keyboard, on a device with no keyboard — so the one affordance that does reveal the group is both unavailable and unmentioned to a touch player. It is not unreachable: pressing Down moves the selection from seymour-flux to ffx2-bahamut and the frame follows it, and the rail is overflow-y auto so a drag should scroll it. A touch drag on the rail was never attempted, so reachability by touch is untested.
- **Repro** Fresh context at 390x844 with touch and mobile emulation. Load the live site, reach the chapter select, screenshot; enumerate [data-action^=fe-card] and compare each getBoundingClientRect().y with .fe-rail's own rect and scrollHeight.
- **Evidence** critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/gaps/board/board-title.json (phoneTop: pageScrollable 0, innerScroller .fe-rail over 158; phoneDown: Down moves the selection to ffx2-bahamut); critic/rounds/round-07/evidence/gaps/board/phone-00-top.png; critic/rounds/round-07/evidence/gaps/board/phone-01-scrolled-bottom.png; critic/rounds/round-07/evidence/gaps/board/phone-03-ffx2-card.png; critic/rounds/round-07/evidence/fe/mouse-start.json (phoneActions: fe-card-5 @ y585, fe-card-6 @ y633)
- **Confidence** high that the group is off-frame and unannounced and that the hints are keyboard-only; medium that a player fails to find it, because a touch drag was not tried
- **Smallest fix** src/app/screens/frontend/frontend.css gives .fe-rail a fixed height with overflow-y:auto and nothing else in the narrow breakpoint. Smallest useful correction: add a bottom fade mask plus a persistent group indicator — for example pin the two game headings as a two-up switch above the rail, so both games are always visible even when their tiles are not — and add a pointer row to the hint bar. Game case: BOTH, one shared screen, though the group that disappears is the FFX-2 one.
- **Acceptance check** At 390x844 in a touch context the FINAL FANTASY X-2 heading is visible in the first frame with no gesture; a touch drag on the rail brings IV and V into view; tapping the Bahamut card selects it and the plate then starts Chapter IV.
- **This round** NOT RE-MEASURED this round; carries at round 07's severity on round 07's evidence.
- **Carried forward** round-07 PR-0067

### 21. PR-0065 — The chapter board paints letter tiles and unpainted cards on arrival; the approved board only appears seconds later

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both · chapter select (all) · chapter select, first arrival, cold and warm cache, 1600x900 and 390x844
- **Ship tags** introducedByCandidate: true · regressionVsLive: false · inNewFeature: true
- **Requirement** critic/CHECKS.md CHK-012 "a fallback never ships as the final face"; the owner-approved chapter-select target; the same letter-tile shape the owner reported himself as LIVE-A2-1.
- **Expected** docs/concepts/polish/showpiece-frontend/chapter-select.png: the dossier PARTY row shows three painted faces and every list row shows its painted thumbnail. A fallback is for a decode failure, not for the first paint.
- **Observed** The primary board capture at 1600x900 shows the PARTY row as a grey letter tile "T", Yuna painted, and a grey letter tile "K", while the IV Bahamut, V Vegnagun and Leblanc rows carry no thumbnail at all and II Lady Yunalesca and III Braska's Final Aeon do. Timed sampling puts numbers on it: on a cold load the three dossier faces read letter T / Y / K at the first sample, Tidus resolves at about 0.5 s, Kimahri at about 2.7 s and Yuna only at about 4.4 s; the board itself is on screen at 493 ms. It self-heals — the same row captured at 12 s shows three painted portraits — and it reproduces at 390x844 and with a cleared save. The featured card is correctly an ink silhouette (that is the approved treatment until the chapter is cleared) and is not part of this defect.
- **Repro** Fresh context, cold HTTP cache, 1600x900. Load the live site, press Enter on the title, screenshot the chapter select on arrival and at +500 ms, +1 s, +1.5 s, +2 s; sample the .fe-party__face images for complete/naturalWidth at each step.
- **Evidence** critic/rounds/round-07/evidence/fe/11-chapter-select-1600x900.png; critic/rounds/round-07/evidence/gaps/board/facechips.json (cold: letters T/Y/K at sample 0, all three decoded by sample 8); critic/rounds/round-07/evidence/gaps/board/cold-00-first-frame.png; critic/rounds/round-07/evidence/gaps/board/facechips-cold-12s.png; critic/rounds/round-07/evidence/fe/17-chapter-select-390x844.png; critic/rounds/round-07/evidence/fe/19-board-cleared.png; critic/rounds/round-07/targets/polish-chapter-select.jpg
- **Confidence** high — the defect is in the reviewer's primary capture of the screen and the timing evidence establishes the cause
- **Smallest fix** Suspected: the board renders synchronously and the letter or empty card is what paints until each <img> load event fires. Smallest useful correction: await img.decode() on the selected chapter's three dossier faces and on the visible rows' thumbnails before the board's first paint — they are already in the preload list, so this costs a wait, not a fetch — and hold the previous card's art on a selection change. Failing that, make the fallback the ink silhouette the locked cards already use, so no state of this screen ever shows a letter. Game case: BOTH — one shared screen.
- **Acceptance check** Fresh cold-cache context at 1600x900 and again at 390x844: the chapter select captured on arrival and at +200 ms shows no letter tile, every unlocked row shows its thumbnail and every .fe-party__face img reports naturalWidth > 0 before the screen is visible; repeat after ArrowRight and ArrowDown.
- **This round** NOT RE-MEASURED this round; carries at round 07's severity on round 07's evidence.
- **Carried forward** round-07 PR-0065

### 22. PR-0063 — The new chapter board shows Yuna and Rikku in their FFX portraits on the FFX-2 chapters

- **Severity** major · **category** game-awareness · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · ffx2-bahamut and ffx2-vegnagun-shuyin (chapter board dossier) · chapter select, dossier PARTY row, with an FFX-2 card selected
- **Ship tags** introducedByCandidate: true · regressionVsLive: false · inNewFeature: true
- **Requirement** AGENTS.md hard rule 14 and CHK-021: a change true to FFX does not apply to FFX-2.
- **Expected** The dossier's faces for an FFX-2 chapter use yuna-x2.png and rikku-x2.png, as the FFX-2 battle HUD in the same session does.
- **Observed** The dossier renders art/portraits/yuna.png and art/portraits/rikku.png — Yuna in her X summoner look, Rikku in her X Al Bhed goggles — beside Paine, who is X-2 only, so the row is visibly two games at once. The correct assets ship and resolve: public/art/portraits/yuna-x2.png and rikku-x2.png exist and the same live session's Chapter 4 battle requests them. The FFX cards are correct (tidus/yuna/kimahri, tidus/yuna/auron), so the fault is FFX-2-only.
- **Repro** Title, Enter, ArrowRight until snapshotState().screenState.selectedId === 'ffx2-bahamut', wait for the faces to load, read the .fe-party__face img sources. No seed involved.
- **Evidence** critic/rounds/round-07/evidence/fe/faces.json (ffx2 block: yuna.png, rikku.png); critic/rounds/round-07/evidence/fe/53-party-row-zoom-ffx2.png; critic/rounds/round-07/evidence/confirm/c2-faces-and-rim.json (per-card faces for all five chapters; all six portraits complete, naturalWidth 832); critic/rounds/round-07/evidence/confirm/c8-ffx2-party-zoom.png; critic/rounds/round-07/evidence/ch4/run.json battleImgs (portraits/yuna-x2.png, portraits/rikku-x2.png)
- **Confidence** high — independently reproduced by the confirmation pass
- **Smallest fix** The resolver already exists: src/ui/common/partyFace.ts is the documented '-x2' / dressphere ladder that the pause party strip, PartyPrepContent.ts, ResultsScreen.ts and ui/ffx2/PartyRows.ts all climb. The new dossier in src/app/screens/frontend/chapterCards.ts bypasses it and uses the bare member id; route it through partyFace.ts keyed on Chapter.game.
- **Acceptance check** With an FFX-2 card selected the dossier face images are yuna-x2.png, rikku-x2.png and paine.png; with an FFX card selected they are tidus.png, yuna.png, kimahri.png (and auron.png on Chapter III).
- **This round** NOT RE-MEASURED this round; carries at round 07's severity on round 07's evidence.
- **Carried forward** round-07 PR-0063

### 23. PR-0017 — At phone width one of Chapter 1's two enemies is entirely off-screen

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both (shared camera fitting); observed in FFX chapter 1 · 1 (Seymour Flux) · battle, command menu open, 390x844
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-011 (no targetable enemy more than about 25 percent occluded in the default framing).
- **Expected** Both Seymour Flux and Mortiorchis are visible and identifiable in the default framing at every supported shape.
- **Observed** At 390x844 the camera zooms to preserve Seymour Flux's height and pushes Mortiorchis more than 95 percent outside the viewport - only a few pixels of green tentacle remain at x 376-390. The enemy is still in the CTB list, still in the enemy card and still targetable, but the player cannot see what they are aiming at. The lower 40 percent of the screen is empty backdrop at the same time, so the space exists. NOT RE-VERIFIED THIS ROUND: the 390x844 sweep captured the first command frame and pause, not the enemy stations.
- **Repro** Emulate 390x844, reload, PYREFLY_BROWSER=gpu. Title, Chapter 1, party prep, Enter, skip the scene, first player turn; compare the field with the 1600x900 capture, where Mortiorchis sits at 62-76 percent across.
- **Evidence** critic/rounds/round-04/evidence/shots/seymour-flux-legibility-390x844.png; crops/phone-enemies.png
- **Confidence** high
- **Smallest fix** Fit the camera to the enemy formation's bounding box rather than to the lead enemy's height, using the empty lower band. The phone layout is an approved gap awaiting Bailey's options, so this belongs with that decision rather than as a standalone tweak.
- **Acceptance check** Add tests/e2e/enemy-visibility.spec.ts with the per-chapter, per-form matrix and the 25 percent rule, run at 390x844 as well as the desktop shapes.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0017

### 24. PR-0057 — At phone width the dialogue card is crushed to a bottom strip and the key-hint bar is drawn on top of it, hiding the speaker and the line

- **Severity** major · **category** visual · **status** open · **attempts** 1
- **Game / chapter / state** both (shared dialogue-card and .chint layout; AGENTS.md rule 14 case: BOTH, shared plumbing) · reproduced in ch.1 (FFX) and ch.5 (FFX-2); the layout is chapter-independent · pre-battle cutscene at 390x844
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC §5 legibility and CHK-003; the Ink & Gold spec docs/handoff/presentation-ink-and-gold.md — the dialogue card is the primary narrative surface.
- **Expected** At phone width the speaker name, the faction plate and the line are readable, and the persistent key-hint bar does not overlap them or overflow the viewport.
- **Observed** The whole card is compressed into a roughly 60 px strip at the bottom of the 844 px viewport (slot 77x81 at y=747). The .chint bar renders over it: in chapter 5 "ENTER ADVANCE - HOLD ENTER SKIP - ESC MENU" sits across Nooj's name, his YOUTH LEAGUE plate and his line "Baralai carries him."; in chapter 1 the same bar sits across Kimahri's name and line and his portrait is reduced to a sliver. The hint bar is 443 px wide inside a 390 px viewport (x = -27, overflowing 27 px past each edge). Kimahri's image is 94x137 at y=716 against a 77x81 slot at y=747 — larger than its slot in both axes, PR-0020 again at this size. NOT RE-VERIFIED THIS ROUND; commit 71059ae in the tree claims the phone-width half.
- **Repro** Serve the candidate (D:/pyrefly-release/dist-gate, vite preview). Viewport 390x844, PYREFLY_BROWSER=gpu. Real keys: Enter at the title, ArrowRight x4 for chapter 5 (none for chapter 1), Enter, Enter at party prep. Wait for screen()=="cutscene" AND .dbox--visible AND computed opacity > 0.5 (an earlier capture shows a mid-fade card and must be discarded). Read the .dbox, .dbox__portrait and .chint rects. Deterministic, no seed.
- **Evidence** critic/rounds/round-06/evidence/gaps/escape/phone-v2.json; critic/rounds/round-06/evidence/gaps/escape/ch5-nooj-no-portrait-390x844-v2.png; critic/rounds/round-06/evidence/gaps/escape/ch1-kimahri-painted-390x844-v2.png; critic/rounds/round-06/gap-phone.mjs
- **Confidence** High — measured rects plus two frames, reproduced in both games.
- **Smallest fix** Give the cutscene layout a phone breakpoint that reserves the hint-bar height below the card (or moves the hint above it), and constrain .chint to 100 percent of the viewport width with wrapping or a shortened label set. Smallest correction: bottom padding on the cutscene stage equal to the .chint height under 768 px, plus .chint { max-width: 100% } with the separators allowed to wrap.
- **Acceptance check** At 390x844 in chapters 1 and 5, with .dbox--visible asserted: the .chint rect does not intersect the .dbox__body or the speaker-plate rect, and .chint lies entirely within 0..viewportWidth.
- **Note** Distinct from the disclosed PR-0017, which is an enemy off-screen in a chapter 1 BATTLE at phone width.
- **Carried forward** round-07 PR-0057

### 25. PR-0012 — The FFX-2 command menu, unlike the FFX one, never tells the player what the highlighted row does

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 4 and 5 · battle, command menu open, any row
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-020, which names both command menus explicitly.
- **Expected** CHK-020: the same screen in both games gets the same work, and any FFX-2 difference is deliberate and written. The FFX menu prints one line saying what the highlighted command does ('Physical damage', 'Speeds the target's turn up - inflicts Haste').
- **Observed** Re-confirmed on this build by direct reading of the first command frame in Chapter 5: the FFX-2 menu shows WHITE MAGIC / CHANGE / ITEM with no help line anywhere, while the FFX menu in Chapter 1 prints 'Physical damage' above the plate for the highlighted row. Same screen, same job, one game gets the work.
- **Repro** Open Chapter 4 to the first ATB turn with real keys and press ArrowDown/ArrowUp across the rows, reading .ig-cutin__info and the whole HUD text; run the same probe on Chapter 1. Harnesses: critic/rounds/round-04/p14-ffx2menu.mjs and confirm/x1-menu-help.mjs.
- **Evidence** critic/rounds/round-07/evidence/ch5/04-first-menu.png; critic/rounds/round-07/evidence/ch4/04-first-menu.png; critic/rounds/round-07/evidence/ch1/04-first-menu.png (the FFX contrast)
- **Confidence** high
- **Smallest fix** Mount the same info slab in FFX2BattleHud and feed it from the FFX-2 CommandMenu's selection, reusing commandHelpText's FFX-2 registry lookup.
- **Acceptance check** In Chapter 4, moving the cursor over each command prints its description, and a Playwright case asserts a non-empty description for every reachable FFX-2 row.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0012

### 26. PR-0010 — The enemy-intent panel cuts its counter rules mid-glyph with no keyboard way to read the rest

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both (shared panel) · 1 and 2 shown; anywhere the body overflows · battle, intent panel showing (E), IF YOU ATTACK list
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 6 interface (honest intent that separates certain from conditional); CHK-003 (zero clipped).
- **Expected** Either the whole counter list is legible, or the hidden part is signposted and reachable with the keyboard and pad the game is played with - the treatment the strategy guide gets with its MORE chip.
- **Observed** The body is capped at 30 percent of the frame (src/ui/common/EnemyIntent.ts:214, 459-462) and overflows with only a 6 px mask fade, no scrollbar, no chip and no key. At Yunalesca turn 1 the third bullet, 'and the Blind counter never fires' - the rule that decides whether the fight is winnable - is sliced through the middle of its glyphs at the panel edge. At Seymour Flux turn 1 the third bullet reads 'Below 50% HP Seymour answers with Reflect and' with 'phase 2 opens' cut off. The only way to reach the hidden text is a mouse wheel over the panel. NOT RE-VERIFIED THIS ROUND.
- **Repro** Chapter 2, first player turn, press E, 1600x900, read the IF YOU ATTACK list; repeat at Chapter 1.
- **Evidence** critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png, ch1-07-enemy-intent.png
- **Confidence** high - visible in two chapters and traced to the cap and the clipped class in the shipped CSS
- **Smallest fix** Give .eint__body the affordance the guide has: when eint__body--clipped is set, append a MORE chip with the hidden-line count and bind a key (and the existing pad button) that expands the panel to its natural height while held, deepening the fade so the last visible line reads as unfinished rather than sliced. Shared plumbing, so both games.
- **Acceptance check** At 1600x900 and 2000x1012, Chapter 1 and Chapter 2 turn 1, the panel either shows every counter line or shows a MORE chip; the bound key reveals the rest with the keyboard alone; no glyph is cut horizontally at any size in the rotation.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0010

### 27. PR-0011 — The FFX intent panel omits a guaranteed status: Lance of Atrophy's 100 percent Zombie is never named

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX (FFX-2 already shows it) · 1 (Seymour Flux) · battle, intent panel showing, Lance of Atrophy queued
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 2 (the enemy-intent display separates certainty from conditional outcomes); CHK-004.
- **Expected** The panel that exists to say what is about to happen names the Zombie that Lance of Atrophy lands with certainty - the status the whole chapter turns on, because the mount answers a living Zombie with Full-Life for 100 percent of max HP plus a guaranteed Death.
- **Observed** The panel reads 'Lance of Atrophy / SCRIPTED / Physical non-elemental damage to one character - never misses' with a DAMAGE block (TIDUS 707-799, 31% HP) and then the counter list. Zombie is not mentioned anywhere. The Statuses block that would carry it renders only at density 'full' (EnemyIntent.ts:785) and FFX deliberately mounts the panel at density 'brief' (FFXBattleHud.ts:431). The data is there: lanceOfAtrophy carries statusEffects zombie chance 100 (src/data/ffx/enemies/seymour-flux-abilities.ts:88). NOT RE-VERIFIED THIS ROUND.
- **Repro** Chapter 1, first player turn, press E and read the panel while Lance of Atrophy is queued.
- **Evidence** critic/rounds/round-04/evidence/shots/ch1-07-enemy-intent.png; the same panel in FFX-2 (ffx2-bahamut-03-battle-menu.png) renders its ALSO block because it mounts at full
- **Confidence** high for the omission on screen; the density split is the established cause, traced in code
- **Smallest fix** Do not widen the FFX panel: keep the brief density that round 02 asked for, but promote a guaranteed or high-chance status into the brief body, either appended to the description line ('- inflicts Zombie') or as a chip beside SCRIPTED. A 100 percent status is not optional detail, it is the move. FFX only.
- **Acceptance check** Chapter 1 turn 1 with Lance of Atrophy queued: the panel names Zombie with its chance, at brief density, without growing past its 30 percent cap; the FFX-2 panel is unchanged.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0011

### 28. PR-0013 — FFX-2 letters enemies by formation position, so a unique boss is lettered A and its identical sub-parts become B, C and D

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 5 (Vegnagun and Shuyin), links 2 to 4 · battle, any formation with two or more enemies
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-020; AGENTS.md hard rule 14 - the decision must come from the sources, and research/ffx2-combat-core.md is silent on the convention.
- **Expected** A letter distinguishes duplicates. A formation of one Vegnagun part plus three identical Nodes should leave the part plain and letter the Nodes A, B and C, exactly as FFX now behaves after this build's turnQueue.ts fix.
- **Observed** src/ui/ffx2/FFX2BattleHud.ts:827-834 letterTagOf() returns String.fromCharCode(65 + enemies.indexOf(id)) whenever the live enemy count is two or more, with no grouping by name. Driven live with real keys to Chapter 5 link 2, the engine enemy list is [vegnagun-leg 'Vegnagun', node-a 'Node', node-b 'Node', node-c 'Node'], so the unique Vegnagun is lettered A and the three identical Nodes become B, C and D - the opposite of what src/battle/ffx/turnQueue.ts:256-265 now does. vegnagun-body (Bulwark x2) and vegnagun-head (Redoubt x2) hit the same case. The player-facing cost photographed today: three identical NODE boss gauges with nothing to tell them apart and an intent panel reading 'NODE - Dies Irae - ACTS NEXT' with no way to know which Node. STILL VISIBLE THIS ROUND: the Chapter 3 CTB column letters the two Yu Pagodas A and B and the target chip reads 'Yu Pagoda B', which is the intended half; the FFX-2 half was not re-swept.
- **Repro** Drive Chapter 5 with real keys, hand link 1 to the repo's own intended strategy and stop at link 2: read the ATB tiles, the boss gauges and the intent panel. Harness: critic/rounds/round-04/confirm/x4 series.
- **Evidence** critic/rounds/round-04/evidence/logs/confirm-ffx2-letters.json, confirm-ffx2-enemy-target.json; shots/confirm-ffx2-multienemy-letters.png
- **Confidence** high on the mechanism and on the indistinguishable gauges; medium on the exact string letterTagOf writes on a name plate, which is code-traced rather than photographed
- **Smallest fix** Do not copy the FFX rule across on a reviewer's say-so. Ask Bailey the narrow question - for a boss plus its same-named sub-parts, does FFX-2 letter from A per name group, and is a lone fiend plain? - then apply the same display-name grouping turnQueue.ts letterTagFor() now uses.
- **Acceptance check** With one Vegnagun part and three Nodes on the field, the ATB tiles, boss gauges and targeting plates show whatever Bailey decides, a lone fiend is plain, and a test over the real Chapter 5 link-2 formation pins it.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0013

### 29. PR-0018 — The selected command label is the least readable text on screen, at 1.53:1

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both (shared Ink & Gold command-row tokens); observed in FFX chapter 3 · 3 (Braska's Final Aeon) · battle, first player turn, cursor on the default row, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 6 interface (readable names and values); CHK-003's contrast half.
- **Expected** The highlighted row is at least as legible as the unselected rows.
- **Observed** The cursor opens on TALK, which is disabled, and its label renders in a muted brown on the gold selection slab. Measured glyph #C39432 against slab #E4BC4D gives a contrast ratio of 1.53:1, below the 3:1 floor for large text; the unselected ATTACK row directly beneath measures 15.44:1. The player's current selection is the hardest thing on the screen to read. NOT RE-MEASURED THIS ROUND.
- **Repro** 1600x900: Title, Chapter 3, party prep, Enter, skip the scene, first player turn. Do not move the cursor. Sample the TALK glyph and slab pixels at (148,446) and (300,446).
- **Evidence** critic/rounds/round-04/crops/ch3-talk-row.png; evidence/shots/braskas-final-aeon-03-battle-menu.png
- **Confidence** high
- **Smallest fix** Give the selected-and-disabled state its own token: keep the gold slab but use the normal near-black label at reduced opacity, or invert the slab, so selection never reduces contrast below 4.5:1.
- **Acceptance check** Assert computed contrast of at least 4.5:1 for every command row label against its own background in every combination of selected/unselected and enabled/disabled, in both games.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0018

### 30. PR-0019 — The command help sentence is truncated mid-word, two sentences run together, and the ALL ALLIES chip covers the ending

- **Severity** major · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both (shared help-slab composition); observed in FFX · 1 (Seymour Flux) · battle, SPECIAL > CHEER with the group target frame live, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-009 (every name that can be shown is shown in full) and CHK-010's all-target label. This build also claims every command's help sentence matches its real targeting.
- **Expected** 'Inflicts Cheer. Hits the whole party.' with the ALL ALLIES chip clear of the text.
- **Observed** The slab reads 'Inflicts Cheer Hits the whole par' with the green ALL ALLIES chip drawn over the final word - a hard overlap, not an ellipsis - because the chip is drawn inside the slab's own box rather than beside it, and there is no punctuation between the two clauses. NOT RE-VERIFIED THIS ROUND.
- **Repro** 1600x900: Chapter 1, first player turn, Right into SPECIAL, cursor on CHEER, confirm to raise the group target frame, read the help slab.
- **Evidence** critic/rounds/round-04/crops/ch1-help-clip.png; evidence/shots/ch1-13-target-all.png
- **Confidence** high
- **Smallest fix** Dock the all-target chip outside the help slab, or right-pad the slab by the chip's width, and add the sentence separator where the two help fragments are joined.
- **Acceptance check** For every command in both games, assert the help element's scrollWidth is at most clientWidth + 1 with the target chip present, at 1280 and at 3840, and assert the composed sentence contains a terminator between fragments.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0019

### 31. PR-0014 — HUD portrait chips crop through heads; the monogram half is repaired

- **Severity** major · **category** visual · **status** open · **attempts** 1
- **Game / chapter / state** both · 1 to 5 · CTB list, party status rows, prep roster, results rows and pause dossier, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-012 (the visible crop contains the whole head; a fallback never ships as the final face) and CHK-020 (consistent portrait treatment across shared screens). Owner-reported 2026-09-18 ('Auron's HUD portrait is cropped through the chin').
- **Expected** Every portrait chip shows the whole head with air above the hair and below the chin, consistently framed across the set, and no monogram stands in for a shipped character.
- **Observed** Half repaired, and that half is verified. Paine is now a painted face everywhere she was a letter monogram: party prep (left list and bottom bar, read at 4x), the pause party bar, the battle HUD chip and results — ch4 and ch5 run.json record portraits/paine.png in prepPortraits, pausePortraits and resultsPortraits, and the face is recognisable at chip scale (silver-and-red hair, red eyes, studded collar). The crop half is unchanged: the chips still cut the top of the head on Yuna, Rikku and Paine. PARTIALLY REPAIRED IN THIS BUILD: both Paine idles were replaced and src/ui/common/face-crops.json was re-measured, and Paine's HUD chip now crops her face (portraits/paine.png at 48x70, a 0.684 source aspect into a 0.686 slot, so no distortion either). The FFX half and the rest of the FFX-2 cast were not re-swept, so the ticket stays open.
- **Repro** 1600x900: Chapter 1 battle, read the CTB list and the party rows; Chapter 3 battle, read Auron's row; Chapter 4, read Paine's battle row, then lose and read her results row, then RETRY and read the prep roster, then Esc and read the pause chips.
- **Evidence** critic/rounds/round-07/evidence/gaps/art/spotcheck.json (chips); critic/rounds/round-07/evidence/gaps/art/paine-chip-zoom.png; critic/rounds/round-07/targets/zoom-ch4-chips.jpg
- **Confidence** high
- **Smallest fix** Apply a focal-point sidecar per shipped portrait and compute the chip crop from it instead of centre-cropping the plate, asserting the computed crop box lies inside the plate and contains the declared head box. Until art/portraits/paine.png exists, have portraitImgHtml fall back to the same head crop the battle HUD already uses rather than to an initial, so one character has one face on every screen. Paine's missing base portrait is a disclosed art gap and needs the plate, not a code fix.
- **Acceptance check** Extend tests/e2e/portraits.spec.ts over all five chapters and their full rosters, asserting for every chip a painted layer above the monogram z-index, a non-zero box, no 4xx on /art/ and a computed crop whose head box is fully inside the visible rect; and in one session Paine's face is the same image in the battle row, the results row, the prep roster and the pause dossier.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0014

### 32. PR-0016 — The Chapter 4 pause plate is cropped past its approved framing and loses Bahamut entirely

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 as observed; the framing rule is shared and should be checked for all five plates · 4 (Bahamut) · pause (Esc) during battle, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** The approved-target gate, RUBRIC section 7, tile 'Hero plate, chapter 4'. An approved close-up may crop a head on purpose; accidental crop damage is the defect.
- **Expected** The approved painting - Yuna looking at the viewer with Bahamut's head at her shoulder against a bright sky - presented full-bleed, the way the Chapter 1 plate is (docs/screenshots/concept/pause-ch4.png, 'the chapter 4 pause painting, full-bleed').
- **Observed** Re-confirmed on this candidate's own capture. The chapter 4 pause plate is scaled to a face-only close-up: the eyes and cheek fill the frame and the character with Bahamut, the scarf, the costume and the sky that the approved painting composed around are outside the viewport. Chapter 1's plate, by contrast, holds its approved full-bleed framing at both sizes. NOT RE-VERIFIED THIS ROUND: the pause sweep covered Chapter 1 at 1600x900, 2000x1012 and 390x844 only.
- **Repro** 1600x900: Title, Chapter 4, party prep, Enter, skip the scene, battle, Esc. Compare with docs/screenshots/concept/pause-ch4.png.
- **Evidence** critic/rounds/round-05/evidence/onboarding/pause-rows-ffx2.png; critic/rounds/round-05/targets/C3.jpg (build panel); critic/rounds/round-05/targets/pause-2000x1012.jpg (chapter 1, for contrast)
- **Confidence** high
- **Smallest fix** Give the Chapter 4 pause plate the same cover-fit rule the Chapter 1 plate uses, or a focal box that keeps Bahamut's head inside the frame at 16:9, instead of the current zoom.
- **Acceptance check** Re-pair the tile at 1600x900 and 2000x1012 and confirm the composite shows both Yuna's whole head and Bahamut's head inside the frame; repeat for every chapter's pause plate so the set is framed by one rule.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0016

### 33. PR-0005 — The approved Turn cut-in never appears in play: showTurnCutIn has no production call site

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both (the tile names chapter 1) · observed in 1 · battle, every party turn-start, and the whole battle entry
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** The approved-target gate (RUBRIC section 7): every required target in targets.json must match. AGENTS.md hard rule 4 and CHK-023: a complete, unit-tested subsystem with zero runtime callers.
- **Expected** When a party member's turn begins, the Ink & Gold portrait cut-in plays. docs/target/targets.json, group presentation, tile 'Turn cut-in', status approved.
- **Observed** Re-traced on the candidate: no cut-in appears on any turn in any of this round's five real-input routes. showTurnCutIn is defined at src/ui/inkgold/cutin.ts:84 and re-exported at src/ui/inkgold/index.ts:17, and a grep over src/ finds no other reference — it has no production call site, so the approved target cannot be delivered. This is the "built but wired to nothing" class of AGENTS.md hard rule 4. NOT RE-VERIFIED THIS ROUND.
- **Repro** node critic/rounds/round-04/g2-ch1-win.mjs against dist-gate; read the cutin field of every sampled state in g-ch1-entry-timeline.json and the 'cut-ins observed at a player turn' line in g2-ch1-log.json.
- **Evidence** src/ui/inkgold/cutin.ts:84 and src/ui/inkgold/index.ts:17 (traced in D:/pyrefly-release at 740ab21); critic/rounds/round-05/evidence/ch1/04-first-menu.png and the ch1-ch3 run records
- **Confidence** high
- **Smallest fix** Either wire the cut-in into the turn-start path of the presenter and HUD, at the same place the CTB list marks the new actor, or, if the direction has changed since the tile was approved, take it back to Bailey as an end-state question. This is the owner's decision, not a builder's silent one.
- **Acceptance check** A real-input run of Chapter 1 records at least one frame where .ig-cutin is visible with the acting member's name at a party turn-start, and node tools/orphans.mjs plus a call-site check show showTurnCutIn has a production importer.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0005

### 34. PR-0035 — The FFX-2 battle field is mirrored against the approved Battle HUD FFX-2 tile, and Bahamut is under-lit

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 4 · battle, command menu open, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 7; AGENTS.md rule 14 (decide from the sources, and if they do not say, ask).
- **Expected** Either the approved tile's composition, or a recorded decision that the mirror is intentional.
- **Observed** The field is mirrored - Bahamut sits right of centre and the party stand left - and Bahamut is rendered much darker and lower-contrast than in the approved tile, where his red wings and purple armour carry the left third. Neither docs/handoff/presentation-ink-and-gold.md nor research/ffx-vs-ffx2-presentation.md states a party/enemy side convention, so whether the mirror is intended cannot be decided from the sources. NOT RE-VERIFIED against the tile this round.
- **Repro** Pair the Chapter 4 battle capture with the approved tile.
- **Evidence** critic/rounds/round-04/targets/presentation-battle-ffx2.jpg
- **Confidence** high on the observation; the intent is unknown
- **Smallest fix** Ask Bailey once whether the FFX-2 field keeps the approved left-enemy composition or the mirrored one and record the answer against the tile. Either way, raise Bahamut's key light so he reads against the dark Bevelle backdrop as he does in the tile.
- **Acceptance check** The tile carries a recorded decision and the composite matches it.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0035

### 35. PR-0015 — Vegnagun's green tail tip reads as a green artefact stuck to Rikku's arm for all of Chapter 5

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 5, battle 1 of 5 · battle, default framing, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-014's wider class (art correct in isolation can still be wrong once staged) and CHK-011 (a targetable enemy's readable features are not occluded by the party).
- **Expected** The party line and the enemy's painted extent do not intersect in a way that makes either look broken.
- **Observed** Re-observed on this candidate: Vegnagun's green tail tip still reads as an un-keyed green shard stuck to Rikku's forearm through all of chapter 5.
- **Repro** 1600x900, PYREFLY_BROWSER=gpu. Title, Chapter 5, party prep, Enter, skip the scene, first player turn: look between Rikku's raised right gauntlet and the hilt of her sword.
- **Evidence** critic/rounds/round-05/evidence/ch5/04-first-menu.png and the ch5 capture set
- **Confidence** high
- **Smallest fix** Move the Chapter 5 battle-1 enemy slot right, or the party line left, so the tail's green tip clears the party quads. Do not repaint either approved plate.
- **Acceptance check** Project the vegnagun-tail quad and each party quad through the Chapter 5 camera and assert zero intersection in the default framing, then re-shoot and confirm no saturated-green pixels (g>170, g-r>60, g-b>45) fall inside any party member's bounding box.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0015

### 36. PR-0022 — A KO'd character is the standing billboard rotated about its centre, floating off the ground away from her station

- **Severity** major · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX (observed); the treatment is shared, so it is expected in both · 1 (Seymour Flux) · battle, after Yuna is KO'd, 1600x900
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** RUBRIC section 6 visual (poses, ground contact); the approved 'Yuna, battle poses' tile.
- **Expected** A downed character reads as down on the ground at her own station, the way FFX stages a KO. Ground contact is a named visual criterion in RUBRIC §6 and in CHK-014.
- **Observed** RAISED FROM POLISH TO MAJOR this round, on direct observation rather than a synthesized state: in a real-input capture of Chapter 1, after Yuna is KO'd (her party row reads 0/1500 and is greyed), she is drawn lying horizontally in mid-air at about the other actors' chest height, displaced far left of the party group into empty backdrop, with no ground contact and a white bloom over her torso. It is the most conspicuous wrong thing on screen in that frame, and a KO is a routine event in every chapter. Round 06 filed the same root as polish from a smaller sample; the severity is raised for visibility and frequency, not because the defect changed.
- **Repro** Chapter I from the board with real keys; play until Yuna is KO'd, then open target selection and capture at 1600x900 (route as in evidence/ch1/run.json).
- **Evidence** critic/rounds/round-07/evidence/ch1/09-targeting.png
- **Confidence** high
- **Smallest fix** Rotate the KO billboard about the actor's feet, not its centre, and keep it at the actor's own station on the ground plane; better, give the cast a dedicated downed pose. Game case: BOTH — one shared actor layer.
- **Acceptance check** A KO in one FFX and one FFX-2 chapter leaves the character touching the ground plane at her own station, with no gap between the billboard and the floor, at 1600x900 and 2000x1012.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0022

### 37. PR-0021 — The banter bank is authored but not implemented: no formation-screen or victory-screen exchanges exist in either game

- **Severity** major · **category** narrative · **status** open · **attempts** 0
- **Game / chapter / state** both · party prep and results, all five · party prep and results screens
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** research/writing-bible.md section 4, the governing doc AGENTS.md maps src/story to; RUBRIC section 6 names banter as a scored element of narrative.
- **Expected** research/writing-bible.md section 4 BANTER BANK: two-to-four-line exchanges for the party formation screen and the victory screen - 32 FFX exchanges plus the FFX-2 set, each tagged Suitability, Slot (Form/Win/Both) and Mood. The formation screen and the victory screen each play a suitability- and mood-matched exchange.
- **Observed** Confirmed still open and unchanged. git diff 740ab21..c71cd82 -- src/ touches no file that could feed a banter slot, and chapter 4's and chapter 5's prep and results captures show no exchange. Second consecutive review leaving it open at the same severity, so RUBRIC §8's method check applies to the next batch in this area. NOT RE-VERIFIED THIS ROUND.
- **Repro** Open any chapter's party prep with real keys and look for an exchange; grep -rn 'banter' D:/pyrefly-release/src.
- **Evidence** critic/rounds/round-06/evidence/ch4/02-prep.png; critic/rounds/round-06/evidence/ch4/11-results.png; critic/rounds/round-06/evidence/ch5/02-prep.png; critic/rounds/round-06/evidence/ch5/11-results.png
- **Confidence** high on the absence
- **Smallest fix** Add a banter table beside the writing bible's own tags and a picker that matches slot, suitability and mood to the current formation and outcome, then host it on the prep screen and the victory results screen.
- **Acceptance check** Open party prep in each of the five chapters and win one: each shows a two-to-four-line exchange whose speakers are in the active formation and whose mood matches the outcome.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0021

### 38. PR-0082 — Three of the five chapters have still never been won by a player's own commands: the first wins in chapters 1, 3 and 5 came through the debug hook

- **Severity** major · **category** process · **status** open · **attempts** 1
- **Game / chapter / state** both · seymour-flux, braskas-final-aeon, ffx2-vegnagun-shuyin (and the chapter 2 victory results screen) · victory, post-battle script, results
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-022 and RUBRIC section 5: a debug hook may set up a state but cannot prove a player can win it. Milestone acceptance needs, per included chapter, one continuous legal-input route from normal entry to outcome.
- **Expected** Each included chapter reaches victory, its aftermath and its results through real input at least once.
- **Observed** Real progress this round, and a precise remainder. ffx2-bahamut was won through the full real-input route in 1:43, including the post-battle scene, results and the CLEARED banner — the first chapter in any round to do so. seymour-flux, braskas-final-aeon and ffx2-vegnagun-shuyin reached victory, the post-battle cutscene and results for the FIRST TIME IN ANY ROUND, but through gotoChapter(auto:"intended") / autoBattle, correctly labelled injected, so their win half is UNVERIFIED under CHK-022's own wording. Chapter 2 was played entirely by hand (15 turns, 213 events, seed 1) and ended in a defeat whose results screen is legible and correct, and its earlier hand-played run resolved the fight and left the battle screen into the post-battle cutscene but did not reach results inside the run budget. What the injected wins DO establish, and what they were used for, is that the rewards are right: Seymour Flux AP 10,000 / Gil 6,000 matches src/data/ffx/enemies/seymour-flux.ts, Braska's Final Aeon 0 AP / 0 gil matches its section 2.3 comment, Shuyin EXP 0 / AP 20 per dressphere / Gil 0 matches research/ffx2-vegnagun-shuyin.md section 1.
- **Repro** Read critic/rounds/round-08/evidence/index.json: 235 entries, 209 of them injected:false. The four win-* runs are labelled injected.
- **Evidence** critic/rounds/round-08/evidence/index.json; critic/rounds/round-08/evidence/ch4/ and critic/rounds/round-08/evidence/win-ffx2-bahamut/run.json (the real-input victory); critic/rounds/round-08/evidence/win-seymour-flux/run.json, win-braskas-final-aeon/run.json, win-ffx2-vegnagun-shuyin/run.json (injected); critic/rounds/round-08/evidence/gaps/ch2-35-results.png and gaps/gap-w-ch2.json (hand-played chapter 2, defeat)
- **Confidence** high
- **Smallest fix** One real-input win in chapter 2 on a seed the bench says the intended line wins (39/40), driven through the command menu to the results screen — that is the cheapest remaining gap and it closes the FFX side. Chapters 1, 3 and 5 are genuinely hard to hand-play to a win at their current length and difficulty (PR-0008, PR-0081), so their real-input wins should follow the repairs to those two, not precede them.
- **Acceptance check** One continuous real-keyboard route per game reaches victory, plays its post-battle script, reaches results and returns to chapter select, with no injected command in the run record.

### 39. PR-0059 — Evidence integrity: three of this round's recorded claims are contradicted by its own data files (CHK-016 FAIL)

- **Severity** major · **category** process · **status** open · **attempts** 0
- **Game / chapter / state** both · all five, plus the dark probe · the round's evidence index and two harness scripts
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** critic/CHECKS.md CHK-016 (mandatory on every deployment); RUBRIC §5, "confirm screen, chapter, phase, actor and state before each capture".
- **Expected** Every narrative claim in the evidence index is readable back out of a recorded measurement, and every capture's asserted state was proved by the harness.
- **Observed** (1) index.json notes say chapter 2's scene shows Braska, Jecht and young Auron with the new portraits; ch2/run.json sceneSpeakers holds one entry, Jecht/jecht.png — play.mjs pushes one sample and then holds Enter for 1300 ms, which skips the scene, so only one speaker is ever sampled per chapter. (The claim happens to be true: the gap pass later captured all three. It was still unsupported when it was written.) (2) The notes say the menu-row invariant held at 6 rows minimum and never zero; menuRowSamples reads n:0, first:null in every sample of every chapter and zeroRowMenus is 3, 22, 12, 52 and 24, because the DOM selector matches no node — the capture proves neither the invariant nor its breach, and the invariant is in fact proved by the engine bench and by the 301-turn runtime log, not by this capture. (3) dark/01-pause-1600x900.png asserts screen=pause but supp.mjs never reads screen() after the Escape, and the frame shows no pause screen. A fourth, harmless instance: gap-audio.mjs reads d.music ?? d.currentTrack ?? d.track and records music:null for every sample, while the same file's audioRaw shows playing:"boss-jecht" — the raw field kept the truth, so no false claim was published.
- **Repro** Read evidence/index.json against ch2/run.json, ch4/run.json and ch1/supp-dark-1600x900.json, and read critic/rounds/round-06/play.mjs lines 64-73 and 92-97, supp.mjs lines 88-108, gap-audio.mjs line 29.
- **Evidence** critic/rounds/round-06/evidence/index.json; critic/rounds/round-06/evidence/ch2/run.json; critic/rounds/round-06/evidence/ch4/run.json; critic/rounds/round-06/evidence/ch1/supp-dark-1600x900.json; critic/rounds/round-06/evidence/gaps/audio/ch3.json; critic/rounds/round-06/play.mjs; critic/rounds/round-06/supp.mjs; critic/rounds/round-06/gap-audio.mjs
- **Confidence** High.
- **Smallest fix** In play.mjs sample the speaker before every advance and advance with a tap rather than a 1300 ms hold; replace the command-row selector with the one the HUD actually emits and fail loudly when it matches nothing; in supp.mjs assert screen() after the Escape before shooting dark/01; in gap-audio.mjs read the audioDebug field that exists (playing). Then restate the three claims from the new data. This is the second consecutive round with an evidence-integrity finding (round 05 PR-0042), so the harness, not the reviewer, is the thing to fix.
- **Acceptance check** Each chapter's run.json lists every speaker its script contains, menuRowSamples reports a non-zero row count on a turn the player was asked to act, and every capture's asserted field names a state the harness read back.
- **This round** RE-OPENED with new instances on this round's own evidence: six captures were taken inside a transition fade and assert a screen they do not show (four win-route 10-pre-scene.png, win-braskas-final-aeon 11-battle.png and 20-victory-scene.png), and ch5/10-targeting.png is labelled as target selection while showing the WHITE MAGIC spell list. Harness faults, not product defects, but they are recorded as a check failure (CHK-016) rather than waved through.
- **Carried forward** round-07 PR-0059

### 40. PR-0060 — The approved Yu Yevon speaker-portrait tile has no acceptance case that play can ever produce

- **Severity** major · **category** process · **status** open · **attempts** 0
- **Game / chapter / state** FFX only · ch.3 (braskas-final-aeon) · the yu-yevon-arrives trigger
- **Ship tags** introducedByCandidate: false · regressionVsLive: false · inNewFeature: false
- **Requirement** CHK-012 and RUBRIC §7's approved-target gate — every required tile in docs/target/targets.json must be matched from the build.
- **Expected** The tile's stated acceptance case, "A dialogue line spoken by Yu Yevon with the portrait showing (public/art/portraits/yu-yevon.png)", is producible from play so the tile can be verified.
- **Observed** No shipped script gives yu-yevon a say() line. grep -rn "say('yu-yevon'" over src/story/ returns nothing, and a full trace of every say() id in every shipped script does not list it. yu-yevon is declared as a SpeakerId (src/story/dsl.ts:45) and exists as a combatant id, an AI script id and a music/sfx key, but its only story-layer uses are a trigger condition (braskas-final-aeon.ts:221, when: { type: "hp-below", who: "yu-yevon" }) and an fx call (line 349); the lines over his on-field reveal belong to Tidus and then Auron (lines 350-352). public/art/portraits/yu-yevon.png ships at 1.56 MB and can never be displayed as a speaker portrait. The tile's own note already records that the file is a safety net against a 404 rather than a face, which contradicts the acceptance case as written.
- **Repro** In D:/pyrefly-release: grep -rn "say('yu-yevon'" src/story/ (no matches); grep -rn "yu-yevon" src/story/ (only dsl.ts:45 and braskas-final-aeon.ts 220/221/223/285/305/347/349). Then play chapter 3 to the yu-yevon-arrives trigger and observe the speaker is Tidus, then Auron.
- **Evidence** critic/rounds/round-06/evidence/gaps/yu-yevon/trace.txt (full grep transcript and the tile record); critic/rounds/round-06/evidence/gaps/audio/ch3-phase-7.png (the arrival itself)
- **Confidence** High — traced in source, and the tile's own note corroborates it.
- **Smallest fix** An owner decision, not a code fix. Put to Bailey: re-word the tile to an acceptance case the build can meet ("yu-yevon.png exists and is wired as the fallback for the yu-yevon-reveal fx"), mark it not-required, or author a Yu Yevon line — which is new content and needs a yes under AGENTS.md rule 10.
- **Acceptance check** Either a captured dialogue frame at 1600x900 shows speaker "Yu Yevon" with yu-yevon.png at naturalWidth > 0, or the tile in docs/target/targets.json carries a delivery state that does not require one.
- **This round** NOT RE-TESTED this round; carries.
- **Carried forward** round-07 PR-0060

### 41. PR-0069 — The possessed-aeon mirror does not mirror affinities, although the source comment says it does

- **Severity** polish · **category** combat · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 3 (Braska's Final Aeon, the possessed-aeon links) · battle setup, any possessed aeon
- **Requirement** AGENTS.md hard rule 6 (never invent game data) and RUBRIC §5 (a claim is matched to its proof).
- **Expected** The shipped code and the comment above it describe the same behaviour.
- **Observed** Traced, not grepped. src/battle/ffx/setup.ts:241-253 mirrorPossessedAeon correctly overwrites stats, HP, MP and the form's HP from the live AeonBuild with Luck forced to 1 — that part is wired and is what hard rule 4 exists to catch. But the doc comment two lines above (src/battle/ffx/setup.ts:235) says "Affinities are mirrored too, so 'hit its weakness' means something", and the code does c.affinities = { ...c.affinities }: a shallow copy of the enemy's OWN affinities, a no-op. It could not do otherwise — AeonBuild (src/battle/common/types.ts:2353-2372) carries no affinities field to mirror from. There is no observed player effect: the possessed aeon uses the affinities in its data file, which is a defensible authored choice. The defect is that the source asserts a behaviour the data model cannot provide, which is exactly the kind of statement a later change will trust.
- **Repro** Read src/battle/ffx/setup.ts:235-253 and src/battle/common/types.ts:2353-2372 at 8f48237.
- **Evidence** src/battle/ffx/setup.ts:235 (the comment) and :247 (c.affinities = { ...c.affinities }); src/battle/common/types.ts:2353-2372 (AeonBuild has no affinities field)
- **Confidence** high for the trace; the player impact is none observed
- **Smallest fix** Decide it from the source and write down which it is: either drop the dead self-copy and the sentence, saying plainly that a possessed aeon keeps its data-file affinities, or add affinities to AeonBuild and mirror them. research/ffx-bfa-yu-yevon.md §2.2 should settle it; if it does not, ask Bailey. Game case: FFX only.
- **Acceptance check** The comment and the code agree, and a unit test asserts whichever behaviour is chosen for one possessed aeon.
- **This round** RE-CONFIRMED and now shown to be unimplementable as documented: AeonBuild (src/battle/common/types.ts) carries no affinities field at all, so setup.ts's c.affinities = { ...c.affinities } cannot mirror anything.
- **Carried forward** round-07 PR-0069

### 42. PR-0070 — Winning Chapter 2 cuts straight from the battle to the results card with no post-battle scene, while Chapter 4 plays one

- **Severity** polish · **category** narrative · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 2 (Lady Yunalesca) · victory, immediately after the battle ends
- **Requirement** RUBRIC §2 and §6 narrative (a satisfying aftermath).
- **Expected** RUBRIC §2: climax and aftermath matter alongside the fight, and a scene counts only when the player can reach it. Chapter 4 sets the pattern: it plays a victory scene before the results.
- **Observed** On the first victory ever recorded through the normal entry route, Chapter 2 goes battle -> results with afterBattle = "results" and postSceneLines empty. The aftermath the player does get is the victory quip on the results card ("...Okay. Next one.") and the ledger. Chapter 4 plays a post-battle scene in the same run of the same harness, so the machinery exists and Chapter 2 does not use it. Whether Yunalesca is meant to have one is a question for Bailey, not an assumption for a reviewer.
- **Repro** Title -> board -> Chapter II -> prep -> pre-battle scene -> win the fight -> read afterBattle and postSceneLines.
- **Evidence** critic/rounds/round-07/evidence/gaps/win-ch2/run.json (afterBattle "results", postSceneLines []); critic/rounds/round-07/evidence/gaps/win-ch2/21-results-victory.png; critic/rounds/round-07/evidence/gaps/win-ch4/20-victory-scene.png (the contrast); critic/rounds/round-07/evidence/gaps/win-ch4/run.json
- **Confidence** high for the observation; the requirement is a question for Bailey
- **Smallest fix** Ask Bailey whether Chapter 2 should have an aftermath beat; if yes, it is a script, not a mechanism. Game case: FFX only unless Bailey says the rule is shared.
- **Acceptance check** Whatever Bailey chooses is true of all five chapters and is recorded in docs/target/decisions.json.
- **This round** NOT RE-TESTED this round; chapter 2 was played by hand to a defeat, so the victory-side post-battle scene was not reached. Carries.
- **Carried forward** round-07 PR-0070

### 43. PR-0074 — The advisor's explanation prints the status name twice: 'inflicts Haste / Haste on the party.'

- **Severity** polish · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both (observed in FFX) · 1 (Seymour Flux) · battle, first command frame, advisor card open (N)
- **Requirement** CHK-007 (player-facing copy conveys player meaning); RUBRIC §6 interface.
- **Expected** One sentence about the effect, then the status line, with no repetition.
- **Observed** The advisor card for Hastega reads "Speeds the party's turns up · inflicts Haste" and then, on the next line, "Haste on the party." — the status name lands twice and the second line is a fragment. The same duplication appears in the pause capture's text dump. Round 06's PR-0026 ('Haste is ctb x 8/16') does not appear in this build, so the developer-vocabulary half of that copy looks repaired and this is what replaced it.
- **Repro** Chapter I, first command frame, press N, read the advisor card.
- **Evidence** critic/rounds/round-07/evidence/ch1/04-first-menu.png; critic/rounds/round-07/evidence/ch1/05-advisor-N.png; critic/rounds/round-07/evidence/gaps/pause/1600x900/run.json hiddenText ("inflicts Haste Haste on the party")
- **Confidence** high
- **Smallest fix** Suspected: the effect clause and the status clause are composed independently and both name the status. Compose one of them. Game case: BOTH — shared advisor copy.
- **Acceptance check** For every ability the advisor can recommend in all five chapters, no status name appears twice in one card.
- **This round** NOT RE-TESTED this round; carries.
- **Carried forward** round-07 PR-0074

### 44. PR-0073 — The title offers exactly one pointer target, labelled PRESS ENTER, with keyboard-only hints — a touch player is never invited to tap

- **Severity** polish · **category** onboarding · **status** open · **attempts** 0
- **Game / chapter / state** both · title · title, fresh profile, 390x844 and 1600x900
- **Requirement** RUBRIC §2 platform goals (touch is supported); the change's own acceptance names touch.
- **Expected** A touch player is told, in words or by an affordance, how to start.
- **Observed** The pointer path itself WORKS and a claim that it does not was refuted this round: the chip is <span class="fe-title__chip" data-action="confirm" role="button" tabindex="0">, it is the only [data-action] node on the screen, and one click at its centre (128,554 at 1600x900; 144,624 at 2000x1012) or one tap at (82,281) in a 390x844 touch context moves screen() from 'title' to 'chapter-select'. What remains is wording and reach: the chip is the ONLY pointer target — a click anywhere else does nothing — it is a 131x43 button at phone size, and it says PRESS ENTER beside a ControlsHint row that names Arrows / WASD, Enter and Esc and no pointer at all.
- **Repro** Fresh profile at 390x844 with touch emulation; tap the chip (works) and tap elsewhere (nothing).
- **Evidence** critic/rounds/round-07/evidence/confirm/c1-title-input.json; critic/rounds/round-07/evidence/confirm/c3-phone-title.png; critic/rounds/round-07/evidence/confirm/c4-phone-after-chip-tap.png; critic/rounds/round-07/evidence/gaps/board/board-title.json titleInput (all three sizes reach chapter-select on one click); critic/rounds/round-07/evidence/gaps/title-input/390x844-after-tap.png
- **Confidence** high
- **Smallest fix** Give the chip a pointer-aware label (or a second line) and add a pointer row to the title's ControlsHint, the way the board carries its own hints; optionally accept a pointerdown anywhere on the title root. Game case: BOTH.
- **Acceptance check** At 390x844 in a touch context the title names a tap as a way to start, and a tap anywhere on the title root reaches the chapter select.
- **This round** NOT RE-TESTED this round; carries.
- **Carried forward** round-07 PR-0073

### 45. PR-0062 — The Berserk bench seeds do not transfer to play, and 20 in-game runs of the Chapter 5 Leg link landed Berserk on nobody

- **Severity** polish · **category** process · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · ffx2-vegnagun-shuyin, link 2 · the reviewer's own instrumentation, not the product
- **Requirement** RUBRIC §5: match proof to the claim — a seeded engine fixture cannot stand in for the shipped seeding.
- **Expected** A seed that makes the bench land Berserk makes the shipped chapter land it, so the player-facing half of PR-0052 can be captured.
- **Observed** Two facts block that capture and both belong in the record. (1) z06-passes and z06-berserk construct an isolated vegnagun-leg battle with engine.setSeed(n), while in shipped play each link is seeded from the chapter run (docs/DEV.md: engines are seeded per battle via BattleSetup.seed), so __pyrefly.setSeed(13) before chapter 5 is not the bench's seed 13. The seed-finder confirms the bench-side hits (seeds 3, 13, 27, 36, 38 put Yuna in White Mage under Berserk, earliest at turn 8) but they address the fixture, not the game. (2) Twenty in-game seeds (1-20) were swept, skipping link 1 and watching link 2 at normal speed, polling battleState about every 300 ms. The Leg link was reached in all 20 runs and Berserk was applied to nobody in any of them, although the AI path is live (src/battle/ffx2/ai/vegnagun.ts:72-87 rolls 1-in-3 Berserk / Break / Slow, and Slow was observed landing on Yuna on link 2 in a diagnostic run) and the bench predicts Berserk on a party member in about 6 of 24 isolated Leg battles. A false hypothesis was chased and discarded: legAction1 asks for "leg-berserk" while the registry holds "x2-vegnagun-leg-berserk", but re-running z06-legai proves the unprefixed ids do fire (19 leg-berserk casts over 24 seeds), so there is no id-resolution bug.
- **Repro** critic/rounds/round-06/gap-berserk.mjs and gap-berserk2.mjs (in-game sweep); critic/rounds/round-06/bench/z06-gap-seeds.test.ts (seed finder).
- **Evidence** critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-sweep2.json; critic/rounds/round-06/evidence/gaps/berserk/pr-0052-seed13.json; critic/rounds/round-06/bench/out/z06-gap-seeds.txt
- **Confidence** High on both measurements. The discrepancy between 6-in-24 predicted and 0-in-20 observed is unexplained and is the thing to reconcile; it may be the harness's sampling, the chapter seeding, or a real difference between the fixture and the shipped link.
- **Smallest fix** Expose the per-link seed the chapter actually used through the debug API (or let __pyrefly.setSeed apply per link), so a bench seed can be reproduced in play. Then re-run the sweep and either capture the Berserked turn for PR-0052 or explain the difference.
- **Acceptance check** A named seed makes the shipped chapter 5 link 2 land Berserk on Yuna in White Mage, and the resulting turn is captured at 1600x900.
- **This round** NOT RE-TESTED this round; carries on round 07's evidence.
- **Carried forward** round-07 PR-0062

### 46. PR-0054 — The Vegnagun Leg's Break branch falls back to Absorb on an unsourced inference

- **Severity** polish · **category** combat · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · ffx2-vegnagun-shuyin, link 2 · the Leg's Action1 when every party member already carries the rolled status
- **Requirement** AGENTS.md hard rule 6: numbers and behaviour come from research/*.md with their source notes; unsourced behaviour is left alone and said so.
- **Expected** Each of the three Action1 branches behaves as its source line states, and anything extrapolated is marked as an inference.
- **Observed** research/ffx2-vegnagun-shuyin.md:708-711 gives the Absorb fallback explicitly for two of the three branches — "1/3: Berserk on a non-Berserked char (if all Berserked -> Absorb)" and "1/3: Slow on a non-Slowed char (if all Slowed -> Absorb)" — and gives no fallback for "1/3: Break on a non-Petrified char". src/battle/ffx2/ai/vegnagun.ts:82-85 applies the same Absorb fallback to all three, and the function's doc comment cites §5.2 for the whole rule including the Break case. The extrapolation is reasonable and probably right; it is not marked as one.
- **Repro** Read research/ffx2-vegnagun-shuyin.md lines 708-711 against src/battle/ffx2/ai/vegnagun.ts legAction1 (lines 72-87).
- **Evidence** research/ffx2-vegnagun-shuyin.md:708-711; src/battle/ffx2/ai/vegnagun.ts:72-87
- **Confidence** High on the divergence (both texts read directly). Low player impact: reaching the state needs all three girls already Petrified.
- **Smallest fix** Mark the Break fallback in the comment as an inference from the Berserk and Slow lines rather than as §5.2, or find a source that states it.
- **Acceptance check** The comment at src/battle/ffx2/ai/vegnagun.ts distinguishes the two sourced fallbacks from the inferred one, or a source line is cited for the Break case.
- **This round** RE-READ on this build and unchanged: src/battle/ffx2/ai/vegnagun.ts legAction1 still applies the Absorb fallback to the Break branch on an unsourced inference.
- **Carried forward** round-06 PR-0054; round-07 PR-0054

### 47. PR-0034 — The battle camera's grade drops the approved Chapter 1 backdrop's moon and lit snow

- **Severity** polish · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 1 (Mt. Gagazet) · battle versus the pre-battle scene, 1600x900
- **Requirement** The approved scene tile 'Ch.1 Mt. Gagazet'; CHK-013 judges art inside the running game.
- **Expected** The moonlit canyon of the approved tile.
- **Observed** The shipped gagazet.png is byte-identical to the approved copy and renders faithfully under the pre-battle scene camera, where the composite is a close match. Under the battle camera the same painting is darkened and desaturated to a flat navy wall: the moon and the lit snow floor are gone, and a backdrop-only patch measures mean luminance 70 against the source painting's 114, so the arena reads as a dark cave.
- **Repro** Capture Chapter 1's pre-battle scene and its battle at 1600x900 and pair both with docs/screenshots/concept-gagazet.png.
- **Evidence** critic/rounds/round-04/targets/presentation-dialogue.jpg (scene camera, faithful); targets/scene-ch1-gagazet.jpg (battle camera, flattened)
- **Confidence** high for Chapter 1, the only scene with the same painting under both cameras
- **Smallest fix** Raise the battle-state exposure or reduce the battle fog and vignette on the Chapter 1 backdrop until the moon and the snow floor survive, checking the HUD still reads. Do not touch the painting.
- **Acceptance check** Re-pair the tile from a battle frame: the moon and the lit snow are present and the backdrop patch's mean luminance is within about 10 percent of the source painting's.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0034

### 48. PR-0036 — The FFX-2 party crowds the left third of the stage while two thirds of it is empty

- **Severity** polish · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 4 · battle staging, 1600x900
- **Requirement** RUBRIC section 6 visual (composition, staging, ground contact).
- **Expected** A composition comparable to the FFX chapters, which stage their party noticeably larger and further apart.
- **Observed** Yuna, Rikku and Paine stand shoulder to shoulder in the left third at small scale with Rikku and Paine overlapping, while the middle and right carry only Bahamut and empty floor, and only one of the three figures shows a ground-contact ring.
- **Repro** Chapter 4, first ATB turn, 1600x900.
- **Evidence** critic/rounds/round-04/evidence/shots/ffx2-bahamut-04-enemy-intent.png, ffx2-bahamut-03-battle-menu.png
- **Confidence** high
- **Smallest fix** Widen the FFX-2 party spacing and raise the figure scale toward the FFX chapters' framing - but this changes something Bailey will see, so it needs an end-state pick before it is built (AGENTS.md rule 9). It is also entangled with PR-0035.
- **Acceptance check** Whatever Bailey picks is recorded against the FFX-2 battle tile and the build matches it, with every staged figure carrying its ground decal.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0036

### 49. PR-0027 — Unrendered markdown reaches the screen: 'the target *she* last picked'

- **Severity** polish · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX for the string; the guard is shared · 2 · enemy-intent panel, IF YOU ATTACK list
- **Requirement** critic/CHECKS.md CHK-007.
- **Expected** Emphasis rendered, or the asterisks removed.
- **Observed** The bullet prints the literal asterisks: 'Her Blind/Silence gate reads the target *she* last picked, not your attacker'. 'gate' is also engine-speak in a sentence otherwise written for players. The research citation on the same string is correctly stripped, so only the emphasis markup leaks.
- **Repro** Chapter 2, first player turn, press E, 1600x900, read the second bullet.
- **Evidence** critic/rounds/round-04/evidence/shots/yunalesca-04-enemy-intent.png; src/battle/ffx/intent.ts:355
- **Confidence** high
- **Smallest fix** Drop the asterisks and reword 'gate' to 'counter'; if emphasis is wanted, let the panel's plain() helper turn a paired asterisk run into a span, and assert no rendered intent line contains an unpaired asterisk.
- **Acceptance check** A visible-text sweep of all five chapters' intent panels finds no asterisk, underscore pair or backtick, and no 'gate' meaning a counter rule.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0027

### 50. PR-0028 — H does not hide the panels it is labelled for during battle

- **Severity** polish · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** both · 1 to 5 · battle, after pressing H, 1600x900
- **Requirement** RUBRIC section 6 interface (pause and prep usability, cleanup); it also blocks CHK-013's scene-tile evidence.
- **Expected** Either H hides every optional panel in battle, or its legend says what it actually hides.
- **Observed** In the capture indexed 'battle + hide-panels (KeyH)', for both games, the strategy guide card, the advisor card, the CTB list and the party rows are all still on screen; only the enemy-information card collapses to a chip. On the PAUSE screen H works fully (0 of 10 rows visible), so the binding is pause-scoped (PauseScreen.ts:641) while its battle legend implies more. It also blocks any unobstructed backdrop capture, which is what the five approved scene tiles ask for.
- **Repro** Any chapter, battle, press H, 1600x900; then Esc and press H on the pause screen and compare.
- **Evidence** critic/rounds/round-04/evidence/shots/ch1-07-hide-panels.png, ffx2-bahamut-04-hide-panels.png, ffx2-vegnagun-shuyin-04-hide-panels.png; gaps/g-ch1-backdrop-panels-off.png
- **Confidence** medium - the observation is certain; whether the narrower scope is intended is not stated anywhere
- **Smallest fix** Either make the battle H hide every optional panel, or rename the legend and the pause row to say what it hides.
- **Acceptance check** Pressing H in battle in both games leaves the painted field with no optional panel over it, or the legend matches the behaviour exactly; and a scene-tile capture becomes obtainable.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0028

### 51. PR-0029 — Yu Pagoda A and B carry no always-on field marker

- **Severity** polish · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX · 3, battle 1 of 7 · battle, first player turn, 1600x900
- **Requirement** critic/CHECKS.md CHK-011 (every targetable enemy has an always-on marker).
- **Expected** The CTB's A and B can be mapped to the painted enemies without opening the picker.
- **Observed** The CTB list correctly shows 'Yu Pagoda B' and 'Yu Pagoda A' with Braska's Final Aeon unlettered - the letter-tag fix works - but the two pagodas on the field are visually identical and carry no letter. PARTIALLY ANSWERED THIS ROUND: the Chapter 3 CTB column does letter the two pagodas A and B and the target chip carries the letter, but there is still no always-on marker on the field itself.
- **Repro** Chapter 3, first player turn, 1600x900: compare the CTB tiles with the field.
- **Evidence** critic/rounds/round-04/evidence/shots/braskas-final-aeon-03-battle-menu.png; crops/ch3-pagodas.png
- **Confidence** high
- **Smallest fix** Draw the same letter chip the CTB uses as a small always-on field marker beneath each lettered enemy.
- **Acceptance check** In any formation with duplicates, each lettered enemy shows its letter on the field without the picker open.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0029

### 52. PR-0041 — FFX-2 items were unreachable through the command menu for 17 and 12 consecutive turns in the review's harness

- **Severity** polish · **category** interface · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 4 and 5 · battle, ITEM submenu
- **Requirement** CHK-015 (a player-facing behaviour is proved with the player's own input) and CHK-020.
- **Expected** The ITEM row opens its submenu and a Potion or Phoenix Down can be used, as it can in FFX.
- **Observed** logs/ffx2-bahamut-run.log records 'revive with a Phoenix Down failed (unreachable); rows=ATTACK|SKILL|CHANGE|ITEM' on every turn from 22 to 38, and ffx2-vegnagun-shuyin-run.log records 'heal with a potion failed (unreachable)' on every turn from 3 to 13. The ITEM row is present in both. In FFX the same harness used Potion, Hi-Potion, X-Potion, Phoenix Down and Eye Drops successfully. The asymmetry is what makes it worth checking rather than dismissing.
- **Repro** Not reproduced by hand. Open Chapter 4's ITEM submenu with real arrow keys and try to use a Phoenix Down.
- **Evidence** critic/rounds/round-04/evidence/logs/ffx2-bahamut-run.log, ffx2-vegnagun-shuyin-run.log, yunalesca-eventlog.json
- **Confidence** low - a harness observation with a plausible harness explanation
- **Smallest fix** None proposed until reproduced by hand. Reproduce with real arrow keys first; if the submenu does open for a human, fix the harness and say so.
- **Acceptance check** A hand or scripted real-key run uses an item from the FFX-2 ITEM submenu in both FFX-2 chapters, or the defect is reproduced and traced.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0041

### 53. PR-0037 — Mid-battle beats hard-code speakers who are not in the active formation

- **Severity** polish · **category** narrative · **status** open · **attempts** 0
- **Game / chapter / state** FFX observed; the same shape exists in the other chapters' midScripts · 1, beat 'first-zombie' · battle, story beat playing
- **Requirement** RUBRIC section 6 narrative (character voice, reachable scenes).
- **Expected** The characters on the field speak.
- **Observed** The 'first-zombie' beat plays Rikku ('Eeew! Yunie, don't heal him!') and Lulu ('He's turned. Cures will kill him now.') in a battle whose active formation is Tidus / Yuna / Kimahri. Rikku's speaker card appears with no Rikku on the field and no Rikku row in the HUD, while Yuna, who is present and is the one being addressed, says nothing.
- **Repro** Chapter 1: play until a party member is Zombied and read the speaker card.
- **Evidence** critic/rounds/round-04/evidence/clips/seymour-flux-enemy-reply-0-07.png; src/story/scripts/seymour-flux.ts:278-281; src/data/ffx/builds/gagazet.ts:424-425
- **Confidence** high
- **Smallest fix** Let a mid-script line declare a preferred speaker plus an authored fallback drawn from the active formation, and prefer the on-field speaker. Needs Bailey's call on whether reserve members may speak mid-battle at all - do not change it on a reviewer's taste.
- **Acceptance check** Every mid-battle beat in all five chapters is spoken by a member of the formation that is actually on the field, or by a deliberately authored off-field voice Bailey approved.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0037

### 54. PR-0039 — 3 of 21 shipped cues have no tempo map, so written rubato cannot bend the pulse

- **Severity** polish · **category** audio · **status** open · **attempts** 0
- **Game / chapter / state** both - scene-gagazet and scene-dreams-end are FFX cues, scene-farplane is FFX-2; the cause is shared renderer plumbing · the pre-battle scenes of chapters 1, 3 and 5 · shipped audio
- **Requirement** docs/audio/THEMES.md.
- **Expected** docs/audio/THEMES.md's renderer request #1: a lyrical cue carries a tempo map so rubato can move the pulse, or it is listed in TEMPO_MAP_EXEMPT with a stated reason.
- **Observed** node tools/audio/themes-audit.mjs scene-gagazet scene-dreams-end scene-farplane --verbose marks all three FAIL, in each case solely on 'no tempo map on a lyrical cue'. Every other check for the three is a note or expected. Predates Build A.1 and is not a regression.
- **Repro** Run the command above in D:/pyrefly-release.
- **Evidence** themes-audit output captured this session; git log 7191674..HEAD -- src/audio tools/audio public/audio confirms these tracks and the tool are unchanged since the round-03 baseline
- **Confidence** high on the technical finding; whether it matters musically is Bailey's ear (CHK-B1)
- **Smallest fix** Implement THEMES.md's requested Track.tempo?: Array<[beat, bpm]> with linear interpolation and give these three a written tempo curve; or, if an arranger judges a static pulse acceptable for one of them, add it to TEMPO_MAP_EXEMPT with a reason as boss-dread and scene-bevelle-underground already are.
- **Acceptance check** themes-audit reports no tempo-map failure across the 21 cues, and Bailey signs off the re-rendered cues in an audition tour.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0039

### 55. PR-0032 — No text size, no key remapping, and no in-game motion or flash accommodation

- **Severity** polish · **category** onboarding · **status** open · **attempts** 0
- **Game / chapter / state** both · all · pause > OPTIONS
- **Requirement** RUBRIC section 6 onboarding (usable settings, text and input access, motion and flash accommodations). Open since round 03.
- **Expected** A player can enlarge the interface text, rebind the keys, and turn motion and flashing down from inside the game.
- **Observed** Unchanged, and this candidate widens it: with ONBOARDING_LIVE = false there is no in-game help at all, on top of the accessibility gaps round 05 recorded. No text size control, no key remapping, no motion or flash accommodation.
- **Repro** Chapter 1, Esc, OPTIONS, read the rows. Source- and bundle-level this round; the rendered panel was not captured.
- **Evidence** src/app/screens/PauseScreenPanels.ts:198-220; src/app/SaveData.ts:63-64,175,182-185; critic/rounds/round-04/evidence/shots/ch1-08-pause-esc.png
- **Confidence** high for what the build contains; the rendered OPTIONS panel is unverified this round
- **Smallest fix** Needs an end state from Bailey before it is built, because it changes a screen he will see (AGENTS.md rule 9). The cheapest step that needs no new decision is to surface the reduceMotion flag the game already reads as a seventh OPTIONS row, since the behaviour behind it already ships.
- **Acceptance check** Open OPTIONS in both games at 1600x900 and 2000x1012, move to the motion row with real arrows and toggle it, and assert from the game's own snapshot that reduceMotion flipped and the transition CSS stops animating on the next screen change.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0032

### 56. PR-0033 — The defeat screen has no approved target and tells the player nothing about why they lost

- **Severity** polish · **category** onboarding · **status** open · **attempts** 0
- **Game / chapter / state** both · all · results screen, Defeat variant
- **Requirement** docs/target/targets.json lists 'Defeat screen' as a gap awaiting a decision; AGENTS.md rule 9.
- **Expected** targets.json's own gap entry: 'the pull to play again comes from the fight itself, so a loss says why in plain words'.
- **Observed** After a loss the screen shows the word Defeat, TURNS, ATTEMPTS, BEST / NEVER CLEARED and RETRY / CHAPTER SELECT; in FFX the right half is empty black (PR-0003). It never names what killed the party, which objective went unmet, or what to try differently - and in this review the party lost eleven times across four chapters with no guidance between attempts.
- **Repro** Lose any chapter and read the screen.
- **Evidence** critic/rounds/round-04/evidence/shots/ch1-16-results.png, ffx2-bahamut-09-results.png
- **Confidence** high
- **Smallest fix** Take the defeat screen through the standing end-state process: two to four options for Bailey before anything is built. Nothing here should be implemented without that pick.
- **Acceptance check** An approved defeat-screen tile exists in targets.json and the build matches it.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0033

### 57. PR-0071 — Two debug-API traps cost this round a day of coverage: battleLog() empties at teardown and autoBattle() silently does nothing before the first menu

- **Severity** polish · **category** delivery · **status** open · **attempts** 0
- **Game / chapter / state** both · all five · the window.__pyrefly debug API documented in docs/DEV.md
- **Requirement** RUBRIC §5 (evidence matches the claim) and CHK-016; docs/DEV.md documents both hooks.
- **Expected** A documented debug hook either does what it says or says it did not.
- **Observed** Two behaviours, both found the hard way and both now root-caused. (1) window.__pyrefly.battleLog() returns an EMPTY array once the battle screen is torn down: sampled after the outcome it reads [] in all five chapters (logAfterBattle 0, screen already 'results'), which is why this round's first capture pass stored "[]" for every chapter and one mandatory check could not be judged until the gap pass re-ran it. Sampled while screen() === 'battle' the same call returns the real stream (max length during the fight: ch1 37, ch2 195, ch3 238, ch4 457, ch5 211). (2) autoBattle('intended') only takes effect once awaitingMenu is already true; called on entry to 'battle' it returns true and does nothing, and a run left that way sat at ticks 0 for 300 s. Both are reviewer-facing, not player-facing.
- **Repro** In the live page console: enter a battle, call __pyrefly.battleLog() during the fight and again after the results card; call __pyrefly.autoBattle('intended') immediately on entering 'battle'.
- **Evidence** critic/rounds/round-07/evidence/gaps/log-ch1/run.json .. log-ch5/run.json (logSamples during the fight; logAfterBattle 0); critic/rounds/round-07/evidence/ch1..ch5/run.json (battleLogFull "[]" from the first pass); critic/rounds/round-07/evidence/guided3/run.json (70,848 characters of log, as the contrast); critic/rounds/round-07/evidence/diag/auto-seymour-flux.json; critic/rounds/round-07/evidence/win1/run.json
- **Confidence** high
- **Smallest fix** Keep the last battle's log readable after teardown (or make battleLog() throw once the battle is gone rather than return an empty array), and make autoBattle() either wait for the first menu or return false when it cannot take over. Then add the sentence to docs/DEV.md. Game case: BOTH — shared debug API.
- **Acceptance check** A capture that calls battleLog() after the results card either gets the fight's events or an error, never a silent empty array; autoBattle() called on entry to a battle drives it or reports that it did not.
- **This round** CAUSE NOW PROVEN, defect unchanged. The gap pass measured it directly: logDuringFight was 48 / 213 / 317 events in chapters 1, 2 and 4 while logAfterTeardown was 0 in each. battleLog() is emptied when the battle screen unmounts. The autoBattle half is unchanged.
- **Carried forward** round-07 PR-0071

### 58. PR-0044 — 16 of 51 manifest subjects carry no facing, so CHK-014's numeric cross-check cannot run for them

- **Severity** suggestion · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** both (15 of the 16 are FFX-2 dresspheres) · n/a · public/art/manifest.json
- **Requirement** critic/CHECKS.md CHK-014.
- **Expected** Every subject declares its facing so the sign assertion can run per chapter formation.
- **Observed** paine-black-mage, paine-gunner, paine-samurai, paine-white-mage, rikku-alchemist, rikku-berserker, rikku-black-mage, rikku-gunner, rikku-thief, rikku-white-mage, yuna-black-mage, yuna-dark-knight, yuna-gunner, yuna-songstress, yuna-warrior and seymour-flux have no facing field. No wrong-facing plate was found on screen, so this is a coverage gap rather than an observed defect - but a mirrored dressphere could ship unnoticed, and yuna-gunner is itself an approved cast tile.
- **Repro** Read D:/pyrefly-release/public/art/manifest.json.
- **Evidence** D:/pyrefly-release/public/art/manifest.json
- **Confidence** high
- **Smallest fix** Populate facing for the sixteen subjects from their idle plates, then add tests/unit/actor-facing.test.ts with the sign assertion per chapter formation.
- **Acceptance check** Every manifest subject carries a facing and the per-formation sign assertion runs green.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0044

### 59. PR-0072 — Vegnagun has no ground contact and Paine stands inside its cannon barrel

- **Severity** suggestion · **category** visual · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · 5 (Vegnagun and Shuyin) · battle, first command frame, 1600x900
- **Requirement** CHK-014 (contact fits the shot); RUBRIC §6 visual (ground contact).
- **Expected** The boss is planted on the Farplane floor with the same contact treatment the party actors get, and clearly behind the party in depth.
- **Observed** Two of the three things reported during this round hold and one does not. Vegnagun's underside ends in a hard edge above the plain with no cast shadow or contact pool, while all three girls sit on visible contact rings; and Paine's billboard intersects the green cannon barrel so she reads as embedded in the machine rather than standing in front of it. The third claim, that Vegnagun is undersized and reads as a prop, is NOT supported by the capture: it dominates the frame horizontally and stands well above the party. Filed as a suggestion rather than a defect because the approved tile does not settle the depth staging and Bailey has not reacted to this frame.
- **Repro** Chapter V from the board with real keys, Enter through the scene, capture the first command menu at 1600x900.
- **Evidence** critic/rounds/round-07/evidence/ch5/04-first-menu.png; critic/rounds/round-07/targets/fight-targeting-s3.jpg
- **Confidence** high for the ground contact and the overlap; the scale claim is refuted
- **Smallest fix** Give Vegnagun the contact shadow the party actors already have and push its station back in depth so no party billboard intersects it. Game case: FFX-2 only for this staging.
- **Acceptance check** At 1600x900 a contact shadow is visible beneath Vegnagun and no party billboard intersects it, on the first command frame and at target selection.
- **Carried forward** round-07 PR-0072

### 60. PR-0053 — A data divergence in the Berserk change set was raised by the combat auditor and its record did not reach consolidation

- **Severity** polish · **category** combat · **status** open · **attempts** 0
- **Game / chapter / state** FFX-2 · ffx2-vegnagun-shuyin · not consolidated
- **Requirement** RUBRIC §8: every finding carries expected versus observed, repro, evidence and a fix. This one does not, and is recorded as a tracked gap rather than written up from guesswork.
- **Expected** Every issue the round raised reaches the report with its full record.
- **Observed** The combat auditor's category evidence names "the polish-level data divergence PR-0053" beside PR-0052 and PR-0054, but the detailed record did not survive consolidation and nothing in critic/rounds/round-06/bench/ or its output restates it. The changed values that WERE re-audited all match their sources: BERSERK_MULTIPLIER 1.25 (correctly not FFX's 1.5), leg-berserk chance 75, duration 133 ticks = 211,470 = 70.49 s against §2.8's stated 70.5 s, and hasAttack === false for exactly black-mage, songstress and white-mage. So whatever the divergence is, it is not among those.
- **Repro** n/a — the record is missing, not the behaviour.
- **Evidence** critic/rounds/round-06/bench/out/z06-all.txt; the combat-encounter auditor's category evidence in this report
- **Confidence** UNVERIFIED as a product defect. The ID is reserved and open so it is not silently lost; recover the record from the combat auditor's evidence before any repair, and close it as withdrawn if it cannot be restated.
- **Smallest fix** Recover or re-derive the record before the next batch; do not repair anything on this entry alone.
- **Acceptance check** The issue is either restated with expected, observed, repro and evidence, or closed as withdrawn.
- **This round** NOT RE-TESTED this round; carries.
- **Carried forward** round-07 PR-0053

### 61. PR-0026 — Developer vocabulary on screen: 'Haste is ctb x 8/16'

- **Severity** polish · **category** interface · **status** open · **attempts** 1
- **Game / chapter / state** FFX (the string); sweep the other four guides · 1 · strategy guide NEXT blurb, any size
- **Requirement** critic/CHECKS.md CHK-007. Same class as the section marks and row numbers Bailey reported on 2026-09-18.
- **Expected** A sentence a player who has never opened the repo understands.
- **Observed** The guide prints 'Haste is ctb x 8/16 - roughly double the party's share of the clock, and the CTB margin the Holy Water rhythm needs to beat the mount's Full-Life'. The tick notation is the first thing in the sentence and the literal is in the shipped bundle.
- **Repro** Chapter 1, first player turn, guide showing, any size: read the NEXT blurb.
- **Evidence** critic/rounds/round-04/evidence/shots/seymour-flux-legibility-2000x1012.png; src/data/guides/seymour-flux.ts:58; the string is present in dist-gate/assets/index-TzQM1lX4.js
- **Confidence** high
- **Smallest fix** Reword the opening clause in plain English ('Haste halves the time between his turns') and keep the tick arithmetic in the tactics file's own comment; sweep the other four guide files for the same class.
- **Acceptance check** A visible-text sweep over all five chapters' guide panels finds no 'ctb', no bare multiplier, no section mark and no file stem.
- **Carried forward** round-05.json @ 740ab21; round-07 PR-0026

### 62. PR-0083 — Four source files were pushed further past the 400-line house limit by this batch

- **Severity** polish · **category** process · **status** open · **attempts** 0
- **Game / chapter / state** both · n/a (house style) · source tree at 1b33971
- **Requirement** AGENTS.md hard rule 7 and docs/DEV.md "House rules": every source file under 400 lines.
- **Expected** A batch that touches a long file leaves it shorter, or splits it.
- **Observed** Reported by the combat auditor from the candidate's own diff: four files already over the limit grew further in this batch. No player effect; it is the kind of drift that makes the next engine change more expensive and it is named here so it is not rediscovered as a surprise.
- **Repro** node tools/orphans.mjs is unrelated; count lines over src/battle and src/engine at 1b33971.
- **Evidence** combat auditor, round 08 (the four files are named in the diff at 1b33971)
- **Confidence** medium — reported, not re-counted by the chief critic
- **Smallest fix** Split the four at the next change that touches them, rather than as a separate refactor.
- **Acceptance check** No file the next batch touches is over 400 lines when the batch lands.

### 63. PR-0084 — Entering a battle takes 7.7 seconds from the chapter card on the live build, against the five-second loading goal

- **Severity** polish · **category** delivery · **status** open · **attempts** 0
- **Game / chapter / state** both · seymour-flux (measured) · chapter select to the battle screen, live build, warm cache, GPU
- **Requirement** RUBRIC section 2 platform goals: 60 fps at 1600x900 and a load under five seconds, measured on named hardware.
- **Expected** A player reaches the fight inside the stated budget.
- **Observed** timeToBattleMs 7,738 on the live build at 1600x900, on an RTX 5070 Ti through ANGLE/D3D11, warm profile. Frame pacing in the same session is healthy — 59.67 fps at the title, 59.50 at chapter select, 59.63 in a chapter 1 battle, p99 16.8 ms, one frame over 50 ms in each six-second window — so this is loading and sequencing, not rendering. Overlaps PR-0061 at the battle-entry end; recorded separately because the five-second number is a stated platform goal rather than a feel judgement.
- **Repro** critic/rounds/round-08/verify.mjs against the live URL with PYREFLY_BROWSER=gpu.
- **Evidence** critic/rounds/round-08/evidence/verify-and-perf.json
- **Confidence** high — one named machine, one measurement; not repeated on a cold cache or another machine
- **Smallest fix** Measure the split between asset fetch, scene build and the battle-entry beat (PR-0061 needs the same instrumentation), then move whatever is not needed for the first frame behind it.
- **Acceptance check** Chapter card to the first interactive command menu is under five seconds on the named hardware, cold and warm, in all five chapters.

## What stands between this build and acceptance

Acceptance needs a weighted 9.60 unrounded with every category at least 9.0, no unverified category and no unverified mandatory check, no open critical or major defect, every included encounter through its real flow, every required target matched, the required human judgments recorded, and the exact deployment verified live. One of those eight holds: the exact deployment is verified live, cleanly, 863 files byte for byte.

The distance, in the order it has to be closed:

1. **Forty open majors.** Eight are this round’s own (PR-0075 to PR-0082); FOC-05 and FOC-06 came from the pre-deploy focused review and were re-checked on live here. Thirty are carried, and eleven of those have survived four or five consecutive reviews. RUBRIC section 8 says what that means: the next batch in each stalled area owes a written method check, not another similar attempt.
2. **Two regressions from the change this release is built around.** PR-0076 and PR-0080 are the only things holding the ship verdict, and together they are one decision rather than one repair: what should Active ATB cost chapter 5? The options are measured and the lever is named.
3. **A category nobody but Bailey can score.** Audio has been UNVERIFIED for three rounds because agents cannot hear and no audition is on file, while Bailey’s own complaint about the music stands unanswered in this build. Until it is scored the total is provisional whatever the other nine do.
4. **Seventeen of thirty required targets not matched** — seven failing, ten unverified. Two of the ten are unverified only because a capture was mislabelled, which is a harness fix and not a build fix.
5. **Four of five chapters never won by a player’s own commands** (PR-0082). The aftermath and the rewards are now proved for all five; the win itself for one.
6. **Three human judgments not recorded** — the audio, the Active trade in chapter 5, and the group of four (KO treatment, phone layout, defeat screen, chapter 1 difficulty) that have no approved target at all.

## What changed since round 07

Round 07 was the deep review of 8f48237. This is the deep review of 1b33971, which carries its own obligation plus the two inherited from fd0ae96 and 8f48237. Rounds 02 and 03 were scored under rubric v1; their A/B/C numbers are history under another rubric and nothing here is compared with them.

**Closed since round 07, each with this round’s own evidence:** PR-0052 (a Berserked girl on a dressphere with no Attack spending her turn on nothing), PR-0068 (the FFX-2 HUD claiming ACTIVE over a frozen clock — the clock now demonstrably runs on the live artifact), PR-0064 (the title’s missing gold rim), PR-0043 (no chapter had ever been won by real input — chapter 4 now has been, end to end). FOC-01 to FOC-04 from the pre-deploy focused review are fixed and re-measured with real input.

**Newly opened:** PR-0075 (FFX-2 heals and items roll the enemy hit check against an ally’s own Evasion, and the item is spent anyway), PR-0076 (chapter 5’s intended line unwinnable at human decision speed under Active), PR-0077 (84 live 404s and three broken images on the new pause Chapter tab), PR-0078 (every victory results screen shows one eye), PR-0079 (pause chrome across Kimahri’s face, against a named mustRemain), PR-0080 (the command menu changing owner in place with no keypress), PR-0081 (chapter 5 measured at 6:11 of fight), PR-0082 (three chapters still never won by real input), PR-0083 and PR-0084.

**Category movement**, on the nine scored in both rounds: combat 8.8 → 8.9, encounter 8.9 → 8.6, visual 7.8 → 7.7, feel 8.0 → 7.8, narrative 7.6 → 7.6, interface 7.3 → 7.6, onboarding 4.6 → 6.4, prep 8.2 → 8.4, delivery 8.9 → 8.2; audio UNVERIFIED → UNVERIFIED. The two large moves are honest and opposite: onboarding rose 1.8 because the briefing Bailey approved is switched on and reachable for the first time, and delivery fell 0.7 because the build throws 404s on a screen every player opens.

**What this round proved that no previous round could.** Active ATB running on the live artifact, read from the game’s own event stream rather than asserted by a chip. Three chapters reaching victory, aftermath and results for the first time in any round. One chapter won end to end by real input. Populated battle logs taken before teardown in four chapters, which closes round 07’s PR-0071 blind spot for CHK-023. Named-hardware frame times, which closes the performance-evidence gap the brief named. And 115 of 115 approved art files intact.

## Proposals (nothing here is built without Bailey’s yes)

_Unscored. Idea, benefit, cost, source-game fit and risk._

- P-08-1. Let a chain-locked girl keep her queued command. The measured lever for PR-0076: 75 % of the 948 invalidated menus at D=1500 are section 1.7 chain locks, so re-offering the menu with the command pre-selected (or holding the choice and firing it when the lock lifts) is the smallest change that could restore chapter 5's intended line without touching Vegnagun. Benefit: the Active mode Bailey chose stays, and the chapter stays winnable on its canonical clear. Cost: one change in the pump plus a re-run of the three D-arms. Source fit: FFX-2 only; section 1.7 is the sourced rule being respected, not bent. Risk: it changes the feel of the pressure Active is for, so Bailey should see the before-and-after numbers (40/40 at D=0 unchanged, D=1500 from 0/40 to a majority) before it is built. Preview: docs/handoff/ffx2-active-atb.md section 7 already tabulates the options.
- P-08-2. A one-line fix first, then an automated guard. PR-0077 is one wrong URL builder producing 84 live 404s; the fix is src/app/screens/pause/markup.ts:130. The guard worth adding beside it is the one CHK-018 describes: a test that walks every artUrl() call site and asserts every shipped path resolves in the built bundle. Benefit: this class of defect stops reaching live. Cost: small. Risk: none. Note the confirmer's correction — heroArtFallback must NOT be prefixed, or the chapter panel breaks in all five chapters.
- P-08-3. Instrument the battle-entry beat once and answer three issues with it. PR-0061 (6.8 to 8.1 s unaccounted before the first menu), PR-0084 (7.7 s chapter card to battle) and PR-0081 (5.15 s per action in chapter 5) are all "where does the time go" questions and one timing pass over the presenter answers all three. Benefit: the single most-felt complaint in the collection gets a cause instead of an estimate. Cost: a measurement pass, no product change until the numbers are in. Source fit: BOTH.
- P-08-4. Give the phone its own target before anything else is built for it. PR-0001, PR-0017, PR-0057, PR-0066 and PR-0067 are all one missing decision: there is no approved phone layout, and targets.json's waiting list says so. Under hard rule 9 the next step is 2 to 4 options of the end state at 390x844, not more measurement. Until then the release manifest should stop claiming 390x844 as a supported platform. Benefit: five carried majors stop being re-measured every round. Cost: one options round.
- P-08-5. A written method check before the next chapter 1 attempt. PR-0007 and PR-0008 are now open at the same severity in five consecutive reviews and are STALLED under RUBRIC section 8. The next batch in that area owes the method check, not a third tactic revision: the current route and why it stalled, up to two alternatives, and the smallest test that separates them. This round's evidence points it at the Zombie pairing (37 of 37 re-kills give the victim zero turns) rather than at the tactic ladder, and the cheapest honest step is on the information side — the FFX intent panel never names Lance of Atrophy's guaranteed Zombie (PR-0011), so the player cannot see the two-step coming.
- P-08-6. Close the audio question by asking it. Three consecutive rounds have scored nine categories and left the tenth blank, and Bailey's own complaint about the music is unanswered. One audition of the live build at docs/audio/audition.html with a number out of ten would let the audio category be scored at all. It is the single cheapest thing on this list and the only one an agent cannot do.

---

_Round 08 · deep · 2026-09-22 · 165 minutes · this review changed no product code, started no gameplay or art work, and committed, pushed and deployed nothing. Scratch files live under `critic/rounds/round-08/`._
