Build / artifact / target version: 5860a134 (release 17 candidate, D:/pyrefly-rel17, bundle index-Bz-OGER1.js from dist-gate) / live comparison fc7f1a20 (release 16, D:/pyrefly-rel16/dist-gate, index-BQnfWT0X.js) / targets.json sha256 3d2822fe...bc00
Review: focused
Deployment: NOT APPLICABLE (live verification is a separate obligation after the deploy)
Changed area: FAIL (two majors inside the new features: FOC17-01 and FOC17-02; CHK-021 fails on FOC17-01)
Ship: SHIP. No critical defect, no regression against fc7f1a20, and the batch repairs five live defects (PHB-01, PHB-02, PHB-03, FOC16-01, FOC16-02). Disclosed majors: FOC17-01 (the FFX-2 results wedge shows the speaker's FFX portrait, e.g. FFX Rikku at Chateau Leblanc), FOC17-02 (the phone target step names the highlighted row, "POTION -> ALL ALLIES", while it sends the tapped Mega-Potion)
Milestone: not assessed
Quality: not scored (focused pass); the last full score is round 03 on 7191674, 2026-09-19, rubric v1 history
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (phone HUD B target frame matched in layout; the Trema plate B decision now clears the face)
Top issues: FOC17-01 major (wrong-game portrait in the FFX-2 results wedge, new with VL-1), FOC17-02 major (phone target step mislabels the tapped item, new with the ALL confirm), FOC17-03 polish (A1 menu reset has no visible cue), FOC17-04 polish (FFX "x3 PARTY" AP label, same on live), FOC17-05 question for Bailey (Wait-split rule only in V and VI)
Coverage: tested Chapters I, IV, V, VI, IX, XIII with real keys on the production build, Chapter I and V also on the live build; wins to results and chapter select, a defeat to RETRY to a win; A1 traced through the presenter; the guide rule's presence and absence; phone 390x844 text, framing and touch confirm; tsc and the 21 changed unit test files. Reused: the builder's data tests for the Chapter I guide corrections. Not tested: Chapter IX callouts in play, the FFX phone half, Chapters II, III, VIII, audio, load and frame times, real devices
Next required review and why: live verification of 5860a134 after the deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepAfterDeploy true)
Elapsed review time / repeated work avoided: about 70 minutes (over the 15-minute budget: the A1 rule is invisible in the DOM at the top level and needed an engine trace, and the phone touch probe needed three harness passes) / Chapter XIII and phone HUD B harness patterns reused from the fc7f1a20 pass

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel17: depth **deep**, `deepBeforeDeploy: false` (no save-data class, no milestone claim), `focusedBeforeDeploy: true`, `deepAfterDeploy: true`; games both; systems: both engines, shared combat core, presenter, asset loader, global layout / input, both HUDs, screens, strategy guide, advisor, cutscene scripts; checks CHK-002..010, 012, 013, 015..023; targetGroups cast, fight, pause, phone, presentation, scenes; dataAudit false; approvedArtCheck false. Under the 2026-09-21 rule this focused pass runs before the deploy and the deep review follows on the live build.

## Candidate and environment

- `D:/pyrefly-rel17/dist-gate` already existed, built at 14:52 from the clean tree at 5860a134 (bundle `index-Bz-OGER1.js`); `public/art` in that tree is a junction to the main tree's art.
- Served with `vite preview --outDir dist-gate` on 127.0.0.1:5420; the live build fc7f1a20 from D:/pyrefly-rel16/dist-gate on 127.0.0.1:5421.
- Headless Playwright Chromium, `PYREFLY_BROWSER=gpu`; no black canvas, no fallback. One browser at a time; no OS input, no browser pane.
- Both servers stopped by their own listening PIDs (45712 on 5420, 46160 on 5421, `taskkill /PID /T /F`); both ports confirmed closed.
- `npx tsc --noEmit` clean in D:/pyrefly-rel17; the 21 unit test files changed since fc7f1a20: 205 passed, 7 skipped.

## Game case (CHK-021)

- **Fresh first-attempt seed: both (shared plumbing).** Live Chapter I from the title: seed 1; candidate: 1611190343, and fresh seeds in every FFX-2 run too.
- **A1, an enemy hit closes an open menu: FFX-2 only** (research/ffx2-combat-core.md 1.1 and 1.5, single source; the delay A2 is not built). Code only in `src/battle/ffx2`.
- **Wait-split guide rule: FFX-2 only, Chapters V and VI.** Present as the first RULES bullet in V and VI (reached with the MORE toggle by mouse), absent from Chapter I (FFX) and Chapter IV.
- **Victory lines and VL-1 speaker in the wedge: both.** FFX Chapter I: Tidus, "...Okay. Next one." (writing-bible 5.4), Tidus stands in the wedge. FFX-2 Chapter IV: no line, as the bible wants. FFX-2 Chapter VI: Rikku, "Gullwings one, Syndicate nothing!", but the wedge shows **portraits/rikku.png, the FFX Rikku** (FOC17-01). The ledger faces on the same screen use the -x2 portraits.
- **Chapter IX callouts and the placeholder fix: FFX;** the art-index fix itself is both. Chapter IX: 11 figures, 0 placeholders.
- **Chapter XIII polish, FFX-2 poses: FFX-2 only.**
- **Phone HUD repair: both;** only the FFX-2 half was played (CHK-020 UNVERIFIED).

## What was played

1. Chapter I, candidate and live, 1600x900: title, chapter select, prep, scene, battle by Enter; at each menu the enemies were set to 1 HP (debug setup, labelled), then a real-key Attack; post scene, results. The same victory line on both builds. Only Tidus earned AP although the row says "x3 PARTY" (FOC17-04, same on live).
2. Chapter IV at 2000x1012: win to results. No line (correct); the wedge shows FFX Yuna (pre-existing, live does the same).
3. Chapter V A1: top-level menu left open. Enemy hits on other girls left Paine's menu alone; when Vegnagun hit Paine the engine flagged `hitClosed = paine` and the presenter offered a fresh menu about 1.3 s later (trace in `5860a134-focused/a1-hit-closes-menu-trace.txt`). With a submenu open the clock held (25 s, no enemy action), as the Wait split says. At the top level the reset cannot be seen (FOC17-03).
4. Chapter VI twice from a fresh save: a defeat, RETRY by Enter, then a win; the rotated speaker Rikku stands in the wedge in her FFX portrait (FOC17-01); Enter returned to chapter select.
5. Guide at 1600x900 in V, VI, I, IV: MORE clicked with the mouse until the rule showed.
6. Chapter IX first menu: every figure painted.
7. Chapter XIII: Enter on ATTACK; the reticle around Paragon stays clear of the enemy-move slab. Esc, Esc to pause, E three times to CHAPTER: "BATTLE 1 OF 2", full DRESSPHERE labels, the columns end left of Trema's face; Esc resumed.
8. Phone 390x844 with touch, Chapter V: no battle text below 14 px (effective size); the acting girl on screen; ITEM, MEGA-POTION, then the new confirm sent `x2-mega-potion` to all three. The card and the confirm say "Potion" (FOC17-02). On live the same taps reach an ALL ALLIES target with no confirm button, and the footer already reads Potion's help.

0 console errors and 0 HTTP errors in every kept run on both builds.

## Target comparisons

- `phone-battle-hud-B-ffx2-target.jpg`: frame B-ffx2-target against the Chapter V ALL-target step. The layout matches: rail and pause, enemy line, chips, card, hint, BACK plus confirm. The label names the wrong item (FOC17-02).
- Trema hero plate B (pause, FFX-2): the dossier now clears the face; FOC16-02 repaired.

## Checks

| Check | Result | Note |
|---|---|---|
| CHK-016 (mandatory) | PASS | every capture asserted its screen; a wrong-chapter run was caught and redone |
| CHK-017 (mandatory) | NOT APPLICABLE | focused candidate review |
| CHK-021 (mandatory) | FAIL | presence and absence right for seed, A1 and the guide rule; FOC17-01 puts FFX art in FFX-2 |
| CHK-015 | PASS | real keys, mouse and touch; HP-1 setup labelled |
| CHK-022 | PASS | win -> scene -> results -> chapter select; defeat -> RETRY -> battle |
| CHK-023 | PASS | A1 observed through the real presenter |
| CHK-003 | PASS | phone battle text all >= 14 px (one state, FFX-2) |
| CHK-008 | PASS | Chapter XIII reticle vs slab, pause vs face |
| CHK-009 | PASS | DRESSPHERE in full |
| CHK-010 | PASS | ALL-target brackets and hint |
| CHK-012 | PASS | Chapter IX, 0 placeholders |
| CHK-007 | PASS | new copy has no developer vocabulary |
| CHK-002, 004, 005, 006, 013, 018, 019, 020 | UNVERIFIED | not exercised in this pass (reasons in the JSON) |

## Issues

- **FOC17-01 (major; introducedByCandidate true, regressionVsLive false, inNewFeature true).** In FFX-2 the results wedge uses the FFX portrait. VL-1 puts the line's speaker in the wedge, so a Chapter VI win with Rikku speaking shows FFX Rikku. Suspected cause: `victoryHeroHtml` asks for `portraits/<id>.png` without the -x2 ladder the ledger rows use. Fix: route the wedge through the same game-aware ladder. Acceptance: FFX-2 wins in IV, V and VI show -x2 portraits (or paine.png).
- **FOC17-02 (major; introducedByCandidate true, regressionVsLive false, inNewFeature true).** The phone target step prints the highlighted row's name, not the tapped item's: "POTION -> ALL ALLIES" confirms a Mega-Potion. Suspected cause: a tapped row sends its command without moving the cursor. Fix: move the cursor to the tapped row, or label from the pending command. Acceptance: in both games, tap an ALL command that is not under the cursor; the card, the confirm and the sent command agree.
- **FOC17-03 (polish).** The A1 reset has no visible cue at the top level.
- **FOC17-04 (polish, pre-existing).** FFX results say "x3 PARTY" beside AP that only the actors earn.
- **FOC17-05 (question for Bailey).** Chapters IV and XIII run the same Wait split but their guides do not carry the rule. The decision named only V and VI; build nothing without a yes.

## Ship decision

Computed with `shipVerdict` (tools/critic-policy.mjs) on the tags above: SHIP, nothing blocking. The two majors go into the release announcement and the next batch. `validateReport` returns no errors.
